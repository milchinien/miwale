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
    // the block just before it splits: the same cut lines, carved into the print as paper cracks
    const { c: cc, ctx: cx2 } = U.canvas(w, h);
    cx2.drawImage(spr.c, 0, 0);
    cx2.globalCompositeOperation = 'source-atop';
    cx2.strokeStyle = cP;
    cx2.lineCap = 'round'; cx2.lineJoin = 'round';
    for (const A of cuts) {
      cx2.lineWidth = K * 0.75;
      cx2.beginPath();
      cx2.moveTo(A.pts[0][0], A.pts[0][1]);
      for (let k = 1; k < A.pts.length - 1; k++) cx2.lineTo(A.pts[k][0], A.pts[k][1]);
      cx2.stroke();
    }
    cx2.fillStyle = cP;
    cx2.beginPath(); cx2.arc(cx, cy, K * 1.3, 0, TAU); cx2.fill();
    out.cracked = { c: cc, ax: spr.ax, ay: spr.ay };
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

  /* ---------- main character: pumpkin-head wanderer, short ragged poncho, long striped scarf ----------
     Light always comes from the SCREEN's upper left. Every drawer works in a mirrored local space (scale(f,1)),
     so the lit side is local x-sign LS = -f: carved highlights sit on the lit side, heavy contours on the other. */
  /** Two-bone leg: knee point between hip and ankle, bent towards +x (the facing direction). */
  function kneeAt(hx, hy, ax, ay, L) {
    const dx = ax - hx, dy = ay - hy, d = Math.hypot(dx, dy) || 1e-6;
    const h = L / 2, k = d < L ? Math.sqrt(h * h - (d / 2) * (d / 2)) : 0;
    let nx = -dy / d, ny = dx / d;
    if (nx < 0) { nx = -nx; ny = -ny; }
    return [(hx + ax) / 2 + nx * k, (hy + ay) / 2 + ny * k];
  }
  /** Outline of a tapered ribbon along a smooth path (adds the subpath, does not fill). */
  function ribbonPath(ctx, pts, w0, w1) {
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
    ctx.moveTo(Lf[0][0], Lf[0][1]);
    for (let i = 1; i < n; i++) ctx.lineTo(Lf[i][0], Lf[i][1]);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(Rt[i][0], Rt[i][1]);
    ctx.closePath();
    return { P, Lf, Rt };
  }

  function jackPose(o) {
    return Object.assign({
      bob: 0, lean: 0, legs: [[-1.7, 0, 0], [2.0, 0, 0]], hand: [3.6, -9.0], farHand: [-2.6, -9.6],
      hem: 0, hemBack: 0, scarf: 0, scarfLift: 0, headDy: 0, tilt: 0, leaf: 0, eyes: 0, mouth: 0,
    }, o);
  }
  /* walk: 8 computed poses – contact, down, passing, up for each leg; arms counter-swing; head, hem, scarf and
     stem leaf follow through with growing delays (overlapping action) */
  const JACK_WALK = [];
  for (let i = 0; i < 8; i++) {
    const ph = (i / 8) * TAU;
    const leg = (p) => {
      const x = 0.2 + 3.4 * Math.cos(p);
      const swing = Math.sin(p) < -0.01;
      const lift = swing ? -Math.sin(p) * 2.1 : 0;
      const heel = !swing && x < -1.4 ? Math.min(0.55, (-x - 1.4) * 0.32) : swing && x < -1 ? 0.35 : 0;
      return [x, lift, heel];
    };
    const bob = 0.85 * Math.sin(2 * ph);
    JACK_WALK.push(jackPose({
      bob, lean: 0.07, legs: [leg(ph + Math.PI), leg(ph)],
      hand: [3.0 - 2.9 * Math.cos(ph), -8.7 - 0.9 * Math.cos(ph) * Math.cos(ph)],
      farHand: [-1.8 + 2.4 * Math.cos(ph), -9.4 - 0.6 * Math.cos(ph) * Math.cos(ph)],
      hem: 0.75 * Math.sin(2 * ph - 1.1), hemBack: 1.1 + 0.7 * Math.sin(2 * ph - 1.6),
      scarf: Math.sin(2 * ph - 1.8), scarfLift: 0.9 + 0.25 * Math.sin(2 * ph - 2.2),
      headDy: 0.4 * Math.sin(2 * ph - 1.0), tilt: 0.035 * Math.sin(ph), leaf: 1.1 * Math.sin(2 * ph - 1.6),
    }));
  }
  /* idle: 4 held breathing poses (rise, hold, sink, settle) – the head and the leaf lag the chest */
  const JACK_IDLE = [0, 1, 2, 3].map((i) => {
    const br = [0, 0.3, 0.5, 0.22][i];
    return jackPose({
      bob: br, headDy: [0, 0.08, 0.22, 0.18][i], scarf: [0, 0.25, 0.5, 0.3][i] - 0.2, scarfLift: 0,
      hand: [3.5 + [0, 0.1, 0.2, 0.1][i], -8.8], farHand: [-2.6, -9.4],
      leaf: [0, 0.35, 0.65, 0.4][i], hemBack: [0, 0.1, 0.2, 0.1][i], tilt: [0, 0.01, 0.025, 0.015][i],
    });
  });
  const JACK_BLINK = jackPose(Object.assign({}, JACK_IDLE[0], { eyes: 1 }));
  /* dash: a crouch for the wind-up frames, then a long forward lean with everything streaming back */
  const JACK_CROUCH = jackPose({
    bob: 1.7, lean: 0.12, legs: [[-3.0, 0, 0.3], [2.8, 0, 0]], hand: [-0.6, -8.2], farHand: [-3.8, -8.6],
    hemBack: 0.6, hem: 0.5, scarf: 0.6, scarfLift: 0.2, headDy: 0.4, leaf: 1.4,
  });
  const JACK_DASH = jackPose({
    bob: 0.7, lean: 0.34, legs: [[-5.2, 1.8, 0.4], [4.6, 0.3, 0]], hand: [-2.0, -10.6], farHand: [-4.6, -11.0],
    hem: -0.7, hemBack: 3.2, scarf: 0.2, scarfLift: 2.2, headDy: 0.2, tilt: 0.05, leaf: -1.6,
  });
  /* recoil (hurt): thrown back, arm flung up, one foot off the ground, eyes wide, mouth open */
  const JACK_RECOIL = jackPose({
    bob: 0.2, lean: -0.24, legs: [[-3.4, 0, 0], [2.8, 1.8, 0]], hand: [6.0, -14.6], farHand: [-5.2, -13.6],
    hem: 1.4, hemBack: -0.4, scarf: -1.0, scarfLift: -0.3, headDy: -0.5, tilt: -0.2, leaf: 1.8, eyes: 2, mouth: 1,
  });

  function drawJack(ctx, f, P, rng) {
    const J = (s) => (rng.next() - 0.5) * s;
    const LS = -f;
    const b = P.bob, hipY = -8.4 + b;
    const lean = P.lean || 0, cl = Math.cos(lean), sl = Math.sin(lean);
    const up = (x, y) => [x * cl - (y - hipY) * sl, hipY + x * sl + (y - hipY) * cl];
    ctx.save();
    ctx.scale(f, 1);
    const ox = MX * f, oy = MY;

    /* legs + boots (the near leg gets a paper gutter so it separates from the far one) */
    const leg = (k) => {
      const [fx, lift, heel] = P.legs[k];
      const hp = up(k ? 1.5 : -1.3, hipY);
      const ay = -1.3 - lift;
      const kn = kneeAt(hp[0], hp[1], fx, ay, 8.1);
      if (k) { ctx.fillStyle = cP; limb(ctx, [hp, kn, [fx, ay]], 1.8, 1.5); }
      ctx.fillStyle = cI;
      limb(ctx, [hp, kn, [fx, ay]], 1.22, 0.95);
      ctx.save();
      ctx.translate(fx + 1.2, ay + 1.3);
      ctx.rotate(-heel);
      if (k) { ctx.fillStyle = cP; ctx.beginPath(); ctx.ellipse(-0.6, -1.0, 2.6, 1.7, 0, 0, TAU); ctx.fill(); }
      ctx.fillStyle = cI;
      ctx.beginPath(); ctx.ellipse(-0.6, -1.05, 2.15, 1.2, 0, 0, TAU); ctx.fill();
      ctx.fillRect(-2.6, -1.0, 4.1, 1.0);
      ctx.fillStyle = cP;
      lens(ctx, -2.1, -1.75, 0.4, -1.95, 0.2, -0.12);
      ctx.restore();
    };
    leg(0);

    ctx.save();
    ctx.translate(0, hipY); ctx.rotate(lean); ctx.translate(0, -hipY);
    /* far arm, mostly hidden behind the poncho */
    ctx.fillStyle = cI;
    limb(ctx, [[-2.4, -14.4 + b], [-3.2, -11.8 + b], [P.farHand[0], P.farHand[1] + b]], 0.95, 0.8);
    ctx.beginPath(); ctx.arc(P.farHand[0], P.farHand[1] + b, 1.05, 0, TAU); ctx.fill();
    /* scarf tail: hangs at rest, streams back when moving, waves with a lag */
    const sLift = clamp01(0.1 + P.scarfLift * 0.33);
    const ta = 1.25 + (0.12 - 1.25) * sLift, tl = 7.4 + sLift * 1.6;
    const n0 = [-2.0, -16.2 + b];
    const tip = [n0[0] - Math.cos(ta) * tl, n0[1] + Math.sin(ta) * tl + P.scarf * 0.7];
    const mid = [(n0[0] + tip[0]) / 2 + Math.sin(ta) * P.scarf * 0.6, (n0[1] + tip[1]) / 2 - Math.cos(ta) * P.scarf * 0.9 - 0.4];
    ctx.beginPath();
    const rb = ribbonPath(ctx, [n0, mid, tip], 1.2, 1.55);
    ctx.fillStyle = cP; ctx.fill();
    ctx.strokeStyle = cI; ctx.lineWidth = 0.48; ctx.stroke();
    ctx.fillStyle = cI;
    for (const tt of [0.34, 0.6, 0.84]) {
      const k = Math.round(tt * (rb.P.length - 1));
      lens(ctx, rb.Lf[k][0], rb.Lf[k][1], rb.Rt[k][0], rb.Rt[k][1], 0.42, J(0.2));
    }
    const ex = rb.P[rb.P.length - 1], ep = rb.P[rb.P.length - 3];
    const edx = ex[0] - ep[0], edy = ex[1] - ep[1], el = Math.hypot(edx, edy) || 1;
    for (let k = -1; k <= 1; k++) {
      const bx = ex[0] - (edy / el) * k * 0.7, by = ex[1] + (edx / el) * k * 0.7;
      taper(ctx, bx, by, bx + (edx / el) * (1.6 + J(0.5)), by + (edy / el) * (1.6 + J(0.5)) + 0.2 * k, 0.24);
    }
    leg(1);
    /* poncho with a ragged V-cut hem (front hem flutters, back hem trails) */
    const hm = P.hem, hb = P.hemBack;
    const tips = [[6.5 + hm * 0.5, -6.8 + b - hm * 0.55], [3.0 + hm * 0.2, -6.3 + b - hm * 0.2], [-0.7, -6.4 + b + hb * 0.1], [-4.6 - hb * 0.65, -6.9 + b - hb * 0.5]];
    const pon = [
      [-3.3, -16.5 + b], [3.6, -16.5 + b], [5.3, -13.0 + b], [6.0 + hm * 0.3, -9.4 + b], tips[0],
      [4.5, -8.0 + b], tips[1], [1.2, -7.8 + b], tips[2], [-2.7, -7.9 + b], tips[3],
      [-5.5 - hb * 0.45, -10.2 + b - hb * 0.15], [-4.6, -14.0 + b],
    ].map((p) => [p[0] + J(0.22), p[1] + J(0.22)]);
    const poncho = (c) => polyPath(c, pon);
    fillPath(ctx, poncho, cI);
    strokePath(ctx, poncho, cI, 0.35);
    // carved folds fan from the neck to the hem points on the lit side, a lighter one in the middle
    ctx.fillStyle = cP;
    for (const tp of tips) {
      const lit = Math.sign(tp[0] - 0.9) === LS;
      if (!lit && Math.abs(tp[0] - 0.9) > 1.5) continue;
      const w = lit ? 0.42 : 0.2;
      lens(ctx, 0.6 + LS * 0.6 + (tp[0] - 0.6) * 0.18, -14.8 + b, tp[0] - Math.sign(tp[0] - 0.9) * 0.4, tp[1] - 0.9, w, -LS * 0.25);
    }
    lens(ctx, -2.8, -15.4 + b, 2.6, -15.7 + b, 0.2, -0.1);
    // carved folk band: a paper zigzag with a dot in every tooth
    clipDo(ctx, poncho, () => {
      ctx.strokeStyle = cP; ctx.lineWidth = 0.5; ctx.lineJoin = 'miter';
      ctx.beginPath();
      for (let k = 0; k <= 9; k++) { const x = -6.6 + k * 1.5, y = -11.6 + b + (k & 1 ? -0.8 : 0.5); if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke();
      ctx.fillStyle = cP;
      for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.arc(-5.85 + k * 1.5, -11.55 + b + (k & 1 ? 1.15 : -1.3), 0.28, 0, TAU); ctx.fill(); }
      ctx.lineJoin = 'round';
    });
    // stitched hem band
    for (let k = 0; k < 5; k++) {
      const x = -3.6 + k * 2.1;
      lens(ctx, x, -8.9 + b + J(0.2), x + 0.9, -9.0 + b + J(0.2), 0.16);
    }
    crescent(ctx, poncho, 0.6, -11.5 + b, LS * 0.8, -0.5, 0.95, cI);
    /* near arm: paper gutter + ink sleeve, paper mitten */
    const sh = [2.5, -14.6 + b], hd = [P.hand[0], P.hand[1] + b];
    const el2 = [(sh[0] + hd[0]) / 2 + 0.5, (sh[1] + hd[1]) / 2 + 0.3];
    ctx.fillStyle = cP; limb(ctx, [sh, el2, hd], 1.55, 1.3);
    ctx.fillStyle = cI; limb(ctx, [sh, el2, hd], 1.05, 0.85);
    ctx.fillStyle = cP;
    lens(ctx, sh[0] + LS * 0.4, sh[1] + 0.6, el2[0] + LS * 0.35, el2[1], 0.18);
    fillPath(ctx, (c) => c.arc(hd[0], hd[1], 1.3, 0, TAU), cP);
    strokePath(ctx, (c) => c.arc(hd[0], hd[1], 1.3, 0, TAU), cI, 0.45);
    ctx.fillStyle = cI;
    lens(ctx, hd[0] - 0.2, hd[1] + 0.2, hd[0] + 1.0, hd[1] + 0.9, 0.3);
    /* scarf wrap at the neck */
    const wrap = (c) => {
      c.moveTo(-4.6, -17.0 + b); c.quadraticCurveTo(0.4, -15.6 + b, 4.9, -17.0 + b);
      c.lineTo(4.6, -14.8 + b); c.quadraticCurveTo(0.4, -13.3 + b, -4.3, -14.8 + b); c.closePath();
    };
    fillPath(ctx, wrap, cP);
    strokePath(ctx, wrap, cI, 0.45);
    ctx.fillStyle = cI;
    for (const x of [-2.6, 0.2, 3.0]) lens(ctx, x - 0.2, -16.6 + b, x + 0.3, -14.3 + b, 0.4);

    /* pumpkin head (orange spot plate, misregistered) */
    const hx0 = 0.8, hy0 = -22.6 + b + P.headDy, rx = 7.2, ry = 6.1;
    ctx.save();
    ctx.translate(hx0, hy0 + ry); ctx.rotate(P.tilt); ctx.translate(-hx0, -(hy0 + ry));
    const pts = [];
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * TAU;
      const lobe = 1 - 0.05 * Math.abs(Math.sin(a * 2.5 + 0.4)) + J(0.03);
      const x = Math.cos(a) * rx * lobe;
      let y = Math.sin(a) * ry * lobe;
      if (y < 0) y *= 1 - 0.13 * Math.exp(-(x * x) / 5);
      pts.push([hx0 + x, hy0 + y]);
    }
    const head = (c) => smoothPath(c, pts);
    fillPath(ctx, head, cP);
    ctx.save(); ctx.translate(ox, oy); fillPath(ctx, head, cO); ctx.restore();
    clipDo(ctx, head, () => {
      ctx.fillStyle = cI;
      for (const xr of [-0.62, -0.24, 0.24, 0.62]) {
        lens(ctx, hx0 + xr * rx * 0.8, hy0 - ry * 0.98, hx0 + xr * rx * 0.86 + J(0.2), hy0 + ry * 0.98, Math.sign(xr) === -LS ? 0.36 : 0.24, xr * 1.6);
      }
      // engraved shading: denser, wider cuts towards the shadow side and the underside
      for (let i = 0; i < 6; i++) {
        const x = hx0 - LS * rx * (0.36 + i * 0.105);
        lens(ctx, x + LS * 0.5, hy0 - ry * 0.75 + i * 0.35, x - LS * 0.1, hy0 + ry * 1.05, 0.16 + i * 0.055, -LS * 0.45);
      }
      for (let i = 0; i < 4; i++) {
        const y = hy0 + ry * (0.55 + i * 0.13);
        lens(ctx, hx0 + LS * rx * 0.55 - LS * i * 0.4, y, hx0 - LS * rx * 0.75, y + 0.2, 0.12 + i * 0.05, 0.5);
      }
    });
    crescent(ctx, head, hx0, hy0, LS * 1.0, -0.85, 0.93, cI);
    strokePath(ctx, head, cI, 0.75);
    // carved face
    const fx = hx0 + 0.95;
    ctx.fillStyle = cI;
    if (P.eyes === 1) {
      lens(ctx, fx - 4.0, hy0 - 1.0, fx - 0.9, hy0 - 1.2, 0.42, 0.25);
      lens(ctx, fx + 0.8, hy0 - 1.2, fx + 3.9, hy0 - 1.0, 0.42, 0.25);
    } else if (P.eyes === 2) {
      ctx.beginPath(); ctx.ellipse(fx - 2.4, hy0 - 1.5, 1.35, 1.65, 0, 0, TAU); ctx.ellipse(fx + 2.3, hy0 - 1.5, 1.35, 1.65, 0, 0, TAU); ctx.fill();
    } else {
      fillPath(ctx, (c) => polyPath(c, [[fx - 4.0, hy0 - 0.2], [fx - 0.9, hy0 - 0.45], [fx - 2.6 + J(0.2), hy0 - 3.4]]), cI);
      fillPath(ctx, (c) => polyPath(c, [[fx + 0.8, hy0 - 0.45], [fx + 3.9, hy0 - 0.2], [fx + 2.2 + J(0.2), hy0 - 3.4]]), cI);
    }
    fillPath(ctx, (c) => polyPath(c, [[fx - 0.65, hy0 + 1.0], [fx + 0.65, hy0 + 1.0], [fx, hy0 - 0.1]]), cI);
    if (P.mouth === 1) {
      ctx.beginPath(); ctx.ellipse(fx, hy0 + 3.3, 1.7, 1.6, 0, 0, TAU); ctx.fill();
    } else {
      const mouth = (c) => {
        c.moveTo(fx - 4.7, hy0 + 1.5); c.lineTo(fx - 3.6, hy0 + 2.3); c.lineTo(fx - 2.6, hy0 + 2.0); c.lineTo(fx - 2.4, hy0 + 2.9);
        c.lineTo(fx - 1.0, hy0 + 3.1); c.lineTo(fx - 0.8, hy0 + 2.4); c.lineTo(fx + 0.9, hy0 + 2.5); c.lineTo(fx + 1.1, hy0 + 3.2);
        c.lineTo(fx + 2.5, hy0 + 2.8); c.lineTo(fx + 2.7, hy0 + 2.0); c.lineTo(fx + 3.7, hy0 + 2.2); c.lineTo(fx + 4.7, hy0 + 1.4);
        c.quadraticCurveTo(fx + 3.4, hy0 + 5.6, fx + 0.1, hy0 + 5.2); c.lineTo(fx + 0.2, hy0 + 4.5); c.lineTo(fx - 0.9, hy0 + 4.5);
        c.lineTo(fx - 0.9, hy0 + 5.2); c.quadraticCurveTo(fx - 3.6, hy0 + 5.0, fx - 4.7, hy0 + 1.5); c.closePath();
      };
      fillPath(ctx, mouth, cI);
    }
    // gouge highlights on the lit side of the head
    ctx.fillStyle = cP;
    lens(ctx, hx0 + LS * 6.0, hy0 - 0.4, hx0 + LS * 4.5 + J(0.2), hy0 - 4.3, 0.42, LS * 0.4);
    lens(ctx, hx0 + LS * 3.7, hy0 - 4.5, hx0 + LS * 1.5, hy0 - 5.5 + J(0.2), 0.3, LS * 0.25);
    lens(ctx, hx0 + LS * 6.2, hy0 + 1.4, hx0 + LS * 5.9, hy0 + 2.8, 0.2, LS * 0.1);
    // stem + curly leaf (the leaf lags behind every move)
    ctx.fillStyle = cI;
    taper(ctx, hx0 + 0.2, hy0 - ry + 1.0, hx0 + 1.9 + J(0.3), hy0 - ry - 2.9, 1.1, -0.5);
    ctx.fillStyle = cP;
    lens(ctx, hx0 - 0.1, hy0 - ry + 0.2, hx0 + 0.8, hy0 - ry - 1.8, 0.16, -0.2);
    leaf(ctx, hx0 + 0.6, hy0 - ry - 0.3, hx0 - 3.8 + J(0.3), hy0 - ry - 1.6 + P.leaf, 0.9, -0.5);
    ctx.fillStyle = cI;
    limb(ctx, [[hx0 + 1.4, hy0 - ry - 1.8], [hx0 + 3.2, hy0 - ry - 3.0 - P.leaf * 0.3], [hx0 + 3.6, hy0 - ry - 1.6 - P.leaf * 0.4]], 0.22, 0.08);
    ctx.restore();
    ctx.restore();
    ctx.restore();
  }

  /* ---------- small creature: turnip with root legs, root arms and a curling tap root ----------
     6-pose waddle: squash on contact, stretch mid-step, sway; leaves and tap root follow through. */
  const CREEPER_N = 6;
  function drawCreeper(ctx, f, i, rng) {
    const J = (s) => (rng.next() - 0.5) * s;
    const LS = -f;
    const ph = (i / CREEPER_N) * TAU;
    const step = Math.abs(Math.sin(ph));
    const bob = -1.05 * step;
    const sq = 0.075 * (1 - step) - 0.045 * step;
    const tilt = 0.1 * Math.cos(ph);
    const lag = Math.sin(ph - 1.2), lag2 = Math.sin(ph - 2.0);
    ctx.save();
    ctx.scale(f, 1);
    // root legs
    const fa = [2.6 + 1.6 * Math.cos(ph), -Math.max(0, Math.sin(ph)) * 1.6];
    const fb = [-2.1 + 1.6 * Math.cos(ph + Math.PI), -Math.max(0, Math.sin(ph + Math.PI)) * 1.6];
    ctx.fillStyle = cI;
    for (const [hx, ft] of [[-2.0, fb], [2.2, fa]]) {
      limb(ctx, [[hx, -5.4 + bob], [(hx + ft[0]) / 2 + 0.3, -2.8 + bob * 0.5 + ft[1] * 0.5], [ft[0], ft[1] - 0.4]], 0.9, 0.55);
      taper(ctx, ft[0], ft[1] - 0.4, ft[0] + 2.0, ft[1] + 0.1, 0.44, 0.1);
      taper(ctx, ft[0], ft[1] - 0.4, ft[0] - 1.2, ft[1] + 0.2, 0.36, -0.1);
    }
    ctx.save();
    ctx.translate(0, -3.6 + bob);
    ctx.rotate(tilt);
    ctx.scale(1 + sq, 1 - sq);
    ctx.translate(0, 3.6);
    // curling tap root behind (lags the most)
    ctx.fillStyle = cI;
    limb(ctx, [[-1.0, -4.2], [-3.6, -3.0 + lag2 * 0.4], [-5.6, -4.4 + lag2 * 1.0], [-5.0, -6.0 + lag2 * 1.2]], 0.5, 0.1);
    // leaves (behind the bulb) swing after the body
    const sw = lag * 1.3;
    leaf(ctx, -0.4, -18.2, -6.2 + sw + J(0.4), -24.4 + Math.abs(sw) * 0.3, 1.5, -0.7);
    leaf(ctx, 0.6, -18.6, 1.4 + sw * 0.7 + J(0.4), -26.6, 1.55, 0.5);
    leaf(ctx, 1.2, -18.2, 6.9 + sw * 0.5 + J(0.4), -23.2 - sw * 0.2, 1.4, 0.8);
    ctx.fillStyle = cI;
    lens(ctx, -3.6 + sw * 0.5, -22.0, -5.6 + sw, -21.4, 0.55, 0.3);
    lens(ctx, 4.0 + sw * 0.3, -21.0, 6.2 + sw * 0.4, -21.6, 0.5, -0.3);
    // root arms, swinging against the legs
    const arm = Math.cos(ph) * 1.4;
    limb(ctx, [[6.4, -10.0], [8.4, -9.0 - arm * 0.3], [9.4 + arm * 0.4, -7.2]], 0.42, 0.12);
    limb(ctx, [[-6.6, -10.4], [-8.4, -9.6 + arm * 0.3], [-9.0 - arm * 0.4, -7.8]], 0.4, 0.12);
    // bulb
    const pts = [[0, -19.6], [3.7, -19.0], [6.5, -16.6], [7.7, -12.8], [7.2, -9.0], [5.2, -6.1], [2.4, -4.6], [0.5, -3.3],
      [-1.9, -4.6], [-4.9, -6.3], [-7.1, -9.2], [-7.6, -13.0], [-6.3, -16.7], [-3.5, -19.0]].map((p) => [p[0] + J(0.3), p[1] + J(0.3)]);
    const body = (c) => smoothPath(c, pts);
    fillPath(ctx, body, cP);
    const ex = 1.0;
    clipDo(ctx, body, () => {
      // dark crown above a wavy line, engraved comb into the light underside
      const wy = (x) => -12.2 + 0.45 * Math.sin(x * 0.95 + 0.6);
      ctx.beginPath();
      ctx.moveTo(-9, -25); ctx.lineTo(9, -25);
      for (let x = 9; x >= -9; x -= 0.5) ctx.lineTo(x, wy(x));
      ctx.closePath();
      ctx.fillStyle = cI; ctx.fill();
      for (let x = -6.8; x <= 6.9; x += 1.1) {
        const len = 1.0 + 2.6 * ((-LS * x + 7) / 14) + J(0.8);
        taper(ctx, x, wy(x) - 0.2, x + 0.25, wy(x) + len, 0.4);
      }
      ctx.fillStyle = cP;
      lens(ctx, LS * 6.6, -13.6, LS * 3.6 + J(0.3), -18.0, 0.36, LS * 0.6);
      lens(ctx, LS * 4.6, -16.8, LS * 0.6 + J(0.3), -19.1, 0.28, LS * 0.45);
      ctx.fillStyle = cI;
      lens(ctx, -LS * 3.4, -6.6, -LS * 6.7, -10.2, 0.26, -LS * 0.45);
      lens(ctx, -LS * 1.4, -5.0, -LS * 5.0, -7.2, 0.2, -LS * 0.3);
    });
    // carved paper rim on the lit edge keeps the dark crowns apart in a crowd
    crescent(ctx, body, 0, -12, -LS * 0.75, 0.35, 0.95, cP);
    // angry carved eyes + brow
    const e1x = -1.5 + ex, e2x = 2.6 + ex, ey = -14.4;
    ctx.fillStyle = cP;
    lens(ctx, e1x - 1.55, ey - 0.8, e1x + 1.3, ey + 0.5, 0.85, 0.18);
    lens(ctx, e2x - 1.3, ey + 0.5, e2x + 1.55, ey - 0.8, 0.85, 0.18);
    ctx.fillStyle = cI;
    ctx.beginPath(); ctx.arc(e1x + 0.45, ey + 0.05, 0.52, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(e2x + 0.45, ey + 0.05, 0.52, 0, TAU); ctx.fill();
    // grimace with teeth
    const my = -9.2;
    lens(ctx, -2.0 + ex, my, 3.4 + ex, my - 0.25, 0.9, -0.35);
    ctx.fillStyle = cP;
    for (const tx of [-0.5, 1.6]) {
      ctx.beginPath(); ctx.moveTo(tx + ex - 0.42, my - 1.0); ctx.lineTo(tx + ex + 0.42, my - 1.0); ctx.lineTo(tx + ex, my - 0.1); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = cI;
    crescent(ctx, body, 0, -12, LS * 0.9, -0.8, 0.94, cI);
    strokePath(ctx, body, cI, 0.72);
    ctx.restore();
    ctx.restore();
  }

  /* ---------- fast creature: a hungry sheet-spirit with a whipping tail and reaching claws ---------- */
  const GHOST_N = 6;
  function drawGhost(ctx, f, i, rng) {
    const J = (s) => (rng.next() - 0.5) * s;
    const LS = -f;
    const ph = (i / GHOST_N) * TAU;
    const w1 = Math.sin(ph), w2 = Math.sin(ph - 1.3), w3 = Math.sin(ph - 2.4);
    const tipX = -10.0 + Math.cos(ph) * 0.8, tipY = -8.2 + w3 * 2.0;
    ctx.save();
    ctx.scale(f, 1);
    const ra = w1 * 0.9, rb = -w1 * 0.9;
    // back arm
    ctx.fillStyle = cI;
    limb(ctx, [[3.6, -12.0], [6.6, -11.2 + rb * 0.3], [9.0 + rb, -10.6]], 0.42, 0.28);
    for (let k = 0; k < 3; k++) taper(ctx, 9.0 + rb, -10.6, 10.5 + rb, -11.3 + k * 0.75, 0.2);
    const body = (c) => {
      c.moveTo(0.6, -24.4 + w1 * 0.2);
      c.quadraticCurveTo(6.8, -24.0, 6.4, -16.8);
      c.quadraticCurveTo(6.0, -10.6 + w1 * 0.3, 2.6, -7.8);
      c.quadraticCurveTo(-1.8 + w2 * 0.6, -4.6 + w2 * 1.2, tipX, tipY);
      c.quadraticCurveTo(-4.6, -8.6 + w2 * 0.8, -5.4, -12.2);
      c.quadraticCurveTo(-6.4, -15.8, -5.8, -18.8);
      c.quadraticCurveTo(-4.6, -24.6, 0.6, -24.4 + w1 * 0.2);
      c.closePath();
    };
    fillPath(ctx, body, cP);
    clipDo(ctx, body, () => {
      // frost: teal stipple on the shadow side (offset second plate), densest along the tail
      ctx.save();
      ctx.translate(TX * f, TY);
      ctx.fillStyle = cT;
      const r2 = U.rng(9001 + i);
      for (let k = 0; k < 240; k++) {
        const x = R(-9, 7, r2), y = R(-24, -5, r2);
        const shade = clamp01((-LS * x + 0.5) / 6.5) * 0.85 + clamp01((y + 11) / 6) * 0.55;
        if (r2.next() < shade * 0.75) { ctx.beginPath(); ctx.arc(x, y, R(0.26, 0.42, r2), 0, TAU); ctx.fill(); }
      }
      ctx.restore();
      ctx.fillStyle = cI;
      for (let k = 0; k < 4; k++) lens(ctx, -LS * (4.4 + k * 0.5), -20.5 + k * 0.6, -LS * (3.6 + k * 0.6), -9.0 + k * 0.3, 0.14 + k * 0.03, -LS * 1.1);
      // flowing gouges along the tail
      for (let k = 0; k < 3; k++) lens(ctx, -1.0 - k * 1.2, -9.8 + k * 0.9 + w2 * 0.4, tipX + 2.4 - k * 0.4, tipY - 0.5 + k * 0.5, 0.14, 0.5);
    });
    crescent(ctx, body, 0.5, -15, LS * 0.7, -0.6, 0.95, cI);
    strokePath(ctx, body, cI, 0.64);
    ctx.fillStyle = cP;
    lens(ctx, LS * 4.6 + 0.4, -21.0, LS * 2.0 + 0.4, -23.2, 0.22, LS * 0.3);
    // hollow eyes, wailing mouth (opens and closes)
    const fx = 1.3;
    ctx.fillStyle = cI;
    ctx.beginPath(); ctx.ellipse(-1.0 + fx, -17.8, 1.3, 2.0, 0.22, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(2.8 + fx, -17.7, 1.2, 1.85, -0.18, 0, TAU); ctx.fill();
    const mo = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(ph * 2));
    ctx.beginPath(); ctx.ellipse(1.0 + fx, -12.8, 0.95 + J(0.12), 1.0 + 1.1 * mo, 0.05, 0, TAU); ctx.fill();
    lens(ctx, -2.6 + fx, -20.2, -0.3 + fx, -21.2, 0.2, -0.1);
    lens(ctx, 1.9 + fx, -21.2, 4.0 + fx, -20.3, 0.2, -0.1);
    ctx.fillStyle = cP;
    ctx.beginPath(); ctx.arc(-1.3 + fx, -18.5, 0.32, 0, TAU); ctx.arc(2.5 + fx, -18.4, 0.28, 0, TAU); ctx.fill();
    // front arm reaching (alternates with the back arm)
    ctx.fillStyle = cI;
    limb(ctx, [[5.2, -13.8], [8.0, -13.8 - ra * 0.3], [10.6 + ra, -13.2]], 0.46, 0.3);
    for (let k = 0; k < 3; k++) taper(ctx, 10.6 + ra, -13.2, 12.3 + ra, -14.0 + k * 0.8, 0.21);
    // tail breaking up into halftone dots
    for (let k = 1; k <= 3; k++) {
      ctx.beginPath();
      ctx.arc(tipX - k * 1.3, tipY + k * 0.5 * Math.sin(ph - k * 0.8), 0.52 - k * 0.11, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ---------- large creature: turnip giant with a glowing core ----------
     6-pose stomp: lift (anticipation, body rises) – plant (squash, body drops) per leg; arms counter-swing late,
     crown leaves follow through. */
  const COLOSSUS_N = 6;
  function drawColossus(ctx, f, i, rng) {
    const J = (s) => (rng.next() - 0.5) * s;
    const LS = -f;
    const ph = (i / COLOSSUS_N) * TAU;
    const s1 = Math.sin(ph);
    const liftA = Math.max(0, s1) * 3.6, liftB = Math.max(0, -s1) * 3.6;
    const bob = -Math.abs(s1) * 1.7 + (1 - Math.abs(s1)) * 0.6;
    const sq = 0.045 * (1 - Math.abs(s1));
    const sw = Math.cos(ph - 0.6) * 1.9;
    const lagL = Math.sin(ph - 1.1) * 1.2;
    ctx.save();
    ctx.scale(f, 1);
    ctx.fillStyle = cI;
    const legC = (hx, fx, lift) => {
      ctx.fillStyle = cI;
      limb(ctx, [[hx, -12 + bob], [(hx + fx) / 2 + 0.8, -6.5 - lift * 0.5], [fx, -1.2 - lift]], 3.1, 2.3);
      for (const [tx, ty] of [[3.6, 0.6], [0.6, 1.0], [-2.6, 0.6]]) taper(ctx, fx + tx * 0.2, -1.0 - lift, fx + tx, -0.2 - lift + ty * 0.3, 1.05);
      ctx.fillStyle = cP;
      lens(ctx, hx + LS * 2.0, -11 + bob, fx + LS * 1.6, -3.0 - lift, 0.3, LS * 0.3);
    };
    const arm = (sx, swing, back) => {
      const hx = sx * 18.6 + swing, hy = -15.2 + Math.abs(swing) * 0.3;
      const path = [[sx * 13.6, -32 + bob], [sx * 17.8, -25.5 + bob], [hx, hy + bob]];
      // the front arm is cut free from the black body by a paper gutter
      if (!back) { ctx.fillStyle = cP; limb(ctx, path, 3.9, 2.5); }
      ctx.fillStyle = cI;
      limb(ctx, path, 3.1, 1.8);
      for (const d of [-1.2, 0, 1.2]) taper(ctx, hx, hy + bob, hx + d * 1.3 + sx * 0.4, hy + 4.4 + bob - Math.abs(d) * 0.5, 0.9);
      if (!back) {
        ctx.fillStyle = cP;
        lens(ctx, sx * 13.6 + LS * 1.3, -30 + bob, sx * 17.4 + LS * 1.2, -22 + bob, 0.32, LS * 0.4);
        lens(ctx, sx * 17.6 + LS * 0.9, -21 + bob, hx + LS * 0.8, hy + bob - 1.6, 0.22, LS * 0.2);
      }
    };
    arm(-1, -sw, true);
    legC(-6.8, -8.6, liftB);
    legC(6.8, 8.6, liftA);
    ctx.save();
    ctx.translate(0, -12 + bob); ctx.scale(1 + sq, 1 - sq); ctx.translate(0, 12 - bob);
    const lv = [[-10.0, -49.0], [-4.8, -53.6], [1.4, -55.2], [6.6, -52.6], [10.6, -47.6]];
    for (let k = 0; k < lv.length; k++) leaf(ctx, (k - 2) * 0.8, -40.5 + bob, lv[k][0] + J(0.6) + lagL * (0.6 + k * 0.15), lv[k][1] + bob * 0.6 + J(0.6) - Math.abs(lagL) * 0.4, 2.1, (k - 2) * 0.35);
    const pts = blobPts(0, -27 + bob, 15.6, 16.4, 18, rng, 0.07).map((p) => {
      const t = clamp01((-p[1] + bob - 36) / 8);
      return [p[0] * (1 - t * 0.38), p[1]];
    });
    const body = (c) => smoothPath(c, pts);
    fillPath(ctx, body, cI);
    clipDo(ctx, body, () => {
      ctx.fillStyle = cP;
      // carved light contours on the lit shoulder, thin returns on the shadow side
      const a0 = LS < 0 ? Math.PI * 1.08 : -Math.PI * 0.42, a1 = LS < 0 ? Math.PI * 1.42 : -Math.PI * 0.08;
      for (let k = 0; k < 6; k++) arcLens(ctx, 1.0, -26 + bob, 14.4 - k * 2.3, a0 + k * 0.06, a1 - k * 0.08, 0.55 - k * 0.06);
      const b0 = LS < 0 ? Math.PI * 0.62 : Math.PI * 0.14, b1 = LS < 0 ? Math.PI * 0.86 : Math.PI * 0.38;
      for (let k = 0; k < 3; k++) arcLens(ctx, 1.0, -26 + bob, 14.6 - k * 2.0, b0, b1 - k * 0.12, 0.3 - k * 0.06);
      const cr = U.rng(77 + i);
      for (let k = 0; k < 5; k++) {
        let a = (k / 5) * TAU + R(-0.3, 0.3, cr), x = 3.2 + Math.cos(a) * 6.8, y = -25 + bob + Math.sin(a) * 6.8;
        const p = [[x, y]];
        for (let s = 0; s < 3; s++) { a += R(-0.6, 0.6, cr); x += Math.cos(a) * R(2.4, 3.8, cr); y += Math.sin(a) * R(2.4, 3.8, cr); p.push([x, y]); }
        limb(ctx, p, 0.42, 0.06);
      }
    });
    crescent(ctx, body, 0, -27 + bob, -LS * 0.9, 0.5, 0.96, cP);
    ctx.fillStyle = cI;
    // glowing core: orange plate in a hole, teal ring, carved rays – the core flickers between poses
    const cx = 3.2, cy = -25 + bob, cr0 = 3.7 + (i & 1) * 0.45;
    holeSpot(ctx, (c) => { c.arc(cx, cy, 6.0, 0, TAU); c.arc(cx, cy, 4.9, 0, TAU, true); }, cT, TX * f, TY);
    holeSpot(ctx, (c) => c.arc(cx, cy, cr0, 0, TAU), cO, MX * f, MY);
    ctx.fillStyle = cP;
    star(ctx, cx, cy, 4, 2.0 + (i & 1) * 0.3, 0.55, 0.2 + i * 0.12);
    ctx.fill();
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * TAU + 0.15;
      const r0 = 6.9, r1 = (k + i) & 1 ? 8.6 : 9.8;
      lens(ctx, cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, 0.32);
    }
    const ex = 2.0;
    lens(ctx, -4.4 + ex, -37.0 + bob, -0.6 + ex, -35.8 + bob, 0.9, 0.15);
    lens(ctx, 2.0 + ex, -35.8 + bob, 5.8 + ex, -37.2 + bob, 0.9, 0.15);
    limb(ctx, [[-3.6 + ex, -31.4 + bob], [-1.6 + ex, -30.4 + bob], [0.4 + ex, -31.4 + bob], [2.4 + ex, -30.4 + bob], [4.6 + ex, -31.6 + bob]], 0.5, 0.3);
    ctx.fillStyle = cI;
    ctx.beginPath(); ctx.arc(-2.0 + ex, -36.3 + bob, 0.44, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(4.4 + ex, -36.4 + bob, 0.44, 0, TAU); ctx.fill();
    ctx.restore();
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
  function artCrown(ctx, rng, v) {
    // canopy tree in the classic relief-print manner: ONE black canopy mass whose leaves are carved as rows of
    // fish-scale U-cuts following the outline – dense on the lit upper left, sparse on the shadow side –
    // over a forked trunk that shows through a gap under the canopy
    const sx = v ? 0.84 : 1.08, sy = v ? 1.16 : 0.95;
    roots(ctx, rng, 11, 1.5);
    const lean = R(-1.4, 1.4, rng);
    const cx = lean, cy = -39 * (0.6 + 0.4 * sy), R0 = 20.5;
    ctx.fillStyle = cI;
    limb(ctx, [[0, 0.5], [lean * 0.4, -10], [lean, -21]], 4.2, 2.6);
    const gouges = [];
    for (const [a, L] of [[-0.85, 12], [0.2, 11], [0.9, 12]]) branch(ctx, lean, -21, -Math.PI / 2 + a, L * sy, 2.0, 1, rng, gouges);
    gougeLimbs(ctx, gouges);
    ctx.fillStyle = cP;
    for (let k = 0; k < 5; k++) {
      const y0 = R(-22, -3, rng), x0 = lean * (-y0 / 26) - 1.9 + R(-0.4, 0.4, rng);
      lens(ctx, x0, y0, x0 + R(-0.3, 0.3, rng), y0 - R(3.5, 7, rng), R(0.22, 0.38, rng), R(-0.25, 0.25, rng));
    }
    const p1 = R(0, TAU, rng), p2 = R(0, TAU, rng);
    const rad = (a) => {
      let r = 1 + 0.11 * Math.sin(5 * a + p1) + 0.05 * Math.sin(9 * a + p2) + 0.045 * Math.abs(Math.sin(13 * a));
      if (Math.sin(a) > 0.55) r -= 0.2 * (Math.sin(a) - 0.55); // flatter, lifted underside
      return r;
    };
    const ptAt = (a, k) => [cx + Math.cos(a) * R0 * sx * rad(a) * k, cy + Math.sin(a) * R0 * 0.82 * sy * rad(a) * k];
    const N = 72, outline = [];
    for (let i = 0; i < N; i++) outline.push(ptAt((i / N) * TAU, 1));
    const canopy = (c) => polyPath(c, outline);
    fillPath(ctx, canopy, cI);
    // gap under the canopy where the forks show
    const gap = (c) => smoothPath(c, blobPts(lean + 0.6, cy + R0 * 0.6 * sy, 6.4 * sx, 3.0, 8, rng, 0.25));
    fillPath(ctx, gap, cP);
    clipDo(ctx, gap, () => {
      ctx.fillStyle = cI;
      limb(ctx, [[lean - 0.4, cy + R0 * 0.9 * sy], [lean - 1.6, cy + R0 * 0.4 * sy]], 1.3, 1.0);
      limb(ctx, [[lean + 0.6, cy + R0 * 0.9 * sy], [lean + 2.8, cy + R0 * 0.38 * sy]], 1.2, 0.9);
    });
    // fish-scale leaf cuts, row by row towards the centre
    ctx.fillStyle = cP;
    const rows = 6;
    for (let k = 0; k < rows; k++) {
      const inset = 0.9 - k * 0.135;
      const n = Math.round(22 * inset);
      for (let j = 0; j < n; j++) {
        const a = (j + (k & 1) * 0.5) / n * TAU;
        // light from the upper left: lit = 1 there, 0 on the lower right
        const lit = 0.5 + 0.5 * (-Math.cos(a) * 0.7 - Math.sin(a) * 0.7);
        if (lit < 0.22 + k * 0.1) { if (k === 1 && (j & 1)) { const [qx, qy] = ptAt(a, inset); arcLens(ctx, qx - Math.cos(a) * 2, qy - Math.sin(a) * 2, 2.1, a - 0.5, a + 0.5, 0.12); } continue; }
        if (Math.sin(a) > 0.75 && k > 0) continue;
        const [px, py] = ptAt(a, inset);
        const w = (0.22 + 0.36 * lit) * (1 - k * 0.11);
        // a scale: a short arc whose belly points outwards
        arcLens(ctx, px - Math.cos(a) * 2.0, py - Math.sin(a) * 2.0, 2.2, a - 0.72, a + 0.72, w);
      }
    }
    // a few leaf points hang from the shadowed underside
    ctx.fillStyle = cI;
    for (let k = 0; k < 6; k++) {
      const a = Math.PI * (0.18 + k * 0.13);
      const [px, py] = ptAt(a, 0.98);
      taper(ctx, px - 0.8, py - 0.6, px + R(-0.6, 0.6, rng), py + R(1.6, 2.8, rng), 0.7);
    }
    crescent(ctx, canopy, cx, cy, 1.0, 0.7, 0.97, cP);
  }
  function artStump(ctx, rng, v) {
    const w = v ? 5.6 : 4.4, h = v ? 5.2 : 7.4;
    roots(ctx, rng, w + 5, 1.2);
    const body = (c) => {
      c.moveTo(-w - 0.8, 0.4); c.quadraticCurveTo(-w, -h * 0.4, -w * 0.94, -h);
      c.lineTo(w * 0.94, -h); c.quadraticCurveTo(w, -h * 0.4, w + 0.9, 0.4); c.closePath();
    };
    fillPath(ctx, body, cI);
    ctx.fillStyle = cP;
    for (let k = 0; k < 4; k++) { const x = -w * 0.75 + k * 0.9; lens(ctx, x, -0.6, x + R(-0.2, 0.2, rng), -h + 1.2, 0.24 - k * 0.04, R(-0.15, 0.15, rng)); }
    // the cut face: paper with carved growth rings and a check crack
    const top = (c) => c.ellipse(0, -h, w * 0.98, w * 0.42, 0, 0, TAU);
    fillPath(ctx, top, cP);
    strokePath(ctx, top, cI, 0.6);
    ctx.strokeStyle = cI;
    for (let k = 1; k <= 3; k++) {
      ctx.lineWidth = 0.32;
      ctx.beginPath(); ctx.ellipse(R(-0.2, 0.2, rng), -h + R(-0.05, 0.05, rng), w * 0.98 * (1 - k * 0.23), w * 0.42 * (1 - k * 0.23), 0, 0, TAU); ctx.stroke();
    }
    ctx.fillStyle = cI;
    lens(ctx, 0.2, -h, w * 0.8, -h + w * 0.18, 0.28, 0.1);
    if (v) {
      // a sprout from the old wood
      ctx.fillStyle = cI;
      limb(ctx, [[-w * 0.6, -h + 0.2], [-w * 0.75, -h - 2.2], [-w * 0.5, -h - 4.0]], 0.3, 0.2);
      leaf(ctx, -w * 0.5, -h - 3.8, -w * 0.5 - 3.0, -h - 5.6, 1.0, -0.4);
      leaf(ctx, -w * 0.5, -h - 3.8, -w * 0.5 + 2.4, -h - 6.6, 0.9, 0.4);
    } else {
      // an axe left in the block
      ctx.fillStyle = cI;
      limb(ctx, [[1.4, -h - 0.4], [3.6, -h - 4.0], [5.6, -h - 7.2]], 0.42, 0.36);
      fillPath(ctx, (c) => polyPath(c, [[-0.6, -h + 0.4], [2.6, -h - 1.6], [2.0, -h - 3.0], [-1.6, -h - 1.8]]), cI);
      ctx.fillStyle = cP;
      lens(ctx, -0.9, -h - 0.9, 1.6, -h - 2.4, 0.16);
    }
    ctx.fillStyle = cI;
    for (let k = 0; k < 6; k++) { const x = R(-w - 3, w + 3, rng); taper(ctx, x, 0.4, x + R(-0.6, 0.8, rng), R(-2.6, -1.3, rng), 0.3); }
  }
  function artRocks(ctx, rng, v) {
    // planar-carved boulders: ink mass, a cleared top facet hatched with parallel cuts, paper gutters between stones
    const stones = v ? [[-4.6, 0, 6.2, 5.4], [4.8, 0.8, 4.2, 3.6], [0.4, 1.6, 2.4, 1.8]] : [[0, 0, 8.0, 7.0], [7.4, 1.0, 3.2, 2.6]];
    stones.sort((p, q) => p[1] - q[1]);
    for (const [x, y, rw, rh] of stones) {
      const pts = [];
      const nv = 7;
      for (let k = 0; k < nv; k++) {
        const a = Math.PI + (k / (nv - 1)) * Math.PI;
        const r = R(0.82, 1.06, rng);
        pts.push([x + Math.cos(a) * rw * r, y - rh * 0.15 + Math.sin(a) * rh * r]);
      }
      pts.push([x + rw * 0.95, y + 0.3], [x - rw * 0.95, y + 0.3]);
      const shp = (c) => polyPath(c, pts);
      ctx.save(); ctx.fillStyle = cP; ctx.strokeStyle = cP; ctx.lineWidth = 1.6; ctx.beginPath(); shp(ctx); ctx.fill(); ctx.stroke(); ctx.restore();
      fillPath(ctx, shp, cI);
      // top-left facet, cleared to paper and hatched
      const fa = [[x - rw * 0.8, y - rh * 0.45], [x - rw * 0.3, y - rh * 0.98], [x + rw * 0.35, y - rh * 0.92], [x - rw * 0.05, y - rh * 0.45]];
      const facet = (c) => polyPath(c, fa);
      fillPath(ctx, facet, cP);
      clipDo(ctx, facet, () => {
        ctx.fillStyle = cI;
        for (let k = 0; k < 5; k++) { const yy = y - rh * 0.95 + k * rh * 0.13; lens(ctx, x - rw, yy + rh * 0.3, x + rw * 0.5, yy, 0.09 + k * 0.035, 0); }
      });
      ctx.fillStyle = cP;
      lens(ctx, x - rw * 0.92, y - rh * 0.1, x - rw * 0.8, y - rh * 0.42, 0.2);
      lens(ctx, x + rw * 0.4, y - rh * 0.85, x + rw * 0.85, y - rh * 0.35, 0.14);
    }
    ctx.fillStyle = cI;
    for (let k = 0; k < 7; k++) { const x = R(-11, 11, rng); taper(ctx, x, 0.8, x + R(-0.6, 0.8, rng), R(-2.4, -1.2, rng), 0.3); }
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
    // main character: 8 walk poses, 4 idle + blink, crouch, dash, recoil – each pulled twice (line boil)
    const JB = [-14, -33.5, 15.5, 1.8];
    const jk = (P, seed) => mk(JB[0], JB[1], JB[2], JB[3], (c) => drawJack(c, P.f, P.p, U.rng(seed)), { halo: 1.0, seed: seed & 255 });
    const J = { walk: [[], []], idle: [[], []], walkI: [[], []], idleI: [[], []], blink: [], crouch: [], dash: [], recoil: [], recoilI: [], ghost: [] };
    [1, -1].forEach((f, fi) => {
      for (let i = 0; i < JACK_WALK.length; i++) {
        J.walk[fi][i] = [0, 1].map((v) => jk({ f, p: JACK_WALK[i] }, 100 + v * 17 + i));
        J.walkI[fi][i] = invert(J.walk[fi][i][0]);
      }
      for (let i = 0; i < JACK_IDLE.length; i++) {
        J.idle[fi][i] = [0, 1].map((v) => jk({ f, p: JACK_IDLE[i] }, 200 + v * 17 + i));
        J.idleI[fi][i] = invert(J.idle[fi][i][0]);
      }
      J.blink[fi] = [0, 1].map((v) => jk({ f, p: JACK_BLINK }, 240 + v * 17));
      J.crouch[fi] = [0, 1].map((v) => jk({ f, p: JACK_CROUCH }, 250 + v * 17));
      J.dash[fi] = [0, 1].map((v) => jk({ f, p: JACK_DASH }, 260 + v * 17));
      J.recoil[fi] = [0, 1].map((v) => jk({ f, p: JACK_RECOIL }, 270 + v * 17));
      J.recoilI[fi] = invert(J.recoil[fi][0]);
      J.ghost[fi] = tintSpr(J.dash[fi][0], cO);
    });
    SPR.jack = J;
    // creatures: 6 poses, two pulls each, a negative print per pose (hit), shards + cracked block (death)
    const defs = {
      creeper: { box: [-11.5, -30, 11.5, 1.5], fn: drawCreeper, n: CREEPER_N, cy: 0.42 },
      ghost: { box: [-15.5, -26.5, 14.5, 1], fn: drawGhost, n: GHOST_N, cy: 0.5 },
      colossus: { box: [-25, -58.5, 25, 1.5], fn: drawColossus, n: COLOSSUS_N, cy: 0.5 },
    };
    for (const type in defs) {
      const d = defs[type];
      const set = { nf: d.n, n: [[], []], i: [[], []], sh: [], cr: [] };
      [1, -1].forEach((f, fi) => {
        for (let i = 0; i < d.n; i++) {
          set.n[fi][i] = [0, 1].map((v) => mk(d.box[0], d.box[1], d.box[2], d.box[3], (c) => d.fn(c, f, i, U.rng(300 + v * 11 + i * 3)), { halo: 1.15, seed: 21 + v * 9 + i }));
          set.i[fi][i] = invert(set.n[fi][i][0]);
        }
        set.sh[fi] = shards(set.n[fi][0][0], type === 'colossus' ? 6 : 4, 55 + fi, d.cy);
        set.cr[fi] = set.sh[fi].cracked;
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
    SPR.shStump = sh(8.5, 2.4); SPR.shRocks = sh(11, 2.6);
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
    SPR.ring = mk(-14, -14, 14, 14, (c) => {
      // a carved ripple: outer ring of ink gouges with teeth, inner ring on the (misregistered) orange plate
      c.fillStyle = cI;
      for (let k = 0; k < 18; k++) {
        const a = (k / 18) * TAU;
        arcLens(c, 0, 0, 11.6, a, a + (TAU / 18) * 0.62, 0.5);
        const m = a + (TAU / 18) * 0.31;
        lens(c, Math.cos(m) * 12.3, Math.sin(m) * 12.3, Math.cos(m) * 13.6, Math.sin(m) * 13.6, 0.32);
      }
      c.save(); c.translate(MX, MY);
      c.fillStyle = cO;
      for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU + 0.13; arcLens(c, 0, 0, 8.4, a, a + (TAU / 12) * 0.7, 0.75); }
      c.restore();
    }, { pad: 0.4, ink: false });
    // core flash: a paper-white knock-out star with an ink rim
    SPR.flash = mk(-9, -9, 9, 9, (c) => {
      star(c, 0, 0, 8, 8.2, 2.9, 0.2);
      c.fillStyle = cP; c.fill();
      c.strokeStyle = cI; c.lineWidth = 0.7; c.stroke();
      c.fillStyle = cI;
      for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU + 0.2 + TAU / 16; lens(c, Math.cos(a) * 2.2, Math.sin(a) * 2.2, Math.cos(a) * 3.6, Math.sin(a) * 3.6, 0.22); }
    }, { pad: 0.4, ink: false });
    // brayer (ink roller) that prints arriving creatures from the ground up
    SPR.brayer = mk(-9, -7.5, 9, 2.4, (c) => {
      c.fillStyle = cI;
      limb(c, [[0.6, -0.6], [2.2, -3.6], [4.6, -6.2]], 0.55, 0.45);
      limb(c, [[4.4, -6.0], [6.6, -6.8]], 0.95, 0.95);
      c.fillStyle = cP;
      lens(c, 4.6, -6.7, 6.3, -7.2, 0.18);
      c.fillStyle = cI;
      c.beginPath(); c.moveTo(-8.2, -1.4); c.lineTo(8.2, -1.4); c.arc(8.2, 0, 1.4, -Math.PI / 2, Math.PI / 2); c.lineTo(-8.2, 1.4); c.arc(-8.2, 0, 1.4, Math.PI / 2, Math.PI * 1.5); c.fill();
      c.fillStyle = cP;
      lens(c, -7.4, -0.55, 6.8, -0.65, 0.26);
      for (let k = 0; k < 6; k++) lens(c, -6 + k * 2.4, 0.5, -5.2 + k * 2.4, 0.6, 0.12);
    }, { pad: 0.4 });
    // registration mark set where a block will land: ink cross + misregistered orange copy
    SPR.reg = mk(-5, -5, 5, 5, (c) => {
      const mark = (col) => {
        c.strokeStyle = col; c.lineWidth = 0.42;
        c.beginPath(); c.arc(0, 0, 2.6, 0, TAU); c.moveTo(-4.4, 0); c.lineTo(4.4, 0); c.moveTo(0, -4.4); c.lineTo(0, 4.4); c.stroke();
      };
      c.save(); c.translate(MX, MY); mark(cO); c.restore();
      mark(cI);
    }, { pad: 0.4, ink: false });
    // drifting carved leaves (ambient), 4 tumble poses
    SPR.drift = [0, 1, 2, 3].map((k) => mk(-3.2, -3.2, 3.2, 3.2, (c) => {
      const sx = [1, 0.55, -0.2, -0.75][k];
      c.save(); c.scale(sx, 1); c.rotate(-0.5);
      c.fillStyle = cI; lens(c, -2.8, 0, 2.8, 0, 1.05, 0.25);
      c.fillStyle = cP; lens(c, -2.2, 0.05, 2.0, 0.1, 0.14, 0.15);
      c.fillStyle = cI; taper(c, -2.8, 0, -3.6, 0.5, 0.18);
      c.restore();
    }, { pad: 0.3, ink: false }));
    // props
    const P = {};
    P.oak = [0, 1, 2].map((v) => mk(-44, -86, 44, 4, (c) => artOak(c, U.rng(800 + v * 13)), { halo: 0.8, seed: 80 + v }));
    P.crown = [0, 1, 2].map((v) => mk(-30, -66, 30, 4, (c) => artCrown(c, U.rng(830 + v * 13), v === 1), { halo: 0.8, seed: 83 + v }));
    P.stump = [0, 1].map((v) => mk(-11, -16, 11, 2, (c) => artStump(c, U.rng(980 + v * 7), v), { halo: 0.7, seed: 98 + v }));
    P.rocks = [0, 1].map((v) => mk(-13, -10, 13, 2.5, (c) => artRocks(c, U.rng(990 + v * 7), v), { halo: 0.7, seed: 99 + v }));
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
  function fleck(X, Y, ux, uy, res, dens) {
    const CS = 4.3;
    const fx = X / CS, fy = Y / CS;
    const ix = Math.floor(fx), iy = Math.floor(fy);
    const sx = fx - ix < 0.5 ? ix - 1 : ix, sy = fy - iy < 0.5 ? iy - 1 : iy;
    let a = 0;
    for (let j = 0; j < 2; j++) {
      for (let i = 0; i < 2; i++) {
        const cx = sx + i, cy = sy + j;
        const h = U.hashInt(cx, cy, 6161);
        if ((h & 1023) > dens * 1024) continue;
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
              const fl = fleck(X, Y, ux, uy, res, 0.62) * clamp01((dS - 4.3) * res);
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
              if (res < 1.25) v += (Math.min(1, 2 * hw * gF) - v) * clamp01((1.25 - res) * 2.5); // no moire when zoomed out
              // field edge: a carved ditch line
              const ev = (0.44 - Math.abs(dB1 + 0.5)) * res + 0.5;
              if (ev > v) v = ev > 1 ? 1 : ev;
              a = v;
            } else if (dB1 > GUT) {
              const dB2 = g[q00 + 3] * w00 + g[q10 + 3] * w10 + g[q01 + 3] * w01 + g[q11 + 3] * w11;
              if (dB2 > 0) {
                // ---- forest floor: edge cut with two echo cuts, a clean band, then carved litter that follows the
                //      flow of the land, thin in the open and dense in clusters
                const inner = smooth(7, 17, dB2);
                if (inner > 0) {
                  const dens = inner * (0.015 + 0.72 * smooth(0.5, 0.7, T)); // litter drifts in clumps, bare floor between
                  if (dens > 0.03) {
                    const ux = g[q00 + 6] * w00 + g[q10 + 6] * w10 + g[q01 + 6] * w01 + g[q11 + 6] * w11;
                    const uy = g[q00 + 7] * w00 + g[q10 + 7] * w10 + g[q01 + 7] * w01 + g[q11 + 7] * w11;
                    a = fleck(X, Y, ux, uy, res, dens);
                  }
                }
                let ev = (0.42 - Math.abs(dB2 - 0.5)) * res + 0.5;
                const e2 = (0.3 - Math.abs(dB2 - 2.5)) * res + 0.5, e3 = (0.2 - Math.abs(dB2 - 4.3)) * res + 0.5;
                if (e2 > ev) ev = e2;
                if (e3 > ev) ev = e3;
                if (ev > a) a = ev > 1 ? 1 : ev;
              } else if (dB2 < -GUT) {
                // ---- meadow: grass ticks + gouge chatter on mostly clean paper
                // grass grows in clumps and in drifts along every region edge; chatter only in the cleared paper
                const M = g[q00 + 8] * w00 + g[q10 + 8] * w10 + g[q01 + 8] * w01 + g[q11 + 8] * w11;
                const em = Math.min(dB1, -dB2, -dS, dR) - GUT;
                const edge = em < 8 ? 1 - smooth(0, 8, em) : 0;
                const dens = Math.max(0.8 * smooth(0.57, 0.72, T) * smooth(0.4, 0.62, M), 0.55 * edge * edge);
                let v = dens > 0.02 ? grass(X, Y, dens, res) : 0;
                if (v < 1 && dens < 0.25) {
                  const V = g[q00 + 10] * w00 + g[q10 + 10] * w10 + g[q01 + 10] * w01 + g[q11 + 10] * w11;
                  if (V > 0.56) { const c2 = chatter(X, Y, res); if (c2 > v) v = c2; }
                }
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
    if (m.mat === 'forest') type = r1 < 0.4 ? 'spruce' : r1 < 0.72 ? 'crown' : 'oak';
    else type = r1 < 0.55 ? 'crown' : 'oak';
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
      // clump field (same noise as the grass clumps): flowers, mushrooms and leaf litter gather, never sprinkle
      const T = kind <= 1 ? U.fbm(x / 140, y / 140, 606, 2) : 0;
      const m = matAt(x, y);
      if (kind === 0) {
        if (m.mat === 'meadow' && m.margin > 4) {
          const cl = U.smoothstep(0.53, 0.66, T);
          if (r1 < 0.5 * cl) dFlower(ctx, x, y, R(0.8, 1.15, rng), rng);
          else if (m.margin < 9 && r1 > 0.72) dPebble(ctx, x, y, R(0.8, 1.1, rng), rng, false);
          else if (r1 > 0.985) dStar(ctx, x, y, R(0.7, 1.0, rng), rng);
        } else if (m.mat === 'forest' && m.margin > 4) {
          if (r1 < 0.42 * U.smoothstep(0.5, 0.64, T)) dMushroom(ctx, x, y, R(0.8, 1.1, rng), rng);
          else if (r1 > 0.86) dTwig(ctx, x, y, 1, rng);
        }
      } else if (kind === 1) {
        if (m.mat === 'forest' && m.margin > 3 && r1 < 0.75 * U.smoothstep(0.48, 0.66, T)) dLeaf(ctx, x, y, R(0.9, 1.3, rng), rng);
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
    // stumps and boulders gather at forest edges and beside roads
    G.scatterOwned(info, 46, 7018, (x, y, rng) => {
      const r0 = rng.next(), r1 = rng.next(), r2 = rng.next();
      if (r0 > 0.55 || G.nearSpawn(x, y, 90)) return;
      const m = matAt(x, y);
      const forestEdge = (m.mat === 'meadow' && m.dB2 > -16) || (m.mat === 'forest' && m.margin < 7);
      const roadSide = m.mat !== 'road' && m.dR > 4 && m.dR < 14;
      if (m.mat === 'soil' || (!forestEdge && !roadSide)) return;
      if (forestEdge && !roadSide && r1 < 0.55) out.push({ x, y, t: 'stump', spr: SPR.props.stump[r2 < 0.5 ? 0 : 1], sh: SPR.shStump, pad: 30 });
      else out.push({ x, y, t: 'rocks', spr: SPR.props.rocks[r2 < 0.5 ? 0 : 1], sh: SPR.shRocks, pad: 30 });
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

  /* ===================================================================================== motion helpers */
  /** Eased float in [0,1]: lingers at the top and the bottom (never a plain sine), held on twos (12 fps). */
  function floatCurve(t) {
    const u = U.fract(Math.floor(t * 14) / 14);
    const tri = u < 0.5 ? u * 2 : 2 - u * 2;
    return tri * tri * (3 - 2 * tri);
  }
  function ghostBob(rt, seed) { return 1.6 + floatCurve(rt * 0.55 + seed * 3.7) * 2.6; }

  /** Entrance: registration marks are set, a brayer prints the figure from the feet up, the block settles. */
  function spawnSeq(ctx, e, spr, x, y, view) {
    const t = e.spawnT;
    const big = e.type === 'colossus' ? 1.9 : e.type === 'ghost' ? 0.85 : 1;
    if (t < 0.5) {
      const k = t < 0.06 ? 0.6 : 1;
      blitS(ctx, SPR.reg, e.x, y - 7 * big, k * big, k * big);
    }
    if (t >= 0.78) {
      if (!e._lcStamp) {
        e._lcStamp = 1;
        addSplat(e.x, e.y + 0.5, big * 0.75, 0.9, view.game.time);
      }
      const k = (t - 0.78) / 0.22;
      const sq = Math.sin(k * Math.PI) * 0.13 * (1 - k * 0.4);
      blitS(ctx, spr, x, y, 1 + sq, 1 - sq);
      return;
    }
    const r = U.smoothstep(0.16, 0.78, t);
    if (r <= 0) return;
    const k = 1 / K;
    const top = y - spr.ay * k, bot = y + (spr.c.height - spr.ay) * k;
    const lineY = bot - (bot - top) * r;
    const hw = spr.c.width * k;
    ctx.save();
    ctx.beginPath(); ctx.rect(x - hw, lineY, hw * 2, bot - lineY + 0.5); ctx.clip();
    blit(ctx, spr, x, y);
    ctx.restore();
    const bw = Math.max(0.55, (hw * 0.62) / 18);
    blitS(ctx, SPR.brayer, x + Math.sin(t * 40) * 0.4, lineY + 1.2, bw, bw);
  }

  /** Death: negative print swells (impact) – carved cracks open – the block splits into shards that fly,
   *  tumble in held steps and drop; the ink splat left on the ground carries the residue. */
  function deathSeq(ctx, e, set, fi, lift) {
    const t = e.deathT;
    const big = e.type === 'colossus' ? 1.8 : e.type === 'ghost' ? 0.85 : 1;
    const y = e.y - lift;
    if (t < 0.12) { const s = 1 + t * 0.9; blitS(ctx, set.i[fi][0], e.x, y, s, s); return; }
    if (t < 0.27) { const s = 1.1 - (t - 0.12) * 0.5; blitS(ctx, set.cr[fi], e.x, y, s, s); return; }
    const u = Math.floor(((t - 0.27) / 0.73) * 10) / 10;
    const sh = set.sh[fi];
    const ay0 = set.n[fi][0][0].ay;
    const sc = u < 0.5 ? 1 : 1 - ((u - 0.5) / 0.5) * 0.65;
    if (u > 0.75) ctx.globalAlpha = Math.max(0, (1 - u) / 0.25);
    for (let i = 0; i < sh.length; i++) {
      const p = sh[i];
      const d = (2 + 13 * U.ease.outQuad(u)) * big;
      const x = e.x + p.dx * d, yy = y + p.dy * d * 0.7 - 7 * big * u + 30 * u * u;
      const pivotY = (p.ay - ay0) / K;
      blitRot(ctx, p, x, yy + pivotY, (i & 1 ? 1 : -1) * u * (1.4 + (i % 3) * 0.4), sc);
    }
    ctx.globalAlpha = 1;
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
  border: 3px solid var(--ink); border-radius: 9px; box-shadow: inset 0 0 0 6px var(--paper), inset 0 0 0 8px var(--ink), 8px 8px 0 #0d0b0a; transition: transform .1s steps(2), box-shadow .1s steps(2);
  background-image: repeating-linear-gradient(90deg, var(--ink) 0 3px, transparent 3px 9px), ${NOISE_SVG}; background-size: calc(100% - 44px) 7px, auto; background-position: center bottom 20px, 0 0; background-repeat: no-repeat, repeat; }
body.style-linocut #levelup .card:hover { transform: translateY(-8px) rotate(-1.5deg); box-shadow: inset 0 0 0 6px var(--paper), inset 0 0 0 8px var(--ink), 10px 12px 0 var(--org); }
body.style-linocut #levelup .card-icon { width: 120px; height: 120px; }
body.style-linocut #levelup .card-name { font-family: 'Alfa Slab One', Georgia, serif; font-weight: 400; font-size: 20px; line-height: 1.15; border-bottom: 2px solid var(--ink); padding: 0 4px 6px; text-align: center; }
body.style-linocut #levelup .card-desc { font-family: 'Special Elite', monospace; font-size: 15px; opacity: 1; line-height: 1.3; text-align: center; padding: 0 6px 34px; }
body.style-linocut #levelup .card-key { font-family: 'Rye', Georgia, serif; font-weight: 400; font-size: 19px; top: 14px; left: 14px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  opacity: 1; color: var(--paper); background: var(--ink); border-radius: 50%; box-shadow: 2px 2px 0 var(--org); text-shadow: none; }
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
    description: 'A moving linocut print: cream paper, carbon-black key plate, one misregistered pumpkin-orange spot plate and a sparing teal.',
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
        let s = 1;
        if (o.type === 'ghost') s = 1.12 - (ghostBob(view.rt, o.seed) - 1.6) * 0.1;
        if (o.spawnT < 1) s *= U.smoothstep(0, 0.35, o.spawnT) * 0.8 + 0.2;
        if (s !== 1) blitS(ctx, sh, o.x, o.y + 0.5, s, s);
        else blit(ctx, sh, o.x, o.y + 0.5);
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
        // stamped in two held steps, then the ink sinks into the paper
        const k = age < 0.05 ? 0.7 : age < 0.1 ? 1.12 : 1;
        const fade = s.life - age < 0.6 ? Math.ceil(((s.life - age) / 0.6) * 4) / 4 : 1;
        ctx.globalAlpha = fade;
        blitS(ctx, s.spr, s.x, s.y, s.s * k * (s.flip ? -1 : 1), s.s * k);
      }
      ctx.globalAlpha = 1;
    },

    drawGem(ctx, g, view) {
      base(view);
      const fr = (Math.floor(view.rt * 4 + g.seed * 8) & 1);
      const bob = floatCurve(view.rt * 0.7 + g.seed * 3) * 1.6;
      blit(ctx, SPR.shGem, g.x, g.y + 0.6);
      const spr = g.big ? SPR.gemBig[fr] : SPR.gem[fr];
      if (g.pop > 0) { const s = 1 + g.pop * 0.7; blitS(ctx, spr, g.x, g.y - g.pop * 4, s, s); }
      else blit(ctx, spr, g.x, g.y - 0.4 - bob);
    },

    drawEnemy(ctx, e, view) {
      base(view);
      const set = SPR[e.type];
      if (!set) return;
      const fi = e.facing < 0 ? 1 : 0;
      const lift = e.type === 'ghost' ? ghostBob(view.rt, e.seed) : 0;
      if (e.dying) { deathSeq(ctx, e, set, fi, lift); return; }
      const NF = set.nf;
      let fr;
      if (e.type === 'ghost') fr = Math.floor(view.rt * 9 + e.seed * 13);
      else if (e.type === 'colossus') fr = Math.floor(e.anim * 2.8);
      else fr = Math.floor(e.anim * 3.2);
      fr = ((fr % NF) + NF) % NF;
      const v = Math.floor(view.rt * 6 + e.seed * 10) & 1;
      const spr = e.flash > 0.45 ? set.i[fi][fr] : set.n[fi][fr][v];
      const x = e.x, y = e.y - lift;
      if (e.spawnT < 1) { spawnSeq(ctx, e, spr, x, y, view); return; }
      if (e._lcStamp) e._lcStamp = 0;
      if (e.flash > 0 && e.hitT < 0.16) {
        // knock-back pose: squashed and shoved away from the blow, then one overshoot back
        const k = e.hitT / 0.16;
        const kl = Math.hypot(e.kx, e.ky);
        const dx = kl > 1 ? e.kx / kl : -e.facing, dy = kl > 1 ? e.ky / kl : 0;
        const off = 2.4 * (1 - k) * (1 - k) * (e.type === 'colossus' ? 0.6 : 1);
        const sq = 0.17 * Math.cos(k * Math.PI * 1.5) * (1 - k);
        blitS(ctx, spr, x + dx * off, y + dy * off * 0.6, 1 + sq, 1 - sq);
        return;
      }
      blit(ctx, spr, x, y);
    },

    drawPlayer(ctx, p, view) {
      base(view);
      const rt = view.rt;
      const fi = p.facing < 0 ? 1 : 0;
      const v = Math.floor(rt * 6) & 1;
      const J = SPR.jack;
      const since = (performance.now() - hurtAt) / 1000;
      const flick = since < 0.75 && p.iframes > 0 && (Math.floor(since * 12) & 1) === 1;
      let spr;
      if (p.hurtT > 0.55) spr = p.hurtT > 0.8 ? J.recoilI[fi] : J.recoil[fi][v];
      else if (p.dashT > 0) spr = p.dashT > 0.165 ? J.crouch[fi][v] : J.dash[fi][v];
      else if (p.moving) {
        const i = Math.floor(p.anim * 1.3) & 7;
        spr = flick ? J.walkI[fi][i] : J.walk[fi][i][v];
      } else {
        // held breathing poses (~0.38 s each), a blink every 3.4 s
        const i = Math.floor(rt * 2.6) & 3;
        spr = flick ? J.idleI[fi][i] : (rt % 3.4) < 0.13 ? J.blink[fi][v] : J.idle[fi][i][v];
      }
      if (p.levelT > 0) {
        const lt = Math.ceil(p.levelT * 12) / 12;
        const s = 0.6 + 0.6 * (1 - lt * 0.5);
        ctx.globalAlpha = Math.min(1, lt * 2);
        blitRot(ctx, SPR.raysBig, p.x + MX, p.y - 18 + MY, Math.floor(rt * 8) * 0.1, s);
        ctx.globalAlpha = 1;
      }
      if (p.dashT > 0 && p.dashT < 0.18) {
        // the spot plate printed twice behind the figure, out of register (multiply = overprinting ink)
        const k = p.dashT / 0.18;
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = 0.55;
        blit(ctx, J.ghost[fi], p.x - p.dashX * 12 * k, p.y - p.dashY * 12 * k);
        ctx.globalAlpha = 1;
        blit(ctx, J.ghost[fi], p.x - p.dashX * 6 * k, p.y - p.dashY * 6 * k);
        ctx.globalCompositeOperation = 'source-over';
        const a = Math.atan2(p.dashY, p.dashX);
        blitRot(ctx, SPR.trail, p.x - p.dashX * 4, p.y - 9 - p.dashY * 4, a, 1.4);
        blitRot(ctx, SPR.trail, p.x - p.dashX * 6, p.y - 19 - p.dashY * 6, a, 1.0);
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
        case 'flash': {
          const s = pt.size * (age < 0.4 ? 0.7 + age : 1.1 - (age - 0.4) * 0.6);
          blitRot(ctx, SPR.flash, pt.x, pt.y - pt.z, pt.rot, s);
          break;
        }
        case 'burst': {
          const st = Math.floor(age * 6) / 6;
          const s = pt.size * (0.55 + 0.75 * U.ease.outQuad(Math.min(1, st * 1.6)));
          if (age > 0.8) break;
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
          const st = Math.floor(age * 9) / 9;
          const s = pt.size * (0.35 + U.ease.outQuad(st) * 1.15);
          ctx.globalAlpha = life < 0.3 ? Math.ceil((life / 0.3) * 3) / 3 : 1;
          blitRot(ctx, SPR.ring, pt.x, pt.y - pt.z, pt.rot + st * 0.6, s);
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

    drawWorldOverlay(ctx, view) {
      // a few carved leaves drift on the wind (world-anchored, wrapped around the view), tumbling on twos
      base(view);
      const rt = view.rt;
      const W = view.x1 - view.x0 + 80, H = view.y1 - view.y0 + 80;
      const md = (a, b) => ((a % b) + b) % b;
      for (let i = 0; i < 8; i++) {
        const h1 = U.hash2(i, 3, 77), h2 = U.hash2(i, 5, 78);
        const sp = 9 + h1 * 9;
        const x = view.x0 - 40 + md(h1 * 4000 + rt * sp - view.x0, W);
        const sway = floatCurve(rt * 0.35 + h2) * 9;
        const y = view.y0 - 40 + md(h2 * 4000 + rt * sp * 0.3 - view.y0, H) + sway;
        blit(ctx, SPR.drift[Math.floor(rt * 8 + h2 * 7) & 3], x, y);
      }
    },

    drawScreenOverlay(ctx, view) {
      if (!FRAME || FRAME.W !== view.W || FRAME.H !== view.H) buildFrame(view.W, view.H);
      // registration marks in the margin, the orange plate visibly out of register
      const r = Math.max(4, view.H * 0.0085), m = FRAME.t * 1.9 + r;
      const mark = (x, y, col, dx, dy) => {
        ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, r * 0.16);
        ctx.beginPath(); ctx.arc(x + dx, y + dy, r * 0.6, 0, TAU);
        ctx.moveTo(x + dx - r, y + dy); ctx.lineTo(x + dx + r, y + dy); ctx.moveTo(x + dx, y + dy - r); ctx.lineTo(x + dx, y + dy + r);
        ctx.stroke();
      };
      const mo = r * 0.22;
      for (const [x, y] of [[m, view.H / 2], [view.W - m, view.H / 2], [view.W / 2, view.H - m]]) { mark(x, y, cO, mo, mo * 0.7); mark(x, y, cI, 0, 0); }
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

    /* ---------- hooks: every effect is layered – core flash, main shape, debris, residue ---------- */
    onHit(game, e, src) {
      const big = e.type === 'colossus';
      const y = e.y - e.r * (big ? 1.6 : 1.2) - (e.type === 'ghost' ? 3 : 0);
      game.addParticle({ x: e.x, y, z: 0, kind: 'burst', life: 0.2, size: big ? 1.15 : 0.75, rot: Math.random() * TAU, drag: 0, orange: src === 'lantern' });
      game.addParticle({ x: e.x, y, z: 0, kind: 'flash', life: 0.08, size: big ? 1.0 : 0.62, rot: Math.random() * TAU, drag: 0 });
      for (let i = 0; i < 2; i++) {
        const a = Math.random() * TAU, s = 30 + Math.random() * 40;
        game.addParticle({ x: e.x, y: e.y, z: e.r * 1.2, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 20 + Math.random() * 30, grav: 160, kind: 'drop', life: 0.5, size: 0.45 + Math.random() * 0.3, drag: 1.5 });
      }
      const a = Math.random() * TAU;
      game.addParticle({ x: e.x, y: e.y, z: e.r, vx: Math.cos(a) * 45, vy: Math.sin(a) * 26, vz: 50, grav: 240, kind: 'chip', life: 0.45, size: 0.6, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 20, drag: 1.2 });
    },
    onKill(game, e) {
      const big = e.type === 'colossus';
      const n = big ? 16 : e.type === 'ghost' ? 6 : 9;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU, s = (big ? 60 : 40) + Math.random() * 60;
        game.addParticle({ x: e.x, y: e.y, z: e.r * (0.6 + Math.random()), vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 40 + Math.random() * 60, grav: 220, kind: 'chip', orange: big && i % 4 === 0, life: 0.6 + Math.random() * 0.4, size: (big ? 1.2 : 0.8) + Math.random() * 0.4, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 18, drag: 1.2 });
      }
      for (let i = 0; i < (big ? 8 : 4); i++) {
        const a = Math.random() * TAU, s = 30 + Math.random() * 50;
        game.addParticle({ x: e.x, y: e.y, z: e.r, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 30 + Math.random() * 40, grav: 200, kind: 'drop', life: 0.8, size: 0.6 + Math.random() * 0.5, drag: 1.2 });
      }
      const cy = e.y - e.r * (big ? 1.4 : 1.1);
      game.addParticle({ x: e.x, y: cy, z: 0, kind: 'burst', life: 0.26, size: big ? 2.2 : 1.15, rot: Math.random() * TAU, drag: 0 });
      game.addParticle({ x: e.x, y: cy, z: 0, kind: 'flash', life: 0.1, size: big ? 1.6 : 0.9, rot: Math.random() * TAU, drag: 0 });
      for (let i = 0; i < 2; i++) game.addParticle({ x: e.x + (i ? 4 : -4), y: e.y, z: 0, vx: (i ? 14 : -14), vy: 2, kind: 'puff', life: 0.4, size: big ? 1.0 : 0.6, drag: 3 });
      addSplat(e.x, e.y, big ? 1.6 : e.type === 'ghost' ? 0.6 : 0.9, big ? 3.2 : 2.2, game.time);
    },
    onHurt(game, p) {
      hurtAt = performance.now();
      game.addParticle({ x: p.x, y: p.y - 14, z: 0, kind: 'burst', life: 0.25, size: 1.6, rot: Math.random() * TAU, drag: 0 });
      game.addParticle({ x: p.x, y: p.y - 14, z: 0, kind: 'flash', life: 0.09, size: 1.1, rot: Math.random() * TAU, drag: 0 });
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * TAU, s = 40 + Math.random() * 50;
        game.addParticle({ x: p.x, y: p.y, z: 14, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 30 + Math.random() * 40, grav: 200, kind: i < 3 ? 'drop' : 'chip', orange: i >= 3, life: 0.6, size: 0.7 + Math.random() * 0.4, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, drag: 1.2 });
      }
    },
    onPickup(game, g) {
      const x = g.x, y = g.y;
      game.addParticle({ x: x + (Math.random() - 0.5) * 6, y: y - 10 - Math.random() * 6, z: 0, vy: -24, kind: 'star', life: 0.35, size: g.big ? 1.6 : 0.95, rot: Math.random(), drag: 3 });
      for (let i = 0; i < (g.big ? 3 : 2); i++) {
        const a = -Math.PI / 2 + (i - 0.5) * 1.1;
        game.addParticle({ x, y, z: 8, vx: Math.cos(a) * 34, vy: Math.sin(a) * 14, vz: 46, grav: 260, kind: 'chip', orange: true, life: 0.4, size: 0.5, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 22, drag: 1.5 });
      }
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
      game.addParticle({ x: p.x, y: p.y - 14, z: 0, kind: 'flash', life: 0.12, size: 1.5, rot: Math.random(), drag: 0 });
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + 0.3;
        game.addParticle({ x: p.x + Math.cos(a) * 10, y: p.y - 14 + Math.sin(a) * 7, z: 0, vx: Math.cos(a) * 40, vy: Math.sin(a) * 26, kind: 'star', life: 0.5, size: 0.9, rot: a, drag: 2.5 });
      }
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
