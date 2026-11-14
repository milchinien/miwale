// Aleator – Register aller Kosmetik: Würfelmaterialien, Farbfelder, Stil-Farbanzahl, Freischalt-Prüfung. window.WGCosmetics
// Frei ab Start sind nur FREE. Alles andere kommt aus Achievement-Belohnungen (achievements.js) oder wird mit grant()
// direkt vergeben (z. B. später durch Challenges). Gespeichert in meta().cosmetics, gemeinsam für alle Speicherplätze.
((global) => {
  'use strict';
  const FREE = new Set(['palette:felt', 'background:lava', 'material:matte']);
  const key = (kind, id) => kind + ':' + id;

  // Würfelseiten: Körperfarben und Augen. Die Körperfarbe definiert die Material-Maske.
  const FACE_STYLE = {
    normal: { body: '#FFFFFF' },
    gold: { body: '#F3C969', pip: '#6B4A12', onePip: '#6B4A12' },
    mult: { body: '#FFD0CC', pip: '#C2312A', onePip: '#C2312A' },
    bonus: { body: '#CDE8FF', pip: '#1D5FA8', onePip: '#1D5FA8' },
    wild: { body: '#EBDDFF' },
    skull: { body: '#2B2230' },
    hex: { body: '#3A2550' },
    prism: { body: '#FFFFFF' },
    twin: { body: '#DDF3EE' },
  };

  // Material verändert nie eine Farbe: nur neutrales Licht auf der Körperfläche (shader) und neutraler Schein außen (halo).
  // dim:   wie weit die Fläche im Ruhezustand neutral abgedunkelt ist, damit Glanz auch auf Weiß sichtbar wird
  // shine: Stärke des Glanzes (Streifen), shimmer: weiches Wandern, halo: [Farbe, Stärke], sparkle: Glitzerpixel außen pro Würfel
  const MATERIALS = [
    { id: 'matte', name: 'Matte', desc: 'The standard dice.', code: 0, dim: 0, shine: 0, shimmer: 0 },
    { id: 'polished', name: 'Polished', desc: 'A strong gloss streak when the die tilts.', code: 1, dim: 0.1, shine: 0.34, shimmer: 0 },
    { id: 'pearl', name: 'Pearl', desc: 'A slow, soft shimmer across the surface.', code: 2, dim: 0.1, shine: 0, shimmer: 0.26 },
    { id: 'ember', name: 'Ember Glow', desc: 'A warm glow around the die that pulses while scoring.', code: 0, dim: 0, shine: 0, shimmer: 0, halo: ['#FFE2C2', 0.34] },
    { id: 'frost', name: 'Frost Glint', desc: 'A cool glow with glints outside the die.', code: 0, dim: 0, shine: 0, shimmer: 0, halo: ['#DDEFFF', 0.26], sparkle: 3 },
    { id: 'starlit', name: 'Starlit', desc: 'Rare sparkles around the die.', code: 0, dim: 0, shine: 0, shimmer: 0, sparkle: 5 },
    { id: 'royal', name: 'Royal', desc: 'Gloss and glow together.', code: 1, dim: 0.1, shine: 0.3, shimmer: 0, halo: ['#FFFFFF', 0.28] },
    { id: 'constellation', name: 'Constellation', desc: 'A cool night glow and many tiny stars. Astronomer.', code: 2, dim: 0.1, shine: 0, shimmer: 0.18, halo: ['#E2E8FF', 0.24], sparkle: 6 },
    // Challenges und Daily: nur Licht, nie eine andere Würfelfarbe
    { id: 'champion', name: 'Champion', desc: 'Gloss, a golden glow and sparkles. Win the Boss Rush.', code: 1, dim: 0.1, shine: 0.3, shimmer: 0, halo: ['#FFEFC8', 0.3], sparkle: 4 },
    { id: 'scholar', name: 'Scholar', desc: 'A soft shimmer and a warm glow. Pass Jonny\'s Exam.', code: 2, dim: 0.1, shine: 0, shimmer: 0.24, halo: ['#FFF0C8', 0.26] },
    { id: 'sunrise', name: 'Sunrise', desc: 'A warm morning glow. Play the Daily Challenge 7 days in a row.', code: 0, dim: 0, shine: 0, shimmer: 0, halo: ['#FFE6CC', 0.3], sparkle: 1 },
    { id: 'eclipse', name: 'Eclipse', desc: 'A pale corona with glints. Play the Daily Challenge 30 days in a row.', code: 1, dim: 0.12, shine: 0.26, shimmer: 0, halo: ['#E8ECFF', 0.32], sparkle: 3 },
  ];
  // Build Mastery ★★★: eine Aura pro Build. Der Schein bleibt fast weiß (Material-Regel: nur Licht, keine Farbe),
  // mit einem Hauch der Build-Farbe: so viel Weiß dazu, bis die Kanäle höchstens 60 auseinander und alle über 180 liegen.
  const neutralTint = (hex) => { for (let k = 0.55; k < 1; k += 0.02) { const h = mixWhite(hex, k), c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); if (Math.max(...c) - Math.min(...c) <= 60 && Math.min(...c) >= 180) return h; } return '#FFFFFF'; };
  const mixWhite = (hex, k) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - k) + 255 * k).toString(16).padStart(2, '0')).join('');
  const TAGS = (global.WG && global.WG.TAGS) || {};
  for (const [tag, t] of Object.entries(TAGS)) MATERIALS.push({ id: 'aura_' + tag, name: t.name + ' Aura', desc: 'A soft glow in the ' + t.name + ' colour. Build Mastery: 3 stars.', code: 0, dim: 0, shine: 0, shimmer: 0, halo: [neutralTint(t.colour), 0.3], sparkle: 2 });
  const MATERIAL_BY_ID = Object.fromEntries(MATERIALS.map((m) => [m.id, m]));

  // Farbfelder des Colour Studio: Grundfarben ab Start, Sonderfarben per Freischaltung
  const SWATCHES = ['#C9473A', '#E07A2E', '#E3BE62', '#5DBB63', '#1F7A62', '#1FA8A0', '#2E6FB0', '#27408B', '#6B4F92', '#A8497A', '#D98AA0', '#7A5A3A', '#2F6B52', '#4A463A', '#8A8A8A', '#141E19'];
  const SPECIAL_SWATCHES = [
    { id: 'gold_leaf', name: 'Gold Leaf', hex: '#D4AF37', anim: 'shimmer' }, { id: 'emerald', name: 'Emerald', hex: '#0F9D58' },
    { id: 'mustard', name: 'Jonny Mustard', hex: '#E7B23C' }, { id: 'bone', name: 'Bone', hex: '#E8DFC8' },
    { id: 'blood_moon', name: 'Blood Moon', hex: '#7E1B1B' }, { id: 'midnight', name: 'Midnight', hex: '#101A3F' },
    { id: 'ice', name: 'Ice', hex: '#A8E0F0' }, { id: 'rose', name: 'Rose Quartz', hex: '#E8B4C0' },
    { id: 'copper', name: 'Copper', hex: '#B8683A' }, { id: 'abyss', name: 'Abyss', hex: '#06222B' },
    { id: 'prism', name: 'Prism', hex: '#FF66CC', anim: 'prism' },
  ];
  // Build Mastery ★: die Farbe jedes Builds (eigener Farbwert, falls ein Grundfeld schon genauso aussieht)
  const used = new Set(SWATCHES.concat(SPECIAL_SWATCHES.map((x) => x.hex)).map((h) => h.toUpperCase()));
  for (const [tag, t] of Object.entries(TAGS)) {
    let hex = t.colour.toUpperCase();
    while (used.has(hex)) hex = '#' + hex.slice(1, 5) + Math.min(255, parseInt(hex.slice(5, 7), 16) + 3).toString(16).padStart(2, '0').toUpperCase();
    used.add(hex);
    SPECIAL_SWATCHES.push({ id: 'build_' + tag, name: t.name + ' Mastery', hex });
  }
  const SWATCH_BY_ID = Object.fromEntries(SPECIAL_SWATCHES.map((s) => [s.id, s]));
  const swatchByHex = (hex) => SPECIAL_SWATCHES.find((s) => s.hex === hex) || null;

  // Wie viele Farben ein Hintergrund-Stil nutzt: 2 = Primär/Sekundär, 3 = + Tiefe, 4 = + Extra-Ebene
  const STYLE_COLOURS = { swirl: 3, lava: 3, tide: 3, pips: 4, kaleido: 4, felt: 2, embers: 4, starfield: 4, checker: 3 };
  const STYLE_FOURTH = { pips: 'Pips', kaleido: 'Facets', embers: 'Sparks', starfield: 'Stars' };

  function cosmetics(m) { if (!m.cosmetics) m.cosmetics = {}; return m.cosmetics; }
  function grant(m, kind, id) { const c = cosmetics(m), k = key(kind, id); if (c[k]) return false; c[k] = Date.now(); return true; }
  // Frei, einzeln vergeben oder Belohnung eines erreichten Achievements. Was nirgends vergeben wird, bleibt gesperrt.
  function isOwned(m, ach, kind, id) {
    const k = key(kind, id);
    if (FREE.has(k)) return true;
    if (!m) return false;
    if (m.cosmetics && m.cosmetics[k]) return true;
    return !!ach && ach.LOCKED.has(k) && ach.isOpen(m, kind, id);
  }

  // Looks, die Challenges vergeben (challenges.js): Build-Farben, Auren, Challenge- und Daily-Materialien
  const CHALLENGE = new Set(['material:champion', 'material:scholar', 'material:sunrise', 'material:eclipse']
    .concat(Object.keys(TAGS).flatMap((t) => ['swatch:build_' + t, 'material:aura_' + t])));
  const api = { CHALLENGE, FREE, FACE_STYLE, MATERIALS, MATERIAL_BY_ID, SWATCHES, SPECIAL_SWATCHES, SWATCH_BY_ID, swatchByHex, STYLE_COLOURS, STYLE_FOURTH, key, grant, isOwned };
  global.WGCosmetics = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
