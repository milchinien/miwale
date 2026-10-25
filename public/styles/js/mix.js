/* Mixer: one source style per design element, live preview, saved designs ("My designs"). */
(function () {
  'use strict';
  const L = window.Lib, esc = L.esc;
  const $ = (s) => document.querySelector(s);
  const VIEW_TABS = [['scene', 'Whole design']].concat(L.ELEMENTS.map((e) => [e.view, e.name]));
  let cat, ids, d, view = 'scene', savedId = null;

  async function init() {
    cat = await L.catalog();
    ids = cat.styles.map((s) => s.id);
    d = L.fromQuery(location.search, ids) || { name: '', picks: { world: 'watercolor', characters: 'cartoon', props: 'voxel', effects: 'neon', atmosphere: 'dusk', ui: 'paper' } };
    const match = L.saved.find(d);
    savedId = match ? match.id : null;
    $('#mix-name').value = d.name || (match ? match.name : '');
    $('#mix-base').insertAdjacentHTML('beforeend', cat.styles.map((s) => '<option value="' + s.id + '">' + esc(s.name) + '</option>').join(''));
    $('#mix-views').innerHTML = VIEW_TABS.map(([v, l]) => '<button role="tab" type="button" data-view="' + v + '" aria-selected="' + (v === view) + '">' + esc(l) + '</button>').join('');
    renderPickers();
    update(true);
    renderMine();
    wire();
  }

  const nameOf = (id) => cat.styles.find((s) => s.id === id).name;

  function renderPickers() {
    $('#pickers').innerHTML = L.ELEMENTS.map((e, i) =>
      '<section class="pick glass" data-el="' + e.key + '">' +
        '<header><span class="d-num">' + String(i + 1).padStart(2, '0') + '</span><div><h2>' + esc(e.name) + '</h2><p>' + esc(e.blurb) + '</p></div>' +
        '<a class="pick-now" href="' + d.picks[e.key] + '/#el-' + e.key + '" title="Open this element in its style">' + esc(nameOf(d.picks[e.key])) + ' ↗</a></header>' +
        '<div class="pick-row" role="radiogroup" aria-label="' + esc(e.name) + ' source">' + cat.styles.map((s) =>
          '<button type="button" role="radio" class="pick-opt" data-id="' + s.id + '" aria-checked="' + (d.picks[e.key] === s.id) + '" title="' + esc(s.name) + '">' +
          '<i style="background-image:url(shots/' + s.id + '_zoom.webp)"></i><span>' + esc(s.name) + '</span></button>').join('') + '</div>' +
      '</section>').join('');
  }

  let reload = null;
  function update(now) {
    d.name = $('#mix-name').value.trim();
    // keep the address shareable at all times
    history.replaceState(null, '', location.pathname + '?' + L.toQuery(d));
    for (const sec of document.querySelectorAll('.pick')) {
      const k = sec.dataset.el;
      sec.querySelectorAll('.pick-opt').forEach((b) => b.setAttribute('aria-checked', b.dataset.id === d.picks[k]));
      const a = sec.querySelector('.pick-now');
      a.textContent = nameOf(d.picks[k]) + ' ↗';
      a.href = d.picks[k] + '/#el-' + k;
    }
    const el = L.ELEMENTS.find((e) => e.view === view);
    $('#mix-cap').textContent = view === 'scene'
      ? L.sources(d).length + ' source style' + (L.sources(d).length > 1 ? 's' : '') + ' · click the preview, then WASD to walk around.'
      : el.name + ' from ' + nameOf(d.picks[el.key]) + ', isolated.';
    clearTimeout(reload);
    reload = setTimeout(() => {
      $('#mix-frame').innerHTML = '<iframe title="Mix preview" src="' + esc(L.stageUrl(d, view)) + '"></iframe>';
    }, now ? 0 : 350);
    const isSaved = savedId && L.saved.list().some((x) => x.id === savedId && L.ELEMENTS.every((e) => x.picks[e.key] === d.picks[e.key]) && x.name === (d.name || x.name));
    $('#mix-save').textContent = isSaved ? 'Saved ✓' : savedId ? 'Save changes' : 'Save to My designs';
  }

  function wire() {
    $('#pickers').addEventListener('click', (ev) => {
      const b = ev.target.closest('.pick-opt');
      if (!b) return;
      d.picks[b.closest('.pick').dataset.el] = b.dataset.id;
      update();
    });
    $('#mix-views').addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-view]');
      if (!b) return;
      view = b.dataset.view;
      $('#mix-views').querySelectorAll('button').forEach((x) => x.setAttribute('aria-selected', x === b));
      update(true);
    });
    $('#mix-name').addEventListener('input', () => update());
    $('#mix-random').addEventListener('click', () => {
      for (const e of L.ELEMENTS) d.picks[e.key] = ids[(Math.random() * ids.length) | 0];
      update();
    });
    $('#mix-base').addEventListener('change', (ev) => {
      const id = ev.target.value;
      if (!id) return;
      for (const e of L.ELEMENTS) d.picks[e.key] = id;
      ev.target.value = '';
      update();
    });
    $('#mix-save').addEventListener('click', () => {
      if (!d.name) { d.name = suggestName(); $('#mix-name').value = d.name; }
      const item = L.saved.put({ id: savedId, name: d.name, picks: Object.assign({}, d.picks) });
      savedId = item.id;
      L.toast('Saved to My designs');
      update(true);
      renderMine();
    });
    $('#mix-open').addEventListener('click', () => { location.href = 'design/?' + L.toQuery(Object.assign({}, d, { name: d.name || suggestName() })); });
    $('#mix-link').addEventListener('click', () => L.copy(location.origin + '/styles/design/?' + L.toQuery(Object.assign({}, d, { name: d.name || suggestName() })), 'Link'));
    $('#mix-prompt').addEventListener('click', async () => {
      const S = {};
      await Promise.all(L.sources(d).map(async (sid) => { S[sid] = await L.style(sid); }));
      L.copy(L.mixPrompt(Object.assign({}, d, { name: d.name || suggestName() }), S), 'Prompt');
    });
    $('#mine-grid').addEventListener('click', (ev) => {
      const del = ev.target.closest('[data-del]');
      if (del) { L.saved.remove(del.dataset.del); if (savedId === del.dataset.del) savedId = null; renderMine(); update(true); }
    });
  }

  function suggestName() {
    const w = nameOf(d.picks.world).split(' ')[0], c = nameOf(d.picks.characters).split(' ')[0];
    return w === c ? nameOf(d.picks.world) + ' remix' : c + ' × ' + w;
  }

  function renderMine() {
    const all = L.saved.list();
    $('#mine-grid').innerHTML = all.length ? all.map((x) => mineCard(x, true)).join('')
      : '<p class="empty">No designs yet. Pick six elements above and press “Save to My designs”.</p>';
  }
  function mineCard(x, editable) {
    const href = 'design/?' + L.toQuery(x);
    return '<article class="card mine-card">' +
      '<a class="card-media" href="' + href + '">' + L.collage(x) + '</a>' +
      '<div class="card-body"><p class="eyebrow">Custom mix · ' + L.sources(x).length + ' styles</p><h3><a href="' + href + '">' + esc(x.name) + '</a></h3>' +
      '<p class="card-sum">' + L.ELEMENTS.map((e) => '<b>' + e.name + '</b> ' + esc(nameOf(x.picks[e.key]))).join(' · ') + '</p>' +
      '<div class="card-meta"><a class="btn btn-small" href="mix/?' + L.toQuery(x) + '">Edit</a>' + (editable ? '<button class="btn btn-small" type="button" data-del="' + esc(x.id) + '">Delete</button>' : '') + '</div></div></article>';
  }
  window.MixCards = { mineCard };

  init().catch((e) => { $('#pickers').innerHTML = '<p class="empty">Could not load the styles: ' + esc(e.message) + '</p>'; });
})();
