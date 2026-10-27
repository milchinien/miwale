/* Gameplay simulation – identical for every visual style. All units are world units (VIEW_H = 360 visible).
   Modes: 'sandbox' (style test page, endless) and 'campaign' (one world = one evening: waves → boss → portal). */
(function () {
  'use strict';
  const U = window.U;

  const VIEW_H = 360;
  const RUN_SECONDS = 600; // sandbox clock 22:00 -> 00:00

  const ENEMY_TYPES = {
    creeper: { r: 9, hp: 16, speed: 36, dmg: 8, xp: 1, mass: 1, rutas: 0.18, name: 'Rutabaga Creeper' },
    ghost: { r: 7, hp: 7, speed: 64, dmg: 5, xp: 1, mass: 0.6, rutas: 0.1, name: 'Hunger Ghost' },
    colossus: { r: 17, hp: 120, speed: 22, dmg: 16, xp: 5, mass: 4, rutas: 3, name: 'Rutabaga Colossus' },
  };
  const BOSS = { r: 30, hp: 230, speed: 27, dmg: 24, xp: 30, mass: 40, rutas: 30, scale: 2.1, name: 'The Great Turnip Ancestor' };

  /* ---------- rarities (level-up cards) ---------- */
  const RARITIES = [
    { id: 'common', name: 'Common', mult: 1, weight: 100 },
    { id: 'rare', name: 'Rare', mult: 1.6, weight: 24 },
    { id: 'epic', name: 'Epic', mult: 2.3, weight: 8 },
    { id: 'legendary', name: 'Legendary', mult: 3.2, weight: 2.5 },
  ];
  const fmt = (v, d = 0) => (Math.round(v * 10 ** d) / 10 ** d).toString();
  const steps = (m) => Math.max(1, Math.round(m)); // integer stacks scale with rarity: 1 / 2 / 2 / 3

  /* ---------- in-run upgrades (level-up cards, rarity- and mastery-scaled via m) ---------- */
  const ITEMS = [
    { id: 'dmg', icon: 'dmg', name: 'Sharp Seeds', text: (m) => '+' + fmt(8 * m) + '% damage (all weapons)', apply: (g, m) => (g.stats.dmgMul *= 1 + 0.08 * m) },
    { id: 'rate', icon: 'rate', name: 'Quick Fingers', max: 8, text: (m) => '+' + fmt(8 * m) + '% attack speed (all weapons)', apply: (g, m) => (g.stats.atkSpeed *= 1 + 0.08 * m) },
    { id: 'speed', icon: 'speed', name: 'Cinderella Shoe', max: 5, text: (m) => '+' + fmt(8 * m) + '% move speed', apply: (g, m) => (g.stats.speed *= 1 + 0.08 * m) },
    { id: 'magnet', icon: 'magnet', name: 'Harvest Basket', max: 4, text: (m) => '+' + fmt(40 * m) + '% pickup radius', apply: (g, m) => (g.stats.magnet *= 1 + 0.4 * m) },
    { id: 'hp', icon: 'hp', name: 'Rutabaga Stew', text: (m) => '+' + fmt(20 * m) + ' max HP, full heal', apply: (g, m) => { g.player.maxHp += Math.round(20 * m); g.player.hp = g.player.maxHp; } },
    { id: 'crit', icon: 'crit', name: 'Lucky Lantern', max: 5, text: (m) => '+' + fmt(7 * m) + '% critical hit chance', apply: (g, m) => (g.stats.crit += 0.07 * m) },
    { id: 'armor', icon: 'armor', name: 'Rutabaga Rind', max: 4, text: (m) => '−' + fmt(8 * m) + '% damage taken', apply: (g, m) => (g.stats.armor = Math.max(0.35, g.stats.armor * (1 - 0.08 * m))) },
    { id: 'regen', icon: 'regen', name: 'Warm Spot', max: 3, text: (m) => 'While standing still: +' + fmt(3 * m, 1) + ' HP/s', apply: (g, m) => (g.stats.regen += 3 * m) },
    { id: 'greed', icon: 'greed', name: 'Harvest Festival', max: 4, text: (m) => '+' + fmt(25 * m) + '% Rutabagas', apply: (g, m) => (g.stats.greed *= 1 + 0.25 * m) },
  ];
  // the four weapons (seed pistol, rocket, kill circle, bouncing boulder) live in js/core/weapons.js
  for (const w of (window.Weapons && window.Weapons.items) || []) ITEMS.push(w);
  const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
  for (const it of ITEMS) it.desc = it.text(1); // plain description (sandbox, docs)

  class Game {
    constructor(opts = {}) {
      this.seed = opts.seed !== undefined ? opts.seed : (Math.random() * 1e9) | 0;
      this.mode = opts.mode || 'sandbox';
      this.hooks = {};
      this.viewW = 640;
      this.viewH = VIEW_H;
      this.listeners = {};
      this.meta = null; // permanent upgrades of the save slot: { mods, mastery, rarities }
      this.reset();
    }
    on(name, fn) { (this.listeners[name] = this.listeners[name] || []).push(fn); }
    signal(name, a, b) { for (const fn of this.listeners[name] || []) fn(a, b); }

    reset() {
      this.rng = U.rng(this.seed);
      this.time = 0;
      this.kills = 0;
      this.killsBy = { creeper: 0, ghost: 0, colossus: 0, boss: 0 };
      this.damageDealt = 0;
      this.level = 1;
      this.xp = 0;
      this.xpNext = this.xpFor(1);
      this.state = 'play';
      this.choices = null;
      this.pendingLevels = 0;
      this.shake = 0;
      this.nextId = 1;
      this.player = {
        kind: 'player', x: 0, y: 0, vx: 0, vy: 0, r: 9,
        hp: 100, maxHp: 100, facing: 1, moving: false, anim: 0, dir: 0, aim: 0,
        iframes: 0, hurtT: 0, dashT: 0, dashCd: 0, dashX: 1, dashY: 0, shootT: 0, levelT: 0, stillT: 0,
      };
      this.stats = {
        dmg: 10, speed: 92, magnet: 46, projSpeed: 250, range: 230,
        crit: 0.1, armor: 1, regen: 0, greed: 1, cooldown: 1, atkSpeed: 1,
        dmgMul: 1, xpMul: 1, dashCd: 1.4, luck: 0, revives: 0, rerolls: 0,
      };
      this.owned = {};
      this.enemies = [];
      this.projectiles = [];
      this.orbitals = [];
      this.gems = [];
      this.particles = [];
      this.numbers = [];
      this.fx = []; // core-drawn effects: rings, telegraphs, explosions
      this.spawnAcc = 0;
      this.chests = []; // dropped by elites (js/core/loot.js)
      this.hazards = []; // boss area attacks (js/core/bosses.js)
      this.weapons = { pistol: 1, rocket: 0, aura: 0, boulder: 0 }; // weapon levels 0..5 (js/core/weapons.js)
      this.weaponPower = { pistol: 1, rocket: 1, aura: 1, boulder: 1 }; // rarity / mastery damage multiplier per weapon
      this.choicesInfo = null;
      this.owned.w_pistol = 1;
      if (window.Weapons) window.Weapons.reset(this);
      this.swarmT = 30;
      this.grid = new Map();
      // campaign
      this.rutas = 0;
      this.worldIndex = 0;
      this.tier = 0;
      this.worldTime = 0;
      this.waveSecondsOverride = 0;
      this.phase = 'waves';
      this.boss = null;
      this.portal = null;
      this.rerollsLeft = 0;
      this.totalTime = 0;
      this.revivedT = 0;
    }

    /* ---------- permanent upgrades (meta) ---------- */
    applyMeta(meta) {
      this.meta = meta || null;
      if (!meta) return;
      const m = meta.mods || {};
      const S = this.stats, p = this.player;
      p.maxHp += 10 * (m.vitality || 0); p.hp = p.maxHp;
      S.dmgMul *= 1 + 0.06 * (m.power || 0);
      S.speed *= 1 + 0.03 * (m.haste || 0);
      S.magnet *= 1 + 0.12 * (m.reach || 0);
      S.greed *= 1 + 0.1 * (m.fortune || 0);
      S.xpMul *= 1 + 0.08 * (m.wisdom || 0);
      S.luck += m.luck || 0;
      S.dashCd *= 1 - 0.08 * (m.dash || 0);
      S.revives += m.revive || 0;
      S.rerolls += m.reroll || 0;
      S.armor *= 1 - 0.04 * (m.toughness || 0);
      for (const [mod, w] of [['startRocket', 'rocket'], ['startAura', 'aura'], ['startBoulder', 'boulder']]) {
        if (m[mod] && this.weapons[w] < 1) { this.weapons[w] = 1; this.owned['w_' + w] = 1; }
      }
    }
    mastery(id) { return (this.meta && this.meta.mastery && this.meta.mastery[id]) || 0; }
    rarityUnlocked(id) { return id === 'common' || !!(this.meta && this.meta.rarities && this.meta.rarities[id]); }

    /* ---------- campaign ---------- */
    startWorld(index, tier) {
      this.worldIndex = index;
      this.tier = tier !== undefined ? tier : index;
      this.worldTime = 0;
      this.phase = 'waves';
      this.boss = null;
      this.portal = null;
      this.enemies = [];
      this.projectiles = [];
      this.fx = [];
      this.chests = [];
      this.hazards = [];
      this.spawnAcc = 0;
      this.swarmT = 26;
      this.state = 'play';
      this.player.iframes = 1.5;
    }
    get waveSeconds() { return this.waveSecondsOverride || (window.Worlds && window.Worlds.waveSeconds) || 120; }
    get difficulty() {
      if (this.mode !== 'campaign') return 1 + this.time / 150;
      const w = this.tier;
      return 1 + w * 0.95 + w * w * 0.13 + this.worldTime / 120;
    }
    /** 0..1 progress through the evening (waves); the boss fight is the last bit before midnight */
    get dayProgress() {
      if (this.phase === 'waves') return Math.min(1, this.worldTime / this.waveSeconds) * 0.94;
      return this.phase === 'portal' ? 1 : 0.94 + 0.05 * Math.min(1, (this.worldTime - this.waveSeconds) / 60);
    }
    get clockText() {
      let mins;
      if (this.mode === 'campaign') {
        const start = (window.Worlds && window.Worlds.startHour) || 16;
        mins = start * 60 + this.dayProgress * (24 - start) * 60;
      } else {
        mins = 22 * 60 + Math.min(120, (this.time / RUN_SECONDS) * 120);
      }
      const h = Math.floor(mins / 60) % 24;
      const m = Math.floor(mins % 60);
      const h12 = ((h + 11) % 12) + 1;
      return h12 + ':' + String(m).padStart(2, '0') + (h < 12 ? ' AM' : ' PM');
    }
    get runProgress() { return this.mode === 'campaign' ? this.dayProgress : Math.min(1, this.time / RUN_SECONDS); }

    /* ---------- helpers ---------- */
    emit(name, a, b) {
      this.signal(name, a, b);
      const fn = this.hooks && this.hooks['on' + name];
      if (fn) {
        try { fn.call(this.hooks, this, a, b); } catch (e) { console.error(e); window.__reportError && window.__reportError(e); }
        return true;
      }
      return false;
    }
    addParticle(p) {
      if (this.particles.length > 900) return null;
      p.life = p.life || 0.5;
      p.max = p.life;
      p.vx = p.vx || 0; p.vy = p.vy || 0;
      p.z = p.z || 0; p.vz = p.vz || 0;
      p.drag = p.drag === undefined ? 2 : p.drag;
      p.grav = p.grav || 0;
      p.rot = p.rot || 0; p.vr = p.vr || 0;
      p.size = p.size || 2;
      p.seed = p.seed === undefined ? Math.random() : p.seed;
      p.sid = this.hooks && this.hooks.id; // particles are drawn only by the style that made them
      this.particles.push(p);
      return p;
    }
    burst(x, y, n, opts = {}) {
      const pm = window.Meta && window.Meta.settings ? [0, 0.4, 1, 1.8][window.Meta.settings.particles === undefined ? 2 : window.Meta.settings.particles] : 1;
      n = pm === 0 ? 0 : Math.max(1, Math.round(n * pm));
      const colors = opts.colors || ['#ffffff'];
      for (let i = 0; i < n; i++) {
        const a = Math.random() * U.TAU, s = (opts.speed || 60) * (0.4 + Math.random() * 0.8);
        const pt = this.addParticle({
          x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7,
          z: opts.z || 4, vz: opts.vz !== undefined ? opts.vz * (0.5 + Math.random()) : 0,
          grav: opts.grav || 0, life: (opts.life || 0.5) * (0.6 + Math.random() * 0.6),
          size: (opts.size || 2) * (0.6 + Math.random() * 0.8), color: colors[(Math.random() * colors.length) | 0],
          kind: opts.kind || 'spark', drag: opts.drag, vr: (Math.random() - 0.5) * 10,
        });
        if (pt && !opts.styled) pt.sid = null; // generic core sparks: every style can draw them
      }
    }
    number(x, y, value, crit) {
      if (this.numbers.length > 80) this.numbers.shift();
      this.numbers.push({ x: x + (Math.random() - 0.5) * 6, y: y - 10, value: Math.round(value), crit: !!crit, life: 0.75, max: 0.75, seed: Math.random() });
    }
    addFx(f) { f.t = 0; this.fx.push(f); return f; }
    gridKey(cx, cy) { return (cx * 73856093) ^ (cy * 19349663); }
    buildGrid() {
      const g = this.grid;
      g.clear();
      for (const e of this.enemies) {
        if (e.dying) continue;
        const k = this.gridKey(Math.floor(e.x / 40), Math.floor(e.y / 40));
        let arr = g.get(k);
        if (!arr) g.set(k, (arr = []));
        arr.push(e);
      }
    }
    query(x, y, r, fn) {
      const x0 = Math.floor((x - r) / 40), x1 = Math.floor((x + r) / 40);
      const y0 = Math.floor((y - r) / 40), y1 = Math.floor((y + r) / 40);
      for (let cy = y0; cy <= y1; cy++) {
        for (let cx = x0; cx <= x1; cx++) {
          const arr = this.grid.get(this.gridKey(cx, cy));
          if (arr) for (const e of arr) if (!e.dying && fn(e) === false) return;
        }
      }
    }
    nearestEnemy(x, y, maxD, exclude) {
      let best = null, bd = maxD * maxD;
      for (const e of this.enemies) {
        if (e.dying || e.spawnT < 0.5) continue;
        if (exclude && exclude.has(e.id)) continue;
        const d = (e.x - x) ** 2 + (e.y - y) ** 2;
        if (d < bd) { bd = d; best = e; }
      }
      return best;
    }

    /* ---------- spawning ---------- */
    spawnEnemy(type, x, y) {
      const T = ENEMY_TYPES[type];
      const hpScale = this.difficulty;
      const w = this.mode === 'campaign' ? this.tier : 0;
      const e = {
        kind: 'enemy', id: this.nextId++, type, x, y, r: T.r, hp: T.hp * hpScale, maxHp: T.hp * hpScale,
        speed: T.speed * (0.9 + this.rng.next() * 0.2) * (1 + Math.min(0.35, w * 0.03)),
        dmg: T.dmg * (1 + w * 0.16 + w * w * 0.01), xp: T.xp, mass: T.mass, rutas: T.rutas,
        vx: 0, vy: 0, kx: 0, ky: 0, flash: 0, facing: 1, anim: this.rng.next() * 10, spawnT: 0,
        seed: this.rng.next(), dying: false, deathT: 0, lanternCd: 0, hitT: 0,
      };
      this.enemies.push(e);
      if (window.Loot) window.Loot.onSpawn(this, e);
      return e;
    }
    spawnBoss() {
      const p = this.player;
      const a = this.rng.next() * U.TAU;
      const e = this.spawnEnemy('colossus', p.x + Math.cos(a) * 170, p.y + Math.sin(a) * 120);
      // the world's boss (stats, attacks, look): js/core/bosses.js
      Object.assign(e, { boss: true, r: BOSS.r, hp: BOSS.hp, maxHp: BOSS.hp, speed: BOSS.speed, dmg: BOSS.dmg, xp: BOSS.xp, mass: BOSS.mass, rutas: BOSS.rutas, scale: BOSS.scale, name: BOSS.name, ai: {} });
      if (window.Bosses) window.Bosses.spawn(this, e);
      this.boss = e;
      this.phase = 'boss';
      this.shake = 8;
      this.addFx({ kind: 'ring', x: e.x, y: e.y, r0: 10, r1: 140, life: 0.9, color: 'boss' });
      this.emit('BossSpawn', e);
    }
    spawnRingPos(extra = 30) {
      const a = this.rng.next() * U.TAU;
      const rx = this.viewW / 2 + extra, ry = this.viewH / 2 + extra;
      return { x: this.player.x + Math.cos(a) * rx * 1.05, y: this.player.y + Math.sin(a) * ry * 1.15, a };
    }
    updateSpawning(dt) {
      if (this.mode === 'campaign' && this.phase === 'portal') return;
      const camp = this.mode === 'campaign';
      const t = camp ? this.worldTime : this.time;
      const w = camp ? this.tier : 0;
      const alive = this.enemies.length;
      let cap = Math.min(320, 80 + w * 14 + t * 2.2);
      let rate = 2.2 + w * 0.45 + t * 0.07;
      if (camp && this.phase === 'boss') { rate *= 0.3; cap *= 0.45; }
      this.spawnAcc += rate * dt;
      while (this.spawnAcc >= 1) {
        this.spawnAcc -= 1;
        if (alive >= cap) break;
        const r = this.rng.next();
        let type = 'creeper';
        const colT = camp ? Math.max(0, 22 - w * 8) : 22;
        const ghostT = camp ? Math.max(0, 8 - w * 4) : 8;
        if (t > colT && r < 0.06 + Math.min(0.06, w * 0.006)) type = 'colossus';
        else if (t > ghostT && r < 0.42) type = 'ghost';
        const p = this.spawnRingPos();
        this.spawnEnemy(type, p.x, p.y);
      }
      this.swarmT -= dt;
      if (this.swarmT <= 0) {
        this.swarmT = Math.max(14, 24 - w);
        const p = this.spawnRingPos(10);
        const n = 10 + Math.floor(t / 20) + w * 2;
        for (let i = 0; i < n; i++) {
          this.spawnEnemy('ghost', p.x + (this.rng.next() - 0.5) * 70, p.y + (this.rng.next() - 0.5) * 70);
        }
      }
    }

    /* ---------- damage ---------- */
    damageEnemy(e, dmg, kx, ky, src) {
      if (e.dying) return;
      dmg *= this.stats.dmgMul;
      const crit = this.rng.next() < this.stats.crit;
      if (crit) dmg *= 2;
      e.hp -= dmg;
      this.damageDealt += dmg;
      e.flash = 1;
      e.hitT = 0;
      const kb = 140 / e.mass;
      e.kx += kx * kb; e.ky += ky * kb;
      this.number(e.x, e.y - e.r * (e.scale || 1), dmg, crit);
      if (!this.emit('Hit', e, src)) this.burst(e.x, e.y, 3, { colors: ['#ffffff', '#ffd27a'], speed: 50, life: 0.25, size: 1.5 });
      if (crit) this.signal('Crit', e);
      if (e.hp <= 0) this.killEnemy(e);
    }
    killEnemy(e) {
      e.dying = true;
      e.deathT = 0;
      this.kills++;
      const kind = e.boss ? 'boss' : e.type;
      this.killsBy[kind] = (this.killsBy[kind] || 0) + 1;
      const big = e.xp >= 5;
      this.gems.push({ kind: 'gem', x: e.x, y: e.y, value: e.xp, big, seed: Math.random(), t: 0, fly: false, vx: 0, vy: 0, pop: 1 });
      if (this.mode === 'campaign') {
        const r = e.rutas * this.stats.greed;
        let gain = Math.floor(r);
        if (this.rng.next() < r - gain) gain++;
        if (gain > 0) { this.rutas += gain; this.signal('Rutas', gain, e); }
      }
      if (!this.emit('Kill', e)) this.burst(e.x, e.y, 8, { colors: ['#e8d9ff', '#9b6bd1', '#ffffff'], speed: 70, life: 0.45, size: 2 });
      if (e.type === 'colossus') this.shake = Math.max(this.shake, 4);
      if (window.Loot) window.Loot.onKill(this, e);
      if (e.boss) this.bossDefeated(e);
    }
    bossDefeated(e) {
      this.boss = null;
      this.phase = 'portal';
      this.shake = 12;
      // midnight bell: everything else on screen dies, all gems fly home
      for (const o of this.enemies) if (!o.dying && o !== e) { o.rutas = 0; this.killEnemy(o); }
      for (const g of this.gems) g.fly = true;
      for (let i = 0; i < 4; i++) this.addFx({ kind: 'ring', x: e.x, y: e.y, r0: 10, r1: 120 + i * 70, life: 0.6 + i * 0.25, color: 'gold' });
      const p = this.player;
      const a = Math.atan2(e.y - p.y, e.x - p.x);
      this.portal = { x: p.x + Math.cos(a) * 90, y: p.y + Math.sin(a) * 70, t: 0, open: 0 };
      if (window.Bosses) window.Bosses.onDefeat(this, e);
      this.signal('BossDie', e);
      this.signal('PortalOpen', this.portal);
    }
    hurtPlayer(dmg, src) {
      const p = this.player;
      if (p.iframes > 0 || this.state !== 'play') return;
      p.hp -= dmg * this.stats.armor;
      p.iframes = 0.7;
      p.hurtT = 1;
      this.shake = Math.max(this.shake, 5);
      if (!this.emit('Hurt', p, src)) this.burst(p.x, p.y, 8, { colors: ['#ff5a3c', '#ffb36b'], speed: 70, life: 0.35 });
      if (p.hp <= 0) {
        if (this.stats.revives > 0) {
          // "Zweite Laterne": come back once with half HP and push everything away
          this.stats.revives--;
          p.hp = p.maxHp * 0.5;
          p.iframes = 2.5;
          this.revivedT = 1;
          this.addFx({ kind: 'nova', x: p.x, y: p.y - 4, r0: 8, r1: 160, life: 0.6, id: this.nextId++, dmg: this.stats.dmg * 3, hit: new Set() });
          this.signal('Revive', p);
          return;
        }
        p.hp = 0;
        this.state = 'dead';
        this.emit('Death', p);
      }
    }

    /* ---------- level ups ---------- */
    xpFor(level) { return Math.round(12 + (level - 1) * 11 + Math.pow(level - 1, 2.0) * 1.4); }
    gainXp(v) {
      this.xp += v * this.stats.xpMul;
      while (this.xp >= this.xpNext) {
        this.xp -= this.xpNext;
        this.level++;
        this.xpNext = this.xpFor(this.level);
        this.pendingLevels++;
      }
      if (this.pendingLevels > 0 && this.state === 'play') this.openLevelUp();
    }
    canTake(id) {
      const it = ITEM_BY_ID[id];
      return !(it.max && (this.owned[id] || 0) >= it.max);
    }
    /** apply an upgrade; m = rarity multiplier, mastery of the save slot adds +25 % per level */
    take(it, m = 1) {
      const eff = m * (1 + 0.25 * this.mastery(it.id));
      it.apply(this, eff);
      this.owned[it.id] = (this.owned[it.id] || 0) + 1;
    }
    rollRarity(minId) {
      const luck = this.stats.luck;
      const pool = RARITIES.filter((r) => (this.mode !== 'campaign' ? r.id === 'common' : this.rarityUnlocked(r.id)));
      const weights = pool.map((r) => (r.id === 'common' ? r.weight : r.weight * (1 + luck * 0.35)));
      let x = this.rng.next() * weights.reduce((a, b) => a + b, 0);
      let pick = pool[0];
      for (let i = 0; i < pool.length; i++) { x -= weights[i]; if (x <= 0) { pick = pool[i]; break; } }
      if (minId) { // chests: at least this rarity, if unlocked (else the best unlocked one)
        const need = RARITIES.findIndex((r) => r.id === minId);
        if (RARITIES.indexOf(pick) < need) pick = [...pool].reverse().find((r) => RARITIES.indexOf(r) <= need) || pick;
      }
      return pick;
    }
    makeChoices(opts) {
      // weapons are offered more often than passives (weight 2), so builds come together quickly
      const bag = [];
      for (const it of ITEMS) if (this.canTake(it.id)) { bag.push(it.id); if (it.weapon) bag.push(it.id); }
      const choices = [];
      while (choices.length < 3 && bag.length) {
        const id = bag[(this.rng.next() * bag.length) | 0];
        for (let i = bag.length - 1; i >= 0; i--) if (bag[i] === id) bag.splice(i, 1);
        const item = ITEM_BY_ID[id];
        const rarity = this.rollRarity(opts && opts.minRarity);
        const eff = rarity.mult * (1 + 0.25 * this.mastery(id));
        choices.push({ item, rarity, id, icon: item.icon, name: item.name, weapon: item.weapon, desc: item.text(eff), mult: rarity.mult });
      }
      return choices;
    }
    /** level-up cards. opts: { chest: true, title, minRarity: 'rare' } for treasure chests (js/core/loot.js) */
    openLevelUp(opts) {
      if (!opts) this.pendingLevels--;
      this.choicesInfo = opts || null;
      this.choices = this.makeChoices(opts);
      this.rerollsLeft = this.stats.rerolls;
      this.state = 'levelup';
      this.player.levelT = 1;
      this.emit('LevelUp', this.player);
    }
    rerollChoices() {
      if (this.state !== 'levelup' || this.rerollsLeft <= 0) return false;
      this.rerollsLeft--;
      this.choices = this.makeChoices();
      return true;
    }
    choose(i) {
      if (this.state !== 'levelup' || !this.choices || !this.choices[i]) return;
      const c = this.choices[i];
      this.take(c.item || ITEM_BY_ID[c.id], c.mult || 1);
      this.choices = null;
      this.choicesInfo = null;
      this.state = 'play';
      this.player.iframes = Math.max(this.player.iframes, 0.6);
      if (this.pendingLevels > 0) this.openLevelUp();
    }

    /** a chest was opened (called by js/core/loot.js): rutabagas + a free card pick with at least Rare quality */
    openChest(chest) {
      const rutas = Math.round((6 + this.tier * 3) * this.stats.greed * (chest.rich ? 2 : 1));
      this.rutas += rutas;
      this.signal('Rutas', rutas, chest);
      this.signal('ChestOpen', chest);
      this.openLevelUp({ chest: true, title: 'Treasure!', minRarity: 'rare', rutas });
    }

    /* ---------- main update ---------- */
    update(dt, input) {
      this.updateEffects(dt);
      if (this.state !== 'play') return;
      this.time += dt;
      this.totalTime += dt;
      const p = this.player, S = this.stats;
      const camp = this.mode === 'campaign';
      if (camp) {
        this.worldTime += dt;
        if (this.phase === 'waves' && this.worldTime >= this.waveSeconds) this.spawnBoss();
      }
      this.revivedT = Math.max(0, this.revivedT - dt);

      // movement + dash
      let ix = input.x, iy = input.y;
      const il = Math.hypot(ix, iy);
      if (il > 1) { ix /= il; iy /= il; }
      p.dashCd = Math.max(0, p.dashCd - dt);
      if (input.dash && p.dashCd <= 0 && p.dashT <= 0) {
        const dl = Math.hypot(ix, iy);
        p.dashX = dl > 0.1 ? ix / dl : p.facing;
        p.dashY = dl > 0.1 ? iy / dl : 0;
        p.dashT = 0.2;
        p.dashCd = S.dashCd;
        p.iframes = Math.max(p.iframes, 0.25);
        this.emit('Dash', p);
      }
      const speed = S.speed;
      if (p.dashT > 0) {
        p.dashT -= dt;
        p.vx = p.dashX * speed * 3.4;
        p.vy = p.dashY * speed * 3.4;
        this.query(p.x, p.y, p.r + 20, (e) => {
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d < p.r + e.r + 4 && e.hitT > 0.2) this.damageEnemy(e, S.dmg * 0.6, (e.x - p.x) / (d || 1), (e.y - p.y) / (d || 1), 'dash');
        });
      } else {
        p.vx = U.damp(p.vx, ix * speed, 18, dt);
        p.vy = U.damp(p.vy, iy * speed, 18, dt);
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const sp = Math.hypot(p.vx, p.vy);
      p.moving = sp > 8;
      p.anim += (sp * dt) / 10;
      if (Math.abs(p.vx) > 4) p.facing = p.vx > 0 ? 1 : -1;
      if (p.moving) p.dir = Math.atan2(p.vy, p.vx);
      p.iframes = Math.max(0, p.iframes - dt);
      p.hurtT = Math.max(0, p.hurtT - dt * 3);
      p.shootT = Math.max(0, p.shootT - dt * 5);
      p.levelT = Math.max(0, p.levelT - dt * 1.5);
      p.stillT = p.moving ? 0 : p.stillT + dt;
      if (S.regen > 0 && p.stillT > 0.6 && p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + S.regen * dt);

      this.buildGrid();
      this.updateSpawning(dt);

      // weapons (seed pistol, rocket, kill circle, boulder), their projectiles and damage: js/core/weapons.js
      this.orbitals.length = 0;
      if (window.Weapons) window.Weapons.update(this, dt);
      // elites' chests, chest pickup: js/core/loot.js · boss area attacks: js/core/bosses.js
      if (window.Loot) window.Loot.update(this, dt);
      if (window.Bosses) window.Bosses.tick(this, dt);

      // core effects with gameplay (nova damage, boss slam)
      for (const f of this.fx) {
        if (f.kind === 'nova') {
          const k = Math.min(1, f.t / f.life);
          const R = f.r0 + (f.r1 - f.r0) * U.ease.outQuad(k);
          this.query(f.x, f.y, R + 20, (e) => {
            if (f.hit.has(e.id)) return;
            const d = Math.hypot(e.x - f.x, e.y - f.y);
            if (d < R + e.r) { f.hit.add(e.id); this.damageEnemy(e, f.dmg, (e.x - f.x) / (d || 1), (e.y - f.y) / (d || 1), 'nova'); }
          });
        }
      }

      // enemies
      for (const e of this.enemies) {
        if (e.dying) { e.deathT += dt / (e.boss ? 0.9 : 0.35); continue; }
        e.spawnT = Math.min(1, e.spawnT + dt / (e.boss ? 1.2 : 0.45));
        e.flash = Math.max(0, e.flash - dt * 7);
        e.hitT += dt;
        e.lanternCd = Math.max(0, e.lanternCd - dt);
        const dx = p.x - e.x, dy = p.y - e.y;
        const d = Math.hypot(dx, dy) || 1;
        if (!e.boss && d > Math.max(this.viewW, this.viewH) * 1.3) {
          const q = this.spawnRingPos();
          e.x = q.x; e.y = q.y; e.spawnT = 0;
          continue;
        }
        const spd = e.spawnT < 1 ? 0 : e.speed;
        if (e.boss) { if (window.Bosses) window.Bosses.update(this, e, dt, dx, dy, d); }
        else if (e.type === 'ghost') {
          const w = Math.sin(this.time * 3 + e.seed * 20) * 0.5;
          const ax = dx / d - (dy / d) * w, ay = dy / d + (dx / d) * w;
          e.vx = U.damp(e.vx, ax * spd, 4, dt);
          e.vy = U.damp(e.vy, ay * spd, 4, dt);
        } else {
          e.vx = U.damp(e.vx, (dx / d) * spd, 6, dt);
          e.vy = U.damp(e.vy, (dy / d) * spd, 6, dt);
        }
        e.x += (e.vx + e.kx) * dt;
        e.y += (e.vy + e.ky) * dt;
        e.kx = U.damp(e.kx, 0, 9, dt);
        e.ky = U.damp(e.ky, 0, 9, dt);
        if (Math.abs(e.vx) > 3) e.facing = e.vx > 0 ? 1 : -1;
        e.anim += (Math.hypot(e.vx, e.vy) * dt) / (e.boss ? 18 : 10);
        if (d < e.r + p.r - 2 && e.spawnT >= 1) this.hurtPlayer(e.dmg, e);
      }
      // separation
      for (const e of this.enemies) {
        if (e.dying) continue;
        this.query(e.x, e.y, e.r + 18, (o) => {
          if (o === e) return;
          const dx = o.x - e.x, dy = o.y - e.y;
          const dd = dx * dx + dy * dy;
          const min = e.r + o.r - 2;
          if (dd < min * min && dd > 0.0001) {
            const dl = Math.sqrt(dd), push = (min - dl) * 0.5;
            const tm = e.mass + o.mass;
            e.x -= (dx / dl) * push * (o.mass / tm);
            e.y -= (dy / dl) * push * (o.mass / tm);
            o.x += (dx / dl) * push * (e.mass / tm);
            o.y += (dy / dl) * push * (e.mass / tm);
          }
        });
      }
      this.enemies = this.enemies.filter((e) => !e.dying || e.deathT < 1);

      // gems
      const mag = S.magnet;
      for (const g of this.gems) {
        g.t += dt;
        g.pop = Math.max(0, g.pop - dt * 3);
        const dx = p.x - g.x, dy = p.y - g.y;
        const d = Math.hypot(dx, dy) || 1;
        if (!g.fly && d < mag) g.fly = true;
        if (g.fly) {
          const acc = 900;
          g.vx += (dx / d) * acc * dt; g.vy += (dy / d) * acc * dt;
          g.vx *= 0.92; g.vy *= 0.92;
          g.x += g.vx * dt; g.y += g.vy * dt;
          if (d < p.r + 4) {
            g.dead = true;
            this.emit('Pickup', g);
            this.gainXp(g.value);
          }
        }
      }
      this.gems = this.gems.filter((g) => !g.dead);
      if (this.gems.length > 400) this.gems.splice(0, this.gems.length - 400);

      // portal
      if (this.portal) {
        const po = this.portal;
        po.t += dt;
        po.open = Math.min(1, po.open + dt * 1.4);
        if (po.open >= 1 && this.gems.length === 0 && this.state === 'play' && Math.hypot(p.x - po.x, p.y - po.y) < 20) {
          this.state = 'portal';
          this.signal('PortalEnter', po);
        }
      }
    }

    updateEffects(dt) {
      if (window.Fx) window.Fx.update(this, dt);
      for (const pt of this.particles) {
        pt.life -= dt;
        pt.x += pt.vx * dt; pt.y += pt.vy * dt;
        const k = Math.exp(-pt.drag * dt);
        pt.vx *= k; pt.vy *= k;
        pt.rot += pt.vr * dt;
        if (pt.grav) {
          pt.vz -= pt.grav * dt;
          pt.z += pt.vz * dt;
          if (pt.z < 0) { pt.z = 0; pt.vz *= -0.35; pt.vx *= 0.5; pt.vy *= 0.5; }
        }
      }
      this.particles = this.particles.filter((pt) => pt.life > 0);
      for (const n of this.numbers) { n.life -= dt; n.y -= 22 * dt; }
      this.numbers = this.numbers.filter((n) => n.life > 0);
      this.shake = Math.max(0, this.shake - dt * 18);
      if (this.state === 'play') {
        for (const f of this.fx) f.t += dt;
        this.fx = this.fx.filter((f) => f.t < f.life + (f.kind === 'slam' ? 0.05 : 0));
      }
    }
  }

  /** Simple bot used for the screenshot mode, the title-screen attract mode and the "B" autopilot. */
  function autopilot(game) {
    const p = game.player;
    let ax = 0, ay = 0;
    for (const e of game.enemies) {
      if (e.dying) continue;
      const dx = p.x - e.x, dy = p.y - e.y;
      const d2 = dx * dx + dy * dy;
      const reach = e.boss ? 120 : 140; // stay in seed range of the boss, like a real player
      if (d2 > reach * reach) continue;
      const d = Math.sqrt(d2) || 1;
      const w = (e.boss ? 4 : e.type === 'colossus' ? 2.2 : 1) / (d * d) * 900;
      ax += (dx / d) * w; ay += (dy / d) * w;
    }
    for (const f of game.fx) {
      if (f.kind !== 'slam') continue;
      const dx = p.x - f.x, dy = p.y - f.y, d = Math.hypot(dx, dy) || 1;
      if (d < f.r + 20) { ax += (dx / d) * 3; ay += (dy / d) * 3; }
    }
    let near = null, nd = 1e9;
    for (const g of game.gems) {
      const d = (g.x - p.x) ** 2 + (g.y - p.y) ** 2;
      if (d < nd) { nd = d; near = g; }
    }
    if (near && nd < 220 * 220) {
      const d = Math.sqrt(nd) || 1;
      ax += ((near.x - p.x) / d) * 0.6; ay += ((near.y - p.y) / d) * 0.6;
    } else if (game.portal && game.portal.open >= 1) {
      const d = Math.hypot(game.portal.x - p.x, game.portal.y - p.y) || 1;
      ax += ((game.portal.x - p.x) / d) * 2; ay += ((game.portal.y - p.y) / d) * 2;
    }
    const wa = game.time * 0.25;
    ax += Math.cos(wa) * 0.35; ay += Math.sin(wa) * 0.35;
    const l = Math.hypot(ax, ay) || 1;
    let close = false;
    for (const e of game.enemies) if (!e.dying && (e.x - p.x) ** 2 + (e.y - p.y) ** 2 < (e.boss ? 50 : 26) ** 2) close = true;
    return { x: ax / l, y: ay / l, dash: close };
  }

  window.Game = Game;
  window.GameData = { VIEW_H, RUN_SECONDS, ENEMY_TYPES, BOSS, ITEMS, ITEM_BY_ID, RARITIES, UPGRADES: ITEMS.slice(0, 8), autopilot };
})();
