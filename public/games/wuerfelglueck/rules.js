// Würfelglück – Spielregeln und Daten (ohne Grafik, auch in Node testbar)
(function (global) {
  'use strict';

  // ── Handarten ───────────────────────────────────────────────────────────
  // base: [Chips, Mult] auf Stufe 1, level: Zuwachs pro Stufe
  const HANDS = {
    'Five of a Kind': { base: [100, 10], level: [35, 3], star: 'Pleiades' },
    'Four of a Kind': { base: [60, 7], level: [30, 3], star: 'Crux' },
    'Large Straight': { base: [50, 7], level: [30, 3], star: 'Draco' },
    'Full House': { base: [40, 4], level: [25, 2], star: 'Taurus' },
    'Small Straight': { base: [30, 3], level: [25, 2], star: 'Lyra' },
    'Three of a Kind': { base: [30, 3], level: [20, 2], star: 'Triangulum' },
    'Two Pair': { base: [20, 2], level: [20, 1], star: 'Pisces' },
    Pair: { base: [10, 2], level: [15, 1], star: 'Gemini' },
    Chance: { base: [5, 1], level: [10, 1], star: 'Comet' },
  };
  const HAND_ORDER = Object.keys(HANDS);

  function handValues(name, levels) {
    const h = HANDS[name], lv = (levels && levels[name]) || 1;
    return [h.base[0] + h.level[0] * (lv - 1), h.base[1] + h.level[1] * (lv - 1)];
  }

  // ── Würfelseiten ────────────────────────────────────────────────────────
  // kind: normal | wild | gold | mult | bonus | skull | hex (Schädel + Wild) | prism (Gold + Mult + Bonus) | twin (v oder 7-v)
  const FACE_KINDS = {
    normal: { name: 'Normal' },
    wild: { name: 'Wild', desc: 'Counts as any number' },
    gold: { name: 'Gold', desc: 'Earn $2 when scored' },
    mult: { name: 'Power', desc: '+4 Power when scored' },
    bonus: { name: 'Bonus', desc: '+30 Pips when scored' },
    skull: { name: 'Skull', desc: 'No number. x1.5 Power while in your hand. 3 Skulls = Bust' },
    hex: { name: 'Hex', desc: 'A Skull that also counts as Wild' },
    prism: { name: 'Prism', desc: 'Counts as Gold, Power and Bonus. Cracks after 3 scores' },
    twin: { name: 'Two-Faced', desc: 'Shows two numbers and uses the better one' },
  };
  const face = (v, kind = 'normal') => ({ v, kind });
  const isSkull = (f) => f.kind === 'skull' || f.kind === 'hex';

  // ── Würfeltypen (für den Beutel) ────────────────────────────────────────
  const DIE_TYPES = {
    standard: { name: 'Standard Die', cost: 3, edge: null, faces: [1, 2, 3, 4, 5, 6].map((v) => face(v)), weight: 2 },
    loaded: { name: 'Loaded Die', cost: 5, edge: '#C2453E', faces: [1, 1, 6, 6, 6, 6].map((v) => face(v)), weight: 3 },
    even: { name: 'Even Die', cost: 4, edge: '#3C7BD0', faces: [2, 2, 4, 4, 6, 6].map((v) => face(v)), weight: 3 },
    odd: { name: 'Odd Die', cost: 4, edge: '#3E9E78', faces: [1, 1, 3, 3, 5, 5].map((v) => face(v)), weight: 3 },
    lucky: { name: 'Lucky Die', cost: 6, edge: '#8867A5', faces: [face(1), face(2), face(3), face(4), face(5), face(6, 'wild')], weight: 2 },
    gilded: { name: 'Gilded Die', cost: 5, edge: '#D99A2B', faces: [face(1, 'gold'), face(2, 'gold'), face(3), face(4), face(5), face(6)], weight: 2 },
    cursed: { name: 'Cursed Die', cost: 4, edge: '#5A2A3A', faces: [face(6), face(6), face(6), face(3, 'skull'), face(4, 'skull'), face(1)], weight: 2 },
    twofaced: { name: 'Two-Faced Die', cost: 5, edge: '#2F8F9D', faces: [1, 2, 3, 4, 5, 6].map((v) => face(v, 'twin')), weight: 2 },
    // Nur aus dem High Roller Cup, nicht im Shop (weight 0)
    high: { name: 'High Die', cost: 4, edge: '#1D5FA8', faces: [4, 4, 5, 5, 6, 6].map((v) => face(v)), weight: 0 },
  };
  let dieSeq = 0;
  function makeDie(type) {
    return { id: ++dieSeq, type, chips: 0, faces: DIE_TYPES[type].faces.map((f) => ({ ...f })) };
  }
  const copyDie = (d) => ({ id: ++dieSeq, type: d.type, chips: d.chips || 0, faces: d.faces.map((f) => ({ ...f })) });

  // ── Build-Tags und Set-Boni ─────────────────────────────────────────────
  const TAGS = {
    bank: { name: 'Bank', emoji: '🏦', colour: '#C9A13B', s3: '+$3 interest cap', s5: 'Interest is also paid after every hand' },
    number: { name: 'Number', emoji: '🔢', colour: '#3C7BD0', s3: 'Your top number gets +1 level', s5: 'Scored dice of your top number retrigger' },
    pattern: { name: 'Pattern', emoji: '🧩', colour: '#6B4F92', s3: '+1 level to your most played hand every stage', s5: 'Your most played hand gives x2 Power' },
    luck: { name: 'Luck', emoji: '🍀', colour: '#2E8B57', s3: '+10 Luck', s5: 'Lucky Hits give +5 Power' },
    risk: { name: 'Risk', emoji: '💀', colour: '#8F2D3B', s3: 'Bust limit +1', s5: 'Busts still score half' },
    reroll: { name: 'Reroll', emoji: '🎲', colour: '#D9682B', s3: '+1 reroll per hand', s5: 'Every 3rd reroll is free' },
    hold: { name: 'Hold', emoji: '⚓', colour: '#3A6F8F', s3: 'Anchor 1 extra die', s5: 'Held dice give +10 Pips' },
    bag: { name: 'Bag', emoji: '🎒', colour: '#7A5A3A', s3: 'Bag limit +2', s5: '+1 Power per die in your bag' },
    growth: { name: 'Growth', emoji: '🌱', colour: '#56A887', s3: 'Growing relics grow 50% faster', s5: 'Growing relics never reset' },
  };
  const TAG_ORDER = Object.keys(TAGS);
  const RARITY = { C: { name: 'Common', colour: '#4D8FD0', weight: 60 }, U: { name: 'Uncommon', colour: '#3E9E58', weight: 32 }, R: { name: 'Rare', colour: '#D04848', weight: 10 }, L: { name: 'Legendary', colour: '#9A5FD0', weight: 1.5 } };
  const RARITY_RANK = { C: 0, U: 1, R: 2, L: 3 };
  const PRICE = { C: 5, U: 6, R: 8, L: 12 };

  // ── Relikte ─────────────────────────────────────────────────────────────
  // Wertung:  perDie(d, h, s) – pro gewertetem Würfel (d = {i, v, f, held, ex}) · onHand(h, s) – pro Hand
  //           luck(s, g) – Beitrag zu Luck. Rückgabe: {chips|mult|xmult|money|text} oder ein Array davon.
  // Ereignisse (das Spiel ruft sie auf, g = Spielzustand): startBlind, newHand, beforeHand, afterHand(s, g, res),
  //           beforeReroll, onReroll(s, g, info), endBlind, leaveShop, anteStart, onLevelUp, onDestroy
  //           Rückgabe: {text, money, transform, levelUp} oder nichts.
  // Wachsende Relikte nutzen g.grow (1 oder 1.5) und g.keep (setzt nicht zurück).
  const fmt = (x) => (Math.abs(x - Math.round(x)) < 0.01 ? String(Math.round(x)) : x.toFixed(2).replace(/0$/, ''));
  const RELICS = [];
  function relic(id, name, rarity, tags, emoji, desc, extra = {}) {
    const def = Object.assign({ id, name, rarity, tags, emoji, desc, cost: PRICE[rarity], colour: tags.length ? TAGS[tags[0]].colour : '#4F6367' }, extra);
    RELICS.push(def);
    return def;
  }

  // Bestehende Relikte (teilweise umbenannt / überarbeitet)
  relic('snake_eyes', 'Snake Eyes', 'C', ['number'], '🐍', 'Scored 1s are worth 11 Pips instead of 1', { cost: 4,
    perDie: (d) => (d.v === 1 ? { chips: 10 } : null) });
  relic('evens_club', 'Evens Club', 'C', ['number'], '⚖️', 'Each scored even die gives +4 Power',
    { perDie: (d) => (d.v % 2 === 0 ? { mult: 4 } : null) });
  relic('odd_fellow', 'Odd Fellow', 'C', ['number'], '🎩', 'Each scored odd die gives +25 Pips',
    { perDie: (d) => (d.v % 2 === 1 ? { chips: 25 } : null) });
  relic('big_six', 'Big Six', 'C', ['number'], '6️⃣', 'Each scored 6 gives +6 Power',
    { perDie: (d) => (d.v === 6 ? { mult: 6 } : null) });
  relic('clover', 'Four-Leaf Clover', 'U', ['luck'], '🍀', '+10 Luck. Every Lucky Hit this hand gives +3 Power',
    { luck: () => 10, onHand: (h) => (h.lucky > 0 ? { mult: 3 * h.lucky } : null) });
  relic('twin_peaks', 'Twin Peaks', 'C', ['pattern'], '⛰️', '+8 Power if the hand contains a Pair', { cost: 4,
    onHand: (h) => (h.maxCount >= 2 ? { mult: 8 } : null) });
  relic('triple_threat', 'Triple Threat', 'U', ['pattern'], '🔱', 'x2 Power if the hand contains Three of a Kind',
    { onHand: (h) => (h.maxCount >= 3 ? { xmult: 2 } : null) });
  relic('stairway', 'Stairway', 'U', ['pattern'], '📶', 'x2 Power on a Small Straight, x3 Power on a Large Straight', { cost: 7,
    onHand: (h) => (h.name === 'Large Straight' ? { xmult: 3 } : h.name === 'Small Straight' ? { xmult: 2 } : null) });
  relic('steady_hand', 'Steady Hand', 'U', ['hold'], '✋', 'x2 Power if you did not reroll this hand',
    { onHand: (h) => (h.rerollsHand === 0 ? { xmult: 2 } : null) });
  relic('gambler', 'Gambler', 'U', ['reroll'], '🎲', '+1 Power per reroll used this round',
    { onHand: (h) => (h.rerollsBlind > 0 ? { mult: h.rerollsBlind } : null) });
  relic('loaded', 'Loaded Dice', 'U', ['reroll'], '🎯', 'The first reroll of each hand is free', { freeReroll: true });
  relic('patience', 'Patience', 'C', ['growth', 'hold'], '⏳', 'Gains +1 Power per hand played, loses 1 Power per reroll', {
    state: () => ({ mult: 0 }), stateText: (s) => 'Currently +' + fmt(s.mult) + ' Power',
    beforeHand: (s, g) => { s.mult += g.grow; }, onReroll: (s, g) => { if (!g.keep && s.mult > 0) { s.mult = Math.max(0, s.mult - 1); return { text: '-1 Power' }; } },
    onHand: (h, s) => (s.mult > 0 ? { mult: s.mult } : null) });
  relic('upper_bonus', 'Upper Bonus', 'U', ['number'], '🔝', '+35 Pips if all dice add up to 24 or more',
    { onHand: (h) => (h.sum >= 24 ? { chips: 35 } : null) });
  relic('piggy_bank', 'Piggy Bank', 'C', ['bank'], '🐷', 'Earn $3 at the end of each round',
    { endBlind: () => ({ money: 3 }) });
  relic('last_chance', 'Last Chance', 'C', ['pattern'], '🎟️', 'x3 Power when you play a Chance',
    { onHand: (h) => (h.name === 'Chance' ? { xmult: 3 } : null) });

  // 1. Bank
  relic('compound', 'Compound Interest', 'U', ['bank'], '📈', '+$5 interest cap. Every time you earn max interest, the cap grows by $1 for good', {
    state: () => ({ grow: 0 }), stateText: (s) => 'Cap bonus +$' + (5 + s.grow), capBonus: (s) => 5 + s.grow });
  relic('miser', 'Miser', 'U', ['bank', 'growth'], '🪙', 'x1 Power. Gains x0.2 Power every time you leave the shop without buying anything', {
    state: () => ({ x: 1 }), stateText: (s) => 'Currently x' + fmt(s.x) + ' Power',
    leaveShop: (s, g) => { if (!g.bought) { s.x += 0.2 * g.grow; return { text: 'x' + fmt(s.x) }; } },
    onHand: (h, s) => (s.x > 1 ? { xmult: s.x } : null) });
  relic('market_day', 'Market Day', 'C', ['bank'], '💹', '+1 Power for every $4 you hold',
    { onHand: (h) => (h.money >= 4 ? { mult: Math.floor(h.money / 4) } : null) });
  relic('tip_jar', 'Tip Jar', 'C', ['bank', 'hold'], '🫙', 'Earn $1 for every reroll you leave unused in a hand',
    { onHand: (h) => (h.rerollsLeft > 0 ? { money: h.rerollsLeft } : null) });
  relic('tycoon', 'Tycoon', 'L', ['bank'], '🤵', 'Scored Gold faces give +Power equal to twice your current interest',
    { perDie: (d, h) => ((d.f.kind === 'gold' || d.f.kind === 'prism') && h.interest > 0 ? { mult: 2 * h.interest } : null) });

  // 2. Augenzahl
  relic('favorite', 'Favorite Number', 'C', ['number'], '🎯', 'Picks a number every round. Scored dice showing it give x1.25 Power each', {
    state: () => ({ num: 6 }), stateText: (s) => 'Favorite number: ' + s.num,
    startBlind: (s, g) => { s.num = 1 + Math.floor(g.rnd() * 6); return { text: 'Now: ' + s.num }; },
    perDie: (d, h, s) => (d.v === s.num || (h.has('golden_rule') && (d.f.kind === 'gold' || d.f.kind === 'prism')) ? { xmult: 1.25 } : null) });
  relic('opposites', 'Opposites Attract', 'U', ['number'], '☯️', '+7 Power for every pair of scored dice that adds up to 7', {
    onHand: (h) => {
      const c = {}; h.scoringVals.forEach((v) => { c[v] = (c[v] || 0) + 1; });
      const n = [[1, 6], [2, 5], [3, 4]].reduce((a, [x, y]) => a + Math.min(c[x] || 0, c[y] || 0), 0);
      return n ? { mult: 7 * n } : null;
    } });
  relic('jacobs_ladder', "Jacob's Ladder", 'R', ['number', 'growth'], '🪜', 'Every scored 6 raises a random lower face in your bag by 1 pip, for good', {
    afterHand: (s, g, res) => {
      const n = res.scoring.filter((i) => res.vals[i] === 6).length;
      let up = 0;
      for (let k = 0; k < n; k++) if (raiseFace(g.bag, g.rnd)) up++;
      return up ? { text: '+' + up + ' pip' + (up > 1 ? 's' : ''), bagChanged: true } : null;
    } });
  relic('number_king', 'Number King', 'R', ['number'], '👑', 'xPower equal to half the level of your top number', {
    onHand: (h) => { const x = h.numLevels[h.top] / 2; return x > 1 ? { xmult: x } : null; } });

  // 3. Muster
  relic('signature', 'Signature Move', 'U', ['pattern', 'growth'], '✒️', 'Your most played hand gives x1.5 Power. Gains x0.1 every time you play it', {
    state: () => ({ x: 1.5 }), stateText: (s, g) => 'x' + fmt(s.x) + (g && g.mostPlayed ? ' on ' + g.mostPlayed : ''),
    onHand: (h, s) => (h.isMost ? { xmult: s.x } : null),
    afterHand: (s, g, res) => { if (res.isMost) s.x += 0.1 * g.grow; } });
  relic('encore', 'Encore', 'R', ['pattern'], '🔁', 'Full House scores every die twice');
  relic('gap_jumper', 'Gap Jumper', 'U', ['pattern'], '🦘', 'Straights may skip one number (1-2-4-5-6 counts as a Large Straight)');
  relic('variety', 'Variety Pack', 'U', ['pattern', 'growth'], '🌈', 'Gains x0.25 Power for each different hand type played this stage. Resets every stage', {
    state: () => ({ types: [] }), stateText: (s) => s.types.length + ' types this stage',
    onHand: (h, s, g) => {
      const n = s.types.length + (s.types.includes(h.name) ? 0 : 1);
      return n > 0 ? { xmult: 1 + 0.25 * n * h.grow } : null;
    },
    afterHand: (s, g, res) => { if (!s.types.includes(res.name)) s.types.push(res.name); },
    anteStart: (s, g) => { if (!g.keep) s.types = []; } });
  relic('combo', 'Combo Meter', 'C', ['pattern'], '🥁', '+4 Power for each time in a row you played this hand type. Breaks on a different hand', {
    state: () => ({ hand: null, streak: 0 }), stateText: (s) => (s.hand ? s.hand + ' x' + s.streak : 'No combo yet'),
    onHand: (h, s) => ((h.name === s.hand || comboSafe(h)) && s.streak > 0 ? { mult: 4 * s.streak } : null),
    afterHand: (s, g, res) => {
      if (res.name === s.hand || comboSafe(res.h)) s.streak++;
      else s.streak = 1;
      s.hand = res.name;
    } });
  relic('fusion', 'Fusion', 'R', ['pattern'], '🧬', "Two Pair also gets Pair's level bonus. Full House also gets Three of a Kind's");

  // 4. Glück
  relic('magnet', 'Magnet', 'C', ['luck'], '🧲', '+20 Luck', { luck: () => 20 });
  relic('black_cat', 'Black Cat', 'U', ['luck', 'growth'], '🐈‍⬛', '-20 Luck. Every unlucky reroll gives this relic +2 Pips for good', {
    state: () => ({ chips: 0 }), stateText: (s) => 'Currently +' + fmt(s.chips) + ' Pips', luck: () => -20,
    onReroll: (s, g, info) => { if (!info.lucky) { s.chips += 2 * g.grow; return { text: '+' + fmt(2 * g.grow) + ' Pips' }; } },
    onHand: (h, s) => (s.chips > 0 ? { chips: Math.round(s.chips) } : null) });
  relic('moonstone', 'Moonstone', 'C', ['luck'], '🌙', 'Double Luck during Boss rounds');
  relic('lucky_star', 'Lucky Star', 'R', ['luck', 'bank'], '⭐', 'Every Lucky Hit has a 1 in 4 chance to turn that face into a Gold face');

  // 5. Risiko
  relic('hellfire', 'Hellfire', 'U', ['risk'], '🔥', 'Playing exactly 2 Skulls gives x3 Power',
    { onHand: (h) => (h.skulls === 2 ? { xmult: 3 } : null) });
  relic('grave_digger', 'Grave Digger', 'R', ['risk', 'growth'], '⚰️', 'Every Bust gives this relic x0.5 Power for good', {
    state: () => ({ x: 1 }), stateText: (s) => 'Currently x' + fmt(s.x) + ' Power',
    onHand: (h, s) => (s.x > 1 ? { xmult: s.x } : null),
    afterHand: (s, g, res) => { if (res.bust) { s.x += 0.5 * g.grow; return { text: 'x' + fmt(s.x) }; } } });
  relic('ritual_candle', 'Ritual Candle', 'U', ['risk', 'bank'], '🕯️', 'A Bust no longer scores 0. Instead it destroys one Skull face and earns $10');
  relic('blood_pact', 'Blood Pact', 'R', ['risk'], '🧛', '-1 hand per round. Skulls give x2 Power instead of x1.5');
  relic('hex_bag', 'Hex Bag', 'U', ['risk', 'pattern'], '👝', 'Skulls also count as Wild');

  // 6. Reroll
  relic('recycler', 'Recycler', 'C', ['reroll'], '♻️', 'Every die you reroll gains +3 Pips for this hand (stacks)',
    { perDie: (d) => (d.ex.rerolled > 0 ? { chips: 3 * d.ex.rerolled } : null) });
  relic('whirlwind', 'Whirlwind', 'U', ['reroll'], '🌪️', 'Rerolling all dice at once gives +6 Power for this hand',
    { onHand: (h) => (h.whirls > 0 ? { mult: 6 * h.whirls } : null) });
  relic('roulette', 'Roulette Wheel', 'C', ['reroll', 'bank'], '🎡', 'Every reroll has a 1 in 6 chance to be refunded and earn $2');
  relic('last_call', 'Last Call', 'U', ['reroll', 'pattern'], '⏰', 'Your last reroll of each hand always lands at least a Pair');
  relic('jackpot', 'Jackpot Counter', 'R', ['reroll', 'luck'], '🎰', 'Counts your rerolls. Every 25th reroll lands Five of a Kind', {
    state: () => ({ n: 0 }), stateText: (s) => 'Reroll ' + (s.n % 25) + '/25',
    beforeReroll: (s) => { s.n++; return s.n % 25 === 0 ? { jackpot: true, text: 'JACKPOT!' } : null; } });

  // 7. Halten
  relic('bedrock', 'Bedrock', 'U', ['hold', 'growth'], '🪨', 'Every hand you play with a die held, that die gains +4 Pips for good', {
    afterHand: (s, g) => { g.heldDice.forEach((d) => { d.chips = (d.chips || 0) + 4 * g.grow; }); return g.heldDice.length ? { text: 'Dice +' + fmt(4 * g.grow) + ' Pips' } : null; } });
  relic('slow_steady', 'Slow and Steady', 'C', ['hold'], '🐢', 'x1.15 Power for each die held when you play the hand',
    { onHand: (h) => (h.heldCount ? Array.from({ length: h.heldCount }, () => ({ xmult: 1.15 })) : null) });
  relic('lockbox', 'Lockbox', 'C', ['hold'], '🔒', 'Held dice ignore boss effects');
  relic('cold_storage', 'Cold Storage', 'C', ['hold', 'bank'], '🧊', 'Earn $1 per held die when you reroll (max $3 per hand)');
  relic('monument', 'Monument', 'L', ['hold', 'growth'], '🗿', 'A die anchored for 3 hands in a row copies its up face onto all of its faces');

  // 8. Beutel
  relic('minimalist', 'Minimalist', 'U', ['bag'], '◽', 'x2 Power while your bag holds exactly 5 dice',
    { onHand: (h) => (h.bagSize === 5 ? { xmult: 2 } : null) });
  relic('purist', 'Purist', 'C', ['bag'], '💎', '+15 Pips for each die fewer than 8 in your bag',
    { onHand: (h) => (h.bagSize < 8 ? { chips: 15 * (8 - h.bagSize) } : null) });
  relic('hoarder', 'Hoarder', 'C', ['bag'], '🧺', '+3 Pips for every die in your bag', { onHand: (h) => ({ chips: 3 * h.bagSize }) });
  relic('brood', 'Brood', 'U', ['bag', 'growth'], '🐣', 'After each round, adds a copy of the die you scored with most to your bag');
  relic('collector', "Collector's Set", 'U', ['bag'], '🎨', '+2 Power for each different die type in your bag', { onHand: (h) => ({ mult: 2 * h.bagTypes }) });

  // 9. Wachstum
  relic('seedling', 'Seedling', 'C', ['growth'], '🌱', 'Gains +1 Power every hand. At +15 it blooms: x3 Power for one hand, then starts over', {
    state: () => ({ mult: 0 }), stateText: (s) => 'Currently +' + fmt(s.mult) + ' Power' + (s.mult >= 15 ? ' (blooming!)' : ''),
    beforeHand: (s, g) => { s.mult += g.grow; },
    onHand: (h, s) => [s.mult > 0 ? { mult: Math.round(s.mult) } : null, s.mult >= 15 ? { xmult: 3, text: 'Bloom!' } : null].filter(Boolean),
    afterHand: (s, g) => { if (s.mult >= 15 && !g.keep) s.mult = 0; } });
  relic('snowball', 'Snowball', 'C', ['growth'], '⛄', 'Gains +1 Pip for every die you score. Never resets', {
    state: () => ({ chips: 0 }), stateText: (s) => 'Currently +' + Math.round(s.chips) + ' Pips',
    onHand: (h, s) => (s.chips > 0 ? { chips: Math.round(s.chips) } : null),
    afterHand: (s, g, res) => { s.chips += res.scoring.length * g.grow; } });
  relic('nest_egg', 'Nest Egg', 'C', ['growth', 'bank'], '🪺', 'Its sell value grows by $2 every round', {
    state: () => ({ bonus: 0 }), stateText: (s) => 'Sells for $' + (2 + Math.floor(s.bonus)),
    endBlind: (s, g) => { s.bonus += 2 * g.grow; return { text: 'Value +$' + fmt(2 * g.grow) }; } });
  relic('trophy_case', 'Trophy Case', 'R', ['growth', 'pattern'], '🏆', 'Gains x0.5 Power for every Five of a Kind you score', {
    state: () => ({ x: 1 }), stateText: (s) => 'Currently x' + fmt(s.x) + ' Power',
    onHand: (h, s) => { const x = s.x + (h.name === 'Five of a Kind' ? 0.5 * h.grow : 0); return x > 1 ? { xmult: x } : null; },
    afterHand: (s, g, res) => { if (res.name === 'Five of a Kind') s.x += 0.5 * g.grow; } });
  relic('heirloom', 'Heirloom', 'U', ['growth'], '🕰️', '+2 Power for every round you have owned it', {
    state: () => ({ blinds: 0 }), stateText: (s) => 'Currently +' + fmt(2 * s.blinds) + ' Power',
    onHand: (h, s) => (s.blinds > 0 ? { mult: Math.round(2 * s.blinds) } : null),
    endBlind: (s, g) => { s.blinds += g.grow; } });
  relic('metamorphosis', 'Metamorphosis', 'R', ['growth'], '🐛', 'After 10 hands, turns into a random Rare relic', {
    state: () => ({ hands: 0 }), stateText: (s) => Math.min(10, Math.floor(s.hands)) + '/10 hands',
    afterHand: (s, g) => { s.hands += g.grow; if (s.hands >= 10) return { transform: 'rare', text: 'Metamorphosis!' }; } });

  // Brücken
  relic('golden_rule', 'Golden Rule', 'U', ['bank', 'number'], '✨', 'Gold faces count as your Favorite Number');
  relic('lucky_dividend', 'Lucky Dividend', 'U', ['luck', 'bank'], '🍯', 'Every Lucky Hit earns $1');
  relic('iron_focus', 'Iron Focus', 'U', ['hold', 'pattern'], '🧘', "Combo Meter doesn't break if you held 3 or more dice");
  relic('loaded_skulls', 'Loaded Skulls', 'U', ['risk', 'luck'], '☠️', 'Dice that land on a Skull get a Luck roll to land on another face');

  // Anpassungsfähig
  relic('chameleon', 'Chameleon', 'U', [], '🦎', 'Counts as every tag you already own at least 2 of');
  relic('compass', 'Compass', 'R', [], '🧭', 'Every round, points to your most common tag: +5 Power per relic with that tag', {
    state: () => ({ tag: null }), stateText: (s) => (s.tag ? 'Points to ' + TAGS[s.tag].name : 'Points nowhere yet'),
    startBlind: (s, g) => { s.tag = mostCommonTag(g.relics, ['compass']); return s.tag ? { text: TAGS[s.tag].name } : null; },
    onHand: (h, s) => { if (!s.tag) return null; const n = h.tags[s.tag] || 0; return n ? { mult: 5 * n } : null; } });
  relic('jack', 'Jack of All Trades', 'U', [], '🎴', '+3 Power for every different tag among your relics',
    { onHand: (h) => { const n = Object.keys(h.tags).filter((t) => h.tags[t] > 0).length; return n ? { mult: 3 * n } : null; } });
  relic('mirror', 'Mirror Shard', 'R', [], '🪞', 'Copies the effect and tags of the relic to its left. In the shop you can flip it to the right side for $1', {
    state: () => ({ side: -1 }), stateText: (s) => 'Copies the relic to its ' + (s.side < 0 ? 'left' : 'right') });
  relic('hybrid_seed', 'Hybrid Seed', 'U', ['growth'], '🌰', 'After 8 hands, evolves into a Vine that matches your most common tag', {
    state: () => ({ hands: 0 }), stateText: (s) => Math.min(8, Math.floor(s.hands)) + '/8 hands',
    afterHand: (s, g) => { s.hands += g.grow; if (s.hands >= 8) return { transform: 'vine', text: 'Evolved!' }; } });
  // Ranken (nur über Hybrid Seed)
  const VINES = {
    bank: relic('golden_vine', 'Golden Vine', 'R', ['bank', 'growth'], '🌿', 'Earn $3 at the end of each round', { hidden: true, endBlind: () => ({ money: 3 }) }),
    luck: relic('clover_vine', 'Clover Vine', 'R', ['luck', 'growth'], '🌿', '+15 Luck', { hidden: true, luck: () => 15 }),
    risk: relic('thorn_vine', 'Thorn Vine', 'R', ['risk', 'growth'], '🌿', 'Skulls give x1.75 Power instead of x1.5', { hidden: true }),
    pattern: relic('pattern_vine', 'Pattern Vine', 'R', ['pattern', 'growth'], '🌿', '+1 level to your most played hand every stage',
      { hidden: true, anteStart: () => ({ levelUp: true }) }),
    hold: relic('root_vine', 'Root Vine', 'R', ['hold', 'growth'], '🌿', 'Held dice give +6 Pips when scored', { hidden: true, perDie: (d) => (d.held ? { chips: 6 } : null) }),
    reroll: relic('dice_vine', 'Dice Vine', 'R', ['reroll', 'growth'], '🌿', '+1 reroll per hand', { hidden: true, extraRerolls: 1 }),
    number: relic('number_vine', 'Number Vine', 'R', ['number', 'growth'], '🌿', 'Scored dice of your top number give +3 Power',
      { hidden: true, perDie: (d, h) => (d.v === h.top ? { mult: 3 } : null) }),
    bag: relic('bag_vine', 'Bag Vine', 'R', ['bag', 'growth'], '🌿', '+4 Pips for every die in your bag', { hidden: true, onHand: (h) => ({ chips: 4 * h.bagSize }) }),
  };

  // Wechselnd
  const DIAL_MODES = ['+30 Pips', '+6 Power', '+$2 per round'];
  relic('dial', 'Dial', 'C', ['bank', 'number', 'pattern'], '🎚️', 'Choose a mode in the shop: +30 Pips, +6 Power or +$2 per round. Switching costs $1', {
    state: () => ({ mode: 0 }), stateText: (s) => 'Mode: ' + DIAL_MODES[s.mode],
    onHand: (h, s) => (s.mode === 0 ? { chips: 30 } : s.mode === 1 ? { mult: 6 } : null),
    endBlind: (s) => (s.mode === 2 ? { money: 2 } : null) });
  relic('coin', 'Two-Sided Coin', 'U', ['bank', 'luck', 'hold'], '🪙', 'Flips every hand. Heads: earn $2. Tails: +8 Power. Hold 3+ dice to flip it yourself', {
    state: () => ({ side: 'heads' }), stateText: (s) => 'Showing ' + (s.side === 'heads' ? 'Heads ($2)' : 'Tails (+8 Power)'),
    newHand: (s, g) => { s.side = g.rnd() < 0.5 ? 'heads' : 'tails'; },
    onHand: (h, s) => (s.side === 'heads' ? { money: 2 } : { mult: 8 }) });
  relic('day_night', 'Day & Night', 'U', ['bank', 'risk'], '🌗', 'Warm-up and High Stakes rounds: earn $3 at the end. Showdowns: x2 Power', {
    onHand: (h) => (h.isBoss ? { xmult: 2 } : null), endBlind: (s, g) => (g.isBoss ? null : { money: 3 }) });
  relic('crossroads', 'Crossroads', 'R', [], '🔀', "When bought, choose one of three tags. It becomes the strongest relic of that tag you don't own");

  // Hybride
  relic('dragons_hoard', "Dragon's Hoard", 'R', ['bank', 'growth'], '🐉', 'At the end of each round, gains +1 Power for every $10 in your Vault. Forever', {
    state: () => ({ mult: 0 }), stateText: (s) => 'Currently +' + fmt(s.mult) + ' Power',
    onHand: (h, s) => (s.mult > 0 ? { mult: Math.round(s.mult) } : null),
    endBlind: (s, g) => { const n = Math.floor(g.vault / 10); if (n) { s.mult += n * g.grow; return { text: '+' + fmt(n * g.grow) + ' Power' }; } } });
  relic('loaded_clover', 'Loaded Clover', 'U', ['luck', 'reroll'], '☘️', '+5 Luck for every reroll you used this hand', { luck: (s, g) => 5 * g.rerollsHand });
  relic('evil_eye', 'Evil Eye', 'R', ['risk', 'luck', 'number'], '🧿', 'Every Skull in your hand gives +10 Luck. On a Bust, all Skulls count as 6s instead', { luck: (s, g) => 10 * g.skullsShowing });
  relic('scaffold', 'Scaffold', 'U', ['pattern', 'hold'], '🏗️', 'Held dice that are part of the scored hand count their pips twice',
    { perDie: (d) => (d.held && d.v > 0 ? { chips: d.v } : null) });
  relic('abacus', 'Abacus', 'U', ['number', 'growth'], '🧮', 'Every time a number levels up, this gains x0.2 Power', {
    state: () => ({ x: 1 }), stateText: (s) => 'Currently x' + fmt(s.x) + ' Power',
    onHand: (h, s) => (s.x > 1 ? { xmult: s.x } : null),
    onLevelUp: (s, g) => { s.x += 0.2 * g.grow; return { text: 'x' + fmt(s.x) }; } });
  relic('ash_urn', 'Ash Urn', 'U', ['bag', 'risk'], '🏺', 'Whenever a die is destroyed, gain x0.25 Power for good and earn $4', {
    state: () => ({ x: 1 }), stateText: (s) => 'Currently x' + fmt(s.x) + ' Power',
    onHand: (h, s) => (s.x > 1 ? { xmult: s.x } : null),
    onDestroy: (s, g) => { s.x += 0.25 * g.grow; return { money: 4, text: 'x' + fmt(s.x) }; } });
  relic('suitcase', 'Suitcase', 'U', ['bag', 'bank'], '🧳', '+$1 interest (and cap) for every 3 dice in your bag');
  relic('clockwork', 'Clockwork', 'R', ['reroll', 'hold', 'growth'], '⚙️', 'Every reroll with at least one held die: gains +2 Pips for good', {
    state: () => ({ chips: 0 }), stateText: (s) => 'Currently +' + Math.round(s.chips) + ' Pips',
    onHand: (h, s) => (s.chips > 0 ? { chips: Math.round(s.chips) } : null),
    onReroll: (s, g, info) => { if (info.held > 0) { s.chips += 2 * g.grow; return { text: '+' + fmt(2 * g.grow) + ' Pips' }; } } });
  relic('spiral', 'Spiral of Fate', 'R', ['luck', 'pattern'], '🌀', 'Lucky Hits can also land on the number that continues a Straight');

  const RELIC_BY_ID = Object.fromEntries(RELICS.map((r) => [r.id, r]));
  const MAX_RELICS = 5, MAX_CONS = 2, MIN_BAG = 5, MAX_BAG = 12;
  const comboSafe = (h) => !!h && (h.keep || (h.has('iron_focus') && h.heldCount >= 3));

  // ── Upgrades (dauerhaft für den Run, eigener Shop-Platz) ────────────────
  const UPGRADES = [
    { id: 'vault', name: 'Vault', rarity: 'R', emoji: '🏦', desc: 'Unlocks the Vault: deposit money in the shop. It grows by 20% every round (max $60). Withdrawing costs $2' },
    { id: 'overdraft', name: 'Overdraft', rarity: 'R', emoji: '💳', desc: 'You can go into debt down to -$20. While in debt: x1.5 Power, but no interest' },
    { id: 'telescope', name: 'Telescope', rarity: 'U', emoji: '🔭', desc: 'The shop always offers the Constellation of your most played hand. Constellations cost $1 less' },
    { id: 'crystal_ball', name: 'Crystal Ball', rarity: 'R', emoji: '🔮', desc: 'Point at a die you are not holding to see what it will land on when you reroll' },
    { id: 'weighted_dice', name: 'Weighted Dice', rarity: 'U', emoji: '⚖️', desc: '+10 Luck for the rest of the run' },
    { id: 'rabbit_foot', name: "Rabbit's Foot", rarity: 'U', emoji: '🐇', desc: 'You Bust at 4 Skulls instead of 3' },
    { id: 'overdrive', name: 'Overdrive', rarity: 'R', emoji: '🔋', desc: '+2 rerolls per hand, -1 hand per round' },
    { id: 'anchor', name: 'Anchor', rarity: 'U', emoji: '⚓', desc: '1 held die stays on the table for the next hand, keeping its face' },
    { id: 'pruning', name: 'Pruning Shears', rarity: 'U', emoji: '✂️', desc: 'Once per shop: destroy a die from your bag for free and earn $3' },
    { id: 'backpack', name: 'Backpack', rarity: 'C', emoji: '🎒', desc: 'Bag limit +4' },
    { id: 'spare_die', name: 'Spare Die', rarity: 'L', emoji: '🎲', desc: 'Roll 6 dice. Your best 5 score' },
  ];
  const UPGRADE_PRICE = { C: 6, U: 8, R: 10, L: 14 };
  UPGRADES.forEach((u) => { u.cost = UPGRADE_PRICE[u.rarity]; });
  const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));

  // ── Orakel (Verbrauchsgegenstände, wirken auf gehaltene Würfel) ─────────
  const ORACLES = [
    { id: 'smith', name: 'The Smith', icon: 'die', desc: 'Turn the up face of up to 2 held dice into Wild faces', min: 1, max: 2, setKind: 'wild' },
    { id: 'gilding', name: 'Gilding', icon: 'coin', desc: 'Turn the up face of 1 held die into a Gold face ($2 when scored)', min: 1, max: 1, setKind: 'gold' },
    { id: 'fury', name: 'Fury', icon: 'heart', desc: 'Turn the up face of up to 2 held dice into Power faces (+4 Power)', min: 1, max: 2, setKind: 'mult' },
    { id: 'azure', name: 'Azure', icon: 'clover', desc: 'Turn the up face of up to 2 held dice into Bonus faces (+30 Pips)', min: 1, max: 2, setKind: 'bonus' },
    { id: 'ascend', name: 'Ascend', icon: 'star', desc: 'Raise the up face of up to 2 held dice by 1 pip', min: 1, max: 2 },
    { id: 'twin', name: 'Twin', icon: 'die', desc: 'Add a copy of 1 held die to your bag', min: 1, max: 1 },
    { id: 'shatter', name: 'Shatter', icon: 'heart', desc: 'Destroy 1 held die for good (bag keeps at least 5 dice)', min: 1, max: 1 },
    { id: 'windfall', name: 'Windfall', icon: 'coin', desc: 'Double your money (max +$20)', min: 0, max: 0 },
    { id: 'devils_deal', name: "Devil's Deal", emoji: '😈', desc: 'Turn the up face of up to 3 held dice into Skull faces. Earn $3 per Skull', min: 1, max: 3, setKind: 'skull' },
    { id: 'refraction', name: 'Refraction', emoji: '🌈', desc: 'Turn the up face of 1 held die into a Prism face (Gold, Power and Bonus at once)', min: 1, max: 1, setKind: 'prism' },
    { id: 'hex', name: 'Hex', emoji: '🃏', desc: 'Turn the up face of 1 held die into a Hex face (Skull and Wild at once)', min: 1, max: 1, setKind: 'hex' },
  ];
  const ORACLE_BY_ID = Object.fromEntries(ORACLES.map((o) => [o.id, o]));
  const NUMBER_NAMES = ['', 'Ones', 'Twos', 'Threes', 'Fours', 'Fives', 'Sixes'];

  // ── Bosse ───────────────────────────────────────────────────────────────
  const BOSSES = [
    { id: 'snake', name: 'The Snake', colour: '#3E7B4F', desc: 'Scored 1s give nothing' },
    { id: 'clamp', name: 'The Clamp', colour: '#7A4FA0', desc: 'Only 1 reroll per hand' },
    { id: 'frost', name: 'The Frost', colour: '#3C8DC0', desc: 'Dice showing 6 are frozen and cannot be rerolled' },
    { id: 'chaos', name: 'The Chaos', colour: '#C0562E', desc: 'Held dice may be rerolled anyway (1 in 3)' },
    { id: 'echo', name: 'The Echo', colour: '#8F3D6B', desc: 'Each hand type scores only once this round' },
    { id: 'wall', name: 'The Wall', colour: '#6B5B4B', desc: 'Huge target (4x instead of 2x)', factor: 4 },
  ];

  // ── Relikte auflösen: Mirror Shard, Tags, Chameleon ─────────────────────
  const NONE = { id: 'none', tags: [] };
  // Liefert pro Relikt die wirksame Definition und ihren Zustand (Mirror Shard kopiert den Nachbarn).
  function effective(relics) {
    return relics.map((r, ri) => {
      const def = RELIC_BY_ID[r.id], s = r.state || (r.state = {});
      if (def.id !== 'mirror') return { def, s, ri };
      const t = relics[ri + (s.side || -1)];
      if (!t || t.id === 'mirror') return { def: NONE, s, ri, mirror: true };
      const tdef = RELIC_BY_ID[t.id];
      s.copies = s.copies || {};
      if (!s.copies[t.id]) s.copies[t.id] = tdef.state ? tdef.state() : {};
      return { def: tdef, s: s.copies[t.id], ri, mirror: true };
    });
  }
  function baseTags(e) { return e.def.id === 'compass' ? (e.s.tag ? [e.s.tag] : []) : e.def.tags || []; }
  // Anzahl Relikte pro Tag (Chameleon zählt für jeden Tag, der schon 2x vorhanden ist)
  function tagCounts(relics) {
    const eff = effective(relics), counts = {};
    eff.forEach((e) => { if (e.def.id !== 'chameleon') baseTags(e).forEach((t) => { counts[t] = (counts[t] || 0) + 1; }); });
    const chams = eff.filter((e) => e.def.id === 'chameleon').length;
    if (chams) for (const t of Object.keys(counts)) if (counts[t] >= 2) counts[t] += chams;
    return counts;
  }
  function relicTags(relics, ri) {
    const eff = effective(relics), e = eff[ri];
    if (e.def.id !== 'chameleon') return baseTags(e);
    const counts = tagCounts(relics.filter((_, k) => k !== ri));
    return TAG_ORDER.filter((t) => (counts[t] || 0) >= 2);
  }
  function mostCommonTag(relics, exclude = []) {
    const counts = tagCounts(relics.filter((r) => !exclude.includes(r.id)));
    let best = null;
    for (const t of TAG_ORDER) if ((counts[t] || 0) > 0 && (!best || counts[t] > counts[best])) best = t;
    return best;
  }
  const setLevel = (counts, tag) => ((counts[tag] || 0) >= 5 ? 5 : (counts[tag] || 0) >= 3 ? 3 : 0);

  // ── Augenzahl-Stufen ────────────────────────────────────────────────────
  // Top-Zahl: höchste Stufe, bei Gleichstand die größere Augenzahl
  function topNumber(numLevels) {
    let best = 6;
    for (let v = 5; v >= 1; v--) if ((numLevels[v] || 1) > (numLevels[best] || 1)) best = v;
    return best;
  }
  function effNumLevels(numLevels, counts) {
    const out = {};
    for (let v = 1; v <= 6; v++) out[v] = numLevels[v] || 1;
    if (setLevel(counts, 'number') >= 3) out[topNumber(numLevels)]++;
    return out;
  }

  // ── Zinsen, Luck, Würfeln ───────────────────────────────────────────────
  // g: { money, relics, bagSize }
  function interestInfo(g) {
    const eff = effective(g.relics || []), counts = tagCounts(g.relics || []);
    let cap = 5;
    eff.forEach((e) => { if (e.def.capBonus) cap += e.def.capBonus(e.s); });
    if (setLevel(counts, 'bank') >= 3) cap += 3;
    const k = eff.some((e) => e.def.id === 'suitcase') ? Math.floor((g.bagSize || 0) / 3) : 0;
    if (g.money < 0) return { amount: 0, cap: cap + k, maxed: false };
    const base = Math.floor(g.money / 5);
    return { amount: Math.min(cap, base) + k, cap: cap + k, maxed: base >= cap };
  }
  const interest = (money) => interestInfo({ money }).amount;

  // g: { relics, upgrades, isBoss, rerollsHand, skullsShowing }
  function luckOf(g) {
    const eff = effective(g.relics || []);
    let L = 0;
    eff.forEach((e) => { if (e.def.luck) L += e.def.luck(e.s, g); });
    if ((g.upgrades || []).includes('weighted_dice')) L += 10;
    L += g.bonusLuck || 0;   // Becher und Chaos-Regeln
    if (setLevel(tagCounts(g.relics || []), 'luck') >= 3) L += 10;
    if (g.isBoss && eff.some((e) => e.def.id === 'moonstone')) L *= 2;
    return Math.max(0, Math.min(100, L));
  }
  // Zielzahlen für Lucky Hits: Zahlen der gehaltenen Würfel (+ Straßen-Fortsetzung mit Spiral of Fate)
  function luckTargets(heldFaces, spiral) {
    const vals = [...new Set(heldFaces.filter((f) => !isSkull(f) && f.kind !== 'wild').map((f) => f.v))].sort((a, b) => a - b);
    const out = vals.slice();
    if (spiral && vals.length && vals.every((v, k) => v === vals[0] + k)) {
      if (vals[0] > 1) out.push(vals[0] - 1);
      if (vals[vals.length - 1] < 6) out.push(vals[vals.length - 1] + 1);
    }
    return out;
  }
  // Würfelt einen Würfel. rnd: 5 Zufallszahlen (vorab gezogen, damit Crystal Ball das Ergebnis zeigen kann).
  function rollFace(die, rnd, luck, targets, loadedSkulls) {
    const n = die.faces.length;
    let up = Math.floor(rnd[0] * n), lucky = false;
    if (targets.length && rnd[1] * 100 < luck) {
      const t = targets[Math.floor(rnd[2] * targets.length)];
      const hits = die.faces.map((f, k) => (!isSkull(f) && (f.v === t || f.kind === 'wild' || (f.kind === 'twin' && 7 - f.v === t)) ? k : -1)).filter((k) => k >= 0);
      if (hits.length) { up = hits[Math.floor(rnd[3] * hits.length)]; lucky = true; }
    }
    if (!lucky && loadedSkulls && isSkull(die.faces[up]) && rnd[4] * 100 < luck) {
      const safe = die.faces.map((f, k) => (isSkull(f) ? -1 : k)).filter((k) => k >= 0);
      if (safe.length) up = safe[Math.floor(rnd[3] * safe.length)];
    }
    return { up, lucky };
  }
  // Jacob's Ladder: hebt eine zufällige Seite (< 6) im Beutel um 1 Auge
  function raiseFace(bag, rnd = Math.random) {
    const opts = [];
    bag.forEach((d) => d.faces.forEach((f) => { if (f.v < 6 && !isSkull(f) && f.kind !== 'wild') opts.push(f); }));
    if (!opts.length) return false;
    opts[Math.floor(rnd() * opts.length)].v++;
    return true;
  }

  // ── Handerkennung ───────────────────────────────────────────────────────
  // Wertet 5 Augenzahlen aus (0 = Schädel, zählt nicht). opts.gap: Straßen dürfen eine Lücke haben.
  function evaluate(vals, opts = {}) {
    const counts = {};
    vals.forEach((v) => { if (v) counts[v] = (counts[v] || 0) + 1; });
    const groups = Object.entries(counts).map(([v, c]) => ({ v: +v, c })).sort((a, b) => b.c - a.c || b.v - a.v);
    const g0 = groups[0] || { c: 0 }, g1 = groups[1] || { c: 0 };
    const distinct = Object.keys(counts).map(Number).sort((a, b) => a - b);
    const idxOf = (v) => vals.map((x, i) => (x === v ? i : -1)).filter((i) => i >= 0);
    const nonzero = vals.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
    const large = distinct.length >= 5 && (opts.gap || distinct[4] - distinct[0] === 4);
    // Kleine Straße: 4 aufeinanderfolgende Augen (mit Gap Jumper: 4 Augen in einem Fenster von 5)
    let run = null;
    for (let a = 1; a <= 3; a++) if ([0, 1, 2, 3].every((k) => counts[a + k])) run = [a, a + 1, a + 2, a + 3];
    if (!run && opts.gap) for (let a = 1; a <= 2; a++) { const w = [0, 1, 2, 3, 4].map((k) => a + k).filter((v) => counts[v]); if (w.length >= 4) run = w.slice(-4); }

    let name, scoring;
    if (g0.c === 5) { name = 'Five of a Kind'; scoring = idxOf(g0.v); }
    else if (g0.c === 4) { name = 'Four of a Kind'; scoring = idxOf(g0.v); }
    else if (large) { name = 'Large Straight'; scoring = nonzero; }
    else if (g0.c === 3 && g1.c === 2) { name = 'Full House'; scoring = [...idxOf(g0.v), ...idxOf(g1.v)]; }
    else if (run) { name = 'Small Straight'; scoring = run.map((v) => vals.indexOf(v)); }
    else if (g0.c === 3) { name = 'Three of a Kind'; scoring = idxOf(g0.v); }
    else if (g0.c === 2 && g1.c === 2) { name = 'Two Pair'; scoring = [...idxOf(g0.v), ...idxOf(g1.v)]; }
    else if (g0.c === 2) { name = 'Pair'; scoring = idxOf(g0.v); }
    else { name = 'Chance'; scoring = nonzero; }
    return { name, scoring, maxCount: g0.c };
  }

  // Mögliche Zahlen einer Seite (Wild/Hex: alle, Two-Faced: zwei, Schädel: keine)
  function faceOptions(f, opts) {
    if (f.kind === 'wild' || f.kind === 'hex') return [1, 2, 3, 4, 5, 6];
    if (f.kind === 'skull') return opts.skullWild ? [1, 2, 3, 4, 5, 6] : [0];
    if (f.kind === 'twin' && f.v !== 7 - f.v) return [f.v, 7 - f.v];
    return [f.v];
  }
  // Probiert alle Belegungen (und bei 6 Würfeln alle 5er-Auswahlen) und nimmt die beste.
  function evaluateFaces(faces, levels, opts = {}) {
    const n = faces.length, all = faces.map((_, i) => i);
    const subsets = n > 5 ? all.map((skip) => all.filter((i) => i !== skip)) : [all];
    const options = faces.map((f) => faceOptions(f, opts));
    const vals = new Array(n);
    let best = null;
    const consider = (sub) => {
      const sv = sub.map((i) => vals[i]);
      const ev = evaluate(sv, opts);
      const [c, m] = handValues(ev.name, levels);
      const skulls = sub.filter((i) => isSkull(faces[i])).length;
      let est = (c + ev.scoring.reduce((s, j) => s + sv[j], 0)) * m * Math.pow(1.5, skulls);
      if (skulls >= (opts.bustAt || 3)) est *= 0.001;
      if (!best || est > best.est) best = { name: ev.name, maxCount: ev.maxCount, scoring: ev.scoring.map((j) => sub[j]), used: sub, vals: vals.slice(), est, skulls };
    };
    const rec = (k) => {
      if (k === n) { subsets.forEach(consider); return; }
      for (const v of options[k]) { vals[k] = v; rec(k + 1); }
    };
    rec(0);
    return best;
  }

  // ── Wertung ─────────────────────────────────────────────────────────────
  // input: { faces, held, extras:[{chips, rerolled}], relics, upgrades, levels, numLevels, boss, isBoss, played,
  //          handCounts, rerollsHand, rerollsBlind, rerollsLeft, money, bagSize, bagTypes, lucky, whirls, vault }
  // Gibt die Schritte zurück, die das Spiel nacheinander animiert, plus das Endergebnis.
  function scoreHand(input) {
    const g = Object.assign({ relics: [], upgrades: [], levels: {}, numLevels: {}, played: [], handCounts: {}, held: [], extras: [],
      rerollsHand: 0, rerollsBlind: 0, rerollsLeft: 0, money: 0, bagSize: 5, bagTypes: 1, lucky: 0, whirls: 0, vault: 0, grow: 1, keep: false }, input);
    const eff = effective(g.relics), tags = tagCounts(g.relics);
    const has = (id) => eff.some((e) => e.def.id === id);
    const riOf = (id) => eff.find((e) => e.def.id === id).ri;
    const upg = (id) => g.upgrades.includes(id);
    const set = (t, n) => setLevel(tags, t) >= n;
    const boss = g.boss && g.boss.id;
    const bustAt = 3 + (upg('rabbit_foot') ? 1 : 0) + (set('risk', 3) ? 1 : 0);
    const opts = { gap: has('gap_jumper'), skullWild: has('hex_bag'), bustAt };
    const steps = [];
    let faces = g.faces;
    let ev = evaluateFaces(faces, g.levels, opts);
    let bust = ev.skulls >= bustAt;
    if (bust && has('evil_eye')) {
      faces = faces.map((f) => (isSkull(f) ? face(6) : f));
      ev = evaluateFaces(faces, g.levels, opts);
      bust = false;
      steps.push({ src: 'relic', r: riOf('evil_eye'), text: 'Skulls become 6s!' });
    }
    const [baseChips, baseMult] = handValues(ev.name, g.levels);
    const res = { name: ev.name, vals: ev.vals, scoring: ev.scoring, used: ev.used, baseChips, baseMult, steps, factor: 1, prism: [], skulls: ev.skulls };

    if (boss === 'echo' && g.played.includes(ev.name)) {
      res.echo = true; res.baseChips = 0; res.baseMult = 0;
      steps.push({ src: 'msg', text: 'Already played!' });
      return finish(res);
    }

    const hc = Object.assign({}, g.handCounts);
    hc[ev.name] = (hc[ev.name] || 0) + 1;
    const isMost = hc[ev.name] >= Math.max(...Object.values(hc));
    const numLv = effNumLevels(g.numLevels, tags), top = topNumber(g.numLevels);
    const heldCount = g.held.filter(Boolean).length;
    const h = {
      name: ev.name, maxCount: ev.maxCount, sum: ev.used.reduce((a, i) => a + (ev.vals[i] || 0), 0),
      scoringVals: ev.scoring.map((i) => ev.vals[i]), skulls: ev.skulls, heldCount, isMost,
      rerollsHand: g.rerollsHand, rerollsBlind: g.rerollsBlind, rerollsLeft: g.rerollsLeft, money: g.money,
      bagSize: g.bagSize, bagTypes: g.bagTypes, lucky: g.lucky, whirls: g.whirls, isBoss: !!g.isBoss,
      interest: interestInfo(g).amount, numLevels: numLv, top, tags, has, grow: g.grow, keep: g.keep,
    };
    res.h = h; res.isMost = isMost;
    const push = (fx, base) => { if (!fx) return; (Array.isArray(fx) ? fx : [fx]).forEach((x) => steps.push(Object.assign({}, base, x))); };

    // Fusion: Zusatz-Stufenbonus
    if (has('fusion')) {
      const extra = { 'Two Pair': 'Pair', 'Full House': 'Three of a Kind' }[ev.name];
      const lv = extra ? (g.levels[extra] || 1) - 1 : 0;
      if (lv > 0) push({ chips: HANDS[extra].level[0] * lv, mult: HANDS[extra].level[1] * lv }, { src: 'relic', r: riOf('fusion') });
    }

    // Pro gewertetem Würfel
    const dieSteps = (i) => {
      const v = ev.vals[i], f = faces[i], held = !!g.held[i], ex = g.extras[i] || {};
      if (boss === 'snake' && v === 1 && !(held && has('lockbox'))) { steps.push({ src: 'debuff', i }); return false; }
      steps.push({ src: 'die', i, chips: v });
      const nl = numLv[v] || 1;
      if (nl > 1) { steps.push({ src: 'die', i, chips: 4 * (nl - 1) }); steps.push({ src: 'die', i, mult: nl - 1 }); }
      if (f.kind === 'bonus' || f.kind === 'prism') steps.push({ src: 'die', i, chips: 30 });
      if (f.kind === 'mult' || f.kind === 'prism') steps.push({ src: 'die', i, mult: 4 });
      if (f.kind === 'gold' || f.kind === 'prism') steps.push({ src: 'die', i, money: 2 });
      if (ex.chips >= 1) steps.push({ src: 'die', i, chips: Math.round(ex.chips) });
      if (held && set('hold', 5)) steps.push({ src: 'set', tag: 'hold', i, chips: 10 });
      eff.forEach((e) => push(e.def.perDie && e.def.perDie({ i, v, f, held, ex }, h, e.s), { src: 'relic', r: e.ri, i }));
      return true;
    };
    for (const i of ev.scoring) {
      if (faces[i].kind === 'prism') res.prism.push(i);
      if (!dieSteps(i)) continue;
      let reps = 0;
      if (has('encore') && ev.name === 'Full House') reps++;
      if (set('number', 5) && ev.vals[i] === top) reps++;
      for (let k = 0; k < reps; k++) { steps.push({ src: 'msg', i, text: 'Again!', small: true }); dieSteps(i); }
    }

    // Schädel in der Hand
    const skullX = has('blood_pact') ? 2 : has('thorn_vine') ? 1.75 : 1.5;
    ev.used.forEach((i) => { if (isSkull(faces[i])) steps.push({ src: 'die', i, xmult: skullX }); });

    // Relikte pro Hand (von links nach rechts)
    eff.forEach((e) => push(e.def.onHand && e.def.onHand(h, e.s, g), { src: 'relic', r: e.ri }));

    // Set-Boni und Upgrades
    if (set('pattern', 5) && isMost) steps.push({ src: 'set', tag: 'pattern', xmult: 2 });
    if (set('bag', 5)) steps.push({ src: 'set', tag: 'bag', mult: g.bagSize });
    if (set('luck', 5) && g.lucky > 0) steps.push({ src: 'set', tag: 'luck', mult: 5 * g.lucky });
    if (upg('overdraft') && g.money < 0) steps.push({ src: 'upg', id: 'overdraft', xmult: 1.5 });

    // Bust
    if (bust) {
      if (has('ritual_candle')) {
        res.candle = ev.used.find((i) => isSkull(faces[i]));
        steps.push({ src: 'relic', r: riOf('ritual_candle'), text: 'Bust averted!', money: 10 });
      } else {
        res.bust = true;
        res.factor = set('risk', 5) ? 0.5 : 0;
        steps.push({ src: 'msg', text: res.factor ? 'BUST! (half)' : 'BUST!', money: -5, bust: true });
      }
    }
    return finish(res);
  }

  // Wendet alle Schritte an und berechnet das Ergebnis (identisch zur Animation im Spiel).
  function finish(res) {
    let chips = res.baseChips, mult = res.baseMult, money = 0;
    for (const s of res.steps) {
      if (s.chips) chips += s.chips;
      if (s.mult) mult += s.mult;
      if (s.xmult) mult *= s.xmult;
      if (s.money) money += s.money;
    }
    return Object.assign(res, { chips, mult, money, total: Math.round(chips * mult * res.factor) });
  }

  // ── Kleine Hilfen ───────────────────────────────────────────────────────
  const pick = (arr, rnd = Math.random) => arr[Math.floor(rnd() * arr.length)];
  function pickWeighted(entries, rnd = Math.random) {
    const sum = entries.reduce((s, [, w]) => s + w, 0);
    let r = rnd() * sum;
    for (const [k, w] of entries) { r -= w; if (r <= 0) return k; }
    return entries[entries.length - 1][0];
  }
  function sellValue(item) {
    if (item.type !== 'relic') return 1;
    const base = Math.max(1, Math.floor(RELIC_BY_ID[item.id].cost / 2));
    return item.id === 'nest_egg' ? 2 + Math.floor((item.state && item.state.bonus) || 0) : base;
  }
  // Stärkstes Relikt eines Tags, das man noch nicht hat (Crossroads)
  function strongestOfTag(tag, owned, rnd = Math.random) {
    const pool = RELICS.filter((d) => !d.hidden && d.tags.includes(tag) && !owned.includes(d.id) && d.id !== 'crossroads');
    if (!pool.length) return null;
    const top = Math.max(...pool.map((d) => RARITY_RANK[d.rarity] * 100 + d.cost));
    return pick(pool.filter((d) => RARITY_RANK[d.rarity] * 100 + d.cost === top), rnd);
  }

  const api = {
    HANDS, HAND_ORDER, handValues, FACE_KINDS, DIE_TYPES, makeDie, copyDie, isSkull,
    TAGS, TAG_ORDER, RARITY, RELICS, RELIC_BY_ID, VINES, DIAL_MODES, UPGRADES, UPGRADE_BY_ID, ORACLES, ORACLE_BY_ID, NUMBER_NAMES, BOSSES,
    MAX_RELICS, MAX_CONS, MIN_BAG, MAX_BAG,
    effective, tagCounts, relicTags, mostCommonTag, setLevel, topNumber, effNumLevels,
    interestInfo, interest, luckOf, luckTargets, rollFace, raiseFace,
    evaluate, evaluateFaces, scoreHand, pick, pickWeighted, sellValue, strongestOfTag,
  };
  global.WG = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
