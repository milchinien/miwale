/* Papierwelt – a handmade paper-craft diorama style for "Jack vs. the Turnip Ancestors".
   Everything is cut from construction paper, cardstock, kraft paper, corrugated cardboard and felt:
   layered ground sheets with torn/cut edges, side thickness and soft drop shadows, paper puppets with
   brass split pins and white sticker rims, confetti and paper scraps. All textures are procedural. */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2;
  const K = 4; // sprite resolution: canvas px per world unit

  /* ======================= palette ======================= */
  const C = {
    ink: '#3b2a26', rim: '#fbf6ea', cream: '#f2e7cf', creamDark: '#dccdab',
    kraft: '#ad8259', kraftDark: '#7d5838', kraftLight: '#c9a275',
    card: '#c49c6c', cardDark: '#96714a', cardLight: '#dcbb8c',
    mustard: '#d6a43a', mustardDark: '#ac7f26', mustardLight: '#ecc463',
    pumpkin: '#e57d2c', pumpkinDark: '#bb5a20', pumpkinDeep: '#9c4618', pumpkinLight: '#f59c4c',
    glow: '#ffcf4a', glowHot: '#fff3b8', glowDeep: '#f0922a',
    rust: '#b0522e', red: '#c4432f', redDark: '#8e2c22',
    moss: '#5f7d45', mossDark: '#455d32', olive: '#8c8a43', leaf: '#76a54e', leafLight: '#a3cc6a', leafDark: '#4d7a35',
    aub: '#6e3c6d', aubLight: '#9c629a', aubDark: '#4a2649', aubDeep: '#2e1530',
    denim: '#4f6f95', denimDark: '#3a5679', denimLight: '#7192b7',
    boot: '#5b3d2a', bootDark: '#3e281b',
    brass: '#d4ac4a', brassLight: '#fff0b0', brassDark: '#8f6d24',
    ghost: 'rgba(236,243,248,0.62)', ghostSolid: '#e8f0f5', ghostBlue: '#bcd3e6', ghostEye: '#2b2440',
    teal: '#36a596', tealLight: '#9ae6d6', tealDark: '#1d6d68', tealMid: '#5cc3b2',
    gold: '#e6b23a', goldLight: '#fff1a6', goldDark: '#a5731b',
    grey: '#9b97a3', greyDark: '#6f6b79', greyLight: '#c3c0c9',
    shadow: 'rgb(48,26,12)',
  };
  const hex = (h) => U.hex(h);

  /* ======================= canvas helpers ======================= */
  function cv(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    return c;
  }
  const g2 = (c) => c.getContext('2d');
  let HAS_FILTER = false;
  /** draw src blurred by px into ctx at (x,y) */
  function blurInto(x, src, dx, dy, px) {
    if (px <= 0.25) { x.drawImage(src, dx, dy); return; }
    if (HAS_FILTER) {
      x.filter = 'blur(' + px.toFixed(2) + 'px)';
      x.drawImage(src, dx, dy);
      x.filter = 'none';
      return;
    }
    const a = x.globalAlpha, n = 10;
    x.globalAlpha = a / 4;
    for (let i = 0; i < n; i++) {
      const t = (i / n) * TAU, r = px * (i & 1 ? 0.5 : 1);
      x.drawImage(src, dx + Math.cos(t) * r, dy + Math.sin(t) * r);
    }
    x.globalAlpha = a;
  }
  /** silhouette copy of src in one colour */
  function sil(src, color) {
    const c = cv(src.width, src.height), x = g2(c);
    x.drawImage(src, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = color;
    x.fillRect(0, 0, c.width, c.height);
    return c;
  }
  /** morphological dilation (white sticker rim). returns {c, pad} */
  function dilate(src, r, color) {
    const pad = Math.ceil(r) + 2;
    const c = cv(src.width + pad * 2, src.height + pad * 2), x = g2(c);
    const s = sil(src, color);
    for (const rr of [r, r * 0.6, r * 0.3]) {
      const n = Math.max(8, Math.round(rr * 3.2));
      for (let i = 0; i < n; i++) {
        const a = ((i + 0.5) / n) * TAU;
        x.drawImage(s, pad + Math.cos(a) * rr, pad + Math.sin(a) * rr);
      }
    }
    x.drawImage(s, pad, pad);
    return { c, pad };
  }
  /** soft blurred shadow image of src, returns {c, pad} */
  function softShadow(src, blurPx, color) {
    const pad = Math.ceil(blurPx * 2.5) + 2;
    const c = cv(src.width + pad * 2, src.height + pad * 2);
    blurInto(g2(c), sil(src, color || C.shadow), pad, pad, blurPx);
    return { c, pad };
  }

  /* paper grain (transparent fibres + specks), used on every cut piece */
  let GRAIN = null;
  function buildGrain() {
    const n = 256, c = cv(n, n), x = g2(c);
    const r = U.rng(4242);
    const im = x.createImageData(n, n), d = im.data;
    for (let i = 0; i < n * n; i++) {
      const v = r.next();
      const o = i * 4;
      if (v < 0.5) { d[o] = 255; d[o + 1] = 250; d[o + 2] = 235; d[o + 3] = (r.next() * 22) | 0; }
      else { d[o] = 60; d[o + 1] = 36; d[o + 2] = 20; d[o + 3] = (r.next() * 20) | 0; }
    }
    x.putImageData(im, 0, 0);
    x.lineCap = 'round';
    for (let i = 0; i < 520; i++) {
      const px = r.next() * n, py = r.next() * n, a = r.range(-0.6, 0.6) + (r.chance(0.3) ? Math.PI / 2 : 0);
      const l = r.range(3, 11), light = r.chance(0.55);
      x.strokeStyle = light ? 'rgba(255,248,230,0.22)' : 'rgba(70,40,20,0.16)';
      x.lineWidth = r.range(0.5, 1.1);
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        x.beginPath();
        x.moveTo(px + ox * n, py + oy * n);
        x.quadraticCurveTo(px + ox * n + Math.cos(a) * l * 0.5 + r.range(-1, 1), py + oy * n + Math.sin(a) * l * 0.5 + r.range(-1, 1),
          px + ox * n + Math.cos(a) * l, py + oy * n + Math.sin(a) * l);
        x.stroke();
      }
    }
    GRAIN = c;
  }
  function applyGrain(x, w, h, k) {
    x.save();
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = 'source-atop';
    x.globalAlpha = k === undefined ? 1 : k;
    const p = x.createPattern(GRAIN, 'repeat');
    x.fillStyle = p;
    x.translate((Math.random() * 256) | 0, (Math.random() * 256) | 0);
    x.fillRect(-256, -256, w + 256, h + 256);
    x.restore();
  }
  /** top-left light: subtle lit/shade gradient across a piece */
  function applyLight(x, w, h, a) {
    x.save();
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = 'source-atop';
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, 'rgba(255,250,232,' + a + ')');
    g.addColorStop(0.45, 'rgba(255,250,232,0)');
    g.addColorStop(1, 'rgba(50,25,10,' + a * 1.2 + ')');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    x.restore();
  }

  /**
   * A cut paper piece. draw(ctx) works in world units with the pivot at (0,0) inside bbox [x0,y0,x1,y1].
   * Returns {img, ox, oy (pivot px), sh (blurred shadow), shPad}.
   */
  function mkPart(bb, draw, o) {
    o = o || {};
    const rim = o.rim === undefined ? 0.55 : o.rim;
    const w = (bb[2] - bb[0]) * K, h = (bb[3] - bb[1]) * K;
    const c = cv(w + 4, h + 4), x = g2(c);
    x.setTransform(K, 0, 0, K, -bb[0] * K + 2, -bb[1] * K + 2);
    x.lineJoin = 'round';
    x.lineCap = 'round';
    draw(x);
    let img = c, ox = -bb[0] * K + 2, oy = -bb[1] * K + 2;
    if (rim > 0) {
      const d = dilate(c, rim * K, o.rimColor || C.rim);
      g2(d.c).drawImage(c, d.pad, d.pad);
      img = d.c; ox += d.pad; oy += d.pad;
    }
    const ix = g2(img);
    if (o.grain !== false) applyGrain(ix, img.width, img.height, o.grain || 1);
    if (o.light !== false) applyLight(ix, img.width, img.height, o.light || 0.1);
    const s = softShadow(img, (o.shBlur || 0.35) * K);
    return { img, ox, oy, sh: s.c, shPad: s.pad };
  }

  /* brass split-pin head (drawn unmirrored so the highlight is always top-left) */
  function drawPin(x, px, py, r) {
    r = r || 0.62;
    x.fillStyle = 'rgba(48,26,12,0.35)';
    x.beginPath(); x.arc(px + 0.18, py + 0.24, r * 1.05, 0, TAU); x.fill();
    const g = x.createRadialGradient(px - r * 0.35, py - r * 0.35, r * 0.1, px, py, r);
    g.addColorStop(0, C.brassLight); g.addColorStop(0.45, C.brass); g.addColorStop(1, C.brassDark);
    x.fillStyle = g;
    x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(90,60,20,0.55)'; x.lineWidth = 0.12;
    x.beginPath(); x.moveTo(px - r * 0.55, py + r * 0.1); x.lineTo(px + r * 0.55, py - r * 0.1); x.stroke();
  }

  /**
   * Compose a puppet frame from parts. list items: {p, x, y, r, sx, sy, sh, alpha, pin:[px,py]}
   * (x,y) = pivot position in body space (feet at 0,0, facing +x). Shadows are offset in screen space.
   */
  function composeFrame(fw, fh, footX, footY, facing, list, opt) {
    opt = opt || {};
    const c = cv(fw * K, fh * K), x = g2(c);
    const pins = [];
    const SX = opt.shx === undefined ? 0.42 : opt.shx, SY = opt.shy === undefined ? 0.55 : opt.shy;
    for (const it of list) {
      const p = it.p;
      const place = (dx, dy) => {
        x.setTransform(K, 0, 0, K, (footX + dx) * K, (footY + dy) * K);
        x.scale(facing, 1);
        x.translate(it.x, it.y);
        if (it.r) x.rotate(it.r);
        if (it.sx || it.sy) x.scale(it.sx || 1, it.sy || 1);
      };
      if (it.sh !== 0) {
        place(SX, SY);
        x.globalAlpha = it.sh === undefined ? 0.34 : it.sh;
        x.drawImage(p.sh, (-p.ox - p.shPad) / K, (-p.oy - p.shPad) / K, p.sh.width / K, p.sh.height / K);
      }
      place(0, 0);
      x.globalAlpha = it.alpha === undefined ? 1 : it.alpha;
      x.drawImage(p.img, -p.ox / K, -p.oy / K, p.img.width / K, p.img.height / K);
      if (it.pin) {
        const m = x.getTransform();
        const px = it.pin[0], py = it.pin[1];
        pins.push([(m.a * px + m.c * py + m.e) / K, (m.b * px + m.d * py + m.f) / K, it.pin[2]]);
      }
    }
    x.globalAlpha = 1;
    x.setTransform(K, 0, 0, K, 0, 0);
    for (const q of pins) drawPin(x, q[0], q[1], q[2]);
    x.setTransform(1, 0, 0, 1, 0, 0);
    return c;
  }
  /** add a soft drop shadow (offset right-down) under a frame. returns sprite {img, ax, ay} */
  function dropSprite(frame, footX, footY, o) {
    o = o || {};
    const offX = o.dx === undefined ? 0.9 : o.dx, offY = o.dy === undefined ? 1.1 : o.dy;
    const blur = (o.blur === undefined ? 0.7 : o.blur) * K;
    const pad = Math.ceil(blur * 2.5 + Math.max(offX, offY) * K) + 2;
    const c = cv(frame.width + pad * 2, frame.height + pad * 2), x = g2(c);
    x.globalAlpha = o.alpha === undefined ? 0.3 : o.alpha;
    blurInto(x, sil(frame, C.shadow), pad + offX * K, pad + offY * K, blur);
    x.globalAlpha = 1;
    x.drawImage(frame, pad, pad);
    return { img: c, ax: footX * K + pad, ay: footY * K + pad };
  }
  /** blit a sprite {img, ax, ay} at world (x,y) */
  function blit(ctx, s, x, y, sc, sx, sy) {
    sc = sc || 1;
    const kx = (sc * (sx === undefined ? 1 : sx)) / K, ky = (sc * (sy === undefined ? 1 : sy)) / K;
    ctx.drawImage(s.img, x - s.ax * kx, y - s.ay * ky, s.img.width * kx, s.img.height * ky);
  }
  /** jagged polygon helper: points along a closed path with noise */
  function jaggedPath(x, pts, amp, rng, sub) {
    sub = sub || 3;
    x.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      for (let k = 0; k < sub; k++) {
        const t = k / sub;
        const px = a[0] + (b[0] - a[0]) * t + (k ? rng.range(-amp, amp) : 0);
        const py = a[1] + (b[1] - a[1]) * t + (k ? rng.range(-amp, amp) : 0);
        if (i === 0 && k === 0) x.moveTo(px, py); else x.lineTo(px, py);
      }
    }
    x.closePath();
  }
  /** scalloped blob path */
  function scallop(x, cx, cy, rx, ry, n, depth, rot) {
    x.beginPath();
    for (let i = 0; i <= n; i++) {
      const a0 = rot + (i / n) * TAU, a1 = rot + ((i + 0.5) / n) * TAU, a2 = rot + ((i + 1) / n) * TAU;
      const p0x = cx + Math.cos(a0) * rx, p0y = cy + Math.sin(a0) * ry;
      if (i === 0) x.moveTo(p0x, p0y);
      if (i === n) break;
      x.quadraticCurveTo(cx + Math.cos(a1) * rx * (1 + depth), cy + Math.sin(a1) * ry * (1 + depth),
        cx + Math.cos(a2) * rx, cy + Math.sin(a2) * ry);
    }
    x.closePath();
  }
  function rgba(c, a) { const h = hex(c); return 'rgba(' + h[0] + ',' + h[1] + ',' + h[2] + ',' + a + ')'; }
  function shade(c, f) { const h = hex(c); return U.rgb(U.mul(h, f)); }

  /* ======================= ground textures ======================= */
  const TEXR = 2.5, TS = 512, TSM = 511;       // material textures: 2.5 texels / world unit, period 204.8 wu
  let T_KRAFT, T_FELT, T_CARD, T_NEWS, LEAF;    // lum (Uint8) / rgb (Uint8 x3)
  let N_WOB, N_FIB, N_CORE;                     // edge noise, 4 texels / wu, period 128 wu
  const RIDGE = new Float32Array(64);            // corrugation profile (period 3.2 wu)
  const LREACH = 5;

  function noiseField(n, period, seed, oct, gain) {
    const a = new Float32Array(n * n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) a[j * n + i] = U.fbmTile((i / n) * period, (j / n) * period, period, seed, oct, gain);
    return a;
  }
  function upsample(a, n, m) {
    const b = new Float32Array(m * m), s = n / m;
    for (let j = 0; j < m; j++) {
      const fy = j * s, y0 = Math.floor(fy), ty = fy - y0, y1 = (y0 + 1) % n;
      for (let i = 0; i < m; i++) {
        const fx = i * s, x0 = Math.floor(fx), tx = fx - x0, x1 = (x0 + 1) % n;
        const t = a[y0 * n + x0] + (a[y0 * n + x1] - a[y0 * n + x0]) * tx;
        const u = a[y1 * n + x0] + (a[y1 * n + x1] - a[y1 * n + x0]) * tx;
        b[j * m + i] = t + (u - t) * ty;
      }
    }
    return b;
  }
  function normalize(a, k) { for (let i = 0; i < a.length; i++) a[i] = U.clamp((a[i] - 0.5) * k, -1, 1); return a; }
  /** draw with wrap-around on a TS canvas */
  function wrap(x, px, py, r, fn) {
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
      const qx = px + ox * TS, qy = py + oy * TS;
      if (qx < -r || qx > TS + r || qy < -r || qy > TS + r) continue;
      fn(qx, qy);
    }
  }
  function lumTexture(base, amp, noise, seed, paint) {
    const c = cv(TS, TS), x = g2(c), im = x.createImageData(TS, TS), d = im.data;
    const r = U.mulberry32(seed);
    for (let k = 0; k < TS * TS; k++) {
      const v = 128 + (base[k] - 0.5) * amp + (r() - 0.5) * noise;
      d[k * 4] = d[k * 4 + 1] = d[k * 4 + 2] = v; d[k * 4 + 3] = 255;
    }
    x.putImageData(im, 0, 0);
    if (paint) paint(x, U.rng(seed + 1));
    const out = x.getImageData(0, 0, TS, TS).data, L = new Uint8Array(TS * TS);
    for (let k = 0; k < TS * TS; k++) L[k] = out[k * 4];
    return L;
  }
  function fibres(x, r, n, lmin, lmax, light, dark, horiz) {
    x.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const px = r.next() * TS, py = r.next() * TS;
      const a = horiz ? r.range(-0.45, 0.45) + (r.chance(0.15) ? r.range(0, Math.PI) : 0) : r.next() * Math.PI;
      const l = r.range(lmin, lmax), lt = r.chance(0.5);
      x.strokeStyle = lt ? light : dark;
      x.lineWidth = r.range(0.6, 1.3);
      const bx = r.range(-1.5, 1.5), by = r.range(-1.5, 1.5);
      wrap(x, px, py, l, (qx, qy) => {
        x.beginPath();
        x.moveTo(qx, qy);
        x.quadraticCurveTo(qx + Math.cos(a) * l * 0.5 + bx, qy + Math.sin(a) * l * 0.5 + by, qx + Math.cos(a) * l, qy + Math.sin(a) * l);
        x.stroke();
      });
    }
  }
  function specks(x, r, n, col, rmin, rmax) {
    x.fillStyle = col;
    for (let i = 0; i < n; i++) {
      const px = r.next() * TS, py = r.next() * TS, rr = r.range(rmin, rmax);
      wrap(x, px, py, rr, (qx, qy) => { x.beginPath(); x.arc(qx, qy, rr, 0, TAU); x.fill(); });
    }
  }

  function buildGroundTextures() {
    N_WOB = normalize(upsample(noiseField(128, 8, 71, 3, 0.5), 128, 512), 3.2);
    N_FIB = normalize(upsample(noiseField(256, 64, 73, 2, 0.6), 256, 512), 3.2);
    N_CORE = normalize(upsample(noiseField(128, 16, 79, 2, 0.5), 128, 512), 3.0);
    for (let i = 0; i < 64; i++) {
      const u = i / 64;
      RIDGE[i] = 1 + 0.055 * Math.sin(u * TAU - 0.6) - 0.075 * Math.exp(-Math.pow((u - 0.9) / 0.07, 2)) + 0.03 * Math.exp(-Math.pow((u - 0.3) / 0.08, 2));
    }
    // kraft: mottled, horizontal machine-direction fibres
    const mott = upsample(noiseField(128, 4, 81, 4, 0.55), 128, TS);
    T_KRAFT = lumTexture(mott, 30, 9, 811, (x, r) => {
      fibres(x, r, 2600, 3, 11, 'rgba(255,236,200,0.15)', 'rgba(60,36,16,0.13)', true);
      specks(x, r, 260, 'rgba(50,30,15,0.35)', 0.4, 0.9);
      specks(x, r, 90, 'rgba(255,240,215,0.35)', 0.4, 1.0);
    });
    // felt: fuzzy, curly short hairs
    const fm = upsample(noiseField(128, 8, 82, 3, 0.5), 128, TS);
    T_FELT = lumTexture(fm, 20, 22, 822, (x, r) => {
      x.lineCap = 'round';
      for (let i = 0; i < 5200; i++) {
        const px = r.next() * TS, py = r.next() * TS, rr = r.range(1.2, 3.2), a0 = r.next() * TAU, sp = r.range(0.8, 2.2);
        x.strokeStyle = r.chance(0.5) ? 'rgba(255,255,235,0.13)' : 'rgba(20,30,10,0.13)';
        x.lineWidth = r.range(0.5, 1.0);
        wrap(x, px, py, rr * 2, (qx, qy) => { x.beginPath(); x.arc(qx, qy, rr, a0, a0 + sp); x.stroke(); });
      }
    });
    // cardboard top liner: smooth, a few specks and soft stains
    const cm = upsample(noiseField(128, 4, 83, 3, 0.5), 128, TS);
    T_CARD = lumTexture(cm, 16, 6, 833, (x, r) => {
      fibres(x, r, 700, 2, 7, 'rgba(255,240,210,0.10)', 'rgba(70,45,20,0.10)', true);
      specks(x, r, 160, 'rgba(60,35,15,0.30)', 0.3, 0.8);
      for (let i = 0; i < 5; i++) {
        const px = r.next() * TS, py = r.next() * TS, rr = r.range(20, 50);
        wrap(x, px, py, rr, (qx, qy) => {
          const g = x.createRadialGradient(qx, qy, 0, qx, qy, rr);
          g.addColorStop(0, 'rgba(80,50,20,0.06)'); g.addColorStop(1, 'rgba(80,50,20,0)');
          x.fillStyle = g; x.fillRect(qx - rr, qy - rr, rr * 2, rr * 2);
        });
      }
    });
    T_NEWS = buildNews();
    LEAF = buildLeafCarpet();
  }

  function buildNews() {
    const c = cv(TS, TS), x = g2(c), r = U.rng(9191);
    x.fillStyle = '#ddd5c0';
    x.fillRect(0, 0, TS, TS);
    // yellowed blotches
    for (let i = 0; i < 18; i++) {
      const px = r.next() * TS, py = r.next() * TS, rr = r.range(20, 70);
      wrap(x, px, py, rr, (qx, qy) => {
        const g = x.createRadialGradient(qx, qy, 0, qx, qy, rr);
        g.addColorStop(0, 'rgba(190,160,100,0.10)'); g.addColorStop(1, 'rgba(190,160,100,0)');
        x.fillStyle = g; x.fillRect(qx - rr, qy - rr, rr * 2, rr * 2);
      });
    }
    const colW = 64, lineH = 3.2;
    for (let col = 0; col < 8; col++) {
      const x0 = col * colW + 4, x1 = col * colW + colW - 3;
      let row = 0;
      while (row < 160) {
        const roll = r.next();
        if (roll < 0.05 && row < 150) {
          // headline: thick bars
          x.fillStyle = 'rgba(40,36,34,0.5)';
          let cx = x0;
          while (cx < x1 - 6) { const w = r.range(6, 16); x.fillRect(cx, row * lineH + 1, Math.min(w, x1 - cx), 4.4); cx += w + 3; }
          row += 3;
        } else if (roll < 0.075 && row < 140) {
          // halftone picture
          const h = r.int(7, 12) * lineH, sx = r.next() * 50;
          for (let yy = 0; yy < h; yy += 2.6) for (let xx = 0; xx < x1 - x0; xx += 2.6) {
            const v = U.fbmTile((xx + sx) / 18, (yy + row) / 18, 0, 5, 2);
            const rr = 0.25 + v * 1.05;
            x.fillStyle = 'rgba(55,50,48,0.38)';
            x.beginPath(); x.arc(x0 + xx + 1.3, row * lineH + yy + 1.3, rr, 0, TAU); x.fill();
          }
          row += Math.ceil(h / lineH) + 1;
        } else {
          // a line of words
          x.fillStyle = 'rgba(70,64,60,0.32)';
          let cx = x0 + (r.chance(0.12) ? 6 : 0);
          const end = r.chance(0.1) ? x0 + r.range(10, 40) : x1;
          while (cx < end - 2) { const w = r.range(3, 12); x.fillRect(cx, row * lineH + 0.9, Math.min(w, end - cx), 1.3); cx += w + 2; }
          row += 1;
        }
      }
      x.fillStyle = 'rgba(60,55,50,0.28)';
      x.fillRect(col * colW + 1, 0, 0.8, TS);
    }
    const d = x.getImageData(0, 0, TS, TS).data, out = new Uint8Array(TS * TS * 3);
    for (let k = 0; k < TS * TS; k++) { out[k * 3] = d[k * 4]; out[k * 3 + 1] = d[k * 4 + 1]; out[k * 3 + 2] = d[k * 4 + 2]; }
    return out;
  }

  /* leaf carpet: rasterised cut-paper leaves with per-texel leaf id + centre offset (for leafy region edges) */
  const LEAF_COLS = [
    [[176, 82, 48], 0.27], [[200, 112, 50], 0.18], [[206, 158, 62], 0.17], [[150, 58, 44], 0.15],
    [[140, 92, 54], 0.12], [[184, 128, 58], 0.11],
  ].map(([c, w]) => [c, w]);
  function pickLeafCol(r) {
    let v = r.next();
    for (const [c, w] of LEAF_COLS) { if (v < w) return c; v -= w; }
    return LEAF_COLS[0][0];
  }
  /** signed inside-distance (texels) of a leaf shape. u along midrib, v across. */
  function leafDist(type, u, v, len, wid) {
    const hl = len / 2;
    if (type === 1) { // maple
      const d = Math.hypot(u, v), th = Math.atan2(v, u);
      const R = hl * (0.6 + 0.4 * Math.pow(Math.abs(Math.cos(th * 2.5)), 0.7));
      const notch = th > 2.6 || th < -2.6 ? 0.55 : 1;
      return (R * notch - d) * 0.85;
    }
    const t = u / hl;
    if (t <= -1 || t >= 1) {
      // stem
      if (type !== 1 && t < -1 && t > -1.35 && Math.abs(v) < 0.55) return 0.5 - Math.abs(v);
      return -9;
    }
    let hw = (wid / 2) * Math.sqrt(1 - t * t) * (1 - 0.22 * t);
    if (type === 2) hw *= 0.74 + 0.26 * Math.cos(t * Math.PI * 3.5);
    else hw += Math.sin(u * 2.4) * 0.35;
    return hw - Math.abs(v);
  }
  function buildLeafCarpet() {
    const N = TS * TS;
    const rgb = new Float32Array(N * 3), id = new Uint16Array(N), cdx = new Int8Array(N), cdy = new Int8Array(N);
    const r = U.rng(9001);
    for (let k = 0; k < N; k++) { const n = 0.92 + r.next() * 0.1; rgb[k * 3] = 112 * n; rgb[k * 3 + 1] = 62 * n; rgb[k * 3 + 2] = 40 * n; }
    const GRIDN = 46, COUNT = GRIDN * GRIDN, CELL = TS / GRIDN;
    const bias = new Float32Array(COUNT + 1);
    const perm = Array.from({ length: COUNT }, (_, i) => i);
    for (let i = COUNT - 1; i > 0; i--) { const j = (r.next() * (i + 1)) | 0; const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
    for (let n = 1; n <= COUNT; n++) {
      const gi = perm[n - 1] % GRIDN, gj = (perm[n - 1] / GRIDN) | 0;
      const cx = (gi + r.next()) * CELL, cy = (gj + r.next()) * CELL, a = r.next() * TAU;
      const type = r.chance(0.3) ? 1 : r.chance(0.35) ? 2 : 0;
      const len = r.range(8, 12) * TEXR * (type === 1 ? 0.9 : 1), wid = len * r.range(0.5, 0.66);
      const col = U.mix(pickLeafCol(r), [172, 102, 54], 0.45), br = r.range(0.95, 1.05);
      bias[n] = r.next();
      const ca = Math.cos(a), sa = Math.sin(a);
      const R = Math.ceil(len * 0.72) + 2;
      for (let dy = -R; dy <= R; dy++) {
        for (let dx = -R; dx <= R; dx++) {
          const u = dx * ca + dy * sa, v = -dx * sa + dy * ca;
          const d = leafDist(type, u, v, len, wid);
          if (d <= -0.5) continue;
          const cov = d >= 0.5 ? 1 : d + 0.5;
          const tx = (Math.floor(cx) + dx) & TSM, ty = (Math.floor(cy) + dy) & TSM, k = ty * TS + tx;
          let f = br * (v > 0 ? 0.86 : 1.04);
          if (Math.abs(v) < 0.55 && d > 0.8) f *= 1.13;                       // midrib fold ridge
          else if (type !== 1 && Math.abs(((u + Math.abs(v) * 0.9) / 4.2) % 1) < 0.1) f *= 0.94; // veins
          if (d < 1.1) f *= 0.9;                                                  // cut edge
          const o = k * 3;
          rgb[o] += (col[0] * f - rgb[o]) * cov;
          rgb[o + 1] += (col[1] * f - rgb[o + 1]) * cov;
          rgb[o + 2] += (col[2] * f - rgb[o + 2]) * cov;
          if (cov > 0.5) { id[k] = n; cdx[k] = -dx; cdy[k] = -dy; }
        }
      }
    }
    // drop shadows of higher leaves onto lower ones (offset ~0.6/0.75 wu)
    const sh = new Float32Array(N), sb = new Float32Array(N);
    for (let ty = 0; ty < TS; ty++) for (let tx = 0; tx < TS; tx++) {
      const k = ty * TS + tx, q = ((ty - 2) & TSM) * TS + ((tx - 2) & TSM);
      sh[k] = id[q] > id[k] ? 1 : 0;
      sb[k] = id[q] > 0 ? 1 : 0;
    }
    const blur = (a) => {
      const b = new Float32Array(N);
      for (let pass = 0; pass < 2; pass++) {
        for (let ty = 0; ty < TS; ty++) for (let tx = 0; tx < TS; tx++) {
          let s = 0;
          for (let o = -1; o <= 1; o++) s += a[ty * TS + ((tx + o) & TSM)];
          b[ty * TS + tx] = s / 3;
        }
        for (let ty = 0; ty < TS; ty++) for (let tx = 0; tx < TS; tx++) {
          let s = 0;
          for (let o = -1; o <= 1; o++) s += b[((ty + o) & TSM) * TS + tx];
          a[ty * TS + tx] = s / 3;
        }
      }
      return a;
    };
    blur(sh); blur(sb);
    const out = new Uint8Array(N * 3), sbo = new Uint8Array(N);
    for (let k = 0; k < N; k++) {
      const s = sh[k] * 0.24;
      out[k * 3] = 160 + (rgb[k * 3] * (1 - s * 0.9) - 160) * 0.8;
      out[k * 3 + 1] = 94 + (rgb[k * 3 + 1] * (1 - s) - 94) * 0.8;
      out[k * 3 + 2] = 52 + (rgb[k * 3 + 2] * (1 - s) - 52) * 0.8;
      sbo[k] = sb[k] * 255;
    }
    return { rgb: out, id, cdx, cdy, bias, sb: sbo };
  }

  /* ======================= ground layers ======================= */
  const GS = 3.2, IGS = 0.3125, GM = 8;   // field grid step (wu), inverse, margin cells
  const L_CARD = 0, L_FELT = 1, L_MOSS = 2, L_LEAF = 3, L_NEWS = 4, NL = 5;
  const LD = [
    { thr: 0.50, wob: 0.6, fib: 0.10, thick: 1.0, ox: 1.4, oy: 1.8, soft: 1.5, sh: 0.40, nox: 0, noy: 0 },
    { thr: 0.49, wob: 1.2, fib: 0.22, thick: 1.4, ox: 1.7, oy: 2.2, soft: 1.9, sh: 0.42, nox: 131, noy: 77 },
    { thr: 0.67, wob: 0.9, fib: 0.22, thick: 0.9, ox: 1.2, oy: 1.6, soft: 1.4, sh: 0.38, nox: 260, noy: 301 },
    { thr: 0.595, ox: 0.6, oy: 0.75, sh: 0.42 },
    { thr: 0.70, wob: 2.0, fib: 0.45, thick: 0.35, ox: 1.0, oy: 1.3, soft: 1.1, sh: 0.36, nox: 390, noy: 170 },
  ];
  for (const L of LD) {
    if (L.wob === undefined) { L.rAbs = LREACH + 9 + 3; L.rFull = 10; continue; }
    L.rAbs = L.wob + L.fib + L.thick + Math.hypot(L.ox, L.oy) * 1.4 + L.soft + 3;
    L.rFull = L.wob + L.fib + 0.6;
  }
  const KRAFT_A = [168, 124, 84], KRAFT_B = [180, 136, 92];
  const CARD_C = [196, 156, 108];
  const FELT_A = [96, 124, 70], FELT_B = [118, 132, 66];
  const MOSS_C = [134, 132, 64];
  const CORE_C = [246, 238, 220];
  const THREAD = [244, 232, 206];

  function evalFields(x, y, out) {
    const qx = U.fbm(x / 1500, y / 1500, 501, 2) - 0.5;
    const qy = U.fbm(x / 1500 + 7.3, y / 1500 - 3.1, 502, 2) - 0.5;
    const X = x + qx * 900, Y = y + qy * 900;
    out[0] = U.fbm(X / 1300 + 11.1, Y / 1300, 611, 3, 2, 0.4);
    out[1] = U.fbm(X / 1150, Y / 1150 + 5.7, 612, 3, 2, 0.4);
    out[2] = U.fbm(X / 430 + 2.2, Y / 430, 613, 2);
    out[3] = U.fbm(X / 1050 - 4.4, Y / 1050 + 9.9, 614, 3, 2, 0.4);
    out[4] = U.fbm(x / 380, y / 380 - 8.8, 615, 2);
    out[5] = U.fbm(x / 700, y / 700, 616, 2);
    out[6] = U.fbm(x / 240 + 3.3, y / 240, 617, 2);
  }

  /** builds the signed-distance grid for a chunk (+margin). generator. */
  function* buildGrid(wx, wy, size) {
    const n = Math.round(size / GS) + 2 * GM + 1;
    const gx0 = Math.round(wx / GS) - GM, gy0 = Math.round(wy / GS) - GM;
    const nr = n + 2, CH = 7;
    const raw = new Float32Array(nr * nr * CH), tmp = new Float32Array(CH);
    for (let j = 0; j < nr; j++) {
      if ((j & 1) === 1) yield;
      for (let i = 0; i < nr; i++) {
        evalFields((gx0 - 1 + i) * GS, (gy0 - 1 + j) * GS, tmp);
        raw.set(tmp, (j * nr + i) * CH);
      }
    }
    const sd = [];
    for (let l = 0; l < NL; l++) sd.push(new Float32Array(n * n));
    const mA = new Float32Array(n * n), mB = new Float32Array(n * n);
    for (let j = 0; j < n; j++) {
      if ((j & 7) === 7) yield;
      for (let i = 0; i < n; i++) {
        const o = ((j + 1) * nr + (i + 1)) * CH, k = j * n + i;
        for (let l = 0; l < NL; l++) {
          const f = raw[o + l];
          const dx = (raw[o + CH + l] - raw[o - CH + l]) / (2 * GS);
          const dy = (raw[o + nr * CH + l] - raw[o - nr * CH + l]) / (2 * GS);
          const g = Math.max(Math.sqrt(dx * dx + dy * dy), 1e-4);
          sd[l][k] = U.clamp((f - LD[l].thr) / g, -90, 90);
        }
        mA[k] = raw[o + 5]; mB[k] = raw[o + 6];
      }
    }
    // per-cell states: 0 absent, 1 full, 2 edge zone
    const st = [];
    for (let l = 0; l < NL; l++) {
      const a = sd[l], s = new Uint8Array(n * n), L = LD[l];
      for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) {
        const k = j * n + i;
        const mn = Math.min(a[k], a[k + 1], a[k + n], a[k + n + 1]), mx = Math.max(a[k], a[k + 1], a[k + n], a[k + n + 1]);
        s[k] = mx < -L.rAbs ? 0 : mn > L.rFull ? 1 : 2;
      }
      st.push(s);
    }
    // exact node values outside the grid (identical maths as the grid) -> decisions near chunk borders stay seamless
    const ext = new Map(), t7 = new Float32Array(7), nb = [new Float32Array(7), new Float32Array(7), new Float32Array(7), new Float32Array(7)];
    function extNode(i, j) {
      const key = (i + 4096) * 8192 + (j + 4096);
      let v = ext.get(key);
      if (v) return v;
      const X = (gx0 + i) * GS, Y = (gy0 + j) * GS;
      evalFields(X, Y, t7);
      evalFields(X + GS, Y, nb[0]); evalFields(X - GS, Y, nb[1]); evalFields(X, Y + GS, nb[2]); evalFields(X, Y - GS, nb[3]);
      v = new Float32Array(NL);
      for (let l = 0; l < NL; l++) {
        const dx = (nb[0][l] - nb[1][l]) / (2 * GS), dy = (nb[2][l] - nb[3][l]) / (2 * GS);
        const g = Math.max(Math.sqrt(dx * dx + dy * dy), 1e-4);
        v[l] = U.clamp((t7[l] - LD[l].thr) / g, -90, 90);
      }
      ext.set(key, v);
      return v;
    }
    const nodeSd = (l, i, j) => (i >= 0 && j >= 0 && i < n && j < n ? sd[l][j * n + i] : extNode(i, j)[l]);
    const sdfAt = (l, x, y) => {
      const gx = x * IGS - gx0, gy = y * IGS - gy0;
      const ix = Math.floor(gx), iy = Math.floor(gy);
      const fx = gx - ix, fy = gy - iy;
      if (ix < 0 || iy < 0 || ix > n - 2 || iy > n - 2) {
        const p = nodeSd(l, ix, iy), q = nodeSd(l, ix + 1, iy), r = nodeSd(l, ix, iy + 1), w = nodeSd(l, ix + 1, iy + 1);
        const t = p + (q - p) * fx, b = r + (w - r) * fx;
        return t + (b - t) * fy;
      }
      const a = sd[l], o = iy * n + ix;
      const t = a[o] + (a[o + 1] - a[o]) * fx, b = a[o + n] + (a[o + n + 1] - a[o + n]) * fx;
      return t + (b - t) * fy;
    };
    return { n, gx0, gy0, sd, st, mA, mB, sdfAt };
  }

  function edgeN(l, x, y) {
    const L = LD[l];
    const k = (((Math.floor(y * 4) + L.noy) & 511) << 9) | ((Math.floor(x * 4) + L.nox) & 511);
    return N_WOB[k] * L.wob + N_FIB[k] * L.fib;
  }

  /** topmost ground layer at a point for decal/prop placement; -1 kraft, -2 = too close to an edge */
  function regionAt(pg, x, y, margin) {
    for (let l = NL - 1; l >= 0; l--) {
      const s = pg.sdfAt(l, x, y);
      if (s > margin) return l;
      if (s > -margin - (LD[l].wob || 4)) return -2;
    }
    return -1;
  }

  /* --- per-pixel shading --- */
  function makeShader(pg, res) {
    const { n, gx0, gy0, st, mA, mB, sdfAt } = pg;
    const out = [0, 0, 0];
    const texel = (x, y) => ((Math.floor(y * TEXR) & TSM) << 9) | (Math.floor(x * TEXR) & TSM);
    function leafPresent(x, y) {
      const tk = texel(x, y), id = LEAF.id[tk];
      if (!id) return 0;
      const s = sdfAt(L_LEAF, x + LEAF.cdx[tk] / TEXR, y + LEAF.cdy[tk] / TEXR) + LEAF.bias[id] * LREACH - LREACH * 0.3;
      return s > 0 ? id : 0;
    }
    function S(l, x, y) { return sdfAt(l, x, y) + edgeN(l, x, y); }
    /** find visible layer at p from layer `top` down. returns l (-1 kraft); sets fMode/fS */
    let fMode = 0, fS = 99;
    function find(x, y, cell, top) {
      for (let l = top; l >= 0; l--) {
        const s0 = st[l][cell];
        if (s0 === 0) continue;
        if (s0 === 1) { fMode = 0; fS = 99; return l; }
        if (l === L_LEAF) { if (leafPresent(x, y)) { fMode = 0; fS = 99; return l; } continue; }
        const s = S(l, x, y);
        if (s > 0) { fMode = 0; fS = s; return l; }
        const t = LD[l].thick;
        if (s > -t - 3.5) {
          const s2 = S(l, x, y - t);
          if (s2 > 0) { fMode = 1; fS = -s / t; return l; }
        }
      }
      fMode = 0; fS = 99;
      return -1;
    }
    function shadowAbove(f, x, y, cell) {
      let keep = 1;
      for (let l = f + 1; l < NL; l++) {
        if (st[l][cell] === 0) continue;
        const L = LD[l];
        if (l === L_LEAF) {
          const sb = LEAF.sb[texel(x, y)];
          if (sb && (leafPresent(x - L.ox, y - L.oy) || leafPresent(x - L.ox * 2, y - L.oy * 2))) keep *= 1 - L.sh * (sb / 255);
          continue;
        }
        const so = S(l, x - L.ox, y - L.oy);
        let s = 0;
        if (so > -L.soft) { const t = U.clamp((so + L.soft) / (2 * L.soft), 0, 1); s = t * t * (3 - 2 * t); }
        const sp = S(l, x, y);
        const ao = sp > -2.4 && sp < 0 ? (1 + sp / 2.4) * (1 + sp / 2.4) * 0.2 : 0;
        keep *= (1 - L.sh * s) * (1 - ao);
      }
      return keep;
    }
    function material(l, mode, s, x, y, ma, mb) {
      const tk = texel(x, y);
      let r, g, b, lum;
      if (l === -1) {
        lum = T_KRAFT[tk] / 128;
        const t = mb;
        r = (KRAFT_A[0] + (KRAFT_B[0] - KRAFT_A[0]) * t) * lum;
        g = (KRAFT_A[1] + (KRAFT_B[1] - KRAFT_A[1]) * t) * lum;
        b = (KRAFT_A[2] + (KRAFT_B[2] - KRAFT_A[2]) * t) * lum;
      } else if (l === L_CARD) {
        if (mode === 1) {
          const fl = 0.66 + 0.16 * Math.abs(Math.sin(x * 2.3)) - 0.1 * s;
          r = CARD_C[0] * fl; g = CARD_C[1] * fl; b = CARD_C[2] * fl;
        } else {
          lum = (T_CARD[tk] / 128) * RIDGE[Math.floor(y * 20) & 63];
          if (s < 0.7) lum *= 1.1;
          r = CARD_C[0] * lum; g = CARD_C[1] * lum; b = CARD_C[2] * lum;
        }
      } else if (l === L_FELT || l === L_MOSS) {
        const tk2 = l === L_MOSS ? (tk + 77 * 512 + 191) & (TS * TS - 1) : tk;
        lum = T_FELT[tk2] / 128;
        let cr, cg, cb;
        if (l === L_FELT) {
          const t = U.clamp((ma - 0.35) * 2.5, 0, 1);
          cr = FELT_A[0] + (FELT_B[0] - FELT_A[0]) * t; cg = FELT_A[1] + (FELT_B[1] - FELT_A[1]) * t; cb = FELT_A[2] + (FELT_B[2] - FELT_A[2]) * t;
        } else { cr = MOSS_C[0]; cg = MOSS_C[1]; cb = MOSS_C[2]; }
        if (mode === 1) lum *= 0.72 - 0.12 * s;
        else if (s < 1.0) {
          // fuzzy rim: lit side lighter
          const toward = S(l, x - 0.7, y - 0.7);
          if (toward < s) lum *= 1 + 0.12 * (1 - s);
          else lum *= 1 - 0.06 * (1 - s);
        } else if (l === L_MOSS && s > 1.55 && s < 2.15) {
          const ch = ((Math.floor(x / 1.4) + Math.floor(y / 1.4)) & 1);
          if (ch) { r = THREAD[0]; g = THREAD[1]; b = THREAD[2]; return setOut(r, g, b); }
        }
        r = cr * lum; g = cg * lum; b = cb * lum;
      } else if (l === L_LEAF) {
        const o = tk * 3;
        r = LEAF.rgb[o]; g = LEAF.rgb[o + 1]; b = LEAF.rgb[o + 2];
      } else {
        // newspaper (+ torn white core edge)
        const coreW = 0.55 + 0.45 * N_CORE[(((Math.floor(y * 4)) & 511) << 9) | (Math.floor(x * 4) & 511)];
        if (mode === 1 || s < coreW) {
          const f = (mode === 1 ? 0.82 : 1) * (0.94 + 0.06 * N_FIB[(((Math.floor(y * 4)) & 511) << 9) | (Math.floor(x * 4) & 511)]);
          r = CORE_C[0] * f; g = CORE_C[1] * f; b = CORE_C[2] * f;
        } else {
          const o = tk * 3;
          r = T_NEWS[o]; g = T_NEWS[o + 1]; b = T_NEWS[o + 2];
          if (s < coreW + 0.35) { r = r * 0.92 + 18; g = g * 0.92 + 17; b = b * 0.92 + 16; }
        }
      }
      return setOut(r, g, b);
    }
    function setOut(r, g, b) { out[0] = r; out[1] = g; out[2] = b; return out; }

    /** final colour of a pixel at world (x,y) -> out */
    function pixel(x, y) {
      const gx = x * IGS - gx0, gy = y * IGS - gy0;
      const ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy;
      const cell = iy * n + ix;
      const ma = (mA[cell] * (1 - fx) + mA[cell + 1] * fx) * (1 - fy) + (mA[cell + n] * (1 - fx) + mA[cell + n + 1] * fx) * fy;
      const mb = (mB[cell] * (1 - fx) + mB[cell + 1] * fx) * (1 - fy) + (mB[cell + n] * (1 - fx) + mB[cell + n + 1] * fx) * fy;
      const l1 = find(x, y, cell, NL - 1);
      const m1 = fMode, s1 = fS;
      material(l1, m1, s1, x, y, ma, mb);
      let r = out[0], g = out[1], b = out[2];
      let keep = shadowAbove(l1, x, y, cell);
      const cover = m1 === 0 && l1 >= 0 ? s1 * res + 0.5 : 2;
      if (cover < 1) {
        const l2 = find(x, y, cell, l1 - 1);
        material(l2, fMode, fS, x, y, ma, mb);
        const k2 = shadowAbove(l2, x, y, cell);
        r = r * cover + out[0] * (1 - cover);
        g = g * cover + out[1] * (1 - cover);
        b = b * cover + out[2] * (1 - cover);
        keep = keep * cover + k2 * (1 - cover);
      }
      const br = 0.93 + 0.13 * ma + 0.06 * (mb - 0.5);
      const sk = 1 - keep;
      out[0] = r * br * (1 - sk * 0.86);
      out[1] = g * br * (1 - sk * 0.97);
      out[2] = b * br * (1 - sk * 1.0);
      return out;
    }
    return pixel;
  }

  function* renderChunk(ctx, info) {
    const pg = yield* buildGrid(info.wx, info.wy, info.size);
    info.pg = pg;
    const res = info.res, PX = info.px, wx = info.wx, wy = info.wy;
    const pixel = makeShader(pg, res);
    const img = ctx.createImageData(PX, PX), d = img.data;
    let o = 0;
    for (let py = 0; py < PX; py++) {
      if ((py & 1) === 1) yield;
      const y = wy + (py + 0.5) / res;
      for (let px = 0; px < PX; px++) {
        const c = pixel(wx + (px + 0.5) / res, y);
        d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
        o += 4;
      }
    }
    for (let band = 0; band < PX; band += 128) { ctx.putImageData(img, 0, 0, 0, band, PX, Math.min(128, PX - band)); yield; }
    yield* drawDecals(ctx, info, pg);
  }

  /* ======================= ground decals ======================= */
  const DK = 6; // decal sprite px per wu
  const DEC = {};
  function mkDecal(r, draw, o) {
    o = o || {};
    const size = Math.ceil(r * 2 * DK) + 4, c = cv(size, size), x = g2(c);
    x.setTransform(DK, 0, 0, DK, size / 2, size / 2);
    x.lineJoin = 'round'; x.lineCap = 'round';
    draw(x);
    let img = c, ax = size / 2, ay = size / 2;
    if (o.rim) { const d = dilate(c, o.rim * DK, C.rim); g2(d.c).drawImage(c, d.pad, d.pad); img = d.c; ax += d.pad; ay += d.pad; }
    if (o.grain !== false) applyGrain(g2(img), img.width, img.height, 0.9);
    if (o.light !== false) applyLight(g2(img), img.width, img.height, 0.08);
    const s = softShadow(img, (o.blur || 0.3) * DK);
    return { img, ax, ay, sh: s.c, shPad: s.pad };
  }
  function putDecal(ctx, d, x, y, rot, sc, shA, ox, oy) {
    const k = sc / DK;
    ctx.save();
    ctx.translate(x + (ox === undefined ? 0.45 : ox) * sc, y + (oy === undefined ? 0.55 : oy) * sc);
    ctx.rotate(rot); ctx.scale(k, k);
    ctx.globalAlpha = shA === undefined ? 0.34 : shA;
    ctx.drawImage(d.sh, -d.ax - d.shPad, -d.ay - d.shPad);
    ctx.restore();
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
    ctx.drawImage(d.img, -d.ax, -d.ay);
    ctx.restore();
  }
  function leafPath(x, type, len, wid) {
    const hl = len / 2;
    x.beginPath();
    if (type === 1) {
      for (let i = 0; i <= 80; i++) {
        const th = (i / 80) * TAU;
        let R = hl * (0.6 + 0.4 * Math.pow(Math.abs(Math.cos(th * 2.5)), 0.7));
        if (th > 2.75 && th < 3.55) R *= 0.6;
        const px = Math.cos(th) * R, py = Math.sin(th) * R;
        if (i) x.lineTo(px, py); else x.moveTo(px, py);
      }
    } else {
      const N = 40;
      for (let s = 0; s < 2; s++) {
        for (let i = 0; i <= N; i++) {
          const t = s === 0 ? -1 + (2 * i) / N : 1 - (2 * i) / N;
          let hw = (wid / 2) * Math.sqrt(Math.max(0, 1 - t * t)) * (1 - 0.22 * t);
          if (type === 2) hw *= 0.74 + 0.26 * Math.cos(t * Math.PI * 3.5);
          else hw += Math.sin(t * hl * 2.4) * 0.12 * (1 - t * t);
          const px = t * hl, py = (s === 0 ? -1 : 1) * hw;
          if (s === 0 && i === 0) x.moveTo(px, py); else x.lineTo(px, py);
        }
      }
    }
    x.closePath();
  }
  function drawPaperLeaf(x, type, len, wid, col) {
    leafPath(x, type, len, wid);
    x.fillStyle = col; x.fill();
    x.save();
    x.clip();
    x.fillStyle = 'rgba(60,20,10,0.16)';
    x.fillRect(-len, 0, len * 2, len);
    x.strokeStyle = 'rgba(255,235,200,0.45)'; x.lineWidth = len * 0.035;
    x.beginPath(); x.moveTo(-len / 2, 0); x.lineTo(len / 2, 0); x.stroke();
    if (type !== 1) {
      x.strokeStyle = 'rgba(60,20,10,0.16)'; x.lineWidth = len * 0.025;
      for (let i = -2; i <= 2; i++) {
        const u = (i / 3) * len * 0.4;
        x.beginPath(); x.moveTo(u, 0); x.lineTo(u + len * 0.12, -wid * 0.36); x.moveTo(u, 0); x.lineTo(u + len * 0.12, wid * 0.36); x.stroke();
      }
    } else {
      x.strokeStyle = 'rgba(60,20,10,0.14)'; x.lineWidth = len * 0.025;
      for (const a of [-1.25, 1.25, -2.4, 2.4]) { x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a) * len * 0.4, Math.sin(a) * len * 0.4); x.stroke(); }
    }
    x.restore();
    if (type !== 1) {
      x.strokeStyle = shade(col, 0.7); x.lineWidth = len * 0.04;
      x.beginPath(); x.moveTo(-len / 2, 0); x.lineTo(-len / 2 - len * 0.16, len * 0.04); x.stroke();
    }
  }

  function buildDecals() {
    const r = U.rng(3131);
    // paper flowers (punched shapes)
    const petalCols = ['#f2e7cf', '#e8b84a', '#d98f86', '#b98ab6', '#f4f0e6', '#e98f4c', '#d8d06a'];
    const centreCols = [C.mustard, C.aub, C.red, C.brass, C.teal, C.pumpkin];
    DEC.flowers = [];
    for (let i = 0; i < 10; i++) {
      const pc = petalCols[i % petalCols.length], cc = centreCols[(i * 3 + 1) % centreCols.length];
      const np = i % 3 === 0 ? 6 : 5, rot = r.next();
      DEC.flowers.push(mkDecal(3.2, (x) => {
        for (let k = 0; k < np; k++) {
          const a = rot + (k / np) * TAU;
          x.save(); x.rotate(a);
          x.beginPath(); x.ellipse(1.45, 0, 1.35, 0.95, 0, 0, TAU);
          x.fillStyle = pc; x.fill();
          x.fillStyle = 'rgba(60,30,20,0.12)';
          x.beginPath(); x.ellipse(1.45, 0.35, 1.2, 0.5, 0, 0, Math.PI); x.fill();
          x.restore();
        }
        x.beginPath(); x.arc(0, 0, 0.85, 0, TAU); x.fillStyle = cc; x.fill();
        x.fillStyle = 'rgba(255,255,240,0.45)'; x.beginPath(); x.arc(-0.25, -0.25, 0.3, 0, TAU); x.fill();
      }));
    }
    // sewing buttons
    const btnCols = [C.red, C.mustard, C.teal, '#e9dcc0', C.aubLight, '#5d7fa3', C.pumpkin];
    DEC.buttons = btnCols.map((col, i) => mkDecal(2.6, (x) => {
      const R = 1.9;
      x.beginPath(); x.arc(0, 0, R, 0, TAU); x.fillStyle = col; x.fill();
      x.strokeStyle = shade(col, 0.75); x.lineWidth = 0.28;
      x.beginPath(); x.arc(0, 0, R * 0.74, 0, TAU); x.stroke();
      x.fillStyle = 'rgba(255,255,240,0.35)'; x.beginPath(); x.arc(-0.6, -0.6, 0.55, 0, TAU); x.fill();
      const holes = i % 2 ? [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]] : [[-0.45, 0], [0.45, 0]];
      x.strokeStyle = 'rgba(245,235,210,0.95)'; x.lineWidth = 0.22;
      x.beginPath();
      if (holes.length === 4) { x.moveTo(-0.45, -0.45); x.lineTo(0.45, 0.45); x.moveTo(0.45, -0.45); x.lineTo(-0.45, 0.45); }
      else { x.moveTo(-0.45, 0); x.lineTo(0.45, 0); }
      x.stroke();
      x.fillStyle = 'rgba(40,20,15,0.55)';
      for (const h of holes) { x.beginPath(); x.arc(h[0], h[1], 0.2, 0, TAU); x.fill(); }
    }, { grain: 0.5 }));
    // grass fringe tufts
    DEC.tufts = [];
    for (let i = 0; i < 5; i++) {
      const nb = 5 + (i % 3), cols = i % 2 ? ['#5c7c3e', '#7aa04f', '#4a6a32'] : ['#6f9246', '#8fb35a', '#55763a'];
      DEC.tufts.push(mkDecal(4, (x) => {
        for (let k = 0; k < nb; k++) {
          const bx = -2.6 + (k / (nb - 1)) * 5.2 + r.range(-0.3, 0.3), h = r.range(2.6, 4.2) * (1 - Math.abs(k / (nb - 1) - 0.5) * 0.6);
          const lean = r.range(-0.5, 0.5) + (bx * 0.18);
          x.beginPath(); x.moveTo(bx - 0.55, 1); x.lineTo(bx + lean, 1 - h); x.lineTo(bx + 0.55, 1); x.closePath();
          x.fillStyle = cols[k % 3]; x.fill();
        }
        x.fillStyle = cols[2]; x.fillRect(-3, 0.6, 6, 0.7);
      }));
    }
    // glued pebbles
    const pebCols = ['#a8a3a0', '#8f99a3', '#b8ab95', '#9a8f86', '#c4bcae'];
    DEC.pebbles = pebCols.map((col) => mkDecal(2.6, (x) => {
      x.beginPath(); x.ellipse(0, 0, r.range(1.3, 2.1), r.range(1.0, 1.5), r.range(-0.5, 0.5), 0, TAU);
      x.fillStyle = col; x.fill();
      x.save(); x.clip();
      x.fillStyle = 'rgba(40,30,20,0.2)'; x.beginPath(); x.ellipse(0.5, 0.6, 2, 1.3, 0, 0, TAU); x.fill();
      x.fillStyle = 'rgba(255,255,245,0.3)'; x.beginPath(); x.ellipse(-0.6, -0.5, 0.8, 0.45, -0.4, 0, TAU); x.fill();
      x.restore();
    }, { grain: 1.2 }));
    // loose cut leaves
    DEC.leaves = [];
    const lcols = ['#b0522e', '#cc7232', '#cf9e3e', '#9c3a2c', '#8e5c36', '#b8803a', '#7e8a3c'];
    for (let i = 0; i < 12; i++) {
      const type = i % 3, len = r.range(6, 9), col = lcols[i % lcols.length];
      DEC.leaves.push(mkDecal(len * 0.75, (x) => drawPaperLeaf(x, type, len, len * 0.6, col), { blur: 0.35 }));
    }
    // masking tape
    DEC.tapes = [];
    for (let i = 0; i < 3; i++) {
      const L = 14 + i * 2;
      DEC.tapes.push(mkDecal(L / 2 + 1, (x) => {
        const pts = [];
        const zig = (sx, sgn) => { for (let k = 0; k <= 6; k++) pts.push([sx + sgn * (k % 2 ? 0.5 : 0) + r.range(-0.15, 0.15), -1.7 + (k / 6) * 3.4 * (sgn > 0 ? 1 : 1)]); };
        zig(L / 2, 1);
        const right = pts.splice(0);
        x.beginPath();
        x.moveTo(-L / 2, -1.7);
        x.lineTo(L / 2, -1.7);
        for (const p of right) x.lineTo(p[0], p[1]);
        x.lineTo(-L / 2, 1.7);
        for (let k = 6; k >= 0; k--) x.lineTo(-L / 2 - (k % 2 ? 0.5 : 0), -1.7 + (k / 6) * 3.4);
        x.closePath();
        x.fillStyle = 'rgba(234,220,170,0.8)'; x.fill();
        x.strokeStyle = 'rgba(160,140,90,0.25)'; x.lineWidth = 0.15;
        for (let k = 0; k < 5; k++) { x.beginPath(); x.moveTo(-L / 2, -1.2 + k * 0.6); x.lineTo(L / 2, -1.2 + k * 0.6 + r.range(-0.1, 0.1)); x.stroke(); }
      }, { grain: 0.6, blur: 0.25 }));
    }
    // lace doily
    DEC.doily = mkDecal(17, (x) => {
      scallop(x, 0, 0, 15, 15, 30, 0.07, 0);
      x.fillStyle = 'rgba(248,243,230,0.96)'; x.fill();
      x.globalCompositeOperation = 'destination-out';
      for (const [rr, nn, hr] of [[13.2, 30, 0.55], [11.2, 24, 0.8], [8.6, 18, 1.1], [5.6, 12, 0.9], [3.2, 8, 0.6]]) {
        for (let k = 0; k < nn; k++) {
          const a = (k / nn) * TAU + (nn % 2 ? 0 : 0.1);
          x.beginPath(); x.ellipse(Math.cos(a) * rr, Math.sin(a) * rr, hr, hr * 0.7, a, 0, TAU); x.fill();
        }
      }
      x.globalCompositeOperation = 'source-over';
      x.strokeStyle = 'rgba(200,190,170,0.5)'; x.lineWidth = 0.18;
      for (const rr of [12.2, 9.9, 7.1, 4.4]) { x.beginPath(); x.arc(0, 0, rr, 0, TAU); x.stroke(); }
    }, { grain: 0.5, blur: 0.35 });
  }

  function* drawDecals(ctx, info, pg) {
    const pts = [];
    G.scatter(info, 24, 7001, 14, (x, y, rng) => pts.push([x, y, rng.next(), rng.next(), rng.next(), rng.next(), rng.next()]));
    const big = [];
    G.scatter(info, 170, 7002, 40, (x, y, rng) => big.push([x, y, rng.next(), rng.next(), rng.next(), rng.next(), rng.next()]));
    let k = 0;
    // large rare decals first (lowest)
    for (const [x, y, a, b, c, d, e] of big) {
      const reg = regionAt(pg, x, y, 18);
      if (reg === -1 && a < 0.13) putDecal(ctx, DEC.doily, x, y, b * TAU, 1, 0.3);
      else if ((reg === -1 || reg === L_CARD) && a < 0.26) coffeeRing(ctx, x, y, 8 + b * 3, c);
      else if (reg === L_CARD && a < 0.5) stampArrows(ctx, x, y, (b - 0.5) * 0.5, c);
      else if (reg === -1 && a < 0.55) {
        const ang = b * Math.PI, L = 30 + c * 40;
        const ex = Math.cos(ang) * L / 2, ey = Math.sin(ang) * L / 2;
        if (regionAt(pg, x + ex, y + ey, 3) === -1 && regionAt(pg, x - ex, y - ey, 3) === -1) crease(ctx, x, y, ang, L);
      } else if (reg === L_FELT && a < 0.7) stitchLine(ctx, pg, x, y, b, c, d);
      else if ((reg === -1 || reg === L_CARD) && a < 0.66) {
        const ang = (b - 0.5) * 0.8, L = 26 + c * 20;
        const ex = Math.cos(ang) * L / 2, ey = Math.sin(ang) * L / 2;
        if (regionAt(pg, x + ex, y + ey, 3) === reg && regionAt(pg, x - ex, y - ey, 3) === reg) cutLine(ctx, x, y, ang, L);
      }
      yield;
    }
    for (const [x, y, a, b, c, d, e] of pts) {
      const reg = regionAt(pg, x, y, 3);
      if (reg === L_FELT) {
        if (a < 0.1) { const n = 1 + Math.floor(b * 3); for (let i = 0; i < n; i++) putDecal(ctx, DEC.flowers[Math.floor(((c + i * 0.37) % 1) * DEC.flowers.length)], x + (i ? (d - 0.5) * 9 + i * 2 : 0), y + (i ? (e - 0.5) * 7 : 0), c * TAU, 0.75 + e * 0.35); }
        else if (a < 0.3) putDecal(ctx, DEC.tufts[Math.floor(b * DEC.tufts.length)], x, y, 0, 0.8 + c * 0.4, 0.3);
        else if (a < 0.33) putDecal(ctx, DEC.buttons[Math.floor(b * DEC.buttons.length)], x, y, c * TAU, 0.9 + d * 0.4);
        else if (a < 0.36) putDecal(ctx, DEC.pebbles[Math.floor(b * DEC.pebbles.length)], x, y, c * TAU, 1);
        else if (a < 0.4) putDecal(ctx, DEC.leaves[Math.floor(b * DEC.leaves.length)], x, y, c * TAU, 0.8);
      } else if (reg === L_MOSS) {
        if (a < 0.25) putDecal(ctx, DEC.flowers[Math.floor(b * DEC.flowers.length)], x, y, c * TAU, 0.8 + e * 0.3);
        else if (a < 0.4) putDecal(ctx, DEC.tufts[Math.floor(b * DEC.tufts.length)], x, y, 0, 0.8, 0.3);
      } else if (reg === -1) {
        if (a < 0.07) { for (let i = 0; i < 3; i++) putDecal(ctx, DEC.pebbles[Math.floor(((b + i * 0.31) % 1) * DEC.pebbles.length)], x + (i - 1) * 3.5 + c * 2, y + ((d + i * 0.4) % 1 - 0.5) * 4, e * TAU, 0.7 + ((c + i * 0.3) % 1) * 0.5); }
        else if (a < 0.16) confetti(ctx, x, y, b, c, 4);
        else if (a < 0.19) putDecal(ctx, DEC.buttons[Math.floor(b * DEC.buttons.length)], x, y, c * TAU, 1);
        else if (a < 0.24) putDecal(ctx, DEC.leaves[Math.floor(b * DEC.leaves.length)], x, y, c * TAU, 0.8);
        else if (a < 0.26) putDecal(ctx, DEC.flowers[Math.floor(b * DEC.flowers.length)], x, y, c * TAU, 0.9);
      } else if (reg === L_CARD) {
        if (a < 0.06) putDecal(ctx, DEC.tapes[Math.floor(b * DEC.tapes.length)], x, y, (c - 0.5) * 1.2, 1, 0.22, 0.25, 0.35);
        else if (a < 0.1) staples(ctx, x, y, c);
        else if (a < 0.16) confetti(ctx, x, y, b, c, 3);
      } else if (reg === L_LEAF) {
        if (a < 0.3) putDecal(ctx, DEC.leaves[Math.floor(b * DEC.leaves.length)], x, y, c * TAU, 0.95 + d * 0.3, 0.36);
      } else if (reg === -2) {
        if (a < 0.1) putDecal(ctx, DEC.leaves[Math.floor(b * DEC.leaves.length)], x, y, c * TAU, 0.85);
      }
      if ((++k & 15) === 0) yield;
    }
  }
  const CONF = ['#e57d2c', '#d6a43a', '#36a596', '#c4432f', '#9c629a', '#f2e7cf', '#76a54e'];
  function confetti(ctx, x, y, b, c, n) {
    const rr = U.rng(((b * 1e6) | 0) ^ 0x5151);
    for (let i = 0; i < n; i++) {
      const px = x + rr.range(-6, 6), py = y + rr.range(-5, 5), rad = rr.range(0.55, 0.95);
      ctx.fillStyle = 'rgba(48,26,12,0.3)';
      ctx.beginPath(); ctx.arc(px + 0.3, py + 0.4, rad, 0, TAU); ctx.fill();
      ctx.fillStyle = CONF[(rr.next() * CONF.length) | 0];
      ctx.beginPath(); ctx.arc(px, py, rad, 0, TAU); ctx.fill();
    }
  }
  function staples(ctx, x, y, c) {
    const a = (c - 0.5) * 1.2;
    for (let i = 0; i < 2; i++) {
      const px = x + Math.cos(a + 1.57) * i * 3, py = y + Math.sin(a + 1.57) * i * 3;
      const dx = Math.cos(a) * 1.4, dy = Math.sin(a) * 1.4;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(40,25,12,0.35)'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(px - dx + 0.25, py - dy + 0.3); ctx.lineTo(px + dx + 0.25, py + dy + 0.3); ctx.stroke();
      ctx.strokeStyle = '#a9a9a9'; ctx.lineWidth = 0.42;
      ctx.beginPath(); ctx.moveTo(px - dx, py - dy); ctx.lineTo(px + dx, py + dy); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 0.15;
      ctx.beginPath(); ctx.moveTo(px - dx * 0.8, py - dy * 0.8 - 0.1); ctx.lineTo(px + dx * 0.8, py + dy * 0.8 - 0.1); ctx.stroke();
    }
  }
  function coffeeRing(ctx, x, y, R, c) {
    ctx.strokeStyle = 'rgba(105,62,30,0.12)'; ctx.lineWidth = 1.0;
    ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(105,62,30,0.12)'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.arc(x + 0.3, y + 0.2, R - 0.6, c * TAU, c * TAU + 3.6); ctx.stroke();
    ctx.fillStyle = 'rgba(120,75,35,0.04)';
    ctx.beginPath(); ctx.arc(x, y, R - 0.5, 0, TAU); ctx.fill();
  }
  function stampArrows(ctx, x, y, rot, c) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.strokeStyle = 'rgba(70,40,25,0.28)'; ctx.fillStyle = 'rgba(70,40,25,0.28)';
    ctx.lineWidth = 0.9; ctx.lineCap = 'butt';
    for (const ox of [-3.2, 3.2]) {
      ctx.beginPath(); ctx.moveTo(ox, 4); ctx.lineTo(ox, -2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox - 2.4, -1.6); ctx.lineTo(ox, -4.6); ctx.lineTo(ox + 2.4, -1.6); ctx.closePath(); ctx.fill();
    }
    ctx.fillRect(-6.2, 5.2, 12.4, 0.9);
    ctx.lineWidth = 0.5; ctx.strokeRect(-7.6, -6.4, 15.2, 13.6);
    ctx.restore();
  }
  function crease(ctx, x, y, ang, L) {
    const dx = Math.cos(ang) * L / 2, dy = Math.sin(ang) * L / 2, nx = -Math.sin(ang) * 0.45, ny = Math.cos(ang) * 0.45;
    ctx.lineCap = 'round';
    const g1 = ctx.createLinearGradient(x - dx, y - dy, x + dx, y + dy);
    g1.addColorStop(0, 'rgba(255,240,215,0)'); g1.addColorStop(0.2, 'rgba(255,240,215,0.22)'); g1.addColorStop(0.8, 'rgba(255,240,215,0.22)'); g1.addColorStop(1, 'rgba(255,240,215,0)');
    ctx.strokeStyle = g1; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(x - dx, y - dy); ctx.lineTo(x + dx, y + dy); ctx.stroke();
    const g2_ = ctx.createLinearGradient(x - dx, y - dy, x + dx, y + dy);
    g2_.addColorStop(0, 'rgba(60,36,18,0)'); g2_.addColorStop(0.2, 'rgba(60,36,18,0.16)'); g2_.addColorStop(0.8, 'rgba(60,36,18,0.16)'); g2_.addColorStop(1, 'rgba(60,36,18,0)');
    ctx.strokeStyle = g2_;
    ctx.beginPath(); ctx.moveTo(x - dx + nx, y - dy + ny); ctx.lineTo(x + dx + nx, y + dy + ny); ctx.stroke();
  }
  function cutLine(ctx, x, y, ang, L) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.strokeStyle = 'rgba(60,50,55,0.32)'; ctx.lineWidth = 0.35; ctx.setLineDash([1.8, 1.3]);
    ctx.beginPath(); ctx.moveTo(-L / 2 + 5, 0); ctx.lineTo(L / 2, 0); ctx.stroke();
    ctx.setLineDash([]);
    // tiny scissors
    ctx.lineWidth = 0.35;
    ctx.beginPath(); ctx.arc(-L / 2, -1.1, 0.8, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(-L / 2, 1.1, 0.8, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-L / 2 + 0.6, -0.6); ctx.lineTo(-L / 2 + 3.6, 0.8); ctx.moveTo(-L / 2 + 0.6, 0.6); ctx.lineTo(-L / 2 + 3.6, -0.8); ctx.stroke();
    ctx.restore();
  }
  function stitchLine(ctx, pg, x, y, b, c, d) {
    const a0 = b * TAU, L = 34 + c * 30, bend = (d - 0.5) * 1.4;
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40, a = a0 + bend * (t - 0.5);
      pts.push([x + Math.cos(a) * (t - 0.5) * L + Math.cos(a0 + 1.57) * Math.sin(t * Math.PI) * bend * 6, y + Math.sin(a) * (t - 0.5) * L + Math.sin(a0 + 1.57) * Math.sin(t * Math.PI) * bend * 6]);
    }
    for (const p of [pts[0], pts[20], pts[40]]) if (regionAt(pg, p[0], p[1], 2) !== L_FELT) return;
    ctx.lineCap = 'round';
    let acc = 0, on = true;
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
      const seg = Math.hypot(bx - ax, by - ay);
      acc += seg;
      if (on) {
        ctx.strokeStyle = 'rgba(30,40,15,0.35)'; ctx.lineWidth = 0.55;
        ctx.beginPath(); ctx.moveTo(ax + 0.2, ay + 0.28); ctx.lineTo(bx + 0.2, by + 0.28); ctx.stroke();
        ctx.strokeStyle = 'rgba(246,236,212,0.92)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      }
      if (acc > (on ? 1.7 : 1.1)) { acc = 0; on = !on; }
    }
  }

  /* ======================= props (stand-up cut-outs) ======================= */
  const PROPS = {};
  /** projected, blurred cast shadow of an upright cut-out (light from top-left -> shadow falls right-down) */
  function castShadow(spr, kx, ky, blurWu) {
    kx = kx === undefined ? 0.42 : kx; ky = ky === undefined ? 0.26 : ky;
    const src = spr.img, fx = spr.ax, fy = spr.ay;
    const blur = (blurWu || 1.4) * K, pad = Math.ceil(blur * 2.5) + 4;
    const w = src.width + fy * kx + pad * 2, h = fy * ky + pad * 2 + 12;
    const t = cv(w, h), x = g2(t);
    x.setTransform(1, 0, -kx, -ky, kx * fy + pad, ky * fy + pad + 6);
    x.drawImage(sil(src, '#000'), 0, 0);
    x.setTransform(1, 0, 0, 1, 0, 0);
    // contact darkening near the base, fading with distance
    x.globalCompositeOperation = 'destination-in';
    const g = x.createLinearGradient(0, pad + 6, 0, h);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0.45)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const c = cv(w, h), y = g2(c);
    blurInto(y, sil(t, C.shadow), 0, 0, blur);
    // dark contact blob at the foot
    y.globalCompositeOperation = 'source-over';
    const cg = y.createRadialGradient(fx + pad, pad + 6, 0, fx + pad, pad + 6, src.width * 0.32);
    cg.addColorStop(0, 'rgba(48,26,12,0.55)'); cg.addColorStop(1, 'rgba(48,26,12,0)');
    y.save(); y.translate(fx + pad, pad + 6); y.scale(1, 0.35); y.translate(-(fx + pad), -(pad + 6));
    y.fillStyle = cg; y.fillRect(0, 0, w, h * 3); y.restore();
    return { img: c, ax: fx + pad, ay: pad + 6 };
  }
  function propSprite(fw, fh, footX, footY, list) {
    const frame = composeFrame(fw, fh, footX, footY, 1, list, { shx: 0.55, shy: 0.7 });
    const spr = { img: frame, ax: footX * K, ay: footY * K };
    spr.shadow = castShadow(spr);
    return spr;
  }
  function foldTab(w, col) {
    return mkPart([-w / 2 - 1, -3.6, w / 2 + 1, 0.8], (x) => {
      x.beginPath(); x.moveTo(-w / 2, 0.3); x.lineTo(w / 2, 0.3); x.lineTo(w / 2 - 2, -3); x.lineTo(-w / 2 + 2, -3); x.closePath();
      x.fillStyle = col; x.fill();
      x.fillStyle = 'rgba(40,20,10,0.14)'; x.fillRect(-w / 2, -0.4, w, 0.7);
    }, { rim: 0.3, light: 0.05 });
  }
  function trunkPart(h, w0, w1, col, branches, r) {
    return mkPart([-w0 - 9, -h - 3, w0 + 9, 1], (x) => {
      x.beginPath();
      x.moveTo(-w0, 0); x.quadraticCurveTo(-w1 * 1.2, -h * 0.5, -w1, -h); x.lineTo(w1, -h); x.quadraticCurveTo(w1 * 1.2, -h * 0.5, w0, 0); x.closePath();
      for (const b of branches) {
        const [by, dir, len, up] = b;
        x.moveTo(dir * w1 * 0.8, -by); x.quadraticCurveTo(dir * len * 0.6, -by - up * 0.3, dir * len, -by - up);
        x.lineTo(dir * len + dir * 0.2, -by - up + 1.4); x.quadraticCurveTo(dir * len * 0.5, -by + 1.4, dir * w1 * 0.8, -by + 2.4); x.closePath();
      }
      x.fillStyle = col; x.fill('nonzero');
      x.save(); x.clip();
      x.fillStyle = 'rgba(30,15,5,0.2)'; x.fillRect(0, -h - 3, w0 + 9, h + 4);
      x.strokeStyle = 'rgba(255,230,200,0.25)'; x.lineWidth = 0.3;
      x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -h); x.stroke();
      x.strokeStyle = 'rgba(40,20,10,0.25)'; x.lineWidth = 0.22;
      for (let i = 0; i < 6; i++) { const yy = -r.range(2, h - 2); x.beginPath(); x.moveTo(-w0 * 0.7, yy); x.quadraticCurveTo(0, yy - 0.8, w0 * 0.6, yy + 0.4); x.stroke(); }
      x.restore();
    });
  }
  function crownPart(rx, ry, col, n, depth, r) {
    const rot = r.next() * TAU;
    return mkPart([-rx - 3, -ry - 3, rx + 3, ry + 3], (x) => {
      scallop(x, 0, 0, rx, ry, n, depth, rot);
      x.fillStyle = col; x.fill();
      x.save(); x.clip();
      // paper crease veins
      x.strokeStyle = 'rgba(255,240,210,0.22)'; x.lineWidth = 0.35;
      for (let i = 0; i < 4; i++) { const a = r.next() * TAU, l = r.range(0.3, 0.7); x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a) * rx * l, Math.sin(a) * ry * l); x.stroke(); }
      x.fillStyle = 'rgba(40,15,5,0.12)';
      scallop(x, rx * 0.25, ry * 0.3, rx * 0.85, ry * 0.8, n, depth, rot);
      x.fill();
      x.restore();
    }, { rim: 0.6 });
  }
  function buildTrees() {
    const out = [];
    const autumn = [['#9c4a2a', '#c86a30', '#d9a23e'], ['#8c3a2c', '#b8542e', '#e08a3a'], ['#9a6a2a', '#c8962e', '#e2be5a']];
    for (let v = 0; v < 3; v++) {
      const r = U.rng(500 + v), cols = autumn[v];
      const tab = foldTab(16, C.kraftLight);
      const trunk = trunkPart(40, 3, 1.6, '#76503a', [[22, -1, 8, 6], [28, 1, 7, 5]], r);
      const c1 = crownPart(21, 17, cols[0], 11, 0.18, r), c2 = crownPart(16, 13, cols[1], 9, 0.2, r), c3 = crownPart(11, 9, cols[2], 8, 0.22, r);
      out.push(propSprite(60, 82, 30, 78, [
        { p: tab, x: 0, y: 0, sh: 0 }, { p: trunk, x: 0, y: 0, sh: 0.3 },
        { p: c1, x: 0, y: -52 }, { p: c2, x: -4.5, y: -50 }, { p: c3, x: 5, y: -46, pin: [0, 0, 0.75] },
      ]));
    }
    // pine (felt tiers)
    for (let v = 0; v < 2; v++) {
      const r = U.rng(600 + v);
      const tab = foldTab(14, C.kraftLight);
      const trunk = trunkPart(16, 2.6, 2, '#6c4a34', [], r);
      const greens = v ? ['#3f5a30', '#4f6e38', '#5f8240', '#76994c'] : ['#445e34', '#566f3a', '#6a8443', '#859a4e'];
      const tiers = [];
      for (let i = 0; i < 4; i++) {
        const w = 17 - i * 3.6, h = 15 - i * 1.6;
        tiers.push(mkPart([-w - 2, -h - 2, w + 2, 3], (x) => {
          x.beginPath(); x.moveTo(0, -h);
          const nz = 7 - i;
          x.lineTo(w, 0.6);
          for (let k = nz; k >= 0; k--) { const px = -w + (2 * w * k) / nz; x.lineTo(px + w / nz, 2); x.lineTo(px, 0.6); }
          x.closePath();
          x.fillStyle = greens[i]; x.fill();
          x.save(); x.clip(); x.fillStyle = 'rgba(20,30,10,0.18)'; x.fillRect(0, -h - 2, w + 2, h + 6); x.restore();
        }, { rim: 0.6 }));
      }
      out.push(propSprite(44, 70, 22, 66, [
        { p: tab, x: 0, y: 0, sh: 0 }, { p: trunk, x: 0, y: 0, sh: 0.3 },
        { p: tiers[0], x: 0, y: -14 }, { p: tiers[1], x: 0, y: -25 }, { p: tiers[2], x: 0, y: -35 }, { p: tiers[3], x: 0, y: -44, pin: [0, -6, 0.7] },
      ]));
    }
    // bare spooky tree with a few hanging paper leaves
    {
      const r = U.rng(700);
      const tab = foldTab(16, C.kraftLight);
      const trunk = trunkPart(44, 3.6, 1.4, '#5e4034', [[18, -1, 13, 10], [26, 1, 12, 9], [34, -1, 9, 7], [38, 1, 7, 8]], r);
      const lv = [];
      for (let i = 0; i < 5; i++) {
        const col = ['#c86a30', '#d9a23e', '#b0522e'][i % 3];
        lv.push([mkPart([-4, -4, 4, 4], (x) => { x.rotate(0.6); drawPaperLeaf(x, i % 3, 5.6, 3.4, col); }, { rim: 0.35 }), [[-12, -27], [11, -35], [-8, -41], [7, -46], [1, -44]][i]]);
      }
      out.push(propSprite(50, 62, 25, 58, [
        { p: tab, x: 0, y: 0, sh: 0 }, { p: trunk, x: 0, y: 0, sh: 0.3 },
        ...lv.map(([p, [px, py]]) => ({ p, x: px, y: py, r: r.range(-0.6, 0.6) })),
      ]));
    }
    PROPS.tree = out;
  }
  function buildPumpkins() {
    const sets = [[C.pumpkinDeep, C.pumpkinDark, C.pumpkin, C.pumpkinLight], ['#a8762a', C.mustardDark, C.mustard, C.mustardLight], ['#b9ab8c', '#d4c7a6', '#e8dec4', '#f6efdc']];
    PROPS.pumpkin = sets.map((cols, v) => {
      const r = U.rng(800 + v);
      const body = mkPart([-11, -16, 11, 1], (x) => {
        const rxs = [9.5, 7.8, 5.9, 3.8, 1.7];
        for (let i = 0; i < rxs.length; i++) {
          x.beginPath(); x.ellipse(0, -7.4, rxs[i], 7.4 - (4 - i) * 0.12, 0, 0, TAU);
          x.fillStyle = cols[Math.min(3, i % 2 === 0 ? (i >> 1) + 1 : (i >> 1))]; x.fill();
          x.strokeStyle = 'rgba(80,30,10,0.25)'; x.lineWidth = 0.22; x.stroke();
        }
      }, { rim: 0.55 });
      const stem = mkPart([-3, -5, 4, 1], (x) => {
        x.beginPath(); x.moveTo(-1, 0.5); x.lineTo(-0.6, -3.4); x.quadraticCurveTo(0.6, -4.6, 1.8, -3.6); x.lineTo(1.1, 0.5); x.closePath();
        x.fillStyle = '#6a7a38'; x.fill();
        x.strokeStyle = 'rgba(30,40,10,0.4)'; x.lineWidth = 0.2; x.beginPath(); x.moveTo(0.2, 0.3); x.lineTo(0.4, -3.6); x.stroke();
      }, { rim: 0.4 });
      const leaf = mkPart([-4, -3, 4, 3], (x) => { x.rotate(-0.3); drawPaperLeaf(x, 0, 6, 3.6, C.leaf); }, { rim: 0.35 });
      return propSprite(26, 22, 13, 19, [
        { p: leaf, x: 3.8, y: -14.4, r: -0.4 }, { p: stem, x: 0, y: -14.2 }, { p: body, x: 0, y: 0 },
      ]);
    });
  }
  function buildGraves() {
    const out = [];
    for (let v = 0; v < 3; v++) {
      const r = U.rng(900 + v);
      const tab = foldTab(13, '#b3aebb');
      const stone = mkPart([-8, -21, 8, 1], (x) => {
        x.beginPath();
        if (v === 1) {
          x.moveTo(-1.6, 0); x.lineTo(-1.6, -9); x.lineTo(-5.5, -9); x.lineTo(-5.5, -12.4); x.lineTo(-1.6, -12.4); x.lineTo(-1.6, -18); x.lineTo(1.6, -18);
          x.lineTo(1.6, -12.4); x.lineTo(5.5, -12.4); x.lineTo(5.5, -9); x.lineTo(1.6, -9); x.lineTo(1.6, 0); x.closePath();
        } else {
          x.moveTo(-6.4, 0); x.lineTo(-6.4, -12); x.arc(0, -12, 6.4, Math.PI, 0); x.lineTo(6.4, 0); x.closePath();
        }
        x.fillStyle = v === 2 ? '#8e8a9a' : C.grey; x.fill();
        x.save(); x.clip();
        x.fillStyle = 'rgba(30,20,40,0.16)'; x.fillRect(0, -20, 8, 21);
        if (v !== 1) {
          x.strokeStyle = 'rgba(60,50,70,0.5)'; x.lineWidth = 0.3;
          x.beginPath(); x.moveTo(-4.6, -1.5); x.lineTo(-4.6, -12); x.arc(0, -12, 4.6, Math.PI, 0); x.lineTo(4.6, -1.5); x.stroke();
          // little turnip emblem + scribbled lines
          x.fillStyle = 'rgba(70,40,75,0.6)';
          x.beginPath(); x.ellipse(0, -11.5, 1.6, 1.4, 0, 0, TAU); x.fill();
          x.beginPath(); x.moveTo(-0.5, -12.6); x.lineTo(0, -14.4); x.lineTo(0.5, -12.6); x.fill();
          x.strokeStyle = 'rgba(50,40,60,0.45)'; x.lineWidth = 0.35;
          for (let i = 0; i < 3; i++) { const yy = -7.6 + i * 1.8, w = 3.2 - i * 0.5; x.beginPath(); x.moveTo(-w, yy); x.quadraticCurveTo(0, yy - 0.4, w, yy + 0.2); x.stroke(); }
        }
        if (v === 2) { x.strokeStyle = 'rgba(40,30,50,0.55)'; x.lineWidth = 0.3; x.beginPath(); x.moveTo(3, -17); x.lineTo(1.8, -14); x.lineTo(3.2, -12); x.lineTo(2, -9); x.stroke(); }
        x.restore();
      }, { rim: 0.55 });
      const moss = mkPart([-8, -3, 8, 1], (x) => { scallop(x, 0, -0.6, 6.8, 1.6, 9, 0.35, 0); x.fillStyle = C.moss; x.fill(); }, { rim: 0.3 });
      out.push(propSprite(22, 26, 11, 23, [
        { p: tab, x: 0, y: 0, sh: 0 }, { p: stone, x: 0, y: 0, r: v === 2 ? 0.08 : 0 }, { p: moss, x: 0.5, y: 0.6, sh: 0.25 },
      ]));
    }
    PROPS.grave = out;
  }
  function buildFences() {
    PROPS.fence = [0, 1].map((v) => {
      const r = U.rng(1000 + v);
      const n = 5 + v, w = n * 6;
      const rails = mkPart([-w / 2 - 2, -14, w / 2 + 2, 0], (x) => {
        for (const yy of [-11.5, -5.5]) {
          x.fillStyle = C.cardDark; x.fillRect(-w / 2 - 1, yy, w + 2, 2.6);
          x.strokeStyle = 'rgba(60,40,20,0.3)'; x.lineWidth = 0.18;
          for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(-w / 2 - 1, yy + 0.6 + i * 0.7); x.lineTo(w / 2 + 1, yy + 0.6 + i * 0.7); x.stroke(); }
        }
      }, { rim: 0.4 });
      const pickets = mkPart([-w / 2 - 1, -20, w / 2 + 1, 1], (x) => {
        for (let i = 0; i < n; i++) {
          const cx = -w / 2 + 3 + i * 6, h = 16 + r.range(-1.5, 1.5), lean = r.range(-0.4, 0.4);
          x.save(); x.translate(cx, 0); x.rotate(lean * 0.06);
          x.beginPath(); x.moveTo(-2.1, 0.5); x.lineTo(-2.1, -h + 2.4); x.lineTo(0, -h); x.lineTo(2.1, -h + 2.4); x.lineTo(2.1, 0.5); x.closePath();
          x.fillStyle = i % 2 ? C.card : '#cba574'; x.fill();
          x.save(); x.clip();
          x.strokeStyle = 'rgba(90,60,30,0.28)'; x.lineWidth = 0.2;
          for (let k = -2; k <= 2; k += 0.8) { x.beginPath(); x.moveTo(k, 1); x.lineTo(k, -h); x.stroke(); }
          x.fillStyle = 'rgba(40,20,10,0.12)'; x.fillRect(0.6, -h, 2, h + 1);
          x.restore();
          x.restore();
        }
      }, { rim: 0.45 });
      const tape = mkPart([-3, -2, 3, 2], (x) => { x.fillStyle = 'rgba(234,220,170,0.9)'; x.fillRect(-2.4, -1.3, 4.8, 2.6); }, { rim: 0, light: 0.05 });
      return propSprite(w + 8, 24, w / 2 + 4, 21, [
        { p: rails, x: 0, y: 0 }, { p: pickets, x: 0, y: 0 },
        { p: tape, x: -w / 2 + 6, y: -10, r: 0.5, sh: 0.15 }, { p: tape, x: w / 2 - 9, y: -4.5, r: -0.4, sh: 0.15 },
      ]);
    });
  }
  function buildHay() {
    PROPS.hay = [0, 1].map((v) => {
      const r = U.rng(1100 + v);
      const mound = mkPart([-15, -17, 15, 1], (x) => {
        x.beginPath(); x.moveTo(-13, 0.5); x.bezierCurveTo(-13, -10, -7, -15.5, 0, -15.5); x.bezierCurveTo(7, -15.5, 13, -10, 13, 0.5); x.closePath();
        x.fillStyle = v ? '#c9a24a' : '#d4b058'; x.fill();
        x.save(); x.clip();
        const cols = ['#e7c76a', '#b98a36', '#f2dd98', '#a07a30', '#d9b860', '#c2a37c'];
        x.lineCap = 'round';
        for (let i = 0; i < 140; i++) {
          const px = r.range(-14, 14), py = r.range(-16, 1), a = r.range(-0.9, 0.9) + (px > 0 ? 0.35 : -0.35), l = r.range(3, 7);
          x.strokeStyle = cols[i % cols.length]; x.lineWidth = r.range(0.35, 0.6);
          x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.sin(a) * l * 0.5 + r.range(-1, 1), py - Math.cos(a) * l * 0.5, px + Math.sin(a) * l, py - Math.cos(a) * l); x.stroke();
        }
        x.fillStyle = 'rgba(60,35,10,0.18)'; x.fillRect(2, -17, 14, 19);
        x.restore();
        x.lineCap = 'round';
        for (let i = 0; i < 16; i++) {
          const a = -Math.PI / 2 + r.range(-1.4, 1.4), rr = 13.5, px = Math.cos(a) * rr * 0.95, py = -7.6 + Math.sin(a) * 8.6, l = r.range(1.5, 3.4);
          x.strokeStyle = cols[i % cols.length]; x.lineWidth = 0.45;
          x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
        }
      }, { rim: 0.5 });
      return propSprite(36, 22, 18, 19, [{ p: mound, x: 0, y: 0 }]);
    });
  }
  function buildPinwheel() {
    const stick = mkPart([-1, -27, 1, 1], (x) => {
      x.fillStyle = '#f2e7cf'; x.fillRect(-0.55, -26, 1.1, 26.5);
      x.save(); x.beginPath(); x.rect(-0.55, -26, 1.1, 26.5); x.clip();
      x.strokeStyle = C.red; x.lineWidth = 0.7;
      for (let yy = -28; yy < 2; yy += 2.4) { x.beginPath(); x.moveTo(-1, yy); x.lineTo(1, yy + 1.4); x.stroke(); }
      x.restore();
    }, { rim: 0.3 });
    const spr = propSprite(10, 30, 5, 28, [{ p: stick, x: 0, y: 0 }]);
    PROPS.pinStick = spr;
    PROPS.wheels = [[C.teal, C.mustard, C.red, C.aubLight], [C.pumpkin, C.leaf, C.mustard, C.denim]].map((cols) => {
      const blade = (col, i) => mkPart([-1, -1, 9, 7], (x) => {
        x.beginPath(); x.moveTo(0, 0); x.lineTo(8, 0); x.quadraticCurveTo(7, 4.5, 0.6, 6.2); x.closePath();
        x.fillStyle = col; x.fill();
        x.beginPath(); x.moveTo(0, 0); x.lineTo(8, 0); x.lineTo(2.8, 2.2); x.closePath();
        x.fillStyle = 'rgba(255,250,235,0.32)'; x.fill();
        x.fillStyle = 'rgba(255,250,235,0.55)';
        for (let k = 0; k < 4; k++) { x.beginPath(); x.arc(2 + k * 1.3, 3 - k * 0.3, 0.35, 0, TAU); x.fill(); }
      }, { rim: 0.35 });
      const parts = cols.map(blade);
      const frame = composeFrame(24, 24, 12, 12, 1, parts.map((p, i) => ({ p, x: 0, y: 0, r: (i * Math.PI) / 2 })), { shx: 0.3, shy: 0.4 });
      return frame;
    });
  }

  function buildProps() {
    buildTrees(); buildPumpkins(); buildGraves(); buildFences(); buildHay(); buildPinwheel();
  }

  /* ======================= shared shapes ======================= */
  function turnipPath(x, w, h) {
    x.beginPath();
    x.moveTo(0, -h);
    x.bezierCurveTo(w * 0.68, -h, w * 1.05, -h * 0.7, w, -h * 0.4);
    x.bezierCurveTo(w * 0.95, -h * 0.15, w * 0.4, -h * 0.04, w * 0.04, h * 0.1);
    x.bezierCurveTo(-w * 0.4, -h * 0.04, -w * 0.95, -h * 0.15, -w, -h * 0.4);
    x.bezierCurveTo(-w * 1.05, -h * 0.7, -w * 0.68, -h, 0, -h);
    x.closePath();
  }
  /** jagged torn line across [x0,x1] at y (returns points) */
  function tornLine(r, x0, x1, y, step, amp, wave) {
    const pts = [];
    for (let px = x0; px <= x1 + 0.01; px += step) pts.push([px, y + r.range(-amp, amp) + Math.sin(px * 0.45) * (wave || 0)]);
    return pts;
  }
  /** fill the region above a torn line with a white paper core strip below it */
  function tornCap(x, pts, top, col, coreW) {
    const poly = (dy) => {
      x.beginPath();
      x.moveTo(pts[0][0], top);
      for (const p of pts) x.lineTo(p[0], p[1] + dy);
      x.lineTo(pts[pts.length - 1][0], top);
      x.closePath();
    };
    x.fillStyle = 'rgba(48,26,12,0.22)'; poly(coreW + 0.35); x.fill();
    x.fillStyle = C.rim; poly(coreW); x.fill();
    x.fillStyle = col; poly(0); x.fill();
  }
  /** cut-out hole showing glowing paper behind (cut thickness = dark inner edge at top-left) */
  function glowHole(x, path, gx, gy, gr, hot, mid, edge) {
    x.save();
    path(); x.clip();
    x.fillStyle = '#3a1408'; x.fillRect(gx - gr * 3, gy - gr * 3, gr * 6, gr * 6);
    x.translate(0.32, 0.45);
    const g = x.createRadialGradient(gx, gy, 0, gx, gy, gr * 1.5);
    g.addColorStop(0, hot); g.addColorStop(0.5, mid); g.addColorStop(1, edge);
    x.fillStyle = g;
    path(); x.fill();
    x.restore();
  }
  function tapeStrip(x, cx, cy, len, wid, ang, r) {
    x.save(); x.translate(cx, cy); x.rotate(ang);
    x.beginPath();
    x.moveTo(-len / 2, -wid / 2);
    for (let k = 0; k <= 4; k++) x.lineTo(len / 2 + (k % 2 ? 0.35 : 0), -wid / 2 + (k / 4) * wid);
    for (let k = 4; k >= 0; k--) x.lineTo(-len / 2 - (k % 2 ? 0.35 : 0), -wid / 2 + (k / 4) * wid);
    x.closePath();
    x.fillStyle = 'rgba(48,26,12,0.18)';
    x.save(); x.translate(0.2, 0.3); x.fill(); x.restore();
    x.fillStyle = 'rgba(236,222,172,0.88)'; x.fill();
    x.strokeStyle = 'rgba(150,130,80,0.25)'; x.lineWidth = 0.12;
    for (let k = 1; k < 4; k++) { x.beginPath(); x.moveTo(-len / 2, -wid / 2 + (k / 4) * wid + r.range(-0.1, 0.1)); x.lineTo(len / 2, -wid / 2 + (k / 4) * wid); x.stroke(); }
    x.restore();
  }
  function staple(x, cx, cy, ang, L) {
    L = L || 2.4;
    const dx = Math.cos(ang) * L / 2, dy = Math.sin(ang) * L / 2;
    x.lineCap = 'round';
    x.strokeStyle = 'rgba(40,25,12,0.4)'; x.lineWidth = 0.42;
    x.beginPath(); x.moveTo(cx - dx + 0.15, cy - dy + 0.22); x.lineTo(cx + dx + 0.15, cy + dy + 0.22); x.stroke();
    x.strokeStyle = '#b4b4b8'; x.lineWidth = 0.36;
    x.beginPath(); x.moveTo(cx - dx, cy - dy); x.lineTo(cx + dx, cy + dy); x.stroke();
    x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineWidth = 0.12;
    x.beginPath(); x.moveTo(cx - dx * 0.7, cy - dy * 0.7 - 0.08); x.lineTo(cx + dx * 0.7, cy + dy * 0.7 - 0.08); x.stroke();
  }
  /** vertical leaf part: pivot at the base, leaf grows towards -y */
  function leafUp(len, wid, col, type, rimW) {
    return mkPart([-wid, -len - 1.5, wid, 1.5], (x) => {
      x.rotate(-Math.PI / 2); x.translate(len / 2, 0);
      drawPaperLeaf(x, type || 0, len, wid, col);
    }, { rim: rimW === undefined ? 0.45 : rimW });
  }
  function mkSprite(frame, footX, footY, o) {
    const s = dropSprite(frame, footX, footY, o);
    s.flash = { img: U.tint(frame, '#fffaf0', 0.95), ax: footX * K, ay: footY * K };
    return s;
  }

  /* ======================= Jack ======================= */
  const SPR = {};
  function buildJack() {
    const r = U.rng(1200);
    const leg = (dark) => mkPart([-2.2, -0.8, 4, 7.6], (x) => {
      x.fillStyle = dark ? '#6f4c30' : '#8d6440';
      x.beginPath(); x.moveTo(-1.45, -0.2); x.lineTo(1.45, -0.2); x.lineTo(1.25, 4.9); x.lineTo(-1.35, 4.9); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(255,235,200,0.35)'; x.lineWidth = 0.18; x.setLineDash([0.5, 0.45]);
      x.beginPath(); x.moveTo(0.9, 0.2); x.lineTo(0.8, 4.5); x.stroke(); x.setLineDash([]);
      x.fillStyle = dark ? C.bootDark : C.boot;
      x.beginPath(); x.moveTo(-1.55, 4.4); x.lineTo(1.3, 4.4); x.quadraticCurveTo(3.5, 4.9, 3.4, 6.6); x.lineTo(-1.55, 6.6); x.closePath(); x.fill();
      x.fillStyle = 'rgba(255,240,210,0.28)'; x.fillRect(-1.55, 4.4, 2.85, 0.45);
    }, { rim: 0.45 });
    const legB = leg(true), legF = leg(false);
    const body = mkPart([-6, -10.6, 6.2, 3], (x) => {
      const path = () => {
        x.beginPath(); x.moveTo(-3.3, -9.5); x.lineTo(3.4, -9.5); x.quadraticCurveTo(4.7, -4, 5, 1.1);
        const n = 7;
        for (let i = 0; i <= n; i++) x.lineTo(5 - (10 * i) / n, 1.1 + (i % 2 ? 1.0 : 0));
        x.quadraticCurveTo(-4.7, -4, -3.3, -9.5); x.closePath();
      };
      path(); x.fillStyle = C.aub; x.fill();
      x.save(); path(); x.clip();
      // front panel (second paper layer) with its own tiny shadow
      x.fillStyle = 'rgba(30,10,30,0.25)';
      x.beginPath(); x.moveTo(0.9, -9.5); x.lineTo(3.9, -9.5); x.lineTo(5.6, 2.4); x.lineTo(1.6, 2.4); x.closePath(); x.fill();
      x.fillStyle = C.aubLight;
      x.beginPath(); x.moveTo(0.6, -9.6); x.lineTo(3.7, -9.6); x.lineTo(5.4, 2.4); x.lineTo(1.3, 2.4); x.closePath(); x.fill();
      // belt
      x.fillStyle = 'rgba(40,15,10,0.25)'; x.fillRect(-6, -2.2, 12, 1.9);
      x.fillStyle = C.kraftDark; x.fillRect(-6, -2.5, 12, 1.7);
      x.fillStyle = C.brass; x.fillRect(1.6, -2.75, 2.1, 2.2);
      x.fillStyle = C.kraftDark; x.fillRect(2.15, -2.2, 1.0, 1.1);
      // stitched hem line
      x.strokeStyle = 'rgba(250,236,210,0.7)'; x.lineWidth = 0.2; x.setLineDash([0.55, 0.45]);
      x.beginPath(); x.moveTo(-4.6, -0.2); x.lineTo(4.6, -0.2); x.stroke();
      x.beginPath(); x.moveTo(-2.6, -8.6); x.quadraticCurveTo(-3.9, -4, -4.2, -3); x.stroke();
      x.setLineDash([]);
      x.restore();
      // mustard buttons
      for (const by of [-7.4, -5]) {
        x.fillStyle = 'rgba(40,15,10,0.35)'; x.beginPath(); x.arc(2.75, by + 0.2, 0.62, 0, TAU); x.fill();
        x.fillStyle = C.mustard; x.beginPath(); x.arc(2.6, by, 0.6, 0, TAU); x.fill();
        x.fillStyle = C.mustardDark; x.beginPath(); x.arc(2.45, by - 0.1, 0.12, 0, TAU); x.arc(2.75, by + 0.1, 0.12, 0, TAU); x.fill();
      }
    });
    const arm = (dark) => mkPart([-2, -1.2, 2.2, 8.4], (x) => {
      x.fillStyle = dark ? C.aubDark : C.aub;
      x.beginPath(); x.moveTo(-1.25, -0.6); x.quadraticCurveTo(0, -1.2, 1.25, -0.6); x.lineTo(1.05, 5.4); x.lineTo(-1.05, 5.4); x.closePath(); x.fill();
      x.fillStyle = dark ? '#5f4a2c' : C.mustard;
      x.fillRect(-1.15, 4.5, 2.3, 1.0);
      x.fillStyle = dark ? '#c9b48c' : '#ecdcb8';
      x.beginPath(); x.ellipse(0.15, 6.6, 1.35, 1.45, 0, 0, TAU); x.fill();
      x.beginPath(); x.ellipse(1.2, 6.2, 0.55, 0.8, -0.5, 0, TAU); x.fill();
    }, { rim: 0.45 });
    const armB = arm(true), armF = arm(false);
    const head = mkPart([-10, -16.5, 10.5, 1.2], (x) => {
      const cy = -7.6;
      const lobes = [[0, 8.7, 7.5, C.pumpkinDeep], [-3.6, 5.2, 7.1, C.pumpkinDark], [3.9, 5.0, 7.15, C.pumpkin], [0.9, 4.6, 7.35, C.pumpkinLight]];
      for (const [ox, rx, ry, col] of lobes) {
        x.fillStyle = 'rgba(70,25,5,0.28)';
        x.beginPath(); x.ellipse(ox + 0.3, cy + 0.4, rx, ry, 0, 0, TAU); x.fill();
        x.fillStyle = col;
        x.beginPath(); x.ellipse(ox, cy, rx, ry, 0, 0, TAU); x.fill();
      }
      // pencil rib lines
      x.strokeStyle = 'rgba(120,45,10,0.28)'; x.lineWidth = 0.18;
      x.beginPath(); x.ellipse(-1.2, cy, 2.6, 6.6, 0, -1.2, 1.2); x.stroke();
      // face cut-outs, shifted towards the facing side (3/4 view)
      const fx = 1.7;
      const eyeL = () => { x.beginPath(); x.moveTo(fx - 4.9, cy - 0.1); x.lineTo(fx - 2.7, cy - 4.4); x.lineTo(fx - 0.6, cy - 0.2); x.closePath(); };
      const eyeR = () => { x.beginPath(); x.moveTo(fx + 0.6, cy - 0.2); x.lineTo(fx + 2.7, cy - 4.4); x.lineTo(fx + 4.8, cy - 0.1); x.closePath(); };
      const nose = () => { x.beginPath(); x.moveTo(fx - 0.7, cy + 1.3); x.lineTo(fx, cy + 0.1); x.lineTo(fx + 0.7, cy + 1.3); x.closePath(); };
      const mouth = () => {
        x.beginPath();
        x.moveTo(fx - 5, cy + 1.9);
        x.quadraticCurveTo(fx, cy + 3.4, fx + 5, cy + 1.9);
        x.lineTo(fx + 4.4, cy + 3.6);
        x.lineTo(fx + 3.1, cy + 3.1); x.lineTo(fx + 2.2, cy + 4.2); x.lineTo(fx + 1.1, cy + 3.5);
        x.lineTo(fx - 0.6, cy + 5.3); x.lineTo(fx - 1.6, cy + 4.0); x.lineTo(fx - 2.9, cy + 4.5); x.lineTo(fx - 3.8, cy + 3.4);
        x.lineTo(fx - 4.6, cy + 3.5);
        x.closePath();
      };
      for (const p of [eyeL, eyeR, nose, mouth]) glowHole(x, p, fx, cy + 0.5, 6.5, '#fffbe0', '#ffe066', '#ffa21e');
    });
    const stem = mkPart([-3, -6, 6, 1.4], (x) => {
      x.fillStyle = '#5f6e30';
      x.beginPath(); x.moveTo(-1.1, 0.8); x.lineTo(-0.7, -3.4); x.quadraticCurveTo(0.5, -5, 2, -4.2); x.lineTo(1.2, 0.8); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(255,240,200,0.35)'; x.lineWidth = 0.2;
      x.beginPath(); x.moveTo(0.1, 0.4); x.lineTo(0.2, -3.6); x.stroke();
      x.strokeStyle = '#7c9a40'; x.lineWidth = 0.4;
      x.beginPath(); x.moveTo(1.2, -1.6); x.bezierCurveTo(3.6, -1.8, 4.6, -4.2, 3.2, -4.6); x.bezierCurveTo(2.3, -4.8, 2.2, -3.6, 3.0, -3.4); x.stroke();
    }, { rim: 0.4 });
    const scarfCols = [C.leaf, C.leafDark];
    const wrap = mkPart([-5.6, -2, 6.2, 2.8], (x) => {
      x.beginPath(); x.moveTo(-4.8, -0.9); x.quadraticCurveTo(0, 0.2, 5, -1); x.lineTo(5.3, 1.4); x.quadraticCurveTo(0, 2.6, -4.9, 1.2); x.closePath();
      x.fillStyle = C.leaf; x.fill();
      x.save(); x.clip();
      x.fillStyle = C.leafDark;
      for (let k = -6; k < 7; k += 2.4) { x.beginPath(); x.moveTo(k, -2); x.lineTo(k + 1, -2); x.lineTo(k + 2.4, 3); x.lineTo(k + 1.4, 3); x.closePath(); x.fill(); }
      x.restore();
      // knot
      x.fillStyle = 'rgba(30,50,10,0.3)'; x.beginPath(); x.ellipse(3.6, 0.9, 1.4, 1.2, 0, 0, TAU); x.fill();
      x.fillStyle = C.leafLight; x.beginPath(); x.ellipse(3.4, 0.6, 1.35, 1.15, 0, 0, TAU); x.fill();
    }, { rim: 0.45 });
    const tail = mkPart([-11, -2.4, 1.5, 3.6], (x) => {
      x.beginPath(); x.moveTo(0.6, -1.1); x.quadraticCurveTo(-4.5, -1.6, -8.6, 0.1); x.lineTo(-8.4, 2.5); x.quadraticCurveTo(-4.4, 1.2, 0.6, 1.3); x.closePath();
      x.fillStyle = scarfCols[0]; x.fill();
      x.save(); x.clip();
      x.fillStyle = scarfCols[1];
      for (let k = -9; k < 1; k += 2.4) { x.beginPath(); x.moveTo(k, -2.5); x.lineTo(k + 1, -2.5); x.lineTo(k + 1.6, 3); x.lineTo(k + 0.6, 3); x.closePath(); x.fill(); }
      x.restore();
      x.strokeStyle = C.leaf; x.lineWidth = 0.35;
      for (let k = 0; k < 5; k++) { const yy = 0.15 + k * 0.55; x.beginPath(); x.moveTo(-8.5, yy); x.lineTo(-10 + r.range(-0.3, 0.3), yy + 0.25); x.stroke(); }
    }, { rim: 0.4 });

    const frame = (fc, ph, mode) => {
      // mode 0 walk, 1 idle, 2 walk+throw
      const walk = mode !== 1;
      const s = Math.sin(ph);
      const legA = walk ? s * 0.55 : 0;
      const armA = walk ? s * 0.55 : Math.sin(ph) * 0.06;
      const hip = -6.6 + (1 - Math.cos(legA)) * 6.6 - (walk ? Math.abs(Math.cos(ph)) * 0.45 : (Math.sin(ph) * 0.5 + 0.5) * 0.45);
      const lean = walk ? 0.07 : 0;
      const sh = hip - 8.9, neck = hip - 9.6;
      const tilt = walk ? Math.sin(ph * 2) * 0.06 : Math.sin(ph) * 0.03;
      const tailA = walk ? -0.25 + Math.sin(ph * 2) * 0.18 : 0.35 + Math.sin(ph) * 0.1;
      const throwing = mode === 2;
      return mkSprite(composeFrame(34, 42, 17, 38, fc, [
        { p: legB, x: -0.9, y: hip, r: legA },
        { p: armB, x: -2.4 + lean * 9, y: sh + 0.4, r: armA * 0.9 },
        { p: tail, x: -0.6 + lean * 10, y: neck + 0.9, r: tailA },
        { p: legF, x: 0.9, y: hip, r: -legA },
        { p: body, x: 0, y: hip, r: lean },
        { p: armF, x: 2.6 + lean * 9, y: sh + 0.4, r: throwing ? -2.15 : -armA, pin: [0, 0, 0.5] },
        { p: stem, x: 0.6 + lean * 10, y: neck - 14.6, r: tilt * 2 + 0.05 },
        { p: head, x: 0.4 + lean * 10, y: neck, r: tilt },
        { p: wrap, x: 0.4 + lean * 10, y: neck + 0.1, r: tilt * 0.5 },
      ]), 17, 38);
    };
    SPR.jack = [1, -1].map((fc) => ({
      walk: Array.from({ length: 8 }, (_, i) => frame(fc, (i / 8) * TAU, 0)),
      throw: Array.from({ length: 8 }, (_, i) => frame(fc, (i / 8) * TAU, 2)),
      idle: Array.from({ length: 4 }, (_, i) => frame(fc, (i / 4) * TAU, 1)),
    }));
  }

  /* ======================= Rüben-Schleicher ======================= */
  function buildCreeper() {
    const variants = [[C.aub, C.aubLight, '#efe2b8', '#dcc68a'], ['#843a63', '#b4618c', '#f1e4bf', '#e2cd90']];
    SPR.creeper = variants.map((pal, v) => {
      const r = U.rng(1300 + v);
      const W = 7.4, H = 15.2;
      const bulb = mkPart([-W - 1.5, -H - 1.5, W + 1.5, 3], (x) => {
        turnipPath(x, W, H);
        const g = x.createLinearGradient(0, -H, 0, 1);
        g.addColorStop(0, pal[2]); g.addColorStop(1, pal[3]);
        x.fillStyle = g; x.fill();
        x.save(); turnipPath(x, W, H); x.clip();
        const pts = tornLine(r, -W - 1, W + 1, -H * 0.6, 1.1, 0.45, 0.5);
        tornCap(x, pts, -H - 2, pal[0], 0.55);
        // lighter brush streaks on the cap
        x.strokeStyle = rgba(pal[1], 0.5); x.lineWidth = 0.5;
        for (let i = 0; i < 4; i++) { const yy = -H + 2 + i * 1.3; x.beginPath(); x.moveTo(-W * 0.6 + i, yy); x.quadraticCurveTo(-1, yy - 0.8, W * 0.3 - i * 0.6, yy - 0.2); x.stroke(); }
        // growth rings + root hairs (pencil)
        x.strokeStyle = 'rgba(120,90,50,0.35)'; x.lineWidth = 0.18;
        for (const yy of [-4.4, -2.6]) { x.beginPath(); x.moveTo(-W * 0.7, yy); x.quadraticCurveTo(0, yy + 1.1, W * 0.7, yy); x.stroke(); }
        x.restore();
        x.strokeStyle = 'rgba(150,120,70,0.7)'; x.lineWidth = 0.22;
        for (const [hx, hy, dx] of [[-4.2, -2.6, -1.4], [4.4, -2.8, 1.3], [-2.2, -0.9, -1.0]]) { x.beginPath(); x.moveTo(hx, hy); x.lineTo(hx + dx, hy + 0.7); x.stroke(); }
        // angry face (towards facing side)
        const fx = 1.9, ey = -H * 0.46;
        const eye = (cx, flip) => () => { x.beginPath(); x.moveTo(cx - 1.5 * flip, ey - 0.9); x.quadraticCurveTo(cx, ey + 1.6, cx + 1.5 * flip, ey - 0.1); x.closePath(); };
        glowHole(x, eye(fx - 2.4, 1), fx - 2.4, ey, 2, '#fff2a0', '#ffb02e', '#e0561c');
        glowHole(x, eye(fx + 2.4, -1), fx + 2.4, ey, 2, '#fff2a0', '#ffb02e', '#e0561c');
        x.fillStyle = '#2a1424';
        x.beginPath(); x.ellipse(fx - 2.1, ey + 0.1, 0.32, 0.6, 0, 0, TAU); x.ellipse(fx + 2.1, ey + 0.1, 0.32, 0.6, 0, 0, TAU); x.fill();
        // brows: aubergine paper strips
        x.fillStyle = 'rgba(30,10,25,0.35)';
        x.save(); x.translate(0.2, 0.3);
        x.beginPath(); x.moveTo(fx - 4.3, ey - 2.3); x.lineTo(fx - 0.6, ey - 0.9); x.lineTo(fx - 0.7, ey - 0.1); x.lineTo(fx - 4.4, ey - 1.5); x.closePath(); x.fill();
        x.beginPath(); x.moveTo(fx + 4.3, ey - 2.3); x.lineTo(fx + 0.6, ey - 0.9); x.lineTo(fx + 0.7, ey - 0.1); x.lineTo(fx + 4.4, ey - 1.5); x.closePath(); x.fill();
        x.restore();
        x.fillStyle = C.aubDeep;
        x.beginPath(); x.moveTo(fx - 4.3, ey - 2.3); x.lineTo(fx - 0.6, ey - 0.9); x.lineTo(fx - 0.7, ey - 0.1); x.lineTo(fx - 4.4, ey - 1.5); x.closePath(); x.fill();
        x.beginPath(); x.moveTo(fx + 4.3, ey - 2.3); x.lineTo(fx + 0.6, ey - 0.9); x.lineTo(fx + 0.7, ey - 0.1); x.lineTo(fx + 4.4, ey - 1.5); x.closePath(); x.fill();
        // jagged frown
        x.fillStyle = '#3a1830';
        x.beginPath(); x.moveTo(fx - 2.2, ey + 3.4); x.lineTo(fx - 1.1, ey + 2.6); x.lineTo(fx, ey + 3.1); x.lineTo(fx + 1.1, ey + 2.6); x.lineTo(fx + 2.2, ey + 3.4);
        x.lineTo(fx + 1.1, ey + 3.2); x.lineTo(fx, ey + 3.6); x.lineTo(fx - 1.1, ey + 3.2); x.closePath(); x.fill();
      });
      const root = (dark) => mkPart([-1.6, -0.6, 2.4, 6], (x) => {
        x.beginPath(); x.moveTo(-0.85, 0); x.quadraticCurveTo(-0.7, 3, 0.2, 4.6); x.quadraticCurveTo(1.4, 5.4, 1.9, 4.6);
        x.quadraticCurveTo(1.1, 4.6, 0.75, 3.6); x.quadraticCurveTo(0.6, 2, 0.85, 0); x.closePath();
        x.fillStyle = dark ? '#b9a173' : '#d8c194'; x.fill();
        x.strokeStyle = 'rgba(110,80,40,0.4)'; x.lineWidth = 0.15;
        x.beginPath(); x.moveTo(-0.5, 1.4); x.lineTo(0.4, 1.6); x.moveTo(-0.4, 2.7); x.lineTo(0.5, 2.9); x.stroke();
      }, { rim: 0.4 });
      const rootB = root(true), rootF = root(false);
      const armP = mkPart([-1, -0.8, 4.4, 3.6], (x) => {
        x.beginPath(); x.moveTo(0, -0.45); x.quadraticCurveTo(2.2, -0.3, 3.4, 1.2); x.lineTo(3.9, 0.8); x.lineTo(3.6, 2.1); x.lineTo(2.7, 1.9);
        x.quadraticCurveTo(1.8, 0.6, 0, 0.5); x.closePath();
        x.fillStyle = '#cfb889'; x.fill();
      }, { rim: 0.35 });
      const leaves = [leafUp(9, 4.2, C.leaf, 0), leafUp(10.5, 4.6, C.leafDark, 2), leafUp(8, 3.8, C.leafLight, 0)];
      const frame = (fc, ph) => {
        const s = Math.sin(ph);
        const wob = s * 0.12, bob = -Math.abs(Math.cos(ph)) * 0.9;
        const by = -4.2 + bob;
        const cx = Math.sin(wob) * H, cy = by - Math.cos(wob) * H;
        const sway = Math.sin(ph * 2 + 0.6) * 0.12;
        return mkSprite(composeFrame(30, 36, 15, 32, fc, [
          { p: rootB, x: -1.8, y: by + 0.2, r: s * 0.5 },
          { p: armP, x: -W + 0.4 + Math.sin(wob) * 6, y: by - 7, r: Math.PI - 0.4 - s * 0.3, sh: 0.25 },
          { p: leaves[1], x: cx - 0.6, y: cy + 0.8, r: -0.55 + sway + wob },
          { p: leaves[2], x: cx + 0.6, y: cy + 0.8, r: 0.6 + sway + wob },
          { p: rootF, x: 1.8, y: by + 0.2, r: -s * 0.5 },
          { p: bulb, x: 0, y: by, r: wob },
          { p: leaves[0], x: cx, y: cy + 1.2, r: 0.05 + sway * 1.4 + wob, pin: [0, 0, 0.5] },
          { p: armP, x: W - 0.6 + Math.sin(wob) * 6, y: by - 6.4, r: 0.35 + s * 0.35, pin: [0.3, 0, 0.42] },
        ]), 15, 32);
      };
      return [1, -1].map((fc) => Array.from({ length: 6 }, (_, i) => frame(fc, (i / 6) * TAU)));
    });
  }

  /* ======================= Hungergeist (tissue paper) ======================= */
  function ghostShape(x, R, cy, w, lean) {
    x.beginPath();
    x.moveTo(-R, cy);
    x.arc(0, cy, R, Math.PI, 0);
    x.bezierCurveTo(R + 0.3, cy + 5, R + 1.1 + lean * 0.4, cy + 8, R + 0.4 + lean + Math.sin(w) * 0.6, cy + 12.5);
    const tips = 4;
    for (let i = 0; i < tips; i++) {
      const t = 1 - (2 * (i + 0.5)) / tips;
      const tx = R * t * 0.95 + lean + Math.sin(w + i * 1.3) * 0.9;
      const ty = cy + 14.2 + (i % 2) * 1.3 + Math.sin(w * 1.3 + i) * 0.8;
      x.lineTo(tx, ty);
      if (i < tips - 1) x.lineTo(R * (1 - (2 * (i + 1)) / tips) * 0.9 + lean * 0.8, cy + 10.2 + Math.cos(w + i) * 0.5);
    }
    x.lineTo(-R - 0.4 + lean + Math.sin(w + 2) * 0.6, cy + 12.5);
    x.bezierCurveTo(-R - 1.1 + lean * 0.4, cy + 8, -R - 0.3, cy + 5, -R, cy);
    x.closePath();
  }
  function buildGhost() {
    const r = U.rng(1400);
    const frame = (fc, ph) => {
      const part = mkPart([-12, -27, 13, 2], (x) => {
        // back sheet: bluish tissue
        ghostShape(x, 7.2, -17.5, ph, -1.2);
        x.fillStyle = 'rgba(188,212,232,0.62)'; x.fill();
        // reaching arms (tissue strips)
        for (const [ay, al, aa] of [[-12.6, 0.5, 0.0], [-11.2, 0.8, 0.3]]) {
          x.beginPath(); x.moveTo(3, ay - 0.9);
          x.quadraticCurveTo(7, ay - 1.6 + Math.sin(ph + aa) * 0.6, 10.6, ay - 0.6 + Math.sin(ph + aa) * 0.9);
          x.lineTo(11.6, ay - 1.0 + Math.sin(ph + aa) * 0.9); x.lineTo(11.2, ay + 0.1 + Math.sin(ph + aa) * 0.9); x.lineTo(11.8, ay + 0.8 + Math.sin(ph + aa) * 0.9);
          x.lineTo(10.4, ay + 0.9 + Math.sin(ph + aa) * 0.9);
          x.quadraticCurveTo(7, ay + 0.6, 3, ay + 1.1); x.closePath();
          x.fillStyle = 'rgba(232,240,248,' + al + ')'; x.fill();
        }
        // front sheet: whiter, smaller
        x.save(); x.translate(0.6, 0.4); x.scale(0.86, 0.9);
        ghostShape(x, 7.2, -18.5, ph + 1.7, -0.8);
        x.fillStyle = 'rgba(248,251,253,0.72)'; x.fill();
        x.restore();
        // crinkles
        x.lineCap = 'round';
        for (let i = 0; i < 9; i++) {
          const px = r.range(-5, 5), py = r.range(-22, -6), a = r.range(-1, 1) + 1.57, l = r.range(1.2, 3);
          x.strokeStyle = r.chance(0.5) ? 'rgba(255,255,255,0.7)' : 'rgba(120,140,170,0.28)'; x.lineWidth = 0.2;
          x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
        }
        // hollow eyes + gaping mouth
        const fx = 1.8;
        x.fillStyle = 'rgba(43,36,64,0.88)';
        x.beginPath(); x.ellipse(fx - 2.4, -18.6, 1.35, 2.05, 0.25, 0, TAU); x.fill();
        x.beginPath(); x.ellipse(fx + 2.3, -18.6, 1.35, 2.05, -0.25, 0, TAU); x.fill();
        x.fillStyle = 'rgba(160,190,230,0.75)';
        x.beginPath(); x.arc(fx - 2.1, -19.3, 0.36, 0, TAU); x.arc(fx + 2.6, -19.3, 0.36, 0, TAU); x.fill();
        x.fillStyle = 'rgba(43,36,64,0.85)';
        x.beginPath(); x.ellipse(fx + 0.1, -13.4, 1.45, 2.5 + Math.sin(ph) * 0.3, 0, 0, TAU); x.fill();
        x.fillStyle = 'rgba(110,80,130,0.6)';
        x.beginPath(); x.ellipse(fx + 0.2, -12.6, 0.8, 1.2, 0, 0, TAU); x.fill();
        // frost sequins
        for (let i = 0; i < 4; i++) {
          const px = r.range(-5, 5), py = r.range(-21, -8);
          x.fillStyle = 'rgba(255,255,255,0.95)'; x.beginPath(); x.arc(px, py, 0.32, 0, TAU); x.fill();
        }
      }, { rim: 0.35, rimColor: 'rgba(255,255,255,0.75)', grain: 0.7, light: 0.06, shBlur: 0.5 });
      return mkSprite(composeFrame(30, 32, 15, 29, fc, [{ p: part, x: 0, y: 0, sh: 0.18 }]), 15, 29, { alpha: 0 });
    };
    SPR.ghost = [1, -1].map((fc) => Array.from({ length: 6 }, (_, i) => frame(fc, (i / 6) * TAU)));
  }

  /* ======================= Steckrüben-Koloss (cardboard golem) ======================= */
  function buildColossus() {
    const r = U.rng(1500);
    const W = 17, H = 32;
    const bulb = mkPart([-W - 2, -H - 2, W + 2, 5], (x) => {
      turnipPath(x, W, H);
      x.fillStyle = C.card; x.fill();
      x.save(); turnipPath(x, W, H); x.clip();
      // cream painted lower half with brush streaks
      x.fillStyle = '#e9d9ae'; x.fillRect(-W - 2, -H * 0.5, W * 2 + 4, H);
      x.strokeStyle = 'rgba(200,170,110,0.45)'; x.lineWidth = 0.6;
      for (let i = 0; i < 14; i++) { const yy = r.range(-H * 0.45, 2), xx = r.range(-W, W * 0.6); x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx + r.range(3, 8), yy + r.range(-0.4, 0.4)); x.stroke(); }
      // exposed corrugated band (torn top liner)
      const a = tornLine(r, -W - 2, W + 2, -H * 0.46, 1.3, 0.7, 0.8);
      const b = a.map((p) => [p[0], p[1] + 2.6 + r.range(-0.4, 0.5)]);
      x.beginPath(); x.moveTo(a[0][0], a[0][1]);
      for (const p of a) x.lineTo(p[0], p[1]);
      for (let i = b.length - 1; i >= 0; i--) x.lineTo(b[i][0], b[i][1]);
      x.closePath();
      x.fillStyle = C.cardLight; x.fill();
      x.save(); x.clip();
      x.strokeStyle = 'rgba(110,75,40,0.55)'; x.lineWidth = 0.32;
      for (let px = -W - 2; px < W + 2; px += 0.95) { x.beginPath(); x.moveTo(px, -H * 0.52); x.lineTo(px, -H * 0.3); x.stroke(); }
      x.restore();
      // cream torn edge under the band
      x.strokeStyle = C.rim; x.lineWidth = 0.5;
      x.beginPath(); b.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.stroke();
      // aubergine painted top
      tornCap(x, a, -H - 3, C.aub, 0.5);
      x.strokeStyle = rgba(C.aubLight, 0.55); x.lineWidth = 0.8;
      for (let i = 0; i < 9; i++) { const yy = r.range(-H + 1, -H * 0.55), xx = r.range(-W * 0.8, W * 0.3); x.beginPath(); x.moveTo(xx, yy); x.quadraticCurveTo(xx + 3, yy - 0.8, xx + r.range(5, 9), yy - 0.2); x.stroke(); }
      // crack (pencil) patched with tape + staples
      x.strokeStyle = 'rgba(50,25,20,0.65)'; x.lineWidth = 0.35;
      x.beginPath(); x.moveTo(-9, -H * 0.8); x.lineTo(-7.6, -H * 0.66); x.lineTo(-9.4, -H * 0.55); x.lineTo(-7.2, -H * 0.42); x.lineTo(-8.6, -H * 0.3); x.stroke();
      x.restore();
      tapeStrip(x, -8.3, -H * 0.62, 9, 2.6, 0.5, r);
      tapeStrip(x, -8.0, -H * 0.36, 7.5, 2.4, -0.35, r);
      staple(x, 10.5, -H * 0.5, 1.2); staple(x, 12, -H * 0.47, 1.35);
      staple(x, -3, -H * 0.12, 0.2); staple(x, 6, -H * 0.85, -0.3);
      // glowing core (jagged hole)
      const ccx = 2.2, ccy = -H * 0.33;
      const core = () => {
        x.beginPath();
        for (let i = 0; i < 11; i++) { const ang = (i / 11) * TAU, rr = i % 2 ? 2.6 : 4.4; const px = ccx + Math.cos(ang) * rr, py = ccy + Math.sin(ang) * rr * 0.92; if (i) x.lineTo(px, py); else x.moveTo(px, py); }
        x.closePath();
      };
      glowHole(x, core, ccx, ccy, 4.6, '#fff6c8', '#ffb53a', '#d8461a');
      // eyes: slanted glowing slits + heavy brow
      const ey = -H * 0.66, fx = 3.6;
      const eye = (cx, d) => () => { x.beginPath(); x.moveTo(cx - 2.6 * d, ey - 1.2); x.lineTo(cx + 2.4 * d, ey + 0.2); x.lineTo(cx + 1.6 * d, ey + 1.5); x.lineTo(cx - 2.2 * d, ey + 0.8); x.closePath(); };
      glowHole(x, eye(fx - 4.4, 1), fx - 4.4, ey, 3, '#fff6c0', '#ffc23a', '#e0661c');
      glowHole(x, eye(fx + 4.4, -1), fx + 4.4, ey, 3, '#fff6c0', '#ffc23a', '#e0661c');
      x.fillStyle = 'rgba(20,5,20,0.35)';
      x.beginPath(); x.moveTo(fx - 8.4, ey - 3.6); x.lineTo(fx + 8.4, ey - 3.6); x.lineTo(fx + 7.6, ey - 1.4); x.lineTo(fx, ey - 0.4); x.lineTo(fx - 7.6, ey - 1.4); x.closePath();
      x.save(); x.translate(0.3, 0.45); x.fill(); x.restore();
      x.fillStyle = C.aubDeep; x.fill();
      // mouth: dark cut
      x.fillStyle = '#2a1020';
      x.beginPath(); x.moveTo(fx - 4.5, ey + 5); x.lineTo(fx - 2.6, ey + 4.1); x.lineTo(fx - 1, ey + 5.1); x.lineTo(fx + 0.8, ey + 4.1); x.lineTo(fx + 2.6, ey + 5.1); x.lineTo(fx + 4.4, ey + 4.3);
      x.lineTo(fx + 3.6, ey + 6); x.lineTo(fx - 3.8, ey + 6.1); x.closePath(); x.fill();
    }, { rim: 0.6 });
    const leg = (dark) => mkPart([-4.4, -1, 6.4, 11.4], (x) => {
      const g = x.createLinearGradient(-3.2, 0, 3.2, 0);
      g.addColorStop(0, dark ? '#a88456' : C.cardLight); g.addColorStop(1, dark ? '#7a5a38' : C.cardDark);
      x.fillStyle = g; x.fillRect(-3.1, -0.5, 6.2, 9);
      x.strokeStyle = 'rgba(90,60,30,0.35)'; x.lineWidth = 0.22;
      for (let yy = 1.2; yy < 8.5; yy += 1.8) { x.beginPath(); x.moveTo(-3.1, yy); x.lineTo(3.1, yy + 0.5); x.stroke(); }
      x.fillStyle = dark ? '#5a3f28' : C.kraftDark;
      x.beginPath(); x.moveTo(-3.6, 8.1); x.lineTo(4.4, 8.1); x.quadraticCurveTo(6.3, 8.6, 6, 10.4); x.lineTo(-3.6, 10.4); x.closePath(); x.fill();
    }, { rim: 0.5 });
    const legB = leg(true), legF = leg(false);
    const arm = (dark) => mkPart([-4.4, -2.6, 5.2, 17], (x) => {
      const g = x.createLinearGradient(-3, 0, 3, 0);
      g.addColorStop(0, dark ? '#9c7a50' : C.cardLight); g.addColorStop(0.6, dark ? '#86653f' : C.card); g.addColorStop(1, dark ? '#6c4f30' : C.cardDark);
      x.fillStyle = g;
      x.beginPath(); x.moveTo(-2.9, 0); x.lineTo(2.9, 0); x.lineTo(2.5, 11); x.lineTo(-2.5, 11); x.closePath(); x.fill();
      x.fillStyle = dark ? '#c8ae80' : '#e2c99a';
      x.beginPath(); x.ellipse(0, 0, 2.9, 1.2, 0, 0, TAU); x.fill();
      x.strokeStyle = 'rgba(110,75,40,0.6)'; x.lineWidth = 0.2;
      x.beginPath(); x.ellipse(0, 0, 1.9, 0.75, 0, 0, TAU); x.stroke();
      x.beginPath(); x.ellipse(0, 0, 0.9, 0.35, 0, 0, TAU); x.stroke();
      tapeStrip(x, 0, 6, 6.8, 2.2, 0.08, r);
      // root fingers
      x.strokeStyle = dark ? '#a98e62' : '#cdb487'; x.lineWidth = 1.2; x.lineCap = 'round';
      for (const [dx, cx2, ey] of [[-1.8, -3.2, 15], [0, 0.6, 16.2], [1.8, 3.6, 14.6]]) { x.beginPath(); x.moveTo(dx, 10.6); x.quadraticCurveTo(cx2, 13, dx * 1.4 + 0.6, ey); x.stroke(); }
    }, { rim: 0.5 });
    const armB = arm(true), armF = arm(false);
    const leaves = [leafUp(13, 6, C.leafDark, 0, 0.55), leafUp(15, 6.4, C.moss, 2, 0.55), leafUp(12, 5.4, C.leaf, 0, 0.55), leafUp(10, 4.6, C.olive, 0, 0.55)];
    const frame = (fc, ph) => {
      const s = Math.sin(ph);
      const bob = -Math.abs(Math.cos(ph)) * 1.4;
      const hip = -9.6 + bob;
      const tilt = s * 0.05;
      const cx = Math.sin(tilt) * H, cy = hip - Math.cos(tilt) * H;
      return mkSprite(composeFrame(64, 68, 32, 63, fc, [
        { p: legB, x: -5.6, y: hip - 1, r: s * 0.32 },
        { p: armB, x: -W + 2.2 + cx * 0.6, y: hip - H * 0.72, r: -s * 0.3 + 0.12 },
        { p: leaves[1], x: cx - 3, y: cy + 1.6, r: -0.6 + tilt + s * 0.05 },
        { p: leaves[3], x: cx + 3.4, y: cy + 1.8, r: 0.75 + tilt },
        { p: legF, x: 5.6, y: hip - 1, r: -s * 0.32 },
        { p: bulb, x: 0, y: hip, r: tilt },
        { p: leaves[0], x: cx - 0.8, y: cy + 2.2, r: -0.18 + tilt - s * 0.04 },
        { p: leaves[2], x: cx + 1.2, y: cy + 2.4, r: 0.32 + tilt + s * 0.05, pin: [0, -0.5, 0.7] },
        { p: armF, x: W - 2.2 + cx * 0.6, y: hip - H * 0.72, r: s * 0.3 - 0.12, pin: [0, 0.2, 0.8] },
      ]), 32, 63, { dx: 1.4, dy: 1.7, blur: 1.0 });
    };
    SPR.colossus = [1, -1].map((fc) => Array.from({ length: 6 }, (_, i) => frame(fc, (i / 6) * TAU)));
  }

  /* ======================= small sprites ======================= */
  function radial(size, stops) {
    const c = cv(size, size), x = g2(c), g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    for (const [o, col] of stops) g.addColorStop(o, col);
    x.fillStyle = g; x.fillRect(0, 0, size, size);
    return c;
  }
  function buildSmall() {
    SPR.glow = radial(96, [[0, 'rgba(255,214,110,0.95)'], [0.25, 'rgba(255,170,60,0.45)'], [0.6, 'rgba(240,110,30,0.12)'], [1, 'rgba(240,110,30,0)']]);
    SPR.blob = radial(64, [[0, 'rgba(48,26,12,0.62)'], [0.55, 'rgba(48,26,12,0.36)'], [1, 'rgba(48,26,12,0)']]);
    // pumpkin seed
    SPR.seed = mkPart([-4, -3, 4.6, 3], (x) => {
      const path = () => { x.beginPath(); x.moveTo(-3, 0); x.bezierCurveTo(-3, -2.3, 2, -2.2, 3.5, 0); x.bezierCurveTo(2, 2.2, -3, 2.3, -3, 0); x.closePath(); };
      path(); x.fillStyle = '#f4e8c6'; x.fill();
      x.save(); path(); x.clip();
      x.fillStyle = 'rgba(160,120,60,0.28)';
      x.beginPath(); x.ellipse(0.4, 0.9, 3.6, 1.5, 0, 0, TAU); x.fill();
      x.fillStyle = 'rgba(255,255,245,0.8)';
      x.beginPath(); x.ellipse(-0.4, -0.6, 2.2, 0.7, -0.05, 0, TAU); x.fill();
      x.restore();
      x.strokeStyle = '#c9ab70'; x.lineWidth = 0.32;
      x.beginPath(); x.moveTo(-2.4, 0); x.bezierCurveTo(-2.2, -1.6, 1.6, -1.6, 2.8, 0); x.bezierCurveTo(1.6, 1.6, -2.2, 1.6, -2.4, 0); x.stroke();
    }, { rim: 0.35, rimColor: '#8a5a24', light: 0.06 });
    // turnip lantern (vellum)
    SPR.lantern = mkPart([-7, -15.5, 7, 3], (x) => {
      x.strokeStyle = '#6a4a30'; x.lineWidth = 0.35;
      x.beginPath(); x.moveTo(-1.6, -10); x.quadraticCurveTo(0, -15, 1.6, -10); x.stroke();
      turnipPath(x, 5.6, 10.4);
      const g = x.createRadialGradient(0.5, -4, 0.5, 0, -4.5, 7);
      g.addColorStop(0, '#fff3c4'); g.addColorStop(0.55, '#f5d690'); g.addColorStop(1, '#c9a0c8');
      x.fillStyle = g; x.fill();
      x.save(); turnipPath(x, 5.6, 10.4); x.clip();
      const pts = tornLine(U.rng(77), -7, 7, -7.2, 0.9, 0.35, 0.3);
      tornCap(x, pts, -12, 'rgba(150,90,160,0.85)', 0.4);
      x.restore();
      const fx = 0.6, ey = -5;
      const eye = (cx) => () => { x.beginPath(); x.moveTo(cx - 1.1, ey + 0.6); x.lineTo(cx, ey - 1.1); x.lineTo(cx + 1.1, ey + 0.6); x.closePath(); };
      const mouth = () => { x.beginPath(); x.moveTo(fx - 2.4, ey + 2); x.lineTo(fx - 1.2, ey + 2.8); x.lineTo(fx, ey + 2.2); x.lineTo(fx + 1.2, ey + 2.8); x.lineTo(fx + 2.4, ey + 2); x.lineTo(fx + 1.6, ey + 3.8); x.lineTo(fx - 1.6, ey + 3.8); x.closePath(); };
      for (const p of [eye(fx - 1.6), eye(fx + 1.6), mouth]) glowHole(x, p, fx, ey + 1, 4, '#fffbe0', '#ffd75a', '#ff9a2a');
      x.save(); x.translate(-1.2, -10.4); x.rotate(-0.9); x.translate(2.2, 0); drawPaperLeaf(x, 0, 4.4, 2.4, C.leaf); x.restore();
      x.save(); x.translate(1, -10.4); x.rotate(-2.3); x.translate(2, 0); drawPaperLeaf(x, 0, 4, 2.2, C.leafDark); x.restore();
    }, { rim: 0.4, light: 0.05 });
    // origami foil gems
    const gem = (scale, cols) => mkPart([-3.2 * scale, -4.2 * scale, 3.2 * scale, 4.2 * scale], (x) => {
      const w = 2.4 * scale, h = 3.4 * scale;
      const tri = (a, b, c, col) => { x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.lineTo(c[0], c[1]); x.closePath(); x.fillStyle = col; x.fill(); };
      const T = [0, -h], R = [w, -h * 0.12], B = [0, h], L = [-w, -h * 0.12], M = [w * 0.1, -h * 0.05];
      tri(T, L, M, cols[0]); tri(T, M, R, cols[1]); tri(L, B, M, cols[2]); tri(M, B, R, cols[3]);
      x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = 0.18;
      x.beginPath(); x.moveTo(T[0], T[1]); x.lineTo(M[0], M[1]); x.lineTo(B[0], B[1]); x.stroke();
      x.fillStyle = 'rgba(255,255,255,0.75)';
      x.beginPath(); x.moveTo(-w * 0.55, -h * 0.25); x.lineTo(-w * 0.15, -h * 0.72); x.lineTo(-w * 0.05, -h * 0.55); x.closePath(); x.fill();
    }, { rim: 0.35, grain: 0.4, light: 0.04 });
    SPR.gem = gem(1, ['#bff3e8', '#5cc3b2', '#36a596', '#1d6d68']);
    SPR.gemBig = gem(1.55, ['#fff1a6', '#f0c64a', '#d39a2a', '#9a6a18']);
    SPR.star = (() => {
      const c = cv(48, 48), x = g2(c);
      x.translate(24, 24); x.fillStyle = 'rgba(255,250,220,1)';
      x.beginPath();
      for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU, rr = i % 2 ? 4 : 22; x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      x.closePath(); x.fill();
      return c;
    })();
    // paper scrap shapes (unit size)
    SPR.scraps = [];
    const rr = U.rng(1600);
    for (let i = 0; i < 6; i++) {
      const p = new Path2D(), n = 5 + (i % 3);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * TAU + rr.range(-0.3, 0.3), d = rr.range(0.55, 1.05);
        if (k) p.lineTo(Math.cos(a) * d, Math.sin(a) * d * 0.8); else p.moveTo(Math.cos(a) * d, Math.sin(a) * d * 0.8);
      }
      p.closePath();
      SPR.scraps.push(p);
    }
  }
  /** blit a part (mkPart result) centred on its pivot */
  function blitPart(ctx, p, x, y, sc) {
    const k = sc / K;
    ctx.drawImage(p.img, x - p.ox * k, y - p.oy * k, p.img.width * k, p.img.height * k);
  }
  function blitPartShadow(ctx, p, x, y, sc, a) {
    const k = sc / K;
    ctx.globalAlpha = a;
    ctx.drawImage(p.sh, x - (p.ox + p.shPad) * k, y - (p.oy + p.shPad) * k, p.sh.width * k, p.sh.height * k);
    ctx.globalAlpha = 1;
  }

  /* ======================= HUD icons ======================= */
  const ICON_CACHE = {};
  function paperIcon(size, draw) {
    const s = size / 48;
    const c = cv(size, size), x = g2(c);
    x.setTransform(s, 0, 0, s, 0, 0); x.lineJoin = 'round'; x.lineCap = 'round';
    draw(x);
    const d = dilate(c, 1.6 * s, C.rim);
    g2(d.c).drawImage(c, d.pad, d.pad);
    applyGrain(g2(d.c), d.c.width, d.c.height, 0.7);
    applyLight(g2(d.c), d.c.width, d.c.height, 0.08);
    const sh = softShadow(d.c, 1.1 * s);
    const out = cv(size, size), o = g2(out);
    o.globalAlpha = 0.42; o.drawImage(sh.c, -d.pad - sh.pad + 1.4 * s, -d.pad - sh.pad + 1.9 * s);
    o.globalAlpha = 1; o.drawImage(d.c, -d.pad, -d.pad);
    return out;
  }
  function seedShape(x, cx, cy, len, ang, col) {
    x.save(); x.translate(cx, cy); x.rotate(ang);
    const w = len * 0.36;
    x.beginPath(); x.moveTo(-len / 2, 0); x.bezierCurveTo(-len / 2, -w, len * 0.2, -w, len / 2, 0); x.bezierCurveTo(len * 0.2, w, -len / 2, w, -len / 2, 0); x.closePath();
    x.fillStyle = col || '#f4e8c6'; x.fill();
    x.strokeStyle = '#c9ab70'; x.lineWidth = len * 0.05;
    x.beginPath(); x.moveTo(-len * 0.36, 0); x.bezierCurveTo(-len * 0.34, -w * 0.62, len * 0.16, -w * 0.62, len * 0.38, 0); x.stroke();
    x.restore();
  }
  const ICONS = {
    'hp-heart'(x) {
      const heart = (s, dx, dy) => { x.beginPath(); x.moveTo(24 + dx, 40 * s + 4 * (1 - s) + dy); x.bezierCurveTo(4 + 20 * (1 - s) + dx, 28 + dy, 4 + 20 * (1 - s) + dx, 8 + 6 * (1 - s) + dy, 24 + dx, 15 + dy); x.bezierCurveTo(44 - 20 * (1 - s) + dx, 8 + 6 * (1 - s) + dy, 44 - 20 * (1 - s) + dx, 28 + dy, 24 + dx, 40 * s + 4 * (1 - s) + dy); x.closePath(); };
      heart(1, 0, 0); x.fillStyle = C.red; x.fill();
      heart(0.8, 0.5, 2.5); x.fillStyle = '#e0604a'; x.fill();
      x.strokeStyle = 'rgba(255,240,220,0.95)'; x.lineWidth = 1.4; x.setLineDash([2.4, 2]);
      heart(0.88, 0, 1.2); x.stroke(); x.setLineDash([]);
    },
    kills(x) {
      x.save(); x.translate(24, 42);
      for (const [a, col] of [[-0.5, C.leafDark], [0.45, C.leaf], [0, C.leafLight]]) { x.save(); x.translate(0, -26); x.rotate(a - Math.PI / 2); x.translate(7, 0); drawPaperLeaf(x, 0, 14, 7, col); x.restore(); }
      turnipPath(x, 14, 28); x.fillStyle = '#efe2b8'; x.fill();
      x.save(); turnipPath(x, 14, 28); x.clip();
      tornCap(x, tornLine(U.rng(5), -16, 16, -16, 2, 0.9, 0.6), -32, C.aub, 1);
      x.restore();
      x.strokeStyle = C.ink; x.lineWidth = 2.2;
      for (const ex of [-6, 6]) { x.beginPath(); x.moveTo(ex - 2.4, -13.4); x.lineTo(ex + 2.4, -8.6); x.moveTo(ex + 2.4, -13.4); x.lineTo(ex - 2.4, -8.6); x.stroke(); }
      x.restore();
    },
    dmg(x) {
      seedShape(x, 24, 26, 30, -0.6);
      x.fillStyle = C.mustard;
      for (const [sx, sy, sr] of [[38, 10, 5], [9, 38, 3.4]]) {
        x.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU, rr = i % 2 ? sr * 0.38 : sr; x.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); } x.closePath(); x.fill();
      }
    },
    rate(x) {
      x.strokeStyle = C.kraft; x.lineWidth = 2.6;
      for (const [y0, l] of [[14, 12], [22, 16], [30, 12]]) { x.beginPath(); x.moveTo(5, y0); x.lineTo(5 + l, y0); x.stroke(); }
      x.fillStyle = C.aub;
      x.beginPath(); x.moveTo(20, 32); x.lineTo(20, 18); x.quadraticCurveTo(20, 12, 25, 12); x.lineTo(36, 12); x.quadraticCurveTo(43, 13, 42, 22); x.lineTo(40, 32); x.closePath(); x.fill();
      x.fillStyle = '#ecdcb8';
      x.beginPath(); x.ellipse(42, 14, 3.4, 4.8, 0.5, 0, TAU); x.fill();
      x.fillStyle = C.mustard; x.fillRect(19, 31, 22, 7);
      x.strokeStyle = 'rgba(40,15,30,0.4)'; x.lineWidth = 1;
      for (const fy of [17, 22, 27]) { x.beginPath(); x.moveTo(28, fy); x.lineTo(40, fy); x.stroke(); }
    },
    multi(x) {
      x.fillStyle = C.kraft;
      x.beginPath(); x.moveTo(14, 18); x.quadraticCurveTo(6, 32, 12, 42); x.lineTo(36, 42); x.quadraticCurveTo(42, 32, 34, 18); x.closePath(); x.fill();
      x.fillStyle = C.kraftDark; x.beginPath(); x.ellipse(24, 18, 11, 3.4, 0, 0, TAU); x.fill();
      x.strokeStyle = C.red; x.lineWidth = 1.6; x.beginPath(); x.moveTo(13, 22); x.quadraticCurveTo(24, 26, 35, 22); x.stroke();
      x.fillStyle = C.pumpkin; x.beginPath(); x.arc(24, 33, 5.4, 0, TAU); x.fill();
      seedShape(x, 16, 9, 10, -1.1); seedShape(x, 25, 6, 10, -1.6); seedShape(x, 34, 9, 10, -2.1);
    },
    bounce(x) {
      x.strokeStyle = C.teal; x.lineWidth = 2; x.setLineDash([3, 2.6]);
      x.beginPath(); x.moveTo(6, 38); x.quadraticCurveTo(14, 6, 24, 36); x.quadraticCurveTo(32, 12, 40, 26); x.stroke(); x.setLineDash([]);
      x.fillStyle = C.teal; x.beginPath(); x.moveTo(44, 30); x.lineTo(36, 27); x.lineTo(42, 21); x.closePath(); x.fill();
      seedShape(x, 24, 36, 14, 0.2);
      x.fillStyle = C.kraftDark; x.fillRect(16, 42, 16, 2.4);
    },
    lantern(x) {
      x.save(); x.translate(24, 44);
      const g = x.createRadialGradient(0, -16, 1, 0, -15, 20);
      g.addColorStop(0, '#fff3c4'); g.addColorStop(0.6, '#f5d690'); g.addColorStop(1, '#c9a0c8');
      turnipPath(x, 15, 32); x.fillStyle = g; x.fill();
      x.save(); turnipPath(x, 15, 32); x.clip();
      tornCap(x, tornLine(U.rng(9), -17, 17, -22, 2, 0.8, 0.6), -36, 'rgba(150,90,160,0.9)', 1);
      x.restore();
      const glowF = (p) => glowHole(x, p, 1, -12, 12, '#fffbe0', '#ffd75a', '#ff9a2a');
      glowF(() => { x.beginPath(); x.moveTo(-7, -14); x.lineTo(-3.6, -19.5); x.lineTo(-0.6, -14); x.closePath(); });
      glowF(() => { x.beginPath(); x.moveTo(2.6, -14); x.lineTo(5.8, -19.5); x.lineTo(9, -14); x.closePath(); });
      glowF(() => { x.beginPath(); x.moveTo(-6, -9.6); x.lineTo(-3, -7.6); x.lineTo(0, -9.4); x.lineTo(3, -7.6); x.lineTo(7.6, -9.8); x.lineTo(5, -4.6); x.lineTo(-4, -4.6); x.closePath(); });
      x.restore();
    },
    speed(x) {
      x.fillStyle = C.tealMid;
      x.beginPath(); x.moveTo(6, 30); x.quadraticCurveTo(14, 26, 22, 30); x.quadraticCurveTo(30, 34, 40, 18); x.quadraticCurveTo(45, 20, 43, 30);
      x.lineTo(42, 40); x.lineTo(38, 40); x.lineTo(37, 34); x.quadraticCurveTo(26, 40, 8, 38); x.quadraticCurveTo(3, 35, 6, 30); x.closePath(); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.55)'; x.beginPath(); x.moveTo(10, 31); x.quadraticCurveTo(20, 29, 28, 33); x.lineTo(24, 35); x.quadraticCurveTo(16, 33, 10, 34); x.closePath(); x.fill();
      x.fillStyle = C.tealDark; x.fillRect(37.5, 34, 4, 6);
      x.fillStyle = C.mustard;
      for (const [sx, sy, sr] of [[12, 14, 4.4], [24, 9, 3], [32, 6, 2.4]]) { x.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU, rr = i % 2 ? sr * 0.38 : sr; x.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); } x.closePath(); x.fill(); }
    },
    magnet(x) {
      x.strokeStyle = C.kraftDark; x.lineWidth = 3.2;
      x.beginPath(); x.moveTo(10, 24); x.quadraticCurveTo(24, 0, 38, 24); x.stroke();
      x.fillStyle = C.gold; x.beginPath(); x.moveTo(17, 20); x.lineTo(20, 14); x.lineTo(23, 20); x.closePath(); x.fill();
      x.fillStyle = C.tealMid; x.beginPath(); x.moveTo(25, 21); x.lineTo(28, 13); x.lineTo(31, 21); x.closePath(); x.fill();
      x.fillStyle = C.kraft;
      x.beginPath(); x.moveTo(6, 22); x.lineTo(42, 22); x.lineTo(37, 42); x.lineTo(11, 42); x.closePath(); x.fill();
      x.save(); x.clip();
      x.strokeStyle = C.kraftLight; x.lineWidth = 1.8;
      for (let yy = 25; yy < 44; yy += 4) { x.beginPath(); x.moveTo(4, yy); x.lineTo(44, yy); x.stroke(); }
      x.strokeStyle = C.kraftDark; x.lineWidth = 1.2;
      for (let xx = 8; xx < 44; xx += 5) { x.beginPath(); x.moveTo(xx, 22); x.lineTo(xx + 2 * (xx < 24 ? 1 : -1) * 0.5, 44); x.stroke(); }
      x.restore();
      x.fillStyle = C.kraftDark; x.fillRect(5, 20.5, 38, 3.6);
    },
    hp(x) {
      x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 1.8;
      for (const sx of [17, 25, 33]) { x.beginPath(); x.moveTo(sx, 15); x.bezierCurveTo(sx - 3, 11, sx + 3, 8, sx, 4); x.stroke(); }
      x.fillStyle = '#454048';
      x.beginPath(); x.moveTo(7, 20); x.lineTo(41, 20); x.quadraticCurveTo(41, 42, 24, 42); x.quadraticCurveTo(7, 42, 7, 20); x.closePath(); x.fill();
      x.fillStyle = '#5c5660'; x.fillRect(3, 19, 42, 4.4);
      x.fillStyle = C.pumpkin; x.beginPath(); x.ellipse(24, 21, 16, 3, 0, 0, TAU); x.fill();
      x.fillStyle = C.aubLight; x.beginPath(); x.arc(18, 20, 3.2, Math.PI, 0); x.fill();
      x.fillStyle = '#efe2b8'; x.beginPath(); x.arc(28, 20.5, 2.8, Math.PI, 0); x.fill();
      x.fillStyle = C.leaf; x.beginPath(); x.ellipse(33.5, 20, 2.2, 1.2, 0.4, 0, TAU); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(10, 26, 3, 10);
    },
  };

  /* ======================= particles helpers ======================= */
  const PAL = {
    creeper: ['#6e3c6d', '#9c629a', '#efe2b8', '#e3cf8a', '#76a54e'],
    ghost: ['#e8f0f5', '#bcd3e6', '#ffffff', '#d4e4f0'],
    colossus: ['#c49c6c', '#96714a', '#6e3c6d', '#e9d9ae', '#ecdcac', '#4d7a35'],
    jack: ['#e57d2c', '#f59c4c', '#76a54e', '#6e3c6d'],
  };
  function scraps(game, x, y, z, n, cols, sz, spd) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = spd * (0.35 + Math.random() * 0.8);
      const col = cols[(Math.random() * cols.length) | 0];
      game.addParticle({
        x, y, z: z * (0.5 + Math.random() * 0.7), vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 25 + Math.random() * 55,
        grav: 70, drag: 2.2, life: 0.9 + Math.random() * 0.7, size: sz * (0.6 + Math.random() * 0.7), color: col, back: shade(col, 0.72),
        kind: 'scrap', vr: (Math.random() - 0.5) * 12, rot: Math.random() * TAU, shape: (Math.random() * 6) | 0,
      });
    }
  }
  function confettiBurst(game, x, y, z, n, spd, life, sz) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = spd * (0.3 + Math.random() * 0.9);
      game.addParticle({
        x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 30 + Math.random() * 70, grav: 120, drag: 2.4,
        life: life * (0.7 + Math.random() * 0.6), size: sz * (0.7 + Math.random() * 0.6), color: CONF[(Math.random() * CONF.length) | 0],
        kind: Math.random() < 0.5 ? 'confetti' : 'strip', vr: (Math.random() - 0.5) * 16, rot: Math.random() * TAU,
      });
    }
  }

  /* ======================= HUD css ======================= */
  const INK = '#3b2a26';
  const CSS = `
body.style-paper { font-family: 'Patrick Hand', 'Gochi Hand', cursive; color: ${INK}; }
body.style-paper #hud { padding: 14px 22px; }
body.style-paper #hud .xp { height: 24px; background: #f4ead2; border: 0; border-radius: 3px; overflow: visible; transform: rotate(-0.4deg);
  box-shadow: 0 0 0 3px #fbf6ea, 3px 5px 6px rgba(48,26,12,.45);
  background-image: repeating-linear-gradient(90deg, rgba(120,80,40,.06) 0 2px, transparent 2px 7px); }
body.style-paper #hud .xp-fill { border-radius: 2px; transition: width .2s;
  background: repeating-linear-gradient(-45deg, #36a596 0 9px, #5cc3b2 9px 18px);
  box-shadow: inset 0 -3px 0 rgba(0,0,0,.08); opacity: .95;
  clip-path: polygon(0 0, 100% 0, calc(100% - 4px) 25%, 100% 50%, calc(100% - 4px) 75%, 100% 100%, 0 100%); }
body.style-paper #hud .lvl { right: -10px; top: -9px; transform: rotate(4deg); background: #e57d2c; color: #fff8ea; font-family: 'Gochi Hand', cursive;
  font-size: 22px; font-weight: 400; padding: 1px 12px 2px; text-shadow: none; border-radius: 2px;
  box-shadow: 0 0 0 2.5px #fbf6ea, 2px 4px 5px rgba(48,26,12,.45); }
body.style-paper #hud .topline { margin-top: 18px; }
body.style-paper #hud .hp { gap: 10px; }
body.style-paper #hud .hp-icon, body.style-paper #hud .kills-icon { width: 40px; height: 40px; }
body.style-paper #hud .hp-bar { width: 240px; height: 22px; background: #c9a275; border: 0; border-radius: 2px; overflow: hidden; transform: rotate(0.6deg);
  box-shadow: 0 0 0 3px #fbf6ea, 3px 5px 6px rgba(48,26,12,.45);
  background-image: repeating-linear-gradient(0deg, rgba(90,60,30,.12) 0 1px, transparent 1px 4px); }
body.style-paper #hud .hp-fill { background: radial-gradient(circle at 5px 5px, rgba(255,240,220,.55) 1.6px, transparent 2px) 0 0/10px 10px, #c4432f;
  clip-path: polygon(0 0, 100% 0, calc(100% - 4px) 25%, 100% 50%, calc(100% - 4px) 75%, 100% 100%, 0 100%); }
body.style-paper #hud .hp-text { font-family: 'Gochi Hand', cursive; font-size: 22px; font-weight: 400; color: ${INK}; text-shadow: none;
  background: #fbf6ea; padding: 0 9px; border-radius: 2px; transform: rotate(-2deg); box-shadow: 2px 3px 4px rgba(48,26,12,.4); }
body.style-paper #hud .clock { position: relative; background: #fffdf6; padding: 6px 26px 4px; transform: rotate(-1.5deg); border-radius: 2px;
  background-image: linear-gradient(transparent 13px, rgba(196,67,47,.5) 13px 15px, transparent 15px), repeating-linear-gradient(transparent 0 19px, rgba(79,111,149,.28) 19px 20px);
  box-shadow: 3px 6px 8px rgba(48,26,12,.45); }
body.style-paper #hud .clock::before { content: ''; position: absolute; left: 50%; top: -6px; width: 15px; height: 15px; margin-left: -7px; border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #fff0b0, #d4ac4a 50%, #8f6d24); box-shadow: 1px 2px 2px rgba(48,26,12,.5); }
body.style-paper #hud .clock-time { font-family: 'Caveat Brush', cursive; font-size: 40px; font-weight: 400; color: ${INK}; text-shadow: none; letter-spacing: 1px; line-height: 1; }
body.style-paper #hud .clock-label { font-family: 'Patrick Hand', cursive; font-size: 15px; color: #8e2c22; opacity: 1; text-transform: none; letter-spacing: .5px; }
body.style-paper #hud .kills { font-family: 'Gochi Hand', cursive; font-size: 30px; font-weight: 400; color: ${INK}; text-shadow: none; gap: 8px; }
body.style-paper #hud .kills-num { background: #fbf6ea; padding: 0 12px; border-radius: 2px; transform: rotate(2deg); box-shadow: 2px 4px 5px rgba(48,26,12,.4); }
body.style-paper.hurt #hud .hp-bar { filter: none; transform: rotate(-1.5deg) scale(1.04); box-shadow: 0 0 0 3px #ffd2c4, 3px 5px 6px rgba(48,26,12,.45); }

body.style-paper #stylebar { background: #c9a275; border: 0; border-radius: 2px; color: ${INK}; padding: 6px 22px; font-family: 'Patrick Hand', cursive; font-size: 15px;
  box-shadow: 0 0 0 3px #fbf6ea, 3px 5px 8px rgba(48,26,12,.5);
  background-image: repeating-linear-gradient(90deg, rgba(90,60,30,.08) 0 1px, transparent 1px 5px); }
body.style-paper #stylebar::before, body.style-paper #stylebar::after { content: ''; position: absolute; top: -9px; width: 46px; height: 18px;
  background: repeating-linear-gradient(45deg, rgba(229,125,44,.78) 0 6px, rgba(245,156,76,.78) 6px 12px); box-shadow: 0 1px 2px rgba(48,26,12,.25); }
body.style-paper #stylebar::before { left: -16px; transform: rotate(-24deg); }
body.style-paper #stylebar::after { right: -16px; transform: rotate(22deg); }
body.style-paper #stylebar .style-family { font-size: 13px; letter-spacing: 1px; opacity: .8; }
body.style-paper #stylebar .style-name { font-family: 'Caveat Brush', cursive; font-weight: 400; font-size: 24px; color: #8e2c22; }
body.style-paper #stylebar .style-hint { opacity: .8; }
body.style-paper #stylebar .auto.on { color: #1d6d68; }

body.style-paper #levelup { background: radial-gradient(ellipse at center, rgba(60,35,20,.35), rgba(40,22,12,.72)); gap: 26px; }
body.style-paper #levelup .lu-title { font-family: 'Caveat Brush', cursive; font-weight: 400; font-size: 74px; letter-spacing: 2px; color: #e57d2c; transform: rotate(-3deg);
  text-shadow: 0 0 0 #fbf6ea, -3px -3px 0 #fbf6ea, 3px -3px 0 #fbf6ea, -3px 3px 0 #fbf6ea, 3px 3px 0 #fbf6ea, 0 4px 0 #fbf6ea, 7px 10px 6px rgba(20,10,5,.55); }
body.style-paper #levelup .lu-cards { gap: 30px; }
body.style-paper #levelup .card { width: 230px; min-height: 290px; padding: 30px 18px 18px; background: #fffdf6; border: 0; border-radius: 3px; color: ${INK};
  background-image: linear-gradient(transparent 58px, rgba(196,67,47,.55) 58px 60px, transparent 60px), repeating-linear-gradient(transparent 0 25px, rgba(79,111,149,.25) 25px 26px);
  box-shadow: 4px 9px 12px rgba(20,10,5,.55); transition: transform .15s; }
body.style-paper #levelup .card:nth-child(1) { transform: rotate(-3deg); }
body.style-paper #levelup .card:nth-child(2) { transform: rotate(1.5deg) translateY(-6px); }
body.style-paper #levelup .card:nth-child(3) { transform: rotate(3.5deg); }
body.style-paper #levelup .card:hover { transform: rotate(0deg) translateY(-10px) scale(1.04); }
body.style-paper #levelup .card::before { content: ''; position: absolute; top: -12px; left: 50%; width: 92px; height: 26px; margin-left: -46px; transform: rotate(-4deg);
  background: repeating-linear-gradient(-45deg, rgba(54,165,150,.75) 0 7px, rgba(154,230,214,.75) 7px 14px); box-shadow: 0 1px 2px rgba(48,26,12,.2); }
body.style-paper #levelup .card:nth-child(2)::before { background: repeating-linear-gradient(-45deg, rgba(214,164,58,.78) 0 7px, rgba(236,196,99,.78) 7px 14px); transform: rotate(3deg); }
body.style-paper #levelup .card:nth-child(3)::before { background: repeating-linear-gradient(-45deg, rgba(156,98,154,.75) 0 7px, rgba(200,160,200,.75) 7px 14px); }
body.style-paper #levelup .card-icon { width: 104px; height: 104px; }
body.style-paper #levelup .card-name { font-family: 'Gochi Hand', cursive; font-size: 28px; font-weight: 400; color: #8e2c22; line-height: 1.05; }
body.style-paper #levelup .card-desc { font-family: 'Patrick Hand', cursive; font-size: 19px; opacity: 1; line-height: 26px; }
body.style-paper #levelup .card-key { top: 10px; left: 12px; width: 30px; height: 30px; border-radius: 50%; background: #e57d2c; color: #fff8ea; opacity: 1;
  font-family: 'Gochi Hand', cursive; font-size: 20px; font-weight: 400; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 0 2.5px #fbf6ea, 1px 3px 3px rgba(48,26,12,.4); }
body.style-paper #levelup .lu-hint { font-family: 'Patrick Hand', cursive; font-size: 20px; color: #fbf6ea; opacity: .95; }

body.style-paper #gameover { background: radial-gradient(ellipse at center, rgba(60,35,20,.45), rgba(30,16,8,.8)); }
body.style-paper #gameover .go-title { font-family: 'Caveat Brush', cursive; font-weight: 400; font-size: 76px; color: #c4432f; transform: rotate(-2deg);
  text-shadow: -3px -3px 0 #fbf6ea, 3px -3px 0 #fbf6ea, -3px 3px 0 #fbf6ea, 3px 3px 0 #fbf6ea, 7px 10px 6px rgba(20,10,5,.55); }
body.style-paper #gameover .go-stats { font-family: 'Patrick Hand', cursive; font-size: 22px; background: #fffdf6; color: ${INK}; padding: 8px 20px; transform: rotate(1deg);
  box-shadow: 3px 6px 8px rgba(20,10,5,.5); opacity: 1; }
body.style-paper #gameover .go-hint { font-family: 'Gochi Hand', cursive; font-size: 20px; color: #fbf6ea; }
body.style-paper #pausebox { font-family: 'Caveat Brush', cursive; font-weight: 400; font-size: 64px; color: #e57d2c;
  text-shadow: -3px -3px 0 #fbf6ea, 3px -3px 0 #fbf6ea, -3px 3px 0 #fbf6ea, 3px 3px 0 #fbf6ea, 6px 8px 6px rgba(20,10,5,.5); }
`;

  /* ======================= register ======================= */
  let VIG = null, VIG_KEY = '';
  const JS = 1.08; // Jack draw scale
  const TEAR = [[0.1, -1.05], [-0.25, -0.85], [0.2, -0.68], [-0.15, -0.5], [0.25, -0.32], [-0.2, -0.15], [0.15, 0.02], [-0.1, 0.2]];
  function tearPath(ctx, side, h, w) {
    ctx.beginPath();
    ctx.moveTo(side * w * 2, -h * 1.2);
    for (const [dx, t] of TEAR) ctx.lineTo(dx * w * 0.5, t * h);
    ctx.lineTo(side * w * 2, h * 0.3);
    ctx.closePath();
  }

  Styles.register({
    id: 'paper',
    name: 'Papierwelt',
    family: 'Papercraft',
    description: 'Handgemachtes Bastel-Diorama aus Tonpapier, Filz, Kraftpapier und Wellpappe – mit gerissenen Kanten, Musterklammern und weichen Schatten.',
    groundColor: '#a87c54',
    groundResMax: 2.5,
    chunkSize: 256,
    fonts: ['Patrick+Hand', 'Gochi+Hand', 'Caveat+Brush'],
    css: CSS,

    init() {
      const t = cv(2, 2).getContext('2d');
      HAS_FILTER = typeof t.filter === 'string' && t.filter === 'none';
      buildGrain();
      buildGroundTextures();
      buildDecals();
      buildProps();
      buildJack();
      buildCreeper();
      buildGhost();
      buildColossus();
      buildSmall();
    },

    renderGroundChunk: renderChunk,

    propsForChunk(info) {
      const pg = info.pg, out = [];
      if (!pg) return out;
      const add = (x, y, type, spr, sc, extra) => out.push(Object.assign({ x, y, type, spr, sc: sc || 1, pad: 100 }, extra));
      G.scatterOwned(info, 128, 8101, (x, y, rng) => {
        if (G.nearSpawn(x, y, 95) || !rng.chance(0.42)) return;
        const reg = regionAt(pg, x, y, 9);
        if (reg === -2) return;
        const roll = rng.next(), v = rng.next(), sc = 0.9 + rng.next() * 0.2;
        let type;
        if (reg === L_FELT) type = roll < 0.45 ? 'tree' : roll < 0.72 ? 'pumpkins' : roll < 0.86 ? 'hay' : 'pin';
        else if (reg === L_MOSS) type = roll < 0.55 ? 'pine' : 'pumpkins';
        else if (reg === L_LEAF) type = roll < 0.35 ? 'bare' : roll < 0.7 ? 'graves' : roll < 0.85 ? 'tree' : 'pumpkins';
        else if (reg === L_CARD) type = roll < 0.4 ? 'fence' : roll < 0.7 ? 'pin' : 'pumpkins';
        else if (reg === L_NEWS) type = roll < 0.5 ? 'pin' : 'none';
        else type = roll < 0.25 ? 'graves' : roll < 0.5 ? 'fence' : roll < 0.7 ? 'pumpkins' : roll < 0.85 ? 'hay' : 'pine';
        if (type === 'tree') add(x, y, 'spr', PROPS.tree[(v * 3) | 0], sc);
        else if (type === 'pine') add(x, y, 'spr', PROPS.tree[3 + ((v * 2) | 0)], sc);
        else if (type === 'bare') add(x, y, 'spr', PROPS.tree[5], sc);
        else if (type === 'hay') add(x, y, 'spr', PROPS.hay[(v * 2) | 0], sc);
        else if (type === 'fence') add(x, y, 'spr', PROPS.fence[(v * 2) | 0], sc);
        else if (type === 'pin') add(x, y, 'pin', PROPS.pinStick, sc, { wheel: PROPS.wheels[(v * 2) | 0], ph: rng.next() * TAU, spd: 1.2 + rng.next() * 1.6 });
        else if (type === 'pumpkins') {
          const n = 1 + ((rng.next() * 3) | 0);
          for (let i = 0; i < n; i++) {
            const px = x + (i ? rng.range(-16, 16) : 0), py = y + (i ? rng.range(-9, 9) : 0);
            if (i && regionAt(pg, px, py, 4) === -2) continue;
            add(px, py, 'spr', PROPS.pumpkin[i === 0 ? (v * 3) | 0 : (rng.next() * 3) | 0], i ? 0.7 + rng.next() * 0.25 : sc);
          }
        } else if (type === 'graves') {
          const n = 1 + ((rng.next() * 3) | 0);
          for (let i = 0; i < n; i++) add(x + (i - (n - 1) / 2) * 20 + rng.range(-3, 3), y + rng.range(-4, 4), 'spr', PROPS.grave[(rng.next() * 3) | 0], 0.9 + rng.next() * 0.2);
        }
      });
      delete info.pg;
      return out;
    },
    drawShadow(ctx, o, view) {
      if (o.kind === 'prop') {
        const s = o.spr.shadow;
        if (s) { ctx.globalAlpha = 0.78; blit(ctx, s, o.x, o.y, o.sc); ctx.globalAlpha = 1; }
        return;
      }
      let rw, rh, a = 1, dy = 0.6;
      if (o.kind === 'player') { rw = 9; rh = 3.6; }
      else if (o.type === 'ghost') { rw = 6.5; rh = 2.4; a = 0.55; dy = 0.5; }
      else if (o.type === 'colossus') { rw = 19; rh = 6; }
      else { rw = 8.5; rh = 3.2; }
      if (o.kind === 'enemy') {
        if (o.dying) a *= 1 - o.deathT;
        else if (o.spawnT < 1) a *= o.spawnT;
      }
      if (a <= 0.02) return;
      ctx.globalAlpha = a * 0.75;
      ctx.drawImage(SPR.blob, o.x - rw + 1.2, o.y - rh + dy, rw * 2, rh * 2);
      ctx.globalAlpha = 1;
    },
    drawProp(ctx, p, view) {
      blit(ctx, p.spr, p.x, p.y, p.sc);
      if (p.type === 'pin') {
        const hx = p.x, hy = p.y - 26 * p.sc, w = p.wheel, k = (p.sc * 0.82) / K;
        ctx.save(); ctx.translate(hx + 1.2, hy + 1.6); ctx.rotate(view.rt * p.spd + p.ph);
        ctx.globalAlpha = 0.22;
        ctx.drawImage(SPR.blob, -9 * p.sc, -9 * p.sc, 18 * p.sc, 18 * p.sc);
        ctx.restore();
        ctx.globalAlpha = 1;
        ctx.save(); ctx.translate(hx, hy); ctx.rotate(view.rt * p.spd + p.ph);
        ctx.drawImage(w, -w.width / 2 * k, -w.height / 2 * k, w.width * k, w.height * k);
        ctx.restore();
        drawPin(ctx, hx, hy, 0.75 * p.sc);
      }
    },
    drawEnemy(ctx, e, view) {
      const fi = e.facing > 0 ? 0 : 1;
      let frames, rate, sc = 0.93 + e.seed * 0.14, bob = 0;
      if (e.type === 'creeper') { frames = SPR.creeper[e.seed < 0.5 ? 0 : 1][fi]; rate = 0.42; }
      else if (e.type === 'ghost') { frames = SPR.ghost[fi]; rate = 0; bob = -2.5 - Math.sin(view.rt * 3.1 + e.seed * 20) * 1.6; }
      else { frames = SPR.colossus[fi]; rate = 0.22; sc = 0.97 + e.seed * 0.06; }
      const n = frames.length;
      const fidx = rate ? Math.floor(e.anim * rate * n) % n : Math.floor(view.rt * 7 + e.seed * 13) % n;
      const s = frames[(fidx + n) % n];
      if (e.dying) {
        const k = e.deathT, h = (e.type === 'colossus' ? 50 : 24) * sc, w = (e.type === 'colossus' ? 22 : 10) * sc;
        for (const side of [-1, 1]) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, 1 - k * k);
          ctx.translate(e.x + side * k * w * 0.7, e.y + bob - k * 3);
          ctx.rotate(side * k * 0.7);
          ctx.translate(0, -h * 0.4);
          tearPath(ctx, side, h, w);
          ctx.clip();
          blit(ctx, s, 0, h * 0.4, sc);
          ctx.strokeStyle = C.rim; ctx.lineWidth = 0.9;
          ctx.beginPath();
          TEAR.forEach(([dx, t], i) => (i ? ctx.lineTo(dx * w * 0.5, t * h) : ctx.moveTo(dx * w * 0.5, t * h)));
          ctx.stroke();
          ctx.restore();
        }
        return;
      }
      let sx = 1, sy = 1;
      if (e.spawnT < 1) {
        const t = e.spawnT;
        sy = Math.max(0.06, U.ease.outBack(U.clamp((t - 0.1) / 0.9, 0, 1)));
        sx = 1 + (1 - t) * 0.3;
        if (e.type === 'ghost') ctx.globalAlpha = Math.min(1, t * 2.5);
      }
      if (e.type === 'ghost') ctx.globalAlpha *= 0.92;
      blit(ctx, s, e.x, e.y + bob, sc, sx, sy);
      if (e.flash > 0.05) {
        ctx.globalAlpha = Math.min(1, e.flash * 1.1);
        blit(ctx, s.flash, e.x, e.y + bob, sc, sx, sy);
      }
      ctx.globalAlpha = 1;
      if (e.type === 'colossus' && e.spawnT >= 1) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.32 + Math.sin(view.rt * 4 + e.seed * 9) * 0.1;
        const gx = e.x + e.facing * 2.2 * sc, gy = e.y - (9.6 + 32 * 0.33 + 0.7) * sc, R = 12 * sc;
        ctx.drawImage(SPR.glow, gx - R, gy - R, R * 2, R * 2);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
    },
    drawPlayer(ctx, p, view) {
      const set = SPR.jack[p.facing > 0 ? 0 : 1];
      let s;
      const moving = p.moving || p.dashT > 0;
      if (moving) {
        const i = Math.floor((p.anim / 2.4) * 8) & 7;
        s = (p.shootT > 0.45 ? set.throw : set.walk)[i];
      } else s = p.shootT > 0.45 ? set.throw[2] : set.idle[Math.floor(view.rt * 3) & 3];
      if (p.dashT > 0) {
        for (let k = 1; k <= 3; k++) {
          ctx.globalAlpha = 0.28 - k * 0.07;
          blit(ctx, s, p.x - p.dashX * k * 7, p.y - p.dashY * k * 7, JS);
        }
        ctx.globalAlpha = 1;
      }
      const blink = p.iframes > 0 && p.hurtT < 0.5 && Math.floor(view.rt * 18) % 2 === 0;
      ctx.globalAlpha = blink ? 0.45 : 1;
      const sq = p.levelT > 0 ? 1 + Math.sin(p.levelT * 14) * p.levelT * 0.12 : 1;
      blit(ctx, s, p.x, p.y, JS, JS * (2 - sq), JS * sq);
      if (p.hurtT > 0.05) {
        ctx.globalAlpha = Math.min(1, p.hurtT * 1.2);
        blit(ctx, s.flash, p.x, p.y, JS, JS * (2 - sq), JS * sq);
      }
      ctx.globalAlpha = 1;
      // the carved face glows
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.3 + Math.sin(view.rt * 9) * 0.05 + Math.sin(view.rt * 23.7) * 0.04 + p.shootT * 0.12;
      const gx = p.x + p.facing * 2.4 * JS, gy = p.y - 22.4 * JS, R = 11;
      ctx.drawImage(SPR.glow, gx - R, gy - R, R * 2, R * 2);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    },
    drawOrbital(ctx, o, view) {
      const bob = Math.sin(view.rt * 4 + o.idx) * 1.2;
      ctx.globalAlpha = 0.2;
      ctx.drawImage(SPR.blob, o.x - 5 + 2, o.y + 8, 10, 4);
      ctx.globalAlpha = 1;
      const sw = Math.sin(view.rt * 5 + o.idx * 2) * 0.12;
      ctx.save(); ctx.translate(o.x, o.y - 2 + bob); ctx.rotate(sw);
      blitPartShadow(ctx, SPR.lantern, 0.8, 1.1, 1, 0.3);
      blitPart(ctx, SPR.lantern, 0, 0, 1);
      ctx.restore();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.42 + Math.sin(view.rt * 11 + o.idx) * 0.06;
      const R = 15;
      ctx.drawImage(SPR.glow, o.x - R, o.y - 6 + bob - R, R * 2, R * 2);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    },
    drawProjectile(ctx, pr, view) {
      ctx.globalAlpha = 0.22;
      ctx.drawImage(SPR.blob, pr.x - 2.5 + 1, pr.y + 5, 5, 2);
      const sp = Math.hypot(pr.vx, pr.vy) || 1, ux = pr.vx / sp, uy = pr.vy / sp;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(251,246,234,0.5)'; ctx.lineWidth = 1.6; ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.moveTo(pr.x - ux * 3, pr.y - uy * 3); ctx.lineTo(pr.x - ux * 11, pr.y - uy * 11); ctx.stroke();
      ctx.strokeStyle = 'rgba(229,125,44,0.35)'; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(pr.x - ux * 4, pr.y - uy * 4); ctx.lineTo(pr.x - ux * 13, pr.y - uy * 13); ctx.stroke();
      ctx.save(); ctx.translate(pr.x, pr.y); ctx.rotate(pr.angle + pr.spin * 0.6);
      blitPartShadow(ctx, SPR.seed, 0.5, 0.7, 0.85, 0.35);
      blitPart(ctx, SPR.seed, 0, 0, 0.85);
      ctx.restore();
    },
    drawGem(ctx, g, view) {
      const big = g.big, p = big ? SPR.gemBig : SPR.gem;
      const bob = -3.2 - Math.sin(view.rt * 3.5 + g.seed * 10) * 0.9;
      const pop = g.pop > 0 ? U.ease.outBack(1 - g.pop) : 1;
      const turn = Math.cos(view.rt * 2.2 + g.seed * 6);
      ctx.globalAlpha = 0.28;
      ctx.drawImage(SPR.blob, g.x - (big ? 4 : 3) + 0.8, g.y - 1, big ? 8 : 6, 2.4);
      ctx.globalAlpha = 1;
      ctx.save(); ctx.translate(g.x, g.y + bob); ctx.scale(pop * (0.35 + 0.65 * Math.abs(turn)), pop);
      blitPart(ctx, p, 0, 0, 1);
      ctx.restore();
      const tw = (view.rt * 0.6 + g.seed * 3) % 1;
      if (tw < 0.12) {
        const k = Math.sin((tw / 0.12) * Math.PI), R = (big ? 5 : 3.4) * k;
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(SPR.star, g.x - 1 - R, g.y + bob - 2 - R, R * 2, R * 2);
        ctx.globalCompositeOperation = 'source-over';
      }
    },
    drawParticle(ctx, pt, view) {
      const k = pt.life / pt.max;
      const fade = k < 0.3 ? k / 0.3 : 1;
      const kind = pt.kind;
      if (kind === 'scrap' || kind === 'strip' || kind === 'confetti') {
        const age = pt.max - pt.life;
        const sx = pt.x + Math.sin(age * 7 + pt.seed * 20) * (kind === 'confetti' ? 0.6 : 1.4), sy = pt.y - pt.z;
        if (pt.z > 0.6) {
          ctx.globalAlpha = 0.16 * fade;
          ctx.fillStyle = C.shadow;
          ctx.fillRect(pt.x + 0.8 - pt.size * 0.4, pt.y + 0.4, pt.size * 0.8, pt.size * 0.35);
        }
        ctx.globalAlpha = fade;
        const fl = Math.cos(pt.rot * 1.7 + pt.seed * 6);
        ctx.save(); ctx.translate(sx, sy); ctx.rotate(pt.rot);
        if (kind === 'scrap') {
          ctx.scale(pt.size, pt.size * Math.max(0.18, Math.abs(fl)));
          ctx.fillStyle = fl < 0 ? pt.back : pt.color;
          ctx.fill(SPR.scraps[pt.shape || 0]);
          ctx.strokeStyle = 'rgba(251,246,234,0.9)'; ctx.lineWidth = 0.16;
          ctx.stroke(SPR.scraps[pt.shape || 0]);
        } else if (kind === 'strip') {
          ctx.fillStyle = pt.color;
          ctx.fillRect(-pt.size * 0.7, -pt.size * 0.22 * Math.max(0.2, Math.abs(fl)), pt.size * 1.4, pt.size * 0.44 * Math.max(0.2, Math.abs(fl)));
        } else {
          ctx.fillStyle = pt.color;
          ctx.beginPath(); ctx.ellipse(0, 0, pt.size * 0.5, pt.size * 0.5 * Math.max(0.25, Math.abs(fl)), 0, 0, TAU); ctx.fill();
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      } else if (kind === 'puff') {
        const t = 1 - k;
        ctx.globalAlpha = 0.5 * k;
        ctx.fillStyle = pt.color || '#e8d8b8';
        ctx.beginPath(); ctx.arc(pt.x, pt.y - pt.z, pt.size * (0.6 + t), 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
      } else if (kind === 'glint') {
        const R = pt.size * Math.sin(k * Math.PI);
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(SPR.star, pt.x - R, pt.y - pt.z - R, R * 2, R * 2);
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.globalAlpha = fade;
        ctx.fillStyle = pt.color || '#fff';
        ctx.beginPath(); ctx.arc(pt.x, pt.y - pt.z, pt.size * 0.5, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
      }
    },
    drawNumber(ctx, n, view) {
      const k = n.life / n.max, t = 1 - k;
      const pop = t < 0.18 ? 0.4 + 0.6 * U.ease.outBack(t / 0.18) : 1;
      const size = (n.crit ? 11 : 8) * pop;
      ctx.save();
      ctx.globalAlpha = U.clamp(k * 3, 0, 1);
      ctx.translate(n.x, n.y); ctx.rotate((n.seed - 0.5) * 0.35);
      ctx.font = size.toFixed(2) + 'px "Gochi Hand", "Patrick Hand", cursive';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      const txt = String(n.value);
      ctx.fillStyle = 'rgba(48,26,12,0.35)';
      ctx.fillText(txt, 0.5, 0.7);
      ctx.lineWidth = n.crit ? 2.4 : 1.8; ctx.strokeStyle = n.crit ? '#fff3c0' : C.rim;
      ctx.strokeText(txt, 0, 0);
      ctx.fillStyle = n.crit ? C.red : INK;
      ctx.fillText(txt, 0, 0);
      ctx.restore();
    },
    drawScreenOverlay(ctx, view) {
      const key = view.W + 'x' + view.H;
      if (key !== VIG_KEY) {
        VIG_KEY = key;
        VIG = cv(view.W, view.H);
        const x = g2(VIG), R = Math.hypot(view.W, view.H) / 2;
        const g = x.createRadialGradient(view.W * 0.45, view.H * 0.42, R * 0.35, view.W / 2, view.H / 2, R);
        g.addColorStop(0, 'rgba(255,236,200,0.05)'); g.addColorStop(0.6, 'rgba(70,40,20,0)'); g.addColorStop(1, 'rgba(60,30,15,0.36)');
        x.fillStyle = g; x.fillRect(0, 0, view.W, view.H);
      }
      ctx.drawImage(VIG, 0, 0);
    },
    drawIcon(ctx, id, size) {
      const key = id + ':' + size;
      let c = ICON_CACHE[key];
      if (!c) {
        const fn = ICONS[id] || ICONS.dmg;
        c = ICON_CACHE[key] = paperIcon(size, fn);
      }
      ctx.drawImage(c, 0, 0);
    },

    onHit(game, e, src) {
      const z = e.type === 'colossus' ? 26 : e.type === 'ghost' ? 14 : 12;
      scraps(game, e.x, e.y, z, e.type === 'colossus' ? 2 : 1, PAL[e.type], e.type === 'colossus' ? 2.4 : 1.7, 45);
      confettiBurst(game, e.x, e.y, z, 2, 50, 0.45, 1.2);
    },
    onKill(game, e) {
      const big = e.type === 'colossus';
      scraps(game, e.x, e.y, big ? 26 : 12, big ? 18 : e.type === 'ghost' ? 6 : 8, PAL[e.type], big ? 4 : 2.6, big ? 85 : 60);
      confettiBurst(game, e.x, e.y, big ? 24 : 10, big ? 14 : 5, big ? 90 : 60, 0.8, 1.3);
      if (big) for (let i = 0; i < 6; i++) game.addParticle({ x: e.x + (Math.random() - 0.5) * 30, y: e.y + (Math.random() - 0.5) * 10, z: 2, kind: 'puff', size: 5 + Math.random() * 4, life: 0.6, color: '#d8c4a0', vx: (Math.random() - 0.5) * 30, drag: 3 });
    },
    onHurt(game, p) {
      scraps(game, p.x, p.y, 16, 7, PAL.jack, 2.2, 70);
      confettiBurst(game, p.x, p.y, 16, 4, 60, 0.5, 1.2);
    },
    onPickup(game, g) {
      game.addParticle({ x: g.x, y: g.y, z: 4, kind: 'glint', size: g.big ? 7 : 4.5, life: 0.28, drag: 0 });
    },
    onDash(game, p) {
      for (let i = 0; i < 5; i++) game.addParticle({ x: p.x + (Math.random() - 0.5) * 8, y: p.y + (Math.random() - 0.5) * 4, z: 1, kind: 'puff', size: 2.5 + Math.random() * 2, life: 0.45, color: '#e6d6b4', vx: -p.dashX * 30 + (Math.random() - 0.5) * 20, vy: -p.dashY * 30, drag: 4 });
    },
    onLevelUp(game, p) {
      confettiBurst(game, p.x, p.y, 24, 46, 120, 1.4, 1.8);
    },
    onDeath(game, p) {
      scraps(game, p.x, p.y, 16, 24, PAL.jack, 3, 90);
    },
  });
})();
