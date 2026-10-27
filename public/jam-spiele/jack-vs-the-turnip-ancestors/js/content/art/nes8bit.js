/* Native art for the new enemies / upgrades in the 'nes8bit' world (8-Bit Arcade) – see js/content/ART_API.md.
   Same rules as js/styles/nes8bit.js: NES PPU palette only, flat colours, 1-px black outline, ~3 colours per sprite,
   palette-swap hit flash, poof on spawn, pixel explosion on death, no alpha in the world. 1 art px = 1.5 world units. */
(function () {
  'use strict';
  const U = window.U, C = window.Content;
  const PS = 1.5;

  const P = {
    k: '#000000', w: '#FCFCFC', g1: '#BCBCBC', g2: '#7C7C7C',
    gr0: '#005800', gr1: '#00A800', gr2: '#58D854',
    br0: '#503000', ochre: '#AC7C00', sand: '#F0D0B0', cream: '#FCE0A8',
    red0: '#881400', crim: '#A80020', red: '#F83800', orange: '#E45C10', lorange: '#FCA044',
    gold: '#F8B800', yellow: '#F8D878', navy: '#0000BC', blue: '#0058F8', blue2: '#0078F8', cyan: '#3CBCFC', ice: '#A4E4FC',
    purple: '#940084', magenta: '#D800CC', pink: '#F878F8', violet: '#6844FC', lime: '#B8F818',
  };
  const rgbCache = {};
  const rgbOf = (h) => rgbCache[h] || (rgbCache[h] = U.hex(h));

  /* ---------- sprite builder (copied from the style) ---------- */
  function mk(rows, map, opt) {
    opt = opt || {};
    const h = rows.length;
    let w = 0;
    for (const r of rows) if (r.length > w) w = r.length;
    const o = opt.outline === false ? 0 : 1;
    const W = w + 2 * o, H = h + 2 * o;
    const cell = new Array(W * H).fill(null);
    const src = new Uint8Array(W * H);
    for (let y = 0; y < h; y++) {
      const r = rows[y];
      for (let x = 0; x < r.length; x++) {
        const c = map[r[x]];
        if (!c) continue;
        const i = (y + o) * W + x + o;
        cell[i] = c; src[i] = 1;
      }
    }
    if (o) {
      const oc = opt.oc || P.k;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = y * W + x;
          if (src[i]) continue;
          let n = (x > 0 && src[i - 1] === 1) || (x < W - 1 && src[i + 1] === 1) || (y > 0 && src[i - W] === 1) || (y < H - 1 && src[i + W] === 1);
          if (!n && opt.diag) {
            n = (x > 0 && y > 0 && src[i - W - 1] === 1) || (x < W - 1 && y > 0 && src[i - W + 1] === 1) ||
              (x > 0 && y < H - 1 && src[i + W - 1] === 1) || (x < W - 1 && y < H - 1 && src[i + W + 1] === 1);
          }
          if (n) cell[i] = oc;
        }
      }
    }
    if (opt.checker !== undefined) {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (((x + y) & 1) !== opt.checker) cell[y * W + x] = null;
    }
    const { c, ctx } = U.canvas(W, H);
    const img = ctx.createImageData(W, H), d = img.data;
    for (let i = 0; i < W * H; i++) {
      const col = cell[i];
      if (!col) continue;
      const v = rgbOf(col);
      d[i * 4] = v[0]; d[i * 4 + 1] = v[1]; d[i * 4 + 2] = v[2]; d[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }
  const pair = (c) => ({ r: c, l: U.flipX(c) });
  function cg(w, h) {
    const a = [];
    for (let y = 0; y < h; y++) a.push(new Array(w).fill('.'));
    a.w = w; a.h = h;
    a.set = (x, y, ch) => { x = Math.floor(x); y = Math.floor(y); if (x >= 0 && y >= 0 && x < w && y < h) a[y][x] = ch; };
    a.get = (x, y) => { x = Math.floor(x); y = Math.floor(y); return x >= 0 && y >= 0 && x < w && y < h ? a[y][x] : '.'; };
    a.rows = () => a.map((r) => r.join(''));
    a.pts = (list, ch, ox = 0, oy = 0) => { for (const [x, y] of list) a.set(x + ox, y + oy, ch); };
    a.str = (rows, ox, oy) => { rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== '.') a.set(ox + i, oy + j, r[i]); }); };
    return a;
  }
  /** flat NES bulb: solid top colour, one checker row, light belly (like the style's creeper) */
  function bulb(g, cx, cy, rx, ry, top, bot, opt = {}) {
    const taper = opt.taper === undefined ? 0.45 : opt.taper, band = opt.band === undefined ? 0.46 : opt.band;
    const yb = Math.round(cy - ry + 2 * ry * band);
    const set = new Set();
    for (let y = Math.floor(cy - ry) - 1; y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx); x++) {
      let dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dy > 0.25) dx /= 1 - taper * (dy - 0.25);
      if (dx * dx + dy * dy > 1) continue;
      g.set(x, y, y < yb ? top : y === yb ? (((x + y) & 1) ? top : bot) : bot);
      set.add(x + ',' + y);
    }
    return set;
  }
  /** 1-px "inflate": grows the shape by one pixel (cheeks swelling) */
  function inflate(g, x0, y0, x1, y1) {
    const add = [];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (g.get(x, y) !== '.') continue;
      for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ch = g.get(x + ax, y + ay);
        if (ch !== '.' && ch !== 'g' && ch !== 'k') { add.push([x, y, ch]); break; }
      }
    }
    for (const [x, y, ch] of add) g.set(x, y, ch);
  }

  /* ---------- screen-space blit on the art grid (independent of the style's closure) ---------- */
  function blit(ctx, img, x, y, ax, ay) {
    const m = ctx.getTransform();
    const X = Math.round(m.a * x + m.e), Y = Math.round(m.d * y + m.f);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(img, X - ax, Y - ay);
    ctx.setTransform(m);
  }
  const blitFeet = (ctx, img, x, y, lift, dx) => blit(ctx, img, x, y, (img.width >> 1) - (dx || 0), img.height - 1 + (lift || 0));
  const blitMid = (ctx, img, x, y) => blit(ctx, img, x, y, img.width >> 1, img.height >> 1);

  /* ---------- effect frames (copied from the style) ---------- */
  function boomFrames(R) {
    const out = [];
    const S = Math.ceil(18 * R) | 1, c = (S - 1) / 2;
    const map = { W: P.w, y: P.gold, r: P.red };
    for (let f = 0; f < 4; f++) {
      const g = cg(S, S);
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const dx = x - c, dy = y - c, dd = Math.hypot(dx, dy), an = Math.atan2(dy, dx);
        const sec = Math.abs((((an / (Math.PI / 4)) % 1) + 1) % 1 - 0.5);
        let ch = '.';
        if (f === 0) {
          if (dd < 2.2 * R) ch = 'W';
          else if ((Math.abs(dx) < 0.6 * R + 0.1 || Math.abs(dy) < 0.6 * R + 0.1) && dd < 4.2 * R) ch = 'y';
        } else if (f === 1) {
          if (dd < 2.6 * R) ch = 'W';
          else if (dd < 4.4 * R) ch = 'y';
          else if (sec > 0.44 && dd < 7 * R) ch = 'r';
        } else if (f === 2) {
          const s8 = Math.floor((an + Math.PI) / (Math.PI / 4) + 0.5) & 1;
          if (dd > 4.6 * R && dd < 6.8 * R && s8 === 0) ch = 'r';
          else if (dd > 4.4 * R && dd < 6 * R && s8 === 1 && ((x + y) & 1) === 0) ch = 'y';
          else if (dd < 3 * R && ((x + y) & 1) === 0) ch = 'y';
        } else {
          for (let k = 0; k < 8; k++) {
            const a = (k * Math.PI) / 4 + Math.PI / 8;
            const bx = c + Math.cos(a) * 7.4 * R, by = c + Math.sin(a) * 7.4 * R;
            if (Math.abs(x - bx) < 0.9 * R + 0.2 && Math.abs(y - by) < 0.9 * R + 0.2) ch = k & 1 ? 'y' : 'r';
            const ix = c + Math.cos(a + 0.4) * 4.2 * R, iy = c + Math.sin(a + 0.4) * 4.2 * R;
            if (k % 2 === 0 && Math.abs(x - ix) < 0.6 && Math.abs(y - iy) < 0.6) ch = 'W';
          }
        }
        g[y][x] = ch;
      }
      out.push(mk(g.rows(), map, { outline: false }));
    }
    return out;
  }
  function poofFrames() {
    const out = [];
    const map = { W: P.w, L: P.g1, G: P.g2 };
    const blobs = [[[8, 9, 2.2], [6, 8, 1.8], [10, 8, 1.8]], [[8, 10, 3.2], [4.5, 8.5, 2.6], [11.5, 8.5, 2.6], [8, 5.5, 2.8]], null];
    for (let f = 0; f < 3; f++) {
      const g = cg(17, 15);
      if (f < 2) {
        for (let y = 0; y < 15; y++) for (let x = 0; x < 17; x++) {
          for (const [bx, by, r] of blobs[f]) {
            const dx = x + 0.5 - bx - 0.5, dy = y + 0.5 - by - 0.5, dd = Math.hypot(dx, dy);
            if (dd <= r) g[y][x] = dy > r * 0.35 && g[y][x] !== 'W' ? 'L' : 'W';
          }
        }
        out.push(mk(g.rows(), map));
      } else {
        for (let k = 0; k < 7; k++) {
          const a = (k / 7) * U.TAU, bx = 8 + Math.cos(a) * 6, by = 7.5 + Math.sin(a) * 5;
          for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) if (Math.abs(x) + Math.abs(y) < 2) g.set(Math.round(bx) + x, Math.round(by) + y, y < 0 ? 'L' : 'G');
        }
        out.push(mk(g.rows(), map, { outline: false }));
      }
    }
    return out;
  }
  function shadowSprite(w, par) {
    const h = Math.max(2, Math.round(w / 3));
    const g = cg(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (x + 0.5 - w / 2) / (w / 2), dy = (y + 0.5 - h / 2) / (h / 2);
      if (dx * dx + dy * dy <= 1 && ((x + y + par) & 1) === 0) g[y][x] = 'k';
    }
    return mk(g.rows(), { k: P.k }, { outline: false });
  }

  /* =====================================================================
     Enemy grids (chars → palette below), facing right
     ===================================================================== */
  // Rüben-Spucker – P purple, n light green (mottles, tube), c cream, h mouth hole, g leaves
  function spitterGrid(f, swell, recoil) {
    const g = cg(20, 18);
    const cy = 9.5 + (f & 1 ? -1 : 0);
    bulb(g, 7, cy, 6.3, 5.8, 'P', 'c', { taper: 0.4, band: 0.48 });
    // mottles: green blotches on the purple, a few on the belly
    for (const [x, y] of [[3, -3], [4, -3], [3, -2], [9, -4], [2, 0], [6, -1], [4, 3], [5, 3], [8, 4]]) {
      const yy = Math.round(cy) + y;
      if (g.get(x, yy) !== '.') g.set(x, yy, 'n');
    }
    const top = Math.floor(cy - 5.8);
    g.pts([[4, top - 2], [5, top - 1], [7, top - 3], [7, top - 2], [7, top - 1], [9, top - 2], [8, top - 1], [3, top - 3], [10, top - 3]], 'g');
    // face: black brows + cream/black eyes (like the creeper)
    const ey = Math.round(cy) - 3;
    g.pts([[7, ey], [10, ey]], 'k');
    g.pts([[7, ey + 1], [10, ey + 1]], 'k'); g.pts([[8, ey + 1], [11, ey + 1]], 'c');
    // tube
    const ty = Math.round(cy) + 1, x0 = 12, len = recoil ? 3 : 4 + (swell ? 1 : 0);
    for (let i = 0; i < len; i++) { g.set(x0 + i, ty - 1, 'n'); g.set(x0 + i, ty, 'c'); g.set(x0 + i, ty + 1, 'n'); }
    const ex = x0 + len;
    g.pts([[ex, ty - 2], [ex, ty - 1], [ex, ty + 1], [ex, ty + 2]], 'n');
    g.set(ex, ty, 'h');
    if (!recoil && !(f & 1)) g.set(ex - 1, ty + 3, 'n');
    if (swell) inflate(g, 0, top, 11, Math.round(cy + 5));
    if (swell > 1) inflate(g, 0, top + 1, 11, Math.round(cy + 4));
    if (recoil) g.pts([[ex + 2, ty], [ex + 3, ty - 2], [ex + 3, ty + 2], [ex + 4, ty]], 'n');
    // legs
    const L = [[[4, 16], [4, 17], [9, 16], [10, 17]], [[4, 16], [3, 17], [9, 16], [9, 17]], [[4, 16], [4, 17], [9, 16], [10, 17]], [[5, 16], [5, 17], [9, 16], [8, 17]]][f];
    g.pts(L.map(([x, y]) => [x, y + (f & 1 ? -1 : 0)]), 'c');
    return g;
  }
  // Zündrübe – R dark red, r red, W shine, g leaves, k eyes/fuse
  function bomberGrid(f, swell) {
    const g = cg(15, 15);
    const bob = f & 1 ? -1 : 0, cx = 6.5, cy = 7.5 + bob, r = 4.8 + swell * 0.8;
    for (let y = 0; y < 15; y++) for (let x = 0; x < 15; x++) {
      const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / r;
      if (dx * dx + dy * dy > 1) continue;
      g.set(x, y, dx + dy > 0.75 ? 'R' : 'r');
    }
    const iy = Math.floor(cy);
    g.pts([[4, iy - 3], [3, iy - 2], [4, iy - 2]], 'W');
    // mean eyes + teeth
    g.pts([[7, iy - 1], [10, iy - 1], [8, iy], [10, iy]], 'k');
    g.pts([[7, iy], [9, iy]], 'W');
    g.pts([[7, iy + 2], [8, iy + 2], [9, iy + 2], [10, iy + 2]], 'k'); g.pts([[8, iy + 2]], 'W');
    // leaves + fuse
    const top = Math.floor(cy - r);
    g.pts([[4, top], [3, top - 1], [2, top - 1], [5, top - 1]], 'g');
    g.pts([[6, top], [7, top - 1], [7, top - 2], [8, top - 3]], 'k');
    // root tail + legs
    g.pts([[1, iy + 3], [0, iy + 4]], 'R');
    const L = [[[3, 13], [2, 14], [9, 13], [10, 14]], [[4, 13], [4, 14], [8, 13], [8, 14]], [[3, 13], [3, 14], [9, 13], [9, 14]], [[4, 13], [5, 14], [8, 13], [7, 14]]][f];
    g.pts(L, 'R');
    g.fx = 9; g.fy = top - 4 + 1; // spark position (incl. outline)
    return g;
  }
  // Wurzel-Bock – c cream, s ochre, h grey horn, e eyes, g leaves
  function chargerGrid(f, pose, alt) {
    const W = 25, H = 18, GY = 17;
    const g = cg(W, H);
    const tilt = pose === 1 ? -0.3 : pose === 2 ? 0.14 : 0;
    const bob = pose === 0 && (f & 1) ? -1 : 0;
    const sy = (x) => tilt * (x - 11);
    const cy0 = 10 + bob;
    for (let x = 1; x < 20; x++) {
      const u = (x - 1) / 18;
      const rr = u > 0.7 ? 4.6 * Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.7) / 0.32, 2))) : 1 + 3.6 * Math.pow(u / 0.7, 0.7);
      const ccy = cy0 + sy(x) + (u < 0.3 ? (0.3 - u) * 5 : 0);
      const yb = Math.round(ccy + rr * 0.3);
      for (let y = Math.floor(ccy - rr); y <= Math.ceil(ccy + rr) - 1; y++) {
        let ch = y < yb ? 'c' : y === yb ? (((x + y) & 1) ? 'c' : 's') : 's';
        if (x % 4 === 2 && y < yb && y > ccy - rr + 1) ch = 's'; // parsnip rings
        g.set(x, y, ch);
      }
    }
    const my = Math.round(cy0 + sy(11) - 5);
    g.pts([[10, my], [11, my - 1], [11, my - 2], [12, my - 1], [13, my - 2], [9, my - 1], [8, my - 2], [12, my]], 'g');
    // legs
    const leg = (x, y0, y1, dx) => {
      for (let y = y0; y <= y1; y++) { const xx = x + Math.round((dx * (y - y0)) / Math.max(1, y1 - y0)); g.set(xx, y, 's'); g.set(xx + 1, y, 's'); }
    };
    const lt = (x) => Math.round(cy0 + sy(x) + 2);
    if (pose === 2) { leg(3, lt(3), GY, -2); leg(6, lt(6), GY, -1); leg(14, lt(14), GY, 2); leg(17, lt(17), GY, 1); }
    else if (pose === 1) {
      leg(3, lt(3), GY, 0); leg(6, lt(6), GY, 0); leg(14, lt(14), lt(14) + 2, 1); leg(17, lt(17), lt(17) + (alt ? 5 : 3), 1);
      if (alt) g.pts([[21, GY], [22, GY - 1], [23, GY - 2]], 's');
    } else {
      const a = pose === 0 && f === 1 ? -1 : 0, b = pose === 0 && f === 3 ? -1 : 0;
      leg(3, lt(3), GY + b, 0); leg(6, lt(6), GY + a, 0); leg(14, lt(14), GY + a, 0); leg(17, lt(17), GY + b, 0);
    }
    // head
    const hl = pose === 1 ? -4 : pose === 2 ? 1 : pose === 3 ? 1 + (alt ? 1 : 0) : 0;
    const hx = 20 + (pose === 2 ? 1 : 0), hy = Math.round(cy0 + sy(20) + 1 + hl);
    for (let y = hy - 3; y <= hy + 3; y++) for (let x = hx - 3; x <= hx + 4; x++) {
      const dx = (x + 0.5 - hx - 0.5) / 3.6, dy = (y + 0.5 - hy) / 3.1;
      if (dx * dx + dy * dy > 1) continue;
      g.set(x, y, y >= hy + 2 ? 's' : 'c');
    }
    g.pts([[hx + 4, hy + 1]], 'k'); // nostril
    if (pose === 3) g.pts([[hx + 1, hy - 1], [hx + 2, hy], [hx + 1, hy + 1], [hx + 3, hy - 1], [hx + 3, hy + 1]], 'k');
    else { g.pts([[hx + 1, hy - 1], [hx + 2, hy - 1], [hx + 3, hy]], 'k'); g.pts([[hx + 2, hy]], 'e'); g.set(hx + 1, hy, 'k'); }
    // curled horn (grey ring with a black hollow) on the side of the head
    const hcx = hx - 2, hcy = hy - 1;
    const ring = [[-1, -3], [0, -3], [1, -3], [2, -2], [-2, -2], [-3, -1], [-3, 0], [-3, 1], [-2, 2], [-1, 3], [0, 3], [1, 2], [2, 1], [2, -1]];
    const rs = new Set(ring.map(([x, y]) => x + ',' + y));
    for (const [dx, dy] of ring) for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = dx + ax, ny = dy + ay;
      if (rs.has(nx + ',' + ny) || (Math.abs(nx) <= 1 && Math.abs(ny) <= 2 && Math.abs(nx) + Math.abs(ny) < 3)) continue;
      if (g.get(hcx + nx, hcy + ny) !== '.') g.set(hcx + nx, hcy + ny, 'k');
    }
    ring.forEach(([dx, dy]) => g.set(hcx + dx, hcy + dy, 'h'));
    g.pts([[hcx, hcy], [hcx - 1, hcy], [hcx, hcy - 1], [hcx - 1, hcy + 1], [hcx, hcy + 1], [hcx + 1, hcy], [hcx - 1, hcy - 1], [hcx + 1, hcy - 1]], 'h');
    g.pts([[hcx, hcy], [hcx - 1, hcy - 1]], 'k');
    g.pts([[hcx - 1, hcy - 2], [hcx - 2, hcy], [hcx, hcy + 2]], 'k'); // ridges
    if (pose === 2) g.pts([[0, cy0 - 4], [1, cy0 - 4], [0, cy0 - 1], [0, cy0 + 2], [1, cy0 + 2]], 'c');
    return g;
  }
  // Rüben-Ahnin – P purple, c cream, r shawl red, y gold (glasses, brooch), g leaves, m baby magenta, b cane brown
  function motherGrid(f, form) {
    const W = 30, H = 28;
    const g = cg(W, H);
    const bob = f & 1 ? 1 : 0;
    const sx = form === 1 ? -1 : form === 2 ? 1.3 : 0, syk = form === 1 ? 1.4 : form === 2 ? -1.3 : 0;
    const la = f === 0 ? -1 : 0, lb = f === 2 ? -1 : 0;
    for (let y = 22; y < 27; y++) { for (let x = 7; x < 11; x++) g.set(x, y + la, 'b'); for (let x = 14; x < 18; x++) g.set(x, y + lb, 'b'); }
    g.pts([[6, 26 + la], [11, 26 + la], [13, 26 + lb], [18, 26 + lb]], 'b');
    const cx = 12, cy = 14.5 + bob - syk * 0.5, rx = 9.6 + sx, ry = 9 + syk;
    const body = bulb(g, cx, cy, rx, ry, 'P', 'c', { taper: 0.3, band: 0.36 });
    // wrinkles
    const icy = Math.round(cy);
    g.pts([[4, icy - 4], [5, icy - 4], [6, icy - 3], [15, icy - 6], [16, icy - 6], [5, icy + 1], [6, icy + 1]], 'k');
    // shawl band
    const s0 = Math.round(cy + ry * 0.38), s1 = s0 + 3;
    for (const k of body) {
      const [x, y] = k.split(',').map(Number);
      if (y < s0 || y > s1) continue;
      g.set(x, y, (y === s0 + 1 || y === s0 + 2) && (x + (y === s0 + 1 ? 0 : 2)) % 4 === 0 ? 'c' : 'r');
    }
    for (let x = Math.round(cx - rx * 0.6); x <= Math.round(cx + rx * 0.7); x += 2) if (body.has(x + ',' + (s1 + 1))) g.set(x, s1 + 1, 'r');
    g.pts([[Math.round(cx + rx * 0.6), s0 + 1], [Math.round(cx + rx * 0.6) + 1, s0 + 1], [Math.round(cx + rx * 0.6), s0 + 2]], 'y');
    // face: gold round spectacles with dark eyes, frown
    const ex = icy - 1 > 0 ? Math.round(cx) + 2 : 0, ey = icy - 2;
    for (const ox of [0, 5]) {
      g.pts([[ex + ox, ey - 1], [ex + ox + 1, ey - 1], [ex + ox + 2, ey - 1], [ex + ox - 1, ey], [ex + ox + 3, ey], [ex + ox - 1, ey + 1], [ex + ox + 3, ey + 1], [ex + ox, ey + 2], [ex + ox + 1, ey + 2], [ex + ox + 2, ey + 2]], 'y');
      g.pts([[ex + ox, ey], [ex + ox + 1, ey], [ex + ox + 2, ey]], 'k');
      g.pts([[ex + ox + 1, ey + 1]], 'k');
    }
    g.pts([[ex + 2, ey + 6], [ex + 3, ey + 5], [ex + 4, ey + 5], [ex + 5, ey + 5], [ex + 6, ey + 6]], 'k');
    // crown leaves + three babies
    const top = Math.floor(cy - ry);
    g.pts([[9, top], [8, top - 1], [7, top - 2], [15, top], [16, top - 1], [17, top - 2], [12, top - 1], [12, top]], 'g');
    const baby = (bx, by) => {
      g.str(['.mm.', 'mmmm', 'ckck', '.cc.'], bx, by);
      g.pts([[bx + 1, by - 1], [bx + 2, by - 2]], 'g');
    };
    baby(4, top - 3 + (f === 1 ? 1 : 0)); baby(10, top - 5 + (f === 2 ? 1 : 0)); baby(16, top - 3 + (f === 3 ? 1 : 0));
    // root arm + cane
    const cxn = Math.round(cx + rx + 2) + (f === 1 || f === 2 ? 1 : 0), ay = Math.round(cy + 3);
    for (let x = Math.round(cx + rx) - 1; x < cxn; x++) g.set(x, ay, 'b');
    for (let y = ay - 3; y <= 26; y++) g.set(cxn, y, 'b');
    g.pts([[cxn - 1, ay - 3], [cxn - 1, ay - 4], [cxn, ay - 4]], 'b');
    return g;
  }
  // Rübchen – m magenta top, c cream, g leaf
  function sproutGrid(f) {
    const g = cg(10, 11);
    const bob = f & 1 ? -1 : 0, cy = 5.5 + bob;
    bulb(g, 4.5, cy, 3.8, 3.5, 'm', 'c', { taper: 0.45, band: 0.42 });
    const top = Math.floor(cy - 3.5);
    g.pts([[4, top], [3, top - 1], [2, top - 1], [2, top - 2], [1, top - 2]], 'g');
    g.pts([[5, Math.floor(cy)], [7, Math.floor(cy)]], 'k'); g.pts([[4, Math.floor(cy) - 1], [8, Math.floor(cy) - 1]], 'k');
    const L = [[[3, 9], [2, 10], [6, 9], [7, 10]], [[3, 9], [3, 10], [6, 9], [6, 10]], [[3, 9], [2, 10], [6, 9], [6, 10]], [[4, 9], [4, 10], [6, 9], [5, 10]]][f];
    g.pts(L.map(([x, y]) => [x, y + bob]), 'c');
    return g;
  }

  /* ---------- palettes (normal + flash swaps, like the style's creeperF) ---------- */
  const PAL = {
    spit: { P: P.purple, n: P.gr2, c: P.cream, g: P.gr1, k: P.k, h: P.k },
    spitF: { P: P.red, n: P.w, c: P.w, g: P.w, k: P.k, h: P.k },
    bomb: { R: P.crim, r: P.red, W: P.w, g: P.gr1, k: P.k },
    bombHot: { R: P.red, r: P.gold, W: P.w, g: P.gr1, k: P.k },
    bombWhite: { R: P.g1, r: P.w, W: P.w, g: P.w, k: P.red },
    bombF: { R: P.red, r: P.w, W: P.w, g: P.w, k: P.k },
    ch: { c: P.cream, s: P.ochre, h: P.g1, e: P.cream, g: P.gr1, k: P.k },
    chRed: { c: P.cream, s: P.ochre, h: P.g1, e: P.red, g: P.gr1, k: P.k },
    chF: { c: P.w, s: P.red, h: P.w, e: P.red, g: P.w, k: P.k },
    mo: { P: P.purple, c: P.cream, r: P.crim, y: P.gold, g: P.gr1, m: P.magenta, b: P.ochre, k: P.k },
    moF: { P: P.pink, c: P.w, r: P.red, y: P.w, g: P.w, m: P.pink, b: P.yellow, k: P.k },
    so: { m: P.magenta, c: P.cream, g: P.gr1, k: P.k },
    soF: { m: P.red, c: P.w, g: P.w, k: P.k },
  };

  /* ---------- icons (14×14 rows, same map/framing as the style) ---------- */
  const ICON_MAP = {
    r: P.red, W: P.w, g: P.gr1, P: P.purple, c: P.cream, k: P.k, s: P.ochre, b: P.ochre, d: P.br0, y: P.gold,
    L: P.g1, G: P.g2, o: P.orange, e: P.gold, m: P.magenta, n: P.gr2, R: P.red0, l: P.lorange, C: P.cyan, v: P.violet, Y: P.yellow,
    i: P.ice, B: P.blue2, a: P.lime,
  };
  const ICONS = {
    leech: [
      '.W...W........',
      '.WW..WW..rr.rr',
      '..W...W..rWrrr',
      '.WW..WW..rrrrr',
      '.W...W....rrr.',
      '...........r..',
      '.cccccccccccc.',
      'llollloollolld',
      'bcccccccccccbd',
      '.bbbbbbbbbbbd.',
      '..bbbbbbbbbd..',
      '...bbbbbbdd...',
      '....ddddd.....',
      '..............',
    ],
    thorns: [
      '......W.......',
      '..W...L...W...',
      '...L.gPg.L....',
      '....PPPPP.....',
      '...PPPPPPP....',
      'WLLPkPPPkPLLW.',
      '...PPkPkPPP...',
      '...cPcPcPcP...',
      '....ccccccc...',
      '...L.ccccc.L..',
      '..W...ccc..W..',
      '......L.......',
      '......W.......',
      '..............',
    ],
    dashup: [
      '.........g....',
      '.......oogoo..',
      '......olooooor',
      '.yy..olokooko.',
      '.....oookookor',
      'yyyy.oooooooor',
      '.....ookkkkkor',
      '.yyy.oookokor.',
      '......rrrrrr..',
      '..............',
      '.LL.L.L.LL....',
      '..............',
      '..............',
      '..............',
    ],
    range: [
      '..........cc..',
      '.........cWcs.',
      '.........ccss.',
      '......W...ss..',
      '....W.........',
      '...W..........',
      '..W...........',
      '..W...........',
      '.W.......rrr..',
      '.W......rWWWr.',
      '.W......rWrWr.',
      'W.......rWWWr.',
      'W........rrr..',
      '..............',
    ],
  };
  const iconCache = {};
  function drawIcon(ctx, id, size) {
    let c = iconCache[id];
    if (!c) {
      const img = mk(ICONS[id], ICON_MAP, { diag: false });
      const t = U.canvas(16, 16);
      t.ctx.drawImage(img, Math.floor((16 - img.width) / 2), Math.floor((16 - img.height) / 2));
      c = iconCache[id] = t.c;
    }
    const s = Math.max(1, Math.floor(size / 16));
    ctx.imageSmoothingEnabled = false;
    const o = Math.floor((size - 16 * s) / 2);
    ctx.drawImage(c, o, o, 16 * s, 16 * s);
  }

  /* =====================================================================
     Build + draw
     ===================================================================== */
  let S = null;
  const both = (g, pal) => pair(mk(g.rows(), pal));
  function build() {
    const s = {};
    s.spit = [0, 1, 2, 3].map((f) => both(spitterGrid(f, 0, false), PAL.spit));
    s.spitF = [0, 1, 2, 3].map((f) => both(spitterGrid(f, 0, false), PAL.spitF));
    // aim: [level][tremble frame]; hole glows green → white
    s.spitAim = [0, 1, 2].map((lv) => [0, 2].map((f) => both(spitterGrid(f, lv ? 2 : 1, false), Object.assign({}, PAL.spit, { h: lv === 0 ? P.gr2 : lv === 1 ? P.lime : P.w, n: lv === 2 ? P.lime : P.gr2 }))));
    s.spitRec = both(spitterGrid(0, 0, true), Object.assign({}, PAL.spit, { h: P.gr2 }));
    const bg = [0, 1, 2, 3].map((f) => bomberGrid(f, 0)), bga = [0, 1, 2, 3].map((f) => bomberGrid(f, 1));
    s.bomb = bg.map((g) => both(g, PAL.bomb)); s.bombF = bg.map((g) => both(g, PAL.bombF));
    s.bombArm = bga.map((g) => both(g, PAL.bomb)); s.bombHot = bga.map((g) => both(g, PAL.bombHot)); s.bombWhite = bga.map((g) => both(g, PAL.bombWhite));
    s.bombFx = [bg, bga].map((set) => set.map((g) => [g.fx, g.fy]));
    const cgr = [0, 1, 2, 3].map((f) => chargerGrid(f, 0, 0));
    s.ch = cgr.map((g) => both(g, PAL.ch)); s.chF = cgr.map((g) => both(g, PAL.chF));
    s.chTele = [0, 1].map((a) => both(chargerGrid(0, 1, a), PAL.chRed));
    const dg = chargerGrid(0, 2, 0);
    s.chDash = both(dg, PAL.chRed);
    s.chGhost = pair(mk(dg.rows(), { c: P.cream, s: P.cream, h: P.cream, e: P.cream, g: P.cream, k: P.cream }, { outline: false, checker: 0 }));
    s.chDizzy = [0, 1].map((a) => both(chargerGrid(0, 3, a), PAL.ch));
    const mg = [0, 1, 2, 3].map((f) => motherGrid(f, 0));
    s.mo = mg.map((g) => both(g, PAL.mo)); s.moF = mg.map((g) => both(g, PAL.moF));
    s.moStretch = both(motherGrid(0, 1), PAL.mo); s.moSquash = both(motherGrid(1, 2), PAL.mo);
    s.moStretchB = both(motherGrid(0, 1), Object.assign({}, PAL.mo, { m: P.pink, y: P.w })); s.moSquashB = both(motherGrid(1, 2), Object.assign({}, PAL.mo, { m: P.pink, y: P.w }));
    const sg = [0, 1, 2, 3].map(sproutGrid);
    s.so = sg.map((g) => both(g, PAL.so)); s.soF = sg.map((g) => both(g, PAL.soF));
    // enemy shot: black-rimmed glob of toxic juice, blinking core
    const SH = ['.nnnn.', 'nnWWnn', 'nWWWan', 'nnWaan', 'nnaaan', '.nnnn.'];
    s.shot = [mk(SH, { n: P.gr1, W: P.w, a: P.lime }), mk(SH, { n: P.lime, W: P.yellow, a: P.gr2 })];
    s.drip = [mk(['n'], { n: P.gr2 }), mk(['n'], { n: P.lime })];
    s.spark = [mk(['.y.', 'yWy', '.y.'], { y: P.gold, W: P.w }, { outline: false }), mk(['..W..', '.yry.', 'WrWrW', '.yry.', '..W..'], { y: P.gold, r: P.red, W: P.w }, { outline: false }),
      mk(['W.y.W', '.yWy.', 'yWWWy', '.yWy.', 'W.y.W'], { y: P.gold, W: P.w }, { outline: false })];
    s.star = [mk(['.W.', 'WyW', '.W.'], { y: P.gold, W: P.yellow }), mk(['y.y', '.W.', 'y.y'], { y: P.gold, W: P.w }, { outline: false })];
    s.boom = boomFrames(1); s.boomS = boomFrames(0.7); s.boomBig = boomFrames(1.4);
    s.poof = poofFrames();
    s.shadow = {};
    for (const w of [6, 8, 10, 12, 16, 20]) s.shadow[w] = [shadowSprite(w, 0), shadowSprite(w, 1)];
    return s;
  }

  /** spawn (poof) / death (pixel explosion) like the style's creeper */
  function lifecycle(ctx, e, mid, boom) {
    if (e.dying) {
      const f = Math.min(3, Math.floor(e.deathT * 4));
      blitMid(ctx, boom[f], e.x, e.y - mid * PS);
      return true;
    }
    if (e.spawnT < 0.6) {
      blitMid(ctx, S.poof[Math.min(2, Math.floor(e.spawnT / 0.2))], e.x, e.y - Math.min(10, mid * 0.7) * PS);
      return true;
    }
    return false;
  }
  const lingerPoof = (ctx, e, mid) => { if (e.spawnT < 0.8) blitMid(ctx, S.poof[2], e.x, e.y - Math.min(10, mid * 0.7) * PS); };
  const fl = (e) => (e.facing < 0 ? 'l' : 'r');

  C.art('nes8bit', {
    init() { S = build(); },
    enemies: {
      spitter(ctx, e, view) {
        if (lifecycle(ctx, e, 9, S.boom)) return;
        const f = Math.floor(e.anim * 1.6) & 3, d = fl(e);
        let img = S.spit[f][d], dx = 0;
        if (e.mode === 'aim') {
          const lv = e.charge < 0.35 ? 0 : e.charge < 0.75 ? 1 : 2;
          const tr = Math.floor(view.rt * (12 + e.charge * 14)) & 1;
          img = S.spitAim[lv][tr][d];
          if (e.charge > 0.5) dx = tr ? 1 : 0;
        } else if (e.spit > 0.45) img = S.spitRec[d];
        if (e.flash > 0.45) img = S.spitF[f][d];
        const sh = e.facing < 0 ? 2 : -2; // tube sticks out: keep the body over the feet
        blitFeet(ctx, img, e.x, e.y, 0, sh + dx);
        lingerPoof(ctx, e, 9);
      },
      bomber(ctx, e, view) {
        if (lifecycle(ctx, e, 7, S.boomS)) return;
        const f = Math.floor(e.anim * 2.2) & 3, d = fl(e);
        let img = e.armed ? S.bombArm[f][d] : S.bomb[f][d];
        if (e.armed) {
          const k = e.fuse || 0, rate = 4 + k * k * 24;
          const on = ((view.rt * rate + e.seed) % 1) < 0.5;
          if (on) img = (k > 0.6 && ((view.rt * rate * 0.5) % 1) < 0.5 ? S.bombWhite : S.bombHot)[f][d];
        }
        if (e.flash > 0.45) img = S.bombF[f][d];
        blitFeet(ctx, img, e.x, e.y);
        // fuse spark
        const [fx, fy] = S.bombFx[e.armed ? 1 : 0][f];
        const m = ctx.getTransform();
        const X0 = Math.round(m.a * e.x + m.e) - (img.width >> 1), Y0 = Math.round(m.d * e.y + m.f) - (img.height - 1);
        const px = X0 + (e.facing < 0 ? img.width - 1 - fx : fx), py = Y0 + fy;
        const flick = Math.floor(view.rt * 14 + e.seed * 9) & 1;
        const lvl = e.armed ? (e.fuse > 0.5 ? 2 : 1) : flick;
        const sp = S.spark[e.armed && flick ? Math.max(0, lvl - 1) : lvl];
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(sp, px - (sp.width >> 1), py - (sp.height >> 1));
        ctx.setTransform(m);
        lingerPoof(ctx, e, 7);
      },
      charger(ctx, e, view) {
        if (lifecycle(ctx, e, 9, S.boom)) return;
        const f = Math.floor(e.anim * 1.4) & 3, d = fl(e);
        let img = S.ch[f][d], dx = 0;
        if (e.mode === 'tele') {
          img = S.chTele[Math.floor(view.rt * 8) & 1][d];
          if (e.modeT > 0.3) dx = Math.floor(view.rt * 24) & 1;
        } else if (e.mode === 'dash') {
          img = S.chDash[d];
          const gimg = S.chGhost[d];
          for (let i = 2; i >= 1; i--) if (((Math.floor(view.rt * 30) + i) & 1) === 0 || i === 1) blitFeet(ctx, gimg, e.x - e.dashX * i * 8, e.y - e.dashY * i * 8);
        } else if (e.mode === 'rest') {
          img = S.chDizzy[Math.floor(view.rt * 5) & 1][d];
          dx = Math.round(Math.sin(view.rt * 9) * 0.6);
        }
        if (e.flash > 0.45) img = S.chF[f][d];
        blitFeet(ctx, img, e.x, e.y, 0, dx);
        if (e.mode === 'rest') {
          for (let i = 0; i < 3; i++) {
            const a = view.rt * 6 + (i / 3) * U.TAU;
            blitMid(ctx, S.star[(i + Math.floor(view.rt * 8)) & 1], e.x + e.facing * 13 + Math.cos(a) * 9, e.y - 26 + Math.sin(a) * 3);
          }
        }
        lingerPoof(ctx, e, 9);
      },
      mother(ctx, e, view) {
        if (lifecycle(ctx, e, 14, S.boomBig)) return;
        const f = Math.floor(e.anim * 0.9) & 3, d = fl(e);
        let img = S.mo[f][d];
        const b = e.birth || 0;
        if (b > 0) {
          const blink = Math.floor(view.rt * 16) & 1;
          if (b > 0.75) img = (blink ? S.moSquashB : S.moSquash)[d];
          else if (b > 0.45) img = (blink ? S.moStretchB : S.moStretch)[d];
          if (b > 0.3) for (let i = 0; i < 4; i++) {
            const a = (i / 4) * U.TAU + view.rt * 3;
            blitMid(ctx, S.star[(i + Math.floor(view.rt * 10)) & 1], e.x + Math.cos(a) * (18 + (1 - b) * 10), e.y - 20 + Math.sin(a) * 9);
          }
        }
        if (e.flash > 0.45) img = S.moF[f][d];
        blitFeet(ctx, img, e.x, e.y, 0, e.facing < 0 ? 3 : -3);
        lingerPoof(ctx, e, 14);
      },
      sprout(ctx, e) {
        if (lifecycle(ctx, e, 5, S.boomS)) return;
        const f = Math.floor(e.anim * 2.4) & 3, d = fl(e);
        blitFeet(ctx, (e.flash > 0.45 ? S.soF : S.so)[f][d], e.x, e.y);
        lingerPoof(ctx, e, 5);
      },
    },
    shadow(ctx, o) {
      if (o.dying || o.spawnT < 0.55) return true;
      const w = { spitter: 12, bomber: 10, charger: 16, mother: 20, sprout: 6 }[o.type] || 12;
      const set = S.shadow[w];
      const m = ctx.getTransform();
      const x = Math.round(m.a * o.x + m.e), y = Math.round(m.d * o.y + m.f);
      const img = set[(x + y) & 1];
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(img, x - (img.width >> 1), y - (img.height >> 1));
      ctx.setTransform(m);
      return true;
    },
    shot(ctx, s, view) {
      const y = s.y - s.z;
      const f = Math.floor(view.rt * 10 + s.seed * 7) & 1;
      const sp = Math.hypot(s.vx, s.vy) || 1, ux = s.vx / sp, uy = s.vy / sp;
      blitMid(ctx, S.drip[f], s.x - ux * 7, y - uy * 7);
      if (s.age > 0.05) blitMid(ctx, S.drip[1 - f], s.x - ux * 11, y - uy * 11);
      blitMid(ctx, S.shot[f], s.x, y);
    },
    icons: {
      leech: (ctx, size) => drawIcon(ctx, 'leech', size),
      thorns: (ctx, size) => drawIcon(ctx, 'thorns', size),
      dashup: (ctx, size) => drawIcon(ctx, 'dashup', size),
      range: (ctx, size) => drawIcon(ctx, 'range', size),
    },
  });
})();
