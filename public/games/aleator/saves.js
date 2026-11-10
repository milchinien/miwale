// Aleator – Speicherstände in localStorage. window.WGSaves
// Die 3 Plätze enthalten nur einen laufenden Run (wg_save_1..3). Alles, was über Runs hinaus bleibt, liegt einmal für
// alle Plätze im gemeinsamen Fortschritt (wg_meta): Statistik, Spielzeit, Becher-Vorrat, Achievements und ihre Zähler.
(() => {
  'use strict';
  const COUNT = 3, VERSION = 1, META_VERSION = 1;
  const key = (k) => 'wg_save_' + (k + 1);
  const META_KEY = 'wg_meta';

  function blank(k) {
    const now = Date.now();
    return { v: VERSION, slot: k, created: now, updated: now, run: null };
  }
  function load(k) {
    try {
      const d = JSON.parse(localStorage.getItem(key(k)) || 'null');
      if (d && d.v === VERSION) return d;
    } catch (e) { /* beschädigter Eintrag: wie leer behandeln */ }
    return null;
  }
  function save(k, data, keepTime) {
    if (!keepTime) data.updated = Date.now();
    try { localStorage.setItem(key(k), JSON.stringify(data)); return true; } catch (e) { return false; }
  }
  function remove(k) { try { localStorage.removeItem(key(k)); } catch (e) { /* nichts zu tun */ } }

  // ── Gemeinsamer Fortschritt ──────────────────────────────────────────────
  function blankMeta() {
    return { v: META_VERSION, playTime: 0, lastCup: null, cups: {},
      stats: { runs: 0, wins: 0, bestStage: 0, bestHand: 0, hands: 0 },
      ach: {}, track: { hands: {}, bosses: {} }, achRetro: false, cosmetics: {} };
  }
  // Ältere Stände hatten Statistik, Becher und Achievements pro Platz: einmalig zusammenführen
  function migrate(meta) {
    for (let k = 0; k < COUNT; k++) {
      const d = load(k);
      if (!d) continue;
      const st = d.stats || {};
      meta.stats.runs += st.runs || 0; meta.stats.wins += st.wins || 0; meta.stats.hands += st.hands || 0;
      meta.stats.bestStage = Math.max(meta.stats.bestStage, st.bestStage || 0);
      meta.stats.bestHand = Math.max(meta.stats.bestHand, st.bestHand || 0);
      meta.playTime += d.playTime || 0;
      for (const [id, n] of Object.entries(d.cups || {})) meta.cups[id] = (meta.cups[id] || 0) + n;
      for (const [id, t] of Object.entries(d.ach || {})) if (!meta.ach[id] || t < meta.ach[id]) meta.ach[id] = t;
      const tr = d.track || {};
      for (const [name, v] of Object.entries(tr)) {
        if (typeof v === 'number') meta.track[name] = (meta.track[name] || 0) + v;
        else if (v && typeof v === 'object') meta.track[name] = Object.assign(meta.track[name] || {}, v);
      }
      if (d.lastCup && (!meta.lastCup || (d.updated || 0) > (meta._lastUpd || 0))) { meta.lastCup = d.lastCup; meta._lastUpd = d.updated || 0; }
      // Platz auf den Run reduzieren
      save(k, { v: VERSION, slot: k, created: d.created || Date.now(), updated: d.updated || Date.now(), run: d.run || null }, true);
    }
    delete meta._lastUpd;
    return meta;
  }
  let metaCache = null;
  function meta() {
    if (metaCache) return metaCache;
    let m = null;
    try { m = JSON.parse(localStorage.getItem(META_KEY) || 'null'); } catch (e) { m = null; }
    if (!m || m.v !== META_VERSION) { m = migrate(blankMeta()); metaCache = m; saveMeta(); }
    metaCache = Object.assign(blankMeta(), m);
    return metaCache;
  }
  function saveMeta() {
    if (!metaCache) return false;
    try { localStorage.setItem(META_KEY, JSON.stringify(metaCache)); return true; } catch (e) { return false; }
  }
  // Für Tests: Zwischenspeicher verwerfen (nach localStorage.clear())
  function reloadMeta() { metaCache = null; return meta(); }

  window.WGSaves = { COUNT, load, save, remove, blank, meta, saveMeta, reloadMeta };
})();
