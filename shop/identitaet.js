// Wer ist der Besucher? Die eine Stelle, die das beantwortet, fuer alles auf
// der Spieleseite, was "eigene" Daten hat (Bewertungen, Game Requests).
//
// Heute gibt es kein Konto: jedes Geraet bekommt beim ersten Besuch eine
// zufaellige Kennung im localStorage, und die Dienste ordnen Eintraege dieser
// Kennung zu (server/gemeinsam.mjs, besitzerVon).
//
// Kommt ein Konto dazu, aendert sich hier, was kopfzeilen() mitschickt (oder
// die Sitzung laeuft per Cookie), und konto() liefert { id, name }. Die Teile
// der Seite fragen weiter nur hier nach und muessen nichts davon wissen.
(() => {
  "use strict";

  const GERAET_SCHLUESSEL = "miwale-geraet";
  const GERAET_RE = /^[a-zA-Z0-9-]{16,64}$/;
  let fluechtig = null;

  function neueKennung() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
  }

  function geraet() {
    try {
      let id = localStorage.getItem(GERAET_SCHLUESSEL);
      if (!id || !GERAET_RE.test(id)) {
        id = neueKennung();
        localStorage.setItem(GERAET_SCHLUESSEL, id);
      }
      return id;
    } catch (e) {
      // Speicher gesperrt: fuer diesen Besuch eine Kennung im Speicher halten.
      if (!fluechtig) fluechtig = neueKennung();
      return fluechtig;
    }
  }

  window.MIWALE_IDENTITAET = {
    geraet,
    // Koepfe fuer fetch an die eigenen Dienste.
    kopfzeilen: () => ({ "x-miwale-geraet": geraet() }),
    // Angemeldetes Konto oder null. Heute immer null.
    konto: () => null
  };
})();
