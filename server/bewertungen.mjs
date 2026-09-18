// Bewertungsdienst fuer miwale.com/games.
//
// Pro Spiel gibt jedes Geraet (oder Konto) genau eine Bewertung ab: Daumen hoch
// oder runter, dazu freiwillig ein oeffentlicher Satz (nur mit Konto) und ein
// privates Feedback, das nur die Verwaltungsseite zeigt. Bewertungen erscheinen
// sofort, der Wortfilter haelt das Grobe fern, der Rest wird im Nachhinein
// geloescht, Konten lassen sich sperren.
//
// Keine Abhaengigkeiten. Gespeichert wird eine JSON-Datei im Datenordner; bei
// ein paar hundert Bewertungen ist das schneller und robuster als jede Datenbank.
// Geschrieben wird ueber eine Zwischendatei und rename, damit ein Absturz mitten
// im Schreiben nie eine halbe Datei hinterlaesst.
//
// Laeuft im selben Container wie nginx auf 127.0.0.1:8081 (server/start.mjs);
// nginx reicht /api/bewertungen/ hierher durch (docker/nginx.conf).

import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { START_SPERRLISTE } from "./sperrliste.mjs";
import {
  GERAET_RE, FENSTER_MS, textPruefen, gleich, sicherSchreiben, lesen,
  besucherAdresse, adressKennung, tempoGrenze, kontenPflicht, handlerAus
} from "./gemeinsam.mjs";

// Bewertet werden nur Spiele aus dem Katalog der Spieleseite (shop/spiele.js).
// Sonst liesse sich der Speicher mit erfundenen Spielnamen vollschreiben. Die
// Liste wird beim Start aus dem Katalog gelesen, damit ein neues Spiel ohne
// zweiten Eintrag hier bewertbar ist.
export const KATALOG = fileURLToPath(new URL("../shop/spiele.js", import.meta.url));

// Neben dem Katalog liegt spiele-auto.js mit den Spielen, die tools/sync-games.mjs
// selbst von GitHub aufgenommen hat; die gehoeren dazu.
export function spieleAusKatalog(pfad) {
  const auto = join(dirname(pfad), "spiele-auto.js");
  const quelle = readFileSync(pfad, "utf8") + (existsSync(auto) ? "\n" + readFileSync(auto, "utf8") : "");
  return [...new Set([...quelle.matchAll(/^ {4}"id": "([a-z0-9-]+)"/gm)].map((m) => m[1]))];
}

export const GRENZEN = {
  oeffentlich: 500,
  privat: 1000,
  antwort: 1000,
  // Schreibende Anfragen je Adresse im Zeitfenster. Ein Mensch bewertet ein paar
  // Spiele und korrigiert sich vielleicht einmal; ein Skript will hunderte.
  schreibenProFenster: 20,
  fensterMs: FENSTER_MS,
  // Falsche Passwoerter je Adresse im Zeitfenster.
  loginVersuche: 10
};

// ---- Wortfilter ---------------------------------------------------------------
// Vergleicht ganze Woerter nach einer Vereinfachung: klein, Umlaute ausgeschrieben,
// Ziffern als Buchstaben gelesen (sh1t), Wiederholungen gekuerzt (shiiit).
// Einzelbuchstaben mit Abstand (s h i t) werden zusammengezogen. Ganze Woerter,
// damit "Class" oder "Dickens" nicht haengen bleiben.
const ZIFFERN = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", "$": "s", "!": "i" };

function vereinfachen(wort) {
  return wort
    .toLowerCase()
    .replace(/ß/g, "ss").replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[0134578@$!]/g, (z) => ZIFFERN[z]);
}

// Doppelte Buchstaben auf einen gekuerzt: "shiiit" und "shitt" werden "shit".
const kurz = (w) => w.replace(/(.)\1+/g, "$1");

function woerter(text) {
  const roh = String(text).toLowerCase().split(/[^\p{L}\p{N}@$!]+/u).filter(Boolean);
  const aus = roh.map(vereinfachen);
  // "s h i t" oder "f.u.c.k": Folgen von Einzelzeichen zusammenziehen.
  let folge = "";
  for (const w of roh) {
    if (w.length === 1) folge += w;
    else { if (folge.length > 2) aus.push(vereinfachen(folge)); folge = ""; }
  }
  if (folge.length > 2) aus.push(vereinfachen(folge));
  return aus;
}

export function gesperrteWoerter(text, liste) {
  if (!text) return [];
  // Gemeldet wird der Eintrag aus der Liste, nicht die Schreibweise im Text.
  const gesperrt = new Map(liste.map((w) => [kurz(vereinfachen(w)), w]));
  return [...new Set(woerter(text).map((w) => gesperrt.get(kurz(w))).filter(Boolean))];
}

// ---- Speicher -------------------------------------------------------------------
export function speicherOeffnen(ordner) {
  mkdirSync(ordner, { recursive: true });
  const datei = join(ordner, "bewertungen.json");
  const listeDatei = join(ordner, "sperrliste.json");
  const daten = existsSync(datei) ? JSON.parse(readFileSync(datei, "utf8")) : { bewertungen: [] };
  let sperrliste = existsSync(listeDatei) ? JSON.parse(readFileSync(listeDatei, "utf8")) : START_SPERRLISTE.slice();

  if (!existsSync(listeDatei)) sicherSchreiben(listeDatei, sperrliste);

  return {
    get alle() { return daten.bewertungen; },
    get sperrliste() { return sperrliste; },
    speichern() { sicherSchreiben(datei, daten); },
    sperrlisteSetzen(neu) { sperrliste = neu; sicherSchreiben(listeDatei, sperrliste); }
  };
}

/// ---- Hilfen ---------------------------------------------------------------------
// Oeffentliche Sicht: ohne Geraet, Konto, Adresse und privates Feedback. Der
// Name kommt bei jeder Anfrage frisch aus dem Konto; wer ihn aendert, steht
// ueberall mit dem neuen da, wer sein Konto loescht, ist ganz weg.
function oeffentlich(b, istEigene, nameVon) {
  return {
    id: b.id, daumen: b.daumen, text: b.text, zeit: b.zeit, geaendert: b.geaendert || null,
    name: b.konto ? nameVon(b.konto) : null,
    antwort: b.antwort || null, eigene: istEigene(b)
  };
}

// ---- Anwendung ------------------------------------------------------------------
// optionen: { ordner, passwort, salz, spiele, konten, herkunft, jetzt }
//   konten: der Kontendienst (konten.mjs) mit wer(req) und nameVon(id). Ohne
//   ihn ist niemand angemeldet. jetzt nur fuer Tests.
//
// Den Daumen gibt es ohne Konto, je Geraet einer. Oeffentlicher Text braucht
// ein Konto: Er steht mit Namen da, und wer Unfug schreibt, laesst sich sperren.
// Das private Feedback sieht nur die Verwaltung; das geht weiter ohne Konto.
// Solange Anmelden nicht eingerichtet ist (kontenPflicht), geht auch Text ohne.
//
// Wer sich anmeldet, nimmt die Bewertung seines Geraets mit: Sie gehoert ab dann
// dem Konto (Feld `konto`) und nicht mehr dem Geraet.
export function anwendungBauen(optionen) {
  const speicher = speicherOeffnen(optionen.ordner);
  const SPIELE = optionen.spiele || spieleAusKatalog(KATALOG);
  if (!SPIELE.length) throw new Error("Keine Spiele im Katalog gefunden");
  const passwort = optionen.passwort || "";
  const salz = optionen.salz || "miwale";
  const jetzt = optionen.jetzt || (() => Date.now());
  const begrenzt = tempoGrenze(jetzt);
  const wer = (req) => (optionen.konten ? optionen.konten.wer(req) : null);
  const nameVon = (id) => (optionen.konten ? optionen.konten.nameVon(id) : null);

  // Gehoert die Bewertung diesem Besucher? Angemeldet zaehlt nur das Konto,
  // sonst das Geraet -- aber nur fuer Bewertungen, die noch keinem Konto gehoeren.
  const gehoert = (konto, geraet) => (b) =>
    konto ? b.konto === konto.id : !!geraet && !b.konto && b.geraet === geraet;

  function zusammenfassung(spiel, konto, geraet) {
    const liste = speicher.alle.filter((b) => b.spiel === spiel);
    const hoch = liste.filter((b) => b.daumen === "hoch").length;
    const istEigene = gehoert(konto, geraet);
    const eigene = liste.find(istEigene);
    return {
      spiel,
      hoch,
      runter: liste.length - hoch,
      // Oeffentlich zu lesen sind nur Bewertungen mit Text; die Daumen zaehlen oben.
      liste: liste
        .filter((b) => b.text)
        .sort((a, b) => b.zeit.localeCompare(a.zeit))
        .map((b) => oeffentlich(b, istEigene, nameVon)),
      eigene: eigene ? { daumen: eigene.daumen, text: eigene.text, privat: eigene.privat } : null
    };
  }

  async function verarbeiten(req) {
    const url = new URL(req.url, "http://lokal");
    const teile = url.pathname.replace(/^\/api\/bewertungen\/?/, "").split("/").filter(Boolean);
    const ip = besucherAdresse(req);

    if (teile[0] === "healthz") return [200, { ok: true }];

    // ---- Verwaltung ----
    if (teile[0] === "admin") {
      if (!passwort) return [503, { fehler: "verwaltung-aus" }];
      // Erst begrenzen, dann vergleichen: sonst liesse sich raten, solange man will.
      const auth = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
      if (!gleich(auth, passwort)) {
        if (begrenzt("login|" + ip, GRENZEN.loginVersuche)) return [429, { fehler: "zu-viele-versuche" }];
        return [401, { fehler: "passwort" }];
      }

      if (teile[1] === "alle" && req.method === "GET") {
        const bewertungen = speicher.alle
          .slice()
          .sort((a, b) => b.zeit.localeCompare(a.zeit))
          .map((b) => ({ ...oeffentlich(b, () => false, nameVon), spiel: b.spiel, privat: b.privat, adresse: b.adresse, konto: b.konto || null }));
        return [200, { spiele: SPIELE, bewertungen }];
      }
      if (teile[1] === "sperrliste") {
        if (req.method === "GET") return [200, { woerter: speicher.sperrliste }];
        if (req.method === "PUT") {
          const k = await lesen(req);
          if (!Array.isArray(k.woerter)) return [400, { fehler: "format" }];
          const neu = [...new Set(k.woerter.map((w) => String(w).trim().toLowerCase()).filter((w) => w && w.length <= 60))].slice(0, 2000);
          speicher.sperrlisteSetzen(neu);
          return [200, { woerter: neu }];
        }
      }
      if (teile[1] === "bewertung" && teile[2]) {
        const b = speicher.alle.find((x) => x.id === teile[2]);
        if (!b) return [404, { fehler: "nicht-gefunden" }];
        if (req.method === "DELETE" && !teile[3]) {
          // ?nur=text laesst den Daumen stehen und entfernt nur die Worte.
          if (url.searchParams.get("nur") === "text") { b.text = ""; b.privat = ""; }
          else speicher.alle.splice(speicher.alle.indexOf(b), 1);
          speicher.speichern();
          return [200, { ok: true }];
        }
        if (req.method === "PUT" && teile[3] === "antwort") {
          const k = await lesen(req);
          const text = textPruefen(k.text, GRENZEN.antwort);
          if (text === null) return [400, { fehler: "zu-lang" }];
          b.antwort = text ? { text, zeit: new Date(jetzt()).toISOString() } : null;
          speicher.speichern();
          return [200, { ok: true }];
        }
      }
      return [404, { fehler: "unbekannt" }];
    }

    // ---- Oeffentlich ----
    const spiel = teile[0];
    if (!spiel || !SPIELE.includes(spiel) || teile.length > 1) return [404, { fehler: "spiel" }];
    const geraetQ = url.searchParams.get("geraet") || "";
    const geraet = GERAET_RE.test(geraetQ) ? geraetQ : null;
    const konto = wer(req);

    if (req.method === "GET") return [200, zusammenfassung(spiel, konto, geraet)];

    if (konto && konto.gesperrt) return [403, { fehler: "konto-gesperrt" }];

    if (req.method === "PUT") {
      if (begrenzt("schreiben|" + ip, GRENZEN.schreibenProFenster)) return [429, { fehler: "zu-schnell" }];
      if (konto && begrenzt("konto|" + konto.id, GRENZEN.schreibenProFenster)) return [429, { fehler: "zu-schnell" }];
      const k = await lesen(req);
      // Verstecktes Feld: Menschen sehen es nicht, Bots fuellen es aus. Die
      // Antwort tut so, als waere alles gut, damit der Bot nichts lernt.
      if (k.website) return [200, zusammenfassung(spiel, null, null)];
      if (typeof k.geraet !== "string" || !GERAET_RE.test(k.geraet)) return [400, { fehler: "geraet" }];
      if (k.daumen !== "hoch" && k.daumen !== "runter") return [400, { fehler: "daumen" }];
      const text = textPruefen(k.text, GRENZEN.oeffentlich);
      const privat = textPruefen(k.privat, GRENZEN.privat);
      if (text === null || privat === null) return [400, { fehler: "zu-lang" }];
      // Oeffentlicher Text nur mit Konto. Ohne Konto bleibt ein alter Text
      // (aus der Zeit vor den Konten) stehen, wie er war.
      const pflicht = kontenPflicht(optionen.konten);
      if (text && !konto && pflicht) return [401, { fehler: "anmelden" }];
      const treffer = gesperrteWoerter(text + "\n" + privat, speicher.sperrliste);
      if (treffer.length) return [422, { fehler: "gesperrt", woerter: treffer }];

      const zeit = new Date(jetzt()).toISOString();
      const adresse = adressKennung(salz, ip);
      let alt = speicher.alle.find((b) => b.spiel === spiel && gehoert(konto, k.geraet)(b));
      // Erste Bewertung mit Konto: die des Geraets uebernehmen, statt doppelt zu zaehlen.
      if (!alt && konto) {
        alt = speicher.alle.find((b) => b.spiel === spiel && gehoert(null, k.geraet)(b));
        if (alt) alt.konto = konto.id;
      }
      const neuerText = konto || !pflicht ? text : alt ? alt.text : "";
      if (alt) {
        // Wer den Text aendert, dessen alte Antwort passt womoeglich nicht mehr;
        // sie bleibt trotzdem stehen, loeschen kann sie nur die Verwaltung.
        Object.assign(alt, { daumen: k.daumen, text: neuerText, privat, geaendert: zeit, adresse });
      } else {
        speicher.alle.push({ id: randomUUID(), spiel, geraet: k.geraet, konto: konto ? konto.id : null, daumen: k.daumen, text: neuerText, privat, zeit, adresse, antwort: null });
      }
      speicher.speichern();
      return [200, zusammenfassung(spiel, konto, k.geraet)];
    }

    if (req.method === "DELETE") {
      if (!konto && !geraet) return [400, { fehler: "geraet" }];
      const alt = speicher.alle.find((b) => b.spiel === spiel && gehoert(konto, geraet)(b));
      if (alt) { speicher.alle.splice(speicher.alle.indexOf(alt), 1); speicher.speichern(); }
      return [200, zusammenfassung(spiel, konto, geraet)];
    }

    return [405, { fehler: "methode" }];
  }

  // Als Node-Handler nutzbar: im Container ueber server/start.mjs, lokal als
  // Vite-Middleware (tools/dienste-dev.mjs). Dazu, was der Kontendienst beim
  // Loeschen und fuer die Auskunft braucht.
  const handler = handlerAus(verarbeiten, { herkunft: optionen.herkunft });
  handler.kontoLoeschen = (id) => {
    const bleiben = speicher.alle.filter((b) => b.konto !== id);
    if (bleiben.length === speicher.alle.length) return;
    speicher.alle.splice(0, speicher.alle.length, ...bleiben);
    speicher.speichern();
  };
  handler.kontoDaten = (id) => speicher.alle
    .filter((b) => b.konto === id)
    .map((b) => ({ spiel: b.spiel, daumen: b.daumen, text: b.text, privat: b.privat, zeit: b.zeit, geaendert: b.geaendert || null, antwort: b.antwort || null }));
  return handler;
}
