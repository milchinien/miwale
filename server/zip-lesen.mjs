// Entpackt die ZIP-Builds aus dem Studio. Ohne Abhaengigkeiten: liest das
// Inhaltsverzeichnis am Ende der Datei und entpackt jede Datei einzeln als
// Strom (gespeichert oder Deflate). So liegt nie das ganze ZIP im Speicher.
//
// Was ein Build nicht darf -- jedes davon bricht ab, bevor etwas geschrieben wird:
//   - Pfade mit "..", absolute Pfade, Laufwerksbuchstaben, Backslashes, Steuerzeichen
//   - mehr als GRENZEN.dateien Eintraege oder mehr als GRENZEN.entpackt Bytes
//   - verschluesselte Eintraege oder andere Verfahren als Store/Deflate
//   - Eintraege, die sich groesser auspacken als angegeben (ZIP-Bombe)
// Symbolische Links gibt es nicht: alles wird als normale Datei geschrieben.

import { createReadStream, createWriteStream, mkdirSync, openSync, readSync, closeSync, fstatSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { createInflateRaw } from "node:zlib";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

export const ZIP_GRENZEN = {
  dateien: 5000,
  entpackt: 1024 * 1024 * 1024,
  // Verhaeltnis entpackt/gepackt je Datei; echte Builds bleiben weit darunter.
  verhaeltnis: 400
};

function fehler(grund) { const e = new Error(grund); e.status = 422; return e; }

// Prueft und normalisiert einen Pfad im ZIP; null heisst: verboten.
export function pfadOk(name) {
  if (typeof name !== "string" || !name || name.length > 400) return null;
  if (/[\x00-\x1f\\:*?"<>|]/.test(name)) return null;
  if (name.startsWith("/")) return null;
  const teile = name.split("/");
  if (teile.some((t) => t === ".." || t === ".")) return null;
  return teile.filter(Boolean).join("/") + (name.endsWith("/") ? "/" : "");
}

function lesenBei(fd, pos, laenge) {
  const b = Buffer.alloc(laenge);
  const n = readSync(fd, b, 0, laenge, pos);
  return b.subarray(0, n);
}

// Liefert die Eintraege des Inhaltsverzeichnisses.
export function eintraegeLesen(datei, grenzen = ZIP_GRENZEN) {
  const fd = openSync(datei, "r");
  try {
    const groesse = fstatSync(fd).size;
    if (groesse < 22) throw fehler("zip-kaputt");
    const ende = lesenBei(fd, Math.max(0, groesse - 65557), Math.min(groesse, 65557));
    let i = ende.length - 22;
    while (i >= 0 && ende.readUInt32LE(i) !== 0x06054b50) i--;
    if (i < 0) throw fehler("zip-kaputt");
    let anzahl = ende.readUInt16LE(i + 10);
    let cdGroesse = ende.readUInt32LE(i + 12);
    let cdStart = ende.readUInt32LE(i + 16);
    // ZIP64: Werte stehen im eigenen Verzeichnisende davor.
    if (anzahl === 0xffff || cdStart === 0xffffffff) {
      const loc = i - 20;
      if (loc < 0 || ende.readUInt32LE(loc) !== 0x07064b50) throw fehler("zip-kaputt");
      const z64pos = Number(ende.readBigUInt64LE(loc + 8));
      const z = lesenBei(fd, z64pos, 56);
      if (z.readUInt32LE(0) !== 0x06064b50) throw fehler("zip-kaputt");
      anzahl = Number(z.readBigUInt64LE(32));
      cdGroesse = Number(z.readBigUInt64LE(40));
      cdStart = Number(z.readBigUInt64LE(48));
    }
    if (anzahl > grenzen.dateien) throw fehler("zu-viele-dateien");
    if (cdStart + cdGroesse > groesse) throw fehler("zip-kaputt");
    const cd = lesenBei(fd, cdStart, cdGroesse);
    const liste = [];
    let p = 0;
    let summe = 0;
    for (let n = 0; n < anzahl; n++) {
      if (p + 46 > cd.length || cd.readUInt32LE(p) !== 0x02014b50) throw fehler("zip-kaputt");
      const flags = cd.readUInt16LE(p + 8);
      const verfahren = cd.readUInt16LE(p + 10);
      let gepackt = cd.readUInt32LE(p + 20);
      let entpackt = cd.readUInt32LE(p + 24);
      const nameLaenge = cd.readUInt16LE(p + 28);
      const extraLaenge = cd.readUInt16LE(p + 30);
      const kommentarLaenge = cd.readUInt16LE(p + 32);
      let lokal = cd.readUInt32LE(p + 42);
      const nameRoh = cd.subarray(p + 46, p + 46 + nameLaenge);
      const extra = cd.subarray(p + 46 + nameLaenge, p + 46 + nameLaenge + extraLaenge);
      // ZIP64-Extrafeld (0x0001): die grossen Werte in fester Reihenfolge.
      for (let e = 0; e + 4 <= extra.length;) {
        const id = extra.readUInt16LE(e), len = extra.readUInt16LE(e + 2);
        if (id === 0x0001) {
          let q = e + 4;
          if (entpackt === 0xffffffff) { entpackt = Number(extra.readBigUInt64LE(q)); q += 8; }
          if (gepackt === 0xffffffff) { gepackt = Number(extra.readBigUInt64LE(q)); q += 8; }
          if (lokal === 0xffffffff) { lokal = Number(extra.readBigUInt64LE(q)); q += 8; }
        }
        e += 4 + len;
      }
      p += 46 + nameLaenge + extraLaenge + kommentarLaenge;
      // Bit 11: Name in UTF-8; sonst CP437 -- fuer ASCII-Namen dasselbe.
      const name = pfadOk(nameRoh.toString((flags & 0x800) ? "utf8" : "latin1"));
      if (name === null) throw fehler("pfad-verboten");
      if (name.endsWith("/")) continue;
      if (flags & 0x1) throw fehler("zip-verschluesselt");
      if (verfahren !== 0 && verfahren !== 8) throw fehler("zip-verfahren");
      if (verfahren === 0 && gepackt !== entpackt) throw fehler("zip-kaputt");
      if (entpackt > grenzen.verhaeltnis * Math.max(gepackt, 1024)) throw fehler("zip-bombe");
      summe += entpackt;
      if (summe > grenzen.entpackt) throw fehler("zu-gross-entpackt");
      liste.push({ name, verfahren, gepackt, entpackt, lokal });
    }
    // Doppelte Namen (auch nur in Gross-/Kleinschreibung verschieden) waeren je
    // nach Dateisystem dieselbe Datei.
    const namen = new Set();
    for (const e of liste) {
      const k = e.name.toLowerCase();
      if (namen.has(k)) throw fehler("zip-doppelt");
      namen.add(k);
    }
    return liste;
  } finally { closeSync(fd); }
}

// Zaehlt mit und bricht ab, sobald mehr herauskommt als angegeben.
function zaehler(max) {
  let n = 0;
  return new Transform({
    transform(stueck, _k, weiter) {
      n += stueck.length;
      if (n > max) return weiter(fehler("zip-bombe"));
      weiter(null, stueck);
    }
  });
}

// Den gemeinsamen Ordner aller Dateien abziehen ("MeinSpiel/index.html" ->
// "index.html"), damit ein ZIP mit Ueberordner genauso funktioniert.
export function gemeinsamerOrdner(liste) {
  if (!liste.length) return "";
  const erster = liste[0].name.split("/");
  if (erster.length < 2) return "";
  const kandidat = erster[0] + "/";
  return liste.every((e) => e.name.startsWith(kandidat)) ? kandidat : "";
}

// Entpackt nach `ziel` (muss es noch nicht geben). Liefert { dateien, groesse, start }.
// start: Pfad der index.html (bevorzugt ganz oben).
export async function entpacken(datei, ziel, grenzen = ZIP_GRENZEN) {
  const liste = eintraegeLesen(datei, grenzen);
  if (!liste.length) throw fehler("zip-leer");
  const vorne = gemeinsamerOrdner(liste);
  const dateien = liste.map((e) => ({ ...e, ziel: e.name.slice(vorne.length) }));
  const indexe = dateien.filter((e) => /(^|\/)index\.html?$/i.test(e.ziel)).sort((a, b) => a.ziel.split("/").length - b.ziel.split("/").length);
  if (!indexe.length) throw fehler("keine-index-html");
  const fd = openSync(datei, "r");
  let groesse = 0;
  try {
    mkdirSync(ziel, { recursive: true });
    for (const e of dateien) {
      const kopf = lesenBei(fd, e.lokal, 30);
      if (kopf.readUInt32LE(0) !== 0x04034b50) throw fehler("zip-kaputt");
      const start = e.lokal + 30 + kopf.readUInt16LE(26) + kopf.readUInt16LE(28);
      const pfad = join(ziel, ...e.ziel.split("/"));
      if (!pfad.startsWith(ziel.endsWith(sep) ? ziel : ziel + sep)) throw fehler("pfad-verboten");
      mkdirSync(dirname(pfad), { recursive: true });
      const quelle = e.gepackt > 0 ? createReadStream(datei, { start, end: start + e.gepackt - 1 }) : null;
      const schritte = quelle ? [quelle] : [];
      if (quelle && e.verfahren === 8) schritte.push(createInflateRaw());
      schritte.push(zaehler(e.entpackt));
      if (!quelle) { createWriteStream(pfad).end(); continue; }
      await pipeline(...schritte, createWriteStream(pfad, { flags: "wx" })).catch((x) => { throw x.status ? x : fehler("zip-kaputt"); });
      groesse += e.entpackt;
    }
  } finally { closeSync(fd); }
  return { dateien: dateien.length, groesse, start: indexe[0].ziel };
}
