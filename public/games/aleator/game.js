// Aleator – Spiel (Ablauf, Darstellung, Eingabe) auf Basis von BalatroFX. Regeln und Daten: rules.js
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
  // CRT lesbar halten: nur wirklich Helles leuchtet (Text auf dunklen Panels nicht), Farbsaum nur zum Bildrand hin
  const CRT_OPTS = { bloomCut: 0.6, bloom: 0.5, chroma: 0.3, chromaFlat: 0 };
  const eng = new FX.Engine(canvas, MOBILE ? { width: 1280, height: 720, background: 'menu', maxDpr: 2, maxPixels: 1.4e6, bgLowRes: true, crt: CRT_OPTS }
    : { width: 1280, height: 720, background: 'menu', crt: CRT_OPTS });
  window.eng = eng;

  // ── Konstanten ──────────────────────────────────────────────────────────
  const DIE_S = MOBILE ? 2.9 : 2.2;  // 32 px × 2.2 ≈ 70 px auf dem Bildschirm (Handy größer)
  // Balance-Werte stehen in rules.js (R.BALANCE), damit der Simulator (tools/sim) dieselben Zahlen nutzt
  const { HANDS_MAX, REROLLS_MAX, ANTES, START_MONEY, START_BAG, ANTE_TARGET, BLINDS, VAULT_MAX, ENDLESS_GROWTH, HEAT_PULL, HEAT_CAP } = R.BALANCE;
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
  const Tapes = window.WGTapes || null;   // Anrufbeantworter-Bänder von Jonnys Vater (voicemails.js)
  const open = (kind, id) => !ACH || TUT.active || ACH.isOpen(meta(), kind, id);
  // Musik einer Runde: Stage 1–3 ruhig, ab Stage 4 mehr Spannung, Showdowns mit Boss-Musik, Stage 8 mit dem großen Boss-Track
  const roundMood = () => (isBossBlind() ? (S.ante >= ANTES ? 'final' : 'boss') : S.ante >= 4 ? 'mid' : 'early');
  const Saves = window.WGSaves;
  const Phone = window.WGPhone;   // Telefon nach jedem Showdown (phone.js)
  const Enc = window.WGEncounters, Gif = window.WGGif, EncArt = window.WGEncounterArt, Scenes = window.WGEncounterScenes;
  const Rng = window.WGRng, Replay = window.WGReplay, Cos = window.WGCosmetics, Col = window.WGColour;
  // Geseedeter Zufall des Runs (rng.js). Außerhalb eines Runs (Menü) normaler Zufall. Optik nutzt immer Math.random.
  const rng = (name) => (S.rng ? Rng.stream(S.rng, name) : Math.random);
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
  // Endboss in Stage 8: Jonny. Er schummelt und nimmt jede Hand die Regel eines anderen Bosses (S.jonnyRule). Mehr Hände, viel höheres Ziel.
  const JONNY_BOSS = { id: 'jonny', name: 'Jonny', colour: '#A8742A', factor: R.BALANCE.JONNY_FACTOR, hands: R.BALANCE.JONNY_HANDS, final: true,
    get desc() {
      const r = jonnyRuleBoss();
      return r ? 'This hand: ' + r.name + ' - ' + r.desc : 'The final boss. He cheats: every hand he picks a new rule from the other bosses';
    } };
  // Zweiter Endboss im Endless (Stage FATHER_STAGE): Jonnys Vater, der Anrufer vom Telefon. Zwei Phasen (S.bossPhase):
  // Phase 1 bis FATHER_SPLIT des Ziels mit einer festen Regel, dann wird er ernst: neue Regel in Elite-Stärke,
  // der Überschuss verfällt und verankerte Würfel gehen zurück in den Beutel. Beide Phasen teilen sich die Hände.
  const FATHER_BOSS = { id: 'father', name: "Jonny's Father", colour: '#7A2E3E', factor: R.BALANCE.FATHER_FACTOR, hands: R.BALANCE.FATHER_HANDS, final: true, father: true,
    get desc() {
      const r = jonnyRuleBoss();
      if (!r) return 'Two phases. Half the target under one rule, then he gets serious: a new rule at Elite strength';
      return (S.bossPhase === 2 ? 'Phase 2: ' : 'Phase 1: ') + r.name + ' - ' + r.desc;
    } };
  const FINAL_BOSSES = { jonny: JONNY_BOSS, father: FATHER_BOSS };
  const bossById = (id, lv) => FINAL_BOSSES[id] || R.bossOf(id, lv || 0);
  const isFinal = (b = S.boss) => !!(b && b.final);
  const fatherFight = () => S.boss === FATHER_BOSS && isBossBlind();
  const ruleLv = () => (S.boss === FATHER_BOSS && S.bossPhase === 2 ? 1 : 0);
  const jonnyRuleBoss = () => (isFinal() && S.jonnyRule && ['rolling', 'select', 'scoring', 'won', 'lost'].includes(S.phase) ? R.bossOf(S.jonnyRule, ruleLv()) : null);
  // Wirksamer Boss: bei den Endbossen die geliehene Regel (Jonny: normale Ausprägung, sein Vater in Phase 2: Elite)
  let jonnyRuleObj = null;
  const curBoss = () => {
    if (!isFinal()) return S.boss;
    if (!S.jonnyRule) return null;
    if (!jonnyRuleObj || jonnyRuleObj.id !== S.jonnyRule || jonnyRuleObj.lv !== ruleLv()) jonnyRuleObj = R.bossOf(S.jonnyRule, ruleLv());
    return jonnyRuleObj;
  };
  // Zusätzliche Hände der Endbosse (nicht in den frühen Prüfungen des Exam-Bechers)
  const finalHands = () => (isBossBlind() && isFinal() && !(S.boss === JONNY_BOSS && cup().exam && S.ante < ANTES) ? S.boss.hands || 0 : 0);
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
  const FACE_STYLE = Cos.FACE_STYLE;
  const STAR_COLOURS = [P.RED, P.ORANGE, P.GOLD, P.GREEN, P.BLUE, P.PURPLE];
  const SKULL = ['..XXXXXXX..', '.XXXXXXXXX.', 'XXXXXXXXXXX', 'XX..XXX..XX', 'XX..XXX..XX', 'XXXXX.XXXXX', '.XXXX.XXXX.', '..XXXXXXX..', '..X.X.X.X..', '..XXXXXXX..'];
  // Kalender-Eggs (Datum beim Start): Halloween orange Augen, Freitag der 13. grinsende Schädel, Dezember Schnee im Menü, 10.11. Aleator Day
  const SEASON = (() => { const d = new Date(), m = d.getMonth(), day = d.getDate();
    return { halloween: m === 9 && day === 31, fri13: d.getDay() === 5 && day === 13, december: m === 11, aleatorDay: m === 10 && day === 10 }; })();
  const SKULL_GRIN = ['..XXXXXXX..', '.XXXXXXXXX.', 'XXXXXXXXXXX', 'XX..XXX..XX', 'XX..XXX..XX', 'XXXXX.XXXXX', 'X.XXXXXXX.X', 'XX.X.X.X.XX', '.XXXXXXXXX.', '..XXXXXXX..'];
  const MINI_PIPS = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] };
  const blankDie = (opts) => Art.die(1, Object.assign({}, opts, { onePip: opts.body }));
  function drawSkull(ctx, colourAt) {
    (SEASON.fri13 ? SKULL_GRIN : SKULL).forEach((row, y) => [...row].forEach((ch, x) => { if (ch === 'X') { ctx.fillStyle = colourAt(x, y); ctx.fillRect(10 + x, 8 + y, 1, 1); } }));
  }
  // Barrierefreiheit: kleines Symbol oben in der Mitte (dort liegt nie ein Auge), damit Sonderseiten nicht nur an der Farbe erkennbar sind
  const HINT_GLYPH = { gold: ['.XXX.', 'X...X', 'X.X.X', 'X...X', '.XXX.'], mult: ['X...X', '.X.X.', '..X..', '.X.X.', 'X...X'], bonus: ['..X..', '..X..', 'XXXXX', '..X..', '..X..'] };
  let shapeHintsOn = false, MAT = null;   // aus den Einstellungen (applySettings)
  // Maske fürs Würfelmaterial: nur Pixel in der Körperfarbe sind Oberfläche. Augen, Symbole, Rand und Schattenkante bleiben geschützt.
  // Neue Würfeltypen und Seitenarten bekommen sie automatisch.
  function faceMask(c, body) {
    const [r, g, b] = Col.toRgb(body), src = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    const m = document.createElement('canvas'); m.width = c.width; m.height = c.height;
    const mx = m.getContext('2d'), out = mx.createImageData(c.width, c.height);
    for (let k = 0; k < src.length; k += 4) {
      const on = src[k + 3] === 255 && src[k] === r && src[k + 1] === g && src[k + 2] === b ? 255 : 0;
      out.data[k] = out.data[k + 1] = out.data[k + 2] = on; out.data[k + 3] = 255;
    }
    mx.putImageData(out, 0, 0);
    return m;
  }
  const faceCache = {};
  function faceEntry(f, type) {
    const key = type + '|' + f.v + '|' + f.kind + '|' + (shapeHintsOn ? 1 : 0);
    if (faceCache[key]) return faceCache[key];
    const opts = Object.assign({ edge: R.DIE_TYPES[type].edge || undefined }, FACE_STYLE[f.kind]);
    if (SEASON.halloween && f.kind === 'normal') Object.assign(opts, { pip: '#B84A12', onePip: '#B84A12' });   // Kürbis-Augen
    let c, mask = null;
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
        // Regenbogen auf allen weißen Flächen (die Maske entsteht vorher, solange die Fläche noch einfarbig ist)
        mask = faceMask(c, opts.body);
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
      const glyph = shapeHintsOn && HINT_GLYPH[f.kind];
      if (glyph) {
        const ctx = c.getContext('2d');
        ctx.fillStyle = opts.pip;
        glyph.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === 'X') ctx.fillRect(14 + x, 3 + y, 1, 1); }));
      }
    }
    const entry = { canvas: c, tex: eng.texture(c) };
    entry.tex.mask = eng.texture(mask || faceMask(c, opts.body));
    return (faceCache[key] = entry);
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
    vault: 0, anchored: [], shifts: 0,
    endless: false,   // nach dem Sieg in Stage 8 weitergespielt (Endless-Modus)
    runId: 0, stats: null, runAch: [],   // Statistik des Runs und in diesem Run freigeschaltete Achievements
    summary: null,    // Auswertung am Ende des Runs (dieselbe Form wie ein Eintrag der Laufhistorie)
    shop: null, shopRerollCost: 1, upgradeOffer: null, bought: false, pruneUsed: false, choice: null,
    cup: 'classic', time: 0, scoreStep: 0, chaos: null, cupDrawn: false, cupDraw: null,
    ach: null,   // Achievement-Zähler für diesen Run: letzte Hand, Serie, Busts, Shops ohne Kauf
    job: null,   // Jonnys Auftrag für die laufende (bzw. im Shop: die nächste) Runde
    jonny: null, // Jonny im Run: erledigte Aufträge, bester Wurf, sein Anteil, Hilfe im Jonny's Cup, Shop-Besuche
    jonnyRule: null,   // Endboss Jonny: Regel der aktuellen Hand (Boss-ID)
    phone: null,       // Telefon: genommene Vorteile { owned: {id: Anzahl}, calls, ignored }
    shopFree: 0,       // kostenlose Shop-Rerolls in diesem Shop (Telefon: Fresh Stock)
  };
  const freshJonny = () => ({ jobs: 0, failed: 0, best: 0, cut: 0, helps: 0, help: false, tags: {}, rerolls: 0, visit: 0, last: null });
  S.jonny = freshJonny();
  // hc: Handarten im Run, brokeAnte: Stage, in der man zuletzt pleite war, bustT: Zeit des letzten Busts, bt: Boss-Bilanz der Runde
  const freshBT = () => ({ taxPaid: 0, judgeHits: 0, coins: [], ghostScoring: false, maxFrozen: 0 });
  const freshAch = () => ({ last: null, streak: 0, busts: 0, noBuy: 0, hc: {}, brokeAnte: 0, bustT: 0, open: '', bt: freshBT() });
  const BT = () => S.ach.bt || (S.ach.bt = freshBT());
  S.ach = freshAch();
  // Statistik eines Runs (Pause-Ansicht, Auswertung am Ende, Laufhistorie)
  const freshStats = () => ({ heat: 0, hands: 0, rounds: 0, bosses: 0, rerolls: 0, lucky: 0, busts: 0, links: 0, chain: 0, palindromes: 0, shifts: 0,
    earned: 0, spent: 0, bought: 0, sold: 0, used: 0, best: 0, bestName: '', total: 0, maxMoney: 0, fives: 0, said: {} });
  S.stats = freshStats();
  // Challenge-Runs (S.chal) nutzen einen eigenen Becher mit Zusatzregeln (challenges.js), sonst der gewählte Becher
  const Chal = window.WGChallenges;
  let chalCupCache = null;
  function chalCup(ch) {
    const key = JSON.stringify(ch);
    if (chalCupCache && chalCupCache.key === key) return chalCupCache.cup;
    let c;
    if (ch.daily) {
      const t = R.TAGS[ch.tag], rel = R.RELIC_BY_ID[ch.relic];
      c = Object.assign({}, CUP_DEFAULTS, { id: 'daily', name: 'Daily Challenge', colour: t.colour, short: 'Build of the Day: ' + t.name, daily: true,
        relics: [ch.relic], desc: 'Same dice, shops and bosses for everyone today. Build of the Day: ' + t.name + '. You start with ' + rel.name + '.' });
    } else {
      const d = Chal.BY_ID[ch.id];
      c = Object.assign({}, CUP_DEFAULTS, { id: 'chal_' + d.id, name: d.name, colour: d.colour, short: d.short, desc: d.desc, challenge: d.id }, d.cup);
    }
    chalCupCache = { key, cup: c };
    return c;
  }
  const cup = () => (S.chal ? chalCup(S.chal) : CUP_BY_ID[S.cup] || CUPS[0]);
  const rushOn = () => !!cup().bossRush && !TUT.active;
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
    settings: btn(1164, 570, 84, 26, 'Settings', P.L_BLACK, { size: 15 }),
    close: btn(560, 552, 160, 50, 'Close', P.RED, { size: 24 }),
    quit: btn(650, 552, 180, 50, 'Save & Quit', P.ORANGE, { size: 22 }),
    home: btn(535, 420, 160, 54, 'Main Menu', P.L_BLACK, { size: 22 }),
    back: btn(560, 622, 160, 52, 'Back', P.RED, { size: 24 }),
    begin: btn(660, 616, 240, 62, 'Start Run', P.BLUE, { size: 30 }),
    collect: btn(570, 470, 180, 56, 'Collect', P.GREEN, { size: 26 }),
    tutYes: btn(492, 400, 250, 60, 'Yes, teach me!', P.GREEN, { size: 26 }),
    tutNo: btn(772, 400, 210, 60, 'No thanks', P.RED, { size: 24 }),
    tutDone: btn(1010, 628, 250, 64, 'Finish Tutorial', P.BLUE, { size: 24 }),
    tutSlot: btn(1004, 482, 212, 50, 'Play Tutorial', P.PURPLE, { size: 22 }),
    tutX: btn(1176, 32, 58, 58, 'X', P.RED, { size: 34 }),
    cupPrev: btn(70, 262, 56, 60, '<', P.ORANGE, { size: 30 }),
    cupNext: btn(1154, 262, 56, 60, '>', P.ORANGE, { size: 30 }),
    trophies: btn(370, 566, 150, 54, 'Trophies', P.GOLD, { size: 24 }),
    achPrev: btn(470, 622, 70, 52, '<', P.ORANGE, { size: 30 }),
    achNext: btn(740, 622, 70, 52, '>', P.ORANGE, { size: 30 }),
    help: btn(900, 494, 86, 52, 'Help!', '#8F5FC0', { size: 20 }),
    codex: btn(210, 566, 150, 54, 'Codex', P.PURPLE, { size: 24 }),
    history: btn(920, 566, 150, 54, 'History', P.GREEN, { size: 24 }),
    share: btn(0, 0, 190, 50, 'Share Image', P.BLUE, { size: MOBILE ? 26 : 22 }),
    endless: btn(0, 0, 210, 50, 'Keep Going', P.PURPLE, { size: 22 }),
    gif: btn(0, 0, 150, 50, 'Save GIF', P.PURPLE, { size: MOBILE ? 26 : 22 }),
    pagePrev: btn(470, 622, 70, 52, '<', P.ORANGE, { size: 30 }),
    pageNext: btn(740, 622, 70, 52, '>', P.ORANGE, { size: 30 }),
    challenges: btn(880, 616, 200, 62, 'Challenges', P.PURPLE, { size: 26 }),
    chStart: btn(610, 622, 240, 56, 'Start', P.BLUE, { size: 26 }),
  };
  const BUY = [0, 1, 2, 3, 4].map((k) => btn(0, 412, 100, 38, 'Buy', P.BLUE, { size: 20, slot: k }));
  const CHOICE = [0, 1, 2].map((k) => btn(0, 300, 170, 60, '', P.BLUE, { size: 22, choice: k }));
  // Speicherplätze: drei Spalten links, rechts daneben das Tutorial (sobald es einmal angeboten wurde).
  // Ein Platz enthält nur einen Run: Hauptknopf (Weiter / Neuer Run) und, bei laufendem Run, Aufgeben.
  const SLOT_W = 300, SLOT_X = (k) => 40 + k * 312, TUT_CARD = { x: 980, y: 136, w: 260, h: 458 };
  const SLOT_MAIN = [0, 1, 2].map((k) => btn(SLOT_X(k) + 24, 482, SLOT_W - 48, 50, 'New Run', P.BLUE, { size: 24, slotMain: k }));
  const SLOT_DEL = [0, 1, 2].map((k) => btn(SLOT_X(k) + SLOT_W / 2 - 75, 544, 150, 28, 'Abandon Run', P.L_BLACK, { size: 16, slotDel: k }));
  // Einstellungen in Reitern. Zeilen: Regler (slider), Auswahl (< Wert >) oder Aktion (ein Knopf)
  const SET_TABS = [
    { id: 'audio', label: 'Audio', rows: [
      { key: 'master', label: 'Master volume', slider: true }, { key: 'music', label: 'Music', slider: true },
      { key: 'sfx', label: 'Sound effects', slider: true }, { key: 'voice', label: "Jonny's voice", slider: true },
      { key: 'songTitles', label: 'Song titles' }, { key: 'muteBg', label: 'Mute when unfocused' }] },
    { id: 'video', label: 'Video', rows: [
      { key: 'font', label: 'Font' },
      { key: 'crt', label: 'CRT effect' }, { key: 'shake', label: 'Screen shake' }, { key: 'particles', label: 'Particles' },
      { key: 'fullscreen', label: 'Fullscreen' }] },
    { id: 'style', label: 'Style', rows: [
      { key: 'palette', label: 'Colours' }, { key: 'background', label: 'Background' }, { key: 'material', label: 'Dice material' },
      { key: 'studio', label: 'Colour Studio', action: 'Open', soft: true }] },
    { id: 'look', label: 'Look', rows: [
      { key: 'lookShadow', label: 'Hard shadows' }, { key: 'lookBevel', label: 'Light edges' }, { key: 'lookCalm', label: 'Calm menu buttons' },
      { key: 'lookFrame', label: 'Window frames' }, { key: 'lookTilt', label: 'Hand-placed tilt' }, { key: 'lookText', label: 'New texts' },
      { key: 'lookOwn', label: 'Own colours & font' }, { key: 'lookIcons', label: 'Dark icon outlines' },
      { key: 'lookButtons', label: 'Lively buttons' }] },
    { id: 'game', label: 'Gameplay', rows: [
      { key: 'speed', label: 'Game speed' }, { key: 'tipDelay', label: 'Tooltip delay' }, { key: 'textSpeed', label: 'Jonny text speed' },
      { key: 'jonnyTalk', label: 'Jonny chatter' }, { key: 'reset', label: 'Reset progress', action: 'Reset' }] },
    { id: 'controls', label: 'Controls', rows: [] },
    { id: 'access', label: 'Access', rows: [
      { key: 'cvd', label: 'Colour vision' }, { key: 'shapeHints', label: 'Shape hints on dice' }, { key: 'highContrast', label: 'High contrast' },
      { key: 'textSize', label: 'Text size' }, { key: 'readFont', label: 'Readable font' }, { key: 'bgMotion', label: 'Background motion' },
      { key: 'accMore', label: 'More options', action: 'More >', soft: true }] },
    { id: 'access2', label: 'Access', rows: [
      { key: 'bgBright', label: 'Background light' }, { key: 'noFlash', label: 'Fewer flashes' }, { key: 'reduceMotion', label: 'Less motion' }, { key: 'skipScore', label: 'Skip scoring' },
      { key: 'clickShift', label: 'Shift by clicking' }, { key: 'photosafe', label: 'Photosensitive safe' },
      { key: 'accBack', label: 'Back to first page', action: '< Back', soft: true }] },
    { id: 'run', label: 'Run', rows: [] },   // Handy: Statistik des Runs (am PC steht sie links neben den Einstellungen)
  ];
  if (MOBILE) {
    // Handy: Tooltips per langem Druck (keine Verzögerung einstellbar), Vollbild nur, wenn der Browser es kann
    const fsOK = !!(document.fullscreenEnabled && document.documentElement.requestFullscreen);
    // Look-Reiter: das Handy fasst nur 8 Zeilen, 'Lively buttons' bleibt dort immer an
    SET_TABS.forEach((tb) => { tb.rows = tb.rows.filter((r) => r.key !== 'tipDelay' && r.key !== 'lookButtons' && (r.key !== 'fullscreen' || fsOK)); });
  }
  let setTab = 0;
  // PC: großes Fenster, links die Zeilen (x 52–632), rechts die Erklärung (x 656–1228)
  const SET_Y = (k) => 152 + k * 52;
  const SET_ROW = { x: 52, w: 580, h: 44 }, SET_INFO = { x: 656, y: 122, w: 572, h: 470 };
  const SLIDER = { x: 384, w: 160 };   // Regler-Bahn in den Lautstärke-Zeilen
  const sliderRect = (k) => (MOBILE ? mSlider(k).hit : { x: SLIDER.x - 12, y: SET_Y(k) - 20, w: SLIDER.w + 24, h: 40 });
  const SET_TAB_BTNS = SET_TABS.map((tb, i) => btn(364 + i * 93, 150, 87, 42, tb.label, P.L_BLACK, { size: 18, setTab: i }));
  const SET_BTNS = [];
  SET_TABS.forEach((tb, ti) => tb.rows.forEach((r, k) => {
    if (r.slider) return;
    if (r.action) { SET_BTNS.push(btn(452, SET_Y(k) - 18, 160, 36, r.action, r.soft ? P.BLUE : P.RED, { size: 20, inTab: ti, setRow: k, action: true, soft: !!r.soft })); return; }
    SET_BTNS.push(btn(384, SET_Y(k) - 18, 40, 36, '<', P.BLUE, { size: 24, inTab: ti, setRow: k, dir: -1 }));
    SET_BTNS.push(btn(572, SET_Y(k) - 18, 40, 36, '>', P.BLUE, { size: 24, inTab: ti, setRow: k, dir: 1 }));
  }));
  const setRows = () => SET_TABS[setTab].rows;
  const tabVisible = (i) => SET_TABS[i].id !== 'run' || (MOBILE && !inMenus() && !TUT.active);
  const visTabBtns = () => SET_TAB_BTNS.filter((b) => tabVisible(b.setTab) && SET_TABS[b.setTab].id !== 'access2');
  const setBtnsNow = () => SET_BTNS.filter((b) => b.inTab === setTab);
  B.shift = btn(0, 0, 140, 42, 'Shift', P.PURPLE, { size: 20 });   // Barrierefreiheit: Shift per Klick statt Ziehen
  // Einstellungen: Anwenden (speichert), Warnung bei ungespeicherten Änderungen; Pause-Menü am PC (Esc im Spiel)
  Object.assign(B, {
    apply: btn(648, 622, 180, 50, 'Apply', P.GREEN, { size: 24 }),
    askApply: btn(0, 0, 200, 50, 'Apply & close', P.GREEN, { size: 22 }),
    askDiscard: btn(0, 0, 200, 50, 'Discard', P.RED, { size: 22 }),
    askStay: btn(0, 0, 200, 50, 'Keep editing', P.L_BLACK, { size: 22 }),
    resume: btn(490, 236, 300, 58, 'Back to Game', P.BLUE, { size: 26, tilt: -0.012 }),
    pStats: btn(490, 310, 300, 54, 'Stats', P.L_BLACK, { size: 24, tilt: 0.015 }),
    pSettings: btn(490, 380, 300, 54, 'Settings', P.L_BLACK, { size: 24, tilt: -0.01 }),
    pBack: btn(550, 606, 180, 50, 'Back', P.RED, { size: 24 }),
  });
  // Look > Hand-placed tilt: Hauptmenü-Knöpfe stehen leicht schräg
  Object.assign(B.codex, { tilt: -0.03 }); Object.assign(B.trophies, { tilt: 0.02 }); Object.assign(B.start, { tilt: -0.012 });
  Object.assign(B.options, { tilt: 0.026 }); Object.assign(B.history, { tilt: -0.02 });
  if (!MOBILE) B.settings.label = 'Menu';   // PC: öffnet das Pause-Menü (wie Esc)
  const ALL_BUTTONS = Object.values(B).concat(BUY, CHOICE, SET_TAB_BTNS, SET_BTNS, SLOT_MAIN, SLOT_DEL);
  const MENU_PHASES = ['menu', 'slots', 'cups', 'trophies', 'codex', 'history', 'challenges'];
  const inMenus = () => MENU_PHASES.includes(S.phase);
  // Speichern und Beenden geht nur in ruhigen Momenten (Würfel liegen, Shop offen) – oder nach Ende des Runs
  const canQuit = () => (['select', 'shop'].includes(S.phase) && !S.choice && !eng.busy) || ['lost', 'runWon'].includes(S.phase);
  function activeButtons() {
    if (settingsOpen && studioOpen) return studioButtons();
    if (settingsOpen) return settingsButtons();
    const tb = TUT.buttons();
    if (TUT.modal || tb.length) return tb;
    if (S.cupDraw) return [B.collect];
    if (S.choice) return CHOICE;
    if (S.phase === 'menu') return [B.start, B.options, ...(ACH ? [B.trophies] : []), B.codex, B.history];
    if (S.phase === 'codex') return [...CODEX_TAB_BTNS, B.pagePrev, B.pageNext, B.back];
    if (S.phase === 'history') return histSel >= 0 ? [B.back, B.share, ...(gifOf(history()[histSel]) ? [B.gif] : [])] : [B.pagePrev, B.pageNext, B.back];
    if (S.phase === 'slots') return [...slotButtons(), ...(tutorialSeen() ? [B.tutSlot] : []), B.back];
    if (S.phase === 'cups') return [B.cupPrev, B.cupNext, B.begin, B.back, ...(Chal && profile ? [B.challenges] : [])];
    if (S.phase === 'challenges') return chalButtons();
    if (S.phase === 'trophies') return [B.achPrev, B.achNext, B.back];
    if (S.phase === 'lost' || S.phase === 'runWon') return S.summary ? summaryButtons() : [B.settings];
    if (S.phase === 'encounter') return [B.settings, ...encButtons()];
    if (S.phase === 'phone') return [B.settings, ...phoneButtons()];
    if (S.phase === 'won') return [B.settings];
    const sel = selButtons();
    if (S.phase === 'shop') return [B.settings, B.next, B.shopReroll, ...BUY.filter((b) => S.shop && S.shop[b.slot]), ...(upg('vault') ? [B.deposit, B.withdraw] : []), ...sel];
    return [B.settings, B.roll, B.play, ...(helpShown() ? [B.help] : []), ...(shiftBtnOn() ? [B.shift] : []), ...sel];
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
  const isBossBlind = () => S.blindIdx === 2 || rushOn();   // Boss Rush: jede Runde ist ein Boss
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
  const bagMax = () => cup().bagLimit || R.MAX_BAG + (cup().bagPlus || 0) + (upg('backpack') ? 4 : 0) + (upg('saddlebag') ? 3 : 0) + (setOn('bag', 3) ? 2 : 0);
  const minMoney = () => (upg('overdraft') ? -20 : 0);
  const canPay = (price) => S.money - price >= minMoney();
  const drawCount = () => Math.min(S.bag.length, upg('spare_die') ? 6 : 5);
  // Formation: die Lage auf dem Tisch zählt (außer im Tutorial). Shifts = Tauschzüge pro Hand.
  const formationOn = () => !TUT.active;
  const chalkOn = (kind) => !!(S.enc && S.enc.chalk && S.enc.chalk.stage <= S.ante && S.ante <= (S.enc.chalk.until || S.enc.chalk.stage) && S.enc.chalk.kind === kind);
  const linkPips = () => (cup().linkPips || (chalkOn('links') ? 8 : R.LINK_PIPS)) + Phone.linkPips(phoneOwned());
  const shiftsMax = () => (formationOn() ? (cup().shifts || 1) + (upg('turntable') ? 1 : 0) + (setOn('formation', 3) ? 1 : 0) + (chalkOn('shift') ? 1 : 0) : 0);
  const FORM_COL = () => R.TAGS.formation.colour;
  const handsMax = () => Math.max(1, cup().hands + chaosVal('hands') - (upg('overdrive') ? 1 : 0) - (has('blood_pact') ? 1 : 0) + (bossActive('hourglass') ? curBoss().hands : 0) + finalHands());
  const rerollsBase = () => Math.max(0, cup().rerolls + chaosVal('rerolls')) + (upg('overdrive') ? 2 : 0) + (upg('quick_hands') ? 1 : 0) + (setOn('reroll', 3) ? 1 : 0) + eff().reduce((a, e) => a + (e.def.extraRerolls || 0), 0);
  const rerollsMax = () => Math.max(0, (bossActive('clamp') ? Math.max(1, rerollsBase() - curBoss().minus) : rerollsBase()) + (bossActive('hourglass') ? curBoss().rerolls : 0)
    - (S.enc && S.enc.cool === true && !S.enc.freeCool ? 1 : 0));   // The Clamp: -2 (Elite -3), aber nie unter 1
  const anchorCap = () => (cup().anchors || 0) + (upg('anchor') ? 1 : 0) + (setOn('hold', 3) ? 1 : 0);
  const bustAt = () => 3 + (upg('rabbit_foot') ? 1 : 0) + (setOn('risk', 3) ? 1 : 0) + (cup().bustPlus || 0);
  const heldCount = () => dice.filter((d) => d.data.held).length;
  const skullsShowing = () => dice.filter((d) => d.data.die && R.isSkull(upFace(d))).length;
  const frozen = (sp) => bossActive('frost') && sp.data.die && (curBoss().freeze || [6]).includes(upFace(sp).v) && upFace(sp).kind !== 'wild' && !R.isSkull(upFace(sp));
  // The Fog: Vorschau aus; Elite-Fog versteckt auch den Score
  const fogged = () => bossActive('fog') && ['rolling', 'select', 'scoring'].includes(S.phase);
  const scoreHidden = () => fogged() && !!curBoss().hideScore;
  // Stufe und Ausprägung des Bosses als kurzer Text ("Medium" / "Elite · Hard")
  const tierName = (b) => (b && b.tier ? R.TIER_BY_ID[b.tier].name : '');
  const bossTag = (b = S.boss) => (!b ? '' : b === FATHER_BOSS ? 'Final boss' + (S.bossPhase && isBossBlind() ? '  ·  Phase ' + S.bossPhase + ' of 2' : '') : b === JONNY_BOSS ? 'Final boss' : (b.lv ? b.levelName + '  ·  ' : '') + tierName(b));
  // Text unter dem Boss-Namen: was diese Hand gilt (Judge, Thief), sonst die Regel des Bosses
  function bossDesc() {
    if (!S.boss) return '';
    const b = curBoss();
    if (b && ['select', 'scoring'].includes(S.phase) && isBossBlind()) {
      if (b.id === 'judge' && S.judgeCall) return 'Play ' + S.judgeCall + ' for x' + b.called + ' Power' + (b.other < 1 ? ', anything else x' + b.other : '');
      if (b.id === 'thief') { const st = S.relics.filter((r) => r.stolen).map((r) => R.RELIC_BY_ID[r.id].name); if (st.length) return 'Stolen this hand: ' + st.join(', '); }
    }
    return S.boss.desc;
  }
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
      lucky: S.lucky, luckyRound: S.luckyBlind || 0, whirls: S.whirls, skullsShowing: skullsShowing(), heldCount: heldCount(),
      grow: setOn('growth', 3) ? 1.3 : 1, keep: setOn('growth', 5), mostPlayed: mostPlayed(), rnd: rng('relic'),
      bonusLuck: (cup().luck || 0) + chaosVal('luck') + (S.enc && S.enc.luck === S.ante ? (S.enc.luckAmt || 5) : 0) + Phone.luck(phoneOwned()), formation: formationOn(), linkPips: linkPips(),
      fatigueScale: Phone.fatigueScale(phoneOwned()), phoneCap: Phone.interestCap(phoneOwned()),
      lastHand: S.ach ? S.ach.last : null, handStreak: S.ach ? S.ach.streak : 0,
      bossLv: isBossBlind() && S.boss ? S.boss.lv || 0 : 0, judgeCall: S.judgeCall || null, capPlus: S.ledger || 0, trophies: S.stats ? (S.stats.bosses || 0) + (S.stats.elites || 0) : 0,
      bustPlus: cup().bustPlus || 0, banHands: cup().banHands || null, handCap: cup().handCap || 0,
      ghosts: dice.map((d, i) => (d.data.ghost ? i : -1)).filter((i) => i >= 0), stolen: S.relics.map((r, i) => (r.stolen ? i : -1)).filter((i) => i >= 0),
    }, extra);
  }
  const luck = (extra) => R.luckOf(ctx(extra));
  // Endless: nach Stage 8 wächst das Ziel pro Stage um den Faktor ENDLESS_GROWTH (R.BALANCE)
  function stageBase(ante) {
    if (ante <= ANTE_TARGET.length) return ANTE_TARGET[Math.max(0, ante - 1)];
    const x = ANTE_TARGET[ANTE_TARGET.length - 1] * Math.pow(ENDLESS_GROWTH, ante - ANTE_TARGET.length);
    const step = Math.pow(10, Math.max(0, Math.floor(Math.log10(x)) - 2));
    return Math.round(x / step) * step;
  }
  // Ziel ohne Heat (Stage, Blind, Boss, Chaos-Regel)
  function baseTarget(idx) {
    const base = stageBase(S.ante);
    let factor = BLINDS[idx].factor;
    if (idx === 2 || rushOn()) {
      const bf = S.boss === JONNY_BOSS && cup().exam && S.ante < ANTES ? BLINDS[2].factor : (S.boss && S.boss.factor) || BLINDS[2].factor;
      factor = idx === 2 ? bf : BLINDS[idx].factor * bf / BLINDS[2].factor;
      factor *= Phone.bossScale(phoneOwned());   // Telefon: Soft Spot
    }
    return Math.round(base * factor * (chaosVal('target') || 1));
  }
  // Heat: Wer die letzte Runde weit übertroffen hat, bekommt stärkere Gegner. Der Score der letzten Runde zieht das Ziel
  // zu sich heran (abgerundet), aber nie unter das normale Ziel und nie über das Doppelte davon. Wie stark, hängt vom Tempo ab:
  // Sieg mit Hand 1 = voller Zug (HEAT_PULL), danach weniger, Sieg mit der letzten Hand = keine Heat (S.lastSpeed).
  const heatOn = () => !TUT.active;
  function blindTarget(idx) {
    const base = baseTarget(idx), last = S.lastScore || 0;
    if (!heatOn() || last <= base || (S.enc && S.enc.cool === true)) return base;
    const speed = S.lastSpeed === undefined ? 1 : S.lastSpeed;
    const pull = base + (last - base) * HEAT_PULL * speed * (S.enc && S.enc.cool === 'sip' ? 0.5 : 1) * Phone.heatScale(phoneOwned());
    if (pull <= base) return base;
    const step = Math.pow(10, Math.max(0, Math.floor(Math.log10(pull)) - 1));   // auf 2 Stellen abrunden
    return Math.max(base, Math.min(Math.round(base * HEAT_CAP), Math.floor(pull / step) * step));
  }
  // Heat in Prozent über dem normalen Ziel (0 = keine)
  function heatPct(idx = S.blindIdx) {
    if (!heatOn() || !S.target) return 0;
    return Math.max(0, Math.round((S.target / Math.max(1, baseTarget(idx)) - 1) * 100));
  }
  function blindLabel(idx = S.blindIdx) {
    return (idx === 2 || rushOn()) && S.boss ? { name: S.boss.name, colour: S.boss.colour } : { name: BLINDS[idx].name, colour: P[BLINDS[idx].key] };
  }
  function shuffle(a, rnd = Math.random) {
    for (let i = a.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const fresh = () => { const r = rng('dice'); return [r(), r(), r(), r(), r()]; };
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
    // Flammen in Box-Farbe, hängen an der Box (gleiches Wackeln über J.* und denselben Drehpunkt wie juiced())
    const fz = fuseView(), fc = L.flames.chips, fm = L.flames.mult;
    const chipCol = fz && fz.merged ? P.ORANGE : P.CHIPS;
    eng.setFlame('chips', Object.assign({ intensity: I, colours: [lighten(chipCol, 0.45), chipCol], juice: J.chips, pivot: [fc.x + fc.w / 2, fc.py] }, fc));
    eng.setFlame('mult', Object.assign({ intensity: I, colours: [lighten(P.MULT, 0.38), P.MULT], juice: J.mult, pivot: [fm.x + fm.w / 2, fm.py], hidden: !!(fz && fz.hideMult) }, fm));
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
    if (v > 0 && S.stats) S.stats.earned += v;
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
      d.z = d.dragging ? 100 : 10 + i;
      if (!d.dragging) d.moveTo(dieX(i), dieY() - (d.data.held ? L.die.lift : 0), 0);
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

  // Replay der aktuellen Hand (replay.js): die beste Hand des Runs wird behalten und später für das GIF neu gezeichnet
  let handRec = null;
  const recFrame = (kind) => { if (handRec && dice.every((d) => d.data.die)) Replay.frame(handRec, kind, dice.map(upFace), dice.map((d) => d.data.held)); };
  function recBegin() { handRec = TUT.active ? null : Replay.begin(dice.map((d) => d.data.die.type)); }

  // Zieht Würfel aus dem Beutel (verankerte bleiben liegen) und würfelt sie.
  function newHand() {
    const n = drawCount();
    while (dice.length > n) dice.pop().dissolveOut(0.4);
    const keep = S.anchored.filter((a) => a.i < dice.length && S.bag.includes(a.die));
    S.anchored = [];
    const kept = new Set(keep.map((a) => a.die));
    const pool = shuffle(S.bag.filter((d) => !kept.has(d)), rng('bag'));
    dice.forEach((sp, i) => {
      const a = keep.find((x) => x.i === i);
      Object.assign(sp.data, { held: !!a, anchored: !!a, rerolled: 0, luckyHit: false, rnd: fresh() });
      if (a) { sp.data.die = a.die; sp.data.up = a.up; refreshDieTex(sp); } else { sp.data.die = pool.pop(); sp.data.up = 0; }
    });
    recBegin();
    if (isBossBlind() && S.boss === JONNY_BOSS && !TUT.active) jonnyNewRule();
    bossNewHand();
    S.rerolls = rerollsMax(); S.rerollsHand = 0; S.freeReroll = has('loaded'); S.lucky = 0; S.whirls = 0; S.coldHand = 0;
    S.shifts = shiftsMax();
    phoneSteady();
    fire('newHand');
    if (S.hands === 1 && handsMax() > 1) { jonnyLastHand(); jonnyEvents('lastHand'); }
    layoutDice();
    if (TUT.active) TUT.beginHand();
    animate(outcomes(allIdx().filter((i) => !dice[i].data.anchored), true), eggOpeningRoll);
  }

  // Boss-Regeln, die jede Hand neu gelten: Judge ruft eine Handart aus, Ghost wählt Geisterwürfel, Thief stiehlt Relikte
  function bossNewHand() {
    const lastGhosts = dice.map((d, i) => (d.data.ghost ? i : -1)).filter((i) => i >= 0);
    dice.forEach((d) => { d.data.ghost = false; d.alpha = 1; });
    S.relics.forEach((r) => { delete r.stolen; });
    S.judgeCall = null;
    const b = isBossBlind() ? curBoss() : null;
    if (!b || TUT.active) return;
    if (b.id === 'judge') {
      S.judgeCall = R.judgeCall(rng('boss'), S.lastJudge);
      S.lastJudge = S.judgeCall;
      eng.after(S.played.length ? 0.7 : 3.2, () => { if (S.judgeCall) { eng.popup(L.msg.x, dieY() - 130, 'The Judge calls: ' + S.judgeCall, { colour: lighten(b.colour, 0.45), size: 26, life: 2 }); sfx('boss'); } });
    }
    if (b.id === 'ghost') R.ghostSlots(dice.length, b.n, lastGhosts, rng('boss')).forEach((i) => { dice[i].data.ghost = true; });
    if (b.id === 'thief' && S.relics.length) {
      R.stealSlots(S.relics.length, b.n, rng('boss')).forEach((ri) => {
        S.relics[ri].stolen = true;
        const rs = relicSprites[ri];
        if (rs) eng.after(0.5, () => { rs.juiceUp(0.4); eng.popup(rs.x, fxY(rs), 'Stolen!', { colour: lighten(b.colour, 0.5), size: 20 }); });
      });
      sfx('boss');
    }
  }
  // Geisterwürfel durchsichtig, gestohlene Relikte grau (jedes Bild)
  function bossVisuals() {
    const inPlay = isBossBlind() && ['rolling', 'select', 'scoring'].includes(S.phase);
    dice.forEach((d) => { d.alpha = inPlay && d.data.ghost ? 0.42 + 0.08 * Math.sin(eng.time * 3) : 1; });
    relicSprites.forEach((rs, i) => { if (!rs) return; const st = inPlay && S.relics[i] && S.relics[i].stolen; rs.alpha = st ? 0.35 : 1; });
  }

  // Ergebnisse vorab berechnen (Luck wirkt nur beim Neu-Würfeln mit gehaltenen Würfeln)
  function outcomes(idx, initial, extra) {
    if (TUT.active && !extra) return TUT.rig(idx, initial);   // Tutorial: gezinkte Würfel
    const L = initial ? 0 : luck(extra);
    const targets = initial ? [] : R.luckTargets(dice.filter((d) => d.data.held).map(upFace), has('spiral'));
    const out = {};
    const weigh = phoneWeigh();
    idx.forEach((i) => { const d = dice[i].data; out[i] = R.rollFace(d.die, d.rnd || (d.rnd = fresh()), L, targets, has('loaded_skulls'), weigh); });
    return out;
  }

  // Würfel-Animation; danach ist wieder Eingabe möglich.
  function animate(out, done) {
    S.phase = 'rolling';
    const idx = Object.keys(out).map(Number);
    const rolled = idx.map((i) => dice[i]);
    let pending = idx.length;
    const finishRoll = () => { if (rolled.some((d) => !dice.includes(d))) return;   // inzwischen neue Hand (z. B. neuer Kampf): alte Animation verwerfen
      magnetize(rolled); recFrame('roll'); layoutDice(); S.phase = 'select'; eggAfterRoll(); if (done) done(); autosave(); TUT.event('handReady'); };
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
          if (setEff('reduceMotion')) d.moveTo(x, dieY(), 0); else d.moveTo(x + rand(-8, 8), dieY() - Math.sin((n / 10) * Math.PI) * 60, rand(-0.8, 0.8));
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
    if (shiftMode) return pickShift(die);
    die.data.held = !die.data.held;
    if (!die.data.held) die.data.anchored = false;
    die.juiceUp(0.25);
    sfx('hold', { on: die.data.held });
    TUT.event(die.data.held ? 'hold' : 'unhold', { v: upFace(die).v, i: dice.indexOf(die) });
    eng.emit(die.x, die.y, { count: 8, colours: die.data.held ? [P.ORANGE, P.WHITE] : [P.BLUE, P.WHITE], speed: 180, size: 7, life: 0.4 });
    layoutDice();
  }

  function rerollTargets() { return allIdx().filter((i) => !dice[i].data.held && !frozen(dice[i])); }
  // Kosten eines Rerolls: The Taxman (nie Schulden) und Roulette-Challenge ($1 pro Reroll)
  function rerollFee() {
    let fee = cup().rerollCost || 0;
    if (bossActive('taxman')) fee += R.taxOf(curBoss(), S.rerollsHand, Math.max(0, S.money - fee));
    return fee;
  }

  function reroll(opts = {}) {
    if (S.phase !== 'select') return;
    const every3 = setOn('reroll', 5) && (S.rerollTotal + 1) % 3 === 0;
    const free = S.freeReroll || every3 || !!opts.jonny;
    if (!free && S.rerolls <= 0) return;
    const fee = opts.jonny ? 0 : rerollFee();
    if (fee > 0 && !canPay(fee) && !bossActive('taxman')) return denied(B.roll.x + B.roll.w / 2, B.roll.y - 24, 'Not enough money');
    let idx = rerollTargets();
    if (bossActive('chaos')) {
      const extra = allIdx().filter((i) => dice[i].data.held && !frozen(dice[i]) && !has('lockbox') && rng('boss')() < (curBoss().p || 1 / 3));
      extra.forEach((i) => { dice[i].data.held = false; dice[i].data.anchored = false; eng.popup(dice[i].x, dice[i].y - 70, 'Chaos!', { colour: S.boss.colour, size: 22 }); });
      idx = idx.concat(extra).sort((a, b) => a - b);
    }
    if (!idx.length) { if (dice.length && dice.every((d) => d.data.held)) eggPlacebo(); return; }
    TUT.event('reroll');
    if (fee > 0 && bossActive('taxman')) BT().taxPaid += fee;
    if (fee > 0) { S.money -= fee; J.money.up(0.4); eng.popup(B.roll.x + B.roll.w / 2, B.roll.y - 48, (bossActive('taxman') ? 'Tax ' : '') + '-$' + fee, { colour: P.RED, size: 22 }); sfx('coin'); }
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
    if (has('roulette') && rng('relic')() < 1 / 6) {
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
    idx.forEach((i) => { dice[i].data.luckyHit = !!out[i].lucky; if (out[i].lucky) { lucky++; luckyHit(i, out[i]); } });
    S.lucky += lucky; S.luckyBlind = (S.luckyBlind || 0) + lucky;
    S.stats.rerolls++; S.stats.lucky += lucky;
    achieve('reroll', { n: S.rerollsHand, lucky, luckyRound: S.luckyBlind || 0, round: S.rerollsBlind });
    jobEvent('reroll', { lucky });
    jonnyReroll(lucky);
    jonnyEvents('reroll', { lucky });
    fire('onReroll', [{ lucky, held }]);
    const luckyDice = idx.filter((i) => out[i].lucky).map((i) => dice[i]);
    animate(out, has('lodestone') && luckyDice.length ? () => slideTogether(luckyDice, true, 'lodestone') : null);
  }

  // ── Formation: Würfel tauschen (Shift), Magnetic Table, Lodestone ──────────
  const dieVal = (d) => { const f = d && d.data.die ? upFace(d) : null; return !f || R.isSkull(f) || f.kind === 'wild' || f.kind === 'hex' ? 0 : f.v; };
  const canShift = () => S.phase === 'select' && formationOn() && S.shifts > 0 && dice.length > 1 && !S.choice;
  function nearestSlot(x) {
    let best = -1, bd = 1e9;
    dice.forEach((_, i) => { const dx = Math.abs(dieX(i) - x); if (dx < bd) { bd = dx; best = i; } });
    return best;
  }
  // Tauscht die Würfel auf den Plätzen a und b. free: kostet keinen Shift (Magnetic Table, Lodestone)
  function swapDice(a, b, free) {
    if (a === b || !dice[a] || !dice[b]) return;
    [dice[a], dice[b]] = [dice[b], dice[a]];
    const col = FORM_COL();
    for (const d of [dice[a], dice[b]]) { d.juiceUp(0.35); eng.emit(d.x, d.y, { count: 10, colours: [col, P.WHITE], speed: 200, size: 7, life: 0.45 }); }
    recFrame('shift');
    if (free) return;
    S.shifts--; S.stats.shifts++;
    sfx('card');
    fire('onShift');
    achieve('shift');
    jonnyEvents('shift');
  }
  function dropDie(d, m) {
    d.dragging = false;
    const from = dice.indexOf(d), to = nearestSlot(m.x);
    dragSlot = -1;
    if (from >= 0 && to >= 0 && to !== from && canShift()) swapDice(from, to, false);
    layoutDice();
  }
  let dragSlot = -1;
  // Würfel rutschen neben einen Würfel mit derselben Zahl (gehaltene Würfel bleiben liegen).
  // needHeld: nur neben gehaltene Würfel (Lodestone). Gibt zurück, ob sich etwas bewegt hat.
  function slideTogether(list, needHeld, source) {
    let moved = false;
    for (const d of list) {
      const i = dice.indexOf(d), v = dieVal(d);
      if (i < 0 || !v) continue;
      const same = (j) => j >= 0 && j < dice.length && dieVal(dice[j]) === v && (!needHeld || dice[j].data.held);
      if (same(i - 1) || same(i + 1)) continue;
      const linked = (j) => { const w = dieVal(dice[j]); return !!w && (dieVal(dice[j - 1]) === w || dieVal(dice[j + 1]) === w); };
      let target = -1;
      for (let j = 0; j < dice.length && target < 0; j++) {
        if (j === i || !same(j)) continue;
        for (const t of [j - 1, j + 1]) if (t >= 0 && t < dice.length && t !== i && !dice[t].data.held && dieVal(dice[t]) !== v && !linked(t)) { target = t; break; }
      }
      if (target < 0) continue;
      swapDice(i, target, true);
      moved = true;
    }
    if (!moved) return false;
    layoutDice();
    sfx('magic');
    const rs = source && relicSprite(source);
    if (rs) { rs.juiceUp(0.4); eng.popup(rs.x, fxY(rs), 'Slide!', { colour: lighten(FORM_COL(), 0.3), size: 18 }); }
    else eng.popup(L.msg.x, dieY() - 112, 'Magnetic!', { colour: lighten(FORM_COL(), 0.3), size: 22 });
    return true;
  }
  function magnetize(rolled) {
    if (!upg('magnetic') || !formationOn() || dice.length < 3) return;
    slideTogether(rolled.filter((d) => dice.includes(d) && !d.data.held), false, null);
  }

  function luckyHit(i, o) {
    const f = dice[i].data.die.faces[o.up];
    if (has('lucky_star') && f.kind === 'normal' && rng('relic')() < 0.25) {
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
    if (!handRec && !TUT.active) { recBegin(); recFrame('roll'); }   // Hand kam aus einem Speicherstand
    S.phase = 'scoring';
    S.scoreStep = 0;
    selected = null;
    S.hands--; J.hands.up(0.4);
    fire('beforeHand');
    const coin = bossActive('gambler') ? (rng('boss')() < 0.5 ? 'heads' : 'tails') : null;
    if (coin) { eng.popup(L.msg.x, dieY() - 150, 'The coin spins...', { colour: lighten(curBoss().colour, 0.45), size: 22, life: 1 }); sfx('coin'); }
    const res = R.scoreHand(ctx({
      coin, faces: dice.map(upFace), held: dice.map((d) => d.data.held),
      extras: dice.map((d) => ({ chips: d.data.die.chips || 0, rerolled: d.data.rerolled || 0, lucky: !!d.data.luckyHit })),
    }));
    const prophecy = S.enc && S.enc.prophecy;
    if (prophecy && !res.bust && prophecy.hand === res.name && !TUT.active) {
      res.steps.unshift({ src: 'enc', text: 'Prophecy!', mult: prophecy.power });
      if (--prophecy.left <= 0) S.enc.prophecy = null;
    }
    S.played.push(res.name);
    if (!TUT.active) {
      if (coin) BT().coins.push(coin);
      if (bossActive('judge') && S.judgeCall && res.name === S.judgeCall) BT().judgeHits++;
      if ((res.ghosts || []).some((i) => res.scoring.includes(i))) BT().ghostScoring = true;
    }
    S.handName = res.name; S.handNameT = eng.time; J.name.up(0.3);
    S.chips = res.baseChips; S.mult = res.baseMult; J.chips.up(0.3); J.mult.up(0.3);
    dice.forEach((d, i) => { d.tint = res.scoring.includes(i) ? null : res.used.includes(i) ? ['#374244', 0.4] : ['#1C2426', 0.7]; });
    // Wild-, Hex- und Two-Faced-Seiten zeigen, welche Zahl sie annehmen
    dice.forEach((d, i) => {
      const f = upFace(d), v = res.vals[i];
      if (res.used.includes(i) && v && (f.kind === 'wild' || f.kind === 'hex' || f.kind === 'skull' || (f.kind === 'twin' && v !== f.v))) eng.popup(d.x, d.y + 56, '= ' + v, { colour: P.PURPLE, size: 20 });
      else if (res.keystone && res.keystone.includes(i) && v !== f.v) eng.popup(d.x, d.y + 56, 'Keystone = ' + v, { colour: lighten(FORM_COL(), 0.3), size: 20 });
    });

    eng.queue(() => res.scoring.forEach((i) => dice[i].moveTo(dieX(i), dieY() - 30, 0)), 0.5);
    for (const step of res.steps) eng.queue(() => { applyStep(step); if (handRec) Replay.step(handRec, step, S.chips, S.mult); }, 0.38);
    eng.queue(() => startFuse(Math.round(S.chips * S.mult * res.factor)), 0.6);
    eng.queue(() => {
      if (fuse && !fuse.landed) { S.score += fuse.total; S.dispScore = S.score; }   // falls nicht gezeichnet wurde
      const total = fuse ? fuse.total : 0;
      fuse = null;
      TUT.event('scored', { total });
      const A = S.ach;
      A.streak = res.name === A.last ? A.streak + 1 : 1; A.last = res.name;
      if (res.bust) A.busts++;
      const gold = res.bust ? 0 : res.scoring.filter((i) => dice[i] && dice[i].data.die && ['gold', 'prism'].includes(upFace(dice[i]).kind)).length;
      const fo = res.form && res.form.ok ? res.form : null, st = S.stats;
      st.hands++; st.total += total;
      if (total > st.best) { st.best = total; st.bestName = res.name; }
      if (res.bust) st.busts++;
      if (res.name === 'Five of a Kind' && !res.bust) st.fives++;
      if (fo && !res.bust) { st.links += fo.links; st.chain = Math.max(st.chain, fo.chain.length); if (fo.palindrome) st.palindromes++; }
      if (!A.hc) A.hc = {};
      A.hc[res.name] = (A.hc[res.name] || 0) + 1;
      if (res.bust) A.bustT = Date.now();
      achieve('hand', { name: res.name, total, bust: !!res.bust, skulls: res.skulls, streak: A.streak, gold, chain: fo ? fo.chain.length : 0, palindrome: !!(fo && fo.palindrome),
        boss: isBossBlind() && curBoss() ? curBoss().id : null, order: dice.length === 5 ? res.vals.join('') : '', runCount: A.hc[res.name],
        fiveOf: res.name === 'Five of a Kind' && res.scoring.length ? res.vals[res.scoring[0]] : 0 });
      eggHand(res, total);
      jonnyEvents('hand', { res, total, fo, streak: A.streak });
      jobEvent('hand', { name: res.name, total, bust: !!res.bust, skulls: res.skulls, rerolls: S.rerollsHand, held: heldCount(), vals: res.scoring.map((i) => res.vals[i]) });
      S.jonny.best = Math.max(S.jonny.best, total);
      jonnyHand(res, total);
      if (handRec) {
        const hd = Replay.finish(handRec, { name: res.name, total, chips: S.chips, mult: S.mult, bust: !!res.bust, relics: S.relics.map((r) => r.id), stage: S.ante, cup: S.cup });
        if (Replay.better(hd, S.bestReplay)) S.bestReplay = hd;
        handRec = null;
      }
      S.chips = 0; S.mult = 0; S.handName = ''; afterHand(res);
    }, FUSE.end + 0.25);
    eng.queue(() => {
      dice.forEach((d) => { d.data.held = false; d.data.anchored = false; d.tint = null; });
      if (S.score >= S.target && fatherFight() && S.bossPhase === 1) fatherPhase2();
      else if (S.score >= S.target) return winBlind();
      if (S.hands <= 0) { if (TUT.extraHand()) { S.hands = 1; return newHand(); } return loseRun(); }
      if (isBossBlind() && S.boss && S.boss.id === 'undertow') {
        const nt = Math.round(S.target * (1 + S.boss.grow));
        eng.popup(...spot('total'), 'Undertow +' + Math.round(S.boss.grow * 100) + '%', { colour: lighten(S.boss.colour, 0.5), size: 22 });
        S.target = nt; sfx('boss');
      }
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
    if (profile) { const st = meta().stats; st.hands++; newRecord = !TUT.active && st.bestHand > 0 && total > st.bestHand; st.bestHand = Math.max(st.bestHand, total); }
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
    if (s.src === 'upg' && s.i !== undefined && d) { x = d.x; y = d.y - 70; }
    if (s.src === 'link') { linkFlash(s); return; }
    if (s.src === 'enc') eng.popup(L.msg.x, dieY() - 112, s.text, { colour: lighten(P.PURPLE, 0.35), size: 26, life: 1.1 });
    if (s.src === 'debuff') { d.juiceUp(0.2); eng.popup(x, y, s.ghost ? 'Ghost' : curBoss() && curBoss().id === 'snake' ? 'Eaten!' : 'Debuffed', { colour: s.ghost ? '#C9D6F0' : P.GREY, size: 20 }); return; }
    if (s.src === 'fatigue' || s.src === 'boss') {
      const col = s.src === 'boss' && S.boss ? (s.good ? P.GOLD : lighten((curBoss() || S.boss).colour, 0.35)) : P.GREY;
      eng.popup(L.msg.x, dieY() - 112, s.text, { colour: col, size: 24, life: 1.2 });
      xMult(s.xmult, ...spot('multBox'));
      return;
    }
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
    if (s.src === 'upg') eng.popup(x, y - 26, R.UPGRADE_BY_ID[s.id].name, { colour: s.id === 'spotlight' ? '#FFF0B2' : P.WHITE, size: 18 });
    if (rs) { rs.juiceUp(0.45); rs.flashWhite(0.35); }
    if (d) { d.juiceUp(0.35); d.flashWhite(0.4); }
    if (s.text && rs) eng.popup(x, y - 24, s.text, { colour: P.GOLD, size: 20 });
    if (s.chips) addChips(s.chips, x, y);
    if (s.mult) addMult(s.mult, x, y);
    if (s.xmult) xMult(s.xmult, x, y);
    if (s.money) addMoney(s.money, x, y);
  }

  // Link-Schritt: Blitz zwischen den beiden Würfeln, Kette leuchtet auf
  const linkFx = [];
  function linkFlash(s) {
    const a = dice[s.i], b = dice[s.j];
    if (!a || !b) return;
    const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2, col = FORM_COL();
    linkFx.push({ a, b, t0: eng.time, big: !!s.xmult });
    a.juiceUp(0.3); b.juiceUp(0.3);
    for (let k = 0; k <= 4; k++) eng.emit(lerp(a.x, b.x, k / 4), lerp(a.y, b.y, k / 4), { count: 4, colours: [col, P.WHITE, P.GOLD], speed: 160, size: 7, life: 0.45, shape: 'diamond' });
    sfx('relic', { step: S.scoreStep });
    if (s.chips) { eng.popup(x, y - 66, 'Link', { colour: lighten(col, 0.35), size: 18, life: 0.9 }); addChips(s.chips, x, y - 40); }
    if (s.xmult) xMult(s.xmult, x, y - 40);
  }

  // ── Spielablauf ─────────────────────────────────────────────────────────
  // Boss der Stage: Stufe passend zur Stage (R.bossPool), dann der Elite-Wurf (R.eliteOdds). Stage 8 = Jonny.
  function pickBoss() {
    const rush = !!cup().bossRush && !TUT.active;
    if (!TUT.active && S.endless && S.ante === R.BALANCE.FATHER_STAGE && (!rush || S.blindIdx === 2)) { S.boss = FATHER_BOSS; return; }
    if (!TUT.active && (cup().exam || (S.ante === ANTES && (!rush || S.blindIdx === 2)))) { S.boss = JONNY_BOSS; return; }
    const def = R.pick(R.bossPool(S.ante, S.usedBosses || [], ANTES), rng('boss'));
    const lv = TUT.active ? 0 : R.rollBossLevel(def, R.eliteOdds({ ante: S.ante, antes: ANTES, relics: S.relics, upgrades: S.upgrades, minElite: cup().minElite }), rng('boss'));
    S.boss = R.bossOf(def.id, lv);
    S.usedBosses.push(def.id);
    if (lv) seen('elite', def.id);
  }
  function rollUpgrade() {
    const pool = R.UPGRADES.filter((u) => !S.upgrades.includes(u.id) && open('upgrade', u.id));
    return pool.length ? R.pickWeighted(pool.map((u) => [u.id, R.RARITY[u.rarity].weight]), rng('shop')) : null;
  }

  function startRun(cupId = 'classic', seed) {
    clearMenuSprites();
    S.cup = cupId;
    const c = cup();
    S.ante = 1; S.blindIdx = 0; S.money = c.money; S.vault = 0; S.time = 0; S.chaos = null; S.cupDrawn = false; S.cupDraw = null;
    S.relics = []; S.cons = []; S.upgrades = c.upgrades.slice(); S.levels = {}; S.numLevels = Object.assign({}, c.numLevels); S.handCounts = {}; S.usedBosses = [];
    S.rerollTotal = 0; S.anchored = []; S.msg = null; S.choice = null; S.ach = freshAch();
    S.job = null; S.jonny = freshJonny(); S.jonnyRule = null; S.judgeCall = null; S.lastJudge = null; S.ledger = 0;
    S.rng = Rng.create(seed !== undefined ? seed : window.__WG_SEED); S.bestReplay = null; handRec = null; S.enc = freshEnc(); encNow = null; S.phone = freshPhone(); S.shopFree = 0; phoneNow = null;
    S.endless = false; S.runId = Date.now(); S.stats = freshStats(); S.runAch = []; S.summary = null; S.shifts = 0; S.lastScore = 0; S.lastSpeed = 1;
    S.bag = c.bag.map((type) => R.makeDie(type));
    seen('cup', cupId); [...new Set(c.bag)].forEach((type) => seen('die', type)); c.upgrades.forEach((id) => seen('upgrade', id));
    pickBoss();
    S.upgradeOffer = rollUpgrade();
    refreshBag(); refreshUpgrades();
    c.relics.forEach((id) => addRelic(id));
    if (c.randomRelics) for (let k = 0; k < c.randomRelics.n; k++) { const id = randomRelic(c.randomRelics.rarity, true); if (id) addRelic(id); }
    if (c.jonny) addRelic(R.pick(R.JONNY_RELICS, rng('reward')));
    if (c.chaos) rollChaos();
    if (profile) { meta().lastCup = cupId; lastSaved = ''; }
    const hour = new Date().getHours();
    if (profile && hour >= 2 && hour < 5) secret('night_owl');
    startBlind();
  }

  function startBlind() {
    const lab = blindLabel();
    S.phase = 'rolling';
    S.target = blindTarget(S.blindIdx);
    S.score = 0; S.dispScore = 0; S.hands = handsMax(); S.chips = 0; S.mult = 0; S.handName = '';
    S.played = []; S.rerollsBlind = 0; S.luckyBlind = 0; S.anchored = []; S.jonnyRule = null; S.jonny.help = false; S.bossPhase = 0; S.bossFull = 0;
    S.ach.bt = freshBT();
    if (S.endless && S.ante >= 15 && !TUT.active) tape('jacket');
    if (fatherFight()) {   // Phase 1: halbes Ziel, eine feste Regel für die ganze Phase
      S.bossFull = S.target; S.target = Math.round(S.target * R.BALANCE.FATHER_SPLIT); S.bossPhase = 1;
      S.jonnyRule = R.pick(R.finalRules(null), rng('boss')).id;
    }
    if (isBossBlind()) {
      bgName = 'table';
      eng.setBackgroundColour(S.boss.colour, { contrast: 2 });
      const tag = isFinal() ? '' : bossTag() + (S.boss.lv ? '  ·  Bounty +$' + R.eliteReward(S.boss.lv, ctx()) : '') + '  ·  ';
      showMsg(S.boss.name, S.boss.colour, tag + S.boss.desc, isFinal() ? 3.6 : S.boss.lv ? 3.2 : 2.6);
      sfx('boss');
      seen('boss', S.boss.id);
      if (S.boss.lv) {
        eng.shake(S.boss.lv * 6);
        eng.emit(L.msg.x, L.msg.y, { count: 40 + 30 * S.boss.lv, colours: [S.boss.colour, S.boss.lv === 2 ? P.GOLD : '#D8E0E8', '#FFFFFF'], speed: 520, size: 10, life: 1.1, shape: 'star' });
      }
      if (S.boss === FATHER_BOSS) { eng.shake(16); fatherIntro(); }
      else if (S.boss === JONNY_BOSS) { if (!cup().exam || !S.jonny.examIntro) { S.jonny.examIntro = true; jonnyIntro(); } } else jonnyEvents(S.boss.lv ? 'elite' : 'boss');
    } else {
      setBg('table');
      showMsg(lab.name, lab.colour, 'Reach ' + UI.num(S.target) + ' points' + (heatPct() ? '  ·  Heat +' + heatPct() + '%' : ''), 1.8);
      sfx('chime');
    }
    musicMood(roundMood());
    const heat = heatPct();
    if (!isBossBlind()) { jonnyRoundStart(); if (!heat) jonnyEvents('roundStart'); }
    if (heat) { S.stats.heat = Math.max(S.stats.heat || 0, heat); eng.after(isBossBlind() ? 3.4 : 0.9, () => jonnyEvents('heat')); }   // statt des allgemeinen Rundenspruchs
    fire('startBlind');
    if (TUT.active) TUT.roundStart(S.blindIdx);
    createHandDice(drawCount());
    eng.after(0.6, newHand);
  }

  function winBlind() {
    S.phase = 'won';
    if (S.enc) { S.enc.cool = false; S.enc.freeCool = false; }   // Cooling Spring gilt nur eine Runde
    TUT.event('roundWon');
    achieve('round', { score: S.score, target: S.target, handsLeft: S.hands, handsUsed: S.played.length, rerolls: S.rerollsBlind, boss: isBossBlind() && S.boss ? S.boss.id : null,
      bossLv: isBossBlind() && S.boss ? S.boss.lv || 0 : 0, relics: S.relics.map((r) => r.id), played: S.played.slice(), heat: heatPct(),
      taxPaid: BT().taxPaid, judgeHits: BT().judgeHits, coins: BT().coins.slice(), ghostScoring: BT().ghostScoring, maxFrozen: BT().maxFrozen });
    if (isBossBlind() && S.boss && S.boss.id === 'jonny' && !TUT.active) tape('kid');
    S.relics.forEach((r) => { delete r.stolen; });
    dice.forEach((d) => { d.data.ghost = false; d.alpha = 1; });
    const ii = R.interestInfo(ctx());
    const parts = [['Round', cup().noRoundReward ? 0 : blind().reward + chaosVal('reward')], ['Hands', cup().noHandReward ? 0 : S.hands], ['Interest', ii.amount]];
    const lvWon = isBossBlind() && S.boss && !isFinal() ? S.boss.lv || 0 : 0;
    if (lvWon) {
      parts.push([S.boss.levelName + ' bounty', R.eliteReward(lvWon, ctx())]);
      S.stats.elites = (S.stats.elites || 0) + 1;
      if (upg('bounty_ledger')) { S.ledger = (S.ledger || 0) + lvWon; eng.after(1, () => eng.popup(...spot('money'), 'Interest cap +$' + lvWon, { colour: P.GOLD, size: 20 })); }
    }
    if (isBossBlind() && S.boss && S.boss.id === 'undertow' && S.hands > 0) parts.push(['Undertow', S.hands * S.boss.pay]);
    const phonePay = TUT.active ? 0 : Phone.roundPay(phoneOwned()) + (isBossBlind() ? Phone.bossPay(phoneOwned()) : 0);
    if (phonePay) parts.push(['Phone', phonePay]);
    const jobPay = jobSettle();
    if (jobPay) parts.push(["Jonny's job", jobPay]);
    if (S.jonny.cut) { parts.push(["Jonny's cut", -S.jonny.cut]); S.jonny.cut = 0; }
    S.jonny.last = { score: S.score, target: S.target, boss: isBossBlind() && S.boss ? S.boss.name : null };
    S.lastScore = S.score; S.lastSpeed = R.heatSpeed(S.played.length, handsMax());   // schneller gewonnen = mehr Heat
    if (isBossBlind() && S.boss === JONNY_BOSS) jonnySay(BOSS_TALK.defeat.slice(0, 1), { important: true, replace: true, place: 'corner' });
    if (fatherFight()) { jonnySay(FATHER_TALK.defeat, { important: true, replace: true, place: 'corner' }); if (profile) meta().fatherBeaten = (meta().fatherBeaten || 0) + 1; }
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
    S.stats.rounds++; if (isBossBlind()) S.stats.bosses++;
    if (reward > 0) S.stats.earned += reward;
    jonnyEvents('roundWon', { handsLeft: S.hands, over: S.score - S.target });
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
        const showdown = S.blindIdx === BLINDS.length - 1;
        S.blindIdx++;
        if (S.blindIdx >= BLINDS.length) { S.blindIdx = 0; S.ante++; if (S.ante <= ANTES || S.endless) { pickBoss(); anteStart(); } }
        else if (rushOn()) pickBoss();
        if (S.ante > ANTES && !S.endless) runWon();
        else if (showdown) maybePhone(() => maybeEncounter(enterShop));   // nach jedem Showdown klingelt das Telefon
        else maybeEncounter(enterShop);
      };
      if (TUT.active && isBossBlind()) return;   // Tutorial endet nach dem ersten Showdown
      if (profile && !S.cupDrawn && S.ante === CUP_DRAW_STAGE && S.blindIdx === 2) startCupDraw(go); else go();
    });
  }

  // Neue Ante: Muster-Boni, neues Upgrade-Angebot
  function anteStart() {
    if (S.ante >= 4) masteryCheck('stage');
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
    eggLost();
    setBg('lose');
    jingle('gameover', 4);
    musicMood('lose');
    endRun(false);
    showMsg(S.endless ? 'Endless over' : 'Game Over', S.endless ? P.PURPLE : P.RED, (S.endless ? 'Endless stage ' : 'Stage ') + S.ante + ', ' + blindLabel().name, 999);
    eng.after(1.3, () => jonnyEnd(false));
    eng.after(1.9, () => openSummary());
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
    eng.after(2.2, () => openSummary());
    eng.emit(L.msg.x, L.msg.y, { count: 120, colours: [P.MONEY, P.GOLD, '#FFFFFF'], speed: 700, size: 12, life: 1.6, gravity: 500, shape: 'star' });
  }

  // Endless: nach dem Sieg weiterspielen. Der Sieg ist schon verbucht; Karten und Beutel kommen zurück.
  function startEndless() {
    if (S.phase !== 'runWon' || S.endless || !S.summary) return;
    S.endless = true; S.summary = null; S.msg = null;
    eng.events.length = 0; eng.timers.length = 0;
    jonnyClear();
    rebuildSprites();
    pickBoss(); anteStart();
    enterShop();
    showMsg('Endless mode', P.PURPLE, 'The targets keep growing. How far can you go?', 2.8);
    jingle('cupdraw', 2.5);
    eng.after(0.6, () => jonnyEvents('endless'));
  }
  // Relikte, Verbrauchsgüter, Beutel und Upgrades wieder auf den Tisch legen (Spielstand laden, Endless)
  function rebuildSprites() {
    refreshBag(); refreshUpgrades();
    const owned = (item, kind, pos, i, n) => {
      const p = pos(i, n), sp = eng.sprite({ tex: itemTex(item), x: p.x, y: p.y, s: CARD_S, z: 20 + i, tiltStrength: 0.8, ambient: 2.2, data: { kind, item } });
      sp.materialize(0.5 + i * 0.08, { colours: [P.WHITE, TYPE_COL[item.type]] });
      return sp;
    };
    relicSprites = S.relics.map((it, i) => owned(it, 'relic', L.relicPos, i, S.relics.length));
    consSprites = S.cons.map((it, i) => owned(it, 'cons', L.consPos, i, S.cons.length));
  }

  function clearSprites(opts) {
    for (const s of dice.concat(relicSprites, consSprites, bagSprites, shopSprites, upgSprites)) if (s) s.dissolveOut(0.8, opts);
    dice = []; relicSprites = []; consSprites = []; bagSprites = []; shopSprites = []; upgSprites = [];
    selected = null; S.choice = null;
  }

  function backToMenu() {
    S.summary = null;
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
    S.summary = null;
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
    'coldHand', 'shop', 'shopRerollCost', 'upgradeOffer', 'bought', 'pruneUsed', 'chaos', 'cupDrawn', 'ach', 'job', 'jonny', 'jonnyRule', 'bossPhase', 'bossFull',
    'shifts', 'endless', 'runId', 'stats', 'runAch', 'lastScore', 'lastSpeed', 'luckyBlind', 'rng', 'bestReplay', 'enc', 'judgeCall', 'lastJudge', 'ledger', 'chal', 'phone', 'shopFree'];

  function snapshot() {
    const bi = (d) => S.bag.indexOf(d);
    const snap = { phase: S.phase, boss: S.boss && S.boss.id, bossLv: S.boss ? S.boss.lv || 0 : 0 };
    for (const k of RUN_KEYS) snap[k] = S[k];
    snap.anchored = S.anchored.map((a) => ({ i: a.i, die: bi(a.die), up: a.up }));
    snap.hand = S.phase === 'select' ? dice.map((d) => ({ die: bi(d.data.die), own: bi(d.data.die) < 0 ? d.data.die : undefined, up: d.data.up,
      held: !!d.data.held, anchored: !!d.data.anchored, rerolled: d.data.rerolled || 0, rnd: d.data.rnd, ghost: !!d.data.ghost })) : [];
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
      meta().stats.bestStage = Math.max(meta().stats.bestStage, Math.min(S.ante, ANTES));
      if (S.endless) meta().stats.bestEndless = Math.max(meta().stats.bestEndless || 0, S.ante);
    }
    if (profile.run) { Saves.save(slot, profile); slotData[slot] = profile; }
    Saves.saveMeta();
  }
  // Run zu Ende: Statistik fortschreiben, der Platz wird wieder frei
  // Run zu Ende: Statistik fortschreiben, Eintrag in die Laufhistorie, der Platz wird wieder frei.
  // Im Endless-Modus ist der Sieg schon gezählt: dann wird nur der Eintrag der Historie aktualisiert.
  function endRun(won) {
    S.summary = null;
    if (!profile) return;
    const st = meta().stats;
    if (!S.endless) { st.runs++; if (won) st.wins++; }
    st.bestStage = Math.max(st.bestStage, Math.min(S.ante, ANTES));
    if (S.endless) st.bestEndless = Math.max(st.bestEndless || 0, S.ante);
    profile.run = null; lastSaved = '';
    if (!S.endless) { achieve('run', { won, busts: S.ach.busts, relicCount: S.relics.length, cup: S.chal ? null : S.cup }); chalFinish(won); }
    recordHistory(won || S.endless);
    Saves.remove(slot); slotData[slot] = null;
    Saves.saveMeta();
  }
  function saveAndQuit() {
    if (!canQuit()) return;
    eggQuit();
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
    S.endless = false; S.stats = null; S.runAch = []; S.runId = 0; S.shifts = undefined; S.lastScore = 0; S.rng = null; S.bestReplay = null; handRec = null; S.enc = null; encNow = null;
    S.phone = null; S.shopFree = 0; phoneNow = null;
    for (const k of RUN_KEYS) if (snap[k] !== undefined) S[k] = snap[k];
    if (!S.rng) S.rng = Rng.create();   // ältere Speicherstände
    S.enc = Object.assign(freshEnc(), S.enc || {});
    S.phone = Object.assign(freshPhone(), S.phone || {});
    S.jonny = Object.assign(freshJonny(), S.jonny);
    S.judgeCall = null; S.lastJudge = null; S.ledger = 0; S.chal = null;
    for (const k of ['judgeCall', 'lastJudge', 'ledger', 'chal']) if (snap[k] !== undefined) S[k] = snap[k];
    S.boss = bossById(snap.boss, snap.bossLv);
    if (!S.boss) pickBoss();
    S.anchored = (snap.anchored || []).map((a) => ({ i: a.i, die: S.bag[a.die], up: a.up })).filter((a) => a.die);
    S.time = snap.time || 0; S.choice = null; S.msg = null; S.chips = 0; S.mult = 0; S.handName = ''; S.dispScore = S.score;
    selected = null; fuse = null; lastSaved = '';
    S.stats = Object.assign(freshStats(), S.stats || {}); S.runAch = S.runAch || []; S.runId = S.runId || Date.now(); S.summary = null;
    if (S.shifts === undefined) S.shifts = shiftsMax();
    rebuildSprites();
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
          data: { kind: 'die', die, up: h.up, held: h.held, anchored: h.anchored, rerolled: h.rerolled, rnd: h.rnd, ghost: !!h.ghost } });
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
    got.forEach((a) => { toasts.push({ a, t0: null }); if (S.runAch && !S.runAch.includes(a.id)) S.runAch.push(a.id); });
    Saves.saveMeta();
  }
  // Secrets: kommen auch aus Menü und Tutorial (ohne laufenden Run)
  function secret(id) {
    if (!ACH || ACH.earned(meta(), id)) return;
    const got = ACH.record(meta(), 'secret', { id });
    if (!got.length) return;
    got.forEach((a) => { toasts.push({ a, t0: null }); if (!inMenus() && S.runAch && !S.runAch.includes(a.id)) S.runAch.push(a.id); });
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
      brokeAnte: S.money <= 0 ? (S.ach.brokeAnte = S.ante) : S.ach.brokeAnte, leveled: Object.values(S.levels || {}).filter((v) => v >= 2).length,
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
  const COSMETIC_KINDS = ['background', 'material', 'swatch', 'feature'];
  function rewardName(kind, id) {
    if (kind === 'relic') return R.RELIC_BY_ID[id].name;
    if (kind === 'oracle') return R.ORACLE_BY_ID[id].name;
    if (kind === 'upgrade') return R.UPGRADE_BY_ID[id].name;
    if (kind === 'die') return R.DIE_TYPES[id].name;
    if (kind === 'palette') return (PALETTES.find((x) => x.id === id) || { name: id }).name + ' colours';
    if (kind === 'cupmode') return (CUP_BY_ID[id] || { name: id }).name;
    if (kind === 'background') return (BG_STYLES.find((x) => x.id === id) || { name: id }).name + ' background';
    if (kind === 'material') return Cos.MATERIAL_BY_ID[id].name + ' dice';
    if (kind === 'swatch') return Cos.SWATCH_BY_ID[id].name + ' colour';
    if (kind === 'feature') return 'Colour Studio';
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
    } else if (COSMETIC_KINDS.includes(kind)) {
      const col = kind === 'swatch' ? Cos.SWATCH_BY_ID[id].hex : kind === 'background' ? P.BLUE : kind === 'material' ? '#E8E8E8' : P.GOLD;
      UI.box(ctx, x, y, size, size, { colour: col, radius: 6, shadow: false, outline: '#FFFFFF', outlineWidth: 1 });
      const letter = { background: 'Bg', material: 'M', feature: 'CS' }[kind];
      if (letter) UI.text(ctx, letter, x + size / 2, y + size / 2, { size: size * 0.45, colour: kind === 'material' ? P.BLACK : P.WHITE, shadow: false });
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
    if (kind === 'palette') return { title: rewardName(kind, id), desc: 'A colour palette. Pick it under Settings > Style.', badge: ['Palette', P.PURPLE] };
    if (kind === 'background') return { title: rewardName(kind, id), desc: 'A background style. Pick it under Settings > Style.', badge: ['Cosmetic', P.PURPLE] };
    if (kind === 'material') return { title: rewardName(kind, id), desc: Cos.MATERIAL_BY_ID[id].desc + ' Pick it under Settings > Style.', badge: ['Cosmetic', P.PURPLE] };
    if (kind === 'swatch') return { title: rewardName(kind, id), desc: 'A special colour for the Colour Studio.', badge: ['Cosmetic', P.PURPLE] };
    if (kind === 'feature') return { title: 'Colour Studio', desc: 'Mix your own background and UI colours. Open it under Settings > Style.', badge: ['Feature', P.PURPLE] };
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
    UI.text(ctx, a.head || (a.secret ? 'Secret achievement unlocked' : 'Achievement unlocked'), x + 70, y + 20, { size: 15, colour: accent, align: 'left' });
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
    const art = !locked && window.WGCupArt && window.WGCupArt.get(tag);
    if (art) return art;
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
  window.addEventListener('wg-cup-art-ready', ({ detail: id }) => {
    const art = window.WGCupArt.get(id);
    rewardModeCups[id] = art;
    if (id === 'chaos') rewardCup = art;
    const tex = texCache['cup:' + id];
    if (tex) {
      tex.source = art; tex.w = art.width; tex.h = art.height;
      eng.updateTexture(tex, art);
    }
  });
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
      const sp = eng.sprite({ tex: cupTex(c), w: 36, h: 48, x: cupX(i), y: 300, s: 3, z: 5 + i, tiltStrength: 0.8, ambient: 1.6, data: { kind: 'cup', i } });
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
    S.chal = null;
    startRun(c.id);
  }

  // ── Cup Draw: 3 zufällige Becher als Belohnung (Showdown von Stage CUP_DRAW_STAGE, einmal pro Run) ──
  let cupDrawSprites = [], hiddenForDraw = [];
  function startCupDraw(then) {
    const pool = drawableCups();
    const ids = [0, 1, 2].map(() => R.pick(pool, rng('reward')).id);
    S.cupDrawn = true;
    S.cupDraw = { ids, then, t0: eng.time };
    // Karten und Würfel kurz ausblenden, damit die Becher frei stehen
    hiddenForDraw = relicSprites.concat(consSprites, bagSprites, upgSprites).filter((sp) => sp && sp.visible);
    hiddenForDraw.forEach((sp) => { sp.visible = false; });
    cupDrawSprites = ids.map((id, k) => {
      const c = CUP_BY_ID[id];
      const sp = eng.sprite({ tex: cupTex(c), w: 36, h: 48, x: L.msg.x + (k - 1) * (MOBILE ? 250 : 200), y: MOBILE ? 290 : 300, s: 3.2, z: 60, tiltStrength: 0.8, ambient: 1.6, data: { kind: 'cupdraw', id } });
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
      if (pool.length) return R.pick(pool, rng('reward')).id;
    }
    return null;
  }
  function rollChaos() {
    const c = R.pick(CHAOS.filter((x) => x.id !== S.chaos), rng('chaos'));
    S.chaos = c.id;
    if (c.money) addMoney(c.money, ...spot('money'));
    if (c.level) { const h = R.pick(R.HAND_ORDER, rng('chaos')); S.levels[h] = (S.levels[h] || 1) + 1; }
    if (c.gift && S.relics.length < relicMax()) { const id = randomRelic(c.gift); if (id) addRelic(id); }
    if (S.ante > 1) eng.after(0.3, () => { showMsg('Chaos: ' + c.name, P.PURPLE, c.desc, 2.4); sfx('magic'); jonnyEvents('chaos', { rule: c.name }); });
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
    seen('relic', id);
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
      id = (pool.length ? R.pick(pool, rng('reward')) : R.RELIC_BY_ID.golden_vine).id;
    } else {
      const counts = R.tagCounts(S.relics.filter((_, k) => k !== ri));
      let best = null;
      for (const t of Object.keys(R.VINES)) if ((counts[t] || 0) > 0 && (!best || counts[t] > counts[best])) best = t;
      id = R.VINES[best || R.pick(Object.keys(R.VINES), rng('reward'))].id;
    }
    const def = R.RELIC_BY_ID[id], item = newRelicItem(id);
    S.relics[ri] = item;
    seen('relic', id);
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
    if (def.inHand && S.phase !== 'select') return { ok: false, why: 'Use it during a hand' };
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
    S.stats.used++;
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
      sp.data.die = R.pick(S.bag.filter((x) => !inHand.has(x)), rng('bag')) || R.pick(S.bag, rng('bag'));
      sp.data.held = false; sp.data.anchored = false; sp.data.rnd = fresh();
      eng.emit(sp.x, sp.y, { count: 40, colours: [P.RED, P.ORANGE, '#FFFFFF'], speed: 480, size: 10, life: 0.8 });
      eng.shake(6);
      refreshBag();
      fire('onDestroy');
      achieve('destroy');
      animate(outcomes([dice.indexOf(sp)], true));
    } else if (def.id === 'windfall') {
      addMoney(Math.min(20, Math.max(0, S.money)), ...spot('money'));
    } else if (def.id === 'sleight') {
      S.shifts += 3;
      dice.forEach((d) => { d.juiceUp(0.3); eng.emit(d.x, d.y, { count: 8, colours: [FORM_COL(), P.TAROT, '#FFFFFF'], speed: 220, size: 7, life: 0.5, shape: 'star' }); });
      eng.popup(L.msg.x, dieY() - 112, '+3 Shifts', { colour: lighten(FORM_COL(), 0.3), size: 24 });
    }
    layoutDice();
  }

  function sellSelected() {
    const sp = selected; if (!sp || !['select', 'shop'].includes(S.phase) || !['relic', 'cons'].includes(sp.data.kind)) return;
    const item = sp.data.item;
    S.stats.sold++;
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
  const constPrice = (hand) => (upg('telescope') ? 2 : 3) + Math.max(0, ((hand && S.levels[hand]) || 1) - 1);   // +$1 pro Stufe der Hand
  function genItem(existing) {
    const shopRnd = rng('shop'), r = shopRnd();
    if (r < 0.52) {
      const taken = new Set(S.relics.map((x) => x.id).concat(existing.filter((x) => x.type === 'relic').map((x) => x.id)));
      const pool = R.RELICS.filter((d) => !d.hidden && !taken.has(d.id) && open('relic', d.id));
      if (pool.length) { const id = R.pickWeighted(pool.map((d) => [d.id, R.RARITY[d.rarity].weight]), rng('shop')); return { type: 'relic', id, price: R.RELIC_BY_ID[id].cost }; }
    }
    if (r < 0.74) { const hand = R.pick(R.HAND_ORDER, rng('shop')); return { type: 'constellation', hand, price: constPrice(hand) }; }
    if (r < 0.88) return { type: 'oracle', id: R.pick(R.ORACLES.filter((q) => open('oracle', q.id) && !(cup().banOracles || []).includes(q.id)), rng('shop')).id, price: 3 };
    return { type: 'tally', n: 1 + ((shopRnd() * 6) | 0), price: 3 };
  }
  function genDie() {
    const c = cup(), ok = (k) => (c.shopDice ? c.shopDice.includes(k) : true) && !(c.banDice || []).includes(k);
    const type = R.pickWeighted(Object.entries(R.DIE_TYPES).filter(([k, d]) => d.weight > 0 && (open('die', k) || (c.shopDice && c.shopDice.includes(k))) && ok(k)).map(([k, d]) => [k, d.weight]), rng('shop'));
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
      else if (k === 2 && upg('telescope') && mp) S.shop[k] = { type: 'constellation', hand: mp, price: constPrice(mp) };
      else if (TUT.active) S.shop[k] = TUT.shopItem(k);
      else S.shop[k] = genItem(others);
      if (S.shop[k] && !TUT.active) S.shop[k].price = Phone.price(S.shop[k].price, phoneOwned());   // Telefon: Regular
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
    S.shopRerollCost = 1; S.bought = false; S.pruneUsed = false; S.shopFree = TUT.active ? 0 : Phone.freeRerolls(phoneOwned());
    S.shop = [null, null, null, null, null]; shopSprites = [null, null, null, null, null];
    TUT.event('shop');
    stockShop([0, 1, 2, 3, 4]);
    if (!TUT.active) { S.jonny.visit++; S.jonny.rerolls = 0; maybeSpecial(); S.job = newJob(); shopHello(); }
    autosave();
  }

  function rerollShop() {
    if (S.phase !== 'shop') return;
    if (S.shopFree > 0) S.shopFree--;   // Telefon: Fresh Stock (kostet nichts und macht den nächsten nicht teurer)
    else {
      if (!canPay(S.shopRerollCost)) return;
      S.money -= S.shopRerollCost; J.money.up(0.3);
      S.stats.spent += S.shopRerollCost;
      S.shopRerollCost++;
    }
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
    S.stats.spent += it.price; S.stats.bought++;
    if (it.type === 'relic' && it.id !== 'crossroads') seen('relic', it.id);
    else if (it.type === 'upgrade') seen('upgrade', it.id);
    else if (it.type === 'oracle') seen('oracle', it.id);
    else if (it.type === 'die') seen('die', it.dieType);
    if (it.id === 'crossroads') seen('relic', 'crossroads');
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
      if (it.id === 'challengers_bell' && S.boss && !isFinal() && !S.boss.lv && S.boss.def.lv.length > 1) { S.boss = R.bossOf(S.boss.id, 1); seen('elite', S.boss.id); }
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
    return shuffle(R.TAG_ORDER.slice(), rng('shop'))
      .map((tag) => ({ tag, def: R.strongestOfTag(tag, owned, rng('shop'), (d) => open('relic', d.id)) }))
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
    shopBye();
    for (const s of shopSprites) if (s) s.dissolveOut(0.4);
    shopSprites = []; S.shop = null; selected = null;
    startBlind();
  }

  // ── Eingabe ─────────────────────────────────────────────────────────────
  let press = null;
  eng.on('down', (m) => {
    focusBtn = null;
    if (S.phase === 'scoring' && SETTINGS.skipScore === 'tap' && !settingsOpen && !TUT.active) scoreFast = true;
    if (settingsOpen && setPane === 'settings' && !setAsk && !studioOpen) { const k = sliderAt(m); if (k >= 0) { sliderDrag = k; setSlider(k, m); return; } }
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
    if (S.phase === 'codex' && !settingsOpen) { codexClick(m); return; }
    if (S.phase === 'challenges' && !settingsOpen) { chalClick(m); return; }
    if (S.phase === 'history' && !settingsOpen) { historyClick(m); return; }
    if (MOBILE && S.summary && !settingsOpen) {
      const hh = sumHits.find((q) => UI.inside(q.r, m));
      if (hh && hh.info) openTip({ key: 'sum:' + hh.r.x + ':' + hh.r.y, anchor: hh.r, info: hh.info }); else tips = [];
      return;
    }
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
    // Würfel: Klick hält ihn (beim Loslassen), Ziehen auf einen anderen Platz tauscht die beiden (Shift)
    if (k === 'die') { press = { die: h, x: m.x, y: m.y, dx: h.x - m.x, dy: h.y - m.y }; return; }
    if (k === 'relic' || k === 'cons') { press = { sprite: h, x: m.x, y: m.y, dx: h.x - m.x, dy: h.y - m.y }; return; }
    if (MOBILE) { press = { tap: h }; return; }
    if (k === 'bagdie' && actFor(h)) { selected = selected === h ? null : h; h.juiceUp(0.3); return; }
    h.juiceUp(0.3);
  });
  eng.on('move', (m) => {
    if (sliderDrag >= 0) { setSlider(sliderDrag, m); return; }
    if (longPress && !longPress.fired && Math.hypot(m.x - longPress.x, m.y - longPress.y) > 14) longPress = null;
    if (press && press.die) { dragDie(m); return; }
    if (!press || !press.sprite || press.sprite.data.kind !== 'relic' || S.phase === 'scoring') return;
    const s = press.sprite;
    if (!s.dragging && Math.hypot(m.x - press.x, m.y - press.y) > (MOBILE ? 14 : 8)) { s.dragging = true; s.juiceUp(0.15); sfx('card'); if (MOBILE) { tips = []; longPress = null; } }
    if (s.dragging) { s.moveTo(m.x + press.dx, m.y + press.dy, 0); s.z = 100; }
  });
  eng.on('up', (m) => {
    if (MOBILE) firstTouch();
    if (sliderDrag >= 0) { const key = setRows()[sliderDrag].key; sliderDrag = -1; if (key !== 'music') sfx('coin'); return; }
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
      if (press.drag) dropDie(press.die, m);
      else if (!press.denied && !press.die._dead) toggleHold(press.die);
    } else if (press.tap) {
      tapSprite(press.tap);
    } else if (press.sprite) {
      const s = press.sprite;
      selected = selected === s ? null : s; s.juiceUp(0.25); sfx('card');
      if (MOBILE) tips = selected === s ? [{ key: s, sprite: s }] : [];
    }
    press = null;
  });
  // Würfel ziehen: ab ein paar Pixeln Bewegung wird aus dem Klick ein Shift (falls noch einer übrig ist)
  function dragDie(m) {
    const d = press.die;
    if (press.denied || d._dead || !formationOn()) return;
    if (!press.drag) {
      if (Math.hypot(m.x - press.x, m.y - press.y) <= (MOBILE ? 16 : 9)) return;
      if (S.phase !== 'select') return;
      if (!canShift()) { press.denied = true; denied(d.x, d.y - 74, 'No Shifts left'); return; }
      press.drag = true; d.dragging = true; d.juiceUp(0.15); sfx('card');
      if (MOBILE) { tips = []; longPress = null; }
    }
    d.moveTo(m.x + press.dx, m.y + press.dy, clamp((m.x - press.x) * 0.002, -0.25, 0.25));
    d.z = 100;
    dragSlot = nearestSlot(m.x);
  }
  function onButton(b) {
    if (studioButton(b)) return;
    if (b === B.shift) return toggleShiftMode();
    if (b.encRow !== undefined) return encPress(b.encRow);
    if (b.phoneCard !== undefined) return phonePick(b.phoneCard);
    if (b.phoneAct === 'answer') return phoneAnswer();
    if (b.phoneAct === 'ignore') return phoneIgnore();
    if (b === B.gif) return saveGif(S.phase === 'history' ? history()[histSel] : S.summary);
    if (b === B.play) playHand();
    else if (b === B.roll) reroll();
    else if (b === B.start) pressPlay();
    else if (b === B.tutYes) TUT.answer(true);
    else if (b === B.tutNo) TUT.answer(false);
    else if (b === B.tutDone) finishTutorial();
    else if (b === B.tutSlot) startTutorial();
    else if (b === B.tutX) TUT.closeX();
    else if (b === B.options) openSettings('settings');
    else if (b === B.settings) openSettings(MOBILE ? 'settings' : 'pause');
    else if (b === B.close) closeSettings();
    else if (b === B.apply) applyAndKeep();
    else if (b === B.askApply) { applyAndKeep(); leaveSettings(); }
    else if (b === B.askDiscard) { discardSettings(); leaveSettings(); }
    else if (b === B.askStay) { setAsk = false; sfx('panel', { close: true }); }
    else if (b === B.resume) { settingsOpen = false; sfx('panel', { close: true }); }
    else if (b === B.pStats) { setPane = 'stats'; sfx('page'); }
    else if (b === B.pSettings) openSettings('settings', true);
    else if (b === B.pBack) { setPane = 'pause'; sfx('page'); }
    else if (b === B.quit) saveAndQuit();
    else if (b.setTab !== undefined) { if (setTab !== b.setTab) { setTab = b.setTab; setInfo = 0; clearLockView(); sfx('page'); } }
    else if (b.setRow !== undefined) { const key = SET_TABS[b.inTab].rows[b.setRow].key; if (b.action) settingAction(key, b); else changeSetting(key, b.dir); }
    else if (b === B.trophies) openTrophies();
    else if (b === B.codex) openCodex();
    else if (b === B.history) openHistory();
    else if (b.codexTab !== undefined) { if (codexTab !== b.codexTab) { codexTab = b.codexTab; codexPage = 0; codexSel = null; sfx('page'); } }
    else if (b === B.pagePrev) { if (S.phase === 'codex') turnCodexPage(-1); else turnHistoryPage(-1); }
    else if (b === B.pageNext) { if (S.phase === 'codex') turnCodexPage(1); else turnHistoryPage(1); }
    else if (b === B.share) shareRecord(S.phase === 'history' ? history()[histSel] : S.summary);
    else if (b === B.endless) startEndless();
    else if (b === B.retry) retryRun();
    else if (b === B.home) backToMenu();
    else if (b === B.back) { if (S.phase === 'challenges') openCups(); else if (S.phase === 'cups') openSlots(); else if (S.phase === 'history' && histSel >= 0) { histSel = -1; tips = []; sfx('page'); } else setupMenu(); }
    else if (b === B.begin) beginRun();
    else if (b === B.challenges) openChallenges();
    else if (b === B.chStart) chalStart();
    else if (b.chTab !== undefined) { chTab = b.chTab; chHits = []; tips = []; sfx('page'); }
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
    if (e.key === 'Tab') { e.preventDefault(); moveFocus(e.shiftKey ? -1 : 1); return; }
    if ((e.key === 'Enter' || k === ' ') && focusBtn && activeButtons().includes(focusBtn) && !focusBtn.disabled) { e.preventDefault(); sfx('click'); onButton(focusBtn); return; }
    if (S.phase === 'menu' && !settingsOpen && konamiKey(k)) return;
    const tw = typedWord(k);
    if (tw.word === 'jonny' && tw.n === 5) { typed = ''; callJonny(); return; }
    if (tw.word && tw.word !== 'jonny' && tw.n === tw.word.length && !settingsOpen) { menuWord(tw.word); return; }
    if (tw.n >= 2) return;   // Tasten gehören zu einem Wort (o und n öffnen sonst Einstellungen / überspringen den Song)
    if (k === 'n' && !e.repeat) { skipSong(); return; }   // Song überspringen, überall
    if (TUT.modal) return;
    if (k === ' ' && TUT.active && !settingsOpen) { e.preventDefault(); TUT.advance(); return; }
    if (k === ' ' && !settingsOpen && JS.cur) { e.preventDefault(); advanceJonny(); return; }
    if (k === 'h') return toggleDevPanel();
    if (k === 'escape') {
      focusBtn = null;
      if (settingsOpen && studioOpen) { studioOpen = false; sfx('panel', { close: true }); }
      else if (settingsOpen) escSettings(); else if (S.phase === 'challenges') openCups(); else if (S.phase === 'cups') openSlots();
      else if (S.phase === 'history' && histSel >= 0) { histSel = -1; tips = []; sfx('page'); }
      else if (['slots', 'trophies', 'codex', 'history'].includes(S.phase)) setupMenu();
      else if (selected) selected = null;
      else if (!inMenus() && !TUT.modal) openSettings(MOBILE ? 'settings' : 'pause');   // Pause: Menü mit der Statistik des Runs
      return;
    }
    if (k === 'o') { if (!settingsOpen) openSettings('settings'); else if (setPane === 'settings' && !studioOpen) closeSettings(); return; }
    if (S.choice || settingsOpen) return;
    if (k === ' ' && S.phase === 'scoring' && SETTINGS.skipScore === 'tap' && !TUT.active) { e.preventDefault(); scoreFast = true; return; }
    if ((k === '[' || k === ']') && !inMenus()) return cycleSelected(k === ']' ? 1 : -1);
    if (k === 's' && shiftBtnOn()) return toggleShiftMode();
    if (S.cupDraw) { if (e.key === 'Enter') collectCups(); return; }
    if (S.phase === 'menu' && e.key === 'Enter') return onButton(B.start);
    if (S.phase === 'slots' && /^[1-3]$/.test(e.key)) return pickSlot(+e.key - 1);
    if (S.phase === 'slots' && e.key === '4' && tutorialSeen()) return startTutorial();
    if (S.phase === 'trophies') {
      if (e.key === 'ArrowLeft') return turnTrophyPage(-1);
      if (e.key === 'ArrowRight') return turnTrophyPage(1);
    }
    if (S.phase === 'codex') {
      if (e.key === 'ArrowLeft') return turnCodexPage(-1);
      if (e.key === 'ArrowRight') return turnCodexPage(1);
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { codexTab = (codexTab + (e.key === 'ArrowDown' ? 1 : CODEX_TABS.length - 1)) % CODEX_TABS.length; codexPage = 0; codexSel = null; sfx('page'); return; }
    }
    if (S.phase === 'history' && histSel < 0) {
      if (e.key === 'ArrowLeft') return turnHistoryPage(-1);
      if (e.key === 'ArrowRight') return turnHistoryPage(1);
    }
    if (S.phase === 'cups') {
      if (e.key === 'Enter') return beginRun();
      if (e.key === 'ArrowLeft') return selectCup(cupSel - 1);
      if (e.key === 'ArrowRight') return selectCup(cupSel + 1);
    }
    if (S.phase === 'shop' && e.key === 'Enter') return leaveShop();
    if (S.phase === 'phone') { phoneKey(e); return; }
    if (S.phase === 'encounter' && /^[1-8]$/.test(e.key)) { const b = encButtons()[+e.key - 1]; if (b && !b.disabled) { sfx('click'); onButton(b); } return; }
    if (S.phase === 'select') {
      if (e.key === 'Enter') playHand();
      else if (k === 'r') reroll();
      else if (/^[1-6]$/.test(e.key) && dice[+e.key - 1]) toggleHold(dice[+e.key - 1]);
    }
  });
  function toggleDevPanel() { document.getElementById('dev').classList.toggle('open'); }

  // ── Update ──────────────────────────────────────────────────────────────
  function update() {
    bossVisuals();
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
    if (!MOBILE) placeSettingsPC();
    B.apply.disabled = !setDirty();
    B.pStats.disabled = !S.stats || TUT.active;
    for (const b of SET_BTNS) if (!b.action) b.disabled = !!(SETTINGS.photosafe && SAFE_KEYS.includes(SET_TABS[b.inTab].rows[b.setRow].key));
    B.begin.disabled = !cupAt(cupSel);
    if (!MOBILE) {
      // Knopfreihen unten mittig auf 640 ausrichten (Abstand 30)
      const row = S.phase === 'cups' ? [B.back, B.begin, ...(Chal && profile ? [B.challenges] : [])]
        : S.phase === 'challenges' ? [B.back, ...(chTab < 2 ? [B.chStart] : [])] : [B.back];
      let x = 640 - (row.reduce((a, b) => a + b.w, 0) + 30 * (row.length - 1)) / 2;
      for (const b of row) { b.x = x; x += b.w + 30; }
      if (S.phase !== 'cups') B.begin.x = 610;
    }
    B.cupPrev.disabled = cupSel <= 0; B.cupNext.disabled = cupSel >= cupList.length - 1;
    B.achPrev.disabled = achPage <= 0; B.achNext.disabled = achPage >= achPages() - 1;
    SET_TAB_BTNS.forEach((b, i) => { b.colour = i === setTab || (SET_TABS[i].id === 'access' && SET_TABS[setTab].id === 'access2') ? P.BLUE : darken(P.PANEL, 0.1); });
    for (const b of SET_BTNS) if (b.action) {
      const sure = confirmBtn && confirmBtn.b === b, row = SET_TABS[b.inTab].rows[b.setRow];
      b.label = sure ? 'Sure?' : row.key === 'studio' && !studioOwned() ? 'Locked' : row.action;
    }
    updateAccess();
    if (S.phase === 'encounter') placeEncounter();
    if (S.phase === 'phone') { placePhone(); phoneTick(); }
    B.gif.disabled = gifBusy; B.gif.label = gifBusy ? 'Saving...' : 'Save GIF';
    trackSong();
    updateHead();
    eggTick();
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
      if (idle > 75) jonnyEvents('idle');
    }
    if (MOBILE) mobilePlace(); else B.collect.x = L.msg.x - 90;
    if (!tabVisible(setTab)) setTab = 0;
    for (const k of ['pagePrev', 'pageNext']) Object.assign(B[k], { x: B[k === 'pagePrev' ? 'achPrev' : 'achNext'].x, y: B.achPrev.y, w: B.achPrev.w, h: B.achPrev.h, size: B.achPrev.size });
    if (S.phase === 'codex') { B.pagePrev.disabled = codexPage <= 0; B.pageNext.disabled = codexPage >= codexPages() - 1; CODEX_TAB_BTNS.forEach((b, i) => { b.colour = i === codexTab ? P.BLUE : darken(P.PANEL, 0.1); }); }
    if (S.phase === 'history') {
      B.pagePrev.disabled = histPage <= 0; B.pageNext.disabled = histPage >= histPages() - 1;
      if (histSel >= 0) { B.back.w = 170; B.share.w = 190; placeRow([B.back, B.share, ...(gifOf(history()[histSel]) ? [B.gif] : [])], SUM.y + SUM.h - SUM_BTN, MOBILE ? 54 : 48); B.back.label = 'Back'; }
    }
    if (S.summary && S.phase !== 'history') {
      Object.assign(B.home, { w: 170, label: 'Main Menu' }); B.retry.w = 170; B.share.w = 190; B.endless.w = 210;
      placeRow(summaryButtons(), SUM.y + SUM.h - SUM_BTN, MOBILE ? 54 : 48);
    }
    if (confirmBtn && eng.time > confirmBtn.until) confirmBtn = null;
    B.shopReroll.label = S.shopFree > 0 ? 'Reroll Free' : 'Reroll $' + S.shopRerollCost;
    B.shopReroll.disabled = !(S.shopFree > 0) && !canPay(S.shopRerollCost);
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
    if (['select', 'shop', 'won'].includes(S.phase) && eng.time - achClock > 0.5) { achClock = eng.time; achieve('state', achState()); jonnyEvents('state'); }
    if (S.stats && S.money > S.stats.maxMoney) S.stats.maxMoney = S.money;
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

  const tipK = () => +SETTINGS.textSize || 1;
  function panelSize(ctx, inf) {
    const tk = tipK(), w = (inf.w || 280) * tk;
    const lines = wrapText(ctx, inf.desc, w - 32, 19 * tk);
    const facesH = inf.faces ? 36 : 0, subH = inf.sub ? 26 : 0, badgeH = inf.badge ? 32 : 0;
    const tagsH = inf.tags && inf.tags.length ? 28 : inf.tagNote ? 24 : 0;
    const boxH = lines.length * 22 * tk + 14 + facesH;
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
    UI.box(ctx, x, y, w, h, { colour: P.L_BLACK, radius: 12, emboss: 4, outline: links ? P.GOLD : lighten(P.L_BLACK, 0.25), outlineWidth: links ? 2 : 1, frame: false });
    UI.text(ctx, inf.title, x + w / 2, y + 22, { size: 24 });
    UI.box(ctx, x + 8, y + 40, w - 16, boxH, { colour: '#FFFFFF', radius: 8, shadow: false });
    const tk = tipK();
    lines.forEach((ln, i) => terms.push(...drawLine(ctx, ln, x + w / 2, y + 58 + i * 22 * tk, 19 * tk, links, self)));
    if (inf.faces) terms.push(...drawFaces(ctx, inf.faces, x + w / 2, y + 40 + lines.length * 22 * tk + 28, inf.upIdx));
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
    const opts = handOpts(faces);
    const key = faces.map((f) => f.v + f.kind).join(',') + JSON.stringify(S.levels) + JSON.stringify(opts);
    if (key !== previewKey) { previewKey = key; previewRes = R.evaluateFaces(faces, S.levels, opts); }
    return previewRes;
  }
  // Optionen für die Handerkennung (Vorschau, Jonnys Hilfe): wie in rules.scoreHand
  // Ermüdung, die diese Handart beim Spielen bekäme (dieselbe Handart mehrmals direkt hintereinander)
  const fatigueFor = (name) => (S.ach && name ? R.fatigueScaled(name === S.ach.last ? S.ach.streak + 1 : 1, Phone.fatigueScale(phoneOwned())) : 0);
  function handOpts(faces) {
    const f = formationOn();
    return { gap: has('gap_jumper'), skullWild: has('hex_bag'), bustAt: bustAt(), formation: f, wild: f && has('keystone') ? R.keystoneSlots(faces) : [] };
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
      const q = pos(k), tl = UI.style.tilt ? [-0.05, 0.035, -0.025, 0.045, -0.04][k % 5] : 0;
      ctx.save(); ctx.translate(q.x, q.price); ctx.rotate(tl); ctx.translate(-q.x, -q.price);
      UI.box(ctx, q.x - 34, q.price - 15, 68, 30, { colour: it.special ? JONNY_GOLD : P.MONEY, radius: 8, emboss: 3, outline: it.special ? '#FFFFFF' : undefined, outlineWidth: 2 });
      UI.text(ctx, '$' + it.price, q.x, q.price, { size: 22, colour: P.BLACK, shadow: false });
      ctx.restore();
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
    drawDad(back);
    if (inMenus()) {
      if (S.phase === 'menu') { L.drawMenu(back, front, t); drawPartyHat(front); for (const b of activeButtons()) UI.button(front, b, t); }
      else if (S.phase === 'slots') drawSlots(back, front, t);
      else if (S.phase === 'trophies') drawTrophies(back, front, t);
      else if (S.phase === 'codex') drawCodex(back, front, t);
      else if (S.phase === 'history') drawHistory(back, front, t);
      else if (S.phase === 'challenges') drawChallenges(back, front, t);
      else drawCups(back, front, t);
      readable(() => TUT.draw(front, t));
      drawToasts(front);
      drawSong(front);
      drawPeek(front, t);
      drawSettings(front, t);
      return;
    }
    tagRects = [];
    L.drawFrame(back, front, t);
    if (S.phase === 'encounter' || S.phase === 'phone') {
      /* nur Rahmen, das Fenster kommt weiter unten */
    } else if (S.phase === 'shop') {
      L.drawShop(back, front, t);
      for (const b of BUY) if (S.shop && S.shop[b.slot]) UI.button(front, b, t);
      UI.button(front, B.next, t);
      UI.button(front, B.shopReroll, t);
      if (upg('vault')) { UI.button(front, B.deposit, t); UI.button(front, B.withdraw, t); }
    } else {
      L.drawPlay(back, front, t);
      drawTable(back);
      drawDiceExtras(front);
      drawLinks(front);
      if (S.phase === 'select') drawFormationLine(front);
      drawFuse(front);
      if (!S.cupDraw) for (const b of [B.roll, B.play]) UI.button(front, b, t);
      if (!S.cupDraw && helpShown()) UI.button(front, B.help, t);
      if (!S.cupDraw && shiftBtnOn()) UI.button(front, B.shift, t);
    }
    if (selected) for (const b of selButtons()) UI.button(front, b, t);
    drawMsg(front, t);
    if (S.summary && ['lost', 'runWon'].includes(S.phase)) drawRunCard(back, front, t, S.summary, true);
    readable(() => drawJonnyTalk(front, t));
    drawChoice(front, t);
    readable(() => drawEncounter(front, t));
    readable(() => drawPhoneCall(front, t));
    drawCupDraw(back, front, t);
    drawChaos(front);
    readable(() => TUT.draw(front, t));
    drawToasts(front);
    drawSong(front);
    drawPeek(front, t);
    if (S.phase !== 'menu' && !S.summary) UI.button(front, B.settings, t);
    drawSettings(front, t);
    if (S.choice || settingsOpen || S.cupDraw || S.summary || S.phase === 'encounter' || S.phase === 'phone') { if (!S.summary || settingsOpen) tips = []; return; }
    readable(() => { if (MOBILE) drawTipsTouch(front); else drawTips(front); });
  }

  // ── Einstellungen: Palette, Hintergrund, Schrift, CRT ──────────────────
  // Gespeichert in localStorage. Paletten: ui/palettes.js, Hintergründe: BalatroFX.BG_STYLES.
  const BASE_PALETTE = Object.assign({}, P);
  const PALETTES = window.WG_PALETTES || [];
  // Look > Own colours: Aleators eigene Akzentfarben über "Felt & Brass" (Spieltisch: Tinte, Messing, Ochsenblut, Elfenbein)
  const OWN_COLOURS = {
    RED: '#C0483A', BLUE: '#2B8A8F', GREEN: '#6A9F4F', ORANGE: '#D38A3B', GOLD: '#DDB25E', MONEY: '#E4BC66', PURPLE: '#7D6198',
    PANEL: '#34433A', PANEL_DARK: '#1F2924', L_BLACK: '#47443A', TEXT_SOFT: '#F0E7D0', TEXT_LABEL: '#E4D9BC',
    CHIPS: '#2B8A8F', MULT: '#C0483A', XMULT: '#C0483A', OVERLAY_SOLID: 'rgba(24,31,27,0.97)', OVERLAY: 'rgba(24,31,27,0.94)',
  };
  const BG_STYLES = FX.BG_STYLES || [{ id: 'swirl', name: 'Swirl (Original)' }];
  const FONTS = [
    { id: 'aleator', name: 'Aleator Pixel', css: "'Aleator Pixel', 'Pixelify Sans', monospace" },
    { id: 'jersey10', name: 'Jersey 10', css: "'Jersey 10', 'Pixelify Sans', monospace" },
    { id: 'pixelify', name: 'Pixelify Sans', css: "'Pixelify Sans', 'Courier New', monospace" },
  ];
  // Gewählter Look: Felt & Brass, Lava, Jersey 10 (FONTS[0] bleibt Aleator Pixel: Überschriften). SETTINGS_VERSION erhöhen, um gespeicherte Werte einmalig zu verwerfen.
  const SETTINGS_VERSION = 2;
  // Lautstärken in Prozent (0–100); volScale markiert das neue Format (früher 0–10)
  const SETTINGS = { v: SETTINGS_VERSION, palette: 'felt', background: 'lava', font: 'jersey10', fontV: 0, crt: true, master: 100, music: 70, sfx: 90, volScale: 100,
    voice: 100, songTitles: true, muteBg: false, shake: 'full', particles: 'full', speed: 1, tipDelay: 1, textSpeed: 1, jonnyTalk: 'normal',
    material: 'matte', lookV: 0, cvd: 'off', shapeHints: false, highContrast: false, textSize: 1, readFont: false, bgMotion: 1, bgBright: 1,
    noFlash: false, reduceMotion: false, skipScore: 'off', clickShift: false, studio: null, studioSaves: [null, null, null], photosafe: false,
    lookShadow: true, lookBevel: true, lookCalm: true, lookFrame: true, lookTilt: true, lookText: true, lookOwn: true, lookIcons: true, lookButtons: true };
  // Photosensitive safe: solange an, gelten diese Werte statt der eigenen (die bleiben gespeichert und kommen beim Ausschalten zurück)
  const SAFE = { noFlash: true, reduceMotion: true, bgMotion: 0.35, shake: 'off', particles: 'reduced', crt: false };
  const SAFE_KEYS = Object.keys(SAFE);
  const setEff = (key) => (SETTINGS.photosafe && key in SAFE ? SAFE[key] : SETTINGS[key]);
  // Die Looks wurden auf Freischaltungen umgestellt: einmalig alle auf die freien Looks zurücksetzen (Lautstärken usw. bleiben)
  const LOOK_VERSION = 1;
  // Jersey 10 ist seit 2026-11-12 die Standardschrift: gespeicherte Einstellungen einmalig darauf umstellen
  const FONT_VERSION = 1;
  // Nur für die Entwicklung: ?devlooks zeigt alles, auch Original und Swirl, und erlaubt ?palette= / ?background=
  const devLooks = /[?&]devlooks\b/.test(location.search);
  const CHOICES = {
    palette: () => PALETTES.filter((x) => (!x.devOnly || devLooks) && (!x.secret || lookOwned('palette', x.id))).map((x) => [x.id, x.name]),
    background: () => BG_STYLES.filter((x) => !x.devOnly || devLooks).map((x) => [x.id, x.name]),
    material: () => Cos.MATERIALS.map((m) => [m.id, m.name]),
    cvd: () => [['off', 'Off'], ['deuteranopia', 'Deuteranopia'], ['protanopia', 'Protanopia'], ['tritanopia', 'Tritanopia']],
    shapeHints: () => [[false, 'Off'], [true, 'On']],
    highContrast: () => [[false, 'Off'], [true, 'On']],
    textSize: () => [[1, 'Normal'], [1.2, 'Large'], [1.4, 'XL']],
    readFont: () => [[false, 'Off'], [true, 'On']],
    bgMotion: () => [[1, 'Full'], [0.35, 'Slow'], [0, 'Still']],
    bgBright: () => [[1, '100%'], [0.8, '80%'], [0.6, '60%'], [0.4, '40%']],
    noFlash: () => [[false, 'Off'], [true, 'On']],
    reduceMotion: () => [[false, 'Off'], [true, 'On']],
    skipScore: () => [['off', 'Off'], ['tap', 'Tap to skip'], ['always', 'Always fast']],
    clickShift: () => [[false, 'Off'], [true, 'On']],
    photosafe: () => [[false, 'Off'], [true, 'On']],
    ...Object.fromEntries(['lookShadow', 'lookBevel', 'lookCalm', 'lookFrame', 'lookTilt', 'lookText', 'lookOwn', 'lookIcons', 'lookButtons'].map((k) => [k, () => [[false, 'Off'], [true, 'On']]])),
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
    quit: 'ORANGE', home: 'L_BLACK', back: 'RED', begin: 'BLUE', cupPrev: 'ORANGE', cupNext: 'ORANGE', tutSlot: 'PURPLE', tutX: 'RED',
    codex: 'PURPLE', history: 'GREEN', share: 'BLUE', endless: 'PURPLE', gif: 'PURPLE', pagePrev: 'ORANGE', pageNext: 'ORANGE' };
  let settingsOpen = false;
  let PAL = PALETTES[0];
  // Fenster über dem Spiel: 'pause' (PC, Esc im Spiel), 'stats' (große Statistik) oder 'settings'.
  // Änderungen wirken sofort als Vorschau, gespeichert wird erst mit Apply; setSnap = zuletzt gespeicherter Stand.
  let setPane = 'settings', setFromPause = false, setAsk = false, setSnap = null, setInfo = 0;
  const setDirty = () => setSnap !== null && JSON.stringify(SETTINGS) !== setSnap;
  function openSettings(pane, fromPause = false) {
    if (!settingsOpen) sfx('panel'); else sfx('page');
    settingsOpen = true; setPane = pane; setFromPause = fromPause; setAsk = false;
    if (pane === 'settings') { setSnap = JSON.stringify(SETTINGS); setInfo = 0; }
  }
  // Zurück aus den Einstellungen: ins Pause-Menü, wenn es von dort kam, sonst ganz zu
  function leaveSettings() {
    setAsk = false; setSnap = null; clearLockView(); sliderDrag = -1;
    if (setFromPause && !inMenus()) { setPane = 'pause'; sfx('page'); } else { settingsOpen = false; sfx('panel', { close: true }); }
  }
  function closeSettings() {
    if (setDirty()) { setAsk = true; sfx('panel'); return; }
    leaveSettings();
  }
  function escSettings() {
    if (setPane === 'pause') { settingsOpen = false; sfx('panel', { close: true }); }
    else if (setPane === 'stats') { setPane = 'pause'; sfx('page'); }
    else if (setAsk) { setAsk = false; sfx('panel', { close: true }); }
    else closeSettings();
  }
  function applyAndKeep() {
    if (!setDirty()) return;
    saveSettings(); setSnap = JSON.stringify(SETTINGS);
    sfx('save');
    eng.popup(640, MOBILE ? 560 : 600, 'Settings saved', { colour: P.GREEN, size: 22, life: 1.2 });
  }
  function discardSettings() {
    if (setSnap === null) return;
    const old = JSON.parse(setSnap), hints = SETTINGS.shapeHints;
    for (const k of Object.keys(SETTINGS)) if (!(k in old)) delete SETTINGS[k];
    Object.assign(SETTINGS, old);
    applySettings();
    if (hints !== SETTINGS.shapeHints) refreshAllFaces();
  }
  // Das Colour Studio speichert sofort, aber nur seine eigenen Werte (offene Änderungen anderer Zeilen bleiben ungespeichert)
  function saveStudio() {
    if (setSnap === null) return saveSettings();
    const c = JSON.parse(setSnap);
    c.studio = SETTINGS.studio; c.studioSaves = SETTINGS.studioSaves;
    setSnap = JSON.stringify(c);
    try { localStorage.setItem('wg_settings', setSnap); } catch (e) { /* ohne Speicher weiter */ }
  }
  function settingsButtons() {
    if (setAsk) return [B.askApply, B.askDiscard, B.askStay];
    if (!MOBILE && setPane === 'pause') return [B.resume, ...(B.pStats.disabled ? [] : [B.pStats]), B.pSettings, B.quit];
    if (!MOBILE && setPane === 'stats') return [B.pBack];
    return [...visTabBtns(), ...setBtnsNow(), B.close, B.apply, ...(MOBILE && !inMenus() ? [B.quit] : [])];
  }
  // PC: Reiter (Look > Hand-placed tilt: Breite nach Text, der offene ragt etwas über das Fenster), Close/Apply, Pause-Knöpfe
  function placeSettingsPC() {
    const vt = visTabBtns(), tilt = UI.style.tilt, gap = 8;
    const ws = vt.map((b) => (tilt ? 66 + b.label.length * 9 : 124));
    let x = 640 - (ws.reduce((a, w) => a + w, 0) + gap * (vt.length - 1)) / 2;
    vt.forEach((b, i) => {
      const on = b.setTab === setTab || (SET_TABS[b.setTab].id === 'access' && SET_TABS[setTab].id === 'access2');
      Object.assign(b, { x, w: ws[i], y: on && tilt ? 64 : 70, h: on && tilt ? 46 : 40, size: 19, tilt: on ? -0.02 : 0 });
      x += ws[i] + gap;
    });
    Object.assign(B.close, { x: 450, y: 610, w: 180, h: 48 }); Object.assign(B.apply, { x: 650, y: 610, w: 180, h: 48 });
    if (setPane === 'pause') Object.assign(B.quit, { x: 490, y: 470, w: 300, h: 54, size: 24, tilt: 0.012 });
    else Object.assign(B.quit, { tilt: 0 });
    [B.askApply, B.askDiscard, B.askStay].forEach((b, i) => Object.assign(b, { x: 640 - 330 + i * 225, y: 400, w: 210, h: 52 }));
  }

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem('wg_settings') || '{}');
      if (saved.v === SETTINGS_VERSION) {
        if (saved.volScale !== 100) { ['music', 'sfx'].forEach((k) => { if (saved[k] != null) saved[k] *= 10; }); saved.volScale = 100; }
        Object.assign(SETTINGS, saved);
      }
    } catch (e) { /* Standardwerte */ }
    if (SETTINGS.lookV !== LOOK_VERSION) { SETTINGS.palette = 'felt'; SETTINGS.background = 'lava'; SETTINGS.material = 'matte'; SETTINGS.lookV = LOOK_VERSION; }
    if (SETTINGS.fontV !== FONT_VERSION) { SETTINGS.font = 'jersey10'; SETTINGS.fontV = FONT_VERSION; }
    if (!SETTINGS.studio) SETTINGS.studio = studioDefault();
    const q = location.search;
    if (devLooks) for (const k of ['palette', 'background', 'font']) { const m = q.match(new RegExp('[?&]' + k + '=([\\w-]+)')); if (m) SETTINGS[k] = m[1]; }
  }
  function saveSettings() { try { localStorage.setItem('wg_settings', JSON.stringify(SETTINGS)); } catch (e) { /* ohne Speicher weiter */ } }
  const isFullscreen = () => !!document.fullscreenElement;
  const settingValue = (key) => (key === 'fullscreen' ? isFullscreen() : SETTINGS[key]);
  // Gesperrte Looks lassen sich durchblättern und zeigen ihre Bedingung, werden aber nicht übernommen
  const LOOK_KEYS = ['palette', 'background', 'material'];
  const lookOwned = (kind, id) => devLooks || Cos.isOwned(meta(), ACH, kind, id);
  const lockView = {};
  const clearLockView = () => { for (const k of LOOK_KEYS) delete lockView[k]; };
  const unlockText = (kind, id) => {
    const a = ACH && ACH.SOURCE[Cos.key(kind, id)];
    if (!a && chalSource(kind, id)) return 'Unlock: ' + chalSource(kind, id);
    return !a ? 'Locked' : a.secret ? 'Locked: find a secret' : 'Unlock: ' + a.name + ' - ' + a.desc;
  };
  function chalSource(kind, id) {
    if (!Chal) return null;
    if (kind === 'swatch' && id.startsWith('build_')) return 'Build Mastery - ' + R.TAGS[id.slice(6)].name + ' 1 star (Challenges)';
    if (kind === 'material' && id.startsWith('aura_')) return 'Build Mastery - ' + R.TAGS[id.slice(5)].name + ' 3 stars (Challenges)';
    for (const c of Chal.LIST) if (Chal.winReward(c.id).some(([k, v]) => k === kind && v === id)) return 'Win the challenge ' + c.name;
    for (const [n, [k, v]] of Chal.STREAK_REWARDS) if (k === kind && v === id) return 'Play the Daily Challenge ' + n + ' days in a row';
    return null;
  }
  function lockHint() {
    for (const k of LOOK_KEYS) if (lockView[k] !== undefined) return unlockText(k, lockView[k]);
    return SET_TABS[setTab].id === 'style' && !studioOwned() ? 'Win a run to open the Colour Studio' : null;
  }
  const settingName = (key) => {
    const v = lockView[key] !== undefined ? lockView[key] : SETTINGS.photosafe && key in SAFE ? SAFE[key] : settingValue(key), c = CHOICES[key]().find((x) => x[0] === v);
    return !c ? '?' : lockView[key] !== undefined ? c[1] + ' (locked)' : c[1];
  };
  function changeSetting(key, dir) {
    if (key === 'fullscreen') {   // nicht gespeichert: Browser erlauben Vollbild nur nach einem Klick
      const req = isFullscreen() ? document.exitFullscreen() : document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
      if (req && req.catch) req.catch(() => {});
      return;
    }
    const look = LOOK_KEYS.includes(key), list = CHOICES[key]();
    const cur = look && lockView[key] !== undefined ? lockView[key] : SETTINGS[key], i = list.findIndex((x) => x[0] === cur);
    const v = list[(i + dir + list.length) % list.length][0];
    if (look && !lookOwned(key, v)) { lockView[key] = v; return; }
    if (look) delete lockView[key];
    SETTINGS[key] = v;
    applySettings();
    if (key === 'shapeHints') refreshAllFaces();
    if (key === 'background' && studioOpen) placeStudio();
  }
  // Würfel neu zeichnen, wenn sich die Form-Hinweise ändern
  function refreshAllFaces() {
    dice.forEach((d) => { if (d.data.die) refreshDieTex(d); });
    if (bagSprites.length) refreshBag();
  }

  function applySettings() {
    // Palette: Grundfarben zurücksetzen, dann die gewählte Palette darüberlegen
    PAL = PALETTES.find((x) => x.id === SETTINGS.palette && lookOwned('palette', x.id)) || PALETTES[0];
    SETTINGS.palette = PAL.id;
    if (!lookOwned('background', SETTINGS.background) || !BG_STYLES.some((x) => x.id === SETTINGS.background)) SETTINGS.background = 'lava';
    if (!lookOwned('material', SETTINGS.material)) SETTINGS.material = 'matte';
    Object.assign(P, BASE_PALETTE, PAL.colours);
    // Look > Own colours: Aleators eigene Farben auf der Standard-Palette (andere Paletten bleiben, wie sie sind)
    if (SETTINGS.lookOwn && PAL.id === 'felt') Object.assign(P, OWN_COLOURS);
    // Reihenfolge: Palette < eigene Farben < Hoher Kontrast < Farbsehen (Barrierefreiheit hat immer das letzte Wort)
    if (studioActive()) Object.assign(P, Col.deriveUi(SETTINGS.studio.ui1, SETTINGS.studio.ui2));
    if (SETTINGS.highContrast) Object.assign(P, Col.HIGH_CONTRAST);
    if (Col.CVD[SETTINGS.cvd]) Object.assign(P, Col.CVD[SETTINGS.cvd]);
    UI.textOutline = !!SETTINGS.highContrast;
    UI.motionK = setEff('reduceMotion') ? 0 : 1;
    eng.bgMotion = +setEff('bgMotion'); eng.bgBright = +SETTINGS.bgBright * (SETTINGS.highContrast ? 0.6 : 1);
    eng.noFlash = !!setEff('noFlash'); eng.motionK = setEff('reduceMotion') ? 0 : 1; eng.juiceK = setEff('reduceMotion') ? 0.25 : 1;
    eng.crt.noise = setEff('reduceMotion') ? 0 : CRT_NOISE;
    shapeHintsOn = !!SETTINGS.shapeHints;
    const mt = Cos.MATERIAL_BY_ID[SETTINGS.material];
    MAT = mt && mt.id !== 'matte' ? mt : null;
    for (const [k, key] of Object.entries(BTN_KEYS)) B[k].colour = P[key];
    BUY.forEach((b) => { b.colour = P.BLUE; });
    SET_BTNS.forEach((b) => { b.colour = b.action && !b.soft ? P.RED : P.BLUE; });
    B.trophies.colour = darken(P.GOLD, 0.2);
    Object.assign(B.apply, { colour: P.GREEN }); B.askApply.colour = P.GREEN; B.askDiscard.colour = P.RED; B.askStay.colour = P.L_BLACK;
    B.resume.colour = P.BLUE; B.pBack.colour = P.RED;
    // Look > Calm menu buttons: nur PLAY bleibt kräftig, alle anderen Menüknöpfe teilen eine ruhige Farbe
    const hex = (c, alt) => (/^#[0-9a-f]{6}$/i.test(c) ? c : alt);
    const calm = lighten(hex(P.PANEL, '#3B4A3E'), 0.1);
    if (SETTINGS.lookCalm) for (const k of ['options', 'codex', 'history', 'trophies']) B[k].colour = calm;
    B.pStats.colour = B.pSettings.colour = SETTINGS.lookCalm ? calm : P.L_BLACK;
    // Look-Schalter für die Boxen der BalatroFX-Lib
    Object.assign(UI.style, { hardShadow: !!SETTINGS.lookShadow, bevel: !!SETTINGS.lookBevel, frames: !!SETTINGS.lookFrame,
      tilt: !!SETTINGS.lookTilt, darkOutline: !!SETTINGS.lookIcons, liveButtons: MOBILE || !!SETTINGS.lookButtons, shadowColour: darken(hex(P.PANEL_DARK, '#253029'), 0.55) });
    UI.textMap = SETTINGS.lookText ? window.WG_TEXTS || null : null;
    Object.assign(TYPE_COL, { constellation: P.PLANET, oracle: P.TAROT, die: P.GREEN });
    // Hintergrund-Stil, Schrift, CRT
    if (eng.setBackgroundStyle) eng.setBackgroundStyle(SETTINGS.background);
    if (SETTINGS.font === 'wuerfel') SETTINGS.font = 'aleator'; // alter Schrift-Name
    UI.FONT = (FONTS.find((x) => x.id === SETTINGS.font) || FONTS[0]).css;
    // Look > Own font: Überschriften in Aleator Pixel (nicht mit "Readable font")
    UI.TITLE_FONT = SETTINGS.lookOwn && !SETTINGS.readFont ? FONTS[0].css : null;
    eng.crt.enabled = !!setEff('crt');
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
  eng.shake = (a = 6) => { const f = SHAKE_F[setEff('shake')]; if (f === undefined || f > 0) baseShake(a * (f === undefined ? 1 : f)); };
  eng.emit = (x, y, o = {}) => {
    const f = PARTICLE_F[setEff('particles')] || 1;
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
      applySettings();
      toasts = [];
      sfx('bust');
      eng.popup(640, 600, 'Progress reset', { colour: P.RED, size: 24, life: 1.6 });
      return;
    }
    if (key === 'studio') {
      if (studioOwned()) { studioOpen = true; studioMsg = null; placeStudio(); sfx('panel'); }
      else denied(640, 560, 'Win a run first');
      return;
    }
    if (key === 'accMore' || key === 'accBack') { setTab = SET_TABS.findIndex((x) => x.id === (key === 'accMore' ? 'access2' : 'access')); sfx('page'); return; }
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
    const d = (studioActive() ? studioBg() : PAL.bg)[name];
    if (d.c1) eng.setBackground(d, opts);
    else eng.setBackgroundColour(d.base, Object.assign({ special: d.special, contrast: d.contrast }, opts));
  }
  function refreshBg() {
    if (!PAL) return;
    if (bgName === 'table' && isBossBlind() && S.boss && ['rolling', 'select', 'scoring'].includes(S.phase)) eng.setBackgroundColour(S.boss.colour, { contrast: 2 });
    else setBg(bgName, { spin: 0.6 });
  }


  // ── Barrierefreiheit: Tastatur-Fokus, Shift per Klick, Wertung überspringen, lesbare Schrift ──
  const READ_FONT = "Verdana, 'Trebuchet MS', Arial, sans-serif";
  const CRT_NOISE = eng.crt.noise;
  // Logo im Hauptmenü: eigene, wuchtige Schrift nur für den Spieltitel (Jacquard 12, OFL; Raster 12 px -> Größen als Vielfache von 12)
  UI.LOGO_FONT = "'Jacquard 12', 'Aleator Pixel', monospace";
  function readable(fn) {
    if (!SETTINGS.readFont) return fn();
    const f = UI.FONT;
    UI.FONT = READ_FONT;
    try { return fn(); } finally { UI.FONT = f; }
  }
  let focusBtn = null;
  function moveFocus(dir) {
    const list = activeButtons().filter((b) => !b.disabled);
    if (!list.length) return;
    const i = list.indexOf(focusBtn);
    focusBtn = list[i < 0 ? (dir > 0 ? 0 : list.length - 1) : (i + dir + list.length) % list.length];
    sfx('card');
  }
  function drawFocus(ctx) {
    if (!focusBtn || !activeButtons().includes(focusBtn)) return;
    const b = focusBtn;
    ctx.save(); ctx.lineWidth = 4; ctx.strokeStyle = '#FFFFFF'; ctx.strokeRect(b.x - 4, b.y - 4, b.w + 8, b.h + 8);
    ctx.lineWidth = 2; ctx.strokeStyle = '#000000'; ctx.strokeRect(b.x - 7, b.y - 7, b.w + 14, b.h + 14); ctx.restore();
  }
  function cycleSelected(dir) {
    const list = relicSprites.concat(consSprites);
    if (!list.length) return;
    const i = list.indexOf(selected);
    selected = list[i < 0 ? (dir > 0 ? 0 : list.length - 1) : (i + dir + list.length) % list.length];
    selected.juiceUp(0.25); sfx('card');
  }
  let shiftMode = false, shiftFrom = null, scoreFast = false;
  const shiftBtnOn = () => SETTINGS.clickShift && S.phase === 'select' && formationOn() && !TUT.active;
  function endShiftMode() { shiftMode = false; shiftFrom = null; }
  function toggleShiftMode() {
    if (!shiftMode && !canShift()) { denied(L.msg.x, dieY() - 112, 'No Shifts left'); return; }
    shiftMode = !shiftMode; shiftFrom = null;
    layoutDice(); sfx('card');
  }
  function pickShift(die) {
    if (!shiftFrom) { shiftFrom = die; die.juiceUp(0.3); die.tint = [P.GREEN, 0.4]; sfx('card'); return; }
    const a = dice.indexOf(shiftFrom), b = dice.indexOf(die);
    endShiftMode();
    if (a !== b && a >= 0 && b >= 0 && canShift()) swapDice(a, b, false);
    layoutDice();
  }
  function updateAccess() {
    if (S.phase !== 'select') endShiftMode();
    if (S.phase !== 'scoring') scoreFast = false;
    eng.timeScale = S.phase === 'scoring' && !TUT.active && (scoreFast || SETTINGS.skipScore === 'always') ? 6 : +SETTINGS.speed || 1;
    const sb = MOBILE ? { w: 190, h: 66, size: 26 } : { w: 140, h: 42, size: 20 };
    Object.assign(B.shift, sb, { x: L.msg.x - sb.w / 2, y: dieY() - (MOBILE ? 146 : 128), label: shiftMode ? (shiftFrom ? 'Pick target' : 'Pick a die') : 'Shift (' + (S.shifts || 0) + ')' });
    // Würfelmaterial gilt für alle eigenen Würfel (und die Menü-Würfel als Vorschau)
    for (const list of [dice, bagSprites, menuDice]) for (const sp of list) sp.material = MAT;
    animateStudioBg();
  }

  // Würfelmaterial außen: neutraler Schein und Glitzerpixel, nur um die Würfelform (Pixel-Raster, nie auf der Fläche)
  function drawMaterialFx(ctx, t) {
    if (!MAT || (!MAT.halo && !MAT.sparkle)) return;
    const list = inMenus() ? (S.phase === 'menu' ? menuDice : []) : S.phase === 'shop' ? [] : dice;
    const px = 3;
    for (const sp of list) {
      if (sp._dead || sp.dissolve > 0 || !sp.visible) continue;
      const h = (sp.w * (sp.vs || sp.s)) / 2, snap = (v) => Math.round(v / px) * px, x = snap(sp.x), y = snap(sp.y);
      if (MAT.halo) {
        const pulse = setEff('reduceMotion') ? 1 : S.phase === 'scoring' ? 0.75 + 0.45 * Math.sin(t * 7 + sp.seed * 6) : 0.85 + 0.15 * Math.sin(t * 1.6 + sp.seed * 6);
        ctx.fillStyle = MAT.halo[0];
        [[9, 0.32], [6, 0.55], [3, 1]].forEach(([d, a]) => {
          ctx.globalAlpha = Math.min(1, MAT.halo[1] * a * pulse);
          const s = snap(h + d);
          ctx.fillRect(x - s + px * 2, y - s, (s - px * 2) * 2, s * 2);
          ctx.fillRect(x - s, y - s + px * 2, s * 2, (s - px * 2) * 2);
        });
        ctx.globalAlpha = 1;
      }
      for (let k = 0; k < (MAT.sparkle || 0); k++) {
        const r = sp.seed * 97 + k * 13.7, a = (r * 2.3) % (Math.PI * 2), life = setEff('reduceMotion') ? 0.5 : (t * 0.45 + r * 0.61) % 1;
        if (!setEff('reduceMotion') && life > 0.3) continue;
        const d = h * 1.32 + ((r * 7) % 16), sx = snap(x + Math.cos(a) * d), sy = snap(y + Math.sin(a) * d);
        ctx.fillStyle = '#FFFFFF'; ctx.globalAlpha = setEff('reduceMotion') ? 0.7 : 1 - life / 0.3;
        ctx.fillRect(sx, sy, px, px);
        ctx.fillRect(sx - px, sy, px * 3, px); ctx.fillRect(sx, sy - px, px, px * 3);
        ctx.globalAlpha = 1;
      }
    }
  }

  // ── Colour Studio: eigene Hintergrund- und UI-Farben, freigeschaltet nach dem ersten Sieg ──
  function studioDefault() { return { on: false, c1: '#2F6B52', c2: '#1F7A62', c3: null, c4: null, ui1: '#3B4A3E', ui2: '#E3BE62' }; }
  const studioOwned = () => lookOwned('feature', 'studio');
  const studioActive = () => !!(SETTINGS.studio && SETTINGS.studio.on && studioOwned());
  const styleCount = () => Cos.STYLE_COLOURS[SETTINGS.background] || 3;
  function studioBg() {
    const st = SETTINGS.studio, n = styleCount();
    return Col.deriveBg({ c1: st.c1, c2: st.c2, c3: n >= 3 ? st.c3 : null, c4: n >= 4 ? st.c4 : null });
  }
  function studioTargets() {
    const n = styleCount(), out = [['c1', 'Background 1'], ['c2', 'Background 2']];
    if (n >= 3) out.push(['c3', 'Depth']);
    if (n >= 4) out.push(['c4', Cos.STYLE_FOURTH[SETTINGS.background] || 'Extra']);
    return out.concat([['ui1', 'Panels'], ['ui2', 'Accents']]);
  }
  let studioOpen = false, studioTarget = 'c1', studioMsg = null;
  const ALL_SWATCHES = Cos.SWATCHES.map((hex) => ({ hex })).concat(Cos.SPECIAL_SWATCHES);
  const STU = {
    tgt: ['c1', 'c2', 'c3', 'c4', 'ui1', 'ui2'].map((k) => btn(0, 0, 200, 44, '', P.L_BLACK, { size: 20, stuTarget: k, align: 'left' })),
    sw: ALL_SWATCHES.map((s, i) => btn(0, 0, 44, 44, '', s.hex, { size: 22, stuSwatch: i })),
    auto: btn(0, 0, 90, 44, 'Auto', P.L_BLACK, { size: 18, stuAuto: true }),
    save: [0, 1, 2].map((k) => btn(0, 0, 80, 44, 'Save ' + (k + 1), P.GREEN, { size: 18, stuSave: k })),
    load: [0, 1, 2].map((k) => btn(0, 0, 80, 44, 'Load ' + (k + 1), P.BLUE, { size: 18, stuLoad: k })),
    reset: btn(0, 0, 156, 44, 'Reset to preset', P.ORANGE, { size: 17, stuReset: true }),
    back: btn(0, 0, 90, 44, 'Back', P.RED, { size: 20, stuBack: true }),
  };
  ALL_BUTTONS.push(...STU.tgt, ...STU.sw, STU.auto, ...STU.save, ...STU.load, STU.reset, STU.back);
  const swatchLocked = (s) => !!s.id && !lookOwned('swatch', s.id);
  const canAuto = () => studioTarget === 'c3' || studioTarget === 'c4';
  function studioGeom() {
    const v = MOBILE ? viewBox() : { l: 0, r: 1280 }, k = MOBILE ? 1.3 : 1, pw = Math.min(v.r - v.l - 24, MOBILE ? 1400 : 960), ph = MOBILE ? 704 : 620;
    return { k, pw, ph, px: (v.l + v.r) / 2 - pw / 2, py: (720 - ph) / 2 };
  }
  function placeStudio() {
    const { k, pw, ph, px, py } = studioGeom(), targets = studioTargets();
    if (!targets.some((x) => x[0] === studioTarget)) studioTarget = 'c1';
    const rowH = 46 * k, gap = 8;
    STU.tgt.forEach((b) => { b.hidden = true; });
    targets.forEach(([key, label], i) => {
      const b = STU.tgt.find((q) => q.stuTarget === key);
      Object.assign(b, { hidden: false, label, x: px + 20, y: py + 66 * k + i * (rowH + gap), w: 262 * k, h: rowH, size: 20 * k, colour: key === studioTarget ? P.BLUE : darken(P.PANEL, 0.1) });
    });
    const cell = 48 * k, step = cell + 8, x0 = px + 306 * k, y0 = py + 66 * k;
    STU.sw.forEach((b, i) => {
      // Grundfarben: 8 pro Reihe. Sonderfarben: erste Reihe 6 (daneben Auto), danach 8 pro Reihe
      const special = i >= Cos.SWATCHES.length, idx = special ? i - Cos.SWATCHES.length : i;
      const col = !special ? idx % 8 : idx < 6 ? idx : (idx - 6) % 8, row = !special ? Math.floor(idx / 8) : idx < 6 ? 2 : 3 + Math.floor((idx - 6) / 8);
      Object.assign(b, { x: x0 + col * step, y: y0 + row * step + (special ? 34 * k : 0), w: cell, h: cell, size: 24 * k });
      const locked = swatchLocked(ALL_SWATCHES[i]);
      b.colour = locked ? P.PANEL_DARK : ALL_SWATCHES[i].hex; b.label = locked ? '?' : '';
    });
    Object.assign(STU.auto, { x: x0 + 6 * step, y: y0 + 2 * step + 34 * k, w: step * 2 - 8, h: cell, size: 18 * k, disabled: !canAuto(), colour: darken(P.PANEL, 0.1) });
    // Untere Leiste: drei Plätze, Zurücksetzen, Zurück
    const total = 6 * 80 + 156 + 90 + 7 * 8, f = Math.min(k, (pw - 40) / total), by = py + ph - 44 * f - 18;
    let x = px + (pw - total * f) / 2;
    const place = (b, w) => { Object.assign(b, { x, y: by, w: w * f, h: 44 * f, size: (b.stuReset ? 17 : b.stuBack ? 20 : 18) * f }); x += (w + 8) * f; };
    [0, 1, 2].forEach((i) => { place(STU.save[i], 80); place(STU.load[i], 80); STU.load[i].disabled = !SETTINGS.studioSaves[i]; });
    place(STU.reset, 156); place(STU.back, 90);
  }
  const studioButtons = () => [...STU.tgt.filter((b) => !b.hidden), ...STU.sw, STU.auto, ...STU.save, ...STU.load, STU.reset, STU.back];
  function setStudioColour(hex) {
    SETTINGS.studio[studioTarget] = hex; SETTINGS.studio.on = true;
    saveStudio(); applySettings(); placeStudio();
  }
  function studioButton(b) {
    if (b.stuTarget) { studioTarget = b.stuTarget; studioMsg = null; placeStudio(); sfx('card'); return true; }
    if (b.stuSwatch !== undefined) {
      const s = ALL_SWATCHES[b.stuSwatch];
      if (swatchLocked(s)) { studioMsg = s.name + '  ·  ' + unlockText('swatch', s.id); sfx('deny'); return true; }
      studioMsg = null; setStudioColour(s.hex); return true;
    }
    if (b.stuAuto) { setStudioColour(null); return true; }
    if (b.stuSave !== undefined) { SETTINGS.studioSaves[b.stuSave] = Object.assign({}, SETTINGS.studio); saveStudio(); placeStudio(); studioMsg = 'Saved to slot ' + (b.stuSave + 1); return true; }
    if (b.stuLoad !== undefined) { SETTINGS.studio = Object.assign({}, SETTINGS.studioSaves[b.stuLoad], { on: true }); saveStudio(); applySettings(); placeStudio(); return true; }
    if (b.stuReset) { SETTINGS.studio = studioDefault(); saveStudio(); applySettings(); placeStudio(); studioMsg = 'Back to the ' + PAL.name + ' preset'; return true; }
    if (b.stuBack) { studioOpen = false; sfx('panel', { close: true }); return true; }
    return false;
  }
  function drawStudio(ctx, t) {
    placeStudio();
    dim(ctx, 0.25);
    const { k, pw, ph, px, py } = studioGeom(), st = SETTINGS.studio, cx = px + pw / 2;
    UI.box(ctx, px, py, pw, ph, { colour: P.OVERLAY_SOLID, radius: 18, outline: P.GOLD, outlineWidth: 3 });
    UI.dynaText(ctx, 'Colour Studio', cx, py + 32 * k, { size: 34 * k, colour: P.GOLD, time: t, wave: 2 });
    for (const b of studioButtons()) UI.button(ctx, b, t);
    // Farbproben neben den Zielen
    for (const [key] of studioTargets()) {
      const b = STU.tgt.find((q) => q.stuTarget === key), hex = st[key], s = b.h - 16;
      if (hex) UI.box(ctx, b.x + b.w - s - 8, b.y + 8, s, s, { colour: hex, radius: 6, shadow: false, outline: '#FFFFFF', outlineWidth: 2 });
      else UI.text(ctx, 'Auto', b.x + b.w - s / 2 - 8, b.y + b.h / 2, { size: 15 * k, colour: P.TEXT_SOFT });
    }
    // Gewählte Farbe markieren
    STU.sw.forEach((b, i) => { if (st[studioTarget] === ALL_SWATCHES[i].hex && b.label === '') { ctx.lineWidth = 3; ctx.strokeStyle = '#FFFFFF'; ctx.strokeRect(b.x - 3, b.y - 3, b.w + 6, b.h + 6); } });
    drawStudioPreview(ctx, px, pw, k);
    const first = STU.sw[Cos.SWATCHES.length];
    UI.text(ctx, 'Special colours', first.x, first.y - 18 * k, { size: 18 * k, colour: P.TEXT_LABEL, align: 'left' });
    const hover = !MOBILE && STU.sw.find((b) => UI.inside(b, eng.mouse)), hs = hover && ALL_SWATCHES[STU.sw.indexOf(hover)];
    const line = hs && hs.id ? hs.name + (swatchLocked(hs) ? '  ·  ' + unlockText('swatch', hs.id) : hs.anim ? '  ·  animated in the background' : '')
      : studioMsg || (st.on ? 'Your colours are live. Boss rounds keep their boss colour.' : 'Pick a colour to start. Text contrast adjusts itself.');
    UI.text(ctx, line, cx, STU.back.y - 16 * k, { size: fitText(ctx, line, pw - 40, 17 * k), colour: P.TEXT_DIM });
  }
  // Kleine Vorschau: Hintergrundfarben, ein Panel mit Akzent und Text, ein Würfel
  function drawStudioPreview(ctx, px, pw, k) {
    const last = STU.tgt.filter((b) => !b.hidden).pop(), top = Math.max(last.y + last.h, STU.sw[STU.sw.length - 1].y + STU.sw[0].h) + 14, bottom = STU.back.y - 34 * k, h = bottom - top;
    if (h < 56) return;
    const x = px + 20, w = pw - 40, st = SETTINGS.studio, n = styleCount();
    const cols = [st.c1, st.c2].concat(n >= 3 ? [st.c3 || Col.autoDepth(st.c1)] : [], n >= 4 && st.c4 ? [st.c4] : []);
    ctx.save(); UI.roundRect(ctx, x, top, w, h, 10); ctx.clip();
    cols.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x + (i * w) / cols.length, top, w / cols.length + 1, h); });
    ctx.restore();
    const pw2 = Math.min(380 * k, w - 40), ph2 = h - 22, bx = x + w / 2 - pw2 / 2, by = top + 11;
    UI.box(ctx, bx, by, pw2, ph2, { colour: P.PANEL, radius: 10, emboss: 3, outline: P.GOLD, outlineWidth: 2 });
    const die = Math.min(ph2 - 14, 64 * k);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(faceEntry({ v: 5, kind: 'normal' }, 'standard').canvas, bx + 12, by + (ph2 - die) / 2, die, die);
    const tx = bx + die + 26, mid = by + ph2 / 2;
    UI.text(ctx, 'Preview', tx, mid - 14 * k, { size: 24 * k, colour: P.GOLD, align: 'left' });
    UI.text(ctx, 'Text on your panels', tx, mid + 14 * k, { size: 17 * k, colour: P.TEXT_SOFT, align: 'left' });
  }
  // Animierte Sonderfarben: nur im Hintergrund von Menü und Tisch, nie in Boss-Runden
  function animateStudioBg() {
    if (!studioActive() || setEff('reduceMotion') || setEff('noFlash') || !['menu', 'table'].includes(bgName)) return;
    if (bgName === 'table' && isBossBlind() && S.boss && !inMenus()) return;
    const time = nowSec();
    for (const key of ['c1', 'c2']) {
      const sw = SETTINGS.studio[key] && Cos.swatchByHex(SETTINGS.studio[key]);
      if (!sw || !sw.anim) continue;
      const hex = sw.anim === 'prism' ? Col.shiftHue(sw.hex, time * 40) : Col.mix(sw.hex, '#FFF3C4', 0.22 + 0.22 * Math.sin(time * 2.2));
      eng.bgTarget[key] = Col.toRgb(hex).map((v) => v / 255);
    }
  }


  // ── Begegnungen zwischen den Runden (Regeln: encounters.js, Kulissen: ui/encounter-scenes.js) ─────────────
  function freshEnc() { return { seen: [], stage: 0, luck: 0, luckAmt: 5, chalk: null, cool: false, prophecy: null }; }
  let encNow = null;
  const ENC_BTNS = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => btn(0, 0, 220, 44, '', P.BLUE, { size: 20, encRow: k }));
  ALL_BUTTONS.push(...ENC_BTNS);
  const encButtons = () => (encNow && encNow.rows && !encNow.busy ? ENC_BTNS.slice(0, encNow.rows.length) : []);
  const encHeat = () => blindTarget(S.blindIdx) > baseTarget(S.blindIdx);
  const encMoving = () => !setEff('reduceMotion');
  const encRnd = () => rng('encounter');
  function encCan(e) {
    if (e.id === 'pawnshop') return S.relics.some((r) => !r.noRefund);
    if (e.id === 'spring') return encHeat();
    if (e.id === 'chalk') return formationOn();
    return true;
  }
  function maybeEncounter(then) {
    if (TUT.active || !S.enc || !S.blindIdx) return then();
    if (!Enc.shouldOffer({ ante: S.ante, finishedBlind: S.blindIdx - 1, seen: S.enc.seen.length, lastStage: S.enc.stage }, rng('encounter'))) return then();
    const def = Enc.pick(R.tagCounts(S.relics), S.enc.seen, rng('encounter'), encCan);
    if (!def) return then();
    startEncounter(def.id, then);
  }
  function startEncounter(id, then) {
    const def = Enc.BY_ID[id];
    S.enc.seen.push(id); S.enc.stage = S.ante;
    S.phase = 'encounter'; S.score = 0; S.dispScore = 0; S.target = blindTarget(S.blindIdx); selected = null; tips = [];
    encNow = { id, def, step: 'main', text: def.intro, textT: nowSec() + 0.25, born: nowSec(), then, busy: false };
    if (id === 'spring') encNow.heatFrom = S.target;
    seen('encounter', id);
    achieve('encounter', { id });
    setBg('shop', { spin: 1.2 });
    musicMood('shop');
    sfx('whoosh');
    placeEncounter();
  }
  function encEnd() {
    const then = encNow.then;
    encNow = null;
    sfx('panel', { close: true });
    then();
  }
  function encSay(text) { encNow.text = text; encNow.textT = nowSec(); }
  // Nach Ablauf der Animation weiter, falls die Begegnung dann noch läuft
  function encLater(sec, fn) { const e = encNow; eng.after(setEff('reduceMotion') ? Math.min(sec, 0.12) : sec, () => { if (encNow === e) { fn(); if (encNow === e) placeEncounter(); } }); }
  function encBurst(cols, big) {
    const g = encGeom(), s = encScene(g);
    eng.emit(s.x + s.w / 2, s.y + s.h / 2, { count: big ? 60 : 28, colours: cols, speed: big ? 620 : 380, size: big ? 11 : 9, life: 0.9, shape: 'star' });
    eng.shake(big ? 10 : 4);
  }
  function encDone(text, opt = {}) {
    encNow.step = 'done'; encNow.busy = false; encSay(text); encNow.reward = opt.reward || null; encNow.rewardT = nowSec();
    if (opt.good) encBurst(opt.big ? [P.GOLD, '#FFFFFF', P.ORANGE] : [P.GOLD, P.GREEN, '#FFFFFF'], opt.big);
    if (opt.bad) eng.shake(9);
    placeEncounter();
  }
  function encStep(step, text) { encNow.step = step; if (text) encSay(text); placeEncounter(); sfx('page'); }
  function encPress(k) { const row = encNow && !encNow.busy && encNow.rows[k]; if (row && !row.off) { row.act(); if (encNow) placeEncounter(); } }
  function encPopMoney(v) { const s = encScene(encGeom()); eng.popup(s.x + s.w / 2, s.y + 40, (v > 0 ? '+$' : '-$') + Math.abs(v), { colour: v > 0 ? P.MONEY : P.RED, size: 30, life: 1.2 }); }
  const encPay = (v) => { S.money -= v; S.stats.spent += v; J.money.up(0.4); sfx('coin'); encPopMoney(-v); };
  const encGain = (v) => { S.money += v; S.stats.earned += v; J.money.up(0.5); sfx('coin'); encPopMoney(v); };
  function encRemoveRelic(item) {
    const sp = relicSprites.find((q) => q.data.item === item);
    S.relics = S.relics.filter((q) => q !== item);
    relicSprites = relicSprites.filter((q) => q !== sp);
    if (sp) sp.dissolveOut(0.6, { colours: [P.MONEY, P.GOLD] });
  }
  const WALK = () => ({ label: 'Walk away', desc: 'Nothing happens. On to the shop.', walk: true, act: encEnd });
  const BACK = (act) => ({ label: 'Back', desc: '', walk: true, act });
  const bagSpare = () => S.bag.length > 5;
  function encTradePool(item) {
    const d = R.RELIC_BY_ID[item.id], rar = Enc.NEXT_RARITY[d.rarity];
    if (!rar) return [];
    return R.RELICS.filter((q) => !q.hidden && q.rarity === rar && q.id !== 'crossroads' && open('relic', q.id) && !S.relics.some((r) => r.id === q.id) && q.tags.some((t) => d.tags.includes(t)));
  }

  // Mystery Cup
  function encShake() {
    const e = encNow, vals = Enc.mysteryRoll(encRnd()), now = nowSec();
    e.busy = true; e.shakeT = now; sfx('rattle', { n: 5, dur: 0.9 });
    encLater(0.9, () => {
      e.cupUp = nowSec(); sfx('whoosh');
      e.dice = vals.map((v, i) => ({ v, until: nowSec() + 0.25 + i * 0.14 }));
      vals.forEach((v, i) => encLater(0.25 + i * 0.14, () => { sfx(v ? 'land' : 'bust'); eng.shake(v ? 2 : 5); }));
      encLater(1.05, () => { e.busy = false; e.step = 'nudge'; encMysteryPreview(); });
    });
  }
  function encMysteryPreview() {
    const e = encNow, out = Enc.mysteryOutcome(e.dice.map((d) => d.v));
    encSay('Right now: ' + Enc.MYSTERY_TEXT[out] + '.' + (e.nudged ? ' That was your only nudge.' : ' You may nudge one die, but it could come up Skull.'));
  }
  function encNudge(i) {
    const e = encNow, d = e.dice[i];
    e.nudged = true; e.busy = true; d.v = Enc.mysteryDie(encRnd()); d.until = nowSec() + 0.55; sfx('rattle', { n: 1, dur: 0.5 });
    encLater(0.55, () => { sfx(d.v ? 'land' : 'bust'); e.busy = false; encMysteryPreview(); });
  }
  function encMysteryPay() {
    const e = encNow, vals = e.dice.map((d) => d.v), out = Enc.mysteryOutcome(vals), hasRoom = S.relics.length < relicMax();
    if (out === 'cursed') {
      if (S.bag.length < bagMax()) { S.bag.push(R.makeDie('cursed')); refreshBag(); seen('die', 'cursed'); sfx('bust'); return encDone('Three Skulls grin at you. A Cursed Die crawls into your bag.', { bad: true, reward: ['die', 'cursed'] }); }
      return encDone('Three Skulls grin at you, but your bag is full. Lucky.', { bad: true });
    }
    if (out === 'legendary') {
      secret('mystery_five');
      const id = hasRoom && randomRelic('L', true);
      if (id) { addRelic(id).juiceUp(0.8); jingle('fanfare', 2.5); return encDone('Five alike! ' + R.RELIC_BY_ID[id].name + ' was hiding at the bottom of the cup.', { good: true, big: true, reward: ['relic', id] }); }
      encGain(10); return encDone('Five alike, but no room for a relic. You take $10 instead.', { good: true, big: true });
    }
    if (out === 'upgrade') {
      const id = rollUpgrade();
      if (id) { S.upgrades.push(id); refreshUpgrades(); seen('upgrade', id); sfx('magic'); return encDone('Five in a row! You get ' + R.UPGRADE_BY_ID[id].name + ' for free.', { good: true, big: true, reward: ['upgrade', id] }); }
      encGain(5); return encDone('Five in a row! The cup pays $5.', { good: true });
    }
    if (out === 'relic') {
      const id = hasRoom && randomRelic('U');
      if (id) { addRelic(id).juiceUp(0.8); sfx('magic'); return encDone('Three alike! You find ' + R.RELIC_BY_ID[id].name + ' in the cup.', { good: true, reward: ['relic', id] }); }
      encGain(4); return encDone('Three alike, but no room for a relic. You take $4 instead.', { good: true });
    }
    if (out === 'money') { encGain(3); return encDone('A Pair. There is $3 under the cup.', { good: true }); }
    return encDone('Nothing matches. The cup is just a cup.');
  }

  // Back Room: Runde für Runde
  const EDDIE = {
    start: ['Your roll, friend.', 'Nice and easy.', 'No funny business.'],
    win: ['Hm. Lucky.', 'Don\'t get used to it.', 'The table likes you. For now.'],
    lose: ['Tough break.', 'That\'s one for the house.', 'Happens to the best of them.'],
    tie: ['Even. Again.', 'Well, well. Once more.'],
    caught: ['Is that a die in your sleeve? That round is mine.'],
    clean: ['...I didn\'t see anything.'],
  };
  const eddie = (k) => { const a = EDDIE[k]; return a[Math.floor(Math.random() * a.length)]; };
  function encDuelStart(stake) {
    encNow.duel = { stake, me: 0, them: 0, a: null, b: null, sleeve: true, ties: (R.tagCounts(S.relics).risk || 0) > 0, until: 0, verdict: null, double: false };
    encStep('duel', eddie('start'));
  }
  function encDuelRoll() {
    const e = encNow, q = e.duel;
    q.a = Enc.d6(encRnd()); q.b = Enc.d6(encRnd()); q.until = nowSec() + 0.75; q.verdict = null; e.busy = true;
    sfx('rattle', { n: 2, dur: 0.7 });
    encLater(0.75, () => { sfx('land'); eng.shake(3); encDuelSettle(); });
  }
  function encDuelSettle() {
    const e = encNow, q = e.duel, v = Enc.duelJudge(q.a, q.b, q.ties);
    q.verdict = v; e.busy = false;
    if (v === 'lose' && q.sleeve && !q.double) { encSay('You lost this one. Use the die up your sleeve? 1 in 6 he notices.'); return; }
    encDuelApply(v);
  }
  function encDuelApply(v) {
    const e = encNow, q = e.duel, s = encScene(encGeom());
    if (v === 'tie') { encSay(eddie('tie')); q.verdict = null; q.a = q.b = null; return; }
    if (q.double) {
      if (v === 'win') { encGain(q.stake * 2); if (q.stake === 10) secret('eddie_big'); jingle('fanfare', 2); return encDone('"You are a menace." You leave with +$' + q.stake * 2 + '.', { good: true, big: true }); }
      sfx('bust'); return encDone('"Easy come, easy go." You leave even.', { bad: true });
    }
    if (v === 'win') { q.me++; sfx('hold'); eng.popup(s.x + s.w * 0.3, s.y + 60, 'Round!', { colour: P.GREEN, size: 24 }); } else { q.them++; sfx('deny'); eng.popup(s.x + s.w * 0.7, s.y + 60, 'Eddie!', { colour: P.RED, size: 24 }); }
    q.verdict = null;
    if (q.me === 2) { sfx('lucky'); encBurst([P.GOLD, P.GREEN], false); e.step = 'double'; encSay('Fine, you won $' + q.stake + '. Double or nothing? One die, right now.'); return; }
    if (q.them === 2) { encPay(q.stake); return encDone('"Pleasure doing business." You lose $' + q.stake + '.', { bad: true }); }
    encSay(v === 'win' ? eddie('win') : eddie('lose')); q.a = q.b = null;
  }
  function encSleeve() {
    const e = encNow, q = e.duel;
    q.sleeve = false; e.busy = true; sfx('card');
    if (encRnd()() < Enc.SLEEVE_CAUGHT) { encLater(0.5, () => { e.busy = false; encSay(eddie('caught')); sfx('deny'); eng.shake(6); encDuelApply('lose'); if (encNow && e.step === 'duel') encSay(EDDIE.caught[0]); }); return; }
    q.a = Enc.d6(encRnd()); q.until = nowSec() + 0.6; q.mineOnly = true;
    encLater(0.6, () => { sfx('land'); q.mineOnly = false; e.busy = false; encSay(eddie('clean')); encDuelApply(Enc.duelJudge(q.a, q.b, q.ties)); });
  }

  // Well
  const encWellPos = () => Math.sin((nowSec() - encNow.aimT) * (setEff('reduceMotion') ? 1.3 : 2.7));
  function encDropCoin() {
    const e = encNow, pos = encWellPos(), res = Enc.wellGrade(pos);
    e.aimT = null; e.coin = { pos, t: nowSec() }; e.busy = true; sfx('coin');
    encPay(3);
    encLater(0.55, () => {
      S.enc.luck = S.ante; S.enc.luckAmt = res.luck; e.splashT = nowSec(); sfx(res.grade === 'perfect' ? 'lucky' : 'land');
      const txt = { perfect: 'Dead centre. The water hums. +9 Luck this stage.', good: 'A clean splash. +5 Luck this stage.', poor: 'It clips the wall on the way down. +2 Luck this stage.' }[res.grade];
      encDone(txt, { good: res.grade !== 'poor', big: res.grade === 'perfect' });
    });
  }
  function encSacrifice(g) {
    const e = encNow, v = Enc.topFace(g.die);
    if (!v) return;
    S.bag = S.bag.filter((q) => q !== g.die); refreshBag(); S.numLevels[v] = (S.numLevels[v] || 1) + 1;
    e.step = 'main'; e.sunk = g.die; e.coin = { pos: 0, t: nowSec(), die: g }; e.busy = true; sfx('whoosh');
    encLater(0.55, () => { e.splashT = nowSec(); sfx('magic'); encDone('The water closes over it. Your ' + v + 's reach Lv ' + S.numLevels[v] + '.', { good: true }); });
  }

  // Chalk Lines
  function encTraceStart(kind) {
    const e = encNow;
    e.trace = { kind, pts: Enc.chalkPoints(5, encRnd()), next: 0, miss: 0, t0: nowSec(), limit: Enc.CHALK_TIME * (setEff('reduceMotion') ? 1.8 : 1), over: false };
    encStep('trace', 'Follow the numbers. A clean line in time lasts one stage longer.');
    const q = e.trace;
    encLater2(q.limit, () => { if (!q.over && encNow === e) encTraceEnd(false); });
  }
  const encLater2 = (sec, fn) => eng.after(sec, fn);
  function encTraceHit(i) {
    const e = encNow, q = e.trace;
    if (q.over) return;
    if (i !== q.next) { q.miss++; q.wrongT = nowSec(); sfx('deny'); eng.shake(3); return; }
    q.next++; sfx('hold');
    if (q.next >= q.pts.length) encTraceEnd(q.miss === 0);
  }
  function encTraceEnd(perfect) {
    const e = encNow, q = e.trace;
    q.over = true;
    S.enc.chalk = { stage: S.ante, kind: q.kind, until: perfect ? S.ante + 1 : S.ante };
    sfx(perfect ? 'lucky' : 'magic');
    const what = q.kind === 'shift' ? '+1 Shift per hand' : 'Links give +8 Pips';
    encDone(perfect ? 'A perfect line! ' + what + ' this stage and the next.' : 'Close enough. ' + what + ' this stage.', { good: true, big: perfect });
  }

  function encRows() {
    const e = encNow, id = e.id, step = e.step;
    if (step === 'done') return [{ label: 'Continue', desc: '', act: encEnd }];
    const groupRows = (desc, act) => Enc.groupBag(S.bag).slice(0, 5).map((g) => ({ label: R.DIE_TYPES[g.type].name, desc: desc(g), off: !bagSpare(), act: () => act(g) }));
    const s = encScene(encGeom()), k = encGeom().k;
    if (id === 'mystery') {
      if (step === 'nudge') {
        const sz = 72 * k, gap = 16;
        return e.dice.map((d, i) => ({ custom: true, rect: [s.x + s.w / 2 - (5 * sz + 4 * gap) / 2 + i * (sz + gap), s.y + s.h * 0.62 - sz / 2, sz, sz], off: e.nudged || d.v === 0, act: () => encNudge(i) }))
          .concat([{ label: 'Take it', desc: 'Lift the result off the table.', act: encMysteryPay }]);
      }
      return [{ label: 'Shake the cup', gamble: true, desc: 'Pair: $3. Three alike: relic. Five in a row: upgrade. Five alike: Legendary. 3 Skulls: curse.', act: encShake },
        WALK(), { custom: true, rect: [s.x + s.w / 2 - 70 * k, s.y + s.h * 0.2, 140 * k, s.h * 0.6], act: encShake }];
    }
    if (id === 'fortune') {
      if (step === 'cards') {
        const cw = 120 * k, ch = 176 * k, gap = 30, flipped = e.cards.filter((c) => c.up).length, fee = Enc.flipCost(flipped);
        return e.cards.map((c, i) => ({ custom: true, rect: [s.x + s.w / 2 - (3 * cw + 2 * gap) / 2 + i * (cw + gap), s.y + s.h / 2 - ch / 2, cw, ch], off: !c.up && !canPay(fee), act: () => {
          if (c.up) { S.enc.prophecy = { hand: c.hand, left: 3, power: c.power }; sfx('magic'); return encDone('The smoke agrees. Three times, ' + c.hand + ' gets +' + c.power + ' Power.', { good: true, big: c.gilded }); }
          if (fee) encPay(fee);
          c.up = true; c.flipT = nowSec(); sfx('card');
          encSay(c.gilded ? 'A golden card. The spirits are generous.' : flipped === 2 ? 'That is all of them. Touch the one you want.' : 'Touch it to keep it, or turn another for $' + Enc.flipCost(flipped + 1) + '.');
        } }));
      }
      return [{ label: 'Change fate ($3)', desc: S.boss === JONNY_BOSS ? 'Not even fate can move Jonny.' : S.boss === FATHER_BOSS ? 'The smoke will not touch him.' : 'Swap this Showdown for another boss.', off: isFinal() || !canPay(3), act: () => { encPay(3); pickBoss(); e.ballT = nowSec(); sfx('magic'); encDone('The smoke shifts. Your Showdown is now ' + S.boss.name + '.', { good: true }); } },
        { label: 'Read the cards', desc: 'Turn over cards and keep one. First free, then $1, then $2. One is golden.', act: () => { const hands = shuffle(R.HAND_ORDER.filter((n) => n !== 'Chance'), encRnd()).slice(0, 3); e.cards = Enc.dealCards(hands, S.ante, encRnd()); encStep('cards', 'Three cards. Three futures. Choose.'); sfx('shuffle'); } }, WALK()];
    }
    if (id === 'backroom') {
      const q = e.duel;
      if (step === 'double') return [{ label: 'Double or nothing', gamble: true, desc: 'One die each. Win: +$' + q.stake * 2 + ' in total. Lose: you leave even.', act: () => { q.double = true; q.a = q.b = null; e.step = 'duel'; encSay('Now we are talking.'); encDuelRoll(); } },
        { label: 'Take $' + q.stake, desc: 'Quit while you are ahead.', act: () => { encGain(q.stake); if (q.stake === 10) secret('eddie_big'); encDone('"Beginner\'s luck." You pocket $' + q.stake + '.', { good: true }); } }];
      if (step === 'duel') {
        if (q.verdict === 'lose' && q.sleeve && !q.double) return [{ label: 'Use the sleeve', gamble: true, desc: 'Reroll your die, once per duel. If he catches you, you lose the round anyway.', act: encSleeve }, { label: 'Accept it', desc: 'Eddie takes this round.', walk: true, act: () => encDuelApply('lose') }];
        return [{ label: 'Roll', desc: q.ties ? 'Your Risk relic wins every tie.' : 'Higher die takes the round. First to two.', act: encDuelRoll }];
      }
      return [2, 5, 10].map((v) => ({ label: 'Stake $' + v, gamble: true, desc: 'First to two. Win +$' + v + ', lose -$' + v + '.', off: S.money < v, act: () => encDuelStart(v) })).concat([WALK()]);
    }
    if (id === 'pawnshop') {
      if (step === 'trade') {
        const item = e.item, d = R.RELIC_BY_ID[item.id], fee = Enc.TRADE_FEE[d.rarity], nw = R.RELIC_BY_ID[e.tradeFor];
        return [{ label: 'Deal ($' + fee + ')', desc: 'Your ' + d.name + ' for his ' + nw.name + '.', off: !canPay(fee), act: () => { encPay(fee); encRemoveRelic(item); addRelic(nw.id).juiceUp(0.8); sfx('magic'); encDone('A fair trade. You leave with ' + nw.name + '.', { good: true, reward: ['relic', nw.id] }); } },
          { label: 'No deal', desc: 'Keep what you have.', walk: true, act: () => encStep('relic', 'Suit yourself.') }];
      }
      if (step === 'relic') {
        const item = e.item, d = R.RELIC_BY_ID[item.id], fee = Enc.TRADE_FEE[d.rarity], pool = encTradePool(item), price = encPrice(), h = e.haggle, odds = Enc.HAGGLE_ODDS[h.n];
        return [{ label: 'Haggle', gamble: true, desc: h.closed ? 'He has stopped listening.' : odds === undefined ? 'He will not go higher.' : Math.round(odds * 100) + '% for +$1. If it fails: -$1 and no more talking.', off: h.closed || odds === undefined, act: encHaggle },
          { label: 'Sell for $' + price, desc: 'The relic is gone.', act: () => { encRemoveRelic(item); encGain(price); S.stats.sold++; encDone('Mr. Baum counts out $' + price + ' and polishes your ' + d.name + '.', { good: true }); } },
          { label: 'Trade up', desc: !fee ? 'Nothing is rarer than Legendary.' : pool.length ? 'See what he would give you for it.' : 'Nothing matching on the shelf.', off: !fee || !pool.length, act: () => { e.trades = e.trades || {}; e.tradeFor = e.trades[item.id] = e.trades[item.id] || R.pick(pool, encRnd()).id; encStep('trade', 'For that? I could part with this.'); } },
          BACK(() => encStep('main', e.def.intro))];
      }
      return S.relics.filter((r) => !r.noRefund).slice(0, 5).map((item) => { const d = R.RELIC_BY_ID[item.id]; return { label: d.name, desc: R.RARITY[d.rarity].name + ' relic.', act: () => { e.item = item; e.haggle = e.haggle || { n: 0, closed: false, up: 0 }; if (e.haggle.item !== item) { e.haggle.item = item; e.haggle.n = 0; e.haggle.up = 0; } encStep('relic', 'Ah, ' + d.name + '. I can do $' + encPrice() + '.'); } }; }).concat([WALK()]);
    }
    if (id === 'lost') {
      if (step === 'give') return groupRows((g) => g.n + ' in your bag. Hand one in for $2.', (g) => { S.bag = S.bag.filter((q) => q !== g.die); refreshBag(); encGain(2); e.given = (e.given || 0) + 1; if (e.given >= 2 || !bagSpare()) encDone('The box takes your dice without a word. +$' + e.given * 2 + '.', { good: true }); else encStep('give', 'One more, if you like.'); }).concat([{ label: e.given ? 'Done' : 'Back', desc: '', walk: true, act: () => { if (e.given) encDone('The box takes your die without a word. +$2.', { good: true }); else encStep('main', e.def.intro); } }]);
      if (!e.offer) encDig();
      const tw = 218, th = s.h - 24, gap = 16;
      e.digs = e.digs || 0;
      const dig = Enc.DIG_COST[e.digs];
      return e.offer.map((it, i) => ({ custom: true, rect: [s.x + s.w / 2 - (3 * tw + 2 * gap) / 2 + i * (tw + gap), s.y + 12, tw, th], off: S.bag.length >= bagMax(), it, act: () => { S.bag.push(it.die); refreshBag(); seen('die', it.dieType); sfx('magic'); encDone('It fits your hand. ' + R.DIE_TYPES[it.dieType].name + ' joins your bag.', { good: true, reward: ['die', it.dieType] }); } }))
        .concat([{ label: dig ? 'Dig deeper ($' + dig + ')' : 'Dig deeper', desc: dig ? 'Replaces all three dice.' : 'The box is empty below this.', off: !dig || !canPay(dig), act: () => { encPay(dig); e.digs++; e.offer = null; e.digT = nowSec(); sfx('shuffle'); encSay('You rummage. Something else turns up.'); } },
          { label: 'Hand in dice', desc: 'Up to 2 dice for $2 each.', off: !bagSpare(), act: () => encStep('give', 'What will you leave behind?') }, WALK()]);
    }
    if (id === 'well') {
      if (step === 'die') return groupRows((g) => { const v = Enc.topFace(g.die); return g.n + ' in your bag. ' + (v ? 'Raises your ' + v + 's to Lv ' + ((S.numLevels[v] || 1) + 1) + '.' : 'Nothing to raise.'); }, encSacrifice).concat([BACK(() => encStep('main', e.def.intro))]);
      if (step === 'aim') return [{ label: 'Drop it!', gamble: true, desc: 'Centre: +9 Luck. Near: +5. Wall: +2.', act: encDropCoin }, { custom: true, rect: [s.x, s.y, s.w, s.h], act: encDropCoin }];
      return [{ label: 'Sacrifice a die', desc: 'Remove a die. Its most common number gains 1 level.', off: !bagSpare(), act: () => encStep('die', 'Which one will you give up?') },
        { label: 'Toss a coin ($3)', desc: 'Time your drop for up to +9 Luck this stage.', off: !canPay(3), act: () => { e.aimT = nowSec(); e.step = 'aim'; encSay('Let go when it hangs over the water.'); } }, WALK()];
    }
    if (id === 'spring') {
      const gulp = () => {
        e.gulps = (e.gulps || 0) + 1; e.gulpT = nowSec(); sfx('magic');
        const sc = encScene(encGeom());
        eng.emit(sc.x + sc.w / 2, sc.y + sc.h * 0.75, { count: 26, colours: ['#9FE3F0', '#FFFFFF', '#2F8F9D'], speed: 340, size: 8, life: 0.7, gravity: 900 });
        if (e.gulps === 1) { S.enc.cool = 'sip'; S.target = blindTarget(S.blindIdx); if (S.target <= baseTarget(S.blindIdx)) { S.enc.cool = true; S.enc.freeCool = true; return encDone('Ice cold. The Heat is gone, and it cost you nothing.', { good: true }); } e.step = 'more'; encSay('Half the Heat is gone. Another gulp clears it, but numb fingers mean 1 reroll less per hand.'); return; }
        S.enc.cool = true; S.target = baseTarget(S.blindIdx); encDone('Ice cold. No Heat next round, but your fingers are numb.', { good: true });
      };
      const pool = { custom: true, rect: [s.x, s.y + s.h * 0.55, s.w, s.h * 0.45], act: gulp };
      if (step === 'more') return [{ label: 'Another gulp', desc: 'No Heat next round, but 1 reroll less per hand in it.', act: gulp }, { label: 'That\'s enough', desc: 'Keep half the Heat off, for free.', walk: true, act: () => encDone('You wipe your mouth and walk on.', { good: false }) }, pool];
      return [{ label: 'Drink', desc: 'Halves the Heat of the next round. Free.', act: gulp }, WALK(), pool];
    }
    if (step === 'trace') { e.trace.px = e.trace.pts.map((p) => ({ x: s.x + 40 + p.x * (s.w - 80), y: s.y + 26 + p.y * (s.h - 70) })); const P2 = e.trace.px; return P2.map((p, i) => { const near = Math.min(...P2.filter((o) => o !== p).map((o) => Math.max(Math.abs(o.x - p.x), Math.abs(o.y - p.y)))), r = Math.max(20, Math.min(34 * k, near / 2 - 1)); return { custom: true, rect: [p.x - r, p.y - r, 2 * r, 2 * r], act: () => encTraceHit(i) }; }); }
    return [{ label: 'Extra Shift', desc: 'This stage: +1 Shift per hand.', act: () => encTraceStart('shift') }, { label: 'Strong Links', desc: 'This stage: Links give +8 Pips instead of +4.', act: () => encTraceStart('links') }, WALK()];
  }
  function encPrice() { const e = encNow, h = e.haggle; return Math.max(1, Enc.startOffer(R.RELIC_BY_ID[e.item.id].cost) + h.up - (h.closed ? 1 : 0)); }
  function encHaggle() {
    const e = encNow, h = e.haggle;
    e.bangT = nowSec();
    if (Enc.haggleOk(h.n, encRnd())) { h.n++; h.up++; sfx('coin'); eng.shake(2); encSay(['Hmph. $' + encPrice() + '.', 'You drive a hard bargain. $' + encPrice() + '.', 'Thief! Fine. $' + encPrice() + '.'][Math.min(2, h.n - 1)]); }
    else { h.closed = true; sfx('deny'); eng.shake(6); encSay('Enough! $' + encPrice() + ', take it or leave it.'); }
  }
  function encDig() {
    const e = encNow;
    e.offer = [];
    for (let tries = 0; tries < 40 && e.offer.length < 3; tries++) { const it = genDie(); if (!e.offer.some((q) => q.dieType === it.dieType)) e.offer.push(it); }
  }
  function encGeom() {
    const v = MOBILE ? viewBox() : { l: 0, r: 1280 }, k = MOBILE ? 1.3 : 1, w = Math.min(v.r - v.l - 24, MOBILE ? 1120 : 860), h = MOBILE ? 704 : 610;
    const y = (720 - h) / 2, head = 126 * k, bar = MOBILE ? 150 : 110;
    return { k, x: (v.l + v.r) / 2 - w / 2, y, w, h, head, bar, y0: y + head + 6, rowH: (MOBILE ? 68 : 56) };
  }
  const encScene = (g) => ({ x: g.x + 20, y: g.y + g.head, w: g.w - 40, h: g.h - g.head - g.bar - 8 });
  // Listen (Relikt oder Würfel wählen) brauchen die ganze Höhe, alles andere ist eine Szene mit Knöpfen darunter
  const encIsList = (e) => (e.id === 'pawnshop' && e.step === 'main') || (e.id === 'well' && e.step === 'die') || (e.id === 'lost' && e.step === 'give');
  function placeEncounter() {
    if (!encNow) return;
    encNow.rows = encRows();
    const g = encGeom(), s = encScene(g), list = encIsList(encNow), bar = encNow.rows.filter((q) => !q.custom);
    const bw = Math.min(250 * g.k, (s.w - (bar.length - 1) * 12) / Math.max(1, bar.length)), bh = 46 * g.k, x0 = s.x + s.w / 2 - (bar.length * bw + (bar.length - 1) * 12) / 2;
    let n = 0;
    encNow.rows.forEach((row, i) => {
      const b = ENC_BTNS[i];
      Object.assign(b, { disabled: !!row.off, label: row.label || '', colour: row.walk ? P.L_BLACK : row.gamble ? P.ORANGE : P.BLUE });
      if (row.custom) { Object.assign(b, { x: row.rect[0], y: row.rect[1], w: row.rect[2], h: row.rect[3] }); return; }
      if (list) Object.assign(b, { x: g.x + 20, y: g.y0 + i * g.rowH, w: 216 * g.k, h: g.rowH - 10 });
      else Object.assign(b, { x: x0 + n * (bw + 12), y: s.y + s.h + 10, w: bw, h: bh });
      n++;
    });
  }
  const encEase = (q) => { const c = Math.max(0, Math.min(1, q)); return 1 - Math.pow(1 - c, 3); };
  // Würfel: dreht sich bis "until", landet dann mit kleinem Federn
  function encDie(ctx, v, x, y, s, until, now, hover) {
    const spinning = now < until, show = spinning ? 1 + (Math.floor(now * 16 + x) % 6) : v;
    const entry = faceEntry(show ? { v: show, kind: 'normal' } : { v: 1, kind: 'skull' }, 'standard'), hop = spinning && encMoving() ? Math.abs(Math.sin(now * 13 + x)) * 22 : 0, rot = spinning && encMoving() ? Math.sin(now * 19 + x) * 0.6 : 0;
    const land = !spinning && now - until < 0.25 && encMoving() ? 1 + 0.18 * (1 - (now - until) / 0.25) : 1, sz = s * land * (hover ? 1.08 : 1);
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(x + s / 2, y + s / 2 - hop); ctx.rotate(rot);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-sz / 2 + 4, -sz / 2 + 6 + hop, sz, sz);
    ctx.drawImage(entry.canvas, -sz / 2, -sz / 2, sz, sz);
    ctx.restore();
  }
  function encLabel(ctx, text, x, y, size, colour) { UI.text(ctx, text, x, y, { size, colour: colour || P.WHITE }); }
  function drawEncScene(ctx, e, g, s, t, now) {
    const k = g.k, cx = s.x + s.w / 2, mv = encMoving(), id = e.id;
    if (id === 'mystery') {
      const up = e.cupUp ? encEase((now - e.cupUp) / 0.35) : 0, shaking = e.shakeT && !e.cupUp && mv, sx = shaking ? Math.sin(now * 42) * 10 : mv && !e.dice ? Math.sin(now * 9) * (Math.sin(now * 1.3) > 0.7 ? 3 : 0) : 0, cw = 104 * k, chh = 130 * k, cy = s.y + s.h * 0.72 - chh - up * s.h;
      if (e.dice) { const sz = 72 * k, gap = 16, x0 = cx - (5 * sz + 4 * gap) / 2; e.dice.forEach((d, i) => { const b = e.rows && e.rows[i] && e.rows[i].custom ? ENC_BTNS[i] : null; const dx = x0 + i * (sz + gap), dy = s.y + s.h * 0.62 - sz / 2; if (b && b.hover && !b.disabled) { ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(dx - 6, dy - 6, sz + 12, sz + 12); } encDie(ctx, d.v, dx, dy, sz, d.until, now, b && b.hover && !b.disabled); }); }
      if (up < 1) {
        const px = cx + sx;
        if (window.WGPropArt && window.WGPropArt.draw(ctx, 'mystery-cover', px - cw / 2 - 6, cy - 4, cw + 12, chh + 8)) return;
        ctx.fillStyle = '#9A4E2C';
        for (let i = 0; i < 12; i++) { const w = cw - (12 - i) * 3.4; ctx.fillRect(px - w / 2, cy + (i / 12) * chh, w, chh / 12 + 1); }
        ctx.fillStyle = '#C27A47'; ctx.fillRect(px - cw / 2 - 6, cy + chh - 14, cw + 12, 14);
        ctx.fillStyle = '#6E3620'; ctx.fillRect(px - 22, cy + 20, 8, chh - 40);
      }
      return;
    }
    if (id === 'fortune') {
      if (e.step === 'cards') {
        e.cards.forEach((c, i) => {
          const b = ENC_BTNS[i], flip = c.up ? encEase((now - c.flipT) / 0.28) : 0, sq = mv ? Math.abs(Math.cos(flip * Math.PI)) : 1, showFace = flip > 0.5 || (!mv && c.up), lift = b.hover ? 10 : 0, w = b.w * Math.max(0.06, sq);
          ctx.save(); ctx.translate(b.x + b.w / 2, b.y + b.h / 2 - lift);
          UI.box(ctx, -w / 2, -b.h / 2, w, b.h, { colour: showFace ? (c.gilded ? '#E3BE62' : '#F4EEDF') : '#4A3572', radius: 10, outline: showFace ? '#B58A2A' : '#E3BE62', outlineWidth: 3 });
          if (showFace && sq > 0.6) {
            const dark = '#2A1F45', sz = fitText(ctx, c.hand, b.w - 16, 20 * k);
            encLabel(ctx, c.gilded ? 'GOLDEN' : 'PROPHECY', 0, -b.h / 2 + 24 * k, 13 * k, dark);
            UI.text(ctx, c.hand, 0, -8, { size: sz, colour: dark, shadow: false });
            UI.text(ctx, '+' + c.power + ' Power', 0, 24 * k, { size: 18 * k, colour: '#8F2D3B', shadow: false });
            UI.text(ctx, 'x3 hands', 0, b.h / 2 - 22 * k, { size: 13 * k, colour: dark, shadow: false });
          } else if (sq > 0.6) {
            UI.text(ctx, '?', 0, 0, { size: 56 * k, colour: '#E3BE62' });
            const fee = Enc.flipCost(e.cards.filter((q) => q.up).length);
            if (fee) UI.text(ctx, '$' + fee, 0, b.h / 2 - 20 * k, { size: 16 * k, colour: P.GOLD });
          }
          ctx.restore();
        });
        return;
      }
      // Kristallkugel zeigt den Boss
      const r = 96 * k, cy = s.y + s.h / 2 + 4, glow = 0.5 + 0.2 * Math.sin(t * 2);
      const ballArt = window.WGPropArt && window.WGPropArt.draw(ctx, 'crystal-ball', cx - r * 1.125, cy - r * 0.95, r * 2.25, r * 2.25);
      if (!ballArt) {
      ctx.fillStyle = 'rgba(159,227,240,' + glow * 0.3 + ')'; ctx.beginPath(); ctx.arc(cx, cy, r + 18, 0, 7); ctx.fill();
      ctx.fillStyle = '#7FC6DA'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
      ctx.fillStyle = '#2A3F66'; ctx.beginPath(); ctx.arc(cx, cy, r - 7, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(232,251,255,0.55)'; ctx.fillRect(cx - r * 0.55, cy - r * 0.62, 26, 12);
      ctx.fillStyle = '#6A4326'; ctx.fillRect(cx - 70 * k, cy + r - 8, 140 * k, 20);
      }
      const name = S.boss.name, sz = fitText(ctx, name, r * 1.6, 25 * k);
      UI.text(ctx, 'SHOWDOWN', cx, cy - 42 * k, { size: 12 * k, colour: '#9FE3F0' });
      UI.text(ctx, name, cx, cy - 16 * k, { size: sz, colour: P.GOLD });
      wrapPlain(ctx, S.boss.desc, r * 1.55, 13.5 * k).slice(0, 3).forEach((ln, i) => UI.text(ctx, ln, cx, cy + 14 * k + i * 16 * k, { size: 13.5 * k, colour: '#E8FBFF' }));
      return;
    }
    if (id === 'backroom') {
      const q = e.duel, sz = 96 * k, y = s.y + s.h * 0.55 - sz / 2, xa = cx - 170 * k, xb = cx + 170 * k - sz;
      encLabel(ctx, 'YOU', xa + sz / 2, s.y + 30, 20 * k); encLabel(ctx, 'EDDIE', xb + sz / 2, s.y + 30, 20 * k);
      const lamps = (lx, n, col) => [0, 1].forEach((i) => UI.box(ctx, lx + i * 34 - 28, s.y + 50, 22, 22, { colour: i < n ? col : '#3A3030', radius: 11, shadow: false, outline: '#000', outlineWidth: 2 }));
      lamps(xa + sz / 2 , q ? q.me : 0, P.GREEN); lamps(xb + sz / 2, q ? q.them : 0, P.RED);
      if (q && q.a) { encDie(ctx, q.a, xa, y, sz, q.until, now); if (q.mineOnly) encDie(ctx, q.b, xb, y, sz, 0, now); else encDie(ctx, q.b, xb, y, sz, q.until + 0.12, now); }
      else { UI.box(ctx, xa, y, sz, sz, { colour: 'rgba(0,0,0,0.3)', radius: 10, shadow: false }); UI.box(ctx, xb, y, sz, sz, { colour: 'rgba(0,0,0,0.3)', radius: 10, shadow: false }); }
      UI.text(ctx, q && q.double ? 'x2' : 'VS', cx, y + sz / 2, { size: 34 * k, colour: q && q.double ? P.ORANGE : P.WHITE });
      if (q) { UI.text(ctx, 'Stake $' + q.stake, cx, s.y + 30, { size: 19 * k, colour: P.GOLD }); if (q.sleeve && !q.double) UI.text(ctx, 'Sleeve: 1 die', cx, y + sz + 20, { size: 15 * k, colour: P.TEXT_SOFT }); }
      return;
    }
    if (id === 'pawnshop' && e.item && e.step !== 'main') {
      const d = R.RELIC_BY_ID[e.item.id], sz = 100 * k, y = s.y + s.h * 0.34, bang = e.bangT ? Math.max(0, 1 - (now - e.bangT) / 0.2) : 0;
      UI.box(ctx, cx - 290 * k, y - 44 * k, 580 * k, sz + 120 * k, { colour: 'rgba(30,22,12,0.86)', radius: 12, shadow: false, outline: '#8A6A2E', outlineWidth: 2 });
      if (e.step === 'trade') {
        const nw = R.RELIC_BY_ID[e.tradeFor], xa = cx - 230 * k, xb = cx + 230 * k - sz;
        drawReward(ctx, 'relic', d.id, xa, y, sz, false); drawReward(ctx, 'relic', nw.id, xb, y, sz, false);
        UI.text(ctx, '>>>', cx, y + sz / 2, { size: 38 * k, colour: P.GOLD });
        encLabel(ctx, d.name, xa + sz / 2, y - 16, 16 * k); encLabel(ctx, nw.name, xb + sz / 2, y - 16, 16 * k, P.GOLD);
        wrapPlain(ctx, R.RELIC_BY_ID[nw.id].desc || '', 280 * k, 14 * k).slice(0, 3).forEach((ln, i) => UI.text(ctx, ln, cx, y + sz + 18 + i * 17 * k, { size: 14 * k }));
        return;
      }
      drawReward(ctx, 'relic', d.id, cx - sz / 2, y - bang * 16, sz, false);
      encLabel(ctx, d.name, cx, y - 16, 18 * k);
      const px = cx + 110 * k, py = y + sz / 2;
      UI.box(ctx, px, py - 26 * k, 92 * k, 52 * k, { colour: P.MONEY, radius: 8, outline: '#000', outlineWidth: 2 });
      UI.text(ctx, '$' + encPrice(), px + 46 * k, py, { size: 30 * k * (1 + bang * 0.4) });
      const h = e.haggle, mx = cx - 200 * k;
      encLabel(ctx, 'Patience', mx + 36 * k, py - 26 * k, 14 * k);
      [0, 1, 2].forEach((i) => UI.box(ctx, mx + i * 26 * k, py - 10 * k, 20 * k, 20 * k, { colour: h.closed ? P.RED : i < 3 - h.n ? P.GREEN : '#3A3030', radius: 4, shadow: false }));
      return;
    }
    if (id === 'lost' && e.step === 'main' && e.offer) {
      e.offer.forEach((it, i) => {
        const b = ENC_BTNS[i], c = (Math.floor(now * 0.9) + i) % 6, big = 88 * k, drop = e.digT ? (1 - encEase((now - e.digT - i * 0.08) / 0.3)) * -40 : 0;
        UI.box(ctx, b.x, b.y + drop - (b.hover ? 6 : 0), b.w, b.h, { colour: b.hover && !b.disabled ? '#6F5A42' : '#54442F', radius: 10, outline: '#A67C4E', outlineWidth: 3 });
        ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(faceEntry(it.die.faces[c], it.dieType).canvas, b.x + b.w / 2 - big / 2, b.y + 16 + drop, big, big); ctx.restore();
        const nm = R.DIE_TYPES[it.dieType].name, ns = fitText(ctx, nm, b.w - 16, 18 * k);
        encLabel(ctx, nm, b.x + b.w / 2, b.y + big + 34 + drop, ns);
        drawFaces(ctx, it.die, b.x + b.w / 2, b.y + b.h - 32 + drop, -1);
      });
      return;
    }
    if (id === 'well') {
      const top = s.y + 32, ropeLen = s.h * 0.42, wy = s.y + s.h * 0.56, splash = e.splashT ? now - e.splashT : 9;
      for (let i = 0; i < 3; i++) { const a = splash - i * 0.12; if (a > 0 && a < 0.7) { ctx.strokeStyle = 'rgba(159,227,240,' + (0.8 - a) + ')'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(cx, wy + 14, 20 + a * 130, 4 + a * 12, 0, 0, 7); ctx.stroke(); } }
      if (e.aimT) {
        const pos = encWellPos(), x = cx + pos * 190 * k, y = top + ropeLen;
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(cx - 190 * k, wy - 34, 380 * k, 14);
        ctx.fillStyle = P.RED; ctx.fillRect(cx - 86 * k, wy - 34, 172 * k, 14); ctx.fillStyle = P.GOLD; ctx.fillRect(cx - 27 * k, wy - 34, 54 * k, 14);
        ctx.strokeStyle = '#D9D2C0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(x, y - 14); ctx.stroke();
        UI.box(ctx, x - 18, y - 18, 36, 36, { colour: P.GOLD, radius: 18, outline: '#6B4A12', outlineWidth: 3 }); UI.text(ctx, '$', x, y, { size: 22, colour: '#6B4A12', shadow: false });
      }
      if (e.coin && now - e.coin.t < 0.55) {
        const q = (now - e.coin.t) / 0.55, x = cx + e.coin.pos * 190 * k * (1 - q * 0.2), y = top + ropeLen + q * q * (wy - top - ropeLen + 20);
        if (e.coin.die) { ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(faceEntry(e.coin.die.die.faces[5], e.coin.die.type).canvas, x - 26, y - 26, 52, 52); ctx.restore(); }
        else UI.box(ctx, x - 16, y - 16, 32, 32, { colour: P.GOLD, radius: 16, shadow: false });
      }
      return;
    }
    if (id === 'spring') {
      const base = baseTarget(S.blindIdx), from = e.heatFrom || S.target, tx = s.x + s.w - 130 * k, ty = s.y + 30, th = s.h * 0.52, tw = 30 * k;
      e.heatShown = e.heatShown === undefined ? from : e.heatShown + (S.target - e.heatShown) * 0.08;
      const frac = from > base ? (e.heatShown - base) / (from - base) : 0;
      UI.box(ctx, tx, ty, tw, th, { colour: '#E8FBFF', radius: 12, outline: '#123047', outlineWidth: 3 });
      const fh = (th - 12) * Math.max(0.04, frac);
      UI.box(ctx, tx + 6, ty + th - 6 - fh, tw - 12, fh, { colour: frac > 0.5 ? P.RED : frac > 0.05 ? P.ORANGE : P.BLUE, radius: 6, shadow: false });
      encLabel(ctx, 'HEAT', tx + tw / 2, ty - 14, 14 * k);
      UI.text(ctx, UI.num(Math.round(e.heatShown)), tx + tw + 50 * k, ty + th / 2, { size: 22 * k, colour: frac > 0.05 ? P.ORANGE : '#9FE3F0' });
      const gu = e.gulpT ? now - e.gulpT : 9;
      for (let i = 0; i < 6; i++) { const a = gu - i * 0.03; if (a > 0 && a < 0.6) { ctx.strokeStyle = 'rgba(232,251,255,' + (0.8 - a) + ')'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(cx, s.y + s.h * 0.8, 30 + a * 240, 6 + a * 40, 0, 0, 7); ctx.stroke(); } }
      UI.text(ctx, e.step === 'done' ? '' : 'Click the water', cx, s.y + s.h * 0.8, { size: 17 * k, colour: '#E8FBFF' });
      return;
    }
    if (id === 'chalk' && e.trace) {
      const q = e.trace, pts = q.px || [], n = pts.length;
      const wrong = q.wrongT ? Math.max(0, 1 - (now - q.wrongT) / 0.3) : 0;
      ctx.strokeStyle = '#F4EEDF'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath();
      for (let i = 0; i < Math.min(q.next, n); i++) { if (i === 0) ctx.moveTo(pts[0].x, pts[0].y); else ctx.lineTo(pts[i].x, pts[i].y); }
      ctx.stroke();
      if (e.step === 'trace' || q.over) pts.forEach((p, i) => {
        if (e.step !== 'trace' && !q.over) return;
        const done = i < q.next, cur = i === q.next, pulse = cur && mv ? 1 + 0.12 * Math.sin(now * 9) : 1, r = 24 * k * pulse;
        ctx.fillStyle = done ? '#F4EEDF' : wrong && !cur ? 'rgba(226,85,63,' + (0.3 + wrong * 0.5) + ')' : cur ? P.GOLD : 'rgba(244,238,223,0.25)';
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.fill();
        ctx.strokeStyle = '#F4EEDF'; ctx.lineWidth = 3; ctx.stroke();
        UI.text(ctx, String(i + 1), p.x, p.y, { size: 24 * k, colour: done || cur ? '#22352C' : '#F4EEDF', shadow: false });
      });
      if (!q.over) { const left = Math.max(0, 1 - (now - q.t0) / q.limit), bw = s.w - 60; ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(s.x + 30, s.y + s.h - 42, bw, 10); ctx.fillStyle = left > 0.3 ? '#F4EEDF' : P.RED; ctx.fillRect(s.x + 30, s.y + s.h - 42, bw * left, 10); }
    }
  }
  function drawEncounter(ctx, t) {
    if (!encNow || S.phase !== 'encounter') return;
    const e = encNow, g = encGeom(), k = g.k, def = e.def, face = (MOBILE ? 96 : 84) * k, now = nowSec(), list = encIsList(e), s = encScene(g), fx = MOBILE ? 18 : 26, fy = MOBILE ? 12 : 22;
    dim(ctx, 0.5);
    const intro = encMoving() ? 1 - encEase((now - e.born) / 0.3) : 0;
    ctx.save(); ctx.translate(0, intro * 60); ctx.globalAlpha = 1 - intro * 0.8;
    UI.box(ctx, g.x, g.y, g.w, g.h, { colour: P.OVERLAY_SOLID, radius: 18, outline: def.colour, outlineWidth: 3 });
    // Kopf: Porträt wippt, solange gesprochen wird
    const chars = encMoving() ? Math.floor((now - e.textT) * 60) : 1e9, talking = chars < e.text.length && chars >= 0, bob = talking ? Math.abs(Math.sin(now * 16)) * 4 : encMoving() ? Math.sin(now * 1.6) * 1.5 : 0;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    UI.box(ctx, g.x + fx, g.y + fy, face + 8, face + 8, { colour: P.PANEL_DARK, radius: 8, shadow: false, outline: def.colour, outlineWidth: 2 });
    ctx.drawImage(EncArt.portrait(def.id), g.x + fx + 4, g.y + fy + 4 - bob, face, face);
    ctx.restore();
    const tx = g.x + face + (MOBILE ? 46 : 50), tw = g.x + g.w - (MOBILE ? 22 : 28) - tx;
    UI.dynaText(ctx, def.name, tx, g.y + 28 * k, { size: fitText(ctx, def.name, tw, 30 * k), colour: lighten(def.colour, 0.45), time: t, wave: 1.5, align: 'left' });
    const size = 18 * k * Math.min(tipK(), 1.15), all = wrapPlain(ctx, e.text, tw - 28, size).slice(0, 3), bubH = Math.max(56 * k, all.length * size * 1.25 + 20), by = g.y + 52 * k;
    UI.box(ctx, tx, by, tw, bubH, { colour: '#FFFFFF', radius: 12, shadow: false });
    let left = Math.max(0, chars);
    all.forEach((ln, i) => { const part = ln.slice(0, left); left -= ln.length; if (left < 0) left = 0; UI.text(ctx, part, tx + 14, by + 10 + size * 0.62 + i * size * 1.25, { size, colour: P.BLACK, shadow: false, align: 'left' }); });
    // Bühne
    if (!list) {
      Scenes.draw(ctx, def.id, s.x, s.y, s.w, s.h, now, encMoving());
      if (e.rows) drawEncScene(ctx, e, g, s, t, now);
      if (e.step === 'done' && e.reward) {
        const q = encEase((now - e.rewardT) / 0.35), sz = 112 * k * q, rx = s.x + s.w / 2, ry = s.y + s.h / 2;
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.save(); ctx.translate(rx, ry); ctx.rotate(encMoving() ? now * 0.5 : 0); ctx.fillStyle = 'rgba(243,201,105,0.3)';
        for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-30, -180 * k); ctx.lineTo(30, -180 * k); ctx.fill(); }
        ctx.restore();
        if (sz > 4) drawReward(ctx, e.reward[0], e.reward[1], rx - sz / 2, ry - sz / 2, sz, false);
      }
      UI.box(ctx, s.x, s.y, s.w, s.h, { colour: 'rgba(0,0,0,0)', radius: 2, shadow: false, outline: darken(def.colour, 0.2), outlineWidth: 3 });
    }
    if (e.rows) e.rows.forEach((row, i) => {
      if (row.custom) return;
      const b = ENC_BTNS[i];
      b.size = fitText(ctx, b.label, b.w - 14, 21 * k);
      UI.button(ctx, b, t);
      if (row.gamble) { const tag = 'GAMBLE', ts = 12 * k; ctx.font = UI.font(ts); const w = ctx.measureText(tag).width + 12; UI.box(ctx, b.x + b.w - w - 4, b.y - 7, w, 16 * k, { colour: P.RED, radius: 6, shadow: false }); UI.text(ctx, tag, b.x + b.w - w / 2 - 4, b.y - 7 + 8 * k, { size: ts, shadow: false }); }
      if (list) {
        const dx = b.x + b.w + 16, dw = g.x + g.w - 20 - dx, ds = 15 * k * Math.min(tipK(), 1.1), dl = wrapPlain(ctx, row.desc || '', dw, ds).slice(0, 2), cy = b.y + b.h / 2 - ((dl.length - 1) * ds * 1.2) / 2;
        dl.forEach((ln, j) => UI.text(ctx, ln, dx, cy + j * ds * 1.2, { size: ds, colour: row.off ? P.TEXT_FAINT : P.TEXT_SOFT, align: 'left' }));
      } else {
        const ds = 13.5 * k * Math.min(tipK(), 1.1);
        wrapPlain(ctx, row.desc || '', b.w, ds).slice(0, 2).forEach((ln, j) => UI.text(ctx, ln, b.x + b.w / 2, b.y + b.h + 14 * k + j * ds * 1.2, { size: ds, colour: row.off ? P.TEXT_FAINT : P.TEXT_SOFT }));
      }
    });
    ctx.restore();
  }

  // ── Telefon nach jedem Showdown (Regeln und Texte: phone.js) ─────────────
  // Erst klingelt es im Ohr, dann klingelt das Telefon. Abheben zeigt sofort drei verschiedene Vorteile, einer wird genommen.
  // Ignorieren geht immer und kostet nichts. Die Vorteile stehen in S.phone.owned (wird mit dem Run gespeichert).
  function freshPhone() { return { owned: {}, calls: 0, ignored: 0 }; }
  let phoneNow = null, phoneWeighKey = null, phoneWeighFn = null;
  const PHONE_COL = '#B8342E';   // rotes Bakelit
  const phoneOwned = () => (S.phone && !TUT.active ? S.phone.owned : null);
  // Gewichte der Würfelseiten, nur neu gebaut, wenn sich die Vorteile ändern
  function phoneWeigh() {
    const o = phoneOwned(), key = o ? JSON.stringify(o) : '';
    if (key !== phoneWeighKey) { phoneWeighKey = key; phoneWeighFn = o ? Phone.faceWeight(o) : null; }
    return phoneWeighFn;
  }
  // Steady Hands: manchmal +1 Reroll für diese Hand
  function phoneSteady() {
    const ch = TUT.active ? 0 : Phone.rerollChance(phoneOwned());
    if (!(ch > 0) || rng('phone')() >= ch) return;
    S.rerolls++;
    eng.after(0.55, () => { J.rerolls.up(0.5); eng.popup(B.roll.x + B.roll.w / 2, B.roll.y - 18, 'Extra reroll!', { colour: P.GOLD, size: 20 }); });
  }
  const phoneCan = (d) => (d.id !== 'links' || formationOn()) && (d.id !== 'cool' || heatOn());
  const PHONE_CARDS = [0, 1, 2].map((k) => btn(0, 0, 230, 290, '', P.BLUE, { size: 20, phoneCard: k }));
  const PHONE_ANSWER = btn(0, 0, 210, 56, 'Answer', P.GREEN, { size: 26, phoneAct: 'answer' });
  const PHONE_IGNORE = btn(0, 0, 170, 56, 'Ignore', P.L_BLACK, { size: 24, phoneAct: 'ignore' });
  ALL_BUTTONS.push(...PHONE_CARDS, PHONE_ANSWER, PHONE_IGNORE);
  function phoneButtons() {
    const p = phoneNow;
    if (!p) return [];
    if (p.step === 'ring') return [PHONE_ANSWER, PHONE_IGNORE];
    if (p.step === 'pick') return PHONE_CARDS.slice(0, p.offer.length);
    return [];
  }
  function maybePhone(then) {
    if (TUT.active || !S.phone) return then();
    const now = nowSec();
    S.phase = 'phone'; S.score = 0; S.dispScore = 0; selected = null; tips = [];
    phoneNow = { step: 'ring', born: now, stepT: now, then, offer: [], line: '', picked: -1, nextRing: now + 1.1, ringT: -9, rings: 0 };
    setBg('table', { spin: 0.6 });
    Music.duck(3);
    sfx('tinnitus');
    placePhone();
  }
  // Jedes Bild: Klingeln im Takt eines alten Telefons (pausiert, solange das Menü offen ist)
  function phoneTick() {
    const p = phoneNow, now = nowSec();
    if (!p || p.step !== 'ring' || settingsOpen || now < p.nextRing) return;
    p.ringT = now; p.rings++; p.nextRing = now + 2.7;
    sfx('ring', { soft: p.rings > 4 });
    Music.duck(2.9);
  }
  function phoneAnswer() {
    const p = phoneNow;
    if (!p || p.step !== 'ring') return;
    p.offer = Phone.offer(S.phone.owned, rng('phone'), phoneCan);
    p.line = Phone.line(S.phone.owned);
    if (S.phone.calls >= 2 && Math.random() < 0.05) p.line = "Got rights? Better call... nobody. I'm busy.";   // seltene Anspielung
    p.step = 'pick'; p.stepT = nowSec();
    S.phone.calls++;
    sfx('pickup');
    tape('first_call');
    placePhone();
  }
  function phoneIgnore() {
    const p = phoneNow;
    if (!p || p.step !== 'ring') return;
    S.phone.ignored++;
    p.step = 'gone'; p.stepT = nowSec();
    sfx('panel', { close: true });
    eng.after(setEff('reduceMotion') ? 0.1 : 0.4, phoneEnd);
  }
  function phonePick(k) {
    const p = phoneNow, id = p && p.step === 'pick' ? p.offer[k] : null;
    if (!id) return;
    const def = Phone.BY_ID[id], b = PHONE_CARDS[k];
    S.phone.owned[id] = (S.phone.owned[id] || 0) + 1;
    achieve('phone', { stack: S.phone.owned[id] });
    p.picked = k; p.step = 'done'; p.stepT = nowSec();
    seen('phone', id);
    sfx('magic');
    eng.emit(b.x + b.w / 2, b.y + b.h / 2, { count: 46, colours: [def.colour, P.GOLD, '#FFFFFF'], speed: 520, size: 10, life: 0.9, shape: 'star' });
    eng.shake(4);
    eng.after(setEff('reduceMotion') ? 0.35 : 1.0, () => { if (phoneNow === p) { sfx('hangup'); phoneEnd(); } });
  }
  function phoneEnd() {
    const p = phoneNow;
    if (!p) return;
    phoneNow = null;
    p.then();
  }
  function phoneKey(e) {
    const p = phoneNow;
    if (!p) return;
    if (p.step === 'ring') {
      if (e.key === 'Enter' || e.key === '1') { sfx('click'); phoneAnswer(); }
      else if (e.key === '2' || e.key === 'Backspace') { sfx('click'); phoneIgnore(); }
    } else if (p.step === 'pick' && /^[1-3]$/.test(e.key)) { sfx('click'); phonePick(+e.key - 1); }
  }
  function phoneGeom() {
    const v = MOBILE ? viewBox() : { l: 0, r: 1280 }, k = MOBILE ? 1.3 : 1;
    const w = Math.min(v.r - v.l - 24, MOBILE ? 1180 : 880), h = MOBILE ? 696 : 560;
    return { k, x: (v.l + v.r) / 2 - w / 2, y: (720 - h) / 2, w, h, cx: (v.l + v.r) / 2, head: 158 * k };
  }
  function placePhone() {
    const p = phoneNow;
    if (!p) return;
    const g = phoneGeom(), k = g.k, gap = 24 * k;
    const bw = 210 * k, iw = 170 * k, bh = 56 * k, by = g.y + g.h - bh - 30 * k;
    Object.assign(PHONE_ANSWER, { x: g.cx - (bw + iw + gap) / 2, y: by, w: bw, h: bh, size: 26 * k });
    Object.assign(PHONE_IGNORE, { x: PHONE_ANSWER.x + bw + gap, y: by, w: iw, h: bh, size: 24 * k });
    const n = Math.max(1, p.offer.length), cg = 22 * k, cw = Math.min(250 * k, (g.w - 48 - cg * (n - 1)) / n);
    const top = g.y + g.head + 12, ch = Math.min(286 * k, g.y + g.h - 24 - top), x0 = g.cx - (n * cw + (n - 1) * cg) / 2;
    PHONE_CARDS.forEach((b, i) => Object.assign(b, { x: x0 + i * (cw + cg), y: top, w: cw, h: ch }));
  }
  // Kleines Bild eines Vorteils: Würfelseiten oder ein Symbol aus card-icons.js
  function phoneGlyph(ctx, def, cx, cy, size) {
    if (def.face) {
      const n = def.face.length, s = n === 1 ? size * 0.66 : size * 0.44, gap = s * 0.12, x0 = cx - (n * s + (n - 1) * gap) / 2;
      ctx.save(); ctx.imageSmoothingEnabled = false;
      def.face.forEach((v, i) => ctx.drawImage(faceEntry({ v, kind: 'normal' }, 'standard').canvas, Math.round(x0 + i * (s + gap)), Math.round(cy - s / 2), Math.round(s), Math.round(s)));
      ctx.restore();
    } else Icons.draw(ctx, def.icon, cx, cy, size);
  }
  // Kachel eines Vorteils (Codex, Pause, Auswertung)
  function phoneTile(ctx, id, x, y, size) {
    const def = Phone.BY_ID[id];
    if (!def) return;
    UI.box(ctx, x, y, size, size, { colour: def.colour, radius: Math.max(4, size * 0.12), shadow: false, outline: lighten(def.colour, 0.35), outlineWidth: 2 });
    phoneGlyph(ctx, def, x + size / 2, y + size / 2, size * 0.72);
  }
  // Stapel als kleine Pixel-Quadrate (keine Zahlen)
  function phonePips(ctx, n, cx, cy, s, col) {
    const shown = Math.min(n, 6), gap = s * 0.6, x0 = cx - (shown * s + (shown - 1) * gap) / 2;
    ctx.save();
    for (let i = 0; i < shown; i++) {
      const x = Math.round(x0 + i * (s + gap)), y = Math.round(cy - s / 2);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 1, y + 2, s, s);
      ctx.fillStyle = col; ctx.fillRect(x, y, s, s);
    }
    ctx.restore();
  }
  // Altes Telefon in Pixeln (Raster 48 x 34, u = Bildschirmpixel pro Rasterpunkt). lifted: Hörer abgenommen.
  function drawTelephone(ctx, cx, cy, u, o = {}) {
    if (window.WGPropArt && window.WGPropArt.draw(ctx, o.lifted ? 'telephone-lifted' : 'telephone-idle', cx - 28 * u + (o.dx || 0) * u, cy - 32 * u + (o.hop || 0) * u, 56 * u, 56 * u)) return;
    const body = PHONE_COL, dark = darken(body, 0.32), light = lighten(body, 0.28), metal = '#CFC6B2', cream = '#EADFC6', ink = '#2A1D1F';
    const ox = Math.round(cx - 24 * u + (o.dx || 0) * u), oy = Math.round(cy - 17 * u);
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(ox + Math.round(x * u), oy + Math.round(y * u), Math.ceil(w * u), Math.ceil(h * u)); };
    const disc = (x, y, r, c) => { for (let dy = -r; dy <= r; dy++) { const hw = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy))); R(x - hw, y + dy, hw * 2 + 1, 1, c); } };
    ctx.save();
    R(4, 32, 41, 2, 'rgba(0,0,0,0.35)');
    // Gehäuse: Trapez, unten breiter
    for (let i = 0; i < 18; i++) { const w = 28 + 2 * Math.round((i * 6) / 17); R(24 - w / 2, 14 + i, w, 1, i < 1 ? light : i > 14 ? dark : body); }
    R(11, 15, 2, 12, light);
    // Wählscheibe
    disc(24, 22, 7, cream);
    for (let a = 0; a < 9; a++) { const ang = -2.2 + a * 0.62; R(24 + Math.round(Math.cos(ang) * 5) - 1, 22 + Math.round(Math.sin(ang) * 5) - 1, 2, 2, ink); }
    disc(24, 22, 2, dark);
    // Gabel
    R(9, 10, 3, 5, metal); R(36, 10, 3, 5, metal);
    // Hörer: liegt auf der Gabel oder schwebt darüber (abgenommen, mit Spiralkabel)
    const hy = o.lifted ? -9 : (o.hop || 0), hx = o.lifted ? -5 : 0;
    const hand = (x, y) => {
      R(x + 3, y + 5, 36, 4, body); R(x + 3, y + 5, 36, 1, light);
      R(x + 1, y + 1, 9, 9, body); R(x, y + 2, 11, 7, body); R(x + 1, y + 1, 9, 1, light); R(x + 1, y + 9, 9, 1, dark);
      R(x + 37, y + 1, 9, 9, body); R(x + 36, y + 2, 11, 7, body); R(x + 37, y + 1, 9, 1, light); R(x + 37, y + 9, 9, 1, dark);
    };
    if (o.lifted) for (let i = 0; i < 9; i++) R(4 - (i % 2) - Math.round(i * 0.3), 24 - i * 2.2, 2, 2, ink);
    hand(1 + hx, 3 + hy);
    ctx.restore();
  }
  // Klingel-Wellen ")))" links und rechts, ebenfalls in Pixeln
  function drawRingWaves(ctx, cx, cy, u, q) {
    ctx.save();
    ctx.fillStyle = P.GOLD;
    for (let i = 0; i < 3; i++) {
      const a = Math.max(0, Math.min(1, q * 3 - i)) * (1 - q * 0.6);
      if (a <= 0) continue;
      ctx.globalAlpha = a;
      const d = (30 + i * 5) * u, h = (6 + i * 3) * u, s = Math.ceil(1.4 * u);
      for (const side of [-1, 1]) {
        const x = Math.round(cx + side * d), xo = side > 0 ? 0 : -s;
        ctx.fillRect(x + xo, Math.round(cy - h / 4), s, Math.round(h / 2));
        ctx.fillRect(x + xo - side * s, Math.round(cy - h / 2), s, Math.round(h / 4));
        ctx.fillRect(x + xo - side * s, Math.round(cy + h / 4), s, Math.round(h / 4));
      }
    }
    ctx.restore();
  }
  function drawPhoneCall(ctx, t) {
    const p = phoneNow;
    if (!p || S.phase !== 'phone') return;
    const g = phoneGeom(), k = g.k, now = nowSec(), mv = !setEff('reduceMotion');
    dim(ctx, 0.55);
    // Klingeln im Ohr: kurz ein heller Schleier
    const ear = mv ? Math.max(0, 1 - (now - p.born) / 1.3) : 0;
    if (ear > 0) {
      const v = MOBILE ? viewBox() : { l: 0, r: 1280, t: 0, b: 720 };
      ctx.save(); ctx.fillStyle = 'rgba(255,248,232,' + (0.3 * ear * ear).toFixed(3) + ')'; ctx.fillRect(v.l - 10, v.t - 10, v.r - v.l + 20, v.b - v.t + 20); ctx.restore();
    }
    const intro = mv ? 1 - encEase((now - p.born) / 0.35) : 0, out = p.step === 'gone' && mv ? encEase((now - p.stepT) / 0.35) : 0;
    ctx.save(); ctx.translate(0, intro * 50 + out * 40); ctx.globalAlpha = Math.max(0, 1 - intro * 0.8 - out);
    UI.box(ctx, g.x, g.y, g.w, g.h, { colour: P.OVERLAY_SOLID, radius: 18, outline: PHONE_COL, outlineWidth: 3 });
    if (p.step === 'ring' || p.step === 'gone') {
      UI.text(ctx, 'Incoming call', g.cx, g.y + 40 * k, { size: 20 * k, colour: P.TEXT_LABEL });
      UI.dynaText(ctx, Phone.CALLER, g.cx, g.y + 82 * k, { size: 42 * k, colour: lighten(PHONE_COL, 0.5), time: t, wave: 2 });
      const burst = now - p.ringT, ringing = p.step === 'ring' && burst < 1.15, u = 5.2 * k, py = g.y + g.h * 0.5;
      const rattle = ringing && mv ? (Math.floor(now * 28) % 2 ? 1 : -1) : 0;
      if (ringing) drawRingWaves(ctx, g.cx, py, u, Math.min(1, burst / 1.15));
      drawTelephone(ctx, g.cx, py, u, { dx: rattle * 0.6, hop: ringing && mv && rattle > 0 ? -1 : 0 });
      UI.button(ctx, PHONE_ANSWER, t);
      UI.button(ctx, PHONE_IGNORE, t);
    } else {
      // Kopf: Telefon mit abgenommenem Hörer, Name und ein einziger Satz
      const u = 2.4 * k, px = g.x + 30 + 26 * u, py = g.y + (MOBILE ? 40 : 54) * k + 18 * u;
      drawTelephone(ctx, px, py, u, { lifted: true });
      const tx = px + 34 * u, tw = g.x + g.w - 26 - tx;
      UI.dynaText(ctx, Phone.CALLER, tx, g.y + 34 * k, { size: fitText(ctx, Phone.CALLER, tw, 30 * k), colour: lighten(PHONE_COL, 0.5), time: t, wave: 1.5, align: 'left' });
      const size = 19 * k * Math.min(tipK(), 1.15), lines = wrapPlain(ctx, p.line, tw - 28, size).slice(0, 2), bh = Math.max(54 * k, lines.length * size * 1.25 + 22), by = g.y + 62 * k;
      const chars = mv ? Math.floor((now - p.stepT) * 55) : 1e9;
      UI.box(ctx, tx, by, tw, bh, { colour: '#FFFFFF', radius: 12, shadow: false });
      let left = Math.max(0, chars);
      lines.forEach((ln, i) => { const part = ln.slice(0, left); left = Math.max(0, left - ln.length); UI.text(ctx, part, tx + 14, by + 11 + size * 0.62 + i * size * 1.25, { size, colour: P.BLACK, shadow: false, align: 'left' }); });
      p.offer.forEach((id, i) => drawPhoneCard(ctx, p, i, id, k, now, mv));
    }
    ctx.restore();
  }
  function drawPhoneCard(ctx, p, i, id, k, now, mv) {
    const b = PHONE_CARDS[i], def = Phone.BY_ID[id], mine = p.step === 'done' && p.picked === i, n = (S.phone.owned[id] || 0) - (mine ? 1 : 0);
    const deal = mv ? encEase((now - p.stepT - 0.08 * i) / 0.32) : 1, done = p.step === 'done';
    const lift = (b.hover || focusBtn === b) && !done ? 10 : mine ? 14 : 0, alpha = deal * (done && !mine ? 0.3 : 1);
    if (alpha <= 0.01) return;
    const dark = '#2A1F45', cx = b.x + b.w / 2;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(0, (1 - deal) * 70 - lift);
    if (mine && mv) { const s = 1 + 0.05 * Math.sin(Math.min(1, (now - p.stepT) / 0.25) * Math.PI); ctx.translate(cx, b.y + b.h / 2); ctx.scale(s, s); ctx.translate(-cx, -(b.y + b.h / 2)); }
    UI.box(ctx, b.x, b.y, b.w, b.h, { colour: '#F4EEDF', radius: 12, outline: mine ? P.GOLD : def.colour, outlineWidth: mine ? 5 : 4, frame: false });
    const band = 104 * k;
    UI.box(ctx, b.x + 8, b.y + 8, b.w - 16, band, { colour: def.colour, radius: 8, shadow: false });
    phoneGlyph(ctx, def, cx, b.y + 8 + band / 2, 70 * k);
    if (!MOBILE) UI.text(ctx, String(i + 1), b.x + 22, b.y + 24, { size: 16, colour: '#FFFFFF' });
    const ns = fitText(ctx, def.name, b.w - 24, 24 * k);
    UI.text(ctx, def.name, cx, b.y + band + 36 * k, { size: ns, colour: darken(def.colour, 0.25), shadow: false });
    const ts = 18 * k * Math.min(tipK(), 1.1), tl = wrapPlain(ctx, def.text, b.w - 30, ts).slice(0, 4);
    tl.forEach((ln, j) => UI.text(ctx, ln, cx, b.y + band + 72 * k + j * ts * 1.3, { size: ts, colour: dark, shadow: false }));
    // Unten: neu oder schon da (Stapel als Pixel-Quadrate)
    const fy = b.y + b.h - 26 * k;
    if (n > 0) {
      UI.text(ctx, 'Again', cx, fy - 16 * k, { size: 14 * k, colour: '#6B5A48', shadow: false });
      phonePips(ctx, n + (mine ? 1 : 0), cx, fy + 4 * k, Math.round(9 * k), mine ? P.GOLD : def.colour);
    } else UI.text(ctx, mine ? 'Yours' : 'New', cx, fy, { size: 17 * k, colour: mine ? darken(P.GOLD, 0.25) : '#3E9E58', shadow: false });
    ctx.restore();
  }
  // Pause am PC: rechts neben den Einstellungen die Vorteile vom Telefon
  function drawPhonePanel(c, t) {
    if (MOBILE || inMenus() || !S.phone || TUT.active) return;
    const x = 954, y = 84, w = 306, h = 576, own = Phone.LIST.filter((d) => S.phone.owned[d.id] > 0);
    UI.box(c, x, y, w, h, { colour: P.OVERLAY_SOLID, radius: 18, outline: PHONE_COL, outlineWidth: 2 });
    UI.dynaText(c, 'Phone Calls', x + w / 2, y + 30, { size: 30, colour: lighten(PHONE_COL, 0.5), time: t, wave: 1.5 });
    const sub = 'Answered ' + S.phone.calls + '  ·  Ignored ' + S.phone.ignored;
    UI.text(c, sub, x + w / 2, y + 60, { size: 15, colour: P.TEXT_SOFT });
    if (!own.length) {
      wrapPlain(c, UI.tx('The phone rings after every Showdown. Pick up to choose a gift for this run.'), w - 50, 16).forEach((ln, i) => UI.text(c, ln, x + w / 2, y + 110 + i * 22, { size: 16, colour: P.TEXT_FAINT }));
      return;
    }
    const rowH = 46, max = Math.floor((h - 120) / rowH);
    own.slice(0, max).forEach((d, i) => {
      const ry = y + 84 + i * rowH;
      phoneTile(c, d.id, x + 22, ry, 38);
      UI.text(c, d.name, x + 70, ry + 11, { size: fitText(c, d.name, 140, 16), align: 'left' });
      phonePips(c, S.phone.owned[d.id], x + w - 54, ry + 11, 7, P.GOLD);
      UI.text(c, d.text, x + 70, ry + 30, { size: fitText(c, d.text, w - 96, 13), colour: P.TEXT_SOFT, align: 'left' });
    });
    if (own.length > max) UI.text(c, '+' + (own.length - max) + ' more', x + w / 2, y + h - 30, { size: 14, colour: P.TEXT_SOFT });
  }
  // Handy (Reiter "Run"): Kacheln der Vorteile unter der Statistik
  function drawPhoneRowMobile(c, g) {
    if (!S.phone || TUT.active) return;
    // rechte Spalte unter den Regeln (wie drawRunTabMobile: zwei Spalten mit colW)
    const own = Phone.LIST.filter((d) => S.phone.owned[d.id] > 0), colW = Math.min(620, (g.pw - 60) / 2), x = g.vc + 10 + 12, y = 166 + 10 * 31 + 14;
    UI.text(c, own.length ? 'Phone calls' : 'Phone calls: nothing yet', x, y, { size: 21, colour: P.TEXT_LABEL, align: 'left' });
    const s = 36, step = s + 8, per = Math.max(1, Math.floor((colW - 12) / step));
    own.slice(0, per * 2).forEach((d, i) => {
      const tx = x + (i % per) * step, ty = y + 20 + Math.floor(i / per) * (s + 14);
      phoneTile(c, d.id, tx, ty, s);
      if (S.phone.owned[d.id] > 1) phonePips(c, S.phone.owned[d.id], tx + s / 2, ty + s + 6, 4, P.GOLD);
    });
  }


  // ── GIF der besten Hand (Daten: replay.js, Encoder: gif.js) ─────────────
  const GIF_W = 480, GIF_H = 270, GIF_N = 100;
  const gifOf = (rec) => !!(rec && rec.replay && rec.replay.frames && rec.replay.frames.length);
  let gifBusy = false;
  function gifFrame(g, rec, f) {
    const rp = rec.replay, base = studioActive() ? SETTINGS.studio.c1 : PAL.bg.table.base;
    g.imageSmoothingEnabled = false;
    g.fillStyle = darken(base, 0.35); g.fillRect(0, 0, GIF_W, GIF_H);
    g.fillStyle = darken(base, 0.27);
    for (let y = 0; y < GIF_H; y += 18) for (let x = (y / 18) % 2 ? 0 : 18; x < GIF_W; x += 36) g.fillRect(x, y, 18, 18);
    const rolls = rp.frames.slice(-3), rollEnd = rolls.length * 12, stepEnd = 78, n = rp.steps.length;
    const inRoll = f < rollEnd, idx = Math.min(rolls.length - 1, Math.floor(f / 12)), local = f - idx * 12, fr = inRoll ? rolls[idx] : rolls[rolls.length - 1];
    const stepK = inRoll || !n ? -1 : Math.min(n - 1, Math.floor(((f - rollEnd) / Math.max(1, stepEnd - rollEnd)) * n)), step = stepK >= 0 && f < stepEnd ? rp.steps[stepK] : null;
    const count = fr.f.length, size = count > 5 ? 54 : 64, gap = count > 5 ? 10 : 14, x0 = GIF_W / 2 - (count * size + (count - 1) * gap) / 2;
    // Titel und Relikte
    UI.text(g, inRoll ? 'Rolling...' : rp.name, GIF_W / 2, 22, { size: 22, colour: P.GOLD });
    const rel = (rp.relics || []).filter((id) => R.RELIC_BY_ID[id]).slice(0, 8), rs = 26, rx = GIF_W / 2 - (rel.length * (rs + 4) - 4) / 2;
    rel.forEach((id, i) => { const pop = step && step.r === i ? 4 : 0; drawReward(g, 'relic', id, rx + i * (rs + 4) - pop / 2, 42 - pop / 2, rs + pop, false); });
    // Würfel
    const mt = MAT;
    fr.f.forEach(([v, kind], i) => {
      const type = rp.types[i] || 'standard', tumbling = inRoll && local < 7 && !(idx > 0 && rolls[idx - 1].h[i] && rolls[idx - 1].f[i][0] === v);
      const shown = tumbling ? { v: 1 + ((f * 7 + i * 13) % 6), kind: 'normal' } : { v, kind };
      const hop = tumbling ? Math.round(Math.abs(Math.sin(f * 1.3 + i)) * 14) : 0, held = !inRoll || fr.h[i] ? (inRoll ? 8 : 0) : 0, hit = step && (step.i === i || step.j === i) ? 6 : 0;
      const s = size + hit, x = Math.round(x0 + i * (size + gap) - hit / 2), y = 112 - hop - held - hit / 2;
      const entry = faceEntry(shown, type);
      if (mt && mt.halo) { g.fillStyle = mt.halo[0]; g.globalAlpha = mt.halo[1]; g.fillRect(x - 4, y - 4, s + 8, s + 8); g.globalAlpha = 1; }
      g.drawImage(entry.canvas, x, y, s, s);
      if (mt && (mt.shine || mt.shimmer) && entry.tex.mask && entry.tex.mask.source) {
        // Glanz nur auf der Körperfläche: Maske wird als Muster genutzt, gezeichnet wird ein wandernder Lichtstreifen
        const px = s / 32, band = Math.floor(((f + i * 9) * 0.9) % 44) - 6, src = entry.tex.mask.source.getContext('2d').getImageData(0, 0, 32, 32).data;
        g.fillStyle = 'rgba(255,255,255,' + (mt.shine || mt.shimmer) + ')';
        for (let py = 0; py < 32; py++) for (let qx = band - py / 2; qx < band - py / 2 + 5; qx++) { const xi = Math.floor(qx); if (xi >= 0 && xi < 32 && src[(py * 32 + xi) * 4] > 127) g.fillRect(x + xi * px, y + py * px, Math.ceil(px), Math.ceil(px)); }
      }
    });
    // Zähler
    const show = step || (!inRoll && n ? rp.steps[n - 1] : null), chips = inRoll ? 0 : f >= stepEnd ? rp.chips : show ? show.c : rp.chips, mult = inRoll ? 0 : f >= stepEnd ? rp.mult : show ? show.m : rp.mult;
    if (f < stepEnd) {
      UI.box(g, 130, 196, 100, 34, { colour: P.CHIPS, radius: 7, emboss: 3 }); UI.text(g, UI.num(Math.round(chips)), 180, 212, { size: 22 });
      UI.text(g, 'x', 240, 212, { size: 18, colour: P.MULT });
      UI.box(g, 250, 196, 100, 34, { colour: P.MULT, radius: 7, emboss: 3 }); UI.text(g, fmtMult(mult), 300, 212, { size: 22 });
    } else {
      const age = Math.min(1, (f - stepEnd) / 7), sz = 20 + FX.Ease.outBack(age) * 26;
      UI.text(g, UI.num(rp.total), GIF_W / 2, 214, { size: sz, colour: P.GOLD });
    }
    const foot = (rec.endless ? 'Endless ' : 'Stage ') + (rp.stage || rec.stage) + '  ·  ' + (CUP_BY_ID[rp.cup || rec.cup] || CUPS[0]).name + '  ·  Aleator';
    UI.text(g, foot, GIF_W / 2, 256, { size: 13, colour: P.TEXT_SOFT });
  }
  async function makeHandGif(rec) {
    const c = document.createElement('canvas'); c.width = GIF_W; c.height = GIF_H;
    const g = c.getContext('2d', { willReadFrequently: true });
    const hexes = [...new Set(Object.values(P).filter((v) => typeof v === 'string' && v[0] === '#' && v.length === 7).concat(['#FFFFFF', '#000000']))];
    const pal = Gif.buildPalette(hexes), map = Gif.mapper(pal), wr = new Gif.Writer(GIF_W, GIF_H, pal, 5, 2);
    for (let f = 0; f < GIF_N; f++) {
      gifFrame(g, rec, f);
      wr.add(Gif.indexFrame(g.getImageData(0, 0, GIF_W, GIF_H).data, map), f === GIF_N - 1 ? 150 : 5);
      if (f % 4 === 3) await new Promise((res) => setTimeout(res, 0));   // Spiel bleibt flüssig
    }
    return wr.finish();
  }
  async function saveGif(rec) {
    if (!gifOf(rec) || gifBusy) return;
    gifBusy = true;
    const note = (text) => eng.popup(B.gif.x + B.gif.w / 2, B.gif.y - 22, text, { colour: P.GOLD, size: 20, life: 1.8 });
    try {
      const bytes = await makeHandGif(rec), blob = new Blob([bytes], { type: 'image/gif' });
      const name = 'aleator-best-hand-' + new Date(rec.date || Date.now()).toISOString().slice(0, 10) + '.gif';
      const file = typeof File !== 'undefined' ? new File([blob], name, { type: 'image/gif' }) : null;
      sfx('coin');
      if (MOBILE && file && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: 'Aleator', text: 'My best hand: ' + rec.replay.name }).catch(() => {}); return; }
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      note('GIF saved!');
    } catch (e) { denied(B.gif.x + B.gif.w / 2, B.gif.y - 20, 'Could not make the GIF'); } finally { gifBusy = false; }
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
        UI.text(front, (r.endless ? 'Endless ' : 'Stage ') + r.ante + '  ·  ' + where, cx, ry + 48, { size: 22 });
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
          UI.text(front, a, x + 26, sy - 6 + i * 22, { size: 17, colour: P.TEXT_LABEL, align: 'left' });
          UI.text(front, String(b), x + w - 26, sy - 6 + i * 22, { size: 17, align: 'right' });
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

  // ── Challenges: Daily Challenge, feste Challenges, Build Mastery (challenges.js) ──
  // Ein Challenge-Run nutzt den gewählten Speicherplatz wie ein normaler Run. S.chal = { id } oder { daily, tag, relic, practice }.
  const CH_TABS = [{ id: 'daily', label: 'Daily' }, { id: 'list', label: 'Challenges' }, { id: 'mastery', label: 'Build Wall' }];
  const CH_TAB_BTNS = CH_TABS.map((tb, i) => btn(0, 0, 200, 46, tb.label, P.L_BLACK, { size: 22, chTab: i }));
  ALL_BUTTONS.push(...CH_TAB_BTNS);
  let chTab = 0, chSel = null, chHits = [];
  function openChallenges() {
    if (!Chal || !profile) return;
    clearMenuSprites();
    Chal.ensure(meta());
    S.phase = 'challenges'; chHits = []; tips = [];
    if (!chSel) chSel = (Chal.LIST.find((c) => Chal.isOpen(meta(), c.id) && !Chal.won(meta(), c.id)) || Chal.LIST[0]).id;
    setBg('shop', { spin: 1.2 });
    sfx('page');
  }
  function chalStart() {
    if (chTab === 0) return startDailyRun();
    if (chTab === 1 && chSel && Chal.isOpen(meta(), chSel)) { S.chal = { id: chSel }; Saves.saveMeta(); startRun('classic'); }
  }
  function startDailyRun() {
    const d = Chal.daily(), m = Chal.ensure(meta()), practice = !!m.daily[d.key];
    if (!practice) m.daily[d.key] = { stage: 1, won: false, t: Date.now() };   // der gewertete Versuch zählt ab dem Start
    S.chal = { daily: d.key, tag: d.tag, relic: d.relic, practice };
    Saves.saveMeta();
    startRun('classic', d.seed);
    if (practice) eng.after(1.2, () => showMsg('Practice run', P.PURPLE, "Today's rated attempt is done. This one is just for fun.", 2.4));
  }
  // Belohnungen vergeben (Becher, Farben, Materialien) und als Einblendung zeigen
  function giveRewards(list, head, name) {
    const m = meta();
    list.forEach(([kind, id]) => {
      if (kind === 'cup') { const pool = drawableCups(); for (let k = 0; k < id; k++) { const c = R.pick(pool); m.cups[c.id] = (m.cups[c.id] || 0) + 1; } }
      else Cos.grant(m, kind, id);
    });
    Saves.saveMeta();
    toasts.push({ a: { id: 'chal', name, desc: head, head, rewards: list }, t0: null });
  }
  // Build Mastery: ★ Stage 4 mit Set 3 (bei jedem Stage-Start ab 4), ★★/★★★ beim Sieg
  function masteryCheck(ev) {
    if (!Chal || !profile || TUT.active) return;
    Chal.addStars(meta(), Chal.starsFor(R.tagCounts(S.relics), ev, S.ante)).forEach(([tag, star]) =>
      giveRewards([Chal.starReward(tag, star)], 'Build Mastery', R.TAGS[tag].name + ': ' + star + (star === 1 ? ' star' : ' stars')));
  }
  // Run zu Ende: Challenge-Sieg, Daily-Ergebnis und Serie, Mastery-Sterne
  function chalFinish(won) {
    if (!Chal || !profile || TUT.active) return;
    const m = Chal.ensure(meta()), ch = S.chal;
    if (won) masteryCheck('win');
    if (!ch) return;
    if (ch.id) {
      const rec = m.chal[ch.id] || (m.chal[ch.id] = { wins: 0, best: 0 });
      rec.best = Math.max(rec.best || 0, Math.min(S.ante, ANTES));
      if (won && ++rec.wins === 1) giveRewards(Chal.winReward(ch.id), 'Challenge won', Chal.BY_ID[ch.id].name);
    }
    if (ch.daily && !ch.practice) {
      m.daily[ch.daily] = { stage: Math.min(S.ante, ANTES), won: !!won, score: (S.stats && S.stats.best) || 0, t: Date.now() };
      Chal.streakDue(m).forEach(([n, rw]) => { m.dailyRewards[n] = Date.now(); giveRewards([rw], 'Daily streak', n + ' days in a row'); });
    }
    Saves.saveMeta();
  }

  // Bildschirm
  function chGeom() {
    const v = MOBILE ? viewBox() : { l: 0, r: 1280 }, k = MOBILE ? 1.25 : 1;
    const pw = Math.min(v.r - v.l - 40, MOBILE ? 1500 : 1120), px = (v.l + v.r) / 2 - pw / 2;
    return { v, k, pw, px, py: MOBILE ? 140 : 132, ph: MOBILE ? 456 : 474, cx: (v.l + v.r) / 2 };
  }
  function placeChallenges() {
    const g = chGeom(), tw = 210 * g.k, th = (MOBILE ? 58 : 44);
    CH_TAB_BTNS.forEach((b, i) => Object.assign(b, { x: g.cx + (i - 1) * (tw + 12) - tw / 2, y: MOBILE ? 72 : 78, w: tw, h: th, size: 22 * g.k, colour: i === chTab ? P.BLUE : darken(P.PANEL, 0.1) }));
    const d = chTab === 0 ? Chal.daily() : null, m = meta();
    if (chTab === 0) { B.chStart.label = m.daily && m.daily[d.key] ? 'Practice' : 'Start Daily'; B.chStart.disabled = false; }
    else { B.chStart.label = 'Start Challenge'; B.chStart.disabled = !chSel || !Chal.isOpen(m, chSel); }
  }
  function chalButtons() { return [...CH_TAB_BTNS, ...(chTab < 2 ? [B.chStart] : []), B.back]; }
  function chalClick(m) {
    const h = chHits.find((q) => UI.inside(q.r, m));
    if (!h) { tips = []; return; }
    if (h.sel) { chSel = h.sel; sfx('card'); }
    if (h.info && MOBILE) openTip({ key: 'ch:' + h.r.x + ':' + h.r.y, anchor: h.r, info: h.info });
  }
  function drawStar(ctx, x, y, r, on) {
    ctx.save(); ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fillStyle = on ? P.GOLD : darken(P.PANEL, 0.25); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = on ? '#FFF2C0' : lighten(P.PANEL, 0.2); ctx.stroke(); ctx.restore();
  }
  function drawChallenges(back, front, t) {
    placeChallenges();
    const g = chGeom(), m = Chal.ensure(meta());
    chHits = [];
    UI.dynaText(front, 'Challenges', g.cx, MOBILE ? 36 : 40, { size: (MOBILE ? 48 : 48), time: t, wave: 2.5, colour: P.GOLD });
    UI.box(back, g.px, g.py, g.pw, g.ph, { colour: P.OVERLAY_SOLID, radius: 16, emboss: 4, outline: lighten(P.PANEL, 0.15), outlineWidth: 2 });
    if (chTab === 0) drawDailyTab(back, front, t, g, m);
    else if (chTab === 1) drawChalList(back, front, t, g, m);
    else drawBuildWall(back, front, t, g, m);
    for (const b of chalButtons()) UI.button(front, b, t);
  }
  function drawDailyTab(back, ctx, t, g, m) {
    const k = g.k, d = Chal.daily(), tag = R.TAGS[d.tag], rel = R.RELIC_BY_ID[d.relic], rec = m.daily[d.key];
    const lw = g.pw * 0.52, x = g.px + (MOBILE ? 24 : 32), y = g.py + (MOBILE ? 22 : 28);
    UI.text(ctx, 'Daily Challenge  ·  ' + new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }), x, y + 8 * k, { size: 22 * k, colour: P.GOLD, align: 'left' });
    UI.text(ctx, 'Same dice, shops and bosses for everyone today.', x, y + 36 * k, { size: 15 * k, colour: P.TEXT_SOFT, align: 'left' });
    // Build of the Day mit Start-Relikt
    const by = y + 58 * k, bh = 128 * k;
    UI.box(back, x, by, lw - 24, bh, { colour: darken(tag.colour, 0.55), radius: 12, shadow: false, outline: tag.colour, outlineWidth: 2 });
    Icons.tag(ctx, d.tag, x + 34 * k, by + 34 * k, 44 * k);
    UI.text(ctx, 'Build of the Day: ' + tag.name, x + 66 * k, by + 24 * k, { size: 21 * k, colour: lighten(tag.colour, 0.45), align: 'left' });
    UI.text(ctx, 'Set 3: ' + tag.s3, x + 66 * k, by + 48 * k, { size: fitText(ctx, 'Set 3: ' + tag.s3, lw - 110 * k, 14 * k), colour: P.TEXT_SOFT, align: 'left' });
    drawReward(ctx, 'relic', d.relic, x + 14 * k, by + 66 * k, 50 * k, false);
    UI.text(ctx, 'Start with ' + rel.name, x + 76 * k, by + 78 * k, { size: 18 * k, align: 'left' });
    UI.text(ctx, rel.desc, x + 76 * k, by + 102 * k, { size: fitText(ctx, rel.desc, lw - 120 * k, 14 * k), colour: P.TEXT_SOFT, align: 'left' });
    chHits.push({ r: { x: x + 14 * k, y: by + 66 * k, w: 50 * k, h: 50 * k }, info: plainInfo('relic', d.relic) });
    // Status des Tages und Serie
    const sy = by + bh + 26 * k;
    const status = !rec ? 'Your rated attempt for today is ready.' : rec.won ? 'Today: you won! Play again as practice.' : "Today's rated attempt: Stage " + rec.stage + '. Play again as practice.';
    UI.text(ctx, status, x, sy, { size: fitText(ctx, status, lw - 24, 18 * k), colour: rec && rec.won ? P.GOLD : P.WHITE, align: 'left' });
    const st = Chal.streak(m);
    UI.text(ctx, 'Streak: ' + st + (st === 1 ? ' day' : ' days') + ' in a row', x, sy + 32 * k, { size: 20 * k, colour: P.ORANGE, align: 'left' });
    Chal.STREAK_REWARDS.forEach(([n, rw], i) => {
      const rx = x + i * ((lw - 24) / 4), ry = sy + 52 * k, got = !!m.dailyRewards[n], s = 40 * k;
      drawReward(ctx, rw[0], rw[1], rx, ry, s, !got);
      UI.text(ctx, n + ' days', rx + s + 8 * k, ry + s / 2 - 8 * k, { size: 15 * k, colour: got ? P.GOLD : P.TEXT_SOFT, align: 'left' });
      UI.text(ctx, got ? 'Got it' : rewardName(rw[0], rw[1]), rx + s + 8 * k, ry + s / 2 + 10 * k, { size: fitText(ctx, got ? 'Got it' : rewardName(rw[0], rw[1]), (lw - 24) / 4 - s - 14 * k, 12 * k), colour: P.TEXT_DIM, align: 'left' });
      chHits.push({ r: { x: rx, y: ry, w: s, h: s }, info: { title: rewardName(rw[0], rw[1]), desc: 'Play the Daily Challenge ' + n + ' days in a row.', badge: ['Reward', P.GOLD] } });
    });
    // Kalender des Monats
    const now = new Date(), cx0 = g.px + lw + 10, cw = g.pw - lw - (MOBILE ? 34 : 44), first = new Date(now.getFullYear(), now.getMonth(), 1);
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(), off = (first.getDay() + 6) % 7, rows = Math.ceil((off + days) / 7);
    UI.text(ctx, now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }), cx0 + cw / 2, y + 8 * k, { size: 21 * k, colour: P.TEXT_LABEL });
    const top = y + 48 * k, cell = Math.min(cw / 7, (g.ph - 90 * k) / (rows + 0.6));
    ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach((w, i) => UI.text(ctx, w, cx0 + (i + 0.5) * (cw / 7), top, { size: 14 * k, colour: P.TEXT_DIM }));
    for (let dd = 1; dd <= days; dd++) {
      const pos = off + dd - 1, col = pos % 7, row = Math.floor(pos / 7);
      const bx = cx0 + col * (cw / 7) + (cw / 7 - cell) / 2 + 2, by2 = top + 16 * k + row * cell, key = Chal.dayKey(new Date(now.getFullYear(), now.getMonth(), dd)), r2 = m.daily[key];
      const today = dd === now.getDate();
      UI.box(back, bx, by2, cell - 4, cell - 4, { colour: r2 ? (r2.won ? darken(P.GOLD, 0.35) : darken(P.GREEN, 0.4)) : P.PANEL_DARK, radius: 6, shadow: false,
        outline: today ? P.WHITE : undefined, outlineWidth: today ? 2 : 0 });
      UI.text(ctx, String(dd), bx + (cell - 4) / 2, by2 + (cell - 4) * (r2 ? 0.34 : 0.5), { size: 14 * k, colour: dd > now.getDate() ? P.TEXT_DIM : P.WHITE });
      if (r2) UI.text(ctx, r2.won ? 'Win' : 'St ' + r2.stage, bx + (cell - 4) / 2, by2 + (cell - 4) * 0.72, { size: 11 * k, colour: r2.won ? P.GOLD : P.TEXT_SOFT });
    }
  }
  function drawChalList(back, ctx, t, g, m) {
    const k = g.k, cols = MOBILE ? 4 : 5, list = Chal.LIST, rows = Math.ceil(list.length / cols), gap = 10 * k;
    const pad = MOBILE ? 18 : 28, top = MOBILE ? 16 : 26, bot = MOBILE ? 12 : 26;   // PC: Abstand zum Rahmen und zu den Nieten
    const detailH = 132 * k, gx = g.px + pad, gw = g.pw - 2 * pad, cw = (gw - gap * (cols - 1)) / cols;
    const chh = Math.min(92 * k, (g.ph - detailH - top - bot - (MOBILE ? 2 : gap) - gap * (rows - 1)) / rows);
    const wins = Chal.wins(m);
    list.forEach((c, i) => {
      const col = i % cols, row = Math.floor(i / cols), x = gx + col * (cw + gap), y = g.py + top + row * (chh + gap);
      const open = Chal.isOpen(m, c.id), won = Chal.won(m, c.id), sel = chSel === c.id, hover = !MOBILE && UI.inside({ x, y, w: cw, h: chh }, eng.mouse);
      UI.box(back, x, y, cw, chh, { colour: open ? darken(c.colour, 0.55) : P.PANEL_DARK, radius: 10, shadow: false, outline: sel ? P.GOLD : hover ? lighten(c.colour, 0.3) : open ? c.colour : P.GREY, outlineWidth: sel ? 3 : 2 });
      UI.box(back, x + 6, y + 6, 6, chh - 12, { colour: open ? c.colour : P.GREY, radius: 3, shadow: false });
      UI.text(ctx, open ? c.name : '???', x + cw / 2 + 4, y + chh * 0.32, { size: fitText(ctx, open ? c.name : '???', cw - 30, 19 * k), colour: open ? P.WHITE : P.TEXT_DIM });
      const sub = !open ? 'Locked' : won ? 'Won' + (m.chal[c.id].wins > 1 ? ' x' + m.chal[c.id].wins : '') : c.tag ? R.TAGS[c.tag].name + ' build' : 'Final challenge';
      UI.text(ctx, sub, x + cw / 2 + 4, y + chh * 0.68, { size: fitText(ctx, sub, cw - 30, 14 * k), colour: won ? P.GOLD : open ? lighten(c.colour, 0.4) : P.TEXT_DIM });
      if (won) drawStar(ctx, x + cw - 16 * k, y + 16 * k, 9 * k, true);
      chHits.push({ r: { x, y, w: cw, h: chh }, sel: c.id });
    });
    // Beschreibung der gewählten Challenge
    const c = Chal.BY_ID[chSel], open = c && Chal.isOpen(m, c.id), dy = g.py + g.ph - detailH - bot;
    UI.box(back, gx, dy, gw, detailH, { colour: P.PANEL_DARK, radius: 12, shadow: false, outline: c && open ? c.colour : P.GREY, outlineWidth: 2 });
    if (!c) return;
    UI.text(ctx, open ? c.name : 'Locked challenge', gx + 18, dy + 24 * k, { size: 24 * k, colour: open ? lighten(c.colour, 0.45) : P.TEXT_LABEL, align: 'left' });
    const desc = open ? c.desc : Chal.openText(m, c.id);
    wrapPlain(ctx, desc, gw - 300 * k, 17 * k).slice(0, 3).forEach((ln, i) => UI.text(ctx, ln, gx + 18, dy + 56 * k + i * 22 * k, { size: 17 * k, colour: P.TEXT_SOFT, align: 'left' }));
    const rw = Chal.winReward(c.id), rec = m.chal[c.id];
    UI.text(ctx, rec && rec.wins ? 'Best: won' : rec ? 'Best: Stage ' + rec.best : 'Not played yet', gx + gw - 18, dy + 24 * k, { size: 16 * k, colour: P.TEXT_LABEL, align: 'right' });
    UI.text(ctx, rec && rec.wins ? 'Reward collected' : 'First win:', gx + gw - 18, dy + 52 * k, { size: 15 * k, colour: P.TEXT_DIM, align: 'right' });
    rw.forEach(([kind, id], i) => {
      const s = 40 * k, rx = gx + gw - 18 - (rw.length - i) * (s + 8), ry = dy + 70 * k;
      drawReward(ctx, kind, id, rx, ry, s, !!(rec && rec.wins));
      chHits.push({ r: { x: rx, y: ry, w: s, h: s }, info: { title: rewardName(kind, id), desc: 'Reward for your first win of ' + c.name + '.', badge: ['Reward', P.GOLD] } });
    });
    UI.text(ctx, wins + ' of ' + Chal.LIST.length + ' challenges won', gx + 18, dy + detailH - 18 * k, { size: 14 * k, colour: P.TEXT_DIM, align: 'left' });
  }
  function drawBuildWall(back, ctx, t, g, m) {
    const k = g.k, tags = R.TAG_ORDER, cols = 4, rows = Math.ceil(tags.length / cols), gap = 10 * k;
    const pad = MOBILE ? 18 : 28, top = MOBILE ? 16 : 26, footY = MOBILE ? 0 : 14;   // PC: Abstand zum Rahmen und zu den Nieten
    const gx = g.px + pad, gw = g.pw - 2 * pad, cw = (gw - gap * (cols - 1)) / cols, foot = (MOBILE ? 64 : 72) * k, chh = (g.ph - foot - top - (MOBILE ? 14 : 10) - gap * (rows - 1)) / rows;
    tags.forEach((tag, i) => {
      const tg = R.TAGS[tag], col = i % cols, row = Math.floor(i / cols), x = gx + col * (cw + gap), y = g.py + top + row * (chh + gap), st = m.mastery[tag] || 0;
      UI.box(back, x, y, cw, chh, { colour: darken(tg.colour, 0.55), radius: 10, shadow: false, outline: st === 3 ? P.GOLD : tg.colour, outlineWidth: st === 3 ? 3 : 2 });
      Icons.tag(ctx, tag, x + 30 * k, y + chh / 2, 40 * k);
      UI.text(ctx, tg.name, x + 58 * k, y + chh * 0.32, { size: 20 * k, colour: lighten(tg.colour, 0.45), align: 'left' });
      [0, 1, 2].forEach((s) => {
        const sx = x + 66 * k + s * 30 * k, sy = y + chh * 0.68;
        drawStar(ctx, sx, sy, 11 * k, st > s);
        const rw = Chal.starReward(tag, s + 1);
        chHits.push({ r: { x: sx - 14 * k, y: sy - 14 * k, w: 28 * k, h: 28 * k }, info: { title: (s + 1) + (s ? ' stars' : ' star') + ': ' + rewardName(rw[0], rw[1]), desc: Chal.STAR_TEXT[s] + ' (' + tg.name + ').', badge: ['Reward', P.GOLD] } });
      });
      const hover = !MOBILE && UI.inside({ x, y, w: cw, h: chh }, eng.mouse);
      if (hover) {
        const s = Math.min(3, st + 1), rw = Chal.starReward(tag, s);
        const line = st >= 3 ? 'Mastered!' : 'Next: ' + Chal.STAR_TEXT[st];
        UI.text(ctx, line, g.cx, g.py + g.ph - foot / 2 - 4 - footY, { size: fitText(ctx, line, gw - 40, 17 * k), colour: P.GOLD });
        UI.text(ctx, st >= 3 ? 'All rewards collected' : 'Reward: ' + rewardName(rw[0], rw[1]), g.cx, g.py + g.ph - foot / 2 + 18 * k - footY, { size: 15 * k, colour: P.TEXT_SOFT });
      }
    });
    if (MOBILE || !tags.some((tag, i) => UI.inside({ x: gx + (i % cols) * (cw + gap), y: g.py + top + Math.floor(i / cols) * (chh + gap), w: cw, h: chh }, eng.mouse))) {
      UI.text(ctx, '1 star: Stage 4 with a 3-relic set  ·  2 stars: win with it  ·  3 stars: win with a 5-relic set', g.cx, g.py + g.ph - foot / 2 - 4 - footY,
        { size: fitText(ctx, '1 star: Stage 4 with a 3-relic set  ·  2 stars: win with it  ·  3 stars: win with a 5-relic set', gw - 40, 17 * k), colour: P.TEXT_SOFT });
      UI.text(ctx, Chal.totalStars(m) + ' of ' + tags.length * 3 + ' stars  ·  Rewards: a build colour, 2 cups, a dice aura', g.cx, g.py + g.ph - foot / 2 + 18 * k - footY, { size: 15 * k, colour: P.TEXT_DIM });
    }
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
    const c = cupAt(cupSel), x = 310, y = 428, w = 660, h = 166;
    UI.box(back, x, y, w, h, { colour: P.OVERLAY_SOLID, radius: 14, emboss: 4, outline: c ? c.colour : P.GREY, outlineWidth: 2 });
    UI.text(front, c ? c.name : 'Coming soon', 640, y + 26, { size: 30, colour: c ? lighten(c.colour, 0.35) : P.TEXT_LABEL });
    const desc = c ? c.desc : '';
    UI.box(back, x + 26, y + 44, w - 52, 62, { colour: '#FFFFFF', radius: 8, shadow: false });
    wrapText(front, desc, w - 84, 19).slice(0, 3).forEach((ln, i, arr) => drawLine(front, ln, 640, y + 75 + (i - (arr.length - 1) / 2) * 21, 19, false));
    if (c) {
      const chips = [['Dice', c.bag.length, P.CHIPS], ['Hands', c.hands, P.BLUE], ['Rerolls', c.rerolls, P.ORANGE], ['Money', '$' + c.money, P.GOLD_TEXT],
        ['Relics', c.relics.length + (c.randomRelics ? c.randomRelics.n : 0) + (c.jonny ? 1 : 0), '#E07A2E']];
      chips.forEach(([a, b, col], i) => {
        const cx = 640 + (i - 2) * 118;
        UI.box(front, cx - 54, y + 114, 108, 34, { colour: P.PANEL_DARK, radius: 8, shadow: false, outline: col, outlineWidth: 2 });
        UI.text(front, a + ' ' + b, cx, y + 131, { size: fitText(front, a + ' ' + b, 96, 18) });
      });
    }
    for (const b of [B.cupPrev, B.cupNext, B.begin, B.back]) UI.button(front, b, t);
    if (Chal && profile) UI.button(front, B.challenges, t);
  }

  // Tasten-Übersicht (Reiter Controls)
  const CONTROLS = [
    ['Enter', 'Play hand  ·  start  ·  continue'], ['R', 'Reroll the dice you are not holding'], ['1 - 6', 'Hold or release a die'],
    ['Mouse', 'Click dice to hold, drag relics to reorder'], ['Hover', 'Keep still to pin a tooltip and read more'],
    ['Space', 'Next line while Jonny talks'], ['N', 'Skip the current song'], ['O', 'Open or close the settings'], ['Esc', 'Pause menu  ·  close  ·  go back'],
    ['Tab', 'Move between buttons, Enter presses'], ['[  ]', 'Select a relic or consumable'], ['S', 'Shift mode (Settings > Access)'],
  ];
  function drawSettings(ctx, t) {
    if (!settingsOpen) return;
    if (studioOpen) return drawStudio(ctx, t);
    if (MOBILE) { drawSettingsMobile(ctx, t); if (setAsk) drawAsk(ctx, t); return; }
    dim(ctx, 0.5);
    if (setPane === 'pause') return drawPause(ctx, t);
    if (setPane === 'stats') return drawStatsBig(ctx, t);
    UI.box(ctx, 24, 10, 1232, 700, { colour: P.OVERLAY_SOLID, radius: 18, outline: P.GOLD, outlineWidth: 3 });
    UI.dynaText(ctx, 'Settings', 640, 38, { size: 36, colour: P.GOLD, time: t, wave: 2 });
    for (const b of visTabBtns()) UI.button(ctx, b, t);
    const tab = SET_TABS[setTab], info = infoRow();
    if (tab.id === 'controls') {
      CONTROLS.forEach(([key, what], i) => {
        const y = 146 + i * 38;
        UI.box(ctx, SET_ROW.x, y - 15, 110, 30, { colour: P.PANEL, radius: 7, emboss: 3 });
        UI.text(ctx, key, SET_ROW.x + 55, y, { size: 18 });
        UI.text(ctx, what, SET_ROW.x + 128, y, { size: fitText(ctx, what, SET_ROW.w - 134, 18), colour: P.TEXT_SOFT, align: 'left' });
      });
    }
    tab.rows.forEach((r, k) => {
      const y = SET_Y(k), safe = SETTINGS.photosafe && SAFE_KEYS.includes(r.key);
      UI.box(ctx, SET_ROW.x, y - SET_ROW.h / 2, SET_ROW.w, SET_ROW.h, { colour: P.PANEL, radius: 10, emboss: 2, outline: k === info ? P.GOLD : undefined, outlineWidth: 2 });
      UI.text(ctx, r.label, SET_ROW.x + 18, y, { size: fitText(ctx, r.label, 300, 21), colour: k === info ? P.WHITE : P.TEXT_LABEL, align: 'left' });
      if (r.action) return;
      if (!r.slider) { const nm = settingName(r.key); UI.text(ctx, nm, 498, y, { size: fitText(ctx, nm, 136, 20), colour: safe ? P.TEXT_DIM : P.WHITE }); return; }
      // Regler: Bahn, gefüllter Teil, Griff, Prozentwert
      const v = SETTINGS[r.key] || 0, kx = SLIDER.x + (v / 100) * SLIDER.w, hot = sliderDrag === k || UI.inside(sliderRect(k), eng.mouse);
      UI.box(ctx, SLIDER.x, y - 5, SLIDER.w, 10, { colour: P.PANEL_DARK, radius: 5, shadow: false });
      if (v > 0) UI.box(ctx, SLIDER.x, y - 5, Math.max(10, kx - SLIDER.x), 10, { colour: P.BLUE, radius: 5, shadow: false });
      UI.box(ctx, kx - 11, y - 15, 22, 30, { colour: hot ? P.GOLD : P.WHITE, radius: 7, emboss: 3 });
      UI.text(ctx, v ? v + '%' : 'Off', 590, y, { size: 20, colour: v ? P.WHITE : P.TEXT_DIM });
    });
    for (const b of setBtnsNow()) UI.button(ctx, b, t);
    drawSetInfo(ctx, tab, info);
    UI.button(ctx, B.close, t);
    UI.button(ctx, B.apply, t);
    const lock = lockHint(), dirty = setDirty();
    const hint = lock || (dirty ? 'Changes are a preview until you press Apply' : '[O] Settings   [Esc] Close   [N] Skip song   [H] advanced FX sliders');
    UI.text(ctx, hint, 640, 680, { size: 15, colour: !lock && dirty ? P.GOLD : P.TEXT_DIM });
    if (setAsk) drawAsk(ctx, t);
  }
  // Welche Zeile rechts erklärt wird: Tastatur-Fokus, sonst die Zeile unter der Maus, sonst die zuletzt gezeigte
  function infoRow() {
    const rows = setRows();
    if (!rows.length) return -1;
    if (focusBtn && focusBtn.setRow !== undefined && focusBtn.inTab === setTab) setInfo = focusBtn.setRow;
    else if (!setAsk) {
      const m = eng.mouse, k = rows.findIndex((r, i) => m.x >= SET_ROW.x && m.x <= SET_ROW.x + SET_ROW.w && Math.abs(m.y - SET_Y(i)) <= SET_ROW.h / 2 + 4);
      if (k >= 0) setInfo = k;
    }
    return Math.min(setInfo, rows.length - 1);
  }
  // Rechte Hälfte: feste Erklärung, darunter optionale Beispielbilder mit je einer Zeile darüber (alles ohne Scrollen)
  const HELP = window.WG_SETTINGS_HELP || {};
  // Bilder nur als data: URIs (ui/settings-shots-data.js, beim ersten Bedarf nachgeladen): Bilder per URL würden unter
  // file:// das Canvas verunreinigen und das Spiel einfrieren
  const helpImgs = {};
  let shotsLoading = false;
  function helpImg(name) {
    const data = window.WG_SETTINGS_SHOTS;
    if (!data) {
      if (!shotsLoading) {
        shotsLoading = true;
        const el = document.createElement('script');
        el.src = 'ui/settings-shots-data.js'; el.onerror = () => { window.WG_SETTINGS_SHOTS = {}; };
        document.head.appendChild(el);
      }
      return { pending: true };
    }
    let im = helpImgs[name];
    if (!im) { im = helpImgs[name] = new Image(); if (data[name]) { im.onerror = () => { im.failed = true; }; im.src = data[name]; } else im.failed = true; }
    return im;
  }
  function drawSetInfo(ctx, tab, k) {
    const I = SET_INFO, row = k >= 0 ? tab.rows[k] : null, h = HELP[row ? row.key : 'tab:' + tab.id];
    UI.box(ctx, I.x, I.y, I.w, I.h, { colour: P.PANEL_DARK, radius: 12, shadow: false });
    const title = row ? row.label : tab.label;
    UI.text(ctx, title, I.x + 24, I.y + 30, { size: fitText(ctx, title, I.w - 48, 28), colour: P.GOLD, align: 'left' });
    if (!h) return;
    let yy = I.y + 68;
    readable(() => wrapPlain(ctx, h.text, I.w - 48, 18).forEach((ln) => { UI.text(ctx, ln, I.x + 24, yy, { size: 18, colour: P.TEXT_SOFT, align: 'left' }); yy += 24; }));
    if (row && SETTINGS.photosafe && SAFE_KEYS.includes(row.key)) {
      yy += 6; UI.text(ctx, 'Locked while Photosensitive safe is on (Access, page 2)', I.x + 24, yy, { size: 16, colour: P.GOLD, align: 'left' }); yy += 24;
    }
    const shots = (h.shots || []).filter((s) => !helpImg(s.name).failed);
    if (!shots.length) return;
    yy += 8;
    const n = shots.length, gap = 16, inner = I.w - 48, bottom = I.y + I.h - 18, capH = 46;
    let w = (inner - gap * (n - 1)) / n, ih = (w * 9) / 16;
    if (yy + capH + ih > bottom) { ih = Math.max(60, bottom - yy - capH); w = Math.min(w, (ih * 16) / 9); }
    const x0 = I.x + 24 + (inner - (n * w + gap * (n - 1))) / 2;
    shots.forEach((sh, i) => {
      const x = x0 + i * (w + gap), im = helpImg(sh.name), iy = yy + capH;
      const cl = wrapPlain(ctx, sh.caption, w, 16).slice(0, 2);
      cl.forEach((ln, j) => UI.text(ctx, ln, x + w / 2, yy + 12 + j * 19 + (cl.length === 1 ? 10 : 0), { size: 16, colour: P.TEXT_LABEL }));
      UI.box(ctx, x - 3, iy - 3, w + 6, ih + 6, { colour: '#0B0F0D', radius: 4, shadow: false });
      if (im.complete && im.naturalWidth) { ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(im, x, iy, w, ih); ctx.restore(); }
      else UI.text(ctx, 'Loading...', x + w / 2, iy + ih / 2, { size: 15, colour: P.TEXT_DIM });
    });
  }
  // Warnung: Fenster schließen mit ungespeicherten Änderungen
  function drawAsk(ctx, t) {
    dim(ctx, 0.45);
    const v = MOBILE ? viewBox() : { l: 0, r: 1280 }, vc = (v.l + v.r) / 2, w = MOBILE ? 960 : 720, h = MOBILE ? 360 : 240, y = MOBILE ? 170 : 236;
    UI.box(ctx, vc - w / 2, y, w, h, { colour: P.OVERLAY_SOLID, radius: 16, outline: P.GOLD, outlineWidth: 3, emboss: 4 });
    UI.dynaText(ctx, 'Unsaved changes', vc, y + (MOBILE ? 54 : 40), { size: MOBILE ? 46 : 34, colour: P.GOLD, time: t, wave: 1.5 });
    const msg = 'You changed settings but did not press Apply. Keep them?';
    UI.text(ctx, msg, vc, y + (MOBILE ? 130 : 96), { size: fitText(ctx, msg, w - 60, MOBILE ? 28 : 20), colour: P.TEXT_SOFT });
    for (const b of [B.askApply, B.askDiscard, B.askStay]) UI.button(ctx, b, t);
  }
  // Pause am PC: links die Statistik des Runs, rechts die Telefon-Vorteile, in der Mitte das Menü
  function drawPause(ctx, t) {
    drawRunPanel(ctx, t);
    readable(() => drawPhonePanel(ctx, t));
    UI.box(ctx, 340, 84, 600, 576, { colour: P.OVERLAY_SOLID, radius: 18, outline: P.GOLD, outlineWidth: 3 });
    UI.dynaText(ctx, TUT.active ? 'Tutorial paused' : 'Paused', 640, 124, { size: 44, colour: P.GOLD, time: t, wave: 2 });
    if (!TUT.active && S.stats) {
      const sb = stageBox(), sub = cup().name + '  ·  ' + sb[0] + ' ' + sb[1], where = runWhere();
      UI.text(ctx, sub, 640, 166, { size: fitText(ctx, sub, 540, 20), colour: lighten(cup().colour, 0.35) });
      UI.text(ctx, where, 640, 194, { size: fitText(ctx, where, 540, 16), colour: P.TEXT_SOFT });
    }
    for (const b of settingsButtons()) UI.button(ctx, b, t);
    const hint = B.quit.disabled ? UI.tx('Saving is possible once the dice have settled') : '[Esc] Back to the game   [O] Settings';
    UI.text(ctx, hint, 640, 620, { size: 15, colour: P.TEXT_DIM });
  }
  // Große Statistik (Pause > Stats): drei Spalten über die ganze Breite
  function drawStatsBig(ctx, t) {
    const d = runPanelData(), sb = stageBox();
    UI.box(ctx, 24, 10, 1232, 700, { colour: P.OVERLAY_SOLID, radius: 18, outline: P.GOLD, outlineWidth: 3 });
    UI.dynaText(ctx, 'This Run', 640, 46, { size: 42, colour: P.GOLD, time: t, wave: 2 });
    const head = cup().name + '  ·  ' + sb[0] + ' ' + sb[1] + '  ·  ' + runWhere();
    UI.text(ctx, head, 640, 90, { size: fitText(ctx, head, 1100, 22), colour: lighten(cup().colour, 0.35) });
    const col = (x, w, title) => { UI.box(ctx, x, 118, w, 470, { colour: P.PANEL_DARK, radius: 12, shadow: false }); UI.text(ctx, title, x + w / 2, 146, { size: 25, colour: P.GOLD }); };
    [['Stats', d.stats], ['Rules right now', d.rules]].forEach(([title, rows], i) => {
      const x = 52 + i * 400, w = 380, lh = Math.min(33, 396 / rows.length);
      col(x, w, title);
      rows.forEach(([a, b], j) => {
        const y = 188 + j * lh;
        if (j % 2 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.045)'; ctx.fillRect(x + 12, y - lh / 2, w - 24, lh); }
        UI.text(ctx, a, x + 24, y, { size: 20, colour: P.TEXT_LABEL, align: 'left' });
        UI.text(ctx, String(b), x + w - 24, y, { size: 20, align: 'right' });
      });
    });
    const x = 852, w = 376, ids = (S.relics || []).map((q) => q.id).filter((id) => R.RELIC_BY_ID[id]);
    col(x, w, 'Relics  ' + ids.length + ' / ' + relicMax());
    if (!ids.length) UI.text(ctx, UI.tx('No relics yet'), x + w / 2, 200, { size: 19, colour: P.TEXT_DIM });
    const lh = Math.min(54, 384 / Math.max(1, ids.length)), s = Math.min(42, lh - 8);
    ids.forEach((id, j) => {
      const y = 196 + j * lh, rd = R.RELIC_BY_ID[id];
      UI.box(ctx, x + 20, y - s / 2, s, s, { colour: darken(rd.colour, 0.1), radius: 6, shadow: false, outline: R.RARITY[rd.rarity].colour, outlineWidth: 2 });
      Icons.draw(ctx, id, x + 20 + s / 2, y, s * 0.8);
      UI.text(ctx, rd.name, x + 34 + s, y, { size: fitText(ctx, rd.name, w - s - 56, 20), align: 'left' });
    });
    UI.button(ctx, B.pBack, t);
    UI.text(ctx, '[Esc] Back', 640, 678, { size: 14, colour: P.TEXT_DIM });
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
    const sub = songInfo.album || 'Aleator soundtrack';
    UI.text(ctx, sub, x + 58, y + 58, { size: fitText(ctx, sub, w - 72, 13), colour: P.TEXT_SOFT, align: 'left' });
  }

  // ── Jonny im Spiel: Sprüche, Aufträge, Shop, Jonny's Cup, Endboss, Run-Ende ──
  // Jonny redet außerhalb des Tutorials an drei Plätzen: 'corner' (unten links, kurz eingeblendet), 'shop' (hinter der
  // Theke, der letzte Satz bleibt stehen) und 'end' (Kommentar zum Run-Ende). Einstellung "Jonny chatter": Normal / Less / Off.
  const JONNY_GOLD = '#E7B23C';
  const JS = { q: [], cur: null, last: -99, rect: null, shopT: 0, nudged: false, shopSaid: 0, shopBuys: 0 };
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
    if (S.phase === 'shop' && !S.choice && !settingsOpen && !JS.nudged && eng.time - JS.shopT > 40) {
      JS.nudged = true;
      jonnySay([pickLine('nudge', SHOP_TALK.nudge)], { chance: 0.6 });
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
      TUT.face(ctx, f.x, f.y, f.s, eng.time - JS.shopT > 40 ? 'bored' : 'neutral', t, false);
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
    { id: 'hand', make: () => { const [h, d] = R.pick(JOB_HANDS, rng('job')); return { text: 'Play a ' + h, hand: h, goal: 1, d }; }, hand: (j, e) => !e.bust && e.name === j.hand },
    { id: 'twice', need: (n) => n >= 3, make: () => { const [h, d] = R.pick([['Pair', 0], ['Two Pair', 1], ['Three of a Kind', 2]], rng('job')); return { text: 'Play ' + (h === 'Pair' ? 'a Pair' : h) + ' twice', hand: h, goal: 2, d }; },
      hand: (j, e) => !e.bust && e.name === j.hand },
    { id: 'big', make: () => { const x = Math.max(10, Math.round((S.target * 0.4) / 10) * 10); return { text: 'Score ' + UI.num(x) + ' with one hand', x, goal: 1, d: 1 }; },
      hand: (j, e) => e.total >= j.x },
    { id: 'calm', make: () => ({ text: 'Play a hand without rerolling', goal: 1, d: 0 }), hand: (j, e) => e.rerolls === 0 && !e.bust },
    { id: 'hold3', make: () => ({ text: 'Play a hand while holding 3 or more dice', goal: 1, d: 0 }), hand: (j, e) => e.held >= 3 },
    { id: 'pair', make: () => { const v = 4 + Math.floor(rng('job')() * 3); return { text: 'Score two ' + v + 's in one hand', v, goal: 1, d: 1 }; },
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
    if (TUT.active || (isBossBlind() && isFinal())) return null;
    const n = handsMax(), lk = luck(), sk = skullFacesInBag(), last = S.jonny.lastJob;
    const pool = JOBS.filter((d) => d.id !== last && (!d.need || d.need(n, lk, sk)));
    const def = R.pick(pool, rng('job')), j = def.make();
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
    if (TUT.active || !S.shop || (!force && rng('shop')() >= (cup().jonny ? 0.6 : 0.3))) return null;
    const k = R.pick([0, 1, 2], rng('shop'));
    const taken = new Set(S.relics.map((r) => r.id).concat(S.shop.filter((x, j) => x && j !== k && x.type === 'relic').map((x) => x.id)));
    const pool = R.RELICS.filter((d) => !d.hidden && !taken.has(d.id) && d.id !== 'crossroads' && open('relic', d.id));
    if (!pool.length) return null;
    const w = { C: 0.3, U: 1, R: 1.2, L: 0.4 };
    const id = R.pickWeighted(pool.map((d) => [d.id, w[d.rarity]]), rng('shop'));
    const cost = R.RELIC_BY_ID[id].cost;
    S.shop[k] = { type: 'relic', id, price: Math.max(2, Math.ceil(cost / 2)), was: cost, special: R.pick(CATCHES, rng('shop')) };
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
  // Jonny im Shop: nach der Begrüßung höchstens SHOP_CHAT Sprüche pro Besuch, mit Abstand dazwischen
  const SHOP_CHAT = 2;
  function shopChat(line, chance, o = {}) {
    if (!line) return false;
    if (!o.important && JS.shopSaid >= SHOP_CHAT) return false;
    const said = jonnySay([line], Object.assign({ replace: true, chance, gap: o.important ? 0 : 7 }, o));
    if (said && !o.important) JS.shopSaid++;
    return said;
  }
  function shopHello() {
    JS.shopT = eng.time; JS.nudged = false; JS.shopSaid = 0; JS.shopBuys = 0;
    const T = SHOP_TALK, H = T.hello || {}, last = S.jonny.last, lines = [];
    const tier = S.ante > ANTES ? 'endless' : S.ante >= 7 ? 'late' : S.ante >= 4 ? 'mid' : 'early';
    const v = { stage: S.ante, money: S.money };
    let hello = null;
    if (last && last.boss && last.boss !== 'Jonny') hello = fillLine(pickLine('afterBoss', T.afterBoss), { boss: last.boss });
    else if (last && last.score <= last.target * 1.05) hello = fillLine(pickLine('close', T.close), { n: UI.num(Math.max(0, last.score - last.target)) });
    else if (last && last.score >= last.target * 2.5) hello = fillLine(pickLine('huge', T.huge), { x: fmtX(Math.floor((last.score / last.target) * 10) / 10) });
    else if (S.jonny.visit === 1) hello = pickLine('first', H.first);
    else if (S.money >= 40) hello = fillLine(pickLine('rich', H.rich), v);
    else if (S.money <= 1) hello = fillLine(pickLine('broke', H.broke), v);
    else if (Math.random() < 0.6) hello = fillLine(pickLine('hello:' + tier, H[tier]), v);
    if (hello) lines.push(hello);
    const intro = profile && !meta().jonnyJobs;
    if (intro && S.job) { meta().jonnyJobs = 1; lines.push(T.jobIntro[0]); }
    else if (S.shop && S.shop.some((x) => x && x.special)) lines.push(pickLine('special', T.special));
    else if (!S.job && S.boss === JONNY_BOSS) lines.push(pickLine('lastStage', T.lastStage));
    else if (S.job && Math.random() < 0.2) lines.push(pickLine('job', T.job));
    if (lines.length) jonnySay(lines.filter(Boolean), { replace: true, important: intro });
  }
  function shopBought(it) {
    JS.shopT = eng.time; JS.shopBuys = (JS.shopBuys || 0) + 1;
    const T = SHOP_TALK;
    if (it.type === 'relic') {
      const d = R.RELIC_BY_ID[it.id], tag = d.tags[0];
      if (tag) S.jonny.tags[tag] = (S.jonny.tags[tag] || 0) + 1;
      if (T.mine[it.id]) return shopChat(T.mine[it.id], 1, { important: true });
      if (d.rarity === 'L') return shopChat(pickLine('legendary', T.legendary), 1, { important: true });
      if (tag && S.jonny.tags[tag] >= 3 && Math.random() < 0.5) return shopChat(fillLine(pickLine('sameTag', T.sameTag), { tag: R.TAGS[tag].name }), 0.6);
      if (d.rarity === 'R') return shopChat(pickLine('rare', T.rare), 0.5);
      return shopChat(pickLine('tag:' + (tag || 'none'), T.tags[tag || 'none']), 0.3);
    }
    if (it.type === 'die') return it.dieType === 'cursed' ? shopChat(pickLine('cursedDie', T.cursedDie), 0.7) : shopChat(pickLine('die', T.die), 0.25);
    return shopChat(pickLine(it.type, T[it.type] || T.die), it.type === 'upgrade' ? 0.5 : 0.3);
  }
  function shopSold(item) {
    JS.shopT = eng.time;
    if (item.specialVisit && item.specialVisit === S.jonny.visit) secret('buyers_remorse');
    shopChat(pickLine('sell', SHOP_TALK.sell), 0.35);
  }
  function shopRerolled() {
    JS.shopT = eng.time;
    S.jonny.rerolls++;
    const n = S.jonny.rerolls, tier = n >= 4 ? 2 : n >= 2 ? 1 : 0;
    shopChat(fillLine(pickLine('reroll' + tier, SHOP_TALK.reroll[tier]), { n }), [0.25, 0.4, 0.6][tier]);
  }
  function shopBroke() { shopChat(pickLine('broke', SHOP_TALK.broke), 0.45, { gap: 10 }); }
  // Beim Verlassen sagt Jonny selten noch etwas (unten links, schon am Tisch)
  function shopBye() {
    if (TUT.active || !SHOP_TALK.leave) return;
    const T = SHOP_TALK.leave, buys = JS.shopBuys || 0;
    jonnySay([pickLine('leave', !S.bought ? T.nothing : buys >= 3 ? T.spree : T.normal)], { chance: 0.22, gap: 6, place: 'corner' });
  }

  // ── Jonny's Cup: er spielt mit, kommentiert und würfelt einmal pro Runde gratis für dich ──
  const helpShown = () => cup().jonny && !TUT.active && ['rolling', 'select', 'scoring'].includes(S.phase);
  // Beste Würfel zum Halten: probiert alle Kombinationen und würfelt den Rest ein paar Dutzend Mal aus
  // (alle Varianten benutzen dieselben Probewürfe, damit Zufall nicht eine schlechte Wahl begünstigt)
  function bestHold(samples = 48) {
    const n = dice.length, faces = dice.map(upFace);
    const opts = handOpts(faces);
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
    if (fatherFight()) { jonnySay(say1(FATHER_TALK.lastHand), { chance: 0.8, gap: 2 }); return; }
    if (S.boss === JONNY_BOSS && isBossBlind()) jonnySay(say1(BOSS_TALK.lastHand), { chance: 0.8, gap: 2 });
    else if (cup().jonny) jonnySay(say1(CUP_TALK.last), { chance: 0.6, gap: 3 });
  }
  // Nach jeder gewerteten Hand (Jonny's Cup und Jonnys Showdown)
  function jonnyHand(res, total) {
    if (fatherFight()) { if (res.bust) jonnySay(say1(FATHER_TALK.bust), { important: true, replace: true, key: 'hand' }); return; }
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
    const pool = R.BOSSES.filter((b) => !b.noJonny && b.id !== S.jonnyRule);
    const b = R.pick(pool, rng('boss'));
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

  // ── Endboss Jonnys Vater (Endless, Stage FATHER_STAGE) ──
  // Er selbst spricht nur in den großen Einblendungen; Jonny kommentiert daneben.
  function fatherIntro() {
    const heard = Tapes && Tapes.all(meta()) ? [['paranoid', 'You listened to {g|his tapes}? All eight? {q|He never sent ME any.}']] : [];
    jonnySay(FATHER_TALK.intro.concat(heard), { important: true, replace: true, always: true });
  }
  // Phase 1 geschafft: Überschuss verfällt, neues Ziel, neue Regel in Elite-Stärke, verankerte Würfel zurück in den Beutel
  function fatherPhase2() {
    S.bossPhase = 2;
    S.score = S.target; S.dispScore = S.score;
    S.target = S.bossFull || S.target * 2;
    S.jonnyRule = R.pick(R.finalRules(S.jonnyRule), rng('boss')).id;
    S.anchored = [];
    const b = curBoss();
    eng.setBackgroundColour(FATHER_BOSS.colour, { contrast: 2.6 });
    showMsg('He gets serious', lighten(FATHER_BOSS.colour, 0.3), 'Phase 2  ·  ' + b.name + ' - ' + b.desc, 3.4);
    sfx('boss');
    eng.shake(18);
    eng.emit(L.msg.x, L.msg.y, { count: 110, colours: [FATHER_BOSS.colour, P.GOLD, '#FFFFFF'], speed: 640, size: 11, life: 1.3, shape: 'star' });
    jonnySay(FATHER_TALK.phase2, { important: true, replace: true, place: 'corner' });
  }
  const FATHER_TALK = {
    intro: [['shocked', 'Wait. That voice. {s|That is the guy from the phone.}'], ['nervous', '...Hi, {g|Dad}. {q|He taught me everything. Including the cheating.}']],
    phase2: [['paranoid', "Oh no. He's {b|taking his jacket off.}"], ['nervous', '{q|He only does that when he means it.}']],
    lastHand: [['nervous', "Last hand. Don't look him in the eye. {q|I never do.}"]],
    bust: [['shocked', 'Skulls? In front of {g|him}? {q|We are never hearing the end of this.}']],
    defeat: [['shocked', 'You beat {g|my dad}. {w|Nobody} beats my dad.'], ['happy', "{q|He's smiling. He never smiles.} I'm telling Mom."]],
  };
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
    if (closeLoss() && Math.floor(S.score / S.target * 1000) === 991) return [['shocked', "Ninety-nine point {g|one}. {q|That's... pure.}"], ['happy', "Hey. That was really, really good. {q|I mean it. Don't tell anyone I said that.}"]];
    if (closeLoss()) return [['nervous', 'Less than {g|one percent}. Oof.'], ['happy', "Hey. That was really, really good. {q|I mean it. Don't tell anyone I said that.}"]];
    if (S.endless && fatherFight()) {
      lines.push(['nervous', 'You made it all the way to {g|my dad}. {q|Stage ' + S.ante + '. Nobody gets that far.}']);
      lines.push(['smug', "He says you can call him. {q|He won't pick up. He only calls.}"]);
      return lines;
    }
    if (S.endless) {
      lines.push(['excited', 'Endless stage {g|' + S.ante + '}! That is ' + (S.ante - ANTES) + ' stages past the end. {q|I counted twice.}']);
      lines.push(S.ante >= 12 ? ['shocked', 'Honestly? {w|Legendary.} Now go drink some water.'] : ['smug', 'Endless ends when you lose. {q|Which you just did.}']);
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
    clamp: ['smug', '{g|The Clamp}. Two rerolls less and you {d|fell apart}.'],
    frost: ['smug', 'Frozen by {g|The Frost}. {q|Chilling.} Sorry. I had to.'],
    chaos: ['excited', "{g|The Chaos} won. Chaos always wins. {q|That's my motto.}"],
    echo: ['smug', '{g|The Echo}. Same hand, half the Power. {q|Same... same... same...}'],
    wall: ['annoyed', "{g|The Wall}. It's a wall. It doesn't even {s|move}."],
    fog: ['smug', 'Lost in {g|The Fog}. {q|I could see your dice. Just saying.}'],
    taxman: ['annoyed', '{g|The Taxman} got you. {q|Death and taxes. Mostly taxes.}'],
    judge: ['smug', '{g|The Judge} has spoken. {q|Guilty of bad rolls.}'],
    ghost: ['nervous', '{g|The Ghost}. Your dice were {s|right there}. And also not.'],
    gambler: ['excited', '{g|The Gambler} wins! Tails, tails, tails. {q|I love that coin.}'],
    undertow: ['disappointed', '{g|The Undertow} pulled you under. {q|Swim faster next time.}'],
    hourglass: ['smug', '{g|The Hourglass}. Time ran out. {q|It always does.}'],
    thief: ['annoyed', '{g|The Thief} took your relics {s|and} the round. {q|Rude.}'],
  };
  const END_FILLER = [
    ['neutral', "Try again. Hold better dice. {q|That's the whole secret.}"],
    ['fourth', 'You know you can just press {g|Try Again}, right? {q|*ahem*}'],
    ['smug', 'Next time, buy more relics. {q|From me. Preferably.}'],
  ];

  // ── Sprüche ──
  // Shop-Sprüche: jonny-lines.js (window.WG_JONNY.SHOP)
  const SHOP_TALK = (window.WG_JONNY && window.WG_JONNY.SHOP) || {};
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
    snake: [['smug', '{g|The Snake}: it eats your lowest scored die. {q|Keep your numbers high.}']],
    clamp: [['excited', '{g|The Clamp}! Two rerolls less per hand. Choose {w|wisely}.']],
    frost: [['smug', '{g|The Frost}. Your 6s are frozen. {q|Brrr.}']],
    chaos: [['paranoid', '{g|The Chaos}. Even held dice might roll. {s|Trust no one.}']],
    echo: [['smug', '{g|The Echo}. Repeat a hand and it gets {g|half} Power. {q|Half. Half. Half.}']],
    fog: [['smug', '{g|The Fog}. No preview this hand. {q|Read your own dice.}']],
    taxman: [['smug', '{g|The Taxman}. Rerolls cost money now. {q|I take cash.}']],
    judge: [['excited', '{g|The Judge}! Play the hand he calls and get {w|double} Power.']],
    ghost: [['paranoid', '{g|The Ghost}. One of your dice is {s|not really there}.']],
    gambler: [['excited', '{g|The Gambler}. A coin decides your Power. {q|Heads I win, tails you lose.}']],
    thief: [['smug', '{g|The Thief}. One of your relics takes a {d|nap} this hand.']],
  };

  // ── Easter Eggs und Secrets ─────────────────────────────────────────────
  // Jonnys Kopf schwebt selten durch den Hintergrund (alle 15 s eine Chance von 1 zu 40, also etwa alle 10 Minuten).
  // Gesehen = Secret, angeklickt = noch eins.
  const FLOAT = { every: 15, chance: 1 / 40, dur: 18, size: 64, wave: 44, freq: 1.5 };
  let floatHead = null, floatClock = performance.now() / 1000;
  function spawnHead() {
    floatHead = { t0: nowSec(), dir: Math.random() < 0.5 ? 1 : -1, y0: 150 + Math.random() * 380, spin: (Math.random() - 0.5) * 0.5,
      mood: R.pick(['happy', 'smug', 'nervous', 'excited', 'paranoid']), seen: false, caught: 0 };
  }
  function headPos(h) {
    const age = nowSec() - h.t0, k = age / FLOAT.dur, s = FLOAT.size;
    const x0 = h.dir > 0 ? -s : 1280 + s, x1 = h.dir > 0 ? 1280 + s : -s;
    // Schwimmt in Wellen: auf und ab, und neigt sich in die Richtung, in die er gerade schwimmt
    let x = x0 + (x1 - x0) * k, y = h.y0 + Math.sin(age * FLOAT.freq) * FLOAT.wave;
    const vx = Math.abs(x1 - x0) / FLOAT.dur, vy = Math.cos(age * FLOAT.freq) * FLOAT.wave * FLOAT.freq;
    let rot = Math.atan(vy / vx) * h.dir * 0.7 + Math.sin(age * 4.2) * 0.06;
    if (h.caught) { const c = nowSec() - h.caught; y -= c * c * 900; x += h.dir * c * 260; rot += h.spin * c * 8; }
    return { x, y, rot };
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

  // "jonny" tippen: er schaut unten links herein (Erkennung in typedWord, weiter unten)
  let typed = '', typedT = 0, peek = null;
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
  const LOGO = { x: 370, y: 80, w: 540, h: 140 };
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
    if (shiftDown && !sp.data.loaded && (sp.data.loadClicks = (sp.data.loadClicks || 0) + 1) >= 6) loadMenuDie(sp);
    const v = sp.data.loaded ? 6 : 1 + Math.floor(Math.random() * 6);
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

  // ── Zweite Welle: Anrufbeantworter-Bänder, Secrets und Easter Eggs (2026-11-12) ──────────
  const BOOT = Date.now();
  const eggs = () => { const m = meta(); return m.eggs || (m.eggs = {}); };
  let shiftDown = false;
  window.addEventListener('pointerdown', (e) => { shiftDown = e.shiftKey; }, true);
  // Jonny schaut unten links herein (Menü und Spiel)
  function peekSay(mood, text) {
    peek = { t0: nowSec(), mood, text };
    for (let i = 0; i < 5; i++) eng.after(0.35 + i * 0.07, () => sfx('voice', { f: 560 + Math.random() * 120, mood }));
  }
  // Band von Jonnys Vater gefunden (voicemails.js): Einblendung, alle acht = Secret
  function tape(id) {
    if (!Tapes || TUT.active || !Tapes.add(meta(), id)) return;
    Saves.saveMeta();
    const t = Tapes.BY_ID[id], n = Tapes.count(meta());
    toasts.push({ a: { name: 'Tape ' + n + ' / ' + Tapes.LIST.length + ': ' + t.title, desc: 'Listen to it in the Codex (Phone tab)', rewards: [], secret: true, head: 'New voicemail' }, t0: null });
    sfx('ring');
    if (Tapes.all(meta())) secret('answering_machine');
  }

  // Alle Würfel gehalten und trotzdem Reroll gedrückt
  let placebo = 0;
  function eggPlacebo() {
    placebo++;
    eng.popup(B.roll.x + B.roll.w / 2, B.roll.y - 24, 'All dice are held', { colour: P.TEXT_SOFT, size: 18 });
    if (placebo !== 10 || TUT.active) return;
    jonnySay([['smug', "You know nothing's happening, right? {q|Every single die is held.}"]], { always: true, replace: true });
    secret('placebo');
  }
  // Nach jedem Wurf: The Frost zählt eingefrorene Würfel
  function eggAfterRoll() {
    if (bossActive('frost')) BT().maxFrozen = Math.max(BT().maxFrozen || 0, dice.filter((d) => frozen(d)).length);
  }
  // Erster Wurf einer Hand: Deja vu, und Jonny hat den gezinkten Menü-Würfel gesehen
  let cheatSeen = false;
  function eggOpeningRoll() {
    placebo = 0;
    if (TUT.active || dice.length < 5) return;
    const key = dice.map((d) => { const f = upFace(d); return R.isSkull(f) ? 'S' : f.kind === 'wild' ? 'W' : String(f.v); }).sort().join('');
    if (S.ach.open && S.ach.open === key) {
      eng.popup(L.msg.x, dieY() - 130, 'Deja vu...', { colour: lighten(P.PURPLE, 0.3), size: 24, life: 1.8 });
      secret('deja_vu');
    }
    S.ach.open = key;
    if (cheatSeen) { cheatSeen = false; jonnySay([['paranoid', 'I saw that. {q|The menu die. Shift-click. Very funny.}']], { always: true, replace: true }); }
  }
  // Nach jeder gewerteten Hand: 666 und Pi-Tag
  function eggHand(res, total) {
    if (TUT.active || res.bust) return;
    if (total === 666) {
      eng.shake(12);
      eng.emit(L.msg.x, dieY() - 60, { count: 70, colours: ['#B0301E', '#F08A24', '#1C1210'], speed: 520, size: 10, life: 1.2 });
      eng.popup(L.msg.x, dieY() - 160, '6  6  6', { colour: '#B0301E', size: 42, life: 2.2 });
      jonnySay([['shocked', 'Six. Six. Six. {q|Did you hear that? Something laughed.}']], { always: true, replace: true });
      tape('number');
    }
    const d = new Date();
    if (d.getMonth() === 2 && d.getDate() === 14 && total === 314) {
      eng.popup(L.msg.x, dieY() - 160, 'Happy Pi Day! 3.14159...', { colour: P.GOLD, size: 30, life: 2.4 });
      eng.emit(L.msg.x, dieY() - 60, { count: 40, colours: [P.GOLD, '#FFFFFF'], speed: 420, size: 9, life: 1, shape: 'star' });
    }
  }
  // Knapp verloren (weniger als 1 % unter dem Ziel)
  const closeLoss = () => S.target > 0 && S.score < S.target && S.score >= S.target * 0.99;
  let lostAt = 0, coffeeDone = false;
  function eggLost() {
    lostAt = nowSec(); coffeeDone = false;
    if (TUT.active || !closeLoss()) return;
    secret('so_close');
    tape('close');
  }
  // Pause > Quit kurz nach einem Bust: beim nächsten Start ruft Jonny an
  function eggQuit() {
    if (TUT.active || !S.ach.bustT || Date.now() - S.ach.bustT > 5000) return;
    secret('rage_quit');
    eggs().rage = Date.now();
    Saves.saveMeta();
  }
  // Während eines Showdowns den Tab wechseln
  let awayBoss = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { awayBoss = !inMenus() && !TUT.active && isBossBlind() && ['select', 'rolling', 'scoring'].includes(S.phase); return; }
    if (!awayBoss) return;
    awayBoss = false;
    secret('research');
    jonnySay([['smug', 'Back already? Checking the wiki? {q|There is no wiki. I checked.}']], { always: true, replace: true });
  });
  // Fenster ganz klein ziehen
  let squeezeT = -99;
  window.addEventListener('resize', () => {
    if (MOBILE || (window.innerWidth >= 560 && window.innerHeight >= 330) || nowSec() - squeezeT < 15) return;
    squeezeT = nowSec();
    secret('tight_squeeze');
    peekSay('shocked', "Hey! It's cramped in here!");
  });
  // Codex: gesperrte Einträge immer wieder anklicken
  let stubborn = 0;
  function eggLockedClick(m) {
    stubborn++;
    eng.popup(m.x, m.y - 24, stubborn >= 20 ? 'The lock cracks a little.' : stubborn >= 12 ? 'Still locked.' : 'Locked', { colour: lighten(P.PURPLE, 0.35), size: 16 + Math.min(8, stubborn / 3), life: 1 });
    if (stubborn === 20) { eng.shake(6); secret('stubborn'); }
  }

  // Wörter tippen: "jonny" geht überall, die anderen nur im Hauptmenü
  const WORDS = ['jonny', 'luck', 'roll', 'dad', 'upsidedown'];
  function typedWord(k) {
    if (!/^[a-z]$/.test(k)) return { word: null, n: 0 };
    const now = nowSec();
    if (now - typedT > 1.5) typed = '';
    typedT = now;
    typed = (typed + k).slice(-12);
    let best = { word: null, n: 0 };
    for (const w of WORDS) {
      if (w !== 'jonny' && S.phase !== 'menu') continue;
      for (let n = w.length; n > best.n; n--) if (typed.endsWith(w.slice(0, n))) { best = { word: w, n }; break; }
    }
    return best;
  }
  let dadFlash = -99;
  function menuWord(w) {
    typed = '';
    if (w === 'luck') {
      for (let i = 0; i < 26; i++) eng.after(i * 0.04, () => eng.emit(40 + Math.random() * 1200, -12, { count: 3, colours: ['#2E8B57', '#5DBB63', '#A8E06A'], angle: Math.PI / 2, spread: 0.7, speed: 240, gravity: 380, drag: 0.4, size: 12, life: 2.4, shape: 'diamond' }));
      eng.popup(640, 300, '+100 Luck!', { colour: P.GREEN, size: 36, life: 1.4 });
      eng.after(0.9, () => eng.popup(640, 340, '(only in the menu)', { colour: P.TEXT_SOFT, size: 20, life: 1.4 }));
      sfx('lucky');
    } else if (w === 'roll') {
      menuDice.forEach((d, i) => eng.after(i * 0.09, () => { if (menuDice.includes(d)) rollMenuDie(d); }));
    } else if (w === 'dad') {
      dadFlash = nowSec();
      eng.after(0.8, () => peekSay('shocked', 'Dad?! ...Oh. You were just typing.'));
      tape('dad');
    } else if (w === 'upsidedown') flipMenu();
  }
  // "upsidedown": das Menü steht 5 Sekunden lang Kopf, rote Sporen schweben (Eingaben mit der Maus ruhen so lange)
  let flipUntil = 0;
  function flipMenu() {
    const c = eng.canvas, now = performance.now();
    if (!c || now < flipUntil) return;
    flipUntil = now + 5600;
    const fast = setEff('reduceMotion');
    c.style.transition = fast ? 'none' : 'rotate 0.6s ease-in-out';
    c.style.rotate = '180deg';
    eng.shake(5);
    for (let i = 0; i < 40; i++) eng.after(i * 0.12, () => eng.emit(40 + Math.random() * 1200, 120 + Math.random() * 600, { count: 3, colours: ['#B0301E', '#E04A2A', '#FF6A3A'], angle: -Math.PI / 2, spread: 1.2, speed: 90, gravity: -40, drag: 0.5, size: 10, life: 3 }));
    setTimeout(() => {   // echte Zeit: die Spielzeit läuft bei wenigen Bildern pro Sekunde langsamer
      c.style.rotate = '';
      setTimeout(() => { c.style.transition = ''; if (S.phase === 'menu') peekSay('nervous', 'Did the lights just flicker?'); }, 600);
    }, 5000);
  }
  ['pointerdown', 'pointerup', 'pointermove'].forEach((t) => window.addEventListener(t, (e) => { if (performance.now() < flipUntil) e.stopPropagation(); }, true));
  // Silhouette des Vaters flackert kurz im Hintergrund
  const DAD_ART = ['...XXXXXX...', '...XXXXXX...', '.XXXXXXXXXX.', '....XXXX....', '....XXXX....', '.....XX.....', '..XXXXXXXX..', '.XXXXXXXXXX.', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX'];
  function drawDad(ctx) {
    const age = nowSec() - dadFlash;
    if (age > 0.9 || S.phase !== 'menu') return;
    const a = (age < 0.12 || (age > 0.3 && age < 0.38) || (age > 0.6 && age < 0.7)) ? 0.55 : 0.12;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#05070A';
    DAD_ART.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') ctx.fillRect(1040 + i * 14, 300 + j * 14, 14, 14); }));
    ctx.restore();
  }
  // Gezinkter Menü-Würfel: sechsmal mit Shift anklicken, dann zeigt er immer 6
  function loadMenuDie(sp) {
    sp.data.loaded = true;
    eng.popup(sp.x, sp.y - 70, 'Loaded.', { colour: P.TEXT_SOFT, size: 18, life: 1.2 });
    cheatSeen = true;
    secret('cheater');
    tape('lesson');
  }
  // Mit der Maus die Menü-Würfel umkreisen, bis ihnen schwindelig wird
  const spin = { a: null, sum: 0, t: 0, mx: 0, my: 0 };
  let dizzyT = -99;
  function spinTick() {
    if (S.phase !== 'menu' || settingsOpen || !menuDice.length) { spin.a = null; spin.sum = 0; return; }
    const m = eng.mouse, now = nowSec();
    if (m.x !== spin.mx || m.y !== spin.my) { spin.t = now; spin.mx = m.x; spin.my = m.y; }
    if (now - spin.t > 1) { spin.sum = 0; spin.a = null; return; }
    const cx = menuDice.reduce((s, d) => s + d.x, 0) / menuDice.length, cy = menuDice.reduce((s, d) => s + d.y, 0) / menuDice.length;
    const r = Math.hypot(m.x - cx, m.y - cy);
    if (r < 70 || r > 460) { spin.a = null; return; }
    const a = Math.atan2(m.y - cy, m.x - cx);
    if (spin.a !== null) {
      let d = a - spin.a;
      if (d > Math.PI) d -= 2 * Math.PI; else if (d < -Math.PI) d += 2 * Math.PI;
      if (Math.abs(d) < 2.5) spin.sum += d;   // große Sprünge (Maus quer durch die Mitte) zählen nicht
    }
    spin.a = a;
    if (Math.abs(spin.sum) < 5 * 2 * Math.PI || now - dizzyT < 8) return;
    dizzyT = now; spin.sum = 0;
    menuDice.forEach((d, i) => {
      const p = L.menuDie(i);
      for (let k = 0; k < 10; k++) eng.after(k * 0.11 + i * 0.03, () => d.moveTo(p.x + (k % 2 ? 7 : -7), p.y, p.r + (k % 2 ? 0.55 : -0.55) * (1 - k / 10)));
      eng.after(1.25 + i * 0.03, () => d.moveTo(p.x, p.y, p.r));
      eng.popup(p.x, p.y - 70, '@_@', { colour: P.PURPLE, size: 22, life: 1.4 });
    });
    sfx('whoosh');
    secret('dizzy');
  }
  // Partyhut für den Wild-Würfel am Aleator Day (10. November)
  function drawPartyHat(ctx) {
    if (!SEASON.aleatorDay || S.phase !== 'menu' || menuDice.length < 5) return;
    const d = menuDice[4], k = (d.s || 3) / 3, s = 5 * k, p = L.menuDie(4);
    ctx.save(); ctx.translate(d.x + 16 * k, d.y - 42 * k); ctx.rotate((p.r || 0) + 0.3);
    const HAT = ['.....W.....', '....XXX....', '....YXX....', '...XXYXX...', '...XXXYX...', '..YXXXXYX..', '..XYXXXXY..', '.XXXYXXXXY.', 'XXXXXYXXXXX'];
    HAT.forEach((row, j) => [...row].forEach((ch, i) => {
      if (ch === '.') return;
      ctx.fillStyle = ch === 'W' ? '#FFFFFF' : ch === 'Y' ? '#F3C969' : '#C2453E';
      ctx.fillRect((i - 5.5) * s, (j - 9) * s, s, s);
    }));
    ctx.restore();
  }
  // Laufende Kleinigkeiten (aus update)
  let menuSince = 0, eggPhase = '', nightRang = false, rageShown = false, daySaid = false, snowClock = 0, deepSlept = false;
  function eggTick() {
    const now = nowSec();
    if (S.phase !== eggPhase) { if (S.phase === 'menu') menuSince = now; eggPhase = S.phase; }
    spinTick();
    if (S.phase === 'menu' && !settingsOpen && !TUT.modal) {
      const e = eggs();
      if (e.rage && e.rage < BOOT && !rageShown && now - menuSince > 1.5) {
        rageShown = true; delete e.rage; Saves.saveMeta();
        sfx('ring');
        eng.after(1, () => peekSay('paranoid', 'You hung up on me. ...I saw the Bust. I get it.'));
      }
      const h = new Date().getHours();
      if (h < 5 && !nightRang && now - menuSince > 20 && Tapes && !Tapes.owned(meta()).night) {
        nightRang = true;
        sfx('ring');
        eng.popup(640, 620, '* ring ring *', { colour: P.TEXT_SOFT, size: 22, life: 1.6 });
        eng.after(1.8, () => { eng.popup(640, 620, 'Nobody picked up. He left a message.', { colour: P.TEXT_SOFT, size: 20, life: 2.2 }); tape('night'); });
      }
      if (SEASON.aleatorDay && !daySaid && now - menuSince > 2) { daySaid = true; peekSay('excited', 'Happy Aleator Day! Party hats for everyone. Well. For one die.'); }
      if (SEASON.december && !setEff('reduceMotion') && now - snowClock > 0.22) {
        snowClock = now;
        eng.emit(Math.random() * 1280, -10, { count: 1, colours: ['#FFFFFF', '#E6F0FF'], angle: Math.PI / 2, spread: 0.5, speed: 70, gravity: 18, drag: 0, size: 6, life: 11, shape: 'circle', spin: 1 });
      }
    }
    if (S.phase === 'lost' && lostAt && !coffeeDone && now - lostAt > 600) {
      coffeeDone = true;
      secret('coffee_break');
      peekSay('happy', 'Still here? Here. Coffee. Black, like that run.');
    }
    if (S.phase === 'select' && !TUT.active && !deepSlept && now - lastInput > 600) {
      deepSlept = true;
      jonnySay([['happy', '...zzz... {q|five more minutes...}']], { always: true });
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
    const vt = visTabBtns();
    vt.forEach((b, i) => Object.assign(b, { x: g.vc + (i - (vt.length - 1) / 2) * (g.tabW + 14) - g.tabW / 2, y: 20, w: g.tabW, h: 80, size: 30 }));
    for (const b of SET_BTNS) {
      const q = mSetRow(b.setRow, SET_TABS[b.inTab].rows.length), y = q.y + (q.h - 76) / 2;
      if (b.action) Object.assign(b, { x: q.x + q.w - 236, y, w: 222, h: 76, size: 28 });
      else Object.assign(b, { x: b.dir < 0 ? q.x + q.w - 334 : q.x + q.w - 96, y, w: 86, h: 76, size: 38 });
    }
    if (inMenus()) { Object.assign(B.close, { x: vc - 300, y: 606, w: 280, h: 92, size: 34 }); Object.assign(B.apply, { x: vc + 20, y: 606, w: 280, h: 92, size: 34 }); }
    else {
      Object.assign(B.close, { x: vc - 440, y: 606, w: 280, h: 92, size: 34 }); Object.assign(B.apply, { x: vc - 140, y: 606, w: 280, h: 92, size: 34 });
      Object.assign(B.quit, { x: vc + 160, y: 606, w: 280, h: 92, size: 30 });
    }
    [B.askApply, B.askDiscard, B.askStay].forEach((b, i) => Object.assign(b, { x: vc - 440 + i * 300, y: 400, w: 280, h: 92, size: 30 }));
    const sg = mSlotGeom();
    for (let k = 0; k < 3; k++) {
      Object.assign(SLOT_MAIN[k], { x: sg.x(k) + 14, y: sg.y + 312, w: sg.W - 28, h: 92, size: 32 });
      Object.assign(SLOT_DEL[k], { x: sg.x(k) + 30, y: sg.y + 412, w: sg.W - 60, h: 64, size: 24 });
    }
    Object.assign(B.tutSlot, { x: sg.x(3) + 14, y: sg.y + 312, w: sg.W - 28, h: 92, size: 28 });
    if (S.phase === 'cups') { Object.assign(B.back, { x: vc - 300, y: 612, w: 280, h: 92, size: 34 }); Object.assign(B.begin, { x: vc + 20, y: 612, w: 280, h: 92, size: 34 }); }
    else if (S.phase === 'challenges') { Object.assign(B.back, { x: vc - 300, y: 612, w: 280, h: 92, size: 34 }); Object.assign(B.chStart, { x: vc + 20, y: 612, w: 280, h: 92, size: 32 }); }
    else Object.assign(B.back, { x: vc - 140, y: 612, w: 280, h: 92, size: 34 });
    Object.assign(B.cupPrev, { x: v.l + 24, y: 168, w: 104, h: 124, size: 48 });
    Object.assign(B.challenges, { x: v.r - 304, y: 14, w: 280, h: 76, size: 30 });
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
    return { vc, pw, colW: Math.min(640, (pw - 64) / 2), tabW: Math.min(250, (pw - 40) / visTabBtns().length - 14) };
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
    for (const b of visTabBtns()) UI.button(ctx, b, t);
    const tab = SET_TABS[setTab];
    if (tab.id === 'run') { drawRunTabMobile(ctx); drawPhoneRowMobile(ctx, g); }
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
    UI.button(ctx, B.apply, t);
    if (!inMenus()) UI.button(ctx, B.quit, t);
    const hint = lockHint() || (!inMenus() && B.quit.disabled ? 'Saving is possible once the dice have settled'
      : setDirty() ? 'Changes are a preview until you tap Apply'
        : tab.id === 'game' ? 'Jonny chatter: his comments in the shop and during runs. Reset clears trophies and unlocks.' : '');
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
        const s1 = (r.endless ? 'Endless ' : 'Stage ') + r.ante + '  ·  ' + where;
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
    if (Chal && profile) UI.button(front, B.challenges, t);
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
    const sub = songInfo.album || 'Aleator soundtrack';
    UI.text(ctx, sub, 58, 58, { size: fitText(ctx, sub, w - 72, 13), colour: P.TEXT_SOFT, align: 'left' });
    ctx.restore();
  }

  // ── Formation auf dem Tisch: Plätze, Links, Zeile unter den Würfeln ─────────
  // Die Plätze sind immer leicht zu sehen; mit Formation-Relikten oder -Upgrades deutlicher. Mitte und Ränder
  // leuchten, wenn ein Relikt sie belohnt. Links (gleiche Nachbarn) zeigen ein Kettenglied zwischen den Würfeln.
  let formKey = '', formRes = null;
  function formationNow() {
    if (!formationOn() || S.phase !== 'select' || fogged()) return null;
    const pv = preview();
    if (!pv) return null;
    const key = previewKey + '|' + dice.length;
    if (key !== formKey) { formKey = key; formRes = R.formationOf(pv.vals, pv.scoring, dice.length, pv.name); formRes.keystone = handOpts(dice.map(upFace)).wild.filter((i) => pv.used.includes(i)); }
    return formRes;
  }
  const formationOwned = () => (R.tagCounts(S.relics).formation || 0) > 0 || upg('turntable') || upg('magnetic') || upg('spotlight');
  function drawTable(back) {
    if (!['rolling', 'select', 'scoring'].includes(S.phase) || !dice.length || !formationOn() || S.cupDraw) return;
    const n = dice.length, Y = dieY(), mids = R.midSlots(n), col = FORM_COL(), sz = Math.round(DIE_S * 32 + 16);
    const midHot = has('centerpiece') || has('keystone') || upg('spotlight'), endHot = has('bookends') || has('flanking');
    const base = formationOwned() ? 0.26 : 0.13, dragging = dice.some((d) => d.dragging);
    if (upg('spotlight')) mids.forEach((i) => {
      const x = dieX(i, n);
      back.save(); back.globalAlpha = 0.11 + 0.04 * Math.sin(eng.time * 2.2); back.fillStyle = '#FFF0B2';
      back.beginPath(); back.moveTo(x - 16, Y - 160); back.lineTo(x + 16, Y - 160); back.lineTo(x + sz / 2 + 6, Y + sz / 2 + 6); back.lineTo(x - sz / 2 - 6, Y + sz / 2 + 6); back.fill();
      back.restore();
    });
    for (let i = 0; i < n; i++) {
      const x = dieX(i, n), hot = dragging && dragSlot === i;
      const special = (midHot && mids.includes(i)) || (endHot && (i === 0 || i === n - 1));
      back.save(); back.globalAlpha = hot ? 0.95 : special ? base + 0.3 : base;
      UI.box(back, x - sz / 2, Y - sz / 2 + 6, sz, sz, { colour: hot ? 'rgba(232,182,91,0.25)' : 'rgba(0,0,0,0.55)', radius: 14, shadow: false,
        outline: hot ? P.GOLD : special ? lighten(col, 0.3) : 'rgba(255,255,255,0.55)', outlineWidth: hot ? 3 : 2 });
      back.restore();
    }
  }
  // Kettenglied (zwei verschränkte Glieder) zwischen zwei Würfeln
  function chainIcon(c, a, b, colour, alpha, scale = 1) {
    const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2, ang = Math.atan2(b.y - a.y, b.x - a.x);
    c.save(); c.globalAlpha = clamp(alpha, 0, 1); c.translate(x, y); c.rotate(ang); c.scale(scale, scale);
    const link = (cx, cy) => {
      c.lineWidth = 4; c.strokeStyle = darken(colour, 0.5); c.strokeRect(cx - 8, cy - 4, 16, 10);
      c.lineWidth = 3; c.strokeStyle = colour; c.strokeRect(cx - 8, cy - 5, 16, 10);
    };
    link(-6, 0); link(6, 0);
    c.restore();
  }
  function drawLinks(front) {
    if (!dice.length || !formationOn()) { linkFx.length = 0; return; }
    const col = lighten(FORM_COL(), 0.15);
    const fo = formationNow();
    if (fo && fo.ok && !dice.some((d) => d.dragging)) fo.linkPairs.forEach(([a, b]) => { if (dice[a] && dice[b]) chainIcon(front, dice[a], dice[b], col, 0.6 + 0.3 * Math.sin(eng.time * 4 + a)); });
    for (let k = linkFx.length - 1; k >= 0; k--) {
      const f = linkFx[k], age = eng.time - f.t0;
      if (age > 0.75 || f.a._dead || f.b._dead) { linkFx.splice(k, 1); continue; }
      chainIcon(front, f.a, f.b, f.big ? P.GOLD : lighten(FORM_COL(), 0.4), 1 - age / 0.75, 1.1 + (1 - age / 0.75) * 0.7);
    }
  }
  // Was die Formation gerade bringt (für die Zeile unter den Würfeln bzw. die Statuszeile auf dem Handy)
  function formParts() {
    if (!formationOn() || S.phase !== 'select' || !dice.length) return [];
    const fo = formationNow(), out = [], col = lighten(FORM_COL(), 0.4);
    if (fo && fo.ok) {
      if (fo.links) out.push([fo.links + (fo.links === 1 ? ' Link' : ' Links') + ' +' + fo.links * linkPips() + ' Pips', col]);
      if (has('chain_reaction') && fo.chain.length >= 2) out.push(['Chain of ' + fo.chain.length, col]);
      if (has('bookends') && fo.bookends) out.push(['Bookends x2', P.GOLD]);
      if (has('palindrome') && fo.palindrome) out.push(['Palindrome x2.5', P.GOLD]);
      if (has('stepping') && fo.steps) out.push([fo.steps + (fo.steps === 1 ? ' Step' : ' Steps'), col]);
      if (fo.keystone && fo.keystone.length) out.push(['Keystone', P.GOLD]);
    }
    out.push(['Shifts ' + S.shifts, S.shifts ? P.TEXT_SOFT : P.TEXT_DIM]);
    return out;
  }
  function drawFormationLine(front) {
    if (!L.formLine) return;
    const parts = formParts();
    if (!parts.length) return;
    const txt = parts.map((q) => q[0]).join('   ·   '), size = L.formLine.size || 14, y = dieY() + (L.formLine.dy || 80);
    front.font = UI.font(size);
    let x = L.die.x - front.measureText(txt).width / 2;
    parts.forEach((q, i) => {
      const seg = (i ? '   ·   ' : '') + q[0];
      UI.text(front, seg, x, y, { size, colour: q[1], align: 'left' });
      front.font = UI.font(size); x += front.measureText(seg).width;
    });
  }

  // ── Jonny: Sprüche nach Situation (jonny-lines.js) ──────────────────────────
  // Jede Situation hat Stufen (je heftiger, desto lauter). Gleiche Sätze kommen erst wieder, wenn die Hälfte der Liste
  // dran war. Pro Situation gibt es eine Pause (cd), außerdem einen Mindestabstand zu jedem anderen Spruch (gap).
  const JL = window.WG_JONNY || { SHOP: {}, EVENT: {} };
  const lineMemory = {};
  function pickLine(key, pool) {
    if (!pool || !pool.length) return null;
    const used = lineMemory[key] || (lineMemory[key] = []);
    const free = pool.map((_, i) => i).filter((i) => !used.includes(i));
    const i = R.pick(free.length ? free : pool.map((_, k) => k));
    used.push(i);
    while (used.length > Math.floor(pool.length / 2)) used.shift();
    return pool[i];
  }
  const fillLine = (line, vars) => (line ? [line[0], line[1].replace(/#(\w+)#/g, (m, k) => (vars && vars[k] !== undefined ? String(vars[k]) : m))] : null);
  const evClock = {};
  function jonnyLine(key, pool, vars, o = {}) {
    if (!pool || !pool.length || TUT.active) return false;
    if (!o.important && evClock[key] !== undefined && eng.time - evClock[key] < (o.cd || 30)) return false;
    const line = fillLine(pickLine(key, pool), vars);
    const said = jonnySay([line], { chance: o.chance === undefined ? 1 : o.chance, gap: o.gap === undefined ? 12 : o.gap, important: o.important, key: o.key || 'event', replace: o.replace, place: o.place });
    if (said) evClock[key] = eng.time;
    return said;
  }
  // einmal pro Run (in S.stats.said gemerkt, damit es auch nach dem Laden gilt)
  const once = (k) => { const said = S.stats && S.stats.said; if (!said || said[k]) return false; said[k] = 1; return true; };
  const stageTier = () => (S.ante > ANTES ? 'endless' : S.ante >= 7 ? 'late' : S.ante >= 4 ? 'mid' : 'early');
  let newRecord = false;   // die gerade gewertete Hand ist die beste aller Runs (setzt startFuse)
  function jonnyEvents(kind, e = {}) {
    if (TUT.active || inMenus() || !JL.EVENT) return;
    const E = JL.EVENT, cupJ = cup().jonny, bossJ = isFinal() && isBossBlind();
    const v = { stage: S.ante, score: UI.num(S.target) };
    if (kind === 'roundStart') {
      if (S.endless && S.blindIdx === 0) { const tier = S.ante >= 12 ? 2 : S.ante >= 10 ? 1 : 0; jonnyLine('endless:' + tier, E.endless.stage[tier], v, { chance: 0.85, gap: 4 }); return; }
      if (!cupJ) jonnyLine('round:' + stageTier(), E.roundStart[stageTier()], v, { chance: S.blindIdx === 0 ? 0.3 : 0.15, cd: 60 });
      return;
    }
    if (kind === 'heat') {
      // Heat: Jonny merkt, dass der Spieler zu gut ist. Beim ersten Mal und beim Maximum sicher, sonst ab und zu.
      const h = heatPct(), tier = h >= (HEAT_CAP - 1) * 100 ? 2 : h >= 50 ? 1 : 0, hv = Object.assign({}, v, { x: h });
      if (once('heat' + tier)) jonnyLine('heat:' + tier, E.heat[tier], hv, { chance: 1, gap: 0, important: true, replace: true });
      else jonnyLine('heat:' + tier, E.heat[tier], hv, { chance: 0.3, cd: 120 });
      return;
    }
    if (kind === 'boss') { const id = S.boss && S.boss.id; if (E.boss[id]) jonnyLine('boss:' + id, E.boss[id], v, { chance: 0.5, cd: 20, gap: 4 }); return; }
    if (kind === 'elite') { const lv = (S.boss && S.boss.lv) || 1, pool = E.elite && E.elite[lv]; if (pool) jonnyLine('elite:' + lv, pool, Object.assign({}, v, { boss: S.boss.name }), { chance: 0.9, gap: 2, important: lv === 2 }); return; }
    if (kind === 'endless') { jonnyLine('endless', E.endless.start, v, { important: true, replace: true }); return; }
    if (kind === 'chaos') { jonnyLine('chaos', E.chaos, { rule: e.rule }, { chance: 0.45, cd: 30 }); return; }
    if (kind === 'idle') { jonnyLine('idle', E.idle, v, { cd: 300, gap: 20 }); return; }
    if (kind === 'shift') {
      const n = S.stats.shifts;
      if (n === 1 && once('shift1')) jonnyLine('shift0', E.shift[0], v, { chance: (meta().track.shifts || 0) <= 3 ? 0.9 : 0.25 });
      else if (n === 12 && once('shift12')) jonnyLine('shift1', E.shift[1], v, { chance: 0.6 });
      return;
    }
    if (kind === 'reroll') {
      if (cupJ || bossJ) return;
      if (e.lucky >= 2) jonnyLine('lucky', E.lucky[e.lucky >= 3 ? 1 : 0], { n: e.lucky }, { chance: e.lucky >= 3 ? 0.8 : 0.4, cd: 25 });
      else if (S.rerollsHand === 6 || S.rerollsHand === 10) jonnyLine('spree', E.rerollSpree[S.rerollsHand >= 10 ? 1 : 0], { n: S.rerollsHand }, { chance: 0.5, cd: 40 });
      return;
    }
    if (kind === 'lastHand') {
      if (cupJ || bossJ) return;
      const left = Math.max(0, S.target - S.score), k = left / Math.max(1, S.target);
      if (k > 0.5) jonnyLine('desperate', E.desperate[k > 0.8 ? 1 : 0], { n: UI.num(left) }, { chance: k > 0.8 ? 0.7 : 0.45, cd: 40 });
      return;
    }
    if (kind === 'roundWon') {
      if (!cupJ && !bossJ && e.handsLeft === 0) jonnyLine('clutch', E.clutch, v, { chance: 0.6, gap: 3 });
      return;
    }
    if (kind === 'state') {
      if (S.phase === 'won') return;
      const m = S.money;
      if (m >= 100 && once('m100')) jonnyLine('money2', E.money[2], { money: m }, { chance: 0.9, gap: 6 });
      else if (m >= 50 && once('m50')) jonnyLine('money1', E.money[1], { money: m }, { chance: 0.8, gap: 6 });
      else if (m >= 25 && once('m25')) jonnyLine('money0', E.money[0], { money: m }, { chance: 0.6, gap: 6 });
      const counts = R.tagCounts(S.relics);
      for (const tg of R.TAG_ORDER) {
        const lv = R.setLevel(counts, tg);
        if (lv >= 5 && once('set5:' + tg)) { jonnyLine('set5', E.set[1], { tag: R.TAGS[tg].name }, { chance: 0.9, gap: 4 }); break; }
        if (lv >= 3 && once('set3:' + tg)) { jonnyLine('set3', E.set[0], { tag: R.TAGS[tg].name }, { chance: 0.7, gap: 4, cd: 10 }); break; }
      }
      return;
    }
    if (kind === 'hand') {
      const { res, total, fo, streak } = e, ratio = total / Math.max(1, S.target);
      if (newRecord) { newRecord = false; if (total >= 1000 && jonnyLine('record', E.record, { score: UI.num(total) }, { important: true, replace: true })) return; }
      if (cupJ || bossJ) return;   // dort kommentiert Jonny mit seinen eigenen Sprüchen (jonnyHand)
      const big = ratio >= 10 ? 3 : ratio >= 3 ? 2 : ratio >= 1 ? 1 : ratio >= 0.5 ? 0 : -1, x = fmtX(Math.floor(ratio * 10) / 10);
      if (res.bust) { const n = Math.max(1, S.ach.busts); jonnyLine('bust', E.bust[Math.min(2, n - 1)], { n }, { chance: n >= 3 ? 0.9 : 0.55, cd: 12, replace: true }); return; }
      if (res.name === 'Five of a Kind' && jonnyLine('five', E.five, v, { chance: 0.9, replace: true, gap: 2 })) return;
      if (big >= 2 && jonnyLine('big' + big, E.bigHand[big], { x }, { chance: big === 3 ? 1 : 0.8, replace: true, gap: 3 })) return;
      if (fo) {
        if (fo.chain.length >= 4 && once('chain4') && jonnyLine('chain4', E.link[2], { n: fo.chain.length }, { chance: 0.9, gap: 3 })) return;
        if (fo.chain.length === 3 && once('chain3') && jonnyLine('chain3', E.link[1], v, { chance: 0.6, gap: 4 })) return;
        if (fo.links && once('link1') && jonnyLine('link1', E.link[0], v, { chance: (meta().track.shifts || 0) < 5 ? 0.85 : 0.3, gap: 4 })) return;
        if (fo.palindrome && once('palindrome') && jonnyLine('palindrome', E.palindrome, v, { chance: 0.9, gap: 3 })) return;
      }
      if ((streak === 3 || streak === 5) && jonnyLine('streak', E.streak[streak >= 5 ? 1 : 0], { hand: res.name, n: streak }, { chance: 0.4, cd: 30 })) return;
      if (big >= 0 && jonnyLine('big' + big, E.bigHand[big], { x }, { chance: big === 1 ? 0.5 : 0.18, cd: 25 })) return;
      if (res.name === 'Four of a Kind' && once('four')) jonnyLine('four', E.four, v, { chance: 0.5 });
    }
  }

  // ── Codex: alles, was es gibt, mit Freischalt-Stand ─────────────────────────
  // meta().codex zählt pro Art, wie oft man etwas bekommen hat (gekauft, vom Becher, verwandelt) bzw. getroffen (Bosse).
  // Zustände: owned (schon einmal gehabt), open (freigeschaltet, aber nie gehabt: ausgegraut), locked ("???" mit Aufgabe).
  const CODEX_KINDS = ['relic', 'upgrade', 'oracle', 'die', 'boss', 'cup', 'encounter', 'elite', 'phone'];
  function codexData() {
    const m = meta();
    if (!m.codex) {
      m.codex = {};
      for (const k of CODEX_KINDS) m.codex[k] = {};
      // Nachtragen aus laufenden Runs der Speicherplätze und besiegten Bossen
      for (let k = 0; k < Saves.COUNT; k++) {
        const d = Saves.load(k), r = d && d.run;
        if (!r) continue;
        (r.relics || []).forEach((q) => { m.codex.relic[q.id] = (m.codex.relic[q.id] || 0) + 1; });
        (r.upgrades || []).forEach((id) => { m.codex.upgrade[id] = (m.codex.upgrade[id] || 0) + 1; });
        (r.bag || []).forEach((q) => { m.codex.die[q.type] = Math.max(1, m.codex.die[q.type] || 0); });
        if (r.cup) m.codex.cup[r.cup] = (m.codex.cup[r.cup] || 0) + 1;
      }
      Object.keys((m.track && m.track.bosses) || {}).forEach((id) => { m.codex.boss[id] = 1; });
      if (m.stats && m.stats.runs) { m.codex.die.standard = m.codex.die.standard || 1; m.codex.cup.classic = m.codex.cup.classic || 1; }
    }
    for (const k of CODEX_KINDS) if (!m.codex[k]) m.codex[k] = {};
    return m.codex;
  }
  function seen(kind, id) {
    if (!profile || TUT.active || !id) return;
    const c = codexData()[kind];
    c[id] = (c[id] || 0) + 1;
  }
  const CODEX_TABS = [
    { id: 'relic', label: 'Relics' }, { id: 'upgrade', label: 'Upgrades' }, { id: 'oracle', label: 'Oracles' },
    { id: 'die', label: 'Dice' }, { id: 'boss', label: 'Bosses' }, { id: 'cup', label: 'Cups' }, { id: 'encounter', label: 'Encounters' },
    { id: 'phone', label: 'Phone' },
  ];
  const CODEX_MID = (CODEX_TABS.length - 1) / 2;   // Reiter mittig um 640
  const CODEX_TAB_BTNS = CODEX_TABS.map((tb, i) => (MOBILE ? btn(640 + (i - CODEX_MID) * 152 - 73, 70, 146, 50, tb.label, P.L_BLACK, { size: 22, codexTab: i })
    : btn(640 + (i - CODEX_MID) * 134 - 64, 78, 128, 40, tb.label, P.L_BLACK, { size: 18, codexTab: i })));
  ALL_BUTTONS.push(...CODEX_TAB_BTNS);
  const CODEX_GRID = MOBILE ? { x: 40, y: 152, cols: 8, size: 74, gap: 12, rows: 5 } : { x: 48, y: 150, cols: 10, size: 64, gap: 10, rows: 6 };
  const CODEX_PANEL = MOBILE ? { x: 830, y: 146, w: 420, h: 458 } : { x: 800, y: 150, w: 440, h: 444 };
  let codexTab = 0, codexPage = 0, codexSel = null, codexHits = [];
  const codexPer = () => CODEX_GRID.cols * CODEX_GRID.rows;
  function codexEntries(kind) {
    if (kind === 'relic') return R.RELICS.map((d) => ({ kind, id: d.id, name: d.name }));
    if (kind === 'upgrade') return R.UPGRADES.map((d) => ({ kind, id: d.id, name: d.name }));
    if (kind === 'oracle') return R.ORACLES.map((d) => ({ kind, id: d.id, name: d.name }));
    if (kind === 'die') return Object.keys(R.DIE_TYPES).map((id) => ({ kind, id, name: R.DIE_TYPES[id].name }));
    if (kind === 'boss') return R.BOSSES.concat([JONNY_BOSS, FATHER_BOSS]).map((b) => ({ kind, id: b.id, name: b.father && !codexData().boss[b.id] ? '???' : b.name }));
    if (kind === 'encounter') return Enc.LIST.map((d) => ({ kind, id: d.id, name: d.name }));
    if (kind === 'phone') return Phone.LIST.map((d) => ({ kind, id: d.id, name: d.name }))
      .concat(Tapes ? Tapes.LIST.map((t, i) => ({ kind: 'tape', id: t.id, name: Tapes.owned(meta())[t.id] ? t.title : 'Tape ' + (i + 1) })) : []);
    return CUPS.map((c) => ({ kind, id: c.id, name: c.name }));
  }
  // Wodurch etwas freigeschaltet wird (Achievement), sonst null
  function codexSource(e) {
    if (!ACH) return null;
    if (e.kind === 'relic' && R.RELIC_BY_ID[e.id].hidden) return ACH.SOURCE['relic:hybrid_seed'] || null;
    const key = (e.kind === 'cup' ? 'cupmode' : e.kind) + ':' + e.id;
    return ACH.LOCKED.has(key) ? ACH.SOURCE[key] : null;
  }
  function codexState(e) {
    if (e.kind === 'tape') return Tapes.owned(meta())[e.id] ? { state: 'owned', n: 1 } : { state: 'open', n: 0 };
    const n = codexData()[e.kind][e.id] || 0;
    if (n > 0 || (e.kind === 'cup' && e.id === 'classic' && meta().stats.runs > 0)) return { state: 'owned', n: Math.max(1, n) };
    const src = codexSource(e);
    if (src && !ACH.earned(meta(), src.id)) return { state: 'locked', n: 0, src };
    return { state: 'open', n: 0 };
  }
  // Kassette (16 x 16 Pixel)
  function tapeTile(c, x, y, size, on) {
    const k = size / 16, px = (i, j, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x + i * k), Math.round(y + j * k), Math.ceil(w * k), Math.ceil(h * k)); };
    UI.box(c, x, y, size, size, { colour: on ? '#3A2E4A' : '#2A3236', radius: 8, shadow: false, outline: on ? PHONE_COL : '#46525A', outlineWidth: 2 });
    px(2, 4, 12, 8, on ? '#D9C9A3' : '#55626A');
    px(3, 5, 10, 2, on ? '#C2453E' : '#46525A');
    px(5, 8, 6, 3, on ? '#6A5A4A' : '#3A464C');
    px(4, 8, 2, 2, '#1C2224'); px(10, 8, 2, 2, '#1C2224');
    px(4, 11, 8, 1, on ? '#A8987A' : '#46525A');
  }
  function codexIcon(c, e, x, y, size, state) {
    if (state === 'locked') { drawReward(c, '?', '?', x, y, size, false); return; }
    if (e.kind === 'relic' || e.kind === 'upgrade' || e.kind === 'oracle' || e.kind === 'die') drawReward(c, e.kind, e.id, x, y, size, false);
    else if (e.kind === 'cup') drawReward(c, 'cupmode', e.id, x, y, size, false);
    else if (e.kind === 'encounter') { c.save(); c.imageSmoothingEnabled = false; c.drawImage(EncArt.portrait(e.id), x, y, size, size); c.restore(); }
    else if (e.kind === 'phone') phoneTile(c, e.id, x, y, size);
    else if (e.kind === 'tape') tapeTile(c, x, y, size, state === 'owned');
    else {
      const b = FINAL_BOSSES[e.id] || R.BOSSES.find((q) => q.id === e.id);
      UI.box(c, x, y, size, size, { colour: b.colour, radius: 8, shadow: false, outline: lighten(b.colour, 0.35), outlineWidth: 2 });
      if (e.id === 'jonny' && TUT.head) { c.save(); c.imageSmoothingEnabled = false; c.drawImage(TUT.head('smug', false), x + 2, y + 2, size - 4, size - 4); c.restore(); }
      else UI.text(c, b.father ? (state === 'owned' ? 'F' : '?') : b.name.replace(/^The /, '')[0], x + size / 2, y + size / 2, { size: size * 0.55 });
    }
    if (state === 'open') { c.save(); c.fillStyle = 'rgba(24,30,34,0.62)'; UI.roundRect(c, x, y, size, size, 8); c.fill(); c.restore(); }
  }
  function openCodex() { clearMenuSprites(); codexData(); S.phase = 'codex'; codexPage = 0; codexSel = null; sfx('page'); }
  const codexPages = () => Math.max(1, Math.ceil(codexEntries(CODEX_TABS[codexTab].id).length / codexPer()));
  function codexInfo(e, st) {
    const lockedDesc = '???';
    if (e.kind === 'relic') {
      const d = R.RELIC_BY_ID[e.id], rar = R.RARITY[d.rarity];
      return { desc: st === 'locked' ? lockedDesc : d.desc, badge: [rar.name + ' Relic', rar.colour], tags: st === 'locked' ? [] : d.tags, extra: d.hidden ? 'Grows from a Hybrid Seed' : null };
    }
    if (e.kind === 'upgrade') { const d = R.UPGRADE_BY_ID[e.id]; return { desc: st === 'locked' ? lockedDesc : d.desc, badge: [R.RARITY[d.rarity].name + ' Upgrade', TYPE_COL.upgrade] }; }
    if (e.kind === 'oracle') { const d = R.ORACLE_BY_ID[e.id]; return { desc: st === 'locked' ? lockedDesc : d.desc, badge: ['Oracle', TYPE_COL.oracle] }; }
    if (e.kind === 'die') { const t = R.DIE_TYPES[e.id]; return { desc: st === 'locked' ? lockedDesc : 'Faces of this die:', faces: st === 'locked' ? null : (rewardDie[e.id] || (rewardDie[e.id] = R.makeDie(e.id))), badge: ['Die', TYPE_COL.die], extra: t.weight ? null : 'Only from the High Roller Cup' }; }
    if (e.kind === 'boss') {
      const b = FINAL_BOSSES[e.id] || R.BOSS_BY_ID[e.id];
      if (e.id === 'jonny') return { desc: 'The final boss of Stage 8. ' + (4 + b.hands) + ' hands and a huge target. He cheats: every hand he picks a new rule from the other bosses.', badge: ['Final boss', b.colour] };
      if (e.id === 'father') return st === 'owned'
        ? { desc: 'Waits in Endless Stage ' + R.BALANCE.FATHER_STAGE + '. ' + (4 + b.hands) + ' hands for two phases. Phase 1: half the target under one rule. Phase 2: extra points are lost and he picks a new rule at Elite strength.', badge: ['Final boss', b.colour], extra: 'The man on the phone' }
        : { desc: 'Somebody waits deep in Endless. Keep going.', badge: ['Final boss', b.colour] };
      const tier = R.TIER_BY_ID[b.tier], n = b.lv.length, met = !!codexData().elite[e.id];
      const extra = n === 1 ? 'No Elite version' : met ? 'Elite: ' + b.lv[1].desc + (n > 2 ? '  ·  Elite+: ' + b.lv[2].desc + ', bigger target' : '')
        : 'Has an Elite' + (n > 2 ? ' and an Elite+' : '') + ' version. Meet one to read it';
      return { desc: b.desc, badge: [tier.name + ' boss', tier.colour], extra };
    }
    if (e.kind === 'encounter') { const d = Enc.BY_ID[e.id]; return { desc: d.desc, badge: ['Encounter', d.colour], extra: d.who }; }
    if (e.kind === 'phone') { const d = Phone.BY_ID[e.id]; return { desc: d.text, badge: ['Phone call', PHONE_COL], extra: 'Offered on the phone after a Showdown. Stacks.' }; }
    if (e.kind === 'tape') {
      const tp = Tapes.BY_ID[e.id], badge = ['Voicemail ' + (Tapes.LIST.indexOf(tp) + 1) + ' / ' + Tapes.LIST.length, st === 'owned' ? PHONE_COL : '#46525A'];
      return st === 'owned' ? { desc: '"' + tp.text + '"', badge, extra: 'Left for Jonny by the man on the phone' } : { desc: 'Hint: ' + tp.hint, badge, extra: 'Somewhere, a tape is waiting' };
    }
    const c = CUP_BY_ID[e.id];
    return { desc: st === 'locked' ? lockedDesc : c.desc, badge: [CUP_WORD, c.colour], extra: c.id === 'classic' ? 'Always available' : c.jonny ? 'Always available once unlocked' : 'Win it in a Cup Draw (Stage ' + CUP_DRAW_STAGE + ' Showdown)' };
  }
  function drawCodex(back, front, t) {
    const tab = CODEX_TABS[codexTab], list = codexEntries(tab.id), per = codexPer();
    UI.dynaText(front, 'Codex', 640, 44, { size: 48, time: t, wave: 2.5, colour: P.GOLD });
    for (const b of CODEX_TAB_BTNS) UI.button(front, b, t);
    const states = list.map((e) => codexState(e));
    const own = states.filter((q) => q.state === 'owned').length, opn = states.filter((q) => q.state !== 'locked').length;
    const G = CODEX_GRID, P0 = CODEX_PANEL;
    UI.text(front, tab.label + ': ' + own + ' collected  ·  ' + opn + ' unlocked  ·  ' + list.length + ' total  ·  Page ' + (codexPage + 1) + ' / ' + codexPages(), G.x + (G.cols * (G.size + G.gap) - G.gap) / 2, G.y - 16, { size: MOBILE ? 19 : 16, colour: P.TEXT_SOFT });
    codexHits = [];
    let hover = null;
    list.slice(codexPage * per, (codexPage + 1) * per).forEach((e, k) => {
      const x = G.x + (k % G.cols) * (G.size + G.gap), y = G.y + Math.floor(k / G.cols) * (G.size + G.gap), q = states[codexPage * per + k];
      const r = { x, y, w: G.size, h: G.size }, on = !MOBILE && UI.inside(r, eng.mouse), sel = codexSel && codexSel.kind === e.kind && codexSel.id === e.id;
      codexIcon(front, e, x, y, G.size, q.state);
      if (sel || on) { front.save(); front.lineWidth = 3; front.strokeStyle = sel ? P.GOLD : lighten(P.PANEL, 0.5); UI.roundRect(front, x - 3, y - 3, G.size + 6, G.size + 6, 10); front.stroke(); front.restore(); }
      if (q.state === 'owned' && q.n > 1 && e.kind !== 'cup') UI.text(front, 'x' + q.n, x + G.size - 4, y + G.size - 8, { size: 13, colour: P.GOLD, align: 'right' });
      codexHits.push({ r, e });
      if (on) hover = e;
    });
    // Rechts: Details zum gezeigten Eintrag
    const e = hover || codexSel || list[codexPage * per];
    UI.box(back, P0.x, P0.y, P0.w, P0.h, { colour: P.OVERLAY_SOLID, radius: 14, emboss: 4, outline: lighten(P.PANEL, 0.2), outlineWidth: 2 });
    if (e) drawCodexDetail(front, e, P0, t);
    for (const b of [B.pagePrev, B.pageNext, B.back]) UI.button(front, b, t);
  }
  function drawCodexDetail(c, e, P0, t) {
    const q = codexState(e), inf = codexInfo(e, q.state), cx = P0.x + P0.w / 2, k = MOBILE ? 1.2 : 1;
    let y = P0.y + 14;
    codexIcon(c, e, cx - 48, y, 96, q.state);
    y += 120;
    UI.text(c, e.name, cx, y, { size: fitText(c, e.name, P0.w - (MOBILE ? 30 : 60), 28 * k), colour: q.state === 'locked' ? P.TEXT_SOFT : P.WHITE });
    y += 32 * k;
    c.font = UI.font(17 * k);
    const bw = c.measureText(inf.badge[0]).width + 28;
    UI.box(c, cx - bw / 2, y - 12, bw, 24 * k, { colour: inf.badge[1], radius: 12, emboss: 2 });
    UI.text(c, inf.badge[0], cx, y + (k - 1) * 12, { size: 17 * k });
    y += 30 * k;
    if (inf.tags && inf.tags.length) { tagChips(c, inf.tags.map((tg) => ({ tag: tg, label: R.TAGS[tg].name, colour: darken(TAG_COL(tg), 0.1) })), cx, y + 2, 14); y += 30; }
    // Beschreibung in einem weißen Feld (Zahlen eingefärbt)
    const ins = MOBILE ? 16 : 26, lines = wrapText(c, inf.desc, P0.w - 2 * ins - (MOBILE ? 28 : 20), 18 * k), boxH = lines.length * 22 * k + 16 + (inf.faces ? 36 : 0);
    UI.box(c, P0.x + ins, y, P0.w - 2 * ins, boxH, { colour: '#FFFFFF', radius: 8, shadow: false });
    lines.forEach((ln, i) => drawLine(c, ln, cx, y + 18 * k + i * 22 * k, 18 * k, false));
    if (inf.faces) drawFaces(c, inf.faces, cx, y + lines.length * 22 * k + 26, -1);
    y += boxH + 22;
    if (inf.extra) { UI.text(c, inf.extra, cx, y, { size: fitText(c, inf.extra, P0.w - 30, 15 * k), colour: P.TEXT_HINT }); y += 24 * k; }
    // Stand
    const status = e.kind === 'tape' ? (q.state === 'owned' ? 'Found' : 'Not found yet') : q.state === 'owned' ? (e.kind === 'boss' || e.kind === 'encounter' ? 'Met ' : e.kind === 'cup' ? 'Played ' : e.kind === 'phone' ? 'Taken ' : 'Collected ') + q.n + (q.n === 1 ? ' time' : ' times')
      : q.state === 'open' ? (e.kind === 'boss' || e.kind === 'encounter' ? 'Not met yet' : e.kind === 'cup' ? 'Not played yet' : e.kind === 'phone' ? 'Not taken yet' : 'Unlocked. Get it once to fill this page.') : 'Locked';
    UI.text(c, status, cx, y, { size: 18 * k, colour: q.state === 'owned' ? P.GOLD : q.state === 'open' ? P.TEXT_LABEL : lighten(P.PURPLE, 0.35) });
    y += 28 * k;
    if (q.state === 'locked' && q.src) {
      const a = q.src;
      UI.text(c, 'Unlock: ' + a.name, cx, y, { size: fitText(c, 'Unlock: ' + a.name, P0.w - 30, 18 * k), colour: P.GOLD });
      y += 22 * k;
      wrapPlain(c, a.desc, P0.w - 50, 16 * k).slice(0, 2).forEach((ln, i) => UI.text(c, ln, cx, y + i * 20 * k, { size: 16 * k, colour: P.TEXT_SOFT }));
      y += 44 * k;
      const pr = ACH.progress(meta(), a);
      if (pr && y < P0.y + P0.h - (MOBILE ? 14 : 34)) {
        const bw2 = P0.w - 120, kk = pr.n / pr.goal;
        UI.box(c, cx - bw2 / 2, y - 6, bw2, 12, { colour: P.PANEL_DARK, radius: 6, shadow: false });
        if (kk > 0) UI.box(c, cx - bw2 / 2, y - 6, Math.max(12, bw2 * kk), 12, { colour: P.GOLD, radius: 6, shadow: false });
        UI.text(c, UI.num(pr.n) + ' / ' + UI.num(pr.goal), cx, y + 20, { size: 15, colour: P.TEXT_SOFT });
      }
    }
  }
  function codexClick(m) {
    const tab = CODEX_TAB_BTNS.find((b) => UI.inside(b, m));
    if (tab) return false;
    const h = codexHits.find((q) => UI.inside(q.r, m));
    if (!h) return false;
    if (codexState(h.e).state === 'locked') eggLockedClick(m);
    codexSel = h.e; sfx('card');
    return true;
  }
  function turnCodexPage(dir) {
    const n = clamp(codexPage + dir, 0, codexPages() - 1);
    if (n !== codexPage) { codexPage = n; sfx('page'); }
  }

  // ── Auswertung am Ende und Laufhistorie ─────────────────────────────────────
  // Ein Eintrag beschreibt einen ganzen Run (Statistik, Build am Ende, Hände, Achievements). Die Auswertung am Ende
  // und die Historie im Hauptmenü zeichnen denselben Eintrag. meta().history: neueste zuerst, höchstens HISTORY_MAX.
  const HISTORY_MAX = 30;
  let lastRecord = null;
  const history = () => meta().history || [];
  function buildRecord(won) {
    const st = Object.assign({}, S.stats || freshStats());
    delete st.said;
    const finished = won && !S.endless;
    return {
      v: 1, id: S.runId || Date.now(), date: Date.now(), won: !!won, endless: !!S.endless, cup: S.cup,
      stage: S.endless ? S.ante : Math.min(S.ante, ANTES), where: finished ? 'All stages cleared' : blindLabel().name,
      time: Math.round(S.time), score: S.score, target: S.target, stats: st, jobs: S.jonny ? S.jonny.jobs : 0,
      relics: S.relics.map((r) => r.id), upgrades: S.upgrades.slice(),
      cons: S.cons.map((c) => ({ type: c.type, id: c.id, hand: c.hand, n: c.n })),
      bag: S.bag.map((d) => ({ t: d.type, f: d.faces.map((f) => [f.v, f.kind]) })),
      hands: Object.assign({}, S.handCounts), levels: Object.assign({}, S.levels), tags: R.tagCounts(S.relics), ach: (S.runAch || []).slice(),
      replay: S.bestReplay || null, phone: S.phone ? Object.assign({}, S.phone.owned) : {},
    };
  }
  function recordHistory(won) {
    const rec = buildRecord(won);
    lastRecord = rec;
    if (!profile || TUT.active) return rec;
    const m = meta();
    if (!m.history) m.history = [];
    const k = m.history.findIndex((x) => x.id === rec.id);
    if (k >= 0) m.history.splice(k, 1);
    m.history.unshift(rec);
    if (m.history.length > HISTORY_MAX) m.history.length = HISTORY_MAX;
    return rec;
  }
  function openSummary() {
    if (!['lost', 'runWon'].includes(S.phase) || S.summary) return;
    S.summary = lastRecord || buildRecord(S.phase === 'runWon');
    S.summary.t0 = eng.time;
    S.msg = null;
    sfx('page');
  }
  const recStage = (rec) => (rec.won && !rec.endless ? 'All ' + ANTES + ' stages cleared' : (rec.endless ? 'Endless stage ' + rec.stage : 'Stage ' + rec.stage + ' / ' + ANTES) + '  ·  ' + rec.where);
  const recTitle = (rec, live) => (rec.endless ? (live ? 'Endless run over' : 'Endless run') : rec.won ? 'Run complete!' : 'Game Over');
  const recColour = (rec) => (rec.endless ? lighten(P.PURPLE, 0.3) : rec.won ? P.GOLD : P.RED);
  function recStatRows(rec) {
    const st = Object.assign(freshStats(), rec.stats || {}), $ = (v) => '$' + UI.num(v || 0);
    return [
      ['Rounds won', st.rounds], ['Showdowns won', st.bosses], ['Hands played', st.hands],
      ['Best hand', st.best ? UI.num(st.best) + (st.bestName ? '  ·  ' + st.bestName : '') : '-'], ['Total score', UI.num(st.total)],
      ['Rerolls', st.rerolls], ['Lucky Hits', st.lucky], ['Busts', st.busts], ['Links', st.links], ['Longest chain', st.chain || '-'],
      ['Shifts', st.shifts], ['Peak heat', st.heat ? '+' + st.heat + '%' : '-'], ['Money earned', $(st.earned)], ['Money spent', $(st.spent)], ['Most money at once', $(st.maxMoney)],
      ["Jonny's jobs done", rec.jobs || 0], ['Items bought', st.bought],
    ];
  }
  // Infos ohne laufenden Run (Auswertung, Historie, Codex)
  function plainInfo(kind, id, extra) {
    if (kind === 'relic') {
      const d = R.RELIC_BY_ID[id], rar = R.RARITY[d.rarity];
      return { title: d.name, desc: d.desc, badge: [rar.name + ' Relic', rar.colour], tags: d.tags.map((tg) => ({ tag: tg, label: R.TAGS[tg].name, colour: darken(TAG_COL(tg), 0.1) })) };
    }
    if (kind === 'upgrade') { const d = R.UPGRADE_BY_ID[id]; return { title: d.name, desc: d.desc, badge: [R.RARITY[d.rarity].name + ' Upgrade', TYPE_COL.upgrade] }; }
    if (kind === 'oracle') { const d = R.ORACLE_BY_ID[id]; return { title: d.name, desc: d.desc, badge: ['Oracle', TYPE_COL.oracle] }; }
    if (kind === 'constellation') { const h = R.HANDS[id]; return { title: h.star, desc: 'Level up ' + id + ': +' + h.level[0] + ' Pips and +' + h.level[1] + ' Power', badge: ['Constellation', TYPE_COL.constellation] }; }
    if (kind === 'tally') return { title: 'Tally of ' + R.NUMBER_NAMES[id], desc: 'Level up ' + id + 's: each scored ' + id + ' gives +4 Pips and +1 Power more', badge: ['Tally', TYPE_COL.tally] };
    if (kind === 'die') return { title: R.DIE_TYPES[extra.type].name, desc: 'Faces of this die:', faces: extra, badge: ['Die', TYPE_COL.die] };
    if (kind === 'phone') { const d = Phone.BY_ID[id]; return d ? { title: d.name, desc: d.text, badge: ['Phone call', PHONE_COL] } : null; }
    if (kind === 'ach') { const a = ACH.BY_ID[id]; return { title: a.name, desc: a.desc, badge: [a.secret ? 'Secret achievement' : 'Achievement', a.secret ? P.PURPLE : darken(P.GOLD, 0.2)] }; }
    return null;
  }
  let sumHits = [];
  const SUM = { x: 40, y: 14, w: 1200, h: MOBILE ? 548 : 576 }, SUM_BTN = MOBILE ? 60 : 76;   // PC: Knöpfe mit Abstand zum unteren Rand
  // Zeichnet einen Run. live: Auswertung direkt am Ende (sonst aus der Historie)
  function drawRunCard(back, front, t, rec, live) {
    const { x, y, w, h } = SUM, accent = recColour(rec), cupD = CUP_BY_ID[rec.cup] || CUPS[0], k = MOBILE ? 1.15 : 1;
    sumHits = [];
    if (live) dim(front, 0.4);   // vorne, damit Knöpfe und Texte des Spielfelds nicht durchscheinen
    const pop = live ? FX.Ease.outCubic(Math.min(1, (eng.time - (rec.t0 || 0)) * 3)) : 1;
    back.save(); front.save();
    if (pop < 1) for (const c of [back, front]) { c.translate(640, 290); c.scale(0.92 + 0.08 * pop, 0.92 + 0.08 * pop); c.translate(-640, -290); c.globalAlpha = pop; }
    UI.box(front, x, y, w, h, { colour: P.OVERLAY_SOLID, radius: 18, emboss: 4, outline: accent, outlineWidth: 3 });
    UI.dynaText(front, recTitle(rec, live), x + w / 2, y + 38, { size: 44, colour: accent, time: t, wave: 2.5 });
    const sub = cupD.name + '  ·  ' + recStage(rec) + '  ·  ' + fmtTime(rec.time || 0) + '  ·  ' + fmtDate(rec.date);
    UI.text(front, sub, x + w / 2, y + 76, { size: fitText(front, sub, w - 60, 17 * k), colour: P.TEXT_SOFT });
    const col = (cx, title, cw) => { UI.box(front, cx, y + 96, cw, MOBILE ? 384 : 392, { colour: P.PANEL_DARK, radius: 12, shadow: false }); UI.text(front, title, cx + cw / 2, y + 114, { size: 18 * k, colour: P.TEXT_LABEL }); };
    // Spalte 1: Zahlen
    const c1 = x + 16;
    col(c1, 'Stats', 372);
    recStatRows(rec).forEach(([a, b], i) => {
      const ry = y + 140 + i * (MOBILE ? 20.4 : 20.5);   // Handy: 17 Zeilen müssen über die Knopfreihe passen
      UI.text(front, a, c1 + 14, ry, { size: 15 * k, colour: P.TEXT_LABEL, align: 'left' });
      const val = String(b);
      UI.text(front, val, c1 + 358, ry, { size: fitText(front, val, 190, 16 * k), align: 'right', colour: a === 'Best hand' ? P.GOLD : P.WHITE });
    });
    // Spalte 2: Build am Ende
    const c2 = x + 404, cw2 = 392;
    col(c2, 'Build at the end', cw2);
    let yy = y + 134;
    const label = (txt) => { UI.text(front, txt, c2 + 14, yy + 8, { size: 15 * k, colour: P.TEXT_DIM, align: 'left' }); yy += 20; };
    label('Relics');
    if (!rec.relics.length) { UI.text(front, 'none', c2 + cw2 / 2, yy + 24, { size: 15, colour: P.TEXT_FAINT }); }
    rec.relics.slice(0, 7).forEach((id, i) => {
      if (!R.RELIC_BY_ID[id]) return;
      const r = { x: c2 + 14 + i * 53, y: yy, w: 48, h: 48 };
      drawReward(front, 'relic', id, r.x, r.y, r.w, false);
      sumHits.push({ r, info: plainInfo('relic', id) });
    });
    yy += 56;
    const tl = R.TAG_ORDER.filter((tg) => (rec.tags || {})[tg] > 0).map((tg) => ({ tag: tg, label: String(rec.tags[tg]), colour: rec.tags[tg] >= 3 ? TAG_COL(tg) : P.CHIP_OFF, outline: rec.tags[tg] >= 5 ? P.GOLD : undefined }));
    if (tl.length) { tagChips(front, tl.slice(0, 7), c2 + cw2 / 2, yy + 8, 13); yy += 24; }
    label('Upgrades');
    if (!rec.upgrades.length) UI.text(front, 'none', c2 + cw2 / 2, yy + 12, { size: 15, colour: P.TEXT_FAINT });
    rec.upgrades.slice(0, 10).forEach((id, i) => {
      if (!R.UPGRADE_BY_ID[id]) return;
      const r = { x: c2 + 14 + i * 37, y: yy - 4, w: 34, h: 34 };
      front.save(); front.imageSmoothingEnabled = false; front.drawImage(upgradeCanvas(id), r.x, r.y, r.w, r.h); front.restore();
      sumHits.push({ r, info: plainInfo('upgrade', id) });
    });
    yy += 38;
    label('Consumables');
    if (!rec.cons.length) UI.text(front, 'none', c2 + cw2 / 2, yy + 12, { size: 15, colour: P.TEXT_FAINT });
    rec.cons.forEach((cn, i) => {
      const r = { x: c2 + 14 + i * 40, y: yy - 4, w: 34, h: 34 };
      if (cn.type === 'oracle') { drawReward(front, 'oracle', cn.id, r.x, r.y, r.w, false); sumHits.push({ r, info: plainInfo('oracle', cn.id) }); }
      else if (cn.type === 'constellation') { UI.box(front, r.x, r.y, r.w, r.h, { colour: TYPE_COL.constellation, radius: 6, shadow: false }); Icons.draw(front, 'star:' + cn.hand, r.x + 17, r.y + 17, 28); sumHits.push({ r, info: plainInfo('constellation', cn.hand) }); }
      else { UI.box(front, r.x, r.y, r.w, r.h, { colour: TYPE_COL.tally, radius: 6, shadow: false }); front.drawImage(faceEntry({ v: cn.n, kind: 'normal' }, 'standard').canvas, r.x + 5, r.y + 5, 24, 24); sumHits.push({ r, info: plainInfo('tally', cn.n) }); }
    });
    yy += 38;
    label('Bag (' + rec.bag.length + ' dice)');
    rec.bag.slice(0, 24).forEach((d, i) => {
      if (!R.DIE_TYPES[d.t]) return;
      const die = { type: d.t, faces: d.f.map(([v, kind]) => ({ v, kind })) }, f = bagFace(die);
      const r = { x: c2 + 14 + (i % 12) * 31, y: yy - 2 + Math.floor(i / 12) * 31, w: 28, h: 28 };
      front.save(); front.imageSmoothingEnabled = false; front.drawImage(faceEntry(f, d.t).canvas, r.x, r.y, r.w, r.h); front.restore();
      sumHits.push({ r, info: plainInfo('die', null, die) });
    });
    // Telefon: genommene Vorteile (ältere Einträge haben keine)
    const ph = Object.keys(rec.phone || {}).filter((id) => Phone.BY_ID[id] && rec.phone[id] > 0);
    if (ph.length) {
      const py = yy + Math.ceil(Math.min(24, rec.bag.length) / 12) * 31 + 2;
      UI.text(front, 'Phone', c2 + 14, py + 12, { size: 15 * k, colour: P.TEXT_DIM, align: 'left' });
      ph.slice(0, 11).forEach((id, i) => {
        const r = { x: c2 + 70 + i * (MOBILE ? 29 : 28), y: py, w: 25, h: 25 };
        phoneTile(front, id, r.x, r.y, r.w);
        if (rec.phone[id] > 1) UI.text(front, 'x' + rec.phone[id], r.x + r.w, r.y + r.h - 2, { size: 11, colour: P.GOLD, align: 'right' });
        sumHits.push({ r, info: plainInfo('phone', id) });
      });
    }
    // Spalte 3: Hände und Achievements
    const c3 = x + 812, cw3 = 372;
    col(c3, 'Hands played', cw3);
    const counts = rec.hands || {}, maxC = Math.max(1, ...Object.values(counts));
    R.HAND_ORDER.forEach((n, i) => {
      const ry = y + 138 + i * 22, cnt = counts[n] || 0, lv = (rec.levels || {})[n] || 1;
      if (cnt) UI.box(front, c3 + 150, ry - 8, Math.max(6, 150 * (cnt / maxC)), 16, { colour: darken(P.PLANET, 0.15), radius: 5, shadow: false });
      UI.text(front, n, c3 + 14, ry, { size: 14 * k, colour: cnt ? P.WHITE : P.TEXT_FAINT, align: 'left' });
      UI.text(front, String(cnt), c3 + 312, ry, { size: 15, colour: cnt ? P.WHITE : P.TEXT_FAINT, align: 'right' });
      UI.text(front, 'Lv ' + lv, c3 + 358, ry, { size: 13, colour: lv > 1 ? P.PLANET : P.TEXT_FAINT, align: 'right' });
    });
    const ay = y + 348;
    UI.text(front, 'Unlocked this run', c3 + cw3 / 2, ay, { size: 16 * k, colour: P.TEXT_LABEL });
    const achs = (rec.ach || []).map((id) => ACH && ACH.BY_ID[id]).filter(Boolean);
    if (!achs.length) UI.text(front, 'No new achievements', c3 + cw3 / 2, ay + 30, { size: 15, colour: P.TEXT_FAINT });
    achs.slice(0, 4).forEach((a, i) => {
      const ry = ay + 24 + i * 24, acc = a.secret ? lighten(P.PURPLE, 0.25) : P.GOLD;
      drawTrophy(front, c3 + 16, ry - 8, 2, acc);
      UI.text(front, a.name, c3 + 42, ry, { size: fitText(front, a.name, cw3 - 60, 15), colour: acc, align: 'left' });
      sumHits.push({ r: { x: c3 + 10, y: ry - 11, w: cw3 - 20, h: 22 }, info: plainInfo('ach', a.id) });
    });
    if (achs.length > 4) UI.text(front, '+' + (achs.length - 4) + ' more', c3 + cw3 - 14, ay + 24 + 4 * 24 - 4, { size: 14, colour: P.TEXT_SOFT, align: 'right' });
    back.restore(); front.restore();
    const btns = live ? summaryButtons() : [B.back, B.share, ...(gifOf(rec) ? [B.gif] : [])];
    for (const b of btns) UI.button(front, b, t);
    if (pop < 1) return;
    if (!MOBILE) {
      const hit = sumHits.find((q) => UI.inside(q.r, eng.mouse));
      if (hit && hit.info) { const sz = panelSize(front, hit.info), pos = placeBelow(hit.r, sz); drawPanel(front, hit.info, sz, pos.x, pos.y, false, -1); }
    } else drawTipsTouch(front);
  }
  // Knöpfe der Auswertung (Reihe unten im Fenster, zentriert)
  function summaryButtons() {
    const rec = S.summary;
    if (!rec) return [];
    return [B.home, B.share, ...(gifOf(rec) ? [B.gif] : []), B.retry].concat(rec.won && !rec.endless && S.phase === 'runWon' && !TUT.active ? [B.endless] : []).filter((b) => b !== B.home || profile);
  }
  function placeRow(list, y, h = 50) {
    const gap = 16, total = list.reduce((a, b) => a + b.w, 0) + gap * (list.length - 1);
    let x = 640 - total / 2;
    for (const b of list) { b.x = x; b.y = y; b.h = h; x += b.w + gap; }
  }
  const upgradeCanvas = (id) => {
    const k = 'upc:' + id;
    if (!upgradeCanvas[k]) {
      const c = Art.canvas(34, 34)[0], g = c.getContext('2d');
      Art.pixelRect(g, 0, 0, 34, 34, darken(TYPE_COL.upgrade, 0.35), [3, 1]);
      Art.pixelRect(g, 1, 1, 32, 31, TYPE_COL.upgrade, [2, 1]);
      Icons.draw(g, id, 17, 17, 28);
      upgradeCanvas[k] = c;
    }
    return upgradeCanvas[k];
  };

  // Historie im Hauptmenü: Liste, ein Klick zeigt den ganzen Run
  let histPage = 0, histSel = -1, histRows = [];
  const HIST_PER = 6;
  const histPages = () => Math.max(1, Math.ceil(history().length / HIST_PER));
  function openHistory() { clearMenuSprites(); S.phase = 'history'; histPage = 0; histSel = -1; tips = []; sfx('page'); }
  function drawHistory(back, front, t) {
    const list = history();
    if (histSel >= 0 && list[histSel]) { drawRunCard(back, front, t, list[histSel], false); return; }
    histSel = -1;
    UI.dynaText(front, 'Run History', 640, 52, { size: 50, time: t, wave: 2.5, colour: P.GOLD });
    const st = meta().stats;
    const line = 'Runs ' + st.runs + '  ·  Won ' + st.wins + '  ·  Best stage ' + (st.bestStage ? st.bestStage + ' / ' + ANTES : '-') + (st.bestEndless ? '  ·  Best endless stage ' + st.bestEndless : '') + '  ·  Showing the last ' + Math.min(list.length, HISTORY_MAX) + ' runs';
    UI.text(front, line, 640, 92, { size: fitText(front, line, 1180, 17), colour: P.TEXT_SOFT });
    histRows = [];
    if (!list.length) {
      UI.text(front, 'No runs yet. Finish a run and it shows up here.', 640, 320, { size: 22, colour: P.TEXT_LABEL });
      if (TUT.portrait) TUT.portrait(front, 640 - 48, 360, 1.5, 'bored', t);
    }
    list.slice(histPage * HIST_PER, (histPage + 1) * HIST_PER).forEach((rec, k) => {
      const i = histPage * HIST_PER + k, x = 60, y = 118 + k * 80, w = 1160, hh = 70, r = { x, y, w, h: hh };
      const hover = UI.inside(r, eng.mouse) && !MOBILE, accent = recColour(rec), cupD = CUP_BY_ID[rec.cup] || CUPS[0], st2 = rec.stats || {};
      UI.box(back, x, y, w, hh, { colour: P.OVERLAY_SOLID, radius: 12, emboss: 3, outline: hover ? P.GOLD : lighten(P.PANEL, 0.12), outlineWidth: hover ? 3 : 1 });
      // Ergebnis
      UI.box(front, x + 12, y + 12, 112, 46, { colour: darken(accent, 0.45), radius: 10, shadow: false, outline: accent, outlineWidth: 2 });
      UI.text(front, rec.endless ? 'ENDLESS' : rec.won ? 'WON' : 'LOST', x + 68, y + 28, { size: 18, colour: accent });
      UI.text(front, rec.endless ? 'Stage ' + rec.stage : rec.won ? '8 / 8' : 'Stage ' + rec.stage, x + 68, y + 47, { size: 14, colour: P.TEXT_SOFT });
      // Becher, Datum, wo
      front.save(); front.imageSmoothingEnabled = false; front.drawImage(cupTexCanvas(cupD), x + 140, y + 9, 39, 52); front.restore();
      UI.text(front, cupD.name, x + 194, y + 24, { size: 19, align: 'left' });
      UI.text(front, fmtDate(rec.date) + '  ·  ' + fmtTime(rec.time || 0), x + 194, y + 48, { size: 14, colour: P.TEXT_DIM, align: 'left' });
      const where = rec.won && !rec.endless ? 'All stages cleared' : rec.where;
      UI.text(front, where, x + 520, y + 24, { size: fitText(front, where, 220, 17), colour: P.TEXT_LABEL });
      UI.text(front, 'Best hand ' + (st2.best ? UI.num(st2.best) : '-'), x + 520, y + 48, { size: 15, colour: P.GOLD });
      // Relikte
      rec.relics.slice(0, 6).forEach((id, j) => { if (R.RELIC_BY_ID[id]) drawReward(front, 'relic', id, x + 660 + j * 46, y + 14, 42, false); });
      UI.text(front, 'Details >', x + w - 18, y + hh / 2, { size: 16, colour: hover ? P.GOLD : P.TEXT_DIM, align: 'right' });
      histRows.push({ r, i });
    });
    for (const b of [B.pagePrev, B.pageNext, B.back]) UI.button(front, b, t);
  }
  const cupTexCanvas = (c) => rewardModeCups[c.id] || (rewardModeCups[c.id] = cupCanvas(c.colour, false, c.id));
  function historyClick(m) {
    if (histSel >= 0) {
      if (MOBILE) { const h = sumHits.find((q) => UI.inside(q.r, m)); if (h && h.info) { openTip({ key: 'sum:' + h.r.x + ':' + h.r.y, anchor: h.r, info: h.info }); return true; } tips = []; }
      return false;
    }
    const row = histRows.find((q) => UI.inside(q.r, m));
    if (!row) return false;
    histSel = row.i; tips = []; sfx('page');
    return true;
  }
  function turnHistoryPage(dir) {
    const n = clamp(histPage + dir, 0, histPages() - 1);
    if (n !== histPage) { histPage = n; sfx('page'); }
  }

  // ── Run als Bild teilen (PNG 1200 x 630) ───────────────────────────────────
  function runImage(rec) {
    const W = 1200, H = 630, c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d'), accent = recColour(rec), cupD = CUP_BY_ID[rec.cup] || CUPS[0], st = Object.assign(freshStats(), rec.stats || {});
    g.imageSmoothingEnabled = false;
    // Filz mit leichtem Karomuster
    g.fillStyle = darken(P.PANEL_DARK || '#1E2B2D', 0.25); g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,0.025)';
    for (let yy = 0; yy < H; yy += 24) for (let xx = (yy / 24) % 2 ? 0 : 24; xx < W; xx += 48) g.fillRect(xx, yy, 24, 24);
    UI.box(g, 24, 24, W - 48, H - 48, { colour: 'rgba(0,0,0,0.25)', radius: 22, shadow: false, outline: accent, outlineWidth: 4 });
    // Logo
    const logo = 'ALEATOR', cols = [P.RED, P.BLUE, P.MONEY, P.GREEN];
    g.font = UI.font(56);
    let lx = 60;
    [...logo].forEach((ch, i) => { UI.text(g, ch, lx, 78, { size: 56, colour: cols[i % cols.length], align: 'left' }); g.font = UI.font(56); lx += g.measureText(ch).width; });
    UI.text(g, 'a dice roguelite', 62, 120, { size: 22, colour: P.TEXT_SOFT, align: 'left' });
    // Ergebnis
    UI.text(g, recTitle(rec, false).toUpperCase(), W - 60, 78, { size: 48, colour: accent, align: 'right' });
    UI.text(g, cupD.name + '  ·  ' + recStage(rec), W - 60, 120, { size: 20, colour: P.TEXT_SOFT, align: 'right' });
    // Große Zahlen
    const tiles = [['Stage', rec.endless ? String(rec.stage) : rec.stage + ' / ' + ANTES], ['Best hand', st.best ? UI.num(st.best) : '-'], ['Total score', UI.num(st.total)], ['Run time', fmtTime(rec.time || 0)]];
    tiles.forEach(([a, b], i) => {
      const x = 60 + i * 272, y = 150;
      UI.box(g, x, y, 256, 96, { colour: P.PANEL, radius: 14, emboss: 4 });
      UI.text(g, a, x + 128, y + 22, { size: 18, colour: P.TEXT_LABEL });
      UI.text(g, b, x + 128, y + 62, { size: fitText(g, b, 236, 36), colour: i === 1 ? P.GOLD : P.WHITE });
    });
    if (st.bestName) UI.text(g, st.bestName, 60 + 272 + 128, 262, { size: 16, colour: P.TEXT_SOFT });
    // Relikte
    UI.text(g, 'Relics', 60, 300, { size: 20, colour: P.TEXT_LABEL, align: 'left' });
    if (!rec.relics.length) UI.text(g, 'None. Pure skill.', 60, 344, { size: 20, colour: P.TEXT_DIM, align: 'left' });
    rec.relics.slice(0, 7).forEach((id, i) => {
      const d = R.RELIC_BY_ID[id];
      if (!d) return;
      drawReward(g, 'relic', id, 60 + i * 104, 318, 84, false);
      UI.text(g, d.name, 60 + i * 104 + 42, 418, { size: fitText(g, d.name, 98, 14), colour: P.TEXT_SOFT });
    });
    // Upgrades und Zahlen unten links
    rec.upgrades.slice(0, 10).forEach((id, i) => { if (R.UPGRADE_BY_ID[id]) g.drawImage(upgradeCanvas(id), 60 + i * 46, 446, 40, 40); });
    const facts = [['Hands', st.hands], ['Rerolls', st.rerolls], ['Lucky Hits', st.lucky], ['Links', st.links], ['Busts', st.busts], ['$ earned', UI.num(st.earned)]];
    facts.forEach(([a, b], i) => {
      const x = 60 + i * 124;
      UI.text(g, String(b), x, 524, { size: 30, align: 'left' });
      UI.text(g, a, x, 556, { size: 16, colour: P.TEXT_DIM, align: 'left' });
    });
    // Jonny mit Urteil
    const verdict = rec.endless ? 'Stage ' + rec.stage + '?! Go to bed.' : rec.won ? 'You beat me. Fine. FINE.' : rec.stage >= 6 ? 'So close! I was sweating.' : rec.stage >= 3 ? 'Not bad. For a newbie.' : 'We do not talk about this run.';
    if (TUT.head) g.drawImage(TUT.head(rec.won ? 'shocked' : 'smug', false), W - 230, 412, 160, 160);
    g.font = UI.font(18);
    const vw = g.measureText(verdict).width + 34;
    UI.box(g, W - 250 - vw, 430, vw, 44, { colour: '#FFFFFF', radius: 12 });
    UI.text(g, verdict, W - 250 - vw / 2, 452, { size: 18, colour: P.BLACK, shadow: false });
    UI.text(g, fmtDate(rec.date) + '  ·  miwale.com/games/aleator', W - 60, 590, { size: 15, colour: P.TEXT_DIM, align: 'right' });
    return c;
  }
  function shareRecord(rec) {
    if (!rec) return;
    let c;
    try { c = runImage(rec); } catch (e) { denied(B.share.x + B.share.w / 2, B.share.y - 20, 'Could not draw the image'); return; }
    sfx('coin');
    const name = 'aleator-run-' + new Date(rec.date).toISOString().slice(0, 10) + '.png';
    const note = (text) => eng.popup(B.share.x + B.share.w / 2, B.share.y - 22, text, { colour: P.GOLD, size: 20, life: 1.8 });
    c.toBlob((blob) => {
      if (!blob) return;
      const file = typeof File !== 'undefined' ? new File([blob], name, { type: 'image/png' }) : null;
      if (MOBILE && file && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: 'Aleator', text: 'My Aleator run: ' + recStage(rec) }).catch(() => {});
        return;
      }
      let copied = false;
      try {
        if (navigator.clipboard && window.ClipboardItem) navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(() => { copied = true; note('Image copied and saved!'); }).catch(() => {});
      } catch (e) { /* kein Zugriff auf die Zwischenablage */ }
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setTimeout(() => { if (!copied) note('Image saved!'); }, 250);
    }, 'image/png');
  }

  // ── Pause (Esc / Settings im Run): Statistik und Regeln des Runs links neben den Einstellungen ──
  function runPanelData() {
    const st = S.stats || freshStats(), ii = R.interestInfo(ctx());
    return {
      stats: [
        ['Run time', fmtTime(S.time)], ['Rounds won', st.rounds], ['Hands played', st.hands],
        ['Best hand', st.best ? UI.num(st.best) : '-'], ['Total score', UI.num(st.total)], ['Rerolls', st.rerolls],
        ['Lucky Hits', st.lucky], ['Busts', st.busts], ['Links', st.links], ['Shifts', st.shifts],
        ['Money earned', '$' + st.earned], ['Money spent', '$' + st.spent], ["Jonny's jobs", S.jonny ? S.jonny.jobs : 0],
      ],
      rules: [
        ['Hands per round', handsMax()], ['Rerolls per hand', rerollsMax()], ['Shifts per hand', shiftsMax()], ...(S.enc && S.enc.prophecy ? [['Prophecy', S.enc.prophecy.hand + ' x' + S.enc.prophecy.left]] : []),
        ['Dice per hand', drawCount() + ' of ' + S.bag.length], ['Luck', luck() + '%'], ['Bust at', bustAt() + ' Skulls'],
        ['Interest cap', '$' + ii.cap], ['Anchors', anchorCap()], ['Relic slots', S.relics.length + ' / ' + relicMax()],
      ],
    };
  }
  const stageBox = () => (S.endless ? ['Endless', String(S.ante)] : ['Stage', Math.min(S.ante, ANTES) + '/' + ANTES]);
  function runWhere() {
    if (S.phase === 'shop') return 'Shop before ' + blindLabel().name;
    if (['lost', 'runWon'].includes(S.phase)) return S.phase === 'runWon' ? 'Run complete' : 'Run over';
    return blindLabel().name + '  ·  ' + UI.num(S.score) + ' / ' + UI.num(S.target) + (heatPct() ? '  ·  Heat +' + heatPct() + '%' : '');
  }
  function drawRunPanel(c, t) {
    if (MOBILE || inMenus() || !S.stats || TUT.active) return;
    const x = 20, y = 84, w = 306, h = 576, d = runPanelData(), sb = stageBox();
    UI.box(c, x, y, w, h, { colour: P.OVERLAY_SOLID, radius: 18, outline: lighten(P.PANEL, 0.25), outlineWidth: 2 });
    UI.dynaText(c, 'This Run', x + w / 2, y + 30, { size: 30, colour: P.GOLD, time: t, wave: 1.5 });
    UI.text(c, cup().name + '  ·  ' + sb[0] + ' ' + sb[1], x + w / 2, y + 58, { size: fitText(c, cup().name + '  ·  ' + sb[0] + ' ' + sb[1], w - 48, 17), colour: lighten(cup().colour, 0.35) });
    UI.text(c, runWhere(), x + w / 2, y + 78, { size: fitText(c, runWhere(), w - 48, 15), colour: P.TEXT_SOFT });
    let yy = y + 100;
    // Zeilenhöhe so, dass die letzte Zeile mit Abstand über dem unteren Rand (und den Nieten) bleibt
    const n = d.stats.length + d.rules.length, lh = Math.min(19, (y + h - 30 - yy - 52) / (n - 1));
    const head = (txt) => { UI.box(c, x + 14, yy - 10, w - 28, 22, { colour: P.PANEL, radius: 6, shadow: false }); UI.text(c, txt, x + w / 2, yy + 1, { size: 15, colour: P.TEXT_LABEL }); yy += 22; };
    const row = ([a, b]) => { UI.text(c, a, x + 26, yy, { size: 15, colour: P.TEXT_LABEL, align: 'left' }); UI.text(c, String(b), x + w - 26, yy, { size: 15, align: 'right' }); yy += lh; };
    head('Stats');
    d.stats.forEach(row);
    yy += 8;
    head('Rules right now');
    d.rules.forEach(row);
  }
  // Handy: eigener Reiter "Run" in den Einstellungen
  function drawRunTabMobile(c) {
    const g = mSetGeom(), d = runPanelData(), sb = stageBox();
    const head = cup().name + '  ·  ' + sb[0] + ' ' + sb[1] + '  ·  ' + runWhere();
    UI.text(c, head, g.vc, 128, { size: fitText(c, head, g.pw - 40, 24), colour: lighten(cup().colour, 0.35) });
    const colW = Math.min(620, (g.pw - 60) / 2);
    [[d.stats, g.vc - 10 - colW], [d.rules, g.vc + 10]].forEach(([rows, x0]) => rows.forEach(([a, b], i) => {
      const y = 166 + i * 31;
      UI.text(c, a, x0 + 12, y, { size: 21, colour: P.TEXT_LABEL, align: 'left' });
      UI.text(c, String(b), x0 + colW - 12, y, { size: 21, align: 'right' });
    }));
  }

  // ── Layouts (ui/layout-*.js) ────────────────────────────────────────────
  // Jedes Layout liefert Positionen (Würfel, Relikte, Beutel, Shop, Knöpfe, Popups) und zeichnet
  // Menü, Rahmen, Spielfeld und Shop. Spiellogik, Karten, Knöpfe und Effekte sind für alle gleich.
  const K = {
    S, R, UI, P, FX, eng, J, B, BLINDS, ANTES, VAULT_MAX, TYPE_COL, TYPE_NAME, darken, lighten, clamp, Icons, menuSub: () => menuSub,
    still: new FX.Juice(),
    dice: () => dice, juiced, area, statBox, dim, tutorial: () => TUT.active, tagChips, tagSummary, setTagRects: (r) => { tagRects = tagRects.concat(r); },
    drawLine, wrapText, faceEntry, fmtMult, money: moneyText, blindLabel, isBossBlind, luck: () => luck(), has, upg,
    anchorCap, bustAt, mostPlayed, relicMax, preview: () => (fogged() ? null : preview()), isBust, fatigueFor, bagMax, drawCount, shopLabels, upgradeNote, setOn, fuse: () => fuseView(),
    drawJob, jobLine, jonnyBoss, drawJonnyHead, wrapPlain, fitText, JONNY_GOLD, stageBox: () => stageBox(), formParts: () => formParts(), heatPct: () => heatPct(),
    bossDesc, bossTag: () => bossTag(), scoreText: () => (scoreHidden() ? '???' : UI.num(S.dispScore)), fogged: () => fogged(),
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
      ['Bloom', eng.crt, 'bloom', 0, 1.5], ['Bloom cut', eng.crt, 'bloomCut', 0, 1], ['Chroma aberr.', eng.crt, 'chroma', 0, 2], ['Noise', eng.crt, 'noise', 0, 1],
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
      S, P, eng, dice: () => dice, R, enterShop, tut: () => TUT,
      setFaces: (vals) => dice.forEach((d, i) => { const k = d.data.die.faces.findIndex((f) => f.v === vals[i]); if (k >= 0) { d.data.up = k; refreshDieTex(d); } }), leaveShop, useCons: () => { selected = consSprites[0]; useSelected(); }, sellRelic: (k) => { selected = relicSprites[k]; sellSelected(); }, music: () => Music.playing, settings: SETTINGS, startCupDraw: () => startCupDraw(() => enterShop()), CUPS, cupList: () => cupList, slot: () => slot, profile: () => profile, saveNow: () => autosave(true), cupSel: () => cupSel, buy, startBlind, addRelic, refreshBag, stockShop, fuse: () => fuse && { t0: fuse.t0, total: fuse.total }, tips: () => tips.map((q) => ({ term: q.term, pinned: q.pinned, rect: q.rect && { x: q.rect.x, y: q.rect.y, w: q.rect.w, h: q.rect.h }, terms: q.rect ? q.rect.terms.map((r) => ({ x: r.x, y: r.y, w: r.w, h: r.h, term: r.term })) : [] })), 
      addUpgrade: (id) => { S.upgrades.push(id); refreshUpgrades(); },
      achieve, toasts: () => toasts.map((q) => q.a.id), openTrophies, genItem, genDie, rollUpgrade, open, meta,
      song: () => ({ rel: songRel, info: songInfo, k: songK() }), spawnHead, head: () => floatHead && headPos(floatHead), secret, callJonny, tape, Tapes, menuWord, peek: () => peek, BT: () => S.ach.bt,
      idle: (sec) => { lastInput = nowSec() - sec; }, menuDice: () => menuDice.map((d) => ({ x: d.x, y: d.y, v: d.data.v })), skipSong, setTab: (i) => { setTab = i; }, slotData: () => slotData,
      setRelics: (ids) => { relicSprites.forEach((s) => s.remove()); relicSprites = []; S.relics = []; ids.forEach((id) => addRelic(id)); },
      jonny: () => JS.cur && { place: JS.cur.place, mood: JS.cur.line.mood, text: JS.cur.line.words.map((w) => w.t).join(''), q: JS.q.length, rect: JS.rect },
      jonnyQueue: () => JS.q.map((x) => x.line.words.map((w) => w.t).join('')), job: () => S.job, newJob, JOBS: () => JOBS.map((d) => d.id),
      setJob: (id) => { const def = JOB_BY_ID[id], j = def.make(); S.job = Object.assign(j, { id, kind: def.kind || 'count', n: 0, status: 'open', reward: jobReward(j.d) }); return S.job; },
      jonnyHelp, bestHold, jonnyEnd, jonnySay, pickBoss, winBlind, loseRun, JONNY_BOSS, maybeSpecial: (force) => maybeSpecial(force), openCups, beginRun,
      B, layout: () => L && L.id, slotMain: (k) => SLOT_MAIN[k], shopSprites: () => shopSprites, relicSprites: () => relicSprites,
      consSprites: () => consSprites, tagRects: () => tagRects.map((r) => ({ x: r.x, y: r.y, w: r.w, h: r.h, tag: r.tag, term: r.term })),
      swapDice: (a, b) => { swapDice(a, b, false); layoutDice(); }, blindTarget, baseTarget, heatPct: () => heatPct(), formation: () => formationNow(), formParts, startEndless, openSummary,
      summary: () => S.summary, runImage: (rec) => runImage(rec || S.summary || lastRecord).toDataURL('image/png'), history, openCodex, openHistory,
      codexState: (kind, id) => codexState({ kind, id }).state, codexSel: (kind, id) => { codexSel = { kind, id, name: id }; }, setCodexTab: (i) => { codexTab = i; codexPage = 0; },
      histSel: (i) => { histSel = i; }, settingsOpen: (v) => { settingsOpen = v; if (v) { setPane = 'settings'; setSnap = JSON.stringify(SETTINGS); } }, setPane: () => setPane, setDirty: () => setDirty(), magnetize: () => magnetize(dice.slice()), slideTogether: (idx) => slideTogether(idx.map((i) => dice[i]), true, 'lodestone'),
      Phone, maybePhone, phoneNow: () => phoneNow, phoneAnswer, phoneIgnore, phonePick, phoneWeigh, setCodexTabId: (id) => { codexTab = CODEX_TABS.findIndex((x) => x.id === id); codexPage = 0; },
      Enc, startEncounter, encNow: () => encNow, encPress, encEnd, makeHandGif, gifFrame, buildRecord, saveGif, relicMax, applySettings, saveSettings, lookOwned, Cos, Col, studio: (v) => { studioOpen = v; if (v) placeStudio(); }, studioButton, STU, setSettingsTab: (id) => { setTab = SET_TABS.findIndex((x) => x.id === id); }, changeSetting, activeButtons, MAT: () => MAT, faceEntry, onButton, focus: () => focusBtn, moveFocus,
      jonnyEvents, pickLine, stageBase, rngState: () => S.rng, bestReplay: () => S.bestReplay, Rng, playHand, reroll,
      // Bosse und Challenges
      Chal, openChallenges, chalStart, startDailyRun, chalTab: (i) => { chTab = i; }, chalSel: (id) => { chSel = id; }, chalFinish, masteryCheck, cup: () => cup(),
      setBoss: (id, lv) => { S.boss = bossById(id, lv); }, curBoss:() => curBoss(), isBossBlind: () => isBossBlind(),
      bossDesc: () => bossDesc(), scoreText: () => (scoreHidden() ? '???' : UI.num(S.dispScore)), rerollFee: () => rerollFee(),
    };
  }

  // ── Start ───────────────────────────────────────────────────────────────
  // ── Tutorial mit Jonny (tutorial.js) ───────────────────────────────────
  // Beim ersten Klick auf PLAY fragt Jonny, ob man ein Tutorial möchte. Es lässt sich nur einmal spielen.
  const TUT = window.WGTutorial ? window.WGTutorial({
    S, eng, UI, P, R, B, sfx, dice: () => dice, L: () => L, preview, mobile: MOBILE, dim: (ctx, a) => dim(ctx, a), upValue: (sp) => upFace(sp).v, textSpeed: () => +SETTINGS.textSpeed || 1,
    relicSprites: () => relicSprites, consSprites: () => consSprites, addRelic, textScale: () => +SETTINGS.textSize || 1,
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
    S.chal = null;
    startRun('classic');
    S.boss = R.bossOf('snake', 0); S.usedBosses = ['snake'];
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
  const begin = () => { setupMenu(); eng.start(update, (b, f, t) => { drawMaterialFx(b, t); draw(b, f, t); drawFocus(f); }); };
  if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('20px "Aleator Pixel"'), document.fonts.load('20px "Jersey 10"'), document.fonts.load('20px "Jacquard 12"'), document.fonts.load('20px "Pixelify Sans"')]).catch(() => {}).then(begin);
  else begin();
})();
