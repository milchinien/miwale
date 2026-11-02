// Würfelglück – Musik aus Dateien (Ordner musics/, gemessen in musics/manifest.js).
// Gleicht alle Tracks auf dieselbe Lautheit an, blendet weich zwischen Situationen über, spielt pro Situation
// eine Wiedergabeliste und merkt sich die Stelle, an der ein Track unterbrochen wurde (z. B. Runde -> Shop -> Runde).
// Nutzt <audio>-Elemente, damit es auch direkt aus dem Dateisystem (file://) läuft.
// window.WGMusic: ok, mood(name), duck(seconds), setVolume(amp), skip(), title(rel), playing
(() => {
  'use strict';
  const MAN = window.WG_MUSIC;
  const TARGET_LUFS = -22;     // Lautheit jedes Tracks bei voller Musik-Lautstärke (so laut wie die Effekte beim Werten)
  const XFADE = 1.6;           // Überblendung beim Wechsel der Situation (s)
  const XFADE_NEXT = 3.5;      // Überblendung zum nächsten Track derselben Situation (s)
  const DUCK = 0.35;           // Musik-Pegel während eines Jingles

  const folder = (name) => (MAN && MAN.folders[name]) || [];
  const base = (rel) => rel.split('/').pop();
  // Situation -> Tracks. "general banger" = Höhepunkte: der Boss-Track daraus für den letzten Showdown, der Rest für den Sieg.
  function playlists() {
    const boss = folder('Boss'), banger = folder('general banger');
    const finalBoss = banger.filter((r) => boss.some((b) => base(b) === base(r)));
    const victory = banger.filter((r) => !finalBoss.includes(r));
    const early = folder('Early Game'), mid = folder('mid Game');
    return {
      menu: folder('Main Menu'),
      early: early.length ? early : mid,
      mid: mid.length ? mid : early,
      boss: boss.length ? boss : mid,
      final: finalBoss.length ? finalBoss : boss,
      shop: folder('Shop'),
      victory: victory.length ? victory : folder('Main Menu'),
      lose: [],
    };
  }
  const LISTS = MAN ? playlists() : {};
  const ok = !!MAN && Object.values(LISTS).some((l) => l.length);

  const url = (rel) => 'musics/' + rel.split('/').map(encodeURIComponent).join('/');
  const gainOf = (rel) => { const t = MAN.tracks[rel]; return t ? Math.min(1, Math.pow(10, (TARGET_LUFS - t.lufs) / 20)) : 0.5; };
  const info = (rel) => MAN.tracks[rel] || { start: 0, end: 1e9 };

  let volume = 0.5, unlocked = false, want = 'menu', duckUntil = 0, duckLevel = 1;
  // Handy: feste Audio-Elemente, die beim ersten Antippen freigeschaltet werden (iOS spielt neue Elemente sonst nur
  // direkt nach einer Geste), Lautstärke über WebAudio-Gain (auf iOS ist el.volume schreibgeschützt)
  const MOB = !!window.WG_MOBILE;
  const SILENT = 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQIAAACAgA==';
  const pool = [];
  function blessPool() {
    let ac = null;
    try { ac = window.WGSound && window.WGSound.context ? window.WGSound.context() : null; } catch (e) { ac = null; }
    for (let i = 0; i < 3; i++) {
      const el = new Audio();
      el.preload = 'auto';
      el.src = SILENT;
      const p = el.play();
      if (p && p.catch) p.catch(() => {});
      const item = { el, gain: null, busy: false };
      if (ac) {
        try { const src = ac.createMediaElementSource(el); item.gain = ac.createGain(); item.gain.gain.value = 0; src.connect(item.gain); item.gain.connect(ac.destination); } catch (e) { item.gain = null; }
      }
      pool.push(item);
    }
  }
  const setLevel = (d, v) => { if (d.item && d.item.gain) { d.item.gain.gain.value = v; d.el.volume = 1; } else d.el.volume = v; };
  const decks = [];            // laufende Tracks: { el, rel, mood, fade, fadeTo, fadeRate }
  const resume = {};           // Situation -> { rel, time }
  const lastPlayed = {};       // Situation -> zuletzt gespielter Track (keine direkte Wiederholung)

  function pickTrack(mood) {
    const list = LISTS[mood] || [];
    if (!list.length) return null;
    const pool = list.length > 1 ? list.filter((r) => r !== lastPlayed[mood]) : list;
    return pool[(Math.random() * pool.length) | 0];
  }
  function startDeck(mood, rel, at, fadeTime) {
    let item = null;
    if (MOB && pool.length) {
      // freies Element nehmen; sind alle belegt, das leiseste ausblendende abbrechen
      item = pool.find((q) => !q.busy);
      if (!item) {
        const old = decks.filter((x) => x.item).sort((a, b) => a.fade - b.fade)[0];
        if (old) { old.el.pause(); decks.splice(decks.indexOf(old), 1); item = old.item; }
      }
    }
    const el = item ? item.el : new Audio(url(rel));
    if (item) { item.busy = true; el.src = url(rel); }
    el.preload = 'auto';
    el.volume = 0;
    const t = info(rel);
    el.currentTime = Math.max(t.start || 0, at || 0);
    const d = { el, rel, mood, fade: 0, fadeTo: 1, fadeRate: 1 / Math.max(0.05, fadeTime), gain: gainOf(rel), item };
    if (item) { setLevel(d, 0); el.onended = () => { if (decks.includes(d) && d.mood === want) next(d); }; }
    else el.addEventListener('ended', () => { if (decks.includes(d) && d.mood === want) next(d); });
    decks.push(d);
    lastPlayed[mood] = rel;
    const p = el.play();
    if (p && p.catch) p.catch(() => { /* Autoplay noch gesperrt: beim nächsten Klick erneut */ });
    return d;
  }
  function fadeOut(d, time) { d.fadeTo = 0; d.fadeRate = 1 / Math.max(0.05, time); }
  const active = () => decks.find((d) => d.fadeTo > 0);

  // Nächster Track derselben Situation (Ende erreicht oder übersprungen)
  function next(cur, fade = XFADE_NEXT, rel = pickTrack(cur.mood)) {
    if (cur.next) return;
    cur.next = true;
    fadeOut(cur, fade);
    delete resume[cur.mood];
    if (rel) startDeck(cur.mood, rel, 0, fade);
  }
  // Song überspringen. Hat die Situation nur einen Track, kommt einer aus den übrigen Spiel-Tracks.
  const XFADE_SKIP = 1.0;
  function skip() {
    const cur = active();
    if (!cur || cur.next) return false;
    // Lieber einen anderen Song als eine Variante desselben (Suno liefert oft zwei Fassungen)
    const now = title(cur.rel).title.toLowerCase(), other = (r) => r !== cur.rel && title(r).title.toLowerCase() !== now;
    const pick = (arr) => (arr.length ? arr[(Math.random() * arr.length) | 0] : null);
    let rel = pick((LISTS[cur.mood] || []).filter(other));
    if (!rel) {
      const seen = new Set(), pool = [];
      for (const k of ['mid', 'early', 'shop', 'menu', 'victory', 'boss']) for (const r of LISTS[k] || []) if (other(r) && !seen.has(base(r))) { seen.add(base(r)); pool.push(r); }
      rel = pick(pool);
    }
    if (!rel) rel = pick((LISTS[cur.mood] || []).filter((r) => r !== cur.rel));
    if (!rel) return false;
    next(cur, XFADE_SKIP, rel);
    return true;
  }
  // Anzeigename aus dem Dateinamen: ohne Endung und Zähler wie " (1)"; "Album - Titel - Künstler" -> Titel und Album
  function title(rel) {
    const name = base(rel).replace(/\.[a-z0-9]+$/i, '').replace(/\s*\(\d+\)$/, '').trim();
    const cap = (x) => (x === x.toLowerCase() ? x.replace(/(^|\s)\S/g, (c) => c.toUpperCase()) : x);   // "dice roll" -> "Dice Roll"
    const parts = name.split(' - ').map((x) => cap(x.trim())).filter(Boolean);
    if (parts.length >= 3) return { title: parts[1], album: parts[0], artist: parts.slice(2).join(' - ') };
    if (parts.length === 2) return { title: parts[1], album: parts[0], artist: '' };
    return { title: cap(name), album: '', artist: '' };
  }

  function mood(name) {
    if (!ok) return;
    if (name === want && active()) return;
    const cur = active();
    if (cur) {
      // Stelle merken, damit die Situation später dort weiterläuft
      if (!cur.next) resume[cur.mood] = { rel: cur.rel, time: cur.el.currentTime };
      fadeOut(cur, XFADE);
    }
    want = name;
    if (!unlocked) return;
    const r = resume[name];
    if (r && (LISTS[name] || []).includes(r.rel) && r.time < info(r.rel).end - 8) startDeck(name, r.rel, r.time, XFADE);
    else { const rel = pickTrack(name); if (rel) startDeck(name, rel, 0, XFADE); }
  }

  // Musik kurz absenken (für Jingles)
  function duck(seconds) { duckUntil = Math.max(duckUntil, performance.now() + seconds * 1000); }

  let lastT = performance.now();
  function tick() {
    const now = performance.now(), dt = Math.min(0.25, (now - lastT) / 1000);
    lastT = now;
    const duckTarget = now < duckUntil ? DUCK : 1;
    duckLevel += (duckTarget - duckLevel) * Math.min(1, dt * (duckTarget < duckLevel ? 10 : 1.5));
    for (let i = decks.length - 1; i >= 0; i--) {
      const d = decks[i];
      const step = d.fadeRate * dt;
      d.fade = d.fadeTo > d.fade ? Math.min(d.fadeTo, d.fade + step) : Math.max(d.fadeTo, d.fade - step);
      // weiche Kurve, damit die Überblendung gleichmäßig laut bleibt
      const curve = Math.sin(d.fade * Math.PI / 2);
      const level = Math.max(0, Math.min(1, volume * d.gain * curve * duckLevel));
      if (d.item) setLevel(d, level); else d.el.volume = level;
      if (d.fade <= 0 && d.fadeTo === 0) {
        if (d.item) { d.el.pause(); d.item.busy = false; } else { d.el.pause(); d.el.removeAttribute('src'); d.el.load(); }
        decks.splice(i, 1); continue;
      }
      // kurz vor dem hörbaren Ende zum nächsten Track überblenden
      if (d.fadeTo > 0 && !d.next && d.el.currentTime > 0 && d.el.currentTime >= info(d.rel).end - XFADE_NEXT) next(d);
    }
  }
  setInterval(tick, 50);

  function unlock() {
    if (unlocked || !ok) return;
    unlocked = true;
    if (MOB) blessPool();
    const w = want; want = null;
    mood(w);
  }
  // Handy: erst beim Loslassen freischalten, nur dann erlaubt der Browser das Abspielen
  (MOB ? ['touchend', 'pointerup', 'keydown'] : ['pointerdown', 'keydown']).forEach((ev) => window.addEventListener(ev, unlock, { capture: true }));
  document.addEventListener('visibilitychange', () => {
    for (const d of decks) { if (document.hidden) d.el.pause(); else if (d.fadeTo > 0 || d.fade > 0) d.el.play().catch(() => {}); }
  });

  function setVolume(amp) { volume = Math.max(0, Math.min(1, amp)); }

  window.WGMusic = { ok, mood, duck, setVolume, skip, title, get playing() { const d = active(); return d ? { mood: d.mood, track: d.rel, time: d.el.currentTime, volume: d.item && d.item.gain ? d.item.gain.gain.value : d.el.volume } : null; },
    lists: () => LISTS };
})();
