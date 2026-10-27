// Sterne fuer die Jam-Spiele (miwale.com/jam).
//
// Zu jeder Jam stehen dort die Spiele, die miwale dafuer gebaut hat. Wer sie
// ausprobiert, gibt 1 bis 5 Sterne, dazu einen Namen und freiwillig eine
// Begruendung. So sieht miwale, welches Spiel er einreicht, ohne dass ihm jeder
// einzeln schreiben muss. Ohne Konto: eine Bewertung je Geraet und Spiel
// (dieselbe Kennung `miwale-geraet` wie bei den Spielbewertungen); wer erneut
// bewertet, aendert seine.
//
// Welche Spiele es gibt, steht in public/jam/jams.json. Keine Abhaengigkeiten,
// eine JSON-Datei im Datenordner. Laeuft im selben Prozess wie die Bewertungen
// (server/start.mjs); nginx reicht /api/jam/ durch.

import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { gesperrteWoerter } from "./bewertungen.mjs";
import {
  GERAET_RE, FENSTER_MS, textPruefen, sicherSchreiben, lesen, sperrlisteLesen, besucherAdresse, adressKennung, tempoGrenze, handlerAus, adminSchutz, adminAbweisung
} from "./gemeinsam.mjs";

export const JAM_KATALOG = fileURLToPath(new URL("../public/jam/jams.json", import.meta.url));

// Alle Spiel-Kennungen aus dem Katalog. Sie muessen ueber alle Jams eindeutig
// sein, denn die Sterne haengen nur an der Kennung des Spiels.
export function jamSpieleAusKatalog(pfad) {
  const k = JSON.parse(readFileSync(pfad, "utf8"));
  return k.jams.flatMap((j) => j.spiele.map((s) => s.id));
}

export const GRENZEN = {
  name: 30,
  text: 600,
  // Schreibende Anfragen je Adresse im Zeitfenster: ein Mensch bewertet ein paar
  // Spiele und korrigiert sich vielleicht; ein Skript will hunderte.
  schreibenProFenster: 20,
  fensterMs: FENSTER_MS
};

export function jamBauen(optionen) {
  const ordner = optionen.ordner;
  mkdirSync(ordner, { recursive: true });
  const datei = join(ordner, "jam.json");
  const daten = existsSync(datei) ? JSON.parse(readFileSync(datei, "utf8")) : {};
  daten.bewertungen = daten.bewertungen || [];
  const speichern = () => sicherSchreiben(datei, daten);

  // Fest vorgegeben (Tests) oder aus dem Katalog; der wird neu gelesen, sobald
  // er sich aendert -- lokal kommt ein neues Spiel so ohne Neustart dazu.
  const katalog = optionen.katalog || JAM_KATALOG;
  let gelesen = { stand: -1, ids: new Set(optionen.spiele || []) };
  function spieleSet() {
    if (optionen.spiele) return gelesen.ids;
    try {
      const stand = statSync(katalog).mtimeMs;
      if (stand !== gelesen.stand) gelesen = { stand, ids: new Set(jamSpieleAusKatalog(katalog)) };
    } catch (e) { if (gelesen.stand === -1) throw e; }
    return gelesen.ids;
  }
  spieleSet();
  const passwort = optionen.passwort || "";
  const salz = optionen.salz || "miwale";
  const jetzt = optionen.jetzt || (() => Date.now());
  const begrenzt = tempoGrenze(jetzt);
  const admin = optionen.adminSchutz || adminSchutz(jetzt);

  const sicht = (b) => ({ id: b.id, name: b.name, sterne: b.sterne, text: b.text, zeit: b.zeit });

  // Schnitt, Anzahl, Verteilung (Index 0 = 1 Stern) und die Bewertungen, neueste zuerst.
  function zusammenfassen(spiel) {
    const liste = daten.bewertungen.filter((b) => b.spiel === spiel);
    const verteilung = [0, 0, 0, 0, 0];
    let summe = 0;
    for (const b of liste) { verteilung[b.sterne - 1]++; summe += b.sterne; }
    return {
      anzahl: liste.length,
      schnitt: liste.length ? Math.round((summe / liste.length) * 100) / 100 : 0,
      verteilung,
      bewertungen: liste.slice().sort((a, b) => b.zeit.localeCompare(a.zeit)).map(sicht)
    };
  }

  async function verarbeiten(req) {
    const url = new URL(req.url, "http://lokal");
    let teile;
    try { teile = url.pathname.replace(/^\/api\/jam\/?/, "").split("/").filter(Boolean).map(decodeURIComponent); }
    catch { return [400, { fehler: "adresse" }]; }
    const ip = besucherAdresse(req);
    const SPIELE = spieleSet();

    if (teile[0] === "healthz") return [200, { ok: true }];

    // ---- Verwaltung: alle Bewertungen samt Adress-Pruefsumme, loeschen ----
    if (teile[0] === "admin") {
      const nein = adminAbweisung(admin(req, passwort));
      if (nein) return nein;
      if (!teile[1] && req.method === "GET") {
        return [200, { bewertungen: daten.bewertungen.map((b) => ({ ...sicht(b), spiel: b.spiel, adresse: b.adresse })) }];
      }
      if (teile[1] && !teile[2] && req.method === "DELETE") {
        const vorher = daten.bewertungen.length;
        daten.bewertungen = daten.bewertungen.filter((b) => b.id !== teile[1]);
        if (daten.bewertungen.length === vorher) return [404, { fehler: "unbekannt" }];
        speichern();
        return [200, { ok: true }];
      }
      return [404, { fehler: "unbekannt" }];
    }

    // ---- Alles lesen: je Spiel die Zusammenfassung, dazu die eigenen ----
    if (!teile.length && req.method === "GET") {
      const geraet = url.searchParams.get("geraet") || "";
      const spiele = {}, eigene = {};
      for (const id of SPIELE) spiele[id] = zusammenfassen(id);
      if (GERAET_RE.test(geraet)) {
        for (const b of daten.bewertungen) if (b.geraet === geraet && SPIELE.has(b.spiel)) eigene[b.spiel] = sicht(b);
      }
      return [200, { spiele, eigene }];
    }

    if (teile.length !== 1) return [404, { fehler: "unbekannt" }];
    const spiel = teile[0];
    if (!SPIELE.has(spiel)) return [404, { fehler: "unbekanntes-spiel" }];

    // ---- Bewerten: PUT /api/jam/<spiel>  { geraet, name, sterne, text, website } ----
    if (req.method === "PUT") {
      const k = await lesen(req, 4096);
      // verstecktes Feld: Menschen sehen es nicht, Bots fuellen es aus
      if (k.website) return [400, { fehler: "bot" }];
      if (!GERAET_RE.test(String(k.geraet || ""))) return [400, { fehler: "geraet" }];
      if (!Number.isInteger(k.sterne) || k.sterne < 1 || k.sterne > 5) return [400, { fehler: "sterne" }];
      const name = textPruefen(k.name, GRENZEN.name);
      if (!name || /\n/.test(name)) return [400, { fehler: "name" }];
      const text = textPruefen(k.text, GRENZEN.text);
      if (text === null) return [400, { fehler: "text" }];
      if (gesperrteWoerter(name + "\n" + text, sperrlisteLesen(ordner)).length) return [400, { fehler: "woerter" }];
      if (begrenzt("jam|" + ip, GRENZEN.schreibenProFenster)) return [429, { fehler: "zu-schnell" }];
      const zeit = new Date(jetzt()).toISOString();
      let b = daten.bewertungen.find((x) => x.spiel === spiel && x.geraet === k.geraet);
      if (b) Object.assign(b, { name, sterne: k.sterne, text, zeit, adresse: adressKennung(salz, ip) });
      else {
        b = { id: randomUUID().slice(0, 8), spiel, geraet: k.geraet, name, sterne: k.sterne, text, zeit, adresse: adressKennung(salz, ip) };
        daten.bewertungen.push(b);
      }
      speichern();
      return [200, { spiel: zusammenfassen(spiel), eigene: sicht(b) }];
    }

    // ---- Eigene Bewertung zurueckziehen: DELETE /api/jam/<spiel>  { geraet } ----
    if (req.method === "DELETE") {
      const k = await lesen(req, 1024);
      if (!GERAET_RE.test(String(k.geraet || ""))) return [400, { fehler: "geraet" }];
      if (begrenzt("jam|" + ip, GRENZEN.schreibenProFenster)) return [429, { fehler: "zu-schnell" }];
      const vorher = daten.bewertungen.length;
      daten.bewertungen = daten.bewertungen.filter((x) => !(x.spiel === spiel && x.geraet === k.geraet));
      if (daten.bewertungen.length !== vorher) speichern();
      return [200, { spiel: zusammenfassen(spiel), eigene: null }];
    }

    return [404, { fehler: "unbekannt" }];
  }

  return handlerAus(verarbeiten, { herkunft: optionen.herkunft });
}
