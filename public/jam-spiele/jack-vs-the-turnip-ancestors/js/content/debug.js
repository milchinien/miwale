/* Test helpers for the content layer (inert unless a URL parameter is set). Used by tools/content-shot.mjs.
     ?lineup=1             every new enemy type in its key states, frozen around Jack (+ enemy shots)
     ?cards=leech,thorns,… level-up cards forced to these items (with ?levelup=1 on play.html)
     ?stress=1             75 % of regular spawns become new enemy types (crash / perf test in every state)
     ?bench=1              records real render times per frame -> window.__bench(skipMs) (tools/content-bench.mjs)
     ?iconsheet=1          overlay with all new upgrade icons of the current style on a dark and a light strip */
(function () {
  'use strict';
  const params = new URLSearchParams(location.search);
  const C = window.Content, GD = window.GameData, P = window.Game.prototype;

  if (params.has('lineup')) {
    const A = -72, B = 58, Cr = 150;
    const LINEUP = [
      ['sp1', 'spitter', -150, A, (e) => { e.mode = 'move'; e.charge = 0; e.spit = 0; }],
      ['sp2', 'spitter', -100, A, (e) => { e.mode = 'aim'; e.charge = 0.75; }],
      ['bo1', 'bomber', -50, A, (e) => { e.armed = false; e.fuse = 0; }],
      ['bo2', 'bomber', 0, A - 6, (e) => { e.armed = true; e.fuse = 0.55; }],
      ['ch1', 'charger', 50, A, (e) => { e.mode = 'chase'; e.modeT = 0; }],
      ['ch2', 'charger', 100, A, (e) => { e.mode = 'tele'; e.modeT = 0.5; e.dashX = 0.6; e.dashY = 0.8; }],
      ['ch3', 'charger', 150, A, (e) => { e.mode = 'dash'; e.modeT = 0.2; e.dashX = -1; e.dashY = 0; }],
      ['mo1', 'mother', -150, B, (e) => { e.birth = 0; }],
      ['mo2', 'mother', -95, B, (e) => { e.birth = 0.8; }],
      ['so1', 'sprout', -50, B, () => {}],
      ['so2', 'sprout', -32, B + 6, () => {}],
      ['ch4', 'charger', 150, B, (e) => { e.mode = 'rest'; e.modeT = 0.3; }],
      ['cr', 'creeper', -60, Cr, () => {}],
      ['gh', 'ghost', 0, Cr, () => {}],
      ['co', 'colossus', 70, Cr, () => {}],
    ];
    const oSpawning = P.updateSpawning;
    P.updateSpawning = function (dt) { if (!this._lineup) oSpawning.call(this, dt); };
    const oUpdate = P.update;
    P.update = function (dt, input) {
      this._lineup = true;
      this.fireT = 9; this.weapons = {}; this.projectiles = []; // keep the lineup calm (no weapons firing)
      oUpdate.call(this, dt, input);
      const p = this.player;
      p.x = 0; p.y = 0; p.vx = p.vy = 0; p.hp = p.maxHp; p.facing = 1;
      if (!this._lu) this._lu = {};
      for (const [key, type, x, y, setup] of LINEUP) {
        let e = this._lu[key];
        if (!e || this.enemies.indexOf(e) < 0) { e = this.spawnEnemy(type, x, y); this._lu[key] = e; }
        Object.assign(e, { x, y, vx: 0, vy: 0, kx: 0, ky: 0, spawnT: 1, flash: 0, dying: false, deathT: 0, hp: e.maxHp, frozen: true, chillT: 0 });
        e.facing = x > 0 ? -1 : 1;
        e.anim = this.time * 1.4 + e.seed * 4;
        setup(e);
      }
      this.eshots = [
        { kind: 'eshot', x: 40, y: 34, z: 11, vx: -118, vy: 0, r: 4.2, dmg: 1, life: 2, age: 0.5, seed: 0.3, angle: Math.PI },
        { kind: 'eshot', x: 68, y: 22, z: 11, vx: -100, vy: -60, r: 4.2, dmg: 1, life: 2, age: 0.8, seed: 0.7, angle: -2.6 },
      ];
      for (const e of this.enemies) if (!e.frozen) e.dying = true, e.deathT = 1;
      if (params.has('fx')) {
        // frozen upgrade effect for screenshots: thorn wave
        this.cfx = this.cfx.filter((f) => !f._dbg);
        this.cfx.push({ _dbg: 1, kind: 'thorns', x: 0, y: 0, t: 0.14, life: 0.38, r: 66, seed: 0.2 });
      }
    };
  }

  if (params.has('stress')) {
    // stress test: most regular spawns become new types (all states: spawning, aiming, armed, charging, dying …)
    const TYPES = ['spitter', 'bomber', 'charger', 'mother', 'sprout'];
    let k = 0;
    const oSpawn = P.spawnEnemy;
    P.spawnEnemy = function (type, x, y) {
      if (type === 'creeper' && !this._lineup && Math.random() < 0.75) type = TYPES[k++ % TYPES.length];
      return oSpawn.call(this, type, x, y);
    };
  }

  if (params.has('bench')) {
    // real-time frame timing of the renderer (read by tools/content-bench.mjs via window.__bench())
    const RP = window.Renderer.prototype, oRender = RP.render, frames = [];
    RP.render = function (game, dt, force) {
      const t = performance.now();
      const r = oRender.call(this, game, dt, force);
      frames.push([t, performance.now() - t, game.enemies.length]);
      return r;
    };
    window.__bench = (skipMs) => {
      const t0 = frames.length ? frames[0][0] + (skipMs || 0) : 0;
      const ms = frames.filter((f) => f[0] >= t0).map((f) => f[1]).sort((a, b) => a - b);
      const q = (p) => +(ms[Math.min(ms.length - 1, Math.floor(ms.length * p))] || 0).toFixed(2);
      const errBox = document.getElementById('errors');
      return { frames: ms.length, median: q(0.5), p95: q(0.95), p99: q(0.99), max: q(1), over16: ms.filter((v) => v > 16).length,
        enemies: frames.length ? frames[frames.length - 1][2] : 0, errors: errBox ? errBox.textContent.slice(0, 400) : '' };
    };
  }

  if (params.has('cards')) {
    const ids = params.get('cards').split(',').filter((id) => GD.ITEM_BY_ID[id]);
    const R = GD.RARITIES || [{ id: 'common', name: 'Gewöhnlich', mult: 1 }];
    const oOpen = P.openLevelUp;
    P.openLevelUp = function () {
      oOpen.call(this);
      if (!ids.length) return;
      this.choices = ids.slice(0, 3).map((id, i) => {
        const item = GD.ITEM_BY_ID[id];
        const rarity = R[Math.min(R.length - 1, i)];
        const mult = rarity.mult || 1;
        return { item, rarity, id, icon: item.icon || id, name: item.name, weapon: item.weapon, desc: item.text ? item.text(mult) : item.desc, mult };
      });
    };
  }

  if (params.has('iconsheet')) {
    window.addEventListener('load', () => setTimeout(() => {
      const st = window.__game && window.__game.hooks;
      if (!st || !st.drawIcon) return;
      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:9999;font:12px sans-serif;color:#fff';
      const ids = [...GD.ITEMS.filter((it) => !C.iconIds.has(it.icon)).slice(0, 3).map((it) => it.icon || it.id), ...C.items.map((it) => it.icon)];
      for (const bg of ['#16121c', '#cfc6b4']) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:10px;padding:10px 14px;background:' + bg;
        for (const id of ids) {
          const cell = document.createElement('div');
          cell.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;color:' + (bg === '#16121c' ? '#eee' : '#222');
          const cv = document.createElement('canvas'); cv.width = cv.height = 96;
          const ctx = cv.getContext('2d');
          try { ctx.save(); st.drawIcon(ctx, id, 96); ctx.restore(); } catch (e) { window.__reportError && window.__reportError(e); }
          const sm = document.createElement('canvas'); sm.width = sm.height = 48;
          try { const c2 = sm.getContext('2d'); c2.save(); st.drawIcon(c2, id, 48); c2.restore(); } catch (e) { /* reported above */ }
          const lab = document.createElement('span'); lab.textContent = id;
          cell.append(cv, sm, lab);
          row.appendChild(cell);
        }
        wrap.appendChild(row);
      }
      document.body.appendChild(wrap);
    }, 0));
  }
})();
