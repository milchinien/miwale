/* ============================================================================
   Knetwelt (id: clay) – stop-motion plasticine miniature set (Aardman / Clay Jam).
   No outlines: every part is a soft volume painted from layered gradients –
   base fill, radial key-light shading, inner ambient occlusion (shadow trick),
   top rim light, procedural fingerprint/tool-mark pattern, soft broad specular –
   plus soft contact shadows where parts overlap. Sprites are pre-rendered per
   frame with different lump seeds ("boil"); animation steps at 12 fps.
   Ground: clay sheets (meadow / soil / purple / ochre paths / sunken ponds) –
   per-pixel signed distance gives clean raised rims (lit bevel + cast shadow),
   a tileable lumpy height texture gives the hand-pressed surface, decals are
   tool imprints, thumbprints, rolled pebbles, worms, flowers, lily pads.
   ========================================================================== */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2, PI = Math.PI;

  let K = 3;      // sprite resolution (px per world unit)
  let PK = 3;     // px per unit of the canvas currently being painted
  const SPR = {};
  let FPC = null; // fingerprint pattern canvas
  let PR = U.rng(1);

  const hx = U.hex;
  const rgbS = (a, al) => (al === undefined
    ? 'rgb(' + (a[0] | 0) + ',' + (a[1] | 0) + ',' + (a[2] | 0) + ')'
    : 'rgba(' + (a[0] | 0) + ',' + (a[1] | 0) + ',' + (a[2] | 0) + ',' + al + ')');
  const lighten = (c, t) => U.mix(c, [255, 251, 240], t);
  const darken = (c, t) => U.mix(U.mul(c, 1 - t), [64, 26, 52], t * 0.3);

  /* ----------------------------------------------------------- shape helpers */
  const E = (x, y, rx, ry, rot) => (c) => {
    rot = rot || 0;
    c.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot));
    c.ellipse(x, y, rx, ry, rot, 0, TAU);
  };
  const CAP = (x1, y1, x2, y2, r) => (c) => {
    const a = Math.atan2(y2 - y1, x2 - x1);
    c.moveTo(x1 + Math.cos(a + PI / 2) * r, y1 + Math.sin(a + PI / 2) * r);
    c.arc(x1, y1, r, a + PI / 2, a + PI * 1.5);
    c.arc(x2, y2, r, a - PI / 2, a + PI / 2);
    c.closePath();
  };
  function blobPath(c, pts) {
    const n = pts.length;
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
    c.closePath();
  }
  function lumpPts(cx, cy, rx, ry, n, amt, r) {
    const pts = [], ph = r.next() * TAU;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const k = 1 + (r.next() - 0.5) * amt + Math.sin(a * 3 + ph) * amt * 0.25;
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    return pts;
  }
  function pumpkinPath(c, cx, cy, rx, ry) {
    const N = 56;
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
  function seedPathV(c, s) {
    c.moveTo(0, -2.1 * s);
    c.bezierCurveTo(1.7 * s, -1.3 * s, 1.6 * s, 1.5 * s, 0, 1.9 * s);
    c.bezierCurveTo(-1.6 * s, 1.5 * s, -1.7 * s, -1.3 * s, 0, -2.1 * s);
    c.closePath();
  }
  const seedPathH = (c) => { c.moveTo(4.2, 0); c.bezierCurveTo(2.6, -2.7, -3.4, -3.0, -3.4, 0); c.bezierCurveTo(-3.4, 3.0, 2.6, 2.7, 4.2, 0); c.closePath(); };

  /* ================================================================ painter */
  /** One plasticine part: fill + key light + inner AO + rim light + fingerprints + soft spec. */
  function clay(c, shape, col, o) {
    o = o || {};
    const b = o.b, cx = b[0], cy = b[1], rx = b[2], ry = b[3], R = Math.max(rx, ry);
    if (typeof col === 'string') col = hx(col);
    const base = rgbS(col);
    if (o.cast !== 0) {
      // soft contact shadow onto parts already on the canvas
      c.save();
      c.globalCompositeOperation = 'source-atop';
      c.shadowColor = 'rgba(52,22,24,' + (o.cast || 0.42) + ')';
      c.shadowBlur = Math.min(R * 0.4, 2.4) * PK;
      c.shadowOffsetX = Math.min(R * 0.06, 0.45) * PK;
      c.shadowOffsetY = Math.min(R * 0.2, 1.4) * PK;
      c.fillStyle = base;
      c.beginPath(); shape(c); c.fill();
      c.restore();
    }
    c.save();
    c.beginPath(); shape(c);
    c.fillStyle = base; c.fill();
    c.clip();
    const g = c.createRadialGradient(cx - rx * 0.25, cy - ry * 0.5, R * 0.04, cx + rx * 0.05, cy + ry * 0.05, R * 1.22);
    g.addColorStop(0, rgbS(lighten(col, o.lit === undefined ? 0.2 : o.lit)));
    g.addColorStop(0.5, base);
    g.addColorStop(1, rgbS(o.dark || darken(col, 0.4)));
    c.fillStyle = g; c.fillRect(cx - R * 2.5, cy - R * 2.5, R * 5, R * 5);
    if (o.fp !== 0 && FPC) {
      const pat = c.createPattern(FPC, 'repeat');
      pat.setTransform(new DOMMatrix([1 / PK, 0, 0, 1 / PK, PR.next() * 60, PR.next() * 60]));
      c.globalAlpha = o.fp || 1;
      c.fillStyle = pat; c.fillRect(cx - R * 1.6, cy - R * 1.6, R * 3.2, R * 3.2);
      c.globalAlpha = 1;
    }
    // inner ambient occlusion (bottom) + rim light (top) via offset shadows of the outside
    const OFF = 3000;
    c.save();
    c.beginPath();
    c.rect(cx - R * 3 + OFF, cy - R * 3, R * 6, R * 6);
    c.translate(OFF, 0); shape(c); c.translate(-OFF, 0);
    c.fillStyle = '#000';
    c.shadowColor = 'rgba(58,20,40,' + (o.ao === undefined ? 0.5 : o.ao) + ')';
    c.shadowBlur = R * 0.6 * PK;
    c.shadowOffsetX = -OFF * PK - R * 0.1 * PK;
    c.shadowOffsetY = -R * 0.3 * PK;
    c.fill('evenodd');
    if (o.rim !== 0) {
      c.shadowColor = 'rgba(255,247,230,' + (o.rim === undefined ? 0.42 : o.rim) + ')';
      c.shadowBlur = R * 0.26 * PK;
      c.shadowOffsetX = -OFF * PK + R * 0.04 * PK;
      c.shadowOffsetY = R * 0.12 * PK;
      c.fill('evenodd');
    }
    c.restore();
    if (o.detail) { c.save(); o.detail(c); c.restore(); }
    const sp = o.spec === undefined ? 0.3 : o.spec;
    if (sp > 0) {
      const h = o.hi || [cx - rx * 0.3, cy - ry * 0.52, R * 0.45];
      c.save(); c.translate(h[0], h[1]); c.rotate(-0.45); c.scale(1.4, 0.8);
      const sg = c.createRadialGradient(0, 0, 0, 0, 0, h[2]);
      sg.addColorStop(0, 'rgba(255,255,252,' + sp + ')');
      sg.addColorStop(0.45, 'rgba(255,253,244,' + (sp * 0.38) + ')');
      sg.addColorStop(1, 'rgba(255,252,240,0)');
      c.fillStyle = sg; c.beginPath(); c.arc(0, 0, h[2], 0, TAU); c.fill();
      if (o.gloss) {
        c.fillStyle = 'rgba(255,255,255,' + o.gloss + ')';
        c.beginPath(); c.ellipse(-h[2] * 0.1, -h[2] * 0.06, h[2] * 0.32, h[2] * 0.17, 0, 0, TAU); c.fill();
      }
      c.restore();
    }
    c.restore();
  }
  const cE = (c, x, y, rx, ry, col, o) => clay(c, E(x, y, rx, ry), col, Object.assign({ b: [x, y, rx, ry] }, o));
  const cCap = (c, x1, y1, x2, y2, r, col, o) => clay(c, CAP(x1, y1, x2, y2, r), col,
    Object.assign({ b: [(x1 + x2) / 2, (y1 + y2) / 2, Math.abs(x2 - x1) / 2 + r, Math.abs(y2 - y1) / 2 + r] }, o));
  const cLump = (c, x, y, rx, ry, col, amt, o) => {
    const pts = lumpPts(x, y, rx, ry, 11, amt, PR);
    clay(c, (k) => blobPath(k, pts), col, Object.assign({ b: [x, y, rx, ry] }, o));
  };
  /** Pressed groove: dark furrow + lit lower lip. */
  function groove(c, path, w, a) {
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = 'rgba(58,22,18,' + a + ')'; c.lineWidth = w;
    c.beginPath(); path(c); c.stroke();
    c.save(); c.translate(0, w * 0.55);
    c.strokeStyle = 'rgba(255,240,220,' + a * 0.75 + ')'; c.lineWidth = w * 0.5;
    c.beginPath(); path(c); c.stroke(); c.restore();
  }
  /** Eyeball: white clay ball + glossy black pupil. */
  function eye(c, x, y, rx, ry, px, py, pr) {
    cE(c, x, y, rx, ry, [250, 248, 240], { spec: 0.5, ao: 0.4, cast: 0.35, fp: 0.5, lit: 0.1 });
    c.fillStyle = '#1e1420'; c.beginPath(); c.arc(px, py, pr, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(px - pr * 0.35, py - pr * 0.4, pr * 0.32, 0, TAU); c.fill();
  }
  /** Carved hole: dark cavity + warm candle light inside, shifted down (thickness). */
  function carve(c, path, glow) {
    c.save();
    c.beginPath(); path(c); c.fillStyle = '#4e1606'; c.fill();
    c.clip();
    c.translate(0.15, 0.8);
    c.beginPath(); path(c); c.fillStyle = glow; c.fill();
    c.restore();
  }
  function glowGrad(c, x, y, r) {
    const g = c.createRadialGradient(x, y, r * 0.05, x, y, r);
    g.addColorStop(0, '#fff7c4'); g.addColorStop(0.45, '#ffd458'); g.addColorStop(1, '#ff8f22');
    return g;
  }

  /* -------------------------------------------------------- fingerprints */
  function makeFingerprint() {
    const W = 192;
    const { c, ctx } = U.canvas(W, W);
    const r = U.rng(4711);
    const prints = [], marks = [];
    for (let i = 0; i < 7; i++) prints.push({ x: r.next() * W, y: r.next() * W, rx: 9 + r.next() * 9, rot: r.next() * PI, n: 5 + r.int(0, 3), a0: r.next() * TAU, sw: PI * (1.0 + r.next() * 0.9) });
    for (let i = 0; i < 12; i++) marks.push({ x: r.next() * W, y: r.next() * W, a: r.next() * PI, l: 5 + r.next() * 12, b: (r.next() - 0.5) * 6 });
    U.tileDraw(ctx, W, W, (k, ox, oy) => {
      k.lineCap = 'round';
      for (const p of prints) {
        for (let j = 1; j <= p.n; j++) {
          const rr = j * (p.rx / p.n), a0 = p.a0 + j * 0.35;
          k.lineWidth = 0.9;
          k.strokeStyle = 'rgba(70,28,20,0.1)';
          k.beginPath(); k.ellipse(p.x + ox, p.y + oy, rr, rr * 1.25, p.rot, a0, a0 + p.sw); k.stroke();
          k.strokeStyle = 'rgba(255,246,232,0.09)';
          k.beginPath(); k.ellipse(p.x + ox, p.y + oy + 0.9, rr, rr * 1.25, p.rot, a0, a0 + p.sw); k.stroke();
        }
      }
      for (const m of marks) {
        const dx = Math.cos(m.a) * m.l, dy = Math.sin(m.a) * m.l;
        k.lineWidth = 1.3; k.strokeStyle = 'rgba(70,28,20,0.07)';
        k.beginPath(); k.moveTo(m.x + ox, m.y + oy); k.quadraticCurveTo(m.x + ox + dx * 0.5 + m.b, m.y + oy + dy * 0.5 - m.b, m.x + ox + dx, m.y + oy + dy); k.stroke();
        k.lineWidth = 0.8; k.strokeStyle = 'rgba(255,246,232,0.08)';
        k.beginPath(); k.moveTo(m.x + ox, m.y + oy + 1.1); k.quadraticCurveTo(m.x + ox + dx * 0.5 + m.b, m.y + oy + dy * 0.5 - m.b + 1.1, m.x + ox + dx, m.y + oy + dy + 1.1); k.stroke();
      }
    });
    return c;
  }

  /* --------------------------------------------------------- sprite builder */
  function build(box, fn, seed) {
    const l = box[0], t = box[1], r = box[2], b = box[3];
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((r - l) * K); cv.height = Math.ceil((b - t) * K);
    const ctx = cv.getContext('2d');
    ctx.scale(K, K); ctx.translate(-l, -t);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    PK = K; PR = U.rng(seed || 1);
    fn(ctx);
    return { c: cv, ox: -l * K, oy: -t * K };
  }
  function flipS(s) { return { c: U.flipX(s.c), ox: s.c.width - s.ox, oy: s.oy }; }
  function set4(box, fn, seed) {
    const n = build(box, fn, seed);
    const f = { c: U.tint(n.c, '#fff8ec', 1), ox: n.ox, oy: n.oy };
    return { n, f, nl: flipS(n), fl: flipS(f) };
  }
  function plain(box, fn) {
    const l = box[0], t = box[1], r = box[2], b = box[3];
    const { c, ctx } = U.canvas((r - l) * K, (b - t) * K);
    ctx.scale(K, K); ctx.translate(-l, -t);
    fn(ctx);
    return { c, ox: -l * K, oy: -t * K };
  }

  /* ============================================================ characters */
  const JC = {
    pump: [238, 122, 34], body: [60, 98, 166], pants: [52, 76, 128], scarf: [104, 174, 72], scarf2: [234, 214, 120],
    shoe: [108, 66, 42], hand: [248, 224, 186], stem: [120, 116, 52], leaf: [104, 166, 70],
  };
  // back foot x,y | front foot x,y | back arm, front arm (rad from down, + = forward) | body lift
  const JACK_FR = [
    [-2.1, 0, 2.3, 0, 0.18, -0.18, 0],
    [-3.5, 0, 3.7, -0.2, 0.8, -0.75, 0],
    [-0.8, -1.7, 1.0, 0, 0.25, -0.2, 0.9],
    [3.5, -0.2, -3.3, 0, -0.7, 0.8, 0],
    [1.0, 0, -0.8, -1.7, -0.2, 0.25, 0.9],
  ];
  function jackFace(c, fx, cy, hurt) {
    const gg = glowGrad(c, fx - 0.4, cy + 1.2, 9.5);
    if (!hurt) {
      carve(c, (k) => { k.moveTo(fx - 3.9, cy - 5.9); k.lineTo(fx - 7.0, cy + 0.1); k.lineTo(fx - 0.9, cy + 0.2); k.closePath(); }, gg);
      carve(c, (k) => { k.moveTo(fx + 3.5, cy - 5.6); k.lineTo(fx + 0.9, cy + 0.1); k.lineTo(fx + 6.1, cy + 0.1); k.closePath(); }, gg);
      carve(c, (k) => {
        k.moveTo(fx - 7.3, cy + 2.4);
        k.quadraticCurveTo(fx - 0.5, cy + 11.8, fx + 6.5, cy + 2.0);
        k.lineTo(fx + 4.4, cy + 4.3); k.lineTo(fx + 2.9, cy + 2.9); k.lineTo(fx + 1.3, cy + 4.8);
        k.lineTo(fx - 0.5, cy + 3.3); k.lineTo(fx - 2.4, cy + 5.0); k.lineTo(fx - 4.0, cy + 3.4); k.lineTo(fx - 5.6, cy + 4.5);
        k.closePath();
      }, gg);
    } else {
      carve(c, (k) => { k.ellipse(fx - 3.8, cy - 2.4, 2.8, 0.9, 0.3, 0, TAU); }, gg);
      carve(c, (k) => { k.ellipse(fx + 3.4, cy - 2.4, 2.6, 0.9, -0.3, 0, TAU); }, gg);
      carve(c, (k) => { k.ellipse(fx - 0.3, cy + 4.6, 2.4, 2.9, 0, 0, TAU); }, gg);
    }
  }
  function jackDraw(c, fr, hurt) {
    const F = JACK_FR[fr], by = -F[6];
    const hx0 = 0.4, hy0 = -19.6 + by, hrx = 10.2, hry = 8.4;
    // scarf tail (behind)
    const fl = [0.22, 0.42, 0.55, 0.38, 0.58][fr];
    const ax = -2.6, ay = -11.6 + by;
    const tx1 = ax - Math.sin(fl) * 3.8, ty1 = ay + Math.cos(fl) * 3.8;
    const tx2 = tx1 - Math.sin(fl + 0.3) * 3.4, ty2 = ty1 + Math.cos(fl + 0.3) * 3.4;
    cCap(c, ax, ay, tx1, ty1, 1.5, JC.scarf, { cast: 0, spec: 0.2 });
    cCap(c, tx1, ty1, tx2, ty2, 1.45, JC.scarf, {
      spec: 0.2,
      detail(k) { k.fillStyle = rgbS(JC.scarf2); k.beginPath(); k.ellipse((tx1 + tx2) / 2, (ty1 + ty2) / 2, 2, 0.6, Math.atan2(ty2 - ty1, tx2 - tx1) + PI / 2, 0, TAU); k.fill(); },
    });
    const arm = (sx, a) => {
      const hxp = sx + Math.sin(a) * 3.7, hyp = -10.0 + by + Math.cos(a) * 3.7;
      cCap(c, sx, -10.0 + by, hxp, hyp, 1.25, JC.body, { spec: 0.2 });
      cE(c, hxp, hyp + 0.2, 1.5, 1.45, JC.hand, { spec: 0.35 });
    };
    const leg = (hp, fx, fy) => {
      cCap(c, hp, -5.2 + by, fx, fy - 1.3, 1.4, JC.pants, { spec: 0.15 });
      cE(c, fx + 0.8, fy - 1.05, 2.3, 1.4, JC.shoe, { spec: 0.35 });
    };
    arm(-2.9, F[4]);
    leg(-1.5, F[0], F[1]);
    leg(1.5, F[2], F[3]);
    cLump(c, 0, -8.0 + by, 4.7, 4.4, JC.body, 0.08, {
      spec: 0.25,
      detail(k) {
        groove(k, (q) => { q.moveTo(-2.6, -9.6 + by); q.quadraticCurveTo(-1.6, -6.4 + by, -2.8, -4.2 + by); }, 0.4, 0.28);
        groove(k, (q) => { q.moveTo(0.4, -6.0 + by); q.quadraticCurveTo(1.6, -5.2 + by, 2.9, -6.0 + by); }, 0.45, 0.3);
      },
    });
    cE(c, 2.2, -8.3 + by, 0.75, 0.75, [244, 210, 92], { spec: 0.5, fp: 0 });
    arm(2.9, F[5]);
    cLump(c, 0.3, -11.4 + by, 6.0, 2.3, JC.scarf, 0.06, {
      spec: 0.3,
      detail(k) { for (const sx of [-3.6, -1.2, 1.2, 3.6]) groove(k, (q) => { q.moveTo(sx + 0.3, -13.4 + by); q.lineTo(sx - 0.2, -9.4 + by); }, 0.45, 0.25); },
    });
    cCap(c, 0.2, -27.4 + by, 1.4, -31.3 + by, 1.35, JC.stem, {
      spec: 0.25, cast: 0.3,
      detail(k) { groove(k, (q) => { q.moveTo(0.4, -28 + by); q.lineTo(1.2, -31 + by); }, 0.35, 0.3); },
    });
    clay(c, (k) => pumpkinPath(k, hx0, hy0, hrx, hry), JC.pump, {
      b: [hx0, hy0, hrx, hry], spec: 0.55, gloss: 0.7, lit: 0.24, ao: 0.55, hi: [hx0 - 5.0, hy0 - 4.6, 4.4],
      detail(k) {
        for (const kk of [-0.66, -0.28, 0.28, 0.66]) {
          groove(k, (q) => { q.moveTo(hx0 + kk * hrx * 0.25, hy0 - hry * 0.88); q.quadraticCurveTo(hx0 + kk * hrx * 1.15, hy0, hx0 + kk * hrx * 0.25, hy0 + hry * 0.92); }, 0.75, 0.3);
        }
        jackFace(k, hx0 + 2.4, hy0, hurt);
      },
    });
    clay(c, (k) => leafPath(k, -0.4, -28.6 + by, -1.25, 5.6, 2.1), JC.leaf, {
      b: [-2.9, -29.4 + by, 2.9, 2.2], spec: 0.3, cast: 0.3,
      detail(k) { groove(k, (q) => { q.moveTo(-0.6, -28.6 + by); q.lineTo(-4.6, -29.8 + by); }, 0.3, 0.3); },
    });
    c.strokeStyle = rgbS(darken(JC.leaf, 0.15)); c.lineWidth = 0.7; c.lineCap = 'round';
    c.beginPath(); c.arc(3.4, -29.6 + by, 1.3, PI * 0.9, PI * 2.6); c.stroke();
  }

  const CREEP = [
    { top: [134, 80, 172], bot: [244, 232, 204] },
    { top: [178, 76, 142], bot: [246, 226, 206] },
    { top: [104, 92, 190], bot: [238, 232, 198] },
  ];
  const ROOT = [228, 202, 160], LEAF = [96, 162, 70], BROW = [74, 40, 82];
  function creeperDraw(c, fr, v) {
    const col = CREEP[v];
    const st = [0, 1, 0, -1][fr], sw = [0, 0.09, 0, -0.09][fr];
    const leaf = (a, len, wid) => {
      const bx = 0.3, by = -19.6, mx = bx + Math.sin(a + sw) * len * 0.5, my = by - Math.cos(a + sw) * len * 0.5;
      clay(c, (k) => leafPath(k, bx, by, a + sw, len, wid), LEAF, {
        b: [mx, my, len * 0.5, len * 0.5], spec: 0.25, cast: 0.3,
        detail(k) { groove(k, (q) => { q.moveTo(bx, by); q.lineTo(bx + Math.sin(a + sw) * len * 0.8, by - Math.cos(a + sw) * len * 0.8); }, 0.4, 0.3); },
      });
    };
    leaf(-0.85, 8.0, 2.5); leaf(0.8, 7.8, 2.5); leaf(-0.02, 10.0, 2.9);
    const lift = (s) => Math.max(0, s) * 1.6;
    cCap(c, -3.0, -4.8, -3.3 + st * 0.9, -1.2 - lift(st), 1.5, ROOT, { spec: 0.2 });
    cCap(c, 3.0, -4.8, 3.3 - st * 0.9, -1.2 - lift(-st), 1.5, ROOT, { spec: 0.2 });
    const body = (k) => turnipPath(k, 0, -21.6, -2.6, 10.4);
    clay(c, body, col.bot, {
      b: [0, -12, 10.4, 9.6], spec: 0.35, lit: 0.12,
      detail(k) {
        // smeared purple top layer
        const wav = (q) => {
          q.moveTo(-14, -30); q.lineTo(14, -30); q.lineTo(14, -10.6);
          for (let x = 14; x >= -14; x -= 1) q.lineTo(x, -10.8 + Math.sin(x * 0.85 + 0.6 + v) * 0.9 + (x < 0 ? 0.4 : 0));
          q.closePath();
        };
        clay(k, wav, col.top, { b: [0, -17.5, 10.4, 6.5], cast: 0.35, spec: 0.38, ao: 0.4 });
        groove(k, (q) => { q.moveTo(-5.2, -5.6); q.quadraticCurveTo(-3.4, -4.0, -1.6, -4.6); }, 0.35, 0.22);
      },
    });
    const j = [0, 0.2, 0, -0.15][fr];
    eye(c, 1.0, -13.4, 2.5, 2.8, 1.8 + j, -12.9, 1.25);
    eye(c, 6.4, -13.2, 2.3, 2.7, 7.1 + j, -12.7, 1.2);
    cCap(c, -1.7, -17.5, 3.0, -15.8, 0.75, BROW, { spec: 0.3, cast: 0.5 });
    cCap(c, 4.6, -15.7, 8.9, -17.3, 0.72, BROW, { spec: 0.3, cast: 0.5 });
    groove(c, (q) => { q.arc(4.0, -6.0, 2.2, PI * 1.18, PI * 1.82); }, 0.7, 0.55);
  }

  const GHOST = [234, 240, 252], GHOST_D = [150, 164, 206];
  function ghostPath(c, ph) {
    c.moveTo(-7.8, -7.4);
    c.bezierCurveTo(-8.8, -15.5, -6.4, -24.4, 0.6, -24.4);
    c.bezierCurveTo(7.8, -24.4, 9.3, -15.6, 8.3, -5.0);
    const xs = [8.3, 4.6, 0.8, -3.0];
    for (let i = 0; i < 3; i++) {
      const x0 = xs[i], x1 = xs[i + 1];
      const yEnd = -4.6 + Math.sin(ph + i * 1.9) * 0.6, yLow = -0.4 + Math.sin(ph + i * 1.9 + 1.2) * 1.0;
      c.quadraticCurveTo((x0 + x1) / 2, yLow, x1, yEnd);
    }
    const tw = Math.sin(ph + 2.4);
    c.quadraticCurveTo(-6.0, 0.4 + tw * 0.6, -11.6 + tw * 0.8, -2.6 + tw * 0.9);
    c.quadraticCurveTo(-9.4, -4.6, -7.8, -7.4);
    c.closePath();
  }
  function ghostDraw(c, fr) {
    const ph = (fr / 4) * TAU;
    cE(c, -7.6, -12.6 + Math.sin(ph) * 0.6, 2.3, 1.7, GHOST, { dark: GHOST_D, cast: 0, spec: 0.4 });
    clay(c, (k) => ghostPath(k, ph), GHOST, {
      b: [0, -13, 9, 11.5], dark: GHOST_D, spec: 0.55, gloss: 0.5, lit: 0.3, ao: 0.42, rim: 0.3,
      detail(k) {
        // sad sockets
        k.fillStyle = '#3a3c62';
        k.beginPath(); k.ellipse(1.6, -16.4, 1.7, 2.4, 0.35, 0, TAU); k.fill();
        k.beginPath(); k.ellipse(6.0, -16.2, 1.6, 2.3, -0.35, 0, TAU); k.fill();
        k.fillStyle = 'rgba(255,255,255,0.9)';
        k.beginPath(); k.arc(1.3, -17.4, 0.5, 0, TAU); k.arc(5.7, -17.2, 0.48, 0, TAU); k.fill();
        groove(k, (q) => { q.moveTo(-0.6, -19.6); q.lineTo(2.4, -20.4); }, 0.5, 0.35);
        groove(k, (q) => { q.moveTo(5.0, -20.4); q.lineTo(7.8, -19.4); }, 0.5, 0.35);
        // hungry, sad mouth
        const m = 0.35 * Math.sin(ph * 2);
        k.fillStyle = '#34345a';
        k.beginPath(); k.ellipse(3.9, -10.0, 1.7, 2.3 + m, 0, 0, TAU); k.fill();
        k.fillStyle = 'rgba(255,255,255,0.35)';
        k.beginPath(); k.ellipse(3.9, -8.4 + m, 1.1, 0.5, 0, 0, TAU); k.fill();
      },
    });
    cE(c, 8.8, -12.6 + Math.sin(ph + 1.3) * 0.7, 2.6, 1.8, GHOST, { dark: GHOST_D, spec: 0.4, cast: 0.3 });
  }

  const COLO = { body: [126, 90, 104], lump: [108, 74, 92], lump2: [148, 108, 118], root: [160, 118, 96], leaf: [70, 120, 74] };
  function colossusDraw(c, fr) {
    const st = [0, 1, 0, -1][fr], sw = st * 0.2, by = [0, -1.2, 0, -1.2][fr];
    for (const a of [-0.95, -0.4, 0.3, 0.85]) {
      const len = 12, bx = 1, byy = -49 + by;
      clay(c, (k) => leafPath(k, bx, byy, a, len, 3.4), COLO.leaf, {
        b: [bx + Math.sin(a) * 6, byy - Math.cos(a) * 6, 6, 6], spec: 0.2, cast: a === -0.95 ? 0 : 0.3,
        detail(k) { groove(k, (q) => { q.moveTo(bx, byy); q.lineTo(bx + Math.sin(a) * len * 0.8, byy - Math.cos(a) * len * 0.8); }, 0.55, 0.3); },
      });
    }
    const arm = (sx, dir, s2) => {
      const hxp = sx + dir * 5 + s2 * 7, hyp = -15 + by;
      cCap(c, sx, -36 + by, hxp, hyp, 4.4, COLO.lump, { spec: 0.2 });
      for (const f of [-1, 0, 1]) cCap(c, hxp + f * 2.2, hyp + 2.6, hxp + f * 3.2, hyp + 6.2, 1.2, COLO.root, { spec: 0.2 });
    };
    arm(-14, -1, sw);
    const lift = (s) => Math.max(0, s) * 2.2;
    cCap(c, -8, -12 + by, -8.5 + st * 2, -2.4 - lift(st), 4.6, COLO.lump, { spec: 0.15 });
    cLump(c, -8 + st * 2, -1.8 - lift(st), 5.4, 2.6, COLO.lump, 0.15, { spec: 0.2 });
    cCap(c, 8, -12 + by, 8.5 - st * 2, -2.4 - lift(-st), 4.6, COLO.lump, { spec: 0.15 });
    cLump(c, 9 - st * 2, -1.8 - lift(-st), 5.4, 2.6, COLO.lump, 0.15, { spec: 0.2 });
    const pts = lumpPts(0, -30 + by, 17.5, 21, 14, 0.12, PR).map((q) => [q[0] * (0.86 + 0.14 * U.clamp((q[1] - (-50 + by)) / 20, 0, 1)), q[1]]);
    clay(c, (k) => blobPath(k, pts), COLO.body, {
      b: [0, -30 + by, 18.5, 21], spec: 0.25, ao: 0.55,
      detail(k) {
        const cracks = [
          [[-12, -22], [-9, -19], [-10, -15], [-6, -12]],
          [[13, -30], [10, -27], [11.5, -23], [8, -21]],
          [[-4, -48], [-3, -45], [-5.5, -43]],
          [[-14, -34], [-11, -33], [-12, -30]],
        ];
        for (const cr of cracks) {
          const path = (q) => { q.moveTo(cr[0][0], cr[0][1] + by); for (let i = 1; i < cr.length; i++) q.lineTo(cr[i][0], cr[i][1] + by); };
          k.lineCap = 'round'; k.lineJoin = 'round';
          k.strokeStyle = '#2c1218'; k.lineWidth = 1.5; k.beginPath(); path(k); k.stroke();
          k.strokeStyle = '#ff9a3a'; k.lineWidth = 0.65; k.beginPath(); path(k); k.stroke();
          k.strokeStyle = '#ffe9a6'; k.lineWidth = 0.25; k.beginPath(); path(k); k.stroke();
        }
        // glowing core
        const cxx = 2.5, cyy = -21 + by;
        k.save();
        k.beginPath(); k.ellipse(cxx, cyy, 5.2, 5.6, 0, 0, TAU); k.fillStyle = '#3a1410'; k.fill(); k.clip();
        k.beginPath(); k.ellipse(cxx + 0.3, cyy + 0.9, 4.6, 5.0, 0, 0, TAU); k.fillStyle = glowGrad(k, cxx, cyy + 1, 5.4); k.fill();
        k.restore();
        groove(k, (q) => { q.ellipse(cxx, cyy, 5.6, 6.0, 0, PI * 1.1, PI * 1.9); }, 0.8, 0.35);
        // eyes in deep sockets
        k.fillStyle = '#2a1216';
        k.beginPath(); k.ellipse(-3.8, -38.6 + by, 3.2, 2.5, 0.15, 0, TAU); k.ellipse(6.4, -38.4 + by, 3.0, 2.4, -0.15, 0, TAU); k.fill();
        k.fillStyle = '#ffc94a';
        k.beginPath(); k.ellipse(-3.2, -38.3 + by, 1.6, 1.3, 0, 0, TAU); k.ellipse(6.9, -38.1 + by, 1.5, 1.2, 0, 0, TAU); k.fill();
        k.fillStyle = '#fff6cc';
        k.beginPath(); k.arc(-3.0, -38.4 + by, 0.6, 0, TAU); k.arc(7.1, -38.2 + by, 0.55, 0, TAU); k.fill();
        // jagged mouth
        const mp = (q) => { q.moveTo(-5, -31.5 + by); q.lineTo(-3, -30.2 + by); q.lineTo(-1, -31.6 + by); q.lineTo(1, -30.2 + by); q.lineTo(3, -31.6 + by); q.lineTo(5, -30.2 + by); q.lineTo(7, -31.4 + by); };
        k.strokeStyle = '#2c1218'; k.lineWidth = 1.5; k.beginPath(); mp(k); k.stroke();
        k.strokeStyle = '#ff9a3a'; k.lineWidth = 0.5; k.beginPath(); mp(k); k.stroke();
      },
    });
    cLump(c, -13, -39 + by, 4.6, 4.2, COLO.lump2, 0.2, { spec: 0.25 });
    cLump(c, 14, -38 + by, 4.8, 4.4, COLO.lump2, 0.2, { spec: 0.25 });
    cLump(c, -13.5, -23 + by, 4.2, 3.6, COLO.lump, 0.2, { spec: 0.2 });
    cLump(c, 12, -15.5 + by, 4.6, 3.6, COLO.lump, 0.2, { spec: 0.2 });
    cCap(c, -7.2, -41.2 + by, -1.2, -42.6 + by, 1.5, COLO.lump2, { spec: 0.3, cast: 0.55 });
    cCap(c, 3.6, -42.4 + by, 9.6, -41.0 + by, 1.45, COLO.lump2, { spec: 0.3, cast: 0.55 });
    arm(14.5, 1, -sw);
  }

  /* ---------------------------------------------------------- small sprites */
  function lanternDraw(c) {
    c.strokeStyle = 'rgb(122,84,54)'; c.lineWidth = 0.7;
    c.beginPath(); c.moveTo(-3, -13.5); c.quadraticCurveTo(0, -21, 3, -13.5); c.stroke();
    clay(c, (k) => leafPath(k, 0, -14.5, -0.6, 5, 1.8), LEAF, { b: [-1.5, -16.5, 2.5, 2.5], cast: 0, spec: 0.2 });
    clay(c, (k) => leafPath(k, 0, -14.5, 0.55, 4.6, 1.7), LEAF, { b: [1.3, -16.4, 2.4, 2.4], spec: 0.2 });
    clay(c, (k) => turnipPath(k, 0, -15, -0.6, 6.8), CREEP[0].bot, {
      b: [0, -7.5, 6.8, 7.4], spec: 0.4,
      detail(k) {
        clay(k, (q) => { q.moveTo(-9, -18); q.lineTo(9, -18); q.lineTo(9, -9.5); for (let x = 9; x >= -9; x -= 1) q.lineTo(x, -9.6 + Math.sin(x * 0.9) * 0.7); q.closePath(); }, CREEP[0].top, { b: [0, -12, 7, 4.5], spec: 0.35, ao: 0.4 });
        const gg = glowGrad(k, 0, -6, 6);
        carve(k, (q) => { q.moveTo(-2.6, -9.6); q.lineTo(-4.4, -6.4); q.lineTo(-0.8, -6.4); q.closePath(); }, gg);
        carve(k, (q) => { q.moveTo(2.6, -9.6); q.lineTo(0.8, -6.4); q.lineTo(4.4, -6.4); q.closePath(); }, gg);
        carve(k, (q) => { q.moveTo(-4, -4.6); q.quadraticCurveTo(0, -0.6, 4, -4.6); q.lineTo(2, -3.6); q.lineTo(0, -4.4); q.lineTo(-2, -3.6); q.closePath(); }, gg);
      },
    });
  }
  function gemDraw(c, big) {
    const s = big ? 1.45 : 1;
    const col = big ? [255, 124, 52] : [255, 202, 64];
    clay(c, (k) => seedPathV(k, s), col, {
      b: [0, 0, 1.7 * s, 2 * s], cast: 0, spec: 0.7, gloss: 0.85, lit: 0.35, ao: 0.35, fp: 0.5,
      dark: big ? [176, 50, 24] : [196, 120, 30],
    });
  }
  function seedDraw(c) {
    clay(c, seedPathH, [248, 232, 190], {
      b: [0.4, 0, 3.8, 2.8], cast: 0, spec: 0.55, gloss: 0.6, ao: 0.4, dark: [178, 146, 96],
      detail(k) { groove(k, (q) => { q.moveTo(3.4, 0); q.bezierCurveTo(2, -1.8, -2.4, -1.9, -2.5, 0); }, 0.35, 0.25); },
    });
  }
  const CRUMB = [
    CREEP[0].top, CREEP[1].top, CREEP[2].top, CREEP[0].bot, LEAF, GHOST, COLO.body, COLO.lump2,
    [255, 168, 60], JC.pump, [150, 104, 70], [255, 206, 70], JC.scarf, [120, 180, 220],
  ];
  const CI = { purple0: 0, purple1: 1, purple2: 2, cream: 3, leaf: 4, ghost: 5, colo: 6, colo2: 7, ember: 8, pump: 9, soil: 10, gold: 11, green: 12, blue: 13 };

  /* ================================================================== props */
  const TREE = [[96, 158, 74], [124, 172, 70], [228, 146, 58], [82, 140, 104]];
  const TRUNK = [134, 94, 64];
  function treeDraw(c, v) {
    const col = TREE[v];
    cE(c, -4.2, -1.4, 3.2, 1.7, TRUNK, { cast: 0, spec: 0.15 });
    cE(c, 4.0, -1.3, 3.0, 1.6, TRUNK, { cast: 0, spec: 0.15 });
    cCap(c, 0, -1.5, 0.6, -30, 3.4, TRUNK, {
      spec: 0.15,
      detail(k) {
        for (const x of [-1.6, 0.2, 1.8]) groove(k, (q) => { q.moveTo(x, -3); q.quadraticCurveTo(x + 0.8, -14, x + 0.2, -26); }, 0.55, 0.28);
      },
    });
    cCap(c, 1.2, -21, 7, -28, 1.4, TRUNK, { spec: 0.15 });
    const balls = [[0, -51, 11], [-10.5, -42, 9], [10.5, -43, 9.5], [-4.5, -36.5, 8.5], [6, -35.5, 8]];
    balls.forEach((bb, i) => {
      const cc = i % 2 ? lighten(col, 0.06) : darken(col, 0.05);
      cLump(c, bb[0], bb[1], bb[2], bb[2] * 0.92, cc, 0.1, { spec: 0.28, cast: i ? 0.42 : 0.3 });
    });
    if (v === 0) for (const p of [[-8, -40], [7, -47], [3, -33], [-3, -52]]) cE(c, p[0], p[1], 1.25, 1.2, [216, 62, 48], { spec: 0.6, gloss: 0.5, cast: 0.4, fp: 0 });
    if (v === 3) for (const p of [[-9, -44], [8, -40], [1, -55], [-2, -37], [11, -46]]) cE(c, p[0], p[1], 0.9, 0.85, [252, 246, 236], { spec: 0.4, cast: 0.4, fp: 0 });
  }
  function bushDraw(c, v) {
    const col = v ? [116, 156, 64] : [88, 150, 80];
    cLump(c, -6, -8, 7, 6.4, darken(col, 0.06), 0.12, { cast: 0, spec: 0.25 });
    cLump(c, 6, -8.5, 7.4, 6.6, col, 0.12, { spec: 0.25 });
    cLump(c, 0, -12, 7.6, 7, lighten(col, 0.05), 0.12, { spec: 0.28 });
    cLump(c, -1, -5, 8, 4.6, col, 0.1, { spec: 0.22 });
    const berry = v ? [244, 196, 64] : [214, 66, 92];
    for (const p of [[-5, -11], [4, -14], [7, -7], [-2, -6], [1, -17]]) cE(c, p[0], p[1], 1.1, 1.05, berry, { spec: 0.6, gloss: 0.5, cast: 0.4, fp: 0 });
  }
  function mushOne(c, x, s, capCol) {
    cCap(c, x, -0.6, x + 0.3 * s, -7.5 * s, 2.0 * s, [242, 228, 202], { spec: 0.25 });
    const dome = (k) => { k.moveTo(x - 7.2 * s, -7.4 * s); k.bezierCurveTo(x - 7.2 * s, -15.6 * s, x + 7.2 * s, -15.6 * s, x + 7.2 * s, -7.4 * s); k.quadraticCurveTo(x, -5.4 * s, x - 7.2 * s, -7.4 * s); k.closePath(); };
    clay(c, dome, capCol, { b: [x, -10.5 * s, 7.2 * s, 4.6 * s], spec: 0.45, gloss: 0.4, cast: 0.45 });
    for (const p of [[-3.6, -10], [1.2, -12.4], [4, -9.4], [-0.8, -8.6]]) cE(c, x + p[0] * s, p[1] * s, 1.05 * s, 0.85 * s, [252, 246, 236], { spec: 0.35, cast: 0.35, fp: 0 });
  }
  function mushDraw(c, v) {
    if (v === 0) mushOne(c, 0, 1, [208, 66, 50]);
    else { mushOne(c, -4, 0.8, [128, 98, 186]); mushOne(c, 4.5, 0.62, [128, 98, 186]); }
  }
  const WOOD = [158, 110, 66], WOOD2 = [176, 126, 76];
  function fenceDraw(c, v) {
    cCap(c, -12, 0, -12.3, -15, 1.75, WOOD, { cast: 0, spec: 0.2 });
    if (v === 0) cCap(c, 12, 0, 12.2, -14.5, 1.75, WOOD, { cast: 0, spec: 0.2 });
    else cCap(c, 12, 0, 14.5, -12.5, 1.75, WOOD, { cast: 0, spec: 0.2 });
    const rail = (y1, y2) => cCap(c, -16, y1, 16, y2, 1.3, WOOD2, {
      spec: 0.25,
      detail(k) { groove(k, (q) => { q.moveTo(-13, (y1 + y2) / 2 - 0.2); q.lineTo(-4, (y1 + y2) / 2 - 0.4); q.moveTo(2, (y1 + y2) / 2); q.lineTo(12, (y1 + y2) / 2 - 0.2); }, 0.35, 0.25); },
    });
    rail(-11.2, v ? -9.4 : -10.4);
    rail(-5.6, -6);
  }
  function pumpDraw(c, v) {
    const one = (x, y, rx, ry, col) => {
      clay(c, (k) => pumpkinPath(k, x, y, rx, ry), col, {
        b: [x, y, rx, ry], spec: 0.45, gloss: 0.4, cast: 0.4,
        detail(k) { for (const kk of [-0.66, -0.25, 0.25, 0.66]) groove(k, (q) => { q.moveTo(x + kk * rx * 0.25, y - ry * 0.86); q.quadraticCurveTo(x + kk * rx * 1.15, y, x + kk * rx * 0.25, y + ry * 0.9); }, 0.7 * rx / 9, 0.3); },
      });
      cCap(c, x, y - ry * 0.85, x + rx * 0.12, y - ry * 1.3, rx * 0.13, [110, 112, 50], { spec: 0.2, cast: 0.3 });
    };
    if (v === 0) {
      clay(c, (k) => leafPath(k, -2, -13, -1.5, 8, 3), LEAF, { b: [-6, -13.5, 4, 3], cast: 0, spec: 0.2 });
      one(0, -7.4, 9, 7.2, [228, 124, 42]);
    } else {
      one(-4.5, -8.4, 8.6, 7.4, [222, 118, 40]);
      one(7, -4.6, 5.4, 4.4, [236, 170, 62]);
    }
  }
  function graveDraw(c, v) {
    cLump(c, 0, -0.8, 9.5, 2.8, [128, 92, 66], 0.1, { cast: 0, spec: 0.15 });
    const w = v ? 5.6 : 7, h = v ? 17 : 13;
    const slab = (k) => { k.moveTo(-w, -0.5); k.lineTo(-w, -h); k.arc(0, -h, w, PI, 0); k.lineTo(w, -0.5); k.quadraticCurveTo(0, 0.6, -w, -0.5); k.closePath(); };
    clay(c, slab, [154, 150, 164], {
      b: [0, -(h + w) / 2, w, (h + w) / 2], spec: 0.25, cast: 0.4,
      detail(k) {
        if (v === 0) groove(k, (q) => { q.moveTo(0, -16); q.lineTo(0, -6); q.moveTo(-3, -12.6); q.lineTo(3, -12.6); }, 1.1, 0.42);
        else {
          groove(k, (q) => { q.moveTo(0, -19); q.lineTo(0, -12); q.moveTo(-2.4, -16.6); q.lineTo(2.4, -16.6); }, 0.9, 0.42);
          groove(k, (q) => { q.moveTo(-3.2, -8.6); q.lineTo(3.2, -8.6); q.moveTo(-2.4, -6); q.lineTo(2.4, -6); }, 0.5, 0.3);
        }
        groove(k, (q) => { q.moveTo(w - 1, -h - 1); q.lineTo(w - 2.6, -h + 2); q.lineTo(w - 1.6, -h + 4); }, 0.45, 0.35);
      },
    });
    cLump(c, -w + 1.2, -2, 2.4, 1.6, [96, 150, 74], 0.25, { spec: 0.2 });
    cLump(c, w - 0.6, -1.6, 1.6, 1.2, [110, 160, 80], 0.25, { spec: 0.2 });
  }
  function hayDraw(c) {
    const dome = (k) => { k.moveTo(-15, 0); k.bezierCurveTo(-16, -16, -8, -24, 0, -24); k.bezierCurveTo(8, -24, 16, -16, 15, 0); k.quadraticCurveTo(0, 2, -15, 0); k.closePath(); };
    clay(c, dome, [226, 186, 84], {
      b: [0, -12, 15, 12], cast: 0, spec: 0.25, ao: 0.5,
      detail(k) {
        const r = U.rng(99);
        k.lineCap = 'round';
        for (let i = 0; i < 90; i++) {
          const yy = -2 - r.next() * 20, half = Math.sqrt(Math.max(0, 1 - Math.pow((yy + 12) / 13, 2))) * 14;
          const xx = (r.next() * 2 - 1) * half;
          const a = (r.next() - 0.5) * 0.9 + (xx / 15) * 0.6, l = 2.5 + r.next() * 3;
          const dx = Math.cos(a) * l, dy = Math.sin(a) * l;
          k.strokeStyle = 'rgba(160,112,40,0.55)'; k.lineWidth = 0.9;
          k.beginPath(); k.moveTo(xx - dx, yy - dy + 0.35); k.quadraticCurveTo(xx, yy + 0.8, xx + dx, yy + dy + 0.35); k.stroke();
          k.strokeStyle = 'rgba(255,238,170,0.6)'; k.lineWidth = 0.5;
          k.beginPath(); k.moveTo(xx - dx, yy - dy - 0.2); k.quadraticCurveTo(xx, yy + 0.25, xx + dx, yy + dy - 0.2); k.stroke();
        }
      },
    });
    for (const p of [[-13, -0.5, -0.4], [12, -0.8, 0.5], [3, 0.6, 0.1]]) cCap(c, p[0] - 2, p[1], p[0] + 2, p[1] + p[2], 0.6, [236, 200, 100], { spec: 0.3, cast: 0.3, fp: 0 });
  }
  function rockDraw(c, v) {
    if (v === 0) {
      cLump(c, -2, -4.6, 7, 5, [148, 144, 152], 0.18, { cast: 0, spec: 0.3 });
      cLump(c, 5.5, -2.4, 3.8, 2.8, [126, 122, 134], 0.2, { spec: 0.3 });
    } else {
      cLump(c, 0, -3.6, 5.4, 3.8, [138, 128, 120], 0.2, { cast: 0, spec: 0.3 });
      cLump(c, -6, -1.8, 2.6, 2, [160, 154, 160], 0.2, { spec: 0.3 });
    }
  }
  const PROP_DEF = {
    tree: { n: 4, box: [-24, -64, 24, 3], sh: [17, 5.5], fn: treeDraw },
    bush: { n: 2, box: [-16, -22, 16, 3], sh: [14, 4.5], fn: bushDraw },
    mush: { n: 2, box: [-10, -16, 10, 2], sh: [7, 2.6], fn: mushDraw },
    fence: { n: 2, box: [-18, -18, 18, 3], sh: [17, 3.2], fn: fenceDraw },
    pump: { n: 2, box: [-14, -19, 14, 3], sh: [12, 4], fn: pumpDraw },
    grave: { n: 2, box: [-11, -26, 11, 3], sh: [10, 3.2], fn: graveDraw },
    hay: { n: 1, box: [-17, -26, 17, 3], sh: [16, 5], fn: hayDraw },
    rock: { n: 2, box: [-10, -11, 10, 2], sh: [9, 3], fn: rockDraw },
  };

  /* ================================================================ ground */
  const GSTEP = 4;
  const NF = 6;
  const MEAD_A = [118, 164, 84], MEAD_B = [140, 172, 90];
  const LAY = [
    { c: [152, 108, 74], sunk: false, m: 1.1 },  // brown soil
    { c: [102, 80, 126], sunk: false, m: 1 },    // dark-purple clay
    { c: [126, 186, 210], sunk: true, m: 0.35 }, // light-blue pond (sunken, glossy smooth)
    { c: [214, 162, 98], sunk: false, m: 0.9 },  // ochre paths + clearings
  ];
  const BW = 3.0, SW = 3.4;
  const LX = -0.42, LY = -0.907;
  function fieldsAt(x, y, out) {
    const wx = U.perlin(x / 900, y / 900, 701) * 110, wy = U.perlin(x / 900 + 9.2, y / 900, 702) * 110;
    const X = x + wx, Y = y + wy;
    out[0] = U.fbm(X / 760 + 3.3, Y / 760, 111, 2) - 0.585;
    out[1] = U.fbm(X / 600 + 13.7, Y / 600, 515, 2) - 0.635;
    out[2] = U.fbm(X / 420 - 7.1, Y / 420, 414, 2) - 0.675;
    const qx = U.perlin(x / 480, y / 480, 305) * 60, qy = U.perlin(x / 480 + 5.1, y / 480, 306) * 60;
    const pn = U.perlin((x + qx) / 1500, (y + qy) / 1500, 304);
    const clear = U.fbm(X / 650 + 31.1, Y / 650, 222, 2) - 0.665;
    out[3] = Math.max(clear, (0.019 - Math.abs(pn)) * 2.6);
    out[4] = 1 + (U.noise(x / 1300, y / 1300, 606) - 0.5) * 0.09;
    out[5] = U.smoothstep(0.3, 0.7, U.noise(x / 420, y / 420, 808));
  }
  const FT = new Float32Array(NF);
  function matAt(x, y) {
    fieldsAt(x, y, FT);
    for (let L = 3; L >= 0; L--) if (FT[L] > 0) return L + 1;
    return 0;
  }
  function matSafe(x, y, r) {
    const m = matAt(x, y);
    if (matAt(x + r, y) !== m || matAt(x - r, y) !== m || matAt(x, y + r) !== m || matAt(x, y - r) !== m) return -1;
    return m;
  }
  const pack = (r, g, b) => (255 << 24) | ((b < 0 ? 0 : b > 255 ? 255 : b | 0) << 16) | ((g < 0 ? 0 : g > 255 ? 255 : g | 0) << 8) | (r < 0 ? 0 : r > 255 ? 255 : r | 0);

  // tileable lumpy clay surface (lit height field), 2 texels per world unit
  const MODW = 256, MODS = 2;
  let MOD = null;
  function buildMod() {
    const N = MODW, h = new Float32Array(N * N);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        h[y * N + x] = U.fbmTile(x / 32, y / 32, 8, 31, 3) * 0.72 + U.fbmTile(x / 16, y / 16, 16, 57, 2) * 0.28
          + U.perlin(x / 64, y / 16, 91, 4, 16) * 0.06;
      }
    }
    MOD = new Float32Array(N * N);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const a = h[((y + N - 1) % N) * N + ((x + N - 1) % N)], b = h[((y + 1) % N) * N + ((x + 1) % N)];
        MOD[y * N + x] = (a - b) * 2.4 + (h[y * N + x] - 0.5) * 0.08 + (U.hash2(x, y, 5) - 0.5) * 0.008;
      }
    }
  }

  /* ---------------------------------------------------------------- decals */
  function imprint(c, path, w, a) {
    c.lineWidth = w; c.strokeStyle = 'rgba(52,26,12,' + a + ')';
    c.beginPath(); path(c, 0); c.stroke();
    c.lineWidth = w * 0.6; c.strokeStyle = 'rgba(255,246,222,' + a * 0.95 + ')';
    c.beginPath(); path(c, w * 0.6); c.stroke();
  }
  function bump(c, x, y, rx, ry, col) {
    c.fillStyle = 'rgba(46,26,14,0.26)';
    c.beginPath(); c.ellipse(x + rx * 0.22, y + ry * 0.5, rx * 1.05, ry * 0.92, 0, 0, TAU); c.fill();
    const R = Math.max(rx, ry);
    const g = c.createRadialGradient(x - rx * 0.3, y - ry * 0.45, R * 0.05, x, y, R * 1.1);
    g.addColorStop(0, rgbS(lighten(col, 0.25))); g.addColorStop(0.5, rgbS(col)); g.addColorStop(1, rgbS(darken(col, 0.3)));
    c.fillStyle = g;
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,250,0.42)';
    c.beginPath(); c.ellipse(x - rx * 0.32, y - ry * 0.42, rx * 0.3, ry * 0.2, -0.3, 0, TAU); c.fill();
  }
  function sausage(c, path, w, col) {
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.save(); c.translate(0.3, 0.55);
    c.strokeStyle = 'rgba(46,26,14,0.26)'; c.lineWidth = w * 1.1; c.beginPath(); path(c); c.stroke();
    c.restore();
    c.strokeStyle = rgbS(darken(col, 0.2)); c.lineWidth = w; c.beginPath(); path(c); c.stroke();
    c.save(); c.translate(-0.08, -w * 0.12);
    c.strokeStyle = rgbS(col); c.lineWidth = w * 0.72; c.beginPath(); path(c); c.stroke();
    c.translate(-0.05, -w * 0.18);
    c.strokeStyle = rgbS(lighten(col, 0.35), 0.8); c.lineWidth = w * 0.25; c.beginPath(); path(c); c.stroke();
    c.restore();
  }
  function flower(c, x, y, s, petal, rng) {
    c.fillStyle = 'rgba(46,26,14,0.22)';
    c.beginPath(); c.ellipse(x + 0.4, y + 0.8, 2.3 * s, 1.6 * s, 0, 0, TAU); c.fill();
    const pc = rgbS(petal), ph = rng() * TAU;
    for (let i = 0; i < 5; i++) {
      const a = ph + (i / 5) * TAU, px = x + Math.cos(a) * 1.25 * s, py = y + Math.sin(a) * 1.05 * s;
      c.fillStyle = rgbS(darken(petal, 0.18)); c.beginPath(); c.arc(px, py + 0.2, 0.95 * s, 0, TAU); c.fill();
      c.fillStyle = pc; c.beginPath(); c.arc(px - 0.08, py - 0.06, 0.82 * s, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.arc(px - 0.3 * s, py - 0.3 * s, 0.26 * s, 0, TAU); c.fill();
    }
    bump(c, x, y, 0.85 * s, 0.8 * s, [246, 190, 60]);
  }
  const FLOWER_COL = [[250, 246, 236], [246, 160, 182], [252, 214, 90], [176, 150, 226]];
  const PEB_SOIL = [[178, 132, 96], [126, 88, 62], [160, 150, 140], [196, 160, 120]];
  const PEB_PURP = [[146, 118, 168], [84, 62, 104], [186, 160, 196]];
  const PEB_PATH = [[236, 190, 120], [190, 128, 70], [170, 162, 150]];

  function* decals(c, info) {
    const pts = [];
    G.scatter(info, 10, 9101, 9, (x, y, rng) => { pts.push(x, y, rng.next(), rng.next(), rng.next(), rng.next()); });
    c.lineCap = 'round'; c.lineJoin = 'round';
    let n = 0;
    for (let i = 0; i < pts.length; i += 6) {
      const x = pts[i], y = pts[i + 1], r0 = pts[i + 2], r1 = pts[i + 3], r2 = pts[i + 4], r3 = pts[i + 5];
      if (r0 > 0.3) continue;
      if ((++n & 15) === 15) yield;
      const m = matSafe(x, y, 6);
      if (m < 0) continue;
      const rr = U.mulberry32(((r1 * 1e9) | 0) ^ 0x5bd1e995);
      if (m === 0) {
        if (r0 < 0.15) {
          // modelling-tool grass impressions (fan of pressed strokes)
          const k = 3 + ((r1 * 3) | 0), base = r2 * 0.6 - 0.3, s = 0.9 + r3 * 0.5;
          imprint(c, (q, o) => {
            for (let j = 0; j < k; j++) {
              const a = base + (j - (k - 1) / 2) * 0.32, l = (3 + rr() * 1.6) * s;
              q.moveTo(x + (j - (k - 1) / 2) * 0.7, y + o);
              q.quadraticCurveTo(x + Math.sin(a) * l * 0.4 + (j - (k - 1) / 2) * 0.8, y - l * 0.5 + o, x + Math.sin(a) * l + (j - (k - 1) / 2) * 0.5, y - Math.cos(a) * l + o);
            }
          }, 0.65, 0.16);
        } else if (r0 < 0.2) {
          const col = r1 < 0.5 ? [140, 196, 92] : [108, 168, 74];
          sausage(c, (q) => { q.moveTo(x - 0.8, y); q.quadraticCurveTo(x - 1.2, y - 1.8, x - 2.4, y - 3.0); q.moveTo(x, y); q.quadraticCurveTo(x + 0.2, y - 2.2, x - 0.1, y - 3.8); q.moveTo(x + 0.8, y); q.quadraticCurveTo(x + 1.3, y - 1.6, x + 2.5, y - 2.7); }, 1.0, col);
        } else if (r0 < 0.24) flower(c, x, y, 0.9 + r2 * 0.35, FLOWER_COL[(r1 * 4) | 0], rr);
        else if (r0 < 0.245) {
          bump(c, x, y, 2.6, 2.1, [232, 128, 44]);
          imprint(c, (q, o) => { q.moveTo(x - 0.8, y - 1.7 + o); q.quadraticCurveTo(x - 1.6, y + o, x - 0.8, y + 1.7 + o); q.moveTo(x + 0.8, y - 1.7 + o); q.quadraticCurveTo(x + 1.6, y + o, x + 0.8, y + 1.7 + o); }, 0.35, 0.25);
          bump(c, x + 0.2, y - 2.1, 0.5, 0.6, [110, 112, 50]);
        } else if (r0 < 0.26) bump(c, x, y, 1.6 + r2, 1.2 + r2 * 0.7, [150, 146, 150]);
      } else if (m === 1) {
        if (r0 < 0.13) {
          const col = PEB_SOIL[(r1 * 4) | 0];
          bump(c, x, y, 1.3 + r2 * 1.5, 1.0 + r2 * 1.1, col);
          if (r3 < 0.5) bump(c, x + 2.6, y + 1.2, 0.9, 0.7, PEB_SOIL[(r3 * 8) & 3]);
        } else if (r0 < 0.16) {
          const a = r2 * TAU, l = 3.2, ph = r3 * TAU;
          const path = (q) => { for (let j = 0; j <= 8; j++) { const t = j / 8 - 0.5, px = x + Math.cos(a) * t * l * 2 - Math.sin(a) * Math.sin(ph + t * 6) * 0.8, py = y + Math.sin(a) * t * l * 2 * 0.6 + Math.cos(a) * Math.sin(ph + t * 6) * 0.8; if (j) q.lineTo(px, py); else q.moveTo(px, py); } };
          sausage(c, path, 1.5, [226, 140, 150]);
        } else if (r0 < 0.19) {
          const a = (r2 - 0.5) * 1.4, l = 3 + r3 * 2.5;
          sausage(c, (q) => { q.moveTo(x - Math.cos(a) * l, y - Math.sin(a) * l * 0.6); q.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l * 0.6); }, 1.3, [120, 82, 52]);
        } else if (r0 < 0.28) {
          imprint(c, (q, o) => { for (let j = 0; j < 3; j++) { const px = x + (rr() - 0.5) * 7, py = y + (rr() - 0.5) * 4 + o; q.moveTo(px + 0.7, py); q.arc(px, py, 0.7, 0, TAU); } }, 0.45, 0.16);
        }
      } else if (m === 2) {
        if (r0 < 0.08) {
          imprint(c, (q, o) => { for (let j = 0; j <= 26; j++) { const t = j / 26, a = t * 3.2 * PI + r2 * TAU, rad = 0.4 + t * 3.6; const px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad * 0.75 + o; if (j) q.lineTo(px, py); else q.moveTo(px, py); } }, 0.55, 0.16);
        } else if (r0 < 0.13) bump(c, x, y, 1.2 + r2 * 1.3, 0.95 + r2, PEB_PURP[(r1 * 3) | 0]);
        else if (r0 < 0.145) {
          const sc = 0.8 + r2 * 0.4;
          bump(c, x, y, 0.6 * sc, 1.4 * sc, [232, 222, 236]);
          bump(c, x, y - 1.6 * sc, 1.9 * sc, 1.1 * sc, [164, 128, 214]);
        }
      } else if (m === 3) {
        if (r0 < 0.035) {
          const s = 1 + r2 * 0.6;
          c.fillStyle = 'rgba(30,60,80,0.22)'; c.beginPath(); c.ellipse(x + 0.5, y + 0.9, 4.2 * s, 2.8 * s, 0, 0, TAU); c.fill();
          c.fillStyle = 'rgb(88,150,74)'; c.beginPath(); c.ellipse(x, y, 4 * s, 2.6 * s, 0, 0, TAU); c.fill();
          c.fillStyle = 'rgb(112,174,86)'; c.beginPath(); c.ellipse(x - 0.3, y - 0.3, 3.4 * s, 2.0 * s, 0, 0, TAU); c.fill();
          const a = r3 * TAU;
          c.strokeStyle = 'rgb(124,184,210)'; c.lineWidth = 0.8 * s;
          c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 4 * s, y + Math.sin(a) * 2.6 * s); c.stroke();
          c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.ellipse(x - 1.4 * s, y - 0.9 * s, 1.1 * s, 0.4 * s, -0.2, 0, TAU); c.fill();
          if (r1 < 0.4) bump(c, x + 1, y - 0.6, 1.1, 0.9, [246, 180, 200]);
        } else if (r0 < 0.07) {
          imprint(c, (q, o) => { for (const rad of [2.2, 3.8]) { q.moveTo(x + rad, y + o); q.ellipse(x, y + o, rad, rad * 0.5, 0, 0, TAU); } }, 0.4, 0.1);
        }
      } else {
        if (r0 < 0.1) {
          // thumbprint pressed into the path
          const rot = r2 * PI, s = 0.9 + r3 * 0.4;
          imprint(c, (q, o) => {
            for (let j = 1; j <= 5; j++) {
              const rad = j * 0.85 * s, a0 = rr() * TAU;
              q.moveTo(x + Math.cos(a0) * rad, y + o + Math.sin(a0) * rad);
              q.ellipse(x, y + o, rad, rad * 0.78, rot, a0, a0 + PI * (1.3 + rr() * 0.6));
            }
          }, 0.42, 0.15);
        } else if (r0 < 0.14) {
          const a = r2 * TAU, dx = Math.cos(a), dy = Math.sin(a) * 0.7;
          for (let j = 0; j < 2; j++) {
            const side = j ? 1 : -1, px = x + dx * j * 5 - dy * side * 1.6, py = y + dy * j * 5 + dx * side * 1.6;
            c.fillStyle = 'rgba(70,36,12,0.13)';
            c.beginPath(); c.ellipse(px, py, 1.9, 1.1, Math.atan2(dy, dx), 0, TAU); c.fill();
            c.strokeStyle = 'rgba(255,240,210,0.22)'; c.lineWidth = 0.45;
            c.beginPath(); c.ellipse(px, py, 1.7, 0.9, Math.atan2(dy, dx), 0.15 * PI, 0.85 * PI); c.stroke();
          }
        } else if (r0 < 0.17) bump(c, x, y, 1.1 + r2, 0.85 + r2 * 0.7, PEB_PATH[(r1 * 3) | 0]);
      }
    }
    // glossy studio-light reflections on the ponds
    const big = [];
    G.scatter(info, 44, 9202, 22, (x, y, rng) => { big.push(x, y, rng.next(), rng.next()); });
    for (let i = 0; i < big.length; i += 4) {
      const x = big[i], y = big[i + 1];
      if (big[i + 2] > 0.7) continue;
      if (matSafe(x, y, 17) !== 3) continue;
      const w = 9 + big[i + 3] * 7;
      c.save(); c.translate(x, y); c.rotate(-0.18); c.scale(1, 0.32);
      const g = c.createRadialGradient(0, 0, 0, 0, 0, w);
      g.addColorStop(0, 'rgba(255,255,255,0.42)'); g.addColorStop(0.5, 'rgba(240,252,255,0.16)'); g.addColorStop(1, 'rgba(240,252,255,0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, w, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.ellipse(-w * 0.2, -w * 0.05, w * 0.28, w * 0.18, 0, 0, TAU); c.fill();
      c.restore();
      yield;
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
    const k = 1 / K;
    ctx.drawImage(s.c, x - s.ox * k * sx, y - s.oy * k * sy, s.c.width * k * sx, s.c.height * k * sy);
  }
  function blitRot(ctx, V, s, x, y, sx, sy, rot) {
    const S = V.S, co = Math.cos(rot) * S, si = Math.sin(rot) * S;
    ctx.setTransform(co, si, -si, co, V.ox + x * S, V.oy + y * S);
    const k = 1 / K;
    ctx.drawImage(s.c, -s.ox * k * sx, -s.oy * k * sy, s.c.width * k * sx, s.c.height * k * sy);
    ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
  }
  /** Sprite rising out of the ground: only rows above the feet line are drawn. */
  function blitRise(ctx, s, x, y, sx, sy, vis) {
    const k = 1 / K;
    const sink = (1 - vis) * s.oy;
    const srcH = Math.max(1, Math.round(s.oy - sink));
    ctx.drawImage(s.c, 0, 0, s.c.width, srcH, x - s.ox * k * sx, y - srcH * k * sy, s.c.width * k * sx, srcH * k * sy);
  }
  function soft(ctx, s, x, y, rx, ry) { ctx.drawImage(s, x - rx, y - ry, rx * 2, ry * 2); }

  // splats stay on the ground for a moment
  const SPLATS = [];
  function addSplat(game, x, y, ci, s) {
    SPLATS.push({ x, y, ci, s, t0: game.time, life: 1.7 + Math.random() * 0.5, rot: (Math.random() - 0.5) * 0.6, f: Math.random() < 0.5 });
    if (SPLATS.length > 150) SPLATS.shift();
  }

  // damage-number sprites (clay letters)
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
    const font = (ok ? '' : 'bold ') + fs + 'px "Chewy", "Baloo 2", "Arial Rounded MT Bold", sans-serif';
    const meas = U.canvas(4, 4).ctx;
    meas.font = font;
    const txt = String(value);
    const w = Math.ceil(meas.measureText(txt).width + fs * 0.8), h = Math.ceil(fs * 1.7);
    const { c, ctx } = U.canvas(w, h);
    ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const cx = w / 2, cy = h / 2 - fs * 0.08;
    const base = crit ? [255, 168, 46] : [255, 244, 222];
    const side = crit ? [178, 74, 22] : [190, 140, 100];
    ctx.save();
    ctx.shadowColor = 'rgba(40,18,8,0.45)'; ctx.shadowBlur = fs * 0.12; ctx.shadowOffsetY = fs * 0.08;
    ctx.fillStyle = rgbS(darken(side, 0.15)); ctx.fillText(txt, cx, cy + fs * 0.13);
    ctx.restore();
    for (let i = 3; i >= 1; i--) { ctx.fillStyle = rgbS(U.mix(side, base, (3 - i) * 0.12)); ctx.fillText(txt, cx, cy + fs * 0.035 * i); }
    const g = ctx.createLinearGradient(0, cy - fs * 0.45, 0, cy + fs * 0.4);
    g.addColorStop(0, rgbS(lighten(base, 0.45))); g.addColorStop(0.5, rgbS(base)); g.addColorStop(1, rgbS(darken(base, 0.12)));
    ctx.fillStyle = g; ctx.fillText(txt, cx, cy);
    ctx.globalCompositeOperation = 'source-atop';
    const hg = ctx.createRadialGradient(cx - fs * 0.15, cy - fs * 0.32, 0, cx - fs * 0.15, cy - fs * 0.32, fs * 0.6);
    hg.addColorStop(0, 'rgba(255,255,255,0.55)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hg; ctx.fillRect(0, 0, w, cy);
    ctx.globalCompositeOperation = 'source-over';
    s = { c, ox: w / 2, oy: h / 2 };
    numCache.set(key, s);
    return s;
  }

  /* ================================================================ icons */
  function heartPath(c, x, y, s) {
    c.moveTo(x, y + 7 * s);
    c.bezierCurveTo(x - 4 * s, y + 3.6 * s, x - 9.5 * s, y + 0.4 * s, x - 9.5 * s, y - 4.6 * s);
    c.bezierCurveTo(x - 9.5 * s, y - 9.6 * s, x - 2.6 * s, y - 10.6 * s, x, y - 5.6 * s);
    c.bezierCurveTo(x + 2.6 * s, y - 10.6 * s, x + 9.5 * s, y - 9.6 * s, x + 9.5 * s, y - 4.6 * s);
    c.bezierCurveTo(x + 9.5 * s, y + 0.4 * s, x + 4 * s, y + 3.6 * s, x, y + 7 * s);
    c.closePath();
  }
  const seedIcon = (c, x, y, a, s, col) => {
    c.save(); c.translate(x, y); c.rotate(a);
    clay(c, (k) => { k.save(); k.scale(s, s); seedPathH(k); k.restore(); }, col || [248, 232, 190], { b: [0.4 * s, 0, 3.8 * s, 2.8 * s], spec: 0.55, gloss: 0.5, dark: [178, 146, 96] });
    c.restore();
  };
  const ICONS = {
    'hp-heart'(c) {
      clay(c, (k) => heartPath(k, 24, 25, 2.0), [226, 64, 62], { b: [24, 21, 19, 17], spec: 0.55, gloss: 0.6, cast: 0 });
    },
    kills(c) {
      for (const a of [-0.7, 0, 0.7]) clay(c, (k) => leafPath(k, 24, 17, a, 12, 4), LEAF, { b: [24 + Math.sin(a) * 6, 17 - Math.cos(a) * 6, 5, 6], spec: 0.2, cast: a ? 0.3 : 0 });
      clay(c, (k) => turnipPath(k, 24, 13, 43, 15), CREEP[0].bot, {
        b: [24, 28, 15, 15], spec: 0.35,
        detail(k) { clay(k, (q) => { q.moveTo(0, 0); q.lineTo(48, 0); q.lineTo(48, 26); for (let x = 48; x >= 0; x -= 2) q.lineTo(x, 26 + Math.sin(x * 0.3) * 1.5); q.closePath(); }, CREEP[0].top, { b: [24, 19, 15, 8], spec: 0.35 }); },
      });
      eye(c, 18.5, 27, 3.6, 4, 19.5, 27.8, 1.8);
      eye(c, 29.5, 27, 3.6, 4, 30.5, 27.8, 1.8);
      cCap(c, 14.5, 20.5, 21.5, 23, 1.2, BROW, { spec: 0.3 });
      cCap(c, 26.5, 23, 33.5, 20.5, 1.2, BROW, { spec: 0.3 });
    },
    dmg(c) {
      seedIcon(c, 22, 26, -0.7, 4.2);
      groove(c, (q) => { q.moveTo(33, 9); q.lineTo(40, 4); q.moveTo(37, 14); q.lineTo(45, 12); q.moveTo(29, 6); q.lineTo(31, 1); }, 1.6, 0.0);
      for (const p of [[37, 9, 2.2], [41, 16, 1.6], [30, 5, 1.5]]) cE(c, p[0], p[1], p[2], p[2], [255, 206, 70], { spec: 0.6, gloss: 0.6, fp: 0 });
    },
    rate(c) {
      for (const p of [[12, 14], [8, 26], [12, 38]]) cCap(c, p[0], p[1], p[0] + 8, p[1], 1.2, [236, 214, 170], { spec: 0.3, fp: 0, cast: 0 });
      seedIcon(c, 27, 16, 0, 3.2); seedIcon(c, 33, 30, 0, 3.4);
    },
    multi(c) {
      clay(c, (k) => { k.moveTo(10, 40); k.bezierCurveTo(6, 26, 14, 18, 17, 16); k.lineTo(31, 16); k.bezierCurveTo(34, 18, 42, 26, 38, 40); k.quadraticCurveTo(24, 45, 10, 40); k.closePath(); }, [176, 128, 82], {
        b: [24, 29, 15, 14], spec: 0.25, cast: 0,
        detail(k) { groove(k, (q) => { q.moveTo(15, 22); q.quadraticCurveTo(24, 25, 33, 22); }, 1.4, 0.4); },
      });
      seedIcon(c, 18, 14, -1.2, 2.4); seedIcon(c, 25, 11, -1.6, 2.6); seedIcon(c, 31, 14, -2, 2.4);
      cE(c, 24, 18, 9, 2.6, [150, 104, 64], { spec: 0.2 });
    },
    bounce(c) {
      c.lineCap = 'round';
      const path = (q) => { q.moveTo(14, 42); for (let i = 0; i <= 40; i++) { const t = i / 40; q.lineTo(24 + Math.sin(t * PI * 7) * 8, 42 - t * 20 + Math.cos(t * PI * 7) * 1.5); } };
      sausage(c, path, 2.6, [120, 186, 214]);
      seedIcon(c, 24, 13, -0.3, 3.4);
    },
    lantern(c) {
      c.save(); c.translate(24, 44); c.scale(2.2, 2.2); lanternDraw(c); c.restore();
    },
    speed(c) {
      clay(c, (k) => { k.moveTo(6, 36); k.bezierCurveTo(6, 28, 14, 27, 20, 27); k.bezierCurveTo(26, 27, 28, 18, 32, 14); k.bezierCurveTo(37, 12, 42, 16, 42, 22); k.lineTo(42, 36); k.quadraticCurveTo(24, 40, 6, 36); k.closePath(); }, [168, 214, 236], {
        b: [24, 27, 18, 12], spec: 0.65, gloss: 0.7, cast: 0, dark: [90, 140, 186],
        detail(k) { groove(k, (q) => { q.moveTo(12, 31); q.quadraticCurveTo(24, 33, 36, 30); }, 1.2, 0.3); },
      });
      cCap(c, 38, 36, 39, 44, 1.8, [120, 170, 206], { spec: 0.5 });
      cE(c, 33, 22, 2.4, 2.2, [255, 206, 70], { spec: 0.6, gloss: 0.6, fp: 0 });
    },
    magnet(c) {
      c.strokeStyle = 'rgb(150,100,58)'; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(11, 22); c.bezierCurveTo(11, 4, 37, 4, 37, 22); c.stroke();
      c.strokeStyle = 'rgb(196,146,92)'; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(11, 21); c.bezierCurveTo(11, 5, 37, 5, 37, 21); c.stroke();
      cE(c, 16, 22, 3, 3, [255, 202, 64], { spec: 0.6, gloss: 0.6, fp: 0, cast: 0 });
      cE(c, 24, 20, 3.2, 3.2, [255, 124, 52], { spec: 0.6, gloss: 0.6, fp: 0 });
      cE(c, 31, 22, 3, 3, [255, 202, 64], { spec: 0.6, gloss: 0.6, fp: 0 });
      clay(c, (k) => { k.moveTo(7, 23); k.lineTo(41, 23); k.lineTo(37, 41); k.quadraticCurveTo(24, 44, 11, 41); k.closePath(); }, [182, 128, 76], {
        b: [24, 32, 17, 10], spec: 0.25,
        detail(k) {
          for (const y of [28, 34]) groove(k, (q) => { q.moveTo(8, y); q.lineTo(40, y); }, 1.1, 0.35);
          for (let x = 13; x < 40; x += 6) groove(k, (q) => { q.moveTo(x, 24); q.lineTo(x - 0.8, 41); }, 0.8, 0.3);
        },
      });
    },
    hp(c) {
      for (const p of [[18, 12], [28, 9]]) { c.strokeStyle = 'rgba(255,250,240,0.6)'; c.lineWidth = 2; c.lineCap = 'round'; c.beginPath(); c.moveTo(p[0], p[1] + 8); c.bezierCurveTo(p[0] - 3, p[1] + 5, p[0] + 3, p[1] + 2, p[0], p[1] - 2); c.stroke(); }
      cE(c, 24, 26, 18, 5, [232, 140, 52], { spec: 0.4, cast: 0 });
      cE(c, 16, 25, 3.4, 2.4, [246, 226, 196], { spec: 0.4 });
      cE(c, 27, 24, 3.2, 2.4, CREEP[0].top, { spec: 0.4 });
      cE(c, 32, 27, 2.6, 2, [110, 170, 76], { spec: 0.4 });
      clay(c, (k) => { k.moveTo(5, 27); k.quadraticCurveTo(7, 43, 24, 43); k.quadraticCurveTo(41, 43, 43, 27); k.quadraticCurveTo(24, 33, 5, 27); k.closePath(); }, [126, 84, 150], {
        b: [24, 35, 19, 9], spec: 0.35,
        detail(k) { groove(k, (q) => { q.moveTo(9, 34); q.quadraticCurveTo(24, 39, 39, 34); }, 1, 0.3); },
      });
    },
  };

  /* ================================================================== CSS */
  const F1 = "'Chewy', 'Baloo 2', system-ui, sans-serif";
  const F2 = "'Baloo 2', system-ui, sans-serif";
  const PANEL = `background: radial-gradient(120% 140% at 30% 18%, #fff5e2 0%, #f5ddb8 45%, #e0b98a 100%);
  box-shadow: inset 0 3px 3px rgba(255,255,255,.8), inset 0 -6px 10px rgba(150,88,40,.38), inset 4px 0 8px rgba(255,255,255,.25),
    0 5px 0 #b98654, 0 13px 18px rgba(50,24,10,.38);`;
  const THUMB = `content: ''; position: absolute; width: 22px; height: 27px; border-radius: 50%; pointer-events: none;
  background: repeating-radial-gradient(ellipse at 50% 58%, rgba(120,66,26,.2) 0 1px, rgba(255,255,255,.22) 1px 2px, rgba(0,0,0,0) 2px 3.3px);
  -webkit-mask: radial-gradient(closest-side, #000 60%, transparent); mask: radial-gradient(closest-side, #000 60%, transparent);`;
  const EXTR = (c1, c2, c3) => `0 2px 0 ${c1}, 0 4px 0 ${c2}, 0 5px 0 ${c3}, 0 9px 10px rgba(40,18,6,.45)`;
  const CSS = `
body.style-clay { font-family: ${F2}; }
body.style-clay #hud { padding: 14px 22px; }
body.style-clay #hud .xp { height: 24px; border: none; border-radius: 999px;
  background: linear-gradient(180deg, #6a4430, #8a5c40 60%, #9f6e4e);
  box-shadow: inset 0 4px 6px rgba(30,12,4,.6), inset 0 -2px 2px rgba(255,220,180,.25), 0 2px 0 rgba(255,236,210,.35), 0 7px 12px rgba(40,20,8,.32); overflow: hidden; }
body.style-clay #hud .xp-fill { border-radius: 999px; background: linear-gradient(180deg, #fff0a8 0%, #ffd055 35%, #f0a52c 72%, #c97c18 100%);
  box-shadow: inset 0 -3px 4px rgba(120,60,0,.4), inset 0 2px 2px rgba(255,255,230,.7); }
body.style-clay #hud .xp-fill::after { content: ''; position: absolute; left: 10px; right: 14px; top: 4px; height: 4px; border-radius: 4px; background: rgba(255,255,255,.6); filter: blur(1px); }
body.style-clay #hud .lvl { right: 14px; font-family: ${F1}; font-weight: 400; font-size: 19px; letter-spacing: 1px; color: #fff6e6;
  text-shadow: 0 1px 0 #9a6234, 0 2px 0 #7e4c26, 0 3px 4px rgba(40,18,6,.6); }
body.style-clay #hud .topline { display: grid; grid-template-columns: 1fr auto 1fr; align-items: start; margin-top: 14px; }
body.style-clay #hud .hp { position: relative; gap: 8px; justify-self: start; }
body.style-clay #hud .hp-icon, body.style-clay #hud .kills-icon { width: 46px; height: 46px; filter: drop-shadow(0 4px 3px rgba(40,18,6,.35)); }
body.style-clay #hud .hp-bar { width: 250px; height: 30px; border: none; border-radius: 999px;
  background: linear-gradient(180deg, #6a4430, #8a5c40 60%, #9f6e4e);
  box-shadow: inset 0 4px 7px rgba(30,12,4,.65), inset 0 -2px 2px rgba(255,220,180,.25), 0 2px 0 rgba(255,236,210,.35), 0 8px 12px rgba(40,20,8,.32); }
body.style-clay #hud .hp-fill { border-radius: 999px; background: linear-gradient(180deg, #ffab8f 0%, #f2613f 36%, #d23e26 72%, #a92c18 100%);
  box-shadow: inset 0 -4px 5px rgba(90,18,4,.45), inset 0 2px 2px rgba(255,220,200,.6); }
body.style-clay #hud .hp-fill::after { content: ''; position: absolute; left: 12px; right: 16px; top: 5px; height: 5px; border-radius: 4px; background: rgba(255,255,255,.55); filter: blur(1px); }
body.style-clay #hud .hp-text { position: absolute; left: 54px; width: 250px; top: 50%; transform: translateY(-50%); text-align: center;
  font-family: ${F1}; font-size: 19px; letter-spacing: 1px; color: #fff6e6; text-shadow: 0 1px 0 #8e2a18, 0 2px 0 #74200f, 0 3px 4px rgba(40,10,4,.6); }
body.style-clay.hurt #hud .hp { animation: clayWobble .26s steps(3); }
@keyframes clayWobble { 0%,100% { transform: none } 33% { transform: translate(-3px,1px) scale(1.04,.95) } 66% { transform: translate(3px,-1px) scale(.97,1.03) } }
body.style-clay #hud .clock { position: relative; justify-self: center; ${PANEL} border-radius: 26px 30px 24px 28px / 28px 24px 30px 26px; padding: 3px 30px 9px; margin-top: -4px; }
body.style-clay #hud .clock::after { ${THUMB} right: 9px; bottom: 7px; transform: rotate(-24deg); }
body.style-clay #hud .clock-time { font-family: ${F1}; font-weight: 400; font-size: 40px; line-height: 1.1; letter-spacing: 2px; color: #f07a24;
  text-shadow: ${EXTR('#c85e1a', '#a84a12', '#8c3c0e')}; }
body.style-clay #hud .clock-label { font-family: ${F2}; font-weight: 800; font-size: 12px; letter-spacing: 2px; opacity: 1; color: #9a6a44; }
body.style-clay #hud .kills { position: relative; justify-self: end; min-width: 0; gap: 6px; padding: 3px 22px 5px 8px; ${PANEL}
  border-radius: 28px 24px 30px 26px / 24px 28px 26px 30px; font-family: ${F1}; font-weight: 400; font-size: 28px; color: #7a3fa0;
  text-shadow: 0 2px 0 #5c2c7c, 0 4px 5px rgba(40,18,6,.35); }
body.style-clay #hud .kills::after { ${THUMB} right: 6px; top: 4px; width: 16px; height: 20px; transform: rotate(30deg); opacity: .8; }
body.style-clay #hud .kills-icon { width: 44px; height: 44px; }
body.style-clay #stylebar { ${PANEL} border: none; border-radius: 999px; color: #6a4224; padding: 6px 24px 8px; font-family: ${F2}; font-weight: 700; gap: 14px; bottom: 16px; }
body.style-clay #stylebar .style-family { color: #a87850; opacity: 1; font-weight: 800; }
body.style-clay #stylebar .style-name { font-family: ${F1}; font-weight: 400; font-size: 22px; letter-spacing: 1px; color: #f07a24; text-shadow: 0 2px 0 #b2551a, 0 4px 4px rgba(40,18,6,.35); }
body.style-clay #stylebar .style-hint { opacity: .85; }
body.style-clay #stylebar .auto.on { color: #4f9a34; }
body.style-clay #levelup { gap: 30px; background: radial-gradient(ellipse at 50% 44%, rgba(255,206,140,.28), rgba(46,22,10,.7) 78%);
  -webkit-backdrop-filter: blur(3px) saturate(.75); backdrop-filter: blur(3px) saturate(.75); }
body.style-clay #levelup .lu-title { font-family: ${F1}; font-weight: 400; font-size: 84px; letter-spacing: 3px; color: #ffb43c;
  text-shadow: 0 3px 0 #e08a26, 0 6px 0 #c06a1c, 0 9px 0 #9c5214, 0 11px 0 #7e4210, 0 20px 22px rgba(20,8,2,.55);
  transform: rotate(-2deg); animation: clayPop .5s steps(6) backwards; }
@keyframes clayPop { 0% { transform: scale(.3,.1) rotate(-6deg); } 50% { transform: scale(1.15,.85) rotate(-1deg); } 75% { transform: scale(.95,1.06) rotate(-3deg); } 100% { transform: scale(1) rotate(-2deg); } }
body.style-clay #levelup .lu-cards { gap: 30px; }
body.style-clay #levelup .card { width: 236px; min-height: 300px; padding: 22px 18px 24px; gap: 8px; color: #5a3418; border: none;
  border-radius: 34px 38px 32px 36px / 36px 32px 38px 34px;
  background: radial-gradient(130% 120% at 30% 14%, #fff7e8 0%, #f3d9b2 50%, #ddb07e 100%);
  box-shadow: inset 0 4px 4px rgba(255,255,255,.85), inset 0 -12px 18px rgba(140,78,30,.35), inset 6px 0 10px rgba(255,255,255,.2),
    0 8px 0 #b47e4a, 0 22px 28px rgba(26,10,2,.5);
  transition: transform .12s steps(2); animation: clayCard .45s steps(5) backwards; }
body.style-clay #levelup .card:nth-child(2) { animation-delay: .08s; background: radial-gradient(130% 120% at 30% 14%, #f3fbe6 0%, #cde6ae 50%, #9fc87e 100%);
  box-shadow: inset 0 4px 4px rgba(255,255,255,.85), inset 0 -12px 18px rgba(60,100,30,.35), inset 6px 0 10px rgba(255,255,255,.2), 0 8px 0 #739c50, 0 22px 28px rgba(26,10,2,.5); }
body.style-clay #levelup .card:nth-child(3) { animation-delay: .16s; background: radial-gradient(130% 120% at 30% 14%, #f8eefc 0%, #dcc6ee 50%, #b799d6 100%);
  box-shadow: inset 0 4px 4px rgba(255,255,255,.85), inset 0 -12px 18px rgba(90,50,130,.35), inset 6px 0 10px rgba(255,255,255,.2), 0 8px 0 #8a6aac, 0 22px 28px rgba(26,10,2,.5); }
body.style-clay #levelup .card::after { ${THUMB} right: 16px; bottom: 14px; width: 26px; height: 32px; transform: rotate(-30deg); }
@keyframes clayCard { 0% { transform: translateY(70px) scale(.6,.4); opacity: 0; } 60% { transform: translateY(-6px) scale(1.08,.92); opacity: 1; } 100% { transform: none; } }
body.style-clay #levelup .card:hover { transform: translateY(-8px) rotate(-1.5deg) scale(1.04,.98); }
body.style-clay #levelup .card-icon { width: 120px; height: 120px; padding: 10px; border-radius: 50%; background: rgba(255,255,255,.2);
  box-shadow: inset 0 7px 12px rgba(90,48,16,.42), inset 0 -3px 3px rgba(255,255,255,.55), 0 2px 0 rgba(255,255,255,.55); }
body.style-clay #levelup .card-name { margin-top: 4px; font-family: ${F1}; font-weight: 400; font-size: 27px; letter-spacing: .5px; line-height: 1.05; color: #6a3518;
  text-shadow: 0 2px 0 rgba(255,255,255,.55); }
body.style-clay #levelup .card-desc { font-family: ${F2}; font-weight: 700; font-size: 16px; line-height: 1.25; opacity: 1; color: #7c5434; }
body.style-clay #levelup .card-key { top: 12px; left: 14px; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 50%;
  background: repeating-radial-gradient(ellipse at 52% 60%, rgba(150,60,10,.16) 0 1px, rgba(255,255,255,.2) 1px 2px, rgba(0,0,0,0) 2px 3.2px),
    radial-gradient(circle at 36% 30%, #ffc988, #f08a3a 60%, #c9621e);
  box-shadow: inset 0 2px 2px rgba(255,255,255,.6), inset 0 -3px 4px rgba(120,40,0,.4), 0 3px 0 #9c4a16, 0 6px 8px rgba(40,18,6,.35);
  font-family: ${F1}; font-weight: 400; font-size: 20px; opacity: 1; color: #fff6e6; text-shadow: 0 2px 0 #9c4a16; }
body.style-clay #levelup .lu-hint { font-family: ${F2}; font-weight: 800; font-size: 18px; opacity: 1; color: #fff1dc; text-shadow: 0 2px 0 #7e4a26, 0 4px 6px rgba(20,8,2,.5); }
body.style-clay #gameover { background: radial-gradient(ellipse at 50% 46%, rgba(120,70,40,.15) 0%, rgba(36,16,8,.72) 78%);
  -webkit-backdrop-filter: grayscale(.7) brightness(.7) blur(2px); backdrop-filter: grayscale(.7) brightness(.7) blur(2px); gap: 18px; }
body.style-clay #gameover .go-title { font-family: ${F1}; font-weight: 400; font-size: 82px; color: #f07a24; letter-spacing: 2px;
  text-shadow: 0 3px 0 #c85e1a, 0 6px 0 #a84a12, 0 9px 0 #8c3c0e, 0 18px 20px rgba(20,8,2,.55); transform: rotate(-2deg); }
body.style-clay #gameover .go-stats { position: relative; font-family: ${F2}; font-weight: 700; font-size: 20px; opacity: 1; color: #6a4224; ${PANEL}
  border-radius: 26px 22px 28px 24px; padding: 10px 28px; }
body.style-clay #gameover .go-hint { font-family: ${F1}; font-size: 24px; opacity: 1; color: #fff6e6; border-radius: 999px; padding: 6px 26px 8px;
  background: radial-gradient(circle at 36% 30%, #ffc988, #f08a3a 60%, #c9621e);
  box-shadow: inset 0 3px 3px rgba(255,255,255,.55), inset 0 -4px 6px rgba(120,40,0,.4), 0 5px 0 #9c4a16, 0 12px 16px rgba(20,8,2,.45); text-shadow: 0 2px 0 #9c4a16; }
body.style-clay #pausebox { font-family: ${F1}; font-weight: 400; font-size: 76px; color: #ffb43c; text-shadow: ${EXTR('#e08a26', '#c06a1c', '#9c5214')}; }
`;

  /* ============================================================== particles */
  function crumb(game, x, y, z, ci, sp, size, life) {
    const a = Math.random() * TAU, s = sp * (0.5 + Math.random() * 0.7);
    return game.addParticle({
      kind: 'ball', ci, x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 50 + Math.random() * 60,
      grav: 300, drag: 1.6, life: life * (0.8 + Math.random() * 0.4), size: size * (0.7 + Math.random() * 0.6),
    });
  }
  function dust(game, x, y, z, size, vx, vy, life) {
    return game.addParticle({ kind: 'dust', x, y, z, vx, vy, drag: 4, life, size });
  }

  /* ================================================================ style */
  const JACK_SCALE = 1.06, CREEP_SCALE = 0.92;
  Styles.register({
    id: 'clay',
    name: 'Knetwelt',
    family: 'Claymation',
    description: 'Stop-Motion-Knetwelt wie im Miniatur-Studio: weiche Plastilin-Figuren mit Fingerabdrücken, sanftem Studiolicht und 12-fps-Gewackel.',
    groundColor: '#78a854',
    groundResMax: 2.5,
    chunkSize: 256,
    fonts: ['Chewy', 'Baloo+2:wght@500;600;700;800'],
    css: CSS,

    init() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssH = window.__forceH || window.innerHeight || 900;
      const S = (cssH * dpr) / 360;
      K = Math.max(3, Math.min(5, Math.round(S * 1.2)));
      FPC = makeFingerprint();
      buildMod();
      SPR.jack = []; SPR.jackHurt = [];
      for (let f = 0; f < 5; f++) {
        SPR.jack.push(set4([-15, -34, 15, 2.5], (c) => jackDraw(c, f, false), 100 + f));
        SPR.jackHurt.push(set4([-15, -34, 15, 2.5], (c) => jackDraw(c, f, true), 100 + f));
      }
      SPR.creep = [0, 1, 2].map((v) => [0, 1, 2, 3].map((f) => set4([-14, -32, 14, 2.5], (c) => creeperDraw(c, f, v), 200 + v * 10 + f)));
      SPR.ghost = [0, 1, 2, 3].map((f) => set4([-15, -28, 14, 2.5], (c) => ghostDraw(c, f), 300 + f));
      SPR.colo = [0, 1, 2, 3].map((f) => set4([-30, -64, 30, 3], (c) => colossusDraw(c, f), 400 + f));
      SPR.lantern = build([-8, -20, 8, 2], lanternDraw, 500);
      SPR.gemS = build([-3, -3.4, 3, 3.4], (c) => gemDraw(c, false), 501);
      SPR.gemB = build([-4, -4.6, 4, 4.4], (c) => gemDraw(c, true), 502);
      SPR.seed = build([-4.4, -3.4, 5, 3.4], seedDraw, 503);
      SPR.ball = CRUMB.map((col, i) => build([-2.4, -2.4, 2.4, 2.4], (c) => cE(c, 0, 0, 2, 1.85, col, { cast: 0, spec: 0.45, fp: 0.6, ao: 0.45 }), 600 + i));
      SPR.splat = CRUMB.map((col, i) => build([-7, -4, 7, 4], (c) => {
        const r = U.rng(700 + i);
        for (let j = 0; j < 3; j++) { const a = r.next() * TAU; cE(c, Math.cos(a) * 5.4, Math.sin(a) * 2.6, 0.9, 0.6, col, { cast: 0, spec: 0.4, fp: 0, ao: 0.3 }); }
        cLump(c, 0, 0, 4.6, 2.4, col, 0.25, { cast: 0, spec: 0.38, ao: 0.4, rim: 0.3 });
      }, 700 + i));
      SPR.mound = build([-12, -5, 12, 4], (c) => {
        cLump(c, 0, 0, 10.5, 4.2, [150, 104, 70], 0.18, { cast: 0, spec: 0.25, ao: 0.4 });
        c.save(); c.beginPath(); c.ellipse(0, 0.2, 7, 2.6, 0, 0, TAU); c.clip();
        const g = c.createRadialGradient(0, 1, 0.5, 0, 0.6, 7);
        g.addColorStop(0, '#2c160c'); g.addColorStop(0.7, '#4a2a18'); g.addColorStop(1, '#6e4630');
        c.fillStyle = g; c.fillRect(-8, -3, 16, 6); c.restore();
        for (const p of [[-9, 2.6], [8, 2.2], [3, 3.4]]) cE(c, p[0], p[1], 1.2, 0.9, [150, 104, 70], { spec: 0.3, fp: 0, cast: 0.3 });
      }, 750);
      const radial = (w, stops) => U.sprite(w, w, (c) => { const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); for (const s of stops) g.addColorStop(s[0], s[1]); c.fillStyle = g; c.fillRect(0, 0, w, w); });
      SPR.shadow = radial(64, [[0, 'rgba(44,24,16,0.5)'], [0.45, 'rgba(44,24,16,0.34)'], [1, 'rgba(44,24,16,0)']]);
      SPR.glow = radial(64, [[0, 'rgba(255,214,120,0.85)'], [0.35, 'rgba(255,170,70,0.35)'], [1, 'rgba(255,140,40,0)']]);
      SPR.flash = radial(64, [[0, 'rgba(255,255,248,0.95)'], [0.4, 'rgba(255,248,230,0.4)'], [1, 'rgba(255,240,220,0)']]);
      SPR.dust = radial(48, [[0, 'rgba(236,214,182,0.9)'], [0.55, 'rgba(226,200,166,0.55)'], [1, 'rgba(220,192,156,0)']]);
      SPR.streak = plain([-14, -2.4, -1, 2.4], (c) => {
        const g = c.createLinearGradient(-2, 0, -13, 0);
        g.addColorStop(0, 'rgba(255,244,214,0.75)'); g.addColorStop(1, 'rgba(255,244,214,0)');
        c.fillStyle = g; c.beginPath(); c.moveTo(-2, -1.5); c.quadraticCurveTo(-8, -0.6, -13.5, 0); c.quadraticCurveTo(-8, 0.6, -2, 1.5); c.closePath(); c.fill();
      });
      SPR.screen = U.sprite(320, 180, (c) => {
        c.save(); c.translate(160, 92); c.scale(1, 0.62);
        const g = c.createRadialGradient(0, 0, 70, 0, 0, 215);
        g.addColorStop(0, 'rgba(70,34,16,0)'); g.addColorStop(0.6, 'rgba(70,34,16,0.12)'); g.addColorStop(1, 'rgba(56,26,12,0.46)');
        c.fillStyle = g; c.fillRect(-200, -200, 400, 400); c.restore();
        let h = c.createLinearGradient(0, 0, 0, 34);
        h.addColorStop(0, 'rgba(255,232,206,0.24)'); h.addColorStop(1, 'rgba(255,232,206,0)');
        c.fillStyle = h; c.fillRect(0, 0, 320, 34);
        h = c.createLinearGradient(0, 150, 0, 180);
        h.addColorStop(0, 'rgba(255,226,196,0)'); h.addColorStop(1, 'rgba(255,226,196,0.2)');
        c.fillStyle = h; c.fillRect(0, 150, 320, 30);
        c.fillStyle = 'rgba(255,186,110,0.04)'; c.fillRect(0, 0, 320, 180);
      });
      SPR.props = {};
      for (const t in PROP_DEF) {
        const d = PROP_DEF[t];
        SPR.props[t] = [];
        for (let v = 0; v < d.n; v++) {
          const s = build(d.box, (c) => d.fn(c, v), 900 + v * 7 + t.length);
          SPR.props[t].push({ n: s, l: flipS(s) });
        }
      }
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
      const colT = new Int32Array(Wp), rowT = new Int32Array(Wp);
      for (let p = 0; p < Wp; p++) {
        colT[p] = ((Math.floor((info.wx + (p + 0.5) / res) * MODS) % MODW) + MODW) % MODW;
        rowT[p] = (((Math.floor((info.wy + (p + 0.5) / res) * MODS) % MODW) + MODW) % MODW) * MODW;
      }
      const img = ctx.createImageData(Wp, Wp);
      const buf = new Uint32Array(img.data.buffer);
      const bwPx = BW * res, swPx = SW * res;
      const st = new Int8Array(4);
      for (let gy = 0; gy < nc; gy++) {
        for (let gx = 0; gx < nc; gx++) {
          const o00 = (gy * nn + gx) * NF, o10 = o00 + NF, o01 = o00 + nn * NF, o11 = o01 + NF;
          const tint = (F[o00 + 4] + F[o10 + 4] + F[o01 + 4] + F[o11 + 4]) * 0.25;
          const mead = (F[o00 + 5] + F[o10 + 5] + F[o01 + 5] + F[o11 + 5]) * 0.25;
          for (let L = 0; L < 4; L++) {
            const a = F[o00 + L], b = F[o10 + L], c = F[o01 + L], d = F[o11 + L];
            const mn = Math.min(a, b, c, d), mx = Math.max(a, b, c, d);
            const gxm = Math.max(Math.abs(b - a), Math.abs(d - c)), gym = Math.max(Math.abs(c - a), Math.abs(d - b));
            const g = Math.sqrt(gxm * gxm + gym * gym) / cpx + 1e-9;
            st[L] = mx < 0 && mx / g < -(swPx + 2) ? 0 : mn > 0 && mn / g > bwPx + 2 ? 2 : 1;
          }
          let start = -1;
          for (let L = 3; L >= 0; L--) if (st[L] === 2) { start = L; break; }
          let needPix = false;
          for (let L = start + 1; L < 4; L++) if (st[L] === 1) { needPix = true; break; }
          const x0 = cs[gx], x1 = cs[gx + 1], y0 = cs[gy], y1 = cs[gy + 1];
          let br, bg, bb, am0 = start < 0 ? 1 : LAY[start].m;
          if (start < 0) { br = MEAD_A[0] + (MEAD_B[0] - MEAD_A[0]) * mead; bg = MEAD_A[1] + (MEAD_B[1] - MEAD_A[1]) * mead; bb = MEAD_A[2] + (MEAD_B[2] - MEAD_A[2]) * mead; }
          else { const lc = LAY[start].c; br = lc[0]; bg = lc[1]; bb = lc[2]; }
          if (!needPix) {
            for (let py = y0; py < y1; py++) {
              const rb = rowT[py], ro = py * Wp;
              for (let px = x0; px < x1; px++) {
                const m = (1 + MOD[rb + colT[px]] * am0) * tint;
                buf[ro + px] = pack(br * m, bg * m, bb * m);
              }
            }
            continue;
          }
          for (let py = y0; py < y1; py++) {
            const v = (py + 0.5) / cpx - gy, rb = rowT[py], ro = py * Wp;
            for (let px = x0; px < x1; px++) {
              const u = (px + 0.5) / cpx - gx;
              let r = br, g = bg, b = bb, am = am0;
              for (let L = start + 1; L < 4; L++) {
                if (st[L] === 0) continue;
                const A = F[o00 + L], B = F[o10 + L], Cc = F[o01 + L], D = F[o11 + L];
                const s0 = A + (B - A) * u, s1 = Cc + (D - Cc) * u;
                const s = s0 + (s1 - s0) * v;
                const du = (B - A) * (1 - v) + (D - Cc) * v, dv = (Cc - A) * (1 - u) + (D - B) * u;
                const gm = Math.sqrt(du * du + dv * dv);
                const gl = gm / cpx;
                const dist = gl > 1e-9 ? s / gl : s > 0 ? 99 : -99;
                const ld = gm > 1e-9 ? -(du * LX + dv * LY) / gm : 0;
                const lay = LAY[L];
                if (!lay.sunk) {
                  if (dist < 0.5) {
                    let sh = 1 + dist / swPx;
                    if (sh > 0) {
                      if (sh > 1) sh = 1;
                      const k = 0.4 * sh * sh * (0.35 + 0.65 * (ld < 0 ? -ld : 0));
                      r *= 1 - k; g *= 1 - k; b *= 1 - k;
                    }
                  }
                  if (dist > -0.5) {
                    const cov = dist + 0.5 > 1 ? 1 : dist + 0.5;
                    let p = 1 - dist / bwPx; p = p < 0 ? 0 : p > 1 ? 1 : p;
                    const cr = (p - 0.55) / 0.22;
                    const f = 1 + ld * 0.42 * p * p + 0.09 * Math.exp(-cr * cr) - 0.03 * p * p * p;
                    r += (lay.c[0] * f - r) * cov; g += (lay.c[1] * f - g) * cov; b += (lay.c[2] * f - b) * cov;
                    am += (lay.m - am) * cov;
                  }
                } else {
                  if (dist < 0 && dist > -bwPx * 0.7) {
                    // soft wet bank around the pond
                    const q = 1 + dist / (bwPx * 0.7);
                    const f = 1 - 0.1 * q * q;
                    r *= f; g *= f; b *= f;
                  }
                  if (dist > -0.5) {
                    const cov = dist + 0.5 > 1 ? 1 : dist + 0.5;
                    let p = 1 - dist / (bwPx * 1.3); p = p < 0 ? 0 : p > 1 ? 1 : p;
                    const pp = p * p;
                    const f = 1 - (ld > 0 ? ld : 0) * 0.34 * pp + (ld < 0 ? -ld : 0) * 0.16 * pp - 0.05 * pp;
                    r += (lay.c[0] * f - r) * cov; g += (lay.c[1] * f - g) * cov; b += (lay.c[2] * f - b) * cov;
                    am += (lay.m - am) * cov;
                  }
                }
              }
              const m = (1 + MOD[rb + colT[px]] * am) * tint;
              buf[ro + px] = pack(r * m, g * m, b * m);
            }
          }
        }
        yield;
      }
      for (let b0 = 0; b0 < Wp; b0 += 128) {
        ctx.putImageData(img, 0, 0, 0, b0, Wp, Math.min(128, Wp - b0));
        yield;
      }
      yield* decals(ctx, info);
    },

    propsForChunk(info) {
      const out = [];
      G.scatterOwned(info, 78, 5151, (x, y, rng) => {
        if (G.nearSpawn(x, y, 95)) return;
        const r = rng.next(), vr = rng.next();
        if (r > 0.4) return;
        const m = matSafe(x, y, 14);
        if (m < 0 || m === 3) return;
        let t = null, v = 0;
        if (m === 0) {
          if (r < 0.1) { t = 'tree'; v = vr < 0.5 ? 0 : vr < 0.8 ? 1 : 3; }
          else if (r < 0.2) { t = 'bush'; v = vr < 0.6 ? 0 : 1; }
          else if (r < 0.25) { t = 'mush'; v = 0; }
          else if (r < 0.28) t = 'fence';
          else if (r < 0.3) { t = 'rock'; v = vr < 0.5 ? 0 : 1; }
          else if (r < 0.31) { t = 'pump'; v = 0; }
        } else if (m === 1) {
          if (r < 0.12) { t = 'pump'; v = vr < 0.5 ? 0 : 1; }
          else if (r < 0.18) t = 'hay';
          else if (r < 0.22) t = 'fence';
          else if (r < 0.26) { t = 'tree'; v = 2; }
          else if (r < 0.28) { t = 'rock'; v = 1; }
        } else if (m === 2) {
          if (r < 0.1) { t = 'grave'; v = vr < 0.5 ? 0 : 1; }
          else if (r < 0.17) { t = 'mush'; v = 1; }
          else if (r < 0.22) { t = 'tree'; v = 3; }
          else if (r < 0.25) { t = 'rock'; v = 0; }
        } else {
          if (r < 0.04) { t = 'rock'; v = 1; }
          else if (r < 0.06) t = 'hay';
        }
        if (!t) return;
        out.push({ x, y, t, v, f: rng.chance(0.5), pad: t === 'tree' ? 75 : 35 });
      });
      return out;
    },

    drawProp(ctx, p) {
      const s = SPR.props[p.t][p.v];
      blit(ctx, p.f ? s.l : s.n, p.x, p.y, 1, 1);
    },

    drawShadow(ctx, o) {
      let rx, ry;
      if (o.kind === 'prop') { const d = PROP_DEF[o.t]; rx = d.sh[0]; ry = d.sh[1]; }
      else if (o.kind === 'enemy') {
        let k = 1;
        if (o.dying) k = 1 - o.deathT * 0.6;
        if (o.spawnT < 1) k *= U.clamp(o.spawnT * 1.6, 0, 1);
        if (k <= 0.02) return;
        if (o.type === 'ghost') { rx = 6.2 * k; ry = 2.3 * k; ctx.globalAlpha = 0.6; }
        else if (o.type === 'colossus') { rx = 21 * k; ry = 6.6 * k; }
        else { rx = 9.6 * k * CREEP_SCALE; ry = 3.3 * k * CREEP_SCALE; }
      } else { rx = 9.6 * JACK_SCALE; ry = 3.4 * JACK_SCALE; }
      soft(ctx, SPR.shadow, o.x + rx * 0.08, o.y + 0.4, rx, ry);
      ctx.globalAlpha = 1;
    },

    drawGroundOverlay(ctx, view, game) {
      const p = game.player;
      // warm candle light pool around Jack
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.16;
      soft(ctx, SPR.glow, p.x, p.y, 34, 18);
      // gem glows
      ctx.globalAlpha = 0.5;
      for (const g of game.gems) {
        if (g.x < view.x0 - 10 || g.x > view.x1 + 10 || g.y < view.y0 - 10 || g.y > view.y1 + 10) continue;
        const r = g.big ? 9 : 5.5;
        soft(ctx, SPR.glow, g.x, g.y - 2.5, r, r * 0.8);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      // clay splats that stay a moment
      const now = game.time;
      for (let i = SPLATS.length - 1; i >= 0; i--) {
        const s = SPLATS[i], t = (now - s.t0) / s.life;
        if (t >= 1 || t < 0) { SPLATS.splice(i, 1); continue; }
        if (s.x < view.x0 - 20 || s.x > view.x1 + 20 || s.y < view.y0 - 20 || s.y > view.y1 + 20) continue;
        const grow = t < 0.08 ? U.ease.outBack(t / 0.08) : 1;
        ctx.globalAlpha = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
        const fl = t > 0.7 ? 1 - (t - 0.7) / 0.3 * 0.5 : 1;
        blit(ctx, SPR.splat[s.ci], s.x, s.y, s.s * grow, s.s * grow * fl);
      }
      ctx.globalAlpha = 1;
      // clay mounds where enemies rise out of the ground
      for (const e of game.enemies) {
        if (e.dying || e.spawnT >= 1 || e.type === 'ghost') continue;
        if (e.x < view.x0 - 40 || e.x > view.x1 + 40 || e.y < view.y0 - 20 || e.y > view.y1 + 60) continue;
        const t = e.spawnT;
        const a = t < 0.2 ? U.ease.outBack(t / 0.2) : t > 0.75 ? Math.max(0, 1 - (t - 0.75) / 0.25) : 1;
        if (a <= 0.01) continue;
        const sc = (e.type === 'colossus' ? 1.9 : 1) * a;
        blit(ctx, SPR.mound, e.x, e.y + 0.6, sc, sc);
      }
    },

    drawGem(ctx, g, view) {
      const s = g.big ? SPR.gemB : SPR.gemS;
      const q = Math.floor(view.rt * 12) / 12;
      let h = 3 + Math.sin(q * 4 + g.seed * 20) * 1.0;
      let sc = 1;
      if (g.pop > 0) { const t = 1 - g.pop; h += Math.sin(t * PI) * 9; sc = 0.5 + 0.5 * U.ease.outBack(Math.min(1, t * 1.3)); }
      const k = g.big ? 1.3 : 1;
      soft(ctx, SPR.shadow, g.x, g.y, 2.6 * k, 1.1 * k);
      blit(ctx, s, g.x, g.y - h, sc, sc);
    },

    drawEnemy(ctx, e, view) {
      const V = tf(view);
      const stp = Math.floor(view.rt * 12);
      const sd = (e.seed * 9973) | 0;
      const bj = U.hash2(stp, sd, 11) - 0.5, bj2 = U.hash2(stp, sd, 12) - 0.5;
      let set, sx = 1, sy = 1, rot = 0, y = e.y, alpha = 1;
      let scl = 0.94 + e.seed * 0.12;
      if (e.type === 'creeper') {
        const f = Math.floor((e.anim * 0.8 + e.seed * 4) * 4) & 3;
        set = SPR.creep[Math.floor(e.seed * 3) % 3][f];
        scl *= CREEP_SCALE;
        rot = [0, 0.07, 0, -0.07][f];
        if (f & 1) { y -= 1.1; sy *= 1.03; } else { sx *= 1.05; sy *= 0.95; }
      } else if (e.type === 'ghost') {
        const f = Math.floor((view.rt * 1.8 + e.seed * 4) * 4) & 3;
        set = SPR.ghost[f];
        const q = stp / 12;
        y -= 5 + Math.sin(q * 2.4 + e.seed * 12) * 1.6;
        rot = U.clamp(e.vx / 60, -1, 1) * 0.12;
        alpha = 0.84;
      } else {
        const f = Math.floor((e.anim * 0.3 + e.seed) * 4) & 3;
        set = SPR.colo[f];
        if (f & 1) y -= 1.2; else { sx *= 1.06; sy *= 0.94; }
        rot = [0, 0.03, 0, -0.03][f];
      }
      sx *= scl * (1 + bj * 0.035); sy *= scl * (1 - bj * 0.03);
      rot += bj2 * 0.04;
      const left = e.facing < 0;
      if (e.dying) {
        const q = e.deathT;
        const k = U.ease.outQuad(Math.min(1, q / 0.55));
        sx *= 1 + 0.7 * k; sy *= 1 - 0.8 * k;
        ctx.globalAlpha = alpha * (q > 0.5 ? Math.max(0, 1 - (q - 0.5) / 0.5) : 1);
        blit(ctx, left ? set.nl : set.n, e.x, y, sx, sy);
        ctx.globalAlpha = 0.5 * (1 - q) * alpha;
        blit(ctx, left ? set.fl : set.f, e.x, y, sx, sy);
        ctx.globalAlpha = 1;
        return;
      }
      if (e.spawnT < 1) {
        if (e.type === 'ghost') {
          const q = U.clamp(e.spawnT / 0.85, 0, 1);
          alpha *= q; y += (1 - q) * 7; sx *= 0.5 + 0.5 * q; sy *= 0.7 + 0.3 * q;
        } else {
          const q = U.clamp(e.spawnT / 0.9, 0, 1);
          const vis = Math.floor(U.ease.outQuad(q) * 8) / 8;
          if (vis <= 0) return;
          const wob = 1 + 0.12 * (1 - q);
          blitRise(ctx, left ? set.nl : set.n, e.x, e.y, sx * wob, sy / wob, vis);
          return;
        }
      }
      const fl = e.flash;
      if (fl > 0) { sx *= 1 + 0.16 * fl; sy *= 1 - 0.15 * fl; }
      ctx.globalAlpha = alpha;
      const s = left ? set.nl : set.n;
      if (rot) blitRot(ctx, V, s, e.x, y, sx, sy, rot); else blit(ctx, s, e.x, y, sx, sy);
      if (fl > 0.02) {
        ctx.globalAlpha = Math.min(0.55, fl * 0.8) * alpha;
        const f2 = left ? set.fl : set.f;
        if (rot) blitRot(ctx, V, f2, e.x, y, sx, sy, rot); else blit(ctx, f2, e.x, y, sx, sy);
      }
      if (e.type === 'colossus') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.32 + 0.1 * Math.sin(stp * 0.7 + e.seed * 9);
        const dx = (left ? -2.5 : 2.5) * sx;
        soft(ctx, SPR.glow, e.x + dx, y - 21 * sy, 11 * sx, 11 * sy);
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.globalAlpha = 1;
    },

    drawPlayer(ctx, p, view) {
      const V = tf(view);
      const stp = Math.floor(view.rt * 12);
      let fr = 0, sx = 1, sy = 1, rot = 0;
      if (p.moving) {
        const f = Math.floor(p.anim * 0.34 * 4) & 3;
        fr = 1 + f;
        if (f === 0 || f === 2) { sx = 1.04; sy = 0.96; } else { sx = 0.98; sy = 1.03; }
        rot = 0.035 * p.facing;
      } else {
        const b = Math.sin(Math.floor(view.rt * 6) / 6 * 2.8);
        sy = 1 + 0.025 * b; sx = 1 - 0.018 * b;
      }
      const bj = U.hash2(stp, 77, 3) - 0.5, bj2 = U.hash2(stp, 78, 3) - 0.5;
      sx *= 1 + bj * 0.02; sy *= 1 - bj * 0.018; rot += bj2 * 0.025;
      if (p.shootT > 0) { sy *= 1 - 0.05 * p.shootT; sx *= 1 + 0.04 * p.shootT; }
      if (p.levelT > 0) { const w = Math.sin(Math.floor(p.levelT * 12) / 12 * PI * 4) * p.levelT; sy *= 1 + 0.16 * w; sx *= 1 - 0.1 * w; }
      const hurt = p.hurtT > 0;
      if (hurt) { sx *= 1 + 0.15 * p.hurtT; sy *= 1 - 0.13 * p.hurtT; }
      sx *= JACK_SCALE; sy *= JACK_SCALE;
      const left = p.facing < 0;
      const set = (hurt ? SPR.jackHurt : SPR.jack)[fr];
      if (p.dashT > 0) {
        const k = U.clamp(p.dashT / 0.2, 0, 1);
        sx *= 1 + 0.18 * k; sy *= 1 - 0.1 * k;
        for (let i = 3; i >= 1; i--) {
          ctx.globalAlpha = (0.32 / i) * k;
          blit(ctx, left ? set.nl : set.n, p.x - p.dashX * i * 6, p.y - p.dashY * i * 6, sx, sy);
        }
        ctx.globalAlpha = 1;
      }
      let a = 1;
      if (p.iframes > 0 && !hurt && p.dashT <= 0 && (Math.floor(view.rt * 12) & 1)) a = 0.55;
      ctx.globalAlpha = a;
      blitRot(ctx, V, left ? set.nl : set.n, p.x, p.y, sx, sy, rot);
      if (hurt) {
        ctx.globalAlpha = Math.min(0.55, p.hurtT * 0.8);
        blitRot(ctx, V, left ? set.fl : set.f, p.x, p.y, sx, sy, rot);
      }
      // candle glow from the carved face
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.3 + 0.08 * Math.sin(stp * 1.3);
      soft(ctx, SPR.glow, p.x + (left ? -2.6 : 2.6) * sx, p.y - 18 * sy, 11, 10);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    },

    drawOrbital(ctx, o, view) {
      const V = tf(view);
      const q = Math.floor(view.rt * 12) / 12;
      const bob = Math.sin(q * 4 + o.idx * 1.7) * 1.3;
      soft(ctx, SPR.shadow, o.x, o.y + 4, 4.5, 1.6);
      const y = o.y - 2 + bob;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.45 + 0.1 * Math.sin(q * 9 + o.idx * 2.1);
      soft(ctx, SPR.glow, o.x, y - 7, 12, 12);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      blitRot(ctx, V, SPR.lantern, o.x, y, 1, 1, Math.sin(q * 3 + o.idx) * 0.12);
    },

    drawProjectile(ctx, pr, view) {
      const V = tf(view);
      soft(ctx, SPR.shadow, pr.x, pr.y + 6, 2.6, 1);
      ctx.globalAlpha = Math.min(1, pr.age * 14);
      blitRot(ctx, V, SPR.streak, pr.x, pr.y, 1, 1, pr.angle);
      ctx.globalAlpha = 1;
      const sq = 0.6 + 0.4 * Math.abs(Math.cos(Math.floor(pr.spin * 2) / 2));
      blitRot(ctx, V, SPR.seed, pr.x, pr.y, 0.85, 0.85 * sq, pr.angle);
    },

    drawParticle(ctx, pt) {
      const t = 1 - pt.life / pt.max;
      switch (pt.kind) {
        case 'ball': {
          let s = pt.size * (t > 0.82 ? 1 - (t - 0.82) / 0.18 : 1);
          if (s <= 0.02) return;
          let sx = s, sy = s;
          if (pt.z < 0.5) { sx *= 1.25; sy *= 0.72; }
          blit(ctx, SPR.ball[pt.ci || 0], pt.x, pt.y - pt.z, sx, sy);
          return;
        }
        case 'dust': {
          const s = pt.size * (0.6 + 0.9 * U.ease.outQuad(t));
          ctx.globalAlpha = (1 - t) * (pt.ghost ? 0.85 : 0.6);
          soft(ctx, pt.ghost ? SPR.flash : SPR.dust, pt.x, pt.y - pt.z - s * 0.3 - (pt.ghost ? t * 8 : 0), s, s * 0.8);
          ctx.globalAlpha = 1;
          return;
        }
        case 'flash': {
          const s = pt.size * (0.7 + 0.6 * t);
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = (1 - t) * 0.6;
          soft(ctx, SPR.flash, pt.x, pt.y - pt.z, s, s);
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1;
          return;
        }
        default: {
          ctx.globalAlpha = U.clamp(pt.life / pt.max, 0, 1);
          ctx.fillStyle = pt.color || '#fff';
          ctx.beginPath(); ctx.arc(pt.x, pt.y - pt.z, (pt.size || 2) * 0.5, 0, TAU); ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    },

    drawNumber(ctx, n, view) {
      const V = tf(view);
      const spr = numSprite(n.value, n.crit, view.rt);
      const t = 1 - n.life / n.max;
      let sc = t < 0.1 ? 0.4 + (t / 0.1) * 0.85 : t < 0.22 ? 1.25 - ((t - 0.1) / 0.12) * 0.25 : 1;
      let sy = sc, sx = sc;
      if (t < 0.22) { sx *= 1 + (0.22 - t) * 0.8; sy *= 1 - (0.22 - t) * 0.6; }
      if (t > 0.75) { const k = 1 - ((t - 0.75) / 0.25) * 0.6; sx *= k; sy *= k; }
      ctx.globalAlpha = t > 0.84 ? Math.max(0, 1 - (t - 0.84) / 0.16) : 1;
      blitRot(ctx, V, spr, n.x, n.y, sx, sy, (n.seed - 0.5) * 0.25);
      ctx.globalAlpha = 1;
    },

    drawScreenOverlay(ctx, view) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(SPR.screen, 0, 0, view.W, view.H);
    },

    drawIcon(ctx, id, size) {
      const fn = ICONS[id] || ICONS.dmg;
      const oldPK = PK;
      ctx.save();
      ctx.scale(size / 48, size / 48);
      PK = size / 48; PR = U.rng(31);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      fn(ctx);
      ctx.restore();
      PK = oldPK;
    },

    /* --------------------------------------------------------------- hooks */
    onHit(game, e) {
      const h = e.type === 'colossus' ? 24 : e.type === 'ghost' ? 15 : 11;
      game.addParticle({ kind: 'flash', x: e.x + (Math.random() - 0.5) * 4, y: e.y + 0.5, z: h, life: 0.12, size: e.type === 'colossus' ? 9 : 6, drag: 0 });
      if (Math.random() < 0.55) {
        const ci = e.type === 'ghost' ? CI.ghost : e.type === 'colossus' ? CI.colo2 : Math.floor(e.seed * 3) % 3;
        crumb(game, e.x, e.y + 0.5, h, ci, 40, 0.5, 0.5);
      }
    },
    onKill(game, e) {
      const x = e.x, y = e.y + 0.6, T = e.type;
      const big = T === 'colossus', ghost = T === 'ghost';
      const h = big ? 22 : ghost ? 13 : 10;
      let cols;
      if (big) cols = [CI.colo, CI.colo2, CI.ember, CI.colo, CI.leaf];
      else if (ghost) cols = [CI.ghost, CI.ghost, CI.blue];
      else { const v = Math.floor(e.seed * 3) % 3; cols = [v, CI.cream, v, CI.leaf]; }
      if (!ghost) addSplat(game, x, y, cols[0], big ? 2.1 : 1.05);
      else for (let i = 0; i < 3; i++) { const a = Math.random() * TAU; game.addParticle({ kind: 'dust', ghost: true, x, y, z: 10, vx: Math.cos(a) * 18, vy: Math.sin(a) * 9, drag: 3, life: 0.55, size: 6 }); }
      if (big) { addSplat(game, x - 9, y + 3, CI.colo2, 1.0); addSplat(game, x + 10, y - 2, CI.colo, 0.9); }
      const n = big ? 12 : ghost ? 3 : 5;
      for (let i = 0; i < n; i++) crumb(game, x, y, h * 0.7, cols[i % cols.length], big ? 75 : 55, big ? 1.15 : 0.8, 1.3);
      const nd = big ? 6 : 2;
      for (let i = 0; i < nd; i++) {
        const a = Math.random() * TAU;
        dust(game, x + Math.cos(a) * 3, y + Math.sin(a) * 1.5, 2, big ? 10 : 6, Math.cos(a) * 26, Math.sin(a) * 12, 0.5);
      }
      game.addParticle({ kind: 'flash', x, y, z: h, life: 0.16, size: big ? 18 : 9, drag: 0 });
      if (big) game.shake = Math.max(game.shake || 0, 3);
    },
    onHurt(game, p) {
      game.addParticle({ kind: 'flash', x: p.x, y: p.y + 0.5, z: 16, life: 0.16, size: 11, drag: 0 });
      for (let i = 0; i < 4; i++) crumb(game, p.x, p.y + 0.5, 16, i & 1 ? CI.pump : CI.ember, 55, 0.6, 0.8);
    },
    onPickup(game, g) {
      const p = game.player;
      game.addParticle({ kind: 'flash', x: p.x + (Math.random() - 0.5) * 8, y: p.y + 0.5, z: 10 + Math.random() * 10, life: 0.16, size: g.big ? 8 : 4.5, drag: 0 });
    },
    onShoot(game, pr) {
      if (Math.random() < 0.3) dust(game, pr.x, pr.y + 4, 2, 2.4, pr.vx * 0.04, pr.vy * 0.04, 0.25);
    },
    onDash(game, p) {
      for (let i = 0; i < 4; i++) dust(game, p.x - p.dashX * i * 3 + (Math.random() - 0.5) * 4, p.y + 0.5 - p.dashY * i * 3, 1.5, 6 + Math.random() * 2, -p.dashX * 20, -p.dashY * 20, 0.42);
    },
    onLevelUp(game, p) {
      game.addParticle({ kind: 'flash', x: p.x, y: p.y, z: 14, life: 0.35, size: 26, drag: 0 });
      const cols = [CI.gold, CI.pump, CI.green, CI.purple0, CI.gold, CI.blue];
      for (let i = 0; i < 18; i++) crumb(game, p.x, p.y + 0.5, 14, cols[i % cols.length], 85, 0.75, 1.4);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; dust(game, p.x + Math.cos(a) * 5, p.y + Math.sin(a) * 2.5, 2, 8, Math.cos(a) * 45, Math.sin(a) * 22, 0.6); }
    },
    onDeath(game, p) {
      addSplat(game, p.x, p.y + 0.5, CI.pump, 2.0);
      for (let i = 0; i < 12; i++) crumb(game, p.x, p.y + 0.5, 16, i % 3 ? CI.pump : CI.green, 80, 1, 1.6);
    },
  });
})();
