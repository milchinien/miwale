/* Jack vs. the Turnip Ancestors – app flow:
   main menu → save slot → hub (worlds, workshop, mastery, rarities, stats) → run (one evening: styles cross-fade
   afternoon → dusk → night, boss at midnight) → results → hub. */
(function () {
  'use strict';
  const U = window.U;
  const $ = (s) => document.querySelector(s);
  const params = new URLSearchParams(location.search);
  const errors = [];
  window.__reportError = function (e) {
    const msg = (e && (e.stack || e.message)) || String(e);
    if (errors.length < 20) errors.push(msg);
    const pre = document.getElementById('errors');
    if (pre && params.has('debug')) { pre.textContent = errors.join('\n\n'); pre.style.display = 'block'; }
    console.error(e);
  };
  window.addEventListener('error', (ev) => { if (ev.message !== 'Script error.') window.__reportError(ev.error || ev.message); });

  const S = window.Sfx || { play() {}, music() {}, unlock() {}, setMuted() {}, setVolume() {}, setMusicVolume() {}, setSfxVolume() {}, muted: false, worldMood: () => 'eerie' };
  const sfx = (n, o) => { try { S.play(n, o); } catch (e) {} };
  const music = (m) => { try { S.music(m); } catch (e) {} };
  const Meta = window.Meta, W = window.Worlds, GD = window.GameData;
  const STEP = 1 / 60;
  /* ---- extension points for the UI modules (js/ui/*.js) ---- */
  const App = window.App = {
    tabs: [],
    helpers: {},
    registerTab(id, label, order, render) { this.tabs.push({ id, label, order, render }); },
    popupQueue: [],
  };

  const game = new window.Game({ mode: 'campaign' });
  const R = [new window.Renderer(document.getElementById('game')), new window.Renderer(document.createElement('canvas'))];
  let ri = 0;
  const rend = () => R[ri];
  const hud = new window.Hud(game);
  hud.manageOverlays = false;
  let uiStyle = null;
  let worlds = [];
  let screen = 'main';
  let settingsBack = 'main';
  let mode = 'menu'; // 'menu' (attract demo behind the menus) | 'run'
  let paused = false;
  let busy = false;
  let run = null; // { wi, world, styleIdx, done }

  /* ================= styles: UI skin, renderer, cross-fade ================= */
  const loadedFonts = new Set();
  function loadFonts(st) {
    if (window.__LOCAL_FONTS) return; // release build ships the fonts itself
    for (const f of st.fonts || []) {
      if (loadedFonts.has(f)) continue;
      loadedFonts.add(f);
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = f.startsWith('http') ? f : 'https://fonts.googleapis.com/css2?family=' + f + '&display=swap';
      document.head.appendChild(link);
    }
  }
  function ensureInit(st) {
    if (st && !st._inited) {
      try { st.init && st.init(); } catch (e) { window.__reportError(e); }
      st._inited = true;
    }
  }
  function applyStyleUI(st) {
    if (uiStyle) document.body.classList.remove('style-' + uiStyle.id);
    uiStyle = st;
    document.body.classList.add('style-' + st.id);
    document.body.classList.toggle('pixel', !!st.pixelArt);
    let tag = document.getElementById('style-css');
    if (!tag) { tag = document.createElement('style'); tag.id = 'style-css'; document.head.appendChild(tag); }
    tag.textContent = st.css || '';
    loadFonts(st);
    game.hooks = st;
    hud.setStyle(st);
    hud.drawIcon($('#hud .rutas-icon'), 'rutabaga');
    hud.last = {};
  }
  function setStyleNow(id) {
    const st = window.Styles.byId[id];
    ensureInit(st);
    cancelFade();
    applyStyleUI(st);
    rend().setStyle(st, game);
    rend().snapCamera(game);
  }
  let fade = null;
  function beginFade(id) {
    const st = window.Styles.byId[id];
    if (!st) return;
    if (fade) completeFade();
    ensureInit(st);
    const sp = R[1 - ri];
    sp.setStyle(st, game);
    sp.snapCamera(game);
    fade = { st, sp, stage: 'warm', warmT: 0, t: 0, ui: false };
  }
  function tickFade(dt) {
    if (!fade) return;
    if (fade.stage === 'warm') {
      fade.warmT += dt;
      const missing = fade.sp.warm(game, 4);
      if (missing === 0 || fade.warmT > 4) { fade.stage = 'fade'; fade.t = 0; }
    } else {
      fade.t += dt;
      const k = fade.t / W.fadeSeconds;
      if (k >= 0.5 && !fade.ui) { applyStyleUI(fade.st); fade.ui = true; }
      if (k >= 1) completeFade();
    }
  }
  function completeFade() {
    if (!fade) return;
    const sp = fade.sp;
    if (!fade.ui) applyStyleUI(fade.st);
    const old = R[ri].display;
    sp.display.id = 'game';
    old.removeAttribute('id');
    old.replaceWith(sp.display);
    ri = 1 - ri;
    fade = null;
  }
  function cancelFade() { fade = null; }

  /* ================= helpers ================= */
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  function screenFade(on, dark) {
    const f = $('#fade');
    f.classList.toggle('dark', !!dark);
    f.classList.toggle('on', on);
  }
  let bannerT = 0;
  function banner(text, secs = 2.4) {
    const b = $('#banner');
    b.textContent = text;
    b.classList.remove('hidden');
    b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
    bannerT = secs;
  }
  function hideBanner() { bannerT = 0; $('#banner').classList.add('hidden'); }
  App.popup = function (title, text, iconId) {
    let box = $('#popups');
    if (!box) { box = document.createElement('div'); box.id = 'popups'; document.body.appendChild(box); }
    const d = el('div', 'popup');
    if (iconId) d.appendChild(iconCanvas(iconId, 48));
    const t = el('div', 'p-text'); t.appendChild(el('b', '', title)); t.appendChild(el('span', '', text || '')); d.appendChild(t);
    box.appendChild(d);
    sfx('levelup', { vol: 0.5 });
    setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 500); }, 4200);
  };
  let toastT = null;
  function toast(text) {
    let t = $('#toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
    t.textContent = text; t.style.display = '';
    clearTimeout(toastT); toastT = setTimeout(() => (t.style.display = 'none'), 2200);
  }
  const fmtTime = (s) => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60; return (h ? h + ' h ' : '') + m + ':' + String(sec).padStart(2, '0') + (h ? '' : ' min'); };
  const fmtNum = (n) => Math.round(n).toLocaleString('en-US');
  const styleName = (id) => (window.Styles.byId[id] || {}).name || id;

  // menu icons are drawn with one fixed, clean style (independent of the current world)
  let iconStyle = null;
  function menuIcon(canvas, id) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!iconStyle || !iconStyle.drawIcon) return;
    try { ctx.save(); iconStyle.drawIcon(ctx, id, canvas.width); ctx.restore(); } catch (e) { /* ignore */ }
  }
  function iconCanvas(id, size = 64) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    menuIcon(c, id);
    return c;
  }
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  /* ================= screens ================= */
  function showScreen(name) {
    screen = name;
    for (const id of ['mainmenu', 'slots', 'hub', 'settings', 'howto', 'credits', 'pause', 'build']) $('#' + id).classList.toggle('hidden', id !== (name === 'main' ? 'mainmenu' : name));
    document.body.classList.toggle('in-menu', mode === 'menu');
    if (name === 'slots') renderSlots();
    if (name === 'hub') renderHub();
    if (name === 'settings') renderSettings();
  }

  /* ---------- save slots ---------- */
  function renderSlots() {
    const grid = $('#slots .slot-grid');
    grid.innerHTML = '';
    for (let i = 0; i < Meta.SLOTS; i++) {
      const d = Meta.peek(i);
      const c = el('div', 'slot-card');
      c.appendChild(el('div', 's-num', 'SPEICHERPLATZ ' + (i + 1)));
      if (d) {
        const cleared = Object.keys(d.cleared).length;
        c.appendChild(el('div', 's-name', cleared >= worlds.length ? 'Midnight reached 🎃' : 'World ' + Math.min(worlds.length, cleared + 1) + ' of ' + worlds.length));
        const prog = el('div', 's-prog'); const bar = el('i'); bar.style.width = (100 * cleared) / worlds.length + '%'; prog.appendChild(bar); c.appendChild(prog);
        c.appendChild(el('div', 's-info', fmtNum(d.rutas) + ' Rutabagas · ' + d.stats.runs + ' runs · ' + fmtTime(d.stats.playTime) + '\nLast played: ' + new Date(d.lastPlayed || d.created).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })));
        c.lastChild.style.whiteSpace = 'pre-line';
        const btns = el('div', 's-btns');
        const go = el('button', 'btn primary', 'Continue'); go.onclick = () => openSlot(i);
        const del = el('button', 'btn small danger', 'Delete');
        del.onclick = () => {
          if (del.dataset.armed) { Meta.erase(i); sfx('deny'); renderSlots(); return; }
          del.dataset.armed = '1'; del.textContent = 'Really delete?';
          setTimeout(() => { if (del.isConnected) { delete del.dataset.armed; del.textContent = 'Delete'; } }, 3000);
        };
        btns.appendChild(go); btns.appendChild(del); c.appendChild(btns);
      } else {
        c.appendChild(el('div', 's-name', 'Empty'));
        c.appendChild(el('div', 's-info', 'Start a new adventure. Jack begins on the Harvest Farm.'));
        const btns = el('div', 's-btns');
        const go = el('button', 'btn primary', 'New Game'); go.onclick = () => openSlot(i);
        btns.appendChild(go); c.appendChild(btns);
      }
      grid.appendChild(c);
    }
  }
  function openSlot(i) {
    sfx('click');
    Meta.open(i);
    hubTab = 'worlds';
    showScreen('hub');
  }

  /* ---------- hub ---------- */
  let hubTab = 'worlds';
  function updateWallet(bump) {
    $('#hub .hub-wallet span').textContent = fmtNum(Meta.data.rutas);
    if (bump) { const w = $('#hub .hub-wallet'); w.classList.remove('bump'); void w.offsetWidth; w.classList.add('bump'); }
  }
  function renderHub() {
    if (!Meta.data) { showScreen('slots'); return; }
    $('#hub .hub-title').textContent = 'World Select · Save Slot ' + (Meta.slot + 1);
    menuIcon($('#hub .hub-wallet canvas'), 'rutabaga');
    updateWallet(false);
    const tabs = $('#hub .tabs');
    tabs.innerHTML = '';
    App.tabs.sort((a, b) => a.order - b.order);
    for (const t of App.tabs) {
      const b = el('button', 'tab' + (t.id === hubTab ? ' on' : ''), t.label);
      b.dataset.tab = t.id;
      b.onclick = () => { sfx('click'); hubTab = t.id; renderHub(); };
      tabs.appendChild(b);
    }
    const body = $('#hub .tab-body');
    body.innerHTML = '';
    const cur = App.tabs.find((t) => t.id === hubTab) || App.tabs[0];
    cur.render(body, App.helpers);
  }
  function buyButton(cost, onBuy, label) {
    const b = el('button', 'btn small' + (Meta.data.rutas >= cost ? ' primary' : ''));
    const ic = iconCanvas('rutabaga', 40);
    const box = el('span', 'si-buy');
    box.appendChild(ic); box.appendChild(document.createTextNode((label ? label + ' ' : '') + fmtNum(cost)));
    b.appendChild(box);
    b.onclick = () => {
      if (onBuy()) { sfx('buy'); updateWallet(true); renderHub(); }
      else { sfx('deny'); toast('Not enough Rutabagas'); }
    };
    return b;
  }
  function tabWorlds(body) {
    body.appendChild(el('p', 'tab-intro', 'Every world is one evening, from afternoon until midnight. Beat a world to unlock the next one.'));
    const grid = el('div', 'world-grid');
    worlds.forEach((w, i) => {
      const unlocked = Meta.isUnlocked(i), cleared = !!Meta.data.cleared[i];
      const c = el('div', 'world-card' + (unlocked ? '' : ' locked'));
      const strip = el('div', 'w-strip'); strip.style.setProperty('--n', w.styles.length);
      for (const id of w.styles) { const img = el('img'); img.alt = ''; img.loading = 'lazy'; img.src = 'shots/' + id + '.webp'; img.onerror = function () { this.onerror = null; this.src = 'shots/' + id + '.png'; }; strip.appendChild(img); }
      c.appendChild(strip);
      const b = el('div', 'w-body');
      b.appendChild(el('div', 'w-num', 'WORLD ' + (i + 1) + (i === worlds.length - 1 ? ' · FINALE' : '')));
      b.appendChild(el('div', 'w-name', w.name));
      b.appendChild(el('div', 'w-tag', w.tag));
      b.appendChild(el('div', 'w-styles', w.styles.map(styleName).join('  →  ')));
      const foot = el('div', 'w-foot');
      const best = Meta.data.stats.best[i];
      foot.appendChild(el('span', 'w-best', best && best.time ? 'Best time ' + fmtTime(best.time) : unlocked ? 'Not beaten yet' : 'Beat World ' + i + ' first'));
      if (cleared) foot.appendChild(el('span', 'w-badge', 'CLEARED'));
      const play = el('button', 'btn ' + (unlocked ? 'primary' : ''), unlocked ? '▶ Play' : 'Locked');
      play.disabled = !unlocked;
      play.onclick = () => { sfx('click'); startRun(i); };
      foot.appendChild(play);
      b.appendChild(foot);
      c.appendChild(b);
      grid.appendChild(c);
    });
    body.appendChild(grid);
  }
  function pips(level, max) {
    const p = el('div', 'si-pips');
    for (let i = 0; i < max; i++) p.appendChild(el('i', i < level ? 'on' : ''));
    return p;
  }
  function tabWorkshop(body) {
    body.appendChild(el('p', 'tab-intro', 'Permanent upgrades – they apply to every run.'));
    const grid = el('div', 'shop-grid');
    for (const m of Meta.MODS) {
      const l = Meta.modLevel(m.id), maxed = l >= m.max;
      const row = el('div', 'shop-item' + (maxed ? ' maxed' : ''));
      row.appendChild(iconCanvas(m.icon));
      const mid = el('div');
      mid.appendChild(el('div', 'si-name', m.name));
      mid.appendChild(el('div', 'si-desc', maxed ? m.desc(l) + ' (max)' : (l ? 'Now: ' + m.desc(l) + ' · Next: ' + m.desc(l + 1) : m.desc(1))));
      mid.appendChild(pips(l, m.max));
      row.appendChild(mid);
      row.appendChild(maxed ? el('span', 'si-buy', 'Max') : buyButton(m.cost(l), () => Meta.buyMod(m.id)));
      grid.appendChild(row);
    }
    body.appendChild(grid);
  }
  function tabMastery(body) {
    body.appendChild(el('p', 'tab-intro', 'Mastery makes individual level-up upgrades stronger: +25% effect per rank, in every run.'));
    const grid = el('div', 'shop-grid');
    for (const it of GD.ITEMS) {
      const l = Meta.masteryLevel(it.id), maxed = l >= Meta.MASTERY_MAX;
      const row = el('div', 'shop-item' + (maxed ? ' maxed' : ''));
      row.appendChild(iconCanvas(it.icon));
      const mid = el('div');
      mid.appendChild(el('div', 'si-name', it.name + (it.weapon ? ' · Weapon' : '')));
      mid.appendChild(el('div', 'si-desc', 'Card: ' + it.text(1 + 0.25 * l) + (maxed ? '' : ' → ' + it.text(1 + 0.25 * (l + 1)))));
      mid.appendChild(pips(l, Meta.MASTERY_MAX));
      row.appendChild(mid);
      row.appendChild(maxed ? el('span', 'si-buy', 'Max') : buyButton(Meta.masteryCost(l), () => Meta.buyMastery(it.id)));
      grid.appendChild(row);
    }
    body.appendChild(grid);
  }
  function tabRarity(body) {
    body.appendChild(el('p', 'tab-intro', 'Unlock rarer level-up cards. Higher rarities boost a card\'s effect. The workshop upgrade “Lucky Pumpkin” makes them more common.'));
    const grid = el('div', 'shop-grid');
    const common = el('div', 'shop-item');
    common.appendChild(iconCanvas('dmg'));
    const cm = el('div'); cm.appendChild(el('div', 'si-name', 'Common')); cm.appendChild(el('div', 'si-desc', 'Normal cards: effect ×1')); common.appendChild(cm);
    common.appendChild(el('span', 'si-buy', 'Unlocked'));
    grid.appendChild(common);
    for (const r of Meta.RARITY_UNLOCKS) {
      const owned = !!Meta.data.rarities[r.id], blocked = r.needs && !Meta.data.rarities[r.needs];
      const row = el('div', 'shop-item r-' + r.id);
      row.appendChild(iconCanvas('crit'));
      const mid = el('div');
      mid.appendChild(el('div', 'si-name', r.name));
      mid.appendChild(el('div', 'si-desc', r.desc + (blocked ? ' · requires “' + Meta.RARITY_UNLOCKS.find((x) => x.id === r.needs).name + '” first' : '')));
      row.appendChild(mid);
      row.appendChild(owned ? el('span', 'si-buy', 'Unlocked') : blocked ? el('span', 'si-buy', 'Locked') : buyButton(r.cost, () => Meta.buyRarity(r.id)));
      grid.appendChild(row);
    }
    body.appendChild(grid);
  }
  function tabStats(body) {
    const st = Meta.data.stats;
    const tiles = [
      ['Runs', st.runs], ['Worlds cleared', Meta.clearedCount() + ' / ' + worlds.length], ['Wins', st.wins], ['Defeats', st.deaths],
      ['Enemies defeated', fmtNum(st.kills)], ['Rutabaga Creepers', fmtNum(st.creeper)], ['Hunger Ghosts', fmtNum(st.ghost)], ['Rutabaga Colossi', fmtNum(st.colossus)],
      ['Turnip Ancestors defeated', st.bosses], ['Highest level', st.bestLevel], ['Play time', fmtTime(st.playTime)], ['Total damage', fmtNum(st.damage)],
      ['Rutabagas earned', fmtNum(st.rutasEarned)], ['Rutabagas spent', fmtNum(st.rutasSpent)], ['Level-ups', fmtNum(st.levelUps)],
    ];
    const grid = el('div', 'stats-grid');
    for (const [k, v] of tiles) { const t = el('div', 'stat'); t.appendChild(el('b', '', String(v))); t.appendChild(el('span', '', k)); grid.appendChild(t); }
    body.appendChild(grid);
    const tbl = el('table', 'stats-table');
    tbl.innerHTML = '<tr><th>World</th><th>Status</th><th>Best time</th><th>Most kills</th></tr>';
    worlds.forEach((w, i) => {
      const b = st.best[i] || {};
      const tr = el('tr');
      for (const v of [(i + 1) + '. ' + w.name, Meta.data.cleared[i] ? 'Cleared' : Meta.isUnlocked(i) ? 'Open' : 'Locked', b.time ? fmtTime(b.time) : '–', b.kills ? fmtNum(b.kills) : '–']) tr.appendChild(el('td', '', v));
      tbl.appendChild(tr);
    });
    body.appendChild(tbl);
  }
  // built-in tabs; other files add theirs with App.registerTab(id, label, order, render)
  App.registerTab('worlds', 'Worlds', 10, tabWorlds);
  App.registerTab('workshop', 'Workshop', 30, tabWorkshop);
  App.registerTab('mastery', 'Mastery', 40, tabMastery);
  App.registerTab('rarity', 'Rarities', 50, tabRarity);
  App.registerTab('stats', 'Statistics', 70, tabStats);
  Object.assign(App.helpers, { el, iconCanvas, menuIcon, buyButton, fmtNum, fmtTime, sfx, toast, Meta, game, GD, worlds: () => worlds, refresh: () => renderHub(), updateWallet, styleName });

  /* ---------- settings ---------- */
  function applySettings() {
    const s = Meta.settings;
    try { S.setVolume(s.master); S.setMusicVolume && S.setMusicVolume(s.music); S.setSfxVolume && S.setSfxVolume(s.sfx); } catch (e) {}
  }
  function renderSettings() {
    document.querySelectorAll('#settings [data-set]').forEach((inp) => {
      const k = inp.dataset.set;
      const v = Meta.settings[k];
      if (inp.type === 'range') inp.value = Math.round((k === 'particles' ? v / 3 : v) * 100);
      else if (inp.type === 'checkbox') inp.checked = !!v;
      else inp.value = String(v);
      const out = inp.parentElement.querySelector('.set-val');
      const show = () => { if (out) out.textContent = inp.type === 'range' ? inp.value + '%' : ''; };
      show();
      inp.oninput = inp.onchange = () => {
        if (inp.type === 'range') Meta.settings[k] = k === 'particles' ? Math.round(inp.value / 100 * 3) : inp.value / 100;
        else if (inp.type === 'checkbox') Meta.settings[k] = inp.checked;
        else Meta.settings[k] = /^\d+$/.test(inp.value) ? +inp.value : inp.value;
        Meta.saveSettings();
        applySettings();
        show();
        if (k === 'sfx' || k === 'master') sfx('pickup');
        if (k === 'quality') for (const r of R) r.lastKey = '';
      };
    });
  }

  /* ---------- global buttons ---------- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    S.unlock && S.unlock();
    const a = b.dataset.act;
    sfx('click');
    if (a === 'play') showScreen('slots');
    else if (a === 'settings') { settingsBack = screen === 'pause' ? 'pause' : 'main'; showScreen('settings'); }
    else if (a === 'howto') showScreen('howto');
    else if (a === 'credits') showScreen('credits');
    else if (a === 'back-main') showScreen('main');
    else if (a === 'back-slots') showScreen('slots');
    else if (a === 'back-settings') showScreen(settingsBack);
    else if (a === 'fullscreen') { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); }
    else if (a === 'resume') setPause(false);
    else if (a === 'build') { setPause(false); toggleBuild(); }
    else if (a === 'back-build') toggleBuild();
    else if (a === 'quit') { setPause(false); finishRun(false, true); }
    else if (a === 'to-hub') toHub();
    else if (a === 'again') startRun(run ? run.wi : 0);
    else if (a === 'next') startRun(run ? run.wi + 1 : 0);
  });

  /* ================= runs ================= */
  const tierOf = (wi) => wi * 0.55;
  async function startRun(wi) {
    if (busy) return;
    busy = true;
    paused = false;
    $('#gameover').classList.add('hidden');
    hideOverlay();
    screenFade(true, true);
    await wait(380);
    const w = worlds[wi];
    for (const id of w.styles) ensureInit(window.Styles.byId[id]); // heavy inits happen behind the black screen
    game.seed = (Math.random() * 1e9) | 0;
    game.reset();
    game.mode = 'campaign';
    game.applyMeta(Meta.runMeta());
    game.skin = (Meta.data && Meta.data.skin) || null;
    run = { wi, world: w, styleIdx: 0, done: false };
    mode = 'run';
    if (window.Achievements) window.Achievements.runStart(game, Meta.data, App);
    setStyleNow(w.styles[0]);
    game.startWorld(wi, tierOf(wi));
    game.player.x = game.player.y = 0;
    rend().snapCamera(game);
    rend().resize(game, true);
    rend().render(game, STEP, true);
    showScreen('run');
    game.state = 'intro';
    overlay('intro', 'World ' + (wi + 1), w.name + ' – ' + w.tag, '');
    music(S.worldMood ? S.worldMood(w.styles[0]) : 'eerie');
    screenFade(false);
    sfx('worldStart');
    busy = false;
    await wait(2300);
    if (run && run.wi === wi && game.state === 'intro') {
      hideOverlay();
      game.state = 'play';
      banner((W.startHour - 12) + ' PM – survive until midnight!');
    }
  }
  // the evening goes on: cross-fade into the next style of this world
  const DAY_TEXT = { 2: ['Night is falling …'], 3: ['Dusk settles in …', 'Night is falling …'] };
  function tickDay() {
    if (mode !== 'run' || !run || game.state !== 'play') return;
    const n = run.world.styles.length;
    if (run.styleIdx >= n - 1) return;
    const seg = game.waveSeconds / n;
    if (game.worldTime >= (run.styleIdx + 1) * seg - 4) {
      run.styleIdx++;
      const id = run.world.styles[run.styleIdx];
      beginFade(id);
      const txt = (DAY_TEXT[n] || [])[run.styleIdx - 1];
      if (txt) banner(txt, 3);
      if (game.phase !== 'boss') music(S.worldMood ? S.worldMood(id) : 'eerie');
    }
  }
  async function finishRun(won, quit) {
    if (!run || run.done) return;
    run.done = true;
    if (won) game.state = 'won';
    const res = Meta.data ? Meta.recordRun(game, run.wi, won) : { unlockedNew: false };
    const newAch = window.Achievements && Meta.data ? window.Achievements.runEnd(game, Meta.data, won, run.wi, App) : [];
    hideBanner();
    hideOverlay();
    if (quit) { toHub(); return; }
    if (won) { screenFade(true); await wait(500); screenFade(false); }
    const go = $('#gameover');
    go.classList.remove('hidden');
    go.querySelector('.go-title').textContent = won ? 'Midnight! ' + run.world.name + ' cleared' : 'Jack has withered';
    const t = Math.floor(game.totalTime);
    go.querySelector('.go-stats').textContent = 'Time ' + game.clockText + ' · Level ' + game.level + ' · ' + fmtNum(game.kills) + ' enemies defeated · ' + fmtTime(t);
    const rw = go.querySelector('.go-reward');
    rw.innerHTML = '';
    const ic = document.createElement('canvas'); ic.width = ic.height = 48; hud.drawIcon(ic, 'rutabaga');
    rw.appendChild(ic); rw.appendChild(document.createTextNode('+' + fmtNum(game.rutas) + ' Rutabagas for the workshop'));
    const acts = go.querySelector('.go-actions');
    acts.innerHTML = '';
    const mk = (txt, act, primary) => { const b = el('button', 'btn' + (primary ? ' primary' : ''), txt); b.dataset.act = act; acts.appendChild(b); };
    const hasNext = won && run.wi + 1 < worlds.length;
    if (hasNext) mk('Next: World ' + (run.wi + 2), 'next', true);
    mk('World Select', 'to-hub', !hasNext);
    mk(won ? 'Play again' : 'Try again', 'again');
    for (const a of newAch || []) rw.appendChild(el('div', 'go-ach', '🏆 ' + a.name + (a.reward ? '  +' + a.reward + ' Rutabagas' : '')));
    go.querySelector('.go-hint').textContent = res.unlockedNew && hasNext ? '🔓 New world unlocked: ' + worlds[run.wi + 1].name : won && run.wi === worlds.length - 1 ? '🎃 You beat the finale!' : 'Enter – ' + (hasNext ? 'next world' : 'world select');
    go.querySelector('.go-hint').classList.toggle('go-unlock', !!res.unlockedNew);
    sfx(won ? 'victory' : 'gameover');
    if (won) sfx('midnightBell');
    music(null);
  }
  async function toHub() {
    $('#gameover').classList.add('hidden');
    hideOverlay();
    screenFade(true, true);
    await wait(350);
    startAttract();
    showScreen(Meta.data ? 'hub' : 'main');
    screenFade(false);
  }

  /* ---------- in-run overlays (#levelup) ---------- */
  const lu = $('#levelup');
  let overlayFor = null;
  function overlay(kind, title, sub, hint) {
    lu.className = 'mode-' + kind;
    lu.querySelector('.lu-title').textContent = title;
    lu.querySelector('.lu-sub').textContent = sub || '';
    lu.querySelector('.lu-hint').textContent = hint || '';
    lu.querySelector('.lu-cards').innerHTML = '';
    lu.querySelector('.lu-actions').innerHTML = '';
  }
  function hideOverlay() { lu.className = 'hidden'; overlayFor = null; }
  function renderLevelUp() {
    overlay('levelup', (game.choicesInfo && game.choicesInfo.title) || 'Level Up!', game.choicesInfo && game.choicesInfo.rutas ? '+' + game.choicesInfo.rutas + ' Rutabagas – pick a free upgrade' : '', 'Choose with 1 · 2 · 3 or click' + (game.rerollsLeft ? ' · R to reroll' : ''));
    const cards = lu.querySelector('.lu-cards');
    game.choices.forEach((ch, i) => {
      const c = el('div', 'card r-' + ch.rarity.id);
      c.innerHTML = '<canvas class="card-icon" width="96" height="96"></canvas><div class="card-name"></div><div class="card-desc"></div><div class="card-key">' + (i + 1) + '</div>';
      c.querySelector('.card-name').textContent = ch.name;
      c.querySelector('.card-desc').textContent = ch.desc;
      hud.drawIcon(c.querySelector('.card-icon'), ch.icon);
      if (ch.weapon) c.appendChild(el('div', 'card-tag', 'Weapon'));
      const owned = game.owned[ch.id] || 0;
      if (owned) c.appendChild(el('div', 'card-owned', 'Owned: ' + owned + (ch.item.max ? ' / ' + ch.item.max : '')));
      c.appendChild(el('div', 'card-rarity', ch.rarity.name));
      c.onclick = () => choose(i);
      cards.appendChild(c);
    });
    if (game.rerollsLeft > 0) {
      const rr = el('button', 'btn', 'Reroll (' + game.rerollsLeft + ')');
      rr.onclick = () => reroll();
      lu.querySelector('.lu-actions').appendChild(rr);
    }
    if (game.choices.some((c) => c.rarity.id === 'legendary')) sfx('crit');
  }
  function choose(i) { sfx('click'); game.choose(i); }
  function reroll() { if (game.rerollChoices()) { sfx('reroll'); overlayFor = game.choices; renderLevelUp(); } else sfx('deny'); }

  /* ---------- build overview (Tab) ---------- */
  function toggleBuild() {
    if (screen === 'build') { paused = false; showScreen('run'); return; }
    if (mode !== 'run' || (game.state !== 'play') || !window.Build) return;
    paused = true;
    showScreen('build');
    window.Build.render($('#build .build-body'), game, App.helpers);
  }
  App.toggleBuild = toggleBuild;

  /* ---------- pause ---------- */
  function setPause(on) {
    if (on && (mode !== 'run' || game.state === 'dead' || game.state === 'won' || game.state === 'intro')) return;
    paused = on;
    if (on) showScreen('pause');
    else if (screen === 'pause' || screen === 'settings') showScreen('run');
  }

  /* ---------- menu attract demo ---------- */
  let attractT = 0, attractStyles = [], attractIdx = 0;
  function startAttract() {
    mode = 'menu';
    run = null;
    paused = false;
    game.seed = (Math.random() * 1e9) | 0;
    game.reset();
    game.mode = 'campaign';
    const w = worlds[(Math.random() * worlds.length) | 0];
    attractStyles = w.styles.slice();
    attractIdx = 0;
    attractT = 0;
    setStyleNow(attractStyles[0]);
    game.startWorld(0, 1);
    game.waveSecondsOverride = 70;
    game.skin = null;
    for (const id of ['w_rocket', 'w_aura', 'w_boulder', 'w_pistol', 'w_pistol', 'w_aura', 'w_rocket', 'dmg']) if (game.canTake(id)) game.take(GD.ITEM_BY_ID[id]);
    music('title');
  }

  /* ================= game events → sound / UI ================= */
  game.on('Shoot', () => sfx('shoot', { vol: 0.5 }));
  game.on('Hit', (e, src) => sfx('hit', { vol: src === 'lantern' ? 0.35 : 0.5 }));
  game.on('Crit', () => sfx('crit'));
  game.on('Kill', (e) => sfx(e.type === 'colossus' ? 'killBig' : 'kill', { vol: 0.6 }));
  game.on('Pickup', () => sfx('pickup', { vol: 0.5 }));
  game.on('LevelUp', () => sfx('levelup'));
  game.on('Hurt', () => sfx('hurt'));
  game.on('Dash', () => sfx('dash'));
  game.on('Rocket', () => sfx('rocket'));
  game.on('Explode', () => sfx('explode', { vol: 0.7 }));
  game.on('Nova', () => sfx('nova'));
  game.on('Revive', () => { sfx('levelup'); if (mode === 'run') banner('The second lantern glows – Jack rises again!', 3); });
  game.on('BossSpawn', (e) => { sfx('bossSpawn'); if (mode === 'run' && e && !e._announced) { e._announced = true; music('boss'); banner('Midnight is near – ' + (e.name || 'the boss') + ' awakens!', 2.8); } });
  game.on('BossCharge', () => sfx('bossCharge'));
  game.on('BossSlam', () => sfx('bossSlam'));
  game.on('BossDie', () => { sfx('bossDie'); sfx('midnightBell'); if (mode === 'run') banner('Midnight! The portal opens – step inside!', 3.5); });
  game.on('PortalOpen', () => sfx('portal'));
  game.on('Rutas', () => { const r = $('#hud .rutas'); r.classList.remove('bump'); void r.offsetWidth; r.classList.add('bump'); });

  /* ================= input ================= */
  const keys = new Set();
  let dashPressed = false;
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'tab'].includes(k)) e.preventDefault();
    S.unlock && S.unlock();
    if (e.repeat) return;
    keys.add(k);
    if (k === 'm') { S.setMuted(!S.muted); toast(S.muted ? 'Sound off' : 'Sound on'); return; }
    if (mode === 'menu') {
      if (k === 'escape') {
        if (screen === 'hub') showScreen('slots');
        else if (screen === 'settings') showScreen(settingsBack);
        else if (screen !== 'main') showScreen('main');
      } else if (k === 'enter' && screen === 'main') showScreen('slots');
      return;
    }
    // run
    if (!$('#gameover').classList.contains('hidden')) {
      if (k === 'enter') { const b = $('#gameover .go-actions .btn.primary'); if (b) b.click(); }
      return;
    }
    if (k === 'tab') { toggleBuild(); return; }
    if (k === 'escape' || k === 'p') { if (screen === 'build') { toggleBuild(); return; } if (screen === 'settings') showScreen('pause'); else setPause(!paused); return; }
    if (paused) return;
    if (k === ' ' || k === 'shift') dashPressed = true;
    if (game.state === 'levelup') {
      if (['1', '2', '3'].includes(k)) choose(+k - 1);
      else if (k === 'r') reroll();
      return;
    }
    if (params.has('dev')) {
      if (k === 'k' && game.phase === 'waves') game.worldTime = game.waveSeconds - 1;
      if (k === 'j') game.worldTime += 20;
      if (k === 'l' && game.boss) game.damageEnemy(game.boss, 1e9, 0, 0, 'dev');
      if (k === 'g' && Meta.data) { Meta.data.rutas += 500; Meta.save(); toast('+500 Rutabagas'); }
    }
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => { keys.clear(); if (mode === 'run' && game.state === 'play') setPause(true); });
  window.addEventListener('pointerdown', () => S.unlock && S.unlock());
  function readInput() {
    if (mode === 'menu' || params.has('auto')) return GD.autopilot(game);
    let x = 0, y = 0;
    if (keys.has('a') || keys.has('arrowleft')) x -= 1;
    if (keys.has('d') || keys.has('arrowright')) x += 1;
    if (keys.has('w') || keys.has('arrowup')) y -= 1;
    if (keys.has('s') || keys.has('arrowdown')) y += 1;
    const dash = dashPressed;
    dashPressed = false;
    return { x, y, dash };
  }

  /* ================= HUD extras ================= */
  function updateHud() {
    hud.update(false);
    hud.set('rutas', game.rutas, (v) => ($('#hud .rutas-num').textContent = v));
    hud.set('world', (run ? run.wi : -1) + ':' + (uiStyle && uiStyle.id), () => {
      $('#hud .clock-label').textContent = run ? 'World ' + (run.wi + 1) + ' · ' + run.world.name : '';
    });
    const b = game.boss;
    $('#hud .bossbar').classList.toggle('hidden', !b || mode !== 'run');
    if (b) { $('#hud .boss-fill').style.width = Math.max(0, (100 * b.hp) / b.maxHp) + '%'; hud.set('bossname', b.name, (v) => ($('#hud .boss-name').textContent = v)); }
  }

  /* ================= main loop ================= */
  let acc = 0, last = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!paused) {
      acc += dt;
      if (game.hitstop > 0) { game.hitstop -= dt; acc = 0; if (!Meta.settings.hitstop) game.hitstop = 0; }
      let steps = 0;
      while (acc >= STEP && steps < 6) {
        game.update(STEP, readInput());
        acc -= STEP;
        steps++;
      }
      tickDay();
      tickFade(dt);
      // in-run state machine
      if (game.state === 'levelup' && overlayFor !== game.choices) {
        if (mode === 'menu') game.choose((Math.random() * 3) | 0);
        else { overlayFor = game.choices; renderLevelUp(); }
      } else if (game.state === 'play' && overlayFor && lu.className === 'mode-levelup') hideOverlay();
      if (mode === 'run') {
        if (game.state === 'portal') finishRun(true);
        else if (game.state === 'dead') finishRun(false);
      } else {
        // attract demo: cycle through the times of day, restart when it ends
        attractT += dt;
        if (attractT > 16 && !fade) { attractT = 0; attractIdx = (attractIdx + 1) % attractStyles.length; beginFade(attractStyles[attractIdx]); }
        if (game.state === 'dead' || game.state === 'portal') startAttract();
      }
    }
    if (bannerT > 0) { bannerT -= dt; if (bannerT <= 0) $('#banner').classList.add('hidden'); }
    renderFrame(dt);
    if (params.has('debug')) document.title = JSON.stringify({ mode, screen, st: game.state, ph: game.phase, wt: +game.worldTime.toFixed(1), style: uiStyle && uiStyle.id, fade: fade ? fade.stage : null, err: errors.length });
    requestAnimationFrame(frame);
  }
  function renderFrame(dt) {
    if (!Meta.settings.numbers) game.numbers.length = 0;
    if (uiStyle) {
      const r = rend();
      r.resize(game);
      r.render(game, paused ? 0 : dt, false);
      if (fade && fade.stage === 'fade') {
        const sp = fade.sp;
        sp.resize(game);
        sp.render(game, paused ? 0 : dt, false);
        const k = U.clamp(fade.t / W.fadeSeconds, 0, 1);
        const d = r.dctx;
        d.setTransform(1, 0, 0, 1, 0, 0);
        d.globalAlpha = k * k * (3 - 2 * k);
        d.drawImage(sp.display, 0, 0, r.dW, r.dH);
        d.globalAlpha = 1;
      }
      if (mode === 'run') updateHud();
    }
  }

  /* ================= test harness (headless): synchronous run of one world ================= */
  function simulate(seconds, wi) {
    const log = [];
    const w = worlds[wi];
    for (const id of w.styles) ensureInit(window.Styles.byId[id]);
    if (!Meta.data) Meta.open(+(params.get('slot') || 2));
    game.seed = 4242; game.reset(); game.mode = 'campaign';
    const preset = params.get('meta');
    if (preset === 'mid') game.applyMeta({ mods: { vitality: 4, power: 4, haste: 2, reach: 2, luck: 1, toughness: 1 }, mastery: { dmg: 1, rate: 1 }, rarities: { rare: true } });
    else if (preset === 'high') game.applyMeta({ mods: { vitality: 8, power: 8, haste: 4, reach: 4, luck: 3, toughness: 3, revive: 1, reroll: 1, startRocket: 1 }, mastery: { dmg: 2, rate: 2, multi: 2, lantern: 1 }, rarities: { rare: true, epic: true } });
    else game.applyMeta(Meta.runMeta());
    run = { wi, world: w, styleIdx: 0, done: false };
    mode = 'run';
    setStyleNow(w.styles[0]);
    game.startWorld(wi, tierOf(wi));
    showScreen('run');
    const stop = params.get('simstop');
    const n = w.styles.length, seg = game.waveSeconds / n;
    for (let i = 0; i < seconds * 60; i++) {
      game.update(STEP, GD.autopilot(game));
      if (run.styleIdx < n - 1 && game.worldTime >= (run.styleIdx + 1) * seg) { run.styleIdx++; setStyleNow(w.styles[run.styleIdx]); log.push('style→' + w.styles[run.styleIdx] + ' @' + game.worldTime.toFixed(0) + 's ' + game.clockText); }
      if (game.state === 'levelup') game.choose((Math.random() * 3) | 0);
      if (stop === 'boss' && game.boss && game.worldTime > game.waveSeconds + 6) break;
      if (stop === 'levelup' && game.state === 'levelup') { overlayFor = game.choices; renderLevelUp(); break; }
      if (stop && stop.startsWith('t') && game.worldTime >= +stop.slice(1)) break;
      if (game.state === 'dead') { log.push('dead lv' + game.level + ' t=' + game.worldTime.toFixed(0)); break; }
      if (game.state === 'portal') { log.push('WON t=' + game.worldTime.toFixed(0) + ' fight=' + (game.worldTime - game.waveSeconds).toFixed(0) + 's lv' + game.level + ' kills=' + game.kills + ' rutas=' + game.rutas); break; }
    }
    return { log, state: game.state, phase: game.phase, lv: game.level, hp: Math.round(game.player.hp), clock: game.clockText, errors: errors.slice(0, 5) };
  }

  /* ================= boot ================= */
  window.addEventListener('load', () => {
    if (params.has('ws')) W.waveSeconds = +params.get('ws');
    worlds = W.available();
    if (!worlds.length) { window.__reportError('No worlds found.'); return; }
    iconStyle = window.Styles.byId.cartoon || window.Styles.list[0];
    ensureInit(iconStyle);
    applySettings();
    if (window.Fx) window.Fx.attach(game);
    if (params.has('simtest')) {
      const r = simulate(+params.get('simtest') || 200, +(params.get('world') || 0));
      for (const e of game.enemies) e.flash = 0;
      rend().snapCamera(game); rend().resize(game, true); rend().render(game, STEP, true);
      updateHud();
      const tag = document.createElement('script'); tag.type = 'application/json'; tag.id = 'simtest'; tag.textContent = JSON.stringify(r);
      document.body.appendChild(tag);
      return;
    }
    if (params.has('fadetest')) {
      // synchronous cross-fade test: world styles[0] -> styles[1], stop at fade progress p (0..1) or run to completion
      const w = worlds[+(params.get('world') || 0)];
      for (const id of w.styles) ensureInit(window.Styles.byId[id]);
      Meta.open(2); run = { wi: 0, world: w, styleIdx: 0, done: false }; mode = 'run'; showScreen('run');
      game.reset(); game.mode = 'campaign'; game.startWorld(0, 0);
      setStyleNow(w.styles[0]);
      for (let i = 0; i < 600; i++) { game.update(STEP, GD.autopilot(game)); if (game.state === 'levelup') game.choose(0); }
      renderFrame(STEP);
      beginFade(w.styles[1]);
      const stopAt = +(params.get('fadetest') || 0.5);
      const log = [];
      for (let i = 0; i < 60 * 12; i++) {
        game.update(STEP, GD.autopilot(game)); if (game.state === 'levelup') game.choose(0);
        tickFade(STEP);
        renderFrame(STEP);
        if (fade && fade.stage === 'fade' && fade.t / W.fadeSeconds >= stopAt) { log.push('stopped at k=' + (fade.t / W.fadeSeconds).toFixed(2)); break; }
        if (!fade) { log.push('fade complete after ' + i + ' frames, active renderer ' + ri + ', ui=' + uiStyle.id + ', canvas in DOM: ' + (document.getElementById('game') === rend().display)); break; }
      }
      const tag = document.createElement('script'); tag.type = 'application/json'; tag.id = 'simtest'; tag.textContent = JSON.stringify({ log, errors });
      document.body.appendChild(tag);
      return;
    }
    startAttract();
    if (params.has('screen')) {
      // screenshot / test entry points: ?screen=slots | hub[&tab=...] | settings
      const sc = params.get('screen');
      if (sc === 'hub') { Meta.open(+(params.get('slot') || 2)); if (params.has('rich')) { Meta.data.rutas = 1234; Meta.data.cleared = { 0: true, 1: true }; Meta.data.mods = { vitality: 3, power: 2 }; Meta.data.rarities = { rare: true }; } hubTab = params.get('tab') || 'worlds'; }
      showScreen(sc);
    } else if (params.has('world')) {
      Meta.open(+(params.get('slot') || 0));
      startRun(Math.max(0, Math.min(worlds.length - 1, +params.get('world') - 1)));
    } else showScreen('main');
    requestAnimationFrame((t) => { last = t; frame(t); });
  });
  window.__game = game;
  window.__app = { startRun, beginFade, worlds: () => worlds };
})();
