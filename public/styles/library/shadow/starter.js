/* Shadow Theatre — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   Core trick: the GROUND is the light (glowing colour fields: teal → violet → crimson → amber, joined by thin ink
   seams), everything standing is a flat indigo-black cut-paper silhouette. The only colour on a silhouette is
   emissive (carved faces, eyes, cracks), plus a baked rim of light. Ghost creatures invert the rule: pale glowing veils. */
(function (root) {
  'use strict';
  const PALETTE = {
    ink: '#0b0510', lace: '#16081c', teal: '#76ccc6', tealEdge: '#2c748c', violet: '#b682dc', violetEdge: '#6840a2',
    crimson: '#f26a52', crimsonEdge: '#b02a42', amber: '#ffc662', amberEdge: '#ea7a2c', hot: '#fff0c4',
    faceCore: '#fffbe2', face: '#ffd65e', faceEdge: '#ff6a10', eye: '#d8ff62', crack: '#ff5ad2',
    ghost: '#dcefff', ghostHollow: '#1c0f36', gem: '#3fe0d8', gold: '#ffd98a', curtain: '#2a0a20',
  };
  const INK = PALETTE.ink, TAU = Math.PI * 2;
  let K = 3; // sprite pixels per world unit (set from the canvas height in draw())

  /* ---------- noise (gradient noise + fbm + domain warp, same maths as the module) ---------- */
  function hashInt(x, y, s) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return h >>> 0; }
  const GR = []; for (let i = 0; i < 16; i++) GR.push(Math.cos(i / 16 * TAU), Math.sin(i / 16 * TAU));
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const gd = (ix, iy, s, dx, dy) => { const g = (hashInt(ix, iy, s) & 15) * 2; return GR[g] * dx + GR[g + 1] * dy; };
  function perlin(x, y, s) {
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, u = fade(fx), v = fade(fy);
    const a = gd(x0, y0, s, fx, fy), b = gd(x0 + 1, y0, s, fx - 1, fy), c = gd(x0, y0 + 1, s, fx, fy - 1), d = gd(x0 + 1, y0 + 1, s, fx - 1, fy - 1);
    const p = a + u * (b - a), q = c + u * (d - c); return (p + v * (q - p)) * 1.414;
  }
  function fbm(x, y, s, oct) { let a = 1, f = 1, t = 0, n = 0; for (let i = 0; i < oct; i++) { t += a * perlin(x * f, y * f, s + i * 101); n += a; a *= 0.5; f *= 2; } const r = t / n * 0.5 + 0.5; return r < 0 ? 0 : r > 1 ? 1 : r; }
  function warped(x, y, s, w, oct) { const qx = fbm(x, y, s + 17, 3) - 0.5, qy = fbm(x + 5.2, y + 1.3, s + 31, 3) - 0.5; return fbm(x + w * qx * 2, y + w * qy * 2, s, oct); }
  const sstep = (a, b, x) => { let t = (x - a) / (b - a); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
  function rng(seed) { let a = seed >>> 0; return { next() { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; } }; }
  const R = (a, b, r) => a + (b - a) * r.next();
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return { c, ctx: c.getContext('2d') }; };

  /* ---------- cut-paper toolkit ---------- */
  function spline(p, sub) { const o = []; for (let i = 0; i < p.length - 1; i++) { const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p[i + 1];
    for (let k = 0; k < sub; k++) { const t = k / sub, t2 = t * t, t3 = t2 * t; o.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3))); } }
    o.push(p[p.length - 1]); return o; }
  /** Tapered filled stroke (width w0 → w1) along a Catmull-Rom-smoothed polyline: the basic cut-paper limb. */
  function limb(c, pts, w0, w1, sub) {
    const s = pts.length > 2 ? spline(pts, sub || 5) : pts, n = s.length, L = [], Rt = [];
    for (let i = 0; i < n; i++) { const a = s[Math.max(0, i - 1)], b = s[Math.min(n - 1, i + 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      const w = (w0 + (w1 - w0) * (i / (n - 1))) * 0.5; L.push([s[i][0] - dy * w, s[i][1] + dx * w]); Rt.push([s[i][0] + dy * w, s[i][1] - dx * w]); }
    c.beginPath(); c.moveTo(L[0][0], L[0][1]); for (let i = 1; i < n; i++) c.lineTo(L[i][0], L[i][1]); for (let i = n - 1; i >= 0; i--) c.lineTo(Rt[i][0], Rt[i][1]); c.closePath(); c.fill();
    circ(c, s[0][0], s[0][1], w0 * 0.5); if (w1 > 0.3) circ(c, s[n - 1][0], s[n - 1][1], w1 * 0.5);
  }
  /** Spiral points that tighten towards the end – every tip in this style ends in such a curl. */
  function curlPts(x, y, a, len, turn, n) { n = n || 12; const p = [[x, y]]; let h = a; for (let i = 0; i < n; i++) { const t = i / n; h += turn * (0.25 + 1.75 * t) / n; const s = len / n * (1.35 - 0.85 * t); x += Math.cos(h) * s; y += Math.sin(h) * s; p.push([x, y]); } return p; }
  const curl = (c, x, y, a, len, turn, w0, w1) => limb(c, curlPts(x, y, a, len, turn), w0, w1 === undefined ? 0.1 : w1, 3);
  function leaf(c, x, y, a, L, W, bend) { bend = bend || 0; const ca = Math.cos(a), sa = Math.sin(a), mx = x + ca * L * 0.45, my = y + sa * L * 0.45, nx = -sa, ny = ca;
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(mx + nx * (W * 2 + bend), my + ny * (W * 2 + bend), x + ca * L, y + sa * L); c.quadraticCurveTo(mx - nx * (W * 2 - bend), my - ny * (W * 2 - bend), x, y); c.fill(); }
  function circ(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
  function ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); c.fill(); }
  function poly(c, p) { c.beginPath(); c.moveTo(p[0][0], p[0][1]); for (const q of p) c.lineTo(q[0], q[1]); c.closePath(); c.fill(); }
  function star(c, x, y, n, r0, r1, rot) { c.beginPath(); for (let i = 0; i < n * 2; i++) { const a = rot + i / (n * 2) * TAU - Math.PI / 2, r = i & 1 ? r1 : r0; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); c.fill(); }
  /** Punch a hole through the paper (light shines through). */
  function cut(c, fn) { c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; fn(); c.restore(); }
  function pumpkinShape(c, cx, cy, rx, ry) { ell(c, cx - rx * 0.52, cy, rx * 0.5, ry * 0.92); ell(c, cx + rx * 0.52, cy, rx * 0.5, ry * 0.92); ell(c, cx - rx * 0.22, cy - ry * 0.02, rx * 0.52, ry); ell(c, cx + rx * 0.22, cy - ry * 0.02, rx * 0.52, ry); }
  /** Emissive fill: radial gradient + baked bloom (shadowBlur pass, then a sharp pass on top). */
  function glowFill(c, path, cx, cy, r, stops, bloom, bloomCol) {
    c.save(); const g = c.createRadialGradient(cx, cy, 0, cx, cy, r); stops.forEach((s) => g.addColorStop(s[0], s[1])); c.fillStyle = g;
    c.shadowColor = bloomCol; c.shadowBlur = bloom * K; c.beginPath(); path(c); c.fill(); c.shadowBlur = 0; c.beginPath(); path(c); c.fill(); c.restore();
  }
  const FACE = [[0, '#fffbe2'], [0.35, '#ffd65e'], [0.75, '#ff9a22'], [1, '#ff6a10']];

  /* ---------- sprite pipeline: bake once at K px/unit, blit in world units ---------- */
  function mk(x0, y0, x1, y1, draw, pad) {
    pad = pad === undefined ? 2.5 : pad; const ax = Math.round((pad - x0) * K), ay = Math.round((pad - y0) * K);
    const { c, ctx } = canvas((x1 - x0 + pad * 2) * K, (y1 - y0 + pad * 2) * K);
    ctx.setTransform(K, 0, 0, K, ax, ay); ctx.lineCap = ctx.lineJoin = 'round'; ctx.fillStyle = ctx.strokeStyle = INK; draw(ctx); return { c, ax, ay };
  }
  function tint(src, col) { const { c, ctx } = canvas(src.width, src.height); ctx.drawImage(src, 0, 0); ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = col; ctx.fillRect(0, 0, c.width, c.height); return c; }
  function flip(s) { const { c, ctx } = canvas(s.c.width, s.c.height); ctx.translate(c.width, 0); ctx.scale(-1, 1); ctx.drawImage(s.c, 0, 0); return { c, ax: c.width - s.ax, ay: s.ay }; }
  /** Rim of light: tinted silhouette stamped 8× around a circle (d = rad·K·0.55), blurred by the same radius + a 60 % sharp copy. */
  function rimSpr(s, color, rad) {
    const t = tint(s.c, color), tmp = canvas(s.c.width, s.c.height), d = Math.max(1, rad * K * 0.55);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; tmp.ctx.drawImage(t, Math.cos(a) * d, Math.sin(a) * d); }
    const o = canvas(s.c.width, s.c.height); o.ctx.filter = 'blur(' + d.toFixed(1) + 'px)'; o.ctx.drawImage(tmp.c, 0, 0); o.ctx.filter = 'none'; o.ctx.globalAlpha = 0.6; o.ctx.drawImage(tmp.c, 0, 0);
    return { c: o.c, ax: s.ax, ay: s.ay };
  }
  function blurInto(dst, src, px, alpha, color) { dst.save(); dst.globalAlpha = alpha; dst.filter = 'blur(' + px.toFixed(1) + 'px)'; dst.drawImage(color ? tint(src, color) : src, 0, 0); dst.restore(); }
  function glowSpr(r, stops) { const px = Math.ceil(r * K * 2), { c, ctx } = canvas(px, px), g = ctx.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2); stops.forEach((s) => g.addColorStop(s[0], s[1])); ctx.fillStyle = g; ctx.fillRect(0, 0, px, px); return { c, ax: px / 2, ay: px / 2 }; }
  function blit(ctx, s, x, y, sx, sy, rot) { ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale((sx || 1) / K, (sy || sx || 1) / K); ctx.drawImage(s.c, -s.ax, -s.ay); ctx.restore(); }
  function add(ctx, s, x, y, alpha, sx, sy, rot) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = alpha; blit(ctx, s, x, y, sx, sy, rot); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }

  /* ---------- characters (all facing +x, feet at 0,0, y up = negative) ---------- */
  function drawJack(c, ph, moving) { // main character: slim puppet with a pumpkin head, jagged cloak and streaming scarf
    const s = Math.sin(ph * TAU), co = Math.cos(ph * TAU), bob = moving ? -Math.abs(co) * 0.9 : s * 0.35, hipY = -8.6 + bob, sh = -16.2 + bob;
    const leg = (side) => { const sw = moving ? s * side : 0, thA = Math.PI / 2 - sw * 0.6, hx = side * 1.2 + 0.3, kx = hx + Math.cos(thA) * 4.2, ky = hipY + Math.sin(thA) * 4.2;
      const shA = thA + (moving ? 0.12 + 0.55 * Math.max(0, Math.sin(ph * TAU + side * 1.4)) : 0.04), fx = kx + Math.cos(shA) * 4.4, fy = Math.min(0, ky + Math.sin(shA) * 4.4);
      limb(c, [[hx, hipY], [kx, ky], [fx, fy]], 1.15, 0.9); limb(c, [[fx - 0.7, fy - 0.6], [fx + 1.0, fy - 0.1], [fx + 2.3, fy - 0.5]], 1.4, 0.7); curl(c, fx + 2.2, fy - 0.5, -0.5, 2.2, -5.5, 0.55, 0.12); };
    const arm = (sx, sy, ua, bend, w) => { const ex = sx + Math.cos(ua) * 3.4, ey = sy + Math.sin(ua) * 3.4, hx = ex + Math.cos(ua - bend) * 3.2, hy = ey + Math.sin(ua - bend) * 3.2; limb(c, [[sx, sy], [ex, ey], [hx, hy]], w, w * 0.75); circ(c, hx, hy, w * 0.82); };
    const swA = moving ? -s * 0.7 : 0.1;
    leg(-1); arm(-1.6, sh + 0.8, Math.PI / 2 + swA * 0.8 + 0.15, 0.5, 1.0); leg(1);
    const hemY = -7.4 + bob, trail = moving ? -2.2 + s * 0.4 : -0.5 + s * 0.3, backX = -6.4 + trail; // cloak with jagged hem
    c.beginPath(); c.moveTo(-3.2, sh); c.lineTo(3.4, sh); c.quadraticCurveTo(5.0, sh + 4.5, 5.6, hemY - 0.4);
    for (let k = 1; k <= 7; k++) c.lineTo(5.6 + (backX - 5.6) * (k / 7), hemY + (k & 1 ? 1.3 : -0.7) + (moving ? Math.sin(ph * TAU * 2 + k) * 0.3 - k / 7 * 1.4 : 0));
    c.quadraticCurveTo(-5.4 + trail * 0.5, sh + 3.4, -3.2, sh); c.closePath(); c.fill();
    curl(c, backX + 0.4, hemY - 1.2, Math.PI + 0.3, 1.8, 5.5, 0.5, 0.1);
    ell(c, 0.4, sh - 0.9, 3.5, 1.3); const w1 = Math.sin(ph * TAU * 2) * 0.9, w2 = Math.cos(ph * TAU * 2 + 0.6) * 0.9; // scarf
    if (moving) { limb(c, [[-2.4, sh - 0.9], [-5.6, sh - 0.4 + w1], [-8.8, sh - 1.2 + w2], [-11.6, sh + 0.2 + w1]], 1.6, 0.5); limb(c, [[-2.2, sh - 0.4], [-4.8, sh + 1.0 + w2], [-7.4, sh + 0.8 - w1]], 1.1, 0.4); }
    else { limb(c, [[-2.4, sh - 0.8], [-3.6 + w1 * 0.3, sh + 2.0], [-4.0 + w2 * 0.4, sh + 4.6]], 1.6, 0.8); }
    arm(2.6, sh + 0.6, Math.PI / 2 - swA * 0.9 - 0.25, 0.6, 1.1);
    const cx = 0.8, cy = -22.4 + (moving ? -Math.abs(Math.cos(ph * TAU - 0.4)) * 0.9 : Math.sin(ph * TAU - 0.4) * 0.4); // pumpkin head
    pumpkinShape(c, cx, cy, 6.8, 5.4); limb(c, [[cx - 0.1, cy - 4.6], [cx - 0.6, cy - 6.8], [cx - 1.9, cy - 8.0]], 1.5, 0.9);
    leaf(c, cx + 0.1, cy - 5.6, -0.45, 4.2, 1.0, 0.4); curl(c, cx - 1.6, cy - 7.4, Math.PI + 0.4, 4.6, 6.0, 0.45, 0.1);
    glowFill(c, (p) => { // carved face – the brightest thing on screen
      for (const t of [[[cx - 1.9, cy - 0.5], [cx + 0.3, cy - 3.1], [cx + 1.1, cy - 0.3]], [[cx + 2.4, cy - 0.4], [cx + 3.5, cy - 3.0], [cx + 5.4, cy - 0.7]], [[cx + 1.2, cy + 0.6], [cx + 1.9, cy - 0.5], [cx + 2.6, cy + 0.6]]]) { p.moveTo(t[0][0], t[0][1]); p.lineTo(t[1][0], t[1][1]); p.lineTo(t[2][0], t[2][1]); p.closePath(); }
      const ya = cy + 1.7; p.moveTo(cx - 2.9, ya - 0.3); p.lineTo(cx - 1.5, ya + 0.3); p.lineTo(cx - 0.9, ya + 1.3); p.lineTo(cx - 0.2, ya + 0.4); p.lineTo(cx + 1.9, ya + 0.5); p.lineTo(cx + 2.6, ya + 1.5); p.lineTo(cx + 3.3, ya + 0.4); p.lineTo(cx + 5.7, ya - 0.4);
      p.quadraticCurveTo(cx + 4.6, ya + 3.6, cx + 1.4, ya + 3.8); p.lineTo(cx + 1.0, ya + 2.6); p.lineTo(cx + 0.4, ya + 3.7); p.quadraticCurveTo(cx - 2.0, ya + 3.2, cx - 2.9, ya - 0.3); p.closePath();
    }, cx + 1.4, cy + 0.6, 6, FACE, 1.6, 'rgba(255,150,40,0.95)');
  }
  function drawCreeper(c, ph, v) { // small creature: waddling purple root bulb with a filigree leaf crown
    const s = Math.sin(ph * TAU), by = -12.2 - Math.abs(Math.cos(ph * TAU)), rx = v ? 7.0 : 7.8, ry = v ? 7.6 : 7.0;
    for (const side of [-1, 1]) { const hx = side * 2.6, hy = by + ry - 1.6, ta = Math.PI / 2 - s * side * 0.6, kx = hx + Math.cos(ta) * 3.2, ky = hy + Math.sin(ta) * 3.2;
      const sa = ta + 0.2 + Math.max(0, Math.sin(ph * TAU + side * 1.3)) * 0.6, fx = kx + Math.cos(sa) * 3.3, fy = Math.min(0, ky + Math.sin(sa) * 3.3);
      limb(c, [[hx, hy], [kx, ky], [fx, fy]], 1.5, 0.9); curl(c, fx, fy - 0.4, -0.15, 2.6, -5, 0.8, 0.1); }
    limb(c, [[-2, by + ry - 1.5], [-4.6, by + ry + 0.6 + s * 0.4], [-7.4, by + ry - 0.2], [-8.6, by + ry - 2.4 - s * 0.5]], 2.2, 0.15);
    limb(c, curlPts(-rx + 1.2, by + 1, Math.PI * 0.85 + s * 0.3, 5, -3.5, 8), 0.9, 0.15, 3);
    ell(c, 0, by, rx, ry); ell(c, 0.2, by - ry + 0.6, 2.8, 2.0);
    limb(c, [[rx - 1.4, by + 3.4], [rx + 0.6, by + 4.8]], 0.6, 0.08); limb(c, [[-rx + 1.2, by + 3.6], [-rx - 0.8, by + 5.2]], 0.6, 0.08);
    limb(c, curlPts(rx - 1.4, by + 1.2, 0.35 - s * 0.35, 5.4, 4.2, 8), 1.0, 0.15, 3);
    (v ? [-0.95, -0.25, 0.45] : [-1.1, -0.45, 0.15, 0.75]).forEach((d, i) => {
      const pts = curlPts(0.2, by - ry - 0.6, -Math.PI / 2 + d + s * 0.12, (v ? 7.5 : 6.4) + (i & 1 ? 1.2 : 0), (d < -0.3 ? -1 : 1) * 1.6, 6); limb(c, pts, 1.0, 0.45, 3);
      const e = pts[pts.length - 1], e2 = pts[pts.length - 2], ea = Math.atan2(e[1] - e2[1], e[0] - e2[0]);
      leaf(c, e[0], e[1], ea, 4.2, 1.35, 0.3); leaf(c, pts[3][0], pts[3][1], ea - 1.0, 2.8, 0.9); leaf(c, pts[3][0], pts[3][1], ea + 1.0, 2.6, 0.85);
    });
    cut(c, () => { const mx = 2.6, my = by + 2.6; poly(c, [[mx - 2.6, my - 0.4], [mx - 1.6, my + 0.4], [mx - 1.0, my - 0.2], [mx - 0.2, my + 0.6], [mx + 0.5, my - 0.1], [mx + 1.3, my + 0.6], [mx + 2.2, my - 0.5], [mx + 1.4, my + 1.6], [mx - 1.6, my + 1.5]]); });
    glowFill(c, (p) => { const ey = by - 1.2; p.moveTo(-0.6, ey - 0.9); p.quadraticCurveTo(1.0, ey - 0.6, 2.2, ey + 0.4); p.quadraticCurveTo(0.6, ey + 1.2, -0.6, ey - 0.9); p.closePath();
      p.moveTo(6.0, ey - 1.1); p.quadraticCurveTo(4.6, ey - 0.6, 3.4, ey + 0.4); p.quadraticCurveTo(5.0, ey + 1.1, 6.0, ey - 1.1); p.closePath(); }, 2.8, by - 1, 4, [[0, '#ffffe0'], [0.4, '#d8ff62'], [1, '#7fe02a']], 1.3, 'rgba(170,255,70,0.95)');
  }
  function buildGhost(ph) { // fast creature: the inversion – a pale glowing veil with a dark halo + light halo
    const w = Math.sin(ph * TAU), w2 = Math.cos(ph * TAU);
    const veil = mk(-15, -25, 13.5, 0, (c) => {
      c.fillStyle = '#fff'; ell(c, 0.6, -17.4, 5.0, 5.6);
      c.beginPath(); c.moveTo(-4.3, -17.5); c.bezierCurveTo(-5.2, -12, -6.2 + w * 0.4, -9, -8.2 + w * 0.6, -6.6); c.lineTo(-4.4, -8.4); c.lineTo(-5.6 + w2 * 0.6, -4.2); c.lineTo(-2.4, -7.6);
      c.lineTo(-1.8 + w * 0.5, -3.6); c.lineTo(0.6, -7.6); c.lineTo(2.2, -6.2 + w2 * 0.4); c.lineTo(3.4, -9.2); c.bezierCurveTo(5.4, -11.6, 5.8, -14.6, 5.6, -17.4); c.closePath(); c.fill();
      curl(c, -7.6 + w * 0.6, -6.8, Math.PI * 0.82 + w * 0.15, 6.5, 3.8 + w2, 1.5, 0.12); curl(c, -5.0 + w2 * 0.6, -4.6, Math.PI * 0.7, 5.5, -3.6, 1.2, 0.1);
      for (const [sx, sy, ex, ey] of [[2.0, -12.4, 7.4, -10.8 + w2 * 0.5], [3.6, -13.8, 9.4, -13.6 + w * 0.7]]) { limb(c, [[sx, sy], [(sx + ex) / 2, sy + 1.2], [ex, ey]], 1.1, 0.5);
        for (let f = -1; f <= 1; f++) limb(c, [[ex, ey], [ex + 1.6, ey + f], [ex + 2.6, ey + f * 1.6 + 0.6]], 0.42, 0.08); }
      c.globalCompositeOperation = 'source-atop'; const g = c.createLinearGradient(0, -23, 0, -2); g.addColorStop(0, '#fbfdff'); g.addColorStop(0.55, '#dcefff'); g.addColorStop(1, '#a9d4ff'); c.fillStyle = g; c.fillRect(-20, -30, 40, 34);
      c.globalCompositeOperation = 'destination-in'; const a = c.createLinearGradient(0, -14, -6, -1); a.addColorStop(0, 'rgba(0,0,0,0.95)'); a.addColorStop(1, 'rgba(0,0,0,0.35)'); c.fillStyle = a; c.fillRect(-20, -30, 40, 34);
      c.globalCompositeOperation = 'source-over'; c.fillStyle = '#1c0f36'; ell(c, 1.7, -18.6, 1.05, 1.65, -0.15); ell(c, 4.6, -18.4, 0.95, 1.5, 0.15); ell(c, 3.3, -14.5, 1.25, 2.3, 0.08);
    }, 3);
    const { c, ctx } = canvas(veil.c.width, veil.c.height);
    blurInto(ctx, veil.c, 2.2 * K, 0.42, '#160828'); blurInto(ctx, veil.c, 1.4 * K, 0.95, '#d6f0ff'); ctx.drawImage(veil.c, 0, 0);
    return { c, ax: veil.ax, ay: veil.ay };
  }
  function drawColossus(c, ph) { // large creature: knobby root-bulb colossus, antler leaf crown, glowing magenta cracks + core
    const s = Math.sin(ph * TAU), by = -29 - Math.abs(Math.cos(ph * TAU)) * 1.2, as = -s * 0.25, r = rng(4242);
    for (const sd of [-1, 1]) { const fx = sd * 7.5 + s * sd * 2.2, fy = -Math.max(0, s * sd) * 3.6; limb(c, [[sd * 6.5, by + 11], [(sd * 6.5 + fx) / 2 + 1.6, (by + 11 + fy) / 2], [fx, fy - 1]], 5.4, 3.6);
      for (let t = -1; t <= 1; t++) limb(c, [[fx, fy - 1.2], [fx + t * 2.6 + 1, fy + 0.2], [fx + t * 4.2 + 1.6, fy - 0.2]], 1.6, 0.2); }
    limb(c, [[-11, by - 6], [-15.5 + as * 6, by + 5], [-15 + as * 10, by + 17], [-12.5 + as * 12, by + 23]], 4.6, 2.4);
    c.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU, k = 1 + 0.07 * Math.sin(a * 5 + 1.3) + 0.05 * Math.sin(a * 9 + 0.4) + (Math.sin(a) > 0.6 ? 0.04 : 0); c.lineTo(Math.cos(a) * 15 * k, by + Math.sin(a) * 14 * k); } c.fill();
    ell(c, 0.5, by - 13.5, 5.5, 3.5);
    for (let k = 0; k < 6; k++) { const x = -9 + k * 3.6 + R(-1, 1, r); limb(c, [[x, by + 10], [x + R(-2, 2, r) + s * 0.6, by + 15], [x + R(-3, 3, r), by + 18 + R(0, 3, r)]], 1.4, 0.1); }
    [-1.25, -0.6, 0.05, 0.6, 1.2].forEach((d, i) => { const pts = curlPts(0.5 + d * 3, by - 15, -Math.PI / 2 + d + s * 0.05, 12 + (i & 1) * 3, (d < 0 ? -1 : 1) * 1.2, 6); limb(c, pts, 2.6, 0.9, 3);
      const e = pts[6], e2 = pts[5], ea = Math.atan2(e[1] - e2[1], e[0] - e2[0]); leaf(c, e[0], e[1], ea, 6.5, 2.0, 0.6); leaf(c, pts[3][0], pts[3][1], ea - 1.1, 4.4, 1.3); leaf(c, pts[3][0], pts[3][1], ea + 1.1, 4.2, 1.3); });
    limb(c, [[11, by - 6], [16.5 - as * 6, by + 4], [16.5 - as * 10, by + 16], [14.5 - as * 12, by + 23]], 5.2, 2.6);
    for (let t = -1; t <= 1; t++) limb(c, [[14.5 - as * 12, by + 23], [15.5 - as * 12 + t * 2.4, by + 26], [16.8 - as * 12 + t * 3.2, by + 25.4]], 1.3, 0.15);
    c.save(); c.strokeStyle = '#ffb8f0'; c.shadowColor = 'rgba(255,70,210,1)'; c.shadowBlur = 1.6 * K;
    for (const [w, pts] of [[0.7, [[1, -3], [-2.5, -7], [-1.5, -10], [-4.8, -12.5]]], [0.65, [[1, -3], [5.5, -6.5], [9, -5.5], [12.5, -8.5]]], [0.6, [[2, 2], [-3, 5], [-7.5, 4], [-10.5, 7.5]]], [0.55, [[2, 2], [6, 7], [9.5, 8.2]]]]) {
      c.lineWidth = w; c.beginPath(); pts.forEach((p) => c.lineTo(p[0], by + p[1])); c.stroke(); }
    c.restore();
    glowFill(c, (p) => { p.moveTo(1.5, by - 4.2); p.lineTo(4.4, by - 0.4); p.lineTo(1.6, by + 3.6); p.lineTo(-1.3, by - 0.4); p.closePath(); }, 1.5, by - 0.3, 4.4, [[0, '#fff'], [0.35, '#ffc2f2'], [1, '#ff5ad2']], 2.2, 'rgba(255,60,200,1)');
    glowFill(c, (p) => { const ey = by - 8.5; p.moveTo(3.2, ey - 0.6); p.lineTo(7.6, ey + 0.6); p.lineTo(3.8, ey + 1.4); p.closePath(); p.moveTo(13.4, ey - 0.8); p.lineTo(9.2, ey + 0.6); p.lineTo(12.8, ey + 1.4); p.closePath(); }, 8, by - 8, 6, [[0, '#fff'], [0.4, '#ffd0f6'], [1, '#ff5ad2']], 1.4, 'rgba(255,70,210,1)');
  }
  function drawPumpkinProp(c) { // prop: lit carved gourd lantern on a curly vine
    limb(c, curlPts(-8, 0.4, 0.1, 12, 1.2, 8), 0.7, 0.2, 3); for (let l = -1; l <= 1; l++) leaf(c, -3, -0.6, -Math.PI / 2 + l * 0.7, 3.4 - Math.abs(l) * 0.6, 1.0);
    const cy = -4.8, k = 1; pumpkinShape(c, 0, cy, 6, 4.8); limb(c, [[0, cy - 4.2], [0.4, cy - 5.7], [1.4, cy - 6.9]], 1.1, 0.7);
    glowFill(c, (p) => { p.moveTo(-2.6 * k, cy - 0.4); p.lineTo(-1.3, cy - 2.4); p.lineTo(-0.4, cy - 0.3); p.closePath(); p.moveTo(0.4, cy - 0.3); p.lineTo(1.3, cy - 2.4); p.lineTo(2.6, cy - 0.4); p.closePath();
      p.moveTo(-3.2, cy + 1); p.lineTo(-2, cy + 1.5); p.lineTo(-1.3, cy + 0.9); p.lineTo(0, cy + 1.7); p.lineTo(1.3, cy + 0.9); p.lineTo(2, cy + 1.5); p.lineTo(3.2, cy + 1); p.quadraticCurveTo(0, cy + 4.6, -3.2, cy + 1); p.closePath(); }, 0, cy + 0.6, 4, FACE, 1.1, 'rgba(255,150,40,1)');
  }

  /* ---------- sprite cache (rebuilt when K changes) ---------- */
  let S = null;
  function sprites() {
    if (S && S.K === K) return S;
    S = { K, jack: [], jackR: [], creep: [[], []], creepR: [[], []], ghost: [], colo: [] };
    for (let i = 0; i < 6; i++) { const j = mk(-14, -33, 9, 1.5, (c) => drawJack(c, i / 6, true), 3); S.jack[i] = [j, flip(j)]; const r = rimSpr(j, '#ffb24a', 1.3); S.jackR[i] = [r, flip(r)]; }
    for (let v = 0; v < 2; v++) for (let i = 0; i < 6; i++) { const e = mk(-12, -30, 12, 1.5, (c) => drawCreeper(c, i / 6, v)); S.creep[v][i] = [e, flip(e)]; const r = rimSpr(e, '#fff6dc', 1.2); S.creepR[v][i] = [r, flip(r)]; }
    for (let i = 0; i < 4; i++) { const g = buildGhost(i / 4); S.ghost[i] = [g, flip(g)]; }
    for (let i = 0; i < 6; i++) { const e = mk(-21, -62, 23, 1.5, (c) => drawColossus(c, i / 6), 3); S.colo[i] = [e, flip(e)]; }
    S.pump = mk(-10, -12, 8, 2, drawPumpkinProp, 1.5);
    S.pool = glowSpr(30, [[0, 'rgba(255,214,140,0.55)'], [0.5, 'rgba(255,170,90,0.22)'], [1, 'rgba(255,120,60,0)']]);
    S.contact = glowSpr(10, [[0, 'rgba(14,5,20,0.55)'], [0.55, 'rgba(14,5,20,0.28)'], [1, 'rgba(14,5,20,0)']]);
    S.face = glowSpr(9, [[0, 'rgba(255,230,150,0.9)'], [0.4, 'rgba(255,160,50,0.35)'], [1, 'rgba(255,100,20,0)']]);
    S.gold = glowSpr(10, [[0, 'rgba(255,240,170,0.95)'], [0.3, 'rgba(255,200,90,0.45)'], [1, 'rgba(255,140,40,0)']]);
    S.pink = glowSpr(12, [[0, 'rgba(255,190,240,0.95)'], [0.3, 'rgba(255,80,210,0.45)'], [1, 'rgba(200,40,180,0)']]);
    S.cyan = glowSpr(6, [[0, 'rgba(230,255,255,1)'], [0.3, 'rgba(120,255,235,0.55)'], [1, 'rgba(40,200,220,0)']]);
    S.ember = glowSpr(3, [[0, 'rgba(255,250,215,1)'], [0.25, 'rgba(255,190,80,0.85)'], [0.6, 'rgba(255,110,30,0.25)'], [1, 'rgba(255,70,10,0)']]);
    S.gem = mk(-2, -3, 2, 1, (c) => { c.beginPath(); c.moveTo(0, -3.3); c.quadraticCurveTo(2.4, -0.6, 0, 1.2); c.quadraticCurveTo(-2.4, -0.6, 0, -3.3); c.fill();
      const g = c.createRadialGradient(0, -0.6, 0, 0, -0.6, 2); g.addColorStop(0, '#fff'); g.addColorStop(0.5, '#b8fff4'); g.addColorStop(1, '#3fe0d8'); c.fillStyle = g; c.beginPath(); c.moveTo(0, -2.5); c.quadraticCurveTo(1.6, -0.6, 0, 0.5); c.quadraticCurveTo(-1.6, -0.6, 0, -2.5); c.fill(); }, 0.6);
    S.seed = mk(-2.6, -1.6, 2.6, 1.6, (c) => { c.shadowColor = 'rgba(255,190,80,1)'; c.shadowBlur = 1.2 * K; const g = c.createLinearGradient(-2.4, 0, 2.4, 0); g.addColorStop(0, '#ffcf7a'); g.addColorStop(0.6, '#fff6d8'); g.addColorStop(1, '#fff'); c.fillStyle = g;
      c.beginPath(); c.moveTo(2.5, 0); c.quadraticCurveTo(0.4, -2.2, -2.2, -0.6); c.quadraticCurveTo(-2.7, 0, -2.2, 0.6); c.quadraticCurveTo(0.4, 2.2, 2.5, 0); c.fill(); }, 1.2);
    S.trail = mk(-11, -1.6, 0, 1.6, (c) => { const g = c.createLinearGradient(-11, 0, 0, 0); g.addColorStop(0, 'rgba(255,120,30,0)'); g.addColorStop(0.6, 'rgba(255,170,70,0.45)'); g.addColorStop(1, 'rgba(255,235,170,0.9)'); c.fillStyle = g; leaf(c, -11, 0, 0, 11, 0.85); }, 0.3);
    S.flare = mk(-9, -9, 9, 9, (c) => { c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(0, 0, 0, 0, 0, 3.5); g.addColorStop(0, 'rgba(255,255,235,1)'); g.addColorStop(1, 'rgba(255,190,90,0)'); c.fillStyle = g; circ(c, 0, 0, 3.5);
      for (let k = 0; k < 4; k++) { const a = k / 4 * TAU, L = k & 1 ? 6 : 9, gg = c.createLinearGradient(0, 0, Math.cos(a) * L, Math.sin(a) * L); gg.addColorStop(0, 'rgba(255,250,220,0.95)'); gg.addColorStop(1, 'rgba(255,180,80,0)'); c.fillStyle = gg; leaf(c, 0, 0, a, L, 0.55); } }, 0.5);
    return S;
  }

  /* ---------- ground: four light fields + bleed + ink seam + ripples + grain, then an ink lace layer ---------- */
  const TH = [-0.95, -0.3, 0.35], BW = 0.075, HOT = [255, 240, 196];
  const BANDS = [{ e: [44, 116, 140], c: [118, 204, 198] }, { e: [104, 64, 162], c: [182, 130, 220] }, { e: [176, 42, 66], c: [242, 106, 82] }, { e: [234, 122, 44], c: [255, 198, 98] }];
  const FS = 1.7; // field scale for the preview (1 = the full-size ~1300-unit fields); smaller fields show all four bands at once
  const fval = (x, y) => (warped(x * FS / 1300, y * FS / 1300, 501, 0.85, 3) - 0.5) * 9.5 + (fbm(x * FS / 420, y * FS / 420, 502, 2) - 0.5) * 0.9;
  const bandOf = (f) => (f < TH[0] ? 0 : f < TH[1] ? 1 : f < TH[2] ? 2 : 3);
  /** Colour of a field: edge colour at the seam → core colour 0.75 f-units deep; amber gets a hot white-gold heart. */
  function bandCol(i, f, gl, o) {
    let d = i === 0 ? TH[0] - f : i === 3 ? f - TH[2] : Math.min(f - TH[i - 1], TH[i] - f); if (d < 0) d = 0;
    const B = BANDS[i], t = sstep(0, 0.75, d) * (0.55 + 0.45 * gl); for (let k = 0; k < 3; k++) o[k] = B.e[k] + (B.c[k] - B.e[k]) * t;
    if (i === 3) { const h = sstep(0.9, 2.2, d) * (0.25 + 0.4 * gl); for (let k = 0; k < 3; k++) o[k] += (HOT[k] - o[k]) * h; }
  }
  function fieldColor(f, gl, o) {
    const s0 = sstep(TH[0] - BW, TH[0] + BW, f), s1 = sstep(TH[1] - BW, TH[1] + BW, f), s2 = sstep(TH[2] - BW, TH[2] + BW, f), w = [1 - s0, s0 - s1, s1 - s2, s2], t = [0, 0, 0];
    o[0] = o[1] = o[2] = 0; for (let i = 0; i < 4; i++) if (w[i] > 0.001) { bandCol(i, f, gl, t); for (let k = 0; k < 3; k++) o[k] += t[k] * w[i]; }
    const m = 0.9 + 0.2 * gl; for (let k = 0; k < 3; k++) o[k] *= m; return 1 - s0;
  }
  let GROUND = null;
  function bakeGround(w, h, s, wx, wy) {
    const vw = w / s, ST = 4, NX = Math.ceil(vw / ST) + 3, NY = Math.ceil(360 / ST) + 3, N = NX * NY;
    const F = new Float32Array(N), Gd = new Float32Array(N * 6), col = [0, 0, 0];
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) F[j * NX + i] = fval(wx + (i - 1) * ST, wy + (j - 1) * ST);
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const k = j * NX + i, q = k * 6, x = wx + (i - 1) * ST, y = wy + (j - 1) * ST, tw = fieldColor(F[k], fbm(x / 520, y / 520, 503, 3), col);
      Gd[q] = col[0]; Gd[q + 1] = col[1]; Gd[q + 2] = col[2]; Gd[q + 3] = tw; Gd[q + 4] = y * 0.72 + 7 * perlin(x / 95, y / 95, 504) + 2.5 * perlin(x / 33, y / 33, 505);
      const il = Math.max(0, i - 1), ir = Math.min(NX - 1, i + 1), jt = Math.max(0, j - 1), jb = Math.min(NY - 1, j + 1);
      const gm = Math.hypot((F[j * NX + ir] - F[j * NX + il]) / ((ir - il) * ST), (F[jb * NX + i] - F[jt * NX + i]) / ((jb - jt) * ST)) + 1e-5;
      let t = TH[0], dd = 1e9; for (const th of TH) { const d = Math.abs(F[k] - th); if (d < dd) { dd = d; t = th; } }
      Gd[q + 5] = Math.max(-60, Math.min(60, (F[k] - t) / gm)); // signed distance to the nearest seam, in world units
    }
    const look = (x, y, ch) => { const gx = (x - wx) / ST + 1, gy = (y - wy) / ST + 1, i0 = Math.max(0, Math.min(NX - 2, gx | 0)), j0 = Math.max(0, Math.min(NY - 2, gy | 0)), fx = Math.min(1, Math.max(0, gx - i0)), fy = Math.min(1, Math.max(0, gy - j0)), q = (j0 * NX + i0) * 6 + ch;
      return (Gd[q] * (1 - fx) + Gd[q + 6] * fx) * (1 - fy) + (Gd[q + NX * 6] * (1 - fx) + Gd[q + NX * 6 + 6] * fx) * fy; };
    const grain = new Int8Array(65536); for (let i = 0; i < 65536; i++) grain[i] = Math.round((hashInt(i & 255, i >> 8, 77) / 4294967296 - 0.5) * 8);
    const { c, ctx } = canvas(w, h), img = ctx.createImageData(w, h), d = img.data;
    for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
      const x = wx + (px + 0.5) / s, y = wy + (py + 0.5) / s; let r = look(x, y, 0), g = look(x, y, 1), b = look(x, y, 2); const tw = look(x, y, 3), sd = Math.abs(look(x, y, 5));
      if (sd < 6) { const e = 1 - sd / 6, k = e * e * 0.22; r += (255 - r) * k; g += (240 - g) * k; b += (215 - b) * k; } // light bleeds along the cut edge
      if (tw > 0.02) { const sn = Math.sin(look(x, y, 4)); if (sn > 0.86) { const l = (sn - 0.86) * 7.1 * tw * 0.42; r += (215 - r) * l; g += (255 - g) * l; b += (245 - b) * l; } } // moonlit ripples
      const gr = grain[((py & 255) << 8) | (px & 255)]; r += gr; g += gr * 0.9; b += gr * 0.8;
      const a = (0.36 - sd) * s + 0.5; if (a > 0) { const t = Math.min(1, a) * 0.85; r += (22 - r) * t; g += (8 - g) * t; b += (28 - b) * t; } // the ink seam
      const o = (py * w + px) * 4; d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const L = canvas(w, h), lc = L.ctx; lc.setTransform(s, 0, 0, s, -wx * s, -wy * s); lc.fillStyle = lc.strokeStyle = INK; lc.lineCap = lc.lineJoin = 'round';
    const scatter = (cell, seed, fn) => { for (let cy = Math.floor(wy / cell) - 1; cy <= (wy + 360) / cell; cy++) for (let cx = Math.floor(wx / cell) - 1; cx <= (wx + vw) / cell; cx++) { const r = rng(hashInt(cx, cy, seed)); fn((cx + r.next()) * cell, (cy + r.next()) * cell, r); } };
    scatter(4.2, 6101, (x, y, r) => { // lace beads threaded along every seam
      const sd = look(x, y, 5); if (Math.abs(sd) > 2.4) return; const e = 1, fx = look(x + e, y, 5) - look(x - e, y, 5), fy = look(x, y + e, 5) - look(x, y - e, 5), n = Math.hypot(fx, fy) || 1, nx = fx / n, ny = fy / n;
      const bx = x - nx * sd, by = y - ny * sd, r1 = r.next(), sg = r.next() < 0.5 ? 1 : -1, ox = nx * sg, oy = ny * sg;
      if (r1 < 0.45) { circ(lc, bx + ox * 1.5, by + oy * 1.5, 0.62); lc.lineWidth = 0.32; lc.beginPath(); lc.arc(bx + ox * 1.5, by + oy * 1.5, 1.25, 0, TAU); lc.stroke(); }
      else if (r1 < 0.8) { const a = Math.atan2(oy, ox); leaf(lc, bx, by, a - 0.5, 2.3, 0.45); leaf(lc, bx, by, a + 0.5, 2.3, 0.45); }
      else { circ(lc, bx + ox * 1.1, by + oy * 1.1, 0.42); circ(lc, bx + ox * 2.3, by + oy * 2.3, 0.3); }
    });
    scatter(15, 6201, (x, y, r) => { const b = bandOf(fval(x, y)), r1 = r.next(); if (Math.abs(look(x, y, 5)) < 4) return;
      if (b === 3 && r1 < 0.5 || b === 2 && r1 < 0.16) { for (let i = 0, n = 5 + (r.next() * 5 | 0); i < n; i++) { const bx = x + R(-3, 3, r), a = -Math.PI / 2 + R(-0.75, 0.75, r), L = R(3.5, 8, r); limb(lc, [[bx, y], [bx + Math.cos(a) * L * 0.5 + R(-1, 1, r), y + Math.sin(a) * L * 0.5], [bx + Math.cos(a) * L, y + Math.sin(a) * L]], 0.84, 0.05); } } // grass tufts
      else if (b === 1 && r1 < 0.4) { const a = r.next() * TAU; for (let k = -2; k <= 2; k++) leaf(lc, x, y, a + k * 0.62, 3.4 - Math.abs(k) * 0.6, 0.75); } // fallen leaves
    });
    scatter(30, 6202, (x, y, r) => { const b = bandOf(fval(x, y)), r1 = r.next(); if (Math.abs(look(x, y, 5)) < 6) return;
      if (b === 2 && r1 < 0.62) { const a = R(0, TAU, r), L = R(9, 15, r), t = R(4, 6.5, r) * (r.next() < 0.5 ? -1 : 1), p1 = curlPts(x, y, a, L, t, 12); limb(lc, p1, 0.85, 0.12, 2); limb(lc, curlPts(x, y, a + Math.PI, L * 0.8, t, 12), 0.85, 0.12, 2);
        for (let k = 2; k < 8; k += 2) leaf(lc, p1[k][0], p1[k][1], Math.atan2(p1[k + 1][1] - p1[k][1], p1[k + 1][0] - p1[k][0]) + (k & 2 ? 1.1 : -1.1), R(1.6, 2.6, r), 0.45); circ(lc, x, y, 0.75); } // filigree scroll
      else if (b === 3 && r1 < 0.35) { const hx = x + R(-2, 2, r), hy = y - R(6, 9, r); limb(lc, [[x, y], [hx, hy]], 0.5, 0.3); lc.lineWidth = 0.25; // dandelion clock
        for (let k = 0; k < 14; k++) { const a = k / 14 * TAU; lc.beginPath(); lc.moveTo(hx + Math.cos(a) * 0.8, hy + Math.sin(a) * 0.8); lc.lineTo(hx + Math.cos(a) * 2.6, hy + Math.sin(a) * 2.6); lc.stroke(); circ(lc, hx + Math.cos(a) * 2.9, hy + Math.sin(a) * 2.9, 0.32); } circ(lc, hx, hy, 0.7); }
      else if (b === 0 && r1 < 0.5) { lc.lineWidth = 0.4; for (let k = 0; k < 3; k++) { const rx = 3.5 + k * 3.2; let a = R(0, 1, r); while (a < TAU - 0.3) { const len = R(0.8, 2.2, r); lc.beginPath(); lc.ellipse(x, y, rx, rx * 0.4, 0, a, Math.min(TAU, a + len)); lc.stroke(); a += len + R(0.25, 0.7, r); } } } // ripples
      else if (b === 1 && r1 < 0.7) { const rr = R(1.4, 2.6, r); star(lc, x, y, 5, rr, rr * 0.42, r.next()); } // cut-out stars
    });
    ctx.globalAlpha = 0.8; ctx.drawImage(L.c, 0, 0); ctx.globalAlpha = 1; // lace is opaque ink, composited at 80 % so the light glows through
    return { c, w, h, s, wx, wy };
  }

  /* ---------- theatre frame overlay: vignette, velvet curtains, scalloped valance, stage lip ---------- */
  let FRAME = null;
  function bakeFrame(W, H) {
    const { c, ctx } = canvas(W, H), mx = Math.max(W, H), v = ctx.createRadialGradient(W / 2, H * 0.52, mx * 0.28, W / 2, H * 0.52, mx * 0.72);
    v.addColorStop(0, 'rgba(14,4,22,0)'); v.addColorStop(0.6, 'rgba(14,4,22,0.22)'); v.addColorStop(1, 'rgba(14,4,22,0.7)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    const cw = W * 0.034;
    for (const fl of [false, true]) { ctx.save(); if (fl) { ctx.translate(W, 0); ctx.scale(-1, 1); }
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(cw * 1.5, 0); ctx.bezierCurveTo(cw * 0.9, H * 0.18, cw * 0.55, H * 0.3, cw * 0.7, H * 0.42); ctx.bezierCurveTo(cw * 0.9, H * 0.5, cw * 0.55, H * 0.75, cw * 1.05, H); ctx.lineTo(0, H); ctx.closePath();
      const g = ctx.createLinearGradient(0, 0, cw * 1.4, 0); [[0, INK], [0.3, '#2a0a20'], [0.45, INK], [0.7, '#240818'], [1, INK]].forEach((s) => g.addColorStop(s[0], s[1])); ctx.fillStyle = g; ctx.fill();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(cw * 0.75, H * 0.43, cw * 0.32, H * 0.012, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    const vh = H * 0.032, n = 16, sw = W / n; ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, vh);
    for (let i = n; i > 0; i--) ctx.quadraticCurveTo((i - 1) * sw + sw / 2, vh * 2, (i - 1) * sw, vh); ctx.fill();
    for (let i = 1; i < n; i++) { const x = i * sw; ctx.fillRect(x - 0.6, vh, 1.2, vh * 0.55); ctx.beginPath(); ctx.moveTo(x, vh * 1.45); ctx.lineTo(x + vh * 0.22, vh * 1.95); ctx.lineTo(x - vh * 0.22, vh * 1.95); ctx.fill(); }
    const sg = ctx.createLinearGradient(0, H * 0.94, 0, H); sg.addColorStop(0, 'rgba(11,5,16,0)'); sg.addColorStop(1, 'rgba(11,5,16,0.8)'); ctx.fillStyle = sg; ctx.fillRect(0, H * 0.94, W, H * 0.06);
    return { c, W, H };
  }

  /* ---------- public drawing API (ctx in world units, 1 unit = K/… px handled by blit) ---------- */
  /** Draws the main character with feet at (x, y). t = seconds, facing = 1 | -1. Warm follow-spot, rim of light, flickering face halo. */
  function drawHero(ctx, x, y, t, facing) {
    const sp = sprites(), fi = facing < 0 ? 1 : 0, i = Math.floor(t * 9) % 6;
    add(ctx, sp.pool, x, y - 6, 0.55 + 0.05 * Math.sin(t * 2.2), 1.1, 0.62); blit(ctx, sp.contact, x, y + 0.6, 0.8, 0.26);
    add(ctx, sp.jackR[i][fi], x, y, 0.75); blit(ctx, sp.jack[i][fi], x, y);
    add(ctx, sp.face, x + (fi ? -1.6 : 1.6), y - 22.5, (0.8 + 0.12 * Math.sin(t * 11) + 0.08 * Math.sin(t * 27)) * 0.85, 0.8, 0.75);
  }
  /** Draws a typical creature with feet at (x, y). kind: 'creeper' (small, default) | 'ghost' (fast veil) | 'brute' (large). flash 0..1 = impact rim. */
  function drawEnemy(ctx, x, y, t, kind, seed, facing, flash) {
    const sp = sprites(), fi = (facing || 1) < 0 ? 1 : 0; seed = seed || 0;
    if (kind === 'ghost') { blit(ctx, sp.contact, x, y + 0.5, 0.45, 0.16); blit(ctx, sp.ghost[Math.floor(t * 6 + seed * 9) & 3][fi], x, y - 2.2 - Math.sin(t * 3.1 + seed * 20) * 1.2, 1, 1, Math.sin(t * 2.3 + seed * 9) * 0.06); return; }
    if (kind === 'brute') { const f = Math.floor(t * 3.6) % 6; blit(ctx, sp.contact, x, y + 0.6, 1.9, 0.57); blit(ctx, sp.colo[f][fi], x, y, 1, 1, Math.sin(t * 3.6 / 6 * TAU) * 0.035 * (fi ? -1 : 1));
      add(ctx, sp.pink, x + (fi ? -1.5 : 1.5), y - 29, 0.45 + 0.25 * Math.sin(t * 4 + seed * 10), 0.9, 0.9); return; }
    const v = seed < 0.5 ? 0 : 1, f = Math.floor(t * 4.8 + seed * 6) % 6, wob = Math.sin(t * 4.8 / 6 * TAU + seed * 6) * 0.075 * (fi ? -1 : 1);
    blit(ctx, sp.contact, x, y + 0.6, 0.85, 0.26);
    if (flash > 0.02) add(ctx, sp.creepR[v][f][fi], x, y, Math.min(0.9, flash * 1.1), 1, 1, wob);
    blit(ctx, sp.creep[v][f][fi], x, y, 1, 1, wob);
  }

  /** Paints a complete preview scene into a w×h canvas at time t (seconds). */
  function draw(ctx, w, h, t) {
    const s = h / 360, vw = w / s; K = Math.max(2, Math.min(5, Math.round(s * 1.3 * 4) / 4));
    const wx = -400 - vw / 2, wy = 1440; // camera chosen so teal, violet, crimson and amber fields all show
    if (!GROUND || GROUND.w !== w || GROUND.h !== h) GROUND = bakeGround(w, h, s, wx, wy);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(GROUND.c, 0, 0);
    ctx.setTransform(s, 0, 0, s, 0, 0); // world units from here on (origin = top-left of the view)
    const cx = vw / 2, hx = cx - 20 + Math.sin(t * 0.6) * 6, hy = 200, list = [];
    const foes = [[-150, -30, 'creeper', 0.2], [-95, 60, 'creeper', 0.7], [70, 35, 'creeper', 0.4], [115, -70, 'creeper', 0.9], [-60, -95, 'ghost', 0.3], [-185, 70, 'ghost', 0.6], [150, 20, 'brute', 0.5], [210, -60, 'creeper', 0.1], [235, 95, 'ghost', 0.8], [40, 115, 'creeper', 0.55]];
    foes.forEach((f, i) => list.push({ y: hy + f[1], fn: () => drawEnemy(ctx, hx + f[0] + Math.sin(t * 0.8 + i) * 3, hy + f[1], t + i * 0.37, f[2], f[3], f[0] > 0 ? -1 : 1, i === 2 ? 0.8 : 0) }));
    for (const [px, py] of [[-235, -40], [-30, 120], [255, -110]]) list.push({ y: hy + py, fn: () => { blit(ctx, sprites().contact, hx + px, hy + py + 0.5, 1.1, 0.3); blit(ctx, sprites().pump, hx + px, hy + py);
      add(ctx, sprites().gold, hx + px, hy + py - 4.8, 0.75 * (0.75 + 0.15 * Math.sin(t * 9 + px) + 0.1 * Math.sin(t * 23 + py)), 0.72, 0.72); } });
    list.push({ y: hy, fn: () => drawHero(ctx, hx, hy, t, 1) });
    list.sort((a, b) => a.y - b.y).forEach((o) => o.fn());
    const sp = sprites();
    for (let i = 0; i < 6; i++) { const gx = hx - 120 + i * 21, gy = hy + 40 + Math.sin(i * 2.1) * 14 + Math.sin(t * 3 + i) * 0.8; add(ctx, sp.cyan, gx, gy - 1, (0.75 + 0.25 * Math.sin(t * 5 + i)) * 0.9, 0.75); blit(ctx, sp.gem, gx, gy); }
    const u = (t * 1.3) % 1, px = hx + 8 + u * 120, py = hy - 14 + u * 4, a = Math.atan2(4, 120); // seed projectile with additive trail
    add(ctx, sp.trail, px, py, 1, 1, 1, a); add(ctx, sp.ember, px, py, 0.7, 1.4); blit(ctx, sp.seed, px, py, 1, 1, a);
    add(ctx, sp.flare, hx + 70, hy + 35 - 12, 0.9, 0.9, 0.9, t * 2); // impact flare on the flashed creature
    ctx.font = '700 12.5px Cinzel, "Times New Roman", serif'; ctx.textAlign = 'center'; ctx.lineJoin = 'round'; // pop-up number: ink stroke + glow, gold gradient
    ctx.save(); ctx.shadowColor = 'rgba(255,140,40,0.95)'; ctx.shadowBlur = 6 * s; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeText('34', hx + 72, hy - 2); ctx.restore();
    const g = ctx.createLinearGradient(0, hy - 12, 0, hy - 2); g.addColorStop(0, '#fff'); g.addColorStop(0.45, '#ffe07a'); g.addColorStop(1, '#ff8a22'); ctx.fillStyle = g; ctx.fillText('34', hx + 72, hy - 2);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (!FRAME || FRAME.W !== w || FRAME.H !== h) FRAME = bakeFrame(w, h);
    ctx.drawImage(FRAME.c, 0, 0);
  }

  const Starter = { id: 'shadow', name: 'Shadow Theatre', palette: PALETTE, fonts: ['Cinzel:wght@400;700;900', 'IM Fell English SC', 'Cormorant Garamond:wght@500;600;700'], drawHero, drawEnemy, draw };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['shadow'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
