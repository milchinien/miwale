/* Clay World — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   Ported from the reference module js/styles/clay.js ("Knetwelt"). */
(function (root) {
  'use strict';
  const TAU = Math.PI * 2, PI = Math.PI;
  const PALETTE = {
    meadow: '#76a454', meadowLight: '#8cac5a', soil: '#986c4a', purpleClay: '#66507e', pond: '#7ebad2', ochrePath: '#d6a262',
    pumpkin: '#ee7a22', overalls: '#3c62a6', pants: '#344c80', scarf: '#68ae48', skin: '#f8e0ba', shoe: '#6c422a',
    turnipTop: '#8650ac', turnipCream: '#f4e8cc', leaf: '#60a246', brow: '#4a2852', ghost: '#eaf0fc', ghostShade: '#96a4ce',
    glowCore: '#fff7c4', glowMid: '#ffd458', glowEdge: '#ff8f22', cavity: '#4e1606', gem: '#ffca40', gemBig: '#ff7c34',
    trunk: '#865e40', hudOrange: '#f07a24', panel: '#f5ddb8', cream: '#fff6e6',
  };

  /* ---------- tiny helpers (inlined replacements for the game's U.*) ---------- */
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const rgbS = (a, al) => (al === undefined ? 'rgb(' + (a[0] | 0) + ',' + (a[1] | 0) + ',' + (a[2] | 0) + ')' : 'rgba(' + (a[0] | 0) + ',' + (a[1] | 0) + ',' + (a[2] | 0) + ',' + al + ')');
  const lighten = (c, t) => mix(c, [255, 251, 240], t);                                    // warm white, never pure white
  const darken = (c, t) => mix(c.map((v) => v * (1 - t)), [64, 26, 52], t * 0.3);           // shadows drift to plum
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hash2(x, y, s) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  /** Value noise 0..1, optionally periodic (p) for tileable textures. */
  function vnoise(x, y, seed, p) {
    let ix = Math.floor(x), iy = Math.floor(y); const fx = x - ix, fy = y - iy;
    const w = (i) => (p ? ((i % p) + p) % p : i), u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash2(w(ix), w(iy), seed), b = hash2(w(ix + 1), w(iy), seed), c = hash2(w(ix), w(iy + 1), seed), d = hash2(w(ix + 1), w(iy + 1), seed);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, seed, oct, p) { let s = 0, amp = 0.5, n = 0; for (let i = 0; i < oct; i++) { s += vnoise(x, y, seed + i * 17, p) * amp; n += amp; x *= 2; y *= 2; if (p) p *= 2; amp *= 0.5; } return s / n; }
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

  /* ---------- shapes ---------- */
  const E = (x, y, rx, ry) => (c) => { c.moveTo(x + rx, y); c.ellipse(x, y, rx, ry, 0, 0, TAU); };
  const CAP = (x1, y1, x2, y2, r) => (c) => { const a = Math.atan2(y2 - y1, x2 - x1); c.moveTo(x1 + Math.cos(a + PI / 2) * r, y1 + Math.sin(a + PI / 2) * r); c.arc(x1, y1, r, a + PI / 2, a + PI * 1.5); c.arc(x2, y2, r, a - PI / 2, a + PI / 2); c.closePath(); };
  function blobPath(c, pts) { // closed Catmull-Rom through lumpy points = hand-rolled ball
    const n = pts.length; c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < n; i++) { const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n]; c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]); }
    c.closePath();
  }
  function lumpPts(cx, cy, rx, ry, n, amt, r) { const pts = [], ph = r() * TAU; for (let i = 0; i < n; i++) { const a = (i / n) * TAU, k = 1 + (r() - 0.5) * amt + Math.sin(a * 3 + ph) * amt * 0.25; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); } return pts; }
  function pumpkinPath(c, cx, cy, rx, ry) { // superellipse with dents at top (stem) and bottom
    for (let i = 0; i <= 56; i++) { const th = (i / 56) * TAU, co = Math.cos(th), si = Math.sin(th); const x = Math.sign(co) * Math.pow(Math.abs(co), 0.85) * rx; let y = Math.sign(si) * Math.pow(Math.abs(si), 0.92) * ry; y *= 1 - 0.15 * Math.exp(-Math.pow((th - PI * 1.5) / 0.3, 2)) - 0.07 * Math.exp(-Math.pow((th - PI * 0.5) / 0.26, 2)); if (i) c.lineTo(cx + x, cy + y); else c.moveTo(cx + x, cy + y); }
    c.closePath();
  }
  function turnipPath(c, cx, top, bottom, w) { const h = bottom - top; c.moveTo(cx, top); c.bezierCurveTo(cx + w * 0.42, top + h * 0.02, cx + w, top + h * 0.22, cx + w, top + h * 0.56); c.bezierCurveTo(cx + w, top + h * 0.86, cx + w * 0.55, bottom, cx, bottom); c.bezierCurveTo(cx - w * 0.55, bottom, cx - w, top + h * 0.86, cx - w, top + h * 0.56); c.bezierCurveTo(cx - w, top + h * 0.22, cx - w * 0.42, top + h * 0.02, cx, top); c.closePath(); }
  function leafPath(c, bx, by, a, len, wid) { const dx = Math.sin(a), dy = -Math.cos(a), nx = -dy, ny = dx, tx = bx + dx * len, ty = by + dy * len; c.moveTo(bx, by); c.bezierCurveTo(bx + dx * len * 0.22 + nx * wid, by + dy * len * 0.22 + ny * wid, tx - dx * len * 0.3 + nx * wid * 0.75, ty - dy * len * 0.3 + ny * wid * 0.75, tx, ty); c.bezierCurveTo(tx - dx * len * 0.3 - nx * wid * 0.75, ty - dy * len * 0.3 - ny * wid * 0.75, bx + dx * len * 0.22 - nx * wid, by + dy * len * 0.22 - ny * wid, bx, by); c.closePath(); }

  /* ---------- the plasticine painter (the core of the style) ---------- */
  let PK = 3, PR = rng(1), FPC = null; // px per unit of the canvas being painted, lump rng, fingerprint tile
  function makeFingerprint() { // tileable 192 px tile: concentric thumb-print arcs + tool smears, dark groove + light lip 0.9 px lower
    const W = 192, c = canvas(W, W), k = c.getContext('2d'), r = rng(4711), prints = [], marks = [];
    for (let i = 0; i < 7; i++) prints.push({ x: r() * W, y: r() * W, rx: 9 + r() * 9, rot: r() * PI, n: 5 + Math.floor(r() * 4), a0: r() * TAU, sw: PI * (1 + r() * 0.9) });
    for (let i = 0; i < 12; i++) marks.push({ x: r() * W, y: r() * W, a: r() * PI, l: 5 + r() * 12, b: (r() - 0.5) * 6 });
    k.lineCap = 'round';
    for (let oy = -W; oy <= W; oy += W) for (let ox = -W; ox <= W; ox += W) {
      for (const p of prints) for (let j = 1; j <= p.n; j++) {
        const rr = j * (p.rx / p.n), a0 = p.a0 + j * 0.35; k.lineWidth = 0.9;
        k.strokeStyle = 'rgba(70,28,20,0.1)'; k.beginPath(); k.ellipse(p.x + ox, p.y + oy, rr, rr * 1.25, p.rot, a0, a0 + p.sw); k.stroke();
        k.strokeStyle = 'rgba(255,246,232,0.09)'; k.beginPath(); k.ellipse(p.x + ox, p.y + oy + 0.9, rr, rr * 1.25, p.rot, a0, a0 + p.sw); k.stroke();
      }
      for (const m of marks) for (const [lw, col, d] of [[1.3, 'rgba(70,28,20,0.07)', 0], [0.8, 'rgba(255,246,232,0.08)', 1.1]]) {
        const dx = Math.cos(m.a) * m.l, dy = Math.sin(m.a) * m.l; k.lineWidth = lw; k.strokeStyle = col;
        k.beginPath(); k.moveTo(m.x + ox, m.y + oy + d); k.quadraticCurveTo(m.x + ox + dx * 0.5 + m.b, m.y + oy + dy * 0.5 - m.b + d, m.x + ox + dx, m.y + oy + dy + d); k.stroke();
      }
    }
    return c;
  }
  /** One clay part: contact shadow, base, key-light radial, fingerprints, inner AO + rim (offset-shadow trick), detail, soft spec. */
  function clay(c, shape, col, o) {
    const b = o.b, cx = b[0], cy = b[1], rx = b[2], ry = b[3], R = Math.max(rx, ry);
    if (typeof col === 'string') col = hex(col);
    const base = rgbS(col);
    if (o.cast !== 0) { // soft contact shadow onto parts already painted (source-atop = only where clay exists)
      c.save(); c.globalCompositeOperation = 'source-atop';
      c.shadowColor = 'rgba(52,22,24,' + (o.cast || 0.42) + ')'; c.shadowBlur = Math.min(R * 0.4, 2.4) * PK;
      c.shadowOffsetX = Math.min(R * 0.06, 0.45) * PK; c.shadowOffsetY = Math.min(R * 0.2, 1.4) * PK;
      c.fillStyle = base; c.beginPath(); shape(c); c.fill(); c.restore();
    }
    c.save(); c.beginPath(); shape(c); c.fillStyle = base; c.fill(); c.clip();
    const g = c.createRadialGradient(cx - rx * 0.25, cy - ry * 0.5, R * 0.04, cx + rx * 0.05, cy + ry * 0.05, R * 1.22);
    g.addColorStop(0, rgbS(lighten(col, o.lit === undefined ? 0.2 : o.lit))); g.addColorStop(0.5, base); g.addColorStop(1, rgbS(o.dark || darken(col, 0.4)));
    c.fillStyle = g; c.fillRect(cx - R * 2.5, cy - R * 2.5, R * 5, R * 5);
    if (o.fp !== 0 && FPC) {
      const pat = c.createPattern(FPC, 'repeat'); pat.setTransform(new DOMMatrix([1 / PK, 0, 0, 1 / PK, PR() * 60, PR() * 60]));
      c.globalAlpha = o.fp || 1; c.fillStyle = pat; c.fillRect(cx - R * 1.6, cy - R * 1.6, R * 3.2, R * 3.2); c.globalAlpha = 1;
    }
    const OFF = 3000; // fill the OUTSIDE (big rect minus shape, evenodd) far away; only its blurred shadow lands inside the clip
    c.save(); c.beginPath(); c.rect(cx - R * 3 + OFF, cy - R * 3, R * 6, R * 6); c.translate(OFF, 0); shape(c); c.translate(-OFF, 0);
    c.fillStyle = '#000';
    c.shadowColor = 'rgba(58,20,40,' + (o.ao === undefined ? 0.5 : o.ao) + ')'; c.shadowBlur = R * 0.6 * PK;
    c.shadowOffsetX = -OFF * PK - R * 0.1 * PK; c.shadowOffsetY = -R * 0.3 * PK; c.fill('evenodd');          // AO hugging the bottom edge
    if (o.rim !== 0) {
      c.shadowColor = 'rgba(255,247,230,' + (o.rim === undefined ? 0.42 : o.rim) + ')'; c.shadowBlur = R * 0.26 * PK;
      c.shadowOffsetX = -OFF * PK + R * 0.04 * PK; c.shadowOffsetY = R * 0.12 * PK; c.fill('evenodd');      // warm rim along the top edge
    }
    c.restore();
    if (o.detail) { c.save(); o.detail(c); c.restore(); }
    const sp = o.spec === undefined ? 0.3 : o.spec;
    if (sp > 0) { // broad soft specular, tilted -0.45 rad, stretched 1.4 x 0.8, upper-left
      const h = o.hi || [cx - rx * 0.3, cy - ry * 0.52, R * 0.45];
      c.save(); c.translate(h[0], h[1]); c.rotate(-0.45); c.scale(1.4, 0.8);
      const sg = c.createRadialGradient(0, 0, 0, 0, 0, h[2]);
      sg.addColorStop(0, 'rgba(255,255,252,' + sp + ')'); sg.addColorStop(0.45, 'rgba(255,253,244,' + sp * 0.38 + ')'); sg.addColorStop(1, 'rgba(255,252,240,0)');
      c.fillStyle = sg; c.beginPath(); c.arc(0, 0, h[2], 0, TAU); c.fill();
      if (o.gloss) { c.fillStyle = 'rgba(255,255,255,' + o.gloss + ')'; c.beginPath(); c.ellipse(-h[2] * 0.1, -h[2] * 0.06, h[2] * 0.32, h[2] * 0.17, 0, 0, TAU); c.fill(); }
      c.restore();
    }
    c.restore();
  }
  const cE = (c, x, y, rx, ry, col, o) => clay(c, E(x, y, rx, ry), col, Object.assign({ b: [x, y, rx, ry] }, o));
  const cCap = (c, x1, y1, x2, y2, r, col, o) => clay(c, CAP(x1, y1, x2, y2, r), col, Object.assign({ b: [(x1 + x2) / 2, (y1 + y2) / 2, Math.abs(x2 - x1) / 2 + r, Math.abs(y2 - y1) / 2 + r] }, o));
  const cLump = (c, x, y, rx, ry, col, amt, o) => { const pts = lumpPts(x, y, rx, ry, 11, amt, PR); clay(c, (k) => blobPath(k, pts), col, Object.assign({ b: [x, y, rx, ry] }, o)); };
  /** Pressed groove: dark furrow + lighter lip 0.55 w below. */
  function groove(c, path, w, a) {
    c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = 'rgba(58,22,18,' + a + ')'; c.lineWidth = w; c.beginPath(); path(c); c.stroke();
    c.save(); c.translate(0, w * 0.55); c.strokeStyle = 'rgba(255,240,220,' + a * 0.75 + ')'; c.lineWidth = w * 0.5; c.beginPath(); path(c); c.stroke(); c.restore();
  }
  function eye(c, x, y, rx, ry, px, py, pr) {
    cE(c, x, y, rx, ry, [250, 248, 240], { spec: 0.5, ao: 0.4, cast: 0.35, fp: 0.5, lit: 0.1 });
    c.fillStyle = '#1e1420'; c.beginPath(); c.arc(px, py, pr, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(px - pr * 0.35, py - pr * 0.4, pr * 0.32, 0, TAU); c.fill();
  }
  function glowGrad(c, x, y, r) { const g = c.createRadialGradient(x, y, r * 0.05, x, y, r); g.addColorStop(0, '#fff7c4'); g.addColorStop(0.45, '#ffd458'); g.addColorStop(1, '#ff8f22'); return g; }
  /** Carved hole: dark cavity, candle light shifted (0.15, 0.8) down = wall thickness. */
  function carve(c, path, glow) { c.save(); c.beginPath(); path(c); c.fillStyle = '#4e1606'; c.fill(); c.clip(); c.translate(0.15, 0.8); c.beginPath(); path(c); c.fillStyle = glow; c.fill(); c.restore(); }

  /* ---------- sprites: baked once per frame index at K px/unit, each frame with its own lump seed ("boil") ---------- */
  let K = 3;
  function build(box, fn, seed) {
    const [l, t, r, b] = box, c = canvas((r - l) * K, (b - t) * K), x = c.getContext('2d');
    x.scale(K, K); x.translate(-l, -t); x.lineJoin = 'round'; x.lineCap = 'round'; PK = K; PR = rng(seed); fn(x);
    const f = canvas(c.width, c.height), fx = f.getContext('2d'); fx.translate(c.width, 0); fx.scale(-1, 1); fx.drawImage(c, 0, 0);
    return { c, l: f, ox: -l * K, oy: -t * K };
  }
  function blit(ctx, s, x, y, sx, sy, rot, left) {
    const k = 1 / K, img = left ? s.l : s.c, ox = left ? s.c.width - s.ox : s.ox;
    ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot);
    ctx.drawImage(img, -ox * k * sx, -s.oy * k * sy, img.width * k * sx, img.height * k * sy); ctx.restore();
  }

  const JC = { pump: [238, 122, 34], body: [60, 98, 166], pants: [52, 76, 128], scarf: [104, 174, 72], shoe: [108, 66, 42], hand: [248, 224, 186], stem: [120, 116, 52], leaf: [104, 166, 70] };
  // back foot x,y | front foot x,y | back arm, front arm (rad) | body lift ; frame 0 = idle, 1-4 = walk
  const JACK_FR = [[-2.1, 0, 2.3, 0, 0.18, -0.18, 0], [-3.5, 0, 3.7, -0.2, 0.8, -0.75, 0], [-0.8, -1.7, 1.0, 0, 0.25, -0.2, 0.9], [3.5, -0.2, -3.3, 0, -0.7, 0.8, 0], [1.0, 0, -0.8, -1.7, -0.2, 0.25, 0.9]];
  function heroArt(c, fr) {
    const F = JACK_FR[fr], by = -F[6], hx0 = 0.4, hy0 = -19.6 + by, hrx = 10.2, hry = 8.4;
    const fl = [0.22, 0.42, 0.55, 0.38, 0.58][fr], ax = -2.6, ay = -11.6 + by;
    const tx1 = ax - Math.sin(fl) * 3.8, ty1 = ay + Math.cos(fl) * 3.8;
    cCap(c, ax, ay, tx1, ty1, 1.5, JC.scarf, { cast: 0, spec: 0.2 });
    cCap(c, tx1, ty1, tx1 - Math.sin(fl + 0.3) * 3.4, ty1 + Math.cos(fl + 0.3) * 3.4, 1.45, JC.scarf, { spec: 0.2 });
    const arm = (sx, a) => { const hxp = sx + Math.sin(a) * 3.7, hyp = -10 + by + Math.cos(a) * 3.7; cCap(c, sx, -10 + by, hxp, hyp, 1.25, JC.body, { spec: 0.2 }); cE(c, hxp, hyp + 0.2, 1.5, 1.45, JC.hand, { spec: 0.35 }); };
    const leg = (hp, fx, fy) => { cCap(c, hp, -5.2 + by, fx, fy - 1.3, 1.4, JC.pants, { spec: 0.15 }); cE(c, fx + 0.8, fy - 1.05, 2.3, 1.4, JC.shoe, { spec: 0.35 }); };
    arm(-2.9, F[4]); leg(-1.5, F[0], F[1]); leg(1.5, F[2], F[3]);
    cLump(c, 0, -8 + by, 4.7, 4.4, JC.body, 0.08, { spec: 0.25, detail(k) { groove(k, (q) => { q.moveTo(-2.6, -9.6 + by); q.quadraticCurveTo(-1.6, -6.4 + by, -2.8, -4.2 + by); }, 0.4, 0.28); } });
    cE(c, 2.2, -8.3 + by, 0.75, 0.75, [244, 210, 92], { spec: 0.5, fp: 0 });
    arm(2.9, F[5]);
    cLump(c, 0.3, -11.4 + by, 6, 2.3, JC.scarf, 0.06, { spec: 0.3, detail(k) { for (const sx of [-3.6, -1.2, 1.2, 3.6]) groove(k, (q) => { q.moveTo(sx + 0.3, -13.4 + by); q.lineTo(sx - 0.2, -9.4 + by); }, 0.45, 0.25); } });
    cCap(c, 0.2, -27.4 + by, 1.4, -31.3 + by, 1.35, JC.stem, { spec: 0.25, cast: 0.3 });
    clay(c, (k) => pumpkinPath(k, hx0, hy0, hrx, hry), JC.pump, {
      b: [hx0, hy0, hrx, hry], spec: 0.55, gloss: 0.7, lit: 0.24, ao: 0.55, hi: [hx0 - 5, hy0 - 4.6, 4.4],
      detail(k) {
        for (const kk of [-0.66, -0.28, 0.28, 0.66]) groove(k, (q) => { q.moveTo(hx0 + kk * hrx * 0.25, hy0 - hry * 0.88); q.quadraticCurveTo(hx0 + kk * hrx * 1.15, hy0, hx0 + kk * hrx * 0.25, hy0 + hry * 0.92); }, 0.75, 0.3);
        const fx = hx0 + 2.4, cy = hy0, gg = glowGrad(k, fx - 0.4, cy + 1.2, 9.5);
        carve(k, (q) => { q.moveTo(fx - 3.9, cy - 5.9); q.lineTo(fx - 7, cy + 0.1); q.lineTo(fx - 0.9, cy + 0.2); q.closePath(); }, gg);
        carve(k, (q) => { q.moveTo(fx + 3.5, cy - 5.6); q.lineTo(fx + 0.9, cy + 0.1); q.lineTo(fx + 6.1, cy + 0.1); q.closePath(); }, gg);
        carve(k, (q) => { q.moveTo(fx - 7.3, cy + 2.4); q.quadraticCurveTo(fx - 0.5, cy + 11.8, fx + 6.5, cy + 2); q.lineTo(fx + 4.4, cy + 4.3); q.lineTo(fx + 2.9, cy + 2.9); q.lineTo(fx + 1.3, cy + 4.8); q.lineTo(fx - 0.5, cy + 3.3); q.lineTo(fx - 2.4, cy + 5); q.lineTo(fx - 4, cy + 3.4); q.lineTo(fx - 5.6, cy + 4.5); q.closePath(); }, gg);
      },
    });
    clay(c, (k) => leafPath(k, -0.4, -28.6 + by, -1.25, 5.6, 2.1), JC.leaf, { b: [-2.9, -29.4 + by, 2.9, 2.2], spec: 0.3, cast: 0.3 });
  }
  const CREEP = [[[134, 80, 172], [244, 232, 204]], [[178, 76, 142], [246, 226, 206]], [[104, 92, 190], [238, 232, 198]]];
  const LEAF = [96, 162, 70], ROOT = [228, 202, 160], BROW = [74, 40, 82];
  function enemyArt(c, fr, v) { // small melee enemy: two-tone turnip, smeared top layer, googly eyes, angry brows
    const [top, bot] = CREEP[v], st = [0, 1, 0, -1][fr], sw = [0, 0.09, 0, -0.09][fr];
    for (const [a, len, wid] of [[-0.85, 8, 2.5], [0.8, 7.8, 2.5], [-0.02, 10, 2.9]]) {
      const mx = 0.3 + Math.sin(a + sw) * len * 0.5, my = -19.6 - Math.cos(a + sw) * len * 0.5;
      clay(c, (k) => leafPath(k, 0.3, -19.6, a + sw, len, wid), LEAF, { b: [mx, my, len * 0.5, len * 0.5], spec: 0.25, cast: 0.3,
        detail(k) { groove(k, (q) => { q.moveTo(0.3, -19.6); q.lineTo(0.3 + Math.sin(a + sw) * len * 0.8, -19.6 - Math.cos(a + sw) * len * 0.8); }, 0.4, 0.3); } });
    }
    const lift = (s) => Math.max(0, s) * 1.6;
    cCap(c, -3, -4.8, -3.3 + st * 0.9, -1.2 - lift(st), 1.5, ROOT, { spec: 0.2 });
    cCap(c, 3, -4.8, 3.3 - st * 0.9, -1.2 - lift(-st), 1.5, ROOT, { spec: 0.2 });
    clay(c, (k) => turnipPath(k, 0, -21.6, -2.6, 10.4), bot, { b: [0, -12, 10.4, 9.6], spec: 0.35, lit: 0.12,
      detail(k) {
        const wav = (q) => { q.moveTo(-14, -30); q.lineTo(14, -30); q.lineTo(14, -10.6); for (let x = 14; x >= -14; x--) q.lineTo(x, -10.8 + Math.sin(x * 0.85 + 0.6 + v) * 0.9 + (x < 0 ? 0.4 : 0)); q.closePath(); };
        clay(k, wav, top, { b: [0, -17.5, 10.4, 6.5], cast: 0.35, spec: 0.38, ao: 0.4 });
      } });
    const j = [0, 0.2, 0, -0.15][fr];
    eye(c, 1, -13.4, 2.5, 2.8, 1.8 + j, -12.9, 1.25); eye(c, 6.4, -13.2, 2.3, 2.7, 7.1 + j, -12.7, 1.2);
    cCap(c, -1.7, -17.5, 3, -15.8, 0.75, BROW, { spec: 0.3, cast: 0.5 }); cCap(c, 4.6, -15.7, 8.9, -17.3, 0.72, BROW, { spec: 0.3, cast: 0.5 });
    groove(c, (q) => { q.arc(4, -6, 2.2, PI * 1.18, PI * 1.82); }, 0.7, 0.55);
  }
  const GHOST = [234, 240, 252], GHOST_D = [150, 164, 206];
  function ghostArt(c, fr) { // fast floating enemy: glossy white clay sheet with wavy hem and stubby arms
    const ph = (fr / 4) * TAU;
    const path = (k) => { k.moveTo(-7.8, -7.4); k.bezierCurveTo(-8.8, -15.5, -6.4, -24.4, 0.6, -24.4); k.bezierCurveTo(7.8, -24.4, 9.3, -15.6, 8.3, -5); const xs = [8.3, 4.6, 0.8, -3];
      for (let i = 0; i < 3; i++) k.quadraticCurveTo((xs[i] + xs[i + 1]) / 2, -0.4 + Math.sin(ph + i * 1.9 + 1.2), xs[i + 1], -4.6 + Math.sin(ph + i * 1.9) * 0.6);
      const tw = Math.sin(ph + 2.4); k.quadraticCurveTo(-6, 0.4 + tw * 0.6, -11.6 + tw * 0.8, -2.6 + tw * 0.9); k.quadraticCurveTo(-9.4, -4.6, -7.8, -7.4); k.closePath(); };
    cE(c, -7.6, -12.6 + Math.sin(ph) * 0.6, 2.3, 1.7, GHOST, { dark: GHOST_D, cast: 0, spec: 0.4 });
    clay(c, path, GHOST, { b: [0, -13, 9, 11.5], dark: GHOST_D, spec: 0.55, gloss: 0.5, lit: 0.3, ao: 0.42, rim: 0.3,
      detail(k) {
        k.fillStyle = '#3a3c62'; k.beginPath(); k.ellipse(1.6, -16.4, 1.7, 2.4, 0.35, 0, TAU); k.fill(); k.beginPath(); k.ellipse(6, -16.2, 1.6, 2.3, -0.35, 0, TAU); k.fill();
        k.fillStyle = 'rgba(255,255,255,0.9)'; k.beginPath(); k.arc(1.3, -17.4, 0.5, 0, TAU); k.arc(5.7, -17.2, 0.48, 0, TAU); k.fill();
        k.fillStyle = '#34345a'; k.beginPath(); k.ellipse(3.9, -10, 1.7, 2.3 + 0.35 * Math.sin(ph * 2), 0, 0, TAU); k.fill();
      } });
    cE(c, 8.8, -12.6 + Math.sin(ph + 1.3) * 0.7, 2.6, 1.8, GHOST, { dark: GHOST_D, spec: 0.4, cast: 0.3 });
  }
  function treeArt(c) { // prop: capsule trunk with grooves + five lumpy foliage balls + glossy red berries
    const col = [96, 158, 74], TR = [134, 94, 64];
    cE(c, -4.2, -1.4, 3.2, 1.7, TR, { cast: 0, spec: 0.15 }); cE(c, 4, -1.3, 3, 1.6, TR, { cast: 0, spec: 0.15 });
    cCap(c, 0, -1.5, 0.6, -30, 3.4, TR, { spec: 0.15, detail(k) { for (const x of [-1.6, 0.2, 1.8]) groove(k, (q) => { q.moveTo(x, -3); q.quadraticCurveTo(x + 0.8, -14, x + 0.2, -26); }, 0.55, 0.28); } });
    [[0, -51, 11], [-10.5, -42, 9], [10.5, -43, 9.5], [-4.5, -36.5, 8.5], [6, -35.5, 8]].forEach((bb, i) => cLump(c, bb[0], bb[1], bb[2], bb[2] * 0.92, i % 2 ? lighten(col, 0.06) : darken(col, 0.05), 0.1, { spec: 0.28, cast: i ? 0.42 : 0.3 }));
    for (const p of [[-8, -40], [7, -47], [3, -33], [-3, -52]]) cE(c, p[0], p[1], 1.25, 1.2, [216, 62, 48], { spec: 0.6, gloss: 0.5, cast: 0.4, fp: 0 });
  }
  function mushArt(c) {
    cCap(c, 0, -0.6, 0.3, -7.5, 2, [242, 228, 202], { spec: 0.25 });
    clay(c, (k) => { k.moveTo(-7.2, -7.4); k.bezierCurveTo(-7.2, -15.6, 7.2, -15.6, 7.2, -7.4); k.quadraticCurveTo(0, -5.4, -7.2, -7.4); k.closePath(); }, [208, 66, 50], { b: [0, -10.5, 7.2, 4.6], spec: 0.45, gloss: 0.4, cast: 0.45 });
    for (const p of [[-3.6, -10], [1.2, -12.4], [4, -9.4], [-0.8, -8.6]]) cE(c, p[0], p[1], 1.05, 0.85, [252, 246, 236], { spec: 0.35, cast: 0.35, fp: 0 });
  }
  const gemArt = (c) => clay(c, (k) => { k.moveTo(0, -2.1); k.bezierCurveTo(1.7, -1.3, 1.6, 1.5, 0, 1.9); k.bezierCurveTo(-1.6, 1.5, -1.7, -1.3, 0, -2.1); k.closePath(); }, [255, 202, 64], { b: [0, 0, 1.7, 2], cast: 0, spec: 0.7, gloss: 0.85, lit: 0.35, ao: 0.35, fp: 0.5, dark: [196, 120, 30] });
  const seedArt = (c) => clay(c, (k) => { k.moveTo(4.2, 0); k.bezierCurveTo(2.6, -2.7, -3.4, -3, -3.4, 0); k.bezierCurveTo(-3.4, 3, 2.6, 2.7, 4.2, 0); k.closePath(); }, [248, 232, 190], { b: [0.4, 0, 3.8, 2.8], cast: 0, spec: 0.55, gloss: 0.6, ao: 0.4, dark: [178, 146, 96] });
  function radial(w, stops) { const c = canvas(w, w), x = c.getContext('2d'), g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); for (const s of stops) g.addColorStop(s[0], s[1]); x.fillStyle = g; x.fillRect(0, 0, w, w); return c; }

  let SPR = null;
  function bake(h) {
    K = Math.max(3, Math.min(5, Math.round((h / 360) * 1.2)));
    FPC = makeFingerprint();
    SPR = { K, hero: [], enemy: [], ghost: [] };
    for (let f = 0; f < 5; f++) SPR.hero.push(build([-15, -34, 15, 2.5], (c) => heroArt(c, f), 100 + f));
    for (let v = 0; v < 3; v++) SPR.enemy.push([0, 1, 2, 3].map((f) => build([-14, -32, 14, 2.5], (c) => enemyArt(c, f, v), 200 + v * 10 + f)));
    SPR.ghost = [0, 1, 2, 3].map((f) => build([-15, -28, 14, 2.5], (c) => ghostArt(c, f), 300 + f));
    SPR.tree = build([-24, -64, 24, 3], treeArt, 900); SPR.mush = build([-10, -16, 10, 2], mushArt, 901);
    SPR.gem = build([-3, -3.4, 3, 3.4], gemArt, 501); SPR.seed = build([-4.4, -3.4, 5, 3.4], seedArt, 503);
    SPR.ball = CREEP.map((cc, i) => build([-2.4, -2.4, 2.4, 2.4], (c) => cE(c, 0, 0, 2, 1.85, cc[0], { cast: 0, spec: 0.45, fp: 0.6, ao: 0.45 }), 600 + i));
    SPR.shadow = radial(64, [[0, 'rgba(44,24,16,0.5)'], [0.45, 'rgba(44,24,16,0.34)'], [1, 'rgba(44,24,16,0)']]);
    SPR.glow = radial(64, [[0, 'rgba(255,214,120,0.85)'], [0.35, 'rgba(255,170,70,0.35)'], [1, 'rgba(255,140,40,0)']]);
  }

  /* ---------- ground: raised clay sheets with SDF bevel + cast shadow, lumpy height texture, imprinted decals ---------- */
  const LAY = [{ c: [152, 108, 74], m: 1.1 }, { c: [102, 80, 126], m: 1 }, { c: [126, 186, 210], m: 0.35, sunk: true }, { c: [214, 162, 98], m: 0.9 }];
  const MEAD_A = [118, 164, 84], MEAD_B = [140, 172, 90], BW = 3.0, SW = 3.4, LX = -0.42, LY = -0.907;
  function fields(x, y, out) { // signed "distance-like" fields in world units, >0 = inside the sheet
    const n = (fbm(x / 140, y / 140, 11, 2) - 0.5);
    out[0] = 120 - Math.hypot((x + 330) * 0.8, y - 230) + n * 70;
    out[1] = x - 20 - 40 * Math.sin(y / 90 + 1) + n * 60;
    out[2] = (1 - Math.hypot((x - 170) / 135, (y + 5) / 72)) * 70 + n * 40;
    out[3] = 19 - Math.abs(x + 115 + y * 0.55 + 26 * Math.sin(y / 70)) + n * 8;
    out[4] = 1 + (vnoise(x / 300, y / 300, 606) - 0.5) * 0.09;
    const m = vnoise(x / 120, y / 120, 808); out[5] = m < 0.3 ? 0 : m > 0.7 ? 1 : (m - 0.3) / 0.4;
  }
  const FT = new Float32Array(6);
  function matAt(x, y) { fields(x, y, FT); for (let L = 3; L >= 0; L--) if (FT[L] > 0) return L + 1; return 0; }
  function matSafe(x, y, r) { const m = matAt(x, y); return matAt(x + r, y) !== m || matAt(x - r, y) !== m || matAt(x, y + r) !== m || matAt(x, y - r) !== m ? -1 : m; }
  let MOD = null; const MODW = 256, MODS = 2; // tileable lit height field, 2 texels per world unit
  function buildMod() {
    const N = MODW, h = new Float32Array(N * N); MOD = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) h[y * N + x] = fbm(x / 32, y / 32, 31, 3, 8) * 0.72 + fbm(x / 16, y / 16, 57, 2, 16) * 0.28;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) MOD[y * N + x] = (h[((y + N - 1) % N) * N + (x + N - 1) % N] - h[((y + 1) % N) * N + (x + 1) % N]) * 2.4 * 1.3 + (h[y * N + x] - 0.5) * 0.08 + (hash2(x, y, 5) - 0.5) * 0.008;
  }
  function imprint(c, path, w, a) { c.lineWidth = w; c.strokeStyle = 'rgba(52,26,12,' + a + ')'; c.beginPath(); path(c, 0); c.stroke(); c.lineWidth = w * 0.6; c.strokeStyle = 'rgba(255,246,222,' + a * 0.95 + ')'; c.beginPath(); path(c, w * 0.6); c.stroke(); }
  function bump(c, x, y, rx, ry, col) { // rolled pebble / flower centre
    c.fillStyle = 'rgba(46,26,14,0.26)'; c.beginPath(); c.ellipse(x + rx * 0.22, y + ry * 0.5, rx * 1.05, ry * 0.92, 0, 0, TAU); c.fill();
    const R = Math.max(rx, ry), g = c.createRadialGradient(x - rx * 0.3, y - ry * 0.45, R * 0.05, x, y, R * 1.1);
    g.addColorStop(0, rgbS(lighten(col, 0.25))); g.addColorStop(0.5, rgbS(col)); g.addColorStop(1, rgbS(darken(col, 0.3)));
    c.fillStyle = g; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,250,0.42)'; c.beginPath(); c.ellipse(x - rx * 0.32, y - ry * 0.42, rx * 0.3, ry * 0.2, -0.3, 0, TAU); c.fill();
  }
  function sausage(c, path, w, col) { // rolled clay snake: shadow, dark body, mid body, highlight streak
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.save(); c.translate(0.3, 0.55); c.strokeStyle = 'rgba(46,26,14,0.26)'; c.lineWidth = w * 1.1; c.beginPath(); path(c); c.stroke(); c.restore();
    c.strokeStyle = rgbS(darken(col, 0.2)); c.lineWidth = w; c.beginPath(); path(c); c.stroke();
    c.save(); c.translate(-0.08, -w * 0.12); c.strokeStyle = rgbS(col); c.lineWidth = w * 0.72; c.beginPath(); path(c); c.stroke();
    c.translate(-0.05, -w * 0.18); c.strokeStyle = rgbS(lighten(col, 0.35), 0.8); c.lineWidth = w * 0.25; c.beginPath(); path(c); c.stroke(); c.restore();
  }
  const FLOWER = [[250, 246, 236], [246, 160, 182], [252, 214, 90], [176, 150, 226]];
  function decals(c, x0, y0, x1, y1) {
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (let gy = Math.floor(y0 / 9); gy <= y1 / 9; gy++) for (let gx = Math.floor(x0 / 9); gx <= x1 / 9; gx++) {
      const r0 = hash2(gx, gy, 1), r1 = hash2(gx, gy, 2), r2 = hash2(gx, gy, 3), r3 = hash2(gx, gy, 4);
      if (r0 > 0.3) continue;
      const x = gx * 9 + hash2(gx, gy, 5) * 9, y = gy * 9 + hash2(gx, gy, 6) * 9, m = matSafe(x, y, 6), rr = rng((r1 * 1e9) | 0);
      if (m < 0) continue;
      if (m === 0) {
        if (r0 < 0.15) { const k = 3 + ((r1 * 3) | 0), base = r2 * 0.6 - 0.3, s = 0.9 + r3 * 0.5; // modelling-tool grass fan
          imprint(c, (q, o) => { for (let j = 0; j < k; j++) { const d = j - (k - 1) / 2, a = base + d * 0.32, l = (3 + rr() * 1.6) * s; q.moveTo(x + d * 0.7, y + o); q.quadraticCurveTo(x + Math.sin(a) * l * 0.4 + d * 0.8, y - l * 0.5 + o, x + Math.sin(a) * l + d * 0.5, y - Math.cos(a) * l + o); } }, 0.65, 0.16);
        } else if (r0 < 0.2) sausage(c, (q) => { q.moveTo(x - 0.8, y); q.quadraticCurveTo(x - 1.2, y - 1.8, x - 2.4, y - 3); q.moveTo(x, y); q.quadraticCurveTo(x + 0.2, y - 2.2, x - 0.1, y - 3.8); q.moveTo(x + 0.8, y); q.quadraticCurveTo(x + 1.3, y - 1.6, x + 2.5, y - 2.7); }, 1, r1 < 0.5 ? [140, 196, 92] : [108, 168, 74]);
        else if (r0 < 0.24) { const s = 0.9 + r2 * 0.35, petal = FLOWER[(r1 * 4) | 0], ph = rr() * TAU;
          c.fillStyle = 'rgba(46,26,14,0.22)'; c.beginPath(); c.ellipse(x + 0.4, y + 0.8, 2.3 * s, 1.6 * s, 0, 0, TAU); c.fill();
          for (let i = 0; i < 5; i++) { const a = ph + (i / 5) * TAU, px = x + Math.cos(a) * 1.25 * s, py = y + Math.sin(a) * 1.05 * s;
            c.fillStyle = rgbS(darken(petal, 0.18)); c.beginPath(); c.arc(px, py + 0.2, 0.95 * s, 0, TAU); c.fill();
            c.fillStyle = rgbS(petal); c.beginPath(); c.arc(px - 0.08, py - 0.06, 0.82 * s, 0, TAU); c.fill(); }
          bump(c, x, y, 0.85 * s, 0.8 * s, [246, 190, 60]);
        } else if (r0 < 0.26) bump(c, x, y, 1.6 + r2, 1.2 + r2 * 0.7, [150, 146, 150]);
      } else if (m === 1) {
        if (r0 < 0.13) bump(c, x, y, 1.3 + r2 * 1.5, 1 + r2 * 1.1, [[178, 132, 96], [126, 88, 62], [160, 150, 140], [196, 160, 120]][(r1 * 4) | 0]);
        else if (r0 < 0.16) { const a = r2 * TAU; sausage(c, (q) => { for (let j = 0; j <= 8; j++) { const t = j / 8 - 0.5, px = x + Math.cos(a) * t * 6.4 - Math.sin(a) * Math.sin(r3 * TAU + t * 6) * 0.8, py = y + Math.sin(a) * t * 3.8 + Math.cos(a) * Math.sin(r3 * TAU + t * 6) * 0.8; if (j) q.lineTo(px, py); else q.moveTo(px, py); } }, 1.5, [226, 140, 150]); }
      } else if (m === 2) {
        if (r0 < 0.08) imprint(c, (q, o) => { for (let j = 0; j <= 26; j++) { const t = j / 26, a = t * 3.2 * PI + r2 * TAU, rad = 0.4 + t * 3.6, px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad * 0.75 + o; if (j) q.lineTo(px, py); else q.moveTo(px, py); } }, 0.55, 0.16);
        else if (r0 < 0.13) bump(c, x, y, 1.2 + r2 * 1.3, 0.95 + r2, [[146, 118, 168], [84, 62, 104], [186, 160, 196]][(r1 * 3) | 0]);
      } else if (m === 3) {
        if (r0 < 0.035) { const s = 1 + r2 * 0.6, a = r3 * TAU; // lily pad
          c.fillStyle = 'rgba(30,60,80,0.22)'; c.beginPath(); c.ellipse(x + 0.5, y + 0.9, 4.2 * s, 2.8 * s, 0, 0, TAU); c.fill();
          c.fillStyle = 'rgb(88,150,74)'; c.beginPath(); c.ellipse(x, y, 4 * s, 2.6 * s, 0, 0, TAU); c.fill();
          c.fillStyle = 'rgb(112,174,86)'; c.beginPath(); c.ellipse(x - 0.3, y - 0.3, 3.4 * s, 2 * s, 0, 0, TAU); c.fill();
          c.strokeStyle = 'rgb(124,184,210)'; c.lineWidth = 0.8 * s; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 4 * s, y + Math.sin(a) * 2.6 * s); c.stroke();
        } else if (r0 < 0.07) imprint(c, (q, o) => { for (const rad of [2.2, 3.8]) { q.moveTo(x + rad, y + o); q.ellipse(x, y + o, rad, rad * 0.5, 0, 0, TAU); } }, 0.4, 0.1);
        else if (r0 < 0.09 && matSafe(x, y, 14) === 3) { const w = 9 + r2 * 7; // glossy studio-light reflection on the water
          c.save(); c.translate(x, y); c.rotate(-0.18); c.scale(1, 0.32); const g = c.createRadialGradient(0, 0, 0, 0, 0, w);
          g.addColorStop(0, 'rgba(255,255,255,0.42)'); g.addColorStop(0.5, 'rgba(240,252,255,0.16)'); g.addColorStop(1, 'rgba(240,252,255,0)');
          c.fillStyle = g; c.beginPath(); c.arc(0, 0, w, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.ellipse(-w * 0.2, -w * 0.05, w * 0.28, w * 0.18, 0, 0, TAU); c.fill(); c.restore(); }
      } else if (r0 < 0.1) { const rot = r2 * PI, s = 0.9 + r3 * 0.4; // thumbprint pressed into the path
        imprint(c, (q, o) => { for (let j = 1; j <= 5; j++) { const rad = j * 0.85 * s, a0 = rr() * TAU; q.moveTo(x + Math.cos(a0) * rad, y + o + Math.sin(a0) * rad); q.ellipse(x, y + o, rad, rad * 0.78, rot, a0, a0 + PI * (1.3 + rr() * 0.6)); } }, 0.42, 0.15);
      } else if (r0 < 0.17) bump(c, x, y, 1.1 + r2, 0.85 + r2 * 0.7, [[236, 190, 120], [190, 128, 70], [170, 162, 150]][(r1 * 3) | 0]);
    }
  }
  /** Bakes the ground for world rect centred on (0,0) at res px/unit (port of renderGroundChunk). */
  function bakeGround(W, H, res) {
    if (!MOD) buildMod();
    const wu = W / res, hu = H / res, wx = -wu / 2, wy = -hu / 2, GS = 4, cpx = GS * res, nx = Math.ceil(wu / GS) + 1, ny = Math.ceil(hu / GS) + 1;
    const F = new Float32Array(nx * ny * 6), tmp = new Float32Array(6);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { fields(wx + i * GS, wy + j * GS, tmp); F.set(tmp, (j * nx + i) * 6); }
    const c = canvas(W, H), ctx = c.getContext('2d'), img = ctx.createImageData(c.width, c.height), d = img.data, bwPx = BW * res, swPx = SW * res;
    for (let py = 0; py < c.height; py++) {
      const gy = Math.min(ny - 2, Math.floor((py + 0.5) / cpx)), v = (py + 0.5) / cpx - gy, row = ((Math.floor((wy + (py + 0.5) / res) * MODS) % MODW) + MODW) % MODW * MODW;
      for (let px = 0; px < c.width; px++) {
        const gx = Math.min(nx - 2, Math.floor((px + 0.5) / cpx)), u = (px + 0.5) / cpx - gx;
        const o00 = (gy * nx + gx) * 6, o10 = o00 + 6, o01 = o00 + nx * 6, o11 = o01 + 6, bl = (k) => { const s0 = F[o00 + k] + (F[o10 + k] - F[o00 + k]) * u, s1 = F[o01 + k] + (F[o11 + k] - F[o01 + k]) * u; return s0 + (s1 - s0) * v; };
        const mead = bl(5), tint = bl(4);
        let r = MEAD_A[0] + (MEAD_B[0] - MEAD_A[0]) * mead, g = MEAD_A[1] + (MEAD_B[1] - MEAD_A[1]) * mead, b = MEAD_A[2] + (MEAD_B[2] - MEAD_A[2]) * mead, am = 1;
        for (let L = 0; L < 4; L++) {
          const A = F[o00 + L], B = F[o10 + L], C = F[o01 + L], D = F[o11 + L], s = bl(L);
          const du = (B - A) * (1 - v) + (D - C) * v, dv = (C - A) * (1 - u) + (D - B) * u, gm = Math.sqrt(du * du + dv * dv), gl = gm / cpx;
          const dist = gl > 1e-9 ? s / gl : s > 0 ? 99 : -99, ld = gm > 1e-9 ? -(du * LX + dv * LY) / gm : 0, lay = LAY[L];
          if (dist < -(swPx + 2)) continue;
          if (!lay.sunk) {
            if (dist < 0.5) { let sh = 1 + dist / swPx; if (sh > 0) { sh = Math.min(1, sh); const k = 0.4 * sh * sh * (0.35 + 0.65 * (ld < 0 ? -ld : 0)); r *= 1 - k; g *= 1 - k; b *= 1 - k; } } // cast shadow below the sheet edge
            if (dist > -0.5) { const cov = Math.min(1, dist + 0.5); let p = 1 - dist / bwPx; p = p < 0 ? 0 : p > 1 ? 1 : p; const cr = (p - 0.55) / 0.22;
              const f = 1 + ld * 0.42 * p * p + 0.09 * Math.exp(-cr * cr) - 0.03 * p * p * p; // lit bevel + bright crest line
              r += (lay.c[0] * f - r) * cov; g += (lay.c[1] * f - g) * cov; b += (lay.c[2] * f - b) * cov; am += (lay.m - am) * cov; }
          } else {
            if (dist < 0 && dist > -bwPx * 0.7) { const q = 1 + dist / (bwPx * 0.7), f = 1 - 0.1 * q * q; r *= f; g *= f; b *= f; } // wet bank
            if (dist > -0.5) { const cov = Math.min(1, dist + 0.5); let p = 1 - dist / (bwPx * 1.3); p = p < 0 ? 0 : p > 1 ? 1 : p; const pp = p * p;
              const f = 1 - (ld > 0 ? ld : 0) * 0.34 * pp + (ld < 0 ? -ld : 0) * 0.16 * pp - 0.05 * pp; // sunken: inverted bevel
              r += (lay.c[0] * f - r) * cov; g += (lay.c[1] * f - g) * cov; b += (lay.c[2] * f - b) * cov; am += (lay.m - am) * cov; }
          }
        }
        const col = ((Math.floor((wx + (px + 0.5) / res) * MODS) % MODW) + MODW) % MODW, m = (1 + MOD[row + col] * am) * tint, o = (py * c.width + px) * 4;
        d[o] = r * m; d[o + 1] = g * m; d[o + 2] = b * m; d[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    ctx.setTransform(res, 0, 0, res, W / 2, H / 2); decals(ctx, wx, wy, -wx, -wy);
    return c;
  }

  /* ---------- public drawers ---------- */
  const soft = (ctx, s, x, y, rx, ry) => ctx.drawImage(s, x - rx, y - ry, rx * 2, ry * 2);
  /** Draws the hero with feet at (x, y). t = seconds, facing = 1 | -1. Steps at 12 fps with per-step "boil" jitter. */
  function drawHero(ctx, x, y, t, facing, moving) {
    if (!SPR) bake(360);
    const stp = Math.floor(t * 12), f = Math.floor(t * 8) & 3, fr = moving === false ? 0 : 1 + f;
    let sx = f === 0 || f === 2 ? 1.04 : 0.98, sy = f === 0 || f === 2 ? 0.96 : 1.03;
    sx *= (1 + (hash2(stp, 77, 3) - 0.5) * 0.02) * 1.06; sy *= (1 - (hash2(stp, 77, 3) - 0.5) * 0.018) * 1.06;
    soft(ctx, SPR.shadow, x + 0.8, y + 0.4, 10.2, 3.6);
    blit(ctx, SPR.hero[fr], x, y, sx, sy, 0.035 * facing + (hash2(stp, 78, 3) - 0.5) * 0.025, facing < 0);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.3 + 0.08 * Math.sin(stp * 1.3); // candle glow from the carved face
    soft(ctx, SPR.glow, x + 2.6 * facing, y - 18, 11, 10); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  /** Draws a typical enemy with feet at (x, y). kind: 'turnip' (default, variant 0-2) | 'ghost'. */
  function drawEnemy(ctx, x, y, t, seed, kind) {
    if (!SPR) bake(360);
    seed = seed || 0; const stp = Math.floor(t * 12), bj = hash2(stp, (seed * 9973) | 0, 11) - 0.5, bj2 = hash2(stp, (seed * 9973) | 0, 12) - 0.5, scl = 0.94 + seed * 0.12;
    if (kind === 'ghost') {
      soft(ctx, SPR.shadow, x, y + 0.4, 6.2, 2.3);
      ctx.globalAlpha = 0.84; blit(ctx, SPR.ghost[Math.floor((t * 1.8 + seed * 4) * 4) & 3], x, y - 5 - Math.sin(stp / 12 * 2.4 + seed * 12) * 1.6, scl, scl, bj2 * 0.04, seed > 0.5); ctx.globalAlpha = 1;
      return;
    }
    const f = Math.floor(t * 3.2 + seed * 16) & 3, s = scl * 0.92;
    soft(ctx, SPR.shadow, x + 0.7, y + 0.4, 8.8, 3);
    blit(ctx, SPR.enemy[Math.floor(seed * 3) % 3][f], x, y - (f & 1 ? 1.1 : 0), s * (f & 1 ? 1 : 1.05) * (1 + bj * 0.035), s * (f & 1 ? 1.03 : 0.95) * (1 - bj * 0.03), [0, 0.07, 0, -0.07][f] + bj2 * 0.04, seed > 0.5);
  }

  let GROUND = null, GKEY = '';
  /** Paints a complete preview scene into a w×h canvas at time t (seconds): ground, hero, enemies, an effect. */
  function draw(ctx, w, h, t) {
    const s = h / 360;
    if (!SPR || SPR.K !== Math.max(3, Math.min(5, Math.round(s * 1.2)))) bake(h);
    const gres = Math.min(s, 2), key = w + 'x' + h;
    if (GKEY !== key) { GROUND = bakeGround(Math.ceil(w / s * gres), Math.ceil(h / s * gres), gres); GKEY = key; }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#78a854'; ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(GROUND, 0, 0, w, h);
    ctx.setTransform(s, 0, 0, s, w / 2, h / 2);
    const q = Math.floor(t * 12) / 12, hx = 40 + Math.sin(t * 0.6) * 6, hy = 40;
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.16; soft(ctx, SPR.glow, hx, hy, 34, 18); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    const gems = [[100, 60], [118, 46], [92, 82], [-60, 70]];
    for (const [gx, gy] of gems) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5; soft(ctx, SPR.glow, gx, gy - 2.5, 5.5, 4.4); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      soft(ctx, SPR.shadow, gx, gy, 2.6, 1.1); blit(ctx, SPR.gem, gx, gy - 3 - Math.sin(q * 4 + gx) * 1, 1, 1); }
    const actors = [
      { y: -60, d: () => { soft(ctx, SPR.shadow, -230 + 1.4, -60 + 0.4, 17, 5.5); blit(ctx, SPR.tree, -230, -60, 1, 1); } },
      { y: 120, d: () => { soft(ctx, SPR.shadow, -175, 120.4, 17, 5.5); blit(ctx, SPR.tree, -175, 120, 1, 1, 0, true); } },
      { y: -120, d: () => { soft(ctx, SPR.shadow, 70, -119.6, 7, 2.6); blit(ctx, SPR.mush, 70, -120, 1, 1); } },
      { y: hy, d: () => drawHero(ctx, hx, hy, t, 1) },
    ];
    [[150, 70, 0.1], [205, 110, 0.45], [250, 70, 0.8], [180, 150, 0.2], [270, 140, 0.62], [235, 165, 0.95], [-120, -40, 0.3], [130, -100, 0.7]].forEach(([ex, ey, sd]) => actors.push({ y: ey, d: () => drawEnemy(ctx, ex, ey, t, sd) }));
    [[-150, 30, 0.2], [220, -60, 0.7], [-20, 120, 0.55]].forEach(([ex, ey, sd]) => actors.push({ y: ey, d: () => drawEnemy(ctx, ex, ey + Math.sin(t + sd * 9) * 3, t, sd, 'ghost') }));
    actors.sort((a, b) => a.y - b.y).forEach((a) => a.d());
    const pp = ((t * 1.4) % 1), px = hx + 10 + pp * 85, py = hy - 12 + pp * 18, ang = Math.atan2(18, 85); // seed projectile with soft streak
    soft(ctx, SPR.shadow, px, py + 6, 2.6, 1);
    ctx.save(); ctx.translate(px, py); ctx.rotate(ang); const sg = ctx.createLinearGradient(-2, 0, -13, 0); sg.addColorStop(0, 'rgba(255,244,214,0.75)'); sg.addColorStop(1, 'rgba(255,244,214,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(-2, -1.5); ctx.quadraticCurveTo(-8, -0.6, -13.5, 0); ctx.quadraticCurveTo(-8, 0.6, -2, 1.5); ctx.closePath(); ctx.fill(); ctx.restore();
    blit(ctx, SPR.seed, px, py, 0.85, 0.85 * (0.6 + 0.4 * Math.abs(Math.cos(Math.floor(t * 20) / 2))), ang);
    for (let i = 0; i < 5; i++) { const a = i * 1.3 + 0.4, k = (t * 0.9 + i * 0.13) % 1; // clay crumbs bouncing away from a hit
      const z = Math.max(0, 14 + 60 * k - 150 * k * k), bx = 205 + Math.cos(a) * 30 * k, by = 110 + Math.sin(a) * 14 * k - z, sq = z < 0.5;
      blit(ctx, SPR.ball[i % 3], bx, by - 6, 0.8 * (sq ? 1.25 : 1), 0.8 * (sq ? 0.72 : 1)); }
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 * (1 - ((t * 0.9) % 1)); soft(ctx, SPR.glow, 205, 96, 9, 9); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    // damage number as extruded clay letters (Chewy)
    ctx.save(); ctx.translate(205, 78 - ((t * 0.9) % 1) * 8); ctx.rotate(-0.08); ctx.font = '13px Chewy, "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(40,18,8,0.45)'; ctx.shadowBlur = 1.6; ctx.shadowOffsetY = 1; ctx.fillStyle = rgbS(darken([178, 74, 22], 0.15)); ctx.fillText('34', 0, 1.7); ctx.shadowColor = 'transparent';
    for (let i = 3; i >= 1; i--) { ctx.fillStyle = rgbS(mix([178, 74, 22], [255, 168, 46], (3 - i) * 0.12)); ctx.fillText('34', 0, 0.45 * i); }
    const tg = ctx.createLinearGradient(0, -6, 0, 5); tg.addColorStop(0, rgbS(lighten([255, 168, 46], 0.45))); tg.addColorStop(0.5, '#ffa82e'); tg.addColorStop(1, rgbS(darken([255, 168, 46], 0.12)));
    ctx.fillStyle = tg; ctx.fillText('34', 0, 0); ctx.restore();
    // screen overlay: warm studio vignette + soft top light (drawn in screen space)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.save(); ctx.translate(w / 2, h * 0.51); ctx.scale(1, 0.62); const vg = ctx.createRadialGradient(0, 0, w * 0.22, 0, 0, w * 0.67);
    vg.addColorStop(0, 'rgba(70,34,16,0)'); vg.addColorStop(0.6, 'rgba(70,34,16,0.12)'); vg.addColorStop(1, 'rgba(56,26,12,0.46)'); ctx.fillStyle = vg; ctx.fillRect(-w, -h * 2, w * 2, h * 4); ctx.restore();
    let lg = ctx.createLinearGradient(0, 0, 0, h * 0.19); lg.addColorStop(0, 'rgba(255,232,206,0.24)'); lg.addColorStop(1, 'rgba(255,232,206,0)'); ctx.fillStyle = lg; ctx.fillRect(0, 0, w, h * 0.19);
    ctx.fillStyle = 'rgba(255,186,110,0.04)'; ctx.fillRect(0, 0, w, h);
    // HUD: clay pill panel with extruded Chewy timer
    const u = h / 900, pw = 186 * u, ph = 78 * u, pxl = w / 2 - pw / 2, pyt = 48 * u;
    ctx.save(); ctx.shadowColor = 'rgba(50,24,10,0.38)'; ctx.shadowBlur = 18 * u; ctx.shadowOffsetY = 13 * u; ctx.fillStyle = '#b98654';
    ctx.beginPath(); ctx.roundRect(pxl, pyt + 5 * u, pw, ph, 27 * u); ctx.fill(); ctx.restore();
    const pg = ctx.createRadialGradient(pxl + pw * 0.3, pyt + ph * 0.18, 0, pxl + pw * 0.3, pyt + ph * 0.18, pw * 0.9);
    pg.addColorStop(0, '#fff5e2'); pg.addColorStop(0.45, '#f5ddb8'); pg.addColorStop(1, '#e0b98a'); ctx.fillStyle = pg; ctx.beginPath(); ctx.roundRect(pxl, pyt, pw, ph, 27 * u); ctx.fill();
    ctx.font = 40 * u + 'px Chewy, "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    [['#8c3c0e', 5], ['#a84a12', 4], ['#c85e1a', 2], ['#f07a24', 0]].forEach(([c, d]) => { ctx.fillStyle = c; ctx.fillText('22:09', w / 2, pyt + 46 * u + d * u); });
    ctx.font = '800 ' + 12 * u + 'px "Baloo 2", sans-serif'; ctx.fillStyle = '#9a6a44'; ctx.fillText('UNTIL MIDNIGHT', w / 2, pyt + 66 * u);
  }

  const Starter = { id: 'clay', name: 'Clay World', palette: PALETTE, fonts: ['Chewy', 'Baloo 2:wght@500;600;700;800'], drawHero, drawEnemy, draw, clay };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['clay'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
