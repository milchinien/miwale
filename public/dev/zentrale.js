// Dev-Zentrale (miwale.com/dev): spricht im Browser mit dem Agenten auf
// diesem Geraet (agent.mjs, 127.0.0.1:5300). Kein Agent -> Anleitung.
// Alle Texte aus dem Agenten kommen per textContent ins DOM, nie als HTML.
(() => {
  'use strict';

  const AGENT = 'http://127.0.0.1:5300';
  const VERSION = 7;
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
  const logs = new Map(); // id -> Text, solange das Log aufgeklappt ist
  const offen = new Set(); // ids mit aufgeklappten Kopien

  // Filter und Sortierung bleiben ueber Besuche hinweg.
  const FILTER = {
    alle: () => true,
    startbar: (p) => startbar(p) || Boolean(p.programm),
    laeuft: (p) => laeuftGerade(p),
  };
  let filter = FILTER[localStorage.getItem('miwale-dev-filter')] ? localStorage.getItem('miwale-dev-filter') : 'alle';
  let sortierung = (() => {
    try {
      const s = JSON.parse(localStorage.getItem('miwale-dev-sortierung'));
      if (['name', 'erstellt', 'aktiv'].includes(s.feld) && [1, -1].includes(s.richtung)) return s;
    } catch { /* Standard */ }
    return { feld: 'aktiv', richtung: -1 };
  })();

  const meldung = document.createElement('p');
  meldung.className = 'klein';
  meldung.style.margin = '0';
  meldung.setAttribute('role', 'status');
  meldung.hidden = true;
  $('filter').parentElement.before(meldung);

  function zeige(text, fehler = false) {
    meldung.textContent = text;
    meldung.style.color = fehler ? '#F7C7B4' : '';
    meldung.hidden = !text;
    clearTimeout(zeige.timer);
    if (text) zeige.timer = setTimeout(() => { meldung.hidden = true; }, 6000);
  }

  oeffnenSchalter.checked = localStorage.getItem('miwale-dev-oeffnen') !== 'nein';
  oeffnenSchalter.addEventListener('change', () => localStorage.setItem('miwale-dev-oeffnen', oeffnenSchalter.checked ? 'ja' : 'nein'));

  for (const id of ['installBefehl', 'installBefehl2']) $(id).textContent = installBefehl;
  async function kopiere(knopf) {
    try {
      await navigator.clipboard.writeText(installBefehl);
      $('kopiert').hidden = false;
      knopf.textContent = 'Kopiert ✓';
    } catch {
      const bereich = document.getSelection();
      bereich.selectAllChildren($('installBefehl'));
      knopf.textContent = 'Markiert – Strg+C';
    }
  }
  $('kopieren').addEventListener('click', (e) => kopiere(e.currentTarget));
  $('kopieren2').addEventListener('click', (e) => kopiere(e.currentTarget));

  // --- Agent ---------------------------------------------------------------

  async function agent(pfad, daten) {
    const abbruch = new AbortController();
    const timer = setTimeout(() => abbruch.abort(), 8000);
    try {
      const antwort = await fetch(AGENT + pfad, daten === undefined
        ? { signal: abbruch.signal, cache: 'no-store' }
        : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(daten), signal: abbruch.signal });
      const wert = await antwort.json().catch(() => ({}));
      if (!antwort.ok) throw new Error(wert.fehler || `Agent antwortet ${antwort.status}`);
      return wert;
    } finally {
      clearTimeout(timer);
    }
  }

  let naechste = null;
  async function abfragen() {
    clearTimeout(naechste);
    try {
      stand = await agent('/status');
      for (const p of stand.projekte) {
        const w = wartend.get(p.id);
        if ((w === 'start' && p.zustand !== 'aus') || (w === 'stopp' && p.zustand === 'aus')) wartend.delete(p.id);
      }
      zeichne();
    } catch {
      stand = null;
      zeichne();
    }
    const eilig = wartend.size || stand?.projekte.some((p) => p.zustand === 'startet') || stand?.suche.laeuft;
    naechste = setTimeout(abfragen, document.hidden ? 10000 : stand ? (eilig ? 1000 : 2500) : 3000);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) abfragen(); });

  // Aeltere Agenten (bis 3) kannten nur startbare Projekte.
  const startbar = (p) => p.startbar ?? true;
  const laeuftGerade = (p) => p.ports.length > 0 || p.zustand === 'startet' || p.zustand === 'laeuft' || wartend.get(p.id) === 'start';

  // --- Aktionen ------------------------------------------------------------

  function oeffne(port) {
    window.open(`http://localhost:${port}/`, '_blank', 'noopener');
  }

  function zeigeOrdner(id, datei) {
    agent('/ordner', datei ? { id, datei } : { id }).catch((f) => zeige(f.message, true));
  }

  // Enter, Ziffer oder Hauptknopf: laeuft -> oeffnen, startbar -> starten,
  // HTML -> index.html im Browser, sonst den Ordner.
  async function aktion(p) {
    if (!p) return;
    if (p.ports.length) return oeffne(p.ports[0]);
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
      await agent('/starten', { id: p.id, oeffnen: oeffnenSchalter.checked });
      zeige(`${p.name} startet …${oeffnenSchalter.checked ? ' Der Browser öffnet es, sobald der Server steht.' : ''}`);
    } catch (f) {
      wartend.delete(p.id);
      zeige(`${p.name}: ${f.message}`, true);
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

  async function zeigeLog(p) {
    if (logs.has(p.id)) { logs.delete(p.id); return zeichne(true); }
    try {
      logs.set(p.id, (await agent(`/log?id=${p.id}`)).text || '(noch leer)');
    } catch (f) {
      logs.set(p.id, f.message);
    }
    zeichne(true);
  }

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
    for (const kind of kinder.flat()) if (kind) e.append(kind);
    return e;
  }

  const SVG = 'http://www.w3.org/2000/svg';
  const SYMBOL = {
    ordner: 'M3.5 7.5a2 2 0 0 1 2-2h3.6l2 2h7.4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z',
    aus: 'M6.5 6.5l11 11M17.5 6.5l-11 11',
  };

  function symbolKnopf(symbol, titel, onclick) {
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const pfad = document.createElementNS(SVG, 'path');
    pfad.setAttribute('d', SYMBOL[symbol]);
    svg.append(pfad);
    return el('button', { class: 'symbol', type: 'button', title: titel, 'aria-label': titel, onclick }, svg);
  }

  const datumFormat = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const zeitFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'long', timeStyle: 'short' });

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

  function zuletztGesucht(s) {
    if (s.laeuft || !s.zeit) return '';
    const min = Math.round((Date.now() - s.zeit) / 60000);
    return min < 1 ? 'Gerade gesucht' : min < 60 ? `Gesucht vor ${min} Min.` : `Gesucht vor ${Math.floor(min / 60)} Std.`;
  }

  function passt(p, woerter) {
    const text = `${p.name} ${p.ordner} ${p.art || ''} ${p.start || ''}`.toLowerCase();
    return woerter.every((w) => text.includes(w));
  }

  // Fehlende Daten stehen in beiden Richtungen hinten.
  const VERGLEICH = {
    name: (a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base', numeric: true }),
    erstellt: (a, b) => (a.erstellt || 0) - (b.erstellt || 0),
    aktiv: (a, b) => (a.aktiv || 0) - (b.aktiv || 0),
  };

  function sortiere(liste) {
    const { feld, richtung } = sortierung;
    return [...liste].sort((a, b) => {
      if (feld !== 'name' && Boolean(a[feld]) !== Boolean(b[feld])) return a[feld] ? -1 : 1;
      return VERGLEICH[feld](a, b) * richtung || VERGLEICH.name(a, b);
    });
  }

  function zustandMarke(p) {
    const w = wartend.get(p.id);
    if (p.repariert) return el('span', { class: 'marke startet', text: 'repariert + startet …', title: 'Der erste Start ist gescheitert – Pakete werden neu installiert' });
    if (p.installiertGerade) return el('span', { class: 'marke startet', text: 'installiert + startet …' });
    if (w === 'start' || p.zustand === 'startet') return el('span', { class: 'marke startet', text: 'startet …' });
    if (w === 'stopp') return el('span', { class: 'marke', text: 'stoppt …' });
    if (p.zustand === 'laeuft') return el('span', { class: 'marke laeuft', text: 'läuft' });
    if (p.zustand === 'fehler') return el('span', { class: 'marke fehler', text: 'Fehler' });
    return null;
  }

  function portLinks(ports) {
    if (!ports.length) return null;
    return el('span', { class: 'ports' }, ports.map((port) => el('a', { href: `http://localhost:${port}/`, target: '_blank', rel: 'noopener', text: `:${port}` })));
  }

  function logKnopf(p) {
    return el('button', { class: 'leise', type: 'button', text: logs.has(p.id) ? 'Log zu' : 'Log', onclick: () => zeigeLog(p) });
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

  function projektZeile(p, nr, treffer) {
    const w = wartend.get(p.id);
    const laeuft = p.ports.length > 0;
    const instanzen = stand.server.filter((s) => s.projekt === p.id).length;
    const knoepfe = [hauptKnopf(p)];
    if (p.zustand !== 'aus' || laeuft) {
      knoepfe.push(el('button', {
        class: 'gefahr', type: 'button', text: instanzen > 1 ? `Alle ${instanzen} stoppen` : 'Stop',
        title: instanzen > 1 ? 'Einzeln stoppen: oben unter „Läuft gerade“' : null,
        disabled: w === 'stopp' ? 'disabled' : null, onclick: () => stoppe({ id: p.id }, p.name),
      }));
    }
    if (p.zustand === 'fehler') knoepfe.push(logKnopf(p));
    knoepfe.push(symbolKnopf('ordner', 'Ordner im Explorer öffnen', () => zeigeOrdner(p.id)));
    knoepfe.push(symbolKnopf('aus', `${p.name} ausblenden`, () => agent('/ausblenden', { id: p.id }).then(abfragen).catch((f) => zeige(f.message, true))));

    const kopien = p.kopien || [];
    const kopienOffen = offen.has(p.id);
    const titel = el('div', { class: 'titelzeile' },
      el('span', { class: 'name', text: p.name }),
      p.art ? el('span', { class: 'art', text: p.art }) : null,
      zustandMarke(p), portLinks(p.ports),
      laeuft ? el('span', { class: 'klein', 'data-seit': p.seit, text: dauer(p.seit) }) : null,
      p.backup ? el('span', { class: 'marke archiv', text: 'nur im Backup', title: 'Liegt nur in einem Sicherungs- oder Archivordner' }) : null,
      kopien.length ? el('button', {
        class: 'chip', type: 'button', 'aria-expanded': String(kopienOffen),
        text: `${kopien.length} ${kopien.length === 1 ? 'Kopie' : 'Kopien'} ${kopienOffen ? '▴' : '▾'}`,
        title: 'Dasselbe Projekt liegt noch an anderen Orten (z. B. im Backup)',
        onclick: () => { if (!offen.delete(p.id)) offen.add(p.id); zeichne(true); },
      }) : null);
    const pfad = el('div', { class: 'pfad', title: p.start ? `${p.ordner}\nDev-Server in: ${p.start}` : p.ordner },
      p.ordner, p.start ? el('span', { class: 'unter', text: ` → ${p.start}` }) : null);

    const extra = [];
    if (p.zustand === 'fehler' && p.fehler) extra.push(el('p', { class: 'fehlertext', text: p.fehler }));
    if (logs.has(p.id)) extra.push(el('pre', { class: 'log', text: logs.get(p.id) }));
    if (kopienOffen) {
      extra.push(el('div', { class: 'kopien' },
        el('span', { class: 'klein', text: 'Weitere Fundorte – gestartet wird immer der obere Ordner:' }),
        kopien.map((k) => el('div', { class: 'kopie' },
          el('span', { class: 'pfad', title: k.ordner, text: k.ordner }),
          k.backup ? el('span', { class: 'marke archiv', text: 'Backup' }) : null,
          symbolKnopf('ordner', 'Diesen Ordner im Explorer öffnen', () => zeigeOrdner(k.id))))));
    }

    const quelle = p.erstelltQuelle === 'git' ? 'erstes Commit' : 'ältestes Dateidatum im Ordner';
    return el('div', { class: `eintrag${treffer ? ' treffer' : ''}${laeuft ? ' laeuft' : ''}` },
      el('span', {}, nr <= 9 ? el('span', { class: 'nr', text: String(nr) }) : null),
      el('div', { class: 'haupt-spalte' }, titel, pfad),
      el('div', { class: `datum${p.erstellt ? '' : ' leer'}`, title: p.erstellt ? `${zeitFormat.format(p.erstellt)} · ${quelle}` : 'unbekannt' },
        el('span', { class: 'mobil-label', text: 'Erstellt ' }), p.erstellt ? datumFormat.format(p.erstellt) : '–'),
      el('div', { class: `datum${p.aktiv ? '' : ' leer'}`, title: p.aktiv ? `Zuletzt geändert: ${zeitFormat.format(p.aktiv)}` : '' },
        el('span', { class: 'mobil-label', text: 'Bearbeitet ' }), p.aktiv ? vorher(p.aktiv) : '–'),
      el('div', { class: 'aktionen' }, knoepfe),
      extra.length ? el('div', { class: 'extra' }, extra) : null);
  }

  // Ein Projekt, das noch keinen Port hat (startet gerade oder hat keinen Server).
  function startendZeile(p) {
    return el('div', { class: 'eintrag laeuft' },
      el('span', {}),
      el('div', { class: 'haupt-spalte' },
        el('div', { class: 'titelzeile' }, el('span', { class: 'name', text: p.name }), zustandMarke(p),
          el('span', { class: 'klein', 'data-seit': p.seit, text: dauer(p.seit) })),
        logs.has(p.id) ? el('pre', { class: 'log', text: logs.get(p.id) }) : null),
      el('div', { class: 'aktionen' },
        logKnopf(p),
        el('button', { class: 'gefahr', type: 'button', text: 'Stop', disabled: wartend.get(p.id) === 'stopp' ? 'disabled' : null, onclick: () => stoppe({ id: p.id }, p.name) })));
  }

  // Eine laufende Instanz. Mehrere aus demselben Ordner (zweimal pnpm dev)
  // stehen einzeln da und lassen sich einzeln stoppen.
  function instanzZeile(s, p, nr, von) {
    const name = `${p ? p.name : s.name}${von > 1 ? ` · ${nr}/${von}` : ''}`;
    const stoppt = wartend.get(`pid:${s.pid}`) === 'stopp' || (p && wartend.get(p.id) === 'stopp');
    return el('div', { class: 'eintrag laeuft' },
      el('span', {}),
      el('div', { class: 'haupt-spalte' },
        el('div', { class: 'titelzeile' }, el('span', { class: 'name', text: name }),
          el('span', { class: `marke${stoppt ? '' : ' laeuft'}`, text: stoppt ? 'stoppt …' : 'läuft' }), portLinks(s.ports),
          el('span', { class: 'klein', 'data-seit': s.seit, text: dauer(s.seit) }),
          el('span', { class: 'klein', text: `PID ${s.pid}` })),
        p ? el('div', { class: 'pfad', title: p.ordner, text: p.ordner }) : null,
        p && nr === 1 && logs.has(p.id) ? el('pre', { class: 'log', text: logs.get(p.id) }) : null),
      el('div', { class: 'aktionen' },
        p && nr === 1 ? logKnopf(p) : null,
        el('button', { class: 'haupt', type: 'button', text: 'Öffnen', onclick: () => oeffne(s.ports[0]) }),
        el('button', { class: 'gefahr', type: 'button', text: 'Stop', title: 'Nur diese Instanz stoppen', disabled: stoppt ? 'disabled' : null,
          onclick: () => stoppe({ pid: s.pid }, `${p ? p.name : s.name} :${s.ports[0]}`) })));
  }

  function sonstigeZeile(s) {
    return el('div', { class: 'eintrag' },
      el('span', {}),
      el('div', { class: 'haupt-spalte' },
        el('div', { class: 'titelzeile' }, el('span', { class: 'name', text: s.name }), portLinks(s.ports), el('span', { class: 'klein', text: `PID ${s.pid}` })),
        el('div', { class: 'pfad', title: s.befehl, text: s.befehl })),
      el('div', { class: 'aktionen' }, el('button', { class: 'gefahr', type: 'button', text: 'Stop', onclick: () => stoppe({ pid: s.pid }, `PID ${s.pid}`) })));
  }

  // Nur neu aufbauen, wenn sich etwas geaendert hat -- sonst verlöre ein
  // Knopf alle paar Sekunden den Fokus.
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

    const woerter = suche.value.toLowerCase().split(/\s+/).filter(Boolean);
    const text = JSON.stringify([stand, woerter, auswahl, [...wartend], [...logs], [...offen], filter, sortierung]);
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

    // Projekte: Suche -> Zahlen je Filter -> Filter -> Sortierung
    const passend = stand.projekte.filter((p) => passt(p, woerter));
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
      else if (filter === 'laeuft') leer = 'Gerade läuft keins der Projekte.';
      else if (filter === 'startbar') leer = 'Kein startbares Projekt gefunden.';
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
    if (!stand || e.ctrlKey || e.metaKey || e.altKey) return;
    const imSuchfeld = e.target === suche;
    if (imSuchfeld) {
      if (e.key === 'Enter') { e.preventDefault(); aktion(sichtbar[auswahl]); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); auswahl = Math.min(auswahl + 1, sichtbar.length - 1); zeichne(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); auswahl = Math.max(auswahl - 1, 0); zeichne(); }
      else if (e.key === 'Escape') { e.preventDefault(); if (suche.value) { suche.value = ''; auswahl = 0; zeichne(); } else suche.blur(); }
      return;
    }
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (/^[1-9]$/.test(e.key)) { e.preventDefault(); aktion(sichtbar[Number(e.key) - 1]); }
    else if (e.key === 'Delete') { e.preventDefault(); alleStoppen(); }
    else if (e.key === 'Escape') { suche.value = ''; auswahl = 0; zeichne(); }
    else if (e.key.length === 1 && /\S/.test(e.key)) suche.focus(); // der Buchstabe landet dann im Suchfeld
  });

  abfragen();
})();
