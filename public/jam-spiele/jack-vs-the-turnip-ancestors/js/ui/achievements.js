/* Achievements – definitions, event-driven tracking during runs, end-of-run checks and the hub tab.
   Public API (stable): Achievements.defs, runStart(game, data, App), runEnd(game, data, won, worldIndex, App) -> [unlocked]
   Save data used: data.ach[id] = { at }, data.counters{ elites, dashes, bossW{worldIndex:1} } (both created on demand, old saves are fine). */
(function () {
  'use strict';
  const Meta = window.Meta;
  const worldName = (i) => { const w = window.Worlds && window.Worlds.list && window.Worlds.list[i]; return w ? w.name : 'World ' + (i + 1); };
  const sumObj = (o) => { let n = 0; if (o) for (const k in o) n += +o[k] || 0; return n; };
  const fmt = (n) => Math.round(n).toLocaleString('en-US');

  /* ---------------- definitions ----------------
     test(ctx) -> true when earned. ctx = { data, game|null, end (run just finished), won, wi, boss|null, run }
     goal/prog(data): counter based, shown as a progress bar (and unlocks automatically at prog >= goal). */
  const CATS = ['Slaying', 'Bosses', 'Worlds', 'Build', 'Economy', 'Skill'];
  const defs = [];
  function def(o) { if (o.goal) o.test = (c) => o.prog(c.data) >= o.goal; defs.push(o); }
  const st = (d) => d.stats || {};
  const ctr = (d) => d.counters || {};
  const owned = (c) => (c.game && c.game.owned) || {};
  const wlv = (c, id) => (c.game && c.game.weapons && c.game.weapons[id]) || 0;

  // ---- Slaying
  def({ id: 'kills100', cat: 'Slaying', name: 'First Harvest', desc: 'Defeat 100 enemies.', icon: 'dmg', reward: 10, goal: 100, prog: (d) => st(d).kills || 0 });
  def({ id: 'kills1k', cat: 'Slaying', name: 'Turnip Thresher', desc: 'Defeat 1,000 enemies.', icon: 'rate', reward: 40, goal: 1000, prog: (d) => st(d).kills || 0 });
  def({ id: 'kills10k', cat: 'Slaying', name: 'Scourge of the Patch', desc: 'Defeat 10,000 enemies.', icon: 'nova', reward: 200, goal: 10000, prog: (d) => st(d).kills || 0 });
  def({ id: 'ghosts500', cat: 'Slaying', name: 'Ghostbuster', desc: 'Banish 500 Hunger Ghosts.', icon: 'speed', reward: 60, goal: 500, prog: (d) => st(d).ghost || 0 });
  def({ id: 'colossi100', cat: 'Slaying', name: 'Colossus Crusher', desc: 'Topple 100 Rutabaga Colossi.', icon: 'armor', reward: 80, goal: 100, prog: (d) => st(d).colossus || 0 });
  def({ id: 'newtypes200', cat: 'Slaying', name: 'Field Biologist', desc: 'Defeat 200 of the stranger creatures: Spitters, Bombers, Chargers, Mothers and Sprouts.', icon: 'multi', reward: 80, goal: 200, prog: (d) => sumObj(st(d).byType) });
  def({ id: 'elites25', cat: 'Slaying', name: 'Elite Eliminator', desc: 'Defeat 25 elite enemies.', icon: 'crit', reward: 70, goal: 25, prog: (d) => ctr(d).elites || 0 });

  // ---- Bosses
  def({ id: 'boss1', cat: 'Bosses', name: 'Ancestor Antagonist', desc: 'Defeat your first Turnip Ancestor.', icon: 'hp', reward: 30, test: (c) => (st(c.data).bosses || 0) >= 1 || sumObj(ctr(c.data).bossW) >= 1 });
  const BOSS_NAMES = ['Farmhand Felled', 'Toy Box Tamed', 'Craft Room Cleaned Out', 'Game Over for the Arcade', 'Stop the Presses', 'Gallery Guardian Gone', 'Midnight Master'];
  const BOSS_REWARD = [30, 40, 50, 60, 80, 100, 200];
  for (let i = 0; i < 7; i++) {
    def({ id: 'bossw' + i, cat: 'Bosses', name: BOSS_NAMES[i], icon: ['dmg', 'bounce', 'regen', 'speed', 'crit', 'lantern', 'levelup'][i], reward: BOSS_REWARD[i],
      get desc() { return 'Defeat the Turnip Ancestor of ' + worldName(i) + '.'; },
      test: (c) => !!(ctr(c.data).bossW && ctr(c.data).bossW[i]) });
  }
  def({ id: 'flawless', cat: 'Bosses', name: 'Not a Scratch', desc: 'Defeat a boss without taking any damage during the boss fight.', icon: 'armor', reward: 150, secret: true, test: (c) => !!(c.boss && c.boss.flawless) });
  def({ id: 'fastboss', cat: 'Bosses', name: 'Speed Peeler', desc: 'Defeat a boss within 60 seconds of its arrival.', icon: 'rate', reward: 120, test: (c) => !!(c.boss && c.boss.dur <= 60) });

  // ---- Worlds
  def({ id: 'clear1', cat: 'Worlds', name: 'Home Turf', desc: 'Clear any world.', icon: 'rutabaga', reward: 30, goal: 1, prog: (d) => Object.keys(d.cleared || {}).length });
  def({ id: 'clear3', cat: 'Worlds', name: 'Seasoned Traveller', desc: 'Clear 3 different worlds.', icon: 'speed', reward: 80, goal: 3, prog: (d) => Object.keys(d.cleared || {}).length });
  def({ id: 'clear5', cat: 'Worlds', name: 'Almost Midnight', desc: 'Clear 5 different worlds.', icon: 'clock', reward: 150, goal: 5, prog: (d) => Object.keys(d.cleared || {}).length });
  def({ id: 'clearall', cat: 'Worlds', name: 'Pumpkin King', desc: 'Clear all 7 worlds.', icon: 'levelup', reward: 400, goal: 7, prog: (d) => Object.keys(d.cleared || {}).length });
  def({ id: 'nodash', cat: 'Worlds', name: 'Stand Your Ground', desc: 'Clear a world without ever dashing.', icon: 'armor', reward: 150, secret: true, test: (c) => c.end && c.won && c.run && c.run.dash === 0 });
  def({ id: 'pistolonly', cat: 'Worlds', name: 'One Seed, One Kill', desc: 'Clear a world using only the Seed Pistol.', icon: 'dmg', reward: 250, secret: true,
    test: (c) => c.end && c.won && wlv(c, 'pistol') > 0 && !wlv(c, 'rocket') && !wlv(c, 'aura') && !wlv(c, 'boulder') });
  def({ id: 'allfour', cat: 'Worlds', name: 'Full Arsenal', desc: 'Clear a world with all four weapons in your build.', icon: 'rocket', reward: 120,
    test: (c) => c.end && c.won && wlv(c, 'pistol') > 0 && wlv(c, 'rocket') > 0 && wlv(c, 'aura') > 0 && wlv(c, 'boulder') > 0 });

  // ---- Build
  def({ id: 'weapon5', cat: 'Build', name: 'Fully Seasoned', desc: 'Level any weapon up to level 5.', icon: 'rocket', reward: 40,
    test: (c) => wlv(c, 'pistol') >= 5 || wlv(c, 'rocket') >= 5 || wlv(c, 'aura') >= 5 || wlv(c, 'boulder') >= 5 });
  def({ id: 'weapons4', cat: 'Build', name: 'Walking Armoury', desc: 'Hold all four weapons in a single run.', icon: 'bounce', reward: 60,
    test: (c) => wlv(c, 'pistol') > 0 && wlv(c, 'rocket') > 0 && wlv(c, 'aura') > 0 && wlv(c, 'boulder') > 0 });
  def({ id: 'passives3', cat: 'Build', name: 'Min-Maxer', desc: 'Max out 3 passive upgrades in a single run.', icon: 'greed', reward: 90,
    test: (c) => {
      if (!c.game || !window.GameData) return false;
      let n = 0;
      for (const it of window.GameData.ITEMS) if (!it.weapon && it.max && (c.game.owned[it.id] || 0) >= it.max) n++;
      return n >= 3;
    } });
  def({ id: 'upgrades8', cat: 'Build', name: 'Jack of All Trades', desc: 'Own 8 different upgrades in a single run.', icon: 'multi', reward: 60,
    test: (c) => { let n = 0; const o = owned(c); for (const k in o) if (o[k] > 0) n++; return n >= 8; } });
  def({ id: 'legendary', cat: 'Build', name: 'Legend in the Making', desc: 'Pick a Legendary upgrade card.', icon: 'levelup', reward: 100, test: (c) => !!(c.run && c.run.legendary) });
  def({ id: 'chests5', cat: 'Build', name: 'Treasure Hunter', desc: 'Open 5 treasure chests in a single run.', icon: 'magnet', reward: 70, test: (c) => !!(c.run && c.run.chests >= 5) });

  // ---- Economy
  def({ id: 'earn500', cat: 'Economy', name: 'Pocket Change', desc: 'Earn 500 Rutabagas in total.', icon: 'rutabaga', reward: 25, goal: 500, prog: (d) => st(d).rutasEarned || 0 });
  def({ id: 'earn5k', cat: 'Economy', name: 'Rutabaga Baron', desc: 'Earn 5,000 Rutabagas in total.', icon: 'rutabaga', reward: 150, goal: 5000, prog: (d) => st(d).rutasEarned || 0 });
  def({ id: 'spend1k', cat: 'Economy', name: 'Big Spender', desc: 'Spend 1,000 Rutabagas in the shops.', icon: 'greed', reward: 80, goal: 1000, prog: (d) => st(d).rutasSpent || 0 });
  def({ id: 'shop5', cat: 'Economy', name: 'Workshop Apprentice', desc: 'Buy 5 workshop upgrade levels.', icon: 'hp', reward: 30, goal: 5, prog: (d) => sumObj(d.mods) });
  def({ id: 'shop20', cat: 'Economy', name: 'Workshop Master', desc: 'Buy 20 workshop upgrade levels.', icon: 'hp', reward: 120, goal: 20, prog: (d) => sumObj(d.mods) });
  def({ id: 'rare', cat: 'Economy', name: 'A Touch of Blue', desc: 'Unlock Rare upgrade cards.', icon: 'crit', reward: 30, test: (c) => !!(c.data.rarities && c.data.rarities.rare) });
  def({ id: 'epic', cat: 'Economy', name: 'Purple Patch', desc: 'Unlock Epic upgrade cards.', icon: 'crit', reward: 80, test: (c) => !!(c.data.rarities && c.data.rarities.epic) });
  def({ id: 'legend', cat: 'Economy', name: 'Gold Standard', desc: 'Unlock Legendary upgrade cards.', icon: 'crit', reward: 200, test: (c) => !!(c.data.rarities && c.data.rarities.legendary) });
  def({ id: 'mastery', cat: 'Economy', name: 'Practice Makes Pumpkin', desc: 'Master an upgrade to the highest mastery rank.', icon: 'multi', reward: 70,
    test: (c) => { const m = c.data.mastery || {}; const mx = (Meta && Meta.MASTERY_MAX) || 3; for (const k in m) if (m[k] >= mx) return true; return false; } });
  def({ id: 'skins10', cat: 'Economy', name: 'Fashion Victim', desc: 'Unlock 10 Jack skins.', icon: 'magnet', reward: 80, goal: 10, prog: (d) => Object.keys(d.skins || {}).length });
  def({ id: 'skins20', cat: 'Economy', name: 'Wardrobe Wizard', desc: 'Unlock 20 Jack skins.', icon: 'magnet', reward: 250, goal: 20, prog: (d) => Object.keys(d.skins || {}).length });

  // ---- Skill
  def({ id: 'level15', cat: 'Skill', name: 'Growing Gourd', desc: 'Reach level 15 in a single run.', icon: 'levelup', reward: 40, test: (c) => !!(c.game && c.game.level >= 15) });
  def({ id: 'survive5', cat: 'Skill', name: 'Five Minutes of Fame', desc: 'Survive for 5 minutes in a single run.', icon: 'clock', reward: 40, test: (c) => !!(c.game && c.game.totalTime >= 300) });
  def({ id: 'lowhpwin', cat: 'Skill', name: 'By a Rind', desc: 'Win a run with less than 25% HP left.', icon: 'regen', reward: 120, secret: true,
    test: (c) => !!(c.end && c.won && c.game && c.game.player.hp > 0 && c.game.player.hp / c.game.player.maxHp < 0.25) });
  def({ id: 'revive', cat: 'Skill', name: 'Back From the Dead', desc: 'Get revived by the Second Lantern.', icon: 'lantern', reward: 50, test: (c) => !!(c.run && c.run.revived) });
  def({ id: 'dash500', cat: 'Skill', name: 'Twinkle Toes', desc: 'Dash 500 times in total.', icon: 'speed', reward: 60, goal: 500, prog: (d) => ctr(d).dashes || 0 });

  /* ---------------- state ---------------- */
  let D = null;                // data of the active save slot
  let Rn = null;               // current run: { game, dash, bossHurt, bossT, chests, legendary, revived, unlocked[], tickT }
  let appRef = null;
  let inEval = false;
  const hooked = new WeakSet();
  const byId = {};
  for (const d of defs) byId[d.id] = d;

  function ensure(data) {
    if (!data) return data;
    if (!data.ach || typeof data.ach !== 'object') data.ach = {};
    if (!data.counters || typeof data.counters !== 'object') data.counters = {};
    return data;
  }
  const save = () => { try { Meta.save(); } catch (e) { /* ignore */ } };

  /** unlock every locked achievement whose test passes; returns the new ones */
  function evaluate(ctx, announce) {
    const data = ensure(ctx.data);
    if (!data) return [];
    const out = [];
    inEval = true;
    try {
      for (const d of defs) {
        if (data.ach[d.id]) continue; // never twice
        let ok = false;
        try { ok = !!d.test(ctx); } catch (e) { ok = false; }
        if (!ok) continue;
        data.ach[d.id] = { at: Date.now() };
        data.rutas = (data.rutas || 0) + d.reward;
        out.push({ id: d.id, name: d.name, desc: d.desc, reward: d.reward, icon: d.icon, cat: d.cat });
      }
      if (out.length) {
        save();
        if (announce && appRef && appRef.popup) for (const a of out) { try { appRef.popup('Achievement: ' + a.name, '+' + a.reward + ' Rutabagas · ' + a.desc, a.icon); } catch (e) { /* ignore */ } }
        try { window.App && window.App.helpers.updateWallet && window.App.helpers.updateWallet(true); } catch (e) { /* hub not visible */ }
      }
    } finally { inEval = false; }
    return out;
  }

  function live(game, boss) {
    if (!Rn || !D) return;
    const got = evaluate({ data: D, game, end: false, won: false, wi: game.worldIndex, boss: boss || null, run: Rn }, true);
    for (const a of got) Rn.unlocked.push(a);
  }

  function hook(game) {
    if (hooked.has(game)) return;
    hooked.add(game);
    const mine = () => Rn && Rn.game === game && D;
    const tick = () => { if (mine() && game.time - Rn.tickT > 1) { Rn.tickT = game.time; live(game); } };
    game.on('Kill', (e) => {
      if (!mine()) return;
      if (e && e.elite && !e.boss) { D.counters.elites = (D.counters.elites || 0) + 1; }
      tick();
    });
    game.on('Pickup', tick);
    game.on('Dash', () => { if (!mine()) return; Rn.dash++; D.counters.dashes = (D.counters.dashes || 0) + 1; });
    game.on('Hurt', () => { if (mine() && (game.phase === 'boss' || game.boss)) Rn.bossHurt = true; });
    game.on('Revive', () => { if (mine()) { Rn.revived = true; live(game); } });
    game.on('ChestOpen', () => { if (mine()) { Rn.chests++; Rn.tickT = game.time; } });
    game.on('BossSpawn', () => { if (mine()) { Rn.bossHurt = false; Rn.bossT = game.time; } });
    game.on('BossDie', () => {
      if (!mine()) return;
      const wi = game.worldIndex | 0;
      D.counters.bossW = D.counters.bossW || {};
      D.counters.bossW[wi] = 1;
      live(game, { flawless: !Rn.bossHurt, dur: game.time - Rn.bossT });
    });
    game.on('LevelUp', () => { if (mine()) live(game); });
    // a card was taken: weapon levels / owned items / rarity are final now
    const choose = game.choose;
    game.choose = function (i) {
      const c = this.choices && this.choices[i];
      const r = choose.apply(this, arguments);
      if (mine()) {
        if (c && c.rarity && c.rarity.id === 'legendary') Rn.legendary = true;
        live(game);
      }
      return r;
    };
  }

  /* ---------------- run integration ---------------- */
  function runStart(game, data, App) {
    appRef = App || appRef;
    D = ensure(data);
    Rn = { game, dash: 0, bossHurt: false, bossT: 0, chests: 0, legendary: false, revived: false, unlocked: [], tickT: 0 };
    hook(game);
  }

  function runEnd(game, data, won, worldIndex, App) {
    appRef = App || appRef;
    D = ensure(data || D);
    if (!D) return [];
    if (!Rn || Rn.game !== game) Rn = { game, dash: game.__dash || 1, bossHurt: false, bossT: 0, chests: 0, legendary: false, revived: false, unlocked: [], tickT: 0 };
    const got = evaluate({ data: D, game, end: true, won: !!won, wi: worldIndex, boss: null, run: Rn }, false);
    save();
    const all = Rn.unlocked.concat(got); // in-run unlocks are listed again on the results screen
    Rn.unlocked = [];
    Rn = null;
    return all;
  }

  /* ---------------- hub tab ---------------- */
  const CSS = `
.ach-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px 20px; margin-bottom: 14px; }
.ach-total { font-family: Fraunces, serif; font-size: 22px; font-weight: 900; }
.ach-total small { display: block; font: 600 13px Inter, system-ui, sans-serif; color: var(--g-dim, rgba(243,233,225,.6)); margin-top: 2px; }
.ach-bar { height: 8px; border-radius: 4px; background: rgba(255,255,255,.1); overflow: hidden; margin: 0 0 14px; }
.ach-bar i { display: block; height: 100%; background: linear-gradient(90deg, #ff8a2a, #ffbf2e); }
.ach-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.ach-chip { font: 700 12px Inter, system-ui, sans-serif; color: var(--g-dim, rgba(243,233,225,.6)); background: rgba(255,255,255,.04); border: 1px solid #3a2c40; border-radius: 999px; padding: 6px 12px; cursor: pointer; }
.ach-chip:hover { border-color: #ff8a2a; color: #f3e9e1; }
.ach-chip.on { background: #ff8a2a; border-color: #ff8a2a; color: #1b1220; }
.ach-sec { display: flex; align-items: baseline; gap: 10px; margin: 20px 0 10px; font-weight: 800; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; color: #b98cff; }
.ach-sec span { font-weight: 600; letter-spacing: 0; color: var(--g-dim, rgba(243,233,225,.6)); }
.ach-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
.ach-card { display: grid; grid-template-columns: 56px 1fr; gap: 12px; align-items: start; background: rgba(255,255,255,.04); border: 1px solid #3a2c40; border-radius: 14px; padding: 12px 14px; }
.ach-card canvas { width: 52px; height: 52px; margin-top: 2px; }
.ach-card .ach-name { font-weight: 800; font-size: 15px; }
.ach-card .ach-desc { font-size: 13px; color: var(--g-dim, rgba(243,233,225,.6)); margin-top: 3px; line-height: 1.35; }
.ach-card .ach-prog { height: 6px; border-radius: 3px; background: rgba(255,255,255,.12); overflow: hidden; margin-top: 8px; }
.ach-card .ach-prog i { display: block; height: 100%; background: #ff8a2a; border-radius: 3px; }
.ach-card .ach-pnum { font-size: 11px; color: var(--g-dim, rgba(243,233,225,.6)); margin-top: 3px; }
.ach-card .ach-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; font-size: 12px; }
.ach-card .ach-rew { display: flex; align-items: center; gap: 4px; font-weight: 800; color: #ffd36a; white-space: nowrap; }
.ach-card .ach-rew canvas { width: 18px; height: 18px; margin: 0; }
.ach-card .ach-state { color: var(--g-dim, rgba(243,233,225,.6)); text-align: right; }
.ach-card.locked canvas.ach-ic { filter: grayscale(1) brightness(.6); opacity: .55; }
.ach-card.locked .ach-name { color: rgba(243,233,225,.75); }
.ach-card.locked .ach-rew { color: rgba(255,211,106,.55); }
.ach-card.done { border-color: #ffbf2e; background: linear-gradient(135deg, rgba(255,191,46,.10), rgba(255,138,42,.04)); box-shadow: 0 0 0 1px rgba(255,191,46,.18) inset; }
.ach-card.done .ach-state { color: #ffd36a; font-weight: 700; }
.ach-card.secret .ach-name { letter-spacing: 3px; }
`;
  function injectCss() {
    if (document.getElementById('ach-css')) return;
    const s = document.createElement('style');
    s.id = 'ach-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  let filter = 'All';
  function render(body, H) {
    injectCss();
    const data = ensure(H.Meta.data);
    // state-based achievements (shop purchases, skins …) that were reached since the last check
    evaluate({ data, game: null, end: false, won: false, wi: -1, boss: null, run: null }, true);
    const el = H.el;
    const done = defs.filter((d) => data.ach[d.id]);
    const earned = done.reduce((n, d) => n + d.reward, 0);

    const head = el('div', 'ach-head');
    const tot = el('div', 'ach-total', done.length + ' / ' + defs.length + ' unlocked');
    tot.appendChild(el('small', '', fmt(earned) + ' Rutabagas earned from achievements'));
    head.appendChild(tot);
    const chips = el('div', 'ach-chips');
    for (const c of ['All'].concat(CATS)) {
      const n = c === 'All' ? defs : defs.filter((d) => d.cat === c);
      const b = el('button', 'ach-chip' + (c === filter ? ' on' : ''), c + ' ' + n.filter((d) => data.ach[d.id]).length + '/' + n.length);
      b.onclick = () => { H.sfx('click'); filter = c; H.refresh(); };
      chips.appendChild(b);
    }
    head.appendChild(chips);
    body.appendChild(head);
    const bar = el('div', 'ach-bar'); const fill = el('i'); fill.style.width = (100 * done.length / defs.length) + '%'; bar.appendChild(fill); body.appendChild(bar);

    for (const cat of CATS) {
      if (filter !== 'All' && filter !== cat) continue;
      const list = defs.filter((d) => d.cat === cat);
      const sec = el('div', 'ach-sec', cat);
      sec.appendChild(el('span', '', list.filter((d) => data.ach[d.id]).length + ' / ' + list.length));
      body.appendChild(sec);
      const grid = el('div', 'ach-grid');
      for (const d of list) {
        const got = data.ach[d.id];
        const hidden = d.secret && !got;
        const card = el('div', 'ach-card ' + (got ? 'done' : 'locked') + (hidden ? ' secret' : ''));
        const ic = H.iconCanvas(hidden ? 'lantern' : d.icon, 56); ic.className = 'ach-ic';
        card.appendChild(ic);
        const mid = el('div');
        mid.appendChild(el('div', 'ach-name', hidden ? '???' : d.name));
        mid.appendChild(el('div', 'ach-desc', hidden ? 'Secret achievement – keep playing to find out.' : d.desc));
        if (d.goal && !got) {
          const cur = Math.min(d.goal, d.prog(data));
          const p = el('div', 'ach-prog'); const f = el('i'); f.style.width = (100 * cur / d.goal) + '%'; p.appendChild(f); mid.appendChild(p);
          mid.appendChild(el('div', 'ach-pnum', fmt(cur) + ' / ' + fmt(d.goal)));
        }
        const foot = el('div', 'ach-foot');
        const rew = el('span', 'ach-rew'); rew.appendChild(H.iconCanvas('rutabaga', 40)); rew.appendChild(document.createTextNode('+' + fmt(d.reward)));
        foot.appendChild(rew);
        foot.appendChild(el('span', 'ach-state', got ? 'Unlocked · ' + new Date(got.at || Date.now()).toLocaleDateString('en-GB') : 'Locked'));
        mid.appendChild(foot);
        card.appendChild(mid);
        grid.appendChild(card);
      }
      body.appendChild(grid);
    }
  }

  // shop purchases etc. save the Meta: re-check state-based achievements right after (deferred, so run results come first)
  if (Meta && !Meta.__achWrapped) {
    Meta.__achWrapped = true;
    const orig = Meta.save;
    let pending = false;
    Meta.save = function () {
      const r = orig.apply(this, arguments);
      if (!inEval && !pending && Meta.data) {
        pending = true;
        setTimeout(() => {
          pending = false;
          if (Meta.data) evaluate({ data: Meta.data, game: null, end: false, won: false, wi: -1, boss: null, run: null }, true);
        }, 0);
      }
      return r;
    };
  }

  window.Achievements = { defs, categories: CATS, runStart, runEnd };
  // app.js (which defines window.App) loads after this file -> register once the document is parsed
  const reg = () => { if (window.App && !window.App.tabs.some((t) => t.id === 'achievements')) window.App.registerTab('achievements', 'Achievements', 60, render); };
  if (window.App) reg(); else document.addEventListener('DOMContentLoaded', reg);
})();
