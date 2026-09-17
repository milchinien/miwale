// Leise Toene fuer die Spieleseite: ein Wisch, wenn Karten wechseln, und ein
// kurzer Klick beim Ueberfahren einer Karte. Beide Aufnahmen stammen aus
// Dropfall (public/assets/sfx/swipe.mp3 und hover.mp3), dort sind sie schon
// geschnitten und auf denselben Spitzenpegel gebracht.
//
// Web Audio statt new Audio(): die Toene liegen einmal dekodiert im Speicher,
// starten ohne Verzoegerung und lassen sich verstimmen. shop.js ruft nur
// MIWALE_KLANG.wisch(richtung) und MIWALE_KLANG.hover() auf.
//
// Browser lassen Ton erst nach einer echten Eingabe zu (Klick, Taste,
// Tippen). Blosses Ueberfahren oder Scrollen zaehlt nicht — bis dahin bleibt
// die Seite still, und das ist gewollt.
(() => {
  "use strict";

  // Absichtlich leise. Dropfall spielt dieselben Dateien mit 0.30 bzw. 0.10
  // unter einem Hauptregler von 0.7; hier liegt beides noch etwas darunter.
  const SORTEN = {
    wisch: { datei: "shop/sfx/swipe.mp3", pegel: 0.14, sperre: 90 },
    hover: { datei: "shop/sfx/hover.mp3", pegel: 0.05, sperre: 60 }
  };

  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) { window.MIWALE_KLANG = { wisch() {}, hover() {} }; return; }

  let ctx = null;
  const puffer = {};
  const zuletzt = {};

  function anlegen() {
    if (ctx) return;
    ctx = new Ctor();
    for (const [name, s] of Object.entries(SORTEN)) {
      fetch(s.datei)
        .then((r) => r.arrayBuffer())
        .then((daten) => new Promise((ok, fehler) => ctx.decodeAudioData(daten, ok, fehler)))
        .then((b) => { puffer[name] = b; })
        .catch(() => { /* ohne Ton geht die Seite genauso */ });
    }
  }

  // Erst bei der ersten Eingabe anlegen: vorher startet der Kontext ohnehin
  // gesperrt, und Chrome meldet das sonst in der Konsole.
  const wecken = () => {
    anlegen();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
  };
  for (const ereignis of ["pointerdown", "keydown", "touchstart"]) {
    window.addEventListener(ereignis, wecken, { passive: true, capture: true });
  }

  function spiele(name, halbtoene, seite) {
    if (!ctx || ctx.state !== "running" || !puffer[name]) return;
    const s = SORTEN[name];
    const jetzt = performance.now();
    if (jetzt - (zuletzt[name] || 0) < s.sperre) return;
    zuletzt[name] = jetzt;

    const quelle = ctx.createBufferSource();
    quelle.buffer = puffer[name];
    // Ein Hauch Streuung, damit viele Klicks hintereinander nicht mechanisch klingen.
    quelle.playbackRate.value = Math.pow(2, ((halbtoene || 0) + (Math.random() - 0.5) * 0.6) / 12);
    const laut = ctx.createGain();
    laut.gain.value = s.pegel;
    let kette = quelle.connect(laut);
    if (seite && ctx.createStereoPanner) {
      const pan = ctx.createStereoPanner();
      pan.pan.value = seite;
      kette = kette.connect(pan);
    }
    kette.connect(ctx.destination);
    quelle.start();
  }

  window.MIWALE_KLANG = {
    // Richtung +1 = vor, -1 = zurueck. Wie in Dropfall folgt die Tonhoehe der
    // Richtung, und der Wisch wandert leicht zur Seite, in die es geht.
    wisch(richtung) {
      const r = Math.sign(richtung || 1);
      spiele("wisch", r * 2.5, r * 0.3);
    },
    hover() { spiele("hover", 0, 0); }
  };
})();
