// Profile: Spielzeit, Perlen, Erfolge, Shop und Sichtbarkeit (server/profil.mjs).
// Der Kontendienst ist hier ein kleiner Ersatz: wer angemeldet ist, steht im Kopf X-Test-Konto.
import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { profilBauen, katalogLaden, neuesProfil, PRUEFER } from "../server/profil.mjs";

const PASSWORT = "geheim-fuer-tests";
const KONTEN = {
  a: { id: "konto-a", name: "Alice", gesperrt: false },
  b: { id: "konto-b", name: "Bob_2", gesperrt: false }
};
const kontenErsatz = {
  aktiv: () => true,
  wer: (req) => {
    const k = KONTEN[String(req.headers["x-test-konto"] || "")];
    return k ? { ...k } : null;
  },
  nameVon: (id) => Object.values(KONTEN).find((k) => k.id === id)?.name || null,
  idVon: (name) => Object.values(KONTEN).find((k) => k.name.toLowerCase() === String(name).toLowerCase())?.id || null
};
const { profil: KATALOG, spiele: SPIELE } = katalogLaden();
const R = KATALOG.regeln;
const SPIEL = SPIELE[0].id;
const ANDERES = SPIELE[1].id;
const START = Date.UTC(2026, 9, 26, 12, 0, 0);

async function starten(t, zusatz = {}) {
  const ordner = zusatz.ordner || mkdtempSync(join(tmpdir(), "miwale-profil-"));
  const uhr = { t: START };
  const dienst = profilBauen({ ordner, passwort: PASSWORT, konten: kontenErsatz, jetzt: () => uhr.t, verzoegerungMs: 100000, ...zusatz });
  const server = http.createServer(dienst);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  t.after(() => { server.close(); dienst.flush(); if (!zusatz.ordner) rmSync(ordner, { recursive: true, force: true }); });
  const herkunft = "http://127.0.0.1:" + server.address().port;
  const rufen = async (pfad, { methode = "GET", koerper, wer = "a", auth, ip = "203.0.113.7", origin = herkunft } = {}) => {
    const res = await fetch(herkunft + "/api/profil/" + pfad, {
      method: methode,
      headers: { "content-type": "application/json", "x-forwarded-for": ip, origin, ...(wer ? { "x-test-konto": wer } : {}), ...(auth ? { authorization: "Bearer " + auth } : {}) },
      body: koerper && methode !== "GET" ? JSON.stringify(koerper) : undefined
    });
    return { status: res.status, daten: await res.json() };
  };
  // Herzschlaege im Abstand von 30 Sekunden, n Stueck.
  const spielen = async (spiel, n, wer = "a") => {
    let r;
    for (let i = 0; i < n; i++) { uhr.t += 30000; r = await rufen("spielzeit", { methode: "POST", koerper: { spiel }, wer }); }
    return r;
  };
  return { rufen, uhr, spielen, dienst, ordner };
}

test("catalog is consistent: ids, slots, defaults, symbols, locked items, checks", () => {
  const ids = new Set();
  for (const i of KATALOG.items) {
    assert.ok(!ids.has(i.id), "doppelte id " + i.id);
    ids.add(i.id);
    assert.ok(["avatar", "rahmen", "banner", "name", "titel", "akzent"].includes(i.slot), i.id);
    assert.ok(i.name.en && i.name.de, i.id + " braucht en und de");
    assert.ok(Number.isInteger(i.preis ?? 0) && (i.preis ?? 0) >= 0, i.id);
    if (!i.standard && !i.erfolg) assert.ok(i.preis > 0, i.id + " braucht einen Preis");
    if (i.symbol) assert.ok(KATALOG.symbole.includes(i.symbol), i.id + " Symbol " + i.symbol);
    if (i.spiel) assert.ok(SPIELE.some((s) => s.id === i.spiel), i.id);
  }
  const erfolge = new Map(KATALOG.erfolge.map((e) => [e.id, e]));
  assert.equal(erfolge.size, KATALOG.erfolge.length, "doppelte Erfolgs-ids");
  for (const i of KATALOG.items) if (i.erfolg) assert.ok(erfolge.has(i.erfolg), `${i.id}: Erfolg ${i.erfolg} gibt es nicht`);
  for (const slot of ["avatar", "rahmen", "banner", "name", "titel", "akzent"]) {
    assert.ok(KATALOG.items.some((i) => i.slot === slot && i.standard), "kein Standard fuer " + slot);
  }
  for (const e of KATALOG.erfolge) {
    assert.ok(e.name.en && e.name.de && e.text.en && e.text.de, e.id);
    assert.ok(KATALOG.stufen.includes(e.stufe), e.id);
    assert.ok(KATALOG.symbole.includes(e.symbol), e.id);
    assert.ok(e.perlen > 0, e.id);
    if (e.art === "plattform") assert.equal(typeof PRUEFER[e.id], "function", e.id + " hat keine Bedingung in PRUEFER");
  }
  for (const id of Object.keys(PRUEFER)) assert.ok(erfolge.has(id), "Bedingung ohne Erfolg: " + id);
  assert.ok(KATALOG.levelAb(2) > KATALOG.levelAb(1) && KATALOG.levelVon(0) === 1 && KATALOG.levelVon(KATALOG.levelAb(7)) === 7);
  // Fuer jedes Spiel gibt es Avatar, Banner und drei Spielzeit-Erfolge.
  for (const s of SPIELE) {
    assert.ok(ids.has("av-spiel-" + s.id) && ids.has("bn-spiel-" + s.id), s.id);
    for (const k of ["10m", "1h", "10h"]) assert.ok(erfolge.has(`spiel:${s.id}:${k}`), s.id + k);
  }
});

test("everything needs an account; the profile appears on first use with a welcome achievement", async (t) => {
  const { rufen } = await starten(t);
  for (const [pfad, methode] of [["ich", "GET"], ["spielzeit", "POST"], ["besuch", "POST"], ["kaufen", "POST"], ["ausruesten", "POST"], ["einstellungen", "POST"], ["erfolg", "POST"]]) {
    assert.equal((await rufen(pfad, { methode, wer: null, koerper: {} })).status, 401, pfad);
  }
  const ich = await rufen("ich");
  assert.equal(ich.status, 200);
  const p = ich.daten.profil;
  assert.equal(p.name, "Alice");
  assert.ok(p.erfolge.willkommen);
  assert.equal(p.perlen, 5 + 0);
  assert.equal(p.level, 1);
  assert.deepEqual(p.ausruestung, { avatar: "av-wal", rahmen: "rf-keiner", banner: "bn-tiefsee", name: "nm-standard", titel: "ti-neuling", akzent: "ak-aqua" });
});

test("playtime counts real elapsed time between heartbeats, never more", async (t) => {
  const { rufen, uhr, spielen } = await starten(t);
  // Der erste Herzschlag startet nur, er zaehlt nichts.
  let r = await rufen("spielzeit", { methode: "POST", koerper: { spiel: SPIEL } });
  assert.equal(r.daten.sek, 0);
  r = await spielen(SPIEL, 1);
  assert.equal(r.daten.sek, 30);
  // Zu dicht hintereinander (zweiter Tab oder Skript): ignoriert.
  uhr.t += 5000;
  r = await rufen("spielzeit", { methode: "POST", koerper: { spiel: SPIEL } });
  assert.equal(r.daten.sek, 30);
  // Lange Pause (Tab im Hintergrund, Rechner schlief): die Pause zaehlt nicht mit.
  uhr.t += 10 * 60 * 1000;
  r = await rufen("spielzeit", { methode: "POST", koerper: { spiel: SPIEL } });
  assert.equal(r.daten.sek, 30);
  r = await spielen(SPIEL, 1);
  assert.equal(r.daten.sek, 60);
  // Unbekanntes Spiel und kaputte Eingabe.
  assert.equal((await rufen("spielzeit", { methode: "POST", koerper: { spiel: "gibt-es-nicht" } })).status, 404);
  assert.equal((await rufen("spielzeit", { methode: "POST", koerper: { spiel: 5 } })).status, 404);
});

test("two heartbeat streams do not count double", async (t) => {
  const { rufen, uhr } = await starten(t);
  await rufen("spielzeit", { methode: "POST", koerper: { spiel: SPIEL } });
  for (let i = 0; i < 10; i++) {
    uhr.t += 15000; // Tab A und Tab B im Wechsel, je 15 s auseinander
    await rufen("spielzeit", { methode: "POST", koerper: { spiel: SPIEL } });
  }
  const p = (await rufen("ich")).daten.profil;
  // 150 Sekunden echte Zeit: es zaehlt nie mehr als das.
  assert.ok(p.spiele[SPIEL].sek <= 150, "gezaehlt: " + p.spiele[SPIEL].sek);
});

test("pearls: one per five minutes, level up, achievements and their rewards", async (t) => {
  const { rufen, spielen } = await starten(t);
  const vorher = (await rufen("ich")).daten.profil.perlen;
  await rufen("spielzeit", { methode: "POST", koerper: { spiel: SPIEL } });
  const r = await spielen(SPIEL, 20); // 10 Minuten
  assert.equal(r.daten.sek, 600);
  const p = (await rufen("ich")).daten.profil;
  // 2 Perlen Spielzeit + 5 fuer "Erster Tauchgang" + 3 fuer "Erste Schritte" im Spiel.
  // Die Erfahrung reicht dabei fuer Level 2: dessen Belohnung kommt dazu.
  assert.equal(p.level, 2);
  assert.equal(p.perlen - vorher, 2 + 5 + 3 + R.levelPerlen * 2);
  assert.ok(p.erfolge["erste-minuten"] && p.erfolge[`spiel:${SPIEL}:10m`]);
  // 10 Minuten Spielzeit und drei Erfolge (Willkommen, Erster Tauchgang, Erste Schritte).
  assert.equal(p.ep, 10 + 3 * R.ep.erfolg);
});

test("heartbeat answers announce newly unlocked achievements", async (t) => {
  const { rufen, spielen } = await starten(t);
  await rufen("spielzeit", { methode: "POST", koerper: { spiel: SPIEL } });
  const r = await spielen(SPIEL, 20);
  assert.ok(r.daten.neu && r.daten.neu.erfolge.includes("erste-minuten"));
  const danach = await spielen(SPIEL, 1);
  assert.equal(danach.daten.neu, undefined);
});

test("daily limits: no pearls beyond the cap, no banking, playtime capped per day", async (t) => {
  // Kleinere Grenzen, damit der Test kurz bleibt: 1 Stunde und 4 Perlen am Tag.
  const klein = { profil: { ...KATALOG, regeln: { ...R, tagesSekundenMax: 3600, tagesPerlenSpielzeit: 4 } }, spiele: SPIELE };
  const { rufen, uhr, dienst } = await starten(t, { katalog: klein });
  await rufen("spielzeit", { methode: "POST", koerper: { spiel: SPIEL } });
  // Zwei Stunden Herzschlaege (simulierte Uhr, darum greift die Tempogrenze nicht).
  for (let i = 0; i < 240; i++) {
    uhr.t += 30000;
    const r = await rufen("spielzeit", { methode: "POST", koerper: { spiel: SPIEL } });
    assert.equal(r.status, 200);
  }
  let p = (await rufen("ich")).daten.profil;
  assert.equal(p.heute.sek, 3600, "mehr als die Tagesgrenze zaehlt nicht");
  assert.equal(p.heute.perlen, 4);
  assert.equal(p.spiele[SPIEL].sek, 3600);
  assert.ok(dienst.kontoDaten("konto-a").perlenRest < R.perleProSekunden, "nichts wird angespart");
  // Naechster Tag (UTC): die Grenze gilt neu.
  uhr.t = Date.UTC(2026, 9, 27, 12, 0, 0);
  await rufen("spielzeit", { methode: "POST", koerper: { spiel: SPIEL } });
  uhr.t += 30000;
  await rufen("spielzeit", { methode: "POST", koerper: { spiel: SPIEL } });
  p = (await rufen("ich")).daten.profil;
  assert.equal(p.heute.sek, 30);
  assert.equal(p.spiele[SPIEL].sek, 3630);
});

test("daily visit: pearls, streak bonus, streak resets after a missed day", async (t) => {
  const { rufen, uhr } = await starten(t);
  const tag = 24 * 3600 * 1000;
  let r = await rufen("besuch", { methode: "POST" });
  assert.equal(r.daten.perlenErhalten, R.besuchPerlen);
  assert.equal(r.daten.serie.laenge, 1);
  // Am selben Tag nichts mehr.
  r = await rufen("besuch", { methode: "POST" });
  assert.equal(r.daten.schonHeute, true);
  assert.equal(r.daten.perlenErhalten, 0);
  uhr.t += tag;
  r = await rufen("besuch", { methode: "POST" });
  assert.equal(r.daten.serie.laenge, 2);
  assert.equal(r.daten.perlenErhalten, R.besuchPerlen + 1);
  uhr.t += tag;
  r = await rufen("besuch", { methode: "POST" });
  assert.equal(r.daten.serie.laenge, 3);
  assert.ok(r.daten.neu.erfolge.includes("serie-3"));
  // Einen Tag auslassen: die Serie beginnt neu, die beste bleibt.
  uhr.t += 2 * tag;
  r = await rufen("besuch", { methode: "POST" });
  assert.equal(r.daten.serie.laenge, 1);
  assert.equal(r.daten.serie.beste, 3);
});

test("reviews and game requests pay pearls once, with limits", async (t) => {
  const { rufen, dienst } = await starten(t);
  await rufen("ich");
  const vorher = (await rufen("ich")).daten.profil.perlen;
  dienst.ereignis("konto-a", "bewertung", SPIEL);
  dienst.ereignis("konto-a", "bewertung", SPIEL); // dieselbe Bewertung erneut: nichts
  dienst.ereignis("konto-a", "bewertung", ANDERES);
  let p = (await rufen("ich")).daten.profil;
  // Zwei Bewertungen, der Erfolg dazu, und die Erfahrung dafuer reicht fuer Level 2.
  assert.equal(p.level, 2);
  assert.equal(p.perlen - vorher, 2 * R.bewertungPerlen + KATALOG.erfolge.find((e) => e.id === "erste-bewertung").perlen + R.levelPerlen * 2);
  assert.ok(p.erfolge["erste-bewertung"]);
  for (let i = 0; i < 5; i++) dienst.ereignis("konto-a", "idee", "idee-" + i);
  p = (await rufen("ich")).daten.profil;
  assert.ok(p.erfolge.ideengeber);
  const ideenPerlen = p.verlauf.filter((v) => v.grund === "idee").length;
  assert.equal(ideenPerlen, R.ideenProTag);
  // Fremde und kaputte Ereignisse schaden nicht.
  dienst.ereignis(null, "bewertung", SPIEL);
  dienst.ereignis("konto-a", "unsinn", SPIEL);
});

test("shop: buying checks pearls, ownership, requirements; equipping needs ownership", async (t) => {
  const { rufen, dienst, spielen } = await starten(t);
  await rufen("ich");
  assert.equal((await rufen("kaufen", { methode: "POST", koerper: { item: "gibt-es-nicht" } })).status, 404);
  assert.equal((await rufen("kaufen", { methode: "POST", koerper: { item: "av-welle" } })).status, 402, "zu wenig Perlen");
  // Standard und Erfolgs-Gegenstaende sind nicht kaeuflich.
  assert.equal((await rufen("kaufen", { methode: "POST", koerper: { item: "av-wal" } })).status, 409);
  assert.equal((await rufen("kaufen", { methode: "POST", koerper: { item: "av-pokal" } })).status, 409);
  // Perlen schenken (Verwaltung) und kaufen.
  assert.equal((await rufen("admin/profile/konto-a", { methode: "PUT", wer: null, auth: PASSWORT, koerper: { perlen: 200 } })).status, 200);
  let k = await rufen("kaufen", { methode: "POST", koerper: { item: "av-welle" } });
  assert.equal(k.status, 200);
  assert.ok(k.daten.inventar.includes("av-welle"));
  assert.equal((await rufen("kaufen", { methode: "POST", koerper: { item: "av-welle" } })).status, 409, "schon besessen");
  // Gekauft zaehlt als "Erster Einkauf".
  assert.ok((await rufen("ich")).daten.profil.erfolge["erster-kauf"]);
  // Spiel-Avatar braucht Spielzeit im Spiel.
  assert.equal((await rufen("kaufen", { methode: "POST", koerper: { item: "av-spiel-" + SPIEL } })).status, 409, "Voraussetzung");
  await rufen("spielzeit", { methode: "POST", koerper: { spiel: SPIEL } });
  await spielen(SPIEL, 20);
  k = await rufen("kaufen", { methode: "POST", koerper: { item: "av-spiel-" + SPIEL } });
  assert.equal(k.status, 200);
  // Ausruesten: nur Besessenes, nur im passenden Platz.
  assert.equal((await rufen("ausruesten", { methode: "POST", koerper: { slot: "avatar", item: "av-krone" } })).status, 403);
  assert.equal((await rufen("ausruesten", { methode: "POST", koerper: { slot: "rahmen", item: "av-welle" } })).status, 404);
  const a = await rufen("ausruesten", { methode: "POST", koerper: { slot: "avatar", item: "av-welle" } });
  assert.equal(a.status, 200);
  assert.equal(a.daten.ausruestung.avatar, "av-welle");
  // Zurueck zum Standard geht immer.
  assert.equal((await rufen("ausruesten", { methode: "POST", koerper: { slot: "avatar", item: "av-wal" } })).daten.ausruestung.avatar, "av-wal");
  void dienst;
});

test("an achievement unlocks its item; collector and dressed-up achievements work", async (t) => {
  const { rufen } = await starten(t);
  await rufen("ich");
  await rufen("admin/profile/konto-a", { methode: "PUT", wer: null, auth: PASSWORT, koerper: { perlen: 5000 } });
  // Rahmen und Banner kaufen, alles ausruesten: "Ausgestattet".
  for (const item of ["av-welle", "rf-aqua", "bn-riff"]) assert.equal((await rufen("kaufen", { methode: "POST", koerper: { item } })).status, 200);
  for (const [slot, item] of [["avatar", "av-welle"], ["rahmen", "rf-aqua"], ["banner", "bn-riff"]]) {
    await rufen("ausruesten", { methode: "POST", koerper: { slot, item } });
  }
  let p = (await rufen("ich")).daten.profil;
  assert.ok(p.erfolge.ausgestattet);
  // Zehn Gegenstaende: "Sammler", und der Perlenglanz-Rahmen gehoert dazu.
  assert.equal((await rufen("ausruesten", { methode: "POST", koerper: { slot: "rahmen", item: "rf-perle" } })).status, 403);
  for (const item of ["av-blase", "av-fisch", "av-qualle", "av-anker", "av-muschel", "av-seestern", "av-mond"]) {
    assert.equal((await rufen("kaufen", { methode: "POST", koerper: { item } })).status, 200, item);
  }
  p = (await rufen("ich")).daten.profil;
  assert.ok(p.erfolge["sammler-10"]);
  assert.equal((await rufen("ausruesten", { methode: "POST", koerper: { slot: "rahmen", item: "rf-perle" } })).status, 200);
});

test("showcase takes only earned achievements, at most three", async (t) => {
  const { rufen } = await starten(t);
  await rufen("ich");
  const post = (koerper) => rufen("einstellungen", { methode: "POST", koerper });
  assert.equal((await post({ vitrine: ["willkommen"] })).status, 200);
  assert.equal((await post({ vitrine: ["serie-30"] })).status, 400, "nicht verdient");
  assert.equal((await post({ vitrine: ["willkommen", "willkommen"] })).status, 400, "doppelt");
  assert.equal((await post({ vitrine: [1, 2, 3, 4] })).status, 400, "zu viele");
  assert.equal((await post({ sichtbar: "ja" })).status, 400);
});

test("public profile: playtime and pearls stay private unless shared; hidden profiles are hidden", async (t) => {
  const { rufen, spielen } = await starten(t);
  await rufen("ich");
  await rufen("spielzeit", { methode: "POST", koerper: { spiel: SPIEL } });
  await spielen(SPIEL, 4);
  await rufen("einstellungen", { methode: "POST", koerper: { vitrine: ["willkommen"] } });
  let r = await rufen("u/alice", { wer: "b" }); // ohne Beachtung der Gross-/Kleinschreibung
  assert.equal(r.status, 200);
  assert.equal(r.daten.profil.name, "Alice");
  assert.equal(r.daten.profil.spielzeit, null, "Spielzeit ist privat");
  assert.deepEqual(r.daten.profil.vitrine, ["willkommen"]);
  assert.ok(!("perlen" in r.daten.profil) && !("verlauf" in r.daten.profil) && !("inventar" in r.daten.profil));
  // Freigeben.
  await rufen("einstellungen", { methode: "POST", koerper: { spielzeitZeigen: true } });
  r = await rufen("u/Alice", { wer: null });
  assert.equal(r.daten.profil.spielzeit.gesamt, 120);
  assert.equal(r.daten.profil.spielzeit.spiele[0].id, SPIEL);
  // Verstecken: andere und Gaeste sehen nichts, der Besitzer schon.
  await rufen("einstellungen", { methode: "POST", koerper: { sichtbar: false } });
  assert.equal((await rufen("u/Alice", { wer: "b" })).status, 404);
  assert.equal((await rufen("u/Alice", { wer: null })).status, 404);
  r = await rufen("u/Alice", { wer: "a" });
  assert.equal(r.status, 200);
  assert.equal(r.daten.profil.versteckt, true);
  // Unbekannt.
  assert.equal((await rufen("u/Niemand", { wer: null })).status, 404);
});

test("achievements reported by a game: only known ones, only after playing there", async (t) => {
  const eigenerKatalog = {
    profil: { ...KATALOG, erfolge: [...KATALOG.erfolge, { id: `spiel:${SPIEL}:erster-sieg`, art: "spiel", spiel: SPIEL, symbol: "stern", stufe: "bronze", perlen: 7, name: { en: "First win", de: "Erster Sieg" }, text: { en: "Win once.", de: "Einmal gewinnen." } }] },
    spiele: SPIELE
  };
  const { rufen, spielen } = await starten(t, { katalog: eigenerKatalog });
  await rufen("ich");
  const melden = (spiel, id) => rufen("erfolg", { methode: "POST", koerper: { spiel, id } });
  assert.equal((await melden(SPIEL, "gibt-es-nicht")).status, 404);
  assert.equal((await melden(SPIEL, "erster-sieg")).status, 409, "nie gespielt");
  await rufen("spielzeit", { methode: "POST", koerper: { spiel: SPIEL } });
  await spielen(SPIEL, 2);
  const vorher = (await rufen("ich")).daten.profil.perlen;
  const r = await melden(SPIEL, "erster-sieg");
  assert.equal(r.status, 200);
  assert.deepEqual(r.daten.neu.erfolge, [`spiel:${SPIEL}:erster-sieg`]);
  assert.equal(r.daten.perlen - vorher, 7);
  // Zweimal melden zahlt nicht zweimal.
  assert.equal((await melden(SPIEL, "erster-sieg")).daten.perlen, r.daten.perlen);
  // Ein Spielzeit-Erfolg kann kein Spiel "melden".
  assert.equal((await melden(SPIEL, "10m")).status, 404);
});

test("state survives a restart; account data export and deletion", async (t) => {
  const ordner = mkdtempSync(join(tmpdir(), "miwale-profil-neu-"));
  t.after(() => rmSync(ordner, { recursive: true, force: true }));
  {
    const { rufen, dienst } = await starten(t, { ordner });
    await rufen("ich");
    await rufen("admin/profile/konto-a", { methode: "PUT", wer: null, auth: PASSWORT, koerper: { perlen: 100 } });
    await rufen("kaufen", { methode: "POST", koerper: { item: "av-welle" } });
    dienst.flush();
    assert.ok(existsSync(join(ordner, "profile.json")));
  }
  const { rufen, dienst } = await starten(t, { ordner });
  const p = (await rufen("ich")).daten.profil;
  assert.deepEqual(p.inventar, ["av-welle"]);
  assert.ok(dienst.kontoDaten("konto-a").inventar.includes("av-welle"));
  assert.equal(dienst.kontoDaten("unbekannt"), null);
  dienst.kontoLoeschen("konto-a");
  assert.equal(dienst.kontoDaten("konto-a"), null);
  assert.ok(!readFileSync(join(ordner, "profile.json"), "utf8").includes("av-welle"));
});

test("writes from other sites are refused; actions are rate limited", async (t) => {
  const { rufen } = await starten(t);
  assert.equal((await rufen("besuch", { methode: "POST", origin: "https://evil.example" })).status, 403);
  assert.equal((await rufen("besuch", { methode: "POST", origin: "" })).status, 403);
  let letzte;
  for (let i = 0; i < 80; i++) letzte = await rufen("spielzeit", { methode: "POST", koerper: { spiel: SPIEL } });
  assert.equal(letzte.status, 429);
});

test("admin: password required; list, adjust pearls, reset", async (t) => {
  const { rufen } = await starten(t);
  await rufen("ich");
  assert.equal((await rufen("admin/profile", { wer: null })).status, 401);
  assert.equal((await rufen("admin/profile", { wer: null, auth: "falsch" })).status, 401);
  const liste = await rufen("admin/profile", { wer: null, auth: PASSWORT });
  assert.equal(liste.status, 200);
  assert.equal(liste.daten.profile[0].name, "Alice");
  assert.equal((await rufen("admin/profile/konto-a", { methode: "PUT", wer: null, auth: PASSWORT, koerper: { perlen: "viel" } })).status, 400);
  assert.equal((await rufen("admin/profile/konto-a", { methode: "DELETE", wer: null, auth: PASSWORT })).status, 200);
  assert.equal((await rufen("admin/profile/konto-a", { methode: "DELETE", wer: null, auth: PASSWORT })).status, 404);
});

test("a fresh profile has defaults for every slot", () => {
  const p = neuesProfil(KATALOG, START);
  assert.equal(p.ausruestung.titel, "ti-neuling");
  assert.deepEqual(Object.keys(p.ausruestung).sort(), ["akzent", "avatar", "banner", "name", "rahmen", "titel"]);
});

test("favourites: toggle, newest first, only known games", async (t) => {
  const { rufen } = await starten(t);
  const fav = (spiel, an) => rufen("favorit", { methode: "POST", koerper: { spiel, an } });
  assert.deepEqual((await fav(SPIEL, true)).daten.favoriten, [SPIEL]);
  assert.deepEqual((await fav(ANDERES, true)).daten.favoriten, [ANDERES, SPIEL]);
  assert.deepEqual((await fav(SPIEL, true)).daten.favoriten, [SPIEL, ANDERES], "erneut an: nach vorn");
  assert.deepEqual((await fav(SPIEL, false)).daten.favoriten, [ANDERES]);
  assert.equal((await fav("gibt-es-nicht", true)).status, 400);
  assert.equal((await fav(SPIEL, "ja")).status, 400);
  assert.deepEqual((await rufen("ich")).daten.profil.favoriten, [ANDERES]);
});

test("guest playtime import: capped per game and per account, no pearls for the time itself", async (t) => {
  const { rufen } = await starten(t);
  await rufen("ich");
  const vorher = (await rufen("ich")).daten.profil;
  const r = await rufen("import", { methode: "POST", koerper: { spiele: { [SPIEL]: 30 * 3600, [ANDERES]: 1200, "gibt-es-nicht": 500, kaputt: "viel" }, favoriten: [SPIEL, "gibt-es-nicht"] } });
  assert.equal(r.status, 200);
  assert.equal(r.daten.uebernommen, 6 * 3600 + 1200, "je Spiel hoechstens 6 Stunden");
  assert.deepEqual(r.daten.favoriten, [SPIEL]);
  const p = (await rufen("ich")).daten.profil;
  assert.equal(p.spiele[SPIEL].sek, 6 * 3600);
  assert.equal(p.spiele[ANDERES].sek, 1200);
  // Spielzeit-Erfolge werden frei (mit ihren Perlen), die Zeit selbst zahlt nichts.
  assert.ok(p.erfolge[`spiel:${SPIEL}:1h`] && p.erfolge["eine-stunde"]);
  assert.ok(!p.verlauf.some((v) => String(v.grund).startsWith("spielzeit")), "keine Perlen fuer importierte Zeit");
  assert.equal(p.ep - vorher.ep >= 0, true);
  // Je Spiel hoechstens 6 Stunden, auch ueber mehrere Anfragen; insgesamt hoechstens 10.
  await rufen("import", { methode: "POST", koerper: { spiele: { [SPIEL]: 6 * 3600 } } });
  assert.equal((await rufen("ich")).daten.profil.spiele[SPIEL].sek, 6 * 3600, "zweite Anfrage bringt diesem Spiel nichts");
  for (let i = 0; i < 5; i++) await rufen("import", { methode: "POST", koerper: { spiele: { [ANDERES]: 6 * 3600, [SPIELE[2].id]: 6 * 3600 } } });
  const nachher = (await rufen("ich")).daten.profil;
  assert.equal(nachher.importiertSek, 10 * 3600);
  // Behauptete Zeit schaltet keine wertvollen Erfolge frei (Gold, Platin, mit Gegenstand).
  assert.ok(!nachher.erfolge["zehn-stunden"], "zehn Stunden nur mit selbst gemessener Zeit");
  assert.ok(!nachher.erfolge[`spiel:${SPIEL}:10h`]);
  // Kaputte Eingaben schaden nicht.
  assert.equal((await rufen("import", { methode: "POST", koerper: { spiele: [1, 2] } })).status, 200);
});


test("security: admin lockout holds even for the right password, shared across services", async (t) => {
  const { adminSchutz } = await import("../server/gemeinsam.mjs");
  const geteilt = adminSchutz(() => START, 3);
  const { rufen } = await starten(t, { adminSchutz: geteilt });
  for (let i = 0; i < 3; i++) assert.equal((await rufen("admin/profile", { wer: null, auth: "falsch-" + i, ip: "2001:db8:1:2::" + (i + 1) })).status, 401);
  // Andere Adresse im selben /64-Netz, richtiges Passwort: trotzdem gesperrt.
  assert.equal((await rufen("admin/profile", { wer: null, auth: PASSWORT, ip: "2001:db8:1:2::99" })).status, 429);
  // Ein anderer Anschluss kommt durch.
  assert.equal((await rufen("admin/profile", { wer: null, auth: PASSWORT, ip: "198.51.100.20" })).status, 200);
});

test("security: no prototype tricks in admin paths and showcase, broken URLs are 400", async (t) => {
  const { rufen } = await starten(t);
  await rufen("ich");
  for (const id of ["__proto__", "constructor", "toString"]) {
    assert.equal((await rufen("admin/profile/" + id, { methode: "PUT", wer: null, auth: PASSWORT, koerper: { perlen: 5 } })).status, 404, id);
  }
  assert.equal({}.perlen, undefined, "Object.prototype unberuehrt");
  assert.equal((await rufen("einstellungen", { methode: "POST", koerper: { vitrine: ["constructor"] } })).status, 400);
  assert.equal((await rufen("einstellungen", { methode: "POST", koerper: { vitrine: ["__proto__"] } })).status, 400);
  assert.equal((await rufen("u/%E0%A4%A", { wer: null })).status, 400);
});

test("security: blocked accounts can look but not change or earn anything", async (t) => {
  const gesperrt = { ...kontenErsatz, wer: (req) => (req.headers["x-test-konto"] === "a" ? { ...KONTEN.a, gesperrt: true } : kontenErsatz.wer(req)) };
  const { rufen } = await starten(t, { konten: gesperrt });
  assert.equal((await rufen("ich")).status, 200);
  for (const [pfad, koerper] of [["besuch", {}], ["spielzeit", { spiel: SPIEL }], ["kaufen", { item: "av-welle" }], ["favorit", { spiel: SPIEL, an: true }], ["import", { spiele: {} }], ["einstellungen", { sichtbar: false }]]) {
    assert.equal((await rufen(pfad, { methode: "POST", koerper })).status, 403, pfad);
  }
});

test("security: a public profile with private playtime reveals nothing about playtime", async (t) => {
  const { rufen, spielen } = await starten(t);
  await rufen("ich");
  await rufen("spielzeit", { methode: "POST", koerper: { spiel: SPIEL } });
  await spielen(SPIEL, 21);
  let r = await rufen("u/Alice", { wer: "b" });
  const ids = Object.keys(r.daten.profil.erfolge);
  assert.ok(ids.includes("willkommen"));
  assert.ok(!ids.some((id) => id.startsWith("spiel:") || id === "erste-minuten"), "keine Spielzeit-Erfolge: " + ids.join(","));
  assert.ok(Object.values(r.daten.profil.erfolge).every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)), "nur das Datum");
  // Freigegeben: dann ja.
  await rufen("einstellungen", { methode: "POST", koerper: { spielzeitZeigen: true } });
  r = await rufen("u/Alice", { wer: "b" });
  assert.ok(Object.keys(r.daten.profil.erfolge).includes("erste-minuten"));
});
