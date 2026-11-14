// Verwaltung (public/admin/index.html). Eigene Datei statt eingebettetem
// Skript: So darf die Seite eine Content-Security-Policy ohne eingebettete
// Skripte haben (docker/sicherheit-admin.conf).
//
// Anmelden mit Admin-Konto (server/verwaltung.mjs): Name + Passwort, dann der
// 6-stellige Code aus der Authenticator-App. Die Sitzung steckt im HttpOnly-
// Cookie; fetch schickt es same-origin von selbst mit. Hier wird nichts
// Geheimes gespeichert. Alles von Nutzern kommt per textContent ins DOM (el()).
//
// Reiter (Adresse #<reiter>, eine Einreichung direkt: #einreichung/<projektId>):
//   Einreichungen, Spiele, Seite, Admins, Postausgang  -- neu
//   Bewertungen, Game Requests, Konten                  -- wie bisher
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  // Reste der alten Passwort-Anmeldung entfernen.
  try { sessionStorage.removeItem("miwale-admin-passwort"); sessionStorage.removeItem("miwale-admin-reiter"); } catch { /* egal */ }

  // ---------------------------------------------------------------------------
  // Hilfen
  // ---------------------------------------------------------------------------
  function el(tag, attrs = {}, ...kinder) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "on") for (const [ev, fn] of Object.entries(v)) e.addEventListener(ev, fn);
      else if (k === "class") e.className = v;
      else if (k === "value" || k === "checked") e[k] = v;
      else e.setAttribute(k, v === true ? "" : v);
    }
    for (const k of kinder.flat()) if (k != null && k !== false) e.append(k);
    return e;
  }
  const zeitText = (iso) => (iso ? new Date(iso).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" }) : "–");
  const datumText = (iso) => (iso ? new Date(iso).toLocaleDateString("de-DE", { dateStyle: "medium" }) : "–");
  const groesseText = (b) => (typeof b !== "number" ? "–" : b >= 1048576 ? (b / 1048576).toFixed(1).replace(".", ",") + " MB" : Math.max(1, Math.round(b / 1024)) + " KB");
  // Nur eigene Adressen (Medien des Studios, Bilder der Seite) als Bildquelle.
  const eigeneUrl = (u) => typeof u === "string" && u.startsWith("/") && !u.startsWith("//");
  const httpsUrl = (u) => typeof u === "string" && /^https:\/\/[^\s]+$/i.test(u);
  const kopie = (x) => JSON.parse(JSON.stringify(x));

  function bild(src, attrs = {}) {
    return eigeneUrl(src) ? el("img", { src, alt: "", loading: "lazy", decoding: "async", ...attrs }) : el("div", { class: (attrs.class || "") + " leer-bild" }, "kein Bild");
  }
  function externerLink(url, text) {
    return httpsUrl(url) ? el("a", { href: url, target: "_blank", rel: "noopener noreferrer nofollow" }, text || url) : document.createTextNode(url || "–");
  }

  let toastZeit = 0;
  function toast(text, fehler = false) {
    const t = $("toast");
    t.textContent = text;
    t.className = "toast" + (fehler ? " fehler" : "");
    t.hidden = false;
    clearTimeout(toastZeit);
    toastZeit = setTimeout(() => { t.hidden = true; }, fehler ? 7000 : 3500);
  }

  // Fehlercodes der Dienste in Klartext.
  const FEHLER = {
    falsch: "Benutzername oder Passwort stimmt nicht.",
    code: "Der Code stimmt nicht. Nimm den aktuellen Code aus der App und prüfe, ob die Uhrzeit am Handy stimmt.",
    abgelaufen: "Die Anmeldung ist abgelaufen (5 Minuten). Bitte noch einmal mit Name und Passwort.",
    "zu-viele-versuche": "Zu viele Versuche. Bitte einige Minuten warten.",
    "passwort-kurz": "Das Passwort braucht mindestens 10 Zeichen.",
    "name-format": "Benutzername: 3–32 Zeichen, nur a–z, 0–9, Punkt, Minus und Unterstrich.",
    "name-vergeben": "Diesen Benutzernamen gibt es schon.",
    "schon-eingerichtet": "Die Verwaltung ist schon eingerichtet. Melde dich mit deinem Konto an.",
    passwort: "Das alte Verwaltungs-Passwort stimmt nicht.",
    "verwaltung-aus": "Auf dem Server ist kein altes Verwaltungs-Passwort gesetzt (BEWERTUNGEN_ADMIN_PASSWORT).",
    anmelden: "Bitte neu anmelden.",
    email: "Die E-Mail-Adresse ist ungültig.",
    "nur-inhaber": "Das darf nur ein Inhaber.",
    "nicht-selbst": "Du kannst dich nicht selbst entfernen.",
    "zu-viele": "Es gibt schon die Höchstzahl an Admins (20).",
    "nicht-gefunden": "Nicht gefunden.",
    "nicht-eingereicht": "Das Projekt ist gerade nicht eingereicht (vielleicht hat der Entwickler es zurückgezogen).",
    pruefung: "Ungültige Entscheidung.",
    nachricht: "Nachricht oder Notiz ist zu lang (höchstens 4000 Zeichen).",
    grund: "Der Grund ist zu lang (höchstens 1000 Zeichen).",
    banner: "Bannertext ist zu lang (300 Zeichen).",
    "banner-link": "Der Banner-Link muss mit „/“ oder „https://“ beginnen.",
    "max-build": "Max. Build-Größe: ganze Zahl von 10 bis 1024 MB.",
    "max-projekte": "Max. Projekte: ganze Zahl von 1 bis 100.",
    hinweis: "Der Hinweis ist zu lang (500 Zeichen).",
    genres: "Genres: 1 bis 60 Einträge, je höchstens 40 Zeichen.",
    "meldung-an": "Empfänger: bis zu 10 gültige E-Mail-Adressen.",
    spiele: "Ungültige Spiel-Kennungen.",
    "keine-post": "Auf dem Server ist kein Postausgang eingerichtet.",
    "zu-schnell": "Zu schnell hintereinander. Bitte kurz warten.",
    format: "Ungültige Eingabe."
  };
  const fehlerText = (e) => FEHLER[e && e.message] || (e && e.message ? "Fehler: " + e.message : "Unbekannter Fehler.");

  class ApiFehler extends Error {
    constructor(code, status, daten) { super(code); this.status = status; this.daten = daten; }
  }

  // Alle Aufrufe der Schnittstellen. Ohne Authorization-Kopf: das Cookie geht
  // same-origin mit. 401 heisst: Sitzung weg -> zurueck zum Anmelden (ausser
  // bei Aufrufen, die selbst ein Passwort pruefen, z. B. Passwort aendern).
  async function rufen(pfad, { methode = "GET", koerper, basis = "", login401 = true } = {}) {
    let res;
    try {
      res = await fetch(basis + pfad, {
        method: methode,
        credentials: "same-origin",
        cache: "no-store",
        headers: koerper === undefined ? {} : { "content-type": "application/json" },
        body: koerper === undefined ? undefined : JSON.stringify(koerper)
      });
    } catch {
      throw new ApiFehler("Server nicht erreichbar", 0);
    }
    const inhalt = await res.json().catch(() => ({}));
    if (res.status === 401 && login401) {
      zumLogin("Deine Sitzung ist abgelaufen. Bitte neu anmelden.");
      throw new ApiFehler("abgemeldet", 401);
    }
    if (!res.ok) throw new ApiFehler(inhalt.fehler || "Status " + res.status, res.status, inhalt);
    return inhalt;
  }
  const V = "/api/verwaltung/";
  const S = "/api/studio/admin/";

  // Knopf waehrend einer Aktion sperren.
  async function mitKnopf(knopf, fn) {
    if (knopf) knopf.disabled = true;
    try { return await fn(); } finally { if (knopf) knopf.disabled = false; }
  }

  // ---------------------------------------------------------------------------
  // Anmelden
  // ---------------------------------------------------------------------------
  let ich = null;
  let zwischen = null;

  function formZeigen(id) {
    $("laden").hidden = true;
    $("login").hidden = false;
    for (const f of ["einrichten", "anmelden", "code"]) $(f).hidden = f !== id;
    const erstes = $(id).querySelector("input:not([hidden]):not([type=hidden])");
    if (erstes) setTimeout(() => erstes.focus(), 30);
  }
  function fehlerZeigen(id, text) {
    $(id).textContent = text || "";
    $(id).hidden = !text;
  }

  async function start() {
    try {
      const r = await fetch(V + "status", { cache: "no-store", credentials: "same-origin" });
      const s = await r.json();
      if (s.ich) return angemeldet(s.ich);
      zumLogin("", s.eingerichtet ? "anmelden" : "einrichten");
    } catch {
      $("laden").textContent = "Server nicht erreichbar. Bitte später neu laden.";
    }
  }

  function zumLogin(grund, form = "anmelden") {
    ich = null;
    zwischen = null;
    for (const b of document.querySelectorAll(".bereich")) b.hidden = true;
    $("reiter").hidden = true;
    $("abmelden").hidden = true;
    $("ichName").hidden = true;
    $("aPass").value = "";
    $("cCode").value = "";
    fehlerZeigen("aFehler", grund);
    $("aHinweis").hidden = true;
    formZeigen(form);
  }

  function angemeldet(wer) {
    ich = wer;
    zwischen = null;
    $("login").hidden = true;
    $("laden").hidden = true;
    $("reiter").hidden = false;
    $("abmelden").hidden = false;
    $("ichName").hidden = false;
    $("ichName").textContent = wer.name + " · " + (wer.rolle === "inhaber" ? "Inhaber" : "Admin");
    for (const id of ["ePass", "ePass2", "eAlt", "aPass", "cCode"]) $(id).value = "";
    zaehlerLaden();
    route();
  }

  $("einrichten").addEventListener("submit", async (e) => {
    e.preventDefault();
    fehlerZeigen("eFehler", "");
    const name = $("eName").value.trim().toLowerCase();
    if ($("ePass").value !== $("ePass2").value) return fehlerZeigen("eFehler", "Die beiden Passwörter sind nicht gleich.");
    if ($("ePass").value.length < 10) return fehlerZeigen("eFehler", FEHLER["passwort-kurz"]);
    const knopf = e.submitter;
    await mitKnopf(knopf, async () => {
      try {
        await rufen(V + "einrichten", { methode: "POST", login401: false, koerper: { altesPasswort: $("eAlt").value, name, passwort: $("ePass").value, email: $("eEmail").value.trim() } });
        for (const id of ["eAlt", "ePass", "ePass2"]) $(id).value = "";
        zumLogin("", "anmelden");
        $("aName").value = name;
        $("aHinweis").textContent = "Konto angelegt. Melde dich jetzt an und richte dabei den zweiten Faktor ein.";
        $("aHinweis").hidden = false;
        setTimeout(() => $("aPass").focus(), 40);
      } catch (err) {
        if (err.message === "schon-eingerichtet") { zumLogin(FEHLER["schon-eingerichtet"], "anmelden"); return; }
        fehlerZeigen("eFehler", fehlerText(err));
      }
    });
  });

  $("anmelden").addEventListener("submit", async (e) => {
    e.preventDefault();
    fehlerZeigen("aFehler", "");
    $("aHinweis").hidden = true;
    await mitKnopf(e.submitter, async () => {
      try {
        const r = await rufen(V + "anmelden", { methode: "POST", login401: false, koerper: { name: $("aName").value.trim().toLowerCase(), passwort: $("aPass").value } });
        $("aPass").value = "";
        zwischen = r.zwischen;
        codeZeigen(r);
      } catch (err) {
        fehlerZeigen("aFehler", fehlerText(err));
      }
    });
  });

  function codeZeigen(r) {
    const einrichten = r.schritt === "einrichten";
    $("cEinrichten").hidden = !einrichten;
    $("cTitel").textContent = einrichten ? "Zweiten Faktor einrichten" : "Bestätigungscode";
    $("cText").textContent = einrichten ? "Code aus der App nach dem Eintragen:" : "Gib den 6-stelligen Code aus deiner Authenticator-App ein.";
    if (einrichten) {
      const gruppen = String(r.schluessel || "").match(/.{1,4}/g) || [];
      $("cSchluessel").replaceChildren(...gruppen.map((g) => el("span", {}, g)));
      $("cSchluessel").dataset.schluessel = r.schluessel || "";
      $("cKonto").textContent = "miwale:" + $("aName").value.trim().toLowerCase();
      // Nur otpauth:-Links (kommen vom eigenen Server).
      $("cOtpauth").href = /^otpauth:\/\//.test(r.otpauth || "") ? r.otpauth : "#";
    }
    $("cCode").value = "";
    fehlerZeigen("cFehler", "");
    formZeigen("code");
    setTimeout(() => $("cCode").focus(), 40);
  }

  $("cKopieren").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText($("cSchluessel").dataset.schluessel || "");
      toast("Schlüssel kopiert.");
    } catch { toast("Kopieren ging nicht. Bitte abtippen.", true); }
  });

  $("code").addEventListener("submit", async (e) => {
    e.preventDefault();
    fehlerZeigen("cFehler", "");
    const code = $("cCode").value.replace(/\D/g, "");
    if (code.length !== 6) return fehlerZeigen("cFehler", "Der Code hat 6 Ziffern.");
    await mitKnopf(e.submitter, async () => {
      try {
        const r = await rufen(V + "anmelden/code", { methode: "POST", login401: false, koerper: { zwischen, code } });
        angemeldet(r.ich);
      } catch (err) {
        $("cCode").value = "";
        // Zwischen-Token weg: von vorn.
        if (err.message === "abgelaufen" || (err.message === "zu-viele-versuche" && err.status === 429)) { zumLogin(fehlerText(err), "anmelden"); return; }
        fehlerZeigen("cFehler", fehlerText(err));
        $("cCode").focus();
      }
    });
  });
  // Sechs Ziffern eingetippt oder eingefuegt: gleich absenden.
  $("cCode").addEventListener("input", () => {
    if ($("cCode").value.replace(/\D/g, "").length === 6 && !$("code").hidden) $("code").requestSubmit();
  });
  $("cZurueck").addEventListener("click", () => zumLogin("", "anmelden"));

  $("abmelden").addEventListener("click", async () => {
    if (dirtyIrgendwo() && !confirm("Es gibt ungespeicherte Änderungen. Trotzdem abmelden?")) return;
    try { await rufen(V + "abmelden", { methode: "POST", login401: false }); } catch { /* egal */ }
    zustandLeeren();
    zumLogin("", "anmelden");
    $("aHinweis").textContent = "Abgemeldet.";
    $("aHinweis").hidden = false;
  });

  function zustandLeeren() {
    projekte = [];
    spieleZ = null;
    seiteZ = null;
    $("einDetail").replaceChildren();
    $("zaehlerOffen").hidden = true;
  }

  // ---------------------------------------------------------------------------
  // Reiter und Adressen
  // ---------------------------------------------------------------------------
  const REITER = {
    einreichungen: "b-einreichungen", spiele: "b-spiele", seite: "b-seite", admins: "b-admins", postausgang: "b-postausgang",
    bewertungen: "bereich", requests: "ideenBereich", konten: "kontenBereich"
  };
  let aktuell = "";

  function route() {
    if (!ich) return;
    const h = decodeURIComponent(location.hash.slice(1));
    const [teil, arg] = h.split("/");
    let reiter = teil === "einreichung" ? "einreichungen" : teil;
    if (!REITER[reiter]) reiter = "einreichungen";
    for (const [name, id] of Object.entries(REITER)) $(id).hidden = name !== reiter;
    for (const a of document.querySelectorAll("[data-reiter]")) {
      if (a.dataset.reiter === reiter) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    }
    const neu = reiter !== aktuell;
    aktuell = reiter;
    const fehlerAuffangen = (p) => p.catch((e) => { if (e.message !== "abgemeldet") toast(fehlerText(e), true); });
    if (reiter === "einreichungen") fehlerAuffangen(teil === "einreichung" && arg ? detailZeigen(arg) : listeZeigen());
    else if (reiter === "spiele") fehlerAuffangen(spieleZeigen());
    else if (reiter === "seite") fehlerAuffangen(seiteZeigen());
    else if (reiter === "admins") fehlerAuffangen(adminsZeigen());
    else if (reiter === "postausgang") fehlerAuffangen(postZeigen());
    else fehlerAuffangen(altLaden());
    if (neu) window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);

  const dirtyIrgendwo = () => (spieleZ && spieleGeaendert()) || (seiteZ && seiteGeaendert());
  window.addEventListener("beforeunload", (e) => { if (ich && dirtyIrgendwo()) e.preventDefault(); });

  // ---------------------------------------------------------------------------
  // Texte zum Studio (server/studio.mjs)
  // ---------------------------------------------------------------------------
  const STATUS = { entwurf: "Entwurf", eingereicht: "Eingereicht", abgelehnt: "Abgelehnt", freigegeben: "Freigegeben" };
  const FRAGEN = {
    gewalt: "Gewalt", blut: "Blut", horror: "Horror / Schreckmomente", sexuell: "Sexuelle Inhalte", sprache: "Vulgäre Sprache",
    drogen: "Drogen, Alkohol, Tabak", gluecksspiel: "Glücksspiel", mikrotransaktionen: "Käufe im Spiel (Mikrotransaktionen)",
    ki: "KI-erzeugte Inhalte", multiplayer: "Online-Mehrspieler", chat: "Chat mit anderen Spielern", daten: "Sammelt Nutzerdaten"
  };
  const ANTWORTEN = {
    nein: "Nein", ja: "Ja", comic: "Comic-haft", fantasie: "Fantasie", realistisch: "Realistisch", wenig: "Wenig", viel: "Viel",
    leicht: "Leicht", stark: "Stark", andeutungen: "Andeutungen", nacktheit: "Nacktheit", mild: "Mild", grob: "Grob", simuliert: "Simuliert"
  };
  const HINWEISE = {
    "gewalt-comic": "Comic-Gewalt", "gewalt-fantasie": "Fantasie-Gewalt", "gewalt-realistisch": "Realistische Gewalt", blut: "Blut",
    horror: "Horror", "sexuell-andeutungen": "Sexuelle Andeutungen", "sexuell-nacktheit": "Nacktheit", sprache: "Grobe Sprache",
    drogen: "Drogen", gluecksspiel: "Simuliertes Glücksspiel", mikrotransaktionen: "Käufe im Spiel", ki: "KI-Inhalte",
    online: "Online-Mehrspieler", chat: "Chat", daten: "Sammelt Daten"
  };
  const SPRACHEN = {
    de: "Deutsch", en: "Englisch", fr: "Französisch", es: "Spanisch", it: "Italienisch", pt: "Portugiesisch", nl: "Niederländisch",
    pl: "Polnisch", tr: "Türkisch", ru: "Russisch", uk: "Ukrainisch", ja: "Japanisch", ko: "Koreanisch", zh: "Chinesisch",
    ar: "Arabisch", sv: "Schwedisch", da: "Dänisch", no: "Norwegisch", fi: "Finnisch", cs: "Tschechisch"
  };
  const GERAETE = { pc: "PC", handy: "Handy" };
  const EINGABEN = { maus: "Maus", tastatur: "Tastatur", touch: "Touch", gamepad: "Gamepad" };
  const ENGINES = {
    unity: "Unity", godot: "Godot", phaser: "Phaser", three: "three.js", pixi: "PixiJS", construct: "Construct",
    gamemaker: "GameMaker", defold: "Defold", pico8: "PICO-8", html: "HTML/JavaScript ohne Engine", andere: "Andere"
  };
  const FORMATE = { "16:9": "16:9", "4:3": "4:3", "1:1": "1:1", hoch: "Hochformat", frei: "Frei / passt sich an" };
  const BERICHT = {
    "absolute-pfade": "Die index.html lädt Dateien mit absoluten Pfaden („/…“). Unter /vorschau/ und /community/ fehlen die dann.",
    "http-quellen": "Lädt Dateien über http:// – das blockiert der Browser auf https-Seiten.",
    "engine-unity": "Unity-Build erkannt.",
    "engine-godot": "Godot-Build erkannt.",
    threads: "Nutzt SharedArrayBuffer/Threads – braucht besondere Köpfe (COOP/COEP) und läuft evtl. nicht.",
    "kein-viewport": "Kein viewport-Meta-Tag – auf dem Handy evtl. winzig.",
    "index-unlesbar": "Die Startdatei ist nicht lesbar."
  };
  const PRUEFPUNKTE = [
    ["startet", "Spiel startet (Vorschau geöffnet)"],
    ["fehlerfrei", "Läuft ohne Fehler, auch nach ein paar Minuten"],
    ["steuerung", "Steuerung funktioniert wie beschrieben"],
    ["geraete", "Läuft auf den angegebenen Geräten (PC / Handy)"],
    ["inhalte", "Inhalte passen zum Fragebogen und zur Altersempfehlung"],
    ["rechte", "Keine fremden Marken, Figuren oder Assets ohne Rechte"],
    ["texte", "Texte ohne Beleidigungen, Spam oder fremde Werbung"],
    ["bilder", "Bilder und Trailer zeigen wirklich dieses Spiel"],
    ["datenschutz", "Datenschutz plausibel (falls Daten gesammelt werden)"]
  ];

  const liste = (arr, namen) => (Array.isArray(arr) && arr.length ? arr.map((x) => (namen && namen[x]) || x).join(", ") : "–");
  const jaNein = (b) => (b ? "Ja" : "Nein");
  const antwort = (v) => (v == null ? "nicht beantwortet" : ANTWORTEN[v] || v);

  // Felder fuer den Vergleich mit der Live-Version: [Pfad, Name, Art].
  const FELDER = [
    ["name", "Name", "text"], ["kurz", "Kurzbeschreibung", "text"], ["lang", "Beschreibung", "text"], ["genre", "Genre", "text"],
    ["tags", "Tags", "liste"], ["sprachen", "Sprachen", "sprachen"], ["features", "Features", "zeilen"], ["steuerung", "Steuerung", "text"],
    ["geraete", "Geräte", "geraete"], ["entwickler", "Entwickler", "text"], ["webseite", "Webseite", "text"],
    ["medien.icon", "Icon", "bild"], ["medien.header", "Header", "bild"], ["medien.kapsel", "Kapsel", "bild"],
    ["medien.kapselKlein", "Kapsel klein", "bild"], ["medien.kapselHoch", "Kapsel hoch", "bild"],
    ["medien.screens", "Screenshots", "bilder"], ["medien.trailer", "Trailer", "video"],
    ["alter", "Altersempfehlung", "alter"],
    ...Object.entries(FRAGEN).map(([k, n]) => ["inhalt." + k, n, "frage"]),
    ["inhalt.kiText", "KI-Beschreibung", "text"], ["inhalt.hinweise", "Eigene Inhaltshinweise", "text"], ["inhalt.alterEigen", "Eigene Alterseinstufung", "alter"],
    ["inhalt.datenText", "Datenschutzhinweis", "text"], ["inhalt.datenschutzUrl", "Datenschutz-Link", "text"],
    ["rechte.eigene", "Rechte bestätigt", "bool"], ["rechte.lizenzen", "Lizenzen / fremde Inhalte", "text"],
    ["technik.engine", "Engine", "engine"], ["technik.eingabe", "Eingabe", "eingabe"], ["technik.format", "Seitenverhältnis", "format"],
    ["technik.internet", "Braucht Internet", "bool"], ["technik.speichern", "Speichert im Browser", "bool"], ["technik.hinweise", "Technische Hinweise", "text"]
  ];
  const wertVon = (s, pfad) => pfad.split(".").reduce((o, k) => (o == null ? undefined : o[k]), s);
  function wertText(art, v) {
    if (art === "liste") return liste(v);
    if (art === "zeilen") return Array.isArray(v) && v.length ? v.map((x) => "• " + x).join("\n") : "–";
    if (art === "sprachen") return liste(v, SPRACHEN);
    if (art === "geraete") return liste(v, GERAETE);
    if (art === "eingabe") return liste(v, EINGABEN);
    if (art === "engine") return v ? ENGINES[v] || v : "–";
    if (art === "format") return FORMATE[v] || v || "–";
    if (art === "frage") return antwort(v);
    if (art === "bool") return jaNein(v);
    if (art === "alter") return v ? "ab " + v : "ohne Einschränkung";
    return v === "" || v == null ? "–" : String(v);
  }
  function unterschiede(neu, alt) {
    if (!alt) return [];
    return FELDER.filter(([pfad]) => JSON.stringify(wertVon(neu, pfad) ?? null) !== JSON.stringify(wertVon(alt, pfad) ?? null));
  }

  // ---------------------------------------------------------------------------
  // Einreichungen: Liste
  // ---------------------------------------------------------------------------
  let projekte = [];

  async function zaehlerLaden() {
    try { projekte = (await rufen(S + "projekte")).projekte; zaehlerZeigen(); } catch { /* Anzeige egal */ }
  }
  function zaehlerZeigen() {
    const n = projekte.filter((p) => p.status === "eingereicht").length;
    $("zaehlerOffen").textContent = String(n);
    $("zaehlerOffen").hidden = !n;
    $("zaehlerOffen").title = n + (n === 1 ? " offene Einreichung" : " offene Einreichungen");
    document.title = (n ? "(" + n + ") " : "") + "Verwaltung · miwale";
  }

  async function listeZeigen() {
    $("einDetail").hidden = true;
    $("einListe").hidden = false;
    if (!projekte.length) $("einEintraege").replaceChildren(el("p", { class: "klein" }, "Lade …"));
    projekte = (await rufen(S + "projekte")).projekte;
    zaehlerZeigen();
    listeZeichnen();
  }

  function listeZeichnen() {
    const filter = $("einFilter").value;
    const suche = $("einSuche").value.trim().toLowerCase();
    const sortiert = projekte.slice().sort((a, b) => {
      const oa = a.status === "eingereicht" ? 0 : 1, ob = b.status === "eingereicht" ? 0 : 1;
      if (oa !== ob) return oa - ob;
      // Offene: die am laengsten wartende zuerst.
      if (!oa) return String(a.einreichung && a.einreichung.zeit).localeCompare(String(b.einreichung && b.einreichung.zeit));
      return String(b.geaendert || "").localeCompare(String(a.geaendert || ""));
    });
    const sichtbar = sortiert.filter((p) =>
      (!filter || (filter === "live" ? p.live : filter === "gesperrt" ? p.gesperrt : p.status === filter)) &&
      (!suche || (p.name || "").toLowerCase().includes(suche) || (p.besitzer || "").toLowerCase().includes(suche) || (p.slug || "").includes(suche)));
    const offen = projekte.filter((p) => p.status === "eingereicht").length;
    $("einMeldung").textContent = projekte.length + " Projekte · " + offen + (offen === 1 ? " offene Einreichung" : " offene Einreichungen");
    $("einEintraege").replaceChildren(...sichtbar.map((p) => el("a", { class: "projekt" + (p.status === "eingereicht" ? " offen" : ""), href: "#einreichung/" + encodeURIComponent(p.id) },
      bild(p.icon, { class: "projekt__icon" }),
      el("div", {},
        el("div", { class: "projekt__name" }, p.name || "(ohne Namen)"),
        el("div", { class: "klein" }, "von " + (p.besitzer || "gelöschtem Konto") + " · /" + p.slug)),
      el("div", { class: "projekt__rechts" },
        el("div", { class: "zeile" },
          el("span", { class: "stand " + p.status }, STATUS[p.status] || p.status),
          p.status === "eingereicht" ? el("span", { class: "stand" }, p.live ? "Update" : "Neues Spiel") : null,
          p.live ? el("span", { class: "stand live" }, "live") : null,
          p.gesperrt ? el("span", { class: "stand gesperrt" }, "gesperrt") : null),
        el("span", { class: "klein" }, p.status === "eingereicht" && p.einreichung ? "eingereicht " + zeitText(p.einreichung.zeit) : "geändert " + zeitText(p.geaendert))))));
    if (!sichtbar.length) $("einEintraege").append(el("p", { class: "klein" }, projekte.length ? "Nichts gefunden." : "Noch keine Projekte im Studio."));
  }
  $("einFilter").addEventListener("change", listeZeichnen);
  $("einSuche").addEventListener("input", listeZeichnen);

  // ---------------------------------------------------------------------------
  // Einreichungen: Detail
  // ---------------------------------------------------------------------------
  async function detailZeigen(id) {
    $("einListe").hidden = true;
    const ziel = $("einDetail");
    ziel.hidden = false;
    ziel.replaceChildren(el("p", { class: "klein" }, "Lade …"));
    let p;
    try {
      p = await rufen(S + "projekte/" + encodeURIComponent(id));
    } catch (e) {
      if (e.message === "abgemeldet") return;
      ziel.replaceChildren(el("div", { class: "karte" },
        el("p", { class: "fehler" }, e.status === 404 ? "Dieses Projekt gibt es nicht (mehr)." : fehlerText(e)),
        el("a", { href: "#einreichungen", class: "knopf zurueck" }, "← Alle Einreichungen")));
      return;
    }
    detailZeichnen(p);
  }

  function karte(titel, ...inhalt) {
    return el("section", { class: "karte" }, titel ? el("h3", {}, titel) : null, ...inhalt);
  }
  // Definitionsliste; Eintraege: [Name, Wert(Element|Text), Pfad (fuer "geaendert"), auffaellig]
  function felder(eintraege, geaendert) {
    const dl = el("dl", { class: "felder" });
    for (const [name, wert, pfad, auffaellig] of eintraege) {
      dl.append(
        el("dt", {}, name, pfad && geaendert.has(pfad) ? el("span", { class: "geaendert" }, "geändert") : null),
        el("dd", { class: auffaellig ? "auffaellig" : "" }, wert == null || wert === "" ? "–" : wert));
    }
    return dl;
  }
  const marke = (geaendert, pfad) => (geaendert.has(pfad) ? el("span", { class: "geaendert" }, "geändert") : null);
  const absatz = (text) => (text ? el("p", { class: "text" }, text) : el("p", { class: "klein" }, "–"));

  function detailZeichnen(p) {
    const ziel = $("einDetail");
    const s = p.einreichung ? p.einreichung.seite : p.entwurf;
    const live = p.live;
    const diff = p.einreichung && live ? unterschiede(s, live) : [];
    const geaendert = new Set(diff.map((f) => f[0]));
    const buildId = p.einreichung ? p.einreichung.build : p.entwurfBuild;
    const b = p.builds.find((x) => x.id === buildId) || null;
    const offen = p.status === "eingereicht" && !!p.einreichung;
    const m = s.medien;

    // ---- Kopf ----
    const kopf = el("section", { class: "karte" },
      el("div", { class: "zeile zwischen" },
        el("a", { href: "#einreichungen", class: "knopf klein-knopf zurueck" }, "← Alle Einreichungen"),
        el("button", { type: "button", class: "klein-knopf nur-schmal", on: { click: () => { const z = $("einDetail").querySelector(".detail__seite"); if (z) z.scrollIntoView({ behavior: "smooth" }); } } }, offen ? "Zur Entscheidung ↓" : "Zur Prüfung ↓")),
      el("div", { class: "titelzeile" },
        bild(m.icon, { width: "72", height: "72" }),
        el("div", { class: "stapel", style: "gap:6px" },
          el("h1", {}, s.name || "(ohne Namen)"),
          el("div", { class: "zeile" },
            el("span", { class: "stand " + p.status }, STATUS[p.status] || p.status),
            p.einreichung ? el("span", { class: "stand" }, live ? "Update eines veröffentlichten Spiels" : "Neues Spiel") : null,
            live ? el("span", { class: "stand live" }, "live seit " + datumText(p.liveSeit)) : null,
            p.gesperrt ? el("span", { class: "stand gesperrt" }, "gesperrt") : null))),
      felder([
        ["Entwickler-Konto", el("span", {}, (p.besitzer && p.besitzer.name) || "gelöschtes Konto",
          p.besitzer && p.besitzer.email ? el("span", {}, " · ", el("a", { href: "mailto:" + p.besitzer.email }, p.besitzer.email)) : el("span", { class: "klein" }, " · keine bestätigte E-Mail"))],
        ["Adresse", live && !p.gesperrt ? el("a", { href: p.adresse, target: "_blank", rel: "noopener" }, "miwale.com" + p.adresse) : "/games/" + p.slug + " (noch nicht live)"],
        ["Eingereicht", p.einreichung ? zeitText(p.einreichung.zeit) : "–"],
        ["Veröffentlichung", p.veroeffentlichung && p.veroeffentlichung.modus === "datum" ? "am " + datumText(p.veroeffentlichung.datum) + " (bis dahin „Demnächst“)" : "sofort, sobald der Entwickler nach der Freigabe veröffentlicht"],
        ["Angelegt / geändert", datumText(p.erstellt) + " / " + zeitText(p.geaendert)]
      ], geaendert),
      p.einreichung && p.einreichung.notiz ? el("div", { class: "antwort" }, el("div", { class: "klein" }, "Notiz des Entwicklers zur Einreichung"), el("p", { class: "text" }, p.einreichung.notiz)) : null,
      !p.einreichung ? el("p", { class: "hinweis warn" }, "Noch nie eingereicht. Unten steht der aktuelle Entwurf.") :
        !offen ? el("p", { class: "hinweis" }, "Gerade nicht in Prüfung. Unten steht die letzte Einreichung.") : null);

    // ---- Aenderungen gegenueber live ----
    let diffKarte = null;
    if (p.einreichung && live) {
      const neuerBuild = buildId && buildId !== p.liveBuild;
      diffKarte = karte("Änderungen gegenüber der Live-Version",
        el("p", { class: "klein" }, diff.length ? diff.length + (diff.length === 1 ? " Feld geändert." : " Felder geändert.") + " Geänderte Felder sind unten markiert." : "Die Store-Seite ist unverändert."),
        el("p", { class: neuerBuild ? "warn" : "klein" }, neuerBuild ? "Neuer Build (live ist ein anderer)." : "Build unverändert (derselbe wie live)."),
        diff.length ? el("div", { class: "diff" }, ...diff.map(([pfad, name, art]) => diffEintrag(name, art, wertVon(live, pfad), wertVon(s, pfad)))) : null);
    }

    // ---- Store-Seite ----
    const seiteKarte = karte("Store-Seite (Vorschau)",
      el("div", {}, marke(geaendert, "medien.header")),
      eigeneUrl(m.header) ? el("a", { href: m.header, target: "_blank", rel: "noopener" }, bild(m.header, { class: "vorschau-header" })) : el("div", { class: "vorschau-header leer-bild" }, "kein Header"),
      el("h2", {}, s.name || "(ohne Namen)", marke(geaendert, "name")),
      el("p", { class: "text" }, s.kurz || "–", marke(geaendert, "kurz")),
      felder([
        ["Genre", s.genre, "genre"],
        ["Tags", s.tags && s.tags.length ? el("div", { class: "chips" }, ...s.tags.map((t) => el("span", { class: "chip" }, t))) : "–", "tags"],
        ["Sprachen", liste(s.sprachen, SPRACHEN), "sprachen"],
        ["Geräte", liste(s.geraete, GERAETE), "geraete"],
        ["Entwickler", s.entwickler || "– (Kontoname wird gezeigt)", "entwickler"],
        ["Webseite", s.webseite ? externerLink(s.webseite) : "–", "webseite"]
      ], geaendert),
      el("h3", {}, "Beschreibung", marke(geaendert, "lang")),
      absatz(s.lang),
      el("h3", {}, "Features", marke(geaendert, "features")),
      s.features && s.features.length ? el("ul", { style: "margin:0;padding-left:20px" }, ...s.features.map((f) => el("li", {}, f))) : el("p", { class: "klein" }, "–"),
      el("h3", {}, "Steuerung", marke(geaendert, "steuerung")),
      absatz(s.steuerung));

    // ---- Grafiken ----
    const kapsel = (name, pfad, url, groesse) => el("div", { class: "kapsel" + (eigeneUrl(url) ? "" : " leer") },
      el("span", {}, name + " ", el("span", { class: "klein" }, groesse), marke(geaendert, pfad)),
      eigeneUrl(url) ? el("a", { href: url, target: "_blank", rel: "noopener", title: "Groß öffnen" }, bild(url)) : el("span", { class: "platz" }, "fehlt"));
    const grafikKarte = karte("Grafiken",
      el("div", { class: "kapseln" },
        kapsel("Icon", "medien.icon", m.icon, "512×512"),
        kapsel("Kapsel", "medien.kapsel", m.kapsel, "1232×706"),
        kapsel("Kapsel klein", "medien.kapselKlein", m.kapselKlein, "462×174"),
        kapsel("Kapsel hoch", "medien.kapselHoch", m.kapselHoch, "748×896")),
      el("h3", {}, "Screenshots (" + (m.screens || []).length + ")", marke(geaendert, "medien.screens")),
      (m.screens || []).length ? el("div", { class: "galerie" }, ...m.screens.map((u, i) => el("a", { href: u, target: "_blank", rel: "noopener", title: "Screenshot " + (i + 1) + " groß öffnen" }, bild(u)))) : el("p", { class: "klein" }, "Keine Screenshots."),
      el("h3", {}, "Trailer", marke(geaendert, "medien.trailer")),
      eigeneUrl(m.trailer) ? el("video", { class: "trailer", src: m.trailer, controls: true, preload: "metadata", playsinline: true, poster: eigeneUrl((m.screens || [])[0]) ? m.screens[0] : null }) : el("p", { class: "klein" }, "Kein Trailer."));

    // ---- Inhalt und Alter ----
    const i = s.inhalt || {};
    const alter = s.alter || 0;
    const inhaltKarte = karte("Inhalte & Altersempfehlung",
      el("div", { class: "zeile" },
        el("span", { class: "alter a" + alter, "aria-label": "Altersempfehlung ab " + alter }, String(alter)),
        el("div", { class: "stapel", style: "gap:6px" },
          el("span", {}, alter ? "Empfehlung: ab " + alter + " Jahren" : "Empfehlung: ohne Altersbeschränkung", marke(geaendert, "alter")),
          i.alterEigen ? el("span", { class: "klein" }, "Der Entwickler hat selbst „ab " + i.alterEigen + "“ gewählt.") : el("span", { class: "klein" }, "Aus dem Fragebogen berechnet (Selbstauskunft)."),
          (s.hinweiseListe || []).length ? el("div", { class: "chips" }, ...s.hinweiseListe.map((h) => el("span", { class: "chip warn" }, HINWEISE[h] || h))) : el("span", { class: "klein" }, "Keine Inhaltshinweise."))),
      el("h3", {}, "Fragebogen"),
      felder(Object.keys(FRAGEN).map((k) => [FRAGEN[k], antwort(i[k]), "inhalt." + k, i[k] != null && i[k] !== "nein"]), geaendert),
      i.ki === "ja" || i.kiText ? el("div", { class: "stapel", style: "gap:6px" }, el("h3", {}, "Wofür KI genutzt wurde", marke(geaendert, "inhalt.kiText")), absatz(i.kiText)) : null,
      i.hinweise ? el("div", { class: "stapel", style: "gap:6px" }, el("h3", {}, "Eigene Inhaltshinweise", marke(geaendert, "inhalt.hinweise")), absatz(i.hinweise)) : null);

    // ---- Datenschutz und Rechte ----
    const r = s.rechte || {};
    const rechteKarte = karte("Datenschutz & Rechte",
      felder([
        ["Sammelt Nutzerdaten", antwort(i.daten), "inhalt.daten", i.daten === "ja"],
        ["Datenschutz-Link", i.datenschutzUrl ? externerLink(i.datenschutzUrl) : "–", "inhalt.datenschutzUrl"],
        ["Rechte bestätigt", r.eigene ? "Ja, am " + zeitText(r.bestaetigt) : "Nein", "rechte.eigene", !r.eigene]
      ], geaendert),
      el("h3", {}, "Datenschutzhinweis", marke(geaendert, "inhalt.datenText")),
      absatz(i.datenText),
      el("h3", {}, "Lizenzen und fremde Inhalte", marke(geaendert, "rechte.lizenzen")),
      absatz(r.lizenzen));

    // ---- Technik ----
    const t = s.technik || {};
    const technikKarte = karte("Technische Angaben",
      felder([
        ["Engine", wertText("engine", t.engine), "technik.engine"],
        ["Eingabe", liste(t.eingabe, EINGABEN), "technik.eingabe"],
        ["Seitenverhältnis", FORMATE[t.format] || t.format, "technik.format"],
        ["Braucht Internet", jaNein(t.internet), "technik.internet", t.internet],
        ["Speichert im Browser", jaNein(t.speichern), "technik.speichern"],
        ["Hinweise", t.hinweise || "–", "technik.hinweise"]
      ], geaendert));

    // ---- Build ----
    const buildKarte = karte("Build",
      b ? felder([
        ["Hochgeladen", zeitText(b.hochgeladen)],
        ["Größe", groesseText(b.groesse) + " entpackt" + (b.zip ? " · " + groesseText(b.zip) + " ZIP" : "")],
        ["Dateien", String(b.dateien)],
        ["Startdatei", b.start],
        ["Notiz", b.notiz || "–"],
        ["Kennung", el("code", {}, b.id)]
      ], geaendert) : el("p", { class: "fehler" }, "Der eingereichte Build fehlt."),
      b ? el("div", { class: "stapel", style: "gap:6px" },
        el("h3", {}, "Automatische Prüfung"),
        (b.bericht || []).length
          ? el("ul", { class: "bericht" }, ...b.bericht.map((x) => el("li", { class: x.stufe }, (x.stufe === "warnung" ? "Warnung: " : x.stufe === "fehler" ? "Fehler: " : "") + (BERICHT[x.text] || x.text))))
          : el("p", { class: "ok" }, "Keine Auffälligkeiten.")) : null,
      b && b.vorschau && (httpsUrl(b.vorschau) || eigeneUrl(b.vorschau))
        ? el("div", { class: "zeile" },
          el("a", { class: "knopf haupt", href: b.vorschau, target: "_blank", rel: "noopener noreferrer" }, "▶ Spiel testen"),
          el("span", { class: "klein" }, "Öffnet die Vorschau unter " + (httpsUrl(b.vorschau) ? new URL(b.vorschau).host : "dieser Adresse") + " in einem neuen Tab."))
        : null,
      p.builds.length > 1 ? el("details", {},
        el("summary", { class: "klein" }, "Alle Builds (" + p.builds.length + ")"),
        el("ul", { class: "verlauf", style: "margin-top:8px" }, ...p.builds.map((x) => el("li", {},
          el("code", {}, x.id.slice(0, 8)), " · ", zeitText(x.hochgeladen), " · ", groesseText(x.groesse),
          x.id === buildId ? el("span", { class: "stand eingereicht", style: "margin-left:6px" }, "eingereicht") : null,
          x.id === p.liveBuild ? el("span", { class: "stand live", style: "margin-left:6px" }, "live") : null,
          x.notiz ? el("span", { class: "klein" }, " · " + x.notiz) : null)))) : null);

    // ---- Verlauf ----
    const verlaufKarte = karte("Verlauf",
      (p.verlauf || []).length ? el("ul", { class: "verlauf" }, ...p.verlauf.map((v) => el("li", {},
        el("span", { class: "klein" }, zeitText(v.zeit) + " · " + v.wer), " ", el("b", {}, v.aktion),
        v.notiz ? el("div", { class: "notiz" }, v.notiz) : null))) : el("p", { class: "klein" }, "Leer."));

    const links = el("div", { class: "stapel" }, kopf, diffKarte, seiteKarte, grafikKarte, inhaltKarte, rechteKarte, technikKarte, buildKarte, verlaufKarte);
    const rechts = el("aside", { class: "stapel detail__seite" }, pruefKarte(p, offen), sperrKarte(p), loeschKarte(p));
    ziel.replaceChildren(el("div", { class: "detail" }, links, rechts));
  }

  function diffEintrag(name, art, alt, neu) {
    const kopf = el("b", {}, name);
    if (art === "bild") {
      return el("div", { class: "diff__eintrag" }, kopf, el("div", { class: "zeile" },
        alt ? bild(alt, { style: "height:64px;border-radius:8px;opacity:.6" }) : el("span", { class: "klein" }, "vorher: keins"),
        el("span", {}, "→"),
        neu ? bild(neu, { style: "height:64px;border-radius:8px" }) : el("span", { class: "klein" }, "jetzt: keins")));
    }
    if (art === "bilder") {
      const a = alt || [], n = neu || [];
      const neue = n.filter((u) => !a.includes(u));
      return el("div", { class: "diff__eintrag" }, kopf,
        el("span", { class: "klein" }, "vorher " + a.length + ", jetzt " + n.length + " · " + neue.length + " neu · " + a.filter((u) => !n.includes(u)).length + " entfernt" + (neue.length === 0 && a.length === n.length ? " · Reihenfolge geändert" : "")),
        neue.length ? el("div", { class: "zeile" }, ...neue.map((u) => bild(u, { style: "height:54px;border-radius:6px" }))) : null);
    }
    if (art === "video") return el("div", { class: "diff__eintrag" }, kopf, el("span", { class: "klein" }, !alt ? "Trailer neu hinzugefügt" : !neu ? "Trailer entfernt" : "Trailer ersetzt"));
    return el("div", { class: "diff__eintrag" }, kopf,
      el("div", { class: "diff__alt", "aria-label": "vorher" }, wertText(art, alt)),
      el("div", { class: "diff__neu", "aria-label": "jetzt" }, wertText(art, neu)));
  }

  // ---- Pruefung ----
  function pruefKarte(p, offen) {
    const pr = p.pruefung || {};
    const ergebnis = (x) => (x === "ok" ? "in Ordnung" : x === "abgelehnt" ? "abgelehnt" : "offen");
    if (!offen) {
      return karte("Prüfung",
        pr.zeit ? felder([
          ["Zuletzt", zeitText(pr.zeit) + (pr.wer ? " von " + pr.wer : "")],
          ["Store-Seite", ergebnis(pr.seite), null, pr.seite === "abgelehnt"],
          ["Build", ergebnis(pr.build), null, pr.build === "abgelehnt"]
        ], new Set()) : el("p", { class: "klein" }, "Noch nicht geprüft."),
        pr.nachricht ? el("div", { class: "antwort" }, el("div", { class: "klein" }, "Nachricht an den Entwickler"), el("p", { class: "text" }, pr.nachricht)) : null,
        p.pruefNotiz ? el("div", {}, el("div", { class: "klein" }, "Interne Notiz"), el("p", { class: "privat" }, p.pruefNotiz)) : null,
        el("p", { class: "klein" }, p.status === "freigegeben" ? "Freigegeben – der Entwickler kann jetzt veröffentlichen." : p.status === "abgelehnt" ? "Abgelehnt – wartet auf eine neue Einreichung." : "Eine Entscheidung ist erst möglich, wenn das Projekt eingereicht ist."));
    }

    const punkte = pr.punkte || {};
    const haken = PRUEFPUNKTE.map(([k, text]) => {
      const box = el("input", { type: "checkbox", value: k, checked: punkte[k] === true });
      return { k, box, label: el("label", {}, box, el("span", {}, text)) };
    });
    const fortschritt = el("span", { class: "klein" });
    const fortschrittZeigen = () => { fortschritt.textContent = haken.filter((h) => h.box.checked).length + " von " + haken.length + " geprüft"; };
    for (const h of haken) h.box.addEventListener("change", fortschrittZeigen);
    fortschrittZeigen();

    const name = "w" + p.id.slice(0, 8);
    const wahl = (teil, jetzt) => {
      const radios = [["", "offen"], ["ok", "✓ in Ordnung"], ["abgelehnt", "✕ ablehnen"]].map(([wert, text]) => {
        const r = el("input", { type: "radio", name: name + teil, value: wert, checked: (jetzt || "") === wert });
        return el("label", { class: wert === "abgelehnt" ? "nein" : "" }, r, text);
      });
      return el("div", { class: "wahl", role: "radiogroup", "aria-label": teil === "seite" ? "Store-Seite" : "Build" }, ...radios);
    };
    const wahlSeite = wahl("seite", pr.seite), wahlBuild = wahl("build", pr.build);
    const gewaehlt = (w) => { const r = w.querySelector("input:checked"); return r && r.value ? r.value : null; };
    const nachricht = el("textarea", { maxlength: "4000", placeholder: "Was passt, was muss der Entwickler ändern? Er bekommt das per Mail und sieht es im Studio.", value: pr.nachricht || "" });
    const notiz = el("textarea", { maxlength: "4000", placeholder: "Nur für Admins sichtbar.", value: p.pruefNotiz || "" });
    const knopf = el("button", { type: "submit", class: "haupt" }, "Zwischenstand speichern");
    const hinweis = el("p", { class: "klein" });
    const aktualisieren = () => {
      const se = gewaehlt(wahlSeite), bu = gewaehlt(wahlBuild);
      const fertig = se && bu;
      knopf.textContent = !fertig ? "Zwischenstand speichern" : se === "ok" && bu === "ok" ? "Freigeben und Entwickler benachrichtigen" : "Ablehnen und Entwickler benachrichtigen";
      knopf.className = fertig && (se === "abgelehnt" || bu === "abgelehnt") ? "gefahr voll" : "haupt";
      hinweis.textContent = fertig
        ? (se === "ok" && bu === "ok" ? "Danach kann der Entwickler veröffentlichen." : "Der Entwickler muss ändern und neu einreichen.") + " Er bekommt eine Mail."
        : "Solange ein Teil offen ist, bleibt die Einreichung offen und der Entwickler bekommt nichts.";
    };
    for (const r of [wahlSeite, wahlBuild]) r.addEventListener("change", aktualisieren);
    aktualisieren();

    const form = el("form", { class: "karte" },
      el("div", { class: "zeile zwischen" }, el("h3", {}, "Prüf-Checkliste"), fortschritt),
      el("div", { class: "pruefpunkte" }, ...haken.map((h) => h.label)),
      el("h3", {}, "Entscheidung"),
      el("div", { class: "stapel", style: "gap:6px" }, el("span", { class: "klein" }, "Store-Seite"), wahlSeite),
      el("div", { class: "stapel", style: "gap:6px" }, el("span", { class: "klein" }, "Build"), wahlBuild),
      el("label", { class: "feld" }, "Nachricht an den Entwickler", nachricht),
      el("label", { class: "feld" }, "Interne Notiz", notiz),
      pr.zeit ? el("p", { class: "klein" }, "Zwischenstand vom " + zeitText(pr.zeit) + (pr.wer ? " (" + pr.wer + ")" : "")) : null,
      hinweis,
      knopf);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const seite = gewaehlt(wahlSeite), build = gewaehlt(wahlBuild);
      const fertig = seite && build;
      if (fertig && (seite === "abgelehnt" || build === "abgelehnt") && !nachricht.value.trim()) {
        toast("Bitte schreib dem Entwickler, was er ändern soll.", true);
        nachricht.focus();
        return;
      }
      if (fertig && !confirm(seite === "ok" && build === "ok"
        ? "„" + (p.einreichung.seite.name) + "“ freigeben? Der Entwickler bekommt eine Mail und kann veröffentlichen."
        : "„" + (p.einreichung.seite.name) + "“ ablehnen? Der Entwickler bekommt eine Mail mit deiner Nachricht.")) return;
      await mitKnopf(knopf, async () => {
        try {
          const neu = await rufen(S + "projekte/" + p.id + "/pruefung", {
            methode: "POST",
            koerper: { seite, build, nachricht: nachricht.value, notiz: notiz.value, punkte: Object.fromEntries(haken.map((h) => [h.k, h.box.checked])) }
          });
          toast(!fertig ? "Zwischenstand gespeichert." : neu.status === "freigegeben" ? "Freigegeben. Der Entwickler wurde benachrichtigt." : "Abgelehnt. Der Entwickler wurde benachrichtigt.");
          detailZeichnen(neu);
          zaehlerLaden();
        } catch (err) {
          if (err.message !== "abgemeldet") toast(fehlerText(err), true);
        }
      });
    });
    return form;
  }

  function sperrKarte(p) {
    const grund = el("textarea", { maxlength: "1000", placeholder: p.gesperrt ? "Notiz zum Entsperren (optional)" : "Grund (geht per Mail an den Entwickler)" });
    const knopf = el("button", { type: "button", class: p.gesperrt ? "" : "gefahr" }, p.gesperrt ? "Entsperren" : "Projekt sperren");
    knopf.addEventListener("click", async () => {
      const sperren = !p.gesperrt;
      if (sperren && !confirm("„" + (p.entwurf.name || p.slug) + "“ sperren? Es verschwindet sofort von miwale.com und kann nicht mehr eingereicht oder veröffentlicht werden.")) return;
      await mitKnopf(knopf, async () => {
        try {
          const neu = await rufen(S + "projekte/" + p.id + "/sperren", { methode: "POST", koerper: { gesperrt: sperren, grund: grund.value } });
          toast(sperren ? "Gesperrt." : "Entsperrt.");
          detailZeichnen(neu);
          zaehlerLaden();
        } catch (err) { if (err.message !== "abgemeldet") toast(fehlerText(err), true); }
      });
    });
    return karte(p.gesperrt ? "Gesperrt" : "Sperren",
      p.gesperrt ? el("p", { class: "hinweis fehler" }, "Gesperrt am " + zeitText(p.gesperrt.zeit) + (p.gesperrt.wer ? " von " + p.gesperrt.wer : "") + (p.gesperrt.grund ? ". Grund: " + p.gesperrt.grund : ".")) :
        el("p", { class: "klein" }, "Nimmt das Spiel sofort von der Seite und blockiert Einreichen und Veröffentlichen."),
      grund, knopf);
  }

  function loeschKarte(p) {
    const knopf = el("button", { type: "button", class: "gefahr" }, "Projekt löschen");
    knopf.addEventListener("click", async () => {
      if (!confirm("Projekt „" + (p.entwurf.name || p.slug) + "“ endgültig löschen – samt allen Builds, Bildern und der Live-Version? Das lässt sich nicht rückgängig machen.")) return;
      await mitKnopf(knopf, async () => {
        try {
          await rufen(S + "projekte/" + p.id, { methode: "DELETE" });
          toast("Projekt gelöscht.");
          location.hash = "#einreichungen";
        } catch (err) { if (err.message !== "abgemeldet") toast(fehlerText(err), true); }
      });
    });
    return karte("Löschen", el("p", { class: "klein" }, "Nur bei Spam oder klaren Verstößen. Der Entwickler wird nicht benachrichtigt."), knopf);
  }

  // ---------------------------------------------------------------------------
  // Spiele
  // ---------------------------------------------------------------------------
  let spieleZ = null; // { spiele: [...], versteckt: Set, hervor: [], gespeichert: "json" }
  let festeGeladen = null;

  function skriptLaden(src) {
    return new Promise((ok, nein) => {
      const s = document.createElement("script");
      s.src = src;
      s.addEventListener("load", ok);
      s.addEventListener("error", () => nein(new Error(src + " nicht geladen")));
      document.head.append(s);
    });
  }
  const spieleStand = () => JSON.stringify({ v: [...spieleZ.versteckt].sort(), h: spieleZ.hervor });
  const spieleGeaendert = () => spieleZ && spieleStand() !== spieleZ.gespeichert;

  async function spieleZeigen() {
    if (spieleZ && spieleGeaendert()) { spieleZeichnen(); return; }
    $("spieleListe").replaceChildren(el("p", { class: "klein" }, "Lade …"));
    festeGeladen = festeGeladen || skriptLaden("/shop/spiele.js").then(() => skriptLaden("/shop/spiele-auto.js")).catch((e) => { festeGeladen = null; throw e; });
    const [, kat, ein] = await Promise.all([festeGeladen, rufen("/api/studio/katalog"), rufen(V + "einstellungen"), projekte.length ? null : zaehlerLaden()]);
    const feste = (window.MIWALE_SPIELE || []).map((s) => ({
      id: s.id, name: s.name, art: s.auto ? "auto" : "fest", datum: s.veroeffentlicht,
      bild: s.bild ? (/^(https?:)?\/\//.test(s.bild) ? "" : s.bild.startsWith("/") ? s.bild : "/" + s.bild) : ""
    }));
    const zuProjekt = new Map(projekte.map((p) => [p.slug, p.id]));
    const community = (kat.spiele || []).map((s) => ({ id: s.id, name: s.name, art: "community", datum: s.veroeffentlicht, demnaechst: s.demnaechst, bild: s.bild || s.icon, projekt: zuProjekt.get(s.id) }));
    const sp = ein.einstellungen.spiele || { versteckt: [], hervorgehoben: [] };
    spieleZ = { spiele: [...feste, ...community], versteckt: new Set(sp.versteckt), hervor: sp.hervorgehoben.slice(), gespeichert: "" };
    spieleZ.gespeichert = spieleStand();
    spieleZeichnen();
  }

  function spieleZeichnen() {
    const z = spieleZ;
    const nameVon = (id) => { const s = z.spiele.find((x) => x.id === id); return s ? s.name : id + " (nicht gefunden)"; };
    // Hervorgehoben, in Reihenfolge.
    $("hervorZahl").textContent = "(" + z.hervor.length + " von 12)";
    const knopf = (text, titel, fn, aus) => el("button", { type: "button", class: "icon-knopf", title: titel, "aria-label": titel, disabled: aus, on: { click: fn } }, text);
    $("hervorListe").replaceChildren(...z.hervor.map((id, i) => el("li", {},
      el("span", { class: "wachsen" }, nameVon(id), z.versteckt.has(id) ? el("span", { class: "klein warn" }, " · ausgeblendet") : null),
      knopf("↑", "Nach oben", () => { [z.hervor[i - 1], z.hervor[i]] = [z.hervor[i], z.hervor[i - 1]]; spieleZeichnen(); }, i === 0),
      knopf("↓", "Nach unten", () => { [z.hervor[i + 1], z.hervor[i]] = [z.hervor[i], z.hervor[i + 1]]; spieleZeichnen(); }, i === z.hervor.length - 1),
      knopf("✕", "Nicht mehr hervorheben", () => { z.hervor.splice(i, 1); spieleZeichnen(); }))));
    if (!z.hervor.length) $("hervorListe").append(el("li", { class: "klein leer" }, "Keine. Unten bei einem Spiel „Hervorheben“ wählen."));

    const suche = $("spieleSuche").value.trim().toLowerCase();
    const ART = { fest: "Fest", auto: "Automatisch (GitHub)", community: "Community" };
    const sichtbar = z.spiele.filter((s) => !suche || s.name.toLowerCase().includes(suche) || s.id.includes(suche));
    $("spieleListe").replaceChildren(...sichtbar.map((s) => {
      const aus = z.versteckt.has(s.id);
      const box = el("input", { type: "checkbox", checked: !aus });
      box.addEventListener("change", () => { if (box.checked) z.versteckt.delete(s.id); else z.versteckt.add(s.id); spieleZeichnen(); });
      const platz = z.hervor.indexOf(s.id);
      return el("article", { class: "spiel" + (aus ? " aus" : "") },
        bild(s.bild, { class: "spiel__bild" }),
        el("div", {},
          el("div", { class: "spiel__name" }, s.name),
          el("div", { class: "klein" }, ART[s.art] + (s.datum ? " · " + s.datum : "") + (s.demnaechst ? " · demnächst" : "")),
          el("div", { class: "spiel__knoepfe" },
            el("label", { class: "schalter klein" }, box, "sichtbar"),
            platz >= 0
              ? el("button", { type: "button", class: "klein-knopf", on: { click: () => { z.hervor.splice(platz, 1); spieleZeichnen(); } } }, "★ Platz " + (platz + 1))
              : el("button", { type: "button", class: "klein-knopf", disabled: z.hervor.length >= 12, title: z.hervor.length >= 12 ? "Schon 12 hervorgehoben" : null, on: { click: () => { z.hervor.push(s.id); spieleZeichnen(); } } }, "☆ Hervorheben"),
            s.projekt ? el("a", { class: "klein", href: "#einreichung/" + encodeURIComponent(s.projekt) }, "Projekt") : null)));
    }));
    if (!sichtbar.length) $("spieleListe").append(el("p", { class: "klein" }, "Nichts gefunden."));
    const geaendert = spieleGeaendert();
    $("spieleLeiste").classList.toggle("geaendert", geaendert);
    $("spieleStand").textContent = (geaendert ? "Ungespeicherte Änderungen · " : "") + z.spiele.length + " Spiele · " + [...z.versteckt].filter((id) => z.spiele.some((s) => s.id === id)).length + " ausgeblendet";
    $("spieleSpeichern").disabled = !geaendert;
    $("spieleVerwerfen").disabled = !geaendert;
  }
  $("spieleSuche").addEventListener("input", () => spieleZ && spieleZeichnen());
  $("spieleVerwerfen").addEventListener("click", () => { spieleZ = null; spieleZeigen().catch((e) => toast(fehlerText(e), true)); });
  $("spieleSpeichern").addEventListener("click", (e) => mitKnopf(e.currentTarget, async () => {
    try {
      const r = await rufen(V + "einstellungen", { methode: "PUT", koerper: { spiele: { versteckt: [...spieleZ.versteckt], hervorgehoben: spieleZ.hervor } } });
      spieleZ.versteckt = new Set(r.einstellungen.spiele.versteckt);
      spieleZ.hervor = r.einstellungen.spiele.hervorgehoben.slice();
      spieleZ.gespeichert = spieleStand();
      if (seiteZ) seiteZ.gespeichert.spiele = r.einstellungen.spiele;
      toast("Spiele gespeichert.");
    } catch (err) { if (err.message !== "abgemeldet") toast(fehlerText(err), true); }
    spieleZeichnen();
  }));

  // ---------------------------------------------------------------------------
  // Seite (Einstellungen)
  // ---------------------------------------------------------------------------
  let seiteZ = null; // { e: bearbeitete Einstellungen, gespeichert: vom Server, smtp }
  const seiteTeile = (e) => JSON.stringify({ banner: e.banner, studio: e.studio, genres: e.genres, meldungAn: e.meldungAn });
  const seiteGeaendert = () => seiteZ && seiteTeile(seiteZ.e) !== seiteTeile(seiteZ.gespeichert);

  function smtpHinweis(ziel, smtp) {
    ziel.className = "hinweis" + (smtp ? "" : " warn");
    ziel.replaceChildren(smtp
      ? el("span", {}, "SMTP ist eingerichtet. Mails werden verschickt.")
      : el("span", {}, "SMTP ist nicht eingerichtet: Mails landen nur im Postausgang. Auf dem Server in der .env setzen: ",
        ...["SMTP_HOST", "SMTP_PORT", "SMTP_BENUTZER", "SMTP_PASSWORT", "SMTP_ABSENDER"].flatMap((v, i) => [i ? ", " : "", el("code", {}, v)]), "."));
  }

  async function seiteZeigen() {
    if (!seiteZ || !seiteGeaendert()) {
      const r = await rufen(V + "einstellungen");
      seiteZ = { e: kopie(r.einstellungen), gespeichert: kopie(r.einstellungen), smtp: r.smtp };
    }
    seiteFuellen();
  }

  function seiteFuellen() {
    const e = seiteZ.e;
    $("sBannerAn").checked = !!e.banner.an;
    $("sBannerDe").value = e.banner.de || "";
    $("sBannerEn").value = e.banner.en || "";
    $("sBannerLink").value = e.banner.link || "";
    $("sStudioOffen").checked = e.studio.offen !== false;
    $("sMaxBuild").value = e.studio.maxBuildMb;
    $("sMaxProjekte").value = e.studio.maxProjekte;
    $("sHinweisDe").value = e.studio.hinweisDe || "";
    $("sHinweisEn").value = e.studio.hinweisEn || "";
    smtpHinweis($("sSmtp"), seiteZ.smtp);
    seiteListen();
  }

  function seiteListen() {
    const e = seiteZ.e;
    const knopf = (text, titel, fn, aus) => el("button", { type: "button", class: "icon-knopf", title: titel, "aria-label": titel, disabled: aus, on: { click: fn } }, text);
    $("sGenres").replaceChildren(...e.genres.map((g, i) => el("li", {},
      el("span", { class: "wachsen" }, g),
      knopf("↑", "Nach oben", () => { [e.genres[i - 1], e.genres[i]] = [e.genres[i], e.genres[i - 1]]; seiteListen(); }, i === 0),
      knopf("↓", "Nach unten", () => { [e.genres[i + 1], e.genres[i]] = [e.genres[i], e.genres[i + 1]]; seiteListen(); }, i === e.genres.length - 1),
      knopf("✕", "Entfernen", () => { e.genres.splice(i, 1); seiteListen(); }, e.genres.length <= 1))));
    $("sEmpfaenger").replaceChildren(...e.meldungAn.map((a, i) => el("li", {},
      el("span", { class: "wachsen" }, a),
      knopf("✕", "Entfernen", () => { e.meldungAn.splice(i, 1); seiteListen(); }))));
    if (!e.meldungAn.length) $("sEmpfaenger").append(el("li", { class: "klein" }, "Keine – es gehen Mails an die Admins mit E-Mail-Adresse."));
    $("sEmpfaengerDazu").disabled = e.meldungAn.length >= 10;
    seiteStand();
  }

  function seiteStand() {
    const g = seiteGeaendert();
    $("seiteStand").textContent = g ? "Ungespeicherte Änderungen" : "Alles gespeichert";
    $("seiteSpeichern").disabled = !g;
    $("seiteVerwerfen").disabled = !g;
    $("seiteSpeichern").closest(".leiste").classList.toggle("geaendert", g);
  }

  // Eingaben direkt in den Zustand uebernehmen.
  const seiteFeld = (id, fn) => $(id).addEventListener($(id).type === "checkbox" ? "change" : "input", () => { if (seiteZ) { fn(seiteZ.e, $(id)); seiteStand(); } });
  seiteFeld("sBannerAn", (e, x) => { e.banner.an = x.checked; });
  seiteFeld("sBannerDe", (e, x) => { e.banner.de = x.value; });
  seiteFeld("sBannerEn", (e, x) => { e.banner.en = x.value; });
  seiteFeld("sBannerLink", (e, x) => { e.banner.link = x.value.trim(); });
  seiteFeld("sStudioOffen", (e, x) => { e.studio.offen = x.checked; });
  seiteFeld("sMaxBuild", (e, x) => { e.studio.maxBuildMb = Number(x.value); });
  seiteFeld("sMaxProjekte", (e, x) => { e.studio.maxProjekte = Number(x.value); });
  seiteFeld("sHinweisDe", (e, x) => { e.studio.hinweisDe = x.value; });
  seiteFeld("sHinweisEn", (e, x) => { e.studio.hinweisEn = x.value; });

  function genreDazu() {
    const g = $("sGenreNeu").value.trim();
    if (!g || !seiteZ) return;
    if (seiteZ.e.genres.some((x) => x.toLowerCase() === g.toLowerCase())) { toast("Das Genre gibt es schon.", true); return; }
    if (seiteZ.e.genres.length >= 60) { toast("Höchstens 60 Genres.", true); return; }
    seiteZ.e.genres.push(g);
    $("sGenreNeu").value = "";
    seiteListen();
  }
  function empfaengerDazu() {
    const a = $("sEmpfaengerNeu").value.trim();
    if (!a || !seiteZ) return;
    if (!$("sEmpfaengerNeu").checkValidity() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a)) { toast(FEHLER.email, true); return; }
    if (seiteZ.e.meldungAn.includes(a)) { toast("Die Adresse steht schon drin.", true); return; }
    seiteZ.e.meldungAn.push(a);
    $("sEmpfaengerNeu").value = "";
    seiteListen();
  }
  $("sGenreDazu").addEventListener("click", genreDazu);
  $("sGenreNeu").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); genreDazu(); } });
  $("sEmpfaengerDazu").addEventListener("click", empfaengerDazu);
  $("sEmpfaengerNeu").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); empfaengerDazu(); } });

  $("seiteVerwerfen").addEventListener("click", () => { seiteZ.e = kopie(seiteZ.gespeichert); seiteFuellen(); });
  $("seiteSpeichern").addEventListener("click", (ev) => mitKnopf(ev.currentTarget, async () => {
    const e = seiteZ.e;
    try {
      const r = await rufen(V + "einstellungen", { methode: "PUT", koerper: { banner: e.banner, studio: e.studio, genres: e.genres, meldungAn: e.meldungAn } });
      seiteZ.gespeichert = kopie(r.einstellungen);
      seiteZ.e = kopie(r.einstellungen);
      seiteFuellen();
      toast("Einstellungen gespeichert.");
    } catch (err) { if (err.message !== "abgemeldet") toast(fehlerText(err), true); seiteStand(); }
  }));

  const POST_STAND = { gesendet: "Gesendet", fehler: "Fehler", "kein-smtp": "Kein SMTP", "kein-empfaenger": "Kein Empfänger", wartet: "Wartet" };
  $("sTestmail").addEventListener("click", (ev) => mitKnopf(ev.currentTarget, async () => {
    $("sTestErgebnis").textContent = "Sende …";
    try {
      const r = await rufen(V + "testmail", { methode: "POST" });
      const x = r.eintrag || {};
      $("sTestErgebnis").textContent = (POST_STAND[x.stand] || x.stand || "?") + (x.an && x.an.length ? " an " + x.an.join(", ") : "") + (x.fehler ? ": " + x.fehler : "") +
        (x.stand === "kein-empfaenger" ? " – trag oben einen Empfänger oder unter „Admins“ deine E-Mail ein." : "");
      $("sTestErgebnis").className = "klein " + (x.stand === "gesendet" ? "ok" : "fehler");
    } catch (err) {
      $("sTestErgebnis").textContent = err.message === "abgemeldet" ? "" : fehlerText(err);
      $("sTestErgebnis").className = "klein fehler";
    }
  }));

  // ---------------------------------------------------------------------------
  // Admins
  // ---------------------------------------------------------------------------
  function passwortVorschlag() {
    const z = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const r = crypto.getRandomValues(new Uint32Array(16));
    return Array.from(r, (x) => z[x % z.length]).join("").replace(/(.{4})(?!$)/g, "$1-");
  }

  async function adminsZeigen() {
    const r = await rufen(V + "admins");
    const inhaber = r.ich && r.ich.rolle === "inhaber";
    const meins = r.admins.find((a) => r.ich && a.id === r.ich.id);
    $("admNeu").hidden = !inhaber;
    $("eigenPassName").value = meins ? meins.name : "";
    if (meins && document.activeElement !== $("eeEmail")) $("eeEmail").value = meins.email || "";
    $("admMeldung").textContent = r.admins.length + (r.admins.length === 1 ? " Admin" : " Admins") + (inhaber ? "" : " · Admins anlegen und zurücksetzen darf nur ein Inhaber.");
    $("admListe").replaceChildren(...r.admins.map((a) => adminKarte(a, a.id === (r.ich && r.ich.id), inhaber)));
  }

  function adminKarte(a, selbst, inhaber) {
    const aktion = async (knopf, fn, erfolg) => mitKnopf(knopf, async () => {
      try { await fn(); toast(erfolg); await adminsZeigen(); } catch (err) { if (err.message !== "abgemeldet") toast(fehlerText(err), true); }
    });
    let werkzeuge = null;
    if (inhaber) {
      const neuPass = el("input", { type: "text", minlength: "10", maxlength: "200", placeholder: "Neues Passwort (mind. 10)", autocomplete: "off", "aria-label": "Neues Passwort für " + a.name });
      const passKnopf = el("button", { type: "button", class: "klein-knopf" }, "Passwort setzen");
      passKnopf.addEventListener("click", () => {
        if (neuPass.value.length < 10) { toast(FEHLER["passwort-kurz"], true); neuPass.focus(); return; }
        if (!confirm("Passwort von „" + a.name + "“ ersetzen? Alle Sitzungen dieses Admins enden.")) return;
        aktion(passKnopf, () => rufen(V + "admins/" + a.id + "/zuruecksetzen", { methode: "POST", koerper: { passwort: neuPass.value } }), "Passwort von " + a.name + " gesetzt.");
      });
      const faktorKnopf = el("button", { type: "button", class: "klein-knopf" }, "2FA zurücksetzen");
      faktorKnopf.addEventListener("click", () => {
        if (!confirm("Zweiten Faktor von „" + a.name + "“ zurücksetzen? Beim nächsten Anmelden richtet " + a.name + " ihn neu ein. Alle Sitzungen enden.")) return;
        aktion(faktorKnopf, () => rufen(V + "admins/" + a.id + "/zuruecksetzen", { methode: "POST", koerper: { zweiterFaktor: true } }), "2FA von " + a.name + " zurückgesetzt.");
      });
      const weg = el("button", { type: "button", class: "klein-knopf gefahr", disabled: selbst, title: selbst ? "Dich selbst kannst du nicht entfernen" : null }, "Entfernen");
      weg.addEventListener("click", () => {
        if (!confirm("Admin „" + a.name + "“ entfernen?")) return;
        aktion(weg, () => rufen(V + "admins/" + a.id, { methode: "DELETE" }), a.name + " entfernt.");
      });
      werkzeuge = el("details", {},
        el("summary", { class: "klein" }, "Verwalten"),
        el("div", { class: "stapel", style: "gap:10px;margin-top:10px" },
          el("div", { class: "zeile" }, neuPass, el("button", { type: "button", class: "klein-knopf", on: { click: () => { neuPass.value = passwortVorschlag(); } } }, "Vorschlag"), passKnopf),
          el("div", { class: "zeile" }, faktorKnopf, weg)));
    }
    return el("article", { class: "karte admin-karte" },
      el("div", { class: "zeile" },
        el("b", {}, a.name), selbst ? el("span", { class: "klein" }, "(du)") : null,
        el("span", { class: "stand " + (a.rolle === "inhaber" ? "eingereicht" : "") }, a.rolle === "inhaber" ? "Inhaber" : "Admin"),
        el("span", { class: "stand " + (a.zweiterFaktor ? "ok" : "fehler") }, a.zweiterFaktor ? "2FA aktiv" : "2FA noch nicht eingerichtet")),
      el("div", { class: "zeile klein" },
        el("span", {}, a.email || "keine E-Mail"),
        el("span", {}, "angelegt " + datumText(a.erstellt)),
        el("span", {}, "zuletzt angemeldet " + (a.zuletzt ? zeitText(a.zuletzt) : "noch nie"))),
      werkzeuge);
  }

  $("admPassVorschlag").addEventListener("click", () => { $("admPass").value = passwortVorschlag(); });
  $("admNeu").addEventListener("submit", (e) => {
    e.preventDefault();
    mitKnopf(e.submitter, async () => {
      try {
        const name = $("admName").value.trim().toLowerCase();
        await rufen(V + "admins", { methode: "POST", koerper: { name, passwort: $("admPass").value, rolle: $("admRolle").value, email: $("admEmail").value.trim() } });
        toast("Admin " + name + " angelegt. Gib ihm Name und Startpasswort auf sicherem Weg.");
        for (const id of ["admName", "admPass", "admEmail"]) $(id).value = "";
        $("admRolle").value = "admin";
        await adminsZeigen();
      } catch (err) { if (err.message !== "abgemeldet") toast(fehlerText(err), true); }
    });
  });
  $("eigenPass").addEventListener("submit", (e) => {
    e.preventDefault();
    if ($("epNeu").value !== $("epNeu2").value) { toast("Die beiden neuen Passwörter sind nicht gleich.", true); return; }
    mitKnopf(e.submitter, async () => {
      try {
        await rufen(V + "passwort", { methode: "POST", login401: false, koerper: { alt: $("epAlt").value, neu: $("epNeu").value } });
        for (const id of ["epAlt", "epNeu", "epNeu2"]) $(id).value = "";
        toast("Passwort geändert. Andere Sitzungen sind beendet.");
      } catch (err) {
        if (err.status === 401 && err.message === "anmelden") { zumLogin(FEHLER.anmelden); return; }
        toast(err.message === "falsch" ? "Das aktuelle Passwort stimmt nicht." : fehlerText(err), true);
      }
    });
  });
  $("eigenEmail").addEventListener("submit", (e) => {
    e.preventDefault();
    mitKnopf(e.submitter, async () => {
      try {
        await rufen(V + "email", { methode: "PUT", koerper: { email: $("eeEmail").value.trim() } });
        toast("E-Mail gespeichert.");
        await adminsZeigen();
      } catch (err) { if (err.message !== "abgemeldet") toast(fehlerText(err), true); }
    });
  });

  // ---------------------------------------------------------------------------
  // Postausgang
  // ---------------------------------------------------------------------------
  const POST_ART = { einreichung: "Einreichung", entwickler: "An Entwickler", test: "Test", konto: "Konto", mail: "Mail" };
  let post = { ausgang: [], smtp: false };
  async function postZeigen() {
    post = await rufen(V + "postausgang");
    postZeichnen();
  }
  function postZeichnen() {
    smtpHinweis($("postSmtp"), post.smtp);
    const f = $("postFilter").value;
    const sichtbar = post.ausgang.filter((x) => !f || x.stand === f);
    $("postListe").replaceChildren(...sichtbar.map((x) => el("details", { class: "post" },
      el("summary", {},
        el("span", { class: "klein" }, zeitText(x.zeit)),
        el("span", { class: "stand" }, POST_ART[x.art] || x.art),
        el("span", { class: "stand " + x.stand }, POST_STAND[x.stand] || x.stand),
        el("span", { class: "betreff" }, x.betreff || "(ohne Betreff)"),
        el("span", { class: "klein" }, "an " + ((x.an || []).join(", ") || "niemand"))),
      x.fehler ? el("p", { class: "hinweis fehler", style: "margin-top:10px" }, "Fehler: " + x.fehler) : null,
      el("pre", {}, x.text || ""))));
    if (!sichtbar.length) $("postListe").append(el("p", { class: "klein" }, post.ausgang.length ? "Nichts gefunden." : "Noch keine Mails."));
  }
  $("postFilter").addEventListener("change", postZeichnen);

  // ---------------------------------------------------------------------------
  // Bewertungen, Game Requests, Konten (wie bisher, jetzt mit Cookie-Sitzung)
  // ---------------------------------------------------------------------------
  const API = "/api/bewertungen/admin/";
  const IDEEN_API = "/api/ideen/admin/";
  const KONTEN_API = "/api/konto/admin/";
  let daten = { spiele: [], bewertungen: [] };
  let ideen = { ideen: [], staende: [] };
  let konten = { konten: [] };
  const rufenAlt = (pfad, o = {}) => rufen(pfad, { ...o, basis: o.basis || API });

  async function altLaden() {
    const [d, sperr, i, k] = await Promise.all([rufenAlt("alle"), rufenAlt("sperrliste"), rufenAlt("alle", { basis: IDEEN_API }), rufenAlt("alle", { basis: KONTEN_API })]);
    daten = d; ideen = i; konten = k;
    if (document.activeElement !== $("sperrliste")) $("sperrliste").value = sperr.woerter.join("\n");
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
        el("button", { type: "button", on: { click: () => aktion(() => rufenAlt("bewertung/" + b.id + "/antwort", { methode: "PUT", koerper: { text: antwortFeld.value } }), "Antwort gespeichert.") } }, "Antwort speichern"),
        b.text || b.privat ? el("button", { type: "button", class: "gefahr", on: { click: () => confirm("Nur den Text löschen? Der Daumen bleibt.") && aktion(() => rufenAlt("bewertung/" + b.id + "?nur=text", { methode: "DELETE" }), "Text gelöscht.") } }, "Nur Text löschen") : null,
        el("button", { type: "button", class: "gefahr", on: { click: () => confirm("Ganze Bewertung löschen, samt Daumen?") && aktion(() => rufenAlt("bewertung/" + b.id, { methode: "DELETE" }), "Bewertung gelöscht.") } }, "Ganz löschen"),
        b.konto ? sperrKnopf(b.konto, b.name) : null));
  }

  async function aktion(fn, erfolg) {
    try {
      await fn();
      await altLaden();
      meldung(erfolg, false);
    } catch (e) {
      if (e.message !== "abgemeldet") meldung(fehlerText(e), true);
    }
  }

  function meldung(text, fehler) {
    for (const id of ["meldung", "ideenMeldung", "kontenMeldung"]) {
      $(id).textContent = text;
      $(id).className = "klein " + (fehler ? "fehler" : "ok");
    }
    toast(text, fehler);
  }

  // ---- Game Requests ----
  const STAENDE = { neu: "Neu", shortlist: "Shortlist", "in-arbeit": "In Arbeit", fertig: "Fertig", "nicht-gewaehlt": "Nicht gewählt" };
  const GENRES = { action: "Action", puzzle: "Puzzle", idle: "Idle / Clicker", karten: "Kartenspiel", roguelike: "Roguelike", "jump-and-run": "Jump ’n’ Run", strategie: "Strategie / Tower Defense", simulation: "Simulation / Tycoon", rennen: "Rennspiel", horror: "Horror", musik: "Rhythmus / Musik", party: "Party / Mehrspieler", anderes: "Etwas anderes" };
  const PLATTFORMEN = { pc: "PC", handy: "Handy", beides: "PC und Handy" };

  // Bilder noch nicht sichtbarer Ideen liefert der Dienst nur der Verwaltung.
  // Das Sitzungs-Cookie geht bei <img> same-origin mit, also direkt laden.

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

    const bilder = el("div", { class: "bilder" },
      ...i.bilder.filter(eigeneUrl).map((src) => el("a", { href: src, target: "_blank", rel: "noopener", title: "Groß öffnen" }, el("img", { src, alt: "", loading: "lazy" }))));

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
        el("button", { type: "button", class: "haupt", on: { click: () => aktion(() => rufenAlt("idee/" + i.id, { basis: IDEEN_API, methode: "PUT", koerper: { stand: standWahl.value, versteckt: versteckt.checked, bilderFrei: bilderFrei.checked, antwort: antwort.value, link: link.value } }), "#" + i.nummer + " gespeichert.") } }, "Speichern"),
        el("button", { type: "button", class: "gefahr", on: { click: () => confirm("Game Request #" + i.nummer + " samt Bildern löschen?") && aktion(() => rufenAlt("idee/" + i.id, { basis: IDEEN_API, methode: "DELETE" }), "#" + i.nummer + " gelöscht.") } }, "Löschen"),
        i.besitzer && i.besitzer.startsWith("konto:") ? sperrKnopf(i.besitzer.slice(6), i.konto) : null));
  }

  // ---- Konten ----
  function sperrKnopf(id, name) {
    const k = konten.konten.find((x) => x.id === id);
    if (!k) return null;
    return k.gesperrt
      ? el("button", { type: "button", on: { click: () => aktion(() => rufenAlt("konto/" + id, { basis: KONTEN_API, methode: "PUT", koerper: { gesperrt: false } }), (name || "Konto") + " entsperrt.") } }, "Konto entsperren")
      : el("button", { type: "button", class: "gefahr", on: { click: () => confirm("Konto „" + (name || id) + "“ sperren? Es kann dann nichts mehr schreiben.") && aktion(() => rufenAlt("konto/" + id, { basis: KONTEN_API, methode: "PUT", koerper: { gesperrt: true } }), (name || "Konto") + " gesperrt.") } }, "Konto sperren");
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
          el("button", { type: "button", class: "gefahr", on: { click: () => confirm("Konto „" + k.name + "“ löschen, samt " + bew + " Bewertungen und " + ide + " Game Requests? Ist es gesperrt, kann es sich danach nicht neu anmelden.") && aktion(() => rufenAlt("konto/" + k.id, { basis: KONTEN_API, methode: "DELETE" }), k.name + " gelöscht.") } }, "Konto löschen"))));
    }
    if (!sichtbar.length) liste.append(el("p", { class: "klein" }, konten.konten.length ? "Nichts gefunden." : "Noch keine Konten."));
  }

  $("spielFilter").addEventListener("change", zeichnen);
  $("nurText").addEventListener("change", zeichnen);
  $("standFilter").addEventListener("change", ideenZeichnen);
  $("sichtFilter").addEventListener("change", ideenZeichnen);
  $("nurPruefen").addEventListener("change", ideenZeichnen);
  $("kontoSuche").addEventListener("input", kontenZeichnen);
  $("nurGesperrt").addEventListener("change", kontenZeichnen);
  $("sperrlisteSpeichern").addEventListener("click", async () => {
    try {
      const r = await rufenAlt("sperrliste", { methode: "PUT", koerper: { woerter: $("sperrliste").value.split("\n") } });
      $("sperrliste").value = r.woerter.join("\n");
      $("sperrlisteMeldung").textContent = r.woerter.length + " Wörter gespeichert.";
    } catch (e) {
      if (e.message !== "abgemeldet") $("sperrlisteMeldung").textContent = fehlerText(e);
    }
  });

  start();
})();
