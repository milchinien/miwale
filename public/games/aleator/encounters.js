// Aleator – Begegnungen zwischen den Runden (Regeln ohne Grafik). window.WGEncounters
// Eine Begegnung kommt nach Warm-up oder High Stakes und danach geht es normal in den Shop. Das Spiel (game.js) zeigt sie an
// und setzt die Wahl um; hier stehen Häufigkeit, Auswahl und alle Zufallsergebnisse, damit Tests und Simulator sie nutzen können.
((global) => {
  'use strict';
  const FROM_STAGE = 2, MIN_PER_RUN = 2, LAST_STAGE = 8;
  // Zwei Gelegenheiten pro Stage: zusammen 1 - 0,75 * 0,8 = 40 %
  const CHANCE = [0.25, 0.2];
  const OWNED_SHARE = 0.6;   // so oft kommt eine Begegnung, die zu den eigenen Tags passt

  const LIST = [
    { id: 'mystery', name: 'Mystery Cup', who: 'A forgotten cup', colour: '#9A4E2C', tags: ['all'], intro: 'Someone left a dice cup on the table. It rattles a little.', desc: 'Roll 5 dice from an abandoned cup. A Pair pays, better hands give relics, three Skulls curse you.' },
    { id: 'fortune', name: 'The Fortune Teller', who: 'Madame Zara', colour: '#6B4F92', tags: ['all', 'pattern'], intro: 'I see your Showdown in the smoke. Shall I change your fate?', desc: 'Reveals the Showdown of this stage. Swap it for $3, or take a Prophecy that boosts one hand type three times.' },
    { id: 'backroom', name: 'The Back Room', who: 'Slick Eddie', colour: '#8F2D3B', tags: ['risk', 'bank'], intro: 'Quick game, friend? Best of three. No hard feelings.', desc: 'A dice duel for $2, $5 or $10. With a Risk relic you win every tie.' },
    { id: 'pawnshop', name: 'The Pawnshop', who: 'Old Mr. Baum', colour: '#B58A2A', tags: ['all'], intro: 'Everything has a price. Even that thing you are holding.', desc: 'Sell a relic at full price, or pay a fee to trade it for a random relic of the same tag, one rarity higher.' },
    { id: 'lost', name: 'Lost & Found', who: 'A dusty box', colour: '#7A5A3A', tags: ['bag'], intro: 'A box marked "unclaimed". Nobody is watching.', desc: 'Take one of three dice for free, or hand in up to two of yours for $2 each.' },
    { id: 'well', name: 'The Wishing Well', who: 'An old well', colour: '#3A6F8F', tags: ['number', 'luck'], intro: 'The water is very deep and very patient.', desc: 'Sacrifice a die to raise its most common number by one level, or throw in $3 for +5 Luck this stage.' },
    { id: 'spring', name: 'Cooling Spring', who: 'A cold spring', colour: '#2F8F9D', tags: ['all'], intro: 'The air is cool here. Your hands stop shaking.', desc: 'Next round the Heat falls to the normal target, but you have 1 reroll less per hand in that round.' },
    { id: 'chalk', name: 'Chalk Lines', who: 'A chalk board', colour: '#56A887', tags: ['formation'], intro: 'Someone drew the perfect formation. You could copy it.', desc: 'This stage: +1 Shift per hand, or Links give +8 Pips instead of +4.' },
  ];
  const BY_ID = Object.fromEntries(LIST.map((e) => [e.id, e]));
  const COUNT = LIST.length;

  // Kommt jetzt eine? finishedBlind: 0 = Warm-up, 1 = High Stakes. seen: Anzahl im Run, lastStage: Stage der letzten Begegnung.
  function shouldOffer(q, rnd = Math.random) {
    if (q.finishedBlind !== 0 && q.finishedBlind !== 1) return false;
    if (q.ante < FROM_STAGE || q.lastStage === q.ante || q.seen >= COUNT) return false;
    // Mindestens zwei pro Run: Wenn die verbleibenden Stages sonst nicht mehr reichen, ist die letzte Gelegenheit sicher
    if (q.finishedBlind === 1 && q.ante <= LAST_STAGE && q.seen < MIN_PER_RUN && LAST_STAGE - q.ante + 1 <= MIN_PER_RUN - q.seen) return true;
    return rnd() < CHANCE[q.finishedBlind];
  }
  const fits = (e, tags) => e.tags.some((t) => t !== 'all' && (tags[t] || 0) > 0);
  // Meist etwas Passendes, manchmal ein Schubs zu anderen Builds. can(e): ist sie gerade überhaupt sinnvoll?
  function pick(tags, seen, rnd = Math.random, can = () => true) {
    const pool = LIST.filter((e) => !seen.includes(e.id) && can(e));
    if (!pool.length) return null;
    const mine = pool.filter((e) => fits(e, tags)), other = pool.filter((e) => !fits(e, tags));
    const from = rnd() < OWNED_SHARE ? (mine.length ? mine : other) : (other.length ? other : mine);
    return from[Math.floor(rnd() * from.length)];
  }

  // Mystery Cup: 5 Würfel, jeder ist mit 1/8 ein Schädel (0)
  function mysteryRoll(rnd = Math.random) {
    return Array.from({ length: 5 }, () => (rnd() < 1 / 8 ? 0 : 1 + Math.floor(rnd() * 6)));
  }
  function mysteryOutcome(vals) {
    if (vals.filter((v) => v === 0).length >= 3) return 'cursed';
    const c = {};
    vals.forEach((v) => { if (v) c[v] = (c[v] || 0) + 1; });
    const counts = Object.values(c), best = Math.max(0, ...counts), keys = Object.keys(c).map(Number).sort((a, b) => a - b);
    if (best >= 5) return 'legendary';
    if (keys.length === 5 && keys[4] - keys[0] === 4) return 'upgrade';
    if (best >= 3) return 'relic';
    return best >= 2 ? 'money' : 'none';
  }

  // The Back Room: Best of 3, je ein Würfel. Gleichstand wird neu geworfen; mit einem Risk-Relikt (winTies) gewinnt man ihn.
  function duel(rnd = Math.random, winTies = false) {
    const d6 = () => 1 + Math.floor(rnd() * 6), rounds = [];
    let me = 0, them = 0;
    while (me < 2 && them < 2) {
      let a, b;
      do { a = d6(); b = d6(); } while (a === b && !winTies);
      const won = a > b || (a === b && winTies);
      rounds.push({ me: a, them: b, won });
      if (won) me++; else them++;
    }
    return { rounds, won: me === 2 };
  }

  const prophecyPower = (ante) => 3 + ante;
  const NEXT_RARITY = { C: 'U', U: 'R', R: 'L' };
  const TRADE_FEE = { C: 2, U: 4, R: 6 };

  // Häufigste Zahl eines Würfels (bei Gleichstand die höchste); Schädel, Wild und Hex zählen nicht
  function topFace(die) {
    const c = {};
    die.faces.forEach((f) => { if (f.v && !['skull', 'wild', 'hex'].includes(f.kind)) c[f.v] = (c[f.v] || 0) + 1; });
    const v = Object.keys(c).map(Number).sort((a, b) => c[b] - c[a] || b - a)[0];
    return v || null;
  }
  // Würfel im Beutel nach Typ; pro Typ wird der schwächste (ohne dauerhaften Bonus) zuerst genommen
  function groupBag(bag) {
    const groups = {};
    bag.forEach((d) => { (groups[d.type] = groups[d.type] || []).push(d); });
    return Object.entries(groups).map(([type, list]) => ({ type, n: list.length, die: list.slice().sort((a, b) => (a.chips || 0) - (b.chips || 0))[0] }));
  }

  const api = { LIST, BY_ID, COUNT, FROM_STAGE, MIN_PER_RUN, LAST_STAGE, CHANCE, shouldOffer, pick, mysteryRoll, mysteryOutcome, duel, prophecyPower, NEXT_RARITY, TRADE_FEE, topFace, groupBag };
  global.WGEncounters = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
