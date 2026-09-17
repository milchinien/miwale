// Hintergrund der Spielseite wie bei Steam: hinter der Seite liegt ein
// ikonisches Bild des Spiels, blau eingefaerbt, oben am staerksten und nach
// unten in den Seitengrund auslaufend. In der Mitte ist es nur leicht
// verschwommen, zum Rand hin immer staerker.
//
// Haengt sich selbst an: shop.js schreibt beim Zeichnen data-seite="spiel:<id>"
// an #app. Diese Datei beobachtet das Attribut, damit shop.js dafuer nicht
// angefasst werden muss.
(() => {
  "use strict";

  // Welches Bild je Spiel. Ausgesucht nach Wiedererkennung, nicht nach dem
  // ersten Screenshot: das Motiv soll auch verschwommen noch nach dem Spiel
  // aussehen. Fehlt ein Spiel hier, nimmt die Seite den ersten Screenshot.
  const MOTIVE = {
    dropfall: "assets/games/shop/dropfall-3.jpg",
    wavebreaker: "assets/games/shop/wavebreaker-4.jpg",
    chromatic: "assets/games/shop/chromatic-2.jpg",
    reliktenschieber: "assets/games/shop/reliktenschieber-2.jpg",
    runecall: "assets/games/shop/runecall-1.jpg",
    harmonics: "assets/games/shop/harmonics-2.jpg",
    mathuniverse: "assets/games/shop/mathuniverse-1.jpg"
  };

  const app = document.getElementById("app");
  if (!app) return;

  // Mehrere Ebenen desselben Bildes, jede etwas schaerfer und etwas kleiner
  // ausgeschnitten als die darunter. Die Masken ueberlappen breit, so waechst
  // die Unschaerfe zum Rand hin stetig statt in Stufen. Die Fuellebene deckt
  // die Seiten neben dem Bild.
  const buehne = document.createElement("div");
  buehne.className = "sp-hg";
  buehne.setAttribute("aria-hidden", "true");
  buehne.innerHTML =
    '<div class="sp-hg__ebene sp-hg__ebene--fuell"></div>' +
    [5, 4, 3, 2, 1].map((n) => '<div class="sp-hg__ebene sp-hg__ebene--' + n + '"></div>').join("") +
    '<div class="sp-hg__toenung"></div>';
  document.body.prepend(buehne);

  let aktuell = null;

  function motiv(id) {
    if (MOTIVE[id]) return MOTIVE[id];
    const sp = (window.MIWALE_SPIELE || []).find((s) => s.id === id);
    if (!sp) return null;
    const m = sp.medien || {};
    return (m.screens && m.screens[0]) || m.poster || sp.bild || null;
  }

  function setzen() {
    const seite = app.dataset.seite || "";
    const id = seite.startsWith("spiel:") ? seite.slice(6) : null;
    const src = id ? motiv(id) : null;
    if (src === aktuell) return;
    aktuell = src;
    if (!src) {
      buehne.classList.remove("sp-hg--an");
      return;
    }
    // Erst zeigen, wenn das Bild geladen ist, sonst blitzt eine leere Flaeche auf.
    const bild = new Image();
    bild.decoding = "async";
    bild.onload = () => {
      if (aktuell !== src) return;
      buehne.style.setProperty("--sp-hg-bild", 'url("' + new URL(src, document.baseURI).href + '")');
      buehne.classList.add("sp-hg--an");
    };
    buehne.classList.remove("sp-hg--an");
    bild.src = src;
  }

  new MutationObserver(setzen).observe(app, { attributes: true, attributeFilter: ["data-seite"] });
  setzen();
})();
