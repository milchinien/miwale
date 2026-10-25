/* Game Style Library – gallery: filter, search, sort, "My designs". Each style opens its own page /styles/<id>/. */
(function () {
  'use strict';
  const L = window.Lib, esc = L.esc;
  const $ = (s) => document.querySelector(s);
  const state = { list: [], group: 'all', q: '', sort: 'order' };

  async function init() {
    let cat;
    try { cat = await L.catalog(); } catch (e) {
      $('#grid').innerHTML = '<p class="empty">Could not load the style catalog.</p>';
      return;
    }
    state.list = cat.styles;
    document.querySelectorAll('.count').forEach((el) => (el.textContent = state.list.length));
    // old links (#neon) pointed at the former pop-up window – send them to the style page
    const old = decodeURIComponent(location.hash.slice(1));
    if (state.list.some((s) => s.id === old)) { location.replace(old + '/'); return; }
    buildChips();
    renderGrid();
    renderMine();
    $('#q').addEventListener('input', (e) => { state.q = e.target.value.trim().toLowerCase(); renderGrid(); });
    $('#sort').addEventListener('change', (e) => { state.sort = e.target.value; renderGrid(); });
    document.querySelector('[data-copy-llms]').addEventListener('click', () =>
      L.copy('Use the miwale Game Style Library for the art style of my project: ' + L.SITE + '/llms.txt – pick the style that fits, read its STYLE.md completely and follow it.', 'Instruction'));
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
    if (state.q) arr = arr.filter((s) => [s.name, s.family, s.summary, s.group, ...s.tags, ...s.mood, ...s.bestFor, ...s.fonts].join(' ').toLowerCase().includes(state.q));
    const base = (s) => state.list.indexOf(s);
    if (state.sort === 'easy') arr.sort((a, b) => a.difficulty - b.difficulty || base(a) - base(b));
    if (state.sort === 'hard') arr.sort((a, b) => b.difficulty - a.difficulty || base(a) - base(b));
    if (state.sort === 'name') arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }

  function renderGrid() {
    const arr = visible();
    $('#result-info').textContent = arr.length === state.list.length ? '' : arr.length + ' of ' + state.list.length + ' styles';
    if (!arr.length) { $('#grid').innerHTML = '<p class="empty">No style matches – try “pixel”, “dark” or “cozy”.</p>'; return; }
    $('#grid').innerHTML = arr.map((s) => {
      const n = state.list.indexOf(s) + 1;
      return '<a class="card" href="' + s.id + '/">' +
        '<div class="card-media"><img loading="lazy" src="shots/' + s.id + '.webp" alt="' + esc(s.name) + ' – scene" width="1600" height="900">' +
        '<img class="alt" loading="lazy" src="shots/' + s.id + '_zoom.webp" alt="" aria-hidden="true"></div>' +
        '<div class="card-palette" aria-hidden="true">' + s.palette.slice(0, 10).map((h) => '<i style="background:' + h + '"></i>').join('') + '</div>' +
        '<div class="card-body">' +
        '<p class="eyebrow">' + String(n).padStart(2, '0') + ' · ' + esc(s.family) + '</p>' +
        '<h3>' + esc(s.name) + '</h3>' +
        '<p class="card-sum">' + esc(s.summary) + '</p>' +
        '<div class="card-meta"><span class="tags">' + s.tags.slice(0, 3).map((t) => '<span>' + esc(t) + '</span>').join('') + '</span>' +
        '<span class="effort" title="How hard it is to create new assets in this style (1 simple – 10 elaborate)">' + L.meter(s.difficulty) + s.difficulty + '/10</span></div>' +
        '</div></a>';
    }).join('');
  }

  function renderMine() {
    const all = L.saved.list();
    const sec = $('#mine');
    sec.hidden = !all.length;
    if (!all.length) return;
    const nameOf = (id) => (state.list.find((s) => s.id === id) || { name: id }).name;
    $('#mine-grid').innerHTML = all.map((x) => {
      const href = 'design/?' + L.toQuery(x);
      return '<article class="card mine-card"><a class="card-media" href="' + href + '">' + L.collage(x) + '</a>' +
        '<div class="card-body"><p class="eyebrow">Custom mix · ' + L.sources(x).length + ' styles</p><h3><a href="' + href + '">' + esc(x.name) + '</a></h3>' +
        '<p class="card-sum">' + L.ELEMENTS.map((e) => '<b>' + e.name + '</b> ' + esc(nameOf(x.picks[e.key]))).join(' · ') + '</p>' +
        '<div class="card-meta"><a class="btn btn-small" href="mix/?' + L.toQuery(x) + '">Edit</a></div></div></article>';
    }).join('') + '<a class="card mine-new" href="mix/"><span>+</span><b>Mix a new design</b></a>';
  }

  init();
})();
