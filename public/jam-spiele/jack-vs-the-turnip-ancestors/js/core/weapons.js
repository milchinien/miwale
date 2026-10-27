/* WEAPONS – the four in-run weapons, all in PUMPKIN STYLE, 5 levels each (every level = stronger AND a new look):
   Seed Pistol · Rutabaga Rocket · Kill Circle (aura) · Bouncing Boulder.
   Owns: simulation (firing, projectiles, damage), visuals (drawUnder / drawOver), card items and the build overview.
   Public API: Weapons.items, NAMES, reset(game), update(game, dt), drawUnder, drawOver, describe(game). */
(function () {
  'use strict';
  const U = window.U;
  const TAU = Math.PI * 2;
  const NAMES = { pistol: 'Seed Pistol', rocket: 'Rutabaga Rocket', aura: 'Kill Circle', boulder: 'Bouncing Boulder' };
  const ICONS = { pistol: 'dmg', rocket: 'rocket', aura: 'nova', boulder: 'bounce' };
  const IDS = ['pistol', 'rocket', 'aura', 'boulder'];
  const SQ = 0.8; // ground squash of the 3/4 view (matches the core rings)

  /* ---------------- balance tables (dmg = multiple of stats.dmg; base dmg 10) ---------------- */
  // single-target DPS at L1..L5 (pistol): 18 · 26 · 53 · 73 · 108
  const PISTOL = [null,
    { n: 1, dmg: 1.0, rate: 1.8, pierce: 0, bounce: 0, r: 3.5, spd: 1.0 },
    { n: 1, dmg: 1.2, rate: 2.2, pierce: 1, bounce: 0, r: 3.7, spd: 1.04 },
    { n: 2, dmg: 1.2, rate: 2.2, pierce: 1, bounce: 0, r: 3.9, spd: 1.08 },
    { n: 2, dmg: 1.4, rate: 2.6, pierce: 2, bounce: 1, r: 4.1, spd: 1.12 },
    { n: 3, dmg: 1.2, rate: 3.0, pierce: 3, bounce: 2, r: 4.5, spd: 1.18 },
  ];
  // per rocket blast; single-target DPS ≈ 18 · 40 · 54 · 83 · 110, much more on groups
  const ROCKET = [null,
    { n: 1, dmg: 3.2, cd: 1.8, R: 34, cluster: 0 },
    { n: 2, dmg: 3.2, cd: 1.6, R: 40, cluster: 0 },
    { n: 2, dmg: 3.8, cd: 1.4, R: 48, cluster: 0 },
    { n: 3, dmg: 3.2, cd: 1.4, R: 54, cluster: 2 },
    { n: 4, dmg: 2.6, cd: 1.2, R: 62, cluster: 3 },
  ];
  // per enemy inside: 14 · 21 · 30 · 42 · 64 dps (+ pulse at L5), always hits everybody in the ring
  const AURA = [null,
    { R: 46, dmg: 0.5, tick: 0.35 },
    { R: 56, dmg: 0.7, tick: 0.33 },
    { R: 66, dmg: 0.9, tick: 0.30 },
    { R: 78, dmg: 1.1, tick: 0.26 },
    { R: 90, dmg: 1.4, tick: 0.22, pulse: 3.6 },
  ];
  const BOULDER = [null,
    { n: 1, r: 11, spd: 90, dmg: 2.2, kb: 1.5, trail: false },
    { n: 1, r: 12, spd: 100, dmg: 2.7, kb: 1.8, trail: false },
    { n: 2, r: 13, spd: 110, dmg: 3.2, kb: 2.2, trail: false },
    { n: 2, r: 14, spd: 120, dmg: 3.8, kb: 2.6, trail: true },
    { n: 3, r: 16, spd: 135, dmg: 4.6, kb: 3.2, trail: true },
  ];
  const TABLE = { pistol: PISTOL, rocket: ROCKET, aura: AURA, boulder: BOULDER };

  const LOOK = {
    pistol: ['', 'Plain cream pumpkin seeds', 'Amber glowing seeds with a warm trail', 'Flaming seeds with a fire tail', 'Violet-white sparking seeds', 'Golden comet seeds with sparkles'],
    rocket: ['', 'Small orange pumpkin rocket, ember trail', 'Amber rocket with leaf fins', 'Red-hot rocket, big flame, wide fins', 'Violet-nosed rocket, cluster blasts', 'Golden rutabaga missile, huge gold flame'],
    aura: ['', 'Ring of orange jack-o\'-lantern flames', 'Amber flames wrapped in a thorny vine', 'Green witch-fire with floating wisps', 'Violet rune circle with spirit flames', 'Golden sun with rays and a counter-rotating ring'],
    boulder: ['', 'Rolling stone-orange pumpkin boulder', 'Cracked boulder with glowing seams', 'Vine-wrapped boulder, green glow', 'Violet-glowing boulder, fiery trail', 'Golden boulder with a blazing trail'],
  };

  /* ---------------- helpers ---------------- */
  const pct = (b, a) => Math.round((b / a - 1) * 100);
  const f1 = (v) => (Math.round(v * 10) / 10).toString();
  const bodyY = (e) => e.y - e.r * 0.5;
  const settings = () => (window.Meta && window.Meta.settings) || {};
  const lvOf = (g, id) => (g && g.weapons && g.weapons[id]) || 0;
  const powOf = (g, id) => (g && g.weaponPower && g.weaponPower[id]) || 1;

  function state(game) {
    let w = game.wst;
    if (!w) {
      w = game.wst = {
        pistolT: 0.3, rocketT: 0.9, pend: 0, pendT: 0, pendLv: 1, ex: new Set(),
        blasts: [], sparks: [], boulders: [], auraA: 0, pulseT: 2.5, pulse: null, flick: 0,
      };
    }
    return w;
  }
  function addSpark(W, x, y, vx, vy, life, size, col, z, grav) {
    if (W.sparks.length >= 90) return;
    W.sparks.push({ x, y, z: z || 4, vx, vy, vz: 20 + Math.random() * 30, life, max: life, size, col, grav: grav === undefined ? 160 : grav });
  }
  function sparkBurst(W, x, y, n, cols, speed, size) {
    const pm = [0, 0.4, 1, 1.4][settings().particles === undefined ? 2 : settings().particles];
    n = Math.round(n * pm);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = speed * (0.4 + Math.random() * 0.8);
      addSpark(W, x, y, Math.cos(a) * s, Math.sin(a) * s * 0.7, 0.28 + Math.random() * 0.3, size * (0.7 + Math.random() * 0.7), cols[(Math.random() * cols.length) | 0]);
    }
  }
  /** enemy spit shots are swatted out of the air by our areas */
  function swat(game, x, y, R) {
    const sh = game.eshots;
    if (!sh || !sh.length) return;
    for (let i = 0; i < sh.length; i++) {
      const s = sh[i];
      if (s.life <= 0) continue;
      const dx = s.x - x, dy = (s.y - y) / SQ, rr = R + (s.r || 3);
      if (dx * dx + dy * dy < rr * rr) s.life = 0;
    }
  }

  /* ---------------- sprites (pre-rendered, lazily, per resolution k) ---------------- */
  const CACHE = {};
  function cached(k, key, build) {
    const c = CACHE[k] || (CACHE[k] = {});
    return c[key] || (c[key] = build());
  }
  function glowSprite(col) {
    return cached(1, 'glow' + col, () => U.sprite(64, 64, (c) => {
      const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, col); g.addColorStop(0.35, col); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalAlpha = 1; c.fillStyle = g; c.fillRect(0, 0, 64, 64);
    }));
  }
  const SEED_COL = [null,
    { body: '#fff1c9', edge: '#5a3410', hi: '#ffffff', glow: '#fff1c9', trail: '#fff1c9' },
    { body: '#ffd27a', edge: '#6a3a08', hi: '#fff6d0', glow: '#ffb21f', trail: '#ffb43d' },
    { body: '#ffb347', edge: '#6a2306', hi: '#ffe8a0', glow: '#ff6a1f', trail: '#ff6a1f' },
    { body: '#f4eaff', edge: '#3b1c6e', hi: '#ffffff', glow: '#b48cff', trail: '#b48cff' },
    { body: '#ffe08a', edge: '#6a4400', hi: '#ffffff', glow: '#ffd24a', trail: '#ffd24a' },
  ];
  function seedSprite(lv, k) {
    return cached(k, 'seed' + lv, () => {
      const L = 7 + lv * 0.6, Wd = 3.6 + lv * 0.35, col = SEED_COL[lv];
      const w = (L + 4) * k, h = (Wd + 4) * k;
      return U.sprite(w, h, (c) => {
        c.scale(k, k); c.translate((L + 4) / 2, (Wd + 4) / 2);
        const path = () => {
          c.beginPath(); c.moveTo(L / 2, 0);
          c.bezierCurveTo(L / 6, -Wd * 0.62, -L / 3, -Wd * 0.62, -L / 2, -Wd * 0.2);
          c.quadraticCurveTo(-L / 2 - 0.5, 0, -L / 2, Wd * 0.2);
          c.bezierCurveTo(-L / 3, Wd * 0.62, L / 6, Wd * 0.62, L / 2, 0); c.closePath();
        };
        path(); c.lineJoin = 'round'; c.lineWidth = 1.9; c.strokeStyle = col.edge; c.stroke();
        path(); c.fillStyle = col.body; c.fill();
        c.strokeStyle = col.edge; c.globalAlpha = 0.45; c.lineWidth = 0.55;
        c.beginPath(); c.moveTo(-L * 0.38, 0); c.lineTo(L * 0.3, 0); c.stroke();
        c.globalAlpha = 0.9; c.strokeStyle = col.hi; c.lineWidth = 0.7; c.lineCap = 'round';
        c.beginPath(); c.moveTo(-L * 0.25, -Wd * 0.25); c.lineTo(L * 0.2, -Wd * 0.3); c.stroke();
      });
    });
  }
  function trailSprite(lv, k) {
    return cached(k, 'trail' + lv, () => {
      const L = 26, H = 7, col = SEED_COL[lv];
      return U.sprite(L * k, H * k, (c) => {
        c.scale(k, k);
        const poly = (inset, colr, a) => {
          const g = c.createLinearGradient(0, 0, L, 0);
          g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, colr);
          c.globalAlpha = a; c.fillStyle = g;
          c.beginPath(); c.moveTo(0, H / 2); c.lineTo(L, inset); c.lineTo(L, H - inset); c.closePath(); c.fill();
        };
        poly(1.2 + (lv > 2 ? 0 : 0.8), col.trail, lv === 1 ? 0.45 : 0.8);
        if (lv >= 3) poly(2.2, lv === 3 ? '#ffe08a' : '#ffffff', 0.85);
      });
    });
  }
  function sparkleSprite(k) {
    return cached(k, 'sparkle', () => U.sprite(12 * k, 12 * k, (c) => {
      c.scale(k, k); c.translate(6, 6);
      c.fillStyle = '#fff'; c.beginPath();
      c.moveTo(0, -5.5); c.quadraticCurveTo(0.6, -0.6, 5.5, 0); c.quadraticCurveTo(0.6, 0.6, 0, 5.5);
      c.quadraticCurveTo(-0.6, 0.6, -5.5, 0); c.quadraticCurveTo(-0.6, -0.6, 0, -5.5); c.fill();
    }));
  }

  /* --- rocket --- */
  const ROCKET_COL = [null,
    { body: '#ff8a1f', rib: '#c4560a', nose: '#e8d6a8', tip: '#9a6aa8', flame: ['#ff6a1f', '#ffc04d', '#fff1c9'], ring: '#ff8a1f' },
    { body: '#ffa233', rib: '#d06a10', nose: '#f2dfae', tip: '#a77ab8', flame: ['#ff9a1f', '#ffd25a', '#fffbe0'], ring: '#ffc04d' },
    { body: '#ff6a2a', rib: '#b8310f', nose: '#e8d6a8', tip: '#7a3fa0', flame: ['#ff3b1c', '#ff9a2a', '#fff1a0'], ring: '#ff4a1c' },
    { body: '#ff7f35', rib: '#b8401a', nose: '#d9c4ff', tip: '#b48cff', flame: ['#8a52e0', '#c9a8ff', '#ffffff'], ring: '#b48cff' },
    { body: '#ffd45a', rib: '#c98a14', nose: '#fff4c8', tip: '#ffffff', flame: ['#ffb21f', '#ffe08a', '#ffffff'], ring: '#ffe08a' },
  ];
  const FINS = [0, 0, 2, 2, 4, 4];
  function rocketSprite(lv, k) {
    return cached(k, 'rocket' + lv, () => {
      const col = ROCKET_COL[lv], rx = 6 + lv * 0.3, ry = 4.6 + lv * 0.22, WW = 26, HH = 18;
      return U.sprite(WW * k, HH * k, (c) => {
        c.scale(k, k); c.translate(WW / 2 - 1, HH / 2);
        c.lineJoin = 'round';
        const dark = '#2a1000';
        // leaf fins (back)
        const fl = 3.5 + lv * 0.7;
        const leaf = (sy, len, ang) => {
          c.save(); c.translate(-rx * 0.45, sy * ry * 0.62); c.rotate(ang);
          c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-len * 0.5, -len * 0.42, -len, 0); c.quadraticCurveTo(-len * 0.5, len * 0.42, 0, 0); c.closePath();
          c.lineWidth = 1.5; c.strokeStyle = dark; c.stroke(); c.fillStyle = lv === 5 ? '#9be05a' : '#4fae3a'; c.fill();
          c.strokeStyle = lv === 5 ? '#ffe08a' : '#2f7d28'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(-1, 0); c.lineTo(-len * 0.8, 0); c.stroke();
          c.restore();
        };
        if (FINS[lv] >= 2) { leaf(-1, fl, -0.55); leaf(1, fl, 0.55); }
        if (FINS[lv] >= 4) { leaf(-1, fl * 0.75, -1.05); leaf(1, fl * 0.75, 1.05); }
        // root nose cone
        c.beginPath(); c.moveTo(rx - 1.2, -ry * 0.5); c.quadraticCurveTo(rx + 2.4, -ry * 0.25, rx + 4.8, 0); c.quadraticCurveTo(rx + 2.4, ry * 0.25, rx - 1.2, ry * 0.5); c.closePath();
        c.lineWidth = 1.7; c.strokeStyle = dark; c.stroke(); c.fillStyle = col.nose; c.fill();
        c.beginPath(); c.moveTo(rx + 2.2, -ry * 0.17); c.quadraticCurveTo(rx + 3.6, -0.3, rx + 4.8, 0); c.quadraticCurveTo(rx + 3.6, 0.3, rx + 2.2, ry * 0.17); c.closePath();
        c.fillStyle = col.tip; c.fill();
        // pumpkin body
        c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU);
        c.lineWidth = 1.9; c.strokeStyle = dark; c.stroke();
        const g = c.createRadialGradient(-rx * 0.3, -ry * 0.4, 0.5, 0, 0, rx * 1.1);
        g.addColorStop(0, '#ffffff33'); g.addColorStop(0.01, col.body); g.addColorStop(1, col.rib);
        c.fillStyle = col.body; c.fill();
        c.save(); c.clip();
        c.fillStyle = col.rib; c.globalAlpha = 0.35; c.fillRect(-rx, ry * 0.3, rx * 2, ry);
        c.globalAlpha = 0.85; c.strokeStyle = col.rib; c.lineWidth = 0.8;
        for (let i = -2; i <= 2; i++) {
          c.beginPath(); c.moveTo(i * rx * 0.34, -ry); c.quadraticCurveTo(i * rx * 0.34 + i * 1.3, 0, i * rx * 0.34, ry); c.stroke();
        }
        c.globalAlpha = 0.55; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(-rx * 0.28, -ry * 0.45, rx * 0.42, ry * 0.2, -0.2, 0, TAU); c.fill();
        c.restore();
        // stem
        c.fillStyle = '#4fae3a'; c.strokeStyle = dark; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(-1.5, -ry + 0.4); c.lineTo(-0.2, -ry - 2.2); c.lineTo(1.6, -ry - 2); c.lineTo(1.2, -ry + 0.4); c.closePath(); c.stroke(); c.fill();
        void g;
      });
    });
  }
  function flameSprite(cols, k, key) {
    return cached(k, 'flame' + key, () => U.sprite(24 * k, 14 * k, (c) => {
      c.scale(k, k); c.translate(23, 7); // base at x=23 (right), tip towards the left
      const shape = (len, wid, fill, a) => {
        c.globalAlpha = a; c.fillStyle = fill; c.beginPath();
        c.moveTo(0, -wid); c.bezierCurveTo(-len * 0.35, -wid * 1.05, -len * 0.7, -wid * 0.35, -len, 0);
        c.bezierCurveTo(-len * 0.7, wid * 0.35, -len * 0.35, wid * 1.05, 0, wid); c.closePath(); c.fill();
      };
      shape(22, 6.2, cols[0], 0.95); shape(16, 4.2, cols[1], 1); shape(10, 2.3, cols[2], 1);
    }));
  }
  function flameUpSprite(cols, k, key) {
    return cached(k, 'flameUp' + key, () => U.sprite(10 * k, 14 * k, (c) => {
      c.scale(k, k); c.translate(5, 13.2);
      const shape = (h, w, fill, a, stroke) => {
        c.beginPath(); c.moveTo(-w, 0); c.bezierCurveTo(-w * 1.15, -h * 0.35, -w * 0.3, -h * 0.55, 0.3, -h);
        c.bezierCurveTo(w * 0.1, -h * 0.55, w * 1.15, -h * 0.35, w, 0); c.quadraticCurveTo(0, w * 0.6, -w, 0); c.closePath();
        if (stroke) { c.globalAlpha = 0.85; c.lineJoin = 'round'; c.lineWidth = 1.5; c.strokeStyle = stroke; c.stroke(); }
        c.globalAlpha = a; c.fillStyle = fill; c.fill();
      };
      shape(12, 3.8, cols[0], 0.98, '#2a1000'); shape(8.5, 2.6, cols[1], 1); shape(5, 1.3, cols[2], 1);
    }));
  }
  const FLAME_COLS = {
    orange: ['#ff6a1f', '#ffb21f', '#fff1c9'], amber: ['#ffa21f', '#ffd25a', '#fffbe0'], green: ['#2fb83a', '#7dff6a', '#eaffd8'],
    violet: ['#7a46d6', '#b48cff', '#f3eaff'], gold: ['#ffb21f', '#ffe08a', '#ffffff'], red: ['#e02a10', '#ff7a2a', '#ffe08a'],
  };
  const RUNES = [
    [[[0.5, 1], [0.5, 0]], [[0.5, 0.5], [0.12, 0.08]], [[0.5, 0.5], [0.88, 0.08]]],
    [[[0.25, 0], [0.25, 1]], [[0.25, 0.22], [0.82, 0.5], [0.25, 0.78]]],
    [[[0.5, 0], [0.88, 0.3], [0.5, 0.6], [0.12, 0.3], [0.5, 0]], [[0.3, 1], [0.5, 0.6], [0.7, 1]]],
    [[[0.75, 0], [0.25, 0.4], [0.75, 0.62], [0.25, 1]]],
    [[[0.3, 0], [0.3, 1]], [[0.3, 0.2], [0.82, 0.45]], [[0.3, 0.52], [0.82, 0.78]]],
    [[[0.5, 0], [0.9, 0.5], [0.5, 1], [0.1, 0.5], [0.5, 0]], [[0.5, 0.35], [0.5, 0.65]]],
  ];
  function runeSprite(i, k) {
    return cached(k, 'rune' + i, () => U.sprite(10 * k, 12 * k, (c) => {
      c.scale(k, k); c.translate(1, 1); c.lineCap = 'round'; c.lineJoin = 'round';
      const draw = (w, col) => {
        c.lineWidth = w; c.strokeStyle = col;
        for (const line of RUNES[i]) { c.beginPath(); line.forEach((p, j) => (j ? c.lineTo(p[0] * 8, p[1] * 10) : c.moveTo(p[0] * 8, p[1] * 10))); c.stroke(); }
      };
      draw(2.6, '#1e0a40'); draw(1.3, '#d9c4ff'); draw(0.5, '#ffffff');
    }));
  }
  function discSprite(col, k) {
    return cached(1, 'disc' + col, () => U.sprite(128, 128, (c) => {
      const g = c.createRadialGradient(64, 64, 8, 64, 64, 64);
      g.addColorStop(0, col + '00'); g.addColorStop(0.55, col + '22'); g.addColorStop(0.86, col + '66'); g.addColorStop(1, col + '00');
      c.fillStyle = g; c.fillRect(0, 0, 128, 128);
    }));
  }

  /* --- boulder --- */
  const BSZ = 40;
  const BOULDER_COL = [null,
    { hi: '#f0a050', mid: '#d9772a', lo: '#7d3f16', rib: '#6b3412', crack: null, face: '#ffb347', halo: null },
    { hi: '#f0a050', mid: '#d06f26', lo: '#74391a', rib: '#5f2e12', crack: '#ffcf5a', face: '#ffd25a', halo: '#ff9a2a' },
    { hi: '#e2a05a', mid: '#c8742e', lo: '#6f3a18', rib: '#5a2c12', crack: '#9be86a', face: '#7dff6a', halo: '#7dff6a' },
    { hi: '#e08850', mid: '#bd5a28', lo: '#5d2a20', rib: '#4a1e22', crack: '#b48cff', face: '#c9a8ff', halo: '#b48cff' },
    { hi: '#fff0a0', mid: '#ffd24a', lo: '#b87c10', rib: '#a36a0c', crack: '#fffbe0', face: '#fffbe0', halo: '#ffd24a' },
  ];
  function lcg(seed) { let s = seed; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  function boulderSprite(lv, k) {
    return cached(k, 'boulder' + lv, () => {
      const col = BOULDER_COL[lv], R = 16;
      return U.sprite(BSZ * k, BSZ * k, (c) => {
        c.scale(k, k); c.translate(BSZ / 2, BSZ / 2); c.lineJoin = 'round'; c.lineCap = 'round';
        const rnd = lcg(lv * 77 + 5);
        c.beginPath(); c.arc(0, 0, R, 0, TAU); c.lineWidth = 2.2; c.strokeStyle = '#2a1000'; c.stroke();
        const g = c.createRadialGradient(-R * 0.35, -R * 0.4, 1, 0, 0, R * 1.05);
        g.addColorStop(0, col.hi); g.addColorStop(0.5, col.mid); g.addColorStop(1, col.lo);
        c.fillStyle = g; c.fill();
        c.save(); c.beginPath(); c.arc(0, 0, R - 0.3, 0, TAU); c.clip();
        // pumpkin ribs
        c.strokeStyle = col.rib; c.globalAlpha = 0.75; c.lineWidth = 1.4;
        for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 3.4, -R); c.quadraticCurveTo(i * 10.5, 0, i * 3.4, R); c.stroke(); }
        // stone pits (lv1-3)
        if (lv <= 3) {
          c.fillStyle = '#2a1000'; c.globalAlpha = 0.22;
          for (let i = 0; i < 12; i++) { c.beginPath(); c.arc((rnd() - 0.5) * 28, (rnd() - 0.5) * 28, 0.8 + rnd() * 1.6, 0, TAU); c.fill(); }
        }
        // cracks
        if (col.crack) {
          const cracks = lv === 3 ? 2 : 4;
          for (let n = 0; n < cracks; n++) {
            let x = (rnd() - 0.5) * 24, y = (rnd() - 0.5) * 24, a = rnd() * TAU;
            const pts = [[x, y]];
            for (let s = 0; s < 4; s++) { a += (rnd() - 0.5) * 1.6; x += Math.cos(a) * 4.2; y += Math.sin(a) * 4.2; pts.push([x, y]); }
            const stroke = (w, colr, al) => { c.lineWidth = w; c.strokeStyle = colr; c.globalAlpha = al; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke(); };
            if (lv === 5) { stroke(2.2, '#b87c10', 0.7); stroke(0.9, col.crack, 0.95); } else { stroke(3.4, col.crack, 0.35); stroke(1.8, col.crack, 0.85); stroke(0.7, '#fff', 0.9); }
          }
        }
        // vines
        if (lv === 3) {
          c.globalAlpha = 1;
          const vine = (w, colr) => {
            c.lineWidth = w; c.strokeStyle = colr; c.beginPath();
            for (let t = 0; t <= 1.001; t += 0.05) { const y = -R + t * 2 * R, x = Math.sin(t * 9) * 8; if (!t) c.moveTo(x, y); else c.lineTo(x, y); }
            c.stroke();
          };
          vine(3.4, '#1c3a10'); vine(2, '#5fbf3c');
          c.fillStyle = '#8be05a'; c.strokeStyle = '#1c3a10'; c.lineWidth = 0.8;
          for (let i = 0; i < 6; i++) { const t = (i + 0.5) / 6, y = -R + t * 2 * R, x = Math.sin(t * 9) * 8; c.beginPath(); c.ellipse(x + (i % 2 ? 2.6 : -2.6), y, 2.8, 1.5, i % 2 ? 0.7 : -0.7, 0, TAU); c.fill(); c.stroke(); }
        }
        if (lv === 5) { // gleam bands
          c.globalAlpha = 0.5; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(-5, -7, 6, 3, -0.6, 0, TAU); c.fill();
          c.globalAlpha = 0.25; c.fillStyle = '#7a4a00'; c.beginPath(); c.ellipse(5, 9, 9, 3.5, -0.3, 0, TAU); c.fill();
        }
        c.restore();
        // stem
        c.globalAlpha = 1; c.fillStyle = lv === 5 ? '#c98a14' : '#5a8a2a'; c.strokeStyle = '#2a1000'; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(-2.4, -R + 1); c.lineTo(-1.4, -R - 3.6); c.lineTo(2, -R - 3.2); c.lineTo(2.6, -R + 1); c.closePath(); c.fill(); c.stroke();
      });
    });
  }
  function faceSprite(lv, k) {
    return cached(k, 'face' + lv, () => U.sprite(24 * k, 18 * k, (c) => {
      c.scale(k, k); c.translate(12, 9); c.lineJoin = 'round';
      const col = BOULDER_COL[lv].face;
      const shapes = () => {
        c.beginPath(); c.moveTo(-8, -2); c.lineTo(-3, -2); c.lineTo(-5.5, -7); c.closePath();
        c.moveTo(8, -2); c.lineTo(3, -2); c.lineTo(5.5, -7); c.closePath();
        c.moveTo(-8, 2.6); c.lineTo(-5.4, 6); c.lineTo(-3, 3.4); c.lineTo(0, 6.4); c.lineTo(3, 3.4); c.lineTo(5.4, 6); c.lineTo(8, 2.6); c.lineTo(5, 1.6); c.lineTo(0, 3); c.lineTo(-5, 1.6); c.closePath();
      };
      shapes(); c.lineWidth = 2.6; c.strokeStyle = '#1a0800'; c.stroke(); c.fillStyle = '#1a0800'; c.fill();
      shapes(); c.fillStyle = col; c.fill();
      c.globalAlpha = 0.9; c.fillStyle = '#fff'; c.beginPath(); c.arc(-4.5, -3.2, 0.9, 0, TAU); c.arc(4.5, -3.2, 0.9, 0, TAU); c.fill();
    }));
  }

  /* ---------------- text / cards ---------------- */
  function diffText(id, a, b) {
    const p = [];
    if (id === 'pistol') {
      if (!a) return 'Auto-aims at the nearest enemy and fires pumpkin seeds (' + f1(b.rate) + '/s)';
      if (b.n !== a.n) p.push(b.n + ' seeds per volley');
      if (b.dmg > a.dmg) p.push('+' + pct(b.dmg, a.dmg) + '% damage');
      if (b.rate > a.rate) p.push('+' + pct(b.rate, a.rate) + '% fire rate');
      if (b.pierce !== a.pierce) p.push('pierces ' + b.pierce + (b.pierce > 1 ? ' enemies' : ' enemy'));
      if (b.bounce !== a.bounce) p.push('bounces ' + b.bounce + (b.bounce > 1 ? ' times' : ' time'));
    } else if (id === 'rocket') {
      if (!a) return 'Homing rocket every ' + f1(b.cd) + ' s, explodes in an area';
      if (b.n !== a.n) p.push(b.n + ' rockets per volley');
      if (b.dmg !== a.dmg && b.n === a.n) p.push((b.dmg > a.dmg ? '+' : '') + pct(b.dmg, a.dmg) + '% damage');
      if (b.R > a.R) p.push('+' + pct(b.R, a.R) + '% blast radius');
      if (b.cd < a.cd) p.push(pct(a.cd, b.cd) + '% faster reload');
      if (b.cluster !== a.cluster) p.push(b.cluster + ' cluster mini-blasts');
    } else if (id === 'aura') {
      if (!a) return 'Ring of flames around Jack, burns everything inside ' + f1(1 / b.tick) + 'x/s';
      if (b.R > a.R) p.push('+' + pct(b.R, a.R) + '% radius');
      if (b.dmg > a.dmg) p.push('+' + pct(b.dmg, a.dmg) + '% damage');
      if (b.tick < a.tick) p.push('+' + pct(a.tick, b.tick) + '% tick rate');
      if (b.pulse && !a.pulse) p.push('second ring + knockback pulse every ' + f1(b.pulse) + ' s');
    } else {
      if (!a) return 'A pumpkin boulder bounces around the screen, crushing enemies';
      if (b.n !== a.n) p.push(b.n + ' boulders');
      if (b.r > a.r) p.push('bigger');
      if (b.spd > a.spd) p.push('+' + pct(b.spd, a.spd) + '% speed');
      if (b.dmg > a.dmg) p.push('+' + pct(b.dmg, a.dmg) + '% damage');
      if (b.kb > a.kb) p.push('harder knockback');
      if (b.trail && !a.trail) p.push('leaves a fiery trail');
    }
    return p.join(', ');
  }
  function cardText(id, m) {
    const g = Weapons._game, T = TABLE[id];
    const lv = lvOf(g, id);
    if (lv >= 5) return 'Max level reached';
    const bonus = m >= 3 && lv + 1 < 5;
    const to = Math.min(5, lv + (bonus ? 2 : 1));
    let s = (bonus ? 'Levels ' + (lv + 1) + '+' + to + ': ' : 'Level ' + to + ': ') + diffText(id, lv ? T[lv] : null, T[to]);
    if (bonus) s += ' · Legendary: +1 bonus level';
    if (g && m > powOf(g, id) + 0.01) s += ' · damage x' + f1(m);
    return s;
  }
  const items = IDS.map((id) => ({
    id: 'w_' + id, weapon: true, wid: id, icon: ICONS[id], name: NAMES[id], max: 5,
    text: (m) => cardText(id, m || 1),
    apply(g, m) {
      let lv = g.weapons[id] || 0;
      const add = m >= 3 && lv + 1 < 5 ? 2 : 1;
      lv = Math.min(5, lv + add);
      g.weapons[id] = lv;
      g.weaponPower[id] = Math.max(g.weaponPower[id] || 1, m);
      // the card pool counts takes; once maxed (e.g. via a Legendary bonus level) stop offering it
      if (lv >= 5) g.owned['w_' + id] = Math.max(g.owned['w_' + id] || 0, 4);
      Weapons._game = g;
    },
  }));

  /* ---------------- simulation ---------------- */
  let qx = 0, qy = 0, qE = null, qBd = 0, qP = null, qEx = null, qB = null, qA = null;
  const nearestQ = (e) => {
    if (e.spawnT < 0.5 || (qEx && qEx.indexOf(e.id) >= 0)) return;
    const d = (e.x - qx) * (e.x - qx) + (bodyY(e) - qy) * (bodyY(e) - qy);
    if (d < qBd) { qBd = d; qE = e; }
  };
  const seedQ = (e) => {
    if (e.spawnT < 0.5 || qP.hit.indexOf(e.id) >= 0) return;
    const dx = e.x - qP.x, dy = bodyY(e) - qP.y, rr = e.r + qP.r;
    if (dx * dx + dy * dy < rr * rr) { qE = e; return false; }
  };
  const rocketQ = (e) => {
    if (e.spawnT < 0.5) return;
    const dx = e.x - qP.x, dy = bodyY(e) - qP.y, rr = e.r + 5;
    if (dx * dx + dy * dy < rr * rr) { qE = e; return false; }
  };

  function firePistol(game, W, L, lv) {
    const p = game.player, S = game.stats;
    let t = null;
    const b = game.boss;
    if (b && !b.dying && (b.x - p.x) ** 2 + (b.y - p.y) ** 2 < S.range * S.range) t = b;
    else t = game.nearestEnemy(p.x, p.y, S.range);
    if (!t) return false;
    const ox = p.x, oy = p.y - 8;
    const a = Math.atan2(bodyY(t) - oy, t.x - ox);
    const dmg = S.dmg * L.dmg * powOf(game, 'pistol');
    const sp = S.projSpeed * L.spd, life = (S.range + 24) / sp + 0.05 * L.bounce;
    let first = null;
    for (let i = 0; i < L.n; i++) {
      const ang = a + (i - (L.n - 1) / 2) * 0.17;
      const pr = {
        kind: 'proj', weapon: 'pistol', lv, x: ox + Math.cos(a) * 7, y: oy + Math.sin(a) * 7, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        r: L.r, angle: ang, dmg, life, age: 0, seed: Math.random(), spin: 0, pierce: L.pierce, bounce: L.bounce, hit: [], sp,
      };
      game.projectiles.push(pr);
      if (!first) first = pr;
    }
    p.aim = a; p.shootT = 1;
    game.emit('Shoot', first);
    return true;
  }
  function updateSeed(game, W, pr, dt) {
    pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= dt; pr.age += dt; pr.spin += dt * 14;
    qP = pr; qE = null;
    game.query(pr.x, pr.y, pr.r + 36, seedQ);
    if (qE) {
      const e = qE, nx = pr.vx / pr.sp, ny = pr.vy / pr.sp;
      pr.hit.push(e.id);
      game.damageEnemy(e, pr.dmg, nx, ny, 'seed');
      if (pr.lv >= 2) sparkBurst(W, pr.x, pr.y, 2, [SEED_COL[pr.lv].glow, '#ffffff'], 45, 1.4);
      if (pr.bounce > 0) {
        qx = e.x; qy = bodyY(e); qE = null; qBd = 130 * 130; qEx = pr.hit;
        game.query(e.x, e.y, 130, nearestQ);
        qEx = null;
        if (qE) {
          const a = Math.atan2(bodyY(qE) - pr.y, qE.x - pr.x);
          pr.vx = Math.cos(a) * pr.sp; pr.vy = Math.sin(a) * pr.sp; pr.angle = a; pr.bounce--;
          pr.life = Math.max(pr.life, 0.45);
        } else if (pr.pierce > 0) pr.pierce--; else pr.life = 0;
      } else if (pr.pierce > 0) pr.pierce--;
      else pr.life = 0;
    }
    if (pr.lv >= 4 && Math.random() < dt * (pr.lv === 5 ? 14 : 9)) {
      addSpark(W, pr.x - pr.vx * 0.02, pr.y, -pr.vx * 0.05 + (Math.random() - 0.5) * 30, -pr.vy * 0.05 + (Math.random() - 0.5) * 30, 0.35, 1.3, pr.lv === 5 ? '#fff1a0' : '#e0ccff', 3, 0);
    }
  }

  function launchRocket(game, W, L, lv, idx, n) {
    const p = game.player, S = game.stats;
    const range = S.range * 1.1;
    let t = null;
    const b = game.boss;
    if (idx === 0 && b && !b.dying && (b.x - p.x) ** 2 + (b.y - p.y) ** 2 < range * range) t = b;
    if (!t) t = game.nearestEnemy(p.x, p.y, range, W.ex);
    if (!t && W.ex.size) { W.ex.clear(); t = game.nearestEnemy(p.x, p.y, range); }
    if (!t) return false;
    W.ex.add(t.id);
    const ox = p.x, oy = p.y - 8;
    const a = Math.atan2(bodyY(t) - oy, t.x - ox) + (idx - (n - 1) / 2) * 0.55 + (Math.random() - 0.5) * 0.25;
    const pr = {
      kind: 'proj', weapon: 'rocket', lv, x: ox, y: oy, vx: Math.cos(a) * 80, vy: Math.sin(a) * 80, r: 4, angle: a, dmg: S.dmg * L.dmg * powOf(game, 'rocket'),
      life: 2.4, age: 0, seed: Math.random(), spin: 0, target: t, speed: 80, vmax: 215 * (S.projSpeed / 250), R: L.R * (S.range / 230) ** 0.5, cluster: L.cluster,
      hx: new Float32Array(14), hn: 0, ht: 0,
    };
    for (let i = 0; i < 14; i += 2) { pr.hx[i] = ox; pr.hx[i + 1] = oy; }
    game.projectiles.push(pr);
    return true;
  }
  function blast(W, x, y, R, dmg, lv, mini, delay) {
    W.blasts.push({ x, y, R, dmg, lv, mini, delay, t: 0, life: mini ? 0.3 : 0.45, done: false });
  }
  function explodeRocket(game, W, pr) {
    pr.life = 0;
    blast(W, pr.x, pr.y, pr.R, pr.dmg, pr.lv, false, 0);
    for (let i = 0; i < pr.cluster; i++) {
      const a = Math.random() * TAU, d = pr.R * (0.6 + Math.random() * 0.45);
      blast(W, pr.x + Math.cos(a) * d, pr.y + Math.sin(a) * d * SQ, pr.R * 0.55, pr.dmg * 0.35, pr.lv, true, 0.1 + i * 0.08);
    }
    game.signal('Explode', pr);
  }
  let bX = 0, bY = 0, bR = 0, bDmg = 0, bKb = 0, bFall = 0;
  const blastQ = (e) => {
    if (e.spawnT < 0.3) return;
    const dx = e.x - bX, dy = (bodyY(e) - bY) / SQ, d = Math.sqrt(dx * dx + dy * dy);
    if (d > bR + e.r * 0.8) return;
    const k = Math.min(1, d / bR);
    const l = d || 1;
    qB.game.damageEnemy(e, bDmg * (1 - bFall * k), (dx / l) * bKb, ((bodyY(e) - bY) / l) * bKb, 'blast');
  };
  function updateRocket(game, W, pr, dt) {
    pr.age += dt; pr.life -= dt; pr.spin += dt * 9;
    let t = pr.target;
    if (!t || t.dying || t.hp <= 0) {
      qx = pr.x; qy = pr.y; qE = null; qBd = 170 * 170; qEx = null;
      game.query(pr.x, pr.y, 170, nearestQ);
      t = pr.target = qE;
    }
    if (t) {
      const want = Math.atan2(bodyY(t) - pr.y, t.x - pr.x);
      let d = want - pr.angle;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      const turn = (4.2 + pr.lv * 0.5) * dt * (pr.age < 0.12 ? 0.3 : 1);
      pr.angle += Math.max(-turn, Math.min(turn, d));
    }
    pr.speed = Math.min(pr.vmax, pr.speed + 520 * dt);
    pr.vx = Math.cos(pr.angle) * pr.speed; pr.vy = Math.sin(pr.angle) * pr.speed;
    pr.x += pr.vx * dt; pr.y += pr.vy * dt;
    pr.ht -= dt;
    if (pr.ht <= 0) {
      pr.ht = 0.02;
      const h = pr.hx;
      for (let i = 13; i >= 2; i--) h[i] = h[i - 2];
      h[0] = pr.x; h[1] = pr.y;
    }
    if (pr.lv >= 3 && Math.random() < dt * 12) addSpark(W, pr.x, pr.y, (Math.random() - 0.5) * 30 - pr.vx * 0.06, (Math.random() - 0.5) * 30 - pr.vy * 0.06, 0.4, 1.4, ROCKET_COL[pr.lv].flame[1], 3, 0);
    qP = pr; qE = null;
    game.query(pr.x, pr.y, 40, rocketQ);
    if (qE || pr.life <= 0) explodeRocket(game, W, pr);
  }

  function boulderSetup(game, W, lv) {
    const p = game.player, B = BOULDER[lv];
    while (W.boulders.length > (lv ? B.n : 0)) W.boulders.pop();
    while (lv && W.boulders.length < B.n) {
      const a = Math.random() * TAU, i = W.boulders.length;
      W.boulders.push({
        x: p.x + Math.cos(a) * 90 * (i ? 1 : 0.6), y: p.y + Math.sin(a) * 60, vx: Math.cos(a + 1.4 + i * 2.1) * B.spd, vy: Math.sin(a + 1.4 + i * 2.1) * B.spd,
        r: B.r, rot: Math.random() * 6, ph: Math.random() * 6, face: 1, hist: new Float32Array(16), hn: 0, ht: 0, st: 0,
      });
    }
  }
  const boulderQ = (e) => {
    if (e.spawnT < 0.5 || e._bT > qB.time) return;
    const b = qB.b, dx = e.x - b.x, dy = e.y - b.y, rr = b.r + e.r * 0.8;
    const d2 = dx * dx + dy * dy;
    if (d2 >= rr * rr) return;
    const d = Math.sqrt(d2) || 1, sp = Math.hypot(b.vx, b.vy) || 1;
    const kx = (dx / d) * 0.7 + (b.vx / sp) * 0.6, ky = (dy / d) * 0.7 + (b.vy / sp) * 0.6;
    e._bT = qB.time + qB.cd;
    qB.game.damageEnemy(e, qB.dmg, kx * qB.kb, ky * qB.kb, 'boulder');
    qB.hits++;
    if (qB.hits <= 2) sparkBurst(qB.W, (e.x + b.x) / 2, bodyY(e), 4, ['#ffd27a', '#ffffff', BOULDER_COL[qB.lv].face], 70, 1.7);
  };
  function updateBoulders(game, W, dt, lv) {
    const p = game.player, S = game.stats, B = BOULDER[lv];
    boulderSetup(game, W, lv);
    if (!lv) return;
    const vw = (game.viewW || 640) / 2, vh = (game.viewH || 360) / 2;
    const cx = p.x, cy = p.y - 6;
    const spd = B.spd * (S.projSpeed / 250);
    const sizeMul = 0.65 + 0.35 * (S.range / 230);
    const sh = settings().shakeAmount;
    qB = { game, W, lv, time: game.time, cd: 0.38 / S.atkSpeed, dmg: S.dmg * B.dmg * powOf(game, 'boulder'), kb: B.kb, hits: 0, b: null };
    for (const b of W.boulders) {
      b.r = B.r * sizeMul;
      const m = b.r + 3;
      const x0 = cx - vw + m, x1 = cx + vw - m, y0 = cy - vh + b.r * 2.1 + 4, y1 = cy + vh - 4;
      let sp = Math.hypot(b.vx, b.vy) || 1;
      const k = 1 + (spd / sp - 1) * Math.min(1, dt * 3);
      b.vx *= k; b.vy *= k; sp *= k;
      b.x += b.vx * dt; b.y += b.vy * dt;
      let wall = false;
      if (b.x < x0) { b.x = x0; b.vx = Math.abs(b.vx); wall = true; } else if (b.x > x1) { b.x = x1; b.vx = -Math.abs(b.vx); wall = true; }
      if (b.y < y0) { b.y = y0; b.vy = Math.abs(b.vy); wall = true; } else if (b.y > y1) { b.y = y1; b.vy = -Math.abs(b.vy); wall = true; }
      if (wall) {
        const j = (Math.random() - 0.5) * 0.35, c = Math.cos(j), s = Math.sin(j);
        const vx = b.vx * c - b.vy * s, vy = b.vx * s + b.vy * c;
        b.vx = vx; b.vy = vy;
        if (Math.abs(b.vy) < sp * 0.28) b.vy = (b.vy < 0 ? -1 : 1) * sp * 0.34;
        if (Math.abs(b.vx) < sp * 0.28) b.vx = (b.vx < 0 ? -1 : 1) * sp * 0.34;
        sparkBurst(W, b.x, b.y - b.r, 3, ['#ffd27a', '#ffffff'], 55, 1.5);
        if (lv >= 3 && (sh === undefined || sh > 0)) game.shake = Math.max(game.shake, 1.2);
      }
      b.rot += (b.vx + b.vy * 0.4) * dt / b.r; b.ph += dt * sp / (b.r * 2.2) * Math.PI;
      if (Math.abs(b.vx) > 8) b.face = b.vx > 0 ? 1 : -1;
      b.ht -= dt;
      if (B.trail && b.ht <= 0) { b.ht = 0.06; for (let i = 15; i >= 2; i--) b.hist[i] = b.hist[i - 2]; b.hist[0] = b.x; b.hist[1] = b.y; if (b.hn < 8) b.hn++; }
      qB.b = b;
      game.query(b.x, b.y, b.r + 36, boulderQ);
      swat(game, b.x, b.y, b.r + 2);
      if (lv === 5 && Math.random() < dt * 8) addSpark(W, b.x + (Math.random() - 0.5) * b.r, b.y - b.r * (0.5 + Math.random()), 0, 0, 0.5, 1.4, '#fff1a0', 0, -10);
    }
  }

  const auraQ = (e) => {
    if (e.spawnT < 0.5) return;
    const a = qA, dx = e.x - a.x, dy = (e.y - a.y) / SQ, rr = a.R + e.r * 0.7;
    if (dx * dx + dy * dy >= rr * rr) return;
    if (a.pulse) {
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      a.game.damageEnemy(e, a.pdmg, (dx / d) * 3.2, (dy * SQ / d) * 3.2, 'aura');
      return;
    }
    if (e._aT > a.time) return;
    e._aT = a.time + a.tick;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    a.game.damageEnemy(e, a.dmg, (dx / d) * 0.14, (dy / d) * 0.14, 'aura');
  };
  function updateAura(game, W, dt, lv) {
    if (!lv) { W.pulse = null; return; }
    const p = game.player, S = game.stats, A = AURA[lv];
    const R = A.R * (S.range / 230) ** 0.6;
    W.auraR = R;
    W.auraA += dt * (0.9 + lv * 0.15);
    const a = qA || (qA = {});
    a.game = game; a.x = p.x; a.y = p.y; a.R = R; a.time = game.time; a.tick = A.tick / S.atkSpeed;
    a.dmg = S.dmg * A.dmg * powOf(game, 'aura'); a.pulse = false; a.pdmg = a.dmg * 7;
    game.query(p.x, p.y, R + 30, auraQ);
    swat(game, p.x, p.y, R);
    if (A.pulse) {
      W.pulseT -= dt * S.atkSpeed;
      if (W.pulseT <= 0) {
        W.pulseT = A.pulse;
        a.pulse = true; a.R = R * 1.2;
        game.query(p.x, p.y, R * 1.2 + 30, auraQ);
        a.pulse = false;
        W.pulse = { t: 0, R };
        swat(game, p.x, p.y, R * 1.25);
        sparkBurst(W, p.x, p.y - 4, 10, ['#ffe08a', '#ffffff'], 90, 1.8);
      }
    }
    if (W.pulse) { W.pulse.t += dt; if (W.pulse.t > 0.55) W.pulse = null; }
  }

  function updateBlasts(game, W, dt) {
    const bl = W.blasts;
    let n = 0;
    qB = { game };
    for (let i = 0; i < bl.length; i++) {
      const b = bl[i];
      if (b.delay > 0) { b.delay -= dt; if (b.delay > 0) { bl[n++] = b; continue; } }
      if (!b.done) {
        b.done = true;
        bX = b.x; bY = b.y; bR = b.R; bDmg = b.dmg; bKb = b.mini ? 0.6 : 1.1; bFall = 0.4;
        game.query(b.x, b.y, b.R + 36, blastQ);
        if (!b.mini) game.shake = Math.max(game.shake, 1.5 + b.lv * 0.4);
        sparkBurst(W, b.x, b.y, b.mini ? 3 : 8, ['#ffd27a', ROCKET_COL[b.lv].ring, '#ffffff'], 95, 1.9);
      }
      if (b.t < 0.2) swat(game, b.x, b.y, b.R);
      b.t += dt;
      if (b.t < b.life) bl[n++] = b;
    }
    bl.length = n;
  }

  /* ---------------- public: update ---------------- */
  function update(game, dt) {
    Weapons._game = game;
    const W = state(game), S = game.stats, p = game.player;
    const lvP = lvOf(game, 'pistol'), lvR = lvOf(game, 'rocket'), lvA = lvOf(game, 'aura'), lvB = lvOf(game, 'boulder');
    W.flick += dt;

    if (lvP) {
      W.pistolT -= dt;
      if (W.pistolT <= 0) {
        const L = PISTOL[lvP];
        if (firePistol(game, W, L, lvP)) W.pistolT = Math.max(W.pistolT + 1 / (L.rate * S.atkSpeed), -0.02) ; else W.pistolT = 0.04;
        if (W.pistolT < 0) W.pistolT = 0;
      }
    }
    if (lvR) {
      const L = ROCKET[lvR];
      if (W.pend > 0) {
        W.pendT -= dt;
        if (W.pendT <= 0) {
          if (launchRocket(game, W, ROCKET[W.pendLv], W.pendLv, W.pendN - W.pend, W.pendN)) { W.pend--; W.pendT = 0.09; } else W.pend = 0;
        }
      } else {
        W.rocketT -= dt;
        if (W.rocketT <= 0) {
          const t = game.nearestEnemy(p.x, p.y, S.range * 1.1);
          if (t) {
            W.ex.clear(); W.pend = L.n; W.pendN = L.n; W.pendLv = lvR; W.pendT = 0;
            W.rocketT = L.cd / S.atkSpeed;
            game.signal('Rocket');
            if (p.shootT < 0.5) p.shootT = 0.6;
          } else W.rocketT = 0.1;
        }
      }
    } else W.pend = 0;

    updateAura(game, W, dt, lvA);
    updateBoulders(game, W, dt, lvB);

    // projectiles
    const pj = game.projectiles;
    let n = 0;
    for (let i = 0; i < pj.length; i++) {
      const pr = pj[i];
      if (pr.weapon === 'pistol') updateSeed(game, W, pr, dt);
      else if (pr.weapon === 'rocket') updateRocket(game, W, pr, dt);
      if (pr.life > 0) pj[n++] = pr;
    }
    pj.length = n;
    updateBlasts(game, W, dt);

    // sparks
    const sp = W.sparks;
    n = 0;
    for (let i = 0; i < sp.length; i++) {
      const s = sp[i];
      s.life -= dt;
      if (s.life <= 0) continue;
      s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 1 - dt * 2.5; s.vy *= 1 - dt * 2.5;
      s.vz -= s.grav * dt; s.z += s.vz * dt;
      if (s.z < 0) { s.z = 0; s.vz *= -0.3; }
      sp[n++] = s;
    }
    sp.length = n;
  }

  /* ---------------- drawing ---------------- */
  const kOf = (view) => (view.pixel ? 2 : 4);
  function img(ctx, im, k, x, y, ax, ay, sc) {
    const w = (im.width / k) * (sc || 1), h = (im.height / k) * (sc || 1);
    ctx.drawImage(im, x - w * ax, y - h * ay, w, h);
  }
  function glowAt(ctx, col, x, y, r, a) {
    ctx.globalAlpha = a;
    ctx.drawImage(glowSprite(col), x - r, y - r, r * 2, r * 2);
  }

  const AURA_LOOK = [null,
    { fl: 'orange', n: 8, ring: '#ff8a1f', disc: '#ff8a1f', dash: true },
    { fl: 'amber', n: 10, ring: '#ffc04d', disc: '#ffb21f', vine: true },
    { fl: 'green', n: 12, ring: '#7dff6a', disc: '#4fd04a', dash: true, wisps: true },
    { fl: 'violet', n: 7, ring: '#b48cff', disc: '#8a52e0', runes: 8 },
    { fl: 'gold', n: 14, ring: '#ffe08a', disc: '#ffd24a', rays: 16, inner: true },
  ];
  function auraFlames(ctx, k, p, R, look, rt, rot, front, n, scale, lv) {
    const im = flameUpSprite(FLAME_COLS[look.fl], k, look.fl);
    ctx.globalAlpha = 1;
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * TAU, s = Math.sin(a);
      if ((s >= 0) !== front) continue;
      const fk = 0.85 + 0.3 * Math.sin(rt * 9 + i * 1.9), x = p.x + Math.cos(a) * R, y = p.y + s * R * SQ;
      const w = (im.width / k) * scale * (0.9 + 0.1 * fk), h = (im.height / k) * scale * fk * (1 + lv * 0.04);
      ctx.drawImage(im, x - w / 2, y - h + 1.5, w, h);
    }
  }
  function drawAura(ctx, game, view, accent, W, front) {
    const lv = lvOf(game, 'aura');
    if (!lv) return;
    const p = game.player, R = W.auraR || AURA[lv].R, look = AURA_LOOK[lv], rt = view.rt, k = kOf(view);
    const rot = W.auraA;
    if (!front) {
      // glowing disc + accent tint
      ctx.globalAlpha = 0.7 + 0.1 * Math.sin(rt * 3);
      const d = discSprite(look.disc);
      ctx.drawImage(d, p.x - R * 1.04, p.y - R * 1.04 * SQ, R * 2.08, R * 2.08 * SQ);
      if (lv === 5) { ctx.globalAlpha = 0.13; ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.ellipse(p.x, p.y, R, R * SQ, 0, 0, TAU); ctx.fill(); }
      // ring: dark outline + colour
      ctx.lineJoin = 'round';
      if (look.vine) {
        const pts = 72;
        for (let pass = 0; pass < 2; pass++) {
          ctx.beginPath();
          for (let j = 0; j <= pts; j++) {
            const a = (j / pts) * TAU, wob = 1 + 0.04 * Math.sin(a * 11 + rt * 1.3);
            const x = p.x + Math.cos(a) * R * wob, y = p.y + Math.sin(a) * R * SQ * wob;
            if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y);
          }
          ctx.globalAlpha = pass ? 1 : 0.7; ctx.lineWidth = pass ? 1.8 : 3.6; ctx.strokeStyle = pass ? '#6dc24a' : '#1c3a10'; ctx.stroke();
        }
        ctx.fillStyle = '#9be85a'; ctx.strokeStyle = '#1c3a10'; ctx.lineWidth = 0.7; ctx.globalAlpha = 1;
        for (let j = 0; j < 14; j++) {
          const a = (j / 14) * TAU + rot * 0.15, wob = 1 + 0.04 * Math.sin(a * 11 + rt * 1.3);
          ctx.beginPath(); ctx.ellipse(p.x + Math.cos(a) * R * wob, p.y + Math.sin(a) * R * SQ * wob, 3.2, 1.6, a + 1.2, 0, TAU); ctx.fill(); ctx.stroke();
        }
        // thorns
        ctx.fillStyle = '#ffe9a0'; ctx.strokeStyle = '#4a2a08'; ctx.lineWidth = 0.6;
        for (let j = 0; j < 20; j++) {
          const a = (j / 20) * TAU + 0.15 + rot * 0.15, c = Math.cos(a), s = Math.sin(a);
          const x = p.x + c * R, y = p.y + s * R * SQ;
          ctx.beginPath(); ctx.moveTo(x - s * 1.3, y + c * 1.3 * SQ); ctx.lineTo(x + c * 3, y + s * 3 * SQ); ctx.lineTo(x + s * 1.3, y - c * 1.3 * SQ); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
      } else {
        ctx.beginPath(); ctx.ellipse(p.x, p.y, R, R * SQ, 0, 0, TAU);
        if (look.dash) ctx.setLineDash([7, 4]); ctx.lineDashOffset = -rot * 30;
        ctx.globalAlpha = 0.6; ctx.lineWidth = 3.6; ctx.strokeStyle = '#2a1000'; ctx.stroke();
        ctx.globalAlpha = 0.95; ctx.lineWidth = 1.8; ctx.strokeStyle = look.ring; ctx.stroke();
        ctx.setLineDash([]);
      }
      if (look.rays) { // golden sun rays
        ctx.fillStyle = '#ffe08a'; ctx.strokeStyle = '#8a5a00'; ctx.lineWidth = 0.8; ctx.globalAlpha = 0.9;
        ctx.beginPath();
        for (let j = 0; j < look.rays; j++) {
          const a = (j / look.rays) * TAU + rot * 0.5, a1 = a - 0.09, a2 = a + 0.09, len = j % 2 ? 1.1 : 1.2;
          ctx.moveTo(p.x + Math.cos(a1) * R * 1.0, p.y + Math.sin(a1) * R * SQ);
          ctx.lineTo(p.x + Math.cos(a) * R * len, p.y + Math.sin(a) * R * SQ * len);
          ctx.lineTo(p.x + Math.cos(a2) * R * 1.0, p.y + Math.sin(a2) * R * SQ);
        }
        ctx.fill(); ctx.stroke();
      }
      if (look.runes) {
        for (let j = 0; j < look.runes; j++) {
          const a = -rot * 0.6 + (j / look.runes) * TAU, x = p.x + Math.cos(a) * R * 0.86, y = p.y + Math.sin(a) * R * 0.86 * SQ;
          ctx.globalCompositeOperation = 'lighter'; glowAt(ctx, '#8a52e0', x, y - 3, 9, 0.5 + 0.2 * Math.sin(rt * 4 + j));
          ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
          img(ctx, runeSprite(j % RUNES.length, k), k, x, y, 0.5, 0.6);
        }
        ctx.beginPath(); ctx.ellipse(p.x, p.y, R * 0.7, R * 0.7 * SQ, 0, 0, TAU); ctx.globalAlpha = 0.35; ctx.lineWidth = 1; ctx.strokeStyle = '#d9c4ff'; ctx.stroke();
      }
      if (look.wisps) {
        ctx.globalCompositeOperation = 'lighter';
        for (let j = 0; j < 6; j++) {
          const a = rt * 0.8 + j * 1.05, rr = R * (0.35 + 0.5 * ((j * 37) % 10) / 10), ph = (rt * 0.5 + j / 6) % 1;
          glowAt(ctx, '#7dff6a', p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr * SQ - ph * 14, 4.5, 0.6 * Math.sin(ph * Math.PI));
        }
        ctx.globalCompositeOperation = 'source-over';
      }
      if (W.pulse) {
        const q = W.pulse.t / 0.55, rr = W.pulse.R * (0.6 + 0.7 * q);
        ctx.beginPath(); ctx.ellipse(p.x, p.y, rr, rr * SQ, 0, 0, TAU);
        ctx.globalAlpha = (1 - q) * 0.9; ctx.lineWidth = 5 * (1 - q) + 1; ctx.strokeStyle = '#2a1000'; ctx.stroke();
        ctx.lineWidth = 3 * (1 - q) + 0.5; ctx.strokeStyle = '#fff3b0'; ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    // flames (back half under entities, front half over them)
    auraFlames(ctx, k, p, R, look, rt, rot, front, look.n, 1.2 + lv * 0.1, lv);
    if (look.inner) auraFlames(ctx, k, p, R * 0.55, look, rt, -rot * 1.4, front, 8, 1.0, lv);
    ctx.globalAlpha = 1;
  }

  function drawUnder(ctx, game, view, accent) {
    const W = game.wst;
    if (!W) return;
    const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true;
    const ga = ctx.globalAlpha;
    // boulder shadows
    if (W.boulders.length) {
      ctx.fillStyle = '#000';
      for (const b of W.boulders) {
        const hop = Math.abs(Math.sin(b.ph)), s = 1 - hop * 0.18;
        ctx.globalAlpha = 0.34 * s;
        ctx.beginPath(); ctx.ellipse(b.x, b.y + 1, b.r * 1.05 * s, b.r * 0.5 * s, 0, 0, TAU); ctx.fill();
      }
    }
    drawAura(ctx, game, view, accent, W, false);
    ctx.globalAlpha = ga; ctx.imageSmoothingEnabled = sm;
  }

  function drawSeed(ctx, pr, k, rt) {
    const lv = pr.lv, col = SEED_COL[lv], ang = pr.angle;
    ctx.save(); ctx.translate(pr.x, pr.y); ctx.rotate(ang);
    const fl = lv === 3 ? 0.85 + 0.3 * Math.sin(pr.age * 40 + pr.seed * 9) : 1;
    const tl = (lv === 1 ? 0.55 : 0.8 + lv * 0.12) * fl;
    const tim = trailSprite(lv, k);
    ctx.globalAlpha = 1;
    ctx.drawImage(tim, -26 * tl + 1, -3.5 * (0.75 + 0.25 * tl), 26 * tl, 7 * (0.75 + 0.25 * tl));
    if (lv >= 2) { ctx.globalCompositeOperation = 'lighter'; glowAt(ctx, col.glow, 0, 0, 4.5 + lv, 0.55); ctx.globalCompositeOperation = 'source-over'; }
    ctx.globalAlpha = 1;
    img(ctx, seedSprite(lv, k), k, 0, 0, 0.5, 0.5);
    if (lv === 5) {
      const s = 0.55 + 0.45 * Math.abs(Math.sin(pr.age * 18 + pr.seed * 7));
      ctx.rotate(-ang + pr.age * 4);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.95;
      img(ctx, sparkleSprite(k), k, 3, 0, 0.5, 0.5, 0.9 * s);
      img(ctx, sparkleSprite(k), k, -7, 1, 0.5, 0.5, 0.5 * (1.4 - s));
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }
  function drawRocket(ctx, pr, k, rt) {
    const lv = pr.lv, col = ROCKET_COL[lv], h = pr.hx;
    // smoke + ember trail from the position history
    ctx.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < 12; i += 2) {
        const f = 1 - i / 14;
        ctx.beginPath(); ctx.moveTo(h[i], h[i + 1]); ctx.lineTo(h[i + 2], h[i + 3]);
        if (pass === 0) { ctx.globalAlpha = 0.28 * f; ctx.strokeStyle = '#3a2418'; ctx.lineWidth = 2 + 4.5 * f + lv * 0.3; }
        else { ctx.globalAlpha = 0.9 * f; ctx.strokeStyle = col.flame[1]; ctx.lineWidth = 0.8 + 3 * f; }
        ctx.stroke();
      }
    }
    ctx.lineCap = 'butt';
    ctx.save(); ctx.translate(pr.x, pr.y); ctx.rotate(pr.angle);
    const fk = 0.8 + 0.35 * Math.sin(pr.age * 55 + pr.seed * 5) + 0.1 * Math.sin(pr.age * 90);
    const fs = (0.8 + lv * 0.16) * fk;
    ctx.globalAlpha = 1;
    const fim = flameSprite(col.flame, k, 'r' + lv);
    const fw = (fim.width / k) * fs, fh = (fim.height / k) * (0.75 + 0.25 * fk) * (0.85 + lv * 0.07);
    ctx.drawImage(fim, -6.5 - fw + 3, -fh / 2, fw, fh);
    ctx.globalCompositeOperation = 'lighter'; glowAt(ctx, col.flame[0], -8, 0, 8 + lv * 1.3, 0.5);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    img(ctx, rocketSprite(lv, k), k, 1, 0, 0.5 + 0.0385, 0.5);
    ctx.restore();
  }
  function drawBoulder(ctx, b, lv, k, rt) {
    const col = BOULDER_COL[lv], sc = b.r / 16, hop = Math.abs(Math.sin(b.ph)) * 3.2 * sc;
    if (BOULDER[lv].trail && b.hn > 1) {
      const fl = lv === 5 ? 'gold' : 'red', im = flameUpSprite(FLAME_COLS[fl], k, fl);
      for (let i = Math.min(b.hn, 7) - 1; i >= 0; i--) {
        const f = 1 - i / 8, w = (im.width / k) * (1.1 + f * 0.9) * sc * 1.5, h = (im.height / k) * (1.0 + f * 0.9) * sc * 1.5 * (0.85 + 0.3 * Math.sin(rt * 14 + i * 2.3));
        const hx = b.hist[i * 2], hy = b.hist[i * 2 + 1] - b.r * 0.35;
        ctx.globalCompositeOperation = 'lighter'; glowAt(ctx, fl === 'gold' ? '#ffb21f' : '#ff4a1c', hx, hy - h * 0.3, w * 0.8, f * 0.45);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = Math.max(0, f * 0.95);
        ctx.drawImage(im, hx - w / 2, hy - h + 4, w, h);
      }
      ctx.globalAlpha = 1;
    }
    const cy = b.y - b.r * 0.95 - hop;
    if (col.halo) { ctx.globalCompositeOperation = 'lighter'; glowAt(ctx, col.halo, b.x, cy, b.r * (lv >= 4 ? 2.3 : 1.8), lv === 5 ? 0.6 : 0.4 + 0.12 * Math.sin(rt * 5)); ctx.globalCompositeOperation = 'source-over'; }
    ctx.globalAlpha = 1;
    ctx.save(); ctx.translate(b.x, cy); ctx.rotate(b.rot);
    img(ctx, boulderSprite(lv, k), k, 0, 0, 0.5, 0.5, sc);
    ctx.restore();
    const fy = cy + b.r * 0.12;
    img(ctx, faceSprite(lv, k), k, b.x + b.face * b.r * 0.16, fy, 0.5, 0.5, sc * 0.95);
    if (lv >= 2) { ctx.globalCompositeOperation = 'lighter'; glowAt(ctx, col.face, b.x + b.face * b.r * 0.16, fy, b.r * 0.8, 0.35); ctx.globalCompositeOperation = 'source-over'; }
    if (lv === 5) {
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.9;
      const s = 0.6 + 0.4 * Math.sin(rt * 7);
      img(ctx, sparkleSprite(k), k, b.x - b.r * 0.45, cy - b.r * 0.55, 0.5, 0.5, 0.7 * s);
      img(ctx, sparkleSprite(k), k, b.x + b.r * 0.5, cy + b.r * 0.1, 0.5, 0.5, 0.5 * (1.2 - s * 0.5));
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }
  }
  function drawBlast(ctx, b) {
    if (b.delay > 0) return;
    const q = b.t / b.life, e = 1 - (1 - q) * (1 - q), R = b.R * (0.35 + 0.65 * e), col = ROCKET_COL[b.lv];
    const a = 1 - q;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = a * 0.22; ctx.fillStyle = '#3a1000';
    ctx.beginPath(); ctx.ellipse(b.x, b.y + 2, R, R * SQ, 0, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    glowAt(ctx, col.flame[0], b.x, b.y, R * 1.25, a * 0.9);
    glowAt(ctx, col.flame[1], b.x, b.y, R * 0.8 * (1 - q * 0.4), a);
    if (q < 0.4) glowAt(ctx, '#ffffff', b.x, b.y, R * 0.45, (1 - q / 0.4) * 0.9);
    ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath(); ctx.ellipse(b.x, b.y, R, R * SQ, 0, 0, TAU);
    ctx.globalAlpha = a * 0.85; ctx.lineWidth = 4 * a + 1.2; ctx.strokeStyle = '#2a1000'; ctx.stroke();
    ctx.globalAlpha = a; ctx.lineWidth = 2.4 * a + 0.8; ctx.strokeStyle = col.ring; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(b.x, b.y, R * 0.7, R * 0.7 * SQ, 0, 0, TAU); ctx.globalAlpha = a * 0.7; ctx.lineWidth = 1; ctx.strokeStyle = '#fff'; ctx.stroke();
  }

  function drawOver(ctx, game, view, accent) {
    const W = game.wst;
    if (!W) return;
    const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true;
    const ga = ctx.globalAlpha, gc = ctx.globalCompositeOperation;
    const k = kOf(view), rt = view.rt;
    const x0 = view.x0 - 40, x1 = view.x1 + 40, y0 = view.y0 - 40, y1 = view.y1 + 40;
    drawAura(ctx, game, view, accent, W, true);
    const lvB = lvOf(game, 'boulder');
    if (lvB) for (const b of W.boulders) drawBoulder(ctx, b, lvB, k, rt);
    const pj = game.projectiles;
    for (let i = 0; i < pj.length; i++) {
      const pr = pj[i];
      if (pr.x < x0 || pr.x > x1 || pr.y < y0 || pr.y > y1) continue;
      ctx.globalAlpha = 1;
      if (pr.weapon === 'pistol') drawSeed(ctx, pr, k, rt);
      else if (pr.weapon === 'rocket') drawRocket(ctx, pr, k, rt);
    }
    for (let i = 0; i < W.blasts.length; i++) drawBlast(ctx, W.blasts[i]);
    // sparks
    const sp = W.sparks;
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < sp.length; i++) {
      const s = sp[i], a = Math.min(1, s.life / s.max * 1.6), z = s.size;
      ctx.globalAlpha = a * 0.55; ctx.fillStyle = '#2a1000';
      ctx.fillRect(s.x - z * 0.5 - 0.5, s.y - s.z - z * 0.5 - 0.5, z + 1, z + 1);
      ctx.globalAlpha = a; ctx.fillStyle = s.col;
      ctx.fillRect(s.x - z * 0.5, s.y - s.z - z * 0.5, z, z);
    }
    ctx.globalAlpha = ga; ctx.globalCompositeOperation = gc; ctx.imageSmoothingEnabled = sm;
  }

  /* ---------------- build overview ---------------- */
  function describe(game) {
    Weapons._game = game;
    const S = game.stats, out = [];
    for (const id of IDS) {
      const lv = lvOf(game, id);
      if (lv <= 0) continue;
      const L = TABLE[id][lv], pw = powOf(game, id), base = S.dmg * S.dmgMul * pw;
      const lines = [];
      if (id === 'pistol') {
        lines.push('Damage ' + Math.round(base * L.dmg), 'Fire rate ' + f1(L.rate * S.atkSpeed) + '/s', 'Seeds ' + L.n);
        if (L.pierce) lines.push('Pierce ' + L.pierce);
        if (L.bounce) lines.push('Bounces ' + L.bounce);
        lines.push('Range ' + Math.round(S.range));
      } else if (id === 'rocket') {
        lines.push('Blast damage ' + Math.round(base * L.dmg), 'Rockets ' + L.n, 'Reload ' + f1(L.cd / S.atkSpeed) + ' s', 'Blast radius ' + Math.round(L.R * (S.range / 230) ** 0.5));
        if (L.cluster) lines.push('Cluster blasts ' + L.cluster);
      } else if (id === 'aura') {
        lines.push('Damage ' + Math.round(base * L.dmg) + ' per tick', 'Ticks ' + f1(S.atkSpeed / L.tick) + '/s', 'Radius ' + Math.round(L.R * (S.range / 230) ** 0.6));
        if (L.pulse) lines.push('Knockback pulse every ' + f1(L.pulse / S.atkSpeed) + ' s', 'Second ring');
      } else {
        lines.push('Damage ' + Math.round(base * L.dmg), 'Boulders ' + L.n, 'Speed ' + Math.round(L.spd * S.projSpeed / 250), 'Size ' + L.r);
        if (L.trail) lines.push('Fiery trail');
      }
      if (pw > 1.01) lines.push('Power x' + f1(pw));
      out.push({ id, name: NAMES[id], icon: ICONS[id], level: lv, max: 5, lines, look: LOOK[id][lv] });
    }
    return out;
  }

  const Weapons = {
    items,
    NAMES,
    _game: null,
    reset(game) { game.wst = null; state(game); Weapons._game = game; },
    update,
    /** draw weapon visuals under the entities (kill circle) and over them (projectiles, boulders, blasts). World space. */
    drawUnder,
    drawOver,
    /** build overview: [{ id, name, icon, level, max, lines: ['Damage 12', ...], look }] */
    describe,
  };
  window.Weapons = Weapons;
})();
