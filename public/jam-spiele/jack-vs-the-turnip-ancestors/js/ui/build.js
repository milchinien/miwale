/* Build overview (Tab): weapons, passive upgrades and live stats of the current run.
   Public API: window.Build.render(container, game, H)  – may be called repeatedly. */
(function () {
  'use strict';

  const PIP_COLORS = ['#ff8a2a', '#ffb02e', '#7fd95a', '#b98cff', '#ffd23f'];
  const WEAPON_IDS = ['pistol', 'rocket', 'aura', 'boulder'];
  const WEAPON_FALLBACK = {
    pistol: { name: 'Seed Pistol', icon: 'dmg', hint: 'Rapid pumpkin seeds at the nearest enemy.' },
    rocket: { name: 'Rutabaga Rocket', icon: 'rocket', hint: 'Homing rockets with an explosive finish.' },
    aura: { name: 'Kill Circle', icon: 'nova', hint: 'A ring of power that hurts everything near Jack.' },
    boulder: { name: 'Bouncing Boulder', icon: 'bounce', hint: 'A heavy boulder that ricochets across the field.' },
  };

  const CSS = `
#build .panel.wide { max-width: 1340px; width: 94vw; padding: 20px 26px 22px; }
#build .p-head { margin-bottom: 4px; }
.bd-hint { text-align: center; font-size: 13px; color: var(--g-dim); margin: 0 0 14px; }
.bd-hint kbd { display: inline-block; font: 800 12px/1 Inter, system-ui, sans-serif; padding: 4px 8px; margin: 0 2px; border-radius: 6px; color: #1a0f08; background: linear-gradient(#ffb25c, #e8701c); box-shadow: 0 2px 0 #7a3a0c; }
.bd-grid { display: grid; grid-template-columns: 1.3fr 1.05fr .9fr; gap: 18px; align-items: start; }
.bd-col { min-width: 0; display: flex; flex-direction: column; gap: 10px; }
.bd-col > h3 { margin: 0 0 2px; font: 900 12px/1 Inter, system-ui, sans-serif; letter-spacing: 2.4px; text-transform: uppercase; color: var(--g-accent); display: flex; align-items: center; gap: 10px; }
.bd-col > h3::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, var(--g-line), transparent); }
.bd-col > h3 small { order: 2; font-size: 11px; letter-spacing: 1px; color: var(--g-dim); font-weight: 700; text-transform: none; }

.bd-weapon { display: grid; grid-template-columns: 52px 1fr; gap: 6px 14px; padding: 12px 14px; border-radius: 14px; background: rgba(255,255,255,.04); border: 1px solid var(--g-line); position: relative; }
.bd-weapon canvas { width: 52px; height: 52px; }
.bd-weapon.lv5 { border-color: #ffd23f; box-shadow: 0 0 22px rgba(255,210,63,.18); }
.bd-weapon.locked { opacity: .5; background: rgba(255,255,255,.02); border-style: dashed; }
.bd-weapon.locked canvas { filter: grayscale(1) brightness(.6); }
.bd-wtop { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.bd-wname { font-weight: 800; font-size: 16px; }
.bd-wlv { margin-left: auto; font: 800 12px/1 Inter, system-ui, sans-serif; color: var(--g-dim); letter-spacing: .5px; }
.bd-pips { display: flex; gap: 4px; }
.bd-pips i { width: 22px; height: 7px; border-radius: 4px; background: rgba(255,255,255,.12); }
.bd-pips i.on { box-shadow: 0 0 8px currentColor; }
.bd-lines { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 16px; margin-top: 7px; font-size: 13px; }
.bd-lines div { display: flex; gap: 6px; color: #eadfd6; white-space: nowrap; }
.bd-lines div span { color: var(--g-dim); overflow: hidden; text-overflow: ellipsis; }
.bd-lines div b { font-weight: 800; color: #fff; }
.bd-look { margin-top: 7px; font-size: 12px; color: var(--g-dim); font-style: italic; line-height: 1.4; }
.bd-next { margin-top: 6px; font-size: 12px; color: #8fe07a; line-height: 1.4; }
.bd-next b { color: #b6f29f; letter-spacing: 1px; font-size: 10px; text-transform: uppercase; margin-right: 5px; }
.bd-max { margin-top: 6px; font: 800 11px/1 Inter, system-ui, sans-serif; letter-spacing: 1.5px; color: #ffd23f; text-transform: uppercase; }
.bd-wmain { min-width: 0; }

.bd-item { display: grid; grid-template-columns: 38px 1fr auto; gap: 10px; align-items: center; padding: 8px 12px; border-radius: 12px; background: rgba(255,255,255,.04); border: 1px solid var(--g-line); }
.bd-item canvas { width: 36px; height: 36px; }
.bd-iname { font-weight: 800; font-size: 14px; }
.bd-itotal { font-size: 12px; color: #ffcf8f; margin-top: 2px; line-height: 1.3; }
.bd-icount { text-align: right; font: 800 13px/1 Inter, system-ui, sans-serif; white-space: nowrap; }
.bd-icount small { display: block; margin-top: 5px; font-size: 11px; color: var(--g-dim); font-weight: 700; }
.bd-item.maxed { border-color: #ffd23f; }
.bd-item.maxed .bd-icount { color: #ffd23f; }
.bd-item.unknown { opacity: .4; border-style: dashed; background: rgba(255,255,255,.015); }
.bd-item.unknown .bd-q { width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,.07); display: grid; place-items: center; font: 900 20px/1 Fraunces, serif; color: var(--g-dim); }
.bd-ipips { display: flex; gap: 2px; margin-top: 5px; justify-content: flex-end; }
.bd-ipips i { width: 8px; height: 5px; border-radius: 2px; background: rgba(255,255,255,.12); }
.bd-ipips i.on { background: var(--g-accent); }
.bd-item.maxed .bd-ipips i.on { background: #ffd23f; }
.bd-empty { padding: 18px; text-align: center; color: var(--g-dim); font-size: 13px; border: 1px dashed var(--g-line); border-radius: 12px; }

.bd-stats { display: flex; flex-direction: column; border-radius: 14px; background: rgba(255,255,255,.04); border: 1px solid var(--g-line); padding: 2px 14px 4px; }
.bd-stats .bd-sh { margin: 8px 0 1px; font: 800 10px/1 Inter, system-ui, sans-serif; letter-spacing: 2px; text-transform: uppercase; color: var(--g-dim); }
.bd-srow { display: flex; align-items: baseline; gap: 8px; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,.06); font-size: 13px; }
.bd-srow:last-child { border-bottom: 0; }
.bd-srow span { color: var(--g-dim); }
.bd-srow em { font-style: normal; font-size: 11px; color: var(--g-dim); margin-left: auto; opacity: .8; }
.bd-srow b { margin-left: auto; font-weight: 800; font-variant-numeric: tabular-nums; }
.bd-srow em + b { margin-left: 0; }
.bd-srow b.up { color: #8fe07a; } .bd-srow b.down { color: #ff8f7a; }
.bd-hp { height: 8px; border-radius: 4px; background: rgba(255,255,255,.1); overflow: hidden; margin: 2px 0 5px; }
.bd-hp i { display: block; height: 100%; background: linear-gradient(90deg, #e8451f, #ff8a2a); border-radius: 4px; }
.bd-prog { height: 6px; border-radius: 3px; background: rgba(255,255,255,.1); overflow: hidden; margin: 2px 0 5px; }
.bd-prog i { display: block; height: 100%; background: linear-gradient(90deg, #ffa24a, #b98cff); }
.bd-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.bd-chip { font-size: 11px; font-weight: 700; padding: 5px 9px; border-radius: 999px; background: rgba(185,140,255,.12); border: 1px solid rgba(185,140,255,.35); color: #dccbff; white-space: nowrap; }
.bd-chip b { color: #fff; font-weight: 800; }
@media (max-height: 800px) {
  .bd-srow { padding: 2px 0; } .bd-hint { margin-bottom: 8px; } #build .panel.wide { padding: 14px 22px 16px; }
  .bd-weapon { padding: 8px 12px; } .bd-lines { margin-top: 4px; font-size: 12px; } .bd-look { margin-top: 4px; } .bd-item { padding: 6px 10px; }
}
`;

  function ensureCss() {
    let s = document.getElementById('build-css');
    if (!s) { s = document.createElement('style'); s.id = 'build-css'; document.head.appendChild(s); }
    if (s.textContent !== CSS) s.textContent = CSS;
  }

  const fmt = (v, d = 0) => { const p = 10 ** d; return (Math.round(v * p) / p).toString(); };
  const pct = (v, d = 0) => (v >= 0 ? '+' : '−') + fmt(Math.abs(v) * 100, d) + '%';

  function iconOf(H, id, size) {
    try { if (H && H.iconCanvas) return H.iconCanvas(id, size); } catch (e) { /* ignore */ }
    const c = document.createElement('canvas'); c.width = c.height = size; return c;
  }

  /* ---------- weapons ---------- */
  function weaponData(game) {
    let list = [];
    try { list = (window.Weapons && window.Weapons.describe && window.Weapons.describe(game)) || []; } catch (e) { list = []; }
    const byId = {};
    for (const d of list) if (d && d.id) byId[d.id] = d;
    return WEAPON_IDS.map((id) => {
      const d = byId[id] || {};
      const fb = WEAPON_FALLBACK[id];
      const names = (window.Weapons && window.Weapons.NAMES) || {};
      const level = (game.weapons && game.weapons[id]) || d.level || 0;
      return {
        id, level, max: d.max || 5, name: d.name || names[id] || fb.name, icon: d.icon || fb.icon,
        lines: Array.isArray(d.lines) ? d.lines : [], look: d.look || '', next: d.next || null, hint: fb.hint,
        power: (game.weaponPower && game.weaponPower[id]) || 1,
      };
    });
  }

  function lineNode(line) {
    const row = document.createElement('div');
    if (line && typeof line === 'object') {
      const k = document.createElement('span'); k.textContent = line.label || line.name || '';
      const v = document.createElement('b'); v.textContent = line.value !== undefined ? line.value : '';
      row.append(k, v);
      return row;
    }
    const s = String(line);
    const m = s.match(/^(.*?)[:\s]+([+\-−×x]?[\d][\d.,]*\s?[%a-zA-Z/×]*)$/); // "Damage 12" -> label + value
    if (m && m[1] && m[1].length < 22) {
      const k = document.createElement('span'); k.textContent = m[1];
      const v = document.createElement('b'); v.textContent = m[2];
      row.append(k, v);
    } else {
      row.style.gridColumn = '1 / -1';
      row.textContent = s;
    }
    return row;
  }

  function weaponCard(H, w) {
    const el = H.el;
    const card = el('div', 'bd-weapon' + (w.level <= 0 ? ' locked' : '') + (w.level >= w.max ? ' lv5' : ''));
    card.appendChild(iconOf(H, w.icon, 52));
    const main = el('div', 'bd-wmain');
    const top = el('div', 'bd-wtop');
    top.appendChild(el('div', 'bd-wname', w.name));
    const pips = el('div', 'bd-pips');
    for (let i = 0; i < w.max; i++) {
      const p = document.createElement('i');
      if (i < w.level) { p.className = 'on'; p.style.background = PIP_COLORS[Math.min(i, PIP_COLORS.length - 1)]; p.style.color = PIP_COLORS[Math.min(i, PIP_COLORS.length - 1)]; }
      pips.appendChild(p);
    }
    top.appendChild(pips);
    top.appendChild(el('div', 'bd-wlv', w.level > 0 ? 'Lv ' + w.level + ' / ' + w.max : 'Not found yet'));
    main.appendChild(top);

    if (w.level <= 0) {
      main.appendChild(el('div', 'bd-look', w.hint));
    } else {
      if (w.lines.length) {
        const ls = el('div', 'bd-lines');
        for (const l of w.lines) ls.appendChild(lineNode(l));
        main.appendChild(ls);
      }
      if (w.power > 1.001) main.appendChild(el('div', 'bd-look', 'Card power ×' + fmt(w.power, 2)));
      if (w.look) main.appendChild(el('div', 'bd-look', w.look));
      if (w.level >= w.max) main.appendChild(el('div', 'bd-max', 'Maxed out'));
      else if (w.next && (!Array.isArray(w.next) || w.next.length)) {
        const n = el('div', 'bd-next');
        n.appendChild(el('b', '', 'Next level'));
        n.appendChild(document.createTextNode(Array.isArray(w.next) ? w.next.map((x) => (typeof x === 'object' ? (x.label || '') + ' ' + (x.value || '') : x)).join(' · ') : String(w.next)));
        main.appendChild(n);
      }
    }
    card.appendChild(main);
    return card;
  }

  /* ---------- passives ---------- */
  function totalText(item, count) {
    try {
      let t = item.text(count);
      t = t.replace(/,\s*full heal$/i, '');
      return t;
    } catch (e) { return ''; }
  }

  function itemRow(H, GD, id, count) {
    const el = H.el;
    const item = GD.ITEM_BY_ID[id];
    if (!item) return null;
    const max = item.max || 0;
    const row = el('div', 'bd-item' + (max && count >= max ? ' maxed' : ''));
    row.appendChild(iconOf(H, item.icon, 36));
    const mid = el('div', '');
    mid.appendChild(el('div', 'bd-iname', item.name));
    mid.appendChild(el('div', 'bd-itotal', 'Total: ' + totalText(item, count)));
    row.appendChild(mid);
    const right = el('div', 'bd-icount', '×' + count + (max ? ' / ' + max : ''));
    if (max && max <= 10) {
      const pips = el('div', 'bd-ipips');
      for (let i = 0; i < max; i++) pips.appendChild(el('i', i < count ? 'on' : ''));
      right.appendChild(pips);
    } else right.appendChild(el('small', '', max ? '' : 'no limit'));
    row.appendChild(right);
    return row;
  }

  function unknownRow(H) {
    const el = H.el;
    const row = el('div', 'bd-item unknown');
    row.appendChild(el('div', 'bd-q', '?'));
    const mid = el('div', '');
    mid.appendChild(el('div', 'bd-iname', '? ? ?'));
    mid.appendChild(el('div', 'bd-itotal', 'Not found yet'));
    row.append(mid, el('div', 'bd-icount', ''));
    return row;
  }

  /* ---------- stats ---------- */
  function statRow(H, label, value, sub, cls) {
    const el = H.el;
    const r = el('div', 'bd-srow');
    r.appendChild(el('span', '', label));
    if (sub) r.appendChild(el('em', '', sub));
    r.appendChild(el('b', cls || '', value));
    return r;
  }

  function worldName(game) {
    const W = window.Worlds;
    const list = W && (W.available ? W.available() : W.list) || [];
    const w = list[game.worldIndex] || (W && W.list && W.list[game.worldIndex]);
    return (w && w.name) || 'World ' + ((game.worldIndex || 0) + 1);
  }

  function render(container, game, H) {
    ensureCss();
    H = H || (window.App && window.App.helpers) || {};
    if (!H.el) H.el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
    const GD = H.GD || window.GameData;
    const el = H.el;
    const fmtNum = H.fmtNum || ((n) => Math.round(n).toLocaleString('en-US'));
    const fmtTime = H.fmtTime || ((s) => Math.floor(s / 60) + ':' + String(Math.round(s) % 60).padStart(2, '0'));
    container.innerHTML = '';

    const hint = el('div', 'bd-hint');
    hint.append('Press ', el('kbd', '', 'Tab'), ' to return');
    container.appendChild(hint);
    const grid = el('div', 'bd-grid');
    container.appendChild(grid);

    /* --- column 1: weapons --- */
    const wc = el('div', 'bd-col');
    const ws = weaponData(game);
    const found = ws.filter((w) => w.level > 0).length;
    const h1 = el('h3', '', 'Weapons'); h1.appendChild(el('small', '', found + ' / ' + ws.length));
    wc.appendChild(h1);
    for (const w of ws) wc.appendChild(weaponCard(H, w));
    grid.appendChild(wc);

    /* --- column 2: passive upgrades --- */
    const pc = el('div', 'bd-col');
    const owned = Object.entries(game.owned || {}).filter(([k, n]) => !k.startsWith('w_') && n > 0 && GD.ITEM_BY_ID[k]);
    const allPassives = GD.ITEMS.filter((i) => !i.weapon && !String(i.id).startsWith('w_'));
    const h2 = el('h3', '', 'Passive upgrades'); h2.appendChild(el('small', '', owned.length + ' / ' + allPassives.length + ' found'));
    pc.appendChild(h2);
    const list = el('div', 'bd-col'); list.style.gap = '7px';
    if (!owned.length) list.appendChild(el('div', 'bd-empty', 'No passive upgrades yet. Pick some on your next level-up!'));
    for (const [id, n] of owned) { const r = itemRow(H, GD, id, n); if (r) list.appendChild(r); }
    const missing = allPassives.length - owned.length;
    for (let i = 0; i < Math.min(3, missing); i++) list.appendChild(unknownRow(H));
    pc.appendChild(list);
    grid.appendChild(pc);

    /* --- column 3: stats --- */
    const sc = el('div', 'bd-col');
    sc.appendChild(el('h3', '', 'Stats'));
    const S = game.stats || {}, p = game.player || { hp: 0, maxHp: 0 };
    const box = el('div', 'bd-stats');
    box.appendChild(el('div', 'bd-sh', 'Jack'));
    box.appendChild(statRow(H, 'Health', Math.ceil(p.hp) + ' / ' + Math.round(p.maxHp)));
    const bar = el('div', 'bd-hp'); const bi = document.createElement('i'); bi.style.width = Math.max(0, Math.min(100, (p.hp / Math.max(1, p.maxHp)) * 100)) + '%'; bar.appendChild(bi); box.appendChild(bar);
    const dmgMul = S.dmgMul || 1;
    box.appendChild(statRow(H, 'Damage', fmt((S.dmg || 0) * dmgMul, 1), fmt(S.dmg || 0) + ' × ' + fmt(dmgMul, 2), dmgMul > 1.001 ? 'up' : ''));
    const as = S.atkSpeed || 1;
    box.appendChild(statRow(H, 'Attack speed', '×' + fmt(as, 2), '', as > 1.001 ? 'up' : ''));
    box.appendChild(statRow(H, 'Crit chance', fmt((S.crit || 0) * 100) + '%'));
    box.appendChild(statRow(H, 'Move speed', fmt(S.speed || 0), pct((S.speed || 92) / 92 - 1) + ' vs. base', (S.speed || 0) > 92.5 ? 'up' : ''));
    box.appendChild(statRow(H, 'Pickup radius', fmt(S.magnet || 0), pct((S.magnet || 46) / 46 - 1) + ' vs. base', (S.magnet || 0) > 46.5 ? 'up' : ''));
    const armor = S.armor === undefined ? 1 : S.armor;
    box.appendChild(statRow(H, 'Damage taken', fmt(armor * 100) + '%', '', armor < 0.999 ? 'up' : ''));
    box.appendChild(statRow(H, 'Regeneration', (S.regen ? fmt(S.regen, 1) : '0') + ' HP/s', 'standing still', S.regen > 0 ? 'up' : ''));
    box.appendChild(statRow(H, 'Luck', fmt(S.luck || 0, 1)));
    box.appendChild(statRow(H, 'Rutabaga bonus', pct((S.greed || 1) - 1), '', (S.greed || 1) > 1.001 ? 'up' : ''));
    box.appendChild(statRow(H, 'XP bonus', pct((S.xpMul || 1) - 1), '', (S.xpMul || 1) > 1.001 ? 'up' : ''));
    if (S.leech > 0) box.appendChild(statRow(H, 'Kill heal chance', fmt(S.leech * 100) + '%'));

    box.appendChild(el('div', 'bd-sh', 'This run'));
    box.appendChild(statRow(H, 'Level', String(game.level || 1)));
    box.appendChild(statRow(H, 'Time', fmtTime(game.totalTime || game.time || 0)));
    box.appendChild(statRow(H, 'Enemies defeated', fmtNum(game.kills || 0)));
    box.appendChild(statRow(H, 'Rutabagas', fmtNum(game.rutas || 0)));
    box.appendChild(statRow(H, 'World', worldName(game)));
    let clock = ''; try { clock = game.clockText; } catch (e) { /* ignore */ }
    box.appendChild(statRow(H, 'Evening', clock, game.phase === 'boss' ? 'Boss fight' : game.phase === 'portal' ? 'Portal open' : ''));
    const prog = el('div', 'bd-prog'); const pi = document.createElement('i');
    let dp = 0; try { dp = game.dayProgress || 0; } catch (e) { /* ignore */ }
    pi.style.width = Math.round(Math.max(0, Math.min(1, dp)) * 100) + '%'; prog.appendChild(pi); box.appendChild(prog);
    sc.appendChild(box);

    /* permanent bonuses */
    const mods = (game.meta && game.meta.mods) || {};
    const defs = (H.Meta && H.Meta.MODS) || (window.Meta && window.Meta.MODS) || [];
    const active = defs.filter((m) => mods[m.id] > 0);
    if (active.length) {
      const h = el('h3', '', 'Permanent bonuses');
      sc.appendChild(h);
      const chips = el('div', 'bd-chips');
      for (const m of active) {
        const c = el('span', 'bd-chip');
        c.appendChild(document.createTextNode(m.name + ' '));
        let d = ''; try { d = m.desc(mods[m.id]); } catch (e) { /* ignore */ }
        c.appendChild(el('b', '', d));
        chips.appendChild(c);
      }
      sc.appendChild(chips);
    }
    grid.appendChild(sc);
  }

  window.Build = { render };
})();
