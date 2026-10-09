/* Infinite ground: chunk cache + helpers for blended multi-texture terrain and seamless decal scattering. */
(function () {
  'use strict';
  const U = window.U;
  const G = {};

  /**
   * Per-pixel terrain blending into a chunk.
   * opts:
   *  ctx, info         – chunk ctx + info (from renderGroundChunk)
   *  layers            – [{ tex: U.texture(...), scale?: world units per texel (default 1/res) }]
   *  weights(x,y,w)    – fill Float32Array w (len = layers) with weights for world pos (auto-normalized)
   *  tint?(x,y,c)      – optional: fill c[0..2] with color multipliers (1 = unchanged) – macro variation
   *  mode?             – 'blend' (smooth, default) | 'dither' (ordered dither, pixel art) | 'hard' (argmax)
   *  step?             – weight grid step in pixels (default ≈ 3 world units; weights are bilinearly interpolated)
   *  ditherScale?      – size of a dither cell in pixels (default 1)
   * G.blendGen is the same as a generator (yields every few rows) – use it with `yield*` inside a
   * generator renderGroundChunk so chunk building is spread over several frames (no hitches).
   */
  G.blend = function (opts) {
    const it = G.blendGen(opts);
    while (!it.next().done);
  };
  G.blendGen = function* (opts) {
    const { ctx, info, layers, weights } = opts;
    const res = info.res, wx = info.wx, wy = info.wy;
    const W = info.px;
    const step = opts.step || Math.max(2, Math.round(3 * res));
    const mode = opts.mode || 'blend';
    const dsc = opts.ditherScale || 1;
    const L = layers.length;
    const gw = Math.ceil(W / step) + 2;
    const CH = L + 3;
    const grid = new Float32Array(gw * gw * CH);
    const tmp = new Float32Array(L);
    const tint = [1, 1, 1];
    const hasTint = !!opts.tint;
    for (let gy = 0; gy < gw; gy++) {
      if ((gy & 7) === 7) yield;
      for (let gx = 0; gx < gw; gx++) {
        const x = wx + (gx * step) / res, y = wy + (gy * step) / res;
        tmp.fill(0);
        weights(x, y, tmp);
        let s = 0;
        for (let i = 0; i < L; i++) {
          if (!(tmp[i] > 0)) tmp[i] = 0;
          s += tmp[i];
        }
        if (s <= 0) { tmp[0] = 1; s = 1; }
        const o = (gy * gw + gx) * CH;
        for (let i = 0; i < L; i++) grid[o + i] = tmp[i] / s;
        if (hasTint) {
          tint[0] = tint[1] = tint[2] = 1;
          opts.tint(x, y, tint);
          grid[o + L] = tint[0]; grid[o + L + 1] = tint[1]; grid[o + L + 2] = tint[2];
        } else {
          grid[o + L] = grid[o + L + 1] = grid[o + L + 2] = 1;
        }
      }
    }
    const tex = layers.map((l) => l.tex);
    const sc = layers.map((l) => 1 / ((l.scale || 1 / res) * res)); // texels per pixel
    const img = ctx.createImageData(W, W);
    const d = img.data;
    const wv = new Float32Array(CH);
    // texture origin offsets so textures stay continuous across chunks
    const offX = layers.map((l, i) => (wx * res) * sc[i]);
    const offY = layers.map((l, i) => (wy * res) * sc[i]);
    for (let py = 0; py < W; py++) {
      if ((py & 15) === 15) yield;
      const gyf = py / step, gy0 = gyf | 0, fy = gyf - gy0;
      for (let px = 0; px < W; px++) {
        const gxf = px / step, gx0 = gxf | 0, fx = gxf - gx0;
        const o00 = (gy0 * gw + gx0) * CH, o10 = o00 + CH, o01 = o00 + gw * CH, o11 = o01 + CH;
        for (let i = 0; i < CH; i++) {
          const a = grid[o00 + i] + (grid[o10 + i] - grid[o00 + i]) * fx;
          const b = grid[o01 + i] + (grid[o11 + i] - grid[o01 + i]) * fx;
          wv[i] = a + (b - a) * fy;
        }
        let r = 0, g = 0, b = 0;
        if (mode === 'blend') {
          for (let i = 0; i < L; i++) {
            const w = wv[i];
            if (w < 0.002) continue;
            const t = tex[i];
            let tx = Math.floor(offX[i] + px * sc[i]) % t.w; if (tx < 0) tx += t.w;
            let ty = Math.floor(offY[i] + py * sc[i]) % t.h; if (ty < 0) ty += t.h;
            const to = (ty * t.w + tx) * 4;
            r += t.data[to] * w; g += t.data[to + 1] * w; b += t.data[to + 2] * w;
          }
        } else {
          let pick = 0;
          if (mode === 'dither') {
            const gxp = Math.floor((wx * res + px) / dsc), gyp = Math.floor((wy * res + py) / dsc);
            const th = U.bayer8[((gyp & 7) << 3) | (gxp & 7)];
            let acc = 0;
            pick = L - 1;
            for (let i = 0; i < L; i++) {
              acc += wv[i];
              if (th < acc) { pick = i; break; }
            }
          } else {
            let bw = -1;
            for (let i = 0; i < L; i++) if (wv[i] > bw) { bw = wv[i]; pick = i; }
          }
          const t = tex[pick];
          let tx = Math.floor(offX[pick] + px * sc[pick]) % t.w; if (tx < 0) tx += t.w;
          let ty = Math.floor(offY[pick] + py * sc[pick]) % t.h; if (ty < 0) ty += t.h;
          const to = (ty * t.w + tx) * 4;
          r = t.data[to]; g = t.data[to + 1]; b = t.data[to + 2];
        }
        const o = (py * W + px) * 4;
        d[o] = r * wv[L]; d[o + 1] = g * wv[L + 1]; d[o + 2] = b * wv[L + 2]; d[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  };

  /**
   * Seamless decal scattering across chunk borders. Iterates a jittered world grid (cell size `cell`) and calls
   * fn(x, y, rng, cellX, cellY) for every point whose decal (radius `margin`) may touch this chunk.
   * Deterministic per cell, so neighbouring chunks draw the same decal and edges line up perfectly.
   * Draw with world coordinates (the chunk ctx is already transformed).
   */
  G.scatter = function (info, cell, seed, margin, fn) {
    const x0 = Math.floor((info.wx - margin) / cell), x1 = Math.floor((info.wx + info.size + margin) / cell);
    const y0 = Math.floor((info.wy - margin) / cell), y1 = Math.floor((info.wy + info.size + margin) / cell);
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const rng = U.rng(U.hashInt(cx, cy, seed));
        const x = (cx + rng.next()) * cell, y = (cy + rng.next()) * cell;
        if (x < info.wx - margin || x > info.wx + info.size + margin) continue;
        if (y < info.wy - margin || y > info.wy + info.size + margin) continue;
        fn(x, y, rng, cx, cy);
      }
    }
  };

  /**
   * Like scatter but each point belongs to exactly one chunk – use for props (drawn y-sorted, not baked).
   * Returns nothing; fn(x, y, rng, cellX, cellY).
   */
  G.scatterOwned = function (info, cell, seed, fn) {
    const x0 = Math.floor(info.wx / cell) - 1, x1 = Math.floor((info.wx + info.size) / cell) + 1;
    const y0 = Math.floor(info.wy / cell) - 1, y1 = Math.floor((info.wy + info.size) / cell) + 1;
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const rng = U.rng(U.hashInt(cx, cy, seed));
        const x = (cx + rng.next()) * cell, y = (cy + rng.next()) * cell;
        if (x < info.wx || x >= info.wx + info.size || y < info.wy || y >= info.wy + info.size) continue;
        fn(x, y, rng, cx, cy);
      }
    }
  };

  /** Keeps the area around the spawn point clear of tall props (player starts at 0,0). */
  G.nearSpawn = (x, y, r = 70) => x * x + y * y < r * r;

  /* ---------- Chunk cache ---------- */
  class ChunkCache {
    constructor(style) {
      this.style = style;
      this.size = style.chunkSize || 256;
      this.map = new Map();
      this.res = 1;
      this.max = 90;
      this.buildMs = 0;
      this.built = 0;
    }
    reset(res) {
      // make size*res an integer so chunk pixels line up
      this.res = Math.max(1, Math.round(this.size * res)) / this.size;
      this.map.clear();
      this.job = null;
    }
    key(cx, cy) { return cx + ',' + cy; }
    /** Starts building a chunk. Returns a job; call step(job, deadline) until it returns true. */
    startJob(cx, cy) {
      const st = this.style, size = this.size, res = this.res;
      const px = Math.round(size * res);
      const { c, ctx } = U.canvas(px, px);
      const info = { cx, cy, wx: cx * size, wy: cy * size, size, res, px };
      ctx.save();
      ctx.setTransform(res, 0, 0, res, -info.wx * res, -info.wy * res);
      let it = null;
      try {
        if (st.renderGroundChunk) {
          const r = st.renderGroundChunk(ctx, info);
          if (r && typeof r.next === 'function') it = r;
        } else {
          ctx.fillStyle = st.groundColor || '#333';
          ctx.fillRect(info.wx, info.wy, size, size);
        }
      } catch (e) { console.error(e); window.__reportError && window.__reportError(e); }
      return { cx, cy, c, ctx, info, it, key: this.key(cx, cy) };
    }
    stepJob(job, deadline) {
      const t0 = performance.now();
      if (job.it) {
        try {
          while (true) {
            const r = job.it.next();
            if (r.done) { job.it = null; break; }
            if (performance.now() > deadline) { this.buildMs += performance.now() - t0; return false; }
          }
        } catch (e) { job.it = null; console.error(e); window.__reportError && window.__reportError(e); }
      }
      job.ctx.restore();
      let props = [];
      if (this.style.propsForChunk) {
        try { props = this.style.propsForChunk(job.info) || []; } catch (e) { console.error(e); window.__reportError && window.__reportError(e); }
      }
      for (const p of props) { p.kind = 'prop'; if (p.sortY === undefined) p.sortY = p.y; }
      this.buildMs += performance.now() - t0;
      this.built++;
      const entry = { c: job.c, props, cx: job.cx, cy: job.cy, info: job.info };
      this.map.set(job.key, entry);
      return true;
    }
    build(cx, cy) {
      const job = this.startJob(cx, cy);
      this.stepJob(job, Infinity);
      return this.map.get(job.key);
    }
    get(cx, cy) { return this.map.get(this.key(cx, cy)); }
    /**
     * Make sure visible chunks exist. force=true builds all visible chunks synchronously.
     * Otherwise work continues incrementally on one job at a time within `budget` ms per frame,
     * pre-building a ring of chunks around the view so the player never sees missing ground.
     */
    ensure(view, force, budget = 5) {
      const s = this.size;
      const cx0 = Math.floor(view.x0 / s), cx1 = Math.floor(view.x1 / s);
      const cy0 = Math.floor(view.y0 / s), cy1 = Math.floor(view.y1 / s);
      const ccx = (cx0 + cx1) / 2, ccy = (cy0 + cy1) / 2;
      const isVisible = (cx, cy) => cx >= cx0 && cx <= cx1 && cy >= cy0 && cy <= cy1;
      if (force) {
        for (let cy = cy0; cy <= cy1; cy++) {
          for (let cx = cx0; cx <= cx1; cx++) {
            if (this.map.has(this.key(cx, cy))) continue;
            if (this.job && this.job.cx === cx && this.job.cy === cy) { this.stepJob(this.job, Infinity); this.job = null; continue; }
            this.build(cx, cy);
          }
        }
      }
      const deadline = performance.now() + budget;
      // a visible chunk is missing -> drop a ring job and build the visible one first
      let urgent = null;
      for (let cy = cy0; cy <= cy1 && !urgent; cy++) {
        for (let cx = cx0; cx <= cx1; cx++) if (!this.map.has(this.key(cx, cy))) { urgent = { cx, cy }; break; }
      }
      if (urgent && this.job && !isVisible(this.job.cx, this.job.cy)) this.job = null;
      while (performance.now() < deadline) {
        if (!this.job) {
          let best = null, bd = 1e9;
          for (let cy = cy0 - 1; cy <= cy1 + 1; cy++) {
            for (let cx = cx0 - 1; cx <= cx1 + 1; cx++) {
              if (this.map.has(this.key(cx, cy))) continue;
              const d = (cx - ccx) ** 2 + (cy - ccy) ** 2 - (isVisible(cx, cy) ? 1000 : 0);
              if (d < bd) { bd = d; best = { cx, cy }; }
            }
          }
          if (!best) break;
          this.job = this.startJob(best.cx, best.cy);
        }
        if (this.stepJob(this.job, deadline)) this.job = null;
        else break;
      }
      if (this.map.size > this.max) {
        const arr = [...this.map.values()].sort(
          (a, b) => ((b.cx - ccx) ** 2 + (b.cy - ccy) ** 2) - ((a.cx - ccx) ** 2 + (a.cy - ccy) ** 2)
        );
        for (let i = 0; i < arr.length - this.max; i++) this.map.delete(this.key(arr[i].cx, arr[i].cy));
      }
      return { cx0, cx1, cy0, cy1 };
    }
  }

  window.G = G;
  window.ChunkCache = ChunkCache;
})();
