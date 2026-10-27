/* Native art for the new enemies / upgrades in the 'Gothic Nacht' world – see js/content/ART_API.md.
   Same technique as js/styles/gothic.js: 1 art pixel = 1 world unit, sprites painted per pixel into small canvases
   (moonlight from the upper left, 4–6 tone ramps with ordered dithering, near-black #0b0910 outline).
   The style multiplies a night light map over everything and draws eyes / embers afterwards, so the glowing bits of
   the new enemies (eyes, mouths, fuses, shots) are queued and drawn after the style's world
   overlay as well (the overlay is wrapped once in init). */
(function () {
  'use strict';
  const U = window.U, C = window.Content;
  const TAU = Math.PI * 2;
  const clamp = U.clamp;
  const hx = (h) => U.hex(h);
  const RA = (a) => a.map(hx);
  const cs = (c, a) =>
    a === undefined
      ? 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')'
      : 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')';
  const BY = U.bayer8;
  const dith = (x, y) => BY[((y & 7) << 3) | (x & 7)];
  function pick(r, v, x, y, d) {
    let i = Math.floor(v * r.length + (d ? (dith(x, y) - 0.5) * d : 0));
    return r[i < 0 ? 0 : i >= r.length ? r.length - 1 : i];
  }

  /* ---------- palette (copied from the style, + a few accents for the new family members) ---------- */
  const OUT = hx('#0b0910');
  const PAL = {
    stone: RA(['#1d2030', '#2a2e3e', '#3a3f51', '#4e5466', '#666d7f', '#81889a', '#a2a8b8']),
    moss: RA(['#1d2b1c', '#2a3f25', '#3a5530', '#4f6c3c']),
    iron: RA(['#0e0e15', '#1a1a25', '#2a2a3a', '#424258', '#5e5e78']),
    bark: RA(['#151118', '#1f1922', '#2b232d', '#3a3039', '#4d4049', '#63555c']),
    bone: RA(['#4a473f', '#77746a', '#a5a190', '#d0cbb6', '#ebe7d6']),
    pumpkin: RA(['#3a1206', '#652108', '#93370c', '#bd5314', '#de7826', '#f3a046']),
    flesh: hx('#eeb060'),
    stem: RA(['#1c190f', '#34311a', '#4f4d24', '#6a6832']),
    face: RA(['#b84808', '#ff8a1c', '#ffcc4a', '#fff4c4']),
    scarf: RA(['#2e0b1e', '#4e1632', '#74244a', '#9a3a62']),
    tPurple: RA(['#1c0a24', '#33123c', '#4e1c58', '#6c2a76', '#8a4292', '#ab68b0']),
    tPurple2: RA(['#200a1c', '#3a1234', '#581c4e', '#782a68', '#984284', '#b868a2']),
    tCream: RA(['#3e3022', '#625038', '#8a7650', '#b09c6a', '#d2c28c', '#e8dcae']),
    tLeaf: RA(['#122012', '#1c341c', '#2a4c26', '#3c6532', '#557f42']),
    tWilt: RA(['#3e3420', '#5a4c2a', '#78683a']),
    eyeG: RA(['#2e8a1e', '#6ee03a', '#c8ff7a', '#f4ffd8']),
    ghost: RA(['#1e2840', '#3a4a6c', '#5e7396', '#8aa0c0', '#b6c8de', '#e2ecf6']),
    kPurple: RA(['#160a1a', '#26112c', '#3a1a40', '#522656', '#6c386c', '#865080']),
    kBark: RA(['#1e1812', '#33291c', '#4c3e28', '#665438', '#82704a', '#9a8a60']),
    seed: RA(['#5e4428', '#9a7c4e', '#cdb47e', '#eee0b0', '#fffaea']),
    fire: RA(['#7a1c06', '#c8460c', '#ff8a1c', '#ffc848', '#fff2b8']),
    soul: RA(['#1e6a6a', '#3cc8b0', '#9cffe0', '#eafff8']),
    // new: toxic turnip juice, sickly spitter skin, beetroot, parsnip, ram horn
    tox: RA(['#0e2008', '#1c4010', '#2e6e16', '#4ea622', '#86e03a', '#c8ff7a', '#f4ffd8']),
    sick: RA(['#2c3020', '#474e30', '#6a7446', '#8e9a60', '#b2bc80', '#d4dca6']),
    beet: RA(['#24040e', '#46081c', '#700f2a', '#9c1a34', '#c62e3a', '#e8604a']),
    pars: RA(['#2e2216', '#4e3c24', '#76603c', '#9c845a', '#bea67a', '#dccaa0']),
    shawl: RA(['#120f18', '#1d1926', '#2a2536', '#3b354a', '#4f4862']),
    horn: RA(['#140e0a', '#2c2018', '#4a3828', '#6c563c', '#927a56', '#b8a07a']),
  };
  const SOIL = RA(['#1e171c', '#291f25', '#36292e', '#443539', '#554441', '#69574e']);
  const DK = hx('#14061a');

  /* ---------- tiny pixel canvas (same as the style) ---------- */
  class Pix {
    constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); }
    set(x, y, c, a) {
      x = Math.floor(x); y = Math.floor(y);
      if (!c || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      const o = (y * this.w + x) * 4;
      this.d[o] = c[0]; this.d[o + 1] = c[1]; this.d[o + 2] = c[2]; this.d[o + 3] = a === undefined ? 255 : a;
    }
    al(x, y) {
      x = Math.floor(x); y = Math.floor(y);
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
      return this.d[(y * this.w + x) * 4 + 3];
    }
    rect(x, y, w, h, c, a) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c, a); }
    line(x0, y0, x1, y1, c, a) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy, n = 0;
      for (;;) {
        this.set(x0, y0, typeof c === 'function' ? c(x0, y0, n++) : c, a);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
    }
    ell(cx, cy, rx, ry, fn) {
      for (let y = Math.floor(cy - ry) - 1; y <= Math.ceil(cy + ry); y++) {
        for (let x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx); x++) {
          const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
          if (nx * nx + ny * ny <= 1) fn(x, y, nx, ny);
        }
      }
    }
    /* rotated ellipse: fn gets local normals */
    ellR(cx, cy, rx, ry, ang, fn) {
      const R = Math.max(rx, ry) + 1, ca = Math.cos(ang), sa = Math.sin(ang);
      for (let y = Math.floor(cy - R); y <= Math.ceil(cy + R); y++) {
        for (let x = Math.floor(cx - R); x <= Math.ceil(cx + R); x++) {
          const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
          const nx = (dx * ca + dy * sa) / rx, ny = (-dx * sa + dy * ca) / ry;
          if (nx * nx + ny * ny <= 1) fn(x, y, nx, ny);
        }
      }
    }
    poly(pts, fn) {
      let y0 = Infinity, y1 = -Infinity;
      for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
      for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
        const yc = y + 0.5, xs = [];
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], b = pts[(i + 1) % pts.length];
          if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + ((yc - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
        }
        xs.sort((p, q) => p - q);
        for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - 0.5); x < xs[k + 1] - 0.5; x++) fn(x, y);
      }
    }
    outline(c, diag) {
      const o = new Pix(this.w + 2, this.h + 2);
      for (let y = 0; y < o.h; y++) {
        for (let x = 0; x < o.w; x++) {
          const sx = x - 1, sy = y - 1;
          if (this.al(sx, sy) > 0) {
            const s = (sy * this.w + sx) * 4, t = (y * o.w + x) * 4;
            o.d[t] = this.d[s]; o.d[t + 1] = this.d[s + 1]; o.d[t + 2] = this.d[s + 2]; o.d[t + 3] = this.d[s + 3];
          } else if (this.al(sx - 1, sy) || this.al(sx + 1, sy) || this.al(sx, sy - 1) || this.al(sx, sy + 1) ||
            (diag && (this.al(sx - 1, sy - 1) || this.al(sx + 1, sy - 1) || this.al(sx - 1, sy + 1) || this.al(sx + 1, sy + 1)))) {
            o.set(x, y, c);
          }
        }
      }
      return o;
    }
    canvas() {
      const { c, ctx } = U.canvas(this.w, this.h);
      const img = ctx.createImageData(this.w, this.h);
      img.data.set(this.d);
      ctx.putImageData(img, 0, 0);
      return c;
    }
  }

  const LD = (() => { const l = [-0.52, -0.64, 0.56]; const n = Math.hypot(l[0], l[1], l[2]); return l.map((v) => v / n); })();
  function shade(nx, ny) {
    const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    return nx * LD[0] + ny * LD[1] + nz * LD[2];
  }

  /* sprite record: drawn with feet column ax / row ay at the entity position. glow = emissive pixels [x, y, colour] */
  function mk(pix, ax, ay, glow) {
    const r = pix.canvas();
    const s = { r, l: U.flipX(r), w: pix.w, h: pix.h, ax, ay, glow: glow || [], glowL: null, wr: null, wl: null };
    s.glowL = s.glow.map((e) => [pix.w - 1 - e[0], e[1], e[2]]);
    s.wr = U.tint(r, '#ffffff'); s.wl = U.flipX(s.wr);
    return s;
  }
  const flipPt = (s, pt) => (pt ? [s.w - 1 - pt[0], pt[1]] : null);

  /* light sprite: banded radial falloff with dithered band edges (copied from the style) */
  function makeLight(rx, ry, inner, outer, maxA, bands, pw) {
    const w = Math.ceil(rx) * 2, h = Math.ceil(ry) * 2;
    const p = new Pix(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dd = Math.hypot((x + 0.5 - w / 2) / rx, (y + 0.5 - h / 2) / ry);
      if (dd >= 1) continue;
      const f = Math.pow(1 - dd, pw);
      let q = Math.floor(f * bands + (dith(x, y) - 0.5) * 0.55 + 0.35) / bands;
      q = clamp(q, 0, 1);
      if (q <= 0) continue;
      p.set(x, y, U.mix(outer, inner, q), Math.round(q * maxA * 255));
    }
    return p.canvas();
  }
  function shadowEll(rx, ry, a) {
    const p = new Pix(Math.ceil(rx * 2), Math.ceil(ry * 2));
    p.ell(p.w / 2, p.h / 2, rx, ry, (x, y, nx, ny) => { if (nx * nx + ny * ny < 0.55 || dith(x, y) > 0.5) p.set(x, y, [6, 6, 14], a); });
    return p.canvas();
  }
  function makeDirt(w) {
    const p = new Pix(w, 6);
    p.ell(w / 2, 4, w / 2, 3, (x, y, nx, ny) => p.set(x, y, pick(SOIL, 0.55 + shade(nx, ny) * 0.4 + (U.hash2(x, y, w) - 0.5) * 0.3, x, y, 0.5)));
    for (let x = 0; x < w; x++) if (p.al(x, 3) && U.hash2(x, 1, 7) < 0.3) p.set(x, 2, SOIL[4]);
    return p.outline(OUT).canvas();
  }

  /* leaf blade like the creeper's */
  function leaf(p, bx0, by0, deg, len, wid, LF, wiltCol) {
    const a = (deg * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
    const mx = bx0 + (ca * len) / 2, my = by0 + (sa * len) / 2;
    for (let y = Math.floor(my - len); y <= Math.ceil(my + len); y++) {
      for (let x = Math.floor(mx - len); x <= Math.ceil(mx + len); x++) {
        const dx = x + 0.5 - mx, dy = y + 0.5 - my;
        const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
        const t = (lx / (len / 2) + 1) / 2;
        const wdt = wid * Math.sin(Math.PI * clamp(t, 0, 1) * 0.9 + 0.15);
        if (Math.abs(lx) > len / 2 || Math.abs(ly) > wdt) continue;
        let c = ly < -0.4 ? LF[3] : ly > 0.5 ? LF[1] : LF[2];
        if (Math.abs(ly) < 0.35 && t > 0.15) c = LF[1];
        if (wiltCol && t > 0.8) c = wiltCol[ly < 0 ? 2 : 1];
        p.set(x, y, c);
      }
    }
  }

  /* =========================================================================
     Enemy sprites (all face right; flipped copies for the left)
     ========================================================================= */
  function makeSpitter(fr, swell, recoil) {
    const W = 28, H = 30;
    const p = new Pix(W, H);
    const PU = PAL.tPurple2, CR = PAL.sick, TX = PAL.tox, LF = PAL.tLeaf;
    const bob = [0, -1, 0, -1][fr], tilt = [0, 1, 0, -1][fr];
    const cx = 10.5 + tilt * 0.5 - recoil, cy = 17 + bob + recoil;
    const rx = 7.3 + swell * 1.5 + recoil * 0.9, ry = 7.1 + swell * 0.9 - recoil * 0.9;
    // root legs
    const legs = [[cx - 4, fr === 1 ? 1 : 0, fr === 1 ? 1 : 0], [cx + 2, fr === 3 ? 1 : 0, fr === 3 ? 1 : 0]];
    for (const [lx0, lift, fwd] of legs) {
      const lx = Math.round(lx0) + fwd;
      for (let y = 23; y <= 27 - lift; y++) { p.set(lx, y, CR[1]); p.set(lx + 1, y, CR[2]); }
      p.set(lx - 1, 28 - lift, CR[1]); p.set(lx, 28 - lift, CR[1]); p.set(lx + 1, 28 - lift, CR[0]); p.set(lx + 2, 28 - lift, CR[1]);
    }
    // leaves (swept back)
    const sway = [0, 7, 0, -7][fr] - recoil * 14;
    for (const [deg, len] of [[-112, 8.5], [-148, 7], [-80, 6]]) {
      const a = ((deg + sway) * Math.PI) / 180;
      leaf(p, cx + Math.cos(a) * 1.2, cy - ry + 1 + Math.sin(a) * 0.6, deg + sway, len, 1.9, LF, PAL.tWilt);
      p.line(cx, cy - ry + 1, cx + Math.cos(a) * 1.2, cy - ry + 1 + Math.sin(a) * 0.6, PU[1]);
    }
    // bulb: purple top mottled with toxic green, sickly cream belly
    p.ell(cx, cy, rx, ry, (x, y, nx, ny) => {
      const l = shade(nx, ny);
      const tt = ny - (0.12 + 0.1 * Math.sin(nx * 5 + 1));
      const purple = tt < -0.06 || (tt < 0.08 && dith(x, y) > (tt + 0.06) / 0.14);
      const v = 0.42 + l * 0.45;
      const m = U.perlin(nx * 2.4 + 3.1, ny * 2.4 + 1.7, 7);
      if (m > 0.2 && ny < 0.55) { p.set(x, y, pick(TX, v - 0.06 + (m > 0.38 ? 0.08 : 0), x, y, 0.3)); return; }
      p.set(x, y, pick(purple ? PU : CR, purple ? v + 0.05 : v - 0.02, x, y, 0.3));
    });
    // puffed cheek
    if (swell > 0.2) {
      const ccx = cx + rx * 0.42, ccy = cy + ry * 0.2, cr = 1.2 + swell * 1.6;
      p.ell(ccx, ccy, cr, cr * 0.85, (x, y, nx, ny) => p.set(x, y, pick(CR, 0.62 + shade(nx, ny) * 0.3, x, y, 0.3)));
    }
    // snout tube
    const sy = Math.round(cy + 1.5), hh = 2 + Math.round(swell * 0.6);
    const bx = Math.round(cx + rx - 3), ex = Math.round(cx + rx + 3.5 + swell * 0.6 - recoil * 2.2);
    for (let x = bx; x <= ex - 2; x++) for (let y = sy - hh; y <= sy + hh; y++) {
      const ny = (y - sy) / (hh + 0.5);
      const v = 0.55 - ny * 0.32 + (x === ex - 2 ? 0.08 : 0);
      p.set(x, y, pick(PU, v, x, y, 0.3));
    }
    for (let y = sy - hh - 1; y <= sy + hh + 1; y++) {
      const ny = (y - sy) / (hh + 1);
      p.set(ex - 1, y, TX[ny < -0.4 ? 5 : ny < 0.3 ? 4 : 3]);
      p.set(ex, y, Math.abs(y - sy) >= hh ? TX[ny < 0 ? 4 : 2] : hx('#071204'));
    }
    const mouth = [ex + 1, sy + 1];
    // drool
    if (!recoil) {
      const dl = [2, 3, 2, 1][fr];
      for (let k = 1; k <= dl; k++) p.set(ex - 1, sy + hh + 1 + k, TX[k === dl ? 5 : 4]);
    }
    // eyes + angry brow above the snout
    const ex0 = Math.round(cx) + 1, ey = Math.round(cy) - 3 - Math.round(swell * 0.5);
    p.set(ex0 - 1, ey - 2, DK); p.set(ex0, ey - 1, DK); p.set(ex0 + 1, ey - 1, DK);
    p.set(ex0 + 6, ey - 2, DK); p.set(ex0 + 5, ey - 1, DK); p.set(ex0 + 4, ey - 1, DK);
    const eyes = [[ex0, ey, 1], [ex0 + 1, ey, 2], [ex0 + 4, ey, 2], [ex0 + 5, ey, 1], [ex0 + 1, ey + 1, 0], [ex0 + 4, ey + 1, 0]];
    for (const [x, y, l] of eyes) p.set(x, y, PAL.eyeG[l + 1]);
    // taproot + root hairs
    p.set(Math.round(cx), Math.round(cy + ry), CR[2]); p.set(Math.round(cx) - 1, Math.round(cy + ry) + 1, CR[1]);
    p.set(Math.round(cx - rx), Math.round(cy + 3), CR[1]); p.set(Math.round(cx - rx) - 1, Math.round(cy + 4), CR[0]);
    const o = p.outline(OUT);
    const s = mk(o, Math.round(cx) + 1, o.h - 1, eyes.filter((e) => e[2] > 0).map(([x, y, l]) => [x + 1, y + 1, cs(PAL.eyeG[l + 1])]));
    s.mouth = [mouth[0] + 1, mouth[1] + 1];
    s.hh = hh;
    return s;
  }

  function makeBomber(fr, swell) {
    const W = 20, H = 24;
    const p = new Pix(W, H);
    const BE = PAL.beet, LF = PAL.tLeaf;
    const bob = [0, -1, 0, -1][fr];
    const cx = 9.5, cy = 13 + bob - swell;
    const rx = 6.2 + swell, ry = 5.9 + swell;
    // scurrying root legs (3 visible)
    const lifts = [[1, 0, 1], [0, 1, 0], [0, 1, 0], [1, 0, 1]][fr];
    const fwd = [[1, -1, 1], [0, 0, 0], [-1, 1, -1], [0, 0, 0]][fr];
    [-3, 0, 3].forEach((dx, i) => {
      const lx = Math.round(cx + dx) + fwd[i];
      const top = Math.round(cy + ry) - 2, bot = 21 - lifts[i];
      for (let y = top; y <= bot; y++) p.set(lx, y, PAL.pars[i === 1 ? 1 : 2]);
      p.set(lx + (i === 0 ? -1 : 1), bot + 1, PAL.pars[1]); p.set(lx, bot + 1, PAL.pars[2]);
    });
    // beet leaves with magenta stems
    for (const [deg, len, sx] of [[-118, 6, -1], [-70, 5.5, 1]]) {
      const a = (deg * Math.PI) / 180;
      const x0 = cx + sx * 0.5, y0 = cy - ry + 0.5, x1 = x0 + Math.cos(a) * 3, y1 = y0 + Math.sin(a) * 3;
      p.line(x0, y0, x1, y1, BE[4]);
      leaf(p, x1, y1, deg + sx * 12, len, 1.7, LF, null);
    }
    // body
    p.ell(cx, cy, rx, ry, (x, y, nx, ny) => {
      let v = 0.4 + shade(nx, ny) * 0.5;
      if (Math.abs(ny - 0.45 - nx * nx * 0.2) < 0.06 || Math.abs(ny - 0.75 - nx * nx * 0.15) < 0.05) v -= 0.14;
      p.set(x, y, pick(BE, v, x, y, 0.3));
    });
    // crown + tail root
    p.set(Math.round(cx), Math.round(cy - ry), BE[1]); p.set(Math.round(cx) - 1, Math.round(cy - ry), BE[2]);
    p.set(Math.round(cx) - 1, Math.round(cy + ry), BE[2]); p.set(Math.round(cx) - 2, Math.round(cy + ry) + 1, BE[1]);
    // mean face
    const fx = Math.round(cx) + 1, ey = Math.round(cy) - 1;
    p.set(fx - 1, ey - 2, DK); p.set(fx, ey - 1, DK); p.set(fx + 4, ey - 2, DK); p.set(fx + 3, ey - 1, DK);
    p.set(fx + 1, ey - 1, DK); p.set(fx + 2, ey - 1, DK);
    const eyes = [[fx, ey, PAL.fire[3]], [fx + 3, ey, PAL.fire[3]], [fx + 1, ey, PAL.fire[1]]];
    for (const [x, y, c] of eyes) p.set(x, y, c);
    for (let x = fx - 1; x <= fx + 3; x++) p.set(x, ey + 3, DK);
    p.set(fx - 2, ey + 2, DK); p.set(fx + 4, ey + 2, DK); p.set(fx, ey + 3, PAL.bone[3]); p.set(fx + 2, ey + 3, PAL.bone[3]);
    // highlight
    p.set(Math.round(cx - rx * 0.45), Math.round(cy - ry * 0.5), BE[5]);
    const o = p.outline(OUT);
    const s = mk(o, Math.round(cx) + 1, o.h - 1, eyes.slice(0, 2).map(([x, y, c]) => [x + 1, y + 1, cs(c)]));
    s.fuse = [Math.round(cx) + 1, Math.round(cy - ry) + 1];
    s.redR = U.tint(s.r, '#ff2a14'); s.redL = U.flipX(s.redR);
    return s;
  }

  function makeCharger(pose, fr) {
    const W = 38, H = 33;
    const p = new Pix(W, H);
    const PA = PAL.pars, HO = PAL.horn, LF = PAL.tLeaf;
    let ang = 0, st = 1, bob = 0;
    if (pose === 'trot') bob = [0, -1, 0, -1][fr];
    if (pose === 'rear') ang = -0.36;
    if (pose === 'scrape') ang = -0.12;
    if (pose === 'dash') { ang = 0.18; st = 1.12; }
    if (pose === 'stand') { ang = 0.05; bob = 1; }
    const pvx = pose === 'rear' ? -5 : 0; // rear up around the hind legs
    const px0 = 15 + pvx, py0 = 22 + bob;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const T = (lx, ly) => [px0 + (lx - pvx) * ca - ly * sa, py0 + (lx - pvx) * sa + ly * ca];
    const FOOT = 30;
    let legs; // [local x, far, lift, forward]
    if (pose === 'trot') {
      const L = [[0, 1, 1, 0], [1, 0, 0, 1], [0, 1, 1, 0], [1, 0, 0, 1]][fr];
      const F = [[1, -1, -1, 1], [0, 0, 0, 0], [-1, 1, 1, -1], [0, 0, 0, 0]][fr];
      legs = [[-6, 1, L[0], F[0]], [5, 1, L[1], F[1]], [-3, 0, L[2], F[2]], [7, 0, L[3], F[3]]];
    } else if (pose === 'rear') legs = [[-6, 1, 0, -1], [5, 1, 5, 3], [-3, 0, 0, 1], [7, 0, 7, 4]];
    else if (pose === 'scrape') legs = [[-6, 1, 0, 0], [5, 1, 0, 0], [-3, 0, 0, 0], [7, 0, 1, -4]];
    else if (pose === 'dash') legs = [[-6, 1, 1, -4], [5, 1, 1, 4], [-3, 0, 2, -5], [7, 0, 2, 5]];
    else legs = [[-6, 1, 0, -1], [5, 1, 0, 1], [-3, 0, 0, 0], [7, 0, 0, 0]];
    const drawLeg = (lg) => {
      const [lx, far, lift, f] = lg;
      const [tx, ty] = T(lx, 1);
      const fxp = Math.round(tx + f), fyp = Math.min(FOOT - lift, Math.round(ty) + 7);
      p.line(tx - 1, ty, fxp - 1, fyp, PA[far ? 0 : 2]);
      p.line(tx, ty, fxp, fyp, PA[far ? 1 : 3]);
      p.line(tx + 1, ty, fxp + 1, fyp, PA[far ? 0 : 1]);
      p.set(fxp - 1, fyp + 1, PA[0]); p.set(fxp, fyp + 1, PA[far ? 0 : 1]); p.set(fxp + 1, fyp + 1, PA[far ? 0 : 1]); p.set(fxp + 2, fyp + 1, PA[0]);
    };
    legs.filter((l) => l[1]).forEach(drawLeg);
    // curled ram horn: spiral around the side of the head, transverse ridges
    const horn = (ox, oy, dark) => {
      // painted into its own layer and outlined, so the curl reads as a curl against the head
      const q = new Pix(W, H);
      const N = 52;
      const [hcx, hcy] = T(7.4 * st + ox, -4.4 + oy);
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const th = -1.75 - t * 7.6, r = 5.9 - t * 4.7, w = 1.55 - t * 0.7;
        const x = hcx + Math.cos(th) * r, y = hcy + Math.sin(th) * r;
        const ridge = Math.floor(t * 13) % 2 === 0;
        q.ell(x, y, w, w, (xx, yy, nx, ny) => {
          const v = 0.56 + shade(nx, ny) * 0.36 - t * 0.12 + (ridge ? 0.1 : -0.05) - dark;
          q.set(xx, yy, pick(HO, v, xx, yy, 0.2));
        });
      }
      const o = q.outline(OUT);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (o.al(x + 1, y + 1)) { const k = ((y + 1) * o.w + x + 1) * 4; p.set(x, y, [o.d[k], o.d[k + 1], o.d[k + 2]]); }
    };
    horn(-2.2, -0.8, 0.3);
    // parsnip leaves on the shoulders
    {
      const [lx, ly] = T(-1, -9.5);
      for (const [deg, len] of [[-128, 7], [-100, 8.5], [-152, 6], [-76, 5.5]]) leaf(p, lx, ly, deg + ang * 40, len, 1.7, LF, PAL.tWilt);
    }
    // tapering root tail
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const [x, y] = T(-9 * st - t * 4, -2 + t * 3);
      const r = 2.4 * (1 - t) + 0.4;
      p.ell(x, y, r, r, (xx, yy, nx, ny) => p.set(xx, yy, pick(PA, 0.4 + shade(nx, ny) * 0.35, xx, yy, 0.3)));
    }
    p.set(...T(-14 * st, 1.8), PA[1]);
    // body: a stout parsnip, thick at the shoulders, tapering backwards
    {
      const [bx, by] = T(0, -4);
      const rx = 10 * st, ry = 7.6;
      const R = rx + 2;
      for (let y = Math.floor(by - R); y <= Math.ceil(by + R); y++) for (let x = Math.floor(bx - R); x <= Math.ceil(bx + R); x++) {
        const dx = x + 0.5 - bx, dy = y + 0.5 - by;
        const lx = (dx * ca + dy * sa) / rx, ly = (-dx * sa + dy * ca) / ry;
        const k = 0.72 + 0.28 * clamp(lx, -1, 1);
        const nyy = ly / k;
        if (lx * lx + nyy * nyy > 1) continue;
        let v = 0.42 + shade(lx, nyy) * 0.46;
        if (Math.abs(((lx * 3.4 + 10) % 1) - 0.5) < 0.06 && nyy > -0.75 && nyy < 0.8) v -= 0.15;
        if (nyy > 0.55) v -= 0.06;
        p.set(x, y, pick(PA, v, x, y, 0.3));
      }
    }
    legs.filter((l) => !l[1]).forEach(drawLeg);
    // blocky lowered head + roman-nosed muzzle
    const [hx0, hy0] = T(10.2 * st, -0.5);
    p.ellR(hx0, hy0, 4.6, 4.9, ang, (x, y, nx, ny) => p.set(x, y, pick(PA, 0.5 + shade(nx, ny) * 0.42, x, y, 0.3)));
    const [mx, my] = T(13.2 * st, 2);
    p.ellR(mx, my, 2.7, 2.8, ang + 0.3, (x, y, nx, ny) => p.set(x, y, pick(PA, 0.44 + shade(nx, ny) * 0.4, x, y, 0.3)));
    // eye, nostril, mouth (before the horn so the curl frames the eye)
    const [ex, ey] = T(12.4 * st, -1.0);
    p.set(ex - 1, ey - 1, DK); p.set(ex, ey - 1, DK); p.set(ex + 1, ey - 1, DK); p.set(ex + 2, ey - 2, DK);
    p.set(ex, ey, DK); p.set(ex + 1, ey, DK);
    const [nx0, ny0] = T(15.2 * st, 2.2);
    p.set(nx0, ny0, DK);
    const [m0x, m0y] = T(13 * st, 4.3), [m1x, m1y] = T(15 * st, 4);
    p.line(m0x, m0y, m1x, m1y, PA[0]);
    horn(0, 0, 0);
    const o = p.outline(OUT);
    const s = mk(o, Math.round(15) + 1, o.h - 1, []);
    s.eye = [Math.round(ex) + 1, Math.round(ey) + 1];
    s.head = [Math.round(hx0) + 1, Math.round(hy0) - 7];
    s.silR = U.tint(s.r, cs(PAL.pars[4])); s.silL = U.flipX(s.silR);
    return s;
  }

  function makeMother(fr, sx, sy) {
    const W = 42, H = 48;
    const p = new Pix(W, H);
    const PU = PAL.tPurple, CR = PAL.tCream, SC = PAL.shawl, KB = PAL.kBark, LF = PAL.tLeaf;
    const bob = [0, 1, 0, 1][fr];
    const rx = 12.5 * sx, ry = 12 * sy;
    const cx = 18, cy = 45 - 4 - ry + bob;
    // legs
    const lifts = [[0, 0], [1, 0], [0, 0], [0, 1]][fr];
    [[cx - 6, lifts[0], 1], [cx + 2, lifts[1], 0]].forEach(([lx0, lf, far]) => {
      const lx = Math.round(lx0);
      for (let y = Math.round(cy + ry) - 3; y <= 45 - lf; y++) { p.set(lx, y, CR[far ? 0 : 1]); p.set(lx + 1, y, CR[far ? 1 : 2]); p.set(lx + 2, y, CR[far ? 0 : 1]); }
      for (let x = lx - 1; x <= lx + 3; x++) p.set(x, 46 - lf, CR[x === lx + 3 ? 0 : 1]);
    });
    // old wilted leaves behind
    const top = cy - ry;
    for (const [deg, len] of [[-150, 9], [-30, 8.5], [-115, 7]]) leaf(p, cx + Math.cos((deg * Math.PI) / 180) * 2, top + 2, deg, len, 1.8, [PAL.tWilt[0], PAL.tWilt[0], PAL.tWilt[1], PAL.tWilt[2]], null);
    // body
    p.ell(cx, cy, rx, ry, (x, y, nx, ny) => {
      const l = shade(nx, ny);
      const tt = ny - (0.1 + 0.08 * Math.sin(nx * 4 + 2));
      const purple = tt < -0.06 || (tt < 0.08 && dith(x, y) > (tt + 0.06) / 0.14);
      let v = 0.4 + l * 0.44;
      // wrinkles
      const wr = Math.sin(ny * 19 + Math.sin(nx * 6) * 1.6);
      if (wr > 0.86 && Math.abs(nx) < 0.85) v -= 0.15;
      p.set(x, y, pick(purple ? PU : CR, purple ? v + 0.03 : v - 0.04, x, y, 0.3));
    });
    // shawl / headscarf: covers the crown and falls down both sides
    const shawlAt = (nx, ny) => ny < -0.38 + nx * nx * 0.25 || (Math.abs(nx) > 0.74 && ny < 0.42 && nx < 0.95);
    const edge = [];
    p.ell(cx, cy, rx + 0.6, ry + 0.6, (x, y, nx, ny) => {
      if (!shawlAt(nx, ny)) return;
      if (nx > 0.6 && ny > -0.5) return; // face side stays open on the right
      let v = 0.42 + shade(nx, ny) * 0.5;
      const fold = Math.sin(nx * 9 + ny * 3);
      if (fold > 0.75) v -= 0.12;
      p.set(x, y, pick(SC, v, x, y, 0.3));
      edge.push([x, y]);
    });
    // fringe under the shawl edge
    for (const [x, y] of edge) {
      if (!p.al(x, y + 1)) continue;
      const nx = (x + 0.5 - cx) / (rx + 0.6), ny = (y + 1.5 - cy) / (ry + 0.6);
      if (!shawlAt(nx, ny) || (nx > 0.6 && ny > -0.5)) {
        p.set(x, y, PAL.bone[(x & 1) ? 3 : 2]);
        if ((x % 3) === 0) p.set(x, y + 1, PAL.bone[1]);
      }
    }
    // gold brooch
    const bx = Math.round(cx + rx * 0.62), byy = Math.round(cy - ry * 0.42);
    p.set(bx, byy, hx('#e0b440')); p.set(bx + 1, byy, hx('#b08020')); p.set(bx, byy + 1, hx('#7a4e14'));
    // face (old, heavy-lidded)
    const fx = Math.round(cx) + 3, ey = Math.round(cy) - 3;
    for (const x of [fx, fx + 1, fx + 2, fx + 5, fx + 6, fx + 7]) p.set(x, ey - 1, DK);
    p.set(fx - 1, ey, DK); p.set(fx + 8, ey, DK);
    const eyes = [[fx, ey, 1], [fx + 1, ey, 2], [fx + 6, ey, 2], [fx + 7, ey, 1]];
    for (const [x, y, l] of eyes) p.set(x, y, PAL.eyeG[l]);
    p.set(fx - 1, ey + 2, CR[1]); p.set(fx + 8, ey + 2, CR[1]); p.set(fx - 2, ey + 1, CR[1]);
    // knobbly nose
    p.ell(fx + 4, ey + 2.4, 1.6, 1.5, (x, y, nx, ny) => p.set(x, y, pick(CR, 0.6 + shade(nx, ny) * 0.4, x, y, 0.2)));
    p.set(fx + 4, ey + 4, CR[1]);
    // downturned mouth with one tooth
    p.set(fx + 1, ey + 6, DK); p.set(fx + 2, ey + 5, DK); p.set(fx + 3, ey + 5, DK); p.set(fx + 4, ey + 5, DK); p.set(fx + 5, ey + 5, DK); p.set(fx + 6, ey + 6, DK);
    p.set(fx + 3, ey + 6, PAL.bone[3]);
    // arm + gnarled cane
    const caneX = Math.round(cx + rx + 2) + [0, 1, 0, -1][fr];
    p.line(cx + rx - 3, cy + 3, caneX, cy + 1, CR[2]);
    p.line(cx + rx - 3, cy + 4, caneX, cy + 2, CR[1]);
    for (let y = Math.round(cy - 2); y <= 46; y++) {
      const wob = Math.round(Math.sin(y * 0.7) * 0.5);
      p.set(caneX + wob, y, KB[3]); p.set(caneX + 1 + wob, y, KB[1]);
      if (y % 5 === 0) p.set(caneX + 2 + wob, y, KB[2]);
    }
    p.set(caneX - 1, cy - 3, KB[4]); p.set(caneX - 2, cy - 2, KB[3]); p.set(caneX, cy - 3, KB[4]); p.set(caneX + 1, cy - 2, KB[2]);
    p.set(caneX, cy + 1, CR[3]); p.set(caneX + 1, cy + 1, CR[2]); p.set(caneX, cy + 2, CR[2]);
    // crown of baby sprouts
    const babies = [[cx - 6.5, top + 2.5, 0], [cx + 0.5, top - 0.5, 1], [cx + 6.5, top + 2.5, 2]];
    const glow = eyes.filter((e) => e[2] > 1).map(([x, y]) => [x + 1, y + 1, cs(PAL.eyeG[2])]);
    for (const [bx0, by0, k] of babies) {
      const bb = (fr + k) % 2 === 0 ? 0 : -1;
      const by1 = by0 + bb;
      leaf(p, bx0, by1 - 2, -90 + (k - 1) * 30, 4.5, 1.2, LF, null);
      p.ell(bx0, by1, 2.8, 2.5, (x, y, nx, ny) => p.set(x, y, pick(ny < 0.05 ? PAL.tPurple2 : CR, 0.55 + shade(nx, ny) * 0.4, x, y, 0.3)));
      const e1 = [Math.round(bx0), Math.round(by1)], e2 = [Math.round(bx0) + 2, Math.round(by1)];
      p.set(e1[0], e1[1], PAL.eyeG[1]); p.set(e2[0], e2[1], PAL.eyeG[1]);
      glow.push([e1[0] + 1, e1[1] + 1, cs(PAL.eyeG[1])], [e2[0] + 1, e2[1] + 1, cs(PAL.eyeG[1])]);
    }
    const o = p.outline(OUT);
    const s = mk(o, Math.round(cx) + 1, o.h - 1, glow);
    s.babyEyes = glow.slice(2);
    return s;
  }

  function makeSprout(fr) {
    const W = 13, H = 17;
    const p = new Pix(W, H);
    const PU = PAL.tPurple, CR = PAL.tCream, LF = PAL.tLeaf;
    const bob = [0, -1, 0, -1][fr];
    const cx = 5.5, cy = 9 + bob;
    // pitter-patter legs
    const lf = [[0, 1], [0, 0], [1, 0], [0, 0]][fr], fw = [[1, -1], [0, 0], [-1, 1], [0, 0]][fr];
    [[cx - 2, 0], [cx + 1, 1]].forEach(([lx0, i]) => {
      const lx = Math.round(lx0) + fw[i];
      for (let y = 13; y <= 14 - lf[i]; y++) p.set(lx, y, CR[2]);
      p.set(lx, 15 - lf[i], CR[1]); p.set(lx + 1, 15 - lf[i], CR[1]);
    });
    // one big leaf
    leaf(p, cx - 0.5, cy - 4, -98 + [0, 8, 0, -8][fr], 7.5, 1.8, LF, null);
    p.ell(cx, cy, 4.5, 4.2, (x, y, nx, ny) => {
      const tt = ny - (0.0 + 0.12 * Math.sin(nx * 5));
      const purple = tt < -0.06 || (tt < 0.08 && dith(x, y) > (tt + 0.06) / 0.14);
      const v = 0.5 + shade(nx, ny) * 0.45;
      p.set(x, y, pick(purple ? PU : CR, v + (purple ? 0.08 : 0.04), x, y, 0.3));
    });
    p.set(Math.round(cx), Math.round(cy + 4), CR[2]);
    const fx = Math.round(cx) + 1, ey = Math.round(cy) - 1;
    p.set(fx - 1, ey - 1, DK); p.set(fx + 3, ey - 1, DK);
    p.set(fx, ey, PAL.eyeG[2]); p.set(fx + 2, ey, PAL.eyeG[2]);
    p.set(fx, ey + 2, DK); p.set(fx + 1, ey + 2, DK); p.set(fx + 2, ey + 2, DK);
    const o = p.outline(OUT);
    return mk(o, Math.round(cx) + 1, o.h - 1, [[fx + 1, ey + 1, cs(PAL.eyeG[2])], [fx + 3, ey + 1, cs(PAL.eyeG[2])]]);
  }

  /* toxic spit glob (teardrop, pointing along +x, rotated) */
  function makeShot(ang, wob) {
    const N = 13, c0 = 6.5;
    const p = new Pix(N, N);
    const TX = PAL.tox;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const R = 3.1 + wob * 0.35;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const dx = x + 0.5 - c0, dy = y + 0.5 - c0;
      const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
      // head at lx = +1, tail towards -lx
      let inside;
      const hx0 = lx - 0.8;
      if (hx0 >= 0) inside = hx0 * hx0 + ly * ly <= R * R;
      else { const t = -hx0 / 5.2; inside = t < 1 && Math.abs(ly) <= R * (1 - t * t) * (1 - t * 0.2); }
      if (!inside) continue;
      const nx = (lx - 1.4) / R, ny = ly / R;
      const d = Math.hypot(lx - 1.6, ly + (dx < 99 ? 0 : 0));
      let lv = d < 1.1 ? 6 : d < 2.0 ? 5 : 4;
      if (hx0 < -1.5) lv = 3;
      if (-dx * 0.6 - dy * 0.8 < -1.5 && lv < 6) lv -= 1; // moon side light
      void nx; void ny;
      p.set(x, y, TX[lv]);
    }
    // specular
    const o = p.outline(hx('#081204'), false);
    return o.canvas();
  }

  /* =========================================================================
     Icons (14x14 pixel art + outline, scaled up crisp like the style's icons)
     ========================================================================= */
  function seedAt(p, cx, cy, ang, rx, ry) {
    const S = PAL.seed, ca = Math.cos(ang), sa = Math.sin(ang);
    for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
      const b = ry * (lx < 0 ? 1 : 1 - (lx / rx) * 0.6);
      const e = (lx / rx) ** 2 + (ly / b) ** 2;
      if (e > 1) continue;
      p.set(x, y, S[e > 0.6 ? 1 : ly < -b * 0.3 ? 4 : ly < b * 0.2 ? 3 : 2]);
    }
  }
  function iconPix(id) {
    const p = new Pix(14, 14);
    const F = PAL.fire;
    switch (id) {
      case 'leech': {
        // bowl of pumpkin soup, steam, a little heart
        const IR = PAL.iron;
        p.ell(7, 9.5, 6.2, 4, (x, y, nx, ny) => { if (ny > -0.2) p.set(x, y, pick(IR, 0.5 + shade(nx, ny) * 0.5, x, y, 0.3)); });
        for (let x = 1; x <= 13; x++) p.set(x, 8, IR[4]);
        for (let x = 2; x <= 12; x++) p.set(x, 9, x % 4 === 1 ? PAL.pumpkin[5] : PAL.pumpkin[4]);
        p.rect(5, 13, 5, 1, IR[1]);
        for (const bx of [1, 11]) for (let y = 2; y <= 6; y++) p.set(bx + [0, 1, 1, 0, 0][y - 2], y, PAL.bone[y < 4 ? 4 : 3]);
        const R = RA(['#7a0c1c', '#b8142a', '#e2403a', '#ffc4b4']);
        for (const [x, y, l] of [[5, 1, 2], [6, 1, 2], [8, 1, 2], [9, 1, 1], [4, 2, 2], [5, 2, 3], [6, 2, 2], [7, 2, 2], [8, 2, 2], [9, 2, 1], [10, 2, 1], [5, 3, 2], [6, 3, 2], [7, 3, 2], [8, 3, 1], [9, 3, 0], [6, 4, 1], [7, 4, 1], [8, 4, 0], [7, 5, 0]]) p.set(x, y, R[l]);
        break;
      }
      case 'thorns': {
        // spiky armoured turnip shell
        const KB = PAL.kBark;
        for (let k = 0; k < 10; k++) {
          const a = (k / 10) * TAU - Math.PI / 2;
          for (let r = 4; r <= 6.4; r += 0.5) p.set(7 + Math.cos(a) * r, 7.5 + Math.sin(a) * r, KB[r > 5.6 ? 5 : 3]);
        }
        p.ell(7, 7.5, 4.6, 4.6, (x, y, nx, ny) => {
          const top = ny + Math.sin(nx * 7) * 0.08 < 0.1;
          let v = 0.48 + shade(nx, ny) * 0.42;
          if (Math.abs(Math.hypot(nx, ny) - 0.72) < 0.1) v -= 0.18;
          p.set(x, y, pick(top ? PAL.tPurple : PAL.tCream, v, x, y, 0.3));
        });
        p.set(5, 5, PAL.tPurple[5]);
        break;
      }
      case 'dashup': {
        // rolling pumpkin with speed lines
        const PU = PAL.pumpkin;
        p.ell(8.5, 7.5, 5, 5, (x, y, nx, ny) => {
          let v = 0.47 + shade(nx, ny) * 0.42;
          const a = Math.atan2(ny, nx) + 0.6, k = ((a / TAU) * 6 + 6) % 1;
          if (k < 0.12 && Math.hypot(nx, ny) > 0.25) v -= 0.18;
          p.set(x, y, pick(PU, v, x, y, 0.3));
        });
        p.set(11, 3, PAL.stem[3]); p.set(12, 3, PAL.stem[2]); p.set(12, 2, PAL.stem[2]);
        for (const [y, x0, x1] of [[4, 0, 2], [7, 0, 3], [10, 1, 3]]) p.line(x0, y, x1, y, F[y === 7 ? 3 : 2]);
        for (const [x, y] of [[3, 12], [5, 13], [2, 13]]) p.set(x, y, PAL.bone[2]);
        break;
      }
      case 'range': {
        // pumpkin seed on a long dotted arc to a target
        for (let i = 0; i <= 12; i++) { const t = i / 12; const x = 1 + t * 10, y = 12 - Math.sin(t * Math.PI) * 9; if (i % 2 === 0) p.set(x, y, F[2]); }
        seedAt(p, 3, 10, -1.0, 2.8, 1.6);
        const RD = RA(['#4a0610', '#b8142a', '#e2403a']);
        p.ell(11.5, 11.5, 2.4, 2.4, (x, y, nx, ny) => { const d = Math.hypot(nx, ny); p.set(x, y, d > 0.7 ? RD[1] : d > 0.35 ? PAL.bone[3] : RD[2]); });
        break;
      }
      default:
        p.ell(7, 7, 5, 5, (x, y) => p.set(x, y, F[2]));
    }
    return p.outline(OUT, false).canvas();
  }

  /* =========================================================================
     Runtime
     ========================================================================= */
  let SPR = null;
  const ICON = {};
  // emissive queue: drawn after the style's world overlay (light map), like the style's own eyes/embers
  const EP = []; // pixels: x, y, colour
  const ES = []; // sprites: img, x, y, alpha, additive
  let qRT = -1;
  const q0 = (view) => { if (view.rt !== qRT) { qRT = view.rt; EP.length = 0; ES.length = 0; } };
  const px = (x, y, c) => EP.push(x, y, c);
  const sp = (img, x, y, a, add) => ES.push(img, x, y, a, add ? 1 : 0);
  function flushEmissive(ctx) {
    ctx.save();
    for (let i = 0; i < ES.length; i += 5) {
      ctx.globalAlpha = clamp(ES[i + 3], 0, 1);
      ctx.globalCompositeOperation = ES[i + 4] ? 'lighter' : 'source-over';
      ctx.drawImage(ES[i], ES[i + 1], ES[i + 2]);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    for (let i = 0; i < EP.length; i += 3) { ctx.fillStyle = EP[i + 2]; ctx.fillRect(EP[i], EP[i + 1], 1, 1); }
    ctx.restore();
    EP.length = 0; ES.length = 0;
  }
  function hook(style) {
    if (!style || style.__gothicArtHook) return;
    style.__gothicArtHook = true;
    const o = style.drawWorldOverlay;
    style.drawWorldOverlay = function (ctx, view, game) {
      if (o) o.call(this, ctx, view, game);
      flushEmissive(ctx);
    };
  }

  function build() {
    const S = {};
    S.spWalk = [0, 1, 2, 3].map((f) => makeSpitter(f, 0, 0));
    S.spAim = [0.35, 0.7, 1].map((k) => makeSpitter(0, k, 0));
    S.spRecoil = makeSpitter(0, 0, 1);
    S.boWalk = [0, 1, 2, 3].map((f) => makeBomber(f, 0));
    S.boSwell = [0, 1, 2, 3].map((f) => makeBomber(f, 1));
    S.chTrot = [0, 1, 2, 3].map((f) => makeCharger('trot', f));
    S.chRear = makeCharger('rear', 0);
    S.chScrape = makeCharger('scrape', 0);
    S.chDash = makeCharger('dash', 0);
    S.chStand = makeCharger('stand', 0);
    S.moWalk = [0, 1, 2, 3].map((f) => makeMother(f, 1, 1));
    S.moSquash = makeMother(0, 1.12, 0.86);
    S.moStretch = makeMother(0, 0.93, 1.08);
    S.sprout = [0, 1, 2, 3].map((f) => makeSprout(f));
    S.shot = [];
    for (let i = 0; i < 16; i++) S.shot.push([makeShot((i / 16) * TAU, 0), makeShot((i / 16) * TAU, 1)]);
    S.dirtS = makeDirt(14);
    S.dirtL = makeDirt(24);
    S.sh = { xs: shadowEll(4, 1.5, 120), s: shadowEll(6, 2, 120), m: shadowEll(9, 2.5, 120), l: shadowEll(13, 3.5, 120) };
    S.gGreen = makeLight(7, 6, [170, 255, 120], [60, 200, 60], 0.55, 3, 1);
    S.gGreenS = makeLight(4, 4, [170, 255, 120], [60, 200, 60], 0.5, 3, 1);
    S.gRed = makeLight(9, 8, [255, 120, 80], [255, 40, 20], 0.55, 3, 1);
    S.gRedS = makeLight(4, 4, [255, 140, 90], [255, 50, 30], 0.6, 3, 1);
    S.gWarm = makeLight(6, 5, [255, 190, 90], [255, 120, 30], 0.5, 3, 1);
    S.gBirth = makeLight(22, 18, [200, 255, 150], [90, 200, 80], 0.45, 4, 1);
    return S;
  }

  /* shared draw: spawn / death / flash exactly like the style's creeper, returns null if nothing else to draw */
  function body(ctx, e, s, ox, oy, dirt) {
    const flip = e.facing < 0;
    const x = Math.round(e.x) + (ox || 0), y = Math.round(e.y) + (oy || 0);
    const dx = x - (flip ? s.w - 1 - s.ax : s.ax), dy = y - s.ay;
    if (e.dying) {
      if (e.deathT < 0.18) ctx.drawImage(flip ? s.wl : s.wr, dx, dy);
      else if (e.deathT < 0.4) { ctx.globalAlpha = 0.5; ctx.drawImage(flip ? s.wl : s.wr, dx, dy + 1); ctx.globalAlpha = 1; }
      return null;
    }
    if (e.spawnT < 1) {
      const t = U.ease.outQuad(e.spawnT);
      const vh = Math.max(1, Math.round(s.h * t));
      ctx.drawImage(flip ? s.l : s.r, 0, 0, s.w, vh, dx, y - vh + 1, s.w, vh);
      const d = dirt || SPR.dirtS;
      ctx.drawImage(d, Math.round(e.x) - (d.width >> 1), Math.round(e.y) - 4);
      return null;
    }
    ctx.drawImage(flip ? s.l : s.r, dx, dy);
    const fl = e.flash || 0;
    if (fl > 0.05) { ctx.globalAlpha = Math.min(0.6, fl * 0.9); ctx.drawImage(flip ? s.wl : s.wr, dx, dy); ctx.globalAlpha = 1; }
    return { flip, dx, dy, lit: fl < 0.5 };
  }
  function eyes(s, r) {
    const g = r.flip ? s.glowL : s.glow;
    for (let i = 0; i < g.length; i++) px(r.dx + g[i][0], r.dy + g[i][1], g[i][2]);
  }
  const at = (s, r, pt) => (r.flip ? [r.dx + s.w - 1 - pt[0], r.dy + pt[1]] : [r.dx + pt[0], r.dy + pt[1]]);
  void flipPt;

  const TOXC = PAL.tox.map((c) => cs(c));
  const FIREC = PAL.fire.map((c) => cs(c));

  C.art('gothic', {
    init(style) {
      SPR = build();
      for (const id of ['leech', 'thorns', 'dashup', 'range']) ICON[id] = iconPix(id);
      hook(style);
    },
    enemies: {
      spitter(ctx, e, view) {
        q0(view);
        const rt = view.rt;
        let s, ox = 0;
        const aiming = e.mode === 'aim', ch = e.charge || 0, spit = e.spit || 0;
        if (aiming) {
          s = SPR.spAim[ch < 0.34 ? 0 : ch < 0.67 ? 1 : 2];
          if (ch > 0.45) ox = Math.floor(rt * 30) % 2 ? 1 : 0;
        } else if (spit > 0.55) s = SPR.spRecoil;
        else s = SPR.spWalk[Math.floor(e.anim * 1.6) & 3];
        const r = body(ctx, e, s, ox, 0);
        if (!r || !r.lit) return;
        eyes(s, r);
        const [mx, my] = at(s, r, s.mouth);
        const dir = r.flip ? -1 : 1;
        if (aiming) {
          // mouth glows brighter and brighter
          const lv = ch < 0.34 ? 4 : ch < 0.67 ? 5 : 6;
          for (let k = -s.hh + 1; k <= s.hh - 1; k++) px(mx - dir * 1, my + k, TOXC[Math.abs(k) === s.hh - 1 ? lv - 1 : lv]);
          sp(SPR.gGreen, mx - 7, my - 6, 0.25 + ch * 0.7, true);
          if (ch > 0.6 && Math.floor(rt * 14) % 2) px(mx + dir, my - 1 + (Math.floor(rt * 23) % 3), TOXC[5]);
        } else if (spit > 0) {
          // green spray right after the shot
          const k = 1 - spit;
          for (let i = 0; i < 6; i++) {
            const a = (i - 2.5) * 0.32 + (e.seed - 0.5) * 0.3, d = 2 + k * (7 + (i % 3) * 3);
            px(Math.round(mx + dir * Math.cos(a) * d), Math.round(my + Math.sin(a) * d * 0.8 + k * k * 4), TOXC[i % 2 ? 5 : 4]);
          }
          sp(SPR.gGreenS, mx - 4 + dir * 2, my - 4, spit * 0.8, true);
        } else {
          px(mx - dir, my, TOXC[3]);
        }
      },

      bomber(ctx, e, view) {
        q0(view);
        const rt = view.rt;
        const armed = !!e.armed, fz = e.fuse || 0;
        const fi = Math.floor(e.anim * (armed ? 2.6 : 2.2)) & 3;
        const s = armed && fz > 0.4 ? SPR.boSwell[fi] : SPR.boWalk[fi];
        const ox = armed ? (Math.floor(rt * 40) % 2 ? 1 : 0) * (fz > 0.6 ? 1 : 0) : 0;
        const r = body(ctx, e, s, ox, 0);
        if (!r) return;
        // blinking red / white, faster and faster
        let blinkOn = false;
        if (armed) {
          const ph = fz * (3 + fz * 12);
          blinkOn = Math.floor(ph * 2) % 2 === 0;
          if (blinkOn) {
            ctx.globalAlpha = 0.55 + fz * 0.15;
            ctx.drawImage(fz > 0.7 && Math.floor(ph * 4) % 2 ? (r.flip ? s.wl : s.wr) : r.flip ? s.redL : s.redR, r.dx, r.dy);
            ctx.globalAlpha = 1;
          }
        }
        if (!r.lit) return;
        eyes(s, r);
        // fuse cord out of the leaf tuft (burns down once armed)
        const [fx0, fy0] = at(s, r, s.fuse);
        const dir = r.flip ? -1 : 1;
        const cord = [[0, -1], [0, -2], [1, -3], [1, -4], [2, -5], [3, -5]];
        const n = armed ? Math.max(2, Math.round(6 - fz * 4)) : 6;
        ctx.fillStyle = '#3a2c1e';
        for (let i = 0; i < n; i++) ctx.fillRect(fx0 + cord[i][0] * dir, fy0 + cord[i][1], 1, 1);
        ctx.fillStyle = '#0b0910';
        for (let i = 0; i < n; i++) ctx.fillRect(fx0 + cord[i][0] * dir + dir, fy0 + cord[i][1], 1, 1);
        const tip = cord[n - 1];
        const tx = fx0 + tip[0] * dir, ty = fy0 + tip[1] - 1;
        const fl = Math.floor(rt * 18 + e.seed * 9) % 3;
        px(tx, ty, FIREC[4]);
        px(tx + (fl === 0 ? 1 : fl === 1 ? -1 : 0), ty - 1, FIREC[3]);
        if (armed || fl === 2) px(tx, ty - 1, FIREC[2]);
        if (armed) {
          const big = 1 + Math.round(fz * 2);
          for (let i = 0; i < 2 + big * 2; i++) {
            const a = rt * 13 + i * 2.1 + e.seed * 7, d = 1 + ((i * 7 + Math.floor(rt * 20)) % (big + 1));
            px(Math.round(tx + Math.cos(a) * d), Math.round(ty + Math.sin(a) * d), FIREC[2 + (i % 3)]);
          }
          sp(SPR.gRed, Math.round(e.x) - 9, r.dy + 4, blinkOn ? 0.35 + fz * 0.5 : 0.15, true);
        }
        sp(SPR.gWarm, tx - 6, ty - 5, armed ? 0.5 + fz * 0.5 : 0.35, true);
      },

      charger(ctx, e, view) {
        q0(view);
        const rt = view.rt;
        const mode = e.mode || 'chase', mt = e.modeT || 0;
        let s, ox = 0, oy = 0;
        if (mode === 'tele') {
          const k = Math.floor(mt * 11) % 3;
          s = mt < 0.3 ? SPR.chRear : k === 0 ? SPR.chScrape : SPR.chRear;
          ox = Math.floor(rt * 34) % 2 ? 1 : -1;
        } else if (mode === 'dash') s = SPR.chDash;
        else if (mode === 'rest') { s = SPR.chStand; ox = Math.round(Math.sin(mt * 14) * 1.2); }
        else s = SPR.chTrot[Math.floor(e.anim * 1.8) & 3];
        const flip = e.facing < 0;
        if (mode === 'dash' && !e.dying && e.spawnT >= 1) {
          // speed smear: two fading silhouettes behind
          const dX = e.dashX || (flip ? -1 : 1), dY = e.dashY || 0;
          for (let i = 2; i >= 1; i--) {
            ctx.globalAlpha = 0.16 * (3 - i);
            const x = Math.round(e.x - dX * i * 7), y = Math.round(e.y - dY * i * 7);
            ctx.drawImage(flip ? s.silL : s.silR, x - (flip ? s.w - 1 - s.ax : s.ax), y - s.ay);
          }
          ctx.globalAlpha = 1;
        }
        const r = body(ctx, e, s, ox, oy);
        if (!r) return;
        if (mode === 'dash') {
          ctx.fillStyle = cs(PAL.bone[2], 0.7);
          const dir = flip ? 1 : -1;
          for (let i = 0; i < 4; i++) {
            const yy = r.dy + 10 + i * 4, len = 4 + ((i * 5 + Math.floor(rt * 20)) % 5);
            ctx.fillRect(dir > 0 ? r.dx + s.w + 1 : r.dx - len - 1, yy, len, 1);
          }
        }
        if (!r.lit) return;
        const [ex, ey] = at(s, r, s.eye);
        if (mode === 'tele' || mode === 'dash') {
          px(ex, ey, '#fff0d0'); px(ex + (r.flip ? 1 : -1), ey, '#ff4a2a');
          sp(SPR.gRedS, ex - 4, ey - 4, 0.9, true);
          if (mode === 'tele') sp(SPR.gRed, ex - 9, ey - 8, 0.35 + 0.35 * Math.sin(rt * 30), true);
        } else px(ex, ey, '#c8401a');
        if (mode === 'rest') {
          // dizzy: little stars circling the head
          const [hx0, hy0] = at(s, r, s.head);
          for (let i = 0; i < 3; i++) {
            const a = rt * 6 + (i * TAU) / 3;
            const sx = Math.round(hx0 + Math.cos(a) * 6), sy = Math.round(hy0 - 2 + Math.sin(a) * 2);
            const big = Math.sin(a) > 0;
            px(sx, sy, '#fff4b0');
            if (big) { px(sx - 1, sy, '#ffd84a'); px(sx + 1, sy, '#ffd84a'); px(sx, sy - 1, '#ffd84a'); px(sx, sy + 1, '#ffd84a'); }
          }
        }
      },

      mother(ctx, e, view) {
        q0(view);
        const b = e.birth || 0;
        let s;
        if (b > 0.62) s = SPR.moSquash;
        else if (b > 0.3) s = SPR.moStretch;
        else s = SPR.moWalk[Math.floor(e.anim * 1.2) & 3];
        const r = body(ctx, e, s, 0, 0, SPR.dirtL);
        if (!r || !r.lit) return;
        eyes(s, r);
        if (b > 0) {
          sp(SPR.gBirth, Math.round(e.x) - 22, r.dy + s.h - 34, b * 0.55, true);
          const g = r.flip ? s.glowL : s.glow;
          for (let i = 4; i < g.length; i++) px(r.dx + g[i][0], r.dy + g[i][1], '#f4ffd8');
        }
      },

      sprout(ctx, e, view) {
        q0(view);
        const s = SPR.sprout[Math.floor(e.anim * 2.4) & 3];
        const r = body(ctx, e, s, 0, 0);
        if (!r || !r.lit) return;
        eyes(s, r);
      },
    },

    shadow(ctx, o) {
      if (o.dying && o.deathT > 0.4) return true;
      const t = o.type;
      const sh = t === 'mother' ? SPR.sh.l : t === 'charger' ? SPR.sh.m : t === 'sprout' ? SPR.sh.xs : SPR.sh.s;
      ctx.drawImage(sh, Math.round(o.x - sh.width / 2) + 1, Math.round(o.y - sh.height / 2));
      return true;
    },

    shot(ctx, s, view) {
      q0(view);
      const x = Math.round(s.x), y = Math.round(s.y - s.z);
      const ang = s.angle !== undefined ? s.angle : Math.atan2(s.vy, s.vx);
      const fi = ((Math.round((ang / TAU) * 16) % 16) + 16) % 16;
      const wob = Math.floor(view.rt * 12 + s.seed * 10) % 2;
      const img = SPR.shot[fi][wob];
      // dripping trail
      const ca = Math.cos(ang), sa = Math.sin(ang);
      for (let j = 1; j <= 3; j++) {
        const d = 4 + j * 3 + ((Math.floor(view.rt * 20) + j) % 2);
        px(Math.round(x - ca * d), Math.round(y - sa * d + j * 0.5), TOXC[j === 1 ? 5 : j === 2 ? 4 : 3]);
      }
      sp(SPR.gGreen, x - 7, y - 6, 0.75, true);
      sp(img, x - 6, y - 6, 1, false);
    },

    icons: Object.fromEntries(['leech', 'thorns', 'dashup', 'range'].map((id) => [id, (ctx, size) => {
      const img = ICON[id];
      if (!img) return;
      ctx.imageSmoothingEnabled = false;
      const sc = Math.floor(size / 16);
      const w = img.width * sc, h = img.height * sc;
      ctx.drawImage(img, Math.round((size - w) / 2), Math.round((size - h) / 2), w, h);
    }])),
  });
})();
