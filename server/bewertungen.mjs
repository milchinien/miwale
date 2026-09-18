// Bewertungsdienst fuer miwale.com/games.
//
// Pro Spiel gibt jedes Geraet genau eine Bewertung ab: Daumen hoch oder runter,
// dazu freiwillig ein oeffentlicher Satz und ein privates Feedback, das nur die
// Verwaltungsseite zeigt. Ohne Account und auf Vertrauensbasis: Bewertungen
// erscheinen sofort, der Wortfilter haelt das Grobe fern, der Rest wird im
// Nachhinein geloescht.
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
  besucherAdresse, adressKennung, tempoGrenze, handlerAus
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

// ---- Hilfen ---------------------------------------------------------------------
// Oeffentliche Sicht: ohne Geraet, ohne Adresse, ohne privates Feedback.
function oeffentlich(b, geraet) {
  return {
    id: b.id, daumen: b.daumen, text: b.text, zeit: b.zeit, geaendert: b.geaendert || null,
    antwort: b.antwort || null, eigene: !!geraet && b.geraet === geraet
  };
}

// ---- Anwendung ------------------------------------------------------------------
// optionen: { ordner, passwort, salz, spiele, jetzt } -- jetzt nur fuer Tests.
export function anwendungBauen(optionen) {
  const speicher = speicherOeffnen(optionen.ordner);
  const SPIELE = optionen.spiele || spieleAusKatalog(KATALOG);
  if (!SPIELE.length) throw new Error("Keine Spiele im Katalog gefunden");
  const passwort = optionen.passwort || "";
  const salz = optionen.salz || "miwale";
  const jetzt = optionen.jetzt || (() => Date.now());
  const begrenzt = tempoGrenze(jetzt);

  function zusammenfassung(spiel, geraet) {
    const liste = speicher.alle.filter((b) => b.spiel === spiel);
    const hoch = liste.filter((b) => b.daumen === "hoch").length;
    const eigene = geraet ? liste.find((b) => b.geraet === geraet) : null;
    return {
      spiel,
      hoch,
      runter: liste.length - hoch,
      // Oeffentlich zu lesen sind nur Bewertungen mit Text; die Daumen zaehlen oben.
      liste: liste
        .filter((b) => b.text)
        .sort((a, b) => b.zeit.localeCompare(a.zeit))
        .map((b) => oeffentlich(b, geraet)),
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
          .map((b) => ({ ...oeffentlich(b), spiel: b.spiel, privat: b.privat, adresse: b.adresse }));
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

    if (req.method === "GET") return [200, zusammenfassung(spiel, geraet)];

    if (req.method === "PUT") {
      if (begrenzt("schreiben|" + ip, GRENZEN.schreibenProFenster)) return [429, { fehler: "zu-schnell" }];
      const k = await lesen(req);
      // Verstecktes Feld: Menschen sehen es nicht, Bots fuellen es aus. Die
      // Antwort tut so, als waere alles gut, damit der Bot nichts lernt.
      if (k.website) return [200, zusammenfassung(spiel, null)];
      if (typeof k.geraet !== "string" || !GERAET_RE.test(k.geraet)) return [400, { fehler: "geraet" }];
      if (k.daumen !== "hoch" && k.daumen !== "runter") return [400, { fehler: "daumen" }];
      const text = textPruefen(k.text, GRENZEN.oeffentlich);
      const privat = textPruefen(k.privat, GRENZEN.privat);
      if (text === null || privat === null) return [400, { fehler: "zu-lang" }];
      const treffer = gesperrteWoerter(text + "\n" + privat, speicher.sperrliste);
      if (treffer.length) return [422, { fehler: "gesperrt", woerter: treffer }];

      const zeit = new Date(jetzt()).toISOString();
      const alt = speicher.alle.find((b) => b.spiel === spiel && b.geraet === k.geraet);
      if (alt) {
        // Wer den Text aendert, dessen alte Antwort passt womoeglich nicht mehr;
        // sie bleibt trotzdem stehen, loeschen kann sie nur die Verwaltung.
        Object.assign(alt, { daumen: k.daumen, text, privat, geaendert: zeit, adresse: adressKennung(salz, ip) });
      } else {
        speicher.alle.push({ id: randomUUID(), spiel, geraet: k.geraet, daumen: k.daumen, text, privat, zeit, adresse: adressKennung(salz, ip), antwort: null });
      }
      speicher.speichern();
      return [200, zusammenfassung(spiel, k.geraet)];
    }

    if (req.method === "DELETE") {
      if (!geraet) return [400, { fehler: "geraet" }];
      const alt = speicher.alle.find((b) => b.spiel === spiel && b.geraet === geraet);
      if (alt) { speicher.alle.splice(speicher.alle.indexOf(alt), 1); speicher.speichern(); }
      return [200, zusammenfassung(spiel, geraet)];
    }

    return [405, { fehler: "methode" }];
  }

  // Als Node-Handler nutzbar: im Container ueber server/start.mjs, lokal als
  // Vite-Middleware (tools/dienste-dev.mjs).
  return handlerAus(verarbeiten);
}
