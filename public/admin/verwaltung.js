// Verwaltung (public/admin/index.html). Eigene Datei statt eingebettetem
// Skript: So darf die Seite eine Content-Security-Policy ohne eingebettete
// Skripte haben (docker/sicherheit-admin.conf).
(() => {
  const API = "/api/bewertungen/admin/";
  const IDEEN_API = "/api/ideen/admin/";
  const KONTEN_API = "/api/konto/admin/";
  const SCHLUESSEL = "miwale-admin-passwort";
  const $ = (id) => document.getElementById(id);
  let passwort = sessionStorage.getItem(SCHLUESSEL) || "";
  let daten = { spiele: [], bewertungen: [] };
  let ideen = { ideen: [], staende: [] };
  let konten = { konten: [] };

  async function rufen(pfad, { methode = "GET", koerper, basis = API } = {}) {
    const res = await fetch(basis + pfad, {
      method: methode,
      headers: { authorization: "Bearer " + passwort, "content-type": "application/json" },
      body: koerper ? JSON.stringify(koerper) : undefined
    });
    const inhalt = await res.json().catch(() => ({}));
    if (res.status === 401 || res.status === 429 || res.status === 503) {
      abmelden(res.status === 429 ? "Zu viele Versuche. Bitte einige Minuten warten."
        : res.status === 503 ? "Auf dem Server ist kein Passwort gesetzt (BEWERTUNGEN_ADMIN_PASSWORT)."
        : "Falsches Passwort.");
      throw new Error("abgemeldet");
    }
    if (!res.ok) throw new Error(inhalt.fehler || "Fehler " + res.status);
    return inhalt;
  }

  function abmelden(grund) {
    passwort = "";
    sessionStorage.removeItem(SCHLUESSEL);
    $("bereich").hidden = true;
    $("ideenBereich").hidden = true;
    $("kontenBereich").hidden = true;
    $("reiter").hidden = true;
    $("anmelden").hidden = false;
    $("anmeldeFehler").hidden = !grund;
    $("anmeldeFehler").textContent = grund || "";
  }

  async function laden() {
    daten = await rufen("alle");
    const liste = await rufen("sperrliste");
    $("sperrliste").value = liste.woerter.join("\n");
    ideen = await rufen("alle", { basis: IDEEN_API });
    konten = await rufen("alle", { basis: KONTEN_API });
    $("anmelden").hidden = true;
    $("reiter").hidden = false;
    zeigeReiter(sessionStorage.getItem("miwale-admin-reiter") || "bereich");
    const standWahl = $("standFilter");
    const standGewaehlt = standWahl.value;
    standWahl.length = 1;
    for (const s of ideen.staende) standWahl.add(new Option(STAENDE[s] || s, s));
    standWahl.value = standGewaehlt;
    ideenZeichnen();
    kontenZeichnen();
    const auswahl = $("spielFilter");
    const gewaehlt = auswahl.value;
    auswahl.length = 1;
    for (const s of daten.spiele) auswahl.add(new Option(s, s));
    auswahl.value = gewaehlt;
    zeichnen();
  }

  function el(tag, attrs = {}, ...kinder) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "on") for (const [ev, fn] of Object.entries(v)) e.addEventListener(ev, fn);
      else if (k === "class") e.className = v;
      else e.setAttribute(k, v);
    }
    for (const k of kinder) if (k != null) e.append(k);
    return e;
  }

  function zeichnen() {
    const spiel = $("spielFilter").value;
    const nurText = $("nurText").checked;

    // Kennzahlen je Spiel
    const werte = $("werte");
    werte.replaceChildren();
    for (const s of daten.spiele) {
      const eigene = daten.bewertungen.filter((b) => b.spiel === s);
      if (!eigene.length) continue;
      const hoch = eigene.filter((b) => b.daumen === "hoch").length;
      werte.append(el("div", { class: "wert" },
        el("b", {}, s),
        el("span", { class: "klein" }, "👍 " + hoch + " · 👎 " + (eigene.length - hoch) + " · " + Math.round(hoch / eigene.length * 100) + " %")));
    }
    if (!werte.children.length) werte.append(el("p", { class: "klein" }, "Noch keine Bewertungen."));

    const liste = $("liste");
    liste.replaceChildren();
    const sichtbar = daten.bewertungen.filter((b) => (!spiel || b.spiel === spiel) && (!nurText || b.text || b.privat));
    for (const b of sichtbar) liste.append(eintrag(b));
    if (!sichtbar.length) liste.append(el("p", { class: "klein" }, "Nichts gefunden."));
  }

  function eintrag(b) {
    const zeit = new Date(b.zeit).toLocaleString("de-DE");
    const antwortFeld = el("textarea", { placeholder: "Öffentliche Antwort als Entwickler (leer lassen = keine Antwort)", maxlength: "1000" });
    antwortFeld.value = b.antwort ? b.antwort.text : "";

    return el("article", { class: "karte" },
      el("div", { class: "zeile" },
        el("span", { class: "daumen " + b.daumen, "aria-label": b.daumen === "hoch" ? "Daumen hoch" : "Daumen runter" }, b.daumen === "hoch" ? "👍" : "👎"),
        el("b", {}, b.spiel),
        b.konto ? el("span", {}, "von " + (b.name || "gelöschtem Konto")) : el("span", { class: "klein" }, "ohne Konto"),
        el("span", { class: "klein" }, zeit + (b.geaendert ? " · geändert " + new Date(b.geaendert).toLocaleString("de-DE") : "")),
        el("span", { class: "klein", title: "Pruefsumme der Adresse. Gleiche Kennung heisst gleicher Anschluss." }, "Adresse #" + (b.adresse || "?"))),
      b.text ? el("p", { class: "text" }, b.text) : el("p", { class: "klein", style: "margin:0" }, "Kein öffentlicher Text."),
      b.privat ? el("div", {}, el("span", { class: "klein" }, "Privates Feedback"), el("p", { class: "privat" }, b.privat)) : null,
      el("div", { class: "antwort" }, antwortFeld),
      el("div", { class: "zeile" },
        el("button", { type: "button", on: { click: () => aktion(() => rufen("bewertung/" + b.id + "/antwort", { methode: "PUT", koerper: { text: antwortFeld.value } }), "Antwort gespeichert.") } }, "Antwort speichern"),
        b.text || b.privat ? el("button", { type: "button", class: "gefahr", on: { click: () => confirm("Nur den Text löschen? Der Daumen bleibt.") && aktion(() => rufen("bewertung/" + b.id + "?nur=text", { methode: "DELETE" }), "Text gelöscht.") } }, "Nur Text löschen") : null,
        el("button", { type: "button", class: "gefahr", on: { click: () => confirm("Ganze Bewertung löschen, samt Daumen?") && aktion(() => rufen("bewertung/" + b.id, { methode: "DELETE" }), "Bewertung gelöscht.") } }, "Ganz löschen"),
        b.konto ? sperrKnopf(b.konto, b.name) : null));
  }

  async function aktion(fn, erfolg) {
    try {
      await fn();
      await laden();
      meldung(erfolg, false);
    } catch (e) {
      if (e.message !== "abgemeldet") meldung("Fehler: " + e.message, true);
    }
  }

  function meldung(text, fehler) {
    for (const id of ["meldung", "ideenMeldung", "kontenMeldung"]) {
      $(id).textContent = text;
      $(id).className = "klein " + (fehler ? "fehler" : "ok");
    }
  }

  function zeigeReiter(id) {
    for (const b of document.querySelectorAll("[data-reiter]")) {
      const an = b.dataset.reiter === id;
      b.setAttribute("aria-pressed", String(an));
      $(b.dataset.reiter).hidden = !an;
    }
    sessionStorage.setItem("miwale-admin-reiter", id);
  }

  // ---- Game Requests ----
  const STAENDE = { neu: "Neu", shortlist: "Shortlist", "in-arbeit": "In Arbeit", fertig: "Fertig", "nicht-gewaehlt": "Nicht gewählt" };
  const GENRES = { action: "Action", puzzle: "Puzzle", idle: "Idle / Clicker", karten: "Kartenspiel", roguelike: "Roguelike", "jump-and-run": "Jump ’n’ Run", strategie: "Strategie / Tower Defense", simulation: "Simulation / Tycoon", rennen: "Rennspiel", horror: "Horror", musik: "Rhythmus / Musik", party: "Party / Mehrspieler", anderes: "Etwas anderes" };
  const PLATTFORMEN = { pc: "PC", handy: "Handy", beides: "PC und Handy" };

  // Bilder noch nicht sichtbarer Ideen liefert der Dienst nur mit Passwort;
  // ein <img> kann das nicht mitschicken. Also selbst laden, einmal je Bild.
  const bildCache = new Map();
  function bildLaden(src) {
    if (!bildCache.has(src)) {
      bildCache.set(src, fetch(src, { headers: { authorization: "Bearer " + passwort } })
        .then((r) => { if (!r.ok) throw new Error(r.status); return r.blob(); })
        .then((b) => URL.createObjectURL(b))
        .catch(() => { bildCache.delete(src); return ""; }));
    }
    return bildCache.get(src);
  }

  // Oeffentliche Idee mit Bildern, die noch niemand freigegeben hat.
  const bilderOffen = (i) => i.sichtbarkeit === "oeffentlich" && !i.versteckt && i.bilder.length && !i.bilderFrei;

  function ideenZeichnen() {
    const stand = $("standFilter").value;
    const sicht = $("sichtFilter").value;
    const nurPruefen = $("nurPruefen").checked;

    const werte = $("ideenWerte");
    werte.replaceChildren();
    for (const s of ideen.staende) {
      const n = ideen.ideen.filter((i) => i.stand === s).length;
      werte.append(el("div", { class: "wert" }, el("b", {}, STAENDE[s] || s), el("span", { class: "klein" }, n + (n === 1 ? " Idee" : " Ideen"))));
    }
    const offen = ideen.ideen.filter(bilderOffen).length;
    werte.append(el("div", { class: "wert" }, el("b", { class: offen ? "fehler" : "" }, "Bilder zu prüfen"), el("span", { class: "klein" }, offen + (offen === 1 ? " Idee" : " Ideen"))));
    if (ideen.speicherBytes) {
      werte.append(el("div", { class: "wert" }, el("b", {}, "Bilder"),
        el("span", { class: "klein" }, (ideen.belegt / 1048576).toFixed(1) + " von " + Math.round(ideen.speicherBytes / 1048576) + " MB")));
    }

    const liste = $("ideenListe");
    liste.replaceChildren();
    const sichtbar = ideen.ideen.filter((i) => (!stand || i.stand === stand) && (!sicht || i.sichtbarkeit === sicht) && (!nurPruefen || bilderOffen(i)));
    for (const i of sichtbar) liste.append(ideeEintrag(i));
    if (!sichtbar.length) liste.append(el("p", { class: "klein" }, ideen.ideen.length ? "Nichts gefunden." : "Noch keine Game Requests."));
  }

  function ideeEintrag(i) {
    const zeit = new Date(i.zeit).toLocaleString("de-DE");
    const standWahl = el("select", {});
    for (const s of ideen.staende) standWahl.add(new Option(STAENDE[s] || s, s));
    standWahl.value = i.stand;
    const oeff = i.sichtbarkeit === "oeffentlich";
    const versteckt = el("input", { type: "checkbox" });
    versteckt.checked = !!i.versteckt;
    const bilderFrei = el("input", { type: "checkbox" });
    bilderFrei.checked = !!i.bilderFrei;
    const antwort = el("textarea", { placeholder: "Nachricht an den Einsender. Er sieht sie bei seinen Ideen; ist die Idee öffentlich, sehen sie alle.", maxlength: "1000" });
    antwort.value = i.antwort ? i.antwort.text : "";
    const link = el("input", { type: "url", placeholder: "https://… (Video oder Spiel, sobald es fertig ist)", maxlength: "300" });
    link.value = i.link || "";

    const bilder = el("div", { class: "bilder" });
    for (const src of i.bilder) {
      const img = el("img", { alt: "" });
      const a = el("a", { target: "_blank", rel: "noopener", title: "Groß öffnen" }, img);
      bilder.append(a);
      bildLaden(src).then((url) => { if (url) { img.src = url; a.href = url; } });
    }

    const eckdaten = [i.genre ? GENRES[i.genre] || i.genre : "kein Genre", PLATTFORMEN[i.plattform] || i.plattform, zeit].join(" · ");
    return el("article", { class: "karte" },
      el("div", { class: "zeile" },
        el("span", { class: "nr" }, "#" + i.nummer),
        el("b", {}, i.titel),
        el("span", { class: "stand " + i.stand }, STAENDE[i.stand] || i.stand),
        el("span", { class: "klein " + (oeff && !i.versteckt ? "ok" : "") }, oeff ? (i.versteckt ? "öffentlich, aber ausgeblendet" : "öffentlich") : "privat"),
        oeff ? el("span", { class: "klein" }, "▲ " + i.hoch + " · ▼ " + i.runter + " · " + i.punkte + " Punkte") : null),
      el("div", { class: "zeile klein" },
        el("span", {}, eckdaten),
        el("span", {}, "Konto: " + (i.konto || "–")),
        el("span", {}, i.erwaehnen ? "Erwähnen als: " + i.name : "nicht erwähnen" + (i.name ? " (" + i.name + ")" : "")),
        el("span", { class: i.veroeffentlichen ? "ok" : "fehler" }, i.veroeffentlichen ? "Spiel darf auf miwale.com" : "Spiel NICHT auf miwale.com veröffentlichen"),
        el("span", { title: "Zeitpunkt, zu dem der Einsender bestätigt hat, dass Idee und Spiel miwale gehören" }, "Rechte bestätigt " + (i.rechte ? new Date(i.rechte).toLocaleString("de-DE") : "–")),
        el("span", { title: "Pruefsumme der Adresse. Gleiche Kennung heisst gleicher Anschluss." }, "Adresse #" + (i.adresse || "?"))),
      el("p", { class: "text" }, i.beschreibung),
      i.bilder.length ? bilder : null,
      el("div", { class: "zeile" },
        el("label", { class: "feld klein" }, "Stand", standWahl),
        oeff ? el("label", { class: "klein" }, versteckt, " Aus der öffentlichen Liste ausblenden") : null,
        oeff && i.bilder.length ? el("label", { class: "klein" + (bilderOffen(i) ? " fehler" : "") }, bilderFrei, " Bilder öffentlich zeigen (geprüft)") : null),
      el("label", { class: "feld klein" }, "Link zum Video oder Spiel", link),
      el("div", { class: "antwort" }, antwort),
      el("div", { class: "zeile" },
        el("button", { type: "button", class: "haupt", on: { click: () => aktion(() => rufen("idee/" + i.id, { basis: IDEEN_API, methode: "PUT", koerper: { stand: standWahl.value, versteckt: versteckt.checked, bilderFrei: bilderFrei.checked, antwort: antwort.value, link: link.value } }), "#" + i.nummer + " gespeichert.") } }, "Speichern"),
        el("button", { type: "button", class: "gefahr", on: { click: () => confirm("Game Request #" + i.nummer + " samt Bildern löschen?") && aktion(() => rufen("idee/" + i.id, { basis: IDEEN_API, methode: "DELETE" }), "#" + i.nummer + " gelöscht.") } }, "Löschen"),
        i.besitzer && i.besitzer.startsWith("konto:") ? sperrKnopf(i.besitzer.slice(6), i.konto) : null));
  }

  // ---- Konten ----
  function sperrKnopf(id, name) {
    const k = konten.konten.find((x) => x.id === id);
    if (!k) return null;
    return k.gesperrt
      ? el("button", { type: "button", on: { click: () => aktion(() => rufen("konto/" + id, { basis: KONTEN_API, methode: "PUT", koerper: { gesperrt: false } }), (name || "Konto") + " entsperrt.") } }, "Konto entsperren")
      : el("button", { type: "button", class: "gefahr", on: { click: () => confirm("Konto „" + (name || id) + "“ sperren? Es kann dann nichts mehr schreiben.") && aktion(() => rufen("konto/" + id, { basis: KONTEN_API, methode: "PUT", koerper: { gesperrt: true } }), (name || "Konto") + " gesperrt.") } }, "Konto sperren");
  }

  function kontenZeichnen() {
    const suche = $("kontoSuche").value.trim().toLowerCase();
    const nurGesperrt = $("nurGesperrt").checked;
    const werte = $("kontenWerte");
    const gesperrt = konten.konten.filter((k) => k.gesperrt).length;
    werte.replaceChildren(
      el("div", { class: "wert" }, el("b", {}, String(konten.konten.length)), el("span", { class: "klein" }, "Konten")),
      el("div", { class: "wert" }, el("b", {}, String(gesperrt)), el("span", { class: "klein" }, "gesperrt")));

    const liste = $("kontenListe");
    liste.replaceChildren();
    const sichtbar = konten.konten.filter((k) => (!suche || k.name.toLowerCase().includes(suche)) && (!nurGesperrt || k.gesperrt));
    for (const k of sichtbar) {
      const bew = daten.bewertungen.filter((b) => b.konto === k.id).length;
      const ide = ideen.ideen.filter((i) => i.besitzer === "konto:" + k.id).length;
      liste.append(el("article", { class: "karte" },
        el("div", { class: "zeile" },
          el("b", {}, k.name),
          k.gesperrt ? el("span", { class: "stand in-arbeit" }, "gesperrt seit " + new Date(k.gesperrt.zeit).toLocaleDateString("de-DE")) : null,
          el("span", { class: "klein" }, "über " + k.anbieter + " · seit " + new Date(k.erstellt).toLocaleDateString("de-DE") + " · zuletzt " + new Date(k.zuletzt).toLocaleDateString("de-DE")),
          el("span", { class: "klein" }, bew + " Bewertungen · " + ide + " Game Requests")),
        el("div", { class: "zeile" },
          sperrKnopf(k.id, k.name),
          el("button", { type: "button", class: "gefahr", on: { click: () => confirm("Konto „" + k.name + "“ löschen, samt " + bew + " Bewertungen und " + ide + " Game Requests? Ist es gesperrt, kann es sich danach nicht neu anmelden.") && aktion(() => rufen("konto/" + k.id, { basis: KONTEN_API, methode: "DELETE" }), k.name + " gelöscht.") } }, "Konto löschen"))));
    }
    if (!sichtbar.length) liste.append(el("p", { class: "klein" }, konten.konten.length ? "Nichts gefunden." : "Noch keine Konten."));
  }

  $("anmelden").addEventListener("submit", async (e) => {
    e.preventDefault();
    passwort = $("passwort").value;
    try {
      await laden();
      sessionStorage.setItem(SCHLUESSEL, passwort);
      $("passwort").value = "";
    } catch (err) {
      if (err.message !== "abgemeldet") abmelden("Server nicht erreichbar: " + err.message);
    }
  });
  $("abmelden").addEventListener("click", () => abmelden());
  $("neuLaden").addEventListener("click", () => aktion(async () => {}, "Aktualisiert."));
  $("spielFilter").addEventListener("change", zeichnen);
  $("nurText").addEventListener("change", zeichnen);
  $("standFilter").addEventListener("change", ideenZeichnen);
  $("sichtFilter").addEventListener("change", ideenZeichnen);
  $("nurPruefen").addEventListener("change", ideenZeichnen);
  $("kontoSuche").addEventListener("input", kontenZeichnen);
  $("nurGesperrt").addEventListener("change", kontenZeichnen);
  for (const b of document.querySelectorAll("[data-reiter]")) b.addEventListener("click", () => zeigeReiter(b.dataset.reiter));
  $("sperrlisteSpeichern").addEventListener("click", async () => {
    try {
      const r = await rufen("sperrliste", { methode: "PUT", koerper: { woerter: $("sperrliste").value.split("\n") } });
      $("sperrliste").value = r.woerter.join("\n");
      $("sperrlisteMeldung").textContent = r.woerter.length + " Wörter gespeichert.";
    } catch (e) {
      if (e.message !== "abgemeldet") $("sperrlisteMeldung").textContent = "Fehler: " + e.message;
    }
  });

  if (passwort) laden().catch(() => {});
})();
