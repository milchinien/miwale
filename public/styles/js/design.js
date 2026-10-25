/* Design page: one style (/styles/<id>/) or a mix (/styles/design/?name=…&w=…&c=…&p=…&e=…&a=…&u=…).
   Every design element gets its own section with a live preview, its spec and its tokens. */
(function () {
  'use strict';
  const L = window.Lib, MD = window.MD, esc = L.esc;
  const root = document.getElementById('design');
  const $ = (s, el) => (el || document).querySelector(s);

  const VIEWS = [['', 'Scene'], ['_late', 'Dense scene'], ['_map', 'Wide view'], ['_lu', 'UI overlay'], ['_zoom', 'Close-up']];

  async function init() {
    const cat = await L.catalog();
    const ids = cat.styles.map((s) => s.id);
    const id = document.body.dataset.style;
    let d = id && ids.includes(id) ? L.single(id) : L.fromQuery(location.search, ids);
    if (!d) {
      root.innerHTML = '<section class="d-empty glass"><h1>Design not found</h1><p>This link does not describe a complete design. <a href="mix/">Mix your own</a> or <a href="./">browse the styles</a>.</p></section>';
      return;
    }
    const S = {};
    await Promise.all(L.sources(d).map(async (sid) => { S[sid] = await L.style(sid); }));
    render(d, S, cat);
  }

  function render(d, S, cat) {
    const single = L.isSingle(d) && !d.name;
    const main = S[d.picks.world];
    const src = (k) => S[d.picks[k]];
    const name = single ? main.spec.name : (d.name || 'Custom mix');
    document.title = name + (single ? ' – art style' : ' – custom mix') + ' · miwale Game Style Library';
    for (const sid in S) for (const f of S[sid].spec.typography) if (sid === d.picks.ui) L.loadFont(f.family, f.weights);

    const order = cat.styles.map((s) => s.id);
    const at = order.indexOf(main.id);
    const nav = single
      ? '<a class="icon-btn" href="' + order[(at - 1 + order.length) % order.length] + '/" aria-label="Previous style">‹</a><a class="icon-btn" href="' + order[(at + 1) % order.length] + '/" aria-label="Next style">›</a>'
      : '';
    const isSaved = !single && L.saved.find(d);
    const actions = single
      ? '<button class="btn btn-primary" type="button" data-act="prompt">Copy prompt</button>' +
        '<a class="btn btn-glass" href="' + main.base + 'STYLE.md" download="' + main.id + '-STYLE.md">STYLE.md</a>' +
        '<a class="btn btn-glass" href="mix/?' + L.toQuery(d) + '">Remix elements</a>' + nav
      : '<button class="btn btn-primary" type="button" data-act="prompt">Copy prompt</button>' +
        '<button class="btn btn-glass" type="button" data-act="save">' + (isSaved ? 'Saved ✓' : 'Save to My designs') + '</button>' +
        '<button class="btn btn-glass" type="button" data-act="share">Copy link</button>' +
        '<a class="btn btn-glass" href="mix/?' + L.toQuery(d) + '">Edit mix</a>' +
        '<button class="btn btn-glass" type="button" data-act="spec">Download spec</button>';

    const facts = single
      ? '<div class="d-facts">' +
        fact('Mood', main.spec.mood.join(', ')) + fact('Best for', main.spec.bestFor.join(', ')) +
        fact('Fonts', main.spec.typography.map((f) => f.family).join(', ')) +
        '<div class="d-fact"><span>Complexity</span><b>' + L.meter(main.spec.difficulty.stars) + ' ' + main.spec.difficulty.stars + '/10</b></div>' +
        '</div><p class="d-desc">' + esc(main.spec.description) + '</p>'
      : '<div class="d-recipe">' + L.ELEMENTS.map((e) => '<a href="' + d.picks[e.key] + '/#el-' + e.key + '" class="d-pick"><i style="background-image:url(shots/' + d.picks[e.key] + '_zoom.webp)"></i><span>' + e.name + '</span><b>' + esc(src(e.key).spec.name) + '</b></a>').join('') + '</div>';

    const stills = single
      ? '<div class="d-stills">' + VIEWS.map(([suf, label]) => '<button type="button" data-still="shots/' + main.id + suf + '.webp"><img loading="lazy" src="shots/' + main.id + suf + '.webp" alt="' + esc(main.spec.name) + ' – ' + label + '"><span>' + label + '</span></button>').join('') + '</div>'
      : '';

    const secNav = [['palette', 'Palette']].concat(L.ELEMENTS.map((e) => ['el-' + e.key, e.name]), [['technique', 'Technique'], ['prompt', 'Prompt']]);

    root.innerHTML =
      '<section class="d-hero">' +
        '<a class="d-back" href="./">← All styles</a>' +
        '<div class="d-head"><div><p class="eyebrow">' + (single ? esc(main.spec.family) : 'Custom mix · ' + L.sources(d).length + ' source styles') + '</p>' +
        '<h1>' + esc(name) + '</h1><p class="d-sum">' + esc(single ? main.spec.summary : 'Six design elements, each taken from a different style of the library.') + '</p></div>' +
        '<div class="d-actions">' + actions + '</div></div>' +
        '<div class="d-stage glass"><div class="frame16"><iframe title="Live scene" src="' + L.stageUrl(d, 'scene') + '" allow="fullscreen"></iframe></div>' +
        '<p class="d-cap">Live scene with all six elements together – rendered by the original style code. Click it, then <kbd>WASD</kbd> to walk around.' +
        ' <a href="' + L.stageUrl(d, 'scene').replace('&embed=1', '') + '" target="_blank" rel="noopener">Full screen ↗</a></p></div>' +
        stills + facts +
      '</section>' +
      '<nav class="d-nav glass" aria-label="Design elements">' + secNav.map(([h, l]) => '<a href="#' + h + '">' + esc(l) + '</a>').join('') + '</nav>' +
      paletteSection(d, S, single) +
      L.ELEMENTS.map((e, i) => elementSection(e, i, d, S, single)).join('') +
      techniqueSection(d, S, single) +
      promptSection(d, S, single);

    wire(d, S, single);
  }

  const fact = (k, v) => '<div class="d-fact"><span>' + esc(k) + '</span><b>' + esc(v) + '</b></div>';
  const list = (arr) => '<ul>' + arr.map((t) => '<li>' + MD.inline(t) + '</li>').join('') + '</ul>';
  const mdSection = (s, h) => (s.parts.sections[h] ? MD.render(s.parts.sections[h], { headingShift: 2 }) : '');

  function swatches(spec) {
    return '<div class="swatches">' + spec.palette.map((c) => '<button type="button" class="sw" data-hex="' + c.hex + '" title="Copy ' + c.hex + '"><i style="background:' + c.hex + '"></i><b>' + esc(c.name) + '</b><code>' + c.hex + '</code><span>' + esc(c.role) + '</span></button>').join('') + '</div>';
  }
  function paletteSection(d, S, single) {
    let body;
    if (single) {
      const s = S[d.picks.world];
      body = swatches(s.spec) + list(s.spec.paletteRules);
    } else {
      // one palette per source style, labelled with the elements it supplies
      body = L.sources(d).map((sid) => {
        const els = L.ELEMENTS.filter((e) => d.picks[e.key] === sid).map((e) => e.name).join(' · ');
        return '<h3>' + esc(S[sid].spec.name) + ' <small>for ' + esc(els) + '</small></h3>' + swatches(S[sid].spec);
      }).join('');
    }
    return '<section class="d-sec" id="palette"><header class="d-sec-head"><span class="d-num">00</span><div><h2>Palette</h2><p>Click a swatch to copy its hex value.</p></div>' +
      '<div class="d-sec-act"><button class="btn btn-small" type="button" data-act="css">Copy as CSS variables</button></div></header>' + body + '</section>';
  }

  function elementText(e, s) {
    const sp = s.spec;
    if (e.key === 'world') return '<p class="lead-sm">' + esc(sp.world.summary) + '</p><h4>Layers, bottom to top</h4><ol>' + sp.world.layers.map((l) => '<li>' + MD.inline(l) + '</li>').join('') + '</ol>';
    if (e.key === 'characters') return '<p class="lead-sm">' + esc(sp.characters.summary) + '</p><h4>Rules</h4>' + list(sp.characters.rules) + '<h4>Motion</h4>' + list(sp.motion);
    if (e.key === 'props') return '<p class="lead-sm">' + esc(sp.props.summary) + '</p><h4>Rules</h4>' + list(sp.props.rules);
    if (e.key === 'effects') return '<dl class="facts">' + sp.effects.map((x) => '<div><dt>' + esc(x.name) + '</dt><dd>' + MD.inline(x.how) + '</dd></div>').join('') + '</dl>';
    if (e.key === 'atmosphere') return '<p class="lead-sm">' + esc(sp.atmosphere.summary) + '</p><h4>Rules</h4>' + list(sp.atmosphere.rules);
    if (e.key === 'ui') {
      return '<p class="lead-sm">' + esc(sp.ui.summary) + '</p><h4>Typography</h4><div class="type-list">' + sp.typography.map((f) =>
        '<div class="type glass-sub"><div class="type-sample" data-css="' + esc(f.css) + '">' + esc(f.sample) + '</div>' +
        '<p><b>' + esc(f.family) + '</b> ' + (f.weights ? f.weights.join(' / ') : '') + ' · ' + esc(f.role) + '</p>' + code(f.css, 'css') + '</div>').join('') + '</div>' +
        '<h4>HUD CSS</h4>' + code(sp.ui.css, 'css');
    }
    return '';
  }
  const code = (txt, lang) => '<div class="code" data-lang="' + lang + '"><button class="copy-code" type="button">Copy</button><pre><code>' + esc(txt) + '</code></pre></div>';

  function elementSection(e, i, d, S, single) {
    const s = S[d.picks[e.key]];
    const badge = single ? '' : '<a class="d-src" href="' + s.id + '/#el-' + e.key + '">from ' + esc(s.spec.name) + ' ↗</a>';
    return '<section class="d-sec d-el" id="el-' + e.key + '">' +
      '<header class="d-sec-head"><span class="d-num">' + String(i + 1).padStart(2, '0') + '</span><div><h2>' + esc(e.name) + ' ' + badge + '</h2><p>' + esc(e.blurb) + '</p></div>' +
      '<div class="d-sec-act"><button class="btn btn-small" type="button" data-act="element" data-el="' + e.key + '">Copy ' + esc(e.name) + ' spec</button></div></header>' +
      '<div class="d-el-grid">' +
        '<div class="d-el-stage"><div class="frame16" data-src="' + esc(L.stageUrl(d, e.view)) + '"><span class="d-loading">Loading preview…</span></div>' +
        '<p class="d-cap">' + esc(e.name) + ' of ' + esc(s.spec.name) + ', isolated' + (e.key === 'atmosphere' ? ' – toggle it on and off in the corner' : '') + '.</p></div>' +
        '<div class="d-el-text">' + elementText(e, s) + '</div>' +
      '</div>' +
      '<details class="d-more"><summary>Full detail from STYLE.md</summary><div class="md">' + e.sections.map((h) => mdSection(s, h)).join('') + '</div></details>' +
      '</section>';
  }

  function techniqueSection(d, S, single) {
    let body;
    if (single) {
      const s = S[d.picks.world], t = s.spec.technique;
      body = '<dl class="facts">' + [['Renderer', t.renderer], ['Pixel art', t.pixelArt ? 'Yes – ' + (t.pixelArt.scale || 1) + ' world unit per art pixel' : 'No'], ['Resolution', t.resolution],
        ['Core trick', t.summary], ['Linework', t.linework], ['Shading', t.shading], ['Lighting', t.lighting], ['Texture', t.texture]].map(([k, v]) => '<div><dt>' + k + '</dt><dd>' + MD.inline(v) + '</dd></div>').join('') + '</dl>' +
        '<div class="dodont"><div class="do"><h3>Do</h3>' + list(s.spec.do) + '</div><div class="dont"><h3>Don’t</h3>' + list(s.spec.dont) + '</div></div>' +
        '<details class="d-more" open><summary>Rendering pipeline</summary><div class="md">' + mdSection(s, 'Rendering technique') + '</div></details>' +
        '<details class="d-more"><summary>Implementation recipe</summary><div class="md">' + mdSection(s, 'Implementation recipe') + '</div></details>' +
        '<details class="d-more"><summary>Starter code – starter.js (' + s.starter.split('\n').length + ' lines, no dependencies)</summary>' +
          '<p><a class="btn btn-small" href="' + s.base + 'starter.js" download="' + s.id + '-starter.js">Download starter.js</a> <a class="btn btn-small" href="library/_kit/starter.html?style=' + s.id + '" target="_blank" rel="noopener">Run it ↗</a></p>' +
          code(s.starter, 'js') + '<div class="md">' + mdSection(s, 'Code') + '</div></details>' +
        '<details class="d-more"><summary>Adapting it to your project</summary><div class="md">' + mdSection(s, 'Adapting it to your project') + '</div></details>' +
        '<details class="d-more"><summary>Performance notes</summary><div class="md">' + mdSection(s, 'Performance notes') + '</div></details>';
    } else {
      body = L.sources(d).map((sid) => {
        const s = S[sid];
        return '<details class="d-more"><summary>' + esc(s.spec.name) + ' – ' + esc(s.spec.technique.summary) + '</summary><div class="md">' + mdSection(s, 'Rendering technique') + '</div>' +
          '<div class="dodont"><div class="do"><h3>Do</h3>' + list(s.spec.do) + '</div><div class="dont"><h3>Don’t</h3>' + list(s.spec.dont) + '</div></div></details>';
      }).join('');
    }
    return '<section class="d-sec" id="technique"><header class="d-sec-head"><span class="d-num">07</span><div><h2>Technique</h2><p>' +
      (single ? 'How the look is produced – shared by all elements.' : 'The rendering technique of every source style. If one element is pixel art, the whole mix uses its pixel grid; otherwise the World style sets the resolution.') + '</p></div></header>' + body + '</section>';
  }

  function promptSection(d, S, single) {
    const full = single ? L.stylePrompt(S[d.picks.world]) : L.mixPrompt(d, S);
    const s = S[d.picks.world];
    const short = single && /```(?:text)?\n([\s\S]*?)```/.exec(s.parts.sections['Copy-paste prompt'] || '');
    return '<section class="d-sec" id="prompt"><header class="d-sec-head"><span class="d-num">08</span><div><h2>Prompt</h2><p>Paste it into your AI and describe your project in the marked spot. It contains the complete spec' + (single ? ' and starter code' : ' of every element') + ', so the AI needs no web access.</p></div>' +
      '<div class="d-sec-act"><button class="btn btn-primary" type="button" data-act="prompt">Copy full prompt</button></div></header>' +
      '<p class="note">' + Math.round(full.length / 1000) + 'k characters</p>' + code(full.slice(0, 1800) + '\n…', 'text') +
      (short ? '<h3>Short prompt <small>for AIs with web access</small></h3>' + code(short[1].trim() + '\n\nFull spec: ' + L.SITE + '/library/' + s.id + '/STYLE.md', 'text') : '') +
      '</section>';
  }

  /* ---------- behaviour ---------- */
  function wire(d, S, single) {
    for (const el of root.querySelectorAll('[data-css]')) el.style.cssText = el.dataset.css;

    // previews load when they come into view and are dropped again when they leave (saves CPU)
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        const box = en.target;
        clearTimeout(box._drop);
        if (en.isIntersecting && !box.querySelector('iframe')) {
          box.innerHTML = '<iframe title="Element preview" src="' + box.dataset.src + '"></iframe>';
        } else if (!en.isIntersecting && box.querySelector('iframe')) {
          box._drop = setTimeout(() => { box.innerHTML = '<span class="d-loading">Preview paused</span>'; }, 1500);
        }
      }
    }, { rootMargin: '150px 0px' });
    root.querySelectorAll('.frame16[data-src]').forEach((b) => io.observe(b));

    // stills: click opens a large view
    root.addEventListener('click', (ev) => {
      const st = ev.target.closest('[data-still]');
      if (st) return lightbox(st.dataset.still);
      const cp = ev.target.closest('.copy-code');
      if (cp) return L.copy(cp.parentElement.querySelector('code').textContent, 'Code');
      const sw = ev.target.closest('[data-hex]');
      if (sw) return L.copy(sw.dataset.hex, sw.dataset.hex);
      const a = ev.target.closest('[data-act]');
      if (!a) return;
      const act = a.dataset.act;
      if (act === 'prompt') L.copy(single ? L.stylePrompt(S[d.picks.world]) : L.mixPrompt(d, S), 'Prompt');
      if (act === 'element') L.copy(elementPrompt(L.byKey[a.dataset.el], d, S), L.byKey[a.dataset.el].name + ' spec');
      if (act === 'css') L.copy(cssVars(d, S), 'CSS variables');
      if (act === 'share') L.copy(location.origin + location.pathname + '?' + L.toQuery(d), 'Link');
      if (act === 'save') { L.saved.put(Object.assign({}, L.saved.find(d) || {}, d)); a.textContent = 'Saved ✓'; L.toast('Saved to My designs'); }
      if (act === 'spec') L.download(slug(d.name || 'custom-mix') + '-spec.json', JSON.stringify(mixSpec(d, S), null, 2), 'application/json');
    });

    // highlight the section in view
    const links = [...root.querySelectorAll('.d-nav a')];
    const so = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) links.forEach((l) => l.classList.toggle('on', l.getAttribute('href') === '#' + en.target.id));
    }, { rootMargin: '-40% 0px -55% 0px' });
    root.querySelectorAll('.d-sec').forEach((s) => so.observe(s));
    if (location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t) setTimeout(() => t.scrollIntoView(), 50); }
  }

  function lightbox(src) {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = '<img src="' + esc(src) + '" alt="">';
    lb.onclick = () => lb.remove();
    document.addEventListener('keydown', function k(e) { if (e.key === 'Escape') { lb.remove(); document.removeEventListener('keydown', k); } });
    document.body.appendChild(lb);
  }

  function elementPrompt(e, d, S) {
    const s = S[d.picks[e.key]];
    return ['Use the ' + e.name + ' element of the "' + s.spec.name + '" art style (' + L.SITE + '/' + s.id + '/#el-' + e.key + ') for my project. Build it exactly as specified:', '',
      ...e.sections.map((h) => '## ' + h + '\n\n' + (s.parts.sections[h] || '').trim() + '\n'),
      '## Palette', '', s.spec.palette.map((c) => '- ' + c.name + ' ' + c.hex + ': ' + c.role).join('\n'), '',
      '## Rendering technique (shared by all elements of this style)', '', (s.parts.sections['Rendering technique'] || '').trim(), ''].join('\n');
  }
  function cssVars(d, S) {
    const out = [':root {'];
    for (const sid of L.sources(d)) {
      if (!L.isSingle(d)) out.push('  /* ' + S[sid].spec.name + ' */');
      for (const c of S[sid].spec.palette) out.push('  --' + (L.isSingle(d) ? '' : sid + '-') + slug(c.name) + ': ' + c.hex + ';');
    }
    out.push('}');
    return out.join('\n');
  }
  function mixSpec(d, S) {
    const src = (k) => S[d.picks[k]].spec;
    return {
      name: d.name || 'Custom mix', kind: 'miwale-style-mix', url: L.SITE + '/' + L.designUrl(d),
      sources: Object.fromEntries(L.ELEMENTS.map((e) => [e.key, { id: d.picks[e.key], name: src(e.key).name, spec: L.SITE + '/library/' + d.picks[e.key] + '/STYLE.md' }])),
      world: src('world').world, characters: Object.assign({}, src('characters').characters, { motion: src('characters').motion }),
      props: src('props').props, effects: src('effects').effects, atmosphere: src('atmosphere').atmosphere,
      ui: src('ui').ui, typography: src('ui').typography,
      palettes: Object.fromEntries(L.sources(d).map((sid) => [sid, S[sid].spec.palette])),
      technique: Object.fromEntries(L.sources(d).map((sid) => [sid, S[sid].spec.technique])),
    };
  }
  const slug = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  init().catch((e) => { root.innerHTML = '<p class="empty">Could not load this design: ' + esc(e.message) + '</p>'; });
})();
