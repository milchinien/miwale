// Konten fuer miwale.com: Anmelden mit Discord oder Google. Spielen geht immer
// ohne Konto; eines braucht nur, wer Bewertungen schreibt oder Game Requests
// einreicht.
//
// Was hier bewusst NICHT gespeichert wird: Passwoerter, E-Mail-Adressen,
// echte Namen, die Kennung bei Discord oder Google. Von Discord wird nur die
// Berechtigung "identify" erfragt, von Google nur "openid". Die Kennung, die
// der Anbieter liefert, wird sofort mit einem Geheimnis des Servers gehasht
// (HMAC); gespeichert wird nur dieser Hash. Er reicht, um denselben Menschen
// beim naechsten Anmelden wiederzuerkennen, verraet aber nicht, wer er ist.
//
// Ablauf der Anmeldung (OAuth 2.0 mit PKCE, alles auf dem Server):
//   1. /api/konto/anmelden/discord    -> zufaelliges state und code_verifier,
//      state zusaetzlich im Cookie; weiter zum Anbieter.
//   2. /api/konto/rueckruf/discord    -> state aus Adresse und Cookie muessen
//      gleich sein und duerfen nur einmal gelten. Dann tauscht der Server den
//      Code (mit Client-Secret und code_verifier) gegen ein Token und fragt
//      damit die Kennung ab. Das Token wird danach verworfen.
//   3. Bekanntes Konto: neue Sitzung. Neues: einen Namen waehlen lassen
//      (/api/konto/registrieren), erst dann entsteht das Konto.
//
// Sitzungen: 32 zufaellige Bytes im Cookie __Host-sitzung (HttpOnly, Secure,
// SameSite=Lax). Auf dem Server liegt nur der SHA-256 davon; eine gestohlene
// Datei meldet also niemanden an. 30 Tage ohne Besuch, dann ist sie abgelaufen.
//
// Gespeichert wird in konten.json und sitzungen.json im Datenordner, das
// Geheimnis fuer die Hashes in konten-geheimnis daneben.

import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gesperrteWoerter } from "./bewertungen.mjs";
import {
  gleich, sicherSchreiben, lesen, sperrlisteLesen, besucherAdresse,
  tempoGrenze, cookiesLesen, handlerAus
} from "./gemeinsam.mjs";

const TAG = 24 * 60 * 60 * 1000;

export const GRENZEN = {
  sitzungMs: 30 * TAG,
  // So oft wird "zuletzt benutzt" hoechstens geschrieben.
  auffrischenMs: TAG,
  sitzungenJeKonto: 20,
  // Zeit zwischen "Anmelden" und der Rueckkehr vom Anbieter.
  anmeldungMs: 10 * 60 * 1000,
  // Zeit, um nach der ersten Anmeldung einen Namen zu waehlen.
  registrierungMs: 30 * 60 * 1000,
  // Offene Anmeldungen im Speicher. Sind es mehr, faellt die aelteste raus --
  // abweisen hiesse, dass ein Angreifer mit vielen Adressen alle aussperrt.
  offenMax: 5000,
  // Je Adresse im Zeitfenster (10 min).
  anmeldenProFenster: 30,
  registrierenProFenster: 10,
  namenProFenster: 5,
  loginVersuche: 10
};

// Namen: nur Buchstaben, Ziffern, _ und -. Keine Leerzeichen, keine Sonder-
// oder Unicode-Zeichen -- so gibt es keine Namen, die wie ein anderer aussehen
// (kyrillisches "а" statt "a"), und nichts, was im HTML Unfug treiben koennte.
export const NAME_RE = /^[A-Za-z0-9_-]{3,20}$/;

// Namen, mit denen sich jemand als die Seite ausgeben koennte.
const RESERVIERT = [
  "admin", "administrator", "mod", "moderator", "support", "system", "root", "staff", "team",
  "official", "offiziell", "entwickler", "developer", "dev", "discord", "google", "anonymous",
  "anonym", "gast", "guest", "player", "spieler", "null", "undefined", "konto", "account", "michi", "michel"
];
const RESERVIERT_TEIL = ["miwale", "admin", "moderator"];

const KENNUNG_RE = /^[A-Za-z0-9_-]{1,255}$/;
// Rueckkehr nach dem Anmelden: nur ein Pfad dieser Seite. Kein "//" und kein
// "/." -- sonst waere aus "/.//evil.example" eine fremde Adresse zu basteln.
const ZIEL_RE = /^\/(?![\/\\])[A-Za-z0-9\-._~\/]{0,200}$/;
const zielOk = (z) => ZIEL_RE.test(z) && !z.includes("//") && !z.includes("/.");

// Tempolimit je Anschluss: IPv6-Adressen gibt es je Anschluss zu Milliarden
// (ein /64-Netz), also zaehlt das Netz, nicht die einzelne Adresse.
const anschluss = (ip) => (ip.includes(":") ? ip.split(":").slice(0, 4).join(":") + "::/64" : ip);

export const ANBIETER = {
  discord: {
    autorisieren: "https://discord.com/oauth2/authorize",
    token: "https://discord.com/api/oauth2/token",
    ich: "https://discord.com/api/users/@me",
    scope: "identify",
    kennung: (d) => d.id,
    extra: {}
  },
  google: {
    autorisieren: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
    ich: "https://openidconnect.googleapis.com/v1/userinfo",
    scope: "openid",
    kennung: (d) => d.sub,
    extra: { prompt: "select_account" }
  }
};

// Liefert null, wenn der Name passt, sonst den Grund.
export function nameFehler(name, sperrliste) {
  if (typeof name !== "string" || !NAME_RE.test(name)) return "name-format";
  const klein = name.toLowerCase();
  const ohneZeichen = klein.replace(/[_-]/g, "");
  if (RESERVIERT.includes(klein) || RESERVIERT.includes(ohneZeichen)) return "name-vergeben";
  if (RESERVIERT_TEIL.some((w) => ohneZeichen.includes(w))) return "name-vergeben";
  // Ganze Woerter wie ueberall, dazu laengere Sperrwoerter auch mitten im
  // Namen: "xXfuckXx" ist ein Wort, der Wortfilter saehe es sonst nicht.
  if (gesperrteWoerter(name.replace(/[_-]/g, " "), sperrliste).length) return "name-gesperrt";
  if (sperrliste.some((w) => w.length >= 4 && ohneZeichen.includes(w.replace(/[^a-z0-9]/g, "")))) return "name-gesperrt";
  return null;
}

const hash = (wert) => createHash("sha256").update(wert).digest("hex");
const zufall = () => randomBytes(32).toString("base64url");
// PKCE: der Anbieter bekommt nur den Hash, den Wert erst beim Tausch des Codes.
const pkce = (verifier) => createHash("sha256").update(verifier).digest("base64url");

function geheimnisLesen(ordner) {
  const datei = join(ordner, "konten-geheimnis");
  if (existsSync(datei)) {
    const g = readFileSync(datei, "utf8").trim();
    if (g.length >= 32) return g;
  }
  const neu = randomBytes(32).toString("hex");
  writeFileSync(datei, neu + "\n", { mode: 0o600 });
  return neu;
}

// ---- Speicher -------------------------------------------------------------------
export function kontenSpeicher(ordner) {
  mkdirSync(ordner, { recursive: true });
  const kontenDatei = join(ordner, "konten.json");
  const sitzungenDatei = join(ordner, "sitzungen.json");
  const k = existsSync(kontenDatei) ? JSON.parse(readFileSync(kontenDatei, "utf8")) : { konten: [], gesperrt: [] };
  k.gesperrt = k.gesperrt || [];
  const s = existsSync(sitzungenDatei) ? JSON.parse(readFileSync(sitzungenDatei, "utf8")) : { sitzungen: [] };
  return {
    get konten() { return k.konten; },
    // Schluessel geloeschter, gesperrter Konten: wer gesperrt war, soll sich
    // nicht einfach loeschen und neu anmelden koennen.
    get gesperrt() { return k.gesperrt; },
    get sitzungen() { return s.sitzungen; },
    set sitzungen(neu) { s.sitzungen = neu; },
    kontenSpeichern() { sicherSchreiben(kontenDatei, k); },
    sitzungenSpeichern() { sicherSchreiben(sitzungenDatei, s); }
  };
}

// ---- Anwendung ------------------------------------------------------------------
// optionen:
//   ordner, passwort (Verwaltung)
//   adresse     "https://miwale.com" -- Basis der Rueckruf-Adressen. Ohne
//               (lokal) aus dem Host der Anfrage.
//   herkunft    erlaubte Origins fuer aendernde Anfragen (gemeinsam.mjs)
//   sicher      Cookies mit Secure und __Host- (Standard). Nur lokal aus.
//   anbieter    { discord: { id, secret }, google: { id, secret } }; wer
//               fehlt, wird nicht angeboten.
//   beimLoeschen(kontoId)  entfernt alles, was dem Konto gehoert
//   datenVon(kontoId)      alles, was dem Konto gehoert, fuer den Export
//   zusatzAnbieter  weitere Anbieter wie in ANBIETER; nur der lokale
//               Test-Anbieter (tools/dienste-dev.mjs), nie in Produktion.
//   holen, jetzt, geheimnis -- nur fuer Tests.
export function kontenBauen(optionen) {
  const speicher = kontenSpeicher(optionen.ordner);
  const geheimnis = optionen.geheimnis || geheimnisLesen(optionen.ordner);
  const passwort = optionen.passwort || "";
  const jetzt = optionen.jetzt || (() => Date.now());
  const holen = optionen.holen || fetch;
  const sicher = optionen.sicher !== false;
  const begrenzt = tempoGrenze(jetzt);
  const ALLE = { ...ANBIETER, ...(optionen.zusatzAnbieter || {}) };
  const zugaenge = Object.fromEntries(Object.entries(optionen.anbieter || {}).filter(([n, z]) => Object.hasOwn(ALLE, n) && z && z.id && z.secret));
  const bekannt = (name) => !!name && Object.hasOwn(zugaenge, name);

  const COOKIE = {
    sitzung: (sicher ? "__Host-" : "") + "sitzung",
    anmeldung: (sicher ? "__Host-" : "") + "anmeldung",
    registrierung: (sicher ? "__Host-" : "") + "registrierung"
  };
  function cookie(name, wert, maxAlterMs) {
    return name + "=" + wert + "; Path=/; HttpOnly; SameSite=Lax" + (sicher ? "; Secure" : "") +
      "; Max-Age=" + Math.max(0, Math.floor(maxAlterMs / 1000));
  }
  const cookieWeg = (name) => cookie(name, "", 0);

  // Offene Anmeldungen (state -> ...) und Registrierungen (Hash des Tokens ->
  // ...). Nur im Speicher: startet der Dienst neu, meldet man sich neu an.
  const anmeldungen = new Map();
  const registrierungen = new Map();
  function aufraeumen(karte) {
    const t = jetzt();
    for (const [schl, v] of karte) if (v.ablauf < t) karte.delete(schl);
    // Map behaelt die Reihenfolge: vorne stehen die aeltesten.
    while (karte.size >= GRENZEN.offenMax) karte.delete(karte.keys().next().value);
  }

  const schluesselVon = (anbieter, kennung) => createHmac("sha256", geheimnis).update(anbieter + ":" + kennung).digest("hex");
  const kontoVonId = (id) => speicher.konten.find((k) => k.id === id) || null;
  const nameFrei = (name, ausser) => !speicher.konten.some((k) => k !== ausser && k.name.toLowerCase() === name.toLowerCase());

  function rueckrufAdresse(req, anbieter) {
    const basis = optionen.adresse || "http://" + req.headers.host;
    return basis + "/api/konto/rueckruf/" + anbieter;
  }

  // ---- Sitzungen ----
  let letztesAufraeumen = 0;
  function sitzungenAufraeumen() {
    const t = jetzt();
    if (t - letztesAufraeumen < 60 * 60 * 1000) return;
    letztesAufraeumen = t;
    const vorher = speicher.sitzungen.length;
    speicher.sitzungen = speicher.sitzungen.filter((s) => s.ablauf > t);
    if (speicher.sitzungen.length !== vorher) speicher.sitzungenSpeichern();
  }

  function sitzungAnlegen(konto) {
    const token = zufall();
    const t = jetzt();
    speicher.sitzungen.push({ hash: hash(token), konto: konto.id, erstellt: t, zuletzt: t, ablauf: t + GRENZEN.sitzungMs });
    // Aelteste Sitzungen des Kontos fallen weg, wenn es zu viele werden.
    const eigene = speicher.sitzungen.filter((s) => s.konto === konto.id).sort((a, b) => a.zuletzt - b.zuletzt);
    const zuViele = new Set(eigene.slice(0, Math.max(0, eigene.length - GRENZEN.sitzungenJeKonto)));
    if (zuViele.size) speicher.sitzungen = speicher.sitzungen.filter((s) => !zuViele.has(s));
    konto.zuletzt = new Date(t).toISOString();
    speicher.sitzungenSpeichern();
    speicher.kontenSpeichern();
    return token;
  }

  function sitzungVon(req) {
    const token = cookiesLesen(req)[COOKIE.sitzung];
    if (!token || token.length > 100) return null;
    const h = hash(token);
    const s = speicher.sitzungen.find((x) => x.hash === h);
    if (!s || s.ablauf <= jetzt()) return null;
    return s;
  }

  // Wer ist angemeldet? { id, name, gesperrt } oder null. Fuer die anderen Dienste.
  function wer(req) {
    sitzungenAufraeumen();
    const s = sitzungVon(req);
    const konto = s && kontoVonId(s.konto);
    if (!konto) return null;
    const t = jetzt();
    if (t - s.zuletzt > GRENZEN.auffrischenMs) {
      s.zuletzt = t;
      s.ablauf = t + GRENZEN.sitzungMs;
      konto.zuletzt = new Date(t).toISOString();
      speicher.sitzungenSpeichern();
      speicher.kontenSpeichern();
    }
    return { id: konto.id, name: konto.name, gesperrt: !!konto.gesperrt };
  }

  function nameVon(id) {
    const k = kontoVonId(id);
    return k ? k.name : null;
  }

  function registrierungVon(req) {
    const token = cookiesLesen(req)[COOKIE.registrierung];
    if (!token || token.length > 100) return null;
    const r = registrierungen.get(hash(token));
    return r && r.ablauf > jetzt() ? { ...r, hash: hash(token) } : null;
  }

  // Was die Seite ueber den Besucher wissen darf.
  function ichFuer(k, r) {
    return {
      konto: k ? { name: k.name, anbieter: k.anbieter, erstellt: k.erstellt, gesperrt: !!k.gesperrt } : null,
      registrierung: r ? { anbieter: r.anbieter } : null,
      anbieter: Object.keys(zugaenge)
    };
  }

  function ich(req) {
    const konto = wer(req);
    return ichFuer(konto && kontoVonId(konto.id), !konto && registrierungVon(req));
  }

  function kontoLoeschen(konto) {
    if (optionen.beimLoeschen) optionen.beimLoeschen(konto.id);
    if (konto.gesperrt && !speicher.gesperrt.includes(konto.schluessel)) speicher.gesperrt.push(konto.schluessel);
    speicher.konten.splice(speicher.konten.indexOf(konto), 1);
    speicher.sitzungen = speicher.sitzungen.filter((s) => s.konto !== konto.id);
    speicher.kontenSpeichern();
    speicher.sitzungenSpeichern();
  }

  const weiter = (ziel, cookies) => [302, null, { Location: ziel, "Set-Cookie": cookies || [], "Referrer-Policy": "no-referrer" }];
  const fehlerZiel = (grund) => "/account?fehler=" + grund;

  // ---- Anmeldung beim Anbieter ----
  function anmeldenStarten(req, url, anbieter, ip) {
    const zugang = zugaenge[anbieter];
    if (begrenzt("anmelden|" + anschluss(ip), GRENZEN.anmeldenProFenster)) return weiter(fehlerZiel("zu-schnell"));
    aufraeumen(anmeldungen);

    const zurueck = url.searchParams.get("zurueck") || "/";
    const state = zufall();
    const verifier = zufall();
    anmeldungen.set(state, { anbieter, verifier, zurueck: zielOk(zurueck) ? zurueck : "/", ablauf: jetzt() + GRENZEN.anmeldungMs });

    const a = ALLE[anbieter];
    const ziel = new URL(a.autorisieren, rueckrufAdresse(req, anbieter));
    for (const [n, w] of Object.entries({
      response_type: "code", client_id: zugang.id, redirect_uri: rueckrufAdresse(req, anbieter),
      scope: a.scope, state, code_challenge: pkce(verifier), code_challenge_method: "S256", ...a.extra
    })) ziel.searchParams.set(n, w);
    return weiter(ziel.href, [cookie(COOKIE.anmeldung, state, GRENZEN.anmeldungMs)]);
  }

  async function kennungHolen(req, anbieter, code, verifier) {
    const a = ALLE[anbieter];
    const zugang = zugaenge[anbieter];
    const tokenAntwort = await holen(a.token, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: new URLSearchParams({
        grant_type: "authorization_code", code, redirect_uri: rueckrufAdresse(req, anbieter),
        code_verifier: verifier, client_id: zugang.id, client_secret: zugang.secret
      }).toString(),
      signal: AbortSignal.timeout(10000)
    });
    if (!tokenAntwort.ok) throw new Error("token " + tokenAntwort.status);
    const token = await tokenAntwort.json();
    if (!token || typeof token.access_token !== "string") throw new Error("token");
    const ichAntwort = await holen(a.ich, {
      headers: { authorization: "Bearer " + token.access_token, accept: "application/json" },
      signal: AbortSignal.timeout(10000)
    });
    if (!ichAntwort.ok) throw new Error("ich " + ichAntwort.status);
    const kennung = a.kennung(await ichAntwort.json());
    if (typeof kennung !== "string" || !KENNUNG_RE.test(kennung)) throw new Error("kennung");
    return kennung;
  }

  async function rueckruf(req, url, anbieter) {
    const aus = cookieWeg(COOKIE.anmeldung);
    const state = url.searchParams.get("state") || "";
    const imCookie = cookiesLesen(req)[COOKIE.anmeldung] || "";
    // Der state muss aus DIESEM Browser kommen (Cookie) und darf nur einmal
    // gelten. Sonst koennte jemand einem anderen seinen eigenen Rueckruf
    // unterschieben und ihn in sein Konto einloggen.
    const offen = state && gleich(state, imCookie) ? anmeldungen.get(state) : null;
    if (state) anmeldungen.delete(state);
    if (!offen || offen.ablauf < jetzt() || offen.anbieter !== anbieter) return weiter(fehlerZiel("abgelaufen"), [aus]);
    if (url.searchParams.get("error")) return weiter(fehlerZiel("abgebrochen"), [aus]);
    const code = url.searchParams.get("code") || "";
    if (!code || code.length > 2000) return weiter(fehlerZiel("anbieter"), [aus]);

    let kennung;
    try { kennung = await kennungHolen(req, anbieter, code, offen.verifier); }
    catch (e) { console.error("Anmeldung bei " + anbieter + " fehlgeschlagen:", e.message); return weiter(fehlerZiel("anbieter"), [aus]); }

    const schluessel = schluesselVon(anbieter, kennung);
    if (speicher.gesperrt.includes(schluessel)) return weiter(fehlerZiel("gesperrt"), [aus]);
    const konto = speicher.konten.find((k) => k.schluessel === schluessel);
    if (konto) {
      const token = sitzungAnlegen(konto);
      return weiter(offen.zurueck, [aus, cookie(COOKIE.sitzung, token, GRENZEN.sitzungMs), cookieWeg(COOKIE.registrierung)]);
    }
    // Neu: erst einen Namen waehlen. Bis dahin gibt es kein Konto.
    aufraeumen(registrierungen);
    const token = zufall();
    registrierungen.set(hash(token), { anbieter, schluessel, zurueck: offen.zurueck, ablauf: jetzt() + GRENZEN.registrierungMs });
    return weiter("/account?neu=1&zurueck=" + encodeURIComponent(offen.zurueck), [aus, cookie(COOKIE.registrierung, token, GRENZEN.registrierungMs)]);
  }

  // ---- Anfragen ----
  async function verarbeiten(req) {
    const url = new URL(req.url, "http://lokal");
    const teile = url.pathname.replace(/^\/api\/konto\/?/, "").split("/").filter(Boolean);
    const ip = besucherAdresse(req);
    const kopf = (liste) => ({ "Set-Cookie": liste });

    // ---- Verwaltung ----
    if (teile[0] === "admin") {
      if (!passwort) return [503, { fehler: "verwaltung-aus" }];
      if (!gleich(String(req.headers.authorization || "").replace(/^Bearer\s+/i, ""), passwort)) {
        if (begrenzt("login|" + ip, GRENZEN.loginVersuche)) return [429, { fehler: "zu-viele-versuche" }];
        return [401, { fehler: "passwort" }];
      }
      if (teile[1] === "alle" && req.method === "GET" && !teile[2]) {
        const konten = speicher.konten
          .slice()
          .sort((a, b) => b.erstellt.localeCompare(a.erstellt))
          .map((k) => ({ id: k.id, name: k.name, anbieter: k.anbieter, erstellt: k.erstellt, zuletzt: k.zuletzt, gesperrt: k.gesperrt || null }));
        return [200, { konten }];
      }
      if (teile[1] === "konto" && teile[2] && !teile[3]) {
        const konto = kontoVonId(teile[2]);
        if (!konto) return [404, { fehler: "nicht-gefunden" }];
        if (req.method === "PUT") {
          const k = await lesen(req);
          if (typeof k.gesperrt !== "boolean") return [400, { fehler: "format" }];
          konto.gesperrt = k.gesperrt ? { zeit: new Date(jetzt()).toISOString() } : null;
          const alt = speicher.gesperrt.indexOf(konto.schluessel);
          if (!k.gesperrt && alt >= 0) speicher.gesperrt.splice(alt, 1);
          speicher.kontenSpeichern();
          return [200, { ok: true }];
        }
        if (req.method === "DELETE") { kontoLoeschen(konto); return [200, { ok: true }]; }
      }
      return [404, { fehler: "unbekannt" }];
    }

    if (teile[0] === "ich" && !teile[1] && req.method === "GET") {
      const antwort = ich(req);
      // Die Sitzung laeuft ab Besuch 30 Tage; der Cookie im Browser mit.
      const token = cookiesLesen(req)[COOKIE.sitzung];
      return [200, antwort, antwort.konto && token ? kopf([cookie(COOKIE.sitzung, token, GRENZEN.sitzungMs)]) : undefined];
    }

    if (teile[0] === "anmelden" && bekannt(teile[1]) && !teile[2] && req.method === "GET") {
      return anmeldenStarten(req, url, teile[1], ip);
    }
    if (teile[0] === "rueckruf" && bekannt(teile[1]) && !teile[2] && req.method === "GET") {
      return rueckruf(req, url, teile[1]);
    }

    if (teile[0] === "registrieren" && req.method === "POST") {
      const r = registrierungVon(req);
      if (teile[1] === "abbrechen" && !teile[2]) {
        if (r) registrierungen.delete(r.hash);
        return [200, ich(req), kopf([cookieWeg(COOKIE.registrierung)])];
      }
      if (teile[1]) return [404, { fehler: "unbekannt" }];
      if (begrenzt("registrieren|" + anschluss(ip), GRENZEN.registrierenProFenster)) return [429, { fehler: "zu-schnell" }];
      if (!r) return [401, { fehler: "abgelaufen" }];
      const k = await lesen(req);
      if (k.alter !== true) return [400, { fehler: "alter" }];
      const name = typeof k.name === "string" ? k.name.trim() : "";
      const problem = nameFehler(name, sperrlisteLesen(optionen.ordner));
      if (problem) return [problem === "name-format" ? 400 : 422, { fehler: problem }];
      if (!nameFrei(name)) return [409, { fehler: "name-vergeben" }];
      // Zwei Tabs gleichzeitig: das zweite Konto zum selben Menschen gibt es nicht.
      if (speicher.konten.some((x) => x.schluessel === r.schluessel)) return [409, { fehler: "schon-da" }];
      if (speicher.gesperrt.includes(r.schluessel)) return [403, { fehler: "konto-gesperrt" }];

      const zeit = new Date(jetzt()).toISOString();
      const konto = { id: randomUUID(), schluessel: r.schluessel, anbieter: r.anbieter, name, erstellt: zeit, zuletzt: zeit, gesperrt: null, alterBestaetigt: zeit };
      speicher.konten.push(konto);
      registrierungen.delete(r.hash);
      const token = sitzungAnlegen(konto);
      return [201, { ...ichFuer(konto, null), zurueck: r.zurueck },
        kopf([cookie(COOKIE.sitzung, token, GRENZEN.sitzungMs), cookieWeg(COOKIE.registrierung)])];
    }

    if (teile[0] === "abmelden" && !teile[1] && req.method === "POST") {
      const s = sitzungVon(req);
      if (s) {
        const k = await lesen(req);
        // "Ueberall abmelden" wirft auch die Sitzungen auf anderen Geraeten raus.
        speicher.sitzungen = speicher.sitzungen.filter((x) => (k.ueberall === true ? x.konto !== s.konto : x !== s));
        speicher.sitzungenSpeichern();
      }
      return [200, ichFuer(null, null), kopf([cookieWeg(COOKIE.sitzung)])];
    }

    // Alles ab hier nur angemeldet.
    const angemeldet = wer(req);
    const konto = angemeldet && kontoVonId(angemeldet.id);

    if (teile[0] === "name" && !teile[1] && req.method === "PUT") {
      if (!konto) return [401, { fehler: "anmelden" }];
      if (konto.gesperrt) return [403, { fehler: "konto-gesperrt" }];
      if (begrenzt("name|" + konto.id, GRENZEN.namenProFenster)) return [429, { fehler: "zu-schnell" }];
      const k = await lesen(req);
      const name = typeof k.name === "string" ? k.name.trim() : "";
      const problem = nameFehler(name, sperrlisteLesen(optionen.ordner));
      if (problem) return [problem === "name-format" ? 400 : 422, { fehler: problem }];
      if (!nameFrei(name, konto)) return [409, { fehler: "name-vergeben" }];
      konto.name = name;
      speicher.kontenSpeichern();
      return [200, ich(req)];
    }

    // Auskunft: alles, was zu diesem Konto gespeichert ist (DSGVO Art. 15/20).
    if (teile[0] === "daten" && !teile[1] && req.method === "GET") {
      if (!konto) return [401, { fehler: "anmelden" }];
      const daten = {
        erstellt: new Date(jetzt()).toISOString(),
        konto: { name: konto.name, anmeldungUeber: konto.anbieter, erstellt: konto.erstellt, zuletzt: konto.zuletzt, alterBestaetigt: konto.alterBestaetigt, gesperrt: konto.gesperrt },
        sitzungen: speicher.sitzungen.filter((s) => s.konto === konto.id).map((s) => ({ erstellt: new Date(s.erstellt).toISOString(), zuletzt: new Date(s.zuletzt).toISOString() })),
        ...(optionen.datenVon ? optionen.datenVon(konto.id) : {})
      };
      return [200, daten, { "Content-Disposition": 'attachment; filename="miwale-konto.json"' }];
    }

    // Konto loeschen, samt allem, was dazu gehoert. Sofort und endgueltig.
    if (!teile.length && req.method === "DELETE") {
      if (!konto) return [401, { fehler: "anmelden" }];
      const k = await lesen(req);
      if (k.bestaetigt !== true) return [400, { fehler: "bestaetigen" }];
      kontoLoeschen(konto);
      return [200, ichFuer(null, null), kopf([cookieWeg(COOKIE.sitzung)])];
    }

    return [404, { fehler: "unbekannt" }];
  }

  const handler = handlerAus(verarbeiten, { herkunft: optionen.herkunft });
  handler.wer = wer;
  handler.nameVon = nameVon;
  // Gibt es ueberhaupt eine Anmeldung? Ohne (Uebergang, solange Discord/Google
  // nicht eingerichtet sind) laufen Bewertungen und Game Requests wie vor den
  // Konten, je Geraet.
  handler.aktiv = () => Object.keys(zugaenge).length > 0;
  return handler;
}
