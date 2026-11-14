// Tests fuer das Studio (server/studio.mjs), die Verwaltung mit 2FA
// (server/verwaltung.mjs), den Postausgang (server/post.mjs), den ZIP-Entpacker
// (server/zip-lesen.mjs) und die Konten mit E-Mail (server/konten.mjs).
import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { zipBauen } from "./zip.mjs";
import { entpacken, pfadOk } from "../server/zip-lesen.mjs";
import { studioBauen, alterAus, hinweiseAus, slugAus, checkliste, leereSeite } from "../server/studio.mjs";
import { verwaltungBauen, hotp, totpPruefen, base32, base32Lesen } from "../server/verwaltung.mjs";
import { postBauen, nachrichtBauen, emailOk } from "../server/post.mjs";
import { kontenBauen } from "../server/konten.mjs";
import { adminSchutz } from "../server/gemeinsam.mjs";

const HERKUNFT = "https://miwale.test";
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 1)]);
const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from("ftypisom"), Buffer.alloc(64, 2)]);

function ordner(t, name) {
  const o = mkdtempSync(join(tmpdir(), "miwale-" + name + "-"));
  t.after(() => rmSync(o, { recursive: true, force: true }));
  return o;
}

// Ein Browser mit eigenem Cookie-Speicher.
function browserFuer(basis) {
  return function browser() {
    const dose = new Map();
    return async function rufen(pfad, { methode = "GET", koerper, roh, kopf } = {}) {
      const res = await fetch(basis + pfad, {
        method: methode,
        redirect: "manual",
        headers: {
          ...(roh ? {} : { "content-type": "application/json" }),
          origin: HERKUNFT,
          cookie: [...dose].map(([n, w]) => n + "=" + w).join("; "),
          ...(kopf || {})
        },
        body: roh || (koerper === undefined ? undefined : JSON.stringify(koerper))
      });
      for (const c of res.headers.getSetCookie()) {
        const [paar] = c.split(";");
        const i = paar.indexOf("=");
        const n = paar.slice(0, i), w = paar.slice(i + 1);
        if (w) dose.set(n, w); else dose.delete(n);
      }
      const text = await res.text();
      let daten = null;
      try { daten = JSON.parse(text); } catch { daten = text; }
      return { status: res.status, daten, kopf: res.headers };
    };
  };
}

// Alles zusammen wie in server/start.mjs, nur mit lokalen Cookies und gefaelschtem Mailversand.
async function aufbauen(t, { spieleAdresse = "https://play.miwale.test", mitPost = true } = {}) {
  const o = ordner(t, "studio");
  const mails = [];
  const post = postBauen({ ordner: o, senden: mitPost ? async (n) => { mails.push(n); } : undefined });
  const verwaltung = verwaltungBauen({ ordner: o, passwort: "altes-passwort", herkunft: [HERKUNFT], post, sicher: false });
  const schutz = adminSchutz(undefined, undefined, verwaltung);
  const ref = {};
  const konten = kontenBauen({
    ordner: o, passwort: "altes-passwort", herkunft: [HERKUNFT], sicher: false, adresse: HERKUNFT, adminSchutz: schutz,
    email: { aktiv: true, post: mitPost ? post : { aktiv: () => false, schicken: async () => ({}) } },
    beimLoeschen: (id) => ref.studio.kontoLoeschen(id)
  });
  const studio = studioBauen({ ordner: o, passwort: "altes-passwort", herkunft: [HERKUNFT], konten, verwaltung, post, adminSchutz: schutz, spieleAdresse, adresse: HERKUNFT, festeIds: ["dropfall"] });
  ref.studio = studio;
  const server = http.createServer((req, res) => {
    if (req.url.startsWith("/api/konto")) return konten(req, res);
    if (req.url.startsWith("/api/verwaltung")) return verwaltung(req, res);
    return studio(req, res);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  t.after(() => server.close());
  const basis = "http://127.0.0.1:" + server.address().port;
  return { o, mails, post, studio, verwaltung, browser: browserFuer(basis), basis };
}

async function entwickler(umg, name = "entwickler1", email = "dev@example.com") {
  const b = umg.browser();
  const r = await b("/api/konto/email/registrieren", { methode: "POST", koerper: { email, passwort: "sicher-genug", name, alter: true } });
  assert.equal(r.status, 202, JSON.stringify(r.daten));
  // Bestaetigungslink aus der Mail.
  await new Promise((x) => setTimeout(x, 20));
  const mail = umg.mails.filter((m) => m.an.includes(email)).pop();
  const token = /token=([A-Za-z0-9_-]+)/.exec(mail.text)[1];
  const best = await b("/api/konto/email/bestaetigen?token=" + token);
  assert.equal(best.status, 302);
  return b;
}

async function adminAnmelden(umg) {
  const a = umg.browser();
  assert.equal((await a("/api/verwaltung/einrichten", { methode: "POST", koerper: { altesPasswort: "altes-passwort", name: "michel", passwort: "ganz-langes-passwort" } })).status, 201);
  const schritt1 = await a("/api/verwaltung/anmelden", { methode: "POST", koerper: { name: "michel", passwort: "ganz-langes-passwort" } });
  assert.equal(schritt1.daten.schritt, "einrichten");
  const code = hotp(schritt1.daten.schluessel, Math.floor(Date.now() / 30000));
  const schritt2 = await a("/api/verwaltung/anmelden/code", { methode: "POST", koerper: { zwischen: schritt1.daten.zwischen, code } });
  assert.equal(schritt2.status, 200, JSON.stringify(schritt2.daten));
  return a;
}

// ---- ZIP ----
test("zip: entpackt Builds mit Ueberordner und findet index.html", async (t) => {
  const o = ordner(t, "zip");
  const zip = join(o, "build.zip");
  writeFileSync(zip, zipBauen([
    { name: "MeinSpiel/index.html", daten: "<!doctype html><title>x</title>" + "x".repeat(200) },
    { name: "MeinSpiel/js/spiel.js", daten: "console.log(1);".repeat(20) },
    { name: "MeinSpiel/bild.png", daten: PNG }
  ]));
  const r = await entpacken(zip, join(o, "aus"));
  assert.equal(r.start, "index.html");
  assert.equal(r.dateien, 3);
  assert.ok(existsSync(join(o, "aus", "js", "spiel.js")));
  assert.equal(readFileSync(join(o, "aus", "js", "spiel.js"), "utf8"), "console.log(1);".repeat(20));
});

test("zip: Pfade mit .. und ohne index.html werden abgewiesen", async (t) => {
  const o = ordner(t, "zip");
  assert.equal(pfadOk("../boese.js"), null);
  assert.equal(pfadOk("a/../../b"), null);
  assert.equal(pfadOk("/etc/passwd"), null);
  assert.equal(pfadOk("C:\\x"), null);
  assert.equal(pfadOk("ok/datei.js"), "ok/datei.js");
  const boese = join(o, "boese.zip");
  writeFileSync(boese, zipBauen([{ name: "../index.html", daten: "x" }]));
  await assert.rejects(entpacken(boese, join(o, "a")), /pfad-verboten/);
  const ohne = join(o, "ohne.zip");
  writeFileSync(ohne, zipBauen([{ name: "spiel.js", daten: "x" }]));
  await assert.rejects(entpacken(ohne, join(o, "b")), /keine-index-html/);
  const bombe = join(o, "bombe.zip");
  writeFileSync(bombe, zipBauen([{ name: "index.html", daten: Buffer.alloc(5 * 1024 * 1024, 0) }]));
  await assert.rejects(entpacken(bombe, join(o, "c")), /zip-bombe/);
});

// ---- Bausteine ----
test("Altersempfehlung und Inhaltshinweise aus dem Fragebogen", () => {
  assert.equal(alterAus({ gewalt: "nein" }), 0);
  assert.equal(alterAus({ gewalt: "comic" }), 6);
  assert.equal(alterAus({ gewalt: "realistisch", blut: "viel" }), 18);
  assert.equal(alterAus({ horror: "stark" }), 16);
  assert.equal(alterAus({ gewalt: "nein", alterEigen: 12 }), 12);
  assert.deepEqual(hinweiseAus({ gewalt: "fantasie", ki: "ja", daten: "nein" }), ["gewalt-fantasie", "ki"]);
  assert.equal(slugAus("Über den Wolken!"), "ueber-den-wolken");
});

test("TOTP nach RFC 6238 (Testvektor) und base32", () => {
  // RFC 6238, SHA1, Schluessel "12345678901234567890", T=59 -> 94287082 (8 Stellen) -> 287082.
  const schluessel = base32(Buffer.from("12345678901234567890"));
  assert.equal(base32Lesen(schluessel).toString(), "12345678901234567890");
  assert.equal(hotp(schluessel, 1), "287082");
  assert.equal(totpPruefen(schluessel, "287082", 59 * 1000), 1);
  // Derselbe Code gilt nicht zweimal.
  assert.equal(totpPruefen(schluessel, "287082", 59 * 1000, 1), -1);
});

test("post: Nachricht ohne eingeschleuste Kopfzeilen, Betreff in UTF-8", () => {
  const n = nachrichtBauen({ von: "miwale <noreply@miwale.com>", an: ["a@b.de"], betreff: "Prüfung\r\nBcc: x@y.de", text: "Hallo" });
  assert.ok(!/\r\nBcc:/.test(n));
  assert.match(n, /Subject: =\?UTF-8\?B\?/);
  assert.ok(emailOk("a.b+c@d-e.de"));
  assert.ok(!emailOk("a@b"));
  assert.ok(!emailOk("a b@c.de"));
});

// ---- Verwaltung ----
test("verwaltung: erstes Konto nur mit altem Passwort, danach gilt das alte Passwort nicht mehr", async (t) => {
  const umg = await aufbauen(t);
  const a = umg.browser();
  assert.equal((await a("/api/verwaltung/einrichten", { methode: "POST", koerper: { altesPasswort: "falsch", name: "michel", passwort: "ganz-langes-passwort" } })).status, 401);
  const admin = await adminAnmelden(umg);
  assert.equal((await a("/api/verwaltung/einrichten", { methode: "POST", koerper: { altesPasswort: "altes-passwort", name: "zwei", passwort: "ganz-langes-passwort" } })).status, 409);
  // Mit Sitzung: Verwaltung des Studios erreichbar. Mit altem Passwort nicht mehr.
  assert.equal((await admin("/api/studio/admin/projekte")).status, 200);
  assert.equal((await a("/api/studio/admin/projekte", { kopf: { authorization: "Bearer altes-passwort" } })).status, 401);
  // Falscher Code, falsches Passwort.
  const b = umg.browser();
  const s1 = await b("/api/verwaltung/anmelden", { methode: "POST", koerper: { name: "michel", passwort: "ganz-langes-passwort" } });
  assert.equal(s1.daten.schritt, "code");
  assert.equal(s1.daten.schluessel, undefined);
  assert.equal((await b("/api/verwaltung/anmelden/code", { methode: "POST", koerper: { zwischen: s1.daten.zwischen, code: "000000" } })).status, 401);
  assert.equal((await b("/api/verwaltung/anmelden", { methode: "POST", koerper: { name: "michel", passwort: "falsch-falsch" } })).status, 401);
  assert.equal((await b("/api/verwaltung/einstellungen")).status, 401);
});

test("verwaltung: Einstellungen werden geprueft und oeffentlich ausgeliefert", async (t) => {
  const umg = await aufbauen(t);
  const admin = await adminAnmelden(umg);
  const alt = (await admin("/api/verwaltung/einstellungen")).daten.einstellungen;
  assert.equal((await admin("/api/verwaltung/einstellungen", { methode: "PUT", koerper: { meldungAn: ["kein-mail"] } })).status, 400);
  const neu = await admin("/api/verwaltung/einstellungen", { methode: "PUT", koerper: { banner: { an: true, de: "Hallo", en: "Hi", link: "/studio" }, meldungAn: ["chef@example.com"], spiele: { versteckt: ["dropfall"], hervorgehoben: [] } } });
  assert.equal(neu.status, 200);
  assert.equal(neu.daten.einstellungen.studio.maxBuildMb, alt.studio.maxBuildMb);
  const js = umg.studio.katalogJs();
  assert.match(js, /"versteckt":\["dropfall"\]/);
  assert.match(js, /"an":true/);
});

// ---- Der ganze Weg eines Spiels ----
test("studio: anlegen, Store-Seite, Medien, Build, einreichen, pruefen, veroeffentlichen", async (t) => {
  const umg = await aufbauen(t);
  const admin = await adminAnmelden(umg);
  await admin("/api/verwaltung/einstellungen", { methode: "PUT", koerper: { meldungAn: ["chef@example.com"] } });
  const dev = await entwickler(umg);

  // Ohne Konto: nichts.
  const gast = umg.browser();
  assert.equal((await gast("/api/studio/projekte")).status, 401);

  const neu = await dev("/api/studio/projekte", { methode: "POST", koerper: { name: "Dropfall" } });
  assert.equal(neu.status, 201);
  // Feste Spiele sind als Adresse tabu.
  assert.notEqual(neu.daten.slug, "dropfall");
  const id = neu.daten.id;
  assert.equal(neu.daten.checkliste.fertig, false);

  // Einreichen geht erst mit vollstaendiger Checkliste.
  assert.equal((await dev("/api/studio/projekte/" + id + "/einreichen", { methode: "POST", koerper: {} })).status, 422);

  // Falsche Werte werden abgewiesen.
  assert.equal((await dev("/api/studio/projekte/" + id + "/seite", { methode: "PUT", koerper: { genre: "Gibtsnicht" } })).status, 400);
  assert.equal((await dev("/api/studio/projekte/" + id + "/seite", { methode: "PUT", koerper: { inhalt: { gewalt: "extrem" } } })).status, 400);
  assert.equal((await dev("/api/studio/projekte/" + id + "/seite", { methode: "PUT", koerper: { webseite: "javascript:alert(1)" } })).status, 400);

  const seite = await dev("/api/studio/projekte/" + id + "/seite", {
    methode: "PUT",
    koerper: {
      name: "Sternenfall", kurz: "Sterne fallen, du faengst sie. Ein kleines Arcade-Spiel fuer zwischendurch.",
      lang: "Ein langes Spiel ueber Sterne.\n\n" + "Mehr Text dazu. ".repeat(10), genre: "Arcade", tags: ["Arcade", "Highscore"],
      sprachen: ["de", "en"], geraete: ["pc", "handy"], features: ["Endlos-Modus"], steuerung: "Maus",
      inhalt: { gewalt: "nein", blut: "nein", horror: "nein", sexuell: "nein", sprache: "nein", drogen: "nein", gluecksspiel: "nein", mikrotransaktionen: "nein", ki: "ja", kiText: "Die Musik ist mit KI erzeugt.", multiplayer: "nein", chat: "nein", daten: "nein" },
      technik: { engine: "phaser", eingabe: ["maus", "touch"] },
      rechte: { eigene: true, lizenzen: "Schrift: OFL" }
    }
  });
  assert.equal(seite.status, 200, JSON.stringify(seite.daten));
  assert.deepEqual(seite.daten.checkliste.schritte.seite, []);
  assert.deepEqual(seite.daten.checkliste.schritte.grafiken.sort(), ["header", "icon", "kapsel", "screens"]);

  // Medien: echte Bilder ja, HTML als Bild nein, Video nur als Trailer.
  assert.equal((await dev("/api/studio/projekte/" + id + "/medien?art=icon", { methode: "POST", roh: Buffer.from("<html><script>alert(1)</script>" + " ".repeat(40)) })).status, 415);
  assert.equal((await dev("/api/studio/projekte/" + id + "/medien?art=icon", { methode: "POST", roh: MP4 })).status, 415);
  for (const art of ["icon", "header", "kapsel", "screen", "screen", "screen"]) {
    assert.equal((await dev("/api/studio/projekte/" + id + "/medien?art=" + art, { methode: "POST", roh: PNG })).status, 201);
  }
  const mitTrailer = await dev("/api/studio/projekte/" + id + "/medien?art=trailer", { methode: "POST", roh: MP4 });
  assert.equal(mitTrailer.status, 201);
  const iconUrl = mitTrailer.daten.entwurf.medien.icon;
  // Entwurfs-Medien sieht nur der Besitzer.
  assert.equal((await gast(iconUrl)).status, 404);
  assert.equal((await dev(iconUrl)).status, 200);

  // Build hochladen.
  const zip = zipBauen([{ name: "spiel/index.html", daten: '<!doctype html><meta name="viewport" content="width=device-width"><script src="/absolut.js"></script>' + " ".repeat(100) }]);
  const build = await dev("/api/studio/projekte/" + id + "/builds?notiz=v1", { methode: "POST", roh: zip, kopf: { "content-type": "application/zip" } });
  assert.equal(build.status, 201, JSON.stringify(build.daten));
  assert.equal(build.daten.builds[0].start, "index.html");
  assert.ok(build.daten.builds[0].bericht.some((x) => x.text === "absolute-pfade"));
  assert.match(build.daten.builds[0].vorschau, /^https:\/\/play\.miwale\.test\/vorschau\/[0-9a-f]{24}\/$/);
  assert.ok(umg.studio.vorschauOrdner(build.daten.builds[0].id));

  const fertig = await dev("/api/studio/projekte/" + id + "/veroeffentlichung", { methode: "PUT", koerper: { modus: "sofort" } });
  assert.equal(fertig.daten.checkliste.fertig, true, JSON.stringify(fertig.daten.checkliste));

  // Einreichen: Admins bekommen eine Mail.
  const vorher = umg.mails.length;
  const ein = await dev("/api/studio/projekte/" + id + "/einreichen", { methode: "POST", koerper: { notiz: "Erste Version" } });
  assert.equal(ein.status, 200);
  assert.equal(ein.daten.status, "eingereicht");
  await new Promise((x) => setTimeout(x, 20));
  const meldung = umg.mails.slice(vorher).find((m) => m.an.includes("chef@example.com"));
  assert.ok(meldung, "Admin-Mail fehlt");
  assert.match(meldung.betreff, /Neue Einreichung – Sternenfall/);
  assert.match(meldung.text, new RegExp("/admin/#einreichung/" + id));
  // Waehrend der Pruefung ist der Entwurf gesperrt.
  assert.equal((await dev("/api/studio/projekte/" + id + "/seite", { methode: "PUT", koerper: { kurz: "anders" } })).status, 409);

  // Pruefung: Build abgelehnt -> Entwickler bekommt Mail, Status abgelehnt.
  const liste = await admin("/api/studio/admin/projekte");
  assert.equal(liste.daten.projekte[0].status, "eingereicht");
  assert.equal(liste.daten.projekte[0].besitzer, "entwickler1");
  const ab = await admin("/api/studio/admin/projekte/" + id + "/pruefung", { methode: "POST", koerper: { seite: "ok", build: "abgelehnt", nachricht: "Bitte relative Pfade benutzen." } });
  assert.equal(ab.daten.status, "abgelehnt");
  await new Promise((x) => setTimeout(x, 20));
  assert.ok(umg.mails.some((m) => m.an.includes("dev@example.com") && /braucht noch/.test(m.betreff)));

  // Neu einreichen, freigeben, veroeffentlichen.
  assert.equal((await dev("/api/studio/projekte/" + id + "/einreichen", { methode: "POST", koerper: {} })).status, 200);
  assert.equal((await dev("/api/studio/projekte/" + id + "/veroeffentlichen", { methode: "POST", koerper: {} })).status, 409);
  const ok = await admin("/api/studio/admin/projekte/" + id + "/pruefung", { methode: "POST", koerper: { seite: "ok", build: "ok", nachricht: "Schoen!" } });
  assert.equal(ok.daten.status, "freigegeben");
  assert.equal(umg.studio.katalog().length, 0);
  const live = await dev("/api/studio/projekte/" + id + "/veroeffentlichen", { methode: "POST", koerper: {} });
  assert.equal(live.status, 200);

  const katalog = umg.studio.katalog();
  assert.equal(katalog.length, 1);
  const sp = katalog[0];
  assert.equal(sp.name, "Sternenfall");
  assert.equal(sp.spielen, "/community/" + neu.daten.slug + "/");
  assert.equal(sp.entwickler.profil, "entwickler1");
  assert.deepEqual(sp.inhalt.hinweise, ["ki"]);
  assert.equal(sp.texte.de.ueber.length, 2);
  assert.deepEqual(umg.studio.liveIds(), [neu.daten.slug]);
  // Live-Medien sind jetzt oeffentlich.
  assert.equal((await gast(sp.icon)).status, 200);
  assert.match(umg.studio.katalogJs(), /window\.MIWALE_COMMUNITY = \[\{/);
  assert.ok(!umg.studio.katalogJs().includes("</script"));

  // Aenderungen nach der Veroeffentlichung gehen erst nach erneuter Pruefung live.
  await dev("/api/studio/projekte/" + id + "/seite", { methode: "PUT", koerper: { name: "Sternenfall 2" } });
  assert.equal(umg.studio.katalog()[0].name, "Sternenfall");

  // Sperren nimmt das Spiel aus dem Katalog.
  await admin("/api/studio/admin/projekte/" + id + "/sperren", { methode: "POST", koerper: { gesperrt: true, grund: "Test" } });
  assert.equal(umg.studio.katalog().length, 0);
  assert.equal((await gast(sp.icon)).status, 404);
});

test("studio: ohne eigene Spiele-Adresse keine Builds", async (t) => {
  const umg = await aufbauen(t, { spieleAdresse: "" });
  const dev = await entwickler(umg);
  const neu = await dev("/api/studio/projekte", { methode: "POST", koerper: { name: "Test Spiel" } });
  const zip = zipBauen([{ name: "index.html", daten: "<html></html>" }]);
  const r = await dev("/api/studio/projekte/" + neu.daten.id + "/builds", { methode: "POST", roh: zip });
  assert.equal(r.status, 503);
  assert.equal(r.daten.fehler, "keine-spiele-adresse");
});

test("studio: fremde Projekte sind unsichtbar, Konto loeschen loescht Projekte", async (t) => {
  const umg = await aufbauen(t);
  const a = await entwickler(umg, "spieler_a", "a@example.com");
  const b = await entwickler(umg, "spieler_b", "b@example.com");
  const p = await a("/api/studio/projekte", { methode: "POST", koerper: { name: "Geheimprojekt" } });
  assert.equal((await b("/api/studio/projekte/" + p.daten.id)).status, 404);
  assert.equal((await b("/api/studio/projekte/" + p.daten.id + "/seite", { methode: "PUT", koerper: { name: "Geklaut" } })).status, 404);
  assert.equal((await a("/api/konto", { methode: "DELETE", koerper: { bestaetigt: true } })).status, 200);
  assert.equal((await umg.browser()("/api/studio/katalog")).daten.spiele.length, 0);
});

// ---- Konten mit E-Mail ----
test("konto: E-Mail-Anmeldung mit Bestaetigung, Passwort vergessen", async (t) => {
  const umg = await aufbauen(t);
  const b = umg.browser();
  assert.equal((await b("/api/konto/email/registrieren", { methode: "POST", koerper: { email: "x@example.com", passwort: "kurz", name: "xname", alter: true } })).status, 400);
  assert.equal((await b("/api/konto/email/registrieren", { methode: "POST", koerper: { email: "x@example.com", passwort: "lang-genug-1", name: "xname", alter: true } })).status, 202);
  // Vor der Bestaetigung: kein Anmelden.
  assert.equal((await b("/api/konto/email/anmelden", { methode: "POST", koerper: { email: "x@example.com", passwort: "lang-genug-1" } })).status, 403);
  // Gleiche Adresse noch einmal verraet nichts.
  assert.equal((await b("/api/konto/email/registrieren", { methode: "POST", koerper: { email: "X@example.com", passwort: "lang-genug-1", name: "xname2", alter: true } })).status, 202);
  await new Promise((x) => setTimeout(x, 20));
  const token = /token=([A-Za-z0-9_-]+)/.exec(umg.mails.find((m) => /bestätige/.test(m.betreff)).text)[1];
  // Der Postausgang zeigt den Link nicht.
  assert.ok(!JSON.stringify(umg.post.ausgang()).includes(token));
  assert.equal((await b("/api/konto/email/bestaetigen?token=" + token)).status, 302);
  assert.equal((await b("/api/konto/ich")).daten.konto.name, "xname");
  // Link gilt nur einmal.
  assert.equal((await umg.browser()("/api/konto/email/bestaetigen?token=" + token)).kopf.get("location"), "/account?fehler=link-abgelaufen");

  const c = umg.browser();
  assert.equal((await c("/api/konto/email/anmelden", { methode: "POST", koerper: { email: "x@example.com", passwort: "falsch-falsch" } })).status, 401);
  assert.equal((await c("/api/konto/email/anmelden", { methode: "POST", koerper: { email: "x@example.com", passwort: "lang-genug-1" } })).status, 200);

  // Passwort vergessen.
  assert.equal((await c("/api/konto/email/vergessen", { methode: "POST", koerper: { email: "x@example.com" } })).status, 200);
  await new Promise((x) => setTimeout(x, 20));
  const reset = /zuruecksetzen=([A-Za-z0-9_-]+)/.exec(umg.mails.filter((m) => /zurücksetzen/.test(m.betreff)).pop().text)[1];
  assert.equal((await c("/api/konto/email/zuruecksetzen", { methode: "POST", koerper: { token: reset, passwort: "neues-passwort-2" } })).status, 200);
  // Alte Sitzung (b) ist weg.
  assert.equal((await b("/api/konto/ich")).daten.konto, null);
  assert.equal((await umg.browser()("/api/konto/email/anmelden", { methode: "POST", koerper: { email: "x@example.com", passwort: "neues-passwort-2" } })).status, 200);
});

test("konto: ohne SMTP gilt die Adresse sofort", async (t) => {
  const umg = await aufbauen(t, { mitPost: false });
  const b = umg.browser();
  const r = await b("/api/konto/email/registrieren", { methode: "POST", koerper: { email: "y@example.com", passwort: "lang-genug-1", name: "yname", alter: true } });
  assert.equal(r.status, 201);
  assert.equal((await b("/api/konto/ich")).daten.konto.email, "y@example.com");
  assert.ok((await b("/api/konto/ich")).daten.anbieter.includes("email"));
});

test("checkliste: leeres Projekt ist nicht fertig", () => {
  const c = checkliste({ entwurf: leereSeite("A"), builds: [], entwurfBuild: null, veroeffentlichung: { modus: "sofort" } }, ["Action"]);
  assert.equal(c.fertig, false);
  assert.ok(c.schritte.build.includes("build"));
});
