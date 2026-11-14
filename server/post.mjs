// E-Mails der Seite: Benachrichtigung bei neuen Einreichungen (an die Admins),
// Pruefergebnis an Entwickler, Bestaetigung und Passwort-Reset fuer Konten mit
// E-Mail-Adresse.
//
// Versand per SMTP ohne Abhaengigkeiten: Port 465 mit TLS von Anfang an, jeder
// andere Port (587, 25) mit STARTTLS. Ohne STARTTLS gibt es keine Anmeldung: das
// Passwort ginge sonst im Klartext ueber das Netz.
//
// Umgebung: SMTP_HOST, SMTP_PORT (465), SMTP_BENUTZER, SMTP_PASSWORT,
// SMTP_ABSENDER ("miwale <noreply@miwale.com>", sonst SMTP_BENUTZER).
//
// Jede Mail landet zusaetzlich im Postausgang (postausgang.json im Datenordner,
// die letzten 200). So sieht die Verwaltung auch ohne SMTP, was verschickt
// worden waere, und ob ein Versand scheiterte.

import net from "node:net";
import tls from "node:tls";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { sicherSchreiben } from "./gemeinsam.mjs";

export const EMAIL_RE = /^[^\s@<>"',;()\\]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,62}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,62}[A-Za-z0-9])?)+$/;

export function emailOk(wert) {
  return typeof wert === "string" && wert.length <= 200 && EMAIL_RE.test(wert);
}

const b64 = (s) => Buffer.from(s, "utf8").toString("base64");
// Betreff und Namen in UTF-8 (RFC 2047).
const kopfWort = (s) => (/^[\x20-\x7e]*$/.test(s) ? s : "=?UTF-8?B?" + b64(s) + "?=");
// Keine Zeilenumbrueche in Kopfzeilen: sonst liessen sich weitere Koepfe einschleusen.
const einzeilig = (s) => String(s || "").replace(/[\r\n]+/g, " ").slice(0, 300);

export function nachrichtBauen({ von, an, betreff, text, jetzt = new Date() }) {
  const domain = (String(von).match(/@([^>\s]+)/) || [, "miwale.com"])[1];
  const absender = String(von).match(/^(.*)<(.+)>$/);
  const vonKopf = absender ? kopfWort(einzeilig(absender[1].trim())) + " <" + einzeilig(absender[2]) + ">" : einzeilig(von);
  const koerper = b64(String(text || "")).replace(/.{1,76}/g, "$&\r\n");
  return [
    "From: " + vonKopf,
    "To: " + an.map(einzeilig).join(", "),
    "Subject: " + kopfWort(einzeilig(betreff)),
    "Date: " + jetzt.toUTCString().replace("GMT", "+0000"),
    "Message-ID: <" + randomBytes(12).toString("hex") + "@" + domain + ">",
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    koerper
  ].join("\r\n");
}

// Ein SMTP-Gespraech. Liest Antworten zeilenweise; mehrzeilige Antworten
// ("250-...") enden mit "250 ...".
function smtpGespraech(socket) {
  let puffer = "";
  let warten = null;
  const fertig = [];
  const fehler = (e) => { if (warten) { const w = warten; warten = null; w.reject(e); } else fertig.push({ fehler: e }); };
  function verbinden(s) {
    s.setEncoding("utf8");
    s.on("data", (d) => {
      puffer += d;
      let i;
      while ((i = puffer.indexOf("\r\n")) >= 0) {
        const zeile = puffer.slice(0, i);
        puffer = puffer.slice(i + 2);
        aktuelle.push(zeile);
        if (/^\d{3} /.test(zeile) || /^\d{3}$/.test(zeile)) {
          const antwort = { code: Number(zeile.slice(0, 3)), zeilen: aktuelle };
          aktuelle = [];
          if (warten) { const w = warten; warten = null; w.resolve(antwort); } else fertig.push(antwort);
        }
      }
    });
    s.on("error", fehler);
    s.on("close", () => fehler(new Error("verbindung-zu")));
  }
  let aktuelle = [];
  verbinden(socket);
  return {
    antwort() {
      if (fertig.length) { const x = fertig.shift(); return x.fehler ? Promise.reject(x.fehler) : Promise.resolve(x); }
      return new Promise((resolve, reject) => { warten = { resolve, reject }; });
    },
    neu(s) { socket.removeAllListeners("data"); socket.removeAllListeners("close"); socket.removeAllListeners("error"); socket = s; puffer = ""; aktuelle = []; verbinden(s); },
    schreiben(z) { socket.write(z); },
    get socket() { return socket; }
  };
}

export async function smtpSenden(zugang, { an, betreff, text }) {
  const port = Number(zugang.port || 465);
  const host = zugang.host;
  const von = zugang.absender || zugang.benutzer;
  const adresse = (String(von).match(/<(.+)>/) || [, von])[1];
  const zeit = Number(zugang.zeitMs || 20000);
  const offen = await new Promise((resolve, reject) => {
    const s = port === 465
      ? tls.connect({ host, port, servername: host, ...(zugang.tls || {}) }, () => resolve(s))
      : net.connect({ host, port }, () => resolve(s));
    s.once("error", reject);
    s.setTimeout(zeit, () => s.destroy(new Error("zeit")));
  });
  const g = smtpGespraech(offen);
  const erwarte = async (codes, schritt) => {
    const a = await g.antwort();
    if (!codes.includes(a.code)) throw new Error("smtp " + schritt + ": " + a.zeilen.join(" | ").slice(0, 200));
    return a;
  };
  const befehl = async (zeile, codes, schritt) => { g.schreiben(zeile + "\r\n"); return erwarte(codes, schritt); };
  try {
    await erwarte([220], "gruss");
    let ehlo = await befehl("EHLO miwale.com", [250], "ehlo");
    if (port !== 465) {
      if (!ehlo.zeilen.some((z) => /STARTTLS/i.test(z))) throw new Error("smtp: kein STARTTLS");
      await befehl("STARTTLS", [220], "starttls");
      const sicher = await new Promise((resolve, reject) => {
        const s = tls.connect({ socket: g.socket, servername: host, ...(zugang.tls || {}) }, () => resolve(s));
        s.once("error", reject);
      });
      g.neu(sicher);
      ehlo = await befehl("EHLO miwale.com", [250], "ehlo");
    }
    if (zugang.benutzer) {
      await befehl("AUTH PLAIN " + b64("\0" + zugang.benutzer + "\0" + (zugang.passwort || "")), [235], "anmelden");
    }
    await befehl("MAIL FROM:<" + adresse + ">", [250], "absender");
    for (const x of an) await befehl("RCPT TO:<" + x + ">", [250, 251], "empfaenger");
    await befehl("DATA", [354], "data");
    // Punkte am Zeilenanfang verdoppeln (Base64 hat keine, die Koepfe auch nicht -- sicher ist sicher).
    const roh = nachrichtBauen({ von, an, betreff, text }).replace(/\r\n\./g, "\r\n..");
    await befehl(roh + "\r\n.", [250], "senden");
    g.schreiben("QUIT\r\n");
  } finally {
    setTimeout(() => g.socket.destroy(), 200).unref?.();
  }
}

// optionen: ordner, zugang ({ host, port, benutzer, passwort, absender }),
// senden (nur Tests), jetzt.
export function postBauen(optionen) {
  const datei = join(optionen.ordner, "postausgang.json");
  const jetzt = optionen.jetzt || (() => Date.now());
  const zugang = optionen.zugang || {};
  const senden = optionen.senden || ((nachricht) => smtpSenden(zugang, nachricht));
  let ausgang = [];
  try { if (existsSync(datei)) ausgang = JSON.parse(readFileSync(datei, "utf8")).ausgang || []; } catch { ausgang = []; }
  const speichern = () => sicherSchreiben(datei, { ausgang: ausgang.slice(0, 200) });
  const aktiv = () => !!(optionen.senden || zugang.host);

  // Verschickt im Hintergrund; der Aufrufer wartet nicht auf den Server.
  // Gibt ein Promise zurueck, damit Tests warten koennen.
  // geheim: Mails mit Einmal-Links (Bestaetigung, Passwort-Reset). Ihr Text
  // bleibt nicht im Postausgang, sonst koennte jeder Admin fremde Konten uebernehmen.
  function schicken({ an, betreff, text, art, geheim }) {
    const liste = [...new Set((Array.isArray(an) ? an : [an]).filter(emailOk))];
    const eintrag = { id: randomBytes(6).toString("hex"), zeit: new Date(jetzt()).toISOString(), art: art || "mail", an: liste, betreff, text: geheim ? "(Inhalt mit Einmal-Link, nicht gespeichert)" : text, stand: "wartet" };
    ausgang.unshift(eintrag);
    if (!liste.length) { eintrag.stand = "kein-empfaenger"; speichern(); return Promise.resolve(eintrag); }
    if (!aktiv()) { eintrag.stand = "kein-smtp"; speichern(); return Promise.resolve(eintrag); }
    speichern();
    return Promise.resolve()
      .then(() => senden({ an: liste, betreff, text }))
      .then(() => { eintrag.stand = "gesendet"; })
      .catch((e) => { eintrag.stand = "fehler"; eintrag.fehler = String(e.message || e).slice(0, 300); console.error("E-Mail fehlgeschlagen:", eintrag.fehler); })
      .then(() => { speichern(); return eintrag; });
  }

  return {
    schicken,
    aktiv,
    ausgang: () => ausgang.slice(0, 200)
  };
}
