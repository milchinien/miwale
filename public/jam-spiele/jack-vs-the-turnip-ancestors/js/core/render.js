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
      const q = (window.Meta && window.Meta.settings && window.Meta.settings.quality) || 'high';
      const dpr = Math.min(window.devicePixelRatio || 1, 2) * (q === 'low' ? 0.6 : q === 'medium' ? 0.8 : 1);
      const cssW = window.__forceW || window.innerWidth, cssH = window.__forceH || window.innerHeight;
      const W = Math.max(2, Math.round(cssW * dpr));
      const H = Math.max(2, Math.round(cssH * dpr));
      const key = W + 'x' + H + ':' + st.id + ':' + q;
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
      const shk = game.shake * ((window.Meta && window.Meta.settings && window.Meta.settings.shakeAmount !== undefined) ? window.Meta.settings.shakeAmount : 1);
      if (shk > 0) {
        cx += (Math.random() - 0.5) * shk;
        cy += (Math.random() - 0.5) * shk;
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

    /** Pre-build ground chunks around the player without drawing (used before a cross-fade into this renderer). */
    warm(game, budget = 4) {
      this.resize(game);
      this.snapCamera(game);
      const view = this.makeView(game);
      this.chunks.ensure(view, false, budget);
      const r = this.chunks.size;
      let missing = 0;
      for (let cy = Math.floor(view.y0 / r); cy <= Math.floor(view.y1 / r); cy++) for (let cx = Math.floor(view.x0 / r); cx <= Math.floor(view.x1 / r); cx++) if (!this.chunks.get(cx, cy)) missing++;
      return missing;
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

      if (window.Fx) window.Fx.drawAmbient(ctx, game, view, st.accent || '#ffb347');
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

      // big entities (boss) are drawn with the style's own sprite, scaled around their feet
      const scaled = (o, s, fn) => {
        if (!s || s === 1) return fn();
        ctx.save();
        ctx.translate(o.x, o.y); ctx.scale(s, s); ctx.translate(-o.x, -o.y);
        fn();
        ctx.restore();
      };
      const accent = st.accent || '#ffb347';
      // playable character skin = another style's Jack, drawn inside this world
      const skin = game.skin && game.skin !== st.id && window.Styles.byId[game.skin];
      // The skin's Jack is rendered by the skin style into small offscreen buffers at the SKIN's own resolution (art pixels for
      // pixel styles, view.S px/unit for HD styles), then blitted into this world: this makes pixel-art skins in HD worlds (and vice versa)
      // crisp and correctly sized, and gives the skin style its per-frame setup (drawGroundOverlay) that styles like nes8bit/vangogh rely on.
      let skinB = null;
      const renderSkin = () => {
        if (!skin._inited) { skin._inited = true; skin.init && skin.init(); }
        const sk = this._sk || (this._sk = { j: U.canvas(8, 8).c, s: U.canvas(8, 8).c });
        const pix = !!skin.pixelArt, ps = pix ? (skin.pixelArt.scale || 1) : 0;
        const Sb = pix ? 1 / ps : S;
        const big = p.levelT > 0 || p.dashT > 0;
        const hl = big ? 72 : 36, up = big ? 76 : 58, dn = big ? 34 : 12;
        const ix = Math.floor((p.x - hl) * Sb), iy = Math.floor((p.y - up) * Sb);
        const x0 = ix / Sb, y0 = iy / Sb;
        const bw = Math.ceil(2 * hl * Sb) + 1, bh = Math.ceil((up + dn) * Sb) + 1;
        const wU = bw / Sb, hU = bh / Sb;
        const v2 = Object.assign({}, view, { W: bw, H: bh, S: Sb, x: x0 + wU / 2, y: y0 + hU / 2, x0, y0, x1: x0 + wU, y1: y0 + hU, pixel: pix, ps, up: 1, displayW: bw, displayH: bh });
        const prep = (cv) => {
          if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
          const g = cv.getContext('2d');
          g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
          g.clearRect(0, 0, bw, bh);
          g.imageSmoothingEnabled = !pix;
          if (!pix) g.imageSmoothingQuality = 'high';
          g.setTransform(Sb, 0, 0, Sb, -ix, -iy);
          return g;
        };
        const gj = prep(sk.j), gs = prep(sk.s);
        if (skin.drawGroundOverlay) {
          try { skin.drawGroundOverlay(gj, v2, game); } catch (e) { /* ignore */ }
          gj.setTransform(1, 0, 0, 1, 0, 0); gj.globalAlpha = 1; gj.globalCompositeOperation = 'source-over'; gj.clearRect(0, 0, bw, bh);
          gj.setTransform(Sb, 0, 0, Sb, -ix, -iy);
        }
        if (skin.drawShadow) { try { skin.drawShadow(gs, p, v2); } catch (e) { /* ignore */ } }
        gs.globalAlpha = 1; gs.globalCompositeOperation = 'source-over';
        gj.imageSmoothingEnabled = !pix;
        (skin.drawPlayer || Default.drawPlayer).call(skin, gj, p, v2);
        gj.globalAlpha = 1; gj.globalCompositeOperation = 'source-over';
        return { x0, y0, wU, hU };
      };
      const blitSkin = (c2, cv) => {
        const m = c2.getTransform();
        const dx = (Math.round(skinB.x0 * m.a + m.e) - m.e) / m.a, dy = (Math.round(skinB.y0 * m.d + m.f) - m.f) / m.d;
        const sm = c2.imageSmoothingEnabled;
        c2.imageSmoothingEnabled = false;
        c2.drawImage(cv, dx, dy, skinB.wU, skinB.hU);
        c2.imageSmoothingEnabled = sm;
      };
      if (skin) {
        try { skinB = renderSkin(); } catch (e) { game.skin = null; skinB = null; window.__reportError && window.__reportError(e); }
      }
      const drawJack = (c2, o, v) => {
        if (!skin || !skinB) return call('drawPlayer', c2, o, v);
        blitSkin(c2, this._sk.j);
      };
      CoreFx.ground(ctx, game, view, accent);

      if (st.drawShadow) for (const o of list) if (o.kind !== 'player' || !skin) scaled(o, o.scale, () => st.drawShadow(ctx, o, view));
      if (skin && skinB) blitSkin(ctx, this._sk.s);

      list.sort((a, b) => (a.sortY !== undefined ? a.sortY : a.y) - (b.sortY !== undefined ? b.sortY : b.y));
      for (const o of list) {
        ctx.globalAlpha = 1;
        if (o.kind === 'prop') call('drawProp', ctx, o, view);
        else if (o.kind === 'enemy') scaled(o, o.scale, () => call('drawEnemy', ctx, o, view));
        else drawJack(ctx, o, view);
      }
      ctx.globalAlpha = 1;
      for (const o of game.orbitals) call('drawOrbital', ctx, o, view);
      for (const pr of game.projectiles) if (!pr.weapon && inView(pr)) call('drawProjectile', ctx, pr, view);
      if (window.Weapons) window.Weapons.drawOver(ctx, game, view, accent);
      for (const pt of game.particles) if (!pt.core && (!pt.sid || pt.sid === st.id) && inView(pt)) call('drawParticle', ctx, pt, view);
      if (window.Fx) window.Fx.drawParticles(ctx, game, view, accent);
      ctx.globalAlpha = 1;
      CoreFx.top(ctx, game, view, accent);
      ctx.globalAlpha = 1;
      for (const n of game.numbers) call('drawNumber', ctx, n, view);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      if (st.drawWorldOverlay) st.drawWorldOverlay(ctx, view, game);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      if (st.drawScreenOverlay) st.drawScreenOverlay(ctx, view, game);
      if (window.Fx) { ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; window.Fx.drawScreen(ctx, view, game); }

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

  /* Gameplay effects every style shares (drawn on top of the style's art, tinted with style.accent). */
  const CoreFx = {
    ground(ctx, game, view, accent) {
      const t = view.rt;
      if (window.Bosses) window.Bosses.draw(ctx, game, view, accent, 'ground');
      if (window.Loot) window.Loot.draw(ctx, game, view, accent, 'ground');
      if (window.Weapons) window.Weapons.drawUnder(ctx, game, view, accent);
      ctx.globalAlpha = 1;
      for (const f of game.fx) {
        const k = U.clamp(f.t / f.life, 0, 1);
        if (f.kind === 'slam') {
          // telegraph: red circle filling up, then the hit
          ctx.globalAlpha = 0.18 + 0.12 * Math.sin(t * 20);
          ctx.fillStyle = '#ff3b2f';
          ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r, f.r * 0.8, 0, 0, U.TAU); ctx.fill();
          ctx.globalAlpha = 0.45;
          ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * k, f.r * 0.8 * k, 0, 0, U.TAU); ctx.fill();
          ctx.globalAlpha = 0.9;
          ctx.strokeStyle = '#ff3b2f'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r, f.r * 0.8, 0, 0, U.TAU); ctx.stroke();
        } else if (f.kind === 'line') {
          ctx.globalAlpha = 0.25 + 0.35 * k;
          ctx.strokeStyle = '#ff3b2f'; ctx.lineWidth = 10; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x + (f.tx - f.x) * 1.6, f.y + (f.ty - f.y) * 1.6); ctx.stroke();
          ctx.lineCap = 'butt';
        }
      }
      ctx.globalAlpha = 1;
      // boss aura
      for (const e of game.enemies) {
        if (!e.boss || e.dying) continue;
        const pulse = 0.5 + 0.5 * Math.sin(t * 4);
        ctx.globalAlpha = 0.25 + 0.15 * pulse;
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.ellipse(e.x, e.y, e.r * 1.6, e.r * 0.7, 0, 0, U.TAU); ctx.fill();
        ctx.globalAlpha = 0.5 * pulse;
        ctx.strokeStyle = '#ff3b2f'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(e.x, e.y, e.r * 1.9 + pulse * 4, e.r * 0.85 + pulse * 2, 0, 0, U.TAU); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // portal hole on the ground (glow is drawn in top())
      const po = game.portal;
      if (po) {
        // portal: a dark swirling hole in the ground with a glowing rim
        const o = U.ease.outBack(Math.min(1, po.open));
        const R = 34 * o;
        if (R > 1) {
          const g = ctx.createRadialGradient(po.x, po.y, 0, po.x, po.y, R * 1.25);
          g.addColorStop(0, '#000'); g.addColorStop(0.55, '#140828'); g.addColorStop(0.85, '#3b1a6e'); g.addColorStop(1, 'rgba(60,20,110,0)');
          ctx.globalAlpha = 0.95;
          ctx.fillStyle = g;
          ctx.save(); ctx.translate(po.x, po.y); ctx.scale(1, 0.6);
          ctx.beginPath(); ctx.arc(0, 0, R * 1.25, 0, U.TAU); ctx.fill();
          // spiral arms
          ctx.globalAlpha = 0.7; ctx.lineWidth = 2.2;
          for (let i = 0; i < 6; i++) {
            const a0 = view.rt * -3 + (i / 6) * U.TAU;
            ctx.strokeStyle = i % 2 ? accent : '#b48cff';
            ctx.beginPath();
            for (let k = 0; k <= 12; k++) {
              const rr = R * (1 - k / 13), aa = a0 + k * 0.32;
              if (k === 0) ctx.moveTo(Math.cos(aa) * rr, Math.sin(aa) * rr); else ctx.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr);
            }
            ctx.stroke();
          }
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      }
    },
    top(ctx, game, view, accent) {
      const t = view.rt;
      if (window.Loot) window.Loot.draw(ctx, game, view, accent, 'top');
      if (window.Bosses) window.Bosses.draw(ctx, game, view, accent, 'top');
      ctx.globalAlpha = 1;
      ctx.save();
      for (const f of game.fx) {
        const k = U.clamp(f.t / f.life, 0, 1);
        if (f.kind === 'nova' || f.kind === 'ring' || f.kind === 'blast') {
          const R = f.r0 + (f.r1 - f.r0) * U.ease.outQuad(k);
          const col = f.color === 'boss' ? '#ff3b2f' : f.color === 'gold' ? '#ffe08a' : accent;
          ctx.globalAlpha = (1 - k) * (f.kind === 'blast' ? 0.5 : 0.35);
          if (f.kind !== 'ring') {
            ctx.fillStyle = col;
            ctx.beginPath(); ctx.ellipse(f.x, f.y, R, R * 0.8, 0, 0, U.TAU); ctx.fill();
          }
          ctx.globalAlpha = (1 - k) * 0.95;
          ctx.strokeStyle = col; ctx.lineWidth = f.kind === 'ring' ? 2 : 3;
          ctx.beginPath(); ctx.ellipse(f.x, f.y, R, R * 0.8, 0, 0, U.TAU); ctx.stroke();
          if (f.kind === 'nova') {
            ctx.globalAlpha = (1 - k) * 0.6; ctx.lineWidth = 1.2; ctx.strokeStyle = '#fff';
            ctx.beginPath(); ctx.ellipse(f.x, f.y, R * 0.92, R * 0.74, 0, 0, U.TAU); ctx.stroke();
          }
        }
      }
      const po = game.portal;
      if (po) {
        const o = U.ease.outBack(Math.min(1, po.open));
        const R = 34 * o;
        ctx.globalCompositeOperation = 'lighter';
        // sparkles rising out of the portal
        for (let i = 0; i < 14; i++) {
          const ph = (view.rt * 0.6 + i / 14) % 1;
          const a = i * 2.4 + view.rt;
          const sx = po.x + Math.cos(a) * R * (0.3 + 0.7 * ((i * 37) % 10) / 10);
          const sy = po.y + Math.sin(a) * R * 0.5 - ph * 70;
          ctx.globalAlpha = (1 - ph) * 0.9 * Math.min(1, o);
          ctx.fillStyle = i % 2 ? accent : '#e8dcff';
          ctx.fillRect(sx - 1.2, sy - 1.2, 2.4, 2.4);
        }
        for (let i = 0; i < 5; i++) {
          const a = t * (2 + i * 0.6) + i * 1.3;
          ctx.globalAlpha = 0.55 - i * 0.07;
          ctx.strokeStyle = i % 2 ? accent : '#c9a8ff';
          ctx.lineWidth = 3 - i * 0.35;
          ctx.beginPath(); ctx.ellipse(po.x, po.y - 2, Math.max(0.1, R * (1 - i * 0.16)), Math.max(0.1, R * 0.6 * (1 - i * 0.16)), 0, a, a + 4.2); ctx.stroke();
        }
        if (R > 1) {
          const g = ctx.createRadialGradient(po.x, po.y - 10, 0, po.x, po.y - 10, R * 2.2);
          g.addColorStop(0, 'rgba(255,240,200,0.55)'); g.addColorStop(0.4, 'rgba(180,140,255,0.22)'); g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.globalAlpha = 0.8 + 0.2 * Math.sin(t * 5);
          ctx.fillStyle = g;
          ctx.fillRect(po.x - R * 2.2, po.y - 10 - R * 2.2, R * 4.4, R * 4.4);
          ctx.globalAlpha = 0.25 * Math.min(1, o);
          ctx.fillStyle = 'rgba(255,230,180,1)';
          ctx.fillRect(po.x - R * 0.35, po.y - 120, R * 0.7, 120);
        }
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.restore();
    },
    rocketGlow(ctx, pr, accent) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.45;
      const g = ctx.createRadialGradient(pr.x, pr.y, 0, pr.x, pr.y, 12);
      g.addColorStop(0, accent); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(pr.x - 12, pr.y - 12, 24, 24);
      ctx.restore();
    },
  };

  window.Renderer = Renderer;
  window.CoreFx = CoreFx;
  window.RenderDefaults = Default;
})();
