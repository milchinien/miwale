/* Style sandbox: runs ONE original style module on the real game core, in two modes.
     ?style=<id>&mode=arena  – small endless arena: a few enemies, the hero can't die, level-ups apply themselves
     ?style=<id>&mode=sheet  – asset sheet: every actor, pickup and effect of the style side by side, labelled
   &embed=1 marks it as embedded in the library window (autopilot until the first key press). */
(function () {
  'use strict';
  const params = new URLSearchParams(location.search);
  const id = (params.get('style') || '').replace(/[^a-z0-9_-]/gi, '');
  const mode = params.get('mode') === 'sheet' ? 'sheet' : 'arena';
  const embed = params.has('embed');
  const errors = [];

  window.__reportError = function (e) {
    const msg = (e && (e.stack || e.message)) || String(e);
    if (errors.length < 20) errors.push(msg);
    const pre = document.getElementById('errors');
    if (pre) { pre.textContent = errors.join('\n\n'); pre.style.display = 'block'; }
  };
  window.addEventListener('error', (ev) => window.__reportError(ev.error || ev.message));
  document.body.classList.toggle('sheet', mode === 'sheet');
  document.body.classList.toggle('embed', embed);

  const script = document.createElement('script');
  script.src = 'js/styles/' + id + '.js';
  script.onerror = () => window.__reportError('Unknown style "' + id + '"');
  script.onload = boot;
  document.body.appendChild(script);

  function loadFonts(st) {
    for (const f of st.fonts || []) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = f.startsWith('http') ? f : 'https://fonts.googleapis.com/css2?family=' + f + '&display=swap';
      document.head.appendChild(link);
    }
  }

  function boot() {
    const st = window.Styles.byId[id];
    if (!st) return window.__reportError('Style "' + id + '" did not register');
    const game = new window.Game({ seed: 4711 });
    const renderer = new window.Renderer(document.getElementById('game'));
    const hud = new window.Hud(game);

    document.body.classList.add('style-' + st.id);
    document.body.classList.toggle('pixel', !!st.pixelArt);
    const css = document.createElement('style');
    css.textContent = st.css || '';
    document.head.appendChild(css);
    loadFonts(st);
    try { st.init && st.init(); } catch (e) { window.__reportError(e); }
    st._inited = true;
    game.hooks = st;
    if (mode === 'arena') arena(game);
    else sheet(game);
    renderer.setStyle(st, game);
    renderer.snapCamera(game);
    hud.setStyle(st);
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    fontsReady.then(() => hud.setStyle(st));

    /* ---------- input ---------- */
    const keys = new Set();
    let dashPressed = false, autoOn = true, lastKey = -1e9, paused = false;
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      if (e.repeat) return;
      keys.add(k);
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
        autoOn = false;
        lastKey = performance.now();
        document.body.classList.add('playing');
      }
      if (k === ' ' || k === 'shift') dashPressed = true;
      else if (k === 'b') autoOn = !autoOn;
      else if (k === 'h') document.body.classList.toggle('nohud');
      else if (k === 'p' || k === 'escape') paused = !paused;
    });
    window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => keys.clear());
    window.addEventListener('message', (ev) => {
      if (ev.origin !== location.origin || !ev.data) return;
      if (ev.data.sandbox === 'pause') paused = true;
      if (ev.data.sandbox === 'resume') paused = false;
    });
    function readInput() {
      // back to the autopilot after 20 s without keys, so an abandoned demo keeps moving
      if (!autoOn && !keys.size && performance.now() - lastKey > 20000) { autoOn = true; document.body.classList.remove('playing'); }
      if (autoOn) return window.GameData.autopilot(game);
      let x = 0, y = 0;
      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (keys.has('w') || keys.has('arrowup')) y -= 1;
      if (keys.has('s') || keys.has('arrowdown')) y += 1;
      const dash = dashPressed;
      dashPressed = false;
      return { x, y, dash };
    }

    /* ---------- loop ---------- */
    const STEP = 1 / 60;
    let acc = 0, last = performance.now();
    function frame(now) {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!paused && !document.hidden) {
        acc += dt;
        let steps = 0;
        while (acc >= STEP && steps < 6) {
          game.update(STEP, mode === 'arena' ? readInput() : null);
          acc -= STEP;
          steps++;
        }
        if (acc > STEP * 6) acc = 0;
        renderer.resize(game);
        if (mode === 'sheet') injectExtras(renderer);
        renderer.render(game, dt, false);
        if (mode === 'arena') hud.update(autoOn);
        else placeLabels(game, renderer);
      }
      requestAnimationFrame(frame);
    }
    window.__sandbox = { game, renderer, style: st, errors };
    requestAnimationFrame((t) => { last = t; frame(t); });
  }

  /* ---------- arena: the real simulation with a small, fixed cast ---------- */
  function arena(game) {
    const CAST = { creeper: 9, ghost: 5, colossus: 1 };
    game.stats.lanterns = 2;
    game.updateSpawning = function () {
      const alive = { creeper: 0, ghost: 0, colossus: 0 };
      for (const e of this.enemies) if (!e.dying) alive[e.type]++;
      for (const type in CAST) {
        if (alive[type] < CAST[type]) {
          const p = this.spawnRingPos();
          this.spawnEnemy(type, p.x, p.y);
          return; // one per step keeps the arrival staggered
        }
      }
    };
    const hurt = game.hurtPlayer.bind(game);
    game.hurtPlayer = function (dmg, src) {
      if (this.player.hp - dmg <= 0) this.player.hp = this.player.maxHp;
      hurt(dmg, src);
    };
    const open = game.openLevelUp.bind(game);
    game.openLevelUp = function () {
      open(); // fires the style's LevelUp effect
      this.choose((this.rng.next() * this.choices.length) | 0);
    };
  }

  /* ---------- asset sheet: frozen actors, effects replayed on a timer ---------- */
  const labels = [];
  // Hero clones and showcased props. They ride along in the prop list of the chunk at the origin, so the
  // renderer y-sorts and draws them (by kind) while style overlays that walk game.enemies never see them.
  const extras = [];
  function injectExtras(renderer) {
    const ch = renderer.chunks && renderer.chunks.get(0, 0);
    if (!ch) return;
    if (!ch.__sheet) { ch.__sheet = []; ch.props = ch.props.filter((pr) => !extras.includes(pr)); }
    for (const x of extras) if (!ch.__sheet.includes(x)) { ch.__sheet.push(x); ch.props.push(x); }
  }
  function sheet(game) {
    const R = window.GameData.ENEMY_TYPES;
    const p = game.player;
    p.x = 0; p.y = -8;
    const actor = (type, x, y, o) => {
      const e = game.spawnEnemy(type, x, y);
      e.anim = 0; e.spawnT = 5; e.facing = -1;
      Object.assign(e, o || {});
      return e;
    };
    const clone = (x, y, o) => Object.assign({}, p, { x, y, kind: 'player' }, o || {});
    const cast = {
      walk: clone(-150, -8, { moving: true }),
      dash: clone(-82, -8, { moving: true, dashT: 0.15, dashX: 1 }),
      creeper: actor('creeper', 88, -8),
      ghost: actor('ghost', 150, -8),
      colossus: actor('colossus', -120, 82),
      hit: actor('creeper', -40, 82),
      dying: actor('ghost', 30, 82),
    };
    // the clones are drawn through drawPlayer because their kind is 'player'
    extras.push(cast.walk, cast.dash);
    game.gems.push(
      { kind: 'gem', x: 86, y: 78, value: 1, big: false, seed: 0.3, t: 0, fly: false, vx: 0, vy: 0, pop: 0 },
      { kind: 'gem', x: 116, y: 78, value: 5, big: true, seed: 0.7, t: 0, fly: false, vx: 0, vy: 0, pop: 0 });
    const proj = { kind: 'proj', x: 166, y: 74, vx: 250, vy: 0, r: 3.5, angle: 0, dmg: 10, bounces: 1, life: 1, age: 0.2, hit: new Set(), seed: 0.5, spin: 0 };
    game.projectiles.push(proj);
    game.stats.lanterns = 2;

    // keep the sheet area free of scenery; collect a few distinct props to show in their own slots
    const st = game.hooks;
    const pool = new Map();
    const slots = [{ x: 150, y: 136 }, { x: -150, y: 136 }, { x: 0, y: 136 }];
    let placed = 0;
    if (st.propsForChunk) {
      const orig = st.propsForChunk.bind(st);
      st.propsForChunk = (info) => (orig(info) || []).filter((pr) => {
        const key = pr.type || pr.kind2 || pr.variant || 'prop';
        if (!pool.has(key) && pool.size < slots.length) pool.set(key, Object.assign({}, pr));
        return Math.abs(pr.x) > 230 || pr.y < -200 || pr.y > 230;
      });
    }

    labels.push(
      ['Hero · idle', p, 14], ['Hero · walk', cast.walk, 14], ['Hero · dash', cast.dash, 14],
      ['Small enemy', cast.creeper, 14], ['Fast enemy', cast.ghost, 14],
      ['Brute', cast.colossus, 14], ['Hit flash', cast.hit, 14], ['Death', cast.dying, 14],
      ['Pickups', { x: 101, y: 78 }, 14], ['Projectile', proj, 18], ['Orbiting item', { x: 0, y: -80 }, -14],
      ['Effects', { x: 0, y: -132 }, -14],
    );

    let fx = 0, beat = 0;
    const fire = (name, a, b, fallback) => { if (!game.emit(name, a, b)) fallback(); };
    game.update = function (dt) {
      this.updateEffects(dt);
      this.time += dt;
      fx += dt;
      // walk cycles and idle animation, at the speed the real game would produce
      p.moving = false; p.anim += dt * 0.3;
      cast.walk.anim += dt * 9.2;
      cast.dash.anim += dt * 9.2;
      cast.dash.dashT = 0.15;
      cast.walk.facing = Math.sin(this.time * 0.5) > 0 ? 1 : -1;
      for (const k of ['creeper', 'ghost', 'colossus', 'hit']) {
        const e = cast[k];
        e.anim += dt * (k === 'ghost' ? 6.4 : k === 'colossus' ? 2.2 : 3.6);
        e.hitT += dt;
      }
      cast.hit.flash = Math.max(0, cast.hit.flash - dt * 7);
      cast.dying.deathT = (this.time * 0.6) % 1.4 > 1 ? 0 : ((this.time * 0.6) % 1.4);
      cast.dying.dying = cast.dying.deathT > 0;
      for (const g of this.gems) { g.t += dt; }
      proj.spin += dt * 14; proj.age = 0.2 + (this.time % 1) * 0.5;
      // two lanterns circling a point above the hero
      const n = this.stats.lanterns;
      while (this.orbitals.length < n) this.orbitals.push({ kind: 'orbital', x: 0, y: 0, angle: 0, idx: this.orbitals.length, seed: Math.random() });
      this.orbitals.forEach((o, i) => {
        o.angle = this.time * 2.4 + (i / n) * Math.PI * 2;
        o.x = Math.cos(o.angle) * 26;
        o.y = -80 + Math.sin(o.angle) * 22 * 0.85;
      });
      // replay one effect after another along the top row
      if (fx > 0.9) {
        fx = 0;
        beat++;
        const ex = -150 + (beat % 5) * 75, ey = -132;
        const dummy = { kind: 'enemy', type: ['creeper', 'ghost', 'colossus'][beat % 3], x: ex, y: ey, r: R.creeper.r, xp: 1, mass: 1, seed: Math.random(), facing: 1 };
        const step = beat % 4;
        if (step === 0) fire('Hit', dummy, 'proj', () => this.burst(ex, ey, 3, { colors: ['#ffffff', '#ffd27a'], speed: 50, life: 0.25, size: 1.5 }));
        if (step === 1) fire('Kill', dummy, null, () => this.burst(ex, ey, 8, { colors: ['#e8d9ff', '#9b6bd1', '#ffffff'], speed: 70, life: 0.45, size: 2 }));
        if (step === 2) fire('Pickup', { kind: 'gem', x: ex, y: ey, value: 1, big: true, seed: 0.5, t: 1 }, null, () => {});
        if (step === 3) fire('LevelUp', Object.assign({}, p, { x: ex, y: ey }), null, () => {});
        if (beat % 2) {
          cast.hit.flash = 1; cast.hit.hitT = 0;
          fire('Hit', cast.hit, 'proj', () => this.burst(cast.hit.x, cast.hit.y, 3, { colors: ['#ffffff', '#ffd27a'], speed: 50, life: 0.25, size: 1.5 }));
        }
      }
      while (placed < pool.size) {
        const pr = [...pool.values()][placed];
        const s = slots[placed++];
        const dx = s.x - pr.x, dy = s.y - pr.y;
        pr.x = s.x; pr.y = s.y; pr.sortY = s.y; pr.kind = 'prop';
        // some props carry extra world positions (e.g. canopy points); move them along
        for (const k of ['x2', 'cx', 'tx']) if (typeof pr[k] === 'number') pr[k] += dx;
        for (const k of ['y2', 'cy', 'ty']) if (typeof pr[k] === 'number') pr[k] += dy;
        extras.push(pr);
        labels.push(['Prop', pr, 8]);
      }
      this.shake = 0;
    };
  }

  function placeLabels(game, renderer) {
    const box = document.getElementById('labels');
    if (box.children.length !== labels.length) {
      box.innerHTML = '';
      for (const l of labels) { const s = document.createElement('span'); s.textContent = l[0]; box.appendChild(s); }
    }
    const dpr = renderer.dW / innerWidth;
    const scale = (renderer.S * renderer.up) / dpr;
    labels.forEach((l, i) => {
      const o = l[1];
      const x = (o.x - renderer.camX) * scale + innerWidth / 2;
      const y = (o.y + l[2] - renderer.camY) * scale + innerHeight / 2;
      const el = box.children[i];
      el.style.left = x.toFixed(1) + 'px';
      el.style.top = y.toFixed(1) + 'px';
    });
  }
})();
