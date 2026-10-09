/* Jack vs. the Turnip Ancestors – shared helpers (math, noise, color, sprites).
   Everything hangs off window.U so styles can use it without imports. */
(function () {
  'use strict';
  const U = {};
  U.TAU = Math.PI * 2;
  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.fract = (x) => x - Math.floor(x);
  U.smoothstep = (e0, e1, x) => {
    let t = (x - e0) / (e1 - e0);
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return t * t * (3 - 2 * t);
  };
  U.dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
  U.angleLerp = (a, b, t) => {
    let d = ((b - a + Math.PI) % U.TAU + U.TAU) % U.TAU - Math.PI;
    return a + d * t;
  };
  // Frame-rate independent exponential approach.
  U.damp = (a, b, lambda, dt) => U.lerp(a, b, 1 - Math.exp(-lambda * dt));

  /* ---------- Random ---------- */
  U.mulberry32 = function (seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  U.rng = function (seed) {
    const r = U.mulberry32(seed);
    return {
      next: r,
      range: (a, b) => a + (b - a) * r(),
      int: (a, b) => a + Math.floor(r() * (b - a + 1)),
      pick: (arr) => arr[Math.floor(r() * arr.length)],
      chance: (p) => r() < p,
      sign: () => (r() < 0.5 ? -1 : 1),
    };
  };
  U.hashInt = function (x, y, seed) {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return h >>> 0;
  };
  U.hash2 = (x, y, seed = 0) => U.hashInt(x, y, seed) / 4294967296;

  /* ---------- Noise ---------- */
  const GRAD = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * U.TAU;
    GRAD.push(Math.cos(a), Math.sin(a));
  }
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  function grad(ix, iy, seed, px, py, dx, dy) {
    if (px) ix = ((ix % px) + px) % px;
    if (py) iy = ((iy % py) + py) % py;
    const g = (U.hashInt(ix, iy, seed) & 15) * 2;
    return GRAD[g] * dx + GRAD[g + 1] * dy;
  }
  /** Gradient (Perlin) noise in ~[-1,1]. px/py > 0 make it periodic (tileable) on that lattice period. */
  U.perlin = function (x, y, seed = 0, px = 0, py = 0) {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = x - x0, fy = y - y0;
    const u = fade(fx), v = fade(fy);
    const n00 = grad(x0, y0, seed, px, py, fx, fy);
    const n10 = grad(x0 + 1, y0, seed, px, py, fx - 1, fy);
    const n01 = grad(x0, y0 + 1, seed, px, py, fx, fy - 1);
    const n11 = grad(x0 + 1, y0 + 1, seed, px, py, fx - 1, fy - 1);
    const a = n00 + u * (n10 - n00);
    const b = n01 + u * (n11 - n01);
    return (a + v * (b - a)) * 1.414;
  };
  /** Noise in [0,1]. */
  U.noise = (x, y, seed = 0) => U.perlin(x, y, seed) * 0.5 + 0.5;
  /** Fractal noise in ~[0,1] (non periodic). */
  U.fbm = function (x, y, seed = 0, oct = 4, lac = 2, gain = 0.5) {
    let a = 1, f = 1, s = 0, n = 0;
    for (let i = 0; i < oct; i++) {
      s += a * U.perlin(x * f, y * f, seed + i * 101);
      n += a;
      a *= gain;
      f *= lac;
    }
    return U.clamp((s / n) * 0.5 + 0.5, 0, 1);
  };
  /** Tileable fractal noise. x,y in lattice units; pattern repeats every `period` units (period must be integer). */
  U.fbmTile = function (x, y, period, seed = 0, oct = 4, gain = 0.5) {
    let a = 1, f = 1, s = 0, n = 0;
    for (let i = 0; i < oct; i++) {
      s += a * U.perlin(x * f, y * f, seed + i * 101, period * f, period * f);
      n += a;
      a *= gain;
      f *= 2;
    }
    return U.clamp((s / n) * 0.5 + 0.5, 0, 1);
  };
  /** Ridged noise [0,1] – good for cracks, veins, rivers. */
  U.ridge = (x, y, seed = 0) => 1 - Math.abs(U.perlin(x, y, seed));
  /**
   * Worley / cellular noise. Writes into `out` {f1,f2,id,x,y} (pass a reused object for speed).
   * period > 0 makes it tileable.
   */
  U.worley = function (x, y, seed = 0, period = 0, out) {
    out = out || {};
    const xi = Math.floor(x), yi = Math.floor(y);
    let f1 = 9, f2 = 9, id = 0, bx = 0, by = 0;
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        const cx = xi + i, cy = yi + j;
        let hx = cx, hy = cy;
        if (period) {
          hx = ((cx % period) + period) % period;
          hy = ((cy % period) + period) % period;
        }
        const h = U.hashInt(hx, hy, seed);
        const px = cx + 0.1 + ((h & 1023) / 1023) * 0.8;
        const py = cy + 0.1 + (((h >>> 10) & 1023) / 1023) * 0.8;
        const dx = px - x, dy = py - y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < f1) {
          f2 = f1; f1 = d; id = h; bx = px; by = py;
        } else if (d < f2) f2 = d;
      }
    }
    out.f1 = f1; out.f2 = f2; out.id = id; out.x = bx; out.y = by;
    return out;
  };
  /** Domain-warped fbm – organic, non-grid looking shapes. */
  U.warped = function (x, y, seed = 0, warp = 1, oct = 4) {
    const qx = U.fbm(x, y, seed + 17, 3) - 0.5;
    const qy = U.fbm(x + 5.2, y + 1.3, seed + 31, 3) - 0.5;
    return U.fbm(x + warp * qx * 2, y + warp * qy * 2, seed, oct);
  };

  /* ---------- Ordered dithering ---------- */
  U.bayer4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
  U.bayer8 = (function () {
    const m = [
      0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
      3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
    ];
    return m.map((v) => (v + 0.5) / 64);
  })();
  /** Dither threshold for integer pixel coords, [0,1). */
  U.dither = (x, y) => U.bayer8[((y & 7) << 3) | (x & 7)];

  /* ---------- Color ---------- */
  U.hex = function (h) {
    if (Array.isArray(h)) return h;
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  U.rgb = (c, a) =>
    a === undefined
      ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`
      : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  U.mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  U.mul = (c, f) => [U.clamp(c[0] * f, 0, 255), U.clamp(c[1] * f, 0, 255), U.clamp(c[2] * f, 0, 255)];
  /** Multi-stop gradient: stops = array of rgb arrays, t in [0,1]. */
  U.ramp = function (stops, t) {
    t = U.clamp(t, 0, 1) * (stops.length - 1);
    const i = Math.min(Math.floor(t), stops.length - 2);
    return U.mix(stops[i], stops[i + 1], t - i);
  };
  /** Snap a color to the nearest entry of a palette (array of rgb arrays). */
  U.nearest = function (c, pal) {
    let best = pal[0], bd = 1e9;
    for (const p of pal) {
      const d = (p[0] - c[0]) ** 2 * 0.3 + (p[1] - c[1]) ** 2 * 0.59 + (p[2] - c[2]) ** 2 * 0.11;
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  };

  /* ---------- Canvas / sprites ---------- */
  U.canvas = function (w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    const ctx = c.getContext('2d', { willReadFrequently: false });
    return { c, ctx };
  };
  /** Draw into a new offscreen canvas: fn(ctx, w, h). Returns the canvas. */
  U.sprite = function (w, h, fn) {
    const { c, ctx } = U.canvas(w, h);
    fn(ctx, c.width, c.height);
    return c;
  };
  /**
   * Pixel-art sprite from strings. rows: ['..aa..', ...], pal: {a:'#f80', ...}; '.' or ' ' = transparent.
   * Returns a canvas of size cols*scale x rows*scale.
   */
  U.pixelSprite = function (rows, pal, scale = 1) {
    const h = rows.length, w = Math.max(...rows.map((r) => r.length));
    const { c, ctx } = U.canvas(w * scale, h * scale);
    const cache = {};
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < rows[y].length; x++) {
        const ch = rows[y][x];
        if (ch === '.' || ch === ' ' || !(ch in pal)) continue;
        ctx.fillStyle = cache[ch] || (cache[ch] = Array.isArray(pal[ch]) ? U.rgb(pal[ch]) : pal[ch]);
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
    return c;
  };
  /** Returns a new canvas with a 1px (per `t`) outline around opaque pixels. Canvas grows by 2*t. */
  U.outline = function (src, color = '#000', t = 1, diagonal = false) {
    const w = src.width, h = src.height;
    const sctx = src.getContext('2d');
    const sd = sctx.getImageData(0, 0, w, h).data;
    const { c, ctx } = U.canvas(w + t * 2, h + t * 2);
    const img = ctx.createImageData(c.width, c.height);
    const d = img.data;
    const col = U.hex(color);
    const W = c.width;
    const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && sd[(y * w + x) * 4 + 3] > 40;
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < W; x++) {
        const sx = x - t, sy = y - t;
        if (solid(sx, sy)) continue;
        let near = false;
        for (let dy = -t; dy <= t && !near; dy++) {
          for (let dx = -t; dx <= t; dx++) {
            if (!diagonal && Math.abs(dx) + Math.abs(dy) > t) continue;
            if (solid(sx + dx, sy + dy)) { near = true; break; }
          }
        }
        if (near) {
          const o = (y * W + x) * 4;
          d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    ctx.drawImage(src, t, t);
    return c;
  };
  /** Silhouette copy of a sprite filled with one color (hit flashes, shadows). */
  U.tint = function (src, color, alpha = 1) {
    const { c, ctx } = U.canvas(src.width, src.height);
    ctx.drawImage(src, 0, 0);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, c.width, c.height);
    return c;
  };
  /** Horizontally mirrored copy. */
  U.flipX = function (src) {
    const { c, ctx } = U.canvas(src.width, src.height);
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(src, 0, 0);
    return c;
  };
  /**
   * Procedural tileable texture. fn(x, y, out) writes out[0..2] (0-255) for texel x,y.
   * Returns {w, h, data: Uint8ClampedArray(rgba), canvas}.
   */
  U.texture = function (w, h, fn) {
    const { c, ctx } = U.canvas(w, h);
    const img = ctx.createImageData(w, h);
    const d = img.data;
    const out = [0, 0, 0];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        out[0] = out[1] = out[2] = 0;
        fn(x, y, out);
        const o = (y * w + x) * 4;
        d[o] = out[0]; d[o + 1] = out[1]; d[o + 2] = out[2]; d[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return { w, h, data: d, canvas: c };
  };
  /** Wrap an existing canvas as a texture (for textures painted with canvas API – must be tileable). */
  U.textureFromCanvas = function (canvas) {
    const ctx = canvas.getContext('2d');
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return { w: canvas.width, h: canvas.height, data: img.data, canvas };
  };
  /** Draw a shape function onto a canvas so it tiles: fn(ctx, ox, oy) is called 9 times with offsets. */
  U.tileDraw = function (ctx, w, h, fn) {
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) fn(ctx, ox * w, oy * h);
  };

  /**
   * Draw a pre-rendered sprite in world space.
   * img is drawn so that its anchor (ax, ay in 0..1 of the image, default bottom-centre) sits at world (x, y).
   * scale = world units per sprite pixel (e.g. sprite rendered at 4 px per world unit -> scale 0.25).
   * snap  = grid in world units to snap to (pixel art: the art-pixel size, e.g. 1 or 2). 0 = no snapping.
   */
  U.drawSprite = function (ctx, img, x, y, scale = 1, ax = 0.5, ay = 1, flip = false, snap = 0) {
    const w = img.width * scale, h = img.height * scale;
    let dx = x - w * ax, dy = y - h * ay;
    if (snap) { dx = Math.round(dx / snap) * snap; dy = Math.round(dy / snap) * snap; }
    if (flip) {
      ctx.save();
      ctx.translate(dx + w, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, w, h);
      ctx.restore();
    } else ctx.drawImage(img, dx, dy, w, h);
  };

  /* ---------- Easing ---------- */
  U.ease = {
    outBack: (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
    outQuad: (t) => 1 - (1 - t) * (1 - t),
    inQuad: (t) => t * t,
    outElastic: (t) => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
  };

  window.U = U;
})();
