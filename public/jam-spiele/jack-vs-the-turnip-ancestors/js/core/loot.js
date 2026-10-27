/* LOOT – elite enemies + the pumpkin treasure chests they drop.
   Public API (stable): Loot.onSpawn(game,e) · onKill(game,e) · update(game,dt) · draw(ctx,game,view,accent,layer) · drop(game,x,y,opts)
   Elites: promoted at spawn (not in the first 18 s, ~one per 22-30 s during the waves, max 3 alive, none in the boss phase).
   Chests: pop out of the dead elite, wait for the player (never despawn), pickup => game.openChest(chest). */
(function () {
  'use strict';

  const TAU = Math.PI * 2;
  const POP_T = 0.6;          // drop animation length (s)
  const PICK_R = 18;          // pickup radius (world units)
  const MAX_CHESTS = 6;
  const MAX_ELITES = 3;
  const FIRST_ELITE_AT = 18;  // s of world time
  const OUTLINE = '#2a1205';

  const rnd = Math.random;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const settings = () => (window.Meta && window.Meta.settings) || {};
  const particleLevel = () => { const p = settings().particles; return p === undefined ? 2 : p; };

  /* ---------- per-game module state ---------- */
  function st(game) {
    let s = game._loot;
    if (!s) s = game._loot = { next: FIRST_ELITE_AT + rnd() * 4, spawned: 0, killed: 0, opened: 0, dropped: 0, lastWT: 0 };
    return s;
  }
  const clockOf = (game) => (game.mode === 'campaign' ? game.worldTime : game.time) || 0;
  const aliveElites = (game) => { let n = 0; for (const o of game.enemies) if (o.elite && !o.dying) n++; return n; };

  /* ---------- sprites (pre-rendered once) ---------- */
  const cache = {};
  function mk(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return { c, g: c.getContext('2d') };
  }
  function glowSprite(key, inner, outer) {
    if (cache[key]) return cache[key];
    const { c, g } = mk(96, 96);
    const gr = g.createRadialGradient(48, 48, 0, 48, 48, 48);
    gr.addColorStop(0, inner); gr.addColorStop(0.45, outer); gr.addColorStop(1, 'rgba(255,170,40,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 96, 96);
    return (cache[key] = c);
  }
  function beamSprite() {
    if (cache.beam) return cache.beam;
    const { c, g } = mk(32, 128);
    const v = g.createLinearGradient(0, 128, 0, 0);
    v.addColorStop(0, 'rgba(255,225,120,0.95)'); v.addColorStop(0.5, 'rgba(255,200,80,0.35)'); v.addColorStop(1, 'rgba(255,190,60,0)');
    g.fillStyle = v; g.fillRect(0, 0, 32, 128);
    g.globalCompositeOperation = 'destination-in';
    const h = g.createLinearGradient(0, 0, 32, 0);
    h.addColorStop(0, 'rgba(0,0,0,0)'); h.addColorStop(0.5, 'rgba(0,0,0,1)'); h.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = h; g.fillRect(0, 0, 32, 128);
    return (cache.beam = c);
  }
  function crownSprite() {
    if (cache.crown) return cache.crown;
    const { c, g } = mk(40, 30);
    g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(5, 24); g.lineTo(3, 8); g.lineTo(13, 15); g.lineTo(20, 4); g.lineTo(27, 15); g.lineTo(37, 8); g.lineTo(35, 24); g.closePath();
    g.fillStyle = '#ffcf3a'; g.fill();
    g.lineWidth = 3; g.strokeStyle = OUTLINE; g.stroke();
    g.fillStyle = '#fff3a8'; g.fillRect(8, 18, 24, 3);
    g.fillStyle = '#e8382a';
    g.beginPath(); g.arc(20, 14, 2.6, 0, TAU); g.fill();
    return (cache.crown = c);
  }
  function rr(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
    g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
  }
  /** pumpkin treasure chest, 72x64 px (4 px per world unit). variant 0/1 = different jack-o'-lantern faces */
  function chestSprite(rich, variant) {
    const key = 'chest' + (rich ? 'R' : 'N') + variant;
    if (cache[key]) return cache[key];
    const P = rich
      ? { body: '#f2b630', body2: '#ffe27a', rib: '#b8780f', lid: '#ffd24d', lid2: '#fff0a6', band: '#fff6c8', stem: '#8a5a16', glow: '#fffbe0', face: '#fff3b0' }
      : { body: '#e8741a', body2: '#ff9a3c', rib: '#a8470c', lid: '#f58a24', lid2: '#ffb25c', band: '#ffd24d', stem: '#5b7a2a', glow: '#ffd96a', face: '#ffe27a' };
    const { c, g } = mk(72, 64);
    g.lineJoin = 'round'; g.lineCap = 'round';
    const out = (w) => { g.lineWidth = w || 3; g.strokeStyle = OUTLINE; g.stroke(); };
    // body
    rr(g, 9, 30, 54, 28, 8);
    let gr = g.createLinearGradient(0, 30, 0, 58); gr.addColorStop(0, P.body2); gr.addColorStop(0.5, P.body); gr.addColorStop(1, P.rib);
    g.fillStyle = gr; g.fill(); out(3.2);
    // pumpkin ribs on the body
    g.save(); rr(g, 9, 30, 54, 28, 8); g.clip();
    g.strokeStyle = P.rib; g.lineWidth = 2; g.globalAlpha = 0.85;
    for (const rx of [22, 36, 50]) { g.beginPath(); g.moveTo(rx + (rx - 36) * 0.25, 30); g.quadraticCurveTo(rx + (rx - 36) * 0.55, 44, rx + (rx - 36) * 0.25, 58); g.stroke(); }
    g.restore();
    // glowing jack-o'-lantern face
    g.fillStyle = P.face; g.strokeStyle = OUTLINE; g.lineWidth = 2;
    const eye = (cx, cy, flip) => {
      g.beginPath();
      if (variant === 0) { g.moveTo(cx - 4.5, cy + 4); g.lineTo(cx + 4.5, cy + 4); g.lineTo(cx, cy - 4); }
      else { g.ellipse(cx, cy, 3.6, 4.4, flip * 0.3, 0, TAU); }
      g.closePath(); g.fill(); g.stroke();
    };
    eye(26, 44, -1); eye(46, 44, 1);
    g.beginPath();
    if (variant === 0) {
      g.moveTo(25, 50); g.lineTo(29, 55); g.lineTo(33, 51); g.lineTo(36, 55); g.lineTo(39, 51); g.lineTo(43, 55); g.lineTo(47, 50);
      g.quadraticCurveTo(36, 49, 25, 50);
    } else {
      g.moveTo(24, 50); g.quadraticCurveTo(36, 61, 48, 50); g.quadraticCurveTo(36, 54, 24, 50);
    }
    g.closePath(); g.fill(); g.stroke();
    // lid
    g.beginPath();
    g.moveTo(7, 35); g.lineTo(7, 28); g.quadraticCurveTo(8, 11, 36, 10); g.quadraticCurveTo(64, 11, 65, 28); g.lineTo(65, 35); g.closePath();
    gr = g.createLinearGradient(0, 10, 0, 35); gr.addColorStop(0, P.lid2); gr.addColorStop(0.55, P.lid); gr.addColorStop(1, P.body);
    g.fillStyle = gr; g.fill(); out(3.2);
    g.save(); g.clip();
    g.strokeStyle = P.rib; g.lineWidth = 2; g.globalAlpha = 0.7;
    for (const rx of [-1, 0, 1]) { g.beginPath(); g.moveTo(36 + rx * 11, 10); g.quadraticCurveTo(36 + rx * 22, 22, 36 + rx * 25, 36); g.stroke(); }
    g.globalAlpha = 0.55; g.fillStyle = '#fff'; g.beginPath(); g.ellipse(22, 19, 7, 2.6, -0.45, 0, TAU); g.fill();
    g.restore();
    // gold band between lid and body + lock
    rr(g, 5, 31, 62, 7, 3); g.fillStyle = P.band; g.fill(); out(2.6);
    rr(g, 31, 29, 10, 12, 3); g.fillStyle = rich ? '#ffffff' : '#ffe27a'; g.fill(); out(2.4);
    g.fillStyle = OUTLINE; g.beginPath(); g.arc(36, 34, 1.7, 0, TAU); g.fill(); g.fillRect(35.2, 34, 1.7, 4);
    // stem (green on normal, amber on rich) + little leaf
    g.beginPath(); g.moveTo(32, 12); g.quadraticCurveTo(33, 4, 36, 2); g.lineTo(41, 3); g.quadraticCurveTo(39, 8, 41, 12); g.closePath();
    g.fillStyle = P.stem; g.fill(); out(2.4);
    if (rich) { // gem on the lid
      g.beginPath(); g.moveTo(36, 17); g.lineTo(40, 22); g.lineTo(36, 27); g.lineTo(32, 22); g.closePath();
      g.fillStyle = '#ff4f5e'; g.fill(); out(2);
    }
    return (cache[key] = c);
  }
  function sparkleCross(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.28, y - s * 0.28); ctx.lineTo(x + s, y); ctx.lineTo(x + s * 0.28, y + s * 0.28);
    ctx.lineTo(x, y + s); ctx.lineTo(x - s * 0.28, y + s * 0.28); ctx.lineTo(x - s, y); ctx.lineTo(x - s * 0.28, y - s * 0.28);
    ctx.closePath(); ctx.fill();
  }

  /* ---------- chest height during the pop animation ---------- */
  function popHeight(t) {
    if (t >= POP_T) return 0;
    const k = t / POP_T;
    if (k < 0.72) return 34 * Math.sin((k / 0.72) * Math.PI);
    return 5 * Math.sin(((k - 0.72) / 0.28) * Math.PI);
  }

  const Loot = {
    /** maybe promote a freshly spawned enemy to an elite */
    onSpawn(game, e) {
      if (!e || e.boss || e.type === 'sprout') return;
      const s = st(game);
      const now = clockOf(game);
      if (game.phase !== 'waves' || now < FIRST_ELITE_AT) return;
      if (game.mode === 'campaign' && game.waveSeconds && now >= game.waveSeconds) return; // boss is spawned through spawnEnemy
      const colossus = e.type === 'colossus';
      let promote = false;
      if (now >= s.next) {
        if (aliveElites(game) < MAX_ELITES) promote = true;
        const tier = game.tier || 0;
        s.next = now + (22 + rnd() * 8) / (1 + Math.min(0.35, tier * 0.04));
      } else if (colossus && rnd() < 0.25 && aliveElites(game) < MAX_ELITES) promote = true;
      if (!promote) return;
      if (colossus) {
        e.elite = true; // already huge: no extra scaling
      } else {
        const sc = 1.35 + rnd() * 0.15;
        e.elite = true;
        e.scale = sc;
        e.r *= sc;
        e.hp = e.maxHp = e.hp * 6;
        e.dmg *= 1.3;
        e.xp *= 6;
        e.rutas = (e.rutas || 0.2) * 8;
        e.speed *= 0.92;
        e.mass *= 3;
      }
      e.eliteBorn = game.time;
      s.spawned++;
      game.addFx({ kind: 'ring', x: e.x, y: e.y, r0: 6, r1: 46, life: 0.7, color: 'gold' });
      game.burst(e.x, e.y, 10, { colors: ['#ffe27a', '#ffb347', '#ffffff'], speed: 70, life: 0.5, size: 2.2, z: 6 });
      game.signal('EliteSpawn', e);
    },

    /** elites (and 25 % of colossi, decided at spawn) drop a chest */
    onKill(game, e) {
      if (!e || e.boss || !e.elite) return;
      st(game).killed++;
      Loot.drop(game, e.x, e.y);
    },

    /** drop a chest at (x, y). opts: { rich } (boss reward chests are rich) */
    drop(game, x, y, opts) {
      const rich = !!(opts && opts.rich);
      const s = st(game);
      if (!game.chests) game.chests = [];
      while (game.chests.length >= MAX_CHESTS) game.chests.shift();
      const a = rnd() * TAU, d = 10 + rnd() * 12;
      const chest = {
        x, y, x0: x, y0: y, x1: x + Math.cos(a) * d, y1: y + Math.sin(a) * d * 0.7,
        t: 0, rich, id: game.nextId ? game.nextId++ : Math.floor(rnd() * 1e9),
        variant: rnd() < 0.5 ? 0 : 1, seed: rnd() * 10, landed: false,
      };
      game.chests.push(chest);
      s.dropped++;
      game.burst(x, y, rich ? 26 : 18, { colors: ['#ffd24d', '#fff3a8', '#ffb347', '#ffffff'], speed: 90, life: 0.7, size: 2.4, z: 8, vz: 60, grav: 160 });
      if (particleLevel() > 0) {
        const n = rich ? 10 : 6;
        for (let i = 0; i < n; i++) {
          const b = rnd() * TAU, sp = 30 + rnd() * 50;
          game.addParticle({ core: true, x, y, vx: Math.cos(b) * sp, vy: Math.sin(b) * sp * 0.6, z: 8, vz: 40 + rnd() * 50, grav: 180, life: 0.6 + rnd() * 0.4, size: 2.2, color: rnd() < 0.5 ? '#ffd24d' : '#fff3a8' });
        }
      }
      game.shake = Math.max(game.shake || 0, 2);
      game.signal('ChestDrop', chest);
      if (window.Sfx) { try { window.Sfx.play('levelup', { vol: 0.5 }); } catch (err) { /* ignore */ } }
      return chest;
    },

    /** every tick: reset elite timer for a new world, age chests, magnet + pickup */
    update(game, dt) {
      const s = st(game);
      const now = clockOf(game);
      if (now < 1 && s.lastWT >= 1) { s.next = FIRST_ELITE_AT + rnd() * 4; s.spawned = s.killed = s.opened = s.dropped = 0; }
      if (now < 1) s.next = Math.max(s.next, FIRST_ELITE_AT);
      s.lastWT = now;
      const list = game.chests;
      if (!list || !list.length) return;
      const p = game.player;
      const pull = ((game.stats && game.stats.magnet) || 0) * 0.6;
      for (let i = 0; i < list.length; i++) {
        const c = list[i];
        c.t += dt;
        if (c.t < POP_T) {
          const k = clamp(c.t / POP_T, 0, 1), e = 1 - (1 - k) * (1 - k);
          c.x = c.x0 + (c.x1 - c.x0) * e; c.y = c.y0 + (c.y1 - c.y0) * e;
          continue;
        }
        if (!c.landed) {
          c.landed = true;
          c.x = c.x1; c.y = c.y1;
          game.burst(c.x, c.y, 6, { colors: ['#ffd24d', '#fff3a8'], speed: 45, life: 0.4, size: 1.8, z: 2 });
        }
        if (game.state !== 'play') continue;
        const dx = p.x - c.x, dy = p.y - c.y, d = Math.hypot(dx, dy) || 1;
        if (d < PICK_R) {
          list.splice(i, 1);
          s.opened++;
          game.openChest(c);
          return; // the card overlay takes over; one chest per tick
        }
        if (pull > 0 && d < pull) {
          c.pull = Math.min(260, (c.pull || 40) + 420 * dt);
          const step = Math.min(d, c.pull * dt);
          c.x += (dx / d) * step; c.y += (dy / d) * step;
        }
      }
    },

    /** world-space drawing */
    draw(ctx, game, view, accent, layer) {
      const rt = view.rt || 0;
      const x0 = view.x0, x1 = view.x1, y0 = view.y0, y1 = view.y1;
      if (layer === 'ground') {
        const glow = glowSprite('glowGold', 'rgba(255,225,110,0.85)', 'rgba(255,170,40,0.35)');
        for (const e of game.enemies) {
          if (!e.elite || e.dying) continue;
          if (e.x < x0 - 70 || e.x > x1 + 70 || e.y < y0 - 70 || e.y > y1 + 70) continue;
          const pulse = 0.5 + 0.5 * Math.sin(rt * 4 + e.seed * 6);
          const age = game.time - (e.eliteBorn || 0);
          const flash = age < 0.9 ? 1 - age / 0.9 : 0;
          const R = e.r * 1.4 + pulse * 1.5, ry = R * 0.5;
          ctx.globalAlpha = clamp(0.5 + 0.2 * pulse + flash * 0.4, 0, 1);
          ctx.drawImage(glow, e.x - R * 1.5, e.y - ry * 1.7, R * 3, ry * 3.4);
          // dark under-stroke + golden ring: readable on bright and dark grounds
          ctx.globalAlpha = 0.55;
          ctx.strokeStyle = OUTLINE; ctx.lineWidth = 3.6;
          ctx.beginPath(); ctx.ellipse(e.x, e.y, R, ry, 0, 0, TAU); ctx.stroke();
          ctx.globalAlpha = clamp(0.75 + 0.25 * pulse + flash * 0.25, 0, 1);
          ctx.strokeStyle = '#ffd24d'; ctx.lineWidth = 2.3 + flash * 1.2;
          ctx.beginPath(); ctx.ellipse(e.x, e.y, R, ry, 0, 0, TAU); ctx.stroke();
          if (flash > 0) {
            const k = 1 - flash, R2 = R + k * 30;
            ctx.globalAlpha = flash * 0.9; ctx.strokeStyle = '#fff3a8'; ctx.lineWidth = 2.2;
            ctx.beginPath(); ctx.ellipse(e.x, e.y, R2, R2 * 0.5, 0, 0, TAU); ctx.stroke();
          }
        }
        ctx.globalAlpha = 0.9;
        for (const c of game.chests || []) {
          if (c.x < x0 - 30 || c.x > x1 + 30 || c.y < y0 - 30 || c.y > y1 + 30) continue;
          const h = popHeight(c.t), sh = 1 - h / 60;
          ctx.globalAlpha = 0.38 * sh;
          ctx.fillStyle = '#000';
          ctx.beginPath(); ctx.ellipse(c.x, c.y + 1, 11 * sh, 4 * sh, 0, 0, TAU); ctx.fill();
          if (c.t >= POP_T) { // faint gold pool of light
            ctx.globalAlpha = 0.5 + 0.2 * Math.sin(rt * 3 + c.seed);
            ctx.strokeStyle = c.rich ? '#fff3a8' : '#ffb347'; ctx.lineWidth = 1.4;
            ctx.beginPath(); ctx.ellipse(c.x, c.y + 1, 14, 5.4, 0, 0, TAU); ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
        return;
      }

      /* ---------------- 'top' layer ---------------- */
      const crown = crownSprite();
      for (const e of game.enemies) {
        if (!e.elite || e.dying) continue;
        if (e.x < x0 - 40 || e.x > x1 + 40 || e.y < y0 - 90 || e.y > y1 + 40) continue;
        const bob = Math.sin(rt * 4 + e.seed * 6) * 0.8;
        const top = e.y - e.r * (e.type === 'colossus' ? 2.3 : 2.45);
        ctx.globalAlpha = 1;
        ctx.drawImage(crown, e.x - 4.4, top - 7 + bob, 8.8, 6.6);
        if (e.hp < e.maxHp) {
          const w = Math.max(16, e.r * 1.7), f = clamp(e.hp / e.maxHp, 0, 1), by = top + 1;
          ctx.fillStyle = OUTLINE; ctx.fillRect(e.x - w / 2 - 1, by - 1, w + 2, 5);
          ctx.fillStyle = '#5a2a10'; ctx.fillRect(e.x - w / 2, by, w, 3);
          ctx.fillStyle = '#ffcf3a'; ctx.fillRect(e.x - w / 2, by, w * f, 3);
          ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(e.x - w / 2, by, w * f, 1);
        }
      }

      const chests = game.chests;
      if (!chests || !chests.length) return;
      const pl = particleLevel();
      const beam = beamSprite(), glowN = glowSprite('glowGold', 'rgba(255,225,110,0.85)', 'rgba(255,170,40,0.35)');
      for (const c of chests) {
        const inView = c.x >= x0 - 20 && c.x <= x1 + 20 && c.y >= y0 - 80 && c.y <= y1 + 20;
        if (!inView) continue;
        const h = popHeight(c.t), landed = c.t >= POP_T;
        const bob = landed ? Math.sin(rt * 2.4 + c.seed) * 1.1 : 0;
        const baseY = c.y - h - bob;
        const pulse = 0.5 + 0.5 * Math.sin(rt * 3 + c.seed);
        ctx.save();
        // light beam + glow (additive halo; the dark-outlined chest in front keeps it readable)
        if (landed) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = (c.rich ? 0.85 : 0.7) * (0.7 + 0.3 * pulse);
          ctx.drawImage(beam, c.x - 9, c.y - 100, 18, 100);
        }
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = (0.5 + 0.25 * pulse) * (c.rich ? 1 : 0.85);
        const gR = 22 + pulse * 3;
        ctx.drawImage(glowN, c.x - gR, baseY - 7 - gR * 0.8, gR * 2, gR * 1.6);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        // sprite (72x64 px = 18x16 units)
        const spr = chestSprite(c.rich, c.variant);
        const sq = landed ? 1 : 1 + 0.06 * Math.sin((c.t / POP_T) * Math.PI * 2);
        ctx.drawImage(spr, c.x - 11 * sq, baseY - 19, 22 * sq, 19.5);
        // sparkles
        if (landed && pl > 0) {
          const n = (c.rich ? 6 : 4) + (pl > 2 ? 2 : 0);
          ctx.fillStyle = c.rich ? '#ffffff' : '#fff3a8';
          for (let i = 0; i < n; i++) {
            const ph = (rt * 0.55 + i / n + c.seed * 0.37) % 1;
            const a = Math.sin(ph * Math.PI);
            ctx.globalAlpha = a;
            sparkleCross(ctx, c.x + Math.sin(ph * 5 + i * 2.1) * 8, baseY - 8 - ph * 42, 1.2 + a * 1.6);
          }
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      // off-screen arrows (chests only)
      const cx = view.x !== undefined ? view.x : (x0 + x1) / 2, cy = view.y !== undefined ? view.y : (y0 + y1) / 2;
      const mx = 16, hx = (x1 - x0) / 2 - mx, hy = (y1 - y0) / 2 - mx;
      for (const c of chests) {
        if (c.t < POP_T) continue;
        if (c.x >= x0 - 4 && c.x <= x1 + 4 && c.y >= y0 - 4 && c.y <= y1 + 4) continue;
        const dx = c.x - cx, dy = c.y - cy;
        const k = Math.min(hx / (Math.abs(dx) || 1e-6), hy / (Math.abs(dy) || 1e-6));
        const ax = cx + dx * k, ay = cy + dy * k, ang = Math.atan2(dy, dx);
        const pulse = 0.5 + 0.5 * Math.sin(rt * 5 + c.seed), s = 12 * (0.92 + 0.12 * pulse);
        ctx.save();
        ctx.translate(ax, ay); ctx.rotate(ang);
        ctx.beginPath();
        ctx.moveTo(s * 0.7, 0); ctx.lineTo(-s * 0.5, -s * 0.55); ctx.lineTo(-s * 0.2, 0); ctx.lineTo(-s * 0.5, s * 0.55); ctx.closePath();
        ctx.lineJoin = 'round';
        ctx.fillStyle = c.rich ? '#fff3a8' : '#ffb347';
        ctx.fill();
        ctx.lineWidth = 2.4; ctx.strokeStyle = OUTLINE; ctx.stroke();
        ctx.globalAlpha = 0.5 + 0.4 * pulse;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(s * 0.2, 0, 1.6, 0, TAU); ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    },
  };

  window.Loot = Loot;
})();
