/* Content extension layer – new enemy types and new passive upgrades on top of the shared core, WITHOUT editing the
   style files. Everything here hooks in from the outside:
     · Game.prototype methods are wrapped (enemies.js / upgrades.js)
     · every registered style gets thin wrappers around drawEnemy / drawShadow / drawIcon / onHit / onKill
     · CoreFx.ground / CoreFx.top get extra draw passes (enemy shots, telegraphs, upgrade effects)
   Per-style native art lives in js/content/art/<styleId>.js and registers with Content.art(id, {...}) – see ART_API.md.
   Until a style has native art for something, a readable fallback is drawn (base sprite + accessories / vector icons). */
(function () {
  'use strict';
  const U = window.U;

  const Content = {
    enemyTypes: {}, // id -> def (also merged into GameData.ENEMY_TYPES)
    iconIds: new Set(), // upgrade icon ids that are new (styles don't know them)
    fallbackIcons: {}, // icon id -> fn(ctx, size)
    arts: {}, // styleId -> art object
    passes: { ground: [], top: [] }, // fn(ctx, game, view, accent, style)
    reported: new Set(),

    /** Register native art for a style (js/content/art/<id>.js). */
    art(styleId, def) { this.arts[styleId] = def; },
    /** Art object for a style (lazy init on first use). */
    artFor(st) {
      const a = st && this.arts[st.id];
      if (!a) return null;
      if (!a._inited) {
        a._inited = true;
        try { a.init && a.init(st); } catch (e) { this.report('init:' + st.id, e); }
      }
      return a;
    },
    report(key, e) {
      if (this.reported.has(key)) return;
      this.reported.add(key);
      console.error('[content] ' + key, e);
      window.__reportError && window.__reportError(e);
    },
    /** Run fn with the enemy temporarily pretending to be its base type (style code only knows creeper/ghost/colossus). */
    asBase(e, def, fn) {
      const t = e.type;
      e.type = def.base;
      try { return fn(); } finally { e.type = t; }
    },
    /** Run fn while every new-type enemy in the game pretends to be its base type (for style code that walks game.enemies). */
    allAsBase(game, fn) {
      const list = game && game.enemies;
      const saved = [];
      if (list) {
        for (const e of list) {
          const def = this.enemyTypes[e.type];
          if (def) { saved.push(e, e.type); e.type = def.base; }
        }
      }
      try { return fn(); } finally { for (let i = 0; i < saved.length; i += 2) saved[i].type = saved[i + 1]; }
    },
    pass(where, fn) { this.passes[where].push(fn); },
  };

  /* ---------- style wrappers ---------- */
  const scaledAt = (ctx, o, s, fn) => {
    if (!s || s === 1) return fn();
    ctx.save();
    ctx.translate(o.x, o.y); ctx.scale(s, s); ctx.translate(-o.x, -o.y);
    try { fn(); } finally { ctx.restore(); }
  };
  Content.scaledAt = scaledAt;

  function wrapStyle(st) {
    if (st.__content) return;
    st.__content = true;
    const D = window.RenderDefaults || {};
    const oDraw = st.drawEnemy || D.drawEnemy;
    const oShadow = st.drawShadow;
    const oIcon = st.drawIcon;
    const oHit = st.onHit, oKill = st.onKill;

    st.drawEnemy = function (ctx, e, view) {
      const def = Content.enemyTypes[e.type];
      if (!def) return oDraw.call(this, ctx, e, view);
      const art = Content.artFor(this);
      const fn = art && art.enemies && art.enemies[e.type];
      if (fn) {
        try { return fn.call(art, ctx, e, view, this); } catch (err) { Content.report('enemy:' + this.id + ':' + e.type, err); art.enemies[e.type] = null; }
      }
      // fallback: the style's own base sprite (scaled) + a few accessories that show what this enemy does
      const a0 = ctx.globalAlpha;
      Content.asBase(e, def, () => scaledAt(ctx, e, def.drawScale, () => oDraw.call(this, ctx, e, view)));
      ctx.globalAlpha = a0;
      if (def.accessory && !e.dying) {
        ctx.save();
        try { def.accessory(ctx, e, view, this); } catch (err) { Content.report('acc:' + e.type, err); }
        ctx.restore();
      }
    };
    if (oShadow) {
      st.drawShadow = function (ctx, o, view) {
        const def = o.kind === 'enemy' && Content.enemyTypes[o.type];
        if (!def) return oShadow.call(this, ctx, o, view);
        const art = Content.artFor(this);
        if (art && art.shadow) {
          try { if (art.shadow.call(art, ctx, o, view, this) !== false) return; } catch (err) { Content.report('shadow:' + this.id, err); art.shadow = null; }
        }
        Content.asBase(o, def, () => scaledAt(ctx, o, def.shadowScale || def.drawScale, () => oShadow.call(this, ctx, o, view)));
      };
    }
    st.drawIcon = function (ctx, id, size) {
      if (Content.iconIds.has(id)) {
        const art = Content.artFor(this);
        const fn = art && art.icons && art.icons[id];
        if (fn) {
          try { ctx.save(); fn.call(art, ctx, size, this); ctx.restore(); return; } catch (err) { ctx.restore(); Content.report('icon:' + this.id + ':' + id, err); art.icons[id] = null; }
        }
        const fb = Content.fallbackIcons[id];
        if (fb) { ctx.save(); fb(ctx, size, this); ctx.restore(); return; }
      }
      if (oIcon) return oIcon.call(this, ctx, id, size);
    };
    if (oHit) {
      st.onHit = function (game, e, src) {
        const def = Content.enemyTypes[e.type];
        if (!def) return oHit.call(this, game, e, src);
        return Content.asBase(e, def, () => oHit.call(this, game, e, src));
      };
    }
    // overlays that walk game.enemies and look things up by type (spawn holes, stains …): new types pose as their base type
    for (const name of ['drawGroundOverlay', 'drawWorldOverlay', 'drawScreenOverlay', 'drawDisplayOverlay']) {
      const o = st[name];
      if (!o) continue;
      st[name] = function (ctx, view, game) { return Content.allAsBase(game || (view && view.game), () => o.call(this, ctx, view, game)); };
    }
    if (st.onHurt) {
      const oHurt = st.onHurt;
      st.onHurt = function (game, p, src) {
        const def = src && src.kind === 'enemy' && Content.enemyTypes[src.type];
        if (!def) return oHurt.call(this, game, p, src);
        return Content.asBase(src, def, () => oHurt.call(this, game, p, src));
      };
    }
    if (oKill) {
      st.onKill = function (game, e) {
        const def = Content.enemyTypes[e.type];
        if (!def) return oKill.call(this, game, e);
        const art = Content.artFor(this);
        if (art && art.onKill) {
          try { if (art.onKill.call(art, game, e, this) !== false) return; } catch (err) { Content.report('onKill:' + this.id, err); art.onKill = null; }
        }
        return Content.asBase(e, def, () => oKill.call(this, game, e));
      };
    }
  }
  const Styles = window.Styles;
  for (const st of Styles.list) wrapStyle(st);
  const oRegister = Styles.register;
  Styles.register = function (style) {
    oRegister.call(this, style);
    if (this.byId[style.id] === style) wrapStyle(style);
  };

  /* ---------- extra draw passes on top of the core effects ---------- */
  const CF = window.CoreFx;
  const style = () => (window.__game && window.__game.hooks) || null;
  // worlds cross-fade between two renderers with different styles: let every view know whose frame it is
  const R = window.Renderer && window.Renderer.prototype;
  if (R && R.makeView && !R.__contentView) {
    const oMakeView = R.makeView;
    R.makeView = function (game) {
      const v = oMakeView.call(this, game);
      if (v && !v.style) v.style = this.style;
      return v;
    };
    R.__contentView = true;
  }
  const run = (where, ctx, game, view, accent) => {
    const st = view.style || game.hooks;
    if (where === 'ground') {
      // idle hook: art files may pre-build sprites in small slices every frame (no hitch when a type first appears)
      const art = Content.artFor(st);
      if (art && art.idle) { try { art.idle.call(art, view, st); } catch (e) { Content.report('idle:' + st.id, e); art.idle = null; } }
    }
    for (const fn of Content.passes[where]) {
      ctx.save();
      try { fn(ctx, game, view, accent, st); } catch (e) { Content.report('pass:' + where, e); }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };
  const oGround = CF.ground, oTop = CF.top;
  CF.ground = function (ctx, game, view, accent) {
    oGround.call(this, ctx, game, view, accent);
    run('ground', ctx, game, view, accent);
  };
  CF.top = function (ctx, game, view, accent) {
    oTop.call(this, ctx, game, view, accent);
    run('top', ctx, game, view, accent);
  };
  Content.currentStyle = style;

  /* ---------- small drawing helpers shared by the fallbacks ---------- */
  Content.glow = function (ctx, x, y, r, color, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  };
  /** Icon helper: draw in a 48×48 design space. */
  Content.icon48 = function (ctx, size, fn) {
    ctx.save();
    ctx.scale(size / 48, size / 48);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    fn(ctx);
    ctx.restore();
  };

  window.Content = Content;
})();
