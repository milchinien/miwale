/* New passive upgrades: Pumpkin Soup, Thorn Shell, Pumpkin Roll, Long Throw (weapons are core-only: js/core/weapons.js).
   Same item format as js/core/game.js: text(m) / apply(g, m) with m = rarity × mastery multiplier.
   All player-facing text is English. All logic hooks in from the outside. */
(function () {
  'use strict';
  const U = window.U, GD = window.GameData, C = window.Content;
  const P = window.Game.prototype;
  const TAU = U.TAU;
  const fmt = (v, d = 0) => String(Math.round(v * 10 ** d) / 10 ** d);

  const NEW_ITEMS = [
    { id: 'leech', icon: 'leech', name: 'Pumpkin Soup', max: 4, text: (m) => '+' + fmt(7 * m) + '% chance that a kill heals 3 HP', apply: (g, m) => (g.stats.leech += 0.07 * m) },
    { id: 'thorns', icon: 'thorns', name: 'Thorn Shell', max: 3, text: (m) => 'Getting hit releases a thorn wave (+' + fmt(100 * m) + '% damage)', apply: (g, m) => (g.stats.thorns += m) },
    { id: 'dashup', icon: 'dashup', name: 'Pumpkin Roll', max: 3, text: (m) => 'Dash ' + fmt(15 * m) + '% more often, with a shockwave', apply: (g, m) => { g.stats.dashCd = Math.max(0.45, g.stats.dashCd * (1 - 0.15 * m)); g.stats.dashWave += m; } },
    { id: 'range', icon: 'range', name: 'Long Throw', max: 4, text: (m) => 'All weapons reach ' + fmt(12 * m) + '% farther, shots fly faster', apply: (g, m) => { g.stats.projSpeed *= 1 + 0.12 * m; g.stats.range *= 1 + 0.12 * m; } },
  ];
  for (const it of NEW_ITEMS) {
    it.desc = it.text(1);
    if (GD.ITEM_BY_ID[it.id]) continue;
    GD.ITEMS.push(it);
    GD.ITEM_BY_ID[it.id] = it;
    C.iconIds.add(it.icon);
  }
  C.items = NEW_ITEMS;

  /* ---------- state ---------- */
  const oReset = P.reset;
  P.reset = function () {
    oReset.call(this);
    Object.assign(this.stats, { leech: 0, thorns: 0, dashWave: 0 });
    this._dashing = false;
  };

  /* ---------- Pumpkin Roll: shockwave where the dash starts ---------- */
  C.post.push((g) => {
    const S = g.stats, p = g.player;
    const dashing = p.dashT > 0;
    if (dashing && !g._dashing && S.dashWave > 0) {
      const W = S.dashWave;
      g.addFx({ kind: 'nova', x: p.x, y: p.y - 4, r0: 6, r1: 42 + 9 * W, life: 0.3, id: g.nextId++, dmg: S.dmg * (0.8 + 0.5 * W), hit: new Set() });
      g.cfx.push({ kind: 'roll', x: p.x, y: p.y, t: 0, life: 0.35, r: 42 + 9 * W });
    }
    g._dashing = dashing;
  });

  /* ---------- Pumpkin Soup: kills can heal ---------- */
  C.onEnemyDie.push((g, e) => {
    const S = g.stats;
    if (S.leech > 0 && g.phase !== 'portal' && !e.boss && g.rng.next() < S.leech) {
      const p = g.player;
      if (p.hp < p.maxHp) {
        p.hp = Math.min(p.maxHp, p.hp + 3);
        g.burst(p.x, p.y, 4, { colors: ['#7dff8a', '#d6ffd0'], speed: 20, life: 0.6, size: 1.8, z: 18, vz: 30 });
      }
    }
  });

  /* ---------- Thorn Shell: getting hit stabs back ---------- */
  const oHurt = P.hurtPlayer;
  P.hurtPlayer = function (dmg, src) {
    const p = this.player, before = p.hp;
    oHurt.call(this, dmg, src);
    const S = this.stats;
    if (p.hp < before && S.thorns > 0 && this.state === 'play') {
      const R = 56 + 10 * S.thorns, d0 = S.dmg * (1 + S.thorns);
      this.query(p.x, p.y, R + 20, (e) => {
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d < R + e.r) this.damageEnemy(e, d0, ((e.x - p.x) / (d || 1)) * 1.6, ((e.y - p.y) / (d || 1)) * 1.6, 'thorns');
      });
      this.cfx.push({ kind: 'thorns', x: p.x, y: p.y, t: 0, life: 0.38, r: R, seed: Math.random() });
    }
  };

  /* ---------- drawing ---------- */
  C.pass('top', (ctx, g) => {
    for (const f of g.cfx) {
      const k = Math.min(1, f.t / f.life);
      if (f.kind === 'thorns') drawThorns(ctx, f, k);
      else if (f.kind === 'roll') {
        ctx.globalAlpha = (1 - k) * 0.8;
        ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = 2;
        const R = f.r * U.ease.outQuad(k);
        ctx.beginPath(); ctx.ellipse(f.x, f.y, R, R * 0.8, 0, 0, TAU); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  });

  function drawThorns(ctx, f, k) {
    const R = f.r * (0.3 + 0.7 * U.ease.outQuad(k));
    const fade = 1 - k * k;
    const n = 16, cy = f.y - 4;
    ctx.lineJoin = 'round';
    // a ring of bone-white thorns bursting outwards
    for (let pass = 0; pass < 2; pass++) {
      ctx.globalAlpha = fade;
      ctx.fillStyle = pass ? '#f3ead2' : '#2a1810';
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + f.seed * 3;
        const c = Math.cos(a), s = Math.sin(a) * 0.8;
        const len = 10 + (i % 2) * 4, wd = pass ? 2.3 : 3.4;
        const bx = f.x + c * R, by = cy + s * R;
        const tx = f.x + c * (R + len + (pass ? 0 : 1.2)), ty = cy + s * (R + len + (pass ? 0 : 1.2));
        ctx.beginPath(); ctx.moveTo(bx - s * wd, by + c * wd * 0.8); ctx.lineTo(tx, ty); ctx.lineTo(bx + s * wd, by - c * wd * 0.8); ctx.closePath(); ctx.fill();
      }
    }
    // thorny vine ring
    ctx.globalAlpha = fade;
    ctx.strokeStyle = '#2a1810'; ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.ellipse(f.x, cy, R, R * 0.8, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#8fbf3a'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.ellipse(f.x, cy, R, R * 0.8, 0, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 0.12 * (1 - k); ctx.fillStyle = '#ffe9c0';
    ctx.beginPath(); ctx.ellipse(f.x, cy, R, R * 0.8, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  }
})();
