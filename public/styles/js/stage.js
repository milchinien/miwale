/* Stage: shows the design elements of one style – or of a mix of styles – using the original style modules.
     ?style=<id>                          all elements from one style
     ?world=a&chars=b&props=c&fx=d&atmo=e&ui=f   mix: each element from another style (missing ones fall back to ?style)
     &view=scene|world|characters|props|effects|atmosphere|ui    (default: scene)
     &embed=1                             embedded in a library page
   The scene is a living diorama: the main character wanders, creatures roam, effects play. No game rules, no HUD. */
(function () {
  'use strict';
  const params = new URLSearchParams(location.search);
  const clean = (v) => (v || '').replace(/[^a-z0-9_-]/gi, '');
  const base = clean(params.get('style'));
  const LAYERS = ['world', 'chars', 'props', 'fx', 'atmo', 'ui'];
  const pick = {};
  for (const k of LAYERS) pick[k] = clean(params.get(k)) || base;
  const VIEWS = ['scene', 'world', 'characters', 'props', 'effects', 'atmosphere', 'ui'];
  const view = VIEWS.includes(params.get('view')) ? params.get('view') : 'scene';
  const errors = [];

  window.__reportError = function (e) {
    const msg = (e && (e.stack || e.message)) || String(e);
    if (errors.length < 20) errors.push(msg);
    const pre = document.getElementById('errors');
    if (pre && params.has('debug')) { pre.textContent = errors.join('\n\n'); pre.style.display = 'block'; }
  };
  window.addEventListener('error', (ev) => window.__reportError(ev.error || ev.message));
  document.body.classList.add('view-' + view);
  document.body.classList.toggle('embed', params.has('embed'));
  // ?shot: used by tools/shots-styles.mjs for the preview images – no hints, no labels' animation lag
  document.body.classList.toggle('shot', params.has('shot'));

  /* ---------- load the modules that are needed ---------- */
  const ids = [...new Set(LAYERS.map((k) => pick[k]).filter(Boolean))];
  if (!ids.length) { window.__reportError('No style given'); return; }
  let pending = ids.length;
  for (const id of ids) {
    const s = document.createElement('script');
    s.src = 'js/styles/' + id + '.js';
    s.onload = s.onerror = () => { if (--pending === 0) boot(); };
    document.body.appendChild(s);
  }

  function loadFonts(st) {
    for (const f of st.fonts || []) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = f.startsWith('http') ? f : 'https://fonts.googleapis.com/css2?family=' + f + '&display=swap';
      document.head.appendChild(link);
    }
  }

  /* ---------- composite style: every hook comes from the style chosen for its element ---------- */
  const HOOKS = {
    world: ['renderGroundChunk', 'drawGroundOverlay'],
    props: ['propsForChunk', 'drawProp'],
    chars: ['drawPlayer', 'drawEnemy', 'drawShadow'],
    fx: ['drawGem', 'drawProjectile', 'drawOrbital', 'drawParticle'],
    atmo: ['drawWorldOverlay', 'drawScreenOverlay', 'drawDisplayOverlay'],
    ui: ['drawIcon'],
  };
  const EVENTS = ['Hit', 'Kill', 'Hurt', 'Dash', 'Shoot', 'Pickup', 'LevelUp', 'Death'];
  const failed = new Set();
  function safe(src, name, fn) {
    return function () {
      try { return fn.apply(src, arguments); } catch (e) {
        const key = src.id + '.' + name;
        if (!failed.has(key)) { failed.add(key); window.__reportError(e); }
        return name === 'propsForChunk' ? [] : undefined;
      }
    };
  }
  /** A context that accepts every call and draws nothing – keeps transforms readable for code that reads them. */
  function silent(real) {
    const dummyGrad = { addColorStop() {} };
    return new Proxy({}, {
      get(t, k) {
        if (k in t) return t[k];
        if (k === 'canvas') return real.canvas;
        if (k === 'getTransform') return () => real.getTransform();
        if (k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createConicGradient' || k === 'createPattern') return () => dummyGrad;
        if (k === 'measureText') return (s) => real.measureText(s);
        if (k === 'getImageData') return (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)), width: w, height: h });
        if (k === 'isPointInPath') return () => false;
        return typeof real[k] === 'function' ? () => {} : real[k];
      },
      set(t, k, v) { t[k] = v; return true; },
    });
  }

  function composite(S) {
    const W = S.world;
    // pixel-art modules blit their sprites in art pixels, so as soon as an element is pixel art the whole mix
    // renders on that pixel grid (otherwise those sprites would shrink to a third on an HD world)
    const px = [S.chars, W, S.props, S.fx].find((st) => st.pixelArt);
    const mix = {
      id: 'mix', name: 'Mix',
      pixelArt: px ? px.pixelArt : false, groundColor: W.groundColor, groundResMax: W.groundResMax, chunkSize: W.chunkSize, groundNearest: W.groundNearest,
      css: S.ui.css, fonts: S.ui.fonts,
      drawNumber() {},
    };
    for (const layer in HOOKS) {
      const src = S[layer];
      for (const name of HOOKS[layer]) if (typeof src[name] === 'function') mix[name] = safe(src, name, src[name]);
    }
    // shadows belong to whoever owns the object: props get the props style's shadow, actors the characters style's
    const propShadow = typeof S.props.drawShadow === 'function' && safe(S.props, 'drawShadow', S.props.drawShadow);
    const actorShadow = mix.drawShadow;
    mix.drawShadow = function (ctx, o, v) {
      if (o.kind === 'prop') { if (propShadow) propShadow(ctx, o, v); } else if (actorShadow) actorShadow(ctx, o, v);
    };
    // drawGroundOverlay is where many modules prepare the frame (camera offsets for pixel blits, light maps,
    // mist, frame counters). Every style in use gets it called; it paints only where its part is on display,
    // otherwise it runs against a silent context so its preparation still happens.
    const used = [...new Set([S.world, S.atmo, S.chars, S.props, S.fx])].filter((st) => typeof st.drawGroundOverlay === 'function');
    const overlays = used.map((st) => ({ st, fn: safe(st, 'drawGroundOverlay', st.drawGroundOverlay) }));
    mix.groundShows = (st) => (st === S.world && ['scene', 'world', 'atmosphere', 'ui'].includes(view)) || (st === S.atmo && ['scene', 'atmosphere'].includes(view));
    mix.drawGroundOverlay = function (ctx, v, g) {
      for (const o of overlays) o.fn(mix.groundShows(o.st) ? ctx : silent(ctx), v, g);
    };
    // events: the character style may update its actors (squash, flash...), but only the effects style emits particles
    const mute = (game) => new Proxy(game, { get: (g, k) => (k === 'addParticle' || k === 'burst' ? () => null : g[k]) });
    for (const ev of EVENTS) {
      const fxFn = S.fx['on' + ev], chFn = S.chars !== S.fx && S.chars['on' + ev];
      if (!fxFn && !chFn) continue;
      mix['on' + ev] = function (game, a, b) {
        if (chFn) safe(S.chars, 'on' + ev, chFn)(mute(game), a, b);
        if (fxFn) safe(S.fx, 'on' + ev, fxFn)(game, a, b);
      };
    }
    return mix;
  }

  function boot() {
    const S = {};
    for (const k of LAYERS) {
      S[k] = window.Styles.byId[pick[k]];
      if (!S[k]) return window.__reportError('Unknown style "' + pick[k] + '"');
    }
    for (const id of ids) {
      const st = window.Styles.byId[id];
      try { st.init && st.init(); } catch (e) { window.__reportError(e); }
      st._inited = true;
    }
    const mix = composite(S);
    // isolate the element on display
    const flat = (ctx, info) => { ctx.fillStyle = mix.groundColor || '#222'; ctx.fillRect(info.wx, info.wy, info.size, info.size); };
    if (view !== 'scene' && view !== 'atmosphere' && view !== 'ui' && view !== 'world') mix.renderGroundChunk = flat;
    if (view !== 'scene' && view !== 'atmosphere') { delete mix.drawWorldOverlay; delete mix.drawScreenOverlay; delete mix.drawDisplayOverlay; }
    if (view === 'world' || view === 'ui') { mix.drawPlayer = () => {}; delete mix.drawShadow; mix.propsForChunk = () => []; }
    if (view === 'characters' || view === 'effects') mix.propsForChunk = () => [];

    document.body.classList.add('style-' + S.ui.id);
    document.body.classList.toggle('pixel', !!mix.pixelArt);
    const css = document.createElement('style');
    css.textContent = S.ui.css || '';
    document.head.appendChild(css);
    loadFonts(S.ui);

    const game = new window.Game({ seed: 4711 });
    const renderer = new window.Renderer(document.getElementById('game'));
    const hud = view === 'ui' ? new window.Hud(game) : null;
    game.hooks = mix;
    // element sheets are shown closer than the scene, so details read
    const ZOOM = { characters: 1.6, props: 1.3, effects: 1.5 }[view] || 1;
    if (ZOOM !== 1) {
      const resize = renderer.resize.bind(renderer);
      renderer.resize = function (g, force) {
        const before = this.lastKey;
        resize(g, force);
        if (this.lastKey === before && !force) return;
        // pixel styles are already integer-upscaled; zooming them would break the art-pixel grid
        if (this.pixel) return;
        this.S *= ZOOM;
        this.chunks.reset(this.pixel ? this.S : Math.min(this.S, this.style.groundResMax || 2.5));
        if (g) { g.viewW = this.tW / this.S; g.viewH = this.tH / this.S; }
      };
    }
    if (view === 'scene' || view === 'atmosphere') scene(game);
    else if (view === 'world') world(game);
    else if (view === 'ui') uiKit(game, S.ui);
    else sheet(game, mix, view);
    renderer.setStyle(mix, game);
    renderer.snapCamera(game);
    if (hud) {
      hud.setStyle(Object.assign({}, S.ui, { drawIcon: mix.drawIcon, name: 'Caption', family: 'UI kit' }));
      (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => uiKitIcons(hud));
      uiKitIcons(hud);
    }

    /* ---------- input: optional walking in the scene ---------- */
    const keys = new Set();
    let auto = true, lastKey = -1e9, paused = false, atmoOn = true;
    const atmoHooks = { drawWorldOverlay: mix.drawWorldOverlay, drawScreenOverlay: mix.drawScreenOverlay, drawDisplayOverlay: mix.drawDisplayOverlay };
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      keys.add(k);
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) { auto = false; lastKey = performance.now(); document.body.classList.add('walking'); }
    });
    window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => keys.clear());
    const toggle = document.getElementById('atmo-toggle');
    if (view === 'atmosphere' && toggle) {
      toggle.hidden = false;
      toggle.onclick = () => {
        atmoOn = !atmoOn;
        for (const k in atmoHooks) { if (atmoOn && atmoHooks[k]) mix[k] = atmoHooks[k]; else delete mix[k]; }
        toggle.textContent = atmoOn ? 'Atmosphere: on' : 'Atmosphere: off';
        toggle.setAttribute('aria-pressed', atmoOn);
      };
    }
    window.addEventListener('message', (ev) => {
      if (ev.origin !== location.origin || !ev.data) return;
      if (ev.data.stage === 'pause') paused = true;
      if (ev.data.stage === 'resume') paused = false;
    });
    function input() {
      if (!auto && !keys.size && performance.now() - lastKey > 15000) { auto = true; document.body.classList.remove('walking'); }
      if (auto) { const a = window.GameData.autopilot(game); a.dash = a.dash && Math.random() < 0.02; return a; }
      let x = 0, y = 0;
      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (keys.has('w') || keys.has('arrowup')) y -= 1;
      if (keys.has('s') || keys.has('arrowdown')) y += 1;
      return { x, y, dash: keys.has(' ') };
    }

    const STEP = 1 / 60;
    let acc = 0, last = performance.now();
    function frame(now) {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!paused && !document.hidden) {
        acc += dt;
        let steps = 0;
        while (acc >= STEP && steps < 6) { game.update(STEP, input()); acc -= STEP; steps++; }
        if (acc > STEP * 6) acc = 0;
        renderer.resize(game);
        if (sheetExtras.length) injectExtras(renderer);
        renderer.render(game, dt, false);
        placeLabels(renderer);
      }
      requestAnimationFrame(frame);
    }
    window.__stage = { game, renderer, mix, errors, pick, view, get settled() { return game.time > 6 && !renderer.chunks.job; } };
    requestAnimationFrame((t) => { last = t; frame(t); });
  }

  /* ---------- scene: the original simulation as a diorama ---------- */
  function scene(game) {
    // ?dense shows a crowded scene (preview image "Dense scene")
    const n = params.has('dense') ? 4 : 1;
    const CAST = { creeper: 9 * n, ghost: 5 * n, colossus: n };
    game.stats.lanterns = 2;
    game.updateSpawning = function () {
      const alive = { creeper: 0, ghost: 0, colossus: 0 };
      for (const e of this.enemies) if (!e.dying) alive[e.type]++;
      for (const type in CAST) if (alive[type] < CAST[type]) { const p = this.spawnRingPos(); this.spawnEnemy(type, p.x, p.y); return; }
    };
    const hurt = game.hurtPlayer.bind(game);
    game.hurtPlayer = function (dmg, src) { this.player.hp = this.player.maxHp; hurt(Math.min(dmg, 1), src); };
    const open = game.openLevelUp.bind(game);
    game.openLevelUp = function () { open(); this.choose(0); };
  }

  /* ---------- world: only the ground, the camera drifts across it ---------- */
  function world(game) {
    game.update = function (dt) {
      this.time += dt;
      const t = this.time * 0.07;
      this.player.x = Math.sin(t) * 420 + Math.sin(t * 2.3) * 90;
      this.player.y = Math.cos(t * 0.8) * 300;
    };
  }

  /* ---------- ui: the HUD parts as a kit, over the world of the UI style ---------- */
  function uiKit(game) {
    world(game);
    const set = (sel, text) => { const el = document.querySelector(sel); if (el) el.textContent = text; };
    game.player.hp = 72;
    game.xp = 6; game.xpNext = 10; game.level = 7; game.kills = 128;
    Object.defineProperty(game, 'clockText', { get: () => '12:30' });
    setTimeout(() => { set('#hud .clock-label', 'title'); set('#hud .lvl', '07'); }, 0);
    labels.push(['Bar', { css: '#hud .xp' }], ['Panel + bar', { css: '#hud .hp' }], ['Title', { css: '#hud .clock' }],
      ['Counter', { css: '#hud .kills' }], ['Cards', { css: '#levelup .lu-cards' }], ['Caption bar', { css: '#stylebar' }]);
  }
  function uiKitIcons(hud) {
    // the HUD draws its card panel only in its "cards" state – give it three neutral cards
    const g = hud.game;
    g.state = 'levelup';
    g.choices = [{ id: 'lantern', name: 'Card title', desc: 'Short card text' }, { id: 'multi', name: 'Second card', desc: 'Body copy in the card font' },
      { id: 'rate', name: 'Third card', desc: 'Icons are drawn by the style' }];
    hud.cardsFor = null;
    hud.update(false);
    document.querySelector('#levelup .lu-title').textContent = 'Panel title';
    document.querySelector('#levelup .lu-hint').textContent = 'Hint text';
  }

  /* ---------- element sheets: characters, props, effects ---------- */
  const labels = [];
  const sheetExtras = [];
  function injectExtras(renderer) {
    const ch = renderer.chunks && renderer.chunks.get(0, 0);
    if (!ch) return;
    if (!ch.__sheet) ch.__sheet = [];
    for (const x of sheetExtras) if (!ch.__sheet.includes(x)) { ch.__sheet.push(x); ch.props.push(x); }
  }

  function sheet(game, mix, which) {
    const p = game.player;
    p.x = 0; p.y = 0;
    const R = window.GameData.ENEMY_TYPES;
    const actor = (type, x, y, o) => {
      const e = game.spawnEnemy(type, x, y);
      e.anim = 0; e.spawnT = 5; e.facing = -1;
      return Object.assign(e, o || {});
    };
    const clone = (x, y, o) => Object.assign({}, p, { x, y, kind: 'player' }, o || {});
    const cast = {};
    let fxT = 0, beat = 0;
    const fire = (name, a, b) => game.emit(name, a, b);

    // the camera follows game.player: it becomes an invisible anchor in the middle of the sheet
    p.x = 0; p.y = 36;
    const draw = mix.drawPlayer;
    mix.drawPlayer = function (ctx, o, v) { if (o !== p && draw) draw(ctx, o, v); };
    const shadow = mix.drawShadow;
    if (shadow) mix.drawShadow = function (ctx, o, v) { if (o !== p) shadow(ctx, o, v); };
    if (which === 'characters') {
      cast.idle = clone(0, -20);
      cast.walk = clone(-170, -20, { moving: true });
      cast.dash = clone(-85, -20, { moving: true, dashT: 0.15, dashX: 1 });
      cast.hit = actor('creeper', 85, -20);
      cast.death = actor('ghost', 170, -20);
      cast.small = actor('creeper', -120, 100);
      cast.fast = actor('ghost', 0, 100);
      cast.large = actor('colossus', 120, 104);
      sheetExtras.push(cast.idle, cast.walk, cast.dash);
      labels.push(['Main character · idle', cast.idle, 14], ['Walk cycle', cast.walk, 14], ['Dash', cast.dash, 14],
        ['Small creature', cast.small, 14], ['Fast creature', cast.fast, 14], ['Large creature', cast.large, 14],
        ['Hit flash', cast.hit, 14], ['Dissolve', cast.death, 14]);
    }
    if (which === 'props') {
      // scan a few chunks of the props style and keep one prop of each kind
      const found = new Map();
      const orig = mix.propsForChunk;
      for (let cy = -3; cy <= 3 && found.size < 8; cy++) for (let cx = -3; cx <= 3 && found.size < 8; cx++) {
        const size = mix.chunkSize || 256;
        let list = [];
        try { list = orig({ cx, cy, wx: cx * size, wy: cy * size, size, res: 1, px: size }) || []; } catch (e) { /* ignore */ }
        for (const pr of list) {
          const key = String(pr.type || pr.t || pr.variant || pr.kind2 || 'prop');
          if (!found.has(key)) found.set(key, pr);
        }
      }
      mix.propsForChunk = () => [];
      const slots = [[-190, -40], [-60, -40], [70, -40], [190, -40], [-190, 110], [-60, 110], [70, 110], [190, 110]];
      [...found.entries()].slice(0, slots.length).forEach(([key, pr], i) => {
        const [x, y] = slots[i];
        const dx = x - pr.x, dy = y - pr.y;
        const c = Object.assign({}, pr, { x, y, sortY: y, kind: 'prop' });
        for (const k of ['x2', 'cx', 'tx']) if (typeof c[k] === 'number') c[k] += dx;
        for (const k of ['y2', 'cy', 'ty']) if (typeof c[k] === 'number') c[k] += dy;
        sheetExtras.push(c);
        labels.push([propLabel(key), c, 10]);
      });
    }
    if (which === 'effects') {
      game.gems.push(
        { kind: 'gem', x: -150, y: -60, value: 1, big: false, seed: 0.3, t: 0, fly: false, vx: 0, vy: 0, pop: 0 },
        { kind: 'gem', x: -100, y: -60, value: 5, big: true, seed: 0.7, t: 0, fly: false, vx: 0, vy: 0, pop: 0 });
      cast.proj = { kind: 'proj', x: 10, y: -64, vx: 250, vy: 0, r: 3.5, angle: 0, dmg: 10, bounces: 1, life: 1, age: 0.2, hit: new Set(), seed: 0.5, spin: 0 };
      game.projectiles.push(cast.proj);
      game.stats.lanterns = 2;
      labels.push(['Collectibles', { x: -125, y: -60 }, 14], ['Projectile', cast.proj, 18], ['Orbiting objects', { x: 140, y: -64 }, 30],
        ['Impact', { x: -150, y: 80 }, 24], ['Burst', { x: -50, y: 80 }, 24], ['Collect', { x: 50, y: 80 }, 24], ['Glow-up', { x: 150, y: 80 }, 24]);
    }

    game.update = function (dt) {
      this.updateEffects(dt);
      this.time += dt;
      p.moving = false;
      if (cast.idle) cast.idle.anim += dt * 0.3;
      if (cast.walk) { cast.walk.anim += dt * 9.2; cast.walk.facing = Math.sin(this.time * 0.5) > 0 ? 1 : -1; }
      if (cast.dash) { cast.dash.anim += dt * 9.2; cast.dash.dashT = 0.15; }
      for (const k of ['small', 'fast', 'large', 'hit']) {
        const e = cast[k];
        if (!e) continue;
        e.anim += dt * (k === 'fast' ? 6.4 : k === 'large' ? 2.2 : 3.6);
        e.hitT += dt;
      }
      if (cast.hit) {
        cast.hit.flash = Math.max(0, cast.hit.flash - dt * 7);
        if ((this.time % 1.2) < dt) { cast.hit.flash = 1; cast.hit.hitT = 0; }
      }
      if (cast.death) {
        const c = (this.time * 0.6) % 1.4;
        cast.death.deathT = c > 1 ? 0 : c;
        cast.death.dying = cast.death.deathT > 0;
      }
      for (const g of this.gems) g.t += dt;
      if (cast.proj) { cast.proj.spin += dt * 14; cast.proj.age = 0.2 + (this.time % 1) * 0.5; }
      const n = this.stats.lanterns;
      while (this.orbitals.length < n) this.orbitals.push({ kind: 'orbital', x: 0, y: 0, angle: 0, idx: this.orbitals.length, seed: Math.random() });
      this.orbitals.forEach((o, i) => {
        o.angle = this.time * 2.4 + (i / n) * Math.PI * 2;
        o.x = 140 + Math.cos(o.angle) * 26;
        o.y = -64 + Math.sin(o.angle) * 22 * 0.85;
      });
      if (which === 'effects') {
        // the four slots fire in turn, one every 0.3 s: each repeats every 1.2 s, so none sits empty for long
        // (impacts get two hits in a row – their particles live only a quarter second)
        fxT += dt;
        if (fxT > 0.3) {
          fxT = 0;
          beat++;
          const slot = beat % 4, x = -150 + slot * 100, y = 80;
          if (slot === 0) setTimeout(() => fire('Hit', { kind: 'enemy', type: 'creeper', x: x + 6, y: y - 4, r: R.creeper.r, xp: 1, mass: 1, seed: Math.random(), facing: 1, flash: 1, hitT: 0 }, 'proj'), 150);
          const dummy = { kind: 'enemy', type: ['creeper', 'ghost', 'colossus'][beat % 3], x, y, r: R.creeper.r, xp: 1, mass: 1, seed: Math.random(), facing: 1, flash: 1, hitT: 0 };
          if (slot === 0 && !fire('Hit', dummy, 'proj')) this.burst(x, y, 4, { colors: ['#ffffff', '#ffd27a'], speed: 50, life: 0.25, size: 1.5 });
          if (slot === 1 && !fire('Kill', dummy)) this.burst(x, y, 10, { colors: ['#ffffff', '#cccccc'], speed: 70, life: 0.45, size: 2 });
          if (slot === 2) fire('Pickup', { kind: 'gem', x, y, value: 1, big: true, seed: 0.5, t: 1 });
          if (slot === 3) fire('LevelUp', Object.assign({}, p, { x, y }));
        }
      }
      this.shake = 0;
    };
  }

  /** Readable names for the short prop type ids the modules use. */
  const PROP_NAMES = { mush: 'Mushrooms', pump: 'Pumpkin', pumpkin: 'Pumpkin', scare: 'Scarecrow', grave: 'Gravestone', stone: 'Stone', hay: 'Hay stack',
    lamp: 'Lamp', lantern: 'Lantern', celtic: 'Stone cross', deadtree: 'Bare tree', dead: 'Bare tree', flower: 'Flowers', flowers: 'Flowers', shroom: 'Mushrooms' };
  function propLabel(key) {
    const k = String(key).toLowerCase();
    const name = PROP_NAMES[k] || k.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  function placeLabels(renderer) {
    const box = document.getElementById('labels');
    if (!labels.length) return;
    if (box.children.length !== labels.length) {
      box.innerHTML = '';
      for (const l of labels) { const s = document.createElement('span'); s.textContent = l[0]; box.appendChild(s); }
    }
    const dpr = renderer.dW / innerWidth;
    const scale = (renderer.S * renderer.up) / dpr;
    labels.forEach((l, i) => {
      const el = box.children[i], o = l[1];
      let x, y;
      if (o.css) {
        const t = document.querySelector(o.css);
        if (!t) return;
        const r = t.getBoundingClientRect();
        x = r.left + r.width / 2; y = r.bottom + 4;
      } else {
        x = (o.x - renderer.camX) * scale + innerWidth / 2;
        y = (o.y + l[2] - renderer.camY) * scale + innerHeight / 2;
      }
      el.style.left = x.toFixed(1) + 'px';
      el.style.top = y.toFixed(1) + 'px';
    });
  }
})();
