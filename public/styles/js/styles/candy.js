/* ============================================================================
   Süßes oder Saures (id: candy) – a glossy Halloween candy world.
   Everything is edible: hard-candy shine, gummy jelly, matte marshmallow,
   chocolate, frosting, licorice. Rendered (gradients, speculars, rim light)
   instead of flat vector; one soft cocoa silhouette outline keeps it readable.
   Ground: milk-chocolate floor (bar grid that melts into glossy swirls),
   mint frosting meadows with piped ridges and dripping glossy rims,
   pink strawberry sugar-sand with sparkle grains, dark cookie-crumb paths
   and sunken caramel pools. Per-pixel distance fields give clean edges.
   ========================================================================== */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2, PI = Math.PI;

  /* ------------------------------------------------------------------ palette */
  const OUT = '#3a1424';      // cocoa-plum silhouette outline
  const FLASH = '#fff3f8';    // sugar flash
  let K = 3;                  // sprite px per world unit
  const DK = 4;               // decal sprite px per world unit
  const SPR = {};
  const JACK_SCALE = 1.06;

  /* ================================================================ helpers */
  function rg(c, x0, y0, r0, x1, y1, r1, stops) {
    const g = c.createRadialGradient(x0, y0, r0, x1, y1, r1);
    for (const s of stops) g.addColorStop(s[0], s[1]);
    return g;
  }
  function lg(c, x0, y0, x1, y1, stops) {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    for (const s of stops) g.addColorStop(s[0], s[1]);
    return g;
  }
  /** glossy fill: radial gradient lit from the top-left. */
  function gloss(c, path, cx, cy, r, light, mid, dark) {
    c.beginPath(); path(c);
    c.fillStyle = rg(c, cx - r * 0.38, cy - r * 0.45, r * 0.05, cx, cy, r * 1.18, [[0, light], [0.5, mid], [1, dark]]);
    c.fill();
  }
  function spec(c, x, y, rx, ry, rot, a) {
    c.save();
    c.globalAlpha = a === undefined ? 0.9 : a;
    c.fillStyle = '#ffffff';
    c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); c.fill();
    c.restore();
  }
  function softSpec(c, x, y, r, a) {
    c.fillStyle = rg(c, x, y, 0, x, y, r, [[0, 'rgba(255,255,255,' + a + ')'], [1, 'rgba(255,255,255,0)']]);
    c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  /** rim light on the lower-right inside a path. */
  function rim(c, path, x0, y0, x1, y1, col, w) {
    c.save();
    c.beginPath(); path(c); c.clip();
    c.lineWidth = w;
    c.strokeStyle = lg(c, x0, y0, x1, y1, [[0, 'rgba(255,255,255,0)'], [0.6, 'rgba(255,255,255,0)'], [1, col]]);
    c.beginPath(); path(c); c.stroke();
    c.restore();
  }
  function inner(c, path, col, w) {
    c.save();
    c.beginPath(); path(c); c.clip();
    c.lineWidth = w; c.strokeStyle = col;
    c.beginPath(); path(c); c.stroke();
    c.restore();
  }
  function clipDo(c, path, fn) { c.save(); c.beginPath(); path(c); c.clip(); fn(c); c.restore(); }
  const E = (x, y, rx, ry, rot) => (c) => { rot = rot || 0; c.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot)); c.ellipse(x, y, rx, ry, rot, 0, TAU); };
  const CAP = (x1, y1, x2, y2, r) => (c) => {
    const a = Math.atan2(y2 - y1, x2 - x1);
    c.moveTo(x1 + Math.cos(a + PI / 2) * r, y1 + Math.sin(a + PI / 2) * r);
    c.arc(x1, y1, r, a + PI / 2, a + PI * 1.5);
    c.arc(x2, y2, r, a - PI / 2, a + PI / 2);
    c.closePath();
  };
  function blobPath(c, pts, ten) {
    ten = ten === undefined ? 1 : ten;
    const n = pts.length;
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      c.bezierCurveTo(p1[0] + ((p2[0] - p0[0]) / 6) * ten, p1[1] + ((p2[1] - p0[1]) / 6) * ten,
        p2[0] - ((p3[0] - p1[0]) / 6) * ten, p2[1] - ((p3[1] - p1[1]) / 6) * ten, p2[0], p2[1]);
    }
    c.closePath();
  }
  function roundPoly(c, pts, r) {
    const n = pts.length, a = pts[n - 1], b = pts[0];
    c.moveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; c.arcTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2, r); }
    c.closePath();
  }
  function rrect(c, x, y, w, h, r) { roundPoly(c, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], r); }
  function starPts(n, ro, ri, cx, cy, rot) {
    const pts = [];
    for (let i = 0; i < n * 2; i++) { const a = rot + (i / (n * 2)) * TAU, r = i & 1 ? ri : ro; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    return pts;
  }
  function pumpkinPath(c, cx, cy, rx, ry) {
    const N = 64;
    for (let i = 0; i <= N; i++) {
      const th = (i / N) * TAU, co = Math.cos(th), si = Math.sin(th);
      const x = Math.sign(co) * Math.pow(Math.abs(co), 0.85) * rx;
      let y = Math.sign(si) * Math.pow(Math.abs(si), 0.92) * ry;
      const top = Math.exp(-Math.pow((th - PI * 1.5) / 0.3, 2)), bot = Math.exp(-Math.pow((th - PI * 0.5) / 0.26, 2));
      y *= 1 - 0.15 * top - 0.07 * bot;
      if (i) c.lineTo(cx + x, cy + y); else c.moveTo(cx + x, cy + y);
    }
    c.closePath();
  }
  function turnipPath(c, cx, top, bottom, w) {
    const h = bottom - top;
    c.moveTo(cx, top);
    c.bezierCurveTo(cx + w * 0.42, top + h * 0.02, cx + w, top + h * 0.22, cx + w, top + h * 0.56);
    c.bezierCurveTo(cx + w, top + h * 0.86, cx + w * 0.55, bottom, cx, bottom);
    c.bezierCurveTo(cx - w * 0.55, bottom, cx - w, top + h * 0.86, cx - w, top + h * 0.56);
    c.bezierCurveTo(cx - w, top + h * 0.22, cx - w * 0.42, top + h * 0.02, cx, top);
    c.closePath();
  }
  function leafPath(c, bx, by, a, len, wid) {
    const dx = Math.sin(a), dy = -Math.cos(a), nx = -dy, ny = dx;
    const tx = bx + dx * len, ty = by + dy * len;
    c.moveTo(bx, by);
    c.bezierCurveTo(bx + dx * len * 0.22 + nx * wid, by + dy * len * 0.22 + ny * wid, tx - dx * len * 0.3 + nx * wid * 0.75, ty - dy * len * 0.3 + ny * wid * 0.75, tx, ty);
    c.bezierCurveTo(tx - dx * len * 0.3 - nx * wid * 0.75, ty - dy * len * 0.3 - ny * wid * 0.75, bx + dx * len * 0.22 - nx * wid, by + dy * len * 0.22 - ny * wid, bx, by);
    c.closePath();
  }
  const seedPath = (c) => { c.moveTo(4.4, 0); c.bezierCurveTo(2.6, -2.8, -3.5, -3.1, -3.5, 0); c.bezierCurveTo(-3.5, 3.1, 2.6, 2.8, 4.4, 0); c.closePath(); };

  /** diagonal candy stripes inside a clip. */
  function stripes(c, x0, y0, x1, y1, w, gap, col, ang) {
    c.save();
    c.fillStyle = col;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0);
    c.translate(cx, cy); c.rotate(ang === undefined ? -0.7 : ang);
    for (let x = -R; x < R; x += w + gap) c.fillRect(x, -R, w, R * 2);
    c.restore();
  }

  /** jelly / gummy shading for a path: translucent core + saturated edge + subsurface glow + sharp speculars. */
  function jelly(c, path, cx, cy, r, edgeCol, glowCol) {
    clipDo(c, path, (k) => {
      k.fillStyle = rg(k, cx - r * 0.1, cy - r * 0.05, r * 0.1, cx, cy, r * 1.1, [[0, 'rgba(255,255,255,0.28)'], [0.55, 'rgba(255,255,255,0.06)'], [1, 'rgba(255,255,255,0)']]);
      k.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4);
      k.lineWidth = r * 0.42; k.strokeStyle = edgeCol;
      k.beginPath(); path(k); k.stroke();
      if (glowCol) {
        k.fillStyle = rg(k, cx + r * 0.42, cy + r * 0.45, 0, cx + r * 0.42, cy + r * 0.45, r * 0.7, [[0, glowCol], [1, 'rgba(255,255,255,0)']]);
        k.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4);
      }
    });
  }

  /* --------------------------------------------------------- sprite builder */
  function addOutline(src, col, w) {
    const t = U.tint(src, col);
    const o = U.canvas(src.width, src.height);
    const n = w > 2.5 ? 16 : 12;
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU; o.ctx.drawImage(t, Math.cos(a) * w, Math.sin(a) * w); }
    o.ctx.drawImage(src, 0, 0);
    return o.c;
  }
  function build(box, fn, opt) {
    opt = opt || {};
    const k = opt.k || K;
    const m = opt.margin === undefined ? 1 : opt.margin;
    const l = box[0] - m, t = box[1] - m, r = box[2] + m, b = box[3] + m;
    const { c, ctx } = U.canvas((r - l) * k, (b - t) * k);
    ctx.scale(k, k); ctx.translate(-l, -t);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    fn(ctx);
    const cv = opt.ol === 0 ? c : addOutline(c, opt.olc || OUT, (opt.ol || 0.5) * k);
    return { c: cv, ox: -l * k, oy: -t * k, k };
  }
  function flipS(s) { return { c: U.flipX(s.c), ox: s.c.width - s.ox, oy: s.oy, k: s.k }; }
  function set4(box, fn, opt, post) {
    const n = build(box, fn, opt);
    const f = { c: U.tint(n.c, FLASH), ox: n.ox, oy: n.oy, k: n.k };
    if (post) post(n, box);
    return { n, f, nl: flipS(n), fl: flipS(f) };
  }
  function withFlip(s) { return { n: s, l: flipS(s) }; }
  function plain(box, fn, k) { return build(box, fn, { ol: 0, margin: 0, k }); }

  /* ============================================================ characters */
  // Jack frames: back foot x,y | front foot x,y | back arm, front arm | scarf phase
  const JACK_FR = [
    [-2.3, 0, 2.3, 0, 0.25, -0.25, 0.0],
    [-3.7, -0.2, 3.9, -0.5, 0.9, -0.8, 1.6],
    [-2.0, -1.5, 2.9, -2.1, 0.35, -0.15, 3.2],
    [2.7, -0.6, -1.3, -0.2, -0.75, 0.85, 4.8],
  ];
  const LIC = ['#6a4a66', '#2c1a2a', '#120810'];   // licorice
  const SCARF = ['#3fd6c1', '#1fa596'];
  function licorice(c, path, cx, cy, r) {
    gloss(c, path, cx, cy, r, LIC[0], LIC[1], LIC[2]);
    rim(c, path, cx - r, cy - r, cx + r, cy + r, 'rgba(190,130,200,0.55)', r * 0.5);
  }
  function scarfFill(c, path, x0, y0, x1, y1, ang) {
    c.beginPath(); path(c);
    c.fillStyle = lg(c, x0, y0, x1, y1, [[0, SCARF[0]], [1, SCARF[1]]]); c.fill();
    clipDo(c, path, (k) => {
      stripes(k, x0 - 4, y0 - 4, x1 + 4, y1 + 4, 1.0, 1.3, 'rgba(255,255,255,0.92)', ang);
      k.fillStyle = lg(k, x0, y0, x0, y1, [[0, 'rgba(255,255,255,0.35)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,60,60,0.25)']]);
      k.fillRect(x0 - 5, y0 - 5, x1 - x0 + 10, y1 - y0 + 10);
    });
  }
  function caramelHole(c, path, bx, by, br) {
    c.beginPath(); path(c);
    c.fillStyle = '#7a2406'; c.fill();
    c.save(); c.beginPath(); path(c); c.clip();
    c.translate(0.2, 0.55);
    c.beginPath(); path(c);
    c.fillStyle = rg(c, bx, by, 0, bx, by, br, [[0, '#fffbd6'], [0.35, '#ffe07a'], [0.75, '#ffa12a'], [1, '#e2650e']]);
    c.fill();
    c.restore();
  }
  function jackHead(c, hurt) {
    const cx = 0.4, cy = -19.6, rx = 11.2, ry = 9.1;
    const hp = (k) => pumpkinPath(k, cx, cy, rx, ry);
    // stem: twisted green-apple candy stick
    const st = CAP(0.1, -27.0, 1.3, -31.2, 1.35);
    gloss(c, st, 0.6, -29, 2, '#c8f59a', '#62c043', '#2f7a2a');
    clipDo(c, st, (k) => stripes(k, -2, -33, 3, -26, 0.5, 0.9, 'rgba(255,255,255,0.55)', 0.6));
    // head body: hard candy
    gloss(c, hp, cx, cy, 11, '#ffd08a', '#ff8d1e', '#d24e0b');
    clipDo(c, hp, (k) => {
      // inner caramel light glowing through the candy
      k.fillStyle = rg(k, cx + 2.5, cy + 2.5, 0, cx + 2.5, cy + 2.5, 10, [[0, 'rgba(255,214,110,0.55)'], [1, 'rgba(255,214,110,0)']]);
      k.fillRect(cx - 12, cy - 10, 24, 20);
      // ribs
      k.lineWidth = 0.7;
      for (const s of [-0.7, -0.3, 0.3, 0.7]) {
        k.strokeStyle = 'rgba(196,72,8,0.55)';
        k.beginPath(); k.moveTo(cx + s * rx * 0.2, cy - ry * 0.9); k.quadraticCurveTo(cx + s * rx * 1.2, cy, cx + s * rx * 0.2, cy + ry * 0.94); k.stroke();
        k.strokeStyle = 'rgba(255,214,150,0.45)'; k.lineWidth = 0.45;
        k.beginPath(); k.moveTo(cx + s * rx * 0.2 - 0.6, cy - ry * 0.9); k.quadraticCurveTo(cx + s * rx * 1.2 - 0.7, cy, cx + s * rx * 0.2 - 0.6, cy + ry * 0.94); k.stroke();
        k.lineWidth = 0.7;
      }
    });
    rim(c, hp, cx - rx, cy - ry, cx + rx, cy + ry, 'rgba(255,236,150,0.9)', 2.2);
    // face
    const fx = cx + 2.2;
    if (!hurt) {
      const eyeL = (k) => roundPoly(k, [[fx - 3.9, cy - 5.9], [fx - 7.0, cy + 0.2], [fx - 0.9, cy + 0.2]], 0.8);
      const eyeR = (k) => roundPoly(k, [[fx + 3.6, cy - 5.6], [fx + 1.0, cy + 0.1], [fx + 6.1, cy + 0.1]], 0.75);
      caramelHole(c, eyeL, fx - 3.8, cy - 1.0, 4);
      caramelHole(c, eyeR, fx + 3.6, cy - 1.0, 3.6);
      const mouth = (k) => { k.moveTo(fx - 7.4, cy + 2.3); k.quadraticCurveTo(fx - 0.6, cy + 12.4, fx + 6.6, cy + 1.9); k.quadraticCurveTo(fx - 0.6, cy + 5.4, fx - 7.4, cy + 2.3); k.closePath(); };
      caramelHole(c, mouth, fx - 0.4, cy + 5, 7);
      clipDo(c, mouth, (k) => {
        k.fillStyle = '#ff9a2a';
        k.beginPath(); rrect(k, fx - 3.6, cy + 2.0, 2.2, 2.9, 0.4); rrect(k, fx + 1.3, cy + 1.8, 2.2, 2.8, 0.4); rrect(k, fx - 1.2, cy + 5.6, 2.1, 3.4, 0.4); k.fill();
      });
    } else {
      c.lineCap = 'round';
      const chev = (pts) => {
        c.strokeStyle = '#7a2406'; c.lineWidth = 1.9;
        c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[1][0], pts[1][1]); c.lineTo(pts[2][0], pts[2][1]); c.stroke();
        c.strokeStyle = '#ffe07a'; c.lineWidth = 0.8;
        c.beginPath(); c.moveTo(pts[0][0] + 0.1, pts[0][1] + 0.3); c.lineTo(pts[1][0] + 0.1, pts[1][1] + 0.3); c.lineTo(pts[2][0] + 0.1, pts[2][1] + 0.3); c.stroke();
      };
      chev([[fx - 5.8, cy - 4.0], [fx - 2.4, cy - 2.1], [fx - 5.8, cy - 0.2]]);
      chev([[fx + 5.3, cy - 4.0], [fx + 2.0, cy - 2.1], [fx + 5.3, cy - 0.2]]);
      caramelHole(c, (k) => k.ellipse(fx - 0.3, cy + 4.6, 2.4, 2.8, 0, 0, TAU), fx - 0.3, cy + 4.6, 3);
    }
    // hard-candy speculars
    spec(c, cx - 6.0, cy - 4.6, 2.9, 1.35, -0.6, 0.92);
    spec(c, cx - 3.0, cy - 6.9, 0.75, 0.6, 0, 0.95);
    spec(c, cx - 8.4, cy + 1.2, 0.6, 1.6, 0.25, 0.45);
    // jelly leaf
    const lf = (k) => leafPath(k, -0.4, -28.6, -1.2, 5.6, 2.1);
    gloss(c, lf, -3, -30, 4, '#b8f58a', '#56c23e', '#2c8a2e');
    spec(c, -3.6, -30.4, 1.3, 0.45, -0.3, 0.7);
    c.strokeStyle = '#2c8a2e'; c.lineWidth = 0.5;
    c.beginPath(); c.arc(3.5, -29.6, 1.3, PI * 0.9, PI * 2.6); c.stroke();
  }
  function jackParts(c, fr, hurt) {
    const F = JACK_FR[fr];
    // scarf tail
    const ang = [0.55, 1.0, 1.2, 0.9][fr], len = 7.6;
    const ax = -2.4, ay = -11.2, dx = -Math.sin(ang), dy = Math.cos(ang), nx = dy, ny = -dx;
    const wv = Math.sin(F[6] + 0.8) * 0.5, h0 = 1.45, h1 = 1.95;
    const sp = [
      [ax + nx * h0, ay + ny * h0], [ax + dx * len * 0.5 + nx * (h0 + 0.15) + nx * wv, ay + dy * len * 0.5 + ny * (h0 + 0.15) + ny * wv],
      [ax + dx * len + nx * h1, ay + dy * len + ny * h1], [ax + dx * len - nx * h1, ay + dy * len - ny * h1],
      [ax + dx * len * 0.5 - nx * (h0 + 0.15) + nx * wv, ay + dy * len * 0.5 - ny * (h0 + 0.15) + ny * wv], [ax - nx * h0, ay - ny * h0],
    ];
    scarfFill(c, (k) => blobPath(k, sp, 0.6), ax - 6, ay - 2, ax + 3, ay + 9, ang + 0.2);
    const arm = (sx, a) => {
      const hx = sx + Math.sin(a) * 3.4, hy = -10.0 + Math.cos(a) * 3.4;
      licorice(c, CAP(sx, -10.0, hx, hy, 1.15), (sx + hx) / 2, (hy - 10) / 2, 2);
      gloss(c, E(hx, hy, 1.55, 1.5), hx, hy, 1.6, '#ffffff', '#fbeef6', '#d9c2d6');
    };
    const leg = (hx, fx, fy) => {
      licorice(c, CAP(hx, -5.6, fx, fy - 1.3, 1.35), (hx + fx) / 2, -3.5, 2.5);
      const sh = E(fx + 0.7, fy - 1.05, 2.1, 1.35);
      gloss(c, sh, fx + 0.7, fy - 1.05, 2.2, '#ff8fa8', '#e8304f', '#8f0f2a');
      spec(c, fx, fy - 1.7, 0.75, 0.32, 0, 0.85);
    };
    arm(-3.0, F[4]);
    leg(-1.6, F[0], F[1]);
    leg(1.6, F[2], F[3]);
    const body = E(0, -8.3, 4.5, 4.4);
    licorice(c, body, 0, -8.3, 4.6);
    clipDo(c, body, (k) => { // licorice twist grooves
      k.strokeStyle = 'rgba(160,110,170,0.35)'; k.lineWidth = 0.35;
      for (let i = -3; i <= 3; i++) { k.beginPath(); k.moveTo(-5 + i * 2, -3.5); k.lineTo(-1 + i * 2, -13); k.stroke(); }
    });
    spec(c, -1.8, -10.6, 1.4, 0.6, -0.6, 0.55);
    // candy buttons
    for (const [bx, by, col] of [[2.0, -7.6, '#ffd43f'], [2.1, -5.4, '#ff5c8a']]) { gloss(c, E(bx, by, 0.65, 0.65), bx, by, 0.7, '#ffffff', col, col); }
    arm(3.0, F[5]);
    scarfFill(c, E(0.3, -11.0, 5.7, 2.3), -5.4, -13.3, 6, -8.7, 0.9);
    jackHead(c, hurt);
  }

  const CREEP = [
    { hi: '#d9a2ff', top: '#9443d8', dk: '#56168f', edge: 'rgba(80,10,140,0.55)', glow: 'rgba(255,170,255,0.55)' },
    { hi: '#ffa6d2', top: '#d83a8e', dk: '#86104f', edge: 'rgba(140,10,70,0.5)', glow: 'rgba(255,190,220,0.6)' },
    { hi: '#b8b0ff', top: '#5b52e0', dk: '#262092', edge: 'rgba(30,20,140,0.55)', glow: 'rgba(190,190,255,0.6)' },
  ];
  function jellyLeaf(c, bx, by, a, len, wid) {
    const p = (k) => leafPath(k, bx, by, a, len, wid);
    const tx = bx + Math.sin(a) * len * 0.5, ty = by - Math.cos(a) * len * 0.5;
    gloss(c, p, tx, ty, len * 0.6, '#c9ff9e', '#55cc48', '#22852e');
    jelly(c, p, tx, ty, len * 0.5, 'rgba(20,110,40,0.35)');
    c.strokeStyle = 'rgba(30,120,50,0.6)'; c.lineWidth = 0.4;
    c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + Math.sin(a) * len * 0.75, by - Math.cos(a) * len * 0.75); c.stroke();
    spec(c, tx - Math.cos(a) * wid * 0.4, ty - Math.sin(a) * wid * 0.4, len * 0.16, 0.45, a - PI / 2, 0.75);
  }
  function creeperParts(c, fr, v) {
    const col = CREEP[v];
    const stp = [0, 1, 0, -1][fr], sw = [0, 0.1, 0, -0.1][fr];
    jellyLeaf(c, -0.2, -19.6, -0.85 + sw, 8.2, 2.6);
    jellyLeaf(c, 0.6, -19.6, 0.8 + sw, 8.0, 2.6);
    jellyLeaf(c, 0.3, -19.8, -0.02 + sw, 10.2, 3.0);
    const lift = (s) => Math.max(0, s) * 1.5;
    for (const sgn of [-1, 1]) {
      const st = sgn < 0 ? stp : -stp;
      const p = CAP(3.0 * sgn, -4.8, (3.3 - st * 0.8) * sgn, -1.1 - lift(st), 1.45);
      gloss(c, p, 3 * sgn, -3, 2.2, '#ffffff', '#ffe9f2', '#e2b9cc');
    }
    const body = (k) => turnipPath(k, 0, -21.6, -2.6, 10.4);
    // two-layer gummy: coloured top, milky bottom
    c.beginPath(); body(c);
    c.fillStyle = rg(c, -3, -9, 1, 0, -10, 12, [[0, '#ffffff'], [0.6, '#fff1f8'], [1, '#e9c9dc']]); c.fill();
    clipDo(c, body, (k) => {
      k.beginPath(); k.moveTo(-14, -26); k.lineTo(14, -26); k.lineTo(14, -11.3);
      for (let x = 14; x >= -14; x -= 0.5) k.lineTo(x, -11.3 + 0.9 * Math.sin(x * 0.85 + 0.6));
      k.closePath();
      k.fillStyle = rg(k, -4.5, -18, 0.5, 0, -14, 12, [[0, col.hi], [0.5, col.top], [1, col.dk]]);
      k.fill();
      // seam highlight between layers
      k.strokeStyle = 'rgba(255,255,255,0.55)'; k.lineWidth = 0.45;
      k.beginPath(); for (let x = -14; x <= 14; x += 0.5) { const y = -11.0 + 0.9 * Math.sin(x * 0.85 + 0.6); if (x === -14) k.moveTo(x, y); else k.lineTo(x, y); } k.stroke();
    });
    jelly(c, body, 0, -12, 10.5, col.edge, col.glow);
    // face
    const j = [0, 0.18, 0, -0.12][fr];
    c.fillStyle = '#2a0f22';
    c.beginPath(); c.ellipse(1.6 + j, -13.2, 1.7, 2.1, 0, 0, TAU); c.ellipse(6.8 + j, -13.0, 1.6, 2.0, 0, 0, TAU); c.fill();
    c.fillStyle = '#ffe36e';
    c.beginPath(); c.arc(2.0 + j, -12.6, 0.6, 0, TAU); c.arc(7.2 + j, -12.4, 0.55, 0, TAU); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(1.1 + j, -14.0, 0.48, 0, TAU); c.arc(6.3 + j, -13.8, 0.45, 0, TAU); c.fill();
    c.strokeStyle = '#2a0f22'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(-1.4, -17.3); c.lineTo(3.2, -15.5); c.moveTo(5.0, -15.4); c.lineTo(9.0, -17.1); c.stroke();
    c.lineWidth = 0.8; c.strokeStyle = '#6a1f45';
    c.beginPath(); c.arc(4.2, -6.4, 1.9, PI * 1.2, PI * 1.8); c.stroke();
    // gummy speculars
    spec(c, -5.6, -16.8, 2.2, 1.0, -0.8, 0.95);
    spec(c, -3.4, -19.2, 0.6, 0.5, 0, 0.95);
    spec(c, -7.2, -9.0, 0.5, 1.4, 0.2, 0.55);
    spec(c, 6.8, -5.2, 1.2, 0.45, -0.5, 0.45);
  }

  function ghostPath(c, ph) {
    c.moveTo(-8.4, -5.2);
    c.bezierCurveTo(-9.8, -12, -7.0, -17.4, -3.4, -20.2);
    c.bezierCurveTo(-1.6, -21.8, -0.6, -23.6, -2.4, -26.2);
    c.bezierCurveTo(2.0, -25.8, 4.6, -22.8, 4.6, -20.4);
    c.bezierCurveTo(8.4, -17.6, 10.0, -11.6, 8.9, -5.0);
    const xs = [8.9, 4.5, 0.2, -4.2, -8.4];
    for (let i = 0; i < 4; i++) {
      const x0 = xs[i], x1 = xs[i + 1];
      c.quadraticCurveTo((x0 + x1) / 2, -0.4 + Math.sin(ph + i * 1.7) * 0.9, x1, i === 3 ? -5.2 : -4.3 + Math.sin(ph + i * 1.7 + 1) * 0.5);
    }
    c.closePath();
  }
  function marshmallow(c, path, cx, cy, r) {
    c.beginPath(); path(c);
    c.fillStyle = rg(c, cx - r * 0.35, cy - r * 0.5, r * 0.1, cx, cy, r * 1.2, [[0, '#ffffff'], [0.55, '#fbf5fb'], [1, '#dccbe4']]);
    c.fill();
  }
  function ghostParts(c, fr) {
    const ph = (fr / 4) * TAU;
    const armL = E(-8.6, -11.4 + Math.sin(ph) * 0.6, 2.4, 1.8, 0.5);
    marshmallow(c, armL, -8.6, -11.4, 2.4);
    const body = (k) => ghostPath(k, ph);
    marshmallow(c, body, 0, -13, 12);
    clipDo(c, body, (k) => {
      // toasted hem
      k.fillStyle = lg(k, 0, -6.5, 0, 0, [[0, 'rgba(240,200,150,0)'], [1, 'rgba(232,180,120,0.75)']]);
      k.fillRect(-12, -8, 24, 9);
      // piped meringue ridges
      for (const [y, w] of [[-8.2, 9.5], [-13.2, 9.2], [-18.0, 7.0], [-22.0, 4.2]]) {
        k.lineWidth = 1.1; k.strokeStyle = 'rgba(170,140,190,0.32)';
        k.beginPath(); k.ellipse(0.3, y, w, 2.2, 0.05, 0.08 * PI, 0.92 * PI); k.stroke();
        k.lineWidth = 0.7; k.strokeStyle = 'rgba(255,255,255,0.95)';
        k.beginPath(); k.ellipse(0.3, y - 0.9, w, 2.2, 0.05, 0.12 * PI, 0.75 * PI); k.stroke();
      }
    });
    softSpec(c, -3.5, -18.5, 4.5, 0.8);
    const armR = E(9.4, -12.2 + Math.sin(ph + 1.3) * 0.7, 2.7, 1.8, -0.3);
    marshmallow(c, armR, 9.4, -12.2, 2.6);
    c.strokeStyle = 'rgba(160,130,180,0.5)'; c.lineWidth = 0.4;
    c.beginPath(); c.ellipse(9.4, -12.2 + Math.sin(ph + 1.3) * 0.7, 2.7, 1.8, -0.3, 0.3, 2.6); c.stroke();
    // hollow hungry face
    c.fillStyle = '#3a1630';
    c.beginPath(); c.ellipse(1.4, -14.8, 1.55, 2.4, 0.18, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(5.8, -14.6, 1.45, 2.3, -0.18, 0, TAU); c.fill();
    c.fillStyle = '#9fe0ff';
    c.beginPath(); c.arc(1.2, -15.6, 0.45, 0, TAU); c.arc(5.6, -15.4, 0.42, 0, TAU); c.fill();
    const m = 0.35 * Math.sin(ph * 2);
    c.save();
    c.beginPath(); c.ellipse(3.8, -8.8, 2.4, 2.9 + m, 0, 0, TAU);
    c.fillStyle = '#3a1630'; c.fill(); c.clip();
    c.fillStyle = '#ff6f9c'; c.beginPath(); c.ellipse(4.1, -6.2 + m, 1.9, 1.3, 0, 0, TAU); c.fill();
    c.restore();
    // blush
    c.fillStyle = 'rgba(255,140,180,0.35)';
    c.beginPath(); c.ellipse(-1.2, -11.2, 1.4, 0.8, 0, 0, TAU); c.ellipse(8.2, -11.0, 1.2, 0.7, 0, 0, TAU); c.fill();
  }
  function ghostFade(s, box) {
    const ctx = s.c.getContext('2d');
    const y0 = (-8 - box[1] + 1) * K, y1 = (1 - box[1] + 1) * K;
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = g; ctx.fillRect(0, 0, s.c.width, s.c.height);
    ctx.globalCompositeOperation = 'source-over';
  }

  function chocolate(c, path, cx, cy, r) {
    gloss(c, path, cx, cy, r, '#9a5e3e', '#55291a', '#2a120a');
    rim(c, path, cx - r, cy - r, cx + r, cy + r, 'rgba(255,190,140,0.5)', r * 0.18);
  }
  function glowCrack(c, pts, w) {
    c.lineJoin = 'round'; c.lineCap = 'round';
    const draw = () => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); };
    c.strokeStyle = '#1a0805'; c.lineWidth = w * 1.9; draw();
    c.save(); c.shadowColor = 'rgba(255,170,40,0.95)'; c.shadowBlur = 3 * K;
    c.strokeStyle = '#ff9a1e'; c.lineWidth = w; draw();
    c.restore();
    c.strokeStyle = '#fff2a8'; c.lineWidth = w * 0.4; draw();
  }
  function colossusParts(c, fr) {
    const st = [0, 1, 0, -1][fr];
    const lift = (s) => Math.max(0, s) * 2.6;
    const top = -46.5, bot = -5.2, hw = 19.5;
    // jelly leaves
    jellyLeaf(c, -0.5, top + 3.0, -1.1 + st * 0.04, 13, 4.2);
    jellyLeaf(c, 1.0, top + 3.0, 1.05 + st * 0.04, 13.5, 4.3);
    jellyLeaf(c, 0.0, top + 2.6, -0.48 + st * 0.04, 16.5, 5.0);
    jellyLeaf(c, 0.6, top + 2.6, 0.5 + st * 0.04, 15.5, 4.8);
    jellyLeaf(c, 0.2, top + 2.4, 0.0 + st * 0.04, 18.5, 5.4);
    // legs (chocolate dipped roots)
    const legP = (hx, fx, fy) => {
      chocolate(c, CAP(hx, -9.5, fx, fy - 2.4, 3.5), (hx + fx) / 2, -6, 5);
      chocolate(c, E(fx + 0.8, fy - 1.6, 4.4, 2.1), fx + 0.8, fy - 1.6, 4.5);
    };
    legP(-7.5, -8.0 + st * 1.8, -lift(st));
    legP(7.5, 8.0 - st * 1.8, -lift(-st));
    chocolate(c, CAP(-16.0, -27.0, -21.4, -18.2 + st * 1.4, 3.1), -18.5, -22.5, 5);
    const body = (k) => turnipPath(k, 0, top, bot, hw);
    chocolate(c, body, 0, -26, 22);
    clipDo(c, body, (k) => {
      // broken shell: rutabaga flesh peeking out
      const chip = (q) => roundPoly(q, [[-15.5, -36.5], [-10.5, -39.4], [-7.2, -36.2], [-8.4, -32.0], [-12.0, -31.2], [-16.4, -32.8]], 0.8);
      k.beginPath(); chip(k);
      k.fillStyle = rg(k, -12.5, -36.5, 0.5, -11.5, -35, 6, [[0, '#e6b3ff'], [0.6, '#a454d8'], [1, '#6c2a9a']]); k.fill();
      k.strokeStyle = '#2a120a'; k.lineWidth = 0.9; k.stroke();
      // chocolate sheen band
      k.strokeStyle = 'rgba(255,220,190,0.22)'; k.lineWidth = 3.2;
      k.beginPath(); k.arc(2, -24, 17, PI * 1.05, PI * 1.45); k.stroke();
      // white chocolate drizzle (zig-zag)
      k.lineWidth = 1.25; k.strokeStyle = '#fff3e2';
      k.beginPath();
      for (let i = 0; i <= 12; i++) { const x = -12 + i * 2.1, y = (i & 1 ? -45.0 : -41.6) + Math.abs(i - 6) * 0.5; if (!i) k.moveTo(x, y); else k.lineTo(x, y); }
      k.stroke();
      k.lineWidth = 0.45; k.strokeStyle = 'rgba(190,150,120,0.8)';
      k.beginPath();
      for (let i = 0; i <= 12; i++) { const x = -12 + i * 2.1 + 0.25, y = (i & 1 ? -45.0 : -41.6) + Math.abs(i - 6) * 0.5 + 0.55; if (!i) k.moveTo(x, y); else k.lineTo(x, y); }
      k.stroke();
    });
    // caramel cracks
    glowCrack(c, [[-18.6, -24.5], [-15.8, -23.2], [-14.6, -20.4], [-11.4, -19.6], [-10.2, -16.8]], 0.7);
    glowCrack(c, [[-14.6, -20.4], [-15.4, -17.2]], 0.5);
    glowCrack(c, [[18.4, -14.0], [15.6, -12.8], [14.2, -10.2], [11.6, -9.4]], 0.65);
    glowCrack(c, [[-4.8, -6.4], [-3.0, -9.0], [-4.4, -11.4], [-1.8, -13.0]], 0.55);
    spec(c, -4.6, -38.6, 3.0, 1.2, -0.45, 0.7);
    spec(c, -1.4, -40.6, 0.8, 0.6, 0, 0.9);
    // front arm
    chocolate(c, CAP(16.2, -25.6, 22.6, -17.2 - st * 1.4, 3.2), 19.5, -21.5, 5);
    chocolate(c, E(23.4, -16.0 - st * 1.4, 2.7, 2.5), 23.4, -16, 3);
    // glowing caramel eyes + mouth
    c.save();
    c.shadowColor = 'rgba(255,160,40,1)'; c.shadowBlur = 4 * K;
    c.fillStyle = '#ffb02e';
    c.beginPath(); c.ellipse(2.0, -29.0, 3.0, 2.2, 0.1, 0, TAU); c.ellipse(11.6, -29.0, 2.6, 2.1, -0.1, 0, TAU); c.fill();
    c.restore();
    c.fillStyle = '#fff6c0';
    c.beginPath(); c.ellipse(2.4, -28.8, 1.3, 0.95, 0, 0, TAU); c.ellipse(12.0, -28.8, 1.1, 0.85, 0, 0, TAU); c.fill();
    c.fillStyle = '#1e0a06';
    c.beginPath(); roundPoly(c, [[-3.8, -35.4], [5.4, -31.4], [5.2, -29.6], [-3.6, -32.8]], 0.6); c.fill();
    c.beginPath(); roundPoly(c, [[8.0, -31.4], [16.0, -35.0], [16.1, -32.6], [8.2, -29.6]], 0.6); c.fill();
    const mouthP = (k) => roundPoly(k, [[0.4, -23.0], [14.0, -24.0], [13.0, -17.8], [1.6, -17.6]], 1.8);
    c.save();
    c.beginPath(); mouthP(c); c.fillStyle = '#1e0a06'; c.fill(); c.clip();
    c.fillStyle = rg(c, 7, -20.5, 0, 7, -20.5, 7, [[0, '#ffe58a'], [1, '#ff8a1a']]);
    c.beginPath();
    for (let i = 0; i < 6; i++) { const x = 1.0 + i * 2.3; c.moveTo(x, -24.5); c.lineTo(x + 2.3, -24.5); c.lineTo(x + 1.15, -21.2); c.closePath(); }
    for (let i = 0; i < 5; i++) { const x = 2.2 + i * 2.3; c.moveTo(x, -16.5); c.lineTo(x + 2.3, -16.5); c.lineTo(x + 1.15, -19.4); c.closePath(); }
    c.fillStyle = '#fff4e6'; c.fill();
    c.restore();
  }

  /* ---------------------------------------------------------- small sprites */
  function lanternParts(c) {
    jellyLeaf(c, 0, -13.6, -0.6, 5.2, 1.8);
    jellyLeaf(c, 0, -13.6, 0.55, 5.6, 1.9);
    const body = (k) => turnipPath(k, 0, -14.4, -0.6, 7.4);
    c.beginPath(); body(c);
    c.fillStyle = rg(c, -2, -5, 0.5, 0, -6, 8, [[0, '#fff8e6'], [1, '#f2cfa0']]); c.fill();
    clipDo(c, body, (k) => {
      k.beginPath(); k.moveTo(-9, -16); k.lineTo(9, -16); k.lineTo(9, -9.6);
      for (let x = 9; x >= -9; x -= 0.5) k.lineTo(x, -9.6 + 0.6 * Math.sin(x * 1.2));
      k.closePath();
      k.fillStyle = rg(k, -3, -12, 0.3, 0, -10, 8, [[0, '#e4a8ff'], [0.6, '#a24fe0'], [1, '#64209e']]); k.fill();
      k.fillStyle = rg(k, 0, -5, 0, 0, -5, 7, [[0, 'rgba(255,200,90,0.6)'], [1, 'rgba(255,200,90,0)']]);
      k.fillRect(-9, -15, 18, 15);
    });
    caramelHole(c, (k) => roundPoly(k, [[-2.4, -9.4], [-4.2, -6.5], [-0.8, -6.5]], 0.45), -2.4, -7.2, 2.4);
    caramelHole(c, (k) => roundPoly(k, [[2.4, -9.4], [0.8, -6.5], [4.2, -6.5]], 0.45), 2.4, -7.2, 2.4);
    caramelHole(c, (k) => { k.moveTo(-3.8, -5.0); k.quadraticCurveTo(0, 0.4, 3.8, -5.0); k.quadraticCurveTo(0, -3.0, -3.8, -5.0); k.closePath(); }, 0, -3.5, 4);
    spec(c, -4.2, -10.6, 1.5, 0.7, -0.7, 0.9);
    spec(c, -2.6, -12.4, 0.4, 0.35, 0, 0.95);
  }
  function wrappedCandy(c, r, body, swirl, wrapA, wrapB) {
    // cellophane ends
    for (const sg of [-1, 1]) {
      const p = (k) => { k.moveTo(sg * r * 0.7, -0.6 * r); k.lineTo(sg * r * 2.05, -1.05 * r); k.quadraticCurveTo(sg * r * 1.75, 0, sg * r * 2.05, 1.05 * r); k.lineTo(sg * r * 0.7, 0.6 * r); k.closePath(); };
      c.beginPath(); p(c);
      c.fillStyle = lg(c, 0, -r, 0, r, [[0, wrapA], [1, wrapB]]); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = r * 0.12;
      c.beginPath(); c.moveTo(sg * r * 1.0, -0.5 * r); c.lineTo(sg * r * 1.8, -0.8 * r); c.moveTo(sg * r * 1.1, 0.2 * r); c.lineTo(sg * r * 1.85, 0.5 * r); c.stroke();
    }
    const b = E(0, 0, r, r * 0.92);
    gloss(c, b, 0, 0, r, '#ffffff', body, swirl[1]);
    clipDo(c, b, (k) => {
      k.strokeStyle = swirl[0]; k.lineWidth = r * 0.28;
      for (let a = 0; a < 3; a++) {
        k.beginPath();
        for (let t = 0; t <= 1.001; t += 0.05) { const an = (a / 3) * TAU + t * 3.4, rr = t * r * 1.05; const x = Math.cos(an) * rr, y = Math.sin(an) * rr * 0.92; if (t === 0) k.moveTo(x, y); else k.lineTo(x, y); }
        k.stroke();
      }
      k.fillStyle = rg(k, -r * 0.3, -r * 0.35, r * 0.05, 0, 0, r * 1.1, [[0, 'rgba(255,255,255,0.3)'], [0.6, 'rgba(255,255,255,0)'], [1, 'rgba(40,0,60,0.3)']]);
      k.fillRect(-r, -r, r * 2, r * 2);
    });
    spec(c, -r * 0.38, -r * 0.42, r * 0.38, r * 0.2, -0.6, 0.95);
  }
  function gemParts(c, big) {
    c.translate(0, big ? -4.6 : -3.2);
    if (big) wrappedCandy(c, 3.6, '#ffb11f', ['#ff3f7e', '#c4500a'], 'rgba(255,240,170,0.95)', 'rgba(240,170,60,0.95)');
    else wrappedCandy(c, 2.4, '#2fb8ff', ['#ffffff', '#1167c4'], 'rgba(220,245,255,0.95)', 'rgba(140,200,240,0.95)');
  }
  const SEED_COL = [['#ffffff', '#fff2e2', '#d8b48a'], ['#ffffff', '#ff9cc6', '#d4497e'], ['#ffffff', '#ffe266', '#d69a14'], ['#ffffff', '#8ef0cf', '#2aa883']];
  function seedParts(c, i) {
    const col = SEED_COL[i];
    gloss(c, seedPath, 0, 0, 4, col[0], col[1], col[2]);
    spec(c, -0.8, -1.3, 1.6, 0.55, -0.12, 0.95);
    spec(c, 2.2, 0.9, 0.5, 0.3, 0, 0.6);
  }
  const SPRINK_COL = ['#ff4f8b', '#ffd23a', '#4fd6ff', '#7ee26a', '#b88cff', '#ff9a3a', '#ffffff'];
  function sprinkleParts(c, col) {
    const p = CAP(-1.15, 0, 1.15, 0, 0.45);
    c.beginPath(); p(c); c.fillStyle = col; c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 0.22;
    c.beginPath(); c.moveTo(-0.8, -0.18); c.lineTo(0.8, -0.18); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,0.2)';
    c.beginPath(); c.moveTo(-0.8, 0.25); c.lineTo(0.8, 0.25); c.stroke();
  }
  function sparkleParts(c, col) {
    c.fillStyle = rg(c, 0, 0, 0, 0, 0, 4, [[0, 'rgba(255,255,255,0.9)'], [0.35, col], [1, 'rgba(255,255,255,0)']]);
    c.beginPath(); c.arc(0, 0, 4, 0, TAU); c.fill();
    c.fillStyle = '#ffffff';
    c.beginPath(); c.moveTo(0, -3.6); c.quadraticCurveTo(0.35, -0.35, 3.6, 0); c.quadraticCurveTo(0.35, 0.35, 0, 3.6); c.quadraticCurveTo(-0.35, 0.35, -3.6, 0); c.quadraticCurveTo(-0.35, -0.35, 0, -3.6); c.fill();
  }
  function puffParts(c, tone) {
    const cols = tone ? ['#fff6ea', '#f4d9b2', '#d8a878'] : ['#ffffff', '#f9f1f8', '#d9c6e0'];
    const p = (k) => { E(0, 0.4, 3.6, 3.3)(k); E(-2.8, 1.2, 2.4, 2.2)(k); E(2.8, 1.0, 2.5, 2.3)(k); E(-1.2, -2.0, 2.3, 2.2)(k); E(1.6, -1.8, 2.2, 2.1)(k); };
    c.beginPath(); p(c);
    c.fillStyle = rg(c, -1.5, -2, 0.3, 0, 0, 5, [[0, cols[0]], [0.6, cols[1]], [1, cols[2]]]); c.fill();
  }
  const GUMMY_COL = [['#d9a2ff', '#9443d8', '#56168f'], ['#ffa6d2', '#d83a8e', '#86104f'], ['#b8b0ff', '#5b52e0', '#262092'], ['#c9ff9e', '#55cc48', '#22852e'], ['#ffffff', '#ffeef6', '#e2bfd2']];
  function gummyChunk(c, col, i) {
    const r = U.rng(41 + i * 13), pts = [];
    for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU + r.range(-0.2, 0.2), rr = r.range(1.3, 2.1); pts.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.85]); }
    const p = (k) => blobPath(k, pts, 0.9);
    gloss(c, p, 0, 0, 2, col[0], col[1], col[2]);
    spec(c, -0.6, -0.7, 0.6, 0.3, -0.5, 0.95);
  }
  function chocShard(c, i) {
    const r = U.rng(77 + i * 9), pts = [];
    for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU + r.range(-0.3, 0.3), rr = r.range(1.4, 2.6); pts.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.8]); }
    c.beginPath(); roundPoly(c, pts, 0.25);
    c.fillStyle = lg(c, -2, -2, 2, 2, [[0, '#8a5236'], [0.5, '#4e2516'], [1, '#2a120a']]); c.fill();
    c.strokeStyle = 'rgba(255,200,160,0.45)'; c.lineWidth = 0.25;
    c.beginPath(); c.moveTo(pts[3][0], pts[3][1]); c.lineTo(pts[4][0], pts[4][1]); c.stroke();
  }
  function caramelDrop(c) {
    const p = (k) => { k.moveTo(0, -2.4); k.bezierCurveTo(1.4, -0.8, 1.8, 0.4, 1.8, 0.9); k.bezierCurveTo(1.8, 2.2, -1.8, 2.2, -1.8, 0.9); k.bezierCurveTo(-1.8, 0.4, -1.4, -0.8, 0, -2.4); k.closePath(); };
    gloss(c, p, 0, 0.6, 2, '#fff0b0', '#ffa21e', '#b5520a');
    spec(c, -0.6, 0.2, 0.45, 0.7, 0.3, 0.9);
  }
  function cornParts(c) {
    const p = (k) => { k.moveTo(0, -2.6); k.quadraticCurveTo(1.9, 1.6, 1.8, 2.0); k.quadraticCurveTo(0, 2.7, -1.8, 2.0); k.quadraticCurveTo(-1.9, 1.6, 0, -2.6); k.closePath(); };
    c.beginPath(); p(c); c.fillStyle = '#fff6e0'; c.fill();
    clipDo(c, p, (k) => {
      k.fillStyle = '#ff8a1a'; k.fillRect(-3, -0.9, 6, 1.9);
      k.fillStyle = '#ffd23a'; k.fillRect(-3, 1.0, 6, 2);
      k.fillStyle = lg(k, -2, 0, 2, 0, [[0, 'rgba(255,255,255,0.45)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(120,40,0,0.25)']]); k.fillRect(-3, -3, 6, 6);
    });
    spec(c, -0.6, -0.6, 0.3, 0.9, 0.2, 0.7);
  }
  function hitParts(c) {
    const p = (k) => roundPoly(k, starPts(8, 5.6, 2.4, 0, 0, 0.2), 0.4);
    c.beginPath(); p(c);
    c.fillStyle = rg(c, 0, 0, 0, 0, 0, 5.6, [[0, '#ffffff'], [0.55, '#fff4fa'], [1, '#ffb3d6']]); c.fill();
  }
  function wrapperParts(c, v) {
    const cols = [['#ff9ccc', '#e23d8a'], ['#ffe27a', '#d68f12'], ['#b7a2ff', '#6a3fd0'], ['#8ff0d8', '#1fa596']][v];
    const pts = [];
    for (let i = 0; i < 22; i++) { const a = (i / 22) * TAU, rr = i & 1 ? 1 : 0.8; pts.push([Math.cos(a) * 12 * rr, Math.sin(a) * 5 * rr]); }
    c.beginPath(); roundPoly(c, pts, 0.3);
    c.fillStyle = lg(c, -12, -5, 12, 5, [[0, cols[0]], [0.3, '#ffffff'], [0.45, cols[0]], [0.8, cols[1]], [1, cols[0]]]); c.fill();
    c.strokeStyle = OUT; c.lineWidth = 0.5; c.stroke();
    c.beginPath(); c.ellipse(0, 0.3, 7.4, 2.9, 0, 0, TAU);
    c.fillStyle = rg(c, 0, 1, 0.5, 0, 0.3, 7.4, [[0, '#1a0812'], [1, '#4a1a30']]); c.fill();
  }
  function confParts(c, col) {
    c.beginPath(); rrect(c, -1.6, -0.9, 3.2, 1.8, 0.3);
    c.fillStyle = lg(c, -1.6, 0, 1.6, 0, [[0, col], [0.5, '#ffffff'], [1, col]]); c.fill();
  }

  /* ================================================================== props */
  const LOLLI = [
    ['#ffffff', '#ff4f8f'], ['#ff8a1a', '#7a3cc8'], ['#ffffff', '#2fc4a8'], ['#ffd23a', '#ff4f8f', '#4fb6ff', '#7ee26a'],
  ];
  function swirlDisc(c, cx, cy, r, cols) {
    const d = E(cx, cy, r, r);
    clipDo(c, d, (k) => {
      k.fillStyle = cols[0]; k.fillRect(cx - r, cy - r, r * 2, r * 2);
      const A = cols.length > 2 ? 6 : 4;
      k.lineWidth = r * 0.26; k.lineCap = 'butt';
      for (let a = 0; a < A; a++) {
        k.strokeStyle = cols[1 + (a % (cols.length - 1))];
        if (cols.length === 2 && (a & 1)) continue;
        k.beginPath();
        for (let t = 0; t <= 1.001; t += 0.02) { const an = (a / A) * TAU + t * TAU * 1.25, rr = Math.pow(t, 0.85) * r * 1.08; const x = cx + Math.cos(an) * rr, y = cy + Math.sin(an) * rr; if (t === 0) k.moveTo(x, y); else k.lineTo(x, y); }
        k.stroke();
      }
      k.fillStyle = rg(k, cx - r * 0.35, cy - r * 0.4, r * 0.05, cx, cy, r * 1.05, [[0, 'rgba(255,255,255,0.55)'], [0.5, 'rgba(255,255,255,0.05)'], [1, 'rgba(70,0,50,0.38)']]);
      k.fillRect(cx - r, cy - r, r * 2, r * 2);
    });
    rim(c, d, cx - r, cy - r, cx + r, cy + r, 'rgba(255,255,255,0.6)', r * 0.12);
    spec(c, cx - r * 0.42, cy - r * 0.48, r * 0.32, r * 0.14, -0.75, 0.95);
    spec(c, cx - r * 0.12, cy - r * 0.68, r * 0.07, r * 0.06, 0, 0.95);
    spec(c, cx + r * 0.55, cy + r * 0.4, r * 0.18, r * 0.06, -0.8, 0.5);
  }
  function stick(c, x0, y0, x1, y1, w) {
    const p = CAP(x0, y0, x1, y1, w);
    c.beginPath(); p(c);
    c.fillStyle = lg(c, x0 - w, 0, x0 + w, 0, [[0, '#fffaf2'], [0.55, '#f3e6d8'], [1, '#c9b4a2']]); c.fill();
  }
  function lolliTree(c, v) {
    const cols = LOLLI[v];
    stick(c, 0, -1, 0, -40, 1.4);
    // ribbon bow
    const bowC = ['#7a3cc8', '#2fc4a8', '#ff4f8f', '#ff8a1a'][v];
    for (const sg of [-1, 1]) {
      const p = (k) => { k.moveTo(0, -33); k.quadraticCurveTo(sg * 5, -37.5, sg * 5.4, -33.2); k.quadraticCurveTo(sg * 5, -29.5, 0, -33); k.closePath(); };
      gloss(c, p, sg * 3, -33, 3, '#ffffff', bowC, bowC);
      const t = (k) => { k.moveTo(sg * 0.6, -32.6); k.lineTo(sg * 3.4, -27.4); k.lineTo(sg * 1.8, -27.9); k.lineTo(sg * 0.2, -32.4); k.closePath(); };
      c.beginPath(); t(c); c.fillStyle = bowC; c.fill();
    }
    gloss(c, E(0, -33, 1.2, 1.2), 0, -33, 1.2, '#ffffff', bowC, bowC);
    swirlDisc(c, 0, -50, 13.5, cols);
  }
  const GUMDROP = [['#ff4f6e', '#ffd23a', '#7ee26a'], ['#ff8a1a', '#b88cff', '#ff4f8f'], ['#3fd6c1', '#ff9ccc', '#ffe266']];
  function gumdrop(c, cx, by, w, h, col, plainSugar) {
    const p = (k) => { k.moveTo(cx - w, by); k.bezierCurveTo(cx - w, by - h * 0.55, cx - w * 0.6, by - h, cx, by - h); k.bezierCurveTo(cx + w * 0.6, by - h, cx + w, by - h * 0.55, cx + w, by); k.quadraticCurveTo(cx, by + h * 0.18, cx - w, by); k.closePath(); };
    const base = U.hex(col), lt = U.rgb(U.mix(base, [255, 255, 255], 0.55)), dk = U.rgb(U.mul(base, 0.6));
    c.beginPath(); p(c);
    c.fillStyle = rg(c, cx - w * 0.35, by - h * 0.75, w * 0.1, cx, by - h * 0.45, w * 1.25, [[0, lt], [0.5, col], [1, dk]]); c.fill();
    if (!plainSugar) clipDo(c, p, (k) => { // sugar crystals
      const r = U.rng((cx * 100 + by * 7) | 0);
      for (let i = 0; i < 26; i++) {
        const x = cx + r.range(-w, w), y = by - r.range(0, h);
        k.fillStyle = r.chance(0.6) ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.35)';
        k.fillRect(x, y, 0.45, 0.45);
      }
    });
    softSpec(c, cx - w * 0.35, by - h * 0.7, w * 0.45, 0.55);
  }
  function gumdropBush(c, v) {
    const cols = GUMDROP[v];
    gumdrop(c, -5.2, -1.2, 5.2, 9.5, cols[0]);
    gumdrop(c, 5.6, -0.6, 5.0, 8.8, cols[1]);
    gumdrop(c, 0.2, 0.6, 5.8, 11.5, cols[2]);
  }
  function caneFence(c) {
    // licorice rails
    for (const y of [-9.5, -4.8]) {
      const p = CAP(-17, y, 17, y + 0.4, 1.0);
      gloss(c, p, 0, y, 6, '#ff8fa0', '#d8213f', '#7c0a20');
      clipDo(c, p, (k) => { k.strokeStyle = 'rgba(255,255,255,0.3)'; k.lineWidth = 0.35; for (let x = -18; x < 18; x += 1.6) { k.beginPath(); k.moveTo(x, y + 1.2); k.lineTo(x + 1.2, y - 1.2); k.stroke(); } });
    }
    for (const px of [-15, 0, 15]) {
      const post = (k) => { CAP(px, 0, px, -14, 1.5)(k); };
      c.beginPath(); post(c); c.fillStyle = lg(c, px - 1.5, 0, px + 1.5, 0, [[0, '#ffffff'], [1, '#d8c8d0']]); c.fill();
      clipDo(c, post, (k) => stripes(k, px - 2, -16, px + 2, 1, 0.9, 1.1, '#e8213f', -0.9));
      // hook
      c.lineWidth = 3.0; c.strokeStyle = '#f5ecef';
      c.beginPath(); c.arc(px + 2.6, -14, 2.6, PI, TAU); c.stroke();
      c.save(); c.setLineDash([0.9, 1.1]); c.strokeStyle = '#e8213f'; c.lineCap = 'butt';
      c.beginPath(); c.arc(px + 2.6, -14, 2.6, PI, TAU); c.stroke(); c.restore();
      c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 0.5;
      c.beginPath(); c.moveTo(px - 0.7, -1); c.lineTo(px - 0.7, -13); c.stroke();
    }
  }
  function candyRock(c, v) {
    c.translate(0, -6.5);
    if (v === 0) {
      c.scale(1.6, 1.25);
      wrappedCandy(c, 5.2, '#ff8a1a', ['#6a2fc0', '#c4500a'], 'rgba(220,190,255,0.95)', 'rgba(150,100,220,0.95)');
    } else {
      c.scale(1.5, 1.2);
      wrappedCandy(c, 5.2, '#ffd23a', ['#fff7cf', '#b57a08'], 'rgba(255,236,150,0.95)', 'rgba(210,150,30,0.95)');
    }
  }
  function frostLine(c, pts, w) {
    c.lineCap = 'round'; c.lineJoin = 'round';
    const go = (dx, dy) => { c.beginPath(); c.moveTo(pts[0][0] + dx, pts[0][1] + dy); for (let i = 1; i < pts.length; i++) { if (pts[i] === null) { i++; c.moveTo(pts[i][0] + dx, pts[i][1] + dy); } else c.lineTo(pts[i][0] + dx, pts[i][1] + dy); } c.stroke(); };
    c.strokeStyle = 'rgba(60,20,10,0.45)'; c.lineWidth = w; go(0.25, 0.35);
    c.strokeStyle = '#fff4f8'; c.lineWidth = w; go(0, 0);
    c.strokeStyle = 'rgba(255,190,215,0.9)'; c.lineWidth = w * 0.35; go(0.12, 0.18);
  }
  function gravestone(c, v) {
    // crumb mound
    c.fillStyle = rg(c, 0, 0, 1, 0, 0, 12, [[0, '#6e3e26'], [1, 'rgba(110,62,38,0)']]);
    c.beginPath(); c.ellipse(0, -0.5, 12, 3.4, 0, 0, TAU); c.fill();
    if (v === 0) {
      const side = (k) => { k.moveTo(-8.2, 0); k.lineTo(-8.2, -16); k.arc(0.6, -16, 8.8, PI, TAU); k.lineTo(9.4, 0); k.closePath(); };
      c.beginPath(); side(c); c.fillStyle = '#2a110a'; c.fill();
      const face = (k) => { k.moveTo(-9, 0); k.lineTo(-9, -16.4); k.arc(-0.3, -16.4, 8.7, PI, TAU); k.lineTo(8.4, 0); k.closePath(); };
      c.beginPath(); face(c); c.fillStyle = lg(c, -9, -25, 8, 0, [[0, '#8a5232'], [0.5, '#5e301c'], [1, '#3a1a0e']]); c.fill();
      inner(c, face, 'rgba(255,200,160,0.35)', 1.2);
      clipDo(c, face, (k) => { k.fillStyle = 'rgba(30,10,5,0.25)'; k.beginPath(); k.ellipse(-0.3, -10, 6.5, 10, 0, 0, TAU); k.fill(); });
      // frosting R.I.P.
      frostLine(c, [[-6.4, -12.6], [-6.4, -18.6], [-4.6, -18.6], [-3.9, -17.6], [-4.6, -16.0], [-6.2, -16.0], null, [-5.2, -16.0], [-3.8, -12.6],
        null, [-1.0, -12.6], [-1.0, -18.6], null, [1.8, -12.6], [1.8, -18.6], [3.7, -18.6], [4.4, -17.4], [3.7, -16.0], [1.9, -16.0]], 0.9);
      c.fillStyle = '#fff4f8';
      c.beginPath(); c.arc(-2.6, -12.7, 0.5, 0, TAU); c.arc(0.4, -12.7, 0.5, 0, TAU); c.arc(5.6, -12.7, 0.5, 0, TAU); c.fill();
      // piped frosting beads along the arch
      for (let i = 0; i <= 10; i++) {
        const a = PI + (i / 10) * PI, x = -0.3 + Math.cos(a) * 8.0, y = -16.4 + Math.sin(a) * 8.0;
        gloss(c, E(x, y, 0.85, 0.85), x, y, 0.9, '#ffffff', '#ffd1e6', '#e88cb6');
      }
      // sprinkles on the frosting
      const r = U.rng(5);
      for (let i = 0; i < 6; i++) { c.fillStyle = SPRINK_COL[i % 6]; c.save(); c.translate(r.range(-6, 5), r.range(-10, -4)); c.rotate(r.range(0, PI)); c.fillRect(-0.7, -0.22, 1.4, 0.44); c.restore(); }
    } else {
      // chocolate cross with white drizzle
      const cr = (k) => { roundPoly(k, [[-2.4, 0], [-2.4, -15], [-7.4, -15], [-7.4, -19.4], [-2.4, -19.4], [-2.4, -25], [2.4, -25], [2.4, -19.4], [7.4, -19.4], [7.4, -15], [2.4, -15], [2.4, 0]], 0.8); };
      c.save(); c.translate(1.0, 0.4); c.beginPath(); cr(c); c.fillStyle = '#2a110a'; c.fill(); c.restore();
      c.beginPath(); cr(c); c.fillStyle = lg(c, -7, -25, 7, 0, [[0, '#8a5232'], [0.5, '#5e301c'], [1, '#3a1a0e']]); c.fill();
      inner(c, cr, 'rgba(255,200,160,0.35)', 1.0);
      frostLine(c, [[-6.6, -16.4], [-4.8, -18.4], [-3.2, -16.2], [-1.4, -18.6], [0.4, -16.0], [2.2, -18.4], [4.0, -16.2], [6.2, -18.0]], 0.75);
      frostLine(c, [[-1.4, -23.4], [1.2, -21.6], [-1.2, -20.6]], 0.6);
      gloss(c, E(-4, -1.6, 3.2, 2.4), -4, -1.6, 3, '#ffd08a', '#ff8d1e', '#c24a0a');
      c.strokeStyle = 'rgba(190,70,10,0.6)'; c.lineWidth = 0.35; c.beginPath(); c.moveTo(-4, -3.8); c.quadraticCurveTo(-5.2, -1.6, -4, 0.6); c.stroke();
      spec(c, -5.2, -2.6, 0.9, 0.4, -0.5, 0.85);
    }
  }
  function bucket(c) {
    // candies sticking out
    stick(c, 3.5, -12, 6.5, -21, 0.55);
    swirlDisc(c, 7.2, -22.5, 3.4, LOLLI[0]);
    c.save(); c.translate(-3.6, -15.6); c.rotate(-0.4); wrappedCandy(c, 1.9, '#7ee26a', ['#ffffff', '#2f8a2a'], 'rgba(230,255,220,0.95)', 'rgba(150,220,140,0.95)'); c.restore();
    c.save(); c.translate(1.0, -16.4); c.rotate(0.3); wrappedCandy(c, 1.7, '#ff4f8f', ['#ffffff', '#a01a50'], 'rgba(255,220,235,0.95)', 'rgba(240,150,190,0.95)'); c.restore();
    // handle
    c.strokeStyle = '#1e0a14'; c.lineWidth = 0.9;
    c.beginPath(); c.moveTo(-8.4, -10); c.bezierCurveTo(-9.5, -22, 9.5, -22, 8.4, -10); c.stroke();
    const p = (k) => pumpkinPath(k, 0, -7.4, 9.0, 7.2);
    gloss(c, p, 0, -7.4, 9, '#ffc070', '#ff7a12', '#c2440a');
    c.fillStyle = '#ff9a3a'; c.beginPath(); c.ellipse(0, -14.0, 6.6, 1.5, 0, 0, TAU); c.fill();
    c.fillStyle = '#7a2a06'; c.beginPath(); c.ellipse(0, -14.0, 5.6, 1.0, 0, 0, TAU); c.fill();
    c.fillStyle = '#1e0a14';
    c.beginPath(); roundPoly(c, [[-4.2, -10.2], [-5.8, -7.4], [-2.4, -7.4]], 0.4); c.fill();
    c.beginPath(); roundPoly(c, [[3.6, -10.2], [2.0, -7.4], [5.4, -7.4]], 0.4); c.fill();
    c.beginPath(); c.moveTo(-5.4, -5.2); c.quadraticCurveTo(0, -0.6, 5.2, -5.2); c.quadraticCurveTo(0, -3.4, -5.4, -5.2); c.fill();
    spec(c, -5.2, -10.4, 1.6, 0.8, -0.7, 0.9);
    rim(c, p, -9, -14, 9, 0, 'rgba(255,230,160,0.8)', 1.5);
  }
  function cupcake(c, v) {
    const frost = v ? ['#ffffff', '#ffb0d0', '#d8508c'] : ['#ffffff', '#9fe8c4', '#2fa07a'];
    // liner (pleated)
    const lin = (k) => { k.moveTo(-17, -24); k.lineTo(17, -24); k.lineTo(13.5, 0); k.quadraticCurveTo(0, 2.2, -13.5, 0); k.closePath(); };
    c.beginPath(); lin(c);
    c.fillStyle = lg(c, -17, 0, 17, 0, [[0, '#ffd1e2'], [0.4, '#fff1f6'], [1, '#d88aa8']]); c.fill();
    clipDo(c, lin, (k) => {
      for (let i = -8; i <= 8; i++) {
        const x0 = i * 2.1, x1 = i * 1.66;
        k.strokeStyle = 'rgba(200,90,130,0.55)'; k.lineWidth = 0.55;
        k.beginPath(); k.moveTo(x0, -24); k.lineTo(x1, 1); k.stroke();
        k.strokeStyle = 'rgba(255,255,255,0.55)'; k.lineWidth = 0.4;
        k.beginPath(); k.moveTo(x0 + 0.6, -24); k.lineTo(x1 + 0.5, 1); k.stroke();
      }
    });
    // door
    const door = (k) => { k.moveTo(-3.6, 0.6); k.lineTo(-3.6, -8); k.arc(0, -8, 3.6, PI, TAU); k.lineTo(3.6, 0.6); k.closePath(); };
    c.beginPath(); door(c); c.fillStyle = lg(c, -3, -12, 3, 0, [[0, '#8a5232'], [1, '#3a1a0e']]); c.fill();
    c.strokeStyle = '#2a110a'; c.lineWidth = 0.5; c.stroke();
    c.strokeStyle = 'rgba(255,200,160,0.35)'; c.lineWidth = 0.35;
    c.beginPath(); c.moveTo(0, -11.4); c.lineTo(0, 0.4); c.moveTo(-3.4, -5); c.lineTo(3.4, -5); c.stroke();
    gloss(c, E(2.2, -4.6, 0.6, 0.6), 2.2, -4.6, 0.6, '#fff', '#ffd23a', '#c48a0a');
    // windows (warm caramel light)
    for (const wx of [-9.6, 9.6]) {
      const w = (k) => k.ellipse(wx, -13.5, 2.6, 2.9, 0, 0, TAU);
      c.beginPath(); w(c); c.fillStyle = '#5e301c'; c.fill();
      c.beginPath(); c.ellipse(wx, -13.5, 2.0, 2.3, 0, 0, TAU); c.fillStyle = rg(c, wx, -13, 0, wx, -13.5, 2.4, [[0, '#fff6c0'], [0.6, '#ffc24a'], [1, '#e2741a']]); c.fill();
      c.strokeStyle = '#5e301c'; c.lineWidth = 0.4; c.beginPath(); c.moveTo(wx, -15.8); c.lineTo(wx, -11.2); c.moveTo(wx - 2, -13.5); c.lineTo(wx + 2, -13.5); c.stroke();
    }
    // wafer chimney
    const ch = (k) => rrect(k, 8, -44, 4.6, 12, 0.6);
    c.beginPath(); ch(c); c.fillStyle = '#e6b06a'; c.fill();
    clipDo(c, ch, (k) => { k.strokeStyle = '#b97c3a'; k.lineWidth = 0.4; for (let i = -3; i < 6; i++) { k.beginPath(); k.moveTo(8 + i * 1.6, -44); k.lineTo(12.6 + i * 1.6, -32); k.moveTo(12.6 - i * 1.6, -44); k.lineTo(8 - i * 1.6, -32); k.stroke(); } });
    // frosting roof: 3 tiers
    const tiers = [[0, -27.5, 19.5, 6.5], [0, -34.5, 15, 5.8], [0, -41, 10, 5.2], [0, -46, 5.2, 3.6]];
    for (const [tx, ty, rx, ry] of tiers) {
      const p = (k) => {
        k.moveTo(tx - rx, ty);
        for (let i = 0; i <= 10; i++) { const a = PI + (i / 10) * PI; k.lineTo(tx + Math.cos(a) * rx, ty + Math.sin(a) * ry * 1.25); }
        for (let i = 0; i <= 8; i++) { const x = tx + rx - (i / 8) * rx * 2; k.quadraticCurveTo(x + rx / 8, ty + ry * 0.75, x - rx / 16, ty + ry * 0.35); }
        k.closePath();
      };
      c.beginPath(); p(c);
      c.fillStyle = rg(c, tx - rx * 0.35, ty - ry * 0.9, 0.5, tx, ty, rx * 1.1, [[0, frost[0]], [0.5, frost[1]], [1, frost[2]]]); c.fill();
      spec(c, tx - rx * 0.45, ty - ry * 0.55, rx * 0.22, ry * 0.18, -0.4, 0.7);
    }
    // sprinkles
    const r = U.rng(17 + v);
    for (let i = 0; i < 26; i++) {
      const t = r.next(), ti = tiers[(t * 3) | 0];
      const x = ti[0] + r.range(-ti[2] * 0.8, ti[2] * 0.8), y = ti[1] - r.range(0, ti[3] * 0.9);
      c.save(); c.translate(x, y); c.rotate(r.range(0, PI)); c.fillStyle = SPRINK_COL[i % 6]; c.beginPath(); rrect(c, -0.8, -0.25, 1.6, 0.5, 0.25); c.fill(); c.restore();
    }
    // cherry
    c.strokeStyle = '#4a8a2a'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(0.6, -51.5); c.quadraticCurveTo(1.8, -55.5, 4.2, -56.6); c.stroke();
    gloss(c, E(0, -50.2, 2.9, 2.7), 0, -50.2, 3, '#ffb0b8', '#e8213f', '#8a0a1e');
    spec(c, -1.0, -51.3, 0.9, 0.5, -0.5, 0.95);
  }
  const PROP_DEF = {
    lolli: { n: 4, box: [-15, -66, 15, 2], fn: lolliTree, sh: [9, 3.2], pad: 75 },
    bush: { n: 3, box: [-12, -14, 12, 3], fn: gumdropBush, sh: [12, 3.6], pad: 30 },
    fence: { n: 1, box: [-19, -19, 21, 2], fn: caneFence, sh: [18, 2.6], pad: 30 },
    rock: { n: 2, box: [-19, -16, 19, 2], fn: candyRock, sh: [13, 3.6], pad: 30 },
    grave: { n: 2, box: [-13, -28, 13, 4], fn: gravestone, sh: [10, 3.0], pad: 35 },
    bucket: { n: 1, box: [-11, -27, 12, 2], fn: bucket, sh: [9.5, 3.0], pad: 30 },
    cupcake: { n: 2, box: [-20, -58, 20, 3], fn: cupcake, sh: [19, 5.0], pad: 70 },
  };

  /* ================================================================ ground */
  const GSTEP = 4;
  const NF = 9;
  // fields: 0 caramel pools, 1 pink sugar, 2 mint frosting, 3 cookie path (signed), 4 bar grid amount, 5 warp, 6 ridge amp, 7 tint, 8 sheen phase
  function fieldsAt(x, y, out) {
    const wx = U.perlin(x / 900, y / 900, 701) * 110, wy = U.perlin(x / 900 + 9.2, y / 900, 702) * 110;
    const X = x + wx, Y = y + wy;
    out[0] = U.fbm(X / 400 + 2.1, Y / 400, 811, 2) - 0.685;
    out[1] = U.fbm(X / 880 + 13.7, Y / 880, 505, 2) - 0.6;
    out[2] = U.fbm(X / 760 - 7.1, Y / 760, 404, 2) - 0.585;
    const qx = U.perlin(x / 480, y / 480, 305) * 60, qy = U.perlin(x / 480 + 5.1, y / 480, 306) * 60;
    const pn = U.perlin((x + qx) / 1500, (y + qy) / 1500, 304);
    out[3] = (0.0155 - Math.abs(pn)) * 3.0;
    out[4] = U.smoothstep(0.44, 0.58, U.fbm(x / 620 + 4.4, y / 620, 909, 2));
    out[5] = U.perlin(x / 260, y / 260, 919) * 30 + U.perlin(x / 90, y / 90, 920) * 6;
    out[6] = U.smoothstep(0.48, 0.68, U.noise(x / 340, y / 340, 929));
    out[7] = 1 + (U.noise(x / 1400, y / 1400, 606) - 0.5) * 0.09;
    out[8] = U.perlin(x / 240, y / 240, 939) * 7;
  }
  const FT = new Float32Array(NF);
  function matAt(x, y) {
    fieldsAt(x, y, FT);
    if (FT[3] > 0) return 4;
    if (FT[2] > 0) return 3;
    if (FT[1] > 0) return 2;
    if (FT[0] > 0) return 1;
    return 0;
  }
  function matSafe(x, y, r) {
    const m = matAt(x, y);
    if (matAt(x + r, y) !== m || matAt(x - r, y) !== m || matAt(x, y + r) !== m || matAt(x, y - r) !== m) return -1;
    return m;
  }
  const pack = (r, g, b) => (255 << 24) | ((b < 0 ? 0 : b > 255 ? 255 : b | 0) << 16) | ((g < 0 ? 0 : g > 255 ? 255 : g | 0) << 8) | (r < 0 ? 0 : r > 255 ? 255 : r | 0);

  // crumb texture (tileable, 128 texels @ 0.5 world units)
  let CRUMB = null, CRN = null;
  function buildCrumb() {
    const N = 128;
    CRUMB = new Float32Array(N * N); CRN = new Float32Array(N * N);
    const o = {};
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        U.worley(x / 8, y / 8, 515, 16, o);
        const edge = U.smoothstep(0.0, 0.22, o.f2 - o.f1);
        const dome = 1 - Math.min(1, o.f1 * 1.1);
        const lit = ((o.x * 8 - x) + (o.y * 8 - y)) / 8; // lit from top-left
        const id = (o.id & 255) / 255;
        CRUMB[y * N + x] = 0.78 + 0.22 * edge + 0.1 * dome * U.clamp(lit, -1, 1) + (id - 0.5) * 0.12;
        CRN[y * N + x] = U.fbmTile(x / 16, y / 16, 8, 516, 2) - 0.5;
      }
    }
  }

  const COL = {
    choc: [126, 76, 50], pink: [244, 172, 194], mint: [160, 218, 184], path: [84, 50, 38],
    carE: [236, 156, 58], carD: [178, 90, 26],
  };
  const SHC = [60, 22, 30];
  const AUX = new Float32Array(NF);
  const MC = new Float32Array(3);
  // material colour at world x,y -> MC
  function matCol(m, x, y, s) {
    const tn = AUX[7];
    if (m < 0) { // milk chocolate
      let f = 1;
      const bar = AUX[4];
      if (bar > 0.01) {
        const S = 34;
        const u = x - Math.floor(x / S) * S, v = y - Math.floor(y / S) * S;
        const dl = u, dt = v, dr = S - u, db = S - v;
        const mn = Math.min(dl, dt, dr, db);
        let b = 0;
        if (mn < 0.9) b = -0.26 * (1 - mn / 0.9);
        else if (dl < 3.2 || dt < 3.2) b = 0.11 * (1 - (Math.min(dl, dt) - 0.9) / 2.3);
        else if (dr < 3.2 || db < 3.2) b = -0.09 * (1 - (Math.min(dr, db) - 0.9) / 2.3);
        else b = 0.025 * (1 - Math.abs(u - S * 0.4) / S - Math.abs(v - S * 0.4) / S);
        f += b * bar;
      }
      if (bar < 0.99) {
        const sh = Math.sin(AUX[8] + x * 0.018 + y * 0.062);
        const band = sh > 0.6 ? (sh - 0.6) / 0.4 : 0;
        f += (band * band * 0.09 - (sh < -0.7 ? (-0.7 - sh) * 0.12 : 0)) * (1 - bar);
      }
      f *= tn;
      MC[0] = COL.choc[0] * f; MC[1] = COL.choc[1] * f; MC[2] = COL.choc[2] * f;
    } else if (m === 0) { // caramel
      const t = U.clamp(s / 0.05, 0, 1);
      let r = COL.carE[0] + (COL.carD[0] - COL.carE[0]) * t, g = COL.carE[1] + (COL.carD[1] - COL.carE[1]) * t, b = COL.carE[2] + (COL.carD[2] - COL.carE[2]) * t;
      const sh = Math.sin(y * 0.2 + x * 0.035 + AUX[5] * 0.22);
      const hl = (sh > 0.955 ? (sh - 0.955) * 22 : 0) * (0.15 + 0.35 * t) * (0.2 + AUX[6]);
      const br = 1 + 0.06 * Math.sin(x * 0.021 + y * 0.09 + AUX[8]);
      r = (r + (255 - r) * hl) * br; g = (g + (232 - g) * hl) * br; b = (b + (170 - b) * hl) * br;
      MC[0] = r * tn; MC[1] = g * tn; MC[2] = b * tn;
    } else if (m === 1) { // pink sugar sand
      const ix = Math.floor(x * 2), iy = Math.floor(y * 2);
      const h = U.hashInt(ix, iy, 33);
      let f = 1 + ((h & 255) / 255 - 0.5) * 0.07;
      f *= tn;
      if (((h >>> 8) & 1023) < 3) { MC[0] = 255; MC[1] = 246; MC[2] = 250; return; }
      const d = 1 + 0.025 * Math.sin(AUX[5] * 0.09 + x * 0.03 + y * 0.055);
      f *= d;
      MC[0] = COL.pink[0] * f; MC[1] = COL.pink[1] * f; MC[2] = COL.pink[2] * f;
    } else if (m === 2) { // mint frosting with piped ridges
      const amp = AUX[6];
      let f = tn;
      let hi = 0;
      if (amp > 0.01) {
        const ph = (y + AUX[5] + x * 0.16) * 0.62;
        const sn = Math.sin(ph);
        f *= 1 + amp * 0.045 * sn;
        hi = sn > 0.88 ? (sn - 0.88) * 8.3 * amp * 0.2 : 0;
      }
      MC[0] = COL.mint[0] * f; MC[1] = COL.mint[1] * f; MC[2] = COL.mint[2] * f;
      if (hi > 0) { MC[0] += (250 - MC[0]) * hi; MC[1] += (255 - MC[1]) * hi; MC[2] += (250 - MC[2]) * hi; }
    } else { // dark cookie-crumb path
      const ti = ((Math.floor(y * 2) & 127) << 7) | (Math.floor(x * 2) & 127);
      const f = CRUMB[ti] * tn;
      MC[0] = COL.path[0] * f; MC[1] = COL.path[1] * f; MC[2] = COL.path[2] * f;
    }
  }
  function dripAt(x) {
    const q = x / 4.2, k = Math.floor(q), h = U.hash2(k, 0, 77);
    if (h < 0.38) return 0;
    const t = q - k, w = 2 * t - 1;
    const prof = 1 - w * w;
    return (0.25 + 0.75 * (h - 0.38) / 0.62) * 9 * Math.sqrt(prof > 0 ? prof : 0) * (0.3 + 0.7 * U.hash2(k, 1, 78));
  }
  // layer extents (world units) inside / outside the edge that need per-pixel work
  const L_IN = [4.2, 2.0, 2.8, 3.6], L_OUT = [1.4, 2.8, 9.6, 1.8];

  /* -------------------------------------------------------- ground decals */
  const DEC = {};
  function buildDecals() {
    const sh = (c, rx, ry, y) => { c.fillStyle = 'rgba(50,15,20,0.25)'; c.beginPath(); c.ellipse(0.3, y || 0.4, rx, ry, 0, 0, TAU); c.fill(); };
    const B = (box, fn) => build(box, fn, { ol: 0, k: DK, margin: 0.3 });
    DEC.chip = [0, 1].map((v) => B([-2, -2.6, 2, 1.2], (c) => {
      sh(c, 1.8, 0.7, 0.3);
      const p = (k) => { k.moveTo(0, -2.4 + v * 0.4); k.bezierCurveTo(0.5, -1.2, 1.7, -0.6, 1.7, 0.1); k.quadraticCurveTo(0, 0.9, -1.7, 0.1); k.bezierCurveTo(-1.7, -0.6, -0.5, -1.2, 0, -2.4 + v * 0.4); k.closePath(); };
      gloss(c, p, 0, -0.6, 2, '#8a5236', '#43200f', '#1e0a05');
      spec(c, -0.5, -0.9, 0.35, 0.6, 0.3, 0.75);
    }));
    DEC.corn = B([-2.8, -3.6, 2.8, 3.6], (c) => { c.scale(1.1, 1.1); sh(c, 2, 0.9, 2); cornParts(c); });
    DEC.mallow = [['#fff8fc', '#e6d2e2'], ['#ffd6e6', '#e9a6c2'], ['#d8f4e8', '#9fd6bf']].map((col) => B([-3, -3.6, 3, 1.6], (c) => {
      sh(c, 2.6, 0.9, 0.5);
      c.beginPath(); c.moveTo(-2.1, -2.5); c.lineTo(-2.1, -0.2); c.ellipse(0, -0.2, 2.1, 0.85, 0, PI, 0, true); c.lineTo(2.1, -2.5); c.closePath();
      c.fillStyle = lg(c, -2.1, 0, 2.1, 0, [[0, col[0]], [0.45, '#ffffff'], [1, col[1]]]); c.fill();
      c.beginPath(); c.ellipse(0, -2.5, 2.1, 0.85, 0, 0, TAU); c.fillStyle = rg(c, -0.6, -2.7, 0.1, 0, -2.5, 2.2, [[0, '#ffffff'], [1, col[0]]]); c.fill();
      c.strokeStyle = 'rgba(120,70,100,0.35)'; c.lineWidth = 0.18; c.stroke();
    }));
    DEC.sprink = SPRINK_COL.map((col) => B([-1.5, -0.8, 1.5, 0.8], (c) => sprinkleParts(c, col)));
    DEC.gum = GUMDROP[0].concat(GUMDROP[1]).map((col) => B([-2.6, -3.8, 2.6, 1.2], (c) => { sh(c, 2.3, 0.8, 0.2); gumdrop(c, 0, 0, 2.2, 3.4, col, true); }));
    DEC.lolli = [0, 1, 2].map((v) => B([-4.2, -2.8, 4.8, 2.6], (c) => {
      sh(c, 4, 0.9, 1.2);
      stick(c, -0.5, 0.6, 4.2, 1.4, 0.4);
      swirlDisc(c, -1.6, -0.1, 2.4, LOLLI[v]);
    }));
    DEC.crumb = [0, 1, 2].map((v) => B([-2.6, -2, 2.6, 1.5], (c) => {
      const r = U.rng(300 + v);
      for (let i = 0; i < 4; i++) {
        const x = r.range(-1.6, 1.6), y = r.range(-1, 0.8), s = r.range(0.4, 0.95);
        c.fillStyle = 'rgba(40,15,10,0.3)'; c.beginPath(); c.ellipse(x + 0.2, y + 0.3, s, s * 0.6, 0, 0, TAU); c.fill();
        c.fillStyle = lg(c, x - s, y - s, x + s, y + s, [[0, '#e6b07a'], [1, '#9a6038']]);
        c.beginPath(); roundPoly(c, starPts(3, s, s * 0.7, x, y, r.range(0, 2)), 0.15); c.fill();
      }
    }));
    DEC.dollop = ['#ffffff', '#ffd6e8'].map((col) => B([-3, -3.6, 3, 1.4], (c) => {
      sh(c, 2.8, 1, 0.4);
      const p = (k) => roundPoly(k, starPts(7, 2.7, 2.0, 0, -0.9, 0).map((q) => [q[0], -0.9 + (q[1] + 0.9) * 0.6]), 0.4);
      c.beginPath(); p(c); c.fillStyle = rg(c, -0.8, -1.8, 0.2, 0, -0.9, 3, [[0, '#ffffff'], [1, col === '#ffffff' ? '#d6e8de' : '#f0a8c8']]); c.fill();
      c.beginPath(); c.moveTo(0, -3.2); c.quadraticCurveTo(1.6, -1.4, 0, -0.9); c.quadraticCurveTo(-1.4, -1.4, 0, -3.2);
      c.fillStyle = col; c.fill();
      spec(c, -0.4, -2.2, 0.4, 0.3, 0, 0.9);
    }));
    DEC.heart = ['#ffd1e2', '#d8f4e8', '#fff2b0', '#e2d6ff'].map((col) => B([-2, -2, 2, 1.8], (c) => {
      sh(c, 1.8, 0.7, 0.9);
      const p = (k) => { k.moveTo(0, 1.3); k.bezierCurveTo(-2.2, -0.2, -1.6, -2.1, 0, -1.1); k.bezierCurveTo(1.6, -2.1, 2.2, -0.2, 0, 1.3); k.closePath(); };
      gloss(c, p, 0, -0.3, 1.8, '#ffffff', col, U.rgb(U.mul(U.hex(col), 0.82)));
    }));
    DEC.glint = B([-1.6, -1.6, 1.6, 1.6], (c) => {
      c.fillStyle = 'rgba(255,255,255,0.95)';
      c.beginPath(); c.moveTo(0, -1.5); c.quadraticCurveTo(0.15, -0.15, 1.5, 0); c.quadraticCurveTo(0.15, 0.15, 0, 1.5); c.quadraticCurveTo(-0.15, 0.15, -1.5, 0); c.quadraticCurveTo(-0.15, -0.15, 0, -1.5); c.fill();
    });
    DEC.pumpkin = B([-2.6, -3.6, 2.8, 1.2], (c) => {
      sh(c, 2.4, 0.8, 0.3);
      const p = (k) => pumpkinPath(k, 0, -1.2, 2.4, 1.9);
      gloss(c, p, 0, -1.2, 2.4, '#ffd08a', '#ff8d1e', '#c24a0a');
      c.strokeStyle = '#4a8a2a'; c.lineWidth = 0.4; c.beginPath(); c.moveTo(0, -3); c.lineTo(0.4, -3.6); c.stroke();
      spec(c, -1, -2, 0.6, 0.3, -0.5, 0.85);
    });
  }
  function dPut(ctx, s, x, y, rot, sc) {
    const k = 1 / s.k * (sc || 1);
    if (rot) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.drawImage(s.c, -s.ox * k, -s.oy * k, s.c.width * k, s.c.height * k);
      ctx.restore();
    } else ctx.drawImage(s.c, x - s.ox * k, y - s.oy * k, s.c.width * k, s.c.height * k);
  }
  function* decals(ctx, info) {
    const pts = [];
    G.scatter(info, 15, 7001, 6, (x, y, rng) => { pts.push(x, y, rng.next(), rng.next(), rng.next()); });
    let n = 0;
    for (let i = 0; i < pts.length; i += 5) {
      if ((++n & 15) === 0) yield;
      const x = pts[i], y = pts[i + 1], r0 = pts[i + 2], r1 = pts[i + 3], r2 = pts[i + 4];
      if (r0 > 0.42) continue;
      const m = matSafe(x, y, 4);
      if (m < 0) continue;
      const pick = (arr) => arr[Math.floor(r1 * arr.length) % arr.length];
      if (m === 0) { // milk chocolate
        if (r0 < 0.07) dPut(ctx, pick(DEC.chip), x, y);
        else if (r0 < 0.095) dPut(ctx, DEC.corn, x, y, (r2 - 0.5) * 2.4);
        else if (r0 < 0.12) dPut(ctx, pick(DEC.mallow), x, y);
        else if (r0 < 0.19) { for (let k = 0; k < 3; k++) dPut(ctx, DEC.sprink[(r1 * 7 + k * 3 | 0) % 7], x + Math.cos(k * 2.1 + r2 * 6) * 2.6, y + Math.sin(k * 2.1 + r2 * 6) * 1.6, r2 * 6 + k * 1.3); }
        else if (r0 < 0.205) dPut(ctx, DEC.pumpkin, x, y);
      } else if (m === 1) { // caramel
        if (r0 < 0.08) dPut(ctx, DEC.glint, x, y, 0, 0.8 + r2 * 0.6);
      } else if (m === 2) { // pink sugar
        if (r0 < 0.12) dPut(ctx, DEC.glint, x, y, 0, 0.6 + r2 * 0.6);
        else if (r0 < 0.17) dPut(ctx, pick(DEC.heart), x, y, (r2 - 0.5) * 0.8);
        else if (r0 < 0.2) dPut(ctx, pick(DEC.lolli), x, y, (r2 - 0.5) * 1.2);
        else if (r0 < 0.24) dPut(ctx, pick(DEC.gum), x, y);
        else if (r0 < 0.26) dPut(ctx, DEC.sprink[(r1 * 7) | 0], x, y, r2 * 6);
      } else if (m === 3) { // mint frosting
        if (r0 < 0.09) dPut(ctx, pick(DEC.dollop), x, y);
        else if (r0 < 0.14) dPut(ctx, pick(DEC.gum), x, y);
        else if (r0 < 0.19) dPut(ctx, DEC.sprink[(r1 * 7) | 0], x, y, r2 * 6);
        else if (r0 < 0.21) dPut(ctx, pick(DEC.lolli), x, y, (r2 - 0.5) * 1.2);
      } else { // cookie path
        if (r0 < 0.24) dPut(ctx, pick(DEC.crumb), x, y, r2 * 6);
        else if (r0 < 0.3) dPut(ctx, pick(DEC.chip), x, y);
      }
    }
  }

  /* ========================================================== draw helpers */
  let TV = null;
  const TF = { S: 1, ox: 0, oy: 0 };
  function tf(view) {
    if (TV !== view) { TV = view; TF.S = view.S; TF.ox = view.W / 2 - view.x * view.S; TF.oy = view.H / 2 - view.y * view.S; }
    return TF;
  }
  function blit(ctx, s, x, y, sx, sy) {
    const k = 1 / s.k;
    ctx.drawImage(s.c, x - s.ox * k * sx, y - s.oy * k * sy, s.c.width * k * sx, s.c.height * k * sy);
  }
  function blitRot(ctx, V, s, x, y, sx, sy, rot) {
    const S = V.S, co = Math.cos(rot) * S, si = Math.sin(rot) * S;
    ctx.setTransform(co, si, -si, co, V.ox + x * S, V.oy + y * S);
    const k = 1 / s.k;
    ctx.drawImage(s.c, -s.ox * k * sx, -s.oy * k * sy, s.c.width * k * sx, s.c.height * k * sy);
    ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
  }
  function shadow(ctx, x, y, rx, ry, a) {
    const s = SPR.shadow;
    ctx.globalAlpha = a === undefined ? 1 : a;
    ctx.drawImage(s, x - rx, y - ry, rx * 2, ry * 2);
    ctx.globalAlpha = 1;
  }

  // damage numbers (Chewy, candy stripes, white + cocoa outline)
  const numCache = new Map();
  let fontOK = false, fontCheckT = -1;
  function fontReady(rt) {
    if (fontOK) return true;
    if (rt - fontCheckT < 0.5 && fontCheckT >= 0) return false;
    fontCheckT = rt;
    if (document.fonts) document.fonts.forEach((f) => { if (f.family.replace(/["']/g, '') === 'Chewy' && f.status === 'loaded') fontOK = true; });
    if (fontOK) numCache.clear();
    return fontOK;
  }
  function numSprite(value, crit, rt) {
    const ok = fontReady(rt);
    const key = value + (crit ? 'c' : 'n') + (ok ? 'L' : 'F');
    let s = numCache.get(key);
    if (s) return s;
    if (numCache.size > 400) numCache.clear();
    const fs = (crit ? 13 : 9.5) * K;
    const font = (ok ? '' : 'bold ') + fs + 'px "Chewy", "Sniglet", "Arial Rounded MT Bold", sans-serif';
    const meas = U.canvas(4, 4).ctx;
    meas.font = font;
    const txt = String(value);
    const w = Math.ceil(meas.measureText(txt).width + fs * 0.8), h = Math.ceil(fs * 1.6);
    const cx = w / 2, cy = h / 2;
    // striped fill layer
    const F = U.canvas(w, h);
    F.ctx.font = font; F.ctx.textAlign = 'center'; F.ctx.textBaseline = 'middle';
    F.ctx.fillStyle = crit ? lg(F.ctx, 0, cy - fs * 0.45, 0, cy + fs * 0.4, [[0, '#fff27a'], [0.5, '#ffbe2e'], [1, '#ff7a1a']]) : '#ffffff';
    F.ctx.fillText(txt, cx, cy);
    F.ctx.globalCompositeOperation = 'source-atop';
    F.ctx.save(); F.ctx.translate(cx, cy); F.ctx.rotate(-0.7);
    F.ctx.fillStyle = crit ? 'rgba(255,255,255,0.75)' : 'rgba(255,92,150,0.85)';
    const sw = fs * 0.15;
    for (let x = -w; x < w; x += sw * 2.2) F.ctx.fillRect(x, -h, sw, h * 2);
    F.ctx.restore();
    F.ctx.fillStyle = lg(F.ctx, 0, cy - fs * 0.5, 0, cy + fs * 0.1, [[0, 'rgba(255,255,255,0.65)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]);
    F.ctx.fillRect(0, 0, w, h);
    const { c, ctx } = U.canvas(w, h);
    ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.strokeStyle = OUT; ctx.lineWidth = fs * 0.42;
    ctx.strokeText(txt, cx, cy + fs * 0.08);
    ctx.strokeText(txt, cx, cy);
    ctx.strokeStyle = crit ? '#ffffff' : '#ffffff'; ctx.lineWidth = fs * 0.2;
    ctx.strokeText(txt, cx, cy);
    ctx.drawImage(F.c, 0, 0);
    s = { c, ox: w / 2, oy: h / 2, k: K };
    numCache.set(key, s);
    return s;
  }

  /* ================================================================ icons */
  const ICONS = {
    'hp-heart'(c) {
      const p = (k) => { k.moveTo(24, 42); k.bezierCurveTo(10, 33, 4.5, 25, 4.5, 17); k.bezierCurveTo(4.5, 10, 9.5, 5.5, 15.5, 5.5); k.bezierCurveTo(19.5, 5.5, 22.5, 8, 24, 11.5); k.bezierCurveTo(25.5, 8, 28.5, 5.5, 32.5, 5.5); k.bezierCurveTo(38.5, 5.5, 43.5, 10, 43.5, 17); k.bezierCurveTo(43.5, 25, 38, 33, 24, 42); k.closePath(); };
      gloss(c, p, 24, 22, 20, '#ffb3c0', '#ff2f55', '#a0082a');
      jelly(c, p, 24, 22, 16, 'rgba(150,0,30,0.4)', 'rgba(255,170,190,0.6)');
      spec(c, 13.5, 13, 4.4, 2.2, -0.7, 0.95); spec(c, 19.5, 9.5, 1.2, 1.1, 0, 0.95); spec(c, 33, 30, 2.2, 0.8, -0.8, 0.5);
    },
    kills(c) {
      c.save(); c.translate(24, 45); c.scale(1.75, 1.75); creeperParts(c, 0, 0); c.restore();
    },
    dmg(c) {
      c.save(); c.translate(20, 28); c.rotate(-0.7); c.scale(3.6, 3.6); seedParts(c, 1); c.restore();
      for (const [x, y, r] of [[37, 11, 7], [40, 30, 4.2], [9, 10, 3.4]]) { c.save(); c.translate(x, y); c.scale(r / 4, r / 4); sparkleParts(c, 'rgba(255,120,180,0.6)'); c.restore(); }
    },
    rate(c) {
      const p = (k) => roundPoly(k, [[27, 3], [11, 26], [22, 26], [17, 45], [37, 19], [26, 19], [32, 3]], 1.4);
      gloss(c, p, 24, 22, 20, '#fff8b0', '#ffd23a', '#d68a0a');
      jelly(c, p, 24, 22, 14, 'rgba(200,110,0,0.35)');
      spec(c, 24, 9, 2.4, 1.0, -1.0, 0.95);
      c.strokeStyle = '#ffffff'; c.lineWidth = 2.4; c.globalAlpha = 0.9;
      c.beginPath(); c.moveTo(4, 34); c.lineTo(11, 34); c.moveTo(6, 40); c.lineTo(13, 40); c.moveTo(39, 30); c.lineTo(45, 30); c.stroke();
      c.globalAlpha = 1;
    },
    multi(c) {
      for (const [x, y, a, i] of [[17, 13, -1.9, 2], [31, 12, -1.2, 3], [24, 9, -1.55, 1]]) { c.save(); c.translate(x, y); c.rotate(a); c.scale(2.6, 2.6); seedParts(c, i); c.restore(); }
      c.save(); c.translate(24, 46); c.scale(2.1, 2.1); c.translate(0, 0);
      const p = (k) => pumpkinPath(k, 0, -7.4, 9.0, 7.2);
      gloss(c, p, 0, -7.4, 9, '#ffc070', '#ff7a12', '#c2440a');
      c.fillStyle = '#1e0a14';
      c.beginPath(); roundPoly(c, [[-4.2, -10.2], [-5.8, -7.4], [-2.4, -7.4]], 0.4); c.fill();
      c.beginPath(); roundPoly(c, [[3.6, -10.2], [2.0, -7.4], [5.4, -7.4]], 0.4); c.fill();
      c.beginPath(); c.moveTo(-5.4, -5.2); c.quadraticCurveTo(0, -0.6, 5.2, -5.2); c.quadraticCurveTo(0, -3.4, -5.4, -5.2); c.fill();
      spec(c, -5.2, -10.4, 1.6, 0.8, -0.7, 0.9);
      c.restore();
    },
    bounce(c) {
      c.strokeStyle = '#ffffff'; c.lineWidth = 2.6; c.setLineDash([3.5, 4.5]);
      c.beginPath(); c.moveTo(5, 40); c.quadraticCurveTo(12, 4, 26, 14); c.stroke(); c.setLineDash([]);
      // marshmallow trampoline
      c.save(); c.translate(24, 41);
      const mp = (k) => rrect(k, -15, -7, 30, 9, 4);
      c.beginPath(); mp(c); c.fillStyle = lg(c, 0, -7, 0, 2, [[0, '#ffffff'], [1, '#e0cfe4']]); c.fill();
      c.beginPath(); c.ellipse(0, -7, 15, 3, 0, 0, TAU); c.fillStyle = '#ffffff'; c.fill();
      c.fillStyle = 'rgba(255,140,190,0.6)'; c.beginPath(); c.ellipse(0, -7, 9, 1.6, 0, 0, TAU); c.fill();
      c.restore();
      c.save(); c.translate(27, 16); c.rotate(-1.25); c.scale(3, 3); seedParts(c, 2); c.restore();
      c.save(); c.translate(40, 8); sparkleParts(c, 'rgba(255,220,80,0.6)'); c.restore();
    },
    lantern(c) {
      c.fillStyle = rg(c, 24, 26, 2, 24, 26, 24, [[0, 'rgba(255,200,90,0.85)'], [1, 'rgba(255,200,90,0)']]);
      c.fillRect(0, 0, 48, 48);
      c.save(); c.translate(24, 45); c.scale(2.3, 2.3); lanternParts(c); c.restore();
    },
    speed(c) {
      c.strokeStyle = '#ffffff'; c.lineWidth = 2.4;
      c.beginPath(); c.moveTo(2, 22); c.lineTo(9, 22); c.moveTo(3, 29); c.lineTo(8, 29); c.stroke();
      const p = (k) => { k.moveTo(11, 33); k.bezierCurveTo(10, 24, 20, 21, 26, 24); k.bezierCurveTo(31, 26, 34, 29, 42, 30); k.bezierCurveTo(46, 31, 46, 37, 42, 37); k.lineTo(15, 37); k.lineTo(15, 42); k.lineTo(11, 42); k.closePath(); };
      gloss(c, p, 26, 30, 18, '#e6fbff', '#8fe3f2', '#3a9ed0');
      jelly(c, p, 26, 30, 12, 'rgba(40,140,200,0.35)', 'rgba(255,255,255,0.5)');
      spec(c, 16, 28, 2.4, 1.0, -0.8, 0.95); spec(c, 36, 31.5, 1.2, 0.6, 0, 0.9);
      gloss(c, E(26, 23.5, 3.2, 2.4), 26, 23.5, 3, '#ffffff', '#ff8fb4', '#d44a7c');
      c.save(); c.translate(37, 12); c.scale(1.4, 1.4); sparkleParts(c, 'rgba(160,230,255,0.6)'); c.restore();
    },
    magnet(c) {
      // waffle-cone basket with candies
      c.save(); c.translate(17, 21); c.rotate(-0.3); wrappedCandy(c, 4.2, '#2fb8ff', ['#ffffff', '#1167c4'], 'rgba(220,245,255,0.95)', 'rgba(140,200,240,0.95)'); c.restore();
      c.save(); c.translate(31, 19); c.rotate(0.3); wrappedCandy(c, 4.2, '#ff4f8f', ['#ffffff', '#a01a50'], 'rgba(255,220,235,0.95)', 'rgba(240,150,190,0.95)'); c.restore();
      const p = (k) => { k.moveTo(5, 24); k.lineTo(43, 24); k.lineTo(38, 44); k.lineTo(10, 44); k.closePath(); };
      gloss(c, p, 24, 32, 20, '#ffe0a8', '#e6a85a', '#a8682a');
      clipDo(c, p, (k) => {
        k.strokeStyle = 'rgba(140,80,30,0.7)'; k.lineWidth = 1.3;
        for (let i = -6; i < 10; i++) { k.beginPath(); k.moveTo(i * 5, 24); k.lineTo(i * 5 + 20, 44); k.moveTo(i * 5 + 20, 24); k.lineTo(i * 5, 44); k.stroke(); }
      });
      c.beginPath(); rrect(c, 3, 21.5, 42, 5, 2.5); c.fillStyle = lg(c, 0, 21, 0, 27, [[0, '#ffe6b8'], [1, '#c98a4e']]); c.fill();
    },
    hp(c) {
      c.strokeStyle = '#ffffff'; c.lineWidth = 2.6; c.globalAlpha = 0.95;
      c.beginPath(); c.moveTo(17, 14); c.bezierCurveTo(13, 10, 21, 7, 17, 2); c.moveTo(28, 14); c.bezierCurveTo(24, 10, 32, 7, 28, 2); c.stroke();
      c.globalAlpha = 1;
      const p = (k) => { k.moveTo(6, 17); k.lineTo(42, 17); k.bezierCurveTo(43, 38, 38, 44, 24, 44); k.bezierCurveTo(10, 44, 5, 38, 6, 17); k.closePath(); };
      gloss(c, p, 24, 30, 20, '#ffd1e6', '#ff7ab0', '#c03a78');
      clipDo(c, p, (k) => { for (let x = 6; x < 44; x += 6) { k.fillStyle = 'rgba(255,255,255,0.5)'; k.beginPath(); k.arc(x, 31, 1.2, 0, TAU); k.fill(); } });
      spec(c, 12, 26, 1.8, 4, 0.1, 0.8);
      c.beginPath(); c.ellipse(24, 17.5, 18, 4.2, 0, 0, TAU); c.fillStyle = rg(c, 24, 17, 1, 24, 17.5, 18, [[0, '#ffb26a'], [1, '#d8661a']]); c.fill();
      c.fillStyle = '#9443d8'; c.beginPath(); c.arc(17, 17, 2.6, 0, TAU); c.fill();
      c.fillStyle = '#fff1f8'; c.beginPath(); c.arc(29, 18, 2.3, 0, TAU); c.fill();
      c.fillStyle = '#55cc48'; c.beginPath(); c.arc(23.5, 16, 1.6, 0, TAU); c.fill();
    },
  };

  /* ================================================================== CSS */
  function tso(w, col, drop) {
    const a = [];
    for (let i = 0; i < 16; i++) { const t = (i / 16) * TAU; a.push((Math.cos(t) * w).toFixed(1) + 'px ' + (Math.sin(t) * w).toFixed(1) + 'px 0 ' + col); }
    if (drop) { a.push('0 ' + (w + drop) + 'px 0 ' + col); a.push(w * 0.7 + 'px ' + (w * 0.7 + drop) + 'px 0 ' + col); a.push(-w * 0.7 + 'px ' + (w * 0.7 + drop) + 'px 0 ' + col); }
    return a.join(',');
  }
  const D = '#3a1424';
  const GLOSS = 'linear-gradient(180deg, rgba(255,255,255,.6) 0%, rgba(255,255,255,.12) 45%, rgba(255,255,255,0) 55%, rgba(60,0,30,.18) 100%)';
  const SPR_BG = 'radial-gradient(ellipse 4px 1.6px at 18% 30%, #ff4f8b 98%, transparent), radial-gradient(ellipse 4px 1.6px at 72% 24%, #4fd6ff 98%, transparent), radial-gradient(ellipse 1.6px 4px at 86% 70%, #ffd23a 98%, transparent), radial-gradient(ellipse 1.6px 4px at 10% 72%, #7ee26a 98%, transparent), radial-gradient(ellipse 4px 1.6px at 45% 86%, #b88cff 98%, transparent)';
  const CSS = `
body.style-candy { font-family: 'Sniglet', 'Chewy', system-ui, sans-serif; }
body.style-candy #hud { padding: 14px 22px; }
body.style-candy #hud .xp { height: 26px; background: linear-gradient(180deg, #3d1a14, #6a3624); border: 3px solid ${D}; border-radius: 14px; box-shadow: 0 4px 0 ${D}, inset 0 4px 6px rgba(0,0,0,.45); }
body.style-candy #hud .xp-fill { background: ${GLOSS}, repeating-linear-gradient(-55deg, #35d0c0 0 11px, #effffb 11px 20px); border-radius: 0 12px 12px 0; box-shadow: inset 0 -3px 0 rgba(0,90,80,.25), inset -3px 0 0 rgba(255,255,255,.4); }
body.style-candy #hud .xp-fill::after { content: ''; position: absolute; left: 8px; right: 10px; top: 3px; height: 4px; border-radius: 3px; background: rgba(255,255,255,.75); }
body.style-candy #hud .lvl { right: 12px; font-family: 'Chewy', cursive; font-weight: 400; font-size: 20px; letter-spacing: 1px; color: #fff; text-shadow: ${tso(2, D)}; }
body.style-candy #hud .topline { display: grid; grid-template-columns: 1fr auto 1fr; align-items: start; margin-top: 14px; }
body.style-candy #hud .hp { position: relative; gap: 6px; justify-self: start; }
body.style-candy #hud .hp-icon, body.style-candy #hud .kills-icon { width: 46px; height: 46px; filter: drop-shadow(0 3px 0 rgba(58,20,36,.35)); }
body.style-candy #hud .hp-bar { width: 260px; height: 30px; background: linear-gradient(180deg, #3d1a14, #6a3624); border: 3px solid ${D}; border-radius: 16px; box-shadow: 0 4px 0 ${D}, inset 0 4px 6px rgba(0,0,0,.45); }
body.style-candy #hud .hp-fill { background: ${GLOSS}, repeating-linear-gradient(-55deg, #ff2f55 0 12px, #fff5f7 12px 22px); border-radius: 0 13px 13px 0; box-shadow: inset 0 -3px 0 rgba(120,0,30,.25), inset -3px 0 0 rgba(255,255,255,.45); }
body.style-candy #hud .hp-fill::after { content: ''; position: absolute; left: 9px; right: 12px; top: 4px; height: 5px; border-radius: 3px; background: rgba(255,255,255,.75); }
body.style-candy #hud .hp-text { position: absolute; left: 52px; width: 260px; top: 50%; transform: translateY(-50%); text-align: center; font-family: 'Chewy', cursive; font-weight: 400; font-size: 20px; letter-spacing: 1px; color: #fff; text-shadow: ${tso(2, D)}; }
body.style-candy.hurt #hud .hp { animation: candyWobble .25s ease-out; }
@keyframes candyWobble { 0%,100% { transform: none } 30% { transform: scale(1.06,.92) } 65% { transform: scale(.96,1.05) } }
body.style-candy #hud .clock { position: relative; justify-self: center; margin-top: -4px; padding: 4px 30px 8px; border-radius: 999px; border: 3px solid ${D};
  background: ${GLOSS}, radial-gradient(ellipse at 50% 120%, #ffb347 0%, #ff8a1a 45%, #e8590c 100%); box-shadow: 0 5px 0 ${D}, inset 0 -4px 0 rgba(140,40,0,.25); }
body.style-candy #hud .clock::before, body.style-candy #hud .clock::after { content: ''; position: absolute; top: 50%; width: 34px; height: 54px; margin-top: -27px; z-index: -1;
  background: linear-gradient(180deg, #ffd9a8, #ff9a3a 45%, #c24a0a); clip-path: polygon(0 0, 22% 14%, 0 28%, 22% 42%, 0 56%, 22% 70%, 0 84%, 22% 100%, 100% 64%, 100% 36%);
  filter: drop-shadow(0 0 0 ${D}); }
body.style-candy #hud .clock::before { left: -30px; }
body.style-candy #hud .clock::after { right: -30px; transform: scaleX(-1); }
body.style-candy #hud .clock-time { font-family: 'Chewy', cursive; font-weight: 400; font-size: 38px; line-height: 1.1; letter-spacing: 2px; color: #fff; text-shadow: ${tso(2.5, D, 2)}; }
body.style-candy #hud .clock-label { font-family: 'Sniglet', sans-serif; font-weight: 800; font-size: 12px; letter-spacing: 1.6px; opacity: 1; color: #fff3e0; text-shadow: 0 1px 0 rgba(120,30,0,.8); }
body.style-candy #hud .kills { justify-self: end; min-width: 0; gap: 4px; padding: 2px 20px 2px 8px; border-radius: 999px; border: 4px solid #c98a4e;
  background: ${SPR_BG}, ${GLOSS}, linear-gradient(180deg, #ffc3dc, #ff8fbf); box-shadow: 0 0 0 3px ${D}, 0 5px 0 3px ${D};
  font-family: 'Chewy', cursive; font-weight: 400; font-size: 28px; color: #fff; text-shadow: ${tso(2, D)}; }
body.style-candy #hud .kills-icon { width: 42px; height: 42px; filter: none; }
body.style-candy #stylebar { background: ${GLOSS}, linear-gradient(180deg, #6a3624, #3d1a14); color: #ffe9d6; border: 3px solid ${D}; box-shadow: 0 4px 0 ${D}; padding: 5px 20px; font-family: 'Sniglet', sans-serif; gap: 14px; bottom: 14px; }
body.style-candy #stylebar .style-family { color: #ffb3d1; opacity: 1; font-weight: 800; }
body.style-candy #stylebar .style-name { font-family: 'Chewy', cursive; font-weight: 400; font-size: 22px; letter-spacing: 1px; color: #ff9a3a; text-shadow: ${tso(2, D)}; }
body.style-candy #stylebar .style-hint { opacity: .85; }
body.style-candy #stylebar .auto.on { color: #6ff0d0; }
body.style-candy #levelup { gap: 30px; background:
  radial-gradient(ellipse at 50% 42%, rgba(255,170,210,.35), rgba(255,170,210,0) 60%),
  repeating-conic-gradient(from 0deg at 50% 40%, rgba(255,255,255,.08) 0deg 8deg, rgba(255,255,255,0) 8deg 16deg),
  rgba(70,20,60,.62); -webkit-backdrop-filter: saturate(.5) brightness(.8) blur(1px); backdrop-filter: saturate(.5) brightness(.8) blur(1px); }
body.style-candy #levelup .lu-title { font-family: 'Chewy', cursive; font-weight: 400; font-size: 84px; letter-spacing: 3px; color: transparent;
  background: repeating-linear-gradient(-50deg, #ffffff 0 14px, #ff7ab0 14px 26px); -webkit-background-clip: text; background-clip: text;
  filter: drop-shadow(2.5px 0 0 ${D}) drop-shadow(-2.5px 0 0 ${D}) drop-shadow(0 2.5px 0 ${D}) drop-shadow(0 -2.5px 0 ${D}) drop-shadow(0 6px 0 ${D}) drop-shadow(0 10px 12px rgba(20,0,20,.4)); text-shadow: none; transform: rotate(-3deg); animation: candyPop .6s cubic-bezier(.3,1.7,.5,1) backwards; }
@keyframes candyPop { from { transform: scale(.2) rotate(-14deg); } to { transform: scale(1) rotate(-3deg); } }
body.style-candy #levelup .lu-cards { gap: 26px; }
body.style-candy #levelup .card { width: 236px; min-height: 306px; padding: 0 18px 24px; gap: 8px; color: ${D};
  background: ${GLOSS}, linear-gradient(180deg, #ff8fbf 0, #ff5c9e 96px, #fff4ea 96px, #ffe6d2 100%); border: 4px solid ${D}; border-radius: 30px;
  box-shadow: 0 0 0 5px #8a4a2a, 0 0 0 8px ${D}, 0 12px 0 8px ${D}, 0 24px 34px rgba(30,5,20,.45); transition: transform .14s cubic-bezier(.3,1.6,.5,1); animation: candyCard .5s cubic-bezier(.3,1.5,.5,1) backwards; }
body.style-candy #levelup .card:nth-child(2) { animation-delay: .07s; background: ${GLOSS}, linear-gradient(180deg, #8ff0d8 0, #35c9ae 96px, #fff4ea 96px, #ffe6d2 100%); }
body.style-candy #levelup .card:nth-child(3) { animation-delay: .14s; background: ${GLOSS}, linear-gradient(180deg, #ffe27a 0, #ffb11f 96px, #fff4ea 96px, #ffe6d2 100%); }
@keyframes candyCard { from { transform: translateY(60px) scale(.7); opacity: 0; } to { transform: none; opacity: 1; } }
body.style-candy #levelup .card:hover { transform: translateY(-10px) rotate(-1.5deg) scale(1.03); }
body.style-candy #levelup .card-icon { width: 128px; height: 128px; margin-top: 26px; padding: 14px; border-radius: 50%;
  background: radial-gradient(circle, #fff9fc 0 54%, rgba(255,255,255,0) 55%), repeating-conic-gradient(#fff 0 7deg, #ffd0e2 7deg 14deg);
  box-shadow: 0 0 0 4px ${D}, 0 5px 0 4px ${D}; }
body.style-candy #levelup .card-name { margin-top: 8px; font-family: 'Chewy', cursive; font-weight: 400; font-size: 27px; letter-spacing: .5px; line-height: 1.1; color: #ff5c9e; text-shadow: ${tso(2, D)}; }
body.style-candy #levelup .card:nth-child(2) .card-name { color: #2fc4a8; }
body.style-candy #levelup .card:nth-child(3) .card-name { color: #ffa51f; }
body.style-candy #levelup .card-desc { font-family: 'Sniglet', sans-serif; font-weight: 400; font-size: 17px; line-height: 1.25; opacity: 1; color: #6a3a3a; }
body.style-candy #levelup .card-key { top: 12px; left: 14px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 50% 50% 46% 46% / 62% 62% 38% 38%;
  background: ${GLOSS}, #fff; border: 3px solid ${D}; font-family: 'Chewy', cursive; font-weight: 400; font-size: 20px; opacity: 1; color: ${D}; }
body.style-candy #levelup .lu-hint { font-family: 'Sniglet', sans-serif; font-weight: 800; font-size: 17px; opacity: 1; color: #fff4ea; text-shadow: ${tso(2, D)}; }
body.style-candy #gameover { background: radial-gradient(ellipse at 50% 46%, rgba(120,40,90,0) 0%, rgba(40,10,30,.6) 75%), rgba(70,20,60,.5); -webkit-backdrop-filter: grayscale(.8) brightness(.62) blur(2px); backdrop-filter: grayscale(.8) brightness(.62) blur(2px); gap: 18px; }
body.style-candy #gameover .go-title { font-family: 'Chewy', cursive; font-weight: 400; font-size: 84px; color: #ff9a3a; letter-spacing: 2px; text-shadow: ${tso(5, D, 5)}; transform: rotate(-2deg); }
body.style-candy #gameover .go-stats { font-family: 'Sniglet', sans-serif; font-weight: 800; font-size: 20px; opacity: 1; color: ${D}; background: ${GLOSS}, #fff4ea; border: 3px solid ${D}; border-radius: 22px; padding: 10px 24px; box-shadow: 0 5px 0 ${D}; }
body.style-candy #gameover .go-hint { font-family: 'Chewy', cursive; font-size: 24px; opacity: 1; color: #fff; background: ${GLOSS}, repeating-linear-gradient(-55deg, #ff2f55 0 12px, #ff6f8a 12px 22px); border: 3px solid ${D}; border-radius: 999px; padding: 6px 24px; box-shadow: 0 5px 0 ${D}; text-shadow: ${tso(2, D)}; }
body.style-candy #pausebox { font-family: 'Chewy', cursive; font-weight: 400; font-size: 76px; color: #fff; text-shadow: ${tso(4, D, 4)}; }
`;

  /* ============================================================== particles */
  function add(game, o) { return game.addParticle(o); }
  function sprinkles(game, x, y, z, n, sp) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = sp * (0.5 + Math.random() * 0.8);
      add(game, { kind: 'sprink', tint: (Math.random() * 7) | 0, x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 50 + Math.random() * 70, grav: 300, drag: 1.4, life: 0.9 + Math.random() * 0.5, size: 0.9 + Math.random() * 0.3, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 16 });
    }
  }
  function sugar(game, x, y, z, n, sp, col) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = sp * (0.4 + Math.random() * 0.8);
      add(game, { kind: 'sugar', tint: col || 0, x, y, z: z + (Math.random() - 0.5) * 6, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 10 + Math.random() * 30, grav: 30, drag: 3, life: 0.35 + Math.random() * 0.3, size: 0.6 + Math.random() * 0.5 });
    }
  }
  function puff(game, x, y, z, tone, size, vx, vy, life, rise) {
    return add(game, { kind: 'puff', tint: tone, x, y, z, vx, vy, drag: 5, life, size, rise: rise || 6, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 2 });
  }

  /* ================================================================ style */
  let lastHop = -1;
  let VIG = null;
  Styles.register({
    id: 'candy',
    name: 'Süßes oder Saures',
    family: 'Candy-Land',
    description: 'Glänzende Halloween-Süßigkeitenwelt: Schokoboden, Minz-Zuckerguss, Gummirüben, Marshmallow-Geister und ein Bonbon-Kürbis.',
    groundColor: '#7e4c32',
    groundResMax: 2.5,
    chunkSize: 256,
    fonts: ['Chewy', 'Sniglet:wght@400;800'],
    css: CSS,

    init() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssH = window.__forceH || window.innerHeight || 900;
      const S = (cssH * dpr) / 360;
      K = Math.max(3, Math.min(6, Math.round(S * 1.25)));
      buildCrumb();
      SPR.jack = []; SPR.jackHurt = [];
      for (let f = 0; f < 4; f++) {
        SPR.jack.push(set4([-14, -33, 14, 2], (c) => jackParts(c, f, false)));
        SPR.jackHurt.push(set4([-14, -33, 14, 2], (c) => jackParts(c, f, true)));
      }
      SPR.creep = [0, 1, 2].map((v) => [0, 1, 2, 3].map((f) => set4([-13, -31, 13, 1.5], (c) => creeperParts(c, f, v))));
      SPR.ghost = [0, 1, 2, 3].map((f) => set4([-13, -27, 13, 1], (c) => ghostParts(c, f), { olc: '#5a3a66', ol: 0.45 }, ghostFade));
      SPR.colo = [0, 1, 2, 3].map((f) => set4([-28, -67, 28, 2], (c) => colossusParts(c, f), { ol: 0.6 }));
      SPR.lantern = build([-9, -21, 9, 1], lanternParts);
      SPR.gemS = build([-6, -6.6, 6, 0.2], (c) => gemParts(c, false), { ol: 0.4 });
      SPR.gemB = build([-8.5, -9.2, 8.5, 0.2], (c) => gemParts(c, true), { ol: 0.45 });
      SPR.seed = SEED_COL.map((_, i) => build([-4, -3.2, 5, 3.2], (c) => seedParts(c, i), { ol: 0.4 }));
      SPR.streak = plain([-18, -3, -1, 3], (c) => {
        c.strokeStyle = lg(c, -2, 0, -17, 0, [[0, 'rgba(255,255,255,0.95)'], [1, 'rgba(255,255,255,0)']]); c.lineCap = 'round';
        c.lineWidth = 1.6; c.beginPath(); c.moveTo(-3, 0); c.lineTo(-16, 0); c.stroke();
        c.strokeStyle = lg(c, -2, 0, -12, 0, [[0, 'rgba(255,140,190,0.9)'], [1, 'rgba(255,140,190,0)']]);
        c.lineWidth = 0.6; c.beginPath(); c.moveTo(-3, -1.6); c.lineTo(-11, -1.6); c.moveTo(-3, 1.6); c.lineTo(-10, 1.6); c.stroke();
      });
      SPR.sprink = SPRINK_COL.map((col) => build([-1.6, -0.6, 1.6, 0.6], (c) => sprinkleParts(c, col), { ol: 0.18 }));
      SPR.sugar = ['rgba(255,150,200,0.7)', 'rgba(150,220,255,0.7)', 'rgba(255,220,100,0.7)'].map((col) => plain([-4, -4, 4, 4], (c) => sparkleParts(c, col)));
      SPR.puff = [0, 1].map((t) => build([-6.5, -5, 6.5, 4.5], (c) => puffParts(c, t), { olc: '#7a5a86', ol: 0.3 }));
      SPR.gummy = GUMMY_COL.map((col, i) => build([-2.4, -2.2, 2.4, 2.2], (c) => gummyChunk(c, col, i), { ol: 0.3 }));
      SPR.choc = [0, 1, 2].map((i) => build([-2.8, -2.4, 2.8, 2.4], (c) => chocShard(c, i), { ol: 0.25 }));
      SPR.drop = build([-2, -2.6, 2, 2.4], caramelDrop, { ol: 0.3 });
      SPR.corn = build([-2.2, -3, 2.2, 2.8], cornParts, { ol: 0.3 });
      SPR.hit = build([-6, -6, 6, 6], hitParts, { olc: '#ff5c9e', ol: 0.35 });
      SPR.conf = ['#ff4f8b', '#ffd23a', '#4fd6ff', '#7ee26a', '#b88cff', '#ff9a3a'].map((col) => build([-1.8, -1, 1.8, 1], (c) => confParts(c, col), { ol: 0.2 }));
      SPR.wrapper = [0, 1, 2, 3].map((v) => plain([-13, -6, 13, 6], (c) => wrapperParts(c, v)));
      SPR.shadow = U.sprite(64, 32, (c) => {
        const g = c.createRadialGradient(32, 16, 0, 32, 16, 32);
        g.addColorStop(0, 'rgba(45,12,22,0.42)'); g.addColorStop(0.55, 'rgba(45,12,22,0.3)'); g.addColorStop(1, 'rgba(45,12,22,0)');
        c.setTransform(1, 0, 0, 0.5, 0, 8); c.fillStyle = g; c.fillRect(0, -16, 64, 64);
      });
      SPR.glow = plain([-18, -18, 18, 18], (c) => {
        c.fillStyle = rg(c, 0, 0, 0, 0, 0, 18, [[0, 'rgba(255,200,90,0.8)'], [0.35, 'rgba(255,160,60,0.32)'], [1, 'rgba(255,140,40,0)']]);
        c.fillRect(-18, -18, 36, 36);
      });
      SPR.props = {};
      for (const t in PROP_DEF) {
        const d = PROP_DEF[t];
        SPR.props[t] = [];
        for (let v = 0; v < d.n; v++) SPR.props[t].push(withFlip(build(d.box, (c) => d.fn(c, v), { ol: t === 'cupcake' || t === 'lolli' ? 0.55 : 0.45 })));
      }
      buildDecals();
      if (document.fonts && document.fonts.load) { try { document.fonts.load('20px "Chewy"', '0123456789'); } catch (e) { /* ignore */ } }
    },

    /* ------------------------------------------------------------ ground */
    *renderGroundChunk(ctx, info) {
      const res = info.res, Wp = info.px;
      const cpx = GSTEP * res;
      const nc = Math.ceil(Wp / cpx - 1e-6), nn = nc + 1;
      const F = new Float32Array(nn * nn * NF);
      const tmp = new Float32Array(NF);
      for (let j = 0; j < nn; j++) {
        const y = info.wy + j * GSTEP;
        for (let i = 0; i < nn; i++) {
          fieldsAt(info.wx + i * GSTEP, y, tmp);
          const o = (j * nn + i) * NF;
          for (let k = 0; k < NF; k++) F[o + k] = tmp[k];
        }
        if ((j & 3) === 3) yield;
      }
      const cs = new Int32Array(nc + 1);
      for (let i = 0; i <= nc; i++) cs[i] = Math.max(0, Math.min(Wp, Math.ceil(i * cpx - 0.5)));
      const img = ctx.createImageData(Wp, Wp);
      const buf = new Uint32Array(img.data.buffer);
      const st = new Int8Array(4);
      const inPx = L_IN.map((v) => v * res), outPx = L_OUT.map((v) => v * res);
      const C0 = new Float32Array(3);
      for (let gy = 0; gy < nc; gy++) {
        for (let gx = 0; gx < nc; gx++) {
          const o00 = (gy * nn + gx) * NF, o10 = o00 + NF, o01 = o00 + nn * NF, o11 = o01 + NF;
          for (let L = 0; L < 4; L++) {
            const a = F[o00 + L], b = F[o10 + L], c = F[o01 + L], d = F[o11 + L];
            const mn = Math.min(a, b, c, d), mx = Math.max(a, b, c, d);
            const gxm = Math.max(Math.abs(b - a), Math.abs(d - c)), gym = Math.max(Math.abs(c - a), Math.abs(d - b));
            const g = Math.sqrt(gxm * gxm + gym * gym) / cpx + 1e-9;
            st[L] = mx < 0 && mx / g < -outPx[L] - 2 ? 0 : mn > 0 && mn / g > inPx[L] + 2 ? 2 : 1;
          }
          let start = -1;
          for (let L = 3; L >= 0; L--) if (st[L] === 2) { start = L; break; }
          const x0 = cs[gx], x1 = cs[gx + 1], y0 = cs[gy], y1 = cs[gy + 1];
          for (let py = y0; py < y1; py++) {
            const v = (py + 0.5) / cpx - gy;
            const wyy = info.wy + (py + 0.5) / res;
            for (let px = x0; px < x1; px++) {
              const u = (px + 0.5) / cpx - gx;
              const wxx = info.wx + (px + 0.5) / res;
              for (let k = 4; k < NF; k++) {
                const A = F[o00 + k], B = F[o10 + k], Cc = F[o01 + k], Dd = F[o11 + k];
                const s0 = A + (B - A) * u, s1 = Cc + (Dd - Cc) * u;
                AUX[k] = s0 + (s1 - s0) * v;
              }
              let sv = 0;
              if (start === 0) { const A = F[o00], B = F[o10], Cc = F[o01], Dd = F[o11]; const s0 = A + (B - A) * u, s1 = Cc + (Dd - Cc) * u; sv = s0 + (s1 - s0) * v; }
              matCol(start, wxx, wyy, sv);
              C0[0] = MC[0]; C0[1] = MC[1]; C0[2] = MC[2];
              for (let L = start + 1; L < 4; L++) {
                if (st[L] === 0) continue;
                const A = F[o00 + L], B = F[o10 + L], Cc = F[o01 + L], Dd = F[o11 + L];
                const s0 = A + (B - A) * u, s1 = Cc + (Dd - Cc) * u;
                const s = s0 + (s1 - s0) * v;
                const du = (B - A) * (1 - v) + (Dd - Cc) * v, dv = (Cc - A) * (1 - u) + (Dd - B) * u;
                const gl = Math.sqrt(du * du + dv * dv);
                const dist = gl > 1e-9 ? s / (gl / cpx) : s > 0 ? 99 : -99;
                const nyo = gl > 1e-9 ? -dv / gl : 0; // outward normal y (down = +)
                if (L === 2) { // mint frosting: drips, shadow, glossy rim
                  let de = dist;
                  if (nyo > 0.25 && dist < 0.5 && dist > -outPx[2]) de += dripAt(wxx) * res * Math.min(1, (nyo - 0.25) * 2.5);
                  if (de < 0.5) {
                    const kk = 1 + de / (5 * res);
                    if (kk > 0) {
                      const s2 = kk * kk * (0.25 + 0.75 * Math.max(0, nyo)) * 0.5;
                      C0[0] += (SHC[0] - C0[0]) * s2; C0[1] += (SHC[1] - C0[1]) * s2; C0[2] += (SHC[2] - C0[2]) * s2;
                    }
                  }
                  let cov = de + 0.5;
                  if (cov <= 0) continue;
                  if (cov > 1) cov = 1;
                  matCol(2, wxx, wyy, 0);
                  const rt = 1 - Math.min(1, Math.max(0, de) / (2.6 * res));
                  const up = Math.max(0, -nyo + 0.15), dn = Math.max(0, nyo);
                  let f = 1 + rt * rt * (0.16 * up - 0.22 * dn);
                  MC[0] *= f; MC[1] *= f; MC[2] *= f;
                  if (de > 0.45 * res && de < 1.35 * res && up > 0.2) {
                    const q = (1 - Math.abs(de / res - 0.9) / 0.45) * Math.min(1, (up - 0.2) * 2) * 0.75;
                    MC[0] += (255 - MC[0]) * q; MC[1] += (255 - MC[1]) * q; MC[2] += (252 - MC[2]) * q;
                  }
                  if (de < 0.6 * res) { const e = 0.84 + 0.16 * de / (0.6 * res); MC[0] *= e; MC[1] *= e; MC[2] *= e; }
                  C0[0] += (MC[0] - C0[0]) * cov; C0[1] += (MC[1] - C0[1]) * cov; C0[2] += (MC[2] - C0[2]) * cov;
                } else if (L === 1) { // pink sugar
                  const de = dist;
                  if (de < 0.5) {
                    const kk = 1 + de / (2.6 * res);
                    if (kk > 0) {
                      const s2 = kk * kk * (0.25 + 0.75 * Math.max(0, nyo)) * 0.28;
                      C0[0] += (SHC[0] - C0[0]) * s2; C0[1] += (SHC[1] - C0[1]) * s2; C0[2] += (SHC[2] - C0[2]) * s2;
                    }
                  }
                  let cov = de + 0.5;
                  if (cov <= 0) continue;
                  if (cov > 1) cov = 1;
                  matCol(1, wxx, wyy, 0);
                  const rt = 1 - Math.min(1, Math.max(0, de) / (1.8 * res));
                  let f = 1 + rt * (0.12 * Math.max(0, -nyo + 0.1) - 0.12 * Math.max(0, nyo));
                  if (de < 0.55 * res) f *= 0.88 + 0.12 * de / (0.55 * res);
                  MC[0] *= f; MC[1] *= f; MC[2] *= f;
                  C0[0] += (MC[0] - C0[0]) * cov; C0[1] += (MC[1] - C0[1]) * cov; C0[2] += (MC[2] - C0[2]) * cov;
                } else if (L === 3) { // cookie-crumb path, crumbly sunken edge
                  const ti = ((Math.floor(wyy * 2) & 127) << 7) | (Math.floor(wxx * 2) & 127);
                  const de = dist + CRN[ti] * 2.2 * res;
                  if (de < 0 && de > -0.9 * res) { const e = 1 + 0.07 * (1 + de / (0.9 * res)); C0[0] *= e; C0[1] *= e; C0[2] *= e; }
                  let cov = de + 0.5;
                  if (cov <= 0) continue;
                  if (cov > 1) cov = 1;
                  matCol(3, wxx, wyy, 0);
                  let f = 1;
                  if (de < 1.1 * res) f *= 0.8 + 0.2 * Math.max(0, de) / (1.1 * res);
                  if (nyo < 0) { const kk = 1 - Math.min(1, Math.max(0, de) / (3.4 * res)); f *= 1 - 0.3 * kk * kk * -nyo; }
                  MC[0] *= f; MC[1] *= f; MC[2] *= f;
                  C0[0] += (MC[0] - C0[0]) * cov; C0[1] += (MC[1] - C0[1]) * cov; C0[2] += (MC[2] - C0[2]) * cov;
                } else { // caramel pool, sunken
                  const de = dist;
                  if (de < 0 && de > -1.3 * res) { const e = 1 + 0.12 * (1 + de / (1.3 * res)); C0[0] *= e; C0[1] *= e; C0[2] *= e; }
                  let cov = de + 0.5;
                  if (cov <= 0) continue;
                  if (cov > 1) cov = 1;
                  matCol(0, wxx, wyy, s);
                  let f = 1;
                  if (nyo < 0) { const kk = 1 - Math.min(1, Math.max(0, de) / (4 * res)); f *= 1 - 0.38 * kk * kk * -nyo; }
                  if (de < 0.7 * res) f *= 0.72 + 0.28 * Math.max(0, de) / (0.7 * res);
                  MC[0] *= f; MC[1] *= f; MC[2] *= f;
                  if (nyo > 0.1 && de > 0.7 * res && de < 2.0 * res) {
                    const q = (1 - Math.abs(de / res - 1.35) / 0.65) * nyo * 0.55;
                    MC[0] += (255 - MC[0]) * q; MC[1] += (226 - MC[1]) * q; MC[2] += (160 - MC[2]) * q;
                  }
                  C0[0] += (MC[0] - C0[0]) * cov; C0[1] += (MC[1] - C0[1]) * cov; C0[2] += (MC[2] - C0[2]) * cov;
                }
              }
              buf[py * Wp + px] = pack(C0[0], C0[1], C0[2]);
            }
          }
        }
        yield;
      }
      for (let b = 0; b < Wp; b += 128) { ctx.putImageData(img, 0, 0, 0, b, Wp, Math.min(128, Wp - b)); yield; }
      yield* decals(ctx, info);
    },

    propsForChunk(info) {
      const out = [];
      G.scatterOwned(info, 80, 4243, (x, y, rng) => {
        if (G.nearSpawn(x, y, 95)) return;
        const r = rng.next(), vr = rng.next();
        const m = matSafe(x, y, 10);
        let t = null, v = 0;
        if (m === 0) { // chocolate
          if (r < 0.07) { t = 'lolli'; v = vr < 0.5 ? 1 : (vr * 4) | 0; }
          else if (r < 0.12) { t = 'grave'; v = vr < 0.6 ? 0 : 1; }
          else if (r < 0.15) t = 'bucket';
          else if (r < 0.19) { t = 'rock'; v = vr < 0.5 ? 0 : 1; }
          else if (r < 0.215) t = 'fence';
          else if (r < 0.225) { t = 'cupcake'; v = vr < 0.5 ? 0 : 1; }
        } else if (m === 3) { // mint
          if (r < 0.12) { t = 'lolli'; v = vr < 0.4 ? 0 : vr < 0.7 ? 3 : 1; }
          else if (r < 0.22) { t = 'bush'; v = (vr * 3) | 0; }
          else if (r < 0.25) t = 'fence';
          else if (r < 0.265) { t = 'cupcake'; v = 1; }
        } else if (m === 2) { // pink
          if (r < 0.09) { t = 'bush'; v = (vr * 3) | 0; }
          else if (r < 0.15) { t = 'lolli'; v = vr < 0.5 ? 2 : 3; }
          else if (r < 0.19) { t = 'rock'; v = vr < 0.5 ? 1 : 0; }
          else if (r < 0.205) { t = 'cupcake'; v = 0; }
          else if (r < 0.22) t = 'bucket';
        }
        if (!t) return;
        const d = PROP_DEF[t];
        out.push({ x, y, t, v, f: rng.chance(0.5), pad: d.pad });
      });
      return out;
    },

    drawProp(ctx, p) {
      const s = SPR.props[p.t][p.v];
      blit(ctx, p.f && p.t !== 'grave' ? s.l : s.n, p.x, p.y, 1, 1);
    },

    drawShadow(ctx, o) {
      let rx, ry, a = 1;
      if (o.kind === 'prop') { const d = PROP_DEF[o.t]; rx = d.sh[0]; ry = d.sh[1]; }
      else if (o.kind === 'enemy') {
        let k = 1;
        if (o.dying) { if (o.deathT > 0.4) return; k = 1 - o.deathT / 0.4; }
        if (o.spawnT < 1) k *= U.clamp(o.spawnT * 2.5 - 0.3, 0, 1);
        if (k <= 0.02) return;
        if (o.type === 'ghost') { rx = 6.2 * k; ry = 2.2 * k; a = 0.7; }
        else if (o.type === 'colossus') { rx = 20 * k; ry = 6 * k; }
        else { rx = 9 * k; ry = 3.2 * k; }
      } else {
        const h = o.moving ? Math.sin(((o.anim * 0.42) % 1) * PI) : 0;
        rx = (9 - h * 1.4) * JACK_SCALE; ry = (3.2 - h * 0.45) * JACK_SCALE;
      }
      shadow(ctx, o.x, o.y, rx, ry, a);
    },

    drawGroundOverlay(ctx, view, game) {
      // spawn: enemies pop out of an unwrapping candy wrapper
      for (const e of game.enemies) {
        if (e.dying || e.spawnT >= 1) { e._popd = false; continue; }
        if (e.x < view.x0 - 40 || e.x > view.x1 + 40 || e.y < view.y0 - 20 || e.y > view.y1 + 60) continue;
        const ghost = e.type === 'ghost';
        if (!e._popd && game.state === 'play') {
          e._popd = true;
          if (ghost) { for (let i = 0; i < 2; i++) { const a = Math.random() * TAU; puff(game, e.x + Math.cos(a) * 4, e.y, 6 + Math.random() * 6, 0, 0.5 + Math.random() * 0.3, Math.cos(a) * 14, Math.sin(a) * 6, 0.5, 4); } }
          else {
            const n = e.type === 'colossus' ? 6 : 3;
            for (let i = 0; i < n; i++) { const a = Math.random() * TAU; add(game, { kind: 'conf', tint: (Math.random() * 6) | 0, x: e.x, y: e.y, z: 1, vx: Math.cos(a) * 30, vy: Math.sin(a) * 14, vz: 50 + Math.random() * 40, grav: 200, drag: 1.5, life: 0.7, size: 0.9, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12 }); }
          }
        }
        if (ghost) continue;
        const t = e.spawnT;
        const a = t < 0.18 ? U.ease.outBack(t / 0.18) : t > 0.7 ? Math.max(0, 1 - (t - 0.7) / 0.3) : 1;
        if (a <= 0.01) continue;
        const sc = (e.type === 'colossus' ? 1.9 : 0.95) * a;
        const w = SPR.wrapper[Math.floor(e.seed * 4) & 3];
        ctx.globalAlpha = Math.min(1, a * 1.5);
        blit(ctx, w, e.x, e.y, sc, sc);
        ctx.globalAlpha = 1;
      }
    },

    drawWorldOverlay(ctx, view) {
      // a few drifting sugar sparkles in the air
      const V = tf(view), cell = 140, rt = view.rt;
      const x0 = Math.floor(view.x0 / cell), x1 = Math.floor(view.x1 / cell);
      const y0 = Math.floor(view.y0 / cell), y1 = Math.floor(view.y1 / cell);
      ctx.globalCompositeOperation = 'lighter';
      for (let cy = y0; cy <= y1; cy++) {
        for (let cx = x0; cx <= x1; cx++) {
          const h = U.hash2(cx, cy, 991);
          if (h > 0.6) continue;
          const ph = h * 40;
          const x = (cx + U.hash2(cx, cy, 992)) * cell + Math.sin(rt * 0.3 + ph) * 20;
          const y = (cy + U.hash2(cx, cy, 993)) * cell + Math.cos(rt * 0.23 + ph) * 14 - ((rt * 6 + ph * 10) % 40);
          const tw = Math.sin(rt * 2.2 + ph * 3);
          if (tw < 0) continue;
          ctx.globalAlpha = tw * 0.7;
          blitRot(ctx, V, SPR.sugar[(h * 30 | 0) % 3], x, y, 0.5 + tw * 0.3, 0.5 + tw * 0.3, rt * 0.5 + ph);
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    },

    drawScreenOverlay(ctx, view) {
      if (!VIG || VIG.w !== view.W || VIG.h !== view.H) {
        const w = 320, h = Math.round(320 * view.H / view.W);
        const c = U.sprite(w, h, (k) => {
          const g = k.createRadialGradient(w / 2, h * 0.46, h * 0.35, w / 2, h / 2, w * 0.62);
          g.addColorStop(0, 'rgba(60,10,50,0)'); g.addColorStop(0.7, 'rgba(60,10,50,0.16)'); g.addColorStop(1, 'rgba(50,8,40,0.42)');
          k.fillStyle = g; k.fillRect(0, 0, w, h);
        });
        VIG = { w: view.W, h: view.H, c };
      }
      ctx.drawImage(VIG.c, 0, 0, view.W, view.H);
    },

    drawGem(ctx, g, view) {
      const s = g.big ? SPR.gemB : SPR.gemS;
      let h = 1.2 + Math.sin(view.rt * 4 + g.seed * 20) * 0.9;
      let sx = 1, sy = 1;
      if (g.pop > 0) {
        const q = 1 - g.pop;
        h += Math.sin(q * PI) * 10;
        const p = U.ease.outBack(Math.min(1, q * 1.4));
        sx = 0.4 + 0.6 * p; sy = sx;
      } else if (!g.fly) {
        const b = Math.sin(view.rt * 4 + g.seed * 20);
        sx = 1 + b * 0.05; sy = 1 - b * 0.04;
      }
      const sk = g.big ? 1.4 : 1;
      shadow(ctx, g.x, g.y, 3.2 * sk * (1 - h * 0.03), 1.3 * sk, 0.8);
      const V = tf(view);
      blitRot(ctx, V, s, g.x, g.y - h, sx, sy, Math.sin(view.rt * 2 + g.seed * 9) * 0.18);
      if (g.big || (g.seed > 0.7)) {
        const tw = Math.sin(view.rt * 3 + g.seed * 9);
        if (tw > 0.6) {
          const q = (tw - 0.6) / 0.4;
          ctx.globalCompositeOperation = 'lighter';
          blitRot(ctx, V, SPR.sugar[2], g.x + (g.big ? 3.5 : 2), g.y - h - (g.big ? 7 : 5), q * 0.55, q * 0.55, view.rt);
          ctx.globalCompositeOperation = 'source-over';
        }
      }
    },

    drawEnemy(ctx, e, view) {
      const V = tf(view);
      let set, rot = 0, sx = 1, sy = 1, y = e.y, alpha = 1;
      let scl = 0.94 + e.seed * 0.12;
      if (e.type === 'creeper') {
        const ph = e.anim * 0.85 + e.seed;
        const f = Math.floor(ph * 4) & 3;
        set = SPR.creep[Math.floor(e.seed * 3) % 3][f];
        scl *= 0.92;
        const sn = Math.sin(ph * TAU), up = Math.abs(sn);
        rot = sn * 0.1;
        y -= up * 1.3;
        sx = 1 + (1 - up) * 0.07; sy = 1 - (1 - up) * 0.08 + up * 0.04; // jelly wobble
      } else if (e.type === 'ghost') {
        const f = Math.floor(view.rt * 6 + e.seed * 4) & 3;
        set = SPR.ghost[f];
        y -= 4.5 + Math.sin(view.rt * 2.6 + e.seed * 12) * 1.6;
        rot = U.clamp(e.vx / 64, -1, 1) * 0.14;
        const b = Math.sin(view.rt * 4.2 + e.seed * 7);
        sx = 1 + b * 0.05; sy = 1 - b * 0.05;
        alpha = 0.9;
      } else {
        const ph = e.anim * 0.32 + e.seed;
        const f = Math.floor(ph * 4) & 3;
        set = SPR.colo[f];
        const sn = Math.sin(ph * TAU), up = Math.abs(sn);
        const contact = Math.pow(1 - up, 3);
        y -= up * 2.0;
        sx = 1 + contact * 0.08; sy = 1 - contact * 0.08;
        rot = sn * 0.035;
      }
      sx *= scl; sy *= scl;
      const left = e.facing < 0;
      if (e.spawnT < 1) {
        if (e.type === 'ghost') {
          const q = U.clamp(e.spawnT / 0.8, 0, 1);
          alpha *= q;
          const p = U.ease.outBack(q);
          sx *= p; sy *= p;
        } else {
          const q = U.clamp((e.spawnT - 0.12) / 0.88, 0, 1);
          if (q <= 0) return;
          const p = U.ease.outElastic(q);
          sy *= p; sx *= p > 0.05 ? U.clamp(1 / Math.sqrt(p), 0.75, 1.5) : 1.5;
          rot *= q;
        }
      }
      if (e.dying) {
        const q = e.deathT;
        if (q >= 0.42) return;
        const k = q < 0.2 ? 1 + U.ease.outQuad(q / 0.2) * 0.25 : 1.25 * (1 - U.ease.inQuad((q - 0.2) / 0.22));
        sx *= k * (1 + 0.12 * Math.sin(q * 44)); sy *= k * (1 - 0.12 * Math.sin(q * 44));
        ctx.globalAlpha = alpha;
        const s0 = left ? set.nl : set.n;
        if (rot) blitRot(ctx, V, s0, e.x, y, sx, sy, rot); else blit(ctx, s0, e.x, y, sx, sy);
        ctx.globalAlpha = alpha * 0.6;
        const s1 = left ? set.fl : set.f;
        if (rot) blitRot(ctx, V, s1, e.x, y, sx, sy, rot); else blit(ctx, s1, e.x, y, sx, sy);
        ctx.globalAlpha = 1;
        return;
      }
      const fl = e.flash;
      if (fl > 0) { sx *= 1 + 0.18 * fl; sy *= 1 - 0.15 * fl; }
      ctx.globalAlpha = alpha;
      const s = left ? set.nl : set.n;
      if (rot) blitRot(ctx, V, s, e.x, y, sx, sy, rot); else blit(ctx, s, e.x, y, sx, sy);
      if (fl > 0.02) {
        ctx.globalAlpha = Math.min(e.type === 'colossus' ? 0.45 : 0.55, fl * 0.9) * alpha;
        const f2 = left ? set.fl : set.f;
        if (rot) blitRot(ctx, V, f2, e.x, y, sx, sy, rot); else blit(ctx, f2, e.x, y, sx, sy);
      }
      ctx.globalAlpha = 1;
    },

    drawPlayer(ctx, p, view) {
      const V = tf(view), game = view.game;
      let frame = 0, sx = 1, sy = 1, lift = 0, rot = 0;
      if (p.moving) {
        const ph = p.anim * 0.42, f = ph - Math.floor(ph), hop = Math.floor(ph);
        const air = Math.sin(f * PI);
        lift = air * 3.2;
        const contact = Math.max(0, 1 - Math.min(f, 1 - f) * 6);
        sy = 1 + 0.07 * air - 0.13 * contact;
        sx = 1 - 0.04 * air + 0.12 * contact;
        frame = contact > 0.25 ? (hop & 1 ? 1 : 3) : 2;
        rot = 0.07 * p.facing * air;
        if (hop !== lastHop) {
          if (lastHop >= 0 && game && game.state === 'play' && p.dashT <= 0 && Math.random() < 0.6) {
            sugar(game, p.x - p.facing * 3, p.y + 0.5, 1.5, 1, 18, (Math.random() * 3) | 0);
          }
          lastHop = hop;
        }
      } else {
        const b = Math.sin(view.rt * 3.2);
        sy = 1 + 0.03 * b; sx = 1 - 0.022 * b;
        lastHop = -1;
      }
      if (p.shootT > 0) { sy *= 1 - 0.05 * p.shootT; sx *= 1 + 0.04 * p.shootT; }
      if (p.levelT > 0) { const w = Math.sin(p.levelT * PI * 4) * p.levelT; sy *= 1 + 0.18 * w; sx *= 1 - 0.12 * w; }
      const hurt = p.hurtT > 0;
      if (hurt) { sx *= 1 + 0.16 * p.hurtT; sy *= 1 - 0.13 * p.hurtT; }
      sx *= JACK_SCALE; sy *= JACK_SCALE; lift *= JACK_SCALE;
      const left = p.facing < 0;
      const set = (hurt ? SPR.jackHurt : SPR.jack)[frame];
      if (p.dashT > 0) {
        const k = U.clamp(p.dashT / 0.2, 0, 1);
        sx *= 1 + 0.2 * k; sy *= 1 - 0.12 * k;
        for (let i = 3; i >= 1; i--) {
          ctx.globalAlpha = (0.4 / i) * k;
          blit(ctx, left ? set.fl : set.f, p.x - p.dashX * i * 7, p.y - p.dashY * i * 7 - lift, sx, sy);
        }
        ctx.globalAlpha = 1;
      }
      // warm caramel glow around the head
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.32 + 0.06 * Math.sin(view.rt * 7);
      blit(ctx, SPR.glow, p.x + p.facing * 1.5, p.y - lift - 20 * JACK_SCALE, 1.15, 1.0);
      ctx.globalCompositeOperation = 'source-over';
      let a = 1;
      if (p.iframes > 0 && !hurt && p.dashT <= 0 && (Math.floor(view.rt * 16) & 1)) a = 0.5;
      ctx.globalAlpha = a;
      blitRot(ctx, V, left ? set.nl : set.n, p.x, p.y - lift, sx, sy, rot);
      if (hurt) {
        ctx.globalAlpha = Math.min(0.75, p.hurtT * 1.1);
        blitRot(ctx, V, left ? set.fl : set.f, p.x, p.y - lift, sx, sy, rot);
      }
      ctx.globalAlpha = 1;
    },

    drawOrbital(ctx, o, view) {
      const V = tf(view);
      const bob = Math.sin(view.rt * 4 + o.idx * 1.7) * 1.4;
      shadow(ctx, o.x, o.y + 4, 5, 1.8, 0.8);
      const y = o.y - 3 + bob;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.5 + 0.12 * Math.sin(view.rt * 9 + o.idx * 2.1);
      blit(ctx, SPR.glow, o.x, y - 7, 1, 1);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      const sq = Math.sin(view.rt * 8 + o.idx);
      blitRot(ctx, V, SPR.lantern, o.x, y, 1 + sq * 0.05, 1 - sq * 0.05, Math.sin(view.rt * 3 + o.idx) * 0.14);
    },

    drawProjectile(ctx, pr, view) {
      const V = tf(view);
      shadow(ctx, pr.x, pr.y + 6, 2.6, 1.0, 0.6);
      ctx.globalAlpha = Math.min(1, pr.age * 14) * 0.85;
      blitRot(ctx, V, SPR.streak, pr.x, pr.y, 1, 1, pr.angle);
      ctx.globalAlpha = 1;
      const sq = 0.6 + 0.4 * Math.abs(Math.cos(pr.spin));
      blitRot(ctx, V, SPR.seed[Math.floor(pr.seed * 4) & 3], pr.x, pr.y, 1, sq, pr.angle);
    },

    drawParticle(ctx, pt, view) {
      const V = tf(view);
      const t = 1 - pt.life / pt.max;
      let s, spr, rot = pt.rot, z = pt.z;
      switch (pt.kind) {
        case 'sprink': spr = SPR.sprink[pt.tint || 0]; s = pt.size * (t > 0.8 ? 1 - (t - 0.8) / 0.2 : 1); break;
        case 'gummy': spr = SPR.gummy[pt.tint || 0]; s = pt.size * (t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1); break;
        case 'choc': spr = SPR.choc[pt.tint || 0]; s = pt.size * (t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1); break;
        case 'drop': spr = SPR.drop; s = pt.size * (t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1); rot = 0; break;
        case 'corn': spr = SPR.corn; s = pt.size * (t > 0.8 ? 1 - (t - 0.8) / 0.2 : 1); break;
        case 'puff': {
          spr = SPR.puff[pt.tint || 0];
          const sc = t < 0.2 ? U.ease.outBack(t / 0.2) : 1 - Math.pow((t - 0.2) / 0.8, 2);
          s = pt.size * Math.max(0, sc);
          z += (pt.rise || 0) * t; rot *= 0.3;
          break;
        }
        case 'hit': {
          spr = SPR.hit;
          const sc = t < 0.3 ? 0.5 + (t / 0.3) * 0.7 : 1.2 - (t - 0.3) / 0.7 * 0.9;
          s = pt.size * sc;
          break;
        }
        case 'sugar': {
          spr = SPR.sugar[pt.tint || 0];
          s = pt.size * (t < 0.25 ? t / 0.25 : 1 - (t - 0.25) / 0.75);
          if (!(s > 0.01)) return;
          ctx.globalCompositeOperation = 'lighter';
          blitRot(ctx, V, spr, pt.x, pt.y - z, s, s, view.rt * 2 + pt.seed * 6);
          ctx.globalCompositeOperation = 'source-over';
          return;
        }
        case 'conf': {
          spr = SPR.conf[pt.tint || 0];
          s = pt.size * (t > 0.8 ? 1 - (t - 0.8) / 0.2 : 1);
          if (s <= 0.01) return;
          const fl = Math.cos(view.rt * 9 + pt.seed * 20);
          const S = V.S, co = Math.cos(rot) * S, si = Math.sin(rot) * S;
          ctx.setTransform(co * s, si * s, -si * s * fl, co * s * fl, V.ox + pt.x * S, V.oy + (pt.y - z) * S);
          const k = 1 / spr.k;
          ctx.drawImage(spr.c, -spr.ox * k, -spr.oy * k, spr.c.width * k, spr.c.height * k);
          ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
          return;
        }
        case 'ring': {
          const r = pt.size * (4 + 26 * U.ease.outQuad(t));
          const w = 2.6 * (1 - t);
          if (w <= 0.05) return;
          ctx.beginPath(); ctx.ellipse(pt.x, pt.y, r, r * 0.45, 0, 0, TAU);
          ctx.strokeStyle = OUT; ctx.lineWidth = w + 1.2; ctx.stroke();
          ctx.strokeStyle = pt.color || '#ffffff'; ctx.lineWidth = w; ctx.stroke();
          ctx.setLineDash([2.2, 2.6]); ctx.strokeStyle = pt.color2 || '#ff5c9e'; ctx.lineWidth = w * 0.7; ctx.stroke(); ctx.setLineDash([]);
          return;
        }
        default: {
          const a = U.clamp(pt.life / pt.max, 0, 1);
          ctx.globalAlpha = a; ctx.fillStyle = pt.color || '#fff';
          ctx.beginPath(); ctx.arc(pt.x, pt.y - z, (pt.size || 2) * 0.5, 0, TAU); ctx.fill();
          ctx.globalAlpha = 1;
          return;
        }
      }
      if (!(s > 0.01)) return;
      blitRot(ctx, V, spr, pt.x, pt.y - z, s, s, rot);
    },

    drawNumber(ctx, n, view) {
      const V = tf(view);
      const spr = numSprite(n.value, n.crit, view.rt);
      const t = 1 - n.life / n.max;
      let sc = t < 0.1 ? 0.3 + (t / 0.1) * 1.05 : t < 0.24 ? 1.35 - ((t - 0.1) / 0.14) * 0.35 : 1;
      if (t > 0.72) sc *= 1 - ((t - 0.72) / 0.28) * 0.7;
      ctx.globalAlpha = t > 0.82 ? Math.max(0, 1 - (t - 0.82) / 0.18) : 1;
      blitRot(ctx, V, spr, n.x, n.y - t * 4, sc, sc, (n.seed - 0.5) * 0.3);
      ctx.globalAlpha = 1;
    },

    drawIcon(ctx, id, size) {
      const fn = ICONS[id] || ICONS.dmg;
      const { c, ctx: k } = U.canvas(size, size);
      k.scale(size / 48, size / 48);
      k.lineJoin = 'round'; k.lineCap = 'round';
      // keep a margin for the outline
      k.translate(24, 24); k.scale(0.9, 0.9); k.translate(-24, -24);
      fn(k);
      const o = addOutline(c, OUT, Math.max(1.5, size / 26));
      ctx.drawImage(o, 0, 0);
    },

    /* --------------------------------------------------------------- hooks */
    onHit(game, e) {
      const h = e.type === 'colossus' ? 24 : e.type === 'ghost' ? 15 : 11;
      add(game, { kind: 'hit', x: e.x + (Math.random() - 0.5) * 5, y: e.y + 0.5, z: h + (Math.random() - 0.5) * 5, life: 0.14, size: e.type === 'colossus' ? 0.95 : 0.7, rot: Math.random() * TAU, drag: 0 });
      if (Math.random() < 0.5) sprinkles(game, e.x, e.y + 0.5, h, 1, 50);
      if (Math.random() < 0.5) sugar(game, e.x, e.y + 0.5, h, 1, 40, (Math.random() * 3) | 0);
    },
    onKill(game, e) {
      const x = e.x, y = e.y + 0.6, T = e.type;
      const big = T === 'colossus', ghost = T === 'ghost';
      const h = big ? 22 : ghost ? 13 : 10;
      sprinkles(game, x, y, h, big ? 16 : ghost ? 5 : 8, big ? 70 : 55);
      sugar(game, x, y, h, big ? 6 : 3, 60, (Math.random() * 3) | 0);
      if (ghost) {
        for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU + Math.random() * 0.6, sp = 26 * (0.6 + Math.random() * 0.6); puff(game, x + Math.cos(a) * 3, y + Math.sin(a) * 1.2, h + Math.sin(a) * 4, 0, 0.8 * (0.75 + Math.random() * 0.5), Math.cos(a) * sp, Math.sin(a) * sp * 0.55, 0.45 + Math.random() * 0.2, 7); }
      } else if (big) {
        for (let i = 0; i < 10; i++) {
          const a = Math.random() * TAU, sp = 30 + Math.random() * 50;
          add(game, { kind: i < 6 ? 'choc' : 'drop', tint: i % 3, x, y, z: h * 0.8, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 60 + Math.random() * 60, grav: 280, drag: 1.2, life: 0.9 + Math.random() * 0.35, size: 1.2 * (0.8 + Math.random() * 0.5), rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14 });
        }
        for (let i = 0; i < 3; i++) { const a = Math.random() * TAU; add(game, { kind: 'corn', x, y, z: h, vx: Math.cos(a) * 50, vy: Math.sin(a) * 30, vz: 80, grav: 260, drag: 1.2, life: 1.0, size: 1.0, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12 }); }
        for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU; puff(game, x + Math.cos(a) * 6, y, h * 0.6, 1, 1.2, Math.cos(a) * 30, Math.sin(a) * 15, 0.5, 6); }
        add(game, { kind: 'ring', x, y, life: 0.45, size: 1.4, drag: 0, color: '#ffd23a', color2: '#7a3a1a' });
      } else {
        const v = Math.floor(e.seed * 3) % 3;
        for (let i = 0; i < 6; i++) {
          const a = Math.random() * TAU, sp = 30 + Math.random() * 45;
          add(game, { kind: 'gummy', tint: i < 3 ? v : i === 3 ? 3 : 4, x, y, z: h * 0.7, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 50 + Math.random() * 60, grav: 280, drag: 1.2, life: 0.8 + Math.random() * 0.35, size: 1.0 * (0.8 + Math.random() * 0.5), rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14 });
        }
        puff(game, x, y, h, 0, 0.9, 0, 0, 0.35, 4);
      }
    },
    onHurt(game, p) {
      add(game, { kind: 'hit', x: p.x, y: p.y + 0.5, z: 16, life: 0.18, size: 1.1, rot: Math.random() * TAU, drag: 0 });
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * TAU, sp = 40 + Math.random() * 40;
        add(game, { kind: 'drop', x: p.x, y: p.y + 0.5, z: 18, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 60, grav: 280, drag: 1.2, life: 0.7, size: 0.7, rot: 0 });
      }
      sprinkles(game, p.x, p.y + 0.5, 18, 4, 50);
    },
    onPickup(game, g) {
      const p = game.player;
      sugar(game, p.x + (Math.random() - 0.5) * 8, p.y + 0.5, 10 + Math.random() * 10, 1, 10, g.big ? 2 : 1);
    },
    onShoot(game, pr) {
      if (Math.random() < 0.35) sugar(game, pr.x, pr.y + 4, 4, 1, 10, 0);
    },
    onDash(game, p) {
      for (let i = 0; i < 4; i++) puff(game, p.x - p.dashX * i * 3 + (Math.random() - 0.5) * 4, p.y + 0.5 - p.dashY * i * 3, 1.5, 0, 0.45 + Math.random() * 0.2, -p.dashX * 20, -p.dashY * 20, 0.38, 3);
      sugar(game, p.x, p.y, 8, 3, 30, 1);
    },
    onLevelUp(game, p) {
      add(game, { kind: 'ring', x: p.x, y: p.y, life: 0.6, size: 1.6, drag: 0, color: '#ffffff', color2: '#ff5c9e' });
      sprinkles(game, p.x, p.y + 0.5, 16, 22, 80);
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * TAU, sp = 30 + Math.random() * 50;
        add(game, { kind: 'conf', tint: i % 6, x: p.x, y: p.y + 0.5, z: 20, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5, vz: 80 + Math.random() * 60, grav: 120, drag: 2.5, life: 1.3 + Math.random() * 0.5, size: 1.0 + Math.random() * 0.4, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 8 });
      }
      sugar(game, p.x, p.y, 16, 8, 70, 2);
    },
    onDeath(game, p) {
      for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; puff(game, p.x, p.y + 0.5, 14, 1, 1.1, Math.cos(a) * 40, Math.sin(a) * 22, 0.7, 8); }
      sprinkles(game, p.x, p.y, 16, 20, 80);
    },
  });
})();
