import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { anwendungBauen, gesperrteWoerter, spieleAusKatalog, KATALOG, GRENZEN } from "../server/bewertungen.mjs";
import { START_SPERRLISTE } from "../server/sperrliste.mjs";

const GERAET_A = "aaaaaaaa-1111-2222-3333-444444444444";
const GERAET_B = "bbbbbbbb-1111-2222-3333-444444444444";
const PASSWORT = "geheim-fuer-tests";

async function starten(t) {
  const ordner = mkdtempSync(join(tmpdir(), "miwale-bew-"));
  const server = http.createServer(anwendungBauen({ ordner, passwort: PASSWORT }));
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  t.after(() => { server.close(); rmSync(ordner, { recursive: true, force: true }); });
  const basis = "http://127.0.0.1:" + server.address().port + "/api/bewertungen/";
  const rufen = async (pfad, { methode = "GET", koerper, auth, ip = "203.0.113.7" } = {}) => {
    const res = await fetch(basis + pfad, {
      method: methode,
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": ip,
        ...(auth ? { authorization: "Bearer " + auth } : {})
      },
      body: koerper ? JSON.stringify(koerper) : undefined
    });
    return { status: res.status, daten: await res.json() };
  };
  return { rufen, ordner };
}

test("Wortfilter faengt Umschreibungen, laesst harmlose Woerter durch", () => {
  const liste = START_SPERRLISTE;
  assert.deepEqual(gesperrteWoerter("this is shit", liste), ["shit"]);
  assert.deepEqual(gesperrteWoerter("SH1T game", liste), ["shit"]);
  assert.deepEqual(gesperrteWoerter("shiiiit", liste), ["shit"]);
  assert.deepEqual(gesperrteWoerter("s h i t", liste), ["shit"]);
  assert.deepEqual(gesperrteWoerter("so eine Scheiße", liste), ["scheisse"]);
  assert.deepEqual(gesperrteWoerter("Great class design, Dickens would approve. Shitake? no.", liste), []);
  assert.deepEqual(gesperrteWoerter("Scunthorpe assassin passes", liste), []);
});

test("eine Bewertung je Geraet und Spiel, zweite Abgabe ersetzt die erste", async (t) => {
  const { rufen } = await starten(t);
  let r = await rufen("chromatic", { methode: "PUT", koerper: { geraet: GERAET_A, daumen: "hoch", text: "Love the cards", privat: "Act 2 is too hard" } });
  assert.equal(r.status, 200);
  assert.equal(r.daten.hoch, 1);
  assert.equal(r.daten.eigene.privat, "Act 2 is too hard");

  r = await rufen("chromatic", { methode: "PUT", koerper: { geraet: GERAET_A, daumen: "runter", text: "Changed my mind" } });
  assert.equal(r.daten.hoch, 0);
  assert.equal(r.daten.runter, 1);
  assert.equal(r.daten.liste.length, 1);
  assert.equal(r.daten.liste[0].eigene, true);

  await rufen("chromatic", { methode: "PUT", koerper: { geraet: GERAET_B, daumen: "hoch" } });
  r = await rufen("chromatic?geraet=" + GERAET_B);
  assert.equal(r.daten.hoch, 1);
  assert.equal(r.daten.runter, 1);
  // Nur Daumen ohne Text zaehlt, erscheint aber nicht in der Liste.
  assert.equal(r.daten.liste.length, 1);
  assert.equal(r.daten.liste[0].eigene, false);
  // Privates Feedback, Geraet und Adresse bleiben aus der oeffentlichen Sicht.
  assert.equal(JSON.stringify(r.daten.liste).includes("privat"), false);
  assert.equal(JSON.stringify(r.daten.liste).includes(GERAET_A), false);
});

test("eigene Bewertung loeschen", async (t) => {
  const { rufen } = await starten(t);
  await rufen("dropfall", { methode: "PUT", koerper: { geraet: GERAET_A, daumen: "hoch", text: "Nice" } });
  const r = await rufen("dropfall?geraet=" + GERAET_A, { methode: "DELETE" });
  assert.equal(r.daten.hoch, 0);
  assert.equal(r.daten.eigene, null);
});

test("ungueltige Eingaben werden abgewiesen", async (t) => {
  const { rufen } = await starten(t);
  assert.equal((await rufen("gibtsnicht")).status, 404);
  assert.equal((await rufen("chromatic", { methode: "PUT", koerper: { geraet: "kurz", daumen: "hoch" } })).status, 400);
  assert.equal((await rufen("chromatic", { methode: "PUT", koerper: { geraet: GERAET_A, daumen: "vielleicht" } })).status, 400);
  assert.equal((await rufen("chromatic", { methode: "PUT", koerper: { geraet: GERAET_A, daumen: "hoch", text: "x".repeat(GRENZEN.oeffentlich + 1) } })).status, 400);
  const gesperrt = await rufen("chromatic", { methode: "PUT", koerper: { geraet: GERAET_A, daumen: "runter", text: "total bullshit" } });
  assert.equal(gesperrt.status, 422);
  assert.deepEqual(gesperrt.daten.woerter, ["bullshit"]);
  // Das versteckte Feld: scheinbar Erfolg, gespeichert wird nichts.
  const bot = await rufen("chromatic", { methode: "PUT", koerper: { geraet: GERAET_A, daumen: "hoch", website: "http://spam" } });
  assert.equal(bot.status, 200);
  assert.equal((await rufen("chromatic")).daten.hoch, 0);
});

test("Tempolimit je Adresse", async (t) => {
  const { rufen } = await starten(t);
  for (let i = 0; i < GRENZEN.schreibenProFenster; i++) {
    const r = await rufen("runecall", { methode: "PUT", koerper: { geraet: GERAET_A, daumen: "hoch" }, ip: "198.51.100.1" });
    assert.equal(r.status, 200);
  }
  assert.equal((await rufen("runecall", { methode: "PUT", koerper: { geraet: GERAET_A, daumen: "hoch" }, ip: "198.51.100.1" })).status, 429);
  assert.equal((await rufen("runecall", { methode: "PUT", koerper: { geraet: GERAET_A, daumen: "hoch" }, ip: "198.51.100.2" })).status, 200);
});

test("Verwaltung: nur mit Passwort, sieht privates Feedback, loescht und antwortet", async (t) => {
  const { rufen, ordner } = await starten(t);
  await rufen("harmonics", { methode: "PUT", koerper: { geraet: GERAET_A, daumen: "hoch", text: "Relaxing", privat: "Add a mute button" } });

  assert.equal((await rufen("admin/alle")).status, 401);
  assert.equal((await rufen("admin/alle", { auth: "falsch" })).status, 401);

  const alle = await rufen("admin/alle", { auth: PASSWORT });
  assert.equal(alle.status, 200);
  const b = alle.daten.bewertungen[0];
  assert.equal(b.privat, "Add a mute button");
  assert.equal(b.spiel, "harmonics");
  // Die Adresse liegt nur als Pruefsumme vor.
  assert.equal(readFileSync(join(ordner, "bewertungen.json"), "utf8").includes("203.0.113.7"), false);

  await rufen("admin/bewertung/" + b.id + "/antwort", { methode: "PUT", auth: PASSWORT, koerper: { text: "Coming in the next update!" } });
  let oeff = await rufen("harmonics");
  assert.equal(oeff.daten.liste[0].antwort.text, "Coming in the next update!");

  await rufen("admin/bewertung/" + b.id + "?nur=text", { methode: "DELETE", auth: PASSWORT });
  oeff = await rufen("harmonics");
  assert.equal(oeff.daten.hoch, 1);
  assert.equal(oeff.daten.liste.length, 0);

  await rufen("admin/bewertung/" + b.id, { methode: "DELETE", auth: PASSWORT });
  assert.equal((await rufen("harmonics")).daten.hoch, 0);

  const liste = await rufen("admin/sperrliste", { methode: "PUT", auth: PASSWORT, koerper: { woerter: ["Boring", "boring", " lame "] } });
  assert.deepEqual(liste.daten.woerter, ["boring", "lame"]);
  assert.equal((await rufen("harmonics", { methode: "PUT", koerper: { geraet: GERAET_A, daumen: "runter", text: "so lame" } })).status, 422);
});

test("falsche Passwoerter werden gebremst", async (t) => {
  const { rufen } = await starten(t);
  for (let i = 0; i < GRENZEN.loginVersuche; i++) await rufen("admin/alle", { auth: "rate" + i, ip: "192.0.2.9" });
  assert.equal((await rufen("admin/alle", { auth: "noch-einer", ip: "192.0.2.9" })).status, 429);
});

test("Spieleliste kommt vollstaendig aus dem Katalog der Spieleseite", () => {
  const spiele = spieleAusKatalog(KATALOG);
  // Der Katalog selbst im Browser: jedes Spiel mit id muss gefunden werden.
  const fenster = {};
  new Function("window", readFileSync(KATALOG, "utf8"))(fenster);
  assert.deepEqual(spiele, fenster.MIWALE_SPIELE.map((s) => s.id));
  for (const id of ["dropfall", "chromatic", "runecall"]) assert.ok(spiele.includes(id), id);
});
