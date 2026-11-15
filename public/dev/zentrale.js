// Dev-Zentrale (miwale.com/dev): spricht im Browser mit dem Agenten auf
// diesem Geraet (agent.mjs, 127.0.0.1:5300). Kein Agent -> Anleitung.
// Alle Texte aus dem Agenten kommen per textContent ins DOM, nie als HTML.
(() => {
  'use strict';

  const AGENT = 'http://127.0.0.1:5300';
  const VERSION = 9;
  const basis = `${location.origin}/dev/`;
  const installBefehl = `powershell -NoProfile -ExecutionPolicy Bypass -Command "$env:MIWALE_DEV='${basis}'; irm ${basis}installieren.ps1 | iex"`;

  const $ = (id) => document.getElementById(id);
  const suche = $('suche');
  const oeffnenSchalter = $('oeffnen');

  let stand = null;
  let letzterText = '';
  let auswahl = 0;
  let sichtbar = [];
  const wartend = new Map(); // id -> 'start' | 'stopp', bis der Agent es meldet
  const offen = new Set(); // ids mit aufgeklappten Kopien
  let letztesEreignis = -1; // Nummer der zuletzt gezeigten Meldung des Agenten
  let miwale = { repo: new Map(), id: new Map() }; // Spiele, die auf miwale.com laufen

  // Filter, Gruppe und Sortierung bleiben ueber Besuche hinweg.
  const FILTER = {
    alle: () => true,
    favoriten: (p) => Boolean(p.favorit),
    startbar: (p) => startbar(p) || Boolean(p.programm),
    laeuft: (p) => laeuftGerade(p),
  };
  let filter = FILTER[localStorage.getItem('miwale-dev-filter')] ? localStorage.getItem('miwale-dev-filter') : 'alle';
  let gruppe = localStorage.getItem('miwale-dev-gruppe') || '';
  let sortierung = (() => {
    try {
      const s = JSON.parse(localStorage.getItem('miwale-dev-sortierung'));
      if (['name', 'erstellt', 'aktiv'].includes(s.feld) && [1, -1].includes(s.richtung)) return s;
    } catch { /* Standard */ }
    return { feld: 'aktiv', richtung: -1 };
  })();
  let melden = localStorage.getItem('miwale-dev-melden') === 'ja';

  const meldung = document.createElement('p');
  meldung.className = 'klein meldung';
  meldung.setAttribute('role', 'status');
  meldung.hidden = true;
  $('filter').parentElement.before(meldung);

  function zeige(text, fehler = false) {
    meldung.textContent = text;
    meldung.classList.toggle('rot', fehler);
    meldung.hidden = !text;
    clearTimeout(zeige.timer);
    if (text) zeige.timer = setTimeout(() => { meldung.hidden = true; }, 7000);
  }

  oeffnenSchalter.checked = localStorage.getItem('miwale-dev-oeffnen') !== 'nein';
  oeffnenSchalter.addEventListener('change', () => localStorage.setItem('miwale-dev-oeffnen', oeffnenSchalter.checked ? 'ja' : 'nein'));

  for (const id of ['installBefehl', 'installBefehl2']) $(id).textContent = installBefehl;
  async function kopiereText(text, knopf, fertig = 'Kopiert ✓') {
    try {
      await navigator.clipboard.writeText(text);
      if (knopf) { const alt = knopf.textContent; knopf.textContent = fertig; setTimeout(() => { knopf.textContent = alt; }, 1600); }
      return true;
    } catch { return false; }
  }
  async function kopiere(knopf) {
    if (await kopiereText(installBefehl)) {
      $('kopiert').hidden = false;
      knopf.textContent = 'Kopiert ✓';
    } else {
      document.getSelection().selectAllChildren($('installBefehl'));
      knopf.textContent = 'Markiert – Strg+C';
    }
  }
  $('kopieren').addEventListener('click', (e) => kopiere(e.currentTarget));
  $('kopieren2').addEventListener('click', (e) => kopiere(e.currentTarget));

  // --- Agent ---------------------------------------------------------------

  async function agent(pfad, daten) {
    const abbruch = new AbortController();
    const timer = setTimeout(() => abbruch.abort(), pfad === '/git' ? 95000 : 10000);
    try {
      const antwort = await fetch(AGENT + pfad, daten === undefined
        ? { signal: abbruch.signal, cache: 'no-store' }
        : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(daten), signal: abbruch.signal });
      const wert = await antwort.json().catch(() => ({}));
      if (!antwort.ok) {
        const f = new Error(wert.fehler || `Agent antwortet ${antwort.status}`);
        f.daten = wert;
        throw f;
      }
      return wert;
    } finally {
      clearTimeout(timer);
    }
  }

  // Ein Klick, ein Aufruf: Fehler landen in der Meldungszeile.
  const tu = (pfad, daten, ok) => agent(pfad, daten).then((a) => { if (ok) zeige(typeof ok === 'function' ? ok(a) : ok); abfragen(); return a; })
    .catch((f) => { zeige(f.message, true); abfragen(); });

  let naechste = null;
  async function abfragen() {
    clearTimeout(naechste);
    try {
      stand = await agent('/status');
      for (const p of stand.projekte) {
        const w = wartend.get(p.id);
        if ((w === 'start' && p.zustand !== 'aus') || (w === 'stopp' && p.zustand === 'aus')) wartend.delete(p.id);
      }
      ereignisse(stand.ereignisse || []);
      zeichne();
    } catch {
      stand = null;
      zeichne();
    }
    const eilig = wartend.size || stand?.projekte.some((p) => p.zustand === 'startet' || p.lauf?.zustand === 'laeuft')
      || stand?.suche.laeuft || stand?.paketLauf || stand?.check?.laeuft;
    naechste = setTimeout(abfragen, document.hidden ? 10000 : stand ? (eilig ? 1000 : 2500) : 3000);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) abfragen(); });

  // Aeltere Agenten (bis 3) kannten nur startbare Projekte.
  const startbar = (p) => p.startbar ?? true;
  const laeuftGerade = (p) => p.ports.length > 0 || p.zustand === 'startet' || p.zustand === 'laeuft' || wartend.get(p.id) === 'start';

  // --- Benachrichtigungen (14) ---------------------------------------------

  function ereignisse(liste) {
    const hoechste = liste.reduce((m, e) => Math.max(m, e.nr), 0);
    // Erste Abfrage oder Agent neu gestartet: Altes nicht noch einmal melden.
    if (letztesEreignis < 0 || hoechste < letztesEreignis) { letztesEreignis = hoechste; return; }
    for (const e of liste.filter((x) => x.nr > letztesEreignis)) {
      zeige(`${e.titel}${e.text ? ` – ${e.text}` : ''}`, e.art === 'fehler');
      if (melden && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        try { new Notification(e.titel, { body: e.text, tag: `miwale-dev-${e.nr}`, icon: '/assets/favicon-whale-light.png' }); } catch { /* egal */ }
      }
    }
    letztesEreignis = hoechste;
  }

  function meldenKnopf() {
    const k = $('melden');
    k.textContent = melden ? '🔔 Benachrichtigungen an' : '🔕 Benachrichtigungen aus';
    k.setAttribute('aria-pressed', String(melden));
  }
  $('melden').addEventListener('click', async () => {
    melden = !melden;
    if (melden && 'Notification' in window && Notification.permission === 'default') {
      melden = (await Notification.requestPermission()) === 'granted';
      if (!melden) zeige('Der Browser erlaubt keine Benachrichtigungen. Windows meldet sich trotzdem, wenn die Seite zu ist.');
    }
    localStorage.setItem('miwale-dev-melden', melden ? 'ja' : 'nein');
    meldenKnopf();
    // Der Agent meldet sich per Windows-Toast, wenn keine Seite offen ist.
    tu('/einstellung', { toasts: melden }, melden ? 'Benachrichtigungen an: Abstürze, fertige Skripte und Checks.' : 'Benachrichtigungen aus.');
  });
  meldenKnopf();

  // --- Spiele auf miwale.com (12) ------------------------------------------

  const kennung = (name) => String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  async function ladeMiwale() {
    try {
      const m = await (await fetch('/games/manifest.json', { cache: 'no-store' })).json();
      const repo = new Map();
      const id = new Map();
      for (const [spiel, e] of Object.entries(m || {})) {
        const eintrag = { id: spiel, commit: e.commit || '', pfad: `/${String(e.path || `games/${spiel}/`).replace(/^\/+/, '')}` };
        if (e.repo) repo.set(String(e.repo).toLowerCase(), eintrag);
        id.set(spiel, eintrag);
      }
      miwale = { repo, id };
      letzterText = '';
      zeichne();
    } catch { /* ohne Manifest eben ohne */ }
  }
  function aufMiwale(p) {
    const r = p.git?.repo ? miwale.repo.get(p.git.repo.toLowerCase()) : null;
    return r || miwale.id.get(kennung(p.name)) || null;
  }

  // --- Aktionen ------------------------------------------------------------

  function oeffne(port) {
    window.open(`http://localhost:${port}/`, '_blank', 'noopener');
  }

  function zeigeOrdner(id, datei) {
    agent('/ordner', datei ? { id, datei } : { id }).catch((f) => zeige(f.message, true));
  }

  // Enter, Ziffer oder Hauptknopf: laeuft -> oeffnen, startbar -> starten,
  // HTML -> index.html im Browser, sonst den Ordner.
  async function aktion(p, extra = {}) {
    if (!p) return;
    if (p.ports.length && !Object.keys(extra).length) return oeffne(p.ports[0]);
    // Ohne Dev-Server: Editor, Startskript oder Programm. Laeuft dann im eigenen Fenster.
    if (!startbar(p) && p.programm) {
      try {
        await agent('/starten', { id: p.id });
        zeige(`${p.name}: ${p.programm.titel} …`);
      } catch (f) { zeige(`${p.name}: ${f.message}`, true); }
      return;
    }
    if (!startbar(p)) return zeigeOrdner(p.id, p.art === 'HTML' ? 'index' : '');
    if (p.zustand === 'startet' || wartend.has(p.id)) return;
    wartend.set(p.id, 'start');
    zeichne(true);
    try {
      const a = await agent('/starten', { id: p.id, oeffnen: oeffnenSchalter.checked, ...extra });
      zeige(`${p.name} startet${a.port ? ` auf Port ${a.port}` : ''} …${oeffnenSchalter.checked ? ' Der Browser öffnet es, sobald der Server steht.' : ''}`);
    } catch (f) {
      wartend.delete(p.id);
      if (f.daten?.konflikt) portKonflikt(p, f.daten.konflikt);
      else zeige(`${p.name}: ${f.message}`, true);
    }
    abfragen();
  }

  async function stoppe(daten, name) {
    const schluessel = daten.id || `pid:${daten.pid}`;
    wartend.set(schluessel, 'stopp');
    zeichne(true);
    try {
      await agent('/stoppen', daten);
      zeige(`${name} gestoppt.`);
      // Mit id raeumt abfragen() auf, sobald das Projekt "aus" meldet.
      if (!daten.id) wartend.delete(schluessel);
    } catch (f) {
      wartend.delete(schluessel);
      zeige(`${name}: ${f.message}`, true);
    }
    abfragen();
  }

  async function alleStoppen() {
    if (!stand) return;
    const laufend = stand.projekte.filter((p) => p.zustand !== 'aus');
    if (!laufend.length) return zeige('Es läuft nichts.');
    for (const p of laufend) wartend.set(p.id, 'stopp');
    zeichne(true);
    try {
      const a = await agent('/alle-stoppen', {});
      zeige(`${a.gestoppt} Server gestoppt.`);
    } catch (f) {
      zeige(f.message, true);
    }
    for (const p of laufend) wartend.delete(p.id);
    abfragen();
  }

  // Neu starten mit anderen Optionen (Heimnetz, anderer Port): erst stoppen.
  async function neuStarten(p, extra) {
    if (p.zustand !== 'aus') {
      try { await agent('/stoppen', { id: p.id }); } catch (f) { return zeige(f.message, true); }
      await new Promise((r) => setTimeout(r, 700));
    }
    wartend.delete(p.id);
    const frisch = { ...p, ports: [], zustand: 'aus' };
    return aktion(frisch, extra);
  }

  const merke = (p, daten, text) => tu('/merken', { id: p.id, ...daten }, text);

  $('alleStoppen').addEventListener('click', alleStoppen);
  $('neuSuchen').addEventListener('click', async () => {
    try { await agent('/suchen', {}); zeige('Suche nach Projekten läuft …'); } catch (f) { zeige(f.message, true); }
    abfragen();
  });

  for (const knopf of $('filter').querySelectorAll('button')) {
    knopf.addEventListener('click', () => {
      filter = knopf.dataset.filter;
      localStorage.setItem('miwale-dev-filter', filter);
      auswahl = 0;
      zeichne();
    });
  }
  $('gruppe').addEventListener('change', () => {
    gruppe = $('gruppe').value;
    localStorage.setItem('miwale-dev-gruppe', gruppe);
    auswahl = 0;
    zeichne();
  });

  // Gleiche Spalte noch mal: Richtung umdrehen. Neue Spalte: Name A–Z, Daten neueste zuerst.
  for (const knopf of $('tabkopf').querySelectorAll('button[data-sort]')) {
    knopf.addEventListener('click', () => {
      const feld = knopf.dataset.sort;
      sortierung = sortierung.feld === feld ? { feld, richtung: -sortierung.richtung } : { feld, richtung: feld === 'name' ? 1 : -1 };
      localStorage.setItem('miwale-dev-sortierung', JSON.stringify(sortierung));
      zeichne();
    });
  }

  // --- Darstellung ---------------------------------------------------------

  function el(tag, eigenschaften = {}, ...kinder) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(eigenschaften)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'text') e.textContent = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k === 'class') e.className = v;
      else e.setAttribute(k, v);
    }
    for (const kind of kinder.flat()) if (kind !== null && kind !== undefined && kind !== false && kind !== '') e.append(kind);
    return e;
  }

  const SVG = 'http://www.w3.org/2000/svg';
  const SYMBOL = {
    ordner: 'M3.5 7.5a2 2 0 0 1 2-2h3.6l2 2h7.4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z',
    aus: 'M6.5 6.5l11 11M17.5 6.5l-11 11',
    stern: 'M12 3.8l2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8z',
    mehr: 'M5.5 12h.01M12 12h.01M18.5 12h.01',
    handy: 'M8 3.5h8a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 19V5A1.5 1.5 0 0 1 8 3.5zM11 17.5h2',
    kopie: 'M9 9h10v10H9zM5 15V5h10',
  };

  function symbolKnopf(symbol, titel, onclick, extraKlasse = '') {
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const pfad = document.createElementNS(SVG, 'path');
    pfad.setAttribute('d', SYMBOL[symbol]);
    svg.append(pfad);
    return el('button', { class: `symbol ${extraKlasse}`.trim(), type: 'button', title: titel, 'aria-label': titel, onclick }, svg);
  }

  const datumFormat = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const zeitFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'long', timeStyle: 'short' });
  const uhrFormat = new Intl.DateTimeFormat('de-DE', { weekday: 'short', hour: '2-digit', minute: '2-digit' });

  function vorher(ms) {
    const heute = new Date();
    heute.setHours(0, 0, 0, 0);
    const tag = new Date(ms);
    tag.setHours(0, 0, 0, 0);
    const tage = Math.round((heute - tag) / 864e5);
    if (tage <= 0) return 'heute';
    if (tage === 1) return 'gestern';
    if (tage < 14) return `vor ${tage} Tagen`;
    if (tage < 60) return `vor ${Math.round(tage / 7)} Wochen`;
    if (tage < 730) return `vor ${Math.round(tage / 30.4)} Monaten`;
    return `vor ${Math.floor(tage / 365)} Jahren`;
  }

  function dauer(seit) {
    if (!seit) return '';
    const min = Math.max(0, Math.round((Date.now() - new Date(seit).getTime()) / 60000));
    if (min < 1) return 'gerade gestartet';
    if (min < 60) return `seit ${min} Min.`;
    const std = Math.floor(min / 60);
    return std < 48 ? `seit ${std} Std.` : `seit ${Math.floor(std / 24)} Tagen`;
  }

  function sekunden(ms) {
    const s = Math.round(ms / 1000);
    return s < 60 ? `${s} s` : `${Math.floor(s / 60)} Min. ${s % 60} s`;
  }

  const lange = (seit) => seit && Date.now() - new Date(seit).getTime() > 24 * 3600 * 1000;

  function zuletztGesucht(s) {
    if (s.laeuft || !s.zeit) return '';
    const min = Math.round((Date.now() - s.zeit) / 60000);
    return min < 1 ? 'Gerade gesucht' : min < 60 ? `Gesucht vor ${min} Min.` : `Gesucht vor ${Math.floor(min / 60)} Std.`;
  }

  function passt(p, woerter) {
    const text = `${p.name} ${p.ordner} ${p.art || ''} ${p.start || ''} ${p.gruppe || ''} ${p.notiz || ''}`.toLowerCase();
    return woerter.every((w) => text.includes(w));
  }

  // Fehlende Daten stehen in beiden Richtungen hinten.
  const VERGLEICH = {
    name: (a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base', numeric: true }),
    erstellt: (a, b) => (a.erstellt || 0) - (b.erstellt || 0),
    aktiv: (a, b) => (a.aktiv || 0) - (b.aktiv || 0),
  };

  // Favoriten stehen immer oben: Das ist die Arbeitsliste.
  function sortiere(liste) {
    const { feld, richtung } = sortierung;
    return [...liste].sort((a, b) => {
      if (Boolean(a.favorit) !== Boolean(b.favorit)) return a.favorit ? -1 : 1;
      if (feld !== 'name' && Boolean(a[feld]) !== Boolean(b[feld])) return a[feld] ? -1 : 1;
      return VERGLEICH[feld](a, b) * richtung || VERGLEICH.name(a, b);
    });
  }

  function mb(bytes) {
    if (!bytes) return '';
    return bytes > 1e9 ? `${(bytes / 1e9).toFixed(1).replace('.', ',')} GB` : `${Math.round(bytes / 1e6)} MB`;
  }
  function ressourcenText(s) {
    if (!s || s.ram === undefined) return '';
    return [s.ram ? `RAM ${mb(s.ram)}` : '', s.cpu === null || s.cpu === undefined ? '' : `CPU ${String(s.cpu).replace('.', ',')} %`].filter(Boolean).join(' · ');
  }

  function zustandMarke(p) {
    const w = wartend.get(p.id);
    if (p.repariert) return el('span', { class: 'marke startet', text: 'repariert + startet …', title: 'Der erste Start ist gescheitert – Pakete werden neu installiert' });
    if (p.installiertGerade) return el('span', { class: 'marke startet', text: 'installiert + startet …' });
    if (w === 'start' || p.zustand === 'startet') return el('span', { class: 'marke startet', text: 'startet …' });
    if (w === 'stopp') return el('span', { class: 'marke', text: 'stoppt …' });
    if (p.zustand === 'laeuft') return el('span', { class: 'marke laeuft', text: 'läuft' });
    if (p.zustand === 'fehler') return el('span', { class: 'marke fehler', text: p.konflikt ? 'Port belegt' : 'Fehler' });
    return null;
  }

  function portLinks(ports) {
    if (!ports.length) return null;
    return el('span', { class: 'ports' }, ports.map((port) => el('a', { href: `http://localhost:${port}/`, target: '_blank', rel: 'noopener', text: `:${port}` })));
  }

  function logKnopf(p, art = '') {
    return el('button', { class: 'leise', type: 'button', text: art ? 'Ausgabe' : 'Log', onclick: () => zeigeLog(p, art) });
  }

  function hauptKnopf(p) {
    const w = wartend.get(p.id);
    if (p.ports.length) return el('button', { class: 'haupt', type: 'button', text: 'Öffnen', title: `localhost:${p.ports[0]}`, onclick: () => oeffne(p.ports[0]) });
    if (p.zustand === 'startet' || w === 'start') return el('button', { class: 'haupt', type: 'button', disabled: 'disabled', text: 'Startet …' });
    if (startbar(p)) return el('button', { class: 'haupt', type: 'button', text: p.zustand === 'fehler' ? 'Neu starten' : 'Start', title: p.befehl, onclick: () => aktion(p) });
    if (p.programm) return el('button', { class: 'haupt', type: 'button', text: p.programm.text, title: p.programm.titel, onclick: () => aktion(p) });
    if (p.art === 'HTML') return el('button', { type: 'button', text: 'Im Browser', title: 'index.html öffnen', onclick: () => aktion(p) });
    return null;
  }

  // Git (6): Zweig, vor/zurueck, Aenderungen. Pull nur, wenn etwas zu holen ist.
  function gitZeile(p) {
    const g = p.git;
    if (!g) return null;
    const teile = [el('span', { class: 'git-zweig', text: `⎇ ${g.zweig || 'losgelöst'}`, title: g.upstream ? `Verfolgt ${g.upstream}` : 'Kein Upstream – noch nie gepusht' })];
    if (g.vor) teile.push(el('span', { class: 'git-vor', text: `↑${g.vor}`, title: `${g.vor} Commit${g.vor === 1 ? '' : 's'} noch nicht gepusht` }));
    if (g.zurueck) teile.push(el('span', { class: 'git-zurueck', text: `↓${g.zurueck}`, title: `${g.zurueck} Commit${g.zurueck === 1 ? '' : 's'} auf dem Server, lokal noch nicht` }));
    if (g.geaendert) teile.push(el('span', { class: 'git-geaendert', text: `${g.geaendert} geändert`, title: 'Geänderte oder neue Dateien, noch nicht committet' }));
    if (!g.upstream && g.zweig) teile.push(el('span', { class: 'klein', text: 'nicht gepusht' }));
    if (g.zurueck) teile.push(el('button', { class: 'mini', type: 'button', text: 'Pull', title: 'git pull --ff-only', onclick: () => gitAktion(p, 'pull') }));
    if (g.meldung) teile.push(el('span', { class: 'klein', text: g.meldung }));
    return el('span', { class: 'git' }, teile);
  }

  function gitAktion(p, aktion) {
    zeige(`${p.name}: git ${aktion === 'pull' ? 'pull' : 'fetch'} …`);
    return tu('/git', { id: p.id, aktion }, (a) => `${p.name}: ${a.meldung || 'fertig'}`);
  }

  // Auf miwale.com (12): verlinkt; weicht der Stand ab, ein Hinweis.
  function miwaleChip(p) {
    const m = aufMiwale(p);
    if (!m) return null;
    const lokal = p.git?.kopf || '';
    const anders = m.commit && lokal && m.commit !== lokal;
    const titel = m.commit
      ? `Live: ${m.commit.slice(0, 7)} · Lokal: ${lokal ? lokal.slice(0, 7) : '?'}${p.git?.vor ? ` · ${p.git.vor} Commits noch nicht gepusht` : ''}${anders ? ' – miwale holt Spiele täglich von GitHub (games:sync)' : ''}`
      : 'Liegt ohne Repository auf miwale.com';
    return el('a', { class: `chip-link${anders ? ' warnung' : ''}`, href: m.pfad, target: '_blank', rel: 'noopener', title: titel, text: anders ? (p.git?.vor ? 'miwale · nicht gepusht' : 'miwale · Stand ≠ live') : 'auf miwale' });
  }

  function lauf(p) {
    const l = p.lauf;
    if (!l) return null;
    const text = l.zustand === 'laeuft' ? `${l.skript} läuft …` : l.zustand === 'ok' ? `${l.skript} ✓ ${sekunden(l.ende - l.seit)}` : l.zustand === 'gestoppt' ? `${l.skript} gestoppt` : `${l.skript} ✗ Code ${l.code}`;
    return el('button', { class: `chip lauf-${l.zustand}`, type: 'button', text, title: 'Ausgabe zeigen', onclick: () => zeigeLog(p, 'befehl') });
  }

  function projektZeile(p, nr, treffer) {
    const w = wartend.get(p.id);
    const laeuft = p.ports.length > 0;
    const instanzen = stand.server.filter((s) => s.projekt === p.id).length;
    const knoepfe = [hauptKnopf(p)];
    if (p.zustand !== 'aus' || laeuft) {
      knoepfe.push(el('button', {
        class: 'gefahr', type: 'button', text: instanzen > 1 ? `Alle ${instanzen}` : 'Stop',
        title: instanzen > 1 ? 'Alle Instanzen stoppen. Einzeln: oben unter „Läuft gerade“' : null,
        disabled: w === 'stopp' ? 'disabled' : null, onclick: () => stoppe({ id: p.id }, p.name),
      }));
    }
    if (p.zustand === 'fehler') knoepfe.push(logKnopf(p));
    knoepfe.push(symbolKnopf('stern', p.favorit ? 'Favorit entfernen' : 'Als Favorit oben anheften', () => merke(p, { favorit: !p.favorit }), p.favorit ? 'an' : ''));
    knoepfe.push(symbolKnopf('ordner', 'Ordner im Explorer öffnen', () => zeigeOrdner(p.id)));
    knoepfe.push(symbolKnopf('mehr', 'Mehr: öffnen in, Skripte, Git, Gruppe, Notiz …', (e) => menue(p, e.currentTarget), 'mehr-knopf'));

    const kopien = p.kopien || [];
    const kopienOffen = offen.has(p.id);
    const titel = el('div', { class: 'titelzeile' },
      el('span', { class: 'name', text: p.name }),
      p.art ? el('span', { class: 'art', text: p.art }) : null,
      p.gruppe ? el('button', { class: 'chip gruppe', type: 'button', text: p.gruppe, title: 'Nur diese Gruppe zeigen', onclick: () => { gruppe = p.gruppe; localStorage.setItem('miwale-dev-gruppe', gruppe); zeichne(); } }) : null,
      zustandMarke(p), portLinks(p.ports),
      laeuft ? el('span', { class: 'klein', 'data-seit': p.seit, text: dauer(p.seit) }) : null,
      p.neugestartet ? el('span', { class: 'marke startet', text: `neu gestartet ${p.neugestartet}×`, title: 'Nach einem Absturz von selbst neu gestartet' }) : null,
      p.neustart ? el('span', { class: 'klein', text: '↻', title: 'Startet nach einem Absturz von selbst neu' }) : null,
      p.backup ? el('span', { class: 'marke archiv', text: 'nur im Backup', title: 'Liegt nur in einem Sicherungs- oder Archivordner' }) : null,
      miwaleChip(p), lauf(p),
      kopien.length ? el('button', {
        class: 'chip', type: 'button', 'aria-expanded': String(kopienOffen),
        text: `${kopien.length} ${kopien.length === 1 ? 'Kopie' : 'Kopien'} ${kopienOffen ? '▴' : '▾'}`,
        title: 'Dasselbe Projekt liegt noch an anderen Orten (z. B. im Backup)',
        onclick: () => { if (!offen.delete(p.id)) offen.add(p.id); zeichne(true); },
      }) : null);
    const pfad = el('div', { class: 'pfad', title: p.start ? `${p.ordner}\nDev-Server in: ${p.start}` : p.ordner },
      p.ordner, p.start ? el('span', { class: 'unter', text: ` → ${p.start}` }) : null);
    const meta = gitZeile(p);

    const extra = [];
    if (p.notiz) extra.push(el('button', { class: 'notiz', type: 'button', title: 'Notiz bearbeiten', onclick: () => notizDialog(p) }, el('span', { text: '✎ ' }), p.notiz));
    if (p.zustand === 'fehler' && p.fehler) extra.push(el('p', { class: 'fehlertext', text: p.fehler }));
    if (p.zustand === 'fehler' && p.konflikt) extra.push(konfliktKnoepfe(p, p.konflikt));
    if (kopienOffen) {
      extra.push(el('div', { class: 'kopien' },
        el('span', { class: 'klein', text: 'Weitere Fundorte – gestartet wird immer der obere Ordner:' }),
        kopien.map((k) => el('div', { class: 'kopie' },
          el('span', { class: 'pfad', title: k.ordner, text: k.ordner }),
          k.backup ? el('span', { class: 'marke archiv', text: 'Backup' }) : null,
          symbolKnopf('ordner', 'Diesen Ordner im Explorer öffnen', () => zeigeOrdner(k.id))))));
    }

    const quelle = p.erstelltQuelle === 'git' ? 'erstes Commit' : 'ältestes Dateidatum im Ordner';
    return el('div', { class: `eintrag${treffer ? ' treffer' : ''}${laeuft ? ' laeuft' : ''}${p.favorit ? ' favorit' : ''}` },
      el('span', {}, nr <= 9 ? el('span', { class: 'nr', text: String(nr) }) : null),
      el('div', { class: 'haupt-spalte' }, titel, pfad, meta),
      el('div', { class: `datum${p.erstellt ? '' : ' leer'}`, title: p.erstellt ? `${zeitFormat.format(p.erstellt)} · ${quelle}` : 'unbekannt' },
        el('span', { class: 'mobil-label', text: 'Erstellt ' }), p.erstellt ? datumFormat.format(p.erstellt) : '–'),
      el('div', { class: `datum${p.aktiv ? '' : ' leer'}`, title: p.aktiv ? `Zuletzt geändert: ${zeitFormat.format(p.aktiv)}` : '' },
        el('span', { class: 'mobil-label', text: 'Bearbeitet ' }), p.aktiv ? vorher(p.aktiv) : '–'),
      el('div', { class: 'aktionen' }, knoepfe),
      extra.length ? el('div', { class: 'extra' }, extra) : null);
  }

  // Port-Konflikt (1): anderen Port nehmen, oder den Blockierer beenden.
  function konfliktKnoepfe(p, k) {
    return el('div', { class: 'zeile konflikt' },
      el('span', { class: 'klein', text: `Port ${k.port} belegt${k.name ? ` von ${k.name}` : ''}:` }),
      el('button', { type: 'button', class: 'haupt', text: 'Anderen Port nehmen', onclick: () => { schliesseDialog(); neuStarten(p, { andererPort: true }); } }),
      k.stoppbar && k.pid ? el('button', {
        type: 'button', class: 'gefahr', text: `${k.name} beenden und starten`,
        onclick: async () => {
          schliesseDialog();
          try { await agent('/stoppen', k.projekt ? { id: k.projekt } : { pid: k.pid }); } catch (f) { return zeige(f.message, true); }
          await new Promise((r) => setTimeout(r, 800));
          neuStarten(p, {});
        },
      }) : null);
  }

  function portKonflikt(p, k) {
    oeffneDialog(`${p.name}: Port ${k.port} ist belegt`,
      el('p', { class: 'klein', text: `Das Projekt will auf Port ${k.port} laufen, dort lauscht aber schon ${k.name || 'ein anderes Programm'}${k.pid ? ` (PID ${k.pid})` : ''}.` }),
      konfliktKnoepfe(p, k),
      k.stoppbar ? null : el('p', { class: 'klein', text: 'Das andere Programm ist kein Dev-Server – die Zentrale beendet es nicht.' }));
  }

  // Ein Projekt, das noch keinen Port hat (startet gerade oder hat keinen Server).
  function startendZeile(p) {
    return el('div', { class: 'eintrag laeuft' },
      el('span', {}),
      el('div', { class: 'haupt-spalte' },
        el('div', { class: 'titelzeile' }, el('span', { class: 'name', text: p.name }), zustandMarke(p),
          el('span', { class: 'klein', 'data-seit': p.seit, text: dauer(p.seit) }))),
      el('div', { class: 'aktionen' },
        logKnopf(p),
        el('button', { class: 'gefahr', type: 'button', text: 'Stop', disabled: wartend.get(p.id) === 'stopp' ? 'disabled' : null, onclick: () => stoppe({ id: p.id }, p.name) })));
  }

  // Eine laufende Instanz. Mehrere aus demselben Ordner (zweimal pnpm dev)
  // stehen einzeln da und lassen sich einzeln stoppen.
  function instanzZeile(s, p, nr, von) {
    const name = `${p ? p.name : s.name}${von > 1 ? ` · ${nr}/${von}` : ''}`;
    const stoppt = wartend.get(`pid:${s.pid}`) === 'stopp' || (p && wartend.get(p.id) === 'stopp');
    const adresse = `http://localhost:${s.ports[0]}/`;
    return el('div', { class: 'eintrag laeuft' },
      el('span', {}),
      el('div', { class: 'haupt-spalte' },
        el('div', { class: 'titelzeile' }, el('span', { class: 'name', text: name }),
          el('span', { class: `marke${stoppt ? '' : ' laeuft'}`, text: stoppt ? 'stoppt …' : 'läuft' }), portLinks(s.ports),
          el('span', { class: `klein${lange(s.seit) ? ' alt' : ''}`, 'data-seit': s.seit, text: dauer(s.seit), title: lange(s.seit) ? 'Läuft schon über einen Tag – vergessen?' : null }),
          el('span', { class: 'klein res', 'data-res': String(s.pid), text: ressourcenText(s) }),
          el('span', { class: 'klein', text: `PID ${s.pid}` })),
        p ? el('div', { class: 'pfad', title: p.ordner, text: p.ordner }) : null),
      el('div', { class: 'aktionen' },
        p && nr === 1 ? logKnopf(p) : null,
        symbolKnopf('kopie', `Adresse kopieren (${adresse})`, (e) => kopiereText(adresse).then((ok) => zeige(ok ? `${adresse} kopiert.` : 'Kopieren ging nicht.', !ok))),
        symbolKnopf('handy', 'Auf dem Handy öffnen (QR-Code)', () => qrDialog(s, p)),
        el('button', { class: 'haupt', type: 'button', text: 'Öffnen', onclick: () => oeffne(s.ports[0]) }),
        el('button', { class: 'gefahr', type: 'button', text: 'Stop', title: 'Nur diese Instanz stoppen', disabled: stoppt ? 'disabled' : null,
          onclick: () => stoppe({ pid: s.pid }, `${p ? p.name : s.name} :${s.ports[0]}`) })));
  }

  function sonstigeZeile(s) {
    return el('div', { class: 'eintrag' },
      el('span', {}),
      el('div', { class: 'haupt-spalte' },
        el('div', { class: 'titelzeile' }, el('span', { class: 'name', text: s.name }), portLinks(s.ports),
          el('span', { class: 'klein res', 'data-res': String(s.pid), text: ressourcenText(s) }),
          el('span', { class: 'klein', text: `PID ${s.pid}` })),
        el('div', { class: 'pfad', title: s.befehl, text: s.befehl })),
      el('div', { class: 'aktionen' },
        symbolKnopf('handy', 'Auf dem Handy öffnen (QR-Code)', () => qrDialog(s, null)),
        el('button', { class: 'gefahr', type: 'button', text: 'Stop', onclick: () => stoppe({ pid: s.pid }, `PID ${s.pid}`) })));
  }

  // --- Startpakete (3) und Schnellcheck (13) -------------------------------

  function paketeZeichnen() {
    const pakete = stand.pakete || [];
    const lauf = stand.paketLauf;
    const projektVon = new Map(stand.projekte.map((p) => [p.id, p]));
    const liste = pakete.map((pk) => el('div', { class: 'paket' },
      el('div', { class: 'paket-text' },
        el('span', { class: 'name', text: pk.name }),
        el('span', { class: 'klein', text: pk.ids.map((id) => projektVon.get(id)?.name || '?').join(' → ') || 'leer' })),
      el('div', { class: 'aktionen' },
        el('button', {
          class: 'haupt', type: 'button', text: lauf?.name === pk.name ? `${lauf.schritt}/${lauf.von} …` : 'Starten',
          disabled: lauf ? 'disabled' : null, title: lauf?.name === pk.name ? `Startet gerade: ${lauf.aktuell}` : 'Der Reihe nach starten: jeder erst, wenn der vorige seinen Port hat',
          onclick: () => tu('/paket', { aktion: 'starten', name: pk.name, oeffnen: oeffnenSchalter.checked }, `Paket „${pk.name}“ startet …`),
        }),
        el('button', { class: 'leise', type: 'button', text: 'Bearbeiten', onclick: () => paketDialog(pk) }))));
    $('pakete').replaceChildren(...(liste.length ? liste : [el('p', { class: 'klein leer-text', text: 'Mehrere Projekte mit einem Klick starten, in fester Reihenfolge – z. B. Server, dann Website.' })]));
  }

  function checkZeichnen() {
    const c = stand.check || { ergebnisse: [] };
    const favoriten = stand.projekte.filter((p) => p.favorit);
    const pruefbar = favoriten.filter((p) => (p.checkSkripte || []).length);
    $('checkStarten').disabled = Boolean(c.laeuft) || !pruefbar.length;
    $('checkStarten').textContent = c.laeuft ? 'Prüft …' : 'Schnellcheck starten';
    $('checkTaeglich').checked = Boolean(c.taeglich);
    let info = '';
    if (c.laeuft) info = `Läuft seit ${uhrFormat.format(c.start)}`;
    else if (c.ende) info = `Zuletzt: ${uhrFormat.format(c.ende)}`;
    if (!pruefbar.length) info = favoriten.length ? 'Die Favoriten haben kein test-, check- oder lint-Skript.' : 'Prüft test, check und lint der Favoriten (★).';
    $('checkInfo').textContent = info;
    const projektVon = new Map(stand.projekte.map((p) => [p.id, p]));
    $('checkListe').replaceChildren(...(c.ergebnisse || []).map((e) => el('button', {
      class: `ampel ${e.zustand}`, type: 'button', title: e.text || (e.dauer ? `${sekunden(e.dauer)}${e.code ? ` · Code ${e.code}` : ''}` : e.zustand),
      onclick: () => { const p = projektVon.get(e.id); if (p) zeigeLog(p, 'befehl'); },
    }, el('span', { class: 'licht' }), `${e.name} · ${e.skript}`)));
  }

  $('checkStarten').addEventListener('click', () => tu('/schnellcheck', {}, 'Schnellcheck läuft …'));
  $('checkTaeglich').addEventListener('change', (e) => tu('/einstellung', { checkTaeglich: e.target.checked },
    e.target.checked ? 'Der Schnellcheck läuft jetzt einmal am Tag von selbst (ab 6 Uhr, sobald der Agent gefragt wird).' : 'Täglicher Schnellcheck aus.'));
  $('neuesPaket').addEventListener('click', () => paketDialog(null));

  // --- Dialoge -------------------------------------------------------------

  const dialog = $('dialog');
  let dialogEnde = null;
  function oeffneDialog(titel, ...inhalt) {
    if (dialogEnde) dialogEnde();
    dialogEnde = null;
    $('dialogTitel').textContent = titel;
    $('dialogInhalt').replaceChildren(...inhalt.flat().filter(Boolean));
    if (!dialog.open) dialog.showModal();
  }
  function schliesseDialog() { if (dialog.open) dialog.close(); }
  dialog.addEventListener('close', () => { if (dialogEnde) dialogEnde(); dialogEnde = null; });
  $('dialogZu').addEventListener('click', schliesseDialog);
  dialog.addEventListener('click', (e) => { if (e.target === dialog) schliesseDialog(); });

  // Log (5): suchen, nur Fehler, Farben, kopieren, laufend aktualisieren.
  const FEHLER = /\berr(or)?\b|fehler|failed|fail\b|exception|cannot|can't|EADDRINUSE|already in use|not found|nicht gefunden|✘|✗|\bERR_|panic|fatal/i;
  const WARNUNG = /warn|warnung|deprecated|veraltet/i;
  function zeigeLog(p, art = '') {
    const ausgabe = el('div', { class: 'log', role: 'log' });
    const filterFeld = el('input', { type: 'search', placeholder: 'Im Log suchen …', 'aria-label': 'Im Log suchen' });
    const nurFehler = el('input', { type: 'checkbox' });
    const live = el('input', { type: 'checkbox', checked: 'checked' });
    const zeilenWahl = el('select', { 'aria-label': 'Zeilen' }, [200, 1000, 2000].map((z) => el('option', { value: String(z), text: `${z} Zeilen` })));
    const zaehler = el('span', { class: 'klein' });
    let text = '';
    const male = () => {
      const unten = ausgabe.scrollHeight - ausgabe.scrollTop - ausgabe.clientHeight < 30;
      const such = filterFeld.value.trim().toLowerCase();
      const zeilen = text.split(/\r?\n/);
      const treffer = zeilen.filter((z) => (!nurFehler.checked || FEHLER.test(z) || WARNUNG.test(z)) && (!such || z.toLowerCase().includes(such)));
      ausgabe.replaceChildren(...treffer.map((z) => {
        const klasse = z.startsWith('> ') ? 'kopf' : FEHLER.test(z) ? 'rot' : WARNUNG.test(z) ? 'gelb' : /https?:\/\//.test(z) ? 'blau' : '';
        const d = el('div', { class: klasse });
        if (such) {
          let rest = z;
          let i;
          while ((i = rest.toLowerCase().indexOf(such)) >= 0) {
            d.append(rest.slice(0, i), el('mark', { text: rest.slice(i, i + such.length) }));
            rest = rest.slice(i + such.length);
          }
          d.append(rest);
        } else d.textContent = z || ' ';
        return d;
      }));
      zaehler.textContent = such || nurFehler.checked ? `${treffer.length} von ${zeilen.length} Zeilen` : `${zeilen.length} Zeilen`;
      if (unten) ausgabe.scrollTop = ausgabe.scrollHeight;
    };
    const lade = async () => {
      try {
        const neu = (await agent(`/log?id=${p.id}&zeilen=${zeilenWahl.value}${art ? `&art=${art}` : ''}`)).text || '(noch leer)';
        if (neu !== text) { text = neu; male(); }
      } catch (f) { text = f.message; male(); }
    };
    filterFeld.addEventListener('input', male);
    nurFehler.addEventListener('change', male);
    zeilenWahl.addEventListener('change', lade);
    const timer = setInterval(() => { if (live.checked && !document.hidden) lade(); }, 2000);
    const titel = art === 'befehl' ? `${p.name}: ${p.lauf?.skript || 'Skript'} – Ausgabe` : `${p.name}: Log`;
    const lauft = art === 'befehl' && p.lauf?.zustand === 'laeuft';
    oeffneDialog(titel,
      el('div', { class: 'zeile werkzeug-log' }, filterFeld,
        el('label', { class: 'schalter' }, nurFehler, 'Nur Fehler & Warnungen'),
        el('label', { class: 'schalter' }, live, 'Live'),
        zeilenWahl,
        el('button', { type: 'button', text: 'Kopieren', onclick: (e) => kopiereText(text, e.currentTarget) }),
        lauft ? el('button', { type: 'button', class: 'gefahr', text: 'Skript stoppen', onclick: () => tu('/befehl', { id: p.id, aktion: 'stoppen' }, 'Skript gestoppt.') }) : null,
        zaehler),
      ausgabe);
    dialog.classList.add('breit');
    dialogEnde = () => { clearInterval(timer); dialog.classList.remove('breit'); };
    lade().then(() => { ausgabe.scrollTop = ausgabe.scrollHeight; });
  }

  // QR-Code fuers Handy (10).
  function qrDialog(s, p) {
    const port = s.ports[0];
    const lan = stand.lan || [];
    const inhalt = [];
    if (!lan.length) inhalt.push(el('p', { class: 'klein', text: 'Dieser Rechner hat gerade keine Adresse im Heimnetz (WLAN/LAN).' }));
    for (const ip of lan.slice(0, 2)) {
      const url = `http://${ip}:${port}/`;
      inhalt.push(el('div', { class: 'qr-block' }, qrSvg(url),
        el('div', { class: 'qr-text' },
          el('a', { href: url, target: '_blank', rel: 'noopener', text: url }),
          el('button', { type: 'button', text: 'Kopieren', onclick: (e) => kopiereText(url, e.currentTarget) }))));
    }
    if (s.nurLokal) {
      inhalt.push(el('p', { class: 'hinweis', text: 'Achtung: Der Server lauscht nur auf diesem Rechner (localhost). Das Handy erreicht ihn erst, wenn er im Heimnetz lauscht (z. B. vite --host).' }));
      if (p?.host) inhalt.push(el('button', { type: 'button', class: 'haupt', text: 'Fürs Heimnetz neu starten', onclick: () => { schliesseDialog(); neuStarten(p, { host: true }); } }));
    } else if (lan.length) inhalt.push(el('p', { class: 'klein', text: 'Handy im selben WLAN, Kamera auf den Code halten. Fragt Windows nach der Firewall: „Private Netzwerke“ zulassen.' }));
    oeffneDialog(`${p ? p.name : s.name} auf dem Handy`, inhalt);
  }

  function qrSvg(text) {
    const q = window.miwaleQR(text);
    const rand = 3;
    const n = q.groesse + rand * 2;
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('viewBox', `0 0 ${n} ${n}`);
    svg.setAttribute('class', 'qr');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `QR-Code für ${text}`);
    let d = '';
    for (let y = 0; y < q.groesse; y++) for (let x = 0; x < q.groesse; x++) if (q.dunkel(x, y)) d += `M${x + rand} ${y + rand}h1v1h-1z`;
    const hg = document.createElementNS(SVG, 'rect');
    hg.setAttribute('width', String(n)); hg.setAttribute('height', String(n)); hg.setAttribute('fill', '#fff');
    const pfad = document.createElementNS(SVG, 'path');
    pfad.setAttribute('d', d); pfad.setAttribute('fill', '#000');
    svg.append(hg, pfad);
    return svg;
  }

  // Notiz (11)
  function notizDialog(p) {
    const feld = el('textarea', { rows: '7', maxlength: '2000', placeholder: 'Wo war ich stehen geblieben? Was ist als Nächstes dran?' });
    feld.value = p.notiz || '';
    oeffneDialog(`Notiz: ${p.name}`,
      el('p', { class: 'klein', text: 'Bleibt auf diesem Rechner (beim Agenten), nicht im Projekt.' }), feld,
      el('div', { class: 'zeile ende' },
        p.notiz ? el('button', { type: 'button', class: 'gefahr', text: 'Löschen', onclick: () => { schliesseDialog(); merke(p, { notiz: '' }, 'Notiz gelöscht.'); } }) : null,
        el('button', { type: 'button', class: 'haupt', text: 'Speichern', onclick: () => { schliesseDialog(); merke(p, { notiz: feld.value }, 'Notiz gespeichert.'); } })));
    setTimeout(() => feld.focus(), 30);
  }

  // Gruppe (2)
  function gruppeDialog(p) {
    const feld = el('input', { type: 'text', maxlength: '40', list: 'gruppenListe', placeholder: 'z. B. miwale, Spiele, Bots', value: p.gruppe || '' });
    const speichern = () => { schliesseDialog(); merke(p, { gruppe: feld.value }, feld.value.trim() ? `${p.name} → ${feld.value.trim()}` : 'Gruppe entfernt.'); };
    feld.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); speichern(); } });
    oeffneDialog(`Gruppe: ${p.name}`,
      el('datalist', { id: 'gruppenListe' }, (stand.gruppen || []).map((g) => el('option', { value: g }))),
      feld,
      el('div', { class: 'zeile', style: 'gap:6px' }, (stand.gruppen || []).map((g) => el('button', { type: 'button', class: 'chip', text: g, onclick: () => { feld.value = g; speichern(); } }))),
      el('div', { class: 'zeile ende' },
        p.gruppe ? el('button', { type: 'button', class: 'leise', text: 'Aus der Gruppe nehmen', onclick: () => { feld.value = ''; speichern(); } }) : null,
        el('button', { type: 'button', class: 'haupt', text: 'Speichern', onclick: speichern })));
    setTimeout(() => feld.focus(), 30);
  }

  // Startpaket bearbeiten (3): Reihenfolge = Reihenfolge des Anklickens.
  function paketDialog(pk) {
    const name = el('input', { type: 'text', maxlength: '40', placeholder: 'Name, z. B. miwale komplett', value: pk?.name || '' });
    const gewaehlt = [...(pk?.ids || [])];
    const sucheFeld = el('input', { type: 'search', placeholder: 'Projekte filtern …' });
    const liste = el('div', { class: 'auswahl' });
    const kandidaten = stand.projekte.filter((p) => startbar(p) || p.programm);
    const male = () => {
      const w = sucheFeld.value.toLowerCase().split(/\s+/).filter(Boolean);
      const reihe = [...gewaehlt.map((id) => kandidaten.find((p) => p.id === id)).filter(Boolean),
        ...sortiere(kandidaten.filter((p) => !gewaehlt.includes(p.id) && passt(p, w))).slice(0, 40)];
      liste.replaceChildren(...reihe.map((p) => {
        const i = gewaehlt.indexOf(p.id);
        return el('button', {
          type: 'button', class: `auswahl-eintrag${i >= 0 ? ' an' : ''}`,
          onclick: () => { if (i >= 0) gewaehlt.splice(i, 1); else gewaehlt.push(p.id); male(); },
        }, el('span', { class: 'nr', text: i >= 0 ? String(i + 1) : '+' }), el('span', { class: 'name', text: p.name }), el('span', { class: 'art', text: p.art }));
      }));
    };
    sucheFeld.addEventListener('input', male);
    male();
    oeffneDialog(pk ? `Startpaket „${pk.name}“` : 'Neues Startpaket',
      name,
      el('p', { class: 'klein', text: 'Projekte anklicken – in dieser Reihenfolge wird gestartet. Jeder Dev-Server kommt erst dran, wenn der vorige seinen Port hat.' }),
      sucheFeld, liste,
      el('div', { class: 'zeile ende' },
        pk ? el('button', { type: 'button', class: 'gefahr', text: 'Löschen', onclick: () => { schliesseDialog(); tu('/paket', { aktion: 'loeschen', name: pk.name }, 'Paket gelöscht.'); } }) : null,
        el('button', {
          type: 'button', class: 'haupt', text: 'Speichern',
          onclick: () => {
            if (!name.value.trim()) return name.focus();
            if (!gewaehlt.length) return zeige('Erst Projekte auswählen.', true);
            schliesseDialog();
            tu('/paket', { aktion: 'speichern', name: name.value, alterName: pk?.name, ids: gewaehlt }, 'Paket gespeichert.');
          },
        })));
    setTimeout(() => name.focus(), 30);
  }

  // --- Menue je Projekt (7, 8, 2, 4, 11) -----------------------------------

  const menueEl = $('menue');
  function schliesseMenue() { menueEl.hidden = true; menueEl.replaceChildren(); }
  function menue(p, knopf) {
    if (!menueEl.hidden && menueEl.dataset.id === p.id) return schliesseMenue();
    const eintrag = (text, onclick, titel) => el('button', { type: 'button', role: 'menuitem', text, title: titel, onclick: () => { schliesseMenue(); onclick(); } });
    const apps = stand.apps || {};
    const teile = [el('div', { class: 'menue-kopf', text: 'Öffnen in' })];
    if (apps.code) teile.push(eintrag('VS Code', () => tu('/oeffnen-mit', { id: p.id, mit: 'code' })));
    teile.push(eintrag('Terminal', () => tu('/oeffnen-mit', { id: p.id, mit: 'terminal' })));
    if (apps.claude) teile.push(eintrag('Claude Code', () => tu('/oeffnen-mit', { id: p.id, mit: 'claude' })));
    if (p.editor && startbar(p)) teile.push(eintrag(`${p.editor}-Editor`, () => tu('/oeffnen-mit', { id: p.id, mit: 'editor' })));
    teile.push(eintrag('Explorer', () => zeigeOrdner(p.id)));
    if (p.git?.web) teile.push(eintrag(/github\.com/.test(p.git.web) ? 'GitHub' : 'Repository im Browser', () => window.open(p.git.web, '_blank', 'noopener')));
    const m = aufMiwale(p);
    if (m) teile.push(eintrag('Auf miwale.com', () => window.open(m.pfad, '_blank', 'noopener')));

    if (p.git) {
      teile.push(el('div', { class: 'menue-kopf', text: 'Git' }));
      teile.push(eintrag('Abrufen (fetch)', () => gitAktion(p, 'fetch'), 'Holt den Stand vom Server, ändert nichts lokal'));
      teile.push(eintrag(p.git.zurueck ? `Pull (${p.git.zurueck} neu)` : 'Pull', () => gitAktion(p, 'pull'), 'git pull --ff-only: holt nur, überschreibt nie etwas'));
    }

    const skripte = (p.skripte || []).filter((s) => s !== p.skript);
    if (skripte.length) {
      teile.push(el('div', { class: 'menue-kopf', text: 'Skripte' }));
      const laeuft = p.lauf?.zustand === 'laeuft';
      for (const s of skripte) {
        teile.push(eintrag(`${laeuft && p.lauf.skript === s ? '■ ' : '▶ '}${s}`, () => (laeuft && p.lauf.skript === s
          ? tu('/befehl', { id: p.id, aktion: 'stoppen' }, `${s} gestoppt.`)
          : tu('/befehl', { id: p.id, skript: s }, `${p.name}: ${s} läuft …`)), laeuft && p.lauf.skript !== s ? `Erst „${p.lauf.skript}“ abwarten` : `${p.pm || 'npm'} run ${s}`));
      }
      if (p.lauf) teile.push(eintrag('Ausgabe des letzten Skripts', () => zeigeLog(p, 'befehl')));
    }

    if (startbar(p)) {
      teile.push(el('div', { class: 'menue-kopf', text: 'Starten' }));
      teile.push(eintrag('Auf anderem Port starten', () => neuStarten(p, { andererPort: true }), 'Sucht einen freien Port'));
      if (p.host) teile.push(eintrag('Fürs Handy starten (Heimnetz)', () => neuStarten(p, { host: true }), 'Startet mit --host, damit Geräte im WLAN ihn erreichen'));
      teile.push(eintrag(`${p.neustart ? '✓ ' : ''}Nach Absturz neu starten`, () => merke(p, { neustart: !p.neustart }, p.neustart ? 'Kein automatischer Neustart mehr.' : `${p.name} startet nach einem Absturz von selbst neu (höchstens 3× in 10 Min.).`)));
      teile.push(eintrag('Log', () => zeigeLog(p)));
    }

    teile.push(el('div', { class: 'menue-kopf', text: 'Ordnen' }));
    teile.push(eintrag(p.favorit ? 'Favorit entfernen' : 'Als Favorit anheften', () => merke(p, { favorit: !p.favorit })));
    teile.push(eintrag(p.gruppe ? `Gruppe: ${p.gruppe} …` : 'Gruppe …', () => gruppeDialog(p)));
    teile.push(eintrag(p.notiz ? 'Notiz bearbeiten …' : 'Notiz …', () => notizDialog(p)));
    teile.push(eintrag('Ausblenden', () => tu('/ausblenden', { id: p.id }, `${p.name} ausgeblendet.`)));

    menueEl.replaceChildren(...teile);
    menueEl.dataset.id = p.id;
    menueEl.hidden = false;
    const r = knopf.getBoundingClientRect();
    const h = menueEl.offsetHeight;
    const w = menueEl.offsetWidth;
    const unten = r.bottom + 4 + h > window.innerHeight && r.top - 4 - h > 0;
    menueEl.style.top = `${Math.max(8, unten ? r.top - h - 4 : Math.min(r.bottom + 4, window.innerHeight - h - 8))}px`;
    menueEl.style.left = `${Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8))}px`;
    menueEl.querySelector('button')?.focus();
  }
  document.addEventListener('click', (e) => { if (!menueEl.hidden && !menueEl.contains(e.target) && !e.target.closest('.mehr-knopf')) schliesseMenue(); });
  window.addEventListener('scroll', () => { if (!menueEl.hidden) schliesseMenue(); }, { passive: true });
  window.addEventListener('resize', schliesseMenue);

  // --- Zeichnen ------------------------------------------------------------

  // RAM und CPU aendern sich bei jeder Abfrage: nur diese Zahlen tauschen, sonst
  // verloere ein Knopf alle paar Sekunden den Fokus.
  const ohneMesswerte = (k, v) => (k === 'ram' || k === 'cpu' || k === 'ereignisse' ? undefined : v);

  function zeichne(erzwingen = false) {
    $('punkt').classList.toggle('an', Boolean(stand));
    $('ohneAgent').hidden = Boolean(stand);
    $('mitAgent').hidden = !stand;
    $('veraltet').hidden = !stand || stand.version >= VERSION;
    if (!stand) {
      $('geraet').textContent = 'Kein Agent auf diesem Gerät';
      letzterText = '';
      return;
    }
    $('geraet').textContent = `Dieses Gerät: ${stand.rechner}`;
    $('suchStand').textContent = zuletztGesucht(stand.suche);
    for (const s of stand.server) {
      for (const e of document.querySelectorAll(`[data-res="${s.pid}"]`)) e.textContent = ressourcenText(s);
    }

    const woerter = suche.value.toLowerCase().split(/\s+/).filter(Boolean);
    const text = JSON.stringify([stand, woerter, auswahl, [...wartend], [...offen], filter, gruppe, sortierung, miwale.id.size], ohneMesswerte);
    if (!erzwingen && text === letzterText) return;
    letzterText = text;

    // Laeuft gerade
    const projektVon = new Map(stand.projekte.map((p) => [p.id, p]));
    const instanzen = stand.server.filter((s) => s.projekt);
    const zeilen = [];
    const gezaehlt = new Map();
    for (const s of instanzen) {
      const von = instanzen.filter((x) => x.projekt === s.projekt).length;
      const nr = (gezaehlt.get(s.projekt) || 0) + 1;
      gezaehlt.set(s.projekt, nr);
      zeilen.push(instanzZeile(s, projektVon.get(s.projekt), nr, von));
    }
    for (const p of stand.projekte) {
      if (!p.ports.length && (p.zustand === 'startet' || p.zustand === 'laeuft' || wartend.get(p.id) === 'start')) zeilen.push(startendZeile(p));
    }
    $('laufend').replaceChildren(...(zeilen.length ? zeilen : [el('div', { class: 'leer-text', text: 'Gerade läuft nichts.' })]));
    $('laufendZahl').textContent = String(zeilen.length);
    $('alleStoppen').disabled = !zeilen.length;

    // Werkbank: Startpakete und Schnellcheck (ab Agent 9)
    $('werkbank').hidden = !stand.pakete;
    if (stand.pakete) { paketeZeichnen(); checkZeichnen(); }

    // Gruppen-Auswahl
    const gruppen = stand.gruppen || [];
    if (gruppe && gruppe !== '-' && !gruppen.includes(gruppe)) gruppe = '';
    $('gruppe').hidden = !gruppen.length;
    $('gruppe').replaceChildren(el('option', { value: '', text: 'Alle Gruppen' }), ...gruppen.map((g) => el('option', { value: g, text: g })), el('option', { value: '-', text: 'Ohne Gruppe' }));
    $('gruppe').value = gruppe;

    // Projekte: Suche -> Gruppe -> Zahlen je Filter -> Filter -> Sortierung
    const passend = stand.projekte.filter((p) => passt(p, woerter) && (!gruppe || (gruppe === '-' ? !p.gruppe : p.gruppe === gruppe)));
    for (const knopf of $('filter').querySelectorAll('button')) {
      const f = knopf.dataset.filter;
      knopf.setAttribute('aria-pressed', String(f === filter));
      knopf.querySelector('.anzahl').textContent = String(passend.filter(FILTER[f]).length);
    }
    for (const knopf of $('tabkopf').querySelectorAll('button[data-sort]')) {
      const aktiv = knopf.dataset.sort === sortierung.feld;
      if (aktiv) knopf.setAttribute('aria-sort', sortierung.richtung > 0 ? 'ascending' : 'descending');
      else knopf.removeAttribute('aria-sort');
      knopf.querySelector('.pfeil').textContent = aktiv ? (sortierung.richtung > 0 ? '↑' : '↓') : '';
    }

    sichtbar = sortiere(passend.filter(FILTER[filter]));
    if (auswahl >= sichtbar.length) auswahl = Math.max(0, sichtbar.length - 1);
    $('projekteZahl').textContent = String(stand.projekte.length);

    let leer = stand.suche.laeuft ? 'Suche Projekte auf allen Laufwerken …' : 'Keine Projekte gefunden.';
    if (stand.projekte.length) {
      if (woerter.length) leer = 'Kein Projekt passt zur Suche.';
      else if (filter === 'favoriten') leer = 'Noch keine Favoriten – mit ☆ in einer Zeile anheften.';
      else if (filter === 'laeuft') leer = 'Gerade läuft keins der Projekte.';
      else if (filter === 'startbar') leer = 'Kein startbares Projekt gefunden.';
      else if (gruppe) leer = 'In dieser Gruppe ist nichts.';
    }
    $('projekte').replaceChildren(...(sichtbar.length
      ? sichtbar.map((p, i) => projektZeile(p, i + 1, woerter.length > 0 && i === auswahl))
      : [el('div', { class: 'leer-text', text: leer })]));

    const aus = $('ausgeblendet');
    aus.hidden = !stand.ausgeblendet;
    aus.replaceChildren(`${stand.ausgeblendet} ausgeblendet · `, el('button', { class: 'leise', type: 'button', text: 'wieder zeigen', onclick: () => agent('/ausblenden', { aus: false }).then(abfragen) }));
    $('neuSuchen').textContent = stand.suche.laeuft ? 'Suche läuft …' : 'Neu suchen';
    $('neuSuchen').disabled = stand.suche.laeuft;

    const sonstige = stand.server.filter((s) => !s.projekt);
    $('sonstigeAbschnitt').hidden = !sonstige.length;
    $('sonstige').replaceChildren(...sonstige.map(sonstigeZeile));
  }

  setInterval(() => {
    for (const e of document.querySelectorAll('[data-seit]')) e.textContent = dauer(e.dataset.seit);
  }, 20000);

  // --- Tastatur ------------------------------------------------------------

  suche.addEventListener('input', () => { auswahl = 0; zeichne(); });

  document.addEventListener('keydown', (e) => {
    if (!stand || e.ctrlKey || e.metaKey || e.altKey || dialog.open) return;
    if (!menueEl.hidden) { if (e.key === 'Escape') { e.preventDefault(); schliesseMenue(); } return; }
    const imSuchfeld = e.target === suche;
    if (imSuchfeld) {
      if (e.key === 'Enter') { e.preventDefault(); aktion(sichtbar[auswahl]); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); auswahl = Math.min(auswahl + 1, sichtbar.length - 1); zeichne(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); auswahl = Math.max(auswahl - 1, 0); zeichne(); }
      else if (e.key === 'Escape') { e.preventDefault(); if (suche.value) { suche.value = ''; auswahl = 0; zeichne(); } else suche.blur(); }
      return;
    }
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
    if (/^[1-9]$/.test(e.key)) { e.preventDefault(); aktion(sichtbar[Number(e.key) - 1]); }
    else if (e.key === 'Delete') { e.preventDefault(); alleStoppen(); }
    else if (e.key === 'Escape') { suche.value = ''; auswahl = 0; zeichne(); }
    else if (e.key.length === 1 && /\S/.test(e.key)) suche.focus(); // der Buchstabe landet dann im Suchfeld
  });

  ladeMiwale();
  setInterval(ladeMiwale, 10 * 60 * 1000);
  abfragen();
})();
