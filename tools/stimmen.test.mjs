import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { stimmenBauen, stylesAusKatalog, STYLE_KATALOG, wilson } from "../server/stimmen.mjs";

const A = "aaaaaaaa-1111-2222-3333-444444444444";
const B = "bbbbbbbb-1111-2222-3333-444444444444";
const PASSWORT = "geheim-fuer-tests";
const KATALOG = { ids: ["neon", "cartoon", "clay"], elemente: ["world", "characters", "props", "effects", "atmosphere", "ui"] };
const MIX = { world: "neon", characters: "cartoon", props: "clay", effects: "neon", atmosphere: "neon", ui: "cartoon" };

async function starten(t) {
  const ordner = mkdtempSync(join(tmpdir(), "miwale-stimmen-"));
  const server = http.createServer(stimmenBauen({ ordner, passwort: PASSWORT, katalog: KATALOG }));
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  t.after(() => { server.close(); rmSync(ordner, { recursive: true, force: true }); });
  const herkunft = "http://127.0.0.1:" + server.address().port;
  return async (pfad, { methode = "GET", koerper, auth, ip = "203.0.113.7", origin = herkunft } = {}) => {
    const res = await fetch(herkunft + "/api/stimmen/" + pfad, {
      method: methode,
      headers: { "content-type": "application/json", "x-forwarded-for": ip, origin, ...(auth ? { authorization: "Bearer " + auth } : {}) },
      body: koerper ? JSON.stringify(koerper) : undefined,
    });
    return { status: res.status, daten: await res.json() };
  };
}

test("the catalog of the page lists the styles and elements", () => {
  const k = stylesAusKatalog(STYLE_KATALOG);
  assert.ok(k.ids.includes("neon"));
  assert.deepEqual(k.elemente, ["world", "characters", "props", "effects", "atmosphere", "ui"]);
});

test("wilson orders by confidence, not by raw share", () => {
  assert.equal(wilson(0, 0), 0);
  assert.ok(wilson(90, 10) > wilson(3, 0));
  assert.ok(wilson(10, 0) > wilson(10, 10));
});

test("one vote per device and target, changeable and removable", async (t) => {
  const rufen = await starten(t);
  assert.equal((await rufen("style:neon", { methode: "PUT", koerper: { geraet: A, wert: 1 } })).daten.hoch, 1);
  assert.equal((await rufen("style:neon", { methode: "PUT", koerper: { geraet: A, wert: 1 } })).daten.hoch, 1);
  const r = await rufen("style:neon", { methode: "PUT", koerper: { geraet: B, wert: -1 } });
  assert.deepEqual([r.daten.hoch, r.daten.runter], [1, 1]);
  assert.equal((await rufen("style:neon", { methode: "PUT", koerper: { geraet: A, wert: -1 } })).daten.runter, 2);
  assert.equal((await rufen("style:neon", { methode: "PUT", koerper: { geraet: A, wert: 0 } })).daten.runter, 1);
  await rufen("el:cartoon:characters", { methode: "PUT", koerper: { geraet: A, wert: 1 } });
  const alle = await rufen("?geraet=" + B);
  assert.deepEqual(alle.daten.ziele["style:neon"], { hoch: 0, runter: 1 });
  assert.deepEqual(alle.daten.ziele["el:cartoon:characters"], { hoch: 1, runter: 0 });
  assert.equal(alle.daten.eigene["style:neon"], -1);
  assert.equal(alle.daten.eigene["el:cartoon:characters"], undefined);
});

test("unknown targets and bad input are refused", async (t) => {
  const rufen = await starten(t);
  assert.equal((await rufen("style:erfunden", { methode: "PUT", koerper: { geraet: A, wert: 1 } })).status, 404);
  assert.equal((await rufen("el:neon:sound", { methode: "PUT", koerper: { geraet: A, wert: 1 } })).status, 404);
  assert.equal((await rufen("mix:nichtda", { methode: "PUT", koerper: { geraet: A, wert: 1 } })).status, 404);
  assert.equal((await rufen("style:neon", { methode: "PUT", koerper: { geraet: A, wert: 5 } })).status, 400);
  assert.equal((await rufen("style:neon", { methode: "PUT", koerper: { geraet: "kurz", wert: 1 } })).status, 400);
  assert.equal((await rufen("style:neon", { methode: "PUT", koerper: { geraet: A, wert: 1 }, origin: "https://boese.example" })).status, 403);
});

test("publishing a mix: validated, filtered, deduplicated, ranked", async (t) => {
  const rufen = await starten(t);
  const neu = await rufen("mixe", { methode: "POST", koerper: { geraet: A, name: "Neon toys", picks: MIX } });
  assert.equal(neu.status, 201);
  assert.equal(neu.daten.mix.hoch, 1, "the publisher's own vote counts");
  const nochmal = await rufen("mixe", { methode: "POST", koerper: { geraet: B, name: "Other name", picks: MIX } });
  assert.equal(nochmal.daten.vorhanden, true);
  assert.equal(nochmal.daten.mix.id, neu.daten.mix.id);
  assert.equal((await rufen("mixe", { methode: "POST", koerper: { geraet: A, name: "x", picks: { ...MIX, ui: "erfunden" } } })).status, 400);
  assert.equal((await rufen("mixe", { methode: "POST", koerper: { geraet: A, name: "", picks: { ...MIX, ui: "clay" } } })).status, 400);
  assert.equal((await rufen("mixe", { methode: "POST", koerper: { geraet: A, name: "shit happens", picks: { ...MIX, ui: "clay" } } })).daten.fehler, "woerter");
  assert.equal((await rufen("mixe", { methode: "POST", koerper: { geraet: A, name: "Bot", picks: { ...MIX, ui: "clay" }, website: "x" } })).status, 400);
  const single = Object.fromEntries(Object.keys(MIX).map((k) => [k, "neon"]));
  assert.equal((await rufen("mixe", { methode: "POST", koerper: { geraet: A, name: "Only neon", picks: single } })).daten.fehler, "kein-mix");

  const zwei = await rufen("mixe", { methode: "POST", koerper: { geraet: B, name: "Clay world", picks: { ...MIX, world: "clay" } } });
  await rufen("mix:" + zwei.daten.mix.id, { methode: "PUT", koerper: { geraet: A, wert: 1 } });
  await rufen("mix:" + neu.daten.mix.id, { methode: "PUT", koerper: { geraet: B, wert: -1 } });
  const liste = (await rufen("")).daten.mixe;
  assert.deepEqual(liste.map((m) => m.name), ["Clay world", "Neon toys"]);
});

test("admin can list and delete mixes, nobody else", async (t) => {
  const rufen = await starten(t);
  const neu = (await rufen("mixe", { methode: "POST", koerper: { geraet: A, name: "Delete me", picks: MIX } })).daten.mix;
  assert.equal((await rufen("admin/mixe")).status, 401);
  assert.equal((await rufen("admin/mixe", { auth: PASSWORT })).daten.mixe.length, 1);
  assert.equal((await rufen("admin/mixe/" + neu.id, { methode: "DELETE", auth: PASSWORT })).status, 200);
  assert.equal((await rufen("")).daten.mixe.length, 0);
});
