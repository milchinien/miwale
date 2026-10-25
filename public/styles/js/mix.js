/* Mixer: one source style per design element, live preview, saved designs ("My designs"),
   community designs and votes. Each picker lists the sources by the community's votes for that element. */
(function () {
  'use strict';
  const L = window.Lib, esc = L.esc;
  const $ = (s) => document.querySelector(s);
  const VIEW_TABS = [['scene', 'Whole design']].concat(L.ELEMENTS.map((e) => [e.view, e.name]));
  // which preview image shows an element best
  const THUMB = { world: '_map', characters: '_zoom', props: '', effects: '_late', atmosphere: '', ui: '_lu' };
  let cat, ids, d, view = 'scene', savedId = null, published = null;

  async function init() {
    cat = await L.catalog();
    ids = cat.styles.map((s) => s.id);
    d = L.fromQuery(location.search, ids) || { name: '', picks: { world: 'chalk', characters: 'cartoon', props: 'voxel', effects: 'neon', atmosphere: 'chalk', ui: 'paper' } };
    const match = L.saved.find(d);
    savedId = match ? match.id : null;
    $('#mix-name').value = d.name || (match ? match.name : '');
    $('#mix-base').insertAdjacentHTML('beforeend', cat.styles.map((s) => '<option value="' + s.id + '">' + esc(s.name) + '</option>').join(''));
    $('#mix-views').innerHTML = VIEW_TABS.map(([v, l]) => '<button role="tab" type="button" data-view="' + v + '" aria-selected="' + (v === view) + '">' + esc(l) + '</button>').join('');
    renderPickers();
    update(true);
    renderMine();
    wire();
    await L.votes.load();
    renderPickers();
    update(true);
    renderCommunity();
    if (location.hash === '#community' || location.hash === '#mine') document.querySelector(location.hash).scrollIntoView();
  }

  const nameOf = (id) => (cat.styles.find((s) => s.id === id) || { name: id }).name;
  const elScore = (id, key) => L.votes.score('el:' + id + ':' + key);

  function renderPickers() {
    $('#pickers').innerHTML = L.ELEMENTS.map((e, i) => {
      // most liked sources for this element first; without votes the library order stays
      const order = cat.styles.slice().sort((a, b) => elScore(b.id, e.key) - elScore(a.id, e.key) || cat.styles.indexOf(a) - cat.styles.indexOf(b));
      return '<section class="pick glass" data-el="' + e.key + '">' +
        '<header><span class="d-num">' + String(i + 1).padStart(2, '0') + '</span><div><h2>' + esc(e.name) + '</h2><p>' + esc(e.blurb) + '</p></div>' +
        '<a class="pick-now" href="' + d.picks[e.key] + '/#el-' + e.key + '" title="Open this element in its style">' + esc(nameOf(d.picks[e.key])) + ' ↗</a></header>' +
        '<div class="pick-rate"><span>Rate the ' + esc(e.name.toLowerCase()) + ' of <b class="pick-rate-name">' + esc(nameOf(d.picks[e.key])) + '</b></span>' +
          '<span class="pick-rate-vote">' + L.voteWidget('el:' + d.picks[e.key] + ':' + e.key, 'sm') + '</span><span class="pick-sorted">Sorted by community votes</span></div>' +
        '<div class="pick-grid" role="radiogroup" aria-label="' + esc(e.name) + ' source">' + order.map((s) => {
          const c = L.votes.count('el:' + s.id + ':' + e.key);
          return '<button type="button" role="radio" class="pick-opt" data-id="' + s.id + '" aria-checked="' + (d.picks[e.key] === s.id) + '" title="' + esc(s.name) + '">' +
            '<i style="background-image:url(shots/' + s.id + THUMB[e.key] + '.webp)">' + (s.original ? '<em class="badge badge-new">✦ New</em>' : '') + '</i>' +
            '<span>' + esc(s.name) + '</span>' + (c.hoch || c.runter ? '<small>▲ ' + c.hoch + ' · ▼ ' + c.runter + '</small>' : '<small>no votes yet</small>') + '</button>';
        }).join('') + '</div>' +
      '</section>';
    }).join('');
  }

  let reload = null;
  function update(now) {
    d.name = $('#mix-name').value.trim();
    // keep the address shareable at all times
    history.replaceState(null, '', location.pathname + '?' + L.toQuery(d) + location.hash);
    for (const sec of document.querySelectorAll('.pick')) {
      const k = sec.dataset.el;
      sec.querySelectorAll('.pick-opt').forEach((b) => b.setAttribute('aria-checked', b.dataset.id === d.picks[k]));
      const a = sec.querySelector('.pick-now');
      a.textContent = nameOf(d.picks[k]) + ' ↗';
      a.href = d.picks[k] + '/#el-' + k;
      sec.querySelector('.pick-rate-name').textContent = nameOf(d.picks[k]);
      sec.querySelector('.pick-rate-vote').innerHTML = L.voteWidget('el:' + d.picks[k] + ':' + k, 'sm');
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
    // already in the community? then the publish button opens it instead
    published = L.votes.data.mixe.find((m) => L.ELEMENTS.every((e) => m.picks[e.key] === d.picks[e.key])) || null;
    const single = L.sources(d).length < 2;
    $('#mix-publish').disabled = single;
    $('#mix-publish').textContent = published ? 'In the community ✓ – open' : 'Publish to community';
    $('#mix-publish').title = single ? 'A community design needs elements from at least two styles' : '';
  }

  const named = () => Object.assign({}, d, { name: d.name || suggestName() });

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
    $('#mix-publish').addEventListener('click', async () => {
      if (published) { location.href = 'design/?' + L.toQuery(published) + '&m=' + encodeURIComponent(published.id); return; }
      if (!d.name) { d.name = suggestName(); $('#mix-name').value = d.name; }
      try {
        const r = await L.votes.publish(named());
        L.toast(r.vorhanden ? 'This mix is already in the community – opened it' : 'Published – thanks!');
        update(true);
        renderCommunity();
      } catch (e) {
        const msg = { woerter: 'Please choose another name', name: 'Please give your design a name (max. 40 characters)', 'zu-schnell': 'Too many designs at once – try again in a few minutes', 'kein-mix': 'Mix elements from at least two styles first' }[e.message];
        L.toast(msg || 'Publishing failed');
      }
    });
    $('#mix-open').addEventListener('click', () => { location.href = 'design/?' + L.toQuery(named()) + (published ? '&m=' + encodeURIComponent(published.id) : ''); });
    $('#mix-link').addEventListener('click', () => L.copy(location.origin + '/styles/design/?' + L.toQuery(named()) + (published ? '&m=' + encodeURIComponent(published.id) : ''), 'Link'));
    $('#mix-prompt').addEventListener('click', async () => {
      const S = {};
      await Promise.all(L.sources(d).map(async (sid) => { S[sid] = await L.style(sid); }));
      L.copy(L.mixPrompt(named(), S), 'Prompt');
    });
    $('#mine-grid').addEventListener('click', (ev) => {
      const del = ev.target.closest('[data-del]');
      if (del) { L.saved.remove(del.dataset.del); if (savedId === del.dataset.del) savedId = null; renderMine(); update(true); }
    });
    $('#community-sort').addEventListener('change', renderCommunity);
  }

  function suggestName() {
    const w = nameOf(d.picks.world).split(' ')[0], c = nameOf(d.picks.characters).split(' ')[0];
    return w === c ? nameOf(d.picks.world) + ' remix' : c + ' × ' + w;
  }

  function renderMine() {
    const all = L.saved.list();
    $('#mine-grid').innerHTML = all.length ? all.map((x) => L.mixCard(x, { nameOf, editable: true })).join('')
      : '<p class="empty">No designs yet. Pick six elements above and press “Save to My designs”.</p>';
  }
  function renderCommunity() {
    const sort = $('#community-sort').value;
    let list = L.votes.mixes();
    if (sort === 'new') list = list.slice().sort((a, b) => b.zeit.localeCompare(a.zeit));
    $('#community-grid').innerHTML = list.length ? list.map((x) => L.mixCard(x, { nameOf, community: true })).join('')
      : '<p class="empty">' + (L.votes.offline ? 'Community designs are not available right now.' : 'Nothing published yet – be the first: name your mix and press “Publish to community”.') + '</p>';
  }

  init().catch((e) => { $('#pickers').innerHTML = '<p class="empty">Could not load the styles: ' + esc(e.message) + '</p>'; });
})();
