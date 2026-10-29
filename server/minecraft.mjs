// Statistiken des Minecraft-Servers (miwale.com/minecraft/statistics).
//
// Der Server laeuft zu Hause auf einem PC, nicht hier. Dessen Verwaltungs-Panel
// schickt alle paar Minuten seinen Stand hierher (PUT /api/minecraft/): Spieler
// mit ihren Werten, die Toplisten der Welt, ob der Server laeuft -- und alles,
// was die Seite an Minecraft-Grafik braucht (Texturen, Spielerkoepfe, die
// Schrift, deutsche Namen der Bloecke und Mobs). Die stammen aus der
// Minecraft-Installation auf dem PC und liegen darum nicht in diesem
// (oeffentlichen) Repository, sondern nur im Datenordner.
//
// Schreiben darf nur das Panel, mit einem Schluessel. Gueltig ist
//   - ein Schluessel, dessen SHA-256 in server/minecraft-schluessel.json steht.
//     Die Pruefsumme darf oeffentlich sein: der Schluessel ist zufaellig
//     (256 Bit) und laesst sich aus ihr nicht zurueckrechnen. So braucht es
//     weder eine Einstellung auf dem Server noch das Passwort der Verwaltung.
//   - der aus dem Passwort der Verwaltung abgeleitete (oder fest aus
//     MINECRAFT_TOKEN). Das Panel holt ihn einmal ueber
//     POST /api/minecraft/verbinden mit dem Passwort und speichert nur ihn.
//
// Lesen ist oeffentlich:
//   GET /api/minecraft/                     Stand ohne Grafik (JSON)
//   GET /api/minecraft/textur/<name>.png    eine Textur aus dem Stand
//   GET /api/minecraft/schrift.woff         die Schrift

import { createHash, createHmac } from "node:crypto";
import { fileURLToPath } from "node:url";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { sicherSchreiben, lesenRoh, adminSchutz, adminAbweisung, gleich, anschluss, besucherAdresse, FENSTER_MS } from "./gemeinsam.mjs";

export const SCHLUESSEL_DATEI = fileURLToPath(new URL("./minecraft-schluessel.json", import.meta.url));

// Pruefsummen der Panel-Schluessel (siehe oben).
export function schluesselHashesLesen(pfad = SCHLUESSEL_DATEI) {
  try {
    return (JSON.parse(readFileSync(pfad, "utf8")).sha256 || []).filter((h) => /^[0-9a-f]{64}$/.test(h));
  } catch {
    return [];
  }
}

export const GRENZEN = {
  koerper: 1024 * 1024,
  spieler: 200,
  online: 100,
  top: 30,
  namen: 1000,
  texturen: 600,
  texturBytes: 16 * 1024,
  schriftBytes: 256 * 1024
};

// Die Werte je Spieler, die das Panel schickt (panel/server.js, buildStats()).
export const WERTE = [
  "playSec", "mined", "mobKills", "playerKills", "deaths", "crafted", "used",
  "distanceKm", "jumps", "damageDealt", "damageTaken", "fish", "bred"
];
const LISTEN_SPIELER = ["topMined", "topKilled", "killedBy"];
const LISTEN_WELT = ["topMined", "topKilled", "topKilledBy", "topCrafted"];

const NAME_RE = /^[A-Za-z0-9_]{1,16}$/;
const ID_RE = /^[a-z0-9_]{1,64}$/;
const NAMEN_RE = /^[a-z0-9_.]{1,80}$/;
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function schluesselAus(passwort) {
  return passwort ? createHmac("sha256", passwort).update("miwale-minecraft-statistik-v1").digest("hex") : "";
}

function fehler(text) { const e = new Error(text); e.status = 400; return e; }
const zahl = (v) => (typeof v === "number" && Number.isFinite(v) && v >= 0 && v < 1e15 ? v : 0);
function text(v, max) {
  if (typeof v !== "string") return "";
  return v.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);
}
function liste(v, max) {
  if (!Array.isArray(v)) return [];
  return v.slice(0, max)
    .filter((e) => e && ID_RE.test(String(e.id)))
    .map((e) => ({ id: e.id, count: zahl(e.count) }));
}
function bild(b64, max, magie) {
  if (typeof b64 !== "string" || b64.length > Math.ceil(max / 3) * 4 + 4) return null;
  const buf = Buffer.from(b64, "base64");
  if (!buf.length || buf.length > max || !buf.subarray(0, magie.length).equals(magie)) return null;
  return buf;
}
const kurz = (buf) => createHash("sha256").update(buf).digest("hex").slice(0, 10);

// Prueft den Stand vom Panel und behaelt nur, was die Seite zeigt.
export function standPruefen(k, jetzt) {
  if (!k || typeof k !== "object" || k.version !== 1) throw fehler("version");
  const s = k.server && typeof k.server === "object" ? k.server : {};
  const server = {
    name: text(s.name, 60),
    version: text(s.version, 40),
    online: s.online === true,
    maxSpieler: Math.min(zahl(s.maxSpieler), 1000),
    spielerOnline: (Array.isArray(s.spielerOnline) ? s.spielerOnline : []).filter((n) => NAME_RE.test(String(n))).slice(0, GRENZEN.online)
  };
  if (!Array.isArray(k.spieler)) throw fehler("spieler");
  const spieler = k.spieler.slice(0, GRENZEN.spieler).filter((p) => p && NAME_RE.test(String(p.name))).map((p) => {
    const aus = { name: p.name };
    for (const w of WERTE) aus[w] = zahl(p[w]);
    for (const l of LISTEN_SPIELER) aus[l] = liste(p[l], 5);
    return aus;
  });
  const w = k.welt && typeof k.welt === "object" ? k.welt : {};
  const welt = { totals: {} };
  for (const [key, v] of Object.entries(w.totals || {})) if (/^[a-zA-Z]{1,20}$/.test(key)) welt.totals[key] = zahl(v);
  for (const l of LISTEN_WELT) welt[l] = liste(w[l], GRENZEN.top);

  const namen = {};
  for (const [id, n] of Object.entries(k.namen && typeof k.namen === "object" ? k.namen : {}).slice(0, GRENZEN.namen)) {
    const t = text(n, 80);
    if (NAMEN_RE.test(id) && t) namen[id] = t;
  }
  const texturen = new Map();
  for (const [id, b64] of Object.entries(k.texturen && typeof k.texturen === "object" ? k.texturen : {}).slice(0, GRENZEN.texturen)) {
    const buf = ID_RE.test(id) ? bild(b64, GRENZEN.texturBytes, PNG) : null;
    if (buf) texturen.set(id, buf);
  }
  const schrift = k.schrift ? bild(k.schrift, GRENZEN.schriftBytes, Buffer.from("wOFF")) : null;
  return { zeit: new Date(jetzt).toISOString(), server, spieler, welt, namen, texturen, schrift };
}

export function minecraftBauen(optionen) {
  const ordner = join(optionen.ordner, "minecraft");
  mkdirSync(ordner, { recursive: true });
  const datei = join(ordner, "stand.json");
  const jetzt = optionen.jetzt || (() => Date.now());
  const passwort = optionen.passwort || "";
  const schluessel = optionen.schluessel || schluesselAus(passwort);
  const hashes = optionen.schluesselHashes || schluesselHashesLesen();
  const admin = optionen.adminSchutz || adminSchutz(jetzt);

  // Schluessel pruefen, mit eigener Sperre nach 10 Fehlversuchen je Anschluss
  // (Raten am Schluessel soll nicht die Verwaltung sperren, und umgekehrt).
  // "ok" | "aus" | "gesperrt" | "falsch"
  const fehl = new Map();
  function schluesselPruefen(req) {
    if (!schluessel && !hashes.length) return "aus";
    const t = jetzt();
    const wer = anschluss(besucherAdresse(req));
    let e = fehl.get(wer);
    if (e && t - e.start > FENSTER_MS) { fehl.delete(wer); e = null; }
    if (e && e.n >= 10) return "gesperrt";
    const kopf = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    const summe = createHash("sha256").update(kopf).digest("hex");
    if (kopf && ((schluessel && gleich(kopf, schluessel)) || hashes.some((h) => gleich(h, summe)))) return "ok";
    if (!e) {
      if (fehl.size > 5000) for (const [k, v] of fehl) if (t - v.start > FENSTER_MS) fehl.delete(k);
      e = { start: t, n: 0 };
      fehl.set(wer, e);
    }
    e.n++;
    return "falsch";
  }

  let stand = null;
  // Antwort fuer GET /api/minecraft/, einmal je Stand gebaut.
  let oeffentlich = null;

  function oeffentlichBauen() {
    if (!stand) return { leer: true };
    const texturen = {};
    for (const [id, buf] of stand.texturen) texturen[id] = kurz(buf);
    return {
      zeit: stand.zeit, server: stand.server, spieler: stand.spieler, welt: stand.welt, namen: stand.namen,
      texturen, schrift: stand.schrift ? kurz(stand.schrift) : null
    };
  }

  if (existsSync(datei)) {
    try {
      const d = JSON.parse(readFileSync(datei, "utf8"));
      stand = { ...d, texturen: new Map(Object.entries(d.texturen || {}).map(([k, v]) => [k, Buffer.from(v, "base64")])),
        schrift: d.schrift ? Buffer.from(d.schrift, "base64") : null };
    } catch (e) { console.error("Minecraft-Stand unlesbar, beginne leer:", e.message); }
  }
  oeffentlich = oeffentlichBauen();

  function speichern() {
    sicherSchreiben(datei, JSON.stringify({
      ...stand,
      texturen: Object.fromEntries([...stand.texturen].map(([k, v]) => [k, v.toString("base64")])),
      schrift: stand.schrift ? stand.schrift.toString("base64") : null
    }));
  }

  function antworten(res, status, inhalt, koepfe = {}) {
    const istPuffer = Buffer.isBuffer(inhalt);
    res.writeHead(status, {
      "Content-Type": istPuffer ? koepfe["Content-Type"] : "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...koepfe
    });
    res.end(istPuffer ? inhalt : JSON.stringify(inhalt));
  }

  // Fuer Bilder und Schrift: mit ?v=<pruefsumme> aendert sich der Inhalt nie.
  const zwischenspeicher = (url) => (url.searchParams.has("v") ? "public, max-age=31536000, immutable" : "public, max-age=300");

  async function verarbeiten(req, res) {
    const url = new URL(req.url, "http://lokal");
    const pfad = url.pathname.replace(/^\/api\/minecraft\/?/, "");

    if (pfad === "healthz") return antworten(res, 200, { ok: true });

    if (pfad === "" && (req.method === "GET" || req.method === "HEAD")) {
      return antworten(res, 200, oeffentlich, { "Cache-Control": "no-cache" });
    }

    const textur = /^textur\/([a-z0-9_]{1,64})\.png$/.exec(pfad);
    if (textur && req.method === "GET") {
      const buf = stand && stand.texturen.get(textur[1]);
      if (!buf) return antworten(res, 404, { fehler: "unbekannt" });
      return antworten(res, 200, buf, { "Content-Type": "image/png", "Cache-Control": zwischenspeicher(url) });
    }

    if (pfad === "schrift.woff" && req.method === "GET") {
      if (!stand || !stand.schrift) return antworten(res, 404, { fehler: "unbekannt" });
      return antworten(res, 200, stand.schrift, { "Content-Type": "font/woff", "Cache-Control": zwischenspeicher(url) });
    }

    // ---- Panel verbinden: Passwort der Verwaltung gegen den Schluessel ----
    // Kein Schutz gegen fremde Seiten noetig: ohne Passwort im Kopf geht nichts,
    // und den Kopf kann eine fremde Seite nicht mitschicken.
    if (pfad === "verbinden" && req.method === "POST") {
      const nein = adminAbweisung(admin(req, passwort));
      if (nein) return antworten(res, nein[0], nein[1]);
      return antworten(res, 200, { schluessel });
    }

    // ---- Neuer Stand vom Panel ----
    if (pfad === "" && req.method === "PUT") {
      const pruefung = schluesselPruefen(req);
      if (pruefung !== "ok") {
        const [status, inhalt] = { aus: [503, { fehler: "aus" }], gesperrt: [429, { fehler: "zu-viele-versuche" }] }[pruefung] || [401, { fehler: "schluessel" }];
        return antworten(res, status, inhalt);
      }
      const roh = await lesenRoh(req, GRENZEN.koerper);
      let k;
      try { k = JSON.parse(roh.toString("utf8")); } catch { throw fehler("json"); }
      const neu = standPruefen(k, jetzt());
      // Grafik nur ersetzen, wenn mitgeschickt: das Panel schickt sie nur, wenn sie sich aendert.
      if (stand && !neu.texturen.size && k.texturenBehalten === true) neu.texturen = stand.texturen;
      if (stand && !neu.schrift && k.texturenBehalten === true) neu.schrift = stand.schrift;
      stand = neu;
      speichern();
      oeffentlich = oeffentlichBauen();
      return antworten(res, 200, { ok: true, zeit: stand.zeit, texturen: stand.texturen.size, schrift: !!stand.schrift });
    }

    return antworten(res, 404, { fehler: "unbekannt" });
  }

  return async function handler(req, res) {
    try {
      await verarbeiten(req, res);
    } catch (e) {
      if (!e.status) console.error(e);
      if (!res.headersSent) antworten(res, e.status || 500, { fehler: e.status ? e.message : "server" });
    }
  };
}

