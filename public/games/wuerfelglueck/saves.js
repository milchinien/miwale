// Würfelglück – Speicherstände: 3 Plätze in localStorage. window.WGSaves
// Ein Platz enthält Statistiken (Runs, Siege, beste Stage, beste Hand, Spielzeit) und den laufenden Run.
(() => {
  'use strict';
  const COUNT = 3, VERSION = 1;
  const key = (k) => 'wg_save_' + (k + 1);

  function blank(k) {
    const now = Date.now();
    return { v: VERSION, slot: k, created: now, updated: now, playTime: 0, lastCup: null, cups: {},
      stats: { runs: 0, wins: 0, bestStage: 0, bestHand: 0, hands: 0 }, run: null };
  }
  function load(k) {
    try {
      const d = JSON.parse(localStorage.getItem(key(k)) || 'null');
      if (d && d.v === VERSION) return d;
    } catch (e) { /* beschädigter Eintrag: wie leer behandeln */ }
    return null;
  }
  function save(k, data) {
    data.updated = Date.now();
    try { localStorage.setItem(key(k), JSON.stringify(data)); return true; } catch (e) { return false; }
  }
  function remove(k) { try { localStorage.removeItem(key(k)); } catch (e) { /* nichts zu tun */ } }

  window.WGSaves = { COUNT, load, save, remove, blank };
})();
