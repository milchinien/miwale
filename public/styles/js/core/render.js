/* Renderer: camera, pixel-art buffer, chunked ground, y-sorted entities. All visuals are delegated to the style. */
(function () {
  'use strict';
  const U = window.U;
  const VIEW_H = window.GameData.VIEW_H;

  /* Fallback drawers so a half-finished style never crashes. */
  const Default = {
    drawPlayer(ctx, p) {
      ctx.fillStyle = '#ff8a1f';
      ctx.beginPath(); ctx.arc(p.x, p.y - 8, 9, 0, U.TAU); ctx.fill();
    },
    drawEnemy(ctx, e) {
      ctx.globalAlpha = e.dying ? 1 - e.deathT : 1;
      ctx.fillStyle = e.flash > 0.5 ? '#fff' : e.type === 'ghost' ? '#cfe3ff' : e.type === 'colossus' ? '#7a4aa8' : '#b58ad6';
      ctx.beginPath(); ctx.arc(e.x, e.y - e.r, e.r, 0, U.TAU); ctx.fill();
      ctx.globalAlpha = 1;
    },
    drawProjectile(ctx, pr) {
      ctx.fillStyle = '#fff3c4';
      ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r, 0, U.TAU); ctx.fill();
    },
    drawOrbital(ctx, o) {
      ctx.fillStyle = '#ffcf5a';
      ctx.beginPath(); ctx.arc(o.x, o.y, 6, 0, U.TAU); ctx.fill();
    },
    drawGem(ctx, g) {
      ctx.fillStyle = g.big ? '#7cf0ff' : '#9dff7a';
      ctx.beginPath(); ctx.arc(g.x, g.y, g.big ? 4 : 2.5, 0, U.TAU); ctx.fill();
    },
    drawParticle(ctx, pt) {
      const a = U.clamp(pt.life / pt.max, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = pt.color || '#fff';
      const s = pt.size;
      ctx.fillRect(pt.x - s / 2, pt.y - pt.z - s / 2, s, s);
      ctx.globalAlpha = 1;
    },
    drawNumber(ctx, n) {
      const a = U.clamp(n.life / n.max * 2, 0, 1);
      ctx.globalAlpha = a;
      ctx.font = (n.crit ? 'bold 9px ' : '7px ') + 'sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = n.crit ? '#ffd23f' : '#fff';
      ctx.fillText(n.value, n.x, n.y);
      ctx.globalAlpha = 1;
    },
    drawProp() {},
  };

  class Renderer {
    constructor(canvas) {
      this.display = canvas;
      this.dctx = canvas.getContext('2d');
      this.buffer = U.canvas(2, 2);
      this.style = null;
      this.chunks = null;
      this.camX = 0;
      this.camY = 0;
      this.realTime = 0;
      this.frameMs = 0;
      this.drawList = [];
    }
    setStyle(style, game) {
      this.style = style;
      this.chunks = new window.ChunkCache(style);
      this.lastKey = '';
      this.resize(game, true);
    }
    resize(game, force) {
      const st = this.style;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = window.__forceW || window.innerWidth, cssH = window.__forceH || window.innerHeight;
      const W = Math.max(2, Math.round(cssW * dpr));
      const H = Math.max(2, Math.round(cssH * dpr));
      const key = W + 'x' + H + ':' + st.id;
      if (!force && key === this.lastKey) return;
      this.lastKey = key;
      this.display.width = W;
      this.display.height = H;
      this.display.style.width = cssW + 'px';
      this.display.style.height = cssH + 'px';
      this.dW = W; this.dH = H;
      if (st.pixelArt) {
        const ps = st.pixelArt.scale || 1; // world units per art pixel
        const artH = VIEW_H / ps;
        const up = Math.max(1, Math.round(H / artH));
        this.up = up;
        this.tW = Math.ceil(W / up);
        this.tH = Math.ceil(H / up);
        this.S = 1 / ps;
        this.buffer.c.width = this.tW;
        this.buffer.c.height = this.tH;
        this.pixel = true;
      } else {
        this.up = 1;
        this.tW = W; this.tH = H;
        this.S = H / VIEW_H;
        this.pixel = false;
      }
      const gres = this.pixel ? this.S : Math.min(this.S, st.groundResMax || 2.5);
      this.chunks.reset(gres);
      if (game) {
        game.viewW = this.tW / this.S;
        game.viewH = this.tH / this.S;
      }
    }

    makeView(game) {
      const S = this.S;
      let cx = this.camX, cy = this.camY;
      if (game.shake > 0) {
        cx += (Math.random() - 0.5) * game.shake;
        cy += (Math.random() - 0.5) * game.shake;
      }
      cx = Math.round(cx * S) / S;
      cy = Math.round(cy * S) / S;
      const hw = this.tW / 2 / S, hh = this.tH / 2 / S;
      return {
        W: this.tW, H: this.tH, S, x: cx, y: cy,
        x0: cx - hw, y0: cy - hh, x1: cx + hw, y1: cy + hh,
        t: game.time, rt: this.realTime, pixel: this.pixel, ps: this.pixel ? 1 / S : 0,
        displayW: this.dW, displayH: this.dH, up: this.up, game,
      };
    }

    snapCamera(game) {
      this.camX = game.player.x;
      this.camY = game.player.y - 6;
    }

    render(game, dt, force) {
      const t0 = performance.now();
      this.realTime += dt;
      const st = this.style;
      const p = game.player;
      this.camX = U.damp(this.camX, p.x, 10, dt);
      this.camY = U.damp(this.camY, p.y - 6, 10, dt);
      const view = this.makeView(game);
      const ctx = this.pixel ? this.buffer.ctx : this.dctx;
      const S = view.S, W = view.W, H = view.H;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = !this.pixel;
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = st.groundColor || '#000';
      ctx.fillRect(0, 0, W, H);

      // ground chunks, drawn at integer pixel positions -> no seams
      const range = this.chunks.ensure(view, force, 5);
      const size = this.chunks.size;
      const ox = W / 2 - view.x * S, oy = H / 2 - view.y * S;
      ctx.imageSmoothingEnabled = !this.pixel && !st.groundNearest;
      for (let cy = range.cy0; cy <= range.cy1; cy++) {
        for (let cx = range.cx0; cx <= range.cx1; cx++) {
          const ch = this.chunks.get(cx, cy);
          if (!ch) continue;
          const x0 = Math.round(cx * size * S + ox), x1 = Math.round((cx + 1) * size * S + ox);
          const y0 = Math.round(cy * size * S + oy), y1 = Math.round((cy + 1) * size * S + oy);
          ctx.drawImage(ch.c, x0, y0, x1 - x0, y1 - y0);
        }
      }
      ctx.imageSmoothingEnabled = !this.pixel;

      // world space
      ctx.setTransform(S, 0, 0, S, ox, oy);
      const m = 60;
      const inView = (o, pad = 0) => o.x > view.x0 - m - pad && o.x < view.x1 + m + pad && o.y > view.y0 - m - pad && o.y < view.y1 + m * 2 + pad;
      const call = (name, ...args) => {
        const fn = st[name] || Default[name];
        if (fn) fn.apply(st, args);
      };

      if (st.drawGroundOverlay) st.drawGroundOverlay(ctx, view, game);

      for (const g of game.gems) if (inView(g)) call('drawGem', ctx, g, view);

      // collect props from visible chunks (+1 ring for tall props)
      const list = this.drawList;
      list.length = 0;
      for (let cy = range.cy0 - 1; cy <= range.cy1 + 1; cy++) {
        for (let cx = range.cx0 - 1; cx <= range.cx1 + 1; cx++) {
          const ch = this.chunks.get(cx, cy);
          if (!ch) continue;
          for (const pr of ch.props) if (inView(pr, pr.pad || 60)) list.push(pr);
        }
      }
      for (const e of game.enemies) if (inView(e)) list.push(e);
      list.push(p);

      if (st.drawShadow) for (const o of list) st.drawShadow(ctx, o, view);

      list.sort((a, b) => (a.sortY !== undefined ? a.sortY : a.y) - (b.sortY !== undefined ? b.sortY : b.y));
      for (const o of list) {
        ctx.globalAlpha = 1;
        if (o.kind === 'prop') call('drawProp', ctx, o, view);
        else if (o.kind === 'enemy') call('drawEnemy', ctx, o, view);
        else call('drawPlayer', ctx, o, view);
      }
      ctx.globalAlpha = 1;
      for (const o of game.orbitals) call('drawOrbital', ctx, o, view);
      for (const pr of game.projectiles) if (inView(pr)) call('drawProjectile', ctx, pr, view);
      for (const pt of game.particles) if (inView(pt)) call('drawParticle', ctx, pt, view);
      ctx.globalAlpha = 1;
      for (const n of game.numbers) call('drawNumber', ctx, n, view);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      if (st.drawWorldOverlay) st.drawWorldOverlay(ctx, view, game);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      if (st.drawScreenOverlay) st.drawScreenOverlay(ctx, view, game);

      if (this.pixel) {
        const d = this.dctx;
        d.setTransform(1, 0, 0, 1, 0, 0);
        d.imageSmoothingEnabled = false;
        d.globalAlpha = 1;
        d.globalCompositeOperation = 'source-over';
        d.drawImage(this.buffer.c, 0, 0, this.tW * this.up, this.tH * this.up);
      }
      if (st.drawDisplayOverlay) {
        this.dctx.setTransform(1, 0, 0, 1, 0, 0);
        st.drawDisplayOverlay(this.dctx, view, game);
        this.dctx.globalAlpha = 1;
        this.dctx.globalCompositeOperation = 'source-over';
      }
      this.frameMs = U.lerp(this.frameMs, performance.now() - t0, 0.1);
    }
  }

  window.Renderer = Renderer;
  window.RenderDefaults = Default;
})();
