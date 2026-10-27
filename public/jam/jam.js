// Jam-Seite (miwale.com/jam). Links eine Leiste zum Sortieren und mit allen
// Jams, rechts die Jams als Karten: Titelbild, Name, Kurztext, Link zu itch.io
// und wie lange die Abgabe noch offen ist. Ein Klick oeffnet die Jam
// (/jam/<id>) mit den Spielen, die miwale dafuer gebaut hat; dort gibt jeder
// 1 bis 5 Sterne mit Namen und freiwilliger Begruendung (server/jam.mjs).
//
// Die Jams stehen in jams.json daneben. Ohne Abhaengigkeiten, kein Inline-JS
// (die Content-Security-Policy in docker/sicherheit-jam.conf verbietet es).
(() => {
  "use strict";

  const SPRACH_SCHLUESSEL = "miwale-sprache"; // derselbe wie auf der Spieleseite
  const GERAET_SCHLUESSEL = "miwale-geraet"; // dieselbe Kennung wie bei den Bewertungen
  const NAME_SCHLUESSEL = "miwale-jam-name";
  const SORT_SCHLUESSEL = "miwale-jam-sortierung";
  const GERAET_RE = /^[a-zA-Z0-9-]{16,64}$/;
  const GRENZEN = { name: 30, text: 600 };

  const TEXTE = {
    en: {
      titel: "Game Jams",
      unter: "Every jam I made games for. Open one, play the games and tell me which one is best.",
      sortieren: "Sort",
      sortNeu: "Newest", sortName: "Name", sortStimmen: "Most ratings",
      jams: "Jams",
      alle: "All jams",
      spiele: (n) => n + (n === 1 ? " game" : " games"),
      bewertungen: (n) => n + (n === 1 ? " rating" : " ratings"),
      gehost: "Hosted by",
      thema: "Theme",
      zuItch: "Jam on itch.io",
      startetIn: "Starts in", schliesstIn: "Submission closes in", geschlossen: "Submission closed",
      laeuft: "Running", bald: "Upcoming", vorbei: "Over",
      fristUnbekannt: "Deadline not set",
      zurueck: "All jams",
      spielen: "Play", linkFolgt: "Play link coming soon",
      noch: "left",
      rangTitel: "Which game should I submit?",
      rangLeer: "No ratings yet. Play the games and be the first!",
      bewerten: "Rate this game", deine: "Your rating", aendern: "Update rating", zurueckziehen: "Remove",
      name: "Your name", sterne: "Stars", begruendung: "Why? (optional)",
      begruendungPlatz: "What did you like, what bugged you?",
      senden: "Send rating", gesendet: "Thanks! Your rating is in.", entfernt: "Your rating was removed.",
      sternWahl: (n) => n + (n === 1 ? " star" : " stars"),
      keineBewertungen: "No ratings yet.",
      mehr: (n) => "Show " + n + " more", weniger: "Show less",
      laden: "Loading …", fehlerLaden: "The jams could not be loaded.", dienstWeg: "Ratings are unavailable right now.",
      unbekannt: "This jam does not exist.",
      fehler: {
        name: "Please enter a name (up to 30 characters).",
        sterne: "Please pick 1 to 5 stars.",
        text: "The reason is too long (up to 600 characters).",
        woerter: "Please leave out the rude words.",
        "zu-schnell": "Slow down a little and try again in a few minutes.",
        herkunft: "Please send the rating from miwale.com.",
        netz: "Could not send. Are you online?",
        sonst: "Something went wrong. Please try again."
      },
      tage: (n) => n + "d", stunden: (n) => n + "h", minuten: (n) => n + "m", sekunden: (n) => n + "s",
      sprachgruppe: "Language"
    },
    de: {
      titel: "Game Jams",
      unter: "Alle Jams, für die ich Spiele gebaut habe. Öffne eine, spiel die Spiele und sag mir, welches am besten ist.",
      sortieren: "Sortieren",
      sortNeu: "Neueste", sortName: "Name", sortStimmen: "Meiste Bewertungen",
      jams: "Jams",
      alle: "Alle Jams",
      spiele: (n) => n + (n === 1 ? " Spiel" : " Spiele"),
      bewertungen: (n) => n + (n === 1 ? " Bewertung" : " Bewertungen"),
      gehost: "Veranstaltet von",
      thema: "Thema",
      zuItch: "Jam auf itch.io",
      startetIn: "Startet in", schliesstIn: "Abgabe endet in", geschlossen: "Abgabe beendet",
      laeuft: "Läuft", bald: "Bald", vorbei: "Vorbei",
      fristUnbekannt: "Frist nicht eingetragen",
      zurueck: "Alle Jams",
      spielen: "Spielen", linkFolgt: "Link zum Spielen folgt",
      noch: "übrig",
      rangTitel: "Welches Spiel soll ich einreichen?",
      rangLeer: "Noch keine Bewertungen. Spiel die Spiele und sei der Erste!",
      bewerten: "Spiel bewerten", deine: "Deine Bewertung", aendern: "Bewertung ändern", zurueckziehen: "Zurückziehen",
      name: "Dein Name", sterne: "Sterne", begruendung: "Warum? (freiwillig)",
      begruendungPlatz: "Was hat dir gefallen, was hat gestört?",
      senden: "Bewertung senden", gesendet: "Danke! Deine Bewertung ist da.", entfernt: "Deine Bewertung wurde entfernt.",
      sternWahl: (n) => n + (n === 1 ? " Stern" : " Sterne"),
      keineBewertungen: "Noch keine Bewertungen.",
      mehr: (n) => n + " weitere zeigen", weniger: "Weniger zeigen",
      laden: "Lädt …", fehlerLaden: "Die Jams konnten nicht geladen werden.", dienstWeg: "Bewerten geht gerade nicht.",
      unbekannt: "Diese Jam gibt es nicht.",
      fehler: {
        name: "Bitte gib einen Namen ein (bis 30 Zeichen).",
        sterne: "Bitte wähle 1 bis 5 Sterne.",
        text: "Die Begründung ist zu lang (bis 600 Zeichen).",
        woerter: "Bitte lass die groben Wörter weg.",
        "zu-schnell": "Etwas langsamer, bitte in ein paar Minuten noch mal.",
        herkunft: "Bitte bewerte direkt auf miwale.com.",
        netz: "Senden ging nicht. Bist du online?",
        sonst: "Da ist etwas schiefgegangen. Bitte noch mal versuchen."
      },
      tage: (n) => n + " T", stunden: (n) => n + " Std", minuten: (n) => n + " Min", sekunden: (n) => n + " s",
      sprachgruppe: "Sprache"
    }
  };

  const zustand = {
    sprache: startSprache(),
    sortierung: speicherLesen(SORT_SCHLUESSEL) || "neu",
    jams: null,
    fehler: false,
    sterne: { spiele: {}, eigene: {} },
    dienstOk: true,
    offen: {},        // Spiel-id -> alle Bewertungen zeigen
    meldung: {}       // Spiel-id -> { art: "ok" | "fehler", text }
  };
  let t = TEXTE[zustand.sprache];
  const app = document.getElementById("app");

  // ---- Hilfen -----------------------------------------------------------------

  function startSprache() {
    const gueltig = (x) => x === "en" || x === "de";
    try {
      const q = new URLSearchParams(location.search).get("lang");
      if (gueltig(q)) return q;
      const gespeichert = localStorage.getItem(SPRACH_SCHLUESSEL);
      if (gueltig(gespeichert)) return gespeichert;
    } catch (e) { /* ohne Speicher: Browsersprache */ }
    return /^de\b/i.test(navigator.language || "") ? "de" : "en";
  }

  function speicherLesen(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function speicherSetzen(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* egal */ } }

  let fluechtig = null;
  function geraet() {
    let id = speicherLesen(GERAET_SCHLUESSEL);
    if (id && GERAET_RE.test(id)) return id;
    id = crypto.randomUUID ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
    speicherSetzen(GERAET_SCHLUESSEL, id);
    if (speicherLesen(GERAET_SCHLUESSEL) === id) return id;
    return (fluechtig = fluechtig || id);
  }

  function esc(x) {
    return String(x == null ? "" : x).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }
  const text = (wert) => (wert && typeof wert === "object" ? wert[zustand.sprache] || wert.en || "" : wert || "");
  const zeit = (iso) => (iso ? Date.parse(iso) : NaN);

  // Nur eigene Bilder oder https (z. B. das Titelbild von itch.io).
  const bildOk = (s) => typeof s === "string" && /^(\/(?!\/)|https:\/\/)/.test(s);
  const linkOk = (s) => typeof s === "string" && /^(\/(?!\/)|https:\/\/)/.test(s);

  function datum(ms) {
    return new Date(ms).toLocaleDateString(zustand.sprache === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  function relativ(iso) {
    const ms = zeit(iso);
    if (isNaN(ms)) return "";
    const rtf = new Intl.RelativeTimeFormat(zustand.sprache, { numeric: "auto" });
    const s = Math.round((ms - Date.now()) / 1000);
    const stufen = [[60, "second"], [3600, "minute"], [86400, "hour"], [86400 * 7, "day"], [86400 * 30, "week"], [86400 * 365, "month"]];
    let teiler = 1;
    for (const [grenze, einheit] of stufen) {
      if (Math.abs(s) < grenze) return rtf.format(Math.round(s / teiler), einheit);
      teiler = grenze;
    }
    return rtf.format(Math.round(s / (86400 * 365)), "year");
  }

  // "3 T 4 Std" oder mit Sekunden "3 T 04 Std 12 Min 09 s" fuer die Jam-Seite.
  function dauer(ms, genau) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sek = s % 60;
    if (genau) {
      const zwei = (n) => String(n).padStart(2, "0");
      return (d ? t.tage(d) + " " : "") + t.stunden(zwei(h)) + " " + t.minuten(zwei(m)) + " " + t.sekunden(zwei(sek));
    }
    if (d) return t.tage(d) + (h ? " " + t.stunden(h) : "");
    if (h) return t.stunden(h) + (m ? " " + t.minuten(m) : "");
    return t.minuten(Math.max(1, m));
  }

  // Wo steht die Jam? { art: "bald" | "laeuft" | "vorbei" | "offen", anteil, rest }
  function stand(jam) {
    const jetzt = Date.now(), start = zeit(jam.start), ende = zeit(jam.abgabe);
    if (isNaN(ende)) return { art: "offen" };
    if (!isNaN(start) && jetzt < start) return { art: "bald", rest: start - jetzt };
    if (jetzt < ende) {
      const anteil = isNaN(start) ? 0 : (jetzt - start) / (ende - start);
      return { art: "laeuft", rest: ende - jetzt, anteil: Math.min(1, Math.max(0, anteil)) };
    }
    return { art: "vorbei", ende };
  }

  function fristZeile(jam, genau) {
    const s = stand(jam);
    if (s.art === "offen") return '<p class="jm-frist jm-frist--leise">' + esc(t.fristUnbekannt) + "</p>";
    if (s.art === "vorbei") return '<p class="jm-frist jm-frist--leise">' + esc(t.geschlossen) + " · " + esc(datum(s.ende)) + "</p>";
    const wort = s.art === "bald" ? t.startetIn : t.schliesstIn;
    return '<div class="jm-frist" data-frist="' + esc(jam.id) + '"' + (genau ? ' data-genau' : "") + ">" +
      '<p><span>' + esc(wort) + '</span> <strong data-rest>' + esc(dauer(s.rest, genau)) + "</strong></p>" +
      (s.art === "laeuft" ? '<div class="jm-balken" role="presentation"><span data-anteil style="width:' + (s.anteil * 100).toFixed(2) + '%"></span></div>' : "") +
      "</div>";
  }

  function plakette(jam) {
    const art = stand(jam).art;
    if (art === "offen") return "";
    const wort = art === "laeuft" ? t.laeuft : art === "bald" ? t.bald : t.vorbei;
    return '<span class="jm-plakette jm-plakette--' + art + '">' + esc(wort) + "</span>";
  }

  const STERN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/></svg>';
  function sterneAnzeige(wert, klasse) {
    const voll = Math.max(0, Math.min(5, wert)) / 5 * 100;
    return '<span class="jm-sterne ' + (klasse || "") + '" aria-hidden="true">' +
      '<span class="jm-sterne__leer">' + STERN.repeat(5) + "</span>" +
      '<span class="jm-sterne__voll" style="width:' + voll.toFixed(1) + '%">' + STERN.repeat(5) + "</span></span>";
  }
  const schnittText = (z) => (z.anzahl ? z.schnitt.toLocaleString(zustand.sprache, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "–");
  const zusammenfassung = (id) => zustand.sterne.spiele[id] || { anzahl: 0, schnitt: 0, verteilung: [0, 0, 0, 0, 0], bewertungen: [] };

  const PFEIL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg>';
  const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>';

  // ---- Daten --------------------------------------------------------------------

  function jamsLaden() {
    return fetch("/jam/jams.json", { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => { zustand.jams = Array.isArray(d.jams) ? d.jams : []; })
      .catch(() => { zustand.fehler = true; });
  }

  function sterneLaden() {
    return fetch("/api/jam/?geraet=" + encodeURIComponent(geraet()), { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => { zustand.sterne = { spiele: d.spiele || {}, eigene: d.eigene || {} }; zustand.dienstOk = true; })
      .catch(() => { zustand.dienstOk = false; });
  }

  function senden(spiel, methode, koerper) {
    return fetch("/api/jam/" + encodeURIComponent(spiel), {
      method: methode,
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ geraet: geraet(), ...koerper })
    }).then((r) => r.json().catch(() => ({})).then((d) => ({ ok: r.ok, daten: d })));
  }

  const anzahlBewertungen = (jam) => jam.spiele.reduce((n, s) => n + zusammenfassung(s.id).anzahl, 0);

  function sortiert() {
    const liste = zustand.jams.slice();
    const wann = (j) => { const e = zeit(j.abgabe), s = zeit(j.start); return isNaN(e) ? (isNaN(s) ? -Infinity : s) : e; };
    if (zustand.sortierung === "name") return liste.sort((a, b) => a.name.localeCompare(b.name, zustand.sprache));
    if (zustand.sortierung === "stimmen") return liste.sort((a, b) => anzahlBewertungen(b) - anzahlBewertungen(a) || wann(b) - wann(a));
    // Neueste: laufende Jams zuerst, dann nach Abgabe, neueste oben.
    const rang = (j) => ({ laeuft: 0, bald: 1 })[stand(j).art] ?? 2;
    return liste.sort((a, b) => rang(a) - rang(b) || wann(b) - wann(a));
  }

  // ---- Zeichnen -----------------------------------------------------------------

  function aktuelleJam() {
    const m = location.pathname.match(/^\/jam\/([a-z0-9-]+)\/?$/);
    return m ? m[1] : null;
  }

  function kopf() {
    return '<header class="jm-kopf">' +
      '<a class="jm-marke" href="/" aria-label="miwale games"><img src="/assets/logo-wordmark-light.png" alt="miwale"></a>' +
      '<a class="jm-kopf__titel" href="/jam/" data-link>' + esc(t.titel) + "</a>" +
      '<div class="jm-sprache" role="group" aria-label="' + esc(t.sprachgruppe) + '">' +
        ["en", "de"].map((c) => '<button type="button" data-sprache="' + c + '" aria-pressed="' + (c === zustand.sprache) + '" lang="' + c + '">' + c.toUpperCase() + "</button>").join("") +
      "</div>" +
    "</header>";
  }

  function leiste(aktiv) {
    const sorten = [["neu", t.sortNeu], ["name", t.sortName], ["stimmen", t.sortStimmen]];
    return '<aside class="jm-leiste">' +
      '<h2 class="jm-leiste__titel">' + esc(t.sortieren) + "</h2>" +
      '<div class="jm-sortierung" role="group" aria-label="' + esc(t.sortieren) + '">' +
        sorten.map(([k, w]) => '<button type="button" data-sortierung="' + k + '" aria-pressed="' + (zustand.sortierung === k) + '">' + esc(w) + "</button>").join("") +
      "</div>" +
      '<h2 class="jm-leiste__titel">' + esc(t.jams) + "</h2>" +
      '<nav class="jm-leiste__jams" aria-label="' + esc(t.jams) + '">' +
        '<a href="/jam/" data-link' + (!aktiv ? ' aria-current="page"' : "") + ">" + esc(t.alle) + "</a>" +
        sortiert().map((j) => '<a href="/jam/' + esc(j.id) + '" data-link' + (aktiv === j.id ? ' aria-current="page"' : "") + ">" +
          '<span class="jm-punkt jm-punkt--' + stand(j).art + '"></span>' + esc(j.name) + "</a>").join("") +
      "</nav>" +
    "</aside>";
  }

  function jamKarte(jam) {
    const bild = bildOk(jam.bild) ? jam.bild : "/assets/og/miwale.jpg";
    const n = anzahlBewertungen(jam);
    return '<article class="jm-karte">' +
      '<a class="jm-karte__bild" href="/jam/' + esc(jam.id) + '" data-link tabindex="-1" aria-hidden="true">' +
        '<img src="' + esc(bild) + '" alt="" loading="lazy" decoding="async">' + plakette(jam) + "</a>" +
      '<div class="jm-karte__inhalt">' +
        '<h3><a href="/jam/' + esc(jam.id) + '" data-link>' + esc(jam.name) + "</a></h3>" +
        (jam.host ? '<p class="jm-host">' + esc(t.gehost) + " " + esc(jam.host) + "</p>" : "") +
        '<p class="jm-kurz">' + (jam.thema ? '<span class="jm-thema">' + esc(t.thema) + ": " + esc(jam.thema) + "</span> " : "") + esc(text(jam.beschreibung)) + "</p>" +
        fristZeile(jam, false) +
        '<div class="jm-karte__fuss">' +
          '<span>' + esc(t.spiele(jam.spiele.length)) + (n ? " · " + esc(t.bewertungen(n)) : "") + "</span>" +
          (linkOk(jam.itch) ? '<a href="' + esc(jam.itch) + '" target="_blank" rel="noopener">itch.io ' + PFEIL + "</a>" : "") +
        "</div>" +
      "</div>" +
    "</article>";
  }

  function uebersicht() {
    return '<section class="jm-inhalt">' +
      '<div class="jm-einleitung"><h1>' + esc(t.titel) + "</h1><p>" + esc(t.unter) + "</p></div>" +
      '<div class="jm-raster">' + sortiert().map(jamKarte).join("") + "</div>" +
    "</section>";
  }

  // Rangliste der Spiele einer Jam: wer vorne liegt, wird eingereicht.
  function rangliste(jam) {
    const reihe = jam.spiele.map((s) => ({ s, z: zusammenfassung(s.id) }))
      .sort((a, b) => b.z.schnitt - a.z.schnitt || b.z.anzahl - a.z.anzahl);
    const leer = reihe.every((r) => !r.z.anzahl);
    return '<section class="jm-rang">' +
      "<h2>" + esc(t.rangTitel) + "</h2>" +
      (leer ? '<p class="jm-leise">' + esc(t.rangLeer) + "</p>" :
        "<ol>" + reihe.map((r, i) => '<li class="' + (i === 0 && r.z.anzahl ? "jm-rang--vorn" : "") + '">' +
          '<span class="jm-rang__platz">' + (i + 1) + "</span>" +
          '<a href="#spiel-' + esc(r.s.id) + '" data-anker>' + esc(r.s.name) + "</a>" +
          sterneAnzeige(r.z.schnitt, "jm-sterne--klein") +
          '<span class="jm-rang__zahl">' + esc(schnittText(r.z)) + " · " + esc(t.bewertungen(r.z.anzahl)) + "</span></li>").join("") +
        "</ol>") +
    "</section>";
  }

  function verteilung(z) {
    const max = Math.max(1, ...z.verteilung);
    return '<div class="jm-verteilung">' + [5, 4, 3, 2, 1].map((n) =>
      '<div class="jm-verteilung__zeile"><span>' + n + "</span>" + STERN +
      '<span class="jm-verteilung__balken"><span style="width:' + (z.verteilung[n - 1] / max * 100).toFixed(1) + '%"></span></span>' +
      "<span>" + z.verteilung[n - 1] + "</span></div>").join("") + "</div>";
  }

  function formular(spiel) {
    const eigen = zustand.sterne.eigene[spiel.id];
    const name = eigen ? eigen.name : speicherLesen(NAME_SCHLUESSEL) || "";
    const wert = eigen ? eigen.sterne : 0;
    const m = zustand.meldung[spiel.id];
    const gruppe = "sterne-" + spiel.id;
    return '<form class="jm-formular" data-formular="' + esc(spiel.id) + '" novalidate>' +
      "<h4>" + esc(eigen ? t.deine : t.bewerten) + "</h4>" +
      '<fieldset class="jm-wahl"><legend class="jm-unsichtbar">' + esc(t.sterne) + "</legend>" +
        [1, 2, 3, 4, 5].map((n) => '<input type="radio" id="' + esc(gruppe + "-" + n) + '" name="sterne" value="' + n + '"' + (n === wert ? " checked" : "") + ">" +
          '<label for="' + esc(gruppe + "-" + n) + '" title="' + esc(t.sternWahl(n)) + '"><span class="jm-unsichtbar">' + esc(t.sternWahl(n)) + "</span>" + STERN + "</label>").join("") +
      "</fieldset>" +
      '<label class="jm-feld"><span>' + esc(t.name) + '</span><input name="name" maxlength="' + GRENZEN.name + '" autocomplete="nickname" required value="' + esc(name) + '"></label>' +
      '<label class="jm-feld"><span>' + esc(t.begruendung) + '</span><textarea name="text" rows="3" maxlength="' + GRENZEN.text + '" placeholder="' + esc(t.begruendungPlatz) + '">' + esc(eigen ? eigen.text : "") + "</textarea></label>" +
      // Fuer Bots: Menschen sehen das Feld nicht.
      '<label class="jm-falle" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>' +
      '<div class="jm-formular__knoepfe">' +
        '<button type="submit" class="jm-knopf jm-knopf--haupt">' + esc(eigen ? t.aendern : t.senden) + "</button>" +
        (eigen ? '<button type="button" class="jm-knopf jm-knopf--leise" data-zurueckziehen="' + esc(spiel.id) + '">' + esc(t.zurueckziehen) + "</button>" : "") +
      "</div>" +
      (m ? '<p class="jm-meldung jm-meldung--' + m.art + '" role="status">' + esc(m.text) + "</p>" : '<p class="jm-meldung" role="status"></p>') +
    "</form>";
  }

  function bewertungsListe(spiel, z) {
    if (!z.anzahl) return '<p class="jm-leise">' + esc(t.keineBewertungen) + "</p>";
    const offen = zustand.offen[spiel.id];
    const zeigen = offen ? z.bewertungen : z.bewertungen.slice(0, 3);
    return '<ul class="jm-liste">' + zeigen.map((b) =>
      "<li>" +
        '<div class="jm-liste__kopf"><strong>' + esc(b.name) + "</strong>" + sterneAnzeige(b.sterne, "jm-sterne--klein") +
        '<time datetime="' + esc(b.zeit) + '">' + esc(relativ(b.zeit)) + "</time></div>" +
        (b.text ? "<p>" + esc(b.text) + "</p>" : "") +
      "</li>").join("") + "</ul>" +
      (z.bewertungen.length > 3 ? '<button type="button" class="jm-knopf jm-knopf--leise" data-alle="' + esc(spiel.id) + '">' + esc(offen ? t.weniger : t.mehr(z.bewertungen.length - 3)) + "</button>" : "");
  }

  function spielKarte(spiel) {
    const z = zusammenfassung(spiel.id);
    const bild = bildOk(spiel.bild) ? spiel.bild : "/assets/og/miwale.jpg";
    return '<article class="jm-spiel" id="spiel-' + esc(spiel.id) + '">' +
      '<div class="jm-spiel__oben">' +
        '<div class="jm-spiel__bild"><img src="' + esc(bild) + '" alt="" loading="lazy" decoding="async"></div>' +
        '<div class="jm-spiel__info">' +
          "<h3>" + esc(spiel.name) + "</h3>" +
          '<p class="jm-kurz">' + esc(text(spiel.beschreibung)) + "</p>" +
          (linkOk(spiel.spielen)
            ? '<a class="jm-knopf jm-knopf--play" href="' + esc(spiel.spielen) + '" target="_blank" rel="noopener">' + PLAY + esc(t.spielen) + "</a>"
            : '<span class="jm-leise">' + esc(t.linkFolgt) + "</span>") +
          '<div class="jm-schnitt">' +
            '<span class="jm-schnitt__zahl">' + esc(schnittText(z)) + "</span>" +
            "<div>" + sterneAnzeige(z.schnitt) + '<span class="jm-leise">' + esc(t.bewertungen(z.anzahl)) + "</span></div>" +
          "</div>" +
          verteilung(z) +
        "</div>" +
      "</div>" +
      '<div class="jm-spiel__unten">' +
        (zustand.dienstOk ? formular(spiel) : '<p class="jm-leise">' + esc(t.dienstWeg) + "</p>") +
        '<div class="jm-spiel__stimmen">' + bewertungsListe(spiel, z) + "</div>" +
      "</div>" +
    "</article>";
  }

  function jamSeite(jam) {
    const bild = bildOk(jam.bild) ? jam.bild : "/assets/og/miwale.jpg";
    return '<section class="jm-inhalt">' +
      '<a class="jm-zurueck" href="/jam/" data-link>← ' + esc(t.zurueck) + "</a>" +
      '<header class="jm-jamkopf">' +
        '<img src="' + esc(bild) + '" alt="">' +
        "<div>" +
          '<div class="jm-jamkopf__zeile">' + plakette(jam) + (jam.thema ? '<span class="jm-thema">' + esc(t.thema) + ": " + esc(jam.thema) + "</span>" : "") + "</div>" +
          "<h1>" + esc(jam.name) + "</h1>" +
          (jam.host ? '<p class="jm-host">' + esc(t.gehost) + " " + esc(jam.host) + "</p>" : "") +
          '<p class="jm-kurz">' + esc(text(jam.beschreibung)) + "</p>" +
          fristZeile(jam, true) +
          (linkOk(jam.itch) ? '<a class="jm-knopf jm-knopf--glas" href="' + esc(jam.itch) + '" target="_blank" rel="noopener">' + esc(t.zuItch) + " " + PFEIL + "</a>" : "") +
        "</div>" +
      "</header>" +
      (jam.spiele.length > 1 ? rangliste(jam) : "") +
      '<div class="jm-spiele">' + jam.spiele.map(spielKarte).join("") + "</div>" +
    "</section>";
  }

  function zeichnen() {
    t = TEXTE[zustand.sprache];
    document.documentElement.lang = zustand.sprache;
    if (zustand.fehler) { app.innerHTML = kopf() + '<main class="jm-rahmen"><p class="jm-leise">' + esc(t.fehlerLaden) + "</p></main>"; return; }
    if (!zustand.jams) { app.innerHTML = kopf() + '<main class="jm-rahmen"><p class="jm-leise">' + esc(t.laden) + "</p></main>"; return; }
    const id = aktuelleJam();
    const jam = id && zustand.jams.find((j) => j.id === id);
    let inhalt;
    if (id && !jam) inhalt = '<section class="jm-inhalt"><a class="jm-zurueck" href="/jam/" data-link>← ' + esc(t.zurueck) + '</a><p class="jm-leise">' + esc(t.unbekannt) + "</p></section>";
    else inhalt = jam ? jamSeite(jam) : uebersicht();
    // Fokus und Eingaben eines Formulars ueberleben das Neuzeichnen nicht; darum
    // wird nur nach Aktionen neu gezeichnet, nie im Takt der Uhr.
    app.innerHTML = kopf() + '<main class="jm-rahmen">' + leiste(jam ? jam.id : null) + inhalt + "</main>";
    document.title = (jam ? jam.name + " · " : "") + t.titel + " · miwale";
  }

  // Die Uhr: nur die Fristen weiterzaehlen, nicht die ganze Seite.
  function ticken() {
    if (!zustand.jams) return;
    for (const el of document.querySelectorAll("[data-frist]")) {
      const jam = zustand.jams.find((j) => j.id === el.dataset.frist);
      if (!jam) continue;
      const s = stand(jam);
      if (s.art !== "laeuft" && s.art !== "bald") { if (!document.querySelector("form :focus")) zeichnen(); return; }
      const rest = el.querySelector("[data-rest]");
      if (rest) rest.textContent = dauer(s.rest, el.hasAttribute("data-genau"));
      const balken = el.querySelector("[data-anteil]");
      if (balken && s.anteil != null) balken.style.width = (s.anteil * 100).toFixed(2) + "%";
    }
  }

  // ---- Ereignisse ---------------------------------------------------------------

  function gehe(pfad) {
    if (pfad !== location.pathname) history.pushState(null, "", pfad);
    zeichnen();
    window.scrollTo(0, 0);
  }

  app.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-link]");
    if (link && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
      e.preventDefault();
      gehe(link.getAttribute("href"));
      return;
    }
    const sprache = e.target.closest("[data-sprache]");
    if (sprache) {
      zustand.sprache = sprache.dataset.sprache;
      speicherSetzen(SPRACH_SCHLUESSEL, zustand.sprache);
      zeichnen();
      return;
    }
    const sortierung = e.target.closest("[data-sortierung]");
    if (sortierung) {
      zustand.sortierung = sortierung.dataset.sortierung;
      speicherSetzen(SORT_SCHLUESSEL, zustand.sortierung);
      zeichnen();
      return;
    }
    const alle = e.target.closest("[data-alle]");
    if (alle) {
      zustand.offen[alle.dataset.alle] = !zustand.offen[alle.dataset.alle];
      zeichnen();
      return;
    }
    const weg = e.target.closest("[data-zurueckziehen]");
    if (weg) {
      const spiel = weg.dataset.zurueckziehen;
      weg.disabled = true;
      senden(spiel, "DELETE", {}).then(({ ok, daten }) => {
        if (ok) {
          zustand.sterne.spiele[spiel] = daten.spiel;
          delete zustand.sterne.eigene[spiel];
          zustand.meldung[spiel] = { art: "ok", text: t.entfernt };
        } else zustand.meldung[spiel] = { art: "fehler", text: t.fehler[daten.fehler] || t.fehler.sonst };
        zeichnenAn(spiel);
      }, () => { zustand.meldung[spiel] = { art: "fehler", text: t.fehler.netz }; zeichnenAn(spiel); });
    }
  });

  // Neu zeichnen und das Spiel im Blick behalten, statt nach oben zu springen.
  function zeichnenAn(spiel) {
    const vorher = document.getElementById("spiel-" + spiel);
    const oben = vorher ? vorher.getBoundingClientRect().top : null;
    zeichnen();
    const nachher = document.getElementById("spiel-" + spiel);
    if (nachher && oben != null) window.scrollBy(0, nachher.getBoundingClientRect().top - oben);
  }

  app.addEventListener("submit", (e) => {
    const form = e.target.closest("[data-formular]");
    if (!form) return;
    e.preventDefault();
    const spiel = form.dataset.formular;
    const daten = new FormData(form);
    const sterne = Number(daten.get("sterne"));
    const name = String(daten.get("name") || "").trim();
    const meldung = form.querySelector(".jm-meldung");
    const zeigen = (art, wort) => { meldung.className = "jm-meldung jm-meldung--" + art; meldung.textContent = wort; };
    if (!(sterne >= 1 && sterne <= 5)) return zeigen("fehler", t.fehler.sterne);
    if (!name) { form.elements.name.focus(); return zeigen("fehler", t.fehler.name); }
    const knopf = form.querySelector('button[type="submit"]');
    knopf.disabled = true;
    speicherSetzen(NAME_SCHLUESSEL, name);
    senden(spiel, "PUT", { name, sterne, text: String(daten.get("text") || ""), website: String(daten.get("website") || "") }).then(({ ok, daten: d }) => {
      if (!ok) { knopf.disabled = false; return zeigen("fehler", t.fehler[d.fehler] || t.fehler.sonst); }
      zustand.sterne.spiele[spiel] = d.spiel;
      zustand.sterne.eigene[spiel] = d.eigene;
      zustand.meldung[spiel] = { art: "ok", text: t.gesendet };
      zeichnenAn(spiel);
    }, () => { knopf.disabled = false; zeigen("fehler", t.fehler.netz); });
  });

  window.addEventListener("popstate", zeichnen);

  zeichnen();
  Promise.all([jamsLaden(), sterneLaden()]).then(() => {
    zeichnen();
    // Direkt auf ein Spiel verlinkt (/jam/ai-jam-5#spiel-last-ember)?
    if (location.hash) { const ziel = document.getElementById(location.hash.slice(1)); if (ziel) ziel.scrollIntoView(); }
  });
  setInterval(ticken, 1000);
})();
