// Würfelglück – Spiel (Ablauf, Darstellung, Eingabe) auf Basis von BalatroFX. Regeln und Daten: rules.js
(() => {
  'use strict';
  const FX = BalatroFX, P = FX.PALETTE, UI = FX.UI, Art = FX.Art, R = WG;
  const { darken, lighten } = FX.color;
  // Pixelify Sans hat eine fehlerhafte "fi"-Ligatur ("final" sah aus wie "Anal"): Ligaturen für jeden Text abschalten
  const baseText = UI.text.bind(UI), baseMeasure = CanvasRenderingContext2D.prototype.measureText;
  const noLig = (ctx) => { if (ctx.textRendering !== 'optimizeSpeed') ctx.textRendering = 'optimizeSpeed'; };
  UI.text = (ctx, ...a) => { noLig(ctx); return baseText(ctx, ...a); };
  CanvasRenderingContext2D.prototype.measureText = function (t) { noLig(this); return baseMeasure.call(this, t); };
  const { clamp, rand } = FX.math;

  const canvas = document.getElementById('game');
  // Handy (index.html setzt WG_MOBILE): eigenes Layout, Touch-Bedienung, begrenzte Pixeldichte und schnellerer Hintergrund
  const MOBILE = !!window.WG_MOBILE;
  const eng = new FX.Engine(canvas, MOBILE ? { width: 1280, height: 720, background: 'menu', maxDpr: 2, maxPixels: 1.4e6, bgLowRes: true }
    : { width: 1280, height: 720, background: 'menu' });
  window.eng = eng;

  // ── Konstanten ──────────────────────────────────────────────────────────
  const DIE_S = MOBILE ? 2.9 : 2.2;  // 32 px × 2.2 ≈ 70 px auf dem Bildschirm (Handy größer)
  const HANDS_MAX = 4;               // Hände pro Blind
  const REROLLS_MAX = 3;             // Neu-Würfe pro Hand
  const ANTES = 8, START_MONEY = 4, START_BAG = 6;
  const ANTE_TARGET = [150, 400, 900, 2000, 4500, 9000, 18000, 35000]; // Platzhalter, zum Balancen
  const BLINDS = [
    { name: 'Warm-up', key: 'ROUND_1', factor: 1, reward: 3 },
    { name: 'High Stakes', key: 'ROUND_2', factor: 1.5, reward: 4 },
    { name: 'Showdown', key: 'ROUND_3', factor: 2, reward: 5, boss: true },
  ];
  const VAULT_MAX = 60;
  const CARD_S = MOBILE ? 1.3 : 1.12;   // Relikte und Verbrauchsgüter in den Leisten
  const TYPE_COL = { relic: '#E07A2E', constellation: P.PLANET, oracle: P.TAROT, tally: '#2F8F9D', die: P.GREEN, upgrade: '#3B5B9A' };
  const TYPE_NAME = { relic: 'Relic', constellation: 'Constellation', oracle: 'Oracle', tally: 'Tally', die: 'Die', upgrade: 'Upgrade' };
  const STAR_COLS = ['#13AFCE', '#3C7BD0', '#6B4F92', '#2E8B57', '#C2453E', '#D99A2B', '#8F3D6B', '#3A6F8F', '#4F6367'];
  const Icons = window.WGIcons;
  const Sound = window.WGSound || { play() {}, mood() {}, setVolume() {} };
  // Jonnys Stimme hat einen eigenen Regler (Einstellungen > Audio)
  const sfx = (name, o) => Sound.play(name, name === 'voice' ? Object.assign({}, o, { vol: amp(SETTINGS.voice) }) : o);
  const Music = window.WGMusic || { ok: false, mood() {}, duck() {}, setVolume() {} };
  // Musik-Situation: Dateien aus musics/ (music.js), sonst die erzeugte Ersatzmusik aus sound.js
  const SYNTH_MOOD = { menu: 'menu', early: 'table', mid: 'table', boss: 'boss', final: 'boss', shop: 'shop', victory: 'win', lose: 'lose' };
  function musicMood(name) { if (Music.ok) Music.mood(name); else Sound.mood(SYNTH_MOOD[name] || 'menu'); }
  // Jingle abspielen und die Musik so lange absenken
  function jingle(name, seconds) { sfx(name); Music.duck(seconds); }
  // Achievements (achievements.js): schalten Relikte, Orakel, Upgrades und Würfel pro Speicherplatz frei
  const ACH = window.WGAchievements || null;
  const open = (kind, id) => !ACH || TUT.active || ACH.isOpen(meta(), kind, id);
  // Musik einer Runde: Stage 1–3 ruhig, ab Stage 4 mehr Spannung, Showdowns mit Boss-Musik, Stage 8 mit dem großen Boss-Track
  const roundMood = () => (isBossBlind() ? (S.ante >= ANTES ? 'final' : 'boss') : S.ante >= 4 ? 'mid' : 'early');
  const Saves = window.WGSaves;
  // Gemeinsamer Fortschritt aller Speicherplätze: Statistik, Spielzeit, Becher, Achievements (saves.js)
  const meta = () => Saves.meta();

  // Becher: Startausrüstung und Sonderregeln für einen Run. Der Classic Cup ist immer verfügbar, alle anderen
  // gibt es nur über die Cup Draw (3 zufällige Becher) und sie werden beim Start eines Runs verbraucht.
  // Felder: bag (Würfeltypen), hands, rerolls, money, relics, randomRelics {rarity, n}, upgrades, luck, anchors,
  //         bagPlus, dieDiscount, relicSlots, numLevels, noHandReward, chaos
  const CUP_WORD = 'Cup';
  const CUP_DRAW_STAGE = 3;   // Showdown dieser Stage schlagen -> Cup Draw (einmal pro Run)
  const std = (n) => Array(n).fill('standard');
  const CUP_DEFAULTS = { bag: std(START_BAG), hands: HANDS_MAX, rerolls: REROLLS_MAX, money: START_MONEY, relics: [], upgrades: [] };
  const CUPS = [
    { id: 'classic', name: 'Classic Cup', colour: '#9A4E2C', short: 'The standard game',
      desc: 'The standard game. Six plain dice, 4 hands per round, 3 rerolls per hand and $4 to start. Always available.' },
    { id: 'jonny', name: "Jonny's Cup", colour: '#E7B23C', short: 'Jonny plays along', jonny: true,
      desc: 'Jonny plays along. Once per round, press Help: he picks the dice and rerolls for free. His jobs pay double. Start with one of his relics.' },
    { id: 'sprint', name: 'Sprint Cup', colour: '#D9682B', tag: 'reroll', short: '1 hand, 12 rerolls', hands: 1, rerolls: 12,
      desc: 'Only 1 hand per round, but 12 rerolls for it. Build one huge hand.' },
    { id: 'marathon', name: 'Marathon Cup', colour: '#56A887', tag: 'growth', short: '8 hands, 1 reroll each', hands: 8, rerolls: 1,
      desc: '8 hands per round, but only 1 reroll per hand. Relics that grow every hand love this.' },
    { id: 'gambler', name: "Gambler's Cup", colour: '#8F2D3B', tag: 'risk', short: 'Cursed Dice and Evil Eye', bag: std(4).concat(['cursed', 'cursed']), relics: ['evil_eye'],
      desc: 'Two of your six dice are Cursed Dice with Skulls. You start with the Evil Eye relic.' },
    { id: 'velvet', name: 'Velvet Cup', colour: '#C9A13B', tag: 'bank', short: '$15 and a Vault', money: 15, upgrades: ['vault'], noHandReward: true,
      desc: 'Start with $15 and the Vault upgrade. Unused hands no longer pay out at the end of a round.' },
    { id: 'clover', name: 'Clover Cup', colour: '#2E8B57', tag: 'luck', short: '+25 Luck, only 5 dice', luck: 25, bag: std(5),
      desc: '+25 Luck for the whole run, but only 5 dice in your bag.' },
    { id: 'highroller', name: 'High Roller Cup', colour: '#3C7BD0', tag: 'number', short: 'Only 4s, 5s and 6s', bag: Array(6).fill('high'), numLevels: { 6: 2 },
      desc: 'Your dice only show 4, 5 and 6, so Straights are almost impossible. Your 6s start at level 2.' },
    { id: 'twin', name: 'Twin Cup', colour: '#2F8F9D', tag: 'pattern', short: '3 Two-Faced Dice', bag: std(3).concat(['twofaced', 'twofaced', 'twofaced']),
      desc: 'Three of your six dice are Two-Faced Dice: every face shows two numbers and uses the better one.' },
    { id: 'iron', name: 'Iron Cup', colour: '#3A6F8F', tag: 'hold', short: '2 Anchors, 2 rerolls', anchors: 2, rerolls: 2,
      desc: 'Up to 2 held dice stay on the table for the next hand, keeping their faces. Only 2 rerolls per hand.' },
    { id: 'sack', name: 'Sack Cup', colour: '#7A5A3A', tag: 'bag', short: '10 dice, bigger bag', bag: std(10), bagPlus: 4, dieDiscount: 1,
      desc: 'Start with 10 dice. Your bag holds 4 more and dice in the shop cost $1 less.' },
    { id: 'glass', name: 'Glass Cup', colour: '#7FB8C9', short: '2 Rare relics, 3 slots', randomRelics: { rarity: 'R', n: 2 }, relicSlots: 3,
      desc: 'Start with 2 random Rare relics, but you only have 3 relic slots.' },
    { id: 'chaos', name: 'Chaos Cup', colour: '#6B4F92', short: 'New twist every stage', chaos: true,
      desc: 'Every stage brings a random twist: more hands, fewer rerolls, higher targets, money or a free relic.' },
  ].map((c) => Object.assign({}, CUP_DEFAULTS, c));
  const CUP_BY_ID = Object.fromEntries(CUPS.map((c) => [c.id, c]));
  // Becher für die Cup Draw: alle außer Classic und Jonny's Cup (der wird per Achievement dauerhaft frei)
  const drawableCups = () => CUPS.filter((c) => c.id !== 'classic' && !c.jonny);
  if (ACH) ACH.setCupPool(drawableCups().map((c) => c.id));
  // Endboss in Stage 8: Jonny. Er schummelt und nimmt jede Hand die Regel eines anderen Bosses (S.jonnyRule).
  const JONNY_BOSS = { id: 'jonny', name: 'Jonny', colour: '#A8742A', factor: 2.5, final: true,
    get desc() {
      const r = jonnyRuleBoss();
      return r ? 'This hand: ' + r.name + ' - ' + r.desc : 'The final boss. He cheats: every hand he picks a new rule from the other bosses';
    } };
  const jonnyRuleBoss = () => (S.boss === JONNY_BOSS && S.jonnyRule && ['rolling', 'select', 'scoring', 'won', 'lost'].includes(S.phase) ? R.BOSSES.find((b) => b.id === S.jonnyRule) || null : null);
  // Wirksamer Boss: bei Jonny die Regel der aktuellen Hand
  const curBoss = () => (S.boss === JONNY_BOSS ? R.BOSSES.find((b) => b.id === S.jonnyRule) || null : S.boss);
  // Chaos Cup: pro Stage eine zufällige Zusatzregel
  const CHAOS = [
    { id: 'rush', name: 'Rush', desc: '-1 hand per round, +2 rerolls per hand', hands: -1, rerolls: 2 },
    { id: 'patience', name: 'Patience', desc: '+2 hands per round, -1 reroll per hand', hands: 2, rerolls: -1 },
    { id: 'fourleaf', name: 'Four-Leaf', desc: '+25 Luck this stage', luck: 25 },
    { id: 'payday', name: 'Payday', desc: 'Earn $8 right away', money: 8 },
    { id: 'tax', name: 'High Tax', desc: 'Targets x1.3 this stage, rounds pay $3 more', target: 1.3, reward: 3 },
    { id: 'study', name: 'Study', desc: 'A random hand gains +1 level', level: true },
    { id: 'gift', name: 'Gift', desc: 'Get a random Common relic if you have room', gift: 'C' },
    { id: 'calm', name: 'Calm', desc: 'Targets x0.8 this stage', target: 0.8 },
  ];
  const CHAOS_BY_ID = Object.fromEntries(CHAOS.map((c) => [c.id, c]));

  // ── Texturen ────────────────────────────────────────────────────────────
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
  const STAR_COLOURS = [P.RED, P.ORANGE, P.GOLD, P.GREEN, P.BLUE, P.PURPLE];
  const SKULL = ['..XXXXXXX..', '.XXXXXXXXX.', 'XXXXXXXXXXX', 'XX..XXX..XX', 'XX..XXX..XX', 'XXXXX.XXXXX', '.XXXX.XXXX.', '..XXXXXXX..', '..X.X.X.X..', '..XXXXXXX..'];
  const MINI_PIPS = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] };
  const blankDie = (opts) => Art.die(1, Object.assign({}, opts, { onePip: opts.body }));
  function drawSkull(ctx, colourAt) {
    SKULL.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === 'X') { ctx.fillStyle = colourAt(x, y); ctx.fillRect(10 + x, 8 + y, 1, 1); } }));
  }
  const faceCache = {};
  function faceEntry(f, type) {
    const key = type + '|' + f.v + '|' + f.kind;
    if (faceCache[key]) return faceCache[key];
    const opts = Object.assign({ edge: R.DIE_TYPES[type].edge || undefined }, FACE_STYLE[f.kind]);
    let c;
    if (f.kind === 'wild') {
      // Wild: leere Fläche mit buntem Pixel-Stern
      c = blankDie(opts);
      const ctx = c.getContext('2d');
      for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
        const a = Math.abs(dx), b = Math.abs(dy);
        if ((a <= 1 && b <= 6) || (b <= 1 && a <= 6) || a + b <= 4) {
          ctx.fillStyle = STAR_COLOURS[(dx + dy + 12) % STAR_COLOURS.length];
          ctx.fillRect(16 + dx, 14 + dy, 1, 1);
        }
      }
    } else if (f.kind === 'skull' || f.kind === 'hex') {
      // Schädel: knochenfarben, Hex: bunt
      c = blankDie(opts);
      drawSkull(c.getContext('2d'), (x, y) => (f.kind === 'hex' ? STAR_COLOURS[(x + y) % STAR_COLOURS.length] : '#EDE6D6'));
    } else if (f.kind === 'twin') {
      // Zwei Zahlen: oben links v, unten rechts 7-v
      c = blankDie(opts);
      const ctx = c.getContext('2d');
      const pips = (v, x0, y0, col) => MINI_PIPS[v].forEach(([i, j]) => { ctx.fillStyle = col; ctx.fillRect(x0 + i * 4, y0 + j * 4, 2, 2); });
      pips(f.v, 4, 3, P.BLACK);
      pips(7 - f.v, 18, 16, '#1D6F6A');
      ctx.fillStyle = '#9CC9C0';
      for (let k = 0; k < 7; k++) ctx.fillRect(26 - k * 3, 4 + k * 3, 1, 1);
    } else {
      c = Art.die(f.v, opts);
      if (f.kind === 'prism') {
        // Regenbogen auf allen weißen Flächen
        const ctx = c.getContext('2d'), img = ctx.getImageData(0, 0, 32, 32), d = img.data;
        for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
          const k = (y * 32 + x) * 4;
          if (d[k] === 255 && d[k + 1] === 255 && d[k + 2] === 255) {
            const [r, g, b] = hsl(((x + y) * 11) % 360, 0.85, 0.82);
            d[k] = r; d[k + 1] = g; d[k + 2] = b;
          }
        }
        ctx.putImageData(img, 0, 0);
      }
    }
    return (faceCache[key] = { canvas: c, tex: eng.texture(c) });
  }
  function hsl(h, s, l) {
    const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [f(0) * 255, f(8) * 255, f(4) * 255].map(Math.round);
  }
  const faceTex = (f, type) => faceEntry(f, type).tex;

  Art.ICONS.none = () => {};
  const texCache = {};
  const cached = (key, make) => texCache[key] || (texCache[key] = eng.texture(make()));
  function itemTex(item) {
    if (item.type === 'relic') { const d = R.RELIC_BY_ID[item.id]; return cached('r:' + d.id, () => Icons.card(d.id, d.colour, d.rarity)); }
    if (item.type === 'upgrade') { const d = R.UPGRADE_BY_ID[item.id]; return cached('u:' + d.id, () => Icons.card(d.id, TYPE_COL.upgrade, d.rarity)); }
    if (item.type === 'constellation') { const i = R.HAND_ORDER.indexOf(item.hand); return cached('c:' + item.hand, () => Icons.card('star:' + item.hand, STAR_COLS[i])); }
    if (item.type === 'tally') {
      return cached('t:' + item.n, () => { const c = Art.joker('none', TYPE_COL.tally, '#FFFFFF'); c.getContext('2d').drawImage(Art.die(item.n), 20, 26); return c; });
    }
    if (item.type === 'oracle') { const d = R.ORACLE_BY_ID[item.id]; return cached('o:' + d.id, () => Icons.card(d.id, P.TAROT)); }
    return null;
  }
  // Kleines Upgrade-Symbol für die Seitenleiste
  function upgradeIcon(id) {
    return cached('ui:' + id, () => {
      const c = Art.canvas(34, 34)[0], ctx = c.getContext('2d');
      Art.pixelRect(ctx, 0, 0, 34, 34, darken(TYPE_COL.upgrade, 0.35), [3, 1]);
      Art.pixelRect(ctx, 1, 1, 32, 31, TYPE_COL.upgrade, [2, 1]);
      Icons.draw(ctx, id, 17, 17, 28);
      return c;
    });
  }

  // ── Zustand ─────────────────────────────────────────────────────────────
  // phase: menu | rolling | select | scoring | won | shop | lost | runWon
  const S = {
    phase: 'menu', ante: 1, blindIdx: 0, target: 0, score: 0, dispScore: 0,
    hands: HANDS_MAX, rerolls: REROLLS_MAX, money: START_MONEY, chips: 0, mult: 0, handName: '', handNameT: 0, msg: null,
    bag: [], relics: [], cons: [], upgrades: [], levels: {}, numLevels: {}, handCounts: {}, boss: null, usedBosses: [],
    played: [], rerollsHand: 0, rerollsBlind: 0, rerollTotal: 0, freeReroll: false, lucky: 0, whirls: 0, coldHand: 0,
    vault: 0, anchored: [],
    shop: null, shopRerollCost: 1, upgradeOffer: null, bought: false, pruneUsed: false, choice: null,
    cup: 'classic', time: 0, scoreStep: 0, chaos: null, cupDrawn: false, cupDraw: null,
    ach: null,   // Achievement-Zähler für diesen Run: letzte Hand, Serie, Busts, Shops ohne Kauf
    job: null,   // Jonnys Auftrag für die laufende (bzw. im Shop: die nächste) Runde
    jonny: null, // Jonny im Run: erledigte Aufträge, bester Wurf, sein Anteil, Hilfe im Jonny's Cup, Shop-Besuche
    jonnyRule: null,   // Endboss Jonny: Regel der aktuellen Hand (Boss-ID)
  };
  const freshJonny = () => ({ jobs: 0, failed: 0, best: 0, cut: 0, helps: 0, help: false, tags: {}, rerolls: 0, visit: 0, last: null });
  S.jonny = freshJonny();
  const freshAch = () => ({ last: null, streak: 0, busts: 0, noBuy: 0 });
  S.ach = freshAch();
  const cup = () => CUP_BY_ID[S.cup] || CUPS[0];
  const chaosRule = () => (cup().chaos && S.chaos ? CHAOS_BY_ID[S.chaos] : null);
  const chaosVal = (k) => { const c = chaosRule(); return (c && c[k]) || 0; };
  const relicMax = () => cup().relicSlots || R.MAX_RELICS;
  let dice = [], menuDice = [], relicSprites = [], consSprites = [], bagSprites = [], shopSprites = [], upgSprites = [];
  let selected = null;
  const J = { chips: new FX.Juice(), mult: new FX.Juice(), score: new FX.Juice(), money: new FX.Juice(), hands: new FX.Juice(), rerolls: new FX.Juice(), name: new FX.Juice() };

  const btn = (x, y, w, h, label, colour, extra = {}) => Object.assign({ x, y, w, h, label, colour, juice: new FX.Juice(), hover: false }, extra);
  const B = {
    roll: btn(430, 494, 220, 52, 'Reroll', P.ORANGE),
    play: btn(670, 494, 220, 52, 'Play Hand', P.BLUE),
    start: btn(530, 560, 220, 66, 'PLAY', P.BLUE, { size: 34 }),
    options: btn(760, 566, 150, 54, 'Options', P.ORANGE, { size: 24 }),
    retry: btn(715, 420, 160, 54, 'Try Again', P.RED),
    next: btn(1024, 186, 170, 52, 'Next Round', P.RED, { size: 24 }),
    shopReroll: btn(1024, 246, 170, 44, 'Reroll $1', P.GREEN, { size: 22 }),
    deposit: btn(976, 404, 128, 38, 'Deposit $5', '#C9A13B', { size: 18 }),
    withdraw: btn(1112, 404, 132, 38, 'Withdraw', P.ORANGE, { size: 18 }),
    use: btn(0, 0, 80, 30, 'Use', P.GREEN, { size: 18 }),
    sell: btn(0, 0, 90, 30, 'Sell', '#D99A2B', { size: 18 }),
    act: btn(0, 0, 110, 30, '', P.PURPLE, { size: 18 }),
    settings: btn(1172, 565, 84, 26, 'Settings', P.L_BLACK, { size: 15 }),
    close: btn(560, 552, 160, 50, 'Close', P.RED, { size: 24 }),
    quit: btn(650, 552, 180, 50, 'Save & Quit', P.ORANGE, { size: 22 }),
    home: btn(535, 420, 160, 54, 'Main Menu', P.L_BLACK, { size: 22 }),
    back: btn(560, 622, 160, 52, 'Back', P.RED, { size: 24 }),
    begin: btn(660, 616, 240, 62, 'Start Run', P.BLUE, { size: 30 }),
    collect: btn(570, 470, 180, 56, 'Collect', P.GREEN, { size: 26 }),
    tutYes: btn(492, 400, 250, 60, 'Yes, teach me!', P.GREEN, { size: 26 }),
    tutNo: btn(772, 400, 210, 60, 'No thanks', P.RED, { size: 24 }),
    tutDone: btn(1010, 628, 250, 64, 'Finish Tutorial', P.BLUE, { size: 24 }),
    tutSlot: btn(1000, 492, 220, 54, 'Play Tutorial', P.PURPLE, { size: 22 }),
    tutX: btn(1176, 32, 58, 58, 'X', P.RED, { size: 34 }),
    cupPrev: btn(70, 262, 56, 60, '<', P.ORANGE, { size: 30 }),
    cupNext: btn(1154, 262, 56, 60, '>', P.ORANGE, { size: 30 }),
    trophies: btn(370, 566, 150, 54, 'Trophies', P.GOLD, { size: 24 }),
    achPrev: btn(470, 622, 70, 52, '<', P.ORANGE, { size: 30 }),
    achNext: btn(740, 622, 70, 52, '>', P.ORANGE, { size: 30 }),
    help: btn(900, 494, 86, 52, 'Help!', '#8F5FC0', { size: 20 }),
  };
  const BUY = [0, 1, 2, 3, 4].map((k) => btn(0, 412, 100, 38, 'Buy', P.BLUE, { size: 20, slot: k }));
  const CHOICE = [0, 1, 2].map((k) => btn(0, 300, 170, 60, '', P.BLUE, { size: 22, choice: k }));
  // Speicherplätze: drei Spalten links, rechts daneben das Tutorial (sobald es einmal angeboten wurde).
  // Ein Platz enthält nur einen Run: Hauptknopf (Weiter / Neuer Run) und, bei laufendem Run, Aufgeben.
  const SLOT_W = 300, SLOT_X = (k) => 40 + k * 312, TUT_CARD = { x: 980, y: 136, w: 260, h: 458 };
  const SLOT_MAIN = [0, 1, 2].map((k) => btn(SLOT_X(k) + 20, 492, SLOT_W - 40, 54, 'New Run', P.BLUE, { size: 24, slotMain: k }));
  const SLOT_DEL = [0, 1, 2].map((k) => btn(SLOT_X(k) + SLOT_W / 2 - 75, 552, 150, 30, 'Abandon Run', P.L_BLACK, { size: 16, slotDel: k }));
  // Einstellungen in Reitern. Zeilen: Regler (slider), Auswahl (< Wert >) oder Aktion (ein Knopf)
  const SET_TABS = [
    { id: 'audio', label: 'Audio', rows: [
      { key: 'master', label: 'Master volume', slider: true }, { key: 'music', label: 'Music', slider: true },
      { key: 'sfx', label: 'Sound effects', slider: true }, { key: 'voice', label: "Jonny's voice", slider: true },
      { key: 'songTitles', label: 'Song titles' }, { key: 'muteBg', label: 'Mute when unfocused' }] },
    { id: 'video', label: 'Video', rows: [
      { key: 'palette', label: 'Colours' }, { key: 'background', label: 'Background' }, { key: 'font', label: 'Font' },
      { key: 'crt', label: 'CRT effect' }, { key: 'shake', label: 'Screen shake' }, { key: 'particles', label: 'Particles' },
      { key: 'fullscreen', label: 'Fullscreen' }] },
    { id: 'game', label: 'Gameplay', rows: [
      { key: 'speed', label: 'Game speed' }, { key: 'tipDelay', label: 'Tooltip delay' }, { key: 'textSpeed', label: 'Jonny text speed' },
      { key: 'jonnyTalk', label: 'Jonny chatter' }, { key: 'reset', label: 'Reset progress', action: 'Reset' }] },
    { id: 'controls', label: 'Controls', rows: [] },
  ];
  if (MOBILE) {
    // Handy: Tooltips per langem Druck (keine Verzögerung einstellbar), Vollbild nur, wenn der Browser es kann
    const fsOK = !!(document.fullscreenEnabled && document.documentElement.requestFullscreen);
    SET_TABS.forEach((tb) => { tb.rows = tb.rows.filter((r) => r.key !== 'tipDelay' && (r.key !== 'fullscreen' || fsOK)); });
  }
  let setTab = 0;
  const SET_Y = (k) => 232 + k * 46;
  const SLIDER = { x: 606, w: 218 };   // Regler-Bahn in den Lautstärke-Zeilen
  const sliderRect = (k) => (MOBILE ? mSlider(k).hit : { x: SLIDER.x - 12, y: SET_Y(k) - 20, w: SLIDER.w + 24, h: 40 });
  const SET_TAB_BTNS = SET_TABS.map((tb, i) => btn(364 + i * 140, 150, 132, 42, tb.label, P.L_BLACK, { size: 22, setTab: i }));
  const SET_BTNS = [];
  SET_TABS.forEach((tb, ti) => tb.rows.forEach((r, k) => {
    if (r.slider) return;
    if (r.action) { SET_BTNS.push(btn(730, SET_Y(k) - 18, 160, 36, r.action, P.RED, { size: 20, inTab: ti, setRow: k, action: true })); return; }
    SET_BTNS.push(btn(626, SET_Y(k) - 18, 44, 36, '<', P.BLUE, { size: 24, inTab: ti, setRow: k, dir: -1 }));
    SET_BTNS.push(btn(870, SET_Y(k) - 18, 44, 36, '>', P.BLUE, { size: 24, inTab: ti, setRow: k, dir: 1 }));
  }));
  const setRows = () => SET_TABS[setTab].rows;
  const setBtnsNow = () => SET_BTNS.filter((b) => b.inTab === setTab);
  const ALL_BUTTONS = Object.values(B).concat(BUY, CHOICE, SET_TAB_BTNS, SET_BTNS, SLOT_MAIN, SLOT_DEL);
  const MENU_PHASES = ['menu', 'slots', 'cups', 'trophies'];
  const inMenus = () => MENU_PHASES.includes(S.phase);
  // Speichern und Beenden geht nur in ruhigen Momenten (Würfel liegen, Shop offen) – oder nach Ende des Runs
  const canQuit = () => (['select', 'shop'].includes(S.phase) && !S.choice && !eng.busy) || ['lost', 'runWon'].includes(S.phase);
  function activeButtons() {
    if (settingsOpen) return [...SET_TAB_BTNS, ...setBtnsNow(), B.close, ...(inMenus() ? [] : [B.quit])];
    const tb = TUT.buttons();
    if (TUT.modal || tb.length) return tb;
    if (S.cupDraw) return [B.collect];
    if (S.choice) return CHOICE;
    if (S.phase === 'menu') return [B.start, B.options, ...(ACH ? [B.trophies] : [])];
    if (S.phase === 'slots') return [...slotButtons(), ...(tutorialSeen() ? [B.tutSlot] : []), B.back];
    if (S.phase === 'cups') return [B.cupPrev, B.cupNext, B.begin, B.back];
    if (S.phase === 'trophies') return [B.achPrev, B.achNext, B.back];
    if (S.phase === 'lost' || S.phase === 'runWon') return [B.retry, ...(profile ? [B.home] : []), B.settings];
    if (S.phase === 'won') return [B.settings];
    const sel = selButtons();
    if (S.phase === 'shop') return [B.settings, B.next, B.shopReroll, ...BUY.filter((b) => S.shop && S.shop[b.slot]), ...(upg('vault') ? [B.deposit, B.withdraw] : []), ...sel];
    return [B.settings, B.roll, B.play, ...(helpShown() ? [B.help] : []), ...sel];
  }
  function selButtons() {
    if (!selected) return [];
    const k = selected.data.kind, act = actFor(selected) ? [B.act] : [];
    if (k === 'cons') return [B.use, B.sell];
    if (k === 'relic') return [B.sell, ...act];
    return act;
  }

  // ── Hilfen ──────────────────────────────────────────────────────────────
  const blind = () => BLINDS[S.blindIdx];
  const isBossBlind = () => S.blindIdx === 2;
  const bossActive = (id) => isBossBlind() && !!curBoss() && curBoss().id === id && S.phase !== 'shop';
  const dieX = (i, n = dice.length) => L.die.x + (i - (n - 1) / 2) * L.die.gap(n);
  const dieY = () => L.die.y;
  // Popup-Position an Relikten: unter der Karte (oder darüber, je nach Layout)
  const fxY = (sp, k = 0) => sp.y + (L.fxDir || 1) * (62 + 28 * k);
  const spot = (name) => L.spots[name];
  const allIdx = () => dice.map((_, i) => i);
  const upFace = (sp) => sp.data.die.faces[sp.data.up];
  const eff = () => R.effective(S.relics);
  const has = (id) => eff().some((e) => e.def.id === id);
  const upg = (id) => S.upgrades.includes(id);
  const setOn = (tag, n) => R.setLevel(R.tagCounts(S.relics), tag) >= n;
  const relicSprite = (id) => relicSprites[eff().findIndex((e) => e.def.id === id)];
  const bagMax = () => R.MAX_BAG + (cup().bagPlus || 0) + (upg('backpack') ? 4 : 0) + (setOn('bag', 3) ? 2 : 0);
  const minMoney = () => (upg('overdraft') ? -20 : 0);
  const canPay = (price) => S.money - price >= minMoney();
  const drawCount = () => Math.min(S.bag.length, upg('spare_die') ? 6 : 5);
  const handsMax = () => Math.max(1, cup().hands + chaosVal('hands') - (upg('overdrive') ? 1 : 0) - (has('blood_pact') ? 1 : 0));
  const rerollsMax = () => (bossActive('clamp') ? 1 : Math.max(0, cup().rerolls + chaosVal('rerolls')) + (upg('overdrive') ? 2 : 0) + (setOn('reroll', 3) ? 1 : 0) + eff().reduce((a, e) => a + (e.def.extraRerolls || 0), 0));
  const anchorCap = () => (cup().anchors || 0) + (upg('anchor') ? 1 : 0) + (setOn('hold', 3) ? 1 : 0);
  const bustAt = () => 3 + (upg('rabbit_foot') ? 1 : 0) + (setOn('risk', 3) ? 1 : 0);
  const heldCount = () => dice.filter((d) => d.data.held).length;
  const skullsShowing = () => dice.filter((d) => d.data.die && R.isSkull(upFace(d))).length;
  const frozen = (sp) => bossActive('frost') && sp.data.die && upFace(sp).v === 6 && upFace(sp).kind !== 'wild' && !R.isSkull(upFace(sp));
  const fmtMult = (v) => (Math.abs(v - Math.round(v)) < 0.05 ? UI.num(v) : v.toFixed(1));
  const fmtX = (v) => (Math.abs(v - Math.round(v)) < 0.01 ? String(Math.round(v)) : String(+v.toFixed(2)));
  const TAG_COL = (t) => R.TAGS[t].colour;
  function mostPlayed() {
    let best = null;
    for (const n of R.HAND_ORDER) if ((S.handCounts[n] || 0) > 0 && (!best || S.handCounts[n] > S.handCounts[best])) best = n;
    return best;
  }
  // Spielzustand für rules.js (Wertung, Luck, Zinsen, Relikt-Ereignisse)
  function ctx(extra) {
    return Object.assign({
      relics: S.relics, upgrades: S.upgrades, levels: S.levels, numLevels: S.numLevels,
      boss: isBossBlind() ? curBoss() : null, isBoss: isBossBlind() && S.phase !== 'shop', played: S.played, handCounts: S.handCounts,
      rerollsHand: S.rerollsHand, rerollsBlind: S.rerollsBlind, rerollsLeft: S.rerolls, money: S.money, vault: S.vault,
      bag: S.bag, bagSize: S.bag.length, bagTypes: new Set(S.bag.map((d) => d.type)).size,
      lucky: S.lucky, whirls: S.whirls, skullsShowing: skullsShowing(), heldCount: heldCount(),
      grow: setOn('growth', 3) ? 1.5 : 1, keep: setOn('growth', 5), mostPlayed: mostPlayed(), rnd: Math.random,
      bonusLuck: (cup().luck || 0) + chaosVal('luck'),
    }, extra);
  }
  const luck = (extra) => R.luckOf(ctx(extra));
  function blindTarget(idx) {
    const base = ANTE_TARGET[Math.min(S.ante - 1, ANTE_TARGET.length - 1)];
    const factor = idx === 2 ? (S.boss && S.boss.factor) || BLINDS[2].factor : BLINDS[idx].factor;
    return Math.round(base * factor * (chaosVal('target') || 1));
  }
  function blindLabel(idx = S.blindIdx) {
    return idx === 2 && S.boss ? { name: S.boss.name, colour: S.boss.colour } : { name: BLINDS[idx].name, colour: P[BLINDS[idx].key] };
  }
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const fresh = () => [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()];
  const relicName = (ri) => R.RELIC_BY_ID[S.relics[ri].id].name;

  // Löst ein Relikt-Ereignis aus (rules.js) und zeigt die Rückmeldung am Relikt.
  function fire(event, args = [], extra = {}) {
    const g = ctx(extra), out = [];
    R.effective(S.relics).forEach((e) => {
      const fn = e.def[event];
      if (!fn) return;
      const r = fn(e.s, g, ...args);
      if (!r) return;
      out.push(Object.assign({ ri: e.ri }, r));
      const rs = relicSprites[e.ri];
      if (rs) {
        rs.juiceUp(0.35);
        if (r.text) { eng.popup(rs.x, fxY(rs), r.text, { colour: P.GOLD, size: 18 }); sfx('relic', { step: e.ri }); }
        if (r.money && !extra.noMoney) addMoney(r.money, rs.x, fxY(rs, 1));
      }
    });
    return out;
  }

  function updateFlames() {
    const ratio = (S.chips * S.mult) / Math.max(1, S.target - S.score);
    let I = 0;
    if (S.phase === 'scoring' && S.chips > 0) I = ratio >= 1 ? 0.9 + Math.min(1, Math.log10(ratio)) * 0.9 : ratio > 0.4 ? (ratio - 0.4) * 1.2 : 0;
    eng.setFlame('chips', Object.assign({ intensity: I, colours: [lighten(P.CHIPS, 0.6), P.CHIPS] }, L.flames.chips));
    eng.setFlame('mult', Object.assign({ intensity: I, colours: [P.FLAME, P.MULT] }, L.flames.mult));
  }

  function addChips(v, x, y) {
    S.chips += v; J.chips.up(0.35); sfx('pips', { step: S.scoreStep++ });
    eng.popup(x, y, (v < 0 ? '' : '+') + v, { colour: P.CHIPS });
    eng.emit(x, y, { count: 10, colours: [P.CHIPS, '#FFFFFF'], speed: 260, size: 9, life: 0.5 });
  }
  function addMult(v, x, y) {
    S.mult += v; J.mult.up(0.35); sfx('power', { step: S.scoreStep++ });
    eng.popup(x, y, '+' + fmtX(v) + ' Power', { colour: P.MULT });
    eng.emit(x, y, { count: 10, colours: [P.MULT, '#FFFFFF'], speed: 260, size: 9, life: 0.5 });
  }
  function xMult(v, x, y) {
    S.mult *= v; J.mult.up(0.5); sfx('xpower');
    eng.popup(x, y, 'X' + fmtX(v) + ' Power', { colour: P.XMULT, size: 30 });
    eng.emit(x, y, { count: 18, colours: [P.MULT, P.ORANGE, '#FFFFFF'], speed: 360, size: 11, life: 0.6, shape: 'diamond' });
    eng.shake(3);
  }
  function addMoney(v, x, y) {
    S.money += v; J.money.up(0.4);
    sfx(v < 0 ? 'pay' : 'coin');
    if (v < 0) { eng.popup(x, y, '-$' + -v, { colour: P.RED }); return; }
    eng.popup(x, y, '+$' + v, { colour: P.MONEY, textColour: P.BLACK });
    eng.emit(x, y, { count: 12, colours: [P.MONEY, P.GOLD], speed: 260, size: 8, life: 0.6, shape: 'circle' });
  }
  function showMsg(text, colour, sub, life = 2.2) { S.msg = { text, colour, sub, t0: eng.time, life }; }
  function denied(x, y, text) { sfx('deny'); eng.popup(x, y, text, { colour: P.GREY, size: 20, life: 1.1 }); eng.shake(2); }

  // ── Würfel in der Hand ──────────────────────────────────────────────────
  // Gehaltene Würfel werden angehoben und orange getönt (verankerte blau), eingefrorene hellblau.
  function layoutDice() {
    dice.forEach((d, i) => {
      d.z = 10 + i;
      d.moveTo(dieX(i), dieY() - (d.data.held ? L.die.lift : 0), 0);
      d.tint = d.data.held ? [d.data.anchored ? P.BLUE : P.ORANGE, 0.3] : frozen(d) ? ['#9FD8FF', 0.45] : null;
    });
  }
  function refreshDieTex(sp) { sp.tex = faceTex(upFace(sp), sp.data.die.type); }

  function createHandDice(n) {
    for (const d of dice) d.dissolveOut(0.4);
    const blank = R.DIE_TYPES.standard.faces[0];
    dice = Array.from({ length: n }, (_, i) => eng.sprite({ tex: faceTex(blank, 'standard'), x: dieX(i, n), y: dieY(), s: DIE_S, z: 10 + i, tiltStrength: 0.8, data: { kind: 'die', die: null, up: 0, held: false } }));
    dice.forEach((d) => d.materialize(0.6, { colours: [P.WHITE, P.ORANGE] }));
  }

  // Zieht Würfel aus dem Beutel (verankerte bleiben liegen) und würfelt sie.
  function newHand() {
    const n = drawCount();
    while (dice.length > n) dice.pop().dissolveOut(0.4);
    const keep = S.anchored.filter((a) => a.i < dice.length && S.bag.includes(a.die));
    S.anchored = [];
    const kept = new Set(keep.map((a) => a.die));
    const pool = shuffle(S.bag.filter((d) => !kept.has(d)));
    dice.forEach((sp, i) => {
      const a = keep.find((x) => x.i === i);
      Object.assign(sp.data, { held: !!a, anchored: !!a, rerolled: 0, rnd: fresh() });
      if (a) { sp.data.die = a.die; sp.data.up = a.up; refreshDieTex(sp); } else { sp.data.die = pool.pop(); sp.data.up = 0; }
    });
    if (isBossBlind() && S.boss === JONNY_BOSS && !TUT.active) jonnyNewRule();
    S.rerolls = rerollsMax(); S.rerollsHand = 0; S.freeReroll = has('loaded'); S.lucky = 0; S.whirls = 0; S.coldHand = 0;
    fire('newHand');
    if (S.hands === 1 && handsMax() > 1) jonnyLastHand();
    layoutDice();
    if (TUT.active) TUT.beginHand();
    animate(outcomes(allIdx().filter((i) => !dice[i].data.anchored), true));
  }

  // Ergebnisse vorab berechnen (Luck wirkt nur beim Neu-Würfeln mit gehaltenen Würfeln)
  function outcomes(idx, initial, extra) {
    if (TUT.active && !extra) return TUT.rig(idx, initial);   // Tutorial: gezinkte Würfel
    const L = initial ? 0 : luck(extra);
    const targets = initial ? [] : R.luckTargets(dice.filter((d) => d.data.held).map(upFace), has('spiral'));
    const out = {};
    idx.forEach((i) => { const d = dice[i].data; out[i] = R.rollFace(d.die, d.rnd || (d.rnd = fresh()), L, targets, has('loaded_skulls')); });
    return out;
  }

  // Würfel-Animation; danach ist wieder Eingabe möglich.
  function animate(out, done) {
    S.phase = 'rolling';
    const idx = Object.keys(out).map(Number);
    let pending = idx.length;
    const finishRoll = () => { layoutDice(); S.phase = 'select'; if (done) done(); autosave(); TUT.event('handReady'); };
    if (!pending) { eng.after(0.2, finishRoll); return; }
    sfx('rattle', { n: idx.length, dur: 0.55 + 0.1 * (idx.length - 1) });
    idx.forEach((i, k) => {
      const d = dice[i], die = d.data.die, x = dieX(i);
      let n = 0;
      const tick = () => {
        n++;
        if (n < 10) {
          d.tex = faceTex(die.faces[(Math.random() * die.faces.length) | 0], die.type);
          d.juiceUp(0.12);
          d.moveTo(x + rand(-8, 8), dieY() - Math.sin((n / 10) * Math.PI) * 60, rand(-0.8, 0.8));
          eng.after(0.06, tick);
          return;
        }
        d.data.up = out[i].up; d.data.rnd = fresh(); refreshDieTex(d);
        d.moveTo(x, dieY(), 0); d.juiceUp(0.5); d.flashWhite(0.6); sfx('land');
        eng.emit(d.x, d.y + 40, { count: 14, colours: [P.WHITE, P.ORANGE, P.GOLD], speed: 300, size: 8, life: 0.6, angle: -Math.PI / 2, spread: 2.4 });
        if (out[i].lucky) {
          eng.popup(x, dieY() - 70, 'Lucky!', { colour: P.GREEN, size: 22 }); sfx('lucky');
          eng.emit(x, dieY(), { count: 18, colours: [P.GREEN, '#FFFFFF', P.GOLD], speed: 320, size: 9, life: 0.7, shape: 'star' });
        }
        eng.shake(2);
        if (--pending === 0) eng.after(0.25, finishRoll);
      };
      eng.after(k * 0.1, tick);
    });
  }

  function toggleHold(die) {
    if (S.phase !== 'select' || !die.data.die) return;
    die.data.held = !die.data.held;
    if (!die.data.held) die.data.anchored = false;
    die.juiceUp(0.25);
    sfx('hold', { on: die.data.held });
    TUT.event(die.data.held ? 'hold' : 'unhold', { v: upFace(die).v, i: dice.indexOf(die) });
    eng.emit(die.x, die.y, { count: 8, colours: die.data.held ? [P.ORANGE, P.WHITE] : [P.BLUE, P.WHITE], speed: 180, size: 7, life: 0.4 });
    layoutDice();
  }

  function rerollTargets() { return allIdx().filter((i) => !dice[i].data.held && !frozen(dice[i])); }

  function reroll(opts = {}) {
    if (S.phase !== 'select') return;
    const every3 = setOn('reroll', 5) && (S.rerollTotal + 1) % 3 === 0;
    const free = S.freeReroll || every3 || !!opts.jonny;
    if (!free && S.rerolls <= 0) return;
    let idx = rerollTargets();
    if (bossActive('chaos')) {
      const extra = allIdx().filter((i) => dice[i].data.held && !frozen(dice[i]) && !has('lockbox') && Math.random() < 1 / 3);
      extra.forEach((i) => { dice[i].data.held = false; dice[i].data.anchored = false; eng.popup(dice[i].x, dice[i].y - 70, 'Chaos!', { colour: S.boss.colour, size: 22 }); });
      idx = idx.concat(extra).sort((a, b) => a - b);
    }
    if (!idx.length) return;
    TUT.event('reroll');
    if (opts.jonny) eng.popup(B.roll.x + B.roll.w / 2, B.roll.y - 24, "Jonny's reroll!", { colour: JONNY_GOLD, size: 22 });
    else if (S.freeReroll) {
      S.freeReroll = false;
      const rs = relicSprite('loaded');
      if (rs) { rs.juiceUp(0.4); eng.popup(rs.x, fxY(rs), 'Free!', { colour: P.GREEN, size: 20 }); }
    } else if (every3) eng.popup(B.roll.x + B.roll.w / 2, B.roll.y - 24, 'Free reroll!', { colour: TAG_COL('reroll'), size: 20 });
    else { S.rerolls--; J.rerolls.up(0.4); }
    S.rerollsHand++; S.rerollsBlind++; S.rerollTotal++;
    const held = heldCount();
    if (idx.length === dice.length) S.whirls++;
    idx.forEach((i) => { dice[i].data.rerolled = (dice[i].data.rerolled || 0) + 1; });
    if (has('cold_storage') && held) {
      const m = Math.min(held, 3 - S.coldHand), rs = relicSprite('cold_storage');
      if (m > 0) { S.coldHand += m; addMoney(m, rs.x, fxY(rs)); }
    }
    if (has('roulette') && Math.random() < 1 / 6) {
      const rs = relicSprite('roulette');
      if (!free) { S.rerolls++; J.rerolls.up(0.4); }
      rs.juiceUp(0.5); eng.popup(rs.x, fxY(rs, 1), 'Refund!', { colour: P.GREEN, size: 20 }); addMoney(2, rs.x, fxY(rs));
    }
    const jackpot = fire('beforeReroll').some((r) => r.jackpot);
    if (TUT.active) TUT.beginReroll();
    const out = outcomes(idx, false);
    if (jackpot) forceFive(idx, out);
    else if (has('last_call') && !free && S.rerolls === 0) forcePair(idx, out);
    let lucky = 0;
    idx.forEach((i) => { if (out[i].lucky) { lucky++; luckyHit(i, out[i]); } });
    S.lucky += lucky;
    achieve('reroll', { n: S.rerollsHand, lucky });
    jobEvent('reroll', { lucky });
    jonnyReroll(lucky);
    fire('onReroll', [{ lucky, held }]);
    animate(out);
  }

  function luckyHit(i, o) {
    const f = dice[i].data.die.faces[o.up];
    if (has('lucky_star') && f.kind === 'normal' && Math.random() < 0.25) {
      f.kind = 'gold';
      const rs = relicSprite('lucky_star'); rs.juiceUp(0.4); eng.popup(rs.x, fxY(rs), 'Gold!', { colour: P.GOLD, size: 18 });
    }
    if (has('lucky_dividend')) { const rs = relicSprite('lucky_dividend'); rs.juiceUp(0.4); addMoney(1, rs.x, fxY(rs)); }
  }
  const faceAfter = (i, out) => (out[i] ? dice[i].data.die.faces[out[i].up] : upFace(dice[i]));
  // Last Call: der letzte Neu-Wurf ergibt mindestens ein Paar
  function forcePair(idx, out) {
    const fs = allIdx().map((i) => faceAfter(i, out));
    if (fs.some((f) => f.kind === 'wild' || f.kind === 'hex')) return;
    const vals = fs.map((f) => (R.isSkull(f) ? 0 : f.v));
    if (R.evaluate(vals).maxCount >= 2) return;
    for (const i of idx) for (const j of allIdx()) {
      if (j === i || !vals[j]) continue;
      const k = dice[i].data.die.faces.findIndex((f) => !R.isSkull(f) && f.v === vals[j]);
      if (k >= 0) { out[i] = { up: k, lucky: false }; eng.popup(dice[i].x, dieY() - 100, 'Last Call!', { colour: P.ORANGE, size: 20 }); return; }
    }
  }
  // Jackpot Counter: alle neu geworfenen Würfel landen auf derselben Zahl
  function forceFive(idx, out) {
    const heldVals = dice.filter((d) => d.data.held && !R.isSkull(upFace(d)) && upFace(d).kind !== 'wild').map((d) => upFace(d).v);
    const cnt = (v) => heldVals.filter((x) => x === v).length;
    let t = 6;
    if (heldVals.length) t = heldVals.slice().sort((a, b) => cnt(b) - cnt(a) || b - a)[0];
    else for (let v = 6; v >= 1; v--) if (idx.every((i) => dice[i].data.die.faces.some((f) => f.v === v && !R.isSkull(f)))) { t = v; break; }
    idx.forEach((i) => {
      const k = dice[i].data.die.faces.findIndex((f) => !R.isSkull(f) && (f.v === t || f.kind === 'wild'));
      if (k >= 0) out[i] = { up: k, lucky: false };
    });
  }

  // ── Wertung ─────────────────────────────────────────────────────────────
  function playHand() {
    if (S.phase !== 'select') return;
    TUT.event('play');
    S.phase = 'scoring';
    S.scoreStep = 0;
    selected = null;
    S.hands--; J.hands.up(0.4);
    fire('beforeHand');
    const res = R.scoreHand(ctx({
      faces: dice.map(upFace), held: dice.map((d) => d.data.held),
      extras: dice.map((d) => ({ chips: d.data.die.chips || 0, rerolled: d.data.rerolled || 0 })),
    }));
    S.played.push(res.name);
    S.handName = res.name; S.handNameT = eng.time; J.name.up(0.3);
    S.chips = res.baseChips; S.mult = res.baseMult; J.chips.up(0.3); J.mult.up(0.3);
    dice.forEach((d, i) => { d.tint = res.scoring.includes(i) ? null : res.used.includes(i) ? ['#374244', 0.4] : ['#1C2426', 0.7]; });
    // Wild-, Hex- und Two-Faced-Seiten zeigen, welche Zahl sie annehmen
    dice.forEach((d, i) => {
      const f = upFace(d), v = res.vals[i];
      if (res.used.includes(i) && v && (f.kind === 'wild' || f.kind === 'hex' || f.kind === 'skull' || (f.kind === 'twin' && v !== f.v))) eng.popup(d.x, d.y + 56, '= ' + v, { colour: P.PURPLE, size: 20 });
    });

    eng.queue(() => res.scoring.forEach((i) => dice[i].moveTo(dieX(i), dieY() - 30, 0)), 0.5);
    for (const step of res.steps) eng.queue(() => applyStep(step), 0.38);
    eng.queue(() => startFuse(Math.round(S.chips * S.mult * res.factor)), 0.6);
    eng.queue(() => {
      if (fuse && !fuse.landed) { S.score += fuse.total; S.dispScore = S.score; }   // falls nicht gezeichnet wurde
      const total = fuse ? fuse.total : 0;
      fuse = null;
      TUT.event('scored', { total });
      const A = S.ach;
      A.streak = res.name === A.last ? A.streak + 1 : 1; A.last = res.name;
      if (res.bust) A.busts++;
      const gold = res.bust ? 0 : res.scoring.filter((i) => ['gold', 'prism'].includes(upFace(dice[i]).kind)).length;
      achieve('hand', { name: res.name, total, bust: !!res.bust, skulls: res.skulls, streak: A.streak, gold });
      jobEvent('hand', { name: res.name, total, bust: !!res.bust, skulls: res.skulls, rerolls: S.rerollsHand, held: heldCount(), vals: res.scoring.map((i) => res.vals[i]) });
      S.jonny.best = Math.max(S.jonny.best, total);
      jonnyHand(res, total);
      S.chips = 0; S.mult = 0; S.handName = ''; afterHand(res);
    }, FUSE.end + 0.25);
    eng.queue(() => {
      dice.forEach((d) => { d.data.held = false; d.data.anchored = false; d.tint = null; });
      if (S.score >= S.target) return winBlind();
      if (S.hands <= 0) { if (TUT.extraHand()) { S.hands = 1; return newHand(); } return loseRun(); }
      newHand();
    }, 0.6);
  }

  // ── Abschluss-Animation: Power fliegt in Pips, Einschlag, Ergebnis fliegt in den Score ──
  // Zeiten in Sekunden ab Start: Flug bis hit, Hochzählen bis launch, Flug zum Score bis land.
  const FUSE = { hit: 0.42, launch: 1.0, land: 1.45, end: 1.55 };
  let fuse = null;
  function startFuse(total) {
    fuse = { t0: eng.time, chips: S.chips, mult: S.mult, total, ratio: total / Math.max(1, S.target - S.score), hit: false, landed: false };
    const [mx, my] = spot('multBox');
    sfx('whoosh');
    if (profile) { const st = meta().stats; st.hands++; st.bestHand = Math.max(st.bestHand, total); }
    eng.emit(mx, my, { count: 12, colours: [P.MULT, P.WHITE], speed: 200, size: 8, life: 0.5 });
  }
  const lerp = (a, b, k) => a + (b - a) * k;
  // Was die Seitenleiste gerade zeigen soll (für das Layout)
  function fuseView() {
    if (!fuse) return null;
    const age = eng.time - fuse.t0;
    if (age < FUSE.hit) return { hideMult: true, chipsText: null, merged: false };
    if (age < FUSE.launch) {
      const k = FX.Ease.outCubic(Math.min(1, (age - FUSE.hit) / 0.35));
      return { hideMult: true, merged: true, chipsText: UI.num(Math.round(lerp(fuse.chips, fuse.total, k))) };
    }
    return { hideMult: true, merged: false, chipsText: '0' };
  }
  function flyBox(ctx, x, y, w, h, colour, text, size, scale, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(scale, scale);
    UI.box(ctx, -w / 2, -h / 2, w, h, { colour, radius: 9, emboss: 4 });
    UI.text(ctx, text, 0, -2, { size });
    ctx.restore();
  }
  function drawFuse(ctx) {
    if (!fuse) return;
    const age = eng.time - fuse.t0, big = fuse.ratio >= 1;
    const [cx, cy] = spot('chipsBox'), [mx, my] = spot('multBox'), [sx, sy] = spot('scoreBox');
    const bw = L.scoreBox.w, bh = L.scoreBox.h;
    if (age < FUSE.hit) {
      // 1) Power hebt ab und fliegt im Bogen in die Pips-Box
      const k = FX.Ease.inCubic(age / FUSE.hit);
      const x = lerp(mx, cx, k), y = lerp(my, cy, k) - Math.sin(k * Math.PI) * 46;
      flyBox(ctx, x, y, bw, bh, P.MULT, fmtMult(fuse.mult), 36, 1 + 0.18 * Math.sin(k * Math.PI) - 0.25 * k, -0.5 * k);
      eng.emit(x, y, { count: 2, colours: [P.MULT, P.FLAME], speed: 60, size: 6, life: 0.35 });
    } else if (!fuse.hit) {
      // 2) Einschlag
      fuse.hit = true;
      sfx('impact', { big });
      J.chips.up(big ? 0.9 : 0.6);
      eng.shake(big ? 12 : 6);
      eng.pulseBackground(big ? 2 : 1, big ? 10 : 5);
      eng.emit(cx, cy, { count: big ? 60 : 34, colours: [P.MULT, P.CHIPS, P.WHITE, P.GOLD], speed: big ? 560 : 400, size: 11, life: 0.8, shape: 'star' });
      eng.popup(cx, cy - 56, 'X' + fmtMult(fuse.mult), { colour: P.XMULT, size: 28, life: 0.8 });
    }
    // Schockwellen-Ring nach dem Einschlag
    const ring = (age - FUSE.hit) / 0.35;
    if (ring > 0 && ring < 1) {
      ctx.save();
      ctx.globalAlpha = 1 - ring;
      ctx.strokeStyle = P.WHITE; ctx.lineWidth = 6 * (1 - ring) + 1;
      ctx.beginPath(); ctx.arc(cx, cy, 30 + ring * (big ? 110 : 80), 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    if (age >= FUSE.launch && age < FUSE.land) {
      // 3) Ergebnis fliegt hoch in den Score
      const q = (age - FUSE.launch) / (FUSE.land - FUSE.launch), k = q < 0.5 ? 4 * q * q * q : 1 - Math.pow(2 - 2 * q, 3) / 2;
      const x = lerp(cx, sx, k) - Math.sin(k * Math.PI) * 30, y = lerp(cy, sy, k);
      flyBox(ctx, x, y, bw, bh, P.ORANGE, UI.num(fuse.total), 30, 1 - 0.35 * k, Math.sin(k * Math.PI) * 0.25);
      eng.emit(x, y, { count: 3, colours: [P.GOLD, P.ORANGE, P.WHITE], speed: 70, size: 7, life: 0.45, shape: 'star' });
    } else if (age >= FUSE.land && !fuse.landed) {
      // 4) Aufprall im Score: jetzt wird gutgeschrieben
      fuse.landed = true;
      sfx('land_score', { big });
      S.score += fuse.total;
      eng.tween(S, { dispScore: S.score }, 0.6, FX.Ease.outCubic);
      J.score.up(big ? 0.8 : 0.5);
      eng.shake(big ? 8 : 3);
      eng.emit(sx, sy, { count: big ? 50 : 26, colours: [P.WHITE, P.GOLD, P.ORANGE], speed: 420, size: 10, life: 0.8 });
      eng.popup(...spot('total'), '+' + UI.num(fuse.total), { colour: P.ORANGE, size: 30, life: 1.1 });
    }
    // fuse bleibt bis zum Zurücksetzen nach der Hand bestehen, damit die Boxen nicht kurz die alten Werte zeigen
  }

  // Nach der Wertung: Seiten abnutzen, Relikte wachsen lassen, Anker setzen
  function afterHand(res) {
    S.handCounts[res.name] = (S.handCounts[res.name] || 0) + 1;
    res.prism.forEach((i) => {
      const f = upFace(dice[i]);
      f.uses = (f.uses || 0) + 1;
      if (f.uses >= 3) { f.kind = 'normal'; delete f.uses; refreshDieTex(dice[i]); eng.popup(dice[i].x, dieY() - 90, 'Cracked!', { colour: P.GREY, size: 20 }); }
    });
    if (res.candle !== undefined) {
      const d = dice[res.candle]; upFace(d).kind = 'normal'; refreshDieTex(d);
      eng.popup(d.x, dieY() - 90, 'Skull burned', { colour: P.ORANGE, size: 20 });
    }
    res.scoring.forEach((i) => { const die = dice[i].data.die; die.scoredBlind = (die.scoredBlind || 0) + 1; });
    const heldDice = dice.filter((d) => d.data.held).map((d) => d.data.die);
    const outs = fire('afterHand', [res], { heldDice });
    outs.filter((o) => o.transform).forEach((o) => transformRelic(o.ri, o.transform));
    if (setOn('bank', 5)) { const a = R.interestInfo(ctx()).amount; if (a > 0) addMoney(a, ...spot('money')); }
    setAnchors();
    refreshBag();
  }

  // Anker: gehaltene Würfel (bis zur Kapazität) bleiben für die nächste Hand liegen
  function setAnchors() {
    const keep = allIdx().filter((i) => dice[i].data.held).slice(0, anchorCap());
    const keptDice = keep.map((i) => dice[i].data.die);
    S.bag.forEach((d) => { if (!keptDice.includes(d)) d.anchorStreak = 0; });
    keep.forEach((i) => {
      const die = dice[i].data.die;
      die.anchorStreak = (die.anchorStreak || 0) + 1;
      if (has('monument') && die.anchorStreak >= 3) {
        const f = upFace(dice[i]);
        die.faces = die.faces.map(() => ({ v: f.v, kind: f.kind }));
        die.anchorStreak = 0;
        relicSprite('monument').juiceUp(0.5);
        eng.popup(dice[i].x, dieY() - 100, 'Monument!', { colour: P.GOLD, size: 24 });
      }
    });
    S.anchored = keep.map((i) => ({ i, die: dice[i].data.die, up: dice[i].data.up }));
  }

  // Ein Wertungsschritt aus rules.scoreHand, mit sichtbarer Rückmeldung
  function applyStep(s) {
    const d = s.i !== undefined ? dice[s.i] : null;
    const rs = s.r !== undefined ? relicSprites[s.r] : null;
    let x = rs ? rs.x : d ? d.x : L.msg.x, y = rs ? fxY(rs) : d ? d.y - 70 : dieY() - 110;
    if (s.src === 'upg') [x, y] = spot('upgrade');
    if (s.src === 'debuff') { d.juiceUp(0.2); eng.popup(x, y, 'Debuffed', { colour: P.GREY, size: 20 }); return; }
    if (s.src === 'msg') {
      if (s.small) { d.juiceUp(0.3); eng.popup(x, y - 24, s.text, { colour: P.ORANGE, size: 20 }); return; }
      eng.popup(x, y, s.text, { colour: P.RED, size: s.bust ? 44 : 30, life: 1.4 });
      eng.shake(s.bust ? 12 : 6);
      if (s.bust) sfx('bust');
      if (s.bust) eng.emit(x, y, { count: 50, colours: [P.RED, '#2B2230', '#EDE6D6'], speed: 520, size: 11, life: 0.9 });
      // Bust kostet Geld, aber nicht unter 0 (bzw. unter das Overdraft-Limit)
      const m = s.money ? Math.max(s.money, minMoney() - S.money) : 0;
      if (m < 0) addMoney(m, ...spot('money'));
      return;
    }
    if (s.src === 'set') {
      const t = R.TAGS[s.tag];
      eng.popup(d ? d.x : L.msg.x, (d ? d.y : dieY()) - 104, t.name + ' set', { colour: lighten(t.colour, 0.3), size: 18 });
    }
    if (s.src === 'upg') eng.popup(x, y - 26, R.UPGRADE_BY_ID[s.id].name, { colour: P.WHITE, size: 18 });
    if (rs) { rs.juiceUp(0.45); rs.flashWhite(0.35); }
    if (d) { d.juiceUp(0.35); d.flashWhite(0.4); }
    if (s.text && rs) eng.popup(x, y - 24, s.text, { colour: P.GOLD, size: 20 });
    if (s.chips) addChips(s.chips, x, y);
    if (s.mult) addMult(s.mult, x, y);
    if (s.xmult) xMult(s.xmult, x, y);
    if (s.money) addMoney(s.money, x, y);
  }

  // ── Spielablauf ─────────────────────────────────────────────────────────
  function pickBoss() {
    if (S.ante >= ANTES && !TUT.active) { S.boss = JONNY_BOSS; return; }
    let pool = R.BOSSES.filter((b) => !S.usedBosses.includes(b.id));
    if (!pool.length) { S.usedBosses = []; pool = R.BOSSES.slice(); }
    S.boss = R.pick(pool);
    S.usedBosses.push(S.boss.id);
  }
  function rollUpgrade() {
    const pool = R.UPGRADES.filter((u) => !S.upgrades.includes(u.id) && open('upgrade', u.id));
    return pool.length ? R.pickWeighted(pool.map((u) => [u.id, R.RARITY[u.rarity].weight])) : null;
  }

  function startRun(cupId = 'classic') {
    clearMenuSprites();
    S.cup = cupId;
    const c = cup();
    S.ante = 1; S.blindIdx = 0; S.money = c.money; S.vault = 0; S.time = 0; S.chaos = null; S.cupDrawn = false; S.cupDraw = null;
    S.relics = []; S.cons = []; S.upgrades = c.upgrades.slice(); S.levels = {}; S.numLevels = Object.assign({}, c.numLevels); S.handCounts = {}; S.usedBosses = [];
    S.rerollTotal = 0; S.anchored = []; S.msg = null; S.choice = null; S.ach = freshAch();
    S.job = null; S.jonny = freshJonny(); S.jonnyRule = null;
    S.bag = c.bag.map((type) => R.makeDie(type));
    pickBoss();
    S.upgradeOffer = rollUpgrade();
    refreshBag(); refreshUpgrades();
    c.relics.forEach((id) => addRelic(id));
    if (c.randomRelics) for (let k = 0; k < c.randomRelics.n; k++) { const id = randomRelic(c.randomRelics.rarity, true); if (id) addRelic(id); }
    if (c.jonny) addRelic(R.pick(R.JONNY_RELICS));
    if (c.chaos) rollChaos();
    if (profile) { meta().lastCup = cupId; lastSaved = ''; }
    const hour = new Date().getHours();
    if (profile && hour >= 2 && hour < 5) secret('night_owl');
    startBlind();
  }

  function startBlind() {
    const b = blind(), lab = blindLabel();
    S.phase = 'rolling';
    S.target = blindTarget(S.blindIdx);
    S.score = 0; S.dispScore = 0; S.hands = handsMax(); S.chips = 0; S.mult = 0; S.handName = '';
    S.played = []; S.rerollsBlind = 0; S.anchored = []; S.jonnyRule = null; S.jonny.help = false;
    if (b.boss) {
      bgName = 'table';
      eng.setBackgroundColour(S.boss.colour, { contrast: 2 });
      showMsg(S.boss.name, S.boss.colour, S.boss.desc, S.boss === JONNY_BOSS ? 3.2 : 2.6);
      sfx('boss');
      if (S.boss === JONNY_BOSS) jonnyIntro();
    } else {
      setBg('table');
      showMsg(lab.name, lab.colour, 'Reach ' + UI.num(S.target) + ' points', 1.8);
      sfx('chime');
    }
    musicMood(roundMood());
    if (!b.boss) jonnyRoundStart();
    fire('startBlind');
    if (TUT.active) TUT.roundStart(S.blindIdx);
    createHandDice(drawCount());
    eng.after(0.6, newHand);
  }

  function winBlind() {
    S.phase = 'won';
    TUT.event('roundWon');
    achieve('round', { score: S.score, target: S.target, handsLeft: S.hands, handsUsed: S.played.length, rerolls: S.rerollsBlind, boss: isBossBlind() && S.boss ? S.boss.id : null, relics: S.relics.map((r) => r.id) });
    const ii = R.interestInfo(ctx());
    const parts = [['Round', blind().reward + chaosVal('reward')], ['Hands', cup().noHandReward ? 0 : S.hands], ['Interest', ii.amount]];
    const jobPay = jobSettle();
    if (jobPay) parts.push(["Jonny's job", jobPay]);
    if (S.jonny.cut) { parts.push(["Jonny's cut", -S.jonny.cut]); S.jonny.cut = 0; }
    S.jonny.last = { score: S.score, target: S.target, boss: isBossBlind() && S.boss ? S.boss.name : null };
    if (isBossBlind() && S.boss === JONNY_BOSS) jonnySay(BOSS_TALK.defeat.slice(0, 1), { important: true, replace: true, place: 'corner' });
    if (ii.maxed) eff().forEach((e) => { if (e.def.id === 'compound') { e.s.grow++; const rs = relicSprites[e.ri]; rs.juiceUp(0.4); eng.popup(rs.x, fxY(rs), 'Cap +$1', { colour: P.GOLD, size: 18 }); } });
    fire('endBlind', [], { noMoney: true }).forEach((o) => { if (o.money) parts.push([relicName(o.ri), o.money]); });
    if (upg('vault') && S.vault > 0) {
      const nv = Math.min(VAULT_MAX, Math.ceil(S.vault * 1.2));
      if (nv > S.vault) eng.popup(...spot('vault'), 'Vault +$' + (nv - S.vault), { colour: P.GOLD, size: 20 });
      S.vault = nv;
    }
    if (has('brood') && S.bag.length < bagMax()) {
      const best = S.bag.reduce((a, d) => ((d.scoredBlind || 0) > (a.scoredBlind || 0) ? d : a), S.bag[0]);
      if (best.scoredBlind) { S.bag.push(R.copyDie(best)); const rs = relicSprite('brood'); rs.juiceUp(0.4); eng.popup(rs.x, fxY(rs), 'Hatched!', { colour: P.GREEN, size: 18 }); }
    }
    S.bag.forEach((d) => { d.scoredBlind = 0; });
    refreshBag();
    const reward = parts.reduce((s, p) => s + p[1], 0);
    setBg('won', { spin: 2.5 });
    jingle('cleared', 2.6);
    showMsg('Round cleared!', P.GOLD, parts.filter((p) => p[1] !== 0).map((p) => p[0] + (p[1] < 0 ? ' -$' + -p[1] : ' $' + p[1])).join('  ·  '), 2.6);
    eng.emit(L.msg.x, L.msg.y, { count: 90, colours: [P.MONEY, P.GOLD, '#FFFFFF', P.ORANGE], speed: 700, size: 12, life: 1.3, gravity: 650, shape: 'circle' });
    eng.shake(8);
    for (const d of dice) d.dissolveOut(0.8);
    dice = [];
    eng.after(0.8, () => { S.money += reward; J.money.up(0.6); });
    eng.after(2.8, () => {
      const go = () => {
        S.blindIdx++;
        if (S.blindIdx >= BLINDS.length) { S.blindIdx = 0; S.ante++; if (S.ante <= ANTES) { pickBoss(); anteStart(); } }
        if (S.ante > ANTES) runWon(); else enterShop();
      };
      if (TUT.active && isBossBlind()) return;   // Tutorial endet nach dem ersten Showdown
      if (profile && !S.cupDrawn && S.ante === CUP_DRAW_STAGE && isBossBlind()) startCupDraw(go); else go();
    });
  }

  // Neue Ante: Muster-Boni, neues Upgrade-Angebot
  function anteStart() {
    const outs = fire('anteStart');
    if (cup().chaos) rollChaos();
    const ups = outs.filter((o) => o.levelUp).length + (setOn('pattern', 3) ? 1 : 0), mp = mostPlayed();
    if (ups && mp) {
      S.levels[mp] = (S.levels[mp] || 1) + ups;
      eng.after(0.4, () => { showMsg(mp, P.PLANET, 'Pattern bonus: Level ' + S.levels[mp], 2); sfx('magic'); });
    }
    S.upgradeOffer = rollUpgrade();
  }

  function loseRun() {
    S.phase = 'lost';
    setBg('lose');
    jingle('gameover', 4);
    musicMood('lose');
    endRun(false);
    showMsg('Game Over', P.RED, 'Stage ' + S.ante + ', ' + blindLabel().name, 999);
    eng.after(1.3, () => jonnyEnd(false));
    clearSprites({ colours: [P.ORANGE, P.RED] });
    eng.shake(10);
  }

  function runWon() {
    S.phase = 'runWon';
    setBg('gold', { spin: 2 });
    jingle('fanfare', 3.5);
    musicMood('victory');
    endRun(true);
    clearSprites({ colours: [P.GOLD, P.WHITE] });
    showMsg('Run complete!', P.GOLD, 'All ' + ANTES + ' stages cleared', 999);
    eng.after(1.3, () => jonnyEnd(true));
    eng.emit(L.msg.x, L.msg.y, { count: 120, colours: [P.MONEY, P.GOLD, '#FFFFFF'], speed: 700, size: 12, life: 1.6, gravity: 500, shape: 'star' });
  }

  function clearSprites(opts) {
    for (const s of dice.concat(relicSprites, consSprites, bagSprites, shopSprites, upgSprites)) if (s) s.dissolveOut(0.8, opts);
    dice = []; relicSprites = []; consSprites = []; bagSprites = []; shopSprites = []; upgSprites = [];
    selected = null; S.choice = null;
  }

  function backToMenu() {
    TUT.stop();
    clearSprites();
    eng.events.length = 0; eng.timers.length = 0;   // offene Abläufe der verlassenen Runde verwerfen
    fuse = null;
    S.msg = null;
    jonnyClear();
    setupMenu();
  }

  // Ab und zu ein anderer Untertitel im Hauptmenü
  const MENU_SUBS = ['a dice roguelite (Jonny approved)', 'a dice roguelite. probably.', 'now with 100% more dice', 'roll responsibly',
    'Jonny was here', 'a dice roguelite, not a casino', 'the house always... wait, what house?'];
  let menuSub = 'a dice roguelite';
  function setupMenu() {
    menuSub = Math.random() < 0.08 ? R.pick(MENU_SUBS) : 'a dice roguelite';
    clearMenuSprites();
    S.phase = 'menu';
    setBg('menu', { spin: 2 });
    musicMood('menu');
    eng.flames.clear();
    placeMenuDice();
  }
  function retryRun() {
    clearSprites();
    eng.events.length = 0; eng.timers.length = 0; fuse = null; S.msg = null;
    jonnyClear();
    if (profile) openCups(); else setupMenu();
  }
  function clearMenuSprites() {
    for (const s of menuDice) s.dissolveOut(0.6, { colours: [P.WHITE, P.BLUE] });
    for (const s of cupSprites) s.dissolveOut(0.5, { colours: [P.WHITE, P.ORANGE] });
    menuDice = []; cupSprites = [];
  }

  // ── Speicherstände (saves.js): 3 Plätze mit Statistik und laufendem Run ──
  // Gespeichert wird automatisch, sobald die Würfel liegen oder der Shop offen ist, und beim Verlassen der Seite.
  let slot = -1, profile = null, lastSaved = '', saveClock = 0, confirmBtn = null;
  const slotData = [null, null, null];
  const RUN_KEYS = ['cup', 'ante', 'blindIdx', 'target', 'score', 'hands', 'rerolls', 'money', 'vault', 'bag', 'relics', 'cons', 'upgrades',
    'levels', 'numLevels', 'handCounts', 'usedBosses', 'played', 'rerollsHand', 'rerollsBlind', 'rerollTotal', 'freeReroll', 'lucky', 'whirls',
    'coldHand', 'shop', 'shopRerollCost', 'upgradeOffer', 'bought', 'pruneUsed', 'chaos', 'cupDrawn', 'ach', 'job', 'jonny', 'jonnyRule'];

  function snapshot() {
    const bi = (d) => S.bag.indexOf(d);
    const snap = { phase: S.phase, boss: S.boss && S.boss.id };
    for (const k of RUN_KEYS) snap[k] = S[k];
    snap.anchored = S.anchored.map((a) => ({ i: a.i, die: bi(a.die), up: a.up }));
    snap.hand = S.phase === 'select' ? dice.map((d) => ({ die: bi(d.data.die), own: bi(d.data.die) < 0 ? d.data.die : undefined, up: d.data.up,
      held: !!d.data.held, anchored: !!d.data.anchored, rerolled: d.data.rerolled || 0, rnd: d.data.rnd })) : [];
    return snap;
  }
  function autosave(force) {
    if (slot < 0 || !profile) { Saves.saveMeta(); return; }
    if (['select', 'shop'].includes(S.phase) && !S.choice) {
      const js = JSON.stringify(snapshot());
      if (js === lastSaved && !force) return;
      lastSaved = js;
      profile.run = JSON.parse(js);
      profile.run.time = S.time;
      meta().stats.bestStage = Math.max(meta().stats.bestStage, S.ante);
    }
    if (profile.run) { Saves.save(slot, profile); slotData[slot] = profile; }
    Saves.saveMeta();
  }
  // Run zu Ende: Statistik fortschreiben, der Platz wird wieder frei
  function endRun(won) {
    if (!profile) return;
    const st = meta().stats;
    st.runs++;
    if (won) st.wins++;
    st.bestStage = Math.max(st.bestStage, Math.min(S.ante, ANTES));
    profile.run = null; lastSaved = '';
    achieve('run', { won });
    Saves.remove(slot); slotData[slot] = null;
    Saves.saveMeta();
  }
  function saveAndQuit() {
    if (!canQuit()) return;
    autosave(true);
    sfx('save');
    settingsOpen = false;
    backToMenu();
  }

  function openSlots() {
    clearMenuSprites();
    for (let k = 0; k < Saves.COUNT; k++) slotData[k] = Saves.load(k);
    if (ACH) ACH.ensure(meta());
    confirmBtn = null;
    S.phase = 'slots';
    setBg('menu', { spin: 1 });
    musicMood('menu');
    sfx('page');
  }
  function slotButtons() {
    const out = [];
    slotData.forEach((d, k) => {
      const run = d && d.run, main = SLOT_MAIN[k];
      main.label = run ? 'Continue' : 'New Run';
      main.colour = run ? P.GREEN : P.BLUE;
      out.push(main);
      if (run) out.push(SLOT_DEL[k]);
    });
    for (const b of out) if (b.slotDel !== undefined) {
      const sure = confirmBtn && confirmBtn.b === b;
      b.label = sure ? 'Sure?' : 'Abandon Run'; b.colour = sure ? P.RED : P.L_BLACK;
    }
    return out;
  }
  // Gefährliche Knöpfe brauchen einen zweiten Klick innerhalb von 3 Sekunden
  function confirmed(b) {
    if (confirmBtn && confirmBtn.b === b && eng.time < confirmBtn.until) { confirmBtn = null; return true; }
    confirmBtn = { b, until: eng.time + 3 };
    return false;
  }
  function pickSlot(k) {
    slot = k;
    profile = slotData[k] || Saves.blank(k);
    if (profile.run) { loadRun(profile.run); return; }
    openCups();
  }
  function onSlotButton(b) {
    if (b.slotMain !== undefined) return pickSlot(b.slotMain);
    if (b.slotDel !== undefined && confirmed(b)) {
      // Aufgegebener Run zählt als gespielt; Achievements, Becher und Statistik bleiben
      meta().stats.runs++; Saves.saveMeta();
      Saves.remove(b.slotDel); slotData[b.slotDel] = null;
      if (slot === b.slotDel) { slot = -1; profile = null; }
      sfx('bust');
    }
  }

  // Run aus einem Speicherstand wiederherstellen (im Shop oder mitten in einer Runde mit liegenden Würfeln)
  function loadRun(snap) {
    clearMenuSprites();
    S.chaos = null; S.cupDrawn = false; S.cupDraw = null; S.ach = freshAch(); S.job = null; S.jonny = freshJonny(); S.jonnyRule = null;
    for (const k of RUN_KEYS) if (snap[k] !== undefined) S[k] = snap[k];
    S.jonny = Object.assign(freshJonny(), S.jonny);
    S.boss = R.BOSSES.find((b) => b.id === snap.boss) || (snap.boss === 'jonny' ? JONNY_BOSS : null);
    if (!S.boss) pickBoss();
    S.anchored = (snap.anchored || []).map((a) => ({ i: a.i, die: S.bag[a.die], up: a.up })).filter((a) => a.die);
    S.time = snap.time || 0; S.choice = null; S.msg = null; S.chips = 0; S.mult = 0; S.handName = ''; S.dispScore = S.score;
    selected = null; fuse = null; lastSaved = '';
    refreshBag(); refreshUpgrades();
    const owned = (item, kind, pos, i, n) => {
      const p = pos(i, n), sp = eng.sprite({ tex: itemTex(item), x: p.x, y: p.y, s: CARD_S, z: 20 + i, tiltStrength: 0.8, ambient: 2.2, data: { kind, item } });
      sp.materialize(0.5 + i * 0.08, { colours: [P.WHITE, TYPE_COL[item.type]] });
      return sp;
    };
    relicSprites = S.relics.map((it, i) => owned(it, 'relic', L.relicPos, i, S.relics.length));
    consSprites = S.cons.map((it, i) => owned(it, 'cons', L.consPos, i, S.cons.length));
    if (snap.phase === 'shop') {
      S.phase = 'shop';
      setBg('shop', { spin: 1.5 });
      musicMood('shop');
      shopSprites = (S.shop || []).map((it, k) => (it ? shopSprite(it, k) : null));
      showMsg('Welcome back', P.GOLD, 'Stage ' + S.ante + '  ·  Shop', 1.6);
    } else {
      const lab = blindLabel(), n = snap.hand.length;
      if (isBossBlind() && S.boss) { bgName = 'table'; eng.setBackgroundColour(S.boss.colour, { contrast: 2 }); } else setBg('table');
      musicMood(roundMood());
      dice = snap.hand.map((h, i) => {
        const die = h.die >= 0 ? S.bag[h.die] : h.own;
        const sp = eng.sprite({ tex: faceTex(die.faces[h.up], die.type), x: dieX(i, n), y: dieY(), s: DIE_S, z: 10 + i, tiltStrength: 0.8,
          data: { kind: 'die', die, up: h.up, held: h.held, anchored: h.anchored, rerolled: h.rerolled, rnd: h.rnd } });
        sp.materialize(0.6 + i * 0.08, { colours: [P.WHITE, P.ORANGE] });
        return sp;
      });
      S.phase = 'select';
      layoutDice();
      showMsg(lab.name, lab.colour, 'Welcome back  ·  ' + S.hands + (S.hands === 1 ? ' hand' : ' hands') + ' left', 1.8);
    }
    sfx('chime');
  }

  // ── Achievements (achievements.js): Ereignisse verbuchen, Einblendung, Übersicht pro Speicherplatz ──
  let toasts = [], achClock = 0, achPage = 0;
  const ACH_PER_PAGE = MOBILE ? 8 : 15, ACH_COLS = MOBILE ? 2 : 3;
  function achieve(ev, e) {
    if (!ACH || !profile || TUT.active) return;
    const got = ACH.record(meta(), ev, e);
    if (!got.length) return;
    got.forEach((a) => toasts.push({ a, t0: null }));
    Saves.saveMeta();
  }
  // Secrets: kommen auch aus Menü und Tutorial (ohne laufenden Run)
  function secret(id) {
    if (!ACH || ACH.earned(meta(), id)) return;
    const got = ACH.record(meta(), 'secret', { id });
    if (!got.length) return;
    got.forEach((a) => toasts.push({ a, t0: null }));
    Saves.saveMeta();
  }
  // Was die Zustands-Achievements brauchen (Geld, Luck, Beutel, Zahlenstufen, Tags)
  function achState() {
    const counts = R.tagCounts(S.relics);
    return {
      ante: S.ante, money: S.money, luck: S.phase === 'select' ? luck() : 0, bag: S.bag.length,
      skullFaces: S.bag.reduce((a, d) => a + d.faces.filter(R.isSkull).length, 0),
      numLevel: Math.max(1, ...Object.values(S.numLevels)), tags: counts,
      maxSet: Math.max(0, ...R.TAG_ORDER.map((t) => R.setLevel(counts, t))), runBusts: S.ach.busts,
    };
  }
  // Pokal als Pixel-Symbol (9x8, X = Pixel)
  const TROPHY = ['XXXXXXXXX', 'X.XXXXX.X', 'X.XXXXX.X', '.XXXXXXX.', '..XXXXX..', '...XXX...', '....X....', '..XXXXX..'];
  function drawTrophy(ctx, x, y, scale, colour) {
    const each = (fn) => TROPHY.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') fn(x + i * scale, y + j * scale); }));
    ctx.fillStyle = darken(colour, 0.55);
    each((px, py) => ctx.fillRect(px + 2, py + 2, scale, scale));
    ctx.fillStyle = colour;
    each((px, py) => ctx.fillRect(px, py, scale, scale));
    ctx.fillStyle = lighten(colour, 0.45);
    ctx.fillRect(x + 3 * scale, y + scale, scale, 2 * scale);
  }
  // Belohnungen: Name, Bildchen, Tooltip
  const rewardDie = {};
  function rewardName(kind, id) {
    if (kind === 'relic') return R.RELIC_BY_ID[id].name;
    if (kind === 'oracle') return R.ORACLE_BY_ID[id].name;
    if (kind === 'upgrade') return R.UPGRADE_BY_ID[id].name;
    if (kind === 'die') return R.DIE_TYPES[id].name;
    if (kind === 'palette') return (PALETTES.find((x) => x.id === id) || { name: id }).name + ' colours';
    if (kind === 'cupmode') return (CUP_BY_ID[id] || { name: id }).name;
    return id + ' random ' + CUP_WORD + (id === 1 ? '' : 's');
  }
  let rewardCup = null;
  const rewardModeCups = {};
  function drawReward(ctx, kind, id, x, y, size, dim) {
    ctx.save();
    if (dim) ctx.globalAlpha = 0.5;
    ctx.imageSmoothingEnabled = false;
    if (kind === 'relic') {
      const d = R.RELIC_BY_ID[id];
      UI.box(ctx, x, y, size, size, { colour: darken(d.colour, 0.1), radius: 6, shadow: false, outline: R.RARITY[d.rarity].colour, outlineWidth: 2 });
      Icons.draw(ctx, id, x + size / 2, y + size / 2, size * 0.8);
    } else if (kind === 'oracle' || kind === 'upgrade') {
      UI.box(ctx, x, y, size, size, { colour: kind === 'oracle' ? TYPE_COL.oracle : TYPE_COL.upgrade, radius: 6, shadow: false, outline: '#FFFFFF', outlineWidth: 1 });
      Icons.draw(ctx, id, x + size / 2, y + size / 2, size * 0.8);
    } else if (kind === 'die') {
      const t = R.DIE_TYPES[id], f = t.faces.find((q) => q.kind !== 'normal') || t.faces[5];
      ctx.drawImage(faceEntry(f, id).canvas, x, y, size, size);
    } else if (kind === 'palette') {
      const c = (PALETTES.find((q) => q.id === id) || PALETTES[0]).colours, h = size / 2;
      UI.box(ctx, x, y, size, size, { colour: c.PANEL_DARK, radius: 6, shadow: false, outline: '#FFFFFF', outlineWidth: 1 });
      [[c.BLUE, 0, 0], [c.GOLD, 1, 0], [c.PURPLE, 0, 1], [c.RED, 1, 1]].forEach(([col, i, j]) => { ctx.fillStyle = col; ctx.fillRect(x + 4 + i * (h - 4), y + 4 + j * (h - 4), h - 6, h - 6); });
    } else if (kind === 'cupmode') {
      const c = CUP_BY_ID[id] || CUPS[0];
      if (!rewardModeCups[id]) rewardModeCups[id] = cupCanvas(c.colour, false, id);
      ctx.drawImage(rewardModeCups[id], x + size / 2 - size * 0.36, y, size * 0.72, size * 0.96);
    } else if (kind === '?') {
      UI.box(ctx, x, y, size, size, { colour: P.PANEL_DARK, radius: 6, shadow: false, outline: lighten(P.PURPLE, 0.2), outlineWidth: 1 });
      UI.text(ctx, '?', x + size / 2, y + size / 2, { size: size * 0.6, colour: lighten(P.PURPLE, 0.4) });
    } else {
      if (!rewardCup) rewardCup = cupCanvas(P.ORANGE, false, 'chaos');
      ctx.drawImage(rewardCup, x + size / 2 - size * 0.36, y, size * 0.72, size * 0.96);
      UI.text(ctx, 'x' + id, x + size + 2, y + size - 6, { size: 15, colour: P.GOLD, align: 'right' });
    }
    ctx.restore();
  }
  function rewardInfo(kind, id) {
    if (kind === 'cup') return { title: id + ' ' + CUP_WORD + (id === 1 ? '' : 's'), desc: 'Adds ' + (id === 1 ? 'a random cup' : id + ' random cups') + ' to your stock. Each one is good for one run.', badge: [CUP_WORD + 's', P.ORANGE] };
    if (kind === 'die') return itemInfo({ type: 'die', dieType: id, die: rewardDie[id] || (rewardDie[id] = R.makeDie(id)) });
    if (kind === 'palette') return { title: rewardName(kind, id), desc: 'A secret colour palette. Pick it under Settings > Video > Colours.', badge: ['Palette', P.PURPLE] };
    if (kind === 'cupmode') { const c = CUP_BY_ID[id]; return { title: c.name, desc: c.desc + ' Always available once unlocked.', badge: [CUP_WORD, c.colour] }; }
    return itemInfo({ type: kind, id });
  }

  // Einblendung oben in der Mitte, eine nach der anderen
  const TOAST = { in: 0.35, hold: 3.4, out: 0.35 };
  function drawToasts(ctx) {
    const q = toasts[0];
    if (!q) return;
    if (MOBILE && !ctx.wgToast) { ctx.save(); ctx.translate(640, 0); ctx.scale(1.35, 1.35); ctx.translate(-640, 0); ctx.wgToast = true; drawToasts(ctx); ctx.wgToast = false; ctx.restore(); return; }
    if (q.t0 === null) { q.t0 = eng.time; jingle('achieve', 1.4); }
    const hold = toasts.length > 1 ? 1.8 : TOAST.hold;   // warten weitere, kürzer zeigen
    const age = eng.time - q.t0, total = TOAST.in + hold + TOAST.out;
    if (age > total) { toasts.shift(); return; }
    const k = age < TOAST.in ? FX.Ease.outCubic(age / TOAST.in) : age > TOAST.in + hold ? 1 - (age - TOAST.in - hold) / TOAST.out : 1;
    const a = q.a, rw = a.rewards, w = 520, h = 82, x = 640 - w / 2, y = -h - 10 + k * (h + 24);
    const accent = a.secret ? lighten(P.PURPLE, 0.25) : P.GOLD;
    UI.box(ctx, x, y, w, h, { colour: P.OVERLAY_SOLID, radius: 14, emboss: 4, outline: accent, outlineWidth: 3 });
    drawTrophy(ctx, x + 16, y + 24, 4, accent);
    const textW = w - 70 - 16 - Math.min(3, rw.length) * 42;
    UI.text(ctx, a.secret ? 'Secret achievement unlocked' : 'Achievement unlocked', x + 70, y + 20, { size: 15, colour: accent, align: 'left' });
    UI.text(ctx, a.name, x + 70, y + 44, { size: fitText(ctx, a.name, textW, 26), align: 'left' });
    const line = !rw.length ? a.desc : (rw[0][0] === 'cup' ? 'Reward: ' : 'New: ') + rw.map(([kind, id]) => rewardName(kind, id)).join(', ');
    UI.text(ctx, line, x + 70, y + 67, { size: fitText(ctx, line, textW, 15), colour: P.TEXT_SOFT, align: 'left' });
    rw.slice(0, 3).forEach(([kind, id], i, arr) => drawReward(ctx, kind, id, x + w - 14 - (arr.length - i) * 42 + 4, y + 22, 38, false));
  }

  // Übersicht (aus dem Hauptmenü): 3 Spalten, 5 Zeilen pro Seite
  function openTrophies() {
    clearMenuSprites();
    achPage = 0;
    if (ACH) { ACH.ensure(meta()); Saves.saveMeta(); }
    S.phase = 'trophies';
    sfx('page');
  }
  const achPages = () => Math.max(1, Math.ceil((ACH ? ACH.LIST.length : 0) / ACH_PER_PAGE));
  function turnTrophyPage(dir) {
    const n = clamp(achPage + dir, 0, achPages() - 1);
    if (n !== achPage) { achPage = n; sfx('page'); }
  }
  // Schriftgröße so weit verkleinern, bis der Text in die Breite passt
  function fitText(ctx, text, maxW, size) {
    ctx.font = UI.font(size);
    while (size > 11 && ctx.measureText(text).width > maxW) ctx.font = UI.font(--size);
    return size;
  }
  function drawTrophies(back, front, t) {
    if (MOBILE) return drawTrophiesMobile(back, front, t);
    const p = meta();
    if (!ACH) return;
    const sum = ACH.summary(p);
    UI.dynaText(front, 'Achievements', 640, 56, { size: 52, time: t, wave: 2.5, colour: P.GOLD });
    UI.text(front, (sum.secrets ? 'Secrets found ' + sum.secrets + '  ·  ' : '') + sum.done + ' / ' + sum.total + ' achievements  ·  ' + sum.items + ' / ' + sum.locked + ' items unlocked  ·  Page ' + (achPage + 1) + ' / ' + achPages(), 640, 94, { size: 17, colour: P.TEXT_SOFT });
    UI.text(front, 'Rare and Legendary relics and a few special items start locked. Earn achievements to add them to the shop.', 640, 116, { size: 15, colour: P.TEXT_DIM });
    const list = ACH.LIST.slice(achPage * ACH_PER_PAGE, (achPage + 1) * ACH_PER_PAGE);
    const W = 392, H = 84, hits = [];
    list.forEach((a, n) => {
      const x = 40 + (n % ACH_COLS) * (W + 12), y = 136 + Math.floor(n / ACH_COLS) * 92, got = ACH.earned(p, a.id);
      const hover = UI.inside({ x, y, w: W, h: H }, eng.mouse), hidden = a.secret && !got;
      const accent = a.secret ? lighten(P.PURPLE, 0.25) : P.GOLD;
      UI.box(back, x, y, W, H, { colour: got ? darken(accent, 0.7) : P.OVERLAY_SOLID, radius: 12, emboss: 3,
        outline: got ? accent : hover ? lighten(P.PANEL, 0.35) : hidden ? darken(P.PURPLE, 0.2) : lighten(P.PANEL, 0.12), outlineWidth: got ? 2 : 1 });
      drawTrophy(front, x + 14, y + 26, 4, got ? accent : hidden ? darken(P.PURPLE, 0.25) : '#59666A');
      const rewards = hidden ? [['?', '?']] : a.rewards, name = hidden ? '???' : a.name, desc = hidden ? 'Secret achievement. Keep poking around.' : a.desc;
      const tilesX = x + W - 10 - rewards.length * 36;
      UI.text(front, name, x + 64, y + 22, { size: fitText(front, name, tilesX - x - 70, 21), colour: got ? P.WHITE : P.TEXT_SOFT, align: 'left' });
      UI.text(front, desc, x + 64, y + 49, { size: fitText(front, desc, W - 76, 16), colour: got ? lighten(accent, 0.35) : P.TEXT_LABEL, align: 'left' });
      if (got && a.secret) UI.text(front, 'SECRET', x + W - 12, y + 71, { size: 13, colour: accent, align: 'right' });
      const pr = ACH.progress(p, a);
      if (got) UI.text(front, 'Unlocked ' + fmtDate(p.ach[a.id]), x + 64, y + 71, { size: 13, colour: P.TEXT_DIM, align: 'left' });
      else if (pr) {
        const bw = 150, k = pr.n / pr.goal;
        UI.box(front, x + 64, y + 66, bw, 10, { colour: P.PANEL_DARK, radius: 5, shadow: false });
        if (k > 0) UI.box(front, x + 64, y + 66, Math.max(10, bw * k), 10, { colour: P.GOLD, radius: 5, shadow: false });
        UI.text(front, UI.num(pr.n) + ' / ' + UI.num(pr.goal), x + 64 + bw + 10, y + 71, { size: 14, colour: P.TEXT_SOFT, align: 'left' });
      }
      rewards.forEach(([kind, id], i) => {
        const r = { x: tilesX + i * 36, y: y + 6, w: 32, h: 32 };
        drawReward(front, kind, id, r.x, r.y, r.w, !got && !hidden);
        if (!hidden) hits.push({ r, kind, id, a, got });
      });
    });
    for (const b of [B.achPrev, B.achNext, B.back]) UI.button(front, b, t);
    // Tooltip für die Belohnung unter der Maus
    const h = hits.find((q) => UI.inside(q.r, eng.mouse));
    if (h) {
      const inf = Object.assign({}, rewardInfo(h.kind, h.id));
      inf.sub = h.got ? 'Unlocked' : 'Locked: ' + h.a.name;
      const sz = panelSize(front, inf), pos = placeBelow(h.r, sz);
      drawPanel(front, inf, sz, pos.x, pos.y, false, -1);
    }
  }

  // ── Becher-Auswahl: Classic Cup plus alle Becher, die der Speicherstand besitzt ──
  let cupSprites = [], cupSel = 0, cupList = ['classic'];
  function cupCanvas(colour, locked, tag) {
    const [c, x] = Art.canvas(36, 48), T = 14;   // T: Oberkante des Bechers
    const body = locked ? '#3B4649' : colour, line = darken(body, 0.55), light = lighten(body, 0.22), shade = darken(body, 0.22), base = darken(body, 0.32);
    if (!locked) {
      // Würfel (Fünf), der oben aus dem Becher schaut
      x.fillStyle = '#2A2A2A'; x.fillRect(10, 0, 16, 16);
      x.fillStyle = '#FFFFFF'; x.fillRect(11, 1, 14, 14);
      x.fillStyle = '#E8E2D6'; x.fillRect(11, 13, 14, 2);
      x.fillStyle = '#2A2A2A';
      [[13, 3], [21, 3], [17, 7], [13, 11], [21, 11]].forEach(([px, py]) => x.fillRect(px, py, 2, 2));
    }
    for (let y = T; y <= T + 31; y++) {
      const k = (y - T) / 31, hw = Math.round(16 - 3.5 * k), x0 = 18 - hw, x1 = 18 + hw - 1;
      x.fillStyle = y <= T + 3 ? light : y >= T + 27 ? base : body;
      x.fillRect(x0, y, x1 - x0 + 1, 1);
      if (y > T + 3 && y < T + 27) { x.fillStyle = light; x.fillRect(x0 + 2, y, 1, 1); x.fillStyle = shade; x.fillRect(x1 - 3, y, 3, 1); }
      x.fillStyle = line; x.fillRect(x0, y, 1, 1); x.fillRect(x1, y, 1, 1);
      if (y === T || y === T + 31 || y === T + 4 || y === T + 26) x.fillRect(x0, y, x1 - x0 + 1, 1);
      // Naht
      if (y > T + 5 && y < T + 25 && y % 3 === 0) { x.fillStyle = lighten(body, 0.4); x.fillRect(x0 + 4, y, 1, 2); x.fillRect(x1 - 4, y, 1, 2); }
    }
    // Emblem: kleines Pixel-Symbol pro Becher auf einer dunklen Plakette
    const em = CUP_EMBLEMS[tag] || CUP_EMBLEMS.classic;
    x.fillStyle = line; x.fillRect(12, T + 10, 12, 11);
    x.fillStyle = darken(body, 0.4); x.fillRect(13, T + 11, 10, 9);
    x.fillStyle = locked ? '#8FA1A5' : P.GOLD;
    em.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') x.fillRect(14 + i, T + 12 + j, 1, 1); }));
    return c;
  }
  // 8x7-Symbole für die Becher (X = Pixel)
  const CUP_EMBLEMS = {
    classic: ['...XX...', '..XXXX..', '.XXXXXX.', 'XXXXXXXX', '.XXXXXX.', '..XXXX..', '...XX...'],
    sprint: ['....XX..', '...XX...', '..XX....', '.XXXXXX.', '....XX..', '...XX...', '..XX....'],
    marathon: ['XXXXXXXX', '.X....X.', '..X..X..', '...XX...', '..X..X..', '.XXXXXX.', 'XXXXXXXX'],
    gambler: ['.XXXXXX.', 'XXXXXXXX', 'X..XX..X', 'XXXXXXXX', '.XXX.XX.', '..XXXX..', '..X.X.X.'],
    velvet: ['...XX...', '.XXXXXX.', 'XX.XX...', '.XXXXXX.', '...XX.XX', '.XXXXXX.', '...XX...'],
    clover: ['.XX..XX.', 'XXXXXXXX', '.XXXXXX.', '...XX...', '.XXXXXX.', 'XXXXXXXX', '.XX.X.X.'],
    highroller: ['XX....XX', 'XX....XX', '........', 'XX....XX', 'XX....XX', '........', 'XX....XX'],
    twin: ['XXXX....', 'X..X....', 'XXXXXXX.', '...X..X.', '...X..X.', '...XXXX.', '........'],
    iron: ['...XX...', '..X..X..', '...XX...', 'X..XX..X', 'X..XX..X', '.X.XX.X.', '..XXXX..'],
    sack: ['..XXXX..', '...XX...', '.XXXXXX.', 'XXXXXXXX', 'XXXXXXXX', 'XXXXXXXX', '.XXXXXX.'],
    glass: ['.XXXXXX.', 'X.X..X.X', 'XXXXXXXX', '.X....X.', '..X..X..', '...XX...', '........'],
    chaos: ['.XXXXX..', 'X.....X.', 'X..XX..X', 'X.X..X.X', 'X..X..X.', '.X....X.', '..XXXX..'],
    jonny: ['........', 'XXX..XXX', 'X.XXXX.X', 'XXX..XXX', '........', '.X....X.', '..XXXX..'],
  };
  const cupTex = (c) => cached('cup:' + c.id, () => cupCanvas(c.colour, false, c.id));
  const cupAt = (i) => CUP_BY_ID[cupList[i]] || null;
  const ownedCups = () => meta().cups;
  function openCups() {
    clearMenuSprites();
    S.phase = 'cups';
    const owned = ownedCups();
    cupList = CUPS.filter((c) => c.id === 'classic' || (c.jonny ? open('cupmode', c.id) : owned[c.id] > 0)).map((c) => c.id);
    const last = cupList.indexOf(meta().lastCup);
    cupSel = last > 0 ? last : 0;
    cupSprites = cupList.map((id, i) => {
      const c = CUP_BY_ID[id];
      const sp = eng.sprite({ tex: cupTex(c), x: cupX(i), y: 300, s: 3, z: 5 + i, tiltStrength: 0.8, ambient: 1.6, data: { kind: 'cup', i } });
      sp.materialize(0.5 + Math.min(i, 4) * 0.1, { colours: [P.WHITE, c.colour] });
      return sp;
    });
    setBg('shop', { spin: 1.2 });
    musicMood('menu');
    sfx('page');
  }
  const cupX = (i) => 640 + (i - cupSel) * 200;
  function layoutCups() {
    if (MOBILE) { cupSprites.forEach((sp, i) => { sp.moveTo(cupX(i), i === cupSel ? 222 : 242, 0, i === cupSel ? 3.3 : 2.6); sp.visible = Math.abs(i - cupSel) <= 3; }); return; }
    cupSprites.forEach((sp, i) => { sp.moveTo(cupX(i), i === cupSel ? 282 : 306, 0, i === cupSel ? 3.5 : 2.8); sp.visible = Math.abs(i - cupSel) <= 3; });
  }
  function selectCup(i) {
    if (i < 0 || i >= cupList.length || i === cupSel) return;
    cupSel = i; sfx('card');
    cupSprites[i].juiceUp(0.4);
  }
  function beginRun() {
    const c = cupAt(cupSel);
    if (!c) return;
    if (profile && c.id !== 'classic' && !c.jonny) {
      // Gezogene Becher sind nach einem Run verbraucht
      const owned = ownedCups();
      if (!(owned[c.id] > 0)) return denied(640, 560, 'You do not own this cup');
      if (--owned[c.id] <= 0) delete owned[c.id];
    }
    Saves.saveMeta();
    startRun(c.id);
  }

  // ── Cup Draw: 3 zufällige Becher als Belohnung (Showdown von Stage CUP_DRAW_STAGE, einmal pro Run) ──
  let cupDrawSprites = [], hiddenForDraw = [];
  function startCupDraw(then) {
    const pool = drawableCups();
    const ids = [0, 1, 2].map(() => R.pick(pool).id);
    S.cupDrawn = true;
    S.cupDraw = { ids, then, t0: eng.time };
    // Karten und Würfel kurz ausblenden, damit die Becher frei stehen
    hiddenForDraw = relicSprites.concat(consSprites, bagSprites, upgSprites).filter((sp) => sp && sp.visible);
    hiddenForDraw.forEach((sp) => { sp.visible = false; });
    cupDrawSprites = ids.map((id, k) => {
      const c = CUP_BY_ID[id];
      const sp = eng.sprite({ tex: cupTex(c), x: L.msg.x + (k - 1) * (MOBILE ? 250 : 200), y: MOBILE ? 290 : 300, s: 3.2, z: 60, tiltStrength: 0.8, ambient: 1.6, data: { kind: 'cupdraw', id } });
      sp.materialize(0.6 + k * 0.3, { colours: [P.WHITE, c.colour, P.GOLD] });
      eng.after(1.25 + k * 0.09, () => { eng.emit(sp.x, sp.y, { count: 26, colours: [c.colour, P.GOLD, '#FFFFFF'], speed: 380, size: 10, life: 0.8, shape: 'star' }); });
      return sp;
    });
    setBg('gold', { spin: 1.5 });
    jingle('cupdraw', 3.5);
  }
  function collectCups() {
    const d = S.cupDraw;
    if (!d) return;
    if (profile) {
      const cups = meta().cups;
      d.ids.forEach((id) => { cups[id] = (cups[id] || 0) + 1; });
      Saves.saveMeta();
    }
    cupDrawSprites.forEach((sp) => sp.dissolveOut(0.5, { colours: [P.GOLD, P.WHITE] }));
    cupDrawSprites = [];
    hiddenForDraw.forEach((sp) => { sp.visible = true; });
    hiddenForDraw = [];
    S.cupDraw = null;
    sfx('buy');
    d.then();
  }
  function drawCupDraw(back, front, t) {
    const d = S.cupDraw;
    if (!d) return;
    if (MOBILE) return drawCupDrawMobile(back, front, t);
    const X = L.msg.x;
    dim(back, 0.45);
    UI.box(back, X - 330, 116, 660, 444, { colour: P.OVERLAY_SOLID, radius: 16, outline: P.GOLD, outlineWidth: 3 });
    UI.dynaText(front, 'Cup Draw!', X, 160, { size: 48, colour: P.GOLD, time: t, wave: 3, pop: Math.min(1, (eng.time - d.t0) * 2) });
    UI.text(front, 'You beat the Stage ' + CUP_DRAW_STAGE + ' Showdown. Each cup can start one run.', X, 200, { size: 17, colour: P.TEXT_LABEL });
    d.ids.forEach((id, k) => {
      const c = CUP_BY_ID[id], cx = X + (k - 1) * 200;
      UI.text(front, c.name, cx, 392, { size: 20, colour: lighten(c.colour, 0.4) });
      UI.text(front, c.short, cx, 418, { size: 15, colour: P.TEXT_SOFT });
    });
    UI.button(front, B.collect, t);
  }

  // Laufende Chaos-Regel als Banner über dem Spielfeld
  function drawChaos(ctx) {
    const c = chaosRule();
    if (!c || ['lost', 'runWon'].includes(S.phase) || S.cupDraw) return;
    const text = 'Chaos: ' + c.name + '  ·  ' + c.desc, CH = L.chaos || { y: 158, size: 15, h: 26 };
    ctx.font = UI.font(CH.size);
    const w = ctx.measureText(text).width + 30;
    UI.box(ctx, L.msg.x - w / 2, CH.y, w, CH.h, { colour: darken(P.PURPLE, 0.4), radius: CH.h / 2, shadow: false, outline: P.PURPLE, outlineWidth: 2 });
    UI.text(ctx, text, L.msg.x, CH.y + CH.h / 2, { size: CH.size });
  }
  // Chaos Cup: neue Zusatzregel für die Stage
  // Zufälliges Relikt einer Seltenheit; ist dort noch nichts freigeschaltet, eine Stufe darunter.
  // Startrelikte aus Bechern (anyLocked) dürfen auch gesperrt sein – der Becher selbst ist die Belohnung.
  function randomRelic(rarity, anyLocked) {
    const owned = new Set(S.relics.map((r) => r.id)), ladder = ['L', 'R', 'U', 'C'];
    for (const rar of ladder.slice(ladder.indexOf(rarity))) {
      const pool = R.RELICS.filter((d) => !d.hidden && d.rarity === rar && !owned.has(d.id) && d.id !== 'crossroads' && (anyLocked || open('relic', d.id)));
      if (pool.length) return R.pick(pool).id;
    }
    return null;
  }
  function rollChaos() {
    const c = R.pick(CHAOS.filter((x) => x.id !== S.chaos));
    S.chaos = c.id;
    if (c.money) addMoney(c.money, ...spot('money'));
    if (c.level) { const h = R.pick(R.HAND_ORDER); S.levels[h] = (S.levels[h] || 1) + 1; }
    if (c.gift && S.relics.length < relicMax()) { const id = randomRelic(c.gift); if (id) addRelic(id); }
    if (S.ante > 1) eng.after(0.3, () => { showMsg('Chaos: ' + c.name, P.PURPLE, c.desc, 2.4); sfx('magic'); });
  }

  function placeMenuDice() {
    menuDice = [0, 1, 2, 3, 4].map((i) => {
      const d = eng.sprite(Object.assign({ tex: faceTex({ v: 1 + i, kind: i === 4 ? 'wild' : 'normal' }, 'standard'), z: 5 + i, tiltStrength: 0.8, data: { kind: 'menu', v: i === 4 ? null : 1 + i } }, L.menuDie(i)));
      d.materialize(0.6 + i * 0.15, { colours: [P.WHITE, P.BLUE] });
      return d;
    });
  }

  // ── Beutel und Upgrades ─────────────────────────────────────────────────
  const bagFace = (die) => die.faces.find((f) => f.kind !== 'normal') || die.faces[5];
  function refreshBag() {
    for (const s of bagSprites) s.remove();
    if (selected && selected.data.kind === 'bagdie') selected = null;
    bagSprites = S.bag.map((die, k) => eng.sprite({ tex: faceTex(bagFace(die), die.type), ...L.bagPos(k, S.bag.length), s: L.bagScale, z: 4, tiltStrength: 0.5, ambient: 0.5, data: { kind: 'bagdie', die } }));
  }
  function layoutBag() {
    const inPlay = ['rolling', 'select', 'scoring'].includes(S.phase);
    const inHand = new Set(dice.map((d) => d.data.die));
    bagSprites.forEach((s, k) => {
      const p = L.bagPos(k, bagSprites.length);
      s.moveTo(p.x, p.y - (s === selected ? 12 : 0), 0, L.bagScale);
      s.tint = inPlay && inHand.has(s.data.die) ? ['#26353A', 0.55] : null;
    });
  }
  function refreshUpgrades() {
    for (const s of upgSprites) s.remove();
    upgSprites = S.upgrades.map((id, k) => eng.sprite({ tex: upgradeIcon(id), ...L.upgPos(k), s: L.upgScale || 1.1, z: 4, tiltStrength: 0.6, data: { kind: 'upgrade', item: { type: 'upgrade', id } } }));
  }

  // ── Relikte und Verbrauchsgüter ─────────────────────────────────────────
  function layoutOwned() {
    const row = (list, pos) => list.forEach((s, i) => {
      s.z = 20 + i;
      if (s.dragging) return;
      const p = pos(i, list.length);
      s.moveTo(p.x, p.y - (s === selected ? 14 : 0), 0, CARD_S);
    });
    row(relicSprites, L.relicPos);
    row(consSprites, L.consPos);
  }

  function reorderRelics() {
    relicSprites.sort((a, b) => a.x - b.x);
    S.relics = relicSprites.map((s) => s.data.item);
  }

  function newRelicItem(id) {
    const def = R.RELIC_BY_ID[id], item = { type: 'relic', id, state: def.state ? def.state() : {} };
    if (def.startBlind) def.startBlind(item.state, ctx());
    return item;
  }
  function addRelic(id, x = L.msg.x, y = L.msg.y + 30) {
    const item = newRelicItem(id);
    S.relics.push(item);
    const sp = eng.sprite({ tex: itemTex(item), x, y, s: 1.25, z: 15, tiltStrength: 0.8, ambient: 2.2, data: { kind: 'relic', item } });
    sp.materialize(0.5, { colours: [P.WHITE, R.RELIC_BY_ID[id].colour] });
    relicSprites.push(sp);
    return sp;
  }

  // Metamorphosis und Hybrid Seed verwandeln sich
  function transformRelic(ri, kind) {
    let id;
    if (kind === 'rare') {
      const pool = R.RELICS.filter((d) => !d.hidden && d.rarity === 'R' && d.id !== 'metamorphosis' && !S.relics.some((r) => r.id === d.id) && open('relic', d.id));
      id = (pool.length ? R.pick(pool) : R.RELIC_BY_ID.golden_vine).id;
    } else {
      const counts = R.tagCounts(S.relics.filter((_, k) => k !== ri));
      let best = null;
      for (const t of Object.keys(R.VINES)) if ((counts[t] || 0) > 0 && (!best || counts[t] > counts[best])) best = t;
      id = R.VINES[best || R.pick(Object.keys(R.VINES))].id;
    }
    const def = R.RELIC_BY_ID[id], item = newRelicItem(id);
    S.relics[ri] = item;
    const sp = relicSprites[ri];
    sp.data.item = item; sp.tex = itemTex(item);
    sp.juiceUp(0.8); sp.flashWhite(1);
    sfx('magic');
    eng.emit(sp.x, sp.y, { count: 40, colours: [def.colour, P.GOLD, '#FFFFFF'], speed: 420, size: 10, life: 0.9, shape: 'star' });
    eng.popup(sp.x, fxY(sp, 1), def.name, { colour: P.GOLD, size: 20, life: 1.6 });
  }

  function canUse(item) {
    if (!['select', 'shop'].includes(S.phase)) return { ok: false, why: 'Not right now' };
    if (item.type === 'constellation' || item.type === 'tally') return { ok: true };
    const def = R.ORACLE_BY_ID[item.id];
    if (def.max === 0) return { ok: true };
    if (S.phase !== 'select') return { ok: false, why: 'Use it during a hand on held dice' };
    const held = heldCount();
    const need = def.min === def.max ? String(def.min) : def.min + '-' + def.max;
    if (held < def.min || held > def.max) return { ok: false, why: 'Hold ' + need + (def.max === 1 ? ' die' : ' dice') + ' first' };
    if (def.id === 'twin' && S.bag.length >= bagMax()) return { ok: false, why: 'Your bag is full' };
    if (def.id === 'shatter' && S.bag.length <= R.MIN_BAG) return { ok: false, why: 'Your bag needs more than 5 dice' };
    return { ok: true };
  }

  function useSelected() {
    const sp = selected; if (!sp || sp.data.kind !== 'cons') return;
    const item = sp.data.item;
    if (!canUse(item).ok) return;
    if (item.type === 'constellation') {
      const lv = (S.levels[item.hand] || 1) + 1;
      S.levels[item.hand] = lv;
      showMsg(item.hand, P.PLANET, 'Level ' + lv + '  ·  ' + R.handValues(item.hand, S.levels).join(' x '), 1.8);
      eng.emit(...spot('cons'), { count: 40, colours: [P.PLANET, '#FFFFFF', P.GOLD], speed: 420, size: 10, life: 0.9, shape: 'star' });
    } else if (item.type === 'tally') {
      const lv = (S.numLevels[item.n] || 1) + 1;
      S.numLevels[item.n] = lv;
      showMsg(R.NUMBER_NAMES[item.n], TYPE_COL.tally, 'Level ' + lv + '  ·  +' + 4 * (lv - 1) + ' Pips and +' + (lv - 1) + ' Power per scored ' + item.n, 2);
      eng.emit(...spot('cons'), { count: 40, colours: [TYPE_COL.tally, '#FFFFFF', P.GOLD], speed: 420, size: 10, life: 0.9, shape: 'star' });
      fire('onLevelUp');
    } else { applyOracle(R.ORACLE_BY_ID[item.id]); achieve('oracle'); }
    sfx('magic');
    TUT.event('use', { item });
    S.cons = S.cons.filter((c) => c !== item);
    consSprites = consSprites.filter((s) => s !== sp);
    sp.dissolveOut(0.6, { colours: [P.WHITE, TYPE_COL[item.type]] });
    selected = null;
  }

  function applyOracle(def) {
    const held = dice.filter((d) => d.data.held);
    const burst = (sp) => { sp.juiceUp(0.5); sp.flashWhite(0.8); eng.emit(sp.x, sp.y, { count: 22, colours: [P.TAROT, '#FFFFFF', P.GOLD], speed: 320, size: 9, life: 0.7, shape: 'star' }); };
    if (def.setKind) {
      held.forEach((sp) => { const f = upFace(sp); f.kind = def.setKind; delete f.uses; refreshDieTex(sp); burst(sp); });
      if (def.id === 'devils_deal') addMoney(3 * held.length, ...spot('money'));
      refreshBag();
    } else if (def.id === 'ascend') held.forEach((sp) => { const f = upFace(sp); f.v = Math.min(6, f.v + 1); refreshDieTex(sp); burst(sp); });
    else if (def.id === 'twin') {
      S.bag.push(R.copyDie(held[0].data.die)); burst(held[0]); refreshBag();
    } else if (def.id === 'shatter') {
      const sp = held[0], die = sp.data.die;
      S.bag = S.bag.filter((x) => x !== die);
      const inHand = new Set(dice.map((x) => x.data.die));
      sp.data.die = R.pick(S.bag.filter((x) => !inHand.has(x))) || R.pick(S.bag);
      sp.data.held = false; sp.data.anchored = false; sp.data.rnd = fresh();
      eng.emit(sp.x, sp.y, { count: 40, colours: [P.RED, P.ORANGE, '#FFFFFF'], speed: 480, size: 10, life: 0.8 });
      eng.shake(6);
      refreshBag();
      fire('onDestroy');
      achieve('destroy');
      animate(outcomes([dice.indexOf(sp)], true));
    } else if (def.id === 'windfall') {
      addMoney(Math.min(20, Math.max(0, S.money)), ...spot('money'));
    }
    layoutDice();
  }

  function sellSelected() {
    const sp = selected; if (!sp || !['select', 'shop'].includes(S.phase) || !['relic', 'cons'].includes(sp.data.kind)) return;
    const item = sp.data.item;
    sfx('sell');
    TUT.event('sell', { item, name: item.type === 'relic' ? R.RELIC_BY_ID[item.id].name : TYPE_NAME[item.type] });
    if (sellPrice(item) > 0) addMoney(sellPrice(item), sp.x, fxY(sp)); else { sfx('deny'); eng.popup(sp.x, fxY(sp), 'No refunds!', { colour: P.GREY, size: 20 }); }
    if (S.phase === 'shop') shopSold(item);
    if (item.type === 'relic') { S.relics = S.relics.filter((r) => r !== item); relicSprites = relicSprites.filter((s) => s !== sp); }
    else { S.cons = S.cons.filter((c) => c !== item); consSprites = consSprites.filter((s) => s !== sp); }
    sp.dissolveOut(0.6, { colours: [P.MONEY, P.GOLD] });
    selected = null;
  }

  // Zusatz-Knopf für ausgewählte Dinge: Dial (Modus), Mirror Shard (Seite), Münze (Seite), Beutel-Würfel (Pruning Shears)
  function actFor(sp) {
    const k = sp.data.kind;
    if (k === 'bagdie') {
      if (S.phase !== 'shop' || !upg('pruning') || S.pruneUsed) return null;
      return { label: 'Prune +$3', ok: S.bag.length > R.MIN_BAG, run: () => pruneDie(sp) };
    }
    if (k !== 'relic') return null;
    const item = sp.data.item, s = item.state;
    if (item.id === 'dial' && S.phase === 'shop') return { label: 'Mode $1', ok: canPay(1), run: () => { S.money--; s.mode = (s.mode + 1) % 3; eng.popup(sp.x, fxY(sp, 1), R.DIAL_MODES[s.mode], { colour: P.GOLD, size: 20 }); } };
    if (item.id === 'mirror' && S.phase === 'shop') return { label: 'Flip $1', ok: canPay(1), run: () => { S.money--; s.side = -(s.side || -1); eng.popup(sp.x, fxY(sp, 1), s.side < 0 ? '< Left' : 'Right >', { colour: P.GOLD, size: 20 }); } };
    if (item.id === 'coin' && S.phase === 'select') return { label: 'Flip', ok: heldCount() >= 3, run: () => { s.side = s.side === 'heads' ? 'tails' : 'heads'; eng.popup(sp.x, fxY(sp, 1), s.side === 'heads' ? 'Heads' : 'Tails', { colour: P.GOLD, size: 20 }); } };
    return null;
  }
  function runAct() {
    const sp = selected, a = sp && actFor(sp);
    if (!a || !a.ok) return;
    a.run(); J.money.up(0.2); sp.juiceUp(0.4);
  }
  function pruneDie(sp) {
    S.bag = S.bag.filter((d) => d !== sp.data.die);
    S.pruneUsed = true;
    eng.emit(sp.x, sp.y, { count: 30, colours: [P.RED, P.ORANGE, '#FFFFFF'], speed: 420, size: 9, life: 0.7 });
    addMoney(3, sp.x, sp.y - 40);
    fire('onDestroy');
    achieve('destroy');
    selected = null;
    refreshBag();
  }

  // ── Shop ────────────────────────────────────────────────────────────────
  const constPrice = () => (upg('telescope') ? 2 : 3);
  function genItem(existing) {
    const r = Math.random();
    if (r < 0.52) {
      const taken = new Set(S.relics.map((x) => x.id).concat(existing.filter((x) => x.type === 'relic').map((x) => x.id)));
      const pool = R.RELICS.filter((d) => !d.hidden && !taken.has(d.id) && open('relic', d.id));
      if (pool.length) { const id = R.pickWeighted(pool.map((d) => [d.id, R.RARITY[d.rarity].weight])); return { type: 'relic', id, price: R.RELIC_BY_ID[id].cost }; }
    }
    if (r < 0.74) return { type: 'constellation', hand: R.pick(R.HAND_ORDER), price: constPrice() };
    if (r < 0.88) return { type: 'oracle', id: R.pick(R.ORACLES.filter((q) => open('oracle', q.id))).id, price: 3 };
    return { type: 'tally', n: 1 + ((Math.random() * 6) | 0), price: 3 };
  }
  function genDie() {
    const type = R.pickWeighted(Object.entries(R.DIE_TYPES).filter(([k, d]) => d.weight > 0 && open('die', k)).map(([k, d]) => [k, d.weight]));
    return { type: 'die', dieType: type, die: R.makeDie(type), price: Math.max(1, R.DIE_TYPES[type].cost - (cup().dieDiscount || 0)) };
  }
  function shopSprite(item, k) {
    const tex = item.type === 'die' ? faceTex(bagFace(item.die), item.dieType) : itemTex(item);
    const sp = eng.sprite({ tex, ...L.shopPos(k), s: item.type === 'die' ? DIE_S : 1.25, z: 15, tiltStrength: 0.8, ambient: item.type === 'die' ? 1.4 : 2.2, data: { kind: 'shop', item, die: item.die } });
    sp.materialize(0.5, { colours: [P.WHITE, TYPE_COL[item.type]] });
    return sp;
  }
  function stockShop(slots) {
    for (const k of slots) {
      if (shopSprites[k]) shopSprites[k].dissolveOut(0.3);
      const others = S.shop.filter((x, j) => x && j !== k);
      const mp = mostPlayed();
      if (k === 3 && !TUT.active) S.shop[k] = genDie();
      else if (k === 4) S.shop[k] = S.upgradeOffer ? { type: 'upgrade', id: S.upgradeOffer, price: R.UPGRADE_BY_ID[S.upgradeOffer].cost } : null;
      else if (k === 2 && upg('telescope') && mp) S.shop[k] = { type: 'constellation', hand: mp, price: constPrice() };
      else if (TUT.active) S.shop[k] = TUT.shopItem(k);
      else S.shop[k] = genItem(others);
      shopSprites[k] = S.shop[k] ? shopSprite(S.shop[k], k) : null;
    }
    sfx('card');
  }

  function enterShop() {
    S.phase = 'shop';
    S.target = blindTarget(S.blindIdx);
    S.score = 0; S.dispScore = 0;
    setBg('shop', { spin: 1.5 });
    musicMood('shop');
    S.shopRerollCost = 1; S.bought = false; S.pruneUsed = false;
    S.shop = [null, null, null, null, null]; shopSprites = [null, null, null, null, null];
    TUT.event('shop');
    stockShop([0, 1, 2, 3, 4]);
    if (!TUT.active) { S.jonny.visit++; S.jonny.rerolls = 0; maybeSpecial(); S.job = newJob(); shopHello(); }
    autosave();
  }

  function rerollShop() {
    if (S.phase !== 'shop' || !canPay(S.shopRerollCost)) return;
    S.money -= S.shopRerollCost; J.money.up(0.3);
    S.shopRerollCost++;
    TUT.event('shopReroll');
    shopRerolled();
    sfx('shuffle');
    stockShop([0, 1, 2]);
  }

  function buy(k) {
    const it = S.shop && S.shop[k], sp = shopSprites[k];
    if (!it || S.choice) return;
    const { x } = L.shopPos(k), y = L.shopPos(k).y - 70;
    if (!canPay(it.price)) { shopBroke(); return denied(x, y, 'Not enough $'); }
    if (it.type === 'relic' && S.relics.length >= relicMax()) return denied(x, y, 'Relic slots full');
    if (['constellation', 'oracle', 'tally'].includes(it.type) && S.cons.length >= R.MAX_CONS) return denied(x, y, 'Slots full');
    if (it.type === 'die' && S.bag.length >= bagMax()) return denied(x, y, 'Bag is full');
    if (it.id === 'crossroads' && !crossroadsOptions().length) return denied(x, y, 'Nothing left to become');
    S.money -= it.price; J.money.up(0.4);
    sfx('buy');
    TUT.event('buy', { item: it, name: it.type === 'relic' ? R.RELIC_BY_ID[it.id].name : TYPE_NAME[it.type] });
    S.bought = true;
    achieve('buy');
    if (!it.special) shopBought(it);
    S.shop[k] = null; shopSprites[k] = null;
    eng.emit(sp.x, sp.y, { count: 20, colours: [P.MONEY, '#FFFFFF', TYPE_COL[it.type]], speed: 340, size: 9, life: 0.6 });
    if (it.type === 'die') {
      S.bag.push(it.die);
      sp.dissolveOut(0.4);
      refreshBag();
      bagSprites[bagSprites.length - 1].juiceUp(0.6);
      return;
    }
    if (it.type === 'upgrade') {
      S.upgrades.push(it.id); S.upgradeOffer = null;
      sp.dissolveOut(0.5, { colours: [P.WHITE, TYPE_COL.upgrade] });
      refreshUpgrades();
      upgSprites[upgSprites.length - 1].juiceUp(0.8);
      showMsg(R.UPGRADE_BY_ID[it.id].name, lighten(TYPE_COL.upgrade, 0.3), R.UPGRADE_BY_ID[it.id].desc, 2.6);
      return;
    }
    if (it.id === 'crossroads') {
      sp.dissolveOut(0.5, { colours: [P.WHITE, P.GOLD] });
      selected = null;
      S.choice = { opts: crossroadsOptions() };
      return;
    }
    if (it.type === 'relic') {
      const owned = newRelicItem(it.id);
      S.relics.push(owned);
      sp.data = { kind: 'relic', item: owned };
      relicSprites.push(sp);
      if (it.special) specialBought(it, owned);
    } else {
      const owned = it.type === 'constellation' ? { type: 'constellation', hand: it.hand } : it.type === 'tally' ? { type: 'tally', n: it.n } : { type: 'oracle', id: it.id };
      S.cons.push(owned);
      sp.data = { kind: 'cons', item: owned };
      consSprites.push(sp);
    }
    sp.juiceUp(0.5);
  }

  // Crossroads: drei zufällige Tags, jeweils mit dem stärksten Relikt, das man noch nicht hat
  function crossroadsOptions() {
    const owned = S.relics.map((r) => r.id), seen = new Set();
    return shuffle(R.TAG_ORDER.slice())
      .map((tag) => ({ tag, def: R.strongestOfTag(tag, owned, Math.random, (d) => open('relic', d.id)) }))
      .filter((o) => o.def && !seen.has(o.def.id) && seen.add(o.def.id))
      .slice(0, 3);
  }
  function choose(k) {
    const o = S.choice && S.choice.opts[k];
    if (!o) return;
    S.choice = null;
    sfx('magic');
    addRelic(o.def.id).juiceUp(0.8);
    showMsg(o.def.name, R.TAGS[o.tag].colour, 'Crossroads became a ' + R.RARITY[o.def.rarity].name + ' ' + R.TAGS[o.tag].name + ' relic', 2.2);
  }

  function vaultDeposit() {
    const a = Math.min(5, S.money, VAULT_MAX - S.vault);
    if (a <= 0) return denied(B.deposit.x + 64, B.deposit.y - 20, S.vault >= VAULT_MAX ? 'Vault is full' : 'No money');
    S.money -= a; S.vault += a; J.money.up(0.3); sfx('coin'); TUT.event('vault');
    eng.emit(...spot('vaultBox'), { count: 14, colours: [P.MONEY, P.GOLD], speed: 260, size: 8, life: 0.6, shape: 'circle' });
  }
  function vaultWithdraw() {
    if (S.vault <= 0) return denied(B.withdraw.x + 66, B.withdraw.y - 20, 'Vault is empty');
    addMoney(Math.max(0, S.vault - 2), ...spot('vaultBox'));
    S.vault = 0;
  }

  function leaveShop() {
    if (S.phase !== 'shop' || S.choice) return;
    TUT.event('leaveShop');
    fire('leaveShop', [], { bought: S.bought });
    S.ach.noBuy = S.bought ? 0 : S.ach.noBuy + 1;
    achieve('shop', { noBuy: S.ach.noBuy, money: S.money, bought: S.bought });
    for (const s of shopSprites) if (s) s.dissolveOut(0.4);
    shopSprites = []; S.shop = null; selected = null;
    startBlind();
  }

  // ── Eingabe ─────────────────────────────────────────────────────────────
  let press = null;
  eng.on('down', (m) => {
    if (settingsOpen) { const k = sliderAt(m); if (k >= 0) { sliderDrag = k; setSlider(k, m); return; } }
    if (!settingsOpen && songRect() && UI.inside(songRect(), m)) { skipSong(); return; }
    if (MOBILE) { if (touchTipDown(m)) return; }   // Handy: Tippen in einen Tooltip öffnet Begriffe, daneben schließt ihn
    else if (overPinnedTip(m)) return;   // Klicks in festgehaltene Tooltips gehen nicht ans Spielfeld
    lastInput = nowSec();
    for (const b of activeButtons()) if (UI.inside(b, m) && !b.disabled) { b.pressed = true; press = { button: b }; return; }
    if (!settingsOpen && jonnyHit(m)) { advanceJonny(); return; }
    if (!settingsOpen && headHit(m)) { catchHead(); return; }
    if (S.phase === 'menu' && !settingsOpen && !TUT.modal && UI.inside(L.logo || LOGO, m)) { logoClick(m); return; }
    if (!settingsOpen && TUT.click(m)) return;   // Klick auf Jonnys Sprechblase
    if (TUT.modal) return;
    if (MOBILE && S.phase === 'trophies' && !settingsOpen) { trophyTap(m); return; }
    if (S.choice || settingsOpen || S.cupDraw) return;
    const h = eng.hovered;
    if (MOBILE && !h && !inMenus()) {
      // Tag-Plaketten und Handarten-Zeilen erklären sich beim Antippen
      const r = tagRects.find((q) => UI.inside(q, m));
      if (r) { openTip(r.term ? { key: 'term:' + r.term, anchor: r, term: r.term } : { key: 'tag:' + r.tag, anchor: r, term: 'tag_' + r.tag }); return; }
    }
    if (!h) { selected = null; return; }
    const k = h.data.kind;
    if (k === 'cup') return selectCup(h.data.i);
    if (k === 'menu') return rollMenuDie(h);
    if (MOBILE && spriteInfo(h)) longPress = { sprite: h, t0: nowSec(), x: m.x, y: m.y, fired: false };
    if (k === 'die') { if (MOBILE) { press = { die: h }; return; } return toggleHold(h); }   // Handy: erst beim Loslassen (langer Druck = Tooltip)
    if (k === 'relic' || k === 'cons') { press = { sprite: h, x: m.x, y: m.y, dx: h.x - m.x, dy: h.y - m.y }; return; }
    if (MOBILE) { press = { tap: h }; return; }
    if (k === 'bagdie' && actFor(h)) { selected = selected === h ? null : h; h.juiceUp(0.3); return; }
    h.juiceUp(0.3);
  });
  eng.on('move', (m) => {
    if (sliderDrag >= 0) { setSlider(sliderDrag, m); return; }
    if (longPress && !longPress.fired && Math.hypot(m.x - longPress.x, m.y - longPress.y) > 14) longPress = null;
    if (!press || !press.sprite || press.sprite.data.kind !== 'relic' || S.phase === 'scoring') return;
    const s = press.sprite;
    if (!s.dragging && Math.hypot(m.x - press.x, m.y - press.y) > (MOBILE ? 14 : 8)) { s.dragging = true; s.juiceUp(0.15); sfx('card'); if (MOBILE) { tips = []; longPress = null; } }
    if (s.dragging) { s.moveTo(m.x + press.dx, m.y + press.dy, 0); s.z = 100; }
  });
  eng.on('up', (m) => {
    if (MOBILE) firstTouch();
    if (sliderDrag >= 0) { const key = setRows()[sliderDrag].key; sliderDrag = -1; saveSettings(); if (key !== 'music') sfx('coin'); return; }
    const lp = longPress; longPress = null;
    if (!press) return;
    if (press.button) {
      const b = press.button; b.pressed = false;
      if (UI.inside(b, m) && !b.disabled) { b.juice.up(0.15, 0.03); sfx('click'); onButton(b); }
    } else if (press.sprite && press.sprite.dragging) {
      press.sprite.dragging = false; reorderRelics(); sfx('card'); TUT.event('drag');
    } else if (lp && lp.fired) {
      // langer Druck hat den Tooltip geöffnet: kein Klick
    } else if (press.die) {
      if (!press.die._dead) toggleHold(press.die);
    } else if (press.tap) {
      tapSprite(press.tap);
    } else if (press.sprite) {
      const s = press.sprite;
      selected = selected === s ? null : s; s.juiceUp(0.25); sfx('card');
      if (MOBILE) tips = selected === s ? [{ key: s, sprite: s }] : [];
    }
    press = null;
  });
  function onButton(b) {
    if (b === B.play) playHand();
    else if (b === B.roll) reroll();
    else if (b === B.start) pressPlay();
    else if (b === B.tutYes) TUT.answer(true);
    else if (b === B.tutNo) TUT.answer(false);
    else if (b === B.tutDone) finishTutorial();
    else if (b === B.tutSlot) startTutorial();
    else if (b === B.tutX) TUT.closeX();
    else if (b === B.options || b === B.settings) { settingsOpen = true; sfx('panel'); }
    else if (b === B.close) { settingsOpen = false; sfx('panel', { close: true }); }
    else if (b === B.quit) saveAndQuit();
    else if (b.setTab !== undefined) { if (setTab !== b.setTab) { setTab = b.setTab; sfx('page'); } }
    else if (b.setRow !== undefined) { const key = SET_TABS[b.inTab].rows[b.setRow].key; if (b.action) settingAction(key, b); else changeSetting(key, b.dir); }
    else if (b === B.trophies) openTrophies();
    else if (b === B.retry) retryRun();
    else if (b === B.home) backToMenu();
    else if (b === B.back) { if (S.phase === 'cups') openSlots(); else setupMenu(); }
    else if (b === B.begin) beginRun();
    else if (b === B.collect) collectCups();
    else if (b === B.cupPrev) selectCup(cupSel - 1);
    else if (b === B.cupNext) selectCup(cupSel + 1);
    else if (b.slotMain !== undefined || b.slotDel !== undefined) onSlotButton(b);
    else if (b === B.achPrev) turnTrophyPage(-1);
    else if (b === B.achNext) turnTrophyPage(1);
    else if (b === B.next) leaveShop();
    else if (b === B.shopReroll) rerollShop();
    else if (b === B.use) useSelected();
    else if (b === B.sell) sellSelected();
    else if (b === B.act) runAct();
    else if (b === B.deposit) vaultDeposit();
    else if (b === B.help) jonnyHelp();
    else if (b === B.withdraw) vaultWithdraw();
    else if (b.choice !== undefined) choose(b.choice);
    else if (b.slot !== undefined) buy(b.slot);
  }
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    lastInput = nowSec();
    if (S.phase === 'menu' && !settingsOpen && konamiKey(k)) return;
    const name = typedName(k);
    if (name === 5) { callJonny(); return; }
    if (name >= 2) return;   // Tasten gehören zu "jonny" (o und n öffnen sonst Einstellungen / überspringen den Song)
    if (k === 'n' && !e.repeat) { skipSong(); return; }   // Song überspringen, überall
    if (TUT.modal) return;
    if (k === ' ' && TUT.active && !settingsOpen) { e.preventDefault(); TUT.advance(); return; }
    if (k === ' ' && !settingsOpen && JS.cur) { e.preventDefault(); advanceJonny(); return; }
    if (k === 'h') return toggleDevPanel();
    if (k === 'escape') {
      if (settingsOpen) { settingsOpen = false; sfx('panel', { close: true }); } else if (S.phase === 'cups') openSlots(); else if (S.phase === 'slots' || S.phase === 'trophies') setupMenu(); else selected = null;
      return;
    }
    if (k === 'o') { settingsOpen = !settingsOpen; sfx('panel', { close: !settingsOpen }); return; }
    if (S.choice || settingsOpen) return;
    if (S.cupDraw) { if (e.key === 'Enter') collectCups(); return; }
    if (S.phase === 'menu' && e.key === 'Enter') return onButton(B.start);
    if (S.phase === 'slots' && /^[1-3]$/.test(e.key)) return pickSlot(+e.key - 1);
    if (S.phase === 'slots' && e.key === '4' && tutorialSeen()) return startTutorial();
    if (S.phase === 'trophies') {
      if (e.key === 'ArrowLeft') return turnTrophyPage(-1);
      if (e.key === 'ArrowRight') return turnTrophyPage(1);
    }
    if (S.phase === 'cups') {
      if (e.key === 'Enter') return beginRun();
      if (e.key === 'ArrowLeft') return selectCup(cupSel - 1);
      if (e.key === 'ArrowRight') return selectCup(cupSel + 1);
    }
    if (S.phase === 'shop' && e.key === 'Enter') return leaveShop();
    if (S.phase === 'select') {
      if (e.key === 'Enter') playHand();
      else if (k === 'r') reroll();
      else if (/^[1-6]$/.test(e.key) && dice[+e.key - 1]) toggleHold(dice[+e.key - 1]);
    }
  });
  function toggleDevPanel() { document.getElementById('dev').classList.toggle('open'); }

  // ── Update ──────────────────────────────────────────────────────────────
  function update() {
    const sel = S.phase === 'select';
    const every3 = setOn('reroll', 5) && (S.rerollTotal + 1) % 3 === 0;
    B.play.disabled = !sel;
    B.roll.disabled = !sel || (!S.freeReroll && !every3 && S.rerolls <= 0) || (!rerollTargets().length && !bossActive('chaos'));
    B.play.label = L.labels ? L.labels.play(S.hands) : 'Play Hand (' + S.hands + ')';
    B.roll.label = L.labels ? L.labels.roll(S.rerolls, S.freeReroll || every3) : S.freeReroll || every3 ? 'Reroll (free)' : 'Reroll (' + S.rerolls + ')';
    B.retry.label = S.phase === 'runWon' ? 'New Run' : 'Try Again';
    B.home.x = B.retry.x - (L.homeGap || 180); B.home.y = B.retry.y;
    B.quit.disabled = !canQuit();
    B.quit.label = TUT.active ? 'Leave Tutorial' : ['lost', 'runWon'].includes(S.phase) ? 'Main Menu' : 'Save & Quit';
    if (!MOBILE) { if (inMenus()) { B.close.x = 560; B.close.w = 160; } else { B.close.x = 450; B.close.w = 180; } }
    B.begin.disabled = !cupAt(cupSel);
    if (!MOBILE) { B.back.x = S.phase === 'cups' ? 420 : 560; B.begin.x = 610; }
    B.cupPrev.disabled = cupSel <= 0; B.cupNext.disabled = cupSel >= cupList.length - 1;
    B.achPrev.disabled = achPage <= 0; B.achNext.disabled = achPage >= achPages() - 1;
    SET_TAB_BTNS.forEach((b, i) => { b.colour = i === setTab ? P.BLUE : darken(P.PANEL, 0.1); });
    for (const b of SET_BTNS) if (b.action) { const sure = confirmBtn && confirmBtn.b === b; b.label = sure ? 'Sure?' : SET_TABS[b.inTab].rows[b.setRow].action; }
    trackSong();
    updateHead();
    if (TUT.active && TUT.everGaveUp) secret('breaking_point');
    // Würfel schlafen ein, wenn man sie lange nicht anfasst
    if (S.phase === 'select' && !settingsOpen && !TUT.active && dice.length) {
      const idle = nowSec() - lastInput;
      if (idle > 60 && nowSec() - zzzClock > 2.6) {
        zzzClock = nowSec();
        const d = R.pick(dice);
        eng.popup(d.x + 18, d.y - 52, idle > 150 ? 'Zzz' : idle > 100 ? 'Zz' : 'z', { colour: P.TEXT_SOFT, size: 16 + Math.min(10, idle / 20), life: 1.8 });
      }
      if (idle > 180) secret('snooze');
    }
    if (MOBILE) mobilePlace(); else B.collect.x = L.msg.x - 90;
    if (confirmBtn && eng.time > confirmBtn.until) confirmBtn = null;
    B.shopReroll.label = 'Reroll $' + S.shopRerollCost;
    B.shopReroll.disabled = !canPay(S.shopRerollCost);
    B.deposit.disabled = S.money <= 0 || S.vault >= VAULT_MAX;
    B.withdraw.disabled = S.vault <= 0;
    BUY.forEach((b) => {
      const it = S.shop && S.shop[b.slot];
      b.label = it ? 'Buy $' + it.price : 'Sold';
      b.disabled = !it || !canPay(it.price);
    });
    if (S.choice) CHOICE.forEach((b, k) => { const o = S.choice.opts[k]; b.label = o ? R.TAGS[o.tag].name : '-'; b.colour = o ? TAG_COL(o.tag) : P.GREY; b.disabled = !o; });
    if (selected && (selected._dead || !relicSprites.concat(consSprites, bagSprites).includes(selected))) selected = null;
    if (selected) {
      const item = selected.data.item, k = selected.data.kind, a = actFor(selected);
      const y = L.selY && k !== 'bagdie' ? L.selY(selected) : selected.y + 50;
      if (k === 'cons') {
        B.use.x = selected.x - 84; B.use.y = y; B.sell.x = selected.x + 4; B.sell.y = y;
        B.use.disabled = !canUse(item).ok;
      } else if (k === 'relic') {
        if (a) { B.sell.x = selected.x - 96; B.act.x = selected.x + 2; B.act.y = y; } else B.sell.x = selected.x - 45;
        B.sell.y = y;
      } else if (a) { B.act.x = selected.x - 55; B.act.y = L.bagActY ? L.bagActY(selected) : selected.y + 30; }
      if (L.placeSel) L.placeSel(selected, k, !!a);
      if (item) B.sell.label = 'Sell $' + sellPrice(item);
      B.sell.disabled = !['select', 'shop'].includes(S.phase);
      if (a) { B.act.label = a.label; B.act.disabled = !a.ok; }
    }
    let pointer = !!eng.hovered;
    const act = activeButtons();
    for (const b of ALL_BUTTONS) {
      const on = act.includes(b) && UI.inside(b, eng.mouse);
      if (on && !b.hover && !b.disabled) { b.juice.up(0.05, 0.015); if (!MOBILE) sfx('hover'); }
      b.hover = on;
      if (on && !b.disabled) pointer = true;
    }
    canvas.style.cursor = pointer ? 'pointer' : 'default';
    if (MOBILE) mobileUpdate();
    const dt = Math.max(0, Math.min(0.25, eng.time - (update.last || eng.time)));
    update.last = eng.time;
    updateJonny(dt);
    B.help.disabled = !sel || S.jonny.help;
    B.help.label = S.jonny.help ? 'Used' : 'Help!';
    if (S.phase === 'cups') layoutCups();
    TUT.update();
    for (const sp of menuDice) sp.visible = !TUT.modal;   // Jonnys Frage verdeckt sonst die Menü-Würfel
    if (inMenus()) return;
    layoutOwned(); layoutBag(); updateFlames();
    if (TUT.active) for (const sp of bagSprites) sp.visible = false;   // Platz für Jonny
    // Spielzeit in echter Zeit (unabhängig von der Spielgeschwindigkeit)
    if (profile && !['lost', 'runWon'].includes(S.phase)) { const rdt = dt / (eng.timeScale || 1); S.time += rdt; meta().playTime += rdt; }
    if (['select', 'shop'].includes(S.phase) && !S.choice && !eng.busy && eng.time - saveClock > 1.5) { saveClock = eng.time; autosave(); }
    if (['select', 'shop', 'won'].includes(S.phase) && eng.time - achClock > 0.5) { achClock = eng.time; achieve('state', achState()); }
  }

  // ── Zeichnen: Hilfen ────────────────────────────────────────────────────
  function juiced(ctx, j, cx, cy, t, fn) {
    j.update(t);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(j.r); ctx.scale(1 + j.s, 1 + j.s); ctx.translate(-cx, -cy);
    fn(); ctx.restore();
  }
  const area = (ctx, x, y, w, h) => UI.box(ctx, x, y, w, h, { colour: P.AREA, radius: 14, shadow: false });

  function statBox(ctx, x, y, w, h, label, value, colour, j, t) {
    UI.box(ctx, x, y, w, h, { colour: P.PANEL, radius: 10, emboss: 3 });
    UI.text(ctx, label, x + w / 2, y + 16, { size: 17, colour: P.TEXT_LABEL });
    UI.box(ctx, x + 8, y + 30, w - 16, h - 38, { colour: P.PANEL_DARK, radius: 8, shadow: false });
    juiced(ctx, j, x + w / 2, y + 30 + (h - 38) / 2, t, () => UI.text(ctx, String(value), x + w / 2, y + 30 + (h - 38) / 2, { size: 32, colour }));
  }

  // Beschreibungstext: Zahlenangaben werden eingefärbt (Chips blau, Mult rot, Geld gelb, Luck grün, Schädel dunkelrot)
  const TOKEN = /(x[\d.]+ Power|[+-]\d+ Power|xPower|[+-]\d+ Pips?|Lucky Hits?|[+-]?\d+ Luck|Luck|[+-]?\$\d+|Wild|Gold|Skulls?|Bust|Bonus faces|Power faces)/;
  function tokenColour(t) {
    if (/Pip|Bonus/.test(t)) return P.CHIPS;
    if (/Power/.test(t)) return P.MULT;
    if (/\$|Gold/.test(t)) return P.GOLD_TEXT;
    if (/Wild/.test(t)) return P.PURPLE;
    if (/Luck/.test(t)) return P.LUCK_TEXT;
    if (/Skull|Bust/.test(t)) return P.SKULL;
    return P.BLACK;
  }
  // Begriffe für die Erklär-Tooltips (ui/glossary.js)
  const GLOSS = window.WG_GLOSSARY || { TERMS: {}, PHRASES: {} };
  const escapeRe = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const TERM_RE = new RegExp('(?<![\\w-])(' + Object.keys(GLOSS.PHRASES).sort((a, b) => b.length - a.length).map(escapeRe).join('|') + ')(?![\\w-])');
  function termOfToken(t) {
    if (/\$/.test(t)) return 'money';
    if (/Lucky Hit/.test(t)) return 'lucky';
    if (/Luck/.test(t)) return 'luck';
    if (/^x[\d.]+ Power|xPower/.test(t)) return 'xpower';
    if (/Power faces/.test(t)) return 'powerface';
    if (/Bonus faces/.test(t)) return 'bonus';
    if (/Power/.test(t)) return 'power';
    if (/Pip/.test(t)) return 'pips';
    if (/Skull/.test(t)) return 'skull';
    if (/Bust/.test(t)) return 'bust';
    if (/Wild/.test(t)) return 'wild';
    if (/Gold/.test(t)) return 'gold';
    return null;
  }
  // Zerlegt Text in Wörter [text, farbe, begriff] und bricht ihn auf maxW um ('\n' = neue Zeile)
  function wrapText(ctx, text, maxW, size) {
    ctx.font = UI.font(size);
    const words = [];
    text.split('\n').forEach((para, pi) => {
      if (pi > 0) words.push(['\n']);
      para.split(TOKEN).forEach((part, i) => {
        if (!part) return;
        if (i % 2 === 1) { words.push([part, tokenColour(part), termOfToken(part)]); return; }
        part.split(TERM_RE).forEach((q, j) => {
          if (!q) return;
          if (j % 2 === 1) words.push([q, P.BLACK, GLOSS.PHRASES[q]]);
          else q.split(/(\s+)/).forEach((w) => { if (w) words.push([w, P.BLACK]); });
        });
      });
    });
    // Umbruch nur an Leerzeichen: zusammenhängende Teile wie "scored". bleiben in einer Zeile
    const lines = [[]];
    let w = 0;
    for (let k = 0; k < words.length; k++) {
      const word = words[k], ln = lines[lines.length - 1];
      if (word[0] === '\n') { lines.push([]); w = 0; continue; }
      if (!word[0].trim()) { if (ln.length) { ln.push(word); w += ctx.measureText(word[0]).width; } continue; }
      let j = k, ww = 0;
      while (j < words.length && words[j][0] !== '\n' && words[j][0].trim()) ww += ctx.measureText(words[j++][0]).width;
      if (w + ww > maxW && w > 0) {
        while (ln.length && !ln[ln.length - 1][0].trim()) ln.pop();
        lines.push([]); w = 0;
      }
      for (let q = k; q < j; q++) lines[lines.length - 1].push(words[q]);
      w += ww; k = j - 1;
    }
    for (const ln of lines) while (ln.length && !ln[ln.length - 1][0].trim()) ln.pop();
    return lines;
  }
  // Zeichnet eine Zeile zentriert. links=true: Begriffe gepunktet unterstreichen. Gibt Trefferflächen der Begriffe zurück.
  function drawLine(ctx, segs, cx, cy, size, links, self) {
    ctx.font = UI.font(size);
    const ws = segs.map((sg) => ctx.measureText(sg[0]).width);
    let x = cx - ws.reduce((a, b) => a + b, 0) / 2;
    const rects = [];
    segs.forEach((sg, i) => {
      if (sg[2] === self) sg = [sg[0], sg[1]];   // kein Verweis auf sich selbst
      if (sg[2]) {
        const r = { x, y: cy - size * 0.62, w: ws[i], h: size * 1.24, term: sg[2] };
        rects.push(r);
        if (links && UI.inside(r, eng.mouse)) UI.box(ctx, r.x - 2, r.y, r.w + 4, r.h, { colour: 'rgba(253,190,60,0.35)', radius: 4, shadow: false });
      }
      UI.text(ctx, sg[0], x, cy, { size, colour: sg[1], align: 'left', shadow: false });
      if (sg[2] && links) {
        ctx.fillStyle = sg[1] === P.BLACK ? P.PURPLE : sg[1];
        for (let u = 0; u < ws[i] - 1; u += 4) ctx.fillRect(Math.round(x + u), Math.round(cy + size * 0.5), 2, 2);
      }
      x += ws[i];
    });
    return rects;
  }
  // Besondere Würfelseiten -> Begriff im Lexikon
  const FACE_TERM = { wild: 'wild', gold: 'gold', mult: 'powerface', bonus: 'bonus', skull: 'skull', hex: 'hex', prism: 'prism', twin: 'twin' };
  function drawFaces(ctx, die, cx, cy, upIdx) {
    const sz = 26, gap = 5, x0 = cx - (6 * sz + 5 * gap) / 2;
    ctx.imageSmoothingEnabled = false;
    const rects = [];
    die.faces.forEach((f, k) => {
      const x = x0 + k * (sz + gap);
      if (k === upIdx) UI.box(ctx, x - 3, cy - sz / 2 - 3, sz + 6, sz + 6, { colour: P.ORANGE, radius: 5, shadow: false });
      ctx.drawImage(faceEntry(f, die.type).canvas, x, cy - sz / 2, sz, sz);
      if (FACE_TERM[f.kind]) rects.push({ x, y: cy - sz / 2, w: sz, h: sz, term: FACE_TERM[f.kind] });
    });
    return rects;
  }
  // Tag-Plaketten (Pixel-Icon + Text), zentriert; gibt die Trefferflächen zurück
  function tagChips(ctx, list, cx, cy, size = 15) {
    ctx.font = UI.font(size);
    const ws = list.map((c) => ctx.measureText(c.label).width + 32);
    let x = cx - (ws.reduce((a, b) => a + b, 0) + (ws.length - 1) * 6) / 2;
    const rects = [];
    list.forEach((c, k) => {
      UI.box(ctx, x, cy - 11, ws[k], 22, { colour: c.colour, radius: 11, shadow: false, outline: c.outline, outlineWidth: 2 });
      Icons.tag(ctx, c.tag, x + 13, cy + 1, 16);
      UI.text(ctx, c.label, x + 24, cy, { size, align: 'left' });
      rects.push({ x, y: cy - 11, w: ws[k], h: 22, tag: c.tag });
      x += ws[k] + 6;
    });
    return rects;
  }

  function itemInfo(item) {
    if (item.type === 'relic') {
      const d = R.RELIC_BY_ID[item.id], ri = S.relics.indexOf(item), rar = R.RARITY[d.rarity];
      let sub = d.stateText && item.state ? d.stateText(item.state, ctx()) : null;
      if (d.id === 'mirror' && ri >= 0) { const e = R.effective(S.relics)[ri]; sub = e.def.id === 'none' ? 'Nothing to copy on that side' : 'Copying ' + e.def.name; }
      const tags = ri >= 0 ? R.relicTags(S.relics, ri) : d.tags;
      const counts = R.tagCounts(S.relics);
      if (item.special) sub = "Jonny's Special: half price. There might be a catch.";
      else if (item.noRefund) sub = (sub ? sub + '  ·  ' : '') + "Non-refundable (Jonny's Special)";
      return {
        title: d.name, desc: d.desc, sub, badge: [rar.name + ' Relic', rar.colour, 'rarity_' + d.rarity],
        tags: tags.map((t) => ({ tag: t, label: R.TAGS[t].name + ' ' + ((counts[t] || 0) + (ri >= 0 ? 0 : 1)), colour: darken(TAG_COL(t), 0.1) })),
        tagNote: !d.tags.length && !tags.length ? (d.id === 'jack' ? 'Counts your tags' : 'Adapts its tags') : null,
      };
    }
    if (item.type === 'upgrade') {
      const d = R.UPGRADE_BY_ID[item.id], rar = R.RARITY[d.rarity];
      return { title: d.name, desc: d.desc, sub: S.upgrades.includes(d.id) ? 'Owned for this run' : 'Lasts the whole run', badge: [rar.name + ' Upgrade', TYPE_COL.upgrade, 'upgrade'] };
    }
    if (item.type === 'constellation') {
      const h = R.HANDS[item.hand], lv = S.levels[item.hand] || 1;
      return { title: h.star, desc: 'Level up ' + item.hand + ': +' + h.level[0] + ' Pips and +' + h.level[1] + ' Power', sub: 'Lv ' + lv + ' -> ' + (lv + 1), badge: ['Constellation', TYPE_COL.constellation, 'constellation'] };
    }
    if (item.type === 'tally') {
      const lv = S.numLevels[item.n] || 1;
      return { title: 'Tally of ' + R.NUMBER_NAMES[item.n], desc: 'Level up ' + item.n + 's: each scored ' + item.n + ' gives +4 Pips and +1 Power more', sub: 'Lv ' + lv + ' -> ' + (lv + 1), badge: ['Tally', TYPE_COL.tally, 'tally'] };
    }
    if (item.type === 'oracle') {
      const d = R.ORACLE_BY_ID[item.id];
      return { title: d.name, desc: d.desc, badge: ['Oracle', TYPE_COL.oracle, 'oracle'] };
    }
    const t = R.DIE_TYPES[item.dieType];
    return { title: t.name, desc: 'Adds this die to your bag', faces: item.die, badge: ['Die', TYPE_COL.die, 'die'] };
  }
  function spriteInfo(sp) {
    const d = sp.data;
    if (d.kind === 'die' || d.kind === 'bagdie') {
      if (!d.die) return null;
      const t = R.DIE_TYPES[d.die.type];
      const f = d.kind === 'die' ? d.die.faces[d.up] : null;
      let desc = f && f.kind !== 'normal' ? R.FACE_KINDS[f.kind].name + ' face: ' + R.FACE_KINDS[f.kind].desc : 'Faces of this die:';
      if (d.die.chips >= 1) desc += '. Permanent bonus: +' + Math.round(d.die.chips) + ' Pips';
      const sub = d.anchored ? 'Anchored from last hand' : d.kind === 'bagdie' && actFor(sp) ? (MOBILE ? 'Tap' : 'Click') + ' to prune it' : null;
      return { title: t.name, desc, faces: d.die, upIdx: f ? d.up : -1, sub, badge: ['Die', TYPE_COL.die, 'die'] };
    }
    if (d.kind === 'upgrade') return itemInfo(d.item);
    if (d.kind === 'relic' || d.kind === 'cons' || d.kind === 'shop') {
      const inf = itemInfo(d.item);
      if (d.kind === 'cons' && d.item.type === 'oracle') { const u = canUse(d.item); if (!u.ok) inf.sub = u.why; }
      return inf;
    }
    return null;
  }

  // ── Tooltips mit Lexikon ────────────────────────────────────────────────
  // Nach TIP_DELAY Sekunden erscheint unten rechts ein Ring, der sich füllt. Ist er voll, bleibt der Tooltip
  // stehen: man kann hineinfahren und über unterstrichene Begriffe weitere Erklärungen öffnen (beliebig tief).
  const TIP_FILL = 0.6, TIP_GRACE = 0.3;
  let TIP_DELAY = 1.0;   // Einstellungen > Gameplay
  let tips = [], tipClock = 0;
  const inRect = (r, m, pad = 0) => !!r && m.x >= r.x - pad && m.x <= r.x + r.w + pad && m.y >= r.y - pad && m.y <= r.y + r.h + pad;
  const overPinnedTip = (m) => tips.some((q) => q.pinned && inRect(q.rect, m, 6));

  function termInfo(id) {
    if (id.startsWith('tag_')) {
      const tg = id.slice(4), t = R.TAGS[tg], n = R.tagCounts(S.relics)[tg] || 0;
      return { title: t.name + ' tag', w: 300, badge: ['Set bonus', t.colour, 'set'],
        desc: 'With 3 relics: ' + t.s3 + (n >= 3 ? ' (active)' : '') + '\nWith 5 relics: ' + t.s5 + (n >= 5 ? ' (active)' : '') + '\nYou own ' + n + ' relic' + (n === 1 ? '' : 's') + ' with this tag.' };
    }
    if (id.startsWith('rarity_')) { const r = R.RARITY[id.slice(7)]; return { title: r.name, w: 260, desc: GLOSS.TERMS.rarity.text, badge: ['Rarity', r.colour] }; }
    const g = GLOSS.TERMS[id];
    if (!g) return null;
    let desc = g.text;
    if (g.hand) { const [c, m] = R.handValues(g.hand, S.levels); desc += '\nScores ' + c + ' Pips x ' + m + ' Power (Lv ' + (S.levels[g.hand] || 1) + ').'; }
    return { title: g.title, desc, w: 260, badge: ['Keyword', P.PURPLE] };
  }

  function panelSize(ctx, inf) {
    const w = inf.w || 280;
    const lines = wrapText(ctx, inf.desc, w - 32, 19);
    const facesH = inf.faces ? 36 : 0, subH = inf.sub ? 26 : 0, badgeH = inf.badge ? 32 : 0;
    const tagsH = inf.tags && inf.tags.length ? 28 : inf.tagNote ? 24 : 0;
    const boxH = lines.length * 22 + 14 + facesH;
    return { w, h: 44 + boxH + subH + tagsH + badgeH + 6, lines, boxH, subH, tagsH };
  }
  // Ring unten rechts: füllt sich, bis der Tooltip feststeht
  function tipRing(ctx, x, y, progress) {
    if (progress < 0) return;
    ctx.save();
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = P.GOLD;
    ctx.beginPath(); ctx.arc(x, y, 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, progress)); ctx.stroke();
    if (progress >= 1) { ctx.fillStyle = P.GOLD; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  function drawPanel(ctx, inf, sz, x, y, links, progress, self) {
    const { w, h, lines, boxH, subH, tagsH } = sz, terms = [];
    UI.box(ctx, x, y, w, h, { colour: P.L_BLACK, radius: 12, emboss: 4, outline: links ? P.GOLD : lighten(P.L_BLACK, 0.25), outlineWidth: links ? 2 : 1 });
    UI.text(ctx, inf.title, x + w / 2, y + 22, { size: 24 });
    UI.box(ctx, x + 8, y + 40, w - 16, boxH, { colour: '#FFFFFF', radius: 8, shadow: false });
    lines.forEach((ln, i) => terms.push(...drawLine(ctx, ln, x + w / 2, y + 58 + i * 22, 19, links, self)));
    if (inf.faces) terms.push(...drawFaces(ctx, inf.faces, x + w / 2, y + 40 + lines.length * 22 + 28, inf.upIdx));
    let yy = y + 40 + boxH + 4;
    if (inf.sub) { UI.text(ctx, inf.sub, x + w / 2, yy + 12, { size: 18, colour: P.GOLD }); yy += subH; }
    if (inf.tags && inf.tags.length) { tagChips(ctx, inf.tags, x + w / 2, yy + 14, 14).forEach((r) => terms.push(Object.assign(r, { term: 'tag_' + r.tag }))); yy += tagsH; }
    else if (inf.tagNote) { UI.text(ctx, inf.tagNote, x + w / 2, yy + 11, { size: 16, colour: P.TEXT_HINT }); yy += tagsH; }
    if (inf.badge) {
      ctx.font = UI.font(18);
      const bw = ctx.measureText(inf.badge[0]).width + 28, bx = x + w / 2 - bw / 2;
      const r = { x: bx, y: yy + 4, w: bw, h: 24, term: inf.badge[2] };
      UI.box(ctx, bx, yy + 4, bw, 24, { colour: inf.badge[1], radius: 12, emboss: 2, outline: links && r.term && UI.inside(r, eng.mouse) ? P.GOLD : undefined, outlineWidth: 2 });
      UI.text(ctx, inf.badge[0], x + w / 2, yy + 16, { size: 18 });
      if (r.term) terms.push(r);
    }
    tipRing(ctx, x + w - 19, y + h - 19, progress);
    return { x, y, w, h, terms };
  }

  // Platzierung: am Sprite, unter einer Plakette oder neben dem Eltern-Tooltip
  function placeAtSprite(sp, sz) {
    const sh = (sp.h * sp.s) / 2, x = clamp(sp.x - sz.w / 2, 8, 1272 - sz.w);
    const gap = sp === selected ? 54 : 14;   // Platz für die Use/Sell-Buttons lassen
    const up = L.selY && sp === selected && sp.data.kind !== 'bagdie' ? gap : 14;
    return { x, y: clamp(sp.y < 300 ? sp.y + sh + gap : sp.y - sh - sz.h - up, 8, 712 - sz.h) };
  }
  function placeBelow(r, sz) {
    const x = clamp(r.x + r.w / 2 - sz.w / 2, 8, 1272 - sz.w);
    return { x, y: r.y + r.h + 10 + sz.h > 712 ? r.y - sz.h - 10 : r.y + r.h + 10 };
  }
  function placeBeside(parent, anchor, sz) {
    let x = parent.x + parent.w + 10;
    if (x + sz.w > 1272) x = parent.x - sz.w - 10;
    return { x: clamp(x, 8, 1272 - sz.w), y: clamp(anchor.y - 30, 8, 712 - sz.h) };
  }

  function rootSource() {
    const h = eng.hovered;
    if (h && !h.dragging && h.dissolve === 0 && spriteInfo(h)) return { key: h, sprite: h };
    const r = tagRects.find((q) => UI.inside(q, eng.mouse));
    if (r) return { key: 'tag:' + r.tag, anchor: r, term: 'tag_' + r.tag };
    return null;
  }
  function drawTips(ctx) {
    const dt = Math.min(0.1, Math.max(0, eng.time - tipClock)), m = eng.mouse;
    tipClock = eng.time;
    // Wurzel: was gerade unter der Maus liegt – außer die Maus ist in einem festgehaltenen Tooltip
    if (tips.some((q) => q.pinned && inRect(q.rect, m, 16))) tips[0].lost = 0;
    else {
      const src = rootSource();
      if (src && (!tips.length || tips[0].key !== src.key)) tips = [Object.assign({ t: 0, pinned: false, lost: 0 }, src)];
      else if (src) tips[0].lost = 0;
      else if (!(tips.length && tips[0].pinned && (tips[0].lost += dt) < TIP_GRACE)) tips = [];
    }
    for (let d = 0; d < tips.length; d++) {
      const p = tips[d];
      if (p.sprite && (p.sprite._dead || p.sprite.dissolve > 0)) { tips.length = d; break; }
      const inf = p.sprite ? spriteInfo(p.sprite) : termInfo(p.term);
      if (!inf) { tips.length = d; break; }
      p.t += dt;
      if (!p.pinned && p.t >= TIP_DELAY + TIP_FILL) { p.pinned = true; TUT.event('tipPinned'); }
      const sz = panelSize(ctx, inf);
      const pos = d === 0 ? (p.sprite ? placeAtSprite(p.sprite, sz) : placeBelow(p.anchor, sz)) : placeBeside(tips[d - 1].rect, p.anchor, sz);
      const progress = p.pinned ? 1 : p.t < TIP_DELAY ? -1 : (p.t - TIP_DELAY) / TIP_FILL;
      const out = drawPanel(ctx, inf, sz, pos.x, pos.y, p.pinned, progress, p.term);
      p.rect = out;
      if (!p.pinned) { tips.length = d + 1; break; }
      // Begriff unter der Maus -> nächste Erklärung öffnen; sonst nur behalten, wenn die Maus in einem tieferen festen Tooltip ist
      const hit = out.terms.find((q) => inRect(q, m));
      const next = tips[d + 1];
      if (hit) {
        if (!next || next.term !== hit.term) tips.splice(d + 1, tips.length, { term: hit.term, anchor: hit, t: 0, pinned: false, lost: 0 });
        else { next.anchor = hit; next.lost = 0; }
      } else if (next && next.pinned && tips.slice(d + 1).some((q) => inRect(q.rect, m, 16))) next.lost = 0;
      else if (!(next && next.pinned && (next.lost += dt) < TIP_GRACE)) { tips.length = d + 1; break; }   // kurz halten, damit man hinüberfahren kann
    }
  }

  // ── Zeichnen: gemeinsame Teile (Würfel-Beschriftung, Meldungen, Auswahlfenster) ──
  let tagRects = [];
  let previewKey = '', previewRes = null;
  function preview() {
    if (!dice.length || dice.some((d) => !d.data.die)) return null;
    const faces = dice.map(upFace);
    const opts = { gap: has('gap_jumper'), skullWild: has('hex_bag'), bustAt: bustAt() };
    const key = faces.map((f) => f.v + f.kind).join(',') + JSON.stringify(S.levels) + JSON.stringify(opts);
    if (key !== previewKey) { previewKey = key; previewRes = R.evaluateFaces(faces, S.levels, opts); }
    return previewRes;
  }
  const offReady = () => S.relics.some((r) => r.id === 'off_record' && !(r.state && r.state.used));
  const isBust = (pv) => pv.skulls >= bustAt() && !has('ritual_candle') && !has('evil_eye') && !offReady();

  // Tag-Übersicht: ab 3 farbig, ab 5 mit Goldrand. Gibt die Trefferflächen für die Tooltips zurück.
  function tagList() {
    const counts = R.tagCounts(S.relics);
    return R.TAG_ORDER.filter((tg) => counts[tg] > 0).map((tg) => {
      const n = counts[tg], lv = n >= 5 ? 5 : n >= 3 ? 3 : 0;
      return { tag: tg, label: String(n), colour: lv ? TAG_COL(tg) : P.CHIP_OFF, outline: lv === 5 ? P.GOLD : lv === 3 ? lighten(TAG_COL(tg), 0.4) : undefined };
    });
  }
  function tagSummary(ctx, cx, cy, perRow = 99, rowGap = 26) {
    const list = tagList(), rects = [];
    for (let k = 0; k < list.length; k += perRow) rects.push(...tagChips(ctx, list.slice(k, k + perRow), cx, cy + (k / perRow) * rowGap, 14));
    return rects;
  }
  // Preisschilder und Typ-Namen im Shop; pos(k) -> { x, price, label }
  function shopLabels(ctx, pos) {
    (S.shop || []).forEach((it, k) => {
      if (!it) return;
      const q = pos(k);
      UI.box(ctx, q.x - 34, q.price - 15, 68, 30, { colour: it.special ? JONNY_GOLD : P.MONEY, radius: 8, emboss: 3, outline: it.special ? '#FFFFFF' : undefined, outlineWidth: 2 });
      UI.text(ctx, '$' + it.price, q.x, q.price, { size: 22, colour: P.BLACK, shadow: false });
      if (it.special) {
        UI.text(ctx, '$' + it.was, q.x + 50, q.price, { size: 16, colour: P.TEXT_DIM });
        ctx.fillStyle = P.RED; ctx.fillRect(q.x + 38, q.price - 1, 24, 2);
      }
      UI.text(ctx, it.special ? "Jonny's Special" : TYPE_NAME[it.type], q.x, q.label, { size: it.special ? 13 : 14, colour: it.special ? JONNY_GOLD : lighten(TYPE_COL[it.type], 0.35) });
    });
  }
  const upgradeNote = () => (S.upgrades.length >= R.UPGRADES.length ? 'All upgrades owned' : 'New upgrade next stage');
  const moneyText = () => (S.money < 0 ? '-$' + -S.money : '$' + S.money);

  // Beschriftung der Würfel (gehalten, verankert, eingefroren) und Crystal Ball
  function drawDiceExtras(front) {
    const Y = dieY(), DT = L.diceText;   // DT (Handy): Beschriftung unter dem Würfel, keine Tasten-Nummern
    dice.forEach((d, i) => {
      if (!d.data.die) return;
      if (S.phase === 'select' && d.data.held) UI.text(front, d.data.anchored ? 'ANCHOR' : 'HELD', d.x, DT ? Y + DT.below : Y - L.die.lift - 52, { size: DT ? DT.size : 16, colour: d.data.anchored ? P.ANCHOR : P.ORANGE });
      else if (S.phase === 'select' && frozen(d)) UI.text(front, 'FROZEN', d.x, DT ? Y + DT.below : Y - 52, { size: DT ? DT.size : 16, colour: '#9FD8FF' });
      if (!DT || DT.numbers) UI.text(front, String(i + 1), d.x, Y + 62, { size: 14, colour: P.TEXT_FAINT });
    });
    // Jonny's Glasses: Würfel, die beim nächsten Neu-Würfeln einen Lucky Hit landen, funkeln
    if (has('jonny_glasses') && S.phase === 'select') dice.forEach((d, i) => {
      if (!d.data.die || d.data.held || frozen(d)) return;
      if (!outcomes([i], false, { rerollsHand: S.rerollsHand + 1 })[i].lucky) return;
      const tw = 0.55 + 0.45 * Math.sin(eng.time * 7 + i * 1.7);
      front.save(); front.globalAlpha = tw;
      Icons.draw(front, 'clover', d.x + 30, Y - 34, 26);
      front.restore();
    });
    // Crystal Ball: zeigt, worauf der Würfel unter dem Mauszeiger beim Neu-Würfeln landet (unter dem Würfel, damit der Tooltip frei bleibt)
    const hv = eng.hovered;
    if (upg('crystal_ball') && S.phase === 'select' && hv && hv.data.kind === 'die' && !hv.data.held && !frozen(hv)) {
      const i = dice.indexOf(hv), o = outcomes([i], false, { rerollsHand: S.rerollsHand + 1 })[i];
      const f = hv.data.die.faces[o.up];
      UI.box(front, hv.x - 32, Y + 42, 64, 56, { colour: 'rgba(40,30,70,0.94)', radius: 8, outline: P.PURPLE, outlineWidth: 2 });
      front.imageSmoothingEnabled = false;
      front.drawImage(faceEntry(f, hv.data.die.type).canvas, hv.x - 14, Y + 46, 28, 28);
      UI.text(front, o.lucky ? 'Lucky!' : 'Next roll', hv.x, Y + 86, { size: 13, colour: o.lucky ? P.GREEN : '#D8C8FF' });
    }
  }

  function drawChoice(ctx, t) {
    if (!S.choice) return;
    if (MOBILE) return drawChoiceMobile(ctx, t);
    const X = L.msg.x;
    dim(ctx, 0.45);
    UI.box(ctx, X - 310, 196, 620, 268, { colour: P.OVERLAY_SOLID, radius: 16, outline: P.GOLD, outlineWidth: 3 });
    UI.dynaText(ctx, 'Crossroads', X, 232, { size: 40, colour: P.GOLD, time: t, wave: 2 });
    UI.text(ctx, 'Choose a tag. You get its strongest relic you do not own yet.', X, 270, { size: 16, colour: P.TEXT_LABEL });
    CHOICE.forEach((b, k) => {
      const o = S.choice.opts[k];
      if (!o) return;
      UI.button(ctx, b, t);
      Icons.tag(ctx, o.tag, b.x + b.w / 2, b.y + b.h + 22, 24);
      UI.text(ctx, o.def.name, b.x + b.w / 2, b.y + b.h + 52, { size: 16, colour: '#FFFFFF' });
      UI.text(ctx, R.RARITY[o.def.rarity].name, b.x + b.w / 2, b.y + b.h + 72, { size: 14, colour: lighten(R.RARITY[o.def.rarity].colour, 0.2) });
    });
  }

  function drawMsg(ctx, t) {
    const m = S.msg; if (!m) return;
    const age = eng.time - m.t0;
    if (age > m.life) { S.msg = null; return; }
    const out = m.life - age < 0.3 ? (m.life - age) / 0.3 : 1;
    const pop = Math.min(1, age * 2.5);
    const MS = L.msgSizes || { title: 50, sub: 22, small: 17 }, tk = MS.title / 50;   // Handy: größer
    const subSize = m.sub && m.sub.length > 70 ? MS.small : MS.sub;
    const X = L.msg.x, Y = L.msg.y, maxW = L.msg.maxW || 920;
    ctx.save(); ctx.globalAlpha = out;
    // Untertitel auf die Breite des Feldes umbrechen
    ctx.font = UI.font(subSize);
    const lines = [];
    if (m.sub) for (const word of m.sub.split(' ')) {
      const cur = lines.length ? lines[lines.length - 1] + ' ' + word : word;
      if (lines.length && ctx.measureText(cur).width > maxW - 60) lines.push(word); else if (lines.length) lines[lines.length - 1] = cur; else lines.push(word);
    }
    const lh = subSize + 6;
    const w = Math.min(maxW, Math.max(460 * tk, ...lines.map((l) => ctx.measureText(l).width + 60)));
    const h = m.sub ? 96 * tk + lines.length * lh : 84 * tk;
    UI.box(ctx, X - w / 2, Y - 50 * tk, w, h, { colour: P.OVERLAY, radius: 16, outline: m.colour, outlineWidth: 3 });
    UI.dynaText(ctx, m.text, X, Y - 8 * tk, { size: MS.title, colour: m.colour, time: t, pop, wave: 3 });
    lines.forEach((l, i) => UI.text(ctx, l, X, Y + 40 * tk + i * lh, { size: subSize }));
    ctx.restore();
  }

  function draw(back, front, t) {
    drawHead(back);
    if (inMenus()) {
      if (S.phase === 'menu') { L.drawMenu(back, front, t); for (const b of activeButtons()) UI.button(front, b, t); }
      else if (S.phase === 'slots') drawSlots(back, front, t);
      else if (S.phase === 'trophies') drawTrophies(back, front, t);
      else drawCups(back, front, t);
      TUT.draw(front, t);
      drawToasts(front);
      drawSong(front);
      drawPeek(front, t);
      drawSettings(front, t);
      return;
    }
    tagRects = [];
    L.drawFrame(back, front, t);
    if (S.phase === 'shop') {
      L.drawShop(back, front, t);
      for (const b of BUY) if (S.shop && S.shop[b.slot]) UI.button(front, b, t);
      UI.button(front, B.next, t);
      UI.button(front, B.shopReroll, t);
      if (upg('vault')) { UI.button(front, B.deposit, t); UI.button(front, B.withdraw, t); }
    } else {
      L.drawPlay(back, front, t);
      drawDiceExtras(front);
      drawFuse(front);
      if (!S.cupDraw) for (const b of [B.roll, B.play]) UI.button(front, b, t);
      if (!S.cupDraw && helpShown()) UI.button(front, B.help, t);
    }
    if (selected) for (const b of selButtons()) UI.button(front, b, t);
    drawMsg(front, t);
    if (S.phase === 'lost' || S.phase === 'runWon') { UI.button(front, B.retry, t); if (profile) UI.button(front, B.home, t); }
    drawJonnyTalk(front, t);
    drawChoice(front, t);
    drawCupDraw(back, front, t);
    drawChaos(front);
    TUT.draw(front, t);
    drawToasts(front);
    drawSong(front);
    drawPeek(front, t);
    if (S.phase !== 'menu') UI.button(front, B.settings, t);
    drawSettings(front, t);
    if (S.choice || settingsOpen || S.cupDraw) { tips = []; return; }
    if (MOBILE) drawTipsTouch(front); else drawTips(front);
  }

  // ── Einstellungen: Palette, Hintergrund, Schrift, CRT ──────────────────
  // Gespeichert in localStorage. Paletten: ui/palettes.js, Hintergründe: BalatroFX.BG_STYLES.
  const BASE_PALETTE = Object.assign({}, P);
  const PALETTES = window.WG_PALETTES || [];
  const BG_STYLES = FX.BG_STYLES || [{ id: 'swirl', name: 'Swirl (Original)' }];
  const FONTS = [
    { id: 'wuerfel', name: 'Wuerfel Pixel', css: "'Wuerfel Pixel', 'Pixelify Sans', monospace" },
    { id: 'pixelify', name: 'Pixelify Sans', css: "'Pixelify Sans', 'Courier New', monospace" },
  ];
  // Gewählter Look: Felt & Brass, Lava, Pixelify Sans. SETTINGS_VERSION erhöhen, um gespeicherte Werte einmalig zu verwerfen.
  const SETTINGS_VERSION = 2;
  // Lautstärken in Prozent (0–100); volScale markiert das neue Format (früher 0–10)
  const SETTINGS = { v: SETTINGS_VERSION, palette: 'felt', background: 'lava', font: 'pixelify', crt: true, master: 100, music: 70, sfx: 90, volScale: 100,
    voice: 100, songTitles: true, muteBg: false, shake: 'full', particles: 'full', speed: 1, tipDelay: 1, textSpeed: 1, jonnyTalk: 'normal' };
  const CHOICES = {
    palette: () => PALETTES.filter((x) => !x.secret || open('palette', x.id)).map((x) => [x.id, x.name]),
    background: () => BG_STYLES.map((x) => [x.id, x.name]),
    font: () => FONTS.map((x) => [x.id, x.name]),
    crt: () => [[true, 'On'], [false, 'Off']],
    songTitles: () => [[true, 'On'], [false, 'Off']],
    muteBg: () => [[false, 'Off'], [true, 'On']],
    shake: () => [['full', 'Full'], ['reduced', 'Reduced'], ['off', 'Off']],
    particles: () => [['full', 'Full'], ['reduced', 'Reduced'], ['minimal', 'Minimal']],
    fullscreen: () => [[false, 'Off'], [true, 'On']],
    speed: () => [[1, 'Normal'], [1.4, 'Fast'], [1.8, 'Very fast']],
    tipDelay: () => [[1.5, 'Slow'], [1, 'Normal'], [0.5, 'Fast'], [0.15, 'Instant']],
    textSpeed: () => [[0.7, 'Slow'], [1, 'Normal'], [1.6, 'Fast'], [40, 'Instant']],
    jonnyTalk: () => [['normal', 'Normal'], ['less', 'Less'], ['off', 'Off']],
  };
  const BTN_KEYS = { roll: 'ORANGE', play: 'BLUE', start: 'BLUE', options: 'ORANGE', retry: 'RED', next: 'RED', shopReroll: 'GREEN',
    deposit: 'DEPOSIT', withdraw: 'ORANGE', use: 'GREEN', sell: 'SELL', act: 'PURPLE', settings: 'L_BLACK', close: 'RED',
    quit: 'ORANGE', home: 'L_BLACK', back: 'RED', begin: 'BLUE', cupPrev: 'ORANGE', cupNext: 'ORANGE', tutSlot: 'PURPLE', tutX: 'RED' };
  let settingsOpen = false;
  let PAL = PALETTES[0];

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem('wg_settings') || '{}');
      if (saved.v === SETTINGS_VERSION) {
        if (saved.volScale !== 100) { ['music', 'sfx'].forEach((k) => { if (saved[k] != null) saved[k] *= 10; }); saved.volScale = 100; }
        Object.assign(SETTINGS, saved);
      }
    } catch (e) { /* Standardwerte */ }
    const q = location.search;
    for (const k of ['palette', 'background', 'font']) { const m = q.match(new RegExp('[?&]' + k + '=([\\w-]+)')); if (m) SETTINGS[k] = m[1]; }
  }
  function saveSettings() { try { localStorage.setItem('wg_settings', JSON.stringify(SETTINGS)); } catch (e) { /* ohne Speicher weiter */ } }
  const isFullscreen = () => !!document.fullscreenElement;
  const settingValue = (key) => (key === 'fullscreen' ? isFullscreen() : SETTINGS[key]);
  const settingName = (key) => { const c = CHOICES[key]().find((x) => x[0] === settingValue(key)); return c ? c[1] : '?'; };
  function changeSetting(key, dir) {
    if (key === 'fullscreen') {   // nicht gespeichert: Browser erlauben Vollbild nur nach einem Klick
      const req = isFullscreen() ? document.exitFullscreen() : document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
      if (req && req.catch) req.catch(() => {});
      return;
    }
    const list = CHOICES[key](), i = list.findIndex((x) => x[0] === SETTINGS[key]);
    SETTINGS[key] = list[(i + dir + list.length) % list.length][0];
    saveSettings(); applySettings();
  }

  function applySettings() {
    // Palette: Grundfarben zurücksetzen, dann die gewählte Palette darüberlegen
    PAL = PALETTES.find((x) => x.id === SETTINGS.palette && (!x.secret || open('palette', x.id))) || PALETTES[0];
    Object.assign(P, BASE_PALETTE, PAL.colours);
    for (const [k, key] of Object.entries(BTN_KEYS)) B[k].colour = P[key];
    BUY.forEach((b) => { b.colour = P.BLUE; });
    SET_BTNS.forEach((b) => { b.colour = b.action ? P.RED : P.BLUE; });
    B.trophies.colour = darken(P.GOLD, 0.2);
    Object.assign(TYPE_COL, { constellation: P.PLANET, oracle: P.TAROT, die: P.GREEN });
    // Hintergrund-Stil, Schrift, CRT
    if (eng.setBackgroundStyle) eng.setBackgroundStyle(SETTINGS.background);
    UI.FONT = (FONTS.find((x) => x.id === SETTINGS.font) || FONTS[0]).css;
    eng.crt.enabled = !!SETTINGS.crt;
    eng.timeScale = +SETTINGS.speed || 1;
    TIP_DELAY = +SETTINGS.tipDelay || 1;
    applyVolumes();
    refreshBg();
  }
  // Lautstärke: Regler (0–100 %) werden quadratisch in Pegel umgerechnet, das entspricht eher dem Gehör (50 % ≈ -12 dB)
  const amp = (pct) => Math.pow(Math.max(0, Math.min(100, pct || 0)) / 100, 2);
  let unfocused = false;
  function applyVolumes() {
    const master = SETTINGS.muteBg && unfocused ? 0 : amp(SETTINGS.master);
    Sound.setVolume('master', master);
    Sound.setVolume('sfx', amp(SETTINGS.sfx));
    Sound.setVolume('music', Music.ok ? 0 : amp(SETTINGS.music));
    Music.setVolume(master * amp(SETTINGS.music));
  }
  window.addEventListener('blur', () => { unfocused = true; applyVolumes(); });
  window.addEventListener('focus', () => { unfocused = false; applyVolumes(); });
  // Bildschirmwackeln und Partikel nach Einstellung abschwächen
  const SHAKE_F = { full: 1, reduced: 0.45, off: 0 }, PARTICLE_F = { full: 1, reduced: 0.5, minimal: 0.2 };
  const baseShake = eng.shake.bind(eng), baseEmit = eng.emit.bind(eng);
  eng.shake = (a = 6) => { const f = SHAKE_F[SETTINGS.shake]; if (f === undefined || f > 0) baseShake(a * (f === undefined ? 1 : f)); };
  eng.emit = (x, y, o = {}) => {
    const f = PARTICLE_F[SETTINGS.particles] || 1;
    if (f >= 1) return baseEmit(x, y, o);
    const n = o.count !== undefined ? o.count : 14;
    return baseEmit(x, y, Object.assign({}, o, { count: Math.max(1, Math.round(n * f)) }));
  };
  // Aktions-Zeilen (zweimal klicken zum Bestätigen)
  function settingAction(key, b) {
    if (key === 'reset') {
      if (!confirmed(b)) return;
      try { localStorage.removeItem('wg_meta'); } catch (e) { /* ohne Speicher weiter */ }
      Saves.reloadMeta();
      if (ACH) ACH.ensure(meta());
      Saves.saveMeta();
      toasts = [];
      sfx('bust');
      eng.popup(640, 600, 'Progress reset', { colour: P.RED, size: 24, life: 1.6 });
    }
  }
  // Regler ziehen
  let sliderDrag = -1;
  function sliderAt(m) { return setRows().findIndex((r, k) => r.slider && UI.inside(sliderRect(k), m)); }
  function setSlider(k, m) {
    const sg = MOBILE ? mSlider(k) : SLIDER;
    const v = Math.round(clamp((m.x - sg.x) / sg.w, 0, 1) * 20) * 5;
    if (SETTINGS[setRows()[k].key] === v) return;
    SETTINGS[setRows()[k].key] = v;
    applyVolumes();
    if (['master', 'music', 'sfx', 'voice'].every((key) => !SETTINGS[key])) secret('silence');
  }
  // Hintergrund der aktuellen Situation in den Farben der Palette
  let bgName = 'menu';
  function setBg(name, opts = {}) {
    bgName = name;
    const d = PAL.bg[name];
    if (d.c1) eng.setBackground(d, opts);
    else eng.setBackgroundColour(d.base, Object.assign({ special: d.special, contrast: d.contrast }, opts));
  }
  function refreshBg() {
    if (!PAL) return;
    if (bgName === 'table' && isBossBlind() && S.boss && ['rolling', 'select', 'scoring'].includes(S.phase)) eng.setBackgroundColour(S.boss.colour, { contrast: 2 });
    else setBg(bgName, { spin: 0.6 });
  }

  // ── Bildschirm: Speicherplätze ──────────────────────────────────────────
  const fmtTime = (sec) => { const m = Math.floor(sec / 60); return m >= 60 ? Math.floor(m / 60) + 'h ' + (m % 60) + 'm' : m + ' min'; };
  const fmtDate = (ms) => { const d = new Date(ms); return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); };
  function drawSlots(back, front, t) {
    if (MOBILE) return drawSlotsMobile(back, front, t);
    UI.dynaText(front, 'Choose a Save', 640, 66, { size: 56, time: t, wave: 2.5, colour: P.GOLD });
    const st = meta().stats, cups = Object.values(meta().cups || {}).reduce((a, n) => a + n, 0);
    const line = 'Runs won ' + st.wins + ' / ' + st.runs + '   ·   Best stage ' + (st.bestStage ? st.bestStage + ' / ' + ANTES : '-') + '   ·   Best hand ' + (st.bestHand ? UI.num(st.bestHand) : '-') +
      '   ·   Cups ' + cups + '   ·   Play time ' + fmtTime(meta().playTime);
    UI.text(front, line, 640, 106, { size: 17, colour: P.TEXT_SOFT });
    slotData.forEach((d, k) => {
      const x = SLOT_X(k), y = 136, w = SLOT_W, h = 458, cx = x + w / 2, r = d && d.run;
      const hover = UI.inside({ x, y, w, h }, eng.mouse);
      UI.box(back, x, y, w, h, { colour: P.OVERLAY_SOLID, radius: 16, emboss: 4, outline: hover ? P.GOLD : lighten(P.PANEL, 0.15), outlineWidth: hover ? 3 : 2 });
      UI.text(front, 'Save ' + (k + 1), cx, y + 30, { size: 32, colour: r ? P.WHITE : P.TEXT_LABEL });
      UI.text(front, r ? 'Saved ' + fmtDate(d.updated) : 'Holds one run at a time', cx, y + 58, { size: 14, colour: P.TEXT_DIM });
      const ry = y + 74;
      UI.box(back, x + 14, ry, w - 28, 150, { colour: P.PANEL_DARK, radius: 10, shadow: false });
      const sy = ry + 172;
      if (r) {
        const c = CUPS.find((q) => q.id === r.cup) || CUPS[0];
        const where = r.phase === 'shop' ? 'Shop' : r.blindIdx === 2 ? (R.BOSSES.find((b) => b.id === r.boss) || BLINDS[2]).name : BLINDS[r.blindIdx].name;
        UI.text(front, 'Run in progress', cx, ry + 20, { size: 20, colour: P.GOLD });
        UI.text(front, 'Stage ' + r.ante + '  ·  ' + where, cx, ry + 48, { size: 22 });
        UI.text(front, r.phase === 'shop' ? 'Between rounds' : 'Score ' + UI.num(r.score || 0) + ' / ' + UI.num(r.target || 0), cx, ry + 76, { size: 17, colour: P.TEXT_SOFT });
        const ids = r.relics.map((q) => q.id).filter((id) => R.RELIC_BY_ID[id]), n = Math.min(ids.length, 7);
        if (!n) UI.text(front, 'No relics yet', cx, ry + 114, { size: 15, colour: P.TEXT_DIM });
        ids.slice(0, 7).forEach((id, i) => {
          const ix = cx + (i - (n - 1) / 2) * 36;
          UI.box(front, ix - 16, ry + 98, 32, 32, { colour: darken(R.RELIC_BY_ID[id].colour, 0.1), radius: 6, shadow: false });
          Icons.draw(front, id, ix, ry + 114, 26);
        });
        if (ids.length > 7) UI.text(front, '+' + (ids.length - 7), x + w - 24, ry + 114, { size: 15, colour: P.TEXT_SOFT });
        [['Cup', c.name], ['Money', r.money < 0 ? '-$' + -r.money : '$' + r.money], ['Dice in bag', r.bag.length],
          ['Upgrades', (r.upgrades || []).length], ['Run time', fmtTime(r.time || 0)]].forEach(([a, b], i) => {
          UI.text(front, a, x + 24, sy + i * 23, { size: 17, colour: P.TEXT_LABEL, align: 'left' });
          UI.text(front, String(b), x + w - 24, sy + i * 23, { size: 17, align: 'right' });
        });
      } else {
        UI.text(front, 'Empty', cx, ry + 62, { size: 26, colour: P.TEXT_LABEL });
        UI.text(front, 'Start a new run here', cx, ry + 94, { size: 16, colour: P.TEXT_DIM });
        front.imageSmoothingEnabled = false;
        front.drawImage(faceEntry({ v: k + 1, kind: 'normal' }, 'standard').canvas, cx - 40, sy - 14, 80, 80);
      }
    });
    if (tutorialSeen()) drawTutorialCard(back, front, t);
    for (const b of slotButtons()) UI.button(front, b, t);
    UI.button(front, B.back, t);
  }
  // Tutorial-Platz: Jonny, wie oft gespielt, wenigste Fehler
  function drawTutorialCard(back, front, t) {
    const { x, y, w, h } = TUT_CARD, cx = x + w / 2, st = tutorialStats();
    const hover = UI.inside(TUT_CARD, eng.mouse);
    UI.box(back, x, y, w, h, { colour: P.OVERLAY_SOLID, radius: 16, emboss: 4, outline: hover ? P.GOLD : lighten(P.PURPLE, 0.1), outlineWidth: hover ? 3 : 2 });
    UI.text(front, 'Tutorial', cx, y + 30, { size: 32, colour: lighten(P.PURPLE, 0.45) });
    UI.text(front, st.runs ? 'Replay it any time' : 'Learn the basics', cx, y + 58, { size: 14, colour: P.TEXT_DIM });
    if (TUT.portrait) TUT.portrait(front, cx - 60, y + 78, 120 / 64, hover ? 'excited' : st.runs ? 'smug' : 'nervous', t);
    const sy = y + 240;
    UI.text(front, 'with Jonny, your', cx, sy, { size: 17, colour: P.TEXT_SOFT });
    UI.text(front, 'slightly nervous dice tutor', cx, sy + 22, { size: 17, colour: P.TEXT_SOFT });
    [['Played', st.runs ? st.runs + (st.runs === 1 ? ' time' : ' times') : 'never'], ['Fewest mistakes', st.best === null ? '-' : String(st.best)]].forEach(([a, b], i) => {
      UI.text(front, a, x + 22, sy + 50 + i * 24, { size: 17, colour: P.TEXT_LABEL, align: 'left' });
      UI.text(front, b, x + w - 22, sy + 50 + i * 24, { size: 17, align: 'right' });
    });
    UI.button(front, B.tutSlot, t);
  }

  // ── Bildschirm: Becher-Auswahl (Platzhalter) ────────────────────────────
  function drawCups(back, front, t) {
    if (MOBILE) return drawCupsMobile(back, front, t);
    UI.dynaText(front, 'Choose your ' + CUP_WORD, 640, 70, { size: 56, time: t, wave: 2.5, colour: P.GOLD });
    const hint = cupList.length > 1 ? 'Drawn cups are used up when you start a run with them' : 'Beat the Showdown of Stage ' + CUP_DRAW_STAGE + ' to draw 3 random cups, each good for one run';
    UI.text(front, 'Save ' + (slot + 1) + '  ·  ' + hint, 640, 112, { size: 17, colour: P.TEXT_SOFT });
    // Lichtkegel unter dem gewählten Becher
    const sx = cupX(cupSel);
    back.save(); back.globalAlpha = 0.5 + 0.15 * Math.sin(t * 2);
    UI.box(back, sx - 76, 360, 152, 22, { colour: P.GOLD, radius: 11, shadow: false });
    back.restore();
    const owned = ownedCups();
    cupSprites.forEach((sp, i) => {
      const c = cupAt(i), x = cupX(i);
      if (Math.abs(i - cupSel) > 2) return;
      UI.text(front, c.name, x, 404, { size: i === cupSel ? 20 : 16, colour: i === cupSel ? P.WHITE : P.TEXT_SOFT });
      // Anzahl als Plakette über dem Becher
      const always = c.id === 'classic' || c.jonny;
      const label = always ? 'Always' : 'x' + owned[c.id], ty = i === cupSel ? 180 : 226;
      front.font = UI.font(16);
      const w = front.measureText(label).width + 20;
      UI.box(front, x - w / 2, ty - 12, w, 24, { colour: always ? P.PANEL_DARK : darken(P.GOLD, 0.45), radius: 12, shadow: false, outline: always ? undefined : P.GOLD, outlineWidth: 2 });
      UI.text(front, label, x, ty, { size: 16, colour: always ? P.TEXT_SOFT : P.GOLD });
    });
    // Beschreibung
    const c = cupAt(cupSel), x = 330, y = 428, w = 620, h = 166;
    UI.box(back, x, y, w, h, { colour: P.OVERLAY_SOLID, radius: 14, emboss: 4, outline: c ? c.colour : P.GREY, outlineWidth: 2 });
    UI.text(front, c ? c.name : 'Coming soon', 640, y + 26, { size: 30, colour: c ? lighten(c.colour, 0.35) : P.TEXT_LABEL });
    const desc = c ? c.desc : '';
    UI.box(back, x + 12, y + 46, w - 24, 62, { colour: '#FFFFFF', radius: 8, shadow: false });
    wrapText(front, desc, w - 60, 19).slice(0, 3).forEach((ln, i, arr) => drawLine(front, ln, 640, y + 77 + (i - (arr.length - 1) / 2) * 21, 19, false));
    if (c) {
      const chips = [['Dice', c.bag.length, P.CHIPS], ['Hands', c.hands, P.BLUE], ['Rerolls', c.rerolls, P.ORANGE], ['Money', '$' + c.money, P.GOLD_TEXT],
        ['Relics', c.relics.length + (c.randomRelics ? c.randomRelics.n : 0) + (c.jonny ? 1 : 0), '#E07A2E']];
      chips.forEach(([a, b, col], i) => {
        const cx = 640 + (i - 2) * 118;
        UI.box(front, cx - 54, y + 118, 108, 36, { colour: P.PANEL_DARK, radius: 8, shadow: false, outline: col, outlineWidth: 2 });
        UI.text(front, a + ' ' + b, cx, y + 136, { size: 18 });
      });
    }
    for (const b of [B.cupPrev, B.cupNext, B.begin, B.back]) UI.button(front, b, t);
  }

  // Tasten-Übersicht (Reiter Controls)
  const CONTROLS = [
    ['Enter', 'Play hand  ·  start  ·  continue'], ['R', 'Reroll the dice you are not holding'], ['1 - 6', 'Hold or release a die'],
    ['Mouse', 'Click dice to hold, drag relics to reorder'], ['Hover', 'Keep still to pin a tooltip and read more'],
    ['Space', 'Next line while Jonny talks'], ['N', 'Skip the current song'], ['O', 'Open or close the settings'], ['Esc', 'Close  ·  go back'],
  ];
  function drawSettings(ctx, t) {
    if (!settingsOpen) return;
    if (MOBILE) return drawSettingsMobile(ctx, t);
    dim(ctx, 0.5);
    UI.box(ctx, 340, 84, 600, 576, { colour: P.OVERLAY_SOLID, radius: 18, outline: P.GOLD, outlineWidth: 3 });
    UI.dynaText(ctx, 'Settings', 640, 118, { size: 40, colour: P.GOLD, time: t, wave: 2 });
    for (const b of SET_TAB_BTNS) UI.button(ctx, b, t);
    const tab = SET_TABS[setTab];
    if (tab.id === 'controls') {
      CONTROLS.forEach(([key, what], i) => {
        const y = 230 + i * 34;
        UI.box(ctx, 380, y - 14, 104, 28, { colour: P.PANEL, radius: 7, emboss: 3 });
        UI.text(ctx, key, 432, y, { size: 18 });
        UI.text(ctx, what, 504, y, { size: 18, colour: P.TEXT_SOFT, align: 'left' });
      });
    }
    tab.rows.forEach((r, k) => {
      const y = SET_Y(k);
      UI.box(ctx, 366, y - 21, 548, 42, { colour: P.PANEL, radius: 10, emboss: 2 });
      UI.text(ctx, r.label, 386, y, { size: 21, colour: P.TEXT_LABEL, align: 'left' });
      if (r.action) return;
      if (!r.slider) { UI.text(ctx, settingName(r.key), 770, y, { size: 21, colour: P.WHITE }); return; }
      // Regler: Bahn, gefüllter Teil, Griff, Prozentwert
      const v = SETTINGS[r.key] || 0, kx = SLIDER.x + (v / 100) * SLIDER.w, hot = sliderDrag === k || UI.inside(sliderRect(k), eng.mouse);
      UI.box(ctx, SLIDER.x, y - 5, SLIDER.w, 10, { colour: P.PANEL_DARK, radius: 5, shadow: false });
      if (v > 0) UI.box(ctx, SLIDER.x, y - 5, Math.max(10, kx - SLIDER.x), 10, { colour: P.BLUE, radius: 5, shadow: false });
      UI.box(ctx, kx - 11, y - 15, 22, 30, { colour: hot ? P.GOLD : P.WHITE, radius: 7, emboss: 3 });
      UI.text(ctx, v ? v + '%' : 'Off', 878, y, { size: 21, colour: v ? P.WHITE : P.TEXT_DIM });
    });
    for (const b of setBtnsNow()) UI.button(ctx, b, t);
    UI.button(ctx, B.close, t);
    if (!inMenus()) UI.button(ctx, B.quit, t);
    const hint = !inMenus() && B.quit.disabled ? 'Saving is possible once the dice have settled'
      : tab.id === 'game' ? 'Jonny chatter: his comments in the shop and during runs. Reset clears trophies and unlocks.'
        : '[O] Settings   [Esc] Close   [N] Skip song   [H] advanced FX sliders';
    UI.text(ctx, hint, 640, 634, { size: 14, colour: P.TEXT_DIM });
  }

  // ── Gerade laufender Song: kurz unten rechts, sobald ein neuer beginnt ([N] oder Klick überspringt) ──
  const SONG = { in: 0.45, hold: 5, out: 0.5, w: 330, h: 70 };
  let songRel = null, songInfo = null, songT0 = -99;
  const nowSec = () => performance.now() / 1000;
  function trackSong() {
    const pl = Music.ok ? Music.playing : null;
    if (pl && pl.track !== songRel && pl.volume > 0.001) { songRel = pl.track; songInfo = Music.title(pl.track); songT0 = nowSec(); }
  }
  function songK() {
    if (!SETTINGS.songTitles || !songInfo) return 0;
    const age = nowSec() - songT0;
    if (age < 0 || age > SONG.in + SONG.hold + SONG.out) return 0;
    if (age < SONG.in) return FX.Ease.outCubic(age / SONG.in);
    if (age > SONG.in + SONG.hold) return 1 - FX.Ease.inCubic((age - SONG.in - SONG.hold) / SONG.out);
    return 1;
  }
  function songRect() {
    const k = songK();
    if (k <= 0) return null;
    if (MOBILE) { const v = viewBox(), w = SONG.w * SONG_K, h = SONG.h * SONG_K; return { x: v.r + 8 - k * (w + 20), y: 720 - h - 12, w, h }; }
    return { x: 1280 + 8 - k * (SONG.w + 20), y: 720 - SONG.h - 14, w: SONG.w, h: SONG.h };
  }
  let skipLog = [];
  function skipSong() {
    if (!Music.ok || !Music.skip()) return;
    sfx('card');
    const now = nowSec();
    skipLog = skipLog.filter((x) => now - x < 120).concat(now);
    if (skipLog.length >= 10) secret('tough_crowd');
  }
  // Note als Pixel-Symbol (7x9)
  const NOTE = ['...XXXX', '...X..X', '...X..X', '...X..X', '...X..X', '.XXX.XX', 'XXXXXXX', 'XXX.XX.', '.X.....'];
  function drawSong(ctx) {
    const r = songRect();
    if (!r) return;
    if (MOBILE) return drawSongMobile(ctx, r);
    const { x, y, w, h } = r;
    UI.box(ctx, x, y, w, h, { colour: P.OVERLAY_SOLID, radius: 12, emboss: 3, outline: UI.inside(r, eng.mouse) ? P.GOLD : lighten(P.PANEL, 0.25), outlineWidth: 2 });
    const bob = Math.sin(nowSec() * 5) * 1.5;
    ctx.fillStyle = P.GOLD;
    NOTE.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') ctx.fillRect(x + 16 + i * 4, y + 17 + bob + j * 4, 4, 4); }));
    UI.text(ctx, 'Now playing', x + 58, y + 16, { size: 13, colour: P.TEXT_DIM, align: 'left' });
    UI.text(ctx, '[N] Skip', x + w - 14, y + 16, { size: 13, colour: P.TEXT_DIM, align: 'right' });
    UI.text(ctx, songInfo.title, x + 58, y + 38, { size: fitText(ctx, songInfo.title, w - 72, 21), align: 'left' });
    const sub = songInfo.album || 'Würfelglück soundtrack';
    UI.text(ctx, sub, x + 58, y + 58, { size: fitText(ctx, sub, w - 72, 13), colour: P.TEXT_SOFT, align: 'left' });
  }

  // ── Jonny im Spiel: Sprüche, Aufträge, Shop, Jonny's Cup, Endboss, Run-Ende ──
  // Jonny redet außerhalb des Tutorials an drei Plätzen: 'corner' (unten links, kurz eingeblendet), 'shop' (hinter der
  // Theke, der letzte Satz bleibt stehen) und 'end' (Kommentar zum Run-Ende). Einstellung "Jonny chatter": Normal / Less / Off.
  const JONNY_GOLD = '#E7B23C';
  const JS = { q: [], cur: null, last: -99, rect: null, shopT: 0, nudged: false };
  const JONNY_PLACES = {
    corner: { face: { x: 22, y: 584, s: 1.6 }, box: { x: 150, y: 598, w: 560, h: 88 }, k: 0.9, fit: true },
    shop: { face: { x: 344, y: 462, s: 1.2 }, box: { x: 448, y: 466, w: 318, h: 72 }, k: 0.74 },
    end: { face: { x: 342, y: 574, s: 1.75 }, box: { x: 484, y: 584, w: 766, h: 108 }, k: 1, fit: true },
  };
  const jPlace = (name) => (L.jonny && L.jonny[name]) || JONNY_PLACES[name];
  const talkMode = () => SETTINGS.jonnyTalk || 'normal';
  const say1 = (pool) => [R.pick(pool)];
  // lines: Text oder Liste aus [Stimmung, Text]. o: place, mood, chance, important (auch bei "Less"), always (auch bei "Off"),
  //        replace (sofort, Warteschlange leeren), gap (Mindestabstand in Sekunden zum letzten Spruch)
  function jonnySay(lines, o = {}) {
    if (TUT.active || !TUT.makeLine) return false;
    const mode = talkMode();
    if (mode === 'off' && !o.always) return false;
    let chance = o.chance === undefined ? 1 : o.chance;
    if (mode === 'less' && !o.important && !o.always) chance *= 0.35;
    if (Math.random() >= chance) return false;
    if (!o.important && o.gap && eng.time - JS.last < o.gap) return false;
    const list = typeof lines === 'string' ? [[o.mood || 'neutral', lines]] : lines;
    let place = o.place || (S.phase === 'shop' ? 'shop' : ['lost', 'runWon'].includes(S.phase) ? 'end' : 'corner');
    if (place === 'shop' && L.jonny && L.jonny.shopTransient) place = 'corner';
    // Veraltete Sätze verfallen; ein Satz mit gleichem key (z. B. 'rule') ersetzt den wartenden
    const ttl = o.ttl || (o.important ? 14 : 7);
    const items = list.map(([mood, text]) => ({ place, key: o.key, until: eng.time + ttl, line: TUT.makeLine(text, mood) }));
    if (o.key) JS.q = JS.q.filter((x) => x.key !== o.key);
    if (o.replace) { JS.q = items; if (JS.cur) JS.cur.done = true; } else JS.q.push(...items);
    if (!JS.cur || JS.cur.done) nextJonny();
    JS.last = eng.time;
    return true;
  }
  function nextJonny() {
    const it = JS.q.shift();
    if (!it) return;
    const keep = JS.cur && JS.cur.place === it.place && !(JS.cur.place === 'corner' && JS.cur.outT);
    JS.cur = { place: it.place, line: it.line, t0: keep ? JS.cur.t0 : eng.time, typedAt: 0, done: false, outT: 0 };
  }
  function jonnyClear() { JS.q = []; JS.cur = null; JS.rect = null; }
  const placeFits = (place) => (place === 'shop' ? S.phase === 'shop' : place === 'end' ? ['lost', 'runWon'].includes(S.phase) : !inMenus());
  function updateJonny(dt) {
    if (inMenus()) { if (JS.cur || JS.q.length) jonnyClear(); return; }
    JS.q = JS.q.filter((x) => placeFits(x.place) && eng.time < x.until);
    // Im Shop: lange nichts gekauft -> Jonny drängelt einmal
    if (S.phase === 'shop' && !S.choice && !settingsOpen && !JS.nudged && eng.time - JS.shopT > 24) {
      JS.nudged = true;
      jonnySay(say1(SHOP_TALK.nudge), { chance: 0.8 });
    }
    const c = JS.cur;
    if (!c) return;
    if (!placeFits(c.place)) { JS.cur = null; if (JS.q.length) nextJonny(); return; }
    c.line.more = JS.q.length > 0;
    TUT.tickLine(c.line, dt);
    if (c.line.shown < c.line.chars) return;
    if (!c.typedAt) c.typedAt = eng.time;
    const hold = JS.q.length ? 0.9 + c.line.chars * 0.022 : (c.place === 'corner' ? 1.4 : 1.2) + c.line.chars * 0.03;
    if (JS.q.length) { if (eng.time - c.typedAt > hold) nextJonny(); return; }
    if (c.place !== 'corner') { c.done = true; return; }
    if (!c.outT && eng.time - c.typedAt > hold) { c.done = true; c.outT = eng.time; }
    if (c.outT && eng.time - c.outT > 0.3) JS.cur = null;
  }
  // Klick auf die Blase oder Leertaste: fertig tippen, sonst weiter
  function advanceJonny() {
    const c = JS.cur;
    if (!c) return false;
    if (c.line.shown < c.line.chars) { c.line.shown = c.line.chars; return true; }
    if (JS.q.length) { nextJonny(); return true; }
    if (c.place === 'corner' && !c.outT) { c.done = true; c.outT = eng.time; }
    return true;
  }
  const jonnyHit = (m) => !!(JS.cur && JS.rect && UI.inside(JS.rect, m));
  // Im Shop steht Jonny immer hinter der Theke; sonst nur, wenn er etwas sagt
  function drawJonnyTalk(ctx, t) {
    JS.rect = null;
    const c = JS.cur;
    const counter = S.phase === 'shop' && !TUT.active && TUT.face && !(L.jonny && L.jonny.shopTransient);
    if (counter && (!c || c.place !== 'shop')) {
      const f = jPlace('shop').face;
      TUT.face(ctx, f.x, f.y, f.s, eng.time - JS.shopT > 24 ? 'bored' : 'neutral', t, false);
    }
    if (!c) return;
    const p = jPlace(c.place);
    let face = p.face, box = p.box;
    if (c.place === 'corner') {
      const k = Math.min(1, (eng.time - c.t0) / 0.3) * (1 - (c.outT ? Math.min(1, (eng.time - c.outT) / 0.3) : 0));
      const dy = (1 - FX.Ease.outCubic(Math.max(0, k))) * 170;
      face = Object.assign({}, face, { y: face.y + dy }); box = Object.assign({}, box, { y: box.y + dy });
    }
    JS.rect = TUT.drawSpeech(ctx, t, c.line, face, box, { k: p.k || 1, tag: c.place !== 'shop', fit: p.fit });
  }

  // ── Jonnys Aufträge: im Shop steht immer einer für die nächste Runde, erledigt gibt es Geld am Rundenende ──
  // kind: count (Fortschritt durch Ereignisse), avoid (scheitert bei einem Verstoß, sonst am Ende erledigt), end (am Ende geprüft)
  const JOB_HANDS = [['Two Pair', 0], ['Three of a Kind', 1], ['Small Straight', 1], ['Full House', 2], ['Four of a Kind', 3], ['Large Straight', 3]];
  const skullFacesInBag = () => S.bag.reduce((a, d) => a + d.faces.filter(R.isSkull).length, 0);
  const JOBS = [
    { id: 'hand', make: () => { const [h, d] = R.pick(JOB_HANDS); return { text: 'Play a ' + h, hand: h, goal: 1, d }; }, hand: (j, e) => !e.bust && e.name === j.hand },
    { id: 'twice', need: (n) => n >= 3, make: () => { const [h, d] = R.pick([['Pair', 0], ['Two Pair', 1], ['Three of a Kind', 2]]); return { text: 'Play ' + (h === 'Pair' ? 'a Pair' : h) + ' twice', hand: h, goal: 2, d }; },
      hand: (j, e) => !e.bust && e.name === j.hand },
    { id: 'big', make: () => { const x = Math.max(10, Math.round((S.target * 0.4) / 10) * 10); return { text: 'Score ' + UI.num(x) + ' with one hand', x, goal: 1, d: 1 }; },
      hand: (j, e) => e.total >= j.x },
    { id: 'calm', make: () => ({ text: 'Play a hand without rerolling', goal: 1, d: 0 }), hand: (j, e) => e.rerolls === 0 && !e.bust },
    { id: 'hold3', make: () => ({ text: 'Play a hand while holding 3 or more dice', goal: 1, d: 0 }), hand: (j, e) => e.held >= 3 },
    { id: 'pair', make: () => { const v = 4 + Math.floor(Math.random() * 3); return { text: 'Score two ' + v + 's in one hand', v, goal: 1, d: 1 }; },
      hand: (j, e) => !e.bust && e.vals.filter((x) => x === j.v).length >= 2 },
    { id: 'variety', need: (n) => n >= 3, make: () => ({ text: 'Play 3 different hand types', goal: 3, d: 1, seen: [] }),
      hand: (j, e) => { if (e.bust || j.seen.includes(e.name)) return 0; j.seen.push(e.name); return 1; } },
    { id: 'lucky', need: (n, luckNow) => luckNow >= 15, make: () => ({ text: 'Get 2 Lucky Hits', goal: 2, d: 1 }), reroll: (j, e) => e.lucky },
    { id: 'skull', need: (n, l, skulls) => skulls > 0, make: () => ({ text: 'Score a hand with a Skull in it', goal: 1, d: 1 }), hand: (j, e) => !e.bust && e.skulls > 0 },
    { id: 'frugal', kind: 'avoid', make: () => { const x = Math.max(2, Math.round(rerollsMax() * handsMax() * 0.35)); return { text: 'Use ' + x + ' rerolls or fewer', x, goal: 1, d: 1 }; },
      reroll: (j) => (S.rerollsBlind > j.x ? 'fail' : 0) },
    { id: 'nopair', kind: 'avoid', make: () => ({ text: 'Never play a Pair or a Chance', goal: 1, d: 1 }), hand: (j, e) => (['Pair', 'Chance'].includes(e.name) ? 'fail' : 0) },
    { id: 'quick', kind: 'end', need: (n) => n >= 3, make: () => ({ text: 'Win with 2 or more hands left', goal: 1, d: 2 }), end: () => S.hands >= 2 },
    { id: 'overkill', kind: 'end', make: () => ({ text: 'Finish at 1.5x the target', goal: 1, d: 2 }), end: () => S.score >= S.target * 1.5 },
  ];
  const JOB_BY_ID = Object.fromEntries(JOBS.map((d) => [d.id, d]));
  const jobReward = (d) => (2 + Math.ceil(S.ante / 2) + (d || 0)) * (cup().jonny ? 2 : 1);
  // Neuer Auftrag beim Betreten des Shops (für die nächste Runde). Vor Jonnys Showdown gibt es keinen.
  function newJob() {
    if (TUT.active || (isBossBlind() && S.boss === JONNY_BOSS)) return null;
    const n = handsMax(), lk = luck(), sk = skullFacesInBag(), last = S.jonny.lastJob;
    const pool = JOBS.filter((d) => d.id !== last && (!d.need || d.need(n, lk, sk)));
    const def = R.pick(pool), j = def.make();
    S.jonny.lastJob = def.id;
    return Object.assign(j, { id: def.id, kind: def.kind || 'count', n: 0, status: 'open', reward: jobReward(j.d) });
  }
  function jobEvent(kind, e) {
    const j = S.job, def = j && JOB_BY_ID[j.id];
    if (!def || j.status !== 'open' || !def[kind] || TUT.active || !['rolling', 'select', 'scoring'].includes(S.phase)) return;
    const r = def[kind](j, e);
    if (r === 'fail') { j.status = 'failed'; jobFailed(); return; }
    if (!r || j.kind !== 'count') return;
    j.n = Math.min(j.goal, j.n + (r === true ? 1 : r));
    if (j.n >= j.goal) { j.status = 'done'; jobDone(); }
  }
  const jobSpot = () => (L.jobSpot ? L.jobSpot() : [1080, 556]);
  function jobDone() {
    const [x, y] = jobSpot();
    eng.popup(x, y, 'Job done!', { colour: P.GREEN, size: 22, life: 1.4 });
    eng.emit(x, y, { count: 18, colours: [JONNY_GOLD, P.GREEN, '#FFFFFF'], speed: 300, size: 8, life: 0.6, shape: 'star' });
    sfx('chime');
    jonnySay(say1(cup().jonny ? CUP_TALK.jobDone : JOB_TALK.done), { chance: cup().jonny ? 0.9 : 0.5, gap: 3 });
  }
  function jobFailed() {
    const [x, y] = jobSpot();
    eng.popup(x, y, 'Job failed', { colour: P.GREY, size: 20, life: 1.2 });
    sfx('deny');
    jonnySay(say1(JOB_TALK.failed), { chance: cup().jonny ? 0.9 : 0.4, gap: 3 });
  }
  // Rundenende: Auftrag abrechnen, gibt die Belohnung zurück
  function jobSettle() {
    const j = S.job;
    S.job = null;
    if (!j || TUT.active) return 0;
    const def = JOB_BY_ID[j.id];
    if (j.status === 'open' && j.kind === 'avoid') j.status = 'done';
    if (j.status === 'open' && j.kind === 'end') j.status = def.end(j) ? 'done' : 'failed';
    if (j.status !== 'done') { S.jonny.failed++; return 0; }
    S.jonny.jobs++;
    achieve('job');
    return j.reward;
  }
  // Zeile unter dem Spielfeld während einer Runde
  function jobLine() {
    const j = S.job;
    if (!j || TUT.active || !['rolling', 'select', 'scoring', 'won'].includes(S.phase)) return null;
    if (j.status === 'done') return { text: "Jonny's job done:  " + j.text + '  ·  +$' + j.reward + ' after the round', colour: P.GREEN };
    if (j.status === 'failed') return { text: "Jonny's job failed:  " + j.text, colour: P.TEXT_DIM };
    const prog = j.kind === 'count' && j.goal > 1 ? '  (' + j.n + '/' + j.goal + ')' : j.kind === 'avoid' ? '  (so far so good)' : '';
    return { text: "Jonny's job:  " + j.text + prog + '  ·  +$' + j.reward, colour: JONNY_GOLD };
  }
  // Auftrags-Karte im Shop (r.h < 56: eine Zeile, z. B. auf dem Handy)
  function drawJob(ctx, r) {
    if (TUT.active) return;
    const j = S.job;
    UI.box(ctx, r.x, r.y, r.w, r.h, { colour: P.PANEL_DARK, radius: 10, emboss: 3, outline: j ? JONNY_GOLD : P.GREY, outlineWidth: 2 });
    if (r.h < 56) {
      const tx = j ? "Jonny's job: " + j.text + '  ·  +$' + j.reward : 'No job this time. Next round, the job is beating Jonny.';
      UI.text(ctx, tx, r.x + r.w / 2, r.y + r.h / 2, { size: fitText(ctx, tx, r.w - 20, 20), colour: j ? JONNY_GOLD : P.TEXT_SOFT });
      return;
    }
    UI.text(ctx, "JONNY'S JOB", r.x + 10, r.y + 13, { size: 13, colour: JONNY_GOLD, align: 'left' });
    if (!j) {
      UI.text(ctx, 'No job this time.', r.x + r.w / 2, r.y + 38, { size: 15, colour: P.TEXT_SOFT });
      UI.text(ctx, 'The job is beating me.', r.x + r.w / 2, r.y + 58, { size: 15, colour: P.TEXT_SOFT });
      return;
    }
    const pay = '+$' + j.reward;
    ctx.font = UI.font(17);
    const pw = ctx.measureText(pay).width + 14;
    UI.box(ctx, r.x + r.w - pw - 6, r.y + 4, pw, 20, { colour: P.MONEY, radius: 6, shadow: false });
    UI.text(ctx, pay, r.x + r.w - pw / 2 - 6, r.y + 14, { size: 17, colour: P.BLACK, shadow: false });
    wrapPlain(ctx, j.text, r.w - 20, 15).slice(0, 2).forEach((ln, i) => UI.text(ctx, ln, r.x + 10, r.y + 38 + i * 18, { size: 15, align: 'left' }));
    UI.text(ctx, 'next round', r.x + r.w - 10, r.y + r.h - 9, { size: 11, colour: P.TEXT_DIM, align: 'right' });
  }

  // ── Shop: Jonny hinter der Theke, Jonny's Special ──
  const sellPrice = (item) => (item.noRefund ? 0 : R.sellValue(item));
  // Ab und zu ein Relikt zum halben Preis, mit verstecktem Haken (erst nach dem Kauf sichtbar)
  const CATCHES = ['none', 'cursed', 'cursed', 'tax', 'tax', 'nosell', 'nosell'];
  function maybeSpecial(force) {
    if (TUT.active || !S.shop || (!force && Math.random() >= (cup().jonny ? 0.6 : 0.3))) return null;
    const k = R.pick([0, 1, 2]);
    const taken = new Set(S.relics.map((r) => r.id).concat(S.shop.filter((x, j) => x && j !== k && x.type === 'relic').map((x) => x.id)));
    const pool = R.RELICS.filter((d) => !d.hidden && !taken.has(d.id) && d.id !== 'crossroads' && open('relic', d.id));
    if (!pool.length) return null;
    const w = { C: 0.3, U: 1, R: 1.2, L: 0.4 };
    const id = R.pickWeighted(pool.map((d) => [d.id, w[d.rarity]]));
    const cost = R.RELIC_BY_ID[id].cost;
    S.shop[k] = { type: 'relic', id, price: Math.max(2, Math.ceil(cost / 2)), was: cost, special: R.pick(CATCHES) };
    if (shopSprites[k]) shopSprites[k].dissolveOut(0.3);
    shopSprites[k] = shopSprite(S.shop[k], k);
    return k;
  }
  function specialBought(it, owned) {
    let c = it.special;
    if (c === 'cursed' && S.bag.length >= bagMax()) c = 'tax';
    if (c === 'cursed') { S.bag.push(R.makeDie('cursed')); refreshBag(); const b = bagSprites[bagSprites.length - 1]; if (b) b.juiceUp(0.6); }
    if (c === 'tax') S.jonny.cut += 4;
    if (c === 'nosell') owned.noRefund = true;
    owned.specialVisit = S.jonny.visit;
    achieve('special');
    JS.shopT = eng.time;
    const said = jonnySay(SHOP_TALK.catch[c], { important: true, replace: true });
    if (!said) {   // Jonny ist stumm geschaltet: den Haken trotzdem zeigen
      const note = { none: 'No catch!', cursed: '+1 Cursed Die', tax: 'Jonny keeps $4 next round', nosell: 'Non-refundable' }[c];
      showMsg("Jonny's Special", JONNY_GOLD, note, 2);
    }
  }
  function shopHello() {
    JS.shopT = eng.time; JS.nudged = false;
    const last = S.jonny.last, lines = [];
    if (last && last.boss && last.boss !== 'Jonny') lines.push(['happy', 'You beat {g|' + last.boss + '}! I never liked them.']);
    else if (last && last.score <= last.target * 1.05) lines.push(['nervous', "That round was {s|close}. My heart can't take this."]);
    else if (last && last.score >= last.target * 2.5) lines.push(['smug', '{g|' + fmtX(Math.floor((last.score / last.target) * 10) / 10) + 'x} the target. {q|Show-off.}']);
    else lines.push(R.pick(SHOP_TALK.hello));
    const intro = profile && !meta().jonnyJobs;
    if (intro && S.job) { meta().jonnyJobs = 1; lines.push(['neutral', 'See that card? A {g|job}. Do it next round and I pay you.']); }
    else if (S.shop && S.shop.some((x) => x && x.special)) lines.push(R.pick(SHOP_TALK.special));
    else if (!S.job && S.boss === JONNY_BOSS) lines.push(['smug', 'Next round is {g|me}. {q|Buy something nice for your funeral.}']);
    else if (Math.random() < 0.3 && S.job) lines.push(R.pick(SHOP_TALK.job));
    jonnySay(lines, { replace: true, important: intro });
  }
  function shopBought(it) {
    JS.shopT = eng.time;
    let line;
    if (it.type === 'relic') {
      const d = R.RELIC_BY_ID[it.id], tag = d.tags[0];
      if (tag) S.jonny.tags[tag] = (S.jonny.tags[tag] || 0) + 1;
      if (SHOP_TALK.mine[it.id]) line = SHOP_TALK.mine[it.id];
      else if (d.rarity === 'L') line = ['shocked', "{b|LEGENDARY.} I'm not jealous. {s|At all.}"];
      else if (tag && S.jonny.tags[tag] >= 3 && Math.random() < 0.6) line = ['annoyed', 'Ugh, {g|' + R.TAGS[tag].name + '} again? {q|Predictable.}'];
      else if (d.rarity === 'R' && Math.random() < 0.5) line = ['excited', 'Ooh, a {g|Rare}! Careful, it bites.'];
      else line = R.pick(SHOP_TALK.tags[tag || 'none']);
    } else if (it.type === 'die') line = it.dieType === 'cursed' ? ['shocked', 'A {g|Cursed Die}? On {s|purpose}?'] : R.pick(SHOP_TALK.die);
    else line = R.pick(SHOP_TALK[it.type] || SHOP_TALK.die);
    jonnySay([line], { replace: true, chance: 0.75 });
  }
  function shopSold(item) {
    JS.shopT = eng.time;
    if (item.specialVisit && item.specialVisit === S.jonny.visit) secret('buyers_remorse');
    jonnySay(say1(SHOP_TALK.sell), { replace: true, chance: 0.7 });
  }
  function shopRerolled() {
    JS.shopT = eng.time;
    S.jonny.rerolls++;
    const pool = SHOP_TALK.reroll[Math.min(2, S.jonny.rerolls - 1)];
    jonnySay(say1(pool), { replace: true, chance: S.jonny.rerolls === 1 ? 0.5 : 0.7 });
  }
  function shopBroke() { jonnySay(say1(SHOP_TALK.broke), { replace: true, gap: 5, chance: 0.7 }); }

  // ── Jonny's Cup: er spielt mit, kommentiert und würfelt einmal pro Runde gratis für dich ──
  const helpShown = () => cup().jonny && !TUT.active && ['rolling', 'select', 'scoring'].includes(S.phase);
  // Beste Würfel zum Halten: probiert alle Kombinationen und würfelt den Rest ein paar Dutzend Mal aus
  // (alle Varianten benutzen dieselben Probewürfe, damit Zufall nicht eine schlechte Wahl begünstigt)
  function bestHold(samples = 48) {
    const n = dice.length, faces = dice.map(upFace);
    const opts = { gap: has('gap_jumper'), skullWild: has('hex_bag'), bustAt: bustAt() };
    const fixed = dice.map((d) => frozen(d));
    const rolls = Array.from({ length: samples }, () => dice.map((d) => R.pick(d.data.die.faces)));
    let best = null;
    for (let mask = 0; mask < 1 << n; mask++) {
      if (fixed.some((f, i) => f && !(mask & (1 << i)))) continue;
      let sum = 0;
      if (mask === (1 << n) - 1) sum = R.evaluateFaces(faces, S.levels, opts).est * samples;
      else for (let s = 0; s < samples; s++) sum += R.evaluateFaces(faces.map((f, i) => (mask & (1 << i) ? f : rolls[s][i])), S.levels, opts).est;
      if (!best || sum > best.sum) best = { mask, sum };
    }
    return dice.map((_, i) => !!(best.mask & (1 << i)));
  }
  function jonnyHelp() {
    if (S.phase !== 'select' || S.jonny.help || !cup().jonny) return;
    const hold = bestHold();
    if (hold.every(Boolean)) { jonnySay(say1(CUP_TALK.perfect), { important: true, replace: true }); return; }
    S.jonny.help = true; S.jonny.helps++;
    dice.forEach((d, i) => { d.data.held = hold[i]; if (!hold[i]) d.data.anchored = false; d.juiceUp(0.3); });
    sfx('hold', { on: true });
    layoutDice();
    jonnySay(say1(CUP_TALK.help), { important: true, replace: true });
    eng.after(0.55, () => reroll({ jonny: true }));
  }
  function jonnyRoundStart() {
    if (!cup().jonny) return;
    const n = (S.ante - 1) * BLINDS.length + S.blindIdx + 1;
    jonnySay([R.pick([['excited', 'Round {g|' + n + "}! Let's go. {q|You go. I watch.}"], ['neutral', "Okay. Focus. {q|I'm focusing for both of us.}"],
      ['paranoid', 'This round feels {s|suspicious}. {q|They all do.}']])], { chance: 0.55, gap: 3 });
  }
  function jonnyReroll(lucky) {
    if (!cup().jonny || (S.boss === JONNY_BOSS && isBossBlind())) return;
    if (lucky) eng.after(0.9, () => jonnySay(say1(CUP_TALK.lucky), { chance: 0.5, gap: 4 }));
    else if (S.rerollsHand === 4) jonnySay(say1(CUP_TALK.shaking), { chance: 0.6, gap: 4 });
  }
  function jonnyLastHand() {
    if (S.boss === JONNY_BOSS && isBossBlind()) jonnySay(say1(BOSS_TALK.lastHand), { chance: 0.8, gap: 2 });
    else if (cup().jonny) jonnySay(say1(CUP_TALK.last), { chance: 0.6, gap: 3 });
  }
  // Nach jeder gewerteten Hand (Jonny's Cup und Jonnys Showdown)
  function jonnyHand(res, total) {
    const boss = S.boss === JONNY_BOSS && isBossBlind();
    if (!boss && !cup().jonny) return;
    const won = S.score >= S.target, ratio = total / Math.max(1, S.target);
    if (boss) {
      if (won) return;   // dazu sagt er in winBlind etwas
      if (res.bust) jonnySay(say1(BOSS_TALK.bust), { important: true, replace: true, key: 'hand' });
      else if (ratio >= 0.35) jonnySay(say1(BOSS_TALK.big), { key: 'hand', chance: 0.9, replace: true });
      else jonnySay(say1(BOSS_TALK.low), { key: 'hand', chance: 0.6, gap: 3 });
      return;
    }
    if (res.bust) jonnySay(say1(CUP_TALK.bust), { important: true, replace: true, key: 'hand' });
    else if (res.name === 'Five of a Kind') jonnySay(say1(CUP_TALK.five), { important: true, replace: true, key: 'hand' });
    else if (won) jonnySay(say1(CUP_TALK.win), { key: 'hand', chance: 0.8, replace: true });
    else if (ratio >= 0.5) jonnySay(say1(CUP_TALK.big), { key: 'hand', chance: 0.8, replace: true });
    else if (res.name === 'Chance') jonnySay(say1(CUP_TALK.chance), { key: 'hand', chance: 0.7, gap: 3 });
    else if (ratio < 0.12) jonnySay(say1(CUP_TALK.small), { key: 'hand', chance: 0.5, gap: 5 });
    else jonnySay(say1(CUP_TALK.good), { key: 'hand', chance: 0.35, gap: 6 });
  }

  // ── Endboss Jonny ──
  const jonnyBoss = () => S.boss === JONNY_BOSS && isBossBlind() && S.ante <= ANTES;
  function jonnyNewRule() {
    const pool = R.BOSSES.filter((b) => !b.factor && b.id !== S.jonnyRule);
    const b = R.pick(pool);
    S.jonnyRule = b.id;
    if (S.played.length) {
      eng.popup(L.msg.x, dieY() - 130, 'New rule: ' + b.name, { colour: lighten(b.colour, 0.35), size: 26, life: 1.8 });
      sfx('boss');
    }
    jonnySay(say1(RULE_TALK[b.id]), { important: true, key: 'rule', ttl: 9 });
  }
  function jonnyIntro() {
    jonnySay(cup().jonny ? BOSS_TALK.introCup : BOSS_TALK.intro, { important: true, replace: true, always: true });
  }
  // Stimmung des Kopfes neben seinem Namen: je näher am Ziel, desto nervöser
  function jonnyBossMood() {
    if (S.phase === 'shop') return 'smug';
    const r = S.score / Math.max(1, S.target);
    return r >= 0.75 ? 'paranoid' : r >= 0.4 ? 'nervous' : S.hands <= 1 ? 'excited' : 'smug';
  }
  function drawJonnyHead(ctx, x, y, size) {
    if (!TUT.head) return;
    const img = TUT.head(jonnyBossMood(), eng.time % 3.3 < 0.12);
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, x, y + Math.sin(eng.time * 2) * 1.5, size, size);
    ctx.restore();
  }

  // ── Run-Ende: Jonny bewertet den Run ──
  function jonnyEnd(won) {
    if (TUT.active) return;
    jonnySay(endLines(won), { place: 'end', important: true, replace: true, ttl: 60 });
  }
  function endLines(won) {
    const st = Math.min(S.ante, ANTES), j = S.jonny, lines = [];
    if (won) {
      if (S.boss === JONNY_BOSS) lines.push(BOSS_TALK.defeat[1]);
      lines.push(cup().jonny ? ['excited', '{w|WE} did it! Mostly me. {q|Okay. Mostly you.}'] : ['smug', 'All ' + ANTES + ' stages. You beat {g|me}. Not bad. {q|For you.}']);
      if (j.jobs >= 5) lines.push(['happy', 'And ' + j.jobs + " of my jobs. You're hired. {q|Unpaid, obviously.}"]);
      else if (j.best >= 100000) lines.push(['shocked', 'That {g|' + UI.num(j.best) + "} point hand? I'm telling everyone. {q|Both of my friends.}"]);
      else lines.push(['fourth', 'Seriously. Well played. {q|*ahem*} I said nothing.']);
      return lines;
    }
    if (isBossBlind() && S.boss === JONNY_BOSS) {
      lines.push(['excited', '{b|HA!} The {g|final boss} wins! I {w|knew} it!']);
      lines.push(['smug', "Come back when you've practiced. I'll be here. {q|I'm always here.}"]);
      return lines;
    }
    if (st === 1 && S.blindIdx === 0) lines.push(['disappointed', 'You lost the {g|Warm-up}. The {d|warm-up}.']);
    else if (st <= 2) lines.push(['smug', 'Stage ' + st + '. Not great, not terrible. {q|Mostly not great.}']);
    else if (st <= 4) lines.push(['neutral', 'Stage ' + st + '. Respectable. For a {g|newbie}.']);
    else if (st <= 6) lines.push(['happy', 'Stage ' + st + "! Okay, I'm a {w|little} impressed. {q|Don't tell anyone.}"]);
    else lines.push(['nervous', 'Stage ' + st + '. You almost made it to {g|me}. {q|I had a whole speech ready.}']);
    const missed = Math.max(0, S.target - S.score);
    if (isBossBlind() && S.boss && BOSS_LOSS[S.boss.id]) lines.push(BOSS_LOSS[S.boss.id]);
    else if (S.score >= S.target * 0.85) lines.push(['shocked', 'You missed by {g|' + UI.num(missed) + '}. {s|' + UI.num(missed) + "!} I can't watch."]);
    else if (S.ach.busts >= 3) lines.push(['smug', '{g|' + S.ach.busts + '} Busts. You and skulls should get a room.']);
    else if (cup().jonny) lines.push(['angry', "And I was {w|helping}! Imagine how bad it would've been without me."]);
    else if (S.time < 240) lines.push(['bored', 'That was {g|quick}. {q|Like, really quick.}']);
    else lines.push(R.pick(END_FILLER));
    return lines;
  }
  const BOSS_LOSS = {
    snake: ['paranoid', '{g|The Snake} got you? I never trusted him. {q|No legs. Suspicious.}'],
    clamp: ['smug', '{g|The Clamp}. One reroll and you {d|fell apart}.'],
    frost: ['smug', 'Frozen by {g|The Frost}. {q|Chilling.} Sorry. I had to.'],
    chaos: ['excited', "{g|The Chaos} won. Chaos always wins. {q|That's my motto.}"],
    echo: ['smug', '{g|The Echo}. Same hand, same mistake. {q|Same... same... same...}'],
    wall: ['annoyed', "{g|The Wall}. It's a wall. It doesn't even {s|move}."],
  };
  const END_FILLER = [
    ['neutral', "Try again. Hold better dice. {q|That's the whole secret.}"],
    ['fourth', 'You know you can just press {g|Try Again}, right? {q|*ahem*}'],
    ['smug', 'Next time, buy more relics. {q|From me. Preferably.}'],
  ];

  // ── Sprüche ──
  const SHOP_TALK = {
    hello: [
      ['happy', "Welcome to Jonny's! Everything is {g|legal}. {q|Mostly.}"], ['neutral', 'Hi! Buy something. {q|I have rent.}'],
      ['smug', 'Back again? I knew you would be.'], ['paranoid', "Psst. Don't touch the stuff under the counter."],
      ['excited', "Fresh stock! {w|Smell} that? That's {g|relic} smell."], ['fourth', 'Do you think this shop is real? {q|*ahem*} Welcome!'],
    ],
    special: [['paranoid', "Psst. {g|Jonny's Special}. Half price. {q|Don't ask about the catch.}"], ['smug', "See the {g|Special}? Half price. {q|Totally no catch.}"]],
    job: [['smug', 'Got another {g|job} for you. {q|Cash. No questions.}'], ['neutral', 'Do the {g|job}, get paid. Simple. {q|Like you.}']],
    nudge: [['bored', 'Are you buying, or just {g|breathing} on the glass?'], ['fourth', '{q|Hello? Did you go get snacks?}'], ['annoyed', "I close in five minutes. {q|I don't. But hurry.}"]],
    sell: [['annoyed', 'Selling my stuff back to me? {s|Bold.}'], ['smug', "I'll sell that to the next person for {g|double}."]],
    broke: [['smug', "No money? I take... no. I don't take anything else."], ['disappointed', 'Window shopping. {d|Classic.}']],
    reroll: [
      [['annoyed', 'Not good enough for you?'], ['neutral', 'New stuff. {q|Same old me.}']],
      [['annoyed', 'Again? I {s|just} put those out!']],
      [['angry', '{s|Fine.} New stuff. {q|Happy now?}'], ['furious', 'Do you know how {s|heavy} these shelves are?!']],
    ],
    die: [['bored', 'A die. {d|Riveting.}'], ['neutral', 'More dice, more problems. {q|Good problems.}']],
    upgrade: [['happy', 'An upgrade! Finally something {g|sensible}.']],
    constellation: [['smug', 'Stars! {q|Nerd.} I mean that as a compliment.']],
    oracle: [['paranoid', 'Oracles work on {g|held} dice. {q|Not on me. Please.}']],
    tally: [['excited', 'Number levels. {w|Beautiful} math.']],
    tags: {
      bank: [['smug', 'Bank build. Saving for something? {q|A personality?}']],
      number: [['excited', 'Numbers! My favourite. {q|After dice. And dinosaurs.}']],
      pattern: [['smug', 'Patterns. I respect patterns. {q|I AM a pattern.}']],
      luck: [['smug', 'Luck. The strategy of people without one.']],
      risk: [['nervous', 'Skulls again? You need a {g|safer} hobby.']],
      reroll: [['annoyed', 'More rerolls. Shake shake shake. {q|My wrists hurt.}']],
      hold: [['happy', "Holding dice. {g|Commitment}! I've heard of that."]],
      bag: [['neutral', 'Bigger bag. {g|Bigger} problems.']],
      growth: [['neutral', 'Growth! Patience pays. {q|Eventually. Allegedly.}']],
      none: [['smug', 'That one is... flexible. {q|Like my morals.}']],
    },
    mine: {
      jonny_glasses: ['shocked', 'Those are MY {g|glasses}! {q|That explains the blur.}'],
      off_record: ['paranoid', '{g|Off the Record}? {s|Shh.} We never talked about this.'],
      mood_ring: ['angry', "My {g|Mood Ring}! It's always on {s|furious}. {q|Weird.}"],
      jonny_autograph: ['excited', 'My {g|autograph}! I {w|knew} it was worth something!'],
    },
    catch: {
      none: [['shocked', "No catch! I'm being {w|nice}."], ['paranoid', "{q|Don't tell anyone.}"]],
      cursed: [['smug', 'It came with a {g|Cursed Die}. Package deal. {q|No refunds.}']],
      tax: [['smug', 'Tiny thing: I keep {g|$4} of your next round reward. {q|Fine print.}']],
      nosell: [['smug', 'Also: {g|non-refundable}. It sells for $0. {q|Fine print.}']],
    },
  };
  const JOB_TALK = {
    done: [['happy', 'Job done! You get paid after the round. {q|Probably.}'], ['smug', 'Nice work. {q|I could have done it faster.}']],
    failed: [['disappointed', 'Job failed. {d|I believed in you.} For a second.'], ['annoyed', 'That was the {g|one} thing I asked.']],
  };
  const CUP_TALK = {
    lucky: [['excited', "Lucky! {q|I'm taking credit.}"], ['happy', "{w|Lucky!} Told you. {q|I didn't. But I thought it.}"]],
    shaking: [['annoyed', "Stop shaking them. You'll {s|wake} the dice."]],
    bust: [['angry', '{r|BUST!} The skulls have {s|faces}! You can {g|see} them!'], ['disappointed', "Skulls. Again. {d|I can't watch.}"]],
    five: [['excited', "{b|FIVE OF A KIND!} I'm framing this!"]],
    win: [['happy', "That's the round! {q|We make a good team.}"], ['smug', 'Round done. {g|Teamwork.} {q|Mostly my work.}']],
    big: [['excited', '{w|Huge!} Did you see that number?!'], ['shocked', 'Who taught you that? {q|Oh right. Me.}']],
    chance: [['disappointed', "A {g|Chance}? We talked about this. {q|We didn't. But still.}"]],
    small: [['smug', 'That was a hand. {q|Technically.}'], ['annoyed', "Hm. I would've held the {g|other} dice."]],
    good: [['happy', "Nice! {q|Not as nice as mine would've been.}"], ['neutral', 'Solid. {g|Solid.} I like solid.']],
    last: [['nervous', "Last hand. I can't look. {q|I'm looking.}"]],
    help: [['smug', 'Watch and learn. I keep {g|these}, you roll the rest.'], ['excited', 'Jonny to the rescue! {q|Hold still.}']],
    perfect: [['smug', "Don't touch {g|anything}. It's perfect already."]],
    jobDone: [['excited', 'Job done! See? {w|Teamwork.}'], ['happy', "That's my job! {q|I mean your job. Our job.}"]],
  };
  const BOSS_TALK = {
    intro: [['smug', 'Surprise! The {g|final boss} is me. It was {w|always} going to be me.'], ['excited', 'I wrote the rules. So I get to {s|change} them. {b|Every. Single. Hand.}']],
    introCup: [['smug', "Did you think I'd go easy on you? I'm the {g|final boss}! {q|Nothing personal.}"], ['nervous', '{q|...Okay, a little personal. Good luck. Not too much luck.}']],
    bust: [['excited', "{b|HA!} Skulls! I didn't even {g|do} anything!"]],
    big: [['nervous', "That's... fine. {s|Totally} fine. {q|I'm sweating.}"], ['paranoid', 'Who taught you that? {q|Oh no. It was me.}']],
    low: [['smug', "Is that all? {q|I've seen tutorial players do better.}"], ['smug', "{w|Cute.} Do it again. {q|Please don't.}"]],
    lastHand: [['excited', 'Last hand! I can {w|taste} victory. {q|It tastes like nachos.}']],
    defeat: [['shocked', 'No. {s|No no no.} I {b|wrote} those rules!'], ['disappointed', "Fine. You win. {q|I'll go practice my autograph.}"]],
  };
  const RULE_TALK = {
    snake: [['smug', '{g|The Snake}: your 1s are worth nothing. {q|Like my opinion, apparently.}']],
    clamp: [['excited', '{g|The Clamp}! One reroll per hand. Choose {w|wisely}.']],
    frost: [['smug', '{g|The Frost}. Your 6s are frozen. {q|Brrr.}']],
    chaos: [['paranoid', '{g|The Chaos}. Even held dice might roll. {s|Trust no one.}']],
    echo: [['smug', '{g|The Echo}. Every hand type counts only once. {q|Once. Once. Once.}']],
  };

  // ── Easter Eggs und Secrets ─────────────────────────────────────────────
  // Jonnys Kopf schwebt selten durch den Hintergrund (alle 15 s eine Chance von 1 zu 40, also etwa alle 10 Minuten).
  // Gesehen = Secret, angeklickt = noch eins.
  const FLOAT = { every: 15, chance: 1 / 40, dur: 18, size: 104 };
  let floatHead = null, floatClock = performance.now() / 1000;
  function spawnHead() {
    floatHead = { t0: nowSec(), dir: Math.random() < 0.5 ? 1 : -1, y0: 150 + Math.random() * 380, spin: (Math.random() - 0.5) * 0.5,
      mood: R.pick(['happy', 'smug', 'nervous', 'excited', 'paranoid']), seen: false, caught: 0 };
  }
  function headPos(h) {
    const age = nowSec() - h.t0, k = age / FLOAT.dur, s = FLOAT.size;
    const x0 = h.dir > 0 ? -s : 1280 + s, x1 = h.dir > 0 ? 1280 + s : -s;
    let x = x0 + (x1 - x0) * k, y = h.y0 + Math.sin(age * 1.1) * 34;
    if (h.caught) { const c = nowSec() - h.caught; y -= c * c * 900; x += h.dir * c * 260; }
    return { x, y, rot: Math.sin(age * 0.8) * 0.35 + h.spin * age };
  }
  function updateHead() {
    const now = nowSec();
    if (!floatHead) {
      if (now - floatClock >= FLOAT.every) { floatClock = now; if (Math.random() < FLOAT.chance) spawnHead(); }
      return;
    }
    const age = now - floatHead.t0;
    if (age > FLOAT.dur || (floatHead.caught && now - floatHead.caught > 1.2)) { floatHead = null; floatClock = now; return; }
    if (!floatHead.seen && age > FLOAT.dur * 0.3) { floatHead.seen = true; secret('jonny_seen'); }
  }
  function drawHead(ctx) {
    if (!floatHead || !TUT.head) return;
    const { x, y, rot } = headPos(floatHead), s = FLOAT.size;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = 0.92; ctx.imageSmoothingEnabled = false;
    ctx.drawImage(TUT.head(floatHead.caught ? 'shocked' : floatHead.mood, nowSec() % 3.1 < 0.12), -s / 2, -s / 2, s, s);
    ctx.restore();
  }
  function headHit(m) {
    if (!floatHead || floatHead.caught) return false;
    const h = headPos(floatHead);
    return Math.hypot(m.x - h.x, m.y - h.y) < FLOAT.size * 0.42;
  }
  function catchHead() {
    const h = headPos(floatHead);
    floatHead.caught = nowSec(); floatHead.seen = true;
    eng.emit(h.x, h.y, { count: 30, colours: [P.GOLD, '#E7B23C', '#FFFFFF'], speed: 380, size: 9, life: 0.8, shape: 'star' });
    eng.popup(h.x, h.y - 64, R.pick(["Hey! I'm on break!", 'You saw nothing!', 'This is MY background!', 'Not the face!', 'How did you click that?!']), { colour: P.GOLD, size: 22, life: 1.8 });
    sfx('lucky');
    secret('jonny_seen');
    secret('jonny_caught');
  }

  // "jonny" tippen: er schaut unten links herein
  let typed = '', typedT = 0, peek = null;
  const NAME = 'jonny';
  function typedName(k) {
    if (!/^[a-z]$/.test(k)) return 0;
    const now = nowSec();
    if (now - typedT > 1.5) typed = '';
    typedT = now;
    typed = (typed + k).slice(-NAME.length);
    for (let n = NAME.length; n >= 1; n--) if (typed.endsWith(NAME.slice(0, n))) return n;
    return 0;
  }
  const PEEK = [
    ['excited', 'You called?'], ['nervous', "I'm on my break. What do you need?"], ['smug', "Need help? I KNEW you'd need help."],
    ['paranoid', "Shh. I'm not supposed to be in here."], ['happy', 'Hi! ...Okay, bye!'], ['shocked', 'How do you know my name?!'],
  ];
  function callJonny() {
    const [mood, text] = R.pick(PEEK);
    peek = { t0: nowSec(), mood, text };
    for (let i = 0; i < 6; i++) eng.after(0.35 + i * 0.07, () => sfx('voice', { f: 560 + Math.random() * 120, mood }));
    secret('call_jonny');
  }
  function drawPeek(ctx, t) {
    if (!peek || !TUT.portrait) return;
    const age = nowSec() - peek.t0, D = 4;
    if (age > D) { peek = null; return; }
    const k = age < 0.35 ? FX.Ease.outCubic(age / 0.35) : age > D - 0.35 ? 1 - (age - (D - 0.35)) / 0.35 : 1;
    const sc = 1.6, size = 64 * sc, x = 30, y = 720 - k * (size + 44);
    TUT.portrait(ctx, x, y, sc, peek.mood, t);
    if (age < 0.4) return;
    ctx.font = UI.font(18);
    const w = ctx.measureText(peek.text).width + 36, bx = x + size + 22, by = y + 22;
    UI.box(ctx, bx, by, w, 46, { colour: '#FFFFFF', radius: 12 });
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(bx, by + 18); ctx.lineTo(bx - 12, by + 26); ctx.lineTo(bx, by + 32); ctx.fill();
    UI.text(ctx, peek.text, bx + w / 2, by + 23, { size: 18, colour: P.BLACK, shadow: false });
  }

  // Konami-Code im Hauptmenü
  const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
  let konamiAt = 0;
  function konamiKey(k) {
    konamiAt = k === KONAMI[konamiAt] ? konamiAt + 1 : k === KONAMI[0] ? 1 : 0;
    if (konamiAt < KONAMI.length) return false;
    konamiAt = 0;
    menuDice.forEach((d, i) => {
      d.tex = faceTex({ v: 6, kind: 'gold' }, 'standard'); d.data.v = 6;
      eng.after(i * 0.08, () => { d.juiceUp(0.8); eng.emit(d.x, d.y, { count: 26, colours: [P.GOLD, '#FFFFFF', P.ORANGE], speed: 420, size: 10, life: 0.9, shape: 'star' }); });
    });
    eng.shake(10);
    jingle('fanfare', 3.5);
    eng.popup(640, 300, '+30 LIVES!', { colour: P.GOLD, size: 40, life: 1.6 });
    eng.after(0.9, () => eng.popup(640, 340, '(not really)', { colour: P.TEXT_SOFT, size: 20, life: 1.6 }));
    secret('konami');
    return true;
  }

  // Logo im Hauptmenü anklicken
  const LOGO = { x: 300, y: 115, w: 680, h: 105 };
  const LOGO_LINES = ['Hey.', "That's the logo.", "It doesn't do anything.", 'Seriously.', '...', 'Stop it.', 'STOP IT.', 'Okay, okay!', 'You win.', 'Fine. Have a trophy.',
    'You already have the trophy.', 'There is no second trophy.', '...'];
  let logoClicks = 0;
  function logoClick(m) {
    const line = LOGO_LINES[Math.min(logoClicks, LOGO_LINES.length - 1)];
    logoClicks++;
    eng.popup(m.x, m.y - 30, line, { colour: logoClicks === 10 ? P.GOLD : P.WHITE, size: 20 + Math.min(10, logoClicks), life: 1.3 });
    eng.shake(Math.min(14, 2 + logoClicks));
    sfx(logoClicks === 10 ? 'chime' : 'card');
    if (logoClicks >= 10) secret('logo');
  }

  // Menü-Würfel anklicken würfelt sie neu; fünf gleiche = Secret
  function rollMenuDie(sp) {
    const v = 1 + Math.floor(Math.random() * 6);
    sp.data.v = v;
    sp.tex = faceTex({ v, kind: 'normal' }, 'standard');
    sp.juiceUp(0.5);
    sfx('land');
    const vs = menuDice.map((d) => d.data.v);
    if (vs.every((x) => x && x === vs[0])) {
      menuDice.forEach((d) => eng.emit(d.x, d.y, { count: 20, colours: [P.GOLD, '#FFFFFF'], speed: 360, size: 9, life: 0.8, shape: 'star' }));
      eng.popup(640, 300, 'MENU YAHTZEE!', { colour: P.GOLD, size: 36, life: 1.6 });
      sfx('lucky');
      secret('menu_yahtzee');
    }
  }

  // Würfel schlafen ein (siehe update)
  let lastInput = performance.now() / 1000, zzzClock = 0;

  // ── Handy (MOBILE): Touch-Bedienung und eigene Bildschirme ───────────────
  // Tippen = Klick, langer Druck = Tooltip, Tippen auf unterstrichene Begriffe = weitere Erklärung, daneben tippen schließt.
  // Menüs, Einstellungen, Speicherplätze, Becher und Trophäen haben eigene Versionen mit großen Knöpfen.
  // Der PC benutzt nichts aus diesem Abschnitt (außer dim(), das dort genau wie vorher abdunkelt).
  function viewBox() {
    const v = eng.view || { left: 0, right: 1280, top: 0, bottom: 720 };
    return { l: Math.max(-320, v.left), r: Math.min(1600, v.right), t: Math.max(-240, v.top), b: Math.min(960, v.bottom) };
  }
  // Abdunkeln hinter Fenstern; auf dem Handy der ganze sichtbare Bereich
  function dim(ctx, a) {
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,' + a + ')';
    if (MOBILE) { const v = viewBox(); ctx.fillRect(v.l - 10, v.t - 10, v.r - v.l + 20, v.b - v.t + 20); } else ctx.fillRect(0, 0, 1280, 720);
    ctx.restore();
  }
  // Text in Zeilen umbrechen (ohne Lexikon-Begriffe)
  function wrapPlain(ctx, text, maxW, size) {
    ctx.font = UI.font(size);
    const lines = [];
    for (const word of String(text).split(' ')) {
      const cur = lines.length ? lines[lines.length - 1] + ' ' + word : word;
      if (lines.length && ctx.measureText(cur).width > maxW) lines.push(word); else if (lines.length) lines[lines.length - 1] = cur; else lines.push(word);
    }
    return lines;
  }

  // ── Tooltips auf dem Handy ──
  const TS = 1.45;            // Tooltips größer als am PC
  const LONG_PRESS = 0.42;    // Sekunden bis zum Tooltip per langem Druck
  let longPress = null, tipWas = null;
  function openTip(src) {
    if (tipWas !== null && tipWas === src.key) { tips = []; tipWas = null; return; }   // nochmal antippen schließt
    tips = [src]; tipWas = src.key;
    sfx('card');
    TUT.event('tipPinned');
  }
  // Antippen bei offenem Tooltip: Begriff -> nächste Erklärung, in den Tooltip -> tiefere schließen, daneben -> alle schließen
  function touchTipDown(m) {
    tipWas = tips.length ? tips[0].key : null;
    if (!tips.length) return false;
    for (let d = tips.length - 1; d >= 0; d--) {
      const r = tips[d].rect;
      if (!r) continue;
      const hit = r.terms.find((q) => q.term && inRect(q, m, 6));
      if (hit) {
        const next = tips[d + 1];
        tips.length = d + 1;
        if (!next || next.term !== hit.term) { tips.push({ key: 'term:' + hit.term, term: hit.term, anchor: hit }); sfx('card'); }
        return true;
      }
      if (inRect(r, m)) { tips.length = d + 1 < tips.length ? d + 1 : d; return true; }
    }
    tips = [];
    return false;
  }
  function tapSprite(h) {
    if (h._dead) return;
    h.juiceUp(0.3);
    if (h.data.kind === 'bagdie' && actFor(h)) {
      selected = selected === h ? null : h;
      tips = selected === h ? [{ key: h, sprite: h }] : [];
      return;
    }
    if (spriteInfo(h)) openTip({ key: h, sprite: h });
  }
  function tipClamp(x, y, w, h) {
    const v = viewBox();
    return { x: clamp(x, v.l + 6, v.r - 6 - w), y: clamp(y, v.t + 6, v.b - 6 - h) };
  }
  // Am Sprite: darunter (oben liegende Dinge), sonst darüber, sonst daneben (Shop: immer daneben, damit Buy frei bleibt)
  function tipAtSprite(sp, w, h) {
    const hw = (sp.w * sp.s) / 2, hh = (sp.h * sp.s) / 2, v = viewBox(), k = sp.data.kind, sel = sp === selected;
    if (k !== 'shop' && !(sel && k === 'bagdie')) {
      const below = sp.y + hh + (sel ? 96 : 14);
      if (sp.y < 330 && below + h <= v.b - 6) return tipClamp(sp.x - w / 2, below, w, h);
      const above = sp.y - hh - 14 - h;
      if (above >= v.t + 6) return tipClamp(sp.x - w / 2, above, w, h);
    }
    let x = sp.x + hw + 16;
    if (x + w > v.r - 6) x = sp.x - hw - 16 - w;
    return tipClamp(x, sp.y - h / 2, w, h);
  }
  function tipAtRect(r, w, h) {
    const v = viewBox();
    if (r.x > v.r - 330) return tipClamp(r.x - w - 10, r.y + r.h / 2 - h / 2, w, h);   // rechte Spalte: links daneben
    if (r.y + r.h + 10 + h <= v.b - 6) return tipClamp(r.x + r.w / 2 - w / 2, r.y + r.h + 10, w, h);
    if (r.y - 10 - h >= v.t + 6) return tipClamp(r.x + r.w / 2 - w / 2, r.y - 10 - h, w, h);
    return tipClamp(r.x - w - 10, r.y + r.h / 2 - h / 2, w, h);
  }
  function tipBeside(parent, anchor, w, h) {
    const v = viewBox();
    let x = parent.x + parent.w + 10;
    if (x + w > v.r - 6) x = parent.x - w - 10;
    if (x < v.l + 6) return tipAtRect(anchor, w, h);
    return tipClamp(x, anchor.y - 30, w, h);
  }
  function drawTipsTouch(ctx) {
    for (let d = 0; d < tips.length; d++) {
      const p = tips[d];
      if (p.sprite && (p.sprite._dead || p.sprite.dissolve > 0 || !p.sprite.visible)) { tips.length = d; break; }
      const inf = p.info || (p.sprite ? spriteInfo(p.sprite) : termInfo(p.term));
      if (!inf) { tips.length = d; break; }
      const sz = panelSize(ctx, inf), w = sz.w * TS, h = sz.h * TS;
      const pos = d === 0 ? (p.sprite ? tipAtSprite(p.sprite, w, h) : tipAtRect(p.anchor, w, h)) : tipBeside(tips[d - 1].rect, p.anchor, w, h);
      ctx.save(); ctx.translate(pos.x, pos.y); ctx.scale(TS, TS);
      const out = drawPanel(ctx, inf, sz, 0, 0, !p.info, -1, p.term);
      ctx.restore();
      p.rect = { x: pos.x, y: pos.y, w, h, terms: out.terms.map((r) => ({ x: pos.x + r.x * TS, y: pos.y + r.y * TS, w: r.w * TS, h: r.h * TS, term: r.term })) };
    }
  }

  // ── Vollbild und Querformat beim ersten Antippen (Android; iPhone kann kein Vollbild für Webseiten) ──
  let fullTried = false;
  function firstTouch() {
    if (fullTried) return;
    fullTried = true;
    const el = document.documentElement;
    if (document.fullscreenElement || !document.fullscreenEnabled || !el.requestFullscreen) return;
    try {
      const pr = el.requestFullscreen({ navigationUI: 'hide' });
      if (pr && pr.then) pr.then(lockLandscape).catch(() => {});
    } catch (e) { /* ohne Vollbild weiter */ }
  }
  function lockLandscape() {
    try { const o = screen.orientation; if (o && o.lock) o.lock('landscape').catch(() => {}); } catch (e) { /* nicht unterstützt */ }
  }
  document.addEventListener('fullscreenchange', () => { if (MOBILE && document.fullscreenElement) lockLandscape(); });

  // ── Pro Bild: Layout bei Größenänderung, langer Druck, Bildrate ──
  let lastView = '', lastPhase = '';
  const perf = { sum: 0, n: 0, slow: 0, last: 0 };
  function mobileUpdate() {
    const v = eng.view, vk = Math.round(v.left) + ',' + Math.round(v.right) + ',' + Math.round(v.top);
    if (vk !== lastView) { lastView = vk; applyLayout(L.id); }
    if (S.phase !== lastPhase) { lastPhase = S.phase; tips = []; longPress = null; }   // neuer Bildschirm: Tooltips zu
    if (longPress && !longPress.fired && eng.mouse.down && nowSec() - longPress.t0 >= LONG_PRESS) {
      const sp = longPress.sprite;
      if (!sp._dead && !sp.dragging && sp.visible && spriteInfo(sp)) {
        longPress.fired = true; tipWas = null;
        openTip({ key: sp, sprite: sp });
        sp.juiceUp(0.2);
        try { if (navigator.vibrate) navigator.vibrate(10); } catch (e) { /* ohne Vibration */ }
      } else longPress = null;
    }
    adaptQuality();
  }
  // Ruckelt es (unter ~48 Bildern pro Sekunde über 5 Sekunden), wird die Pixeldichte schrittweise gesenkt
  function adaptQuality() {
    const now = performance.now(), dt = now - (perf.last || now);
    perf.last = now;
    if (dt <= 0 || dt > 200 || document.hidden) return;
    perf.sum += dt; perf.n++;
    if (perf.sum < 2500) return;
    const avg = perf.sum / perf.n;
    perf.sum = 0; perf.n = 0;
    if (avg > 21 && eng.dpr > 1.01) {
      if (++perf.slow >= 2) { perf.slow = 0; eng.maxDpr = Math.max(1, eng.dpr - 0.3); eng.resize(); }
    } else perf.slow = 0;
  }

  // ── Knöpfe der Menüs und Fenster: Positionen aus dem sichtbaren Bereich ──
  function mobilePlace() {
    const v = viewBox(), vc = (v.l + v.r) / 2, g = mSetGeom();
    SET_TAB_BTNS.forEach((b, i) => Object.assign(b, { x: g.vc + (i - 1.5) * (g.tabW + 14) - g.tabW / 2, y: 20, w: g.tabW, h: 80, size: 30 }));
    for (const b of SET_BTNS) {
      const q = mSetRow(b.setRow, SET_TABS[b.inTab].rows.length), y = q.y + (q.h - 76) / 2;
      if (b.action) Object.assign(b, { x: q.x + q.w - 236, y, w: 222, h: 76, size: 28 });
      else Object.assign(b, { x: b.dir < 0 ? q.x + q.w - 334 : q.x + q.w - 96, y, w: 86, h: 76, size: 38 });
    }
    if (inMenus()) Object.assign(B.close, { x: vc - 140, y: 606, w: 280, h: 92, size: 34 });
    else { Object.assign(B.close, { x: vc - 300, y: 606, w: 280, h: 92, size: 34 }); Object.assign(B.quit, { x: vc + 20, y: 606, w: 280, h: 92, size: 30 }); }
    const sg = mSlotGeom();
    for (let k = 0; k < 3; k++) {
      Object.assign(SLOT_MAIN[k], { x: sg.x(k) + 14, y: sg.y + 312, w: sg.W - 28, h: 92, size: 32 });
      Object.assign(SLOT_DEL[k], { x: sg.x(k) + 30, y: sg.y + 412, w: sg.W - 60, h: 64, size: 24 });
    }
    Object.assign(B.tutSlot, { x: sg.x(3) + 14, y: sg.y + 312, w: sg.W - 28, h: 92, size: 28 });
    if (S.phase === 'cups') { Object.assign(B.back, { x: vc - 300, y: 612, w: 280, h: 92, size: 34 }); Object.assign(B.begin, { x: vc + 20, y: 612, w: 280, h: 92, size: 34 }); }
    else Object.assign(B.back, { x: vc - 140, y: 612, w: 280, h: 92, size: 34 });
    Object.assign(B.cupPrev, { x: v.l + 24, y: 168, w: 104, h: 124, size: 48 });
    Object.assign(B.cupNext, { x: v.r - 128, y: 168, w: 104, h: 124, size: 48 });
    Object.assign(B.achPrev, { x: vc - 300, y: 612, w: 130, h: 92, size: 44 });
    Object.assign(B.achNext, { x: vc + 170, y: 612, w: 130, h: 92, size: 44 });
    Object.assign(B.collect, { x: L.msg.x - 130, y: 492, w: 260, h: 92, size: 34 });
    CHOICE.forEach((b, k) => Object.assign(b, { x: L.msg.x + (k - 1) * 250 - 112, y: 290, w: 224, h: 88, size: 28 }));
    if (L.tut && L.tut.done) Object.assign(B.tutDone, L.tut.done);
  }

  // ── Einstellungen (Handy): Reiter oben, Zeilen in zwei Spalten, große Pfeile und Regler ──
  function mSetGeom() {
    const v = viewBox(), vc = (v.l + v.r) / 2, pw = Math.min(1440, v.r - v.l - 24);
    return { vc, pw, colW: Math.min(640, (pw - 64) / 2), tabW: Math.min(250, (pw - 40) / 4 - 14) };
  }
  function mSetRow(k, n = setRows().length) {
    const g = mSetGeom();
    if (n <= 4) { const w = Math.min(820, g.pw - 40); return { x: g.vc - w / 2, y: 120 + k * 106, w, h: 96 }; }
    return { x: k < 4 ? g.vc - 12 - g.colW : g.vc + 12, y: 120 + (k % 4) * 106, w: g.colW, h: 96 };
  }
  function mSlider(k) {
    const q = mSetRow(k), x = q.x + 268, w = Math.max(120, q.w - 268 - 116);
    return { x, w, hit: { x: x - 34, y: q.y, w: w + 68, h: q.h } };
  }
  const CONTROLS_TOUCH = [
    ['Tap', 'Hold or release a die, press buttons'], ['Touch & hold', 'Read what a die, relic or item does'],
    ['Tap a word', 'Underlined words in a tooltip explain more'], ['Tap a card', 'Select a relic or consumable to sell or use it'],
    ['Drag', 'Move relics to change their order'], ['Tap Jonny', 'Next line while Jonny talks'], ['Tap the song', 'Skip the current song'],
  ];
  function drawSettingsMobile(ctx, t) {
    dim(ctx, 0.5);
    const g = mSetGeom();
    UI.box(ctx, g.vc - g.pw / 2, 8, g.pw, 704, { colour: P.OVERLAY_SOLID, radius: 18, outline: P.GOLD, outlineWidth: 3 });
    for (const b of SET_TAB_BTNS) UI.button(ctx, b, t);
    const tab = SET_TABS[setTab];
    if (tab.id === 'controls') {
      const w = Math.min(900, g.pw - 40), x = g.vc - w / 2;
      CONTROLS_TOUCH.forEach(([key, what], i) => {
        const y = 140 + i * 64;
        UI.box(ctx, x, y - 24, 200, 48, { colour: P.PANEL, radius: 9, emboss: 3 });
        UI.text(ctx, key, x + 100, y, { size: fitText(ctx, key, 186, 25) });
        UI.text(ctx, what, x + 224, y, { size: fitText(ctx, what, w - 230, 25), colour: P.TEXT_SOFT, align: 'left' });
      });
    }
    const rows = tab.rows;
    rows.forEach((r, k) => {
      const q = mSetRow(k, rows.length), y = q.y + q.h / 2;
      UI.box(ctx, q.x, q.y, q.w, q.h, { colour: P.PANEL, radius: 12, emboss: 3 });
      UI.text(ctx, r.label, q.x + 20, y, { size: fitText(ctx, r.label, r.slider ? 236 : q.w - 360, 28), colour: P.TEXT_LABEL, align: 'left' });
      if (r.action) return;
      if (!r.slider) { const nm = settingName(r.key); UI.text(ctx, nm, q.x + q.w - 172, y, { size: fitText(ctx, nm, 144, 28), colour: P.WHITE }); return; }
      const s = mSlider(k), val = SETTINGS[r.key] || 0, kx = s.x + (val / 100) * s.w, hot = sliderDrag === k;
      UI.box(ctx, s.x, y - 7, s.w, 14, { colour: P.PANEL_DARK, radius: 7, shadow: false });
      if (val > 0) UI.box(ctx, s.x, y - 7, Math.max(14, kx - s.x), 14, { colour: P.BLUE, radius: 7, shadow: false });
      UI.box(ctx, kx - 18, y - 30, 36, 60, { colour: hot ? P.GOLD : P.WHITE, radius: 9, emboss: 3 });
      UI.text(ctx, val ? val + '%' : 'Off', q.x + q.w - 56, y, { size: 26, colour: val ? P.WHITE : P.TEXT_DIM });
    });
    for (const b of setBtnsNow()) UI.button(ctx, b, t);
    UI.button(ctx, B.close, t);
    if (!inMenus()) UI.button(ctx, B.quit, t);
    const hint = !inMenus() && B.quit.disabled ? 'Saving is possible once the dice have settled'
      : tab.id === 'game' ? 'Jonny chatter: his comments in the shop and during runs. Reset clears trophies and unlocks.' : '';
    if (hint) UI.text(ctx, hint, g.vc, 574, { size: fitText(ctx, hint, g.pw - 40, 22), colour: P.TEXT_DIM });
  }

  // ── Speicherplätze (Handy): vier große Karten nebeneinander ──
  function mSlotGeom() {
    const v = viewBox(), vc = (v.l + v.r) / 2, n = tutorialSeen() ? 4 : 3, gap = 16;
    const W = Math.min(340, (v.r - v.l - 32 - (n - 1) * gap) / n), total = n * W + (n - 1) * gap;
    return { x: (k) => vc - total / 2 + k * (W + gap), W, y: 118, h: 480, vc };
  }
  function drawSlotsMobile(back, front, t) {
    const g = mSlotGeom(), v = viewBox();
    UI.dynaText(front, 'Choose a Save', g.vc, 46, { size: 54, time: t, wave: 2.5, colour: P.GOLD });
    const st = meta().stats, cups = Object.values(meta().cups || {}).reduce((a, n) => a + n, 0);
    const line = 'Runs won ' + st.wins + ' / ' + st.runs + '  ·  Best stage ' + (st.bestStage ? st.bestStage + ' / ' + ANTES : '-') + '  ·  Cups ' + cups + '  ·  Play time ' + fmtTime(meta().playTime);
    UI.text(front, line, g.vc, 94, { size: fitText(front, line, v.r - v.l - 40, 22), colour: P.TEXT_SOFT });
    slotData.forEach((d, k) => {
      const x = g.x(k), y = g.y, w = g.W, h = g.h, cx = x + w / 2, r = d && d.run;
      UI.box(back, x, y, w, h, { colour: P.OVERLAY_SOLID, radius: 16, emboss: 4, outline: lighten(P.PANEL, 0.15), outlineWidth: 2 });
      UI.text(front, 'Save ' + (k + 1), cx, y + 34, { size: 38, colour: r ? P.WHITE : P.TEXT_LABEL });
      const sub = r ? 'Saved ' + fmtDate(d.updated) : 'Holds one run at a time';
      UI.text(front, sub, cx, y + 70, { size: fitText(front, sub, w - 24, 19), colour: P.TEXT_DIM });
      const py = y + 90;
      UI.box(back, x + 12, py, w - 24, 206, { colour: P.PANEL_DARK, radius: 10, shadow: false });
      if (r) {
        const c = CUPS.find((q) => q.id === r.cup) || CUPS[0];
        const where = r.phase === 'shop' ? 'Shop' : r.blindIdx === 2 ? (R.BOSSES.find((b) => b.id === r.boss) || BLINDS[2]).name : BLINDS[r.blindIdx].name;
        UI.text(front, 'Run in progress', cx, py + 24, { size: 23, colour: P.GOLD });
        const s1 = 'Stage ' + r.ante + '  ·  ' + where;
        UI.text(front, s1, cx, py + 58, { size: fitText(front, s1, w - 44, 27) });
        const s2 = r.phase === 'shop' ? 'Between rounds' : 'Score ' + UI.num(r.score || 0) + ' / ' + UI.num(r.target || 0);
        UI.text(front, s2, cx, py + 92, { size: fitText(front, s2, w - 44, 21), colour: P.TEXT_SOFT });
        const ids = r.relics.map((q) => q.id).filter((id) => R.RELIC_BY_ID[id]), per = Math.max(1, Math.floor((w - 44) / 44)), n = Math.min(ids.length, per);
        if (!n) UI.text(front, 'No relics yet', cx, py + 136, { size: 19, colour: P.TEXT_DIM });
        ids.slice(0, n).forEach((id, i) => {
          const ix = cx + (i - (n - 1) / 2) * 44;
          UI.box(front, ix - 19, py + 117, 38, 38, { colour: darken(R.RELIC_BY_ID[id].colour, 0.1), radius: 7, shadow: false });
          Icons.draw(front, id, ix, py + 136, 32);
        });
        const s3 = (r.money < 0 ? '-$' + -r.money : '$' + r.money) + '  ·  ' + c.name + '  ·  ' + fmtTime(r.time || 0);
        UI.text(front, s3, cx, py + 182, { size: fitText(front, s3, w - 44, 21), colour: P.TEXT_LABEL });
      } else {
        UI.text(front, 'Empty', cx, py + 40, { size: 32, colour: P.TEXT_LABEL });
        UI.text(front, 'Start a new run here', cx, py + 76, { size: fitText(front, 'Start a new run here', w - 44, 21), colour: P.TEXT_DIM });
        front.imageSmoothingEnabled = false;
        front.drawImage(faceEntry({ v: k + 1, kind: 'normal' }, 'standard').canvas, cx - 44, py + 104, 88, 88);
      }
    });
    if (tutorialSeen()) {
      const x = g.x(3), y = g.y, w = g.W, h = g.h, cx = x + w / 2, ts = tutorialStats();
      UI.box(back, x, y, w, h, { colour: P.OVERLAY_SOLID, radius: 16, emboss: 4, outline: lighten(P.PURPLE, 0.1), outlineWidth: 2 });
      UI.text(front, 'Tutorial', cx, y + 34, { size: 38, colour: lighten(P.PURPLE, 0.45) });
      const sub = ts.runs ? 'Replay it any time' : 'Learn the basics';
      UI.text(front, sub, cx, y + 70, { size: fitText(front, sub, w - 24, 19), colour: P.TEXT_DIM });
      if (TUT.portrait) TUT.portrait(front, cx - 60, y + 94, 120 / 64, ts.runs ? 'smug' : 'nervous', t);
      [['Played', ts.runs ? ts.runs + (ts.runs === 1 ? ' time' : ' times') : 'never'], ['Fewest mistakes', ts.best === null ? '-' : String(ts.best)]].forEach(([a, b], i) => {
        UI.text(front, a, x + 20, y + 246 + i * 28, { size: fitText(front, a, w - 110, 20), colour: P.TEXT_LABEL, align: 'left' });
        UI.text(front, b, x + w - 20, y + 246 + i * 28, { size: 20, align: 'right' });
      });
      UI.button(front, B.tutSlot, t);
    }
    for (const b of slotButtons()) UI.button(front, b, t);
    UI.button(front, B.back, t);
  }

  // ── Becher-Auswahl (Handy) ──
  function drawCupsMobile(back, front, t) {
    const v = viewBox();
    UI.dynaText(front, 'Choose your ' + CUP_WORD, 640, 44, { size: 52, time: t, wave: 2.5, colour: P.GOLD });
    const hint = cupList.length > 1 ? 'Drawn cups are used up when you start a run with them' : 'Beat the Showdown of Stage ' + CUP_DRAW_STAGE + ' to draw 3 random cups, each good for one run';
    const line = 'Save ' + (slot + 1) + '  ·  ' + hint;
    UI.text(front, line, 640, 88, { size: fitText(front, line, v.r - v.l - 40, 21), colour: P.TEXT_SOFT });
    const sx = cupX(cupSel);
    back.save(); back.globalAlpha = 0.5 + 0.15 * Math.sin(t * 2);
    UI.box(back, sx - 80, 300, 160, 22, { colour: P.GOLD, radius: 11, shadow: false });
    back.restore();
    const owned = ownedCups();
    cupSprites.forEach((sp, i) => {
      const c = cupAt(i), x = cupX(i);
      if (Math.abs(i - cupSel) > 2) return;
      UI.text(front, c.name, x, 344, { size: fitText(front, c.name, 190, i === cupSel ? 26 : 20), colour: i === cupSel ? P.WHITE : P.TEXT_SOFT });
      const always = c.id === 'classic' || c.jonny;
      const label = always ? 'Always' : 'x' + owned[c.id], ty = i === cupSel ? 124 : 162;
      front.font = UI.font(20);
      const w = front.measureText(label).width + 24;
      UI.box(front, x - w / 2, ty - 15, w, 30, { colour: always ? P.PANEL_DARK : darken(P.GOLD, 0.45), radius: 15, shadow: false, outline: always ? undefined : P.GOLD, outlineWidth: 2 });
      UI.text(front, label, x, ty, { size: 20, colour: always ? P.TEXT_SOFT : P.GOLD });
    });
    const c = cupAt(cupSel), w = Math.min(820, v.r - v.l - 300), x = 640 - w / 2, y = 370, h = 226;
    UI.box(back, x, y, w, h, { colour: P.OVERLAY_SOLID, radius: 14, emboss: 4, outline: c ? c.colour : P.GREY, outlineWidth: 2 });
    UI.text(front, c ? c.name : 'Coming soon', 640, y + 28, { size: 32, colour: c ? lighten(c.colour, 0.35) : P.TEXT_LABEL });
    UI.box(back, x + 12, y + 52, w - 24, 96, { colour: '#FFFFFF', radius: 8, shadow: false });
    wrapText(front, c ? c.desc : '', w - 60, 23).slice(0, 3).forEach((ln, i, arr) => drawLine(front, ln, 640, y + 100 + (i - (arr.length - 1) / 2) * 28, 23, false));
    if (c) {
      const chips = [['Dice', c.bag.length, P.CHIPS], ['Hands', c.hands, P.BLUE], ['Rerolls', c.rerolls, P.ORANGE], ['Money', '$' + c.money, P.GOLD_TEXT],
        ['Relics', c.relics.length + (c.randomRelics ? c.randomRelics.n : 0) + (c.jonny ? 1 : 0), '#E07A2E']];
      const cw = Math.min(150, (w - 24) / 5 - 8);
      chips.forEach(([a, b, col], i) => {
        const cx = 640 + (i - 2) * (cw + 8);
        UI.box(front, cx - cw / 2, y + 160, cw, 48, { colour: P.PANEL_DARK, radius: 8, shadow: false, outline: col, outlineWidth: 2 });
        UI.text(front, a + ' ' + b, cx, y + 184, { size: fitText(front, a + ' ' + b, cw - 12, 22) });
      });
    }
    for (const b of [B.cupPrev, B.cupNext, B.begin, B.back]) UI.button(front, b, t);
  }

  // ── Trophäen (Handy): 2 Spalten, 4 Zeilen; Antippen einer Belohnung erklärt sie ──
  let trophyHits = [];
  function drawTrophiesMobile(back, front, t) {
    const p = meta();
    if (!ACH) return;
    const v = viewBox(), vc = (v.l + v.r) / 2, sum = ACH.summary(p);
    UI.dynaText(front, 'Achievements', vc, 40, { size: 50, time: t, wave: 2.5, colour: P.GOLD });
    const line = (sum.secrets ? 'Secrets found ' + sum.secrets + '  ·  ' : '') + sum.done + ' / ' + sum.total + ' achievements  ·  ' + sum.items + ' / ' + sum.locked + ' items unlocked  ·  Page ' + (achPage + 1) + ' / ' + achPages();
    UI.text(front, line, vc, 82, { size: fitText(front, line, v.r - v.l - 40, 21), colour: P.TEXT_SOFT });
    const list = ACH.LIST.slice(achPage * ACH_PER_PAGE, (achPage + 1) * ACH_PER_PAGE);
    const W = Math.min(660, (v.r - v.l - 54) / 2), H = 114, x0 = vc - W - 7;
    trophyHits = [];
    list.forEach((a, n) => {
      const x = x0 + (n % 2) * (W + 14), y = 106 + Math.floor(n / 2) * 122, got = ACH.earned(p, a.id), hidden = a.secret && !got;
      const accent = a.secret ? lighten(P.PURPLE, 0.25) : P.GOLD;
      UI.box(back, x, y, W, H, { colour: got ? darken(accent, 0.7) : P.OVERLAY_SOLID, radius: 12, emboss: 3,
        outline: got ? accent : hidden ? darken(P.PURPLE, 0.2) : lighten(P.PANEL, 0.12), outlineWidth: got ? 2 : 1 });
      drawTrophy(front, x + 14, y + 22, 5, got ? accent : hidden ? darken(P.PURPLE, 0.25) : '#59666A');
      const rewards = hidden ? [['?', '?']] : a.rewards, name = hidden ? '???' : a.name, desc = hidden ? 'Secret achievement. Keep poking around.' : a.desc;
      const tilesX = x + W - 10 - rewards.length * 50;
      UI.text(front, name, x + 72, y + 24, { size: fitText(front, name, tilesX - x - 80, 26), colour: got ? P.WHITE : P.TEXT_SOFT, align: 'left' });
      let ds = 20, dl = wrapPlain(front, desc, W - 86, ds);
      while (dl.length > 2 && ds > 14) dl = wrapPlain(front, desc, W - 86, --ds);
      dl.slice(0, 2).forEach((l, i) => UI.text(front, l, x + 72, y + 54 + i * (ds + 3), { size: ds, colour: got ? lighten(accent, 0.35) : P.TEXT_LABEL, align: 'left' }));
      const pr = ACH.progress(p, a);
      if (got) UI.text(front, 'Unlocked ' + fmtDate(p.ach[a.id]) + (a.secret ? '  ·  SECRET' : ''), x + 72, y + 100, { size: 17, colour: P.TEXT_DIM, align: 'left' });
      else if (pr) {
        const bw = 180, k = pr.n / pr.goal;
        UI.box(front, x + 72, y + 94, bw, 12, { colour: P.PANEL_DARK, radius: 6, shadow: false });
        if (k > 0) UI.box(front, x + 72, y + 94, Math.max(12, bw * k), 12, { colour: P.GOLD, radius: 6, shadow: false });
        UI.text(front, UI.num(pr.n) + ' / ' + UI.num(pr.goal), x + 72 + bw + 12, y + 100, { size: 17, colour: P.TEXT_SOFT, align: 'left' });
      }
      rewards.forEach(([kind, id], i) => {
        const r = { x: tilesX + i * 50, y: y + 8, w: 44, h: 44 };
        drawReward(front, kind, id, r.x, r.y, r.w, !got && !hidden);
        if (!hidden) trophyHits.push({ r: { x: r.x - 4, y: r.y - 4, w: r.w + 8, h: r.h + 8 }, kind, id, a, got });
      });
    });
    for (const b of [B.achPrev, B.achNext, B.back]) UI.button(front, b, t);
    drawTipsTouch(front);
  }
  function trophyTap(m) {
    const h = trophyHits.find((q) => UI.inside(q.r, m));
    if (!h) { tips = []; return; }
    const inf = Object.assign({}, rewardInfo(h.kind, h.id));
    inf.sub = h.got ? 'Unlocked' : 'Locked: ' + h.a.name;
    openTip({ key: 'ach:' + h.a.id + ':' + h.kind + ':' + h.id, anchor: h.r, info: inf });
  }

  // ── Fenster im Run (Handy): Crossroads und Cup Draw ──
  function drawChoiceMobile(ctx, t) {
    const X = L.msg.x;
    dim(ctx, 0.45);
    UI.box(ctx, X - 400, 150, 800, 420, { colour: P.OVERLAY_SOLID, radius: 16, outline: P.GOLD, outlineWidth: 3 });
    UI.dynaText(ctx, 'Crossroads', X, 196, { size: 50, colour: P.GOLD, time: t, wave: 2 });
    const tx = 'Choose a tag. You get its strongest relic you do not own yet.';
    UI.text(ctx, tx, X, 246, { size: fitText(ctx, tx, 760, 23), colour: P.TEXT_LABEL });
    CHOICE.forEach((b, k) => {
      const o = S.choice.opts[k];
      if (!o) return;
      UI.button(ctx, b, t);
      const cx = b.x + b.w / 2;
      Icons.tag(ctx, o.tag, cx, b.y + b.h + 34, 40);
      UI.text(ctx, o.def.name, cx, b.y + b.h + 80, { size: fitText(ctx, o.def.name, 236, 23), colour: '#FFFFFF' });
      UI.text(ctx, R.RARITY[o.def.rarity].name, cx, b.y + b.h + 110, { size: 20, colour: lighten(R.RARITY[o.def.rarity].colour, 0.2) });
    });
  }
  function drawCupDrawMobile(back, front, t) {
    const d = S.cupDraw, X = L.msg.x;
    dim(back, 0.45);
    UI.box(back, X - 400, 96, 800, 504, { colour: P.OVERLAY_SOLID, radius: 16, outline: P.GOLD, outlineWidth: 3 });
    UI.dynaText(front, 'Cup Draw!', X, 146, { size: 56, colour: P.GOLD, time: t, wave: 3, pop: Math.min(1, (eng.time - d.t0) * 2) });
    const tx = 'You beat the Stage ' + CUP_DRAW_STAGE + ' Showdown. Each cup can start one run.';
    UI.text(front, tx, X, 194, { size: fitText(front, tx, 760, 22), colour: P.TEXT_LABEL });
    d.ids.forEach((id, k) => {
      const c = CUP_BY_ID[id], cx = X + (k - 1) * 250;
      UI.text(front, c.name, cx, 400, { size: fitText(front, c.name, 236, 26), colour: lighten(c.colour, 0.4) });
      wrapPlain(front, c.short, 230, 19).slice(0, 2).forEach((l, i) => UI.text(front, l, cx, 432 + i * 24, { size: 19, colour: P.TEXT_SOFT }));
    });
    UI.button(front, B.collect, t);
  }

  // ── Gerade laufender Song (Handy): größer, Antippen überspringt ──
  const SONG_K = 1.35;
  function drawSongMobile(ctx, r) {
    const w = SONG.w, h = SONG.h;
    ctx.save(); ctx.translate(r.x, r.y); ctx.scale(SONG_K, SONG_K);
    UI.box(ctx, 0, 0, w, h, { colour: P.OVERLAY_SOLID, radius: 12, emboss: 3, outline: lighten(P.PANEL, 0.25), outlineWidth: 2 });
    const bob = Math.sin(nowSec() * 5) * 1.5;
    ctx.fillStyle = P.GOLD;
    NOTE.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') ctx.fillRect(16 + i * 4, 17 + bob + j * 4, 4, 4); }));
    UI.text(ctx, 'Now playing', 58, 16, { size: 13, colour: P.TEXT_DIM, align: 'left' });
    UI.text(ctx, 'Tap to skip', w - 14, 16, { size: 13, colour: P.TEXT_DIM, align: 'right' });
    UI.text(ctx, songInfo.title, 58, 38, { size: fitText(ctx, songInfo.title, w - 72, 21), align: 'left' });
    const sub = songInfo.album || 'Würfelglück soundtrack';
    UI.text(ctx, sub, 58, 58, { size: fitText(ctx, sub, w - 72, 13), colour: P.TEXT_SOFT, align: 'left' });
    ctx.restore();
  }

  // ── Layouts (ui/layout-*.js) ────────────────────────────────────────────
  // Jedes Layout liefert Positionen (Würfel, Relikte, Beutel, Shop, Knöpfe, Popups) und zeichnet
  // Menü, Rahmen, Spielfeld und Shop. Spiellogik, Karten, Knöpfe und Effekte sind für alle gleich.
  const K = {
    S, R, UI, P, FX, eng, J, B, BLINDS, ANTES, VAULT_MAX, TYPE_COL, TYPE_NAME, darken, lighten, clamp, Icons, menuSub: () => menuSub,
    still: new FX.Juice(),
    dice: () => dice, juiced, area, statBox, dim, tutorial: () => TUT.active, tagChips, tagSummary, setTagRects: (r) => { tagRects = tagRects.concat(r); },
    drawLine, wrapText, faceEntry, fmtMult, money: moneyText, blindLabel, isBossBlind, luck: () => luck(), has, upg,
    anchorCap, bustAt, mostPlayed, relicMax, preview, isBust, bagMax, drawCount, shopLabels, upgradeNote, setOn, fuse: () => fuseView(),
    drawJob, jobLine, jonnyBoss, drawJonnyHead, wrapPlain, fitText, JONNY_GOLD,
  };
  const LAYOUTS = (window.WG_LAYOUTS || []).map((make) => make(K));
  let L = null;
  function applyLayout(id) {
    L = LAYOUTS.find((x) => x.id === id) || LAYOUTS[0];
    if (L.relayout) L.relayout();
    for (const [k, r] of Object.entries(L.buttons)) Object.assign(B[k], r);
    BUY.forEach((b, k) => Object.assign(b, L.buyBtn(k)));
    CHOICE.forEach((b, k) => { b.x = L.msg.x + (k - 1) * 190 - 85; });
    // vorhandene Sprites an die neuen Plätze bringen
    if (S.phase === 'menu') { if (menuDice.length) { for (const s of menuDice) s.remove(); placeMenuDice(); } }
    else if (!inMenus()) {
      refreshUpgrades(); refreshBag(); layoutDice();
      shopSprites.forEach((sp, k) => { if (sp) { const q = L.shopPos(k); sp.moveTo(q.x, q.y, 0); } });
    }
  }

  // ── Dev-Panel (Regler für alle Effekte) ─────────────────────────────────
  function setupDevPanel() {
    const panel = document.getElementById('dev');
    const sliders = [
      ['CRT total', eng.crt, 'amount', 0, 1], ['Curvature', eng.crt, 'curvature', 0, 1.5], ['Scanlines', eng.crt, 'scanlines', 0, 1],
      ['Bloom', eng.crt, 'bloom', 0, 1.5], ['Chroma aberr.', eng.crt, 'chroma', 0, 2], ['Noise', eng.crt, 'noise', 0, 1],
      ['Vignette', eng.crt, 'vignette', 0, 1], ['BG pixel', eng.bgTarget, 'pixelFilter', 150, 1500], ['BG contrast', eng.bgTarget, 'contrast', 0.5, 5],
      ['BG swirl', eng.bgTarget, 'spinAmount', 0, 1], ['BG flow', eng.bgTarget, 'spinSpeed', 0, 20], ['BG rotation', eng.bgTarget, 'rotation', -5, 5],
    ];
    let html = '<h3>BalatroFX settings <small>[H]</small></h3>';
    sliders.forEach(([label, , , min, max], i) => {
      html += `<label>${label}<input type="range" data-i="${i}" min="${min}" max="${max}" step="${(max - min) / 200}"></label>`;
    });
    html += '<label>Background<select id="bgsel">' + Object.keys(FX.BG_PRESETS).map((k) => `<option>${k}</option>`).join('') + '</select></label>';
    html += '<div class="row"><button id="shake">Shake</button><button id="burst">Particles</button><button id="crt">CRT on/off</button></div>';
    panel.innerHTML = html;
    panel.querySelectorAll('input[type=range]').forEach((inp) => {
      const [, obj, key] = sliders[+inp.dataset.i];
      inp.value = obj[key];
      inp.addEventListener('input', () => { obj[key] = parseFloat(inp.value); });
    });
    panel.querySelector('#bgsel').addEventListener('change', (e) => eng.setBackground(e.target.value));
    panel.querySelector('#shake').addEventListener('click', () => eng.shake(12));
    panel.querySelector('#burst').addEventListener('click', () => {
      eng.emit(790, 330, { count: 60, colours: [P.RED, P.BLUE, P.GOLD, '#FFFFFF'], speed: 600, size: 12, life: 1.1, gravity: 500 });
    });
    panel.querySelector('#crt').addEventListener('click', () => { eng.crt.enabled = !eng.crt.enabled; });
  }

  // Test-Zugang für automatisierte Browser-Tests (?test in der URL)
  if (/[?&]test\b/.test(location.search)) {
    window.__WG = {
      S, dice: () => dice, R, enterShop, tut: () => TUT,
      setFaces: (vals) => dice.forEach((d, i) => { const k = d.data.die.faces.findIndex((f) => f.v === vals[i]); if (k >= 0) { d.data.up = k; refreshDieTex(d); } }), leaveShop, useCons: () => { selected = consSprites[0]; useSelected(); }, sellRelic: (k) => { selected = relicSprites[k]; sellSelected(); }, music: () => Music.playing, settings: SETTINGS, startCupDraw: () => startCupDraw(() => enterShop()), CUPS, cupList: () => cupList, slot: () => slot, profile: () => profile, saveNow: () => autosave(true), cupSel: () => cupSel, buy, startBlind, addRelic, refreshBag, stockShop, fuse: () => fuse && { t0: fuse.t0, total: fuse.total }, tips: () => tips.map((q) => ({ term: q.term, pinned: q.pinned, rect: q.rect && { x: q.rect.x, y: q.rect.y, w: q.rect.w, h: q.rect.h }, terms: q.rect ? q.rect.terms.map((r) => ({ x: r.x, y: r.y, w: r.w, h: r.h, term: r.term })) : [] })), 
      addUpgrade: (id) => { S.upgrades.push(id); refreshUpgrades(); },
      achieve, toasts: () => toasts.map((q) => q.a.id), openTrophies, genItem, genDie, rollUpgrade, open, meta,
      song: () => ({ rel: songRel, info: songInfo, k: songK() }), spawnHead, head: () => floatHead && headPos(floatHead), secret, callJonny,
      idle: (sec) => { lastInput = nowSec() - sec; }, menuDice: () => menuDice.map((d) => ({ x: d.x, y: d.y, v: d.data.v })), skipSong, setTab: (i) => { setTab = i; }, slotData: () => slotData,
      setRelics: (ids) => { relicSprites.forEach((s) => s.remove()); relicSprites = []; S.relics = []; ids.forEach((id) => addRelic(id)); },
      jonny: () => JS.cur && { place: JS.cur.place, mood: JS.cur.line.mood, text: JS.cur.line.words.map((w) => w.t).join(''), q: JS.q.length, rect: JS.rect },
      jonnyQueue: () => JS.q.map((x) => x.line.words.map((w) => w.t).join('')), job: () => S.job, newJob, JOBS: () => JOBS.map((d) => d.id),
      setJob: (id) => { const def = JOB_BY_ID[id], j = def.make(); S.job = Object.assign(j, { id, kind: def.kind || 'count', n: 0, status: 'open', reward: jobReward(j.d) }); return S.job; },
      jonnyHelp, bestHold, jonnyEnd, jonnySay, pickBoss, winBlind, loseRun, JONNY_BOSS, maybeSpecial: (force) => maybeSpecial(force), openCups, beginRun,
      B, layout: () => L && L.id, slotMain: (k) => SLOT_MAIN[k], shopSprites: () => shopSprites, relicSprites: () => relicSprites,
      consSprites: () => consSprites, tagRects: () => tagRects.map((r) => ({ x: r.x, y: r.y, w: r.w, h: r.h, tag: r.tag, term: r.term })),
    };
  }

  // ── Start ───────────────────────────────────────────────────────────────
  // ── Tutorial mit Jonny (tutorial.js) ───────────────────────────────────
  // Beim ersten Klick auf PLAY fragt Jonny, ob man ein Tutorial möchte. Es lässt sich nur einmal spielen.
  const TUT = window.WGTutorial ? window.WGTutorial({
    S, eng, UI, P, R, B, sfx, dice: () => dice, L: () => L, preview, mobile: MOBILE, dim: (ctx, a) => dim(ctx, a), upValue: (sp) => upFace(sp).v, textSpeed: () => +SETTINGS.textSpeed || 1,
    relicSprites: () => relicSprites, consSprites: () => consSprites, addRelic,
  }) : { active: false, modal: false, event() {}, buttons: () => [], update() {}, draw() {}, click: () => false, stop() {}, extraHand: () => false };
  const tutorialSeen = () => { try { return !!localStorage.getItem('wg_tutorial'); } catch (e) { return true; } };
  function pressPlay() {
    if (tutorialSeen() || !TUT.prompt) return openSlots();
    TUT.prompt((yes) => {
      try { localStorage.setItem('wg_tutorial', yes ? 'played' : 'declined'); } catch (e) { /* ohne Speicher weiter */ }
      if (!yes) secret('heartbreaker');   // nur möglich, wenn Jonny traurig gegangen ist
      if (yes) startTutorial(); else openSlots();
    });
  }
  // Statistik des Tutorials (unabhängig von den Speicherplätzen)
  function tutorialStats() {
    try {
      const best = localStorage.getItem('wg_tutorial_best');
      return { runs: +(localStorage.getItem('wg_tutorial_runs') || 0), best: best === null ? null : +best, declined: localStorage.getItem('wg_tutorial') === 'declined' };
    } catch (e) { return { runs: 0, best: null, declined: false }; }
  }
  function startTutorial() {
    const st = tutorialStats();
    try { localStorage.setItem('wg_tutorial_runs', String(st.runs + 1)); localStorage.setItem('wg_tutorial', 'played'); } catch (e) { /* ohne Speicher weiter */ }
    slot = -1; profile = null;
    TUT.start({ runs: st.runs, declined: st.declined });
    startRun('classic');
    S.boss = R.BOSSES.find((b) => b.id === 'snake'); S.usedBosses = ['snake'];
    S.upgradeOffer = 'backpack';
  }
  function finishTutorial() {
    const st = tutorialStats(), m = TUT.totalMistakes;
    if (m === 0) secret('teacher_pet');
    try { if (st.best === null || m < st.best) localStorage.setItem('wg_tutorial_best', String(m)); } catch (e) { /* ohne Speicher weiter */ }
    TUT.stop();
    backToMenu();
    openSlots();
  }

  // Beim Verlassen der Seite den aktuellen Stand sichern
  window.addEventListener('pagehide', () => autosave(true));
  applyLayout(MOBILE ? 'mobile' : 'classic');
  loadSettings();
  applySettings();
  setupDevPanel();
  const begin = () => { setupMenu(); eng.start(update, draw); };
  if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('20px "Wuerfel Pixel"'), document.fonts.load('20px "Pixelify Sans"')]).catch(() => {}).then(begin);
  else begin();
})();
