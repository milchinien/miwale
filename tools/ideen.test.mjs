import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ideenBauen, GRENZEN } from "../server/ideen.mjs";

const GERAET_A = "aaaaaaaa-1111-2222-3333-444444444444";
const GERAET_B = "bbbbbbbb-1111-2222-3333-444444444444";
const GERAET_C = "cccccccc-1111-2222-3333-444444444444";
const PASSWORT = "geheim-fuer-tests";
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 7)]);
const IDEE = {
  titel: "Tower of Toast",
  beschreibung: "A tower defense where you defend a toaster against breakfast monsters.",
  genre: "strategie",
  plattform: "pc",
  sichtbarkeit: "oeffentlich",
  erwaehnen: true,
  name: "@toastfan",
  veroeffentlichen: true,
  rechte: true
};

async function starten(t, jetzt) {
  const ordner = mkdtempSync(join(tmpdir(), "miwale-ideen-"));
  const server = http.createServer(ideenBauen({ ordner, passwort: PASSWORT, jetzt }));
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  t.after(() => { server.close(); rmSync(ordner, { recursive: true, force: true }); });
  const basis = "http://127.0.0.1:" + server.address().port + "/api/ideen/";
  const rufen = async (pfad, { methode = "GET", koerper, roh, geraet, auth, ip = "203.0.113.7" } = {}) => {
    const res = await fetch(basis + pfad, {
      method: methode,
      headers: {
        "content-type": roh ? "application/octet-stream" : "application/json",
        "x-forwarded-for": ip,
        ...(geraet ? { "x-miwale-geraet": geraet } : {}),
        ...(auth ? { authorization: "Bearer " + auth } : {})
      },
      body: roh || (koerper ? JSON.stringify(koerper) : undefined)
    });
    const typ = res.headers.get("content-type") || "";
    return { status: res.status, typ, daten: typ.startsWith("application/json") ? await res.json() : Buffer.from(await res.arrayBuffer()) };
  };
  const pfadVon = (adresse) => adresse.replace("/api/ideen/", "");
  return { rufen, ordner, pfadVon };
}

test("oeffentliche Idee steht sofort in der Liste, ihre Bilder erst nach Freigabe", async (t) => {
  const { rufen, ordner, pfadVon } = await starten(t);
  const bild = await rufen("bild", { methode: "POST", roh: PNG, geraet: GERAET_A });
  assert.equal(bild.status, 201);

  const r = await rufen("", { methode: "POST", geraet: GERAET_A, koerper: { ...IDEE, bilder: [bild.daten.id] } });
  assert.equal(r.status, 201);
  assert.equal(r.daten.idee.nummer, 1);
  assert.equal(r.daten.idee.sichtbarkeit, "oeffentlich");
  assert.equal(r.daten.eigene.length, 1);
  // Besitzer und Adresse bleiben beim Dienst.
  assert.equal(JSON.stringify(r.daten).includes("besitzer"), false);

  // Der Einsender sieht sein Bild, andere sehen die Idee, aber noch kein Bild.
  const eigenesBild = await rufen(pfadVon(r.daten.idee.bilder[0]));
  assert.equal(eigenesBild.status, 200);
  assert.equal(eigenesBild.typ, "image/png");
  assert.deepEqual(eigenesBild.daten, PNG);

  let fremd = await rufen("", { geraet: GERAET_B });
  assert.equal(fremd.daten.oeffentlich.length, 1);
  assert.equal(fremd.daten.oeffentlich[0].name, "@toastfan");
  assert.deepEqual(fremd.daten.oeffentlich[0].bilder, []);
  assert.equal(fremd.daten.oeffentlich[0].bilderInPruefung, 1);
  assert.equal(fremd.daten.oeffentlich[0].sichtbarkeit, undefined);
  const bildPfad = "bild/" + r.daten.idee.bilder[0].split("/").pop().replace(/\?.*/, "");
  assert.equal((await rufen(bildPfad)).status, 404);

  // Freigabe durch die Verwaltung.
  await rufen("admin/idee/" + r.daten.idee.id, { methode: "PUT", auth: PASSWORT, koerper: { bilderFrei: true } });
  fremd = await rufen("", { geraet: GERAET_B });
  assert.equal(fremd.daten.oeffentlich[0].bilder.length, 1);
  assert.equal((await rufen(pfadVon(fremd.daten.oeffentlich[0].bilder[0]))).status, 200);

  // Die Adresse liegt nur als Pruefsumme vor.
  assert.equal(readFileSync(join(ordner, "ideen.json"), "utf8").includes("203.0.113.7"), false);
});

test("private Idee sieht nur der Einsender und die Verwaltung", async (t) => {
  const { rufen } = await starten(t);
  const r = await rufen("", { methode: "POST", geraet: GERAET_A, koerper: { ...IDEE, sichtbarkeit: "privat" } });
  assert.equal(r.status, 201);
  assert.equal(r.daten.oeffentlich.length, 0);
  assert.equal(r.daten.eigene[0].sichtbarkeit, "privat");
  assert.equal((await rufen("", { geraet: GERAET_B })).daten.oeffentlich.length, 0);
  assert.equal((await rufen(r.daten.idee.id + "/stimme", { methode: "PUT", geraet: GERAET_B, koerper: { wert: 1 } })).status, 404);

  const alle = await rufen("admin/alle", { auth: PASSWORT });
  assert.equal(alle.daten.ideen[0].sichtbarkeit, "privat");
  assert.ok(alle.daten.ideen[0].rechte);

  // Der Einsender kann sie nachtraeglich oeffentlich machen.
  const auf = await rufen(r.daten.idee.id, { methode: "PUT", geraet: GERAET_A, koerper: { sichtbarkeit: "oeffentlich" } });
  assert.equal(auf.status, 200);
  assert.equal(auf.daten.oeffentlich.length, 1);
  assert.equal((await rufen(r.daten.idee.id, { methode: "PUT", geraet: GERAET_B, koerper: { sichtbarkeit: "privat" } })).status, 404);
});

test("ohne Erwaehnung wird kein Name gespeichert oder gezeigt", async (t) => {
  const { rufen, ordner } = await starten(t);
  const r = await rufen("", { methode: "POST", geraet: GERAET_A, koerper: { ...IDEE, erwaehnen: false, name: "Geheim Name" } });
  assert.equal(r.status, 201);
  assert.equal(r.daten.oeffentlich[0].name, "");
  assert.equal(readFileSync(join(ordner, "ideen.json"), "utf8").includes("Geheim Name"), false);
  // Erwaehnen ohne Namen geht nicht.
  const ohne = await rufen("", { methode: "POST", geraet: GERAET_A, koerper: { ...IDEE, name: "" }, ip: "192.0.2.50" });
  assert.equal(ohne.daten.fehler, "name");
});

test("abstimmen: eine Stimme je Geraet, zuruecknehmen, nicht fuer die eigene Idee", async (t) => {
  const { rufen } = await starten(t);
  const r = await rufen("", { methode: "POST", geraet: GERAET_A, koerper: IDEE });
  const id = r.daten.idee.id;

  assert.equal((await rufen(id + "/stimme", { methode: "PUT", geraet: GERAET_A, koerper: { wert: 1 } })).status, 403);
  assert.equal((await rufen(id + "/stimme", { methode: "PUT", koerper: { wert: 1 } })).status, 400);
  assert.equal((await rufen(id + "/stimme", { methode: "PUT", geraet: GERAET_B, koerper: { wert: 5 } })).status, 400);

  let s = await rufen(id + "/stimme", { methode: "PUT", geraet: GERAET_B, koerper: { wert: 1 } });
  assert.equal(s.daten.idee.punkte, 1);
  assert.equal(s.daten.idee.meineStimme, 1);
  // Zweimal hoch zaehlt einmal.
  s = await rufen(id + "/stimme", { methode: "PUT", geraet: GERAET_B, koerper: { wert: 1 } });
  assert.equal(s.daten.idee.hoch, 1);
  s = await rufen(id + "/stimme", { methode: "PUT", geraet: GERAET_C, koerper: { wert: -1 } });
  assert.deepEqual([s.daten.idee.hoch, s.daten.idee.runter, s.daten.idee.punkte], [1, 1, 0]);
  // Umentscheiden und zuruecknehmen.
  s = await rufen(id + "/stimme", { methode: "PUT", geraet: GERAET_C, koerper: { wert: 1 } });
  assert.equal(s.daten.idee.punkte, 2);
  s = await rufen(id + "/stimme", { methode: "PUT", geraet: GERAET_B, koerper: { wert: 0 } });
  assert.equal(s.daten.idee.punkte, 1);
  assert.equal(s.daten.idee.meineStimme, 0);
  // Andere sehen nicht, wer wie gestimmt hat.
  assert.equal(JSON.stringify(s.daten).includes(GERAET_C), false);
});

test("Liste sortiert nach Punkten; versteckte Ideen verschwinden", async (t) => {
  const { rufen } = await starten(t);
  const a = await rufen("", { methode: "POST", geraet: GERAET_A, koerper: { ...IDEE, titel: "Erste Idee" } });
  const b = await rufen("", { methode: "POST", geraet: GERAET_A, koerper: { ...IDEE, titel: "Zweite Idee" } });
  await rufen(a.daten.idee.id + "/stimme", { methode: "PUT", geraet: GERAET_B, koerper: { wert: 1 } });
  let liste = (await rufen("")).daten.oeffentlich;
  assert.deepEqual(liste.map((i) => i.titel), ["Erste Idee", "Zweite Idee"]);

  await rufen("admin/idee/" + a.daten.idee.id, { methode: "PUT", auth: PASSWORT, koerper: { versteckt: true } });
  liste = (await rufen("")).daten.oeffentlich;
  assert.deepEqual(liste.map((i) => i.titel), ["Zweite Idee"]);
  // Der Einsender sieht, dass sie versteckt ist.
  const eigene = (await rufen("", { geraet: GERAET_A })).daten.eigene;
  assert.equal(eigene.find((i) => i.id === a.daten.idee.id).versteckt, true);
  assert.equal((await rufen(b.daten.idee.id + "/stimme", { methode: "PUT", geraet: GERAET_B, koerper: { wert: -1 } })).status, 200);
});

test("Verwaltung setzt Stand, Nachricht und Link", async (t) => {
  const { rufen } = await starten(t);
  const r = await rufen("", { methode: "POST", geraet: GERAET_A, koerper: IDEE });
  assert.equal((await rufen("admin/alle")).status, 401);
  const id = r.daten.idee.id;
  assert.equal((await rufen("admin/idee/" + id, { methode: "PUT", auth: PASSWORT, koerper: { stand: "gibtsnicht" } })).status, 400);
  assert.equal((await rufen("admin/idee/" + id, { methode: "PUT", auth: PASSWORT, koerper: { link: "javascript:alert(1)" } })).status, 400);
  const ok = await rufen("admin/idee/" + id, {
    methode: "PUT", auth: PASSWORT,
    koerper: { stand: "fertig", antwort: "Built it! Thanks for the idea.", link: "https://youtube.com/shorts/abc" }
  });
  assert.equal(ok.status, 200);
  const oeff = (await rufen("", { geraet: GERAET_B })).daten.oeffentlich[0];
  assert.equal(oeff.stand, "fertig");
  assert.equal(oeff.antwort.text, "Built it! Thanks for the idea.");
  assert.equal(oeff.link, "https://youtube.com/shorts/abc");

  await rufen("admin/idee/" + id, { methode: "DELETE", auth: PASSWORT });
  assert.equal((await rufen("")).daten.oeffentlich.length, 0);
});

test("eigene Idee zurueckziehen loescht auch die Bilder", async (t) => {
  const { rufen, ordner } = await starten(t);
  const bild = await rufen("bild", { methode: "POST", roh: PNG, geraet: GERAET_A });
  const r = await rufen("", { methode: "POST", geraet: GERAET_A, koerper: { ...IDEE, bilder: [bild.daten.id] } });
  const id = r.daten.idee.id;
  assert.equal((await rufen(id, { methode: "DELETE", geraet: GERAET_B })).status, 404);
  const weg = await rufen(id, { methode: "DELETE", geraet: GERAET_A });
  assert.equal(weg.status, 200);
  assert.equal(weg.daten.eigene.length, 0);
  assert.deepEqual(readdirSync(join(ordner, "ideen-bilder")), []);
});

test("ungueltige Einreichungen werden abgewiesen", async (t) => {
  const { rufen } = await starten(t);
  // Jede Anfrage von einer eigenen Adresse, sonst greift das Tempolimit.
  let n = 0;
  const senden = (koerper, geraet = GERAET_A) => rufen("", { methode: "POST", geraet, koerper, ip: "192.0.2." + ++n });
  assert.equal((await senden(IDEE, null)).status, 400);
  assert.equal((await senden({ ...IDEE, rechte: false })).daten.fehler, "rechte");
  assert.equal((await senden({ ...IDEE, sichtbarkeit: undefined })).daten.fehler, "sichtbarkeit");
  assert.equal((await senden({ ...IDEE, titel: "ab" })).daten.fehler, "titel");
  assert.equal((await senden({ ...IDEE, beschreibung: "too short" })).daten.fehler, "beschreibung");
  assert.equal((await senden({ ...IDEE, titel: "x".repeat(GRENZEN.titel + 1) })).status, 400);
  assert.equal((await senden({ ...IDEE, genre: "gibtsnicht" })).status, 400);
  const gesperrt = await senden({ ...IDEE, beschreibung: "A game where everything is total bullshit and you win." });
  assert.equal(gesperrt.status, 422);
  assert.deepEqual(gesperrt.daten.woerter, ["bullshit"]);

  // Kein Bild, sondern etwas anderes mit Bildendung.
  assert.equal((await rufen("bild", { methode: "POST", roh: Buffer.from("<svg onload=alert(1)></svg>........"), geraet: GERAET_A })).status, 400);
  assert.equal((await rufen("bild", { methode: "POST", roh: Buffer.alloc(GRENZEN.bildBytes + 1), geraet: GERAET_A })).status, 413);

  // Bilder eines anderen Geraets lassen sich nicht mitnehmen.
  const fremd = await rufen("bild", { methode: "POST", roh: PNG, geraet: GERAET_B, ip: "198.51.100.3" });
  assert.equal((await senden({ ...IDEE, bilder: [fremd.daten.id] })).daten.fehler, "bild-fehlt");

  // Verstecktes Feld: scheinbar Erfolg, gespeichert wird nichts.
  const bot = await senden({ ...IDEE, website: "http://spam" });
  assert.equal(bot.status, 201);
  assert.equal((await rufen("", { geraet: GERAET_A })).daten.eigene.length, 0);
});

test("Tempolimit je Adresse und hoechstens zehn offene Ideen je Geraet", async (t) => {
  const { rufen } = await starten(t);
  for (let i = 0; i < GRENZEN.einreichenProFenster; i++) {
    assert.equal((await rufen("", { methode: "POST", geraet: GERAET_A, koerper: IDEE, ip: "198.51.100.1" })).status, 201);
  }
  assert.equal((await rufen("", { methode: "POST", geraet: GERAET_A, koerper: IDEE, ip: "198.51.100.1" })).status, 429);
  for (let i = 0; i < GRENZEN.offenJeBesitzer - GRENZEN.einreichenProFenster; i++) {
    assert.equal((await rufen("", { methode: "POST", geraet: GERAET_A, koerper: IDEE, ip: "198.51.100.2" })).status, 201);
  }
  const voll = await rufen("", { methode: "POST", geraet: GERAET_A, koerper: IDEE, ip: "198.51.100.9" });
  assert.equal(voll.status, 429);
  assert.equal(voll.daten.fehler, "zu-viele-offen");
});

test("geloeschter Datenordner waehrend des Betriebs bricht den Upload nicht", async (t) => {
  const { rufen, ordner } = await starten(t);
  rmSync(join(ordner, "ideen-bilder"), { recursive: true, force: true });
  const bild = await rufen("bild", { methode: "POST", roh: PNG, geraet: GERAET_A });
  assert.equal(bild.status, 201);
  rmSync(ordner, { recursive: true, force: true });
  const r = await rufen("", { methode: "POST", geraet: GERAET_A, koerper: IDEE });
  assert.equal(r.status, 201);
});

test("liegen gebliebene Bilder raeumt der Dienst nach einem Tag weg", async (t) => {
  let uhr = Date.parse("2026-09-18T12:00:00Z");
  const { rufen, ordner } = await starten(t, () => uhr);
  const alt = await rufen("bild", { methode: "POST", roh: PNG, geraet: GERAET_A });
  const pfad = join(ordner, "ideen-bilder", alt.daten.id + ".png");
  assert.ok(existsSync(pfad));
  uhr += GRENZEN.loseMs + 1000;
  await rufen("bild", { methode: "POST", roh: PNG, geraet: GERAET_A });
  assert.equal(existsSync(pfad), false);
  assert.equal((await rufen("", { methode: "POST", geraet: GERAET_A, koerper: { ...IDEE, bilder: [alt.daten.id] } })).daten.fehler, "bild-fehlt");
});
