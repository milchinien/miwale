// Game Requests fuer miwale.com/requests: Besucher beschreiben ein Spiel, das
// sie sich wuenschen, und legen bis zu vier Skizzen oder Screenshots dazu.
// Fuer das Format "I build your game ideas in one day".
//
// Beim Einreichen entscheidet der Besucher:
//   - oeffentlich (alle sehen die Idee und stimmen hoch oder runter ab) oder
//     privat (nur die Verwaltung sieht sie),
//   - ob er bei einer Umsetzung erwaehnt werden will (nur dann steht sein Name
//     irgendwo),
//   - ob das fertige Spiel auf miwale.com erscheinen darf,
//   - und er bestaetigt, dass Idee und Spiel miwale gehoeren (Pflicht).
//
// Oeffentliche Ideen erscheinen sofort, wie die Bewertungen: der Wortfilter
// haelt das Grobe fern, die Verwaltung kann eine Idee verstecken oder loeschen.
// Nur die Bilder oeffentlicher Ideen zeigt die Seite erst, wenn die Verwaltung
// sie freigegeben hat -- ein Bild ist schneller anstoessig als ein Satz, und
// die Seite sehen Kinder aus YouTube-Shorts. Der Einsender sieht seine Bilder
// immer.
//
// Ansehen und abstimmen kann jeder, einreichen nur mit Konto (konten.mjs).
// Wem eine Idee gehoert, steht als "konto:<id>" im Feld `besitzer`
// (besitzerVon in gemeinsam.mjs); gesperrte Konten reichen nichts mehr ein.
// Stimmen zaehlen je Konto, ohne Konto je Geraet ("geraet:<kennung>",
// geraetVon). Was ein Geraet vor den Konten eingereicht hat, uebernimmt das
// Konto, sobald sich jemand auf diesem Geraet anmeldet. Solange Anmelden nicht
// eingerichtet ist (kontenPflicht), gehoeren neue Ideen wie frueher dem Geraet.
//
// Gespeichert wird ideen.json im Datenordner, die Bilder daneben in
// ideen-bilder/. Die Bilder rechnet der Browser vorher klein und neu (ohne
// Standortdaten aus der Kamera); hier wird nur noch geprueft, dass es wirklich
// JPEG, PNG oder WebP ist.
//
// Jedes Bild kommt in einer eigenen Anfrage (POST /api/ideen/bild) und liegt
// dann "lose", bis die Idee es mitnimmt. So bleibt jede Anfrage unter 1 MB --
// das nimmt jeder Ingress an, ohne dass man dort etwas einstellen muss. Lose
// Bilder, die nach einem Tag keine Idee geholt hat, raeumt der Dienst weg.
//
// Laeuft im selben Prozess wie die Bewertungen (server/start.mjs); nginx reicht
// /api/ideen/ hierher durch.

import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { gesperrteWoerter } from "./bewertungen.mjs";
import {
  textPruefen, gleich, sicherSchreiben, lesen, lesenRoh, sperrlisteLesen,
  besucherAdresse, adressKennung, tempoGrenze, besitzerVon, geraetVon, kontenPflicht, handlerAus
} from "./gemeinsam.mjs";

export const GRENZEN = {
  titel: 80,
  titelMin: 3,
  beschreibung: 3000,
  beschreibungMin: 20,
  name: 40,
  antwort: 1000,
  link: 300,
  bilder: 4,
  // Je Bild nach dem Verkleinern im Browser. Ein Foto einer Papierskizze mit
  // 1600 px Kantenlaenge liegt meist bei 200 bis 600 KB.
  bildBytes: 900 * 1024,
  // Je Adresse im Zeitfenster (10 min): neue Ideen, hochgeladene Bilder,
  // Stimmen. Beim Durchscrollen stimmt ein Mensch schnell mal zwanzigmal ab.
  einreichenProFenster: 8,
  bilderProFenster: 24,
  stimmenProFenster: 150,
  // So lange wartet ein hochgeladenes Bild auf seine Idee.
  loseMs: 24 * 60 * 60 * 1000,
  // Ideen je Besitzer, die noch auf eine Entscheidung warten.
  offenJeBesitzer: 10,
  // Bilder insgesamt; danach nimmt der Dienst nur noch Ideen ohne Bilder an.
  speicherBytes: 2 * 1024 * 1024 * 1024,
  loginVersuche: 10
};

// Text einer Einreichung; die Bilder kommen einzeln.
const KOERPER_MAX = 32 * 1024;

export const GENRES = ["action", "puzzle", "idle", "karten", "roguelike", "jump-and-run", "strategie", "simulation", "rennen", "horror", "musik", "party", "anderes"];
export const PLATTFORMEN = ["pc", "handy", "beides"];
export const SICHTBARKEITEN = ["oeffentlich", "privat"];
export const STAENDE = ["neu", "shortlist", "in-arbeit", "fertig", "nicht-gewaehlt"];

const BILDTYPEN = {
  "image/jpeg": { endung: "jpg", passt: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { endung: "png", passt: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/webp": { endung: "webp", passt: (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" }
};
const ID_RE = /^[0-9a-f-]{36}$/;

// ---- Speicher -------------------------------------------------------------------
export function ideenSpeicher(ordner) {
  const bilderOrdner = join(ordner, "ideen-bilder");
  mkdirSync(bilderOrdner, { recursive: true });
  const datei = join(ordner, "ideen.json");
  const daten = existsSync(datei) ? JSON.parse(readFileSync(datei, "utf8")) : { naechsteNummer: 1, ideen: [], lose: [] };
  daten.lose = daten.lose || [];
  for (const i of daten.ideen) i.stimmen = i.stimmen || {};
  const summe = (liste) => liste.reduce((s, b) => s + b.groesse, 0);

  return {
    get alle() { return daten.ideen; },
    // Hochgeladene Bilder, die noch zu keiner Idee gehoeren.
    get lose() { return daten.lose; },
    nummerZiehen() { return daten.naechsteNummer++; },
    // Die Ordner vor jedem Schreiben sicherstellen: fehlt einer (von Hand
    // geloescht, Volume neu eingehaengt), schluege sonst jeder Upload fehl,
    // bis der Dienst neu startet.
    speichern() { mkdirSync(ordner, { recursive: true }); sicherSchreiben(datei, daten); },
    bildSchreiben(bild, inhalt) { mkdirSync(bilderOrdner, { recursive: true }); sicherSchreiben(this.bildPfad(bild), inhalt); },
    bildPfad(bild) { return join(bilderOrdner, bild.id + "." + BILDTYPEN[bild.typ].endung); },
    belegt() { return summe(daten.lose) + daten.ideen.reduce((s, i) => s + summe(i.bilder), 0); }
  };
}

// Erkennt den Bildtyp am Inhalt, nicht an der Angabe des Browsers.
export function bildTyp(daten) {
  if (daten.length < 16) return null;
  return Object.keys(BILDTYPEN).find((typ) => BILDTYPEN[typ].passt(daten)) || null;
}

function linkPruefen(wert) {
  const t = textPruefen(wert, GRENZEN.link);
  if (t === null) return null;
  if (!t) return "";
  try {
    const u = new URL(t);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch { return null; }
}

// Fuer alle sichtbar: oeffentlich eingereicht und nicht von der Verwaltung versteckt.
export const istOeffentlich = (idee) => idee.sichtbarkeit === "oeffentlich" && !idee.versteckt;

function zaehlen(idee) {
  const werte = Object.values(idee.stimmen || {});
  const hoch = werte.filter((w) => w === 1).length;
  const runter = werte.filter((w) => w === -1).length;
  return { hoch, runter, punkte: hoch - runter };
}

// ---- Anwendung ------------------------------------------------------------------
// optionen: { ordner, passwort, salz, konten, herkunft, jetzt }
//   konten: der Kontendienst mit wer(req) und nameVon(id); jetzt nur fuer Tests.
export function ideenBauen(optionen) {
  const speicher = ideenSpeicher(optionen.ordner);
  const passwort = optionen.passwort || "";
  const salz = optionen.salz || "miwale";
  const jetzt = optionen.jetzt || (() => Date.now());
  const begrenzt = tempoGrenze(jetzt);
  const wer = (req) => (optionen.konten ? optionen.konten.wer(req) : null);
  const nameVon = (id) => (optionen.konten ? optionen.konten.nameVon(id) : null);

  // Was Besucher sehen: ohne Besitzer, Adresse und Stimmen anderer. Der Name nur,
  // wenn der Einsender erwaehnt werden will. Bilder als Adressen; die eigenen
  // darf der Browser laden, weil er den Sitzungs-Cookie mitschickt.
  // besitzer: das Konto ("konto:<id>") oder null; waehler: wer abstimmt (Konto
  // oder Geraet).
  function sicht(idee, besitzer, waehler = besitzer) {
    const eigene = !!besitzer && idee.besitzer === besitzer;
    // Bilder laedt der Browser ohne eigene Koepfe: gehoert die Idee einem
    // Geraet, traegt die Adresse dessen Kennung mit.
    const anhang = eigene && besitzer.startsWith("geraet:") ? "?geraet=" + encodeURIComponent(besitzer.slice(7)) : "";
    const bilderZeigen = eigene || idee.bilderFrei;
    return {
      id: idee.id, nummer: idee.nummer, titel: idee.titel, beschreibung: idee.beschreibung,
      genre: idee.genre, plattform: idee.plattform, name: idee.erwaehnen ? idee.name : "",
      bilder: bilderZeigen ? idee.bilder.map((b) => "/api/ideen/bild/" + b.id + anhang) : [],
      bilderInPruefung: bilderZeigen ? 0 : idee.bilder.length,
      zeit: idee.zeit, stand: idee.stand, antwort: idee.antwort, link: idee.link,
      ...zaehlen(idee),
      meineStimme: waehler ? idee.stimmen[waehler] || 0 : 0,
      eigene,
      // Nur fuer den Einsender selbst: was er beim Einreichen gewaehlt hat.
      ...(eigene ? {
        sichtbarkeit: idee.sichtbarkeit, versteckt: !!idee.versteckt, bilderFrei: !!idee.bilderFrei,
        erwaehnen: idee.erwaehnen, eigenerName: idee.name, veroeffentlichen: idee.veroeffentlichen
      } : {})
    };
  }

  // Oeffentliche Liste nach Punkten, bei Gleichstand die neuere zuerst. Die
  // Seite sortiert selbst noch einmal nach "neu", wenn der Besucher das will.
  function uebersicht(besitzer, waehler = besitzer) {
    return {
      oeffentlich: speicher.alle
        .filter(istOeffentlich)
        .map((i) => sicht(i, besitzer, waehler))
        .sort((a, b) => b.punkte - a.punkte || b.zeit.localeCompare(a.zeit)),
      eigene: besitzer ? speicher.alle.filter((i) => i.besitzer === besitzer).sort((a, b) => b.zeit.localeCompare(a.zeit)).map((i) => sicht(i, besitzer)) : []
    };
  }

  function loeschen(idee) {
    for (const b of idee.bilder) rmSync(speicher.bildPfad(b), { force: true });
    speicher.alle.splice(speicher.alle.indexOf(idee), 1);
    speicher.speichern();
  }

  // Lose Bilder, die zu lange auf ihre Idee warten, sind liegen geblieben
  // (Tab geschlossen, Absenden abgebrochen).
  function loseAufraeumen() {
    const grenze = jetzt() - GRENZEN.loseMs;
    const alt = speicher.lose.filter((b) => Date.parse(b.zeit) < grenze);
    for (const b of alt) {
      rmSync(speicher.bildPfad(b), { force: true });
      speicher.lose.splice(speicher.lose.indexOf(b), 1);
    }
  }

  function bildSenden(res, bild) {
    let inhalt;
    try { inhalt = readFileSync(speicher.bildPfad(bild)); } catch { return [404, { fehler: "bild" }]; }
    res.writeHead(200, {
      "Content-Type": bild.typ,
      "Content-Length": inhalt.length,
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox"
    });
    res.end(inhalt);
    return null;
  }

  async function verarbeiten(req, res) {
    const url = new URL(req.url, "http://lokal");
    const teile = url.pathname.replace(/^\/api\/ideen\/?/, "").split("/").filter(Boolean);
    const ip = besucherAdresse(req);
    const konto = wer(req);
    const geraet = geraetVon(req, url);
    // Ohne Konto gehoert nur im Uebergang etwas dem Geraet.
    const besitzer = besitzerVon(konto) || (kontenPflicht(optionen.konten) ? null : geraet);
    const waehler = besitzer || geraet;
    if (konto && geraet) uebernehmen(geraet, besitzer);
    const adminOk = () => !!passwort && gleich(String(req.headers.authorization || "").replace(/^Bearer\s+/i, ""), passwort);

    // ---- Verwaltung ----
    if (teile[0] === "admin") {
      if (!passwort) return [503, { fehler: "verwaltung-aus" }];
      if (!adminOk()) {
        if (begrenzt("login|" + ip, GRENZEN.loginVersuche)) return [429, { fehler: "zu-viele-versuche" }];
        return [401, { fehler: "passwort" }];
      }
      if (teile[1] === "alle" && req.method === "GET") {
        const ideen = speicher.alle
          .slice()
          .sort((a, b) => b.zeit.localeCompare(a.zeit))
          .map((i) => ({
            ...sicht(i, null),
            // Die Verwaltung sieht alles, auch den Namen ohne Erwaehnung.
            bilder: i.bilder.map((b) => "/api/ideen/bild/" + b.id), bilderInPruefung: 0,
            name: i.name, sichtbarkeit: i.sichtbarkeit, versteckt: !!i.versteckt, bilderFrei: !!i.bilderFrei,
            erwaehnen: i.erwaehnen, veroeffentlichen: i.veroeffentlichen, rechte: i.rechte,
            adresse: i.adresse, besitzer: i.besitzer, konto: kontoName(i), geaendert: i.geaendert || null
          }));
        return [200, { ideen, staende: STAENDE, genres: GENRES, belegt: speicher.belegt(), speicherBytes: GRENZEN.speicherBytes }];
      }
      if (teile[1] === "idee" && teile[2] && !teile[3]) {
        const idee = speicher.alle.find((i) => i.id === teile[2]);
        if (!idee) return [404, { fehler: "nicht-gefunden" }];
        if (req.method === "DELETE") { loeschen(idee); return [200, { ok: true }]; }
        if (req.method === "PUT") {
          const k = await lesen(req);
          const neu = {};
          if (k.stand !== undefined) {
            if (!STAENDE.includes(k.stand)) return [400, { fehler: "stand" }];
            neu.stand = k.stand;
          }
          // Privat bleibt privat: die Verwaltung kann eine oeffentliche Idee
          // verstecken, aber keine private oeffentlich machen.
          if (k.versteckt !== undefined) neu.versteckt = !!k.versteckt;
          if (k.bilderFrei !== undefined) neu.bilderFrei = !!k.bilderFrei;
          if (k.antwort !== undefined) {
            const text = textPruefen(k.antwort, GRENZEN.antwort);
            if (text === null) return [400, { fehler: "zu-lang" }];
            neu.antwort = text ? { text, zeit: new Date(jetzt()).toISOString() } : null;
            if (idee.antwort && text === idee.antwort.text) delete neu.antwort;
          }
          if (k.link !== undefined) {
            const link = linkPruefen(k.link);
            if (link === null) return [400, { fehler: "link" }];
            neu.link = link;
          }
          Object.assign(idee, neu, { geaendert: new Date(jetzt()).toISOString() });
          speicher.speichern();
          return [200, { ok: true }];
        }
      }
      return [404, { fehler: "unbekannt" }];
    }

    // ---- Bilder ----
    if (teile[0] === "bild" && !teile[1] && req.method === "POST") {
      if (!besitzer) return [401, { fehler: "anmelden" }];
      if (konto && konto.gesperrt) return [403, { fehler: "konto-gesperrt" }];
      if (begrenzt("bild|" + ip, GRENZEN.bilderProFenster)) return [429, { fehler: "zu-schnell" }];
      if (konto && begrenzt("bild-konto|" + konto.id, GRENZEN.bilderProFenster)) return [429, { fehler: "zu-schnell" }];
      const daten = await lesenRoh(req, GRENZEN.bildBytes);
      const typ = bildTyp(daten);
      if (!typ) return [400, { fehler: "bild-format" }];
      loseAufraeumen();
      if (speicher.belegt() + daten.length > GRENZEN.speicherBytes) return [507, { fehler: "speicher-voll" }];
      const bild = { id: randomUUID(), typ, groesse: daten.length, besitzer, zeit: new Date(jetzt()).toISOString() };
      speicher.bildSchreiben(bild, daten);
      speicher.lose.push(bild);
      speicher.speichern();
      return [201, { id: bild.id }];
    }

    if (teile[0] === "bild" && teile[1] && !teile[2] && req.method === "GET") {
      if (!ID_RE.test(teile[1])) return [404, { fehler: "bild" }];
      const idee = speicher.alle.find((i) => i.bilder.some((b) => b.id === teile[1]));
      const darf = idee && ((istOeffentlich(idee) && idee.bilderFrei) || (besitzer && idee.besitzer === besitzer) || adminOk());
      if (!darf) return [404, { fehler: "bild" }];
      return bildSenden(res, idee.bilder.find((b) => b.id === teile[1]));
    }

    // ---- Oeffentlich ----
    if (!teile.length && req.method === "GET") return [200, uebersicht(besitzer, waehler)];

    if (!teile.length && req.method === "POST") {
      if (!besitzer) return [401, { fehler: "anmelden" }];
      if (konto && konto.gesperrt) return [403, { fehler: "konto-gesperrt" }];
      if (begrenzt("einreichen|" + ip, GRENZEN.einreichenProFenster)) return [429, { fehler: "zu-schnell" }];
      if (konto && begrenzt("einreichen-konto|" + konto.id, GRENZEN.einreichenProFenster)) return [429, { fehler: "zu-schnell" }];
      const k = await lesen(req, KOERPER_MAX);
      // Verstecktes Feld: Menschen sehen es nicht, Bots fuellen es aus. Die
      // Antwort tut so, als waere alles gut, damit der Bot nichts lernt.
      if (k.website) return [201, { idee: null, ...uebersicht(null) }];
      if (k.rechte !== true) return [400, { fehler: "rechte" }];
      if (!SICHTBARKEITEN.includes(k.sichtbarkeit)) return [400, { fehler: "sichtbarkeit" }];

      const titel = textPruefen(k.titel, GRENZEN.titel);
      const beschreibung = textPruefen(k.beschreibung, GRENZEN.beschreibung);
      const name = textPruefen(k.name, GRENZEN.name);
      if (titel === null || beschreibung === null || name === null) return [400, { fehler: "zu-lang" }];
      if (titel.length < GRENZEN.titelMin) return [400, { fehler: "titel" }];
      if (beschreibung.length < GRENZEN.beschreibungMin) return [400, { fehler: "beschreibung" }];
      const erwaehnen = k.erwaehnen === true;
      // Wer erwaehnt werden will, muss sagen, wie.
      if (erwaehnen && !name) return [400, { fehler: "name" }];
      const genre = k.genre == null || k.genre === "" ? "" : GENRES.includes(k.genre) ? k.genre : null;
      const plattform = k.plattform == null || k.plattform === "" ? "beides" : PLATTFORMEN.includes(k.plattform) ? k.plattform : null;
      if (genre === null || plattform === null) return [400, { fehler: "auswahl" }];

      const treffer = gesperrteWoerter([titel, beschreibung, erwaehnen ? name : ""].join("\n"), sperrlisteLesen(optionen.ordner));
      if (treffer.length) return [422, { fehler: "gesperrt", woerter: treffer }];

      // Nur eigene lose Bilder; ein fremdes oder verfallenes gilt als fehlend.
      const ids = k.bilder == null ? [] : k.bilder;
      if (!Array.isArray(ids) || ids.length > GRENZEN.bilder || new Set(ids).size !== ids.length) return [400, { fehler: "bilder" }];
      const bilder = ids.map((id) => speicher.lose.find((b) => b.id === id && b.besitzer === besitzer));
      if (bilder.some((b) => !b)) return [400, { fehler: "bild-fehlt" }];

      const offen = speicher.alle.filter((i) => i.besitzer === besitzer && i.stand === "neu").length;
      if (offen >= GRENZEN.offenJeBesitzer) return [429, { fehler: "zu-viele-offen" }];

      const zeit = new Date(jetzt()).toISOString();
      const idee = {
        id: randomUUID(), nummer: speicher.nummerZiehen(), besitzer,
        titel, beschreibung, genre, plattform,
        // Ohne Erwaehnung wird kein Name gespeichert.
        name: erwaehnen ? name : "",
        bilder: bilder.map((b) => ({ id: b.id, typ: b.typ, groesse: b.groesse })),
        sichtbarkeit: k.sichtbarkeit, erwaehnen, veroeffentlichen: k.veroeffentlichen === true,
        // Zeitpunkt, zu dem der Einsender bestaetigt hat, dass Idee und Spiel miwale gehoeren.
        rechte: zeit,
        zeit, stand: "neu", versteckt: false, bilderFrei: false, stimmen: {},
        antwort: null, link: "", adresse: adressKennung(salz, ip)
      };
      for (const b of bilder) speicher.lose.splice(speicher.lose.indexOf(b), 1);
      speicher.alle.push(idee);
      speicher.speichern();
      return [201, { idee: sicht(idee, besitzer, waehler), ...uebersicht(besitzer, waehler) }];
    }

    // Abstimmen: +1, -1, oder 0 zum Zuruecknehmen. Eine Stimme je Konto,
    // ohne Konto je Geraet.
    if (teile.length === 2 && teile[1] === "stimme" && req.method === "PUT") {
      if (begrenzt("stimme|" + ip, GRENZEN.stimmenProFenster)) return [429, { fehler: "zu-schnell" }];
      if (!waehler) return [400, { fehler: "geraet" }];
      if (konto && konto.gesperrt) return [403, { fehler: "konto-gesperrt" }];
      const idee = speicher.alle.find((i) => i.id === teile[0]);
      if (!idee || !istOeffentlich(idee)) return [404, { fehler: "nicht-gefunden" }];
      if (besitzer && idee.besitzer === besitzer) return [403, { fehler: "eigene" }];
      const k = await lesen(req);
      if (![1, -1, 0].includes(k.wert)) return [400, { fehler: "wert" }];
      if (k.wert) idee.stimmen[waehler] = k.wert;
      else delete idee.stimmen[waehler];
      speicher.speichern();
      return [200, { idee: sicht(idee, besitzer, waehler) }];
    }

    // Eigene Idee: Sichtbarkeit nachtraeglich aendern oder zurueckziehen.
    if (teile.length === 1) {
      const idee = speicher.alle.find((i) => i.id === teile[0]);
      if (!idee || !besitzer || idee.besitzer !== besitzer) return [404, { fehler: "nicht-gefunden" }];
      if (req.method === "DELETE") {
        loeschen(idee);
        return [200, uebersicht(besitzer, waehler)];
      }
      if (req.method === "PUT") {
        const k = await lesen(req);
        if (!SICHTBARKEITEN.includes(k.sichtbarkeit)) return [400, { fehler: "sichtbarkeit" }];
        idee.sichtbarkeit = k.sichtbarkeit;
        idee.geaendert = new Date(jetzt()).toISOString();
        speicher.speichern();
        return [200, uebersicht(besitzer, waehler)];
      }
    }

    return [404, { fehler: "unbekannt" }];
  }

  // Vor den Konten gehoerten Ideen, Bilder und Stimmen einem Geraet. Meldet
  // sich dort jemand an, gehoeren sie ab dann seinem Konto -- einmal, danach
  // gibt es nichts mehr umzuschreiben.
  function uebernehmen(geraet, besitzer) {
    let geaendert = false;
    for (const i of speicher.alle) {
      if (i.besitzer === geraet) { i.besitzer = besitzer; geaendert = true; }
      if (geraet in i.stimmen) {
        if (!(besitzer in i.stimmen) && i.besitzer !== besitzer) i.stimmen[besitzer] = i.stimmen[geraet];
        delete i.stimmen[geraet];
        geaendert = true;
      }
    }
    for (const b of speicher.lose) if (b.besitzer === geraet) { b.besitzer = besitzer; geaendert = true; }
    if (geaendert) speicher.speichern();
  }

  // Name des Kontos hinter einer Idee, fuer die Verwaltung.
  function kontoName(idee) {
    return idee.besitzer && idee.besitzer.startsWith("konto:") ? nameVon(idee.besitzer.slice(6)) : null;
  }

  // Dazu, was der Kontendienst beim Loeschen und fuer die Auskunft braucht.
  const handler = handlerAus(verarbeiten, { herkunft: optionen.herkunft });
  handler.kontoLoeschen = (id) => {
    const besitzer = "konto:" + id;
    for (const idee of speicher.alle.filter((i) => i.besitzer === besitzer)) loeschen(idee);
    for (const i of speicher.alle) delete i.stimmen[besitzer];
    for (const b of speicher.lose.filter((x) => x.besitzer === besitzer)) {
      rmSync(speicher.bildPfad(b), { force: true });
      speicher.lose.splice(speicher.lose.indexOf(b), 1);
    }
    speicher.speichern();
  };
  handler.kontoDaten = (id) => {
    const besitzer = "konto:" + id;
    return {
      ideen: speicher.alle
        .filter((i) => i.besitzer === besitzer)
        .map((i) => ({ ...sicht(i, besitzer), rechte: i.rechte, adresse: i.adresse })),
      stimmen: speicher.alle
        .filter((i) => besitzer in i.stimmen)
        .map((i) => ({ idee: i.nummer, titel: i.titel, wert: i.stimmen[besitzer] }))
    };
  };
  return handler;
}
