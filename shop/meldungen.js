// Benachrichtigungen in der Kopfzeile der Spieleseite: eine Glocke, die zeigt,
// wenn ein neues Spiel online ist oder ein neues YouTube-Video erscheint.
//
// Neue Spiele kommen von selbst aus dem Katalog (shop/spiele.js, Feld
// veroeffentlicht). Videos stehen unten in VIDEOS und werden von Hand
// eingetragen — neuestes zuerst.
//
// Gelesen ist, was aelter ist als der letzte Blick in die Liste. Der Zeitpunkt
// liegt pro Geraet im localStorage; ein Konto gibt es nicht.
//
// shop.js baut die Kopfzeile als HTML-Text und ruft danach
// MIWALE_MELDUNGEN.einbauen(element, sprache) auf.
(() => {
  "use strict";

  const KANAL = "https://www.youtube.com/@miwale-games";

  // { datum: "JJJJ-MM-TT", titel: "…" oder { en, de }, id: "YouTube-Video-ID", short: true }
  const VIDEOS = [];

  const GESEHEN_SCHLUESSEL = "miwale-meldungen-gesehen";
  // Wer zum ersten Mal kommt, bekommt nur Frisches als neu markiert, nicht
  // jedes Spiel, das es je gab.
  const NEU_TAGE = 14;
  const MAX = 8;
  // Aeltere Meldungen sind keine Neuigkeit mehr und fallen aus der Liste.
  const ALTER_TAGE = 120;

  const TEXTE = {
    en: {
      titel: "Notifications",
      neuesSpiel: "New game",
      neuesVideo: "New video",
      leer: "Nothing new right now.",
      kanal: "YouTube channel",
      heute: "Today",
      gestern: "Yesterday",
      tageHer: (n) => n + " days ago",
      monate: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      ungelesen: (n) => n + " new"
    },
    de: {
      titel: "Benachrichtigungen",
      neuesSpiel: "Neues Spiel",
      neuesVideo: "Neues Video",
      leer: "Gerade nichts Neues.",
      kanal: "YouTube-Kanal",
      heute: "Heute",
      gestern: "Gestern",
      tageHer: (n) => "vor " + n + " Tagen",
      monate: ["Jan.", "Feb.", "März", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sep.", "Okt.", "Nov.", "Dez."],
      ungelesen: (n) => n + " neu"
    }
  };

  const GLOCKE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';
  const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7.5v9l7.5-4.5z" fill="currentColor" stroke="none"/></svg>';

  function esc(x) {
    return String(x == null ? "" : x).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  function heuteIso() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function tageZwischen(a, b) {
    return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
  }

  function gesehen() {
    try {
      const x = localStorage.getItem(GESEHEN_SCHLUESSEL);
      if (/^\d{4}-\d{2}-\d{2}$/.test(x || "")) return x;
    } catch (e) { /* ohne Speicher gilt die Frist */ }
    const d = new Date(Date.now() - NEU_TAGE * 86400000);
    return d.toISOString().slice(0, 10);
  }

  function eintraege(sprache) {
    const heute = heuteIso();
    const spiele = (window.MIWALE_SPIELE || []).filter((sp) => sp.veroeffentlicht).map((sp) => ({
      art: "spiel", datum: sp.veroeffentlicht, titel: sp.name, bild: sp.bild, href: "/games/" + sp.id, intern: true
    }));
    const videos = VIDEOS.map((v) => ({
      art: "video", datum: v.datum,
      titel: v.titel && typeof v.titel === "object" ? (v.titel[sprache] || v.titel.en) : v.titel,
      bild: "https://i.ytimg.com/vi/" + encodeURIComponent(v.id) + "/mqdefault.jpg",
      href: "https://www.youtube.com/" + (v.short ? "shorts/" : "watch?v=") + encodeURIComponent(v.id)
    }));
    // Nichts aus der Zukunft: ein Spiel mit spaeterem Datum ist noch nicht raus.
    return spiele.concat(videos)
      .filter((x) => x.datum <= heute && tageZwischen(x.datum, heute) <= ALTER_TAGE)
      .sort((a, b) => b.datum.localeCompare(a.datum))
      .slice(0, MAX);
  }

  function wann(iso, t) {
    const n = tageZwischen(iso, heuteIso());
    if (n <= 0) return t.heute;
    if (n === 1) return t.gestern;
    if (n < 7) return t.tageHer(n);
    const [j, m, tag] = iso.split("-").map(Number);
    return t === TEXTE.de ? tag + ". " + t.monate[m - 1] + " " + j : tag + " " + t.monate[m - 1] + " " + j;
  }

  let schliessenBeiKlick = null;

  function einbauen(box, sprache) {
    if (!box) return;
    const t = TEXTE[sprache] || TEXTE.en;
    const liste = eintraege(sprache);
    const stand = gesehen();
    const neu = liste.filter((x) => x.datum > stand).length;

    box.innerHTML =
      '<button type="button" class="sp-symbol sp-meldungen__knopf" aria-haspopup="true" aria-expanded="false" aria-label="' + esc(t.titel + (neu ? ", " + t.ungelesen(neu) : "")) + '" title="' + esc(t.titel) + '">' +
        GLOCKE + (neu ? '<span class="sp-meldungen__zahl" aria-hidden="true">' + (neu > 9 ? "9+" : neu) + "</span>" : "") +
      "</button>" +
      '<div class="sp-meldungen__feld" hidden>' +
        '<div class="sp-meldungen__kopf"><strong>' + esc(t.titel) + "</strong>" + (neu ? '<span class="sp-meldungen__neu">' + esc(t.ungelesen(neu)) + "</span>" : "") + "</div>" +
        (liste.length ? '<ul class="sp-meldungen__liste">' + liste.map((x) =>
          '<li><a class="sp-meldung' + (x.datum > stand ? " sp-meldung--neu" : "") + '" href="' + esc(x.href) + '"' +
            (x.intern ? " data-link" : ' target="_blank" rel="noopener noreferrer"') + ">" +
            '<span class="sp-meldung__bild' + (x.art === "video" ? " sp-meldung__bild--video" : "") + '"><img src="' + esc(x.bild) + '" alt="" loading="lazy">' + (x.art === "video" ? PLAY : "") + "</span>" +
            '<span class="sp-meldung__text"><span class="sp-meldung__art">' + esc(x.art === "video" ? t.neuesVideo : t.neuesSpiel) + "</span>" +
              '<span class="sp-meldung__titel">' + esc(x.titel) + "</span>" +
              '<span class="sp-meldung__wann">' + esc(wann(x.datum, t)) + "</span></span>" +
          "</a></li>").join("") + "</ul>"
          : '<p class="sp-meldungen__leer">' + esc(t.leer) + "</p>") +
        '<a class="sp-meldungen__fuss" href="' + KANAL + '" target="_blank" rel="noopener noreferrer">' + esc(t.kanal) + ' <span aria-hidden="true">↗</span></a>' +
      "</div>";

    const knopf = box.querySelector(".sp-meldungen__knopf");
    const feld = box.querySelector(".sp-meldungen__feld");

    function zu() {
      if (feld.hidden) return;
      feld.hidden = true;
      knopf.setAttribute("aria-expanded", "false");
    }

    knopf.addEventListener("click", () => {
      if (!feld.hidden) { zu(); return; }
      feld.hidden = false;
      knopf.setAttribute("aria-expanded", "true");
      // Beim Oeffnen gilt alles als gesehen. Die Markierungen in der Liste
      // bleiben stehen, bis sie wieder zugeht — sonst sieht man nicht, was neu war.
      if (neu) {
        try { localStorage.setItem(GESEHEN_SCHLUESSEL, heuteIso()); } catch (e) { /* dann eben beim naechsten Mal wieder */ }
        const zahl = knopf.querySelector(".sp-meldungen__zahl");
        if (zahl) zahl.remove();
        knopf.setAttribute("aria-label", t.titel);
      }
    });
    feld.addEventListener("click", (e) => { if (e.target.closest("a")) zu(); });
    box.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !feld.hidden) { zu(); knopf.focus(); }
    });

    // Ein Klick irgendwo sonst schliesst. Die Kopfzeile wird bei jedem
    // Seitenwechsel neu gebaut, darum den alten Horcher vorher abhaengen.
    if (schliessenBeiKlick) document.removeEventListener("pointerdown", schliessenBeiKlick);
    schliessenBeiKlick = (e) => { if (!box.contains(e.target)) zu(); };
    document.addEventListener("pointerdown", schliessenBeiKlick);
  }

  window.MIWALE_MELDUNGEN = { einbauen };
})();
