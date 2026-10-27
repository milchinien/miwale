/* Native art for the new enemies / upgrades in the 'kuerbisboy' world (Kürbis-Boy, 4-colour LCD) – see js/content/ART_API.md.
   Same rules as js/styles/kuerbisboy.js: 1 art pixel = 2 world units, exactly four palette colours, 1-px dark outline,
   shading only via checker dither, hit flash = palette inversion, death = inverted frame → pixel puff. */
(function () {
  'use strict';
  const U = window.U, C = window.Content;

  /* ---------- palette + grid helpers (copied from the style) ---------- */
  const PS = 2;
  const HEX = ['#2a1712', '#7c3a1e', '#e0812c', '#f6d7a1'];
  const RGB = HEX.map((h) => U.hex(h));
  const PX32 = RGB.map((c) => ((255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0]) >>> 0);
  const INV = [3, 2, 1, 0];
  const B4 = U.bayer4;
  const bay = (x, y) => B4[((y & 3) << 2) | (x & 3)];

  function IG(w, h) {
    const a = new Int8Array(w * h).fill(-1);
    return {
      w, h, a,
      set(x, y, v) { x = Math.floor(x); y = Math.floor(y); if (x >= 0 && y >= 0 && x < w && y < h) a[y * w + x] = v; },
      get(x, y) { x = Math.floor(x); y = Math.floor(y); return x >= 0 && y >= 0 && x < w && y < h ? a[y * w + x] : -1; },
      rows(rows, ox = 0, oy = 0) {
        for (let y = 0; y < rows.length; y++) {
          const r = rows[y];
          for (let x = 0; x < r.length; x++) {
            const ch = r.charCodeAt(x);
            if (ch >= 48 && ch <= 51) this.set(ox + x, oy + y, ch - 48);
            else if (ch === 120) this.set(ox + x, oy + y, -1);
          }
        }
        return this;
      },
    };
  }
  function outline(g, col = 0) {
    const o = IG(g.w + 2, g.h + 2);
    for (let y = 0; y < o.h; y++) {
      for (let x = 0; x < o.w; x++) {
        const v = g.get(x - 1, y - 1);
        if (v >= 0) { o.a[y * o.w + x] = v; continue; }
        if (g.get(x - 2, y - 1) >= 0 || g.get(x, y - 1) >= 0 || g.get(x - 1, y - 2) >= 0 || g.get(x - 1, y) >= 0) o.a[y * o.w + x] = col;
      }
    }
    return o;
  }
  function toCanvas(g, map) {
    const { c, ctx } = U.canvas(g.w, g.h);
    const img = ctx.createImageData(g.w, g.h);
    const d32 = new Uint32Array(img.data.buffer);
    for (let i = 0; i < g.a.length; i++) {
      let v = g.a[i];
      if (v < 0) continue;
      if (map) v = map[v];
      if (v < 0) continue;
      d32[i] = PX32[v];
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }
  function sset(g) {
    const r = toCanvas(g), ri = toCanvas(g, INV);
    return { r, l: U.flipX(r), ri, li: U.flipX(ri), w: g.w, h: g.h, g };
  }
  function blit(ctx, img, x, y, ax = 0.5, ay = 1, oy = 0, ox = 0) {
    const w = img.width, h = img.height;
    const px = Math.round(x / PS - w * ax) + ox, py = Math.round(y / PS - h * ay) + oy;
    ctx.drawImage(img, px * PS, py * PS, w * PS, h * PS);
  }
  function dot(ctx, x, y, ci, w = 1, h = 1) {
    ctx.fillStyle = HEX[ci];
    ctx.fillRect(Math.round(x / PS) * PS, Math.round(y / PS) * PS, w * PS, h * PS);
  }
  const rowsC = (rows, ol = true) => {
    const g = IG(Math.max(...rows.map((r) => r.length)), rows.length).rows(rows);
    return toCanvas(ol ? outline(g) : g);
  };

  /** Bulb body with the style's LCD shading: dark top band, checker transitions, cream belly, shaded right flank.
      bands = [top end, mid end] in 0..1 (t from top to bottom). */
  function bulbGrid(g, cx, cy, rx, ry, opt = {}) {
    const taper = opt.taper === undefined ? 0.4 : opt.taper;
    const b0 = opt.b0 || 0.42, b1 = opt.b1 || 0.68;
    const set = new Set();
    for (let y = Math.floor(cy - ry) - 1; y <= Math.ceil(cy + ry) + 1; y++) {
      for (let x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx) + 1; x++) {
        let dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dy > 0.2) dx /= 1 - taper * (dy - 0.2);
        if (dx * dx + dy * dy > 1) continue;
        const t = (dy + 1) / 2, ck = (x + y) & 1;
        let c = t < b0 ? 1 : t < b0 + 0.08 ? (ck ? 2 : 1) : t < b1 ? 2 : t < b1 + 0.08 ? (ck ? 3 : 2) : 3;
        if (opt.top !== undefined && t < b0) c = opt.top;
        if (dx > 0.62) c = Math.max(c === 3 ? 2 : 1, c - 1);
        else if (dx > 0.45 && ck) c = Math.max(1, c - 1);
        if (dx < -0.55 && t > 0.15 && t < b0 && ck) c = 2;
        g.set(x, y, c);
        set.add(x + ',' + y);
      }
    }
    return set;
  }
  const P = (g, list, c, ox = 0, oy = 0) => { for (const [x, y] of list) g.set(x + ox, y + oy, c); };

  /* =====================================================================
     Enemies (art px; facing right)
     ===================================================================== */
  // Rüben-Spucker: spotted turnip with a fat spit tube.  swell 0..2, glow 0..2, recoil
  function spitterFrame(f, swell, glow, recoil) {
    const g = IG(17, 15);
    const sw = swell * 0.45, sq = recoil ? 0.7 : 0;
    const cx = 6, cy = 7 + (f & 1 ? -0.5 : 0) + sq * 0.6, rx = 4.9 + sw + sq, ry = 4.5 + sw * 0.6 - sq;
    const body = bulbGrid(g, cx, cy, rx, ry, { taper: 0.35, b0: 0.44, b1: 0.7 });
    // spotted / mottled skin (sick spots on the dark top, dark spots on the belly)
    for (const k of body) {
      const [x, y] = k.split(',').map(Number);
      const v = g.get(x, y);
      if (v === 1 && ((x * 3 + y * 5) % 7 === 0)) g.set(x, y, 2);
      else if (v === 3 && ((x * 5 + y * 3) % 6 === 0)) g.set(x, y, 1);
    }
    const top = Math.floor(cy - ry);
    // three spiky leaves
    P(g, [[3, top - 2], [4, top - 1], [6, top - 3], [6, top - 2], [6, top - 1], [8, top - 2], [7, top - 1]], 2);
    P(g, [[5, top], [6, top], [7, top]], 1);
    // root legs
    const L = [[[3, 12], [3, 13], [7, 12], [7, 13], [8, 13]], [[3, 12], [3, 13], [2, 13], [7, 12], [7, 13]], [[3, 12], [3, 13], [7, 12], [7, 13], [8, 13]], [[3, 12], [2, 13], [3, 13], [7, 12], [7, 13]]][f];
    P(g, L, 1);
    // eyes + brows (above the tube)
    const ey = Math.round(cy) - 2;
    P(g, [[5, ey - 1], [8, ey - 1]], 0);
    P(g, [[6, ey], [9, ey]], 3); P(g, [[7, ey], [10, ey]], 0);
    // spit tube
    const ty = Math.round(cy) + 1;
    const x0 = Math.round(cx + rx) - 1, len = recoil ? 2 : 3 + (swell > 1 ? 1 : 0);
    for (let i = 0; i < len; i++) { g.set(x0 + i, ty - 1, 2); g.set(x0 + i, ty, 3); g.set(x0 + i, ty + 1, 1); }
    const ex = x0 + len; // rim
    P(g, [[ex, ty - 2], [ex, ty - 1]], 2); P(g, [[ex, ty + 1], [ex, ty + 2]], 1);
    g.set(ex, ty, glow ? 3 : 0);
    if (glow > 1) { g.set(ex + 1, ty, 3); g.set(ex + 1, ty - 1, -1); }
    // puffed cheeks
    if (swell) P(g, [[x0 - 1, ty - 2], [x0 - 2, ty + 2]], 3);
    // drool
    if (!recoil && !(f & 1)) { g.set(ex, ty + 3, 2); }
    if (recoil) P(g, [[ex + 2, ty], [ex + 3, ty - 2], [ex + 3, ty + 2], [ex + 5, ty - 1], [ex + 5, ty + 1]], 3);
    return sset(outline(g));
  }

  // Zündrübe: dark round beet-bomb with a fuse.  swell 0/1
  function bomberFrame(f, swell) {
    const g = IG(13, 13);
    const bob = f & 1 ? -1 : 0;
    const cx = 6, cy = 6.5 + bob, r = 3.9 + swell * 0.7;
    for (let y = 0; y < 13; y++) for (let x = 0; x < 13; x++) {
      const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / r;
      if (dx * dx + dy * dy > 1) continue;
      const ck = (x + y) & 1;
      let c = 1;
      if (dx + dy > 0.7) c = ck ? 0 : 1; // shaded lower right
      g.set(x, y, c);
    }
    // gloss + beet rings
    P(g, [[cx - 2, Math.floor(cy) - 2], [cx - 1, Math.floor(cy) - 2], [cx - 2, Math.floor(cy) - 1]], 3);
    P(g, [[cx - 3, Math.floor(cy) + 1], [cx - 2, Math.floor(cy) + 2]], 2);
    // mean eyes
    const ey = Math.floor(cy);
    P(g, [[cx, ey - 1], [cx + 3, ey - 1]], 0);
    P(g, [[cx + 1, ey], [cx + 3, ey]], 3);
    P(g, [[cx + 1, ey + 2], [cx + 2, ey + 2], [cx + 3, ey + 2]], 0);
    // leaf tuft + fuse
    const top = Math.floor(cy - r);
    P(g, [[cx - 2, top - 1], [cx - 1, top], [cx - 3, top - 2]], 2);
    P(g, [[cx, top], [cx + 1, top - 1], [cx + 1, top - 2], [cx + 2, top - 3]], 1);
    // root tail + scurrying legs
    P(g, [[cx - 4, Math.floor(cy) + 2], [cx - 5, Math.floor(cy) + 3]], 1);
    const lg = [[[3, 11], [2, 12], [8, 11], [9, 12]], [[4, 11], [4, 12], [7, 11], [7, 12]], [[3, 11], [3, 12], [8, 11], [8, 12]], [[4, 11], [5, 12], [7, 11], [6, 12]]][f];
    P(g, lg, 1);
    const s = sset(outline(g));
    s.fx = cx + 2 + 1; s.fy = top - 4 + 1; // spark position (incl. outline)
    return s;
  }

  // Wurzel-Bock: parsnip ram. pose 0 chase, 1 tele (reared), 2 dash, 3 dizzy
  function chargerFrame(f, pose, alt) {
    const W = 20, H = 15, GY = 14;
    const g = IG(W, H);
    const tilt = pose === 1 ? -0.3 : pose === 2 ? 0.15 : 0;
    const bob = pose === 0 && (f & 1) ? -1 : 0;
    const sy = (x) => tilt * (x - 9);
    // body: lying parsnip, tail left, shoulder right
    const cy0 = 8 + bob;
    for (let x = 1; x < 16; x++) {
      const u = (x - 1) / 14;
      const rr = u > 0.7 ? 3.6 * Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.7) / 0.32, 2))) : 0.8 + 2.8 * Math.pow(u / 0.7, 0.7);
      const ccy = cy0 + sy(x) + (u < 0.3 ? (0.3 - u) * 4 : 0);
      for (let y = Math.floor(ccy - rr); y <= Math.ceil(ccy + rr) - 1; y++) {
        const t = (y + 0.5 - (ccy - rr)) / (2 * rr), ck = (x + y) & 1;
        let c = t < 0.55 ? 3 : t < 0.7 ? (ck ? 2 : 3) : t < 0.9 ? 2 : 1;
        if (x % 4 === 2 && t > 0.25 && t < 0.8) c = ck ? 2 : c; // parsnip rings
        g.set(x, y, c);
      }
    }
    // mane of leaves
    const my = Math.round(cy0 + sy(9) - 4);
    P(g, [[8, my], [9, my - 1], [9, my - 2], [10, my - 1], [11, my - 2], [7, my - 1], [6, my - 2]], 2);
    P(g, [[9, my + 1], [10, my]], 1);
    // legs
    const leg = (x, y0, y1, dx) => { for (let y = y0; y <= y1; y++) g.set(x + Math.round((dx * (y - y0)) / Math.max(1, y1 - y0)), y, 1); g.set(x + dx + 1, y1, 1); };
    const lt = (x) => Math.round(cy0 + sy(x) + 2);
    if (pose === 2) {
      leg(3, lt(3), GY, -2); leg(5, lt(5), GY, -1); leg(12, lt(12), GY, 2); leg(14, lt(14), GY, 1);
    } else if (pose === 1) {
      leg(3, lt(3), GY, 0); leg(5, lt(5), GY, 0);
      leg(12, lt(12), lt(12) + 2, 1); leg(14, lt(14), lt(14) + (alt ? 4 : 2), 1);
      if (alt) P(g, [[17, GY], [18, GY - 1]], 1);
    } else {
      const a = pose === 0 && (f === 1) ? -1 : 0, b = pose === 0 && (f === 3) ? -1 : 0;
      leg(3, lt(3), GY + b, 0); leg(5, lt(5), GY + a, 0); leg(12, lt(12), GY + a, 0); leg(14, lt(14), GY + b, 0);
    }
    // head (lowered), far horn, near horn
    const hl = pose === 1 ? -3 : pose === 2 ? 1 : pose === 3 ? 1 + (alt ? 1 : 0) : 0;
    const hx = 16 + (pose === 2 ? 1 : 0), hy = Math.round(cy0 + sy(16) + 1 + hl);
    for (let y = hy - 2; y <= hy + 2; y++) for (let x = hx - 2; x <= hx + 2; x++) {
      if (Math.abs(x - hx) + Math.abs(y - hy) > 3 || x < hx - 1) continue;
      g.set(x, y, y >= hy + 1 ? 2 : 3);
    }
    P(g, [[hx + 3, hy], [hx + 3, hy + 1]], 3); g.set(hx + 3, hy + 1, 2);
    // eyes
    if (pose === 3) P(g, [[hx, hy - 1], [hx + 1, hy], [hx, hy + 1], [hx + 2, hy - 1], [hx + 2, hy + 1]], 0);
    else if (pose === 1 || pose === 2) { P(g, [[hx, hy - 1], [hx + 1, hy - 1]], 0); P(g, [[hx + 1, hy]], 0); g.set(hx + 2, hy, 0); g.set(hx, hy, 1); }
    else { P(g, [[hx, hy - 1]], 0); g.set(hx + 1, hy, 0); }
    // big curled ram horn: a ring around the side of the head with a dark hollow (curl)
    const hcx = hx - 2, hcy = hy - 1;
    const ring = [[0, -2], [1, -2], [-1, -2], [-2, -1], [-2, 0], [-2, 1], [-1, 2], [0, 2], [1, 1], [2, -1], [1, 0]];
    const rs = new Set(ring.map(([dx, dy]) => dx + ',' + dy));
    for (const [dx, dy] of ring) for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = dx + ax, ny = dy + ay;
      if (rs.has(nx + ',' + ny) || (Math.abs(nx) <= 1 && Math.abs(ny) <= 1)) continue;
      if (g.get(hcx + nx, hcy + ny) >= 0) g.set(hcx + nx, hcy + ny, 0);
    }
    ring.forEach(([dx, dy]) => g.set(hcx + dx, hcy + dy, dy > 0 || dx < -1 ? 1 : 2));
    g.set(hcx, hcy, 0); g.set(hcx - 1, hcy, 0); g.set(hcx - 1, hcy - 1, 3); g.set(hcx, hcy - 1, 3);
    g.set(hcx, hcy + 1, 2);
    if (pose === 2) P(g, [[0, cy0 - 3], [1, cy0 - 3], [0, cy0], [1, cy0 + 2]], 2); // speed streaks
    return sset(outline(g));
  }

  // Rüben-Ahnin: big grandma rutabaga with headscarf-like shawl, glasses, cane, babies on top. form 0/1 stretch/2 squash
  function motherFrame(f, form) {
    const W = 24, H = 23;
    const g = IG(W, H);
    const bob = f & 1 ? 1 : 0;
    const sx = form === 1 ? -0.8 : form === 2 ? 0.9 : 0, syk = form === 1 ? 1 : form === 2 ? -0.9 : 0;
    // stumpy legs
    const la = f === 0 ? -1 : 0, lb = f === 2 ? -1 : 0;
    for (let y = 18; y < 22; y++) { for (let x = 6; x < 9; x++) g.set(x, y + la, x === 6 ? 2 : 1); for (let x = 11; x < 14; x++) g.set(x, y + lb, x === 11 ? 2 : 1); }
    P(g, [[5, 21 + la], [9, 21 + la], [10, 21 + lb], [14, 21 + lb]], 1);
    const cx = 9.5, cy = 12 + bob - syk * 0.5, rx = 7.3 + sx, ry = 7 + syk;
    const body = bulbGrid(g, cx, cy, rx, ry, { taper: 0.32, b0: 0.3, b1: 0.56 });
    // wrinkles (short broken lines)
    P(g, [[4, Math.round(cy) - 2], [5, Math.round(cy) - 2], [3, Math.round(cy) + 1], [4, Math.round(cy) + 1], [13, Math.round(cy) - 3]], 1);
    // shawl band with fringe: alternating 1/0 knit + 3 dots
    const s0 = Math.round(cy + ry * 0.45), s1 = s0 + 2;
    for (const k of body) {
      const [x, y] = k.split(',').map(Number);
      if (y < s0 || y > s1) continue;
      g.set(x, y, y === s0 ? 2 : (x + y) % 3 === 0 ? 3 : 1);
    }
    for (let x = Math.round(cx - rx * 0.6); x <= Math.round(cx + rx * 0.7); x += 2) if (body.has(x + ',' + (s1 + 1))) g.set(x, s1 + 1, 1);
    // face: glasses (0 rims, 3 glints) + frown
    const ex = Math.round(cx) + 1, ey = Math.round(cy - 1);
    P(g, [[ex, ey], [ex + 1, ey], [ex + 3, ey], [ex + 4, ey]], 0);
    P(g, [[ex, ey + 1], [ex + 3, ey + 1]], 3); P(g, [[ex + 1, ey + 1], [ex + 4, ey + 1]], 0); g.set(ex + 2, ey, 0);
    P(g, [[ex + 1, ey + 3], [ex + 2, ey + 2], [ex + 3, ey + 2], [ex + 4, ey + 3]], 0);
    // crown: leaves + three baby sprouts
    const top = Math.floor(cy - ry);
    P(g, [[7, top], [8, top - 1], [12, top], [11, top - 1], [9, top - 1], [10, top - 1]], 2);
    const baby = (bx, by) => {
      P(g, [[bx, by], [bx + 1, by], [bx - 1, by + 1], [bx + 2, by + 1], [bx, by + 2], [bx + 1, by + 2]], 2);
      P(g, [[bx, by + 1], [bx + 1, by + 1]], 3); g.set(bx + 1, by + 1, 0);
      g.set(bx, by - 1, 1); g.set(bx + 1, by - 2, 1);
    };
    baby(4, top - 2 + (f === 1 ? 1 : 0)); baby(9, top - 4 + (f === 2 ? 1 : 0)); baby(14, top - 2 + (f === 3 ? 1 : 0));
    // root arm + cane
    const cxn = Math.round(cx + rx + 2) + (f === 1 || f === 2 ? 1 : 0), ay = Math.round(cy + 2);
    P(g, [[Math.round(cx + rx), ay], [cxn - 1, ay]], 1);
    for (let y = ay - 2; y <= 21; y++) g.set(cxn, y, y === ay - 2 ? 2 : 1);
    g.set(cxn - 1, ay - 2, 2);
    return sset(outline(g));
  }

  // Rübchen: tiny baby turnip
  function sproutFrame(f) {
    const g = IG(9, 12);
    const bob = f & 1 ? -1 : 0;
    const cx = 4, cy = 6.4 + bob;
    bulbGrid(g, cx, cy, 3.4, 3.1, { taper: 0.45, b0: 0.36, b1: 0.56 });
    const ty = Math.floor(cy - 3.1);
    P(g, [[4, ty - 1], [3, ty - 2], [2, ty - 2], [2, ty - 3], [1, ty - 3]], 2); g.set(3, ty - 1, 1);
    g.set(4, Math.floor(cy), 0); g.set(6, Math.floor(cy), 0); g.set(4, Math.floor(cy) - 1, 1); g.set(6, Math.floor(cy) - 1, 1); g.set(5, Math.floor(cy) + 2, 1);
    const lg = [[[2, 10], [2, 11], [5, 10], [6, 11]], [[3, 10], [3, 11], [5, 10], [5, 11]], [[2, 10], [1, 11], [5, 10], [5, 11]], [[3, 10], [3, 11], [5, 10], [4, 11]]][f];
    P(g, lg, 1);
    return sset(outline(g));
  }

  // enemy shot: a 4-colour glob – dark rim, brown ring, cream core; plus a dithered aura (separate)
  function shotFrames() {
    const A = ['.0000.', '012210', '023321', '023321', '012210', '.0000.'];
    const B = ['.0000.', '021120', '013310', '013310', '021120', '.0000.'];
    return [A, B].map((r) => toCanvas(outline(IG(6, 6).rows(r), 3)));
  }
  function haloSprite(r0, r1, density, col) {
    const S = Math.ceil(r1) * 2 + 1, c = S / 2;
    const g = IG(S, S);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const d = Math.hypot(x + 0.5 - c, (y + 0.5 - c) * 1.15);
      if (d > r0 && d < r1 && bay(x, y) < density * (1 - ((d - r0) / (r1 - r0)) * 0.6)) g.set(x, y, col);
    }
    return toCanvas(g);
  }
  function puffFrames(s) {
    const frames = [];
    const R = Math.ceil(8 * s) + 3;
    const S = R * 2 + 1, c = R;
    const sets = [
      [[0, 0, 2.7 * s]],
      [[0, 0, 2.6 * s], [-2.8 * s, 0.6 * s, 2.2 * s], [2.8 * s, 0.6 * s, 2.2 * s], [-1.2 * s, -2.2 * s, 2.1 * s], [1.6 * s, -2 * s, 2 * s]],
      [0, 1, 2, 3, 4, 5].map((i) => { const a = (i / 6) * U.TAU + 0.5; return [Math.cos(a) * 4.8 * s, Math.sin(a) * 4 * s, 1.5 * s]; }),
      [0, 1, 2, 3, 4, 5, 6].map((i) => { const a = (i / 7) * U.TAU + 0.2; return [Math.cos(a) * 6.4 * s, Math.sin(a) * 5.4 * s, 0.6 + 0.3 * s]; }),
    ];
    sets.forEach((blobs, f) => {
      const g = IG(S, S);
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        for (const [bx, by, br] of blobs) {
          const dx = x + 0.5 - c - bx, dy = y + 0.5 - c - by;
          if (dx * dx + dy * dy <= br * br) {
            let col = f === 3 ? 2 : 3;
            if (f < 3 && dy > br * 0.35 && dx > -br * 0.3) col = 2;
            g.set(x, y, col);
            break;
          }
        }
      }
      frames.push(toCanvas(f < 3 ? outline(g, f === 2 ? 1 : 0) : g));
    });
    return frames;
  }
  const SHADOWS = new Map();
  function shadow(w, h) {
    const k = w + 'x' + h;
    let s = SHADOWS.get(k);
    if (s) return s;
    s = [0, 1].map((ph) => {
      const g = IG(w, h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const dx = (x + 0.5 - w / 2) / (w / 2), dy = (y + 0.5 - h / 2) / (h / 2);
        if (dx * dx + dy * dy <= 1.05 && ((x + y + ph) & 1) === 0) g.set(x, y, 1);
      }
      return toCanvas(g);
    });
    SHADOWS.set(k, s);
    return s;
  }
  function drawShadowAt(ctx, x, y, w, h) {
    const s = shadow(w, h);
    const px = Math.round(x / PS - w / 2), py = Math.round(y / PS - h / 2);
    ctx.drawImage(s[(px + py) & 1], px * PS, py * PS, w * PS, h * PS);
  }

  /* =====================================================================
     Icons (14×14, digits = palette index, dark outline) – same as the style's ICONS
     ===================================================================== */
  const ICONS = {
    leech: [
      '.3...3........',
      '.33..33..22.22',
      '..3...3..23221',
      '.33..33..22221',
      '.3...3....221.',
      '...........1..',
      '.33333333333..',
      '3222322232231.',
      '13333333333311',
      '.1222222222111',
      '..12222222211.',
      '...111111111..',
      '....11111.....',
      '..............',
    ],
    thorns: [
      '......3.......',
      '..3...2...3...',
      '...2.211.2....',
      '....211111....',
      '...2111111....',
      '3221011101122.',
      '...1131113111.',
      '...2323232321.',
      '....3333332...',
      '...2.33332.2..',
      '..3...33...3..',
      '......2.......',
      '......3.......',
      '..............',
    ],
    dashup: [
      '.........1....',
      '.......2212...',
      '......2322222.',
      '.33..23232232.',
      '.....22232232.',
      '3333.22222222.',
      '.....22333322.',
      '.333.21232321.',
      '......111111..',
      '..............',
      '.11.1.1.11....',
      '..............',
      '..............',
      '..............',
    ],
    range: [
      '..........33..',
      '.........3332.',
      '.........3322.',
      '......2...22..',
      '....2.........',
      '...2..........',
      '..2...........',
      '..2...........',
      '.2.......111..',
      '.2......13331.',
      '.2......13131.',
      '2.......13331.',
      '2........111..',
      '..............',
    ],
  };
  const ICON_GRIDS = {};
  function drawIcon(ctx, id, size) {
    let g = ICON_GRIDS[id];
    if (!g) { const rows = ICONS[id]; g = ICON_GRIDS[id] = outline(IG(14, 14).rows(rows, 0, Math.floor((14 - rows.length) / 2))); }
    const s = Math.max(1, Math.floor(size / 16));
    const o = Math.floor((size - 16 * s) / 2);
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      const v = g.a[y * g.w + x];
      if (v < 0) continue;
      ctx.fillStyle = HEX[v];
      ctx.fillRect(o + x * s, o + y * s, s, s);
    }
  }

  /* =====================================================================
     Build + draw
     ===================================================================== */
  let S = null;
  function build() {
    const s = {};
    s.spit = [0, 1, 2, 3].map((f) => spitterFrame(f, 0, 0, false));
    s.spitAim = [0, 1, 2].map((lv) => [0, 1].map((f) => spitterFrame(f * 2, lv ? 2 : 1, lv, false)));
    s.spitRec = spitterFrame(0, 0, 0, true);
    s.bomb = [0, 1, 2, 3].map((f) => bomberFrame(f, 0));
    s.bombArm = [0, 1, 2, 3].map((f) => bomberFrame(f, 1));
    s.ch = [0, 1, 2, 3].map((f) => chargerFrame(f, 0, 0));
    s.chTele = [0, 1].map((a) => chargerFrame(0, 1, a));
    s.chDash = chargerFrame(0, 2, 0);
    s.chDizzy = [0, 1].map((a) => chargerFrame(0, 3, a));
    const dg = s.chDash.g;
    s.chGhost = [0, 1].map((ph) => {
      const o = IG(dg.w, dg.h);
      for (let y = 0; y < dg.h; y++) for (let x = 0; x < dg.w; x++) if (dg.a[y * dg.w + x] >= 0 && ((x + y + ph) & 1) === 0) o.set(x, y, 2);
      const c = toCanvas(o);
      return { r: c, l: U.flipX(c) };
    });
    s.mo = [0, 1, 2, 3].map((f) => motherFrame(f, 0));
    s.moStretch = motherFrame(0, 1);
    s.moSquash = motherFrame(1, 2);
    s.so = [0, 1, 2, 3].map(sproutFrame);
    s.shot = shotFrames();
    s.shotHalo = [haloSprite(2.5, 6, 0.55, 2), haloSprite(2.5, 6, 0.55, 1)];
    s.moHalo = haloSprite(6, 13, 0.55, 3);
    s.chHalo = haloSprite(2, 5, 0.6, 3);
    s.star = [['.3.', '333', '.3.'], ['3.3', '.3.', '3.3']].map((r) => rowsC(r));
    s.spark = [rowsC(['3']), rowsC(['.3.', '323', '.3.']), rowsC(['3.3.3', '.323.', '32223', '.323.', '3.3.3'], false)];
    s.puff = puffFrames(1);
    s.puffS = puffFrames(0.6);
    s.puffL = puffFrames(1.4);
    return s;
  }

  /** spawn / death like the style's creeper. Returns true if handled. */
  function lifecycle(ctx, e, fr, size) {
    const left = e.facing < 0;
    if (e.dying) {
      const t = e.deathT;
      if (t < 0.22) blit(ctx, left ? fr.li : fr.ri, e.x, e.y + PS, 0.5, 1);
      else {
        const pf = size === 2 ? S.puffL : size === 0 ? S.puffS : S.puff;
        const k = Math.min(3, Math.floor(((t - 0.22) / 0.78) * 4));
        blit(ctx, pf[k], e.x, e.y - (size === 2 ? 18 : size === 0 ? 6 : 11), 0.5, 0.5);
      }
      return true;
    }
    if (e.spawnT < 1) {
      const t = e.spawnT;
      const img = left ? fr.l : fr.r;
      const h = img.height;
      const rise = Math.round(h * U.ease.outQuad(U.clamp((t - 0.15) / 0.85, 0, 1)));
      if (rise > 0) {
        const bx = Math.round(e.x / PS - img.width / 2) * PS, by = (Math.round(e.y / PS) + 1) * PS;
        ctx.save();
        ctx.beginPath();
        ctx.rect(bx, by - h * PS, img.width * PS, h * PS);
        ctx.clip();
        ctx.drawImage(img, bx, by - rise * PS, img.width * PS, h * PS);
        ctx.restore();
      }
      blit(ctx, (size === 2 ? S.puff : S.puffS)[Math.min(3, Math.floor(t * 4))], e.x, e.y - 1, 0.5, 0.5);
      return true;
    }
    return false;
  }
  const pick = (fr, e) => {
    const left = e.facing < 0, inv = e.flash > 0.4;
    return inv ? (left ? fr.li : fr.ri) : left ? fr.l : fr.r;
  };

  C.art('kuerbisboy', {
    init() { S = build(); },
    enemies: {
      spitter(ctx, e, view) {
        const f = Math.floor(e.anim * 1.1 + e.seed * 7) & 3;
        let fr = S.spit[f], ox = 0;
        if (lifecycle(ctx, e, fr, 1)) return;
        if (e.mode === 'aim') {
          const lv = e.charge < 0.35 ? 0 : e.charge < 0.75 ? 1 : 2;
          const tr = Math.floor(view.rt * (12 + e.charge * 14)) & 1;
          fr = S.spitAim[lv][tr];
          if (e.charge > 0.5) ox = tr ? 1 : 0;
          if (lv === 2 && tr) blit(ctx, S.chHalo, e.x + e.facing * 13, e.y - 13, 0.5, 0.5);
        } else if (e.spit > 0.45) fr = S.spitRec;
        blit(ctx, pick(fr, e), e.x, e.y + PS, 0.5, 1, 0, ox);
      },
      bomber(ctx, e, view) {
        const f = Math.floor(e.anim * 1.6 + e.seed * 7) & 3;
        const base = S.bomb[f];
        if (lifecycle(ctx, e, base, 0)) return;
        const fr = e.armed ? S.bombArm[f] : base;
        const left = e.facing < 0;
        let img = pick(fr, e);
        if (e.armed) {
          const k = e.fuse || 0;
          const on = ((view.rt * (4 + k * k * 22) + e.seed) % 1) < 0.5;
          if (on) img = left ? fr.li : fr.ri; // classic handheld blink: palette inversion
          if (on) blit(ctx, S.chHalo, e.x, e.y - 9, 0.5, 0.5);
        }
        const px = Math.round(e.x / PS - img.width * 0.5), py = Math.round((e.y + PS) / PS - img.height);
        ctx.drawImage(img, px * PS, py * PS, img.width * PS, img.height * PS);
        // fuse spark
        const sx = px + (left ? img.width - 1 - fr.fx : fr.fx), sy = py + fr.fy;
        const flick = Math.floor(view.rt * 14 + e.seed * 9) & 1;
        const lvl = e.armed ? (e.fuse > 0.5 ? 2 : 1) : flick ? 1 : 0;
        const sp = S.spark[e.armed && flick ? Math.max(1, lvl - 1) : lvl];
        ctx.drawImage(sp, (sx - (sp.width >> 1)) * PS, (sy - (sp.height >> 1)) * PS, sp.width * PS, sp.height * PS);
      },
      charger(ctx, e, view) {
        const f = Math.floor(e.anim * 1.1 + e.seed * 7) & 3;
        let fr = S.ch[f], ox = 0;
        if (lifecycle(ctx, e, fr, 1)) return;
        const left = e.facing < 0;
        if (e.mode === 'tele') {
          fr = S.chTele[Math.floor(view.rt * 8) & 1];
          if (e.modeT > 0.3) ox = Math.floor(view.rt * 24) & 1;
          if (Math.floor(view.rt * 10) & 1) blit(ctx, S.chHalo, e.x + e.facing * 13, e.y - 18, 0.5, 0.5);
        } else if (e.mode === 'dash') {
          fr = S.chDash;
          for (let i = 2; i >= 1; i--) {
            const gi = S.chGhost[i & 1];
            blit(ctx, left ? gi.l : gi.r, e.x - e.dashX * i * 9, e.y - e.dashY * i * 9 + PS, 0.5, 1);
          }
        } else if (e.mode === 'rest') {
          fr = S.chDizzy[Math.floor(view.rt * 5) & 1];
          ox = Math.round(Math.sin(view.rt * 9) * 0.6);
        }
        blit(ctx, pick(fr, e), e.x, e.y + PS, 0.5, 1, 0, ox);
        if (e.mode === 'rest') {
          for (let i = 0; i < 3; i++) {
            const a = view.rt * 6 + (i / 3) * U.TAU;
            blit(ctx, S.star[(i + Math.floor(view.rt * 8)) & 1], e.x + e.facing * 12 + Math.cos(a) * 9, e.y - 28 + Math.sin(a) * 3, 0.5, 0.5);
          }
        }
      },
      mother(ctx, e, view) {
        const f = Math.floor(e.anim * 0.7 + e.seed * 7) & 3;
        let fr = S.mo[f];
        if (lifecycle(ctx, e, fr, 2)) return;
        const b = e.birth || 0;
        if (b > 0) {
          if (Math.floor(view.rt * 12) & 1) blit(ctx, S.moHalo, e.x, e.y - 22, 0.5, 0.5);
          if (b > 0.75) fr = S.moSquash; else if (b > 0.45) fr = S.moStretch;
        }
        blit(ctx, pick(fr, e), e.x, e.y + PS, 0.5, 1, 0, e.facing < 0 ? 1 : -1);
      },
      sprout(ctx, e) {
        const f = Math.floor(e.anim * 1.8 + e.seed * 7) & 3;
        const fr = S.so[f];
        if (lifecycle(ctx, e, fr, 0)) return;
        blit(ctx, pick(fr, e), e.x, e.y + PS, 0.5, 1);
      },
    },
    shadow(ctx, o) {
      if (o.dying && o.deathT > 0.22) return true;
      const k = o.spawnT < 1 ? Math.min(1, o.spawnT * 1.5) : 1;
      const w = { spitter: 9, bomber: 7, charger: 13, mother: 15, sprout: 5 }[o.type] || 9;
      drawShadowAt(ctx, o.x, o.y + 1, Math.max(3, Math.round(w * k)), o.type === 'mother' ? 3 : 2);
      return true;
    },
    shot(ctx, s, view) {
      const y = s.y - s.z;
      const f = Math.floor(view.rt * 8 + s.seed * 5) & 1;
      blit(ctx, S.shotHalo[f], s.x, y, 0.5, 0.5);
      const sl = Math.hypot(s.vx, s.vy) || 1, ux = s.vx / sl, uy = s.vy / sl;
      dot(ctx, s.x - ux * 9, y - uy * 9, 1);
      dot(ctx, s.x - ux * 14, y - uy * 14 + (f ? PS : 0), 0);
      blit(ctx, S.shot[f], s.x, y, 0.5, 0.5);
    },
    icons: {
      leech: (ctx, size) => drawIcon(ctx, 'leech', size),
      thorns: (ctx, size) => drawIcon(ctx, 'thorns', size),
      dashup: (ctx, size) => drawIcon(ctx, 'dashup', size),
      range: (ctx, size) => drawIcon(ctx, 'range', size),
    },
  });
})();
