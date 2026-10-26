// Stimmen fuer die Game Style Library (miwale.com/styles).
//
// Bewertet wird mit Daumen hoch oder runter, ohne Konto, eine Stimme je Geraet
// und Ziel. Ziele:
//   style:<id>              ein ganzer Style
//   el:<id>:<element>       ein Design-Element eines Styles (world, characters, …)
//   mix:<id>                ein Design aus der Community (aus dem Mixer veroeffentlicht)
// Daraus entstehen die Ranglisten: beliebte Styles stehen in der Galerie oben,
// im Mixer stehen je Element die beliebtesten Quellen vorn, und die Community-
// Designs sind nach Stimmen sortiert.
//
// Veroeffentlichte Designs haben einen Namen (Wortfilter wie bei den
// Bewertungen) und je Element einen Style aus dem Katalog. Dasselbe Design
// zweimal gibt es nicht: wer es erneut veroeffentlicht, bekommt das vorhandene.
//
// Keine Abhaengigkeiten, eine JSON-Datei im Datenordner. Laeuft im selben
// Prozess wie die Bewertungen (server/start.mjs); nginx reicht /api/stimmen/ durch.

import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { gesperrteWoerter } from "./bewertungen.mjs";
import {
  GERAET_RE, FENSTER_MS, textPruefen, gleich, sicherSchreiben, lesen, sperrlisteLesen, besucherAdresse, adressKennung, tempoGrenze, handlerAus, adminSchutz, adminAbweisung
} from "./gemeinsam.mjs";

// Welche Styles es gibt, steht im Katalog der Seite (tools/build-styles.mjs).
export const STYLE_KATALOG = fileURLToPath(new URL("../public/styles/styles.json", import.meta.url));
export function stylesAusKatalog(pfad) {
  const k = JSON.parse(readFileSync(pfad, "utf8"));
  return { ids: k.styles.map((s) => s.id), elemente: k.elements.map((e) => e.key) };
}

export const GRENZEN = {
  name: 40,
  // Stimmen je Adresse im Zeitfenster: wer sich durch die Galerie klickt, gibt
  // schnell ein paar Dutzend ab; ein Skript will tausende.
  stimmenProFenster: 150,
  // Veroeffentlichte Designs je Adresse im Zeitfenster.
  mixeProFenster: 6,
  fensterMs: FENSTER_MS,
  loginVersuche: 10,
  // Mehr Designs zeigt die Liste nicht; die Rangliste braucht keine tausend.
  mixeInListe: 120
};

const PICKS = ["world", "characters", "props", "effects", "atmosphere", "ui"];

/**
 * Untere Grenze des Wilson-Intervalls (95 %) fuer den Anteil der Daumen hoch.
 * Sie ordnet fair: 3 von 3 steht nicht vor 90 von 100, weil wenige Stimmen
 * wenig sicher sind. Ohne Stimmen 0.
 */
export function wilson(hoch, runter) {
  const n = hoch + runter;
  if (!n) return 0;
  const z = 1.96, p = hoch / n;
  return (p + z * z / (2 * n) - z * Math.sqrt((p * (1 - p) + z * z / (4 * n)) / n)) / (1 + z * z / n);
}

export function stimmenBauen(optionen) {
  const ordner = optionen.ordner;
  mkdirSync(ordner, { recursive: true });
  const datei = join(ordner, "stimmen.json");
  const daten = existsSync(datei) ? JSON.parse(readFileSync(datei, "utf8")) : {};
  daten.stimmen = daten.stimmen || {};
  daten.mixe = daten.mixe || [];
  const speichern = () => sicherSchreiben(datei, daten);

  const katalog = optionen.katalog || stylesAusKatalog(STYLE_KATALOG);
  const STYLES = new Set(katalog.ids);
  const ELEMENTE = new Set(katalog.elemente);
  const passwort = optionen.passwort || "";
  const salz = optionen.salz || "miwale";
  const jetzt = optionen.jetzt || (() => Date.now());
  const begrenzt = tempoGrenze(jetzt);
  const admin = optionen.adminSchutz || adminSchutz(jetzt);

  function zielOk(ziel) {
    const t = String(ziel).split(":");
    if (t[0] === "style") return t.length === 2 && STYLES.has(t[1]);
    if (t[0] === "el") return t.length === 3 && STYLES.has(t[1]) && ELEMENTE.has(t[2]);
    if (t[0] === "mix") return t.length === 2 && daten.mixe.some((m) => m.id === t[1]);
    return false;
  }
  function zaehlen(ziel) {
    const s = daten.stimmen[ziel] || {};
    let hoch = 0, runter = 0;
    for (const g in s) { if (s[g] > 0) hoch++; else runter++; }
    return { hoch, runter };
  }
  const mixSicht = (m) => ({ id: m.id, name: m.name, picks: m.picks, zeit: m.zeit, ...zaehlen("mix:" + m.id) });
  const gleicheWahl = (a, b) => PICKS.every((k) => a[k] === b[k]);

  async function verarbeiten(req) {
    const url = new URL(req.url, "http://lokal");
    let teile;
    try { teile = url.pathname.replace(/^\/api\/stimmen\/?/, "").split("/").filter(Boolean).map(decodeURIComponent); }
    catch { return [400, { fehler: "adresse" }]; }
    const ip = besucherAdresse(req);

    if (teile[0] === "healthz") return [200, { ok: true }];

    // ---- Verwaltung: veroeffentlichte Designs ansehen und loeschen ----
    if (teile[0] === "admin") {
      const nein = adminAbweisung(admin(req, passwort));
      if (nein) return nein;
      if (teile[1] === "mixe" && !teile[2] && req.method === "GET") {
        return [200, { mixe: daten.mixe.map((m) => ({ ...mixSicht(m), adresse: m.adresse })) }];
      }
      if (teile[1] === "mixe" && teile[2] && req.method === "DELETE") {
        const vorher = daten.mixe.length;
        daten.mixe = daten.mixe.filter((m) => m.id !== teile[2]);
        delete daten.stimmen["mix:" + teile[2]];
        if (daten.mixe.length === vorher) return [404, { fehler: "unbekannt" }];
        speichern();
        return [200, { ok: true }];
      }
      return [404, { fehler: "unbekannt" }];
    }

    // ---- Alles lesen: Zaehler, eigene Stimmen, Community-Designs ----
    if (!teile.length && req.method === "GET") {
      const geraet = url.searchParams.get("geraet") || "";
      const ziele = {}, eigene = {};
      for (const ziel in daten.stimmen) {
        const z = zaehlen(ziel);
        if (z.hoch || z.runter) ziele[ziel] = z;
        if (GERAET_RE.test(geraet) && daten.stimmen[ziel][geraet]) eigene[ziel] = daten.stimmen[ziel][geraet];
      }
      const mixe = daten.mixe.map(mixSicht)
        .sort((a, b) => wilson(b.hoch, b.runter) - wilson(a.hoch, a.runter) || b.zeit.localeCompare(a.zeit))
        .slice(0, GRENZEN.mixeInListe);
      return [200, { ziele, eigene, mixe }];
    }

    // ---- Abstimmen: PUT /api/stimmen/<ziel>  { geraet, wert: 1 | -1 | 0 } ----
    if (teile.length === 1 && req.method === "PUT" && teile[0] !== "mixe") {
      const ziel = teile[0];
      if (!zielOk(ziel)) return [404, { fehler: "unbekanntes-ziel" }];
      const k = await lesen(req, 1024);
      if (!GERAET_RE.test(String(k.geraet || ""))) return [400, { fehler: "geraet" }];
      if (![1, -1, 0].includes(k.wert)) return [400, { fehler: "wert" }];
      if (begrenzt("stimme|" + ip, GRENZEN.stimmenProFenster)) return [429, { fehler: "zu-schnell" }];
      const s = (daten.stimmen[ziel] = daten.stimmen[ziel] || {});
      if (k.wert) s[k.geraet] = k.wert; else delete s[k.geraet];
      if (!Object.keys(s).length) delete daten.stimmen[ziel];
      speichern();
      return [200, { ziel, ...zaehlen(ziel), eigene: k.wert }];
    }

    // ---- Design veroeffentlichen: POST /api/stimmen/mixe  { geraet, name, picks, website } ----
    if (teile[0] === "mixe" && teile.length === 1 && req.method === "POST") {
      const k = await lesen(req, 4096);
      // verstecktes Feld: Menschen sehen es nicht, Bots fuellen es aus
      if (k.website) return [400, { fehler: "bot" }];
      if (!GERAET_RE.test(String(k.geraet || ""))) return [400, { fehler: "geraet" }];
      const name = textPruefen(k.name, GRENZEN.name);
      if (!name) return [400, { fehler: "name" }];
      if (/\n/.test(name)) return [400, { fehler: "name" }];
      const picks = {};
      for (const p of PICKS) {
        const v = k.picks && k.picks[p];
        if (!STYLES.has(v)) return [400, { fehler: "picks" }];
        picks[p] = v;
      }
      if (new Set(Object.values(picks)).size < 2) return [400, { fehler: "kein-mix" }];
      const vorhanden = daten.mixe.find((m) => gleicheWahl(m.picks, picks));
      if (vorhanden) return [200, { mix: mixSicht(vorhanden), vorhanden: true }];
      const boese = gesperrteWoerter(name, sperrlisteLesen(ordner));
      if (boese.length) return [400, { fehler: "woerter" }];
      if (begrenzt("mix|" + ip, GRENZEN.mixeProFenster)) return [429, { fehler: "zu-schnell" }];
      const mix = { id: randomUUID().slice(0, 8), name, picks, zeit: new Date(jetzt()).toISOString(), adresse: adressKennung(salz, ip) };
      daten.mixe.push(mix);
      // wer veroeffentlicht, mag sein Design
      daten.stimmen["mix:" + mix.id] = { [k.geraet]: 1 };
      speichern();
      return [201, { mix: mixSicht(mix), vorhanden: false }];
    }

    return [404, { fehler: "unbekannt" }];
  }

  return handlerAus(verarbeiten, { herkunft: optionen.herkunft });
}
