/* Skins tab: pick the playable character. The skins are exactly the Jack characters of the 20 styles.
   Public API: registers the 'skins' hub tab. Equip = Meta.data.skin (app.js copies it to game.skin at run start). */
(function () {
  'use strict';

  const CSS = `
#hub .sk-hero { display: grid; grid-template-columns: auto 1fr; gap: 18px; align-items: center; background: rgba(255,255,255,.04); border: 1px solid #3a2c40; border-radius: 14px; padding: 12px 18px; margin-bottom: 8px; }
#hub .sk-hero canvas { width: 168px; height: 168px; border-radius: 12px; border: 1px solid #3a2c40; display: block; }
#hub .sk-hero .sk-h-title { font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: #ff8a2a; font-weight: 800; }
#hub .sk-hero .sk-h-name { font-size: 26px; font-weight: 900; margin: 4px 0 6px; }
#hub .sk-hero .sk-h-hint { font-size: 13px; color: var(--g-dim, #b9a9c4); max-width: 420px; }
#hub .sk-world { margin: 18px 0 8px; display: flex; align-items: baseline; gap: 10px; }
#hub .sk-world b { font-size: 15px; font-weight: 900; letter-spacing: .02em; }
#hub .sk-world span { font-size: 12px; color: var(--g-dim, #b9a9c4); }
#hub .sk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; }
#hub .sk-card { display: flex; flex-direction: column; align-items: center; gap: 8px; background: rgba(255,255,255,.04); border: 1px solid #3a2c40; border-radius: 14px; padding: 12px 12px 14px; position: relative; transition: border-color .15s, background .15s; }
#hub .sk-card:not(.locked):hover { border-color: #6a4a58; background: rgba(255,255,255,.06); }
#hub .sk-card.equipped { border-color: #ff8a2a; box-shadow: 0 0 0 1px #ff8a2a inset, 0 0 18px rgba(255,138,42,.18); }
#hub .sk-card canvas { width: 144px; height: 144px; border-radius: 10px; display: block; background: #20182a; }
#hub .sk-card.locked canvas { filter: grayscale(1) brightness(.8); }
#hub .sk-card .sk-name { font-weight: 800; font-size: 15px; text-align: center; }
#hub .sk-card.locked .sk-name { color: var(--g-dim, #b9a9c4); }
#hub .sk-card .sk-lock { font-size: 12px; color: var(--g-dim, #b9a9c4); text-align: center; min-height: 28px; display: flex; align-items: center; gap: 5px; justify-content: center; }
#hub .sk-card .sk-badge { font-size: 12px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; color: #1a0f08; background: #ff8a2a; border-radius: 999px; padding: 6px 14px; }
#hub .sk-card .btn { min-width: 110px; }
#hub .sk-card .sk-ico { position: absolute; top: 18px; right: 18px; width: 26px; height: 26px; border-radius: 50%; background: rgba(0,0,0,.6); display: none; align-items: center; justify-content: center; font-size: 14px; }
#hub .sk-card.locked .sk-ico { display: flex; }
`;

  function injectCss() {
    if (document.getElementById('skins-css')) return;
    const s = document.createElement('style');
    s.id = 'skins-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  const PX = 42; // preview canvas covers 42 world units

  /** One live Jack preview. Draws with the style's own drawPlayer, pixel styles via a small upscaled buffer. */
  function makePreview(style, cssSize, H, opts) {
    opts = opts || {};
    const c = document.createElement('canvas');
    c.width = c.height = cssSize;
    const ctx = c.getContext('2d');
    const S = cssSize / PX; // px per world unit
    const pix = !!style.pixelArt;
    const ps = pix ? style.pixelArt.scale || 1 : 0;
    let k = 1, bw = 0, buf = null, bctx = null, ox = 0, oy = 0;
    if (pix) {
      k = Math.max(1, Math.round(S * ps)); // screen px per art px (integer -> crisp)
      bw = Math.floor(cssSize / k);
      buf = document.createElement('canvas');
      buf.width = buf.height = bw;
      bctx = buf.getContext('2d');
      ox = Math.floor((cssSize - bw * k) / 2);
      oy = Math.floor((cssSize - bw * k) / 2);
    }
    const p = { kind: 'player', x: 0, y: 0, vx: 0, vy: 0, facing: 1, moving: true, anim: 0, dir: 0, aim: 0, shootT: 0, iframes: 0, hurtT: 0, dashT: 0, dashX: 1, dashY: 0, levelT: 0, hp: 100, maxHp: 100, r: 9 };
    const prev = { c, style, failed: false, ready: false, phase: Math.random() * 6 };

    prev.draw = function (t) {
      if (this.failed) return;
      if (!style._inited) return;
      try {
        // turn around every few seconds, walk in place
        const cyc = (t * 0.5 + this.phase) % 6; // 0..6
        p.facing = cyc < 3 ? 1 : -1;
        const turning = cyc > 2.85 && cyc < 3.0 || cyc > 5.85;
        p.moving = !turning && !opts.still;
        p.anim = t * 7 + this.phase;
        p.vx = p.moving ? 70 * p.facing : 0;
        p.dir = p.facing > 0 ? 0 : Math.PI;
        p.aim = p.dir;
        const g = pix ? bctx : ctx;
        const W2 = pix ? bw : cssSize;
        const fx = pix ? Math.round(bw / 2) : cssSize / 2;
        const fy = pix ? Math.round(bw * 0.86) : Math.round(cssSize * 0.86);
        const sc = pix ? 1 / ps : S;
        // camera such that the feet sit at (fx, fy); some styles read view.x/y/W/H in their per-frame hook (drawGroundOverlay)
        const cx = (W2 / 2 - fx) / sc, cy = (W2 / 2 - fy) / sc;
        const view = { W: W2, H: W2, S: sc, x: cx, y: cy, x0: cx - W2 / 2 / sc, x1: cx + W2 / 2 / sc, y0: cy - W2 / 2 / sc, y1: cy + W2 / 2 / sc, t, rt: t, pixel: pix, ps, displayW: cssSize, displayH: cssSize, up: k, game: H.game || {} };
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
        g.imageSmoothingEnabled = !pix;
        g.setTransform(sc, 0, 0, sc, fx, fy);
        if (style.drawGroundOverlay) { try { style.drawGroundOverlay(g, view, H.game || {}); } catch (e) { /* ignore */ } }
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
        g.fillStyle = style.groundColor || '#223311';
        g.fillRect(0, 0, W2, W2);
        g.setTransform(sc, 0, 0, sc, fx, fy);
        if (style.drawShadow) style.drawShadow(g, p, view);
        style.drawPlayer(g, p, view);
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
        if (pix) {
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.imageSmoothingEnabled = false;
          ctx.fillStyle = style.groundColor || '#223311';
          ctx.fillRect(0, 0, cssSize, cssSize);
          ctx.drawImage(buf, 0, 0, bw, bw, ox, oy, bw * k, bw * k);
        }
        // soft vignette so every ground colour looks like a stage
        const v = ctx.createRadialGradient(cssSize / 2, cssSize * 0.55, cssSize * 0.25, cssSize / 2, cssSize * 0.55, cssSize * 0.75);
        v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.38)');
        ctx.imageSmoothingEnabled = true;
        ctx.fillStyle = v; ctx.fillRect(0, 0, cssSize, cssSize);
        this.ready = true;
      } catch (e) {
        this.failed = true;
        this.fallback(e);
      }
    };

    prev.fallback = function () {
      try {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = '#20182a'; ctx.fillRect(0, 0, cssSize, cssSize);
        const ic = H.iconCanvas('hp-heart', 64);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(ic, cssSize / 2 - 32, cssSize / 2 - 32, 64, 64);
      } catch (e) { /* ignore */ }
    };
    return prev;
  }

  function render(body, H) {
    injectCss();
    const Meta = H.Meta;
    const data = Meta.data;
    const unlocked = (id) => id === 'harvest16' || !!(data.skins && data.skins[id]);
    const equippedId = () => data.skin || 'harvest16';
    const styles = window.Styles.byId;
    const previews = [];
    const pending = [];

    const wrap = H.el('div', 'sk-wrap');
    body.appendChild(wrap);

    // hero
    const cur = styles[equippedId()] ? equippedId() : 'harvest16';
    const hero = H.el('div', 'sk-hero');
    const hp = makePreview(styles[cur], 168, H);
    hero.appendChild(hp.c);
    previews.push(hp);
    const ht = H.el('div', 'sk-h-text');
    ht.appendChild(H.el('div', 'sk-h-title', 'Your Jack'));
    ht.appendChild(H.el('div', 'sk-h-name', H.styleName(cur)));
    ht.appendChild(H.el('div', 'sk-h-hint', 'Skins only change how Jack looks – your stats stay the same.'));
    hero.appendChild(ht);
    wrap.appendChild(hero);

    // cards by world
    const seen = {};
    H.worlds().forEach((w) => {
      const ids = w.styles.filter((id) => styles[id]);
      if (!ids.length) return;
      const head = H.el('div', 'sk-world');
      head.appendChild(H.el('b', '', w.name));
      head.appendChild(H.el('span', '', w.tag || ''));
      wrap.appendChild(head);
      const grid = H.el('div', 'sk-grid');
      for (const id of ids) {
        seen[id] = true;
        const st = styles[id];
        const open = unlocked(id), eq = equippedId() === id;
        const card = H.el('div', 'sk-card' + (open ? '' : ' locked') + (eq ? ' equipped' : ''));
        const pv = makePreview(st, 144, H);
        previews.push(pv);
        card.appendChild(pv.c);
        card.appendChild(H.el('div', 'sk-ico', '🔒'));
        card.appendChild(H.el('div', 'sk-name', H.styleName(id)));
        if (!open) {
          card.appendChild(H.el('div', 'sk-lock', 'Clear ' + w.name + ' to unlock'));
        } else if (eq) {
          card.appendChild(H.el('div', 'sk-badge', 'Equipped'));
        } else {
          const b = H.el('button', 'btn small primary', 'Equip');
          b.onclick = () => {
            data.skin = id;
            Meta.save();
            H.sfx('click');
            H.refresh();
          };
          card.appendChild(b);
        }
        grid.appendChild(card);
      }
      wrap.appendChild(grid);
    });

    // animation loop: only while the tab body is in the DOM; initialise one style per frame (init can take ~0.5 s)
    for (const pv of previews) if (!pv.style._inited) pending.push(pv.style);
    let last = 0;
    function loop(now) {
      if (!hp.c.isConnected) return;
      if (now - last >= 33) {
        last = now;
        const t = now / 1000;
        const st = pending.find((s) => !s._inited);
        if (st) {
          st._inited = true;
          try { st.init && st.init(); } catch (e) { window.__reportError && window.__reportError(e); }
        }
        for (const pv of previews) {
          if (!pv.style._inited || pv.failed) continue;
          pv.draw(t);
        }
        for (const pv of previews) if (pv.failed && !pv.shown) { pv.shown = true; pv.fallback(); }
      }
      requestAnimationFrame(loop);
    }
    // placeholder fill so cards do not flash empty while styles initialise
    for (const pv of previews) {
      const g = pv.c.getContext('2d');
      g.fillStyle = pv.style.groundColor || '#20182a';
      g.fillRect(0, 0, pv.c.width, pv.c.height);
    }
    requestAnimationFrame(loop);
  }

  // app.js (which defines window.App) is loaded after this file -> register once the document is parsed
  const reg = () => { if (window.App && !window.App.tabs.some((t) => t.id === 'skins')) window.App.registerTab('skins', 'Skins', 20, render); };
  if (window.App) reg(); else document.addEventListener('DOMContentLoaded', reg);
})();
