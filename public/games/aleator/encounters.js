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
    { id: 'mystery', name: 'Mystery Cup', who: 'A forgotten cup', colour: '#9A4E2C', tags: ['all'], intro: 'Someone left a dice cup on the table. It rattles a little.', desc: 'Shake an abandoned cup, then nudge one die. A Pair pays, better hands give relics, three Skulls curse you.' },
    { id: 'fortune', name: 'The Fortune Teller', who: 'Madame Zara', colour: '#6B4F92', tags: ['all', 'pattern'], intro: 'I see your Showdown in the smoke. Shall I change your fate?', desc: 'Reveals the Showdown of this stage. Swap it for $3, or turn over face-down cards and keep one Prophecy.' },
    { id: 'backroom', name: 'The Back Room', who: 'Slick Eddie', colour: '#8F2D3B', tags: ['risk', 'bank'], intro: 'Quick game, friend? Best of three. No hard feelings.', desc: 'A dice duel, round by round, with one die up your sleeve. Win, and Eddie offers double or nothing.' },
    { id: 'pawnshop', name: 'The Pawnshop', who: 'Old Mr. Baum', colour: '#B58A2A', tags: ['all'], intro: 'Everything has a price. Even that thing you are holding.', desc: 'Haggle over the price of a relic without annoying Mr. Baum, or see what he offers in trade, one rarity higher.' },
    { id: 'lost', name: 'Lost & Found', who: 'A dusty box', colour: '#7A5A3A', tags: ['bag'], intro: 'A box marked "unclaimed". Nobody is watching.', desc: 'Take one of three dice for free, dig deeper for a new selection, or hand in up to two of yours for $2 each.' },
    { id: 'well', name: 'The Wishing Well', who: 'An old well', colour: '#3A6F8F', tags: ['number', 'luck'], intro: 'The water is very deep and very patient.', desc: 'Sacrifice a die to raise its most common number, or drop a coin at the right moment for up to +9 Luck this stage.' },
    { id: 'spring', name: 'Cooling Spring', who: 'A cold spring', colour: '#2F8F9D', tags: ['all'], intro: 'The air is cool here. Your hands stop shaking.', desc: 'One gulp halves the Heat of the next round for free. A second clears it, at the cost of 1 reroll per hand.' },
    { id: 'chalk', name: 'Chalk Lines', who: 'A chalk board', colour: '#56A887', tags: ['formation'], intro: 'Someone drew the perfect formation. You could copy it.', desc: 'This stage: +1 Shift per hand, or stronger Links. Trace the line perfectly in time and it lasts one more stage.' },
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

  // ── Mini-Spiele: reine Regeln, die Darstellung steht in game.js ─────────
  // Mystery Cup: ein einzelner Würfel nachwerfen
  const mysteryDie = (rnd = Math.random) => (rnd() < 1 / 8 ? 0 : 1 + Math.floor(rnd() * 6));
  const MYSTERY_TEXT = { cursed: 'A Cursed Die', legendary: 'A Legendary relic', upgrade: 'A free upgrade', relic: 'A relic', money: '$3', none: 'Nothing' };
  // Back Room: jede Runde einzeln, damit man dazwischen entscheiden kann
  const d6 = (rnd = Math.random) => 1 + Math.floor(rnd() * 6);
  const duelJudge = (me, them, winTies) => (me > them || (me === them && winTies) ? 'win' : me === them ? 'tie' : 'lose');
  const SLEEVE_CAUGHT = 1 / 6;
  // Pawnshop: Mr. Baum beginnt knapp unter dem Listenpreis. Jeder Versuch ist riskanter; ein Fehlschlag verdirbt die Laune.
  const HAGGLE_ODDS = [0.8, 0.55, 0.3];
  const startOffer = (cost) => Math.max(1, cost - 1);
  const haggleOk = (n, rnd = Math.random) => n < HAGGLE_ODDS.length && rnd() < HAGGLE_ODDS[n];
  // Wishing Well: pos ist -1..1, 0 ist genau über dem Schacht
  function wellGrade(pos) {
    const d = Math.abs(pos);
    return d < 0.14 ? { grade: 'perfect', luck: 9 } : d < 0.45 ? { grade: 'good', luck: 5 } : { grade: 'poor', luck: 2 };
  }
  // Fortune Teller: drei verdeckte Karten, eine davon vergoldet
  function dealCards(hands, ante, rnd = Math.random) {
    const gilded = Math.floor(rnd() * hands.length);
    return hands.map((hand, i) => ({ hand, power: prophecyPower(ante) + (i === gilded ? 3 : 0), gilded: i === gilded, up: false }));
  }
  const flipCost = (flipped) => flipped;   // erste Karte gratis, dann $1, dann $2
  const DIG_COST = [1, 2];
  // Chalk Lines: Punkte auf einem groben Raster (0..1), damit sie sich nicht überlappen
  const CHALK_TIME = 7;
  function chalkPoints(n = 5, rnd = Math.random) {
    const cells = [];
    for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) cells.push([x, y]);
    for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
    return cells.slice(0, n).map(([x, y]) => ({ x: (x + 0.25 + rnd() * 0.5) / 4, y: (y + 0.25 + rnd() * 0.5) / 3 }));
  }

  const api = { mysteryDie, MYSTERY_TEXT, d6, duelJudge, SLEEVE_CAUGHT, HAGGLE_ODDS, startOffer, haggleOk, wellGrade, dealCards, flipCost, DIG_COST, CHALK_TIME, chalkPoints, LIST, BY_ID, COUNT, FROM_STAGE, MIN_PER_RUN, LAST_STAGE, CHANCE, shouldOffer, pick, mysteryRoll, mysteryOutcome, duel, prophecyPower, NEXT_RARITY, TRADE_FEE, topFace, groupBag };
  global.WGEncounters = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
