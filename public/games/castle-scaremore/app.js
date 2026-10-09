/* Castle Scaremore – UI prototype (no gameplay yet) */
(() => {
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ic = (id, cls = '') => `<svg class="${cls}"><use href="#i-${id}"/></svg>`;
const app = $('#app');
const root = document.documentElement;

// ---------------------------------------------------------------- motion
// Real damped-spring curves baked into CSS linear() easings.
function springCurve(zeta, omega, n = 60) {
  const wd = omega * Math.sqrt(1 - zeta * zeta);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = 1 - Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + (zeta * omega / wd) * Math.sin(wd * t));
    pts.push(+x.toFixed(4));
  }
  pts[n] = 1;
  return `linear(${pts.join(', ')})`;
}
const EASE = {
  spring: 'cubic-bezier(.3, 1.25, .5, 1)',
  soft: 'cubic-bezier(.25, 1, .35, 1)',
  bouncy: 'cubic-bezier(.3, 1.5, .5, 1)',
  in: 'cubic-bezier(.5, 0, .75, 0)',
};
if (window.CSS && CSS.supports('transition-timing-function', 'linear(0, 1)')) {
  EASE.spring = springCurve(0.72, 12);
  EASE.soft = springCurve(0.92, 10);
  EASE.bouncy = springCurve(0.5, 14);
  root.style.setProperty('--spring', EASE.spring);
  root.style.setProperty('--spring-soft', EASE.soft);
  root.style.setProperty('--spring-bouncy', EASE.bouncy);
}
const retrigger = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

// ---------------------------------------------------------------- data
const RARITIES = [
  { id: 'common', name: 'Common', weight: 60 },
  { id: 'rare', name: 'Rare', weight: 28 },
  { id: 'epic', name: 'Epic', weight: 10 },
  { id: 'legendary', name: 'Legendary', weight: 2 },
];

const UPGRADES = [
  { id: 'visitors', name: 'More Visitors', icon: 'people', color: '#b39cf0', base: 35, growth: 1.15, max: 60,
    label: 'Every', val: l => `${Math.max(2, 8 - 0.1 * l).toFixed(1)}s` }, // always exactly −0.1 s per level
  { id: 'scare', name: 'Scarier Scares', icon: 'bolt', color: '#e8966a', base: 12, growth: 1.14, milestone: 25,
    label: 'Per scare', val: l => fmt((5 + 3 * l) * Math.pow(2, Math.floor(l / 25))) },
  { id: 'perfect', name: 'Steady Hands', icon: 'target', color: '#74c3e0', base: 50, growth: 1.35, max: 15,
    label: 'Perfect window', val: l => `${10 + 2 * l}%` },
  { id: 'decor', name: 'Creepy Decor', icon: 'candle', color: '#e8b25c', base: 100, growth: 1.23,
    label: 'All Frights', val: l => `×${(1 + 0.1 * l).toFixed(1)}` }, // always exactly +0.1 per level
  { id: 'police', name: 'Police Bait', icon: 'shield', color: '#7fa4f0', base: 150, growth: 1.3, max: 20,
    label: 'Police chance', val: l => `${(4 + 0.4 * l).toFixed(1)}%` },
  { id: 'groups', name: 'Tour Groups', icon: 'group', color: '#e39ab8', base: 20000, growth: 5, max: 3, reqRoom: 1,
    label: 'Group size', val: l => `${1 + l}` },
  { id: 'helperCount', name: 'Poltergeist Reach', icon: 'group', color: '#9fe3c6', base: 2500, growth: 4, max: 3, reqShop: 'helper',
    label: 'Visitors per scare', val: l => `${1 + l}` },
  { id: 'helperSpeed', name: 'Restless Poltergeist', icon: 'clock', color: '#74c3e0', base: 1500, growth: 2.6, max: 7, reqShop: 'helper',
    label: 'Scares every', val: l => `${Math.max(6, 20 - 2 * l)}s` },
];

const CARDS = [
  { id: 'tourists', name: 'More Tourists', icon: 'people', vals: [5, 12, 25, 50], fmt: v => `+${v}% visitors` },
  { id: 'scares', name: 'Bigger Scares', icon: 'bolt', vals: [10, 25, 50, 100], fmt: v => `+${v}% Frights` },
  { id: 'groups', name: 'Bigger Groups', icon: 'group', vals: [null, 1, 2, 4], fmt: v => `+${v} group size` },
  { id: 'perfect', name: 'Perfect Zone', icon: 'target', vals: [3, 7, 12, 20], fmt: v => `+${v}% Perfect window` },
  { id: 'police', name: 'Police Magnet', icon: 'shield', vals: [1, 2, 4, 8], fmt: v => `+${v}% Police chance` },
  { id: 'gemfinder', name: 'Gem Finder', icon: 'gem', vals: [null, 1, 2, 5], fmt: v => `+${v} Gems per Police` },
  { id: 'combo', name: 'Combo Master', icon: 'sparkle', vals: [null, null, 5, 15], fmt: v => `+${v}% Combo bonus` },
];

// ghost skins change ONLY colour / pattern – all bonuses come from level + wardrobe
const SKINS = [
  { id: 'classic', name: 'Classic Sheet', rarity: 0, cost: 0, base: '#efe8dc' },
  { id: 'mint', name: 'Mint Mist', rarity: 0, cost: 20, base: '#bfe8d6' },
  { id: 'rose', name: 'Rose Dots', rarity: 1, cost: 35, base: '#efc9d6', pattern: 'dots', ink2: '#d99ab0' },
  { id: 'stripes', name: 'Dungeon Stripes', rarity: 1, cost: 40, base: '#e6e2da', pattern: 'stripes', ink2: '#6b6f7a' },
  { id: 'dusk', name: 'Dusk', rarity: 1, cost: 45, base: '#d6d0f2', pattern: 'fade', ink2: '#8d86c8' },
  { id: 'stars', name: 'Starry Night', rarity: 2, cost: 80, base: '#b8c2ee', pattern: 'stars', ink2: '#f4e2a8' },
  { id: 'tartan', name: 'Highland Tartan', rarity: 2, cost: 90, base: '#e2b3ae', pattern: 'tartan', ink2: '#8c2f3c' },
  { id: 'gold', name: 'Golden Glow', rarity: 3, cost: 200, base: '#f6e4ad', pattern: 'fade', ink2: '#d99f48', glow: '#f3dc9a' },
  { id: 'spectral', name: 'Spectral', rarity: 3, cost: 220, base: '#d2f5e6', pattern: 'wisps', ink2: '#7fd6b0', glow: '#9fe3c6', alpha: 0.85 },
];

// wardrobe: every chest gives exactly one item; duplicates level the item up (max 5)
const SLOTS = [
  { id: 'hat', name: 'Hats', stat: 'frights', vals: [5, 12, 25, 50], fmt: v => `+${+v.toFixed(1)}% Frights` },
  { id: 'mask', name: 'Masks', stat: 'perfect', vals: [2, 4, 7, 12], fmt: v => `+${+v.toFixed(1)}% Perfect window` },
  { id: 'neck', name: 'Capes', stat: 'xp', vals: [5, 12, 25, 50], fmt: v => `+${+v.toFixed(1)}% XP` },
];
const ITEMS = [
  { id: 'nightcap', slot: 'hat', name: 'Nightcap', rarity: 0 },
  { id: 'party', slot: 'hat', name: 'Party Hat', rarity: 0 },
  { id: 'bucket', slot: 'hat', name: 'Bucket', rarity: 0 },
  { id: 'witch', slot: 'hat', name: 'Witch Hat', rarity: 1 },
  { id: 'tophat', slot: 'hat', name: 'Top Hat', rarity: 1 },
  { id: 'jester', slot: 'hat', name: 'Jester Cap', rarity: 1 },
  { id: 'helm', slot: 'hat', name: 'Knight Helm', rarity: 2 },
  { id: 'wizard', slot: 'hat', name: 'Wizard Hat', rarity: 2 },
  { id: 'crown', slot: 'hat', name: 'Royal Crown', rarity: 3 },
  { id: 'candles', slot: 'hat', name: 'Candelabra', rarity: 3 },
  { id: 'glasses', slot: 'mask', name: 'Round Glasses', rarity: 0 },
  { id: 'patch', slot: 'mask', name: 'Eye Patch', rarity: 0 },
  { id: 'monocle', slot: 'mask', name: 'Monocle', rarity: 0 },
  { id: 'shades', slot: 'mask', name: 'Sunglasses', rarity: 1 },
  { id: 'masquerade', slot: 'mask', name: 'Masquerade', rarity: 1 },
  { id: 'bandit', slot: 'mask', name: 'Bandit Mask', rarity: 1 },
  { id: 'plague', slot: 'mask', name: 'Plague Doctor', rarity: 2 },
  { id: 'skull', slot: 'mask', name: 'Skull Mask', rarity: 2 },
  { id: 'phantom', slot: 'mask', name: 'Phantom Mask', rarity: 3 },
  { id: 'goldmask', slot: 'mask', name: 'Gilded Mask', rarity: 3 },
  { id: 'scarf', slot: 'neck', name: 'Scarf', rarity: 0 },
  { id: 'bowtie', slot: 'neck', name: 'Bow Tie', rarity: 0 },
  { id: 'bandana', slot: 'neck', name: 'Bandana', rarity: 0 },
  { id: 'ruff', slot: 'neck', name: 'Ruff Collar', rarity: 1 },
  { id: 'pearls', slot: 'neck', name: 'Pearl Necklace', rarity: 1 },
  { id: 'boa', slot: 'neck', name: 'Feather Boa', rarity: 1 },
  { id: 'vampire', slot: 'neck', name: 'Vampire Cape', rarity: 2 },
  { id: 'herocape', slot: 'neck', name: 'Hero Cape', rarity: 2 },
  { id: 'mantle', slot: 'neck', name: 'Royal Mantle', rarity: 3 },
  { id: 'starcape', slot: 'neck', name: 'Starlight Cape', rarity: 3 },
];
const CHESTS = [
  { id: 'crypt', name: 'Crypt Chest', cost: 15, odds: [70, 25, 5, 0], wood: '#5e4230', band: '#4a4550', trim: '#8d93a0' },
  { id: 'royal', name: 'Royal Chest', cost: 50, odds: [0, 55, 35, 10], wood: '#4f2433', band: '#b98636', trim: '#e8b25c' },
];

const ROOM_MULT = [1, 2, 4, 8, 16];
const ROOMS = [
  { name: 'Entrance Hall', icon: 'door', desc: 'Tourists, kids, photographers.', cost: 0 },
  { name: "Knight's Hall", icon: 'shield', desc: 'Tour groups and joggers.', cost: 3000 },
  { name: 'Dungeon', icon: 'chain', desc: 'Skeptics. Police patrol more.', cost: 1e6 },
  { name: 'Wizard Tower', icon: 'tower', desc: 'Ghost hunters. Only Perfect works.', cost: 1e8 },
  { name: 'Throne Room', icon: 'crown', desc: 'Royal visitors. Legendary rewards.', cost: 2e10 },
];

const SPECIALS = [
  { id: 'double', name: 'Double Frights', icon: 'bolt', color: '#e8966a', cost: 200, desc: 'Permanently earn ×2 Frights.' },
  { id: 'helper', name: 'Poltergeist Helper', icon: 'ghost', color: '#9fe3c6', cost: 150, desc: 'Catches one missed visitor every 20s. Unlocks upgrades.' },
  { id: 'night', name: 'Night Shift', icon: 'moon', color: '#b39cf0', cost: 125, desc: 'Earn while away, up to 2h.' },
  { id: 'radio', name: 'Police Radio', icon: 'shield', color: '#7fa4f0', cost: 100, desc: 'Police visit twice as often.' },
];

// temporary buffs bought with gems – buying again extends the timer
const POTIONS = [
  { id: 'steady', name: 'Steady Tonic', color: '#9fe3c6', cost: 6, dur: 90, stat: 'perfect', val: 15, desc: '+15% Perfect window' },
  { id: 'terror', name: 'Phial of Terror', color: '#e8b25c', cost: 10, dur: 120, stat: 'fear', val: 2, desc: 'Fear meter fills ×2' },
  { id: 'swift', name: 'Swift Elixir', color: '#74c3e0', cost: 10, dur: 180, stat: 'speed', val: 1.5, desc: 'Visitors arrive ×1.5 faster' },
  { id: 'dread', name: 'Draught of Dread', color: '#c9675a', cost: 14, dur: 300, stat: 'frights', val: 2, desc: '×2 Frights' },
  { id: 'wisdom', name: 'Wisdom Brew', color: '#b392f0', cost: 16, dur: 600, stat: 'xp', val: 2, desc: '×2 XP' },
  { id: 'midnight', name: 'Midnight Elixir', color: '#6f7cc0', cost: 90, dur: 3600, stat: 'frights', val: 3, desc: '×3 Frights' },
];
const potionLeft = id => Math.max(0, ((S.potions || {})[id] || 0) - Date.now());
const potionMul = stat => POTIONS.reduce((m, p) => (p.stat === stat && potionLeft(p.id) > 0 ? m * p.val : m), 1);
const potionAdd = stat => POTIONS.reduce((m, p) => (p.stat === stat && potionLeft(p.id) > 0 ? m + p.val : m), 0);
const fmtDur = sec => sec < 120 ? `${sec}s` : sec < 3600 ? `${Math.round(sec / 60)} min` : `${+(sec / 3600).toFixed(1)} h`;
function fmtLeft(ms) {
  const s = Math.ceil(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
}

// ---------------------------------------------------------------- state
const SAVE_KEY = 'scaremore-v4';
const freshState = () => ({
  frights: 0, gems: 25, // 25 gems = tutorial gift, enough for the first pack right away
  upg: { visitors: 0, scare: 0, perfect: 0, decor: 0, police: 0, groups: 0, helperCount: 0, helperSpeed: 0 },
  buyMode: 0,
  cards: {},
  ghostLevel: 1,
  skin: 'classic',
  skins: { classic: true },
  items: {},
  equip: { hat: null, mask: null, neck: null },
  rooms: 1, currentRoom: 0,
  shop: {},
  dailyAt: 0,
  potions: {},
  tutorialDone: false,
  seenPolice: false,
  lastSeen: 0,
  ecto: 0,          // prestige currency (Séance), +10% Frights each
  lifetime: 0,      // Frights earned since the last Séance
  seances: 0,
  quests: [],
  questsDone: 0,
  level: 1,
  xp: 0,
  seen: {},
  settings: { sound: true, music: true, vibe: true, notation: 'short' },
});
let S = load();
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s) {
      const f = freshState();
      const m = Object.assign(f, s, { settings: Object.assign(f.settings, s.settings) });
      if (m.dailyAt - Date.now() > 10 * 60 * 1000) m.dailyAt = Date.now();
      if (m.equip && !('neck' in m.equip)) { m.equip.neck = null; delete m.equip.third; }
      if (s.ghosts && !s.ghostLevel) m.ghostLevel = Math.max(1, ...Object.values(s.ghosts)); // migrate old per-ghost levels
      return m;
    }
  } catch (e) { /* ignore */ }
  return freshState();
}
let saveTimer;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    S.lastSeen = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(S));
  }, 150);
}

// ---------------------------------------------------------------- derived stats (single source of truth for gameplay)
function stats() {
  const u = S.upg;
  const card = id => cardTotal(CARDS.find(c => c.id === id));
  const mult = (1 + 0.1 * u.decor)
    * ROOM_MULT[S.currentRoom]
    * (1 + card('scares') / 100)
    * (S.shop.double ? 2 : 1)
    * (1 + 0.1 * S.ecto)
    * (1 + 0.05 * S.ghostLevel)
    * (1 + itemBonus('frights') / 100)
    * potionMul('frights');
  return {
    interval: Math.max(2, 8 - 0.1 * u.visitors) / (1 + card('tourists') / 100) / potionMul('speed'),
    base: (5 + 3 * u.scare) * Math.pow(2, Math.floor(u.scare / 25)),
    mult,
    perfectPct: 10 + 2 * u.perfect + card('perfect') + itemBonus('perfect') + potionAdd('perfect'),
    fearMult: potionMul('fear'),
    policeChance: Math.min(30, (4 + 0.4 * u.police + card('police')) * (S.shop.radio ? 2 : 1) * (S.currentRoom >= 2 ? 1.5 : 1)),
    groupSize: Math.min(5, S.rooms > 1 ? 1 + u.groups + card('groups') : 1),
    gemBonus: card('gemfinder'),
    gemMult: 1,
    comboStep: 10 + card('combo'),
    doubleChance: 0,
    autoPerfect: 0,
    room: S.currentRoom,
    helper: !!S.shop.helper,
    helperCount: 1 + (u.helperCount || 0),
    helperCooldown: Math.max(6, 20 - 2 * (u.helperSpeed || 0)),
  };
}

// ---------------------------------------------------------------- utils
const SUFFIXES = (() => {
  const list = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No'];
  const ones = ['', 'U', 'D', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No'];
  const tens = ['Dc', 'Vg', 'Tg', 'Qd', 'Qq', 'Sg', 'St', 'Og', 'Nn'];
  for (const t of tens) for (const o of ones) list.push(o + t);
  list.push('Ce');
  return list; // index i = 10^(3i)
})();
function fmt(n) {
  if (!isFinite(n)) return '∞';
  if (n < 1000) return String(Math.floor(n));
  let e = Math.floor(Math.log10(n));
  if (S.settings.notation === 'sci' || Math.floor(e / 3) >= SUFFIXES.length) {
    let m = n / Math.pow(10, e);
    if (m >= 9.995) { m /= 10; e++; }
    return `${m.toFixed(2)}e${e}`;
  }
  let i = Math.floor(e / 3), v = n / Math.pow(10, i * 3);
  if (v >= 999.5) { i++; v /= 1000; }
  let t = v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : v.toFixed(0);
  if (t.includes('.')) t = t.replace(/\.?0+$/, '');
  return t + SUFFIXES[i];
}
// multipliers keep their decimals: ×1.5, ×6.4, ×12.3, then short-scale
const fmtX = x => x < 100 ? String(+x.toFixed(x < 10 ? 2 : 1)) : fmt(x);
function relPos(el) {
  const a = app.getBoundingClientRect(), r = el.getBoundingClientRect();
  return { x: r.left - a.left + r.width / 2, y: r.top - a.top + r.height / 2 };
}

// ---------------------------------------------------------------- audio (soft, short)
let actx;
function audio() {
  if (!actx) {
    try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    loadSamples(actx);
  }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}
// Pre-rendered foley in sfx/ (tools/sfxgen/ghost.py): a few takes per sound,
// never the same take twice in a row, slight pitch/volume drift. The tones below
// stay as fallback while loading (or when opened from file://).
const samples = { takes: {}, last: {}, out: null };
function loadSamples(a) {
  samples.out = a.createGain();
  samples.out.gain.value = 0.55;
  samples.out.connect(a.destination);
  const trim = b => {
    const d = b.getChannelData(0), max = Math.min(2400, d.length >> 2);
    let i = 0;
    while (i < max && Math.abs(d[i]) < 0.002) i++;
    return i / b.sampleRate;
  };
  fetch('sfx/manifest.json').then(r => r.json()).then(man => Object.entries(man).forEach(([name, count]) => {
    samples.takes[name] = [];
    for (let k = 1; k <= count; k++) {
      fetch(`sfx/${name}_${k}.mp3`).then(r => r.arrayBuffer())
        .then(b => new Promise((ok, fail) => a.decodeAudioData(b, ok, fail)))
        .then(buf => samples.takes[name].push({ buf, start: trim(buf) }))
        .catch(() => {});
    }
  })).catch(() => {});
}
function play(name, { gain = 1, rate = 1, jitter = 0.04, delay = 0, take } = {}) {
  if (!S.settings.sound) return true;
  const a = audio(), list = samples.takes[name];
  if (!a || !list || !list.length) return false;
  let i = take != null ? take % list.length : Math.floor(Math.random() * list.length);
  if (take == null && list.length > 1 && i === samples.last[name]) i = (i + 1) % list.length;
  samples.last[name] = i;
  const src = a.createBufferSource(), g = a.createGain();
  src.buffer = list[i].buf;
  src.playbackRate.value = rate * (1 + (Math.random() * 2 - 1) * jitter);
  g.gain.value = gain * (1 - Math.random() * 0.12);
  src.connect(g).connect(samples.out);
  src.start(a.currentTime + delay, list[i].start);
  return true;
}
function tone(f, d = 0.1, type = 'sine', v = 0.08, f2 = null, delay = 0) {
  if (!S.settings.sound) return;
  const a = audio(); if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(a.destination);
  o.start(t); o.stop(t + d + 0.03);
}
const sfx = {
  tab: () => play('tab', { gain: 0.9 }) || tone(560, 0.07, 'sine', 0.06, 700),
  tap: () => play('tap', { gain: 0.8, jitter: 0.06 }) || tone(760, 0.04, 'sine', 0.05),
  buy: () => play('buy') || (tone(620, 0.07, 'sine', 0.07), tone(930, 0.1, 'sine', 0.06, null, 0.055)),
  error: () => play('error') || tone(200, 0.14, 'triangle', 0.06, 150),
  flip: () => play('flip') || tone(420, 0.06, 'sine', 0.05, 620),
  rarity: r => play('rarity' + r, { jitter: 0 }) || [[660], [660, 880], [660, 880, 1100], [523, 660, 784, 1047, 1319]][r]
    .forEach((f, i) => tone(f, 0.22, 'sine', 0.06, null, i * 0.07)),
  toggle: on => play(on ? 'toggle_on' : 'toggle_off', { jitter: 0 }) || tone(on ? 660 : 440, 0.06, 'sine', 0.06),
  // chest shaking before it opens; i = shake number
  chest: i => play('chest', { take: i, rate: 1 + i * 0.05, jitter: 0.02 }) || tone(240 + i * 120, 0.04, 'triangle', 0.035),
  // gameplay
  boo: () => play('boo', { gain: 0.9 }) || (noise(0.28, 900, 300, 0.09), tone(260, 0.32, 'sine', 0.07, 150)),
  whiff: () => play('whiff', { gain: 0.8, jitter: 0.08 }) || noise(0.16, 1400, 600, 0.04),
  // pitch: ~1.4 kids, 0.85-1.25 adults, 0.7 a mild "oh"
  yelp: (pitch = 1) => play(pitch >= 1.3 ? 'yelp_kid' : pitch < 0.8 ? 'gasp' : 'yelp', { gain: 0.8, rate: pitch >= 1.3 || pitch < 0.8 ? 1 : Math.min(1.12, Math.max(0.9, pitch)) })
    || tone(820 * pitch, 0.12, 'triangle', 0.05, 1350 * pitch, 0.04),
  rating: r => (r > 0 && play('rating' + r, { jitter: 0 })) || [[], [587], [587, 740], [587, 880, 1175]][r].forEach((f, i) => tone(f, 0.16, 'sine', 0.06, null, 0.05 + i * 0.05)),
  coin: () => play('coin', { gain: 0.6, jitter: 0.06 }) || tone(1320, 0.05, 'sine', 0.03),
  zap: () => play('zap') || (noise(0.3, 3000, 800, 0.07), tone(900, 0.25, 'sawtooth', 0.03, 120)),
  splat: () => play('splat', { gain: 0.8 }) || noise(0.12, 500, 200, 0.05),
  levelup: () => play('levelup', { jitter: 0 }) || [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, 'sine', 0.07, null, i * 0.09)),
  shutter: () => play('shutter', { gain: 0.8 }) || (noise(0.05, 4000, 3000, 0.06), tone(2400, 0.03, 'square', 0.02, null, 0.05)),
};
let noiseBuf;
function noise(d, f1, f2, v) {
  if (!S.settings.sound) return;
  const a = audio(); if (!a) return;
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, a.sampleRate, a.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
  }
  const t = a.currentTime;
  const src = a.createBufferSource(), bp = a.createBiquadFilter(), g = a.createGain();
  src.buffer = noiseBuf;
  bp.type = 'bandpass'; bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(f1, t);
  bp.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  src.connect(bp).connect(g).connect(a.destination);
  src.start(t); src.stop(t + d + 0.05);
}
const vibe = (ms = 8) => { if (S.settings.vibe && navigator.vibrate) navigator.vibrate(ms); };

// ---------------------------------------------------------------- fx (used sparingly)
const fx = $('#fx-layer');
function floatText(el, text) {
  const p = relPos(el);
  const d = document.createElement('div');
  d.className = 'float-text';
  d.textContent = text;
  d.style.left = p.x + 'px'; d.style.top = (p.y - 14) + 'px';
  fx.appendChild(d);
  d.addEventListener('animationend', () => d.remove());
}
function motes(el, color, count = 10, spread = 60) {
  const p = relPos(el);
  for (let i = 0; i < count; i++) {
    const d = document.createElement('div');
    d.className = 'mote';
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const r = spread * (0.5 + Math.random() * 0.6);
    d.style.cssText = `left:${p.x}px;top:${p.y}px;--mc:${color};--dx:${Math.cos(a) * r}px;--dy:${Math.sin(a) * r - 10}px;--d:${0.6 + Math.random() * 0.5}s`;
    fx.appendChild(d);
    d.addEventListener('animationend', () => d.remove());
  }
}
function toast(msg, type = '', icon = 'check') {
  const rootEl = $('#toast-root');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = ic(icon) + `<span>${msg}</span>`;
  rootEl.appendChild(t);
  while (rootEl.children.length > 2) rootEl.firstChild.remove();
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 230); }, 1700);
}
function fail(el, msg) {
  if (el) retrigger(el, 'nudge');
  sfx.error(); vibe([12, 40, 12]);
  toast(msg, 'error', 'close');
}

// ---------------------------------------------------------------- currency
const shown = { frights: S.frights, gems: S.gems };
function tickCurrency() {
  for (const k of ['frights', 'gems']) {
    const target = S[k], d = target - shown[k];
    if (d === 0) continue;
    shown[k] = Math.abs(d) < 1 ? target : shown[k] + d * 0.16;
    $(`#cur-${k} .cur-val`).textContent = fmt(shown[k]);
    if (shown[k] === target) $(`#cur-${k}`).classList.remove('spent');
  }
  requestAnimationFrame(tickCurrency);
}
function renderCurrencyNow() {
  for (const k of ['frights', 'gems']) $(`#cur-${k} .cur-val`).textContent = fmt(S[k]);
}
function spend(kind, amount, el) {
  if (S[kind] < amount) {
    fail(el, kind === 'gems' ? 'Not enough gems' : 'Not enough Frights');
    return false;
  }
  S[kind] -= amount;
  const c = $(`#cur-${kind}`);
  c.classList.add('spent');
  retrigger(c, 'tick');
  if (el) floatText(el, `−${fmt(amount)}`);
  save();
  return true;
}
function gain(kind, amount, el) {
  S[kind] += amount;
  if (kind === 'frights') S.lifetime += amount;
  retrigger($(`#cur-${kind}`), 'tick');
  if (el) floatText(el, `+${fmt(amount)}`);
  save();
}

// ---------------------------------------------------------------- level (XP bar in the top bar, claimed by tapping)
const xpNeed = lvl => Math.round(15 * Math.pow(lvl, 1.5));
const levelReady = () => S.xp >= xpNeed(S.level);
function levelReward(lvl) {
  const st = stats();
  return {
    frights: Math.max(40, Math.round(st.base * st.mult * 25 * (1 + lvl * 0.05))),
    gems: lvl % 5 === 0 ? 10 : 3,
  };
}
let wasReady = false;
function renderLevel() {
  const need = xpNeed(S.level), ready = levelReady();
  const el = $('#level');
  el.classList.toggle('ready', ready);
  $('#lv-num').textContent = S.level;
  el.style.setProperty('--p', Math.min(1, S.xp / need).toFixed(3));
  $('#lv-text').textContent = ready ? 'Level up! Tap to claim' : `${fmt(S.xp)} / ${fmt(need)} XP`;
  if (ready && !wasReady) { sfx.rating(3); retrigger(el, 'nudge'); }
  wasReady = ready;
}
function addXp(n) {
  if (!n) return;
  S.xp = Math.min(xpNeed(S.level), S.xp + Math.round(n * (1 + itemBonus('xp') / 100) * potionMul('xp')));
  save(); renderLevel();
}
function claimLevel(btn) {
  if (!levelReady()) {
    retrigger(btn, 'nudge'); sfx.tap();
    toast(`${fmt(xpNeed(S.level) - S.xp)} XP to level ${S.level + 1}`, '', 'sparkle');
    return;
  }
  S.xp = 0;
  S.level++;
  const r = levelReward(S.level);
  save(); renderLevel();
  sfx.levelup(); vibe([15, 40, 25]);
  const el = document.createElement('div');
  el.className = 'reveal levelup';
  el.innerHTML = `
    <p class="lu-kicker">Level up</p>
    <div class="lu-num">${S.level}</div>
    <div class="lu-rewards">
      <div class="lu-row">${ic('fright')}<b>+${fmt(r.frights)}</b><span>Frights</span></div>
      <div class="lu-row gem">${ic('gem')}<b>+${r.gems}</b><span>Gems</span></div>
    </div>
    <div class="reveal-actions"><button class="btn lg" data-collect>Collect</button></div>`;
  app.appendChild(el);
  $('[data-collect]', el).addEventListener('click', () => {
    gain('frights', r.frights); gain('gems', r.gems);
    motes($('#cur-frights'), 'var(--fright)', 10, 40);
    motes($('#cur-gems'), 'var(--gem)', 10, 40);
    sfx.buy();
    el.classList.add('out');
    setTimeout(() => el.remove(), 250);
    refresh();
  });
}

// ---------------------------------------------------------------- navigation
const TABS = ['shop', 'cards', 'haunt', 'ghosts', 'castle'];
let current = 'haunt';
const pageEl = n => $(`.page[data-page="${n}"]`);
const onShow = {};

function enter(page) {
  retrigger(page, 'enter');
  clearTimeout(page._enterT);
  page._enterT = setTimeout(() => page.classList.remove('enter'), 1000);
}
function switchTab(to) {
  if (to === current) {
    pageEl(to).scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const dir = TABS.indexOf(to) > TABS.indexOf(current) ? 1 : -1;
  const a = pageEl(current), b = pageEl(to);

  b.getAnimations().forEach(x => x.cancel());
  a.getAnimations().forEach(x => x.cancel());
  b.classList.add('active');
  b.style.pointerEvents = '';
  b.animate(
    [{ opacity: 0, transform: `translateX(${dir * 22}px)` }, { opacity: 1, transform: 'none' }],
    { duration: 520, easing: EASE.soft }
  );
  enter(b);

  a.style.pointerEvents = 'none';
  const out = a.animate(
    [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-dir * 14}px)` }],
    { duration: 150, easing: EASE.in, fill: 'forwards' }
  );
  const leaving = a.dataset.page;
  out.onfinish = () => {
    if (current !== leaving) { a.classList.remove('active'); out.cancel(); }
  };

  current = to;
  setIndicator(true);
  sfx.tab(); vibe(6);
  if (onShow[to]) onShow[to]();
  window.dispatchEvent(new CustomEvent('scaremore:tab', { detail: to }));
}
function setIndicator(animate) {
  const bar = $('#tabbar');
  bar.style.setProperty('--idx', TABS.indexOf(current));
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === current));
  if (animate) retrigger(bar, 'moving');
}
function initTabs() {
  $$('.tab').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));
}
function setBadge(tab, value) {
  const b = $(`.tab[data-tab="${tab}"] .badge`);
  b.classList.toggle('show', !!value);
  b.classList.toggle('dot', value === true);
  if (value && value !== true) b.textContent = value;
  else if (!value) { /* keep last text during scale-out */ }
  else b.textContent = '';
}
function updateBadges() {
  setBadge('shop', Date.now() >= S.dailyAt ? 1 : false);
  setBadge('cards', S.gems >= 10 ? Math.min(9, Math.floor(S.gems / 10)) : false);
  setBadge('ghosts', S.gems >= CHESTS[1].cost);
  const next = ROOMS[S.rooms];
  setBadge('castle', !!(next && S.frights >= next.cost));
  $('#quest-dot').classList.toggle('show', questsClaimable());
}

// ---------------------------------------------------------------- haunt
const BUY_MODES = ['×1', '×10', 'Max'];
function costOf(u, lvl, n) {
  const g = u.growth;
  return Math.ceil(u.base * Math.pow(g, lvl) * (Math.pow(g, n) - 1) / (g - 1));
}
function buyAmount(u) {
  const lvl = S.upg[u.id] || 0;
  const cap = (u.max ?? Infinity) - lvl;
  if (cap <= 0) return 0;
  if (S.buyMode === 0) return 1;
  if (S.buyMode === 1) return Math.min(10, cap);
  let n = 0;
  while (n < cap && n < 500 && costOf(u, lvl, n + 1) <= S.frights) n++;
  return Math.max(1, n);
}
function buildUpgrades() {
  $('#upgrade-list').innerHTML = UPGRADES.map(u => `
    <div class="upg" data-id="${u.id}">
      <div class="tile" style="--c:${u.color}">${ic(u.icon)}</div>
      <div class="upg-body">
        <div class="upg-name">${u.name}<span class="lv"></span></div>
        <div class="upg-desc"></div>
        <div class="meter"><i></i></div>
      </div>
      <button class="btn"></button>
    </div>`).join('');
  $$('#upgrade-list .upg').forEach(row => {
    row.querySelector('.btn').addEventListener('click', e => buyUpgrade(row.dataset.id, e.currentTarget));
  });
  updateUpgrades();
}
function updateUpgrades() {
  for (const u of UPGRADES) {
    const row = $(`.upg[data-id="${u.id}"]`);
    const shopLocked = u.reqShop && !S.shop[u.reqShop];
    row.hidden = !!shopLocked;
    if (shopLocked) continue;
    const lvl = S.upg[u.id] || 0;
    const locked = u.reqRoom && S.rooms <= u.reqRoom;
    const maxed = u.max != null && lvl >= u.max;
    const n = buyAmount(u);
    const cost = n ? costOf(u, lvl, n) : 0;
    const btn = row.querySelector('.btn');
    row.classList.toggle('locked', !!locked);
    row.querySelector('.lv').textContent = maxed ? 'Max' : `Lv ${lvl}`;
    row.querySelector('.upg-desc').innerHTML = locked
      ? `Unlocks in ${ROOMS[u.reqRoom].name}`
      : `${u.label} <b>${u.val(lvl)}</b>${maxed ? '' : `${ic('arrow')}<b class="to">${u.val(lvl + n)}</b>`}`;
    const meter = row.querySelector('.meter');
    const p = u.milestone ? (lvl % u.milestone) / u.milestone : u.max ? lvl / u.max : null;
    meter.style.visibility = p == null || locked ? 'hidden' : '';
    meter.querySelector('i').style.setProperty('--p', maxed ? 1 : p || 0);

    let cls, html;
    if (locked) { cls = 'btn muted'; html = ic('lock'); }
    else if (maxed) { cls = 'btn done'; html = `${ic('check')}Maxed`; }
    else {
      cls = 'btn' + (S.frights >= cost ? '' : ' muted');
      html = `${n > 1 ? `+${n}<span class="sep"></span>` : ''}${ic('fright')}${fmt(cost)}`;
    }
    if (btn.className.replace(' nudge', '') !== cls) btn.className = cls;
    if (btn.innerHTML !== html) btn.innerHTML = html;
  }
}
function buyUpgrade(id, btn) {
  const u = UPGRADES.find(x => x.id === id);
  if (u.reqShop && !S.shop[u.reqShop]) return;
  const lvl = S.upg[id] || 0;
  if (u.reqRoom && S.rooms <= u.reqRoom) return fail(btn, `Unlock ${ROOMS[u.reqRoom].name} first`);
  const n = buyAmount(u);
  if (!n) return;
  if (!spend('frights', costOf(u, lvl, n), btn)) return;
  S.upg[id] = lvl + n;
  sfx.buy(); vibe(8);
  const row = btn.closest('.upg');
  retrigger(row, 'bought');
  retrigger(row.querySelector('.lv'), 'pop');
  if (u.milestone && Math.floor(S.upg[id] / u.milestone) > Math.floor(lvl / u.milestone)) toast(`${u.name}: value doubled`, '', 'sparkle');
  quest('upgrade', n);
  refresh();
}
function initBuyMode() {
  const seg = $('#buy-mode');
  const apply = () => {
    seg.style.setProperty('--seg', S.buyMode);
    $$('button', seg).forEach(b => b.classList.toggle('on', +b.dataset.mode === S.buyMode));
  };
  $$('button', seg).forEach(b => b.addEventListener('click', () => {
    if (+b.dataset.mode === S.buyMode) return;
    S.buyMode = +b.dataset.mode;
    apply(); sfx.tap(); vibe(5);
    save(); updateUpgrades();
  }));
  apply();
}
function updateScene() {
  $('#scene-room').textContent = ROOMS[S.currentRoom].name;
}

// ---------------------------------------------------------------- ghost look: skins (colour / pattern only) + wardrobe
const BODY = 'M50 10C28 10 16 27 16 48v42c0 3 3 4.5 5.5 2.8L29 88l8 7c2 1.6 4.6 1.6 6.5 0L50 89.5l6.5 5.5c2 1.6 4.6 1.6 6.5 0l8-7 7.5 4.8C81 94.5 84 93 84 90V48C84 27 72 10 50 10z';
const currentSkin = () => SKINS.find(k => k.id === S.skin) || SKINS[0];
let gid = 0;

function skinFill(sk, id) {
  // everything here is clipped to the ghost body
  const b = sk.base, c2 = sk.ink2;
  switch (sk.pattern) {
    case 'dots': {
      let d = '';
      for (let y = 14; y < 100; y += 11) for (let x = (y % 22 ? 12 : 17); x < 90; x += 11) d += `<circle cx="${x}" cy="${y}" r="2.4"/>`;
      return `<rect x="0" y="0" width="100" height="110" fill="${b}"/><g fill="${c2}">${d}</g>`;
    }
    case 'stripes': {
      let d = '';
      for (let y = 16; y < 100; y += 13) d += `<rect x="0" y="${y}" width="100" height="5.5"/>`;
      return `<rect x="0" y="0" width="100" height="110" fill="${b}"/><g fill="${c2}" opacity=".45">${d}</g>`;
    }
    case 'tartan': {
      let d = '';
      for (let v = 8; v < 100; v += 22) d += `<rect x="${v}" y="0" width="8" height="110"/><rect x="0" y="${v}" width="100" height="8"/>`;
      return `<rect x="0" y="0" width="100" height="110" fill="${b}"/><g fill="${c2}" opacity=".32">${d}</g>` +
        `<g stroke="#f3dc9a" stroke-width=".8" opacity=".5">${[19, 41, 63, 85].map(v => `<path d="M${v} 0V110M0 ${v}H100"/>`).join('')}</g>`;
    }
    case 'stars': {
      const pts = [[30, 30], [62, 22], [70, 50], [40, 62], [26, 80], [58, 78], [76, 72], [48, 42]];
      const star = (x, y, r) => `<path d="M${x} ${y - r}q${r * 0.2} ${r * 0.8} ${r} ${r}q${-r * 0.8} ${r * 0.2} ${-r} ${r}q${-r * 0.2} ${-r * 0.8} ${-r} ${-r}q${r * 0.8} ${-r * 0.2} ${r} ${-r}z"/>`;
      return `<linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${b}"/><stop offset="1" stop-color="#6f7cc0"/></linearGradient>` +
        `<rect x="0" y="0" width="100" height="110" fill="url(#g${id})"/><g fill="${c2}">${pts.map(([x, y], i) => star(x, y, i % 3 ? 2.6 : 3.6)).join('')}</g>`;
    }
    case 'fade':
      return `<linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1"><stop offset=".2" stop-color="${b}"/><stop offset="1" stop-color="${c2}"/></linearGradient>` +
        `<rect x="0" y="0" width="100" height="110" fill="url(#g${id})"/>`;
    case 'wisps':
      return `<linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${b}"/><stop offset="1" stop-color="${c2}"/></linearGradient>` +
        `<rect x="0" y="0" width="100" height="110" fill="url(#g${id})"/>` +
        `<g fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="2.4" stroke-linecap="round"><path d="M24 70c8-6 14 6 22 0s14 6 22 0"/><path d="M30 84c6-4 10 4 16 0s10 4 16 0"/><path d="M60 30c4-4 10-2 12 3"/></g>`;
    default:
      return `<rect x="0" y="0" width="100" height="110" fill="${b}"/>`;
  }
}

// every item is drawn in the ghost's own 100×110 space (head top y≈10, eyes at 40/60, 47)
const ITEM_ART = {
  // ---- hats
  nightcap: `<path d="M26 22C27 8 40-1 57 0c13 1 23 8 30 19-7-4-14-5-20-3 5 3 8 6 9 8z" fill="#6b8fc4"/><path d="M37 7c6 3 9 8 10 14M53 1c5 5 8 11 8 19M69 4c3 4 5 9 6 16" stroke="#e9eef7" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".85"/><rect x="22" y="18" width="56" height="8" rx="4" fill="#e9eef7"/><circle cx="88" cy="21" r="5.5" fill="#e9eef7"/>`,
  party: `<path d="M36 22 50-12 64 22z" fill="#e8966a"/><path d="M44 3h12M40.5 13h19" stroke="#f3dc9a" stroke-width="3"/><circle cx="50" cy="-12" r="4" fill="#bfe8d6"/><ellipse cx="50" cy="22" rx="15" ry="3" fill="#c97a52"/>`,
  bucket: `<path d="M27 26 32-2h36l5 28z" fill="#8d93a0"/><path d="M52-2h16l5 28H55z" fill="#000" opacity=".13"/><ellipse cx="50" cy="-2" rx="18" ry="3.5" fill="#b4b8c2"/><rect x="25" y="22" width="50" height="5" rx="2.5" fill="#6b7080"/><path d="M31 8c-8 6-8 14-2 18" stroke="#6b7080" stroke-width="2" fill="none"/>`,
  witch: `<ellipse cx="50" cy="21" rx="33" ry="6" fill="#2a2433"/><path d="M35 20C40 4 48-10 56-18c1 6 4 10 10 12-4 8-2 18 0 26z" fill="#342c3f"/><path d="M36.5 14.5h28" stroke="#b392f0" stroke-width="5"/><rect x="46" y="11.5" width="7" height="6" fill="none" stroke="#e8b25c" stroke-width="1.6"/>`,
  tophat: `<ellipse cx="50" cy="20" rx="25" ry="5" fill="#1f1c24"/><rect x="35" y="-14" width="30" height="34" rx="2" fill="#2a2630"/><path d="M52-14h13v34H52z" fill="#000" opacity=".15"/><ellipse cx="50" cy="-14" rx="15" ry="3" fill="#35303c"/><rect x="35" y="10" width="30" height="5" fill="#8c2f3c"/>`,
  jester: `<path d="M24 24C20 14 13 10 8 12c4-7 17-6 24 6z" fill="#8c2f3c"/><path d="M34 22C38 8 44-4 50-10c6 6 12 18 16 32z" fill="#e8b25c"/><path d="M76 24c4-10 11-14 16-12-4-7-17-6-24 6z" fill="#8c2f3c"/><rect x="22" y="18" width="56" height="8" rx="4" fill="#3a2650"/><g fill="#f3dc9a"><circle cx="8" cy="12" r="3.5"/><circle cx="50" cy="-10" r="3.5"/><circle cx="92" cy="12" r="3.5"/></g>`,
  helm: `<path d="M18 40C18 16 32 4 50 4s32 12 32 36z" fill="#8f94a3"/><path d="M50 4c18 0 32 12 32 36H50z" fill="#000" opacity=".13"/><rect x="16" y="34" width="68" height="7" rx="3.5" fill="#6b7080"/><rect x="47.5" y="38" width="5" height="16" rx="2" fill="#6b7080"/><path d="M50 4c0-10 8-16 18-14-7 3-11 8-12 16z" fill="#c9675a"/><g fill="#c3c7d1"><circle cx="24" cy="37.5" r="1.3"/><circle cx="36" cy="37.5" r="1.3"/><circle cx="64" cy="37.5" r="1.3"/><circle cx="76" cy="37.5" r="1.3"/></g>`,
  wizard: `<ellipse cx="50" cy="21" rx="32" ry="6" fill="#34437d"/><path d="M34 20 52-26 66 20z" fill="#4a5ea8"/><path d="M52-26 66 20h-8z" fill="#000" opacity=".13"/><g fill="#f3dc9a"><path d="M47 0l1.2 3.3L51.5 4l-3.3 1.2L47 8.5l-1.2-3.3L42.5 4l3.3-.7z"/><path d="M56-10l.9 2.4 2.4.6-2.4.8-.9 2.4-.8-2.4-2.4-.8 2.4-.6z"/><path d="M58 11l.9 2.4 2.4.6-2.4.8-.9 2.4-.8-2.4-2.4-.8 2.4-.6z"/></g><path d="M42 16a4 4 0 1 1 4-6 3 3 0 1 0-4 6z" fill="#f3dc9a"/>`,
  crown: `<path d="M26 22 22-2l12 10 16-18 16 18 12-10-4 24z" fill="#e8b25c"/><path d="M50-10 66 8l12-10-4 24H50z" fill="#000" opacity=".1"/><rect x="25" y="20" width="50" height="7" rx="2" fill="#c99433"/><circle cx="50" cy="10" r="3.6" fill="#c9675a"/><circle cx="36" cy="15" r="2.5" fill="#74a9f2"/><circle cx="64" cy="15" r="2.5" fill="#74a9f2"/><g fill="#f3dc9a"><circle cx="22" cy="-2" r="2.8"/><circle cx="50" cy="-10" r="2.8"/><circle cx="78" cy="-2" r="2.8"/></g>`,
  candles: `<circle cx="50" cy="-8" r="14" fill="#f5c85a" opacity=".16"/><path d="M28 22h44l-4-6H32z" fill="#c99433"/><path d="M32 16c0-9 36-9 36 0" stroke="#c99433" stroke-width="3" fill="none"/><rect x="48.5" y="4" width="3" height="12" fill="#c99433"/><g fill="#efe8dc"><rect x="29" y="3" width="6" height="12" rx="1"/><rect x="47" y="-7" width="6" height="12" rx="1"/><rect x="65" y="3" width="6" height="12" rx="1"/></g><g fill="#f5c85a"><path d="M32-6c3 3 3 6 0 7-3-1-3-4 0-7z"/><path d="M50-16c3 3 3 6 0 7-3-1-3-4 0-7z"/><path d="M68-6c3 3 3 6 0 7-3-1-3-4 0-7z"/></g>`,
  // ---- masks
  glasses: `<g fill="rgba(255,255,255,.2)" stroke="#2a2433" stroke-width="2.4"><circle cx="40" cy="47" r="8"/><circle cx="60" cy="47" r="8"/></g><path d="M48 46q2-2 4 0M32 45l-13-3M68 45l13-3" stroke="#2a2433" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
  patch: `<path d="M18 38q22-2 36 3M66 41q8-4 17-7" stroke="#1d1a20" stroke-width="2.2" fill="none"/><ellipse cx="60" cy="47" rx="9" ry="8" fill="#1d1a20"/><path d="M55 43q5-2 9 1" stroke="#fff" stroke-opacity=".2" stroke-width="1.4" fill="none"/>`,
  monocle: `<circle cx="60" cy="47" r="8.5" fill="rgba(255,255,255,.22)" stroke="#e8b25c" stroke-width="2.2"/><path d="M60 55.5c-2 8 4 14 10 20" stroke="#e8b25c" stroke-width="1.2" fill="none" stroke-dasharray="2 1.5"/>`,
  shades: `<g fill="#1d1a20"><path d="M30 41h19v6c0 5-3.5 8-9.5 8S30 52 30 47z"/><path d="M51 41h19v6c0 5-3.5 8-9.5 8S51 52 51 47z"/></g><path d="M49 43h2M30 42l-11-2M70 42l11-2" stroke="#1d1a20" stroke-width="2.2" stroke-linecap="round"/><path d="M34 44l4 5M55 44l4 5" stroke="#fff" stroke-opacity=".35" stroke-width="1.6" stroke-linecap="round"/>`,
  masquerade: `<path fill-rule="evenodd" d="M24 42c6-8 18-9 26-4 8-5 20-4 26 4-2 10-10 15-18 13-4-1-6-4-8-6-2 2-4 5-8 6-8 2-16-3-18-13zM34 47a6 5 0 1 0 12 0a6 5 0 1 0-12 0zM54 47a6 5 0 1 0 12 0a6 5 0 1 0-12 0z" fill="#6a4a9c" stroke="#e8b25c" stroke-width="1.2"/>`,
  bandit: `<path fill-rule="evenodd" d="M17 40c10-3 56-3 66 0v12c-10 3-56 3-66 0zM34 47a6 5 0 1 0 12 0a6 5 0 1 0-12 0zM54 47a6 5 0 1 0 12 0a6 5 0 1 0-12 0z" fill="#1d1a20"/><path d="M17 44c-6 2-9 8-8 14M17 47c-4 4-4 10-1 14" stroke="#1d1a20" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  plague: `<path d="M22 52c0-15 12-23 28-23s28 8 28 23c0 3-3 6-8 6H30c-5 0-8-3-8-6z" fill="#5a4636"/><path d="M38 55c4-3 20-3 24 0L52 88c-1 3-3 3-4 0z" fill="#4a3a2c"/><path d="M50 56v30" stroke="#000" stroke-opacity=".18"/><g fill="#3a2e24"><circle cx="40" cy="46" r="6.5"/><circle cx="60" cy="46" r="6.5"/></g><g fill="#bfe8d6" opacity=".85"><circle cx="40" cy="46" r="4.5"/><circle cx="60" cy="46" r="4.5"/></g><g fill="#fff" opacity=".6"><circle cx="38.5" cy="44.5" r="1.2"/><circle cx="58.5" cy="44.5" r="1.2"/></g>`,
  skull: `<path d="M24 46c0-14 12-22 26-22s26 8 26 22c0 8-4 12-9 14v6c0 2-2 3-4 3H37c-2 0-4-1-4-3v-6c-5-2-9-6-9-14z" fill="#e9e3d6"/><path d="M50 24c14 0 26 8 26 22 0 8-4 12-9 14v6c0 2-2 3-4 3H50z" fill="#000" opacity=".07"/><g fill="#1d1a20"><ellipse cx="40" cy="46" rx="6" ry="6.5"/><ellipse cx="60" cy="46" rx="6" ry="6.5"/><path d="M50 52l3 5h-6z"/></g><path d="M40 62v6M45 62v7M50 62v7M55 62v7M60 62v6" stroke="#1d1a20" stroke-width="1.2" opacity=".6"/>`,
  phantom: `<path fill-rule="evenodd" d="M50 30c14 0 26 6 28 18 1 8-3 14-10 16-6 2-12 0-18-2zM54 47a6 5 0 1 0 12 0a6 5 0 1 0-12 0z" fill="#f4f0e8"/><path d="M50 30c14 0 26 6 28 18 1 8-3 14-10 16-6 2-12 0-18-2" fill="none" stroke="#e8b25c" stroke-width="1.3"/><path d="M52 36q10-1 18 5" stroke="#e8b25c" stroke-width=".9" fill="none" opacity=".7"/>`,
  goldmask: `<path d="M26 41C20 30 14 20 18 8c3 10 8 18 14 24M30 38C28 26 26 16 32 6c0 10 2 20 6 28" stroke="#b392f0" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M27 40C24 30 22 22 25 14" stroke="#9fe3c6" stroke-width="2.5" fill="none" stroke-linecap="round"/><path fill-rule="evenodd" d="M24 42c6-8 18-9 26-4 8-5 20-4 26 4-2 10-10 15-18 13-4-1-6-4-8-6-2 2-4 5-8 6-8 2-16-3-18-13zM34 47a6 5 0 1 0 12 0a6 5 0 1 0-12 0zM54 47a6 5 0 1 0 12 0a6 5 0 1 0-12 0z" fill="#e8b25c" stroke="#b98636" stroke-width="1.2"/><circle cx="50" cy="40" r="2.2" fill="#c9675a"/>`,
};

// neck slot: strings are front-only, objects have { back, front }
const along = (n, f) => Array.from({ length: n }, (_, i) => f(i / (n - 1))).join('');
const CAPE = 'M16 60C2 80 0 100 6 110h88c6-10 4-30-10-50z';
Object.assign(ITEM_ART, {
  scarf: `<path d="M15 70q35 12 70 0v9q-35 12-70 0z" fill="#c9675a"/><path d="M60 80l5 24h10l-3-24z" fill="#b95a4e"/><path d="M63 91h11M64 98h11" stroke="#efe8dc" stroke-width="2.4"/><path d="M26 73v9M38 76v9M62 76v9M74 73v9" stroke="#efe8dc" stroke-width="2.2" opacity=".85"/>`,
  bowtie: `<path d="M50 73l-12-8v16zM50 73l12-8v16z" fill="#8c2f3c"/><path d="M50 73l12-8v16z" fill="#000" opacity=".12"/><rect x="46.5" y="69.5" width="7" height="7" rx="2" fill="#6e2430"/>`,
  bandana: `<path d="M17 67q33 10 66 0l-31 26q-2 2-4 0z" fill="#4a6fa8"/><g fill="#efe8dc"><circle cx="40" cy="75" r="1.3"/><circle cx="50" cy="80" r="1.3"/><circle cx="60" cy="75" r="1.3"/><circle cx="50" cy="72" r="1.3"/><circle cx="45" cy="84" r="1.1"/><circle cx="55" cy="84" r="1.1"/></g>`,
  ruff: `<g fill="#f4f0e8" stroke="#d6cdbd" stroke-width="1">${along(12, t => { const x = 15 + 70 * t; return `<circle cx="${x.toFixed(1)}" cy="${(70 + (1 - Math.pow((x - 50) / 35, 2)) * 5).toFixed(1)}" r="5.4"/>`; })}</g>`,
  pearls: `<g fill="#f4f0e8">${along(13, t => { const x = (1 - t) ** 2 * 24 + 2 * (1 - t) * t * 50 + t * t * 76, y = (1 - t) ** 2 * 64 + 2 * (1 - t) * t * 86 + t * t * 64; return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.5"/>`; })}</g><path d="M50 76l3.5 5-3.5 5-3.5-5z" fill="#74a9f2"/>`,
  boa: `<path d="M14 70c16 12 56 12 72 0M18 72c-6 8-6 18-2 26" stroke="#e39ab8" stroke-width="9" fill="none" stroke-linecap="round"/><g fill="#f3bed3">${along(10, t => `<circle cx="${(16 + 68 * t).toFixed(1)}" cy="${(71 + Math.sin(t * Math.PI) * 8).toFixed(1)}" r="3"/>`)}</g>`,
  vampire: {
    back: `<path d="M20 62 6 24l26 22zM80 62 94 24 68 46z" fill="#1d1a20"/><path d="M20 58 10 31l17 15zM80 58 90 31 73 46z" fill="#8c2f3c"/><path d="${CAPE}" fill="#1d1a20"/><path d="M10 104c4-18 8-30 10-40M90 104c-4-18-8-30-10-40" stroke="#8c2f3c" stroke-width="3" fill="none"/>`,
    front: `<path d="M24 68q26 10 52 0" stroke="#b98636" stroke-width="1.5" fill="none"/><circle cx="50" cy="73" r="4" fill="#c9675a" stroke="#b98636" stroke-width="1.2"/>`,
  },
  herocape: {
    back: `<path d="M20 62C8 78 6 100 16 110l82-4c-6-16-8-32-18-44z" fill="#b8404a"/><path d="M34 108c2-14 2-28 0-40M60 108c2-14 4-28 2-40" stroke="#000" stroke-opacity=".14" stroke-width="3" fill="none"/>`,
    front: `<path d="M24 68q26 9 52 0" stroke="#e8b25c" stroke-width="1.6" fill="none"/><circle cx="24" cy="68" r="3.4" fill="#e8b25c"/><circle cx="76" cy="68" r="3.4" fill="#e8b25c"/>`,
  },
  mantle: {
    back: `<path d="${CAPE}" fill="#6a2a4a"/><path d="M6 110c2-6 5-8 8-8h72c3 0 6 2 8 8z" fill="#f4f0e8"/><g fill="#1d1a20"><circle cx="20" cy="106" r="1.2"/><circle cx="40" cy="106" r="1.2"/><circle cx="60" cy="106" r="1.2"/><circle cx="80" cy="106" r="1.2"/></g>`,
    front: `<path d="M14 64q36 16 72 0v9q-36 16-72 0z" fill="#f4f0e8"/><g fill="#1d1a20"><circle cx="24" cy="71" r="1.3"/><circle cx="37" cy="75" r="1.3"/><circle cx="50" cy="76" r="1.3"/><circle cx="63" cy="75" r="1.3"/><circle cx="76" cy="71" r="1.3"/></g><path d="M30 78q20 12 40 0" stroke="#e8b25c" stroke-width="2" fill="none"/><circle cx="50" cy="84" r="3.6" fill="#e8b25c"/><circle cx="50" cy="84" r="1.6" fill="#c9675a"/>`,
  },
  starcape: {
    back: `<path d="${CAPE}" fill="#2c3566"/><path d="M6 110c8-30 14-40 20-46M94 110c-8-30-14-40-20-46" stroke="#9fb0ec" stroke-opacity=".35" stroke-width="2" fill="none"/><g fill="#f4e2a8">${[[12, 96], [22, 80], [88, 90], [80, 76], [30, 104], [72, 104]].map(([x, y]) => `<path d="M${x} ${y - 2.6}l.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8z"/>`).join('')}</g>`,
    front: `<path d="M24 68q26 9 52 0" stroke="#dfe6f5" stroke-width="1.4" fill="none"/><path d="M46.5 70a5 5 0 1 0 7.5 5 4 4 0 1 1-7.5-5z" fill="#dfe6f5"/>`,
  },
});
const artFront = id => { const a = ITEM_ART[id]; return !a ? '' : typeof a === 'string' ? a : a.front; };
const artBack = id => { const a = ITEM_ART[id]; return a && typeof a === 'object' ? a.back : ''; };

function ghostSVG(skin, locked = false, opts = {}) {
  const id = ++gid;
  const ink = '#17151b';
  const items = opts.items || {};
  let face = `
    <ellipse cx="40" cy="47" rx="4.2" ry="5.6" fill="${ink}"/><ellipse cx="60" cy="47" rx="4.2" ry="5.6" fill="${ink}"/>
    <circle cx="41.3" cy="45" r="1.4" fill="#fff"/><circle cx="61.3" cy="45" r="1.4" fill="#fff"/>
    <ellipse cx="32" cy="57" rx="4.5" ry="2.4" fill="#e59aa8" opacity=".35"/><ellipse cx="68" cy="57" rx="4.5" ry="2.4" fill="#e59aa8" opacity=".35"/>`;
  let mouth = `<path d="M46 57q4 3.5 8 0" stroke="${ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  if (opts.boo) {
    face = face.replace(/rx="4.2" ry="5.6"/g, 'rx="5.2" ry="6.8"');
    mouth = `<ellipse cx="50" cy="64" rx="7.5" ry="10" fill="${ink}"/><ellipse cx="50" cy="69" rx="4.5" ry="4" fill="#c9675a" opacity=".8"/>`;
  }
  if (locked) { face = ''; mouth = ''; }
  const glow = skin.glow && !locked
    ? `<filter id="f${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter><path d="${BODY}" fill="${skin.glow}" opacity=".55" filter="url(#f${id})"/>`
    : '';
  const fill = locked ? `<rect x="0" y="0" width="100" height="110" fill="#2a2630"/>` : skinFill(skin, id);
  return `<svg xmlns="http://www.w3.org/2000/svg" class="ghost-svg" viewBox="0 -20 100 130" width="200" height="260">
    ${opts.noShadow ? '' : '<ellipse cx="50" cy="104" rx="22" ry="3.5" fill="#000" opacity=".28"/>'}
    <defs><clipPath id="c${id}"><path d="${BODY}"/></clipPath></defs>
    ${glow}
    ${!locked && items.neck ? artBack(items.neck) : ''}
    <g opacity="${skin.alpha || 1}">
      <g clip-path="url(#c${id})">${fill}</g>
      <path d="M16 60v30c0 3 3 4.5 5.5 2.8L29 88l8 7c2 1.6 4.6 1.6 6.5 0L50 89.5l6.5 5.5c2 1.6 4.6 1.6 6.5 0l8-7 7.5 4.8C81 94.5 84 93 84 90V60c-4 20-18 27-34 27S20 80 16 60z" fill="#000" opacity="${locked ? 0 : 0.07}"/>
    </g>
    ${!locked && items.neck ? artFront(items.neck) : ''}
    ${face}${mouth}
    ${!locked && items.mask ? artFront(items.mask) : ''}
    ${!locked && items.hat ? artFront(items.hat) : ''}
    ${locked ? `<text x="50" y="60" text-anchor="middle" font-size="24" font-weight="600" fill="#4a4550" font-family="Fraunces, serif">?</text>` : ''}
  </svg>`;
}
const ghostLook = () => ({ skin: currentSkin(), items: { ...S.equip } });
const ghostSig = () => `${S.skin}|${S.equip.hat}|${S.equip.mask}|${S.equip.neck}`;

// item preview tile: the item on a faint ghost silhouette
function itemSVG(it, locked) {
  const vb = { hat: '4 -28 92 62', mask: '12 22 76 68', neck: '0 54 100 58' }[it.slot];
  return `<svg viewBox="${vb}" class="item-svg"><g opacity="${locked ? 0.14 : 1}">${artBack(it.id)}</g><path d="${BODY}" fill="#2a2630"/>
    <g opacity="${locked ? 0.14 : 1}">${artFront(it.id)}</g></svg>`;
}
const slotOf = id => SLOTS.find(s => s.id === id);
const itemValue = (it, lvl) => slotOf(it.slot).vals[it.rarity] * (1 + 0.5 * (lvl - 1));
function itemBonus(stat) {
  let sum = 0;
  for (const s of SLOTS) {
    const id = S.equip[s.id];
    if (id && S.items[id] && s.stat === stat) sum += itemValue(ITEMS.find(x => x.id === id), S.items[id]);
  }
  return sum;
}

function chestSVG(ch) {
  if (window.Moonlit?.active && window.ScaremoreArt) return ScaremoreArt.chestMarkup(ch.id);
  const lidTop = ch.id === 'royal' ? '#6e3448' : '#7d5a40';
  const gems = ch.id === 'royal' ? `<circle cx="28" cy="15" r="2.2" fill="#74a9f2"/><circle cx="40" cy="12" r="2.6" fill="#c9675a"/><circle cx="52" cy="15" r="2.2" fill="#74a9f2"/>` : '';
  return `<svg class="chest" viewBox="0 0 80 64">
    <ellipse cx="40" cy="60" rx="30" ry="3.5" fill="#000" opacity=".35"/>
    <g class="chest-body">
      <rect x="8" y="28" width="64" height="30" rx="3" fill="${ch.wood}"/>
      <rect x="8" y="28" width="64" height="5" fill="#000" opacity=".2"/>
      <rect x="16" y="28" width="6" height="30" fill="${ch.band}"/><rect x="58" y="28" width="6" height="30" fill="${ch.band}"/>
      <rect x="8" y="53" width="64" height="5" rx="2" fill="${ch.band}"/>
    </g>
    <g class="chest-lid">
      <path d="M8 30V22C8 12 20 6 40 6s32 6 32 16v8z" fill="${lidTop}"/>
      <path d="M40 6c20 0 32 6 32 16v8H40z" fill="#000" opacity=".12"/>
      <rect x="16" y="8.5" width="6" height="21.5" fill="${ch.band}"/><rect x="58" y="8.5" width="6" height="21.5" fill="${ch.band}"/>
      <rect x="8" y="26" width="64" height="4" fill="${ch.band}"/>
      ${gems}
    </g>
    <g class="chest-lock"><rect x="35" y="24" width="10" height="11" rx="2" fill="${ch.trim}"/><circle cx="40" cy="29" r="1.6" fill="#1d1a20"/></g>
  </svg>`;
}

// ---------------------------------------------------------------- ghost page: preview, chests, wardrobe, colours
let wardrobeSlot = 'hat';
let heroSwap = false;
const ghostUpCost = lvl => 5 + lvl * 3;
function renderGhosts() {
  const skin = currentSkin();
  const lvl = S.ghostLevel;
  const owned = ITEMS.filter(i => S.items[i.id]).length;
  $('#ghost-count').textContent = `Level ${lvl} · ${owned} of ${ITEMS.length} items found`;
  const chips = [`<span class="bchip">${ic('up')}+${5 * lvl}% Frights</span>`];
  for (const s of SLOTS) {
    const id = S.equip[s.id];
    if (id && S.items[id]) {
      const it = ITEMS.find(x => x.id === id);
      chips.push(`<span class="bchip rc-${RARITIES[it.rarity].id}">${s.fmt(itemValue(it, S.items[id]))}</span>`);
    }
  }
  const slotItems = ITEMS.filter(i => i.slot === wardrobeSlot);

  $('#ghosts-content').innerHTML = `
    <div class="card ghost-hero stagger" style="--i:1;--gc:${skin.base}">
      <div class="hero-art ${heroSwap ? 'swap' : ''}">${ghostSVG(skin, false, { items: S.equip })}</div>
      <div class="hero-name">${skin.name}</div>
      <div class="bonus-chips">${chips.join('')}</div>
      <div class="hero-actions">
        <button class="btn lg${S.gems >= ghostUpCost(lvl) ? '' : ' muted'}" data-act="upgrade">Train ghost · Lv ${lvl + 1}<span class="sep"></span>${ic('gem')}${ghostUpCost(lvl)}</button>
      </div>
    </div>

    <div class="label stagger" style="--i:2">Chests</div>
    <div class="chest-row stagger" style="--i:3">
      ${CHESTS.map(ch => `
        <div class="card chest-card">
          <div class="chest-art">${chestSVG(ch)}</div>
          <h3>${ch.name}</h3>
          <div class="odds">${ch.odds.map((o, r) => o ? `<span class="rc-${RARITIES[r].id}">${o}%</span>` : '').join('')}</div>
          <button class="btn block${ch.id === 'royal' ? '' : ' secondary'}${S.gems >= ch.cost ? '' : ' muted'}" data-chest="${ch.id}">${ic('gem')}${ch.cost}</button>
        </div>`).join('')}
    </div>

    <div class="label stagger" style="--i:4">Wardrobe</div>
    <div class="segmented slot-tabs stagger" style="--i:5;--seg:${SLOTS.findIndex(s => s.id === wardrobeSlot)}">
      <span class="seg-thumb"></span>
      ${SLOTS.map(s => `<button data-slot="${s.id}" class="${s.id === wardrobeSlot ? 'on' : ''}">${s.name}</button>`).join('')}
    </div>
    <div class="item-grid stagger" style="--i:6">
      ${slotItems.map(it => {
        const l = S.items[it.id];
        const on = S.equip[it.slot] === it.id;
        return `<button class="itile rc-${RARITIES[it.rarity].id} ${l ? '' : 'locked'} ${on ? 'on' : ''}" data-item="${it.id}">
          ${on ? ic('check', 'ion') : ''}
          ${itemSVG(it, !l)}
          <span class="iname">${l ? it.name : '???'}</span>
          <span class="istat">${l ? slotOf(it.slot).fmt(itemValue(it, l)).replace(' window', '') : RARITIES[it.rarity].name}</span>
          ${l > 1 ? `<span class="ilv">Lv ${l}</span>` : ''}
        </button>`;
      }).join('')}
    </div>

    <div class="label stagger" style="--i:7">Colours</div>
    <div class="ghost-grid">
      ${SKINS.map((k, i) => {
        const own = !!S.skins[k.id];
        return `<button class="gtile stagger rc-${RARITIES[k.rarity].id} ${S.skin === k.id ? 'selected' : ''}" data-skin="${k.id}" style="--i:${i + 8}">
          <span class="rdot"></span>
          ${S.skin === k.id ? ic('check', 'gactive') : ''}
          ${ghostSVG(k, false, { items: S.equip })}
          <span class="gname">${k.name}</span>
          <span class="gsub">${own ? (S.skin === k.id ? 'Wearing' : 'Owned') : `${ic('gem')}${k.cost}`}</span>
        </button>`;
      }).join('')}
    </div>`;
  heroSwap = false;

  $('#ghosts-content [data-act="upgrade"]').addEventListener('click', e => {
    const b = e.currentTarget;
    if (!spend('gems', ghostUpCost(S.ghostLevel), b)) return;
    S.ghostLevel++;
    sfx.buy(); vibe(8);
    save(); refresh();
    motes($('.hero-art'), 'var(--fright)', 12, 70);
  });
  $$('#ghosts-content [data-chest]').forEach(b => b.addEventListener('click', () => openChest(b.dataset.chest, b)));
  $$('#ghosts-content [data-slot]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.slot === wardrobeSlot) return;
    wardrobeSlot = b.dataset.slot;
    sfx.tap(); vibe(5);
    renderGhosts();
  }));
  $$('#ghosts-content [data-item]').forEach(t => t.addEventListener('click', () => {
    const it = ITEMS.find(x => x.id === t.dataset.item);
    if (!S.items[it.id]) { retrigger(t, 'nudge'); sfx.tap(); toast(`Find it in a chest · ${RARITIES[it.rarity].name}`, '', 'sparkle'); return; }
    S.equip[it.slot] = S.equip[it.slot] === it.id ? null : it.id;
    heroSwap = true;
    sfx.toggle(!!S.equip[it.slot]); vibe(6);
    save(); refresh();
  }));
  $$('#ghosts-content [data-skin]').forEach(t => t.addEventListener('click', () => {
    const k = SKINS.find(x => x.id === t.dataset.skin);
    if (!S.skins[k.id]) {
      if (!spend('gems', k.cost, t)) return;
      S.skins[k.id] = true;
      sfx.rarity(k.rarity); vibe(15);
      toast(`${k.name} unlocked`, '', 'ghost');
    } else if (S.skin === k.id) return;
    else { sfx.toggle(true); vibe(6); }
    S.skin = k.id;
    heroSwap = true;
    save(); refresh();
  }));
}

function rollItem(chest) {
  let roll = Math.random() * 100, r = 0;
  for (let i = 0; i < 4; i++) { roll -= chest.odds[i]; if (roll < 0) { r = i; break; } }
  const pool = ITEMS.filter(i => i.rarity === r);
  return pool[Math.floor(Math.random() * pool.length)];
}
function openChest(chestId, btn) {
  if ($('.chest-open')) return;
  const ch = CHESTS.find(c => c.id === chestId);
  if (!spend('gems', ch.cost, btn)) return;
  const it = rollItem(ch);
  const before = S.items[it.id] || 0;
  let note;
  if (!before) { S.items[it.id] = 1; note = 'New!'; }
  else if (before < 5) { S.items[it.id] = before + 1; note = `Duplicate · upgraded to Lv ${before + 1}`; }
  else { const refund = Math.round(ch.cost * 0.3); S.gems += refund; note = `Max level · +${refund} gems back`; }
  save();
  const r = RARITIES[it.rarity];
  const el = document.createElement('div');
  el.className = `reveal chest-open rc-${r.id}`;
  const illustrated = !!(window.Moonlit?.active && window.ScaremoreArt);
  if (illustrated) el.dataset.art = 'storybook';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', ch.name);
  el.innerHTML = `
    <div class="reveal-title">${ch.name}</div>
    <div class="chest-stage">
      <div class="chest-glow"></div>
      <div class="chest-big">${chestSVG(ch)}</div>
      <div class="loot">
        <div class="loot-ghost">${ghostSVG(currentSkin(), false, { items: { ...S.equip, [it.slot]: it.id } })}</div>
      </div>
    </div>
    <div class="loot-info">
      <span class="rarity">${r.name} · ${slotOf(it.slot).name.slice(0, -1)}</span>
      <h3>${it.name}</h3>
      <p>${slotOf(it.slot).fmt(itemValue(it, S.items[it.id]))} · ${note}</p>
    </div>
    <div class="reveal-actions"><button type="button" class="tap-open">Tap to open</button></div>`;
  app.appendChild(el);
  const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 250); refresh(); };
  let opened = false;
  el.addEventListener('click', async e => {
    if (opened || (e.target.closest('button') && !e.target.closest('.tap-open'))) return;
    opened = true;
    $('.tap-open', el).disabled = true;
    el.classList.add('shaking');
    const reduced = !!(illustrated && ScaremoreArt.reduced);
    (illustrated ? (reduced ? [0] : [0, 140, 270]) : [0, 150, 300, 450]).forEach((t, i) => setTimeout(() => { sfx.chest(i); vibe(5); }, t));
    const sprite = $('scaremore-chest', el);
    if (sprite) await sprite.play();
    else await new Promise(resolve => setTimeout(resolve, 650));
    if (!el.isConnected) return;
    {
      el.classList.remove('shaking');
      el.classList.add('opened');
      sfx.rarity(it.rarity); vibe(it.rarity >= 2 ? [20, 40, 30] : 15);
      if (it.rarity === 3) retrigger(app, 'shake');
      if (it.rarity >= 2) setTimeout(() => motes($('.loot', el), `var(--${r.id})`, it.rarity === 3 ? 18 : 10, 80), 250);
      const wearing = S.equip[it.slot] === it.id;
      $('.reveal-actions', el).innerHTML = wearing
        ? `<button class="btn lg" data-close>Collect</button>`
        : `<button class="btn lg secondary" data-close>Keep</button><button class="btn lg" data-equip>Wear it</button>`;
      $('[data-close]', el).addEventListener('click', () => { sfx.tap(); close(); });
      const eq = $('[data-equip]', el);
      if (eq) eq.addEventListener('click', () => { S.equip[it.slot] = it.id; heroSwap = true; save(); sfx.buy(); close(); });
      $('[data-close]', el).focus({ preventScroll: true });
    }
  });
  $('.tap-open', el).focus({ preventScroll: true });
}

// ---------------------------------------------------------------- castle page + séance (prestige)
const SEANCE_ROOM = 3; // Wizard Tower must be unlocked
const ectoGain = () => Math.floor(Math.sqrt(S.lifetime / 1e7));
function renderCastle() {
  const rooms = ROOMS.map((r, i) => ({ r, i })).reverse();
  const gainNow = ectoGain();
  const canSeance = S.rooms > SEANCE_ROOM && gainNow >= 1;
  $('#castle-content').innerHTML = `
    <div class="card progress-card stagger" style="--i:1">
      <div class="top"><b>${S.rooms} of ${ROOMS.length} rooms</b><span>haunted</span></div>
      <div class="bar"><i style="--p:${S.rooms / ROOMS.length}"></i></div>
    </div>
    <div class="label stagger" style="--i:2">Rooms</div>
    <div class="timeline">
      ${rooms.map(({ r, i }, k) => {
        const unlocked = i < S.rooms, isCur = i === S.currentRoom, isNext = i === S.rooms;
        const cls = [unlocked ? 'reached' : 'locked', isCur ? 'current' : ''].join(' ');
        let action;
        if (isCur) action = `<span class="here">Here</span>`;
        else if (unlocked) action = `<button class="btn secondary" data-visit="${i}">Visit</button>`;
        else if (isNext) action = `<button class="btn${S.frights >= r.cost ? '' : ' muted'}" data-unlock="${i}">${ic('fright')}${fmt(r.cost)}</button>`;
        else action = ic('lock', 'lock');
        return `<div class="room ${cls} stagger" style="--i:${k + 3}">
          <div class="node">${ic(r.icon)}</div>
          <div><h3>${r.name}</h3><p>${r.desc}</p><div class="mult">×${ROOM_MULT[i]} Frights</div></div>
          ${action}
        </div>`;
      }).join('')}
    </div>
    <div class="label stagger" style="--i:9">Séance</div>
    <div class="card seance stagger" style="--i:10">
      <div class="seance-top">
        <div class="tile" style="--c:#9fe3c6">${ic('ecto')}</div>
        <div>
          <h3>Séance</h3>
          <p>Release the castle for Ectoplasm. Each one adds <b>+10%</b> Frights forever.</p>
        </div>
      </div>
      <div class="seance-stats">
        <div><small>Ectoplasm</small><b>${fmt(S.ecto)}</b><span>×${fmtX(1 + 0.1 * S.ecto)} Frights</span></div>
        <div><small>On séance</small><b class="gain">+${fmt(gainNow)}</b><span>${S.rooms > SEANCE_ROOM ? 'from ' + fmt(S.lifetime) + ' Frights' : 'Unlock the Wizard Tower first'}</span></div>
      </div>
      <button class="btn block${canSeance ? '' : ' muted'}" data-seance>${ic('ecto')}Hold a séance</button>
    </div>
    ${visitorGuide()}`;
  $$('#castle-content [data-visit]').forEach(b => b.addEventListener('click', () => {
    S.currentRoom = +b.dataset.visit;
    sfx.tab(); vibe(8);
    toast(`Now haunting ${ROOMS[S.currentRoom].name}`, '', 'castle');
    save(); refresh();
  }));
  $$('#castle-content [data-unlock]').forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.unlock;
    if (!spend('frights', ROOMS[i].cost, b)) return;
    S.rooms = i + 1; S.currentRoom = i;
    sfx.rarity(3); vibe([20, 50, 30]);
    save(); refresh();
    const node = $$('#castle-content .room.current .node')[0];
    if (node) motes(node, 'var(--accent)', 16, 70);
    toast(`${ROOMS[i].name} unlocked`, '', 'sparkle');
  }));
  $('#castle-content [data-seance]').addEventListener('click', e => {
    if (S.rooms <= SEANCE_ROOM) return fail(e.currentTarget, 'Unlock the Wizard Tower first');
    if (ectoGain() < 1) return fail(e.currentTarget, 'Earn more Frights first');
    confirmSeance();
  });
}
function visitorGuide() {
  const K = window.Scaremore && window.Scaremore.KINDS;
  if (!K) return '';
  const names = ['Common', 'Rare', 'Epic', 'Legendary'];
  const seen = S.seen || {};
  const rows = Object.entries(K).map(([id, k]) => {
    const known = seen[id];
    const img = known && window.Scaremore.portrait ? `<img src="${window.Scaremore.portrait(id)}" alt="">` : `<span class="unknown">?</span>`;
    return `<div class="visitor ${known ? '' : 'locked'}" style="--rc:${window.Scaremore.RARITY_COLORS[k.rarity]}">
      <div class="portrait">${img}</div>
      <div>
        <h3>${known ? k.name : 'Undiscovered'}<span class="rar">${names[k.rarity]}</span></h3>
        <p>${known ? k.desc : `Appears in ${ROOMS[k.room].name}.`}</p>
      </div>
    </div>`;
  }).join('');
  const found = Object.keys(K).filter(id => seen[id]).length;
  return `<div class="label">Visitor guide · ${found}/${Object.keys(K).length}</div><div class="card list guide">${rows}</div>`;
}
function confirmSeance() {
  sfx.tap();
  const g = ectoGain();
  openSheet(`
    <h2>Hold a séance?</h2>
    <p class="sheet-text">Your Frights, upgrades and rooms fade away. Gems, cards, ghosts and shop upgrades stay.</p>
    <div class="seance-sum">${ic('ecto')}<b>+${fmt(g)} Ectoplasm</b><span>×${fmtX(1 + 0.1 * S.ecto)} → ×${fmtX(1 + 0.1 * (S.ecto + g))} Frights</span></div>
    <div class="actions"><button class="btn ghost" data-cancel>Not yet</button><button class="btn" data-go>Begin séance</button></div>`,
  (sh, close) => {
    $('[data-cancel]', sh).addEventListener('click', close);
    $('[data-go]', sh).addEventListener('click', () => {
      close();
      S.ecto += g; S.seances++;
      S.frights = 0; S.lifetime = 0;
      S.upg = freshState().upg;
      S.rooms = 1; S.currentRoom = 0;
      shown.frights = 0; renderCurrencyNow();
      const f = document.createElement('div');
      f.className = 'seance-flash';
      app.appendChild(f);
      f.addEventListener('animationend', () => f.remove());
      sfx.rarity(3); vibe([30, 60, 30]);
      save(); refresh();
      toast(`The spirits grow stronger: +${fmt(g)} Ectoplasm`, '', 'ecto');
    });
  });
}

// ---------------------------------------------------------------- quests
const QUEST_TYPES = [
  { id: 'scare', icon: 'ghost', base: 12, text: n => `Scare ${n} visitors` },
  { id: 'perfect', icon: 'target', base: 5, text: n => `Land ${n} Perfect scares` },
  { id: 'combo', icon: 'sparkle', base: 4, best: true, text: n => `Reach a ×${n} combo` },
  { id: 'upgrade', icon: 'up', base: 10, text: n => `Buy ${n} upgrade levels` },
  { id: 'police', icon: 'shield', base: 2, text: n => `Scare ${n} police officers` },
  { id: 'photo', icon: 'camera', base: 2, text: n => `Photobomb ${n} photographers` },
  { id: 'haunt', icon: 'moon', base: 1, text: n => `Start ${n} Haunting Hour${n > 1 ? 's' : ''}` },
  { id: 'group', icon: 'group', base: 3, best: true, room: 1, text: n => `Scare ${n} visitors with one tap` },
  { id: 'jogger', icon: 'bolt', base: 3, room: 1, text: n => `Scare ${n} joggers` },
  { id: 'skeptic', icon: 'people', base: 2, room: 2, text: n => `Convince ${n} skeptics` },
  { id: 'kid', icon: 'people', base: 3, text: n => `Make ${n} kids drop their ice cream` },
  { id: 'hunter', icon: 'target', base: 1, room: 3, text: n => `Perfect-scare ${n} ghost hunter${n > 1 ? 's' : ''}` },
  { id: 'royal', icon: 'crown', base: 1, room: 4, text: n => `Send ${n} royal${n > 1 ? 's' : ''} running` },
];
function newQuest() {
  const taken = S.quests.map(q => q.id);
  const pool = QUEST_TYPES.filter(t => !taken.includes(t.id) && (t.room || 0) < S.rooms);
  const t = pool[Math.floor(Math.random() * pool.length)];
  const done = S.questsDone;
  const n = t.best ? t.base + Math.floor(done / 2) : Math.max(t.base + Math.floor(done / 3), Math.round(t.base * (1 + done * 0.15)));
  return { id: t.id, n, p: 0, reward: Math.min(15, 3 + Math.floor(done / 2)) };
}
function ensureQuests() {
  while (S.quests.length < 3) S.quests.push(newQuest());
}
function quest(id, value = 1) {
  let changed = false;
  for (const q of S.quests) {
    if (q.id !== id || q.p >= q.n) continue;
    const t = QUEST_TYPES.find(x => x.id === id);
    const before = q.p;
    q.p = Math.min(q.n, t.best ? Math.max(q.p, value) : q.p + value);
    if (q.p !== before) changed = true;
    if (q.p >= q.n && before < q.n) toast('Quest complete', '', 'check');
  }
  if (changed) { save(); renderQuests(); updateBadges(); }
}
function renderQuests() {
  ensureQuests();
  const list = $('#quest-list');
  list.innerHTML = S.quests.map((q, i) => {
    const t = QUEST_TYPES.find(x => x.id === q.id);
    const done = q.p >= q.n;
    return `<div class="upg quest ${done ? 'done' : ''}">
      <div class="tile" style="--c:${done ? '#9fe3c6' : '#e8b25c'}">${ic(t.icon)}</div>
      <div class="upg-body">
        <div class="upg-name">${t.text(q.n)}</div>
        <div class="upg-desc">${fmt(q.p)} / ${fmt(q.n)}</div>
        <div class="meter"><i style="--p:${q.p / q.n}"></i></div>
      </div>
      <button class="btn${done ? '' : ' muted'}" data-claim="${i}">${ic('gem')}${q.reward}</button>
    </div>`;
  }).join('') + `<p class="quest-foot">${S.questsDone} quests completed · every quest gets a bit harder</p>`;
  $$('[data-claim]', list).forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.claim, q = S.quests[i];
    if (q.p < q.n) return fail(b, 'Not finished yet');
    gain('gems', q.reward, b);
    motes(b, 'var(--gem)', 10, 50);
    sfx.rarity(1); vibe(12);
    S.questsDone++;
    S.quests.splice(i, 1);
    S.quests.push(newQuest());
    save(); renderQuests(); updateBadges();
  }));
}
const questsClaimable = () => S.quests.some(q => q.p >= q.n);
let panel = 'upgrades';
function initPanelTabs() {
  const tabs = $$('#panel-tabs button');
  tabs.forEach(b => b.addEventListener('click', () => {
    const to = b.dataset.panel;
    if (to === panel) return;
    panel = to;
    tabs.forEach(x => x.classList.toggle('on', x === b));
    const show = $(to === 'quests' ? '#quest-list' : '#upgrade-list');
    const hide = $(to === 'quests' ? '#upgrade-list' : '#quest-list');
    hide.hidden = true; show.hidden = false;
    show.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: EASE.soft });
    $('#buy-mode').classList.toggle('away', to === 'quests');
    if (to === 'quests') renderQuests();
    sfx.tap(); vibe(5);
  }));
}

// ---------------------------------------------------------------- cards page
const cardCounts = id => S.cards[id] || [0, 0, 0, 0];
const cardTotal = c => cardCounts(c.id).reduce((sum, n, ri) => sum + n * (c.vals[ri] || 0), 0);
const PACKS = [
  { id: 'spooky', name: 'Spooky Pack', odds: [60, 28, 10, 2], cost: [10, 25] },
  { id: 'cursed', name: 'Cursed Pack', odds: [15, 45, 30, 10], cost: [30, 75] },
];
function renderCards() {
  $('#cards-content').innerHTML = `
    <div class="pack-row stagger" style="--i:1">
      ${PACKS.map(pk => `
        <div class="card pack-card ${pk.id}">
          <div class="pack">${ic(pk.id === 'cursed' ? 'skullp' : 'ghost')}<span>${pk.name}</span></div>
          <div class="odds">${pk.odds.map((o, r) => `<span class="rc-${RARITIES[r].id}">${o}%</span>`).join('')}</div>
          <div class="pack-buttons">
            <button class="btn secondary" data-open="1" data-pack="${pk.id}">Open 1<small>${ic('gem')}${pk.cost[0]}</small></button>
            <button class="btn${pk.id === 'cursed' ? ' cursed' : ''}" data-open="3" data-pack="${pk.id}">Open 3<small>${ic('gem')}${pk.cost[1]}</small></button>
          </div>
        </div>`).join('')}
    </div>
    <div class="label stagger" style="--i:2">Collection</div>
    <div class="card-grid">
      ${CARDS.map((c, i) => {
        const cnt = cardCounts(c.id);
        const best = cnt.reduce((b, n, ri) => (n > 0 ? ri : b), -1);
        const known = best >= 0;
        return `<div class="ccard stagger ${known ? `rc-${RARITIES[best].id}` : 'unknown'}" style="--i:${i + 3}">
          <div class="tile">${ic(known ? c.icon : 'lock')}</div>
          <div class="ccard-name">${c.name}</div>
          <div class="ccard-total">${known ? c.fmt(cardTotal(c)) : 'Not found yet'}</div>
          <div class="pips">${RARITIES.map((r, ri) =>
            `<span class="pip rc-${r.id} ${c.vals[ri] == null ? 'na' : cnt[ri] ? '' : 'zero'}">${c.vals[ri] == null ? '–' : cnt[ri]}</span>`).join('')}</div>
        </div>`;
      }).join('')}
    </div>`;
  $$('#cards-content [data-open]').forEach(b => b.addEventListener('click', () => openPack(+b.dataset.open, b, b.dataset.pack)));
}
function rollCard(pack) {
  const roll = Math.random() * 100;
  let acc = 0, ri = 0;
  for (let i = 0; i < 4; i++) { acc += pack.odds[i]; if (roll < acc) { ri = i; break; } }
  const pool = CARDS.filter(c => c.vals[ri] != null);
  return { card: pool[Math.floor(Math.random() * pool.length)], ri };
}
function openPack(n, btn, packId = 'spooky') {
  const pack = PACKS.find(p => p.id === packId);
  if (!spend('gems', pack.cost[n === 1 ? 0 : 1], btn)) return;
  const pulls = Array.from({ length: n }, () => rollCard(pack));
  for (const p of pulls) {
    const cnt = cardCounts(p.card.id).slice();
    cnt[p.ri]++;
    S.cards[p.card.id] = cnt;
  }
  save();
  vibe(10);
  showReveal(pulls);
}
function showReveal(pulls) {
  const el = document.createElement('div');
  el.className = 'reveal';
  el.innerHTML = `
    <div class="reveal-title">Tap to reveal</div>
    <div class="pull-row ${pulls.length === 1 ? 'one' : ''}">
      ${pulls.map((p, i) => {
        const r = RARITIES[p.ri];
        return `<div class="pull rc-${r.id}" data-r="${r.id}" style="--i:${i}">
          <div class="pull-inner">
            <div class="back">${ic('ghost')}</div>
            <div class="face">
              <div class="tile">${ic(p.card.icon)}</div>
              <div class="f-name">${p.card.name}</div>
              <div class="f-val">${p.card.fmt(p.card.vals[p.ri])}</div>
              <div class="f-rarity">${r.name}</div>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>
    <div class="reveal-actions">${pulls.length > 1 ? '<button class="btn lg secondary" data-reveal>Reveal all</button>' : ''}</div>`;
  app.appendChild(el);

  const cards = $$('.pull', el);
  let revealed = 0;
  const reveal = (c, idx) => {
    if (c.classList.contains('flipped')) return;
    c.classList.add('flipped');
    revealed++;
    const p = pulls[idx];
    sfx.flip(); vibe(6);
    setTimeout(() => {
      sfx.rarity(p.ri);
      if (p.ri >= 2) {
        motes(c, `var(--${RARITIES[p.ri].id})`, p.ri === 3 ? 18 : 10, p.ri === 3 ? 90 : 60);
        vibe(p.ri === 3 ? [20, 60, 40] : 15);
      }
      if (p.ri === 3) retrigger(app, 'shake');
    }, 320);
    if (revealed === cards.length) {
      $('.reveal-title', el).textContent = pulls.length > 1 ? 'Added to your collection' : 'Added to your collection';
      $('.reveal-actions', el).innerHTML = `<button class="btn lg" data-collect>Collect</button>`;
      $('[data-collect]', el).addEventListener('click', () => {
        sfx.tap();
        el.classList.add('out');
        setTimeout(() => el.remove(), 250);
        refresh();
      });
    }
  };
  cards.forEach((c, i) => c.addEventListener('click', () => reveal(c, i)));
  const all = $('[data-reveal]', el);
  if (all) all.addEventListener('click', () => cards.forEach((c, i) => setTimeout(() => reveal(c, i), i * 220)));
}

// ---------------------------------------------------------------- shop page
function fmtTime(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
function renderShop() {
  const ready = Date.now() >= S.dailyAt;
  $('#shop-content').innerHTML = `
    <div class="card daily stagger ${ready ? 'ready' : ''}" style="--i:1">
      <div class="tile">${ic('gift')}</div>
      <div><h3>Castle gift</h3><p id="daily-text">${ready ? 'A new gift every 10 minutes.' : `Next gift in ${fmtLeft(S.dailyAt - Date.now())}`}</p></div>
      ${ready ? `<button class="btn" data-daily>Claim</button>` : `<button class="btn done">${ic('check')}</button>`}
    </div>
    <div class="label stagger" style="--i:2">Potions</div>
    <div class="card list stagger" style="--i:3">
      ${POTIONS.map(p => {
        const left = potionLeft(p.id);
        return `<div class="list-row potion ${left ? 'active' : ''}">
          <div class="tile" style="--c:${p.color}">${ic('potion')}</div>
          <div><h3>${p.name}</h3><p>${p.desc} · ${fmtDur(p.dur)}${left ? ` · <b class="pleft" data-left="${p.id}">${fmtLeft(left)}</b>` : ''}</p></div>
          <button class="btn${S.gems >= p.cost ? '' : ' muted'}" data-potion="${p.id}">${left ? 'Extend' : ''}${left ? '<span class="sep"></span>' : ''}${ic('gem')}${p.cost}</button>
        </div>`;
      }).join('')}
    </div>
    <div class="label stagger" style="--i:4">Special upgrades</div>
    <div class="card list stagger" style="--i:5">
      ${SPECIALS.map(s => {
        const owned = !!S.shop[s.id];
        return `<div class="list-row">
          <div class="tile" style="--c:${s.color}">${ic(s.icon)}</div>
          <div><h3>${s.name}</h3><p>${s.desc}</p></div>
          ${owned
            ? `<button class="btn done">${ic('check')}Owned</button>`
            : `<button class="btn${S.gems >= s.cost ? '' : ' muted'}" data-special="${s.id}">${ic('gem')}${s.cost}</button>`}
        </div>`;
      }).join('')}
    </div>`;
  const d = $('[data-daily]');
  if (d) d.addEventListener('click', () => {
    const st = stats();
    gain('gems', 3, d);
    gain('frights', Math.max(50, Math.round(st.base * st.mult * 15)));
    motes(d, 'var(--gem)', 10, 50);
    sfx.rarity(1); vibe(12);
    S.dailyAt = Date.now() + 10 * 60 * 1000;
    save(); refresh();
  });
  $$('#shop-content [data-potion]').forEach(b => b.addEventListener('click', () => {
    const p = POTIONS.find(x => x.id === b.dataset.potion);
    if (!spend('gems', p.cost, b)) return;
    S.potions[p.id] = Math.max(Date.now(), S.potions[p.id] || 0) + p.dur * 1000;
    sfx.rarity(1); vibe(12);
    motes(b.closest('.list-row').querySelector('.tile'), p.color, 10, 40);
    toast(`${p.name}: ${p.desc} for ${fmtDur(p.dur)}`, '', 'potion');
    save(); refresh();
  }));
  $$('#shop-content [data-special]').forEach(b => b.addEventListener('click', () => {
    const s = SPECIALS.find(x => x.id === b.dataset.special);
    if (!spend('gems', s.cost, b)) return;
    S.shop[s.id] = true;
    sfx.rarity(2); vibe(15);
    toast(`${s.name} unlocked`, '', 'check');
    save(); refresh();
  }));
}
// active potions under the level bar
let buffSig = '';
function renderBuffs() {
  const active = POTIONS.filter(p => potionLeft(p.id) > 0);
  const sig = active.map(p => p.id).join();
  const box = $('#buffs');
  if (sig !== buffSig) {
    buffSig = sig;
    box.innerHTML = active.map(p => `<span class="buff" style="--c:${p.color}" title="${p.name}">${ic('potion')}<b data-buff="${p.id}"></b></span>`).join('');
    if (sig) refresh();
  }
  for (const p of active) { const el = box.querySelector(`[data-buff="${p.id}"]`); if (el) el.textContent = fmtLeft(potionLeft(p.id)); }
  $$('[data-left]').forEach(el => { el.textContent = fmtLeft(potionLeft(el.dataset.left)); });
}
setInterval(() => {
  renderBuffs();
  const t = $('#daily-text');
  if (!t) return;
  if (Date.now() >= S.dailyAt) { if (t.textContent.startsWith('Next')) refresh(); return; }
  t.textContent = `Next gift in ${fmtLeft(S.dailyAt - Date.now())}`;
}, 1000);

// ---------------------------------------------------------------- settings sheet
function openSheet(html, onMount) {
  const bd = document.createElement('div');
  bd.className = 'sheet-backdrop';
  const sh = document.createElement('div');
  sh.className = 'sheet';
  sh.innerHTML = `<div class="sheet-handle"></div>${html}`;
  app.append(bd, sh);
  requestAnimationFrame(() => { bd.classList.add('open'); sh.classList.add('open'); });
  const close = () => {
    sh.classList.add('closing');
    sh.classList.remove('open'); bd.classList.remove('open');
    setTimeout(() => { bd.remove(); sh.remove(); }, 300);
  };
  bd.addEventListener('click', close);

  // drag down to dismiss
  let startY = null, dy = 0;
  sh.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    startY = e.clientY; dy = 0;
    sh.style.transition = 'none';
    sh.setPointerCapture(e.pointerId);
  });
  sh.addEventListener('pointermove', e => {
    if (startY == null) return;
    dy = Math.max(0, e.clientY - startY);
    sh.style.transform = `translateY(${dy}px)`;
  });
  sh.addEventListener('pointerup', () => {
    if (startY == null) return;
    startY = null;
    sh.style.transition = ''; sh.style.transform = '';
    if (dy > 80) close();
  });
  if (onMount) onMount(sh, close);
}
function openSettings() {
  sfx.tap(); vibe(5);
  const row = (key, icon, label) => `<div class="row-setting">${ic(icon)}<span>${label}</span><button class="switch ${S.settings[key] ? 'on' : ''}" data-set="${key}" aria-label="${label}"></button></div>`;
  openSheet(`
    <h2>Settings</h2>
    ${row('sound', 'sound', 'Sound')}
    ${row('music', 'music', 'Music')}
    ${row('vibe', 'vibrate', 'Vibration')}
    <div class="row-setting">${ic('sparkle')}<span>Numbers</span>
      <div class="segmented two" id="notation" style="--seg:${S.settings.notation === 'sci' ? 1 : 0}">
        <span class="seg-thumb"></span>
        <button data-n="short" class="${S.settings.notation !== 'sci' ? 'on' : ''}">1.5Qi</button>
        <button data-n="sci" class="${S.settings.notation === 'sci' ? 'on' : ''}">1.5e18</button>
      </div>
    </div>
    <div class="actions">
      <button class="btn secondary" data-dev>Dev: add currency</button>
      <button class="btn ghost" data-reset>Reset</button>
    </div>
    <p class="credits">Castle Scaremore · UI prototype · Slapjam 2026<br>Made with AI tools: Claude Code</p>`,
  (sh, close) => {
    $$('[data-set]', sh).forEach(t => t.addEventListener('click', () => {
      const k = t.dataset.set;
      S.settings[k] = !S.settings[k];
      t.classList.toggle('on', S.settings[k]);
      sfx.toggle(S.settings[k]);
      if (k === 'vibe' && S.settings.vibe) vibe(15);
      save();
    }));
    $$('#notation button', sh).forEach(b => b.addEventListener('click', () => {
      S.settings.notation = b.dataset.n;
      $('#notation', sh).style.setProperty('--seg', b.dataset.n === 'sci' ? 1 : 0);
      $$('#notation button', sh).forEach(x => x.classList.toggle('on', x === b));
      sfx.toggle(true);
      renderCurrencyNow(); save(); refresh();
    }));
    $('[data-dev]', sh).addEventListener('click', e => {
      gain('frights', 50000, e.currentTarget); gain('gems', 100);
      sfx.buy(); refresh();
    });
    $('[data-reset]', sh).addEventListener('click', () => {
      const settings = S.settings;
      S = freshState(); S.settings = settings;
      Object.assign(shown, { frights: S.frights, gems: S.gems });
      renderCurrencyNow();
      $('#buy-mode').style.setProperty('--seg', 0);
      $$('#buy-mode button').forEach(b => b.classList.toggle('on', b.dataset.mode === '0'));
      save(); refresh(); close();
      toast('Progress reset');
    });
  });
}

// ---------------------------------------------------------------- title screen
// Two title stages use aligned layers: the original SVG silhouette and the Moonlit painted plates.
// same 400×760 viewBox inside a fixed-aspect stage, so layers line up exactly while the intro
// Motion stays on whole layers (GPU-composited, with no per-frame SVG or bitmap repaint).
function buildSplash() {
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const f = v => +v.toFixed(1);
  const layer = (cls, inner, extra = '') => `<div class="sp-layer ${cls}" ${extra}><svg viewBox="0 0 400 760" preserveAspectRatio="none">${inner}</svg></div>`;

  // palette: dusk-blue silhouettes, moon rim light from the upper right, warm windows
  const C = { far: '#2d2c4e', farRim: '#5d5a88', mid: '#25233f', mid2: '#2d2b4a', side: '#3b3862', rim: '#9a95c8', fore: '#0c0b16', roof: '#1e1c36' };
  const rimR = (x, y1, y2, w = 2.2, o = 0.7) => `<rect x="${f(x - w)}" y="${y1}" width="${w}" height="${y2 - y1}" fill="${C.rim}" opacity="${o}"/>`;
  const course = (x1, x2, y) => `<path d="M${x1} ${y}H${x2}" stroke="${C.rim}" stroke-opacity=".16" stroke-width=".8"/>`;
  const merlons = (x1, x2, y, h = 8, skip = -1) => {
    let s = '';
    for (let x = x1, i = 0; x + 7 <= x2 + 0.5; x += 12, i++) {
      if (i === skip) { s += `<path d="M${x} ${y}l3-${h * 0.45}l4 ${h * 0.2}V${y}z" fill="${C.mid}"/>`; continue; } // broken merlon
      s += `<rect x="${x}" y="${y - h}" width="7" height="${h}" fill="${C.mid}"/><rect x="${x + 5.8}" y="${y - h}" width="1.2" height="${h}" fill="${C.rim}" opacity=".3"/><rect x="${x}" y="${y - h}" width="7" height="1" fill="${C.rim}" opacity=".3"/>`;
    }
    return s;
  };
  const cone = (x, w, base, tip, lean = 0, fill = C.roof) =>
    `<path d="M${x - w / 2} ${base}Q${x + lean * 0.3} ${f(base - (base - tip) * 0.55)} ${x + lean} ${tip}Q${f(x + lean * 0.6 + w * 0.12)} ${f(base - (base - tip) * 0.45)} ${x + w / 2} ${base}Q${x} ${base + 5} ${x - w / 2} ${base}z" fill="${fill}"/>` +
    `<path d="M${x + lean} ${tip}Q${f(x + lean * 0.6 + w * 0.12)} ${f(base - (base - tip) * 0.45)} ${x + w / 2} ${base}" stroke="${C.rim}" stroke-width="1.6" fill="none" opacity=".75"/>`;
  const winFrame = (x, y, w, h) => `<path d="M${x - w / 2} ${y + h}V${y + w / 2}a${w / 2} ${w / 2} 0 0 1 ${w} 0V${y + h}z" fill="#0b0a14"/>`;

  // window list: [x, y, w, h, lit]
  const WINS = [
    [200, 336, 7, 13, 1], [200, 392, 5, 11, 1],
    [168, 468, 8, 13, 1], [188, 468, 8, 13, 0], [236, 468, 8, 13, 1], [168, 520, 8, 13, 0], [236, 520, 8, 13, 1],
    [121, 494, 9, 15, 1], [121, 560, 9, 15, 0],
    [284, 428, 8, 14, 1], [284, 492, 8, 14, 1], [284, 556, 8, 14, 0],
    [357, 528, 6, 11, 1], [314, 372, 5, 9, 1],
  ];

  // ---------- sky + stars (static) and a second star set that twinkles as a whole layer
  let stars1 = '', stars2 = '';
  for (let i = 0; i < 90; i++) {
    const x = f(rnd() * 400), y = f(rnd() * 460), r = rnd() < 0.12 ? 1.2 : 0.6, o = f(0.25 + rnd() * 0.55);
    if (i % 3) stars1 += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${o}"/>`;
    else stars2 += `<circle cx="${x}" cy="${y}" r="${r + 0.2}" fill="#fff" opacity="${o}"/>`;
  }

  // ---------- far: distant ridge + ghost-of-a-castle on the hills
  const far = `
    <path d="M0 560C40 520 80 530 120 505s90-6 130 12 90 6 150-10V760H0z" fill="${C.far}"/>
    <path d="M40 520v-22h8v-10h6v10h8v22z M338 512v-30h6l5-14 5 14h6v30z" fill="${C.far}"/>
    <path d="M0 560C40 520 80 530 120 505s90-6 130 12 90 6 150-10" stroke="${C.farRim}" stroke-opacity=".35" fill="none"/>
    <path d="M0 610c50-24 110-12 160-26 60 12 120 6 240-14V760H0z" fill="#221f3b"/>`;

  // ---------- castle, back half (behind the ghost): far tower + bridge, keep, witch spire
  const back = `
    <!-- far right tower + arched bridge -->
    <rect x="344" y="490" width="26" height="160" fill="${C.mid2}"/>${rimR(370, 490, 650)}
    ${cone(357, 34, 492, 430, 4)}
    <path d="M318 518h28v24c-4-9-9-13-14-13s-10 4-14 13z" fill="${C.mid2}"/>
    ${merlons(318, 344, 518, 5)}
    <!-- keep: front face + lit side face for depth -->
    <rect x="150" y="432" width="112" height="180" fill="${C.mid}"/>
    <path d="M262 432h14l-2 180h-12z" fill="${C.side}"/>${rimR(276, 432, 612, 1.6, .6)}
    ${course(150, 262, 500)}${course(150, 262, 548)}
    ${merlons(150, 262, 432, 8)}
    <!-- the witch spire: slender so "Castle" stays readable, the tip bends in the wind -->
    <rect x="191" y="170" width="18" height="264" fill="${C.mid}"/>${rimR(209, 170, 434, 2, .75)}
    <path d="M186 318h28v-6h-28z" fill="${C.mid2}"/><path d="M186 318h28" stroke="${C.rim}" stroke-opacity=".5"/>
    <path d="M184 300h32l-4 12h-24z" fill="${C.mid}"/><path d="M212 300l-4 12" stroke="${C.rim}" stroke-opacity=".6"/>
    <path d="M186 172Q193 128 202 98Q210 74 228 58Q219 76 215 100Q211 134 214 172Q200 178 186 172z" fill="${C.roof}"/>
    <path d="M228 58Q219 76 215 100Q211 134 214 172" stroke="${C.rim}" stroke-width="1.6" fill="none" opacity=".8"/>
    <path d="M228 58l3-9" stroke="${C.rim}" stroke-width="1.2"/><circle cx="231.5" cy="47.5" r="2" fill="#e8b25c"/>
    <path d="M184 172h32" stroke="${C.rim}" stroke-opacity=".35" stroke-width="2"/>
    ${WINS.slice(0, 7).map(([x, y, w, h]) => winFrame(x, y, w, h)).join('')}`;

  // ---------- castle, front half (in front of the ghost): towers, curtain wall, gate, banner
  const front = `
    <!-- right square tower with a broken merlon and a corner turret -->
    <rect x="262" y="394" width="50" height="256" fill="${C.mid}"/>
    <path d="M312 394h12v256h-12z" fill="${C.side}"/>${rimR(324, 394, 650, 1.8, .7)}
    ${course(262, 312, 460)}${course(262, 312, 526)}${course(262, 312, 596)}
    ${merlons(262, 312, 394, 9, 1)}
    <rect x="306" y="366" width="16" height="28" fill="${C.mid2}"/>${rimR(322, 366, 394, 1.6)}
    ${cone(314, 22, 368, 322, 2)}
    <path d="M270 404h14v44l-4-6-3 7-3-6-4 6z" fill="#5a2230"/><path d="M270 404h14" stroke="#e8b25c" stroke-opacity=".6"/>
    <!-- left round tower, its roof leaning a little -->
    <rect x="96" y="452" width="50" height="198" fill="${C.mid}"/>
    <rect x="96" y="452" width="50" height="198" fill="url(#spCyl)"/>${rimR(146, 452, 650, 2.4, .75)}
    <path d="M92 452h58v-10H92z" fill="${C.mid2}"/>
    ${Array.from({ length: 6 }, (_, i) => `<path d="M${96 + i * 9} 452v4a3 3 0 0 0 6 0v-4z" fill="#0b0a14" opacity=".7"/>`).join('')}
    ${cone(121, 64, 444, 352, -6)}
    ${course(96, 146, 530)}${course(96, 146, 600)}
    <!-- curtain wall + gate -->
    <rect x="128" y="570" width="170" height="82" fill="${C.mid2}"/>
    ${merlons(128, 298, 570, 8)}
    ${course(128, 298, 610)}
    <path d="M196 652v-38a18 18 0 0 1 36 0v38z" fill="#0b0a14"/>
    <path d="M194 614a20 20 0 0 1 40 0" stroke="${C.rim}" stroke-opacity=".45" stroke-width="2" fill="none"/>
    ${[160, 272].map(x => `<rect x="${x - 1.5}" y="588" width="3" height="12" rx="1.5" fill="#0b0a14"/>`).join('')}
    ${WINS.slice(7).map(([x, y, w, h]) => winFrame(x, y, w, h)).join('')}`;

  // ---------- warm light: every lit window + the gate, with a soft halo; each flickers on its own
  const lights = WINS.filter(w => w[4]).map(([x, y, w, h], i) => {
    const d = f(1.2 + i * 0.16 + rnd() * 0.2), dur = f(1.6 + rnd() * 1.8);
    return `<g class="sp-light" style="animation-delay:${d}s,${f(d + 0.5)}s;animation-duration:.6s,${dur}s">
      <circle cx="${x}" cy="${y + h * 0.55}" r="${w * 1.9}" fill="url(#spHalo)"/>
      <path d="M${x - w / 2 + 1.2} ${y + h - 0.6}V${y + w / 2}a${w / 2 - 1.2} ${w / 2 - 1.2} 0 0 1 ${w - 2.4} 0V${y + h - 0.6}z" fill="url(#spWin)"/>
    </g>`;
  }).join('') + `<g class="sp-light gate" style="animation-delay:2.4s,2.9s;animation-duration:.8s,3.2s">
      <circle cx="214" cy="640" r="34" fill="url(#spHalo)"/>
      <path d="M199 652v-37a15 15 0 0 1 30 0v37z" fill="url(#spGate)"/>
      <g stroke="#2a1510" stroke-width="1.6" opacity=".8">${[204, 210, 216, 222].map(x => `<path d="M${x} 602v28"/>`).join('')}<path d="M199 612h30M199 622h30"/></g>
    </g>`;

  // ---------- foreground: a winding path to the gate, a lamp, one big dead tree framing the left edge.
  // Nothing here rises above the castle's foot, so the castle and title stay fully visible.
  const cobbles = Array.from({ length: 9 }, (_, k) => {
    const t = k / 8, y = 664 + t * t * 92, half = 9 + t * t * 112, cx = 216 + Math.sin(t * 3.4 + 0.4) * (6 + t * 20);
    return `<path d="M${f(cx - half * .8)} ${f(y)}q${f(half * .8)} ${f(2 + t * 3)} ${f(half * 1.6)} 0" stroke="#fff" stroke-opacity="${f(.03 + t * .05)}" stroke-width="${f(.6 + t * 1.2)}" fill="none"/>`;
  }).join('');
  const tufts = [[150, 716], [168, 700], [262, 708], [286, 724], [118, 736], [330, 742]].map(([x, y]) =>
    `<path d="M${x} ${y}l2-9 2 7 2-11 2 10 2-6 1 9z" fill="#0b0a15"/>`).join('');
  const fore = `
    <defs>
      <linearGradient id="spPath" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3c3659"/><stop offset=".5" stop-color="#2d2846"/><stop offset="1" stop-color="#1c1930"/></linearGradient>
      <linearGradient id="spGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16142a"/><stop offset="1" stop-color="#08070f"/></linearGradient>
    </defs>
    <!-- ground on both sides of the path, rim-lit by the moon -->
    <path d="M-10 668C50 660 120 668 176 690L150 770H-10z" fill="url(#spGround)"/>
    <path d="M250 690C300 674 350 664 410 668V770H322z" fill="url(#spGround)"/>
    <path d="M250 690C300 674 350 664 410 668" stroke="${C.rim}" stroke-opacity=".28" fill="none"/>
    <!-- the path, narrowing into the fog at the gate -->
    <path d="M206 654C198 674 180 690 168 708C150 732 134 752 112 770H356C334 748 310 728 280 710C252 694 234 676 224 654z" fill="url(#spPath)"/>
    ${cobbles}
    <path d="M206 654C198 674 180 690 168 708C150 732 134 752 112 770" stroke="#0b0a15" stroke-width="3.5" fill="none" opacity=".75"/>
    <path d="M224 654C234 676 252 694 280 710C310 728 334 748 356 770" stroke="#0b0a15" stroke-width="3.5" fill="none" opacity=".75"/>
    ${tufts}
    <!-- two graves on the right slope -->
    <g fill="#0b0a15"><path d="M346 700v-18a8 8 0 0 1 16 0v18z"/><path d="M372 704v-8h-6v-5h6v-6h5v6h6v5h-6v8z"/></g>
    <path d="M346 682a8 8 0 0 1 16 0" stroke="${C.rim}" stroke-opacity=".35" fill="none"/>
    <!-- tall lamp post with a hanging lantern (stands in front of the fog at the castle foot) -->
    <g fill="#07060d">
      <rect x="317" y="604" width="7" height="166"/>
      <path d="M311 770h19l-3-12h-13z"/><path d="M314 640h13v5h-13z"/>
      <path d="M320.5 598l3 6h-7z"/><circle cx="320.5" cy="596" r="2.4"/>
      <path d="M320 612c-6-12-18-14-24-6" stroke="#07060d" stroke-width="3.4" fill="none"/>
      <path d="M288 616h16l-2.5-6h-11z"/>
      <rect x="289" y="616" width="14" height="20" rx="1.5"/>
      <path d="M288 636h16l-3 5h-10z"/>
    </g>
    <rect x="291" y="618" width="10" height="16" rx="1" fill="#ffd98a"/>
    <path d="M296 618v16M291 626h10" stroke="#07060d" stroke-width="1.2"/>
    <rect x="323" y="604" width="1.2" height="166" fill="${C.rim}" opacity=".35"/>
    <!-- the big dead tree: thick trunk rooted at the bottom left, branches stay left of the castle and below the title -->
    <g fill="#06050c">
      <path d="M-24 770C-8 690 8 632 18 590C28 548 22 518 34 482C40 466 48 454 54 440L66 447C58 466 54 484 52 508C48 548 58 598 64 648C68 700 84 738 108 770z"/>
      <path d="M-24 770c16-16 44-22 70-16l-8 16z"/><path d="M60 740c16 4 30 14 40 30H70z"/>
    </g>
    <g stroke="#06050c" stroke-linecap="round" fill="none">
      <path d="M58 452C66 430 74 412 84 398" stroke-width="8"/>
      <path d="M84 398C88 388 90 380 90 370" stroke-width="4"/>
      <path d="M78 408C86 404 92 400 96 392" stroke-width="2.6"/>
      <path d="M46 470C40 444 40 420 32 398" stroke-width="7"/>
      <path d="M32 398C28 380 30 366 22 350" stroke-width="3.6"/>
      <path d="M34 404C22 396 10 396 -6 388" stroke-width="3.6"/>
      <path d="M26 540C12 528 0 526 -16 528" stroke-width="7"/>
      <path d="M8 530C0 516 -2 504 -12 494" stroke-width="3"/>
      <path d="M50 610C62 604 72 594 78 580" stroke-width="4"/>
      <path d="M78 580c2-8 6-14 12-18M22 350c-4-6-4-12-10-16M90 370c4-4 4-10 2-16M54 456c10-2 16-8 20-16M-6 388c-6-2-10-6-12-12" stroke-width="2"/>
    </g>
    <path d="M66 447C58 466 54 484 52 508C48 548 58 598 64 648C68 700 84 738 108 770" stroke="${C.rim}" stroke-opacity=".26" stroke-width="1.4" fill="none"/>
    <path d="M58 452C66 430 74 412 84 398C88 388 90 380 90 370" stroke="${C.rim}" stroke-opacity=".2" stroke-width=".9" fill="none"/>
    <!-- a crow keeping watch -->
    <path d="M74 406c2-5 7-6 10-4l3-2-1 3c3 2 3 6 0 7l-8 1-5 3 2-4z" fill="#06050c"/>`;
  const lantern = '';

  // ---------- title
  const title = (front) => front
    ? `<text class="sp-kicker" x="200" y="108" text-anchor="middle">WELCOME TO</text>
       <text class="sp-scaremore sp-shadow" x="200" y="306" text-anchor="middle">Scaremore</text>
       <text class="sp-scaremore" x="200" y="302" text-anchor="middle" fill="url(#spGold)" stroke="#2a1706" stroke-width="2.5" paint-order="stroke">Scaremore</text>`
    : `<text class="sp-word sp-shadow" x="200" y="218" text-anchor="middle">Castle</text>
       <text class="sp-word" x="200" y="214" text-anchor="middle">Castle</text>`;

  const look = ghostLook();
  const ghost = ghostSVG(look.skin, false, { noShadow: true, items: look.items })
    .replace(/<svg ([^>]*?)width="200" height="260">/, '<svg $1x="268" y="394" width="38" height="50" style="width:38px;height:50px">');
  const moonGhost = ghostSVG(look.skin, false, { noShadow: true, items: look.items })
    .replace(/<svg ([^>]*?)width="200" height="260">/, '<svg $1x="334" y="350" width="58" height="76" style="width:58px;height:76px">');

  const defs = `<svg width="0" height="0" style="position:absolute"><defs>
    <radialGradient id="spHalo"><stop offset="0" stop-color="#ffc766" stop-opacity=".55"/><stop offset="1" stop-color="#ffc766" stop-opacity="0"/></radialGradient>
    <radialGradient id="spWin" cx=".5" cy=".75" r=".8"><stop offset="0" stop-color="#fff0c2"/><stop offset=".6" stop-color="#ffc766"/><stop offset="1" stop-color="#e0822f"/></radialGradient>
    <radialGradient id="spGate" cx=".5" cy="1" r="1"><stop offset="0" stop-color="#ffe2a0"/><stop offset=".6" stop-color="#e8903c"/><stop offset="1" stop-color="#6a3018"/></radialGradient>
    <linearGradient id="spCyl" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".25"/><stop offset=".7" stop-color="#fff" stop-opacity=".03"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient>
    <linearGradient id="spGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe6a8"/><stop offset=".55" stop-color="#e8b25c"/><stop offset="1" stop-color="#b27628"/></linearGradient>
    <linearGradient id="spShine" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="90" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
      <animateTransform id="spShineAnim" attributeName="gradientTransform" type="translate" from="-120 0" to="420 0" dur="1.3s" begin="3.4s;spShineAnim.end+5s" fill="freeze"/>
    </linearGradient>
  </defs></svg>`;

  $('#splash').insertAdjacentHTML('afterbegin', `${defs}
    <div class="sp-stage sp-stage-original">
      <div class="sp-layer sp-sky"></div>
      ${layer('sp-stars', stars1)}
      ${layer('sp-stars sp-twinkle', stars2)}
      <div class="sp-moon"><i class="halo"></i><i class="halo h2"></i><i class="disc"></i></div>
      <div class="sp-cloud c1"></div><div class="sp-cloud c2"></div>
      <div class="sp-bat b1"><svg viewBox="0 0 16 8"><path d="M0 3c3-4 6-4 8-1 2-3 5-3 8 1-3-1-5 0-8 3-3-3-5-4-8-3z" fill="#0b0b18"/></svg></div>
      <div class="sp-bat b2"><svg viewBox="0 0 16 8"><path d="M0 3c3-4 6-4 8-1 2-3 5-3 8 1-3-1-5 0-8 3-3-3-5-4-8-3z" fill="#0b0b18"/></svg></div>
      ${layer('sp-far', far)}
      ${layer('sp-title-back', title(false))}
      <div class="sp-mid">
        ${layer('sp-castle-back', back)}
        ${layer('sp-ghost', ghost)}
        ${layer('sp-castle-front', front)}
        ${layer('sp-lights', lights)}
        <div class="sp-fogc c1"></div><div class="sp-fogc c2"></div><div class="sp-fogc c3"></div><div class="sp-fogc c4"></div>
        <div class="sp-gate-glow"></div>
      </div>
      <div class="sp-fore-wrap">
        ${layer('sp-fore', fore)}
        <div class="sp-lamp-glow"></div><div class="sp-lamp-pool"></div>
        <div class="sp-fogf f1"></div><div class="sp-fogf f2"></div><div class="sp-fogf f3"></div>
      </div>
      ${layer('sp-title-front', title(true))}
      ${layer('sp-shine', `<text class="sp-scaremore" x="200" y="302" text-anchor="middle" fill="url(#spShine)">Scaremore</text>`)}
      <div class="sp-layer sp-vignette"></div>
    </div>
    <div class="sp-stage sp-stage-moonlit" aria-hidden="true">
      <div class="ml-layer ml-background"><img src="assets/intro-moonlit-background.png" alt=""></div>
      <div class="ml-moonwash"></div>
      <div class="ml-stars"><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <div class="ml-raven r1"><svg viewBox="0 0 30 14"><path d="M1 8Q7 0 15 7Q23 0 29 8Q22 5 15 12Q8 5 1 8Z"/></svg></div>
      <div class="ml-raven r2"><svg viewBox="0 0 30 14"><path d="M1 8Q7 0 15 7Q23 0 29 8Q22 5 15 12Q8 5 1 8Z"/></svg></div>
      ${layer('ml-title-back', title(false))}
      <div class="ml-layer ml-ghost">${layer('', moonGhost)}</div>
      <div class="ml-layer ml-castle"><img src="assets/intro-moonlit-castle-v3.png" alt="">
        <div class="ml-window-lights"><i style="--x:56.7%;--y:29%;--d:-.3s"></i><i style="--x:56.7%;--y:36.8%;--d:-1.1s"></i><i style="--x:45.4%;--y:61.4%;--d:-1.8s"></i><i style="--x:58.7%;--y:68.5%;--d:-.7s"></i><i style="--x:67%;--y:64%;--d:-2.2s"></i><i style="--x:50%;--y:80%;--d:-1.4s"></i></div>
      </div>
      <div class="ml-fog ml-fog-back"><i></i><i></i></div>
      <div class="ml-layer ml-foreground"><img src="assets/intro-moonlit-crest-v3.png" alt=""></div>
      <div class="ml-fog ml-fog-front"><i></i><i></i><i></i></div>
      ${layer('ml-title-front', title(true))}
      <div class="sp-layer ml-vignette"></div>
    </div>`);
}

// ---------------------------------------------------------------- boot
function refresh() {
  if ($('#level')) renderLevel();
  window.dispatchEvent(new CustomEvent('scaremore:refresh'));
  updateUpgrades();
  updateScene();
  renderGhosts();
  renderCastle();
  renderCards();
  renderShop();
  updateBadges();
}

function boot() {
  buildSplash();
  renderCurrencyNow();
  requestAnimationFrame(tickCurrency);
  initTabs();
  initBuyMode();
  buildUpgrades();
  initPanelTabs();
  ensureQuests();
  refresh();
  setIndicator(false);
  $('#btn-settings').addEventListener('click', openSettings);
  $('#level').addEventListener('click', e => claimLevel(e.currentTarget));
  renderLevel();
  renderBuffs();
  $('#btn-gem-plus').addEventListener('click', () => switchTab('shop'));
  setInterval(() => { updateBadges(); updateUpgrades(); }, 1000);

  const splash = $('#splash');
  splash.addEventListener('click', () => {
    audio(); sfx.tab(); vibe(10);
    splash.classList.add('out');
    setTimeout(() => splash.remove(), 1000);
    enter(pageEl('haunt'));
    window.dispatchEvent(new CustomEvent('scaremore:start'));
  }, { once: true });
}
// API for game.js
window.Scaremore = {
  get S() { return S; },
  stats, save, gain, toast, POTIONS, potionLeft, sfx, vibe, fmt, ghostSVG, retrigger, refresh, updateBadges, updateUpgrades, quest, addXp,
  ROOMS, RARITIES, ghostLook, ghostSig,
  EASE,
  get currentTab() { return current; },
};
boot();
})();
