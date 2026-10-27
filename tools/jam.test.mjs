import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { jamBauen, jamSpieleAusKatalog, JAM_KATALOG } from "../server/jam.mjs";

const A = "aaaaaaaa-1111-2222-3333-444444444444";
const B = "bbbbbbbb-1111-2222-3333-444444444444";
const PASSWORT = "geheim-fuer-tests";
const WURZEL = fileURLToPath(new URL("../", import.meta.url));

async function starten(t) {
  const ordner = mkdtempSync(join(tmpdir(), "miwale-jam-"));
  const server = http.createServer(jamBauen({ ordner, passwort: PASSWORT, spiele: ["last-ember", "keepers-light"] }));
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  t.after(() => { server.close(); rmSync(ordner, { recursive: true, force: true }); });
  const herkunft = "http://127.0.0.1:" + server.address().port;
  return async (pfad, { methode = "GET", koerper, auth, ip = "203.0.113.7", origin = herkunft } = {}) => {
    const res = await fetch(herkunft + "/api/jam/" + pfad, {
      method: methode,
      headers: { "content-type": "application/json", "x-forwarded-for": ip, origin, ...(auth ? { authorization: "Bearer " + auth } : {}) },
      body: koerper ? JSON.stringify(koerper) : undefined,
    });
    return { status: res.status, daten: await res.json() };
  };
}

test("the catalog is valid: unique ids, images exist, dates parse", () => {
  const k = JSON.parse(readFileSync(JAM_KATALOG, "utf8"));
  const ids = jamSpieleAusKatalog(JAM_KATALOG);
  assert.ok(ids.length > 0);
  assert.equal(new Set(ids).size, ids.length, "Spiel-ids muessen ueber alle Jams eindeutig sein");
  assert.equal(new Set(k.jams.map((j) => j.id)).size, k.jams.length, "Jam-ids muessen eindeutig sein");
  for (const jam of k.jams) {
    assert.match(jam.id, /^[a-z0-9-]+$/, jam.id);
    assert.ok(jam.name && jam.spiele.length, jam.id);
    for (const feld of ["start", "abgabe"]) if (jam[feld] != null) assert.ok(!isNaN(Date.parse(jam[feld])), jam.id + " " + feld);
    if (jam.start && jam.abgabe) assert.ok(Date.parse(jam.start) < Date.parse(jam.abgabe), jam.id);
    for (const s of jam.spiele) {
      assert.match(s.id, /^[a-z0-9-]+$/, s.id);
      assert.ok(s.beschreibung && s.beschreibung.en && s.beschreibung.de, s.id + " braucht en und de");
      // Spielen-Knopf: der Build muss da sein und relative Pfade nutzen (er liegt in einem Unterordner).
      if (s.spielen) {
        assert.equal(s.spielen, "/jam-spiele/" + s.id + "/", s.id);
        const html = join(WURZEL, "public", s.spielen.slice(1), "index.html");
        assert.ok(existsSync(html), "Build fehlt: " + s.spielen);
        assert.doesNotMatch(readFileSync(html, "utf8"), /(?:src|href)="\/(?!\/)/, s.id + ": absolute Pfade finden ihre Dateien im Unterordner nicht");
      }
    }
    for (const bild of [jam.bild, ...jam.spiele.map((s) => s.bild)]) {
      if (bild && bild.startsWith("/")) assert.ok(existsSync(join(WURZEL, bild.slice(1))), "Bild fehlt: " + bild);
    }
  }
});

test("one rating per device and game, changeable and removable", async (t) => {
  const rufen = await starten(t);
  let r = await rufen("last-ember", { methode: "PUT", koerper: { geraet: A, name: "Anna", sterne: 4, text: "Fun!" } });
  assert.equal(r.status, 200);
  assert.deepEqual([r.daten.spiel.anzahl, r.daten.spiel.schnitt], [1, 4]);
  r = await rufen("last-ember", { methode: "PUT", koerper: { geraet: B, name: "Ben", sterne: 1 } });
  assert.deepEqual([r.daten.spiel.anzahl, r.daten.spiel.schnitt], [2, 2.5]);
  assert.deepEqual(r.daten.spiel.verteilung, [1, 0, 0, 1, 0]);
  // erneut bewerten aendert die eigene, statt eine zweite anzulegen
  r = await rufen("last-ember", { methode: "PUT", koerper: { geraet: A, name: "Anna", sterne: 5, text: "Even better" } });
  assert.deepEqual([r.daten.spiel.anzahl, r.daten.spiel.schnitt], [2, 3]);
  const alle = await rufen("?geraet=" + A);
  assert.equal(alle.daten.eigene["last-ember"].text, "Even better");
  assert.equal(alle.daten.eigene["keepers-light"], undefined);
  assert.equal(alle.daten.spiele["keepers-light"].anzahl, 0);
  // Geraete-Kennungen und Adressen bleiben intern
  assert.ok(!JSON.stringify(alle.daten).includes(B));
  assert.equal(alle.daten.spiele["last-ember"].bewertungen[0].adresse, undefined);
  r = await rufen("last-ember", { methode: "DELETE", koerper: { geraet: A } });
  assert.deepEqual([r.daten.spiel.anzahl, r.daten.spiel.schnitt], [1, 1]);
});

test("bad input, unknown games, rude words and foreign pages are refused", async (t) => {
  const rufen = await starten(t);
  const gut = { geraet: A, name: "Anna", sterne: 3 };
  assert.equal((await rufen("erfunden", { methode: "PUT", koerper: gut })).status, 404);
  for (const [koerper, fehler] of [
    [{ ...gut, sterne: 0 }, "sterne"], [{ ...gut, sterne: 6 }, "sterne"], [{ ...gut, sterne: 2.5 }, "sterne"], [{ ...gut, sterne: "5" }, "sterne"],
    [{ ...gut, name: "" }, "name"], [{ ...gut, name: "x".repeat(31) }, "name"], [{ ...gut, name: "a\nb" }, "name"],
    [{ ...gut, text: "x".repeat(601) }, "text"], [{ ...gut, geraet: "kurz" }, "geraet"],
    [{ ...gut, text: "this is shit" }, "woerter"], [{ ...gut, website: "spam.example" }, "bot"],
  ]) {
    const r = await rufen("last-ember", { methode: "PUT", koerper });
    assert.equal(r.status, 400, JSON.stringify(koerper));
    assert.equal(r.daten.fehler, fehler);
  }
  assert.equal((await rufen("last-ember", { methode: "PUT", koerper: gut, origin: "https://boese.example" })).status, 403);
});

test("writes are rate limited per address", async (t) => {
  const rufen = await starten(t);
  let letzte;
  for (let i = 0; i < 21; i++) letzte = await rufen("last-ember", { methode: "PUT", koerper: { geraet: A, name: "Anna", sterne: 3 }, ip: "198.51.100.9" });
  assert.equal(letzte.status, 429);
  assert.equal((await rufen("last-ember", { methode: "PUT", koerper: { geraet: B, name: "Ben", sterne: 3 }, ip: "198.51.100.10" })).status, 200);
});

test("admin lists everything and deletes single ratings", async (t) => {
  const rufen = await starten(t);
  await rufen("keepers-light", { methode: "PUT", koerper: { geraet: A, name: "Anna", sterne: 2 } });
  assert.equal((await rufen("admin")).status, 401);
  assert.equal((await rufen("admin", { auth: "falsch" })).status, 401);
  const liste = await rufen("admin", { auth: PASSWORT });
  assert.equal(liste.daten.bewertungen.length, 1);
  assert.match(liste.daten.bewertungen[0].adresse, /^[0-9a-f]{12}$/);
  const id = liste.daten.bewertungen[0].id;
  assert.equal((await rufen("admin/" + id, { methode: "DELETE", auth: PASSWORT })).status, 200);
  assert.equal((await rufen("admin/" + id, { methode: "DELETE", auth: PASSWORT })).status, 404);
  assert.equal((await rufen("")).daten.spiele["keepers-light"].anzahl, 0);
});
