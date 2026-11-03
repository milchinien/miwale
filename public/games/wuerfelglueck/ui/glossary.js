// Würfelglück – Lexikon für die Erklär-Tooltips. Begriffe in Beschreibungen werden erkannt (PHRASES),
// nach dem Festhalten eines Tooltips kann man über sie fahren und bekommt diese Erklärung.
// Texte dürfen selbst Begriffe enthalten – so lässt sich beliebig tief nachschlagen.
(function (global) {
  'use strict';
  const TERMS = {
    pips: { title: 'Pips', text: 'The first half of every score. Each scored die adds its number as Pips. Bonus faces, levels and relics add more. Score = Pips x Power.' },
    power: { title: 'Power', text: 'The second half of every score. It multiplies your Pips. Effects can add Power or multiply it (xPower). Score = Pips x Power.' },
    xpower: { title: 'xPower', text: 'Multiplies your current Power. Relics trigger from left to right, so put +Power relics before xPower relics.' },
    score: { title: 'Score', text: 'Every hand scores Pips x Power. Reach the target of the round before you run out of hands.' },
    hand: { title: 'Hand', text: 'The dice you play. Their best pattern (for example a Pair or a Full House) sets the base Pips and Power. Only scored dice add their numbers.' },
    scored: { title: 'Scored die', text: 'A die that is part of the played pattern. Only scored dice add their Pips and trigger effects that say "scored".' },
    held: { title: 'Held die', text: 'Click a die (or press 1-6) to hold it. Held dice are not rerolled. Oracles work on held dice.' },
    reroll: { title: 'Reroll', text: 'Rolls every die you are not holding again. You have 3 rerolls per hand. Luck can make rerolls land on numbers you hold.' },
    round: { title: 'Round', text: 'Reach the target score within 4 hands. Each stage has three rounds: Warm-up, High Stakes and a Showdown.' },
    stage: { title: 'Stage', text: 'Three rounds in a row: Warm-up, High Stakes and a Showdown against a boss. Clear 8 stages to win the run.' },
    showdown: { title: 'Showdown', text: 'The last round of a stage. A boss changes the rules and the target is twice as high.' },
    money: { title: 'Money', text: 'You earn $ for clearing a round, for every hand you did not need and as interest. Spend it in the shop.' },
    interest: { title: 'Interest', text: 'At the end of every round you earn $1 for each $5 you hold, up to $5. Some relics raise this cap.' },
    vault: { title: 'Vault', text: 'An upgrade. Money in the Vault grows by 20% every round, up to $60. Taking it out costs $2.' },
    luck: { title: 'Luck', text: 'The chance that a rerolled die lands on the number of one of your held dice. That is called a Lucky Hit.' },
    lucky: { title: 'Lucky Hit', text: 'A rerolled die that landed on the number of a held die thanks to Luck. Several relics reward Lucky Hits.' },
    skull: { title: 'Skull', text: 'A face without a number. Every Skull in your hand gives x1.5 Power, but 3 Skulls cause a Bust.' },
    bust: { title: 'Bust', text: 'Playing 3 or more Skulls. The hand scores 0 and you lose $5. Some relics and upgrades protect you.' },
    wild: { title: 'Wild face', text: 'Counts as any number. It always takes the number that makes the best hand.' },
    gold: { title: 'Gold face', text: 'Earns $2 every time it is scored.' },
    bonus: { title: 'Bonus face', text: 'Gives +30 Pips every time it is scored.' },
    powerface: { title: 'Power face', text: 'Gives +4 Power every time it is scored.' },
    prism: { title: 'Prism face', text: 'Counts as a Gold face, a Power face and a Bonus face at once. Cracks after 3 scores.' },
    hex: { title: 'Hex face', text: 'A Skull that also counts as Wild.' },
    twin: { title: 'Two-Faced', text: 'Shows two numbers (1/6, 2/5 or 3/4) and uses whichever makes the better hand.' },
    retrigger: { title: 'Retrigger', text: 'The die scores a second time, with all of its effects.' },
    level: { title: 'Level', text: 'Hands and numbers can level up. Constellations level a hand (+Pips and +Power), Tallies level a number.' },
    top: { title: 'Top number', text: 'The number with the highest level. On a tie, the bigger number wins.' },
    most: { title: 'Most played hand', text: 'The hand type you have played most often in this run. The hand list marks it with "(most)".' },
    tag: { title: 'Tag', text: 'Every relic belongs to 1-3 builds. Own 3 or 5 relics with the same tag for a set bonus.' },
    set: { title: 'Set bonus', text: 'A bonus for owning 3 or 5 relics with the same tag. Hover the tag icons under your relics to see them.' },
    relic: { title: 'Relic', text: 'A passive item. You can own 5. Relics trigger from left to right; drag them to change the order.' },
    oracle: { title: 'Oracle', text: 'A consumable. Most Oracles change the faces of your held dice. Use them during a hand.' },
    constellation: { title: 'Constellation', text: 'A consumable that levels up one hand type: it gives more Pips and Power from then on.' },
    tally: { title: 'Tally', text: 'A consumable that levels up one number. Each scored die showing it gives +4 Pips and +1 Power more per level.' },
    upgrade: { title: 'Upgrade', text: 'Lasts for the rest of the run. The shop offers one new upgrade per stage.' },
    die: { title: 'Die', text: 'Goes into your bag. Every hand draws 5 dice from the bag at random.' },
    bag: { title: 'Bag', text: 'All of your dice. Every hand draws 5 of them at random. You can hold up to 12.' },
    anchor: { title: 'Anchor', text: 'An anchored die stays on the table for the next hand and keeps its face.' },
    rarity: { title: 'Rarity', text: 'How often something appears in the shop: Common often, Uncommon less, Rare seldom, Legendary almost never.' },
    consumable: { title: 'Consumable', text: 'Used once. You can carry 2: Oracles, Tallies and Constellations.' },
    formation: { title: 'Formation', text: 'How your dice lie on the table, from left to right. Drag a die onto another one to Shift them. Formations work on every hand except Five of a Kind and Large Straight.' },
    link: { title: 'Link', text: 'Two scored dice side by side that show the same number. Every Link gives +4 Pips. Drag dice next to each other to make Links.' },
    shift: { title: 'Shift', text: 'Drag a die onto another die to swap their slots. You get 1 Shift per hand. Rerolls keep every die in its slot.' },
    step: { title: 'Step', text: 'Two scored dice side by side whose numbers are one apart, like 3-4 or 5-4.' },
    chain: { title: 'Chain', text: 'A row of dice joined by Links, like 4-4-4. Your longest chain counts.' },
    slot: { title: 'Slot', text: 'A place on the table. The middle slot is in the centre of your dice, the end slots are the far left and far right.' },
  };
  // Handarten
  const HANDS = {
    'Five of a Kind': 'All five dice show the same number.',
    'Four of a Kind': 'Four dice show the same number.',
    'Large Straight': 'Five numbers in a row: 1-2-3-4-5 or 2-3-4-5-6.',
    'Full House': 'Three of one number and two of another.',
    'Small Straight': 'Four numbers in a row, for example 2-3-4-5.',
    'Three of a Kind': 'Three dice show the same number.',
    'Two Pair': 'Two different pairs.',
    Pair: 'Two dice show the same number.',
    Chance: 'No pattern at all. All dice score.',
  };
  for (const [name, text] of Object.entries(HANDS)) TERMS['hand:' + name] = { title: name, text, hand: name };

  // Wörter in Beschreibungen -> Begriff (Groß-/Kleinschreibung wie angegeben)
  const PHRASES = {
    Pips: 'pips', Pip: 'pips', Power: 'power', xPower: 'xpower', Score: 'score', score: 'score',
    hand: 'hand', hands: 'hand', Hand: 'hand', scored: 'scored', held: 'held', hold: 'held', Hold: 'held', 'held die': 'held', 'held dice': 'held',
    reroll: 'reroll', rerolls: 'reroll', Reroll: 'reroll', rerolled: 'reroll', round: 'round', rounds: 'round', Round: 'round',
    stage: 'stage', stages: 'stage', Stage: 'stage', Showdown: 'showdown', Showdowns: 'showdown',
    interest: 'interest', Interest: 'interest', Vault: 'vault', Luck: 'luck', 'Lucky Hit': 'lucky', 'Lucky Hits': 'lucky',
    Skull: 'skull', Skulls: 'skull', Bust: 'bust', Busts: 'bust', Wild: 'wild', 'Gold face': 'gold', 'Gold faces': 'gold', Gold: 'gold',
    'Bonus face': 'bonus', 'Bonus faces': 'bonus', 'Power face': 'powerface', 'Power faces': 'powerface', Prism: 'prism', Hex: 'hex',
    'Two-Faced': 'twin', retrigger: 'retrigger', level: 'level', levels: 'level', 'top number': 'top', 'most played hand': 'most',
    tag: 'tag', tags: 'tag', 'set bonus': 'set', relic: 'relic', relics: 'relic', Relic: 'relic', Oracle: 'oracle', Oracles: 'oracle',
    Constellation: 'constellation', Constellations: 'constellation', Tally: 'tally', Tallies: 'tally', upgrade: 'upgrade', Upgrade: 'upgrade',
    bag: 'bag', Bag: 'bag', anchored: 'anchor', Anchor: 'anchor', consumable: 'consumable', Rarity: 'rarity',
    Link: 'link', Links: 'link', Shift: 'shift', Shifts: 'shift', Step: 'step', chain: 'chain', Formation: 'formation',
    'middle slot': 'slot', 'end slots': 'slot', slot: 'slot',
  };
  for (const name of Object.keys(HANDS)) PHRASES[name] = 'hand:' + name;
  global.WG_GLOSSARY = { TERMS, PHRASES };
})(typeof window !== 'undefined' ? window : globalThis);
