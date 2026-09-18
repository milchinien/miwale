// Spieleseite von miwale.com — Startseite mit Highlights, Reihe und Liste,
// dazu eine Seite je Spiel unter /games/<id>. Kein Framework: die Seite ist
// klein genug, und so laedt sie auf dem Handy aus einem Short heraus sofort.
(() => {
  "use strict";

  const SPIELE = window.MIWALE_SPIELE || [];
  const PER_ID = new Map(SPIELE.map((s) => [s.id, s]));
  const SPRACH_SCHLUESSEL = "miwale-sprache"; // derselbe wie im Portfolio
  const WENIG_BEWEGUNG = matchMedia("(prefers-reduced-motion: reduce)");
  const SEITENWEISE = matchMedia("(min-width: 901px)");

  const TEXTE = {
    en: {
      titel: "miwale games — play free in your browser",
      spiele: "Games",
      portfolio: "Portfolio",
      home: "Home",
      ideen: "Game Requests",
      ideenTitel: "Game Requests — miwale games",
      ideenNeuTitel: "Submit your idea — miwale games",
      ideenBeschreibung: "Vote for game ideas or pitch your own — I build one in a single day and put it on miwale.com.",
      zurueckSeite: "Back",
      vorSeite: "Forward",
      neuLaden: "Reload",
      sprachgruppe: "Language",
      highlights: "Featured",
      reihe: "Popular & new",
      alle: "All games",
      beliebt: "Popular",
      neueste: "Newest",
      name: "A–Z",
      spielen: "Play",
      jetztSpielen: "Play now",
      spieleName: (n) => "Play " + n,
      imBrowser: "Runs right in your browser — no download, no sign-up.",
      neuerTab: "Opens in a new tab.",
      veroeffentlicht: "Released",
      status: "Status",
      entwickler: "Developer",
      plattform: "Plays on",
      pc: "PC",
      handy: "Phone",
      nurPc: "Best on a PC with mouse or keyboard.",
      ueber: "About this game",
      features: "Features",
      steuerung: "How to play",
      aehnlich: "More games from miwale",
      alleSpiele: "All games",
      trend: (n) => "Trending #" + n,
      neu: "New",
      zurueck: "Previous",
      weiter: "Next",
      seite: (i, n) => "Page " + i + " of " + n,
      bild: (i, n) => "Media " + i + " of " + n,
      trailer: "Trailer",
      suche: "Search games",
      sucheLeer: "No game found",
      schliessen: "Close",
      vollbild: "Fullscreen",
      vollbildAus: "Exit fullscreen",
      impressum: "Legal notice",
      impressumText: "Responsible for the content: Michel Waggoner. Contact: michi.waggoner@gmail.com",
      nichtGefunden: "This game doesn't exist (anymore).",
      monate: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    },
    de: {
      titel: "miwale games — kostenlos im Browser spielen",
      spiele: "Spiele",
      portfolio: "Portfolio",
      home: "Home",
      ideen: "Game Requests",
      ideenTitel: "Game Requests — miwale games",
      ideenNeuTitel: "Eigene Idee einreichen — miwale games",
      ideenBeschreibung: "Stimm für Spielideen ab oder reich deine eigene ein – ich baue eine an einem Tag und stelle sie auf miwale.com.",
      zurueckSeite: "Zurück",
      vorSeite: "Vor",
      neuLaden: "Neu laden",
      sprachgruppe: "Sprache",
      highlights: "Highlights",
      reihe: "Beliebt & neu",
      alle: "Alle Spiele",
      beliebt: "Beliebt",
      neueste: "Neueste",
      name: "A–Z",
      spielen: "Spielen",
      jetztSpielen: "Jetzt spielen",
      spieleName: (n) => n + " spielen",
      imBrowser: "Läuft direkt im Browser — ohne Download, ohne Anmeldung.",
      neuerTab: "Öffnet sich in einem neuen Tab.",
      veroeffentlicht: "Veröffentlicht",
      status: "Status",
      entwickler: "Entwickler",
      plattform: "Spielbar auf",
      pc: "PC",
      handy: "Handy",
      nurPc: "Am besten am PC mit Maus oder Tastatur.",
      ueber: "Über das Spiel",
      features: "Das erwartet dich",
      steuerung: "So spielst du",
      aehnlich: "Mehr Spiele von miwale",
      alleSpiele: "Alle Spiele",
      trend: (n) => "Angesagt #" + n,
      neu: "Neu",
      zurueck: "Zurück",
      weiter: "Weiter",
      seite: (i, n) => "Seite " + i + " von " + n,
      bild: (i, n) => "Medium " + i + " von " + n,
      trailer: "Trailer",
      suche: "Spiele suchen",
      sucheLeer: "Kein Spiel gefunden",
      schliessen: "Schließen",
      vollbild: "Vollbild",
      vollbildAus: "Vollbild beenden",
      impressum: "Impressum",
      impressumText: "Verantwortlich für den Inhalt: Michel Waggoner. Kontakt: michi.waggoner@gmail.com",
      nichtGefunden: "Dieses Spiel gibt es (nicht mehr).",
      monate: ["Jan.", "Feb.", "März", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sep.", "Okt.", "Nov.", "Dez."]
    }
  };

  const zustand = {
    sprache: startSprache(),
    sortierung: "beliebt",
    highlight: 0,
    reiheSeite: 0,
    vorschau: null,
    medium: 0,
    // Wie viele Verlaufseintraege diese Seite selbst angelegt hat. Nur dann darf
    // Schliessen history.back() nehmen — sonst verliesse ein geteilter Link die Seite.
    eigeneEintraege: 0
  };
  let t = TEXTE[zustand.sprache];
  let highlightTimer = null;
  const app = document.getElementById("app");
  const START_BESCHREIBUNG = (document.querySelector('meta[name="description"]') || {}).content || "";

  // ---- Hilfen -----------------------------------------------------------------

  function startSprache() {
    const gueltig = (x) => x === "en" || x === "de";
    try {
      const q = new URLSearchParams(location.search).get("lang");
      if (gueltig(q)) return q;
      const gespeichert = localStorage.getItem(SPRACH_SCHLUESSEL);
      if (gueltig(gespeichert)) return gespeichert;
    } catch (e) { /* ohne Speicher eben Englisch */ }
    return "en";
  }

  function esc(x) {
    return String(x == null ? "" : x).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  function text(sp) {
    const tx = sp.texte || {};
    return tx[zustand.sprache] || tx.en || { kurz: "", tags: [], ueber: [], features: [], steuerung: "" };
  }

  function lokal(wert) {
    return wert && typeof wert === "object" ? (wert[zustand.sprache] || wert.en || "") : (wert || "");
  }

  // "2026-09-04" -> "4 Sep 2026" bzw. "4. Sep. 2026"
  function datum(iso) {
    const [j, m, tag] = String(iso || "").split("-").map(Number);
    if (!j || !m) return "";
    const monat = t.monate[m - 1];
    if (!tag) return monat + " " + j;
    return zustand.sprache === "de" ? tag + ". " + monat + " " + j : tag + " " + monat + " " + j;
  }

  // Trailer zuerst, dann die Screenshots. Ohne eigene Aufnahmen die alten Bilder.
  function medien(sp) {
    const m = sp.medien || {};
    const liste = [];
    if (m.trailer) liste.push({ typ: "video", src: m.trailer, poster: m.poster || (m.screens || [])[0] || sp.bild });
    for (const src of (m.screens && m.screens.length ? m.screens : sp.bilder || [])) liste.push({ typ: "bild", src });
    if (!liste.length) liste.push({ typ: "bild", src: sp.bild });
    return liste;
  }

  function screens(sp) {
    return medien(sp).filter((x) => x.typ === "bild").map((x) => x.src);
  }

  function sortiert(wie) {
    const liste = SPIELE.slice();
    if (wie === "neueste") return liste.sort((a, b) => (b.veroeffentlicht || "").localeCompare(a.veroeffentlicht || ""));
    if (wie === "name") return liste.sort((a, b) => a.name.localeCompare(b.name, zustand.sprache));
    return liste;
  }

  // Aehnlich heisst: teilt Tags. Bei Gleichstand gewinnt, was beliebter ist.
  function aehnliche(sp, anzahl) {
    const eigene = new Set((text(sp).tags || []).map((x) => x.toLowerCase()));
    return SPIELE.filter((x) => x.id !== sp.id)
      .map((x, i) => ({ x, i, treffer: (text(x).tags || []).filter((tag) => eigene.has(tag.toLowerCase())).length }))
      .sort((a, b) => b.treffer - a.treffer || a.i - b.i)
      .slice(0, anzahl)
      .map((e) => e.x);
  }

  const ICONS = {
    pc: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
    handy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18.5h2"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/></svg>',
    links: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>',
    rechts: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>',
    flamme: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
    zu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    lupe: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    voll: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>',
    zurueck: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    vor: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    neuLaden: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>'
  };

  function geraete(sp) {
    return '<span class="sp-geraete">' + (sp.geraete || []).map((g) =>
      '<span class="sp-geraet" title="' + esc(t[g]) + '">' + ICONS[g] + '<span class="sp-unsichtbar">' + esc(t[g]) + "</span></span>").join("") + "</span>";
  }

  function abzeichen(sp) {
    if (sp.trend) return '<span class="sp-abzeichen sp-abzeichen--trend">' + ICONS.flamme + esc(t.trend(sp.trend)) + "</span>";
    if (sp.neu) return '<span class="sp-abzeichen sp-abzeichen--neu">' + esc(t.neu) + "</span>";
    return "";
  }

  function tags(sp, max) {
    return '<span class="sp-tags">' + (text(sp).tags || []).slice(0, max || 9).map((x) => '<span class="sp-tag">' + esc(x) + "</span>").join("") + "</span>";
  }

  function mediumHtml(m, klasse, autoplay) {
    if (m.typ === "video") {
      const spielt = autoplay && !WENIG_BEWEGUNG.matches;
      return '<video class="' + klasse + '" src="' + esc(m.src) + '" poster="' + esc(m.poster) + '" muted loop playsinline preload="' + (spielt ? "auto" : "none") + '"' + (spielt ? " autoplay" : "") + ' aria-label="' + esc(t.trailer) + '"></video>';
    }
    return '<img class="' + klasse + '" src="' + esc(m.src) + '" alt="" loading="lazy" decoding="async">';
  }

  function spielHref(sp) { return "/games/" + sp.id; }

  // Leise Toene aus shop/klang.js; fehlt die Datei, bleibt die Seite still.
  function klang(sorte, richtung) {
    const k = window.MIWALE_KLANG;
    if (k && k[sorte]) k[sorte](richtung);
  }

  // ---- Adresse ------------------------------------------------------------------

  function adresse() {
    const teile = location.pathname.split("/").filter(Boolean).map((x) => { try { return decodeURIComponent(x); } catch (e) { return x; } });
    if (teile[0] === "games" && PER_ID.has(teile[1])) {
      return { seite: "spiel", id: teile[1], spielt: teile[2] === "spielen" };
    }
    // Game Requests: /requests ist die Liste, /requests/new das Formular.
    if (String(teile[0]).toLowerCase() === "requests" && (teile.length === 1 || (teile.length === 2 && teile[1] === "new"))) {
      return { seite: "ideen", neu: teile[1] === "new" };
    }
    // Aeltere Links der Spieleseite: /games#chromatic oder /#chromatic/spielen
    const h = (location.hash || "").replace(/^#/, "").split("/").filter(Boolean);
    if (h[0] === "projekte") h.shift();
    if (PER_ID.has(h[0])) return { seite: "spiel", id: h[0], spielt: h[1] === "spielen" };
    return { seite: "start" };
  }

  function pfad(ziel) {
    if (ziel.seite === "ideen") return "/requests" + (ziel.neu ? "/new" : "");
    if (ziel.seite !== "spiel") return "/";
    return "/games/" + ziel.id + (ziel.spielt ? "/spielen" : "");
  }

  function geheZu(ziel, ersetzen) {
    const neu = pfad(ziel) + location.search;
    try {
      if (ersetzen) history.replaceState(null, "", neu);
      else if (neu !== location.pathname + location.search) { history.pushState(null, "", neu); zustand.eigeneEintraege++; }
    } catch (e) { /* ohne Verlauf, z. B. file:// */ }
    zeichne();
  }

  // ---- Kopf und Fuss -------------------------------------------------------------

  // Kopfzeile wie im Steam-Client, in drei Spalten: Die Mitte ist genau so
  // breit wie der Inhalt darunter (Reiter links, Suche rechts buendig). Verlauf
  // und Logo stehen links davor, Benachrichtigungen und Portfolio rechts daneben.
  function kopf() {
    const seite = adresse().seite;
    const reiter = (href, name, aktiv, extra) => '<a class="sp-home' + (extra || "") + '" href="' + href + '" data-link' + (aktiv ? ' aria-current="page"' : "") + ">" + name + "</a>";
    return '<header class="sp-kopf"><div class="sp-kopf__innen">' +
      '<div class="sp-kopf__aussen sp-kopf__aussen--links">' +
        '<nav class="sp-verlauf" aria-label="' + esc(t.zurueckSeite) + " / " + esc(t.vorSeite) + '">' +
          '<button type="button" class="sp-symbol" data-verlauf="-1" aria-label="' + esc(t.zurueckSeite) + '" title="' + esc(t.zurueckSeite) + '">' + ICONS.zurueck + "</button>" +
          '<button type="button" class="sp-symbol" data-verlauf="1" aria-label="' + esc(t.vorSeite) + '" title="' + esc(t.vorSeite) + '">' + ICONS.vor + "</button>" +
          '<button type="button" class="sp-symbol" data-neu-laden aria-label="' + esc(t.neuLaden) + '" title="' + esc(t.neuLaden) + '">' + ICONS.neuLaden + "</button>" +
        "</nav>" +
        '<a class="sp-marke" href="/" data-link aria-label="miwale games"><img src="assets/logo-wordmark-light.png" alt="miwale"></a>' +
      "</div>" +
      '<div class="sp-kopf__mitte">' +
        '<nav class="sp-reiterkopf" aria-label="miwale games">' +
          reiter("/", esc(t.home), seite === "start", " sp-home--start") +
          // Schmal steht nur "Requests"; das "Game" davor faellt weg.
          reiter("/requests", esc(t.ideen).replace(/^(Game )/, '<span class="sp-home__vorsilbe">$1</span>'), seite === "ideen") +
        "</nav>" +
        '<div class="sp-kopf__werkzeuge">' +
        '<div class="sp-sprache" role="group" aria-label="' + esc(t.sprachgruppe) + '">' +
          ["en", "de"].map((c) => '<button type="button" data-sprache="' + c + '" aria-pressed="' + (c === zustand.sprache) + '" lang="' + c + '">' + c.toUpperCase() + "</button>").join("") +
        "</div>" +
        '<form class="sp-suche" role="search" data-suche autocomplete="off">' + ICONS.lupe +
          '<input type="search" data-suche-feld placeholder="' + esc(t.suche) + '" aria-label="' + esc(t.suche) + '" aria-autocomplete="list" aria-expanded="false" spellcheck="false">' +
          '<div class="sp-suche__liste" data-suche-liste hidden role="listbox"></div>' +
        "</form>" +
        "</div>" +
      "</div>" +
      '<div class="sp-kopf__aussen sp-kopf__aussen--rechts">' +
        // Gefuellt von shop/meldungen.js.
        '<div class="sp-meldungen" data-meldungen></div>' +
        '<a class="sp-knopf sp-knopf--glas" href="/portfolio">' + esc(t.portfolio) + ' <span aria-hidden="true">→</span></a>' +
      "</div></div></header>";
  }

  // Zurueck und Vor nur anbieten, wenn es innerhalb der Seite dorthin geht.
  // Die Navigation API kennt das; aeltere Browser lassen beide Knoepfe an.
  function verlaufAktualisieren() {
    const nav = window.navigation;
    if (!nav || !("canGoBack" in nav)) return;
    app.querySelectorAll("[data-verlauf]").forEach((b) => {
      b.disabled = b.dataset.verlauf === "-1" ? !nav.canGoBack : !nav.canGoForward;
    });
  }

  function fuss() {
    return '<footer class="sp-fuss"><div class="sp-breite">' +
      '<div class="sp-fuss__zeile"><img src="assets/logo-wordmark-light.png" alt="miwale">' +
      '<nav><a href="/portfolio">' + esc(t.portfolio) + '</a><a href="https://www.youtube.com/@miwale-games" target="_blank" rel="noopener noreferrer">YouTube</a><a href="https://milchinien.itch.io/" target="_blank" rel="noopener noreferrer">itch.io</a><a href="https://github.com/milchinien" target="_blank" rel="noopener noreferrer">GitHub</a></nav></div>' +
      '<p class="sp-fuss__recht"><strong>' + esc(t.impressum) + "</strong> · " + esc(t.impressumText) + "</p>" +
      "</div></footer>";
  }

  // ---- Startseite -------------------------------------------------------------------

  function startSeite() {
    const beliebt = SPIELE;
    return '<main class="sp-start">' +
      '<section class="sp-abschnitt sp-breite" aria-labelledby="sp-h-highlights">' +
        '<h2 class="sp-ueberschrift" id="sp-h-highlights">' + esc(t.highlights) + "</h2>" +
        '<div class="sp-highlight" data-highlight>' +
          // Links und rechts schaut das vorige und das naechste Spiel herein,
          // ausgeblendet zum Rand hin — wie die Highlight-Reihe bei Steam.
          '<button type="button" class="sp-highlight__nachbar sp-highlight__nachbar--links" data-highlight-nachbar="-1" tabindex="-1" aria-hidden="true"><img alt=""></button>' +
          '<button type="button" class="sp-highlight__nachbar sp-highlight__nachbar--rechts" data-highlight-nachbar="1" tabindex="-1" aria-hidden="true"><img alt=""></button>' +
          '<button type="button" class="sp-pfeil sp-pfeil--links" data-highlight-schritt="-1" aria-label="' + esc(t.zurueck) + '">' + ICONS.links + "</button>" +
          '<div class="sp-highlight__buehne" data-highlight-buehne></div>' +
          '<button type="button" class="sp-pfeil sp-pfeil--rechts" data-highlight-schritt="1" aria-label="' + esc(t.weiter) + '">' + ICONS.rechts + "</button>" +
        "</div>" +
        '<div class="sp-punkte" data-highlight-punkte>' + beliebt.map((sp, i) =>
          '<button type="button" data-highlight-ziel="' + i + '" aria-label="' + esc(sp.name) + '"></button>').join("") + "</div>" +
      "</section>" +

      '<section class="sp-abschnitt sp-breite" aria-labelledby="sp-h-reihe">' +
        '<h2 class="sp-ueberschrift" id="sp-h-reihe">' + esc(t.reihe) + "</h2>" +
        '<div class="sp-kasten">' +
        '<div class="sp-reihe" data-reihe>' +
          '<button type="button" class="sp-pfeil sp-pfeil--links" data-reihe-schritt="-1" aria-label="' + esc(t.zurueck) + '">' + ICONS.links + "</button>" +
          '<div class="sp-reihe__fenster"><div class="sp-reihe__band" data-reihe-band>' + reiheSeiten() + "</div></div>" +
          '<button type="button" class="sp-pfeil sp-pfeil--rechts" data-reihe-schritt="1" aria-label="' + esc(t.weiter) + '">' + ICONS.rechts + "</button>" +
        "</div>" +
        '<div class="sp-punkte" data-reihe-punkte></div>' +
        "</div>" +
      "</section>" +

      '<section class="sp-abschnitt sp-breite" aria-labelledby="sp-h-alle">' +
        '<h2 class="sp-ueberschrift" id="sp-h-alle">' + esc(t.alle) + "</h2>" +
        '<div class="sp-kasten">' +
          '<div class="sp-reiter" role="group">' + ["beliebt", "neueste", "name"].map((w) =>
            '<button type="button" data-sortierung="' + w + '" aria-pressed="' + (zustand.sortierung === w) + '">' + esc(t[w]) + "</button>").join("") + "</div>" +
          '<div class="sp-liste"><div class="sp-liste__zeilen" data-liste>' + listeZeilen() + "</div>" +
            '<aside class="sp-vorschau" data-vorschau aria-live="polite"></aside></div>' +
        "</div>" +
      "</section>" +
    "</main>";
  }

  function highlightHtml(sp) {
    const tx = text(sp);
    const alle = medien(sp);
    const bilder = screens(sp).slice(0, 4);
    return '<article class="sp-highlight__karte">' +
      '<a class="sp-highlight__medium" href="' + spielHref(sp) + '" data-link aria-label="' + esc(sp.name) + '">' +
        mediumHtml(alle[0], "sp-highlight__haupt", true) +
        '<img class="sp-highlight__wechsel" alt="" hidden>' +
      "</a>" +
      '<div class="sp-highlight__info">' +
        '<div class="sp-highlight__titel"><h3><a href="' + spielHref(sp) + '" data-link>' + esc(sp.name) + "</a></h3>" + abzeichen(sp) + "</div>" +
        '<p class="sp-highlight__kurz">' + esc(tx.kurz) + "</p>" +
        '<div class="sp-highlight__bilder">' + bilder.map((src) =>
          '<button type="button" data-zeige-bild="' + esc(src) + '" aria-label="' + esc(sp.name) + '"><img src="' + esc(src) + '" alt="" loading="lazy"></button>').join("") + "</div>" +
        tags(sp, 4) +
        '<div class="sp-highlight__fuss">' + geraete(sp) +
          '<button type="button" class="sp-knopf sp-knopf--play" data-spielen="' + sp.id + '">' + ICONS.play + esc(t.spielen) + "</button></div>" +
      "</div></article>";
  }

  // Reihe: je Seite zwei hohe Karten und zwei kleine uebereinander, wie die
  // Angebotsreihe bei Steam. Vorn das Beliebteste, dann das Neueste.
  const PRO_SEITE = 4;
  function reiheReihenfolge() {
    const trend = SPIELE.filter((s) => s.trend).sort((a, b) => a.trend - b.trend);
    const rest = sortiert("neueste").filter((s) => !s.trend);
    return trend.concat(rest);
  }
  function reiheSeiten() {
    const liste = reiheReihenfolge();
    let html = "";
    for (let i = 0; i < liste.length; i += PRO_SEITE) {
      const teil = liste.slice(i, i + PRO_SEITE);
      html += '<div class="sp-reihe__seite">' +
        teil.slice(0, 2).map((sp) => reiheKarte(sp, "hoch")).join("") +
        (teil.length > 2 ? '<div class="sp-reihe__stapel">' + teil.slice(2).map((sp) => reiheKarte(sp, "klein")).join("") + "</div>" : "") +
        "</div>";
    }
    return html;
  }
  function reiheKarte(sp, art) {
    const bild = art === "hoch" ? (sp.hochformat || sp.bild) : sp.bild;
    return '<a class="sp-karte sp-karte--' + art + '" href="' + spielHref(sp) + '" data-link>' +
      '<span class="sp-karte__bild"><img src="' + esc(bild) + '" alt="" loading="lazy"></span>' +
      (abzeichen(sp) || '<span class="sp-abzeichen">' + esc((text(sp).tags || [])[0] || "") + "</span>") +
      '<span class="sp-karte__unten"><span class="sp-karte__name">' + esc(sp.name) + "</span>" +
        '<span class="sp-karte__play">' + ICONS.play + esc(t.spielen) + "</span></span>" +
      "</a>";
  }

  function listeZeilen() {
    return sortiert(zustand.sortierung).map((sp) => {
      const tx = text(sp);
      return '<a class="sp-zeile" href="' + spielHref(sp) + '" data-link data-vorschau-id="' + sp.id + '">' +
        '<span class="sp-zeile__bild"><img src="' + esc(sp.bild) + '" alt="" loading="lazy"></span>' +
        '<span class="sp-zeile__text"><span class="sp-zeile__name">' + esc(sp.name) + "</span>" +
          '<span class="sp-zeile__tags">' + esc((tx.tags || []).join(", ")) + "</span>" +
          '<span class="sp-zeile__datum">' + esc(t.veroeffentlicht) + ": " + esc(datum(sp.veroeffentlicht)) + "</span></span>" +
        '<span class="sp-zeile__rechts">' + geraete(sp) + '<span class="sp-zeile__play">' + ICONS.play + esc(t.spielen) + "</span></span>" +
      "</a>";
    }).join("");
  }

  function vorschauHtml(sp) {
    const tx = text(sp);
    const alle = medien(sp);
    const video = alle.find((m) => m.typ === "video");
    const bilder = screens(sp).slice(0, video ? 3 : 4);
    return '<div class="sp-vorschau__innen">' +
      '<h3 class="sp-vorschau__name">' + esc(sp.name) + "</h3>" +
      '<p class="sp-vorschau__status">' + esc(lokal(sp.status)) + " · " + esc(datum(sp.veroeffentlicht)) + "</p>" +
      tags(sp, 5) +
      '<p class="sp-vorschau__kurz">' + esc(tx.kurz) + "</p>" +
      (video ? mediumHtml(video, "sp-vorschau__medium", true) : "") +
      bilder.map((src) => '<img class="sp-vorschau__medium" src="' + esc(src) + '" alt="" loading="lazy">').join("") +
      "</div>";
  }

  // ---- Spielseite -------------------------------------------------------------------

  function spielSeite(sp) {
    const tx = text(sp);
    const alle = medien(sp);
    const extern = /^https?:/.test(sp.spielen) && sp.neuerTab;
    return '<main class="sp-detail sp-breite">' +
      '<nav class="sp-pfad" aria-label="Breadcrumb"><a href="/" data-link>' + esc(t.alleSpiele) + '</a><span aria-hidden="true">›</span><span>' + esc(sp.name) + "</span></nav>" +
      '<h1 class="sp-detail__titel">' + esc(sp.name) + "</h1>" +

      '<div class="sp-detail__oben">' +
        '<div class="sp-galerie">' +
          '<div class="sp-galerie__buehne" data-galerie-buehne>' + mediumHtml(alle[zustand.medium] || alle[0], "sp-galerie__medium", true) +
            (alle.length > 1 ? '<button type="button" class="sp-pfeil sp-pfeil--links" data-medium-schritt="-1" aria-label="' + esc(t.zurueck) + '">' + ICONS.links + "</button>" +
              '<button type="button" class="sp-pfeil sp-pfeil--rechts" data-medium-schritt="1" aria-label="' + esc(t.weiter) + '">' + ICONS.rechts + "</button>" : "") +
          "</div>" +
          (alle.length > 1 ? '<div class="sp-galerie__leiste">' + alle.map((m, i) =>
            '<button type="button" class="sp-galerie__mini' + (m.typ === "video" ? " sp-galerie__mini--video" : "") + '" data-medium="' + i + '" aria-label="' + esc(t.bild(i + 1, alle.length)) + '" aria-pressed="' + (i === zustand.medium) + '">' +
              '<img src="' + esc(m.typ === "video" ? m.poster : m.src) + '" alt="" loading="lazy">' + (m.typ === "video" ? '<span class="sp-galerie__playzeichen">' + ICONS.play + "</span>" : "") + "</button>").join("") + "</div>" : "") +
        "</div>" +

        '<aside class="sp-detail__info">' +
          '<img class="sp-detail__kopfbild" src="' + esc(sp.bild) + '" alt="">' +
          '<p class="sp-detail__kurz">' + esc(tx.kurz) + "</p>" +
          '<dl class="sp-daten">' +
            "<dt>" + esc(t.status) + "</dt><dd>" + esc(lokal(sp.status)) + "</dd>" +
            "<dt>" + esc(t.veroeffentlicht) + "</dt><dd>" + esc(datum(sp.veroeffentlicht)) + "</dd>" +
            "<dt>" + esc(t.entwickler) + '</dt><dd><a href="/portfolio">miwale</a></dd>' +
            "<dt>" + esc(t.plattform) + "</dt><dd>" + geraete(sp) + " " + esc((sp.geraete || []).map((g) => t[g]).join(" · ")) + "</dd>" +
          "</dl>" +
          tags(sp) +
        "</aside>" +
      "</div>" +

      '<div class="sp-detail__unten">' +
        '<div class="sp-detail__haupt">' +
          '<div class="sp-spielbox">' +
            '<div><h2>' + esc(t.spieleName(sp.name)) + "</h2><p>" + esc(t.imBrowser) +
              ((sp.geraete || []).indexOf("handy") < 0 ? " " + esc(t.nurPc) : "") + (extern ? " " + esc(t.neuerTab) : "") + "</p></div>" +
            '<button type="button" class="sp-knopf sp-knopf--play sp-knopf--gross" data-spielen="' + sp.id + '">' + ICONS.play + esc(t.jetztSpielen) + "</button>" +
          "</div>" +
          '<section class="sp-text"><h2>' + esc(t.ueber) + "</h2>" + (tx.ueber || []).map((p) => "<p>" + esc(p) + "</p>").join("") + "</section>" +
          ((tx.features || []).length ? '<section class="sp-text"><h2>' + esc(t.features) + '</h2><ul class="sp-features">' + tx.features.map((f) => "<li>" + esc(f) + "</li>").join("") + "</ul></section>" : "") +
          (tx.steuerung ? '<section class="sp-text"><h2>' + esc(t.steuerung) + "</h2><p>" + esc(tx.steuerung) + "</p></section>" : "") +
          // Bewertungen unter den Beschreibungen; gefuellt von shop/bewertungen.js.
          '<section class="sp-text sp-bew" data-bewertungen></section>' +
        "</div>" +
        '<aside class="sp-detail__seite"><h2 class="sp-ueberschrift sp-ueberschrift--klein">' + esc(t.aehnlich) + "</h2>" +
          aehnliche(sp, 4).map((x) =>
            '<a class="sp-aehnlich" href="' + spielHref(x) + '" data-link><img src="' + esc(x.bild) + '" alt="" loading="lazy">' +
              '<span><span class="sp-aehnlich__name">' + esc(x.name) + '</span><span class="sp-aehnlich__tags">' + esc((text(x).tags || []).slice(0, 3).join(", ")) + "</span></span></a>").join("") +
          '<a class="sp-knopf sp-knopf--glas sp-knopf--breit" href="/" data-link>' + esc(t.alleSpiele) + "</a>" +
        "</aside>" +
      "</div>" +
    "</main>";
  }

  // ---- Spielfenster -------------------------------------------------------------------

  function spielFenster(sp) {
    return '<div class="sp-spiel" role="dialog" aria-modal="true" aria-label="' + esc(t.spieleName(sp.name)) + '" data-spielfenster>' +
      '<div class="sp-spiel__kopf"><strong>' + esc(sp.name) + "</strong>" +
        '<button type="button" class="sp-knopf sp-knopf--glas" data-vollbild>' + ICONS.voll + '<span data-vollbild-text>' + esc(t.vollbild) + "</span></button>" +
        '<button type="button" class="sp-knopf sp-knopf--glas" data-schliessen>' + ICONS.zu + esc(t.schliessen) + "</button></div>" +
      '<iframe src="' + esc(sp.spielen) + '" title="' + esc(sp.name) + '" allow="autoplay; fullscreen; gamepad"></iframe>' +
    "</div>";
  }

  // ---- Zeichnen -----------------------------------------------------------------------

  function zeichne() {
    t = TEXTE[zustand.sprache];
    document.documentElement.lang = zustand.sprache;
    const ort = adresse();
    const sp = ort.seite === "spiel" ? PER_ID.get(ort.id) : null;
    const ideen = ort.seite === "ideen";
    const seitenSchluessel = sp ? "spiel:" + sp.id : ideen ? (ort.neu ? "ideen:neu" : "ideen") : "start";

    // Die Seite nur neu bauen, wenn sich Seite oder Sprache geaendert haben —
    // sonst liefe beim Oeffnen des Spielfensters jeder Trailer von vorn.
    if (app.dataset.seite !== seitenSchluessel || app.dataset.sprache !== zustand.sprache) {
      const seitenwechsel = app.dataset.seite !== seitenSchluessel;
      if (seitenwechsel) zustand.medium = 0;
      // Game Requests fuellt shop/ideen.js.
      const inhalt = sp ? spielSeite(sp) : ideen ? '<main class="sp-ideen sp-breite" data-ideen></main>' : startSeite();
      app.innerHTML = kopf() + inhalt + fuss() + '<div data-fenster></div>';
      app.dataset.seite = seitenSchluessel;
      app.dataset.sprache = zustand.sprache;
      if (window.MIWALE_MELDUNGEN) window.MIWALE_MELDUNGEN.einbauen(app.querySelector("[data-meldungen]"), zustand.sprache);
      document.title = sp ? sp.name + " — miwale games" : ideen ? (ort.neu ? t.ideenNeuTitel : t.ideenTitel) : t.titel;
      if (sp) {
        // Beschreibung pro Spiel, damit geteilte Links eine Vorschau bekommen.
        setzeMeta("description", text(sp).kurz);
        if (window.MIWALE_BEWERTUNGEN) window.MIWALE_BEWERTUNGEN.einbauen(app.querySelector("[data-bewertungen]"), sp, zustand.sprache);
      } else if (ideen) {
        setzeMeta("description", t.ideenBeschreibung);
        if (window.MIWALE_IDEEN) window.MIWALE_IDEEN.einbauen(app.querySelector("[data-ideen]"), zustand.sprache, { ansicht: ort.neu ? "neu" : "liste", zurueck: ideenZurueck });
      } else {
        setzeMeta("description", START_BESCHREIBUNG);
        zeigeHighlight(zustand.highlight, true);
        zeigeReiheSeite(zustand.reiheSeite, true);
        zeigeVorschau(zustand.vorschau || (sortiert(zustand.sortierung)[0] || {}).id);
        starteHighlightTimer();
      }
      if (seitenwechsel) window.scrollTo(0, 0);
    }

    const fenster = app.querySelector("[data-fenster]");
    const offen = fenster.querySelector("[data-spielfenster]");
    if (sp && ort.spielt) {
      if (!offen) {
        fenster.innerHTML = spielFenster(sp);
        document.documentElement.classList.add("sp-gesperrt");
        pausiereVideos(true);
        const zu = fenster.querySelector("[data-schliessen]");
        if (zu) zu.focus();
      }
    } else if (offen) {
      if (document.fullscreenElement) { try { document.exitFullscreen(); } catch (e) { /* egal */ } }
      fenster.innerHTML = "";
      document.documentElement.classList.remove("sp-gesperrt");
      pausiereVideos(false);
    }
    const vollbild = fenster.querySelector("[data-vollbild]");
    if (vollbild && !(document.fullscreenEnabled && fenster.firstElementChild.requestFullscreen)) vollbild.hidden = true;
    verlaufAktualisieren();
  }

  function setzeMeta(name, inhalt) {
    const el = document.querySelector('meta[name="' + name + '"]');
    if (el) el.setAttribute("content", inhalt);
  }

  function pausiereVideos(pause) {
    app.querySelectorAll("main video").forEach((v) => {
      if (pause) v.pause();
      else if (v.autoplay) v.play().catch(() => {});
    });
  }

  function zeigeHighlight(i, sofort) {
    const buehne = app.querySelector("[data-highlight-buehne]");
    if (!buehne || !SPIELE.length) return;
    if (!sofort && i !== zustand.highlight) klang("wisch", i - zustand.highlight);
    zustand.highlight = (i + SPIELE.length) % SPIELE.length;
    const neu = document.createElement("div");
    neu.className = "sp-highlight__folie" + (sofort ? "" : " sp-highlight__folie--rein");
    neu.innerHTML = highlightHtml(SPIELE[zustand.highlight]);
    buehne.replaceChildren(neu);
    app.querySelectorAll("[data-highlight-ziel]").forEach((b, k) => b.setAttribute("aria-current", String(k === zustand.highlight)));
    app.querySelectorAll("[data-highlight-nachbar]").forEach((b) => {
      const n = SPIELE[(zustand.highlight + Number(b.dataset.highlightNachbar) + SPIELE.length) % SPIELE.length];
      b.querySelector("img").src = n.bild;
      b.title = n.name;
    });
  }

  function starteHighlightTimer() {
    clearInterval(highlightTimer);
    if (WENIG_BEWEGUNG.matches) return;
    highlightTimer = setInterval(() => {
      const box = app.querySelector("[data-highlight]");
      if (!box || document.hidden || box.matches(":hover") || box.contains(document.activeElement)) return;
      if (app.querySelector("[data-spielfenster]")) return;
      zeigeHighlight(zustand.highlight + 1);
    }, 9000);
  }

  function zeigeReiheSeite(i, sofort) {
    const band = app.querySelector("[data-reihe-band]");
    if (!band) return;
    const n = band.children.length;
    const vorher = zustand.reiheSeite;
    zustand.reiheSeite = Math.max(0, Math.min(n - 1, i));
    if (!sofort && zustand.reiheSeite !== vorher) klang("wisch", zustand.reiheSeite - vorher);
    // Um ganze Seiten schieben, in Pixeln. Die Seiten sind um einen Guckstreifen
    // schmaler als das Fenster; der wandert mit: auf der ersten Seite liegt er
    // rechts (dort schaut die naechste herein, dort sitzt der Pfeil), auf der
    // letzten links, dazwischen anteilig. Das Fenster bleibt dabei gleich gross.
    const seiten = Array.from(band.children);
    const reihe = app.querySelector("[data-reihe]");
    const fenster = reihe.querySelector(".sp-reihe__fenster");
    const guck = parseFloat(getComputedStyle(reihe).getPropertyValue("--sp-reihe-guck")) || 0;
    const links = n > 1 ? guck * zustand.reiheSeite / (n - 1) : 0;
    band.style.transform = "translateX(" + (links - seiten[zustand.reiheSeite].offsetLeft) + "px)";
    fenster.style.setProperty("--guck-links", links + "px");
    fenster.style.setProperty("--guck-rechts", (guck - links) + "px");
    // Nur seitenweise (breiter Schirm) sind die anderen Seiten versteckt; am
    // Handy ist die Reihe eine Wischleiste, dort bleibt alles erreichbar.
    const seitenweise = SEITENWEISE.matches;
    seiten.forEach((s, k) => { s.inert = seitenweise && k !== zustand.reiheSeite; s.classList.toggle("sp-reihe__seite--an", k === zustand.reiheSeite); });
    // Nur der Pfeil, in dessen Richtung es weitergeht.
    reihe.querySelector('[data-reihe-schritt="-1"]').hidden = zustand.reiheSeite === 0;
    reihe.querySelector('[data-reihe-schritt="1"]').hidden = zustand.reiheSeite >= n - 1;
    app.querySelector("[data-reihe-punkte]").innerHTML = n > 1 ? Array.from({ length: n }, (_, k) =>
      '<button type="button" data-reihe-ziel="' + k + '" aria-label="' + esc(t.seite(k + 1, n)) + '" aria-current="' + (k === zustand.reiheSeite) + '"></button>').join("") : "";
  }

  function zeigeVorschau(id) {
    const box = app.querySelector("[data-vorschau]");
    const sp = PER_ID.get(id);
    if (!box || !sp || box.dataset.id === id) return;
    zustand.vorschau = id;
    box.dataset.id = id;
    box.innerHTML = vorschauHtml(sp);
    app.querySelectorAll("[data-vorschau-id]").forEach((z) => z.classList.toggle("sp-zeile--an", z.dataset.vorschauId === id));
  }

  function zeigeMedium(i) {
    const ort = adresse();
    const sp = PER_ID.get(ort.id);
    const buehne = app.querySelector("[data-galerie-buehne]");
    if (!sp || !buehne) return;
    const alle = medien(sp);
    zustand.medium = (i + alle.length) % alle.length;
    const alt = buehne.querySelector(".sp-galerie__medium");
    const tmp = document.createElement("div");
    tmp.innerHTML = mediumHtml(alle[zustand.medium], "sp-galerie__medium", true);
    alt.replaceWith(tmp.firstChild);
    app.querySelectorAll("[data-medium]").forEach((b) => {
      const an = Number(b.dataset.medium) === zustand.medium;
      b.setAttribute("aria-pressed", String(an));
      if (an) b.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }

  // ---- Ereignisse ------------------------------------------------------------------------

  function spielStarten(id) {
    const sp = PER_ID.get(id);
    if (!sp) return;
    if (sp.neuerTab) { window.open(sp.spielen, "_blank", "noopener"); return; }
    geheZu({ seite: "spiel", id, spielt: true });
  }

  // Vom Formular zurueck zur Liste der Game Requests: wie beim Spielfenster
  // ueber den Verlauf, wenn die Seite den Eintrag selbst angelegt hat.
  function ideenZurueck() {
    if (zustand.eigeneEintraege > 0) { try { history.back(); return; } catch (e) { /* dann ersetzen */ } }
    geheZu({ seite: "ideen", neu: false }, true);
  }

  function spielSchliessen() {
    const ort = adresse();
    if (zustand.eigeneEintraege > 0) { try { history.back(); return; } catch (e) { /* dann ersetzen */ } }
    geheZu({ seite: "spiel", id: ort.id, spielt: false }, true);
  }

  app.addEventListener("click", (e) => {
    const ziel = e.target.closest("button, a");
    if (!ziel) return;
    const d = ziel.dataset;

    if ("spielen" in d) { e.preventDefault(); spielStarten(d.spielen); return; }
    if (d.verlauf) { history.go(Number(d.verlauf)); return; }
    if ("neuLaden" in d) { location.reload(); return; }
    if ("schliessen" in d) { spielSchliessen(); return; }
    if ("vollbild" in d) {
      const f = app.querySelector("[data-spielfenster]");
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else if (f && f.requestFullscreen) f.requestFullscreen().catch(() => {});
      return;
    }
    if (d.sprache) {
      zustand.sprache = d.sprache;
      try { localStorage.setItem(SPRACH_SCHLUESSEL, d.sprache); } catch (err) { /* nur fuer diesen Besuch */ }
      zeichne();
      return;
    }
    if (d.highlightSchritt) { zeigeHighlight(zustand.highlight + Number(d.highlightSchritt)); starteHighlightTimer(); return; }
    if (d.highlightZiel) { zeigeHighlight(Number(d.highlightZiel)); starteHighlightTimer(); return; }
    if (d.highlightNachbar) { zeigeHighlight(zustand.highlight + Number(d.highlightNachbar)); starteHighlightTimer(); return; }
    if (d.reiheSchritt) { zeigeReiheSeite(zustand.reiheSeite + Number(d.reiheSchritt)); return; }
    if (d.reiheZiel) { zeigeReiheSeite(Number(d.reiheZiel)); return; }
    if (d.sortierung) {
      zustand.sortierung = d.sortierung;
      app.querySelector("[data-liste]").innerHTML = listeZeilen();
      app.querySelectorAll("[data-sortierung]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.sortierung === d.sortierung)));
      const box = app.querySelector("[data-vorschau]");
      if (box) delete box.dataset.id;
      zeigeVorschau(zustand.vorschau);
      return;
    }
    if (d.medium) { zeigeMedium(Number(d.medium)); return; }
    if (d.mediumSchritt) { zeigeMedium(zustand.medium + Number(d.mediumSchritt)); return; }
    if (d.zeigeBild) { e.preventDefault(); return; }

    // Interne Links ohne Neuladen; Strg/Cmd-Klick oeffnet weiter einen Tab.
    if (ziel.tagName === "A" && "link" in d && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
      e.preventDefault();
      history.pushState(null, "", ziel.getAttribute("href") + location.search);
      zustand.eigeneEintraege++;
      zeichne();
    }
  });

  // Ein leiser Klick, wenn die Maus auf eine Karte kommt — nur beim Betreten,
  // nicht bei jeder Bewegung innerhalb. Am Handy gibt es kein Ueberfahren.
  const KARTEN = ".sp-karte, .sp-zeile, .sp-highlight__nachbar, .sp-aehnlich, .sp-suche__treffer";
  app.addEventListener("pointerover", (e) => {
    if (e.pointerType === "touch") return;
    const karte = e.target.closest(KARTEN);
    if (karte && !karte.contains(e.relatedTarget)) klang("hover");
  });

  // Highlight: Ueberfahren eines Screenshots zeigt ihn gross, wie bei Steam.
  app.addEventListener("pointerover", (e) => {
    const bild = e.target.closest("[data-zeige-bild]");
    const karte = e.target.closest(".sp-highlight__karte");
    if (karte) {
      const wechsel = karte.querySelector(".sp-highlight__wechsel");
      if (bild) { wechsel.src = bild.dataset.zeigeBild; wechsel.hidden = false; }
      else if (!e.target.closest(".sp-highlight__bilder")) wechsel.hidden = true;
    }
    const zeile = e.target.closest("[data-vorschau-id]");
    if (zeile) zeigeVorschau(zeile.dataset.vorschauId);
  });
  app.addEventListener("pointerout", (e) => {
    const bilder = e.target.closest(".sp-highlight__bilder");
    if (bilder && !bilder.contains(e.relatedTarget)) {
      const w = bilder.closest(".sp-highlight__karte").querySelector(".sp-highlight__wechsel");
      if (w) w.hidden = true;
    }
  });
  app.addEventListener("focusin", (e) => {
    const zeile = e.target.closest("[data-vorschau-id]");
    if (zeile) zeigeVorschau(zeile.dataset.vorschauId);
  });

  // ---- Suche in der Kopfzeile -------------------------------------------------------
  // Trifft auf Name, Tags und Kurztext. Was mit dem Namen beginnt, steht vorn.
  function sucheTreffer(frage) {
    const q = frage.trim().toLowerCase();
    if (!q) return [];
    return SPIELE.map((sp, i) => {
      const tx = text(sp);
      const name = sp.name.toLowerCase();
      let rang = 0;
      if (name.startsWith(q)) rang = 3;
      else if (name.includes(q)) rang = 2;
      else if ((tx.tags || []).some((x) => x.toLowerCase().includes(q))) rang = 1;
      else if ((tx.kurz || "").toLowerCase().includes(q)) rang = .5;
      return { sp, i, rang };
    }).filter((x) => x.rang).sort((a, b) => b.rang - a.rang || a.i - b.i).map((x) => x.sp).slice(0, 6);
  }

  function sucheZeigen(feld) {
    const liste = feld.parentElement.querySelector("[data-suche-liste]");
    const q = feld.value;
    if (!q.trim()) { liste.hidden = true; feld.setAttribute("aria-expanded", "false"); return; }
    const treffer = sucheTreffer(q);
    liste.innerHTML = treffer.length ? treffer.map((sp, k) =>
      '<a class="sp-suche__treffer" role="option" href="' + spielHref(sp) + '" data-link aria-selected="' + (k === 0) + '">' +
        '<img src="' + esc(sp.bild) + '" alt=""><span><span class="sp-suche__name">' + esc(sp.name) + '</span><span class="sp-suche__tags">' + esc((text(sp).tags || []).slice(0, 3).join(", ")) + "</span></span></a>").join("")
      : '<p class="sp-suche__leer">' + esc(t.sucheLeer) + "</p>";
    liste.hidden = false;
    feld.setAttribute("aria-expanded", "true");
  }

  app.addEventListener("input", (e) => {
    if (e.target.matches("[data-suche-feld]")) sucheZeigen(e.target);
  });
  app.addEventListener("submit", (e) => {
    if (!e.target.matches("[data-suche]")) return;
    e.preventDefault();
    const gewaehlt = e.target.querySelector('[role="option"][aria-selected="true"]') || e.target.querySelector('[role="option"]');
    if (gewaehlt) gewaehlt.click();
  });
  app.addEventListener("keydown", (e) => {
    if (!e.target.matches("[data-suche-feld]")) return;
    const optionen = Array.from(e.target.parentElement.querySelectorAll('[role="option"]'));
    if (e.key === "Escape") { e.target.value = ""; sucheZeigen(e.target); return; }
    if (!optionen.length || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;
    e.preventDefault();
    const i = optionen.findIndex((o) => o.getAttribute("aria-selected") === "true");
    const neu = (i + (e.key === "ArrowDown" ? 1 : -1) + optionen.length) % optionen.length;
    optionen.forEach((o, k) => o.setAttribute("aria-selected", String(k === neu)));
  });
  app.addEventListener("focusout", (e) => {
    const form = e.target.closest("[data-suche]");
    if (form && !form.contains(e.relatedTarget)) {
      const liste = form.querySelector("[data-suche-liste]");
      if (liste) liste.hidden = true;
    }
  });
  app.addEventListener("focusin", (e) => {
    if (e.target.matches("[data-suche-feld]")) sucheZeigen(e.target);
  });

  window.addEventListener("resize", () => { if (SEITENWEISE.matches) zeigeReiheSeite(zustand.reiheSeite, true); });
  window.addEventListener("popstate", () => {
    zustand.eigeneEintraege = Math.max(0, zustand.eigeneEintraege - 1);
    zeichne();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && app.querySelector("[data-spielfenster]") && !document.fullscreenElement) spielSchliessen();
  });
  SEITENWEISE.addEventListener("change", () => zeigeReiheSeite(zustand.reiheSeite, true));
  document.addEventListener("fullscreenchange", () => {
    const txt = app.querySelector("[data-vollbild-text]");
    if (txt) txt.textContent = document.fullscreenElement ? t.vollbildAus : t.vollbild;
  });

  // Start: alte Doppelkreuz-Links und unbekannte Spiele auf die kurze Form bringen.
  const anfang = adresse();
  try { history.replaceState(null, "", pfad(anfang) + location.search); } catch (e) { /* egal */ }
  zeichne();
})();
