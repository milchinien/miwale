/* Native art for the new enemies / upgrades in the 'harvest16' world (Herbsternte 16-Bit) – see js/content/ART_API.md.
   Same painter as js/styles/harvest16.js: 1 art pixel = 1 world unit, hue-shifted ramps, top-left light,
   1-px coloured outlines. All sprites are painted procedurally in init(). */
(function () {
  'use strict';
  const U = window.U, C = window.Content;

  /* ---------- palette + painter (copied from the style) ---------- */
  const hx = (s) => U.hex(s);
  const hexes = (a) => a.map(hx);
  const mixc = (a, b, t) => [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
  const INK = hx('#24162a');
  const LV = (() => { const v = [-0.5, -0.6, 0.62]; const l = Math.hypot(v[0], v[1], v[2]); return v.map((a) => a / l); })();
  const lam = (nx, ny, nz) => nx * LV[0] + ny * LV[1] + nz * LV[2];
  const qi = (l, th) => { let i = 0; while (i < th.length && l > th[i]) i++; return i; };
  const R = {
    pk: hexes(['#74282a', '#b0462a', '#de6e2c', '#f59a3c', '#ffc76c']),
    stem: hexes(['#2c4628', '#4a7030', '#6e9c3c']),
    tpur: hexes(['#2c1740', '#4c235f', '#713488', '#9654a8', '#bf80c8']),
    tmag: hexes(['#381634', '#5e2248', '#86325e', '#ad5278', '#d07e98']),
    cream: hexes(['#8a6458', '#b8946e', '#dcc290', '#f2e2b0', '#fff6da']),
    leaf: hexes(['#22402c', '#356432', '#4f8c3a', '#78b246']),
    root: hexes(['#6e5040', '#a2845e', '#cdb282']),
    bark: hexes(['#3a2228', '#5a3428', '#7c4c32', '#9e6c44']),
    wood: hexes(['#3e2420', '#64402a', '#8c5e36', '#b8844c', '#d8aa6a']),
    glow: hexes(['#f2902a', '#ffc640', '#fff2a8']),
    glowB: hexes(['#e07a26', '#ffaa34', '#ffde7a']),
    ice: hexes(['#465482', '#7488bc', '#a6bee2', '#d4e6f6', '#f6fcff']),
    scarf: hexes(['#8e4e26', '#cc842e', '#f2be4c']),
    // new ramps (same hue-shift logic: cool purple shadows → warm highlights)
    tox: hexes(['#1e3a2a', '#2f6a2c', '#4f9a2a', '#86d43a', '#d6ff7a']),
    gcream: hexes(['#5a5a46', '#8a9460', '#b8c27c', '#dbe2a0', '#f4f8cc']),
    beet: hexes(['#3a1028', '#6a1a34', '#a2283c', '#d24a40', '#f6875a']),
    pars: hexes(['#4e3030', '#84603f', '#b48a5e', '#d8b682', '#f2deae']),
    horn: hexes(['#3e2c34', '#6e5650', '#a08a76', '#cfbfa4', '#f2ead6']),
    shawl: hexes(['#3e1430', '#6e2240', '#a23a4c', '#d0606a', '#f4a08c']),
    red: hexes(['#7a1420', '#e0302a', '#ff8a6a']),
  };
  const DARK = hx('#22122c');
  function outlineOf(c) {
    const l = (c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11) / 255;
    return mixc(c, INK, 0.58 + 0.26 * l);
  }
  class Pix {
    constructor(w, h) { this.w = w; this.h = h; this.a = new Array(w * h).fill(null); }
    set(x, y, c) {
      x = Math.floor(x); y = Math.floor(y);
      if (!c || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      this.a[y * this.w + x] = c;
    }
    get(x, y) {
      x = Math.floor(x); y = Math.floor(y);
      return x < 0 || y < 0 || x >= this.w || y >= this.h ? null : this.a[y * this.w + x];
    }
    rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
    rows(x, y, rows, pal) {
      for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) {
        const ch = rows[j][i];
        if (pal[ch]) this.set(x + i, y + j, pal[ch]);
      }
    }
    line(x0, y0, x1, y1, c) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let e = dx + dy, n = 0;
      for (;;) {
        this.set(x0, y0, typeof c === 'function' ? c(n++, x0, y0) : c);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * e;
        if (e2 >= dy) { e += dy; x0 += sx; }
        if (e2 <= dx) { e += dx; y0 += sy; }
      }
    }
    blob(cx, cy, rx, ry, fn) {
      for (let y = Math.floor(cy - ry) - 1; y <= Math.ceil(cy + ry); y++) {
        for (let x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx); x++) {
          const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry, d = nx * nx + ny * ny;
          if (d > 1) continue;
          const c = fn(nx, ny, Math.sqrt(1 - d), x, y);
          if (c) this.set(x, y, c);
        }
      }
    }
    leaf(x0, y0, x1, y1, wmax, ramp, pow = 0.75) {
      const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy, len = Math.sqrt(l2);
      const bx0 = Math.floor(Math.min(x0, x1) - wmax - 1), bx1 = Math.ceil(Math.max(x0, x1) + wmax + 1);
      const by0 = Math.floor(Math.min(y0, y1) - wmax - 1), by1 = Math.ceil(Math.max(y0, y1) + wmax + 1);
      for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) {
        const px = x + 0.5 - x0, py = y + 0.5 - y0;
        const t = (px * dx + py * dy) / l2;
        if (t < 0 || t > 1) continue;
        const side = (px * dy - py * dx) / len;
        const w = wmax * Math.sin(Math.PI * Math.pow(t, pow)) + 0.35;
        if (Math.abs(side) > w) continue;
        const sg = side < 0 ? -1 : 1;
        const nxs = (dy / len) * sg, nys = (-dx / len) * sg;
        const lit = -(nxs * 0.6 + nys * 0.8);
        let k = lit > 0.15 ? 2 : 1;
        if (Math.abs(side) < 0.55 && t > 0.12 && t < 0.85) k = 1;
        if (t > 0.8 && lit > 0) k = 3;
        if (lit < -0.5 && Math.abs(side) > w - 0.9) k = 0;
        this.set(x, y, ramp[Math.min(k, ramp.length - 1)]);
      }
    }
    canvas(outline = true, oc = null) {
      const pad = outline ? 1 : 0, W = this.w + pad * 2, Hh = this.h + pad * 2;
      const { c, ctx } = U.canvas(W, Hh);
      const img = ctx.createImageData(W, Hh), d = img.data;
      for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
        const sx = x - pad, sy = y - pad;
        let col = this.get(sx, sy), a = 255;
        if (col) a = col.length > 3 ? col[3] : 255;
        else if (outline) {
          let r = 0, g = 0, b = 0, n = 0, al = 0;
          const nb = [this.get(sx - 1, sy), this.get(sx + 1, sy), this.get(sx, sy - 1), this.get(sx, sy + 1)];
          for (const q of nb) {
            if (!q || q.noOut) continue;
            r += q[0]; g += q[1]; b += q[2]; al += q.length > 3 ? q[3] : 255; n++;
          }
          if (!n) continue;
          col = oc || outlineOf([r / n, g / n, b / n]);
          a = al / n;
        } else continue;
        const o = (y * W + x) * 4;
        d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = a;
      }
      ctx.putImageData(img, 0, 0);
      return c;
    }
  }
  const pair = (c) => ({ r: c, l: U.flipX(c) });
  const tintPair = (pr, col, a) => ({ r: U.tint(pr.r, col, a), l: U.tint(pr.l, col, a) });
  function blit(ctx, img, x, y, ax, ay) { ctx.drawImage(img, Math.round(x - ax), Math.round(y - ay)); }
  function rowsSprite(rows, pal, outline = true, oc) {
    const p = new Pix(Math.max(...rows.map((r) => r.length)), rows.length);
    p.rows(0, 0, rows, pal);
    return p.canvas(outline, oc);
  }
  function disc(r, col, a0, a1) {
    const s = r * 2 + 1;
    const { c, ctx } = U.canvas(s, s);
    const img = ctx.createImageData(s, s), d = img.data;
    const cc = hx(col);
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const dd = Math.hypot(x - r, y - r) / (r + 0.5);
      if (dd > 1) continue;
      const a = dd < 0.45 ? a0 : dd < 0.75 ? (a0 + a1) / 2 : a1;
      const o = (y * s + x) * 4;
      d[o] = cc[0]; d[o + 1] = cc[1]; d[o + 2] = cc[2]; d[o + 3] = a * 255;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }
  function shadowSprite(w) {
    const h = Math.max(2, Math.round(w * 0.36));
    const { c, ctx } = U.canvas(w, h);
    const img = ctx.createImageData(w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const nx = (x + 0.5 - w / 2) / (w / 2), ny = (y + 0.5 - h / 2) / (h / 2), q = nx * nx + ny * ny;
      if (q > 1) continue;
      const o = (y * w + x) * 4;
      d[o] = 40; d[o + 1] = 22; d[o + 2] = 56; d[o + 3] = q > 0.55 ? 62 : 92;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }

  /** turnip bulb (wide shoulders → root tip), like the style's creeper. col(k, nx, ny, x, y) → colour */
  function bulb(p, cx, cy, rx, ry, col, taper = 0.6, th = [-0.3, 0.08, 0.46, 0.8]) {
    const set = new Set();
    for (let y = Math.floor(cy - ry) - 1; y <= Math.ceil(cy + ry) + 1; y++) {
      for (let x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx) + 1; x++) {
        const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
        const wf = ny > 0.1 ? 1 - taper * Math.pow((ny - 0.1) / 0.9, 1.25) : 1;
        const nxx = nx / Math.max(0.05, wf), d = nxx * nxx + ny * ny;
        if (d > 1) continue;
        const nz = Math.sqrt(1 - d);
        const k = qi(lam(nxx, ny, nz), th);
        const c = col(k, nxx, ny, x, y);
        if (c) { p.set(x, y, c); set.add(x + ',' + y); }
      }
    }
    return set;
  }
  // purple top / cream bottom with the wavy colour boundary of the creeper
  const twoTone = (TOP, BOT, zb0 = 0.02) => (k, nx, ny) => {
    const zb = zb0 + 0.12 * Math.sin(nx * 8.5 + 1.3);
    if (ny < zb) return TOP[k];
    if (ny < zb + 0.13) return mixc(TOP[Math.min(4, k + 1)], BOT[k], 0.5);
    return BOT[k];
  };
  const rootLeg = (p, x, top, fb, far) => {
    for (let y = top; y < fb; y++) p.rect(x, y, 2, 1, R.root[far ? 0 : 1]);
    p.set(x, top, R.root[far ? 1 : 2]);
    p.rect(x, fb, 3, 1, R.root[far ? 0 : 1]);
    p.set(x, fb, R.root[far ? 1 : 2]);
  };

  /* =====================================================================
     Enemy sprites (all face right; flipped copies for left)
     ===================================================================== */
  // ---- Rüben-Spucker: mottled green-purple turnip with a big puckered spit tube
  function makeSpitter(f, swell, glow, recoil) {
    const p = new Pix(28, 30);
    const st = [
      { sx: 0, by: 0, la: 0, lb: -1, sw: 0 },
      { sx: 1, by: -1, la: 0, lb: 0, sw: 1 },
      { sx: 0, by: 0, la: -1, lb: 0, sw: 0 },
      { sx: -1, by: -1, la: 0, lb: 0, sw: -1 },
    ][f];
    const GY = 28;
    rootLeg(p, 7, 23, GY + st.lb, true);
    rootLeg(p, 12, 23, GY + st.la, false);
    const sq = recoil ? 1 : 0;
    const cx = 11 + st.sx * 0.5 - sq, cy = 16.5 + st.by + sq + swell * -0.3;
    const rx = 7.8 + swell * 0.9 + sq * 0.8, ry = 7.6 + swell * 0.5 - sq * 0.9;
    const TOP = R.tpur, BOT = R.gcream;
    bulb(p, cx, cy, rx, ry, (k, nx, ny, x, y) => {
      const zb = -0.05 + 0.14 * Math.sin(nx * 7 + 2.1);
      const mot = nx < 0.25 ? U.noise(x / 2.3 + 3, y / 2.3, 77) : 0;
      if (ny < zb) return mot > 0.6 ? R.tox[Math.max(1, Math.min(3, k))] : TOP[k];
      if (ny < zb + 0.14) return mixc(TOP[Math.min(4, k + 1)], BOT[k], 0.5);
      if (mot > 0.66) return R.gcream[Math.max(0, k - 1)];
      return BOT[k];
    }, 0.55);
    p.set(Math.floor(cx), Math.floor(cy + ry), BOT[1]);
    // spiky leaves (three, one droops back)
    const lb = Math.floor(cy - ry) + 1;
    p.leaf(10, lb + 1, 4 + st.sw, lb - 4, 1.7, R.leaf);
    p.leaf(12, lb + 1, 13 + st.sw, lb - 7, 1.9, R.leaf);
    p.leaf(13, lb + 1, 18 + st.sw, lb - 4.5, 1.6, R.leaf);
    p.set(11, lb, TOP[1]); p.set(12, lb, TOP[2]);
    // spit tube (cannon snout) sticking out of the face
    const ty = Math.round(cy) + 1 + (recoil ? 1 : 0);
    const tx0 = Math.round(cx + rx * 0.55);
    const len = recoil ? 3 : 4 + (swell > 1 ? 1 : 0);
    const th = 2 + (swell > 0 ? 1 : 0); // half height of the rim
    for (let i = 0; i <= len; i++) {
      const x = tx0 + i, hh = i >= len - 1 ? th : th - 1;
      for (let j = -hh; j <= hh; j++) {
        const u = j / hh;
        const k = u < -0.5 ? 3 : u < 0.2 ? 2 : u < 0.7 ? 1 : 0;
        p.set(x, ty + j, i >= len - 1 ? R.tox[Math.min(4, k + 1)] : TOP[Math.min(4, k + 1)]);
      }
    }
    // mouth hole
    const mx = tx0 + len;
    const hole = glow ? [R.tox[3], R.tox[4], hx('#ffffff')][glow - 1] : hx('#0e1a10');
    for (let j = -(th - 1); j <= th - 1; j++) p.set(mx, ty + j, hole);
    if (glow) { p.set(mx - 1, ty, glow > 1 ? R.tox[4] : R.tox[3]); if (glow > 2) { p.set(mx, ty - 1, hx('#ffffff')); } }
    else p.set(mx - 1, ty, hx('#1e3a2a'));
    // puffed cheeks while aiming
    if (swell > 0) {
      p.set(tx0 - 1, ty - th - 1, R.gcream[4]); p.set(tx0 - 2, ty - th, R.gcream[3]);
      p.set(tx0 - 1, ty + th + 1, R.gcream[2]);
    }
    // eyes: toxic yellow-green glow + angry brows (above the tube)
    const ex = Math.round(cx) + 1, ey = ty - th - 3;
    p.set(ex - 1, ey - 2, DARK); p.set(ex, ey - 1, DARK); p.set(ex + 1, ey - 1, DARK);
    p.set(ex + 5, ey - 2, DARK); p.set(ex + 4, ey - 1, DARK); p.set(ex + 3, ey - 1, DARK);
    const E = [R.tox[3], R.tox[4], hx('#fbffd8')];
    p.set(ex, ey, E[2]); p.set(ex + 1, ey, E[1]); p.set(ex, ey + 1, E[0]); p.set(ex + 1, ey + 1, DARK);
    p.set(ex + 3, ey, E[2]); p.set(ex + 4, ey, E[1]); p.set(ex + 3, ey + 1, DARK); p.set(ex + 4, ey + 1, E[0]);
    // green drool
    if (!recoil && f % 2 === 0) { p.set(mx - 1, ty + th + 1, R.tox[3]); p.set(mx - 1, ty + th + 2, R.tox[2]); }
    if (recoil) {
      // spray in front of the tube
      for (const [x, y, k] of [[2, 0, 4], [3, -2, 3], [3, 2, 3], [5, -1, 4], [5, 3, 2], [6, -3, 3], [4, 0, 3]]) p.set(mx + x, ty + y, R.tox[k]);
    }
    return p.canvas();
  }

  // ---- Zündrübe: round red beet-bomb with a fuse in its leaf tuft
  function makeBomber(f, swell) {
    const p = new Pix(22, 26);
    const GY = 25;
    const st = [[0, -1, -1, 0], [-1, 0, 0, -1], [0, -1, -1, 0], [-1, 0, 0, -1]][f];
    const bob = f % 2 ? -1 : 0;
    // four scurrying legs (far pair darker)
    const leg = (x, lift, far, dir) => {
      const fb = GY + lift;
      for (let y = 20; y < fb; y++) p.set(x + (y > 22 ? dir : 0), y, R.root[far ? 0 : 1]);
      p.set(x + dir, fb, R.root[far ? 0 : 2]); p.set(x + dir * 2, fb, R.root[far ? 0 : 1]);
    };
    leg(7, st[0], true, -1); leg(13, st[1], true, 1);
    leg(9, st[2], false, -1); leg(14, st[3], false, 1);
    // root tail behind
    p.set(3, 19 + bob, R.beet[1]); p.set(2, 20 + bob, R.beet[1]); p.set(1, 20 + bob, R.beet[0]);
    const cx = 11, cy = 15.5 + bob - swell * 0.5, r = 6.6 + swell;
    p.blob(cx, cy, r, r * 0.96, (nx, ny, nz) => {
      const k = qi(lam(nx, ny, nz), [-0.28, 0.1, 0.48, 0.84]);
      return R.beet[k];
    });
    // beet rings (darker arcs)
    for (let a = 0.5; a < 2.6; a += 0.18) {
      const x = cx + Math.cos(a) * r * 0.62, y = cy + Math.sin(a) * r * 0.62 - 0.5;
      if (p.get(x, y) === R.beet[2]) p.set(x, y, R.beet[1]);
    }
    // glossy highlight
    p.set(cx - 3, cy - 4, hx('#ffd0b0')); p.set(cx - 4, cy - 3, R.beet[4]); p.set(cx - 2, cy - 4, R.beet[4]);
    // leaf tuft with red stems
    const ty = Math.floor(cy - r) + 1;
    p.leaf(10, ty, 5, ty - 4, 1.5, R.leaf);
    p.leaf(11, ty, 9, ty - 6, 1.4, R.leaf);
    p.set(10, ty, R.beet[1]); p.set(11, ty, R.beet[2]); p.set(10, ty - 1, R.beet[1]);
    // fuse (twisted cord) growing up-right out of the tuft
    const fuse = [[12, ty - 1], [13, ty - 2], [13, ty - 3], [14, ty - 4], [15, ty - 5]];
    fuse.forEach(([x, y], i) => p.set(x, y, i % 2 ? hx('#7a5a34') : hx('#4a3424')));
    // mean little eyes (facing right) + jagged grin
    const ex = cx + 1, ey = Math.round(cy) - 1;
    p.set(ex - 1, ey - 1, DARK); p.set(ex, ey, DARK); p.set(ex + 4, ey - 1, DARK); p.set(ex + 3, ey, DARK);
    p.set(ex, ey + 1, R.glow[2]); p.set(ex + 1, ey + 1, R.glow[1]); p.set(ex + 3, ey + 1, R.glow[2]); p.set(ex + 4, ey + 1, R.glow[0]);
    const my = ey + 4;
    p.set(ex, my, DARK); p.set(ex + 1, my + 1, DARK); p.set(ex + 2, my, DARK); p.set(ex + 3, my + 1, DARK); p.set(ex + 4, my, DARK);
    p.set(ex + 1, my, R.cream[4]); p.set(ex + 3, my, R.cream[4]);
    const out = p.canvas();
    out.fuseX = 15 + 1; out.fuseY = ty - 6 + 1; // spark position in canvas pixels (incl. outline pad)
    return out;
  }

  // ---- Wurzel-Bock: gnarled parsnip ram with curled horns, four stubby root legs
  // pose: 0 chase, 1 tele (reared up), 2 dash (lean forward), 3 dizzy
  function makeCharger(f, pose, alt) {
    const W = 38, H = 32, GY = 30;
    const p = new Pix(W, H);
    const P = R.pars;
    const tilt = pose === 1 ? -0.32 : pose === 2 ? 0.16 : 0; // body slope (neg = front up)
    const bob = pose === 0 ? (f % 2 ? -1 : 0) : pose === 3 ? (alt ? 1 : 0) : 0;
    const pivot = 16;
    const sy = (x) => tilt * (x - pivot);
    // legs (far pair first)
    const leg = (x, y0, len, dx, far) => {
      const c = far ? [R.bark[0], R.bark[1], R.bark[1]] : [R.bark[1], R.bark[2], R.bark[3]];
      for (let i = 0; i < len; i++) {
        const xx = Math.round(x + (dx * i) / Math.max(1, len));
        const w = i < len - 2 ? 3 : 2;
        for (let j = 0; j < w; j++) p.set(xx + j, y0 + i, c[j === 0 ? 2 : j === w - 1 ? 0 : 1]);
      }
      const fx = Math.round(x + dx), fy = y0 + len;
      p.set(fx - 1, fy, c[0]); p.set(fx, fy, c[1]); p.set(fx + 1, fy, c[1]); p.set(fx + 2, fy, c[0]); p.set(fx + 3, fy, c[0]);
    };
    const bx = (x) => Math.round(GY - 6 + bob + sy(x)); // leg top at body bottom
    if (pose === 2) {
      leg(7, bx(7), GY - bx(7), -5, true); leg(22, bx(22), GY - bx(22), 5, true);
      leg(10, bx(10), GY - bx(10), -6, false); leg(25, bx(25), GY - bx(25), 4, false);
    } else if (pose === 1) {
      // reared: back legs planted, front legs lifted / pawing
      leg(8, bx(8), GY - bx(8), 0, true); leg(11, bx(11), GY - bx(11), 1, false);
      const fy = bx(23);
      leg(22, fy, 5, 2, true);
      leg(25, fy, alt ? 9 : 6, alt ? 2 : 3, false);
    } else {
      const ph = pose === 0 ? f : 0;
      const a = [0, -1, 0, 0][ph], b = [0, 0, 0, -1][ph], s = [1, 0, -1, 0][ph];
      leg(8 - s, bx(8), GY - bx(8) + b, s * 0.5, true); leg(22 + s, bx(22), GY - bx(22) + a, -s * 0.5, true);
      leg(11 + s, bx(11), GY - bx(11) + a, -s * 0.5, false); leg(25 - s, bx(25), GY - bx(25) + b, s * 0.5, false);
    }
    // body: a fat parsnip lying on its side, thick shoulder in front, tapering root tail behind
    const cy0 = GY - 12 + bob;
    const body = new Set();
    for (let x = 1; x < 30; x++) {
      const u = (x - 2) / 26; // 0 tail → 1 shoulder
      if (u < 0) continue;
      const rr = u > 0.72 ? 7.6 * Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.72) / 0.3, 2))) : 1.2 + 6.4 * Math.pow(u / 0.72, 0.7);
      const ccy = cy0 + sy(x) + (u < 0.25 ? (0.25 - u) * 6 : 0);
      for (let y = Math.floor(ccy - rr) - 1; y <= Math.ceil(ccy + rr); y++) {
        const ny = (y + 0.5 - ccy) / Math.max(0.6, rr);
        if (Math.abs(ny) > 1) continue;
        const nx = u > 0.72 ? (u - 0.72) / 0.3 : -0.25;
        const nz = Math.sqrt(Math.max(0, 1 - ny * ny - nx * nx * 0.5));
        let k = qi(lam(nx * 0.7, ny, nz), [-0.32, 0.06, 0.42, 0.78]);
        // parsnip rings
        if ((x % 5 === 1) && k > 1 && Math.abs(ny) < 0.7 && ((y + x) % 3)) k--;
        p.set(x, y, P[k]);
        body.add(x + ',' + y);
      }
    }
    // tail root hair + root hairs on the belly
    p.set(0, Math.round(cy0 + sy(0) + 6), P[1]);
    for (const x of [6, 13, 19]) { const y = Math.round(cy0 + sy(x) + 6.6 * Math.min(1, (x - 2) / 18) + 1); if (!p.get(x, y)) p.set(x, y, P[1]); }
    // green parsnip tops as a mane on the back
    const mx = 18, my = Math.round(cy0 + sy(18) - 5);
    p.leaf(mx, my + 1, mx - 6, my - 8 + (pose === 2 ? 3 : 0), 1.9, R.leaf);
    p.leaf(mx + 2, my + 1, mx, my - 10 + (pose === 2 ? 3 : 0), 2, R.leaf);
    p.leaf(mx - 2, my + 2, mx - 9, my - 1, 1.4, R.leaf);
    // head: lowered, in front of the shoulder
    const hlift = pose === 1 ? -4 : pose === 2 ? 2 : pose === 3 ? 2 + (alt ? 1 : 0) : 0;
    const hx0 = 30 + (pose === 2 ? 2 : 0), hy0 = Math.round(cy0 + sy(29) + 2 + hlift);
    // horns: a big curled ram horn on the near side, a smaller far curl behind the head
    const horn = (cx, cy, rad0, turns, far) => {
      const HR = R.horn;
      let n = 0;
      for (let t = 0; t <= turns; t += 0.035) {
        const a = -Math.PI * 0.5 - t * Math.PI * 2; // top → back → down → forward (ram curl)
        const rad = rad0 * (1 - t / (turns * 1.3));
        const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
        const w = 1.7 * (1 - t / (turns * 1.7));
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (Math.hypot(dx, dy) > w + 0.3) continue;
          const lit = -(dx * 0.6 + dy * 0.8);
          let k = lit > 0.3 ? 4 : lit > -0.2 ? 3 : 2;
          if ((n >> 2) % 2 === 1 && k > 2) k--; // ridges
          if (far) k = Math.max(0, k - 2);
          p.set(x + dx, y + dy, HR[k]);
        }
        n++;
      }
    };
    horn(hx0 - 1, hy0 - 3, 3.6, 0.8, true);
    p.blob(hx0, hy0, 5.2, 4.6, (nx, ny, nz) => P[Math.min(4, qi(lam(nx, ny, nz), [-0.3, 0.08, 0.45, 0.8]))]);
    // muzzle + nostril + grumpy mouth
    p.set(hx0 + 5, hy0 + 1, P[3]); p.set(hx0 + 5, hy0 + 2, P[2]); p.set(hx0 + 4, hy0 + 3, P[1]);
    p.set(hx0 + 5, hy0 + 1, DARK); p.set(hx0 + 2, hy0 + 3, DARK); p.set(hx0 + 3, hy0 + 3, DARK);
    // eyes
    const red = pose === 1 || pose === 2;
    const EG = red ? [hx('#9e1a1a'), hx('#ff3b2f'), hx('#ffd0c0')] : R.glow;
    const ex = hx0 + 1, ey = hy0 - 1;
    if (pose === 3) {
      // dizzy: little crossed-out eyes
      p.set(ex, ey - 1, DARK); p.set(ex + 2, ey - 1, DARK); p.set(ex + 1, ey, DARK); p.set(ex, ey + 1, DARK); p.set(ex + 2, ey + 1, DARK);
    } else {
      p.set(ex - 1, ey - 1, DARK); p.set(ex, ey - 1, DARK); p.set(ex + 1, ey, DARK); p.set(ex + 2, ey, DARK);
      p.set(ex, ey, EG[2]); p.set(ex + 1, ey + 1, EG[1]); p.set(ex, ey + 1, EG[0]);
      if (red) { p.set(ex - 1, ey, EG[1]); p.set(ex + 2, ey + 1, EG[0]); }
    }
    horn(hx0 - 2, hy0 - 1, 4.6, 0.9, false);
    // dash: dust puffs at the hind feet are drawn by the core; add speed streaks behind
    if (pose === 2) {
      for (const [x, y] of [[0, cy0 - 4], [2, cy0 - 1], [0, cy0 + 3]]) { p.set(x, y, hx('#e8dcc0')); p.set(x + 1, y, hx('#e8dcc0')); }
    }
    if (pose === 1 && alt) {
      // dirt kicked up by the pawing hoof
      p.set(30, GY - 1, R.root[0]); p.set(32, GY - 2, R.root[1]); p.set(33, GY - 4, R.root[0]);
    }
    return p.canvas();
  }

  // ---- Rüben-Ahnin: big old matriarch rutabaga, rose shawl, spectacles, cane, babies on her crown
  function makeMother(f, form) {
    const W = 44, H = 50, GY = 48;
    const p = new Pix(W, H);
    const st = [
      { by: 0, la: 0, lb: -1, cane: 0 },
      { by: 1, la: 0, lb: 0, cane: 1 },
      { by: 0, la: -1, lb: 0, cane: 1 },
      { by: 1, la: 0, lb: 0, cane: 0 },
    ][f];
    const sxk = form === 1 ? -1.6 : form === 2 ? 1.8 : 0; // 1 stretch, 2 squash
    const syk = form === 1 ? 2.2 : form === 2 ? -1.8 : 0;
    // stumpy root legs
    const leg = (x, lift, far) => {
      const fb = GY + lift;
      for (let y = 40; y <= fb; y++) {
        const foot = y >= fb - 1, x0 = foot ? x - 1 : x, w = foot ? 8 : 6;
        for (let i = 0; i < w; i++) {
          let k = i === 0 ? 3 : i < 2 ? 2 : i < w - 1 ? 1 : 0;
          if (far) k = Math.max(0, k - 1);
          p.set(x0 + i, y, R.bark[k]);
        }
      }
    };
    leg(11, st.lb, true);
    leg(21, st.la, false);
    // body
    const cx = 19, cy = 29 + st.by - syk * 0.5, rx = 14.5 + sxk, ry = 14 + syk;
    const TOP = R.tpur, BOT = R.cream;
    const body = bulb(p, cx, cy, rx, ry, (k, nx, ny, x, y) => {
      const zb = -0.18 + 0.1 * Math.sin(nx * 7 + 0.4);
      let c;
      if (ny < zb) c = TOP[k];
      else if (ny < zb + 0.1) c = mixc(TOP[Math.min(4, k + 1)], BOT[k], 0.5);
      else c = BOT[k];
      // old wrinkly skin: broken horizontal creases
      const wr = Math.sin(ny * 26 + Math.sin(nx * 5) * 1.6);
      if (wr > 0.93 && k > 0 && (x * 7 + y) % 5 !== 0) c = (ny < zb ? TOP : BOT)[k - 1];
      return c;
    }, 0.42, [-0.32, 0.06, 0.44, 0.8]);
    // rose shawl wrapped around her middle with cream dots and a fringe
    const S = R.shawl;
    const ys0 = Math.round(cy + ry * 0.3), ys1 = Math.round(cy + ry * 0.62);
    for (const key of body) {
      const [x, y] = key.split(',').map(Number);
      if (y < ys0 + Math.round(Math.sin((x - cx) / rx * 1.6) * 1.2) || y > ys1 + ((x & 1) ? 0 : -1)) continue;
      const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - (ys0 + ys1) / 2) / ((ys1 - ys0) / 2 + 1);
      let k = qi(lam(nx, ny * 0.8, Math.sqrt(Math.max(0.05, 1 - nx * nx))), [-0.3, 0.05, 0.45, 0.82]);
      if (x % 4 === (y % 2 ? 2 : 0) && y % 2 === 1 && k > 1) { p.set(x, y, R.cream[Math.min(4, k)]); continue; }
      if (y === ys0 + Math.round(Math.sin((x - cx) / rx * 1.6) * 1.2)) k = Math.min(4, k + 1);
      p.set(x, y, S[k]);
    }
    // fringe
    for (let x = Math.round(cx - rx * 0.6); x <= Math.round(cx + rx * 0.7); x += 4) {
      if (!body.has(x + ',' + (ys1 + 1))) continue;
      p.set(x, ys1 + 1, S[2]); p.set(x, ys1 + 2, S[1]);
    }
    // brooch / knot at the front
    const kx = Math.round(cx + rx * 0.62), ky = ys0 + 2;
    p.set(kx, ky, R.scarf[2]); p.set(kx + 1, ky, R.scarf[1]); p.set(kx, ky + 1, R.scarf[1]); p.set(kx + 1, ky + 1, R.scarf[0]);
    // face (facing right): heavy-lidded glowing eyes behind round gold spectacles, wrinkled frown
    const ex = Math.round(cx + rx * 0.22), ey = Math.round(cy - ry * 0.26);
    const GOLD = hx('#f2c24c'), GOLDd = hx('#a8762a');
    const spec = (x0) => {
      for (const [dx, dy] of [[1, -1], [2, -1], [0, 0], [3, 0], [0, 1], [3, 1], [1, 2], [2, 2]]) p.set(x0 + dx, ey + dy, dy < 1 ? GOLD : GOLDd);
      p.set(x0 + 1, ey, DARK); p.set(x0 + 2, ey, DARK);
      p.set(x0 + 1, ey + 1, R.glow[2]); p.set(x0 + 2, ey + 1, R.glow[1]);
    };
    spec(ex); spec(ex + 5);
    p.set(ex + 4, ey, GOLD); // bridge
    p.set(ex - 1, ey - 1, GOLDd); // temple arm
    // nose
    p.set(ex + 9, ey + 3, BOT[2]); p.set(ex + 9, ey + 4, BOT[1]);
    // toothless frown
    const my = ey + 5;
    p.set(ex + 2, my + 1, DARK); p.set(ex + 3, my, DARK); p.set(ex + 4, my, DARK); p.set(ex + 5, my, DARK); p.set(ex + 6, my + 1, DARK);
    p.set(ex + 1, my - 1, BOT[1]); p.set(ex + 7, my, BOT[1]); // smile-line wrinkles
    // crown: wilted leaves + three baby sprouts sitting in them
    const ty = Math.floor(cy - ry) + 1;
    const WILT = hexes(['#4a3424', '#7a5a34', '#a8823e', '#c8a456']);
    p.leaf(15, ty + 2, 6, ty - 4, 2.2, WILT, 0.6);
    p.leaf(21, ty + 2, 30, ty - 4, 2.2, R.leaf, 0.6);
    p.leaf(18, ty + 1, 18, ty - 9, 2.0, R.leaf, 0.6);
    for (let x = 14; x <= 23; x++) p.set(x, ty, TOP[x < 18 ? 2 : 1]);
    const baby = (bx, by, flip) => {
      p.leaf(bx, by - 2, bx + flip * 2, by - 6, 1, R.leaf);
      p.blob(bx + 0.5, by + 0.5, 2.6, 2.4, (nx, ny, nz) => {
        const k = qi(lam(nx, ny, nz), [-0.3, 0.1, 0.5]);
        return ny < 0.1 ? R.tmag[k + 1] : R.cream[k + 1];
      });
      p.set(bx + 2, by + 3, R.cream[1]);
      p.set(bx + 1, by, DARK); p.set(bx + 2, by, R.glow[1]);
    };
    baby(10, ty - 1 + (f === 1 ? 1 : 0), -1);
    baby(25, ty - 2 + (f === 3 ? 1 : 0), 1);
    baby(17, ty - 6 + (f === 2 ? 1 : 0), 1);
    // root arm holding a gnarled walking cane
    const cxn = Math.round(cx + rx + 3) + st.cane;
    const ay = Math.round(cy + 4);
    p.line(Math.round(cx + rx - 2), ay, cxn - 1, ay + 1, R.bark[2]);
    p.line(Math.round(cx + rx - 2), ay + 1, cxn - 1, ay + 2, R.bark[1]);
    for (let y = ay - 3; y <= GY; y++) {
      const x = cxn + (y > ay + 8 ? 1 : 0) - (y < ay - 1 ? 0 : 0);
      p.set(x, y, R.wood[y % 5 === 0 ? 1 : 2]); p.set(x + 1, y, R.wood[1]);
    }
    p.set(cxn - 1, ay - 3, R.wood[3]); p.set(cxn - 1, ay - 4, R.wood[3]); p.set(cxn, ay - 4, R.wood[2]);
    p.set(cxn - 1, ay + 1, R.bark[3]); p.set(cxn, ay + 1, R.bark[2]); // knuckles
    return p.canvas();
  }

  // ---- Rübchen: tiny baby turnip with one leaf and pitter-patter legs
  function makeSprout(f) {
    const p = new Pix(14, 17);
    const GY = 16;
    const L = [[0, -1, -1], [-1, 0, 1], [0, -1, 1], [-1, 0, -1]][f];
    const bob = f % 2 ? -1 : 0;
    p.set(5 + L[2], 13, R.root[0]); p.set(5 + L[2], 14, R.root[0]); p.set(5 + L[2] * 2, GY + L[0], R.root[0]); p.set(5 + L[2], GY + L[0], R.root[1]);
    p.set(8 - L[2], 13, R.root[1]); p.set(8 - L[2], 14, R.root[1]); p.set(8 - L[2] * 2, GY + L[1], R.root[1]); p.set(8 - L[2], GY + L[1], R.root[2]);
    const cx = 7, cy = 9 + bob, rx = 4.9, ry = 4.7;
    bulb(p, cx, cy, rx, ry, twoTone(R.tmag, R.cream, -0.05), 0.55, [-0.3, 0.1, 0.5, 0.82]);
    // one big curled leaf
    const ty = Math.floor(cy - ry) + 1;
    p.leaf(7, ty, 4 + (f === 1 ? 1 : 0), ty - 5, 1.7, R.leaf);
    p.set(7, ty, R.tmag[1]);
    // cute-angry face
    p.set(8, cy - 1, DARK); p.set(10, cy - 1, DARK);
    p.set(8, cy, R.glow[2]); p.set(10, cy, R.glow[1]);
    p.set(9, cy + 2, DARK);
    return p.canvas();
  }

  // ---- enemy shot: glob of toxic turnip juice (dark ink rim → toxic green → pale core)
  function makeShot(f) {
    const p = new Pix(11, 11);
    const r = f ? 4.4 : 4.0;
    p.blob(5.5, 5.5, r + (f ? 0.2 : 0), r - (f ? 0.3 : 0), (nx, ny, nz) => {
      const l = lam(nx, ny, nz);
      return [R.tox[1], R.tox[2], R.tox[3], R.tox[4]][qi(l, [-0.1, 0.3, 0.7])];
    });
    p.set(4, 3, hx('#ffffff')); p.set(3, 4, hx('#fbffd8'));
    if (f) { p.set(8, 7, R.tox[1]); } else p.set(7, 8, R.tox[1]);
    return p.canvas(true, INK);
  }


  // ---- dizzy star + fuse sparks
  const STAR = () => rowsSprite(['.y.', 'yWy', '.y.'], { y: hx('#ffd25a'), W: hx('#fffbe8') }, true, hx('#8a4a1e'));
  const SPARKS = () => [
    rowsSprite(['.y.', 'yWy', '.y.'], { y: hx('#ffc640'), W: hx('#ffffff') }, false),
    rowsSprite(['..w..', '.yoy.', 'woWow', '.yoy.', '..w..'], { y: hx('#ffc640'), o: hx('#ff9a34'), w: hx('#fff2a8'), W: hx('#ffffff') }, false),
    rowsSprite(['w..y..w', '.y.o.y.', '..oWo..', 'yoWWWoy', '..oWo..', '.y.o.y.', 'w..y..w'], { y: hx('#ffc640'), o: hx('#ff7a2a'), w: hx('#fff2a8'), W: hx('#ffffff') }, false),
  ];

  /* =====================================================================
     Upgrade icons (14×14 grid + coloured outline → 16×16, crisp upscale) – same as the style's ICONS
     ===================================================================== */
  const ICP = {
    k: hx('#24162a'), r: hx('#e0442e'), R: hx('#9e2a30'), h: hx('#ff9a7a'), w: hx('#fff8e8'),
    o: hx('#ec8a30'), O: hx('#c4562a'), d: hx('#8a3428'), y: hx('#ffe27a'), Y: hx('#ffb83a'),
    c: hx('#f4e2b0'), C: hx('#c8a874'), e: hx('#9a7a54'),
    g: hx('#5a9a3a'), G: hx('#3a6a34'), l: hx('#8cc850'),
    p: hx('#9152a6'), P: hx('#5e2d70'), q: hx('#c088cc'),
    b: hx('#a06a3c'), B: hx('#6a4228'), n: hx('#c8945a'), m: hx('#e2b878'),
    i: hx('#bcd8f2'), I: hx('#7f9bcb'), j: hx('#f2faff'), J: hx('#4a5a8c'),
    s: hx('#b8b0a8'), S: hx('#787080'), t: hx('#fff4d6'),
    a: hx('#8af0d0'), A: hx('#3aa89a'), v: hx('#eafff6'),
  };
  const ICONS = {
    leech: [
      '.t...t........',
      '.tt..tt..rr.rr',
      '..t...t..rhrrR',
      '.tt..tt..rrrrR',
      '.t...t....rrR.',
      '...........R..',
      '.mnnnnnnnnnnB.',
      'nyYoYyoYoYoyBB',
      'bnmmmmmmmmmmbB',
      '.bnnnnnnnnnbB.',
      '..bnnnnnnnbB..',
      '...BbbbbbBB...',
      '....BBBBB.....',
      '..............',
    ],
    thorns: [
      '......t.......',
      '..t...s...t...',
      '...s.qpp.s....',
      '....qppppP....',
      '...qpPppPpP...',
      'tsqpkppppkPsst',
      '...pyYpppYyP..',
      '...cccccccCC..',
      '....ccccccC...',
      '...s.ccccC.s..',
      '..t...CC...t..',
      '......s.......',
      '......t.......',
      '..............',
    ],
    dashup: [
      '.........G....',
      '.......ooGoo..',
      '......ohoooOO.',
      '.yy..ohoYooYOO',
      '.....oooyooyOO',
      'yyyy.ooooooooO',
      '.....ooYyYyYoO',
      '.yyy.oOoyOyOO.',
      '......OOOOOO..',
      '..............',
      '.ss.s.s.ss....',
      '..............',
      '..............',
      '..............',
    ],
    range: [
      '..........ct..',
      '.........ctwc.',
      '.........cccC.',
      '......y...CC..',
      '....y.........',
      '...y..........',
      '..y...........',
      '..y...........',
      '.y.......rrr..',
      '.y......rwwwr.',
      '.y......rwrwr.',
      'y.......rwwwr.',
      'y........rrr..',
      '..............',
    ],
  };
  const ICON_C = {};
  function iconCanvas(id) {
    if (ICON_C[id]) return ICON_C[id];
    const rows = ICONS[id];
    const p = new Pix(14, 14);
    if (typeof rows === 'function') rows(p);
    else p.rows(0, Math.floor((14 - rows.length) / 2), rows, ICP);
    return (ICON_C[id] = p.canvas(true));
  }
  function drawIcon(ctx, id, size) {
    const c = iconCanvas(id);
    const s = Math.max(1, Math.floor(size / 16));
    ctx.imageSmoothingEnabled = false;
    const o = Math.floor((size - 16 * s) / 2);
    ctx.drawImage(c, o, o, 16 * s, 16 * s);
  }

  /* =====================================================================
     Build + draw
     ===================================================================== */
  let S = null;
  function build() {
    const s = {};
    const withFlash = (arr) => ({ n: arr, f: arr.map((p) => tintPair(p, '#ffffff', 1)) });
    s.spit = withFlash([0, 1, 2, 3].map((f) => pair(makeSpitter(f, 0, 0, false))));
    // aim: [level 0..2][tremble 0..1]
    s.spitAim = [0, 1, 2].map((lv) => [0, 1].map((f) => pair(makeSpitter(f * 2, lv === 0 ? 1 : 2, lv + 1, false))));
    s.spitRec = pair(makeSpitter(0, 0, 0, true));
    s.bomb = withFlash([0, 1, 2, 3].map((f) => pair(makeBomber(f, 0))));
    s.bombArm = [0, 1, 2, 3].map((f) => pair(makeBomber(f, 1)));
    s.bombHot = s.bombArm.map((p) => tintPair(p, '#ff2a1a', 0.55));
    s.bombWhite = s.bombArm.map((p) => tintPair(p, '#ffffff', 0.85));
    s.ch = withFlash([0, 1, 2, 3].map((f) => pair(makeCharger(f, 0, 0))));
    s.chTele = [0, 1].map((a) => pair(makeCharger(0, 1, a)));
    s.chDash = pair(makeCharger(0, 2, 0));
    s.chDashGhost = tintPair(s.chDash, '#ffe0c0', 1);
    s.chDizzy = [0, 1].map((a) => pair(makeCharger(0, 3, a)));
    s.mo = [0, 1, 2, 3].map((f) => pair(makeMother(f, 0)));
    s.moF = s.mo.map((p) => tintPair(p, '#ffffff', 0.6));
    s.moStretch = pair(makeMother(0, 1));
    s.moSquash = pair(makeMother(1, 2));
    s.so = withFlash([0, 1, 2, 3].map((f) => pair(makeSprout(f))));
    s.shot = [makeShot(0), makeShot(1)];
    s.star = STAR();
    s.spark = SPARKS();
    s.glowG = disc(7, '#9ef050', 0.3, 0.08);
    s.glowGS = disc(4, '#c6ff5e', 0.35, 0.1);
    s.glowO = disc(5, '#ff9a34', 0.35, 0.1);
    s.glowM = disc(16, '#d0a0ff', 0.34, 0.08);
    s.glowR = disc(9, '#ff3b2f', 0.3, 0.08);
    s.shadow = {};
    for (const w of [6, 8, 10, 12, 14, 16, 20, 24, 28]) s.shadow[w] = shadowSprite(w);
    s.dirt = rowsSprite(['....hhll....', '..hlllmmmd..', '.llmmmmmdddd'], { h: hx('#a8744a'), l: hx('#87593a'), m: hx('#6e4632'), d: hx('#4e3030') }, false);
    return s;
  }

  /** spawn (rise from the soil) / death (white flash) exactly like the style's creeper. Returns true if handled. */
  function lifecycle(ctx, e, view, img, flashImg, big) {
    const ax = img.width / 2, ay = img.height - 1;
    if (e.dying) {
      if (e.deathT < 0.2) blit(ctx, flashImg, e.x, e.y - 1, ax, ay);
      return true;
    }
    if (e.spawnT < 1) {
      const s = e.spawnT;
      const vis = Math.max(1, Math.round(img.height * U.ease.outQuad(s)));
      const sx = Math.round(e.x - ax), sy = Math.round(e.y + 1 - vis);
      ctx.drawImage(e.flash > 0.45 ? flashImg : img, 0, 0, img.width, vis, sx, sy, img.width, vis);
      const m = S.dirt, mw = big ? 2 : 1;
      ctx.globalAlpha = Math.min(1, (1 - s) * 3);
      ctx.drawImage(m, Math.round(e.x - (m.width * mw) / 2), Math.round(e.y - m.height + 1), m.width * mw, m.height);
      ctx.globalAlpha = 1;
      if (!e._sp && s < 0.6) {
        e._sp = true;
        const n = big ? 6 : 4;
        for (let k = 0; k < n; k++) {
          const a = Math.random() * Math.PI;
          view.game.addParticle({ x: e.x + Math.cos(a) * 5, y: e.y, z: 2, vx: Math.cos(a) * 30, vy: (Math.random() - 0.5) * 10, vz: 30 + Math.random() * 30, grav: 160, kind: 'chunk', color: Math.random() < 0.5 ? '#6e4632' : '#9a663f', life: 0.6, size: 2, drag: 1 });
        }
        view.game.addParticle({ x: e.x, y: e.y, z: 2, vz: 8, kind: 'dust', life: 0.5, size: 2.5, drag: 2 });
      }
      return true;
    }
    e._sp = false;
    return false;
  }
  const fl = (e) => (e.facing < 0 ? 'l' : 'r');
  const add = (ctx, img, x, y, a) => {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = a;
    ctx.drawImage(img, Math.round(x - (img.width >> 1)), Math.round(y - (img.height >> 1)));
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  C.art('harvest16', {
    init() { S = build(); },
    enemies: {
      spitter(ctx, e, view) {
        const frame = Math.floor(e.anim * 1.6) & 3, d = fl(e);
        const base = S.spit.n[frame][d];
        if (lifecycle(ctx, e, view, base, S.spit.f[frame][d], false)) return;
        let img = base, dx = 0;
        if (e.mode === 'aim') {
          const lv = e.charge < 0.35 ? 0 : e.charge < 0.75 ? 1 : 2;
          const tr = Math.floor(view.rt * (14 + e.charge * 16)) & 1;
          img = S.spitAim[lv][tr][d];
          dx = e.charge > 0.5 ? (tr ? 1 : -1) * (e.charge > 0.85 ? 1 : 0) : 0;
          const mx = e.x + e.facing * 9, my = e.y - 13;
          add(ctx, S.glowGS, mx, my, 0.3 + e.charge * 0.6);
        } else if (e.spit > 0.45) img = S.spitRec[d];
        if (e.flash > 0.45) img = S.spit.f[frame][d];
        blit(ctx, img, e.x + dx, e.y, img.width / 2, img.height - 1);
      },
      bomber(ctx, e, view) {
        const frame = Math.floor(e.anim * 2.2) & 3, d = fl(e);
        const base = e.armed ? S.bombArm[frame][d] : S.bomb.n[frame][d];
        if (lifecycle(ctx, e, view, S.bomb.n[frame][d], S.bomb.f[frame][d], false)) return;
        let img = base;
        let on = false;
        if (e.armed) {
          const k = e.fuse || 0;
          const rate = 5 + k * k * 26;
          on = ((view.rt * rate + e.seed) % 1) < 0.5;
          img = on ? (k > 0.6 && ((view.rt * rate * 0.5) % 1) < 0.5 ? S.bombWhite[frame][d] : S.bombHot[frame][d]) : base;
          add(ctx, S.glowR, e.x, e.y - 10, on ? 0.5 + k * 0.4 : 0.2);
        }
        if (e.flash > 0.45) img = S.bomb.f[frame][d];
        const x0 = Math.round(e.x - img.width / 2), y0 = Math.round(e.y - img.height + 1);
        ctx.drawImage(img, x0, y0);
        // fuse spark (grows while armed)
        const src = e.armed ? S.bombArm[frame].r : S.bomb.n[frame].r;
        const sx = x0 + (e.facing < 0 ? src.width - 1 - src.fuseX : src.fuseX), sy = y0 + src.fuseY;
        const lvl = e.armed ? (e.fuse > 0.5 ? 2 : 1) : 0;
        const flick = Math.floor(view.rt * 16 + e.seed * 9) & 1;
        const sp = S.spark[Math.max(0, lvl - (flick && lvl ? 1 : 0))];
        add(ctx, S.glowO, sx + 0.5, sy + 0.5, e.armed ? 0.8 : 0.45 + flick * 0.2);
        ctx.drawImage(sp, Math.round(sx - (sp.width >> 1)), Math.round(sy - (sp.height >> 1)));
      },
      charger(ctx, e, view) {
        const frame = Math.floor(e.anim * 1.3) & 3, d = fl(e);
        if (lifecycle(ctx, e, view, S.ch.n[frame][d], S.ch.f[frame][d], false)) return;
        let img = S.ch.n[frame][d], dx = 0, dy = 0;
        if (e.mode === 'tele') {
          const shake = Math.floor(view.rt * 30) & 1;
          img = S.chTele[Math.floor(view.rt * 8) & 1][d];
          dx = e.modeT > 0.3 ? (shake ? 1 : -1) : 0;
          add(ctx, S.glowR, e.x + e.facing * 12, e.y - 20, 0.35 + 0.35 * Math.min(1, e.modeT / 0.72));
        } else if (e.mode === 'dash') {
          img = S.chDash[d];
          const g = S.chDashGhost[d];
          for (let k = 3; k >= 1; k--) {
            ctx.globalAlpha = 0.14 * (4 - k);
            blit(ctx, g, e.x - e.dashX * k * 7, e.y - e.dashY * k * 7, g.width / 2, g.height - 1);
          }
          ctx.globalAlpha = 1;
        } else if (e.mode === 'rest') {
          const w = Math.floor(view.rt * 5) & 1;
          img = S.chDizzy[w][d];
          dx = Math.round(Math.sin(view.rt * 9) * 1);
        }
        if (e.flash > 0.45) img = S.ch.f[frame][d];
        blit(ctx, img, e.x + dx, e.y + dy, img.width / 2, img.height - 1);
        if (e.mode === 'rest') {
          // stars circling above the drooping head
          const hx0 = e.x + e.facing * 10, hy0 = e.y - 25;
          for (let i = 0; i < 3; i++) {
            const a = view.rt * 6 + (i / 3) * U.TAU;
            const sx = hx0 + Math.cos(a) * 7, sy = hy0 + Math.sin(a) * 2.5;
            if (Math.sin(a) < -0.2 && i === 2) continue;
            ctx.drawImage(S.star, Math.round(sx - 2), Math.round(sy - 2));
          }
        }
      },
      mother(ctx, e, view) {
        const frame = Math.floor(e.anim * 1.1) & 3, d = fl(e);
        if (lifecycle(ctx, e, view, S.mo[frame][d], S.moF[frame][d], true)) return;
        let img = S.mo[frame][d];
        const b = e.birth || 0;
        if (b > 0) {
          add(ctx, S.glowM, e.x, e.y - 22, b * 0.8);
          if (b > 0.75) img = S.moSquash[d];
          else if (b > 0.45) img = S.moStretch[d];
        }
        if (e.flash > 0.45) img = S.moF[frame][d];
        blit(ctx, img, e.x, e.y, img.width / 2 - 3 * (e.facing < 0 ? -1 : 1), img.height - 1);
      },
      sprout(ctx, e, view) {
        const frame = Math.floor(e.anim * 2.4) & 3, d = fl(e);
        const img = S.so.n[frame][d];
        if (lifecycle(ctx, e, view, img, S.so.f[frame][d], false)) return;
        blit(ctx, e.flash > 0.45 ? S.so.f[frame][d] : img, e.x, e.y, img.width / 2, img.height - 1);
      },
    },
    shadow(ctx, o) {
      const W = { spitter: 14, bomber: 12, charger: 24, mother: 28, sprout: 8 }[o.type] || 14;
      let a = 1, w = W;
      if (o.dying) { if (o.deathT > 0.25) return true; a = 1 - o.deathT * 3; }
      if (o.spawnT < 1) w = Math.max(6, Math.round((W * (0.35 + 0.65 * o.spawnT)) / 2) * 2);
      let img = S.shadow[w];
      if (!img) img = S.shadow[w] = shadowSprite(w);
      ctx.globalAlpha = a;
      ctx.drawImage(img, Math.round(o.x + 1 - w / 2), Math.round(o.y - img.height / 2));
      ctx.globalAlpha = 1;
      return true;
    },
    shot(ctx, s, view) {
      const y = s.y - s.z;
      const sl = Math.hypot(s.vx, s.vy) || 1, ux = s.vx / sl, uy = s.vy / sl;
      const f = Math.floor(view.rt * 10 + s.seed * 7) & 1;
      add(ctx, S.glowG, s.x, y, 0.75);
      // dripping trail
      ctx.fillStyle = '#4f9a2a';
      ctx.fillRect(Math.round(s.x - ux * 7) - 1, Math.round(y - uy * 7) - 1, 2, 2);
      ctx.fillStyle = '#86d43a';
      ctx.fillRect(Math.round(s.x - ux * 11), Math.round(y - uy * 11 + ((s.age * 20) | 0) % 2), 1, 1);
      const img = S.shot[f];
      ctx.drawImage(img, Math.round(s.x - img.width / 2), Math.round(y - img.height / 2));
    },
    icons: {
      leech: (ctx, size) => drawIcon(ctx, 'leech', size),
      thorns: (ctx, size) => drawIcon(ctx, 'thorns', size),
      dashup: (ctx, size) => drawIcon(ctx, 'dashup', size),
      range: (ctx, size) => drawIcon(ctx, 'range', size),
    },
  });
})();
