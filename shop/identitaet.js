// Wer ist der Besucher? Die eine Stelle, die das beantwortet, fuer alles auf
// der Spieleseite, was "eigene" Daten hat (Bewertungen, Game Requests, Konto).
//
// Zwei Dinge:
// - Das Geraet: eine zufaellige Kennung im localStorage. Sie reicht fuer den
//   Daumen bei den Bewertungen, der ohne Konto geht.
// - Das Konto: kommt vom Server (/api/konto/ich). Die Sitzung steckt in einem
//   HttpOnly-Cookie, das kein Skript lesen kann -- auch dieses nicht. Hier liegt
//   nur, was der Server ueber sich selbst sagt: Name, Anbieter, gesperrt.
//
// Aendert sich das Konto (angemeldet, abgemeldet, Name geaendert), gibt es ein
// Ereignis "miwale-konto" auf window; die Teile der Seite zeichnen sich dann neu.
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

  // { konto: { name, anbieter, erstellt, gesperrt } | null,
  //   registrierung: { anbieter } | null, anbieter: ["discord", ...] }
  const LEER = { konto: null, registrierung: null, anbieter: [] };
  let stand = null;

  function setzen(neu) {
    stand = neu && typeof neu === "object" ? { ...LEER, ...neu } : LEER;
    window.dispatchEvent(new CustomEvent("miwale-konto", { detail: stand }));
    return stand;
  }

  function laden() {
    return fetch("/api/konto/ich", { headers: { accept: "application/json" }, credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then(setzen);
  }
  let bereit = laden();

  // Aendernde Anfragen an die eigenen Dienste. Der Server prueft Origin und
  // Sec-Fetch-Site (gemeinsam.mjs); die setzt der Browser selbst.
  async function senden(url, methode, koerper) {
    const res = await fetch(url, {
      method: methode,
      credentials: "same-origin",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify(koerper || {})
    });
    const daten = await res.json().catch(() => ({}));
    return { status: res.status, daten };
  }

  window.MIWALE_IDENTITAET = {
    geraet,
    // Koepfe fuer fetch an die eigenen Dienste.
    kopfzeilen: () => ({ "x-miwale-geraet": geraet() }),
    // Angemeldetes Konto oder null; vor der ersten Antwort null.
    konto: () => (stand ? stand.konto : null),
    stand: () => stand || LEER,
    geladen: () => !!stand,
    bereit: () => bereit,
    neuLaden: () => (bereit = laden()),
    setzen,
    senden,
    // Adresse, die die Anmeldung beim Anbieter startet und danach hierher zurueckkehrt.
    anmeldenAdresse: (anbieter, zurueck) =>
      "/api/konto/anmelden/" + encodeURIComponent(anbieter) + "?zurueck=" + encodeURIComponent(zurueck || location.pathname)
  };
})();
