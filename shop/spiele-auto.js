// AUTOMATISCH ERZEUGT von tools/sync-games.mjs – nicht von Hand bearbeiten.
//
// Spiele von GitHub, die die Kern-Pruefung bestanden haben und (noch) keinen
// handgeschriebenen Eintrag in shop/spiele.js haben. Bekommt ein Spiel dort
// einen Eintrag, gilt der und dieser hier wird uebersprungen.
// Texte kommen aus miwale.json im Spiel-Repository, sonst aus Beschreibung und README.
(function (auto) {
  const liste = window.MIWALE_SPIELE = window.MIWALE_SPIELE || [];
  const da = new Set(liste.map((s) => s.id));
  for (const s of auto) if (!da.has(s.id)) liste.push(s);
})([
  {
    "id": "castle-scaremore",
    "name": "Castle Scaremore",
    "auto": true,
    "neu": true,
    "veroeffentlicht": "2026-09-29",
    "geraete": [
      "pc",
      "handy"
    ],
    "status": {
      "en": "Playable prototype",
      "de": "Spielbarer Prototyp"
    },
    "spielen": "/games/castle-scaremore/index.html",
    "bild": "assets/games/auto/castle-scaremore-1.jpg",
    "bilder": [
      "assets/games/auto/castle-scaremore-1.jpg",
      "assets/games/auto/castle-scaremore-0.jpg"
    ],
    "quelle": "https://github.com/milchinien/Castle-Scaremore",
    "texte": {
      "en": {
        "kurz": "Browser game with timed scares, upgrades, quests, and a layered animated castle intro.",
        "tags": [
          "Prototype"
        ],
        "ueber": [
          "Browser game with timed scares, upgrades, quests, and a layered animated castle intro."
        ],
        "features": [],
        "steuerung": ""
      },
      "de": {
        "kurz": "Browser game with timed scares, upgrades, quests, and a layered animated castle intro.",
        "tags": [
          "Prototyp"
        ],
        "ueber": [
          "Browser game with timed scares, upgrades, quests, and a layered animated castle intro."
        ],
        "features": [],
        "steuerung": ""
      }
    }
  }
]);
