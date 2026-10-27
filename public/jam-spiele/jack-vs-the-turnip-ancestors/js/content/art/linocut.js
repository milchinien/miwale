/* Native art for the new enemies / upgrades in the 'linocut' world (Holzschnitt) – see js/content/ART_API.md.
   Same ink language as js/styles/linocut.js: cream paper, carbon-black key plate carved with gouge marks, ONE
   misregistered pumpkin-orange spot plate and the sparing teal second spot (here: the toxic turnip juice).
   No gradients, no glow – tone only through carving. Sprites are cut lazily per (facing, frame, variant). */
(function () {
  'use strict';
  const U = window.U, Cn = window.Content;
  if (!U || !Cn) return;
  const TAU = Math.PI * 2;

  /* ================================ palette (from the style) ================================ */
  const PAPER = [240, 231, 210];
  const INK = [27, 23, 21];
  const P0 = 'rgb(240,231,210)', I0 = 'rgb(27,23,21)', O0 = 'rgb(234,104,32)', T0 = 'rgb(46,118,116)';
  let cP = P0, cI = I0, cO = O0, cT = T0;
  /** negative print: paper <-> ink, spot colours print black (hit flash, armed bomb) */
  function negative(on) { if (on) { cP = I0; cI = P0; cO = I0; cT = I0; } else { cP = P0; cI = I0; cO = O0; cT = T0; } }
  const MX = 0.8, MY = 0.55;
  const TX = -0.55, TY = 0.45;
  let K = 2.5;
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const R = (a, b, rng) => a + (b - a) * rng.next();

  /* ================================ carving toolkit (copied) ================================ */
  function lens(ctx, x0, y0, x1, y1, w, bend) {
    bend = bend || 0;
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1e-6;
    const nx = -dy / L, ny = dx / L;
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const u = 2 * (bend + w), l = 2 * (bend - w);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(mx + nx * u, my + ny * u, x1, y1);
    ctx.quadraticCurveTo(mx + nx * l, my + ny * l, x0, y0);
    ctx.fill();
  }
  function taper(ctx, x0, y0, x1, y1, w, bend) {
    bend = bend || 0;
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1e-6;
    const nx = -dy / L, ny = dx / L;
    const mx = (x0 + x1) / 2 + nx * bend * 2, my = (y0 + y1) / 2 + ny * bend * 2;
    const th = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(x0 + nx * w, y0 + ny * w);
    ctx.quadraticCurveTo(mx + nx * w * 0.6, my + ny * w * 0.6, x1, y1);
    ctx.quadraticCurveTo(mx - nx * w * 0.6, my - ny * w * 0.6, x0 - nx * w, y0 - ny * w);
    ctx.arc(x0, y0, w, th - Math.PI / 2, th + Math.PI / 2, true);
    ctx.closePath();
    ctx.fill();
  }
  function spline(pts, sub) {
    const out = [];
    const n = pts.length;
    for (let i = 0; i < n - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
      for (let s = 0; s < sub; s++) {
        const t = s / sub, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
        ]);
      }
    }
    out.push(pts[n - 1]);
    return out;
  }
  function limb(ctx, pts, w0, w1) {
    const P = spline(pts, 5);
    const n = P.length, Lf = [], Rt = [];
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const l = Math.hypot(tx, ty) || 1e-6;
      tx /= l; ty /= l;
      const w = w0 + (w1 - w0) * (i / (n - 1));
      Lf.push([P[i][0] - ty * w, P[i][1] + tx * w]);
      Rt.push([P[i][0] + ty * w, P[i][1] - tx * w]);
    }
    ctx.beginPath();
    ctx.moveTo(Lf[0][0], Lf[0][1]);
    for (let i = 1; i < n; i++) ctx.lineTo(Lf[i][0], Lf[i][1]);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(Rt[i][0], Rt[i][1]);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath(); ctx.arc(P[0][0], P[0][1], w0, 0, TAU); ctx.fill();
    if (w1 > 0.12) { ctx.beginPath(); ctx.arc(P[n - 1][0], P[n - 1][1], w1, 0, TAU); ctx.fill(); }
  }
  function smoothPath(ctx, pts) {
    const n = pts.length;
    ctx.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2);
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n];
      ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    }
    ctx.closePath();
  }
  function polyPath(ctx, pts) {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  }
  function fillPath(ctx, fn, color) { ctx.beginPath(); fn(ctx); ctx.fillStyle = color; ctx.fill(); }
  function strokePath(ctx, fn, color, lw) { ctx.beginPath(); fn(ctx); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.stroke(); }
  function clipDo(ctx, fn, body) { ctx.save(); ctx.beginPath(); fn(ctx); ctx.clip(); body(); ctx.restore(); }
  function crescent(ctx, fn, cx, cy, dx, dy, s, color) {
    ctx.save();
    ctx.beginPath(); fn(ctx); ctx.clip();
    ctx.beginPath(); fn(ctx);
    ctx.save(); ctx.translate(cx + dx, cy + dy); ctx.scale(s, s); ctx.translate(-cx, -cy); fn(ctx); ctx.restore();
    ctx.fillStyle = color || cI;
    ctx.fill('evenodd');
    ctx.restore();
  }
  function holeSpot(ctx, fn, color, dx, dy) {
    fillPath(ctx, fn, cP);
    ctx.save();
    ctx.beginPath(); fn(ctx); ctx.clip();
    ctx.translate(dx, dy);
    fillPath(ctx, fn, color);
    ctx.restore();
  }
  /** spot plate print of a shape: paper underneath, colour plate shifted (misregistered), clipped to the shape */
  function plate(ctx, fn, color, dx, dy) {
    fillPath(ctx, fn, cP);
    ctx.save(); ctx.translate(dx, dy); clipDo(ctx, fn, () => fillPath(ctx, fn, color)); ctx.restore();
  }
  function arcLens(ctx, cx, cy, rr, a0, a1, w, out) {
    const x0 = cx + Math.cos(a0) * rr, y0 = cy + Math.sin(a0) * rr;
    const x1 = cx + Math.cos(a1) * rr, y1 = cy + Math.sin(a1) * rr;
    const mx = (x0 + x1) / 2 - cx, my = (y0 + y1) / 2 - cy;
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1e-6;
    const nx = -dy / L, ny = dx / L;
    const sag = rr - Math.hypot(mx, my);
    const sign = nx * mx + ny * my > 0 ? 1 : -1;
    lens(ctx, x0, y0, x1, y1, w, sign * sag * (out || 1));
  }
  function star(ctx, x, y, n, r0, r1, rot) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const a = rot + (i / (n * 2)) * TAU - Math.PI / 2;
      const r = i & 1 ? r1 : r0;
      if (i === 0) ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      else ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.closePath();
  }
  function leaf(ctx, x0, y0, x1, y1, w, bend, rib) {
    ctx.fillStyle = cI;
    lens(ctx, x0, y0, x1, y1, w, bend);
    if (rib !== false) {
      ctx.fillStyle = cP;
      const ex = x0 + (x1 - x0) * 0.78, ey = y0 + (y1 - y0) * 0.78;
      lens(ctx, x0 + (x1 - x0) * 0.12, y0 + (y1 - y0) * 0.12, ex, ey, Math.max(0.14, w * 0.14), bend * 0.6);
      ctx.fillStyle = cI;
    }
  }
  function drawRays(ctx, n, r0, r1, r2, color, w) {
    ctx.fillStyle = color;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU;
      const r = k & 1 ? r2 : r1;
      const da = (TAU / n) * (w || 0.28);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a - da) * r0, Math.sin(a - da) * r0);
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.lineTo(Math.cos(a + da) * r0, Math.sin(a + da) * r0);
      ctx.closePath();
      ctx.fill();
    }
  }
  function drawShadowArt(ctx, rx, ry) {
    const n = Math.max(3, Math.round(ry / 0.75));
    ctx.fillStyle = cI;
    for (let k = 0; k < n; k++) {
      const t = ((k + 0.5) / n) * 2 - 1;
      const y = t * ry;
      const hw = rx * Math.sqrt(1 - t * t) * 1.02;
      lens(ctx, -hw + rx * 0.12, y, hw + rx * 0.12, y, 0.33 + (1 - Math.abs(t)) * 0.12);
    }
  }
  function drawSplatArt(ctx, rng, r) {
    ctx.fillStyle = cI;
    const pts = [];
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * TAU + R(-0.1, 0.1, rng);
      const rr = r * (k & 1 ? R(0.55, 0.75, rng) : R(0.85, 1.1, rng));
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.55]);
    }
    fillPath(ctx, (c) => smoothPath(c, pts), cI);
    for (let k = 0; k < 9; k++) {
      const a = R(0, TAU, rng), d = r * R(1.1, 1.9, rng);
      const x = Math.cos(a) * d, y = Math.sin(a) * d * 0.55;
      if (rng.next() < 0.5) taper(ctx, Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.33, x, y, R(0.3, 0.6, rng));
      ctx.beginPath(); ctx.arc(x, y, R(0.25, 0.8, rng), 0, TAU); ctx.fill();
    }
    ctx.fillStyle = cP;
    for (let k = 0; k < 3; k++) lens(ctx, R(-r * 0.5, r * 0.2, rng), R(-r * 0.25, 0, rng), R(-r * 0.2, r * 0.5, rng), R(-r * 0.2, r * 0.15, rng), R(0.14, 0.26, rng));
  }

  /* ================================ sprite pipeline (copied) ================================ */
  /* Ink voids as a paper-speckle canvas (built once with putImageData). Sprites are inked and inverted with
     compositing only – no getImageData at runtime, which would stall the render pipeline when cut lazily. */
  let VOIDC = null;
  function buildVoid() {
    const { c, ctx } = U.canvas(256, 256);
    const im = ctx.createImageData(256, 256), d = im.data;
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const v = 0.5 * U.hash2(x, y, 5) + 0.5 * U.fbmTile(x / 8, y / 8, 32, 77, 2);
      const vv = U.clamp(Math.round(v * 300 - 40), 0, 255);
      if (vv > 238) { const i = (y * 256 + x) * 4; d[i] = PAPER[0]; d[i + 1] = PAPER[1]; d[i + 2] = PAPER[2]; d[i + 3] = 184; }
    }
    ctx.putImageData(im, 0, 0);
    VOIDC = c;
  }
  function mk(x0, y0, x1, y1, draw, opt) {
    opt = opt || {};
    const pad = opt.pad === undefined ? 1.6 : opt.pad;
    const ax = Math.round((pad - x0) * K), ay = Math.round((pad - y0) * K);
    const w = Math.ceil((x1 - x0 + pad * 2) * K), h = Math.ceil((y1 - y0 + pad * 2) * K);
    const { c, ctx } = U.canvas(w, h);
    ctx.setTransform(K, 0, 0, K, ax, ay);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = cI;
    ctx.strokeStyle = cI;
    draw(ctx);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (opt.halo) halo(c, opt.halo * K);
    if (opt.ink !== false) inkify(c, opt.seed || 7);
    return { c, ax, ay };
  }
  function halo(c, r) {
    const sil = U.tint(c, cP);
    const ctx = c.getContext('2d');
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; ctx.drawImage(sil, Math.cos(a) * r, Math.sin(a) * r); }
    ctx.restore();
  }
  function inkify(c, seed) {
    const ctx = c.getContext('2d');
    const sx = (seed * 37) & 255, sy = (seed * 91) & 255;
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    for (let y = -sy; y < c.height; y += 256) for (let x = -sx; x < c.width; x += 256) ctx.drawImage(VOIDC, x, y);
    ctx.restore();
  }
  function tintSpr(spr, color) { return { c: U.tint(spr.c, color), ax: spr.ax, ay: spr.ay }; }
  function shards(spr, n, seed, cyFrac) {
    const rng = U.rng(seed);
    const w = spr.c.width, h = spr.c.height;
    const cx = spr.ax, cy = spr.ay - spr.ay * (cyFrac || 0.45);
    const Rr = Math.hypot(w, h);
    const a0 = rng.next() * TAU;
    const cuts = [];
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / n) * TAU + R(-0.3, 0.3, rng);
      const pts = [[cx, cy]];
      for (let k = 1; k <= 4; k++) { const r = (k / 4) * Rr * 0.5; const j = k < 4 ? R(-0.25, 0.25, rng) : 0; pts.push([cx + Math.cos(a + j) * r, cy + Math.sin(a + j) * r]); }
      pts.push([cx + Math.cos(a) * Rr, cy + Math.sin(a) * Rr]);
      cuts.push({ a, pts });
    }
    const out = [];
    for (let i = 0; i < n; i++) {
      const A = cuts[i], B = cuts[(i + 1) % n];
      let b = B.a;
      if (b < A.a) b += TAU;
      const poly = A.pts.slice();
      for (let k = 1; k < 6; k++) { const a = A.a + ((b - A.a) * k) / 6; poly.push([cx + Math.cos(a) * Rr, cy + Math.sin(a) * Rr]); }
      for (let k = B.pts.length - 1; k >= 1; k--) poly.push(B.pts[k]);
      const { c, ctx } = U.canvas(w, h);
      ctx.save(); ctx.beginPath(); polyPath(ctx, poly); ctx.clip(); ctx.drawImage(spr.c, 0, 0); ctx.restore();
      ctx.globalCompositeOperation = 'source-atop';
      ctx.strokeStyle = cP;
      ctx.lineWidth = K * 0.7;
      ctx.beginPath();
      ctx.moveTo(A.pts[0][0], A.pts[0][1]); for (const p of A.pts) ctx.lineTo(p[0], p[1]);
      ctx.moveTo(B.pts[0][0], B.pts[0][1]); for (const p of B.pts) ctx.lineTo(p[0], p[1]);
      ctx.stroke();
      const mid = (A.a + b) / 2;
      out.push({ c, ax: cx, ay: cy, dx: Math.cos(mid), dy: Math.sin(mid) });
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
    const m = ctx.getTransform();
    ctx.setTransform(c, sn, -sn, c, BX + x * BS, BY + y * BS);
    ctx.drawImage(s.c, -s.ax, -s.ay);
    ctx.setTransform(m);
  }

  /* ================================ characters ================================ */
  const CREEP = [[0, -19.6], [3.7, -19.0], [6.5, -16.6], [7.7, -12.8], [7.2, -9.0], [5.2, -6.1], [2.4, -4.6], [0.5, -3.3],
    [-1.9, -4.6], [-4.9, -6.3], [-7.1, -9.2], [-7.6, -13.0], [-6.3, -16.7], [-3.5, -19.0]];
  const bulb = (sx, sy, cy, oy, rng, j) => CREEP.map((p) => [p[0] * sx + (rng.next() - 0.5) * j, oy + (p[1] - cy) * sy + (rng.next() - 0.5) * j]);
  /** dark crown above a wavy line, comb transition into the paper underside */
  function crownInk(ctx, wy, x0, x1, top, comb, J) {
    ctx.beginPath();
    ctx.moveTo(x0, top); ctx.lineTo(x1, top);
    for (let x = x1; x >= x0; x -= 0.5) ctx.lineTo(x, wy(x));
    ctx.closePath();
    ctx.fillStyle = cI;
    ctx.fill();
    for (let x = x0 + 1; x <= x1 - 1; x += comb) {
      const len = 1.0 + 2.6 * ((x - x0) / (x1 - x0)) + J(0.8);
      taper(ctx, x, wy(x) - 0.2, x + 0.25, wy(x) + len, 0.4);
    }
  }
  function rootLegs(ctx, ph, bob, hips, wid, J) {
    ctx.fillStyle = cI;
    hips.forEach(([hx, hy, off], k) => {
      const a = ph + (k & 1 ? Math.PI : 0) + (off || 0);
      const ft = [hx + 0.6 + 1.5 * Math.cos(a), -Math.max(0, Math.sin(a)) * 1.4];
      limb(ctx, [[hx, hy + bob], [(hx + ft[0]) / 2, hy / 2 + bob * 0.5 + ft[1] * 0.5], [ft[0], ft[1] - 0.4]], wid, wid * 0.65);
      taper(ctx, ft[0], ft[1] - 0.4, ft[0] + wid * 2.2, ft[1] + 0.1, wid * 0.5, 0.1);
      taper(ctx, ft[0], ft[1] - 0.4, ft[0] - wid * 1.3, ft[1] + 0.2, wid * 0.42, -0.1);
    });
  }

  /* ---------- Rüben-Spucker: fr 0-3 walk, 4-6 aim swell, 7 spit recoil ---------- */
  const spitParams = (fr) => ({ sw: fr >= 4 && fr <= 6 ? (fr - 3) / 3 : 0, rec: fr === 7 ? 1 : 0 });
  function spitGeom(fr) {
    const { sw, rec } = spitParams(fr);
    const sxk = 1.06 * (1 + 0.16 * sw + 0.08 * rec);
    const x0 = 5.4 * sxk, L = 6.2 * (1 - 0.32 * rec + 0.1 * sw), y = -10.6 + rec * 0.6;
    return { sw, rec, sxk, x0, L, y, mx: x0 + L + 0.6 };
  }
  function drawSpitter(ctx, f, fr, rng) {
    const J = (s) => (rng.next() - 0.5) * s;
    const g = spitGeom(fr);
    const { sw, rec } = g;
    const walk = fr < 4;
    const ph = walk ? (fr / 4) * TAU : 0;
    const bob = walk ? -0.75 * Math.abs(Math.sin(ph)) : 0;
    ctx.save();
    ctx.scale(f, 1);
    rootLegs(ctx, ph, bob, [[-2.2, -5.2], [2.4, -5.2]], 0.85, J);
    ctx.save();
    ctx.translate(0, bob);
    const sy = 0.98 * (1 - 0.04 * sw) * (1 - 0.13 * rec);
    // spiky leaves
    const lsw = Math.sin(ph) * 0.6;
    const top = -3.6 - 16.3 * sy;
    leaf(ctx, -0.6, top + 0.8, -4.2 + lsw + J(0.4), top - 7.2, 1.2, -0.4);
    leaf(ctx, 0.4, top + 0.4, 0.8 + lsw + J(0.4), top - 8.6, 1.25, 0.2);
    leaf(ctx, 1.2, top + 0.8, 5.0 + lsw + J(0.4), top - 6.6, 1.15, 0.6);
    const pts = bulb(g.sxk, sy, -3.3, -3.3, rng, 0.3);
    const body = (c) => smoothPath(c, pts);
    fillPath(ctx, body, cP);
    const wyc = -3.3 - 9.4 * sy;
    clipDo(ctx, body, () => {
      const wy = (x) => wyc + 0.5 * Math.sin(x * 1.1 + 0.4);
      crownInk(ctx, wy, -10, 10, -30, 1.1, J);
      // mottled skin: teal spot plate dabbed into the dark crown
      ctx.save(); ctx.translate(TX * f, TY);
      ctx.fillStyle = cT;
      const r2 = U.rng(4100 + fr);
      for (let k = 0; k < 9; k++) {
        const x = R(-7, 6, r2), y = R(top + 2, wyc - 1, r2);
        ctx.beginPath(); ctx.ellipse(x, y, R(0.7, 1.4, r2), R(0.5, 0.9, r2), R(0, 3, r2), 0, TAU); ctx.fill();
      }
      ctx.restore();
      ctx.fillStyle = cP;
      lens(ctx, -6.8, wyc - 1.4, -3.8 + J(0.3), wyc - 5.8, 0.32, -0.6);
      lens(ctx, -4.4, top + 2.6, -0.8 + J(0.3), top + 0.6, 0.24, -0.4);
      ctx.fillStyle = cI;
      lens(ctx, 3.4, -6.4, 6.6, -9.6, 0.24, 0.45);
      lens(ctx, -6.0, -7.4, -7.0, -9.8, 0.12, -0.2);
    });
    crescent(ctx, body, 0, -12, -0.9, -0.8, 0.94, cI);
    strokePath(ctx, body, cI, 0.7);
    // angry carved eyes high in the crown
    const ey = wyc - 2.6, e1x = -2.6, e2x = 1.6;
    ctx.fillStyle = cP;
    lens(ctx, e1x - 1.3, ey - 0.7, e1x + 1.1, ey + 0.4, 0.68, 0.16);
    lens(ctx, e2x - 1.1, ey + 0.4, e2x + 1.3, ey - 0.7, 0.68, 0.16);
    ctx.fillStyle = cI;
    ctx.beginPath(); ctx.arc(e1x + 0.4, ey, 0.45, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(e2x + 0.4, ey, 0.45, 0, TAU); ctx.fill();
    // swelling cheek sack
    const cr = 1.6 + 2.0 * sw;
    const cheek = (c) => c.ellipse(g.x0 - 1.0, g.y + 1.6, cr * 1.1, cr, 0, 0, TAU);
    fillPath(ctx, cheek, cP);
    if (sw > 0.3) { ctx.save(); ctx.translate(TX, TY); clipDo(ctx, cheek, () => { ctx.fillStyle = cT; const r3 = U.rng(77 + fr); for (let k = 0; k < 14 * sw; k++) { ctx.beginPath(); ctx.arc(g.x0 - 1 + R(-cr, cr, r3), g.y + 1.6 + R(-cr, cr, r3), R(0.25, 0.45, r3), 0, TAU); ctx.fill(); } }); ctx.restore(); }
    crescent(ctx, cheek, g.x0 - 1, g.y + 1.6, -0.5, -0.5, 0.88, cI);
    strokePath(ctx, cheek, cI, 0.5);
    // snout tube
    const x0 = g.x0, x1 = g.x0 + g.L, y = g.y, r0 = 2.0, r1 = 1.6;
    const tube = (c) => { c.moveTo(x0 - 1, y - r0); c.quadraticCurveTo((x0 + x1) / 2, y - r1 * 0.9, x1, y - r1); c.lineTo(x1, y + r1); c.quadraticCurveTo((x0 + x1) / 2, y + r1 * 0.9, x0 - 1, y + r0); c.closePath(); };
    fillPath(ctx, tube, cP);
    clipDo(ctx, tube, () => {
      ctx.fillStyle = cI;
      for (let x = x0; x < x1; x += 0.9) taper(ctx, x, y + r1 + 0.2, x + 0.2, y + 0.3, 0.3);
      lens(ctx, x0 + g.L * 0.38, y - 2.2, x0 + g.L * 0.42, y + 2.2, 0.26, 0.4);
      lens(ctx, x0 + g.L * 0.7, y - 2.2, x0 + g.L * 0.74, y + 2.2, 0.26, 0.4);
    });
    strokePath(ctx, tube, cI, 0.6);
    // puckered lips + hole
    const lx = x1 + 0.5;
    ctx.fillStyle = cI;
    for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; taper(ctx, lx + Math.cos(a) * 0.8, y + Math.sin(a) * 1.9, lx + Math.cos(a) * 1.7, y + Math.sin(a) * 3.0, 0.45); }
    ctx.beginPath(); ctx.ellipse(lx, y, 1.3, 2.7, 0, 0, TAU); ctx.fill();
    if (sw > 0) {
      holeSpot(ctx, (c) => c.ellipse(lx + 0.15, y, 0.75, 1.8, 0, 0, TAU), cT, TX * 0.6, TY * 0.6);
      ctx.fillStyle = cP; star(ctx, lx + 0.15, y, 4, 0.6 + sw * 1.1, 0.25, 0.2); ctx.fill();
    } else {
      ctx.fillStyle = cP; lens(ctx, lx - 0.6, y - 2.0, lx - 0.5, y + 0.6, 0.14, -0.2);
    }
    // drool
    if (!rec) {
      const drop = (c) => { c.moveTo(lx - 0.2, y + 2.4); c.quadraticCurveTo(lx + 1.2, y + 4.4, lx + 0.4, y + 5.0); c.quadraticCurveTo(lx - 0.8, y + 4.6, lx - 0.2, y + 2.4); c.closePath(); };
      plate(ctx, drop, cT, TX * 0.5, TY * 0.5);
      strokePath(ctx, drop, cI, 0.35);
    }
    taper(ctx, -6.9, -8.6, -8.6, -8.0, 0.24);
    limb(ctx, [[0.5, -3.6], [-0.5, -2.2], [0.6, -1.2]], 0.36, 0.06);
    ctx.restore();
    ctx.restore();
  }

  /* ---------- Zündrübe: round beet bomb on the orange plate ---------- */
  const BOMB_TIP = [2.6, -21.2];
  function drawBomber(ctx, f, fr, rng) {
    const J = (s) => (rng.next() - 0.5) * s;
    const ph = (fr / 4) * TAU;
    const bob = -0.5 * Math.abs(Math.sin(ph * 2));
    ctx.save();
    ctx.scale(f, 1);
    ctx.fillStyle = cI;
    for (const [hx, o] of [[-3.4, 0], [-1.2, Math.PI], [1.4, 0], [3.6, Math.PI]]) {
      const a = ph * 2 + o;
      const fx = hx + 0.9 * Math.cos(a), fy = -Math.max(0, Math.sin(a)) * 1.1;
      limb(ctx, [[hx * 0.8, -4.4 + bob], [fx, fy - 0.3]], 0.6, 0.42);
      taper(ctx, fx, fy - 0.3, fx + 1.3, fy + 0.1, 0.32);
    }
    ctx.save();
    ctx.translate(0, bob);
    // leaves + fuse behind / on top
    leaf(ctx, -0.6, -14.0, -4.4 + J(0.4), -17.6, 1.05, -0.4);
    leaf(ctx, 0.6, -14.2, 4.0 + J(0.4), -18.2, 1.0, 0.4);
    ctx.fillStyle = cI;
    limb(ctx, [[0.0, -14.4], [-1.3, -16.8], [0.0, -19.4], [BOMB_TIP[0] - 0.3, BOMB_TIP[1] + 0.3]], 0.5, 0.32);
    ctx.fillStyle = cP;
    for (const [x, y] of [[-1.2, -16.6], [-0.5, -18.6], [1.3, -20.2]]) lens(ctx, x - 0.35, y - 0.25, x + 0.35, y + 0.25, 0.12);
    const body = (c) => c.ellipse(0, -9.2, 6.3, 5.9, 0, 0, TAU);
    plate(ctx, body, cO, MX * f, MY);
    clipDo(ctx, body, () => {
      ctx.fillStyle = cI;
      // carved shading: ribs on the shadow side + comb at the bottom
      for (let k = 0; k < 4; k++) arcLens(ctx, -1.4, -9.6, 5.6 - k * 1.3, Math.PI * -0.28, Math.PI * 0.42, 0.42 - k * 0.06, 1);
      for (let x = -4.6; x <= 4.8; x += 1.0) taper(ctx, x, -2.9, x + 0.25, -4.6 - Math.abs(Math.sin(x)) * 0.8, 0.34);
      ctx.fillStyle = cP;
      lens(ctx, -5.0, -9.6, -2.6 + J(0.3), -13.6, 0.4, -0.6);
      lens(ctx, -2.4, -14.2, 0.4 + J(0.2), -14.8, 0.22, -0.2);
    });
    crescent(ctx, body, 0, -9.2, -0.8, -0.7, 0.93, cI);
    strokePath(ctx, body, cI, 0.75);
    // mean slanted eyes, heavy brows, jagged grin
    const ex = 1.4, ey = -10.4;
    ctx.fillStyle = cI;
    lens(ctx, -3.2 + ex, ey - 1.6, -0.4 + ex, ey - 0.6, 0.55, 0.1);
    lens(ctx, 0.8 + ex, ey - 0.6, 3.4 + ex, ey - 1.7, 0.55, 0.1);
    ctx.fillStyle = cP;
    lens(ctx, -2.8 + ex, ey - 0.4, -0.7 + ex, ey + 0.2, 0.55, 0.15);
    lens(ctx, 1.0 + ex, ey + 0.2, 3.0 + ex, ey - 0.4, 0.55, 0.15);
    ctx.fillStyle = cI;
    ctx.beginPath(); ctx.arc(-1.2 + ex, ey - 0.05, 0.38, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(1.6 + ex, ey - 0.05, 0.38, 0, TAU); ctx.fill();
    const my = -6.8;
    lens(ctx, -2.4 + ex, my - 0.4, 3.0 + ex, my - 0.4, 0.9, 0.35);
    ctx.fillStyle = cP;
    for (const tx of [-1.2, 0.6, 2.2]) { ctx.beginPath(); ctx.moveTo(tx + ex - 0.4, my - 1.3); ctx.lineTo(tx + ex + 0.4, my - 1.3); ctx.lineTo(tx + ex, my - 0.4); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = cI;
    limb(ctx, [[0.4, -3.4], [0.0, -2.2], [0.8, -1.4]], 0.4, 0.06);
    ctx.restore();
    ctx.restore();
  }

  /* ---------- Wurzel-Bock: parsnip ram, side view. fr 0-3 trot, 4-5 rear, 6-7 dash, 8 dizzy ---------- */
  function hornPts(cx, cy) {
    const pts = [];
    for (let k = 0; k <= 12; k++) {
      const t = k / 12, a = -1.25 - t * 1.75 * Math.PI, r = 4.0 * (1 - 0.6 * t);
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return pts;
  }
  function drawCharger(ctx, f, fr, rng) {
    const J = (s) => (rng.next() - 0.5) * s;
    const pose = fr < 4 ? 'trot' : fr < 6 ? 'rear' : fr < 8 ? 'dash' : 'dizzy';
    const ph = (fr / 4) * TAU;
    const bob = pose === 'trot' ? -0.7 * Math.abs(Math.sin(ph)) : 0;
    ctx.save();
    ctx.scale(f, 1);
    // legs: [hip x, phase offset, front?]
    const legs = [[-7.2, 0, 0], [-4.8, Math.PI, 0], [2.0, Math.PI, 1], [4.4, 0, 1]];
    const legDraw = (hx, o, front) => {
      let fx, fy, kx = 0;
      if (pose === 'trot') { const a = ph + o; fx = hx + 1.6 * Math.cos(a); fy = -Math.max(0, Math.sin(a)) * 1.6; }
      else if (pose === 'rear') { if (front) { fx = hx + 3.5 + (o ? 0.6 : 2.0) * (fr === 4 ? 1 : -1); fy = -6.5 - (o ? 1.2 : 2.6) * (fr === 4 ? 1 : 0.6); kx = 1.8; } else { fx = hx - 0.6; fy = 0; } }
      else if (pose === 'dash') { fx = front ? hx + 5.2 - (o ? 1.2 : 0) : hx - 5.0 + (o ? 1 : 0); fy = front ? -1.6 : -0.6; }
      else { fx = hx + (front ? 0.8 : -0.6); fy = 0; }
      const hy = -8.4 + bob;
      ctx.fillStyle = cI;
      limb(ctx, [[hx, hy], [(hx + fx) / 2 + kx, (hy + fy) / 2 - 0.4], [fx, fy - 0.5]], 1.15, 0.85);
      taper(ctx, fx, fy - 0.5, fx + 1.8, fy + 0.1, 0.6, 0.1);
      ctx.fillStyle = cP;
      lens(ctx, hx - 0.6, hy + 0.6, (hx + fx) / 2 - 0.5, (hy + fy) / 2, 0.16, -0.1);
    };
    // the far legs first
    legDraw(legs[1][0], legs[1][1], 0); legDraw(legs[2][0], legs[2][1], 1);
    ctx.save();
    if (pose === 'rear') { ctx.translate(-6, -6); ctx.rotate(-0.32 - (fr === 5 ? 0.04 : 0)); ctx.translate(6, 6); }
    else if (pose === 'dash') { ctx.translate(4, -4); ctx.rotate(0.13); ctx.scale(1.1, 0.94); ctx.translate(-4, 4); }
    else if (pose === 'dizzy') { ctx.translate(0, -6); ctx.rotate(0.05); ctx.translate(0, 6); }
    ctx.translate(0, bob);
    // root tail
    ctx.fillStyle = cI;
    limb(ctx, [[-11.4, -11.2], [-13.6, -12.6], [-15.4, -11.4], [-16.8, -12.6]], 0.55, 0.08);
    // leafy mane sweeping back from the shoulders
    const msw = pose === 'dash' ? -1.2 : Math.sin(ph) * 0.5;
    leaf(ctx, 1.4, -18.4, -4.6 + msw + J(0.4), -24.4, 1.35, -0.6);
    leaf(ctx, 2.4, -18.8, -1.4 + msw + J(0.4), -26.0, 1.4, -0.3);
    leaf(ctx, 3.2, -18.2, 3.4 + msw * 0.5 + J(0.4), -25.0, 1.2, 0.3);
    // parsnip body
    const pts = [[-12.2, -11.2], [-9.4, -14.4], [-4.4, -17.4], [0.6, -19.4], [4.4, -18.8], [6.8, -15.6], [6.8, -11.0], [4.4, -7.8], [-0.8, -7.0], [-6.2, -7.6], [-10.2, -9.0]].map((p) => [p[0] + J(0.3), p[1] + J(0.3)]);
    const body = (c) => smoothPath(c, pts);
    fillPath(ctx, body, cP);
    clipDo(ctx, body, () => {
      ctx.fillStyle = cI;
      // parsnip growth rings
      for (const x of [-9.0, -6.0, -3.0, 0.2, 3.4]) lens(ctx, x, -21, x + 0.8 + J(0.4), -5.5, 0.22 + (x + 9) * 0.008, 0.9);
      // shadowed belly comb
      for (let x = -10; x <= 6; x += 1.05) taper(ctx, x, -6.8, x + 0.3, -8.6 - (x > -6 && x < 4 ? 1.4 : 0.6) + J(0.5), 0.42);
      ctx.fillStyle = cP;
      lens(ctx, -9.6, -13.6, -2.6 + J(0.4), -17.8, 0.32, -0.5);
      lens(ctx, -1.4, -18.6, 3.4, -18.6, 0.2, -0.3);
    });
    crescent(ctx, body, -2, -13, -0.4, -0.9, 0.95, cI);
    strokePath(ctx, body, cI, 0.7);
    // lowered head
    ctx.save();
    if (pose === 'dash') { ctx.translate(8, -12); ctx.rotate(0.35); ctx.translate(-8, 12); }
    if (pose === 'dizzy') { ctx.translate(8, -12); ctx.rotate(0.3); ctx.translate(-8, 12); }
    const head = (c) => c.ellipse(9.0, -11.4, 3.9, 3.2, 0.3, 0, TAU);
    fillPath(ctx, head, cP);
    clipDo(ctx, head, () => { ctx.fillStyle = cI; for (let x = 7; x <= 12.5; x += 0.95) taper(ctx, x, -8.0, x + 0.3, -9.6, 0.36); });
    crescent(ctx, head, 9, -11.4, -0.5, -0.6, 0.9, cI);
    strokePath(ctx, head, cI, 0.6);
    ctx.fillStyle = cI;
    ctx.beginPath(); ctx.arc(12.2, -9.4, 0.42, 0, TAU); ctx.fill();
    lens(ctx, 11.0, -8.4, 12.6, -8.6, 0.3, 0.2);
    // eye
    const ex = 10.2, ey = -12.4;
    if (pose === 'rear') {
      holeSpot(ctx, (c) => c.ellipse(ex, ey, 1.2, 0.9, -0.3, 0, TAU), cO, MX * f * 0.6, MY * 0.6);
      strokePath(ctx, (c) => c.ellipse(ex, ey, 1.2, 0.9, -0.3, 0, TAU), cI, 0.4);
      ctx.fillStyle = cI; lens(ctx, ex - 1.6, ey - 1.6, ex + 1.4, ey - 0.6, 0.4, 0.1);
    } else if (pose === 'dizzy') {
      ctx.strokeStyle = cI; ctx.lineWidth = 0.35;
      ctx.beginPath(); for (let k = 0; k <= 16; k++) { const a = k * 0.75, r = 0.12 + k * 0.07; ctx.lineTo(ex + Math.cos(a) * r, ey + Math.sin(a) * r); } ctx.stroke();
    } else {
      ctx.fillStyle = cI; lens(ctx, ex - 1.2, ey - 0.2, ex + 1.1, ey - 0.5, 0.5, 0.15);
      ctx.fillStyle = cP; ctx.beginPath(); ctx.arc(ex + 0.3, ey - 0.4, 0.28, 0, TAU); ctx.fill();
      ctx.fillStyle = cI; lens(ctx, ex - 1.6, ey - 1.5, ex + 1.3, ey - 0.9, 0.3, 0.05);
    }
    // curled ram horn: solid ink spiral with carved ridges
    const hp = hornPts(7.0, -14.4);
    ctx.fillStyle = cI;
    limb(ctx, hp, 1.75, 0.45);
    ctx.fillStyle = cP;
    for (let k = 1; k < hp.length - 2; k++) {
      const a = hp[k - 1], b = hp[k + 1];
      const tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1;
      const w = 1.4 * (1 - (k / 12) * 0.6);
      lens(ctx, hp[k][0] - (ty / l) * w, hp[k][1] + (tx / l) * w, hp[k][0] + (ty / l) * w, hp[k][1] - (tx / l) * w, 0.13, 0.15);
    }
    ctx.restore();
    ctx.restore();
    // near legs on top
    legDraw(legs[0][0], legs[0][1], 0); legDraw(legs[3][0], legs[3][1], 1);
    if (pose === 'dash') {
      ctx.fillStyle = cI;
      for (let k = 0; k < 4; k++) lens(ctx, -14 - k * 1.5, -9 - k * 3.2, -24 + k * 0.5, -9.4 - k * 3.2, 0.42 - k * 0.05);
    }
    ctx.restore();
  }

  /* ---------- Rüben-Ahnin: matriarch with teal headscarf and a crown of babies ---------- */
  function babyHead(ctx, x, y, s, rng, lean) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(lean || 0); ctx.scale(s, s);
    leaf(ctx, 0, -3.6, -1.6 + (rng.next() - 0.5), -6.8, 0.65, -0.3, false);
    const b = (c) => { c.moveTo(0, -4.0); c.bezierCurveTo(2.8, -4.0, 3.0, -0.6, 0.2, 0.6); c.bezierCurveTo(-3.0, -0.6, -2.8, -4.0, 0, -4.0); c.closePath(); };
    fillPath(ctx, b, cP);
    clipDo(ctx, b, () => { ctx.fillStyle = cI; ctx.fillRect(-4, -5, 8, 3.2); });
    strokePath(ctx, b, cI, 0.45);
    ctx.fillStyle = cP;
    ctx.beginPath(); ctx.arc(-0.5, -2.6, 0.42, 0, TAU); ctx.arc(1.1, -2.6, 0.42, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function drawMother(ctx, f, fr, rng) {
    const J = (s) => (rng.next() - 0.5) * s;
    const ph = (fr / 4) * TAU;
    const bob = -0.9 * Math.abs(Math.sin(ph));
    ctx.save();
    ctx.scale(f, 1);
    // thick root legs
    ctx.fillStyle = cI;
    for (const [hx, o] of [[-4.4, Math.PI], [4.2, 0]]) {
      const a = ph + o, fx = hx + 0.6 + 1.6 * Math.cos(a), fy = -Math.max(0, Math.sin(a)) * 1.6;
      limb(ctx, [[hx, -6.4 + bob], [(hx + fx) / 2, -3.4 + fy * 0.5], [fx, fy - 0.5]], 1.7, 1.2);
      taper(ctx, fx, fy - 0.5, fx + 2.8, fy + 0.1, 0.75, 0.1);
      taper(ctx, fx, fy - 0.5, fx - 1.7, fy + 0.2, 0.6, -0.1);
    }
    ctx.save();
    ctx.translate(0, bob);
    ctx.rotate(0.03 * Math.cos(ph));
    // her own old leaves behind the scarf
    leaf(ctx, -1, -29.5, -7.5 + J(0.5), -35.6, 1.5, -0.6);
    leaf(ctx, 1, -29.5, 7.0 + J(0.5), -35.0, 1.4, 0.6);
    const pts = bulb(1.6, 1.55, -12, -17.4, rng, 0.45);
    const body = (c) => smoothPath(c, pts);
    fillPath(ctx, body, cP);
    const wyc = -14.6;
    clipDo(ctx, body, () => {
      const wy = (x) => wyc + 0.6 * Math.sin(x * 0.7 + 0.6);
      crownInk(ctx, wy, -14, 14, -40, 1.3, J);
      // wrinkles carved into the paper underside + light on the crown
      ctx.fillStyle = cI;
      for (let k = 0; k < 4; k++) arcLens(ctx, 1, -2, 9 + k * 1.6, Math.PI * 1.15, Math.PI * 1.35, 0.22, 1);
      lens(ctx, 5.4, -6.8, 10.6, -12.4, 0.3, 0.6);
      lens(ctx, 3.2, -5.0, 8.4, -8.4, 0.24, 0.4);
      ctx.fillStyle = cP;
      lens(ctx, -11.0, -16.2, -8.6 + J(0.3), -20.4, 0.34, -0.5);
    });
    crescent(ctx, body, 0, -17, -1.1, -1.0, 0.95, cI);
    strokePath(ctx, body, cI, 0.8);
    // stern face: lidded carved eyes in the crown band, nose, frown, wrinkles
    const ex = 1.8, ey = -18.2;
    for (const [x, s] of [[-3.0, 1], [3.0, -1]]) {
      ctx.fillStyle = cP; lens(ctx, x + ex - 1.6, ey + 0.2 * s, x + ex + 1.6, ey - 0.2 * s, 0.7, 0.2);
      ctx.fillStyle = cI; ctx.beginPath(); ctx.arc(x + ex + 0.4, ey + 0.2, 0.5, 0, TAU); ctx.fill();
      lens(ctx, x + ex - 1.9, ey - 0.5 + 0.3 * s, x + ex + 1.9, ey - 0.5 - 0.3 * s, 0.55, -0.15);
      ctx.fillStyle = cP;
      lens(ctx, x + ex - 1.4, ey + 1.6, x + ex + 1.2, ey + 1.5, 0.12, 0.3);
    }
    const nose = (c) => c.ellipse(ex + 0.8, -14.6, 1.3, 1.6, 0, 0, TAU);
    fillPath(ctx, nose, cP); crescent(ctx, nose, ex + 0.8, -14.6, -0.4, -0.4, 0.8, cI); strokePath(ctx, nose, cI, 0.45);
    ctx.fillStyle = cI;
    lens(ctx, ex - 2.6, -10.2, ex + 3.6, -10.6, 0.5, -0.6);
    lens(ctx, ex - 4.6, -12.4, ex - 3.2, -9.8, 0.16, -0.2);
    lens(ctx, ex + 5.0, -12.6, ex + 4.2, -10.0, 0.16, 0.2);
    // headscarf on the teal plate with carved polka dots + folds
    const scarf = (c) => {
      c.moveTo(-12.8, -21.6);
      c.bezierCurveTo(-13.4, -29.6, -7.0, -33.4, 0, -33.2);
      c.bezierCurveTo(7.0, -33.4, 13.6, -29.6, 12.8, -21.4);
      c.quadraticCurveTo(0.5, -18.6, -12.8, -21.6);
      c.closePath();
    };
    plate(ctx, scarf, cT, TX * f, TY);
    clipDo(ctx, scarf, () => {
      ctx.fillStyle = cP;
      for (let y = -31; y <= -21; y += 2.6) for (let x = -12 + ((y * 7) % 2.6); x <= 12; x += 3.0) { ctx.beginPath(); ctx.arc(x, y, 0.55, 0, TAU); ctx.fill(); }
      ctx.fillStyle = cI;
      for (let k = 0; k < 3; k++) lens(ctx, 4 + k * 2.6, -31.6 + k, 8 + k * 1.8, -21.4, 0.22, 0.5);
      lens(ctx, -12.6, -22.6, 12.6, -22.2, 0.32, 0.6);
    });
    crescent(ctx, scarf, 0, -26, -0.7, -0.8, 0.95, cI);
    strokePath(ctx, scarf, cI, 0.7);
    // knot + two flaps at the chin side
    const flap = (x0, y0, x1, y1, b) => { const fl = (c) => { c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + b, (y0 + y1) / 2, x1, y1); c.quadraticCurveTo((x0 + x1) / 2 - b * 0.4, (y0 + y1) / 2 + 0.6, x0 - 1.0, y0 + 0.6); c.closePath(); }; plate(ctx, fl, cT, TX * f, TY); strokePath(ctx, fl, cI, 0.5); };
    flap(12.0, -21.4, 14.6, -15.6, 1.6);
    flap(11.6, -21.0, 11.2, -14.8, -1.2);
    fillPath(ctx, (c) => c.ellipse(12.0, -21.4, 1.3, 1.1, 0, 0, TAU), cI);
    // crown of babies on top
    babyHead(ctx, -5.2, -31.6, 1.0, rng, -0.35);
    babyHead(ctx, 0.6, -33.0, 1.12, rng, 0.05);
    babyHead(ctx, 6.0, -31.4, 0.95, rng, 0.4);
    // a baby clinging to her back
    babyHead(ctx, -12.4, -8.6, 0.95, rng, -0.8);
    ctx.fillStyle = cI;
    limb(ctx, [[0.6, -3.4], [-0.4, -2.0], [0.8, -1.0]], 0.5, 0.08);
    ctx.restore();
    ctx.restore();
  }

  /* ---------- Rübchen ---------- */
  function drawSprout(ctx, f, fr, rng) {
    const J = (s) => (rng.next() - 0.5) * s;
    const ph = (fr / 4) * TAU;
    const bob = -0.5 * Math.abs(Math.sin(ph));
    ctx.save();
    ctx.scale(f, 1);
    ctx.fillStyle = cI;
    for (const [hx, o] of [[-1.2, Math.PI], [1.4, 0]]) {
      const a = ph + o, fx = hx + 0.3 + 1.0 * Math.cos(a), fy = -Math.max(0, Math.sin(a)) * 0.9;
      limb(ctx, [[hx, -2.8 + bob], [fx, fy - 0.3]], 0.5, 0.36);
      taper(ctx, fx, fy - 0.3, fx + 1.1, fy + 0.1, 0.28);
    }
    ctx.save();
    ctx.translate(0, bob);
    leaf(ctx, 0.0, -11.6, -4.8 + Math.sin(ph) * 0.5 + J(0.3), -16.4, 1.35, -0.6);
    const pts = bulb(0.64, 0.64, -12, -7.4, rng, 0.15);
    const body = (c) => smoothPath(c, pts);
    fillPath(ctx, body, cP);
    clipDo(ctx, body, () => {
      const wy = (x) => -7.8 + 0.3 * Math.sin(x * 1.6);
      crownInk(ctx, wy, -6, 6, -16, 0.9, J);
      ctx.fillStyle = cP;
      lens(ctx, -4.2, -8.6, -2.4, -11.2, 0.2, -0.3);
    });
    crescent(ctx, body, 0, -7.4, -0.5, -0.5, 0.93, cI);
    strokePath(ctx, body, cI, 0.5);
    // big carved eyes, angry brows cut across the top
    const ex = 0.7;
    for (const x of [-1.2, 1.6]) {
      ctx.fillStyle = cP; ctx.beginPath(); ctx.arc(x + ex, -9.2, 1.0, 0, TAU); ctx.fill();
      ctx.fillStyle = cI; ctx.beginPath(); ctx.arc(x + ex + 0.3, -9.0, 0.48, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = cI;
    lens(ctx, -2.6 + ex, -10.6, -0.2 + ex, -9.7, 0.4, 0);
    lens(ctx, 0.4 + ex, -9.7, 2.9 + ex, -10.6, 0.4, 0);
    lens(ctx, -0.4 + ex, -6.0, 1.4 + ex, -6.2, 0.3, -0.2);
    limb(ctx, [[0.2, -2.2], [0.6, -1.2]], 0.22, 0.04);
    ctx.restore();
    ctx.restore();
  }

  /* ================================ lazy sprite sets ================================ */
  const DEF = {
    spitter: { box: [-10, -30, 15.5, 1.5], fn: drawSpitter, nf: 8, sh: [7.4, 2.2], cy: 0.42 },
    bomber: { box: [-8, -24, 8.5, 1.5], fn: drawBomber, nf: 4, sh: [6.0, 1.9], cy: 0.45 },
    charger: { box: [-25, -30, 17, 1.5], fn: drawCharger, nf: 9, sh: [12.5, 2.6], cy: 0.5 },
    mother: { box: [-16, -42, 17, 1.5], fn: drawMother, nf: 4, sh: [11.5, 3.0], cy: 0.5 },
    sprout: { box: [-7, -18, 6.5, 1], fn: drawSprout, nf: 4, sh: [4.2, 1.3], cy: 0.42 },
  };
  const SETS = {};
  const FX = {};
  function setOf(type) {
    let s = SETS[type];
    if (!s) s = SETS[type] = { d: DEF[type], n: {}, i: {}, sh: [], shadow: null, ghost: {} };
    return s;
  }
  function sprN(type, fi, fr, v) {
    const s = setOf(type), k = fi * 100 + fr * 2 + v;
    let spr = s.n[k];
    if (!spr) {
      const d = s.d, f = fi ? -1 : 1;
      spr = s.n[k] = mk(d.box[0] * (f > 0 ? 1 : 1), d.box[1], d.box[2], d.box[3], (c) => d.fn(c, f, fr, U.rng(300 + v * 11 + fr * 3)), { halo: 0.9, seed: 21 + v * 9 + fr });
    }
    return spr;
  }
  function sprI(type, fi, fr, v) {
    const s = setOf(type), k = fi * 100 + fr * 2 + v;
    let spr = s.i[k];
    if (!spr) {
      const d = s.d, f = fi ? -1 : 1;
      negative(true);
      try { spr = s.i[k] = mk(d.box[0], d.box[1], d.box[2], d.box[3], (c) => d.fn(c, f, fr, U.rng(300 + v * 11 + fr * 3)), { halo: 0.9, seed: 21 + v * 9 + fr, ink: false }); } finally { negative(false); }
    }
    return spr;
  }
  function shardsOf(type, fi) { const s = setOf(type); return s.sh[fi] || (s.sh[fi] = shards(sprN(type, fi, 0, 0), type === 'mother' ? 5 : 4, 55 + fi, s.d.cy)); }

  function build() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const h = (window.__forceH || window.innerHeight || 900) * dpr;
    K = U.clamp(Math.round((h / 360) * 4) / 4, 2, 5);
    buildVoid();
    // mirrored boxes: the sprite box must hold the figure for both facings
    for (const t in DEF) { const b = DEF[t].box, m = Math.max(-b[0], b[2]); b[0] = -m; b[2] = m; }
    for (const t in DEF) { const [rx, ry] = DEF[t].sh; setOf(t).shadow = mk(-rx - 1, -ry - 1, rx * 1.3 + 1, ry + 1, (c) => drawShadowArt(c, rx, ry), { pad: 0.4, ink: false }); }
    FX.raysT = mk(-10, -10, 10, 10, (c) => drawRays(c, 12, 4.5, 10, 7.5, cT, 0.3), { pad: 0.5 });
    FX.raysO = mk(-10, -10, 10, 10, (c) => drawRays(c, 12, 4.5, 10, 7.5, cO, 0.3), { pad: 0.5 });
    FX.raysBig = mk(-22, -22, 22, 22, (c) => drawRays(c, 18, 11, 22, 16, cO, 0.28), { pad: 0.5 });
    FX.star = mk(-3, -3, 3, 3, (c) => { star(c, 0, 0, 4, 2.6, 0.8, 0); c.fillStyle = cP; c.fill(); c.lineWidth = 0.5; c.strokeStyle = cI; c.stroke(); }, { pad: 0.5 });
    FX.drop = mk(-2, -2, 2, 2, (c) => { const d = (cc) => cc.arc(0, 0, 1.3, 0, TAU); plate(c, d, cT, TX * 0.5, TY * 0.5); strokePath(c, d, cI, 0.5); }, { pad: 0.5 });
    FX.splat = mk(-15, -9, 15, 9, (c) => drawSplatArt(c, U.rng(741), 6.5), { pad: 0.5 });
    FX.trail = mk(-14, -2.4, 0, 2.4, (c) => { c.fillStyle = cI; lens(c, -13.5, 0, -4.2, 0, 0.42); lens(c, -10.5, -1.5, -4.6, -1.2, 0.3, 0.2); lens(c, -10.0, 1.5, -4.6, 1.2, 0.3, -0.2); }, { pad: 0.5 });
    // enemy shot: teal juice glob, carved highlight, dripping tail; paper halo keeps it readable on ink
    FX.shot = [0, 1].map((v) => mk(-5.5, -5, 5, 5, (c) => {
      const g = (cc) => { cc.moveTo(-4.4, 0); cc.bezierCurveTo(-4.4, -4.6, 4.6, -4.8, 4.6, 0); cc.bezierCurveTo(4.6, 4.8, -4.4, 4.6, -4.4, 0); cc.closePath(); };
      plate(c, g, cT, TX, TY);
      clipDo(c, g, () => { c.fillStyle = cI; for (let k = 0; k < 4; k++) arcLens(c, -1, -0.8, 4.2 - k * 1.0, Math.PI * -0.1, Math.PI * 0.55, 0.35 - k * 0.05, 1); });
      strokePath(c, g, cI, 0.9);
      c.fillStyle = cP;
      lens(c, -2.6, -1.0, -0.6, -3.0 + v * 0.3, 0.5, -0.4);
      c.beginPath(); c.arc(1.6, -2.4, 0.45, 0, TAU); c.fill();
    }, { halo: 0.8, seed: 90 + v }));
  }

  /** common body draw like the style: negative print flash, cut-block shatter on death, block lowered on spawn */
  function drawBody(ctx, e, view, type, fr, o = {}) {
    base(view);
    const fi = o.fi !== undefined ? o.fi : e.facing < 0 ? 1 : 0;
    const v = Math.floor(view.rt * 6 + e.seed * 10) & 1;
    if (e.dying) {
      const t = e.deathT;
      if (t < 0.16) { const s = 1 + t * 0.6; blitS(ctx, sprI(type, fi, 0, 0), e.x, e.y, s, s); return null; }
      const u = (t - 0.16) / 0.84;
      const sh = shardsOf(type, fi);
      const big = type === 'mother' ? 1.4 : type === 'sprout' ? 0.7 : 1;
      ctx.globalAlpha = Math.max(0, 1 - u * u);
      const ay0 = sprN(type, fi, 0, 0).ay;
      for (let i = 0; i < sh.length; i++) {
        const p = sh[i];
        const d = (2 + 12 * U.ease.outQuad(u)) * big;
        const x = e.x + p.dx * d, y = e.y + p.dy * d * 0.7 - 6 * big * u + 26 * u * u;
        blitRot(ctx, p, x, y + (p.ay - ay0) / K, (i & 1 ? 1 : -1) * u * 1.6, 1);
      }
      ctx.globalAlpha = 1;
      return null;
    }
    const spr = (e.flash > 0.45 || o.inv ? sprI : sprN)(type, fi, fr, v);
    if (e.spawnT < 1) {
      const t = e.spawnT;
      if (t < 0.5) {
        const k = t / 0.5, s = 1 + (1 - k) * (1 - k) * 0.9;
        ctx.globalAlpha = 0.25 + 0.75 * k;
        blitS(ctx, spr, e.x, e.y - (1 - k) * 10, s, s);
        ctx.globalAlpha = 1;
        return null;
      }
      const k = (t - 0.5) / 0.5;
      const sc = (type === 'mother' ? 1.2 : type === 'sprout' ? 0.5 : 0.8);
      ctx.globalAlpha = 0.9 * (1 - k);
      blitS(ctx, FX.splat, e.x, e.y + 0.5, sc, sc);
      ctx.globalAlpha = 1;
      const sq = Math.sin(k * Math.PI) * 0.14 * (1 - k);
      blitS(ctx, spr, e.x, e.y, 1 + sq, 1 - sq);
      return null;
    }
    const pl = { fi, f: fi ? -1 : 1, x: e.x + (o.ox || 0), y: e.y - (o.lift || 0), spr };
    if (o.under) o.under(pl);
    if (o.sx || o.sy) blitS(ctx, spr, pl.x, pl.y, o.sx || 1, o.sy || 1);
    else blit(ctx, spr, pl.x, pl.y);
    return pl;
  }

  /* ================================ icons (100×100 design space, like the style) ================================ */
  function medallion(ctx) {
    ctx.fillStyle = cI;
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * TAU, da = (TAU / 24) * 0.32;
      ctx.beginPath();
      ctx.moveTo(50 + Math.cos(a - da) * 46, 50 + Math.sin(a - da) * 46);
      ctx.lineTo(50 + Math.cos(a) * 80, 50 + Math.sin(a) * 80);
      ctx.lineTo(50 + Math.cos(a + da) * 46, 50 + Math.sin(a + da) * 46);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath(); ctx.arc(50, 50, 45, 0, TAU); ctx.fillStyle = cI; ctx.fill();
    ctx.beginPath(); ctx.arc(50, 50, 40, 0, TAU); ctx.fillStyle = cP; ctx.fill();
    ctx.fillStyle = cP;
    for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU; ctx.beginPath(); ctx.arc(50 + Math.cos(a) * 42.6, 50 + Math.sin(a) * 42.6, 1.1, 0, TAU); ctx.fill(); }
  }
  function seedShape(c, x, y, a, L, w) {
    const ca = Math.cos(a), sa = Math.sin(a);
    const A = [x - ca * L * 0.55, y - sa * L * 0.55], B = [x + ca * L * 0.55, y + sa * L * 0.55];
    const C1 = [x - sa * w * 1.15 + ca * L * 0.1, y + ca * w * 1.15 + sa * L * 0.1], C2 = [x + sa * w * 1.15 + ca * L * 0.1, y - ca * w * 1.15 + sa * L * 0.1];
    c.moveTo(A[0], A[1]);
    c.quadraticCurveTo(C1[0], C1[1], B[0], B[1]);
    c.quadraticCurveTo(C2[0], C2[1], A[0], A[1]);
    c.closePath();
  }
  function iconSeed(ctx, x, y, a, L, w, lw) {
    const sh = (c) => seedShape(c, x, y, a, L, w);
    ctx.save(); ctx.translate(2.5, 2); fillPath(ctx, sh, cO); ctx.restore();
    strokePath(ctx, sh, cI, lw);
    ctx.fillStyle = cP;
    const ca = Math.cos(a), sa = Math.sin(a);
    lens(ctx, x - ca * L * 0.6 + sa * w * 0.5, y - sa * L * 0.6 - ca * w * 0.5, x + ca * L * 0.5 + sa * w * 0.6, y + sa * L * 0.5 - ca * w * 0.6, w * 0.22, -w * 0.15);
  }
  function speedLines(ctx, x, y, a, n, L, gap, w) {
    ctx.fillStyle = cI;
    const ca = Math.cos(a), sa = Math.sin(a);
    for (let k = 0; k < n; k++) {
      const off = (k - (n - 1) / 2) * gap;
      const bx = x - sa * off, by = y + ca * off;
      const l = L * (1 - (Math.abs(off) / (gap * n)) * 0.6);
      lens(ctx, bx, by, bx - ca * l, by - sa * l, w);
    }
  }
  const heartPath = (c) => {
    c.moveTo(50, 87); c.bezierCurveTo(30, 72, 9, 58, 11, 36); c.bezierCurveTo(13, 16, 39, 11, 50, 30);
    c.bezierCurveTo(61, 11, 87, 16, 89, 36); c.bezierCurveTo(91, 58, 70, 72, 50, 87); c.closePath();
  };
  function drawIconArt(ctx, id) {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    switch (id) {
      case 'leech': {
        // bowl of pumpkin soup, a carved heart rising from the steam
        ctx.fillStyle = cP;
        for (const x of [24, 76]) limb(ctx, [[x, 44], [x - 4, 36], [x + 3, 28], [x - 1, 20]], 2.0, 0.6);
        ctx.fillStyle = cI;
        for (const x of [24, 76]) limb(ctx, [[x + 1.4, 44], [x - 2.6, 36], [x + 4.4, 28], [x + 0.4, 20]], 0.9, 0.3);
        ctx.save(); ctx.translate(50, 31); ctx.scale(0.42, 0.42); ctx.translate(-50, -50);
        fillPath(ctx, heartPath, cP);
        ctx.save(); ctx.translate(5, 4); clipDo(ctx, heartPath, () => fillPath(ctx, heartPath, cO)); ctx.restore();
        crescent(ctx, heartPath, 50, 50, -5, -5, 0.9, cI);
        strokePath(ctx, heartPath, cI, 8);
        ctx.fillStyle = cP; lens(ctx, 20, 40, 32, 22, 4, -3);
        ctx.restore();
        const soup = (c) => c.ellipse(50, 56, 36, 8, 0, 0, TAU);
        plate(ctx, soup, cO, 2.5, 1.5);
        clipDo(ctx, soup, () => { ctx.fillStyle = cI; for (let k = 0; k < 4; k++) lens(ctx, 24 + k * 13, 57 + (k & 1) * 2, 32 + k * 13, 55 + (k & 1) * 2, 1.0, 0.8); });
        strokePath(ctx, soup, cI, 2.6);
        const bowl = (c) => { c.moveTo(12, 57); c.quadraticCurveTo(50, 70, 88, 57); c.bezierCurveTo(86, 80, 70, 90, 50, 90); c.bezierCurveTo(30, 90, 14, 80, 12, 57); c.closePath(); };
        fillPath(ctx, bowl, cI);
        ctx.fillStyle = cP;
        for (let k = 0; k < 4; k++) arcLens(ctx, 50, 52, 34 - k * 6, Math.PI * 0.6, Math.PI * 0.86, 1.6 - k * 0.25);
        lens(ctx, 20, 70, 80, 70, 1.2, 4);
        ctx.fillStyle = cI; ctx.fillRect(38, 89, 24, 5);
        break;
      }
      case 'thorns': {
        // rutabaga in a ring of carved thorns
        ctx.fillStyle = cI;
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * TAU + 0.13, r0 = 31, r1 = k & 1 ? 44 : 48, da = 0.17;
          ctx.beginPath();
          ctx.moveTo(50 + Math.cos(a - da) * r0, 52 + Math.sin(a - da) * r0);
          ctx.lineTo(50 + Math.cos(a) * r1, 52 + Math.sin(a) * r1);
          ctx.lineTo(50 + Math.cos(a + da) * r0, 52 + Math.sin(a + da) * r0);
          ctx.closePath(); ctx.fillStyle = cP; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = cI; ctx.stroke();
        }
        ctx.fillStyle = cI;
        for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU + 0.13 + 0.05; lens(ctx, 50 + Math.cos(a) * 33, 52 + Math.sin(a) * 33, 50 + Math.cos(a) * 41, 52 + Math.sin(a) * 41, 1.1); }
        ctx.beginPath(); ctx.arc(50, 52, 31, 0, TAU); ctx.fillStyle = cP; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = cI; ctx.stroke();
        // rutabaga in the middle
        ctx.save(); ctx.translate(50, 56); ctx.scale(0.62, 0.62);
        leaf(ctx, -2, -26, -14, -44, 3.4, 1.5); leaf(ctx, 2, -26, 14, -44, 3.4, -1.5);
        const body = (c) => { c.moveTo(0, -28); c.bezierCurveTo(22, -29, 33, -14, 32, 0); c.bezierCurveTo(31, 16, 16, 26, 0, 32); c.bezierCurveTo(-16, 26, -31, 16, -32, 0); c.bezierCurveTo(-33, -14, -22, -29, 0, -28); c.closePath(); };
        fillPath(ctx, body, cP);
        clipDo(ctx, body, () => {
          ctx.fillStyle = cI; ctx.beginPath(); ctx.moveTo(-40, -40); ctx.lineTo(40, -40);
          for (let px = 40; px >= -40; px -= 2) ctx.lineTo(px, -3 + 3 * Math.sin(px * 0.25)); ctx.closePath(); ctx.fill();
          for (let px = -28; px <= 28; px += 5) taper(ctx, px, -2 + 3 * Math.sin(px * 0.25), px + 1, 5 + (Math.abs(px) % 10 ? 2 : 0), 1.3);
          ctx.fillStyle = cP; lens(ctx, -24, -6, -12, -22, 2.2, -1.5);
        });
        strokePath(ctx, body, cI, 4.5);
        ctx.fillStyle = cP; lens(ctx, -14, -12, -3, -9, 2.6, 0.6); lens(ctx, 3, -9, 14, -12, 2.6, 0.6);
        ctx.restore();
        // orange burst plate between the thorns
        ctx.save(); ctx.translate(51.5, 53.5); ctx.fillStyle = cO;
        for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU + 0.13 + Math.PI / 12; ctx.beginPath(); ctx.arc(Math.cos(a) * 44, Math.sin(a) * 44, 2.4, 0, TAU); ctx.fill(); }
        ctx.restore();
        break;
      }
      case 'dashup': {
        // pumpkin rolling to the right, carved speed lines + dust
        speedLines(ctx, 32, 56, 0, 4, 26, 10, 2.6);
        ctx.fillStyle = cI;
        for (const [x, y, r] of [[18, 86, 3.4], [10, 82, 2.4], [26, 90, 2.2]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
        const pk = (c) => c.ellipse(60, 56, 28, 26, 0, 0, TAU);
        plate(ctx, pk, cO, 3, 2.5);
        clipDo(ctx, pk, () => {
          ctx.fillStyle = cI;
          for (const d of [-20, 20]) lens(ctx, 60 + d - 6, 30, 60 + d + 6, 82, 1.3, d * 0.5);
          for (let k = 0; k < 4; k++) arcLens(ctx, 64, 60, 26 - k * 2, Math.PI * 0.05, Math.PI * 0.55, 1.4 - k * 0.2, 1);
        });
        crescent(ctx, pk, 60, 56, -3, -3, 0.92, cI);
        strokePath(ctx, pk, cI, 4.5);
        ctx.save(); ctx.translate(60, 56); ctx.rotate(0.45);
        ctx.fillStyle = cI;
        fillPath(ctx, (c) => polyPath(c, [[-17, -1], [-4, -1], [-10.5, -13]]), cI);
        fillPath(ctx, (c) => polyPath(c, [[4, -1], [17, -1], [10.5, -13]]), cI);
        fillPath(ctx, (c) => { c.moveTo(-18, 5); c.lineTo(-11, 9); c.lineTo(-5, 5); c.lineTo(1, 9); c.lineTo(7, 5); c.lineTo(13, 9); c.lineTo(18, 5); c.quadraticCurveTo(0, 25, -18, 5); c.closePath(); }, cI);
        ctx.fillStyle = cI; taper(ctx, 0, -25, 4, -33, 2.6, 0.6);
        ctx.restore();
        ctx.fillStyle = cP; lens(ctx, 38, 48, 48, 34, 2.4, -2);
        break;
      }
      case 'range': {
        // long dotted throw arc ending in a target
        const tg = (c) => c.ellipse(76, 80, 21, 9.5, 0, 0, TAU);
        fillPath(ctx, tg, cP);
        ctx.save(); ctx.translate(2, 1.5); fillPath(ctx, (c) => c.ellipse(76, 80, 12, 5.3, 0, 0, TAU), cO); ctx.restore();
        fillPath(ctx, (c) => c.ellipse(76, 80, 6.5, 2.9, 0, 0, TAU), cP);
        fillPath(ctx, (c) => c.ellipse(76, 80, 2.8, 1.3, 0, 0, TAU), cI);
        strokePath(ctx, tg, cI, 3);
        strokePath(ctx, (c) => c.ellipse(76, 80, 12, 5.3, 0, 0, TAU), cI, 2);
        ctx.fillStyle = cI;
        const q = (t) => [(1 - t) * (1 - t) * 8 + 2 * (1 - t) * t * 30 + t * t * 58, (1 - t) * (1 - t) * 88 + 2 * (1 - t) * t * 0 + t * t * 26];
        for (let k = 0; k < 6; k++) { const a = q(k / 8), b = q(k / 8 + 0.07); lens(ctx, a[0], a[1], b[0], b[1], 2.6); }
        iconSeed(ctx, 62, 30, 0.75, 30, 12, 4.2);
        ctx.fillStyle = cI;
        for (const [x, y] of [[70, 50], [73, 62]]) { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, TAU); ctx.fill(); }
        break;
      }
      default: break;
    }
  }
  function drawIcon(ctx, id, size) {
    ctx.save();
    ctx.scale(size / 100, size / 100);
    if (size >= 80) { medallion(ctx); ctx.translate(50, 50); ctx.scale(0.66, 0.66); ctx.translate(-50, -50); }
    drawIconArt(ctx, id);
    ctx.restore();
  }

  /* ================================ registration ================================ */
  Cn.art('linocut', {
    init() { build(); },
    enemies: {
      spitter(ctx, e, view) {
        const aiming = e.mode === 'aim', ch = e.charge || 0, spit = e.spit || 0;
        let fr, ox = 0;
        if (aiming) { fr = 4 + Math.min(2, Math.floor(ch * 3)); ox = Math.round(Math.sin(view.rt * 70 + e.seed * 9) * 1.5 * ch) * 0.3; }
        else if (spit > 0.3) fr = 7;
        else fr = Math.floor(e.anim * 3.2) & 3;
        const g = spitGeom(fr);
        const pl = drawBody(ctx, e, view, 'spitter', fr, {
          ox,
          under: aiming ? (q) => blitRot(ctx, FX.raysT, q.x + q.f * g.mx + TX, q.y + g.y + TY, view.rt * 2, 0.3 + 0.75 * ch) : null,
        });
        if (!pl) return;
        if (spit > 0.02) {
          const t = 1 - spit;
          const mx = pl.x + pl.f * g.mx, my = pl.y + g.y;
          for (let i = 0; i < 6; i++) {
            const a = (pl.f > 0 ? 0 : Math.PI) + (((i * 0.37 + e.seed) % 1) - 0.5) * 1.0;
            const d = 2 + t * (8 + (i % 3) * 5);
            const s = (0.7 + (i % 2) * 0.4) * (0.5 + spit * 0.6);
            blitS(ctx, FX.drop, mx + Math.cos(a) * d, my + Math.sin(a) * d * 0.6 + t * t * 5, s, s);
          }
        }
      },
      bomber(ctx, e, view) {
        const fr = Math.floor(e.anim * 4.2) & 3;
        const fuse = e.armed ? e.fuse || 0 : 0;
        const blink = e.armed && Math.sin(view.rt * (5 + fuse * fuse * 26) + e.seed * 20) > 0;
        const sc = e.armed ? 1 + 0.12 * fuse + (blink ? 0.03 : 0) : 1;
        const pl = drawBody(ctx, e, view, 'bomber', fr, { sx: sc, sy: sc, inv: blink });
        if (!pl) return;
        const tx = pl.x + pl.f * BOMB_TIP[0] * sc, ty = pl.y + BOMB_TIP[1] * sc;
        const fl = 0.8 + 0.2 * Math.sin(view.rt * 37 + e.seed * 7);
        blitRot(ctx, FX.raysO, tx + MX, ty + MY, view.rt * 3, (e.armed ? 0.35 + 0.45 * fuse : 0.28) * fl);
        blitRot(ctx, FX.star, tx, ty, view.rt * 5, (e.armed ? 0.7 + 0.5 * fuse : 0.55) * fl);
      },
      charger(ctx, e, view) {
        const mode = e.mode;
        let fr, ox = 0, fi;
        if (mode === 'tele' || mode === 'dash') fi = (e.dashX || 1) < 0 ? 1 : 0;
        if (mode === 'tele') { fr = 4 + (Math.floor(view.rt * 9) & 1); ox = Math.round(Math.sin(view.rt * 80 + e.seed * 7) * 2) * 0.3 * Math.min(1, (e.modeT || 0) / 0.3); }
        else if (mode === 'dash') fr = 6 + (Math.floor(view.rt * 14) & 1);
        else if (mode === 'rest') { fr = 8; ox = Math.sin(view.rt * 5 + e.seed * 6) * 1.2; }
        else fr = Math.floor(e.anim * 2.6) & 3;
        const pl = drawBody(ctx, e, view, 'charger', fr, {
          ox, fi,
          under: mode === 'dash' ? (q) => {
            const s = setOf('charger'); const k = q.fi * 100 + fr;
            const gh = s.ghost[k] || (s.ghost[k] = tintSpr(sprN('charger', q.fi, fr, 0), cO));
            for (let i = 2; i >= 1; i--) blit(ctx, gh, q.x - (e.dashX || 0) * i * 7 + MX, q.y - (e.dashY || 0) * i * 7 + MY);
          } : mode === 'tele' ? (q) => blitRot(ctx, FX.raysO, q.x + q.f * 10.5 + MX, q.y - 15 + MY, view.rt * 2, 0.4 + 0.5 * Math.min(1, (e.modeT || 0) / 0.72)) : null,
        });
        if (!pl) return;
        if (mode === 'rest') {
          const hx = pl.x + pl.f * 8, hy = pl.y - 22;
          for (let i = 0; i < 3; i++) {
            const a = view.rt * 6 + (i / 3) * TAU;
            blitRot(ctx, FX.star, hx + Math.cos(a) * 7, hy + Math.sin(a) * 2.6, view.rt * 4 + i, 0.75);
          }
        }
      },
      mother(ctx, e, view) {
        const fr = Math.floor(e.anim * 1.8) & 3;
        const b = e.birth || 0;
        let sx = 0, sy = 0;
        if (b > 0.01) { const w = Math.sin((1 - b) * Math.PI * 3) * b; sy = 1 - 0.15 * w; sx = 1 + 0.11 * w; }
        drawBody(ctx, e, view, 'mother', fr, {
          sx, sy,
          under: b > 0.01 ? (q) => blitRot(ctx, FX.raysBig, q.x + MX, q.y - 20 + MY, (1 - b) * 1.5, 0.5 + 0.7 * (1 - b) * b + 0.3 * b) : null,
        });
      },
      sprout(ctx, e, view) {
        drawBody(ctx, e, view, 'sprout', Math.floor(e.anim * 4.2) & 3);
      },
    },
    shadow(ctx, o, view) {
      const s = SETS[o.type];
      if (!s || !s.shadow) return false;
      base(view);
      if (o.dying) return true;
      if (o.spawnT < 1) { const k = 0.3 + 0.7 * o.spawnT; blitS(ctx, s.shadow, o.x, o.y, k, k); return true; }
      blit(ctx, s.shadow, o.x, o.y + 0.5);
      return true;
    },
    shot(ctx, s, view) {
      base(view);
      const x = s.x, y = s.y - (s.z || 0);
      const a = s.angle || 0;
      blitRot(ctx, FX.trail, x, y, a, 0.5 + Math.min(0.5, (s.age || 0) * 2));
      for (let i = 1; i <= 2; i++) {
        const wob = Math.sin((s.age || 0) * 20 + i * 1.7 + (s.seed || 0) * 9) * 0.8;
        const d = 3.6 + i * 3.2;
        blitS(ctx, FX.drop, x - Math.cos(a) * d - Math.sin(a) * wob, y - Math.sin(a) * d + Math.cos(a) * wob, 1.1 - i * 0.25, 1.1 - i * 0.25);
      }
      const v = Math.floor(view.rt * 6 + (s.seed || 0) * 10) & 1;
      const wob = Math.sin((s.age || 0) * 22 + (s.seed || 0) * 10) * 0.08;
      blitRot(ctx, FX.shot[v], x, y, wob, 1);
    },
    icons: {
      leech(ctx, size) { drawIcon(ctx, 'leech', size); },
      thorns(ctx, size) { drawIcon(ctx, 'thorns', size); },
      dashup(ctx, size) { drawIcon(ctx, 'dashup', size); },
      range(ctx, size) { drawIcon(ctx, 'range', size); },
    },
  });
})();
