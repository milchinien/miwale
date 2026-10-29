import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { minecraftBauen, schluesselAus, schluesselHashesLesen } from "../server/minecraft.mjs";

const PASSWORT = "geheim-fuer-tests";
const SCHLUESSEL = schluesselAus(PASSWORT);
// Kleinstes gueltiges PNG (1x1, transparent) und ein Stueck WOFF-Kopf.
const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const WOFF = Buffer.concat([Buffer.from("wOFF"), Buffer.alloc(60)]).toString("base64");

async function starten(t, optionen = {}) {
  const ordner = mkdtempSync(join(tmpdir(), "miwale-minecraft-"));
  const bauen = () => minecraftBauen({ ordner, passwort: PASSWORT, ...optionen });
  let server = http.createServer(bauen());
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  t.after(() => { server.close(); rmSync(ordner, { recursive: true, force: true }); });
  const basis = () => "http://127.0.0.1:" + server.address().port;
  const anfrage = async (pfad, { methode = "GET", koerper, auth, ip = "203.0.113.7" } = {}) => {
    const res = await fetch(basis() + "/api/minecraft/" + pfad, {
      method: methode,
      headers: { "content-type": "application/json", "x-forwarded-for": ip, ...(auth ? { authorization: "Bearer " + auth } : {}) },
      body: koerper === undefined ? undefined : typeof koerper === "string" ? koerper : JSON.stringify(koerper),
    });
    const typ = res.headers.get("content-type") || "";
    return { status: res.status, kopf: res.headers, daten: typ.includes("json") ? await res.json() : Buffer.from(await res.arrayBuffer()) };
  };
  // Dienst neu starten (liest den Stand aus dem Datenordner)
  anfrage.neustarten = async () => {
    await new Promise((r) => server.close(r));
    server = http.createServer(bauen());
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
  };
  return anfrage;
}

const STAND = {
  version: 1,
  server: { name: "Unser Server", version: "26.3", online: true, maxSpieler: 10, spielerOnline: ["Steve", "<b>boese</b>"] },
  spieler: [
    { name: "Steve", playSec: 3600, mined: 120, mobKills: 7, deaths: 1, distanceKm: 2.5, topMined: [{ id: "stone", count: 100 }, { id: "../../etc", count: 1 }] },
    { name: "Alex", mined: 300, mobKills: "viel", geheim: "x" },
    { name: "kein gueltiger name!", mined: 1 }
  ],
  welt: { totals: { mined: 420, players: 2 }, topMined: [{ id: "stone", count: 400 }], topKilled: [{ id: "zombie", count: 7 }] },
  namen: { "block.minecraft.stone": "Stein", "<script>": "x" },
  texturen: { stone: PNG, kaputt: Buffer.from("kein png").toString("base64"), "../x": PNG },
  schrift: WOFF
};

test("empty before the first upload", async (t) => {
  const a = await starten(t);
  const r = await a("");
  assert.equal(r.status, 200);
  assert.deepEqual(r.daten, { leer: true });
  assert.equal((await a("textur/stone.png")).status, 404);
  assert.equal((await a("schrift.woff")).status, 404);
});

test("upload needs the key; wrong keys get locked out", async (t) => {
  const a = await starten(t);
  assert.equal((await a("", { methode: "PUT", koerper: STAND })).status, 401);
  assert.equal((await a("", { methode: "PUT", koerper: STAND, auth: PASSWORT })).status, 401, "das Passwort selbst ist nicht der Schluessel");
  for (let i = 0; i < 10; i++) await a("", { methode: "PUT", koerper: STAND, auth: "falsch", ip: "198.51.100.9" });
  assert.equal((await a("", { methode: "PUT", koerper: STAND, auth: SCHLUESSEL, ip: "198.51.100.9" })).status, 429);
  assert.equal((await a("", { methode: "PUT", koerper: STAND, auth: SCHLUESSEL })).status, 200);
});

test("connecting with the admin password returns the key", async (t) => {
  const a = await starten(t);
  assert.equal((await a("verbinden", { methode: "POST" })).status, 401);
  assert.equal((await a("verbinden", { methode: "POST", auth: "falsch" })).status, 401);
  const r = await a("verbinden", { methode: "POST", auth: PASSWORT });
  assert.equal(r.status, 200);
  assert.equal(r.daten.schluessel, SCHLUESSEL);
});

test("without password and MINECRAFT_TOKEN uploads are off", async (t) => {
  const a = await starten(t, { passwort: "", schluesselHashes: [] });
  assert.equal((await a("", { methode: "PUT", koerper: STAND, auth: "egal" })).status, 503);
  assert.equal((await a("verbinden", { methode: "POST", auth: "egal" })).status, 503);
});

test("a fixed MINECRAFT_TOKEN replaces the derived key", async (t) => {
  const a = await starten(t, { schluessel: "fester-schluessel-123" });
  assert.equal((await a("", { methode: "PUT", koerper: STAND, auth: SCHLUESSEL })).status, 401);
  assert.equal((await a("", { methode: "PUT", koerper: STAND, auth: "fester-schluessel-123" })).status, 200);
});

test("keeps only what the page shows and serves textures and font", async (t) => {
  const a = await starten(t);
  const hoch = await a("", { methode: "PUT", koerper: STAND, auth: SCHLUESSEL });
  assert.equal(hoch.status, 200);
  assert.equal(hoch.daten.texturen, 1);

  const { daten } = await a("");
  assert.deepEqual(daten.server.spielerOnline, ["Steve"]);
  assert.deepEqual(daten.spieler.map((p) => p.name), ["Steve", "Alex"]);
  assert.equal(daten.spieler[1].mobKills, 0, "keine Zahl wird 0");
  assert.equal(daten.spieler[1].geheim, undefined, "unbekannte Felder fallen weg");
  assert.deepEqual(daten.spieler[0].topMined, [{ id: "stone", count: 100 }]);
  assert.deepEqual(daten.namen, { "block.minecraft.stone": "Stein" });
  assert.deepEqual(Object.keys(daten.texturen), ["stone"]);
  assert.equal(daten.welt.totals.mined, 420);
  assert.ok(daten.schrift);
  assert.ok(!isNaN(Date.parse(daten.zeit)));

  const bild = await a("textur/stone.png?v=" + daten.texturen.stone);
  assert.equal(bild.status, 200);
  assert.equal(bild.kopf.get("content-type"), "image/png");
  assert.match(bild.kopf.get("cache-control"), /immutable/);
  assert.equal(bild.daten.toString("base64"), PNG);
  const schrift = await a("schrift.woff");
  assert.equal(schrift.kopf.get("content-type"), "font/woff");
  assert.equal(schrift.daten.subarray(0, 4).toString(), "wOFF");
  assert.equal((await a("textur/kaputt.png")).status, 404);
  assert.equal((await a("textur/..%2Fx.png")).status, 404);
});

test("textures are kept when the panel sends only numbers; state survives a restart", async (t) => {
  const a = await starten(t);
  await a("", { methode: "PUT", koerper: STAND, auth: SCHLUESSEL });
  const nurZahlen = { ...STAND, texturen: {}, schrift: null, texturenBehalten: true, spieler: [{ name: "Steve", mined: 999 }] };
  assert.equal((await a("", { methode: "PUT", koerper: nurZahlen, auth: SCHLUESSEL })).status, 200);
  await a.neustarten();
  const { daten } = await a("");
  assert.equal(daten.spieler[0].mined, 999);
  assert.deepEqual(Object.keys(daten.texturen), ["stone"]);
  assert.ok(daten.schrift);
  assert.equal((await a("textur/stone.png")).status, 200);
});

test("rejects broken uploads", async (t) => {
  const a = await starten(t);
  assert.equal((await a("", { methode: "PUT", koerper: "{kein json", auth: SCHLUESSEL })).status, 400);
  assert.equal((await a("", { methode: "PUT", koerper: { version: 2, spieler: [] }, auth: SCHLUESSEL })).status, 400);
  assert.equal((await a("", { methode: "PUT", koerper: { version: 1 }, auth: SCHLUESSEL })).status, 400);
  const riesig = { ...STAND, namen: { x: "a".repeat(1.2 * 1024 * 1024) } };
  assert.equal((await a("", { methode: "PUT", koerper: riesig, auth: SCHLUESSEL })).status, 413);
  assert.deepEqual((await a("")).daten, { leer: true });
});

test("a key whose SHA-256 is listed works without any password", async (t) => {
  const key = "mcp_" + "ab".repeat(32);
  const hash = createHash("sha256").update(key).digest("hex");
  const a = await starten(t, { passwort: "", schluesselHashes: [hash] });
  assert.equal((await a("", { methode: "PUT", koerper: STAND, auth: "mcp_falsch" })).status, 401);
  assert.equal((await a("", { methode: "PUT", koerper: STAND, auth: hash })).status, 401, "die Pruefsumme selbst ist kein Schluessel");
  assert.equal((await a("", { methode: "PUT", koerper: STAND, auth: key })).status, 200);
  assert.equal((await a("verbinden", { methode: "POST", auth: "egal" })).status, 503);
});

test("the listed key hashes are valid", () => {
  const hashes = schluesselHashesLesen();
  assert.ok(hashes.length >= 1);
  for (const h of hashes) assert.match(h, /^[0-9a-f]{64}$/);
});
