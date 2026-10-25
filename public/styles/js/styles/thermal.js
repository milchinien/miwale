/* Thermal Vision – the world seen through an infrared camera.
   Core technique: nothing is painted in colour. Every sprite, every ground pixel and every particle is first a
   TEMPERATURE (0 = coldest .. 1 = hottest) and only then mapped through one false-colour ramp ("ironbow":
   black -> indigo -> violet -> magenta -> orange -> yellow -> white).
   Sprites: painted once in init() as grayscale (gray value = temperature, alpha = coverage), then a small JS heat
   pipeline (box-blur diffusion, limb cooling at the silhouette, hot-only halo) produces a temperature map that is
   pushed through the LUT. Variants (white-hot flash, cooled-down, afterimage) are just other transfer functions on
   the same map. Ground chunks are temperature fields computed in JS (coarse noise grid + fine tiled noise +
   stamped decals) mapped through the same LUT. Per frame: drawImage, one grain pattern fill, a handful of
   strip copies for heat haze, and a cached camera overlay. */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2;
  const K = 4; // sprite bake resolution: px per world unit
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const smooth = (a, b, x) => { let t = (x - a) / (b - a); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };

  /* ================= ironbow false-colour ramp ================= */
  const STOPS = [
    [0.0, '#030108'], [0.08, '#0d0626'], [0.18, '#1d0b52'], [0.28, '#3a0f78'], [0.38, '#64108a'],
    [0.48, '#96158a'], [0.57, '#c4256a'], [0.65, '#e3443a'], [0.73, '#f4701a'], [0.81, '#fb9d12'],
    [0.88, '#fdc52e'], [0.94, '#ffe777'], [1.0, '#fffdf2'],
  ].map(([t, h]) => [t, U.hex(h)]);
  function ramp(t) {
    t = clamp(t, 0, 1);
    for (let i = 1; i < STOPS.length; i++) {
      if (t <= STOPS[i][0]) {
        const a = STOPS[i - 1], b = STOPS[i], k = (t - a[0]) / (b[0] - a[0]);
        return [a[1][0] + (b[1][0] - a[1][0]) * k, a[1][1] + (b[1][1] - a[1][1]) * k, a[1][2] + (b[1][2] - a[1][2]) * k];
      }
    }
    return STOPS[STOPS.length - 1][1].slice();
  }
  /* 256-entry LUT, quantised to 72 bands: smooth gradients show the faint contour banding of an 8-bit sensor */
  const BANDS = 72;
  const LUT = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const c = ramp(Math.round((i / 255) * (BANDS - 1)) / (BANDS - 1));
    LUT[i * 3] = c[0]; LUT[i * 3 + 1] = c[1]; LUT[i * 3 + 2] = c[2];
  }
  const idx = (t) => (t <= 0 ? 0 : t >= 1 ? 255 : (t * 255 + 0.5) | 0);
  const COLS = [];
  for (let i = 0; i < 64; i++) COLS.push(U.rgb(ramp(i / 63)));
  const col = (t) => COLS[clamp((t * 63 + 0.5) | 0, 0, 63)];
  const colA = (t, a) => U.rgb(ramp(t), a);
  const gray = (t, a) => {
    const v = Math.round(clamp(t, 0, 1) * 255);
    return a === undefined ? 'rgb(' + v + ',' + v + ',' + v + ')' : 'rgba(' + v + ',' + v + ',' + v + ',' + a + ')';
  };
  const UI = '#eef3ff'; // camera overlay line colour

  /* ================= temperature painting helpers (used at bake time only) ================= */
  function radial(c, x, y, r, t0, t1, mid) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, gray(t0));
    if (mid) g.addColorStop(mid[0], gray(mid[1]));
    g.addColorStop(1, gray(t1));
    return g;
  }
  function linear(c, x0, y0, x1, y1, t0, t1, a0, a1) {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, gray(t0, a0 === undefined ? 1 : a0));
    g.addColorStop(1, gray(t1, a1 === undefined ? 1 : a1));
    return g;
  }
  function fillT(c, s) { c.fillStyle = typeof s === 'number' ? gray(s) : s; c.fill(); }
  function strokeT(c, s, w) { c.strokeStyle = typeof s === 'number' ? gray(s) : s; c.lineWidth = w; c.stroke(); }
  function ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); }
  function circ(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, TAU); }
  function rrect(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
  }
  function poly(c, p) { c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.closePath(); }

  /* ================= heat pipeline ================= */
  function blurH(src, dst, w, h, r) {
    const iv = 1 / (2 * r + 1);
    for (let y = 0; y < h; y++) {
      const o = y * w;
      let acc = 0;
      for (let x = 0; x <= r && x < w; x++) acc += src[o + x];
      for (let x = 0; x < w; x++) {
        dst[o + x] = acc * iv;
        const xa = x + r + 1, xr = x - r;
        if (xa < w) acc += src[o + xa];
        if (xr >= 0) acc -= src[o + xr];
      }
    }
  }
  function blurV(src, dst, w, h, r) {
    const iv = 1 / (2 * r + 1);
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let y = 0; y <= r && y < h; y++) acc += src[y * w + x];
      for (let y = 0; y < h; y++) {
        dst[y * w + x] = acc * iv;
        const ya = y + r + 1, yr = y - r;
        if (ya < h) acc += src[ya * w + x];
        if (yr >= 0) acc -= src[yr * w + x];
      }
    }
  }
  /** 3 x box blur ≈ gaussian. Zero padding outside (= empty air). */
  function blur3(src, w, h, r) {
    const out = new Float32Array(src.length), tmp = new Float32Array(src.length);
    let a = src;
    for (let i = 0; i < 3; i++) { blurH(a, tmp, w, h, r); blurV(tmp, out, w, h, r); a = out; }
    return out;
  }
  /**
   * Paint a sprite as temperature and run the heat pipeline.
   * paint(ctx) draws grayscale shapes (gray = temperature, alpha = coverage) with the feet / anchor at (0,0).
   * l,t,r,b = extent around the anchor in world units (leave ~3x halo of margin).
   * o: diffuse (u), mix (0..1 diffusion), halo (u), haloA, haloT (halo temperature factor), limb (rim cooling), k (px/unit)
   */
  function heatMap(l, t, r, b, paint, o) {
    o = o || {};
    const k = o.k || K;
    const w = Math.ceil((l + r) * k), h = Math.ceil((t + b) * k);
    const { ctx } = U.canvas(w, h);
    ctx.setTransform(k, 0, 0, k, l * k, t * k);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    paint(ctx);
    const d = ctx.getImageData(0, 0, w, h).data;
    const N = w * h;
    const A = new Float32Array(N), TA = new Float32Array(N);
    for (let i = 0, j = 0; i < N; i++, j += 4) { const a = d[j + 3] / 255; A[i] = a; TA[i] = (d[j] / 255) * a; }
    const rd = Math.max(1, Math.round((o.diffuse === undefined ? 0.55 : o.diffuse) * k));
    const rh = Math.max(1, Math.round((o.halo === undefined ? 1.5 : o.halo) * k));
    const Ad = blur3(A, w, h, rd), TAd = blur3(TA, w, h, rd);
    const Ah = blur3(A, w, h, rh), TAh = blur3(TA, w, h, rh);
    const mixD = o.mix === undefined ? 0.5 : o.mix, limbK = o.limb === undefined ? 0.42 : o.limb;
    const haloA = o.haloA === undefined ? 0.62 : o.haloA, haloT = o.haloT === undefined ? 0.6 : o.haloT;
    const tin = new Float32Array(N), th = new Float32Array(N), ah = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const a = A[i];
      if (a > 0.003) {
        const t0 = TA[i] / a, tb = TAd[i] / Math.max(Ad[i], 1e-4);
        let ti = t0 + (tb - t0) * mixD;
        // limb cooling: surfaces seen at a grazing angle read colder -> every body gets a cooler rim = volume + separation
        const lb = 1 - Math.min(1, Ah[i] * 1.3);
        ti *= 1 - limbK * lb;
        tin[i] = ti;
      }
      const hA = Ah[i];
      if (hA > 0.003) {
        const tt = TAh[i] / hA;
        th[i] = tt * haloT;
        ah[i] = Math.min(1, hA * 1.7) * haloA * smooth(0.36, 0.8, tt); // only warm things radiate a halo
      }
    }
    return { w, h, N, k, tin, ain: A, th, ah, sw: w / k, sh: h / k, ax: (l * k) / w, ay: (t * k) / h };
  }
  /** Map a temperature map through the LUT with a transfer function f(t) and a halo multiplier. */
  function renderHeat(H, f, haloMul) {
    const { c, ctx } = U.canvas(H.w, H.h);
    const img = ctx.createImageData(H.w, H.h), d = img.data;
    const hm = haloMul === undefined ? 1 : haloMul;
    for (let i = 0, j = 0; i < H.N; i++, j += 4) {
      const a = H.ain[i], hh = H.ah[i] * hm * (1 - a), oa = a + hh;
      if (oa < 0.004) continue;
      let r = 0, g = 0, b = 0;
      if (a > 0.003) { const li = idx(f(H.tin[i])) * 3; r += LUT[li] * a; g += LUT[li + 1] * a; b += LUT[li + 2] * a; }
      if (hh > 0.001) { const li = idx(f(H.th[i])) * 3; r += LUT[li] * hh; g += LUT[li + 1] * hh; b += LUT[li + 2] * hh; }
      d[j] = r / oa; d[j + 1] = g / oa; d[j + 2] = b / oa; d[j + 3] = Math.min(255, oa * 255);
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }
  const F_NORMAL = (t) => t;
  const F_FLASH = (t) => t + (1 - t) * 0.86;          // white-hot impact flash
  const F_COLD = (t) => 0.1 + t * 0.34;              // cooled down: dying / not yet warm
  const F_AFTER = (t) => t * 0.74;                   // sensor afterimage (ghosting) behind fast movers
  /** Bake one sprite with the requested variants. */
  function bake(l, t, r, b, paint, o, variants) {
    const H = heatMap(l, t, r, b, paint, o);
    const s = { w: H.sw, h: H.sh, ax: H.ax, ay: H.ay };
    s.img = renderHeat(H, F_NORMAL, 1);
    for (const v of variants || []) {
      if (v === 'flash') s.flash = renderHeat(H, F_FLASH, 1.3);
      else if (v === 'cold') s.cold = renderHeat(H, F_COLD, 0.25);
      else if (v === 'after') s.after = renderHeat(H, F_AFTER, 0.6);
    }
    return s;
  }
  /** Character sprite in both facings: [right, left]. */
  function bakeChar(l, t, r, b, paint, o, variants) {
    const R = bake(l, t, r, b, paint, o, variants);
    const L = { w: R.w, h: R.h, ax: 1 - R.ax, ay: R.ay };
    for (const k of ['img', 'flash', 'cold', 'after']) if (R[k]) L[k] = U.flipX(R[k]);
    return [R, L];
  }
  function blit(ctx, s, img, x, y) { ctx.drawImage(img, x - s.ax * s.w, y - s.ay * s.h, s.w, s.h); }
  function blitS(ctx, s, img, x, y, sx, sy) {
    const w = s.w * sx, h = s.h * sy;
    ctx.drawImage(img, x - s.ax * w, y - s.ay * h, w, h);
  }

  /* ================= characters (painted facing right) ================= */
  /** Main character: small explorer in an insulated parka. Face = hottest spot, cold backpack = darkest. */
  function explorerPaint(c, ph, mode) {
    const a = ph * TAU, s = Math.sin(a), co = Math.cos(a);
    const walk = mode === 'walk', dash = mode === 'dash';
    const bob = walk ? -Math.abs(co) * 1.1 + 0.55 : 0;
    c.save();
    if (dash) { c.translate(0, -0.6); c.rotate(0.24); }
    const hipY = -9.6 + bob;
    const leg = (hx, p, tl, tb) => {
      let fx, fy;
      if (walk) { fx = hx + Math.sin(p) * 3.8; fy = -Math.max(0, -Math.cos(p)) * 1.9; }
      else if (dash) { fx = hx > 0 ? 5.4 : -4.8; fy = hx > 0 ? -2.4 : -0.6; }
      else { fx = hx * 1.5; fy = 0; }
      const kx = (hx + fx) / 2 + 1.0, ky = (hipY + fy) / 2;
      c.beginPath(); c.moveTo(hx, hipY); c.lineTo(kx, ky); c.lineTo(fx, fy - 1.4);
      strokeT(c, tl, 3.1);
      ell(c, fx + 0.9, fy - 1.0, 2.35, 1.3); fillT(c, tb);
    };
    const arm = (sx, sy, ang, tl, th) => {
      const ex = sx + Math.sin(ang) * 3.6, ey = sy + Math.cos(ang) * 3.6;
      const a2 = ang * 1.25 + 0.4;
      const hx = ex + Math.sin(a2) * 3.4, hy = ey + Math.cos(a2) * 3.4;
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.lineTo(hx, hy); strokeT(c, tl, 2.7);
      circ(c, hx, hy, 1.45); fillT(c, th);
    };
    const sy = -18.4 + bob;
    const sw = walk ? s * 0.8 : 0.12;
    arm(-0.7, sy, dash ? -1.3 : walk ? sw : -0.12, 0.52, 0.62);
    leg(-1.1, a + Math.PI, 0.5, 0.28);
    leg(1.1, a, 0.6, 0.32);
    // backpack: insulated and cold, the darkest shape of the figure (also shows the facing at a glance)
    rrect(c, -8.8, -23.4 + bob, 5.6, 11.8, 1.6); fillT(c, linear(c, 0, -23 + bob, 0, -11 + bob, 0.31, 0.23));
    ell(c, -5.9, -23.8 + bob, 3.7, 1.75); fillT(c, 0.2);
    ell(c, -5.9, -23.8 + bob, 3.7, 1.75); strokeT(c, 0.26, 0.4);
    // parka: heat leaks most at the chest
    c.beginPath();
    c.moveTo(-3.8, -20.6 + bob); c.quadraticCurveTo(0.5, -22.2 + bob, 4.4, -20.3 + bob);
    c.lineTo(5.5, -9.4 + bob); c.quadraticCurveTo(0.6, -8.0 + bob, -4.6, -9.3 + bob); c.closePath();
    fillT(c, radial(c, 2.0, -16.2 + bob, 8.8, 0.8, 0.58, [0.45, 0.7]));
    c.beginPath(); c.moveTo(-3.4, -19.9 + bob); c.lineTo(3.9, -10.8 + bob); strokeT(c, 0.42, 0.85); // pack strap
    c.beginPath(); c.moveTo(-4.4, -10.4 + bob); c.quadraticCurveTo(0.6, -9.2 + bob, 5.3, -10.5 + bob); strokeT(c, 0.47, 0.8); // hem
    // hood
    circ(c, 0.6, -24.7 + bob, 5.5); fillT(c, radial(c, 2.4, -24.4 + bob, 6.6, 0.7, 0.53));
    ell(c, 2.95, -24.3 + bob, 3.65, 4.15); strokeT(c, 0.76, 1.35); // fur ruff
    // face – the hottest spot of the whole figure
    ell(c, 3.05, -24.2 + bob, 2.75, 3.25); fillT(c, radial(c, 3.0, -24.8 + bob, 3.5, 1.0, 0.86));
    circ(c, 5.25, -23.8 + bob, 0.7); fillT(c, 0.79); // the nose tip is the coldest part of a face
    arm(1.4, sy + 0.3, dash ? -1.15 : walk ? -sw : 0.1, 0.64, 0.76);
    c.restore();
  }

  /** Small creature: a quilled ground critter. Hot chest + eye, cooler quill ridge, cold nose and tail tip. */
  function critterPaint(c, ph) {
    const a = ph * TAU, s = Math.sin(a);
    const bob = -Math.abs(s) * 0.8;
    const by = -7.4 + bob;
    // tail
    c.beginPath(); c.moveTo(-6.8, by + 0.4); c.quadraticCurveTo(-11.5, by - 0.2 + s * 0.6, -14.2, by - 4.6 + s * 1.2);
    strokeT(c, linear(c, -7, 0, -14, 0, 0.56, 0.3), 1.7);
    // legs: far pair cooler
    const leg = (hx, p, t) => {
      const fx = hx + Math.sin(p) * 1.9, fy = -Math.max(0, -Math.cos(p)) * 1.4;
      c.beginPath(); c.moveTo(hx, by + 2.6); c.lineTo(fx, fy - 0.5); strokeT(c, t, 1.7);
      ell(c, fx + 0.5, fy - 0.4, 1.2, 0.7); fillT(c, t - 0.08);
    };
    leg(-4.6, a + Math.PI, 0.46); leg(3.6, a, 0.46);
    leg(-2.6, a, 0.55); leg(5.6, a + Math.PI, 0.55);
    // body
    ell(c, 0, by, 8.2, 5.3); fillT(c, radial(c, 3.4, by - 0.4, 9.5, 0.82, 0.57, [0.5, 0.7]));
    // quill ridge (cooler keratin = darker spikes on top)
    c.beginPath();
    for (let i = 0; i <= 7; i++) {
      const u = i / 7, ang = Math.PI + 0.25 + u * 1.75;
      const x = Math.cos(ang) * 7.6, y = by + Math.sin(ang) * 4.9;
      const ox = Math.cos(ang) * 2.6 - 1.1, oy = Math.sin(ang) * 2.6 - 0.4;
      if (i === 0) c.moveTo(x, y);
      c.lineTo(x + ox, y + oy);
      const ang2 = ang + 0.125;
      c.lineTo(Math.cos(ang2) * 7.6, by + Math.sin(ang2) * 4.9);
    }
    c.lineTo(2, by - 3); c.lineTo(-6.5, by - 1); c.closePath();
    fillT(c, 0.46);
    // head
    circ(c, 7.3, by - 2.2, 3.9); fillT(c, radial(c, 7.0, by - 2.6, 4.4, 0.84, 0.66));
    ell(c, 10.6, by - 1.4, 2.1, 1.45); fillT(c, 0.72); // snout
    circ(c, 12.4, by - 1.5, 0.65); fillT(c, 0.55);    // cold nose
    poly(c, [5.2, by - 4.8, 5.4, by - 9.2, 7.6, by - 5.4]); fillT(c, 0.7);   // far ear
    poly(c, [6.6, by - 5.2, 7.9, by - 9.7, 9.0, by - 5.0]); fillT(c, 0.8);   // near ear
    circ(c, 8.9, by - 3.0, 0.95); fillT(c, 1.0);       // eye
  }

  /** Fast creature: a flickering wisp of hot gas with two cold eye holes. */
  function wispPaint(c, ph) {
    const a = ph * TAU;
    const N = 26, y0 = -9.5, y1 = -29;
    const R = [], L = [];
    for (let i = 0; i <= N; i++) {
      const v = i / N, y = y0 + (y1 - y0) * v;
      const hw = 5.7 * Math.pow(1 - v, 0.85);
      const sway = Math.sin(a + v * 2.4) * 1.9 * v * v;
      const rip = Math.sin(v * 11 - a * 2) * 0.85 * v * (1 - v) * 3.2;
      const rip2 = Math.sin(v * 13 - a * 2 + 2.1) * 0.85 * v * (1 - v) * 3.2;
      R.push(sway + hw + rip, y); L.push(sway - hw - rip2, y);
    }
    c.beginPath();
    c.arc(0, y0, 5.7, Math.PI, 0, true); // round bottom
    for (let i = 0; i < R.length; i += 2) c.lineTo(R[i], R[i + 1]);
    for (let i = L.length - 2; i >= 0; i -= 2) c.lineTo(L[i], L[i + 1]);
    c.closePath();
    const g = c.createRadialGradient(0, -11.5, 0, 0, -12.5, 17);
    g.addColorStop(0, gray(1)); g.addColorStop(0.28, gray(0.96)); g.addColorStop(0.6, gray(0.8)); g.addColorStop(1, gray(0.6));
    fillT(c, g);
    // side tongues
    for (const sd of [-1, 1]) {
      const sx = sd * 4.6, tw = Math.sin(a * 2 + sd) * 1.2;
      c.beginPath(); c.moveTo(sx - 1.6, -12); c.quadraticCurveTo(sx + sd * 2.6, -15.5, sx + sd * 2.4 + tw, -21 + Math.cos(a + sd) * 1.2);
      c.quadraticCurveTo(sx + sd * 0.2, -16, sx + 1.4 * -sd, -11); c.closePath(); fillT(c, 0.74);
    }
    // cold eye holes + small mouth: a face in a flame
    ell(c, -1.5, -13.2, 1.05, 1.55); fillT(c, 0.36);
    ell(c, 2.5, -13.2, 1.05, 1.55); fillT(c, 0.36);
    ell(c, 0.9, -9.6, 0.9, 0.7); fillT(c, 0.6);
  }

  /** Large creature: a hulking knuckle-walker seen from the front, white-hot furnace core in the chest,
      glowing fissures, cooler fur on the shoulders, long arms with warm fists planted on the ground. */
  function brutePaint(c, ph) {
    const a = ph * TAU, s = Math.sin(a);
    const B = -Math.abs(s) * 1.3 + 0.65;
    const lift = (p) => Math.max(0, p) * 2.8;
    // legs: short, wide stance
    const leg = (hx, p, t) => {
      const fx = hx * 1.12 + Math.sin(p) * 1.6, fy = -lift(Math.sin(p));
      c.beginPath(); c.moveTo(hx, -15 + B); c.lineTo(fx, fy - 2.2); strokeT(c, t, 7.4);
      ell(c, fx + 0.6, fy - 1.5, 4.6, 2.2); fillT(c, t - 0.1);
    };
    leg(-6, a + Math.PI, 0.52); leg(6.5, a, 0.58);
    // arms: hanging outside the body, fists on the ground, swinging alternately (knuckle walk)
    const arm = (side, p, t) => {
      const sw = Math.sin(p);
      const sx = side * 12.5, sy = -39 + B;
      const ex = side * 19.2, ey = -23 + B * 0.5 - sw * 1.5;
      const fx = side * 18.4 + sw * 1.8, fy = -5 - lift(sw);
      c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(ex + side * 1.2, ey, fx, fy);
      strokeT(c, linear(c, 0, sy, 0, fy, t + 0.06, t - 0.04), 7.2);
      ell(c, fx, fy + 0.6, 4.4, 3.6); fillT(c, t + 0.08); // warm knuckles
    };
    // torso: wide shoulders, narrower hips
    c.beginPath();
    c.moveTo(-9, -11 + B);
    c.bezierCurveTo(-15.5, -20 + B, -18.5, -34 + B, -13, -42 + B);
    c.quadraticCurveTo(0.5, -50 + B, 14, -42 + B);
    c.bezierCurveTo(19.5, -34 + B, 16.5, -20 + B, 10, -11 + B);
    c.quadraticCurveTo(0.5, -7.5 + B, -9, -11 + B);
    c.closePath();
    fillT(c, radial(c, 1.5, -27 + B, 22, 0.8, 0.55, [0.42, 0.69]));
    arm(-1, a, 0.52);
    arm(1, a + Math.PI, 0.6);
    // shaggy, cooler fur on the shoulders and flanks
    for (let i = 0; i < 9; i++) {
      const u = i / 8, x = -14 + u * 29, y = -41.5 + Math.pow(Math.abs(u - 0.5) * 2, 2) * 6 + B;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + (u - 0.5) * 3, y + 3, x + (u - 0.5) * 4.4, y + 6.5); strokeT(c, gray(0.5, 0.85), 1.7);
    }
    for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) {
      const x = sd * (14 - i * 0.6), y = -33 + i * 7 + B;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - sd * 1.8, y + 2.6, x - sd * 1.2, y + 5); strokeT(c, gray(0.5, 0.8), 1.4);
    }
    // furnace core + fissures
    const cx = 1.5, cy = -27 + B;
    const cg = c.createRadialGradient(cx, cy, 0, cx, cy, 9);
    cg.addColorStop(0, gray(1)); cg.addColorStop(0.32, gray(0.98)); cg.addColorStop(0.68, gray(0.88, 0.7)); cg.addColorStop(1, gray(0.8, 0));
    circ(c, cx, cy, 9); fillT(c, cg);
    const fis = [[0, 0, 4, -6, 3, -11, 6, -14], [0, 0, -4, -5, -8, -7, -10, -12], [0, 0, -6, 2, -10, 6], [0, 0, 5, 3, 9, 4, 11, 9], [0, 0, 1, 7, -1, 12]];
    for (const f of fis) {
      c.beginPath(); c.moveTo(cx + f[0], cy + f[1]);
      for (let i = 2; i < f.length; i += 2) c.lineTo(cx + f[i], cy + f[i + 1]);
      strokeT(c, gray(0.92, 0.9), 1.0);
    }
    // head sunk between the shoulders, turned slightly to the facing side
    const hx = 2.6, hy = -43.5 + B;
    circ(c, hx, hy, 6.2); fillT(c, radial(c, hx + 0.5, hy + 0.5, 6.5, 0.84, 0.64));
    c.beginPath(); c.moveTo(hx - 4.8, hy - 1.8); c.quadraticCurveTo(hx + 0.4, hy - 4.6, hx + 5.4, hy - 1.8); strokeT(c, 0.58, 1.8); // heavy brow
    circ(c, hx - 1.9, hy - 0.4, 1.05); fillT(c, 1.0);
    circ(c, hx + 2.9, hy - 0.4, 1.05); fillT(c, 1.0);
    c.beginPath(); c.moveTo(hx - 2.6, hy + 3.4); c.quadraticCurveTo(hx + 0.5, hy + 5.0, hx + 3.6, hy + 3.4); strokeT(c, 0.98, 1.5); // hot mouth
  }

  /* ================= effects sprites ================= */
  function shardPaint(c, tc) {
    poly(c, [0, -11, 3.0, -6.2, 0, -1.4, -3.0, -6.2]);
    fillT(c, radial(c, -0.6, -7.2, 5.6, tc, tc - 0.2));
    c.beginPath(); c.moveTo(0, -11); c.lineTo(0, -1.4); strokeT(c, gray(tc - 0.12, 0.7), 0.4);
  }
  function cellPaint(c, tc) {
    c.beginPath();
    for (let i = 0; i < 6; i++) { const an = i / 6 * TAU + Math.PI / 6; const x = Math.cos(an) * 5.2, y = -8 + Math.sin(an) * 5.2; if (i) c.lineTo(x, y); else c.moveTo(x, y); }
    c.closePath(); fillT(c, radial(c, 0, -8.5, 6, tc, tc - 0.2));
    c.beginPath();
    for (let i = 0; i < 6; i++) { const an = i / 6 * TAU + Math.PI / 6; const x = Math.cos(an) * 2.9, y = -8 + Math.sin(an) * 2.9; if (i) c.lineTo(x, y); else c.moveTo(x, y); }
    c.closePath(); strokeT(c, gray(tc - 0.14), 0.6);
  }
  function headPaint(c) { circ(c, 0, 0, 2.3); fillT(c, radial(c, 0.3, -0.3, 2.5, 1.0, 0.9)); }
  function trailPaint(c) {
    c.beginPath(); c.moveTo(-26, 0); c.lineTo(0, -2.0); c.quadraticCurveTo(1.2, 0, 0, 2.0); c.closePath();
    const g = c.createLinearGradient(-26, 0, 0, 0);
    g.addColorStop(0, gray(0.4, 0)); g.addColorStop(0.45, gray(0.66, 0.45)); g.addColorStop(1, gray(0.97, 1));
    fillT(c, g);
  }
  function orbPaint(c) {
    circ(c, 0, 0, 3.4); fillT(c, radial(c, 0.6, -0.7, 3.6, 1.0, 0.84));
    ell(c, 0, 0, 5.6, 1.9, -0.3); strokeT(c, gray(0.72, 0.9), 0.7);
  }

  /* ================= props (cold shapes with residual warmth) ================= */
  function contact(c, rx, ry, t, a) {
    const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, gray(t, a)); g.addColorStop(1, gray(t * 0.9, 0));
    c.save(); c.scale(1, ry / rx); circ(c, 0, 0, rx); fillT(c, g); c.restore();
  }
  function boulderPaint(c, v) {
    const rng = U.rng(77 + v * 13);
    const sc = v ? 0.68 : 1.15;
    contact(c, 17 * sc, 6 * sc, 0.31, 0.8);
    const pts = [];
    const n = 11;
    for (let i = 0; i < n; i++) {
      const an = Math.PI + (i / (n - 1)) * Math.PI;
      const rr = 1 + rng.range(-0.1, 0.12);
      pts.push(Math.cos(an) * 12.5 * rr * sc, -1 + Math.sin(an) * 12 * rr * sc);
    }
    pts.push(12 * sc, 0.6, -12 * sc, 0.6);
    poly(c, pts);
    fillT(c, radial(c, -2 * sc, -9 * sc, 15 * sc, 0.46, 0.27, [0.5, 0.37]));
    // cracks
    c.beginPath(); c.moveTo(-3 * sc, -11 * sc); c.lineTo(-1 * sc, -6 * sc); c.lineTo(-4 * sc, -2 * sc);
    c.moveTo(5 * sc, -9 * sc); c.lineTo(7 * sc, -4 * sc); strokeT(c, 0.22, 0.6 * sc + 0.2);
    if (!v) {
      // a warm handprint: someone leaned on this rock a minute ago
      c.save(); c.translate(4, -9.5); c.rotate(-0.25); c.scale(1.25, 1.25);
      ell(c, 0, 0, 1.9, 2.2); fillT(c, gray(0.6, 0.95));
      for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-1.3 + i * 0.9, -1.4); c.lineTo(-1.7 + i * 1.05, -4.3 + Math.abs(i - 1.5) * 0.5); strokeT(c, gray(0.58, 0.9), 0.8); }
      c.beginPath(); c.moveTo(1.6, 0.2); c.lineTo(3.4, -1.2); strokeT(c, gray(0.58, 0.9), 0.8);
      c.restore();
    }
  }
  function pinePaint(c, v) {
    const rng = U.rng(310 + v * 29);
    const H = v ? 46 : 56, Wd = v ? 13 : 15.5;
    contact(c, 19, 7.5, 0.4, 0.85); // canopy blocks radiative cooling -> warmer ground under the tree
    c.beginPath(); c.moveTo(-1.6, 0); c.lineTo(-1.1, -12); c.lineTo(1.1, -12); c.lineTo(1.6, 0); c.closePath(); fillT(c, 0.38);
    const tiers = 5;
    for (let i = 0; i < tiers; i++) {
      const u = i / tiers;
      const yb = -8 - u * (H - 14), yt = yb - H * 0.36;
      const w = Wd * (1 - u * 0.72);
      const pts = [];
      const n = 9;
      for (let j = 0; j <= n; j++) {
        const x = -w + (2 * w * j) / n;
        pts.push(x, yb + (j % 2 ? -1.8 : rng.range(0, 1.2)));
      }
      pts.push(rng.range(-0.6, 0.6), yt);
      poly(c, pts);
      // tips of the crown radiate to the cold sky (coldest); the lower edge of each tier keeps a little warmth
      fillT(c, linear(c, 0, yt, 0, yb, 0.03 + u * 0.01, 0.14 - u * 0.03));
      c.beginPath(); c.moveTo(-w * 0.9, yb - 0.6); c.lineTo(w * 0.9, yb - 0.6); strokeT(c, gray(0.2 - u * 0.03, 0.8), 0.7);
    }
  }
  function deadTreePaint(c) {
    const rng = U.rng(4401);
    contact(c, 9, 3.6, 0.27, 0.6);
    const br = (x, y, ang, len, w, d) => {
      const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); strokeT(c, 0.08 + w * 0.045, w);
      if (d <= 0) return;
      const n = d > 2 ? 2 : rng.int(1, 2);
      for (let i = 0; i < n; i++) br(x2, y2, ang + rng.range(-0.75, 0.75), len * rng.range(0.55, 0.78), w * 0.62, d - 1);
    };
    br(0, 0, -Math.PI / 2 + 0.05, 17, 3.0, 4);
    c.beginPath(); c.moveTo(-2, 0); c.lineTo(2, 0); c.lineTo(1, -6); c.lineTo(-1, -6); c.closePath(); fillT(c, 0.29);
  }
  function pipePaint(c) {
    contact(c, 36, 6, 0.36, 0.8);
    // legs into the ground at both ends (the pipe dives into the soil)
    for (const sx of [-31, 31]) { c.beginPath(); c.moveTo(sx, -9); c.lineTo(sx, 0); strokeT(c, linear(c, 0, -10, 0, 0, 0.66, 0.5), 6.4); }
    // support trestles (cold steel)
    for (const sx of [-14, 14]) { c.beginPath(); c.moveTo(sx - 3, 0); c.lineTo(sx, -7); c.lineTo(sx + 3, 0); strokeT(c, 0.24, 1.1); }
    // main run, cylinder: top hotter than bottom
    rrect(c, -34, -13.4, 68, 6.8, 3.2); fillT(c, linear(c, 0, -13.4, 0, -6.6, 0.72, 0.6));
    // insulated sleeves are cooler
    for (const [x0, x1] of [[-24, -9], [7, 22]]) { rrect(c, x0, -14.0, x1 - x0, 8, 2.2); fillT(c, linear(c, 0, -14, 0, -6, 0.5, 0.44)); }
    // flanges: hottest metal (thermal bridges)
    for (const fx of [-27, -4.5, 24.5]) { rrect(c, fx - 1.1, -15.0, 2.2, 10, 0.8); fillT(c, 0.84); }
    // valve wheel
    c.beginPath(); c.moveTo(1.5, -13.4); c.lineTo(1.5, -18.5); strokeT(c, 0.66, 1.2);
    ell(c, 1.5, -19.6, 3.4, 1.2); strokeT(c, 0.76, 0.9);
  }
  function ventPaint(c) {
    contact(c, 11, 4, 0.4, 0.8);
    rrect(c, -5.2, -2, 10.4, 2.6, 0.6); fillT(c, 0.3); // base plate
    rrect(c, -3.6, -23, 7.2, 22, 1.2); fillT(c, linear(c, 0, -23, 0, 0, 0.66, 0.46));
    for (const y of [-17, -10]) { rrect(c, -4.1, y - 0.8, 8.2, 1.6, 0.6); fillT(c, 0.58); } // seams
    rrect(c, -4.3, -24.4, 8.6, 2, 0.6); fillT(c, 0.86); // hot rim
    ell(c, 0, -23.8, 3.2, 0.9); fillT(c, 1.0); // glowing throat
    c.beginPath(); c.moveTo(-6.4, -27.4); c.lineTo(0, -31.4); c.lineTo(6.4, -27.4); c.closePath(); fillT(c, 0.62); // rain hat
    c.beginPath(); c.moveTo(-2.2, -24.4); c.lineTo(-2.2, -27.6); c.moveTo(2.2, -24.4); c.lineTo(2.2, -27.6); strokeT(c, 0.6, 0.6);
  }
  function transformerPaint(c) {
    contact(c, 15, 5, 0.37, 0.8);
    rrect(c, -11, -2.5, 22, 3, 0.6); fillT(c, 0.22); // concrete pad: cold
    rrect(c, -8.5, -20, 17, 18, 1.4); fillT(c, radial(c, 0, -12, 14, 0.62, 0.5));
    for (let i = 0; i < 6; i++) { const x = -7 + i * 2.8; c.beginPath(); c.moveTo(x, -18.5); c.lineTo(x, -4); strokeT(c, i % 2 ? 0.48 : 0.6, 1.0); } // fins
    rrect(c, -9.2, -21.6, 18.4, 2.2, 0.6); fillT(c, 0.55); // lid
    for (const bx of [-5, 0, 5]) {
      for (let k = 0; k < 3; k++) { ell(c, bx, -23 - k * 1.7, 1.5 - k * 0.15, 0.6); fillT(c, 0.5 + k * 0.08); }
      circ(c, bx, -28.4, 0.9); fillT(c, bx === 5 ? 1.0 : 0.82); // one connector runs hot: a fault
    }
  }
  function fencePaint(c, v) {
    contact(c, 22, 3, 0.25, 0.4);
    const posts = [-19, 0, 19];
    for (const px of posts) { rrect(c, px - 1.1, -16, 2.2, 16.4, 0.5); fillT(c, linear(c, 0, -16, 0, 0, 0.13, 0.19)); }
    for (const wy of [-13, -7.5]) {
      c.beginPath(); c.moveTo(-19, wy); c.quadraticCurveTo(-9.5, wy + 1.6, 0, wy); c.quadraticCurveTo(9.5, wy + 1.6, 19, wy);
      strokeT(c, 0.2, 0.5);
    }
    if (v) {
      // a small bird sits on the middle post: a tiny hot dot in a cold scene
      ell(c, 0.6, -18.8, 2.4, 1.8, -0.2); fillT(c, radial(c, 1, -19.2, 2.8, 0.9, 0.72));
      circ(c, 2.6, -20.4, 1.2); fillT(c, 0.86);
      c.beginPath(); c.moveTo(-1.6, -18.4); c.lineTo(-4.2, -17.4); strokeT(c, 0.6, 0.8);
    }
  }
  function embersPaint(c, v) {
    const rng = U.rng(900 + v * 7);
    c.scale(1.3, 1.3);
    contact(c, 13, 5, 0.42, 0.85);
    ell(c, 0, -2.2, 7.4, 3.2); fillT(c, radial(c, 0, -2.6, 7.6, 0.9, 0.62, [0.55, 0.8]));
    // charred logs with glowing ends
    const logs = [[-6, -1, 5, -4], [-4, -4.6, 6, -0.4]];
    for (const [x0, y0, x1, y1] of logs) {
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); strokeT(c, 0.5, 1.9);
      circ(c, x1, y1, 1.0); fillT(c, 0.95);
    }
    // embers: hot points that move between frames
    for (let i = 0; i < 7; i++) { circ(c, rng.range(-5, 5), rng.range(-4.2, -0.6), rng.range(0.4, 0.9)); fillT(c, rng.range(0.92, 1)); }
    // ring of stones (they kept the warmth)
    for (let i = 0; i < 9; i++) {
      const an = (i / 9) * TAU + 0.2;
      ell(c, Math.cos(an) * 8.4, -2.2 + Math.sin(an) * 3.9, 2.0, 1.4); fillT(c, Math.sin(an) > 0 ? 0.42 : 0.36);
    }
  }

  /* ================= ground: temperature field ================= */
  const GS = 4; // field grid step in world units
  const PIPE_CELL = 760;
  const WC = {};
  const ROAD_H = 1300, ROAD_V = 1500;
  /** Distance to the nearest road centreline (gently curving roads on a sparse world grid). */
  function roadDist(x, y) {
    let best = 1e9;
    const j0 = Math.round(y / ROAD_H);
    for (let j = j0 - 1; j <= j0 + 1; j++) {
      if (U.hash2(j, 0, 501) > 0.72) continue;
      const ph = U.hash2(j, 1, 502) * TAU, base = j * ROAD_H + (U.hash2(j, 2, 503) - 0.5) * 360;
      const f = base + Math.sin(x / 420 + ph) * 120 + Math.sin(x / 170 + ph * 2) * 24;
      const df = (Math.cos(x / 420 + ph) * 120) / 420 + (Math.cos(x / 170 + ph * 2) * 24) / 170;
      const d = Math.abs(y - f) / Math.sqrt(1 + df * df);
      if (d < best) best = d;
    }
    const i0 = Math.round(x / ROAD_V);
    for (let i = i0 - 1; i <= i0 + 1; i++) {
      if (U.hash2(i, 0, 511) > 0.55) continue;
      const ph = U.hash2(i, 1, 512) * TAU, base = i * ROAD_V + 520 + (U.hash2(i, 2, 513) - 0.5) * 300;
      const f = base + Math.sin(y / 380 + ph) * 110 + Math.sin(y / 150 + ph * 2) * 20;
      const df = (Math.cos(y / 380 + ph) * 110) / 380 + (Math.cos(y / 150 + ph * 2) * 20) / 150;
      const d = Math.abs(x - f) / Math.sqrt(1 + df * df);
      if (d < best) best = d;
    }
    return best;
  }
  /**
   * Raw (smooth) fields at a world position: base temperature, field-cell offset + furrow direction, distance to the
   * cell border, road distance, water level, wall-ness. The chunk renderer samples them on a 4-unit grid and
   * interpolates; the thresholds that make crisp edges (hedge, wall, road, water line) are applied per pixel.
   */
  function field(x, y, o) {
    const base = U.fbm(x / 340, y / 340, 11, 3);
    const det = U.fbm(x / 64 + 3.1, y / 64 - 1.7, 23, 2);
    let T = 0.19 + (base - 0.5) * 0.18 + (det - 0.5) * 0.065;
    const hol = U.fbm(x / 190 - 7, y / 190 + 2, 51, 2);
    T -= smooth(0.6, 0.72, hol) * 0.05; // cold, damp hollows
    // patchwork of field cells (Worley): meadow, ploughed furrows, dry stubble (warmer), wet field (colder)
    U.worley(x / 380 + (det - 0.5) * 0.05, y / 380 + (base - 0.5) * 0.05, 91, 0, WC);
    const kind = WC.id % 100;
    const type = kind < 34 ? 0 : kind < 62 ? 1 : kind < 82 ? 2 : 3;
    const ang = (((WC.id >>> 8) & 1023) / 1023) * Math.PI;
    o.off = type === 0 ? 0 : type === 1 ? 0.018 : type === 2 ? 0.075 : -0.06;
    o.plow = type === 1 ? 1 : 0; o.cs = Math.cos(ang); o.sn = Math.sin(ang); o.type = type;
    o.border = WC.f2 - WC.f1;
    o.rd = roadDist(x, y);
    o.wf = U.fbm(x / 600 + 11, y / 600 - 5, 83, 3);
    o.wall = U.fbm(x / 520 - 3, y / 520 + 8, 97, 2);
    o.T = T;
    return derive(o);
  }
  const ROAD_W = 10, SHOULDER_W = 14;
  /** Crisp masks from the raw fields (used by props and decals; the pixel loop inlines the same thresholds). */
  function derive(o) {
    o.isWall = o.wall > 0.54;
    o.hedge = 1 - smooth(0.014, 0.034, o.border);
    o.road = 1 - smooth(ROAD_W - 1, ROAD_W + 0.5, o.rd);
    o.shoulder = (1 - smooth(SHOULDER_W - 1, SHOULDER_W, o.rd)) * (1 - o.road);
    o.water = smooth(0.668, 0.675, o.wf);
    o.shore = smooth(0.628, 0.668, o.wf) * (1 - o.water);
    return o;
  }  /** Buried heating pipes: axis-aligned segments on a coarse world grid. */
  function pipeSegs(x0, y0, x1, y1, out) {
    const C = PIPE_CELL;
    for (let i = Math.floor(x0 / C) - 1; i <= Math.floor(x1 / C) + 1; i++) {
      const px = i * C + 120 + U.hash2(i, 0, 401) * 360;
      if (px < x0 - 30 || px > x1 + 30) continue;
      for (let j = Math.floor(y0 / C) - 1; j <= Math.floor(y1 / C) + 1; j++) {
        if (!((i === 0 && (j === 0 || j === -1)) || U.hash2(i, j, 402) < 0.42)) continue;
        const a = j * C, b = a + C;
        if (b < y0 - 30 || a > y1 + 30) continue;
        out.push({ v: 1, c: px, a, b });
      }
    }
    for (let j = Math.floor(y0 / C) - 1; j <= Math.floor(y1 / C) + 1; j++) {
      const py = j * C + 160 + U.hash2(0, j, 403) * 320;
      if (py < y0 - 30 || py > y1 + 30) continue;
      for (let i = Math.floor(x0 / C) - 1; i <= Math.floor(x1 / C) + 1; i++) {
        if (U.hash2(i, j, 404) >= 0.34) continue;
        const a = i * C, b = a + C;
        if (b < x0 - 30 || a > x1 + 30) continue;
        out.push({ v: 0, c: py, a, b });
      }
    }
    return out;
  }
  function segDist(s, x, y) {
    const along = s.v ? y : x, across = s.v ? x : y;
    const dc = across - s.c;
    const da = along < s.a ? s.a - along : along > s.b ? along - s.b : 0;
    return Math.sqrt(dc * dc + da * da);
  }
  function pipeDist(segs, x, y) { let d = 1e9; for (const s of segs) d = Math.min(d, segDist(s, x, y)); return d; }

  /* tileable fine noise (period 128 world units) */
  const NT = 128;
  let NOISE = null;
  function noiseTile() {
    if (NOISE) return NOISE;
    NOISE = new Float32Array(NT * NT);
    for (let y = 0; y < NT; y++) for (let x = 0; x < NT; x++) NOISE[y * NT + x] = (U.fbmTile(x / 16, y / 16, 8, 1777, 3) - 0.5) * 2;
    return NOISE;
  }
  function nsample(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const x0 = xi & (NT - 1), y0 = yi & (NT - 1), x1 = (x0 + 1) & (NT - 1), y1 = (y0 + 1) & (NT - 1);
    const a = NOISE[y0 * NT + x0], b = NOISE[y0 * NT + x1], c = NOISE[y1 * NT + x0], d = NOISE[y1 * NT + x1];
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }
  /* the fine noise is periodic (128 u and 32 u), so for a given chunk resolution it is precomputed once as pixel
     tables shared by all chunks; resolutions without an integer pixel period fall back to direct sampling */
  let NTAB = null;
  function noiseTables(res) {
    if (NTAB && NTAB.res === res) return NTAB;
    const P1 = 128 * res, P2 = 32 * res;
    if (Math.abs(P1 - Math.round(P1)) > 1e-6 || Math.abs(P2 - Math.round(P2)) > 1e-6) { NTAB = { res, ok: false }; return NTAB; }
    const p1 = Math.round(P1), p2 = Math.round(P2);
    const t1 = new Float32Array(p1 * p1), t2 = new Float32Array(p2 * p2);
    for (let y = 0; y < p1; y++) for (let x = 0; x < p1; x++) t1[y * p1 + x] = nsample((x + 0.5) / res, (y + 0.5) / res);
    for (let y = 0; y < p2; y++) for (let x = 0; x < p2; x++) t2[y * p2 + x] = nsample(((x + 0.5) / res) * 4 + 17, ((y + 0.5) / res) * 4 - 9);
    NTAB = { res, ok: true, p1, p2, t1, t2 };
    return NTAB;
  }
  /** Add dT * falloff inside a (rotated) world-space ellipse to the chunk's temperature buffer. */
  function stamp(TB, info, x, y, rx, ry, rot, dT, hard) {
    const res = info.res, W = info.px;
    const R = Math.max(rx, ry) * res + 1;
    const cx = (x - info.wx) * res, cy = (y - info.wy) * res;
    const x0 = Math.max(0, Math.floor(cx - R)), x1 = Math.min(W - 1, Math.ceil(cx + R));
    const y0 = Math.max(0, Math.floor(cy - R)), y1 = Math.min(W - 1, Math.ceil(cy + R));
    if (x0 > x1 || y0 > y1) return;
    const cs = Math.cos(rot || 0), sn = Math.sin(rot || 0), irx = 1 / rx, iry = 1 / ry;
    for (let py = y0; py <= y1; py++) {
      const wy = (py + 0.5) / res + info.wy - y;
      for (let px = x0; px <= x1; px++) {
        const wx = (px + 0.5) / res + info.wx - x;
        const u = (wx * cs + wy * sn) * irx, v = (-wx * sn + wy * cs) * iry;
        const q = u * u + v * v;
        if (q >= 1) continue;
        TB[py * W + px] += dT * (hard ? 1 - q * q * q : (1 - q) * (1 - q));
      }
    }
  }

  /* ---- ground job: plain functions (fast, optimisable), driven in row batches by the generator ---- */
  const GKEYS = ['T', 'off', 'plow', 'cs', 'sn', 'border', 'rd', 'wf', 'wall'];
  function groundJob(info) {
    noiseTile();
    const gw = Math.ceil(info.size / GS) + 3, GN = gw * gw;
    return { info, gw, GN, grid: GKEYS.map(() => new Float32Array(GN)), o: {}, W: info.px, TB: new Float32Array(info.px * info.px) };
  }
  function gridRows(J, gy0, gy1) {
    const { info, gw, grid, o } = J;
    for (let gy = gy0; gy < gy1; gy++) {
      for (let gx = 0; gx < gw; gx++) {
        field(info.wx + (gx - 1) * GS, info.wy + (gy - 1) * GS, o);
        const i = gy * gw + gx;
        for (let k = 0; k < GKEYS.length; k++) grid[k][i] = o[GKEYS[k]];
      }
    }
  }
  function groundPrep(J) {
    const { info, gw, GN, grid } = J;
    const [, , gP, , , gB, gR, gF] = grid;
    // per grid cell: which features can touch it (so open-field pixels skip the edge math)
    const FL = new Uint8Array(GN);
    for (let gy = 0; gy < gw - 1; gy++) for (let gx = 0; gx < gw - 1; gx++) {
      const a = gy * gw + gx, b = a + 1, c = a + gw, d = c + 1;
      let f = 0;
      if (Math.max(gP[a], gP[b], gP[c], gP[d]) > 0.02) f |= 1;
      if (Math.min(gB[a], gB[b], gB[c], gB[d]) < 0.043) f |= 2;
      if (Math.min(gR[a], gR[b], gR[c], gR[d]) < SHOULDER_W) f |= 4;
      if (Math.max(gF[a], gF[b], gF[c], gF[d]) > 0.628) f |= 8;
      FL[a] = f;
    }
    J.FL = FL;
    J.segs = pipeSegs(info.wx - 40, info.wy - 40, info.wx + info.size + 40, info.wy + info.size + 40, []);
  }
  const smq = (e0, e1, v) => { if (v <= e0) return 0; if (v >= e1) return 1; const t = (v - e0) / (e1 - e0); return t * t * (3 - 2 * t); };
  const modp = (a, b) => ((a % b) + b) % b;
  /** Per pixel: interpolate the raw fields, apply the crisp masks, add fine noise and buried pipes. */
  function groundRows(J, py0, py1) {
    const { info, gw, FL, segs, TB, W } = J;
    const res = info.res, wx = info.wx, wy = info.wy;
    const inv = 1 / (res * GS);
    const [gT, gO, gP, gC, gS, gB, gR, gF, gL] = J.grid;
    const sm = smq;
    const NT_ = noiseTables(res), tab = NT_.ok;
    const p1 = tab ? NT_.p1 : 1, p2 = tab ? NT_.p2 : 1;
    const ox1 = tab ? modp(Math.round(wx * res), p1) : 0, oy1 = tab ? modp(Math.round(wy * res), p1) : 0;
    const ox2 = tab ? modp(Math.round(wx * res), p2) : 0, oy2 = tab ? modp(Math.round(wy * res), p2) : 0;
  for (let py = py0; py < py1; py++) {
      const y = wy + (py + 0.5) / res;
      const gyf = (py + 0.5) * inv + 1, gy0 = gyf | 0, fy = gyf - gy0;
      const r1 = tab ? ((oy1 + py) % p1) * p1 : 0, r2 = tab ? ((oy2 + py) % p2) * p2 : 0;
      let c1 = ox1, c2 = ox2;
      for (let px = 0; px < W; px++) {
        const x = wx + (px + 0.5) / res;
        const gxf = (px + 0.5) * inv + 1, gx0 = gxf | 0, fx = gxf - gx0;
        const i00 = gy0 * gw + gx0, i10 = i00 + 1, i01 = i00 + gw, i11 = i01 + 1;
        const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
        let n1, n2;
        if (tab) {
          n1 = NT_.t1[r1 + c1]; n2 = NT_.t2[r2 + c2];
          if (++c1 === p1) c1 = 0;
          if (++c2 === p2) c2 = 0;
        } else { n1 = nsample(x, y); n2 = nsample(x * 4 + 17, y * 4 - 9); }
        let T = (gT[i00] + gO[i00]) * w00 + (gT[i10] + gO[i10]) * w10 + (gT[i01] + gO[i01]) * w01 + (gT[i11] + gO[i11]) * w11;
        const fl = FL[i00];
        const plow = fl & 1 ? gP[i00] * w00 + gP[i10] * w10 + gP[i01] * w01 + gP[i11] * w11 : 0;
        if (plow > 0.02) {
          const cs = gC[i00] * w00 + gC[i10] * w10 + gC[i01] * w01 + gC[i11] * w11;
          const sn = gS[i00] * w00 + gS[i10] * w10 + gS[i01] * w01 + gS[i11] * w11;
          T += plow * Math.sin((x * cs + y * sn) * 0.97) * 0.05; // furrows: ridges warm, troughs cold
        }
        T += n1 * 0.034 + n2 * 0.017;
        // field borders: cold bumpy hedgerows, or warm dry-stone walls with cold flanks
        const bd = fl & 2 ? gB[i00] * w00 + gB[i10] * w10 + gB[i01] * w01 + gB[i11] * w11 + n2 * 0.006 : 1;
        if (bd < 0.036) {
          const wl = gL[i00] * w00 + gL[i10] * w10 + gL[i01] * w01 + gL[i11] * w11;
          if (wl > 0.54) {
            const core = 1 - sm(0.006, 0.011, bd), flank = (1 - sm(0.014, 0.022, bd)) * (1 - core);
            T += (0.125 - T) * flank * 0.7;
            T += (0.34 + n1 * 0.05 + n2 * 0.045 - T) * core;
          } else {
            const h = 1 - sm(0.014, 0.034, bd);
            T += (0.098 + n1 * 0.05 + n2 * 0.035 - T) * h * 0.88;
          }
        }
        // road: warm asphalt, cold gravel shoulders, two slightly warmer wheel tracks
        const rd = fl & 4 ? gR[i00] * w00 + gR[i10] * w10 + gR[i01] * w01 + gR[i11] * w11 : 1e3;
        if (rd < SHOULDER_W) {
          const road = 1 - sm(ROAD_W - 1, ROAD_W + 0.5, rd), sh = (1 - sm(SHOULDER_W - 1, SHOULDER_W, rd)) * (1 - road);
          const rut = (1 - sm(1.2, 2.0, Math.abs(rd - 5.2))) * road;
          T += (0.2 + n2 * 0.02 - T) * sh * 0.75;
          T += (0.345 + rut * 0.032 + n2 * 0.012 + n1 * 0.012 - T) * road;
        }
        // water: cold, flat, nearly textureless; faint warmer line at the waterline
        const wf = fl & 8 ? gF[i00] * w00 + gF[i10] * w10 + gF[i01] * w01 + gF[i11] * w11 : 0;
        if (wf > 0.628) {
          const water = sm(0.668, 0.675, wf), shore = sm(0.628, 0.668, wf) * (1 - water);
          const rim = sm(0.662, 0.668, wf) * (1 - sm(0.672, 0.677, wf));
          T -= shore * 0.04;
          T += (0.1 + Math.sin(y * 0.95 + Math.sin(x * 0.045) * 3) * 0.007 + n2 * 0.006 - T) * water;
          T += rim * 0.045;
          if (water > 0.5) { TB[py * W + px] = T; continue; }
        }
        for (let s = 0; s < segs.length; s++) {
          const d = segDist(segs[s], x, y);
          if (d < 22) T += 0.07 * Math.exp(-d * d / 14) + 0.03 * Math.exp(-d * d / 150);
        }
        TB[py * W + px] = T;
      }
    }
  }

  /* ================= runtime state ================= */
  let HERO = null, CRIT = null, WISP = null, BRUTE = null, GEMS = null, GEMB = null, HEAD = null, TRAIL = null, ORB = null;
  let PROPS = null, PUFF = null, CONTACT = null, COLUMN = null, NUM = null, numCheck = 0;
  let GRAIN = null, GRAINPAT = null, SCR = null, OVL = null, OVLkey = '', ovlFont = false, fontCheck = 0;
  const ICONS = new Map();
  const PRINTS = [];
  const lastPrint = new WeakMap();
  const trails = new WeakMap();
  let printStamp = -1, imprintStamp = -1;
  const HAZE = [];
  let hazeStamp = -1;
  let agc = 0, agcT = 0, lastRt = 0;
  let lock = { id: -1, t0: 0, x: 0, y: 0, w: 0, h: 0 };

  function haze(rt, x, y, w, h, amp, seed) {
    if (hazeStamp !== rt) { hazeStamp = rt; HAZE.length = 0; }
    if (HAZE.length < 10) HAZE.push({ x, y, w, h, amp, seed });
  }
  function puffSprite(t) {
    return U.sprite(64, 64, (ctx) => {
      const c = ramp(t);
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, U.rgb(c, 1)); g.addColorStop(0.42, U.rgb(c, 0.55)); g.addColorStop(1, U.rgb(c, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    });
  }
  const puff = (t) => PUFF[clamp((t * 15 + 0.5) | 0, 0, 15)];
  function drawPuff(ctx, t, x, y, r, a, sq) {
    if (a <= 0.01) return;
    ctx.globalAlpha = Math.min(1, a);
    ctx.drawImage(puff(t), x - r, y - r * (sq || 1), r * 2, r * 2 * (sq || 1));
  }
  function heightOf(e) { return e.type === 'colossus' ? 30 : e.type === 'ghost' ? 19 : e.type === 'creeper' ? 9 : (e.r || 9) * 1.4; }
  function tempOf(e) { return e.type === 'colossus' ? 61.4 : e.type === 'ghost' ? 74.8 : 38.6; }

  /* ---- grain tiles: temporal noise + fixed-pattern column stripes. Light and dark speckles with alpha, drawn
     with plain source-over (much cheaper than a blend mode on a full screen) ---- */
  function buildGrain() {
    const N = 4, S = 160;
    const cols = new Float32Array(S);
    const rng = U.rng(4242);
    for (let x = 0; x < S; x++) cols[x] = rng.range(-0.12, 0.12);
    GRAIN = [];
    for (let k = 0; k < N; k++) {
      const { c, ctx } = U.canvas(S, S);
      const img = ctx.createImageData(S, S), d = img.data;
      const r = U.rng(99 + k * 31);
      for (let y = 0; y < S; y++) {
        const row = r.range(-0.06, 0.06);
        for (let x = 0; x < S; x++) {
          const n = (r.next() + r.next() + r.next() - 1.5) * 0.9 + cols[x] + row;
          const o = (y * S + x) * 4;
          const v = n > 0 ? 255 : 0;
          d[o] = v; d[o + 1] = v; d[o + 2] = n > 0 ? 255 : 12;
          d[o + 3] = Math.min(255, Math.abs(n) * (n > 0 ? 15 : 36));
        }
      }
      ctx.putImageData(img, 0, 0);
      GRAIN.push(c);
    }
    GRAINPAT = null;
  }
  /* ---- cached text bitmaps (outlined camera text): drawn with drawImage instead of strokeText every frame ---- */
  const TXT = new Map();
  function textImg(s, size, color) {
    const key = s + '|' + size + '|' + (color || '');
    let t = TXT.get(key);
    if (t) return t;
    if (TXT.size > 96) TXT.clear();
    const m = U.canvas(4, 4).ctx;
    m.font = size + 'px ' + MONO;
    const pad = Math.ceil(size * 0.3);
    const w = Math.ceil(m.measureText(s).width) + pad * 2, h = Math.ceil(size * 1.3) + pad;
    const { c, ctx } = U.canvas(w, h);
    ctx.font = m.font; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(2,0,8,0.8)'; ctx.lineWidth = Math.max(2, size * 0.22);
    ctx.strokeText(s, pad, h / 2);
    ctx.fillStyle = color || UI;
    ctx.fillText(s, pad, h / 2);
    t = { c, w, h, pad };
    TXT.set(key, t);
    return t;
  }

  /* ---- camera overlay (display pixels) ---- */
  function fontLoaded(fam) {
    if (!document.fonts) return false;
    let ok = false;
    document.fonts.forEach((f) => { if (f.family.replace(/["']/g, '') === fam && f.status === 'loaded') ok = true; });
    return ok;
  }
  const MONO = "'Share Tech Mono', 'Consolas', ui-monospace, monospace";
  function uiTextC(ctx, s, x, y, size, align, color) {
    const t = textImg(s, size, color);
    const tw = t.w - t.pad * 2;
    const dx = align === 'right' ? x - tw - t.pad : align === 'center' ? x - tw / 2 - t.pad : x - t.pad;
    ctx.drawImage(t.c, Math.round(dx), Math.round(y - t.h / 2));
  }
  function uiText(ctx, s, x, y, size, align, color) {
    ctx.font = size + 'px ' + MONO;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(2,0,8,0.8)'; ctx.lineWidth = Math.max(2, size * 0.22);
    ctx.strokeText(s, x, y);
    ctx.fillStyle = color || UI;
    ctx.fillText(s, x, y);
  }
  function uiLine(ctx, lw, u, path) {
    ctx.lineCap = 'square';
    ctx.strokeStyle = 'rgba(2,0,8,0.6)'; ctx.lineWidth = lw + 2 * u; ctx.beginPath(); path(); ctx.stroke();
    ctx.strokeStyle = 'rgba(238,243,255,0.88)'; ctx.lineWidth = lw; ctx.beginPath(); path(); ctx.stroke();
  }
  function overlayGeom(W, H) {
    const u = H / 900;
    const m = Math.round(30 * u);
    const bw = Math.max(8, Math.round(13 * u)), bh = Math.round(H * 0.36);
    const bx = W - m - bw - Math.round(10 * u), by = Math.round(H / 2 - bh / 2);
    const fs = Math.max(11, Math.round(17 * u));
    const cx = W / 2, cy = H / 2 - (8 * H) / 360;
    return { u, m, bw, bh, bx, by, fs, cx, cy };
  }
  function buildOverlay(W, H) {
    const { c, ctx } = U.canvas(W, H);
    const g0 = overlayGeom(W, H), { u, m, bw, bh, bx, by, fs, cx, cy } = g0;
    // lens vignette: the sensor's edges read colder
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.34, W / 2, H / 2, Math.hypot(W, H) * 0.56);
    g.addColorStop(0, 'rgba(3,1,12,0)'); g.addColorStop(0.62, 'rgba(3,1,12,0.24)'); g.addColorStop(1, 'rgba(2,0,7,0.72)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const lw = Math.max(1.5, 2.2 * u), L = Math.round(58 * u);
    // corner brackets
    uiLine(ctx, lw, u, () => {
      ctx.moveTo(m, m + L); ctx.lineTo(m, m); ctx.lineTo(m + L, m);
      ctx.moveTo(W - m - L, m); ctx.lineTo(W - m, m); ctx.lineTo(W - m, m + L);
      ctx.moveTo(m, H - m - L); ctx.lineTo(m, H - m); ctx.lineTo(m + L, H - m);
      ctx.moveTo(W - m - L, H - m); ctx.lineTo(W - m, H - m); ctx.lineTo(W - m, H - m - L);
    });
    // centre reticle: ticks that frame the subject in the middle
    const r0 = 30 * u * 2.1, r1 = r0 + 18 * u;
    uiLine(ctx, Math.max(1, 1.6 * u), u, () => {
      ctx.moveTo(cx - r1, cy); ctx.lineTo(cx - r0, cy); ctx.moveTo(cx + r0, cy); ctx.lineTo(cx + r1, cy);
      ctx.moveTo(cx, cy - r1); ctx.lineTo(cx, cy - r0); ctx.moveTo(cx, cy + r0); ctx.lineTo(cx, cy + r1);
      const q = r0 * 0.72, ql = 9 * u;
      ctx.moveTo(cx - q, cy - q + ql); ctx.lineTo(cx - q, cy - q); ctx.lineTo(cx - q + ql, cy - q);
      ctx.moveTo(cx + q - ql, cy - q); ctx.lineTo(cx + q, cy - q); ctx.lineTo(cx + q, cy - q + ql);
      ctx.moveTo(cx - q, cy + q - ql); ctx.lineTo(cx - q, cy + q); ctx.lineTo(cx - q + ql, cy + q);
      ctx.moveTo(cx + q - ql, cy + q); ctx.lineTo(cx + q, cy + q); ctx.lineTo(cx + q, cy + q - ql);
    });
    // temperature scale bar
    const lg = ctx.createLinearGradient(0, by, 0, by + bh);
    for (let i = 0; i <= 12; i++) lg.addColorStop(i / 12, U.rgb(ramp(1 - i / 12)));
    ctx.fillStyle = 'rgba(2,0,8,0.6)'; ctx.fillRect(bx - 2 * u, by - 2 * u, bw + 4 * u, bh + 4 * u);
    ctx.fillStyle = lg; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = 'rgba(238,243,255,0.85)'; ctx.lineWidth = Math.max(1, 1.2 * u); ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    const hiT = 48.6, loT = -12.4;
    for (let i = 0; i <= 4; i++) {
      const y = by + (bh * i) / 4;
      uiLine(ctx, Math.max(1, 1.2 * u), u * 0.6, () => { ctx.moveTo(bx - 7 * u, y); ctx.lineTo(bx - 1, y); });
      uiText(ctx, (hiT - ((hiT - loT) * i) / 4).toFixed(1), bx - 11 * u, y, Math.round(fs * 0.82), 'right');
    }
    uiText(ctx, '°C', bx + bw / 2, by - 16 * u, fs, 'center');
    uiText(ctx, 'IRONBOW', bx + bw, by + bh + 18 * u, Math.round(fs * 0.76), 'right');
    // static info line
    uiText(ctx, 'ε 0.95   AUTO   ×1.0', m + 6 * u, H - m - 18 * u, Math.round(fs * 0.82), 'left', 'rgba(238,243,255,0.78)');
    return c;
  }

  /* ---- floating digits (atlas baked once the font is there) ---- */
  function bakeDigits(fam, real) {
    const mk = (fill, glow, weight) => {
      const fs = 46, H = 68, pad = 12;
      const m = U.canvas(8, 8).ctx;
      m.font = weight + ' ' + fs + 'px ' + fam;
      const chars = '0123456789°';
      const adv = [], xs = [];
      let W = 0;
      for (const ch of chars) { const a = Math.ceil(m.measureText(ch).width); adv.push(a); xs.push(W); W += a + pad * 2; }
      const { c, ctx } = U.canvas(W, H);
      ctx.font = m.font; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.lineJoin = 'round';
      for (let i = 0; i < chars.length; i++) {
        const x = xs[i] + pad, y = H / 2 + 2;
        ctx.filter = 'blur(5px)'; ctx.fillStyle = glow; ctx.fillText(chars[i], x, y);
        ctx.filter = 'none';
        ctx.strokeStyle = 'rgba(6,1,18,0.92)'; ctx.lineWidth = 7; ctx.strokeText(chars[i], x, y);
        ctx.fillStyle = fill; ctx.fillText(chars[i], x, y);
      }
      return { c, xs, adv, pad, H };
    };
    return { real, norm: mk('#ffe777', '#f4701a', 400), crit: mk('#fffdf2', '#e3443a', 400) };
  }
  function digits() {
    if (NUM && NUM.real) return NUM;
    if (--numCheck <= 0) { numCheck = 30; if (fontLoaded('Share Tech Mono')) NUM = bakeDigits(MONO, true); }
    if (!NUM) NUM = bakeDigits("'Consolas', ui-monospace, monospace", false);
    return NUM;
  }

  /* ---- particles ---- */
  function spark(game, x, y, z, ang, spd, t0, life, size) {
    game.addParticle({ kind: 'heat', x, y, z, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd * 0.7, life, size: size || 2, t0, drag: 3.6 });
  }
  function puffP(game, x, y, z, size, t0, life, grow, a0, vx, vy, vz) {
    game.addParticle({ kind: 'puff', x, y, z, size, t0, life, grow: grow || 1.5, a0: a0 || 0.8, vx: vx || 0, vy: vy || 0, vz: vz || 0, grav: vz ? 0.001 : 0, drag: 2.5 });
  }
  function ringP(game, x, y, z, r0, r1, t0, life, sq, lw) {
    game.addParticle({ kind: 'ring', x, y, z, r0, r1, t0, life, sq: sq || 0.45, lw: lw || 1.2, drag: 0 });
  }
  function emberP(game, x, y, z, n, spd, t0, life) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, sp = spd * (0.4 + Math.random() * 0.8);
      game.addParticle({ kind: 'ember', x, y, z, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 30 + Math.random() * 70, grav: 170, drag: 1.6, size: 1.2 + Math.random() * 1.3, t0, life: life * (0.6 + Math.random() * 0.7) });
    }
  }
  function drawImprint(ctx, pt) {
    const k = Math.max(0, pt.life / pt.max);
    drawPuff(ctx, pt.t0 * (0.45 + 0.55 * k), pt.x, pt.y, pt.size * (1.15 - 0.15 * k), k * 0.85, 0.42);
  }

  /* ================= icons (thermal images of objects) ================= */
  function iconPaint(c, id) {
    switch (id) {
      case 'hp-heart': {
        c.beginPath(); c.moveTo(48, 84); c.bezierCurveTo(20, 64, 8, 46, 12, 31); c.bezierCurveTo(16, 14, 40, 10, 48, 29);
        c.bezierCurveTo(56, 10, 80, 14, 84, 31); c.bezierCurveTo(88, 46, 76, 64, 48, 84); c.closePath();
        fillT(c, radial(c, 40, 38, 50, 1.0, 0.62, [0.32, 0.92]));
        break;
      }
      case 'kills': {
        poly(c, [26, 42, 20, 8, 44, 34]); fillT(c, 0.74);
        poly(c, [70, 42, 76, 8, 52, 34]); fillT(c, 0.74);
        ell(c, 48, 56, 27, 24); fillT(c, radial(c, 48, 50, 30, 0.86, 0.6));
        ell(c, 48, 69, 9, 6.5); fillT(c, 0.72);
        circ(c, 48, 66, 3); fillT(c, 0.55);
        circ(c, 37, 52, 5.5); fillT(c, 1.0); circ(c, 59, 52, 5.5); fillT(c, 1.0);
        break;
      }
      case 'dmg': {
        poly(c, [12, 86, 70, 18, 86, 8, 78, 28]);
        fillT(c, linear(c, 12, 86, 86, 8, 0.5, 1.0));
        for (const [x, y, r] of [[80, 38, 4], [58, 14, 3.4], [88, 24, 2.6]]) { circ(c, x, y, r); fillT(c, 0.95); }
        break;
      }
      case 'rate': {
        for (let i = 0; i < 3; i++) {
          const x = 76 - i * 10, y = 24 + i * 24;
          c.beginPath(); c.moveTo(x - 62, y + 3); c.lineTo(x, y - 6); c.quadraticCurveTo(x + 7, y, x, y + 6); c.closePath();
          fillT(c, linear(c, x - 62, 0, x, 0, 0.3, 0.98, 0.1, 1));
          circ(c, x, y, 7); fillT(c, radial(c, x, y, 7, 1.0, 0.86));
        }
        break;
      }
      case 'multi': {
        const ox = 14, oy = 82;
        for (const an of [-1.25, -0.78, -0.3]) {
          const ex = ox + Math.cos(an) * 66, ey = oy + Math.sin(an) * 66;
          c.beginPath(); c.moveTo(ox, oy); c.lineTo(ex, ey); strokeT(c, linear(c, ox, oy, ex, ey, 0.4, 0.9, 0.2, 1), 7);
          circ(c, ex, ey, 7.5); fillT(c, radial(c, ex, ey, 7.5, 1.0, 0.85));
        }
        circ(c, ox, oy, 9); fillT(c, 0.7);
        break;
      }
      case 'bounce': {
        const P = [8, 84, 30, 26, 54, 76, 80, 24];
        c.beginPath(); c.moveTo(P[0], P[1]); for (let i = 2; i < P.length; i += 2) c.lineTo(P[i], P[i + 1]);
        strokeT(c, linear(c, 8, 0, 80, 0, 0.42, 0.86, 0.5, 1), 8);
        for (const [x, y] of [[30, 26], [54, 76]]) { ell(c, x, y + (y < 50 ? -4 : 4), 9, 3.2); fillT(c, 0.8); }
        circ(c, 80, 24, 9.5); fillT(c, radial(c, 80, 24, 9.5, 1.0, 0.86));
        break;
      }
      case 'lantern': {
        ell(c, 48, 54, 38, 18, -0.28); strokeT(c, 0.58, 5);
        circ(c, 48, 54, 11); fillT(c, radial(c, 48, 52, 11, 0.8, 0.6));
        circ(c, 78, 38, 13); fillT(c, radial(c, 76, 36, 13, 1.0, 0.86));
        circ(c, 20, 70, 6); fillT(c, 0.7);
        break;
      }
      case 'speed': {
        for (let i = 0; i < 3; i++) { const y = 46 + i * 13; c.beginPath(); c.moveTo(4, y); c.lineTo(28 - i * 4, y); strokeT(c, linear(c, 4, 0, 28, 0, 0.35, 0.7, 0.2, 1), 5); }
        c.beginPath(); c.moveTo(36, 18); c.lineTo(60, 18); c.lineTo(62, 56); c.quadraticCurveTo(88, 60, 90, 74); c.lineTo(90, 82); c.lineTo(34, 82); c.closePath();
        fillT(c, radial(c, 52, 58, 40, 0.8, 0.58));
        rrect(c, 32, 78, 60, 8, 3); fillT(c, 0.42); // sole: cooler
        c.beginPath(); c.moveTo(36, 30); c.lineTo(60, 30); strokeT(c, 0.6, 3);
        break;
      }
      case 'magnet': {
        c.beginPath(); c.arc(48, 44, 26, Math.PI, 0); c.lineTo(74, 76); c.moveTo(22, 44); c.lineTo(22, 76);
        strokeT(c, 0.5, 15);
        rrect(c, 14.5, 66, 15, 16, 2); fillT(c, 0.97); rrect(c, 66.5, 66, 15, 16, 2); fillT(c, 0.97);
        for (const [x, y, r] of [[40, 70, 3.4], [50, 62, 2.8], [58, 74, 3]]) { circ(c, x, y, r); fillT(c, 0.86); }
        break;
      }
      case 'hp': {
        for (let i = 0; i < 3; i++) {
          const x = 30 + i * 13;
          c.beginPath(); c.moveTo(x, 40); c.bezierCurveTo(x - 9, 30, x + 9, 22, x, 8);
          strokeT(c, linear(c, 0, 40, 0, 8, 0.78, 0.4, 0.95, 0.15), 5);
        }
        c.beginPath(); c.arc(74, 64, 11, -Math.PI / 2, Math.PI / 2); strokeT(c, 0.62, 6);
        rrect(c, 18, 44, 52, 42, 7); fillT(c, radial(c, 44, 62, 34, 0.8, 0.6));
        ell(c, 44, 47, 23, 5.5); fillT(c, 1.0);
        break;
      }
      default: circ(c, 48, 48, 30); fillT(c, radial(c, 48, 48, 30, 1, 0.6));
    }
  }
  function iconOverlay(ctx, id, size) {
    if (id !== 'kills') return;
    const s = size / 96, lw = Math.max(1.2, 4.5 * s), L = 16 * s, a = 3 * s, b = 93 * s;
    ctx.lineCap = 'square';
    for (const [col, w] of [['rgba(2,0,8,0.7)', lw + 2.5 * s], [UI, lw]]) {
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath();
      ctx.moveTo(a, a + L); ctx.lineTo(a, a); ctx.lineTo(a + L, a);
      ctx.moveTo(b - L, a); ctx.lineTo(b, a); ctx.lineTo(b, a + L);
      ctx.moveTo(a, b - L); ctx.lineTo(a, b); ctx.lineTo(a + L, b);
      ctx.moveTo(b - L, b); ctx.lineTo(b, b); ctx.lineTo(b, b - L);
      ctx.stroke();
    }
  }
  function iconImage(id, size) {
    const key = id + '@' + size;
    let img = ICONS.get(key);
    if (img) return img;
    const k = size / 96;
    const S = bake(0, 0, 96, 96, (c) => iconPaint(c, id), { k, diffuse: 1.6, halo: 5, haloA: 0.75, limb: 0.3 });
    img = S.img;
    iconOverlay(img.getContext('2d'), id, img.width);
    ICONS.set(key, img);
    return img;
  }

  /* ================= CSS: the HUD is the camera's own UI ================= */
  const IRON = '#1d0b52,#3a0f78 12%,#64108a 24%,#96158a 36%,#c4256a 47%,#e3443a 57%,#f4701a 67%,#fb9d12 77%,#fdc52e 86%,#ffe777 93%,#fffdf2';
  const CSS = `
body.style-thermal{background:#05030c;font-family:'Share Tech Mono',ui-monospace,monospace;color:#eef3ff}
body.style-thermal #hud{padding:16px 28px}
body.style-thermal #hud .xp{height:13px;background:rgba(5,2,16,.82);border:1px solid rgba(238,243,255,.75);border-radius:0;box-shadow:0 0 0 1px rgba(0,0,0,.6),0 3px 12px rgba(0,0,0,.45);overflow:visible}
body.style-thermal #hud .xp-fill{background:linear-gradient(90deg,${IRON});box-shadow:0 0 12px rgba(244,112,26,.5)}
body.style-thermal #hud .xp::after{content:'';position:absolute;left:-1px;right:-1px;top:calc(100% + 2px);height:5px;background:repeating-linear-gradient(90deg,rgba(238,243,255,.7) 0 1px,transparent 1px 5%);pointer-events:none}
body.style-thermal #hud .lvl{right:-1px;top:-1px;bottom:-1px;transform:none;display:flex;align-items:center;padding:0 8px;background:#05030c;border:1px solid rgba(238,243,255,.75);font:400 11px/1 'Share Tech Mono',monospace;color:#ffe777;letter-spacing:2px;text-shadow:none}
body.style-thermal #hud .lvl::before{content:'\\25B2 ';color:#f4701a;font-size:9px}
body.style-thermal #hud .topline{margin-top:20px}
body.style-thermal #hud .hp{gap:10px;padding:6px 10px 6px 6px;background:linear-gradient(90deg,rgba(5,2,16,.78),rgba(5,2,16,.35));border-left:2px solid #eef3ff}
body.style-thermal #hud .hp-icon{width:30px;height:30px}
body.style-thermal #hud .hp-bar{width:236px;height:12px;border-radius:0;background:rgba(5,2,16,.85);border:1px solid rgba(238,243,255,.8);box-shadow:0 0 0 1px rgba(0,0,0,.6)}
body.style-thermal #hud .hp-fill{background:linear-gradient(90deg,#3a0f78,#96158a 22%,#e3443a 48%,#fb9d12 72%,#ffe777 92%,#fffdf2)}
body.style-thermal #hud .hp-bar::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 calc(10% - 1px),rgba(5,2,16,.9) calc(10% - 1px) 10%)}
body.style-thermal #hud .hp-text{font:400 16px 'Share Tech Mono',monospace;color:#fffdf2;letter-spacing:1px;text-shadow:0 0 2px #000,0 1px 3px #000}
body.style-thermal.hurt #hud .hp-bar{filter:brightness(1.6) saturate(1.3);box-shadow:0 0 16px rgba(255,231,119,.8)}
body.style-thermal #hud .clock{position:relative;padding:4px 18px 6px;margin-top:-4px}
body.style-thermal #hud .clock::before,body.style-thermal #hud .clock::after{content:'';position:absolute;top:0;bottom:0;width:10px;border:2px solid rgba(238,243,255,.85);pointer-events:none}
body.style-thermal #hud .clock::before{left:0;border-right:0}
body.style-thermal #hud .clock::after{right:0;border-left:0}
body.style-thermal #hud .clock-time{font:400 36px/1.05 'Share Tech Mono',monospace;letter-spacing:4px;color:#fffdf2;text-shadow:0 0 2px #000,0 0 14px rgba(251,157,18,.55)}
body.style-thermal #hud .clock-label{font:500 10px 'Orbitron',sans-serif;letter-spacing:5px;color:#fdc52e;opacity:1;margin-top:3px;text-shadow:0 1px 2px #000}
body.style-thermal #hud .kills{font:400 26px 'Share Tech Mono',monospace;color:#fffdf2;gap:10px;text-shadow:0 0 2px #000,0 1px 4px #000}
body.style-thermal #hud .kills-icon{width:34px;height:34px}
body.style-thermal #hud .kills-num::after{content:' \\25CF';font-size:12px;color:#e3443a;vertical-align:middle}
body.style-thermal #stylebar{background:rgba(5,2,16,.85);border:1px solid rgba(238,243,255,.55);border-radius:0;box-shadow:0 0 0 1px rgba(0,0,0,.6),0 6px 20px rgba(0,0,0,.5);font:400 12px 'Share Tech Mono',monospace;color:#d8dcf0;padding:7px 18px 7px 30px}
body.style-thermal #stylebar::before{content:'';position:absolute;left:12px;top:50%;width:8px;height:8px;margin-top:-4px;border-radius:50%;background:#e3443a;box-shadow:0 0 8px #e3443a}
body.style-thermal #stylebar .style-family{font:500 9px 'Orbitron',sans-serif;letter-spacing:3px;color:#fdc52e;opacity:1}
body.style-thermal #stylebar .style-name{font:700 15px 'Chakra Petch',sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:#fffdf2}
body.style-thermal #stylemenu{background:rgba(5,2,16,.96);border:1px solid rgba(238,243,255,.45);border-radius:0}
body.style-thermal #stylemenu .sm-item{border-radius:0}
body.style-thermal #stylemenu .sm-item.active{border-color:#fb9d12}
body.style-thermal #levelup{background:radial-gradient(ellipse at 50% 46%,rgba(29,11,82,.5),rgba(3,1,10,.66) 72%);gap:26px}
body.style-thermal #levelup::before{content:'';position:absolute;inset:7%;pointer-events:none;background:linear-gradient(#eef3ff,#eef3ff) 0 0/46px 2px no-repeat,linear-gradient(#eef3ff,#eef3ff) 0 0/2px 46px no-repeat,linear-gradient(#eef3ff,#eef3ff) 100% 0/46px 2px no-repeat,linear-gradient(#eef3ff,#eef3ff) 100% 0/2px 46px no-repeat,linear-gradient(#eef3ff,#eef3ff) 0 100%/46px 2px no-repeat,linear-gradient(#eef3ff,#eef3ff) 0 100%/2px 46px no-repeat,linear-gradient(#eef3ff,#eef3ff) 100% 100%/46px 2px no-repeat,linear-gradient(#eef3ff,#eef3ff) 100% 100%/2px 46px no-repeat;opacity:.7}
body.style-thermal #levelup .lu-title{font:900 50px/1 'Orbitron',sans-serif;letter-spacing:.16em;text-transform:uppercase;background:linear-gradient(180deg,#fffdf2 8%,#ffe777 30%,#fb9d12 52%,#e3443a 72%,#96158a 96%);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 2px 0 rgba(3,1,10,.9)) drop-shadow(0 0 18px rgba(244,112,26,.45))}
body.style-thermal #levelup .lu-cards{gap:28px}
body.style-thermal #levelup .card{width:222px;min-height:270px;padding:22px 16px 18px;border-radius:0;background:linear-gradient(180deg,rgba(29,11,82,.62),rgba(5,2,16,.94) 46%);border:1px solid rgba(238,243,255,.28);box-shadow:0 10px 30px rgba(0,0,0,.55);transition:transform .14s,border-color .14s,box-shadow .14s}
body.style-thermal #levelup .card::before{content:'';position:absolute;inset:-5px;pointer-events:none;background:linear-gradient(#eef3ff,#eef3ff) 0 0/16px 2px no-repeat,linear-gradient(#eef3ff,#eef3ff) 0 0/2px 16px no-repeat,linear-gradient(#eef3ff,#eef3ff) 100% 0/16px 2px no-repeat,linear-gradient(#eef3ff,#eef3ff) 100% 0/2px 16px no-repeat,linear-gradient(#eef3ff,#eef3ff) 0 100%/16px 2px no-repeat,linear-gradient(#eef3ff,#eef3ff) 0 100%/2px 16px no-repeat,linear-gradient(#eef3ff,#eef3ff) 100% 100%/16px 2px no-repeat,linear-gradient(#eef3ff,#eef3ff) 100% 100%/2px 16px no-repeat}
body.style-thermal #levelup .card::after{content:'';position:absolute;left:16px;right:16px;bottom:12px;height:4px;background:linear-gradient(90deg,${IRON});opacity:.85}
body.style-thermal #levelup .card:hover{transform:translateY(-6px);border-color:rgba(251,157,18,.85);box-shadow:0 0 0 1px rgba(251,157,18,.4),0 0 26px rgba(244,112,26,.4),0 10px 30px rgba(0,0,0,.55)}
body.style-thermal #levelup .card-icon{width:104px;height:104px;padding:4px;background:#0d0626;border:1px solid rgba(238,243,255,.35);box-shadow:inset 0 0 18px rgba(0,0,0,.8)}
body.style-thermal #levelup .card-name{font:600 18px 'Chakra Petch',sans-serif;text-transform:uppercase;letter-spacing:1.5px;color:#fffdf2;margin-top:4px}
body.style-thermal #levelup .card-desc{font:400 15px 'Share Tech Mono',monospace;color:#c7b8f2;opacity:1;line-height:1.35}
body.style-thermal #levelup .card-key{top:8px;left:10px;font:400 12px 'Share Tech Mono',monospace;color:#fdc52e;opacity:1;letter-spacing:1px}
body.style-thermal #levelup .card-key::before{content:'['}
body.style-thermal #levelup .card-key::after{content:']'}
body.style-thermal #levelup .lu-hint{font:400 13px 'Share Tech Mono',monospace;letter-spacing:4px;text-transform:uppercase;color:#b9a9ea;opacity:.95}
body.style-thermal #gameover{background:radial-gradient(ellipse at 50% 45%,rgba(29,11,82,.55),rgba(3,1,10,.92) 70%)}
body.style-thermal #gameover .go-title{font:900 50px 'Orbitron',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#fdc52e;text-shadow:0 2px 0 #000,0 0 22px rgba(227,68,58,.6)}
body.style-thermal #gameover .go-stats{font:400 16px 'Share Tech Mono',monospace;color:#eef3ff;letter-spacing:1px}
body.style-thermal #gameover .go-hint{font:400 13px 'Share Tech Mono',monospace;letter-spacing:4px;color:#fb9d12}
body.style-thermal #pausebox{font:900 46px 'Orbitron',sans-serif;letter-spacing:.2em;color:#eef3ff;text-shadow:0 2px 0 #000,0 0 18px rgba(251,157,18,.5)}
body.style-thermal.view-ui::after{content:'';position:fixed;right:44px;top:32%;height:36%;width:12px;pointer-events:none;z-index:1;background:linear-gradient(0deg,${IRON});border:1px solid rgba(238,243,255,.85);box-shadow:0 0 0 2px rgba(2,0,8,.6)}
`;

  /* ================= style ================= */
  Styles.register({
    id: 'thermal',
    name: 'Thermal Vision',
    family: 'Infrared · False colour',
    description: 'The world seen through an infrared camera: every surface is a temperature mapped through an ironbow false-colour ramp, warm bodies glow white-hot.',
    groundColor: '#1d0b52',
    groundResMax: 2.5,
    chunkSize: 256,
    fonts: ['Share+Tech+Mono', 'Orbitron:wght@500;700;900', 'Chakra+Petch:wght@400;500;600;700'],
    css: CSS,

    init() {
      noiseTile();
      const V3 = ['flash', 'cold', 'after'];
      HERO = { walk: [], idle: null, dash: null };
      const hOpt = { halo: 1.5, haloA: 0.6 };
      for (let i = 0; i < 8; i++) HERO.walk.push(bakeChar(15, 36, 17, 6, (c) => explorerPaint(c, i / 8, 'walk'), hOpt, V3));
      HERO.idle = bakeChar(15, 36, 17, 6, (c) => explorerPaint(c, 0, 'idle'), hOpt, V3);
      HERO.dash = bakeChar(15, 36, 19, 6, (c) => explorerPaint(c, 0, 'dash'), hOpt, V3);
      CRIT = [];
      for (let i = 0; i < 8; i++) CRIT.push(bakeChar(20, 22, 18, 6, (c) => critterPaint(c, i / 8), { halo: 1.3, haloA: 0.6 }, ['flash', 'cold']));
      WISP = [];
      for (let i = 0; i < 8; i++) WISP.push(bakeChar(15, 37, 15, 6, (c) => wispPaint(c, i / 8), { halo: 2.1, haloA: 0.85, haloT: 0.66, limb: 0.32 }, V3));
      BRUTE = [];
      for (let i = 0; i < 8; i++) BRUTE.push(bakeChar(29, 57, 29, 7, (c) => brutePaint(c, i / 8), { halo: 1.9, haloA: 0.65, diffuse: 0.7 }, ['flash', 'cold']));
      GEMS = []; GEMB = [];
      for (let i = 0; i < 6; i++) {
        const p = 0.5 - 0.5 * Math.cos((i / 6) * TAU);
        GEMS.push(bake(7, 15, 7, 5, (c) => shardPaint(c, 0.8 + p * 0.13), { halo: 1.2, haloA: 0.85, limb: 0.25 }, ['after']));
        GEMB.push(bake(9, 17, 9, 5, (c) => cellPaint(c, 0.9 + p * 0.1), { halo: 1.6, haloA: 0.95, limb: 0.25 }, ['after']));
      }
      HEAD = bake(6, 6, 6, 6, headPaint, { halo: 1.3, haloA: 1, haloT: 0.75, limb: 0.15 });
      TRAIL = bake(30, 6, 5, 6, trailPaint, { halo: 1.1, haloA: 0.7, limb: 0.1, diffuse: 0.4 });
      ORB = bake(9, 7, 9, 7, orbPaint, { halo: 1.6, haloA: 1, haloT: 0.72, limb: 0.18 });
      const pOpt = { halo: 1.6, haloA: 0.55, limb: 0.38 };
      PROPS = {
        boulder: [bake(24, 21, 24, 9, (c) => boulderPaint(c, 0), pOpt), bake(16, 14, 16, 7, (c) => boulderPaint(c, 1), pOpt)],
        pine: [bake(25, 61, 25, 12, (c) => pinePaint(c, 0), pOpt), bake(25, 51, 25, 12, (c) => pinePaint(c, 1), pOpt)],
        deadTree: [bake(22, 52, 22, 7, deadTreePaint, pOpt)],
        pipe: [bake(40, 25, 40, 9, pipePaint, { halo: 1.8, haloA: 0.6, limb: 0.4 })],
        vent: [bake(15, 36, 15, 8, ventPaint, { halo: 1.8, haloA: 0.65 })],
        transformer: [bake(18, 34, 18, 8, transformerPaint, { halo: 1.7, haloA: 0.6 })],
        fence: [bake(26, 22, 26, 7, (c) => fencePaint(c, 0), pOpt), bake(26, 25, 26, 7, (c) => fencePaint(c, 1), pOpt)],
        embers: [0, 1, 2].map((v) => bake(21, 17, 21, 10, (c) => embersPaint(c, v), { halo: 2.0, haloA: 0.8 })),
      };
      PUFF = [];
      for (let i = 0; i < 16; i++) PUFF.push(puffSprite(i / 15));
      CONTACT = U.sprite(64, 64, (ctx) => {
        const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, colA(0.44, 0.8)); g.addColorStop(0.5, colA(0.37, 0.42)); g.addColorStop(1, colA(0.3, 0));
        ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
      });
      COLUMN = U.sprite(32, 256, (ctx) => {
        const g = ctx.createLinearGradient(0, 256, 0, 0);
        g.addColorStop(0, colA(0.98, 0.95)); g.addColorStop(0.25, colA(0.82, 0.7)); g.addColorStop(0.6, colA(0.6, 0.35)); g.addColorStop(1, colA(0.45, 0));
        ctx.fillStyle = g; ctx.fillRect(0, 0, 32, 256);
        ctx.globalCompositeOperation = 'destination-in';
        const h = ctx.createLinearGradient(0, 0, 32, 0);
        h.addColorStop(0, 'rgba(0,0,0,0)'); h.addColorStop(0.5, 'rgba(0,0,0,1)'); h.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = h; ctx.fillRect(0, 0, 32, 256);
      });
      buildGrain();
      SCR = U.canvas(256, 256);
      if (document.fonts && document.fonts.load) { try { document.fonts.load("20px 'Share Tech Mono'").catch(() => {}); } catch (e) { /* ignore */ } }
    },

    /* ---------- world ---------- */
    *renderGroundChunk(ctx, info) {
      // 1) coarse grid of the raw fields (every 4 world units, one cell beyond the chunk)
      const J = groundJob(info);
      for (let gy = 0; gy < J.gw; gy += 2) { gridRows(J, gy, Math.min(J.gw, gy + 2)); yield; }
      groundPrep(J);
      yield;
      // 2) per pixel temperature
      for (let py = 0; py < J.W; py += 16) { groundRows(J, py, Math.min(J.W, py + 16)); yield; }
      const TB = J.TB, segs = J.segs, W = info.px, wx = info.wx, wy = info.wy, size = info.size;
      // 3) decals stamped into the temperature buffer (seamless: scatter is deterministic per world cell)
      const at = {};
      // warm pebbles
      G.scatter(info, 10, 7101, 3, (x, y, rng) => {
        if (!rng.chance(0.3)) return;
        field(x, y, at); if (at.water > 0.3) return;
        const r = rng.range(0.6, 1.6);
        stamp(TB, info, x, y, r, r * 0.75, 0, rng.range(0.04, 0.075), true);
      });
      yield;
      // cold vegetation clumps
      G.scatter(info, 13, 7202, 5, (x, y, rng) => {
        if (!rng.chance(0.42)) return;
        field(x, y, at); if (at.water > 0.2 || at.rd < SHOULDER_W || at.hedge > 0.5) return;
        const n = rng.int(3, 6);
        for (let i = 0; i < n; i++) stamp(TB, info, x + rng.range(-2.5, 2.5), y + rng.range(-1.6, 1.6), rng.range(0.7, 1.7), rng.range(0.5, 1.1), 0, -rng.range(0.03, 0.05), false);
      });
      yield;
      // boot-print trails: older prints are cooler
      G.scatter(info, 150, 7303, 150, (x, y, rng) => {
        if (!rng.chance(0.34)) return;
        let h = rng.range(0, TAU);
        const n = rng.int(12, 22);
        for (let i = 0; i < n; i++) {
          h += rng.range(-0.22, 0.22);
          x += Math.cos(h) * 6.6; y += Math.sin(h) * 6.6;
          const side = i & 1 ? 1 : -1, px = x - Math.sin(h) * 1.7 * side, py = y + Math.cos(h) * 1.7 * side;
          if (px < wx - 4 || px > wx + size + 4 || py < wy - 4 || py > wy + size + 4) continue;
          field(px, py, at); if (at.water > 0.3) continue;
          stamp(TB, info, px, py, 1.15, 2.05, h + Math.PI / 2, 0.045 + 0.085 * (i / n), true);
        }
      });
      yield;
      // warm resting spots where an animal slept, puddles (cold) in wet fields
      G.scatter(info, 240, 7505, 14, (x, y, rng) => {
        if (!rng.chance(0.45)) return;
        field(x, y, at); if (at.water > 0.1 || at.rd < SHOULDER_W) return;
        stamp(TB, info, x, y, rng.range(6, 10), rng.range(3.5, 5.5), rng.range(-0.4, 0.4), rng.range(0.07, 0.11), false);
      });
      // compost heaps / dung piles in stubble fields: rare, really warm accents
      G.scatter(info, 290, 7707, 12, (x, y, rng) => {
        if (!rng.chance(0.4)) return;
        field(x, y, at); if (at.type !== 2 || at.hedge > 0.2 || at.rd < SHOULDER_W + 4 || at.water > 0) return;
        const r = rng.range(3.5, 6.5);
        stamp(TB, info, x, y, r * 1.6, r, rng.range(-0.5, 0.5), 0.07, false);
        stamp(TB, info, x, y, r, r * 0.7, rng.range(-0.5, 0.5), 0.2, false);
        stamp(TB, info, x + rng.range(-1, 1), y + rng.range(-1, 1), r * 0.45, r * 0.35, 0, 0.12, false);
      });
      G.scatter(info, 34, 7606, 9, (x, y, rng) => {
        if (!rng.chance(0.3)) return;
        field(x, y, at); if (at.type !== 3 || at.hedge > 0.3) return;
        const r = rng.range(2.5, 7);
        stamp(TB, info, x, y, r, r * rng.range(0.45, 0.7), rng.range(-0.3, 0.3), -0.045, false);
      });
      yield;
      // small animal tracks (paired dots)

      G.scatter(info, 210, 7404, 130, (x, y, rng) => {
        if (!rng.chance(0.38)) return;
        let h = rng.range(0, TAU);
        const n = rng.int(14, 26);
        for (let i = 0; i < n; i++) {
          h += rng.range(-0.5, 0.5);
          x += Math.cos(h) * 4.6; y += Math.sin(h) * 4.6;
          if (x < wx - 3 || x > wx + size + 3 || y < wy - 3 || y > wy + size + 3) continue;
          const dT = 0.035 + 0.06 * (i / n), ox = -Math.sin(h) * 0.9, oy = Math.cos(h) * 0.9;
          stamp(TB, info, x + ox, y + oy, 0.6, 0.6, 0, dT, true);
          stamp(TB, info, x - ox, y - oy, 0.6, 0.6, 0, dT, true);
        }
      });
      yield;
      // manholes where the buried pipes end
      for (const s of segs) {
        for (const e of [s.a, s.b]) {
          const mx = s.v ? s.c : e, my = s.v ? e : s.c;
          if (mx < wx - 10 || mx > wx + size + 10 || my < wy - 10 || my > wy + size + 10) continue;
          stamp(TB, info, mx, my, 6.4, 6.4, 0, 0.12, true);
          stamp(TB, info, mx, my, 4.6, 4.6, 0, 0.12, true);
          stamp(TB, info, mx, my, 2.0, 2.0, 0, 0.1, false);
        }
      }
      // 4) temperature -> ironbow
      const img = ctx.createImageData(W, W), d = img.data;
      for (let i = 0, j = 0; i < W * W; i++, j += 4) {
        const li = idx(TB[i]) * 3;
        d[j] = LUT[li]; d[j + 1] = LUT[li + 1]; d[j + 2] = LUT[li + 2]; d[j + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    },

    drawGroundOverlay(ctx, view, game) {
      // residual heat imprints left where creatures dissolved (particles from the effects layer), drawn under actors
      if (typeof CanvasRenderingContext2D === 'undefined' || !(ctx instanceof CanvasRenderingContext2D)) return;
      imprintStamp = view.rt;
      const P = game.particles;
      for (let i = 0; i < P.length; i++) if (P[i].kind === 'imprint') drawImprint(ctx, P[i]);
      ctx.globalAlpha = 1;
    },

    /* ---------- props ---------- */
    propsForChunk(info) {
      const out = [];
      const segs = pipeSegs(info.wx - 60, info.wy - 60, info.wx + info.size + 60, info.wy + info.size + 60, []);
      const o = {};
      const add = (x, y, type, rng) => {
        if (G.nearSpawn(x, y, 85)) return;
        const set = PROPS ? PROPS[type] : null;
        out.push({ x, y, type, v: rng.int(0, set ? set.length - 1 : 1), seed: rng.next(), pad: 70 });
      };
      G.scatterOwned(info, 92, 5151, (x, y, rng) => {
        if (G.nearSpawn(x, y, 85)) return;
        field(x, y, o);
        if (o.water > 0.05 || o.shore > 0.6 || o.rd < SHOULDER_W + 6 || (o.border < 0.03 && o.isWall)) return;
        const dp = pipeDist(segs, x, y);
        let type;
        if (dp < 48) {
          if (dp < 12 || !rng.chance(0.8)) return;
          const r = rng.next();
          type = r < 0.38 ? 'vent' : r < 0.7 ? 'transformer' : 'pipe';
        } else {
          if (!rng.chance(0.52)) return;
          const r = rng.next();
          if (o.border < 0.07 && !o.isWall) type = r < 0.58 ? 'pine'
 : r < 0.78 ? 'deadTree' : 'fence'; // trees line the field edges
          else if (o.type === 2) type = r < 0.55 ? 'boulder' : r < 0.75 ? 'embers' : 'fence';
          else if (o.type === 1) { if (r < 0.55) return; type = r < 0.8 ? 'fence' : 'boulder'; }
          else if (o.type === 3) type = r < 0.5 ? 'deadTree' : r < 0.8 ? 'pine' : 'boulder';
          else type = r < 0.32 ? 'pine' : r < 0.6 ? 'boulder' : r < 0.74 ? 'deadTree' : r < 0.88 ? 'embers' : 'fence';
        }
        add(x, y, type, rng);
        if (type === 'pine') { const n = rng.int(0, 3); for (let i = 0; i < n; i++) add(x + rng.range(-24, 24), y + rng.range(-14, 14), 'pine', rng); }
        if (type === 'boulder' && rng.chance(0.6)) { out.push({ x: x + rng.range(12, 20) * rng.sign(), y: y + rng.range(-6, 8), type: 'boulder', v: 1, seed: rng.next(), pad: 60 }); }
      });
      return out;
    },

    drawProp(ctx, pr, view) {
      const set = PROPS && PROPS[pr.type];
      if (!set) return;
      const rt = view.rt;
      if (pr.type === 'embers') {
        const f = rt * 2.4 + pr.seed * 7, i = Math.floor(f), k = f - i;
        const a = set[i % 3], b = set[(i + 1) % 3];
        blit(ctx, a, a.img, pr.x, pr.y);
        ctx.globalAlpha = k; blit(ctx, b, b.img, pr.x, pr.y); ctx.globalAlpha = 1;
        for (let j = 0; j < 3; j++) {
          const ph = (rt * 0.65 + j / 3 + pr.seed) % 1, n = Math.floor(rt * 0.65 + j / 3 + pr.seed);
          const x = pr.x + Math.sin(j * 2.1 + n * 1.7) * 3.5 + Math.sin(ph * 7) * 1.2, y = pr.y - 4 - ph * 24;
          ctx.globalAlpha = (1 - ph) * 0.95; ctx.fillStyle = col(1 - ph * 0.55);
          ctx.fillRect(x - 0.45, y - 0.45, 0.9, 0.9);
        }
        ctx.globalAlpha = 1;
        haze(rt, pr.x, pr.y - 3, 22, 26, 0.55, pr.seed * 9);
        return;
      }
      const s = set[pr.v % set.length];
      blit(ctx, s, s.img, pr.x, pr.y);
      if (pr.type === 'vent') {
        for (let j = 0; j < 4; j++) {
          const ph = (rt * 0.42 + j / 4 + pr.seed) % 1;
          drawPuff(ctx, 0.8 - ph * 0.42, pr.x + Math.sin(ph * 5 + pr.seed * 9) * 2 + ph * 5, pr.y - 28 - ph * 30, 2.4 + ph * 7.5, (1 - ph) * 0.6 * Math.min(1, ph * 6));
        }
        ctx.globalAlpha = 1;
        haze(rt, pr.x + 3, pr.y - 26, 22, 42, 0.7, pr.seed * 9);
      } else if (pr.type === 'pipe') {
        for (let j = 0; j < 2; j++) {
          const ph = (rt * 0.7 + j / 2 + pr.seed) % 1;
          drawPuff(ctx, 0.72 - ph * 0.4, pr.x + 1.5 + ph * 4, pr.y - 20 - ph * 16, 1.4 + ph * 4.5, (1 - ph) * 0.5 * Math.min(1, ph * 6));
        }
        ctx.globalAlpha = 1;
        haze(rt, pr.x, pr.y - 6, 70, 24, 0.5, pr.seed * 9);
      } else if (pr.type === 'transformer') {
        const fl = 0.55 + 0.45 * Math.sin(rt * 11 + pr.seed * 20) * Math.sin(rt * 7.3);
        ctx.globalAlpha = Math.max(0, fl) * 0.8;
        ctx.drawImage(puff(1), pr.x + 5 - 2.6, pr.y - 28.4 - 2.6, 5.2, 5.2);
        ctx.globalAlpha = 1;
        haze(rt, pr.x, pr.y - 14, 26, 28, 0.45, pr.seed * 9);
      }
    },

    /* ---------- characters ---------- */
    drawShadow(ctx, o, view) {
      if (o.kind === 'prop') return;
      const rt = view.rt;
      // residual-heat footprints (main character and large creatures)
      if (printStamp !== rt) {
        printStamp = rt;
        for (let i = PRINTS.length - 1; i >= 0; i--) if (rt - PRINTS[i].t > PRINTS[i].life || rt < PRINTS[i].t) PRINTS.splice(i, 1);
        for (const f of PRINTS) {
          const k = 1 - (rt - f.t) / f.life;
          drawPuff(ctx, 0.24 + 0.24 * k, f.x, f.y, f.r * (1.1 - 0.1 * k), Math.min(1, k * 1.6) * 0.85, 0.62);
        }
        ctx.globalAlpha = 1;
      }
      const big = o.kind === 'enemy' && o.type === 'colossus';
      if ((o.kind === 'player' || big) && !o.dying) {
        let lp = lastPrint.get(o);
        if (!lp) { lp = { x: o.x, y: o.y, side: 1 }; lastPrint.set(o, lp); }
        const step = big ? 12 : 6.5;
        const dx = o.x - lp.x, dy = o.y - lp.y, d = Math.hypot(dx, dy);
        if (d > 60) { lp.x = o.x; lp.y = o.y; }
        else if (d > step && (o.kind !== 'player' || !(o.dashT > 0))) {
          lp.side = -lp.side;
          const nx = -dy / d, ny = dx / d;
          PRINTS.push({ x: o.x + nx * lp.side * (big ? 4.5 : 1.8), y: o.y + ny * lp.side * (big ? 2.5 : 1), t: rt, life: big ? 7 : 5, r: big ? 3.6 : 1.6 });
          if (PRINTS.length > 160) PRINTS.shift();
          lp.x = o.x; lp.y = o.y;
        }
      }
      // warm contact glow: bodies heat the ground right under them
      let rw, a = 1;
      if (o.kind === 'player') rw = 12;
      else {
        rw = (o.r || 9) * (big ? 1.6 : o.type === 'ghost' ? 1.9 : 1.45);
        if (o.type === 'ghost') a = 0.55;
        if (o.dying) a *= 1 - o.deathT;
        else if (o.spawnT < 1) a *= o.spawnT;
      }
      if (a <= 0) return;
      ctx.globalAlpha = a;
      ctx.drawImage(CONTACT, o.x - rw, o.y - rw * 0.42, rw * 2, rw * 0.84);
      ctx.globalAlpha = 1;
    },

    drawPlayer(ctx, p, view) {
      const rt = view.rt;
      const mode = p.dashT > 0 ? 'dash' : p.moving ? 'walk' : 'idle';
      const set = mode === 'dash' ? HERO.dash : mode === 'walk' ? HERO.walk[Math.floor(((p.anim / 3) % 1) * 8) & 7] : HERO.idle;
      const side = p.facing < 0 ? 1 : 0;
      const s = set[side];
      const bob = mode === 'idle' ? Math.sin(rt * 2.6) * 0.35 : 0;
      if (mode === 'dash') {
        // sensor afterimage: cooled copies stay on screen for a moment
        for (let i = 4; i >= 1; i--) {
          ctx.globalAlpha = 0.55 - i * 0.1;
          blit(ctx, s, s.after, p.x - p.dashX * i * 6.5, p.y - p.dashY * i * 6.5);
        }
        ctx.globalAlpha = 1;
      }
      if (p.levelT > 0) {
        const k = 1 - p.levelT;
        ctx.globalAlpha = p.levelT * 0.85;
        ctx.drawImage(COLUMN, p.x - 10, p.y - 96, 20, 98);
        ctx.strokeStyle = col(0.9 - k * 0.4); ctx.lineWidth = 1.6;
        const rr = 10 + U.ease.outQuad(k) * 58;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, rr, rr * 0.42, 0, 0, TAU); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      let alpha = 1;
      if (p.iframes > 0 && p.hurtT > 0 && (Math.floor(rt * 18) & 1)) alpha = 0.45;
      ctx.globalAlpha = alpha;
      blit(ctx, s, s.img, p.x, p.y + bob);
      if (p.hurtT > 0.25) { ctx.globalAlpha = Math.min(1, (p.hurtT - 0.25) * 1.6); blit(ctx, s, s.flash, p.x, p.y + bob); }
      ctx.globalAlpha = 1;
      // warm breath clouds in the cold air
      if (mode !== 'dash') {
        const cyc = rt * 0.42 + (p.x * 0.001);
        const ph = cyc % 1;
        if (ph < 0.5) {
          const f = p.facing < 0 ? -1 : 1, q = ph / 0.5;
          const bx = p.x + f * (5.8 + q * 6), by = p.y - 23.6 + bob - q * 3;
          drawPuff(ctx, 0.62 - q * 0.3, bx, by, 1.4 + q * 3.6, (1 - q) * 0.55 * Math.min(1, q * 5));
          drawPuff(ctx, 0.55 - q * 0.3, bx + f * 2.2 * q, by - 1.4 * q, 1 + q * 2.4, (1 - q) * 0.35 * Math.min(1, q * 5));
          ctx.globalAlpha = 1;
        }
      }
      haze(rt, p.x, p.y - 26, 16, 16, 0.35, 1.3);
    },

    drawEnemy(ctx, e, view) {
      const rt = view.rt;
      let frames, fi;
      if (e.type === 'ghost') { frames = WISP; fi = Math.floor(rt * 10 + e.seed * 50) & 7; }
      else if (e.type === 'colossus') { frames = BRUTE; fi = Math.floor((e.anim * 0.22 + e.seed) * 8) & 7; }
      else { frames = CRIT; fi = Math.floor((e.anim * 0.4 + e.seed) * 8) & 7; }
      const side = e.facing < 0 ? 1 : 0;
      const s = frames[fi][side];
      let x = e.x, y = e.y;
      const ghost = e.type === 'ghost';
      if (ghost) y -= 3 + Math.sin(rt * 2.4 + e.seed * 9) * 1.5;
      if (e.dying) {
        // the body cools down through the ramp while it slumps
        const t = clamp(e.deathT, 0, 1);
        const sx = 1 + t * 0.16, sy = 1 - t * 0.38;
        ctx.globalAlpha = Math.max(0, 1 - t) * 0.95;
        blitS(ctx, s, s.cold, x, y, sx, sy);
        ctx.globalAlpha = Math.max(0, 1 - t * 1.8);
        blitS(ctx, s, s.img, x, y, sx, sy);
        ctx.globalAlpha = Math.max(0, 0.8 - t * 3);
        blitS(ctx, s, s.flash, x, y, sx, sy);
        ctx.globalAlpha = 1;
        return;
      }
      if (e.spawnT < 1) {
        // a cold silhouette appears first and warms up to full heat
        const k = clamp(e.spawnT, 0, 1);
        ctx.globalAlpha = Math.min(1, k * 2.2);
        blit(ctx, s, s.cold, x, y);
        ctx.globalAlpha = smooth(0.35, 1, k);
        blit(ctx, s, s.img, x, y);
        const rr = e.r * (2.6 - 1.6 * k);
        ctx.globalAlpha = (1 - k) * 0.8;
        ctx.strokeStyle = col(0.55 + 0.35 * k); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(e.x, e.y, rr, rr * 0.42, 0, 0, TAU); ctx.stroke();
        ctx.globalAlpha = 1;
        return;
      }
      if (ghost) {
        const sp = Math.hypot(e.vx, e.vy);
        if (sp > 8) {
          ctx.globalAlpha = 0.34; blit(ctx, s, s.after, x - e.vx * 0.06, y - e.vy * 0.06);
          ctx.globalAlpha = 0.16; blit(ctx, s, s.after, x - e.vx * 0.12, y - e.vy * 0.12);
        }
        ctx.globalAlpha = 0.8 + 0.2 * U.hash2(Math.floor(rt * 24), Math.floor(e.seed * 9999), 7);
      }
      blit(ctx, s, s.img, x, y);
      ctx.globalAlpha = 1;
      if (e.type === 'colossus') {
        const ph = (e.anim * 0.22 + e.seed) * 2, f = ph - Math.floor(ph);
        if (f < 0.3) {
          const k = f / 0.3;
          ctx.globalAlpha = (1 - k) * 0.5;
          ctx.strokeStyle = col(0.6 - k * 0.2); ctx.lineWidth = 1;
          const rr = 14 + k * 16;
          ctx.beginPath(); ctx.ellipse(e.x, e.y, rr, rr * 0.38, 0, 0, TAU); ctx.stroke();
          ctx.globalAlpha = 1;
        }
        haze(rt, e.x, e.y - 40, 40, 30, 0.6, e.seed * 20);
      }
      if (e.flash > 0) {
        ctx.globalAlpha = Math.min(1, e.flash * 1.15);
        blit(ctx, s, s.flash, x, y);
        ctx.globalAlpha = 1;
      }
    },

    /* ---------- effects ---------- */
    drawGem(ctx, g, view) {
      const set = g.big ? GEMB : GEMS;
      const s = set[Math.floor(view.rt * 5 + g.seed * 6) % 6];
      const bob = Math.sin(view.rt * 3 + g.seed * 12) * 0.8;
      const pop = g.pop > 0 ? Math.sin(g.pop * Math.PI) * 6 : 0;
      drawPuff(ctx, g.big ? 0.5 : 0.42, g.x, g.y, g.big ? 6 : 4.4, 0.55, 0.42);
      if (g.fly) {
        const sp = Math.hypot(g.vx, g.vy) || 1;
        ctx.globalAlpha = 0.45; blit(ctx, s, s.after, g.x - (g.vx / sp) * 3.5, g.y - (g.vy / sp) * 3.5 + bob);
        ctx.globalAlpha = 0.2; blit(ctx, s, s.after, g.x - (g.vx / sp) * 7, g.y - (g.vy / sp) * 7 + bob);
      }
      ctx.globalAlpha = 1;
      blit(ctx, s, s.img, g.x, g.y + bob - pop);
    },

    drawProjectile(ctx, pr, view) {
      ctx.save();
      ctx.translate(pr.x, pr.y - 6);
      ctx.rotate(pr.angle);
      const L = Math.min(1, pr.age * 8 + 0.15) * (pr.life < 0.15 ? Math.max(0, pr.life) / 0.15 : 1);
      ctx.drawImage(TRAIL.img, -TRAIL.ax * TRAIL.w * L, -TRAIL.ay * TRAIL.h, TRAIL.w * L, TRAIL.h);
      ctx.drawImage(HEAD.img, -HEAD.ax * HEAD.w, -HEAD.ay * HEAD.h, HEAD.w, HEAD.h);
      ctx.restore();
    },

    drawOrbital(ctx, o, view) {
      let tr = trails.get(o);
      if (!tr) { tr = []; trails.set(o, tr); }
      if (!tr.length || tr[tr.length - 1].rt !== view.rt) {
        tr.push({ x: o.x, y: o.y, rt: view.rt });
        if (tr.length > 14) tr.shift();
      }
      // cooling arc of residual heat behind the orb
      ctx.lineCap = 'butt';
      for (let i = 1; i < tr.length; i++) {
        const k = i / tr.length, a = tr[i - 1], b = tr[i];
        if (Math.hypot(b.x - a.x, b.y - a.y) > 20) continue;
        ctx.globalAlpha = k * 0.85;
        ctx.strokeStyle = col(0.45 + k * 0.45);
        ctx.lineWidth = 0.8 + k * 2.4;
        ctx.beginPath(); ctx.moveTo(a.x, a.y - 8); ctx.lineTo(b.x, b.y - 8); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const pulse = 1 + Math.sin(view.rt * 9 + o.idx * 2) * 0.06;
      ctx.drawImage(ORB.img, o.x - ORB.ax * ORB.w * pulse, o.y - 8 - ORB.ay * ORB.h * pulse, ORB.w * pulse, ORB.h * pulse);
    },

    drawParticle(ctx, pt, view) {
      const k = Math.max(0, pt.life / pt.max);
      const y = pt.y - pt.z;
      switch (pt.kind) {
        case 'heat': {
          const t = pt.t0 * (0.32 + 0.68 * k);
          const vx = pt.vx, vy = pt.vy - (pt.vz || 0), sp = Math.hypot(vx, vy);
          const L = Math.min(8, 1 + sp * 0.035) * pt.size * 0.5;
          const nx = sp > 0.01 ? vx / sp : 1, ny = sp > 0.01 ? vy / sp : 0;
          ctx.globalAlpha = Math.min(1, k * 2);
          ctx.strokeStyle = col(t); ctx.lineWidth = pt.size * 0.45; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(pt.x, y); ctx.lineTo(pt.x - nx * L, y - ny * L); ctx.stroke();
          break;
        }
        case 'ember': {
          // hot debris: a short streak along its motion, cooling through the ramp
          const t = pt.t0 * (0.45 + 0.55 * k), s = pt.size * (0.55 + 0.45 * k);
          const vx = pt.vx, vy = pt.vy - pt.vz, sp = Math.hypot(vx, vy);
          ctx.globalAlpha = Math.min(1, k * 2.5);
          if (sp > 12) {
            const L = Math.min(5, sp * 0.03) * (0.5 + 0.5 * k);
            ctx.strokeStyle = col(t); ctx.lineWidth = s * 0.8; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(pt.x, y); ctx.lineTo(pt.x - (vx / sp) * L, y - (vy / sp) * L); ctx.stroke();
          } else { ctx.fillStyle = col(t); ctx.fillRect(pt.x - s / 2, y - s / 2, s, s); }
          break;
        }
        case 'puff': {
          const r = pt.size * (1 + (1 - k) * pt.grow);
          drawPuff(ctx, pt.t0 * (0.4 + 0.6 * k), pt.x, y, r, k * pt.a0);
          break;
        }
        case 'ring': {
          const e = 1 - k, r = pt.r0 + (pt.r1 - pt.r0) * (1 - (1 - e) * (1 - e));
          ctx.globalAlpha = Math.min(1, k * 1.6);
          ctx.strokeStyle = col(pt.t0 * (0.58 + 0.42 * k)); ctx.lineWidth = pt.lw * (0.45 + 0.75 * k);
          ctx.beginPath(); ctx.ellipse(pt.x, y, r, r * pt.sq, 0, 0, TAU); ctx.stroke();
          break;
        }
        case 'imprint': {
          if (imprintStamp !== view.rt) drawImprint(ctx, pt);
          break;
        }
        default: {
          ctx.globalAlpha = k;
          ctx.fillStyle = pt.color || COLS[50];
          const s = pt.size || 2;
          ctx.fillRect(pt.x - s / 2, y - s / 2, s, s);
        }
      }
      ctx.globalAlpha = 1;
    },

    drawNumber(ctx, n, view) {
      const D = digits();
      const A = n.crit ? D.crit : D.norm;
      const lf = n.life / n.max;
      const pop = 1 + Math.max(0, lf - 0.8) * 2.4;
      const hW = (n.crit ? 13 : 9) * pop;
      const sc = hW / A.H;
      const str = String(n.value);
      const codes = [];
      for (let i = 0; i < str.length; i++) { const d = str.charCodeAt(i) - 48; if (d >= 0 && d <= 9) codes.push(d); }
      codes.push(10); // degree sign
      let W = 0;
      for (const d of codes) W += A.adv[d] * 0.92;
      let x = n.x - (W * sc) / 2;
      const y = n.y - hW / 2 - 4;
      ctx.globalAlpha = Math.min(1, lf * 2.4);
      for (const d of codes) {
        const sw = A.adv[d] + A.pad * 2;
        ctx.drawImage(A.c, A.xs[d], 0, sw, A.H, x - A.pad * sc, y, sw * sc, A.H * sc);
        x += A.adv[d] * 0.92 * sc;
      }
      ctx.globalAlpha = 1;
    },

    /* ---------- atmosphere: the camera ---------- */
    drawWorldOverlay(ctx, view, game) {
      if (hazeStamp !== view.rt) { hazeStamp = view.rt; HAZE.length = 0; }
      // auto-tracking box on the hottest large subject near the centre
      const p = game.player;
      let best = null, bd = 1e12;
      for (const e of game.enemies) {
        if (e.dying || e.spawnT < 1) continue;
        if (e.x < view.x0 + 20 || e.x > view.x1 - 20 || e.y < view.y0 + 50 || e.y > view.y1 - 10) continue;
        const d = (e.x - p.x) ** 2 + (e.y - p.y) ** 2 - (e.type === 'colossus' ? 1e7 : 0);
        if (d < bd && (e.type === 'colossus' || d < 150 * 150)) { bd = d; best = e; }
      }
      if (!best) { lock.id = -1; return; }
      const top = heightOf(best) * (best.type === 'ghost' ? 1.55 : 1.75) + 6;
      const hw = best.r * 1.35 + 5, cx = best.x, cy = best.y - top / 2 + 2;
      if (lock.id !== best.id) { lock = { id: best.id, t0: view.rt, x: cx, y: cy, w: hw, h: top / 2 }; }
      lock.x = U.lerp(lock.x, cx, 0.35); lock.y = U.lerp(lock.y, cy, 0.35);
      const acq = clamp((view.rt - lock.t0) / 0.25, 0, 1);
      const gsc = 1 + (1 - U.ease.outQuad(acq)) * 0.7;
      const w = hw * gsc, h = (top / 2) * gsc, L = Math.min(w, h) * 0.45;
      const x0 = lock.x - w, x1 = lock.x + w, y0 = lock.y - h, y1 = lock.y + h;
      const path = () => {
        ctx.beginPath();
        ctx.moveTo(x0, y0 + L); ctx.lineTo(x0, y0); ctx.lineTo(x0 + L, y0);
        ctx.moveTo(x1 - L, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + L);
        ctx.moveTo(x0, y1 - L); ctx.lineTo(x0, y1); ctx.lineTo(x0 + L, y1);
        ctx.moveTo(x1 - L, y1); ctx.lineTo(x1, y1); ctx.lineTo(x1, y1 - L);
      };
      ctx.lineCap = 'square';
      ctx.globalAlpha = 0.55; ctx.strokeStyle = '#020008'; ctx.lineWidth = 1.5; path(); ctx.stroke();
      ctx.globalAlpha = 0.95; ctx.strokeStyle = UI; ctx.lineWidth = 0.7; path(); ctx.stroke();
      if (acq >= 1) {
        const v = tempOf(best) + (U.hash2(Math.floor(view.rt * 3), best.id, 5) - 0.5) * 0.6;
        const tx = x0, ty = y0 - 4.2;
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#e3443a';
        ctx.beginPath(); ctx.moveTo(tx, ty + 1.8); ctx.lineTo(tx + 2.2, ty + 1.8); ctx.lineTo(tx + 1.1, ty - 0.3); ctx.closePath(); ctx.fill();
        const t = textImg(v.toFixed(1) + '°C', 36);
        const k = 5.4 / 36;
        ctx.drawImage(t.c, tx + 3.2 - t.pad * k, ty + 0.8 - (t.h / 2) * k, t.w * k, t.h * k);
      }
      ctx.globalAlpha = 1;
    },

    drawScreenOverlay(ctx, view, game) {
      const W = view.W, H = view.H, S = view.S, rt = view.rt;
      // heat haze: rows above hot sources are re-drawn with a small sideways wobble
      if (hazeStamp === rt && SCR) {
        const cvs = ctx.canvas;
        for (const hz of HAZE) {
          const sx = Math.round((hz.x - view.x) * S + W / 2 - (hz.w * S) / 2), sy = Math.round((hz.y - view.y) * S + H / 2 - hz.h * S);
          const x0 = Math.max(0, sx), y0 = Math.max(0, sy), x1 = Math.min(W, sx + Math.round(hz.w * S)), y1 = Math.min(H, sy + Math.round(hz.h * S));
          const w = x1 - x0, h = y1 - y0;
          if (w < 4 || h < 4) continue;
          if (SCR.c.width < w || SCR.c.height < h) { SCR.c.width = Math.max(SCR.c.width, w); SCR.c.height = Math.max(SCR.c.height, h); }
          SCR.ctx.clearRect(0, 0, w, h);
          SCR.ctx.drawImage(cvs, x0, y0, w, h, 0, 0, w, h);
          const strip = Math.max(2, Math.round(S * 0.9)), Hs = hz.h * S;
          for (let yy = 0; yy < h; yy += strip) {
            const sh = Math.min(strip, h - yy);
            const gy = (y0 + yy - sy) / Hs;
            const fall = Math.sin(clamp(gy, 0, 1) * Math.PI) * (0.4 + 0.6 * gy);
            const off = Math.sin(((y0 + yy) / S) * 0.9 - rt * 8 + hz.seed) * hz.amp * S * fall;
            if (Math.abs(off) < 0.3) continue;
            ctx.drawImage(SCR.c, 0, yy, w, sh, x0 + off, y0 + yy, w, sh);
          }
        }
      }
      // auto gain control: a strong heat event makes the whole image jump brighter for a moment
      const dt = clamp(rt - lastRt, 0, 0.1); lastRt = rt;
      agc *= Math.exp(-dt * 5);
      if (agc > 0.01) {
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = agc * 0.32;
        ctx.fillStyle = '#fdc52e'; ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
      // sensor grain: temporal noise + fixed-pattern columns
      if (GRAIN) {
        const gi = Math.floor(rt * 30) & 3;
        if (!GRAINPAT) GRAINPAT = GRAIN.map((g) => ctx.createPattern(g, 'repeat'));
        const gs = Math.max(1, Math.round(H / 620));
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.setTransform(gs, 0, 0, gs, ((U.hash2(gi, Math.floor(rt * 30), 3) * 160) | 0) * gs, ((U.hash2(Math.floor(rt * 30), gi, 4) * 160) | 0) * gs);
        ctx.fillStyle = GRAINPAT[gi];
        ctx.fillRect(-160, -160, W / gs + 320, H / gs + 320);
        ctx.restore();
      }
    },

    drawDisplayOverlay(ctx, view, game) {
      const W = view.displayW, H = view.displayH, rt = view.rt;
      if (--fontCheck <= 0) { fontCheck = 30; const ok = fontLoaded('Share Tech Mono'); if (ok !== ovlFont) { ovlFont = ok; OVLkey = ''; } }
      const key = W + 'x' + H;
      if (key !== OVLkey) { OVL = buildOverlay(W, H); OVLkey = key; }
      ctx.drawImage(OVL, 0, 0);
      const { u, m, bx, by, bw, fs, cx, cy } = overlayGeom(W, H);
      // REC + elapsed time
      const yR = H - m - 42 * u;
      if (Math.floor(rt * 1.6) % 2 === 0) {
        ctx.fillStyle = '#e3443a';
        ctx.beginPath(); ctx.arc(m + 12 * u, yR, 6 * u, 0, TAU); ctx.fill();
      }
      const tt = Math.floor(rt), hh = Math.floor(tt / 3600), mm = Math.floor(tt / 60) % 60, ss = tt % 60;
      const p2 = (v) => String(v).padStart(2, '0');
      uiTextC(ctx, 'REC  ' + p2(hh) + ':' + p2(mm) + ':' + p2(ss), m + 26 * u, yR, fs, 'left');
      // time stamp
      const base = 23 * 3600 + 41 * 60 + 7 + tt;
      uiTextC(ctx, '2026-10-25  ' + p2(Math.floor(base / 3600) % 24) + ':' + p2(Math.floor(base / 60) % 60) + ':' + p2(base % 60), W - m - 6 * u, H - m - 18 * u, Math.round(fs * 0.9), 'right');
      // spot meter on the subject in the centre
      const sp = 36.6 + (U.hash2(Math.floor(rt * 2), 7, 9) - 0.5) * 0.4;
      uiTextC(ctx, 'SP1 ' + sp.toFixed(1) + '°C', cx + 30 * u * 2.1 + 26 * u, cy - 30 * u * 2.1 + 6 * u, fs, 'left');
      // scene maximum above the scale bar
      let mx = 41.2;
      for (const e of game.enemies) if (!e.dying && e.type === 'colossus' && e.x > view.x0 && e.x < view.x1 && e.y > view.y0 && e.y < view.y1) { mx = 61.9; break; }
      uiTextC(ctx, 'MAX ' + (mx + (U.hash2(Math.floor(rt * 2), 3, 9) - 0.5) * 0.4).toFixed(1), bx + bw, by - 44 * u, Math.round(fs * 0.86), 'right', '#ffe777');
      // periodic non-uniformity correction (the camera's shutter click)
      const nuc = rt % 16;
      if (nuc > 0.4 && nuc < 1.2 && Math.floor(rt * 8) % 2 === 0) uiTextC(ctx, 'NUC', W - m - 6 * u, m + 22 * u, fs, 'right', '#fdc52e');
    },

    drawIcon(ctx, id, size) {
      ctx.drawImage(iconImage(id, size), 0, 0, size, size);
    },

    /* ---------- events: heat bursts, hot streaks, cooling particles ---------- */
    onHit(game, e, src) {
      const z = heightOf(e) * 0.75;
      for (let i = 0; i < 4; i++) spark(game, e.x, e.y, z, Math.random() * TAU, 60 + Math.random() * 80, 0.98, 0.16 + Math.random() * 0.14, 2);
      puffP(game, e.x, e.y, z, 2.6, 0.95, 0.22, 1.8, 0.9);
    },
    onKill(game, e) {
      const big = e.type === 'colossus', z = heightOf(e) * 0.7;
      // instant white-hot pop, then rising puffs that cool through the ramp
      puffP(game, e.x, e.y, z, e.r * (big ? 1.5 : 1.25), 1.0, 0.2, 0.9, 1);
      const n = big ? 10 : 5;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU, d = Math.random() * e.r * 0.7;
        puffP(game, e.x + Math.cos(a) * d, e.y + Math.sin(a) * d * 0.5, z + Math.random() * z * 0.6, (big ? 7.5 : 4.2) + Math.random() * 3, 0.98, 0.6 + Math.random() * 0.45, 1.8, 0.9, Math.cos(a) * 22, Math.sin(a) * 12, 18);
      }
      emberP(game, e.x, e.y, z, big ? 18 : 9, big ? 130 : 95, 1.0, big ? 1.1 : 0.85);
      for (let i = 0; i < (big ? 10 : 5); i++) spark(game, e.x, e.y, z, Math.random() * TAU, 90 + Math.random() * 120, 1.0, 0.2 + Math.random() * 0.15, 2.4);
      ringP(game, e.x, e.y, 0, e.r * 0.6, e.r * (big ? 5 : 3.4), 1.0, big ? 0.7 : 0.5, 0.42, big ? 2.2 : 1.6);
      game.addParticle({ kind: 'imprint', x: e.x, y: e.y, size: e.r * (big ? 1.6 : 1.3), t0: big ? 0.62 : 0.5, life: big ? 4 : 2.6, drag: 0 });
      if (big) agc = Math.max(agc, 0.45);
    },
    onHurt(game, p) {
      for (let i = 0; i < 10; i++) spark(game, p.x, p.y, 14, Math.random() * TAU, 70 + Math.random() * 110, 1.0, 0.28 + Math.random() * 0.12, 2.6);
      ringP(game, p.x, p.y, 14, 4, 22, 0.95, 0.3, 1, 1.4);
      puffP(game, p.x, p.y, 14, 4, 1.0, 0.3, 1.4, 0.8);
      agc = Math.max(agc, 0.6);
    },
    onPickup(game, g) {
      const p = game.player;
      ringP(game, p.x, p.y, 0, 3, g.big ? 18 : 11, g.big ? 0.95 : 0.82, 0.28, 0.42, 0.9);
      for (let i = 0; i < (g.big ? 6 : 2); i++) {
        game.addParticle({ kind: 'ember', x: p.x + (Math.random() - 0.5) * 10, y: p.y, z: 6 + Math.random() * 14, vx: (Math.random() - 0.5) * 16, vy: 0, vz: 28 + Math.random() * 20, grav: 1, drag: 1, size: 1.1, t0: 0.95, life: 0.45 + Math.random() * 0.2 });
      }
    },
    onShoot(game, pr) {
      for (let i = 0; i < 2; i++) spark(game, pr.x, pr.y + 6, 6, pr.angle + (Math.random() - 0.5) * 0.9, 80 + Math.random() * 60, 1.0, 0.12, 1.8);
      puffP(game, pr.x, pr.y + 6, 6, 1.6, 0.95, 0.16, 1.4, 0.7);
    },
    onDash(game, p) {
      ringP(game, p.x, p.y, 0, 4, 22, 0.7, 0.32, 0.42, 1.2);
      for (let i = 0; i < 6; i++) {
        const a = Math.atan2(-p.dashY, -p.dashX) + (Math.random() - 0.5) * 1.2, sp = 20 + Math.random() * 40;
        puffP(game, p.x, p.y, 3 + Math.random() * 10, 2 + Math.random() * 2, 0.6, 0.45 + Math.random() * 0.2, 1.6, 0.6, Math.cos(a) * sp, Math.sin(a) * sp * 0.6, 8);
      }
    },
    onLevelUp(game, p) {
      ringP(game, p.x, p.y, 0, 6, 72, 0.95, 0.75, 0.42, 1.8);
      ringP(game, p.x, p.y, 0, 4, 46, 0.75, 0.55, 0.42, 1.1);
      for (let i = 0; i < 20; i++) {
        game.addParticle({ kind: 'ember', x: p.x + (Math.random() - 0.5) * 22, y: p.y + (Math.random() - 0.5) * 8, z: 2, vx: (Math.random() - 0.5) * 24, vy: 0, vz: 70 + Math.random() * 110, grav: 50, drag: 1, size: 1.4 + Math.random(), t0: 0.9 + Math.random() * 0.1, life: 0.6 + Math.random() * 0.5 });
      }
      for (let i = 0; i < 6; i++) puffP(game, p.x + (Math.random() - 0.5) * 12, p.y, 4 + i * 6, 4 + Math.random() * 3, 0.9, 0.6 + Math.random() * 0.3, 1.6, 0.7, 0, 0, 30 + i * 8);
    },
    onDeath(game, p) {
      for (let i = 0; i < 10; i++) {
        const a = Math.random() * TAU;
        puffP(game, p.x, p.y, 12, 5 + Math.random() * 4, 1.0, 0.8 + Math.random() * 0.4, 1.6, 0.85, Math.cos(a) * 30, Math.sin(a) * 18, 10);
      }
      emberP(game, p.x, p.y, 14, 20, 130, 1.0, 1.2);
      ringP(game, p.x, p.y, 0, 6, 80, 0.95, 0.9, 0.42, 1.8);
      agc = Math.max(agc, 1);
    },
  });
})();
