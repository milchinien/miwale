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
// Laeuft im selben Container wie nginx auf 127.0.0.1:8081; nginx reicht
// /api/bewertungen/ hierher durch (docker/nginx.conf).

import http from "node:http";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { START_SPERRLISTE } from "./sperrliste.mjs";

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
  fensterMs: 10 * 60 * 1000,
  // Falsche Passwoerter je Adresse im Zeitfenster.
  loginVersuche: 10
};

const GERAET_RE = /^[a-zA-Z0-9-]{16,64}$/;

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

  const schreiben = (pfad, inhalt) => {
    const zwischen = pfad + ".tmp";
    writeFileSync(zwischen, JSON.stringify(inhalt, null, 2));
    renameSync(zwischen, pfad);
  };
  if (!existsSync(listeDatei)) schreiben(listeDatei, sperrliste);

  return {
    get alle() { return daten.bewertungen; },
    get sperrliste() { return sperrliste; },
    speichern() { schreiben(datei, daten); },
    sperrlisteSetzen(neu) { sperrliste = neu; schreiben(listeDatei, sperrliste); }
  };
}

// ---- Hilfen ---------------------------------------------------------------------
// Liefert null, wenn der Wert kein Text oder zu lang ist.
function textPruefen(wert, max) {
  if (wert == null) return "";
  if (typeof wert !== "string") return null;
  const t = wert
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return t.length > max ? null : t;
}

function gleich(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

// Oeffentliche Sicht: ohne Geraet, ohne Adresse, ohne privates Feedback.
function oeffentlich(b, geraet) {
  return {
    id: b.id, daumen: b.daumen, text: b.text, zeit: b.zeit, geaendert: b.geaendert || null,
    antwort: b.antwort || null, eigene: !!geraet && b.geraet === geraet
  };
}

function lesen(req) {
  return new Promise((resolve, reject) => {
    let groesse = 0;
    let abgebrochen = false;
    const teile = [];
    req.on("data", (c) => {
      if (abgebrochen) return;
      groesse += c.length;
      if (groesse > 16 * 1024) {
        abgebrochen = true;
        const e = new Error("zu-gross"); e.status = 413; reject(e);
        return;
      }
      teile.push(c);
    });
    req.on("end", () => {
      if (abgebrochen) return;
      try {
        const k = JSON.parse(Buffer.concat(teile).toString("utf8") || "{}");
        if (!k || typeof k !== "object" || Array.isArray(k)) throw new Error("json");
        resolve(k);
      } catch { const e = new Error("json"); e.status = 400; reject(e); }
    });
    req.on("error", reject);
  });
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
  const zaehler = new Map();

  // Adressen werden nie im Klartext gespeichert, nur als Pruefsumme mit Salz.
  // Die reicht, um in der Verwaltung Stimmen von derselben Adresse zu erkennen.
  const adressKennung = (ip) => createHash("sha256").update(salz + "|" + ip).digest("hex").slice(0, 12);

  function begrenzt(schluessel, max) {
    const t = jetzt();
    const eintrag = zaehler.get(schluessel);
    if (!eintrag || t - eintrag.start > GRENZEN.fensterMs) {
      if (zaehler.size > 5000) for (const [k, v] of zaehler) if (t - v.start > GRENZEN.fensterMs) zaehler.delete(k);
      zaehler.set(schluessel, { start: t, n: 1 });
      return false;
    }
    eintrag.n++;
    return eintrag.n > max;
  }

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
    // nginx im Container setzt X-Real-IP auf die Adresse, von der die Anfrage
    // kam. Davor sitzt der Ingress, der die Besucheradresse als letzten Eintrag
    // an X-Forwarded-For haengt; ohne Ingress (lokal) gilt X-Real-IP.
    const weiter = String(req.headers["x-forwarded-for"] || "").split(",").map((s) => s.trim()).filter(Boolean);
    const ip = weiter[weiter.length - 1] || String(req.headers["x-real-ip"] || "") || req.socket.remoteAddress || "unbekannt";

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
        Object.assign(alt, { daumen: k.daumen, text, privat, geaendert: zeit, adresse: adressKennung(ip) });
      } else {
        speicher.alle.push({ id: randomUUID(), spiel, geraet: k.geraet, daumen: k.daumen, text, privat, zeit, adresse: adressKennung(ip), antwort: null });
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

  // Als Node-Handler nutzbar: im Container ueber http.createServer, lokal als
  // Vite-Middleware (tools/bewertungen-dev.mjs).
  return async function handler(req, res) {
    let status, inhalt;
    try {
      [status, inhalt] = await verarbeiten(req);
    } catch (e) {
      status = e.status || 500;
      inhalt = { fehler: e.status ? e.message : "server" };
      if (!e.status) console.error(e);
    }
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    });
    res.end(JSON.stringify(inhalt));
  };
}

// Direkt gestartet: node server/bewertungen.mjs
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.env.BEWERTUNGEN_PORT || 8081);
  const passwort = process.env.BEWERTUNGEN_ADMIN_PASSWORT || "";
  if (!passwort) console.warn("BEWERTUNGEN_ADMIN_PASSWORT fehlt: die Verwaltungsseite bleibt gesperrt.");
  const handler = anwendungBauen({
    ordner: process.env.BEWERTUNGEN_ORDNER || "/data",
    spiele: spieleAusKatalog(process.env.BEWERTUNGEN_KATALOG || KATALOG),
    passwort,
    salz: process.env.BEWERTUNGEN_SALZ || passwort || "miwale"
  });
  http.createServer(handler).listen(port, "127.0.0.1", () => console.log("Bewertungen auf 127.0.0.1:" + port));
}
