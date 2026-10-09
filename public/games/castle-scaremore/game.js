/* Castle Scaremore – gameplay
   A fixed camera on a castle corridor. Visitors walk along the carpet, the ghost hides
   behind a suit of armor. Tap when a visitor reaches the armor: Miss / Good / Great / Perfect. */
(() => {
'use strict';

const A = window.Scaremore;
const $ = s => document.querySelector(s);
const app = $('#app');
const sceneEl = $('#scene');
const canvas = $('#scene-canvas');
const ctx = canvas.getContext('2d');
const fxLayer = $('#fx-layer');

// ---------------------------------------------------------------- room looks
const THEMES = [
  { wall: '#2c2933', mortar: '#1c1a21', floor: '#1d1b21', banner: '#6e3a40', carpet: '#5a2c33', trim: '#a9824c', window: 'arch', extra: 'none' },      // Entrance Hall
  { wall: '#2a2a34', mortar: '#1b1b23', floor: '#1c1c23', banner: '#34507a', carpet: '#33405e', trim: '#b0925a', window: 'arch', extra: 'shields' },   // Knight's Hall
  { wall: '#262c29', mortar: '#171c19', floor: '#1b1f1d', banner: null, carpet: '#3b352c', trim: '#6b5f4a', window: 'bars', extra: 'chains' },        // Dungeon
  { wall: '#2b2739', mortar: '#1c1928', floor: '#1e1b28', banner: '#4e3775', carpet: '#3e2f5c', trim: '#b39ae0', window: 'round', extra: 'stars' },    // Wizard Tower
  { wall: '#312b2a', mortar: '#201b1b', floor: '#221e1d', banner: '#7d3030', carpet: '#7a2f31', trim: '#d6ae5c', window: 'arch', extra: 'gold' },      // Throne Room
];

const LOOKS = {
  shirt: ['#c8765a', '#6f9bb8', '#d4b06a', '#8aa67a', '#b07aa6', '#ddd3bf', '#5f7fa6', '#b95b5b', '#7fb3a7'],
  pants: ['#3b4252', '#4a3f35', '#2f3a4a', '#5a5048', '#2b2b30', '#44506a'],
  skin: ['#f1c9a5', '#e0ac85', '#c68b62', '#8d5a3b', '#f5d7bd', '#a8704a'],
  hair: ['#2b2220', '#5a3b28', '#c9a26b', '#7a4a2a', '#1d1d22', '#b8b2a8', '#8a3b24'],
  hat: [null, null, 'cap', 'sunhat', 'beanie', null],
  hatColor: ['#d9c9a3', '#c0504d', '#3f5f8a', '#e0dcd0', '#6a8f5a'],
  acc: [null, 'camera', 'backpack', 'camera', null],
  bag: ['#6b5a45', '#4f6a5a', '#7a4a3a', '#48506a'],
};
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

// ---------------------------------------------------------------- helpers
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
  return `rgb(${r},${g},${b})`;
}
function rng(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h);
}
function circle(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
function ellipse(c, x, y, rx, ry, rot = 0) { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); c.fill(); }
function line(c, x1, y1, x2, y2) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutBack = t => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const GHOST_PATH = new Path2D('M50 10C28 10 16 27 16 48v42c0 3 3 4.5 5.5 2.8L29 88l8 7c2 1.6 4.6 1.6 6.5 0L50 89.5l6.5 5.5c2 1.6 4.6 1.6 6.5 0l8-7 7.5 4.8C81 94.5 84 93 84 90V48C84 27 72 10 50 10z');

function relToApp(el) {
  const a = app.getBoundingClientRect(), r = el.getBoundingClientRect();
  return { x: r.left - a.left + r.width / 2, y: r.top - a.top + r.height / 2 };
}
function sceneToApp(x, y) {
  const a = app.getBoundingClientRect(), r = sceneEl.getBoundingClientRect();
  return { x: r.left - a.left + x, y: r.top - a.top + y };
}

// ---------------------------------------------------------------- layout + static layers
let W = 0, H = 0, dpr = 1;
const L = {};
let layers = null, builtRoom = -1;

function makeLayer() {
  const cv = document.createElement('canvas');
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  const c = cv.getContext('2d');
  c.scale(dpr, dpr);
  return { cv, c };
}
function layout() {
  const r = sceneEl.getBoundingClientRect();
  if (!r.width || !r.height) return;
  if (Math.abs(r.width - W) < 1 && Math.abs(r.height - H) < 1 && layers) return;
  W = r.width; H = r.height;
  dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  L.floorY = H * 0.6;
  L.walkY = H * 0.885;
  L.carpetTop = H * 0.8; L.carpetBot = H * 0.975;
  L.armorX = W * 0.62;
  L.armorFeet = L.floorY + H * 0.075;
  L.armorH = H * 0.44;
  L.charH = Math.min(H * 0.25, W * 0.21);
  L.speed = W / 6;
  L.torches = [W * 0.41, W * 0.035];
  L.torchY = H * 0.33;
  L.windows = [{ x: W * 0.2, moon: true }, { x: W * 0.905 }];
  buildLayers();
}
function buildLayers() {
  L.walkY = H * (window.Moonlit?.active ? 0.838 : 0.885);
  L.torches = window.Moonlit?.active ? [W * 0.097, W * 0.386] : [W * 0.41, W * 0.035];
  L.torchY = H * (window.Moonlit?.active ? 0.286 : 0.33);
  const th = THEMES[A.S.currentRoom];
  builtRoom = A.S.currentRoom;
  layers = { bg: makeLayer(), armor: makeLayer(), vignette: makeLayer() };
  drawBackground(layers.bg.c, th);
  drawArmor(layers.armor.c, th);
  const v = layers.vignette.c;
  const g = v.createRadialGradient(W / 2, H * 0.5, H * 0.25, W / 2, H * 0.5, Math.max(W, H) * 0.85);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,.6)');
  v.fillStyle = g; v.fillRect(0, 0, W, H);
  initMotes();
}

function drawBackground(c, th) {
  if (window.Moonlit?.active) return Moonlit.background(c, W, H, L, A.S.currentRoom);
  // --- wall: stone courses
  c.fillStyle = th.mortar; c.fillRect(0, 0, W, L.floorY);
  const rowH = Math.max(14, H * 0.058), bw = rowH * 2.4;
  const rnd = rng(17 + A.S.currentRoom * 31);
  for (let y = 0, row = 0; y < L.floorY; y += rowH, row++) {
    const off = row % 2 ? bw / 2 : 0;
    for (let x = -off; x < W; x += bw) {
      c.fillStyle = shade(th.wall, (rnd() - 0.5) * 0.09);
      rr(c, x + 1.2, y + 1.2, bw - 2.4, rowH - 2.4, 2); c.fill();
    }
  }
  let g = c.createLinearGradient(0, 0, 0, L.floorY);
  g.addColorStop(0, 'rgba(0,0,0,.5)'); g.addColorStop(0.35, 'rgba(0,0,0,0)');
  g.addColorStop(0.8, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.4)');
  c.fillStyle = g; c.fillRect(0, 0, W, L.floorY);

  // --- windows
  for (const w of L.windows) drawWindow(c, th, w);

  // --- wall extras
  if (th.extra === 'gold') {
    c.fillStyle = shade(th.trim, -0.35); c.fillRect(0, L.floorY - H * 0.14, W, H * 0.012);
    c.fillStyle = th.trim; c.globalAlpha = 0.5; c.fillRect(0, L.floorY - H * 0.14, W, 1); c.globalAlpha = 1;
  }
  if (th.extra === 'shields') drawShield(c, th, W * 0.765, H * 0.29);
  if (th.extra === 'chains') { drawChain(c, W * 0.34, H * 0.34); drawChain(c, W * 0.77, H * 0.26); }
  if (th.extra === 'stars') {
    c.fillStyle = th.trim; c.globalAlpha = 0.35;
    const r2 = rng(5);
    for (let i = 0; i < 14; i++) sparkle(c, r2() * W, r2() * L.floorY * 0.9, 2 + r2() * 3);
    c.globalAlpha = 1;
  }

  // --- banner behind the armor
  if (th.banner) drawBanner(c, th);

  // --- torch brackets
  for (const tx of L.torches) {
    c.fillStyle = '#35313b';
    rr(c, tx - 3, L.torchY + 4, 6, H * 0.06, 2); c.fill();
    c.fillStyle = '#4a4550';
    c.beginPath();
    c.moveTo(tx - H * 0.022, L.torchY - 2); c.lineTo(tx + H * 0.022, L.torchY - 2);
    c.lineTo(tx + H * 0.012, L.torchY + 6); c.lineTo(tx - H * 0.012, L.torchY + 6);
    c.closePath(); c.fill();
  }

  // --- baseboard
  c.fillStyle = shade(th.mortar, -0.3); c.fillRect(0, L.floorY - H * 0.02, W, H * 0.02);

  // --- floor with perspective tiles
  c.fillStyle = th.floor; c.fillRect(0, L.floorY, W, H - L.floorY);
  const vp = { x: W * 0.5, y: L.floorY - H * 0.9 };
  c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1;
  for (let k = -12; k <= 12; k++) {
    const xb = W / 2 + k * W * 0.15;
    const xt = vp.x + (xb - vp.x) * (L.floorY - vp.y) / (H - vp.y);
    line(c, xt, L.floorY, xb, H);
  }
  for (let j = 1; j <= 6; j++) {
    const y = L.floorY + (H - L.floorY) * Math.pow(j / 6, 1.6);
    line(c, 0, y, W, y);
  }
  c.fillStyle = 'rgba(255,255,255,.035)'; c.fillRect(0, L.floorY, W, 1.5);

  // --- moonlight falling onto the floor
  c.fillStyle = 'rgba(150,170,235,.055)';
  for (const w of L.windows) {
    if (th.window === 'bars') continue;
    const hw = W * 0.075;
    c.beginPath();
    c.moveTo(w.x - hw + W * 0.03, L.floorY); c.lineTo(w.x + hw + W * 0.03, L.floorY);
    c.lineTo(w.x + hw + W * 0.2, H); c.lineTo(w.x - hw + W * 0.2, H);
    c.closePath(); c.fill();
  }

  // --- carpet runner
  const ct = L.carpetTop, cb = L.carpetBot;
  c.fillStyle = th.carpet; c.fillRect(0, ct, W, cb - ct);
  g = c.createLinearGradient(0, ct, 0, cb);
  g.addColorStop(0, 'rgba(0,0,0,.3)'); g.addColorStop(0.3, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.15)');
  c.fillStyle = g; c.fillRect(0, ct, W, cb - ct);
  c.strokeStyle = th.trim; c.globalAlpha = 0.5; c.lineWidth = 1.2;
  line(c, 0, ct + 4, W, ct + 4); line(c, 0, cb - 4, W, cb - 4);
  c.globalAlpha = 0.14; c.fillStyle = th.trim;
  const cy = (ct + cb) / 2, d = (cb - ct) * 0.18;
  for (let x = 12; x < W; x += 28) {
    c.beginPath(); c.moveTo(x, cy - d); c.lineTo(x + d, cy); c.lineTo(x, cy + d); c.lineTo(x - d, cy); c.closePath(); c.fill();
  }
  c.globalAlpha = 1;
}

function drawWindow(c, th, w) {
  const ww = W * 0.15, top = H * 0.11, wh = H * 0.3;
  const frame = shade(th.wall, 0.07);
  const sky = c.createLinearGradient(0, top, 0, top + wh);
  sky.addColorStop(0, '#18203a'); sky.addColorStop(1, '#2a3858');
  if (th.window === 'round') {
    const r = ww * 0.55, cx = w.x, cy = top + wh * 0.4;
    c.fillStyle = frame; circle(c, cx, cy, r + 5);
    c.fillStyle = sky; circle(c, cx, cy, r);
    if (w.moon) moon(c, cx + r * 0.25, cy - r * 0.2, r * 0.3);
    c.strokeStyle = th.mortar; c.lineWidth = 2.5;
    line(c, cx - r, cy, cx + r, cy); line(c, cx, cy - r, cx, cy + r);
    return;
  }
  if (th.window === 'bars') {
    const bw = ww * 0.8, bh = bw * 0.75, x = w.x - bw / 2, y = H * 0.13;
    c.fillStyle = frame; rr(c, x - 5, y - 5, bw + 10, bh + 10, 3); c.fill();
    c.fillStyle = sky; c.fillRect(x, y, bw, bh);
    if (w.moon) moon(c, x + bw * 0.65, y + bh * 0.35, bh * 0.2);
    c.strokeStyle = '#141216'; c.lineWidth = 3;
    for (let i = 1; i < 4; i++) line(c, x + (bw * i) / 4, y, x + (bw * i) / 4, y + bh);
    return;
  }
  const arch = (pad) => {
    const l = w.x - ww / 2 - pad, r = w.x + ww / 2 + pad, y = top - pad, spring = top + ww * 0.55;
    c.beginPath();
    c.moveTo(l, top + wh + pad * 0.3);
    c.lineTo(l, spring);
    c.quadraticCurveTo(l, y + ww * 0.08, w.x, y);
    c.quadraticCurveTo(r, y + ww * 0.08, r, spring);
    c.lineTo(r, top + wh + pad * 0.3);
    c.closePath();
  };
  c.fillStyle = frame; arch(5); c.fill();
  c.fillStyle = sky; arch(0); c.fill();
  c.save(); arch(0); c.clip();
  const r2 = rng(Math.round(w.x));
  c.fillStyle = 'rgba(255,255,255,.55)';
  for (let i = 0; i < 7; i++) c.fillRect(w.x - ww / 2 + r2() * ww, top + r2() * wh * 0.7, 1, 1);
  if (w.moon) moon(c, w.x + ww * 0.12, top + wh * 0.3, ww * 0.17);
  c.restore();
  c.strokeStyle = th.mortar; c.lineWidth = 2.5;
  line(c, w.x, top + 2, w.x, top + wh);
  line(c, w.x - ww / 2, top + wh * 0.55, w.x + ww / 2, top + wh * 0.55);
  c.fillStyle = shade(th.wall, 0.12);
  rr(c, w.x - ww / 2 - 8, top + wh, ww + 16, 5, 1.5); c.fill();
}
function moon(c, x, y, r) {
  const g = c.createRadialGradient(x, y, r * 0.8, x, y, r * 3);
  g.addColorStop(0, 'rgba(232,226,204,.22)'); g.addColorStop(1, 'rgba(232,226,204,0)');
  c.fillStyle = g; c.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
  c.fillStyle = '#e8e2cc'; circle(c, x, y, r);
  c.fillStyle = 'rgba(0,0,0,.08)'; circle(c, x - r * 0.3, y + r * 0.2, r * 0.25); circle(c, x + r * 0.3, y - r * 0.3, r * 0.15);
}
function drawBanner(c, th) {
  const x = L.armorX, top = H * 0.06, bw = W * 0.135, bh = H * 0.36;
  c.fillStyle = th.banner;
  c.beginPath();
  c.moveTo(x - bw / 2, top); c.lineTo(x + bw / 2, top);
  c.lineTo(x + bw / 2, top + bh); c.lineTo(x, top + bh - bw * 0.35); c.lineTo(x - bw / 2, top + bh);
  c.closePath(); c.fill();
  // folds
  const g = c.createLinearGradient(x - bw / 2, 0, x + bw / 2, 0);
  g.addColorStop(0, 'rgba(0,0,0,.2)'); g.addColorStop(0.3, 'rgba(255,255,255,.04)');
  g.addColorStop(0.55, 'rgba(0,0,0,.12)'); g.addColorStop(0.8, 'rgba(255,255,255,.03)'); g.addColorStop(1, 'rgba(0,0,0,.25)');
  c.fillStyle = g; c.fill();
  c.strokeStyle = th.trim; c.globalAlpha = 0.6; c.lineWidth = 1.2;
  line(c, x - bw / 2 + 4, top + 4, x - bw / 2 + 4, top + bh - 6);
  line(c, x + bw / 2 - 4, top + 4, x + bw / 2 - 4, top + bh - 6);
  c.globalAlpha = 1;
  // emblem: the house ghost
  c.save();
  const es = bw * 0.0048;
  c.translate(x - 50 * es, top + bh * 0.36 - 55 * es); c.scale(es, es);
  c.fillStyle = th.trim; c.globalAlpha = 0.85; c.fill(GHOST_PATH);
  c.restore();
  // rod
  c.fillStyle = '#3b3741'; rr(c, x - bw / 2 - 6, top - 3, bw + 12, 4, 2); c.fill();
  c.fillStyle = th.trim; circle(c, x - bw / 2 - 6, top - 1, 2.6); circle(c, x + bw / 2 + 6, top - 1, 2.6);
}
function drawShield(c, th, x, y) {
  const r = W * 0.045;
  c.strokeStyle = '#8a8e99'; c.lineWidth = 2.5;
  line(c, x - r * 1.6, y - r * 1.6, x + r * 1.6, y + r * 1.6);
  line(c, x + r * 1.6, y - r * 1.6, x - r * 1.6, y + r * 1.6);
  c.fillStyle = th.banner; circle(c, x, y, r);
  c.strokeStyle = th.trim; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r - 1, 0, Math.PI * 2); c.stroke();
  c.fillStyle = th.trim; circle(c, x, y, r * 0.25);
}
function drawChain(c, x, len) {
  c.strokeStyle = '#4a4650'; c.lineWidth = 1.8;
  for (let y = 0, i = 0; y < len; y += 7, i++) {
    c.beginPath();
    if (i % 2) c.ellipse(x, y, 1.5, 4, 0, 0, Math.PI * 2);
    else c.ellipse(x, y, 3.2, 4, 0, 0, Math.PI * 2);
    c.stroke();
  }
  c.fillStyle = '#4a4650'; rr(c, x - 5, len, 10, 5, 2); c.fill();
}
function sparkle(c, x, y, r) {
  c.beginPath();
  c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r);
  c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r);
  c.fill();
}

function drawArmor(c, th) {
  if (window.Moonlit?.active) return Moonlit.armor(c, W, H, L);
  const s = L.armorH / 100;
  const steel = '#8a8e99', dark = '#5d616c', deep = '#43464f', hi = '#b4b8c2';
  c.fillStyle = 'rgba(0,0,0,.4)'; ellipse(c, L.armorX, L.armorFeet + 3 * s, 28 * s, 5 * s);
  c.save(); c.translate(L.armorX, L.armorFeet); c.scale(s, s);
  c.lineCap = 'round';
  // plinth
  c.fillStyle = '#34303a'; rr(c, -21, -4, 42, 8, 2); c.fill();
  c.fillStyle = '#403c47'; rr(c, -21, -4, 42, 2.5, 1); c.fill();
  // halberd
  c.strokeStyle = '#5b4634'; c.lineWidth = 2.4; line(c, 21, -3, 21, -118);
  c.fillStyle = steel;
  c.beginPath(); c.moveTo(21, -111); c.quadraticCurveTo(34, -109, 33, -97); c.quadraticCurveTo(27, -100, 21, -98); c.closePath(); c.fill();
  c.fillStyle = hi;
  c.beginPath(); c.moveTo(21, -127); c.lineTo(23.2, -114); c.lineTo(18.8, -114); c.closePath(); c.fill();
  // legs
  c.fillStyle = dark; rr(c, -11, -40, 8.5, 36, 3); c.fill(); rr(c, 2.5, -40, 8.5, 36, 3); c.fill();
  c.fillStyle = steel; rr(c, -11, -40, 4.5, 36, 2.2); c.fill(); rr(c, 2.5, -40, 4.5, 36, 2.2); c.fill();
  c.fillStyle = hi; circle(c, -6.8, -21, 3.4); circle(c, 6.8, -21, 3.4);
  c.fillStyle = deep; rr(c, -14.5, -6, 12, 5, 2.5); c.fill(); rr(c, 2.5, -6, 12, 5, 2.5); c.fill();
  // tassets
  c.fillStyle = dark;
  c.beginPath(); c.moveTo(-15, -49); c.lineTo(15, -49); c.lineTo(13, -37); c.lineTo(-13, -37); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 0.8; line(c, -14, -43, 14, -43);
  // torso
  c.fillStyle = steel;
  c.beginPath(); c.moveTo(-15, -79); c.quadraticCurveTo(0, -83, 15, -79); c.lineTo(12.5, -50); c.quadraticCurveTo(0, -46, -12.5, -50); c.closePath(); c.fill();
  c.fillStyle = 'rgba(0,0,0,.2)';
  c.beginPath(); c.moveTo(1, -82); c.quadraticCurveTo(9, -81.5, 15, -79); c.lineTo(12.5, -50); c.quadraticCurveTo(7, -48, 1, -47.5); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.2)'; ellipse(c, -6, -68, 3, 8.5, 0.15);
  c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 1; line(c, 0, -81, 0, -50);
  // belt
  c.fillStyle = '#3d3136'; rr(c, -13.5, -52, 27, 3.6, 1.2); c.fill();
  c.fillStyle = '#b0925a'; rr(c, -2, -52.4, 4, 4.4, 1); c.fill();
  // arms + gauntlets
  c.fillStyle = dark; rr(c, -23, -76, 7, 27, 3.5); c.fill(); rr(c, 16, -76, 7, 27, 3.5); c.fill();
  c.fillStyle = steel; rr(c, -23, -76, 3.8, 27, 2); c.fill();
  c.fillStyle = deep; circle(c, -19.5, -47, 4); circle(c, 20, -47.5, 4.2);
  // pauldrons
  c.fillStyle = steel; ellipse(c, -17, -77, 8.5, 6, -0.25);
  c.fillStyle = dark; ellipse(c, 17, -77, 8.5, 6, 0.25);
  c.fillStyle = 'rgba(255,255,255,.18)'; ellipse(c, -19, -79, 4, 2, -0.25);
  // gorget + helmet
  c.fillStyle = dark; rr(c, -6, -87, 12, 6, 2); c.fill();
  c.fillStyle = steel; ellipse(c, 0, -96, 10.5, 12);
  c.fillStyle = 'rgba(0,0,0,.2)';
  c.beginPath(); c.ellipse(0, -96, 10.5, 12, 0, -Math.PI / 2, Math.PI / 2); c.fill();
  c.fillStyle = 'rgba(255,255,255,.18)'; ellipse(c, -4.5, -101, 2.2, 4, 0.2);
  c.fillStyle = '#15131a'; rr(c, -7.5, -98, 15, 2.6, 1.3); c.fill();
  c.fillStyle = 'rgba(0,0,0,.35)';
  for (const [px, py] of [[3, -91], [5.5, -91], [3, -88.5], [5.5, -88.5]]) circle(c, px, py, 0.7);
  // plume
  c.fillStyle = th.banner || '#7d3030';
  c.beginPath(); c.moveTo(0, -107); c.quadraticCurveTo(-4, -118, -15, -115); c.quadraticCurveTo(-8, -111, -5, -104); c.closePath(); c.fill();
  c.restore();
}

// ---------------------------------------------------------------- dynamic scenery
let motes = [];
function initMotes() {
  motes = Array.from({ length: 14 }, () => ({
    x: Math.random() * W, y: L.floorY * (0.3 + Math.random() * 0.9),
    vx: 3 + Math.random() * 5, vy: -2 + Math.random() * 4, a: 0.1 + Math.random() * 0.25, r: 0.7 + Math.random() * 0.8,
  }));
}
function drawTorches(c, time) {
  if (window.Moonlit?.active && Moonlit.reduced) time = 0;
  L.torches.forEach((tx, i) => {
    const f = 0.88 + 0.08 * Math.sin(time * 9 + i * 2.1) + 0.05 * Math.sin(time * 23 + i);
    const ty = L.torchY - 2;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const R = W * 0.3 * f;
    const g = c.createRadialGradient(tx, ty, 0, tx, ty, R);
    const col = isHaunting() ? '110,220,175' : '232,150,70';
    g.addColorStop(0, `rgba(${col},.2)`); g.addColorStop(0.4, `rgba(${col},.07)`); g.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = g; c.fillRect(tx - R, ty - R, R * 2, R * 2);
    c.restore();
    const fh = H * 0.055 * f, fw = H * 0.02, sway = Math.sin(time * 7 + i) * fw * 0.35;
    const flame = (w, h, col) => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(tx + sway, ty - h);
      c.quadraticCurveTo(tx + w * 1.25, ty - h * 0.25, tx, ty);
      c.quadraticCurveTo(tx - w * 1.25, ty - h * 0.25, tx + sway, ty - h);
      c.fill();
    };
    const h = isHaunting();
    flame(fw, fh, h ? '#5fcf9f' : '#df8a3a');
    flame(fw * 0.55, fh * 0.62, h ? '#d9fff0' : '#f5d27c');
  });
}
function drawMotes(c, dt) {
  c.fillStyle = '#d8def5';
  for (const m of motes) {
    m.x += m.vx * dt; m.y += m.vy * dt + Math.sin(m.x * 0.05) * 0.1;
    if (m.x > W + 5) { m.x = -5; m.y = L.floorY * (0.3 + Math.random() * 0.9); }
    c.globalAlpha = m.a;
    c.beginPath(); c.arc(m.x, m.y, m.r, 0, Math.PI * 2); c.fill();
  }
  c.globalAlpha = 1;
}

// ---------------------------------------------------------------- ghost
let ghostImg = null, booImg = null, ghostId = null;
function svgImage(svg) {
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  return img;
}
function loadGhost() {
  const look = A.ghostLook();
  ghostId = A.ghostSig();
  ghostImg = svgImage(A.ghostSVG(look.skin, false, { noShadow: true, items: look.items }));
  booImg = svgImage(A.ghostSVG(look.skin, false, { noShadow: true, boo: true, items: look.items }));
}
const ghost = { state: 'hidden', t: 0, from: { x: 0, y: 0 }, to: { x: 0, y: 0 }, pos: { x: 0, y: 0 }, miss: false, stunUntil: 0 };
const G_TIMES = { out: 0.16, hold: 0.24, back: 0.34 };
let clock = 0;
const isStunned = () => clock < ghost.stunUntil;
function hiddenPos(time, prox) {
  const moonlit = window.Moonlit?.active;
  return {
    x: L.armorX + L.armorH * ((moonlit ? 0.27 : 0.11) + 0.1 * prox),
    y: L.armorFeet - L.armorH * (moonlit ? 0.73 : 0.64) + Math.sin(time * 2.2) * 2.5 - prox * L.armorH * 0.03,
  };
}
function ghostTo(x, y, miss) {
  ghost.from = { ...ghost.pos };
  ghost.to = { x, y };
  ghost.state = 'out'; ghost.t = 0; ghost.miss = miss;
}
function updateGhost(dt, time, prox) {
  const home = hiddenPos(time, isStunned() ? 0 : prox);
  if (ghost.state === 'hidden') { ghost.pos = home; return; }
  ghost.t += dt;
  const dur = ghost.miss ? { out: 0.12, hold: 0.06, back: 0.22 } : G_TIMES;
  if (ghost.state === 'out') {
    const k = clamp(ghost.t / dur.out, 0, 1);
    ghost.pos = { x: lerp(ghost.from.x, ghost.to.x, easeOutBack(k)), y: lerp(ghost.from.y, ghost.to.y, easeOutBack(k)) };
    if (k >= 1) { ghost.state = 'hold'; ghost.t = 0; }
  } else if (ghost.state === 'hold') {
    ghost.pos = { x: ghost.to.x + Math.sin(ghost.t * 60) * 1.2, y: ghost.to.y };
    if (ghost.t >= dur.hold) { ghost.state = 'back'; ghost.t = 0; }
  } else if (ghost.state === 'back') {
    const k = clamp(ghost.t / dur.back, 0, 1), e = easeInOut(k);
    ghost.pos = { x: lerp(ghost.to.x, home.x, e), y: lerp(ghost.to.y, home.y, e) };
    if (k >= 1) ghost.state = 'hidden';
  }
}
function drawGhost(c, time) {
  if (!ghostImg || !ghostImg.complete) return;
  const out = ghost.state !== 'hidden';
  const w = L.armorH * 0.46, h = w * 1.3;
  let scale = 1, rot = 0.12, img = ghostImg, alpha = 0.96;
  if (out) {
    const k = ghost.state === 'out' ? clamp(ghost.t / 0.16, 0, 1) : ghost.state === 'hold' ? 1 : 1 - clamp(ghost.t / 0.34, 0, 1);
    scale = 1 + (ghost.miss ? 0.05 : 0.2) * k;
    rot = (ghost.to.x < L.armorX ? -0.18 : 0.18) * k + 0.12 * (1 - k);
    img = ghost.state === 'back' ? ghostImg : booImg;
    if (!ghost.miss && ghost.state !== 'back') {
      const R = w * 1.1;
      const g = c.createRadialGradient(ghost.pos.x, ghost.pos.y, 0, ghost.pos.x, ghost.pos.y, R);
      g.addColorStop(0, 'rgba(237,230,216,.16)'); g.addColorStop(1, 'rgba(237,230,216,0)');
      c.fillStyle = g; c.fillRect(ghost.pos.x - R, ghost.pos.y - R, R * 2, R * 2);
    }
  }
  if (isStunned()) { alpha = 0.55; rot += Math.sin(time * 18) * 0.08; }
  c.save();
  c.globalAlpha = alpha;
  c.translate(ghost.pos.x, ghost.pos.y);
  c.rotate(rot);
  c.drawImage(img, -w * scale / 2, -h * scale * 0.577, w * scale, h * scale);
  c.restore();
  if (isStunned()) {
    // dizzy sparks circling the ghost's head
    c.fillStyle = '#e8b25c';
    for (let i = 0; i < 3; i++) {
      const a = time * 5 + (i * Math.PI * 2) / 3;
      sparkle(c, ghost.pos.x + Math.cos(a) * w * 0.4, ghost.pos.y - h * 0.45 + Math.sin(a) * w * 0.12, 3.2);
    }
  }
}

// ---------------------------------------------------------------- visitors
// rarity: 0 Common · 1 Rare · 2 Epic · 3 Legendary (same tiers as cards)
// weight: spawn weight · room: first room they appear in · reward: Frights ×
// zone: timing window × (bigger = easier) · xp: level XP per scare
const KINDS = {
  tourist: { name: 'Tourist', rarity: 0, weight: 50, room: 0, speed: 1, reward: 1, zone: 1, xp: 1,
    desc: 'Just here for the view.' },
  kid: { name: 'Kid', rarity: 0, weight: 24, room: 0, speed: 1.08, reward: 1, zone: 1.5, xp: 1,
    desc: 'Easy to scare. Drops the ice cream.' },
  photographer: { name: 'Photographer', rarity: 1, weight: 9, room: 0, speed: 0.95, reward: 1, zone: 1, xp: 3,
    desc: 'Stops for a photo. Scare mid-shot for a Photobomb ×2.' },
  jogger: { name: 'Jogger', rarity: 1, weight: 8, room: 1, speed: 1.75, reward: 2, zone: 1, xp: 3,
    desc: 'Very fast. Worth ×2.' },
  skeptic: { name: 'Skeptic', rarity: 1, weight: 8, room: 2, speed: 0.8, reward: 2, zone: 1, xp: 3,
    desc: 'Laughs off a Good. Needs Great or better.' },
  police: { name: 'Police', rarity: 2, weight: 0, room: 0, speed: 1.15, reward: 1, zone: 0.7, xp: 6,
    desc: 'Stops to look around, then hurries. Brings gems.' },
  hunter: { name: 'Ghost Hunter', rarity: 2, weight: 5, room: 3, speed: 0.9, reward: 5, zone: 0.85, xp: 8,
    desc: 'Only a Perfect works. Anything else and he zaps your ghost.' },
  royal: { name: 'Royal', rarity: 3, weight: 1.2, room: 4, speed: 0.55, reward: 10, zone: 1, xp: 20,
    desc: 'Needs two scares. Legendary rewards.' },
};
const RARITY_COLORS = ['#a8a3ae', '#74a9f2', '#b392f0', '#eec26a'];
const RARITY_NAMES = ['Common', 'Rare', 'Epic', 'Legendary'];
const ICE = ['#f3b6c8', '#bfe8d2', '#8a5a44', '#f4e2a8'];
const RATING_MULT = [0, 1, 1.5, 3];
let visitors = [];
let beams = [];
let drops = [];
let flash = 0;

function makeVisitor(kind, x, speed) {
  const look = {
    shirt: pick(LOOKS.shirt), pants: pick(LOOKS.pants), skin: pick(LOOKS.skin), hair: pick(LOOKS.hair),
    hat: pick(LOOKS.hat), hatColor: pick(LOOKS.hatColor), acc: pick(LOOKS.acc), bag: pick(LOOKS.bag),
  };
  const per = {
    kid: { shirt: pick(['#e0664f', '#f0b44c', '#6fb3d9', '#a98ad6', '#7cc08a']), hat: pick([null, 'cap', 'propeller']), acc: null, ice: pick(ICE) },
    photographer: { shirt: '#d9d2c2', vest: '#9c8660', hat: pick(['beret', 'sunhat']), acc: null },
    jogger: { shirt: pick(['#e0664f', '#4fa3c9', '#e3b341', '#7fc07a']), pants: '#2b2b30', hat: null, acc: null, band: '#f0ece2', shoes: pick(['#e0664f', '#f0ece2', '#74c3e0']) },
    skeptic: { shirt: '#e6e0d4', vest: pick(['#6b6f7a', '#7a5a4a', '#50606a']), hat: null, acc: null },
    police: { shirt: '#2f3d5c', pants: '#232b3e', hat: 'police', acc: null },
    hunter: { shirt: '#4a5242', pants: '#2a2d28', hat: null, acc: null },
    royal: { shirt: '#5b3a7a', pants: '#3a2650', hat: 'crown', acc: null, hair: pick(['#b8b2a8', '#c9a26b', '#2b2220']) },
  };
  return {
    kind, x, speed, base: speed,
    phase: Math.random() * 6,
    state: 'walk', st: 0, dir: 1,
    helped: false, zapped: false, photoDone: false, flashed: false,
    hp: kind === 'royal' ? 2 : 1,
    stopAt: kind === 'police' ? W * (0.15 + Math.random() * 0.25) : null,
    stopped: false,
    look: Object.assign(look, per[kind] || {}),
  };
}
function zones(st, v) {
  const k = v ? KINDS[v.kind].zone : 1;
  // Perfect starts tight (~1.5% of the width each side) and widens with Steady Hands / cards / ghosts
  const p = Math.min(W * 0.14, W * (0.015 + 0.0022 * Math.max(0, st.perfectPct - 10)) * k);
  const g = p + W * 0.05 * k;
  return { p, g, gd: g + W * 0.06 * k };
}
function discover(kind) {
  const S = A.S;
  S.seen = S.seen || {};
  if (S.seen[kind]) return;
  S.seen[kind] = true;
  A.save();
  const k = KINDS[kind];
  if (k.rarity >= 1) A.toast(`New visitor: ${k.name} · ${RARITY_NAMES[k.rarity]}`, '', 'sparkle');
  A.refresh();
}
function spawn(st) {
  const S = A.S, r = st.room;
  const add = (kind, x = -L.charH * 0.4, speed) => {
    discover(kind);
    visitors.push(makeVisitor(kind, x, speed || L.speed * KINDS[kind].speed));
  };
  if (!S.seenPolice && playTime > 35) { S.seenPolice = true; A.save(); return add('police'); }
  if (!S.seenPhoto && playTime > 14) { S.seenPhoto = true; A.save(); return add('photographer'); }

  const pool = Object.entries(KINDS)
    .filter(([id, k]) => k.room <= r)
    .map(([id, k]) => [id, id === 'police' ? st.policeChance : k.weight]);
  const total = pool.reduce((a, [, w]) => a + w, 0);
  let roll = Math.random() * total, kind = 'tourist';
  for (const [id, w] of pool) { roll -= w; if (roll <= 0) { kind = id; break; } }
  if (kind === 'police') S.seenPolice = true;

  if (kind !== 'tourist' && kind !== 'kid') return add(kind);
  const size = st.groupSize + (isHaunting() ? 1 : 0);
  const speed = L.speed * (0.92 + Math.random() * 0.16);
  for (let i = 0; i < size; i++) {
    const k = i === 0 ? kind : Math.random() < 0.3 ? 'kid' : 'tourist';
    add(k, -L.charH * 0.4 - i * L.charH * 0.46, speed);
  }
}

// ---------------------------------------------------------------- visitor art
function limb(c, x, y, a, len, w, col, hand) {
  const ex = x + Math.sin(a) * len, ey = y + Math.cos(a) * len;
  c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round';
  line(c, x, y, ex, ey);
  if (hand) { c.fillStyle = hand; circle(c, ex, ey, w * 0.55); }
  return { x: ex, y: ey };
}
function leg(c, a, col, low) {
  // two-tone leg (shorts / socks); low = colour below the knee
  const kx = Math.sin(a) * 19, ky = -40 + Math.cos(a) * 19;
  c.lineCap = 'round'; c.lineWidth = 10;
  c.strokeStyle = col; line(c, 0, -40, kx, ky);
  c.strokeStyle = low || col; line(c, kx, ky, Math.sin(a) * 38, -40 + Math.cos(a) * 38);
}
function bentArm(c, a, col, skin) {
  // jogger arm: upper arm swings, forearm bent forward
  const ex = Math.sin(a) * 15, ey = -68 + Math.cos(a) * 15;
  c.strokeStyle = col; c.lineWidth = 7.5; c.lineCap = 'round';
  line(c, 1, -68, ex, ey);
  const fx = ex + Math.sin(a + 1.9) * 14, fy = ey + Math.cos(a + 1.9) * 14;
  c.strokeStyle = skin; c.lineWidth = 6.5; line(c, ex, ey, fx, fy);
  c.fillStyle = skin; circle(c, fx, fy, 3.6);
}
function iceCream(c, x, y, rot, flavor, size = 1) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(size, size);
  c.fillStyle = '#d9a35f';
  c.beginPath(); c.moveTo(-4.5, 0); c.lineTo(4.5, 0); c.lineTo(0, 13); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(120,70,30,.45)'; c.lineWidth = 0.8;
  line(c, -2.5, 2, 2, 8); line(c, 2.5, 2, -2, 8);
  c.fillStyle = flavor; circle(c, 0, -3.5, 5.6);
  c.fillStyle = 'rgba(255,255,255,.35)'; circle(c, -1.8, -5.5, 1.6);
  c.restore();
}
function drawVisitor(c, v, time, original = false) {
  if (window.Moonlit?.active && !original) return Moonlit.visitor(c, v, time, L, KINDS[v.kind].rarity);
  const kind = v.kind, lk = v.look;
  const kid = kind === 'kid';
  const s = (L.charH / 100) * (kid ? 0.66 : 1);
  const scared = v.state === 'scared' || v.state === 'flee';
  const posing = v.state === 'photo';
  const patrol = v.state === 'patrol';
  const startled = v.state === 'startled';
  let jump = 0, squash = 1;
  if (v.state === 'scared' || startled) {
    const dur = startled ? 0.5 : 0.38;
    const k = Math.sin(clamp(v.st / dur, 0, 1) * Math.PI);
    jump = k * (startled ? 12 : kid ? 32 : 26); squash = 1 + k * 0.05;
  }
  const still = v.state === 'scared' || posing || patrol || startled;
  const hop = kid && v.state === 'walk' ? Math.abs(Math.sin(v.phase)) * 6 : 0; // kids skip
  const bob = still ? 0 : hop || Math.abs(Math.sin(v.phase)) * (v.state === 'flee' ? 3 : 2);
  let face = v.state === 'walk' || posing || startled ? 1 : v.dir;
  if (patrol) face = Math.sin(v.st * 5) > 0 ? 1 : -1; // looking around

  // ground shadow + rarity ring
  c.fillStyle = 'rgba(0,0,0,.3)';
  ellipse(c, v.x, L.walkY + 1, 17 * s * (1 - jump / 90), 4 * s);
  const rar = KINDS[kind].rarity;
  if (rar >= 1 && !scared) {
    c.strokeStyle = RARITY_COLORS[rar]; c.globalAlpha = 0.55 + Math.sin(time * 4) * 0.15; c.lineWidth = 1.5;
    c.beginPath(); c.ellipse(v.x, L.walkY + 1, 20 * s, 5 * s, 0, 0, Math.PI * 2); c.stroke();
    c.globalAlpha = 1;
  }

  c.save();
  c.translate(v.x, L.walkY - (jump + bob) * s);
  c.scale(s * face, s * squash);
  if (kind === 'jogger' && v.state === 'walk') c.rotate(0.1);

  const run = v.state === 'flee' || kind === 'jogger';
  const amp = run ? 0.85 : kind === 'royal' ? 0.28 : kid ? 0.6 : 0.5;
  const sw = still ? 0 : Math.sin(v.phase);
  const legA = v.state === 'scared' ? 0.35 : sw * amp;
  const wob = Math.sin(time * 32) * 0.1;
  let backArm = -sw * amp * 0.9, frontArm = sw * amp * 0.9;
  if (scared) { backArm = Math.PI - 0.5 + wob; frontArm = Math.PI + 0.35 - wob; }
  if (posing) { backArm = Math.PI * 0.6; frontArm = Math.PI * 0.62; }
  if (kid && !scared) frontArm = Math.PI * 0.7; // holding the ice cream up
  if (kind === 'royal' && !scared) frontArm = Math.PI * 0.35;
  if (kind === 'hunter' && !scared) frontArm = Math.PI * 0.5;
  const crossed = kind === 'skeptic' && !scared;
  const back = shade(lk.shirt, -0.25);

  // --- behind the body
  if (kind === 'royal') {
    const flow = Math.sin(v.phase * 0.5 + time * 2) * 3;
    c.fillStyle = '#8c2f3c';
    c.beginPath(); c.moveTo(-10, -76); c.quadraticCurveTo(-26 - flow, -40, -30 - flow, -2); c.lineTo(4, -2); c.lineTo(8, -74); c.closePath(); c.fill();
    c.strokeStyle = '#d6ae5c'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(-30 - flow, -2); c.lineTo(4, -2); c.stroke();
  }
  if (lk.acc === 'backpack') { c.fillStyle = lk.bag; rr(c, -23, -75, 11, 29, 4); c.fill(); }
  if (kind === 'hunter') {
    c.fillStyle = '#4a4f45'; rr(c, -28, -82, 16, 38, 3); c.fill();
    c.fillStyle = '#5c6256'; rr(c, -26, -76, 12, 6, 2); c.fill();
    c.strokeStyle = '#6a7064'; c.lineWidth = 1.6; line(c, -22, -82, -25, -101);
    c.fillStyle = Math.sin(time * 6) > 0 ? '#e6776a' : '#9fe3c6'; circle(c, -25, -102, 2.4);
    c.strokeStyle = '#2f332c'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-14, -50); c.quadraticCurveTo(-4, -30, 12, -55); c.stroke();
  }
  if (!crossed) {
    if (kind === 'jogger' && !scared) bentArm(c, backArm, back, shade(lk.skin, -0.12));
    else limb(c, -1, -68, backArm, kid ? 24 : 29, 7.5, back, shade(lk.skin, -0.12));
  }
  // legs
  const lowBack = kind === 'jogger' ? shade(lk.skin, -0.12) : shade(lk.pants, -0.3);
  const lowFront = kind === 'jogger' ? lk.skin : lk.pants;
  c.save(); if (kid) c.scale(1, 0.85);
  leg(c, -legA, shade(lk.pants, -0.3), lowBack);
  leg(c, legA, lk.pants, lowFront);
  if (kind === 'jogger') {
    c.fillStyle = lk.shoes;
    for (const a of [-legA, legA]) { rr(c, Math.sin(a) * 38 - 4, -40 + Math.cos(a) * 38 - 3, 11, 5, 2.5); c.fill(); }
  }
  c.restore();

  // --- body
  const bodyTop = kid ? -70 : -77, bodyH = kid ? 34 : 41;
  if (kind === 'royal') {
    c.fillStyle = lk.shirt; rr(c, -15, -77, 30, 60, 10); c.fill(); // long robe
    c.fillStyle = '#d6ae5c'; rr(c, -15, -50, 30, 4, 2); c.fill();
    c.fillStyle = '#f2ece0'; ellipse(c, 0, -76, 15, 5);
    c.fillStyle = '#2a2530'; for (let i = -10; i <= 10; i += 5) circle(c, i, -76, 0.9);
  } else if (kind === 'hunter') {
    c.fillStyle = lk.shirt; rr(c, -14, -77, 28, 54, 8); c.fill(); // long coat
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; line(c, 2, -70, 2, -24);
  } else {
    c.fillStyle = lk.shirt; rr(c, -14, bodyTop, 28, bodyH, 10); c.fill();
  }
  if (lk.vest) {
    c.fillStyle = lk.vest; rr(c, -14, -72, 28, 32, 6); c.fill();
    if (kind === 'photographer') {
      c.fillStyle = shade(lk.vest, -0.2); rr(c, 2, -62, 8, 7, 1.5); c.fill(); rr(c, -9, -62, 8, 7, 1.5); c.fill();
    } else {
      c.strokeStyle = shade(lk.vest, -0.25); c.lineWidth = 1;
      for (let y = -66; y < -42; y += 6) line(c, -12, y, 12, y + 3);
    }
  }
  if (kind === 'police') {
    c.fillStyle = '#1c2438'; rr(c, -14, -46, 28, 4, 1.5); c.fill();
    c.fillStyle = '#d8b25a'; circle(c, 7, -66, 2.4);
    c.fillStyle = '#15171d'; rr(c, -16, -46, 4, 16, 2); c.fill(); // baton
  }
  c.fillStyle = 'rgba(0,0,0,.12)'; rr(c, 2, bodyTop, 12, bodyH, 8); c.fill();

  // --- head (kids get a bigger head)
  const hs = kid ? 1.22 : 1;
  c.save();
  c.translate(0, kid ? -72 : -79);
  c.scale(hs, hs);
  c.translate(0, -9);
  const hy = 0; // head centre in local space
  c.fillStyle = lk.hair; circle(c, 0, hy - 3, 13.5);
  c.fillStyle = lk.skin; circle(c, 2.5, hy, 12);
  if (kid) { c.fillStyle = 'rgba(230,120,120,.3)'; circle(c, 8, hy + 4, 2.6); }
  if (scared) {
    c.fillStyle = '#fff'; circle(c, 8.6, hy - 3, 3.4);
    c.fillStyle = '#1d1a20'; circle(c, 9.4, hy - 3, 1.5);
    c.fillStyle = '#3a1f22'; ellipse(c, 10, hy + 6, 2.2, kid ? 4 : 3.2);
    if (kid) { // tears
      c.fillStyle = '#9cc9f0';
      const t = (time * 3) % 1;
      ellipse(c, 6 - t * 3, hy + 1 + t * 10, 1.4, 2);
    }
  } else if (startled) {
    c.fillStyle = '#fff'; circle(c, 8.6, hy - 3, 2.8);
    c.fillStyle = '#1d1a20'; circle(c, 9.2, hy - 3, 1.3);
    c.strokeStyle = '#3a1f22'; c.lineWidth = 1.4; line(c, 7.5, hy + 5, 11.5, hy + 5);
  } else {
    c.fillStyle = '#1d1a20'; circle(c, 9, hy - 2, 1.7);
    c.strokeStyle = 'rgba(40,20,20,.55)'; c.lineWidth = 1.2;
    if (kind === 'skeptic') { line(c, 7.5, hy + 5, 11.5, hy + 3.5); line(c, 6, hy - 6.5, 11.5, hy - 5.5); } // smirk + flat brow
    else if (kid) { c.beginPath(); c.arc(9.5, hy + 3.5, 2.2, 0.2, Math.PI - 0.2); c.stroke(); }
    else line(c, 8, hy + 4.5, 11, hy + 4.5);
  }
  // headwear
  const hat = lk.hat;
  if (hat === 'cap') {
    c.fillStyle = lk.hatColor; c.beginPath(); c.arc(1, hy - 4, 13.8, Math.PI, 0); c.fill();
    rr(c, 6, hy - 6, 13, 3.2, 1.5); c.fill();
  } else if (hat === 'propeller') {
    c.fillStyle = '#e0664f'; c.beginPath(); c.arc(1, hy - 4, 13.8, Math.PI, Math.PI * 1.5); c.lineTo(1, hy - 4); c.fill();
    c.fillStyle = '#f0b44c'; c.beginPath(); c.arc(1, hy - 4, 13.8, Math.PI * 1.5, 0); c.lineTo(1, hy - 4); c.fill();
    c.strokeStyle = '#2a2a30'; c.lineWidth = 1.2; line(c, 1, hy - 18, 1, hy - 21);
    const p = Math.sin(time * 25) * 9;
    c.fillStyle = '#74c3e0'; ellipse(c, 1, hy - 21.5, Math.abs(p) + 1, 1.6);
  } else if (hat === 'sunhat') {
    c.fillStyle = lk.hatColor; ellipse(c, 1, hy - 8, 21, 4.2); ellipse(c, 1, hy - 11.5, 11, 7);
    c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(-10, hy - 10, 22, 2.5);
  } else if (hat === 'beret') {
    c.fillStyle = '#2b2b30'; ellipse(c, -1, hy - 11, 14, 5.5, -0.15); circle(c, -1, hy - 16, 1.6);
  } else if (hat === 'police') {
    c.fillStyle = '#1f2536'; ellipse(c, 1, hy - 11, 12.5, 15.5);
    rr(c, -13, hy - 3.5, 28, 3.2, 1.5); c.fill();
    c.fillStyle = '#d8b25a'; circle(c, 9, hy - 11, 2.6);
  } else if (hat === 'crown') {
    const pop = startled ? -Math.sin(clamp(v.st / 0.5, 0, 1) * Math.PI) * 10 : 0;
    c.fillStyle = '#e8b25c';
    c.beginPath();
    c.moveTo(-10, hy - 12 + pop); c.lineTo(-11, hy - 22 + pop); c.lineTo(-5, hy - 17 + pop); c.lineTo(1, hy - 25 + pop);
    c.lineTo(7, hy - 17 + pop); c.lineTo(13, hy - 22 + pop); c.lineTo(12, hy - 12 + pop); c.closePath(); c.fill();
    c.fillStyle = '#c9675a'; circle(c, 1, hy - 16 + pop, 1.8);
  }
  if (kind === 'jogger') { c.fillStyle = lk.band; rr(c, -12.5, hy - 9, 27, 4, 2); c.fill(); }
  if (kind === 'skeptic') {
    c.strokeStyle = '#1d1a20'; c.lineWidth = 1.3;
    c.beginPath(); c.arc(9, hy - 2, 3.4, 0, Math.PI * 2); c.stroke();
    line(c, 5.6, hy - 2.5, -3, hy - 4);
  }
  if (kind === 'hunter') {
    c.strokeStyle = '#2a2a30'; c.lineWidth = 2.5; line(c, -12, hy - 6, 12, hy - 6);
    c.fillStyle = '#2a2a30'; circle(c, 9.5, hy - 6, 4.4);
    c.fillStyle = 'rgba(159,227,198,.85)'; circle(c, 9.5, hy - 6, 3);
  }
  c.restore();

  // --- accessories in front
  if (lk.acc === 'camera' && kind === 'tourist') {
    c.strokeStyle = '#2a2a30'; c.lineWidth = 1.4; line(c, -6, -75, 7, -59);
    c.fillStyle = '#2a2a30'; rr(c, 4, -63, 11, 8, 2); c.fill();
    c.fillStyle = '#55555f'; circle(c, 12.5, -59, 2.4);
  }
  if (kind === 'photographer' && !posing) {
    c.strokeStyle = '#2a2a30'; c.lineWidth = 1.4; line(c, -6, -75, 6, -60);
    c.fillStyle = '#2a2a30'; rr(c, 3, -64, 14, 10, 2); c.fill();
    c.fillStyle = '#55555f'; rr(c, 16, -62, 7, 7, 2); c.fill();
  }
  if (crossed) {
    c.fillStyle = shade(lk.vest || lk.shirt, -0.1); rr(c, -9, -66, 25, 8, 4); c.fill();
    c.fillStyle = lk.skin; circle(c, 15, -62, 3.6);
  } else if (kind === 'jogger' && !scared) {
    bentArm(c, frontArm, lk.shirt, lk.skin);
  } else {
    const hand = limb(c, 1, -68 + (kid ? 4 : 0), frontArm, kid ? 24 : 29, 7.5, kind === 'royal' ? lk.shirt : lk.shirt, lk.skin);
    if (kid && !scared && !v.dropped) iceCream(c, hand.x, hand.y - 4, 0.15, lk.ice, 1.5);
    if (kind === 'royal' && !scared) {
      c.strokeStyle = '#d6ae5c'; c.lineWidth = 2.2; line(c, hand.x, hand.y + 6, hand.x + 3, hand.y - 22);
      c.fillStyle = '#e8b25c'; circle(c, hand.x + 3, hand.y - 24, 3.4);
    }
    if (kind === 'hunter' && !scared) {
      c.fillStyle = '#2a2d28'; rr(c, hand.x - 2, hand.y - 6, 10, 8, 2); c.fill();
      c.fillStyle = Math.sin(time * 10) > -0.3 ? '#9fe3c6' : '#4a7a66'; rr(c, hand.x, hand.y - 4.5, 6, 4, 1); c.fill();
    }
  }
  if (posing) {
    c.fillStyle = '#2a2a30'; rr(c, 12, -99, 14, 11, 2); c.fill();
    c.fillStyle = '#55555f'; rr(c, 25, -97, 7, 7, 2); c.fill();
  }
  if (kind === 'jogger' && v.state === 'walk' && Math.sin(time * 3 + v.phase) > 0.7) {
    c.fillStyle = '#9cc9f0'; ellipse(c, -10, -100, 1.5, 2.3);
  }
  c.restore();

  // rarity gem above rare+ visitors
  if (rar >= 1 && !scared) {
    const gy = L.walkY - (jump + bob + (kid ? 116 : 126)) * s + Math.sin(time * 3 + v.phase) * 1.5;
    c.fillStyle = RARITY_COLORS[rar];
    c.beginPath(); c.moveTo(v.x, gy - 5); c.lineTo(v.x + 3.5, gy); c.lineTo(v.x, gy + 5); c.lineTo(v.x - 3.5, gy); c.closePath(); c.fill();
    if (rar === 3) { c.globalAlpha = 0.6; sparkle(c, v.x + 8, gy - 4 + Math.sin(time * 5) * 2, 2.5); c.globalAlpha = 1; }
  }
  if ((scared && (v.state === 'scared' || v.st < 0.5)) || startled) {
    c.fillStyle = '#e8b25c';
    c.font = `700 ${Math.round(18 * s * 3) / 3}px 'DM Sans', sans-serif`;
    c.textAlign = 'center';
    c.fillText(startled ? '?!' : '!', v.x + 2 * s * face, L.walkY - (jump + bob + (kid ? 116 : 124)) * s);
  }
}

function dropIceCream(v) {
  v.dropped = true;
  const s = (L.charH / 100) * 0.66;
  drops.push({ x: v.x + 16 * s, y: L.walkY - 80 * s, vx: 30 + Math.random() * 30, vy: -120, rot: 0.15, vr: 6, flavor: v.look.ice, state: 'fall', t: 0 });
}
function updateDrops(dt) {
  for (const d of drops) {
    d.t += dt;
    if (d.state === 'fall') {
      d.vy += H * 3.2 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.rot += d.vr * dt;
      if (d.y >= L.walkY - 2) { d.y = L.walkY - 2; d.state = 'splat'; d.t = 0; A.sfx.splat(); }
    }
  }
  drops = drops.filter(d => d.state === 'fall' || d.t < 6);
}
function drawDrops(c) {
  for (const d of drops) {
    if (d.state === 'fall') { iceCream(c, d.x, d.y, d.rot, d.flavor); continue; }
    const a = d.t > 5 ? 1 - (d.t - 5) : 1;         // melts away after 5 s
    const grow = Math.min(1, d.t * 6) * 1.5;
    c.save(); c.globalAlpha = a;
    c.fillStyle = d.flavor;
    ellipse(c, d.x, d.y + 2, 9 * grow, 3 * grow);
    ellipse(c, d.x - 7 * grow, d.y + 3, 3.2 * grow, 1.6 * grow);
    ellipse(c, d.x + 8 * grow, d.y + 2.5, 2.6 * grow, 1.3 * grow);
    c.fillStyle = 'rgba(255,255,255,.3)'; ellipse(c, d.x - 2, d.y + 1, 3 * grow, 1 * grow);
    iceCream(c, d.x + 5, d.y - 1, 1.9, 'rgba(0,0,0,0)');
    c.restore();
  }
}

// ---------------------------------------------------------------- scoring, fear + feedback
let combo = 0, fear = 0, hauntUntil = 0;
let playTime = 0, nextSpawn = 1.2, helperReadyAt = 0, started = false, visibleTab = true;
const isHaunting = () => clock < hauntUntil;
const HAUNT_TIME = 12;

function showRating(x, y, o) {
  if (!visibleTab) return;
  const p = sceneToApp(x, y);
  const el = document.createElement('div');
  el.className = `rating ${o.cls || ''}`;
  el.innerHTML = `<b>${o.title}</b>` +
    (o.sub ? `<em style="color:${o.subColor}">${o.sub}</em>` : '') +
    (o.amount ? `<span>+${A.fmt(o.amount)}</span>` : '') +
    (o.gems ? `<span class="gem">+${o.gems} gem${o.gems > 1 ? 's' : ''}</span>` : '');
  el.style.left = p.x + 'px'; el.style.top = p.y + 'px';
  fxLayer.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}
const RATING_LABEL = r => ({ title: ['Miss', 'Good', 'Great', 'Perfect'][r], cls: `r${r}` });
function flyOrb(kind, x, y, amount, delay) {
  if (!visibleTab) { A.gain(kind, amount); return; }
  const from = sceneToApp(x, y);
  const to = relToApp($(kind === 'gems' ? '#cur-gems .cur-icon' : '#cur-frights .cur-icon'));
  const o = document.createElement('div');
  o.className = 'orb' + (kind === 'gems' ? ' gem' : '');
  fxLayer.appendChild(o);
  const mx = lerp(from.x, to.x, 0.35) + (Math.random() - 0.5) * 70;
  const my = Math.min(from.y, to.y) + (from.y - to.y) * 0.25;
  const anim = o.animate([
    { transform: `translate(${from.x}px, ${from.y}px) scale(.3)`, opacity: 0 },
    { transform: `translate(${from.x}px, ${from.y - 16}px) scale(1.15)`, opacity: 1, offset: 0.18 },
    { transform: `translate(${mx}px, ${my}px) scale(1)`, offset: 0.55 },
    { transform: `translate(${to.x}px, ${to.y}px) scale(.5)`, opacity: 0.9 },
  ], { duration: 760, delay, easing: 'cubic-bezier(.45, 0, .35, 1)', fill: 'both' });
  anim.onfinish = () => {
    o.remove();
    A.gain(kind, amount);
    A.sfx.coin();
    A.updateUpgrades(); A.updateBadges();
  };
}
function addFear(v) {
  if (isHaunting() || !started) return;
  fear = Math.min(100, fear + v * 0.5 * (A.stats().fearMult || 1)); // half speed; Phial of Terror doubles it
  if (fear >= 100) startHaunt();
}
function startHaunt() {
  fear = 0;
  hauntUntil = clock + HAUNT_TIME;
  nextSpawn = Math.min(nextSpawn, 0.3);
  sceneEl.classList.add('haunting');
  showRating(W / 2, H * 0.5, { title: 'Haunting Hour!', cls: 'special big', sub: 'More visitors · ×2 Frights', subColor: 'var(--text-2)' });
  A.sfx.rarity(3); A.vibe([20, 40, 20]);
  A.retrigger(sceneEl, 'shake');
  A.quest('haunt');
}
function zap(v) {
  v.artActionUntil = performance.now() / 1000 + 0.65;
  v.zapped = true;
  ghost.stunUntil = clock + 2.5;
  if (ghost.state !== 'hidden') { ghost.state = 'back'; ghost.t = 0; ghost.to = { ...ghost.pos }; }
  beams.push({ x: v.x - L.charH * 0.2, y: L.walkY - L.charH * 0.95, t: 0 });
  if (combo > 0) { combo = 0; A.retrigger($('#combo-pill'), 'nudge'); }
  fear = Math.max(0, fear - 25);
  showRating(L.armorX, L.armorFeet - L.armorH * 0.95, { title: 'Zapped!', cls: 'bad' });
  A.sfx.zap(); A.vibe([30, 30, 30]);
  A.retrigger(sceneEl, 'shake');
}

function payout(v, r, st, bonus, extra = 1) {
  let amount = st.base * st.mult * RATING_MULT[r] * (1 + bonus) * KINDS[v.kind].reward * extra * (isHaunting() ? 2 : 1);
  if (st.doubleChance && Math.random() * 100 < st.doubleChance) amount *= 2;
  amount = Math.max(1, Math.round(amount));
  let gems = 0;
  if (v.kind === 'police') gems = Math.max(1, Math.round((1 + Math.floor(Math.random() * 3) + st.gemBonus) * st.gemMult));
  if (v.kind === 'hunter') gems += 2;
  if (v.kind === 'royal') gems += 5;
  return { amount, gems };
}
function sendRewards(v, amount, gems, r, i) {
  const hy = L.walkY - L.charH * 0.8;
  const orbs = r === 3 ? 2 : 1;
  for (let k = 0; k < orbs; k++) {
    const part = k === orbs - 1 ? amount - Math.floor(amount / orbs) * (orbs - 1) : Math.floor(amount / orbs);
    flyOrb('frights', v.x, hy, part, 140 + i * 70 + k * 90);
  }
  if (gems) flyOrb('gems', v.x, hy, gems, 260 + i * 70);
}
function scare(v, dirFromArmor, countsForQuests = true) {
  v.state = 'scared'; v.st = 0;
  v.dir = dirFromArmor ? (v.x < L.armorX ? -1 : 1) : 1;
  if (v.kind === 'kid' && !v.dropped) {
    dropIceCream(v);
    if (countsForQuests) A.quest('kid');
  }
}
const tappable = v => v.state === 'walk' || v.state === 'photo' || v.state === 'patrol' || v.state === 'startled';

function tap() {
  if (!started) return;
  if (isStunned()) {
    showRating(L.armorX, L.armorFeet - L.armorH * 0.95, { title: 'Stunned', cls: 'r0 small' });
    A.sfx.whiff();
    return;
  }
  if (ghost.state === 'out' || ghost.state === 'hold') return;
  const st = A.stats();
  const hits = [];
  for (const v of visitors) {
    if (!tappable(v)) continue;
    if (v.state === 'photo') { hits.push({ v, d: 0, r: 3, photo: true }); continue; }
    const z = zones(st, v), d = Math.abs(v.x - L.armorX);
    if (d <= z.gd) hits.push({ v, d, r: d <= z.p ? 3 : d <= z.g ? 2 : 1 });
  }

  if (!hits.length) {
    ghostTo(L.armorX + L.armorH * 0.05, L.walkY - L.charH * 1.05, true);
    A.sfx.whiff(); A.vibe(6);
    if (combo > 0) { combo = 0; A.retrigger($('#combo-pill'), 'nudge'); }
    showRating(L.armorX, L.walkY - H * 0.02, { title: 'Miss', cls: 'r0 small' });
    return;
  }

  hits.sort((a, b) => a.d - b.d);
  if (st.autoPerfect) for (const h of hits) if (h.r < 3 && Math.random() * 100 < st.autoPerfect) h.r = 3;

  const lead = hits[0].v;
  const side = lead.x < L.armorX ? 1 : -1;
  ghostTo(lead.x + side * L.charH * 0.55, L.walkY - L.charH * 1.0, false);
  A.sfx.boo();

  // resolve each visitor by type
  const ok = [];
  let label = null, resisted = false, fearBonus = 0;
  for (const h of hits) {
    const v = h.v, k = v.kind;
    if (k === 'hunter' && h.r < 3) { zap(v); resisted = true; label = label || { title: 'Resisted!', cls: 'bad' }; continue; }
    if (k === 'skeptic' && h.r < 2) { v.artActionUntil = performance.now() / 1000 + 0.65; label = label || { title: 'Unimpressed', cls: 'r0' }; continue; }
    if (k === 'royal') {
      if (h.r < 2) { v.artActionUntil = performance.now() / 1000 + 0.65; label = label || { title: 'Not amused', cls: 'r0' }; continue; }
      if (v.hp > 1) {
        v.hp--; v.state = 'startled'; v.st = 0;
        label = label || { title: 'Startled!', cls: 'special', sub: 'Once more!', subColor: RARITY_COLORS[3] };
        fearBonus += 8;
        continue;
      }
    }
    ok.push(h);
  }
  if (ok.length) {
    const best = Math.max(...ok.map(h => h.r));
    if (best === 3 && !resisted) { combo++; A.retrigger($('#scene-combo'), 'pop'); }
    const bonus = Math.min(100, combo * st.comboStep) / 100;
    let total = 0, totalGems = 0, xp = 0;
    ok.forEach((h, i) => {
      const { amount, gems } = payout(h.v, h.r, st, bonus, h.photo ? 2 : 1);
      total += amount; totalGems += gems;
      xp += Math.round(KINDS[h.v.kind].xp * [0, 1, 1.5, 2][h.r]);
      scare(h.v, true);
      sendRewards(h.v, amount, gems, h.r, i);
      setTimeout(() => A.sfx.yelp(h.v.kind === 'kid' ? 1.4 : 0.85 + Math.random() * 0.4), 60 + i * 45);
      const k = h.v.kind;
      if (k !== 'tourist' && k !== 'kid') A.quest(k);
      if (h.photo) A.quest('photo');
      fearBonus += KINDS[k].rarity * 6;
    });
    const photo = ok.some(h => h.photo);
    const leadOk = ok[0].v;
    const rar = KINDS[leadOk.kind].rarity;
    if (!label || leadOk === lead) label = photo ? { title: 'Photobomb!', cls: 'special' } : RATING_LABEL(best);
    if (rar >= 1 && !label.sub) { label.sub = `${RARITY_NAMES[rar]} · ${KINDS[leadOk.kind].name}`; label.subColor = RARITY_COLORS[rar]; }
    showRating(lead.x + side * L.charH * 0.3, L.walkY - L.charH * 1.0 - L.armorH * 0.3, { ...label, amount: total, gems: totalGems });
    setTimeout(() => A.sfx.rating(best), 70);
    A.vibe(best === 3 ? [12, 30, 18] : 10);
    if (best === 3) A.retrigger(sceneEl, 'shake');
    A.addXp(xp);
    addFear(fearBonus + (photo ? 12 : 0) + [0, 2, 5, 9][best] + (ok.length - 1) * 2);
    A.quest('scare', ok.length);
    A.quest('perfect', ok.filter(h => h.r === 3).length);
    A.quest('combo', combo);
    A.quest('group', ok.length);
  } else {
    showRating(lead.x + side * L.charH * 0.3, L.walkY - L.charH * 1.0 - L.armorH * 0.3, label);
    if (fearBonus) addFear(fearBonus);
    if (!resisted && !fearBonus && combo > 0) { combo = 0; A.retrigger($('#combo-pill'), 'nudge'); }
  }
  if (!A.S.tutorialDone) { A.S.tutorialDone = true; A.save(); }
}

function helperScare(v, st) {
  v.helped = true;
  if (['hunter', 'skeptic', 'royal'].includes(v.kind)) return; // too tough for the helper
  const { amount, gems } = payout(v, 1, st, 0);
  scare(v, false, false);
  sendRewards(v, amount, gems, 1, 0);
  A.addXp(KINDS[v.kind].xp);
  if (visibleTab) { showRating(v.x, L.walkY - L.charH * 1.1, { title: 'Good', cls: 'r1 small', amount, gems }); A.sfx.yelp(0.7); }
}

function runHelper(st) {
  if (!st.helper || clock < helperReadyAt) return;
  const missed = visitors
    .filter(v => v.state === 'walk' && !v.helped && !['hunter', 'skeptic', 'royal'].includes(v.kind) && v.x > L.armorX + zones(st, v).gd)
    .sort((a, b) => b.x - a.x)
    .slice(0, st.helperCount);
  if (!missed.length) return;
  if (combo > 0) {
    combo = 0;
    A.retrigger($('#combo-pill'), 'nudge');
  }
  missed.forEach(v => helperScare(v, st));
  helperReadyAt = clock + st.helperCooldown;
}

// ---------------------------------------------------------------- loop
let lastStats = null;
function update(dt, time) {
  const st = A.stats();
  playTime += dt;
  nextSpawn -= dt;
  if (nextSpawn <= 0) { spawn(st); nextSpawn = st.interval / (isHaunting() ? 3 : 1); }
  if (!isHaunting() && sceneEl.classList.contains('haunting')) sceneEl.classList.remove('haunting');

  let nearest = Infinity;
  for (const v of visitors) {
    if (v.state === 'walk') {
      v.x += v.speed * dt;
      v.phase += dt * v.speed / (L.charH * (v.kind === 'kid' ? 0.08 : 0.11));
      const d = Math.abs(v.x - L.armorX);
      if (d < nearest) nearest = d;
      if (v.kind === 'photographer' && !v.photoDone && v.x >= L.armorX - W * 0.012) { v.state = 'photo'; v.st = 0; }
      if (v.kind === 'police' && !v.stopped && v.x >= v.stopAt) { v.state = 'patrol'; v.st = 0; v.stopped = true; }
      if (v.kind === 'hunter' && !v.zapped && v.x > L.armorX + zones(st, v).gd) zap(v);
      if (v.x > W + L.charH * 0.5) {
        v.dead = true;
        if (visibleTab && combo > 0 && v.kind !== 'hunter') {
          combo = 0;
          A.retrigger($('#combo-pill'), 'nudge');
          showRating(W - 40, L.walkY - L.charH * 1.1, { title: 'Missed', cls: 'r0 small' });
        }
      }
    } else if (v.state === 'photo') {
      v.st += dt; nearest = 0;
      if (v.st >= 1.0 && !v.flashed) { v.flashed = true; flash = 1; A.sfx.shutter(); }
      if (v.st >= 1.6) { v.state = 'walk'; v.photoDone = true; }
    } else if (v.state === 'patrol') {
      v.st += dt;
      if (v.st >= 1.3) { v.state = 'walk'; v.speed = v.base * 1.4; } // hurries on after looking around
    } else if (v.state === 'startled') {
      v.st += dt;
      if (v.st >= 0.5) { v.state = 'walk'; v.st = 0; }
    } else if (v.state === 'scared') {
      v.st += dt;
      if (v.st > 0.38) { v.state = 'flee'; v.st = 0; }
    } else {
      v.st += dt;
      v.x += v.dir * v.base * 3.3 * dt;
      v.phase += dt * v.base * 3.3 / (L.charH * 0.11);
      if (v.x < -L.charH || v.x > W + L.charH) v.dead = true;
    }
  }
  runHelper(st);
  visitors = visitors.filter(v => !v.dead);
  for (const b of beams) b.t += dt;
  beams = beams.filter(b => b.t < 0.4);
  updateDrops(dt);
  flash = Math.max(0, flash - dt * 4);
  const z = zones(st);
  const prox = nearest === Infinity ? 0 : clamp(1 - nearest / (z.gd * 2.2), 0, 1);
  updateGhost(dt, time, prox);
  lastStats = st;
}

function drawZone(c, st, time) {
  const z = zones(st);
  const x = L.armorX, y = L.walkY;
  let hot = 0;
  for (const v of visitors) {
    if (v.state === 'photo' || (tappable(v) && Math.abs(v.x - x) <= zones(st, v).p)) hot = 1;
  }
  const col = isHaunting() ? '159,227,198' : '232,178,92';
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = `rgba(${col},.045)`; ellipse(c, x, y, z.gd, H * 0.05);
  c.fillStyle = `rgba(${col},.06)`; ellipse(c, x, y, z.g, H * 0.04);
  const a = 0.2 + hot * 0.28 + Math.sin(time * 4) * 0.03;
  const g = c.createRadialGradient(x, y, 0, x, y, z.p * 1.6);
  g.addColorStop(0, `rgba(${col},${a + 0.15})`);
  g.addColorStop(0.6, `rgba(${col},${a})`);
  g.addColorStop(1, `rgba(${col},0)`);
  c.fillStyle = g;
  c.save(); c.translate(x, y); c.scale(1, (H * 0.032) / (z.p * 1.6)); c.beginPath(); c.arc(0, 0, z.p * 1.6, 0, Math.PI * 2); c.fill(); c.restore();
  c.restore();
}
function drawBeams(c) {
  for (const b of beams) {
    const tx = ghost.pos.x, ty = ghost.pos.y;
    c.save();
    c.globalAlpha = 1 - b.t / 0.4;
    c.strokeStyle = '#e6776a'; c.lineWidth = 3; c.shadowColor = '#e6776a'; c.shadowBlur = 12;
    c.beginPath(); c.moveTo(b.x, b.y);
    const n = 7;
    for (let i = 1; i < n; i++) {
      const k = i / n;
      c.lineTo(lerp(b.x, tx, k) + (Math.random() - 0.5) * 10, lerp(b.y, ty, k) + (Math.random() - 0.5) * 10);
    }
    c.lineTo(tx, ty); c.stroke();
    c.restore();
  }
}

function draw(time, dt) {
  if (!layers) return;
  const c = ctx;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, W, H);
  c.drawImage(layers.bg.cv, 0, 0, W, H);
  if (isHaunting()) {
    c.save(); c.globalCompositeOperation = 'lighter';
    c.fillStyle = `rgba(80,200,160,${0.05 + Math.sin(time * 3) * 0.015})`; c.fillRect(0, 0, W, H);
    c.restore();
  }
  drawTorches(c, time);
  if (window.Moonlit?.active) Moonlit.atmosphere(c, time, W, H, L);
  drawMotes(c, dt);
  if (ghost.state === 'hidden') drawGhost(c, time);
  c.drawImage(layers.armor.cv, 0, 0, W, H);
  if (started) drawZone(c, lastStats || A.stats(), time);
  drawDrops(c);
  const sorted = visitors.slice().sort((a, b) => (a.state === 'walk') - (b.state === 'walk'));
  for (const v of sorted) drawVisitor(c, v, time);
  if (ghost.state !== 'hidden') drawGhost(c, time);
  drawBeams(c);
  if (flash > 0) { c.fillStyle = `rgba(255,252,240,${flash * 0.35})`; c.fillRect(0, 0, W, H); }
  c.drawImage(layers.vignette.cv, 0, 0, W, H);
  if (window.Moonlit?.active) Moonlit.foreground(c, time, W, H);
}

// portrait for the visitor guide (rendered once per kind)
const portraits = {};
function portrait(kind) {
  const key = `${window.Moonlit?.active ? 'moonlit' : 'original'}:${kind}`;
  if (portraits[key]) return portraits[key];
  const cv = document.createElement('canvas');
  cv.width = 120; cv.height = 150;
  const c = cv.getContext('2d');
  c.scale(2, 2);
  const saved = { charH: L.charH, walkY: L.walkY };
  L.charH = kind === 'kid' ? 74 : 52; L.walkY = 70;
  const v = makeVisitor(kind, 30, 0);
  v.phase = 0.9;
  drawVisitor(c, v, 0.3);
  Object.assign(L, saved);
  return (portraits[key] = cv.toDataURL());
}

// ---------------------------------------------------------------- HUD
const hud = { timer: '', combo: -1, tutorial: null, fear: -1, haunt: '' };
function updateHud(st) {
  const t = started ? `${Math.max(1, Math.ceil(nextSpawn))}s` : '–';
  if (t !== hud.timer) { hud.timer = t; $('#scene-rate').textContent = t; }
  const tut = started && !A.S.tutorialDone;
  if (tut !== hud.tutorial) { hud.tutorial = tut; $('#tutorial').classList.toggle('show', tut); }
  if (combo !== hud.combo) {
    hud.combo = combo;
    $('#combo-pill').classList.toggle('show', combo >= 2 && !tut);
    if (combo >= 2) {
      $('#scene-combo').textContent = `×${combo}`;
      $('#scene-combo-bonus').textContent = `+${Math.min(100, combo * st.comboStep)}%`;
    }
  }
  const haunting = isHaunting();
  const f = haunting ? (hauntUntil - clock) / HAUNT_TIME : fear / 100;
  if (Math.abs(f - hud.fear) > 0.004) {
    hud.fear = f;
    $('#fear .fear-bar i').style.setProperty('--p', f.toFixed(3));
    $('#fear').classList.toggle('full', haunting);
  }
  const hs = haunting ? `Haunting Hour · ${Math.ceil(hauntUntil - clock)}s` : '';
  if (hs !== hud.haunt) {
    hud.haunt = hs;
    const pill = $('#haunt-btn');
    pill.classList.toggle('show', !!hs);
    pill.classList.toggle('running', haunting);
    if (hs) $('#haunt-label').textContent = hs;
  }
}

// ---------------------------------------------------------------- run
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const time = now / 1000;
  const running = started && !document.hidden && (visibleTab || A.S.shop.helper);
  if (running) { clock += dt; update(dt, time); }
  else updateGhost(dt, time, 0);
  if (visibleTab) {
    if (builtRoom !== A.S.currentRoom) buildLayers();
    draw(time, dt);
    updateHud(lastStats || A.stats());
  }
  requestAnimationFrame(frame);
}

function offlineEarnings() {
  const S = A.S;
  if (!S.shop.night || !S.lastSeen) return;
  const secs = Math.min(7200, (Date.now() - S.lastSeen) / 1000);
  if (secs < 30) return;
  const st = A.stats();
  const amount = Math.floor((secs / st.interval) * st.groupSize * st.base * st.mult * 0.5);
  if (amount <= 0) return;
  A.gain('frights', amount);
  A.toast(`Night shift earned ${A.fmt(amount)} Frights`, '', 'moon');
}

// input
sceneEl.addEventListener('pointerdown', e => {
  e.preventDefault();
  const r = sceneEl.getBoundingClientRect();
  const x = e.clientX - r.left, y = e.clientY - r.top;
  const ring = document.createElement('span');
  ring.className = 'tap-ring';
  ring.style.left = x + 'px'; ring.style.top = y + 'px';
  sceneEl.appendChild(ring);
  ring.addEventListener('animationend', () => ring.remove());
  tap();
});
window.addEventListener('keydown', e => {
  if (e.target.closest('button, input, select, textarea, [role="button"]')) return;
  if (!visibleTab || !started) return;
  if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); tap(); }
});
window.addEventListener('scaremore:tab', e => { visibleTab = e.detail === 'haunt'; last = performance.now(); });
window.addEventListener('scaremore:design', () => {
  buildLayers();
  layout();
  A.refresh();
});
window.addEventListener('scaremore:art-ready', () => { if (W && H) buildLayers(); });
window.addEventListener('scaremore:sprite-ready', e => {
  const kind = e.detail.replace('visitor-', '');
  delete portraits[`moonlit:${kind}`];
  if (A.currentTab === 'castle' && e.detail.startsWith('visitor-')) A.refresh();
});
let stateRef = A.S;
window.addEventListener('scaremore:refresh', () => {
  if (A.S !== stateRef) { stateRef = A.S; combo = 0; visitors = []; drops = []; playTime = 0; fear = 0; hauntUntil = 0; helperReadyAt = 0; }
  if (A.ghostSig() !== ghostId) loadGhost();
});
window.addEventListener('scaremore:start', () => {
  started = true;
  nextSpawn = 1.2;
  offlineEarnings();
});

A.KINDS = KINDS;
A.RARITY_COLORS = RARITY_COLORS;
A.portrait = portrait;
A.debug = () => ({ visitors, drops, L, W, H, fear, combo, setFear: v => { fear = v; }, spawnKind: k => visitors.push(makeVisitor(k, -L.charH * 0.4, L.speed * KINDS[k].speed)) });

new ResizeObserver(() => layout()).observe(sceneEl);
loadGhost();
layout();
A.refresh();
requestAnimationFrame(frame);
})();
