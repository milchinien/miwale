/* Save slots + permanent progression (Werkstatt, Meisterschaft, Raritäten, Statistiken) + settings.
   Everything lives in localStorage; 3 slots. Rutabagas earned in a run are the permanent currency. */
(function () {
  'use strict';
  const KEY = (i) => 'jack.save.' + i;
  const SETTINGS_KEY = 'jack.settings';
  const SLOTS = 3;

  /* ---------- Werkstatt: permanent upgrades ---------- */
  const MODS = [
    { id: 'vitality', icon: 'hp', name: 'Thick Skin', desc: (l) => '+' + 10 * l + ' max HP', max: 10, cost: (l) => 20 + l * 15 },
    { id: 'power', icon: 'dmg', name: 'Seed Power', desc: (l) => '+' + 6 * l + '% damage', max: 10, cost: (l) => 25 + l * 20 },
    { id: 'haste', icon: 'speed', name: 'Light Boots', desc: (l) => '+' + 3 * l + '% move speed', max: 5, cost: (l) => 20 + l * 20 },
    { id: 'reach', icon: 'magnet', name: 'Long Reach', desc: (l) => '+' + 12 * l + '% pickup radius', max: 5, cost: (l) => 15 + l * 15 },
    { id: 'fortune', icon: 'greed', name: 'Farmer’s Wit', desc: (l) => '+' + 10 * l + '% Rutabagas', max: 10, cost: (l) => 30 + l * 25 },
    { id: 'wisdom', icon: 'multi', name: 'Old Wisdom', desc: (l) => '+' + 8 * l + '% experience', max: 5, cost: (l) => 25 + l * 25 },
    { id: 'toughness', icon: 'armor', name: 'Tough Bark', desc: (l) => '−' + 4 * l + '% damage taken', max: 5, cost: (l) => 30 + l * 25 },
    { id: 'dash', icon: 'speed', name: 'Headbutt Training', desc: (l) => '−' + 8 * l + '% dash cooldown', max: 4, cost: (l) => 25 + l * 25 },
    { id: 'luck', icon: 'crit', name: 'Lucky Pumpkin', desc: (l) => '+' + 35 * l + '% chance for rarer upgrades', max: 5, cost: (l) => 40 + l * 35 },
    { id: 'reroll', icon: 'rate', name: 'Second Choice', desc: (l) => l + '× reroll per level-up', max: 3, cost: (l) => 60 + l * 60 },
    { id: 'revive', icon: 'lantern', name: 'Second Lantern', desc: (l) => (l > 1 ? l + '× revive with half HP' : 'Revive once with half HP'), max: 2, cost: (l) => 150 + l * 200 },
    { id: 'startBoulder', icon: 'bounce', name: 'Boulder Start', desc: () => 'Start with the Bouncing Boulder', max: 1, cost: () => 100 },
    { id: 'startRocket', icon: 'rocket', name: 'Rocket Start', desc: () => 'Start with the Rutabaga Rocket', max: 1, cost: () => 120 },
    { id: 'startAura', icon: 'nova', name: 'Circle Start', desc: () => 'Start with the Kill Circle', max: 1, cost: () => 120 },
  ];
  /* ---------- Raritäten ---------- */
  const RARITY_UNLOCKS = [
    { id: 'rare', name: 'Rare', desc: 'Level-up cards can be Rare: effect ×1.6', cost: 120 },
    { id: 'epic', name: 'Epic', desc: 'Epic cards: effect ×2.3', cost: 350, needs: 'rare' },
    { id: 'legendary', name: 'Legendary', desc: 'Legendary cards: effect ×3.2', cost: 800, needs: 'epic' },
  ];
  const MASTERY_MAX = 3;
  const masteryCost = (l) => 30 + l * 45;

  const blank = () => ({
    v: 1, created: Date.now(), lastPlayed: 0, rutas: 0, cleared: {}, mods: {}, mastery: {}, rarities: {}, ach: {}, skin: 'harvest16', skins: { harvest16: true }, counters: {},
    stats: { runs: 0, wins: 0, deaths: 0, kills: 0, creeper: 0, ghost: 0, colossus: 0, bosses: 0, playTime: 0,
      bestLevel: 0, rutasEarned: 0, rutasSpent: 0, damage: 0, dashes: 0, levelUps: 0, best: {} },
  });

  const Meta = {
    SLOTS, MODS, RARITY_UNLOCKS, MASTERY_MAX, masteryCost,
    slot: null, // index of the active slot
    data: null,
    load(i) {
      try { const s = JSON.parse(localStorage.getItem(KEY(i))); return s && s.v ? Object.assign(blank(), s, { stats: Object.assign(blank().stats, s.stats) }) : null; } catch (e) { return null; }
    },
    peek(i) { return this.load(i); },
    open(i) {
      this.slot = i;
      this.data = this.load(i) || blank();
      this.save();
      return this.data;
    },
    erase(i) { localStorage.removeItem(KEY(i)); if (this.slot === i) { this.slot = null; this.data = null; } },
    save() { if (this.slot !== null && this.data) { this.data.lastPlayed = Date.now(); localStorage.setItem(KEY(this.slot), JSON.stringify(this.data)); } },

    /* progress */
    isUnlocked(wi) { return wi === 0 || !!this.data.cleared[wi - 1]; },
    clearedCount() { return Object.keys(this.data.cleared).length; },
    /* what a run gets from the save: handed to Game.applyMeta */
    runMeta() { return { mods: this.data.mods, mastery: this.data.mastery, rarities: this.data.rarities }; },

    /* shops */
    spend(cost) {
      if (this.data.rutas < cost) return false;
      this.data.rutas -= cost;
      this.data.stats.rutasSpent += cost;
      this.save();
      return true;
    },
    modLevel(id) { return this.data.mods[id] || 0; },
    buyMod(id) {
      const m = MODS.find((x) => x.id === id), l = this.modLevel(id);
      if (!m || l >= m.max || !this.spend(m.cost(l))) return false;
      this.data.mods[id] = l + 1; this.save(); return true;
    },
    masteryLevel(id) { return this.data.mastery[id] || 0; },
    buyMastery(id) {
      const l = this.masteryLevel(id);
      if (l >= MASTERY_MAX || !this.spend(masteryCost(l))) return false;
      this.data.mastery[id] = l + 1; this.save(); return true;
    },
    buyRarity(id) {
      const r = RARITY_UNLOCKS.find((x) => x.id === id);
      if (!r || this.data.rarities[id] || (r.needs && !this.data.rarities[r.needs]) || !this.spend(r.cost)) return false;
      this.data.rarities[id] = true; this.save(); return true;
    },

    /* after a run */
    recordRun(game, worldIndex, won) {
      const d = this.data, st = d.stats;
      st.runs++;
      if (won) st.wins++; else st.deaths++;
      st.kills += game.kills;
      for (const k of ['creeper', 'ghost', 'colossus']) st[k] += game.killsBy[k] || 0;
      st.byType = st.byType || {};
      for (const k in game.killsBy) if (!['creeper', 'ghost', 'colossus', 'boss'].includes(k)) st.byType[k] = (st.byType[k] || 0) + game.killsBy[k];
      st.bosses += game.killsBy.boss || 0;
      st.playTime += game.totalTime;
      st.bestLevel = Math.max(st.bestLevel, game.level);
      st.damage += Math.round(game.damageDealt);
      st.levelUps += game.level - 1;
      st.rutasEarned += game.rutas;
      d.rutas += game.rutas;
      const b = st.best[worldIndex] || {};
      if (won && (!b.time || game.totalTime < b.time)) b.time = Math.round(game.totalTime);
      b.kills = Math.max(b.kills || 0, game.kills);
      st.best[worldIndex] = b;
      let unlockedNew = false;
      if (won) {
        unlockedNew = !d.cleared[worldIndex]; d.cleared[worldIndex] = true;
        // clearing a world unlocks the Jack of every style it contains as a skin
        const w = window.Worlds && window.Worlds.list[worldIndex];
        if (w) for (const id of w.styles) d.skins[id] = true;
      }
      this.save();
      return { unlockedNew };
    },

    /* ---------- settings (global, not per slot) ---------- */
    settings: Object.assign({ master: 0.8, music: 0.7, sfx: 0.9, shakeAmount: 1, numbers: true, particles: 2, screenFx: true, flashes: true, ambient: true, hitstop: true, quality: 'high' }, (() => { try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch (e) { return {}; } })()),
    saveSettings() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings)); },
  };
  window.Meta = Meta;
})();
