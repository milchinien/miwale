/* Native art for the new enemies / upgrades in the 'vangogh' world (Starry Night) – see js/content/ART_API.md.
   Same impasto toolkit as js/styles/vangogh.js (copied): every shape is built from single brush dabs with a light
   ridge, dark edge and bristle groove, laid along form-following directions, outlined with prussian-blue contour
   strokes; carved eyes glow in chrome yellow. Frames are painted on CPU canvases (lazily, partly in the background). */
(function () {
  'use strict';
  const U = window.U, CT = window.Content;
  const TAU = Math.PI * 2;
  const K = 3;
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const clamp = U.clamp;
  const H = U.hex;
  const rgb = U.rgb;
  const hexes = (a) => a.map(H);
  const LIGHT = [255, 246, 220];
  const lit = (c, t) => U.mix(c, LIGHT, t);
  const hyp = (a, b) => Math.sqrt(a * a + b * b);

  /* ---------- the brush stroke (copied) ---------- */
  const NO = {};
  function stroke(ctx, x, y, ang, len, wid, col, r, o) {
    o = o || NO;
    const hl = len * 0.5, hw = wid * 0.5;
    const b = (o.bend !== undefined ? o.bend : (r.next() - 0.5) * 0.36) * len;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    if (o.a !== undefined) ctx.globalAlpha = o.a;
    ctx.beginPath();
    ctx.moveTo(-hl, -hw * 0.85);
    ctx.quadraticCurveTo(0, -hw * 1.25 + b, hl, b * 0.12 - hw * 0.14);
    ctx.lineTo(hl + hw * 0.35, b * 0.12);
    ctx.lineTo(hl, b * 0.12 + hw * 0.14);
    ctx.quadraticCurveTo(0, hw * 1.25 + b, -hl, hw * 0.85);
    ctx.quadraticCurveTo(-hl - hw * 1.15, 0, -hl, -hw * 0.85);
    ctx.fillStyle = rgb(col);
    ctx.fill();
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-hl * 0.88, -hw * 0.32);
    ctx.quadraticCurveTo(0, -hw * 0.5 + b, hl * 0.72, b * 0.12 - hw * 0.08);
    ctx.lineWidth = hw * 0.48;
    ctx.strokeStyle = rgb(lit(col, o.hi !== undefined ? o.hi : 0.3), 0.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-hl * 0.95, hw * 0.6);
    ctx.quadraticCurveTo(0, hw * 0.86 + b, hl * 0.85, b * 0.12 + hw * 0.1);
    ctx.lineWidth = hw * 0.32;
    ctx.strokeStyle = rgb(U.mul(col, 0.58), 0.75);
    ctx.stroke();
    const v1 = (r.next() - 0.5) * hw * 0.9;
    ctx.beginPath();
    ctx.moveTo(-hl * 0.55, v1);
    ctx.quadraticCurveTo(hl * 0.2, v1 * 0.8 + b * 0.9, hl * 0.95, b * 0.12 + v1 * 0.3);
    ctx.lineWidth = Math.max(0.05, wid * 0.08);
    ctx.lineCap = 'butt';
    ctx.strokeStyle = rgb(U.mul(col, 0.7), 0.55);
    ctx.stroke();
    ctx.restore();
  }
  function blob(cx, cy, rx, ry, n, rough, r) {
    const P = [];
    const p1 = r.next() * TAU, p2 = r.next() * TAU;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const k = 1 + rough * (0.6 * Math.sin(a * 3 + p1) + 0.4 * Math.sin(a * 5 + p2));
      P.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    return P;
  }
  function spline(P, steps) {
    const out = [], n = P.length;
    for (let i = 0; i < n; i++) {
      const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
      for (let s = 0; s < steps; s++) {
        const t = s / steps, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    return out;
  }
  function pathOf(P) {
    const p = new Path2D();
    p.moveTo(P[0][0], P[0][1]);
    for (let i = 1; i < P.length; i++) p.lineTo(P[i][0], P[i][1]);
    p.closePath();
    return p;
  }
  function inPoly(P, x, y) {
    let ins = false;
    for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
      const xi = P[i][0], yi = P[i][1], xj = P[j][0], yj = P[j][1];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
    }
    return ins;
  }
  function bbox(P) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of P) {
      if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1];
    }
    return { x0, y0, x1, y1 };
  }
  function paint(ctx, P, r, o) {
    const path = pathOf(P), bb = bbox(P);
    if (o.base) { ctx.fillStyle = rgb(o.base); ctx.fill(path); }
    ctx.save();
    ctx.clip(path);
    const sp = o.sp, jit = o.jit === undefined ? 0.25 : o.jit, sy = sp * 0.75;
    for (let y = bb.y0; y <= bb.y1 + sy * 0.5; y += sy) {
      for (let x = bb.x0; x <= bb.x1 + sp * 0.5; x += sp) {
        const px = x + (r.next() - 0.5) * sp, py = y + (r.next() - 0.5) * sy;
        if (!inPoly(P, px, py)) continue;
        const col = o.col(px, py, r);
        if (!col) continue;
        stroke(ctx, px, py, o.ang(px, py, r) + (r.next() - 0.5) * jit * 2, o.len * (0.75 + r.next() * 0.5), o.wid * (0.8 + r.next() * 0.4), col, r, o.so);
      }
    }
    ctx.restore();
    if (o.edge) contour(ctx, P, r, o.edge);
  }
  const CONT_O = { hi: 0.16 };
  function contour(ctx, P, r, e) {
    const n = P.length;
    let cx = 0, cy = 0;
    for (const p of P) { cx += p[0]; cy += p[1]; }
    cx /= n; cy /= n;
    const step = e.l * 0.6;
    let carry = r.next() * step;
    for (let i = 0; i < n; i++) {
      const a = P[i], b = P[(i + 1) % n];
      const dx = b[0] - a[0], dy = b[1] - a[1], L = hyp(dx, dy);
      if (L < 1e-6) continue;
      const ang = Math.atan2(dy, dx);
      let d = carry;
      while (d < L) {
        const t = d / L, x = a[0] + dx * t, y = a[1] + dy * t;
        const ox = x - cx, oy = y - cy, ol = hyp(ox, oy) || 1;
        const sh = (ox / ol) * 0.55 + (oy / ol) * 0.83;
        if (!e.skip || !e.skip(x, y, sh)) {
          const w = e.w * (0.7 + 0.55 * clamp01(sh * 0.5 + 0.5));
          stroke(ctx, x, y, ang + (r.next() - 0.5) * 0.2, e.l * (0.8 + r.next() * 0.4), w, e.col, r, CONT_O);
        }
        d += step;
      }
      carry = d - L;
    }
  }
  function seg(ctx, x0, y0, x1, y1, wid, col, r, o) {
    const L = hyp(x1 - x0, y1 - y0);
    stroke(ctx, (x0 + x1) / 2, (y0 + y1) / 2, Math.atan2(y1 - y0, x1 - x0), L + wid * 0.4, wid, col, r, o);
  }
  function polyStroke(ctx, pts, wid, l, col, r, o) {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const L = hyp(b[0] - a[0], b[1] - a[1]);
      const n = Math.max(1, Math.round(L / l));
      for (let k = 0; k < n; k++) {
        const t0 = k / n, t1 = (k + 1) / n;
        seg(ctx, a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0, a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1, typeof wid === 'function' ? wid((i + t0) / (pts.length - 1)) : wid, Array.isArray(col[0]) ? col[(r.next() * col.length) | 0] : col, r, o);
      }
    }
  }
  const rampPick = (pal, v) => pal[clamp(Math.round(v), 0, pal.length - 1)];
  function cv(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    return { c, ctx: c.getContext('2d', { willReadFrequently: true }) };
  }
  function gpuc(src) {
    const o = U.canvas(src.width, src.height);
    o.ctx.drawImage(src, 0, 0);
    return o.c;
  }
  function mk(wu, hu, ax, ay, fn, k) {
    k = k || K;
    const { c, ctx } = cv(wu * k, hu * k);
    ctx.scale(k, k);
    ctx.translate(ax, ay);
    fn(ctx);
    const s = { c: gpuc(c), f: null, w: wu, h: hu, ax, ay };
    s.f = U.flipX(s.c);
    return s;
  }
  function blit(ctx, s, x, y, flip, sc, img, sx, sy) {
    sc = sc || 1;
    const kx = sc * (sx || 1), ky = sc * (sy || 1);
    const im = img || (flip ? s.f || s.c : s.c);
    const ax = flip ? s.w - s.ax : s.ax;
    ctx.drawImage(im, x - ax * kx, y - s.ay * ky, s.w * kx, s.h * ky);
  }
  function flashOf(s, flip) {
    if (!s.fl) { s.fl = U.tint(s.c, '#ffc84a', 1); s.flf = U.flipX(s.fl); }
    return flip ? s.flf : s.fl;
  }
  function hotOf(s, flip) {
    if (!s.ht) { s.ht = U.tint(s.c, '#fff2d8', 0.85); s.htf = U.flipX(s.ht); }
    return flip ? s.htf : s.ht;
  }
  function radial(px, stops) {
    const { c, ctx } = cv(px, px);
    const g = ctx.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2);
    for (const s of stops) g.addColorStop(s[0], s[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, px, px);
    return gpuc(c);
  }
  function haloSprite(px, cols, rings, seed) {
    const { c, ctx } = cv(px, px);
    const R = px / 2, r = U.rng(seed);
    const g = ctx.createRadialGradient(R, R, 0, R, R, R * 0.5);
    g.addColorStop(0, rgb(H(cols[0]), 0.55));
    g.addColorStop(0.5, rgb(H(cols[1]), 0.18));
    g.addColorStop(1, rgb(H(cols[1]), 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, px, px);
    rings.forEach((rg, i) => {
      const rr = rg[0] * R, n = Math.max(6, Math.round((TAU * rr) / (rg[2] * R * 0.85)));
      const off = r.next() * TAU;
      for (let k = 0; k < n; k++) {
        const a = off + (k / n) * TAU + (r.next() - 0.5) * 0.12;
        const col = H(cols[Math.min(cols.length - 1, i + (r.next() < 0.3 ? 1 : 0))]);
        stroke(ctx, R + Math.cos(a) * rr, R + Math.sin(a) * rr, a + Math.PI / 2 + 0.12, rg[2] * R * (0.8 + r.next() * 0.4), rg[3] * R, col, r, { a: rg[1] * (0.7 + r.next() * 0.3), bend: 0.12 });
      }
    });
    return gpuc(c);
  }
  function rotDraw(ctx, img, x, y, ang, w, h) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  /* ---------- palette (copied + new accents in the same key) ---------- */
  const PRUSSIAN = H('#111733');
  const DARKC = H('#0c0812');
  const ORANGE = hexes(['#8e3a12', '#b8521a', '#d86c1e', '#ec8a28', '#f6aa3c', '#fcd06a']);
  const COAT = hexes(['#141d52', '#1d2c78', '#26409a', '#3157b4', '#4a76cc', '#7aa0e0']);
  const LEAF = hexes(['#163a2a', '#1f5a3a', '#2f7a4a', '#4a9a52', '#80bc5c']);
  const GLOWC = hexes(['#4a1206', '#ffb52e', '#ffe070', '#fff6c8']);
  const VIO = [hexes(['#34124c', '#55206f', '#763896', '#985ab6', '#c28cd8']), hexes(['#3e1040', '#661c5e', '#8a2e7c', '#ae5296', '#d488b8'])];
  const CREAM = [hexes(['#9c8656', '#c4ad78', '#e2d09a', '#f4e9c2', '#fffbe8']), hexes(['#a07a2a', '#c89e3e', '#e6c25a', '#f4dc8a', '#fff2c0'])];
  const COLU = hexes(['#22160e', '#35231a', '#4c3322', '#664630', '#82603e', '#a07c52']);
  const TOX = hexes(['#1e3a10', '#3a7020', '#62a42c', '#98d040', '#d4f478']);
  const CREAMG = hexes(['#6e7a3e', '#9aa862', '#c4cf88', '#e4ebb4', '#f8fbe0']);
  const TOXGLOW = hexes(['#0e2a08', '#6ad02a', '#c8f060', '#f4ffd0']);
  const BEET = hexes(['#3a0818', '#6e1430', '#a01e40', '#cc3a52', '#ec6a72']);
  const HORN = hexes(['#2e1c10', '#4c3020', '#6e4a2c', '#9a7044', '#c89e6a']);
  const REDS = hexes(['#5a1008', '#8e2014', '#c8341e', '#e8502a', '#f6883a']);
  const PARS = hexes(['#7e5e36', '#b48e58', '#d8bc84', '#efdcae', '#fff4d6']);
  const GOLD = hexes(['#7a5a1e', '#a87c26', '#d4a03c', '#ecc463', '#fff0a8']);

  function carved(ctx, P, r, pal) {
    pal = pal || GLOWC;
    let cx = 0, cy = 0;
    for (const p of P) { cx += p[0]; cy += p[1]; }
    cx /= P.length; cy /= P.length;
    ctx.fillStyle = rgb(pal[0]);
    ctx.fill(pathOf(P.map((p) => [p[0] + 0.35, p[1] + 0.4])));
    ctx.fillStyle = rgb(pal[1]);
    ctx.fill(pathOf(P));
    ctx.fillStyle = rgb(pal[2]);
    ctx.fill(pathOf(P.map((p) => [cx + (p[0] - cx) * 0.62, cy + (p[1] - cy) * 0.62 + 0.15])));
    ctx.fillStyle = rgb(pal[3]);
    ctx.fill(pathOf(P.map((p) => [cx + (p[0] - cx) * 0.3, cy + (p[1] - cy) * 0.3 + 0.2])));
  }
  const tri = (cx, cy, s, tall) => [[cx - s, cy + s * 0.6 * tall], [cx + s, cy + s * 0.6 * tall], [cx + s * 0.15, cy - s * 1.0 * tall]];
  /** turnip silhouette (creeper body) */
  function turnipBody(cx, cy, rx, ry, n) {
    const body = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, s = Math.sin(a);
      const kx = s > 0 ? 1 - 0.38 * s * s : 1, ky = s > 0 ? 1 + 0.3 * s * s * s : 1;
      body.push([cx + Math.cos(a) * rx * kx, cy + s * ry * ky]);
    }
    return body;
  }
  function legs(ctx, r, leg, hx, hy, spread, w, col, foot) {
    for (const s of [-1, 1]) {
      const fx = s * spread + s * leg * 1.7, fy = -0.5 - Math.max(0, s * leg) * 1.2;
      seg(ctx, s * hx, hy, fx, fy, w, H(col || '#a8865a'), r);
      stroke(ctx, fx + s * 0.8, fy, s * 0.2, 2.2 * (w / 1.8), 1.2 * (w / 1.8), H(foot || '#7a5a38'), r);
    }
  }

  /* ===== Rüben-Spucker ===== */
  function drawSpitter(ctx, r, pose) {
    const c = pose.c || 0;
    ctx.translate(0, pose.bob);
    legs(ctx, r, pose.leg, 2.4, -4.6, 3, 1.8);
    ctx.translate(0, -4.5);
    ctx.scale(1 + 0.15 * c, 1 + 0.06 * c);
    ctx.translate(0, 4.5);
    ctx.translate(0, -10); ctx.rotate(pose.tilt); ctx.translate(0, 10);
    const cx = 0, cy = -12.6, rx = 8.8, ry = 8.4;
    // spiky toxic crest
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (-0.95 + i * 0.47) * (1 + c * 0.35) + pose.leaf * (i & 1 ? 1 : -0.6);
      const bx = cx + 0.3, by = cy - ry + 1.2;
      const L = 6.8 - Math.abs(i - 2) * 0.7;
      stroke(ctx, bx + Math.cos(a) * L * 0.55, by + Math.sin(a) * L * 0.55, a, L, 2.2, TOX[1 + (i % 3)], r, { hi: 0.25 });
      stroke(ctx, bx + Math.cos(a) * L * 0.5, by + Math.sin(a) * L * 0.5, a, L * 0.7, 0.7, TOX[4], r, { a: 0.85 });
    }
    const body = turnipBody(cx, cy, rx, ry, 40);
    paint(ctx, body, r, {
      base: VIO[0][1], sp: 1.25, len: 3.4, wid: 1.4, jit: 0.15,
      col: (x, y, rr) => {
        const dx = (x - cx) / rx, dy = (y - cy) / ry;
        const t = (dy + 1) / 2, b = 0.5 + 0.08 * Math.sin(x * 0.9);
        const l = -dx * 1.4 - dy * 0.6;
        if (t + (rr.next() - 0.5) * 0.2 < b) return rr.next() < 0.33 ? rampPick(TOX, 2.4 + l + (rr.next() - 0.5) * 1.2) : rampPick(VIO[0], 2.1 + l + (rr.next() - 0.5) * 1.2);
        return rampPick(CREAMG, 2.3 + l + (rr.next() - 0.5) * 1.2);
      },
      ang: (x, y) => Math.atan2((x - cx) / (rx * rx), -(y - cy) / (ry * ry)) * 0.7,
      edge: { col: H('#122010'), w: 0.95, l: 2.8 },
    });
    seg(ctx, cx + 0.3, cy + ry * 1.18, cx + 1.4, cy + ry * 1.18 + 2.2, 0.8, H('#8a6a48'), r);
    // toxic eyes + brows
    const ex = cx + 0.4;
    for (const s of [-1, 1]) {
      const x = ex + s * 2.5, y = cy - 1.6;
      stroke(ctx, x, y, s * 0.35, 2.4, 1.6, H('#c8f060'), r, { hi: 0.55, bend: 0 });
      stroke(ctx, x + 0.3, y + 0.15, 0, 0.8, 0.8, H('#102008'), r, { bend: 0 });
      stroke(ctx, x - s * 0.1, y - 1.5, s * 0.45, 2.8, 0.9, H('#1d0f2a'), r, { bend: 0, hi: 0.1 });
    }
    // the snout tube (pointing forward)
    const ty = cy + 2.2, tl = -0.6 * c;
    const tube = [[4.6, ty - 2.2], [8.6, ty - 2.1 + tl], [11.4, ty - 2.7 + tl], [11.4, ty + 2.5 + tl], [8.6, ty + 2.1 + tl], [4.6, ty + 2.2]];
    paint(ctx, tube, r, {
      base: CREAMG[2], sp: 1.0, len: 2.4, wid: 1.1, jit: 0.1,
      col: (x, y, rr) => rampPick(CREAMG, 3.2 - (y - ty + 2) * 0.6 + (rr.next() - 0.5)),
      ang: () => 0,
      edge: { col: H('#122010'), w: 0.7, l: 2 },
    });
    for (const px of [7.2, 9.4]) seg(ctx, px, ty - 2, px + 0.3, ty + 2, 0.45, CREAMG[0], r, { a: 0.8 });
    const lip = blob(11.6, ty + tl - 0.1, 1.6 + c * 0.3, 3.3 + c * 0.4, 18, 0.03, r);
    paint(ctx, lip, r, {
      base: TOX[2], sp: 0.8, len: 1.8, wid: 0.9,
      col: (x, y, rr) => rampPick(TOX, 3 - (y - ty) * 0.4 + (rr.next() - 0.5)),
      ang: (x, y) => Math.atan2(y - ty, x - 11.6) + Math.PI / 2,
      edge: { col: H('#0e1a08'), w: 0.6, l: 1.6 },
    });
    const hole = blob(11.9, ty + tl - 0.1, 0.85 + c * 0.2, 2.0 + c * 0.3, 14, 0.02, r);
    if (c > 0) carved(ctx, hole, r, TOXGLOW);
    else { ctx.fillStyle = '#0e1a08'; ctx.fill(pathOf(hole)); stroke(ctx, 12.2, ty + tl + 0.6, 1.5, 1.2, 0.5, TOX[3], r, { bend: 0 }); }
    // drool
    seg(ctx, 11.4, ty + tl + 2.8, 11.6, ty + tl + 5.2, 0.9, H('#8fd43a'), r, { hi: 0.5 });
    stroke(ctx, 11.7, ty + tl + 5.6, 1.57, 1.3, 1.3, H('#b6f04a'), r, { hi: 0.6, bend: 0 });
    // front arm clutching the tube
    seg(ctx, 5, ty + 1.2, 7.6, ty + 3.6 - c, 1.1, H('#a8865a'), r);
  }
  const spitMouth = (c) => [12.1 * (1 + 0.15 * c), -4.5 + (-10.4 - 0.6 * c - 0.1 + 4.5) * (1 + 0.06 * c)];

  /* ===== Zündrübe ===== */
  const BOMB_TIP = [2.8, -20.6];
  function drawBomber(ctx, r, pose) {
    ctx.translate(0, pose.bob);
    legs(ctx, r, pose.leg, 1.8, -4.0, 2.2, 1.5, '#6e1430', '#3a0818');
    const cx = 0, cy = -9.6, R = 6.5;
    // leaves on red stems
    for (const [a, L, col] of [[-2.2, 6.2, LEAF[1]], [-1.0, 6.8, LEAF[2]]]) {
      const bx = cx - 0.2, by = cy - R + 0.4;
      seg(ctx, bx, by, bx + Math.cos(a) * L * 0.5, by + Math.sin(a) * L * 0.5, 0.7, BEET[3], r);
      stroke(ctx, bx + Math.cos(a) * L * 0.7, by + Math.sin(a) * L * 0.7, a, L * 0.8, 2.4, col, r, { hi: 0.25 });
      stroke(ctx, bx + Math.cos(a) * L * 0.65, by + Math.sin(a) * L * 0.65, a, L * 0.55, 0.6, BEET[3], r, { a: 0.9 });
    }
    // fuse (twisted string)
    const F = [[0.4, cy - R + 0.2], [-0.5, cy - R - 2.0], [1.0, cy - R - 3.8], [2.8, -20.6]];
    polyStroke(ctx, F, 0.9, 1.2, H('#5a3a22'), r, { hi: 0.2 });
    polyStroke(ctx, F, 0.35, 1.0, H('#d8b47a'), r, { a: 0.85 });
    // round beet body
    const body = blob(cx, cy, R, R * 1.02, 36, 0.03, r);
    paint(ctx, body, r, {
      base: BEET[2], sp: 1.1, len: 3.0, wid: 1.3, jit: 0.15,
      col: (x, y, rr) => {
        const dx = (x - cx) / R, dy = (y - cy) / R;
        if (dy + (rr.next() - 0.5) * 0.25 < -0.68) return rampPick(ORANGE, 3.4 - dx * 1.2 + (rr.next() - 0.5));
        return rampPick(BEET, 2.6 - dx * 1.5 - dy * 1.1 + (rr.next() - 0.5) * 1.2);
      },
      ang: (x, y) => Math.atan2(y - cy, x - cx) + Math.PI / 2,
      edge: { col: DARKC, w: 0.95, l: 2.6 },
    });
    seg(ctx, cx - 0.2, cy + R, cx - 2.6, cy + R + 1.6, 0.7, BEET[1], r);
    seg(ctx, cx - 2.6, cy + R + 1.6, cx - 3.8, cy + R + 0.8, 0.5, BEET[1], r);
    // mean eyes, one heavy brow, gritted teeth
    for (const s of [-1, 1]) stroke(ctx, cx + 2.4 + s * 1.9, cy - 0.4, s * 0.4, 1.9, 1.2, H('#ffd040'), r, { hi: 0.55, bend: 0 });
    stroke(ctx, cx + 2.4, cy - 2.1, 0, 6.2, 1.2, DARKC, r, { bend: -0.12, hi: 0.08 });
    stroke(ctx, cx + 2.6, cy + 2.4, 0.04, 4.4, 1.4, H('#240610'), r, { bend: 0.05, hi: 0.05 });
    for (const tx of [1.4, 2.5, 3.6]) stroke(ctx, cx + tx, cy + 2.3, Math.PI / 2, 0.9, 0.6, H('#f4e9c2'), r, { bend: 0, hi: 0.4 });
  }

  /* ===== Wurzel-Bock ===== */
  function hornPts(a0, R0, turn, N) {
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, a = a0 - t * turn, rr = R0 * (1 - 0.6 * t);
      pts.push([Math.cos(a) * rr - Math.cos(a0) * R0, Math.sin(a) * rr - Math.sin(a0) * R0]);
    }
    return pts;
  }
  function drawHorn(ctx, r, bx, by, tilt, dark) {
    const c = Math.cos(tilt), s = Math.sin(tilt);
    const P = hornPts(-0.25, 4.9, 5.1, 16).map((p) => [bx + p[0] * c - p[1] * s, by + p[0] * s + p[1] * c]);
    const pal = dark ? HORN.map((h) => U.mul(h, 0.78)) : HORN;
    polyStroke(ctx, P, (u) => 3.3 * (1 - 0.68 * u), 1.2, DARKC, r, { hi: 0.05 });
    polyStroke(ctx, P, (u) => 2.5 * (1 - 0.68 * u), 1.1, [pal[2], pal[3], pal[2]], r, { hi: 0.3 });
    polyStroke(ctx, P.slice(0, 10).map((p) => [p[0] - 0.3, p[1] - 0.4]), 0.6, 1.2, pal[4], r, { a: 0.85 });
  }
  function drawCharger(ctx, r, pose) {
    const ph = pose.ph, mode = pose.mode;
    const sw = Math.sin(ph), cw = Math.cos(ph);
    let tilt = 0, bob = -Math.abs(cw) * 0.8, lf = sw * 2.2, lb = -sw * 2.2, liftF = Math.max(0, cw) * 1.2, liftB = Math.max(0, -cw) * 1.2;
    if (mode === 'tele') { tilt = -0.17; bob = -1.0; lf = 2.6 + sw * 1.6; liftF = 3.0 + Math.max(0, sw) * 1.4; lb = -1.0; liftB = 0; }
    else if (mode === 'dash') { tilt = 0.14; bob = 0.5; lf = 4.2; liftF = 1.6; lb = -4.4; liftB = 1.4; }
    else if (mode === 'rest') { tilt = 0.06 * sw; bob = 0.4; lf = 0.6; lb = -0.6; liftF = liftB = 0; }
    const cy = -10.2 + bob;
    const rot = (px, py) => [px * Math.cos(tilt) - (py + 12) * Math.sin(tilt), cy + px * Math.sin(tilt) + (py + 12) * Math.cos(tilt)];
    const leg = (hx, hy, dx, li, dark) => {
      const top = rot(hx, hy), fx = top[0] + dx, fy = -0.6 - li;
      seg(ctx, top[0], top[1], fx, fy - 0.6, 2.4, dark ? COLU[2] : COLU[3], r);
      seg(ctx, top[0] - 0.5, top[1] + 0.4, fx - 0.5, fy - 1.2, 0.7, COLU[5], r, { a: 0.8 });
      stroke(ctx, fx + 0.5, fy - 0.1, 0.05, 2.8, 1.3, COLU[0], r, { hi: 0.2 });
    };
    leg(5.4, -7.4, lf * 0.8 - 0.8, liftF * 0.8, true);
    leg(-6.4, -9, lb * 0.8 - 0.8, liftB * 0.8, true);
    // curling root tail
    const t0 = rot(-14.2, -13.6);
    polyStroke(ctx, [t0, [t0[0] - 2.4, t0[1] - 1.6], [t0[0] - 3.0, t0[1] - 4.0], [t0[0] - 1.8, t0[1] - 5.0]], 0.9, 1.4, H('#a8865a'), r);
    // leaf tuft
    const tf = rot(-1.6, -18.2);
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 - 0.6 + i * 0.45 + tilt;
      stroke(ctx, tf[0] + Math.cos(a) * 3.2, tf[1] + Math.sin(a) * 3.2, a, 6, 2.2, LEAF[1 + (i & 1)], r, { hi: 0.22 });
      stroke(ctx, tf[0] + Math.cos(a) * 3, tf[1] + Math.sin(a) * 3, a, 4, 0.7, LEAF[4], r, { a: 0.85 });
    }
    const hb = rot(2.6, -17.4);
    drawHorn(ctx, r, hb[0], hb[1], tilt, true);
    // parsnip body
    const ctrl = [[-14.6, -13.8], [-9.2, -17.4], [-2.4, -18.8], [4.0, -18.0], [9.0, -15.6], [11.9, -11.6], [11.5, -7.8], [8.2, -5.9], [3.0, -6.4], [-3.0, -7.4], [-8.6, -9.8]].map((p) => rot(p[0], p[1]));
    const body = spline(ctrl, 3);
    const b0 = rot(0, -12);
    paint(ctx, body, r, {
      base: PARS[2], sp: 1.3, len: 3.6, wid: 1.45, jit: 0.15,
      col: (x, y, rr) => {
        const dy = (y - b0[1]) / 6, dx = (x - b0[0]) / 13;
        if (dy + (rr.next() - 0.5) * 0.4 > 0.55) return rampPick(COLU, 3.4 - dx + (rr.next() - 0.5));
        return rampPick(PARS, 2.9 - dy * 1.6 - dx * 0.6 + (rr.next() - 0.5) * 1.2);
      },
      ang: (x, y) => tilt + (y - b0[1]) * 0.03 + Math.sin(x * 0.3) * 0.12,
      edge: { col: DARKC, w: 1.0, l: 2.8 },
    });
    for (const px of [-10.5, -6.8, -3]) { const a = rot(px, -17), b = rot(px + 0.5, -13.8); seg(ctx, a[0], a[1], b[0], b[1], 0.45, PARS[0], r, { a: 0.8 }); }
    // face on the lowered head
    const e1 = rot(7.0, -12.8), e2 = rot(10.2, -12.6);
    if (mode === 'rest') {
      for (const e of [e1, e2]) {
        ctx.fillStyle = rgb(CREAM[0][4]); ctx.beginPath(); ctx.arc(e[0], e[1], 1.2, 0, TAU); ctx.fill();
        const S = [];
        for (let i = 0; i <= 14; i++) { const a = i * 0.75, rr = 0.15 + i * 0.065; S.push([e[0] + Math.cos(a) * rr, e[1] + Math.sin(a) * rr]); }
        polyStroke(ctx, S, 0.32, 0.6, DARKC, r, { bend: 0, hi: 0.05 });
      }
    } else {
      const col = mode === 'chase' ? H('#ffcf40') : H('#ff5a3a');
      for (const [e, s] of [[e1, 1], [e2, 0.85]]) {
        stroke(ctx, e[0], e[1], 0.3, 2.2 * s, 1.4 * s, col, r, { hi: 0.6, bend: 0 });
        stroke(ctx, e[0] + 0.3, e[1] + 0.1, 0, 0.7, 0.7, H('#2a0806'), r, { bend: 0 });
      }
    }
    const br = [rot(5.0, -15.4), rot(8.4, -14.0), rot(11.6, -15.2)];
    seg(ctx, br[0][0], br[0][1], br[1][0], br[1][1], 1.2, DARKC, r, { hi: 0.08 });
    seg(ctx, br[1][0], br[1][1], br[2][0], br[2][1], 1.1, DARKC, r, { hi: 0.08 });
    for (const n of [rot(11.0, -9.4), rot(9.9, -9.0)]) { ctx.fillStyle = '#1a0c08'; ctx.beginPath(); ctx.ellipse(n[0], n[1], 0.34, 0.5, 0.3, 0, TAU); ctx.fill(); }
    const m0 = rot(6.6, -7.9), m1 = rot(10, -8.1);
    seg(ctx, m0[0], m0[1], m1[0], m1[1], 0.7, H('#2a0c10'), r, { bend: 0.2 });
    leg(6.6, -7.2, lf, liftF, false);
    leg(-5.4, -8.6, lb, liftB, false);
    const hf = rot(4.2, -17.0);
    drawHorn(ctx, r, hf[0], hf[1], tilt, false);
    pose.eye = [(e1[0] + e2[0]) / 2, (e1[1] + e2[1]) / 2];
    pose.top = rot(2, -22);
  }

  /* ===== Rüben-Ahnin ===== */
  function drawMother(ctx, r, pose) {
    ctx.translate(0, pose.bob);
    const lift = pose.lift;
    for (const s of [-1, 1]) {
      const li = Math.max(0, s * lift) * 1.6, fx = s * 5.2, fy = -0.8 - li;
      seg(ctx, s * 5, -10, fx, fy - 1.2, 3.2, CREAM[0][1], r);
      stroke(ctx, fx + 1.2, fy - 0.3, 0.04, 5, 2.2, H('#1e130e'), r, { hi: 0.22 });
    }
    // back arm
    seg(ctx, -11, -22, -14, -15, 2.4, CREAM[0][1], r);
    const cx = 0, cy = -22, rx = 13.2, ry = 14;
    const body = blob(cx, cy, rx, ry, 44, 0.04, r);
    paint(ctx, body, r, {
      base: VIO[0][1], sp: 1.7, len: 4.6, wid: 1.8, jit: 0.2,
      col: (x, y, rr) => {
        const dx = (x - cx) / rx, dy = (y - cy) / ry;
        const l = -dx * 1.4 - dy * 1.1;
        const t = (dy + 1) / 2 + (rr.next() - 0.5) * 0.2;
        return t < 0.47 ? rampPick(VIO[0], 2.2 + l + (rr.next() - 0.5) * 1.3) : rampPick(CREAM[1], 2.0 + l + (rr.next() - 0.5) * 1.3);
      },
      ang: (x, y) => {
        const dx = x - cx, dy = y - cy;
        return Math.atan2(dx / (rx * rx), -dy / (ry * ry)) * 0.75;
      },
      edge: { col: DARKC, w: 1.3, l: 3.6 },
    });
    // golden knitted shawl
    const shawl = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12, x = -rx * 1.0 + t * rx * 2, y = cy + 2.4 + Math.sin(t * Math.PI) * 4.4; shawl.push([x, y]); }
    for (let i = 12; i >= 0; i--) { const t = i / 12, x = -rx * 0.92 + t * rx * 1.84, y = cy + 6.8 + Math.sin(t * Math.PI) * 4.6; shawl.push([x, y]); }
    paint(ctx, shawl, r, {
      base: GOLD[2], sp: 1.2, len: 2.4, wid: 1.25, jit: 0.3,
      col: (x, y, rr) => rampPick(GOLD, 3 - x / 9 + (rr.next() - 0.5) * 1.3),
      ang: (x, y, rr) => (rr.next() < 0.5 ? 0.7 : -0.7),
      edge: { col: H('#4a3010'), w: 0.5, l: 2.2 },
    });
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) seg(ctx, s * (rx - 0.6 - i * 0.7), cy + 4.5 + i * 0.4, s * (rx - 0.4 - i * 0.7), cy + 7.4 + i * 0.4, 0.55, GOLD[1], r);
    // face: half-lid glowing eyes, brass spectacles
    const fx = 6.2, ey = cy - 2.6;
    for (const [x, s] of [[fx - 2.7, 1], [fx + 2.6, 0.9]]) {
      stroke(ctx, x, ey + 0.4, 0, 2.4 * s, 1.0, H('#ffcf40'), r, { hi: 0.6, bend: 0 });
      stroke(ctx, x, ey - 0.25, 0, 3.2 * s, 0.8, VIO[0][0], r, { bend: -0.1, hi: 0.1 });
      ctx.lineWidth = 0.5; ctx.strokeStyle = '#c8a040';
      ctx.beginPath(); ctx.arc(x, ey + 0.3, 2.2 * s, 0, TAU); ctx.stroke();
      ctx.lineWidth = 0.22; ctx.strokeStyle = 'rgba(255,240,180,0.9)';
      ctx.beginPath(); ctx.arc(x, ey + 0.3, 2.2 * s, Math.PI * 1.05, Math.PI * 1.55); ctx.stroke();
    }
    stroke(ctx, fx, ey + 5.0, 0, 3.2, 0.7, H('#2a0c22'), r, { bend: -0.25, hi: 0.1 });
    // red polka-dot headscarf band + knot
    const sc = [];
    for (let i = 0; i <= 14; i++) { const a = Math.PI * (1.04 + (i / 14) * 0.9); sc.push([Math.cos(a) * rx * 0.98, cy - 3 + Math.sin(a) * ry * 0.98]); }
    for (let i = 14; i >= 0; i--) { const a = Math.PI * (1.06 + (i / 14) * 0.86); sc.push([Math.cos(a) * rx * 0.74, cy - 3 + Math.sin(a) * ry * 0.74]); }
    paint(ctx, sc, r, {
      base: REDS[2], sp: 1.1, len: 2.6, wid: 1.2, jit: 0.15,
      col: (x, y, rr) => rampPick(REDS, 2.3 - x / 10 - (y - cy + 10) / 12 + (rr.next() - 0.5)),
      ang: (x, y) => Math.atan2(y - cy + 3, x) + Math.PI / 2,
      edge: { col: DARKC, w: 0.8, l: 2.4 },
    });
    for (let i = 0; i < 8; i++) { const a = Math.PI * (1.12 + (i / 7) * 0.76); stroke(ctx, Math.cos(a) * rx * 0.86, cy - 3 + Math.sin(a) * ry * 0.86, a, 0.8, 0.7, H('#fff6dc'), r, { bend: 0, hi: 0.4 }); }
    seg(ctx, rx * 0.86, cy - 4.6, rx + 3.6, cy - 2.4, 1.8, REDS[2], r);
    seg(ctx, rx * 0.86, cy - 5.2, rx + 3.8, cy - 7.2, 1.6, REDS[3], r);
    stroke(ctx, rx * 0.9, cy - 4.9, 0, 1.6, 1.8, REDS[1], r, { bend: 0 });
    // crown of baby turnips
    for (const [bx, byy, v, s] of [[-5.8, cy - 13.4, 0, 0.42], [6.0, cy - 13.0, 1, 0.42], [0.2, cy - 15.2, 0, 0.48]]) {
      ctx.save(); ctx.translate(bx, byy); ctx.scale(s, s);
      const bc = 0, bcy = -5;
      for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + (i - 1) * 0.6; stroke(ctx, Math.cos(a) * 4, bcy - 7 + Math.sin(a) * 4, a, 6, 2.4, LEAF[1 + (i & 1)], r); }
      paint(ctx, turnipBody(bc, bcy, 7, 6.8, 28), r, {
        base: VIO[v][2], sp: 2.2, len: 4.6, wid: 2.2,
        col: (x, y, rr) => (y + (rr.next() - 0.5) * 2 < bcy ? rampPick(VIO[v], 3 - x * 0.2 + (rr.next() - 0.5)) : rampPick(CREAM[0], 3 - x * 0.2 + (rr.next() - 0.5))),
        ang: (x, y) => Math.atan2(x, -(y - bcy)) * 0.6,
        edge: { col: H('#1d1036'), w: 1.8, l: 4.4 },
      });
      ctx.fillStyle = '#120a18'; ctx.beginPath(); ctx.arc(1, bcy, 0.9, 0, TAU); ctx.arc(4, bcy, 0.9, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(240,120,130,0.7)'; ctx.beginPath(); ctx.arc(-1, bcy + 2, 1, 0, TAU); ctx.arc(5.6, bcy + 2, 1, 0, TAU); ctx.fill();
      ctx.restore();
    }
    // cane + front arm
    const hx = 15, hy = cy + 7.6;
    seg(ctx, hx + 0.6, -0.6, hx + 0.3, hy - 1.6, 1.1, H('#4a2e18'), r);
    polyStroke(ctx, [[hx + 0.3, hy - 1.6], [hx + 1.2, hy - 3.8], [hx + 3, hy - 3.4]], 1.0, 1.2, H('#4a2e18'), r);
    seg(ctx, 11, cy + 1, hx, hy - 0.6, 2.5, CREAM[0][2], r);
    stroke(ctx, hx + 0.3, hy - 0.4, 0.4, 2, 1.8, CREAM[0][3], r);
  }

  /* ===== Rübchen ===== */
  function drawSprout(ctx, r, pose, v) {
    ctx.translate(0, pose.bob);
    legs(ctx, r, pose.leg, 1.3, -2.6, 1.6, 1.1);
    ctx.translate(0, -5); ctx.rotate(pose.tilt); ctx.translate(0, 5);
    const cx = 0, cy = -6.8, rx = 4.6, ry = 4.4;
    stroke(ctx, cx + 1.8, cy - ry - 3, -1.1, 6.4, 3.0, LEAF[2 + v], r, { hi: 0.25 });
    stroke(ctx, cx + 1.7, cy - ry - 2.8, -1.1, 4.2, 0.7, LEAF[4], r, { a: 0.85 });
    stroke(ctx, cx - 1.4, cy - ry - 0.8, -2.3, 3.2, 1.6, LEAF[1], r);
    paint(ctx, turnipBody(cx, cy, rx, ry, 30), r, {
      base: VIO[1][2], sp: 0.95, len: 2.2, wid: 1.0, jit: 0.15,
      col: (x, y, rr) => {
        const dx = (x - cx) / rx, dy = (y - cy) / ry;
        const l = -dx * 1.4 - dy * 0.6;
        return (dy + 1) / 2 + (rr.next() - 0.5) * 0.2 < 0.52 ? rampPick(VIO[v], 2.4 + l + (rr.next() - 0.5)) : rampPick(CREAM[0], 2.6 + l + (rr.next() - 0.5));
      },
      ang: (x, y) => Math.atan2((x - cx) / (rx * rx), -(y - cy) / (ry * ry)) * 0.7,
      edge: { col: H('#1d1036'), w: 0.7, l: 1.9 },
    });
    for (const s of [-1, 1]) {
      const x = cx + 1.2 + s * 1.5, y = cy - 0.3;
      ctx.fillStyle = '#120a18'; ctx.beginPath(); ctx.ellipse(x, y, 0.8, 0.95, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffd040'; ctx.beginPath(); ctx.arc(x + 0.15, y + 0.2, 0.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fffbe8'; ctx.beginPath(); ctx.arc(x - 0.3, y - 0.35, 0.22, 0, TAU); ctx.fill();
      stroke(ctx, x - s * 0.1, y - 1.4, s * 0.45, 2.0, 0.6, H('#1d0f2a'), r, { bend: 0, hi: 0.1 });
    }
    ctx.fillStyle = '#2a0c22'; ctx.beginPath(); ctx.ellipse(cx + 1.3, cy + 2.2, 0.6, 0.4, 0, 0, TAU); ctx.fill();
  }

  /* ---------- frames ---------- */
  const DEF = {
    spitter: { w: 34, h: 36, ax: 14, ay: 31, fn: drawSpitter },
    bomber: { w: 22, h: 28, ax: 11, ay: 25, fn: drawBomber },
    charger: { w: 40, h: 34, ax: 21, ay: 31, fn: drawCharger },
    mother: { w: 42, h: 50, ax: 19, ay: 47, fn: drawMother },
    sprout0: { w: 16, h: 20, ax: 7.5, ay: 18, fn: (c, r, p) => drawSprout(c, r, p, 0) },
    sprout1: { w: 16, h: 20, ax: 7.5, ay: 18, fn: (c, r, p) => drawSprout(c, r, p, 1) },
  };
  const FR = {}, ANY = {};
  let budgetT = -1, budgetStart = 0, FORCE = false;
  function painted(type, pose, seed) {
    const d = DEF[type];
    const s = mk(d.w, d.h, d.ax, d.ay, (ctx) => d.fn(ctx, U.rng(seed), pose));
    if (pose.eye) { s.eye = pose.eye; s.top = pose.top; }
    return s;
  }
  function frame(type, key, pose, seed, view) {
    const k = type + ':' + key;
    let s = FR[k];
    if (s) return s;
    // odd walk poses are painted in the background; meanwhile the neighbouring even pose stands in
    if (!FORCE && key[0] === 'w' && key[1] % 2 === 1) { const sib = FR[type + ':w' + ((+key[1] + 1) % 4)] || FR[type + ':w' + (+key[1] - 1)]; if (sib) return sib; }
    if (view.rt !== budgetT) { budgetT = view.rt; budgetStart = performance.now(); }
    if (ANY[type] && performance.now() - budgetStart > 4) return ANY[type];
    s = FR[k] = painted(type, pose, seed);
    if (!ANY[type]) ANY[type] = s;
    return s;
  }
  const walkPose = (p) => { const ph = (p / 4) * TAU; return { ph, leg: Math.sin(ph), bob: -Math.abs(Math.cos(ph)) * 0.8, tilt: Math.sin(ph) * 0.07, leaf: Math.cos(ph) * 0.12, lift: Math.sin(ph) }; };
  const pIdx = (anim, k) => (Math.floor(anim * k) % 4 + 4) % 4;
  const scOf = (e) => 0.92 + e.seed * 0.16;
  /** spawn (squash + fade) / flash (golden 'lighter', ≤55 %) / death (fade, swell, glow) – as the style's creeper */
  function drawBody(ctx, e, s, view, o) {
    o = o || {};
    const flip = e.facing < 0, sc = o.sc || scOf(e);
    const x = e.x + (o.dx || 0), y = e.y + (o.dy || 0);
    if (e.dying) {
      const d = e.deathT;
      ctx.globalAlpha = (1 - d) * (1 - d);
      blit(ctx, s, x, y - d * 3, flip, sc * (1 + d * 0.2));
      if (d < 0.4) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = (0.4 - d) * 1.2;
        blit(ctx, s, x, y - d * 3, flip, sc * (1 + d * 0.2), flashOf(s, flip));
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.globalAlpha = 1;
      return null;
    }
    if (e.spawnT < 1) {
      const st = e.spawnT, a = U.smoothstep(0.2, 0.9, st);
      if (a > 0) {
        ctx.globalAlpha = a;
        blit(ctx, s, x, y, flip, sc, null, 1.25 - 0.25 * st, 0.35 + 0.65 * U.ease.outQuad(st));
        ctx.globalAlpha = 1;
      }
      return null;
    }
    const sx = o.sx || 1, sy = o.sy || 1;
    blit(ctx, s, x, y, flip, sc, null, sx, sy);
    if (o.hot > 0.02) { ctx.globalAlpha = o.hot; blit(ctx, s, x, y, flip, sc, hotOf(s, flip), sx, sy); }
    if (e.flash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(0.55, e.flash * 0.9);
      blit(ctx, s, x, y, flip, sc, flashOf(s, flip), sx, sy);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
    return { sc, sx, sy, flip };
  }
  const at = (e, r, px, py) => [e.x + (r.flip ? -1 : 1) * px * r.sc * r.sx, e.y + py * r.sc * r.sy];
  function glowAt(ctx, img, x, y, R, a) {
    if (a <= 0.01) return;
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, a);
    ctx.drawImage(img, x - R, y - R, R * 2, R * 2);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  /* ---------- small sprites ---------- */
  const SM = {};
  function buildSmall() {
    SM.glow = radial(64, [[0, 'rgba(255,236,150,0.95)'], [0.35, 'rgba(255,190,70,0.45)'], [1, 'rgba(255,150,40,0)']]);
    SM.green = radial(64, [[0, 'rgba(220,255,150,0.95)'], [0.3, 'rgba(150,240,70,0.5)'], [0.65, 'rgba(90,200,40,0.14)'], [1, 'rgba(90,200,40,0)']]);
    SM.red = radial(64, [[0, 'rgba(255,210,170,0.95)'], [0.3, 'rgba(255,90,50,0.5)'], [1, 'rgba(255,40,20,0)']]);
    SM.lilac = radial(64, [[0, 'rgba(240,215,255,0.9)'], [0.35, 'rgba(200,150,240,0.4)'], [1, 'rgba(160,100,220,0)']]);
    SM.halo = haloSprite(96, ['#f4ffd0', '#d4f478', '#98d040', '#62a42c'], [[0.3, 0.85, 0.2, 0.09], [0.55, 0.55, 0.19, 0.08], [0.8, 0.28, 0.17, 0.07]], 501);
    // spit glob: impasto green with a dark contour and a pale ridge
    SM.shot = [0, 1].map((i) => mk(12, 11, 6, 5.5, (ctx) => {
      const r = U.rng(600 + i);
      const P = blob(0, 0, 4.4, 3.7, 26, 0.06, r).map((p) => [p[0] * (p[0] > 0 ? 1 + 0.1 * (p[0] / 4.4) : 1), p[1]]);
      paint(ctx, P, r, {
        base: TOX[2], sp: 0.9, len: 2.2, wid: 1.0, jit: 0.2,
        col: (x, y, rr) => rampPick(TOX, 4.0 - x * 0.25 - y * 0.45 + (rr.next() - 0.5) * 1.0),
        ang: (x, y) => Math.atan2(y, x) + Math.PI / 2,
        edge: { col: H('#081404'), w: 0.9, l: 1.8 },
      });
      stroke(ctx, -1.4, -1.5, -0.4, 2.4, 1.1, H('#f4ffd0'), r, { hi: 0.7, bend: 0 });
    }, 5));
    SM.drop = mk(5, 5, 2.5, 2.5, (ctx) => {
      const r = U.rng(650);
      stroke(ctx, 0, 0, 0.3, 2.6, 2.2, TOX[3], r, { hi: 0.5 });
      ctx.lineWidth = 0.35; ctx.strokeStyle = '#081404'; ctx.beginPath(); ctx.ellipse(0, 0, 1.5, 1.2, 0.3, 0, TAU); ctx.stroke();
    }, 5);
    SM.star = mk(8, 8, 4, 4, (ctx) => {
      const r = U.rng(660);
      for (let i = 0; i < 4; i++) stroke(ctx, 0, 0, (i * Math.PI) / 4, i & 1 ? 4 : 7, i & 1 ? 1 : 1.5, H(i & 1 ? '#ffe070' : '#fff6c8'), r, { bend: 0 });
    }, 5);
    SM.spark = SM.star;
  }

  /* ---------- background painting of the rest (one frame every ~50 ms) ---------- */
  function warmUp(art) {
    const jobs = [];
    for (let p = 0; p < 4; p++) {
      jobs.push(['spitter', { mode: 'move' }, (p + 0.5) / 0.75]);
      jobs.push(['bomber', {}, (p + 0.5) / 1.05]);
      jobs.push(['charger', { mode: 'chase' }, (p + 0.5) / 0.75]);
      jobs.push(['mother', {}, (p + 0.5) / 0.45]);
      jobs.push(['sprout', { seed: 0.1 }, (p + 0.5) / 1.2]);
      jobs.push(['sprout', { seed: 0.6 }, (p + 0.5) / 1.2]);
    }
    const later = [];
    for (const lv of [1, 2, 3]) later.push(['spitter', { mode: 'aim', charge: (lv - 0.5) / 3 }, 0]);
    for (const m of ['tele', 'dash', 'rest']) for (let i = 0; i < 2; i++) later.push(['charger', { mode: m, modeT: 0.3, dashX: 1, dashY: 0, _i: i }, 0]);
    const cv2 = U.canvas(64, 64).ctx;
    let n = 0;
    const run = (job) => {
      const [type, extra, anim] = job;
      let rt = 2000 + (n++) * 2 + 0.001;
      if (extra._i !== undefined) rt += extra.mode === 'tele' ? extra._i / 9 : extra.mode === 'dash' ? extra._i / 16 : extra._i / 5;
      const view = { rt, t: rt, S: 3, pixel: false };
      const e = Object.assign({ x: 0, y: 0, r: 9, facing: 1, anim, seed: 0, spawnT: 1, flash: 0, dying: false, deathT: 0, vx: 0, vy: 0, type }, extra);
      FORCE = true;
      try { art.enemies[type].call(art, cv2, e, view, null); } catch (err) { /* the real draw reports */ }
      FORCE = false;
    };
    // first poses now, the rest in the background
    const now = jobs.filter((j, i) => ((i / 6) | 0) % 2 === 0); // walk poses 0 + 2 right away (≈150 ms)
    const rest = jobs.filter((j) => now.indexOf(j) < 0).concat(later); // the rest in the background
    for (const j of now) run(j);
    const step = () => { if (!rest.length) return; run(rest.shift()); setTimeout(step, 50); };
    setTimeout(step, 200);
  }

  /* ---------- icons (100×100, halo behind on the big card version, like the style's) ---------- */
  function iconHalo(ctx, r) {
    const cols = hexes(['#ffe070', '#f0a030', '#fff6c8']);
    for (const [R, a] of [[30, 0.45], [40, 0.3], [47, 0.18]]) {
      const n = Math.round((TAU * R) / 9);
      for (let k = 0; k < n; k++) {
        const t = (k / n) * TAU;
        stroke(ctx, 50 + Math.cos(t) * R, 50 + Math.sin(t) * R, t + Math.PI / 2 + 0.15, 9, 3.2, cols[k % 3], r, { a });
      }
    }
  }
  function iconTurnip(ctx, r, cx, cy, s) {
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i - 1) * 0.55;
      stroke(ctx, cx + Math.cos(a) * 12 * s, cy - 18 * s + Math.sin(a) * 12 * s, a, 18 * s, 6 * s, LEAF[1 + (i & 1)], r);
    }
    const P = [];
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * TAU, sn = Math.sin(a);
      P.push([cx + Math.cos(a) * 20 * s * (sn > 0 ? 1 - 0.35 * sn * sn : 1), cy + sn * 19 * s * (sn > 0 ? 1 + 0.3 * sn * sn * sn : 1)]);
    }
    paint(ctx, P, r, {
      base: VIO[0][2], sp: 4.2 * s, len: 9 * s, wid: 3.8 * s,
      col: (x, y, rr) => (y + (rr.next() - 0.5) * 6 * s < cy + 1 ? rampPick(VIO[0], 2.5 - (x - cx) / (12 * s) + (rr.next() - 0.5)) : rampPick(CREAM[0], 2.5 - (x - cx) / (12 * s) + (rr.next() - 0.5))),
      ang: (x, y) => Math.atan2(x - cx, -(y - cy)) * 0.6,
      edge: { col: H('#1d1036'), w: 3.2 * s, l: 9 * s },
    });
    for (const sd of [-1, 1]) stroke(ctx, cx + sd * 6 * s, cy - 2 * s, sd * 0.35, 6 * s, 3.4 * s, H('#ffcf40'), r, { bend: 0, hi: 0.5 });
  }
  function iconSeed(ctx, r, cx, cy, s, rot) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(s, s);
    const P = blob(0, 0, 15, 9.5, 24, 0.02, r).map((p) => [p[0], p[1] * (p[0] > 0 ? 1 - 0.4 * (p[0] / 15) : 1)]);
    paint(ctx, P, r, {
      base: H('#e8d4a0'), sp: 3.6, len: 9, wid: 3.6,
      col: (x, y, rr) => rampPick(hexes(['#b0884a', '#d8bc84', '#f0e0b4', '#fff6dc']), 2 - y * 0.15 + (rr.next() - 0.5)),
      ang: () => 0, edge: { col: H('#3a2410'), w: 3, l: 8 },
    });
    ctx.restore();
  }
  function iconPumpkin(ctx, r, cx, cy, rx, ry, face) {
    const head = [];
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * TAU;
      const k = 1 + 0.035 * Math.abs(Math.sin(a * 3.5));
      head.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    seg(ctx, cx + 1, cy - ry + 3, cx + 5, cy - ry - 8, 5, H('#4f6a26'), r);
    paint(ctx, head, r, {
      base: ORANGE[2], sp: rx * 0.16, len: rx * 0.42, wid: rx * 0.17, jit: 0.12,
      col: (x, y, rr) => rampPick(ORANGE, 2.6 - (x - cx) / rx * 1.5 - (y - cy) / ry * 1.3 + (rr.next() - 0.5) * 1.3),
      ang: (x, y) => { const dx = (x - cx) / rx, dy = (y - cy) / ry; return Math.atan2(1, -dx * dy * 1.6); },
      edge: { col: PRUSSIAN, w: rx * 0.13, l: rx * 0.36 },
    });
    for (const kx of [-0.6, 0, 0.6]) {
      const pts = [];
      for (let t = -0.8; t <= 0.81; t += 0.4) pts.push([cx + kx * rx * Math.sqrt(1 - t * t), cy + t * ry]);
      polyStroke(ctx, pts, rx * 0.08, rx * 0.3, U.mul(ORANGE[1], 0.85), r, { a: 0.85 });
    }
    if (face) {
      const s = rx / 9;
      carved(ctx, tri(cx - 3 * s, cy - 1.6 * s, 1.8 * s, 1.25), r);
      carved(ctx, tri(cx + 3 * s, cy - 1.6 * s, 1.8 * s, 1.25), r);
      carved(ctx, [[-4.7, -0.2], [-3.4, 0.6], [-2.4, -0.2], [-1.2, 0.7], [0, -0.1], [1.2, 0.7], [2.4, -0.2], [3.4, 0.6], [4.7, -0.2], [3.8, 1.9], [1.6, 2.9], [-1.6, 2.9], [-3.8, 1.9]].map((p) => [cx + p[0] * s, cy + 2.4 * s + p[1] * s]), r);
    }
  }
  function paintIconImpl(ctx, id, big) {
    const r = U.rng(id.length * 131 + id.charCodeAt(0) * 7 + (big ? 3 : 0));
    if (big) iconHalo(ctx, r);
    switch (id) {
      case 'leech': {
        for (let i = 0; i < 2; i++) for (let k = 0; k < 3; k++) stroke(ctx, 36 + i * 14 + Math.sin(k * 1.4 + i) * 4, 34 - k * 9, -Math.PI / 2 + Math.sin(k + i) * 0.6, 9, 3, H('#e8eef4'), r, { a: 0.8 - k * 0.15 });
        const HP = [];
        for (let i = 0; i < 36; i++) { const t = (i / 36) * TAU, sn = Math.sin(t); HP.push([76 + 16 * sn * sn * sn * 0.95, 26 - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.95]); }
        paint(ctx, HP, r, {
          base: H('#a8201a'), sp: 3.2, len: 7.5, wid: 3.4,
          col: (x, y, rr) => rampPick(hexes(['#7a1410', '#a8201a', '#d0341e', '#ea5a2a', '#f68a4a']), 2.6 - (x - 76) / 9 - (y - 22) / 11 + (rr.next() - 0.5)),
          ang: (x, y) => Math.atan2(y - 26, x - 76) + Math.PI / 2, edge: { col: H('#1a1030'), w: 3, l: 7 },
        });
        const P = spline([[10, 52], [50, 50], [90, 52], [84, 72], [66, 86], [34, 86], [16, 72]], 4);
        paint(ctx, P, r, {
          base: COAT[1], sp: 4.5, len: 11, wid: 4.4,
          col: (x, y, rr) => rampPick(COAT, 2.8 - (x - 50) / 16 + (rr.next() - 0.5) * 1.4),
          ang: (x, y) => Math.atan2(y - 40, x - 50) + Math.PI / 2, edge: { col: PRUSSIAN, w: 3.6, l: 9 },
        });
        const T = blob(50, 52, 38, 7, 26, 0.03, r);
        paint(ctx, T, r, {
          base: ORANGE[3], sp: 4, len: 10, wid: 3.6,
          col: (x, y, rr) => rampPick(ORANGE, 3.4 - (x - 50) / 22 + (rr.next() - 0.5) * 1.2),
          ang: () => 0.1, edge: { col: H('#5a2008'), w: 2.4, l: 7 },
        });
        iconSeed(ctx, r, 40, 51, 0.36, -0.3); iconSeed(ctx, r, 62, 52, 0.32, 0.4);
        break;
      }
      case 'thorns': {
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * TAU + 0.13;
          seg(ctx, 50 + Math.cos(a) * 24, 54 + Math.sin(a) * 24, 50 + Math.cos(a) * 46, 54 + Math.sin(a) * 46, 7.5, DARKC, r, { hi: 0.05 });
          seg(ctx, 50 + Math.cos(a) * 25, 54 + Math.sin(a) * 25, 50 + Math.cos(a) * 43, 54 + Math.sin(a) * 43, 5.2, i & 1 ? COLU[4] : COLU[3], r, { hi: 0.35 });
        }
        for (let k = 0; k < 16; k++) { const t = (k / 16) * TAU; stroke(ctx, 50 + Math.cos(t) * 25, 54 + Math.sin(t) * 25, t + Math.PI / 2, 11, 5, k & 1 ? COLU[2] : COLU[1], r); }
        iconTurnip(ctx, r, 50, 58, 0.95);
        break;
      }
      case 'dashup': {
        for (const [y, l] of [[38, 34], [54, 42], [70, 32]]) for (let k = 0; k < 3; k++) stroke(ctx, 8 + l * 0.5 - k * 6, y + (k - 1) * 1.2, 0, l * (0.9 - k * 0.2), 4.4 - k * 0.9, H(['#f0a030', '#ffd84a', '#fff0a8'][k]), r, { a: 0.95 });
        for (let i = 0; i < 7; i++) { const t = -2.5 + i * 0.27; stroke(ctx, 60 + Math.cos(t) * 36, 58 + Math.sin(t) * 36, t + Math.PI / 2, 9, 3.6, H(i & 1 ? '#ffe070' : '#f0a030'), r); }
        ctx.save(); ctx.translate(60, 60); ctx.rotate(0.45); ctx.translate(-60, -60);
        iconPumpkin(ctx, r, 60, 60, 24, 20, true);
        ctx.restore();
        break;
      }
      case 'range': {
        for (let i = 0; i < 9; i++) {
          const t = 0.04 + (i / 8) * 0.82, x = 10 + t * 64, y = 90 - Math.sin(t * Math.PI * 0.85) * 66 - t * 6;
          stroke(ctx, x, y, -Math.cos(t * Math.PI * 0.85) * 1.1, 6, 4, H(i & 1 ? '#ffe070' : '#f0a030'), r, { a: 0.95 });
        }
        for (const [R, pal] of [[20, REDS], [14, CREAM[0]], [8.5, REDS], [3.5, CREAM[0]]]) {
          const P = blob(76, 74, R, R * 0.86, 28, 0.02, r);
          paint(ctx, P, r, { base: pal[2], sp: 3.2, len: 6, wid: 3, col: (x, y, rr) => rampPick(pal, 2.8 - (x - 76) / 14 + (rr.next() - 0.5)), ang: (x, y) => Math.atan2(y - 74, x - 76) + Math.PI / 2 });
        }
        contour(ctx, blob(76, 74, 20, 17.2, 28, 0.02, r), r, { col: H('#1a1030'), w: 3, l: 7 });
        iconSeed(ctx, r, 70, 30, 1.1, 0.35);
        break;
      }
      default: break;
    }
  }
  const ICON_CACHE = {};

  const KCOLS = {
    spitter: ['green', 'violet', 'cream', 'green', 'plum'],
    bomber: ['red', 'plum', 'orange', 'red'],
    charger: ['cream', 'umber', 'umber', 'yellow'],
    mother: ['violet', 'cream', 'red', 'gold', 'plum'],
    sprout: ['violet', 'cream', 'green'],
  };
  const KH = { spitter: 11, bomber: 9, charger: 11, mother: 20, sprout: 6 };

  CT.art('vangogh', {
    init() {
      buildSmall();
      warmUp(this);
    },
    enemies: {
      spitter(ctx, e, view) {
        let s, o = {};
        if (e.mode === 'aim' && !e.dying) {
          const lv = Math.min(3, 1 + Math.floor((e.charge || 0) * 3));
          s = frame('spitter', 'a' + lv, Object.assign(walkPose(0), { leg: 0, bob: 0, tilt: 0, c: lv / 3 }), 1100 + lv, view);
          o.dx = Math.sin(view.rt * 70 + e.seed * 9) * 0.35 * e.charge;
        } else {
          const p = pIdx(e.anim, 0.75);
          s = frame('spitter', 'w' + p, walkPose(p), 1000 + p, view);
          const k = e.spit || 0;
          if (k > 0) { o.sx = 1 + 0.16 * k; o.sy = 1 - 0.13 * k; o.dx = -(e.facing < 0 ? -1 : 1) * 1.6 * k; }
        }
        const r = drawBody(ctx, e, s, view, o);
        if (!r) return;
        const f = e.facing < 0 ? -1 : 1;
        if (e.mode === 'aim') {
          const c = e.charge || 0, m = spitMouth(Math.min(3, 1 + Math.floor(c * 3)) / 3);
          const [mx, my] = at(e, r, m[0], m[1]);
          glowAt(ctx, SM.green, mx + (o.dx || 0), my, 5 + 8 * c, 0.3 + 0.65 * c);
          if (c > 0.3) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (c - 0.3) * 0.9; rotDraw(ctx, SM.halo, mx, my, view.rt * 3, 14 * c, 14 * c); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
        } else if (e.spit > 0) {
          const k = e.spit, m = spitMouth(0);
          const [mx, my] = at(e, r, m[0], m[1]);
          glowAt(ctx, SM.green, mx, my, 9 * k, 0.8 * k);
          ctx.globalAlpha = Math.min(1, k * 1.6);
          for (let i = 0; i < 5; i++) {
            const a = (i - 2) * 0.32 + (e.seed - 0.5) * 0.4, d = 2 + (1 - k) * (9 + i * 2.2), z = 0.6 + 0.3 * k;
            ctx.drawImage(SM.drop.c, mx + f * Math.cos(a) * d - 2.5 * z, my + Math.sin(a) * d - (1 - k) * 2 + (i % 2) * 1.2 - 2.5 * z, 5 * z, 5 * z);
          }
          ctx.globalAlpha = 1;
        }
      },
      bomber(ctx, e, view) {
        const p = pIdx(e.anim, e.armed ? 1.3 : 1.05);
        const wp = walkPose(p);
        const s = frame('bomber', 'w' + p, wp, 2000 + p, view);
        const o = { sc: scOf(e) * 0.98 };
        if (e.armed && !e.dying) {
          const fu = e.fuse || 0;
          const on = Math.sin(view.rt * (5 + fu * 22) * Math.PI + e.seed * 10) > 0;
          const pulse = 1 + 0.12 * fu + (on ? 0.05 : 0);
          o.sx = pulse; o.sy = pulse;
          o.hot = on ? 0.6 : 0;
          o.dx = Math.sin(view.rt * 80) * 0.5 * fu;
          if (on) glowAt(ctx, SM.red, e.x, e.y - 9, 13 + fu * 6, 0.35 + fu * 0.3);
        }
        const r = drawBody(ctx, e, s, view, o);
        if (!r) return;
        const fu = e.armed ? e.fuse || 0 : 0;
        const [tx, ty] = at(e, r, BOMB_TIP[0], BOMB_TIP[1] + wp.bob);
        const flick = 0.75 + 0.25 * Math.sin(view.rt * 31 + e.seed * 7);
        const X = tx + (o.dx || 0);
        glowAt(ctx, SM.glow, X, ty, (4 + fu * 8) * flick, 0.65 + fu * 0.35);
        const k = (0.6 + fu * 0.8) * flick;
        rotDraw(ctx, SM.spark.c, X, ty, view.rt * 9 + e.seed * 5, 8 * k, 8 * k);
      },
      charger(ctx, e, view) {
        const mode = e.dying ? 'chase' : e.mode || 'chase';
        const t = view.rt;
        let s, o = {};
        const f = e.facing < 0 ? -1 : 1;
        if (mode === 'tele') {
          const i = Math.floor(t * 9 + e.seed * 4) & 1;
          s = frame('charger', 't' + i, { ph: i * Math.PI, mode: 'tele' }, 3100 + i, view);
          const k = Math.min(1, (e.modeT || 0) / 0.72);
          o.dx = Math.sin(t * 75 + e.seed * 9) * (0.3 + 0.7 * k);
          o.dy = -Math.abs(Math.sin(t * 9)) * 0.6;
        } else if (mode === 'dash') {
          const i = Math.floor(t * 16) & 1;
          s = frame('charger', 'd' + i, { ph: i * Math.PI * 0.5, mode: 'dash' }, 3200 + i, view);
          o.sx = 1.1; o.sy = 0.93;
          const dx = e.dashX || f, dy = e.dashY || 0, sc = scOf(e);
          for (let k2 = 3; k2 >= 1; k2--) { ctx.globalAlpha = 0.26 - k2 * 0.06; blit(ctx, s, e.x - dx * k2 * 7, e.y - dy * k2 * 7, f < 0, sc, null, 1.1, 0.93); }
          // impasto speed strokes
          const cols = ['#4a76cc', '#a2d0d2', '#f6aa3c'];
          for (let j = 0; j < 3; j++) {
            const oy = -7 - j * 6, ox = (t * 60 + j * 17) % 14;
            const x0 = e.x - dx * (10 + ox), y0 = e.y + oy - dy * (10 + ox);
            ctx.globalAlpha = 0.75;
            ctx.save(); ctx.translate(x0 - dx * 6, y0 - dy * 6); ctx.rotate(Math.atan2(dy, dx));
            ctx.fillStyle = cols[j]; ctx.beginPath(); ctx.ellipse(0, 0, 7 - j, 0.7, 0, 0, TAU); ctx.fill();
            ctx.restore();
          }
          ctx.globalAlpha = 1;
        } else if (mode === 'rest') {
          const i = Math.floor(t * 5 + e.seed * 3) % 2;
          s = frame('charger', 'r' + i, { ph: i * Math.PI, mode: 'rest' }, 3300 + i, view);
          o.dx = Math.sin(t * 7) * 0.8;
        } else {
          const p = pIdx(e.anim, 0.75);
          s = frame('charger', 'c' + p, { ph: (p / 4) * TAU, mode: 'chase' }, 3000 + p, view);
        }
        const r = drawBody(ctx, e, s, view, o);
        if (!r || !s.eye) return;
        if (mode === 'tele' || mode === 'dash') {
          const [ex, ey] = at(e, r, s.eye[0], s.eye[1]);
          glowAt(ctx, SM.red, ex + (o.dx || 0), ey + (o.dy || 0), mode === 'tele' ? 6 + 4 * Math.min(1, e.modeT / 0.72) : 6, 0.85);
          if (mode === 'tele') {
            const [hx, hy] = at(e, r, 9, 0);
            for (let j = 0; j < 3; j++) {
              const q = (t * 3 + j / 3) % 1;
              ctx.globalAlpha = 0.6 * (1 - q);
              ctx.fillStyle = j & 1 ? '#c8a860' : '#e8d4a0';
              ctx.beginPath(); ctx.ellipse(hx - f * q * 9 - f * j, hy - q * 4, 1.4 + q * 2.4, 0.9 + q * 1.4, 0.3, 0, TAU); ctx.fill();
            }
            ctx.globalAlpha = 1;
          }
        } else if (mode === 'rest') {
          const [hx, hy] = at(e, r, s.top[0], s.top[1]);
          for (let j = 0; j < 3; j++) {
            const a = t * 5 + (j / 3) * TAU, d = Math.sin(a), k = 0.85 + 0.25 * d;
            rotDraw(ctx, SM.star.c, hx + Math.cos(a) * 7.5, hy + d * 2.2, t * 2 + j, 7 * k, 7 * k);
          }
        }
      },
      mother(ctx, e, view) {
        const p = pIdx(e.anim, 0.45);
        const s = frame('mother', 'w' + p, walkPose(p), 4000 + p, view);
        const bb = e.dying ? 0 : e.birth || 0;
        const o = { sc: 0.96 + e.seed * 0.08 };
        if (bb > 0) {
          const w = Math.sin((1 - bb) * Math.PI * 3) * bb;
          o.sy = 1 + 0.16 * w; o.sx = 1 - 0.12 * w;
          glowAt(ctx, SM.lilac, e.x, e.y - 20, 26 + 8 * (1 - bb), bb * 0.7);
        }
        const r = drawBody(ctx, e, s, view, o);
        if (!r || bb <= 0.05) return;
        const [hx, hy] = at(e, r, 1, -43);
        ctx.globalAlpha = Math.min(1, bb * 2);
        for (let j = 0; j < 4; j++) {
          const a = -Math.PI / 2 + (j - 1.5) * 0.7, d = (1 - bb) * 14 + 4;
          rotDraw(ctx, SM.star.c, hx + Math.cos(a) * d, hy + Math.sin(a) * d * 0.8, j, 6, 6);
        }
        ctx.globalAlpha = 1;
      },
      sprout(ctx, e, view) {
        const v = e.seed < 0.5 ? 0 : 1, p = pIdx(e.anim, 1.2);
        const s = frame('sprout' + v, 'w' + p, walkPose(p), 5000 + v * 10 + p, view);
        drawBody(ctx, e, s, view, { sc: 0.95 + e.seed * 0.1 });
      },
    },
    onKill(game, e) {
      const cols = KCOLS[e.type];
      if (!cols) return false;
      const h = KH[e.type] || 11, big = e.type === 'mother', small = e.type === 'sprout';
      for (let i = 0, n = big ? 16 : small ? 5 : 9; i < n; i++) {
        const a = Math.random() * TAU, sp = (big ? 95 : 75) * (0.35 + Math.random() * 0.8);
        game.addParticle({
          x: e.x, y: e.y, z: h, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.65, vz: 30 + Math.random() * 80, grav: 260,
          life: 0.8 + Math.random() * 0.7, size: (big ? 2.4 : small ? 1.3 : 1.8) * (0.6 + Math.random() * 0.8), kind: 'dab',
          col: cols[(Math.random() * cols.length) | 0], drag: 1.6, rot: a, vr: (Math.random() - 0.5) * 14, v: (Math.random() * 3) | 0,
        });
      }
      game.addParticle({ x: e.x, y: e.y, kind: 'swirl', col: big ? 'colossus' : 'creeper', life: big ? 0.9 : 0.6, size: big ? 24 : small ? 9 : 14, drag: 0, rot: Math.random() * TAU });
    },
    shot(ctx, s, view) {
      const y = s.y - s.z;
      const sp = Math.hypot(s.vx, s.vy) || 1, ux = s.vx / sp, uy = s.vy / sp;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.75 + 0.2 * Math.sin(view.rt * 14 + s.seed * 9);
      rotDraw(ctx, SM.halo, s.x, y, view.rt * 2.5 + s.seed * 6, 24, 24);
      ctx.globalAlpha = 0.6; ctx.drawImage(SM.green, s.x - 9, y - 9, 18, 18);
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 1; i <= 3; i++) {
        ctx.globalAlpha = 0.9 - i * 0.2;
        const k = 1 - i * 0.2;
        ctx.drawImage(SM.drop.c, s.x - ux * i * 4.6 - 2.5 * k + Math.sin(s.age * 20 + i) * 0.5, y - uy * i * 4.6 - 2.5 * k, 5 * k, 5 * k);
      }
      ctx.globalAlpha = 1;
      const wob = 1 + 0.1 * Math.sin(view.rt * 18 + s.seed * 10);
      const fr = SM.shot[(Math.floor(view.rt * 6 + s.seed * 5)) & 1];
      ctx.save(); ctx.translate(s.x, y); ctx.rotate(Math.atan2(uy, ux)); ctx.scale(wob, 2 - wob);
      ctx.drawImage(fr.c, -fr.ax, -fr.ay, fr.w, fr.h);
      ctx.restore();
    },
    icons: (() => {
      const out = {};
      for (const id of ['leech', 'thorns', 'dashup', 'range']) {
        out[id] = function (ctx, size) {
          const key = id + ':' + size;
          let c = ICON_CACHE[key];
          if (!c) {
            const { c: cc, ctx: x } = cv(size, size);
            x.scale(size / 100, size / 100);
            paintIconImpl(x, id, size >= 90);
            c = ICON_CACHE[key] = gpuc(cc);
          }
          ctx.drawImage(c, 0, 0);
        };
      }
      return out;
    })(),
  });
})();
