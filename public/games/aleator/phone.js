// Aleator – das Telefon nach jedem Showdown (Regeln ohne Grafik). window.WGPhone
// Nach jedem gewonnenen Showdown klingelt es. Wer abhebt, sieht sofort drei verschiedene Vorteile und nimmt einen davon.
// Vorteile gelten für den ganzen Run, haben nur gute Seiten und werden ohne Zahlen beschrieben.
// Mehrfach genommen stapeln sie sich mit leicht abnehmender Wirkung, und was man schon hat, wird etwas seltener angeboten.
// Das Spiel (game.js) zeigt den Anruf an und fragt hier die Stärken ab; Tests und Simulator nutzen dieselben Werte.
((global) => {
  'use strict';

  // Wirkung der k-ten Kopie (k = 0, 1, 2, ...): 1, 0,8, 0,67, 0,57, ...
  const DECAY = 0.25;
  // Angebots-Gewicht: 1 / (1 + OWNED_FADE * Anzahl). Nie genommen = alle gleich wahrscheinlich.
  const OWNED_FADE = 0.5;
  const OFFER = 3;
  // Der Anrufer bleibt unbekannt (später: Jonnys Vater, erst nach Jonnys Niederlage benannt)
  const CALLER = 'Unknown Caller';

  // icon: Name aus card-icons.js oder face: Augenzahl(en) für ein kleines Würfelbild
  // group: nur zum Sortieren in Codex und Übersicht
  const LIST = [
    { id: 'luck', name: 'Four-Leaf', text: 'You will be luckier.', colour: '#2E8B57', icon: 'clover', group: 'luck' },
    { id: 'high', name: 'High Noon', text: 'High numbers will find you more often.', colour: '#D9682B', face: [4, 5, 6], group: 'dice' },
    { id: 'low', name: 'Low Tide', text: 'Low numbers will find you more often.', colour: '#3A6F8F', face: [1, 2, 3], group: 'dice' },
    { id: 'even', name: 'Even Keel', text: 'Even numbers will feel at home with you.', colour: '#3C7BD0', face: [2, 4, 6], group: 'dice' },
    { id: 'odd', name: 'Odd Company', text: 'Odd numbers will follow you around.', colour: '#3E9E78', face: [1, 3, 5], group: 'dice' },
    { id: 'sixes', name: 'Boxcars', text: 'Sixes will come a little easier.', colour: '#C2453E', face: [6], group: 'dice' },
    { id: 'ones', name: 'Snake Charmer', text: 'Ones will bother you less.', colour: '#7E8A2B', face: [1], group: 'dice' },
    { id: 'faces', name: 'Strange Faces', text: 'Special faces will turn up more often.', colour: '#9A5FD0', icon: 'refraction', group: 'dice' },
    { id: 'wilds', name: "Joker's Grin", text: 'Wild faces will show up more often.', colour: '#8867A5', icon: 'chameleon', group: 'dice' },
    { id: 'skulls', name: 'Skull Ward', text: 'Skulls will look the other way.', colour: '#5A2A3A', icon: 'grave_digger', group: 'dice' },
    { id: 'cool', name: 'Cool Head', text: 'The house will watch you less closely.', colour: '#2F8F9D', icon: 'cold_storage', group: 'table' },
    { id: 'fresh', name: 'Second Wind', text: 'Your hands will tire more slowly.', colour: '#56A887', icon: 'slow_steady', group: 'table' },
    { id: 'steady', name: 'Steady Hands', text: 'Now and then you will get an extra reroll.', colour: '#D99A2B', icon: 'whirlwind', group: 'table' },
    { id: 'links', name: 'Tight Formation', text: 'Your Links will hit harder.', colour: '#C2577E', icon: 'chain_reaction', group: 'table' },
    { id: 'soft', name: 'Soft Spot', text: 'Bosses will ask a little less of you.', colour: '#6B4F92', icon: 'black_cat', group: 'boss' },
    { id: 'bounty', name: 'Bounty Hunter', text: 'Bosses will pay you better.', colour: '#8F2D3B', icon: 'trophy_case', group: 'boss' },
    { id: 'pay', name: 'Deep Pockets', text: 'Every win will pay a little more.', colour: '#C9A13B', icon: 'tip_jar', group: 'money' },
    { id: 'savings', name: 'Nest Egg', text: 'Your savings will grow faster.', colour: '#B58A2A', icon: 'piggy_bank', group: 'money' },
    { id: 'regular', name: 'Regular', text: 'Shopkeepers will give you a better price.', colour: '#4D8FD0', icon: 'market_day', group: 'money' },
    { id: 'restock', name: 'Fresh Stock', text: 'The shop will reroll for free now and then.', colour: '#3E9E58', icon: 'shuffleboard', group: 'money' },
  ];
  const BY_ID = Object.fromEntries(LIST.map((b) => [b.id, b]));

  // Kurze Zeilen des Anrufers: kein Dialog, nur ein Satz über den drei Karten
  const LINES = [
    "Don't talk. Just pick one.",
    'Nice Showdown. Pick one before I change my mind.',
    "You don't know me. That's fine. Choose.",
    "I've been watching your table. Take one.",
    'Three things. One is yours. Quick.',
    "Off the record: you're doing better than most.",
    "The kid at the counter still overcharging you? Thought so. Pick.",
    'Same time next stage. Choose.',
    "Don't tell anyone I called.",
    "I had a good feeling about that last roll. Here.",
    "No small talk. I'm paying by the minute.",
    'Still standing. Good. Pick one.',
    'I know this table better than anyone. Trust me.',
    'Listen close. I only say it once.',
  ];
  const FIRST_LINE = "Don't hang up. I've got something for you. Pick one.";

  // Gesamtwirkung von n Kopien in "Einheiten": 1 -> 1, 2 -> 1,8, 3 -> 2,47, 4 -> 3,04
  function units(n) {
    let u = 0;
    for (let k = 0; k < (n || 0); k++) u += 1 / (1 + DECAY * k);
    return u;
  }
  const u = (owned, id) => units((owned || {})[id] || 0);
  const count = (owned) => Object.values(owned || {}).reduce((a, b) => a + b, 0);

  // Drei verschiedene Vorteile. can(def): passt er gerade (z. B. Links nur mit Formation)?
  function offer(owned, rnd = Math.random, can = () => true) {
    let pool = LIST.filter((b) => can(b)).map((b) => [b.id, 1 / (1 + OWNED_FADE * ((owned || {})[b.id] || 0))]);
    const out = [];
    while (out.length < OFFER && pool.length) {
      const sum = pool.reduce((s, [, w]) => s + w, 0);
      let r = rnd() * sum, k = pool.length - 1;
      for (let i = 0; i < pool.length; i++) { r -= pool[i][1]; if (r <= 0) { k = i; break; } }
      out.push(pool[k][0]);
      pool = pool.filter((_, i) => i !== k);
    }
    return out;
  }
  const line = (owned, rnd = Math.random) => (count(owned) ? LINES[Math.floor(rnd() * LINES.length)] : FIRST_LINE);

  // ── Wirkungen ─────────────────────────────────────────────────────────────
  // Würfel: Gewicht pro Seite beim Werfen (1 = normal). null, wenn kein Würfel-Vorteil da ist (dann bleibt alles exakt wie ohne Telefon).
  const SPECIAL = ['gold', 'mult', 'bonus', 'prism', 'wild'];
  function faceWeight(owned) {
    const g = (id) => u(owned, id);
    const W = { high: g('high'), low: g('low'), even: g('even'), odd: g('odd'), sixes: g('sixes'), ones: g('ones'), faces: g('faces'), wilds: g('wilds'), skulls: g('skulls') };
    if (!Object.values(W).some((x) => x > 0)) return null;
    return (f) => {
      if (f.kind === 'skull' || f.kind === 'hex') return 1 / (1 + 0.6 * W.skulls) * (f.kind === 'hex' ? 1 + 0.8 * W.wilds : 1);
      let w = 1;
      const v = f.v;
      if (f.kind !== 'wild' && v) {
        if (v >= 4) w += 0.4 * W.high; else w += 0.4 * W.low;
        if (v % 2 === 0) w += 0.4 * W.even; else w += 0.4 * W.odd;
        if (v === 6) w += 0.8 * W.sixes;
        if (v === 1) w /= 1 + 0.6 * W.ones;
      }
      if (SPECIAL.includes(f.kind)) w += 0.6 * W.faces;
      if (f.kind === 'wild') w += 0.8 * W.wilds;
      return w;
    };
  }
  const luck = (owned) => Math.round(5 * u(owned, 'luck'));                         // + Luck
  const heatScale = (owned) => 1 / (1 + 0.3 * u(owned, 'cool'));                   // Heat-Zug mal diesem Faktor
  const fatigueScale = (owned) => 1 / (1 + 0.5 * u(owned, 'fresh'));               // Ermüdung mal diesem Faktor
  const rerollChance = (owned) => Math.min(0.85, 0.3 * u(owned, 'steady'));        // Chance auf +1 Reroll pro Hand
  const linkPips = (owned) => Math.round(3 * u(owned, 'links'));                   // + Pips pro Link
  const bossScale = (owned) => 1 / (1 + 0.08 * u(owned, 'soft'));                  // Ziel im Showdown mal diesem Faktor
  const bossPay = (owned) => Math.round(3 * u(owned, 'bounty'));                   // + $ für jeden gewonnenen Showdown
  const roundPay = (owned) => Math.round(u(owned, 'pay'));                         // + $ für jede gewonnene Runde
  const interestCap = (owned) => Math.round(2 * u(owned, 'savings'));              // + Zins-Obergrenze
  const freeRerolls = (owned) => Math.round(u(owned, 'restock'));                  // kostenlose Shop-Rerolls pro Shop
  // Shop-Preis: etwa 10 % pro Einheit, mindestens $1 Nachlass, nie unter $1
  function price(p, owned) {
    const x = u(owned, 'regular');
    if (!x || p <= 1) return p;
    return Math.max(1, p - Math.max(1, Math.round(p * 0.1 * x)));
  }

  const api = { DECAY, OWNED_FADE, OFFER, CALLER, LIST, BY_ID, LINES, FIRST_LINE, units, count, offer, line,
    faceWeight, luck, heatScale, fatigueScale, rerollChance, linkPips, bossScale, bossPay, roundPay, interestCap, freeRerolls, price };
  global.WGPhone = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
