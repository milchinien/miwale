// Würfelglück – geseedete Zufallsströme. window.WGRng
// Ein Run hat einen Zustand { seed, s: { strom: zähler } }, der als einfaches Objekt mitgespeichert wird.
// Jeder Strom (Würfe, Beutel, Shop, Bosse, ...) läuft für sich: Ein Shop-Reroll verschiebt also nie die Würfe.
// Reine Optik (Animationen, Partikel, Sprüche) nutzt weiter Math.random und berührt die Ströme nicht.
((global) => {
  'use strict';
  const STREAMS = ['dice', 'bag', 'shop', 'boss', 'reward', 'job', 'chaos', 'encounter'];

  // FNV-1a: macht aus einem Text eine 32-Bit-Zahl
  function hash(text) {
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return h >>> 0;
  }
  // Mulberry32: ein Schritt; liefert [neuer Zustand, Wert in 0..1)
  function step(state) {
    const next = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(next ^ (next >>> 15), next | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return [next >>> 0, ((t ^ (t >>> 14)) >>> 0) / 4294967296];
  }
  function create(seed) {
    return { seed: seed === undefined || seed === null ? String(Math.floor(Math.random() * 1e12)) : String(seed), s: {} };
  }
  function next(st, name) {
    if (st.s[name] === undefined) st.s[name] = hash(st.seed + '/' + name);
    const [state, value] = step(st.s[name]);
    st.s[name] = state;
    return value;
  }
  // Funktion wie Math.random für rules.js (pick, pickWeighted, ...)
  const stream = (st, name) => () => next(st, name);
  // Seed eines Kalendertags (lokales Datum), z. B. für die spätere Daily Challenge
  function daySeed(date = new Date()) {
    const p = (n) => String(n).padStart(2, '0');
    return 'day-' + date.getFullYear() + '-' + p(date.getMonth() + 1) + '-' + p(date.getDate());
  }

  const api = { STREAMS, hash, create, next, stream, daySeed };
  global.WGRng = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
