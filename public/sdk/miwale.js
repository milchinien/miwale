/*! miwale SDK 1 — Erfolge aus einem Spiel melden.
 *
 * Fuer Spiele, die auf miwale.com im Spielfenster laufen. Kopiere diese Datei in
 * dein Spiel (kein Nachladen von miwale.com noetig) und rufe an der richtigen
 * Stelle auf:
 *
 *     miwale.achievement("first-win");
 *
 * Die ids muessen in shop/profil-katalog.js (SPIEL_ERFOLGE) stehen, sonst passiert
 * nichts. Mehrfaches Melden ist harmlos: ein Erfolg zaehlt nur einmal. Laeuft das
 * Spiel nicht auf miwale.com (eigene Seite, itch.io, lokal), sind alle Aufrufe
 * leer: das Spiel braucht keine Fallunterscheidung.
 *
 * Gesendet wird nur eine Nachricht an das uebergeordnete Fenster. Wer sie
 * annimmt und was sie wert ist, entscheidet miwale.com: nur das offene Spiel,
 * nur angemeldete Spieler, und der Server prueft die id.
 */
(function (global) {
  "use strict";
  var imRahmen = global.parent && global.parent !== global;
  var gemeldet = {};
  var bereit = false;
  var angemeldet = false;
  var wartende = [];

  function senden(nachricht) {
    if (!imRahmen) return false;
    try { global.parent.postMessage(Object.assign({ miwale: 1 }, nachricht), "*"); return true; } catch (e) { return false; }
  }

  global.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || d.miwale !== 1 || e.source !== global.parent || d.typ !== "bereit") return;
    bereit = true;
    angemeldet = !!d.angemeldet;
    wartende.splice(0).forEach(function (f) { try { f(angemeldet); } catch (err) { /* Spiel-Code */ } });
  });

  function achievement(id) {
    if (typeof id !== "string" || !/^[a-z0-9-]{1,60}$/.test(id) || gemeldet[id]) return false;
    gemeldet[id] = true;
    return senden({ typ: "erfolg", id: id });
  }

  global.miwale = {
    version: 1,
    // Laeuft das Spiel im Spielfenster von miwale.com (oder irgendeinem Rahmen)?
    inFrame: !!imRahmen,
    achievement: achievement,
    // Ist der Spieler angemeldet? Erst nach bereit() sicher bekannt.
    isSignedIn: function () { return angemeldet; },
    // Ruft f(angemeldet) auf, sobald miwale.com geantwortet hat (nie, ausserhalb von miwale.com).
    ready: function (f) { if (bereit) f(angemeldet); else wartende.push(f); }
  };
  senden({ typ: "hallo" });
})(window);
