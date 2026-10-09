/* Gameplay simulation – identical for every visual style. All units are world units (VIEW_H = 360 visible). */
(function () {
  'use strict';
  const U = window.U;

  const VIEW_H = 360;
  const RUN_SECONDS = 600; // 22:00 -> 00:00

  const ENEMY_TYPES = {
    creeper: { r: 9, hp: 16, speed: 36, dmg: 8, xp: 1, mass: 1, name: 'Rüben-Schleicher' },
    ghost: { r: 7, hp: 7, speed: 64, dmg: 5, xp: 1, mass: 0.6, name: 'Hungergeist' },
    colossus: { r: 17, hp: 120, speed: 22, dmg: 16, xp: 5, mass: 4, name: 'Steckrüben-Koloss' },
  };

  const UPGRADES = [
    { id: 'dmg', name: 'Scharfe Kerne', desc: '+30 % Schaden', apply: (g) => (g.stats.dmg *= 1.3) },
    { id: 'rate', name: 'Flinke Finger', desc: '+20 % Feuerrate', apply: (g) => (g.stats.rate *= 1.2) },
    { id: 'multi', name: 'Kürbis-Tasche', desc: '+1 Kern pro Salve', apply: (g) => (g.stats.multi += 1) },
    { id: 'bounce', name: 'Springkern', desc: 'Kerne prallen 1× öfter ab', apply: (g) => (g.stats.bounce += 1) },
    { id: 'lantern', name: 'Rüben-Laterne', desc: '+1 kreisende Laterne', apply: (g) => (g.stats.lanterns += 1) },
    { id: 'speed', name: 'Cinderella-Schuh', desc: '+12 % Lauftempo', apply: (g) => (g.stats.speed *= 1.12) },
    { id: 'magnet', name: 'Erntekorb', desc: '+50 % Sammelradius', apply: (g) => (g.stats.magnet *= 1.5) },
    {
      id: 'hp', name: 'Steckrüben-Eintopf', desc: '+20 Max-HP, volle Heilung',
      apply: (g) => { g.player.maxHp += 20; g.player.hp = g.player.maxHp; },
    },
  ];

  class Game {
    constructor(opts = {}) {
      this.seed = opts.seed !== undefined ? opts.seed : (Math.random() * 1e9) | 0;
      this.hooks = {};
      this.viewW = 640;
      this.viewH = VIEW_H;
      this.reset();
    }

    reset() {
      this.rng = U.rng(this.seed);
      this.time = 0;
      this.kills = 0;
      this.level = 1;
      this.xp = 0;
      this.xpNext = 5;
      this.state = 'play';
      this.choices = null;
      this.pendingLevels = 0;
      this.shake = 0;
      this.nextId = 1;
      this.player = {
        kind: 'player', x: 0, y: 0, vx: 0, vy: 0, r: 9,
        hp: 100, maxHp: 100, facing: 1, moving: false, anim: 0, dir: 0, aim: 0,
        iframes: 0, hurtT: 0, dashT: 0, dashCd: 0, dashX: 1, dashY: 0, shootT: 0, levelT: 0,
      };
      this.stats = { dmg: 10, rate: 1.8, multi: 1, bounce: 1, lanterns: 0, speed: 92, magnet: 46, projSpeed: 250, range: 230 };
      this.enemies = [];
      this.projectiles = [];
      this.orbitals = [];
      this.gems = [];
      this.particles = [];
      this.numbers = [];
      this.spawnAcc = 0;
      this.fireT = 0.3;
      this.swarmT = 30;
      this.grid = new Map();
    }

    get clockText() {
      const mins = Math.min(120, (this.time / RUN_SECONDS) * 120);
      const h = mins >= 120 ? 0 : 22 + Math.floor(mins / 60);
      const m = Math.floor(mins % 60);
      return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    }
    get runProgress() { return Math.min(1, this.time / RUN_SECONDS); }

    /* ---------- helpers ---------- */
    emit(name, a, b) {
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
      this.particles.push(p);
      return p;
    }
    burst(x, y, n, opts = {}) {
      const colors = opts.colors || ['#ffffff'];
      for (let i = 0; i < n; i++) {
        const a = Math.random() * U.TAU, s = (opts.speed || 60) * (0.4 + Math.random() * 0.8);
        this.addParticle({
          x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7,
          z: opts.z || 4, vz: opts.vz !== undefined ? opts.vz * (0.5 + Math.random()) : 0,
          grav: opts.grav || 0, life: (opts.life || 0.5) * (0.6 + Math.random() * 0.6),
          size: (opts.size || 2) * (0.6 + Math.random() * 0.8), color: colors[(Math.random() * colors.length) | 0],
          kind: opts.kind || 'spark', drag: opts.drag, vr: (Math.random() - 0.5) * 10,
        });
      }
    }
    number(x, y, value, crit) {
      if (this.numbers.length > 80) this.numbers.shift();
      this.numbers.push({ x: x + (Math.random() - 0.5) * 6, y: y - 10, value: Math.round(value), crit: !!crit, life: 0.75, max: 0.75, seed: Math.random() });
    }
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
      const hpScale = 1 + this.time / 150;
      const e = {
        kind: 'enemy', id: this.nextId++, type, x, y, r: T.r, hp: T.hp * hpScale, maxHp: T.hp * hpScale,
        speed: T.speed * (0.9 + this.rng.next() * 0.2), dmg: T.dmg, xp: T.xp, mass: T.mass,
        vx: 0, vy: 0, kx: 0, ky: 0, flash: 0, facing: 1, anim: this.rng.next() * 10, spawnT: 0,
        seed: this.rng.next(), dying: false, deathT: 0, lanternCd: 0, hitT: 0,
      };
      this.enemies.push(e);
      return e;
    }
    spawnRingPos(extra = 30) {
      const a = this.rng.next() * U.TAU;
      const rx = this.viewW / 2 + extra, ry = this.viewH / 2 + extra;
      return { x: this.player.x + Math.cos(a) * rx * 1.05, y: this.player.y + Math.sin(a) * ry * 1.15, a };
    }
    updateSpawning(dt) {
      const t = this.time;
      const alive = this.enemies.length;
      const cap = Math.min(320, 80 + t * 2.2);
      const rate = 2.2 + t * 0.075;
      this.spawnAcc += rate * dt;
      while (this.spawnAcc >= 1) {
        this.spawnAcc -= 1;
        if (alive >= cap) break;
        const r = this.rng.next();
        let type = 'creeper';
        if (t > 22 && r < 0.07) type = 'colossus';
        else if (t > 8 && r < 0.42) type = 'ghost';
        const p = this.spawnRingPos();
        this.spawnEnemy(type, p.x, p.y);
      }
      this.swarmT -= dt;
      if (this.swarmT <= 0) {
        this.swarmT = 24;
        const p = this.spawnRingPos(10);
        const n = 10 + Math.floor(t / 20);
        for (let i = 0; i < n; i++) {
          this.spawnEnemy('ghost', p.x + (this.rng.next() - 0.5) * 70, p.y + (this.rng.next() - 0.5) * 70);
        }
      }
    }

    /* ---------- damage ---------- */
    damageEnemy(e, dmg, kx, ky, src) {
      if (e.dying) return;
      const crit = this.rng.next() < 0.12;
      if (crit) dmg *= 2;
      e.hp -= dmg;
      e.flash = 1;
      e.hitT = 0;
      const kb = 140 / e.mass;
      e.kx += kx * kb; e.ky += ky * kb;
      this.number(e.x, e.y - e.r, dmg, crit);
      if (!this.emit('Hit', e, src)) this.burst(e.x, e.y, 3, { colors: ['#ffffff', '#ffd27a'], speed: 50, life: 0.25, size: 1.5 });
      if (e.hp <= 0) this.killEnemy(e);
    }
    killEnemy(e) {
      e.dying = true;
      e.deathT = 0;
      this.kills++;
      const big = e.xp >= 5;
      this.gems.push({
        kind: 'gem', x: e.x, y: e.y, value: e.xp, big, seed: Math.random(), t: 0, fly: false, vx: 0, vy: 0,
        pop: 1,
      });
      if (!this.emit('Kill', e)) this.burst(e.x, e.y, 8, { colors: ['#e8d9ff', '#9b6bd1', '#ffffff'], speed: 70, life: 0.45, size: 2 });
      if (e.type === 'colossus') this.shake = Math.max(this.shake, 4);
    }
    hurtPlayer(dmg, src) {
      const p = this.player;
      if (p.iframes > 0 || this.state !== 'play') return;
      p.hp -= dmg;
      p.iframes = 0.7;
      p.hurtT = 1;
      this.shake = Math.max(this.shake, 5);
      if (!this.emit('Hurt', p, src)) this.burst(p.x, p.y, 8, { colors: ['#ff5a3c', '#ffb36b'], speed: 70, life: 0.35 });
      if (p.hp <= 0) {
        p.hp = 0;
        this.state = 'dead';
        this.emit('Death', p);
      }
    }

    /* ---------- level ups ---------- */
    gainXp(v) {
      this.xp += v;
      while (this.xp >= this.xpNext) {
        this.xp -= this.xpNext;
        this.level++;
        this.xpNext = Math.round(5 + (this.level - 1) * 4 + Math.pow(this.level - 1, 1.6));
        this.pendingLevels++;
      }
      if (this.pendingLevels > 0 && this.state === 'play') this.openLevelUp();
    }
    openLevelUp() {
      this.pendingLevels--;
      const pool = UPGRADES.slice();
      const choices = [];
      while (choices.length < 3 && pool.length) choices.push(pool.splice((this.rng.next() * pool.length) | 0, 1)[0]);
      this.choices = choices;
      this.state = 'levelup';
      this.player.levelT = 1;
      this.emit('LevelUp', this.player);
    }
    choose(i) {
      if (this.state !== 'levelup' || !this.choices || !this.choices[i]) return;
      this.choices[i].apply(this);
      this.choices = null;
      this.state = 'play';
      this.player.iframes = Math.max(this.player.iframes, 0.6);
      if (this.pendingLevels > 0) this.openLevelUp();
    }

    /* ---------- main update ---------- */
    update(dt, input) {
      this.updateEffects(dt);
      if (this.state !== 'play') return;
      this.time += dt;
      const p = this.player, S = this.stats;

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
        p.dashCd = 1.4;
        p.iframes = Math.max(p.iframes, 0.25);
        this.emit('Dash', p);
      }
      let speed = S.speed;
      if (p.dashT > 0) {
        p.dashT -= dt;
        p.vx = p.dashX * speed * 3.4;
        p.vy = p.dashY * speed * 3.4;
        // head-bump: knock enemies away
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

      this.buildGrid();
      this.updateSpawning(dt);

      // weapon: pumpkin seed thrower
      this.fireT -= dt;
      if (this.fireT <= 0) {
        const target = this.nearestEnemy(p.x, p.y, S.range);
        if (target) {
          this.fireT += 1 / S.rate;
          const base = Math.atan2(target.y - p.y, target.x - p.x);
          p.aim = base;
          p.shootT = 1;
          for (let i = 0; i < S.multi; i++) {
            const a = base + (i - (S.multi - 1) / 2) * 0.2;
            const pr = {
              kind: 'proj', x: p.x + Math.cos(a) * 8, y: p.y - 4 + Math.sin(a) * 8,
              vx: Math.cos(a) * S.projSpeed, vy: Math.sin(a) * S.projSpeed, r: 3.5, angle: a,
              dmg: S.dmg, bounces: S.bounce, life: 1.1, age: 0, hit: new Set(), seed: Math.random(), spin: 0,
            };
            this.projectiles.push(pr);
            this.emit('Shoot', pr);
          }
        } else this.fireT = 0.05;
      }

      // projectiles
      for (const pr of this.projectiles) {
        pr.x += pr.vx * dt; pr.y += pr.vy * dt;
        pr.age += dt; pr.life -= dt; pr.spin += dt * 14;
        pr.angle = Math.atan2(pr.vy, pr.vx);
        if (pr.life <= 0) continue;
        let hitE = null;
        this.query(pr.x, pr.y, 24, (e) => {
          if (pr.hit.has(e.id) || e.spawnT < 0.3) return;
          if ((e.x - pr.x) ** 2 + (e.y - pr.y) ** 2 < (e.r + pr.r) ** 2) { hitE = e; return false; }
        });
        if (hitE) {
          pr.hit.add(hitE.id);
          const l = Math.hypot(pr.vx, pr.vy) || 1;
          this.damageEnemy(hitE, pr.dmg, pr.vx / l, pr.vy / l, 'seed');
          if (pr.bounces > 0) {
            pr.bounces--;
            const nt = this.nearestEnemy(pr.x, pr.y, 150, pr.hit);
            if (nt) {
              const a = Math.atan2(nt.y - pr.y, nt.x - pr.x);
              pr.vx = Math.cos(a) * S.projSpeed; pr.vy = Math.sin(a) * S.projSpeed;
              pr.life = Math.max(pr.life, 0.6);
            } else pr.life = 0;
          } else pr.life = 0;
        }
      }
      this.projectiles = this.projectiles.filter((pr) => pr.life > 0);

      // orbiting lanterns
      const n = S.lanterns;
      while (this.orbitals.length < n) this.orbitals.push({ kind: 'orbital', x: p.x, y: p.y, angle: 0, idx: this.orbitals.length, seed: Math.random() });
      for (let i = 0; i < this.orbitals.length; i++) {
        const o = this.orbitals[i];
        o.angle = this.time * 2.4 + (i / n) * U.TAU;
        o.x = p.x + Math.cos(o.angle) * 44;
        o.y = p.y + Math.sin(o.angle) * 44 * 0.85 - 4;
        this.query(o.x, o.y, 20, (e) => {
          if (e.lanternCd > 0 || e.spawnT < 0.3) return;
          if ((e.x - o.x) ** 2 + (e.y - o.y) ** 2 < (e.r + 8) ** 2) {
            e.lanternCd = 0.5;
            const d = Math.hypot(e.x - p.x, e.y - p.y) || 1;
            this.damageEnemy(e, S.dmg * 0.8, (e.x - p.x) / d, (e.y - p.y) / d, 'lantern');
          }
        });
      }

      // enemies
      for (const e of this.enemies) {
        if (e.dying) { e.deathT += dt / 0.35; continue; }
        e.spawnT = Math.min(1, e.spawnT + dt / 0.45);
        e.flash = Math.max(0, e.flash - dt * 7);
        e.hitT += dt;
        e.lanternCd = Math.max(0, e.lanternCd - dt);
        const dx = p.x - e.x, dy = p.y - e.y;
        const d = Math.hypot(dx, dy) || 1;
        // recycle enemies left far behind
        if (d > Math.max(this.viewW, this.viewH) * 1.3) {
          const q = this.spawnRingPos();
          e.x = q.x; e.y = q.y; e.spawnT = 0;
          continue;
        }
        let spd = e.spawnT < 1 ? 0 : e.speed;
        if (e.type === 'ghost') {
          // wavy approach
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
        e.anim += (Math.hypot(e.vx, e.vy) * dt) / 10;
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
    }

    updateEffects(dt) {
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
    }
  }

  /** Simple bot used for the screenshot mode and the "B" autopilot. */
  function autopilot(game) {
    const p = game.player;
    let ax = 0, ay = 0;
    for (const e of game.enemies) {
      if (e.dying) continue;
      const dx = p.x - e.x, dy = p.y - e.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > 140 * 140) continue;
      const d = Math.sqrt(d2) || 1;
      const w = (e.type === 'colossus' ? 2.2 : 1) / (d * d) * 900;
      ax += (dx / d) * w; ay += (dy / d) * w;
    }
    let near = null, nd = 1e9;
    for (const g of game.gems) {
      const d = (g.x - p.x) ** 2 + (g.y - p.y) ** 2;
      if (d < nd) { nd = d; near = g; }
    }
    if (near && nd < 220 * 220) {
      const d = Math.sqrt(nd) || 1;
      ax += ((near.x - p.x) / d) * 0.6; ay += ((near.y - p.y) / d) * 0.6;
    }
    const wa = game.time * 0.25;
    ax += Math.cos(wa) * 0.35; ay += Math.sin(wa) * 0.35;
    const l = Math.hypot(ax, ay) || 1;
    let close = false;
    for (const e of game.enemies) if (!e.dying && (e.x - p.x) ** 2 + (e.y - p.y) ** 2 < 26 * 26) close = true;
    return { x: ax / l, y: ay / l, dash: close };
  }

  window.Game = Game;
  window.GameData = { VIEW_H, RUN_SECONDS, ENEMY_TYPES, UPGRADES, autopilot };
})();
