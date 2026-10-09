/* Holzschnitt – "Jack vs. the Turnip Ancestors" as a moving linocut / woodcut print.
   Strict ink language: cream paper, carbon-black key plate, ONE pumpkin-orange spot plate (misregistered),
   a sparing teal second spot. No gradients: tone only through carved line density, stipple and halftone. */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2;

  /* ===================================================================================== palette */
  const PAPER = [240, 231, 210];
  const INK = [27, 23, 21];
  const ORG = [234, 104, 32];
  const TEA = [46, 118, 116];
  const cP = 'rgb(240,231,210)', cI = 'rgb(27,23,21)', cO = 'rgb(234,104,32)', cT = 'rgb(46,118,116)';
  // misregistration of the spot plates (world units) – consistent everywhere
  const MX = 0.8, MY = 0.55;
  const TX = -0.55, TY = 0.45;

  let K = 2.5; // sprite pixels per world unit (matched to the display scale in init)

  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const R = (a, b, rng) => a + (b - a) * rng.next();

  /* ===================================================================================== carving toolkit */
  /** Lens / gouge mark: pointed at both ends, half-width w in the middle, centre line bent by `bend`. */
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
  /** Tapered stroke: round blunt start (half-width w), sharp point at the end. */
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
  /** Tapered limb along a smooth path through pts, width w0 -> w1. */
  function limb(ctx, pts, w0, w1) {
    const P = spline(pts, 5);
    const n = P.length, Lf = [], Rt = [];
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const l = Math.hypot(tx, ty) || 1e-6;
      tx /= l; ty /= l;
      const t = i / (n - 1);
      const w = w0 + (w1 - w0) * t;
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
  /** Adds a smooth closed subpath through pts (no beginPath). */
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
  function blobPts(cx, cy, rx, ry, n, rng, wob, rot) {
    const pts = [];
    const c = Math.cos(rot || 0), s = Math.sin(rot || 0);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const r = 1 + (rng ? (rng.next() - 0.5) * wob : 0);
      const x = Math.cos(a) * rx * r, y = Math.sin(a) * ry * r;
      pts.push([cx + x * c - y * s, cy + x * s + y * c]);
    }
    return pts;
  }
  function fillPath(ctx, fn, color) { ctx.beginPath(); fn(ctx); ctx.fillStyle = color; ctx.fill(); }
  function strokePath(ctx, fn, color, lw) { ctx.beginPath(); fn(ctx); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.stroke(); }
  function clipDo(ctx, fn, body) { ctx.save(); ctx.beginPath(); fn(ctx); ctx.clip(); body(); ctx.restore(); }
  /** Heavy woodcut contour on the shadow side: shape minus a shrunken copy shifted to the light. */
  function crescent(ctx, fn, cx, cy, dx, dy, s, color) {
    ctx.save();
    ctx.beginPath(); fn(ctx); ctx.clip();
    ctx.beginPath(); fn(ctx);
    ctx.save(); ctx.translate(cx + dx, cy + dy); ctx.scale(s, s); ctx.translate(-cx, -cy); fn(ctx); ctx.restore();
    ctx.fillStyle = color || cI;
    ctx.fill('evenodd');
    ctx.restore();
  }
  /** A hole cut in the key plate showing a (misregistered) spot plate: paper gap on one side. */
  function holeSpot(ctx, fn, color, dx, dy) {
    fillPath(ctx, fn, cP);
    ctx.save();
    ctx.beginPath(); fn(ctx); ctx.clip();
    ctx.translate(dx, dy);
    fillPath(ctx, fn, color);
    ctx.restore();
  }
  /** Gouge arc around a centre (carved light contour). */
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

  /* ===================================================================================== paper + ink textures */
  let FIB = null; // Int8Array 512² paper fibre offsets
  let VOID = null; // Uint8Array 256² ink-void noise
  function buildTextures() {
    const N = 512;
    const { c, ctx } = U.canvas(N, N);
    ctx.fillStyle = 'rgb(128,128,128)';
    ctx.fillRect(0, 0, N, N);
    const rng = U.rng(4242);
    ctx.lineCap = 'round';
    for (let i = 0; i < 1300; i++) {
      const x = rng.next() * N, y = rng.next() * N, a = rng.next() * Math.PI, L = R(4, 18, rng), b = R(-3, 3, rng);
      ctx.strokeStyle = rng.next() < 0.55 ? 'rgba(0,0,0,0.13)' : 'rgba(255,255,255,0.12)';
      ctx.lineWidth = R(0.6, 1.4, rng);
      const ca = Math.cos(a), sa = Math.sin(a);
      U.tileDraw(ctx, N, N, (cx, ox, oy) => {
        cx.beginPath();
        cx.moveTo(x + ox, y + oy);
        cx.quadraticCurveTo(x + ox + (ca * L) / 2 - sa * b, y + oy + (sa * L) / 2 + ca * b, x + ox + ca * L, y + oy + sa * L);
        cx.stroke();
      });
    }
    const data = ctx.getImageData(0, 0, N, N).data;
    FIB = new Int8Array(N * N);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const i = y * N + x;
        const fib = (data[i * 4] - 128) * 0.85;
        const mott = (U.fbmTile(x / 64, y / 64, 8, 31, 3) - 0.5) * 9;
        const grain = (U.hash2(x, y, 9) - 0.5) * 6;
        FIB[i] = U.clamp(Math.round(fib + mott + grain), -22, 14);
      }
    }
    VOID = new Uint8Array(256 * 256);
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        const v = 0.5 * U.hash2(x, y, 5) + 0.5 * U.fbmTile(x / 8, y / 8, 32, 77, 2);
        VOID[y * 256 + x] = U.clamp(Math.round(v * 300 - 40), 0, 255);
      }
    }
  }

  /* ===================================================================================== sprite pipeline */
  /** Offscreen sprite covering world rect [x0,x1]×[y0,y1] around the anchor (0,0) = feet. */
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
  /** Paper knock-out around the figure (woodcut separation from dark grounds). */
  function halo(c, r) {
    const sil = U.tint(c, cP);
    const ctx = c.getContext('2d');
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    const n = 12;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      ctx.drawImage(sil, Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.restore();
  }
  /** Uneven ink: tiny voids in black, grain in the orange plate. */
  function inkify(c, seed) {
    const ctx = c.getContext('2d');
    const w = c.width, h = c.height;
    const im = ctx.getImageData(0, 0, w, h), d = im.data;
    const sx = (seed * 37) & 255, sy = (seed * 91) & 255;
    for (let y = 0, i = 0; y < h; y++) {
      const row = ((y + sy) & 255) * 256;
      for (let x = 0; x < w; x++, i += 4) {
        if (d[i + 3] < 100) continue;
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const v = VOID[row + ((x + sx) & 255)];
        if (r < 80 && g < 80 && b < 80) {
          if (v > 238) {
            d[i] = r + (PAPER[0] - r) * 0.72; d[i + 1] = g + (PAPER[1] - g) * 0.72; d[i + 2] = b + (PAPER[2] - b) * 0.72;
          }
        } else if (r > 160 && g < 150 && b < 110 && r - b > 100) {
          const k = 0.93 + (v / 255) * 0.12;
          d[i] = Math.min(255, r * k); d[i + 1] = Math.min(255, g * k); d[i + 2] = Math.min(255, b * k);
          if (v > 245) { d[i] = r + (PAPER[0] - r) * 0.5; d[i + 1] = g + (PAPER[1] - g) * 0.5; d[i + 2] = b + (PAPER[2] - b) * 0.5; }
        }
      }
    }
    ctx.putImageData(im, 0, 0);
  }
  const LUM_I = 0.3 * INK[0] + 0.59 * INK[1] + 0.11 * INK[2];
  const LUM_P = 0.3 * PAPER[0] + 0.59 * PAPER[1] + 0.11 * PAPER[2];
  /** Negative print (hit flash): paper <-> ink, spot colours go black. */
  function invert(spr) {
    const { c, ctx } = U.canvas(spr.c.width, spr.c.height);
    ctx.drawImage(spr.c, 0, 0);
    const im = ctx.getImageData(0, 0, c.width, c.height), d = im.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      const t = mx - mn > 50 ? 1 : clamp01((0.3 * r + 0.59 * g + 0.11 * b - LUM_I) / (LUM_P - LUM_I));
      d[i] = PAPER[0] + (INK[0] - PAPER[0]) * t;
      d[i + 1] = PAPER[1] + (INK[1] - PAPER[1]) * t;
      d[i + 2] = PAPER[2] + (INK[2] - PAPER[2]) * t;
    }
    ctx.putImageData(im, 0, 0);
    return { c, ax: spr.ax, ay: spr.ay };
  }
  function tintSpr(spr, color) { return { c: U.tint(spr.c, color), ax: spr.ax, ay: spr.ay }; }
  /** Pre-cut the sprite into carved shards for the death shatter. */
  function shards(spr, n, seed, cyFrac) {
    const rng = U.rng(seed);
    const w = spr.c.width, h = spr.c.height;
    const cx = spr.ax, cy = spr.ay - (spr.ay * (cyFrac || 0.45));
    const Rr = Math.hypot(w, h);
    const a0 = rng.next() * TAU;
    const cuts = [];
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / n) * TAU + R(-0.3, 0.3, rng);
      const pts = [[cx, cy]];
      for (let k = 1; k <= 4; k++) {
        const r = (k / 4) * Rr * 0.5;
        const j = k < 4 ? R(-0.25, 0.25, rng) : 0;
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
      const poly = A.pts.slice();
      for (let k = 1; k < 6; k++) {
        const a = A.a + ((b - A.a) * k) / 6;
        poly.push([cx + Math.cos(a) * Rr, cy + Math.sin(a) * Rr]);
      }
      for (let k = B.pts.length - 1; k >= 1; k--) poly.push(B.pts[k]);
      const { c, ctx } = U.canvas(w, h);
      ctx.save();
      ctx.beginPath(); polyPath(ctx, poly); ctx.clip();
      ctx.drawImage(spr.c, 0, 0);
      ctx.restore();
      // fresh cut edges show the paper
      ctx.globalCompositeOperation = 'source-atop';
      ctx.strokeStyle = cP;
      ctx.lineWidth = K * 0.7;
      ctx.beginPath();
      ctx.moveTo(A.pts[0][0], A.pts[0][1]);
      for (const p of A.pts) ctx.lineTo(p[0], p[1]);
      ctx.moveTo(B.pts[0][0], B.pts[0][1]);
      for (const p of B.pts) ctx.lineTo(p[0], p[1]);
      ctx.stroke();
      const mid = (A.a + b) / 2;
      out.push({ c, ax: cx, ay: cy, dx: Math.cos(mid), dy: Math.sin(mid) });
    }
    return out;
  }

  /* drawing to the world: 1:1 pixel blits */
  let BX = 0, BY = 0, BS = 1;
  function base(view) { BS = view.S; BX = view.W / 2 - view.x * BS; BY = view.H / 2 - view.y * BS; }
  function blit(ctx, s, x, y) {
    const k = 1 / K;
    const dx = Math.round((x - s.ax * k) * BS) / BS, dy = Math.round((y - s.ay * k) * BS) / BS;
    ctx.drawImage(s.c, dx, dy, s.c.width * k, s.c.height * k);
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

  /* ===================================================================================== characters */
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

  /* ---------- Jack ---------- */
  function drawJack(ctx, f, fr, rng) {
    const J = (s) => (rng.next() - 0.5) * s;
    const b = fr.bob;
    ctx.save();
    ctx.scale(f, 1);
    const ox = MX * f, oy = MY;
    ctx.fillStyle = cI;
    // legs + boots
    const leg = (hx, hy, fx, fy) => {
      ctx.fillStyle = cI;
      limb(ctx, [[hx, hy], [(hx + fx) / 2 + 0.2, (hy + fy) / 2], [fx, fy - 0.9]], 1.15, 0.9);
      ctx.beginPath(); ctx.ellipse(fx + 0.55, fy - 0.85, 1.8, 1.05, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = cP;
      lens(ctx, fx - 0.4, fy - 1.45, fx + 1.2, fy - 1.5, 0.18, -0.1);
    };
    leg(-1.6, -6.0 + b, fr.fb[0], fr.fb[1]);
    leg(1.8, -6.0 + b, fr.fa[0], fr.fa[1]);
    // scarf tail (behind)
    const st = fr.scarf;
    const scarf = (c) => {
      c.moveTo(-2.0, -16.2 + b);
      c.quadraticCurveTo(-5.6, -16.4 + b + st * 0.4, -9.4, -14.6 + b + st);
      c.lineTo(-9.0, -12.9 + b + st);
      c.quadraticCurveTo(-5.4, -14.4 + b + st * 0.3, -2.4, -14.4 + b);
      c.closePath();
    };
    fillPath(ctx, scarf, cP);
    strokePath(ctx, scarf, cI, 0.5);
    ctx.fillStyle = cI;
    lens(ctx, -5.2, -16.0 + b + st * 0.25, -5.0, -14.0 + b + st * 0.2, 0.42);
    lens(ctx, -7.4, -15.6 + b + st * 0.6, -7.2, -13.6 + b + st * 0.55, 0.38);
    for (let i = 0; i < 3; i++) taper(ctx, -9.1, -14.2 + b + st + i * 0.5, -10.6 + J(0.3), -14.2 + b + st + i * 0.7 + 0.3, 0.22);
    // cloak
    const hem = fr.hem;
    const cl = [
      [-3.5, -15.8 + b], [3.8, -15.8 + b], [5.9, -11.2 + b], [7.3, -5.4 + b],
      [5.5, -4.8 + b], [4.4, -3.6 + b], [2.8, -4.6 + b], [1.1, -3.4 + b], [-0.9, -4.4 + b],
      [-2.9, -3.3 + b + hem * 0.3], [-4.9, -4.2 + b + hem * 0.5], [-7.0 + hem, -3.2 + b + hem * 0.5],
      [-6.4 + hem * 0.6, -8.8 + b], [-4.9, -13.4 + b],
    ].map((p) => [p[0] + J(0.25), p[1] + J(0.25)]);
    const cloak = (c) => polyPath(c, cl);
    fillPath(ctx, cloak, cI);
    strokePath(ctx, cloak, cI, 0.35);
    // carved folds on the lit side
    ctx.fillStyle = cP;
    lens(ctx, -4.6 + J(0.3), -4.6 + b, -3.0, -12.4 + b, 0.44, -0.35);
    lens(ctx, -2.2 + J(0.3), -4.2 + b, -1.4, -10.6 + b, 0.34, -0.2);
    lens(ctx, 0.6 + J(0.3), -4.0 + b, 0.8, -8.4 + b, 0.26, -0.1);
    lens(ctx, -2.8, -14.8 + b, 0.4, -15.2 + b, 0.22, -0.1);
    // arm separation + hand
    lens(ctx, 2.9, -13.4 + b, 4.4, -9.6 + b, 0.2, 0.2);
    const hx = 5.6 + fr.arm, hy = -8.8 + b;
    fillPath(ctx, (c) => c.arc(hx, hy, 1.25, 0, TAU), cP);
    strokePath(ctx, (c) => c.arc(hx, hy, 1.25, 0, TAU), cI, 0.45);
    ctx.fillStyle = cI;
    lens(ctx, hx - 0.2, hy + 0.2, hx + 1.0, hy + 0.9, 0.3);
    // scarf wrap at the neck
    const wrap = (c) => {
      c.moveTo(-4.6, -16.6 + b);
      c.quadraticCurveTo(0.4, -15.2 + b, 4.9, -16.6 + b);
      c.lineTo(4.6, -14.6 + b);
      c.quadraticCurveTo(0.4, -13.0 + b, -4.3, -14.6 + b);
      c.closePath();
    };
    fillPath(ctx, wrap, cP);
    strokePath(ctx, wrap, cI, 0.45);
    ctx.fillStyle = cI;
    for (const x of [-2.6, 0.2, 3.0]) lens(ctx, x - 0.2, -16.2 + b, x + 0.3, -14.0 + b, 0.38);

    // pumpkin head
    const hx0 = 0.7 + J(0.15), hy0 = -21.6 + b + fr.head, rx = 7.3, ry = 6.2;
    const pts = [];
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * TAU;
      const lobe = 1 - 0.05 * Math.abs(Math.sin(a * 2.5 + 0.4)) + J(0.035);
      const x = Math.cos(a) * rx * lobe;
      let y = Math.sin(a) * ry * lobe;
      if (y < 0) y *= 1 - 0.13 * Math.exp(-(x * x) / 5);
      pts.push([hx0 + x, hy0 + y]);
    }
    const head = (c) => smoothPath(c, pts);
    fillPath(ctx, head, cP);
    ctx.save(); ctx.translate(ox, oy); fillPath(ctx, head, cO); ctx.restore();
    // ribs + shading hatch (clipped)
    clipDo(ctx, head, () => {
      ctx.fillStyle = cI;
      for (const xr of [-0.62, -0.24, 0.24, 0.62]) {
        lens(ctx, hx0 + xr * rx * 0.8, hy0 - ry * 0.98, hx0 + xr * rx * 0.86 + J(0.2), hy0 + ry * 0.98, xr > 0 ? 0.34 : 0.26, -xr * rx * 0.3 * (xr > 0 ? -1 : 1) * 0.0 + xr * 1.6);
      }
      for (let i = 0; i < 6; i++) {
        const x = hx0 + rx * (0.36 + i * 0.105);
        lens(ctx, x - 0.5, hy0 - ry * 0.75 + i * 0.35, x + 0.1, hy0 + ry * 1.05, 0.16 + i * 0.055, 0.45);
      }
      for (let i = 0; i < 4; i++) {
        const y = hy0 + ry * (0.55 + i * 0.13);
        lens(ctx, hx0 - rx * 0.55 + i * 0.4, y, hx0 + rx * 0.75, y + 0.2, 0.12 + i * 0.05, 0.5);
      }
    });
    crescent(ctx, head, hx0, hy0, -1.0, -0.85, 0.93, cI);
    strokePath(ctx, head, cI, 0.75);
    // carved face
    const fx = hx0 + 0.95;
    ctx.fillStyle = cI;
    fillPath(ctx, (c) => polyPath(c, [[fx - 4.0, hy0 - 0.2], [fx - 0.9, hy0 - 0.45], [fx - 2.6 + J(0.2), hy0 - 3.4]]), cI);
    fillPath(ctx, (c) => polyPath(c, [[fx + 0.8, hy0 - 0.45], [fx + 3.9, hy0 - 0.2], [fx + 2.2 + J(0.2), hy0 - 3.4]]), cI);
    fillPath(ctx, (c) => polyPath(c, [[fx - 0.65, hy0 + 1.0], [fx + 0.65, hy0 + 1.0], [fx, hy0 - 0.1]]), cI);
    const mouth = (c) => {
      c.moveTo(fx - 4.7, hy0 + 1.5);
      c.lineTo(fx - 3.6, hy0 + 2.3);
      c.lineTo(fx - 2.6, hy0 + 2.0);
      c.lineTo(fx - 2.4, hy0 + 2.9);
      c.lineTo(fx - 1.0, hy0 + 3.1);
      c.lineTo(fx - 0.8, hy0 + 2.4);
      c.lineTo(fx + 0.9, hy0 + 2.5);
      c.lineTo(fx + 1.1, hy0 + 3.2);
      c.lineTo(fx + 2.5, hy0 + 2.8);
      c.lineTo(fx + 2.7, hy0 + 2.0);
      c.lineTo(fx + 3.7, hy0 + 2.2);
      c.lineTo(fx + 4.7, hy0 + 1.4);
      c.quadraticCurveTo(fx + 3.4, hy0 + 5.6, fx + 0.1, hy0 + 5.2);
      c.lineTo(fx + 0.2, hy0 + 4.5);
      c.lineTo(fx - 0.9, hy0 + 4.5);
      c.lineTo(fx - 0.9, hy0 + 5.2);
      c.quadraticCurveTo(fx - 3.6, hy0 + 5.0, fx - 4.7, hy0 + 1.5);
      c.closePath();
    };
    fillPath(ctx, mouth, cI);
    // gouge highlights (light from upper left)
    ctx.fillStyle = cP;
    lens(ctx, hx0 - 6.0, hy0 - 0.4, hx0 - 4.5 + J(0.2), hy0 - 4.3, 0.42, -0.4);
    lens(ctx, hx0 - 3.7, hy0 - 4.5, hx0 - 1.5, hy0 - 5.5 + J(0.2), 0.3, -0.25);
    lens(ctx, hx0 - 6.2, hy0 + 1.4, hx0 - 5.9, hy0 + 2.8, 0.2, -0.1);
    // stem + leaf
    ctx.fillStyle = cI;
    taper(ctx, hx0 + 0.2, hy0 - ry + 1.0, hx0 + 1.9 + J(0.3), hy0 - ry - 2.9, 1.1, -0.5);
    ctx.fillStyle = cP;
    lens(ctx, hx0 - 0.1, hy0 - ry + 0.2, hx0 + 0.8, hy0 - ry - 1.8, 0.16, -0.2);
    leaf(ctx, hx0 + 0.6, hy0 - ry - 0.3, hx0 - 3.6 + J(0.3), hy0 - ry - 1.6 + fr.leaf, 0.85, -0.5);
    ctx.restore();
  }
  const JACK_WALK = [
    { fa: [3.3, 0], fb: [-3.0, 0], bob: 0, hem: 0.8, scarf: 0.5, arm: 0.4, head: 0, leaf: 0 },
    { fa: [1.0, 0], fb: [-0.4, -1.5], bob: -0.8, hem: 0.2, scarf: -0.6, arm: 0, head: 0.2, leaf: -0.4 },
    { fa: [-2.7, 0], fb: [3.0, 0], bob: 0, hem: 0.9, scarf: 0.6, arm: -0.4, head: 0, leaf: 0.2 },
    { fa: [0.6, -1.5], fb: [-0.2, 0], bob: -0.8, hem: 0.1, scarf: -0.5, arm: 0, head: 0.2, leaf: -0.3 },
  ];
  const JACK_IDLE = [
    { fa: [2.0, 0], fb: [-1.6, 0], bob: 0, hem: 0, scarf: 0, arm: 0, head: 0, leaf: 0 },
    { fa: [2.0, 0], fb: [-1.6, 0], bob: 0.35, hem: 0.2, scarf: 0.4, arm: 0, head: 0.25, leaf: 0.3 },
  ];

  /* ---------- Rüben-Schleicher ---------- */
  function drawCreeper(ctx, f, i, rng) {
    const J = (s) => (rng.next() - 0.5) * s;
    const ph = (i / 4) * TAU;
    const bob = -0.75 * Math.abs(Math.sin(ph));
    const tilt = 0.075 * Math.cos(ph);
    ctx.save();
    ctx.scale(f, 1);
    // root legs
    const fa = [2.7 + 1.5 * Math.cos(ph), -Math.max(0, Math.sin(ph)) * 1.4];
    const fb = [-2.2 + 1.5 * Math.cos(ph + Math.PI), -Math.max(0, Math.sin(ph + Math.PI)) * 1.4];
    ctx.fillStyle = cI;
    for (const [hx, ft] of [[-2.0, fb], [2.2, fa]]) {
      limb(ctx, [[hx, -5.4 + bob], [(hx + ft[0]) / 2, -2.8 + bob * 0.5 + ft[1] * 0.5], [ft[0], ft[1] - 0.4]], 0.85, 0.55);
      taper(ctx, ft[0], ft[1] - 0.4, ft[0] + 1.9, ft[1] + 0.1, 0.42, 0.1);
      taper(ctx, ft[0], ft[1] - 0.4, ft[0] - 1.1, ft[1] + 0.2, 0.36, -0.1);
    }
    ctx.save();
    ctx.translate(0, -4.5 + bob);
    ctx.rotate(tilt);
    ctx.translate(0, 4.5);
    // leaves (behind the bulb)
    const sw = Math.sin(ph) * 0.7;
    leaf(ctx, -0.4, -18.2, -6.0 + sw + J(0.4), -24.6, 1.45, -0.7);
    leaf(ctx, 0.6, -18.6, 1.6 + sw * 0.6 + J(0.4), -26.4, 1.5, 0.5);
    leaf(ctx, 1.2, -18.2, 6.8 + sw * 0.4 + J(0.4), -23.4, 1.35, 0.8);
    ctx.fillStyle = cI;
    lens(ctx, -3.6 + sw * 0.5, -22.0, -5.6 + sw, -21.4, 0.55, 0.3);
    lens(ctx, 4.0 + sw * 0.3, -21.0, 6.2 + sw * 0.4, -21.6, 0.5, -0.3);
    // bulb
    const pts = [[0, -19.6], [3.7, -19.0], [6.5, -16.6], [7.7, -12.8], [7.2, -9.0], [5.2, -6.1], [2.4, -4.6], [0.5, -3.3],
      [-1.9, -4.6], [-4.9, -6.3], [-7.1, -9.2], [-7.6, -13.0], [-6.3, -16.7], [-3.5, -19.0]].map((p) => [p[0] + J(0.3), p[1] + J(0.3)]);
    const body = (c) => smoothPath(c, pts);
    fillPath(ctx, body, cP);
    const ex = 1.0; // face shift towards facing
    clipDo(ctx, body, () => {
      // dark (purple) crown of the turnip – solid ink above a wavy line
      const wy = (x) => -12.4 + 0.45 * Math.sin(x * 0.95 + 0.6);
      ctx.beginPath();
      ctx.moveTo(-9, -25);
      ctx.lineTo(9, -25);
      for (let x = 9; x >= -9; x -= 0.5) ctx.lineTo(x, wy(x));
      ctx.closePath();
      ctx.fillStyle = cI;
      ctx.fill();
      // engraved comb transition into the light underside
      for (let x = -6.8; x <= 6.9; x += 1.1) {
        const len = 1.0 + 2.6 * ((x + 7) / 14) + J(0.8);
        taper(ctx, x, wy(x) - 0.2, x + 0.25, wy(x) + len, 0.4);
      }
      // carved light on the crown
      ctx.fillStyle = cP;
      lens(ctx, -6.6, -13.6, -3.6 + J(0.3), -18.0, 0.34, -0.6);
      lens(ctx, -4.6, -16.8, -0.6 + J(0.3), -19.1, 0.26, -0.45);
      lens(ctx, 3.0, -18.5, 5.4, -16.6, 0.17, -0.3);
      // underside contours (shadow side)
      ctx.fillStyle = cI;
      lens(ctx, 3.4, -6.6, 6.7, -10.2, 0.24, 0.45);
      lens(ctx, 1.4, -5.0, 5.0, -7.2, 0.2, 0.3);
      lens(ctx, -5.9, -7.6, -6.9, -10.0, 0.12, -0.2);
    });
    // angry carved eyes in the dark crown
    const e1x = -1.5 + ex, e2x = 2.6 + ex, ey = -14.3;
    ctx.fillStyle = cP;
    lens(ctx, e1x - 1.45, ey - 0.75, e1x + 1.25, ey + 0.45, 0.78, 0.18);
    lens(ctx, e2x - 1.25, ey + 0.45, e2x + 1.45, ey - 0.75, 0.78, 0.18);
    ctx.fillStyle = cI;
    ctx.beginPath(); ctx.arc(e1x + 0.35, ey + 0.05, 0.5, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(e2x + 0.35, ey + 0.05, 0.5, 0, TAU); ctx.fill();
    // grimace with teeth
    const my = -9.2;
    lens(ctx, -2.0 + ex, my, 3.4 + ex, my - 0.25, 0.85, -0.35);
    ctx.fillStyle = cP;
    for (const tx of [-0.5, 1.6]) {
      ctx.beginPath();
      ctx.moveTo(tx + ex - 0.42, my - 0.95);
      ctx.lineTo(tx + ex + 0.42, my - 0.95);
      ctx.lineTo(tx + ex, my - 0.1);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = cI;
    // outline + shadow weight
    crescent(ctx, body, 0, -12, -0.9, -0.8, 0.94, cI);
    strokePath(ctx, body, cI, 0.7);
    // root hairs + tap root
    taper(ctx, -6.9, -8.6, -8.6, -8.0, 0.24);
    taper(ctx, 6.9, -8.0, 8.6, -7.2, 0.24);
    limb(ctx, [[0.5, -3.6], [-0.5, -2.2], [0.6, -1.2]], 0.36, 0.06);
    ctx.restore();
    ctx.restore();
  }

  /* ---------- Hungergeist ---------- */
  function drawGhost(ctx, f, i, rng) {
    const J = (s) => (rng.next() - 0.5) * s;
    const ph = (i / 4) * TAU;
    const tipX = -9.2 + Math.cos(ph) * 0.8, tipY = -8.4 + Math.sin(ph) * 1.4;
    ctx.save();
    ctx.scale(f, 1);
    const reach = Math.sin(ph) * 0.6;
    // back arm
    ctx.fillStyle = cI;
    limb(ctx, [[3.6, -11.6], [6.5, -10.8 + reach * 0.3], [8.8 + reach, -10.0]], 0.42, 0.28);
    for (let k = 0; k < 3; k++) taper(ctx, 8.8 + reach, -10.0, 10.2 + reach, -10.6 + k * 0.7, 0.2);
    const body = (c) => {
      c.moveTo(0.4, -24.0);
      c.quadraticCurveTo(6.6, -23.6, 6.3, -16.6);
      c.quadraticCurveTo(6.0, -10.6, 2.6, -7.6);
      c.quadraticCurveTo(-1.6, -5.0, tipX, tipY);
      c.quadraticCurveTo(-4.4, -8.4 + Math.sin(ph) * 0.4, -5.2, -12.0);
      c.quadraticCurveTo(-6.2, -15.6, -5.6, -18.6);
      c.quadraticCurveTo(-4.4, -24.2, 0.4, -24.0);
      c.closePath();
    };
    fillPath(ctx, body, cP);
    clipDo(ctx, body, () => {
      // frost: teal stipple on the shadow side (offset plate)
      ctx.save();
      ctx.translate(TX * f, TY);
      ctx.fillStyle = cT;
      const r2 = U.rng(9001 + i);
      for (let k = 0; k < 230; k++) {
        const x = R(-7, 7, r2), y = R(-24, -5, r2);
        const shade = clamp01((x + 0.5) / 6.5) * 0.85 + clamp01((y + 11) / 6) * 0.5;
        if (r2.next() < shade * 0.75) { ctx.beginPath(); ctx.arc(x, y, R(0.26, 0.42, r2), 0, TAU); ctx.fill(); }
      }
      ctx.restore();
      ctx.fillStyle = cI;
      for (let k = 0; k < 4; k++) lens(ctx, 4.4 + k * 0.5, -20.5 + k * 0.6, 3.6 + k * 0.6, -9.0 + k * 0.3, 0.14 + k * 0.03, 1.1);
    });
    crescent(ctx, body, 0.5, -15, -0.7, -0.6, 0.95, cI);
    strokePath(ctx, body, cI, 0.62);
    // hollow eyes, gaping mouth
    const fx = 1.3;
    ctx.fillStyle = cI;
    ctx.beginPath(); ctx.ellipse(-1.0 + fx, -17.6, 1.25, 1.95, 0.22, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(2.75 + fx, -17.5, 1.15, 1.8, -0.18, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(1.0 + fx, -12.6, 1.05 + J(0.15), 1.9, 0.05, 0, TAU); ctx.fill();
    lens(ctx, -2.6 + fx, -20.0, -0.3 + fx, -21.0, 0.2, -0.1);
    lens(ctx, 1.9 + fx, -21.0, 4.0 + fx, -20.1, 0.2, -0.1);
    ctx.fillStyle = cP;
    ctx.beginPath(); ctx.arc(-1.3 + fx, -18.3, 0.3, 0, TAU); ctx.fill();
    // front arm reaching
    ctx.fillStyle = cI;
    limb(ctx, [[5.2, -13.6], [8.0, -13.6 - reach * 0.3], [10.4 + reach, -13.0]], 0.46, 0.3);
    for (let k = 0; k < 3; k++) taper(ctx, 10.4 + reach, -13.0, 12.0 + reach, -13.8 + k * 0.75, 0.21);
    // tail dissolving into halftone
    for (let k = 1; k <= 3; k++) {
      ctx.beginPath();
      ctx.arc(tipX - k * 1.25, tipY + k * 0.4 * Math.sin(ph + k), 0.5 - k * 0.11, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ---------- Steckrüben-Koloss ---------- */
  function drawColossus(ctx, f, i, rng) {
    const J = (s) => (rng.next() - 0.5) * s;
    const ph = (i / 4) * TAU;
    const liftA = Math.max(0, Math.sin(ph)) * 3.0, liftB = Math.max(0, -Math.sin(ph)) * 3.0;
    const bob = -Math.abs(Math.sin(ph)) * 1.2;
    const sw = Math.cos(ph) * 1.6;
    ctx.save();
    ctx.scale(f, 1);
    ctx.fillStyle = cI;
    // legs with root toes
    const legC = (hx, fx, lift) => {
      ctx.fillStyle = cI;
      limb(ctx, [[hx, -12 + bob], [(hx + fx) / 2 + 0.6, -6.5 - lift * 0.5], [fx, -1.2 - lift]], 3.1, 2.3);
      for (const [tx, ty] of [[3.6, 0.6], [0.6, 1.0], [-2.6, 0.6]]) taper(ctx, fx + tx * 0.2, -1.0 - lift, fx + tx, -0.2 - lift + ty * 0.3, 1.05);
      ctx.fillStyle = cP;
      lens(ctx, hx - 2.0, -11 + bob, fx - 1.6, -3.0 - lift, 0.3, -0.3);
    };
    // back arm
    const arm = (sx, swing, back) => {
      ctx.fillStyle = cI;
      const hx = sx * 18.6 + swing, hy = -15.2;
      limb(ctx, [[sx * 13.6, -32 + bob], [sx * 17.8, -25.5 + bob], [hx, hy + bob]], 3.1, 1.8);
      for (const d of [-1.2, 0, 1.2]) taper(ctx, hx, hy + bob, hx + d * 1.3 + sx * 0.4, hy + 4.2 + bob - Math.abs(d) * 0.5, 0.9);
      if (!back) {
        ctx.fillStyle = cP;
        lens(ctx, sx * 13.0 - 0.6, -30 + bob, sx * 16.2 - 1.2, -22 + bob, 0.32, -0.6 * sx);
      }
    };
    arm(-1, -sw, true);
    legC(-6.8, -8.6, liftB);
    legC(6.8, 8.6, liftA);
    // crown leaves (behind body top)
    const lv = [[-10.0, -49.0], [-4.8, -53.6], [1.4, -55.2], [6.6, -52.6], [10.6, -47.6]];
    for (let k = 0; k < lv.length; k++) leaf(ctx, 0 + (k - 2) * 0.8, -40.5, lv[k][0] + J(0.6) + sw * 0.15, lv[k][1] + J(0.6), 2.1, (k - 2) * 0.35);
    // body
    const pts = blobPts(0, -27 + bob, 15.6, 16.4, 18, rng, 0.07).map((p) => {
      // narrow top (turnip crown)
      const t = clamp01((-p[1] - 36) / 8);
      return [p[0] * (1 - t * 0.38), p[1]];
    });
    const body = (c) => smoothPath(c, pts);
    fillPath(ctx, body, cI);
    clipDo(ctx, body, () => {
      ctx.fillStyle = cP;
      // carved light contours on the upper-left
      for (let k = 0; k < 6; k++) arcLens(ctx, 1.0, -26 + bob, 14.4 - k * 2.3, Math.PI * (1.08 + k * 0.02), Math.PI * (1.42 - k * 0.025), 0.55 - k * 0.06);
      for (let k = 0; k < 3; k++) arcLens(ctx, 1.0, -26 + bob, 14.6 - k * 2.0, Math.PI * 0.62, Math.PI * (0.86 - k * 0.04), 0.3 - k * 0.06);
      // cracks from the core
      const cr = U.rng(77 + i);
      for (let k = 0; k < 5; k++) {
        let a = (k / 5) * TAU + R(-0.3, 0.3, cr), x = 3.2 + Math.cos(a) * 6.8, y = -25 + bob + Math.sin(a) * 6.8;
        const p = [[x, y]];
        for (let s = 0; s < 3; s++) { a += R(-0.6, 0.6, cr); x += Math.cos(a) * R(2.4, 3.8, cr); y += Math.sin(a) * R(2.4, 3.8, cr); p.push([x, y]); }
        limb(ctx, p, 0.42, 0.06);
      }
    });
    crescent(ctx, body, 0, -27 + bob, 0.9, 0.5, 0.96, cP); // thin carved rim on the lit edge
    ctx.fillStyle = cI;
    // glowing core: orange plate in a hole, teal ring, carved rays
    const cx = 3.2, cy = -25 + bob;
    holeSpot(ctx, (c) => { c.arc(cx, cy, 6.0, 0, TAU); c.arc(cx, cy, 4.9, 0, TAU, true); }, cT, TX, TY);
    holeSpot(ctx, (c) => c.arc(cx, cy, 3.7, 0, TAU), cO, MX * f, MY);
    ctx.fillStyle = cP;
    star(ctx, cx, cy, 4, 2.0, 0.55, 0.2);
    ctx.fill();
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * TAU + 0.15;
      const r0 = 6.9, r1 = k & 1 ? 8.6 : 9.6;
      lens(ctx, cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, 0.32);
    }
    // eyes + crack mouth
    const ex = 2.0;
    lens(ctx, -4.4 + ex, -37.0 + bob, -0.6 + ex, -35.8 + bob, 0.85, 0.15);
    lens(ctx, 2.0 + ex, -35.8 + bob, 5.8 + ex, -37.2 + bob, 0.85, 0.15);
    limb(ctx, [[-3.6 + ex, -31.4 + bob], [-1.6 + ex, -30.4 + bob], [0.4 + ex, -31.4 + bob], [2.4 + ex, -30.4 + bob], [4.6 + ex, -31.6 + bob]], 0.5, 0.3);
    ctx.fillStyle = cI;
    ctx.beginPath(); ctx.arc(-2.2 + ex, -36.3 + bob, 0.42, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(4.2 + ex, -36.4 + bob, 0.42, 0, TAU); ctx.fill();
    // front arm
    arm(1, sw, false);
    ctx.restore();
  }

  /* ---------- small things ---------- */
  function drawSeedBody(ctx, plate) {
    if (plate) {
      fillPath(ctx, (c) => { c.moveTo(-3.0, 0); c.quadraticCurveTo(-0.6, -2.9, 3.4, 0); c.quadraticCurveTo(-0.6, 2.9, -3.0, 0); c.closePath(); }, cO);
      return;
    }
    const seed = (c) => { c.moveTo(-3.0, 0); c.quadraticCurveTo(-0.6, -2.9, 3.4, 0); c.quadraticCurveTo(-0.6, 2.9, -3.0, 0); c.closePath(); };
    strokePath(ctx, seed, cI, 0.62);
    ctx.fillStyle = cI;
    lens(ctx, -2.2, 0.4, 2.6, 0.5, 0.42, 0.55);
    ctx.fillStyle = cP;
    lens(ctx, -1.8, -0.55, 1.6, -0.9, 0.24, -0.25);
  }
  function drawTurnipLantern(ctx, rng, sc) {
    const J = (s) => (rng.next() - 0.5) * s;
    ctx.save();
    ctx.scale(sc, sc);
    // handle
    ctx.strokeStyle = cI;
    ctx.lineWidth = 0.45;
    ctx.beginPath(); ctx.arc(0, -9.2, 2.6, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    leaf(ctx, 0.0, -8.6, -2.4 + J(0.3), -11.6, 0.6, -0.3, false);
    leaf(ctx, 0.3, -8.6, 2.0 + J(0.3), -11.8, 0.55, 0.3, false);
    const pts = [[0, -9.0], [3.0, -8.2], [4.6, -5.2], [4.0, -2.0], [1.8, -0.4], [0.2, 0.6], [-1.6, -0.4], [-4.0, -2.0], [-4.6, -5.2], [-3.0, -8.2]]
      .map((p) => [p[0] + J(0.2), p[1] + J(0.2)]);
    const body = (c) => smoothPath(c, pts);
    fillPath(ctx, body, cP);
    clipDo(ctx, body, () => {
      ctx.fillStyle = cI;
      ctx.beginPath();
      ctx.moveTo(-6, -12); ctx.lineTo(6, -12);
      for (let x = 6; x >= -6; x -= 0.5) ctx.lineTo(x, -6.6 + 0.35 * Math.sin(x * 1.3));
      ctx.closePath(); ctx.fill();
      for (let x = -4.2; x <= 4.4; x += 1.0) taper(ctx, x, -6.8, x + 0.2, -5.2 + (x + 4) * 0.15, 0.3);
      ctx.fillStyle = cP;
      lens(ctx, -3.8, -6.8, -1.6, -8.6, 0.22, -0.3);
    });
    // glowing face holes (orange plate, misregistered)
    holeSpot(ctx, (c) => {
      polyPath(c, [[-2.6, -3.9], [-0.6, -4.0], [-1.6, -5.9]]);
      polyPath(c, [[0.8, -4.0], [2.8, -3.9], [1.8, -5.9]]);
      c.moveTo(-2.8, -2.6); c.lineTo(-1.6, -2.0); c.lineTo(-0.6, -2.5); c.lineTo(0.4, -2.0); c.lineTo(1.6, -2.5); c.lineTo(2.9, -2.6);
      c.quadraticCurveTo(0.2, -0.0, -2.8, -2.6); c.closePath();
    }, cO, MX, MY);
    crescent(ctx, body, 0, -4.4, -0.6, -0.5, 0.93, cI);
    strokePath(ctx, body, cI, 0.5);
    ctx.restore();
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
  function drawGemArt(ctx, big, fr) {
    if (!big) {
      ctx.fillStyle = cI;
      const L = fr ? 4.6 : 3.8;
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * TAU + Math.PI / 4;
        lens(ctx, Math.cos(a) * 3.1, Math.sin(a) * 3.1 - 3, Math.cos(a) * L, Math.sin(a) * L - 3, 0.22);
      }
      ctx.save(); ctx.translate(MX, MY);
      star(ctx, 0, -3, 4, 3.0, 1.05, 0); ctx.fillStyle = cO; ctx.fill();
      ctx.restore();
      star(ctx, 0, -3, 4, 3.0, 1.05, 0); ctx.strokeStyle = cI; ctx.lineWidth = 0.55; ctx.stroke();
      ctx.fillStyle = cP;
      lens(ctx, -0.25, -5.2, -0.15, -3.4, 0.22);
    } else {
      ctx.fillStyle = cI;
      const L = fr ? 8.4 : 7.2;
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * TAU + Math.PI / 8;
        lens(ctx, Math.cos(a) * 5.6, Math.sin(a) * 5.6 - 5, Math.cos(a) * L, Math.sin(a) * L - 5, 0.3);
      }
      ctx.save(); ctx.translate(MX, MY);
      star(ctx, 0, -5, 8, 5.0, 2.6, 0); ctx.fillStyle = cO; ctx.fill();
      ctx.restore();
      star(ctx, 0, -5, 8, 5.0, 2.6, 0); ctx.strokeStyle = cI; ctx.lineWidth = 0.7; ctx.stroke();
      holeSpot(ctx, (c) => c.arc(0, -5, 1.7, 0, TAU), cT, TX, TY);
      ctx.fillStyle = cP;
      lens(ctx, -2.6, -6.2, -1.2, -8.2, 0.3, -0.2);
    }
  }
  /** Hatched cast shadow: horizontal gouge lines filling an ellipse (light from the upper left). */
  function drawShadowArt(ctx, rx, ry) {
    const n = Math.max(3, Math.round(ry / 0.75));
    ctx.fillStyle = cI;
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n * 2 - 1;
      const y = t * ry;
      const hw = rx * Math.sqrt(1 - t * t) * 1.02;
      lens(ctx, -hw + rx * 0.12, y, hw + rx * 0.12, y, 0.33 + (1 - Math.abs(t)) * 0.12);
    }
  }
  function drawSplatArt(ctx, rng, r) {
    ctx.fillStyle = cI;
    const pts = [];
    const n = 14;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU + R(-0.1, 0.1, rng);
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

  /* ===================================================================================== props art */
  function branch(ctx, x, y, a, len, w, d, rng, gouges) {
    const pts = [[x, y]];
    let cx = x, cy = y;
    for (let i = 0; i < 3; i++) {
      a += R(-0.34, 0.34, rng);
      a = U.clamp(a, -Math.PI + 0.12, -0.12);
      cx += (Math.cos(a) * len) / 3;
      cy += (Math.sin(a) * len) / 3;
      pts.push([cx, cy]);
    }
    ctx.fillStyle = cI;
    limb(ctx, pts, w, w * 0.58);
    if (w > 1.25) gouges.push([pts, w]);
    if (d > 0) {
      const k = d >= 2 && rng.next() < 0.45 ? 3 : 2;
      for (let i = 0; i < k; i++) branch(ctx, cx, cy, a + R(-0.85, 0.85, rng), len * R(0.55, 0.76, rng), w * 0.6, d - 1, rng, gouges);
    } else if (rng.next() < 0.5) {
      taper(ctx, cx, cy, cx + R(-2, 2, rng), cy - R(1.5, 3, rng), w * 0.5, R(-0.5, 0.5, rng));
    }
  }
  function gougeLimbs(ctx, gouges) {
    ctx.fillStyle = cP;
    for (const [pts, w] of gouges) {
      const a = pts[0], b = pts[pts.length - 1];
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
      // offset towards the light (upper left)
      let nx = -dy / L, ny = dx / L;
      if (nx * -0.7 + ny * -0.7 < 0) { nx = -nx; ny = -ny; }
      const o = w * 0.38;
      lens(ctx, a[0] + nx * o + dx * 0.12, a[1] + ny * o + dy * 0.12, b[0] + nx * o * 0.5 - dx * 0.1, b[1] + ny * o * 0.5 - dy * 0.1, Math.max(0.16, w * 0.13), 0);
    }
  }
  function roots(ctx, rng, spread, w) {
    ctx.fillStyle = cI;
    for (const s of [-1, 1]) {
      for (let i = 0; i < 2; i++) {
        const ex = s * R(spread * 0.55, spread, rng), ey = R(-0.4, 1.0, rng);
        limb(ctx, [[s * R(0.5, 2.5, rng), -3.5], [s * R(spread * 0.3, spread * 0.45, rng), -0.8], [ex, ey]], w, 0.12);
      }
    }
  }
  function artOak(ctx, rng) {
    roots(ctx, rng, 12, 1.5);
    const trunk = [[0, 0.5], [R(-1.4, 1.4, rng), -9], [R(-2.2, 2.2, rng), -18], [R(-1.2, 1.2, rng), -27]];
    ctx.fillStyle = cI;
    limb(ctx, trunk, 4.4, 3.0);
    const gouges = [];
    const top = trunk[3];
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i - 1) * R(0.55, 0.85, rng) + R(-0.15, 0.15, rng);
      branch(ctx, top[0], top[1], a, R(15, 21, rng), 2.6, 3, rng, gouges);
    }
    const side = rng.next() < 0.5 ? -1 : 1;
    branch(ctx, trunk[2][0], trunk[2][1], -Math.PI / 2 + side * 1.15, R(10, 13, rng), 1.6, 2, rng, gouges);
    gougeLimbs(ctx, gouges);
    ctx.fillStyle = cP;
    for (let i = 0; i < 6; i++) {
      const y0 = R(-24, -3, rng), x0 = R(-3.0, -0.5, rng);
      lens(ctx, x0, y0, x0 + R(-0.5, 0.5, rng), y0 - R(4, 8, rng), R(0.22, 0.4, rng), R(-0.3, 0.3, rng));
    }
    // knot hole
    const ky = R(-20, -12, rng);
    ctx.beginPath(); ctx.ellipse(1.0, ky, 1.2, 1.8, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = cI;
    ctx.beginPath(); ctx.ellipse(1.15, ky + 0.15, 0.7, 1.2, 0, 0, TAU); ctx.fill();
  }
  function artCrown(ctx, rng) {
    roots(ctx, rng, 9, 1.3);
    ctx.fillStyle = cI;
    limb(ctx, [[0, 0.5], [R(-1, 1, rng), -12], [R(-1, 1, rng), -26]], 3.5, 2.4);
    const gouges = [];
    branch(ctx, 0, -24, -Math.PI / 2 - 0.6, 10, 1.6, 1, rng, gouges);
    branch(ctx, 0, -24, -Math.PI / 2 + 0.6, 10, 1.6, 1, rng, gouges);
    const lobes = [];
    const n = 7;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + R(-0.2, 0.2, rng);
      lobes.push([Math.cos(a) * R(11, 14, rng), -47 + Math.sin(a) * R(9, 12, rng), R(9, 11.5, rng)]);
    }
    lobes.push([0, -47, 13]);
    ctx.fillStyle = cI;
    ctx.beginPath();
    for (const [x, y, r] of lobes) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }
    ctx.fill();
    // carved leaf clusters: scalloped crescents on the lit side of every lobe
    ctx.fillStyle = cP;
    const order = lobes.slice().sort((a, b) => a[1] - b[1]);
    for (const [x, y, r] of order) {
      for (let k = 0; k < 3; k++) {
        const rr = r * (0.82 - k * 0.2);
        arcLens(ctx, x + r * 0.08, y + r * 0.1, rr, Math.PI * (1.05 + k * 0.05), Math.PI * (1.5 - k * 0.04), 0.42 - k * 0.08);
      }
    }
    for (let k = 0; k < 26; k++) {
      const a = R(Math.PI * 0.9, Math.PI * 1.6, rng), d = R(4, 20, rng);
      const x = Math.cos(a) * d * 1.1, y = -47 + Math.sin(a) * d * 0.9;
      lens(ctx, x - 0.7, y + 0.2, x + 0.7, y - 0.3, 0.2, 0.3);
    }
    gougeLimbs(ctx, [[[[0, -2], [0, -24]], 3]]);
  }
  function artSpruce(ctx, rng) {
    ctx.fillStyle = cI;
    roots(ctx, rng, 6, 1.0);
    limb(ctx, [[0, 0.5], [0, -10]], 1.7, 1.4);
    const tiers = 6;
    for (let t = 0; t < tiers; t++) {
      const yb = -6 - t * 10.5, hw = 15 - t * 2.3, th = 15;
      const pts = [[0, yb - th]];
      const teeth = 4;
      pts.push([hw * 0.45, yb - th * 0.5]);
      for (let k = 0; k <= teeth; k++) {
        const x = hw - (k / teeth) * hw * 2;
        pts.push([x, yb + (k & 1 ? -1.6 : R(0, 1.2, rng))]);
        if (k < teeth) pts.push([x - hw / teeth, yb - R(0.8, 1.8, rng)]);
      }
      pts.push([-hw * 0.45, yb - th * 0.5]);
      fillPath(ctx, (c) => polyPath(c, pts), cI);
      ctx.fillStyle = cP;
      for (let k = 0; k < 5; k++) {
        const tt = (k + 0.5) / 5;
        const x = -hw * tt * 0.85, y = yb - th + th * tt * 0.95;
        lens(ctx, x + 1.4, y - 0.4, x - 0.4 + R(-0.3, 0.3, rng), y + 2.2, 0.26, 0.15);
      }
      lens(ctx, -0.5, yb - th + 1.5, -hw * 0.75, yb - 1.2, 0.2, -0.4);
      ctx.fillStyle = cI;
    }
  }
  function artGrave(ctx, rng, kind) {
    const lean = R(-0.07, 0.07, rng);
    ctx.save();
    ctx.rotate(lean);
    ctx.fillStyle = cI;
    if (kind === 0) {
      const face = (c) => { c.moveTo(-5.4, 0); c.lineTo(-5.4, -10.5); c.arc(0, -10.5, 5.4, Math.PI, 0); c.lineTo(5.4, 0); c.closePath(); };
      ctx.save(); ctx.translate(2.0, -0.9); fillPath(ctx, face, cI); ctx.restore();
      ctx.fillStyle = cP;
      for (let k = 0; k < 3; k++) lens(ctx, 5.9 + k * 0.45, -1.5, 5.9 + k * 0.45, -10 + k, 0.16);
      fillPath(ctx, face, cP);
      clipDo(ctx, face, () => {
        ctx.fillStyle = cI;
        for (let k = 0; k < 4; k++) lens(ctx, 2.6 + k * 0.85, -14.5 + k * 1.2, 2.8 + k * 0.85, 0.5, 0.12 + k * 0.07, 0.1);
      });
      strokePath(ctx, face, cI, 0.75);
      ctx.fillStyle = cI;
      lens(ctx, -0.4, -13.4, -0.4, -4.6, 0.55);
      lens(ctx, -2.8, -10.4, 2.0, -10.4, 0.48);
      limb(ctx, [[3.2, -15.4], [2.4, -13.4], [3.4, -11.6], [2.6, -10.0]], 0.22, 0.05);
    } else if (kind === 1) {
      const cross = (c) => polyPath(c, [[-1.4, 0], [-1.4, -10], [-4.6, -10], [-4.6, -12.6], [-1.4, -12.6], [-1.4, -16.4], [1.4, -16.4], [1.4, -12.6], [4.6, -12.6], [4.6, -10], [1.4, -10], [1.4, 0]]);
      fillPath(ctx, cross, cI);
      ctx.strokeStyle = cI; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.arc(0, -11.3, 3.4, 0, TAU); ctx.stroke();
      ctx.fillStyle = cP;
      lens(ctx, -0.6, -1.0, -0.5, -9.0, 0.28);
      lens(ctx, -0.6, -12.9, -0.5, -15.8, 0.22);
      lens(ctx, -4.0, -11.9, -1.8, -11.9, 0.2);
      ctx.beginPath(); ctx.arc(0, -11.3, 0.6, 0, TAU); ctx.fill();
    } else {
      const slab = (c) => polyPath(c, [[-4.6, 0], [-4.9, -11.4], [-3.4, -12.8], [3.6, -12.4], [4.8, -11.0], [4.6, 0]]);
      ctx.save(); ctx.translate(1.8, -0.8); fillPath(ctx, slab, cI); ctx.restore();
      fillPath(ctx, slab, cI);
      ctx.fillStyle = cP;
      // carved skull on the dark slab
      ctx.beginPath(); ctx.arc(0, -7.6, 2.6, 0, TAU); ctx.fill();
      ctx.fillRect(-1.5, -6.2, 3.0, 2.4);
      ctx.fillStyle = cI;
      ctx.beginPath(); ctx.arc(-0.95, -7.5, 0.75, 0, TAU); ctx.arc(0.95, -7.5, 0.75, 0, TAU); ctx.fill();
      ctx.fillRect(-0.9, -4.6, 0.3, 0.9); ctx.fillRect(-0.1, -4.6, 0.3, 0.9); ctx.fillRect(0.7, -4.6, 0.3, 0.9);
      ctx.fillStyle = cP;
      lens(ctx, -3.8, -11.4, 2.8, -11.6, 0.2);
      lens(ctx, -3.9, -1.2, -3.9, -10.2, 0.2);
    }
    ctx.restore();
    // grass tufts at the base
    ctx.fillStyle = cI;
    for (let k = 0; k < 6; k++) {
      const x = R(-7, 7, rng);
      taper(ctx, x, 0.4, x + R(-0.6, 0.8, rng), R(-2.6, -1.4, rng), 0.32);
    }
  }
  function artFence(ctx, rng) {
    const posts = [];
    for (let i = 0; i < 3; i++) posts.push([-14 + i * 13 + R(-1.5, 1.5, rng), R(11, 14, rng), R(-0.14, 0.14, rng)]);
    ctx.fillStyle = cI;
    const top = (p, y) => [p[0] + Math.sin(p[2]) * -y, y];
    // rails
    for (const ry of [-4.6, -9.4]) {
      for (let i = 0; i < 2; i++) {
        const a = posts[i], b = posts[i + 1];
        const pa = top(a, ry + R(-0.5, 0.5, rng)), pb = top(b, ry + R(-0.5, 0.5, rng));
        if (ry < -8 && i === 1 && rng.next() < 0.6) {
          // broken rail hanging down
          limb(ctx, [[pa[0], pa[1]], [pa[0] + 5, pa[1] + 1.2], [pa[0] + 8, pa[1] + 4.2]], 0.75, 0.5);
        } else limb(ctx, [[pa[0] - 1, pa[1]], [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2 + 0.6], [pb[0] + 1, pb[1]]], 0.75, 0.7);
      }
    }
    for (const p of posts) {
      const t = top(p, -p[1]);
      limb(ctx, [[p[0], 0.4], [t[0], t[1] + 1.2]], 1.0, 0.85);
      taper(ctx, t[0], t[1] + 1.4, t[0] + Math.sin(p[2]) * -1.2, t[1] - 0.6, 0.85);
    }
    ctx.fillStyle = cP;
    for (const p of posts) {
      const t = top(p, -p[1]);
      lens(ctx, p[0] - 0.3, -1, t[0] - 0.3, t[1] + 2.4, 0.2);
    }
    ctx.fillStyle = cI;
    for (let k = 0; k < 7; k++) {
      const x = R(-16, 16, rng);
      taper(ctx, x, 0.4, x + R(-0.6, 0.8, rng), R(-2.4, -1.2, rng), 0.3);
    }
  }
  function artScarecrow(ctx, rng) {
    ctx.fillStyle = cI;
    limb(ctx, [[0, 0.4], [0.2, -44]], 0.9, 0.75);
    limb(ctx, [[-11.5, -31.4], [11.5, -32.2]], 0.7, 0.7);
    // straw at the sleeve ends
    for (const s of [-1, 1]) for (let k = 0; k < 5; k++) taper(ctx, s * 10.4, -31.8, s * R(12.5, 14.2, rng), -31.8 + R(-1.8, 2.4, rng), 0.3);
    const coat = [[-8.2, -33.4], [-10.8, -33.0], [-11.0, -30.2], [-6.6, -30.4], [-6.8, -20.6], [-5.0, -18.6], [-3.6, -19.8], [-2.0, -17.8], [-0.2, -19.4],
      [1.6, -17.6], [3.4, -19.6], [5.0, -18.2], [6.6, -20.0], [6.4, -30.6], [10.9, -30.6], [10.8, -33.6], [8.0, -34.2], [0.2, -35.0]];
    fillPath(ctx, (c) => polyPath(c, coat), cI);
    for (let k = 0; k < 6; k++) taper(ctx, R(-5, 5, rng), -18.6, R(-6, 6, rng), R(-15.6, -14.4, rng), 0.28);
    ctx.fillStyle = cP;
    lens(ctx, -5.4, -20.0, -4.6, -29.6, 0.36, -0.2);
    lens(ctx, -2.6, -19.0, -2.2, -26.0, 0.26);
    lens(ctx, -9.8, -32.4, -6.8, -32.8, 0.22);
    // cream patch with stitches
    fillPath(ctx, (c) => polyPath(c, [[1.4, -27.4], [4.6, -27.8], [4.9, -24.2], [1.6, -23.9]]), cP);
    ctx.strokeStyle = cI; ctx.lineWidth = 0.32;
    ctx.beginPath();
    for (const [x, y] of [[1.6, -27.2], [4.6, -27.6], [4.8, -24.4], [1.8, -24.1]]) { ctx.moveTo(x - 0.5, y - 0.5); ctx.lineTo(x + 0.5, y + 0.5); ctx.moveTo(x + 0.5, y - 0.5); ctx.lineTo(x - 0.5, y + 0.5); }
    ctx.stroke();
    for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(-0.6, -31.6 + k * 3.4, 0.45, 0, TAU); ctx.fill(); }
    // turnip head
    const hy = -38.6;
    const head = (c) => smoothPath(c, [[0, hy - 4.6], [3.4, hy - 3.6], [4.6, hy], [3.2, hy + 3.4], [0.2, hy + 4.4], [-3.0, hy + 3.4], [-4.4, hy], [-3.4, hy - 3.6]]);
    fillPath(ctx, head, cP);
    clipDo(ctx, head, () => {
      ctx.fillStyle = cI;
      for (let k = 0; k < 6; k++) lens(ctx, -5 + k * 0.4, hy - 2.4 + k * 0.9, 5 + k * 0.4, hy - 2.6 + k * 0.9 - 0.4, 0.26 - k * 0.025, -0.6);
      for (let k = 0; k < 4; k++) lens(ctx, 2.0 + k * 0.7, hy - 3.4, 2.4 + k * 0.7, hy + 4.2, 0.12 + k * 0.05, 0.6);
    });
    strokePath(ctx, head, cI, 0.6);
    ctx.fillStyle = cI;
    fillPath(ctx, (c) => { polyPath(c, [[-2.2, hy + 0.4], [-0.6, hy + 0.3], [-1.5, hy - 1.4]]); polyPath(c, [[0.8, hy + 0.3], [2.4, hy + 0.4], [1.6, hy - 1.4]]); }, cI);
    ctx.strokeStyle = cI; ctx.lineWidth = 0.4;
    ctx.beginPath(); ctx.moveTo(-1.8, hy + 2.2); ctx.quadraticCurveTo(0.2, hy + 3.2, 2.2, hy + 2.0); ctx.stroke();
    ctx.beginPath(); for (let k = -1; k <= 2; k++) { ctx.moveTo(k * 0.9 - 0.1, hy + 1.8); ctx.lineTo(k * 0.9 + 0.1, hy + 3.2); } ctx.stroke();
    // hat
    ctx.fillStyle = cI;
    ctx.beginPath(); ctx.ellipse(0.2, hy - 3.6, 7.0, 1.3, -0.08, 0, TAU); ctx.fill();
    fillPath(ctx, (c) => polyPath(c, [[-3.4, hy - 3.8], [-2.6, hy - 9.6], [0.6, hy - 10.4], [2.6, hy - 9.0], [3.6, hy - 4.2]]), cI);
    ctx.fillStyle = cP;
    fillPath(ctx, (c) => polyPath(c, [[-3.3, hy - 5.0], [3.5, hy - 5.4], [3.4, hy - 6.4], [-3.0, hy - 6.0]]), cP);
    lens(ctx, -2.0, hy - 7.0, -1.4, hy - 9.4, 0.2);
  }
  function artLanternPole(ctx, rng, fr) {
    ctx.fillStyle = cI;
    limb(ctx, [[0, 0.4], [0.3, -38]], 1.0, 0.75);
    limb(ctx, [[0.2, -36.6], [4.5, -37.8], [8.2, -37.2]], 0.5, 0.42);
    ctx.lineWidth = 0.35; ctx.strokeStyle = cI;
    ctx.beginPath(); ctx.moveTo(7.6, -37.2); ctx.lineTo(7.6, -33.6); ctx.stroke();
    ctx.fillStyle = cP;
    lens(ctx, -0.35, -2, -0.1, -34, 0.24);
    // rays (orange spot plate)
    ctx.save();
    ctx.translate(7.6 + MX, -28.4 + MY);
    ctx.rotate(fr ? Math.PI / 12 : 0);
    drawRays(ctx, 12, 5.6, fr ? 10.0 : 11.2, fr ? 8.0 : 8.6, cO, 0.3);
    ctx.restore();
    ctx.save();
    ctx.translate(7.6, -24.2);
    drawTurnipLantern(ctx, rng, 1.0);
    ctx.restore();
    ctx.fillStyle = cI;
    for (let k = 0; k < 5; k++) { const x = R(-3, 3, rng); taper(ctx, x, 0.4, x + R(-0.6, 0.8, rng), R(-2.2, -1.2, rng), 0.28); }
  }
  function artCrowPost(ctx, rng, fr) {
    ctx.fillStyle = cI;
    limb(ctx, [[0, 0.4], [0, -16.6]], 1.25, 1.1);
    ctx.fillStyle = cP;
    lens(ctx, -0.4, -1.5, -0.4, -15.4, 0.22);
    lens(ctx, -0.8, -16.4, 0.8, -16.6, 0.18);
    ctx.fillStyle = cI;
    // crow
    const head = fr ? [3.0, -24.6] : [2.4, -25.4];
    fillPath(ctx, (c) => {
      smoothPath(c, [[-1.6, -24.0], [2.0, -23.6], [3.6, -20.6], [2.2, -18.0], [-1.0, -17.6], [-4.0, -19.0], [-7.2, -19.2], [-6.6, -20.4], [-4.0, -21.4]]);
      c.moveTo(head[0] + 2.0, head[1]); c.arc(head[0], head[1], 2.0, 0, TAU);
    }, cI);
    // tail feathers
    taper(ctx, -4.0, -19.6, -8.6, -18.2, 0.8, 0.2);
    taper(ctx, -4.0, -19.4, -8.2, -16.8, 0.7, 0.3);
    // beak
    if (fr) {
      fillPath(ctx, (c) => polyPath(c, [[head[0] + 1.4, head[1] - 0.8], [head[0] + 4.6, head[1] - 1.4], [head[0] + 1.8, head[1] + 0.0]]), cI);
      fillPath(ctx, (c) => polyPath(c, [[head[0] + 1.4, head[1] + 0.3], [head[0] + 4.0, head[1] + 1.4], [head[0] + 1.6, head[1] + 0.9]]), cI);
    } else fillPath(ctx, (c) => polyPath(c, [[head[0] + 1.4, head[1] - 0.8], [head[0] + 4.8, head[1] + 0.2], [head[0] + 1.4, head[1] + 0.8]]), cI);
    ctx.fillStyle = cP;
    ctx.beginPath(); ctx.arc(head[0] + 0.5, head[1] - 0.4, 0.5, 0, TAU); ctx.fill();
    for (let k = 0; k < 3; k++) lens(ctx, -3.6 + k * 1.2, -21.0 + k * 0.4, 1.0 + k * 0.6, -19.4 + k * 0.6, 0.22 - k * 0.03, 0.4);
    ctx.fillStyle = cI;
    ctx.beginPath(); ctx.arc(head[0] + 0.6, head[1] - 0.4, 0.22, 0, TAU); ctx.fill();
    ctx.lineWidth = 0.3; ctx.strokeStyle = cI;
    ctx.beginPath(); ctx.moveTo(-0.6, -17.8); ctx.lineTo(-0.8, -16.4); ctx.moveTo(0.8, -17.8); ctx.lineTo(1.0, -16.4); ctx.stroke();
    for (let k = 0; k < 4; k++) { const x = R(-3, 3, rng); taper(ctx, x, 0.4, x + R(-0.6, 0.8, rng), R(-2.2, -1.2, rng), 0.28); }
  }
  function artHay(ctx, rng) {
    const dome = (c) => { c.moveTo(-11.5, 0); c.bezierCurveTo(-12, -14, -5, -20, 0.5, -20); c.bezierCurveTo(6, -20, 12.4, -14, 11.8, 0); c.closePath(); };
    fillPath(ctx, dome, cP);
    clipDo(ctx, dome, () => {
      ctx.fillStyle = cI;
      for (let k = 0; k < 17; k++) {
        const t = k / 16;
        const x0 = -12 + t * 24;
        const w = 0.13 + Math.pow(t, 1.6) * 0.42;
        lens(ctx, x0 + R(-0.5, 0.5, rng), 1, x0 * 0.3 + R(-1, 1, rng), -21, w, x0 * 0.22);
      }
      for (let k = 0; k < 4; k++) lens(ctx, -12, -3 - k * 4.2, 12, -3.4 - k * 4.2, 0.12 + (k === 0 ? 0.1 : 0), -1.4 + k * 0.2);
      ctx.fillStyle = cP;
      lens(ctx, -8.4, -4.0, -4.0, -16.0, 0.42, -1.2);
    });
    crescent(ctx, dome, 0, -9, -1.2, -1.0, 0.94, cI);
    strokePath(ctx, dome, cI, 0.7);
    ctx.fillStyle = cI;
    limb(ctx, [[5.6, -13.0], [13.4, -27.0]], 0.42, 0.38);
    for (const d of [-0.8, 0, 0.8]) taper(ctx, 5.6, -13.0, 4.0 + d, -9.0 + d * 0.4, 0.22);
    for (let k = 0; k < 9; k++) { const x = R(-13, 13, rng); taper(ctx, x, 0.4, x + R(-1.2, 1.2, rng), R(-2.6, -1.2, rng), 0.3); }
  }

  /* ===================================================================================== sprite sets */
  const SPR = {};
  function buildSprites() {
    // Jack
    const J = { walk: [[], []], idle: [[], []], walkI: [[], []], idleI: [[], []], ghost: [] };
    [1, -1].forEach((f, fi) => {
      for (let i = 0; i < 4; i++) {
        J.walk[fi][i] = []; J.walkI[fi][i] = [];
        for (let v = 0; v < 2; v++) {
          const s = mk(-11.5, -32, 11.5, 1.5, (c) => drawJack(c, f, JACK_WALK[i], U.rng(100 + v * 7 + i)), { halo: 0.9, seed: 3 + v * 5 + i });
          J.walk[fi][i][v] = s; J.walkI[fi][i][v] = invert(s);
        }
      }
      for (let i = 0; i < 2; i++) {
        J.idle[fi][i] = []; J.idleI[fi][i] = [];
        for (let v = 0; v < 2; v++) {
          const s = mk(-11.5, -32, 11.5, 1.5, (c) => drawJack(c, f, JACK_IDLE[i], U.rng(200 + v * 7 + i)), { halo: 0.9, seed: 13 + v * 5 + i });
          J.idle[fi][i][v] = s; J.idleI[fi][i][v] = invert(s);
        }
      }
      J.ghost[fi] = tintSpr(J.walk[fi][0][0], cO);
    });
    SPR.jack = J;
    // enemies
    const defs = {
      creeper: { box: [-10, -28.5, 10, 1.5], fn: drawCreeper, cy: 0.42 },
      ghost: { box: [-11, -26, 13.5, 1], fn: drawGhost, cy: 0.5 },
      colossus: { box: [-23.5, -57, 23.5, 1.5], fn: drawColossus, cy: 0.5 },
    };
    for (const type in defs) {
      const d = defs[type];
      const set = { n: [[], []], i: [[], []], sh: [] };
      [1, -1].forEach((f, fi) => {
        for (let i = 0; i < 4; i++) {
          set.n[fi][i] = []; set.i[fi][i] = [];
          for (let v = 0; v < 2; v++) {
            const s = mk(d.box[0], d.box[1], d.box[2], d.box[3], (c) => d.fn(c, f, i, U.rng(300 + v * 11 + i * 3)), { halo: 0.9, seed: 21 + v * 9 + i });
            set.n[fi][i][v] = s; set.i[fi][i][v] = invert(s);
          }
        }
        set.sh[fi] = shards(set.n[fi][0][0], type === 'colossus' ? 5 : 4, 55 + fi, d.cy);
      });
      SPR[type] = set;
    }
    // projectiles
    SPR.seedK = []; SPR.seedO = mk(-3.5, -3, 3.8, 3, (c) => drawSeedBody(c, true), { pad: 0.5 });
    for (let v = 0; v < 2; v++) SPR.seedK[v] = mk(-3.6, -3, 4, 3, (c) => drawSeedBody(c, false), { pad: 0.5, seed: 40 + v });
    SPR.trail = mk(-14, -2.4, 0, 2.4, (c) => {
      c.fillStyle = cI;
      lens(c, -13.5, 0, -4.2, 0, 0.42);
      lens(c, -10.5, -1.5, -4.6, -1.2, 0.3, 0.2);
      lens(c, -10.0, 1.5, -4.6, 1.2, 0.3, -0.2);
    }, { pad: 0.5 });
    // orbital lantern + rays
    SPR.lantern = [0, 1].map((v) => mk(-6, -13, 6, 1.5, (c) => drawTurnipLantern(c, U.rng(500 + v), 1.0), { halo: 0.7, seed: 50 + v }));
    SPR.rays = mk(-13, -13, 13, 13, (c) => drawRays(c, 14, 6.5, 13, 10, cO, 0.3), { pad: 0.5 });
    SPR.raysBig = mk(-24, -24, 24, 24, (c) => drawRays(c, 18, 11, 24, 17.5, cO, 0.28), { pad: 0.5 });
    // gems
    SPR.gem = [0, 1].map((fr) => mk(-5, -8, 5, 2, (c) => drawGemArt(c, false, fr), { halo: 0.5, seed: 60 + fr }));
    SPR.gemBig = [0, 1].map((fr) => mk(-9, -14, 9, 4, (c) => drawGemArt(c, true, fr), { halo: 0.6, seed: 62 + fr }));
    // shadows
    const sh = (rx, ry) => mk(-rx - 1, -ry - 1, rx * 1.3 + 1, ry + 1, (c) => drawShadowArt(c, rx, ry), { pad: 0.4, ink: false });
    SPR.shJack = sh(6.4, 2.0); SPR.shCreeper = sh(7.4, 2.2); SPR.shGhost = sh(4.6, 1.4); SPR.shColossus = sh(16, 4.0);
    SPR.shGem = sh(2.4, 0.6); SPR.shTree = sh(19, 4.6); SPR.shSpruce = sh(13, 3.6); SPR.shGrave = sh(8, 2.4);
    SPR.shFence = sh(19, 2.4); SPR.shScare = sh(9, 2.4); SPR.shPole = sh(6, 1.8); SPR.shHay = sh(14, 3.2);
    // particles
    SPR.drop = [];
    for (let k = 0; k < 4; k++) {
      SPR.drop[k] = mk(-3, -3, 3, 3, (c) => {
        const r = U.rng(700 + k);
        c.fillStyle = cI;
        fillPath(c, (p) => smoothPath(p, blobPts(0, 0, 1.4, 1.2, 7, r, 0.5)), cI);
        for (let s = 0; s < 2; s++) { c.beginPath(); c.arc(R(-2.4, 2.4, r), R(-2.4, 2.4, r), R(0.25, 0.5, r), 0, TAU); c.fill(); }
      }, { pad: 0.3 });
    }
    SPR.chip = [];
    for (let k = 0; k < 4; k++) {
      SPR.chip[k] = mk(-3, -1.6, 3, 1.6, (c) => {
        const r = U.rng(720 + k);
        const L = R(1.8, 2.6, r), w = R(0.6, 1.0, r);
        c.fillStyle = k === 3 ? cP : cI;
        lens(c, -L, R(-0.3, 0.3, r), L, R(-0.3, 0.3, r), w, R(-0.3, 0.3, r));
        c.fillStyle = k === 3 ? cI : cP;
        lens(c, -L * 0.6, 0, L * 0.6, -0.1, 0.14, 0.1);
        if (k === 3) { c.strokeStyle = cI; c.lineWidth = 0.3; c.beginPath(); c.ellipse(0, 0, L, w, 0, 0, TAU); c.stroke(); }
      }, { pad: 0.3 });
    }
    SPR.chipO = mk(-2.6, -1.4, 2.6, 1.4, (c) => { c.fillStyle = cO; lens(c, -2.2, 0, 2.2, 0, 0.9, 0.2); c.fillStyle = cI; lens(c, -1.5, 0.3, 1.6, 0.4, 0.2, 0.2); }, { pad: 0.3 });
    SPR.splat = [];
    for (let k = 0; k < 4; k++) SPR.splat[k] = mk(-15, -9, 15, 9, (c) => drawSplatArt(c, U.rng(740 + k), 6.5), { pad: 0.5 });
    SPR.burst = mk(-9, -9, 9, 9, (c) => {
      c.fillStyle = cI;
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * TAU + 0.2, r1 = k & 1 ? 6.0 : 8.6;
        lens(c, Math.cos(a) * 3.0, Math.sin(a) * 3.0, Math.cos(a) * r1, Math.sin(a) * r1, k & 1 ? 0.5 : 0.75);
      }
    }, { pad: 0.5 });
    SPR.burstO = mk(-9, -9, 9, 9, (c) => {
      c.fillStyle = cO;
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * TAU, r1 = k & 1 ? 5.5 : 8.6;
        lens(c, Math.cos(a) * 2.6, Math.sin(a) * 2.6, Math.cos(a) * r1, Math.sin(a) * r1, k & 1 ? 0.55 : 0.8);
      }
    }, { pad: 0.5 });
    SPR.puff = [];
    for (let k = 0; k < 3; k++) {
      SPR.puff[k] = mk(-6, -6, 6, 6, (c) => {
        c.fillStyle = cI;
        const sp = 1.55;
        for (let y = -5; y <= 5; y += sp * 0.866) {
          const row = Math.round(y / (sp * 0.866));
          for (let x = -5; x <= 5; x += sp) {
            const xx = x + (row & 1 ? sp / 2 : 0);
            const d = Math.hypot(xx, y) / 5;
            if (d > 1) continue;
            const r = (1 - d) * 0.7 * (1 - k * 0.3) + 0.08;
            c.beginPath(); c.arc(xx, y, r, 0, TAU); c.fill();
          }
        }
      }, { pad: 0.3, ink: false });
    }
    SPR.star = mk(-3, -3, 3, 3, (c) => {
      c.save(); c.translate(MX * 0.5, MY * 0.5); star(c, 0, 0, 4, 2.6, 0.8, 0); c.fillStyle = cO; c.fill(); c.restore();
      star(c, 0, 0, 4, 2.6, 0.8, 0); c.strokeStyle = cI; c.lineWidth = 0.35; c.stroke();
    }, { pad: 0.4, ink: false });
    SPR.ring = mk(-12, -12, 12, 12, (c) => {
      c.fillStyle = cO;
      for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU; arcLens(c, 0, 0, 10.5, a, a + TAU / 16 * 0.7, 0.55); }
    }, { pad: 0.4, ink: false });
    // props
    const P = {};
    P.oak = [0, 1, 2].map((v) => mk(-44, -86, 44, 4, (c) => artOak(c, U.rng(800 + v * 13)), { halo: 0.8, seed: 80 + v }));
    P.crown = [0, 1].map((v) => mk(-30, -72, 30, 4, (c) => artCrown(c, U.rng(830 + v * 13)), { halo: 0.8, seed: 83 + v }));
    P.spruce = [0, 1].map((v) => mk(-18, -78, 18, 3, (c) => artSpruce(c, U.rng(850 + v * 13)), { halo: 0.8, seed: 85 + v }));
    P.grave = [0, 1, 2].map((v) => mk(-9, -19, 10, 2, (c) => artGrave(c, U.rng(870 + v * 5), v), { halo: 0.7, seed: 87 + v }));
    P.fence = [0, 1].map((v) => mk(-19, -18, 22, 2, (c) => artFence(c, U.rng(890 + v * 5)), { halo: 0.7, seed: 89 + v }));
    P.scare = [mk(-15, -51, 15, 2, (c) => artScarecrow(c, U.rng(910)), { halo: 0.8, seed: 91 })];
    P.pole = [0, 1].map((fr) => mk(-4, -42, 20, 2, (c) => artLanternPole(c, U.rng(930), fr), { halo: 0.7, seed: 93 }));
    P.crow = [0, 1].map((fr) => mk(-10, -29, 9, 2, (c) => artCrowPost(c, U.rng(950), fr), { halo: 0.7, seed: 95 }));
    P.hay = [mk(-14, -29, 15, 2, (c) => artHay(c, U.rng(970)), { halo: 0.7, seed: 97 })];
    SPR.props = P;
  }

  /* ===================================================================================== ground */
  const SPC = 4.4;        // furrow spacing
  const B1 = 0.455, B2 = 0.565, DTH = 0.74, ROADW = 11;
  const GUT = 1.5;        // paper gutter between carved regions
  function fieldsBasic(x, y, o) {
    o.B = U.warped(x / 1000, y / 1000, 101, 1.1, 3);
    o.D = U.fbm(x / 300, y / 300, 202, 2) + (o.B - 0.55) * 0.6;
    const qx = U.noise(x / 2200, y / 2200, 303) - 0.5, qy = U.noise(x / 2200 + 7.7, y / 2200 + 2.1, 304) - 0.5;
    o.R = U.perlin(x / 3400 + qx * 0.3, y / 3400 + qy * 0.3, 305);
  }
  function fieldF(x, y) {
    return (y + 0.22 * x + 110 * (U.fbm(x / 300, y / 300, 404, 3) - 0.5) + 9 * U.perlin(x / 60, y / 60, 405)) / SPC;
  }
  function fieldsFull(x, y, o) {
    fieldsBasic(x, y, o);
    o.F = fieldF(x, y);
    o.M = U.fbm(x / 19, y / 19, 505, 2);
    o.T = U.fbm(x / 140, y / 140, 606, 2);
    o.V = U.noise(x / 60, y / 60, 707);
  }
  const _a = {}, _b = {}, _c = {};
  /** Material + distances (world units) to the region boundaries at a world point. */
  function matAt(x, y) {
    fieldsBasic(x, y, _a); fieldsBasic(x + 1, y, _b); fieldsBasic(x, y + 1, _c);
    const gB = Math.hypot(_b.B - _a.B, _c.B - _a.B) + 1e-6;
    const gD = Math.hypot(_b.D - _a.D, _c.D - _a.D) + 1e-6;
    const gR = Math.hypot(_b.R - _a.R, _c.R - _a.R) + 1e-6;
    const dR = Math.min(60, Math.abs(_a.R) / gR) - ROADW;
    const dS = (_a.D - DTH) / gD, dB1 = (_a.B - B1) / gB, dB2 = (_a.B - B2) / gB;
    let mat, margin;
    if (dR < 0) { mat = 'road'; margin = -dR; }
    else if (dS > 0) { mat = 'soil'; margin = Math.min(dS, dR); }
    else if (dB1 < 0) { mat = 'field'; margin = Math.min(-dB1, -dS, dR); }
    else if (dB2 > 0) { mat = 'forest'; margin = Math.min(dB2, -dS, dR); }
    else { mat = 'meadow'; margin = Math.min(dB1, -dB2, -dS, dR); }
    return { mat, margin, dR, dS, dB1, dB2 };
  }

  /* per-pixel carved patterns (world units in, ink coverage 0..1 out) */
  function blade(dx, dy, ang, L, res) {
    const ux = Math.sin(ang), uy = -Math.cos(ang);
    let t = (dx * ux + dy * uy) / L;
    if (t > 1) return 0;
    if (t < 0) t = 0;
    const qx = dx - ux * t * L, qy = dy - uy * t * L;
    const hw = 0.46 * (1 - t);
    const v = (hw - Math.sqrt(qx * qx + qy * qy)) * res + 0.5;
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }
  const GC = 9;
  function grass(X, Y, dens, res) {
    const fx = X / GC, fy = Y / GC;
    const ix = Math.floor(fx), iy = Math.floor(fy);
    const sx = fx - ix < 0.5 ? ix - 1 : ix, sy = fy - iy < 0.5 ? iy - 1 : iy;
    let a = 0;
    for (let j = 0; j < 2; j++) {
      for (let i = 0; i < 2; i++) {
        const cx = sx + i, cy = sy + j;
        const h = U.hashInt(cx, cy, 4141);
        if ((h & 1023) > dens * 1024) continue;
        const bx = (cx + 0.15 + (((h >>> 10) & 255) / 255) * 0.7) * GC;
        const by = (cy + 0.35 + (((h >>> 18) & 255) / 255) * 0.55) * GC;
        const dx = X - bx, dy = Y - by;
        if (dx < -3.3 || dx > 3.3 || dy > 0.7 || dy < -4.6) continue;
        const type = (h >>> 26) & 3, L = 2.2 + ((h >>> 28) & 3) * 0.45;
        let v = blade(dx, dy, 0.16, L, res);
        if (type >= 1) v = Math.max(v, blade(dx + 0.55, dy, -0.5, L * 0.72, res));
        if (type >= 2) v = Math.max(v, blade(dx - 0.55, dy, 0.75, L * 0.66, res));
        if (v > a) a = v;
      }
    }
    return a;
  }
  const CC = 27;
  function chatter(X, Y, res) {
    const fx = X / CC, fy = Y / CC;
    const ix = Math.floor(fx), iy = Math.floor(fy);
    const sx = fx - ix < 0.5 ? ix - 1 : ix, sy = fy - iy < 0.5 ? iy - 1 : iy;
    let a = 0;
    for (let j = 0; j < 2; j++) {
      for (let i = 0; i < 2; i++) {
        const cx = sx + i, cy = sy + j;
        const h = U.hashInt(cx, cy, 5151);
        if ((h & 1023) > 300) continue;
        const px = (cx + 0.2 + (((h >>> 10) & 255) / 255) * 0.6) * CC;
        const py = (cy + 0.2 + (((h >>> 18) & 255) / 255) * 0.6) * CC;
        const dx = X - px, dy = Y - py;
        if (dx * dx + dy * dy > 36) continue;
        const th = (((h >>> 26) & 63) / 63 - 0.5) * 0.4;
        const c = Math.cos(th), s = Math.sin(th);
        const u = dx * c + dy * s, v = -dx * s + dy * c;
        const n = 3 + ((h >>> 3) & 1) + ((h >>> 4) & 1);
        const sp = 1.05;
        const kf = v / sp + (n - 1) / 2;
        let k = Math.round(kf);
        if (k < 0) k = 0; else if (k > n - 1) k = n - 1;
        const off = k - (n - 1) / 2;
        const Lk = (4 + ((h >>> 5) & 7) * 0.7) * (1 - 0.2 * Math.abs(off)) * (0.8 + 0.4 * U.hash2(k, cx, cy));
        const uu = (2 * (u + off * 0.7)) / Lk;
        if (uu <= -1 || uu >= 1) continue;
        const hw = 0.21 * Math.sqrt(1 - uu * uu);
        const vv = (hw - Math.abs(v - off * sp)) * res + 0.5;
        if (vv > a) a = vv > 1 ? 1 : vv;
      }
    }
    return a;
  }
  function fleck(X, Y, ux, uy, res) {
    const CS = 4.3;
    const fx = X / CS, fy = Y / CS;
    const ix = Math.floor(fx), iy = Math.floor(fy);
    const sx = fx - ix < 0.5 ? ix - 1 : ix, sy = fy - iy < 0.5 ? iy - 1 : iy;
    let a = 0;
    for (let j = 0; j < 2; j++) {
      for (let i = 0; i < 2; i++) {
        const cx = sx + i, cy = sy + j;
        const h = U.hashInt(cx, cy, 6161);
        if ((h & 1023) > 640) continue;
        const px = (cx + 0.15 + (((h >>> 10) & 255) / 255) * 0.7) * CS;
        const py = (cy + 0.15 + (((h >>> 18) & 255) / 255) * 0.7) * CS;
        const dx = X - px, dy = Y - py;
        if (dx * dx + dy * dy > 4) continue;
        const j2 = (((h >>> 26) & 63) / 63 - 0.5) * 0.7;
        const c = Math.cos(j2), s = Math.sin(j2);
        const ax = ux * c - uy * s, ay = ux * s + uy * c;
        const u = dx * ax + dy * ay, v = -dx * ay + dy * ax;
        const L = 1.3 + ((h >>> 4) & 7) * 0.22;
        const uu = (2 * u) / L;
        if (uu <= -1 || uu >= 1) continue;
        const hw = (0.28 + ((h >>> 7) & 3) * 0.07) * (1 - uu * uu);
        const vv = (hw - Math.abs(v)) * res + 0.5;
        if (vv > a) a = vv > 1 ? 1 : vv;
      }
    }
    return a;
  }
  const WO = {};

  function* renderGround(ctx, info) {
    const res = info.res, W = info.px, wx = info.wx, wy = info.wy;
    const n = 80, cw = 256 / n;
    const RW = n + 4;
    const raw = new Float32Array(RW * RW * 7);
    const o = {};
    for (let j = 0; j < RW; j++) {
      if ((j & 3) === 3) yield;
      const y = wy + (j - 1) * cw;
      for (let i = 0; i < RW; i++) {
        fieldsFull(wx + (i - 1) * cw, y, o);
        const k = (j * RW + i) * 7;
        raw[k] = o.B; raw[k + 1] = o.D; raw[k + 2] = o.R; raw[k + 3] = o.F; raw[k + 4] = o.M; raw[k + 5] = o.T; raw[k + 6] = o.V;
      }
    }
    const gw = n + 2, NC = 11;
    const g = new Float32Array(gw * gw * NC);
    const inv2 = 1 / (2 * cw);
    for (let j = 0; j < gw; j++) {
      for (let i = 0; i < gw; i++) {
        const k = ((j + 1) * RW + (i + 1)) * 7, kx0 = k - 7, kx1 = k + 7, ky0 = k - RW * 7, ky1 = k + RW * 7;
        const gB = Math.hypot((raw[kx1] - raw[kx0]) * inv2, (raw[ky1] - raw[ky0]) * inv2) + 1e-6;
        const gD = Math.hypot((raw[kx1 + 1] - raw[kx0 + 1]) * inv2, (raw[ky1 + 1] - raw[ky0 + 1]) * inv2) + 1e-6;
        const gR = Math.hypot((raw[kx1 + 2] - raw[kx0 + 2]) * inv2, (raw[ky1 + 2] - raw[ky0 + 2]) * inv2) + 1e-6;
        const fxg = (raw[kx1 + 3] - raw[kx0 + 3]) * inv2, fyg = (raw[ky1 + 3] - raw[ky0 + 3]) * inv2;
        const gF = Math.hypot(fxg, fyg) + 1e-6;
        const q = (j * gw + i) * NC;
        g[q] = Math.min(60, Math.abs(raw[k + 2]) / gR) - ROADW;
        g[q + 1] = U.clamp((raw[k + 1] - DTH) / gD, -60, 60);
        g[q + 2] = U.clamp((raw[k] - B1) / gB, -60, 60);
        g[q + 3] = U.clamp((raw[k] - B2) / gB, -60, 60);
        g[q + 4] = raw[k + 3];
        g[q + 5] = Math.max(gF, 0.08);
        g[q + 6] = -fyg / gF;
        g[q + 7] = fxg / gF;
        g[q + 8] = raw[k + 4];
        g[q + 9] = raw[k + 5];
        g[q + 10] = raw[k + 6];
      }
    }
    yield;
    const img = ctx.createImageData(W, W), d = img.data;
    const gpx = Math.round(wx * res), gpy = Math.round(wy * res);
    const ipx = 1 / res;
    const nW = n / W;
    const smooth = U.smoothstep;
    for (let py = 0; py < W; py++) {
      if ((py & 7) === 7) yield;
      const Y = wy + (py + 0.5) * ipx;
      const gyf = (py + 0.5) * nW, gy0 = gyf | 0, fy = gyf - gy0;
      const rowF = ((gpy + py) & 511) * 512, rowV = ((gpy + py) & 255) * 256;
      for (let px = 0; px < W; px++) {
        const X = wx + (px + 0.5) * ipx;
        const gxf = (px + 0.5) * nW, gx0 = gxf | 0, fx = gxf - gx0;
        const q00 = (gy0 * gw + gx0) * NC, q10 = q00 + NC, q01 = q00 + gw * NC, q11 = q01 + NC;
        const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
        const dR = g[q00] * w00 + g[q10] * w10 + g[q01] * w01 + g[q11] * w11;
        let a = 0;
        if (dR < 0) {
          // ---- cobbled road
          if (dR > -0.95) {
            const v = (0.47 - Math.abs(dR + 0.47)) * res + 0.5;
            a = v < 0 ? 0 : v > 1 ? 1 : v;
          } else {
            U.worley(X / 4.4, Y / 4.4, 909, 0, WO);
            const edge = (WO.f2 - WO.f1) * 2.2;
            let m = (0.36 - edge) * res + 0.5;
            m = m < 0 ? 0 : m > 1 ? 1 : m;
            if ((WO.id & 15) === 3) a = 1 - m * 0.9;
            else {
              const rx = X / 4.4 - WO.x, ry = Y / 4.4 - WO.y;
              const s = rx * 0.6 + ry * 0.8;
              let hv = 0;
              if (s > 0.1) {
                const ph = (X - Y) * 0.5657;
                const ld = Math.abs(ph - Math.floor(ph) - 0.5) * 1.25;
                const hw = 0.05 + 0.32 * smooth(0.1, 0.55, s);
                hv = (hw - ld) * res + 0.5;
                hv = hv < 0 ? 0 : hv > 1 ? 1 : hv;
              }
              a = m > hv ? m : hv;
            }
            const inner = (-0.95 - dR) * res; // fade the stones in from the curb line
            if (inner < 1) a *= inner < 0 ? 0 : inner;
          }
        } else if (dR >= GUT) {
          const dS = g[q00 + 1] * w00 + g[q10 + 1] * w10 + g[q01 + 1] * w01 + g[q11 + 1] * w11;
          if (dS > 0) {
            // ---- dark soil: solid ink, carved echo contours, white gouge flecks
            a = dS * res + 0.5; a = a > 1 ? 1 : a;
            const e1 = (0.3 - Math.abs(dS - 1.8)) * res + 0.5;
            const e2 = (0.22 - Math.abs(dS - 3.4)) * res + 0.5;
            let k = e1 > e2 ? e1 : e2;
            k = k < 0 ? 0 : k > 1 ? 1 : k;
            if (dS > 4.3) {
              const ux = g[q00 + 6] * w00 + g[q10 + 6] * w10 + g[q01 + 6] * w01 + g[q11 + 6] * w11;
              const uy = g[q00 + 7] * w00 + g[q10 + 7] * w10 + g[q01 + 7] * w01 + g[q11 + 7] * w11;
              const fl = fleck(X, Y, ux, uy, res) * clamp01((dS - 4.3) * res);
              if (fl > k) k = fl;
            }
            a *= 1 - k;
          } else if (dS < -GUT) {
            const dB1 = g[q00 + 2] * w00 + g[q10 + 2] * w10 + g[q01 + 2] * w01 + g[q11 + 2] * w11;
            const T = g[q00 + 9] * w00 + g[q10 + 9] * w10 + g[q01 + 9] * w01 + g[q11 + 9] * w11;
            let fade = (dR - GUT) * res + 0.5;
            const f2 = (-dS - GUT) * res + 0.5;
            if (f2 < fade) fade = f2;
            if (dB1 < 0) {
              // ---- ploughed field: furrow lines along a flowing direction field
              const F = g[q00 + 4] * w00 + g[q10 + 4] * w10 + g[q01 + 4] * w01 + g[q11 + 4] * w11;
              const gF = g[q00 + 5] * w00 + g[q10 + 5] * w10 + g[q01 + 5] * w01 + g[q11 + 5] * w11;
              const M = g[q00 + 8] * w00 + g[q10 + 8] * w10 + g[q01 + 8] * w01 + g[q11 + 8] * w11;
              const li = Math.floor(F);
              const dist = Math.abs(F - li - 0.5) / gF;
              const lh = (U.hashInt(li, 7, 515) & 1023) / 1024;
              let hw = 0.66 * smooth(0.27, 0.7, M) * (0.72 + 0.56 * T);
              if (lh < 0.34) hw *= 0.6;
              let v = (hw - dist) * res + 0.5;
              v = v < 0 ? 0 : v > 1 ? 1 : v;
              // field edge: a carved ditch line
              const ev = (0.44 - Math.abs(dB1 + 0.5)) * res + 0.5;
              if (ev > v) v = ev > 1 ? 1 : ev;
              a = v;
            } else if (dB1 > GUT) {
              const dB2 = g[q00 + 3] * w00 + g[q10 + 3] * w10 + g[q01 + 3] * w01 + g[q11 + 3] * w11;
              if (dB2 > 0) {
                // ---- forest floor: stipple, edge line
                const ix = Math.floor(X / 2.5), iy = Math.floor(Y / 2.5);
                const h = U.hashInt(ix, iy, 919);
                const dens = 0.14 + 0.52 * smooth(0.3, 0.72, T);
                if ((h & 1023) < dens * 1024) {
                  const r = 0.3 + (((h >>> 10) & 63) / 63) * 0.24;
                  const cx = (ix + 0.22 + (((h >>> 16) & 255) / 255) * 0.56) * 2.5, cy = (iy + 0.22 + (((h >>> 24) & 255) / 255) * 0.56) * 2.5;
                  const ddx = X - cx, ddy = Y - cy;
                  const v = (r - Math.sqrt(ddx * ddx + ddy * ddy)) * res + 0.5;
                  a = v < 0 ? 0 : v > 1 ? 1 : v;
                }
                const ev = (0.42 - Math.abs(dB2 - 0.5)) * res + 0.5;
                if (ev > a) a = ev > 1 ? 1 : ev;
                const fd = (dB2 - 1.0) * res + 0.5; // gap behind the edge line
                if (dB2 > 0.92 && fd < 1 && a < 1) a *= fd < 0 ? 0 : fd;
              } else if (dB2 < -GUT) {
                // ---- meadow: grass ticks + gouge chatter on mostly clean paper
                const dens = 0.1 + 0.5 * smooth(0.32, 0.72, T);
                let v = grass(X, Y, dens, res);
                if (v < 1) { const c2 = chatter(X, Y, res); if (c2 > v) v = c2; }
                let f3 = (dB1 - GUT) * res + 0.5;
                if (f3 < fade) fade = f3;
                f3 = (-dB2 - GUT) * res + 0.5;
                if (f3 < fade) fade = f3;
                a = v;
              }
            }
            if (fade < 1) a *= fade < 0 ? 0 : fade;
          }
        }
        // ---- paper + ink
        const fo = FIB[rowF + ((gpx + px) & 511)];
        let r = PAPER[0] + fo, gg = PAPER[1] + fo, b = PAPER[2] + fo;
        if (a > 0.003) {
          const vv = VOID[rowV + ((gpx + px) & 255)];
          const V = g[q00 + 10] * w00 + g[q10 + 10] * w10 + g[q01 + 10] * w01 + g[q11 + 10] * w11;
          let ir = INK[0], ig = INK[1], ib = INK[2];
          if (vv > 236 - 34 * V) { ir += (r - ir) * 0.7; ig += (gg - ig) * 0.7; ib += (b - ib) * 0.7; }
          else { const e = fo * 0.4; ir += e; ig += e; ib += e; }
          r += (ir - r) * a; gg += (ig - gg) * a; b += (ib - b) * a;
        }
        const o4 = (py * W + px) * 4;
        d[o4] = r; d[o4 + 1] = gg; d[o4 + 2] = b; d[o4 + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    yield;
    yield* decals(ctx, info);
  }

  /* ---------- decals (carved in the same knife language) ---------- */
  function knock(ctx, x, y, r) { ctx.fillStyle = cP; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  function dFlower(ctx, x, y, s, rng) {
    knock(ctx, x, y, 3.0 * s);
    ctx.fillStyle = cI;
    const n = 5, a0 = rng.next() * TAU;
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / n) * TAU;
      lens(ctx, x + Math.cos(a) * 0.75 * s, y + Math.sin(a) * 0.75 * s, x + Math.cos(a) * 2.4 * s, y + Math.sin(a) * 2.4 * s, 0.62 * s);
    }
    ctx.beginPath(); ctx.arc(x, y, 0.42 * s, 0, TAU); ctx.fill();
  }
  function dStar(ctx, x, y, s, rng) {
    knock(ctx, x, y, 2.4 * s);
    star(ctx, x, y, 5, 2.0 * s, 0.8 * s, rng.next());
    ctx.fillStyle = cI; ctx.fill();
    ctx.fillStyle = cP; ctx.beginPath(); ctx.arc(x, y, 0.3 * s, 0, TAU); ctx.fill();
  }
  function dPebble(ctx, x, y, s, rng, onDark) {
    const rx = R(1.2, 2.0, rng) * s, ry = rx * R(0.55, 0.75, rng), rot = R(-0.4, 0.4, rng);
    if (!onDark) knock(ctx, x, y, rx + 0.9);
    ctx.fillStyle = cP;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); ctx.fill();
    ctx.strokeStyle = cI; ctx.lineWidth = 0.4; ctx.stroke();
    ctx.fillStyle = cI;
    lens(ctx, x - rx * 0.6, y + ry * 0.55, x + rx * 0.8, y + ry * 0.1, 0.32 * s, 0.2);
  }
  function dSkull(ctx, x, y, s, rng) {
    knock(ctx, x, y - 0.5 * s, 4.2 * s);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(R(-0.3, 0.3, rng));
    ctx.fillStyle = cI;
    lens(ctx, -3.6, 1.6, 3.6, -1.0, 0.55); lens(ctx, -3.6, -1.0, 3.6, 1.6, 0.55);
    ctx.fillStyle = cP;
    ctx.beginPath(); ctx.arc(0, -1.0, 2.2, 0, TAU); ctx.fill();
    ctx.fillRect(-1.2, 0.2, 2.4, 1.8);
    ctx.strokeStyle = cI; ctx.lineWidth = 0.35;
    ctx.beginPath(); ctx.arc(0, -1.0, 2.2, Math.PI * 0.8, Math.PI * 2.2); ctx.lineTo(1.2, 2.0); ctx.lineTo(-1.2, 2.0); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = cI;
    ctx.beginPath(); ctx.arc(-0.8, -0.9, 0.62, 0, TAU); ctx.arc(0.8, -0.9, 0.62, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 0.0); ctx.lineTo(-0.3, 0.6); ctx.lineTo(0.3, 0.6); ctx.fill();
    ctx.restore();
  }
  function dBone(ctx, x, y, s, rng, onDark) {
    const a = R(0, Math.PI, rng), L = 2.4 * s, c = Math.cos(a) * L, sn = Math.sin(a) * L;
    if (!onDark) knock(ctx, x, y, L + 1.2);
    ctx.fillStyle = cP;
    ctx.lineWidth = 0.35; ctx.strokeStyle = cI;
    const shape = (cx) => {
      cx.moveTo(x - c, y - sn); cx.lineTo(x + c, y + sn);
    };
    ctx.beginPath(); shape(ctx); ctx.lineWidth = 1.0 * s; ctx.strokeStyle = cP; ctx.stroke();
    for (const e of [-1, 1]) {
      const ex = x + c * e, ey = y + sn * e;
      const px = -Math.sin(a) * 0.55 * s, py = Math.cos(a) * 0.55 * s;
      ctx.beginPath(); ctx.arc(ex + px, ey + py, 0.6 * s, 0, TAU); ctx.arc(ex - px, ey - py, 0.6 * s, 0, TAU); ctx.fill();
    }
    if (!onDark) { ctx.fillStyle = cI; lens(ctx, x - c * 0.7, y - sn * 0.7 + 0.25, x + c * 0.7, y + sn * 0.7 + 0.25, 0.15); }
  }
  function dLeaf(ctx, x, y, s, rng) {
    const a = R(0, TAU, rng), L = R(1.6, 2.6, rng) * s;
    const c = Math.cos(a) * L, sn = Math.sin(a) * L;
    knock(ctx, x, y, L + 1.0);
    ctx.fillStyle = cI;
    lens(ctx, x - c, y - sn, x + c, y + sn, L * 0.42, R(-0.4, 0.4, rng));
    const px = -Math.sin(a), py = Math.cos(a);
    for (const t of [-0.35, 0.15]) {
      const bx = x + c * t, by = y + sn * t;
      lens(ctx, bx, by, bx + px * L * 0.7 + c * 0.2, by + py * L * 0.7 + sn * 0.2, L * 0.2);
      lens(ctx, bx, by, bx - px * L * 0.7 + c * 0.2, by - py * L * 0.7 + sn * 0.2, L * 0.2);
    }
    ctx.fillStyle = cP;
    lens(ctx, x - c * 0.85, y - sn * 0.85, x + c * 0.7, y + sn * 0.7, 0.16, 0);
    ctx.fillStyle = cI;
    taper(ctx, x - c, y - sn, x - c * 1.45, y - sn * 1.45 + 0.3, 0.2);
  }
  function dTwig(ctx, x, y, s, rng) {
    const a = R(0, TAU, rng), L = R(4, 7, rng) * s;
    const ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L;
    ctx.fillStyle = cP;
    lens(ctx, x, y, ex, ey, 1.2, 0);
    ctx.fillStyle = cI;
    limb(ctx, [[x, y], [(x + ex) / 2 + R(-0.6, 0.6, rng), (y + ey) / 2 + R(-0.6, 0.6, rng)], [ex, ey]], 0.42, 0.1);
    const t = R(0.3, 0.6, rng), bx = x + (ex - x) * t, by = y + (ey - y) * t;
    const b = a + (rng.next() < 0.5 ? -0.7 : 0.7);
    taper(ctx, bx, by, bx + Math.cos(b) * L * 0.4, by + Math.sin(b) * L * 0.4, 0.26);
  }
  function dMushroom(ctx, x, y, s, rng) {
    knock(ctx, x, y - 1.6 * s, 3.2 * s);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    for (const [ox, sc] of [[0, 1], [R(1.6, 2.4, rng), 0.62]]) {
      ctx.save(); ctx.translate(ox, 0); ctx.scale(sc, sc);
      ctx.fillStyle = cP;
      ctx.fillRect(-0.55, -2.0, 1.1, 2.0);
      ctx.strokeStyle = cI; ctx.lineWidth = 0.35; ctx.strokeRect(-0.55, -2.0, 1.1, 2.0);
      ctx.fillStyle = cI;
      ctx.beginPath(); ctx.moveTo(-2.4, -1.8); ctx.quadraticCurveTo(0, -5.0, 2.4, -1.8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = cP;
      ctx.beginPath(); ctx.arc(-0.8, -2.8, 0.38, 0, TAU); ctx.arc(0.7, -3.2, 0.3, 0, TAU); ctx.arc(1.4, -2.3, 0.26, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
  function dSprout(ctx, x, y, s, rng) {
    knock(ctx, x, y - 1.2, 2.6 * s);
    ctx.fillStyle = cP;
    ctx.beginPath(); ctx.arc(x, y + 0.1, 1.1 * s, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = cI; ctx.lineWidth = 0.35;
    ctx.beginPath(); ctx.arc(x, y + 0.1, 1.1 * s, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = cI;
    lens(ctx, x - 0.2, y - 0.8, x - 2.2 * s, y - 2.8 * s, 0.5 * s, -0.3);
    lens(ctx, x, y - 0.9, x + 0.4 * s, y - 3.6 * s, 0.5 * s, 0.2);
    lens(ctx, x + 0.2, y - 0.8, x + 2.3 * s, y - 2.4 * s, 0.45 * s, 0.3);
  }
  function dTurnip(ctx, x, y, s, rng) {
    knock(ctx, x, y, 4.4 * s);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(R(-0.6, 0.6, rng));
    ctx.fillStyle = cI;
    lens(ctx, 1.6, -0.4, 4.6, -2.0, 0.7, -0.3);
    lens(ctx, 1.6, 0, 4.8, 0.8, 0.6, 0.3);
    const body = (c) => smoothPath(c, [[-3.2, 0], [-1.6, -1.8], [0.8, -1.9], [2.0, 0], [0.8, 1.8], [-1.6, 1.6]]);
    fillPath(ctx, body, cP);
    clipDo(ctx, body, () => {
      ctx.fillStyle = cI;
      ctx.fillRect(0.2, -3, 3, 6);
      for (let k = 0; k < 3; k++) taper(ctx, 0.4, -1.2 + k * 1.1, -0.9, -1.2 + k * 1.2, 0.28);
    });
    strokePath(ctx, body, cI, 0.35);
    ctx.fillStyle = cI;
    taper(ctx, -3.0, 0, -4.6, 0.6, 0.22);
    ctx.restore();
  }
  function dClod(ctx, x, y, s, rng) {
    const pts = blobPts(x, y, R(0.9, 1.5, rng) * s, R(0.6, 0.9, rng) * s, 6, rng, 0.4);
    knock(ctx, x, y, 2.3 * s);
    fillPath(ctx, (c) => smoothPath(c, pts), cI);
    ctx.fillStyle = cP;
    lens(ctx, x - 0.8 * s, y - 0.2 * s, x + 0.2 * s, y - 0.6 * s, 0.16);
  }

  function snapFurrow(x, y) {
    const F = fieldF(x, y), Fx = fieldF(x + 0.5, y), Fy = fieldF(x, y + 0.5);
    const gx = (Fx - F) * 2, gy = (Fy - F) * 2, g2 = gx * gx + gy * gy + 1e-6;
    const tgt = Math.floor(F) + 0.5;
    const k = (tgt - F) / g2;
    return [x + gx * k, y + gy * k];
  }

  const TREE_CELL = 92, TREE_SEED = 7011;
  /** Deterministic tree placement (used by props AND by the root decals in the ground). */
  function treeAt(x, y, rng) {
    const r0 = rng.next(), r1 = rng.next(), r2 = rng.next();
    if (G.nearSpawn(x, y, 95)) return null;
    const m = matAt(x, y);
    let p = 0;
    if (m.mat === 'forest') p = m.margin > 6 ? 0.62 : 0.3;
    else if (m.mat === 'meadow') p = 0.05;
    else if (m.mat === 'field') p = 0.02;
    else if (m.mat === 'soil') p = 0.1;
    if (m.dR < 14) p = 0;
    if (r0 >= p) return null;
    let type;
    if (m.mat === 'forest') type = r1 < 0.42 ? 'spruce' : r1 < 0.75 ? 'oak' : 'crown';
    else type = r1 < 0.7 ? 'oak' : 'crown';
    return { type, v: r2 };
  }

  function* decals(ctx, info) {
    const L = [];
    G.scatter(info, 26, 3101, 6, (x, y, rng) => L.push([0, x, y, rng.next(), rng.next(), rng.next()]));
    G.scatter(info, 13, 3102, 5, (x, y, rng) => L.push([1, x, y, rng.next(), rng.next(), rng.next()]));
    G.scatter(info, 11, 3103, 4, (x, y, rng) => L.push([2, x, y, rng.next(), rng.next(), rng.next()]));
    G.scatter(info, 30, 3104, 5, (x, y, rng) => L.push([3, x, y, rng.next(), rng.next(), rng.next()]));
    G.scatter(info, 150, 3105, 8, (x, y, rng) => L.push([4, x, y, rng.next(), rng.next(), rng.next()]));
    G.scatter(info, TREE_CELL, TREE_SEED, 22, (x, y, rng) => { const t = treeAt(x, y, rng); if (t) L.push([5, x, y, t.v, 0, 0]); });
    let cnt = 0;
    for (const c of L) {
      if ((++cnt & 15) === 0) yield;
      const [kind, x, y, r1, r2, r3] = c;
      const rng = U.rng(((x * 73) | 0) ^ ((y * 151) | 0) ^ (kind * 977));
      if (kind === 5) {
        // carved roots radiating from a tree trunk into the ground
        ctx.fillStyle = cI;
        const n = 4 + ((r1 * 3) | 0);
        for (let k = 0; k < n; k++) {
          const a = (k / n) * TAU + R(-0.3, 0.3, rng);
          const L1 = R(9, 16, rng);
          const p = [[x + Math.cos(a) * 2, y + Math.sin(a) * 1.2]];
          let cx = p[0][0], cy = p[0][1], aa = a;
          for (let s = 0; s < 3; s++) { aa += R(-0.4, 0.4, rng); cx += Math.cos(aa) * L1 / 3; cy += Math.sin(aa) * L1 / 3 * 0.6; p.push([cx, cy]); }
          limb(ctx, p, 1.1, 0.08);
        }
        continue;
      }
      if (kind === 2 && r3 > 0.62) continue; // cheap early-out for most field candidates
      const m = matAt(x, y);
      if (kind === 0) {
        if (m.mat === 'meadow' && m.margin > 4) {
          if (r1 < 0.16) dFlower(ctx, x, y, R(0.8, 1.15, rng), rng);
          else if (r1 < 0.24) dStar(ctx, x, y, R(0.7, 1.0, rng), rng);
          else if (r1 < 0.36) dPebble(ctx, x, y, 1, rng, false);
        } else if (m.mat === 'forest' && m.margin > 4) {
          if (r1 < 0.12) dMushroom(ctx, x, y, R(0.8, 1.1, rng), rng);
          else if (r1 < 0.32) dTwig(ctx, x, y, 1, rng);
        }
      } else if (kind === 1) {
        if (m.mat === 'forest' && m.margin > 3 && r1 < 0.45) dLeaf(ctx, x, y, R(0.9, 1.3, rng), rng);
      } else if (kind === 2) {
        if (m.mat === 'field' && m.margin > 3) {
          const turnipField = U.noise(x / 260, y / 260, 818) > 0.5;
          if (turnipField) { const [sx, sy] = snapFurrow(x, y); dSprout(ctx, sx, sy, R(0.85, 1.1, rng), rng); }
          else if (r1 < 0.25) { const [sx, sy] = snapFurrow(x, y); dClod(ctx, sx, sy, 1, rng); }
        }
      } else if (kind === 3) {
        if (m.mat === 'soil' && m.margin > 5) {
          if (r1 < 0.35) dBone(ctx, x, y, R(0.8, 1.1, rng), rng, true);
          else if (r1 < 0.7) dPebble(ctx, x, y, R(0.6, 0.9, rng), rng, true);
        }
      } else if (kind === 4) {
        if (m.margin < 6) continue;
        if (m.mat === 'meadow' || m.mat === 'forest') {
          if (r1 < 0.45) dSkull(ctx, x, y, R(0.8, 1.0, rng), rng);
          else if (r1 < 0.8) dBone(ctx, x, y, 1, rng, false);
        } else if (m.mat === 'field' && r1 < 0.6) dTurnip(ctx, x, y, R(0.9, 1.1, rng), rng);
      }
    }
  }

  /* ===================================================================================== props */
  function propsFor(info) {
    const out = [];
    G.scatterOwned(info, TREE_CELL, TREE_SEED, (x, y, rng) => {
      const t = treeAt(x, y, rng);
      if (!t) return;
      const P = SPR.props;
      const arr = P[t.type];
      out.push({ x, y, t: t.type, spr: arr[Math.floor(t.v * arr.length) % arr.length], sh: t.type === 'spruce' ? SPR.shSpruce : SPR.shTree, pad: 100 });
    });
    // graveyards
    G.scatterOwned(info, 30, 7012, (x, y, rng) => {
      const zone = U.noise(x / 360, y / 360, 808);
      const r0 = rng.next(), r1 = rng.next();
      if (zone < 0.66 && r0 > 0.012) return;
      if (zone >= 0.66 && r0 > 0.5) return;
      if (G.nearSpawn(x, y, 90)) return;
      const m = matAt(x, y);
      if ((m.mat !== 'meadow' && m.mat !== 'forest') || m.margin < 5) return;
      out.push({ x, y, t: 'grave', spr: SPR.props.grave[Math.floor(r1 * 3) % 3], sh: SPR.shGrave, pad: 30 });
    });
    // fences, scarecrows, crows, haystacks
    G.scatterOwned(info, 128, 7013, (x, y, rng) => {
      const r0 = rng.next(), r1 = rng.next();
      if (r0 > 0.16 || G.nearSpawn(x, y, 90)) return;
      const m = matAt(x, y);
      if ((m.mat !== 'meadow' && m.mat !== 'field') || m.margin < 8) return;
      out.push({ x, y, t: 'fence', spr: SPR.props.fence[r1 < 0.5 ? 0 : 1], sh: SPR.shFence, pad: 30 });
    });
    G.scatterOwned(info, 200, 7014, (x, y, rng) => {
      const r0 = rng.next();
      if (r0 > 0.45 || G.nearSpawn(x, y, 90)) return;
      const m = matAt(x, y);
      if (m.mat !== 'field' || m.margin < 10) return;
      out.push({ x, y, t: 'scare', spr: SPR.props.scare[0], sh: SPR.shScare, pad: 60 });
    });
    G.scatterOwned(info, 170, 7015, (x, y, rng) => {
      const r0 = rng.next(), r1 = rng.next();
      if (r0 > 0.2 || G.nearSpawn(x, y, 90)) return;
      const m = matAt(x, y);
      if ((m.mat !== 'meadow' && m.mat !== 'field') || m.margin < 6) return;
      out.push({ x, y, t: 'crow', anim: r1 * 10, sh: SPR.shPole, pad: 40 });
    });
    G.scatterOwned(info, 190, 7016, (x, y, rng) => {
      const r0 = rng.next();
      if (r0 > 0.2 || G.nearSpawn(x, y, 90)) return;
      const m = matAt(x, y);
      if ((m.mat !== 'meadow' && m.mat !== 'field') || m.margin < 12) return;
      out.push({ x, y, t: 'hay', spr: SPR.props.hay[0], sh: SPR.shHay, pad: 40 });
    });
    // turnip lanterns along the roads
    G.scatterOwned(info, 64, 7017, (x, y, rng) => {
      const r0 = rng.next(), r1 = rng.next();
      if (r0 > 0.5 || G.nearSpawn(x, y, 80)) return;
      const m = matAt(x, y);
      if (m.dR < 4 || m.dR > 12 || m.mat === 'soil') return;
      out.push({ x, y, t: 'pole', anim: r1 * 10, sh: SPR.shPole, pad: 50 });
    });
    return out;
  }

  /* ===================================================================================== icons */
  function seedShape(c, x, y, a, L, w) {
    const ca = Math.cos(a), sa = Math.sin(a);
    const p = (u, v) => [x + ca * u - sa * v, y + sa * u + ca * v];
    const A = p(-L, 0), B = p(L * 1.1, 0), C1 = p(-L * 0.2, -w * 2), C2 = p(-L * 0.2, w * 2);
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
      const l = L * (1 - Math.abs(off) / (gap * n) * 0.6);
      lens(ctx, bx, by, bx - ca * l, by - sa * l, w);
    }
  }
  function medallion(ctx) {
    ctx.fillStyle = cI;
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * TAU;
      const da = TAU / 24 * 0.32;
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
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * TAU;
      ctx.beginPath(); ctx.arc(50 + Math.cos(a) * 42.6, 50 + Math.sin(a) * 42.6, 1.1, 0, TAU); ctx.fill();
    }
  }
  function drawIconArt(ctx, id) {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    switch (id) {
      case 'hp-heart': case 'heart': {
        const heart = (c) => {
          c.moveTo(50, 87); c.bezierCurveTo(30, 72, 9, 58, 11, 36); c.bezierCurveTo(13, 16, 39, 11, 50, 30);
          c.bezierCurveTo(61, 11, 87, 16, 89, 36); c.bezierCurveTo(91, 58, 70, 72, 50, 87); c.closePath();
        };
        fillPath(ctx, heart, cP);
        ctx.save(); ctx.translate(3, 2.5); fillPath(ctx, heart, cO); ctx.restore();
        clipDo(ctx, heart, () => { ctx.fillStyle = cI; for (let k = 0; k < 5; k++) lens(ctx, 56 + k * 7, 82 - k * 2, 90, 30 + k * 6, 1.6 + k * 0.6, 3); });
        crescent(ctx, heart, 50, 50, -4, -4, 0.92, cI);
        strokePath(ctx, heart, cI, 5);
        ctx.fillStyle = cP;
        lens(ctx, 19, 40, 31, 22, 3.2, -3);
        lens(ctx, 33, 21, 41, 25, 1.8, -1);
        break;
      }
      case 'kills': {
        ctx.fillStyle = cI;
        lens(ctx, 14, 86, 86, 58, 4.5); lens(ctx, 14, 58, 86, 86, 4.5);
        for (const [x, y] of [[14, 86], [86, 58], [14, 58], [86, 86]]) { ctx.beginPath(); ctx.arc(x, y - 3, 5, 0, TAU); ctx.arc(x, y + 3, 5, 0, TAU); ctx.fill(); }
        const sk = (c) => { c.arc(50, 42, 27, Math.PI * 0.78, Math.PI * 2.22); c.lineTo(66, 76); c.lineTo(34, 76); c.closePath(); };
        fillPath(ctx, sk, cP);
        clipDo(ctx, sk, () => { ctx.fillStyle = cI; for (let k = 0; k < 5; k++) lens(ctx, 62 + k * 5, 18 + k * 3, 64 + k * 4, 80, 1.2 + k * 0.5, 2); });
        strokePath(ctx, sk, cI, 5);
        ctx.fillStyle = cI;
        ctx.beginPath(); ctx.ellipse(38, 46, 8, 9, 0.2, 0, TAU); ctx.ellipse(62, 46, 8, 9, -0.2, 0, TAU); ctx.fill();
        fillPath(ctx, (c) => polyPath(c, [[50, 55], [45, 64], [55, 64]]), cI);
        for (const x of [42, 50, 58]) lens(ctx, x, 66, x, 78, 1.6);
        ctx.fillStyle = cP;
        lens(ctx, 30, 30, 42, 20, 2.4, -2);
        break;
      }
      case 'dmg': {
        iconSeed(ctx, 46, 54, -0.75, 30, 13, 5);
        ctx.fillStyle = cI;
        for (let k = 0; k < 7; k++) {
          const a = -0.75 + (k - 3) * 0.32;
          const r1 = k & 1 ? 20 : 30;
          lens(ctx, 70 + Math.cos(a) * 6, 30 + Math.sin(a) * 6, 70 + Math.cos(a) * r1, 30 + Math.sin(a) * r1, k & 1 ? 1.6 : 2.4);
        }
        break;
      }
      case 'rate': {
        for (let k = 0; k < 3; k++) {
          const x = 70 - k * 15, y = 26 + k * 24;
          speedLines(ctx, x - 16, y, 0, 3, 26 - k * 3, 5, 1.4);
          iconSeed(ctx, x, y, 0, 13, 6, 3.6);
        }
        break;
      }
      case 'multi': {
        for (const [x, y, a] of [[32, 26, -2.2], [52, 16, -1.6], [72, 26, -0.9]]) iconSeed(ctx, x, y, a, 10, 5, 3);
        const bag = (c) => { c.moveTo(36, 40); c.bezierCurveTo(10, 56, 14, 92, 50, 92); c.bezierCurveTo(86, 92, 90, 56, 64, 40); c.quadraticCurveTo(50, 46, 36, 40); c.closePath(); };
        fillPath(ctx, bag, cI);
        ctx.fillStyle = cP;
        for (let k = 0; k < 4; k++) arcLens(ctx, 52, 68, 30 - k * 6, Math.PI * 0.95, Math.PI * 1.25, 1.5 - k * 0.2);
        lens(ctx, 34, 44, 66, 44, 2.6, 2);
        ctx.strokeStyle = cP; ctx.lineWidth = 2.2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(26, 80); ctx.quadraticCurveTo(50, 88, 74, 80); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = cO;
        ctx.beginPath(); ctx.arc(50, 66, 7, 0, TAU); ctx.fill();
        ctx.fillStyle = cI;
        ctx.beginPath(); ctx.arc(50, 66, 2.4, 0, TAU); ctx.fill();
        break;
      }
      case 'bounce': {
        ctx.fillStyle = cI;
        ctx.fillRect(8, 78, 84, 6);
        for (let k = 0; k < 9; k++) lens(ctx, 12 + k * 9, 88, 6 + k * 9, 96, 1.2);
        ctx.fillStyle = cI;
        const pts = [];
        for (let t = 0; t <= 1.001; t += 0.05) {
          const x = 10 + t * 60;
          const y = t < 0.5 ? 20 + (t / 0.5) * (t / 0.5) * 56 : 76 - (1 - Math.pow((t - 0.5) / 0.5 - 1, 2)) * 44;
          pts.push([x, y]);
        }
        for (let k = 0; k < pts.length - 1; k += 2) lens(ctx, pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], 1.6);
        for (const a of [-2.4, -1.57, -0.7]) lens(ctx, 40 + Math.cos(a) * 5, 74 + Math.sin(a) * 5, 40 + Math.cos(a) * 13, 74 + Math.sin(a) * 13, 1.6);
        iconSeed(ctx, 76, 32, -0.9, 13, 6, 3.6);
        break;
      }
      case 'lantern': {
        ctx.save(); ctx.translate(52, 50); drawRays(ctx, 14, 22, 46, 36, cO, 0.3); ctx.restore();
        ctx.save(); ctx.translate(50, 80); ctx.scale(5.2, 5.2); drawTurnipLantern(ctx, U.rng(5), 1); ctx.restore();
        break;
      }
      case 'speed': {
        speedLines(ctx, 30, 62, 0, 4, 26, 7, 1.6);
        const shoe = (c) => {
          c.moveTo(22, 70); c.quadraticCurveTo(26, 52, 44, 50); c.quadraticCurveTo(60, 48, 70, 60);
          c.quadraticCurveTo(84, 66, 92, 74); c.quadraticCurveTo(70, 80, 40, 76); c.lineTo(34, 76); c.lineTo(30, 88); c.lineTo(24, 88); c.closePath();
        };
        fillPath(ctx, shoe, cP);
        clipDo(ctx, shoe, () => { ctx.fillStyle = cI; for (let k = 0; k < 5; k++) lens(ctx, 30 + k * 12, 80, 46 + k * 10, 64, 1.4 + k * 0.2, 2); });
        strokePath(ctx, shoe, cI, 4.5);
        ctx.fillStyle = cI;
        fillPath(ctx, (c) => polyPath(c, [[24, 76], [34, 76], [30, 90], [24, 90]]), cI);
        ctx.save(); ctx.translate(2, 1.5); ctx.beginPath(); ctx.arc(52, 58, 6.5, 0, TAU); ctx.fillStyle = cO; ctx.fill(); ctx.restore();
        ctx.beginPath(); ctx.arc(52, 58, 6.5, 0, TAU); ctx.strokeStyle = cI; ctx.lineWidth = 2.4; ctx.stroke();
        ctx.fillStyle = cI; taper(ctx, 52, 52, 54, 46, 1.4);
        ctx.fillStyle = cP; lens(ctx, 30, 62, 44, 54, 1.6, -1.5);
        break;
      }
      case 'magnet': {
        ctx.fillStyle = cI;
        for (let k = 0; k < 3; k++) arcLens(ctx, 50, 50, 46 - k * 6, Math.PI * 1.1, Math.PI * 1.36, 1.4, 1);
        for (let k = 0; k < 3; k++) arcLens(ctx, 50, 50, 46 - k * 6, Math.PI * 1.64, Math.PI * 1.9, 1.4, 1);
        ctx.lineWidth = 4; ctx.strokeStyle = cI;
        ctx.beginPath(); ctx.arc(50, 52, 20, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
        for (const [x, y] of [[40, 50], [56, 46], [48, 40]]) {
          ctx.save(); ctx.translate(1.5, 1.5); star(ctx, x, y, 4, 8, 3, 0.3); ctx.fillStyle = cO; ctx.fill(); ctx.restore();
          star(ctx, x, y, 4, 8, 3, 0.3); ctx.lineWidth = 2; ctx.stroke();
        }
        const bask = (c) => polyPath(c, [[22, 54], [78, 54], [70, 88], [30, 88]]);
        fillPath(ctx, bask, cI);
        ctx.fillStyle = cP;
        for (let k = 0; k < 3; k++) lens(ctx, 25 + k * 1.5, 64 + k * 9, 75 - k * 1.5, 64 + k * 9, 1.4);
        for (let k = 0; k < 5; k++) lens(ctx, 32 + k * 9, 56, 34 + k * 8, 86, 1.0);
        ctx.fillStyle = cI;
        ctx.fillRect(18, 51, 64, 5);
        break;
      }
      case 'hp': {
        ctx.save(); ctx.translate(1.5, 1.5); ctx.fillStyle = cO;
        for (let k = 0; k < 5; k++) { const x = 28 + k * 11; ctx.beginPath(); ctx.moveTo(x - 5, 96); ctx.quadraticCurveTo(x - 4, 86, x, 80 - (k & 1) * 4); ctx.quadraticCurveTo(x + 4, 86, x + 5, 96); ctx.fill(); }
        ctx.restore();
        ctx.fillStyle = cP;
        for (const x of [36, 52, 66]) limb(ctx, [[x, 30], [x - 5, 22], [x + 3, 14], [x - 2, 6]], 2.2, 0.6);
        ctx.fillStyle = cI;
        for (const x of [36, 52, 66]) limb(ctx, [[x + 1.5, 30], [x - 3.5, 22], [x + 4.5, 14], [x - 0.5, 6]], 0.9, 0.3);
        // turnip peeking out
        leaf(ctx, 56, 34, 50, 18, 3.4, -2);
        leaf(ctx, 58, 34, 66, 20, 3.2, 2);
        fillPath(ctx, (c) => c.arc(57, 40, 9, Math.PI, 0), cP);
        strokePath(ctx, (c) => c.arc(57, 40, 9, Math.PI, 0), cI, 2.6);
        ctx.fillStyle = cI;
        for (let k = 0; k < 3; k++) lens(ctx, 50 + k * 4, 33, 52 + k * 4, 40, 1.0);
        const pot = (c) => { c.moveTo(16, 44); c.lineTo(84, 44); c.bezierCurveTo(86, 70, 74, 86, 50, 86); c.bezierCurveTo(26, 86, 14, 70, 16, 44); c.closePath(); };
        fillPath(ctx, pot, cI);
        ctx.fillStyle = cP;
        for (let k = 0; k < 4; k++) arcLens(ctx, 50, 46, 34 - k * 6, Math.PI * 0.55, Math.PI * 0.82, 1.6 - k * 0.25);
        ctx.fillStyle = cI;
        ctx.fillRect(10, 40, 80, 7);
        ctx.fillStyle = cP; lens(ctx, 14, 43.5, 50, 43.5, 1.0);
        ctx.fillStyle = cI;
        ctx.fillRect(10, 52, 6, 4); ctx.fillRect(84, 52, 6, 4);
        break;
      }
      default: {
        star(ctx, 50, 50, 5, 30, 12, 0); ctx.fillStyle = cI; ctx.fill();
      }
    }
  }

  /* ===================================================================================== damage numbers */
  const NUMS = new Map();
  let numFontOk = false, numCheck = 0;
  function numSprite(value, crit) {
    const key = value + (crit ? 'c' : 'n');
    let s = NUMS.get(key);
    if (s) return s;
    if (NUMS.size > 300) NUMS.clear();
    const fam = numFontOk ? '"Alfa Slab One", Georgia, serif' : 'Georgia, serif';
    const px = Math.round((crit ? 11.5 : 8.5) * K);
    const txt = String(value);
    const m = U.canvas(4, 4).ctx;
    m.font = px + 'px ' + fam;
    const w = m.measureText(txt).width;
    const pad = Math.ceil(px * 0.3);
    const { c, ctx } = U.canvas(w + pad * 2 + px * 0.2, px * 1.25 + pad * 2);
    ctx.font = px + 'px ' + fam;
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    const bx = pad, by = pad + px;
    ctx.strokeStyle = cP;
    ctx.lineWidth = px * (crit ? 0.36 : 0.3);
    ctx.strokeText(txt, bx, by);
    if (crit) {
      ctx.fillStyle = cI;
      ctx.fillText(txt, bx + MX * K * 0.6, by + MY * K * 0.6);
      ctx.strokeStyle = cI; ctx.lineWidth = px * 0.09; ctx.strokeText(txt, bx, by);
      ctx.fillStyle = cO; ctx.fillText(txt, bx, by);
    } else {
      ctx.fillStyle = cI;
      ctx.fillText(txt, bx, by);
    }
    s = { c, ax: c.width / 2, ay: by };
    NUMS.set(key, s);
    return s;
  }

  /* ===================================================================================== screen frame */
  let FRAME = null;
  function buildFrame(W, H) {
    const t = Math.max(6, Math.round(H * 0.011));
    const rng = U.rng(31337);
    const mkStrip = (len, horiz) => {
      const { c, ctx } = U.canvas(horiz ? len : t * 2, horiz ? t * 2 : len);
      ctx.fillStyle = cI;
      ctx.beginPath();
      if (horiz) {
        ctx.moveTo(0, 0); ctx.lineTo(len, 0);
        for (let x = len; x >= 0; x -= R(6, 18, rng)) ctx.lineTo(x, t * R(0.55, 1.0, rng));
        ctx.lineTo(0, t * 0.8);
      } else {
        ctx.moveTo(0, 0); ctx.lineTo(0, len);
        for (let y = len; y >= 0; y -= R(6, 18, rng)) ctx.lineTo(t * R(0.55, 1.0, rng), y);
        ctx.lineTo(t * 0.8, 0);
      }
      ctx.closePath();
      ctx.fill();
      // inner rule
      ctx.fillStyle = cI;
      if (horiz) ctx.fillRect(0, t * 1.35, len, Math.max(1, t * 0.18));
      else ctx.fillRect(t * 1.35, 0, Math.max(1, t * 0.18), len);
      return c;
    };
    FRAME = { W, H, t, top: mkStrip(W, true), bot: mkStrip(W, true), left: mkStrip(H, false), right: mkStrip(H, false) };
  }

  /* ===================================================================================== effects state */
  const SPL = []; // ground splats {x,y,spr,born,life,s}
  let lastGameTime = 0;
  let hurtAt = -1e9;
  function addSplat(x, y, s, life, t) {
    if (SPL.length > 70) SPL.shift();
    SPL.push({ x, y, spr: SPR.splat[(Math.random() * 4) | 0], born: t, life, s, flip: Math.random() < 0.5 });
  }

  /* ===================================================================================== CSS */
  const NOISE_SVG = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.11 0 0 0 0 0.09 0 0 0 0 0.07 0 0 0 0.32 -0.05'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")";
  const CSS = `
body.style-linocut { --paper:#f0e7d2; --ink:#1b1715; --org:#ea6820; --teal:#2e7674; }
body.style-linocut #hud { padding: 12px 18px; font-family: 'Special Elite', 'Courier New', monospace; color: var(--ink); }
body.style-linocut #hud .xp { height: 20px; background: var(--paper) ${NOISE_SVG}; border: 3px solid var(--ink); border-radius: 2px; box-shadow: 4px 4px 0 var(--ink); }
body.style-linocut #hud .xp-fill { background: repeating-linear-gradient(-62deg, var(--org) 0 7px, var(--ink) 7px 8.5px); box-shadow: 3px 0 0 var(--ink); transition: width .15s steps(3); }
body.style-linocut #hud .lvl { right: 0; top: 0; bottom: 0; transform: none; display: flex; align-items: center; padding: 0 12px; background: var(--ink); color: var(--paper);
  font-family: 'Alfa Slab One', Georgia, serif; font-weight: 400; font-size: 13px; letter-spacing: 1px; text-shadow: none; }
body.style-linocut #hud .topline { margin-top: 14px; }
body.style-linocut #hud .hp { gap: 10px; }
body.style-linocut #hud .hp-icon, body.style-linocut #hud .kills-icon { width: 36px; height: 36px; }
body.style-linocut #hud .hp-bar { width: 230px; height: 22px; background: var(--paper) ${NOISE_SVG}; border: 3px solid var(--ink); border-radius: 2px; box-shadow: 4px 4px 0 var(--ink); }
body.style-linocut #hud .hp-fill { background: repeating-linear-gradient(-62deg, var(--ink) 0 9px, var(--paper) 9px 10.5px); transition: width .12s steps(2); }
body.style-linocut #hud .hp-text { font-family: 'Alfa Slab One', Georgia, serif; font-weight: 400; font-size: 17px; color: var(--ink);
  text-shadow: 2px 0 var(--paper), -2px 0 var(--paper), 0 2px var(--paper), 0 -2px var(--paper), 2px 2px var(--paper), -2px -2px var(--paper), 2px -2px var(--paper), -2px 2px var(--paper); }
body.style-linocut #hud .clock { background: var(--paper) ${NOISE_SVG}; border: 3px solid var(--ink); padding: 3px 22px 4px; margin-top: 3px;
  box-shadow: 0 0 0 3px var(--paper), 0 0 0 6px var(--ink), 7px 7px 0 6px var(--ink); }
body.style-linocut #hud .clock-time { font-family: 'Rye', Georgia, serif; font-weight: 400; font-size: 34px; line-height: 1.05; letter-spacing: 2px; color: var(--ink); text-shadow: 2px 2px 0 var(--org); }
body.style-linocut #hud .clock-label { font-family: 'Special Elite', monospace; font-size: 11px; letter-spacing: 3px; opacity: 1; color: var(--ink); border-top: 2px solid var(--ink); padding-top: 2px; }
body.style-linocut #hud .kills { font-family: 'Alfa Slab One', Georgia, serif; font-weight: 400; font-size: 22px; color: var(--ink); text-shadow: none; gap: 8px; }
body.style-linocut #hud .kills-num { background: var(--paper) ${NOISE_SVG}; border: 3px solid var(--ink); padding: 0 12px; min-width: 64px; text-align: center; box-shadow: 4px 4px 0 var(--ink); }
body.style-linocut.hurt #hud .hp-bar { filter: invert(1); }
body.style-linocut #stylebar { background: var(--paper) ${NOISE_SVG}; color: var(--ink); border: 2px solid var(--ink); border-radius: 0; box-shadow: 4px 4px 0 var(--ink); font-family: 'Special Elite', monospace; }
body.style-linocut #stylebar .style-name { font-family: 'Rye', Georgia, serif; font-weight: 400; font-size: 17px; }
body.style-linocut #stylebar .style-family { opacity: 1; letter-spacing: 2px; }
body.style-linocut #stylebar .auto.on { color: var(--org); }
body.style-linocut #levelup { background-color: rgba(27,23,21,.80); background-image: radial-gradient(circle, rgba(240,231,210,.16) 0 1.3px, transparent 1.7px); background-size: 8px 8px; gap: 26px; }
body.style-linocut #levelup .lu-title { font-family: 'Rye', Georgia, serif; font-weight: 400; font-size: 72px; letter-spacing: 3px; color: var(--paper); text-shadow: 5px 4px 0 var(--org); }
body.style-linocut #levelup .lu-cards { gap: 26px; }
body.style-linocut #levelup .card { width: 224px; min-height: 304px; padding: 26px 18px 20px; gap: 8px; color: var(--ink); background: var(--paper) ${NOISE_SVG};
  border: 3px solid var(--ink); border-radius: 9px; box-shadow: inset 0 0 0 6px var(--paper), inset 0 0 0 8px var(--ink), 8px 8px 0 #0d0b0a; transition: transform .1s steps(2), box-shadow .1s steps(2); }
body.style-linocut #levelup .card:hover { transform: translateY(-8px) rotate(-1.5deg); box-shadow: inset 0 0 0 6px var(--paper), inset 0 0 0 8px var(--ink), 10px 12px 0 var(--org); }
body.style-linocut #levelup .card-icon { width: 120px; height: 120px; }
body.style-linocut #levelup .card-name { font-family: 'Alfa Slab One', Georgia, serif; font-weight: 400; font-size: 20px; line-height: 1.15; border-bottom: 2px solid var(--ink); padding: 0 4px 6px; }
body.style-linocut #levelup .card-desc { font-family: 'Special Elite', monospace; font-size: 15px; opacity: 1; line-height: 1.3; }
body.style-linocut #levelup .card-key { font-family: 'Rye', Georgia, serif; font-weight: 400; font-size: 24px; top: 12px; left: 16px; opacity: 1; color: var(--org); text-shadow: 1px 1px 0 var(--ink); }
body.style-linocut #levelup .lu-hint { font-family: 'Special Elite', monospace; font-size: 15px; letter-spacing: 2px; color: var(--paper); opacity: .9; }
body.style-linocut #gameover { background-color: rgba(27,23,21,.86); background-image: radial-gradient(circle, rgba(240,231,210,.14) 0 1.3px, transparent 1.7px); background-size: 8px 8px; }
body.style-linocut #gameover .go-title { font-family: 'Rye', Georgia, serif; font-weight: 400; font-size: 66px; color: var(--paper); text-shadow: 5px 4px 0 var(--org); }
body.style-linocut #gameover .go-stats { font-family: 'Special Elite', monospace; font-size: 19px; color: var(--paper); }
body.style-linocut #gameover .go-hint { font-family: 'Special Elite', monospace; color: var(--paper); letter-spacing: 2px; }
body.style-linocut #pausebox { font-family: 'Rye', Georgia, serif; font-weight: 400; font-size: 58px; color: var(--paper); text-shadow: 4px 3px 0 var(--org), 0 0 0 var(--ink); -webkit-text-stroke: 2px var(--ink); }
`;

  /* ===================================================================================== the style */
  Styles.register({
    id: 'linocut',
    name: 'Holzschnitt',
    family: 'Druckgrafik',
    description: 'Ein bewegter Linolschnitt: Papier, Ruß-Schwarz und ein versetzter Kürbis-Orange-Druck – Volkssagen-Flugblatt trifft Siebdruckplakat.',
    groundColor: '#f0e7d2',
    groundResMax: 2.5,
    chunkSize: 256,
    fonts: ['Rye', 'Alfa+Slab+One', 'Special+Elite'],
    css: CSS,

    init() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const h = (window.__forceH || window.innerHeight || 900) * dpr;
      K = U.clamp(Math.round((h / 360) * 4) / 4, 2, 5);
      buildTextures();
      buildSprites();
    },

    renderGroundChunk(ctx, info) { return renderGround(ctx, info); },
    propsForChunk(info) { return propsFor(info); },

    drawProp(ctx, p, view) {
      base(view);
      let spr = p.spr;
      if (p.t === 'pole') spr = SPR.props.pole[Math.floor(view.rt * 3.2 + p.anim) & 1];
      else if (p.t === 'crow') spr = SPR.props.crow[Math.floor(view.rt * 0.7 + p.anim) % 5 === 0 ? 1 : 0];
      blit(ctx, spr, p.x, p.y);
    },

    drawShadow(ctx, o, view) {
      base(view);
      if (o.kind === 'prop') { if (o.sh) blit(ctx, o.sh, o.x, o.y); return; }
      if (o.kind === 'enemy') {
        if (o.dying) return;
        const sh = o.type === 'ghost' ? SPR.shGhost : o.type === 'colossus' ? SPR.shColossus : SPR.shCreeper;
        if (o.spawnT < 1) { const s = 0.3 + 0.7 * o.spawnT; blitS(ctx, sh, o.x, o.y, s, s); return; }
        blit(ctx, sh, o.x, o.y + 0.5);
        return;
      }
      blit(ctx, SPR.shJack, o.x, o.y + 0.5);
    },

    drawGroundOverlay(ctx, view, game) {
      base(view);
      const t = game.time;
      if (t < lastGameTime - 0.5) SPL.length = 0;
      lastGameTime = t;
      for (let i = SPL.length - 1; i >= 0; i--) {
        const s = SPL[i];
        const age = t - s.born;
        if (age > s.life || age < 0) { SPL.splice(i, 1); continue; }
        const k = age < 0.08 ? 0.6 + (age / 0.08) * 0.4 : 1;
        const fade = s.life - age < 0.5 ? (s.life - age) / 0.5 : 1;
        ctx.globalAlpha = fade;
        blitS(ctx, s.spr, s.x, s.y, s.s * k, s.s * k);
      }
      ctx.globalAlpha = 1;
    },

    drawGem(ctx, g, view) {
      base(view);
      const fr = (Math.floor(view.rt * 4 + g.seed * 8) & 1);
      const bob = Math.sin(view.rt * 3 + g.seed * 20) * 0.7;
      blit(ctx, SPR.shGem, g.x, g.y + 0.6);
      const spr = g.big ? SPR.gemBig[fr] : SPR.gem[fr];
      if (g.pop > 0) { const s = 1 + g.pop * 0.7; blitS(ctx, spr, g.x, g.y - g.pop * 4, s, s); }
      else blit(ctx, spr, g.x, g.y - 1 + bob);
    },

    drawEnemy(ctx, e, view) {
      base(view);
      const set = SPR[e.type];
      if (!set) return;
      const fi = e.facing < 0 ? 1 : 0;
      if (e.dying) {
        const t = e.deathT;
        if (t < 0.16) {
          const s = 1 + t * 0.6;
          blitS(ctx, set.i[fi][0][0], e.x, e.y, s, s);
          return;
        }
        const u = (t - 0.16) / 0.84;
        const sh = set.sh[fi];
        const big = e.type === 'colossus' ? 1.8 : 1;
        ctx.globalAlpha = Math.max(0, 1 - u * u);
        for (let i = 0; i < sh.length; i++) {
          const p = sh[i];
          const d = (2 + 12 * U.ease.outQuad(u)) * big;
          const x = e.x + p.dx * d, y = e.y + p.dy * d * 0.7 - 6 * big * u + 26 * u * u;
          const pivotY = (p.ay - (set.n[fi][0][0].ay)) / K;
          blitRot(ctx, p, x, y + pivotY, (i & 1 ? 1 : -1) * u * 1.6, 1);
        }
        ctx.globalAlpha = 1;
        return;
      }
      let fr;
      if (e.type === 'ghost') fr = Math.floor(view.rt * 5 + e.seed * 9) & 3;
      else if (e.type === 'colossus') fr = Math.floor(e.anim * 2.4) & 3;
      else fr = Math.floor(e.anim * 3.2) & 3;
      const v = Math.floor(view.rt * 6 + e.seed * 10) & 1;
      const spr = (e.flash > 0.45 ? set.i : set.n)[fi][fr][v];
      let y = e.y;
      if (e.type === 'ghost') y -= 2.2 + Math.round(Math.sin(view.rt * 3.1 + e.seed * 20) * 2.5) * 0.4;
      if (e.spawnT < 1) {
        const t = e.spawnT;
        if (t < 0.5) {
          // the block is being lowered onto the paper
          const k = t / 0.5;
          const s = 1 + (1 - k) * (1 - k) * 0.9;
          ctx.globalAlpha = 0.25 + 0.75 * k;
          blitS(ctx, spr, e.x, y - (1 - k) * 10, s, s);
          ctx.globalAlpha = 1;
          return;
        }
        if (!e._lcStamp) {
          e._lcStamp = 1;
          addSplat(e.x, e.y + 0.5, e.type === 'colossus' ? 1.5 : e.type === 'ghost' ? 0.55 : 0.8, 0.9, view.game.time);
        }
        const k = (t - 0.5) / 0.5;
        const sq = Math.sin(k * Math.PI) * 0.14 * (1 - k);
        blitS(ctx, spr, e.x, y, 1 + sq, 1 - sq);
        return;
      }
      if (e._lcStamp) e._lcStamp = 0;
      blit(ctx, spr, e.x, y);
    },

    drawPlayer(ctx, p, view) {
      base(view);
      const rt = view.rt;
      const fi = p.facing < 0 ? 1 : 0;
      const v = Math.floor(rt * 6) & 1;
      const since = (performance.now() - hurtAt) / 1000;
      const inv = p.hurtT > 0.6 || (since < 0.75 && p.iframes > 0 && (Math.floor(since * 14) & 1) === 1);
      let spr;
      if (p.moving) spr = (inv ? SPR.jack.walkI : SPR.jack.walk)[fi][Math.floor(p.anim * 1.25) & 3][v];
      else spr = (inv ? SPR.jack.idleI : SPR.jack.idle)[fi][Math.floor(rt * 2.2) & 1][v];
      if (p.levelT > 0) {
        const s = 0.6 + 0.6 * (1 - p.levelT * 0.5);
        ctx.globalAlpha = Math.min(1, p.levelT * 2);
        blitRot(ctx, SPR.raysBig, p.x + MX, p.y - 18 + MY, rt * 0.8, s);
        ctx.globalAlpha = 1;
      }
      if (p.dashT > 0) {
        const k = p.dashT / 0.2;
        for (let i = 2; i >= 1; i--) {
          ctx.globalAlpha = 0.55 * k / i;
          blit(ctx, SPR.jack.ghost[fi], p.x - p.dashX * i * 7, p.y - p.dashY * i * 7);
        }
        ctx.globalAlpha = 1;
        const a = Math.atan2(p.dashY, p.dashX);
        blitRot(ctx, SPR.trail, p.x - p.dashX * 3, p.y - 10 - p.dashY * 3, a, 1.3);
      }
      blit(ctx, spr, p.x, p.y);
    },

    drawOrbital(ctx, o, view) {
      base(view);
      ctx.globalAlpha = 1;
      blitRot(ctx, SPR.rays, o.x + MX, o.y - 6 + MY, view.rt * 0.9 + o.idx, 0.85);
      const v = Math.floor(view.rt * 6 + o.idx) & 1;
      blit(ctx, SPR.lantern[v], o.x, o.y + Math.sin(view.rt * 4 + o.idx) * 0.6);
    },

    drawProjectile(ctx, pr, view) {
      base(view);
      const a = Math.atan2(pr.vy, pr.vx);
      const k = Math.min(1, pr.age * 8);
      blitRot(ctx, SPR.trail, pr.x, pr.y, a, 0.45 + 0.55 * k);
      const spin = a + Math.round(pr.spin / (Math.PI / 4)) * (Math.PI / 4) * 0.35;
      blitRot(ctx, SPR.seedO, pr.x + MX, pr.y + MY, spin, 1);
      blitRot(ctx, SPR.seedK[Math.floor(pr.spin) & 1], pr.x, pr.y, spin, 1);
    },

    drawParticle(ctx, pt, view) {
      base(view);
      const life = pt.life / pt.max;
      const age = 1 - life;
      switch (pt.kind) {
        case 'drop': {
          const s = pt.size * (pt.z > 0.1 ? 1 : 1.25);
          ctx.globalAlpha = life < 0.3 ? life / 0.3 : 1;
          blitS(ctx, SPR.drop[(pt.seed * 4) | 0], pt.x, pt.y - pt.z, s, s);
          break;
        }
        case 'chip': {
          ctx.globalAlpha = life < 0.25 ? life / 0.25 : 1;
          blitRot(ctx, pt.orange ? SPR.chipO : SPR.chip[(pt.seed * 4) | 0], pt.x, pt.y - pt.z, pt.rot, pt.size);
          break;
        }
        case 'burst': {
          const s = pt.size * (0.55 + 0.7 * U.ease.outQuad(Math.min(1, age * 1.6)));
          if (age > 0.75) break;
          blitRot(ctx, pt.orange ? SPR.burstO : SPR.burst, pt.x, pt.y - pt.z, pt.rot, s);
          break;
        }
        case 'puff': {
          const f = Math.min(2, (age * 3) | 0);
          const s = pt.size * (0.6 + age * 0.8);
          blitS(ctx, SPR.puff[f], pt.x, pt.y - pt.z, s, s * 0.8);
          break;
        }
        case 'star': {
          const s = pt.size * (age < 0.2 ? age / 0.2 : 1 - (age - 0.2) * 0.8);
          blitRot(ctx, SPR.star, pt.x, pt.y - pt.z, pt.rot, s);
          break;
        }
        case 'ring': {
          const s = pt.size * (0.4 + U.ease.outQuad(age) * 1.2);
          ctx.globalAlpha = life < 0.4 ? life / 0.4 : 1;
          blitRot(ctx, SPR.ring, pt.x, pt.y - pt.z, pt.rot, s);
          break;
        }
        default: {
          ctx.globalAlpha = life;
          ctx.fillStyle = cI;
          ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.z - pt.size / 2, pt.size, pt.size);
        }
      }
      ctx.globalAlpha = 1;
    },

    drawNumber(ctx, n, view) {
      if (!numFontOk && (numCheck++ & 31) === 0 && document.fonts && document.fonts.check('20px "Alfa Slab One"')) {
        numFontOk = true;
        NUMS.clear();
      }
      const spr = numSprite(n.value, n.crit);
      const age = n.max - n.life;
      const k = age < 0.07 ? 1 + (1 - age / 0.07) * 0.7 : 1;
      ctx.globalAlpha = n.life < 0.22 ? n.life / 0.22 : 1;
      blitS(ctx, spr, n.x, n.y, k, k);
      ctx.globalAlpha = 1;
    },

    drawScreenOverlay(ctx, view) {
      if (!FRAME || FRAME.W !== view.W || FRAME.H !== view.H) buildFrame(view.W, view.H);
      const t = FRAME.t;
      ctx.drawImage(FRAME.top, 0, 0);
      ctx.save();
      ctx.translate(view.W, view.H);
      ctx.scale(-1, -1);
      ctx.drawImage(FRAME.bot, 0, 0);
      ctx.restore();
      ctx.drawImage(FRAME.left, 0, 0);
      ctx.save();
      ctx.translate(view.W, view.H);
      ctx.scale(-1, -1);
      ctx.drawImage(FRAME.right, 0, 0);
      ctx.restore();
      void t;
    },

    drawIcon(ctx, id, size) {
      ctx.save();
      ctx.scale(size / 100, size / 100);
      if (size >= 80 && id !== 'hp-heart' && id !== 'kills') {
        medallion(ctx);
        ctx.translate(50, 50);
        ctx.scale(0.66, 0.66);
        ctx.translate(-50, -50);
      }
      drawIconArt(ctx, id);
      ctx.restore();
    },

    /* ---------- hooks ---------- */
    onHit(game, e, src) {
      const y = e.y - e.r * (e.type === 'colossus' ? 1.6 : 1.2);
      game.addParticle({ x: e.x, y, z: 0, kind: 'burst', life: 0.18, size: e.type === 'colossus' ? 1.1 : 0.7, rot: Math.random() * TAU, drag: 0, orange: src === 'lantern' });
      for (let i = 0; i < 2; i++) {
        const a = Math.random() * TAU, s = 30 + Math.random() * 40;
        game.addParticle({ x: e.x, y: e.y, z: e.r * 1.2, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 20 + Math.random() * 30, grav: 160, kind: 'drop', life: 0.5, size: 0.45 + Math.random() * 0.3, drag: 1.5 });
      }
    },
    onKill(game, e) {
      const big = e.type === 'colossus';
      const n = big ? 16 : e.type === 'ghost' ? 6 : 9;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU, s = (big ? 60 : 40) + Math.random() * 60;
        game.addParticle({ x: e.x, y: e.y, z: e.r * (0.6 + Math.random()), vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 40 + Math.random() * 60, grav: 220, kind: 'chip', life: 0.6 + Math.random() * 0.4, size: (big ? 1.2 : 0.8) + Math.random() * 0.4, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 18, drag: 1.2 });
      }
      for (let i = 0; i < (big ? 8 : 4); i++) {
        const a = Math.random() * TAU, s = 30 + Math.random() * 50;
        game.addParticle({ x: e.x, y: e.y, z: e.r, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 30 + Math.random() * 40, grav: 200, kind: 'drop', life: 0.8, size: 0.6 + Math.random() * 0.5, drag: 1.2 });
      }
      game.addParticle({ x: e.x, y: e.y - e.r, z: 0, kind: 'burst', life: 0.24, size: big ? 2.2 : 1.1, rot: Math.random() * TAU, drag: 0 });
      addSplat(e.x, e.y, big ? 1.6 : e.type === 'ghost' ? 0.6 : 0.9, big ? 3.2 : 2.2, game.time);
    },
    onHurt(game, p) {
      hurtAt = performance.now();
      game.addParticle({ x: p.x, y: p.y - 14, z: 0, kind: 'burst', life: 0.25, size: 1.6, rot: Math.random() * TAU, drag: 0 });
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * TAU, s = 40 + Math.random() * 50;
        game.addParticle({ x: p.x, y: p.y, z: 14, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 30 + Math.random() * 40, grav: 200, kind: i < 3 ? 'drop' : 'chip', orange: i >= 3, life: 0.6, size: 0.7 + Math.random() * 0.4, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, drag: 1.2 });
      }
    },
    onPickup(game, g) {
      const p = game.player;
      game.addParticle({ x: p.x + (Math.random() - 0.5) * 8, y: p.y - 12 - Math.random() * 8, z: 0, vy: -20, kind: 'star', life: 0.35, size: g.big ? 1.6 : 0.9, rot: Math.random(), drag: 3 });
    },
    onShoot(game, pr) {
      if (Math.random() < 0.5) game.addParticle({ x: pr.x, y: pr.y + 3, z: 0, vx: pr.vx * 0.06, vy: pr.vy * 0.06, kind: 'puff', life: 0.25, size: 0.45, drag: 4 });
    },
    onDash(game, p) {
      for (let i = 0; i < 3; i++) game.addParticle({ x: p.x - p.dashX * i * 5, y: p.y - p.dashY * i * 5, z: 0, vx: -p.dashX * 20, vy: -p.dashY * 20, kind: 'puff', life: 0.35, size: 0.8 - i * 0.15, drag: 3 });
    },
    onLevelUp(game, p) {
      game.addParticle({ x: p.x, y: p.y - 14, z: 0, kind: 'ring', life: 0.7, size: 1.6, rot: 0, drag: 0 });
      game.addParticle({ x: p.x, y: p.y - 14, z: 0, kind: 'burst', life: 0.4, size: 2.4, rot: Math.random(), drag: 0, orange: true });
    },
    onDeath(game, p) {
      addSplat(p.x, p.y, 2.0, 4, game.time);
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * TAU, s = 50 + Math.random() * 70;
        game.addParticle({ x: p.x, y: p.y, z: 14, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 40 + Math.random() * 60, grav: 220, kind: 'chip', orange: i % 2 === 0, life: 1.0, size: 1 + Math.random() * 0.5, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 18, drag: 1.2 });
      }
    },
  });
})();
