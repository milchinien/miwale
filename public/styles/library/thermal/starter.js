/* Thermal Vision — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   Core trick: never paint colour. Paint TEMPERATURE (grayscale: gray value = temperature 0..1, alpha = coverage),
   run a tiny heat pipeline once (diffusion blur, cooler rim, halo only around warm things) and push the result
   through ONE false-colour ramp ("ironbow"). Ground, sprites and particles all share that ramp, so everything
   matches automatically. Sprites are baked once; per frame it is drawImage + a few strokes. */
(function (root) {
  'use strict';
  const PALETTE = {
    void: '#030108', deepCold: '#0d0626', indigo: '#1d0b52', violet: '#3a0f78', purple: '#64108a', magenta: '#96158a',
    crimson: '#c4256a', redOrange: '#e3443a', orange: '#f4701a', amber: '#fb9d12', yellow: '#fdc52e', paleYellow: '#ffe777',
    whiteHot: '#fffdf2', cameraWhite: '#eef3ff', panel: '#05030c', outline: '#020008',
  };
  const P = PALETTE, TAU = Math.PI * 2, K = 4; // K = bake resolution, px per world unit
  const RAMP = [[0, P.void], [0.08, P.deepCold], [0.18, P.indigo], [0.28, P.violet], [0.38, P.purple], [0.48, P.magenta],
    [0.57, P.crimson], [0.65, P.redOrange], [0.73, P.orange], [0.81, P.amber], [0.88, P.yellow], [0.94, P.paleYellow], [1, P.whiteHot]]
    .map(([t, h]) => [t, [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]]);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  function ramp(t) {
    t = clamp(t, 0, 1);
    for (let i = 1; i < RAMP.length; i++) if (t <= RAMP[i][0]) {
      const a = RAMP[i - 1], b = RAMP[i], k = (t - a[0]) / (b[0] - a[0]);
      return [0, 1, 2].map((j) => a[1][j] + (b[1][j] - a[1][j]) * k);
    }
    return RAMP[RAMP.length - 1][1];
  }
  // 256-entry LUT quantised to 72 bands -> the faint contour banding of an 8-bit sensor
  const LUT = new Uint8ClampedArray(768);
  for (let i = 0; i < 256; i++) { const c = ramp(Math.round((i / 255) * 71) / 71); LUT[i * 3] = c[0]; LUT[i * 3 + 1] = c[1]; LUT[i * 3 + 2] = c[2]; }
  const li = (t) => (t <= 0 ? 0 : t >= 1 ? 255 : (t * 255 + 0.5) | 0) * 3;
  const col = (t, a) => { const c = ramp(t); return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a === undefined ? 1 : a) + ')'; };
  const gray = (t, a) => { const v = Math.round(clamp(t, 0, 1) * 255); return 'rgba(' + v + ',' + v + ',' + v + ',' + (a === undefined ? 1 : a) + ')'; };
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
  // deterministic hash / value noise / fbm (no Math.random anywhere)
  function hash(i, j, s) { let h = (Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function noise(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, s, o) { let t = 0, a = 0.5, n = 0; for (let i = 0; i < o; i++) { t += noise(x, y, s + i * 17) * a; n += a; x *= 2.03; y *= 2.03; a *= 0.5; } return t / n; }

  /* ---------- painting helpers: shapes are filled with TEMPERATURE (gray) ---------- */
  const fillT = (c, s) => { c.fillStyle = typeof s === 'number' ? gray(s) : s; c.fill(); };
  const strokeT = (c, s, w) => { c.strokeStyle = typeof s === 'number' ? gray(s) : s; c.lineWidth = w; c.stroke(); };
  const circ = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, TAU); };
  const ell = (c, x, y, rx, ry) => { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); };
  const radial = (c, x, y, r, t0, t1) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, gray(t0)); g.addColorStop(1, gray(t1)); return g; };
  const poly = (c, p) => { c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.closePath(); };

  /* ---------- the heat pipeline (bake time only) ---------- */
  function blur(src, w, h, r) { // 3 x separable box blur, zero outside
    const tmp = new Float32Array(src.length), out = new Float32Array(src.length), iv = 1 / (2 * r + 1);
    let a = src;
    for (let p = 0; p < 3; p++) {
      for (let y = 0; y < h; y++) { let s = 0; for (let x = 0; x <= r && x < w; x++) s += a[y * w + x]; for (let x = 0; x < w; x++) { tmp[y * w + x] = s * iv; if (x + r + 1 < w) s += a[y * w + x + r + 1]; if (x - r >= 0) s -= a[y * w + x - r]; } }
      for (let x = 0; x < w; x++) { let s = 0; for (let y = 0; y <= r && y < h; y++) s += tmp[y * w + x]; for (let y = 0; y < h; y++) { out[y * w + x] = s * iv; if (y + r + 1 < h) s += tmp[(y + r + 1) * w + x]; if (y - r >= 0) s -= tmp[(y - r) * w + x]; } }
      a = out;
    }
    return out;
  }
  /** paint(ctx) draws gray temperatures with the anchor (feet) at 0,0. Returns { img, w, h, ax, ay } in world units. */
  function bakeHeat(l, t, r, b, paint, o) {
    o = o || {};
    const w = Math.ceil((l + r) * K), h = Math.ceil((t + b) * K), c = mk(w, h), x = c.getContext('2d');
    x.setTransform(K, 0, 0, K, l * K, t * K); x.lineCap = 'round'; x.lineJoin = 'round';
    paint(x);
    const d = x.getImageData(0, 0, w, h).data, N = w * h, A = new Float32Array(N), TA = new Float32Array(N);
    for (let i = 0; i < N; i++) { A[i] = d[i * 4 + 3] / 255; TA[i] = (d[i * 4] / 255) * A[i]; }
    const rd = Math.max(1, Math.round(0.55 * K)), rh = Math.max(1, Math.round((o.halo || 1.5) * K));
    const Ad = blur(A, w, h, rd), TAd = blur(TA, w, h, rd), Ah = blur(A, w, h, rh), TAh = blur(TA, w, h, rh);
    const img = x.createImageData(w, h), q = img.data, haloA = o.haloA || 0.62, f = o.f || ((v) => v);
    for (let i = 0; i < N; i++) {
      const a = A[i];
      let ti = 0;
      if (a > 0.003) {
        const t0 = TA[i] / a, tb = TAd[i] / Math.max(Ad[i], 1e-4);
        ti = (t0 + (tb - t0) * 0.5) * (1 - 0.42 * (1 - Math.min(1, Ah[i] * 1.3))); // diffusion + limb cooling at the rim
      }
      const th = TAh[i] / Math.max(Ah[i], 1e-4);
      const ah = Math.min(1, Ah[i] * 1.7) * haloA * sstep(0.36, 0.8, th) * (1 - a); // halo only around warm things
      const oa = a + ah;
      if (oa < 0.004) continue;
      const i1 = li(f(ti)), i2 = li(f(th * 0.6));
      for (let k = 0; k < 3; k++) q[i * 4 + k] = (LUT[i1 + k] * a + LUT[i2 + k] * ah) / oa;
      q[i * 4 + 3] = Math.min(255, oa * 255);
    }
    const out = mk(w, h); out.getContext('2d').putImageData(img, 0, 0);
    return { img: out, w: w / K, h: h / K, ax: (l * K) / w, ay: (t * K) / h };
  }
  const blit = (ctx, s, x, y, flip) => {
    if (!flip) { ctx.drawImage(s.img, x - s.ax * s.w, y - s.ay * s.h, s.w, s.h); return; }
    ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1); ctx.drawImage(s.img, -s.ax * s.w, -s.ay * s.h, s.w, s.h); ctx.restore();
  };

  /* ---------- characters (painted facing right) ---------- */
  function heroPaint(c, ph) {
    const a = ph * TAU, s = Math.sin(a), bob = -Math.abs(Math.cos(a)) * 1.1 + 0.55, hip = -9.6 + bob;
    const leg = (hx, p, tl, tb) => { const fx = hx + Math.sin(p) * 3.8, fy = -Math.max(0, -Math.cos(p)) * 1.9;
      c.beginPath(); c.moveTo(hx, hip); c.lineTo((hx + fx) / 2 + 1, (hip + fy) / 2); c.lineTo(fx, fy - 1.4); strokeT(c, tl, 3.1); ell(c, fx + 0.9, fy - 1, 2.35, 1.3); fillT(c, tb); };
    const arm = (sx, sy, an, tl, th) => { const ex = sx + Math.sin(an) * 3.6, ey = sy + Math.cos(an) * 3.6, a2 = an * 1.25 + 0.4;
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.lineTo(ex + Math.sin(a2) * 3.4, ey + Math.cos(a2) * 3.4); strokeT(c, tl, 2.7); circ(c, ex + Math.sin(a2) * 3.4, ey + Math.cos(a2) * 3.4, 1.45); fillT(c, th); };
    arm(-0.7, -18.4 + bob, s * 0.8, 0.52, 0.62); leg(-1.1, a + Math.PI, 0.5, 0.28); leg(1.1, a, 0.6, 0.32);
    c.beginPath(); c.rect(-8.8, -23.4 + bob, 5.6, 11.8); fillT(c, 0.27); // cold backpack = darkest shape
    c.beginPath(); c.moveTo(-3.8, -20.6 + bob); c.quadraticCurveTo(0.5, -22.2 + bob, 4.4, -20.3 + bob); c.lineTo(5.5, -9.4 + bob); c.quadraticCurveTo(0.6, -8 + bob, -4.6, -9.3 + bob); c.closePath();
    fillT(c, radial(c, 2, -16.2 + bob, 8.8, 0.8, 0.58)); // parka: warmest at the chest
    circ(c, 0.6, -24.7 + bob, 5.5); fillT(c, radial(c, 2.4, -24.4 + bob, 6.6, 0.7, 0.53)); // hood
    ell(c, 3.05, -24.2 + bob, 2.75, 3.25); fillT(c, radial(c, 3, -24.8 + bob, 3.5, 1, 0.86)); // face: hottest spot
    circ(c, 5.25, -23.8 + bob, 0.7); fillT(c, 0.79); // cold nose tip
    arm(1.4, -18.1 + bob, -s * 0.8, 0.64, 0.76);
  }
  function critterPaint(c, ph) {
    const a = ph * TAU, s = Math.sin(a), by = -7.4 - Math.abs(s) * 0.8;
    c.beginPath(); c.moveTo(-6.8, by); c.quadraticCurveTo(-11.5, by + s * 0.6, -14.2, by - 4.6 + s * 1.2); strokeT(c, 0.42, 1.7);
    for (const [hx, p, t] of [[-4.6, a + Math.PI, 0.46], [3.6, a, 0.46], [-2.6, a, 0.55], [5.6, a + Math.PI, 0.55]]) {
      c.beginPath(); c.moveTo(hx, by + 2.6); c.lineTo(hx + Math.sin(p) * 1.9, -Math.max(0, -Math.cos(p)) * 1.4 - 0.5); strokeT(c, t, 1.7); }
    ell(c, 0, by, 8.2, 5.3); fillT(c, radial(c, 3.4, by - 0.4, 9.5, 0.82, 0.57));
    c.beginPath(); for (let i = 0; i <= 7; i++) { const an = Math.PI + 0.25 + (i / 7) * 1.75; c.lineTo(Math.cos(an) * 7.6, by + Math.sin(an) * 4.9); c.lineTo(Math.cos(an) * 10.2 - 1.1, by + Math.sin(an) * 7.5 - 0.4); }
    c.lineTo(2, by - 3); c.closePath(); fillT(c, 0.46); // quill ridge: cooler keratin
    circ(c, 7.3, by - 2.2, 3.9); fillT(c, radial(c, 7, by - 2.6, 4.4, 0.84, 0.66));
    poly(c, [6.6, by - 5.2, 7.9, by - 9.7, 9, by - 5]); fillT(c, 0.8); circ(c, 8.9, by - 3, 0.95); fillT(c, 1);
  }
  function wispPaint(c, ph) {
    const a = ph * TAU, R = [], L = [];
    for (let i = 0; i <= 24; i++) { const v = i / 24, y = -9.5 - 19.5 * v, hw = 5.7 * Math.pow(1 - v, 0.85), sw = Math.sin(a + v * 2.4) * 1.9 * v * v, rp = Math.sin(v * 11 - a * 2) * 2.7 * v * (1 - v);
      R.push(sw + hw + rp, y); L.push(sw - hw - rp, y); }
    c.beginPath(); c.arc(0, -9.5, 5.7, Math.PI, 0, true); for (let i = 0; i < R.length; i += 2) c.lineTo(R[i], R[i + 1]); for (let i = L.length - 2; i >= 0; i -= 2) c.lineTo(L[i], L[i + 1]); c.closePath();
    const g = c.createRadialGradient(0, -11.5, 0, 0, -12.5, 17); g.addColorStop(0, gray(1)); g.addColorStop(0.28, gray(0.96)); g.addColorStop(0.6, gray(0.8)); g.addColorStop(1, gray(0.6)); fillT(c, g);
    ell(c, -1.5, -13.2, 1.05, 1.55); fillT(c, 0.36); ell(c, 2.5, -13.2, 1.05, 1.55); fillT(c, 0.36); // cold eye holes
  }
  function brutePaint(c, ph) {
    const a = ph * TAU, s = Math.sin(a), B = -Math.abs(s) * 1.3 + 0.65;
    for (const [hx, t] of [[-6, 0.52], [6.5, 0.58]]) { c.beginPath(); c.moveTo(hx, -15 + B); c.lineTo(hx * 1.12, -2.2); strokeT(c, t, 7.4); }
    c.beginPath(); c.moveTo(-9, -11 + B); c.bezierCurveTo(-15.5, -20 + B, -18.5, -34 + B, -13, -42 + B); c.quadraticCurveTo(0.5, -50 + B, 14, -42 + B);
    c.bezierCurveTo(19.5, -34 + B, 16.5, -20 + B, 10, -11 + B); c.quadraticCurveTo(0.5, -7.5 + B, -9, -11 + B); c.closePath(); fillT(c, radial(c, 1.5, -27 + B, 22, 0.8, 0.55));
    for (const sd of [-1, 1]) { const sw = Math.sin(a + (sd > 0 ? Math.PI : 0)); c.beginPath(); c.moveTo(sd * 12.5, -39 + B); c.quadraticCurveTo(sd * 20.4, -23, sd * 18.4 + sw * 1.8, -5 - Math.max(0, sw) * 2.8);
      strokeT(c, sd > 0 ? 0.6 : 0.52, 7.2); ell(c, sd * 18.4 + sw * 1.8, -4.4 - Math.max(0, sw) * 2.8, 4.4, 3.6); fillT(c, sd > 0 ? 0.68 : 0.6); }
    const g = c.createRadialGradient(1.5, -27 + B, 0, 1.5, -27 + B, 9); g.addColorStop(0, gray(1)); g.addColorStop(0.32, gray(0.98)); g.addColorStop(1, gray(0.8, 0)); circ(c, 1.5, -27 + B, 9); fillT(c, g); // furnace core
    circ(c, 2.6, -43.5 + B, 6.2); fillT(c, radial(c, 3.1, -43 + B, 6.5, 0.84, 0.64)); circ(c, 0.7, -43.9 + B, 1.05); fillT(c, 1); circ(c, 5.5, -43.9 + B, 1.05); fillT(c, 1);
  }
  function pinePaint(c) {
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 19); g.addColorStop(0, gray(0.4, 0.85)); g.addColorStop(1, gray(0.36, 0)); c.save(); c.scale(1, 0.4); circ(c, 0, 0, 19); fillT(c, g); c.restore(); // warm ground under the canopy
    c.beginPath(); c.rect(-1.4, -12, 2.8, 12); fillT(c, 0.38);
    for (let i = 0; i < 5; i++) { const u = i / 5, yb = -8 - u * 42, w = 15.5 * (1 - u * 0.72); poly(c, [-w, yb, w, yb, 0, yb - 20]);
      const lg = c.createLinearGradient(0, yb - 20, 0, yb); lg.addColorStop(0, gray(0.03 + u * 0.01)); lg.addColorStop(1, gray(0.14 - u * 0.03)); fillT(c, lg); } // canopy: colder than the ground
  }

  /* ---------- ground: a temperature field mapped through the same LUT ---------- */
  function cellular(x, y) { // Worley f2 - f1 and the id of the nearest cell
    const xi = Math.floor(x), yi = Math.floor(y); let f1 = 9, f2 = 9, id = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = xi + i, cy = yi + j, px = cx + 0.1 + hash(cx, cy, 5) * 0.8, py = cy + 0.1 + hash(cx, cy, 6) * 0.8, d = Math.hypot(px - x, py - y);
      if (d < f1) { f2 = f1; f1 = d; id = hash(cx, cy, 7); } else if (d < f2) f2 = d; }
    return { e: f2 - f1, id };
  }
  function groundT(x, y) {
    let T = 0.19 + (fbm(x / 340, y / 340, 11, 3) - 0.5) * 0.18 + (fbm(x / 64, y / 64, 23, 2) - 0.5) * 0.07 + (noise(x / 3, y / 3, 41) - 0.5) * 0.05;
    const c = cellular(x / 380, y / 380), type = (c.id * 4) | 0, ang = c.id * 40;
    T += [0, 0.018, 0.075, -0.06][type];
    if (type === 1) T += Math.sin((x * Math.cos(ang) + y * Math.sin(ang)) * 0.97) * 0.05; // ploughed furrows
    T += (0.098 - T) * (1 - sstep(0.014, 0.034, c.e)) * 0.88; // cold hedgerows between fields
    const rd = Math.abs(y - (40 + Math.sin(x / 420 + 1) * 120)) / 1.05; // one curving road
    T += (0.2 - T) * (1 - sstep(13, 14, rd)) * 0.75; T += (0.345 - T) * (1 - sstep(9, 10.5, rd));
    const wf = fbm(x / 600 + 11, y / 600 - 5, 83, 3); T += (0.1 - T) * sstep(0.62, 0.627, wf); // cold, flat pond
    return T;
  }
  function bakeGround(w, h, k, camX, camY) {
    const S = 1.5, gw = Math.ceil(w / k / S), gh = Math.ceil(h / k / S), c = mk(gw, gh), x = c.getContext('2d'), img = x.createImageData(gw, gh);
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) { const T = groundT(camX - w / k / 2 + i * S, camY - h / k / 2 + j * S), o = li(T);
      img.data.set([LUT[o], LUT[o + 1], LUT[o + 2], 255], (j * gw + i) * 4); }
    x.putImageData(img, 0, 0); return c;
  }

  /* ---------- camera overlay: vignette, brackets, scale bar (cached), live readouts ---------- */
  function bakeOverlay(w, h) {
    const c = mk(w, h), x = c.getContext('2d'), u = h / 900, m = 30 * u, L = 58 * u;
    const g = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.34, w / 2, h / 2, Math.hypot(w, h) * 0.56);
    g.addColorStop(0, 'rgba(3,1,12,0)'); g.addColorStop(0.62, 'rgba(3,1,12,0.24)'); g.addColorStop(1, 'rgba(2,0,7,0.72)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.lineCap = 'square';
    for (const [cl, lw] of [['rgba(2,0,8,0.6)', 4.2 * u], [P.cameraWhite, 2.2 * u]]) { x.strokeStyle = cl; x.lineWidth = Math.max(1, lw); x.beginPath();
      for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { const cx = sx > 0 ? m : w - m, cy = sy > 0 ? m : h - m; x.moveTo(cx, cy + sy * L); x.lineTo(cx, cy); x.lineTo(cx + sx * L, cy); }
      x.stroke(); }
    const bw = 13 * u, bh = h * 0.36, bx = w - m - bw - 10 * u, by = h / 2 - bh / 2, lg = x.createLinearGradient(0, by, 0, by + bh);
    for (let i = 0; i <= 12; i++) lg.addColorStop(i / 12, col(1 - i / 12));
    x.fillStyle = lg; x.fillRect(bx, by, bw, bh); x.strokeStyle = P.cameraWhite; x.lineWidth = Math.max(1, 1.2 * u); x.strokeRect(bx, by, bw, bh);
    x.font = Math.round(15 * u) + "px 'Share Tech Mono', monospace"; x.textAlign = 'right'; x.textBaseline = 'middle'; x.fillStyle = P.cameraWhite;
    for (let i = 0; i <= 4; i++) x.fillText((48.6 - 15.25 * i).toFixed(1), bx - 9 * u, by + (bh * i) / 4);
    return c;
  }

  /* ---------- public API ---------- */
  let SPR = null;
  function sprites() {
    if (SPR) return SPR;
    SPR = { hero: [], critter: [], wisp: [], brute: [] };
    for (let i = 0; i < 4; i++) {
      SPR.hero.push(bakeHeat(15, 36, 17, 6, (c) => heroPaint(c, i / 4)));
      SPR.critter.push(bakeHeat(20, 22, 18, 6, (c) => critterPaint(c, i / 4), { halo: 1.3 }));
      SPR.wisp.push(bakeHeat(15, 37, 15, 6, (c) => wispPaint(c, i / 4), { halo: 2.1, haloA: 0.85 }));
      SPR.brute.push(bakeHeat(29, 57, 29, 7, (c) => brutePaint(c, i / 4), { halo: 1.9 }));
    }
    SPR.pine = bakeHeat(25, 61, 25, 12, pinePaint, { halo: 1.6 });
    return SPR;
  }
  /** Main character, feet at (x, y) in world units (360 per screen height). */
  function drawHero(ctx, x, y, t, facing) { blit(ctx, sprites().hero[Math.floor(t * 8) & 3], x, y, facing < 0); }
  /** A typical creature: the small quilled critter. */
  function drawEnemy(ctx, x, y, t, facing) { blit(ctx, sprites().critter[Math.floor(t * 7) & 3], x, y, facing < 0); }
  function contact(ctx, x, y, r) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col(0.44, 0.8)); g.addColorStop(1, col(0.3, 0));
    ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.42); ctx.translate(-x, -y); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore(); }
  let GROUND = null, OVL = null, KEY = '';
  function draw(ctx, w, h, t) {
    const k = h / 360, key = w + 'x' + h;
    if (key !== KEY) { KEY = key; GROUND = bakeGround(w, h, k, 0, 0); OVL = bakeOverlay(w, h); }
    const S = sprites();
    ctx.imageSmoothingEnabled = true; ctx.drawImage(GROUND, 0, 0, w, h);
    ctx.save(); ctx.setTransform(k, 0, 0, k, w / 2, h / 2);
    const actors = [];
    for (const [px, py] of [[-150, -40], [-120, 10], [160, 70], [190, 30], [-40, 120], [230, -110]]) actors.push({ y: py, f: () => blit(ctx, S.pine, px, py) });
    const hx = Math.sin(t * 0.5) * 30, hf = Math.cos(t * 0.5) >= 0 ? 1 : -1;
    actors.push({ y: 12, f: () => { contact(ctx, hx, 12, 12); drawHero(ctx, hx, 12, t, hf); } });
    for (let i = 0; i < 7; i++) { const a = i * 0.9 + t * 0.35, x = Math.cos(a) * (110 + i * 9), y = Math.sin(a) * 70 + 20;
      actors.push({ y, f: () => { contact(ctx, x, y, 13); drawEnemy(ctx, x, y, t + i * 0.3, -Math.sin(a)); } }); }
    for (let i = 0; i < 3; i++) { const x = -60 + i * 90 + Math.sin(t * 1.3 + i) * 20, y = -80 + Math.cos(t * 1.1 + i * 2) * 15 - 3;
      actors.push({ y, f: () => { ctx.globalAlpha = 0.85 + 0.15 * hash(Math.floor(t * 24), i, 3); blit(ctx, S.wisp[Math.floor(t * 10 + i) & 3], x, y); ctx.globalAlpha = 1; } }); }
    const bx = 120 + Math.sin(t * 0.3) * 20;
    actors.push({ y: -40, f: () => { contact(ctx, bx, -40, 27); blit(ctx, S.brute[Math.floor(t * 3) & 3], bx, -40, true); } });
    actors.sort((a, b) => a.y - b.y).forEach((a) => a.f());
    // a heat burst cooling through the ramp: white-hot -> yellow -> orange -> magenta, plus ember streaks
    const ph = (t * 0.7) % 1, ex = -95, ey = 70;
    for (let i = 0; i < 9; i++) { const an = i * 0.7, r = 4 + ph * 26, tt = 1 - ph * 0.7;
      ctx.strokeStyle = col(tt, 1 - ph); ctx.lineWidth = 1.4 * (1 - ph) + 0.4; ctx.beginPath();
      ctx.moveTo(ex + Math.cos(an) * r, ey - 8 + Math.sin(an) * r * 0.7); ctx.lineTo(ex + Math.cos(an) * (r + 4), ey - 8 + Math.sin(an) * (r + 4) * 0.7); ctx.stroke(); }
    const pg = ctx.createRadialGradient(ex, ey - 8 - ph * 10, 0, ex, ey - 8 - ph * 10, 6 + ph * 14);
    pg.addColorStop(0, col(1 - ph * 0.6, 0.9 * (1 - ph))); pg.addColorStop(1, col(0.5, 0)); ctx.fillStyle = pg; ctx.fillRect(ex - 30, ey - 50, 60, 60);
    ctx.strokeStyle = col(1 - ph * 0.45, 1 - ph); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(ex, ey, 6 + ph * 28, (6 + ph * 28) * 0.42, 0, 0, TAU); ctx.stroke();
    ctx.restore();
    // camera overlay + a deterministic sensor grain (hash per 3 px cell, changes 30x per second)
    ctx.drawImage(OVL, 0, 0);
    const gs = 3, seed = Math.floor(t * 30);
    for (let y = 0; y < h; y += gs * 7) for (let x = 0; x < w; x += gs * 5) { const v = hash(x, y, seed); if (v > 0.5) continue; ctx.fillStyle = v < 0.25 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,12,0.12)'; ctx.fillRect(x + (hash(y, x, seed) * 5 | 0) * gs, y, gs, gs); }
    const u = h / 900;
    ctx.font = Math.round(17 * u) + "px 'Share Tech Mono', monospace"; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    if (Math.floor(t * 1.6) % 2 === 0) { ctx.fillStyle = P.redOrange; ctx.beginPath(); ctx.arc(42 * u, h - 72 * u, 6 * u, 0, TAU); ctx.fill(); }
    ctx.fillStyle = P.cameraWhite; ctx.fillText('REC  00:00:' + String(Math.floor(t) % 60).padStart(2, '0'), 56 * u, h - 72 * u);
    ctx.fillText('SP1 ' + (36.6 + (hash(Math.floor(t * 2), 7, 9) - 0.5) * 0.4).toFixed(1) + '°C', w / 2 + 90 * u, h / 2 - 90 * u);
  }

  const Starter = { id: 'thermal', name: 'Thermal Vision', palette: PALETTE, fonts: ['Share Tech Mono', 'Orbitron:wght@500;700;900', 'Chakra Petch:wght@400;600;700'], drawHero, drawEnemy, draw, ramp, bakeHeat };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['thermal'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
