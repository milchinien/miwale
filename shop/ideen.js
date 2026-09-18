// Game Requests (miwale.com/requests): Spielideen der Community, fuer das
// Format "I build your game ideas in one day". Der Dienst dahinter ist
// server/ideen.mjs.
//
// Zwei Ansichten:
//   /requests      die oeffentlichen Ideen anderer, zum Hoch- und Runterstimmen,
//                  dazu ein Reiter mit den eigenen (auch privaten) Ideen
//   /requests/new  das Formular fuer eine eigene Idee
//
// Ohne Account: eigene Ideen und Stimmen haengen am Geraet
// (shop/identitaet.js).
//
// Bilder rechnet der Browser vor dem Hochladen klein (hoechstens 1600 px,
// unter 900 KB) und neu. Das entfernt nebenbei Standortdaten aus Handyfotos.
// Jedes Bild geht einzeln hoch, erst beim Absenden.
//
// shop.js legt den leeren Bereich an und ruft danach
// MIWALE_IDEEN.einbauen(element, sprache, { ansicht, zurueck }) auf.
(() => {
  "use strict";

  const API = "/api/ideen/";
  const ENTWURF_SCHLUESSEL = "miwale-ideen-entwurf";
  // Muss zu GRENZEN in server/ideen.mjs passen.
  const G = { titel: 80, titelMin: 3, beschreibung: 3000, beschreibungMin: 20, name: 40, bilder: 4, bildBytes: 900 * 1024 };
  const BILD_KANTE = 1600;
  // Groesser nimmt der Browser beim Verkleinern zu viel Speicher (alte Handys).
  const ROH_MAX = 40 * 1024 * 1024;
  const PRO_SEITE = 20;
  const GENRES = ["action", "puzzle", "idle", "karten", "roguelike", "jump-and-run", "strategie", "simulation", "rennen", "horror", "musik", "party", "anderes"];
  const PLATTFORMEN = ["pc", "handy", "beides"];

  const TEXTE = {
    en: {
      kicker: "New format",
      titel: "You pitch it. I build it in one day.",
      intro: "Vote for the game ideas you want to see built, or pitch your own. I pick ideas from here and from the YouTube comments, build one in a single day and put it on miwale.com.",
      einreichen: "Submit your idea",
      ohneKonto: "No account needed.",
      reiter: { top: "Top", neu: "New", meine: (n) => "Your ideas" + (n ? " (" + n + ")" : "") },
      anzahl: (n) => n === 1 ? "1 idea" : n + " ideas",
      leer: "No ideas yet. Be the first!",
      meineLeer: "You haven't submitted an idea from this device yet.",
      laedt: "Loading ideas…",
      aus: "Game requests are unavailable right now. Please try again later.",
      mehrLaden: "Show more ideas",
      hoch: "Upvote",
      runter: "Downvote",
      punkte: (n) => n + (Math.abs(n) === 1 ? " point" : " points"),
      eigeneIdee: "Your idea",
      eigeneNichtAbstimmen: "You can't vote on your own idea.",
      anonym: "anonymous",
      von: (name) => "by " + name,
      staende: { neu: "", shortlist: "Shortlisted", "in-arbeit": "Building now", fertig: "Built", "nicht-gewaehlt": "Not picked this time" },
      bilderInPruefung: (n) => (n === 1 ? "1 image" : n + " images") + " waiting for review",
      entwickler: "Note from miwale",
      ansehen: "Watch & play",
      mehr: "Show more",
      weniger: "Show less",
      oeffentlich: "Public",
      privat: "Private",
      versteckt: "Hidden by miwale",
      bilderPruefung: "Images visible to others after review",
      machPrivat: "Make private",
      machOeffentlich: "Make public",
      zurueckziehen: "Withdraw",
      zurueckziehenFrage: "Withdraw this idea? Its images and votes will be deleted too.",
      danke: (nr, oeff) => "Thanks! Idea #" + nr + " is in. " + (oeff ? "It's now public — share it so people vote for it!" : "Only miwale can see it."),
      stimmeFehler: "Your vote didn't go through. Please try again.",
      // Formular
      zurueckListe: "All ideas",
      formTitel: "Submit your idea",
      feldTitel: "Game title",
      titelPlatzhalter: "e.g. Tower of Toast",
      feldGenre: "Genre",
      genreLeer: "Pick one (optional)",
      genres: { action: "Action", puzzle: "Puzzle", idle: "Idle / Clicker", karten: "Card game", roguelike: "Roguelike", "jump-and-run": "Platformer", strategie: "Strategy / Tower defense", simulation: "Simulation / Tycoon", rennen: "Racing", horror: "Horror", musik: "Rhythm / Music", party: "Party / Multiplayer", anderes: "Something else" },
      feldPlattform: "Plays on",
      plattformen: { pc: "PC", handy: "Phone", beides: "Both" },
      feldBeschreibung: "Your idea",
      beschreibungPlatzhalter: "What do you do in the game? What's the goal? How do you control it? What makes it fun or special?",
      feldBilder: "Sketches & screenshots",
      bilderHilfe: "Optional, up to 4 images. A photo of a paper sketch works great. Drop them here, paste them or pick them.",
      bilderWaehlen: "Add images",
      bilderZiehen: "or drop them here",
      bildEntfernen: (i) => "Remove image " + i,
      bildBereitet: "Preparing image…",
      keinePersonen: "Please don't upload photos of people or anything personal.",
      feldSichtbarkeit: "Who can see your idea?",
      sichtOeffentlich: "Public",
      sichtOeffentlichHilfe: "Everyone can see your idea and vote on it.",
      sichtPrivat: "Private",
      sichtPrivatHilfe: "Only miwale, the developer, sees it.",
      erwaehnen: "Mention me if miwale builds my idea (in the video and on this site)",
      feldName: "Name or @handle",
      namePlatzhalter: "@yourname",
      veroeffentlichen: "miwale may publish the finished game on miwale.com",
      rechte: "I understand that my idea and any game miwale makes from it belong to miwale, not to me. miwale may use and change them freely, for example in videos.",
      pflicht: "Required",
      senden: "Submit idea",
      sendet: "Sending…",
      bildLaedt: (i, n) => "Uploading image " + i + " of " + n + "…",
      geraetHinweis: "No account needed. Your ideas and votes are saved on this device.",
      fehlerTitel: "Give your game a title (at least 3 characters).",
      fehlerBeschreibung: "Tell me a bit more about your idea (at least 20 characters).",
      fehlerSichtbarkeit: "Choose whether your idea is public or private.",
      fehlerName: "Enter a name or @handle, or untick \"Mention me\".",
      fehlerRechte: "Please confirm that the idea and the game belong to miwale.",
      fehlerBildTyp: "That file isn't an image I can read. JPG, PNG or WebP work.",
      fehlerBildGross: "That image is too big.",
      fehlerBildZuViele: "Up to 4 images per idea.",
      gesperrt: (w) => "Please rephrase: \"" + w.join("\", \"") + "\" isn't allowed here.",
      zuSchnell: "Too many requests at once. Please wait a few minutes.",
      zuVieleOffen: "You already have 10 ideas waiting. Please wait until I've gone through them.",
      speicherVoll: "Image uploads are paused right now. Please submit your idea without images.",
      fehler: "That didn't work. Please try again later.",
      soGehts: "How it works",
      schritte: [
        ["Pitch your idea", "What do you do, what's the goal, what makes it fun? Sketches help a lot."],
        ["The community votes", "Public ideas get up- and downvotes. I read every idea, private ones too."],
        ["Built in one day", "I pick one, build it in a single day and make a video about it."]
      ],
      tippsTitel: "What makes a great idea",
      tipps: [
        "One clear core idea beats a list of ten features.",
        "Say how you play it: mouse, keyboard or touch.",
        "Name games that feel similar.",
        "Small enough to build in one day, big enough to be fun."
      ]
    },
    de: {
      kicker: "Neues Format",
      titel: "Du hast die Idee. Ich baue das Spiel an einem Tag.",
      intro: "Stimm für die Spielideen ab, die du gebaut sehen willst, oder reich deine eigene ein. Ich suche Ideen von hier und aus den YouTube-Kommentaren aus, baue eine an einem einzigen Tag und stelle sie auf miwale.com.",
      einreichen: "Eigene Idee einreichen",
      ohneKonto: "Ohne Account.",
      reiter: { top: "Top", neu: "Neu", meine: (n) => "Deine Ideen" + (n ? " (" + n + ")" : "") },
      anzahl: (n) => n === 1 ? "1 Idee" : n + " Ideen",
      leer: "Noch keine Ideen. Sei die erste Stimme!",
      meineLeer: "Von diesem Gerät kam noch keine Idee.",
      laedt: "Ideen werden geladen …",
      aus: "Game Requests sind gerade nicht erreichbar. Bitte später noch einmal versuchen.",
      mehrLaden: "Weitere Ideen anzeigen",
      hoch: "Dafür stimmen",
      runter: "Dagegen stimmen",
      punkte: (n) => n + (Math.abs(n) === 1 ? " Punkt" : " Punkte"),
      eigeneIdee: "Deine Idee",
      eigeneNichtAbstimmen: "Für die eigene Idee kannst du nicht abstimmen.",
      anonym: "anonym",
      von: (name) => "von " + name,
      staende: { neu: "", shortlist: "In der engeren Wahl", "in-arbeit": "Wird gebaut", fertig: "Fertig", "nicht-gewaehlt": "Diesmal nicht gewählt" },
      bilderInPruefung: (n) => (n === 1 ? "1 Bild wartet" : n + " Bilder warten") + " auf Prüfung",
      entwickler: "Nachricht von miwale",
      ansehen: "Ansehen & spielen",
      mehr: "Mehr anzeigen",
      weniger: "Weniger anzeigen",
      oeffentlich: "Öffentlich",
      privat: "Privat",
      versteckt: "Von miwale ausgeblendet",
      bilderPruefung: "Bilder sehen andere erst nach Prüfung",
      machPrivat: "Privat machen",
      machOeffentlich: "Öffentlich machen",
      zurueckziehen: "Zurückziehen",
      zurueckziehenFrage: "Diese Idee zurückziehen? Bilder und Stimmen werden auch gelöscht.",
      danke: (nr, oeff) => "Danke! Idee #" + nr + " ist angekommen. " + (oeff ? "Sie ist jetzt öffentlich – teil sie, damit Leute dafür stimmen!" : "Nur miwale kann sie sehen."),
      stimmeFehler: "Deine Stimme kam nicht an. Bitte noch einmal versuchen.",
      zurueckListe: "Alle Ideen",
      formTitel: "Eigene Idee einreichen",
      feldTitel: "Name des Spiels",
      titelPlatzhalter: "z. B. Tower of Toast",
      feldGenre: "Genre",
      genreLeer: "Auswählen (freiwillig)",
      genres: { action: "Action", puzzle: "Puzzle", idle: "Idle / Clicker", karten: "Kartenspiel", roguelike: "Roguelike", "jump-and-run": "Jump ’n’ Run", strategie: "Strategie / Tower Defense", simulation: "Simulation / Tycoon", rennen: "Rennspiel", horror: "Horror", musik: "Rhythmus / Musik", party: "Party / Mehrspieler", anderes: "Etwas anderes" },
      feldPlattform: "Spielbar auf",
      plattformen: { pc: "PC", handy: "Handy", beides: "Beides" },
      feldBeschreibung: "Deine Idee",
      beschreibungPlatzhalter: "Was machst du im Spiel? Was ist das Ziel? Wie steuert man es? Was macht es besonders?",
      feldBilder: "Skizzen & Screenshots",
      bilderHilfe: "Freiwillig, bis zu 4 Bilder. Ein Foto einer Skizze auf Papier ist perfekt. Hierher ziehen, einfügen oder auswählen.",
      bilderWaehlen: "Bilder hinzufügen",
      bilderZiehen: "oder hierher ziehen",
      bildEntfernen: (i) => "Bild " + i + " entfernen",
      bildBereitet: "Bild wird vorbereitet …",
      keinePersonen: "Bitte keine Fotos von Personen oder etwas Persönliches hochladen.",
      feldSichtbarkeit: "Wer darf deine Idee sehen?",
      sichtOeffentlich: "Öffentlich",
      sichtOeffentlichHilfe: "Alle sehen deine Idee und können abstimmen.",
      sichtPrivat: "Privat",
      sichtPrivatHilfe: "Nur miwale, der Entwickler, sieht sie.",
      erwaehnen: "Erwähne mich, wenn miwale meine Idee baut (im Video und auf dieser Seite)",
      feldName: "Name oder @Handle",
      namePlatzhalter: "@deinname",
      veroeffentlichen: "miwale darf das fertige Spiel auf miwale.com veröffentlichen",
      rechte: "Ich verstehe, dass meine Idee und jedes Spiel, das miwale daraus macht, miwale gehören und nicht mir. miwale darf sie frei nutzen und verändern, zum Beispiel in Videos.",
      pflicht: "Pflicht",
      senden: "Idee einreichen",
      sendet: "Wird gesendet …",
      bildLaedt: (i, n) => "Bild " + i + " von " + n + " wird hochgeladen …",
      geraetHinweis: "Ohne Account. Deine Ideen und Stimmen sind auf diesem Gerät gespeichert.",
      fehlerTitel: "Gib deinem Spiel einen Namen (mindestens 3 Zeichen).",
      fehlerBeschreibung: "Erzähl mir etwas mehr über deine Idee (mindestens 20 Zeichen).",
      fehlerSichtbarkeit: "Wähle, ob deine Idee öffentlich oder privat sein soll.",
      fehlerName: "Gib einen Namen oder @Handle an oder nimm den Haken bei „Erwähne mich“ raus.",
      fehlerRechte: "Bitte bestätige, dass Idee und Spiel miwale gehören.",
      fehlerBildTyp: "Diese Datei kann ich nicht als Bild lesen. JPG, PNG oder WebP gehen.",
      fehlerBildGross: "Das Bild ist zu groß.",
      fehlerBildZuViele: "Höchstens 4 Bilder pro Idee.",
      gesperrt: (w) => "Bitte anders formulieren: „" + w.join("“, „") + "“ ist hier nicht erlaubt.",
      zuSchnell: "Zu viele Anfragen auf einmal. Bitte ein paar Minuten warten.",
      zuVieleOffen: "Du hast schon 10 Ideen, die auf mich warten. Bitte warte, bis ich sie durchgesehen habe.",
      speicherVoll: "Bilder können gerade nicht hochgeladen werden. Bitte reich deine Idee ohne Bilder ein.",
      fehler: "Das hat nicht geklappt. Bitte später noch einmal versuchen.",
      soGehts: "So läuft's",
      schritte: [
        ["Idee einreichen", "Was machst du, was ist das Ziel, was macht Spaß? Skizzen helfen sehr."],
        ["Die Community stimmt ab", "Öffentliche Ideen bekommen Stimmen. Ich lese jede Idee, auch die privaten."],
        ["An einem Tag gebaut", "Ich wähle eine aus, baue sie an einem Tag und mache ein Video darüber."]
      ],
      tippsTitel: "So wird deine Idee stark",
      tipps: [
        "Eine klare Kernidee schlägt eine Liste mit zehn Features.",
        "Sag, wie man spielt: Maus, Tastatur oder Touch.",
        "Nenn Spiele, die sich ähnlich anfühlen.",
        "Klein genug für einen Tag, groß genug, dass es Spaß macht."
      ]
    }
  };

  const ICONS = {
    bild: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg>',
    zu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    senden: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/></svg>',
    hoch: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>',
    runter: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    zurueck: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    welt: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    schloss: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
  };

  // Bleibt ueber das Neuzeichnen hinweg (Sprach- und Ansichtswechsel bauen die
  // Seite neu): letzte Antwort des Dienstes, gewaehlter Reiter, gewaehlte
  // Bilder, laufendes Senden, Erfolgsmeldung nach dem Einreichen.
  const z = {
    daten: null,
    fehler: false,
    reiter: "top",
    // Ids in der Top-Reihenfolge, siehe neuOrdnen()
    ordnung: null,
    sichtbar: PRO_SEITE,
    offen: new Set(),
    hinweis: null,
    erfolg: null,
    // { blob, url, id } -- id erst nach dem Hochladen
    bilder: [],
    bereitet: 0,
    sendet: false,
    fortschritt: "",
    meldung: null
  };
  let aktuell = null;

  function esc(x) {
    return String(x == null ? "" : x).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  function datum(iso, sprache) {
    try { return new Intl.DateTimeFormat(sprache, { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)); }
    catch (e) { return ""; }
  }

  async function rufen(pfad, methode, koerper, typ) {
    const kopf = Object.assign({ accept: "application/json" }, window.MIWALE_IDENTITAET.kopfzeilen());
    if (koerper != null) kopf["content-type"] = typ || "application/json";
    const res = await fetch(API + pfad, {
      method: methode || "GET",
      headers: kopf,
      body: koerper == null ? undefined : typ ? koerper : JSON.stringify(koerper)
    });
    const daten = await res.json().catch(() => ({}));
    return { status: res.status, daten };
  }

  // ---- Liste ------------------------------------------------------------------

  function listenGeruest(t) {
    return '<section class="sp-ideen__held">' +
        '<div class="sp-ideen__heldtext">' +
          '<p class="sp-ideen__kicker">' + esc(t.kicker) + "</p>" +
          '<h1 class="sp-ideen__titel">' + esc(t.titel) + "</h1>" +
          '<p class="sp-ideen__intro">' + esc(t.intro) + "</p>" +
        "</div>" +
        '<div class="sp-ideen__heldaktion">' +
          '<a class="sp-knopf sp-knopf--play sp-knopf--gross" href="/requests/new" data-link>' + ICONS.plus + esc(t.einreichen) + "</a>" +
          '<span class="sp-ideen__hilfe">' + esc(t.ohneKonto) + "</span>" +
        "</div>" +
      "</section>" +
      '<p class="sp-ideen__erfolg" data-ideen-erfolg role="status" aria-live="polite" hidden></p>' +
      '<section class="sp-kasten sp-ideen__kasten" aria-label="' + esc(t.reiter.top) + '">' +
        '<div class="sp-ideen__leiste">' +
          '<div class="sp-reiter sp-ideen__reiter" role="group" data-ideen-reiter></div>' +
          '<span class="sp-ideen__anzahl" data-ideen-anzahl></span>' +
        "</div>" +
        '<p class="sp-ideen__meldung" data-ideen-hinweis role="alert" hidden></p>' +
        '<div class="sp-ideen__liste" data-ideen-liste></div>' +
        '<button type="button" class="sp-knopf sp-knopf--glas sp-ideen__mehrladen" data-ideen-mehrladen hidden>' + esc(t.mehrLaden) + "</button>" +
      "</section>";
  }

  function sortiert() {
    const d = z.daten;
    if (!d) return [];
    if (z.reiter === "meine") return d.eigene;
    const liste = d.oeffentlich.slice();
    if (z.reiter === "neu") return liste.sort((a, b) => b.zeit.localeCompare(a.zeit));
    // Nach Punkten, aber in der Reihenfolge vom letzten Laden oder Reiterwechsel:
    // sonst spraenge eine Karte nach dem Abstimmen unter dem Finger weg.
    const rang = new Map((z.ordnung || []).map((id, i) => [id, i]));
    return liste.sort((a, b) => (rang.has(a.id) && rang.has(b.id) ? rang.get(a.id) - rang.get(b.id) : 0) ||
      (rang.has(a.id) ? 1 : rang.has(b.id) ? -1 : 0) || b.punkte - a.punkte || b.zeit.localeCompare(a.zeit));
  }

  // Merkt sich die Top-Reihenfolge nach dem aktuellen Punktestand.
  function neuOrdnen() {
    z.ordnung = z.daten ? z.daten.oeffentlich.slice().sort((a, b) => b.punkte - a.punkte || b.zeit.localeCompare(a.zeit)).map((i) => i.id) : null;
  }

  function standMarke(stand, t) {
    return t.staende[stand] ? '<span class="sp-idee__stand sp-idee__stand--' + esc(stand) + '">' + esc(t.staende[stand]) + "</span>" : "";
  }

  function beschreibungHtml(idee, t) {
    const lang = idee.beschreibung.length > 280;
    const offen = z.offen.has(idee.id);
    return '<p class="sp-idee__text' + (lang && !offen ? " sp-idee__text--zu" : "") + '">' + esc(idee.beschreibung) + "</p>" +
      (lang ? '<button type="button" class="sp-idee__mehr" data-ideen-mehr="' + esc(idee.id) + '" aria-expanded="' + offen + '">' + esc(offen ? t.weniger : t.mehr) + "</button>" : "");
  }

  function eckdaten(idee, t, sprache) {
    const wer = idee.name ? '<span class="sp-idee__von">' + esc(t.von(idee.name)) + "</span>" : esc(t.von(t.anonym));
    return [wer, esc(idee.genre ? t.genres[idee.genre] : ""), esc(t.plattformen[idee.plattform] || ""), esc(datum(idee.zeit, sprache))].filter(Boolean).join(" · ");
  }

  function stimmenHtml(idee, t) {
    const aus = idee.eigene ? " disabled" : "";
    const titel = idee.eigene ? ' title="' + esc(t.eigeneNichtAbstimmen) + '"' : "";
    return '<div class="sp-idee__stimmen"' + titel + ">" +
      '<button type="button" class="sp-idee__stimme sp-idee__stimme--hoch" data-ideen-stimme="1" data-id="' + esc(idee.id) + '" aria-pressed="' + (idee.meineStimme === 1) + '" aria-label="' + esc(t.hoch) + '"' + aus + ">" + ICONS.hoch + "</button>" +
      '<span class="sp-idee__punkte' + (idee.punkte > 0 ? " sp-idee__punkte--plus" : idee.punkte < 0 ? " sp-idee__punkte--minus" : "") + '" aria-label="' + esc(t.punkte(idee.punkte)) + '">' + esc(idee.punkte) + "</span>" +
      '<button type="button" class="sp-idee__stimme sp-idee__stimme--runter" data-ideen-stimme="-1" data-id="' + esc(idee.id) + '" aria-pressed="' + (idee.meineStimme === -1) + '" aria-label="' + esc(t.runter) + '"' + aus + ">" + ICONS.runter + "</button>" +
      "</div>";
  }

  function karte(idee, t, sprache) {
    const meine = z.reiter === "meine";
    const oeff = idee.sichtbarkeit === "oeffentlich";
    return '<article class="sp-idee' + (idee.eigene ? " sp-idee--eigen" : "") + '">' +
      stimmenHtml(idee, t) +
      '<div class="sp-idee__inhalt">' +
        '<div class="sp-idee__kopf"><span class="sp-idee__nr">#' + esc(idee.nummer) + "</span>" + standMarke(idee.stand, t) +
          (idee.eigene && !meine ? '<span class="sp-idee__marke">' + esc(t.eigeneIdee) + "</span>" : "") +
          (meine ? '<span class="sp-idee__marke sp-idee__marke--' + (oeff ? "oeffentlich" : "privat") + '">' + (oeff ? ICONS.welt : ICONS.schloss) + esc(oeff ? t.oeffentlich : t.privat) + "</span>" +
            (idee.versteckt ? '<span class="sp-idee__marke sp-idee__marke--versteckt">' + esc(t.versteckt) + "</span>" : "") : "") +
        "</div>" +
        '<h3 class="sp-idee__titel">' + esc(idee.titel) + "</h3>" +
        '<p class="sp-idee__daten">' + eckdaten(idee, t, sprache) + "</p>" +
        beschreibungHtml(idee, t) +
        (idee.bilder.length ? '<div class="sp-idee__minis">' + idee.bilder.map((src) =>
          '<a href="' + esc(src) + '" target="_blank" rel="noopener"><img src="' + esc(src) + '" alt="" loading="lazy"></a>').join("") + "</div>" : "") +
        (idee.bilderInPruefung ? '<p class="sp-idee__daten">' + ICONS.bild + " " + esc(t.bilderInPruefung(idee.bilderInPruefung)) + "</p>" : "") +
        (meine && oeff && idee.bilder.length && !idee.bilderFrei ? '<p class="sp-idee__daten">' + esc(t.bilderPruefung) + "</p>" : "") +
        (idee.antwort && idee.antwort.text ? '<div class="sp-bew__antwort"><span class="sp-bew__antwortwer">' + esc(t.entwickler) + '</span><p class="sp-bew__satz">' + esc(idee.antwort.text) + "</p></div>" : "") +
        (idee.link ? '<a class="sp-knopf sp-knopf--glas sp-idee__link" href="' + esc(idee.link) + '" target="_blank" rel="noopener noreferrer">' + ICONS.play + esc(t.ansehen) + "</a>" : "") +
        (meine ? '<div class="sp-idee__aktionen">' +
          '<button type="button" class="sp-bew__loeschen" data-ideen-sicht="' + esc(idee.id) + '" data-wert="' + (oeff ? "privat" : "oeffentlich") + '">' + esc(oeff ? t.machPrivat : t.machOeffentlich) + "</button>" +
          '<button type="button" class="sp-bew__loeschen" data-ideen-weg="' + esc(idee.id) + '">' + esc(t.zurueckziehen) + "</button></div>" : "") +
      "</div></article>";
  }

  function listeZeichnen() {
    if (!aktuell || aktuell.ansicht !== "liste" || !aktuell.el.isConnected) return;
    const { el, t, sprache } = aktuell;
    const d = z.daten;

    el.querySelector("[data-ideen-reiter]").innerHTML = ["top", "neu", "meine"].map((r) =>
      '<button type="button" data-ideen-tab="' + r + '" aria-pressed="' + (z.reiter === r) + '">' +
        esc(r === "meine" ? t.reiter.meine(d ? d.eigene.length : 0) : t.reiter[r]) + "</button>").join("");
    el.querySelector("[data-ideen-anzahl]").textContent = d && z.reiter !== "meine" ? t.anzahl(d.oeffentlich.length) : "";

    const erfolg = el.querySelector("[data-ideen-erfolg]");
    erfolg.hidden = !z.erfolg;
    erfolg.textContent = z.erfolg || "";

    const hinweis = el.querySelector("[data-ideen-hinweis]");
    hinweis.hidden = !z.hinweis;
    hinweis.textContent = z.hinweis || "";

    const liste = sortiert();
    const box = el.querySelector("[data-ideen-liste]");
    if (!d) box.innerHTML = '<p class="sp-bew__leer">' + esc(z.fehler ? t.aus : t.laedt) + "</p>";
    else if (!liste.length) {
      box.innerHTML = '<div class="sp-bew__leer sp-ideen__leer"><p>' + esc(z.reiter === "meine" ? t.meineLeer : t.leer) + "</p>" +
        '<a class="sp-knopf sp-knopf--play" href="/requests/new" data-link>' + ICONS.plus + esc(t.einreichen) + "</a></div>";
    } else box.innerHTML = liste.slice(0, z.sichtbar).map((i) => karte(i, t, sprache)).join("");
    el.querySelector("[data-ideen-mehrladen]").hidden = liste.length <= z.sichtbar;
  }

  // Eine geaenderte Idee in beiden Listen ersetzen.
  function ersetzen(idee) {
    if (!z.daten) return;
    for (const liste of [z.daten.oeffentlich, z.daten.eigene]) {
      const i = liste.findIndex((x) => x.id === idee.id);
      if (i >= 0) liste[i] = Object.assign({}, liste[i], idee);
    }
  }

  async function abstimmen(id, klick) {
    const idee = z.daten && z.daten.oeffentlich.find((x) => x.id === id);
    if (!idee || idee.eigene) return;
    const vorher = { hoch: idee.hoch, runter: idee.runter, punkte: idee.punkte, meineStimme: idee.meineStimme };
    const wert = idee.meineStimme === klick ? 0 : klick;
    // Sofort zeigen, der Dienst bestaetigt danach.
    const hoch = idee.hoch - (idee.meineStimme === 1 ? 1 : 0) + (wert === 1 ? 1 : 0);
    const runter = idee.runter - (idee.meineStimme === -1 ? 1 : 0) + (wert === -1 ? 1 : 0);
    ersetzen({ id, hoch, runter, punkte: hoch - runter, meineStimme: wert });
    z.hinweis = null;
    listeZeichnen();
    try {
      const r = await rufen(encodeURIComponent(id) + "/stimme", "PUT", { wert });
      if (r.status !== 200) throw new Error(r.status);
      ersetzen(r.daten.idee);
    } catch (e) {
      ersetzen(Object.assign({ id }, vorher));
      z.hinweis = aktuell.t.stimmeFehler;
    }
    listeZeichnen();
  }

  function listeEinbauen(el, t) {
    el.innerHTML = listenGeruest(t);
    listeZeichnen();

    el.addEventListener("click", async (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      const d = b.dataset;
      if (d.ideenTab) {
        z.reiter = d.ideenTab; z.sichtbar = PRO_SEITE; z.erfolg = null;
        neuOrdnen();
        listeZeichnen();
        return;
      }
      if (d.ideenStimme) { abstimmen(d.id, Number(d.ideenStimme)); return; }
      if ("ideenMehrladen" in d) { z.sichtbar += PRO_SEITE; listeZeichnen(); return; }
      if (d.ideenMehr) {
        if (z.offen.has(d.ideenMehr)) z.offen.delete(d.ideenMehr); else z.offen.add(d.ideenMehr);
        listeZeichnen();
        return;
      }
      if (d.ideenSicht || d.ideenWeg) {
        if (d.ideenWeg && !window.confirm(t.zurueckziehenFrage)) return;
        b.disabled = true;
        try {
          const r = d.ideenWeg
            ? await rufen(encodeURIComponent(d.ideenWeg), "DELETE")
            : await rufen(encodeURIComponent(d.ideenSicht), "PUT", { sichtbarkeit: d.wert });
          if (r.status !== 200) throw new Error(r.status);
          z.daten = r.daten;
          z.hinweis = null;
        } catch (err) {
          z.hinweis = t.fehler;
        }
        listeZeichnen();
      }
    });
  }

  // ---- Formular ---------------------------------------------------------------

  // Der Text bleibt im Browser, bis er abgeschickt ist. Am Handy laedt die Seite
  // manchmal neu, wenn man zum Bildauswaehlen in die Galerie wechselt. Den
  // Rechte-Haken nicht: den soll man jedes Mal bewusst setzen.
  const FELDER = ["titel", "genre", "plattform", "beschreibung", "name", "sichtbarkeit", "erwaehnen", "veroeffentlichen"];

  function entwurfLesen() {
    try { return JSON.parse(localStorage.getItem(ENTWURF_SCHLUESSEL) || "{}") || {}; } catch (e) { return {}; }
  }
  function entwurfSchreiben(form) {
    const d = {};
    for (const f of FELDER) {
      const feld = form.elements[f];
      if (feld) d[f] = feld.type === "checkbox" ? feld.checked : feld.value;
    }
    try { localStorage.setItem(ENTWURF_SCHLUESSEL, JSON.stringify(d)); } catch (e) { /* dann eben nicht */ }
  }
  function entwurfEinsetzen(form) {
    const d = entwurfLesen();
    for (const f of FELDER) {
      const feld = form.elements[f];
      if (!feld || d[f] == null || d[f] === "") continue;
      if (feld.type === "checkbox") feld.checked = !!d[f];
      else feld.value = d[f];
    }
  }
  function entwurfLoeschen() {
    try { localStorage.removeItem(ENTWURF_SCHLUESSEL); } catch (e) { /* egal */ }
  }

  function bildDekodieren(datei) {
    if (window.createImageBitmap) return createImageBitmap(datei).catch(() => bildUeberImg(datei));
    return bildUeberImg(datei);
  }
  function bildUeberImg(datei) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(datei);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("typ")); };
      img.src = url;
    });
  }
  function alsBlob(canvas, typ, qualitaet) {
    return new Promise((resolve) => canvas.toBlob(resolve, typ, qualitaet));
  }

  // Verkleinert auf hoechstens BILD_KANTE und unter G.bildBytes. WebP, wo der
  // Browser es schreiben kann (Safari kann es nicht und liefert dann PNG),
  // sonst JPEG. Weisser Grund, damit durchsichtige Skizzen lesbar bleiben.
  async function bildVorbereiten(datei) {
    if (datei.size > ROH_MAX) throw new Error("gross");
    const quelle = await bildDekodieren(datei);
    const breite = quelle.width || quelle.naturalWidth;
    const hoehe = quelle.height || quelle.naturalHeight;
    if (!breite || !hoehe) throw new Error("typ");
    for (const [kante, qualitaet] of [[BILD_KANTE, .85], [BILD_KANTE, .72], [1280, .7], [1024, .62]]) {
      const massstab = Math.min(1, kante / Math.max(breite, hoehe));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(breite * massstab));
      canvas.height = Math.max(1, Math.round(hoehe * massstab));
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(quelle, 0, 0, canvas.width, canvas.height);
      let blob = await alsBlob(canvas, "image/webp", qualitaet);
      if (!blob || blob.type !== "image/webp") blob = await alsBlob(canvas, "image/jpeg", qualitaet);
      if (blob && blob.size <= G.bildBytes) {
        if (quelle.close) quelle.close();
        return blob;
      }
    }
    throw new Error("gross");
  }

  async function bilderHinzufuegen(dateien) {
    const t = aktuell ? aktuell.t : TEXTE.en;
    const liste = Array.from(dateien || []).filter((d) => d && (d.type ? d.type.startsWith("image/") : /\.(jpe?g|png|webp|gif|heic|heif|bmp|avif)$/i.test(d.name || "")));
    if (!liste.length) {
      if (dateien && dateien.length) { z.meldung = t.fehlerBildTyp; formZeichnen(); }
      return;
    }
    const frei = G.bilder - z.bilder.length - z.bereitet;
    if (frei <= 0) { z.meldung = t.fehlerBildZuViele; formZeichnen(); return; }
    z.meldung = liste.length > frei ? t.fehlerBildZuViele : null;
    const auswahl = liste.slice(0, frei);
    z.bereitet += auswahl.length;
    formZeichnen();
    for (const datei of auswahl) {
      try {
        const blob = await bildVorbereiten(datei);
        z.bilder.push({ blob, url: URL.createObjectURL(blob), id: null });
      } catch (e) {
        z.meldung = e.message === "gross" ? t.fehlerBildGross : t.fehlerBildTyp;
      }
      z.bereitet--;
      formZeichnen();
    }
  }

  function haken(name, text, extra) {
    return '<label class="sp-ideen__haken"><input type="checkbox" name="' + name + '"' + (extra || "") + "><span>" + text + "</span></label>";
  }

  function formGeruest(t) {
    return '<nav class="sp-pfad" aria-label="Breadcrumb"><a href="/requests" data-link>' + ICONS.zurueck + " " + esc(t.zurueckListe) + "</a></nav>" +
      '<h1 class="sp-ideen__formtitel">' + esc(t.formTitel) + "</h1>" +
      '<div class="sp-ideen__raster">' +
        '<section class="sp-kasten sp-ideen__kasten">' +
          '<form class="sp-ideen__form" data-ideen-form novalidate>' +
            '<label class="sp-ideen__feld"><span class="sp-ideen__label">' + esc(t.feldTitel) + ' <span class="sp-ideen__pflicht" aria-hidden="true">*</span></span>' +
              '<input type="text" name="titel" maxlength="' + G.titel + '" required autocomplete="off" placeholder="' + esc(t.titelPlatzhalter) + '"></label>' +

            '<div class="sp-ideen__zeile">' +
              '<label class="sp-ideen__feld"><span class="sp-ideen__label">' + esc(t.feldGenre) + "</span>" +
                '<select name="genre"><option value="">' + esc(t.genreLeer) + "</option>" +
                  GENRES.map((g) => '<option value="' + g + '">' + esc(t.genres[g]) + "</option>").join("") + "</select></label>" +
              '<fieldset class="sp-ideen__feld"><legend class="sp-ideen__label">' + esc(t.feldPlattform) + "</legend>" +
                '<div class="sp-ideen__chips">' + PLATTFORMEN.map((p) =>
                  '<label><input type="radio" name="plattform" value="' + p + '"' + (p === "beides" ? " checked" : "") + "><span>" + esc(t.plattformen[p]) + "</span></label>").join("") + "</div>" +
              "</fieldset>" +
            "</div>" +

            '<label class="sp-ideen__feld"><span class="sp-ideen__label">' + esc(t.feldBeschreibung) + ' <span class="sp-ideen__pflicht" aria-hidden="true">*</span></span>' +
              '<textarea name="beschreibung" maxlength="' + G.beschreibung + '" required placeholder="' + esc(t.beschreibungPlatzhalter) + '"></textarea>' +
              '<span class="sp-ideen__hilfe sp-ideen__zaehler" data-ideen-zaehler aria-hidden="true"></span></label>' +

            '<div class="sp-ideen__feld">' +
              '<span class="sp-ideen__label" id="sp-ideen-bilder-label">' + esc(t.feldBilder) + "</span>" +
              '<div class="sp-ideen__ablage" data-ideen-ablage>' +
                '<div class="sp-ideen__bilder" data-ideen-bilder></div>' +
                '<label class="sp-ideen__waehlen" data-ideen-waehlen>' + ICONS.bild +
                  '<span><strong>' + esc(t.bilderWaehlen) + "</strong> " + esc(t.bilderZiehen) + "</span>" +
                  '<input type="file" accept="image/*" multiple data-ideen-datei aria-labelledby="sp-ideen-bilder-label"></label>' +
              "</div>" +
              '<span class="sp-ideen__hilfe">' + esc(t.bilderHilfe) + " " + esc(t.keinePersonen) + "</span>" +
            "</div>" +

            // Bewusst ohne Vorauswahl: wer einreicht, soll sich entscheiden.
            '<fieldset class="sp-ideen__feld" data-ideen-sichtbarkeit><legend class="sp-ideen__label">' + esc(t.feldSichtbarkeit) + ' <span class="sp-ideen__pflicht" aria-hidden="true">*</span></legend>' +
              '<div class="sp-ideen__sicht">' +
                '<label><input type="radio" name="sichtbarkeit" value="oeffentlich" required><span>' + ICONS.welt + "<strong>" + esc(t.sichtOeffentlich) + "</strong>" + esc(t.sichtOeffentlichHilfe) + "</span></label>" +
                '<label><input type="radio" name="sichtbarkeit" value="privat"><span>' + ICONS.schloss + "<strong>" + esc(t.sichtPrivat) + "</strong>" + esc(t.sichtPrivatHilfe) + "</span></label>" +
              "</div>" +
            "</fieldset>" +

            '<div class="sp-ideen__haken-gruppe">' +
              haken("erwaehnen", esc(t.erwaehnen)) +
              '<label class="sp-ideen__feld sp-ideen__name" data-ideen-name hidden><span class="sp-ideen__label">' + esc(t.feldName) + "</span>" +
                '<input type="text" name="name" maxlength="' + G.name + '" autocomplete="nickname" placeholder="' + esc(t.namePlatzhalter) + '"></label>' +
              haken("veroeffentlichen", esc(t.veroeffentlichen)) +
              haken("rechte", esc(t.rechte) + ' <span class="sp-ideen__pflichtmarke">' + esc(t.pflicht) + "</span>", " required") +
            "</div>" +

            // Falle fuer Bots: fuer Menschen und Vorleseprogramme unsichtbar.
            '<div class="sp-bew__falle" aria-hidden="true"><label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>' +

            '<div class="sp-ideen__aktionen">' +
              '<button type="submit" class="sp-knopf sp-knopf--play sp-knopf--gross" data-ideen-senden></button>' +
              '<p class="sp-ideen__hilfe">' + esc(t.geraetHinweis) + "</p>" +
            "</div>" +
            '<p class="sp-ideen__meldung" data-ideen-meldung role="alert" hidden></p>' +
          "</form>" +
        "</section>" +

        '<aside class="sp-ideen__seite">' +
          '<section><h2 class="sp-ueberschrift sp-ueberschrift--klein">' + esc(t.soGehts) + "</h2>" +
            '<ol class="sp-ideen__schritte">' + t.schritte.map((s, i) =>
              '<li><span class="sp-ideen__zahl">' + (i + 1) + '</span><span><strong>' + esc(s[0]) + "</strong>" + esc(s[1]) + "</span></li>").join("") + "</ol></section>" +
          '<section class="sp-ideen__tipps"><h2 class="sp-ueberschrift sp-ueberschrift--klein">' + esc(t.tippsTitel) + "</h2>" +
            '<ul class="sp-features">' + t.tipps.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul></section>" +
        "</aside>" +
      "</div>";
  }

  function formZeichnen() {
    if (!aktuell || aktuell.ansicht !== "neu" || !aktuell.el.isConnected) return;
    const { el, t } = aktuell;

    const senden = el.querySelector("[data-ideen-senden]");
    senden.innerHTML = z.sendet ? esc(z.fortschritt || t.sendet) : ICONS.senden + esc(t.senden);
    senden.disabled = z.sendet || z.bereitet > 0;

    const meldung = el.querySelector("[data-ideen-meldung]");
    meldung.hidden = !z.meldung;
    meldung.textContent = z.meldung || "";

    el.querySelector("[data-ideen-bilder]").innerHTML = z.bilder.map((b, i) =>
      '<div class="sp-ideen__bild"><img src="' + esc(b.url) + '" alt="">' +
        '<button type="button" class="sp-ideen__weg" data-ideen-bild-weg="' + i + '" aria-label="' + esc(t.bildEntfernen(i + 1)) + '"' + (z.sendet ? " disabled" : "") + ">" + ICONS.zu + "</button></div>").join("") +
      Array.from({ length: z.bereitet }, () => '<div class="sp-ideen__bild sp-ideen__bild--laedt" role="status"><span>' + esc(t.bildBereitet) + "</span></div>").join("");
    el.querySelector("[data-ideen-waehlen]").hidden = z.bilder.length + z.bereitet >= G.bilder;
  }

  function formDetails(el) {
    const form = el.querySelector("[data-ideen-form]");
    el.querySelector("[data-ideen-zaehler]").textContent = form.elements.beschreibung.value.length + " / " + G.beschreibung;
    el.querySelector("[data-ideen-name]").hidden = !form.elements.erwaehnen.checked;
  }

  function pruefen(form, t) {
    const f = form.elements;
    if (f.titel.value.trim().length < G.titelMin) return [f.titel, t.fehlerTitel];
    if (f.beschreibung.value.trim().length < G.beschreibungMin) return [f.beschreibung, t.fehlerBeschreibung];
    if (!f.sichtbarkeit.value) return [form.querySelector('[name="sichtbarkeit"]'), t.fehlerSichtbarkeit];
    if (f.erwaehnen.checked && !f.name.value.trim()) return [f.name, t.fehlerName];
    if (!f.rechte.checked) return [f.rechte, t.fehlerRechte];
    return null;
  }

  function fehlerText(status, daten, t) {
    if (status === 422 && daten.woerter) return t.gesperrt(daten.woerter);
    if (status === 413) return t.fehlerBildGross;
    if (status === 507) return t.speicherVoll;
    if (status === 429) return daten.fehler === "zu-viele-offen" ? t.zuVieleOffen : t.zuSchnell;
    const je = { titel: t.fehlerTitel, beschreibung: t.fehlerBeschreibung, sichtbarkeit: t.fehlerSichtbarkeit, name: t.fehlerName, rechte: t.fehlerRechte, "bild-format": t.fehlerBildTyp };
    return je[daten.fehler] || t.fehler;
  }

  async function absenden(form) {
    const { t } = aktuell;
    if (z.sendet || z.bereitet) return;
    const problem = pruefen(form, t);
    form.querySelectorAll("[aria-invalid]").forEach((x) => x.removeAttribute("aria-invalid"));
    if (problem) {
      const feld = problem[0].name === "sichtbarkeit" ? form.querySelector("[data-ideen-sichtbarkeit]") : problem[0];
      feld.setAttribute("aria-invalid", "true");
      problem[0].focus();
      z.meldung = problem[1];
      formZeichnen();
      return;
    }
    const f = form.elements;
    z.sendet = true; z.meldung = null;
    formZeichnen();
    try {
      // Bilder einzeln hoch; schon hochgeladene (bei einem zweiten Versuch) nicht noch einmal.
      const offen = z.bilder.filter((b) => !b.id);
      for (let i = 0; i < offen.length; i++) {
        z.fortschritt = t.bildLaedt(i + 1, offen.length);
        formZeichnen();
        const r = await rufen("bild", "POST", offen[i].blob, offen[i].blob.type);
        if (r.status !== 201) throw Object.assign(new Error("bild"), r);
        offen[i].id = r.daten.id;
      }
      z.fortschritt = t.sendet;
      formZeichnen();
      const r = await rufen("", "POST", {
        titel: f.titel.value, genre: f.genre.value, plattform: f.plattform.value || "beides",
        beschreibung: f.beschreibung.value,
        sichtbarkeit: f.sichtbarkeit.value,
        erwaehnen: f.erwaehnen.checked, name: f.erwaehnen.checked ? f.name.value : "",
        veroeffentlichen: f.veroeffentlichen.checked, rechte: f.rechte.checked,
        website: f.website.value,
        bilder: z.bilder.map((b) => b.id)
      });
      if (r.status !== 201) throw Object.assign(new Error("idee"), r);
      z.daten = { oeffentlich: r.daten.oeffentlich, eigene: r.daten.eigene };
      neuOrdnen();
      z.bilder.forEach((b) => URL.revokeObjectURL(b.url));
      z.bilder = [];
      entwurfLoeschen();
      const oeff = r.daten.idee && r.daten.idee.sichtbarkeit === "oeffentlich";
      z.erfolg = t.danke(r.daten.idee ? r.daten.idee.nummer : "", oeff);
      // Oeffentliche stehen unter "Neu" ganz oben, private nur unter "Deine Ideen".
      z.reiter = oeff ? "neu" : "meine";
      z.sichtbar = PRO_SEITE;
      z.sendet = false; z.fortschritt = "";
      aktuell.zurueck();
      return;
    } catch (e) {
      // Verfallene lose Bilder beim naechsten Versuch neu hochladen.
      if (e.daten && e.daten.fehler === "bild-fehlt") z.bilder.forEach((b) => { b.id = null; });
      z.meldung = e.status ? fehlerText(e.status, e.daten || {}, t) : t.fehler;
    }
    z.sendet = false;
    z.fortschritt = "";
    formZeichnen();
  }

  function formEinbauen(el, t) {
    el.innerHTML = formGeruest(t);
    const form = el.querySelector("[data-ideen-form]");
    entwurfEinsetzen(form);
    formDetails(el);
    formZeichnen();

    form.addEventListener("input", (e) => {
      if (e.target.hasAttribute("aria-invalid")) e.target.removeAttribute("aria-invalid");
      formDetails(el);
      if (e.target.name !== "rechte") entwurfSchreiben(form);
    });
    form.addEventListener("change", (e) => {
      if (e.target.matches("[data-ideen-datei]")) {
        bilderHinzufuegen(e.target.files);
        e.target.value = "";
        return;
      }
      if (e.target.name === "sichtbarkeit") form.querySelector("[data-ideen-sichtbarkeit]").removeAttribute("aria-invalid");
      if (e.target.name === "erwaehnen" && e.target.checked) form.elements.name.focus();
      formDetails(el);
      entwurfSchreiben(form);
    });
    form.addEventListener("submit", (e) => { e.preventDefault(); absenden(form); });

    const ablage = el.querySelector("[data-ideen-ablage]");
    ablage.addEventListener("dragover", (e) => {
      if (!e.dataTransfer || !Array.from(e.dataTransfer.types || []).includes("Files")) return;
      e.preventDefault();
      ablage.classList.add("sp-ideen__ablage--drueber");
    });
    ablage.addEventListener("dragleave", (e) => { if (!ablage.contains(e.relatedTarget)) ablage.classList.remove("sp-ideen__ablage--drueber"); });
    ablage.addEventListener("drop", (e) => {
      e.preventDefault();
      ablage.classList.remove("sp-ideen__ablage--drueber");
      bilderHinzufuegen(e.dataTransfer.files);
    });

    el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-ideen-bild-weg]");
      if (!b) return;
      const [weg] = z.bilder.splice(Number(b.dataset.ideenBildWeg), 1);
      if (weg) URL.revokeObjectURL(weg.url);
      z.meldung = null;
      formZeichnen();
    });
  }

  // ---- Einbauen ----------------------------------------------------------------

  function laden() {
    rufen("")
      .then(({ status, daten }) => {
        if (status !== 200) throw new Error(status);
        z.daten = daten; z.fehler = false;
        neuOrdnen();
        listeZeichnen();
      })
      .catch(() => {
        if (z.daten) return;
        z.fehler = true;
        listeZeichnen();
      });
  }

  // optionen: { ansicht: "liste" | "neu", zurueck: Funktion zurueck zur Liste }
  function einbauen(el, sprache, optionen) {
    if (!el) return;
    const t = TEXTE[sprache] || TEXTE.en;
    const ansicht = optionen && optionen.ansicht === "neu" ? "neu" : "liste";
    aktuell = { el, t, sprache, ansicht, zurueck: (optionen && optionen.zurueck) || (() => {}) };
    if (ansicht === "neu") {
      z.erfolg = null;
      formEinbauen(el, t);
    } else {
      listeEinbauen(el, t);
      laden();
    }
  }

  // Einfuegen (Strg+V) eines Bildes irgendwo auf der Seite, solange das Formular offen ist.
  document.addEventListener("paste", (e) => {
    if (!aktuell || aktuell.ansicht !== "neu" || !aktuell.el.isConnected || !e.clipboardData) return;
    const dateien = Array.from(e.clipboardData.files || []).filter((d) => d.type.startsWith("image/"));
    if (!dateien.length) return;
    e.preventDefault();
    bilderHinzufuegen(dateien);
  });

  window.MIWALE_IDEEN = { einbauen };
})();
