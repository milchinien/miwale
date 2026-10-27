/* FX - juice layer: core particles (sparks, chunks, rings, stars, coins ...), ambient motes and screen effects.
   Everything is driven by the player's settings (Meta.settings, read live): particles, screenFx, flashes, ambient,
   hitstop, quality.  Pixel-art styles (view.pixel) get crisp, grid-aligned rects; HD styles get smooth shapes.
   Public API (stable): Fx.attach(game), Fx.update(game, dt), Fx.drawParticles(ctx, game, view, accent),
   Fx.drawAmbient(ctx, game, view, accent), Fx.drawScreen(ctx, view, game), Fx.hitstopLeft. */
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const DEF = { particles: 2, screenFx: true, flashes: true, ambient: true, hitstop: true, quality: 'high' };
  const PM = [0, 0.4, 1, 1.8];
  const CAPS = [0, 200, 450, 700];
  const rnd = Math.random;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const rr = (a, b) => a + (b - a) * rnd();
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);
  const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

  /* ---------------------------------------------------------------- settings */
  function cfg() {
    const m = window.Meta && window.Meta.settings;
    return m || DEF;
  }
  function pmul() {
    const c = cfg();
    const i = c.particles === undefined ? 2 : c.particles;
    let m = PM[i] === undefined ? 1 : PM[i];
    if (c.quality === 'low') m *= 0.6; else if (c.quality === 'medium') m *= 0.85;
    return m;
  }
  function capNow() {
    const c = cfg();
    const i = c.particles === undefined ? 2 : c.particles;
    let cap = CAPS[i] === undefined ? 450 : CAPS[i];
    if (c.quality === 'low') cap *= 0.5; else if (c.quality === 'medium') cap *= 0.8;
    return cap | 0;
  }
  const isLow = () => cfg().quality === 'low';
  let reported = false;
  function report(e) {
    if (reported) return;
    reported = true;
    try { console.error(e); window.__reportError && window.__reportError(e); } catch (_) { /* ignore */ }
  }

  /* ---------------------------------------------------------------- colours / sprites (cached) */
  const rgbCache = new Map();
  function rgb(c) {
    let v = rgbCache.get(c);
    if (v) return v;
    v = [255, 255, 255];
    if (typeof c === 'string') {
      if (c[0] === '#') {
        if (c.length === 4) v = [parseInt(c[1] + c[1], 16), parseInt(c[2] + c[2], 16), parseInt(c[3] + c[3], 16)];
        else if (c.length >= 7) v = [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
      } else {
        const m = c.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
        if (m) v = [+m[1], +m[2], +m[3]];
      }
    }
    rgbCache.set(c, v);
    return v;
  }
  const shadeCache = new Map();
  /** k < 1 -> darker, k > 1 -> lighter (mix with white) */
  function shade(c, k) {
    const key = c + '|' + k;
    let v = shadeCache.get(key);
    if (v) return v;
    const [r, g, b] = rgb(c);
    const f = (x) => Math.round(k < 1 ? x * k : x + (255 - x) * (k - 1));
    v = 'rgb(' + clamp(f(r), 0, 255) + ',' + clamp(f(g), 0, 255) + ',' + clamp(f(b), 0, 255) + ')';
    shadeCache.set(key, v);
    return v;
  }
  function mixHex(a, b, t) {
    const A = rgb(a), B = rgb(b);
    return 'rgb(' + Math.round(lerp(A[0], B[0], t)) + ',' + Math.round(lerp(A[1], B[1], t)) + ',' + Math.round(lerp(A[2], B[2], t)) + ')';
  }
  function mkCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0);
    return c;
  }
  const glowHDCache = new Map();
  function glowHD(color) {
    let c = glowHDCache.get(color);
    if (c) return c;
    c = mkCanvas(64, 64);
    const g = c.getContext('2d');
    const [r, gg, b] = rgb(color);
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(' + r + ',' + gg + ',' + b + ',1)');
    gr.addColorStop(0.3, 'rgba(' + r + ',' + gg + ',' + b + ',0.5)');
    gr.addColorStop(0.65, 'rgba(' + r + ',' + gg + ',' + b + ',0.14)');
    gr.addColorStop(1, 'rgba(' + r + ',' + gg + ',' + b + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    glowHDCache.set(color, c);
    return c;
  }
  const glowPixCache = new Map();
  /** stepped (posterised) round glow, n x n art pixels, odd n */
  function glowPix(color, n) {
    const key = color + '|' + n;
    let c = glowPixCache.get(key);
    if (c) return c;
    c = mkCanvas(n, n);
    const g = c.getContext('2d');
    const [r, gg, b] = rgb(color);
    const m = (n - 1) / 2;
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const d = Math.hypot(i - m, j - m) / (m + 0.5);
        const a = d < 0.34 ? 1 : d < 0.62 ? 0.5 : d < 1 ? 0.2 : 0;
        if (a > 0) { g.fillStyle = 'rgba(' + r + ',' + gg + ',' + b + ',' + a + ')'; g.fillRect(i, j, 1, 1); }
      }
    }
    if (glowPixCache.size > 160) glowPixCache.clear();
    glowPixCache.set(key, c);
    return c;
  }
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const vigCache = new Map();
  const VIG = {
    // [inner, outer, power, colour]
    hurt: [0.5, 1.35, 1.5, '#e0201a'],
    low: [0.45, 1.3, 1.2, '#b01010'],
    warn: [0.9, 1.3, 1.0, '#ff6a1a'],
    soft: [0.7, 1.45, 1.0, '#0b0414'],
    dash: [0.55, 1.3, 1.2, '#ffffff'],
    gold: [0.55, 1.3, 1.2, '#ffd86b'],
  };
  function vignette(kind, W, H, pixel) {
    const key = kind + '|' + (pixel ? W + 'x' + H : 'hd');
    let c = vigCache.get(key);
    if (c) return c;
    const [inner, outer, pw, col] = VIG[kind];
    const [r, g, b] = rgb(col);
    const w = pixel ? W : 160, h = pixel ? H : Math.max(2, Math.round(160 * H / W));
    c = mkCanvas(w, h);
    const x = c.getContext('2d');
    const img = x.createImageData(w, h);
    const d = img.data;
    for (let j = 0; j < h; j++) {
      const ny = ((j + 0.5) / h - 0.5) * 2;
      for (let i = 0; i < w; i++) {
        const nx = ((i + 0.5) / w - 0.5) * 2;
        const dist = Math.sqrt(nx * nx + ny * ny);
        let a = Math.pow(smooth(inner, outer, dist), pw);
        if (pixel) a = a > (BAYER[(j & 3) * 4 + (i & 3)] + 0.5) / 16 ? 1 : 0;
        const o = (j * w + i) * 4;
        d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = Math.round(a * 255);
      }
    }
    x.putImageData(img, 0, 0);
    if (vigCache.size > 14) vigCache.clear();
    vigCache.set(key, c);
    return c;
  }

  /* ---------------------------------------------------------------- per-game state */
  function newState() {
    return {
      clock: 0, lastTime: 0, hurt: 0, warn: 0, dash: 0, dashDx: 1, dashDy: 0, ab: 0, flash: null,
      lines: [], trailT: 0, fountains: [], hitTok: 10, killTok: 20, pickTok: 12, rutTok: 6, shootTok: 8,
      core: 0, portalAcc: 0, sigNova: -9, sigExplode: -9, sigSlam: -9, sigRevive: -9, lowT: 0,
      lpHp: -1, tmp: null, tmpCtx: null,
    };
  }
  const stateOf = (g) => g._fx || (g._fx = newState());

  /* ---------------------------------------------------------------- spawning helpers */
  function N(base) {
    const v = base * pmul();
    let n = Math.floor(v);
    if (rnd() < v - n) n++;
    return n;
  }
  function spawn(g, o) {
    const st = g._fx;
    if (!st || st.core >= capNow()) return null;
    o.core = true;
    const p = g.addParticle(o);
    if (p) { p.sid = null; st.core++; }
    return p;
  }
  /** single (unscaled) effect particle, still obeys particles=0 and the cap */
  function one(g, o) {
    if (pmul() <= 0) return null;
    return spawn(g, o);
  }
  /** radial burst of n (scaled) particles */
  function rad(g, x, y, z, n, o) {
    n = N(n);
    if (n <= 0) return;
    const cols = o.colors || ['#fff'];
    const sp = o.spd || [60, 120], vz = o.vz || [20, 80], lf = o.life || [0.3, 0.5], sz = o.size || [1.5, 2.5];
    const sq = o.squash === undefined ? 0.65 : o.squash;
    for (let i = 0; i < n; i++) {
      const a = o.aim !== undefined ? o.aim + (rnd() - 0.5) * (o.spread || 1) : rnd() * TAU;
      const s = rr(sp[0], sp[1]);
      spawn(g, {
        x: x + (o.jit ? (rnd() - 0.5) * o.jit : 0), y: y + (o.jit ? (rnd() - 0.5) * o.jit * 0.6 : 0), z: z + (o.zj ? rnd() * o.zj : 0),
        vx: Math.cos(a) * s, vy: Math.sin(a) * s * sq, vz: rr(vz[0], vz[1]),
        grav: o.grav === undefined ? 220 : o.grav, drag: o.drag === undefined ? 3 : o.drag,
        life: rr(lf[0], lf[1]), size: rr(sz[0], sz[1]), color: cols[(rnd() * cols.length) | 0],
        kind: o.kind || 'spark', rot: rnd() * TAU, vr: (rnd() - 0.5) * (o.vr === undefined ? 14 : o.vr),
      });
    }
  }
  function ring(g, x, y, r0, r1, life, color, lw, z) {
    one(g, { x, y, z: z || 0, life, kind: 'ring', r0, r1, lw: lw || 1.6, color, vx: 0, vy: 0, drag: 0 });
  }
  function glow(g, x, y, z, size, life, color, a) {
    if (isLow()) return;
    one(g, { x, y, z, life, kind: 'glow', size, color, ga: a === undefined ? 0.7 : a, vx: 0, vy: 0, drag: 0 });
  }
  function hitstop(g, s) {
    if (!cfg().hitstop) return;
    g.hitstop = Math.max(g.hitstop || 0, s);
  }
  function shake(g, n) { g.shake = Math.max(g.shake || 0, n); }
  function flash(g, col, peak, dur) {
    const c = cfg();
    if (!c.flashes) return;
    const st = stateOf(g);
    peak = Math.min(0.35, peak); dur = Math.max(0.25, dur);
    if (st.flash && flashAlpha(st.flash) >= peak) return;
    st.flash = { col, peak, dur, t: 0 };
  }
  function flashAlpha(f) { const k = clamp(1 - f.t / f.dur, 0, 1); return f.peak * k * k; }
  const P = (o, g) => (o && isFinite(o.x) && isFinite(o.y) ? o : g.player);

  /* palettes */
  const C_SPARK = ['#fff6d0', '#ffd27a', '#ffffff'];
  const C_GOLD = ['#fff0a8', '#ffd23f', '#ffb347', '#ffffff'];
  const C_FIRE = ['#fff3c4', '#ffd23f', '#ff8a1f', '#ff5a1f'];
  const C_HURT = ['#ff5a3c', '#ffb36b', '#ffd27a'];
  const C_TURNIP = ['#9b6bd1', '#7a4aa8', '#f1e4b8', '#e8d28a'];
  const C_GHOST = ['#e8f1ff', '#bcd4ff', '#ffffff'];
  const C_COLOSSUS = ['#7a4aa8', '#5a3380', '#c9a86a', '#f1e4b8'];
  const C_PUMPKIN = ['#ff8a1f', '#ffb347', '#d96a10', '#ffd27a'];
  const C_CONFETTI = ['#ff8a1f', '#ffd23f', '#7cf0ff', '#9dff7a', '#ff6fb1', '#c9a6ff', '#ffffff'];
  const C_DUST = ['#d9c7a0', '#bfae8a', '#a3946f'];
  const C_HOLY = ['#fff7d6', '#ffe9a8', '#ffffff', '#c9f3ff'];

  /* ---------------------------------------------------------------- event reactions */
  function attach(game) {
    if (game._fxAttached) return;
    game._fxAttached = true;
    stateOf(game);
    const on = (name, fn) => game.on(name, (a, b) => {
      try { fn(a, b); } catch (e) { report(e); }
    });
    const g = game;
    const st = () => g._fx;

    on('Shoot', () => {
      const s = st(), p = g.player;
      if (s.shootTok < 1 || pmul() <= 0) return;
      s.shootTok--;
      const a = p.aim || 0;
      one(g, { x: p.x + Math.cos(a) * 9, y: p.y + Math.sin(a) * 6, z: 11, vx: Math.cos(a) * 80, vy: Math.sin(a) * 50, life: 0.1, size: 2.2, color: '#fff6d0', kind: 'spark', drag: 6 });
    });

    on('Hit', (e) => {
      const s = st();
      if (!e || s.hitTok < 1 || pmul() <= 0) return;
      s.hitTok--;
      const sc = e.scale || 1, p = g.player;
      const away = Math.atan2(e.y - p.y, e.x - p.x);
      rad(g, e.x, e.y, e.r * sc * 0.6, 2.4, { colors: C_SPARK, spd: [70, 140], vz: [10, 50], life: [0.16, 0.3], size: [1.4, 2.3], aim: away, spread: 2.2, grav: 160, drag: 4 });
    });

    on('Crit', (e) => {
      if (!e) return;
      const sc = e.scale || 1, z = e.r * sc * 0.8;
      one(g, { x: e.x, y: e.y, z: z + 3, vz: 18, vx: 0, vy: 0, life: 0.42, size: 7 + Math.min(5, e.r * sc * 0.2), color: '#fff0a8', kind: 'star', rot: 0, vr: 3, drag: 0 });
      rad(g, e.x, e.y, z, 5, { colors: C_GOLD, spd: [80, 170], vz: [20, 70], life: [0.25, 0.4], size: [1.6, 2.6], grav: 200 });
      ring(g, e.x, e.y, 3, 16 + e.r * sc * 0.4, 0.28, '#ffd23f', 1.4, z * 0.4);
      shake(g, 1.1);
      st().ab = Math.max(st().ab, 0.25);
      hitstop(g, 0.022);
    });

    on('Kill', (e) => {
      if (!e) return;
      const s = st();
      const sc = e.scale || 1, R = e.r * sc, z = R * 0.8;
      const big = e.type === 'colossus' || e.elite || e.boss;
      const cheap = s.killTok < 1;
      if (!cheap) s.killTok -= big ? 4 : 1;
      let cols = C_TURNIP, kids = 4;
      if (e.type === 'ghost') { cols = C_GHOST; kids = 0; }
      else if (e.type === 'colossus' || e.boss) { cols = C_COLOSSUS; kids = 11; }
      if (e.elite) kids += 5;
      if (cheap) {
        rad(g, e.x, e.y, z, 2, { colors: cols, spd: [50, 110], life: [0.2, 0.35], size: [1.6, 2.4] });
        return;
      }
      if (kids) rad(g, e.x, e.y, z, kids, { kind: 'chunk', colors: cols, spd: [40 + R * 2, 90 + R * 4], vz: [60, 120 + R * 2], life: [0.6, 1.0], size: [2.4 + R * 0.12, 4 + R * 0.2], grav: 420, drag: 2.5, vr: 20 });
      rad(g, e.x, e.y, z, 5 + (big ? 8 : 0), { colors: e.type === 'ghost' ? C_GHOST : ['#f1e4b8', '#e8d9ff', '#ffffff'], spd: [60, 150 + R], vz: [20, 90], life: [0.25, 0.5], size: [1.5, 2.6], grav: 200 });
      if (e.type !== 'ghost') rad(g, e.x, e.y, R, 1.2, { kind: 'leaf', colors: ['#6fb64a', '#8fd05a', '#4f8f3a'], spd: [20, 50], vz: [30, 70], life: [0.7, 1.1], size: [2.4, 3.2], grav: 60, drag: 2, vr: 8 });
      if (rnd() < 0.45 || big) {
        one(g, { x: e.x, y: e.y, z: z, vx: (rnd() - 0.5) * 10, vy: 0, vz: rr(22, 36), life: rr(0.7, 1.0), size: 2.4 + R * 0.08, color: '#e8d9ff', kind: 'wisp', drag: 1.5, seed: rnd() });
      }
      if (e.type === 'ghost') ring(g, e.x, e.y, 2, 12, 0.25, '#bcd4ff', 1.2, z * 0.5);
      if (big) {
        rad(g, e.x, e.y, 3, 4, { kind: 'smoke', colors: ['#cfc6d6', '#a99bb8'], spd: [10, 40], vz: [10, 30], life: [0.5, 0.9], size: [4, 7], grav: 0, drag: 2 });
        ring(g, e.x, e.y, 4, 22 + R * 1.2, 0.4, '#e8d9ff', 2, 0);
        if (!e.boss) { shake(g, 2.6); hitstop(g, e.elite ? 0.06 : 0.04); st().ab = Math.max(st().ab, 0.3); }
      }
    });

    on('Pickup', (gem) => {
      const s = st(), p = g.player;
      if (!gem || s.pickTok < 1 || pmul() <= 0) return;
      s.pickTok--;
      const big = gem.big;
      rad(g, p.x, p.y, 12, big ? 5 : 2, { colors: big ? ['#7cf0ff', '#ffffff', '#c9f6ff'] : ['#9dff7a', '#e6ffd0', '#ffffff'], spd: [25, 70], vz: [20, 55], life: [0.25, 0.45], size: [1.4, 2.2], grav: 60 });
      if (big || rnd() < 0.3) one(g, { x: p.x + (rnd() - 0.5) * 6, y: p.y, z: 14, vz: 30, vx: 0, vy: 0, life: 0.35, size: big ? 5 : 3.6, color: big ? '#c9f6ff' : '#e6ffd0', kind: 'star', vr: 4, drag: 0 });
    });

    on('Dash', (p) => {
      const s = st();
      p = p || g.player;
      s.dash = 1; s.ab = Math.max(s.ab, 0.8);
      s.dashDx = p.dashX || 1; s.dashDy = p.dashY || 0;
      const l = Math.hypot(s.dashDx, s.dashDy) || 1; s.dashDx /= l; s.dashDy /= l;
      s.lines.length = 0;
      for (let i = 0; i < 14; i++) s.lines.push({ u: (rnd() < 0.5 ? -1 : 1) * rr(0.2, 1), a: rr(-0.5, 0.5), len: rr(0.1, 0.3), w: rr(1, 2.2) });
      const ang = Math.atan2(s.dashDy, s.dashDx) + Math.PI;
      rad(g, p.x, p.y, 1, 5, { kind: 'smoke', colors: ['#d9d2c4', '#bfb6a8'], spd: [25, 70], vz: [4, 16], life: [0.3, 0.5], size: [3, 5.5], grav: 0, drag: 3, aim: ang, spread: 1.0 });
      rad(g, p.x, p.y, 5, 4, { colors: ['#fff6d0', '#ffd27a'], spd: [90, 180], vz: [0, 20], life: [0.15, 0.28], size: [1.4, 2.2], grav: 0, drag: 5, aim: ang, spread: 0.7 });
    });

    on('Hurt', (p) => {
      const s = st();
      p = p || g.player;
      s.hurt = 1; s.ab = Math.max(s.ab, 0.9);
      rad(g, p.x, p.y, 12, 9, { colors: C_HURT, spd: [60, 170], vz: [20, 90], life: [0.25, 0.45], size: [1.8, 3], grav: 240 });
      rad(g, p.x, p.y, 10, 3, { kind: 'ember', colors: ['#ff8a4a', '#ffb36b'], spd: [10, 40], vz: [30, 60], life: [0.4, 0.7], size: [1.6, 2.4], grav: 0, drag: 2 });
      ring(g, p.x, p.y, 4, 26, 0.3, '#ff5a3c', 1.6, 4);
      shake(g, 3);
      hitstop(g, 0.045);
      flash(g, '#ff3a2a', 0.12, 0.3);
    });

    on('LevelUp', (p) => {
      p = p || g.player;
      ring(g, p.x, p.y, 6, 76, 0.65, '#ffd23f', 2.2, 1);
      ring(g, p.x, p.y, 4, 120, 0.9, '#fff0a8', 1.4, 1);
      glow(g, p.x, p.y, 12, 70, 0.55, '#ffd86b', 0.6);
      rad(g, p.x, p.y, 8, 16, { colors: C_GOLD, spd: [70, 150], vz: [60, 150], life: [0.5, 0.9], size: [1.8, 3], grav: 180, drag: 2 });
      for (let i = 0; i < 3; i++) one(g, { x: p.x + (rnd() - 0.5) * 24, y: p.y + (rnd() - 0.5) * 8, z: rr(10, 28), vz: rr(18, 40), vx: 0, vy: 0, life: rr(0.5, 0.8), size: rr(5, 8), color: '#fff0a8', kind: 'star', vr: 3, drag: 0 });
      flash(g, '#ffe9a8', 0.26, 0.5);
      st().hurt = Math.max(0, st().hurt);
    });

    on('Rutas', (n, src) => {
      const s = st();
      if (s.rutTok < 1 || pmul() <= 0) return;
      s.rutTok--;
      const q = P(src, g);
      const k = Math.min(4, 1 + Math.floor((n || 1) / 3));
      for (let i = 0; i < k; i++) {
        one(g, { x: q.x + (rnd() - 0.5) * 8, y: q.y, z: 8, vx: (rnd() - 0.5) * 30, vy: (rnd() - 0.5) * 10, vz: rr(90, 140), grav: 420, life: rr(0.55, 0.8), size: 3.4, color: '#ffd23f', kind: 'coin', rot: rnd() * TAU, vr: 14, drag: 2 });
      }
      rad(g, q.x, q.y, 10, 3, { colors: C_GOLD, spd: [30, 80], vz: [30, 80], life: [0.25, 0.4], size: [1.4, 2.2], grav: 200 });
    });

    const explode = (x, y, r) => {
      const s = st();
      s.sigExplode = s.clock;
      r = clamp(r || 48, 18, 160);
      glow(g, x, y, 10, r * 1.9, 0.32, '#ff9a2f', 0.8);
      ring(g, x, y, r * 0.2, r, 0.34, '#ffb347', 2.6, 2);
      ring(g, x, y, r * 0.1, r * 0.6, 0.26, '#fff3c4', 1.6, 2);
      rad(g, x, y, 6, 14, { colors: C_FIRE, spd: [70, 80 + r * 2.2], vz: [30, 120], life: [0.25, 0.55], size: [1.8, 3.2], grav: 240 });
      rad(g, x, y, 5, 8, { kind: 'ember', colors: ['#ffb347', '#ff8a1f', '#ff5a1f'], spd: [15, 60], vz: [35, 85], life: [0.5, 1.0], size: [1.6, 2.6], grav: 0, drag: 2 });
      rad(g, x, y, 4, 5, { kind: 'smoke', colors: ['#6e6270', '#8a7e8c'], spd: [10, 45], vz: [15, 40], life: [0.6, 1.0], size: [4, 8], grav: 0, drag: 2 });
      shake(g, 2.4 + r * 0.02);
      hitstop(g, 0.03);
    };
    on('Explode', (pr) => {
      const q = P(pr, g);
      explode(q.x, q.y, (pr && (pr.blast || pr.radius || pr.rad || pr.er || pr.aoe)) || 48);
    });
    on('TurnipBlast', (x, y) => { if (isFinite(x) && isFinite(y)) explode(x, y, 52); });

    const nova = (x, y, r) => {
      const s = st();
      s.sigNova = s.clock;
      r = clamp(r || 120, 40, 260);
      const col = '#fff0a8';
      ring(g, x, y, 6, r, 0.5, col, 2.4, 2);
      ring(g, x, y, 4, r * 0.7, 0.4, '#ffd23f', 1.6, 2);
      glow(g, x, y, 8, r * 0.8, 0.35, '#ffe9a8', 0.45);
      rad(g, x, y, 8, 18, { colors: C_GOLD, spd: [r * 0.5, r * 1.1], vz: [10, 60], life: [0.3, 0.55], size: [1.6, 2.6], grav: 120, drag: 2.5 });
      shake(g, 2);
    };
    on('Nova', (f) => { const q = P(f, g); nova(q.x, q.y, f && (f.r1 || f.radius)); });
    on('Rocket', () => {
      const p = g.player, a = p.aim || 0;
      rad(g, p.x + Math.cos(a) * 8, p.y + Math.sin(a) * 5, 10, 3, { kind: 'smoke', colors: ['#cfc6d6', '#e8e0ea'], spd: [10, 35], vz: [8, 20], life: [0.3, 0.5], size: [3, 5], grav: 0, drag: 2.5 });
      rad(g, p.x + Math.cos(a) * 9, p.y + Math.sin(a) * 5, 10, 3, { colors: C_FIRE, spd: [60, 130], vz: [0, 20], life: [0.12, 0.22], size: [1.6, 2.6], grav: 0, drag: 5, aim: a, spread: 0.8 });
    });

    on('Revive', (p) => {
      const s = st();
      s.sigRevive = s.clock;
      p = p || g.player;
      glow(g, p.x, p.y, 14, 120, 0.7, '#fff3c4', 0.8);
      ring(g, p.x, p.y, 6, 150, 0.7, '#fff0a8', 2.4, 1);
      ring(g, p.x, p.y, 4, 100, 0.55, '#c9f3ff', 1.6, 1);
      rad(g, p.x, p.y, 10, 26, { colors: C_HOLY, spd: [60, 170], vz: [50, 150], life: [0.6, 1.1], size: [1.8, 3.2], grav: 120, drag: 2 });
      for (let i = 0; i < 5; i++) one(g, { x: p.x + (rnd() - 0.5) * 40, y: p.y + (rnd() - 0.5) * 14, z: rr(8, 36), vz: rr(15, 40), vx: 0, vy: 0, life: rr(0.6, 1), size: rr(5, 9), color: '#fff7d6', kind: 'star', vr: 2, drag: 0 });
      flash(g, '#fff3c4', 0.3, 0.7);
      shake(g, 4);
      hitstop(g, 0.06);
    });

    /* bosses */
    const crack = (x, y, r) => {
      one(g, { x, y, z: 0, vx: 0, vy: 0, life: 1.0, kind: 'crack', r1: r, color: '#2a1a14', drag: 0, seed: rnd() });
    };
    on('BossSpawn', (e) => {
      const s = st(), q = P(e, g);
      s.warn = 1.6;
      flash(g, '#ff3a2a', 0.22, 0.6);
      ring(g, q.x, q.y, 10, 150, 0.9, '#ff5a3c', 2.4, 0);
      ring(g, q.x, q.y, 6, 90, 0.7, '#ffb347', 1.6, 0);
      crack(q.x, q.y, 70);
      rad(g, q.x, q.y, 2, 14, { kind: 'smoke', colors: C_DUST, spd: [30, 90], vz: [8, 28], life: [0.6, 1.1], size: [4, 8], grav: 0, drag: 2 });
      rad(g, q.x, q.y, 4, 10, { kind: 'ember', colors: ['#ff8a1f', '#ff5a3c', '#ffd27a'], spd: [10, 50], vz: [40, 90], life: [0.7, 1.3], size: [1.8, 2.8], grav: 0, drag: 2 });
      shake(g, 6);
      hitstop(g, 0.05);
    });
    on('BossSlam', (f) => {
      const s = st(), q = P(f && f.boss ? f.boss : f, g);
      s.sigSlam = s.clock;
      const r = clamp((f && (f.r || f.r1)) || 70, 30, 200);
      ring(g, q.x, q.y, 6, r, 0.5, '#d9c7a0', 3, 0);
      ring(g, q.x, q.y, 4, r * 0.65, 0.38, '#fff3c4', 1.6, 0);
      crack(q.x, q.y, r * 0.9);
      rad(g, q.x, q.y, 2, 16, { kind: 'smoke', colors: C_DUST, spd: [r * 0.3, r * 0.9], vz: [6, 30], life: [0.5, 1.0], size: [4, 8], grav: 0, drag: 2.5 });
      rad(g, q.x, q.y, 3, 8, { kind: 'chunk', colors: ['#6b5a46', '#8a7658', '#4e4032'], spd: [r * 0.3, r * 0.9], vz: [70, 150], life: [0.6, 1], size: [2.4, 4.4], grav: 420, drag: 2, vr: 18 });
      shake(g, 8);
      hitstop(g, 0.05);
      s.ab = Math.max(s.ab, 0.5);
    });
    on('BossCharge', (e) => {
      const s = st(), q = P(e, g);
      s.warn = Math.max(s.warn, 0.9);
      flash(g, '#ff3a2a', 0.14, 0.3);
      rad(g, q.x, q.y, 2, 7, { kind: 'smoke', colors: C_DUST, spd: [20, 60], vz: [5, 20], life: [0.4, 0.8], size: [3.5, 6.5], grav: 0, drag: 3 });
      rad(g, q.x, q.y, 6, 5, { colors: ['#ff8a1f', '#ffd27a'], spd: [50, 110], vz: [10, 50], life: [0.2, 0.4], size: [1.6, 2.6], grav: 140 });
      shake(g, 2.5);
    });
    on('BossSummon', (e) => {
      const q = P(e, g);
      ring(g, q.x, q.y, 6, 70, 0.55, '#c9a6ff', 2, 0);
      rad(g, q.x, q.y, 6, 8, { kind: 'wisp', colors: ['#e8d9ff', '#c9a6ff'], spd: [10, 40], vz: [18, 40], life: [0.7, 1.1], size: [2.4, 3.6], grav: 0, drag: 1.5, vr: 0 });
    });
    on('BossDie', (e) => {
      const q = P(e, g);
      const R = ((e && e.r) || 30) * ((e && e.scale) || 1);
      glow(g, q.x, q.y, R * 0.6, 150, 0.8, '#fff3c4', 0.8);
      ring(g, q.x, q.y, 8, 190, 0.8, '#fff0a8', 3, 0);
      ring(g, q.x, q.y, 8, 130, 1.0, '#ffd23f', 2, 0);
      ring(g, q.x, q.y, 8, 80, 0.6, '#ff8a1f', 2, 0);
      rad(g, q.x, q.y, R * 0.8, 64, { kind: 'confetti', colors: C_CONFETTI, spd: [60, 210], vz: [90, 230], life: [1.0, 1.8], size: [2.6, 4], grav: 220, drag: 1.4, vr: 24 });
      rad(g, q.x, q.y, R * 0.8, 20, { kind: 'chunk', colors: C_COLOSSUS.concat(C_PUMPKIN), spd: [40, 150], vz: [100, 200], life: [0.8, 1.3], size: [3, 6], grav: 420, drag: 2, vr: 18 });
      rad(g, q.x, q.y, R * 0.8, 28, { colors: C_GOLD, spd: [70, 220], vz: [40, 160], life: [0.5, 1.0], size: [2, 3.4], grav: 200 });
      rad(g, q.x, q.y, R * 0.5, 6, { kind: 'wisp', colors: ['#e8d9ff', '#ffffff'], spd: [10, 50], vz: [20, 45], life: [1.0, 1.6], size: [3, 5], grav: 0, drag: 1.5, vr: 0 });
      flash(g, '#ffffff', 0.35, 0.9);
      st().ab = 1;
      shake(g, 12);
      hitstop(g, 0.2);
    });

    /* loot */
    on('ChestDrop', (c) => {
      const q = P(c, g);
      glow(g, q.x, q.y, 8, 50, 0.6, '#ffd86b', 0.6);
      ring(g, q.x, q.y, 4, 28, 0.4, '#ffd23f', 1.6, 0);
      rad(g, q.x, q.y, 10, 7, { colors: C_GOLD, spd: [20, 60], vz: [60, 120], life: [0.4, 0.7], size: [1.6, 2.6], grav: 220 });
    });
    on('ChestOpen', (c) => {
      const q = P(c, g);
      glow(g, q.x, q.y, 12, 90, 0.5, '#ffe9a8', 0.7);
      ring(g, q.x, q.y, 4, 46, 0.45, '#ffd23f', 2, 2);
      st().fountains.push({ x: q.x, y: q.y, t: 0, dur: 0.6, acc: 0 });
      rad(g, q.x, q.y, 10, 14, { colors: C_GOLD, spd: [30, 90], vz: [140, 260], life: [0.7, 1.1], size: [1.8, 3], grav: 460, drag: 2 });
      rad(g, q.x, q.y, 10, 5, { kind: 'seed', colors: ['#f1e4b8', '#e8d28a'], spd: [30, 80], vz: [120, 200], life: [0.8, 1.1], size: [2.4, 3.2], grav: 460, drag: 2, vr: 16 });
      flash(g, '#ffe9a8', 0.14, 0.35);
      shake(g, 1.5);
    });
    on('PortalOpen', (po) => {
      const q = P(po, g);
      glow(g, q.x, q.y, 14, 100, 0.8, '#c9a6ff', 0.7);
      ring(g, q.x, q.y, 6, 70, 0.8, '#c9a6ff', 2.2, 0);
      rad(g, q.x, q.y, 6, 18, { colors: ['#c9a6ff', '#7cf0ff', '#ffe9a8', '#ffffff'], spd: [20, 80], vz: [30, 110], life: [0.8, 1.4], size: [1.6, 2.8], grav: 0, drag: 1.5 });
    });
    on('PortalEnter', () => { flash(g, '#ffffff', 0.3, 0.6); });
  }

  /* ---------------------------------------------------------------- per-tick update */
  function update(game, dt) {
    try {
      if (!game) return;
      dt = clamp(dt || 0, 0, 0.1);
      const st = stateOf(game);
      Fx.hitstopLeft = game.hitstop || 0;
      if (game.time < st.lastTime - 0.5) { // new run
        st.hurt = 0; st.warn = 0; st.dash = 0; st.ab = 0; st.flash = null; st.fountains.length = 0;
      }
      st.lastTime = game.time;
      st.clock += dt;
      st.hurt = Math.max(0, st.hurt - dt * 2);
      st.warn = Math.max(0, st.warn - dt * 0.9);
      st.dash = Math.max(0, st.dash - dt * 4.5);
      st.ab = Math.max(0, st.ab - dt * 4);
      if (st.flash) { st.flash.t += dt; if (st.flash.t >= st.flash.dur) st.flash = null; }
      st.hitTok = Math.min(10, st.hitTok + dt * 70);
      st.killTok = Math.min(20, st.killTok + dt * 45);
      st.pickTok = Math.min(14, st.pickTok + dt * 40);
      st.rutTok = Math.min(6, st.rutTok + dt * 20);
      st.shootTok = Math.min(8, st.shootTok + dt * 40);

      // count our particles (cap bookkeeping)
      let c = 0;
      const pl = game.particles;
      for (let i = 0; i < pl.length; i++) if (pl[i].core) c++;
      st.core = c;

      const pm = pmul();
      if (pm <= 0) return;
      const p = game.player;

      // dash afterimage trail + dust
      if (p && p.dashT > 0) {
        st.trailT -= dt;
        if (st.trailT <= 0) {
          st.trailT = 0.026;
          spawn(game, { x: p.x, y: p.y, z: 0, vx: 0, vy: 0, life: 0.24, size: 9, color: '#ffb347', kind: 'trail', drag: 0, face: p.facing || 1 });
          if (rnd() < 0.6 * pm) spawn(game, { x: p.x + (rnd() - 0.5) * 6, y: p.y, z: 1, vx: -p.dashX * 20, vy: -p.dashY * 12, vz: 8, life: rr(0.25, 0.4), size: rr(2.5, 4), color: '#d9d2c4', kind: 'smoke', drag: 3 });
        }
      }

      // gold fountains (chest opened)
      const fo = st.fountains;
      for (let i = fo.length - 1; i >= 0; i--) {
        const f = fo[i];
        f.t += dt; f.acc += dt * 38;
        while (f.acc >= 1) {
          f.acc -= 1;
          if (rnd() > pm) continue;
          const a = rnd() * TAU, s = rr(8, 36);
          spawn(game, {
            x: f.x, y: f.y, z: 12, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: rr(150, 250), grav: 480,
            life: rr(0.7, 1.0), size: rnd() < 0.5 ? 3.4 : 2, color: rnd() < 0.5 ? '#ffd23f' : '#fff0a8', kind: rnd() < 0.5 ? 'coin' : 'spark', rot: rnd() * TAU, vr: 14, drag: 2,
          });
        }
        if (f.t >= f.dur) fo.splice(i, 1);
      }

      // portal swirl
      const po = game.portal;
      if (po && po.open > 0.3 && game.state === 'play') {
        st.portalAcc += dt * 16 * pm;
        while (st.portalAcc >= 1) {
          st.portalAcc -= 1;
          const a = rnd() * TAU, r = rr(24, 40);
          spawn(game, {
            x: po.x + Math.cos(a) * r, y: po.y + Math.sin(a) * r * 0.6, z: rr(0, 26),
            vx: -Math.sin(a) * 38 - Math.cos(a) * 22, vy: (Math.cos(a) * 38 - Math.sin(a) * 22) * 0.6, vz: rr(8, 34),
            life: rr(0.7, 1.1), size: rr(1.4, 2.6), color: ['#c9a6ff', '#7cf0ff', '#ffe9a8', '#ffffff'][(rnd() * 4) | 0], kind: 'spark', drag: 1.2,
          });
        }
      }

      // effects created by other modules (rings / novas / blasts / slams) without a dedicated signal
      const fxl = game.fx;
      for (let i = 0; i < fxl.length; i++) {
        const f = fxl[i];
        if (!f._fxSeen) {
          f._fxSeen = 1;
          if (f.kind === 'nova' && st.clock - st.sigNova > 0.3 && st.clock - st.sigRevive > 0.5 && f.hit) game.signal('Nova', f);
          else if (f.kind === 'blast' && st.clock - st.sigExplode > 0.2) game.signal('Explode', { x: f.x, y: f.y, radius: f.r1 || f.r || 48 });
        }
        if (f.kind === 'slam' && !f._fxDone && f.t >= f.life * 0.97) {
          f._fxDone = 1;
          if (st.clock - st.sigSlam > 0.4) game.signal('BossSlam', { x: f.x, y: f.y, r: f.r });
        }
      }
    } catch (e) { report(e); }
  }

  /* ---------------------------------------------------------------- particle drawing */
  let PS = 0; // world units per art pixel (0 = HD)
  const q = (v) => (PS ? Math.round(v / PS) * PS : v);
  const qs = (s) => (PS ? Math.max(PS, Math.round(s / PS) * PS) : s);
  const SHADOW = 'rgba(20,8,30,0.35)';
  const addList = [];

  function lineSegPix(ctx, x1, y1, x2, y2) {
    const d = Math.hypot(x2 - x1, y2 - y1);
    const n = Math.max(1, Math.ceil(d / PS));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      ctx.fillRect(q(x1 + (x2 - x1) * t), q(y1 + (y2 - y1) * t), PS, PS);
    }
  }

  function dSpark(ctx, p, f) {
    const a = f < 0.4 ? f / 0.4 : 1;
    const s0 = p.size * (0.45 + 0.55 * Math.min(1, f * 1.6));
    const x = p.x, y = p.y - p.z;
    const col = p.color || '#fff';
    if (PS) {
      const s = qs(s0), sx = q(x - s / 2), sy = q(y - s / 2);
      if (s >= PS * 2) { ctx.globalAlpha = a * 0.5; ctx.fillStyle = SHADOW; ctx.fillRect(sx, sy + PS, s, s); }
      ctx.globalAlpha = a; ctx.fillStyle = col;
      ctx.fillRect(sx, sy, s, s);
      const sp = Math.abs(p.vx) + Math.abs(p.vy);
      if (sp > 80) { ctx.globalAlpha = a * 0.55; ctx.fillRect(q(sx - p.vx * 0.03), q(sy - p.vy * 0.03), s, s); }
    } else {
      const sp = Math.abs(p.vx) + Math.abs(p.vy);
      if (s0 >= 2.2) {
        ctx.globalAlpha = a * 0.3; ctx.fillStyle = '#140820';
        ctx.beginPath(); ctx.arc(x, y + 0.4, s0 * 0.8, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = a;
      if (sp > 70) {
        ctx.strokeStyle = col; ctx.lineWidth = s0 * 0.9; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - p.vx * 0.035, y - p.vy * 0.035); ctx.stroke();
      }
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(x, y, s0 * 0.55, 0, TAU); ctx.fill();
    }
  }

  function dShadow(ctx, p, w) {
    if (p.z < 0.8) return;
    const a = 0.25 * clamp(1 - p.z / 60, 0.2, 1);
    ctx.globalAlpha = a; ctx.fillStyle = '#140820';
    if (PS) { const s = qs(w); ctx.fillRect(q(p.x - s / 2), q(p.y), s, PS); }
    else { ctx.beginPath(); ctx.ellipse(p.x, p.y, w * 0.55, w * 0.25, 0, 0, TAU); ctx.fill(); }
  }

  function dChunk(ctx, p, f) {
    const a = f < 0.25 ? f / 0.25 : 1;
    const col = p.color || '#9b6bd1';
    const s = p.size * (0.7 + 0.3 * Math.min(1, f * 2));
    dShadow(ctx, p, s);
    const x = p.x, y = p.y - p.z;
    if (PS) {
      const k = Math.max(2, Math.round(s / PS));
      const w = k * PS, h = (Math.sin(p.rot) > 0 ? k : Math.max(1, k - 1)) * PS;
      const sx = q(x - w / 2), sy = q(y - h / 2);
      ctx.globalAlpha = a;
      ctx.fillStyle = shade(col, 0.45); ctx.fillRect(sx, sy + PS, w, h);
      ctx.fillStyle = col; ctx.fillRect(sx, sy, w, h);
      ctx.fillStyle = shade(col, 1.55); ctx.fillRect(sx, sy, PS, PS);
    } else {
      ctx.globalAlpha = a;
      const c = Math.cos(p.rot), sn = Math.sin(p.rot);
      const seed = p.seed;
      // irregular quad
      const pts = [[-1, -0.8], [1, -0.9 + seed * 0.4], [0.8 + seed * 0.3, 0.9], [-0.9, 0.7 - seed * 0.3]];
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const px = pts[i][0] * s * 0.5, py = pts[i][1] * s * 0.5;
        const X = x + px * c - py * sn, Y = y + px * sn * 0.9 + py * c * 0.9;
        if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
      }
      ctx.closePath();
      ctx.fillStyle = col; ctx.fill();
      ctx.strokeStyle = shade(col, 0.4); ctx.lineWidth = 0.9; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.globalAlpha = a * 0.5; ctx.fillStyle = shade(col, 1.6);
      ctx.beginPath(); ctx.arc(x - s * 0.12, y - s * 0.12, s * 0.12, 0, TAU); ctx.fill();
    }
  }

  /** crisp 1-pixel ellipse outline made of row spans (about 2 fillRects per row) */
  function ringPix(ctx, cx, cy, rx, ry) {
    if (rx < PS || ry < PS) return;
    const rows = Math.round(ry / PS);
    ctx.beginPath();
    for (let j = -rows; j <= rows; j++) {
      const aj = Math.abs(j);
      const xj = rx * Math.sqrt(Math.max(0, 1 - (aj / rows) * (aj / rows)));
      const xn = aj >= rows ? 0 : rx * Math.sqrt(Math.max(0, 1 - ((aj + 1) / rows) * ((aj + 1) / rows)));
      const xo = Math.round(xj / PS) * PS, xi = Math.round(xn / PS) * PS;
      const w = Math.max(PS, xo - xi + PS);
      const y = cy + j * PS;
      ctx.rect(cx + xi, y, w, PS);
      ctx.rect(cx - xi - w + PS, y, w, PS);
    }
    ctx.fill();
  }

  function dRing(ctx, p, f, view) {
    const t = 1 - f, r = (p.r0 || 4) + ((p.r1 || 30) - (p.r0 || 4)) * easeOut(t);
    const a = Math.min(1, f * 2.2) * (p.ga === undefined ? 0.9 : p.ga);
    const lw = (p.lw || 1.6) * (0.5 + 0.5 * f);
    const ry = r * 0.62, cy = p.y - p.z;
    ctx.globalAlpha = a;
    if (PS) {
      const cxq = q(p.x), cyq = q(cy);
      if (ry <= 90) { ctx.fillStyle = SHADOW; ringPix(ctx, cxq, cyq + PS, r, ry); }
      ctx.fillStyle = p.color || '#fff';
      ringPix(ctx, cxq, cyq, r, ry);
      if (lw > PS * 1.6) ringPix(ctx, cxq, cyq, r - PS, ry - PS * 0.62);
    } else {
      ctx.lineWidth = lw + 1.4; ctx.strokeStyle = 'rgba(20,8,30,0.28)';
      ctx.beginPath(); ctx.ellipse(p.x, cy, r, ry, 0, 0, TAU); ctx.stroke();
      ctx.lineWidth = lw; ctx.strokeStyle = p.color || '#fff';
      ctx.beginPath(); ctx.ellipse(p.x, cy, r, ry, 0, 0, TAU); ctx.stroke();
    }
  }

  function dStar(ctx, p, f) {
    const tw = Math.sin(Math.PI * clamp(1 - f, 0, 1));
    const s = p.size * (0.3 + 0.9 * tw);
    if (s < 0.5) return;
    const x = p.x, y = p.y - p.z, col = p.color || '#fff0a8';
    ctx.globalAlpha = Math.min(1, f * 3);
    if (PS) {
      const k = Math.max(1, Math.round(s / PS / 1.2));
      const cx = q(x), cy = q(y);
      ctx.fillStyle = SHADOW;
      ctx.fillRect(cx - k * PS, cy + PS, (k * 2 + 1) * PS, PS);
      ctx.fillStyle = col;
      ctx.fillRect(cx - k * PS, cy, (k * 2 + 1) * PS, PS);
      ctx.fillRect(cx, cy - k * PS, PS, (k * 2 + 1) * PS);
      if (k >= 2) {
        ctx.fillRect(cx - PS, cy - PS, PS, PS); ctx.fillRect(cx + PS, cy - PS, PS, PS);
        ctx.fillRect(cx - PS, cy + PS, PS, PS); ctx.fillRect(cx + PS, cy + PS, PS, PS);
      }
      ctx.fillStyle = '#ffffff'; ctx.fillRect(cx, cy, PS, PS);
    } else {
      const inner = s * 0.26;
      const star = (R, r) => {
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const rad = i & 1 ? r : R, an = i * Math.PI / 4 + p.rot * 0.2 - Math.PI / 2;
          const X = x + Math.cos(an) * rad, Y = y + Math.sin(an) * rad;
          if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
        }
        ctx.closePath();
      };
      star(s * 1.12, inner * 1.2); ctx.fillStyle = 'rgba(30,12,40,0.3)'; ctx.fill();
      star(s, inner); ctx.fillStyle = col; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, inner * 0.9, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
    }
  }

  function dSmoke(ctx, p, f) {
    const t = 1 - f, col = p.color || '#cfc6d6';
    const s = p.size * (0.7 + t * 1.1);
    const a = 0.34 * Math.min(1, f * 2.2) * (0.6 + 0.4 * f);
    ctx.globalAlpha = a; ctx.fillStyle = col;
    if (PS) { const w = qs(s); ctx.fillRect(q(p.x - w / 2), q(p.y - p.z - w / 2), w, w); }
    else { ctx.beginPath(); ctx.arc(p.x, p.y - p.z, s * 0.5, 0, TAU); ctx.fill(); }
  }

  function dLeaf(ctx, p, f) {
    const a = f < 0.3 ? f / 0.3 : 1;
    const x = p.x + Math.sin(p.rot * 0.6 + p.seed * 6) * 2, y = p.y - p.z, col = p.color || '#6fb64a';
    ctx.globalAlpha = a;
    if (PS) {
      const w = Math.sin(p.rot) > 0 ? 2 : 1, h = w === 2 ? 1 : 2;
      ctx.fillStyle = col; ctx.fillRect(q(x), q(y), w * PS, h * PS);
      ctx.fillStyle = shade(col, 0.5); ctx.fillRect(q(x), q(y) + h * PS, w * PS, PS);
    } else {
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(x, y, p.size * 0.6, p.size * 0.3, p.rot, 0, TAU); ctx.fill();
    }
  }

  function dSeed(ctx, p, f) {
    const a = f < 0.3 ? f / 0.3 : 1, col = p.color || '#f1e4b8';
    dShadow(ctx, p, 3);
    const x = p.x, y = p.y - p.z;
    ctx.globalAlpha = a;
    if (PS) {
      const horiz = Math.sin(p.rot) > 0;
      ctx.fillStyle = '#6b4a22'; ctx.fillRect(q(x), q(y) + PS, horiz ? 2 * PS : PS, horiz ? PS : 2 * PS);
      ctx.fillStyle = col; ctx.fillRect(q(x), q(y), horiz ? 2 * PS : PS, horiz ? PS : 2 * PS);
    } else {
      ctx.fillStyle = col; ctx.strokeStyle = '#6b4a22'; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.ellipse(x, y, p.size * 0.6, p.size * 0.33, p.rot, 0, TAU); ctx.fill(); ctx.stroke();
    }
  }

  function dCoin(ctx, p, f) {
    const a = f < 0.25 ? f / 0.25 : 1, x = p.x, y = p.y - p.z;
    const wv = Math.abs(Math.cos(p.rot));
    dShadow(ctx, p, 3);
    ctx.globalAlpha = a;
    if (PS) {
      const w = wv > 0.5 ? 2 : 1;
      const cx = q(x) - (w === 2 ? PS : 0), cy = q(y) - PS;
      ctx.fillStyle = '#7a4a10'; ctx.fillRect(cx, cy + PS, w * PS, PS * 3);
      ctx.fillStyle = '#ffd23f'; ctx.fillRect(cx, cy, w * PS, PS * 3);
      ctx.fillStyle = '#fff6c0'; ctx.fillRect(cx, cy, PS, PS);
    } else {
      const h = p.size * 0.62, w = Math.max(0.5, p.size * 0.5 * wv);
      ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#8a5a10'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.ellipse(x, y, w, h, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff6c0'; ctx.globalAlpha = a * 0.8;
      ctx.beginPath(); ctx.ellipse(x - w * 0.25, y - h * 0.3, w * 0.3, h * 0.25, 0, 0, TAU); ctx.fill();
    }
  }

  function dConfetti(ctx, p, f) {
    const a = f < 0.25 ? f / 0.25 : 1, x = p.x, y = p.y - p.z, col = p.color || '#ffd23f';
    dShadow(ctx, p, 2.5);
    ctx.globalAlpha = a; ctx.fillStyle = col;
    const wv = Math.abs(Math.cos(p.rot * 1.3)), s = p.size;
    if (PS) {
      const horiz = Math.sin(p.rot) > 0, w = horiz ? 2 : 1, h = horiz ? 1 : 2;
      ctx.fillRect(q(x), q(y), (wv > 0.35 ? w : 1) * PS, (wv > 0.35 ? h : 1) * PS);
    } else {
      const c = Math.cos(p.rot), sn = Math.sin(p.rot);
      ctx.beginPath();
      const w = s * 0.55 * Math.max(0.25, wv), h = s * 0.3;
      ctx.moveTo(x + (-w) * c - (-h) * sn, y + ((-w) * sn + (-h) * c) * 0.9);
      ctx.lineTo(x + w * c - (-h) * sn, y + (w * sn + (-h) * c) * 0.9);
      ctx.lineTo(x + w * c - h * sn, y + (w * sn + h * c) * 0.9);
      ctx.lineTo(x + (-w) * c - h * sn, y + ((-w) * sn + h * c) * 0.9);
      ctx.closePath(); ctx.fill();
    }
  }

  function dTrail(ctx, p, f) {
    const a = 0.38 * f * f;
    const h = 20 * (0.6 + 0.4 * f), w = 8 * (0.5 + 0.5 * f);
    ctx.globalAlpha = a; ctx.fillStyle = p.color || '#ffb347';
    if (PS) { const W = qs(w), H = qs(h); ctx.fillRect(q(p.x - W / 2), q(p.y - H - 1), W, H); }
    else {
      const x = p.x - w / 2, y = p.y - h - 1, r = w * 0.45;
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.fill();
    }
  }

  function dCrack(ctx, p, f) {
    const t = 1 - f, grow = easeOut(Math.min(1, t * 4)), R = (p.r1 || 60) * grow;
    const a = Math.min(1, f * 2.5) * 0.85;
    const n = 7 + ((p.seed * 4) | 0);
    ctx.globalAlpha = a;
    const col = p.color || '#2a1a14';
    for (let pass = 0; pass < 2; pass++) {
      if (PS) ctx.fillStyle = pass ? '#6b5a46' : col; else { ctx.strokeStyle = pass ? 'rgba(255,214,150,0.45)' : col; ctx.lineWidth = pass ? 0.6 : 1.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); }
      const dy = pass ? -1 : 0;
      for (let i = 0; i < n; i++) {
        const ang = i / n * TAU + (hash(p.seed * 91, i) - 0.5) * 0.7;
        const L = R * (0.55 + 0.45 * hash(p.seed * 17, i + 3));
        let px = p.x, py = p.y;
        if (!PS) ctx.moveTo(px, py + dy);
        const segs = 4;
        let a2 = ang;
        for (let s = 1; s <= segs; s++) {
          a2 = ang + (hash(p.seed * 53 + s, i) - 0.5) * 0.8;
          const nx = p.x + Math.cos(a2) * L * s / segs, ny = p.y + Math.sin(a2) * L * s / segs * 0.62;
          if (PS) lineSegPix(ctx, px, py + dy * PS, nx, ny + dy * PS); else ctx.lineTo(nx, ny + dy);
          px = nx; py = ny;
        }
      }
      if (!PS) ctx.stroke();
    }
  }

  function dEmberCore(ctx, p, f, t) {
    const flick = 0.65 + 0.35 * Math.sin(t * 38 + p.seed * 60);
    const a = Math.min(1, f * 2) * flick;
    ctx.globalAlpha = a;
    const x = p.x + Math.sin(t * 6 + p.seed * 20) * 1.2, y = p.y - p.z;
    ctx.fillStyle = p.color || '#ff8a1f';
    const s = p.size * (0.5 + 0.5 * f);
    if (PS) { const w = qs(s); ctx.fillRect(q(x), q(y), w, w); }
    else { ctx.beginPath(); ctx.arc(x, y, s * 0.55, 0, TAU); ctx.fill(); }
  }

  /** additive sprite blob centred at world (x,y) with radius r */
  function blob(ctx, color, x, y, r, alpha) {
    if (alpha <= 0.01) return;
    ctx.globalAlpha = Math.min(1, alpha);
    if (PS) {
      let n = Math.round(r * 2 / PS); n = clamp(n, 3, 41); if (!(n & 1)) n++;
      const c = glowPix(color, n);
      ctx.drawImage(c, q(x - n * PS / 2), q(y - n * PS / 2), n * PS, n * PS);
    } else {
      const c = glowHD(color);
      ctx.drawImage(c, x - r, y - r, r * 2, r * 2);
    }
  }

  function drawParticles(ctx, game, view, accent) {
    const list = game.particles;
    if (!list || !list.length) return;
    try {
      PS = view.pixel ? (view.ps || 1) : 0;
      const hq = !isLow();
      const x0 = view.x0 - 30, x1 = view.x1 + 30, y0 = view.y0 - 70, y1 = view.y1 + 50;
      const t = view.rt;
      ctx.save();
      addList.length = 0;
      for (let i = 0; i < list.length; i++) {
        const p = list[i];
        if (p.core !== true) continue;
        if (p.x < x0 || p.x > x1 || p.y < y0 || p.y > y1) {
          if (p.kind !== 'ring' && p.kind !== 'crack') continue;
          if (p.x < x0 - 160 || p.x > x1 + 160 || p.y < y0 - 160 || p.y > y1 + 160) continue;
        }
        const f = clamp(p.life / p.max, 0, 1);
        switch (p.kind) {
          case 'spark': dSpark(ctx, p, f); break;
          case 'chunk': dChunk(ctx, p, f); break;
          case 'ring': dRing(ctx, p, f, view); break;
          case 'star': dStar(ctx, p, f); addList.push(p); break;
          case 'smoke': dSmoke(ctx, p, f); break;
          case 'leaf': dLeaf(ctx, p, f); break;
          case 'seed': dSeed(ctx, p, f); break;
          case 'coin': dCoin(ctx, p, f); break;
          case 'confetti': dConfetti(ctx, p, f); break;
          case 'trail': dTrail(ctx, p, f); break;
          case 'crack': dCrack(ctx, p, f); break;
          case 'ember': dEmberCore(ctx, p, f, t); if (hq) addList.push(p); break;
          case 'glow': case 'wisp': addList.push(p); break;
          default: dSpark(ctx, p, f);
        }
      }
      // additive pass
      if (addList.length) {
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < addList.length; i++) {
          const p = addList[i], f = clamp(p.life / p.max, 0, 1), y = p.y - p.z;
          if (p.kind === 'glow') {
            const k = 1 - f;
            blob(ctx, p.color || '#ffd86b', p.x, y, p.size * (0.55 + 0.45 * easeOut(k)), (p.ga || 0.7) * f * f * 1.4);
          } else if (p.kind === 'star') {
            blob(ctx, p.color || '#fff0a8', p.x, y, p.size * 0.9, 0.35 * Math.sin(Math.PI * clamp(1 - f, 0, 1)));
          } else if (p.kind === 'ember') {
            blob(ctx, p.color || '#ff8a1f', p.x, y, p.size * 1.5, 0.35 * Math.min(1, f * 2));
          } else { // wisp
            const wob = Math.sin(t * 5 + p.seed * 30) * 1.6;
            const a = Math.min(1, f * 2) * Math.min(1, (1 - f) * 6);
            blob(ctx, p.color || '#e8d9ff', p.x + wob, y, p.size * 1.7, 0.5 * a);
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = a * 0.9; ctx.fillStyle = '#ffffff';
            if (PS) ctx.fillRect(q(p.x + wob), q(y), PS, PS);
            else { ctx.beginPath(); ctx.arc(p.x + wob, y, p.size * 0.32, 0, TAU); ctx.fill(); }
            ctx.globalCompositeOperation = 'lighter';
          }
        }
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    } catch (e) { try { ctx.restore(); } catch (_) { /* ignore */ } report(e); }
  }

  /* ---------------------------------------------------------------- ambient motes */
  const AMB = [];
  const AMB_MAX = 36;
  for (let i = 0; i < AMB_MAX; i++) {
    const r = (k) => hash(i * 7.31 + k, k * 3.7);
    AMB.push({
      bx: r(1), by: r(2), vx: (r(3) - 0.5) * 5, vy: (r(4) - 0.5) * 4, ph: r(5) * TAU, sp: 0.3 + r(6) * 0.7, am: 4 + r(7) * 8,
      type: i % 4 === 3 ? 2 : i % 4 === 2 ? 1 : 0, sz: 1 + r(8) * 1.2, a: 0.25 + r(9) * 0.3,
    });
  }
  function drawAmbient(ctx, game, view, accent) {
    const c = cfg();
    if (!c.ambient) return;
    try {
      const n = c.quality === 'low' ? 14 : c.quality === 'medium' ? 24 : AMB_MAX;
      PS = view.pixel ? (view.ps || 1) : 0;
      const m = 24, w = view.x1 - view.x0 + m * 2, h = view.y1 - view.y0 + m * 2;
      const t = view.rt;
      ctx.save();
      const ac = accent || '#ffb347';
      const fly = mixHex(ac, '#fff3c4', 0.55), dust = mixHex(ac, '#ffffff', 0.7), leaf = mixHex(ac, '#d98a3a', 0.5);
      for (let i = 0; i < n; i++) {
        const o = AMB[i];
        const sx = o.bx * w * 3 + o.vx * t + Math.sin(t * o.sp + o.ph) * o.am;
        const sy = o.by * h * 3 + o.vy * t + (o.type === 2 ? 5 * t : 0) + Math.cos(t * o.sp * 0.8 + o.ph) * o.am * 0.6;
        let x = view.x0 - m + ((((sx - (view.x0 - m)) % w) + w) % w);
        let y = view.y0 - m + ((((sy - (view.y0 - m)) % h) + h) % h);
        // wrap fade near the rectangle border so nothing pops
        const ex = Math.min(x - (view.x0 - m), view.x1 + m - x) / m, ey = Math.min(y - (view.y0 - m), view.y1 + m - y) / m;
        const edge = clamp(Math.min(ex, ey), 0, 1);
        if (o.type === 0) { // firefly
          const blink = 0.35 + 0.65 * Math.max(0, Math.sin(t * o.sp * 2.2 + o.ph));
          const a = o.a * blink * edge * 1.4;
          if (a < 0.03) continue;
          ctx.globalCompositeOperation = 'lighter';
          blob(ctx, fly, x, y, PS ? 3 * PS : 5.5, a * 0.8);
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = Math.min(1, a * 1.6); ctx.fillStyle = '#fffbe0';
          if (PS) ctx.fillRect(q(x), q(y), PS, PS); else { ctx.beginPath(); ctx.arc(x, y, 0.9, 0, TAU); ctx.fill(); }
        } else if (o.type === 1) { // dust speck
          ctx.globalAlpha = o.a * 0.7 * edge; ctx.fillStyle = dust;
          if (PS) ctx.fillRect(q(x), q(y), PS, PS); else { ctx.beginPath(); ctx.arc(x, y, o.sz * 0.55, 0, TAU); ctx.fill(); }
        } else { // drifting leaf
          const rot = t * o.sp * 1.4 + o.ph;
          ctx.globalAlpha = o.a * 1.3 * edge; ctx.fillStyle = leaf;
          if (PS) { const hz = Math.sin(rot) > 0; ctx.fillRect(q(x), q(y), (hz ? 2 : 1) * PS, (hz ? 1 : 2) * PS); }
          else { ctx.beginPath(); ctx.ellipse(x, y, 2, 1, rot, 0, TAU); ctx.fill(); }
        }
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    } catch (e) { try { ctx.restore(); } catch (_) { /* ignore */ } report(e); }
  }

  /* ---------------------------------------------------------------- screen effects */
  function drawScreen(ctx, view, game) {
    const c = cfg();
    if (!c.screenFx && !c.flashes) return;
    try {
      const st = game._fx;
      if (!st) return;
      const W = view.W, H = view.H, pix = !!view.pixel;
      const rt = view.rt;
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      const vig = (kind, a) => {
        if (a <= 0.01) return;
        ctx.globalAlpha = Math.min(1, a);
        ctx.drawImage(vignette(kind, W, H, pix), 0, 0, W, H);
      };
      if (c.screenFx) {
        vig('soft', pix ? 0.16 : 0.2);
        // low HP heartbeat
        const p = game.player;
        if (p && p.maxHp > 0 && game.state !== 'dead') {
          const r = p.hp / p.maxHp;
          if (r < 0.3 && p.hp > 0) {
            const need = 1 - r / 0.3;
            const ph = (rt * (1.15 + need * 0.5)) % 1;
            const beat = Math.exp(-Math.pow(ph * 8, 2)) + 0.6 * Math.exp(-Math.pow((ph - 0.2) * 8, 2));
            vig('low', (0.18 + 0.4 * beat) * (0.5 + 0.5 * need));
          }
        }
        // boss warning border
        let w = st.warn;
        const fl = game.fx;
        for (let i = 0; i < fl.length; i++) {
          const f = fl[i];
          if (f.kind === 'slam' || f.kind === 'line') w = Math.max(w, 0.45 + 0.4 * clamp(f.t / f.life, 0, 1));
        }
        if (w > 0.02) vig('warn', clamp(w, 0, 1) * (0.32 + 0.22 * Math.sin(rt * 11)));
        // hurt
        if (st.hurt > 0.01) vig('hurt', 0.62 * Math.pow(st.hurt, 1.4));
        // dash
        if (st.dash > 0.01) {
          vig('dash', 0.16 * st.dash);
          speedLines(ctx, st, W, H, pix, view);
        }
      }
      if (c.screenFx && c.quality !== 'low' && st.ab > 0.05) aberration(ctx, st, W, H, pix);
      if (c.flashes) {
        // soft red tint on hurt is handled by the flash system; gold level-up bloom on top
        const f = st.flash;
        if (f) {
          const a = flashAlpha(f);
          if (a > 0.004) { ctx.globalAlpha = a; ctx.fillStyle = f.col; ctx.fillRect(0, 0, W, H); }
        }
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    } catch (e) { try { ctx.restore(); } catch (_) { /* ignore */ } report(e); }
  }

  function speedLines(ctx, st, W, H, pix, view) {
    const dx = st.dashDx, dy = st.dashDy, nx = -dy, ny = dx;
    const diag = Math.hypot(W, H), k = st.dash;
    ctx.globalAlpha = (pix ? 0.9 : 0.5) * k; ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#ffffff'; ctx.lineCap = 'round';
    const slide = (1 - k) * 0.25;
    const axis = Math.abs(dy) < 0.15 || Math.abs(dx) < 0.15;
    if (!pix) ctx.beginPath();
    for (let i = 0; i < st.lines.length; i++) {
      const l = st.lines[i];
      const cx = W / 2 + nx * l.u * H * 0.62 + dx * (l.a - slide) * diag * 0.8;
      const cy = H / 2 + ny * l.u * H * 0.62 + dy * (l.a - slide) * diag * 0.8;
      const len = l.len * diag * (0.6 + 0.4 * k);
      const x1 = cx - dx * len / 2, y1 = cy - dy * len / 2, x2 = cx + dx * len / 2, y2 = cy + dy * len / 2;
      if (pix) {
        if (axis) {
          if (Math.abs(dy) < 0.15) ctx.fillRect(Math.round(Math.min(x1, x2)), Math.round(cy), Math.round(Math.abs(x2 - x1)), 1);
          else ctx.fillRect(Math.round(cx), Math.round(Math.min(y1, y2)), 1, Math.round(Math.abs(y2 - y1)));
        } else {
          const n = Math.ceil(len);
          for (let s = 0; s <= n; s++) ctx.fillRect(Math.round(x1 + (x2 - x1) * s / n), Math.round(y1 + (y2 - y1) * s / n), 1, 1);
        }
      } else {
        ctx.lineWidth = l.w * (H / 540);
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      }
    }
    if (!pix) ctx.stroke();
  }

  /** cheap chromatic aberration: tinted, shifted copies of the left/right screen edges */
  function aberration(ctx, st, W, H, pix) {
    const sw = Math.round(W * 0.16), k = Math.max(1, Math.round(Math.min(1, st.ab) * W * 0.006));
    if (sw < 4 || H < 4) return;
    if (!st.tmp) { st.tmp = mkCanvas(sw + 16, H); st.tmpCtx = st.tmp.getContext('2d'); }
    if (st.tmp.width !== sw + 16 || st.tmp.height !== H) { st.tmp.width = sw + 16; st.tmp.height = H; }
    const tc = st.tmpCtx, src = ctx.canvas;
    // red channel of each edge strip is moved outwards by k px (red/cyan fringes, no brightening)
    for (let side = 0; side < 2; side++) {
      const sx = side ? W - sw : 0;
      tc.globalCompositeOperation = 'source-over'; tc.globalAlpha = 1;
      tc.clearRect(0, 0, sw + 16, H);
      if (side) tc.drawImage(src, sx - k, 0, sw + k, H, 0, 0, sw + k, H); else tc.drawImage(src, 0, 0, sw + k, H, 0, 0, sw + k, H);
      tc.globalCompositeOperation = 'multiply';
      tc.fillStyle = '#ff0000'; tc.fillRect(0, 0, sw + k, H);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = '#00ffff'; ctx.fillRect(sx, 0, sw, H);
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(st.tmp, side ? sx : sx - k, 0);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  const Fx = { hitstopLeft: 0, attach, update, drawParticles, drawAmbient, drawScreen };
  window.Fx = Fx;
})();
