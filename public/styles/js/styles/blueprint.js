/* Blueprint – a living technical drawing. Deep cyan-blue drafting paper with a fine grid, everything drawn in
   crisp white / pale-cyan line work: dimension lines with arrowheads, hatching for shade, construction circles and
   center marks, single-stroke technical lettering, title block and revision stamps as UI, fold creases and
   coffee rings on the sheet. Characters are mechanical drawings (an engineer robot, cog crawlers, survey drones,
   a boiler walker). Effects are dashed trajectories, measurement callouts and red-pencil corrections.
   All sprites are baked once in init() (two passes: a navy knock-out halo, then fills/hatching/lines);
   per frame it is one drawImage per actor plus a few vector strokes. Text is a built-in stroke font,
   so the canvas never waits for web fonts. */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2, PI = Math.PI;
  const mod = (a, b) => ((a % b) + b) % b;

  /* ================================================================ palette */
  const C = {
    paper: '#0e5088', paperDk: '#0a4374', paperLt: '#16609c',
    navy: '#062a4a', sep: '#072e52',
    ink: '#f2faff', pale: '#a9dcf6', dim: '#74b6de',
    fill: '#1c6aa8', fillDk: '#165b93', fill2: '#2a7dbd', dark: '#08304f',
    pInk: '#d3ebfa', pFill: '#14598f',
    red: '#ff5b4d', redDk: '#c9382e',
    amber: '#ffcf4a', amberDk: '#e0a325',
    eraser: '#f3b6ae', coffee: '#9c7a45',
  };
  const W_ = (a) => 'rgba(226,244,255,' + a + ')';
  const R_ = (a) => 'rgba(255,91,77,' + a + ')';
  const A_ = (a) => 'rgba(255,207,74,' + a + ')';
  const CHAIN = [5.5, 1.3, 0.9, 1.3];
  const DASH = [2.2, 1.4];

  /* ======================================================= stroke lettering */
  // Single-stroke technical lettering on a 4x6 grid (y down). Uppercase only, like a lettering template.
  const GL = {};
  (function () {
    const O = [1, 0, 3, 0, 4, 1, 4, 5, 3, 6, 1, 6, 0, 5, 0, 1, 1, 0];
    const P = [0, 6, 0, 0, 3, 0, 4, 1, 4, 2, 3, 3, 0, 3];
    const d = {
      '0': [O], '1': [[1, 1.2, 2.2, 0, 2.2, 6], [1, 6, 3.4, 6]], '2': [[0, 1, 1, 0, 3, 0, 4, 1, 4, 2, 0, 6, 4, 6]],
      '3': [[0, 0, 4, 0, 2, 2.5, 3, 2.5, 4, 3.5, 4, 5, 3, 6, 1, 6, 0, 5]], '4': [[3, 6, 3, 0, 0, 4.2, 4, 4.2]],
      '5': [[4, 0, 0.3, 0, 0, 2.6, 3, 2.6, 4, 3.6, 4, 5, 3, 6, 0, 6]], '6': [[3.5, 0, 1.5, 0, 0, 2, 0, 5, 1, 6, 3, 6, 4, 5, 4, 3.6, 3, 2.6, 1, 2.6, 0, 3.6]],
      '7': [[0, 0, 4, 0, 1.4, 6]], '8': [[1, 0, 3, 0, 4, 1, 4, 2, 3, 3, 1, 3, 0, 4, 0, 5, 1, 6, 3, 6, 4, 5, 4, 4, 3, 3], [1, 3, 0, 2, 0, 1, 1, 0]],
      '9': [[4, 2.5, 3, 3.5, 1, 3.5, 0, 2.5, 0, 1, 1, 0, 3, 0, 4, 1, 4, 4, 2.4, 6, 0.6, 6]],
      A: [[0, 6, 2, 0, 4, 6], [0.7, 4, 3.3, 4]], B: [[0, 3, 3, 3, 4, 4, 4, 5, 3, 6, 0, 6, 0, 0, 3, 0, 4, 1, 4, 2, 3, 3]],
      C: [[4, 1, 3, 0, 1, 0, 0, 1, 0, 5, 1, 6, 3, 6, 4, 5]], D: [[0, 0, 0, 6, 2.5, 6, 4, 4.5, 4, 1.5, 2.5, 0, 0, 0]],
      E: [[4, 0, 0, 0, 0, 6, 4, 6], [0, 3, 3, 3]], F: [[4, 0, 0, 0, 0, 6], [0, 3, 3, 3]],
      G: [[4, 1, 3, 0, 1, 0, 0, 1, 0, 5, 1, 6, 3, 6, 4, 5, 4, 3.4, 2.4, 3.4]], H: [[0, 0, 0, 6], [4, 0, 4, 6], [0, 3, 4, 3]],
      I: [[1, 0, 3, 0], [2, 0, 2, 6], [1, 6, 3, 6]], J: [[4, 0, 4, 5, 3, 6, 1, 6, 0, 5]], K: [[0, 0, 0, 6], [4, 0, 0, 4], [1.3, 3, 4, 6]],
      L: [[0, 0, 0, 6, 4, 6]], M: [[0, 6, 0, 0, 2, 3.5, 4, 0, 4, 6]], N: [[0, 6, 0, 0, 4, 6, 4, 0]], O: [O],
      P: [P], Q: [O, [2.4, 4.4, 4.2, 6.4]], R: [P, [2, 3, 4, 6]],
      S: [[4, 1, 3, 0, 1, 0, 0, 1, 0, 2, 1, 3, 3, 3, 4, 4, 4, 5, 3, 6, 1, 6, 0, 5]], T: [[0, 0, 4, 0], [2, 0, 2, 6]],
      U: [[0, 0, 0, 5, 1, 6, 3, 6, 4, 5, 4, 0]], V: [[0, 0, 2, 6, 4, 0]], W: [[0, 0, 1, 6, 2, 2.6, 3, 6, 4, 0]],
      X: [[0, 0, 4, 6], [4, 0, 0, 6]], Y: [[0, 0, 2, 3, 4, 0], [2, 3, 2, 6]], Z: [[0, 0, 4, 0, 0, 6, 4, 6]],
      '.': [[1.6, 5.4, 2.4, 5.4, 2.4, 6, 1.6, 6, 1.6, 5.4]], ',': [[2.2, 5.3, 1.6, 7]], '-': [[0.8, 3, 3.2, 3]], '+': [[0.4, 3, 3.6, 3], [2, 1.4, 2, 4.6]],
      '/': [[3.8, 0, 0.2, 6]], ':': [[2, 1.7, 2, 2.2], [2, 4.8, 2, 5.3]], '=': [[0.4, 2.2, 3.6, 2.2], [0.4, 3.8, 3.6, 3.8]],
      'Ø': [O, [4.5, -0.6, -0.5, 6.6]], '°': [[1.5, 0, 2.5, 0, 3, 0.6, 2.5, 1.2, 1.5, 1.2, 1, 0.6, 1.5, 0]],
      '%': [[3.8, 0, 0.2, 6], [0.4, 0.4, 1.2, 0.4, 1.2, 1.4, 0.4, 1.4, 0.4, 0.4], [2.8, 4.6, 3.6, 4.6, 3.6, 5.6, 2.8, 5.6, 2.8, 4.6]],
      '!': [[2, 0, 2, 4.2], [2, 5.5, 2, 6]], '?': [[0, 1, 1, 0, 3, 0, 4, 1, 4, 2, 2, 3.4, 2, 4.2], [2, 5.5, 2, 6]],
      '#': [[1.2, 0.5, 0.8, 5.5], [3.2, 0.5, 2.8, 5.5], [0, 2, 4, 2], [0, 4, 4, 4]], "'": [[2, 0, 2, 1.6]],
      '(': [[2.6, -0.2, 1.4, 1.2, 1.2, 3, 1.4, 4.8, 2.6, 6.2]], ')': [[1.4, -0.2, 2.6, 1.2, 2.8, 3, 2.6, 4.8, 1.4, 6.2]],
      'Δ': [[2, 0, 4, 6, 0, 6, 2, 0]], '²': [[1.4, 0.4, 2, 0, 2.8, 0.2, 2.8, 0.9, 1.4, 2.2, 3, 2.2]],
    };
    for (const k in d) GL[k] = d[k];
  })();
  const ADV = 5.7;
  function textWidth(str, h) { return str.length ? (str.length * ADV - 1.7) * (h / 6) : 0; }
  /** Adds the text to the current path. (x, y) = left/centre/right end of the baseline (bottom of the caps). */
  function textPath(c, str, x, y, h, align, italic, jit, seed) {
    const s = h / 6, w = textWidth(str, h);
    let x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    const sk = italic ? 0.2 : 0, top = y - h;
    for (let i = 0; i < str.length; i++) {
      const g = GL[str[i].toUpperCase()];
      if (g) {
        for (let pi = 0; pi < g.length; pi++) {
          const p = g[pi];
          for (let j = 0; j < p.length; j += 2) {
            let px = x0 + p[j] * s + (6 - p[j + 1]) * s * sk, py = top + p[j + 1] * s;
            if (jit) { px += (U.hash2(i * 31 + j, pi, seed) - 0.5) * jit; py += (U.hash2(i * 17 + j, pi + 9, seed) - 0.5) * jit; }
            if (j) c.lineTo(px, py); else c.moveTo(px, py);
          }
        }
      }
      x0 += ADV * s;
    }
    return w;
  }
  function strokeText(c, str, x, y, h, col, lw, align, italic, jit, seed) {
    c.beginPath();
    const w = textPath(c, str, x, y, h, align, italic, jit, seed || 1);
    c.strokeStyle = col; c.lineWidth = lw; c.stroke();
    return w;
  }

  /* ======================================================= drafting helpers */
  function arrowHead(c, x, y, ang, len, wid) {
    const dx = Math.cos(ang), dy = Math.sin(ang);
    c.moveTo(x, y);
    c.lineTo(x - dx * len - dy * wid, y - dy * len + dx * wid);
    c.lineTo(x - dx * len + dy * wid, y - dy * len - dx * wid);
    c.closePath();
  }
  /** Dimension: extension lines, dimension line with filled arrowheads and a label along the line.
      off = distance of the dimension line along the left normal of (x1,y1)->(x2,y2). */
  function dimLine(c, x1, y1, x2, y2, off, label, col, lw, h) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    const nx = dy / L, ny = -dx / L, ux = dx / L, uy = dy / L;
    const ax = x1 + nx * off, ay = y1 + ny * off, bx = x2 + nx * off, by = y2 + ny * off;
    const sg = off >= 0 ? 1 : -1;
    c.beginPath();
    c.moveTo(x1 + nx * sg * 1.5, y1 + ny * sg * 1.5); c.lineTo(ax + nx * sg * 2, ay + ny * sg * 2);
    c.moveTo(x2 + nx * sg * 1.5, y2 + ny * sg * 1.5); c.lineTo(bx + nx * sg * 2, by + ny * sg * 2);
    c.moveTo(ax, ay); c.lineTo(bx, by);
    c.strokeStyle = col; c.lineWidth = lw; c.stroke();
    const al = Math.min(3, L * 0.2) * (h / 4.5);
    c.beginPath();
    arrowHead(c, ax, ay, Math.atan2(-uy, -ux), al, al * 0.32);
    arrowHead(c, bx, by, Math.atan2(uy, ux), al, al * 0.32);
    c.fillStyle = col; c.fill();
    if (label) {
      let ang = Math.atan2(dy, dx);
      if (ang > PI / 2 + 1e-3) ang -= PI; else if (ang <= -PI / 2 - 1e-3) ang += PI;
      const mx = (ax + bx) / 2 + nx * sg * 1.2, my = (ay + by) / 2 + ny * sg * 1.2;
      c.save(); c.translate(mx, my); c.rotate(ang);
      const above = (sg > 0) === (Math.abs(Math.atan2(dy, dx)) <= PI / 2 + 1e-3);
      strokeText(c, label, 0, above ? -0.4 : h + 0.4, h, col, lw * 1.05, 'center');
      c.restore();
    }
  }
  /** Center mark: small cross in the middle + four dashes outside the circle. */
  function centerMark(c, x, y, r, ext) {
    const e = ext || 2.2, k = Math.min(1.2, r * 0.35);
    c.moveTo(x - k, y); c.lineTo(x + k, y); c.moveTo(x, y - k); c.lineTo(x, y + k);
    c.moveTo(x - r - e, y); c.lineTo(x - r + 0.6, y); c.moveTo(x + r - 0.6, y); c.lineTo(x + r + e, y);
    c.moveTo(x, y - r - e); c.lineTo(x, y - r + 0.6); c.moveTo(x, y + r - 0.6); c.lineTo(x, y + r + e);
  }
  function hatchLines(c, x0, y0, x1, y1, ang, sp) {
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + sp;
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    for (let o = -R; o <= R; o += sp) {
      const px = cx + nx * o, py = cy + ny * o;
      c.moveTo(px - dx * R, py - dy * R); c.lineTo(px + dx * R, py + dy * R);
    }
  }
  function rrect(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.arcTo(x + w, y, x + w, y + r, r);
    c.lineTo(x + w, y + h - r); c.arcTo(x + w, y + h, x + w - r, y + h, r);
    c.lineTo(x + r, y + h); c.arcTo(x, y + h, x, y + h - r, r);
    c.lineTo(x, y + r); c.arcTo(x, y, x + r, y, r); c.closePath();
  }
  const RR = (x, y, w, h, r) => (c) => { c.beginPath(); rrect(c, x, y, w, h, r); };
  const CIRC = (x, y, r) => (c) => { c.beginPath(); c.arc(x, y, r, 0, TAU); };
  const ELL = (x, y, rx, ry) => (c) => { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); };
  const POLY = (pts) => (c) => { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); };
  const LINE = (pts) => (c) => { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); };
  function gearPts(c, cx, cy, r0, r1, n, rot) {
    const st = TAU / n;
    for (let i = 0; i < n; i++) {
      const a = rot + i * st;
      const q = [[a, r0], [a + st * 0.1, r1], [a + st * 0.42, r1], [a + st * 0.52, r0]];
      for (let j = 0; j < 4; j++) {
        const x = cx + Math.cos(q[j][0]) * q[j][1], y = cy + Math.sin(q[j][0]) * q[j][1];
        if (!i && !j) c.moveTo(x, y); else c.lineTo(x, y);
      }
    }
    c.closePath();
  }
  const GEAR = (cx, cy, r0, r1, n, rot) => (c) => { c.beginPath(); gearPts(c, cx, cy, r0, r1, n, rot); };

  /* ============================================== two-pass sprite painting */
  // PASS 'back': every part paints its silhouette in navy, widened by HALO -> one knock-out outline per sprite.
  // PASS 'main': fills, hatching, navy separation line, white line work, construction lines.
  let PASS = 'main';
  const HALO = 2.3, SEP = 0.85;
  function shp(c, path, o) {
    const lw = o.lw === undefined ? 1 : o.lw;
    if (PASS === 'back') {
      if (o.noBack) return;
      path(c); c.fillStyle = C.navy; c.fill();
      c.lineWidth = lw + (o.halo || HALO); c.strokeStyle = C.navy; c.stroke();
      return;
    }
    path(c);
    if (o.fill) { c.fillStyle = o.fill; c.fill(); }
    if (o.hatch || o.grad) {
      c.save(); path(c); c.clip();
      if (o.hatch) {
        const h = o.hatch;
        if (h.rect) { c.beginPath(); c.rect(h.rect[0], h.rect[1], h.rect[2] - h.rect[0], h.rect[3] - h.rect[1]); c.clip(); }
        c.beginPath(); const b = h.box || h.rect; hatchLines(c, b[0], b[1], b[2], b[3], h.ang === undefined ? -PI / 4 : h.ang, h.sp || 1.2);
        c.lineWidth = h.lw || 0.32; c.strokeStyle = h.col || W_(h.a || 0.5); c.stroke();
      }
      if (o.grad) {
        // graduated shading of a cylinder: lines at x = cx + r*cos(theta), closer together towards the edge
        const g = o.grad; c.beginPath();
        for (let th = g.t0; th <= g.t1; th += g.dt) {
          const x = g.cx + g.r * Math.cos(th) * (g.side || 1);
          c.moveTo(x, g.y0); c.lineTo(x, g.y1);
        }
        c.lineWidth = g.lw || 0.32; c.strokeStyle = W_(g.a || 0.5); c.stroke();
      }
      c.restore();
    }
    if (lw > 0) {
      path(c);
      if (!o.noSep) { c.lineWidth = lw + SEP; c.strokeStyle = C.sep; c.stroke(); }
      c.lineWidth = lw; c.strokeStyle = o.col || C.ink; c.stroke();
    }
  }
  function ln(c, path, lw, col, o) {
    if (PASS === 'back') {
      if (o && o.noBack) return;
      path(c); c.lineWidth = lw + ((o && o.halo) || HALO); c.strokeStyle = C.navy; c.stroke();
      return;
    }
    path(c);
    if (o && o.dash) c.setLineDash(o.dash);
    if (o && o.sep) { c.lineWidth = lw + SEP; c.strokeStyle = C.sep; c.stroke(); }
    c.lineWidth = lw; c.strokeStyle = col; c.stroke();
    if (o && o.dash) c.setLineDash([]);
  }
  /** Outlined tube (limbs, struts): navy halo, white rim, coloured core. */
  function tube(c, path, w, core) {
    if (PASS === 'back') { path(c); c.lineWidth = w + HALO; c.strokeStyle = C.navy; c.stroke(); return; }
    path(c);
    c.lineWidth = w + SEP; c.strokeStyle = C.sep; c.stroke();
    c.lineWidth = w; c.strokeStyle = C.ink; c.stroke();
    c.lineWidth = Math.max(0.2, w - 1.1); c.strokeStyle = core || C.fill; c.stroke();
  }
  /** Thin drafting line that floats over everything (main pass only). */
  function con(c, path, lw, col, dash) {
    if (PASS === 'back') return;
    path(c);
    if (dash) c.setLineDash(dash);
    c.lineWidth = lw; c.strokeStyle = col; c.stroke();
    if (dash) c.setLineDash([]);
  }

  /* ================================================================ sprites */
  let K = 5;
  const SPR = {};
  function bake(box, fn, single) {
    const l = box[0], t = box[1], r = box[2], b = box[3], k = K;
    const { c, ctx } = U.canvas((r - l) * k, (b - t) * k);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const base = () => ctx.setTransform(k, 0, 0, k, -l * k, -t * k);
    if (!single) { PASS = 'back'; base(); fn(ctx); }
    PASS = 'main'; base(); fn(ctx);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return { c, ox: -l * k, oy: -t * k, k };
  }
  function withFx(s, tints) {
    s.flash = { c: U.tint(s.c, '#ffffff'), ox: s.ox, oy: s.oy, k: s.k };
    if (tints) s.red = { c: U.tint(s.c, C.red), ox: s.ox, oy: s.oy, k: s.k };
    return s;
  }

  /* ---- main character: a small engineer robot with a safety helmet and a drafting pencil ---- */
  function pencil(c, x, y, ang, len) {
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx, w = 1.05;
    const bx = x - dx * 3.4, by = y - dy * 3.4;            // back end
    const cx = x + dx * (len - 2.6), cy = y + dy * (len - 2.6); // start of the sharpened cone
    const tx = x + dx * len, ty = y + dy * len;            // tip
    shp(c, POLY([bx + nx * w, by + ny * w, cx + nx * w, cy + ny * w, cx - nx * w, cy - ny * w, bx - nx * w, by - ny * w]), { fill: C.amber, lw: 0.6 });
    con(c, LINE([bx + dx * 1.4, by + dy * 1.4, cx, cy]), 0.3, 'rgba(120,70,0,0.7)');
    shp(c, POLY([cx + nx * w, cy + ny * w, tx, ty, cx - nx * w, cy - ny * w]), { fill: '#e9d3a6', lw: 0.55 });
    shp(c, POLY([tx - dx * 0.9 + nx * 0.36, ty - dy * 0.9 + ny * 0.36, tx, ty, tx - dx * 0.9 - nx * 0.36, ty - dy * 0.9 - ny * 0.36]), { fill: C.dark, lw: 0.4, noSep: true });
    shp(c, POLY([bx + nx * w, by + ny * w, bx - dx * 1.2 + nx * w, by - dy * 1.2 + ny * w, bx - dx * 1.2 - nx * w, by - dy * 1.2 - ny * w, bx - nx * w, by - ny * w]), { fill: C.pale, lw: 0.5 });
    shp(c, (c2) => { c2.beginPath(); const ex = bx - dx * 1.2, ey = by - dy * 1.2; c2.moveTo(ex + nx * w, ey + ny * w); c2.arc(ex, ey, w, ang + PI / 2, ang + PI * 1.5); c2.closePath(); }, { fill: C.eraser, lw: 0.5 });
  }
  function heroDraw(c, mode, ph) {
    const a = ph * TAU, s = Math.sin(a);
    const walk = mode === 'walk', dash = mode === 'dash', idle = mode === 'idle';
    const bob = walk ? -Math.abs(s) * 1.1 : idle ? Math.sin(a) * 0.4 : -0.6;
    c.save();
    c.scale(0.92, 0.92);
    // drafting center line through the whole figure
    con(c, LINE([0, 3, 0, -42]), 0.3, W_(0.42), CHAIN);
    if (dash) {
      for (const [y, l] of [[-11, 13], [-19, 17], [-27, 11]]) con(c, LINE([-9, y, -9 - l, y]), 0.5, W_(0.7), [3, 1.6]);
      c.translate(0, -0.4); c.rotate(0.2);
    }
    const hipY = -8.4 + bob;
    const leg = (hx, p, back) => {
      let fx, fy;
      if (walk) { fx = hx + Math.sin(p) * 3.3; fy = -Math.max(0, Math.cos(p)) * 1.9; }
      else if (dash) { fx = hx > 0 ? hx + 4.6 : hx - 3.4; fy = hx > 0 ? -2.0 : -0.5; }
      else { fx = hx * 1.2; fy = 0; }
      const kx = (hx + fx) / 2 + 0.9, ky = (hipY + fy - 1.3) / 2;
      tube(c, LINE([hx, hipY, kx, ky, fx, fy - 1.6]), 2.1, back ? C.fillDk : C.fill);
      shp(c, CIRC(kx, ky, 0.95), { fill: back ? C.fillDk : C.fill2, lw: 0.5 });
      shp(c, RR(fx - 1.9, fy - 2.1, 4.9, 2.1, 0.9), { fill: back ? C.fillDk : C.fill, lw: 0.7 });
    };
    const arm = (sx, ang, ang2, back, pen) => {
      const sy = -15.4 + bob;
      const ex = sx + Math.sin(ang) * 3.3, ey = sy + Math.cos(ang) * 3.3;
      const hx = ex + Math.sin(ang2) * 3.1, hy = ey + Math.cos(ang2) * 3.1;
      tube(c, LINE([sx, sy, ex, ey, hx, hy]), 1.75, back ? C.fillDk : C.fill);
      shp(c, CIRC(ex, ey, 0.8), { fill: C.fill2, lw: 0.45 });
      if (pen !== undefined) pencil(c, hx, hy, pen, 10.5);
      shp(c, CIRC(hx, hy, 1.3), { fill: back ? C.fillDk : C.fill2, lw: 0.6 });
    };
    const sw = walk ? s * 0.65 : 0;
    // back arm, legs
    if (dash) arm(-4.4, -0.9, -1.5, true); else arm(-4.6, -sw + 0.1, -sw + 0.3, true);
    leg(-2.2, a + PI, true);
    leg(2.2, a, false);
    // torso
    const ty = bob;
    shp(c, RR(-5.3, -17.6 + ty, 10.6, 8.8, 1.8), { fill: C.fill, lw: 1, hatch: { rect: [2.6, -19 + ty, 6, -8 + ty], sp: 1.1, a: 0.55 } });
    con(c, LINE([-5.0, -10.7 + ty, 5.0, -10.7 + ty]), 0.4, C.pale);
    shp(c, CIRC(-1.0, -14.3 + ty, 2.15), { fill: C.dark, lw: 0.55 });
    if (PASS === 'main') {
      c.beginPath();
      for (let i = 0; i < 5; i++) { const t = PI * (1.05 + i * 0.225); c.moveTo(-1 + Math.cos(t) * 1.4, -14.3 + ty + Math.sin(t) * 1.4); c.lineTo(-1 + Math.cos(t) * 1.85, -14.3 + ty + Math.sin(t) * 1.85); }
      c.lineWidth = 0.28; c.strokeStyle = C.pale; c.stroke();
      const na = -PI * 0.3 + (walk ? s * 0.25 : 0);
      c.beginPath(); c.moveTo(-1, -14.3 + ty); c.lineTo(-1 + Math.cos(na) * 1.6, -14.3 + ty + Math.sin(na) * 1.6);
      c.lineWidth = 0.4; c.strokeStyle = C.amber; c.stroke();
      c.beginPath();
      for (const [rx, ry] of [[-4.2, -16.6], [4.2, -16.6], [-4.2, -11.6], [4.2, -11.6]]) { c.moveTo(rx + 0.35, ry + ty); c.arc(rx, ry + ty, 0.35, 0, TAU); }
      c.fillStyle = C.pale; c.fill();
    }
    // neck
    shp(c, RR(-1.7, -19.6 + ty, 3.4, 2.4, 0.4), { fill: C.fillDk, lw: 0.55 });
    con(c, LINE([-1.5, -18.8 + ty, 1.5, -18.8 + ty]), 0.3, C.pale);
    // head
    const hy = ty;
    shp(c, RR(-6.7, -29.8 + hy, 13.4, 10.4, 2.2), { fill: C.fill, lw: 1.05, hatch: { rect: [4.2, -31 + hy, 7.5, -19 + hy], sp: 1.05, a: 0.55 } });
    // ear bolt
    shp(c, CIRC(-6.7, -24.8 + hy, 1.3), { fill: C.fill2, lw: 0.55 });
    con(c, LINE([-7.5, -24.8 + hy, -5.9, -24.8 + hy]), 0.3, C.ink);
    // speaker grille
    con(c, (c2) => { c2.beginPath(); for (let i = 0; i < 3; i++) { c2.moveTo(-5.0, -23.3 + i * 1.15 + hy); c2.lineTo(-2.2, -23.3 + i * 1.15 + hy); } }, 0.45, C.pale);
    // lens eye with center mark
    const lx = 2.3, ly = -24.7 + hy;
    shp(c, CIRC(lx, ly, 3.4), { fill: C.dark, lw: 0.85 });
    con(c, CIRC(lx, ly, 2.35), 0.3, C.dim);
    const blink = idle && ph > 0.74 && ph < 0.9;
    if (PASS === 'main') {
      if (blink) { c.beginPath(); c.moveTo(lx - 1.6, ly + 0.2); c.lineTo(lx + 1.9, ly + 0.2); c.lineWidth = 0.7; c.strokeStyle = C.ink; c.stroke(); }
      else {
        c.beginPath(); c.arc(lx + 0.7, ly - 0.3, 1.15, 0, TAU); c.fillStyle = C.ink; c.fill();
        c.beginPath(); c.arc(lx + 0.35, ly - 0.7, 0.35, 0, TAU); c.fillStyle = C.dark; c.fill();
      }
      c.beginPath(); centerMark(c, lx, ly, 3.4, 1.8); c.lineWidth = 0.28; c.strokeStyle = W_(0.75); c.stroke();
    }
    // safety helmet
    shp(c, (c2) => { c2.beginPath(); c2.moveTo(-6.3, -29.5 + hy); c2.ellipse(0, -29.5 + hy, 6.3, 5.1, 0, PI, 0); c2.closePath(); },
      { fill: C.amber, lw: 0.95, hatch: { rect: [2.8, -36 + hy, 7, -29 + hy], sp: 1.0, col: 'rgba(150,90,0,0.55)' } });
    shp(c, RR(-8.3, -30.4 + hy, 16.6, 1.7, 0.85), { fill: C.amber, lw: 0.8 });
    con(c, LINE([0.4, -34.4 + hy, 0.4, -30.4 + hy]), 0.45, 'rgba(150,90,0,0.8)');
    con(c, LINE([-3.6, -33.0 + hy, -3.2, -30.4 + hy]), 0.3, 'rgba(150,90,0,0.6)');
    // antenna
    const sway = walk ? Math.sin(a + 1.4) * 0.9 : idle ? Math.sin(a + 1) * 0.5 : -1.6;
    ln(c, LINE([-3.4, -33.6 + hy, -4.6 + sway * 0.5, -36.4 + hy, -5.2 + sway, -38.6 + hy]), 0.5, C.ink);
    shp(c, CIRC(-5.2 + sway, -38.6 + hy, 0.95), { fill: C.red, lw: 0.45 });
    // front arm holding the pencil
    if (dash) arm(4.6, 1.2, 1.55, false, -0.18);
    else if (walk) arm(4.6, sw * 0.6 + 0.25, sw * 0.4 + 1.2, false, -0.75 + sw * 0.2);
    else arm(4.6, 0.25 + Math.sin(a) * 0.04, 1.25, false, -0.85);
    c.restore();
  }

  /* ---- small creature: cog crawler ---- */
  const CREEP = [{ n: 9, r0: 6.1, r1: 7.9 }, { n: 8, r0: 6.2, r1: 8.2 }, { n: 11, r0: 6.4, r1: 7.9 }];
  function creeperDraw(c, ph, v) {
    const V = CREEP[v], a = ph * TAU;
    const cy = -10.8 - Math.abs(Math.sin(a)) * 0.7;
    const leg = (side, along, p, back) => {
      const hx = side * 3.6 + along, hy = cy + 3.6;
      const lift = Math.max(0, Math.sin(p)) * 2.1;
      const fx = side * 9.4 + along * 1.2 + Math.cos(p) * 1.6, fy = -lift;
      const kx = side * 8.4 + along * 0.8, ky = cy - 0.6 - lift * 0.4;
      tube(c, LINE([hx, hy, kx, ky, fx, fy - 0.6]), 1.35, back ? C.fillDk : C.fill);
      shp(c, CIRC(kx, ky, 0.72), { fill: C.fill2, lw: 0.4 });
    };
    leg(-1, -1.4, a + PI, true); leg(1, -1.4, a, true);
    // feelers
    for (const sd of [-1, 1]) {
      const w = Math.sin(a * 2 + sd) * 0.5;
      ln(c, LINE([sd * 1.8, cy - 7.4, sd * 3.2 + w, cy - 11.0, sd * 4.6 + w, cy - 12.0]), 0.45, C.ink);
      shp(c, CIRC(sd * 4.6 + w, cy - 12.0, 0.7), { fill: C.ink, lw: 0.3, noSep: true });
    }
    const rot = ph * (TAU / V.n) + v;
    shp(c, GEAR(0, cy, V.r0, V.r1, V.n, rot), { fill: C.fill, lw: 0.95, hatch: { rect: [0.5, cy + 0.5, 10, cy + 10], box: [-10, cy - 10, 10, cy + 10], sp: 1.05, a: 0.5 } });
    con(c, CIRC(0, cy, V.r0 - 1.25), 0.3, W_(0.55), [2.4, 0.8, 0.6, 0.8]);
    if (v === 1 && PASS === 'main') {
      c.beginPath();
      for (let i = 0; i < 4; i++) { const t = rot * 0.5 + i * PI / 2 + PI / 4; c.moveTo(Math.cos(t) * 3.2, cy + Math.sin(t) * 3.2); c.lineTo(Math.cos(t) * 4.6, cy + Math.sin(t) * 4.6); }
      c.lineWidth = 0.5; c.strokeStyle = C.pale; c.stroke();
    }
    shp(c, CIRC(0, cy, 2.9), { fill: C.dark, lw: 0.75 });
    const ex = 0.7;
    shp(c, CIRC(ex, cy + 0.1, 1.65), { fill: C.red, lw: 0.4, noSep: true });
    if (PASS === 'main') {
      c.beginPath(); c.arc(ex - 0.5, cy - 0.45, 0.48, 0, TAU); c.fillStyle = '#fff4ee'; c.fill();
      if (v === 2) { c.beginPath(); c.moveTo(ex - 1.7, cy + 0.1); c.lineTo(ex + 1.7, cy + 0.1); c.lineWidth = 0.35; c.strokeStyle = C.dark; c.stroke(); }
      // angry brow strokes
      c.beginPath(); c.moveTo(-2.6, cy - 4.2); c.lineTo(-0.2, cy - 3.2); c.moveTo(1.6, cy - 3.2); c.lineTo(3.9, cy - 4.3);
      c.lineWidth = 0.75; c.strokeStyle = C.ink; c.stroke();
      c.beginPath(); centerMark(c, 0, cy, V.r1, 1.6); c.lineWidth = 0.26; c.strokeStyle = W_(0.6); c.stroke();
    }
    leg(-1, 1.2, a, false); leg(1, 1.2, a + PI, false);
  }

  /* ---- fast creature: survey drone with a plumb bob ---- */
  function droneDraw(c, ph) {
    const a = ph * TAU, y0 = -16.5;
    c.save(); c.scale(0.8, 0.8);
    // downwash (construction)
    for (const sd of [-1, 1]) con(c, LINE([sd * 10, y0 - 3, sd * 10.6, y0 + 9]), 0.35, W_(0.35), [1.6, 1.6]);
    // struts
    for (const sd of [-1, 1]) tube(c, LINE([sd * 4.5, y0 - 1.5, sd * 9.6, y0 - 4.2]), 1.25, C.fillDk);
    // skids
    for (const sd of [-1, 1]) ln(c, LINE([sd * 2.6, y0 + 2.4, sd * 4.3, y0 + 6.2]), 0.55, C.ink);
    ln(c, LINE([-6.4, y0 + 6.2, -2.2, y0 + 6.2]), 0.6, C.ink); ln(c, LINE([2.2, y0 + 6.2, 6.4, y0 + 6.2]), 0.6, C.ink);
    // plumb bob on a dashed line
    const bs = Math.sin(a) * 0.9;
    con(c, LINE([0, y0 + 3, bs, y0 + 11.2]), 0.35, W_(0.8), [1.1, 0.8]);
    shp(c, POLY([bs - 1.3, y0 + 11.2, bs + 1.3, y0 + 11.2, bs, y0 + 14.2]), { fill: C.amber, lw: 0.45 });
    // body
    shp(c, RR(-6.2, y0 - 3.1, 12.4, 6.2, 3), { fill: C.fill, lw: 0.95, hatch: { rect: [-7, y0 + 0.6, 7, y0 + 4], sp: 1.0, a: 0.55 } });
    shp(c, (c2) => { c2.beginPath(); c2.moveTo(-3.6, y0 - 3); c2.ellipse(-0.6, y0 - 3, 3.0, 2.6, 0, PI, 0); c2.closePath(); }, { fill: C.fill2, lw: 0.75 });
    con(c, LINE([-6, y0, 1.5, y0]), 0.3, C.pale, [1.2, 0.7]);
    shp(c, CIRC(3.6, y0 - 0.1, 1.75), { fill: C.red, lw: 0.45, noSep: true });
    if (PASS === 'main') {
      c.beginPath(); c.arc(3.1, y0 - 0.6, 0.5, 0, TAU); c.fillStyle = '#fff4ee'; c.fill();
      c.beginPath(); c.moveTo(1.6, y0 - 2.6); c.lineTo(4.8, y0 - 1.9); c.lineWidth = 0.6; c.strokeStyle = C.ink; c.stroke();
    }
    // rotors
    for (const sd of [-1, 1]) {
      const rx = sd * 10;
      shp(c, RR(rx - 1.1, y0 - 6.0, 2.2, 1.8, 0.5), { fill: C.fill2, lw: 0.5 });
      con(c, ELL(rx, y0 - 6.4, 5.4, 1.15), 0.35, W_(0.7), [1.0, 0.8]);
      const bl = Math.cos(a * 2 + sd) * 5.0;
      ln(c, LINE([rx - bl, y0 - 6.4, rx + bl, y0 - 6.4]), 0.7, C.ink, { halo: 1.4 });
    }
    c.restore();
  }

  /* ---- large creature: boiler walker ---- */
  function colossusDraw(c, ph) {
    const a = ph * TAU, s = Math.sin(a);
    const bob = -Math.abs(s) * 1.3;
    const lift = [Math.max(0, s) * 2.8, Math.max(0, -s) * 2.8];
    // smoke as dashed construction circles
    for (let k = 0; k < 3; k++) {
      const q = (ph + k / 3) % 1;
      con(c, CIRC(-7.6 - q * 3.5, -57.5 - q * 9, 1.4 + q * 2.6), 0.35, W_(0.65 * (1 - q)), [1.2, 0.9]);
    }
    const arm = (sd, sw) => {
      const sx = sd * 13.6, sy = -39.5 + bob;
      const ex = sd * 19.2 + sw * 0.4, ey = -32.5 + bob;
      const hx = sd * 19.8 + sw, hy = -25.2 + bob;
      tube(c, LINE([sx, sy, ex, ey, hx, hy]), 3.0, sd < 0 ? C.fillDk : C.fill);
      shp(c, CIRC(ex, ey, 1.6), { fill: C.fill2, lw: 0.55 });
      shp(c, (c2) => { c2.beginPath(); c2.arc(hx, hy + 2.2, 3.0, -PI * 0.15, PI * 1.15, true); c2.lineTo(hx - 1.2, hy + 1.4); c2.arc(hx, hy + 2.2, 1.4, PI * 1.15, -PI * 0.15, false); c2.closePath(); },
        { fill: sd < 0 ? C.fillDk : C.fill, lw: 0.75 });
    };
    arm(-1, s * 1.4);
    const leg = (sd, lf) => {
      const hx = sd * 7.4, hy = -19 + bob;
      const fx = sd * 8.2, fy = -lf;
      const kx = sd * 9.4, ky = -10.2 - lf * 0.45 + bob * 0.4;
      tube(c, LINE([hx, hy, kx, ky, fx, fy - 2.4]), 4.4, sd < 0 ? C.fillDk : C.fill);
      con(c, LINE([hx, hy + 1, kx, ky]), 0.35, C.pale);
      shp(c, CIRC(kx, ky, 2.1), { fill: C.fill2, lw: 0.6 });
      con(c, (c2) => { c2.beginPath(); centerMark(c2, kx, ky, 2.1, 1.0); }, 0.25, W_(0.8));
      shp(c, POLY([fx - 5.6, fy, fx + 5.6, fy, fx + 4.0, fy - 2.9, fx - 4.0, fy - 2.9]), { fill: sd < 0 ? C.fillDk : C.fill, lw: 0.8 });
      if (PASS === 'main') { c.beginPath(); for (const bx of [-2.6, 0, 2.6]) { c.moveTo(fx + bx + 0.35, fy - 1.4); c.arc(fx + bx, fy - 1.4, 0.35, 0, TAU); } c.fillStyle = C.pale; c.fill(); }
    };
    leg(-1, lift[0]); leg(1, lift[1]);
    // smoke stack
    shp(c, RR(-10.2, -54.6 + bob, 4.8, 10.5, 0.5), { fill: C.fill, lw: 0.8, hatch: { rect: [-7.4, -56 + bob, -5, -43 + bob], sp: 0.9, a: 0.55 } });
    shp(c, RR(-11.0, -55.8 + bob, 6.4, 1.7, 0.5), { fill: C.fill2, lw: 0.7 });
    // boiler (vertical cylinder)
    const T = -45 + bob, B = -19.5 + bob, R = 14, ry = 3.4;
    const body = (c2) => { c2.beginPath(); c2.moveTo(-R, T); c2.lineTo(-R, B); c2.ellipse(0, B, R, ry, 0, PI, 0, true); c2.lineTo(R, T); c2.ellipse(0, T, R, ry, 0, 0, PI, true); c2.closePath(); };
    shp(c, body, { fill: C.fill, lw: 1.15, grad: { cx: 0, r: R, t0: 0.12, t1: 1.05, dt: 0.13, y0: T - 5, y1: B + 5, a: 0.5, lw: 0.34 } });
    con(c, (c2) => { c2.beginPath(); for (const xx of [-13.3, -12.2]) { c2.moveTo(xx, T + 1); c2.lineTo(xx, B + 2); } }, 0.3, W_(0.4));
    shp(c, ELL(0, T, R, ry), { fill: C.fill2, lw: 0.8 });
    con(c, ELL(0, T, R - 2.4, ry - 0.8), 0.3, W_(0.5), [1.6, 0.9]);
    // seams with rivets
    for (const sy of [-29.5 + bob]) {
      con(c, (c2) => { c2.beginPath(); c2.ellipse(0, sy, R, ry, 0, PI, 0, true); }, 0.55, C.ink);
      if (PASS === 'main') {
        c.beginPath();
        for (let th = 0.35; th < PI - 0.3; th += 0.3) { const x = Math.cos(th) * R * 0.97, y = sy + Math.sin(th) * ry + 1.0; c.moveTo(x + 0.4, y); c.arc(x, y, 0.4, 0, TAU); }
        c.fillStyle = C.pale; c.fill();
      }
    }
    // face: two portholes + grille
    for (const [ex, er] of [[-0.6, 2.9], [7.0, 2.6]]) {
      shp(c, CIRC(ex, -37.3 + bob, er), { fill: C.dark, lw: 0.85 });
      shp(c, CIRC(ex + 0.5, -37.0 + bob, er * 0.55), { fill: C.red, lw: 0.35, noSep: true });
      if (PASS === 'main') { c.beginPath(); c.arc(ex - 0.1, -37.7 + bob, er * 0.18, 0, TAU); c.fillStyle = '#fff4ee'; c.fill(); }
    }
    if (PASS === 'main') {
      c.beginPath(); c.moveTo(-4.4, -42.2 + bob); c.lineTo(2.2, -40.5 + bob); c.moveTo(4.6, -40.6 + bob); c.lineTo(10.4, -42.0 + bob);
      c.lineWidth = 0.9; c.strokeStyle = C.ink; c.stroke();
    }
    shp(c, RR(-1.0, -33.4 + bob, 9.6, 3.0, 0.6), { fill: C.dark, lw: 0.6 });
    con(c, (c2) => { c2.beginPath(); for (let i = 1; i < 6; i++) { c2.moveTo(-1 + i * 1.6, -33.1 + bob); c2.lineTo(-1 + i * 1.6, -30.7 + bob); } }, 0.35, C.pale);
    // name plate
    shp(c, RR(-9.0, -26.8 + bob, 7.4, 3.6, 0.4), { fill: C.fillDk, lw: 0.5 });
    con(c, (c2) => { c2.beginPath(); c2.moveTo(-8.0, -25.0 + bob); c2.lineTo(-2.6, -25.0 + bob); c2.moveTo(-8.0, -24.0 + bob); c2.lineTo(-4.4, -24.0 + bob); }, 0.3, C.pale);
    arm(1, -s * 1.4);
  }

  /* ---- props ---- */
  const PROPS = {
    tree: { n: 2, box: [-22, -60, 22, 3], sh: 13 },
    rock: { n: 2, box: [-17, -19, 17, 3], sh: 13 },
    crate: { n: 2, box: [-14, -27, 19, 3], sh: 13 },
    tank: { n: 1, box: [-16, -46, 26, 3], sh: 12 },
    lamp: { n: 1, box: [-9, -54, 25, 3], sh: 6 },
    tower: { n: 1, box: [-17, -77, 27, 3], sh: 13 },
    theodolite: { n: 1, box: [-19, -34, 17, 3], sh: 8 },
    valve: { n: 1, box: [-19, -32, 19, 3], sh: 15 },
  };
  function pshp(c, path, o) { o.col = o.col || C.pInk; if (o.lw === undefined) o.lw = 0.85; if (o.fill === undefined) o.fill = C.pFill; o.halo = o.halo || 1.9; shp(c, path, o); }
  function treeDraw(c, v) {
    if (v === 0) {
      con(c, LINE([0, 2, 0, -58]), 0.28, W_(0.35), CHAIN);
      tube(c, LINE([0, 0, 0, -20]), 2.8, C.pFill);
      tube(c, LINE([0, -13, -4.5, -21]), 1.4, C.pFill);
      tube(c, LINE([0, -16, 4.2, -23]), 1.3, C.pFill);
      const cs = [[-6.5, -30, 9.5], [6, -32, 10], [0, -41, 10], [-1, -25, 7]];
      const union = (c2) => { c2.beginPath(); for (const [x, y, r] of cs) { c2.moveTo(x + r, y); c2.arc(x, y, r, 0, TAU); } };
      if (PASS === 'back') { union(c); c.fillStyle = C.navy; c.fill(); c.lineWidth = 2.8; c.strokeStyle = C.navy; c.stroke(); }
      else {
        union(c); c.lineWidth = 1.9; c.strokeStyle = C.pInk; c.stroke();
        union(c); c.fillStyle = C.pFill; c.fill();
        c.save(); union(c); c.clip();
        c.beginPath(); c.rect(-2, -34, 20, 30); c.rect(-18, -22, 30, 8); c.clip();
        c.beginPath(); hatchLines(c, -20, -55, 20, -10, -PI / 4, 1.3); c.lineWidth = 0.3; c.strokeStyle = W_(0.45); c.stroke();
        c.restore();
        c.beginPath(); for (const [x, y, r] of cs) { c.moveTo(x + 0.9, y); c.lineTo(x - 0.9, y); c.moveTo(x, y - 0.9); c.lineTo(x, y + 0.9); }
        c.lineWidth = 0.28; c.strokeStyle = W_(0.7); c.stroke();
        c.setLineDash([1.6, 1.2]); c.beginPath(); c.arc(0, -41, 14, PI * 1.05, PI * 1.95); c.lineWidth = 0.28; c.strokeStyle = W_(0.4); c.stroke(); c.setLineDash([]);
      }
    } else {
      // conifer: stacked triangles on a center line
      con(c, LINE([0, 2, 0, -58]), 0.28, W_(0.35), CHAIN);
      tube(c, LINE([0, 0, 0, -9]), 2.6, C.pFill);
      const tiers = [[-9, 14], [-21, 11.5], [-32, 9], [-42, 6.5]];
      for (let i = 0; i < tiers.length; i++) {
        const [y, w] = tiers[i], h = 17 - i * 1.6;
        pshp(c, POLY([-w, y, w, y, 0, y - h]), { hatch: { rect: [0, y - h, w, y], box: [-w, y - h, w, y], sp: 1.25, a: 0.45 } });
      }
    }
  }
  function rockDraw(c, v) {
    const pts = v === 0 ? [-14, 0, -12, -8, -6, -14, 3, -15, 11, -10, 14, -3, 12, 0] : [-11, 0, -10, -6, -3, -11, 6, -10, 10, -4, 9, 0];
    pshp(c, POLY(pts), { hatch: { rect: [1, -20, 20, 2], box: [-16, -18, 16, 2], sp: 1.2, a: 0.45 } });
    if (PASS === 'main') {
      c.beginPath();
      if (v === 0) { c.moveTo(-6, -14); c.lineTo(-3, -6); c.lineTo(-12, -8); c.moveTo(-3, -6); c.lineTo(5, -7); c.lineTo(11, -10); c.moveTo(5, -7); c.lineTo(3, -15); c.moveTo(-3, -6); c.lineTo(-2, 0); c.moveTo(5, -7); c.lineTo(8, 0); }
      else { c.moveTo(-3, -11); c.lineTo(-1, -4); c.lineTo(-10, -6); c.moveTo(-1, -4); c.lineTo(6, -10); c.moveTo(-1, -4); c.lineTo(1, 0); }
      c.lineWidth = 0.45; c.strokeStyle = C.pale; c.stroke();
      // stipple
      c.beginPath();
      const r = U.rng(31 + v);
      for (let i = 0; i < 26; i++) { const x = r.range(-10, 10), y = r.range(-12, -1); if (x > -2) { c.moveTo(x + 0.22, y); c.arc(x, y, 0.22, 0, TAU); } }
      c.fillStyle = W_(0.55); c.fill();
    }
  }
  function crateDraw(c, v) {
    const w = v ? 15 : 19, h = v ? 13 : 17, d = 4.2;
    const x0 = -w / 2, y0 = -h;
    pshp(c, POLY([x0 + w, y0, x0 + w + d, y0 - d * 0.8, x0 + w + d, -d * 0.8, x0 + w, 0]), { fill: '#104d7e', hatch: { box: [x0 + w, y0 - d, x0 + w + d, 0], rect: [x0 + w, y0 - d, x0 + w + d, 1], sp: 1.0, a: 0.5 } });
    pshp(c, POLY([x0, y0, x0 + d, y0 - d * 0.8, x0 + w + d, y0 - d * 0.8, x0 + w, y0]), { fill: '#1d68a3' });
    pshp(c, RR(x0, y0, w, h, 0.3), {});
    if (PASS === 'main') {
      c.beginPath();
      c.rect(x0 + 1.6, y0 + 1.6, w - 3.2, h - 3.2);
      c.moveTo(x0 + 1.6, y0 + 1.6); c.lineTo(x0 + w - 1.6, -1.6);
      c.lineWidth = 0.5; c.strokeStyle = C.pale; c.stroke();
      c.beginPath(); c.moveTo(x0 + 1.6, -1.6); c.lineTo(x0 + w * 0.42, y0 + h * 0.58); c.lineWidth = 0.35; c.strokeStyle = W_(0.4); c.stroke();
      strokeText(c, v ? 'NO 7' : 'NO 12', x0 + w * 0.66, y0 + h * 0.42, 2.6, C.pInk, 0.36, 'center');
      // width dimension below
      dimLine(c, x0, 1.2, x0 + w, 1.2, -1.2, String(w * 50), W_(0.55), 0.28, 2.2);
    }
  }
  function tankDraw(c) {
    const R = 8.5, T = -34, B = -9, ry = 2.2;
    for (const lx of [-6.5, -2, 2.5, 7]) tube(c, LINE([lx, B + 1, lx * 1.05, 0]), 1.2, C.pFill);
    con(c, LINE([-9, 0, 9, 0]), 0.3, W_(0.4));
    const body = (c2) => { c2.beginPath(); c2.moveTo(-R, T); c2.lineTo(-R, B); c2.ellipse(0, B, R, ry, 0, PI, 0, true); c2.lineTo(R, T); c2.ellipse(0, T, R, ry, 0, 0, PI, true); c2.closePath(); };
    pshp(c, body, { grad: { cx: 0, r: R, t0: 0.12, t1: 1.05, dt: 0.15, y0: T - 4, y1: B + 4, a: 0.5 } });
    pshp(c, ELL(0, T, R, ry), { fill: '#1d68a3', lw: 0.7 });
    pshp(c, (c2) => { c2.beginPath(); c2.moveTo(-3, T - 0.5); c2.ellipse(0, T - 0.5, 3, 3.2, 0, PI, 0); c2.closePath(); }, { fill: '#1d68a3', lw: 0.7 });
    if (PASS === 'main') {
      // ladder
      c.beginPath(); c.moveTo(-6.2, T + 1); c.lineTo(-6.2, B + 1); c.moveTo(-4.4, T + 1); c.lineTo(-4.4, B + 1);
      for (let y = T + 3; y < B; y += 2.4) { c.moveTo(-6.2, y); c.lineTo(-4.4, y); }
      c.lineWidth = 0.35; c.strokeStyle = C.pale; c.stroke();
      // level gauge
      c.beginPath(); c.moveTo(3.2, T + 4); c.lineTo(3.2, B - 3); c.lineWidth = 0.9; c.strokeStyle = C.dark; c.stroke();
      c.beginPath(); c.moveTo(3.2, T + 12); c.lineTo(3.2, B - 3); c.lineWidth = 0.6; c.strokeStyle = C.amber; c.stroke();
      strokeText(c, 'T-2', -0.6, T + 12, 2.6, C.pInk, 0.32, 'center');
      dimLine(c, R, 0, R, T - 3.2, -5.5, '4.6', W_(0.55), 0.28, 2.4);
    }
  }
  function lampDraw(c) {
    if (PASS === 'main') {
      // light cone, dashed
      c.setLineDash([1.6, 1.2]);
      c.beginPath(); c.moveTo(7.6, -43); c.lineTo(2.5, -6); c.moveTo(10.4, -43); c.lineTo(20, -6);
      c.lineWidth = 0.35; c.strokeStyle = A_(0.6); c.stroke();
      c.beginPath(); c.ellipse(11.2, -5, 9, 2, 0, 0, TAU); c.strokeStyle = A_(0.45); c.stroke();
      c.setLineDash([]);
    }
    pshp(c, POLY([-3.4, 0, 3.4, 0, 2.4, -2, -2.4, -2]), {});
    tube(c, LINE([0, -2, 0, -45, 2, -47.5, 7, -47.5]), 1.5, C.pFill);
    pshp(c, POLY([5.2, -48.6, 12.8, -48.6, 11.4, -44.4, 6.6, -44.4]), { hatch: { rect: [9, -50, 14, -43], sp: 0.9, a: 0.5 } });
    pshp(c, (c2) => { c2.beginPath(); c2.ellipse(9, -44.2, 2.2, 1.1, 0, 0, PI); c2.closePath(); }, { fill: C.amber, lw: 0.5 });
    con(c, LINE([-2.2, -2, -2.2, -30]), 0.3, W_(0.4), [2, 1.2]);
  }
  function towerDraw(c) {
    const lv = [0, -13, -25, -36, -46, -56, -64];
    const wAt = (y) => 10.5 - (-y / 64) * 7.8;
    if (PASS === 'back') {
      c.beginPath(); c.moveTo(-wAt(0), 0); c.lineTo(-wAt(-64), -64); c.lineTo(0, -71); c.lineTo(wAt(-64), -64); c.lineTo(wAt(0), 0);
      c.lineWidth = 2.6; c.strokeStyle = C.navy; c.stroke();
      c.beginPath(); c.moveTo(-13.5, -52); c.lineTo(13.5, -52); c.lineWidth = 3.4; c.stroke();
    }
    if (PASS === 'main') {
      c.beginPath();
      for (let i = 0; i < lv.length - 1; i++) {
        const y0 = lv[i], y1 = lv[i + 1], a0 = wAt(y0), a1 = wAt(y1);
        c.moveTo(-a0, y0); c.lineTo(a1, y1); c.moveTo(a0, y0); c.lineTo(-a1, y1);
        c.moveTo(-a1, y1); c.lineTo(a1, y1);
      }
      c.lineWidth = 0.45; c.strokeStyle = C.pale; c.stroke();
      c.beginPath(); c.moveTo(-wAt(0), 0); c.lineTo(-wAt(-64), -64); c.lineTo(0, -71); c.lineTo(wAt(-64), -64); c.lineTo(wAt(0), 0);
      c.lineWidth = 0.95; c.strokeStyle = C.pInk; c.stroke();
      // cross arm + insulators
      c.beginPath(); c.moveTo(-13.5, -52); c.lineTo(13.5, -52); c.moveTo(-13.5, -50.2); c.lineTo(13.5, -50.2);
      c.moveTo(-13.5, -52); c.lineTo(-13.5, -50.2); c.moveTo(13.5, -52); c.lineTo(13.5, -50.2);
      c.lineWidth = 0.7; c.strokeStyle = C.pInk; c.stroke();
      c.beginPath();
      for (const ix of [-12, 12]) { for (let k = 0; k < 3; k++) { c.moveTo(ix - 1, -49.6 + k * 1.3); c.lineTo(ix + 1, -49.6 + k * 1.3); } c.moveTo(ix, -50.2); c.lineTo(ix, -46); }
      c.lineWidth = 0.45; c.strokeStyle = C.pInk; c.stroke();
      c.beginPath(); c.arc(0, -71.5, 1.1, 0, TAU); c.fillStyle = C.amber; c.fill(); c.lineWidth = 0.4; c.strokeStyle = C.pInk; c.stroke();
      dimLine(c, 16, 0, 16, -71.5, -4, '71.5', W_(0.6), 0.3, 2.6);
      c.beginPath(); c.moveTo(-14, 0); c.lineTo(14, 0); c.lineWidth = 0.4; c.strokeStyle = W_(0.5); c.stroke();
    }
  }
  function theoDraw(c) {
    const hy = -21;
    for (const [fx, back] of [[1.8, true], [-7.5, false], [7.5, false]]) tube(c, LINE([0, hy + 1, fx, 0]), 1.15, back ? '#104d7e' : C.pFill);
    // plumb line
    con(c, LINE([0, hy + 2, 0, -1.6]), 0.3, A_(0.85), [1, 0.7]);
    con(c, POLY([-0.8, -2.6, 0.8, -2.6, 0, -0.6]), 0.3, A_(0.9));
    con(c, (c2) => { c2.beginPath(); centerMark(c2, 0, 0, 1.8, 1.5); }, 0.25, W_(0.7));
    pshp(c, RR(-3.4, hy - 1.6, 6.8, 2.6, 0.5), {});
    pshp(c, RR(-3.2, hy - 8.6, 6.4, 7.0, 1.0), { hatch: { rect: [1.2, hy - 10, 4, hy], sp: 0.9, a: 0.5 } });
    pshp(c, CIRC(0, hy - 5.2, 1.6), { fill: C.dark, lw: 0.5 });
    // telescope
    pshp(c, POLY([-5.6, hy - 11.4, 7.8, hy - 12.6, 8.0, hy - 9.6, -5.4, hy - 9.2]), { fill: '#1d68a3', lw: 0.7 });
    pshp(c, RR(7.6, hy - 13.4, 1.6, 4.6, 0.3), { lw: 0.5 });
    con(c, LINE([9.6, hy - 11, 15.5, hy - 11.3]), 0.3, W_(0.55), CHAIN);
    if (PASS === 'main') strokeText(c, 'STA 3', -3, -3.5, 2.2, C.pInk, 0.28, 'right');
  }
  function valveDraw(c) {
    const py = -7.5;
    // pipe (horizontal cylinder): graduated horizontal hatching to the bottom
    pshp(c, RR(-17, py - 3.2, 34, 6.4, 0.5), { hatch: { rect: [-18, py + 0.6, 18, py + 4], sp: 0.9, a: 0.5, ang: 0 } });
    for (const fx of [-9, 9]) pshp(c, RR(fx - 1.4, py - 4.8, 2.8, 9.6, 0.4), { fill: '#1d68a3', lw: 0.65 });
    con(c, LINE([-18.5, py, 18.5, py]), 0.28, W_(0.45), CHAIN);
    pshp(c, RR(-3.5, py - 5.4, 7, 8, 1.4), {});
    tube(c, LINE([0, py - 5.4, 0, -21]), 1.4, C.pFill);
    // hand wheel (seen from the front)
    pshp(c, CIRC(0, -23.4, 5.8), { fill: null, lw: 1.4 });
    if (PASS === 'main') {
      c.beginPath(); for (let i = 0; i < 4; i++) { const t = i * PI / 2 + 0.4; c.moveTo(0, -23.4); c.lineTo(Math.cos(t) * 5.4, -23.4 + Math.sin(t) * 5.4); }
      c.lineWidth = 0.55; c.strokeStyle = C.pInk; c.stroke();
      c.beginPath(); c.arc(0, -23.4, 1.2, 0, TAU); c.fillStyle = C.pFill; c.fill(); c.lineWidth = 0.5; c.stroke();
      // ground line under the pipe
      c.beginPath(); c.moveTo(-18, 0); c.lineTo(18, 0); c.lineWidth = 0.45; c.strokeStyle = W_(0.5); c.stroke();
      c.beginPath(); for (let x = -16; x <= 16; x += 2.4) { c.moveTo(x, 0.4); c.lineTo(x - 1.6, 2.4); } c.lineWidth = 0.3; c.strokeStyle = W_(0.35); c.stroke();
      strokeText(c, 'V-04', 9, -12.2, 2.2, C.pInk, 0.28, 'center');
    }
  }
  const PROP_FN = { tree: treeDraw, rock: rockDraw, crate: crateDraw, tank: tankDraw, lamp: lampDraw, tower: towerDraw, theodolite: theoDraw, valve: valveDraw };

  /* ---- collectibles, projectile, orbiting disc ---- */
  function nutDraw(c) {
    shp(c, (c2) => { c2.beginPath(); for (let i = 0; i < 6; i++) { const t = i * PI / 3 + PI / 6; if (i) c2.lineTo(Math.cos(t) * 2.9, Math.sin(t) * 2.9); else c2.moveTo(Math.cos(t) * 2.9, Math.sin(t) * 2.9); } c2.closePath(); },
      { fill: C.amber, lw: 0.6, halo: 1.8 });
    shp(c, CIRC(0, 0, 1.15), { fill: C.paper, lw: 0.45, noBack: true });
    con(c, LINE([-2.2, -1.1, -0.9, -2.0]), 0.3, 'rgba(255,255,255,0.85)');
  }
  function cogDraw(c) {
    shp(c, GEAR(0, 0, 3.4, 4.6, 8, 0), { fill: C.amber, lw: 0.65, halo: 1.9, hatch: { rect: [0.5, 0.5, 6, 6], box: [-5, -5, 5, 5], sp: 0.9, col: 'rgba(150,90,0,0.6)' } });
    shp(c, CIRC(0, 0, 1.4), { fill: C.paper, lw: 0.5, noBack: true });
    if (PASS === 'main') { c.beginPath(); centerMark(c, 0, 0, 4.6, 1.4); c.lineWidth = 0.25; c.strokeStyle = W_(0.8); c.stroke(); }
  }
  function arrowDraw(c) {
    shp(c, POLY([3.6, 0, -2.6, -1.9, -1.4, 0, -2.6, 1.9]), { fill: C.ink, lw: 0.35, halo: 1.7, col: C.ink });
  }
  function discDraw(c) {
    shp(c, CIRC(0, 0, 6), { fill: 'rgba(255,207,74,0.88)', lw: 0.7, halo: 2.0 });
    if (PASS === 'main') {
      c.beginPath();
      for (let i = 0; i < 24; i++) { const t = i / 24 * TAU, l = i % 6 === 0 ? 1.8 : i % 2 ? 0.7 : 1.1; c.moveTo(Math.cos(t) * 6, Math.sin(t) * 6); c.lineTo(Math.cos(t) * (6 - l), Math.sin(t) * (6 - l)); }
      c.lineWidth = 0.3; c.strokeStyle = 'rgba(90,50,0,0.85)'; c.stroke();
      c.beginPath(); c.arc(0, 0, 3.4, PI, TAU); c.lineWidth = 0.3; c.strokeStyle = 'rgba(90,50,0,0.6)'; c.stroke();
      c.beginPath(); c.moveTo(-3.4, 0); c.lineTo(3.4, 0); c.stroke();
      c.beginPath(); c.arc(0, 0, 1.1, 0, TAU); c.fillStyle = C.paper; c.fill(); c.lineWidth = 0.4; c.strokeStyle = C.ink; c.stroke();
      c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(-0.9) * 5.2, Math.sin(-0.9) * 5.2); c.lineWidth = 0.45; c.strokeStyle = C.red; c.stroke();
    }
  }

  /* ---- shadow: soft navy pool + ground line with hatch ticks (unit radius 10) ---- */
  function shadowSprite() {
    return bake([-12, -4, 12, 5], (c) => {
      const g = c.createRadialGradient(0, 0, 0, 0, 0, 10);
      g.addColorStop(0, 'rgba(3,22,42,0.55)'); g.addColorStop(0.7, 'rgba(3,22,42,0.4)'); g.addColorStop(1, 'rgba(3,22,42,0)');
      c.save(); c.scale(1, 0.36); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 10, 0, TAU); c.fill(); c.restore();
      c.beginPath(); c.moveTo(-10.5, 0); c.lineTo(10.5, 0); c.lineWidth = 0.5; c.strokeStyle = W_(0.45); c.stroke();
      c.beginPath(); for (let x = -8.4; x <= 8.5; x += 2.4) { c.moveTo(x + 0.4, 0.5); c.lineTo(x - 1.2, 2.6); } c.lineWidth = 0.35; c.strokeStyle = W_(0.3); c.stroke();
    }, true);
  }

  /* ---- floating numbers: a measurement callout (number on a shelf line with a leader) ---- */
  const numCache = new Map();
  function numSprite(v, crit) {
    const key = v + (crit ? 'c' : '');
    let s = numCache.get(key);
    if (s) return s;
    if (numCache.size > 400) numCache.clear();
    const str = String(v), h = crit ? 7.2 : 5.4, w = textWidth(str, h);
    const col = crit ? C.red : C.ink;
    s = bake([-w / 2 - 7, -h - 4, w / 2 + 4, 7], (c) => {
      const path = (c2) => {
        c2.beginPath();
        textPath(c2, str, 0, -0.6, h, 'center');
        c2.moveTo(-w / 2 - 1.4, 1.0); c2.lineTo(w / 2 + 1.4, 1.0);
        c2.moveTo(-w / 2 - 1.4, 1.0); c2.lineTo(-w / 2 - 4.4, 4.6);
      };
      const lw = crit ? 1.0 : 0.8;
      if (PASS === 'back') { path(c); c.lineWidth = lw + 2.4; c.strokeStyle = C.navy; c.stroke(); return; }
      path(c); c.lineWidth = lw; c.strokeStyle = col; c.stroke();
      c.beginPath(); c.arc(-w / 2 - 4.4, 4.6, 0.75, 0, TAU); c.fillStyle = col; c.fill();
      if (crit) { c.beginPath(); c.ellipse(0, -h / 2 - 0.6, w / 2 + 2.6, h / 2 + 2.2, -0.06, 0.3, TAU - 0.1); c.lineWidth = 0.6; c.strokeStyle = R_(0.9); c.stroke(); }
    });
    numCache.set(key, s);
    return s;
  }

  /* ================================================================ drawing */
  let TV = null;
  const TF = { S: 1, ox: 0, oy: 0 };
  function tf(view) {
    if (TV !== view) { TV = view; TF.S = view.S; TF.ox = view.W / 2 - view.x * view.S; TF.oy = view.H / 2 - view.y * view.S; }
    return TF;
  }
  function put(ctx, V, s, x, y, sx, sy, rot, flip) {
    const S = V.S, f = flip ? -1 : 1;
    const co = rot ? Math.cos(rot) : 1, si = rot ? Math.sin(rot) : 0;
    ctx.setTransform(co * S * sx * f, si * S * sx * f, -si * S * sy, co * S * sy, V.ox + x * S, V.oy + y * S);
    const k = 1 / s.k;
    ctx.drawImage(s.c, -s.ox * k, -s.oy * k, s.c.width * k, s.c.height * k);
    ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
  }
  /** Draw only a part of a sprite (fractions u0..u1 horizontally, v0..v1 vertically of the source canvas). */
  function putCrop(ctx, V, s, x, y, sc, flip, u0, u1, v0, v1) {
    const S = V.S, f = flip ? -1 : 1, w = s.c.width, h = s.c.height, k = sc / s.k;
    const sx = Math.max(0, Math.floor(u0 * w)), sw = Math.max(1, Math.ceil((u1 - u0) * w));
    const sy = Math.max(0, Math.floor(v0 * h)), sh = Math.max(1, Math.ceil((v1 - v0) * h));
    if (sx + sw > w || sy + sh > h) return;
    ctx.setTransform(S * f, 0, 0, S, V.ox + x * S, V.oy + y * S);
    ctx.drawImage(s.c, sx, sy, sw, sh, (sx - s.ox) * k, (sy - s.oy) * k, sw * k, sh * k);
    ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
  }

  /* ================================================================ ground */
  const GSTEP = 4;
  function fieldRaw(x, y) {
    return [
      U.perlin(x / 760, y / 760, 301) + 0.3 * U.perlin(x / 260, y / 260, 302),
      U.noise(x / 1700, y / 1700, 303) - 0.5,
      U.perlin(x / 980, y / 980, 401) + 0.18 * U.perlin(x / 330, y / 330, 402),
      U.noise(x / 2100, y / 2100, 403) - 0.47,
    ];
  }
  /** band of half width hw around the zero line of a field, cut by the region where the mask field is positive
      (signed-distance intersection -> constant width, crisp square ends). */
  const WHW = 15, RHW = 8;
  const bandV = (d, hw, md) => Math.max(Math.abs(d) - hw, -md);
  /** Site zones: low = an equipment yard (fenced by a property line), high = a grove (edged by a tree line). */
  const zoneAt = (x, y) => U.fbm(x / 520 + 13.1, y / 520 - 4.7, 909, 2)
    // the first view of the sheet is composed: a grove to the right of the start, an equipment yard down-left
    + 0.36 * Math.exp(-((x - 250) ** 2 + (y + 60) ** 2) / (115 * 115)) - 0.34 * Math.exp(-((x + 250) ** 2 + (y - 150) ** 2) / (120 * 120));
  const YARD = 0.37, GROVE = 0.61;
  /** water value (negative = inside water), road value (negative = on the road) at a point. */
  function fieldsAt(x, y) {
    const e = GSTEP;
    const c0 = fieldRaw(x, y), xp = fieldRaw(x + e, y), xm = fieldRaw(x - e, y), yp = fieldRaw(x, y + e), ym = fieldRaw(x, y - e);
    const g = (k) => Math.hypot((xp[k] - xm[k]) / (2 * e), (yp[k] - ym[k]) / (2 * e)) || 1e-6;
    return { w: bandV(c0[0] / g(0), WHW, c0[1] / g(1)), r: bandV(c0[2] / g(2), RHW, c0[3] / g(3)) };
  }
  /** Marching squares over a lattice. vals[j*n+i]; calls seg(x1,y1,x2,y2,i,j) in world units. */
  function contour(vals, n, x0, y0, step, level, seg) {
    for (let j = 0; j < n - 1; j++) {
      for (let i = 0; i < n - 1; i++) {
        const o = j * n + i;
        const a = vals[o] - level, b = vals[o + 1] - level, d = vals[o + n + 1] - level, cc = vals[o + n] - level;
        let m = 0;
        if (a > 0) m |= 1; if (b > 0) m |= 2; if (d > 0) m |= 4; if (cc > 0) m |= 8;
        if (m === 0 || m === 15) continue;
        const X = x0 + i * step, Y = y0 + j * step;
        const top = () => [X + step * (a / (a - b)), Y];
        const right = () => [X + step, Y + step * (b / (b - d))];
        const bottom = () => [X + step * (cc / (cc - d)), Y + step];
        const left = () => [X, Y + step * (a / (a - cc))];
        const E = (p, q) => seg(p[0], p[1], q[0], q[1], i, j);
        switch (m) {
          case 1: case 14: E(top(), left()); break;
          case 2: case 13: E(top(), right()); break;
          case 3: case 12: E(left(), right()); break;
          case 4: case 11: E(right(), bottom()); break;
          case 6: case 9: E(top(), bottom()); break;
          case 7: case 8: E(left(), bottom()); break;
          case 5: E(top(), left()); E(right(), bottom()); break;
          case 10: E(top(), right()); E(left(), bottom()); break;
        }
      }
    }
  }
  let GRAIN = null;
  function grainTile() {
    const N = 256;
    const { c, ctx } = U.canvas(N, N);
    const img = ctx.createImageData(N, N), d = img.data;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const o = (y * N + x) * 4;
        const h = U.hash2(x, y, 77), f = U.fbmTile(x / 32, y / 32, 8, 5, 3);
        if (h < 0.06) { d[o] = 230; d[o + 1] = 246; d[o + 2] = 255; d[o + 3] = 10 + h * 260; }
        else if (h > 0.93) { d[o] = 2; d[o + 1] = 26; d[o + 2] = 52; d[o + 3] = 14 + (h - 0.93) * 300; }
        else { const v = (f - 0.5) * 2; if (v > 0) { d[o] = 220; d[o + 1] = 242; d[o + 2] = 255; d[o + 3] = v * 14; } else { d[o] = 2; d[o + 1] = 24; d[o + 2] = 50; d[o + 3] = -v * 20; } }
      }
    }
    ctx.putImageData(img, 0, 0);
    // paper fibres
    ctx.lineCap = 'round';
    U.tileDraw(ctx, N, N, (c2, ox, oy) => {
      const rr = U.rng(909);
      for (let i = 0; i < 70; i++) {
        const x = rr.range(0, N) + ox, y = rr.range(0, N) + oy, a = rr.range(0, TAU), l = rr.range(4, 14), bend = rr.range(-3, 3);
        c2.beginPath(); c2.moveTo(x, y); c2.quadraticCurveTo(x + Math.cos(a) * l / 2 - Math.sin(a) * bend, y + Math.sin(a) * l / 2 + Math.cos(a) * bend, x + Math.cos(a) * l, y + Math.sin(a) * l);
        c2.lineWidth = rr.range(0.5, 1.1); c2.strokeStyle = i % 3 ? 'rgba(220,242,255,0.07)' : 'rgba(0,20,45,0.08)'; c2.stroke();
      }
    });
    return c;
  }

  /* ---- big drawings on the sheet ---- */
  const ROOMS = ['STORE', 'LAB', 'OFFICE', 'PLANT', 'WORKSHOP', 'ARCHIVE', 'HALL', 'STUDIO', 'ENTRY', 'DEPOT'];
  function drawPlan(c, cx, cy, rng, A) {
    const W = Math.round(rng.range(130, 220) / 4) * 4, H = Math.round(rng.range(96, 150) / 4) * 4, t = 4;
    const x0 = cx - W / 2, y0 = cy - H / 2;
    const walls = [], doors = [], wins = [];
    // horizontal/vertical wall run with openings
    const run = (hz, fx, fy, len, th, ops, inward) => {
      let pos = 0;
      ops.sort((p, q) => p.u - q.u);
      const piece = (s0, s1) => { if (s1 - s0 > 0.5) walls.push(hz ? [fx + s0, fy, s1 - s0, th] : [fx, fy + s0, th, s1 - s0]); };
      for (const o of ops) {
        const s = o.u - o.w / 2, e = o.u + o.w / 2;
        if (s < pos + 3 || e > len - 3) continue;
        piece(pos, s); pos = e;
        const g = hz ? { x: fx + s, y: fy, w: o.w, h: th, hz, inward } : { x: fx, y: fy + s, w: th, h: o.w, hz, inward };
        (o.door ? doors : wins).push(g);
      }
      piece(pos, len);
    };
    const ops = (len, n) => { const a = []; for (let i = 0; i < n; i++) { const door = rng.chance(0.3); a.push({ u: rng.range(0.2, 0.8) * len, w: door ? 9 : rng.range(14, 22), door }); } return a; };
    run(true, x0, y0, W, t, ops(W, rng.int(1, 2)), 1);
    run(true, x0, y0 + H - t, W, t, [{ u: W * rng.range(0.25, 0.75), w: 10, door: true }, ...ops(W, 1)], -1);
    run(false, x0, y0 + t, H - 2 * t, t, ops(H - 2 * t, rng.int(0, 1)), 1);
    run(false, x0 + W - t, y0 + t, H - 2 * t, t, ops(H - 2 * t, rng.int(0, 1)), -1);
    const xs = Math.round((x0 + W * rng.range(0.36, 0.62)) / 2) * 2;
    run(false, xs, y0 + t, H - 2 * t, 2.4, [{ u: (H - 2 * t) * rng.range(0.25, 0.75), w: 9, door: true }], 1);
    let ys = null;
    if (rng.chance(0.6)) {
      ys = Math.round((y0 + H * rng.range(0.4, 0.6)) / 2) * 2;
      run(true, x0 + t, ys, xs - x0 - t, 2.4, [{ u: (xs - x0 - t) * 0.5, w: 9, door: true }], 1);
    }
    // wall hatch + outlines
    c.save(); c.beginPath(); for (const w of walls) c.rect(w[0], w[1], w[2], w[3]); c.clip();
    c.beginPath(); hatchLines(c, x0 - 2, y0 - 2, x0 + W + 2, y0 + H + 2, -PI / 4, 1.5); c.lineWidth = 0.32; c.strokeStyle = W_(0.3 * A); c.stroke();
    c.restore();
    c.beginPath(); for (const w of walls) c.rect(w[0], w[1], w[2], w[3]); c.lineWidth = 0.5; c.strokeStyle = W_(0.55 * A); c.stroke();
    // windows: glass lines + jambs
    c.beginPath();
    for (const g of wins) {
      if (g.hz) { for (const f of [0.35, 0.65]) { c.moveTo(g.x, g.y + g.h * f); c.lineTo(g.x + g.w, g.y + g.h * f); } c.moveTo(g.x, g.y); c.lineTo(g.x, g.y + g.h); c.moveTo(g.x + g.w, g.y); c.lineTo(g.x + g.w, g.y + g.h); }
      else { for (const f of [0.35, 0.65]) { c.moveTo(g.x + g.w * f, g.y); c.lineTo(g.x + g.w * f, g.y + g.h); } c.moveTo(g.x, g.y); c.lineTo(g.x + g.w, g.y); c.moveTo(g.x, g.y + g.h); c.lineTo(g.x + g.w, g.y + g.h); }
    }
    c.lineWidth = 0.38; c.strokeStyle = W_(0.5 * A); c.stroke();
    // doors: leaf + swing arc
    c.beginPath();
    for (const g of doors) {
      if (g.hz) { const hx = g.x, hy = g.inward > 0 ? g.y + g.h : g.y, L = g.w; c.moveTo(hx, hy); c.lineTo(hx, hy + L * g.inward); c.moveTo(hx + L, hy); c.arc(hx, hy, L, 0, (g.inward > 0 ? 1 : -1) * PI / 2, g.inward < 0); }
      else { const hx = g.inward > 0 ? g.x + g.w : g.x, hy = g.y, L = g.h; c.moveTo(hx, hy); c.lineTo(hx + L * g.inward, hy); c.moveTo(hx, hy + L); c.arc(hx, hy, L, PI / 2, g.inward > 0 ? 0 : PI, g.inward > 0); }
    }
    c.lineWidth = 0.35; c.strokeStyle = W_(0.45 * A); c.stroke();
    // column grid
    if (rng.chance(0.65)) {
      c.setLineDash(CHAIN);
      c.beginPath(); for (const gx of [x0 + t / 2, xs + 1.2, x0 + W - t / 2]) { c.moveTo(gx, y0 - 30); c.lineTo(gx, y0 + H + 10); }
      c.lineWidth = 0.3; c.strokeStyle = W_(0.3 * A); c.stroke(); c.setLineDash([]);
      ['A', 'B', 'C'].forEach((L, i) => {
        const gx = [x0 + t / 2, xs + 1.2, x0 + W - t / 2][i];
        c.beginPath(); c.arc(gx, y0 - 34.5, 4.5, 0, TAU); c.lineWidth = 0.45; c.strokeStyle = W_(0.5 * A); c.stroke();
        strokeText(c, L, gx, y0 - 32.6, 3.8, W_(0.6 * A), 0.42, 'center');
      });
    }
    // dimensions
    dimLine(c, x0, y0, x0 + W, y0, 14, String(W * 25), W_(0.5 * A), 0.35, 4);
    dimLine(c, x0, y0 + H, x0, y0, 12, String(H * 25), W_(0.5 * A), 0.35, 4);
    dimLine(c, x0, y0 + H, xs + 1.2, y0 + H, -10, String(Math.round(xs + 1.2 - x0) * 25), W_(0.42 * A), 0.3, 3.4);
    // room labels
    const rooms = ys ? [[(x0 + xs) / 2, (y0 + ys) / 2, xs - x0, ys - y0], [(x0 + xs) / 2, (ys + y0 + H) / 2, xs - x0, y0 + H - ys], [(xs + x0 + W) / 2, cy, x0 + W - xs, H]]
      : [[(x0 + xs) / 2, cy, xs - x0, H], [(xs + x0 + W) / 2, cy, x0 + W - xs, H]];
    for (const [rx, ry, rw, rh] of rooms) {
      const name = ROOMS[rng.int(0, ROOMS.length - 1)] + ' ' + String(rng.int(1, 24)).padStart(2, '0');
      strokeText(c, name, rx, ry, 4.2, W_(0.55 * A), 0.45, 'center');
      strokeText(c, (rw * rh * 0.000625).toFixed(1) + ' M²', rx, ry + 6, 2.8, W_(0.42 * A), 0.32, 'center');
    }
  }
  function drawGearDwg(c, cx, cy, rng, A) {
    const R = rng.range(44, 66), n = rng.int(18, 30), r0 = R - 6, rot = rng.range(0, TAU);
    c.beginPath(); gearPts(c, cx, cy, r0, R, n, rot); c.lineWidth = 0.55; c.strokeStyle = W_(0.55 * A); c.stroke();
    c.setLineDash(CHAIN);
    c.beginPath(); c.arc(cx, cy, R - 3, 0, TAU); c.arc(cx, cy, R * 0.6, 0, TAU);
    c.moveTo(cx - R - 14, cy); c.lineTo(cx + R + 14, cy); c.moveTo(cx, cy - R - 14); c.lineTo(cx, cy + R + 14);
    c.lineWidth = 0.3; c.strokeStyle = W_(0.38 * A); c.stroke(); c.setLineDash([]);
    c.beginPath(); c.arc(cx, cy, R * 0.34, 0, TAU); c.moveTo(cx + R * 0.15, cy); c.arc(cx, cy, R * 0.15, 0, TAU);
    c.lineWidth = 0.5; c.strokeStyle = W_(0.55 * A); c.stroke();
    // keyway
    c.beginPath(); c.rect(cx - 2, cy - R * 0.15 - 2.6, 4, 3); c.lineWidth = 0.4; c.stroke();
    const holes = rng.int(4, 6);
    c.beginPath();
    for (let i = 0; i < holes; i++) { const t = i / holes * TAU + PI / holes; const hx = cx + Math.cos(t) * R * 0.6, hy = cy + Math.sin(t) * R * 0.6, hr = R * 0.075; c.moveTo(hx + hr, hy); c.arc(hx, hy, hr, 0, TAU); }
    c.lineWidth = 0.45; c.stroke();
    c.beginPath(); for (let i = 0; i < holes; i++) { const t = i / holes * TAU + PI / holes; centerMark(c, cx + Math.cos(t) * R * 0.6, cy + Math.sin(t) * R * 0.6, R * 0.075, 1.4); }
    c.lineWidth = 0.25; c.strokeStyle = W_(0.4 * A); c.stroke();
    // diameter dimension through the center
    const da = rng.range(-0.9, -0.4);
    dimLine(c, cx - Math.cos(da) * R, cy - Math.sin(da) * R, cx + Math.cos(da) * R, cy + Math.sin(da) * R, 0, 'Ø' + Math.round(R * 2 * 1.5), W_(0.5 * A), 0.32, 4);
    strokeText(c, 'DETAIL ' + 'CDEFG'[rng.int(0, 4)] + '  SCALE 2:1', cx, cy + R + 24, 3.6, W_(0.5 * A), 0.4, 'center');
    c.beginPath(); const tw = textWidth('DETAIL C  SCALE 2:1', 3.6); c.moveTo(cx - tw / 2, cy + R + 26); c.lineTo(cx + tw / 2, cy + R + 26); c.lineWidth = 0.35; c.strokeStyle = W_(0.4 * A); c.stroke();
  }
  function drawSection(c, cx, cy, rng, A) {
    const s = rng.range(0.9, 1.3);
    const p = rng.chance(0.5)
      ? [-40, -30, -18, -30, -18, 14, 40, 14, 40, 30, -40, 30]
      : [-36, -30, 36, -30, 36, -18, 8, -18, 8, 30, -8, 30, -8, -18, -36, -18];
    const pts = p.map((v, i) => (i % 2 ? cy + v * s : cx + v * s));
    const hr = 7 * s, hx = cx - (p.length === 12 ? 29 : -22) * s, hy = cy + (p.length === 12 ? 22 : -24) * s;
    const shape = () => { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); c.moveTo(hx + hr, hy); c.arc(hx, hy, hr, 0, TAU, true); };
    c.save(); shape(); c.clip('evenodd');
    c.beginPath(); hatchLines(c, cx - 50 * s, cy - 40 * s, cx + 50 * s, cy + 40 * s, -PI / 4, 2.2); c.lineWidth = 0.32; c.strokeStyle = W_(0.32 * A); c.stroke();
    c.restore();
    shape(); c.lineWidth = 0.6; c.strokeStyle = W_(0.55 * A); c.stroke();
    c.setLineDash(CHAIN); c.beginPath(); c.moveTo(hx - hr - 8, hy); c.lineTo(hx + hr + 8, hy); c.moveTo(hx, hy - hr - 8); c.lineTo(hx, hy + hr + 8);
    c.lineWidth = 0.3; c.strokeStyle = W_(0.4 * A); c.stroke(); c.setLineDash([]);
    const L = 'ABCD'[rng.int(0, 3)];
    strokeText(c, 'SECTION ' + L + '-' + L, cx, cy + 46 * s, 4, W_(0.55 * A), 0.45, 'center');
    const tw = textWidth('SECTION A-A', 4);
    c.beginPath(); c.moveTo(cx - tw / 2, cy + 48.4 * s); c.lineTo(cx + tw / 2, cy + 48.4 * s); c.moveTo(cx - tw / 2, cy + 49.6 * s); c.lineTo(cx + tw / 2, cy + 49.6 * s);
    c.lineWidth = 0.3; c.strokeStyle = W_(0.45 * A); c.stroke();
    dimLine(c, pts[0], pts[1], pts[2], pts[3], 9, String(Math.round(Math.hypot(pts[2] - pts[0], pts[3] - pts[1]) * 10)), W_(0.45 * A), 0.3, 3.2);
  }
  function drawNorth(c, cx, cy, rng, A) {
    c.beginPath(); c.arc(cx, cy, 15, 0, TAU); c.lineWidth = 0.5; c.strokeStyle = W_(0.5 * A); c.stroke();
    c.beginPath(); c.arc(cx, cy, 12.5, 0, TAU); c.lineWidth = 0.3; c.stroke();
    c.beginPath(); c.moveTo(cx, cy - 13); c.lineTo(cx + 4.5, cy + 9); c.lineTo(cx, cy + 5); c.closePath(); c.fillStyle = W_(0.42 * A); c.fill();
    c.beginPath(); c.moveTo(cx, cy - 13); c.lineTo(cx - 4.5, cy + 9); c.lineTo(cx, cy + 5); c.closePath(); c.lineWidth = 0.4; c.stroke();
    strokeText(c, 'N', cx, cy - 18, 5, W_(0.6 * A), 0.5, 'center');
    // scale bar
    const bx = cx + 30, by = cy + 6;
    for (let i = 0; i < 4; i++) { c.beginPath(); c.rect(bx + i * 14, by, 14, 3); if (i % 2 === 0) { c.fillStyle = W_(0.35 * A); c.fill(); } c.lineWidth = 0.35; c.strokeStyle = W_(0.5 * A); c.stroke(); }
    ['0', '5', '10', '15', '20 M'].forEach((s, i) => strokeText(c, s, bx + i * 14, by - 2, 2.8, W_(0.5 * A), 0.32, i === 4 ? 'left' : 'center'));
    strokeText(c, 'SCALE 1:200', bx, by + 9, 3, W_(0.45 * A), 0.32, 'left');
  }
  function drawBubble(c, cx, cy, rng, A) {
    const tx = cx + rng.range(-60, 60), ty = cy + rng.range(-50, 50);
    c.setLineDash([3, 1.6]); c.beginPath(); c.arc(tx, ty, 18, 0, TAU); c.lineWidth = 0.4; c.strokeStyle = W_(0.4 * A); c.stroke(); c.setLineDash([]);
    const ang = Math.atan2(cy - ty, cx - tx);
    c.beginPath(); c.moveTo(tx + Math.cos(ang) * 18, ty + Math.sin(ang) * 18); c.lineTo(cx - Math.cos(ang) * 10, cy - Math.sin(ang) * 10); c.lineWidth = 0.4; c.stroke();
    c.beginPath(); c.arc(cx, cy, 10, 0, TAU); c.moveTo(cx - 10, cy); c.lineTo(cx + 10, cy); c.lineWidth = 0.55; c.strokeStyle = W_(0.55 * A); c.stroke();
    strokeText(c, String(rng.int(1, 9)), cx, cy - 2, 5, W_(0.65 * A), 0.5, 'center');
    strokeText(c, 'A-' + String(rng.int(1, 12)).padStart(2, '0'), cx, cy + 6.6, 3.4, W_(0.55 * A), 0.4, 'center');
  }
  /** Mid-size details: plates with hole patterns, bolts, angle measures, iso boxes, radius callouts, dimension chains. */
  function drawPart(c, x, y, rng) {
    const k = rng.int(0, 5), A = rng.range(0.75, 1);
    const L = (a) => W_(a * A);
    c.lineCap = 'round';
    if (k === 0) { // plate with a hole pattern
      const w = rng.range(34, 52), h = rng.range(20, 30), x0 = x - w / 2, y0 = y - h / 2, hr = rng.range(1.6, 2.6);
      c.beginPath(); rrect(c, x0, y0, w, h, 2.5); c.lineWidth = 0.5; c.strokeStyle = L(0.5); c.stroke();
      const hx = [x0 + 6, x0 + w - 6], hy = [y0 + 6, y0 + h - 6];
      c.beginPath(); for (const a of hx) for (const b of hy) { c.moveTo(a + hr, b); c.arc(a, b, hr, 0, TAU); } c.lineWidth = 0.42; c.stroke();
      c.beginPath(); for (const a of hx) for (const b of hy) centerMark(c, a, b, hr, 1.4); c.lineWidth = 0.25; c.strokeStyle = L(0.4); c.stroke();
      dimLine(c, hx[0], y0, hx[1], y0, 6, String(Math.round((hx[1] - hx[0]) * 10)), L(0.45), 0.28, 3);
      strokeText(c, '4X \u00d8' + (hr * 2).toFixed(1), x0 + w + 3, y0 + h + 5, 2.8, L(0.45), 0.3, 'left');
      c.beginPath(); c.moveTo(hx[1] + hr * 0.7, hy[1] + hr * 0.7); c.lineTo(x0 + w + 2.4, y0 + h + 3.6); c.lineWidth = 0.3; c.strokeStyle = L(0.4); c.stroke();
    } else if (k === 1) { // bolt in elevation
      const l = rng.range(26, 40), hw = 5, a = rng.chance(0.5) ? 0 : PI / 2;
      c.save(); c.translate(x, y); c.rotate(a);
      c.beginPath(); c.rect(-l / 2 - 5, -hw, 5, hw * 2); c.moveTo(-l / 2 - 5, -hw * 0.5); c.lineTo(-l / 2, -hw * 0.5); c.moveTo(-l / 2 - 5, hw * 0.5); c.lineTo(-l / 2, hw * 0.5);
      c.rect(-l / 2, -2.6, l, 5.2); c.lineWidth = 0.45; c.strokeStyle = L(0.5); c.stroke();
      c.beginPath(); for (let t = -l / 2 + l * 0.35; t < l / 2 - 0.5; t += 1.3) { c.moveTo(t, -2.6); c.lineTo(t + 0.65, 2.6); } c.lineWidth = 0.25; c.strokeStyle = L(0.35); c.stroke();
      c.setLineDash(CHAIN); c.beginPath(); c.moveTo(-l / 2 - 9, 0); c.lineTo(l / 2 + 4, 0); c.lineWidth = 0.25; c.stroke(); c.setLineDash([]);
      dimLine(c, -l / 2, 2.6, l / 2, 2.6, -6, 'M5X' + Math.round(l), L(0.45), 0.28, 2.8);
      c.restore();
    } else if (k === 2) { // angle measure
      const a0 = rng.range(-PI, PI), da = [PI / 6, PI / 4, PI / 3, PI / 2][rng.int(0, 3)], r = rng.range(16, 26);
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a0) * r * 1.6, y + Math.sin(a0) * r * 1.6); c.moveTo(x, y); c.lineTo(x + Math.cos(a0 + da) * r * 1.6, y + Math.sin(a0 + da) * r * 1.6);
      c.lineWidth = 0.4; c.strokeStyle = L(0.42); c.stroke();
      c.beginPath(); c.arc(x, y, r, a0, a0 + da); c.lineWidth = 0.3; c.stroke();
      c.beginPath(); arrowHead(c, x + Math.cos(a0 + da) * r, y + Math.sin(a0 + da) * r, a0 + da + PI / 2, 2.2, 0.7); arrowHead(c, x + Math.cos(a0) * r, y + Math.sin(a0) * r, a0 - PI / 2, 2.2, 0.7); c.fillStyle = L(0.42); c.fill();
      const am = a0 + da / 2;
      strokeText(c, Math.round(da * 180 / PI) + '\u00b0', x + Math.cos(am) * (r + 5), y + Math.sin(am) * (r + 5) + 1.4, 3, L(0.5), 0.3, 'center');
    } else if (k === 3) { // isometric box with hidden edges
      const a = rng.range(10, 16), b = rng.range(8, 14), h = rng.range(8, 14), cx = Math.cos(PI / 6), sy = 0.5;
      const P0 = (u, v, w) => [x + (u - v) * cx, y + (u + v) * sy - w];
      const line = (p, q) => { c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); };
      c.beginPath();
      line(P0(0, 0, h), P0(a, 0, h)); line(P0(a, 0, h), P0(a, b, h)); line(P0(a, b, h), P0(0, b, h)); line(P0(0, b, h), P0(0, 0, h));
      line(P0(a, 0, h), P0(a, 0, 0)); line(P0(a, b, h), P0(a, b, 0)); line(P0(0, b, h), P0(0, b, 0));
      line(P0(a, 0, 0), P0(a, b, 0)); line(P0(a, b, 0), P0(0, b, 0));
      c.lineWidth = 0.45; c.strokeStyle = L(0.5); c.stroke();
      c.setLineDash([1.4, 1.1]); c.beginPath(); line(P0(0, 0, h), P0(0, 0, 0)); line(P0(0, 0, 0), P0(a, 0, 0)); line(P0(0, 0, 0), P0(0, b, 0));
      c.lineWidth = 0.3; c.strokeStyle = L(0.35); c.stroke(); c.setLineDash([]);
    } else if (k === 4) { // circle with radius callout
      const r = rng.range(8, 16);
      c.beginPath(); c.arc(x, y, r, 0, TAU); c.lineWidth = 0.45; c.strokeStyle = L(0.48); c.stroke();
      c.beginPath(); centerMark(c, x, y, r, 3); c.lineWidth = 0.25; c.strokeStyle = L(0.4); c.stroke();
      const a = rng.range(-2.6, -0.5), ex = x + Math.cos(a) * r, ey = y + Math.sin(a) * r, rt = Math.cos(a) > 0;
      c.beginPath(); c.moveTo(x, y); c.lineTo(ex, ey); c.lineTo(ex + Math.cos(a) * 8, ey + Math.sin(a) * 8); c.lineTo(ex + Math.cos(a) * 8 + (rt ? 6 : -6), ey + Math.sin(a) * 8);
      c.lineWidth = 0.3; c.stroke();
      c.beginPath(); arrowHead(c, ex, ey, a, 2.4, 0.8); c.fillStyle = L(0.45); c.fill();
      strokeText(c, 'R' + Math.round(r * 2), ex + Math.cos(a) * 8 + (rt ? 1 : -1), ey + Math.sin(a) * 8 - 1, 3, L(0.5), 0.3, rt ? 'left' : 'right');
    } else { // dimension chain along a baseline
      const n = rng.int(3, 4), a = rng.chance(0.5) ? 0 : PI / 2;
      let px = -rng.range(30, 40);
      const pts = [px]; for (let i = 0; i < n; i++) { px += rng.range(14, 26); pts.push(px); }
      c.save(); c.translate(x, y); c.rotate(a);
      c.beginPath(); c.moveTo(pts[0] - 4, 0); c.lineTo(pts[n] + 4, 0); c.lineWidth = 0.45; c.strokeStyle = L(0.45); c.stroke();
      for (let i = 0; i < n; i++) dimLine(c, pts[i], 0, pts[i + 1], 0, 7, String(Math.round((pts[i + 1] - pts[i]) * 25)), L(0.42), 0.28, 2.8);
      c.restore();
    }
  }
  const NOTES = ['CHECK CLEARANCE', 'VERIFY ON SITE', 'SEE DETAIL 3', 'TYP.', 'N.T.S.', 'APPROX. 2.4 M', 'MATCH LINE', 'KEEP CLEAR', 'HOLD', 'FIELD VERIFY', 'REVISED', 'OK', 'ALIGN', 'TBC', 'MIN. 600', 'SLOPE 1:12'];
  function drawNote(c, x, y, rng, red) {
    const s = NOTES[rng.int(0, NOTES.length - 1)], h = rng.range(3.4, 4.6);
    const col = red ? R_(0.62) : W_(0.42);
    c.save(); c.translate(x, y); c.rotate(rng.range(-0.12, 0.06));
    strokeText(c, s, 0, 0, h, col, 0.42, 'left', true, 0.35, rng.int(1, 999));
    if (rng.chance(0.6)) {
      const ex = rng.range(-26, -12), ey = rng.range(6, 18);
      c.beginPath(); c.moveTo(-2, -h * 0.4); c.quadraticCurveTo(ex * 0.6, -h * 0.4, ex, ey);
      c.lineWidth = 0.4; c.strokeStyle = col; c.stroke();
      const an = Math.atan2(ey + h * 0.4, ex - ex * 0.6);
      c.beginPath(); arrowHead(c, ex, ey, an, 2.4, 0.8); c.fillStyle = col; c.fill();
    }
    c.restore();
  }
  function drawRevCloud(c, x, y, rng) {
    const rx = rng.range(20, 34), ry = rng.range(12, 22), n = Math.round((rx + ry) * 0.42);
    c.beginPath();
    for (let i = 0; i < n; i++) {
      const t0 = i / n * TAU, t1 = (i + 1) / n * TAU, tm = (t0 + t1) / 2;
      const ax = x + Math.cos(t0) * rx, ay = y + Math.sin(t0) * ry, bx = x + Math.cos(t1) * rx, by = y + Math.sin(t1) * ry;
      const mx = x + Math.cos(tm) * rx * 1.18, my = y + Math.sin(tm) * ry * 1.18;
      if (!i) c.moveTo(ax, ay);
      c.quadraticCurveTo(mx, my, bx, by);
    }
    c.lineWidth = 0.6; c.strokeStyle = R_(0.55); c.stroke();
    const tx = x + rx * 0.9, ty = y - ry - 2;
    c.beginPath(); c.moveTo(tx, ty - 5); c.lineTo(tx + 4.4, ty + 2.6); c.lineTo(tx - 4.4, ty + 2.6); c.closePath(); c.lineWidth = 0.55; c.stroke();
    strokeText(c, 'BCDE'[rng.int(0, 3)], tx, ty + 1.8, 3.4, R_(0.7), 0.45, 'center');
  }
  function drawRedMark(c, x, y, rng) {
    const k = rng.int(0, 2);
    c.strokeStyle = R_(0.55); c.lineWidth = 0.65;
    if (k === 0) { // circled question
      c.beginPath(); c.ellipse(x, y, 11, 8, rng.range(-0.3, 0.3), 0.4, TAU + 0.1); c.stroke();
      strokeText(c, '?', x + 13, y - 6, 5, R_(0.65), 0.55, 'center', true, 0.3, 7);
    } else if (k === 1) { // check mark + OK
      c.beginPath(); c.moveTo(x - 5, y); c.lineTo(x - 1.6, y + 4); c.lineTo(x + 7, y - 6); c.stroke();
      strokeText(c, 'OK', x + 10, y + 1, 3.6, R_(0.6), 0.45, 'left', true, 0.3, 9);
    } else { // strike-through and arrow
      c.beginPath(); c.moveTo(x - 16, y + 2); c.lineTo(x + 16, y - 3); c.moveTo(x - 16, y + 4); c.lineTo(x + 16, y - 1); c.stroke();
      c.beginPath(); c.moveTo(x + 18, y - 2); c.quadraticCurveTo(x + 28, y - 10, x + 26, y - 20); c.stroke();
      c.beginPath(); arrowHead(c, x + 26, y - 20, -PI / 2 - 0.2, 3, 1); c.fillStyle = R_(0.55); c.fill();
    }
  }
  function drawCoffee(c, x, y, rng) {
    const r = rng.range(20, 32), sd = rng.int(1, 999);
    const ring = (rr, a, lw, start, end) => {
      c.beginPath();
      for (let i = 0; i <= 64; i++) {
        const t = start + (end - start) * i / 64;
        const q = rr * (1 + 0.05 * U.perlin(Math.cos(t) * 2 + sd, Math.sin(t) * 2, 5) + 0.02 * Math.sin(t * 7 + sd));
        const px = x + Math.cos(t) * q, py = y + Math.sin(t) * q;
        if (i) c.lineTo(px, py); else c.moveTo(px, py);
      }
      c.lineWidth = lw; c.strokeStyle = 'rgba(196,160,96,' + a + ')'; c.stroke();
    };
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = 'rgba(196,160,96,0.07)'; c.fill();
    ring(r, 0.34, 2.0, 0, TAU);
    ring(r - 1.6, 0.16, 0.8, 0.3, TAU - 0.6);
    const s = rng.range(0, TAU);
    ring(r * 0.95, 0.22, 1.3, s, s + rng.range(1.5, 3));
    if (rng.chance(0.6)) { const t = rng.range(0, TAU), d = r + rng.range(6, 14); c.beginPath(); c.arc(x + Math.cos(t) * d, y + Math.sin(t) * d, rng.range(1.2, 2.6), 0, TAU); c.fillStyle = 'rgba(196,160,96,0.26)'; c.fill(); }
  }
  function drawSmudge(c, x, y, rng) {
    const rx = rng.range(26, 50), ry = rx * rng.range(0.4, 0.7), a = rng.range(0, PI);
    c.save(); c.translate(x, y); c.rotate(a); c.scale(1, ry / rx);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, 'rgba(160,212,245,0.075)'); g.addColorStop(0.6, 'rgba(160,212,245,0.045)'); g.addColorStop(1, 'rgba(160,212,245,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill();
    c.restore();
    // ghost of an erased line
    c.beginPath(); c.moveTo(x - rx * 0.7, y + rng.range(-6, 6)); c.lineTo(x + rx * 0.7, y + rng.range(-6, 6));
    c.lineWidth = 0.5; c.strokeStyle = W_(0.07); c.stroke();
  }
  function drawSpot(c, x, y, rng) {
    c.beginPath(); c.moveTo(x - 1.6, y); c.lineTo(x + 1.6, y); c.moveTo(x, y - 1.6); c.lineTo(x, y + 1.6);
    c.lineWidth = 0.4; c.strokeStyle = W_(0.42); c.stroke();
    strokeText(c, '+' + (rng.range(2, 40)).toFixed(2), x + 2.4, y - 1.2, 2.8, W_(0.36), 0.3, 'left');
  }

  /* ================================================================ HUD CSS */
  const LN = '#dff3ff', NV = 'rgba(6,42,74,.84)';
  const GRIDBG = 'linear-gradient(rgba(200,235,255,.07) 1px, transparent 1px) 0 0 / 12px 12px, linear-gradient(90deg, rgba(200,235,255,.07) 1px, transparent 1px) 0 0 / 12px 12px';
  const CSS = `
body.style-blueprint { font-family: 'Share Tech Mono', ui-monospace, monospace; color: #eaf7ff; }
body.style-blueprint #hud { padding: 22px 30px; }
body.style-blueprint #hud .xp { height: 16px; border: 1.5px solid ${LN}; border-radius: 0; overflow: visible;
  background: repeating-linear-gradient(90deg, rgba(223,243,255,.6) 0 1px, transparent 1px 10px) left bottom / 100% 5px no-repeat,
  repeating-linear-gradient(90deg, rgba(223,243,255,.75) 0 1px, transparent 1px 50px) left bottom / 100% 9px no-repeat, ${NV};
  box-shadow: 0 0 0 3px rgba(6,42,74,.45); }
body.style-blueprint #hud .xp-fill { background: repeating-linear-gradient(-45deg, rgba(255,207,74,.95) 0 1.5px, transparent 1.5px 5px), rgba(255,207,74,.16); border-right: 2px solid #ffcf4a; }
body.style-blueprint #hud .lvl { right: 8px; padding: 0 7px; font: 400 12px/14px 'Share Tech Mono', monospace; letter-spacing: 2px; color: #ffcf4a; text-shadow: none; background: #0b4475; border-left: 1px solid rgba(223,243,255,.55); border-right: 1px solid rgba(223,243,255,.55); }
body.style-blueprint #hud .topline { display: grid; grid-template-columns: 1fr auto 1fr; align-items: start; margin-top: 22px; }
body.style-blueprint #hud .hp { position: relative; justify-self: start; gap: 10px; padding: 7px 14px 7px 8px; background: ${NV}; border: 1.5px solid ${LN}; }
body.style-blueprint #hud .hp::before, body.style-blueprint #hud .kills::before { position: absolute; top: -9px; left: 8px; padding: 0 5px; font: 400 10px/16px 'Share Tech Mono', monospace; letter-spacing: 2px; color: #a9dcf6; background: #0b4475; border: 1px solid rgba(223,243,255,.55); }
body.style-blueprint #hud .hp::before { content: 'FIG. 1'; }
body.style-blueprint #hud .hp-icon, body.style-blueprint #hud .kills-icon { width: 38px; height: 38px; }
body.style-blueprint #hud .hp-bar { width: 230px; height: 16px; border: 1.5px solid ${LN}; border-radius: 0; background: rgba(3,26,48,.85); }
body.style-blueprint #hud .hp-bar::after { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(90deg, transparent 0 22px, rgba(223,243,255,.5) 22px 23px); }
body.style-blueprint #hud .hp-fill { background: repeating-linear-gradient(45deg, rgba(236,248,255,.95) 0 1.6px, transparent 1.6px 4.6px), rgba(236,248,255,.14); border-right: 2px solid #f2faff; }
body.style-blueprint #hud .hp-text { font: 400 15px 'Share Tech Mono', monospace; letter-spacing: 1px; text-shadow: none; color: #f2faff; min-width: 64px; }
body.style-blueprint.hurt #hud .hp-bar { border-color: #ff5b4d; filter: none; }
body.style-blueprint.hurt #hud .hp-fill { background: repeating-linear-gradient(45deg, rgba(255,91,77,.95) 0 1.6px, transparent 1.6px 4.6px), rgba(255,91,77,.2); border-right-color: #ff5b4d; }
body.style-blueprint #hud .clock { justify-self: center; position: relative; padding: 18px 26px 6px; margin-top: -8px; background: ${NV}; border: 1.5px solid ${LN}; box-shadow: inset 0 0 0 4px rgba(6,42,74,.9), inset 0 0 0 5px rgba(223,243,255,.4); }
body.style-blueprint #hud .clock::before { content: 'SHEET 04 \\2014  REV B'; position: absolute; left: 0; right: 0; top: 0; height: 15px; border-bottom: 1px solid rgba(223,243,255,.55); font: 400 9.5px/15px 'Share Tech Mono', monospace; letter-spacing: 2.5px; color: #a9dcf6; text-align: center; }
body.style-blueprint #hud .clock-time { font: 400 34px/1.1 'Share Tech Mono', monospace; letter-spacing: 4px; color: #f2faff; text-shadow: none; }
body.style-blueprint #hud .clock-label { font: 400 15px/1.2 'Architects Daughter', cursive; letter-spacing: .5px; text-transform: none; opacity: 1; color: #ffcf4a; }
body.style-blueprint #hud .kills { position: relative; justify-self: end; min-width: 0; gap: 6px; padding: 3px 16px 3px 8px; color: #ff6b5c; font: 400 26px 'Share Tech Mono', monospace; letter-spacing: 2px; text-shadow: none;
  background: rgba(6,42,74,.7); border: 2.5px solid #ff6b5c; border-radius: 5px; outline: 1px solid rgba(255,107,92,.55); outline-offset: 3px; transform: rotate(-2.5deg); }
body.style-blueprint #hud .kills::before { content: 'FIG. 2'; color: #ff8a7d; border-color: rgba(255,107,92,.6); }
body.style-blueprint #stylebar { gap: 0; padding: 0; border-radius: 0; background: rgba(6,42,74,.9); border: 1.5px solid ${LN}; box-shadow: inset 0 0 0 3px rgba(6,42,74,1), inset 0 0 0 4px rgba(223,243,255,.35); font-family: 'Share Tech Mono', monospace; bottom: 16px; }
body.style-blueprint #stylebar > span { padding: 7px 14px; }
body.style-blueprint #stylebar > span + span { border-left: 1px solid rgba(223,243,255,.55); }
body.style-blueprint #stylebar .style-family { font-size: 10px; letter-spacing: 2.5px; color: #a9dcf6; opacity: 1; }
body.style-blueprint #stylebar .style-name { font: 400 16px 'Share Tech Mono', monospace; letter-spacing: 3px; text-transform: uppercase; color: #f2faff; }
body.style-blueprint #stylebar .style-hint { font: 400 13px 'Architects Daughter', cursive; color: #ffcf4a; opacity: 1; }
body.style-blueprint #stylebar .auto.on { color: #ff6b5c; }
body.style-blueprint #levelup { gap: 34px; background: radial-gradient(ellipse at 50% 45%, rgba(14,80,136,.55), rgba(5,32,58,.9) 75%), ${GRIDBG}; }
body.style-blueprint #levelup .lu-title { position: relative; padding: 0 34px 16px; font: 400 58px/1 'Share Tech Mono', monospace; letter-spacing: 12px; text-transform: uppercase; color: #f2faff; text-shadow: 0 0 0 transparent;
  background: linear-gradient(#dff3ff, #dff3ff) center bottom 4px / calc(100% - 4px) 1px no-repeat; animation: bpDraw .5s ease-out backwards; }
body.style-blueprint #levelup .lu-title::before, body.style-blueprint #levelup .lu-title::after { content: ''; position: absolute; bottom: -4px; width: 1px; height: 18px; background: #dff3ff; }
body.style-blueprint #levelup .lu-title::before { left: 2px; } body.style-blueprint #levelup .lu-title::after { right: 2px; }
@keyframes bpDraw { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
body.style-blueprint #levelup .lu-cards { gap: 28px; }
body.style-blueprint #levelup .card { width: 236px; min-height: 312px; padding: 26px 18px 52px; gap: 10px; color: #f2faff; border-radius: 0;
  background: linear-gradient(rgba(200,235,255,.06) 1px, transparent 1px) 0 0 / 12px 12px, linear-gradient(90deg, rgba(200,235,255,.06) 1px, transparent 1px) 0 0 / 12px 12px, #0d4f86;
  border: 1.5px solid ${LN}; box-shadow: inset 0 0 0 6px #0d4f86, inset 0 0 0 7px rgba(223,243,255,.5), 0 12px 0 -4px rgba(3,20,38,.45);
  transition: transform .15s ease-out, border-color .15s; animation: bpCard .45s ease-out backwards; }
body.style-blueprint #levelup .card:nth-child(2) { animation-delay: .08s; } body.style-blueprint #levelup .card:nth-child(3) { animation-delay: .16s; }
@keyframes bpCard { from { opacity: 0; transform: translateY(26px) rotate(1.5deg); } to { opacity: 1; transform: none; } }
body.style-blueprint #levelup .card::after { content: 'DWG A-01   SCALE 1:1'; position: absolute; left: 7px; right: 7px; bottom: 7px; height: 26px; border-top: 1px solid rgba(223,243,255,.55);
  font: 400 10px/26px 'Share Tech Mono', monospace; letter-spacing: 2px; color: #a9dcf6; text-align: center; }
body.style-blueprint #levelup .card:nth-child(2)::after { content: 'DWG A-02   SCALE 1:1'; } body.style-blueprint #levelup .card:nth-child(3)::after { content: 'DWG A-03   SCALE 1:1'; }
body.style-blueprint #levelup .card:hover { transform: translateY(-8px) rotate(-.8deg); border-color: #ffcf4a; }
body.style-blueprint #levelup .card-icon { width: 116px; height: 116px; border-radius: 50%; border: 1.5px dashed rgba(223,243,255,.6);
  background: linear-gradient(transparent calc(50% - .5px), rgba(223,243,255,.28) calc(50% - .5px) calc(50% + .5px), transparent calc(50% + .5px)),
  linear-gradient(90deg, transparent calc(50% - .5px), rgba(223,243,255,.28) calc(50% - .5px) calc(50% + .5px), transparent calc(50% + .5px)), rgba(6,42,74,.6); }
body.style-blueprint #levelup .card-name { margin-top: 4px; font: 400 19px/1.15 'Share Tech Mono', monospace; letter-spacing: 2px; text-transform: uppercase; color: #f2faff; }
body.style-blueprint #levelup .card-desc { font: 400 16px/1.3 'Architects Daughter', cursive; opacity: 1; color: #ffcf4a; }
body.style-blueprint #levelup .card-key { top: 12px; left: 12px; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; border: 1.5px solid ${LN}; border-radius: 50%;
  font: 400 13px 'Share Tech Mono', monospace; opacity: 1; color: #f2faff; }
body.style-blueprint #levelup .lu-hint { font: 400 18px 'Architects Daughter', cursive; opacity: 1; color: #a9dcf6; }
body.style-blueprint #gameover { gap: 20px; background: radial-gradient(ellipse at 50% 45%, rgba(14,80,136,.5), rgba(5,32,58,.92) 75%), ${GRIDBG}; }
body.style-blueprint #gameover .go-title { font: 400 60px 'Share Tech Mono', monospace; letter-spacing: 8px; text-transform: uppercase; color: #ff6b5c; padding: 6px 26px; border: 4px solid #ff6b5c; border-radius: 8px; outline: 1.5px solid rgba(255,107,92,.6); outline-offset: 5px; transform: rotate(-4deg); }
body.style-blueprint #gameover .go-stats { font: 400 20px 'Architects Daughter', cursive; opacity: 1; color: #f2faff; }
body.style-blueprint #gameover .go-hint { font: 400 15px 'Share Tech Mono', monospace; letter-spacing: 3px; opacity: 1; padding: 6px 18px; border: 1.5px solid ${LN}; background: ${NV}; }
body.style-blueprint #pausebox { font: 400 56px 'Share Tech Mono', monospace; letter-spacing: 14px; color: #f2faff; text-shadow: none; padding: 10px 30px; border: 1.5px solid ${LN}; background: ${NV}; }
`;

  /* ================================================================ icons */
  // drawn in a 24-unit box, two passes (navy halo, then lines) so they read on any panel
  function iconPaint(c, fn) { for (const p of ['back', 'main']) { PASS = p; c.save(); fn(c); c.restore(); } PASS = 'main'; }
  const ICONS = {
    kills(c) { c.translate(12, 13); c.translate(0, 10.8); creeperDraw(c, 0.15, 0); },
    'hp-heart'(c) {
      con(c, CIRC(8.6, 9.4, 4.6), 0.35, W_(0.7), [1.2, 0.8]); con(c, CIRC(15.4, 9.4, 4.6), 0.35, W_(0.7), [1.2, 0.8]);
      shp(c, (c2) => { c2.beginPath(); c2.moveTo(12, 20.5); c2.lineTo(4.4, 11.6); c2.arc(8.6, 9.4, 4.6, PI * 0.86, PI * 1.92); c2.arc(15.4, 9.4, 4.6, PI * 1.08, PI * 0.14); c2.closePath(); },
        { fill: C.red, lw: 1.1, hatch: { rect: [12, 0, 24, 24], box: [0, 0, 24, 24], sp: 1.6, col: 'rgba(120,10,0,0.55)', lw: 0.5 } });
      con(c, (c2) => { c2.beginPath(); centerMark(c2, 8.6, 9.4, 1.0, 0.6); centerMark(c2, 15.4, 9.4, 1.0, 0.6); }, 0.35, 'rgba(255,255,255,0.85)');
    },
    dmg(c) { // drafting pen nib
      shp(c, POLY([12, 2.5, 18.5, 11, 15.5, 21.5, 8.5, 21.5, 5.5, 11]), { fill: C.amber, lw: 1.1, hatch: { rect: [12, 0, 24, 24], box: [0, 0, 24, 24], sp: 1.5, col: 'rgba(150,90,0,0.6)', lw: 0.45 } });
      shp(c, CIRC(12, 13.5, 1.6), { fill: C.dark, lw: 0.7 });
      con(c, LINE([12, 3.5, 12, 11.8]), 0.8, C.dark);
      con(c, LINE([7.5, 18, 16.5, 18]), 0.6, 'rgba(120,70,0,0.8)');
      con(c, LINE([12, 1, 12, 23.5]), 0.35, W_(0.5), [2.4, 0.8, 0.6, 0.8]);
    },
    rate(c) { // stopwatch
      for (const [y, l] of [[9, 4], [12.5, 5.5], [16, 4]]) con(c, LINE([1.5, y, 1.5 + l, y]), 0.7, W_(0.8), [1.4, 0.9]);
      shp(c, RR(12, 1.6, 4, 2.4, 0.5), { fill: C.fill2, lw: 0.8 });
      shp(c, CIRC(14, 13, 8.2), { fill: C.fill, lw: 1.2 });
      if (PASS === 'main') {
        c.beginPath(); for (let i = 0; i < 12; i++) { const t = i / 12 * TAU, l = i % 3 ? 1 : 1.9; c.moveTo(14 + Math.cos(t) * 7, 13 + Math.sin(t) * 7); c.lineTo(14 + Math.cos(t) * (7 - l), 13 + Math.sin(t) * (7 - l)); }
        c.lineWidth = 0.55; c.strokeStyle = C.ink; c.stroke();
        c.beginPath(); c.moveTo(14, 13); c.arc(14, 13, 5.4, -PI / 2, 0.5); c.closePath(); c.fillStyle = A_(0.45); c.fill();
        c.beginPath(); c.moveTo(14, 13); c.lineTo(14 + Math.cos(0.5) * 5.8, 13 + Math.sin(0.5) * 5.8); c.lineWidth = 1.0; c.strokeStyle = C.red; c.stroke();
        c.beginPath(); c.arc(14, 13, 1, 0, TAU); c.fillStyle = C.ink; c.fill();
      }
    },
    multi(c) { // three dimension arrows fanning out
      for (const t of [-0.5, 0, 0.5]) {
        const ax = 3, ay = 13, bx = 3 + Math.cos(t) * 17.5, by = 13 + Math.sin(t) * 9;
        ln(c, LINE([ax, ay, bx, by]), 0.75, C.ink, { dash: [2, 1.2] });
        shp(c, (c2) => { c2.beginPath(); arrowHead(c2, bx + Math.cos(Math.atan2(by - ay, bx - ax)) * 2.6, by + Math.sin(Math.atan2(by - ay, bx - ax)) * 2.6, Math.atan2(by - ay, bx - ax), 4, 1.6); }, { fill: C.amber, lw: 0.5 });
      }
      shp(c, CIRC(3, 13, 1.6), { fill: C.ink, lw: 0.4 });
    },
    bounce(c) { // reflection off a hatched wall, with the angle arcs
      shp(c, RR(18, 1.5, 3.5, 21, 0), { fill: C.fill, lw: 0.9, hatch: { rect: [17, 0, 23, 24], box: [17, 0, 23, 24], sp: 1.4, a: 0.8, lw: 0.45 } });
      ln(c, LINE([2, 4, 17.6, 12, 4, 21]), 0.9, C.ink, { dash: [2.2, 1.2] });
      shp(c, (c2) => { c2.beginPath(); arrowHead(c2, 3.2, 20.4, Math.atan2(21 - 12, 4 - 17.6), 4, 1.6); }, { fill: C.amber, lw: 0.5 });
      con(c, (c2) => { c2.beginPath(); c2.arc(17.6, 12, 5, PI * 0.84, PI * 1.16); }, 0.6, C.amber);
      con(c, LINE([17.6, 12, 9.5, 12]), 0.4, W_(0.6), [1, 0.8]);
    },
    lantern(c) { // orbiting disc on a dashed orbit
      con(c, ELL(12, 13, 10, 6.4), 0.6, W_(0.8), [1.6, 1.1]);
      con(c, (c2) => { c2.beginPath(); centerMark(c2, 12, 13, 1.2, 1.2); }, 0.5, C.ink);
      c.save(); c.translate(19.5, 8.6); c.scale(0.95, 0.95); discDraw(c); c.restore();
      shp(c, CIRC(4.6, 17.2, 1.4), { fill: C.amber, lw: 0.45 });
    },
    speed(c) { // wheel with motion lines
      for (const [y, l] of [[8, 5], [12.5, 7], [17, 5]]) con(c, LINE([1, y, 1 + l, y]), 0.75, W_(0.85), [1.6, 1]);
      shp(c, CIRC(15, 12.5, 7.8), { fill: C.fill, lw: 1.2 });
      if (PASS === 'main') {
        c.beginPath(); for (let i = 0; i < 6; i++) { const t = i / 6 * TAU + 0.3; c.moveTo(15 + Math.cos(t) * 2, 12.5 + Math.sin(t) * 2); c.lineTo(15 + Math.cos(t) * 6.6, 12.5 + Math.sin(t) * 6.6); }
        c.lineWidth = 0.7; c.strokeStyle = C.pale; c.stroke();
        c.beginPath(); c.arc(15, 12.5, 2, 0, TAU); c.fillStyle = C.amber; c.fill(); c.lineWidth = 0.5; c.strokeStyle = C.ink; c.stroke();
        c.beginPath(); c.arc(15, 12.5, 10.2, -PI * 0.42, -PI * 0.05); c.lineWidth = 0.6; c.strokeStyle = C.amber; c.stroke();
        c.beginPath(); arrowHead(c, 15 + Math.cos(-PI * 0.05) * 10.2, 12.5 + Math.sin(-PI * 0.05) * 10.2, PI * 0.45, 2.6, 1.1); c.fillStyle = C.amber; c.fill();
      }
    },
    magnet(c) { // horseshoe magnet with dashed field lines
      if (PASS === 'main') {
        c.setLineDash([1.3, 1]);
        for (const r of [4, 7]) { c.beginPath(); c.arc(12, 19.5, r, PI * 1.05, PI * 1.95); c.lineWidth = 0.55; c.strokeStyle = W_(0.75); c.stroke(); }
        c.setLineDash([]);
      }
      const U_ = (c2) => { c2.beginPath(); c2.moveTo(5, 21); c2.lineTo(5, 11); c2.arc(12, 11, 7, PI, 0); c2.lineTo(19, 21); };
      if (PASS === 'back') { U_(c); c.lineWidth = 5.6 + HALO; c.strokeStyle = C.navy; c.lineCap = 'butt'; c.stroke(); c.lineCap = 'round'; }
      else {
        c.lineCap = 'butt';
        U_(c); c.lineWidth = 5.6; c.strokeStyle = C.ink; c.stroke();
        U_(c); c.lineWidth = 4.0; c.strokeStyle = C.fill; c.stroke();
        c.beginPath(); c.moveTo(5, 21); c.lineTo(5, 17.5); c.moveTo(19, 21); c.lineTo(19, 17.5); c.lineWidth = 4.0; c.strokeStyle = C.red; c.stroke();
        c.lineCap = 'round';
        c.beginPath(); c.moveTo(8.2, 11); c.arc(12, 11, 3.8, PI, 0); c.lineWidth = 0.4; c.strokeStyle = W_(0.6); c.stroke();
      }
      shp(c, CIRC(12, 3.2, 1.3), { fill: C.amber, lw: 0.4 });
    },
    hp(c) { // wrench + plus
      c.save(); c.translate(12, 12); c.rotate(-PI / 4);
      shp(c, (c2) => { c2.beginPath(); c2.moveTo(-1.5, -5); c2.lineTo(-1.5, 8.5); c2.arc(0, 8.5, 1.5, PI, 0, true); c2.lineTo(1.5, -5); c2.arc(0, -8, 3.6, 0.6 + PI / 2 - 0.2, PI / 2 - 0.6 + 0.2 + TAU - 0.0, false); c2.closePath(); },
        { fill: C.fill2, lw: 1.0 });
      shp(c, RR(-1.3, -12.2, 2.6, 4.6, 0.3), { fill: C.paper, lw: 0.6 });
      c.restore();
      shp(c, (c2) => { c2.beginPath(); c2.rect(15.3, 3, 2.6, 8.6); c2.rect(12.3, 6, 8.6, 2.6); }, { fill: C.amber, lw: 0.6 });
    },
  };

  /* ============================================================ particles */
  function P_(game, o) { game.addParticle(o); }
  function ringP(game, x, y, z, r0, r1, life, col, sq, dash, label, lw) {
    P_(game, { kind: 'bp-ring', x, y, z, r0, r1, life, color: col, sq, dash: !!dash, label: label || '', lw: lw || 0.6, drag: 0 });
  }

  /* ============================================================ the style */
  let OVL = null, OVLkey = '';
  const trace = [];
  let traceT = -1;
  Styles.register({
    id: 'blueprint',
    name: 'Blueprint',
    family: 'Line art · Technical drawing',
    description: 'A living technical drawing: cyan-blue drafting paper with a fine grid, white line work, dimension lines, hatching, construction circles and red-pencil corrections.',
    groundColor: C.paper,
    groundResMax: 3,
    chunkSize: 256,
    fonts: ['Share+Tech+Mono', 'Architects+Daughter'],
    css: CSS,

    init() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssH = window.__forceH || window.innerHeight || 900;
      const S = (cssH * dpr) / 360;
      K = Math.max(4, Math.min(7, Math.ceil(S * 1.6) + 1));
      SPR.hero = {
        idle: [0, 1, 2, 3].map((f) => withFx(bake([-15, -42, 15, 4], (c) => heroDraw(c, 'idle', f / 4)), true)),
        walk: [0, 1, 2, 3, 4, 5, 6, 7].map((f) => withFx(bake([-15, -42, 15, 4], (c) => heroDraw(c, 'walk', f / 8)), true)),
        dash: withFx(bake([-30, -42, 18, 4], (c) => heroDraw(c, 'dash', 0)), true),
      };
      SPR.creep = [0, 1, 2].map((v) => [0, 1, 2, 3, 4, 5].map((f) => withFx(bake([-13, -27, 13, 3], (c) => creeperDraw(c, f / 6, v)))));
      SPR.drone = [0, 1, 2, 3].map((f) => withFx(bake([-15, -22, 15, 3], (c) => droneDraw(c, f / 4))));
      SPR.colo = [0, 1, 2, 3, 4, 5].map((f) => withFx(bake([-31, -66, 26, 3], (c) => colossusDraw(c, f / 6))));
      SPR.props = {};
      for (const t in PROPS) {
        SPR.props[t] = [];
        for (let v = 0; v < PROPS[t].n; v++) SPR.props[t].push(bake(PROPS[t].box, (c) => PROP_FN[t](c, v)));
      }
      SPR.nut = bake([-4.5, -4.5, 4.5, 4.5], nutDraw);
      SPR.cog = bake([-6.5, -6.5, 6.5, 6.5], cogDraw);
      SPR.arrow = bake([-4.5, -3.5, 5.5, 3.5], arrowDraw);
      SPR.disc = bake([-8, -8, 8, 8], discDraw);
      SPR.shadow = shadowSprite();
      GRAIN = grainTile();
      numCache.clear();
    },

    /* ---------------------------------------------------------- ground */
    *renderGroundChunk(ctx, info) {
      const wx = info.wx, wy = info.wy, size = info.size, res = info.res;
      // 1) paper base with slow mottling (low-res colour grid, upscaled smoothly -> seamless across chunks)
      const MC = 8, mn = size / MC + 2;
      const { c: mc, ctx: mx } = U.canvas(mn, mn);
      const mimg = mx.createImageData(mn, mn);
      const lo = U.hex(C.paperDk), mid = U.hex(C.paper), hi = U.hex(C.paperLt);
      for (let j = 0; j < mn; j++) {
        for (let i = 0; i < mn; i++) {
          const x = wx - MC + (i + 0.5) * MC, y = wy - MC + (j + 0.5) * MC;
          const t = U.fbm(x / 900, y / 900, 11, 3) * 0.85 + U.noise(x / 160, y / 160, 12) * 0.15;
          const fade = U.smoothstep(0.6, 0.85, U.noise(x / 1400, y / 1400, 13));
          let col = t < 0.5 ? U.mix(lo, mid, U.smoothstep(0.2, 0.5, t) * 0.6 + 0.4) : U.mix(mid, hi, U.smoothstep(0.5, 0.8, t) * 0.7);
          col = U.mix(col, [32, 106, 162], fade * 0.22);
          const o = (j * mn + i) * 4;
          mimg.data[o] = col[0]; mimg.data[o + 1] = col[1]; mimg.data[o + 2] = col[2]; mimg.data[o + 3] = 255;
        }
      }
      mx.putImageData(mimg, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(mc, wx - MC, wy - MC, mn * MC, mn * MC);
      yield;

      // 2) water / road fields on a 4-unit lattice (+2 rings for gradients)
      const n = size / GSTEP + 5, gx0 = wx - 2 * GSTEP, gy0 = wy - 2 * GSTEP;
      const F0 = new Float32Array(n * n), F1 = new Float32Array(n * n), F2 = new Float32Array(n * n), F3 = new Float32Array(n * n);
      for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
          const f = fieldRaw(gx0 + i * GSTEP, gy0 + j * GSTEP), o = j * n + i;
          F0[o] = f[0]; F1[o] = f[1]; F2[o] = f[2]; F3[o] = f[3];
        }
        if ((j & 15) === 15) yield;
      }
      const m = n - 2, WV = new Float32Array(m * m), RD = new Float32Array(m * m), RV = new Float32Array(m * m), RH = new Float32Array(m * m);
      for (let j = 0; j < m; j++) {
        for (let i = 0; i < m; i++) {
          const o = (j + 1) * n + i + 1, q = j * m + i;
          const g = (F) => Math.hypot((F[o + 1] - F[o - 1]) / (2 * GSTEP), (F[o + n] - F[o - n]) / (2 * GSTEP)) || 1e-6;
          WV[q] = bandV(F0[o] / g(F0), WHW, F1[o] / g(F1));
          RD[q] = F2[o] / g(F2); RH[q] = F3[o] / g(F3); RV[q] = bandV(RD[q], RHW, RH[q]);
        }
      }
      const lx0 = gx0 + GSTEP, ly0 = gy0 + GSTEP; // lattice origin of WV/RV (m x m)
      const bil = (A, x, y) => {
        const fx = (x - lx0) / GSTEP, fy = (y - ly0) / GSTEP;
        const i = Math.max(0, Math.min(m - 2, Math.floor(fx))), j = Math.max(0, Math.min(m - 2, Math.floor(fy)));
        const u = fx - i, v = fy - j, o = j * m + i;
        const a = A[o] + (A[o + 1] - A[o]) * u, b = A[o + m] + (A[o + m + 1] - A[o + m]) * u;
        return a + (b - a) * v;
      };
      const anyW = WV.some((v) => v < 6), anyR = RV.some((v) => v < 6);
      // mask canvases at 2 units per pixel
      const mask = (A, rgb, alpha, edge) => {
        const N = size / 2 + 4, { c, ctx: k } = U.canvas(N, N), img = k.createImageData(N, N), d = img.data;
        for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
          const v = bil(A, wx - 4 + i * 2 + 1, wy - 4 + j * 2 + 1);
          const al = U.clamp(0.5 - v / edge, 0, 1) * alpha, o = (j * N + i) * 4;
          d[o] = rgb[0]; d[o + 1] = rgb[1]; d[o + 2] = rgb[2]; d[o + 3] = al * 255;
        }
        k.putImageData(img, 0, 0);
        ctx.drawImage(c, wx - 4, wy - 4, N * 2, N * 2);
      };
      if (anyW) mask(WV, [4, 40, 76], 0.5, 2.0);
      yield;

      // 3) drafting grid
      const lw = Math.max(0.32, 0.9 / res);
      ctx.fillStyle = 'rgba(205,236,255,0.075)';
      for (let x = Math.ceil(wx / 8) * 8; x < wx + size; x += 8) if (mod(x, 40) !== 0) ctx.fillRect(x - lw / 2, wy, lw, size);
      for (let y = Math.ceil(wy / 8) * 8; y < wy + size; y += 8) if (mod(y, 40) !== 0) ctx.fillRect(wx, y - lw / 2, size, lw);
      ctx.fillStyle = 'rgba(205,236,255,0.17)';
      const lw2 = Math.max(0.45, 1.15 / res);
      for (let x = Math.ceil(wx / 40) * 40; x < wx + size; x += 40) ctx.fillRect(x - lw2 / 2, wy, lw2, size);
      for (let y = Math.ceil(wy / 40) * 40; y < wy + size; y += 40) ctx.fillRect(wx, y - lw2 / 2, size, lw2);
      yield;

      // 4) topographic contours where the survey layer is active
      const TS = 6, tn = Math.ceil(size / TS) + 3, tx0 = (Math.floor(wx / TS) - 1) * TS, ty0 = (Math.floor(wy / TS) - 1) * TS;
      const TV = new Float32Array(tn * tn), TM = new Float32Array(tn * tn);
      let anyT = false;
      for (let j = 0; j < tn; j++) for (let i = 0; i < tn; i++) {
        const x = tx0 + i * TS, y = ty0 + j * TS, o = j * tn + i;
        TM[o] = U.smoothstep(0.46, 0.6, U.noise(x / 1300 + 40, y / 1300, 78));
        if (TM[o] > 0) { anyT = true; TV[o] = U.fbm(x / 560, y / 560, 77, 3); } else TV[o] = U.fbm(x / 560, y / 560, 77, 3);
      }
      if (anyT) {
        const B = [[], [], [], []]; // [thin low, thin high, index low, index high]
        for (let L = 0; L < 26; L++) {
          const lev = 0.2 + L * 0.024, idx = L % 5 === 0;
          contour(TV, tn, tx0, ty0, TS, lev, (x1, y1, x2, y2, i, j) => {
            const mk = TM[j * tn + i];
            if (mk <= 0.05) return;
            const mxp = (x1 + x2) / 2, myp = (y1 + y2) / 2;
            if ((anyW && bil(WV, mxp, myp) < 3) || (anyR && bil(RV, mxp, myp) < 3)) return;
            B[(idx ? 2 : 0) + (mk > 0.6 ? 1 : 0)].push(x1, y1, x2, y2);
          });
        }
        const st = [[0.32, 0.085], [0.32, 0.15], [0.55, 0.14], [0.55, 0.26]];
        for (let b = 0; b < 4; b++) {
          const a = B[b]; if (!a.length) continue;
          ctx.beginPath(); for (let i = 0; i < a.length; i += 4) { ctx.moveTo(a[i], a[i + 1]); ctx.lineTo(a[i + 2], a[i + 3]); }
          ctx.lineWidth = st[b][0]; ctx.strokeStyle = W_(st[b][1]); ctx.stroke();
        }
      }
      yield;

      // 4b) site zones: dash-dot property lines round equipment yards, dotted tree lines round groves
      {
        const ZV = new Float32Array(tn * tn);
        for (let j = 0; j < tn; j++) for (let i = 0; i < tn; i++) ZV[j * tn + i] = zoneAt(tx0 + i * TS, ty0 + j * TS);
        const PL = [], TL = [];
        const keep = (x1, y1, x2, y2) => { const mx = (x1 + x2) / 2, my = (y1 + y2) / 2; return !((anyW && bil(WV, mx, my) < 4) || (anyR && bil(RV, mx, my) < 4)); };
        contour(ZV, tn, tx0, ty0, TS, YARD, (x1, y1, x2, y2) => { if (keep(x1, y1, x2, y2)) PL.push(x1, y1, x2, y2); });
        contour(ZV, tn, tx0, ty0, TS, GROVE, (x1, y1, x2, y2) => { if (keep(x1, y1, x2, y2)) TL.push(x1, y1, x2, y2); });
        const run = (A) => { ctx.beginPath(); for (let i = 0; i < A.length; i += 4) { ctx.moveTo(A[i], A[i + 1]); ctx.lineTo(A[i + 2], A[i + 3]); } };
        if (PL.length) {
          ctx.lineCap = 'butt'; ctx.setLineDash([9, 1.6, 1.4, 1.6]); run(PL);
          ctx.lineWidth = 0.75; ctx.strokeStyle = W_(0.36); ctx.stroke(); ctx.setLineDash([]);
        }
        if (TL.length) {
          ctx.lineCap = 'round'; ctx.setLineDash([0.1, 2.6]); run(TL);
          ctx.lineWidth = 1.25; ctx.strokeStyle = W_(0.34); ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = 'butt';
        }
        G.scatter(info, 330, 909, 30, (x, y, rng) => {
          if (!rng.chance(0.6)) return;
          const z = zoneAt(x, y), f = fieldsAt(x, y);
          if (f.w < 16 || f.r < 16) return;
          if (z < YARD - 0.05) strokeText(ctx, 'YARD ' + 'ABCDEFGH'[rng.int(0, 7)], x, y, 4.6, W_(0.42), 0.5, 'center', true, 0.15, rng.int(1, 99));
          else if (z > GROVE + 0.05) strokeText(ctx, 'GROVE', x, y, 4.2, W_(0.38), 0.45, 'center', true, 0.15, rng.int(1, 99));
        });
      }
      yield;

      // 5) road surface (blank strip, covers the grid) + paper grain over everything
      if (anyR) mask(RV, U.hex('#0f538c'), 0.96, 1.6);
      if (GRAIN) {
        const pat = ctx.createPattern(GRAIN, 'repeat');
        if (pat && pat.setTransform) pat.setTransform(new DOMMatrix().scale(1 / 3, 1 / 3));
        ctx.fillStyle = pat; ctx.fillRect(wx, wy, size, size);
      }
      yield;

      // 6) water banks (with embankment ticks) + flow lines; road edges + chain center line
      const seg = (A, level) => { const out = []; contour(A, m, lx0, ly0, GSTEP, level, (x1, y1, x2, y2, i, j) => out.push(x1, y1, x2, y2, i, j)); return out; };
      const strokeSegs = (a, lwd, col, every) => {
        ctx.beginPath();
        for (let i = 0; i < a.length; i += 6) { if (every && ((a[i + 4] + a[i + 5]) & 1)) continue; ctx.moveTo(a[i], a[i + 1]); ctx.lineTo(a[i + 2], a[i + 3]); }
        ctx.lineWidth = lwd; ctx.strokeStyle = col; ctx.stroke();
      };
      if (anyW) {
        const bank = seg(WV, 0);
        strokeSegs(bank, 0.7, W_(0.55));
        strokeSegs(seg(WV, 3.2), 0.35, W_(0.3));
        strokeSegs(seg(WV, -6), 0.35, W_(0.22), true);
        strokeSegs(seg(WV, -12), 0.3, W_(0.16), true);
        // embankment hachures on the land side
        ctx.beginPath();
        for (let q = 0; q < bank.length; q += 6) {
          const x = (bank[q] + bank[q + 2]) / 2, y = (bank[q + 1] + bank[q + 3]) / 2;
          const gx = bil(WV, x + 1, y) - bil(WV, x - 1, y), gy = bil(WV, x, y + 1) - bil(WV, x, y - 1), gl = Math.hypot(gx, gy) || 1;
          const L = ((bank[q + 4] + bank[q + 5]) & 1) ? 2.2 : 4.2;
          ctx.moveTo(x + gx / gl * 3.6, y + gy / gl * 3.6); ctx.lineTo(x + gx / gl * (3.6 + L), y + gy / gl * (3.6 + L));
        }
        ctx.lineWidth = 0.32; ctx.strokeStyle = W_(0.3); ctx.stroke();
        // wave marks inside
        ctx.beginPath();
        G.scatter(info, 22, 611, 6, (x, y) => {
          if (bil(WV, x, y) > -7) return;
          ctx.moveTo(x - 3, y); ctx.quadraticCurveTo(x - 1.5, y - 1.3, x, y); ctx.quadraticCurveTo(x + 1.5, y + 1.3, x + 3, y);
        });
        ctx.lineWidth = 0.35; ctx.strokeStyle = W_(0.28); ctx.stroke();
      }
      if (anyR) {
        strokeSegs(seg(RV, 0), 0.7, W_(0.48));
        strokeSegs(seg(RV, 2.2), 0.32, W_(0.24));
        const cl = [];
        contour(RD, m, lx0, ly0, GSTEP, 0, (x1, y1, x2, y2, i, j) => { if (RH[j * m + i] > 4) cl.push(x1, y1, x2, y2, i, j); });
        strokeSegs(cl, 0.4, W_(0.36), true);
      }
      yield;

      // 7) big drawings: floor plans, gear details, sections, north arrows, callout bubbles
      // long construction lines running across the sheet
      G.scatter(info, 700, 506, 420, (x, y, rng) => {
        if (!rng.chance(0.7)) return;
        const a = rng.int(0, 7) * PI / 4 + (rng.chance(0.3) ? rng.range(-0.3, 0.3) : 0), L = rng.range(260, 420);
        ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * L, y - Math.sin(a) * L); ctx.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L);
        if (rng.chance(0.4)) ctx.setLineDash(CHAIN);
        ctx.lineWidth = 0.3; ctx.strokeStyle = W_(0.12); ctx.stroke(); ctx.setLineDash([]);
      });
      G.scatter(info, 440, 501, 300, (x, y, rng) => {
        if (G.nearSpawn(x, y, 330) || !rng.chance(0.85)) return;
        const f = fieldsAt(x, y);
        if (f.w < 40 || f.r < 30) return;
        const k = rng.next(), A = rng.range(0.75, 1);
        if (k < 0.4) drawPlan(ctx, x, y, rng, A);
        else if (k < 0.62) drawGearDwg(ctx, x, y, rng, A);
        else if (k < 0.78) drawSection(ctx, x, y, rng, A);
        else if (k < 0.89) drawNorth(ctx, x, y, rng, A);
        else drawBubble(ctx, x, y, rng, A);
      });
      // two fixed landmark drawings near the origin, so the first view of the sheet is composed
      for (const [lx, ly, kind, sd, rad] of [[235, -92, 1, 71, 110], [-270, 70, 0, 72, 170], [40, 205, 2, 73, 90]]) {
        if (lx + rad < wx || lx - rad > wx + size || ly + rad < wy || ly - rad > wy + size) continue;
        const rng = U.rng(sd);
        if (kind === 0) drawPlan(ctx, lx, ly, rng, 0.9); else if (kind === 1) drawGearDwg(ctx, lx, ly, rng, 0.9); else drawSection(ctx, lx, ly, rng, 0.85);
      }
      yield;
      // mid-size part drawings
      G.scatter(info, 180, 507, 80, (x, y, rng) => {
        if (!rng.chance(0.62) || G.nearSpawn(x, y, 40)) return;
        const f = fieldsAt(x, y);
        if (f.w < 25 || f.r < 20) return;
        drawPart(ctx, x, y, rng);
      });
      // 8) small notes: spot heights, handwritten notes, registration crosses
      G.scatter(info, 150, 502, 60, (x, y, rng) => {
        const k = rng.next();
        if (k > 0.55) return;
        const f = fieldsAt(x, y);
        if (f.w < 4 || f.r < 4) return;
        if (k < 0.3) drawSpot(ctx, x, y, rng);
        else if (k < 0.42) drawNote(ctx, x, y, rng, false);
        else if (k < 0.5) {
          ctx.beginPath(); ctx.arc(x, y, 3.2, 0, TAU); ctx.moveTo(x - 5.5, y); ctx.lineTo(x + 5.5, y); ctx.moveTo(x, y - 5.5); ctx.lineTo(x, y + 5.5);
          ctx.lineWidth = 0.35; ctx.strokeStyle = W_(0.32); ctx.stroke();
        }
      });
      // 9) red pencil corrections (sparse)
      G.scatter(info, 560, 503, 60, (x, y, rng) => {
        const k = rng.next();
        if (k > 0.6) return;
        if (k < 0.3) drawRevCloud(ctx, x, y, rng);
        else if (k < 0.45) drawRedMark(ctx, x, y, rng);
        else drawNote(ctx, x, y, rng, true);
      });
      yield;
      // 10) handling marks: eraser smudges, fold creases, coffee rings
      G.scatter(info, 470, 504, 60, (x, y, rng) => { if (rng.chance(0.5)) drawSmudge(ctx, x, y, rng); });
      const CX = 1024, CY = 768;
      for (let k = Math.floor((wx - 8) / CX); k <= Math.floor((wx + size + 8) / CX); k++) {
        const x = k * CX + 37;
        if (x < wx - 8 || x > wx + size + 8) continue;
        const g = ctx.createLinearGradient(x - 5, 0, x + 5, 0);
        g.addColorStop(0, 'rgba(0,22,44,0)'); g.addColorStop(0.45, 'rgba(255,255,255,0.07)'); g.addColorStop(0.52, 'rgba(0,22,44,0.22)'); g.addColorStop(1, 'rgba(0,22,44,0)');
        ctx.fillStyle = g; ctx.fillRect(x - 5, wy, 10, size);
        ctx.fillStyle = 'rgba(235,248,255,0.1)'; ctx.fillRect(x - 0.9, wy, 0.5, size);
      }
      for (let k = Math.floor((wy - 8) / CY); k <= Math.floor((wy + size + 8) / CY); k++) {
        const y = k * CY + 91;
        if (y < wy - 8 || y > wy + size + 8) continue;
        const g = ctx.createLinearGradient(0, y - 5, 0, y + 5);
        g.addColorStop(0, 'rgba(0,22,44,0)'); g.addColorStop(0.45, 'rgba(255,255,255,0.07)'); g.addColorStop(0.52, 'rgba(0,22,44,0.22)'); g.addColorStop(1, 'rgba(0,22,44,0)');
        ctx.fillStyle = g; ctx.fillRect(wx, y - 5, size, 10);
        ctx.fillStyle = 'rgba(235,248,255,0.1)'; ctx.fillRect(wx, y - 0.9, size, 0.5);
      }
      G.scatter(info, 820, 505, 50, (x, y, rng) => { if (rng.chance(0.55) && !G.nearSpawn(x, y, 300)) drawCoffee(ctx, x, y, rng); });
      if (wx < -60 && wx + size > -230 && wy < 190 && wy + size > 50) drawCoffee(ctx, -150, 118, U.rng(808));
    },

    propsForChunk(info) {
      const out = [];
      // props follow the site plan: equipment inside the yards, trees and rocks in the groves,
      // lamps and survey instruments along the road, only a few strays on the open sheet
      G.scatterOwned(info, 66, 4243, (x, y, rng) => {
        if (G.nearSpawn(x, y, 90)) return;
        const r = rng.next();
        const f = fieldsAt(x, y);
        if (f.w < 12 || f.r < 10) return;
        const q = rng.next(), z = zoneAt(x, y);
        let t = null;
        if (z < YARD - 0.02) { if (r < 0.5) t = q < 0.34 ? 'crate' : q < 0.6 ? 'tank' : q < 0.84 ? 'valve' : 'tower'; }
        else if (z > GROVE + 0.02) { if (r < 0.52) t = q < 0.74 ? 'tree' : 'rock'; }
        else if (f.r < 30) { if (r < 0.24) t = q < 0.55 ? 'lamp' : 'theodolite'; }
        else if (r < 0.035) t = q < 0.5 ? 'rock' : 'tree';
        if (!t) return;
        out.push({ x, y, t, v: rng.int(0, PROPS[t].n - 1), f: rng.chance(0.5), pad: t === 'tower' ? 90 : t === 'tree' || t === 'lamp' ? 70 : 40 });
      });
      return out;
    },

    drawProp(ctx, p, view) {
      const set = SPR.props && SPR.props[p.t];
      if (!set) return;
      const V = tf(view), s = set[p.v] || set[0];
      put(ctx, V, s, p.x, p.y, 1, 1, 0, p.f && (p.t === 'tree' || p.t === 'rock' || p.t === 'lamp'));
    },

    drawShadow(ctx, o, view) {
      const V = tf(view);
      let rx;
      if (o.kind === 'prop') { const d = PROPS[o.t]; if (!d) return; rx = d.sh; }
      else if (o.kind === 'enemy') {
        let k = 1;
        if (o.dying) k = Math.max(0, 1 - o.deathT * 1.4);
        if (o.spawnT < 1) k *= U.clamp(o.spawnT * 1.6, 0, 1);
        if (k <= 0.03) return;
        rx = (o.type === 'colossus' ? 19 : o.type === 'ghost' ? 6.5 : 10.5) * k;
      } else {
        rx = 9.5;
        if (view.game && o === view.game.player) {
          // the route of the main character, plotted as a dashed line with station ticks
          const last = trace.length ? trace[trace.length - 1] : null;
          if (!last || Math.hypot(o.x - last[0], o.y - last[1]) > 7) {
            if (last && Math.hypot(o.x - last[0], o.y - last[1]) > 120) trace.length = 0;
            trace.push([o.x, o.y]);
            if (trace.length > 44) trace.shift();
          }
          traceT = view.rt;
          if (trace.length > 2) {
            ctx.setLineDash([2.6, 2]);
            for (let b = 0; b < 3; b++) {
              const i0 = Math.floor(b * (trace.length - 1) / 3), i1 = Math.floor((b + 1) * (trace.length - 1) / 3);
              ctx.beginPath(); ctx.moveTo(trace[i0][0], trace[i0][1]);
              for (let i = i0 + 1; i <= i1; i++) ctx.lineTo(trace[i][0], trace[i][1]);
              if (b === 2) ctx.lineTo(o.x, o.y);
              ctx.lineWidth = 0.55; ctx.strokeStyle = W_(0.1 + b * 0.11); ctx.stroke();
            }
            ctx.setLineDash([]);
            ctx.beginPath();
            for (let i = trace.length - 1 - 6; i > 0; i -= 6) { const [tx, ty] = trace[i]; ctx.moveTo(tx - 1.6, ty); ctx.lineTo(tx + 1.6, ty); ctx.moveTo(tx, ty - 1.6); ctx.lineTo(tx, ty + 1.6); }
            ctx.lineWidth = 0.4; ctx.strokeStyle = W_(0.3); ctx.stroke();
          }
        }
      }
      const sc = rx / 10;
      put(ctx, V, SPR.shadow, o.x, o.y, sc, sc, 0, false);
    },

    drawGem(ctx, g, view) {
      const V = tf(view);
      let h = 2 + Math.sin(view.rt * 4 + g.seed * 20) * 1.2, sc = g.big ? 1 : 0.9;
      if (g.pop > 0) { const q = 1 - g.pop; h += Math.sin(q * PI) * 9; sc *= 0.4 + 0.6 * U.ease.outBack(Math.min(1, q * 1.4)); }
      put(ctx, V, SPR.shadow, g.x, g.y, g.big ? 0.42 : 0.3, g.big ? 0.42 : 0.3, 0, false);
      const s = g.big ? SPR.cog : SPR.nut;
      put(ctx, V, s, g.x, g.y - h - 3, sc, sc, g.big ? view.rt * 1.6 + g.seed * 6 : Math.sin(view.rt * 2 + g.seed * 9) * 0.5, false);
      if (g.big && !g.fly) {
        // tiny measurement tag next to large collectibles
        const a = 0.5 + 0.3 * Math.sin(view.rt * 3 + g.seed * 7);
        ctx.beginPath(); ctx.moveTo(g.x + 4, g.y - h - 6); ctx.lineTo(g.x + 8, g.y - h - 10); ctx.lineTo(g.x + 13, g.y - h - 10);
        ctx.lineWidth = 0.35; ctx.strokeStyle = A_(a); ctx.stroke();
      }
    },

    drawEnemy(ctx, e, view) {
      const V = tf(view);
      const left = e.facing < 0;
      let s, y = e.y, rot = 0, sc = 0.95 + e.seed * 0.1, bodyH;
      if (e.type === 'ghost') {
        const f = Math.floor(view.rt * 14 + e.seed * 4) & 3;
        s = SPR.drone[f];
        y -= 5 + Math.sin(view.rt * 3 + e.seed * 12) * 1.5;
        rot = U.clamp(e.vx / 64, -1, 1) * 0.18;
        bodyH = 14;
      } else if (e.type === 'colossus') {
        const ph = e.anim * 0.3 + e.seed;
        s = SPR.colo[Math.floor(mod(ph, 1) * 6) % 6];
        bodyH = 34;
      } else {
        const ph = e.anim * 0.75 + e.seed;
        s = SPR.creep[Math.floor(e.seed * 3) % 3][Math.floor(mod(ph, 1) * 6) % 6];
        rot = Math.sin(ph * TAU) * 0.05;
        bodyH = 11;
      }
      if (!s) return;
      // spawn: dashed construction circle + the drawing is "drafted" from the feet up
      if (e.spawnT < 1) {
        const q = U.clamp(e.spawnT, 0, 1), r = e.r * (2.6 - 1.4 * q);
        ctx.setLineDash([2, 1.5]);
        ctx.beginPath(); ctx.ellipse(e.x, e.y, r, r * 0.42, 0, 0, TAU);
        ctx.lineWidth = 0.5; ctx.strokeStyle = W_(0.75 * (1 - q * 0.6)); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); centerMark(ctx, e.x, e.y, 1.5, r - 1); ctx.lineWidth = 0.35; ctx.strokeStyle = W_(0.6); ctx.stroke();
        if (q < 0.08) return;
        const v0 = 1 - U.clamp((q - 0.08) / 0.82, 0, 1);
        putCrop(ctx, V, s, e.x, y, sc, left, 0, 1, v0, 1);
        if (v0 > 0.01) {
          const yy = y + (v0 * s.c.height - s.oy) / s.k * sc;
          ctx.beginPath(); ctx.moveTo(e.x - e.r * 1.3, yy); ctx.lineTo(e.x + e.r * 1.3, yy);
          ctx.lineWidth = 0.6; ctx.strokeStyle = C.ink; ctx.stroke();
        }
        return;
      }
      // exploded view: the parts separate along the vertical axis on a chain centre line, a red-pencil X
      // strikes them out, then the eraser wipes them away
      if (e.dying) {
        const q = U.clamp(e.deathT, 0, 1);
        const H = s.c.height, cuts = [0, Math.round(H * 0.42) / H, Math.round(H * 0.72) / H, 1];
        const ex = U.ease.outQuad(U.clamp(q / 0.42, 0, 1)), big = e.type === 'colossus' ? 1.8 : 1;
        const lifts = [-9 * big * ex, -4 * big * ex, 0];
        const wipe = U.clamp((q - 0.5) / 0.45, 0, 1), fa = q > 0.8 ? 1 - (q - 0.8) / 0.2 : 1;
        ctx.globalAlpha = 0.6 * fa;
        ctx.setLineDash(CHAIN);
        ctx.beginPath(); ctx.moveTo(e.x, y + 2); ctx.lineTo(e.x, y - (bodyH * 2.3 + 9 * big) * sc * Math.max(ex, 0.4));
        ctx.lineWidth = 0.4; ctx.strokeStyle = W_(0.9); ctx.stroke(); ctx.setLineDash([]);
        if (wipe < 1) for (let k = 0; k < 3; k++) {
          ctx.globalAlpha = (1 - wipe * 0.45) * fa;
          putCrop(ctx, V, s, e.x, y + lifts[k], sc, left, wipe, 1, cuts[k], cuts[k + 1]);
        }
        ctx.globalAlpha = 1;
        const cx = e.x, cy = y - bodyH * sc - 3 * big * ex, R = Math.max(5, e.r * 0.95);
        const k1 = U.clamp((q - 0.22) / 0.3, 0, 1), k2 = U.clamp((q - 0.38) / 0.3, 0, 1);
        const strokeX = (ax, ay, bx, by, k) => { if (k <= 0) return; ctx.moveTo(ax, ay); ctx.lineTo(ax + (bx - ax) * k, ay + (by - ay) * k); };
        ctx.beginPath(); strokeX(cx - R, cy - R, cx + R, cy + R, k1); strokeX(cx + R, cy - R * 0.9, cx - R * 0.9, cy + R, k2);
        ctx.globalAlpha = fa; ctx.lineWidth = 2.6; ctx.strokeStyle = 'rgba(6,42,74,0.7)'; ctx.stroke();
        ctx.lineWidth = 1.2; ctx.strokeStyle = C.red; ctx.stroke(); ctx.globalAlpha = 1;
        return;
      }
      const fl = e.flash, kd = fl > 0.02 ? (e.kx > 0 ? 1 : e.kx < 0 ? -1 : 0) : 0;
      if (fl > 0.02) {
        // hit: a second, misregistered pencil pass offset along the push (the drawing jolts), then a faint pale flash
        ctx.globalAlpha = 0.55 * fl;
        put(ctx, V, s, e.x - kd * 2.4 * fl, y - 0.8 * fl, sc, sc, rot - kd * 0.12 * fl, left);
        ctx.globalAlpha = 1;
        rot += kd * 0.14 * fl;
      }
      if (e.type === 'ghost') {
        put(ctx, V, s, e.x, y, sc, sc, rot, left);
      } else if (e.type === 'colossus') {
        put(ctx, V, s, e.x, y, sc, sc, rot * 0.5, left);
        // measurement callout on the boiler (drawn live so the lettering never mirrors)
        const f = left ? -1 : 1, fr = Math.floor(mod(e.anim * 0.3 + e.seed, 1) * 6) % 6, bob = -Math.abs(Math.sin(fr / 6 * TAU)) * 1.3 * sc;
        const ax = e.x - f * 10.5 * sc, ay = y + (-27 * sc) + bob, bx = e.x - f * 20 * sc, by = y - 35 * sc + bob, cx2 = e.x - f * 30 * sc;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx2, by);
        ctx.lineWidth = 0.4; ctx.strokeStyle = W_(0.6); ctx.stroke();
        ctx.beginPath(); ctx.arc(ax, ay, 0.6, 0, TAU); ctx.fillStyle = W_(0.8); ctx.fill();
        strokeText(ctx, 'Ø28', (bx + cx2) / 2, by - 1.2, 3.6, W_(0.7), 0.4, 'center');
      } else {
        put(ctx, V, s, e.x, y, sc, sc, rot, left);
      }
      if (fl > 0.45) {
        ctx.globalAlpha = Math.min(0.42, (fl - 0.45) * 1.2);
        put(ctx, V, s.flash, e.x, y, sc * (1 + 0.06 * fl), sc * (1 + 0.06 * fl), rot, left);
        ctx.globalAlpha = 1;
      }
    },

    drawPlayer(ctx, p, view) {
      const V = tf(view), H = SPR.hero;
      let s, rot = 0, sx = 1, sy = 1, lift = 0;
      if (p.dashT > 0.165) { s = H.idle[0]; sx = 1.08; sy = 0.88; }    // anticipation: a quick crouch before the dash
      else if (p.dashT > 0) s = H.dash;
      else if (p.moving) {
        const ph = mod(p.anim * 0.16, 1);
        s = H.walk[Math.floor(ph * 8) % 8];
      } else s = H.idle[Math.floor(mod(view.rt * 1.4, 1) * 4) % 4];
      if (p.levelT > 0) { const w = Math.sin(p.levelT * PI * 3) * p.levelT; sx *= 1 - 0.08 * w; sy *= 1 + 0.1 * w; }
      if (p.shootT > 0) { sx *= 1 + 0.03 * p.shootT; sy *= 1 - 0.03 * p.shootT; }
      const hurt = p.hurtT > 0;
      const left = p.facing < 0;
      if (hurt) rot = Math.sin(view.rt * 60) * 0.05 * p.hurtT;
      if (p.dashT > 0) {
        // after-images drawn as dashed ghosts of the outline
        for (let i = 3; i >= 1; i--) {
          ctx.globalAlpha = 0.12 * (4 - i) / 3;
          put(ctx, V, s.flash, p.x - p.dashX * i * 7, p.y - p.dashY * i * 7, sx, sy, 0, left);
        }
        ctx.globalAlpha = 1;
      }
      let a = 1;
      if (p.iframes > 0 && !hurt && p.dashT <= 0 && (Math.floor(view.rt * 14) & 1)) a = 0.7;
      ctx.globalAlpha = a;
      put(ctx, V, s, p.x, p.y - lift, sx, sy, rot, left);
      if (hurt && s.red) { ctx.globalAlpha = Math.min(0.85, p.hurtT * 1.1); put(ctx, V, s.red, p.x, p.y - lift, sx, sy, rot, left); }
      ctx.globalAlpha = 1;
    },

    drawOrbital(ctx, o, view) {
      const V = tf(view);
      // trailing dashed arc through the last positions
      const tr = o._bp || (o._bp = []);
      tr.push(o.x, o.y);
      if (tr.length > 22) tr.splice(0, tr.length - 22);
      if (tr.length >= 6) {
        ctx.setLineDash([1.8, 1.6]);
        ctx.beginPath(); ctx.moveTo(tr[0], tr[1] + 2); for (let i = 2; i < tr.length; i += 2) ctx.lineTo(tr[i], tr[i + 1] + 2);
        ctx.lineWidth = 0.6; ctx.strokeStyle = A_(0.55); ctx.stroke();
        ctx.setLineDash([]);
      }
      put(ctx, V, SPR.shadow, o.x, o.y + 8, 0.45, 0.45, 0, false);
      put(ctx, V, SPR.disc, o.x, o.y - 2 + Math.sin(view.rt * 4 + o.idx * 1.7) * 1.2, 0.85, 0.85, view.rt * 5 + o.idx, false);
    },

    drawProjectile(ctx, pr, view) {
      const V = tf(view);
      const tr = pr._bp || (pr._bp = []);
      const n = tr.length;
      if (!n || Math.hypot(pr.x - tr[n - 2], pr.y - tr[n - 1]) > 4) { tr.push(pr.x, pr.y); if (tr.length > 14) tr.splice(0, 2); }
      if (tr.length >= 4) {
        ctx.setLineDash([2.4, 1.7]);
        ctx.lineDashOffset = -pr.age * 40;
        ctx.beginPath(); ctx.moveTo(tr[0], tr[1]); for (let i = 2; i < tr.length; i += 2) ctx.lineTo(tr[i], tr[i + 1]); ctx.lineTo(pr.x, pr.y);
        ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(6,42,74,0.55)'; ctx.stroke();
        ctx.lineWidth = 0.6; ctx.strokeStyle = W_(0.85); ctx.stroke();
        ctx.setLineDash([]); ctx.lineDashOffset = 0;
        // extension tick at the start of the trajectory
        const a = pr.angle + PI / 2;
        ctx.beginPath(); ctx.moveTo(tr[0] + Math.cos(a) * 2, tr[1] + Math.sin(a) * 2); ctx.lineTo(tr[0] - Math.cos(a) * 2, tr[1] - Math.sin(a) * 2);
        ctx.lineWidth = 0.45; ctx.strokeStyle = W_(0.5); ctx.stroke();
      }
      put(ctx, V, SPR.arrow, pr.x, pr.y, 1, 1, pr.angle, false);
    },

    drawParticle(ctx, pt, view) {
      const t = 1 - pt.life / pt.max, z = pt.z || 0;
      const fade = U.clamp(pt.life / pt.max * 1.6, 0, 1);
      switch (pt.kind) {
        case 'bp-ring': {
          const r = pt.r0 + (pt.r1 - pt.r0) * U.ease.outQuad(t), sq = pt.sq || 1;
          ctx.globalAlpha = 1 - t;
          if (pt.dash) ctx.setLineDash([2.2, 1.5]);
          ctx.beginPath(); ctx.ellipse(pt.x, pt.y - z, r, r * sq, 0, 0, TAU);
          ctx.lineWidth = pt.lw; ctx.strokeStyle = pt.color; ctx.stroke();
          if (pt.dash) ctx.setLineDash([]);
          if (pt.label) {
            const a = -0.65, ex = pt.x + Math.cos(a) * r, ey = pt.y - z + Math.sin(a) * r * sq;
            ctx.beginPath(); ctx.moveTo(pt.x, pt.y - z); ctx.lineTo(ex, ey); ctx.lineWidth = pt.lw * 0.7; ctx.stroke();
            ctx.beginPath(); arrowHead(ctx, ex, ey, Math.atan2(ey - pt.y + z, ex - pt.x), 3, 1.1); ctx.fillStyle = pt.color; ctx.fill();
            ctx.beginPath(); centerMark(ctx, pt.x, pt.y - z, 1, 1.4); ctx.lineWidth = 0.35; ctx.stroke();
            strokeText(ctx, pt.label + Math.round(r), ex + 2, ey - 1.5, 4, pt.color, 0.45, 'left');
          }
          ctx.globalAlpha = 1;
          return;
        }
        case 'bp-cross': {
          const s = pt.size * (1.3 - 0.6 * t);
          ctx.globalAlpha = 1 - t * t;
          ctx.beginPath(); centerMark(ctx, pt.x, pt.y - z, s * 0.6, s * 0.7);
          ctx.moveTo(pt.x + s * 0.6, pt.y - z); ctx.arc(pt.x, pt.y - z, s * 0.6, 0, TAU);
          ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(6,42,74,0.6)'; ctx.stroke();
          ctx.lineWidth = 0.55; ctx.strokeStyle = pt.color || C.ink; ctx.stroke();
          ctx.globalAlpha = 1;
          return;
        }
        case 'bp-tick': {
          const l = pt.size * (1 - t * 0.6), a = Math.atan2(pt.vy, pt.vx) || pt.rot;
          ctx.globalAlpha = fade;
          ctx.beginPath(); ctx.moveTo(pt.x, pt.y - z); ctx.lineTo(pt.x - Math.cos(a) * l, pt.y - z - Math.sin(a) * l);
          ctx.lineWidth = 0.6; ctx.strokeStyle = pt.color || C.ink; ctx.stroke();
          ctx.globalAlpha = 1;
          return;
        }
        case 'bp-crumb': {
          const s = pt.size, a = pt.rot;
          ctx.globalAlpha = fade;
          ctx.beginPath(); ctx.moveTo(pt.x - Math.cos(a) * s, pt.y - z - Math.sin(a) * s); ctx.lineTo(pt.x + Math.cos(a) * s, pt.y - z + Math.sin(a) * s);
          ctx.lineWidth = s + 0.8; ctx.strokeStyle = 'rgba(6,42,74,0.7)'; ctx.stroke();
          ctx.lineWidth = s; ctx.strokeStyle = pt.color || C.eraser; ctx.stroke();
          ctx.globalAlpha = 1;
          return;
        }
        case 'bp-dust': {
          ctx.globalAlpha = fade * 0.8;
          ctx.beginPath(); ctx.arc(pt.x, pt.y - z, pt.size * (1 + t), 0, TAU); ctx.fillStyle = pt.color || W_(0.6); ctx.fill();
          ctx.globalAlpha = 1;
          return;
        }
        case 'bp-speed': {
          const l = pt.size * (1 - t * 0.5);
          ctx.globalAlpha = fade * 0.9;
          ctx.setLineDash([2.4, 1.6]);
          ctx.beginPath(); ctx.moveTo(pt.x, pt.y - z); ctx.lineTo(pt.x - pt.dx * l, pt.y - z - pt.dy * l);
          ctx.lineWidth = 0.6; ctx.strokeStyle = pt.color || C.ink; ctx.stroke();
          ctx.setLineDash([]); ctx.globalAlpha = 1;
          return;
        }
        case 'bp-dim': {
          ctx.globalAlpha = Math.min(1, (1 - t) * 1.8) * Math.min(1, t * 8);
          dimLine(ctx, pt.x, pt.y, pt.x2, pt.y2, pt.off || 8, pt.label, pt.color || C.ink, 0.45, 3.6);
          ctx.globalAlpha = 1;
          return;
        }
        case 'bp-check': {
          const s = pt.size * (t < 0.2 ? U.ease.outBack(t / 0.2) : 1), x = pt.x, y = pt.y - z;
          ctx.globalAlpha = fade;
          ctx.beginPath(); ctx.moveTo(x - 2 * s, y); ctx.lineTo(x - 0.6 * s, y + 1.6 * s); ctx.lineTo(x + 2.6 * s, y - 2.2 * s);
          ctx.lineWidth = 2.2; ctx.strokeStyle = 'rgba(6,42,74,0.7)'; ctx.stroke();
          ctx.lineWidth = 0.9; ctx.strokeStyle = pt.color || C.amber; ctx.stroke();
          ctx.globalAlpha = 1;
          return;
        }
        case 'bp-stamp': {
          const sc = t < 0.15 ? 1.7 - 0.7 * U.ease.outQuad(t / 0.15) : 1;
          const str = pt.label || 'APPROVED', h = 4.4, w = textWidth(str, h);
          ctx.save(); ctx.globalAlpha = t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1;
          ctx.translate(pt.x, pt.y - z); ctx.rotate(-0.16); ctx.scale(sc, sc);
          ctx.beginPath(); rrect(ctx, -w / 2 - 3, -h / 2 - 3, w + 6, h + 6, 1.2);
          ctx.lineWidth = 3.2; ctx.strokeStyle = 'rgba(6,42,74,0.65)'; ctx.stroke();
          ctx.lineWidth = 1.0; ctx.strokeStyle = pt.color; ctx.stroke();
          ctx.beginPath(); rrect(ctx, -w / 2 - 1.6, -h / 2 - 1.6, w + 3.2, h + 3.2, 0.8); ctx.lineWidth = 0.35; ctx.stroke();
          ctx.beginPath(); textPath(ctx, str, 0, h / 2, h, 'center');
          ctx.lineWidth = 2.4; ctx.strokeStyle = 'rgba(6,42,74,0.65)'; ctx.stroke();
          ctx.lineWidth = 0.75; ctx.strokeStyle = pt.color; ctx.stroke();
          ctx.restore();
          return;
        }
        case 'bp-scrib': {
          const n = Math.max(2, Math.floor(Math.min(1, t * 3) * 14)), r = pt.size;
          ctx.globalAlpha = fade;
          ctx.beginPath();
          for (let i = 0; i < n; i++) {
            const a = i * 2.4 + pt.seed * 9, rr = r * (0.55 + 0.45 * U.hash2(i, 3, pt.seed * 999 | 0));
            const x = pt.x + Math.cos(a) * rr, y = pt.y - z + Math.sin(a) * rr * 0.7;
            if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
          }
          ctx.lineWidth = 0.7; ctx.strokeStyle = pt.color || C.red; ctx.stroke();
          ctx.globalAlpha = 1;
          return;
        }
        default: {
          // particles from other styles' event hooks (or the core fallback burst)
          const a = U.clamp(pt.life / pt.max, 0, 1);
          ctx.globalAlpha = a;
          ctx.fillStyle = pt.color || C.ink;
          const s = pt.size || 2;
          ctx.fillRect(pt.x - s / 2, pt.y - z - s / 2, s, s);
          ctx.globalAlpha = 1;
        }
      }
    },

    drawNumber(ctx, n, view) {
      const V = tf(view), s = numSprite(n.value, n.crit), t = 1 - n.life / n.max;
      let sc = t < 0.12 ? 0.55 + (t / 0.12) * 0.6 : t < 0.25 ? 1.15 - ((t - 0.12) / 0.13) * 0.15 : 1;
      ctx.globalAlpha = t > 0.7 ? Math.max(0, 1 - (t - 0.7) / 0.3) : 1;
      put(ctx, V, s, n.x + 3, n.y, sc, sc, 0, false);
      ctx.globalAlpha = 1;
    },

    drawScreenOverlay(ctx, view, game) {
      // red-pencil edge marks when the main character is hurt
      const p = game && game.player;
      if (!p || p.hurtT <= 0) return;
      const W = view.W, H = view.H, a = p.hurtT;
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.56);
      g.addColorStop(0, 'rgba(255,91,77,0)'); g.addColorStop(1, 'rgba(255,91,77,' + (0.32 * a) + ')');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    },

    drawDisplayOverlay(ctx, view) {
      const W = view.displayW, H = view.displayH, key = W + 'x' + H;
      if (key !== OVLkey) { OVL = buildOverlay(W, H); OVLkey = key; }
      ctx.drawImage(OVL, 0, 0);
    },

    drawIcon(ctx, id, size) {
      const fn = ICONS[id] || ICONS.dmg;
      ctx.save();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.scale(size / 24, size / 24);
      iconPaint(ctx, fn);
      ctx.restore();
    },

    /* ------------------------------------------------------------ events */
    onHit(game, e) {
      const h = e.type === 'colossus' ? 30 : e.type === 'ghost' ? 18 : 11;
      P_(game, { kind: 'bp-cross', x: e.x + (Math.random() - 0.5) * 4, y: e.y, z: h + (Math.random() - 0.5) * 4, size: e.type === 'colossus' ? 7 : 5, life: 0.2, drag: 0, color: C.ink });
      for (let i = 0; i < 2; i++) {
        const a = Math.random() * TAU, sp = 70 + Math.random() * 60;
        P_(game, { kind: 'bp-tick', x: e.x, y: e.y, z: h, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 5, life: 0.22, size: 3.2, color: i ? C.pale : C.ink });
      }
    },
    onKill(game, e) {
      const big = e.type === 'colossus', ghost = e.type === 'ghost';
      const h = big ? 26 : ghost ? 16 : 10, n = big ? 14 : 6;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU, sp = (big ? 60 : 40) * (0.5 + Math.random());
        P_(game, { kind: 'bp-crumb', x: e.x, y: e.y, z: h * (0.5 + Math.random() * 0.6), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 40 + Math.random() * 50, grav: 240, drag: 1.6, life: 0.6 + Math.random() * 0.4, size: 0.9 + Math.random() * 0.8, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 10, color: i % 4 === 3 ? '#e9e0d0' : C.eraser });
      }
      for (let i = 0; i < (big ? 8 : 4); i++) {
        const a = Math.random() * TAU, sp = 15 + Math.random() * 30;
        P_(game, { kind: 'bp-dust', x: e.x + Math.cos(a) * 4, y: e.y, z: h * Math.random(), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5, vz: 10, drag: 3, life: 0.5 + Math.random() * 0.3, size: 0.6 + Math.random() * 0.6, color: W_(0.55) });
      }
      ringP(game, e.x, e.y, 0, e.r * 0.8, e.r * (big ? 3.6 : 2.6), big ? 0.6 : 0.42, W_(0.8), 0.42, true, big ? 'R' : '', 0.55);
      if (big) game.shake = Math.max(game.shake || 0, 3);
    },
    onHurt(game, p) {
      P_(game, { kind: 'bp-scrib', x: p.x, y: p.y, z: 18, size: 9, life: 0.55, drag: 0, color: C.red, seed: Math.random() });
      ringP(game, p.x, p.y, 14, 5, 20, 0.3, C.red, 1, false, '', 0.7);
      for (let i = 0; i < 5; i++) {
        const a = Math.random() * TAU, sp = 70 + Math.random() * 60;
        P_(game, { kind: 'bp-tick', x: p.x, y: p.y, z: 14, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 4, life: 0.3, size: 3.6, color: C.red });
      }
    },
    onDash(game, p) {
      const L = game.stats ? game.stats.speed * 3.4 * 0.2 : 60;
      P_(game, { kind: 'bp-dim', x: p.x, y: p.y, x2: p.x + p.dashX * L, y2: p.y + p.dashY * L, off: p.dashX >= 0 ? 10 : -10, label: 'Δ ' + Math.round(L), life: 0.7, drag: 0, color: W_(0.9) });
      ringP(game, p.x, p.y, 0, 3, 12, 0.35, W_(0.8), 0.42, true, '', 0.5);
      for (let i = 0; i < 4; i++) {
        P_(game, { kind: 'bp-speed', x: p.x - p.dashX * 4, y: p.y, z: 6 + i * 5, dx: p.dashX, dy: p.dashY, vx: p.dashX * 160, vy: p.dashY * 160, drag: 6, life: 0.32, size: 12 + i * 2, color: C.ink });
      }
    },
    onShoot(game, pr) {
      if (Math.random() < 0.5) P_(game, { kind: 'bp-cross', x: pr.x, y: pr.y + 4, z: 4, size: 2.6, life: 0.14, drag: 0, color: C.pale });
    },
    onPickup(game, g) {
      const p = game.player;
      P_(game, { kind: 'bp-check', x: p.x + (Math.random() - 0.5) * 12, y: p.y, z: 22 + Math.random() * 6, vz: 18, size: g.big ? 1.4 : 0.95, life: 0.5, drag: 0, color: C.amber });
      if (g.big) ringP(game, p.x, p.y, 0, 3, 14, 0.3, A_(0.9), 0.42, false, '', 0.5);
    },
    onLevelUp(game, p) {
      ringP(game, p.x, p.y, 0, 6, 64, 0.9, A_(0.95), 0.45, true, 'R', 0.7);
      ringP(game, p.x, p.y, 0, 4, 40, 0.7, W_(0.8), 0.45, false, '', 0.45);
      P_(game, { kind: 'bp-stamp', x: p.x, y: p.y, z: 44, life: 1.2, drag: 0, color: C.amber, label: 'APPROVED' });
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU, sp = 90;
        P_(game, { kind: 'bp-tick', x: p.x + Math.cos(a) * 8, y: p.y + Math.sin(a) * 4, z: 10, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5, drag: 3, life: 0.5, size: 4, color: C.amber });
      }
    },
    onDeath(game, p) {
      P_(game, { kind: 'bp-stamp', x: p.x, y: p.y, z: 40, life: 2.2, drag: 0, color: C.red, label: 'VOID' });
      for (let i = 0; i < 18; i++) {
        const a = Math.random() * TAU, sp = 40 + Math.random() * 80;
        P_(game, { kind: 'bp-crumb', x: p.x, y: p.y, z: 14, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 50 + Math.random() * 50, grav: 240, drag: 1.5, life: 0.9 + Math.random() * 0.5, size: 1.2, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 10, color: C.eraser });
      }
      ringP(game, p.x, p.y, 0, 6, 70, 1, C.red, 0.45, true, 'R', 0.7);
    },
  });

  /* ---- display overlay: lamp light, vignette, sheet border with zone marks, title block ---- */
  function buildOverlay(W, H) {
    const { c, ctx } = U.canvas(W, H);
    const u = Math.max(0.6, H / 900);
    // desk-lamp light from the upper left + vignette
    const gl = ctx.createRadialGradient(W * 0.22, H * 0.12, 0, W * 0.22, H * 0.12, Math.hypot(W, H) * 0.6);
    gl.addColorStop(0, 'rgba(190,232,255,0.07)'); gl.addColorStop(1, 'rgba(190,232,255,0)');
    ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    const gv = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.36, W / 2, H / 2, Math.hypot(W, H) * 0.58);
    gv.addColorStop(0, 'rgba(3,22,42,0)'); gv.addColorStop(0.7, 'rgba(3,22,42,0.22)'); gv.addColorStop(1, 'rgba(2,16,32,0.6)');
    ctx.fillStyle = gv; ctx.fillRect(0, 0, W, H);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // border: thin outer line, zone strip, heavier inner line
    const o1 = 7 * u, o2 = 21 * u;
    ctx.fillStyle = 'rgba(4,30,56,0.5)';
    ctx.fillRect(0, 0, W, o2); ctx.fillRect(0, H - o2, W, o2); ctx.fillRect(0, o2, o2, H - 2 * o2); ctx.fillRect(W - o2, o2, o2, H - 2 * o2);
    ctx.strokeStyle = 'rgba(226,244,255,0.5)'; ctx.lineWidth = 1 * u; ctx.strokeRect(o1, o1, W - 2 * o1, H - 2 * o1);
    ctx.strokeStyle = 'rgba(226,244,255,0.75)'; ctx.lineWidth = 2 * u; ctx.strokeRect(o2, o2, W - 2 * o2, H - 2 * o2);
    const nx = Math.max(4, Math.round(W / (200 * u))), ny = Math.max(3, Math.round(H / (200 * u)));
    ctx.beginPath();
    for (let i = 1; i < nx; i++) { const x = o2 + (W - 2 * o2) * i / nx; ctx.moveTo(x, o1); ctx.lineTo(x, o2); ctx.moveTo(x, H - o1); ctx.lineTo(x, H - o2); }
    for (let i = 1; i < ny; i++) { const y = o2 + (H - 2 * o2) * i / ny; ctx.moveTo(o1, y); ctx.lineTo(o2, y); ctx.moveTo(W - o1, y); ctx.lineTo(W - o2, y); }
    ctx.lineWidth = 1 * u; ctx.strokeStyle = 'rgba(226,244,255,0.5)'; ctx.stroke();
    const th = 7 * u;
    for (let i = 0; i < nx; i++) {
      const x = o2 + (W - 2 * o2) * (i + 0.5) / nx, L = String.fromCharCode(65 + (nx - 1 - i) % 26);
      strokeText(ctx, L, x, o1 + (o2 - o1 + th) / 2, th, 'rgba(226,244,255,0.7)', 1.1 * u, 'center');
      strokeText(ctx, L, x, H - o2 + (o2 - o1 + th) / 2, th, 'rgba(226,244,255,0.7)', 1.1 * u, 'center');
    }
    for (let i = 0; i < ny; i++) {
      const y = o2 + (H - 2 * o2) * (i + 0.5) / ny + th / 2, L = String(i + 1);
      strokeText(ctx, L, (o1 + o2) / 2, y, th, 'rgba(226,244,255,0.7)', 1.1 * u, 'center');
      strokeText(ctx, L, W - (o1 + o2) / 2, y, th, 'rgba(226,244,255,0.7)', 1.1 * u, 'center');
    }
    // centring marks
    ctx.beginPath();
    ctx.moveTo(W / 2, o2); ctx.lineTo(W / 2, o2 + 12 * u); ctx.moveTo(W / 2, H - o2); ctx.lineTo(W / 2, H - o2 - 12 * u);
    ctx.moveTo(o2, H / 2); ctx.lineTo(o2 + 12 * u, H / 2); ctx.moveTo(W - o2, H / 2); ctx.lineTo(W - o2 - 12 * u, H / 2);
    ctx.lineWidth = 2 * u; ctx.strokeStyle = 'rgba(226,244,255,0.75)'; ctx.stroke();
    // title block (bottom right)
    const bw = 300 * u, bh = 74 * u, bx = W - o2 - bw, by = H - o2 - bh;
    ctx.fillStyle = 'rgba(6,42,74,0.82)'; ctx.fillRect(bx, by, bw, bh);
    ctx.lineWidth = 2 * u; ctx.strokeStyle = 'rgba(226,244,255,0.8)'; ctx.strokeRect(bx, by, bw, bh);
    ctx.beginPath();
    ctx.moveTo(bx, by + bh * 0.5); ctx.lineTo(bx + bw, by + bh * 0.5);
    ctx.moveTo(bx + bw * 0.62, by); ctx.lineTo(bx + bw * 0.62, by + bh);
    ctx.moveTo(bx + bw * 0.62, by + bh * 0.25); ctx.lineTo(bx + bw, by + bh * 0.25);
    ctx.moveTo(bx + bw * 0.81, by + bh * 0.5); ctx.lineTo(bx + bw * 0.81, by + bh);
    ctx.lineWidth = 1 * u; ctx.strokeStyle = 'rgba(226,244,255,0.6)'; ctx.stroke();
    const lab = (s, x, y, h, a) => strokeText(ctx, s, x, y, h * u, 'rgba(169,220,246,' + (a || 0.8) + ')', 0.9 * u, 'left');
    const val = (s, x, y, h) => strokeText(ctx, s, x, y, h * u, 'rgba(242,250,255,0.95)', 1.3 * u, 'left');
    lab('TITLE', bx + 7 * u, by + 10 * u, 5);
    val('FIELD STUDY', bx + 7 * u, by + 30 * u, 10);
    lab('DRAWN', bx + 7 * u, by + bh * 0.5 + 10 * u, 5);
    strokeText(ctx, 'K. Draftwell', bx + 7 * u, by + bh - 9 * u, 9 * u, 'rgba(255,207,74,0.9)', 1.1 * u, 'left', true, 0.8 * u, 5);
    lab('SHEET', bx + bw * 0.62 + 6 * u, by + 9 * u, 4.5);
    val('04 / 12', bx + bw * 0.62 + 40 * u, by + 13 * u, 7);
    lab('SCALE', bx + bw * 0.62 + 6 * u, by + bh * 0.25 + 9 * u, 4.5);
    val('1:20', bx + bw * 0.62 + 40 * u, by + bh * 0.25 + 13 * u, 7);
    lab('REV', bx + bw * 0.62 + 6 * u, by + bh * 0.5 + 10 * u, 5);
    val('B', bx + bw * 0.62 + 14 * u, by + bh - 8 * u, 12);
    lab('DATE', bx + bw * 0.81 + 6 * u, by + bh * 0.5 + 10 * u, 5);
    val('10.26', bx + bw * 0.81 + 6 * u, by + bh - 9 * u, 8);
    // revision triangle next to the block
    ctx.beginPath(); ctx.moveTo(bx - 18 * u, by + bh - 30 * u); ctx.lineTo(bx - 7 * u, by + bh - 10 * u); ctx.lineTo(bx - 29 * u, by + bh - 10 * u); ctx.closePath();
    ctx.lineWidth = 1.3 * u; ctx.strokeStyle = 'rgba(255,91,77,0.8)'; ctx.stroke();
    strokeText(ctx, 'B', bx - 18 * u, by + bh - 13 * u, 8 * u, 'rgba(255,91,77,0.9)', 1.2 * u, 'center');
    return c;
  }
})();
