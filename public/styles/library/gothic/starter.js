/* Gothic Night — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   Technique: 1 art pixel = 1 world unit. Sprites are painted per pixel from shaded shapes, quantised into
   hand-picked ramps with Bayer-8 dither and wrapped in a near-black outline. Colours are authored "fully lit";
   a banded light map (moonlight ambient + warm point lights) is MULTIPLIED onto the ground (100 %) and the
   characters and props (55 %), then bloom is added and emissive pixels (eyes, lanterns, seeds, embers) are drawn unlit. */
(function (root) {
  'use strict';
  const hx = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const RA = (a) => a.map(hx);
  const PALETTE = {
    outline: '#0b0910', ground: '#12151e', ambient: '#687cb2',
    soil: '#36292e', grass: '#2a422b', cobble: '#4d5464', stone: '#666d7f', moss: '#3a5530',
    pumpkin: '#bd5314', face: '#ffcc4a', cloak: '#271f40', scarf: '#74244a',
    turnip: '#6c2a76', cream: '#b09c6a', eyeGreen: '#6ee03a', ghost: '#8aa0c0', eyeCyan: '#4ae8ff',
    fire: '#ff8a1c', gem: '#36d6c0', blood: '#d8343c', gold: '#a8874c',
  };
  const PAL = {
    stone: RA(['#1d2030', '#2a2e3e', '#3a3f51', '#4e5466', '#666d7f', '#81889a', '#a2a8b8']),
    moss: RA(['#1d2b1c', '#2a3f25', '#3a5530', '#4f6c3c']), iron: RA(['#0e0e15', '#1a1a25', '#2a2a3a', '#424258', '#5e5e78']),
    bone: RA(['#4a473f', '#77746a', '#a5a190', '#d0cbb6', '#ebe7d6']),
    pumpkin: RA(['#3a1206', '#652108', '#93370c', '#bd5314', '#de7826', '#f3a046']), flesh: hx('#eeb060'),
    stem: RA(['#1c190f', '#34311a', '#4f4d24', '#6a6832']), face: RA(['#b84808', '#ff8a1c', '#ffcc4a', '#fff4c4']),
    cloak: RA(['#0f0b17', '#1a1428', '#271f40', '#372e58', '#4f4880']), scarf: RA(['#2e0b1e', '#4e1632', '#74244a', '#9a3a62']),
    pants: RA(['#110e17', '#1d1927', '#2b2537']), boot: RA(['#0d0a0b', '#211719', '#352729']), glove: RA(['#2a1e1c', '#463430', '#64504a']),
    tPurple: RA(['#1c0a24', '#33123c', '#4e1c58', '#6c2a76', '#8a4292', '#ab68b0']), tPurple2: RA(['#200a1c', '#3a1234', '#581c4e', '#782a68', '#984284', '#b868a2']),
    tCream: RA(['#3e3022', '#625038', '#8a7650', '#b09c6a', '#d2c28c', '#e8dcae']), tLeaf: RA(['#122012', '#1c341c', '#2a4c26', '#3c6532', '#557f42']),
    tWilt: RA(['#3e3420', '#5a4c2a', '#78683a']), eyeG: RA(['#2e8a1e', '#6ee03a', '#c8ff7a', '#f4ffd8']),
    ghost: RA(['#1e2840', '#3a4a6c', '#5e7396', '#8aa0c0', '#b6c8de', '#e2ecf6']), eyeC: RA(['#1a8aa0', '#4ae8ff', '#c8ffff']),
    gem: RA(['#0c3a48', '#14808a', '#36d6c0', '#8cfff0', '#e8fffa']), seed: RA(['#5e4428', '#9a7c4e', '#cdb47e', '#eee0b0', '#fffaea']),
    fire: RA(['#7a1c06', '#c8460c', '#ff8a1c', '#ffc848', '#fff2b8']), wax: RA(['#6e6656', '#a49c84', '#d0c8ae', '#ece6d0']),
  };
  const GR = {
    soil: RA(['#1e171c', '#291f25', '#36292e', '#443539', '#554441', '#69574e']),
    grass: RA(['#141f18', '#1a291d', '#213423', '#2a422b', '#365233', '#46653d', '#5b7b48']),
    cob: RA(['#232731', '#2f3441', '#3d4351', '#4d5464', '#5f6778', '#767e90', '#9098a8']),
    leaf: [RA(['#3e2018', '#5a2e1e', '#7a4428', '#985c34']), RA(['#3e3018', '#5a4622', '#786030', '#947a42']), RA(['#33182a', '#4c2236', '#683246', '#80465a']), RA(['#2e2a26', '#46403a', '#5e554c', '#766b5e'])],
  };
  const OUT = hx('#0b0910'), AMB = [104, 124, 178], ENT_A = 0.55;

  // ---------- helpers: hash, rng, value noise, Bayer-8 dither, ramp pick, sphere shading ----------
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const hashInt = (x, y, s) => { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return h >>> 0; };
  const hash2 = (x, y, s) => hashInt(x, y, s) / 4294967296;
  function R(seed) { let a = seed >>> 0; const n = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    return { next: n, range: (p, q) => p + (q - p) * n(), int: (p, q) => p + Math.floor(n() * (q - p + 1)), sign: () => (n() < 0.5 ? -1 : 1), chance: (p) => n() < p }; }
  function vn(x, y, s) { const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash2(x0, y0, s) + (hash2(x0 + 1, y0, s) - hash2(x0, y0, s)) * u, b = hash2(x0, y0 + 1, s) + (hash2(x0 + 1, y0 + 1, s) - hash2(x0, y0 + 1, s)) * u; return a + (b - a) * v; }
  const fbm = (x, y, s, o) => { let t = 0, n = 0, a = 1, f = 1; for (let i = 0; i < (o || 3); i++) { t += a * vn(x * f, y * f, s + i * 101); n += a; a *= 0.5; f *= 2; } return t / n; };
  const BAY = []; for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { let v = 0; for (let i = 0; i < 3; i++) { const bx = (x >> i) & 1, by = (y >> i) & 1; v += (((bx ^ by) << 1) | by) * Math.pow(4, 2 - i); } BAY.push((v + 0.5) / 64); }
  const dith = (x, y) => BAY[((y & 7) << 3) | (x & 7)];
  /** Picks a ramp colour for tone v (0..1); d = dither strength — band edges break up in a Bayer pattern. */
  function pick(r, v, x, y, d) { let i = Math.floor(v * r.length + (d ? (dith(x, y) - 0.5) * d : 0)); return r[i < 0 ? 0 : i >= r.length ? r.length - 1 : i]; }
  const LD = (() => { const l = [-0.52, -0.64, 0.56], n = Math.hypot(...l); return l.map((v) => v / n); })();   // moon, upper left
  const shade = (nx, ny) => nx * LD[0] + ny * LD[1] + Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)) * LD[2];
  const cs = (c, a) => (a === undefined ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`);
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return { c, ctx: c.getContext('2d') }; }

  /** Pixel painter: RGBA buffer with ellipse/line fills and an automatic 1-px outline pass. */
  class Pix {
    constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); }
    set(x, y, c, a) { x = Math.floor(x); y = Math.floor(y); if (!c || x < 0 || y < 0 || x >= this.w || y >= this.h) return; const o = (y * this.w + x) * 4; this.d[o] = c[0]; this.d[o + 1] = c[1]; this.d[o + 2] = c[2]; this.d[o + 3] = a === undefined ? 255 : a; }
    al(x, y) { x = Math.floor(x); y = Math.floor(y); return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.d[(y * this.w + x) * 4 + 3]; }
    del(x, y) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[(y * this.w + x) * 4 + 3] = 0; }
    ell(cx, cy, rx, ry, fn) { for (let y = Math.floor(cy - ry) - 1; y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx); x++) { const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry; if (nx * nx + ny * ny <= 1) fn(x, y, nx, ny); } }
    line(x0, y0, x1, y1, c) { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy, n = 0;
      for (;;) { this.set(x0, y0, typeof c === 'function' ? c(x0, y0, n++) : c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } }
    outline(c) { const o = new Pix(this.w + 2, this.h + 2);
      for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) { const sx = x - 1, sy = y - 1;
        if (this.al(sx, sy)) { const s = (sy * this.w + sx) * 4, t = (y * o.w + x) * 4; for (let k = 0; k < 4; k++) o.d[t + k] = this.d[s + k]; }
        else if (this.al(sx - 1, sy) || this.al(sx + 1, sy) || this.al(sx, sy - 1) || this.al(sx, sy + 1)) o.set(x, y, c); }
      return o; }
    canvas() { const { c, ctx } = canvas(this.w, this.h), img = ctx.createImageData(this.w, this.h); img.data.set(this.d); ctx.putImageData(img, 0, 0); return c; }
  }
  function flipX(src) { const { c, ctx } = canvas(src.width, src.height); ctx.translate(src.width, 0); ctx.scale(-1, 1); ctx.drawImage(src, 0, 0); return c; }
  const rec = (p, ax, ay, eyes) => { const r = p.canvas(); return { r, l: flipX(r), w: p.w, h: p.h, ax, ay, eyes: eyes || [], eyesL: (eyes || []).map((e) => [p.w - 1 - e[0], e[1], e[2]]) }; };

  // ---------- main character: pumpkin head with carved face, cloak, scarf (6 frames: 4 walk + 2 idle) ----------
  const FACE = [[-4, 0, 0], [4, 0, 0], [-4, 1, 1], [-3, 1, 0], [3, 1, 0], [4, 1, 1], [-4, 2, 1], [-3, 2, 2], [-2, 2, 1], [2, 2, 1], [3, 2, 2], [4, 2, 1], [0, 3, 1], [-4, 4, 0], [4, 4, 0],
    [-4, 5, 1], [-3, 5, 2], [-1, 5, 2], [0, 5, 2], [1, 5, 2], [3, 5, 2], [4, 5, 1], [-3, 6, 1], [-2, 6, 2], [-1, 6, 1], [1, 6, 1], [2, 6, 2], [3, 6, 1]];
  const JW = 22, JH = 34;
  function makeHero(f) {
    const p = new Pix(JW, JH), CL = PAL.cloak, SC = PAL.scarf, PA = PAL.pants, BO = PAL.boot, ST = PAL.stem, by = 2 + f.bob, cx = 10;
    const leg = (dx, lift, back) => { const lx = cx - 1 + dx; for (let y = 28; y <= 31 - lift; y++) { p.set(lx, y, PA[back ? 0 : 1]); p.set(lx + 1, y, PA[back ? 1 : 2]); }
      const fy = 32 - lift; p.set(lx, fy, BO[back ? 0 : 1]); p.set(lx + 1, fy, BO[back ? 1 : 2]); p.set(lx + 2, fy, BO[1]); p.set(lx, fy + 1, BO[0]); p.set(lx + 1, fy + 1, BO[1]); p.set(lx + 2, fy + 1, BO[1]); p.set(lx + 3, fy + 1, BO[0]); };
    leg(f.bDx, f.bLift, true); leg(f.aDx, f.aLift, false);
    const sy = by + 13, tail = [[-8, 3], [-9, 2], [-8, 4], [-7, 5]][f.scarf];
    p.line(cx - 4, sy + 1, cx + tail[0], sy + 1 + tail[1], SC[2]); p.line(cx - 4, sy + 2, cx + tail[0], sy + 2 + tail[1], SC[1]); p.set(cx + tail[0], sy + 3 + tail[1], SC[3]);
    const top = by + 14, bot = by + 26;                       // cloak: widening trapezoid, lit left edge, two dark folds
    for (let y = top; y <= bot + 1; y++) {
      const t = (y - top) / (bot - top), hw = 4.3 + t * 3.2, sw = Math.round(f.sway * Math.max(0, t - 0.3) * 2.2);
      const x0 = Math.round(cx + 0.5 - hw) + sw, x1 = Math.round(cx + 0.5 + hw) - 1 + sw;
      for (let x = x0; x <= x1; x++) {
        if (y >= bot) { const k = (x * 7 + 3) % 5; if ((y === bot && k === 0) || (y === bot + 1 && k > 1)) continue; }   // ragged hem
        const u = (x - x0) / Math.max(1, x1 - x0);
        let c = x === x0 ? (y < top + 4 ? CL[4] : CL[3]) : u < 0.22 ? CL[3] : u > 0.8 ? CL[1] : CL[2];
        if (y > top + 4 && (x === cx - 2 + Math.round(sw * 0.6) || x === cx + 4 + sw)) c = CL[1];
        if (y > top + 3 && x === cx + 2 + Math.round(sw * 0.7)) c = CL[0];
        if (y === top) c = u < 0.5 ? CL[4] : CL[3];
        p.set(x, y, c);
      }
    }
    p.set(cx + 4, by + 21, PAL.glove[2]); p.set(cx + 5, by + 21, PAL.glove[1]); p.set(cx + 4, by + 22, PAL.glove[1]); p.set(cx + 5, by + 22, PAL.glove[0]);
    for (let x = cx - 4; x <= cx + 5; x++) { p.set(x, sy, SC[3]); p.set(x, sy + 1, SC[2]); p.set(x, sy + 2, SC[1]); }
    p.set(cx + 4, sy + 3, SC[2]); p.set(cx + 5, sy + 3, SC[1]); p.set(cx + 4, sy + 4, SC[1]); p.set(cx + 3, sy + 3, SC[1]);
    p.ell(10.5, by + 7.2, 7.6, 6.3, (x, y, nx, ny) => {     // pumpkin: lit sphere + rib grooves from asin(nx)
      let v = 0.47 + shade(nx, ny) * 0.42;
      const sf = (Math.asin(clamp(nx, -1, 1)) / (Math.PI / 2)) * 2.6 + 0.5, fr = sf - Math.floor(sf);
      if (fr < 0.13 || fr > 0.94) v -= 0.17; else if (fr > 0.42 && fr < 0.58) v += 0.05;
      if (ny > 0.74) v -= 0.12;
      p.set(x, y, pick(PAL.pumpkin, v, x, y, 0.3));
    });
    p.set(10, by, ST[3]); p.set(10, by + 1, ST[2]); p.set(11, by + 1, ST[1]); p.set(11, by - 1, ST[2]); p.set(12, by - 1, ST[1]);
    const fs = new Set(FACE.map((q) => q[0] + ',' + q[1]));
    for (const [dx, dy, lv] of FACE) { p.set(12 + dx, by + 4 + dy, PAL.face[lv + 1]); if (!fs.has(dx + ',' + (dy + 1))) p.set(12 + dx, by + 5 + dy, PAL.flesh); }
    for (const [dx, dy, lv] of FACE) p.set(12 + dx, by + 4 + dy, PAL.face[lv + 1]);
    const s = rec(p.outline(OUT), 11, JH + 1); s.bob = f.bob; return s;
  }
  /** Emissive face overlay (drawn after the light): level -1/0/+1 = flicker brightness. */
  function makeFace(level) { const p = new Pix(JW + 2, JH + 2); for (const [dx, dy, lv] of FACE) p.set(13 + dx, 7 + dy, PAL.face[clamp(lv + level, 0, 3)]); const r = p.canvas(); return { r, l: flipX(r) }; }

  // ---------- small creature: root bulb (purple top dithered into cream), leafy top, glowing green eyes ----------
  function makeCreeper(fr, vari) {
    const p = new Pix(20, 26), PU = vari ? PAL.tPurple2 : PAL.tPurple, CR = PAL.tCream, LF = PAL.tLeaf, WI = PAL.tWilt;
    const bob = [0, -1, 0, -1][fr], tilt = [0, 1, 0, -1][fr], cx = 9.5 + tilt * 0.5, cy = 14 + bob;
    for (const [lx0, lift] of [[cx - 4, fr === 1 ? 1 : 0], [cx + 2, fr === 3 ? 1 : 0]]) {
      const lx = Math.round(lx0) + lift; for (let y = 20; y <= 24 - lift; y++) { p.set(lx, y, CR[1]); p.set(lx + 1, y, CR[2]); }
      p.set(lx - 1, 25 - lift, CR[1]); p.set(lx, 25 - lift, CR[1]); p.set(lx + 1, 25 - lift, CR[0]); p.set(lx + 2, 25 - lift, CR[1]);
    }
    const sway = ([0, 7, 0, -7][fr] * Math.PI) / 180;
    for (const [deg, len] of vari ? [[-92, 8.5], [-130, 7], [-52, 6.5], [-162, 4.5]] : [[-96, 9], [-137, 6.5], [-48, 7.5]]) {
      const a = (deg * Math.PI) / 180 + sway, ca = Math.cos(a), sa = Math.sin(a), bx0 = cx + ca * 1.2, by0 = cy - 6 + sa * 0.6, mx = bx0 + (ca * len) / 2, my = by0 + (sa * len) / 2;
      for (let y = Math.floor(my - len); y <= Math.ceil(my + len); y++) for (let x = Math.floor(mx - len); x <= Math.ceil(mx + len); x++) {
        const dx = x + 0.5 - mx, dy = y + 0.5 - my, lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca, t = (lx / (len / 2) + 1) / 2;
        if (Math.abs(lx) > len / 2 || Math.abs(ly) > 1.9 * Math.sin(Math.PI * clamp(t, 0, 1) * 0.9 + 0.15)) continue;
        let c = ly < -0.4 ? LF[3] : ly > 0.5 ? LF[1] : LF[2];
        if (Math.abs(ly) < 0.35 && t > 0.15) c = LF[1];
        if (t > 0.8) c = WI[ly < 0 ? 2 : 1];             // wilted brown tips
        p.set(x, y, c);
      }
      p.line(cx, cy - 6, bx0, by0, PU[1]);
    }
    p.ell(cx, cy, 7.4, 7, (x, y, nx, ny) => {
      const tt = ny - (0.12 + 0.1 * Math.sin(nx * 5 + vari * 2)), purple = tt < -0.06 || (tt < 0.08 && dith(x, y) > (tt + 0.06) / 0.14), v = 0.42 + shade(nx, ny) * 0.45;
      p.set(x, y, pick(purple ? PU : CR, purple ? v + 0.05 : v - 0.02, x, y, 0.3));
    });
    const vr = R(500 + vari);
    for (let k = 0; k < 4; k++) { let vx = cx + vr.range(-4, 4), vy = cy - 6 + vr.range(0, 1.5); const dir = vr.sign();
      for (let n = 0; n < 7; n++) { const ix = Math.round(vx), iy = Math.round(vy), nx = (ix + 0.5 - cx) / 7.4, ny = (iy + 0.5 - cy) / 7; if (nx * nx + ny * ny < 0.86 && ny < 0.1) p.set(ix, iy, PU[1]); vy += 0.8; vx += dir * (vr.chance(0.5) ? 0.7 : 0); } }
    p.set(Math.round(cx), Math.round(cy + 7), CR[2]); p.set(Math.round(cx), Math.round(cy + 8), CR[1]);
    const fx = Math.round(cx) + 1, ey = Math.round(cy) - 1, DK = hx('#14061a');
    for (const [x, y] of [[fx - 5, ey - 2], [fx - 4, ey - 1], [fx - 3, ey - 1], [fx + 3, ey - 2], [fx + 2, ey - 1], [fx + 1, ey - 1]]) p.set(x, y, DK);   // angry brows
    const eyes = [[fx - 4, ey, 1], [fx - 3, ey, 2], [fx + 1, ey, 2], [fx + 2, ey, 1], [fx - 3, ey + 1, 0], [fx + 1, ey + 1, 0]];
    for (const [x, y, l] of eyes) p.set(x, y, PAL.eyeG[l + 1]);
    for (let x = fx - 3; x <= fx + 2; x++) p.set(x, ey + 4, DK); for (let x = fx - 2; x <= fx + 1; x++) p.set(x, ey + 5, DK);
    p.set(fx - 2, ey + 4, CR[5]); p.set(fx + 1, ey + 4, CR[5]);
    const o = p.outline(OUT);
    return rec(o, 11, o.h - 1, eyes.filter((e) => e[2] > 0).map(([x, y, l]) => [x + 1, y + 1, cs(PAL.eyeG[l + 1])]));
  }
  // ---------- fast creature: skeletal ghost, reaching arm, wavy tail that dissolves in Bayer dither ----------
  function makeGhost(fr) {
    const p = new Pix(27, 28), GH = PAL.ghost, ph = (fr * Math.PI) / 2, reach = [0, 1, 2, 1][fr], cx = 11;
    p.line(cx - 2, 11, cx + 6 + reach, 15, (x, y, n) => GH[n < 3 ? 2 : 3]); p.line(cx + 6 + reach, 15, cx + 9 + reach, 14, GH[2]); p.line(cx + 6 + reach, 15, cx + 9 + reach, 16, GH[2]);
    for (let y = 14; y < 28; y++) { const t = (y - 14) / 13, w = 3.6 * (1 - t) + 0.6, xc = cx + 0.5 + Math.sin(t * 3.4 + ph) * 2.2 * t - t * 3;
      for (let x = Math.floor(xc - w - 1); x <= Math.ceil(xc + w); x++) { const dd = Math.abs(x + 0.5 - xc) / w; if (dd <= 1) p.set(x, y, pick(GH, 0.62 - t * 0.3 + (1 - dd) * 0.12 - (x + 0.5 > xc ? 0.12 : 0), x, y, 0.4)); } }
    p.ell(cx + 0.5, 12.5, 3.8, 4.2, (x, y, nx, ny) => p.set(x, y, pick(GH, 0.42 + shade(nx, ny) * 0.3, x, y, 0.3)));
    for (const ry of [10, 12, 14]) { for (let x = cx - 2; x <= cx + 3; x++) p.set(x, ry, GH[5]); p.set(cx - 3, ry + 1, GH[4]); p.set(cx + 4, ry + 1, GH[3]); for (let x = cx - 1; x <= cx + 2; x++) if (x !== cx) p.set(x, ry + 1, GH[1]); }
    for (let y = 9; y <= 16; y++) p.set(cx, y, GH[4]);
    p.ell(cx + 0.5, 5.2, 4.3, 4.6, (x, y, nx, ny) => p.set(x, y, pick(GH, 0.6 + shade(nx, ny) * 0.38, x, y, 0.3)));
    const fx = cx + 1, SO = hx('#070a14');
    for (const [x, y] of [[fx - 3, 4], [fx - 2, 4], [fx - 3, 5], [fx - 2, 5], [fx + 1, 4], [fx + 2, 4], [fx + 1, 5], [fx + 2, 5]]) p.set(x, y, SO);
    for (let y = 7; y <= 10; y++) { p.set(fx - 1, y, SO); p.set(fx, y, SO); }
    p.line(cx + 3, 10, cx + 8 + reach, 12, GH[4]); p.line(cx + 3, 11, cx + 8 + reach, 13, GH[2]);
    const h0 = cx + 8 + reach; p.line(h0, 12, h0 + 3, 10, GH[5]); p.line(h0, 12, h0 + 4, 12, GH[4]); p.line(h0, 13, h0 + 3, 15, GH[4]);
    const o = p.outline(hx('#141a2e'));
    for (let y = 22; y < o.h; y++) for (let x = 0; x < o.w; x++) if (dith(x, y) < (y - 21) / 8) o.del(x, y);
    return rec(o, 12, o.h - 1, [[fx - 1, 6, cs(PAL.eyeC[2])], [fx + 2, 6, cs(PAL.eyeC[2])], [fx - 2, 6, cs(PAL.eyeC[1])], [fx + 3, 6, cs(PAL.eyeC[1])]]);
  }
  // ---------- props + collectibles + orbiting lanterns ----------
  /** Rounded gravestone: lit front face + 2-px extruded side, moss on top/bottom, near-black outline. */
  function makeGrave(seed) {
    const W = 16, H = 22, cx = 6, base = 19, rng = R(seed), id = new Uint8Array(W * H), tn = new Float32Array(W * H);
    const front = (u, v) => Math.abs(u) <= 5 && v >= 0 && (v < 9 || (u * u) / 30 + ((v - 9) / 4.2) ** 2 <= 1);
    const put = (x, y, k, t) => { if (x >= 0 && y >= 0 && x < W && y < H) { id[y * W + x] = k; tn[y * W + x] = t; } };
    for (let v = 0; v < H; v++) for (let u = -cx; u < W - cx; u++) if (front(u, v)) for (let k = 1; k <= 2; k++) if (!front(u + k, v + k)) put(cx + u + k, base - v - k, 1, front(u + k, v + k - 1) ? 0.74 : 0.2);
    for (let v = 0; v < H; v++) for (let u = -cx; u < W - cx; u++) if (front(u, v)) put(cx + u, base - v, 1, 0.42 + 0.2 * (v / 13) + (hash2(u, v, seed) - 0.5) * 0.07);
    for (let v = 6; v <= 11; v++) { put(cx, base - v, 1, 0.05); put(cx + 1, base - v, 1, 0.66); }          // engraved cross: dark groove + lit lip
    for (let u = -2; u <= 2; u++) { put(cx + u, base - 10, 1, 0.05); put(cx + u + 1, base - 9, 1, 0.66); }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (id[y * W + x] === 1 && rng.next() < ((base - y < 4 ? (4 - base + y) * 0.18 : 0) + (!id[(y - 1) * W + x] ? 0.35 : 0)) * 0.9) { id[y * W + x] = 2; tn[y * W + x] = 0.35 + rng.next() * 0.45; }
    const p = new Pix(W, H), ramps = [null, PAL.stone, PAL.moss], at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : id[y * W + x]);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = id[y * W + x]; if (!k) continue;
      let t = tn[y * W + x]; if (!at(x - 1, y)) t += 0.17; if (!at(x, y - 1)) t += 0.1; if (!at(x + 1, y)) t -= 0.15; if (!at(x, y + 1)) t -= 0.08;   // moonlit edge rules
      p.set(x, y, pick(ramps[k], t, x, y, 0.35)); }
    const o = p.outline(OUT), s = rec(o, cx + 1, base + 1), sh = new Pix(o.w + 14, 10);   // moon shadow: sheared copy toward lower right
    for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) if (o.al(x, y)) { const hgt = Math.max(0, base + 1 - y); sh.set(Math.round(x + hgt * 0.55), Math.round(1 + hgt * 0.3), [5, 5, 12]); sh.set(Math.round(x + hgt * 0.55), Math.round(2 + hgt * 0.3), [5, 5, 12]); }
    s.sh = sh.canvas(); return s;
  }
  function makeLantern(fl) {
    const p = new Pix(13, 15), IR = PAL.iron, F = PAL.fire, lv = [[2, 3, 4], [1, 3, 4], [1, 2, 3]][fl];
    for (const [x, y, c] of [[4, 1, 3], [5, 0, 3], [6, 0, 4], [7, 0, 3], [8, 1, 2], [4, 2, 2], [8, 2, 2]]) p.set(x, y, IR[c]);
    p.set(6, 2, PAL.tLeaf[3]); p.set(7, 2, PAL.tLeaf[2]); p.set(6, 3, PAL.tLeaf[2]);
    p.ell(6.5, 8.5, 5.4, 5.2, (x, y, nx, ny) => p.set(x, y, pick(ny < 0.05 + 0.1 * Math.sin(nx * 4) ? PAL.tPurple : PAL.tCream, 0.45 + shade(nx, ny) * 0.42, x, y, 0.3)));
    p.set(4, 7, F[lv[1]]); p.set(3, 8, F[lv[0]]); p.set(4, 8, F[lv[2]]); p.set(8, 7, F[lv[1]]); p.set(8, 8, F[lv[2]]); p.set(9, 8, F[lv[0]]);
    for (let x = 4; x <= 9; x++) p.set(x, 11, F[x % 2 ? lv[2] : lv[1]]);
    return p.outline(OUT).canvas();
  }
  function makeGem(fr) {
    const p = new Pix(6, 8), GM = PAL.gem;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 6; x++) { const dx = x + 0.5 - 3, dy = y + 0.5 - 4; if (Math.abs(dx) / 2.2 + Math.abs(dy) / 3.2 > 1) continue;
      let lv = dx < 0 ? 3 : 2; if (dy > 1.1) lv = dx < 0 ? 2 : 1; if (Math.abs(dx) / 2.2 + Math.abs(dy) / 3.2 > 0.78) lv -= 1; p.set(x, y, GM[clamp(lv, 0, 4)]); }
    p.set(2, Math.round(4 - 1.76 + fr), GM[4]);
    return p.outline(hx('#061c24')).canvas();
  }
  /** Light sprite: banded radial falloff (bands steps, dithered band edges), colour mixes outer→inner. */
  function makeLight(rx, ry, inner, outer, maxA, bands, pw) {
    const w = Math.ceil(rx) * 2, h = Math.ceil(ry) * 2, p = new Pix(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dd = Math.hypot((x + 0.5 - w / 2) / rx, (y + 0.5 - h / 2) / ry); if (dd >= 1) continue;
      const q = clamp(Math.floor(Math.pow(1 - dd, pw) * bands + (dith(x, y) - 0.5) * 0.55 + 0.35) / bands, 0, 1); if (q <= 0) continue;
      p.set(x, y, outer.map((o, i) => o + (inner[i] - o) * q), Math.round(q * maxA * 255)); }
    return p.canvas();
  }
  function shadowEll(rx, ry, a) { const p = new Pix(Math.ceil(rx * 2), Math.ceil(ry * 2)); p.ell(p.w / 2, p.h / 2, rx, ry, (x, y, nx, ny) => { if (nx * nx + ny * ny < 0.55 || dith(x, y) > 0.5) p.set(x, y, [6, 6, 14], a); }); return p.canvas(); }

  let SPR = null;
  function init() {
    const frames = [{ aDx: 2, aLift: 0, bDx: -2, bLift: 0, bob: 0, sway: -1, scarf: 0 }, { aDx: 0, aLift: 0, bDx: 0, bLift: 1, bob: -1, sway: 0, scarf: 1 }, { aDx: -2, aLift: 0, bDx: 2, bLift: 0, bob: 0, sway: 1, scarf: 2 },
      { aDx: 0, aLift: 1, bDx: 0, bLift: 0, bob: -1, sway: 0, scarf: 3 }, { aDx: 1, aLift: 0, bDx: -1, bLift: 0, bob: 0, sway: 0, scarf: 3 }, { aDx: 1, aLift: 0, bDx: -1, bLift: 0, bob: 1, sway: 0, scarf: 2 }];
    SPR = { hero: frames.map(makeHero), face: [-1, 0, 1].map(makeFace), creeper: [0, 1].map((v) => [0, 1, 2, 3].map((f) => makeCreeper(f, v))), ghost: [0, 1, 2, 3].map(makeGhost),
      grave: [3, 17, 29].map(makeGrave), lantern: [0, 1, 2].map(makeLantern), gem: [0, 1, 2, 3].map(makeGem), sh: { s: shadowEll(6, 2, 120), m: shadowEll(8, 2.5, 120), g: shadowEll(4, 1.5, 70) } };
    SPR.L = { hero: makeLight(96, 78, [255, 214, 160], [255, 140, 60], 1, 7, 0.85), lantern: makeLight(42, 34, [255, 206, 140], [255, 120, 40], 0.85, 5, 0.9),
      grave: makeLight(20, 15, [255, 150, 110], [220, 50, 40], 0.8, 4, 1), proj: makeLight(14, 11, [255, 214, 150], [255, 140, 60], 0.7, 3, 1),
      gem: makeLight(10, 8, [200, 255, 240], [80, 230, 210], 0.85, 3, 1), ghost: makeLight(16, 13, [200, 225, 255], [140, 180, 255], 0.5, 3, 1) };
    SPR.B = { warm: makeLight(11, 10, [255, 170, 70], [255, 120, 30], 0.32, 4, 1), red: makeLight(6, 5, [255, 110, 70], [255, 50, 30], 0.35, 3, 1) };
    const fog = new Pix(128, 128);                            // banded, dithered mist (3 alpha levels)
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) { const v = sstep(0.45, 0.72, fbm(x / 32, y / 16, 707, 4)), q = Math.floor(v * 3 + (dith(x, y) - 0.5) * 0.9) / 3; if (q > 0) fog.set(x, y, [196, 208, 232], Math.round(q * 0.2 * 255)); }
    SPR.fog = fog.canvas();
  }

  // ---------- ground: soil, grass tufts (per-pixel threshold vs coverage), leaf litter, cobble path; cast shadows from the row above ----------
  function bakeGround(W, H) {
    const { c, ctx } = canvas(W, H), img = ctx.createImageData(W, H), d = img.data;
    const leafRGB = new Uint8Array(W * H * 3), leafThr = new Uint8Array(W * H).fill(255), leafSh = new Uint8Array(W * H).fill(255);
    const SHP = [[[0, 0], [1, 0], [1, 1], [2, 1]], [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]], [[0, 0], [1, 0], [2, 0], [1, 1], [2, 1]], [[1, 0], [2, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]]];
    const rng = R(41), list = [];
    for (let k = 0; k < W * H * 0.044; k++) list.push({ x: rng.int(0, W - 1), y: rng.int(0, H - 1), s: rng.int(0, 4), f: rng.int(0, 3), tone: rng.int(1, 2), t: rng.next() });
    list.sort((a, b) => b.t - a.t);
    for (const L of list) { const s = SHP[L.s], fam = GR.leaf[L.f], tv = Math.floor(L.t * 254);
      s.forEach(([dx, dy], i) => { const x = L.x + dx, y = L.y + dy; if (x >= W || y >= H) return; const cc = i === 0 ? fam[L.tone + 1] : i === s.length - 1 ? fam[L.tone - 1] : fam[L.tone], k = y * W + x; leafRGB.set(cc, k * 3); leafThr[k] = tv; });
      s.forEach(([dx, dy]) => { const x = L.x + dx + 1, y = L.y + dy + 1; if (x < W && y < H && leafThr[y * W + x] === 255) leafSh[y * W + x] = Math.min(leafSh[y * W + x], tv); }); }
    const blade = new Float32Array(W * H);                    // grass blades: 2-4 px vertical strokes brightening upward
    const br = R(21); for (let k = 0; k < W * H * 0.08; k++) { const x = br.int(0, W - 1), y = br.int(4, H - 1), h = br.int(2, 4), lean = br.next() < 0.3 ? -1 : br.next() < 0.45 ? 1 : 0;
      for (let s = 0; s < h; s++) blade[(y - s) * W + clamp(x + Math.round(lean * (s / h) * 1.3), 0, W - 1)] = 0.34 + 0.48 * (s / (h - 1)); }
    const pathY = (x) => H * 0.7 + Math.sin(x / 60) * 22 + Math.sin(x / 23 + 1) * 5, cw = 11.6, ch = 9.1;
    let prev = new Int8Array(W), cur = new Int8Array(W);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        let col = pick(GR.soil, 0.36 + (fbm(x / 32, y / 32, 11) - 0.5) * 0.55 + (fbm(x / 8, y / 8, 12, 2) - 0.5) * 0.35, x, y, 0.5).slice(), layer = 0;
        const cg = sstep(0.4, 0.52, fbm(x / 150, y / 150, 321, 3) + 0.1);
        if (cg > 0.003) {                                       // tuft threshold: low near Worley-ish cell centres -> grass grows in clumps
          const gx = Math.floor(x / 8), gy = Math.floor(y / 8); let wd = 9;
          for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) { const hh = hashInt(gx + k, gy + j, 24); wd = Math.min(wd, Math.hypot((gx + k + 0.18 + (hh & 1023) / 1023 * 0.64) * 8 - x, (gy + j + 0.18 + ((hh >>> 10) & 1023) / 1023 * 0.64) * 8 - y)); }
          const th = clamp((fbm(x / 16, y / 16, 30) - 0.28) / 0.44 * 0.72 + (wd / 8) * 0.42, 0, 0.985);
          if (th < cg) { col = pick(GR.grass, blade[i] || 0.3 + (fbm(x / 32, y / 32, 21) - 0.5) * 0.45 + (fbm(x / 8, y / 8, 26, 2) - 0.5) * 0.3, x, y, 0.35).slice(); layer = 1; if (cg - th < 0.035 && cg < 0.97) col = col.map((v) => v * 0.72); }
        }
        const cl = sstep(0.55, 0.68, fbm(x / 110, y / 110, 655, 3));
        if (cl > 0.003) { if (leafThr[i] < 255) { if (leafThr[i] / 255 < cl) { col = Array.from(leafRGB.subarray(i * 3, i * 3 + 3)); layer = 2; } } else if (leafSh[i] < 255 && leafSh[i] / 255 < cl) col = [col[0] * 0.72, col[1] * 0.72, col[2] * 0.74]; }
        const cp = 1 - sstep(10, 17, Math.abs(y - pathY(x)));
        if (cp > 0.003) {                                       // cobbles: jittered cells, F2-F1 edge = mortar, per-stone threshold
          const gx = Math.floor(x / cw), gy = Math.floor(y / ch); let d1 = 1e9, d2 = 1e9, ax = 0, ay = 0, bx = 0, by = 0, sid = 0;
          for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) { const hh = hashInt(gx + k, gy + j, 51), fx = (gx + k + 0.18 + (hh & 1023) / 1023 * 0.64) * cw, fy = (gy + j + 0.18 + ((hh >>> 10) & 1023) / 1023 * 0.64) * ch, dd = (fx - x - 0.5) ** 2 + (fy - y - 0.5) ** 2;
            if (dd < d1) { d2 = d1; bx = ax; by = ay; d1 = dd; ax = fx; ay = fy; sid = hh; } else if (dd < d2) { d2 = dd; bx = fx; by = fy; } }
          const e = (d2 - d1) / (2 * Math.hypot(bx - ax, by - ay) + 1e-6);
          if (e < 0.85) { if (cp > 0.72) { col = col.map((v, q) => v * 0.55 + (q === 2 ? 6 : 4)); layer = 3; } }
          else if (((sid >>> 12) & 255) % 250 / 255 < cp * 1.04) {
            const lit = -0.55 * (x + 0.5 - ax) / (cw * 0.55) - 0.8 * (y + 0.5 - ay) / (ch * 0.55);
            let v = 0.34 + ((sid >>> 20) & 255) / 255 * 0.24 + lit * 0.13; if (e < 1.9) v += lit > 0 ? 0.13 : -0.15;
            col = pick(GR.cob, v + (hash2(x >> 1, y >> 1, 3) - 0.5) * 0.2, x, y, 0.5).slice(); layer = 4;
          }
        }
        if (prev[x] === 4 && layer < 4) col = [col[0] * 0.62, col[1] * 0.62, col[2] * 0.66]; else if (prev[x] === 1 && layer === 0) col = col.map((v) => v * 0.8);   // 3/4-view cast shadow
        cur[x] = layer;
        const b = 0.9 + 0.2 * fbm(x / 300, y / 300, 99, 2), o = i * 4; d[o] = col[0] * b; d[o + 1] = col[1] * b; d[o + 2] = col[2] * b * 1.03; d[o + 3] = 255;
      }
      const tmp = prev; prev = cur; cur = tmp;
    }
    ctx.putImageData(img, 0, 0);
    const B = PAL.bone, skull = new Pix(6, 6);                // ground decal: skull with 1-px drop shadow
    [' bbb ', 'bbbbc', 'beebc', 'bcbcd', ' ccd '].forEach((r, y) => [...r].forEach((chh, x) => { const m = { b: B[3], c: B[2], d: B[1], e: [10, 8, 12] }[chh]; if (m) skull.set(x, y, m); }));
    for (let y = 5; y >= 0; y--) for (let x = 5; x >= 0; x--) if (!skull.al(x, y) && (skull.al(x - 1, y - 1) || skull.al(x, y - 1))) skull.set(x, y, [16, 12, 18], 150);
    const sk = skull.canvas(); for (let k = 0; k < 6; k++) ctx.drawImage(sk, Math.floor(hash2(k, 1, 7) * W), Math.floor(hash2(k, 2, 7) * H));
    // light-map base: ambient moonlight AMB with a 5-band dithered vignette (edges down to 50 %)
    const lb = new Pix(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let v = sstep(0.5, 1.12, Math.hypot((x + 0.5 - W / 2) / (W * 0.6), (y + 0.5 - H / 2 + 6) / (H * 0.62)));
      v = Math.floor(v * 5 + (dith(x, y) - 0.5) * 0.8) / 5; const f = 1 - clamp(v, 0, 1) * 0.5; lb.set(x, y, [AMB[0] * f, AMB[1] * f, AMB[2] * f]); }
    return { c, W, H, pathY, lightBase: lb.canvas(), light: canvas(W, H) };
  }

  const flick = (t, s) => 0.86 + 0.09 * Math.sin(t * 7.3 + s * 17.1) * Math.cos(t * 3.1 + s) + 0.05 * Math.sin(t * 23 + s * 40);
  /** Draws the main character with feet at (x, y). t = seconds, facing = 1 | -1. Unlit body; the face is emissive (see draw()). */
  function drawHero(ctx, x, y, t, facing, moving) {
    if (!SPR) init();
    const s = SPR.hero[moving === false ? 4 + (Math.floor(t * 1.6) & 1) : Math.floor(t * 8) & 3], flip = facing < 0;
    const dx = Math.round(x) - (flip ? s.w - 1 - s.ax : s.ax), dy = Math.round(y) - s.ay;
    ctx.drawImage(flip ? s.l : s.r, dx, dy);
    return { dx, dy, s, flip };
  }
  /** Draws a typical creature with feet at (x, y). kind 'creeper' | 'creeper2' | 'ghost'. Returns eye pixels for the emissive pass. */
  function drawEnemy(ctx, x, y, t, kind, facing, seed) {
    if (!SPR) init();
    const ghost = kind === 'ghost', s = ghost ? SPR.ghost[Math.floor(t * 7 + (seed || 0) * 4) & 3] : SPR.creeper[kind === 'creeper2' ? 1 : 0][Math.floor(t * 6 + (seed || 0) * 3) & 3];
    const flip = facing < 0, yy = Math.round(y) - (ghost ? 4 + Math.round(Math.sin(t * 3 + (seed || 0) * 10) * 1.5) : 0);
    const dx = Math.round(x) - (flip ? s.w - 1 - s.ax : s.ax), dy = yy - s.ay;
    ctx.globalAlpha = ghost ? 0.86 : 1; ctx.drawImage(flip ? s.l : s.r, dx, dy); ctx.globalAlpha = 1;
    return (flip ? s.eyesL : s.eyes).map((e) => [dx + e[0], dy + e[1], e[2]]);
  }

  /** Paints a complete preview scene into a w×h canvas at time t (seconds). */
  let buf = null, G = null;
  function draw(ctx, w, h, t) {
    if (!SPR) init();
    const up = Math.max(1, Math.round(h / 360)), W = Math.ceil(w / up), H = Math.ceil(h / up);
    if (!buf || buf.c.width !== W || buf.c.height !== H) { buf = canvas(W, H); G = bakeGround(W, H); }
    const b = buf.ctx, cx = W * 0.5, cy = H * 0.52;
    b.setTransform(1, 0, 0, 1, 0, 0); b.imageSmoothingEnabled = false; b.globalAlpha = 1; b.globalCompositeOperation = 'source-over';
    b.drawImage(G.c, 0, 0);
    for (const [sc, sx, sy, fa] of [[2, t * 5, t * 1.5, 1], [1, -t * 7 + 90, t * 2 + 40, 0.6]]) { const T = 128 * sc; b.globalAlpha = fa; for (let y = ((sy % T) - T) | 0; y < H; y += T) for (let x = ((sx % T) - T) | 0; x < W; x += T) b.drawImage(SPR.fog, x, y, T, T); }
    b.globalAlpha = 1;
    // characters, props, collectibles, orbiting lanterns, projectile
    const hx0 = cx + Math.sin(t * 0.5) * 8, hy0 = cy + 8, orbs = [0, 1].map((k) => { const a = t * 2.2 + k * Math.PI; return [hx0 + Math.cos(a) * 30, hy0 - 6 + Math.sin(a) * 18]; });
    const graves = [[cx - 150, cy - 40, 0], [cx - 112, cy - 58, 1], [cx + 120, cy - 70, 2], [cx + 168, cy + 4, 0], [cx - 60, cy + 72, 1], [cx + 70, cy - 104, 2]];
    const foes = [['creeper', 60, -26], ['creeper2', 96, 30], ['ghost', -70, -14], ['ghost', -40, 50], ['creeper', 150, 64], ['ghost', 190, -40], ['creeper2', -170, 40], ['creeper', 20, -80]];
    const gems = [[-26, 34], [40, 52], [-96, -50], [118, -20]];
    // light map: copy base, add drifting moonlight, then stamp point lights (all banded sprites)
    const lc = G.light.ctx, LT = SPR.L, lit = (spr, x, y, a) => { lc.globalAlpha = clamp(a, 0, 1); lc.drawImage(spr, Math.round(x - spr.width / 2), Math.round(y - spr.height / 2)); };
    lc.globalCompositeOperation = 'copy'; lc.globalAlpha = 1; lc.drawImage(G.lightBase, 0, 0); lc.globalCompositeOperation = 'source-over';
    const fl = flick(t, 0.37); lit(LT.hero, hx0, hy0 - 12, fl + 0.1);
    orbs.forEach(([x, y], k) => lit(LT.lantern, x, y - 6, flick(t, k + 3)));
    lit(LT.grave, graves[1][0] + 6, graves[1][1] + 1, flick(t, 9) * 0.9);
    gems.forEach(([x, y]) => lit(LT.gem, cx + x, cy + y - 3, 0.9));
    foes.forEach(([k, x, y]) => { if (k === 'ghost') lit(LT.ghost, cx + x, cy + y - 14, 0.55); });
    const sp = (t * 0.9) % 1, px = hx0 + 10 + 130 * sp, py = hy0 - 16 - 40 * sp; lit(LT.proj, px, py, 0.85);
    const multiply = (a) => { b.globalCompositeOperation = 'multiply'; b.globalAlpha = a; b.drawImage(G.light.c, 0, 0); b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1; };
    multiply(1);                                                // ground: fully lit by the map
    const list = [], eyes = [];
    for (const [x, y, i] of graves) { const s = SPR.grave[i]; list.push({ y, f: () => { b.globalAlpha = 0.42; b.drawImage(s.sh, Math.round(x) - s.ax, Math.round(y) - 1); b.globalAlpha = 1; b.drawImage(s.r, Math.round(x) - s.ax, Math.round(y) - s.ay); } }); }
    list.push({ y: hy0, f: () => { b.drawImage(SPR.sh.m, Math.round(hx0 - 8) + 1, Math.round(hy0 - 2)); list.hero = drawHero(b, hx0, hy0, t, Math.cos(t * 0.5) > 0 ? 1 : -1); } });
    foes.forEach(([k, dx, dy], i) => { const x = cx + dx + Math.sin(t + i) * 3, y = cy + dy; list.push({ y, f: () => { const g = k === 'ghost', sh = g ? SPR.sh.g : SPR.sh.s; b.globalAlpha = g ? 0.6 : 1; b.drawImage(sh, Math.round(x - sh.width / 2) + 1, Math.round(y - sh.height / 2)); b.globalAlpha = 1; eyes.push(...drawEnemy(b, x, y, t, k, dx > 0 ? -1 : 1, i * 0.13)); } }); });
    gems.forEach(([x, y], i) => list.push({ y: cy + y, f: () => { const img = SPR.gem[Math.floor(t * 5 + i * 3) % 4]; b.drawImage(img, Math.round(cx + x - img.width / 2), Math.round(cy + y - img.height - 1 + Math.sin(t * 3 + i))); } }));
    list.sort((p, q) => p.y - q.y); for (const o of list) o.f();
    multiply(ENT_A);                                            // characters + props: partially lit (stay readable)
    b.globalCompositeOperation = 'lighter';                     // bloom around warm sources
    const bl = (spr, x, y, a) => { b.globalAlpha = a; b.drawImage(spr, Math.round(x - spr.width / 2), Math.round(y - spr.height / 2)); };
    bl(SPR.B.warm, hx0, hy0 - 21, 0.42 * fl); orbs.forEach(([x, y]) => bl(SPR.B.warm, x, y - 12, 0.55)); bl(SPR.B.red, graves[1][0] + 6, graves[1][1], 0.6); bl(SPR.B.warm, px, py, 0.5);
    b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1;
    // emissive pass (unlit): eyes, carved face, red grave light, lanterns, seed + ember trail, embers
    for (const [x, y, c] of eyes) { b.fillStyle = c; b.fillRect(x, y, 1, 1); }
    const H0 = list.hero, face = SPR.face[fl > 0.95 ? 2 : fl > 0.84 ? 1 : 0]; b.drawImage(H0.flip ? face.l : face.r, H0.dx, H0.dy + H0.s.bob);
    const gx = Math.round(graves[1][0] + 6), gy = Math.round(graves[1][1] + 4), gk = Math.floor(t * 8) % 3;
    b.fillStyle = '#0b0910'; b.fillRect(gx - 2, gy - 7, 5, 8); b.fillStyle = '#3a3a44'; b.fillRect(gx - 1, gy - 6, 3, 1); b.fillStyle = '#8a1a1a'; b.fillRect(gx - 1, gy - 5, 3, 5);
    b.fillStyle = gk === 0 ? '#ff8a5a' : '#ff6a4a'; b.fillRect(gx - 1, gy - 4, 2, 3); b.fillStyle = '#ffe0a0'; b.fillRect(gx, gy - 3 - (gk === 2 ? 1 : 0), 1, 1);
    orbs.forEach(([x, y], k) => { const img = SPR.lantern[Math.floor(t * 10 + k * 7) % 3]; b.drawImage(img, Math.round(x - img.width / 2 + Math.sin(t * 5 + k)), Math.round(y - img.height - 4)); });
    ['#ffc848', '#ff8a1c', '#c8460c', '#7a1c06'].forEach((c, j) => { b.globalAlpha = 1 - j * 0.2; b.fillStyle = c; const s = j < 2 ? 2 : 1; b.fillRect(Math.round(px - (3 + j * 2.2) * 0.95), Math.round(py + (3 + j * 2.2) * 0.29), s, s); });
    b.globalAlpha = 1; b.fillStyle = cs(PAL.seed[3]); b.fillRect(Math.round(px) - 2, Math.round(py) - 1, 4, 3); b.fillStyle = cs(PAL.seed[1]); b.fillRect(Math.round(px) - 2, Math.round(py) + 1, 3, 1);
    for (let k = 0; k < 7; k++) { const a = ((t * 0.7 + k / 7) % 1), x = Math.round(hx0 + 1 + Math.sin(t * 6 + k * 3) + (hash2(k, 0, 5) - 0.5) * 8), y = Math.round(hy0 - 26 - a * 26); b.fillStyle = cs(PAL.fire[a < 0.25 ? 4 : a < 0.5 ? 3 : a < 0.75 ? 2 : 1]); b.fillRect(x, y, 1, 1); }
    // upscale (nearest neighbour), then the HUD in display space: iron frames, pixel numbers, blackletter label
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.fillStyle = PALETTE.ground; ctx.fillRect(0, 0, w, h);
    ctx.drawImage(buf.c, 0, 0, W * up, H * up);
    const k = h / 900, bar = (x, y, bw, bh, frac, fill, seg) => { ctx.fillStyle = '#06070b'; ctx.fillRect(x - 4 * k, y - 4 * k, bw + 8 * k, bh + 8 * k); ctx.fillStyle = '#4d5266'; ctx.fillRect(x - 2 * k, y - 2 * k, bw + 4 * k, bh + 4 * k);
      ctx.fillStyle = '#0b0c13'; ctx.fillRect(x, y, bw, bh); fill.forEach(([c, a, z]) => { ctx.fillStyle = c; ctx.fillRect(x, y + bh * a, bw * frac, bh * (z - a)); }); ctx.fillStyle = 'rgba(6,7,11,.75)'; for (let s = seg; s < bw * frac; s += seg) ctx.fillRect(x + s, y, 2 * k, bh); };
    bar(24 * k, 14 * k, w - 48 * k, 9 * k, 0.58, [['#c8fff0', 0, 0.2], ['#5fd8bc', 0.2, 0.6], ['#2a9688', 0.6, 0.85], ['#17565a', 0.85, 1]], 32 * k);
    bar(64 * k, 48 * k, 236 * k, 14 * k, 0.8, [['#ffb0a0', 0, 0.15], ['#d8343c', 0.15, 0.6], ['#9a1822', 0.6, 0.85], ['#5c0c14', 0.85, 1]], 26 * k);
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = '#000'; ctx.font = `${Math.round(13 * k)}px Silkscreen, monospace`;
    ctx.fillText('80/100', 312 * k + 2, 56 * k + 2); ctx.fillStyle = '#eadfc8'; ctx.fillText('80/100', 312 * k, 56 * k);
    ctx.textAlign = 'center'; const bx = w / 2 - 90 * k; ctx.fillStyle = '#06070b'; ctx.fillRect(bx - 2 * k, 40 * k, 184 * k, 66 * k); ctx.fillStyle = '#4d5266'; ctx.fillRect(bx, 42 * k, 180 * k, 62 * k); ctx.fillStyle = '#0d0e17'; ctx.fillRect(bx + 2 * k, 44 * k, 176 * k, 58 * k);
    ctx.font = `${Math.round(28 * k)}px Silkscreen, monospace`; ctx.fillStyle = '#000'; ctx.fillText('22:09', w / 2 + 3 * k, 64 * k + 3 * k); ctx.fillStyle = '#e8eefa'; ctx.fillText('22:09', w / 2, 64 * k);
    ctx.font = `${Math.round(18 * k)}px UnifrakturMaguntia, 'Pirata One', serif`; ctx.fillStyle = '#000'; ctx.fillText('Title Text', w / 2 + 2, 90 * k + 2); ctx.fillStyle = '#f0a850'; ctx.fillText('Title Text', w / 2, 90 * k);
  }

  const Starter = { id: 'gothic', name: 'Gothic Night', palette: PALETTE, fonts: ['UnifrakturMaguntia', 'Silkscreen', 'Pirata One', 'IM Fell English'], drawHero, drawEnemy, draw };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['gothic'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
