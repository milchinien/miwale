// miwale Studio: Jeder mit Konto kann ein Browserspiel hochladen, seine
// Store-Seite gestalten und zur Pruefung einreichen -- aehnlich wie Steamworks.
// Die Verwaltung prueft Store-Seite und Build einzeln; erst danach kann der
// Entwickler veroeffentlichen.
//
// Ablauf eines Projekts:
//   entwurf -> eingereicht -> freigegeben | abgelehnt -> (veroeffentlichen) -> live
// Der Entwickler bearbeitet immer den Entwurf. Was live steht, aendert sich erst
// mit der naechsten Freigabe und einem Klick auf "Veroeffentlichen".
//
// Sicherheit:
//   - Hochgeladene Spiele sind fremder Code. Sie laufen nur unter SPIELE_ADRESSE
//     (play.miwale.com): /community/<slug>/ und /vorschau/<build>/. Ohne eigene
//     Spiele-Adresse nimmt das Studio keine Builds an (optionen.spieleAdresse).
//   - Bilder und Videos werden an den ersten Bytes erkannt; Dateinamen vergibt
//     der Server. Kein SVG, kein HTML.
//   - ZIPs entpackt server/zip-lesen.mjs mit Grenzen fuer Pfade und Groessen.
//
// Daten: <ordner>/studio/projekte.json, medien/<projekt>/<datei>,
// builds/<build>/ (entpackt), web/community/<slug> (Verweis auf den freigegebenen
// Build) und web/vorschau (Verweis auf builds/).

import { randomBytes, randomUUID } from "node:crypto";
import { createWriteStream, existsSync, lstatSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, symlinkSync, unlinkSync, writeFileSync, createReadStream } from "node:fs";
import { once } from "node:events";
import { join, extname } from "node:path";
import { sicherSchreiben, lesen, lesenRoh, textPruefen, tempoGrenze, handlerAus, adminAbweisung, adminSchutz, sperrlisteLesen } from "./gemeinsam.mjs";
import { gesperrteWoerter } from "./bewertungen.mjs";
import { entpacken } from "./zip-lesen.mjs";

const TAG = 24 * 60 * 60 * 1000;

export const STUDIO_GRENZEN = {
  name: 60, kurz: 300, lang: 8000, steuerung: 1500, feature: 160, features: 12,
  tag: 30, tags: 10, sprachen: 20, screens: 12, entwickler: 60, lizenzen: 3000,
  hinweise: 600, kiText: 1500, datenText: 2000, notiz: 2000, nachricht: 4000,
  bildBytes: 8 * 1024 * 1024, videoBytes: 120 * 1024 * 1024,
  buildsJeProjekt: 5,
  uploadsProFenster: 60,
  schreibenProFenster: 200
};

export const SPRACHEN = ["de", "en", "fr", "es", "it", "pt", "nl", "pl", "tr", "ru", "uk", "ja", "ko", "zh", "ar", "sv", "da", "no", "fi", "cs"];
export const GERAETE = ["pc", "handy"];
export const EINGABEN = ["maus", "tastatur", "touch", "gamepad"];
export const ENGINES = ["unity", "godot", "phaser", "three", "pixi", "construct", "gamemaker", "defold", "pico8", "html", "andere"];
export const FORMATE = ["16:9", "4:3", "1:1", "hoch", "frei"];

// Fragebogen. Jede Frage hat feste Antworten; null heisst: noch nicht beantwortet.
export const FRAGEN = {
  gewalt: ["nein", "comic", "fantasie", "realistisch"],
  blut: ["nein", "wenig", "viel"],
  horror: ["nein", "leicht", "stark"],
  sexuell: ["nein", "andeutungen", "nacktheit"],
  sprache: ["nein", "mild", "grob"],
  drogen: ["nein", "ja"],
  gluecksspiel: ["nein", "simuliert"],
  mikrotransaktionen: ["nein", "ja"],
  ki: ["nein", "ja"],
  multiplayer: ["nein", "ja"],
  chat: ["nein", "ja"],
  daten: ["nein", "ja"]
};

// Grafiken der Store-Seite (empfohlene Groessen wie bei Steam).
export const MEDIEN_ARTEN = {
  icon: { video: false, pflicht: true, breite: 512, hoehe: 512 },
  header: { video: false, pflicht: true, breite: 920, hoehe: 430 },
  kapsel: { video: false, pflicht: true, breite: 1232, hoehe: 706 },
  kapselKlein: { video: false, pflicht: false, breite: 462, hoehe: 174 },
  kapselHoch: { video: false, pflicht: false, breite: 748, hoehe: 896 },
  screen: { video: false, pflicht: true, breite: 1920, hoehe: 1080 },
  trailer: { video: true, pflicht: false }
};

const TYPEN = {
  png: { mime: "image/png", passt: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  jpg: { mime: "image/jpeg", passt: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  webp: { mime: "image/webp", passt: (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" },
  gif: { mime: "image/gif", passt: (b) => b.toString("ascii", 0, 6) === "GIF87a" || b.toString("ascii", 0, 6) === "GIF89a" },
  mp4: { mime: "video/mp4", video: true, passt: (b) => b.toString("ascii", 4, 8) === "ftyp" },
  webm: { mime: "video/webm", video: true, passt: (b) => b.readUInt32BE(0) === 0x1a45dfa3 }
};
export function medienTyp(b) {
  if (!b || b.length < 16) return null;
  return Object.keys(TYPEN).find((k) => TYPEN[k].passt(b)) || null;
}

const ID_RE = /^[0-9a-f-]{36}$/;
const BUILD_RE = /^[0-9a-f]{24}$/;
const DATEI_RE = /^[0-9a-f]{20}\.(png|jpg|webp|gif|mp4|webm)$/;
export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;
const RESERVIERT = new Set(["admin", "api", "studio", "games", "community", "vorschau", "neu", "new", "miwale", "account", "library", "pearls", "profile", "requests", "privacy", "test"]);

export function slugAus(name) {
  return String(name || "").toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/g, "");
}

export function leereSeite(name = "") {
  return {
    name, kurz: "", lang: "", genre: "", tags: [], sprachen: [], features: [], steuerung: "", geraete: [],
    entwickler: "", webseite: "",
    medien: { icon: "", header: "", kapsel: "", kapselKlein: "", kapselHoch: "", screens: [], trailer: "" },
    inhalt: Object.fromEntries([...Object.keys(FRAGEN).map((k) => [k, null]), ["kiText", ""], ["datenText", ""], ["datenschutzUrl", ""], ["hinweise", ""], ["alterEigen", 0]]),
    technik: { engine: "", eingabe: [], format: "16:9", internet: false, speichern: true, hinweise: "" },
    rechte: { eigene: false, lizenzen: "", bestaetigt: null }
  };
}

// Empfehlung fuer die Altersstufe aus dem Fragebogen (Selbstauskunft, angelehnt
// an die USK-Stufen). Der Entwickler kann hoeher, aber nicht niedriger einstufen.
export function alterAus(inhalt) {
  const i = inhalt || {};
  let a = 0;
  const mind = (x) => { a = Math.max(a, x); };
  if (i.gewalt === "comic") mind(6);
  if (i.gewalt === "fantasie") mind(12);
  if (i.gewalt === "realistisch") mind(16);
  if (i.gewalt === "realistisch" && i.blut === "viel") mind(18);
  if (i.blut === "wenig") mind(12);
  if (i.blut === "viel") mind(16);
  if (i.horror === "leicht") mind(12);
  if (i.horror === "stark") mind(16);
  if (i.sexuell === "andeutungen") mind(12);
  if (i.sexuell === "nacktheit") mind(18);
  if (i.sprache === "mild") mind(6);
  if (i.sprache === "grob") mind(12);
  if (i.drogen === "ja") mind(16);
  if (i.gluecksspiel === "simuliert") mind(12);
  const eigen = [0, 6, 12, 16, 18].includes(i.alterEigen) ? i.alterEigen : 0;
  return Math.max(a, eigen);
}

// Inhaltshinweise fuer die Spielseite (Schluessel, uebersetzt im Browser).
export function hinweiseAus(inhalt) {
  const i = inhalt || {};
  const h = [];
  if (i.gewalt && i.gewalt !== "nein") h.push("gewalt-" + i.gewalt);
  if (i.blut && i.blut !== "nein") h.push("blut");
  if (i.horror && i.horror !== "nein") h.push("horror");
  if (i.sexuell && i.sexuell !== "nein") h.push("sexuell-" + i.sexuell);
  if (i.sprache === "grob") h.push("sprache");
  if (i.drogen === "ja") h.push("drogen");
  if (i.gluecksspiel === "simuliert") h.push("gluecksspiel");
  if (i.mikrotransaktionen === "ja") h.push("mikrotransaktionen");
  if (i.ki === "ja") h.push("ki");
  if (i.multiplayer === "ja") h.push("online");
  if (i.chat === "ja") h.push("chat");
  if (i.daten === "ja") h.push("daten");
  return h;
}

function fehler(grund, status = 400) { const e = new Error(grund); e.status = status; return e; }

// Prueft einen Entwurf. Unvollstaendig ist erlaubt (das sagt die Checkliste),
// falsch nicht: zu lang, falsche Werte, verbotene Woerter.
export function seitePruefen(k, alt, genres, sperrliste) {
  const s = JSON.parse(JSON.stringify(alt));
  const text = (wert, max, grund) => {
    const t = textPruefen(wert == null ? "" : wert, max);
    if (t === null) throw fehler(grund);
    if (t && sperrliste && gesperrteWoerter(t, sperrliste).length) throw fehler("woerter-" + grund, 422);
    return t;
  };
  const liste = (wert, max, einzelMax, grund) => {
    if (!Array.isArray(wert) || wert.length > max) throw fehler(grund);
    return [...new Set(wert.map((x) => text(x, einzelMax, grund)).filter(Boolean))];
  };
  const auswahl = (wert, erlaubt, grund) => {
    if (!Array.isArray(wert) || wert.some((x) => !erlaubt.includes(x))) throw fehler(grund);
    return [...new Set(wert)];
  };
  const url = (wert, grund) => {
    const t = text(wert, 300, grund);
    if (!t) return "";
    try { const u = new URL(t); if (u.protocol !== "https:") throw 0; return u.href; } catch { throw fehler(grund); }
  };
  if ("name" in k) { s.name = text(k.name, STUDIO_GRENZEN.name, "name"); if (s.name.length < 2) throw fehler("name"); }
  if ("kurz" in k) s.kurz = text(k.kurz, STUDIO_GRENZEN.kurz, "kurz");
  if ("lang" in k) s.lang = text(k.lang, STUDIO_GRENZEN.lang, "lang");
  if ("genre" in k) { if (k.genre !== "" && !genres.includes(k.genre)) throw fehler("genre"); s.genre = k.genre; }
  if ("tags" in k) s.tags = liste(k.tags, STUDIO_GRENZEN.tags, STUDIO_GRENZEN.tag, "tags");
  if ("sprachen" in k) s.sprachen = auswahl(k.sprachen, SPRACHEN, "sprachen");
  if ("features" in k) s.features = liste(k.features, STUDIO_GRENZEN.features, STUDIO_GRENZEN.feature, "features");
  if ("steuerung" in k) s.steuerung = text(k.steuerung, STUDIO_GRENZEN.steuerung, "steuerung");
  if ("geraete" in k) s.geraete = auswahl(k.geraete, GERAETE, "geraete");
  if ("entwickler" in k) s.entwickler = text(k.entwickler, STUDIO_GRENZEN.entwickler, "entwickler");
  if ("webseite" in k) s.webseite = url(k.webseite, "webseite");
  if (k.inhalt) {
    const i = k.inhalt;
    for (const [frage, antworten] of Object.entries(FRAGEN)) {
      if (frage in i) {
        if (i[frage] !== null && !antworten.includes(i[frage])) throw fehler("frage-" + frage);
        s.inhalt[frage] = i[frage];
      }
    }
    if ("kiText" in i) s.inhalt.kiText = text(i.kiText, STUDIO_GRENZEN.kiText, "ki-text");
    if ("datenText" in i) s.inhalt.datenText = text(i.datenText, STUDIO_GRENZEN.datenText, "daten-text");
    if ("datenschutzUrl" in i) s.inhalt.datenschutzUrl = url(i.datenschutzUrl, "datenschutz-url");
    if ("hinweise" in i) s.inhalt.hinweise = text(i.hinweise, STUDIO_GRENZEN.hinweise, "hinweise");
    if ("alterEigen" in i) { if (![0, 6, 12, 16, 18].includes(i.alterEigen)) throw fehler("alter"); s.inhalt.alterEigen = i.alterEigen; }
  }
  if (k.technik) {
    const t = k.technik;
    if ("engine" in t) { if (t.engine !== "" && !ENGINES.includes(t.engine)) throw fehler("engine"); s.technik.engine = t.engine; }
    if ("eingabe" in t) s.technik.eingabe = auswahl(t.eingabe, EINGABEN, "eingabe");
    if ("format" in t) { if (!FORMATE.includes(t.format)) throw fehler("format"); s.technik.format = t.format; }
    if ("internet" in t) s.technik.internet = t.internet === true;
    if ("speichern" in t) s.technik.speichern = t.speichern === true;
    if ("hinweise" in t) s.technik.hinweise = text(t.hinweise, STUDIO_GRENZEN.hinweise, "technik-hinweise");
  }
  if (k.rechte) {
    const r = k.rechte;
    if ("lizenzen" in r) s.rechte.lizenzen = text(r.lizenzen, STUDIO_GRENZEN.lizenzen, "lizenzen");
    if ("eigene" in r) {
      s.rechte.eigene = r.eigene === true;
      s.rechte.bestaetigt = r.eigene === true ? (alt.rechte.bestaetigt || new Date().toISOString()) : null;
    }
  }
  return s;
}

// Was fehlt noch bis zum Einreichen? Je Schritt ok und die fehlenden Felder.
export function checkliste(projekt, genres) {
  const s = projekt.entwurf;
  const m = s.medien;
  const i = s.inhalt;
  const fehlt = (bedingungen) => Object.entries(bedingungen).filter(([, ok]) => !ok).map(([k]) => k);
  const schritte = {
    seite: fehlt({
      name: s.name.length >= 2, kurz: s.kurz.length >= 20, lang: s.lang.length >= 100,
      genre: genres.includes(s.genre), tags: s.tags.length >= 1, sprachen: s.sprachen.length >= 1, geraete: s.geraete.length >= 1
    }),
    grafiken: fehlt({ icon: !!m.icon, header: !!m.header, kapsel: !!m.kapsel, screens: m.screens.length >= 3 }),
    inhalt: fehlt({
      ...Object.fromEntries(Object.keys(FRAGEN).map((f) => [f, i[f] !== null])),
      kiText: i.ki !== "ja" || i.kiText.length >= 10
    }),
    rechte: fehlt({
      rechte: s.rechte.eigene === true,
      datenText: i.daten !== "ja" || i.datenText.length >= 20,
      datenschutzUrl: i.daten !== "ja" || !!i.datenschutzUrl
    }),
    technik: fehlt({ engine: !!s.technik.engine, eingabe: s.technik.eingabe.length >= 1 }),
    build: fehlt({ build: !!projekt.entwurfBuild && projekt.builds.some((b) => b.id === projekt.entwurfBuild) }),
    datum: fehlt({ datum: projekt.veroeffentlichung.modus === "sofort" || /^\d{4}-\d{2}-\d{2}$/.test(projekt.veroeffentlichung.datum || "") })
  };
  return { schritte, fertig: Object.values(schritte).every((x) => !x.length) };
}

// Ein paar automatische Pruefungen des Builds, wie die Hinweise bei itch.io.
export function buildBericht(ordner, start) {
  const bericht = [];
  let html = "";
  try { html = readFileSync(join(ordner, ...start.split("/")), "utf8").slice(0, 400000); } catch { return [{ stufe: "fehler", text: "index-unlesbar" }]; }
  if (/\s(?:src|href)\s*=\s*["']\/(?!\/)/i.test(html)) bericht.push({ stufe: "warnung", text: "absolute-pfade" });
  if (/\s(?:src|href)\s*=\s*["']http:\/\//i.test(html)) bericht.push({ stufe: "warnung", text: "http-quellen" });
  if (/UnityLoader|createUnityInstance/i.test(html)) bericht.push({ stufe: "info", text: "engine-unity" });
  if (/godot|\bEngine\(\s*GODOT_CONFIG/i.test(html)) bericht.push({ stufe: "info", text: "engine-godot" });
  if (/SharedArrayBuffer|crossOriginIsolated/i.test(html)) bericht.push({ stufe: "warnung", text: "threads" });
  if (!/<meta[^>]+viewport/i.test(html)) bericht.push({ stufe: "info", text: "kein-viewport" });
  return bericht;
}

function kopie(x) { return JSON.parse(JSON.stringify(x)); }
function heute(t) { return new Date(t).toISOString().slice(0, 10); }

// ---- Anwendung ------------------------------------------------------------------
// optionen:
//   ordner, passwort, herkunft, adminSchutz (wie die anderen Dienste)
//   konten        wer(req), nameVon(id), emailVon(id)
//   verwaltung    einstellungen(), empfaenger(), oeffentlicheEinstellungen()
//   post          schicken({ an, betreff, text })
//   spieleAdresse "https://play.miwale.com"; leer: keine Builds (ausser lokal)
//   lokal         true im Vite-Server: Builds auch ohne eigene Spiele-Adresse
//   adresse       "https://miwale.com" fuer Links in E-Mails
//   festeIds      IDs der festen Spiele; als Slug tabu
//   jetzt         nur Tests
export function studioBauen(optionen) {
  const basis = join(optionen.ordner, "studio");
  const medienOrdner = join(basis, "medien");
  const buildsOrdner = join(basis, "builds");
  // web/ ist die Wurzel fuer nginx unter play.miwale.com (docker/studio-spiel.conf):
  //   web/community/<slug> -> ../../builds/<live-build>   (je Spiel ein Verweis)
  //   web/vorschau         -> ../builds                   (Testlinks fuer Entwickler und Pruefung)
  const webOrdner = join(basis, "web");
  const liveOrdner = join(webOrdner, "community");
  const tmpOrdner = join(basis, "tmp");
  for (const o of [basis, medienOrdner, buildsOrdner, liveOrdner, tmpOrdner]) mkdirSync(o, { recursive: true });
  if (process.platform !== "win32") {
    try { if (!existsSync(join(webOrdner, "vorschau"))) symlinkSync(join("..", "builds"), join(webOrdner, "vorschau"), "dir"); }
    catch (e) { console.error("Verweis web/vorschau:", e.message); }
  }
  const datei = join(basis, "projekte.json");
  const daten = existsSync(datei) ? JSON.parse(readFileSync(datei, "utf8")) : { projekte: [] };
  const speichern = () => sicherSchreiben(datei, daten);
  const jetzt = optionen.jetzt || (() => Date.now());
  const begrenzt = tempoGrenze(jetzt);
  const admin = optionen.adminSchutz || adminSchutz(jetzt);
  const festeIds = new Set(optionen.festeIds || []);
  const adresse = optionen.adresse || "https://miwale.com";
  const einstellungen = () => (optionen.verwaltung ? optionen.verwaltung.einstellungen() : { studio: { offen: true, maxBuildMb: 300, maxProjekte: 5 }, genres: ["Action", "Puzzle"], spiele: { versteckt: [], hervorgehoben: [] }, meldungAn: [] });
  const genres = () => einstellungen().genres;
  const nameVon = (id) => (optionen.konten && optionen.konten.nameVon ? optionen.konten.nameVon(id) : null);
  const emailVon = (id) => (optionen.konten && optionen.konten.emailVon ? optionen.konten.emailVon(id) : null);
  const buildsMoeglich = () => !!optionen.spieleAdresse || optionen.lokal === true;
  const zeit = () => new Date(jetzt()).toISOString();

  // Alte Zwischendateien (abgebrochene Uploads) beim Start entfernen.
  try { rmSync(tmpOrdner, { recursive: true, force: true }); mkdirSync(tmpOrdner, { recursive: true }); } catch { /* egal */ }

  const projektVon = (id) => daten.projekte.find((p) => p.id === id) || null;
  const slugFrei = (slug, ausser) => SLUG_RE.test(slug) && !RESERVIERT.has(slug) && !festeIds.has(slug) &&
    !daten.projekte.some((p) => p !== ausser && (p.slug === slug || (p.alteSlugs || []).includes(slug)));

  function verlauf(p, wer, aktion, notiz) {
    p.verlauf.unshift({ zeit: zeit(), wer, aktion, notiz: notiz || "" });
    p.verlauf = p.verlauf.slice(0, 100);
  }

  // Wird eine Mediendatei noch irgendwo gebraucht (Entwurf, Einreichung, live)?
  function benutzt(p, dateiName) {
    const seiten = [p.entwurf, p.live, p.einreichung && p.einreichung.seite].filter(Boolean);
    return seiten.some((s) => Object.values(s.medien).some((w) => (Array.isArray(w) ? w.includes(dateiName) : w === dateiName)));
  }
  function medienAufraeumen(p, dateiName) {
    if (dateiName && !benutzt(p, dateiName)) { try { unlinkSync(join(medienOrdner, p.id, dateiName)); } catch { /* weg */ } }
  }
  function buildAufraeumen(p) {
    const behalten = new Set([p.entwurfBuild, p.liveBuild, p.einreichung && p.einreichung.build].filter(Boolean));
    while (p.builds.length > STUDIO_GRENZEN.buildsJeProjekt) {
      const alt = p.builds.find((b) => !behalten.has(b.id));
      if (!alt) break;
      p.builds.splice(p.builds.indexOf(alt), 1);
      rmSync(join(buildsOrdner, alt.id), { recursive: true, force: true });
    }
  }

  // Der Verweis live/<slug> zeigt auf den veroeffentlichten Build. nginx liefert
  // daraus /community/<slug>/ unter play.miwale.com aus.
  // Lokal unter Windows gibt es keinen Verweis: der Vite-Server fragt liveOrdner().
  function verweisWeg(pfad) {
    try { if (lstatSync(pfad).isSymbolicLink()) unlinkSync(pfad); } catch { /* gibt es nicht */ }
  }
  function liveVerweis(p) {
    if (process.platform === "win32") return;
    const ziel = join(liveOrdner, p.slug);
    verweisWeg(ziel);
    for (const alt of p.alteSlugs || []) verweisWeg(join(liveOrdner, alt));
    if (!p.live || !p.liveBuild || p.gesperrt) return;
    try {
      const zwischen = ziel + ".neu";
      verweisWeg(zwischen);
      symlinkSync(join("..", "..", "builds", p.liveBuild), zwischen, "dir");
      renameSync(zwischen, ziel);
    } catch (e) { console.error("live-Verweis fuer " + p.slug + ":", e.message); }
  }

  const buildVon = (p, id) => p.builds.find((b) => b.id === id) || null;

  // ---- Ansichten ----
  function zusammenfassung(p) {
    const c = checkliste(p, genres());
    return {
      id: p.id, slug: p.slug, name: p.entwurf.name, status: p.status, live: !!p.live, gesperrt: !!p.gesperrt,
      icon: p.entwurf.medien.icon ? medienUrl(p, p.entwurf.medien.icon) : "",
      geaendert: p.geaendert, erstellt: p.erstellt, fertig: c.fertig,
      einreichung: p.einreichung ? { zeit: p.einreichung.zeit } : null
    };
  }
  const medienUrl = (p, d) => (d ? "/api/studio/medien/" + p.id + "/" + d : "");
  function seiteMitUrls(p, s) {
    const m = s.medien;
    return { ...s, medien: { ...Object.fromEntries(Object.entries(m).map(([k, v]) => [k, Array.isArray(v) ? v.map((d) => medienUrl(p, d)) : medienUrl(p, v)])) }, alter: alterAus(s.inhalt), hinweiseListe: hinweiseAus(s.inhalt) };
  }
  function buildAnsicht(b) {
    return { ...b, vorschau: (optionen.spieleAdresse || "") + "/vorschau/" + b.id + "/" + (b.start === "index.html" ? "" : b.start) };
  }
  function voll(p, fuerAdmin) {
    return {
      id: p.id, slug: p.slug, status: p.status, gesperrt: p.gesperrt || null, erstellt: p.erstellt, geaendert: p.geaendert,
      entwurf: seiteMitUrls(p, p.entwurf),
      live: p.live ? seiteMitUrls(p, p.live) : null,
      liveSeit: p.liveSeit || null,
      builds: p.builds.map(buildAnsicht),
      entwurfBuild: p.entwurfBuild, liveBuild: p.liveBuild,
      einreichung: p.einreichung ? { zeit: p.einreichung.zeit, build: p.einreichung.build, notiz: p.einreichung.notiz, seite: seiteMitUrls(p, p.einreichung.seite) } : null,
      pruefung: p.pruefung,
      veroeffentlichung: p.veroeffentlichung,
      verlauf: p.verlauf,
      checkliste: checkliste(p, genres()),
      adresse: "/games/" + p.slug,
      ...(fuerAdmin ? { besitzer: { id: p.besitzer, name: nameVon(p.besitzer), email: emailVon(p.besitzer) || "" }, pruefNotiz: p.pruefNotiz || "" } : {})
    };
  }

  // ---- Katalog fuer die Spieleseite ----
  function katalog() {
    const t = jetzt();
    return daten.projekte.filter((p) => p.live && !p.gesperrt && p.liveBuild).map((p) => {
      const s = p.live;
      const b = buildVon(p, p.liveBuild) || { start: "index.html" };
      const datum = p.veroeffentlichung.modus === "datum" && p.veroeffentlichung.datum ? p.veroeffentlichung.datum : (p.liveSeit || zeit()).slice(0, 10);
      const textBlock = { kurz: s.kurz, tags: s.tags, ueber: s.lang.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean), features: s.features, steuerung: s.steuerung };
      const screens = s.medien.screens.map((d) => medienUrl(p, d));
      return {
        id: p.slug,
        name: s.name,
        community: true,
        veroeffentlicht: datum,
        demnaechst: datum > heute(t),
        geraete: s.geraete,
        status: { en: "Community game", de: "Community-Spiel" },
        spielen: "/community/" + p.slug + "/" + (b.start === "index.html" ? "" : b.start),
        bild: medienUrl(p, s.medien.header),
        icon: medienUrl(p, s.medien.icon),
        kapsel: medienUrl(p, s.medien.kapsel),
        kapselKlein: medienUrl(p, s.medien.kapselKlein),
        kapselHoch: medienUrl(p, s.medien.kapselHoch),
        bilder: screens,
        medien: { trailer: medienUrl(p, s.medien.trailer), poster: screens[0] || "", screens },
        texte: { en: textBlock, de: textBlock },
        genre: s.genre,
        sprachen: s.sprachen,
        entwickler: { name: s.entwickler || nameVon(p.besitzer) || "", profil: nameVon(p.besitzer) || "" },
        webseite: s.webseite,
        inhalt: {
          alter: alterAus(s.inhalt), hinweise: hinweiseAus(s.inhalt), text: s.inhalt.hinweise,
          kiText: s.inhalt.ki === "ja" ? s.inhalt.kiText : "", datenText: s.inhalt.daten === "ja" ? s.inhalt.datenText : "",
          datenschutzUrl: s.inhalt.daten === "ja" ? s.inhalt.datenschutzUrl : ""
        },
        technik: { engine: s.technik.engine, eingabe: s.technik.eingabe, internet: s.technik.internet, speichern: s.technik.speichern }
      };
    }).sort((a, b) => b.veroeffentlicht.localeCompare(a.veroeffentlicht));
  }

  function katalogJs() {
    const seite = optionen.verwaltung ? optionen.verwaltung.oeffentlicheEinstellungen() : { banner: { an: false }, spiele: { versteckt: [], hervorgehoben: [] } };
    // "<" maskieren: die Datei ist zwar kein Inline-Skript, aber sicher ist sicher.
    const js = (x) => JSON.stringify(x).replace(/</g, "\\u003c");
    return "// Erzeugt von server/studio.mjs: veroeffentlichte Community-Spiele und Einstellungen der Seite.\n" +
      "window.MIWALE_COMMUNITY = " + js(katalog()) + ";\n" +
      "window.MIWALE_SEITE = " + js({ banner: seite.banner, spiele: seite.spiele, studio: { offen: seite.studio ? seite.studio.offen : true } }) + ";\n";
  }

  // ---- Benachrichtigungen ----
  function adminMelden(p) {
    if (!optionen.post || !optionen.verwaltung) return;
    const an = optionen.verwaltung.empfaenger();
    const s = p.einreichung.seite;
    optionen.post.schicken({
      an, art: "einreichung",
      betreff: "miwale: Neue Einreichung – " + s.name,
      text: "Neue Einreichung im miwale Studio.\n\n" +
        "Spiel: " + s.name + "\n" +
        "Von: " + (nameVon(p.besitzer) || "?") + (s.entwickler ? " (" + s.entwickler + ")" : "") + "\n" +
        "Genre: " + s.genre + "\n" +
        "Altersempfehlung: " + alterAus(s.inhalt) + "\n" +
        "Art: " + (p.live ? "Update eines veröffentlichten Spiels" : "Neues Spiel") + "\n" +
        (p.einreichung.notiz ? "Notiz: " + p.einreichung.notiz + "\n" : "") +
        "\nPrüfen: " + adresse + "/admin/#einreichung/" + p.id + "\n"
    });
  }
  function entwicklerMelden(p, betreff, text) {
    const email = emailVon(p.besitzer);
    if (!optionen.post || !email) return;
    optionen.post.schicken({ an: [email], art: "entwickler", betreff, text });
  }

  // ---- Upload in eine Datei, mit Obergrenze ----
  async function zuDatei(req, pfad, max) {
    const laenge = Number(req.headers["content-length"] || 0);
    if (laenge > max) throw fehler("zu-gross", 413);
    const ws = createWriteStream(pfad);
    let n = 0;
    try {
      for await (const stueck of req) {
        n += stueck.length;
        if (n > max) throw fehler("zu-gross", 413);
        if (!ws.write(stueck)) await once(ws, "drain");
      }
      ws.end();
      await once(ws, "finish");
    } catch (e) {
      ws.destroy();
      try { unlinkSync(pfad); } catch { /* egal */ }
      throw e;
    }
    return n;
  }

  // ---- Anfragen ----
  async function verarbeiten(req, res) {
    const url = new URL(req.url, "http://lokal");
    const teile = url.pathname.replace(/^\/api\/studio\/?/, "").split("/").filter(Boolean);

    if (teile[0] === "katalog.js" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "public, max-age=30", "X-Content-Type-Options": "nosniff" });
      res.end(katalogJs());
      return null;
    }
    if (teile[0] === "katalog" && req.method === "GET") return [200, { spiele: katalog() }];

    // Medien: live-Medien fuer alle; Entwurf nur Besitzer und Verwaltung.
    if (teile[0] === "medien" && req.method === "GET" && teile.length === 3) {
      const p = ID_RE.test(teile[1]) ? projektVon(teile[1]) : null;
      if (!p || !DATEI_RE.test(teile[2])) return [404, { fehler: "nicht-gefunden" }];
      const liveListe = p.live && !p.gesperrt ? Object.values(p.live.medien).flat() : [];
      const k = optionen.konten ? optionen.konten.wer(req) : null;
      const darf = liveListe.includes(teile[2]) || (k && k.id === p.besitzer) || admin(req, optionen.passwort) === "ok";
      if (!darf) return [404, { fehler: "nicht-gefunden" }];
      const pfad = join(medienOrdner, p.id, teile[2]);
      let groesse;
      try { groesse = statSync(pfad).size; } catch { return [404, { fehler: "nicht-gefunden" }]; }
      const typ = TYPEN[extname(teile[2]).slice(1)];
      const koepfe = {
        "Content-Type": typ.mime, "X-Content-Type-Options": "nosniff", "Accept-Ranges": "bytes",
        "Cache-Control": liveListe.includes(teile[2]) ? "public, max-age=31536000, immutable" : "private, no-store",
        "Content-Security-Policy": "default-src 'none'; sandbox"
      };
      // Videos brauchen Range-Anfragen (Safari spielt sonst gar nicht ab).
      const range = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range || ""));
      if (range && (range[1] || range[2])) {
        let start = range[1] ? Number(range[1]) : Math.max(0, groesse - Number(range[2]));
        let ende = range[1] && range[2] ? Math.min(Number(range[2]), groesse - 1) : groesse - 1;
        if (start > ende || start >= groesse) { res.writeHead(416, { "Content-Range": "bytes */" + groesse }); res.end(); return null; }
        res.writeHead(206, { ...koepfe, "Content-Range": "bytes " + start + "-" + ende + "/" + groesse, "Content-Length": ende - start + 1 });
        createReadStream(pfad, { start, end: ende }).pipe(res);
        return null;
      }
      res.writeHead(200, { ...koepfe, "Content-Length": groesse });
      createReadStream(pfad).pipe(res);
      return null;
    }

    // ---- Verwaltung ----
    if (teile[0] === "admin") {
      const neinAdmin = adminAbweisung(admin(req, optionen.passwort));
      if (neinAdmin) return neinAdmin;
      return adminVerarbeiten(req, teile.slice(1));
    }

    if (teile[0] === "status" && req.method === "GET") {
      const k = optionen.konten ? optionen.konten.wer(req) : null;
      const e = einstellungen();
      return [200, {
        konto: k ? { name: k.name, gesperrt: k.gesperrt } : null,
        offen: e.studio.offen !== false,
        builds: buildsMoeglich(),
        grenzen: { maxBuildMb: e.studio.maxBuildMb, maxProjekte: e.studio.maxProjekte, bildMb: STUDIO_GRENZEN.bildBytes / 1048576, videoMb: STUDIO_GRENZEN.videoBytes / 1048576, screens: STUDIO_GRENZEN.screens, tags: STUDIO_GRENZEN.tags },
        hinweis: { de: e.studio.hinweisDe || "", en: e.studio.hinweisEn || "" },
        genres: e.genres,
        listen: { sprachen: SPRACHEN, geraete: GERAETE, eingaben: EINGABEN, engines: ENGINES, formate: FORMATE, fragen: FRAGEN, medien: MEDIEN_ARTEN }
      }];
    }

    // ---- Ab hier: Entwickler mit Konto ----
    const konto = optionen.konten ? optionen.konten.wer(req) : null;
    if (!konto) return [401, { fehler: "anmelden" }];
    if (konto.gesperrt) return [403, { fehler: "konto-gesperrt" }];
    if (req.method !== "GET" && begrenzt("schreiben|" + konto.id, STUDIO_GRENZEN.schreibenProFenster)) return [429, { fehler: "zu-schnell" }];
    const eigene = daten.projekte.filter((p) => p.besitzer === konto.id);

    if (teile[0] === "projekte" && !teile[1]) {
      if (req.method === "GET") return [200, { projekte: eigene.map(zusammenfassung) }];
      if (req.method === "POST") {
        const e = einstellungen();
        if (e.studio.offen === false) return [403, { fehler: "studio-zu" }];
        if (eigene.length >= e.studio.maxProjekte) return [409, { fehler: "zu-viele-projekte" }];
        const k = await lesen(req);
        const s = seitePruefen({ name: k.name }, leereSeite(), genres(), sperrlisteLesen(optionen.ordner));
        let slug = slugAus(s.name);
        if (slug.length < 3) slug = (slug + "-spiel").replace(/^-/, "");
        let versuch = slug, n = 2;
        while (!slugFrei(versuch)) versuch = slug.slice(0, 36) + "-" + n++;
        const p = {
          id: randomUUID(), slug: versuch, besitzer: konto.id, erstellt: zeit(), geaendert: zeit(),
          status: "entwurf", gesperrt: null, entwurf: s, live: null, liveSeit: null,
          builds: [], entwurfBuild: null, liveBuild: null, einreichung: null,
          pruefung: { seite: null, build: null, nachricht: "", zeit: null, wer: null },
          veroeffentlichung: { modus: "sofort", datum: "" }, verlauf: [], alteSlugs: []
        };
        verlauf(p, konto.name, "angelegt");
        daten.projekte.push(p);
        speichern();
        return [201, voll(p)];
      }
    }

    if (teile[0] !== "projekte" || !ID_RE.test(teile[1] || "")) return [404, { fehler: "unbekannt" }];
    const p = projektVon(teile[1]);
    if (!p || p.besitzer !== konto.id) return [404, { fehler: "nicht-gefunden" }];
    const unter = teile[2] || "";
    const geaendert = () => { p.geaendert = zeit(); speichern(); };
    // Waehrend der Pruefung bleibt der Entwurf stehen; sonst prueft die Verwaltung etwas anderes, als live geht.
    const gesperrtFuerAenderung = () => (p.status === "eingereicht" ? [409, { fehler: "in-pruefung" }] : null);

    if (!unter && req.method === "GET") return [200, voll(p)];

    if (!unter && req.method === "DELETE") {
      const k = await lesen(req);
      if (k.bestaetigt !== true) return [400, { fehler: "bestaetigen" }];
      projektLoeschen(p);
      return [200, { ok: true }];
    }

    if (unter === "seite" && req.method === "PUT") {
      const halt = gesperrtFuerAenderung(); if (halt) return halt;
      const k = await lesen(req, 64 * 1024);
      p.entwurf = seitePruefen(k, p.entwurf, genres(), sperrlisteLesen(optionen.ordner));
      if (p.status === "abgelehnt" || p.status === "freigegeben") p.status = "entwurf";
      geaendert();
      return [200, voll(p)];
    }

    if (unter === "slug" && req.method === "PUT") {
      const k = await lesen(req);
      const slug = String(k.slug || "");
      if (slug === p.slug) return [200, voll(p)];
      if (!slugFrei(slug, p)) return [409, { fehler: "slug-vergeben" }];
      // Nach der Veroeffentlichung bleibt die alte Adresse reserviert (Links!).
      if (p.live) p.alteSlugs = [...new Set([...(p.alteSlugs || []), p.slug])].slice(-5);
      const alterSlug = p.slug;
      p.slug = slug;
      liveVerweis(p);
      // "versteckt"/"hervorgehoben" der Verwaltung haengen am Slug: mitnehmen.
      if (optionen.verwaltung && optionen.verwaltung.slugGeaendert) optionen.verwaltung.slugGeaendert(alterSlug, slug);
      geaendert();
      return [200, voll(p)];
    }

    if (unter === "medien" && req.method === "POST") {
      const halt = gesperrtFuerAenderung(); if (halt) return halt;
      const art = url.searchParams.get("art") || "";
      if (!Object.hasOwn(MEDIEN_ARTEN, art)) return [400, { fehler: "art" }];
      if (begrenzt("upload|" + konto.id, STUDIO_GRENZEN.uploadsProFenster)) return [429, { fehler: "zu-schnell" }];
      if (art === "screen" && p.entwurf.medien.screens.length >= STUDIO_GRENZEN.screens) return [409, { fehler: "zu-viele-screens" }];
      const video = MEDIEN_ARTEN[art].video;
      const roh = await lesenRoh(req, video ? STUDIO_GRENZEN.videoBytes : STUDIO_GRENZEN.bildBytes);
      const typ = medienTyp(roh);
      if (!typ || !!TYPEN[typ].video !== video) return [415, { fehler: video ? "video-format" : "bild-format" }];
      const name = randomBytes(10).toString("hex") + "." + typ;
      mkdirSync(join(medienOrdner, p.id), { recursive: true });
      writeFileSync(join(medienOrdner, p.id, name), roh);
      const m = p.entwurf.medien;
      if (art === "screen") m.screens.push(name);
      else { const alt = m[art]; m[art] = name; medienAufraeumen(p, alt); }
      if (p.status === "abgelehnt" || p.status === "freigegeben") p.status = "entwurf";
      geaendert();
      return [201, voll(p)];
    }

    if (unter === "medien" && req.method === "DELETE" && DATEI_RE.test(teile[3] || "")) {
      const halt = gesperrtFuerAenderung(); if (halt) return halt;
      const d = teile[3];
      const m = p.entwurf.medien;
      for (const k of Object.keys(m)) {
        if (Array.isArray(m[k])) m[k] = m[k].filter((x) => x !== d);
        else if (m[k] === d) m[k] = "";
      }
      medienAufraeumen(p, d);
      geaendert();
      return [200, voll(p)];
    }

    // Reihenfolge der Screenshots.
    if (unter === "screens" && req.method === "PUT") {
      const halt = gesperrtFuerAenderung(); if (halt) return halt;
      const k = await lesen(req);
      const neu = Array.isArray(k.screens) ? k.screens.map((x) => String(x).split("/").pop()) : null;
      const alt = p.entwurf.medien.screens;
      if (!neu || neu.length !== alt.length || !neu.every((x) => alt.includes(x))) return [400, { fehler: "screens" }];
      p.entwurf.medien.screens = neu;
      geaendert();
      return [200, voll(p)];
    }

    if (unter === "builds" && req.method === "POST" && !teile[3]) {
      const halt = gesperrtFuerAenderung(); if (halt) return halt;
      if (!buildsMoeglich()) return [503, { fehler: "keine-spiele-adresse" }];
      if (einstellungen().studio.offen === false) return [403, { fehler: "studio-zu" }];
      if (begrenzt("build|" + konto.id, 20)) return [429, { fehler: "zu-schnell" }];
      const max = einstellungen().studio.maxBuildMb * 1024 * 1024;
      const id = randomBytes(12).toString("hex");
      const zip = join(tmpOrdner, id + ".zip");
      const groesseZip = await zuDatei(req, zip, max);
      const ziel = join(buildsOrdner, id);
      let ergebnis;
      try {
        ergebnis = await entpacken(zip, ziel, { dateien: 5000, entpackt: Math.min(4 * max, 2 * 1024 * 1024 * 1024), verhaeltnis: 400 });
      } catch (e) {
        rmSync(ziel, { recursive: true, force: true });
        throw e.status ? e : fehler("zip-kaputt", 422);
      } finally { try { unlinkSync(zip); } catch { /* egal */ } }
      const notiz = textPruefen(url.searchParams.get("notiz") || "", 200) || "";
      const b = { id, hochgeladen: zeit(), zip: groesseZip, groesse: ergebnis.groesse, dateien: ergebnis.dateien, start: ergebnis.start, notiz, bericht: buildBericht(ziel, ergebnis.start) };
      p.builds.unshift(b);
      p.entwurfBuild = id;
      buildAufraeumen(p);
      verlauf(p, konto.name, "build", notiz);
      if (p.status === "abgelehnt" || p.status === "freigegeben") p.status = "entwurf";
      geaendert();
      return [201, voll(p)];
    }

    if (unter === "build" && req.method === "PUT") {
      const halt = gesperrtFuerAenderung(); if (halt) return halt;
      const k = await lesen(req);
      if (!buildVon(p, k.build)) return [404, { fehler: "build" }];
      p.entwurfBuild = k.build;
      if (p.status === "abgelehnt" || p.status === "freigegeben") p.status = "entwurf";
      geaendert();
      return [200, voll(p)];
    }

    if (unter === "builds" && req.method === "DELETE" && BUILD_RE.test(teile[3] || "")) {
      const b = buildVon(p, teile[3]);
      if (!b) return [404, { fehler: "build" }];
      if (b.id === p.liveBuild || (p.status === "eingereicht" && p.einreichung && p.einreichung.build === b.id)) return [409, { fehler: "build-in-benutzung" }];
      p.builds.splice(p.builds.indexOf(b), 1);
      if (p.entwurfBuild === b.id) p.entwurfBuild = p.builds[0] ? p.builds[0].id : null;
      rmSync(join(buildsOrdner, b.id), { recursive: true, force: true });
      geaendert();
      return [200, voll(p)];
    }

    if (unter === "veroeffentlichung" && req.method === "PUT") {
      const k = await lesen(req);
      if (k.modus === "sofort") p.veroeffentlichung = { modus: "sofort", datum: "" };
      else if (k.modus === "datum" && /^\d{4}-\d{2}-\d{2}$/.test(k.datum || "") && !Number.isNaN(Date.parse(k.datum)) && k.datum <= heute(jetzt() + 2 * 365 * TAG)) p.veroeffentlichung = { modus: "datum", datum: k.datum };
      else return [400, { fehler: "datum" }];
      geaendert();
      return [200, voll(p)];
    }

    if (unter === "einreichen" && req.method === "POST") {
      if (p.gesperrt) return [403, { fehler: "projekt-gesperrt" }];
      if (p.status === "eingereicht") return [409, { fehler: "schon-eingereicht" }];
      if (einstellungen().studio.offen === false) return [403, { fehler: "studio-zu" }];
      const c = checkliste(p, genres());
      if (!c.fertig) return [422, { fehler: "unvollstaendig", checkliste: c }];
      const k = await lesen(req);
      const notiz = textPruefen(k.notiz || "", STUDIO_GRENZEN.notiz);
      if (notiz === null) return [400, { fehler: "notiz" }];
      p.einreichung = { zeit: zeit(), seite: kopie(p.entwurf), build: p.entwurfBuild, notiz };
      p.status = "eingereicht";
      p.pruefung = { seite: null, build: null, nachricht: "", zeit: null, wer: null, punkte: {} };
      verlauf(p, konto.name, "eingereicht", notiz);
      geaendert();
      adminMelden(p);
      return [200, voll(p)];
    }

    if (unter === "zurueckziehen" && req.method === "POST") {
      if (p.status !== "eingereicht") return [409, { fehler: "nicht-eingereicht" }];
      p.status = "entwurf";
      verlauf(p, konto.name, "zurueckgezogen");
      geaendert();
      return [200, voll(p)];
    }

    if (unter === "veroeffentlichen" && req.method === "POST") {
      if (p.gesperrt) return [403, { fehler: "projekt-gesperrt" }];
      if (p.status !== "freigegeben" || !p.einreichung) return [409, { fehler: "nicht-freigegeben" }];
      const erstes = !p.live;
      p.live = kopie(p.einreichung.seite);
      p.liveBuild = p.einreichung.build;
      p.liveSeit = p.liveSeit || zeit();
      p.status = "entwurf";
      p.veroeffentlicht = zeit();
      verlauf(p, konto.name, erstes ? "veroeffentlicht" : "update-veroeffentlicht");
      buildAufraeumen(p);
      liveVerweis(p);
      geaendert();
      return [200, voll(p)];
    }

    // Aus dem Katalog nehmen (der Entwickler selbst). Kommt mit der naechsten Veroeffentlichung zurueck.
    if (unter === "zurueckziehen-live" && req.method === "POST") {
      if (!p.live) return [409, { fehler: "nicht-live" }];
      p.live = null;
      p.liveBuild = null;
      verlauf(p, konto.name, "aus-dem-katalog");
      liveVerweis(p);
      geaendert();
      return [200, voll(p)];
    }

    return [404, { fehler: "unbekannt" }];
  }

  // ---- Verwaltung ----
  async function adminVerarbeiten(req, teile) {
    if (teile[0] === "projekte" && !teile[1] && req.method === "GET") {
      const reihenfolge = { eingereicht: 0, abgelehnt: 2, freigegeben: 1, entwurf: 3 };
      const liste = daten.projekte.slice().sort((a, b) => (reihenfolge[a.status] - reihenfolge[b.status]) || (b.geaendert || "").localeCompare(a.geaendert || ""));
      return [200, { projekte: liste.map((p) => ({ ...zusammenfassung(p), besitzer: nameVon(p.besitzer) })) }];
    }
    const p = ID_RE.test(teile[1] || "") ? projektVon(teile[1]) : null;
    if (teile[0] !== "projekte" || !p) return [404, { fehler: "nicht-gefunden" }];
    const unter = teile[2] || "";
    const wer = (optionen.verwaltung && optionen.verwaltung.wer(req)) || { name: "verwaltung" };

    if (!unter && req.method === "GET") return [200, voll(p, true)];

    if (unter === "pruefung" && req.method === "POST") {
      if (p.status !== "eingereicht" || !p.einreichung) return [409, { fehler: "nicht-eingereicht" }];
      const k = await lesen(req, 32 * 1024);
      const wert = (x) => (x === "ok" || x === "abgelehnt" || x === null ? x : undefined);
      const seite = wert(k.seite), build = wert(k.build);
      if (seite === undefined || build === undefined) return [400, { fehler: "pruefung" }];
      const nachricht = textPruefen(k.nachricht || "", STUDIO_GRENZEN.nachricht);
      const notiz = textPruefen(k.notiz || "", STUDIO_GRENZEN.nachricht);
      if (nachricht === null || notiz === null) return [400, { fehler: "nachricht" }];
      const punkte = k.punkte && typeof k.punkte === "object" && !Array.isArray(k.punkte)
        ? Object.fromEntries(Object.entries(k.punkte).slice(0, 40).filter(([n, v]) => /^[a-z0-9-]{1,40}$/.test(n) && typeof v === "boolean")) : {};
      p.pruefung = { seite, build, nachricht, zeit: zeit(), wer: wer.name, punkte };
      p.pruefNotiz = notiz;
      const fertig = seite !== null && build !== null;
      if (fertig) {
        p.status = seite === "ok" && build === "ok" ? "freigegeben" : "abgelehnt";
        verlauf(p, "Prüfung", p.status, nachricht);
        const name = p.einreichung.seite.name;
        if (p.status === "freigegeben") {
          entwicklerMelden(p, "miwale: " + name + " ist freigegeben",
            "Gute Nachricht: Dein Spiel \"" + name + "\" hat die Prüfung bestanden.\n\n" +
            (nachricht ? "Nachricht der Prüfung:\n" + nachricht + "\n\n" : "") +
            "Du kannst es jetzt im Studio veröffentlichen: " + adresse + "/studio/" + p.id + "\n");
        } else {
          entwicklerMelden(p, "miwale: " + name + " braucht noch Änderungen",
            "Dein Spiel \"" + name + "\" wurde noch nicht freigegeben.\n\n" +
            "Store-Seite: " + (seite === "ok" ? "in Ordnung" : "braucht Änderungen") + "\n" +
            "Build: " + (build === "ok" ? "in Ordnung" : "braucht Änderungen") + "\n\n" +
            (nachricht ? "Nachricht der Prüfung:\n" + nachricht + "\n\n" : "") +
            "Ändere es im Studio und reiche es erneut ein: " + adresse + "/studio/" + p.id + "\n");
        }
      }
      p.geaendert = zeit();
      speichern();
      return [200, voll(p, true)];
    }

    if (unter === "sperren" && req.method === "POST") {
      const k = await lesen(req);
      if (typeof k.gesperrt !== "boolean") return [400, { fehler: "format" }];
      const grund = textPruefen(k.grund || "", 1000);
      if (grund === null) return [400, { fehler: "grund" }];
      p.gesperrt = k.gesperrt ? { zeit: zeit(), grund, wer: wer.name } : null;
      verlauf(p, "Verwaltung", k.gesperrt ? "gesperrt" : "entsperrt", grund);
      liveVerweis(p);
      p.geaendert = zeit();
      speichern();
      if (k.gesperrt) entwicklerMelden(p, "miwale: " + p.entwurf.name + " wurde gesperrt", "Dein Spiel \"" + p.entwurf.name + "\" ist nicht mehr auf miwale.com zu sehen.\n\n" + (grund ? "Grund: " + grund + "\n" : ""));
      return [200, voll(p, true)];
    }

    if (!unter && req.method === "DELETE") {
      projektLoeschen(p);
      return [200, { ok: true }];
    }
    return [404, { fehler: "unbekannt" }];
  }

  function projektLoeschen(p) {
    p.live = null;
    liveVerweis(p);
    for (const b of p.builds) rmSync(join(buildsOrdner, b.id), { recursive: true, force: true });
    rmSync(join(medienOrdner, p.id), { recursive: true, force: true });
    daten.projekte.splice(daten.projekte.indexOf(p), 1);
    speichern();
  }

  const handler = handlerAus(verarbeiten, { herkunft: optionen.herkunft });
  handler.katalog = katalog;
  handler.katalogJs = katalogJs;
  // IDs der Community-Spiele, die gerade live sind (Bewertungen, Profile).
  handler.liveIds = () => daten.projekte.filter((p) => p.live && !p.gesperrt).map((p) => p.slug);
  // Fuer den Vite-Server: wo liegt der Build zu /community/<slug>/ bzw. /vorschau/<id>/?
  handler.liveOrdner = (slug) => {
    const p = daten.projekte.find((x) => x.slug === slug && x.live && !x.gesperrt);
    return p && p.liveBuild ? join(buildsOrdner, p.liveBuild) : null;
  };
  handler.vorschauOrdner = (id) => (BUILD_RE.test(id) && existsSync(join(buildsOrdner, id)) ? join(buildsOrdner, id) : null);
  handler.kontoLoeschen = (id) => { for (const p of daten.projekte.filter((x) => x.besitzer === id)) projektLoeschen(p); };
  handler.kontoDaten = (id) => daten.projekte.filter((p) => p.besitzer === id).map((p) => ({ id: p.id, slug: p.slug, status: p.status, erstellt: p.erstellt, entwurf: p.entwurf, live: p.live, verlauf: p.verlauf }));
  return handler;
}
