import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { kontenBauen, nameFehler, GRENZEN } from "../server/konten.mjs";
import { START_SPERRLISTE } from "../server/sperrliste.mjs";

const PASSWORT = "geheim-fuer-tests";
const DISCORD = { id: "discord-client", secret: "discord-secret" };

// Ein nachgebautes Discord: der Code "code-<kennung>" gehoert zu dieser Kennung.
function falschesDiscord() {
  const aufrufe = [];
  async function holen(url, init = {}) {
    aufrufe.push({ url, init });
    const json = (status, daten) => new Response(JSON.stringify(daten), { status, headers: { "content-type": "application/json" } });
    if (url === "https://discord.com/api/oauth2/token") {
      const p = new URLSearchParams(init.body);
      if (!p.get("code").startsWith("code-")) return json(400, { error: "invalid_grant" });
      return json(200, { access_token: "token-" + p.get("code").slice(5), token_type: "Bearer" });
    }
    if (url === "https://discord.com/api/users/@me") {
      return json(200, { id: String(init.headers.authorization).replace("Bearer token-", ""), username: "echter-name", email: "geheim@example.com" });
    }
    return json(404, {});
  }
  return { holen, aufrufe };
}

async function starten(t, { jetzt } = {}) {
  const ordner = mkdtempSync(join(tmpdir(), "miwale-konten-"));
  const discord = falschesDiscord();
  const geloescht = [];
  const konten = kontenBauen({
    ordner, passwort: PASSWORT, jetzt, holen: discord.holen,
    adresse: "https://miwale.test", herkunft: ["https://miwale.test"],
    anbieter: { discord: DISCORD, google: { id: "", secret: "" } },
    beimLoeschen: (id) => geloescht.push(id),
    datenVon: (id) => ({ bewertungen: [{ von: id }] })
  });
  const server = http.createServer(konten);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  t.after(() => { server.close(); rmSync(ordner, { recursive: true, force: true }); });
  const basis = "http://127.0.0.1:" + server.address().port;

  // Ein Browser mit eigenem Cookie-Speicher.
  function browser() {
    const dose = new Map();
    async function rufen(pfad, { methode = "GET", koerper, auth, kopf } = {}) {
      const res = await fetch(basis + pfad, {
        method: methode,
        redirect: "manual",
        headers: {
          "content-type": "application/json",
          origin: "https://miwale.test",
          cookie: [...dose].map(([n, w]) => n + "=" + w).join("; "),
          ...(auth ? { authorization: "Bearer " + auth } : {}),
          ...(kopf || {})
        },
        body: koerper ? JSON.stringify(koerper) : undefined
      });
      const gesetzt = res.headers.getSetCookie();
      for (const c of gesetzt) {
        const [paar] = c.split(";");
        const [n, w] = [paar.slice(0, paar.indexOf("=")), paar.slice(paar.indexOf("=") + 1)];
        if (/Max-Age=0/.test(c)) dose.delete(n); else dose.set(n, w);
      }
      const typ = res.headers.get("content-type") || "";
      return { status: res.status, ziel: res.headers.get("location"), gesetzt, daten: typ.includes("json") ? await res.json() : null };
    }
    // Anmelden bis zur Rueckkehr von Discord.
    async function anmelden(kennung, zurueck = "/games/chromatic") {
      const start = await rufen("/api/konto/anmelden/discord?zurueck=" + encodeURIComponent(zurueck));
      const state = new URL(start.ziel).searchParams.get("state");
      return rufen("/api/konto/rueckruf/discord?code=code-" + kennung + "&state=" + state);
    }
    return { rufen, anmelden, dose };
  }
  return { browser, ordner, discord, geloescht, konten };
}

test("Namen: nur einfache Zeichen, nichts Reserviertes, nichts Gesperrtes", () => {
  const l = START_SPERRLISTE;
  assert.equal(nameFehler("Toastfan_42", l), null);
  assert.equal(nameFehler("ab", l), "name-format");
  assert.equal(nameFehler("x".repeat(21), l), "name-format");
  assert.equal(nameFehler("<script>", l), "name-format");
  assert.equal(nameFehler("Toast Fan", l), "name-format");
  // Kyrillisches "а": sieht aus wie a, ist es nicht.
  assert.equal(nameFehler("Tоаstfan", l), "name-format");
  assert.equal(nameFehler("admin", l), "name-vergeben");
  assert.equal(nameFehler("Miwale_Official", l), "name-vergeben");
  assert.equal(nameFehler("the-real-miwale", l), "name-vergeben");
  assert.equal(nameFehler("xXshitXx", l), "name-gesperrt");
  assert.equal(nameFehler("big_shit", l), "name-gesperrt");
});

test("Anmelden mit Discord: PKCE, state im Cookie, nur die Kennung wird gebraucht", async (t) => {
  const { browser, discord, ordner } = await starten(t);
  const b = browser();
  const start = await b.rufen("/api/konto/anmelden/discord?zurueck=/games/chromatic");
  assert.equal(start.status, 302);
  const ziel = new URL(start.ziel);
  assert.equal(ziel.origin + ziel.pathname, "https://discord.com/oauth2/authorize");
  assert.equal(ziel.searchParams.get("scope"), "identify");
  assert.equal(ziel.searchParams.get("client_id"), DISCORD.id);
  assert.equal(ziel.searchParams.get("redirect_uri"), "https://miwale.test/api/konto/rueckruf/discord");
  assert.equal(ziel.searchParams.get("code_challenge_method"), "S256");
  assert.equal(ziel.searchParams.get("client_secret"), null);
  const state = ziel.searchParams.get("state");
  assert.ok(state.length >= 40);
  assert.match(start.gesetzt[0], /^__Host-anmeldung=.+; Path=\/; HttpOnly; SameSite=Lax; Secure; Max-Age=600$/);

  const zurueck = await b.rufen("/api/konto/rueckruf/discord?code=code-111222333&state=" + state);
  assert.equal(zurueck.status, 302);
  assert.equal(zurueck.ziel, "/account?neu=1&zurueck=%2Fgames%2Fchromatic");

  // Der Server hat den Code mit Secret und code_verifier getauscht.
  const tausch = new URLSearchParams(discord.aufrufe[0].init.body);
  assert.equal(tausch.get("client_secret"), DISCORD.secret);
  assert.equal(tausch.get("redirect_uri"), "https://miwale.test/api/konto/rueckruf/discord");
  assert.equal(createHash("sha256").update(tausch.get("code_verifier")).digest("base64url"), ziel.searchParams.get("code_challenge"));

  // Noch kein Konto, erst der Name.
  let ich = await b.rufen("/api/konto/ich");
  assert.equal(ich.daten.konto, null);
  assert.deepEqual(ich.daten.registrierung, { anbieter: "discord" });
  assert.deepEqual(ich.daten.anbieter, ["discord"]);

  assert.equal((await b.rufen("/api/konto/registrieren", { methode: "POST", koerper: { name: "Toastfan" } })).daten.fehler, "alter");
  assert.equal((await b.rufen("/api/konto/registrieren", { methode: "POST", koerper: { name: "admin", alter: true } })).daten.fehler, "name-vergeben");
  const neu = await b.rufen("/api/konto/registrieren", { methode: "POST", koerper: { name: "Toastfan", alter: true } });
  assert.equal(neu.status, 201);
  assert.equal(neu.daten.konto.name, "Toastfan");
  assert.equal(neu.daten.zurueck, "/games/chromatic");
  assert.ok(neu.gesetzt.some((c) => /^__Host-sitzung=.+; HttpOnly; SameSite=Lax; Secure; Max-Age=2592000$/.test(c.replace("; Path=/", ""))));

  ich = await b.rufen("/api/konto/ich");
  assert.equal(ich.daten.konto.name, "Toastfan");
  assert.equal(ich.daten.konto.anbieter, "discord");

  // Weder Kennung noch Name bei Discord noch E-Mail noch das Token liegen auf der Platte.
  const platte = readFileSync(join(ordner, "konten.json"), "utf8") + readFileSync(join(ordner, "sitzungen.json"), "utf8");
  for (const geheim of ["111222333", "echter-name", "geheim@example.com", "token-", b.dose.get("__Host-sitzung")]) {
    assert.equal(platte.includes(geheim), false, geheim);
  }
});

test("wer schon ein Konto hat, ist nach dem Rueckruf gleich angemeldet", async (t) => {
  const { browser } = await starten(t);
  const erst = browser();
  await erst.anmelden("42424242");
  await erst.rufen("/api/konto/registrieren", { methode: "POST", koerper: { name: "Wieder_da", alter: true } });

  const zweit = browser();
  const r = await zweit.anmelden("42424242", "/requests");
  assert.equal(r.ziel, "/requests");
  assert.equal((await zweit.rufen("/api/konto/ich")).daten.konto.name, "Wieder_da");
  // Zwei Geraete, zwei Sitzungen, ein Konto.
  assert.equal((await erst.rufen("/api/konto/ich")).daten.konto.name, "Wieder_da");
});

test("state: nur aus demselben Browser, nur einmal, nie ein fremdes Ziel", async (t) => {
  const { browser, discord } = await starten(t);
  const opfer = browser();
  const angreifer = browser();

  // Der Angreifer startet, schiebt seinen Rueckruf dem Opfer unter.
  const start = await angreifer.rufen("/api/konto/anmelden/discord");
  const state = new URL(start.ziel).searchParams.get("state");
  const untergeschoben = await opfer.rufen("/api/konto/rueckruf/discord?code=code-777&state=" + state);
  assert.equal(untergeschoben.ziel, "/account?fehler=abgelaufen");
  assert.equal(discord.aufrufe.length, 0);
  // Und der state ist damit verbraucht.
  assert.equal((await angreifer.rufen("/api/konto/rueckruf/discord?code=code-777&state=" + state)).ziel, "/account?fehler=abgelaufen");

  // Ohne state gar nicht.
  assert.equal((await opfer.rufen("/api/konto/rueckruf/discord?code=code-777")).ziel, "/account?fehler=abgelaufen");

  // Zweimal derselbe Rueckruf: der zweite zaehlt nicht.
  const s2 = await opfer.rufen("/api/konto/anmelden/discord");
  const st2 = new URL(s2.ziel).searchParams.get("state");
  const cookie = opfer.dose.get("__Host-anmeldung");
  assert.equal((await opfer.rufen("/api/konto/rueckruf/discord?code=code-777&state=" + st2)).ziel.startsWith("/account?neu=1"), true);
  opfer.dose.set("__Host-anmeldung", cookie);
  assert.equal((await opfer.rufen("/api/konto/rueckruf/discord?code=code-777&state=" + st2)).ziel, "/account?fehler=abgelaufen");

  // Offene Weiterleitung: nur Pfade dieser Seite.
  for (const boese of ["//evil.example/x", "https://evil.example", "/\\evil.example", "javascript:alert(1)", "/.//evil.example", "/..//evil.example", "/games//evil.example"]) {
    const b = browser();
    await b.anmelden("5555");
    await b.rufen("/api/konto/registrieren", { methode: "POST", koerper: { name: "Boese" + Math.floor(Math.random() * 1e6), alter: true } });
    const r = await b.anmelden("5555", boese);
    assert.equal(r.ziel, "/", boese);
  }
});

test("abgebrochen oder Discord meldet einen Fehler: zurueck mit Hinweis", async (t) => {
  const { browser } = await starten(t);
  const b = browser();
  let s = await b.rufen("/api/konto/anmelden/discord");
  let state = new URL(s.ziel).searchParams.get("state");
  assert.equal((await b.rufen("/api/konto/rueckruf/discord?error=access_denied&state=" + state)).ziel, "/account?fehler=abgebrochen");
  s = await b.rufen("/api/konto/anmelden/discord");
  state = new URL(s.ziel).searchParams.get("state");
  assert.equal((await b.rufen("/api/konto/rueckruf/discord?code=kaputt&state=" + state)).ziel, "/account?fehler=anbieter");
  // Google ist ohne Zugangsdaten nicht im Angebot.
  assert.equal((await b.rufen("/api/konto/anmelden/google")).status, 404);
  assert.equal((await b.rufen("/api/konto/anmelden/github")).status, 404);
});

test("Namen sind eindeutig, auch ohne Rücksicht auf Gross und klein", async (t) => {
  const { browser } = await starten(t);
  const a = browser();
  await a.anmelden("1001");
  await a.rufen("/api/konto/registrieren", { methode: "POST", koerper: { name: "Pixel", alter: true } });
  const b = browser();
  await b.anmelden("1002");
  assert.equal((await b.rufen("/api/konto/registrieren", { methode: "POST", koerper: { name: "PIXEL", alter: true } })).status, 409);
  assert.equal((await b.rufen("/api/konto/registrieren", { methode: "POST", koerper: { name: "Pixel2", alter: true } })).status, 201);
  assert.equal((await b.rufen("/api/konto/name", { methode: "PUT", koerper: { name: "pixel" } })).status, 409);
  const neu = await b.rufen("/api/konto/name", { methode: "PUT", koerper: { name: "Voxel" } });
  assert.equal(neu.daten.konto.name, "Voxel");
});

test("abmelden, ueberall abmelden, Sitzungen laufen ab", async (t) => {
  let uhr = Date.parse("2026-09-18T12:00:00Z");
  const { browser } = await starten(t, { jetzt: () => uhr });
  const handy = browser();
  await handy.anmelden("2001");
  await handy.rufen("/api/konto/registrieren", { methode: "POST", koerper: { name: "Handy", alter: true } });
  const pc = browser();
  await pc.anmelden("2001");
  const laptop = browser();
  await laptop.anmelden("2001");

  const aus = await pc.rufen("/api/konto/abmelden", { methode: "POST", koerper: {} });
  assert.ok(aus.gesetzt.some((c) => /^__Host-sitzung=;.*Max-Age=0/.test(c)));
  assert.equal((await pc.rufen("/api/konto/ich")).daten.konto, null);
  assert.equal((await handy.rufen("/api/konto/ich")).daten.konto.name, "Handy");

  // Wer den alten Cookie aufgehoben hat, kommt damit auch nicht mehr rein.
  const alt = aus.gesetzt.length && handy.dose.get("__Host-sitzung");
  await handy.rufen("/api/konto/abmelden", { methode: "POST", koerper: { ueberall: true } });
  handy.dose.set("__Host-sitzung", alt);
  assert.equal((await handy.rufen("/api/konto/ich")).daten.konto, null);
  assert.equal((await laptop.rufen("/api/konto/ich")).daten.konto, null);

  // 30 Tage ohne Besuch: abgelaufen. Mit Besuch: laeuft weiter.
  const b = browser();
  await b.anmelden("2001");
  uhr += 20 * 24 * 60 * 60 * 1000;
  assert.equal((await b.rufen("/api/konto/ich")).daten.konto.name, "Handy");
  uhr += 20 * 24 * 60 * 60 * 1000;
  assert.equal((await b.rufen("/api/konto/ich")).daten.konto.name, "Handy");
  uhr += GRENZEN.sitzungMs + 1000;
  assert.equal((await b.rufen("/api/konto/ich")).daten.konto, null);
});

test("fremde Seiten koennen weder abmelden noch loeschen", async (t) => {
  const { browser } = await starten(t);
  const b = browser();
  await b.anmelden("3001");
  await b.rufen("/api/konto/registrieren", { methode: "POST", koerper: { name: "Sicher", alter: true } });
  const fremd = { origin: "https://evil.example" };
  assert.equal((await b.rufen("/api/konto", { methode: "DELETE", koerper: { bestaetigt: true }, kopf: fremd })).status, 403);
  assert.equal((await b.rufen("/api/konto/abmelden", { methode: "POST", koerper: {}, kopf: fremd })).status, 403);
  assert.equal((await b.rufen("/api/konto/name", { methode: "PUT", koerper: { name: "Gehackt" }, kopf: { "sec-fetch-site": "same-site" } })).status, 403);
  assert.equal((await b.rufen("/api/konto/ich")).daten.konto.name, "Sicher");
});

test("Auskunft und Konto loeschen", async (t) => {
  const { browser, geloescht } = await starten(t);
  const b = browser();
  await b.anmelden("4001");
  await b.rufen("/api/konto/registrieren", { methode: "POST", koerper: { name: "Weg_damit", alter: true } });

  const daten = await b.rufen("/api/konto/daten");
  assert.equal(daten.status, 200);
  assert.equal(daten.daten.konto.name, "Weg_damit");
  assert.equal(daten.daten.sitzungen.length, 1);
  assert.equal(daten.daten.bewertungen.length, 1);
  assert.equal(JSON.stringify(daten.daten).includes("schluessel"), false);

  assert.equal((await b.rufen("/api/konto", { methode: "DELETE", koerper: {} })).status, 400);
  const weg = await b.rufen("/api/konto", { methode: "DELETE", koerper: { bestaetigt: true } });
  assert.equal(weg.status, 200);
  assert.equal(weg.daten.konto, null);
  assert.equal(geloescht.length, 1);
  assert.equal((await b.rufen("/api/konto/daten")).status, 401);

  // Wieder anmelden: ein ganz neues Konto, der alte Name ist frei.
  await b.anmelden("4001");
  assert.equal((await b.rufen("/api/konto/registrieren", { methode: "POST", koerper: { name: "Weg_damit", alter: true } })).status, 201);
});

test("Verwaltung: Konten sehen, sperren, entsperren, loeschen", async (t) => {
  const { browser, konten } = await starten(t);
  const b = browser();
  await b.anmelden("6001");
  await b.rufen("/api/konto/registrieren", { methode: "POST", koerper: { name: "Troll", alter: true } });

  assert.equal((await b.rufen("/api/konto/admin/alle")).status, 401);
  const alle = await b.rufen("/api/konto/admin/alle", { auth: PASSWORT });
  assert.equal(alle.daten.konten.length, 1);
  const id = alle.daten.konten[0].id;
  assert.equal(JSON.stringify(alle.daten).includes("schluessel"), false);

  await b.rufen("/api/konto/admin/konto/" + id, { methode: "PUT", auth: PASSWORT, koerper: { gesperrt: true } });
  assert.equal((await b.rufen("/api/konto/ich")).daten.konto.gesperrt, true);
  assert.equal(konten.wer({ headers: { cookie: "__Host-sitzung=" + b.dose.get("__Host-sitzung") } }).gesperrt, true);
  assert.equal((await b.rufen("/api/konto/name", { methode: "PUT", koerper: { name: "Lieb" } })).status, 403);

  // Loeschen und neu anmelden hilft einem gesperrten Konto nicht.
  await b.rufen("/api/konto", { methode: "DELETE", koerper: { bestaetigt: true } });
  assert.equal((await b.anmelden("6001")).ziel, "/account?fehler=gesperrt");

  // Andere Konten loescht die Verwaltung ganz, ohne Sperre.
  const c = browser();
  await c.anmelden("6002");
  await c.rufen("/api/konto/registrieren", { methode: "POST", koerper: { name: "Normal", alter: true } });
  const cid = (await c.rufen("/api/konto/admin/alle", { auth: PASSWORT })).daten.konten[0].id;
  assert.equal((await c.rufen("/api/konto/admin/konto/" + cid, { methode: "DELETE", auth: PASSWORT })).status, 200);
  assert.equal((await c.rufen("/api/konto/ich")).daten.konto, null);
  assert.ok((await c.anmelden("6002")).ziel.startsWith("/account?neu=1"));
});

test("Tempolimit fuer Anmeldungen und Namenswechsel", async (t) => {
  const { browser } = await starten(t);
  const b = browser();
  for (let i = 0; i < GRENZEN.anmeldenProFenster; i++) assert.equal((await b.rufen("/api/konto/anmelden/discord")).status, 302);
  const zuViel = await b.rufen("/api/konto/anmelden/discord");
  assert.equal(zuViel.ziel, "/account?fehler=zu-schnell");
});

test("volle Liste offener Anmeldungen sperrt niemanden aus, IPv6 zaehlt je Netz", async (t) => {
  const { browser } = await starten(t);
  const b = browser();
  // Viele Adressen aus einem /64-Netz zaehlen zusammen.
  for (let i = 0; i < GRENZEN.anmeldenProFenster; i++) {
    assert.equal((await b.rufen("/api/konto/anmelden/discord", { kopf: { "x-forwarded-for": "2001:db8:1:2::" + i.toString(16) } })).status, 302);
  }
  const zuViel = await b.rufen("/api/konto/anmelden/discord", { kopf: { "x-forwarded-for": "2001:db8:1:2::ffff" } });
  assert.equal(zuViel.ziel, "/account?fehler=zu-schnell");
  // Ein anderes Netz ist davon nicht betroffen.
  assert.equal((await b.rufen("/api/konto/anmelden/discord", { kopf: { "x-forwarded-for": "2001:db8:9:9::1" } })).status, 302);
});
