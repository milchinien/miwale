// Prueft den Weiterleiter in index.html: welches Geraet bekommt welche Fassung.
//
// Der Test baut die Entscheidung nicht nach, sondern fuehrt den Code aus der
// Datei aus — sonst gehen Test und Seite mit der Zeit auseinander. Dafuer wird
// das Skript aus index.html geschnitten und in einer Sandbox mit gestellten
// matchMedia-, screen- und location-Werten laufen gelassen.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");
const HANDY = "miwale%20Portfolio%20Mobil.dc.html";
const RECHNER = "miwale%20Portfolio.dc.html";

function skriptHolen() {
  const html = readFileSync(join(wurzel, "index.html"), "utf8");
  const treffer = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(treffer, "index.html hat kein <script> mit der Weiterleitung");
  return treffer[1];
}

// Fuehrt den echten Weiterleiter aus und gibt zurueck, wohin er springt.
function entscheide({ fensterBreite, breite, hoehe, grob }) {
  let ziel = null;
  const sandbox = {
    screen: { width: breite, height: hoehe },
    matchMedia(frage) {
      if (frage.includes("max-width: 700px")) return { matches: fensterBreite <= 700 };
      if (frage.includes("pointer: coarse")) return { matches: grob };
      throw new Error("unerwartete Medienfrage: " + frage);
    },
    location: { replace: (u) => { ziel = u; } }
  };
  vm.runInNewContext(skriptHolen(), sandbox);
  assert.ok(ziel, "der Weiterleiter hat kein Ziel gesetzt");
  return ziel;
}

// Hochkant wie quer: ein Handy bleibt ein Handy. Quer ist es breiter als 700px
// und landete darum frueher auf der Rechnerfassung, wo die Kacheln am
// Mauszeiger haengen und die Leiste kleine Ziele hat.
const HANDYS = [
  ["iPhone SE hoch", { fensterBreite: 375, breite: 375, hoehe: 667, grob: true }],
  ["iPhone SE quer", { fensterBreite: 667, breite: 375, hoehe: 667, grob: true }],
  ["iPhone 12 hoch", { fensterBreite: 390, breite: 390, hoehe: 844, grob: true }],
  ["iPhone 12 quer", { fensterBreite: 844, breite: 390, hoehe: 844, grob: true }],
  ["Pixel 7 quer", { fensterBreite: 915, breite: 412, hoehe: 915, grob: true }],
  ["Galaxy S20 Ultra quer", { fensterBreite: 915, breite: 412, hoehe: 915, grob: true }]
];

// Tablets und Rechner behalten die grosse Fassung — der PC ist die Hauptfassung.
const RECHNERS = [
  ["iPad mini hoch", { fensterBreite: 768, breite: 768, hoehe: 1024, grob: true }],
  ["iPad Pro quer", { fensterBreite: 1366, breite: 1024, hoehe: 1366, grob: true }],
  ["Laptop 1440", { fensterBreite: 1440, breite: 1440, hoehe: 900, grob: false }],
  ["Touch-Laptop mit Maus", { fensterBreite: 1440, breite: 1440, hoehe: 900, grob: false }]
];

for (const [name, geraet] of HANDYS) {
  test(name + " bekommt die Handyfassung", () => {
    assert.equal(entscheide(geraet), HANDY);
  });
}

for (const [name, geraet] of RECHNERS) {
  test(name + " bekommt die Rechnerfassung", () => {
    assert.equal(entscheide(geraet), RECHNER);
  });
}

// Ein schmal gezogenes Fenster am Rechner zaehlt weiter als schmal: die
// Handyfassung ist dort die passendere, auch ohne Finger.
test("schmal gezogenes Browserfenster bekommt die Handyfassung", () => {
  assert.equal(
    entscheide({ fensterBreite: 600, breite: 1920, hoehe: 1080, grob: false }),
    HANDY
  );
});

// Fehlt screen (alte Einbettungen, manche In-App-Browser), darf der Weiterleiter
// nicht raten: dann zaehlt allein die Fensterbreite.
test("ohne screen-Werte entscheidet die Fensterbreite", () => {
  assert.equal(entscheide({ fensterBreite: 1440, breite: 0, hoehe: 0, grob: true }), RECHNER);
  assert.equal(entscheide({ fensterBreite: 390, breite: 0, hoehe: 0, grob: true }), HANDY);
});
