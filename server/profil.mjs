// Profile fuer miwale.com: Spielzeit, Erfolge, Level, Perlen und der Perlen-Shop.
//
// Ein Profil gehoert zu einem Konto (konten.mjs); ohne Konto gibt es keins.
// Es entsteht beim ersten Aufruf. Was ein Profil enthaelt, steht in neuesProfil().
//
// Ehrlich zur Sicherheit: Spielzeit und Erfolge meldet der Browser. Wer will, kann
// die Aufrufe von Hand senden. Das Ziel ist darum nicht "unfaelschbar", sondern
// "nicht lohnend": Perlen gibt es nur gegen Dinge, die nach Optik aussehen, Spielzeit
// zaehlt je Tag nur begrenzt, Herzschlaege zaehlen nur im Abstand echter Zeit, und
// je Konto sind alle Aktionen tempobegrenzt. Echtgeld spielt keine Rolle.
//
// Was Spielzeit zaehlt (shop/profil.js): das Spielfenster ist offen, der Tab ist
// sichtbar. Alle 30 Sekunden kommt ein Herzschlag (POST /api/profil/spielzeit). Der
// Server schreibt nur die Zeit gut, die seit dem letzten Herzschlag desselben
// Spiels wirklich vergangen ist, hoechstens 90 Sekunden, und nur einen Herzschlag
// je 20 Sekunden: zwei Tabs zaehlen nicht doppelt.
//
// Alle Regeln, Gegenstaende und Erfolge stehen in shop/profil-katalog.js, derselben
// Datei, aus der die Seite Shop und Profil zeichnet. Bedingungen der Erfolge der
// Plattform stehen unten in PRUEFER.
//
// Gespeichert wird in profile.json im Datenordner (alle Profile in einer Datei,
// verzoegert geschrieben: Herzschlaege kommen oft, die Datei muss nicht jedes Mal).

import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  gleich, sicherSchreiben, lesen, besucherAdresse, tempoGrenze, handlerAus, adminSchutz, adminAbweisung
} from "./gemeinsam.mjs";

export const KATALOG = fileURLToPath(new URL("../shop/profil-katalog.js", import.meta.url));

/** Liest den Katalog samt den Spielen (shop/spiele.js, spiele-auto.js) aus dem Ordner der Datei. */
export function katalogLaden(pfad = KATALOG) {
  const ordner = dirname(pfad);
  const fenster = {};
  for (const datei of ["spiele.js", "spiele-auto.js", basename(pfad)]) {
    const voll = join(ordner, datei);
    if (existsSync(voll)) new Function("window", readFileSync(voll, "utf8"))(fenster);
  }
  if (!fenster.MIWALE_PROFIL) throw new Error("Katalog des Profils nicht gefunden: " + pfad);
  return { profil: fenster.MIWALE_PROFIL, spiele: fenster.MIWALE_SPIELE || [] };
}

export const GRENZEN = {
  // je Konto im Zeitfenster (10 Minuten)
  herzschlaege: 60,
  besuche: 10,
  kaeufe: 40,
  ausruesten: 120,
  erfolge: 40,
  einstellungen: 60,
  lesen: 300,
  // je Adresse fuer fremde Profile
  fremde: 120,
  loginVersuche: 10,
  vitrine: 3,
  favoriten: 40,
  // Spielzeit, die ein Gast im Browser gesammelt hat und beim Anmelden mitbringt:
  // je Spiel und Anfrage hoechstens 6 Stunden, je Konto insgesamt hoechstens 20.
  importJeSpielSek: 6 * 3600,
  importGesamtSek: 10 * 3600,
  importe: 10,
  // Abstand, den zwei Herzschlaege mindestens haben muessen
  herzschlagMinMs: 20 * 1000,
  // Danach gilt der Besuch als neu begonnen (kein Anrechnen der Pause)
  herzschlagMaxMs: 75 * 1000
};

const TAG_MS = 24 * 60 * 60 * 1000;
const tagVon = (t) => new Date(t).toISOString().slice(0, 10);
const gesternVon = (tag) => tagVon(Date.parse(tag + "T00:00:00Z") - TAG_MS);

const SLOTS = ["avatar", "rahmen", "banner", "name", "titel", "akzent"];
// Konto-Ids aus konten.mjs (randomUUID); alles andere kommt nie als Schluessel vor.
const KONTO_ID = /^[A-Za-z0-9-]{1,80}$/;

export function neuesProfil(katalog, t) {
  const standard = {};
  for (const slot of SLOTS) {
    const item = katalog.items.find((i) => i.slot === slot && i.standard);
    standard[slot] = item ? item.id : null;
  }
  // Der erste Titel ist "Neuling" (zweiter Standard-Titel), nicht "kein Titel".
  const neuling = katalog.items.find((i) => i.id === "ti-neuling");
  if (neuling) standard.titel = neuling.id;
  return {
    erstellt: new Date(t).toISOString(),
    ep: 0, level: 1, perlen: 0, perlenGesamt: 0, kaeufe: 0,
    // Sekunden, die noch nicht zu einer ganzen Perle bzw. Erfahrungsminute reichen
    perlenRest: 0, epRest: 0,
    sichtbar: true, spielzeitZeigen: false,
    spiele: {}, erfolge: {}, inventar: [], ausruestung: standard, vitrine: [], favoriten: [], importiertSek: 0,
    serie: { letzter: null, laenge: 0, beste: 0 },
    heute: { tag: null, sek: 0, perlen: 0, ideen: 0 },
    ereignisse: {}, verlauf: [], hb: null
  };
}

// ---- Bedingungen der Erfolge der Plattform ---------------------------------------
// streng: nur Zeit, die der Server selbst gemessen hat (ohne die aus dem Browser
// uebernommene Gast-Zeit). So kann eine behauptete Zeit keine wertvollen Erfolge
// (Gold, Platin, solche mit einem Gegenstand) freischalten.
const sekundenVon = (x, streng) => Math.max(0, x.sek - (streng ? x.importiert || 0 : 0));
const gesamtSekunden = (p, streng) => Object.values(p.spiele).reduce((s, x) => s + sekundenVon(x, streng), 0);
const spieleAb = (p, sek, streng) => Object.values(p.spiele).filter((x) => sekundenVon(x, streng) >= sek).length;
const hatEreignis = (p, vorsilbe) => Object.keys(p.ereignisse).some((k) => k.startsWith(vorsilbe));
export const PRUEFER = {
  "willkommen": () => true,
  "erste-minuten": (p, streng) => gesamtSekunden(p, streng) >= 600,
  "eine-stunde": (p, streng) => gesamtSekunden(p, streng) >= 3600,
  "zehn-stunden": (p, streng) => gesamtSekunden(p, streng) >= 36000,
  "fuenfzig-stunden": (p, streng) => gesamtSekunden(p, streng) >= 180000,
  "entdecker-3": (p, streng) => spieleAb(p, 60, streng) >= 3,
  "entdecker-5": (p, streng) => spieleAb(p, 60, streng) >= 5,
  "erste-bewertung": (p) => hatEreignis(p, "bewertung:"),
  "ideengeber": (p) => hatEreignis(p, "idee:"),
  "serie-3": (p) => p.serie.beste >= 3,
  "serie-7": (p) => p.serie.beste >= 7,
  "serie-30": (p) => p.serie.beste >= 30,
  "level-5": (p) => p.level >= 5,
  "level-10": (p) => p.level >= 10,
  "level-20": (p) => p.level >= 20,
  "erster-kauf": (p) => p.kaeufe >= 1,
  "ausgestattet": (p) => p.ausruestung.avatar !== "av-wal" && p.ausruestung.rahmen !== "rf-keiner" && p.ausruestung.banner !== "bn-tiefsee",
  "sammler-10": (p) => p.inventar.length >= 10,
  "perlenvermoegen": (p) => p.perlenGesamt >= 500
};

export function profilBauen(optionen) {
  const ordner = optionen.ordner;
  mkdirSync(ordner, { recursive: true });
  const datei = join(ordner, "profile.json");
  const daten = existsSync(datei) ? JSON.parse(readFileSync(datei, "utf8")) : {};
  daten.profile = Object.assign(Object.create(null), daten.profile || {});

  const geladen = optionen.katalog || katalogLaden(optionen.katalogDatei || process.env.PROFIL_KATALOG || KATALOG);
  const katalog = geladen.profil;
  const SPIEL_IDS = new Set((optionen.spiele || geladen.spiele.map((s) => s.id)));
  const R = katalog.regeln;
  const ITEMS = new Map(katalog.items.map((i) => [i.id, i]));
  const ERFOLGE = new Map(katalog.erfolge.map((e) => [e.id, e]));
  // Erfolge, fuer die uebernommene Gast-Zeit nicht zaehlt (siehe sekundenVon).
  const STRENG = new Set([
    ...katalog.erfolge.filter((e) => e.stufe === "gold" || e.stufe === "platin").map((e) => e.id),
    ...katalog.items.filter((i) => i.erfolg).map((i) => i.erfolg)
  ]);
  const hat = (obj, id) => Object.hasOwn(obj, id);
  const konten = optionen.konten;
  const passwort = optionen.passwort || "";
  const jetzt = optionen.jetzt || (() => Date.now());
  const begrenzt = tempoGrenze(jetzt);
  const admin = optionen.adminSchutz || adminSchutz(jetzt);

  // ---- Speichern: gesammelt, nicht bei jedem Herzschlag ----
  let schmutzig = false;
  let timer = null;
  function speichern() { schmutzig = true; if (!timer) { timer = setTimeout(flush, optionen.verzoegerungMs ?? 3000); timer.unref?.(); } }
  function flush() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!schmutzig) return;
    schmutzig = false;
    sicherSchreiben(datei, daten);
  }

  // ---- Profil und Erfolge ----
  function profilVon(id) {
    const vorhanden = daten.profile[id];
    if (vorhanden) { vorhanden.favoriten = vorhanden.favoriten || []; vorhanden.importiertSek = vorhanden.importiertSek || 0; }
    if (!daten.profile[id]) {
      daten.profile[id] = neuesProfil(katalog, jetzt());
      // "Willkommen an Bord" kommt gleich mit.
      const neu = leeresNeu();
      erfolgePruefen(daten.profile[id], neu);
      speichern();
    }
    return daten.profile[id];
  }

  const leeresNeu = () => ({ erfolge: [], level: null });
  const neuKurz = (neu) => (neu.erfolge.length || neu.level ? neu : undefined);

  function perlenBuchen(p, menge, grund) {
    if (!menge) return;
    p.perlen += menge;
    if (menge > 0) p.perlenGesamt += menge;
    p.verlauf.unshift({ t: new Date(jetzt()).toISOString(), grund, perlen: menge });
    if (p.verlauf.length > R.verlaufMax) p.verlauf.length = R.verlaufMax;
  }

  function erfahrung(p, ep, neu) {
    if (ep <= 0) return;
    p.ep += ep;
    let l = katalog.levelVon(p.ep);
    while (p.level < l) {
      p.level++;
      perlenBuchen(p, R.levelPerlen * p.level, "level:" + p.level);
      neu.level = p.level;
      l = katalog.levelVon(p.ep);
    }
  }

  function erfolgFreischalten(p, def, neu) {
    if (p.erfolge[def.id]) return false;
    p.erfolge[def.id] = new Date(jetzt()).toISOString();
    perlenBuchen(p, def.perlen, "erfolg:" + def.id);
    erfahrung(p, R.ep.erfolg, neu);
    neu.erfolge.push(def.id);
    return true;
  }

  // Prueft alle Erfolge, bis nichts Neues mehr dazukommt (Perlen und Level
  // koennen weitere freischalten).
  function erfolgePruefen(p, neu) {
    for (let runde = 0; runde < 5; runde++) {
      let neuer = false;
      for (const def of ERFOLGE.values()) {
        if (p.erfolge[def.id]) continue;
        let ok = false;
        const streng = STRENG.has(def.id);
        if (def.art === "plattform") ok = Object.hasOwn(PRUEFER, def.id) && PRUEFER[def.id](p, streng);
        else if (def.art === "spielzeit") ok = sekundenVon(p.spiele[def.spiel] || { sek: 0 }, streng) >= def.sekunden;
        if (ok && erfolgFreischalten(p, def, neu)) neuer = true;
      }
      if (!neuer) break;
    }
  }

  const besitzt = (p, item) => !!item && (item.standard || (item.erfolg && p.erfolge[item.erfolg]) || p.inventar.includes(item.id));

  // ---- Sichten ----
  const itemSek = (p, spiel) => (p.spiele[spiel] || {}).sek || 0;
  function eigeneSicht(p, name) {
    return {
      name,
      erstellt: p.erstellt,
      perlen: p.perlen, perlenGesamt: p.perlenGesamt,
      ep: p.ep, level: p.level, levelAb: katalog.levelAb(p.level), naechstesLevelAb: katalog.levelAb(p.level + 1),
      sichtbar: p.sichtbar, spielzeitZeigen: p.spielzeitZeigen,
      spiele: p.spiele, erfolge: p.erfolge,
      inventar: p.inventar, ausruestung: p.ausruestung, vitrine: p.vitrine,
      serie: p.serie, heute: { perlen: p.heute.perlen, sek: p.heute.sek, tag: p.heute.tag },
      verlauf: p.verlauf,
      // Was heute noch zu holen ist: die Seite zeigt es im Shop.
      favoriten: p.favoriten || [], importiertSek: p.importiertSek || 0,
      grenzen: { tagesPerlen: R.tagesPerlenSpielzeit, tagesSekunden: R.tagesSekundenMax }
    };
  }

  // Erfolge, die etwas ueber Spielzeit verraten (je Spiel und insgesamt).
  const ZEIT_ERFOLGE = new Set(["erste-minuten", "eine-stunde", "zehn-stunden", "fuenfzig-stunden"]);
  const verraetZeit = (id) => ZEIT_ERFOLGE.has(id) || (ERFOLGE.get(id) || {}).art === "spielzeit";

  function oeffentlicheSicht(p, name, eigener) {
    const gesamt = gesamtSekunden(p);
    const sichtbarZeit = p.spielzeitZeigen || eigener;
    // Nur Erfolge aus dem Katalog, nur das Datum (nicht die Uhrzeit), und bei privater
    // Spielzeit keine, aus denen sie sich ablesen liesse.
    const erfolge = {};
    for (const [id, wann] of Object.entries(p.erfolge)) {
      if (!ERFOLGE.has(id) || (!sichtbarZeit && verraetZeit(id))) continue;
      erfolge[id] = eigener ? wann : String(wann).slice(0, 10);
    }
    return {
      name,
      erstellt: String(p.erstellt).slice(0, 7),
      level: p.level, ep: p.ep, levelAb: katalog.levelAb(p.level), naechstesLevelAb: katalog.levelAb(p.level + 1),
      ausruestung: p.ausruestung,
      vitrine: p.vitrine.filter((id) => hat(erfolge, id)),
      erfolge,
      serie: { beste: p.serie.beste },
      inventarAnzahl: p.inventar.length,
      spielzeit: sichtbarZeit
        ? { gesamt, spiele: Object.entries(p.spiele).map(([id, s]) => ({ id, sek: s.sek, zuletzt: s.zuletzt })).sort((a, b) => b.sek - a.sek) }
        : null,
      eigenes: !!eigener,
      versteckt: !p.sichtbar
    };
  }

  function kurz(p) {
    return { perlen: p.perlen, ep: p.ep, level: p.level, levelAb: katalog.levelAb(p.level), naechstesLevelAb: katalog.levelAb(p.level + 1) };
  }

  // ---- Aktionen ----
  function tagWechsel(p, t) {
    const tag = tagVon(t);
    if (p.heute.tag !== tag) p.heute = { tag, sek: 0, perlen: 0, ideen: 0 };
  }

  function herzschlag(p, spiel) {
    const t = jetzt();
    tagWechsel(p, t);
    const neu = leeresNeu();
    const hb = p.hb;
    let gutSek = 0;
    if (hb && hb.spiel === spiel) {
      const abstand = t - hb.t;
      // Zu dicht hintereinander (zweiter Tab, Skript): ignorieren, Zeitpunkt bleibt.
      if (abstand < GRENZEN.herzschlagMinMs) return { neu, ignoriert: true };
      if (abstand <= GRENZEN.herzschlagMaxMs) gutSek = Math.min(Math.floor(abstand / 1000), R.tageBlockSek);
    }
    p.hb = { spiel, t };
    const s = (p.spiele[spiel] = p.spiele[spiel] || { sek: 0, zuletzt: null, erste: new Date(t).toISOString() });
    s.zuletzt = new Date(t).toISOString();
    // Tagesgrenze: darueber zaehlt nichts mehr.
    gutSek = Math.max(0, Math.min(gutSek, R.tagesSekundenMax - p.heute.sek));
    if (gutSek > 0) {
      s.sek += gutSek;
      p.heute.sek += gutSek;
      p.perlenRest += gutSek;
      p.epRest += gutSek;
      const ganze = Math.floor(p.perlenRest / R.perleProSekunden);
      const frei = Math.max(0, R.tagesPerlenSpielzeit - p.heute.perlen);
      const n = Math.min(ganze, frei);
      if (n > 0) { perlenBuchen(p, n, "spielzeit:" + spiel); p.heute.perlen += n; p.perlenRest -= n * R.perleProSekunden; }
      // Was nicht ausgezahlt werden darf, wird nicht angespart.
      if (p.perlenRest >= R.perleProSekunden) p.perlenRest = R.perleProSekunden - 1;
      const minuten = Math.floor(p.epRest / 60);
      if (minuten > 0) { p.epRest -= minuten * 60; erfahrung(p, minuten * R.ep.minute, neu); }
    }
    erfolgePruefen(p, neu);
    speichern();
    return { neu, gutgeschrieben: gutSek, sek: s.sek };
  }

  function besuch(p) {
    const t = jetzt();
    tagWechsel(p, t);
    const tag = tagVon(t);
    const neu = leeresNeu();
    if (p.serie.letzter === tag) return { neu, schonHeute: true, serie: p.serie.laenge };
    p.serie.laenge = p.serie.letzter === gesternVon(tag) ? p.serie.laenge + 1 : 1;
    p.serie.beste = Math.max(p.serie.beste, p.serie.laenge);
    p.serie.letzter = tag;
    const gutschrift = R.besuchPerlen + Math.min(p.serie.laenge - 1, R.serieBonusMax);
    perlenBuchen(p, gutschrift, "besuch");
    erfahrung(p, R.ep.besuch, neu);
    erfolgePruefen(p, neu);
    speichern();
    return { neu, perlen: gutschrift, serie: p.serie.laenge };
  }

  // Von bewertungen.mjs und ideen.mjs aufgerufen, wenn ein Konto etwas schreibt.
  function ereignis(id, typ, schluessel) {
    if (!id || !(typ === "bewertung" || typ === "idee")) return;
    const p = profilVon(id);
    const key = typ + ":" + String(schluessel || "");
    if (p.ereignisse[key]) return;
    const t = jetzt();
    tagWechsel(p, t);
    const neu = leeresNeu();
    p.ereignisse[key] = new Date(t).toISOString();
    if (typ === "bewertung") {
      perlenBuchen(p, R.bewertungPerlen, "bewertung:" + schluessel);
      erfahrung(p, R.ep.bewertung, neu);
    } else if (p.heute.ideen < R.ideenProTag) {
      p.heute.ideen++;
      perlenBuchen(p, R.ideePerlen, "idee");
      erfahrung(p, R.ep.idee, neu);
    }
    erfolgePruefen(p, neu);
    speichern();
  }

  // ---- Anfragen ----
  async function verarbeiten(req) {
    const url = new URL(req.url, "http://lokal");
    let teile;
    try { teile = url.pathname.replace(/^\/api\/profil\/?/, "").split("/").filter(Boolean).map(decodeURIComponent); }
    catch { return [400, { fehler: "adresse" }]; }
    const ip = besucherAdresse(req);

    if (teile[0] === "healthz") return [200, { ok: true }];

    // ---- Verwaltung ----
    if (teile[0] === "admin") {
      const nein = adminAbweisung(admin(req, passwort));
      if (nein) return nein;
      if (teile[1] === "profile" && !teile[2] && req.method === "GET") {
        return [200, {
          profile: Object.entries(daten.profile).map(([id, p]) => ({
            konto: id, name: konten && konten.nameVon ? konten.nameVon(id) : null, level: p.level, perlen: p.perlen,
            perlenGesamt: p.perlenGesamt, spielzeit: gesamtSekunden(p), erfolge: Object.keys(p.erfolge).length, kaeufe: p.kaeufe, erstellt: p.erstellt
          }))
        }];
      }
      if (teile[1] === "profile" && teile[2] && req.method === "PUT") {
        const p = KONTO_ID.test(teile[2]) && hat(daten.profile, teile[2]) ? daten.profile[teile[2]] : null;
        if (!p) return [404, { fehler: "unbekannt" }];
        const k = await lesen(req, 1024);
        if (!Number.isInteger(k.perlen) || Math.abs(k.perlen) > 100000) return [400, { fehler: "perlen" }];
        perlenBuchen(p, k.perlen, "verwaltung");
        speichern();
        return [200, { perlen: p.perlen }];
      }
      if (teile[1] === "profile" && teile[2] && req.method === "DELETE") {
        if (!KONTO_ID.test(teile[2]) || !hat(daten.profile, teile[2])) return [404, { fehler: "unbekannt" }];
        delete daten.profile[teile[2]];
        speichern();
        return [200, { ok: true }];
      }
      return [404, { fehler: "unbekannt" }];
    }

    // ---- Fremdes Profil ansehen: GET /api/profil/u/<name> ----
    if (teile[0] === "u" && teile.length === 2 && req.method === "GET") {
      if (begrenzt("fremde|" + ip, GRENZEN.fremde)) return [429, { fehler: "zu-schnell" }];
      const id = konten && konten.idVon ? konten.idVon(teile[1]) : null;
      const p = id && daten.profile[id];
      if (!p) return [404, { fehler: "unbekannt" }];
      const ich = konten && konten.wer ? konten.wer(req) : null;
      const eigener = !!ich && ich.id === id;
      // Ein verstecktes Profil sieht nur sein Besitzer (und weiss, dass es versteckt ist).
      if (!p.sichtbar && !eigener) return [404, { fehler: "unbekannt" }];
      return [200, { profil: oeffentlicheSicht(p, konten.nameVon(id), eigener) }];
    }

    // Ab hier nur mit Konto.
    const konto = konten && konten.wer ? konten.wer(req) : null;
    if (!konto) return [401, { fehler: "anmelden" }];
    if (begrenzt("lesen|" + konto.id, GRENZEN.lesen)) return [429, { fehler: "zu-schnell" }];
    // Gesperrt: ansehen ja, aendern und sammeln nein.
    if (konto.gesperrt && req.method !== "GET") return [403, { fehler: "konto-gesperrt" }];
    const p = profilVon(konto.id);

    // ---- Eigenes Profil: GET /api/profil/ich ----
    if (teile[0] === "ich" && req.method === "GET") {
      return [200, { profil: eigeneSicht(p, konto.name) }];
    }

    // ---- Heartbeat: POST /api/profil/spielzeit { spiel } ----
    if (teile[0] === "spielzeit" && req.method === "POST") {
      if (begrenzt("herzschlag|" + konto.id, GRENZEN.herzschlaege)) return [429, { fehler: "zu-schnell" }];
      const k = await lesen(req, 512);
      if (typeof k.spiel !== "string" || !SPIEL_IDS.has(k.spiel)) return [404, { fehler: "unbekanntes-spiel" }];
      const r = herzschlag(p, k.spiel);
      return [200, { ...kurz(p), sek: itemSek(p, k.spiel), heute: p.heute.perlen, neu: neuKurz(r.neu) }];
    }

    // ---- Taeglicher Besuch: POST /api/profil/besuch ----
    if (teile[0] === "besuch" && req.method === "POST") {
      if (begrenzt("besuch|" + konto.id, GRENZEN.besuche)) return [429, { fehler: "zu-schnell" }];
      const r = besuch(p);
      return [200, { ...kurz(p), serie: p.serie, neu: neuKurz(r.neu), perlenErhalten: r.perlen || 0, schonHeute: !!r.schonHeute }];
    }

    // ---- Erfolg aus einem Spiel: POST /api/profil/erfolg { spiel, id } ----
    if (teile[0] === "erfolg" && req.method === "POST") {
      if (begrenzt("erfolg|" + konto.id, GRENZEN.erfolge)) return [429, { fehler: "zu-schnell" }];
      const k = await lesen(req, 512);
      if (typeof k.spiel !== "string" || typeof k.id !== "string" || k.id.length > 60) return [400, { fehler: "eingabe" }];
      const def = ERFOLGE.get("spiel:" + k.spiel + ":" + k.id);
      if (!def || def.art !== "spiel") return [404, { fehler: "unbekannter-erfolg" }];
      // Wer nie in diesem Spiel war (30 Sekunden zaehlen), kann dort nichts schaffen.
      if (itemSek(p, k.spiel) < 30) return [409, { fehler: "nicht-gespielt" }];
      const neu = leeresNeu();
      erfolgFreischalten(p, def, neu);
      erfolgePruefen(p, neu);
      speichern();
      return [200, { ...kurz(p), neu: neuKurz(neu) }];
    }

    // ---- Kaufen: POST /api/profil/kaufen { item } ----
    if (teile[0] === "kaufen" && req.method === "POST") {
      if (begrenzt("kaufen|" + konto.id, GRENZEN.kaeufe)) return [429, { fehler: "zu-schnell" }];
      const k = await lesen(req, 512);
      const item = ITEMS.get(String(k.item || ""));
      if (!item) return [404, { fehler: "unbekannt" }];
      if (item.standard || item.erfolg) return [409, { fehler: "nicht-kaeuflich" }];
      if (p.inventar.includes(item.id)) return [409, { fehler: "schon-besessen" }];
      if (item.braucht && itemSek(p, item.braucht.spiel) < item.braucht.sekunden) return [409, { fehler: "voraussetzung" }];
      if (p.perlen < item.preis) return [402, { fehler: "zu-wenig-perlen" }];
      perlenBuchen(p, -item.preis, "kauf:" + item.id);
      p.inventar.push(item.id);
      p.kaeufe++;
      const neu = leeresNeu();
      erfolgePruefen(p, neu);
      speichern();
      return [200, { ...kurz(p), inventar: p.inventar, neu: neuKurz(neu) }];
    }

    // ---- Ausruesten: POST /api/profil/ausruesten { slot, item } ----
    if (teile[0] === "ausruesten" && req.method === "POST") {
      if (begrenzt("ausruesten|" + konto.id, GRENZEN.ausruesten)) return [429, { fehler: "zu-schnell" }];
      const k = await lesen(req, 512);
      const item = ITEMS.get(String(k.item || ""));
      if (!item || item.slot !== k.slot) return [404, { fehler: "unbekannt" }];
      if (!besitzt(p, item)) return [403, { fehler: "nicht-besessen" }];
      p.ausruestung[item.slot] = item.id;
      const neu = leeresNeu();
      erfolgePruefen(p, neu);
      speichern();
      return [200, { ...kurz(p), ausruestung: p.ausruestung, neu: neuKurz(neu) }];
    }

    // ---- Favorit: POST /api/profil/favorit { spiel, an } ----
    if (teile[0] === "favorit" && req.method === "POST") {
      if (begrenzt("einstellungen|" + konto.id, GRENZEN.einstellungen)) return [429, { fehler: "zu-schnell" }];
      const k = await lesen(req, 512);
      if (typeof k.spiel !== "string" || !SPIEL_IDS.has(k.spiel) || typeof k.an !== "boolean") return [400, { fehler: "eingabe" }];
      p.favoriten = (p.favoriten || []).filter((id) => id !== k.spiel);
      if (k.an) { if (p.favoriten.length >= GRENZEN.favoriten) return [409, { fehler: "zu-viele" }]; p.favoriten.unshift(k.spiel); }
      speichern();
      return [200, { favoriten: p.favoriten }];
    }

    // ---- Gast-Daten uebernehmen: POST /api/profil/import { spiele: { id: sekunden }, favoriten: [id] } ----
    // Was jemand vor dem Anmelden im Browser gespielt hat. Der Browser kann das
    // behaupten, darum: gedeckelt, keine Perlen und keine Erfahrung fuer die Zeit
    // selbst (nur Spielzeit-Erfolge koennen dadurch freiwerden).
    if (teile[0] === "import" && req.method === "POST") {
      if (begrenzt("import|" + konto.id, GRENZEN.importe)) return [429, { fehler: "zu-schnell" }];
      const k = await lesen(req, 4096);
      const spiele = k.spiele && typeof k.spiele === "object" && !Array.isArray(k.spiele) ? k.spiele : {};
      const t = new Date(jetzt()).toISOString();
      let uebernommen = 0;
      for (const [id, wert] of Object.entries(spiele)) {
        if (!SPIEL_IDS.has(id) || !Number.isFinite(wert) || wert <= 0) continue;
        const s = (p.spiele[id] = p.spiele[id] || { sek: 0, zuletzt: null, erste: t });
        const frei = Math.min(GRENZEN.importGesamtSek - (p.importiertSek || 0), GRENZEN.importJeSpielSek - (s.importiert || 0));
        const sek = Math.floor(Math.min(wert, frei));
        if (sek <= 0) continue;
        s.sek += sek;
        s.importiert = (s.importiert || 0) + sek;
        s.zuletzt = s.zuletzt || t;
        p.importiertSek = (p.importiertSek || 0) + sek;
        uebernommen += sek;
      }
      if (Array.isArray(k.favoriten)) {
        for (const id of k.favoriten) {
          if (typeof id === "string" && SPIEL_IDS.has(id) && !p.favoriten.includes(id) && p.favoriten.length < GRENZEN.favoriten) p.favoriten.push(id);
        }
      }
      const neu = leeresNeu();
      erfolgePruefen(p, neu);
      speichern();
      return [200, { ...kurz(p), uebernommen, favoriten: p.favoriten, neu: neuKurz(neu) }];
    }

    // ---- Einstellungen: POST /api/profil/einstellungen { sichtbar, spielzeitZeigen, vitrine } ----
    if (teile[0] === "einstellungen" && req.method === "POST") {
      if (begrenzt("einstellungen|" + konto.id, GRENZEN.einstellungen)) return [429, { fehler: "zu-schnell" }];
      const k = await lesen(req, 1024);
      if (k.sichtbar !== undefined) { if (typeof k.sichtbar !== "boolean") return [400, { fehler: "sichtbar" }]; p.sichtbar = k.sichtbar; }
      if (k.spielzeitZeigen !== undefined) { if (typeof k.spielzeitZeigen !== "boolean") return [400, { fehler: "spielzeit" }]; p.spielzeitZeigen = k.spielzeitZeigen; }
      if (k.vitrine !== undefined) {
        if (!Array.isArray(k.vitrine) || k.vitrine.length > GRENZEN.vitrine || new Set(k.vitrine).size !== k.vitrine.length) return [400, { fehler: "vitrine" }];
        if (k.vitrine.some((id) => typeof id !== "string" || !ERFOLGE.has(id) || !hat(p.erfolge, id))) return [400, { fehler: "vitrine" }];
        p.vitrine = k.vitrine;
      }
      speichern();
      return [200, { sichtbar: p.sichtbar, spielzeitZeigen: p.spielzeitZeigen, vitrine: p.vitrine }];
    }

    return [404, { fehler: "unbekannt" }];
  }

  const handler = handlerAus(verarbeiten, { herkunft: optionen.herkunft });
  handler.ereignis = ereignis;
  handler.flush = flush;
  handler.kontoLoeschen = (id) => { if (daten.profile[id]) { delete daten.profile[id]; schmutzig = true; flush(); } };
  handler.kontoDaten = (id) => (daten.profile[id] ? JSON.parse(JSON.stringify(daten.profile[id])) : null);
  return handler;
}
