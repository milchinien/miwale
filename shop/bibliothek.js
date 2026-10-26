// Bibliothek (/library und /library/<id>), aufgebaut wie die Bibliothek von Steam:
// links eine Leiste mit allen Spielen (Suche, Favoriten zuerst), rechts Regale mit
// grossen Kacheln -- Favoriten, Zuletzt gespielt, Alle Spiele. Jedes Spiel hat eine
// eigene Seite mit Spielen-Knopf, Spielzeit, zuletzt gespielt und seinen Erfolgen.
//
// Spielzeit und Favoriten kommen aus shop/profil.js: mit Konto vom Server, ohne
// Konto von diesem Geraet. Erfolge gibt es nur mit Konto.
(() => {
  "use strict";

  const UI = window.MIWALE_PROFIL_UI;
  if (!UI) return;
  const { esc, lokal } = UI;
  const K = UI.katalog;
  const ID = () => window.MIWALE_IDENTITAET;

  const TEXTE = {
    en: {
      titel: "Library — miwale games", spielTitel: (n) => n + " — Library — miwale games",
      bibliothek: "Library", suche: "Search your games", favoriten: "Favorites", alle: "All games", zuletzt: "Recent games",
      sort: { name: "Alphabetical", zuletzt: "Recently played", zeit: "Hours played" }, sortieren: "Sort by",
      keineTreffer: "No game matches your search.",
      favoritAn: "Add to favorites", favoritAus: "Remove from favorites", favoritenLeer: "Click the star on a game to pin it here.",
      spielen: "Play", shopSeite: "Store page", bewertungen: "Reviews", zurueck: "Library",
      spielzeit: "Playtime", zuletztGespielt: "Last played", erfolge: "Achievements", nie: "Never", keine: "None yet",
      erfolgeTitel: "Achievements", erfolgeFortschritt: (a, b) => "You've unlocked " + a + " of " + b + " (" + (b ? Math.round((a / b) * 100) : 0) + "%)",
      erfolgeGast: "Sign in to earn achievements and keep your playtime on every device.", anmelden: "Sign in",
      gesperrt: "Locked", freiAm: (d) => "Unlocked " + d, fortschritt: (a, b) => a + " / " + b,
      geraetHinweis: "Playtime is saved on this device.",
      ueber: "About", geraete: "Plays on", pc: "PC", handy: "Phone", veroeffentlicht: "Released", stunden: (s) => UI.T().sekunden(s)
    },
    de: {
      titel: "Bibliothek — miwale games", spielTitel: (n) => n + " — Bibliothek — miwale games",
      bibliothek: "Bibliothek", suche: "Deine Spiele durchsuchen", favoriten: "Favoriten", alle: "Alle Spiele", zuletzt: "Zuletzt gespielt",
      sort: { name: "Alphabetisch", zuletzt: "Zuletzt gespielt", zeit: "Spielstunden" }, sortieren: "Sortieren nach",
      keineTreffer: "Kein Spiel passt zur Suche.",
      favoritAn: "Zu Favoriten", favoritAus: "Aus Favoriten entfernen", favoritenLeer: "Klick auf den Stern eines Spiels, um es hier anzuheften.",
      spielen: "Spielen", shopSeite: "Shop-Seite", bewertungen: "Bewertungen", zurueck: "Bibliothek",
      spielzeit: "Spielzeit", zuletztGespielt: "Zuletzt gespielt", erfolge: "Erfolge", nie: "Nie", keine: "Noch keine",
      erfolgeTitel: "Erfolge", erfolgeFortschritt: (a, b) => "Du hast " + a + " von " + b + " freigeschaltet (" + (b ? Math.round((a / b) * 100) : 0) + " %)",
      erfolgeGast: "Melde dich an, um Erfolge zu sammeln und deine Spielzeit auf jedem Gerät zu behalten.", anmelden: "Anmelden",
      gesperrt: "Gesperrt", freiAm: (d) => "Freigeschaltet am " + d, fortschritt: (a, b) => a + " / " + b,
      geraetHinweis: "Die Spielzeit ist auf diesem Gerät gespeichert.",
      ueber: "Über das Spiel", geraete: "Läuft auf", pc: "PC", handy: "Handy", veroeffentlicht: "Veröffentlicht", stunden: (s) => UI.T().sekunden(s)
    }
  };

  const seite = { el: null, sprache: "en", id: null, suche: "", sort: "name" };
  const t = () => TEXTE[seite.sprache];
  const spiele = () => window.MIWALE_SPIELE || [];
  const spielVon = (id) => spiele().find((s) => s.id === id) || null;

  const ICON = {
    stern: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
    zurueck: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    lupe: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
  };

  function datum(iso) {
    try { return new Intl.DateTimeFormat(seite.sprache, { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)); } catch (e) { return String(iso).slice(0, 10); }
  }
  const textVon = (sp) => (sp.texte && (sp.texte[seite.sprache] || sp.texte.en)) || {};
  const angemeldet = () => !!ID().konto() && !!UI.stand();

  // Erfolge eines Spiels, sortiert wie bei Steam: freigeschaltete zuerst (neueste oben),
  // dann gesperrte nach Fortschritt, dann wie im Katalog.
  function erfolgeVon(id) {
    const p = angemeldet() ? UI.stand() : null;
    const sek = UI.spielzeit(id).sek || 0;
    return K.erfolge.filter((e) => e.spiel === id).map((e, i) => {
      const am = p && p.erfolge[e.id] ? p.erfolge[e.id] : null;
      const anteil = am ? 1 : e.art === "spielzeit" ? Math.min(1, sek / e.sekunden) : 0;
      return { e, am, anteil, i };
    }).sort((a, b) => (b.am ? 1 : 0) - (a.am ? 1 : 0) || String(b.am || "").localeCompare(String(a.am || "")) || b.anteil - a.anteil || a.i - b.i);
  }

  // ---- Bausteine ----
  function sternKnopf(id, klasse) {
    const an = UI.istFavorit(id);
    return '<button type="button" class="' + klasse + (an ? " ist-an" : "") + '" data-bib-favorit="' + esc(id) + '" aria-pressed="' + an + '" title="' + esc(an ? t().favoritAus : t().favoritAn) + '" aria-label="' + esc(an ? t().favoritAus : t().favoritAn) + '">' + ICON.stern + "</button>";
  }

  function kachel(sp) {
    const z = UI.spielzeit(sp.id);
    const liste = erfolgeVon(sp.id);
    const frei = liste.filter((x) => x.am).length;
    return '<div class="bib-kachel">' +
      '<a class="bib-kachel__link" href="/library/' + esc(sp.id) + '" data-link aria-label="' + esc(sp.name) + '">' +
        '<img src="' + esc(sp.bild) + '" alt="" loading="lazy">' +
        '<span class="bib-kachel__unten"><span class="bib-kachel__name">' + esc(sp.name) + "</span>" +
          '<span class="bib-kachel__zeit">' + (z.sek ? esc(t().stunden(z.sek)) : "") + "</span></span>" +
        (angemeldet() && liste.length ? '<span class="bib-kachel__balken" title="' + esc(t().erfolge + " " + frei + "/" + liste.length) + '"><span style="width:' + Math.round((frei / liste.length) * 100) + '%"></span></span>' : "") +
      "</a>" +
      '<a class="bib-kachel__play" href="/games/' + esc(sp.id) + '/spielen" data-link aria-label="' + esc(t().spielen + " " + sp.name) + '">' + ICON.play + "</a>" +
      sternKnopf(sp.id, "bib-kachel__stern") +
    "</div>";
  }

  function regal(titel, liste, extra) {
    if (!liste.length && !extra) return "";
    return '<section class="bib-regal"><div class="bib-regal__kopf"><h2>' + esc(titel) + ' <span>(' + liste.length + ")</span></h2>" + (extra || "") + "</div>" +
      (liste.length ? '<div class="bib-raster">' + liste.map(kachel).join("") + "</div>" : "") + "</section>";
  }

  function sortiert(liste) {
    const z = (sp) => UI.spielzeit(sp.id);
    const l = liste.slice();
    if (seite.sort === "zeit") return l.sort((a, b) => (z(b).sek || 0) - (z(a).sek || 0) || a.name.localeCompare(b.name));
    if (seite.sort === "zuletzt") return l.sort((a, b) => String(z(b).zuletzt || "").localeCompare(String(z(a).zuletzt || "")) || a.name.localeCompare(b.name));
    return l.sort((a, b) => a.name.localeCompare(b.name, seite.sprache));
  }

  function leiste() {
    const q = seite.suche.trim().toLowerCase();
    const passt = (sp) => !q || sp.name.toLowerCase().includes(q);
    const fav = UI.favoriten().map(spielVon).filter(Boolean).filter(passt);
    const alle = spiele().filter(passt).slice().sort((a, b) => a.name.localeCompare(b.name, seite.sprache));
    const zeile = (sp) => {
      const z = UI.spielzeit(sp.id);
      return '<li><a class="bib-leiste__spiel' + (seite.id === sp.id ? " ist-aktiv" : "") + '" href="/library/' + esc(sp.id) + '" data-link>' +
        '<img src="' + esc(sp.bild) + '" alt="" loading="lazy"><span>' + esc(sp.name) + "</span>" + (z.sek ? "<small>" + esc(t().stunden(z.sek)) + "</small>" : "") + "</a></li>";
    };
    return '<aside class="bib-leiste"><div class="bib-leiste__innen">' +
      '<a class="bib-leiste__start' + (!seite.id ? " ist-aktiv" : "") + '" href="/library" data-link>' + esc(t().bibliothek) + "</a>" +
      '<label class="bib-leiste__suche">' + ICON.lupe + '<input type="search" data-bib-suche placeholder="' + esc(t().suche) + '" value="' + esc(seite.suche) + '" aria-label="' + esc(t().suche) + '"></label>' +
      '<div data-bib-listen>' +
      (fav.length ? '<h3>' + esc(t().favoriten) + " <span>(" + fav.length + ")</span></h3><ul>" + fav.map(zeile).join("") + "</ul>" : "") +
      '<h3>' + esc(t().alle) + " <span>(" + alle.length + ")</span></h3>" + (alle.length ? "<ul>" + alle.map(zeile).join("") + "</ul>" : '<p class="bib-leer">' + esc(t().keineTreffer) + "</p>") +
      "</div></div></aside>";
  }

  function startseite() {
    const fav = UI.favoriten().map(spielVon).filter(Boolean);
    const zuletzt = spiele().filter((sp) => UI.spielzeit(sp.id).zuletzt).sort((a, b) => String(UI.spielzeit(b.id).zuletzt).localeCompare(String(UI.spielzeit(a.id).zuletzt))).slice(0, 6);
    const sortKnopf = '<label class="bib-sort">' + esc(t().sortieren) + ' <select data-bib-sort>' + ["name", "zuletzt", "zeit"].map((s) => '<option value="' + s + '"' + (seite.sort === s ? " selected" : "") + ">" + esc(t().sort[s]) + "</option>").join("") + "</select></label>";
    return (ID().kontenAktiv() && !ID().konto() ? '<div class="bib-hinweis"><span>' + esc(t().erfolgeGast) + '</span><a class="sp-knopf sp-knopf--glas" href="/account" data-anmelden>' + esc(t().anmelden) + "</a></div>" : "") +
      regal(t().favoriten, fav, fav.length ? "" : '<p class="bib-leer">' + esc(t().favoritenLeer) + "</p>") +
      regal(t().zuletzt, zuletzt) +
      regal(t().alle, sortiert(spiele()), sortKnopf);
  }

  function erfolgZeile(x) {
    const e = x.e;
    const name = lokal(e.titel || e.name);
    let rechts;
    if (x.am) rechts = '<span class="bib-erfolg__datum">' + esc(t().freiAm(datum(x.am))) + "</span>";
    else if (e.art === "spielzeit" && x.anteil > 0) rechts = '<span class="bib-erfolg__fortschritt"><span class="bib-balken"><span style="width:' + Math.round(x.anteil * 100) + '%"></span></span><small>' + esc(t().fortschritt(UI.T().sekunden(Math.round(x.anteil * e.sekunden)), UI.T().sekunden(e.sekunden))) + "</small></span>";
    else rechts = '<span class="bib-erfolg__datum">' + esc(t().gesperrt) + "</span>";
    return '<li class="bib-erfolg' + (x.am ? " ist-frei" : "") + '">' + UI.erfolgSymbol(e, !x.am) +
      '<div class="bib-erfolg__text"><strong>' + esc(name) + "</strong><span>" + esc(lokal(e.text)) + "</span></div>" + rechts + "</li>";
  }

  function spielseite(sp) {
    const z = UI.spielzeit(sp.id);
    const tx = textVon(sp);
    const liste = erfolgeVon(sp.id);
    const frei = liste.filter((x) => x.am).length;
    // Absolut: eine relative Adresse in einer CSS-Variablen loest der Browser relativ zur CSS-Datei auf.
    const bild = "/" + String((sp.medien && sp.medien.screens && sp.medien.screens[0]) || sp.bild).replace(/^\/+/, "");
    return '<div class="bib-spiel">' +
      '<div class="bib-held" style="--bib-bild:url(' + esc(JSON.stringify(bild)) + ')">' +
        '<a class="bib-held__zurueck" href="/library" data-link>' + ICON.zurueck + esc(t().zurueck) + "</a>" +
        '<h1 class="bib-held__name">' + esc(sp.name) + "</h1></div>" +
      '<div class="bib-aktionen">' +
        '<a class="bib-play" href="/games/' + esc(sp.id) + '/spielen" data-link>' + ICON.play + esc(t().spielen) + "</a>" +
        '<a class="bib-wert" href="#bib-erfolge"><small>' + esc(t().spielzeit) + "</small><strong>" + esc(z.sek ? t().stunden(z.sek) : t().keine) + "</strong></a>" +
        '<a class="bib-wert" href="#bib-erfolge"><small>' + esc(t().zuletztGespielt) + "</small><strong>" + esc(z.zuletzt ? datum(z.zuletzt) : t().nie) + "</strong></a>" +
        '<a class="bib-wert" href="#bib-erfolge"><small>' + esc(t().erfolge) + "</small><strong>" + frei + " / " + liste.length + '</strong><span class="bib-balken"><span style="width:' + (liste.length ? Math.round((frei / liste.length) * 100) : 0) + '%"></span></span></a>' +
        '<span class="bib-aktionen__rechts">' + sternKnopf(sp.id, "bib-knopf bib-knopf--stern") +
          '<a class="bib-knopf" href="/games/' + esc(sp.id) + '" data-link>' + esc(t().shopSeite) + "</a></span>" +
      "</div>" +
      (!ID().konto() && z.sek ? '<p class="bib-geraet">' + esc(t().geraetHinweis) + "</p>" : "") +
      '<div class="bib-spalten">' +
        '<section class="bib-karte" id="bib-erfolge"><div class="bib-karte__kopf"><h2>' + esc(t().erfolgeTitel) + "</h2>" +
          (angemeldet() ? "<span>" + esc(t().erfolgeFortschritt(frei, liste.length)) + "</span>" : "") + "</div>" +
          (angemeldet() ? '<div class="bib-balken bib-balken--gross"><span style="width:' + (liste.length ? Math.round((frei / liste.length) * 100) : 0) + '%"></span></div>' : "") +
          (!angemeldet() && ID().kontenAktiv() ? '<div class="bib-hinweis bib-hinweis--klein"><span>' + esc(t().erfolgeGast) + '</span><a class="sp-knopf sp-knopf--glas" href="/account" data-anmelden>' + esc(t().anmelden) + "</a></div>" : "") +
          '<ul class="bib-erfolge">' + liste.map(erfolgZeile).join("") + "</ul></section>" +
        '<section class="bib-karte bib-karte--ueber"><div class="bib-karte__kopf"><h2>' + esc(t().ueber) + "</h2></div>" +
          "<p>" + esc(tx.kurz || "") + "</p>" +
          '<dl class="bib-fakten">' +
            (sp.veroeffentlicht ? "<div><dt>" + esc(t().veroeffentlicht) + "</dt><dd>" + esc(datum(sp.veroeffentlicht)) + "</dd></div>" : "") +
            "<div><dt>" + esc(t().geraete) + "</dt><dd>" + esc((sp.geraete || []).map((g) => t()[g] || g).join(" · ")) + "</dd></div>" +
          "</dl>" +
          ((tx.tags || []).length ? '<p class="bib-tags">' + tx.tags.map((x) => '<a href="/games/' + esc(sp.id) + '" data-link>' + esc(x) + "</a>").join("") + "</p>" : "") +
          '<p class="bib-links"><a href="/games/' + esc(sp.id) + '" data-link>' + esc(t().shopSeite) + '</a><a href="/games/' + esc(sp.id) + '#bewertungen" data-link>' + esc(t().bewertungen) + "</a></p>" +
        "</section>" +
      "</div></div>";
  }

  function zeichnen() {
    const el = seite.el;
    if (!el || !el.isConnected) return;
    const sp = seite.id ? spielVon(seite.id) : null;
    document.title = sp ? t().spielTitel(sp.name) : t().titel;
    const scroll = window.scrollY;
    el.innerHTML = '<div class="bib">' + leiste() + '<div class="bib-haupt">' + (sp ? spielseite(sp) : startseite()) + "</div></div>";
    window.scrollTo(0, scroll);
  }

  // Nur die Listen links neu, damit das Suchfeld beim Tippen den Fokus behaelt.
  function listenZeichnen() {
    const ziel = seite.el && seite.el.querySelector("[data-bib-listen]");
    if (!ziel) return zeichnen();
    const neu = document.createElement("div");
    neu.innerHTML = leiste();
    ziel.replaceWith(neu.querySelector("[data-bib-listen]"));
  }

  async function einbauen(el, sprache, id) {
    Object.assign(seite, { el, sprache, id: id && spielVon(id) ? id : null });
    el.addEventListener("click", (e) => {
      const f = e.target.closest("[data-bib-favorit]");
      if (f) { e.preventDefault(); e.stopPropagation(); UI.favoritSetzen(f.dataset.bibFavorit, !UI.istFavorit(f.dataset.bibFavorit)); return; }
      const a = e.target.closest('a[href^="#bib-"]');
      if (a) { e.preventDefault(); const z = el.querySelector(a.getAttribute("href")); if (z) z.scrollIntoView({ behavior: "smooth", block: "start" }); }
    });
    el.addEventListener("input", (e) => { if (e.target.matches("[data-bib-suche]")) { seite.suche = e.target.value; listenZeichnen(); } });
    el.addEventListener("change", (e) => { if (e.target.matches("[data-bib-sort]")) { seite.sort = e.target.value; zeichnen(); } });
    zeichnen();
    window.scrollTo(0, 0);
    await ID().bereit();
    if (ID().konto() && !UI.stand()) await UI.laden();
    zeichnen();
  }

  // Spielzeit, Favoriten und Erfolge aendern sich, waehrend man hier ist.
  window.addEventListener("miwale-profil", () => {
    if (!seite.el || !seite.el.isConnected || !seite.el.querySelector(".bib")) return;
    if (document.activeElement && document.activeElement.matches && document.activeElement.matches("[data-bib-suche], [data-bib-sort]")) { listenZeichnen(); return; }
    zeichnen();
  });

  const S = (window.MIWALE_PROFIL_SEITEN = window.MIWALE_PROFIL_SEITEN || {});
  S.bibliothek = einbauen;
  S.bibliothekTitel = (sprache) => TEXTE[sprache].titel;
})();
