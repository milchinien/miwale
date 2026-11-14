// Verwaltung von miwale.com (/admin/): eigene Admin-Konten mit Benutzername,
// Passwort und zweitem Faktor (TOTP, RFC 6238 -- Google Authenticator, Aegis,
// 1Password ...). Dazu die Einstellungen der Seite und der Postausgang.
//
// Ablauf der Anmeldung:
//   1. POST /api/verwaltung/anmelden {name, passwort} -> ein Zwischen-Token
//      (5 min, hoechstens 5 Codes). Beim ersten Mal kommt der 2FA-Schluessel mit,
//      der Admin traegt ihn in seine App ein.
//   2. POST /api/verwaltung/anmelden/code {zwischen, code} -> Sitzung im Cookie
//      __Host-verwaltung (HttpOnly, Secure, SameSite=Strict, 12 h).
//
// Das erste Konto legt an, wer das alte Verwaltungs-Passwort kennt
// (BEWERTUNGEN_ADMIN_PASSWORT). Sobald es ein Admin-Konto gibt, gilt das alte
// Passwort nirgends mehr (gemeinsam.mjs, adminSchutz).
//
// Gespeichert in verwaltung.json (Konten mit scrypt-Hash, Sitzungen nur als
// SHA-256 des Tokens) und einstellungen.json im Datenordner.

import { createHash, createHmac, randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import {
  sicherSchreiben, lesen, besucherAdresse, tempoGrenze, cookiesLesen, handlerAus, anschluss, gleich, textPruefen
} from "./gemeinsam.mjs";
import { emailOk } from "./post.mjs";

const scrypt = promisify(scryptCb);
const STUNDE = 60 * 60 * 1000;

export const VERWALTUNG_GRENZEN = {
  sitzungMs: 12 * STUNDE,
  zwischenMs: 5 * 60 * 1000,
  codeVersuche: 5,
  anmeldenProFenster: 10,
  passwortMin: 10,
  admins: 20
};

export const ADMIN_NAME_RE = /^[a-z0-9_.-]{3,32}$/;

// ---- Passwoerter ----------------------------------------------------------------
export async function passwortHash(passwort) {
  const salz = randomBytes(16);
  const h = await scrypt(String(passwort).normalize("NFC"), salz, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return "scrypt$" + salz.toString("base64") + "$" + h.toString("base64");
}

export async function passwortPruefen(passwort, gespeichert) {
  const [art, salz, hash] = String(gespeichert || "").split("$");
  if (art !== "scrypt" || !salz || !hash) return false;
  const soll = Buffer.from(hash, "base64");
  const ist = await scrypt(String(passwort).normalize("NFC"), Buffer.from(salz, "base64"), soll.length, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return soll.length === ist.length && timingSafeEqual(soll, ist);
}

// Gegen Raten der Kontonamen: auch ohne Konto rechnet scrypt einmal.
let attrappe = null;
export async function attrappePruefen(passwort) {
  attrappe = attrappe || await passwortHash("attrappe-" + randomBytes(8).toString("hex"));
  await passwortPruefen(passwort, attrappe);
  return false;
}

// ---- TOTP ----------------------------------------------------------------------
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function base32(buf) {
  let bits = 0, wert = 0, aus = "";
  for (const b of buf) {
    wert = (wert << 8) | b; bits += 8;
    while (bits >= 5) { aus += B32[(wert >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) aus += B32[(wert << (5 - bits)) & 31];
  return aus;
}
export function base32Lesen(text) {
  let bits = 0, wert = 0;
  const aus = [];
  for (const z of String(text).toUpperCase().replace(/[^A-Z2-7]/g, "")) {
    wert = (wert << 5) | B32.indexOf(z); bits += 5;
    if (bits >= 8) { aus.push((wert >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(aus);
}
export function hotp(schluessel, zaehler) {
  const z = Buffer.alloc(8);
  z.writeBigUInt64BE(BigInt(zaehler));
  const h = createHmac("sha1", base32Lesen(schluessel)).update(z).digest();
  const o = h[h.length - 1] & 15;
  const n = (h.readUInt32BE(o) & 0x7fffffff) % 1000000;
  return String(n).padStart(6, "0");
}
// Liefert den Zeitschritt des passenden Codes oder -1. Ein Schritt Toleranz in
// jede Richtung (Uhr am Handy geht etwas falsch).
export function totpPruefen(schluessel, code, jetztMs, zuletzt = -1) {
  if (!/^\d{6}$/.test(String(code))) return -1;
  const schritt = Math.floor(jetztMs / 30000);
  for (const d of [0, -1, 1]) {
    const s = schritt + d;
    if (s <= zuletzt) continue; // Jeder Code gilt nur einmal.
    if (gleich(hotp(schluessel, s), String(code))) return s;
  }
  return -1;
}

// ---- Einstellungen der Seite ------------------------------------------------------
export const GENRES = ["Action", "Abenteuer", "Arcade", "Casual", "Horror", "Idle", "Karten", "Lernspiel", "Plattformer", "Puzzle", "Rennspiel", "Rollenspiel", "Roguelike", "Shooter", "Simulation", "Sport", "Strategie", "Survival", "Tower Defense", "Experimentell"];

export function standardEinstellungen() {
  return {
    banner: { an: false, de: "", en: "", link: "" },
    studio: { offen: true, maxBuildMb: 300, maxProjekte: 5, hinweisDe: "", hinweisEn: "" },
    genres: GENRES.slice(),
    meldungAn: [],
    spiele: { versteckt: [], hervorgehoben: [] }
  };
}

const ID_RE = /^[a-z0-9-]{1,60}$/;
// Prueft und uebernimmt Einstellungen; unbekannte Felder fallen weg.
export function einstellungenPruefen(k, alt) {
  const e = JSON.parse(JSON.stringify(alt));
  const f = (grund) => { const x = new Error(grund); x.status = 400; throw x; };
  if (k.banner !== undefined) {
    const b = k.banner || {};
    const de = textPruefen(b.de, 300), en = textPruefen(b.en, 300), link = textPruefen(b.link, 300);
    if (de === null || en === null || link === null) f("banner");
    if (link && !/^(\/[^\s]*|https:\/\/[^\s]+)$/.test(link)) f("banner-link");
    e.banner = { an: b.an === true, de, en, link };
  }
  if (k.studio !== undefined) {
    const s = k.studio || {};
    const mb = Number(s.maxBuildMb), pr = Number(s.maxProjekte);
    if (!Number.isInteger(mb) || mb < 10 || mb > 1024) f("max-build");
    if (!Number.isInteger(pr) || pr < 1 || pr > 100) f("max-projekte");
    const hd = textPruefen(s.hinweisDe, 500), he = textPruefen(s.hinweisEn, 500);
    if (hd === null || he === null) f("hinweis");
    e.studio = { offen: s.offen === true, maxBuildMb: mb, maxProjekte: pr, hinweisDe: hd, hinweisEn: he };
  }
  if (k.genres !== undefined) {
    if (!Array.isArray(k.genres) || k.genres.length < 1 || k.genres.length > 60) f("genres");
    const g = k.genres.map((x) => textPruefen(x, 40));
    if (g.some((x) => !x)) f("genres");
    e.genres = [...new Set(g)];
  }
  if (k.meldungAn !== undefined) {
    if (!Array.isArray(k.meldungAn) || k.meldungAn.length > 10 || !k.meldungAn.every(emailOk)) f("meldung-an");
    e.meldungAn = [...new Set(k.meldungAn)];
  }
  if (k.spiele !== undefined) {
    const s = k.spiele || {};
    const liste = (x) => (Array.isArray(x) && x.length <= 200 && x.every((i) => typeof i === "string" && ID_RE.test(i)) ? [...new Set(x)] : f("spiele"));
    e.spiele = { versteckt: liste(s.versteckt || []), hervorgehoben: liste(s.hervorgehoben || []).slice(0, 12) };
  }
  return e;
}

// ---- Anwendung ------------------------------------------------------------------
// optionen: ordner, passwort (altes Verwaltungs-Passwort, nur fuer die
// Ersteinrichtung), herkunft, sicher (Cookies mit Secure/__Host-), post
// (server/post.mjs), jetzt (Tests).
export function verwaltungBauen(optionen) {
  const datei = join(optionen.ordner, "verwaltung.json");
  const einstellungenDatei = join(optionen.ordner, "einstellungen.json");
  const jetzt = optionen.jetzt || (() => Date.now());
  const sicher = optionen.sicher !== false;
  const begrenzt = tempoGrenze(jetzt);
  const daten = existsSync(datei) ? JSON.parse(readFileSync(datei, "utf8")) : { admins: [], sitzungen: [] };
  let einstellungen = standardEinstellungen();
  try { if (existsSync(einstellungenDatei)) einstellungen = { ...einstellungen, ...JSON.parse(readFileSync(einstellungenDatei, "utf8")) }; } catch { /* Standard */ }
  const speichern = () => sicherSchreiben(datei, daten);
  const zwischen = new Map();
  const beobachter = [];

  const COOKIE = (sicher ? "__Host-" : "") + "verwaltung";
  const cookie = (wert, ms) => COOKIE + "=" + wert + "; Path=/; HttpOnly; SameSite=Strict" + (sicher ? "; Secure" : "") + "; Max-Age=" + Math.max(0, Math.floor(ms / 1000));
  const hash = (x) => createHash("sha256").update(x).digest("hex");
  const zufall = () => randomBytes(32).toString("base64url");

  function wer(req) {
    const token = cookiesLesen(req)[COOKIE];
    if (!token || token.length > 100) return null;
    const h = hash(token);
    const t = jetzt();
    const s = daten.sitzungen.find((x) => x.hash === h);
    if (!s || s.ablauf <= t) return null;
    const a = daten.admins.find((x) => x.id === s.admin);
    return a ? { id: a.id, name: a.name, rolle: a.rolle } : null;
  }

  const oeffentlich = (a) => ({ id: a.id, name: a.name, rolle: a.rolle, email: a.email || "", erstellt: a.erstellt, zuletzt: a.zuletzt || null, zweiterFaktor: !!a.totpAktiv });
  const kopf = (liste) => ({ "Set-Cookie": liste });
  const nein = (status, fehler) => [status, { fehler }];

  async function verarbeiten(req) {
    const url = new URL(req.url, "http://lokal");
    const teile = url.pathname.replace(/^\/api\/verwaltung\/?/, "").split("/").filter(Boolean);
    const ip = besucherAdresse(req);
    const t = jetzt();

    if (teile[0] === "status" && req.method === "GET") {
      return [200, { eingerichtet: daten.admins.length > 0, ich: wer(req) }];
    }

    // Erstes Konto: nur mit dem alten Passwort und nur, solange es keines gibt.
    if (teile[0] === "einrichten" && req.method === "POST") {
      if (daten.admins.length) return nein(409, "schon-eingerichtet");
      if (begrenzt("einrichten|" + anschluss(ip), VERWALTUNG_GRENZEN.anmeldenProFenster)) return nein(429, "zu-viele-versuche");
      const k = await lesen(req);
      if (!optionen.passwort) return nein(503, "verwaltung-aus");
      if (!gleich(String(k.altesPasswort || ""), optionen.passwort)) return nein(401, "passwort");
      const fehler = await kontoFehler(k.name, k.passwort);
      if (fehler) return nein(400, fehler);
      if (k.email && !emailOk(k.email)) return nein(400, "email");
      daten.admins.push(await neuesKonto(k.name, k.passwort, "inhaber", k.email));
      speichern();
      return [201, { ok: true }];
    }

    if (teile[0] === "anmelden" && !teile[1] && req.method === "POST") {
      if (begrenzt("anmelden|" + anschluss(ip), VERWALTUNG_GRENZEN.anmeldenProFenster)) return nein(429, "zu-viele-versuche");
      const k = await lesen(req);
      const name = String(k.name || "").trim().toLowerCase();
      const a = daten.admins.find((x) => x.name === name);
      const ok = a ? await passwortPruefen(String(k.passwort || ""), a.hash) : await attrappePruefen(String(k.passwort || ""));
      if (!ok) return nein(401, "falsch");
      for (const [z, v] of zwischen) if (v.ablauf < t) zwischen.delete(z);
      const token = zufall();
      // Ohne eingerichteten zweiten Faktor: jetzt einen neuen Schluessel zeigen.
      if (!a.totpAktiv) { a.totpNeu = base32(randomBytes(20)); speichern(); }
      zwischen.set(hash(token), { admin: a.id, ablauf: t + VERWALTUNG_GRENZEN.zwischenMs, versuche: 0 });
      const antwort = { zwischen: token, schritt: a.totpAktiv ? "code" : "einrichten" };
      if (!a.totpAktiv) {
        antwort.schluessel = a.totpNeu;
        antwort.otpauth = "otpauth://totp/" + encodeURIComponent("miwale:" + a.name) + "?secret=" + a.totpNeu + "&issuer=miwale&algorithm=SHA1&digits=6&period=30";
      }
      return [200, antwort];
    }

    if (teile[0] === "anmelden" && teile[1] === "code" && req.method === "POST") {
      const k = await lesen(req);
      const z = zwischen.get(hash(String(k.zwischen || "")));
      if (!z || z.ablauf < t) return nein(401, "abgelaufen");
      if (++z.versuche > VERWALTUNG_GRENZEN.codeVersuche) { zwischen.delete(hash(String(k.zwischen))); return nein(429, "zu-viele-versuche"); }
      const a = daten.admins.find((x) => x.id === z.admin);
      if (!a) return nein(401, "abgelaufen");
      const geheim = a.totpAktiv ? a.totp : a.totpNeu;
      const schritt = totpPruefen(geheim, String(k.code || "").replace(/\s/g, ""), t, a.totpZuletzt ?? -1);
      if (schritt < 0) return nein(401, "code");
      if (!a.totpAktiv) { a.totp = a.totpNeu; a.totpAktiv = true; delete a.totpNeu; }
      a.totpZuletzt = schritt;
      a.zuletzt = new Date(t).toISOString();
      zwischen.delete(hash(String(k.zwischen)));
      const token = zufall();
      daten.sitzungen = daten.sitzungen.filter((s) => s.ablauf > t);
      daten.sitzungen.push({ hash: hash(token), admin: a.id, erstellt: t, ablauf: t + VERWALTUNG_GRENZEN.sitzungMs });
      speichern();
      return [200, { ich: { id: a.id, name: a.name, rolle: a.rolle } }, kopf([cookie(token, VERWALTUNG_GRENZEN.sitzungMs)])];
    }

    if (teile[0] === "abmelden" && req.method === "POST") {
      const token = cookiesLesen(req)[COOKIE];
      if (token) { daten.sitzungen = daten.sitzungen.filter((s) => s.hash !== hash(token)); speichern(); }
      return [200, { ok: true }, kopf([cookie("", 0)])];
    }

    // Einstellungen lesen darf jeder (die Spieleseite braucht Banner und Genres) --
    // nur die oeffentlichen Teile.
    if (teile[0] === "oeffentlich" && req.method === "GET") return [200, oeffentlicheEinstellungen()];

    // ---- Ab hier nur angemeldet ----
    const ich = wer(req);
    if (!ich) return nein(401, "anmelden");
    const ichKonto = daten.admins.find((x) => x.id === ich.id);

    if (teile[0] === "einstellungen" && !teile[1]) {
      if (req.method === "GET") return [200, { einstellungen, smtp: !!(optionen.post && optionen.post.aktiv()) }];
      if (req.method === "PUT") {
        const k = await lesen(req, 64 * 1024);
        einstellungen = einstellungenPruefen(k, einstellungen);
        sicherSchreiben(einstellungenDatei, einstellungen);
        for (const f of beobachter) f(einstellungen);
        return [200, { einstellungen }];
      }
    }

    if (teile[0] === "postausgang" && req.method === "GET") {
      return [200, { ausgang: optionen.post ? optionen.post.ausgang() : [], smtp: !!(optionen.post && optionen.post.aktiv()) }];
    }
    if (teile[0] === "testmail" && req.method === "POST") {
      if (!optionen.post) return nein(503, "keine-post");
      const an = einstellungen.meldungAn.length ? einstellungen.meldungAn : (ichKonto.email ? [ichKonto.email] : []);
      const e = await optionen.post.schicken({ an, art: "test", betreff: "miwale: Test-Mail aus der Verwaltung", text: "Hallo " + ich.name + ",\n\ndiese Test-Mail kommt aus der Verwaltung von miwale.com. Der Versand funktioniert.\n" });
      return [200, { eintrag: e }];
    }

    // Eigenes Passwort aendern.
    if (teile[0] === "passwort" && req.method === "POST") {
      const k = await lesen(req);
      if (!(await passwortPruefen(String(k.alt || ""), ichKonto.hash))) return nein(401, "falsch");
      if (typeof k.neu !== "string" || k.neu.length < VERWALTUNG_GRENZEN.passwortMin || k.neu.length > 200) return nein(400, "passwort-kurz");
      ichKonto.hash = await passwortHash(k.neu);
      // Alle anderen Sitzungen dieses Admins enden.
      const token = cookiesLesen(req)[COOKIE];
      daten.sitzungen = daten.sitzungen.filter((s) => s.admin !== ichKonto.id || s.hash === hash(token));
      speichern();
      return [200, { ok: true }];
    }
    if (teile[0] === "email" && req.method === "PUT") {
      const k = await lesen(req);
      if (k.email !== "" && !emailOk(k.email)) return nein(400, "email");
      ichKonto.email = k.email;
      speichern();
      return [200, { ok: true }];
    }

    // ---- Admins verwalten: nur der Inhaber ----
    if (teile[0] === "admins") {
      if (req.method === "GET" && !teile[1]) return [200, { admins: daten.admins.map(oeffentlich), ich }];
      if (ich.rolle !== "inhaber") return nein(403, "nur-inhaber");
      if (req.method === "POST" && !teile[1]) {
        if (daten.admins.length >= VERWALTUNG_GRENZEN.admins) return nein(409, "zu-viele");
        const k = await lesen(req);
        const fehler = await kontoFehler(k.name, k.passwort);
        if (fehler) return nein(400, fehler);
        if (k.email && !emailOk(k.email)) return nein(400, "email");
        daten.admins.push(await neuesKonto(k.name, k.passwort, k.rolle === "inhaber" ? "inhaber" : "admin", k.email));
        speichern();
        return [201, { admins: daten.admins.map(oeffentlich) }];
      }
      const ziel = daten.admins.find((x) => x.id === teile[1]);
      if (!ziel) return nein(404, "nicht-gefunden");
      if (req.method === "DELETE" && !teile[2]) {
        if (ziel.id === ich.id) return nein(409, "nicht-selbst");
        daten.admins.splice(daten.admins.indexOf(ziel), 1);
        daten.sitzungen = daten.sitzungen.filter((s) => s.admin !== ziel.id);
        speichern();
        return [200, { admins: daten.admins.map(oeffentlich) }];
      }
      if (req.method === "POST" && teile[2] === "zuruecksetzen") {
        const k = await lesen(req);
        if (k.passwort !== undefined) {
          if (typeof k.passwort !== "string" || k.passwort.length < VERWALTUNG_GRENZEN.passwortMin) return nein(400, "passwort-kurz");
          ziel.hash = await passwortHash(k.passwort);
        }
        // Zweiter Faktor neu einrichten (Handy verloren): beim naechsten Anmelden.
        if (k.zweiterFaktor === true) { ziel.totpAktiv = false; delete ziel.totp; ziel.totpZuletzt = -1; }
        daten.sitzungen = daten.sitzungen.filter((s) => s.admin !== ziel.id);
        speichern();
        return [200, { admins: daten.admins.map(oeffentlich) }];
      }
    }
    return nein(404, "unbekannt");
  }

  async function kontoFehler(name, passwort) {
    if (typeof name !== "string" || !ADMIN_NAME_RE.test(name.trim().toLowerCase())) return "name-format";
    if (daten.admins.some((a) => a.name === name.trim().toLowerCase())) return "name-vergeben";
    if (typeof passwort !== "string" || passwort.length < VERWALTUNG_GRENZEN.passwortMin || passwort.length > 200) return "passwort-kurz";
    return null;
  }
  async function neuesKonto(name, passwort, rolle, email) {
    return { id: randomUUID(), name: name.trim().toLowerCase(), hash: await passwortHash(passwort), rolle, email: emailOk(email) ? email : "", totpAktiv: false, erstellt: new Date(jetzt()).toISOString() };
  }

  function oeffentlicheEinstellungen() {
    return {
      banner: einstellungen.banner,
      studio: { offen: einstellungen.studio.offen, maxBuildMb: einstellungen.studio.maxBuildMb, maxProjekte: einstellungen.studio.maxProjekte, hinweisDe: einstellungen.studio.hinweisDe, hinweisEn: einstellungen.studio.hinweisEn },
      genres: einstellungen.genres,
      spiele: einstellungen.spiele
    };
  }

  const handler = handlerAus(verarbeiten, { herkunft: optionen.herkunft });
  handler.wer = wer;
  handler.eingerichtet = () => daten.admins.length > 0;
  handler.einstellungen = () => einstellungen;
  handler.oeffentlicheEinstellungen = oeffentlicheEinstellungen;
  handler.beiAenderung = (f) => beobachter.push(f);
  // Ein Community-Spiel hat eine neue Adresse: Sichtbarkeit und Hervorhebung bleiben.
  handler.slugGeaendert = (alt, neu) => {
    const s = einstellungen.spiele;
    const tauschen = (liste) => liste.map((x) => (x === alt ? neu : x));
    if (!s.versteckt.includes(alt) && !s.hervorgehoben.includes(alt)) return;
    einstellungen = { ...einstellungen, spiele: { versteckt: tauschen(s.versteckt), hervorgehoben: tauschen(s.hervorgehoben) } };
    sicherSchreiben(einstellungenDatei, einstellungen);
  };
  // Wohin gehen Benachrichtigungen? Die Liste aus den Einstellungen, sonst
  // MELDUNG_AN, sonst die E-Mail-Adressen der Admins.
  handler.empfaenger = (zusatz = optionen.meldungAn || []) => {
    const liste = einstellungen.meldungAn.length ? einstellungen.meldungAn : zusatz.length ? zusatz : daten.admins.map((a) => a.email).filter(Boolean);
    return [...new Set(liste)];
  };
  return handler;
}
