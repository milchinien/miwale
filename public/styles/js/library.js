/* Game Style Library: gallery + style window. Data comes from styles.json and library/<id>/{spec.json,STYLE.md,starter.js}. */
(function () {
  'use strict';
  const MD = window.MD;
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = MD.esc;
  const SITE = 'https://miwale.com/styles';

  const state = { catalog: null, list: [], group: 'all', q: '', sort: 'order', current: null, stage: 'shots', doc: 'overview', cache: {} };
  const VIEWS = [['', 'Gameplay'], ['_late', 'Late game'], ['_map', 'World map'], ['_lu', 'Level-up screen'], ['_zoom', 'Close-up']];
  const DOC_RECIPE = ['Rendering technique', 'Background and ground', 'Characters', 'Enemies and props', 'Effects and particles',
    'Lighting, shadows and post-processing', 'UI and HUD', 'Motion and animation', 'Implementation recipe', 'Adapting it to your game'];

  /* ---------- helpers ---------- */
  const toast = (msg) => {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toast.h);
    toast.h = setTimeout(() => t.classList.remove('on'), 1800);
  };
  async function copy(text, what) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    toast((what || 'Text') + ' copied');
  }
  async function getText(url) {
    if (state.cache[url] !== undefined) return state.cache[url];
    const r = await fetch(url);
    if (!r.ok) throw new Error(url + ': ' + r.status);
    return (state.cache[url] = await r.text());
  }
  const fontsLoaded = new Set();
  function loadFont(family, weights) {
    const key = family + (weights || []).join();
    if (fontsLoaded.has(key)) return;
    fontsLoaded.add(key);
    const w = weights && weights.length ? ':wght@' + weights.slice().sort((a, b) => a - b).join(';') : '';
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + family.replace(/ /g, '+') + w + '&display=swap';
    document.head.appendChild(l);
  }
  const stars = (n) => '<span class="meter" style="--n:' + n + '" aria-label="' + n + ' of 10"><i></i></span>';
  const list = (arr) => '<ul>' + arr.map((t) => '<li>' + MD.inline(t) + '</li>').join('') + '</ul>';

  /* ---------- gallery ---------- */
  async function init() {
    try {
      state.catalog = JSON.parse(await getText('styles.json'));
    } catch (e) {
      $('#grid').innerHTML = '<p class="empty">Could not load the style catalog.</p>';
      return;
    }
    state.list = state.catalog.styles;
    document.querySelectorAll('.count').forEach((el) => (el.textContent = state.list.length));
    buildChips();
    renderGrid();
    $('#q').addEventListener('input', (e) => { state.q = e.target.value.trim().toLowerCase(); renderGrid(); });
    $('#sort').addEventListener('change', (e) => { state.sort = e.target.value; renderGrid(); });
    document.querySelector('[data-copy-llms]').addEventListener('click', () =>
      copy('Use the miwale Game Style Library for the art style of my game: ' + SITE + '/llms.txt – pick the style that fits, read its STYLE.md completely and follow it.', 'Instruction'));
    window.addEventListener('hashchange', route);
    route();
  }

  function buildChips() {
    const groups = ['all'];
    for (const s of state.list) if (!groups.includes(s.group)) groups.push(s.group);
    const box = $('#chips');
    box.innerHTML = groups.map((g) => {
      const n = g === 'all' ? state.list.length : state.list.filter((s) => s.group === g).length;
      return '<button type="button" class="chip" data-group="' + esc(g) + '" aria-pressed="' + (g === state.group) + '">' + (g === 'all' ? 'All' : esc(g)) + ' <span>' + n + '</span></button>';
    }).join('');
    box.addEventListener('click', (e) => {
      const b = e.target.closest('.chip');
      if (!b) return;
      state.group = b.dataset.group;
      box.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c === b));
      renderGrid();
    });
  }

  function visible() {
    let arr = state.list.filter((s) => state.group === 'all' || s.group === state.group);
    if (state.q) {
      arr = arr.filter((s) => [s.name, s.family, s.summary, s.group, ...s.tags, ...s.mood, ...s.bestFor, ...s.fonts].join(' ').toLowerCase().includes(state.q));
    }
    const base = state.list.indexOf.bind(state.list);
    if (state.sort === 'easy') arr.sort((a, b) => a.difficulty - b.difficulty || base(a) - base(b));
    if (state.sort === 'hard') arr.sort((a, b) => b.difficulty - a.difficulty || base(a) - base(b));
    if (state.sort === 'name') arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }

  function renderGrid() {
    const arr = visible();
    const grid = $('#grid');
    $('#result-info').textContent = arr.length === state.list.length ? '' : arr.length + ' of ' + state.list.length + ' styles';
    if (!arr.length) { grid.innerHTML = '<p class="empty">No style matches – try “pixel”, “dark” or “cozy”.</p>'; return; }
    grid.innerHTML = arr.map((s) => {
      const n = state.list.indexOf(s) + 1;
      return '<a class="card" href="#' + s.id + '" data-id="' + s.id + '">' +
        '<div class="card-media"><img loading="lazy" src="shots/' + s.id + '.webp" alt="' + esc(s.name) + ' – gameplay screenshot" width="1600" height="900">' +
        '<img class="alt" loading="lazy" src="shots/' + s.id + '_zoom.webp" alt="" aria-hidden="true"></div>' +
        '<div class="card-palette" aria-hidden="true">' + s.palette.slice(0, 10).map((h) => '<i style="background:' + h + '"></i>').join('') + '</div>' +
        '<div class="card-body">' +
        '<p class="eyebrow">' + String(n).padStart(2, '0') + ' · ' + esc(s.family) + '</p>' +
        '<h3>' + esc(s.name) + '</h3>' +
        '<p class="card-sum">' + esc(s.summary) + '</p>' +
        '<div class="card-meta"><span class="tags">' + s.tags.slice(0, 3).map((t) => '<span>' + esc(t) + '</span>').join('') + '</span>' +
        '<span class="effort" title="How much work it is for an AI to extend a game in this style (1 easy – 10 elaborate)">' + stars(s.difficulty) + s.difficulty + '/10</span></div>' +
        '</div></a>';
    }).join('');
  }

  /* ---------- routing ---------- */
  function route() {
    const id = decodeURIComponent(location.hash.slice(1));
    const s = state.list.find((x) => x.id === id);
    if (s) openWin(s);
    else if (win.open) closeWin(true);
  }

  /* ---------- window ---------- */
  const win = $('#win');
  win.addEventListener('close', () => {
    stopStage();
    state.stage = 'shots';
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    document.body.classList.remove('win-open');
  });
  win.addEventListener('click', (e) => { if (e.target === win) win.close(); });
  $('#win-close').addEventListener('click', () => win.close());
  $('#win-prev').addEventListener('click', () => step(-1));
  $('#win-next').addEventListener('click', () => step(1));
  document.addEventListener('keydown', (e) => {
    if (!win.open || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
  function step(d) {
    const arr = visible().length ? visible() : state.list;
    const i = arr.findIndex((s) => s.id === state.current.id);
    location.hash = arr[(i + d + arr.length) % arr.length].id;
  }
  function closeWin() { if (win.open) win.close(); }

  win.querySelector('.stage-tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-stage]');
    if (b) setStage(b.dataset.stage);
  });
  win.querySelector('.doc-tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-doc]');
    if (b) setDoc(b.dataset.doc);
  });
  $('#copy-prompt').addEventListener('click', async () => {
    const d = await data(state.current.id);
    copy(fullPrompt(d), 'Prompt with full spec');
  });
  win.addEventListener('click', (e) => {
    const b = e.target.closest('.copy-code');
    if (b) copy(b.parentElement.querySelector('code').textContent, 'Code');
    const sw = e.target.closest('[data-hex]');
    if (sw) copy(sw.dataset.hex, sw.dataset.hex);
    const act = e.target.closest('[data-act]');
    if (act) actions[act.dataset.act] && actions[act.dataset.act](act);
  });

  async function data(id) {
    const base = 'library/' + id + '/';
    const [spec, md, starter] = await Promise.all([getText(base + 'spec.json').then(JSON.parse), getText(base + 'STYLE.md'), getText(base + 'starter.js')]);
    return { id, spec, md, starter, parts: MD.sections(md), base };
  }

  async function openWin(s) {
    state.current = s;
    document.title = s.name + ' – Game Style Library · miwale';
    $('#win-family').textContent = s.family;
    $('#win-title').textContent = s.name;
    $('#win-summary').textContent = s.summary;
    $('#dl-md').href = 'library/' + s.id + '/STYLE.md';
    $('#dl-md').setAttribute('download', s.id + '-STYLE.md');
    if (!win.open) { win.showModal(); document.body.classList.add('win-open'); }
    $('#doc-view').innerHTML = '<p class="loading">Loading spec…</p>';
    setStage(state.stage);
    try {
      const d = await data(s.id);
      if (state.current !== s) return;
      state.d = d;
      for (const f of d.spec.typography) loadFont(f.family, f.weights);
      setDoc(state.doc);
    } catch (e) {
      $('#doc-view').innerHTML = '<p class="empty">Could not load this style: ' + esc(e.message) + '</p>';
    }
  }

  /* ---------- stage (left): screenshots / sandbox / asset sheet / starter ---------- */
  function stopStage() {
    const f = $('#stage-view iframe');
    if (f) f.src = 'about:blank';
    $('#stage-view').innerHTML = '';
  }
  function setStage(which) {
    state.stage = which;
    win.querySelectorAll('[data-stage]').forEach((b) => b.setAttribute('aria-selected', b.dataset.stage === which));
    stopStage();
    const s = state.current, view = $('#stage-view'), foot = $('#stage-foot');
    const full = (href, label) => '<a href="' + href + '" target="_blank" rel="noopener">' + label + ' ↗</a>';
    if (which === 'shots') {
      view.innerHTML = '<img class="shot" src="shots/' + s.id + '.webp" alt="' + esc(s.name) + ' – Gameplay">' +
        '<div class="thumbs">' + VIEWS.map(([suf, label], i) => '<button type="button" data-suf="' + suf + '" aria-pressed="' + (i === 0) + '"><img src="shots/' + s.id + suf + '.webp" alt="' + label + '" loading="lazy"><span>' + label + '</span></button>').join('') + '</div>';
      view.querySelector('.thumbs').addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        view.querySelector('.shot').src = 'shots/' + s.id + b.dataset.suf + '.webp';
        view.querySelectorAll('.thumbs button').forEach((x) => x.setAttribute('aria-pressed', x === b));
      });
      foot.innerHTML = 'Screenshots from the reference game. ' + full('shots/' + s.id + '.webp', 'Full size');
      return;
    }
    const src = which === 'arena' ? 'sandbox.html?style=' + s.id + '&embed=1'
      : which === 'sheet' ? 'sandbox.html?style=' + s.id + '&mode=sheet&embed=1'
        : 'library/_kit/starter.html?style=' + s.id;
    view.innerHTML = '<iframe title="' + esc(s.name) + ' ' + which + '" src="' + src + '" allow="fullscreen"></iframe>';
    const notes = {
      arena: 'Small endless arena running the original style module. Click it, then <kbd>WASD</kbd> to move, <kbd>Space</kbd> to dash. The hero cannot die. ' + full(src.replace('&embed=1', ''), 'Full screen') + ' · ' + full('play.html?style=' + s.id, 'Full game'),
      sheet: 'Every actor, pickup and effect of the style side by side – the parts you need to redraw for your own game. ' + full(src.replace('&embed=1', ''), 'Full screen'),
      starter: 'This is <code>starter.js</code> running on its own – no dependencies. Copy it from the Code tab. ' + full(src, 'Full screen'),
    };
    foot.innerHTML = notes[which];
  }

  /* ---------- doc (right) ---------- */
  function setDoc(which) {
    state.doc = which;
    win.querySelectorAll('[data-doc]').forEach((b) => b.setAttribute('aria-selected', b.dataset.doc === which));
    const d = state.d;
    if (!d || d.id !== state.current.id) return;
    const view = $('#doc-view');
    view.innerHTML = docs[which](d);
    view.scrollTop = 0;
    if (which === 'tokens') for (const el of view.querySelectorAll('[data-css]')) el.style.cssText = el.dataset.css;
  }
  const section = (d, h) => (d.parts.sections[h] ? '<section class="md">' + MD.render('## ' + h + '\n\n' + d.parts.sections[h]) + '</section>' : '');

  const docs = {
    overview(d) {
      const s = d.spec, t = s.technique;
      const px = t.pixelArt ? 'Yes – ' + (t.pixelArt.scale || 1) + ' world unit per art pixel' : 'No';
      return '<p class="desc">' + esc(s.description) + '</p>' +
        '<dl class="facts">' +
        fact('Mood', s.mood.join(', ')) + fact('Best for', s.bestFor.join(', ')) + fact('Avoid for', s.avoidFor.join(', ')) +
        fact('Renderer', t.renderer) + fact('Pixel art', px) + fact('Resolution', t.resolution) +
        fact('Fonts', s.typography.map((f) => f.family).join(', ')) +
        '<div><dt>Effort to extend</dt><dd>' + stars(s.difficulty.stars) + ' <b>' + s.difficulty.stars + '/10</b> – ' + esc(s.difficulty.why) + '</dd></div>' +
        '</dl>' +
        '<h3>The core trick</h3><p>' + esc(t.summary) + '</p>' +
        '<div class="tech">' + [['Linework', t.linework], ['Shading', t.shading], ['Lighting', t.lighting], ['Texture', t.texture]].map(([k, v]) => '<div class="glass-sub"><h4>' + k + '</h4><p>' + esc(v) + '</p></div>').join('') + '</div>' +
        '<h3>Characters</h3><p>' + esc(s.characters.summary) + '</p>' + list(s.characters.rules) +
        '<div class="dodont"><div class="do"><h3>Do</h3>' + list(s.do) + '</div><div class="dont"><h3>Don’t</h3>' + list(s.dont) + '</div></div>' +
        '<p class="tags big">' + s.tags.map((x) => '<span>' + esc(x) + '</span>').join('') + '</p>';
    },
    tokens(d) {
      const s = d.spec;
      const cssVars = ':root {\n' + s.palette.map((c) => '  --' + slug(c.name) + ': ' + c.hex + '; /* ' + c.role.replace(/\*\//g, '') + ' */').join('\n') + '\n}';
      return '<div class="tok-head"><h3>Color palette</h3><span><button class="btn btn-small" type="button" data-act="copy-css">Copy as CSS variables</button>' +
        '<button class="btn btn-small" type="button" data-act="copy-json">Copy spec.json</button></span></div>' +
        '<div class="swatches">' + s.palette.map((c) => '<button type="button" class="sw" data-hex="' + c.hex + '" title="Copy ' + c.hex + '"><i style="background:' + c.hex + '"></i><b>' + esc(c.name) + '</b><code>' + c.hex + '</code><span>' + esc(c.role) + '</span></button>').join('') + '</div>' +
        list(s.paletteRules) +
        '<h3>Typography</h3><div class="type-list">' + s.typography.map((f) =>
          '<div class="type glass-sub"><div class="type-sample" data-css="' + esc(f.css) + '">' + esc(f.sample) + '</div>' +
          '<p><b>' + esc(f.family) + '</b> ' + (f.weights ? f.weights.join(' / ') : '') + ' · ' + esc(f.role) + ' · ' + esc(f.source || 'Google Fonts') + '</p>' +
          '<div class="code" data-lang="css"><button class="copy-code" type="button">Copy</button><pre><code>' + esc(f.css) + '</code></pre></div></div>').join('') + '</div>' +
        '<h3>Background</h3><p>' + esc(s.background.summary) + '</p><ol>' + s.background.layers.map((l) => '<li>' + MD.inline(l) + '</li>').join('') + '</ol>' +
        '<h3>Effects</h3><dl class="facts">' + s.effects.map((e) => fact(e.name, e.how)).join('') + '</dl>' +
        '<h3>Motion</h3>' + list(s.motion) +
        '<h3>UI / HUD</h3><p>' + esc(s.ui.summary) + '</p>' +
        '<div class="code" data-lang="css"><button class="copy-code" type="button">Copy</button><pre><code>' + esc(s.ui.css) + '</code></pre></div>' +
        '<h3>Performance</h3><p>' + esc(s.performance) + '</p>' +
        '<template id="css-vars">' + esc(cssVars) + '</template>';
    },
    recipe(d) {
      return DOC_RECIPE.map((h) => section(d, h)).join('');
    },
    code(d) {
      const lines = d.starter.split('\n').length;
      return '<div class="tok-head"><h3>starter.js <small>' + lines + ' lines · no dependencies</small></h3><span>' +
        '<button class="btn btn-small" type="button" data-act="preview">Run preview</button>' +
        '<a class="btn btn-small" href="' + d.base + 'starter.js" download="' + d.id + '-starter.js">Download</a></span></div>' +
        '<p>Drop it into any page: it registers <code>StyleStarters[\'' + d.id + '\']</code> with the palette, helpers like <code>drawHero(ctx, x, y, t, facing)</code> and <code>draw(ctx, w, h, t)</code>, which paints a full preview scene. Works as a CommonJS module too.</p>' +
        '<div class="code" data-lang="js"><button class="copy-code" type="button">Copy</button><pre><code>' + esc(d.starter) + '</code></pre></div>' +
        section(d, 'Code') +
        '<p class="note">Full reference implementation (all actors, ground, effects, HUD icons): <a href="js/styles/' + d.id + '.js" target="_blank" rel="noopener">js/styles/' + d.id + '.js</a> – it runs on the small game core in <code>js/core/</code>.</p>';
    },
    prompt(d) {
      const short = /```(?:text)?\n([\s\S]*?)```/.exec(d.parts.sections['Copy-paste prompt'] || '');
      const shortText = short ? short[1].trim() : '';
      return '<h3>Full prompt <small>spec + starter code, best results</small></h3>' +
        '<p>Paste this into your AI and replace the placeholder with your game. It contains the complete STYLE.md and starter.js, so the AI does not need web access.</p>' +
        '<div class="prompt-actions"><button class="btn btn-primary" type="button" data-act="copy-full">Copy full prompt</button><span>' + Math.round(fullPrompt(d).length / 1000) + 'k characters</span></div>' +
        '<div class="code" data-lang="text"><pre><code>' + esc(fullPrompt(d).slice(0, 1400)) + '\n…</code></pre></div>' +
        (shortText ? '<h3>Short prompt <small>for AIs with web access</small></h3><div class="code" data-lang="text"><button class="copy-code" type="button">Copy</button><pre><code>' + esc(shortText + '\n\nFull spec: ' + SITE + '/library/' + d.id + '/STYLE.md') + '</code></pre></div>' : '') +
        '<h3>Links for agents</h3><dl class="facts">' +
        fact('Spec', '<a href="' + d.base + 'STYLE.md">' + SITE + '/library/' + d.id + '/STYLE.md</a>', true) +
        fact('Tokens', '<a href="' + d.base + 'spec.json">' + SITE + '/library/' + d.id + '/spec.json</a>', true) +
        fact('Starter', '<a href="' + d.base + 'starter.js">' + SITE + '/library/' + d.id + '/starter.js</a>', true) +
        fact('Index', '<a href="llms.txt">' + SITE + '/llms.txt</a>', true) + '</dl>';
    },
    full(d) {
      return '<p class="note"><a href="' + d.base + 'STYLE.md" target="_blank" rel="noopener">Open raw STYLE.md ↗</a></p><section class="md">' + MD.render(d.md) + '</section>';
    },
  };
  const fact = (k, v, raw) => '<div><dt>' + esc(k) + '</dt><dd>' + (raw ? v : MD.inline(v)) + '</dd></div>';
  const slug = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const actions = {
    'copy-css': () => copy($('#css-vars').innerHTML.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&'), 'CSS variables'),
    'copy-json': () => copy(JSON.stringify(state.d.spec, null, 2), 'spec.json'),
    'copy-full': () => copy(fullPrompt(state.d), 'Prompt with full spec'),
    preview: () => setStage('starter'),
  };

  function fullPrompt(d) {
    return [
      'Build my game in the "' + d.spec.name + '" art style from the miwale Game Style Library (' + SITE + '/#' + d.id + ').',
      '',
      'Follow the style spec below exactly: its palette (hex values), fonts, rendering technique, character construction, effects, UI and motion rules. ' +
      'Keep every "Do", avoid every "Don\'t". Start from the starter code at the end and adapt it to my game instead of inventing a new look. ' +
      'Redesign characters and props for my game\'s theme, but build them with the same techniques and rules.',
      '',
      'MY GAME:',
      '[Describe your game here: genre, setting, hero, enemies, camera/perspective, platform]',
      '',
      '===== STYLE SPEC: ' + d.spec.name + ' (STYLE.md) =====',
      '',
      d.md.trim(),
      '',
      '===== STARTER CODE (starter.js, dependency-free Canvas 2D) =====',
      '',
      d.starter.trim(),
      '',
    ].join('\n');
  }

  init();
})();
