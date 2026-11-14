// Aleator – Challenges: feste Challenges, Daily Challenge, Build Mastery. window.WGChallenges
// Nur Daten und reine Logik (in Node testbar). Fortschritt liegt im gemeinsamen meta() (saves.js):
//   m.chal    { [id]: { wins, best } }               – feste Challenges
//   m.daily   { 'YYYY-MM-DD': { stage, won, score } } – Daily Challenge, ein gewerteter Versuch pro Tag
//   m.dailyRewards { [tage]: Zeitstempel }           – vergebene Serien-Belohnungen
//   m.mastery { [tag]: 0..3 }                        – Build Mastery (Sterne pro Build)
// Eine Challenge ist ein Becher mit Zusatzregeln (cup): game.js liest dieselben Felder wie bei den Bechern, dazu:
//   bagLimit, bustPlus, noRoundReward, banDice, banOracles, shopDice, shifts, linkPips, banHands, handCap,
//   rerollCost, minElite, bossRush, exam
((global) => {
  'use strict';
  const R = global.WG || (typeof require !== 'undefined' ? require('./rules.js') : null);
  const Rng = global.WGRng || (typeof require !== 'undefined' ? require('./rng.js') : null);
  const std = (n) => Array(n).fill('standard');

  const LIST = [
    { id: 'tiny', name: 'Tiny Cup', tag: 'bag', short: 'Your bag holds 4 dice',
      desc: 'Your bag holds at most 4 dice, so you only ever roll 4. Make every die count.', cup: { bag: std(4), bagLimit: 4 } },
    { id: 'boneyard', name: 'Bone Yard', tag: 'risk', short: '3 Cursed Dice, Bust at 4',
      desc: 'Three of your six dice are Cursed Dice with Skulls. You only Bust at 4 Skulls.', cup: { bag: std(3).concat(['cursed', 'cursed', 'cursed']), bustPlus: 1 } },
    { id: 'interest', name: 'Interest Only', tag: 'bank', short: 'Only interest pays',
      desc: 'Rounds and unused hands pay nothing. Money comes from interest, Gold faces and relics. Start with $10.', cup: { noRoundReward: true, noHandReward: true, money: 10 } },
    { id: 'iron_hands', name: 'Iron Hands', tag: 'hold', short: '1 reroll, Anchor from the start',
      desc: 'Only 1 reroll per hand, but you start with the Anchor upgrade.', cup: { rerolls: 1, upgrades: ['anchor'] } },
    { id: 'clover_field', name: 'Clover Field', tag: 'luck', short: '+25 Luck, no Wild faces',
      desc: '+25 Luck for the whole run, but no Wild faces: the shop has no Lucky Dice, no Smith and no Hex.', cup: { luck: 25, banDice: ['lucky'], banOracles: ['smith', 'hex'] } },
    { id: 'domino', name: 'Domino', tag: 'formation', short: '3 Shifts, Straights score nothing',
      desc: '3 Shifts per hand and every Link gives +8 Pips. Straights score nothing.', cup: { shifts: 3, linkPips: 8, banHands: ['Small Straight', 'Large Straight'] } },
    { id: 'seed_vault', name: 'Seed Vault', tag: 'growth', short: '2 seeds, only 3 relic slots',
      desc: 'Start with Seedling and Hybrid Seed, but you only have 3 relic slots.', cup: { relics: ['seedling', 'hybrid_seed'], relicSlots: 3 } },
    { id: 'roulette', name: 'Roulette', tag: 'reroll', short: '9 rerolls, $1 each',
      desc: '9 rerolls per hand, but every reroll costs $1. Start with $10.', cup: { rerolls: 9, rerollCost: 1, money: 10 } },
    { id: 'pattern_lock', name: 'Pattern Lock', tag: 'pattern', short: 'Each hand type twice per round',
      desc: 'Each hand type scores at most twice per round. The third time it scores nothing.', cup: { handCap: 2 } },
    { id: 'even_odds', name: 'Even Odds', tag: 'number', short: 'Only Even and Odd Dice',
      desc: 'Start with 2 Even and 2 Odd Dice. The shop only sells Even and Odd Dice.', cup: { bag: std(2).concat(['even', 'even', 'odd', 'odd']), shopDice: ['even', 'odd'] } },
    { id: 'big_game', name: 'Big Game', tag: 'hunt', short: 'Every boss is Elite',
      desc: 'Every boss that has an Elite version is at least Elite. The bounties are yours.', cup: { minElite: 1 } },
    { id: 'boss_rush', name: 'Boss Rush', finale: true, short: 'Every round is a boss',
      desc: 'Every round is a boss fight. Warm-up and High Stakes bosses have smaller targets.', cup: { bossRush: true } },
    { id: 'exam', name: "Jonny's Exam", finale: true, short: 'Jonny in every round',
      desc: 'Every round is Jonny: he picks a new boss rule every hand, for the whole run.', cup: { bossRush: true, exam: true } },
  ];
  const BY_ID = Object.fromEntries(LIST.map((c) => [c.id, c]));
  const OPEN_START = 4, OPEN_PER_WIN = 2, FINALE_WINS = 6;
  const COLOURS = { boss_rush: '#C0562E', exam: '#E7B23C' };
  const colourOf = (c) => COLOURS[c.id] || (c.tag && R ? R.TAGS[c.tag].colour : '#6B4F92');
  LIST.forEach((c) => { c.colour = colourOf(c); });

  // Belohnungen: [Art, ID oder Anzahl]. Art 'cup' = so viele zufällige Becher
  const WIN_REWARD = { boss_rush: [['material', 'champion'], ['cup', 2]], exam: [['material', 'scholar'], ['cup', 3]] };
  const winReward = (id) => WIN_REWARD[id] || [['cup', 2]];
  const STREAK_REWARDS = [[3, ['cup', 2]], [7, ['material', 'sunrise']], [14, ['cup', 3]], [30, ['material', 'eclipse']]];
  // Build Mastery: ★ Stage 4 mit Set 3 · ★★ Sieg mit Set 3 · ★★★ Sieg mit Set 5
  const STAR_TEXT = ['Reach Stage 4 with its 3-relic set bonus', 'Win a run with its 3-relic set bonus', 'Win a run with its 5-relic set bonus'];
  const starReward = (tag, star) => (star === 1 ? ['swatch', 'build_' + tag] : star === 2 ? ['cup', 2] : ['material', 'aura_' + tag]);

  const ensure = (m) => { for (const k of ['chal', 'daily', 'dailyRewards', 'mastery']) if (!m[k]) m[k] = {}; return m; };
  const wins = (m) => Object.values((m && m.chal) || {}).filter((x) => x && x.wins > 0).length;
  const won = (m, id) => !!(m && m.chal && m.chal[id] && m.chal[id].wins > 0);
  // Freischaltung: 4 sofort, jede gewonnene Challenge öffnet 2 weitere, das Finale nach 6 Siegen
  function isOpen(m, id) {
    const c = BY_ID[id];
    if (!c) return false;
    if (c.finale) return wins(m) >= FINALE_WINS;
    const idx = LIST.filter((x) => !x.finale).indexOf(c);
    return idx < OPEN_START + OPEN_PER_WIN * wins(m);
  }
  function openText(m, id) {
    const c = BY_ID[id];
    if (c.finale) return 'Win ' + FINALE_WINS + ' challenges to unlock (' + wins(m) + '/' + FINALE_WINS + ')';
    return 'Win another challenge to unlock';
  }

  // ── Daily Challenge ──
  const pad = (n) => String(n).padStart(2, '0');
  const dayKey = (d = new Date()) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const dayIndex = (d = new Date()) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  // Build of the Day und Start-Relikt: für alle gleich (aus dem Datum)
  function daily(d = new Date()) {
    const seed = Rng.daySeed(d), tag = R.TAG_ORDER[dayIndex(d) % R.TAG_ORDER.length];
    // Start-Relikt: ein Common, das vor allem zu diesem Build gehört (erster Tag), sonst eines mit dem Tag
    const own = (x) => !x.hidden && x.rarity === 'C' && !R.JONNY_RELICS.includes(x.id);
    let pool = R.RELICS.filter((x) => own(x) && x.tags[0] === tag).map((x) => x.id).sort();
    if (!pool.length) pool = R.RELICS.filter((x) => own(x) && x.tags.includes(tag)).map((x) => x.id).sort();
    const pool2 = pool.length ? pool : R.RELICS.filter((x) => !x.hidden && x.rarity === 'U' && x.tags.includes(tag)).map((x) => x.id).sort();
    const relic = pool2[Rng.hash(seed + '/relic') % pool2.length];
    return { key: dayKey(d), seed, tag, relic };
  }
  // Tage am Stück mit einem gewerteten Versuch, bis heute (oder gestern, wenn heute noch nicht gespielt)
  function streak(m, d = new Date()) {
    const days = (m && m.daily) || {};
    const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (!days[dayKey(t)]) t.setDate(t.getDate() - 1);
    let n = 0;
    while (days[dayKey(t)]) { n++; t.setDate(t.getDate() - 1); }
    return n;
  }
  // Neue Serien-Belohnungen (noch nicht vergeben): [[tage, belohnung], ...]
  function streakDue(m, d = new Date()) {
    const s = streak(m, d), got = (m && m.dailyRewards) || {};
    return STREAK_REWARDS.filter(([n]) => s >= n && !got[n]);
  }

  // ── Build Mastery ──
  // Sterne, die ein Zustand verdient: tags = R.tagCounts(relics), event 'stage' (mit ante) oder 'win'
  function starsFor(tags, ev, ante) {
    const out = {};
    for (const t of R.TAG_ORDER) {
      const lv = R.setLevel(tags, t);
      let st = 0;
      if (ev === 'stage' && ante >= 4 && lv >= 3) st = 1;
      if (ev === 'win' && lv >= 3) st = lv >= 5 ? 3 : 2;
      if (st) out[t] = st;
    }
    return out;
  }
  // Trägt Sterne ein; Rückgabe: neu verdiente [tag, stern] (jeder Stern einzeln, damit jede Belohnung kommt)
  function addStars(m, earned) {
    ensure(m);
    const fresh = [];
    for (const [t, st] of Object.entries(earned)) {
      const had = m.mastery[t] || 0;
      for (let k = had + 1; k <= st; k++) fresh.push([t, k]);
      if (st > had) m.mastery[t] = st;
    }
    return fresh;
  }
  const totalStars = (m) => Object.values((m && m.mastery) || {}).reduce((a, b) => a + b, 0);

  const api = { LIST, BY_ID, OPEN_START, OPEN_PER_WIN, FINALE_WINS, STREAK_REWARDS, STAR_TEXT, winReward, starReward,
    ensure, wins, won, isOpen, openText, dayKey, dayIndex, daily, streak, streakDue, starsFor, addStars, totalStars };
  global.WGChallenges = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
