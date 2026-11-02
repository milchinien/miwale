// Würfelglück – Achievements und Freischaltungen. window.WGAchievements
// Achievements gelten für das ganze Spiel, über alle Speicherplätze und Runs hinweg: sie liegen im gemeinsamen
// Fortschritt (WGSaves.meta(): ach, track, stats, cups), der hier als p übergeben wird.
// Alles, was als Belohnung eines Achievements genannt ist, ist anfangs gesperrt: alle Rare- und Legendary-Relikte,
// die komplizierteren Uncommons, drei Orakel, vier Upgrades und zwei Würfeltypen. Der Rest ist von Anfang an da.
// Ereignisse aus dem Spiel (record):
//   hand   {name, total, bust, skulls, streak, gold}      – nach jeder gewerteten Hand
//   reroll {n, lucky}                                    – n = Neuwürfe in dieser Hand
//   round  {score, target, handsLeft, rerolls, boss}      – Runde gewonnen (boss = Boss-ID oder null)
//   run    {won}                                          – Run zu Ende
//   state  {ante, money, luck, bag, skullFaces, numLevel, tags, maxSet, runBusts}
//   shop   {noBuy}  – Shop verlassen (noBuy = Shops in Folge ohne Kauf) · oracle · destroy
//   job (Jonnys Auftrag erledigt) · buy (etwas im Shop gekauft) · special (Jonny's Special gekauft)
((global) => {
  'use strict';
  const HAND_TYPES = 9, BOSS_COUNT = 6;
  const r = (id) => ['relic', id], o = (id) => ['oracle', id], u = (id) => ['upgrade', id], d = (id) => ['die', id], cups = (n) => ['cup', n];
  const cupMode = (id) => ['cupmode', id];   // Becher, der dauerhaft frei wird (wie der Classic Cup)
  const cnt = (obj) => Object.keys(obj || {}).length;

  const LIST = [
    // Fortschritt
    { id: 'first_round', name: 'Warm Hands', desc: 'Win your first round', on: 'round', test: () => true, rewards: [r('dial'), r('coin')] },
    { id: 'first_boss', name: 'Giant Slayer', desc: 'Beat a Showdown boss', on: 'round', test: (e) => !!e.boss, rewards: [r('day_night'), r('chameleon')] },
    { id: 'stage4', name: 'Halfway There', desc: 'Reach Stage 4', on: 'state', test: (e) => e.ante >= 4, rewards: [r('mirror'), r('compass')] },
    { id: 'stage7', name: 'Deep Waters', desc: 'Reach Stage 7', on: 'state', test: (e) => e.ante >= 7, rewards: [r('crossroads')] },
    { id: 'run_win', name: 'Würfelglück', desc: 'Win a run', on: 'run', test: (e) => e.won, rewards: [r('monument'), u('spare_die')] },
    { id: 'runs5', name: 'Regular', desc: 'Play 5 runs', on: ['run', 'state'], goal: 5, count: (p) => p.stats.runs, rewards: [r('hybrid_seed'), r('metamorphosis')] },
    { id: 'boss_all', name: 'Bossbuster', desc: 'Beat every Showdown boss once', on: 'round', goal: BOSS_COUNT, count: (p) => Object.keys(p.track.bosses || {}).filter((b) => b !== 'jonny').length, rewards: [r('tycoon')] },
    // Punkte
    { id: 'score1k', name: 'Four Digits', desc: 'Score 1,000 with one hand', on: 'hand', test: (e) => e.total >= 1000, rewards: [r('signature')] },
    { id: 'score10k', name: 'Big Numbers', desc: 'Score 10,000 with one hand', on: 'hand', test: (e) => e.total >= 10000, rewards: [r('trophy_case')] },
    { id: 'score100k', name: 'Astronomical', desc: 'Score 100,000 with one hand', on: 'hand', test: (e) => e.total >= 100000, rewards: [r('fusion')] },
    { id: 'overkill', name: 'Overkill', desc: 'Finish a round at 3x its target', on: 'round', test: (e) => e.score >= 3 * e.target, rewards: [r('number_king')] },
    { id: 'clutch', name: 'Clutch', desc: 'Win a round with your last hand', on: 'round', test: (e) => e.handsLeft === 0, rewards: [r('last_call')] },
    // Hände
    { id: 'five_kind', name: 'Five Alike', desc: 'Score a Five of a Kind', on: 'hand', test: (e) => !e.bust && e.name === 'Five of a Kind', rewards: [r('jackpot'), d('twofaced')] },
    { id: 'full_house', name: 'Full House', desc: 'Score a Full House', on: 'hand', test: (e) => !e.bust && e.name === 'Full House', rewards: [r('encore')] },
    { id: 'straight', name: 'Straight Shooter', desc: 'Score a Large Straight', on: 'hand', test: (e) => !e.bust && e.name === 'Large Straight', rewards: [r('gap_jumper'), r('spiral')] },
    { id: 'all_hands', name: 'Variety Show', desc: 'Score every hand type once', on: 'hand', goal: HAND_TYPES, count: (p) => cnt(p.track.hands), rewards: [r('variety')] },
    { id: 'combo5', name: 'On a Roll', desc: 'Play one hand type 5 times in a row', on: 'hand', test: (e) => e.streak >= 5, rewards: [r('iron_focus')] },
    // Glück
    { id: 'lucky25', name: 'Charmed', desc: 'Get 25 Lucky Hits', on: 'reroll', goal: 25, count: (p) => p.track.lucky || 0, rewards: [r('lucky_dividend'), r('loaded_clover')] },
    { id: 'luck50', name: 'Rabbit Hole', desc: 'Have 50 Luck or more', on: 'state', test: (e) => e.luck >= 50, rewards: [r('lucky_star')] },
    { id: 'bad_day', name: 'Bad Day', desc: 'Bust 3 times in one run', on: 'state', test: (e) => e.runBusts >= 3, rewards: [r('black_cat')] },
    // Risiko
    { id: 'first_bust', name: 'Skull and Bones', desc: 'Bust for the first time', on: 'hand', test: (e) => e.bust, rewards: [r('ritual_candle'), r('loaded_skulls')] },
    { id: 'two_skulls', name: 'Living Dangerously', desc: 'Score a hand with exactly 2 Skulls', on: 'hand', test: (e) => !e.bust && e.skulls === 2, rewards: [r('hellfire')] },
    { id: 'busts10', name: 'Graveyard Shift', desc: 'Bust 10 times', on: 'hand', goal: 10, count: (p) => p.track.busts || 0, rewards: [r('grave_digger')] },
    { id: 'skull_bag', name: 'Cursed Collection', desc: 'Have 4 Skull faces in your bag', on: 'state', test: (e) => e.skullFaces >= 4, rewards: [r('hex_bag'), o('devils_deal')] },
    { id: 'risk_set', name: 'Thrill Seeker', desc: 'Own 3 Risk relics at once', on: 'state', test: (e) => (e.tags.risk || 0) >= 3, rewards: [r('blood_pact'), r('evil_eye'), o('hex')] },
    // Neuwürfe und Halten
    { id: 'rerolls6', name: "Can't Stop", desc: 'Reroll 6 times in one hand', on: 'reroll', test: (e) => e.n >= 6, rewards: [r('whirlwind')] },
    { id: 'rerolls500', name: 'Dice Addict', desc: 'Reroll 500 times', on: 'reroll', goal: 500, count: (p) => p.track.rerolls || 0, rewards: [r('clockwork'), u('overdrive')] },
    { id: 'no_reroll', name: 'Steady Nerves', desc: 'Win a round without rerolling', on: 'round', test: (e) => e.rerolls === 0, rewards: [r('bedrock'), r('scaffold')] },
    // Geld
    { id: 'money25', name: 'Savings', desc: 'Have $25 at once', on: 'state', test: (e) => e.money >= 25, rewards: [r('compound'), r('suitcase')] },
    { id: 'window', name: 'Window Shopper', desc: 'Leave 3 shops in a row empty-handed', on: 'shop', test: (e) => e.noBuy >= 3, rewards: [r('miser')] },
    { id: 'money50', name: 'Moneybags', desc: 'Have $50 at once', on: 'state', test: (e) => e.money >= 50, rewards: [r('dragons_hoard'), u('overdraft')] },
    { id: 'golden', name: 'Golden Touch', desc: 'Score 5 Gold faces', on: 'hand', goal: 5, count: (p) => p.track.gold || 0, rewards: [r('golden_rule'), d('gilded')] },
    // Beutel, Zahlen, Orakel
    { id: 'bag10', name: 'Packrat', desc: 'Have 10 dice in your bag', on: 'state', test: (e) => e.bag >= 10, rewards: [r('brood'), r('collector')] },
    { id: 'destroy', name: 'Less Is More', desc: 'Destroy a die from your bag', on: 'destroy', test: () => true, rewards: [r('ash_urn')] },
    { id: 'level3', name: 'Specialist', desc: 'Raise a number to level 3', on: 'state', test: (e) => e.numLevel >= 3, rewards: [r('abacus'), r('opposites')] },
    { id: 'level5', name: 'Number Cruncher', desc: 'Raise a number to level 5', on: 'state', test: (e) => e.numLevel >= 5, rewards: [r('jacobs_ladder')] },
    { id: 'oracles10', name: 'Seer', desc: 'Use 10 Oracles', on: 'oracle', goal: 10, count: (p) => p.track.oracles || 0, rewards: [o('refraction'), u('crystal_ball')] },
    // Jonny: Aufträge, Shop, Endboss
    { id: 'jobs5', name: 'Helping Hand', desc: "Complete 5 of Jonny's jobs", on: 'job', goal: 5, count: (p) => p.track.jobs || 0, rewards: [cupMode('jonny')] },
    { id: 'jobs20', name: "Jonny's Favourite", desc: "Complete 20 of Jonny's jobs", on: 'job', goal: 20, count: (p) => p.track.jobs || 0, rewards: [r('jonny_glasses')] },
    { id: 'fine_print', name: 'Fine Print', desc: "Buy a Jonny's Special", on: 'special', test: () => true, rewards: [r('off_record')] },
    { id: 'customer', name: 'Loyal Customer', desc: 'Buy 50 things in the shop', on: 'buy', goal: 50, count: (p) => p.track.buys || 0, rewards: [r('mood_ring')] },
    { id: 'final_exam', name: 'Final Exam', desc: 'Beat Jonny in the final Showdown', on: 'round', test: (e) => e.boss === 'jonny', rewards: [r('jonny_autograph')] },
    // Sammeln
    { id: 'set5', name: 'Full Set', desc: 'Activate a 5-relic set bonus', on: 'state', test: (e) => e.maxSet >= 5, rewards: [cups(2)] },
    { id: 'hunter', name: 'Trophy Hunter', desc: 'Unlock 20 achievements', on: 'meta', goal: 20, count: (p) => cnt(p.ach), rewards: [cups(3)] },
    { id: 'complete', name: 'Completionist', desc: 'Unlock every other achievement', on: 'meta', goal: 0, count: (p) => LIST.filter((a) => !a.secret && a.id !== 'complete' && p.ach[a.id]).length, rewards: [cups(5)] },

    // ── Secrets: bis zum Freischalten als "???" versteckt. "secret"-Ereignisse kommen direkt aus dem Spiel ({id}). ──
    S('jonny_seen', 'Did You See That?', 'Spot Jonny floating through the background', [['palette', 'basement']]),
    S('jonny_caught', 'Gotcha!', 'Click the floating Jonny before he gets away', [cups(1)]),
    S('call_jonny', 'You Rang?', 'Type his name: J-O-N-N-Y', []),
    S('konami', 'Old School', 'Enter the Konami code in the main menu', [cups(1)]),
    S('logo', 'Hands Off', 'Click the title logo ten times', []),
    S('menu_yahtzee', 'Warm-Up Yahtzee', 'Roll the same number on all five menu dice', [cups(1)]),
    S('teacher_pet', "Teacher's Pet", 'Finish the tutorial without a single mistake', [cups(2)]),
    S('breaking_point', 'Breaking Point', 'Make Jonny give up on you in the tutorial', []),
    S('heartbreaker', 'Heartbreaker', 'Say no to Jonny until he walks away', []),
    S('tough_crowd', 'Tough Crowd', 'Skip 10 songs in a row', []),
    S('silence', 'Sound of Silence', 'Turn every volume slider down to zero', []),
    S('night_owl', 'Night Owl', 'Start a run between 2 and 5 at night', []),
    S('snooze', 'Snooze', 'Leave the dice alone for three minutes', []),
    S('photo_finish', 'Photo Finish', 'Win a round with at most 2% over the target', [cups(1)], 'round', (e) => e.score <= e.target * 1.02),
    S('irony', 'Ironic', 'Beat The Snake while owning Snake Eyes', [], 'round', (e) => e.boss === 'snake' && (e.relics || []).includes('snake_eyes')),
    S('bare_hands', 'Bare Hands', 'Beat a Showdown without owning a single relic', [cups(1)], 'round', (e) => !!e.boss && (e.relics || []).length === 0),
    S('spent', 'Spent It All', 'Buy something and leave the shop with exactly $0', [], 'shop', (e) => e.bought && e.money === 0),
    S('jonny_flawless', 'Jonny Who?', "Beat Jonny's Showdown with your first hand", [cups(1)], 'round', (e) => e.boss === 'jonny' && e.handsUsed === 1),
    S('buyers_remorse', "Buyer's Remorse", "Sell a Jonny's Special in the same shop you bought it", []),
  ];
  function S(id, name, desc, rewards, on = 'secret', test = (e) => e.id === id) { return { id, name, desc, rewards, on, test, secret: true }; }
  const BY_ID = Object.fromEntries(LIST.map((a) => [a.id, a]));
  BY_ID.complete.goal = LIST.filter((a) => !a.secret).length - 1;
  const key = (kind, id) => kind + ':' + id;
  // Gesperrte Dinge: alle Belohnungen außer Bechern
  const LOCKED = new Set();
  const SOURCE = {};   // Schlüssel -> Achievement, das ihn freischaltet
  for (const a of LIST) for (const [kind, id] of a.rewards) if (kind !== 'cup') { LOCKED.add(key(kind, id)); SOURCE[key(kind, id)] = a; }

  // Alte oder neue Speicherstände um die Felder ergänzen und Erfolge aus der bisherigen Statistik nachtragen
  function ensure(p) {
    if (!p) return p;
    if (!p.ach) p.ach = {};
    if (!p.track) p.track = {};
    for (const k of ['hands', 'bosses']) if (!p.track[k]) p.track[k] = {};
    if (!p.cups) p.cups = {};
    if (!p.achRetro) {
      p.achRetro = true;
      const st = p.stats || {}, now = Date.now(), give = (id) => { if (!p.ach[id]) { p.ach[id] = now; grant(p, BY_ID[id]); } };
      if (st.bestStage >= 2) { give('first_round'); give('first_boss'); }
      if (st.bestStage >= 4) give('stage4');
      if (st.bestStage >= 7) give('stage7');
      if (st.wins > 0) give('run_win');
      if (st.runs >= 5) give('runs5');
      if (st.bestHand >= 1000) give('score1k');
      if (st.bestHand >= 10000) give('score10k');
      if (st.bestHand >= 100000) give('score100k');
    }
    return p;
  }
  function grant(p, a) {
    for (const [kind, n] of a.rewards) if (kind === 'cup') for (let k = 0; k < n; k++) {
      const id = CUP_POOL.length ? CUP_POOL[Math.floor(Math.random() * CUP_POOL.length)] : null;
      if (id) p.cups[id] = (p.cups[id] || 0) + 1;
    }
  }
  let CUP_POOL = [];   // vom Spiel gesetzt: alle Becher außer Classic

  const earned = (p, id) => !!(p && p.ach && p.ach[id]);
  function isOpen(p, kind, id) {
    if (!p) return true;   // ohne Fortschritt (Tests): alles offen
    const k = key(kind, id);
    return !LOCKED.has(k) || earned(p, SOURCE[k].id);
  }
  function progress(p, a) {
    if (!a.goal) return null;
    return { n: Math.min(a.goal, a.count(ensure(p))), goal: a.goal };
  }
  function done(p, a, e) {
    if (a.goal) return a.count(p) >= a.goal;
    return !!a.test(e, p);
  }

  // Ereignis verbuchen; gibt die neu erreichten Achievements zurück
  function record(p, ev, e = {}) {
    if (!p) return [];
    ensure(p);
    const t = p.track;
    if (ev === 'hand') {
      if (e.bust) t.busts = (t.busts || 0) + 1;
      else if (e.name) t.hands[e.name] = 1;
      t.gold = (t.gold || 0) + (e.gold || 0);
    } else if (ev === 'reroll') {
      t.rerolls = (t.rerolls || 0) + 1;
      t.lucky = (t.lucky || 0) + (e.lucky || 0);
    } else if (ev === 'round' && e.boss) t.bosses[e.boss] = 1;
    else if (ev === 'oracle') t.oracles = (t.oracles || 0) + 1;
    else if (ev === 'job') t.jobs = (t.jobs || 0) + 1;
    else if (ev === 'buy') t.buys = (t.buys || 0) + 1;
    const got = [];
    const check = (name) => {
      for (const a of LIST) {
        if (p.ach[a.id]) continue;
        const on = Array.isArray(a.on) ? a.on : [a.on];
        if (!on.includes(name) || !done(p, a, e)) continue;
        p.ach[a.id] = Date.now();
        grant(p, a);
        got.push(a);
      }
    };
    check(ev);
    if (got.length) for (let k = 0; k < 2; k++) { const n = got.length; check('meta'); if (got.length === n) break; }
    return got;
  }

  // Alle Belohnungen eines Achievements als lesbare Liste
  const rewardKeys = (a) => a.rewards.map(([kind, id]) => ({ kind, id }));
  const MAIN = LIST.filter((a) => !a.secret), SECRETS = LIST.filter((a) => a.secret);
  const summary = (p) => ({ done: MAIN.filter((a) => earned(p, a.id)).length, total: MAIN.length, secrets: SECRETS.filter((a) => earned(p, a.id)).length,
    items: [...LOCKED].filter((k) => earned(p, SOURCE[k].id)).length, locked: LOCKED.size });

  const api = { LIST, MAIN, SECRETS, BY_ID, LOCKED, SOURCE, ensure, record, isOpen, earned, progress, rewardKeys, summary,
    setCupPool: (ids) => { CUP_POOL = ids.slice(); } };
  global.WGAchievements = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
