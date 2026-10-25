/* Shared by the library pages (gallery, design page, mixer): data loading, design elements, prompts, saved mixes. */
(function () {
  'use strict';
  const SITE = 'https://miwale.com/styles';

  /** The six design elements. `layer` is the stage parameter, `sections` the STYLE.md headings that describe it. */
  const ELEMENTS = [
    { key: 'world', layer: 'world', view: 'world', name: 'World', short: 'W', icon: '◧', blurb: 'Ground, terrain regions, paths, water and ground decals.', sections: ['World and ground'] },
    { key: 'characters', layer: 'chars', view: 'characters', name: 'Characters', short: 'C', icon: '☺', blurb: 'The main character and the creatures: construction, faces, outline, animation.', sections: ['Characters', 'Motion and animation'] },
    { key: 'props', layer: 'props', view: 'props', name: 'Props', short: 'P', icon: '♣', blurb: 'Scenery objects: trees, rocks, buildings, fences, plants.', sections: ['Props'] },
    { key: 'effects', layer: 'fx', view: 'effects', name: 'Effects', short: 'E', icon: '✦', blurb: 'Projectiles, collectibles, orbiting objects, particles, impacts and bursts.', sections: ['Effects and particles'] },
    { key: 'atmosphere', layer: 'atmo', view: 'atmosphere', name: 'Atmosphere', short: 'A', icon: '☾', blurb: 'Shadows, light, glow, fog, vignette, frames and colour grading.', sections: ['Atmosphere and lighting'] },
    { key: 'ui', layer: 'ui', view: 'ui', name: 'UI & type', short: 'U', icon: '▤', blurb: 'Panels, bars, counters, cards, icons and fonts.', sections: ['UI', 'Typography'] },
  ];
  const byKey = Object.fromEntries(ELEMENTS.map((e) => [e.key, e]));

  const cache = {};
  async function text(url) {
    if (cache[url] !== undefined) return cache[url];
    const r = await fetch(url);
    if (!r.ok) throw new Error(url + ': ' + r.status);
    return (cache[url] = await r.text());
  }
  let catalogP = null;
  const catalog = () => (catalogP = catalogP || text('styles.json').then(JSON.parse));
  async function style(id) {
    const base = 'library/' + id + '/';
    const [spec, md, starter] = await Promise.all([text(base + 'spec.json').then(JSON.parse), text(base + 'STYLE.md'), text(base + 'starter.js')]);
    return { id, spec, md, starter, parts: window.MD.sections(md), base };
  }

  /* ---------- designs: a design = a name + one source style per element ---------- */
  const PARAM = { world: 'w', characters: 'c', props: 'p', effects: 'e', atmosphere: 'a', ui: 'u' };
  const single = (id) => ({ name: '', picks: Object.fromEntries(ELEMENTS.map((e) => [e.key, id])) });
  const isSingle = (d) => new Set(Object.values(d.picks)).size === 1;
  const sources = (d) => [...new Set(ELEMENTS.map((e) => d.picks[e.key]))];
  function toQuery(d) {
    const q = new URLSearchParams();
    if (d.name) q.set('name', d.name);
    for (const e of ELEMENTS) q.set(PARAM[e.key], d.picks[e.key]);
    return q.toString();
  }
  function fromQuery(search, ids) {
    const q = new URLSearchParams(search);
    const d = { name: (q.get('name') || '').slice(0, 60), picks: {} };
    for (const e of ELEMENTS) {
      const v = q.get(PARAM[e.key]);
      if (!v || !ids.includes(v)) return null;
      d.picks[e.key] = v;
    }
    return d;
  }
  const stageUrl = (d, view, extra) => {
    const q = new URLSearchParams();
    for (const e of ELEMENTS) q.set(e.layer, d.picks[e.key]);
    q.set('view', view || 'scene');
    q.set('embed', '1');
    return 'stage.html?' + q.toString() + (extra || '');
  };
  const designUrl = (d) => (isSingle(d) && !d.name ? d.picks.world + '/' : 'design/?' + toQuery(d));

  /* ---------- saved designs (this browser only) ---------- */
  const KEY = 'miwale-style-mixes';
  const saved = {
    list() {
      try { const a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
    },
    put(d) {
      const all = saved.list().filter((x) => x.id !== d.id);
      const item = { id: d.id || 'm' + Date.now().toString(36), name: d.name || 'Untitled mix', picks: d.picks, saved: Date.now() };
      all.unshift(item);
      localStorage.setItem(KEY, JSON.stringify(all.slice(0, 60)));
      return item;
    },
    remove(id) { localStorage.setItem(KEY, JSON.stringify(saved.list().filter((x) => x.id !== id))); },
    find(d) { return saved.list().find((x) => ELEMENTS.every((e) => x.picks[e.key] === d.picks[e.key])); },
  };

  /* ---------- prompts ---------- */
  const section = (s, h) => (s.parts.sections[h] ? '### ' + h + '\n\n' + s.parts.sections[h].trim() : '');
  function stylePrompt(s) {
    return [
      'Use the "' + s.spec.name + '" art style from the miwale Game Style Library (' + SITE + '/' + s.id + '/) for my project.',
      '',
      'Follow the style spec below exactly: palette (hex values), fonts, rendering technique, characters, world, props, effects, atmosphere, UI and motion. ' +
      'Keep every "Do", avoid every "Don\'t". Start from the starter code at the end. Design new characters and objects for my project, but build them with the same techniques and rules.',
      '',
      'MY PROJECT:',
      '[Describe it here: what it is, setting, main character, other characters, camera/perspective, platform]',
      '',
      '===== STYLE SPEC: ' + s.spec.name + ' (STYLE.md) =====',
      '',
      s.md.trim(),
      '',
      '===== STARTER CODE (starter.js, dependency-free Canvas 2D) =====',
      '',
      s.starter.trim(),
      '',
    ].join('\n');
  }
  /** Prompt for a mixed design. `S` maps style id -> loaded style. */
  function mixPrompt(d, S) {
    const src = (k) => S[d.picks[k]];
    const ui = src('ui'), world = src('world'), chars = src('characters');
    // same rule as the live preview (js/stage.js): a pixel-art element puts the whole mix on its pixel grid
    const pix = [chars, world, src('props'), src('effects')].find((s) => s.spec.technique.pixelArt);
    const resolution = pix
      ? 'The whole image is rendered on the pixel grid of ' + pix.spec.name + ' (pixel art, ' + (pix.spec.technique.pixelArt.scale || 1) + ' world unit per art pixel, integer upscaling, no smoothing). Elements from HD styles are drawn into that low-resolution buffer too, so everything shares one pixel size.'
      : 'Resolution and render scale follow the World style (' + world.spec.name + '). Elements from other styles keep their own construction rules but are drawn at that scale.';
    const lines = [
      'Use this custom art style for my project: "' + (d.name || 'Custom mix') + '". It combines elements of styles from the miwale Game Style Library (' + SITE + '/' + designUrl(d) + ').',
      '',
      'Each design element comes from one source style – build that element EXACTLY as its source spec says (shapes, line work, shading, colours, sizes, animation):',
      ...ELEMENTS.map((e) => '- ' + e.name + ': ' + src(e.key).spec.name + ' (' + src(e.key).spec.family + ')'),
      '',
      'How to combine them:',
      '- ' + resolution,
      '- All text uses the fonts of the UI style (' + ui.spec.typography.map((f) => f.family).join(', ') + ').',
      '- Characters keep their own palette and outline (' + chars.spec.name + ') so they stay readable on the world.',
      '- Atmosphere (light, shadows, overlays, frame) from ' + src('atmosphere').spec.name + ' is applied on top of everything and ties the elements together; if a colour clashes, adjust the atmosphere tint, never the characters.',
      '- When two sources disagree, the source of the element in question wins.',
      '',
      'MY PROJECT:',
      '[Describe it here: what it is, setting, main character, other characters, camera/perspective, platform]',
      '',
    ];
    for (const e of ELEMENTS) {
      const s = src(e.key);
      lines.push('===== ' + e.name.toUpperCase() + ' – from "' + s.spec.name + '" =====', '');
      for (const h of e.sections) { const t = section(s, h); if (t) lines.push(t, ''); }
      const pal = s.spec.palette.map((c) => '- ' + c.name + ' ' + c.hex + ': ' + c.role).join('\n');
      lines.push('### Palette of ' + s.spec.name + ' (use the colours that belong to this element)', '', pal, '');
    }
    lines.push('===== RENDERING TECHNIQUE of each source =====', '');
    for (const id of sources(d)) {
      const s = S[id];
      lines.push('### ' + s.spec.name, '', (s.parts.sections['Rendering technique'] || '').trim(), '',
        'Do: ' + s.spec.do.join(' · '), '', 'Don\'t: ' + s.spec.dont.join(' · '), '');
    }
    lines.push('===== STARTER CODE of the Characters source (' + chars.spec.name + ') =====', '', chars.starter.trim(), '',
      'Full specs of every source:', ...sources(d).map((id) => '- ' + S[id].spec.name + ': ' + SITE + '/library/' + id + '/STYLE.md'), '');
    return lines.join('\n');
  }

  /* ---------- small UI helpers ---------- */
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  function toast(msg) {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toast.h);
    toast.h = setTimeout(() => t.classList.remove('on'), 1800);
  }
  async function copy(str, what) {
    try { await navigator.clipboard.writeText(str); } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = str; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
    toast((what || 'Text') + ' copied');
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
  const meter = (n) => '<span class="meter" style="--n:' + n + '" aria-label="' + n + ' of 10"><i></i></span>';
  /** Collage thumbnail of a design: one tile per element, cut from the source style's screenshot. */
  function collage(d) {
    return '<div class="collage">' + ELEMENTS.map((e) => '<i title="' + esc(e.name) + '" style="background-image:url(shots/' + d.picks[e.key] + '_zoom.webp)"><b>' + e.short + '</b></i>').join('') + '</div>';
  }
  function download(name, content, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: type || 'text/plain' }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  window.Lib = { SITE, ELEMENTS, byKey, catalog, style, text, single, isSingle, sources, toQuery, fromQuery, stageUrl, designUrl, saved,
    stylePrompt, mixPrompt, esc, toast, copy, loadFont, meter, collage, download };
})();
