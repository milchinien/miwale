/* Game Style Library – gallery: filter, search, sort (default: most popular by votes), community designs, "My designs".
   Each style opens its own page /styles/<id>/. */
(function () {
  'use strict';
  const L = window.Lib, esc = L.esc;
  const $ = (s) => document.querySelector(s);
  const state = { list: [], group: 'all', q: '', sort: 'popular' };

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
    await L.votes.load();
    renderGrid();
    renderCommunity();
    $('#q').addEventListener('input', (e) => { state.q = e.target.value.trim().toLowerCase(); renderGrid(); });
    $('#sort').addEventListener('change', (e) => { state.sort = e.target.value; renderGrid(); });
    document.querySelector('[data-copy-llms]').addEventListener('click', () =>
      L.copy('Use the miwale Game Style Library for the art style of my project: ' + L.SITE + '/llms.txt – pick the style that fits, read its STYLE.md completely and follow it.', 'Instruction'));
  }

  const nameOf = (id) => (state.list.find((s) => s.id === id) || { name: id }).name;

  function buildChips() {
    const groups = ['all'];
    if (state.list.some((s) => s.original)) groups.push('new');
    if (state.list.some((s) => s.variantOf)) groups.push('variants');
    for (const s of state.list) if (!groups.includes(s.group)) groups.push(s.group);
    const box = $('#chips');
    box.innerHTML = groups.map((g) => {
      const n = g === 'all' ? state.list.length : g === 'new' ? state.list.filter((s) => s.original).length
        : g === 'variants' ? state.list.filter((s) => s.variantOf).length : state.list.filter((s) => s.group === g).length;
      const label = g === 'all' ? 'All' : g === 'new' ? '✦ New' : g === 'variants' ? '⟲ Variants' : esc(g);
      return '<button type="button" class="chip' + (g === 'new' ? ' chip-new' : '') + '" data-group="' + esc(g) + '" aria-pressed="' + (g === state.group) + '">' + label + ' <span>' + n + '</span></button>';
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
    let arr = state.list.filter((s) => state.group === 'all' || (state.group === 'new' ? s.original : state.group === 'variants' ? s.variantOf : s.group === state.group));
    if (state.q) arr = arr.filter((s) => [s.name, s.family, s.summary, s.group, ...s.tags, ...s.mood, ...s.bestFor, ...s.fonts].join(' ').toLowerCase().includes(state.q));
    const base = (s) => state.list.indexOf(s);
    const pop = (s) => L.votes.score('style:' + s.id);
    if (state.sort === 'popular') arr.sort((a, b) => pop(b) - pop(a) || base(a) - base(b));
    if (state.sort === 'new') arr.sort((a, b) => (b.original ? 1 : 0) - (a.original ? 1 : 0) || base(b) - base(a));
    if (state.sort === 'easy') arr.sort((a, b) => a.difficulty - b.difficulty || base(a) - base(b));
    if (state.sort === 'hard') arr.sort((a, b) => b.difficulty - a.difficulty || base(a) - base(b));
    if (state.sort === 'name') arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }

  /** Rank 1–3 by votes across all styles (only once a style has votes). */
  function ranks() {
    const scored = state.list.map((s) => [s.id, L.votes.score('style:' + s.id)]).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    return Object.fromEntries(scored.slice(0, 3).map(([id], i) => [id, i + 1]));
  }

  function renderGrid() {
    const arr = visible();
    const rank = ranks();
    $('#result-info').textContent = arr.length === state.list.length ? '' : arr.length + ' of ' + state.list.length + ' styles';
    if (!arr.length) { $('#grid').innerHTML = '<p class="empty">No style matches – try “pixel”, “dark” or “cozy”.</p>'; return; }
    $('#grid').innerHTML = arr.map((s) => {
      const n = state.list.indexOf(s) + 1;
      const badges = (rank[s.id] ? '<span class="badge badge-rank badge-' + rank[s.id] + '">#' + rank[s.id] + ' Top rated</span>' : '') +
        (s.original ? '<span class="badge badge-new">✦ New</span>' : '');
      return '<a class="card" href="' + s.id + '/">' +
        '<div class="card-media"><img loading="lazy" src="shots/klein/' + s.id + '.webp" alt="' + esc(s.name) + ' – scene" width="800" height="450">' +
        '<img class="alt" loading="lazy" src="shots/klein/' + s.id + '_zoom.webp" alt="" aria-hidden="true">' +
        (badges ? '<div class="badges">' + badges + '</div>' : '') + '</div>' +
        '<div class="card-palette" aria-hidden="true">' + s.palette.slice(0, 10).map((h) => '<i style="background:' + h + '"></i>').join('') + '</div>' +
        '<div class="card-body">' +
        '<p class="eyebrow">' + String(n).padStart(2, '0') + ' · ' + esc(s.family) + '</p>' +
        '<h3>' + esc(s.name) + '</h3>' +
        (s.variantOf ? '<p class="card-variant">⟲ Variant of ' + esc(nameOf(s.variantOf)) + '</p>' : '') +
        '<p class="card-sum">' + esc(s.summary) + '</p>' +
        '<div class="card-meta">' + L.voteWidget('style:' + s.id, 'sm') +
        '<span class="effort" title="How hard it is to create new assets in this style (1 simple – 10 elaborate)">' + L.meter(s.difficulty) + s.difficulty + '/10</span></div>' +
        '</div></a>';
    }).join('');
  }

  function renderCommunity() {
    const top = L.votes.mixes().slice(0, 6);
    $('#community').hidden = !top.length;
    $('#community-grid').innerHTML = top.map((x) => L.mixCard(x, { nameOf, community: true })).join('');
  }

  function renderMine() {
    const all = L.saved.list();
    $('#mine').hidden = !all.length;
    if (!all.length) return;
    $('#mine-grid').innerHTML = all.map((x) => L.mixCard(x, { nameOf })).join('') + '<a class="card mine-new" href="mix/"><span>+</span><b>Mix a new design</b></a>';
  }

  init();
})();
