/* BOSSES – one big boss per world (7), lots of HP, telegraphed area attacks.
   Public API (stable): Bosses.defFor(i), spawn(game,e), update(game,e,dt,dx,dy,d), tick(game,dt), onDefeat(game,e), draw(ctx,game,view,accent,layer)
   All hazards live in game.hazards (managed completely here). Ground space: the world is a 3/4 view, so every area is an
   ellipse (y squashed by YS = 0.8) – the hit tests use the very same ellipses that are drawn.
   Hazard kinds: circle (slam / rain / pool / vortex), ring (shockwave with gaps), beam (rotating arms / cones),
   bullet (slow big seeds), tell (visual charge-up, harmless). Colours: red/orange = danger, the world accent = decoration only. */
(function () {
  'use strict';
  const U = window.U;
  const TAU = Math.PI * 2;
  const YS = 0.8;
  const RED = '#ff3b2f', ORANGE = '#ff9a2e', HOT = '#ffe2a0';
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const ed = (ax, ay, bx, by) => Math.hypot(ax - bx, (ay - by) / YS); // distance in ground space

  /* ------------------------------------------------------------------ definitions */
  // atk: [attack id, first phase it is used in (0-based), weight]
  const DEFS = [
    {
      name: 'The Scarecrow Ancestor', accent: '#ffb347', scale: 2.1, r: 27, hp: 1700, speed: 30, thresholds: [0.66, 0.33], tempo: 1,
      deco: ['embers', 'orbs'], atk: [['slam', 0, 3], ['carpet', 0, 2], ['summon', 0, 1.0], ['charge', 0, 2], ['ring', 1, 2], ['rain', 2, 2.4]],
    },
    {
      name: 'The Wind-Up Turnip King', accent: '#4fc3f7', scale: 2.2, r: 28, hp: 1800, speed: 32, thresholds: [0.66, 0.33], tempo: 0.95,
      deco: ['orbs', 'embers'], atk: [['charge', 0, 2.4], ['carpet', 0, 2], ['radial', 0, 2.2], ['summon', 0, 1.2], ['ring', 1, 2], ['pool', 2, 2.2], ['slam', 0, 1.6]],
    },
    {
      name: 'Gourdmother Patchwork', accent: '#ee6fb5', scale: 2.3, r: 28, hp: 2600, speed: 31, thresholds: [0.66, 0.33], tempo: 0.92,
      deco: ['orbs'], atk: [['beams', 0, 3], ['rain', 0, 2.4], ['slam', 0, 1.6], ['summon', 0, 1.2], ['spiral', 1, 2.4], ['vortex', 2, 2.4]],
    },
    {
      name: 'The High-Score Gourd', accent: '#39ff88', scale: 2.3, r: 28, hp: 3200, speed: 34, thresholds: [0.66, 0.33], tempo: 0.9,
      deco: ['orbs', 'embers'], atk: [['spiral', 0, 2.6], ['ring', 0, 2.4], ['carpet', 0, 2], ['charge', 0, 2], ['beams', 1, 2.6], ['rain', 2, 2.4]],
    },
    {
      name: 'The Ink-Soaked Press Beast', accent: '#8a7cff', scale: 2.4, r: 29, hp: 4500, speed: 33, thresholds: [0.66, 0.33], tempo: 0.88,
      deco: ['flame', 'orbs'], atk: [['pool', 0, 3], ['slam', 0, 2], ['ring', 0, 2.4], ['beams', 0, 2], ['radial', 1, 2.4], ['vortex', 2, 2.4], ['summon', 1, 1]],
    },
    {
      name: 'The Haunted Masterpiece', accent: '#f2c14e', scale: 2.5, r: 29, hp: 5800, speed: 34, thresholds: [0.66, 0.33], tempo: 0.85,
      deco: ['orbs', 'embers'], atk: [['vortex', 0, 2.6], ['radial', 0, 2.4], ['beams', 0, 2.4], ['pool', 0, 2], ['summon', 0, 1.2], ['carpet', 1, 2.2], ['spiral', 2, 2.6]],
    },
    {
      name: 'The Midnight Rutabaga Sovereign', accent: '#b266ff', scale: 2.6, r: 30, hp: 6800, speed: 35, thresholds: [0.75, 0.5, 0.25], tempo: 0.8,
      deco: ['flame', 'orbs', 'embers'],
      atk: [['slam', 0, 2.4], ['carpet', 0, 2.2], ['ring', 0, 2.4], ['summon', 0, 1.2], ['beams', 1, 2.6], ['radial', 1, 2.4], ['pool', 2, 2.2], ['vortex', 2, 2.4], ['rain', 2, 2.4], ['spiral', 3, 2.8], ['charge', 3, 2.4]],
    },
  ];
  const ATTACK_LABEL = { slam: 'Slam', carpet: 'Carpet', ring: 'Shockwave', beams: 'Beams', rain: 'Seed rain', pool: 'Pools', vortex: 'Vortex', spiral: 'Spiral', radial: 'Burst', charge: 'Charge', summon: 'Summon' };
  for (const d of DEFS) { d.color = d.accent; d.attacks = d.atk.map((a) => a[0]); }

  /* ------------------------------------------------------------------ hazard factories */
  function dmgOf(e, k) { return e.dmg * k; }
  function circle(g, e, x, y, r, warn, o) {
    const h = Object.assign({ k: 'circle', x, y, r, warn, t: 0, state: 0, flash: 0, dmg: dmgOf(e, 1), dur: 0, every: 0.55, tickT: 0, pull: 0, pullR: 0, big: r >= 40 }, o);
    g.hazards.push(h);
    return h;
  }
  function tell(g, e, warn, o) {
    g.hazards.push(Object.assign({ k: 'tell', follow: e, x: e.x, y: e.y, warn, t: 0, r: 60, spokes: 0 }, o));
  }
  function bullet(g, x, y, ang, speed, e, o) {
    g.hazards.push(Object.assign({ k: 'bullet', x, y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, r: 5.5, life: 6, t: 0, dmg: dmgOf(e, 0.5) }, o));
  }
  function script(ai, delay, every, n, fn) { ai.scripts.push({ t: 0, next: delay, every, n, i: 0, fn }); }

  /* ------------------------------------------------------------------ attacks: return seconds the boss stands still */
  const Atk = {
    slam(g, e, ai, ph, T) {
      const p = g.player, R = 66 + T * 3 + ph * 4;
      const lead = 0.35;
      circle(g, e, p.x + p.vx * lead, p.y + p.vy * lead, R, 1.05, { dmg: dmgOf(e, 1.1) });
      if (ph >= 1) { // follow-up slams one after another
        for (let i = 1; i <= ph + 1; i++) {
          const a = Math.random() * TAU;
          circle(g, e, p.x + Math.cos(a) * 80 * i, p.y + Math.sin(a) * 60 * i, R * 0.85, 1.05 + i * 0.5, { dmg: dmgOf(e, 1) });
        }
      }
      g.signal('BossSlam', e);
      return 0.6;
    },
    carpet(g, e, ai, ph, T) {
      const p = g.player, n = 5 + ph * 2 + Math.floor(T), R = 44 + ph * 2;
      circle(g, e, p.x + p.vx * 0.3, p.y + p.vy * 0.3, R, 1.15);
      for (let i = 1; i < n; i++) {
        const a = Math.random() * TAU, d = rnd(30, 150);
        circle(g, e, p.x + Math.cos(a) * d * 1.2, p.y + Math.sin(a) * d * 0.9, R, 0.95 + i * 0.07);
      }
      g.signal('BossSlam', e);
      return 0.5;
    },
    ring(g, e, ai, ph, T) {
      const n = ph >= 2 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const gapN = ph >= 2 ? 2 : 1, a0 = Math.random() * TAU, gaps = [];
        for (let k = 0; k < gapN; k++) gaps.push([a0 + (k * TAU) / gapN, ph >= 2 ? 0.42 : 0.6]);
        g.hazards.push({ k: 'ring', x: e.x, y: e.y, R: 0, warn: 0.95 + i * 0.7, t: 0, b: 7, speed: 125, maxR: 330, gaps, dmg: dmgOf(e, 0.85), fired: false, hitFlash: 0 });
      }
      tell(g, e, 0.95, { r: 70 });
      g.signal('BossSlam', e);
      return 1.0;
    },
    beams(g, e, ai, ph, T) {
      const arms = ph >= 2 ? 4 : ph >= 1 ? 3 : 2;
      const dir = Math.random() < 0.5 ? 1 : -1;
      g.hazards.push({ k: 'beam', follow: e, x: e.x, y: e.y, a: Math.atan2(g.player.y - e.y, g.player.x - e.x) / 1, rot: dir * (0.36 + ph * 0.05), arms, L: 240, w: 17, warn: 1.25, dur: 3.4, t: 0, dmg: dmgOf(e, 0.8) });
      g.signal('BossCharge', e);
      return 4.7;
    },
    rain(g, e, ai, ph, T) {
      const n = 12 + ph * 3, p = g.player;
      script(ai, 0.15, 0.13, n, (i) => {
        const a = Math.random() * TAU, d = i % 3 === 0 ? 0 : rnd(20, 150);
        const q = g.player;
        circle(g, e, q.x + q.vx * 0.4 * (i % 3 === 0 ? 1 : 0) + Math.cos(a) * d * 1.2, q.y + q.vy * 0.4 * (i % 3 === 0 ? 1 : 0) + Math.sin(a) * d * 0.9, 26, 0.95, { dmg: dmgOf(e, 0.55), rain: true });
      });
      return 1.2;
    },
    pool(g, e, ai, ph, T) {
      const p = g.player, n = 2 + (ph >= 2 ? 1 : 0) + (ph >= 3 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU, d = i === 0 ? 0 : rnd(60, 130);
        circle(g, e, p.x + p.vx * 0.3 + Math.cos(a) * d * 1.2, p.y + Math.sin(a) * d * 0.9, 46, 1.0 + i * 0.15, { dur: 5, every: 0.6, dmg: dmgOf(e, 0.4), pool: true });
      }
      g.signal('BossSlam', e);
      return 0.7;
    },
    vortex(g, e, ai, ph, T) {
      const p = g.player;
      circle(g, e, p.x + rnd(-50, 50), p.y + rnd(-40, 40), 88 + ph * 3, 2.1, { pull: 58, pullR: 190, dmg: dmgOf(e, 1.2), vortex: true });
      g.signal('BossCharge', e);
      return 1.0;
    },
    spiral(g, e, ai, ph, T) {
      const arms = 3 + (ph >= 3 ? 1 : 0), dirN = Math.random() < 0.5 ? 1 : -1, a0 = Math.random() * TAU;
      const n = 30;
      tell(g, e, 0.85, { r: 56 });
      script(ai, 0.85, 0.095, n, (i) => {
        for (let k = 0; k < arms; k++) bullet(g, e.x, e.y, a0 + dirN * i * 0.3 + (k * TAU) / arms, 80, e);
      });
      g.signal('BossCharge', e);
      return 0.85 + n * 0.095 + 0.3;
    },
    radial(g, e, ai, ph, T) {
      const n = 3 + (ph >= 2 ? 1 : 0), cnt = 18 + ph * 2, a0 = Math.random() * TAU;
      tell(g, e, 0.85, { r: 56, spokes: cnt });
      script(ai, 0.85, 0.75, n, (i) => {
        const off = a0 + (i % 2) * (TAU / cnt / 2);
        for (let k = 0; k < cnt; k++) bullet(g, e.x, e.y, off + (k * TAU) / cnt, 74 + ph * 3, e, { r: 6 });
        g.shake = Math.max(g.shake, 2);
        g.signal('BossSlam', e);
      });
      return 0.85 + n * 0.75;
    },
    charge(g, e, ai, ph, T) {
      ai.mode = 'aim'; ai.modeT = 0; ai.aimDur = 0.95; ai.dir = 0;
      g.signal('BossCharge', e);
      return 0; // the charge state machine owns the movement
    },
    summon(g, e, ai, ph, T) {
      let alive = 0;
      for (const o of g.enemies) if (!o.dying && !o.boss) alive++;
      const n = alive > 70 ? 0 : 3 + Math.floor(T) + (ph >> 1);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + Math.random() * 0.3;
        const m = g.spawnEnemy(i % 3 === 0 ? 'ghost' : 'creeper', e.x + Math.cos(a) * 50, e.y + Math.sin(a) * 38); if (m) m.bossAdd = true;
      }
      g.addFx({ kind: 'ring', x: e.x, y: e.y, r0: 20, r1: 90, life: 0.5, color: 'boss' });
      g.signal('BossSummon', e);
      return 0.8;
    },
  };

  /* ------------------------------------------------------------------ public API */
  const Bosses = {
    DEFS,
    defFor(i) { return DEFS[clamp(Math.floor(i || 0), 0, DEFS.length - 1)]; },

    spawn(game, e) {
      const def = this.defFor(game.worldIndex);
      const T = game.tier;
      e.def = def;
      e.name = def.name;
      e.scale = def.scale;
      e.r = def.r;
      e.hp = e.maxHp = Math.round(def.hp);
      e.speed = def.speed * (1 + Math.min(0.2, T * 0.04));
      e.baseSpeed = e.speed;
      e.dmg = 19 * (1 + T * 0.16);
      e.baseDmg = e.dmg;
      e.mass = 90;
      e.xp = 40 + game.worldIndex * 10;
      e.rutas = 40 + game.worldIndex * 14;
      e.ai = { cd: 2.6, ph: 0, phaseT: 0, last: '', scripts: [], mode: 'move', modeT: 0, busy: 0, t: 0, sinceHit: 0, flashT: 0, banner: '', bannerT: 0, started: game.worldTime };
      game.hazards.length = 0;
      // the horde flees when the boss rises: the arena is cleared (quietly), the core keeps spawning only a trickle
      for (const o of game.enemies) if (o !== e && !o.dying) { o.dying = true; o.deathT = 1; o.rutas = 0; if (o.xp) game.gems.push({ kind: 'gem', x: o.x, y: o.y, value: o.xp, big: false, seed: Math.random(), t: 0, fly: false, vx: 0, vy: 0, pop: 0 }); }
      game.signal('BossPhase', 0);
      if (window.__bossdbg && !game.__hbWrapped) {
        game.__hbWrapped = true; game.__hb = {};
        const oh = game.hurtPlayer;
        game.hurtPlayer = function (dmg, src) { const b = this.player.hp; oh.call(this, dmg, src); const k = typeof src === 'string' ? src : src && src.boss ? 'contact' : 'adds'; this.__hb[k] = Math.round((this.__hb[k] || 0) + b - this.player.hp); };
      }
    },

    update(game, e, dt, dx, dy, d) {
      const ai = e.ai, def = e.def || this.defFor(game.worldIndex), p = game.player;
      if (!ai.scripts) return;
      ai.t += dt;
      const T = game.tier;
      // far away from Jack: burst out of the ground next to him
      if (d > 430 && ai.mode !== 'dash') {
        const a = Math.random() * TAU;
        e.x = p.x + Math.cos(a) * 170; e.y = p.y + Math.sin(a) * 120;
        e.spawnT = 0; ai.cd = Math.max(ai.cd, 1.5); ai.mode = 'move';
        game.addFx({ kind: 'ring', x: e.x, y: e.y, r0: 10, r1: 110, life: 0.7, color: 'boss' });
        game.signal('BossSpawn', e);
        return;
      }
      if (e.spawnT < 1) { e.vx = e.vy = 0; return; }
      // phases
      const frac = e.hp / e.maxHp;
      let ph = 0;
      for (const th of def.thresholds) if (frac <= th) ph++;
      const last = def.thresholds.length;
      if (ph > ai.ph) {
        ai.ph = ph; ai.phaseT = 1.5; ai.mode = 'move'; ai.cd = 2.2;
        ai.banner = ph === last ? 'ENRAGED!' : 'PHASE ' + (ph + 1); ai.bannerT = 2;
        e.speed = e.baseSpeed * (1 + 0.07 * ph);
        game.addFx({ kind: 'ring', x: e.x, y: e.y, r0: 10, r1: 160, life: 0.8, color: 'gold' });
        game.addFx({ kind: 'ring', x: e.x, y: e.y, r0: 10, r1: 100, life: 0.55, color: 'boss' });
        game.burst(e.x, e.y - 20, 30, { colors: ['#ffffff', def.accent, ORANGE], speed: 120, life: 0.7, size: 3, z: 20 });
        game.shake = Math.max(game.shake, 9);
        game.signal('BossPhase', ph);
        game.signal('BossSlam', e);
        // all running scripts of the old phase end
        ai.scripts.length = 0;
      }
      const ux = dx / d, uy = dy / d;
      // roar after a phase change
      if (ai.phaseT > 0) {
        ai.phaseT -= dt;
        e.vx = U.damp(e.vx, 0, 8, dt); e.vy = U.damp(e.vy, 0, 8, dt);
        return;
      }
      // charge state machine
      if (ai.mode === 'aim') {
        ai.modeT += dt;
        e.vx = U.damp(e.vx, 0, 10, dt); e.vy = U.damp(e.vy, 0, 10, dt);
        if (ai.modeT < ai.aimDur - 0.3) ai.dir = Math.atan2(dy, dx); // the lane locks 0.3 s before the dash
        if (ai.modeT >= ai.aimDur) { ai.mode = 'dash'; ai.modeT = 0; e.dmg = e.baseDmg * 1.35; }
        return;
      }
      if (ai.mode === 'dash') {
        ai.modeT += dt;
        const sp = 330 + ph * 14;
        e.vx = Math.cos(ai.dir) * sp; e.vy = Math.sin(ai.dir) * sp;
        if (Math.random() < 0.7) game.burst(e.x, e.y, 1, { colors: ['#8a7358', '#c2b090'], speed: 30, life: 0.5, size: 3 });
        if (ai.modeT >= 0.55) { ai.mode = 'rest'; ai.modeT = 0; e.dmg = e.baseDmg; game.shake = Math.max(game.shake, 4); }
        return;
      }
      if (ai.mode === 'rest') {
        ai.modeT += dt;
        e.vx = U.damp(e.vx, 0, 7, dt); e.vy = U.damp(e.vy, 0, 7, dt);
        if (ai.modeT >= 0.8) { ai.mode = 'move'; ai.cd = Math.max(ai.cd, 0.6); }
        return;
      }
      // stand still while an attack is being performed
      let speedK = 1;
      if (ai.busy > 0) { ai.busy -= dt; speedK = 0.12; }
      else if (ai.cd > 0) ai.cd -= dt;
      // keep a little distance so contact damage is avoidable
      const hold = e.r + 34;
      const chase = d > hold ? 1 : d > hold - 22 ? 0.3 : -0.4;
      e.vx = U.damp(e.vx, ux * e.speed * speedK * chase, 3, dt);
      e.vy = U.damp(e.vy, uy * e.speed * speedK * chase, 3, dt);
      if (ai.cd > 0 || ai.busy > 0) return;
      // pick the next attack
      const pool = [];
      let sum = 0;
      for (const a of def.atk) if (a[1] <= ph && a[0] !== ai.last) { pool.push(a); sum += a[2]; }
      let r = Math.random() * sum, pick = pool[0];
      for (const a of pool) { r -= a[2]; if (r <= 0) { pick = a; break; } }
      if (window.__bossForce && Atk[window.__bossForce]) pick = [window.__bossForce, 0, 1];
      ai.last = pick[0];
      const commit = Atk[pick[0]](game, e, ai, ph, T) || 0;
      ai.busy = commit;
      const gap = (2.3 - ph * 0.28) * def.tempo;
      ai.cd = gap + (pick[0] === 'charge' ? 0.5 : 0);
      // a second, shorter-spaced attack in the last phases keeps the pressure on
      if (ph >= 2 && Math.random() < 0.3) ai.cd *= 0.6;
    },

    tick(game, dt) {
      const H = game.hazards, boss = game.boss;
      if (!boss || boss.dying) {
        if (H.length) H.length = 0;
        return;
      }
      const ai = boss.ai;
      if (!ai || !ai.scripts) return;
      const p = game.player;
      if (typeof window !== 'undefined' && window.__bossdbg) debugSample(game, boss, dt);
      // scripts (rain, spiral, radial …)
      for (let i = ai.scripts.length - 1; i >= 0; i--) {
        const s = ai.scripts[i];
        s.t += dt;
        while (s.i < s.n && s.t >= s.next) { s.fn(s.i); s.i++; s.next += s.every; }
        if (s.i >= s.n) ai.scripts.splice(i, 1);
      }
      ai.bannerT = Math.max(0, ai.bannerT - dt);
      // keep the arena readable: the regular horde is thinned out to a handful of enemies near Jack (the fight is about the boss)
      ai.cullT = (ai.cullT || 0) - dt;
      if (ai.cullT <= 0) { ai.cullT = 0.25; cullHorde(game, boss); }
      let w = 0;
      for (let i = 0; i < H.length; i++) {
        const h = H[i];
        let keep = true;
        h.t += dt;
        if (h.k === 'circle') {
          if (h.state === 0) {
            if (h.pull > 0) {
              const dd = ed(p.x, p.y, h.x, h.y);
              if (dd < h.pullR && dd > 1) {
                const k = (1 - dd / h.pullR) * 0.7 + 0.3;
                p.x += ((h.x - p.x) / dd) * h.pull * k * dt;
                p.y += ((h.y - p.y) / dd) * h.pull * k * YS * dt;
              }
            }
            if (h.t >= h.warn) {
              h.state = h.dur > 0 ? 2 : 1; h.flash = 1; h.hitT = 0;
              if (ed(p.x, p.y, h.x, h.y) < h.r + p.r * 0.5) game.hurtPlayer(h.dmg, hsrc(h));
              game.addFx({ kind: 'ring', x: h.x, y: h.y, r0: h.r * 0.5, r1: h.r * 1.15, life: 0.35, color: 'boss' });
              game.burst(h.x, h.y, h.rain ? 4 : 14, { colors: ['#ffffff', ORANGE, RED], speed: h.r * 1.4, life: 0.5, size: 2.6, z: 4, vz: 40, grav: 120 });
              game.shake = Math.max(game.shake, h.rain ? 1.2 : h.big ? 4 : 2);
              if (h.vortex) game.shake = 7;
            }
          } else {
            h.flash = Math.max(0, h.flash - dt * 3.2);
            if (h.state === 2) {
              h.tickT += dt;
              if (h.tickT >= h.every) {
                h.tickT = 0;
                if (ed(p.x, p.y, h.x, h.y) < h.r + p.r * 0.3) game.hurtPlayer(h.dmg, hsrc(h));
              }
              if (h.t >= h.warn + h.dur) { h.state = 1; }
              if (Math.random() < dt * 4) game.addParticle({ core: true, x: h.x + rnd(-h.r, h.r) * 0.7, y: h.y + rnd(-h.r, h.r) * 0.5, vx: 0, vy: -10, z: 2, vz: 20, life: 0.8, size: 2.2, color: ORANGE, kind: 'spark' });
            } else if (h.flash <= 0) keep = false;
          }
        } else if (h.k === 'ring') {
          if (h.t >= h.warn) {
            if (!h.fired) { h.fired = true; game.shake = Math.max(game.shake, 4); game.burst(h.x, h.y, 12, { colors: ['#ffffff', ORANGE], speed: 90, life: 0.4, size: 2.4, z: 4 }); }
            h.R += h.speed * dt;
            const dd = ed(p.x, p.y, h.x, h.y);
            if (Math.abs(dd - h.R) < h.b + p.r * 0.5) {
              let inGap = false;
              const ang = Math.atan2((p.y - h.y) / YS, p.x - h.x);
              for (const gp of h.gaps) { let da = Math.abs(((ang - gp[0] + Math.PI * 3) % TAU) - Math.PI); if (da > Math.PI) da = TAU - da; if (da < gp[1]) inGap = true; }
              if (!inGap && game.hurtPlayer(h.dmg, hsrc(h)) !== false) h.hitFlash = 1;
            }
            if (h.R > h.maxR) keep = false;
          }
          h.hitFlash = Math.max(0, h.hitFlash - dt * 2);
        } else if (h.k === 'beam') {
          h.x = h.follow.x; h.y = h.follow.y;
          if (h.follow.dying) keep = false;
          if (h.t >= h.warn) h.a += h.rot * dt;
          else h.a += h.rot * dt * 0.0; // aim is frozen during the warning
          if (h.t >= h.warn && h.t < h.warn + h.dur) {
            const gx = p.x - h.x, gy = (p.y - h.y) / YS;
            const dist = Math.hypot(gx, gy);
            if (dist < h.L + p.r && dist > 6) {
              const pa = Math.atan2(gy, gx);
              for (let k = 0; k < h.arms; k++) {
                let da = Math.abs(((pa - (h.a + (k * TAU) / h.arms) + Math.PI * 3) % TAU) - Math.PI);
                if (da > Math.PI) da = TAU - da;
                if (Math.sin(Math.min(da, Math.PI / 2)) * dist < h.w * 0.5 + p.r * 0.5 && da < Math.PI / 2) { game.hurtPlayer(h.dmg, hsrc(h)); break; }
              }
            }
          }
          if (h.t >= h.warn + h.dur + 0.25) keep = false;
        } else if (h.k === 'bullet') {
          h.x += h.vx * dt; h.y += h.vy * YS * dt;
          if (h.t > h.life || Math.abs(h.x - p.x) > 480 || Math.abs(h.y - p.y) > 330) keep = false;
          else if (ed(p.x, p.y, h.x, h.y) < h.r + p.r * 0.55) {
            if (p.iframes <= 0 && game.state === 'play') { game.hurtPlayer(h.dmg, hsrc(h)); game.burst(h.x, h.y, 5, { colors: ['#ffffff', ORANGE], speed: 60, life: 0.3, size: 2 }); keep = false; }
          }
        } else if (h.k === 'tell') {
          h.x = h.follow.x; h.y = h.follow.y;
          if (h.t >= h.warn) keep = false;
        }
        if (keep) H[w++] = h;
      }
      H.length = w;
      if (H.length > 420) H.splice(0, H.length - 420);
    },

    onDefeat(game, e) {
      game.hazards.length = 0;
      if (e.ai) e.ai.scripts.length = 0;
      const def = e.def || this.defFor(game.worldIndex);
      for (let i = 0; i < 5; i++) game.addFx({ kind: 'ring', x: e.x, y: e.y, r0: 10, r1: 90 + i * 55, life: 0.5 + i * 0.2, color: i % 2 ? 'gold' : 'boss' });
      game.burst(e.x, e.y - 20, 90, { colors: ['#ffffff', def.accent, ORANGE, '#ffe08a'], speed: 190, life: 1.1, size: 3.6, z: 30, vz: 90, grav: 200 });
      for (let i = 0; i < 24; i++) {
        const a = Math.random() * TAU, s = rnd(40, 160);
        game.addParticle({ core: true, x: e.x, y: e.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7, z: 20, vz: rnd(40, 140), grav: 220, life: rnd(0.8, 1.6), size: rnd(2, 4), color: i % 2 ? '#ffe08a' : def.accent, kind: 'spark' });
      }
      game.shake = 14;
      if (window.Loot && window.Loot.drop) window.Loot.drop(game, e.x, e.y, { rich: true });
      if (window.__bossdbg) debugSample(game, e, 0, true);
    },

    /* ---------------------------------------------------------------- drawing */
    draw(ctx, game, view, accent, layer) {
      const H = game.hazards, boss = game.boss;
      const rt = view.rt;
      if (layer === 'ground') {
        if (boss && !boss.dying && boss.def) drawAura(ctx, boss, view);
        for (let i = 0; i < H.length; i++) {
          const h = H[i];
          if (!inView(h, view, 340)) continue;
          if (h.k === 'circle') drawCircle(ctx, h, rt);
          else if (h.k === 'ring') drawRing(ctx, h, rt, false);
          else if (h.k === 'beam' && h.t < h.warn + 0.01) drawBeam(ctx, h, rt, false);
          else if (h.k === 'tell') drawTell(ctx, h, rt, boss);
        }
        if (boss && boss.ai && boss.ai.mode === 'aim') drawLane(ctx, boss, rt);
        ctx.globalAlpha = 1;
        return;
      }
      // top layer
      for (let i = 0; i < H.length; i++) {
        const h = H[i];
        if (!inView(h, view, 340)) continue;
        if (h.k === 'beam' && h.t >= h.warn) drawBeam(ctx, h, rt, true);
        else if (h.k === 'ring' && h.t >= h.warn) drawRing(ctx, h, rt, true);
        else if (h.k === 'bullet') drawBullet(ctx, h, rt);
      }
      if (boss && !boss.dying && boss.def && boss.spawnT > 0.2) drawDeco(ctx, boss, view);
      ctx.globalAlpha = 1;
    },
  };

  function hsrc(h) { return h.k === 'circle' ? (h.rain ? 'rain' : h.pool ? 'pool' : h.vortex ? 'vortex' : h.big ? 'slam' : 'carpet') : h.k; }
  function inView(h, view, pad) {
    return h.x > view.x0 - pad && h.x < view.x1 + pad && h.y > view.y0 - pad && h.y < view.y1 + pad;
  }

  const HORDE_CAP = 8;
  function cullHorde(game, boss) {
    // enemies that walk in from outside the screen are dropped while the horde is above the cap (summons stay)
    const p = game.player;
    let n = 0;
    for (const o of game.enemies) if (!o.dying && !o.boss) n++;
    if (n <= HORDE_CAP) return;
    for (const o of game.enemies) {
      if (n <= HORDE_CAP) break;
      if (o.dying || o.boss || o.bossAdd) continue;
      if (Math.abs(o.x - p.x) > 340 || Math.abs(o.y - p.y) > 200) { o.dying = true; o.deathT = 1; o.rutas = 0; n--; }
    }
  }

  /* ---- cached sprites ---- */
  const glowCache = {};
  function glow(col) {
    let c = glowCache[col];
    if (c) return c;
    c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, col); g.addColorStop(0.35, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.globalAlpha = 1; x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    glowCache[col] = c;
    return c;
  }
  function drawGlow(ctx, col, x, y, r, a) {
    ctx.globalAlpha = a; ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(glow(col), x - r, y - r, r * 2, r * 2);
    ctx.globalCompositeOperation = 'source-over';
  }
  function ell(ctx, x, y, r) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, r), Math.max(0.1, r * YS), 0, 0, TAU); }
  function stripes(ctx, x, y, r, rt, col, alpha, spacing) {
    ctx.save();
    ell(ctx, x, y, r); ctx.clip();
    ctx.globalAlpha = alpha; ctx.strokeStyle = col; ctx.lineWidth = 3;
    const off = (rt * 14) % spacing;
    ctx.beginPath();
    for (let k = -r * 2; k < r * 2; k += spacing) {
      const sx = x + k + off;
      ctx.moveTo(sx - r, y + r * YS); ctx.lineTo(sx + r, y - r * YS);
    }
    ctx.stroke();
    ctx.restore();
  }

  /* ---- boss aura under the feet (accent = decoration) ---- */
  function drawAura(ctx, e, view) {
    const rt = view.rt, ph = e.ai ? e.ai.ph : 0;
    const R = e.r * (1.5 + 0.12 * Math.sin(rt * 3));
    ctx.save();
    ctx.globalAlpha = 0.22; ctx.fillStyle = e.def.accent;
    ell(ctx, e.x, e.y, R * 1.25); ctx.fill();
    ctx.lineCap = 'round';
    for (let k = 0; k <= ph; k++) {
      ctx.globalAlpha = 0.75; ctx.strokeStyle = k % 2 ? '#fff' : e.def.accent; ctx.lineWidth = 2;
      ctx.setLineDash([9, 7]); ctx.lineDashOffset = -rt * (14 + k * 6) * (k % 2 ? -1 : 1);
      ell(ctx, e.x, e.y, R * (1.35 + k * 0.28)); ctx.stroke();
    }
    ctx.setLineDash([]);
    // rotating rune star: one more point for every world (decoration, accent colour)
    const wi = DEFS.indexOf(e.def), pts = 3 + wi, rr2 = R * 1.1;
    ctx.globalAlpha = 0.55; ctx.strokeStyle = e.def.accent; ctx.lineWidth = 1.4; ctx.lineJoin = 'round';
    ctx.beginPath();
    const step = pts >= 5 ? 2 : 1;
    for (let i = 0; i <= pts; i++) {
      const a = rt * 0.45 + ((i * step) / pts) * TAU;
      const px = e.x + Math.cos(a) * rr2, py = e.y + Math.sin(a) * rr2 * YS;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  /* ---- circle telegraph: translucent red fill + bright pulsing outline + hazard stripes ---- */
  function drawCircle(ctx, h, rt) {
    const x = h.x, y = h.y, r = h.r;
    ctx.save();
    if (h.state === 0) {
      const k = clamp(h.t / h.warn, 0, 1);
      const blink = k > 0.7 ? 0.5 + 0.5 * Math.sin(rt * 34) : 0.5 + 0.5 * Math.sin(rt * 12);
      if (h.vortex || h.pull) {
        // dark swirl pulling inwards
        ctx.globalAlpha = 0.18; ctx.fillStyle = '#2a0a3a'; ell(ctx, x, y, h.pullR); ctx.fill();
        ctx.globalAlpha = 0.5; ctx.strokeStyle = '#b79bff'; ctx.lineWidth = 1.6; ctx.setLineDash([8, 10]); ctx.lineDashOffset = rt * 40;
        ell(ctx, x, y, h.pullR * (0.55 + 0.45 * (1 - ((rt * 0.7) % 1)))); ctx.stroke();
        ell(ctx, x, y, h.pullR * (0.55 + 0.45 * (1 - ((rt * 0.7 + 0.5) % 1)))); ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.5; ctx.strokeStyle = '#d7c7ff'; ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let s = 0; s < 4; s++) for (let q = 0; q <= 14; q++) {
          const rr = h.pullR * (1 - q / 15), aa = -rt * 3 + s * (TAU / 4) + q * 0.34;
          const px = x + Math.cos(aa) * rr, py = y + Math.sin(aa) * rr * YS;
          if (q === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 0.13 + 0.07 * blink; ctx.fillStyle = RED; ell(ctx, x, y, r); ctx.fill();
      ctx.globalAlpha = 0.34 + 0.1 * blink; ell(ctx, x, y, r * k); ctx.fill();
      if (h.big) stripes(ctx, x, y, r, rt, '#7a0d06', 0.3, 11);
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.75; ctx.strokeStyle = '#2a0600'; ctx.lineWidth = 4.2; ell(ctx, x, y, r); ctx.stroke();
      ctx.globalAlpha = 0.65 + 0.35 * blink; ctx.strokeStyle = blink > 0.55 || k > 0.7 ? '#ffe9d6' : '#ff5a3c'; ctx.lineWidth = 2.2; ell(ctx, x, y, r); ctx.stroke();
    } else {
      const f = h.flash;
      if (h.state === 2 || (h.pool && h.state === 1)) {
        // lingering pool
        const left = h.state === 2 ? 1 : f;
        const fadeIn = clamp((h.t - h.warn) / 0.25, 0, 1);
        const fadeOut = h.state === 2 ? clamp((h.warn + h.dur - h.t) / 0.6, 0, 1) : 1;
        const a = fadeIn * fadeOut;
        ctx.globalAlpha = 0.5 * a; ctx.fillStyle = '#ff6a1a'; ell(ctx, x, y, r); ctx.fill();
        ctx.globalAlpha = 0.35 * a; ctx.fillStyle = '#ffd24a'; ell(ctx, x, y, r * (0.55 + 0.1 * Math.sin(rt * 6))); ctx.fill();
        stripes(ctx, x, y, r, rt, '#7a1c00', 0.35 * a, 10);
        ctx.globalAlpha = (0.65 + 0.3 * Math.sin(rt * 9)) * a; ctx.strokeStyle = '#2a0600'; ctx.lineWidth = 4; ell(ctx, x, y, r); ctx.stroke();
        ctx.strokeStyle = '#ffb04a'; ctx.lineWidth = 2; ell(ctx, x, y, r); ctx.stroke();
        void left;
      } else {
        // hit flash: white fill + shock ring
        ctx.globalAlpha = f * 0.85; ctx.fillStyle = '#fff'; ell(ctx, x, y, r * (1 + (1 - f) * 0.08)); ctx.fill();
        ctx.globalAlpha = f * 0.5; ctx.fillStyle = ORANGE; ell(ctx, x, y, r); ctx.fill();
        ctx.globalAlpha = f; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ell(ctx, x, y, r * (1.05 + (1 - f) * 0.2)); ctx.stroke();
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function arcsOutsideGaps(ctx, x, y, R, gaps, rt) {
    // draws the full circle except the safe gaps (stroke only), in ground space
    const list = gaps.map((g0) => [((g0[0] - g0[1]) % TAU + TAU) % TAU, g0[1] * 2]).sort((a, b) => a[0] - b[0]);
    if (!list.length) { ell(ctx, x, y, R); ctx.stroke(); return; }
    ctx.beginPath();
    for (let i = 0; i < list.length; i++) {
      const s = list[i][0] + list[i][1], nx = i + 1 < list.length ? list[i + 1][0] : list[0][0] + TAU;
      if (nx > s) ctx.ellipse(x, y, Math.max(0.1, R), Math.max(0.1, R * YS), 0, s, nx), ctx.moveTo(x + Math.cos(nx) * R, y + Math.sin(nx) * R * YS);
    }
    ctx.stroke();
  }

  function drawRing(ctx, h, rt, top) {
    ctx.save();
    ctx.lineJoin = 'round';
    if (h.t < h.warn) {
      if (top) { ctx.restore(); return; }
      const k = clamp(h.t / h.warn, 0, 1);
      const blink = 0.5 + 0.5 * Math.sin(rt * (k > 0.7 ? 34 : 14));
      // preview of the safe gaps: white wedges on a faint outer ring
      ctx.globalAlpha = 0.5 + 0.3 * blink; ctx.strokeStyle = RED; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -rt * 20;
      ell(ctx, h.x, h.y, 70 + 22 * k); ctx.stroke(); ctx.setLineDash([]);
      for (const gp of h.gaps) {
        ctx.globalAlpha = 0.55 + 0.35 * blink; ctx.strokeStyle = '#d6fff0'; ctx.lineWidth = 3.4;
        ctx.beginPath(); ctx.ellipse(h.x, h.y, 92, 92 * YS, 0, gp[0] - gp[1], gp[0] + gp[1]); ctx.stroke();
        const gx = h.x + Math.cos(gp[0]) * 130, gy = h.y + Math.sin(gp[0]) * 130 * YS;
        ctx.globalAlpha = 0.5 * blink + 0.2; ctx.setLineDash([4, 6]); ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(h.x + Math.cos(gp[0]) * 92, h.y + Math.sin(gp[0]) * 92 * YS); ctx.lineTo(gx, gy); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.restore(); return;
    }
    if (!top) { ctx.restore(); return; }
    const R = h.R, fade = clamp((h.maxR - R) / 60, 0.2, 1);
    ctx.globalAlpha = 0.6 * fade; ctx.strokeStyle = '#2a0600'; ctx.lineWidth = h.b * 2 + 5; arcsOutsideGaps(ctx, h.x, h.y, R, h.gaps, rt);
    ctx.globalAlpha = 0.85 * fade; ctx.strokeStyle = h.hitFlash > 0 ? '#fff' : RED; ctx.lineWidth = h.b * 2; arcsOutsideGaps(ctx, h.x, h.y, R, h.gaps, rt);
    ctx.globalAlpha = 0.95 * fade; ctx.strokeStyle = HOT; ctx.lineWidth = h.b * 0.7; arcsOutsideGaps(ctx, h.x, h.y, R, h.gaps, rt);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawBeam(ctx, h, rt, top) {
    const warn = h.t < h.warn;
    let a = 1;
    if (warn) a = clamp(h.t / h.warn, 0, 1);
    else if (h.t > h.warn + h.dur) a = clamp(1 - (h.t - h.warn - h.dur) / 0.25, 0, 1);
    if (a <= 0) return;
    ctx.save();
    ctx.translate(h.x, h.y); ctx.scale(1, YS);
    ctx.lineCap = 'butt';
    for (let k = 0; k < h.arms; k++) {
      ctx.save();
      ctx.rotate(h.a + (k * TAU) / h.arms);
      if (warn) {
        const blink = a > 0.7 ? 0.5 + 0.5 * Math.sin(rt * 34) : 0.5 + 0.5 * Math.sin(rt * 12);
        ctx.globalAlpha = 0.14 + 0.1 * blink; ctx.fillStyle = RED;
        ctx.fillRect(0, -h.w * 0.5, h.L, h.w);
        ctx.globalAlpha = 0.4 * a + 0.3 * blink; ctx.fillStyle = RED;
        ctx.fillRect(0, -h.w * 0.5 * a, h.L, h.w * a);
        ctx.globalAlpha = 0.8; ctx.strokeStyle = '#2a0600'; ctx.lineWidth = 4;
        ctx.strokeRect(0, -h.w * 0.5, h.L, h.w);
        ctx.globalAlpha = 0.6 + 0.4 * blink; ctx.strokeStyle = a > 0.7 ? '#ffd0c0' : '#ff5a3c'; ctx.lineWidth = 2;
        ctx.strokeRect(0, -h.w * 0.5, h.L, h.w);
      } else {
        ctx.globalAlpha = 0.5 * a; ctx.fillStyle = '#2a0600';
        ctx.fillRect(0, -h.w * 0.5 - 3, h.L, h.w + 6);
        ctx.globalAlpha = 0.9 * a; ctx.fillStyle = RED;
        ctx.fillRect(0, -h.w * 0.5, h.L, h.w);
        ctx.fillStyle = ORANGE; ctx.globalAlpha = 0.8 * a;
        ctx.fillRect(0, -h.w * 0.32, h.L, h.w * 0.64);
        ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.95 * a;
        ctx.fillRect(0, -h.w * 0.12, h.L, h.w * 0.24);
      }
      ctx.restore();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawTell(ctx, h, rt, boss) {
    const k = clamp(h.t / h.warn, 0, 1);
    ctx.save();
    ctx.globalAlpha = 0.25 + 0.4 * k; ctx.strokeStyle = RED; ctx.lineWidth = 2.4;
    ell(ctx, h.x, h.y, h.r * (1.3 - 0.7 * k)); ctx.stroke();
    ctx.globalAlpha = 0.2 + 0.25 * k; ctx.fillStyle = RED;
    ell(ctx, h.x, h.y, h.r * 0.5 * k); ctx.fill();
    if (h.spokes) {
      ctx.globalAlpha = 0.5 * k; ctx.lineWidth = 1.6; ctx.strokeStyle = ORANGE;
      ctx.beginPath();
      for (let i = 0; i < h.spokes; i++) {
        const a = (i / h.spokes) * TAU;
        ctx.moveTo(h.x + Math.cos(a) * 30, h.y + Math.sin(a) * 30 * YS); ctx.lineTo(h.x + Math.cos(a) * (60 + 24 * k), h.y + Math.sin(a) * (60 + 24 * k) * YS);
      }
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawLane(ctx, e, rt) {
    const ai = e.ai, k = clamp(ai.modeT / ai.aimDur, 0, 1);
    const half = e.r + 7, L = 420;
    const blink = k > 0.7 ? 0.5 + 0.5 * Math.sin(rt * 34) : 0.5 + 0.5 * Math.sin(rt * 12);
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(ai.dir);
    ctx.globalAlpha = 0.15 + 0.12 * blink; ctx.fillStyle = RED; ctx.fillRect(0, -half, L, half * 2);
    ctx.globalAlpha = 0.3 + 0.1 * blink; ctx.fillRect(0, -half * k, L, half * 2 * k);
    // chevrons running along the lane
    ctx.globalAlpha = 0.45; ctx.strokeStyle = '#7a0d06'; ctx.lineWidth = 3;
    ctx.beginPath();
    const off = (rt * 90) % 26;
    for (let x = off; x < L; x += 26) { ctx.moveTo(x - 7, -half * 0.5); ctx.lineTo(x, 0); ctx.lineTo(x - 7, half * 0.5); }
    ctx.stroke();
    ctx.globalAlpha = 0.75; ctx.strokeStyle = '#2a0600'; ctx.lineWidth = 4.2; ctx.strokeRect(0, -half, L, half * 2);
    ctx.globalAlpha = 0.65 + 0.35 * blink; ctx.strokeStyle = k > 0.7 ? '#ffd0c0' : '#ff5a3c'; ctx.lineWidth = 2.2; ctx.strokeRect(0, -half, L, half * 2);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawBullet(ctx, h, rt) {
    const r = h.r, y = h.y - 7;
    ctx.globalAlpha = 0.3; ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(h.x, h.y, r * 0.9, r * 0.45, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = '#2a0600';
    ctx.beginPath(); ctx.arc(h.x, y, r + 1.8, 0, TAU); ctx.fill();
    ctx.fillStyle = RED;
    ctx.beginPath(); ctx.arc(h.x, y, r, 0, TAU); ctx.fill();
    ctx.fillStyle = ORANGE;
    ctx.beginPath(); ctx.arc(h.x, y, r * 0.66, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.7 + 0.3 * Math.sin(rt * 14 + h.x);
    ctx.fillStyle = HOT;
    ctx.beginPath(); ctx.arc(h.x - r * 0.1, y - r * 0.1, r * 0.34, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  }

  /* ---- boss decoration: style-independent (the colossus sprite differs hugely between the 20 styles), so everything is
     anchored to the feet: flame wreath, orbiting orbs, rising embers, banner above the boss ---- */
  function drawDeco(ctx, e, view) {
    const rt = view.rt, s = e.scale || 2.1, def = e.def, ai = e.ai;
    const x = e.x, y = e.y, sp = clamp(e.spawnT, 0, 1);
    const enr = ai.ph >= def.thresholds.length;
    const wi = DEFS.indexOf(def);
    const hot = ai.mode === 'aim' || ai.mode === 'dash';
    const ac = def.accent;
    ctx.save();
    for (const d of def.deco) {
      if (d === 'flame') {
        ctx.globalCompositeOperation = 'lighter';
        const n = 9 + ai.ph * 2;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU + rt * 0.8, rr = e.r * 1.3;
          const fl = 0.7 + 0.3 * Math.sin(rt * 9 + i * 2);
          drawGlow(ctx, i % 2 ? '#ff7a1a' : ac, x + Math.cos(a) * rr, y + Math.sin(a) * rr * YS - 8 * fl, 9 * fl + 3, 0.5 * sp * (enr ? 1 : 0.75));
        }
        ctx.globalCompositeOperation = 'source-over';
      } else if (d === 'orbs') {
        const n = 3 + Math.min(4, ai.ph + (wi % 3));
        const rr = e.r * 1.7, hz = 18 * s * 0.5;
        for (let i = 0; i < n; i++) {
          const a = rt * (1.1 + (wi % 3) * 0.25) + (i / n) * TAU;
          const ox = x + Math.cos(a) * rr, oy = y - hz + Math.sin(a) * rr * 0.45;
          drawGlow(ctx, ac, ox, oy, 11, 0.7 * sp);
          ctx.globalAlpha = sp; ctx.fillStyle = '#1a0f20';
          ctx.beginPath(); ctx.arc(ox, oy, 3.6, 0, TAU); ctx.fill();
          ctx.fillStyle = hot || enr ? '#ffb090' : '#fff6d8';
          ctx.beginPath(); ctx.arc(ox, oy, 2.4, 0, TAU); ctx.fill();
        }
      } else if (d === 'embers') {
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 10; i++) {
          const ph = (rt * 0.5 + i / 10) % 1, a = i * 2.4 + wi;
          const ex = x + Math.cos(a) * e.r * 1.1 * (0.5 + 0.5 * Math.sin(i * 5.1)), ey = y - ph * 14 * s;
          ctx.globalAlpha = (1 - ph) * 0.9 * sp; ctx.fillStyle = i % 2 ? ac : '#ffb04a';
          ctx.fillRect(ex - 1.1, ey - 1.1, 2.2, 2.2);
        }
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
    // banner above the boss
    if (ai.bannerT > 0 && ai.banner) {
      const k = clamp(ai.bannerT / 2, 0, 1), up = (1 - k) * 8, by = y - 20 * s * 1.5 - up;
      ctx.save();
      ctx.font = '700 13px "Trebuchet MS", Verdana, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = '#1a0500'; ctx.globalAlpha = Math.min(1, k * 3);
      ctx.strokeText(ai.banner, x, by); ctx.fillStyle = ai.banner === 'ENRAGED!' ? '#ff6a4a' : '#ffe08a';
      ctx.fillText(ai.banner, x, by);
      ctx.restore();
    }
    if (ai.mode === 'aim') {
      const k = clamp(ai.modeT / ai.aimDur, 0, 1);
      drawGlow(ctx, '#ff3b2f', x, y - 18 * s * 0.5, 30 + 10 * Math.sin(rt * 20), 0.25 + 0.3 * k);
    }
    ctx.globalAlpha = 1;
  }

  /* ---- debug sampling (only with ?bossdbg) ---- */
  let dbgNext = 0;
  function debugSample(game, boss, dt, done) {
    const t = game.worldTime - game.waveSeconds;
    if (!done && t < dbgNext) return;
    dbgNext = t + 5;
    let el = document.getElementById('bossdbg');
    if (!el) { el = document.createElement('script'); el.type = 'application/json'; el.id = 'bossdbg'; document.body.appendChild(el); el.dataset.lines = '[]'; }
    const L = JSON.parse(el.dataset.lines);
    L.push({ t: Math.round(t), bossHp: Math.round((boss.hp / boss.maxHp) * 100), max: boss.maxHp, ph: boss.ai ? boss.ai.ph : -1, php: Math.round(game.player.hp), pmax: game.player.maxHp, dmg: Math.round(game.damageDealt), hb: game.__hb, lv: game.level, done: !!done });
    el.dataset.lines = JSON.stringify(L);
    el.textContent = el.dataset.lines;
  }

  /* ---- autopilot: add avoidance of telegraphed danger so the bot is a "decent player" ---- */
  function wrapAutopilot() {
    const GD = window.GameData;
    if (!GD || !GD.autopilot || GD.autopilot.__bossWrapped) return;
    const old = GD.autopilot;
    const wrapped = function (game) {
      const r = old(game);
      const H = game.hazards;
      if (!H || !H.length || !game.boss) return r;
      const p = game.player;
      let ax = r.x, ay = r.y, dash = r.dash, danger = 0;
      for (let i = 0; i < H.length; i++) {
        const h = H[i];
        if (h.k === 'circle') {
          if (h.state === 1) continue;
          if (h.state === 0 && h.warn - h.t > 1.5 && !h.pull) continue;
          const dd = ed(p.x, p.y, h.x, h.y), lim = h.r + 30;
          if (dd < lim && !(h.state === 0 && h.rain && h.warn - h.t > 0.95)) {
            let ox = p.x - h.x, oy = (p.y - h.y) / YS, ol = Math.hypot(ox, oy);
            if (ol < 2) { ox = p.x - game.boss.x; oy = p.y - game.boss.y; ol = Math.hypot(ox, oy) || 1; }
            const wgt = 3 + 4 * (1 - dd / lim);
            ax += (ox / ol) * wgt; ay += (oy / ol) * wgt * YS; danger++;
          } else if (h.pull && h.state === 0 && dd < h.pullR) {
            const ol = Math.hypot(p.x - h.x, p.y - h.y) || 1;
            ax += ((p.x - h.x) / ol) * 1.2; ay += ((p.y - h.y) / ol) * 1.2;
          }
        } else if (h.k === 'ring') {
          const dd = ed(p.x, p.y, h.x, h.y), gap = dd - h.R;
          if (gap > -4 && gap < 150) {
            // steer towards the nearest safe gap before the wave arrives
            const ang = Math.atan2((p.y - h.y) / YS, p.x - h.x);
            let bd = 9, bg = null;
            for (const gp of h.gaps) { let da = ((gp[0] - ang + Math.PI * 3) % TAU) - Math.PI; if (Math.abs(da) < Math.abs(bd)) { bd = da; bg = gp; } }
            if (bg && Math.abs(bd) > bg[1] * 0.45) {
              const sg = bd >= 0 ? 1 : -1;
              ax += -Math.sin(ang) * sg * 5; ay += Math.cos(ang) * sg * 5 * YS; danger++;
            }
          }
          if (h.t < h.warn) continue;
          if (gap > -h.b * 2 - 4 && gap < h.b + 34) {
            const ang = Math.atan2((p.y - h.y) / YS, p.x - h.x);
            let inGap = false;
            for (const gp of h.gaps) { let da = Math.abs(((ang - gp[0] + Math.PI * 3) % TAU) - Math.PI); if (da > Math.PI) da = TAU - da; if (da < gp[1] - 0.05) inGap = true; }
            if (!inGap && gap < h.b + 24 && gap > -h.b - 6) dash = true;
          }
        } else if (h.k === 'beam') {
          if (h.t > h.warn + h.dur) continue;
          const gx = p.x - h.x, gy = (p.y - h.y) / YS, dist = Math.hypot(gx, gy);
          if (dist > h.L + 40) continue;
          const pa = Math.atan2(gy, gx);
          let best = 9, bestSgn = 1, bestDa = 9;
          for (let k = 0; k < h.arms; k++) {
            let da = ((pa - (h.a + (k * TAU) / h.arms) + Math.PI * 3) % TAU) - Math.PI;
            const ad = Math.abs(da);
            if (ad < bestDa) { bestDa = ad; bestSgn = da >= 0 ? 1 : -1; }
          }
          const perp = Math.sin(Math.min(bestDa, Math.PI / 2)) * dist;
          const lim = h.w * 0.5 + 32 + (h.t >= h.warn ? Math.abs(h.rot) * dist * 0.35 : 0);
          if (bestDa < Math.PI / 2 && perp < lim) {
            // move tangentially away from the arm; also sneak closer to the boss where the arms sweep slower
            const tx = -Math.sin(pa) * bestSgn, ty = Math.cos(pa) * bestSgn * YS;
            const wgt = 4 + 4 * (1 - perp / lim);
            ax += tx * wgt; ay += ty * wgt;
            if (dist > 70) { ax -= (gx / dist) * 1.5; ay -= (gy / dist) * 1.5 * YS; }
            danger++;
            if (h.t >= h.warn && perp < h.w * 0.5 + 7) dash = true;
          }
        } else if (h.k === 'bullet') {
          const dx = p.x - h.x, dy = (p.y - h.y) / YS, dd = Math.hypot(dx, dy);
          if (dd < 62) {
            // dodge sideways to the bullet's path
            const sp = Math.hypot(h.vx, h.vy) || 1, vx = h.vx / sp, vy = h.vy / sp;
            const along = dx * vx + dy * vy;
            if (along > -10) {
              const px = dx - vx * along, py = dy - vy * along, pl = Math.hypot(px, py) || 1;
              const wgt = 2.5 * (1 - dd / 62) + 0.6;
              ax += (px / pl) * wgt; ay += (py / pl) * wgt * YS; danger++;
              if (dd < h.r + p.r + 7 && along > 0) dash = true;
            }
          }
        }
      }
      // charge lane
      const b = game.boss;
      if (b.ai && (b.ai.mode === 'aim' || b.ai.mode === 'dash')) {
        const lx = Math.cos(b.ai.dir), ly = Math.sin(b.ai.dir);
        const rx = p.x - b.x, ry = p.y - b.y, along = rx * lx + ry * ly, perp = rx * -ly + ry * lx;
        if (along > -40 && Math.abs(perp) < b.r + 36) {
          const sgn = perp >= 0 ? 1 : -1;
          ax += -ly * sgn * 7; ay += lx * sgn * 7; danger++;
        }
      }
      const l = Math.hypot(ax, ay) || 1;
      if (danger) return { x: ax / l, y: ay / l, dash };
      return { x: r.x, y: r.y, dash };
    };
    wrapped.__bossWrapped = true;
    wrapped.__inner = old;
    GD.autopilot = wrapped;
  }
  wrapAutopilot();

  if (typeof location !== 'undefined') {
    if (/[?&]bossdbg/.test(location.search)) window.__bossdbg = true;
    const m = /[?&]bossforce=(\w+)/.exec(location.search);
    if (m) window.__bossForce = m[1];
  }
  window.Bosses = Bosses;
})();
