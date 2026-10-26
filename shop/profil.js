// Profil auf der Spieleseite: Zustand, Bausteine zum Zeichnen und das Zaehlen der
// Spielzeit. Die Seiten (Profil, Bibliothek, Perlen-Shop) stehen in
// profil-seite.js, bibliothek.js und perlenshop.js; sie hangen sich an
// window.MIWALE_PROFIL_SEITEN.
//
// Was hier passiert:
//  - Ist jemand angemeldet, holt diese Datei sein Profil (/api/profil/ich) und
//    meldet einmal am Tag den Besuch (Perlen, Serie).
//  - Waehrend das Spielfenster offen und der Tab sichtbar ist, schickt sie alle
//    30 Sekunden einen Herzschlag. Der Server rechnet die Spielzeit nach,
//    zaehlt also nicht, was hier behauptet wird (server/profil.mjs).
//  - Ein Spiel im Fenster kann Erfolge melden (public/sdk/miwale.js).
//  - Neue Erfolge, Level und Perlen erscheinen als kleine Hinweise unten rechts.
//
// Aendert sich das Profil, gibt es das Ereignis "miwale-profil" auf window.
(() => {
  "use strict";

  const K = window.MIWALE_PROFIL;
  const ID = () => window.MIWALE_IDENTITAET;
  if (!K || !ID()) return;

  const HERZSCHLAG_MS = 30 * 1000;

  const lang = () => (document.documentElement.lang === "de" ? "de" : "en");
  const lokal = (wert, l) => (wert && typeof wert === "object" ? wert[l || lang()] || wert.en || "" : wert || "");
  const esc = (x) => String(x == null ? "" : x).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const TEXTE = {
    en: {
      erfolg: "Achievement unlocked", level: (n) => "Level " + n + "!", perlen: (n) => "+" + n + " " + (n === 1 ? "pearl" : "pearls"),
      besuch: (n, serie) => "Daily visit: +" + n + (serie > 1 ? " · " + serie + " days in a row" : ""),
      anmelden: "Sign in to track playtime and earn pearls", angemeldet: "Tracking your playtime", heute: (n) => n + " min today",
      sekunden: (s) => s < 60 ? s + " s" : s < 3600 ? Math.floor(s / 60) + " min" : (s / 3600).toFixed(s >= 36000 ? 0 : 1) + " h",
      profil: "Profile", perlenSeit: "Pearls",
      favAn: "Add to favorites", favAus: "In favorites",
      spielzeitText: (z) => "Playtime " + z, aufGeraet: "saved on this device", anmeldenBehalten: "Sign in to keep it", uebernommen: (z) => z + " of playtime from this device added to your profile"
    },
    de: {
      erfolg: "Erfolg freigeschaltet", level: (n) => "Level " + n + "!", perlen: (n) => "+" + n + " " + (n === 1 ? "Perle" : "Perlen"),
      besuch: (n, serie) => "Täglicher Besuch: +" + n + (serie > 1 ? " · " + serie + " Tage in Folge" : ""),
      anmelden: "Melde dich an, um Spielzeit zu zählen und Perlen zu sammeln", angemeldet: "Deine Spielzeit wird gezählt", heute: (n) => n + " Min. heute",
      sekunden: (s) => s < 60 ? s + " s" : s < 3600 ? Math.floor(s / 60) + " Min." : (s / 3600).toFixed(s >= 36000 ? 0 : 1).replace(".", ",") + " Std.",
      profil: "Profil", perlenSeit: "Perlen",
      favAn: "Zu Favoriten", favAus: "In Favoriten",
      spielzeitText: (z) => "Spielzeit " + z, aufGeraet: "auf diesem Gerät gespeichert", anmeldenBehalten: "Anmelden, um sie zu behalten", uebernommen: (z) => z + " Spielzeit von diesem Gerät ins Profil übernommen"
    }
  };
  const T = () => TEXTE[lang()];

  // ---- Symbole -----------------------------------------------------------------------
  // 24x24, Linien. Auch die Erfolge und Avatare nutzen sie.
  const PFADE = {
    stern: "M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z",
    blitz: "M13 2 5 13h6l-1 9 8-11h-6z",
    flamme: "M12 3c1 3.5-2 4.5-2 8a2 2 0 0 0 4 0c0-1-.5-1.6-.5-1.6C16 10.5 18 12.5 18 15a6 6 0 0 1-12 0c0-5 4-6.5 6-12z",
    krone: "M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z",
    tropfen: "M12 3c3.5 4.5 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 2.5-6.5 6-11z",
    fisch: "M3 12c3-5 9-6 13-2l5-3v10l-5-3c-4 4-10 3-13-2zM7.5 11.5h.01",
    qualle: "M5 12a7 7 0 0 1 14 0zM8 12v6M12 12v8M16 12v6",
    anker: "M12 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 5.5V21M7.5 10.5h9M4.5 14a7.5 7.5 0 0 0 15 0",
    muschel: "M12 20 4.5 9.5a8.5 8.5 0 0 1 15 0zM12 20 8.5 7M12 20l3.5-13M12 20V6.5",
    seestern: "M12 2l2.5 7H22l-6 4.5 2.3 7.5L12 16.5 5.7 21 8 13.5 2 9h7.5z",
    kristall: "M12 2l7 7-7 13L5 9zM5 9h14M12 2 9 9l3 13 3-13z",
    mond: "M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z",
    herz: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
    uhr: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2",
    buch: "M5 4h13v16H7a2 2 0 0 1-2-2zM9 8h6M9 12h6",
    zahnrad: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1",
    karte: "M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM12 8l3 4-3 4-3-4z",
    flagge: "M5 21V4M5 4h12l-2 4 2 4H5",
    pokal: "M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 21h8M10 17h4",
    schluessel: "M8 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 12h9M18 12v3M21 12v3",
    blase: "M9 9a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM17 5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM16.5 16a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z",
    welle: "M3 10c2-3 4-3 6 0s4 3 6 0 4-3 6 0M3 16c2-3 4-3 6 0s4 3 6 0 4-3 6 0",
    kompass: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15.5 8.5l-2 5-5 2 2-5z",
    schild: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
    perle: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM9 9.5a3 3 0 0 1 3-2"
  };
  function symbol(name, klasse) {
    return '<svg class="' + (klasse || "pf-symbol") + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (PFADE[name] || PFADE.stern) + '"/></svg>';
  }

  // ---- Katalog nachschlagen --------------------------------------------------------
  const ITEMS = new Map(K.items.map((i) => [i.id, i]));
  const ERFOLGE = new Map(K.erfolge.map((e) => [e.id, e]));
  const SPIELE = new Map((window.MIWALE_SPIELE || []).map((s) => [s.id, s]));
  const item = (id) => ITEMS.get(id) || null;
  const erfolg = (id) => ERFOLGE.get(id) || null;
  const spiel = (id) => SPIELE.get(id) || null;
  const waehrung = (menge) => K.waehrung[lang()][menge === 1 ? "eine" : "viele"];

  // ---- Zustand ---------------------------------------------------------------------
  let stand = null;       // eigenes Profil oder null (nicht angemeldet / noch nicht geladen)
  let geladen = false;
  const gemeldet = new Set();

  function ereignis() { window.dispatchEvent(new CustomEvent("miwale-profil", { detail: stand })); }

  async function holen(pfad) {
    const res = await fetch("/api/profil/" + pfad, { headers: { accept: "application/json" }, credentials: "same-origin" });
    return { status: res.status, daten: await res.json().catch(() => ({})) };
  }
  const senden = (pfad, koerper) => ID().senden("/api/profil/" + pfad, "POST", koerper);

  async function laden() {
    if (!ID().konto()) { stand = null; geladen = true; ereignis(); return null; }
    const r = await holen("ich").catch(() => null);
    stand = r && r.status === 200 ? r.daten.profil : null;
    geladen = true;
    ereignis();
    return stand;
  }

  // Antworten des Servers enthalten den neuen Stand der Zahlen und, was neu dazukam.
  function uebernehmen(daten) {
    if (!daten || !stand) return;
    for (const k of ["perlen", "ep", "level", "levelAb", "naechstesLevelAb"]) if (daten[k] !== undefined) stand[k] = daten[k];
    if (daten.inventar) stand.inventar = daten.inventar;
    if (daten.ausruestung) stand.ausruestung = daten.ausruestung;
    if (daten.serie) stand.serie = daten.serie;
    if (daten.neu) {
      const jetzt = new Date().toISOString();
      for (const id of daten.neu.erfolge || []) { stand.erfolge[id] = stand.erfolge[id] || jetzt; hinweisErfolg(id); }
      if (daten.neu.level) hinweisLevel(daten.neu.level);
    }
    ereignis();
  }

  // ---- Hinweise unten rechts ----------------------------------------------------------
  let hinweise = null;
  function hinweisFeld() {
    if (hinweise && hinweise.isConnected) return hinweise;
    hinweise = document.createElement("div");
    hinweise.className = "pf-hinweise";
    hinweise.setAttribute("role", "status");
    hinweise.setAttribute("aria-live", "polite");
    document.body.appendChild(hinweise);
    return hinweise;
  }
  function hinweis(html, klasse) {
    const el = document.createElement("div");
    el.className = "pf-hinweis " + (klasse || "");
    el.innerHTML = html;
    hinweisFeld().appendChild(el);
    requestAnimationFrame(() => el.classList.add("pf-hinweis--da"));
    const weg = () => { el.classList.remove("pf-hinweis--da"); setTimeout(() => el.remove(), 400); };
    setTimeout(weg, 6500);
    el.addEventListener("click", weg);
  }
  function hinweisErfolg(id) {
    const e = erfolg(id);
    if (!e) return;
    hinweis('<span class="pf-erfolgsymbol pf-stufe--' + esc(e.stufe) + '">' + symbol(e.symbol) + "</span>" +
      '<span class="pf-hinweis__text"><small>' + esc(T().erfolg) + "</small><strong>" + esc(lokal(e.name)) + "</strong><em>" + esc(T().perlen(e.perlen)) + "</em></span>", "pf-hinweis--erfolg");
    const k = window.MIWALE_KLANG;
    if (k && k.wisch) k.wisch(1);
  }
  function hinweisLevel(n) {
    hinweis('<span class="pf-erfolgsymbol pf-stufe--gold">' + symbol("schild") + "</span>" +
      '<span class="pf-hinweis__text"><small>' + esc(T().level(n)) + "</small><strong>" + esc(lang() === "de" ? "Aufgestiegen" : "Level up") + "</strong><em>" + esc(T().perlen(K.regeln.levelPerlen * n)) + "</em></span>", "pf-hinweis--level");
  }

  // ---- Besuch (einmal am Tag) ----------------------------------------------------------
  async function besuchMelden() {
    const heute = new Date().toISOString().slice(0, 10);
    try { if (sessionStorage.getItem("miwale-besuch") === heute) return; } catch (e) { /* ohne Speicher eben jedes Mal */ }
    const r = await senden("besuch", {}).catch(() => null);
    if (!r || r.status !== 200) return;
    try { sessionStorage.setItem("miwale-besuch", heute); } catch (e) { /* egal */ }
    uebernehmen(r.daten);
    if (r.daten.perlenErhalten) hinweis('<span class="pf-erfolgsymbol pf-stufe--bronze">' + symbol("perle") + '</span><span class="pf-hinweis__text"><strong>' + esc(T().besuch(r.daten.perlenErhalten, r.daten.serie && r.daten.serie.laenge)) + "</strong></span>", "pf-hinweis--besuch");
  }

  // ---- Spielzeit ------------------------------------------------------------------------
  // Zwei Zaehler. Mit Konto zaehlt der Server: alle 30 Sekunden ein Herzschlag, und
  // er rechnet selbst nach, wie viel Zeit wirklich vergangen ist. Ohne Konto zaehlt
  // der Browser (localStorage, nur auf diesem Geraet). Beim Anmelden wird das ins
  // Profil uebernommen (POST /api/profil/import, auf dem Server gedeckelt).
  // Gezaehlt wird nur, solange das Spielfenster offen und der Tab sichtbar ist.
  const LOKAL = "miwale-spielzeit"; // { spiele: { id: { sek, zuletzt } }, favoriten: [id] }
  const LUECKE_MS = 75 * 1000;      // laengere Pausen (Rechner schlief) zaehlen nicht
  const HB_ABSTAND_MS = 20 * 1000;  // so dicht nimmt der Server Herzschlaege an

  function lokalLesen() {
    try {
      const d = JSON.parse(localStorage.getItem(LOKAL) || "{}");
      return { spiele: d.spiele && typeof d.spiele === "object" && !Array.isArray(d.spiele) ? d.spiele : {}, favoriten: Array.isArray(d.favoriten) ? d.favoriten : [] };
    } catch (e) { return { spiele: {}, favoriten: [] }; }
  }
  function lokalSchreiben(d) { try { localStorage.setItem(LOKAL, JSON.stringify(d)); } catch (e) { /* ohne Speicher eben nicht */ } }
  const lokalHatDaten = () => { const d = lokalLesen(); return Object.keys(d.spiele).length > 0 || d.favoriten.length > 0; };

  let aktiv = null; // { id, timer, tick, sitzung, letzterHb }

  // Zeit seit dem letzten Zaehlen gutschreiben (lokal) und fuer die Anzeige merken.
  function zaehlen(trotzVersteckt) {
    if (!aktiv) return;
    const jetzt = Date.now();
    const abstand = jetzt - aktiv.tick;
    aktiv.tick = jetzt;
    if ((!trotzVersteckt && document.visibilityState !== "visible") || abstand <= 0 || abstand > LUECKE_MS) return;
    const sek = Math.round(abstand / 1000);
    aktiv.sitzung += sek;
    if (!ID().konto()) {
      const d = lokalLesen();
      const s = (d.spiele[aktiv.id] = d.spiele[aktiv.id] || { sek: 0, zuletzt: null });
      s.sek += sek;
      s.zuletzt = new Date(jetzt).toISOString();
      lokalSchreiben(d);
      ereignis();
    }
  }

  async function herzschlag() {
    if (!aktiv || document.visibilityState !== "visible" || !ID().konto()) return;
    const spielId = aktiv.id;
    aktiv.letzterHb = Date.now();
    const r = await senden("spielzeit", { spiel: spielId }).catch(() => null);
    if (!r || r.status !== 200) return;
    if (stand && stand.spiele) {
      const s = (stand.spiele[spielId] = stand.spiele[spielId] || { sek: 0, zuletzt: null });
      s.sek = r.daten.sek;
      s.zuletzt = new Date().toISOString();
      if (stand.heute && r.daten.heute !== undefined) stand.heute.perlen = r.daten.heute;
    }
    uebernehmen(r.daten);
    statusZeichnen();
  }

  function tick() { zaehlen(false); herzschlag(); statusZeichnen(); }

  // Spielzeit eines Spiels: { sek, zuletzt } -- vom Server mit Konto, sonst von diesem Geraet.
  function spielzeit(id) {
    if (ID().konto() && stand) return stand.spiele[id] || { sek: 0, zuletzt: null };
    return lokalLesen().spiele[id] || { sek: 0, zuletzt: null };
  }
  function alleSpielzeiten() {
    return ID().konto() && stand ? stand.spiele : lokalLesen().spiele;
  }

  function statusZeichnen() {
    const el = document.querySelector("[data-pf-spiel]");
    if (!el || !aktiv) return;
    const sek = spielzeit(aktiv.id).sek || 0;
    const zeit = T().spielzeitText(T().sekunden(sek));
    if (!ID().konto()) {
      el.innerHTML = esc(zeit) + ' · <span class="pf-spielstatus__leise">' + esc(T().aufGeraet) + "</span>" +
        (ID().kontenAktiv() ? ' · <a href="/account" data-anmelden>' + esc(T().anmeldenBehalten) + "</a>" : "");
    } else {
      el.textContent = zeit;
    }
  }

  function spielStart(id) {
    if (aktiv && aktiv.id === id) { statusZeichnen(); return; }
    spielEnde();
    aktiv = { id, timer: setInterval(tick, HERZSCHLAG_MS), tick: Date.now(), sitzung: 0, letzterHb: 0 };
    statusZeichnen();
    // Erst wenn feststeht, ob jemand angemeldet ist: sonst ginge der erste Herzschlag verloren.
    ID().bereit().then(() => { if (aktiv && aktiv.id === id) { herzschlag(); statusZeichnen(); } });
  }
  function spielEnde() {
    if (!aktiv) return;
    zaehlen(false);
    // Die letzten Sekunden nicht verschenken: ein letzter Herzschlag, wenn der Server ihn nimmt.
    if (ID().konto() && Date.now() - aktiv.letzterHb >= HB_ABSTAND_MS) herzschlag();
    clearInterval(aktiv.timer);
    aktiv = null;
    ereignis();
  }
  // Versteckt: bis jetzt zaehlen, dann ruht es. Wieder sichtbar: neu ansetzen.
  document.addEventListener("visibilitychange", () => {
    if (!aktiv) return;
    if (document.visibilityState === "hidden") zaehlen(true);
    else { aktiv.tick = Date.now(); herzschlag(); }
  });
  window.addEventListener("pagehide", () => { if (aktiv) zaehlen(false); });

  // Gast-Spielzeit und -Favoriten ins Profil uebernehmen, sobald jemand angemeldet ist.
  async function lokalUebernehmen() {
    if (!stand || !lokalHatDaten()) return;
    const d = lokalLesen();
    const spiele = {};
    for (const [id, s] of Object.entries(d.spiele)) if (s && s.sek > 0) spiele[id] = Math.floor(s.sek);
    // Erst leeren, dann senden: so kann nichts doppelt ankommen. Klappt es nicht, zurueck.
    lokalSchreiben({ spiele: {}, favoriten: [] });
    const r = await senden("import", { spiele, favoriten: d.favoriten }).catch(() => null);
    if (!r || r.status !== 200) { lokalSchreiben(d); return; }
    await laden();
    uebernehmen({ neu: r.daten.neu });
    if (r.daten.uebernommen > 0) hinweis('<span class="pf-erfolgsymbol pf-stufe--silber">' + symbol("uhr") + '</span><span class="pf-hinweis__text"><strong>' + esc(T().uebernommen(T().sekunden(r.daten.uebernommen))) + "</strong></span>");
  }

  // ---- Favoriten ---------------------------------------------------------------------
  function favoriten() { return ID().konto() && stand ? stand.favoriten || [] : lokalLesen().favoriten; }
  const istFavorit = (id) => favoriten().includes(id);
  async function favoritSetzen(id, an) {
    if (ID().konto() && stand) {
      const vorher = (stand.favoriten || []).slice();
      stand.favoriten = vorher.filter((x) => x !== id);
      if (an) stand.favoriten.unshift(id);
      ereignis();
      const r = await senden("favorit", { spiel: id, an }).catch(() => null);
      stand.favoriten = r && r.status === 200 ? r.daten.favoriten : vorher;
      ereignis();
      return;
    }
    const d = lokalLesen();
    d.favoriten = d.favoriten.filter((x) => x !== id);
    if (an) d.favoriten.unshift(id);
    lokalSchreiben(d);
    ereignis();
  }

  // Stern-Knoepfe ausserhalb der Bibliothek (Spielseite im Shop): data-fav-knopf="<id>".
  function favKnoepfe() {
    document.querySelectorAll("[data-fav-knopf]").forEach((b) => {
      const an = istFavorit(b.dataset.favKnopf);
      b.classList.toggle("ist-an", an);
      b.setAttribute("aria-pressed", String(an));
      const text = b.querySelector("span");
      if (text) text.textContent = an ? T().favAus : T().favAn;
    });
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-fav-knopf]");
    if (!b) return;
    e.preventDefault();
    favoritSetzen(b.dataset.favKnopf, !istFavorit(b.dataset.favKnopf));
  });
  window.addEventListener("miwale-profil", favKnoepfe);

  // ---- Erfolge aus dem Spiel (postMessage) ---------------------------------------------
  // Ein Spiel im Fenster schreibt: parent.postMessage({ miwale: 1, typ: "erfolg", id: "..." }, "*").
  // Gehoert hat das nur, was aus dem Rahmen des geoeffneten Spiels kommt.
  window.addEventListener("message", (e) => {
    const d = e.data;
    if (!d || d.miwale !== 1 || !aktiv) return;
    const rahmen = document.querySelector("[data-spielfenster] iframe");
    if (!rahmen || e.source !== rahmen.contentWindow) return;
    if (d.typ === "hallo") {
      try { e.source.postMessage({ miwale: 1, typ: "bereit", angemeldet: !!ID().konto(), spiel: aktiv.id }, e.origin === "null" ? "*" : e.origin); } catch (err) { /* Spiel ist weg */ }
      return;
    }
    if (d.typ !== "erfolg" || typeof d.id !== "string" || d.id.length > 60 || !ID().konto()) return;
    const schluessel = aktiv.id + ":" + d.id;
    if (gemeldet.has(schluessel)) return;
    gemeldet.add(schluessel);
    senden("erfolg", { spiel: aktiv.id, id: d.id }).then((r) => { if (r && r.status === 200) uebernehmen(r.daten); }).catch(() => {});
  });

  // ---- Bausteine zum Zeichnen -----------------------------------------------------------
  // ausruestung: { avatar, rahmen, banner, name, titel, akzent } (Ids aus dem Katalog)
  function farbverlauf(farben, winkel) {
    return "linear-gradient(" + (winkel || 135) + "deg," + (farben || ["#33488C", "#7FE0EE"]).join(",") + ")";
  }

  function avatarInhalt(av) {
    if (!av || av.art === "wal") return '<img src="assets/mascot-whale-light.png" alt="" class="pf-avatar__wal" loading="lazy">';
    if (av.art === "spiel") {
      const s = spiel(av.spiel);
      return s ? '<img src="' + esc(s.bild) + '" alt="" class="pf-avatar__spiel" loading="lazy">' : "";
    }
    return symbol(av.symbol, "pf-avatar__symbol");
  }

  // groesse: "xs" 28, "s" 44, "m" 72, "l" 120
  function avatarHtml(ausr, groesse, name) {
    const a = ausr || {};
    const av = item(a.avatar) || item("av-wal");
    const rf = item(a.rahmen) || item("rf-keiner");
    const hintergrund = av.art === "wal" ? "linear-gradient(135deg,#0F8CA6,#071A29)" : av.art === "spiel" ? "#071A29" : farbverlauf(av.farben);
    const farben = rf.farben || null;
    const rahmen = farben ? farbverlauf(farben) : "transparent";
    const kegel = farben ? "conic-gradient(from 0deg," + farben.concat([farben[0]]).join(",") + ")" : "none";
    return '<span class="pf-avatar pf-avatar--' + (groesse || "m") + (farben ? " pf-avatar--rahmen" : "") + (rf.animiert ? " pf-avatar--animiert" : "") + '" style="--pf-rahmen:' + esc(rahmen) + ";--pf-kegel:" + esc(kegel) + '"' +
      (name ? ' role="img" aria-label="' + esc(name) + '"' : ' aria-hidden="true"') + ">" +
      '<span class="pf-avatar__innen" style="background:' + esc(hintergrund) + '">' + avatarInhalt(av) + "</span></span>";
  }

  // Style fuer ein Banner. Rueckgabe: { klasse, style }.
  function bannerAttr(ausr) {
    const b = item((ausr || {}).banner) || item("bn-tiefsee");
    if (b.art === "spiel") {
      const s = spiel(b.spiel);
      // Absolut: relative Adressen in CSS-Variablen loest der Browser relativ zur CSS-Datei auf.
      const bild = s ? "/" + String(s.medien && s.medien.screens ? s.medien.screens[0] : s.bild).replace(/^[/]+/, "") : "";
      return { klasse: "pf-banner pf-banner--spiel", style: s ? "--pf-bild:url('" + bild + "')" : "" };
    }
    const f = b.farben || ["#0D3A4E", "#071A29"];
    return { klasse: "pf-banner" + (b.animiert ? " pf-banner--animiert" : "") + (b.sterne ? " pf-banner--sterne" : ""), style: "--pf-banner:" + farbverlauf(f, 160) };
  }

  function namenHtml(name, ausr) {
    const n = item((ausr || {}).name) || item("nm-standard");
    const f = n.farben || [];
    let style = "";
    let klasse = "pf-name";
    if (n.verlauf) { klasse += " pf-name--verlauf"; style = "--pf-n1:" + f[0] + ";--pf-n2:" + f[1]; }
    else if (n.schimmer) { klasse += " pf-name--schimmer"; style = "--pf-n1:" + f[0] + ";--pf-n2:" + f[1]; }
    else if (n.leuchten) { klasse += " pf-name--leuchten"; style = "--pf-n1:" + f[0]; }
    else if (f[0]) style = "--pf-n1:" + f[0] + ";color:" + f[0];
    return '<span class="' + klasse + '" style="' + esc(style) + '">' + esc(name) + "</span>";
  }

  const titelText = (ausr) => { const t = item((ausr || {}).titel); return t && t.id !== "ti-keiner" ? lokal(t.name) : ""; };
  const akzent = (ausr) => { const a = item((ausr || {}).akzent); return (a && a.farben && a.farben[0]) || "#7FE0EE"; };

  function perleHtml() { return '<svg class="pf-perle" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="url(#pf-perle-v)"/><ellipse cx="9" cy="8.8" rx="3" ry="2" fill="#fff" opacity=".7"/></svg>'; }

  function erfolgSymbol(e, gesperrt) {
    return '<span class="pf-erfolgsymbol pf-stufe--' + esc(e.stufe) + (gesperrt ? " pf-erfolgsymbol--zu" : "") + '">' + symbol(e.symbol) + "</span>";
  }

  // Fortschritt zum naechsten Level in Prozent
  function levelProzent(p) {
    const von = p.levelAb !== undefined ? p.levelAb : K.levelAb(p.level);
    const bis = p.naechstesLevelAb !== undefined ? p.naechstesLevelAb : K.levelAb(p.level + 1);
    return Math.max(0, Math.min(100, Math.round(((p.ep - von) / Math.max(1, bis - von)) * 100)));
  }

  // ---- Chip in der Kopfzeile: Avatar, Name, Level, Perlen -----------------------------------
  function chipHtml(konto) {
    if (!konto || !stand) return null;
    return '<a class="sp-knopf sp-knopf--glas pf-chip" href="/profile" data-link title="' + esc(T().profil) + '">' +
      avatarHtml(stand.ausruestung, "xs", konto.name) +
      '<span class="pf-chip__text"><span class="pf-chip__name">' + esc(konto.name) + '</span><span class="pf-chip__werte"><span class="pf-chip__level">Lv ' + stand.level + "</span>" + perleHtml() + "<b>" + stand.perlen + "</b></span></span></a>";
  }

  const SELTEN = { gewoehnlich: { en: "Common", de: "Gewöhnlich" }, selten: { en: "Rare", de: "Selten" }, episch: { en: "Epic", de: "Episch" }, legendaer: { en: "Legendary", de: "Legendär" } };

  // Vorschau eines Gegenstands, so wie er am Spieler aussaehe. ausr: was gerade getragen wird.
  function itemVorschau(it, ausr, name) {
    const a = { ...(ausr || {}), [it.slot]: it.id };
    const wer = name || "miwale";
    if (it.slot === "avatar" || it.slot === "rahmen") return '<div class="pf-vorschau pf-vorschau--avatar">' + avatarHtml(a, "m") + "</div>";
    if (it.slot === "banner") { const b = bannerAttr(a); return '<div class="pf-vorschau pf-vorschau--banner"><div class="' + b.klasse + '" style="' + esc(b.style) + '"></div></div>'; }
    if (it.slot === "name") return '<div class="pf-vorschau pf-vorschau--name">' + namenHtml(wer, a) + "</div>";
    if (it.slot === "titel") return '<div class="pf-vorschau pf-vorschau--titel"><span class="pf-name">' + esc(wer) + '</span><span class="pf-titel">' + esc(titelText(a) || lokal(it.name)) + "</span></div>";
    if (it.slot === "akzent") return '<div class="pf-vorschau pf-vorschau--akzent"><span class="pf-farbpunkt" style="background:' + esc(it.farben[0]) + '"></span></div>';
    return "";
  }

  // Farbverlauf der Perle einmal im Dokument, auf den alle Symbole verweisen.
  function defs() {
    if (document.getElementById("pf-defs")) return;
    const d = document.createElement("div");
    d.id = "pf-defs";
    d.setAttribute("aria-hidden", "true");
    d.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    d.innerHTML = '<svg width="0" height="0"><defs><radialGradient id="pf-perle-v" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#BFF1F7"/><stop offset="1" stop-color="#7B8FCB"/></radialGradient></defs></svg>';
    document.body.appendChild(d);
  }
  defs();

  // ---- Start ---------------------------------------------------------------------------
  // undefined: noch nie gelaufen. Laeuft je Konto genau einmal, auch wenn "bereit"
  // und das Ereignis "miwale-konto" gleichzeitig kommen.
  let letzterName;
  async function kontoGeaendert() {
    const k = ID().konto();
    const name = k ? k.name : null;
    if (name === letzterName) return;
    letzterName = name;
    await laden();
    if (stand) { await lokalUebernehmen(); besuchMelden(); }
    statusZeichnen();
  }
  window.addEventListener("miwale-konto", kontoGeaendert);
  ID().bereit().then(kontoGeaendert);

  window.MIWALE_PROFIL_SEITEN = window.MIWALE_PROFIL_SEITEN || {};
  window.MIWALE_PROFIL_UI = {
    katalog: K, item, erfolg, spiel, lang, lokal, esc, T, symbol, waehrung, perleHtml,
    stand: () => stand, geladen: () => geladen, laden, holen, senden, uebernehmen,
    avatarHtml, bannerAttr, namenHtml, titelText, akzent, erfolgSymbol, levelProzent, chipHtml, itemVorschau, SELTEN,
    hinweis, statusZeichnen, spielStart, spielEnde, aktiverSpiel: () => (aktiv ? aktiv.id : null),
    spielzeit, alleSpielzeiten, favoriten, istFavorit, favoritSetzen, favKnoepfe
  };
})();
