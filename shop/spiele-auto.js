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
    "id": "chromatic-2",
    "name": "Chromatic 2",
    "auto": true,
    "neu": true,
    "veroeffentlicht": "2026-09-24",
    "geraete": [
      "pc",
      "handy"
    ],
    "status": {
      "en": "Playable prototype",
      "de": "Spielbarer Prototyp"
    },
    "spielen": "/games/chromatic-2/index.html",
    "bild": "assets/games/auto/chromatic-2-1.jpg",
    "bilder": [
      "assets/games/auto/chromatic-2-1.jpg",
      "assets/games/auto/chromatic-2-0.jpg"
    ],
    "quelle": "https://github.com/milchinien/Chromatic-2",
    "texte": {
      "en": {
        "kurz": "Pick three colors, draw your cards and send hundreds of pixel soldiers into real-time mass battles – a roguelite deckbuilder across four worlds.",
        "tags": [
          "Roguelite",
          "Deckbuilder",
          "Strategy",
          "Mass battles"
        ],
        "ueber": [
          "Every round you draw three cards and choose two: one fights in front, one in the back. Then both armies clash in real time – archers, cavalry, mages, siege engines and huge champions, sometimes thousands of units at once. Whoever reaches the enemy castle damages it.",
          "Pair two cards of the same color or class to unlock a bonus: Ashclan rage, Wildwood regeneration, tidal waves, undead that rise again and more. Seven colors, 36 cards.",
          "Fight your way through four worlds with shops, treasure, enchanters and a pyre to thin your deck – and a boss waiting at the end of each world."
        ],
        "features": [
          "Real-time mass battles with hundreds to thousands of units",
          "7 colors and 36 cards, each with its own ability",
          "Race and class bonuses for matching pairs",
          "4 worlds with bosses, shops, treasure, enchantments and a pyre",
          "Procedurally generated sound and pixel art",
          "Your run is saved at every fork in the road"
        ],
        "steuerung": "Mouse: pick two of three cards, press Fight. Left-click skips the card showcase. 1×/2×/4× speed and pause during the battle. M mutes the sound."
      },
      "de": {
        "kurz": "Wähle drei Farben, zieh deine Karten und schick hunderte Pixel-Soldaten in Echtzeit-Massenschlachten – ein Roguelite-Deckbuilder über vier Welten.",
        "tags": [
          "Roguelite",
          "Deckbuilder",
          "Strategie",
          "Massenschlachten"
        ],
        "ueber": [
          "Jede Runde ziehst du drei Karten und wählst zwei: eine kämpft vorne, eine hinten. Dann prallen beide Heere in Echtzeit aufeinander – Bogenschützen, Reiter, Magier, Belagerungswaffen und riesige Champions, manchmal tausende Einheiten auf einmal. Wer die gegnerische Burg erreicht, beschädigt sie.",
          "Zwei Karten derselben Farbe oder Klasse schalten einen Bonus frei: die Wut der Ashclan, Regeneration im Wildwood, Flutwellen, Untote, die wieder aufstehen, und mehr. Sieben Farben, 36 Karten.",
          "Kämpf dich durch vier Welten mit Shop, Schätzen, Verzauberungen und einem Scheiterhaufen, um dein Deck auszudünnen – am Ende jeder Welt wartet ein Boss."
        ],
        "features": [
          "Echtzeit-Massenschlachten mit hunderten bis tausenden Einheiten",
          "7 Farben und 36 Karten, jede mit eigener Fähigkeit",
          "Rassen- und Klassenboni für passende Paare",
          "4 Welten mit Bossen, Shop, Schätzen, Verzauberungen und Scheiterhaufen",
          "Prozedural erzeugter Ton und Pixel-Art",
          "Der Run wird an jeder Weggabelung gespeichert"
        ],
        "steuerung": "Maus: zwei von drei Karten wählen, Fight drücken. Linksklick überspringt die Kartenschau. Im Kampf Tempo 1×/2×/4× und Pause. M schaltet den Ton stumm."
      }
    }
  }
]);
