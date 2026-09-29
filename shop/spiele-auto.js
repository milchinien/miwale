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
})([]);
