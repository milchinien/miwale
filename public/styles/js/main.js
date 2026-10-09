/* Boot, input, game loop, style switching and the headless screenshot mode. */
(function () {
  'use strict';
  const U = window.U;
  const params = new URLSearchParams(location.search);
  const SHOT = params.has('shot');
  if (SHOT && params.has('vw')) { window.__forceW = +params.get('vw'); window.__forceH = +params.get('vh'); }
  const errors = [];

  window.__reportError = function (e) {
    const msg = (e && (e.stack || e.message)) || String(e);
    if (errors.length < 20) errors.push(msg);
    const pre = document.getElementById('errors');
    if (pre) { pre.textContent = errors.join('\n\n'); pre.style.display = 'block'; }
  };
  window.addEventListener('error', (ev) => window.__reportError(ev.error || ev.message));
  window.addEventListener('unhandledrejection', (ev) => window.__reportError(ev.reason));

  const canvas = document.getElementById('game');
  const seed = params.has('seed') ? +params.get('seed') : SHOT ? 1234 : undefined;
  const game = new window.Game({ seed });
  const renderer = new window.Renderer(canvas);
  const hud = new window.Hud(game);
  let style = null;
  let autoOn = SHOT || params.has('auto');
  let paused = false;

  /* ---------- style switching ---------- */
  const loadedFonts = new Set();
  function loadFonts(st) {
    for (const f of st.fonts || []) {
      if (loadedFonts.has(f)) continue;
      loadedFonts.add(f);
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = f.startsWith('http') ? f : 'https://fonts.googleapis.com/css2?family=' + f + '&display=swap';
      document.head.appendChild(link);
    }
  }
  function setStyle(id) {
    const list = window.Styles.visible();
    const st = window.Styles.byId[id] || list[0] || window.Styles.list[0];
    if (!st) return;
    if (style) document.body.classList.remove('style-' + style.id);
    style = st;
    document.body.classList.add('style-' + st.id);
    document.body.classList.toggle('pixel', !!st.pixelArt);
    let tag = document.getElementById('style-css');
    if (!tag) { tag = document.createElement('style'); tag.id = 'style-css'; document.head.appendChild(tag); }
    tag.textContent = st.css || '';
    loadFonts(st);
    if (!st._inited) {
      try { st.init && st.init(); } catch (e) { console.error(e); window.__reportError(e); }
      st._inited = true;
    }
    game.hooks = st;
    renderer.setStyle(st, game);
    renderer.snapCamera(game);
    hud.setStyle(st);
    const url = new URL(location.href);
    url.searchParams.set('style', st.id);
    if (!SHOT) history.replaceState(null, '', url);
    renderMenu();
  }
  function cycle(d) {
    const list = window.Styles.visible();
    const i = Math.max(0, list.indexOf(style));
    setStyle(list[(i + d + list.length) % list.length].id);
  }

  /* ---------- style menu ---------- */
  const menu = document.getElementById('stylemenu');
  function renderMenu() {
    if (!menu) return;
    menu.innerHTML = '';
    window.Styles.visible().forEach((s, i) => {
      const b = document.createElement('button');
      b.className = 'sm-item' + (s === style ? ' active' : '');
      b.innerHTML = '<span class="sm-num"></span><span class="sm-name"></span><span class="sm-fam"></span>';
      b.querySelector('.sm-num').textContent = i + 1;
      b.querySelector('.sm-name').textContent = s.name;
      const ef = window.StyleEffort && window.StyleEffort[s.id];
      b.querySelector('.sm-fam').textContent = (s.family || '') + (ef ? '  ·  Aufwand ' + window.StyleEffort.render(ef.stars) + ' ' + ef.stars + '/10' : '');
      if (ef) b.title = 'Ausbau-Aufwand für Claude: ' + ef.stars + '/10 – ' + ef.why;
      b.onclick = () => { setStyle(s.id); menu.classList.add('hidden'); };
      menu.appendChild(b);
    });
  }
  document.querySelector('#stylebar .style-name').addEventListener('click', () => menu.classList.toggle('hidden'));

  /* ---------- input ---------- */
  const keys = new Set();
  let dashPressed = false;
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'tab'].includes(k)) e.preventDefault();
    if (e.repeat) return;
    keys.add(k);
    if (k === ' ' || k === 'shift') dashPressed = true;
    if (game.state === 'levelup' && ['1', '2', '3'].includes(k)) { game.choose(+k - 1); return; }
    if (k === 'q') cycle(-1);
    else if (k === 'e') cycle(1);
    else if (k === 'tab') menu.classList.toggle('hidden');
    else if (k === 'r') { game.seed = (Math.random() * 1e9) | 0; game.reset(); renderer.snapCamera(game); }
    else if (k === 'b') autoOn = !autoOn;
    else if (k === 'p' || k === 'escape') paused = !paused;
    else if (k === 'h') document.body.classList.toggle('nohud');
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => keys.clear());
  function readInput() {
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
  let acc = 0, last = performance.now(), autoPickT = 0;
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!paused) {
      acc += dt;
      let steps = 0;
      while (acc >= STEP && steps < 6) {
        game.update(STEP, readInput());
        acc -= STEP;
        steps++;
      }
      if (game.state === 'levelup' && autoOn) {
        autoPickT += dt;
        if (autoPickT > 0.8) { autoPickT = 0; game.choose((Math.random() * 3) | 0); }
      }
      if (game.state === 'dead' && autoOn) {
        autoPickT += dt;
        if (autoPickT > 2.5) { autoPickT = 0; game.reset(); renderer.snapCamera(game); }
      }
    }
    renderer.resize(game);
    renderer.render(game, paused ? 0 : dt, false);
    hud.update(autoOn);
    document.body.classList.toggle('paused', paused);
    requestAnimationFrame(frame);
  }

  /* ---------- screenshot mode: deterministic warm-up, one frame, no rAF ---------- */
  function shot() {
    const secs = +(params.get('t') || 35);
    const order = ['lantern', 'multi', 'rate', 'lantern', 'dmg', 'bounce', 'speed', 'hp', 'magnet'];
    let picks = 0;
    const t0 = performance.now();
    for (let i = 0; i < secs * 60; i++) {
      game.update(STEP, window.GameData.autopilot(game));
      if (game.state === 'levelup') {
        const want = order[picks % order.length];
        let idx = game.choices.findIndex((c) => c.id === want);
        if (idx < 0) idx = 0;
        game.choose(idx);
        picks++;
      }
      if (game.state === 'dead') { game.player.hp = game.player.maxHp; game.state = 'play'; }
    }
    // keep the player alive and healthy-looking for the picture
    game.player.hp = Math.max(game.player.hp, game.player.maxHp * 0.7);
    const simMs = performance.now() - t0;
    renderer.snapCamera(game);
    renderer.resize(game, true);
    const t1 = performance.now();
    renderer.render(game, 1 / 60, true);
    // a few extra frames so particles/animations look natural
    for (let i = 0; i < 3; i++) { game.update(STEP, window.GameData.autopilot(game)); renderer.render(game, 1 / 60, true); }
    // a still image should not catch an enemy mid hit-flash (reads like a white blob) – flashes are a motion effect
    for (const e of game.enemies) e.flash = 0;
    renderer.render(game, 1 / 60, true);
    const renderMs = performance.now() - t1;
    if (params.has('levelup')) { game.openLevelUp(); }
    if (params.has('map')) renderMap();
    hud.update(false);
    const diag = {
      style: style && style.id, errors, simMs: Math.round(simMs), firstRenderMs: Math.round(renderMs),
      chunksBuilt: renderer.chunks.built, chunkBuildMsTotal: Math.round(renderer.chunks.buildMs),
      chunkBuildMsAvg: +(renderer.chunks.buildMs / Math.max(1, renderer.chunks.built)).toFixed(1),
      enemies: game.enemies.length, particles: game.particles.length, level: game.level,
      canvas: renderer.tW + 'x' + renderer.tH, S: +renderer.S.toFixed(3),
    };
    const tag = document.createElement('script');
    tag.type = 'application/json';
    tag.id = 'diag';
    tag.textContent = JSON.stringify(diag);
    document.body.appendChild(tag);
    document.title = 'READY';
  }

  /* ---------- world map preview: ground of a ~3200x1800 world-unit area, scaled to the screen ---------- */
  function renderMap() {
    const ch = renderer.chunks, size = ch.size;
    const span = +(params.get('map') || 3200) || 3200;
    const spanY = span * renderer.dH / renderer.dW;
    const x0 = game.player.x - span / 2, y0 = game.player.y - spanY / 2;
    const k = renderer.dW / span;
    const d = renderer.dctx;
    d.setTransform(1, 0, 0, 1, 0, 0);
    d.imageSmoothingEnabled = true;
    d.fillStyle = '#000';
    d.fillRect(0, 0, renderer.dW, renderer.dH);
    for (let cy = Math.floor(y0 / size); cy <= Math.floor((y0 + spanY) / size); cy++) {
      for (let cx = Math.floor(x0 / size); cx <= Math.floor((x0 + span) / size); cx++) {
        const c = ch.get(cx, cy) || ch.build(cx, cy);
        const sx0 = Math.round((cx * size - x0) * k), sx1 = Math.round(((cx + 1) * size - x0) * k);
        const sy0 = Math.round((cy * size - y0) * k), sy1 = Math.round(((cy + 1) * size - y0) * k);
        d.drawImage(c.c, sx0, sy0, sx1 - sx0, sy1 - sy0);
      }
    }
    document.body.classList.add('nohud');
  }

  /* ---------- perf mode: synchronous benchmark (real time, used by tools/shot.mjs) ---------- */
  function perfBench() {
    window.__forceW = window.__forceW || 1600; window.__forceH = window.__forceH || 900;
    setStyle(params.get('style'));
    const tInit = performance.now();
    // warm up gameplay without rendering
    for (let i = 0; i < 45 * 60; i++) {
      game.update(STEP, window.GameData.autopilot(game));
      if (game.state === 'levelup') game.choose(0);
      if (game.state === 'dead') { game.player.hp = game.player.maxHp; game.state = 'play'; }
    }
    renderer.snapCamera(game);
    renderer.resize(game, true);
    const c0 = renderer.chunks.buildMs, n0 = renderer.chunks.built;
    const tFirst = performance.now();
    renderer.render(game, STEP, true);
    const firstFrame = performance.now() - tFirst;
    const chunkAvg = (renderer.chunks.buildMs - c0) / Math.max(1, renderer.chunks.built - n0);
    // steady-state frames (chunks already built)
    const frames = [];
    for (let i = 0; i < 60; i++) {
      game.update(STEP, window.GameData.autopilot(game));
      if (game.state === 'levelup') game.choose(0);
      const t = performance.now();
      renderer.render(game, STEP, false);
      frames.push(performance.now() - t);
    }
    frames.sort((a, b) => a - b);
    const diag = {
      style: style && style.id, errors,
      firstFrameMs: Math.round(firstFrame), chunkBuildMsAvg: +chunkAvg.toFixed(1), chunksBuilt: renderer.chunks.built - n0,
      frameMsMedian: +frames[30].toFixed(2), frameMsP95: +frames[57].toFixed(2),
      enemies: game.enemies.length, canvas: renderer.tW + 'x' + renderer.tH,
    };
    const tag = document.createElement('script');
    tag.type = 'application/json'; tag.id = 'perf';
    tag.textContent = JSON.stringify(diag);
    document.body.appendChild(tag);
  }

  /* ---------- boot ---------- */
  if (params.has('perf')) {
    try { perfBench(); } catch (e) { window.__reportError(e); }
    return;
  }
  window.addEventListener('load', () => {
    if (!window.Styles.list.length) {
      window.__reportError('Keine Styles registriert.');
      return;
    }
    setStyle(params.get('style'));
    if (SHOT) {
      document.body.classList.add('shot');
      const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
      Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1500))]).then(() => {
        // re-init icons once web fonts are there
        hud.setStyle(style);
        shot();
      });
    } else {
      requestAnimationFrame((t) => { last = t; frame(t); });
    }
  });

  window.__game = game;
  window.__renderer = renderer;
})();
