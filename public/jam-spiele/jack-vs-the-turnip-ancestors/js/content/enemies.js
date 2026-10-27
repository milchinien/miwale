/* New enemy types. Gameplay + spawn table + enemy projectiles + core-drawn telegraphs + fallback looks.
   Fields the art can read (all read-only for art):
     spitter  e.mode 'move'|'aim'|'recover', e.charge 0→1 while aiming (swelling up), e.spit 1→0 right after spitting
     bomber   e.armed (bool), e.fuse 0→1 once armed (explodes at 1)
     charger  e.mode 'chase'|'tele'|'dash'|'rest', e.modeT (seconds in mode), e.dashX/e.dashY (unit dash direction)
     mother   e.birth 1→0 right after she drops a Turnipling
     sprout   (plain small chaser)
   plus everything every enemy has (x, y, r, facing, anim, seed, spawnT, flash, dying, deathT, vx, vy …). */
(function () {
  'use strict';
  const U = window.U, GD = window.GameData, ET = GD.ENEMY_TYPES, C = window.Content;
  const P = window.Game.prototype;
  const TAU = U.TAU;
  const sfx = (n, o) => { try { window.Sfx && window.Sfx.play(n, o); } catch (e) { /* audio is optional */ } };
  /** difficulty tier: campaign world tier, sandbox = one tier per 80 s */
  const tierOf = (g) => (g.mode === 'campaign' ? (g.tier !== undefined ? g.tier : g.worldIndex) : Math.floor(g.time / 80));
  C.tierOf = tierOf;
  const near = (g, x, y, m = 0.6) => Math.abs(x - g.player.x) < g.viewW * m && Math.abs(y - g.player.y) < g.viewH * m;

  /* ---------- AI ----------
     The core moves every enemy as a plain chaser. Types with a `brain` are taken out of that (speed 0 inside the core
     loop, see the update wrapper below) and moved here instead: brain(g, e, dt, dx, dy, d, spd) sets e.vx / e.vy. */
  function spitterAI(g, e, dt, dx, dy, d, spd) {
    e.spit = Math.max(0, (e.spit || 0) - dt * 3);
    if (e.frozen) { e.vx = e.vy = 0; return; }
    if (e.spawnT < 1) { e.mode = 'move'; e.charge = 0; }
    const nx = dx / d, ny = dy / d;
    if (e.mode === 'aim') {
      e.charge = Math.min(1, e.charge + dt / 0.62);
      e.vx = U.damp(e.vx, 0, 10, dt); e.vy = U.damp(e.vy, 0, 10, dt);
      e.facing = dx > 0 ? 1 : -1;
      if (e.charge >= 1) {
        spit(g, e, d);
        e.mode = 'recover'; e.modeT = 0.4; e.charge = 0; e.spit = 1;
        e.cd = 2.2 + g.rng.next() * 1.3;
      }
      return;
    }
    if (e.mode === 'recover') {
      e.modeT -= dt;
      e.vx = U.damp(e.vx, -nx * spd * 0.5, 6, dt); e.vy = U.damp(e.vy, -ny * spd * 0.5, 6, dt);
      if (e.modeT <= 0) e.mode = 'move';
      return;
    }
    // keep a respectful distance and circle around Jack
    let mx, my;
    if (d > 150) { mx = nx; my = ny; }
    else if (d < 92) { mx = -nx; my = -ny; }
    else { mx = -ny * e.orbit * 0.75 + nx * 0.08; my = nx * e.orbit * 0.75 + ny * 0.08; }
    e.vx = U.damp(e.vx, mx * spd, 5, dt); e.vy = U.damp(e.vy, my * spd, 5, dt);
    e.cd -= dt;
    if (e.cd <= 0 && d < 215 && e.spawnT >= 1) { e.mode = 'aim'; e.charge = 0; }
  }
  function spit(g, e, d) {
    const p = g.player, sp = 118;
    const lead = Math.min(0.7, d / sp) * 0.45;
    const a = Math.atan2(p.y + p.vy * lead - e.y, p.x + p.vx * lead - e.x);
    const w = tierOf(g);
    const n = w >= 9 ? 3 : w >= 4 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const aa = a + (i - (n - 1) / 2) * 0.26;
      g.eshots.push({
        kind: 'eshot', x: e.x + Math.cos(aa) * 8, y: e.y + Math.sin(aa) * 4, z: 11, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp,
        r: 4.2, dmg: e.dmg, life: 3.2, age: 0, seed: Math.random(), angle: aa,
      });
    }
    if (near(g, e.x, e.y)) sfx('shoot', { vol: 0.32, pitch: 0.55 });
  }

  function bomberAI(g, e, dt, dx, dy, d, spd) {
    if (e.frozen) { e.vx = e.vy = 0; return; }
    if (e.spawnT < 1) { e.armed = false; e.fuse = 0; }
    const nx = dx / d, ny = dy / d;
    if (!e.armed && d < 32 && e.spawnT >= 1) {
      e.armed = true; e.fuse = 0;
      sfx('bossCharge', { vol: 0.22, pitch: 2.4 });
    }
    if (e.armed) {
      e.fuse = Math.min(1, e.fuse + dt / 0.9);
      e.vx = U.damp(e.vx, nx * spd * 0.3, 8, dt); e.vy = U.damp(e.vy, ny * spd * 0.3, 8, dt);
      if (e.fuse >= 1 && !e.dying) {
        e.exploded = true;
        blast(g, e.x, e.y, e.dmg * 2.5, true);
        g.killEnemy(e);
      }
      return;
    }
    // jittery, eager waddle
    const w = Math.sin(g.time * 7 + e.seed * 30) * 0.4;
    e.vx = U.damp(e.vx, (nx - ny * w) * spd, 7, dt); e.vy = U.damp(e.vy, (ny + nx * w) * spd, 7, dt);
  }
  const BLAST_R = 44;
  /** Turnip-bomb blast: always hurts enemies (chain reactions!), hurts Jack only when the fuse ran out. */
  function blast(g, x, y, dmgPlayer, hurtsPlayer) {
    const p = g.player;
    g.addFx({ kind: 'blast', x, y, r0: 6, r1: BLAST_R, life: 0.32, color: hurtsPlayer ? 'boss' : undefined });
    g.cfx.push({ kind: 'boom', x, y, t: 0, life: 0.45, r: BLAST_R, hot: hurtsPlayer });
    g.shake = Math.max(g.shake, hurtsPlayer ? 5 : 3);
    if (hurtsPlayer && Math.hypot(p.x - x, p.y - y) < BLAST_R + p.r) g.hurtPlayer(dmgPlayer, { kind: 'blast' });
    const dmg = g.stats.dmg * 2.6;
    g.query(x, y, BLAST_R + 20, (o) => {
      const dd = Math.hypot(o.x - x, o.y - y);
      if (dd < BLAST_R + o.r && o.spawnT >= 0.3) g.damageEnemy(o, o.boss ? dmg * 0.5 : dmg, (o.x - x) / (dd || 1), (o.y - y) / (dd || 1), 'bomb');
    });
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * TAU, s = 40 + Math.random() * 90;
      g.addParticle({ x, y, z: 4, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7, vz: 20 + Math.random() * 60, grav: 160, life: 0.5 + Math.random() * 0.4, size: 2 + Math.random() * 2, color: ['#ff7a1a', '#ffd23f', '#6b2d5c', '#3a1d2a'][i % 4], kind: i % 3 ? 'spark' : 'chunk', drag: 1.5, vr: (Math.random() - 0.5) * 12 });
    }
    for (let i = 0; i < 5; i++) g.addParticle({ x: x + (Math.random() - 0.5) * 20, y: y + (Math.random() - 0.5) * 12, z: 6, vz: 12, life: 0.7, size: 5, color: '#5a4a52', kind: 'smoke', drag: 2 });
    if (near(g, x, y, 0.8)) sfx('explode', { vol: hurtsPlayer ? 0.75 : 0.55, pitch: hurtsPlayer ? 0.95 : 1.15 });
    g.signal('TurnipBlast', x, y);
  }
  function bomberDeath(g, e) {
    if (e.exploded || g.phase === 'portal') return;
    // shot down: it still goes off – a moment later, and it only hurts its own kind
    g._later.push({ t: 0.09, fn: () => blast(g, e.x, e.y, 0, false) });
  }

  function chargerAI(g, e, dt, dx, dy, d, spd) {
    if (e.frozen) { e.vx = e.vy = 0; return; }
    const T = ET.charger;
    if (e.spawnT < 1) { e.mode = 'chase'; e.modeT = 0; e.mass = T.mass; }
    const nx = dx / d, ny = dy / d;
    const chill = e.chillMul || 1;
    e.modeT += dt;
    if (e.mode === 'tele') {
      e.vx = U.damp(e.vx, 0, 12, dt); e.vy = U.damp(e.vy, 0, 12, dt);
      if (e.modeT < 0.38) { e.dashX = nx; e.dashY = ny; } // keeps tracking at first, then the line is locked
      e.facing = e.dashX > 0 ? 1 : -1;
      if (e.modeT >= 0.72) {
        e.mode = 'dash'; e.modeT = 0; e.mass = 9;
        if (near(g, e.x, e.y)) sfx('dash', { vol: 0.4, pitch: 0.65 });
      }
      return;
    }
    if (e.mode === 'dash') {
      const v = 265 * chill;
      e.vx = e.dashX * v; e.vy = e.dashY * v;
      e.facing = e.dashX > 0 ? 1 : -1;
      if (Math.random() < 0.6) g.addParticle({ x: e.x - e.dashX * 6, y: e.y, z: 1, vx: -e.dashX * 30 + (Math.random() - 0.5) * 20, vy: -e.dashY * 30, vz: 10, life: 0.45, size: 2.5, color: '#8a7a66', kind: 'dust', drag: 3 });
      if (e.modeT >= 0.5) { e.mode = 'rest'; e.modeT = 0; e.mass = T.mass; }
      return;
    }
    if (e.mode === 'rest') {
      e.vx = U.damp(e.vx, 0, 6, dt); e.vy = U.damp(e.vy, 0, 6, dt);
      if (e.modeT >= 0.75) { e.mode = 'chase'; e.modeT = 0; e.cd = 2.1 + g.rng.next() * 1.5; }
      return;
    }
    e.vx = U.damp(e.vx, nx * spd, 6, dt); e.vy = U.damp(e.vy, ny * spd, 6, dt);
    e.cd -= dt;
    if (e.cd <= 0 && d > 48 && d < 170 && e.spawnT >= 1) {
      e.mode = 'tele'; e.modeT = 0; e.dashX = nx; e.dashY = ny;
      if (near(g, e.x, e.y)) sfx('bossCharge', { vol: 0.25, pitch: 1.8 });
    }
  }

  /** mother walks like a normal chaser (core), this only runs her timer */
  function motherTick(g, e, dt) {
    e.birth = Math.max(0, (e.birth || 0) - dt * 2);
    if (e.frozen) return;
    const dx = g.player.x - e.x, dy = g.player.y - e.y, d = Math.hypot(dx, dy) || 1;
    e.birthT -= dt;
    if (e.birthT <= 0 && e.spawnT >= 1 && d < 300) {
      e.birthT = 5.5 + g.rng.next() * 2.5;
      e.birth = 1;
      const a = Math.atan2(-dy, -dx) + (g.rng.next() - 0.5) * 1.2; // drops them behind her
      g._spawnQ.push({ type: 'sprout', x: e.x + Math.cos(a) * 12, y: e.y + Math.sin(a) * 8, kx: Math.cos(a) * 60, ky: Math.sin(a) * 40 });
    }
  }
  function motherDeath(g, e) {
    if (g.phase === 'portal') return;
    const n = 3 + Math.min(2, Math.floor(tierOf(g) / 4));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + g.rng.next() * 0.6;
      g._spawnQ.push({ type: 'sprout', x: e.x + Math.cos(a) * 8, y: e.y + Math.sin(a) * 6, kx: Math.cos(a) * 110, ky: Math.sin(a) * 80, quick: true });
    }
    if (near(g, e.x, e.y)) sfx('killBig', { vol: 0.5, pitch: 1.25 });
  }

  /* ---------- definitions ---------- */
  const DEFS = {
    spitter: {
      r: 9, hp: 20, speed: 31, dmg: 7, xp: 2, mass: 1.1, rutas: 0.14, name: 'Turnip Spitter', base: 'creeper', drawScale: 1.06,
      brain: spitterAI, init: (g, e) => { e.mode = 'move'; e.cd = 1.4 + g.rng.next() * 1.8; e.charge = 0; e.spit = 0; e.orbit = g.rng.next() < 0.5 ? 1 : -1; },
    },
    bomber: {
      r: 8, hp: 11, speed: 60, dmg: 6, xp: 1, mass: 0.8, rutas: 0.1, name: 'Fuse Beet', base: 'creeper', drawScale: 0.9,
      brain: bomberAI, onDeath: bomberDeath, init: (g, e) => { e.fuse = 0; e.armed = false; },
    },
    charger: {
      r: 10, hp: 34, speed: 40, dmg: 13, xp: 2, mass: 1.6, rutas: 0.18, name: 'Root Ram', base: 'creeper', drawScale: 1.16,
      brain: chargerAI, init: (g, e) => { e.mode = 'chase'; e.modeT = 0; e.cd = 1 + g.rng.next() * 2; e.dashX = 1; e.dashY = 0; },
    },
    mother: {
      r: 14, hp: 64, speed: 23, dmg: 12, xp: 3, mass: 3, rutas: 0.6, name: 'Rutabaga Matriarch', base: 'colossus', drawScale: 0.8,
      tick: motherTick, onDeath: motherDeath, init: (g, e) => { e.birthT = 3.5 + g.rng.next() * 3; e.birth = 0; },
    },
    sprout: {
      r: 6, hp: 5, speed: 54, dmg: 4, xp: 1, mass: 0.5, rutas: 0.03, name: 'Turnipling', base: 'creeper', drawScale: 0.62,
    },
  };
  for (const [id, def] of Object.entries(DEFS)) { ET[id] = def; C.enemyTypes[id] = def; }

  /* ---------- spawn table: some regular creeper spawns become one of the new types ---------- */
  const VARIANTS = [
    { id: 'spitter', from: (w, t) => w >= 1 || t > 26, chance: (w) => 0.09 + Math.min(0.06, w * 0.005), cap: (w) => 7 + w },
    { id: 'bomber', from: (w, t) => w >= 1 || t > 40, chance: (w) => 0.08 + Math.min(0.06, w * 0.005), cap: (w) => 10 + w },
    { id: 'charger', from: (w, t) => w >= 2 || (w === 1 && t > 15) || t > 58, chance: (w) => 0.06 + Math.min(0.04, w * 0.004), cap: (w) => 5 + (w >> 1) },
    { id: 'mother', from: (w, t) => w >= 2 || (w === 1 && t > 35), chance: (w) => 0.035 + Math.min(0.03, w * 0.003), cap: (w) => 3 + ((w / 3) | 0) },
  ];
  /** Every world has a "featured" new enemy that shows up twice as often – gives each world its own flavour. */
  const FEATURE = ['spitter', 'bomber', 'charger', 'mother', 'spitter', 'charger', 'bomber', 'mother'];
  function pickVariant(g) {
    const t = g.mode === 'campaign' ? g.worldTime : g.time;
    const w = tierOf(g);
    const feat = FEATURE[Math.floor(g.mode === 'campaign' ? g.worldIndex : w) % FEATURE.length];
    let r = g.rng.next();
    for (const v of VARIANTS) {
      if (!v.from(w, t)) continue;
      const c = v.chance(w) * (v.id === feat ? 2 : 1);
      if (r < c) {
        let n = 0;
        for (const e of g.enemies) if (e.type === v.id && !e.dying) n++;
        return n < v.cap(w) ? v.id : null;
      }
      r -= c;
    }
    return null;
  }

  /* ---------- Game hooks (all from the outside – js/core/game.js is not edited) ---------- */
  const clearContent = (g) => { g.eshots = []; g.cfx = []; g._spawnQ = []; g._later = []; };
  const oReset = P.reset;
  P.reset = function () {
    oReset.call(this);
    clearContent(this);
  };
  const oStartWorld = P.startWorld;
  P.startWorld = function (...args) {
    oStartWorld.apply(this, args);
    clearContent(this);
  };
  const oSpawn = P.spawnEnemy;
  P.spawnEnemy = function (type, x, y) {
    if (type === 'creeper' && !this._lineup) type = pickVariant(this) || type;
    const e = oSpawn.call(this, type, x, y);
    const T = C.enemyTypes[type];
    if (T) {
      e.spd0 = e.speed;
      if (T.brain) e.speed = 0; // the core loop must not walk it – the brain does (see update below)
      if (T.init) T.init(this, e);
    }
    return e;
  };
  const oDamage = P.damageEnemy;
  P.damageEnemy = function (e, dmg, kx, ky, src) {
    if (!e.dying) e.lastSrc = src;
    return oDamage.call(this, e, dmg, kx, ky, src);
  };
  const oKill = P.killEnemy;
  P.killEnemy = function (e) {
    if (e.dying) return;
    oKill.call(this, e);
    const T = C.enemyTypes[e.type];
    if (T && T.onDeath) {
      try { T.onDeath(this, e); } catch (err) { C.report('onDeath:' + e.type, err); }
    }
    for (const fn of C.onEnemyDie) fn(this, e);
  };

  /** Extra per-frame systems (upgrades.js registers its weapons here). Only run while the game is in 'play'. */
  C.pre = []; C.post = []; C.onEnemyDie = [];
  const oUpdate = P.update;
  P.update = function (dt, input) {
    if (!this.eshots) clearContent(this);
    const playing = this.state === 'play';
    if (playing) {
      for (const fn of C.pre) fn(this, dt);
      // brains: freeze them for the core loop (it then only applies knockback), move them after it
      for (const e of this.enemies) {
        const T = !e.dying && C.enemyTypes[e.type];
        if (!T || !T.brain) continue;
        e._vx = e.vx; e._vy = e.vy;
        e.vx = 0; e.vy = 0; e.speed = 0;
      }
    }
    oUpdate.call(this, dt, input);
    if (!playing) return;
    const p = this.player;
    for (const e of this.enemies) {
      if (e.dying) continue;
      const T = C.enemyTypes[e.type];
      if (!T) continue;
      if (T.brain && e._vx !== undefined) {
        e.vx = e._vx; e.vy = e._vy; e._vx = undefined;
        const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
        const spd = e.spawnT < 1 ? 0 : e.spd0 * (e.chillMul || 1);
        T.brain(this, e, dt, dx, dy, d, spd);
        if (e.dying) continue;
        e.x += e.vx * dt; e.y += e.vy * dt;
        if (Math.abs(e.vx) > 3 && e.mode !== 'aim' && e.mode !== 'tele') e.facing = e.vx > 0 ? 1 : -1;
        e.anim += (Math.hypot(e.vx, e.vy) * dt) / 10;
      }
      if (T.tick) T.tick(this, e, dt);
    }
    // delayed actions (chain blasts) and queued spawns (Turniplings)
    if (this._later.length) {
      const now = this._later; this._later = [];
      for (const l of now) { l.t -= dt; if (l.t <= 0) l.fn(); else this._later.push(l); }
    }
    if (this._spawnQ.length) {
      const q = this._spawnQ; this._spawnQ = [];
      for (const s of q) {
        if (this.enemies.length >= 360 || this.phase === 'portal') break;
        const e = this.spawnEnemy(s.type, s.x, s.y);
        e.kx = s.kx || 0; e.ky = s.ky || 0;
        if (s.quick) e.spawnT = 0.55;
      }
    }
    updateShots(this, dt);
    for (const fn of C.post) fn(this, dt);
    for (const f of this.cfx) f.t += dt;
    if (this.cfx.length) this.cfx = this.cfx.filter((f) => f.t < f.life);
  };

  /* ---------- enemy shots ---------- */
  function updateShots(g, dt) {
    if (!g.eshots.length) return;
    const p = g.player;
    const novas = g.fx.filter((f) => f.kind === 'nova');
    for (const s of g.eshots) {
      s.age += dt; s.life -= dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.life <= 0) { splat(g, s, false); continue; }
      const dx = p.x - s.x, dy = p.y - s.y;
      const rr = s.r + p.r * 0.72;
      if (dx * dx + dy * dy < rr * rr && p.iframes <= 0) {
        g.hurtPlayer(s.dmg, s);
        s.life = 0; splat(g, s, true);
        continue;
      }
      // lanterns and shockwaves swat shots out of the air
      for (const o of g.orbitals) {
        if ((o.x - s.x) ** 2 + (o.y - s.y) ** 2 < 110) { s.life = 0; splat(g, s, false); break; }
      }
      if (s.life <= 0) continue;
      for (const f of novas) {
        const k = Math.min(1, f.t / f.life);
        const R = f.r0 + (f.r1 - f.r0) * U.ease.outQuad(k);
        if (Math.hypot(s.x - f.x, s.y - f.y) < R) { s.life = 0; splat(g, s, false); break; }
      }
    }
    g.eshots = g.eshots.filter((s) => s.life > 0);
  }
  function splat(g, s, onJack) {
    g.burst(s.x, s.y, onJack ? 8 : 5, { colors: ['#c6ff5e', '#7bd63a', '#f4ffd8', '#4f9a2a'], speed: 55, life: 0.32, size: 1.8, z: s.z, vz: 30, grav: 120 });
  }
  C.blast = blast;

  /* ---------- autopilot: dodge shots, armed bombs and charge lanes (screenshots, attract mode, sims) ---------- */
  const oAuto = GD.autopilot;
  GD.autopilot = function (game) {
    const r = oAuto(game);
    if (game._lineup) return { x: 0, y: 0, dash: false };
    const p = game.player;
    let ax = r.x, ay = r.y, danger = false;
    for (const s of game.eshots || []) {
      const dx = p.x - s.x, dy = p.y - s.y, d2 = dx * dx + dy * dy;
      if (d2 > 80 * 80) continue;
      const sl = Math.hypot(s.vx, s.vy) || 1, ux = s.vx / sl, uy = s.vy / sl;
      if (dx * ux + dy * uy < 0) continue; // already past
      const side = dx * -uy + dy * ux >= 0 ? 1 : -1; // step sideways out of the lane
      ax += -uy * side * 2.2; ay += ux * side * 2.2;
      if (d2 < 22 * 22) danger = true;
    }
    for (const e of game.enemies) {
      if (e.dying) continue;
      if (e.type === 'bomber' && e.armed) {
        const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
        if (d < 75) { ax += (dx / d) * 4; ay += (dy / d) * 4; }
      } else if (e.type === 'charger' && (e.mode === 'tele' || e.mode === 'dash')) {
        const dx = p.x - e.x, dy = p.y - e.y;
        const along = dx * e.dashX + dy * e.dashY;
        const across = dx * -e.dashY + dy * e.dashX;
        if (along > -10 && along < 170 && Math.abs(across) < 26) {
          const side = across >= 0 ? 1 : -1;
          ax += -e.dashY * side * 3; ay += e.dashX * side * 3;
          if (e.mode === 'dash' && along < 40) danger = true;
        }
      }
    }
    const l = Math.hypot(ax, ay) || 1;
    return { x: ax / l, y: ay / l, dash: r.dash || danger };
  };

  /* ---------- core-drawn telegraphs + enemy shots ---------- */
  C.pass('ground', (ctx, g, view) => {
    const t = view.rt;
    for (const e of g.enemies) {
      if (e.dying) continue;
      if (e.type === 'bomber' && e.armed) {
        // blast radius filling up
        const k = e.fuse;
        ctx.globalAlpha = 0.12 + 0.1 * Math.sin(t * 30);
        ctx.fillStyle = '#ff3b2f';
        ctx.beginPath(); ctx.ellipse(e.x, e.y, BLAST_R, BLAST_R * 0.8, 0, 0, TAU); ctx.fill();
        ctx.globalAlpha = 0.32;
        ctx.beginPath(); ctx.ellipse(e.x, e.y, BLAST_R * k, BLAST_R * 0.8 * k, 0, 0, TAU); ctx.fill();
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = '#ff3b2f'; ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 3]); ctx.lineDashOffset = -t * 20;
        ctx.beginPath(); ctx.ellipse(e.x, e.y, BLAST_R, BLAST_R * 0.8, 0, 0, TAU); ctx.stroke();
        ctx.setLineDash([]);
      } else if (e.type === 'charger' && e.mode === 'tele') {
        // charge lane: red band with bright edges and chevrons racing outwards
        const k = Math.min(1, e.modeT / 0.72);
        const L = 140 * (0.35 + 0.65 * U.ease.outQuad(Math.min(1, k * 2.2)));
        const hw = e.r * (0.75 + 0.35 * k);
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(Math.atan2(e.dashY, e.dashX));
        ctx.globalAlpha = 0.2 + 0.22 * k;
        ctx.fillStyle = '#ff2a1a';
        ctx.fillRect(0, -hw, L, hw * 2);
        ctx.globalAlpha = 0.55 + 0.4 * k;
        ctx.fillStyle = '#ff4a2a';
        ctx.fillRect(0, -hw - 1, L, 1.4); ctx.fillRect(0, hw - 0.4, L, 1.4);
        ctx.fillStyle = '#ffe9d6';
        for (let i = 0; i < 4; i++) {
          const x = ((t * 140 + i * 36) % (L - 8)) + 4;
          ctx.globalAlpha = (0.35 + 0.6 * k) * Math.min(1, (L - x) / 20);
          ctx.beginPath();
          ctx.moveTo(x, -hw * 0.6); ctx.lineTo(x + 6, 0); ctx.lineTo(x, hw * 0.6);
          ctx.lineTo(x - 3, hw * 0.6); ctx.lineTo(x + 3, 0); ctx.lineTo(x - 3, -hw * 0.6);
          ctx.closePath(); ctx.fill();
        }
        // arrow head
        ctx.globalAlpha = 0.5 + 0.5 * k;
        ctx.fillStyle = '#ff3b2f';
        ctx.beginPath(); ctx.moveTo(L + 12, 0); ctx.lineTo(L, -hw - 5); ctx.lineTo(L, hw + 5); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
    // shadows of flying shots
    if (g.eshots.length) {
      ctx.fillStyle = '#000';
      ctx.globalAlpha = 0.22;
      for (const s of g.eshots) { ctx.beginPath(); ctx.ellipse(s.x, s.y, s.r * 0.9, s.r * 0.45, 0, 0, TAU); ctx.fill(); }
    }
  });

  C.pass('top', (ctx, g, view, accent, st) => {
    const art = C.artFor(st);
    const drawShot = art && art.shot;
    for (const s of g.eshots) {
      if (drawShot) {
        try { ctx.globalAlpha = 1; drawShot.call(art, ctx, s, view, st); continue; } catch (err) { C.report('shot:' + st.id, err); art.shot = null; }
      }
      defaultShot(ctx, s, view);
    }
    ctx.globalAlpha = 1;
    // blast shockwave rings (in addition to the core 'blast' fill)
    for (const f of g.cfx) {
      if (f.kind !== 'boom') continue;
      const k = Math.min(1, f.t / f.life);
      ctx.globalAlpha = (1 - k) * 0.9;
      ctx.strokeStyle = f.hot ? '#ffd23f' : '#ffb347';
      ctx.lineWidth = 2.5 * (1 - k) + 0.5;
      const R = f.r * (0.4 + 0.9 * U.ease.outQuad(k));
      ctx.beginPath(); ctx.ellipse(f.x, f.y, R, R * 0.8, 0, 0, TAU); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });

  /** Fallback enemy shot: a glowing glob of fermented turnip juice. */
  function defaultShot(ctx, s, view) {
    const y = s.y - s.z;
    const pulse = 1 + 0.12 * Math.sin(view.rt * 18 + s.seed * 10);
    const r = s.r * pulse;
    if (view.pixel) {
      const q = view.ps || 1;
      const sx = Math.round(s.x / q) * q, sy = Math.round(y / q) * q;
      ctx.fillStyle = '#1d3a12'; ctx.fillRect(sx - r - q, sy - r + q, (r + q) * 2, (r - q) * 2); ctx.fillRect(sx - r + q, sy - r - q, (r - q) * 2, (r + q) * 2);
      ctx.fillStyle = '#7bd63a'; ctx.fillRect(sx - r, sy - r + q, r * 2, (r - q) * 2); ctx.fillRect(sx - r + q, sy - r, (r - q) * 2, r * 2);
      ctx.fillStyle = '#e6ff9a'; ctx.fillRect(sx - q * 1.5, sy - q * 1.5, q * 2, q * 2);
      return;
    }
    // trail
    const sl = Math.hypot(s.vx, s.vy) || 1;
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#9be34a';
    for (let i = 1; i <= 3; i++) {
      const tx = s.x - (s.vx / sl) * i * 4.5, ty = y - (s.vy / sl) * i * 4.5;
      ctx.beginPath(); ctx.arc(tx, ty, r * (1 - i * 0.22), 0, TAU); ctx.fill();
    }
    C.glow(ctx, s.x, y, r * 3.2, 'rgba(170,255,90,0.9)', 0.55);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#21401a';
    ctx.beginPath(); ctx.arc(s.x, y, r + 0.9, 0, TAU); ctx.fill();
    ctx.fillStyle = '#86dc3c';
    ctx.beginPath(); ctx.arc(s.x, y, r, 0, TAU); ctx.fill();
    ctx.fillStyle = '#efffb0';
    ctx.beginPath(); ctx.arc(s.x - r * 0.3, y - r * 0.3, r * 0.42, 0, TAU); ctx.fill();
  }
  C.defaultShot = defaultShot;

  /* ---------- fallback accessories (only while a style has no native art for the type) ---------- */
  const headY = (e, def) => e.y - (def.base === 'colossus' ? 46 : 24) * def.drawScale;
  DEFS.spitter.accessory = (ctx, e, view) => {
    const def = DEFS.spitter;
    const k = e.mode === 'aim' ? e.charge : e.spit * 0.6;
    const mx = e.x + e.facing * 6, my = e.y - 11 * def.drawScale;
    const r = 2 + k * 3.2;
    if (!view.pixel) C.glow(ctx, mx, my, 6 + k * 10, 'rgba(160,255,80,0.9)', 0.35 + k * 0.5);
    ctx.fillStyle = '#21401a';
    ctx.beginPath(); ctx.arc(mx, my, r + 0.8, 0, TAU); ctx.fill();
    ctx.fillStyle = k > 0.05 ? '#a6f04a' : '#5d9a2c';
    ctx.beginPath(); ctx.arc(mx, my, r, 0, TAU); ctx.fill();
    // leafy green crest so it reads differently from a plain creeper
    ctx.fillStyle = '#4f9a2a';
    const hy = headY(e, def);
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.ellipse(e.x + i * 3.2, hy - 2 - (i === 0 ? 2 : 0), 1.6, 4.2, i * 0.5, 0, TAU); ctx.fill();
    }
  };
  DEFS.bomber.accessory = (ctx, e, view) => {
    const def = DEFS.bomber;
    const hy = headY(e, def) + 1;
    const fx = e.x + e.facing * 1.5, tip = hy - 7;
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(e.x, hy + 2); ctx.quadraticCurveTo(fx + 3, hy - 3, fx, tip); ctx.stroke();
    const fast = e.armed ? 26 + e.fuse * 30 : 9;
    const on = Math.sin(view.rt * fast + e.seed * 20) > (e.armed ? -0.2 : 0.2);
    if (!view.pixel) C.glow(ctx, fx, tip, e.armed ? 11 : 6, 'rgba(255,200,80,1)', on ? 0.9 : 0.4);
    ctx.fillStyle = on ? '#fff6c0' : '#ffb347';
    ctx.beginPath(); ctx.arc(fx, tip, on ? 1.8 : 1.3, 0, TAU); ctx.fill();
    if (e.armed && on) {
      ctx.globalAlpha = 0.35 + e.fuse * 0.3;
      ctx.fillStyle = '#ff3b2f';
      ctx.beginPath(); ctx.ellipse(e.x, e.y - 10 * def.drawScale, 9, 10, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }
  };
  DEFS.charger.accessory = (ctx, e) => {
    const def = DEFS.charger;
    const hy = headY(e, def) + 4;
    ctx.fillStyle = '#efe2c4'; ctx.strokeStyle = '#3b2a1c'; ctx.lineWidth = 0.9;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(e.x + s * 3, hy);
      ctx.quadraticCurveTo(e.x + s * 12, hy - 2, e.x + s * 10, hy - 10);
      ctx.quadraticCurveTo(e.x + s * 8, hy - 4, e.x + s * 2, hy - 3);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    if (e.mode === 'tele' || e.mode === 'dash') {
      ctx.fillStyle = '#ff3b2f';
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(e.x + s * 3 + e.facing * 2, hy + 6, 1.5, 0, TAU); ctx.fill(); }
    }
    if (e.mode === 'rest') {
      ctx.fillStyle = '#ffe08a';
      for (let i = 0; i < 3; i++) {
        const a = e.modeT * 6 + (i / 3) * TAU;
        ctx.beginPath(); ctx.arc(e.x + Math.cos(a) * 8, hy - 6 + Math.sin(a) * 2.5, 1.4, 0, TAU); ctx.fill();
      }
    }
  };
  DEFS.mother.accessory = (ctx, e, view) => {
    const def = DEFS.mother;
    const hy = headY(e, def) + 6;
    // a little crown of sprouting baby turnips
    for (let i = -1; i <= 1; i++) {
      const x = e.x + i * 7, y = hy - (i === 0 ? 3 : 0) + Math.sin(view.rt * 4 + i) * 0.6;
      ctx.fillStyle = '#4f9a2a';
      ctx.beginPath(); ctx.ellipse(x, y - 5, 1.3, 3, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#b48cd6';
      ctx.beginPath(); ctx.arc(x, y, 2.6, 0, TAU); ctx.fill();
      ctx.fillStyle = '#f2e6c8';
      ctx.beginPath(); ctx.arc(x, y + 1.2, 1.6, 0, Math.PI); ctx.fill();
    }
    if (e.birth > 0 && !view.pixel) C.glow(ctx, e.x, e.y - 18, 26, 'rgba(200,160,255,0.9)', e.birth * 0.5);
  };
})();
