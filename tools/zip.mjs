// Minimaler ZIP-Schreiber ohne Abhaengigkeiten (Node reicht, auch im Docker-Build).
// Fuer das Presskit: Bilder und Videos sind schon komprimiert, die werden nur
// abgelegt; Text und SVG werden mit Deflate verkleinert.
import { deflateRawSync } from 'node:zlib';

const TABELLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(daten) {
  let c = 0xffffffff;
  for (let i = 0; i < daten.length; i++) c = TABELLE[(c ^ daten[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const SCHON_KLEIN = /\.(webp|jpe?g|png|webm|mp4|zip|woff2?)$/i;

/** dateien: [{ name: 'ordner/datei.png', daten: Buffer }]. Feste Zeit, damit zwei Laeufe dieselbe Datei ergeben. */
export function zipBauen(dateien) {
  const teile = [];
  const verzeichnis = [];
  let versatz = 0;
  // 1. Januar 2026, 00:00 im DOS-Format.
  const zeit = 0, datum = ((2026 - 1980) << 9) | (1 << 5) | 1;
  for (const { name, daten } of dateien) {
    const rein = Buffer.from(name, 'utf8');
    const roh = Buffer.isBuffer(daten) ? daten : Buffer.from(daten);
    const packen = !SCHON_KLEIN.test(name) && roh.length > 64;
    const komprimiert = packen ? deflateRawSync(roh, { level: 9 }) : roh;
    const verfahren = packen ? 8 : 0;
    const crc = crc32(roh);
    const kopf = Buffer.alloc(30);
    kopf.writeUInt32LE(0x04034b50, 0);
    kopf.writeUInt16LE(20, 4);
    kopf.writeUInt16LE(0x0800, 6); // Dateinamen sind UTF-8
    kopf.writeUInt16LE(verfahren, 8);
    kopf.writeUInt16LE(zeit, 10);
    kopf.writeUInt16LE(datum, 12);
    kopf.writeUInt32LE(crc, 14);
    kopf.writeUInt32LE(komprimiert.length, 18);
    kopf.writeUInt32LE(roh.length, 22);
    kopf.writeUInt16LE(rein.length, 26);
    teile.push(kopf, rein, komprimiert);
    const eintrag = Buffer.alloc(46);
    eintrag.writeUInt32LE(0x02014b50, 0);
    eintrag.writeUInt16LE(20, 4);
    eintrag.writeUInt16LE(20, 6);
    eintrag.writeUInt16LE(0x0800, 8);
    eintrag.writeUInt16LE(verfahren, 10);
    eintrag.writeUInt16LE(zeit, 12);
    eintrag.writeUInt16LE(datum, 14);
    eintrag.writeUInt32LE(crc, 16);
    eintrag.writeUInt32LE(komprimiert.length, 20);
    eintrag.writeUInt32LE(roh.length, 24);
    eintrag.writeUInt16LE(rein.length, 28);
    eintrag.writeUInt32LE(versatz, 42);
    verzeichnis.push(eintrag, rein);
    versatz += kopf.length + rein.length + komprimiert.length;
  }
  const verz = Buffer.concat(verzeichnis);
  const ende = Buffer.alloc(22);
  ende.writeUInt32LE(0x06054b50, 0);
  ende.writeUInt16LE(dateien.length, 8);
  ende.writeUInt16LE(dateien.length, 10);
  ende.writeUInt32LE(verz.length, 12);
  ende.writeUInt32LE(versatz, 16);
  return Buffer.concat([...teile, verz, ende]);
}
