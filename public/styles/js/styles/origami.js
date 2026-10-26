/* Origami Fold ("origami") – a world folded from washi paper.
   Every character, creature, prop, collectible and icon is a little fold mesh: flat triangular facets with a pseudo
   height per vertex. One light from the upper left gives each facet a flat tone from a 4-step ramp per paper colour
   (light / base / shade / deep); shared edges are classified automatically as mountain folds (thin bright line) or
   valley folds (thin dark line), open edges get a deep paper edge. Kami paper is two-sided: undersides, hems,
   inner ears and wing backs show the cream back of the sheet.
   The ground is one huge sheet with a pyramid crease tessellation; coloured sheets lie on top with straight folded
   hems and offset drop shadows, water is a Miura-ori pleated blue sheet sunk below the paper. */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2, PI = Math.PI;
  const clamp = U.clamp;

  /* ================================================================ palette */
  // 4-step ramps: [light, base, shade, deep]
  const RAMP = {
    coral: ['#f7a283', '#e8755b', '#c95b47', '#9b4136'],
    cream: ['#fffbf3', '#f3e9d6', '#dccbae', '#b5a083'],
    indigo: ['#7488c9', '#4f62a6', '#3b4a87', '#283462'],
    teal: ['#63c2b3', '#35a194', '#277f76', '#1a5b56'],
    sage: ['#bdd39b', '#98b37d', '#779562', '#587149'],
    mustard: ['#f8d372', '#e6ae42', '#c68c2d', '#936624'],
    blush: ['#f9c0bd', '#ee9597', '#cd7279', '#9d525c'],
    plum: ['#9a7fbb', '#76599b', '#5a447c', '#3f3059'],
    pine: ['#88c197', '#60a077', '#46805c', '#305d44'],
    wood: ['#d4ae83', '#b0875e', '#8b6543', '#63472f'],
    stone: ['#e6e1da', '#cac3ba', '#a8a098', '#7f7873'],
    sky: ['#b8d1f0', '#91b1e1', '#7293cc', '#5574ae'],
    ink: ['#5a5368', '#3d3747', '#2e2936', '#201c27'],
  };
  const INK = '#2a2433';
  const hexA = (h) => U.hex(h);
  const mixHex = (a, b, t) => U.rgb(U.mix(hexA(a), hexA(b), t));
  // derived line colours per ramp
  const LINE = {};
  for (const k in RAMP) {
    const r = RAMP[k];
    LINE[k] = {
      edge: mixHex(r[3], INK, 0.38),           // open paper edge (silhouette)
      hi: mixHex(r[0], '#ffffff', 0.55),        // mountain fold highlight
      lo: mixHex(r[3], INK, 0.15),              // valley fold
    };
  }
  // ground sheets (pale washi) – region ids: 0 base paper, 1 meadow, 2 field (villages), 3 blossom (orchards),
  // 4 shore band, 5 water, 6 grove. LAYER = stacking order of the sheets (water is sunk below everything).
  const GROUND = [
    hexA('#f4eee1'), hexA('#d5e1c0'), hexA('#f2dca6'), hexA('#f3cebe'), hexA('#c3dfd6'), hexA('#88a8d8'), hexA('#b7cf9e'),
  ];
  const BASE = 0, MEADOW = 1, FIELD = 2, BLOSSOM = 3, SHORE = 4, WATER = 5, GROVE = 6;
  const LAYER = [2, 3, 5, 5, 1, 0, 4];
  const SHADOW = 'rgb(78,56,72)';

  /* ============================================================== light */
  const LV = (() => { const v = [-0.55, -0.45, 0.7], l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; })();
  function toneOf(nx, ny, nz) {
    const d = nx * LV[0] + ny * LV[1] + nz * LV[2];
    return d > 0.8 ? 0 : d > 0.55 ? 1 : d > 0.3 ? 2 : 3;
  }

  /* ========================================================= fold meshes */
  function Fold() { this.v = []; this.f = []; this.idx = new Map(); this.dots = []; this.lines = []; this.T = null; }
  /** Transform for following points: rotate by rot, scale s, then translate. */
  Fold.prototype.at = function (tx, ty, s, rot) {
    if (tx === undefined) { this.T = null; return this; }
    this.T = { tx, ty, s: s || 1, c: Math.cos(rot || 0), sn: Math.sin(rot || 0) };
    return this;
  };
  Fold.prototype.pt = function (p) {
    let x = p[0], y = p[1], z = p[2] || 0;
    const T = this.T;
    if (T) { const X = x * T.c - y * T.sn, Y = x * T.sn + y * T.c; x = T.tx + X * T.s; y = T.ty + Y * T.s; z *= T.s; }
    const k = Math.round(x * 64) + ',' + Math.round(y * 64) + ',' + Math.round(z * 64);
    let i = this.idx.get(k);
    if (i === undefined) { i = this.v.length / 3; this.v.push(x, y, z); this.idx.set(k, i); }
    return i;
  };
  Fold.prototype.tri = function (a, b, c, col) {
    const key = Array.isArray(col) ? col[0] : col, off = Array.isArray(col) ? col[1] : 0;
    this.f.push({ a: this.pt(a), b: this.pt(b), c: this.pt(c), key, off });
    return this;
  };
  Fold.prototype.quad = function (a, b, c, d, col) { this.tri(a, b, c, col); return this.tri(a, c, d, col); };
  /** Kite folded along the A–B axis (A, B raised), P and Q are the side corners. */
  Fold.prototype.kite = function (A, B, P, Q, col, colQ) { this.tri(A, P, B, col); return this.tri(A, B, Q, colQ || col); };
  /** Folded strip from p0 to p1 (widths w0, w1), centre crease raised by z. */
  Fold.prototype.strip = function (p0, p1, w0, w1, z, col, colR) {
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l, ny = dx / l;
    const L0 = [p0[0] + nx * w0 / 2, p0[1] + ny * w0 / 2, 0], R0 = [p0[0] - nx * w0 / 2, p0[1] - ny * w0 / 2, 0];
    const C0 = [p0[0], p0[1], z];
    if (w1 <= 0) {
      const C1 = [p1[0], p1[1], z * 0.3];
      this.tri(L0, C0, C1, col); return this.tri(C0, R0, C1, colR || col);
    }
    const L1 = [p1[0] + nx * w1 / 2, p1[1] + ny * w1 / 2, 0], R1 = [p1[0] - nx * w1 / 2, p1[1] - ny * w1 / 2, 0];
    const C1 = [p1[0], p1[1], z];
    this.quad(L0, C0, C1, L1, col);
    return this.quad(C0, R0, R1, C1, colR || col);
  };
  Fold.prototype.fan = function (c, ring, col, open) {
    const n = ring.length;
    for (let i = 0; i < (open ? n - 1 : n); i++) this.tri(c, ring[i], ring[(i + 1) % n], typeof col === 'function' ? col(i) : col);
    return this;
  };
  Fold.prototype.dot = function (x, y, r, col, hi) {
    const T = this.T;
    if (T) { const X = x * T.c - y * T.sn, Y = x * T.sn + y * T.c; x = T.tx + X * T.s; y = T.ty + Y * T.s; r *= T.s; }
    this.dots.push({ x, y, r, col, hi });
    return this;
  };
  /** Ink line (closed eyes, mouth creases): pts = [x0, y0, x1, y1, ...] in mesh space. */
  Fold.prototype.line = function (pts, w, col) {
    const T = this.T, q = pts.slice();
    if (T) for (let i = 0; i < q.length; i += 2) { const x = q[i], y = q[i + 1]; q[i] = T.tx + (x * T.c - y * T.sn) * T.s; q[i + 1] = T.ty + (x * T.sn + y * T.c) * T.s; }
    this.lines.push({ q, w: w * (T ? T.s : 1), col });
    return this;
  };
  const L3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, (a[2] || 0) + ((b[2] || 0) - (a[2] || 0)) * t];

  /**
   * Draws a fold mesh in the current transform (world units). o: { mirror, ol (edge width), cw (crease width),
   * seam (px-ish width of the anti-seam stroke), alpha, noEdge }.
   */
  function renderFold(ctx, m, o) {
    o = o || {};
    const mir = o.mirror ? -1 : 1;
    const v = m.v, n = v.length / 3;
    const X = new Float32Array(n), Y = new Float32Array(n), Z = new Float32Array(n);
    for (let i = 0; i < n; i++) { X[i] = v[i * 3] * mir; Y[i] = v[i * 3 + 1]; Z[i] = v[i * 3 + 2]; }
    if (o.crumple) {
      // crumpled paper: every shared vertex is pushed a little (the sheet stays connected), facets catch new tones
      const amt = o.crumple, sd = o.cseed || 7;
      for (let i = 0; i < n; i++) {
        X[i] += (U.hash2(i, 1, sd) - 0.5) * amt * 0.9;
        Y[i] += (U.hash2(i, 2, sd) - 0.5) * amt * 0.9;
        Z[i] += (U.hash2(i, 3, sd) - 0.5) * amt * 5;
      }
    }
    const F = m.f, nf = F.length;
    const N = new Float32Array(nf * 3), tone = new Int8Array(nf);
    const edges = new Map();
    for (let i = 0; i < nf; i++) {
      const f = F[i];
      const e1x = X[f.b] - X[f.a], e1y = Y[f.b] - Y[f.a], e1z = Z[f.b] - Z[f.a];
      const e2x = X[f.c] - X[f.a], e2y = Y[f.c] - Y[f.a], e2z = Z[f.c] - Z[f.a];
      let nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
      if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
      const l = Math.hypot(nx, ny, nz) || 1;
      nx /= l; ny /= l; nz /= l;
      N[i * 3] = nx; N[i * 3 + 1] = ny; N[i * 3 + 2] = nz;
      tone[i] = clamp(toneOf(nx, ny, nz) + (f.off || 0), 0, 3);
      const es = [[f.a, f.b, f.c], [f.b, f.c, f.a], [f.c, f.a, f.b]];
      for (const [p, q] of es) {
        const k = p < q ? p * 100003 + q : q * 100003 + p;
        let arr = edges.get(k);
        if (!arr) edges.set(k, (arr = []));
        arr.push(i);
      }
    }
    const ol = o.ol !== undefined ? o.ol : 0.55, cw = o.cw !== undefined ? o.cw : 0.3, seam = o.seam !== undefined ? o.seam : 0.25;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const third = (f, p, q) => (f.a !== p && f.a !== q ? f.a : f.b !== p && f.b !== q ? f.b : f.c);
    for (let i = 0; i < nf; i++) {
      const f = F[i], R = RAMP[f.key] || RAMP.cream, col = R[tone[i]];
      ctx.beginPath();
      ctx.moveTo(X[f.a], Y[f.a]); ctx.lineTo(X[f.b], Y[f.b]); ctx.lineTo(X[f.c], Y[f.c]); ctx.closePath();
      ctx.fillStyle = col; ctx.fill();
      if (seam) { ctx.strokeStyle = col; ctx.lineWidth = seam; ctx.stroke(); }
      const es = [[f.a, f.b], [f.b, f.c], [f.c, f.a]];
      for (const [p, q] of es) {
        const k = p < q ? p * 100003 + q : q * 100003 + p;
        const arr = edges.get(k);
        let j = -1;
        for (const t of arr) if (t !== i) { j = t; break; }
        if (j < 0) {
          if (o.noEdge) continue;
          ctx.strokeStyle = LINE[f.key] ? LINE[f.key].edge : INK; ctx.lineWidth = ol;
          ctx.beginPath(); ctx.moveTo(X[p], Y[p]); ctx.lineTo(X[q], Y[q]); ctx.stroke();
          continue;
        }
        if (j > i) continue;
        // crease between face j (drawn) and face i (now): mountain or valley?
        const g = F[j], d = third(g, p, q);
        const s = N[i * 3] * (X[d] - X[p]) + N[i * 3 + 1] * (Y[d] - Y[p]) + N[i * 3 + 2] * (Z[d] - Z[p]);
        const len = Math.hypot(X[d] - X[p], Y[d] - Y[p]) + 1e-6;
        const rel = s / len;
        const same = g.key === f.key;
        if (Math.abs(rel) < 0.025) {
          if (same) continue;
          ctx.strokeStyle = LINE[tone[i] > tone[j] ? f.key : g.key].lo; ctx.globalAlpha = 0.45; ctx.lineWidth = cw;
        } else if (rel < 0) {
          // mountain: the ridge catches light
          ctx.strokeStyle = LINE[tone[i] < tone[j] ? f.key : g.key].hi; ctx.globalAlpha = 0.9; ctx.lineWidth = cw;
        } else {
          ctx.strokeStyle = LINE[tone[i] > tone[j] ? f.key : g.key].lo; ctx.globalAlpha = 0.6; ctx.lineWidth = cw;
        }
        ctx.beginPath(); ctx.moveTo(X[p], Y[p]); ctx.lineTo(X[q], Y[q]); ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
    for (const d of m.dots) {
      ctx.fillStyle = d.col || INK;
      ctx.beginPath(); ctx.arc(d.x * mir, d.y, d.r, 0, TAU); ctx.fill();
      if (d.hi) { ctx.fillStyle = 'rgba(255,252,240,0.9)'; ctx.beginPath(); ctx.arc(d.x * mir - d.r * 0.32 * mir, d.y - d.r * 0.35, d.r * 0.34, 0, TAU); ctx.fill(); }
    }
    for (const L of m.lines) {
      ctx.strokeStyle = L.col || INK; ctx.lineWidth = L.w;
      ctx.beginPath(); ctx.moveTo(L.q[0] * mir, L.q[1]);
      for (let i = 2; i < L.q.length; i += 2) ctx.lineTo(L.q[i] * mir, L.q[i + 1]);
      ctx.stroke();
    }
  }

  /* ======================================================= paper fibre */
  let FIBRE = null;
  function makeFibre() {
    const S = 160;
    const { c, ctx } = U.canvas(S, S);
    const rng = U.rng(9137);
    ctx.lineCap = 'round';
    for (let i = 0; i < 420; i++) {
      const x = rng.next() * S, y = rng.next() * S, a = rng.next() * PI, l = 2 + rng.next() * 7;
      const light = rng.next() < 0.55;
      ctx.strokeStyle = light ? 'rgba(255,255,255,' + (0.3 + rng.next() * 0.35).toFixed(2) + ')' : 'rgba(120,92,64,' + (0.1 + rng.next() * 0.12).toFixed(2) + ')';
      ctx.lineWidth = 0.5 + rng.next() * 0.6;
      const bx = Math.cos(a) * l / 2, by = Math.sin(a) * l / 2, bend = (rng.next() - 0.5) * 2.5;
      U.tileDraw(ctx, S, S, (g, ox, oy) => {
        if (x + ox < -10 || x + ox > S + 10 || y + oy < -10 || y + oy > S + 10) return;
        g.beginPath(); g.moveTo(x + ox - bx, y + oy - by);
        g.quadraticCurveTo(x + ox - by * bend * 0.3, y + oy + bx * bend * 0.3, x + ox + bx, y + oy + by);
        g.stroke();
      });
    }
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = rng.next() < 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(110,84,60,0.10)';
      ctx.fillRect(rng.next() * S, rng.next() * S, 1, 1);
    }
    return c;
  }
  function fibreOver(ctx, w, h, alpha) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = alpha;
    for (let y = 0; y < h; y += FIBRE.height) for (let x = 0; x < w; x += FIBRE.width) ctx.drawImage(FIBRE, x, y);
    ctx.restore();
  }

  /* ========================================================= sprite bake */
  let K = 4; // sprite px per world unit
  /** Bakes fn(fold) into a sprite. box = [x0, y0, x1, y1] in world units around the anchor (0,0). */
  function bake(box, fn, mirror, o) {
    o = o || {};
    const pad = 1.4;
    let x0 = box[0], x1 = box[2];
    if (mirror) { const t = x0; x0 = -x1; x1 = -t; }
    const y0 = box[1], y1 = box[3];
    const w = Math.ceil((x1 - x0 + pad * 2) * K), h = Math.ceil((y1 - y0 + pad * 2) * K);
    const { c, ctx } = U.canvas(w, h);
    const ox = (-x0 + pad) * K, oy = (-y0 + pad) * K;
    ctx.setTransform(K, 0, 0, K, ox, oy);
    const m = new Fold();
    fn(m);
    renderFold(ctx, m, { mirror, ol: o.ol, cw: o.cw, seam: 0.9 / K, crumple: o.crumple, cseed: o.cseed });
    if (o.after) { ctx.setTransform(K, 0, 0, K, ox, oy); o.after(ctx, mirror ? -1 : 1); }
    fibreOver(ctx, w, h, o.fibre !== undefined ? o.fibre : 0.55);
    return { c, ox, oy };
  }
  /** Soft cast shadow of a sprite: x' = x - shx*y, y' = shy*y around the anchor, blurred; + contact blob. */
  function castShadow(s, shx, shy, alpha, contact, blurU) {
    const w = s.c.width, h = s.c.height, ox = s.ox, oy = s.oy;
    const blur = Math.max(1, (blurU || 1.1) * K);
    let mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9;
    for (const X of [0, w]) for (const Y of [0, h]) {
      const x = (X - ox) - shx * (Y - oy), y = shy * (Y - oy);
      mnx = Math.min(mnx, x); mxx = Math.max(mxx, x); mny = Math.min(mny, y); mxy = Math.max(mxy, y);
    }
    if (contact) { mnx = Math.min(mnx, -contact[0] * K); mxx = Math.max(mxx, contact[0] * K); mny = Math.min(mny, -contact[1] * K); mxy = Math.max(mxy, contact[1] * K); }
    const pad = Math.ceil(blur * 2.5) + 2;
    const W = Math.ceil(mxx - mnx) + pad * 2, H = Math.ceil(mxy - mny) + pad * 2;
    const ax = Math.round(-mnx + pad), ay = Math.round(-mny + pad);
    const sil = U.tint(s.c, SHADOW);
    const { c, ctx } = U.canvas(W, H);
    ctx.filter = 'blur(' + blur.toFixed(1) + 'px)';
    ctx.globalAlpha = alpha;
    ctx.setTransform(1, 0, -shx, shy, ax - ox + shx * oy, ay - shy * oy);
    ctx.drawImage(sil, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (contact) {
      ctx.globalAlpha = alpha * 0.85;
      ctx.fillStyle = SHADOW;
      ctx.beginPath(); ctx.ellipse(ax + contact[0] * K * 0.25, ay, contact[0] * K, contact[1] * K, 0, 0, TAU); ctx.fill();
    }
    ctx.filter = 'none';
    return { c, ox: ax, oy: ay };
  }
  function flashOf(s) {
    if (!s.fl) s.fl = U.tint(s.c, '#fffaf0');
    return s.fl;
  }

  /* ========================================================= characters */
  // ---- main character: a folded fox in an indigo kimono (faces +x). Pose parameters:
  //  a/b near/far foot x, la/lb foot lift, bob body lift, lean upper-body lean (rad, + = forward), sw kimono hem lag,
  //  tx/ty tail tip offset, ar/au near sleeve swing/raise, ar2 far sleeve swing, e1/e2 far/near ear tip x,
  //  ey ear tip lag (y), eb ears swept back, hx/hy/ht head offset + tilt, eye 0 open / 1 closed / 2 squeezed
  function fox(m, fr) {
    const bob = fr.bob || 0, lean = fr.lean || 0, lc = Math.cos(lean), ls = Math.sin(lean);
    const PX = 0.4, PY = -8.2;
    const B = (x, y, z) => { const dx = x - PX, dy = y - bob - PY; return [PX + dx * lc - dy * ls, PY + dx * ls + dy * lc, z || 0]; };
    const hx = fr.hx || 0, hy = fr.hy || 0, ht = fr.ht || 0, hc = Math.cos(ht), hs = Math.sin(ht);
    const H = (x, y, z) => { const dx = x - 1, dy = y + 19; return B(1 + hx + dx * hc - dy * hs, -19 + hy + dx * hs + dy * hc, z); };
    const tx = fr.tx || 0, ty = fr.ty || 0, sw = fr.sw || 0;
    // tail (behind everything): one kite, the tip folded back to show the cream side
    const TA = B(-2.4, -9.6, 1.8), TB = B(-12.8 + tx, -22.6 + ty, 1.2);
    const TP = B(-10.6 + tx * 0.5, -11.4 + ty * 0.4), TQ = B(-4.6 + tx * 0.3, -18.8 + ty * 0.6);
    m.kite(TA, TB, TP, TQ, 'coral');
    m.kite(L3(TA, TB, 0.6), TB, L3(TP, TB, 0.52), L3(TQ, TB, 0.52), 'cream');
    // far sleeve (peeks out behind the body when it swings back)
    const ar2 = fr.ar2 || 0;
    const FA = B(-0.6, -16.6, 1.2), FB = B(-2.0 + ar2, -10.6, 1.0);
    m.kite(FA, FB, B(-2.6 + ar2 * 0.4, -12.8), B(1.0 + ar2 * 0.5, -12.4), ['indigo', 1]);
    m.tri([FB[0] - 1.0, FB[1] + 0.3, 0.5], [FB[0] + 1.4, FB[1] - 0.1, 0.5], [FB[0] + 0.4, FB[1] + 2.0, 0.8], ['ink', 1]);
    // legs (dark paws), the far one a step darker
    m.strip(B(-1.7, -8.2), [fr.b, -fr.lb], 3.0, 2.1, 1.0, ['ink', 1]);
    m.tri([fr.b - 1.3, -fr.lb, 0], [fr.b + 2.4, -fr.lb + 0.2 + fr.lb * 0.25, 0], [fr.b - 0.4, -fr.lb - 2.2, 0.9], ['ink', 1]);
    m.strip(B(1.8, -8.2), [fr.a, -fr.la], 3.0, 2.1, 1.0, 'ink');
    m.tri([fr.a - 1.3, -fr.la, 0], [fr.a + 2.5, -fr.la + 0.2 + fr.la * 0.25, 0], [fr.a - 0.4, -fr.la - 2.2, 0.9], 'ink');
    // kimono body: one sheet folded down the middle, the hem lags behind the stride
    const Nk = B(0.8, -18.8, 2.2), BL = B(-6.4 + sw, -6.0 + Math.abs(sw) * 0.15), BR = B(6.8 + sw * 0.7, -6.4 - Math.abs(sw) * 0.2), BC = B(0.9 + sw * 0.4, -5.2, 2.6);
    m.tri(Nk, BL, BC, 'indigo'); m.tri(Nk, BC, BR, 'indigo');
    const s0 = 0.55, s1 = 0.7;   // obi sash
    m.quad(L3(Nk, BL, s0), L3(Nk, BC, s0), L3(Nk, BC, s1), L3(Nk, BL, s1), 'mustard');
    m.quad(L3(Nk, BC, s0), L3(Nk, BR, s0), L3(Nk, BR, s1), L3(Nk, BC, s1), 'mustard');
    m.quad(L3(Nk, BL, 0.9), L3(Nk, BC, 0.9), BC, BL, 'cream');   // hem: the cream back of the sheet folded up
    m.quad(L3(Nk, BC, 0.9), L3(Nk, BR, 0.9), BR, BC, 'cream');
    // collar
    m.tri(B(-1.8, -17.9, 1.2), B(1.0, -13.8, 2.4), B(0.9, -18.7, 2.6), 'cream');
    m.tri(B(0.9, -18.7, 2.6), B(1.0, -13.8, 2.4), B(3.6, -18.1, 1.2), 'cream');
    // near sleeve + cream cuff + paw
    const ar = fr.ar || 0, au = fr.au || 0;
    const SA = B(3.2, -16.4, 1.8), SB = B(6.0 + ar, -9.6 - au, 1.6);
    const SP = B(1.8 + ar * 0.2, -11.4 - au * 0.45), SQ = B(7.8 + ar * 0.7, -14.0 - au * 0.75);
    m.kite(SA, SB, SP, SQ, 'indigo');
    m.tri(L3(SP, SB, 0.62), L3(SA, SB, 0.7), SB, ['cream', 1]); m.tri(L3(SA, SB, 0.7), L3(SQ, SB, 0.62), SB, 'cream');
    m.tri([SB[0] - 1.0, SB[1] + 0.3, 0.6], [SB[0] + 1.6, SB[1] - 0.2, 0.6], [SB[0] + 0.6, SB[1] + 2.2, 1], 'ink');
    // ears (behind the head), inner ear = cream back side
    const e1 = fr.e1 || 0, e2 = fr.e2 || 0, ey = fr.ey || 0, eb = fr.eb || 0;
    m.kite(H(-2.7, -26.0, 1.8), H(-4.6 + e1 - eb, -34.0 + ey + eb * 0.55), H(-4.8, -24.4), H(-0.6, -27.0), 'coral');
    m.tri(H(-3.9, -25.9, 0.6), H(-1.5, -26.7, 0.6), H(-4.2 + (e1 - eb) * 0.9, -31.6 + (ey + eb * 0.55) * 0.8, 0.6), ['cream', 1]);
    m.kite(H(2.6, -26.6, 1.8), H(2.4 + e2 - eb, -34.8 + ey + eb * 0.55), H(0.4, -26.9), H(4.8, -25.6), 'coral');
    m.tri(H(1.3, -26.9, 0.6), H(3.9, -26.1, 0.6), H(2.5 + (e2 - eb) * 0.9, -32.2 + (ey + eb * 0.55) * 0.8, 0.6), ['cream', 1]);
    // head: coral mask over a cream muzzle
    const F = H(-0.4, -27.4, 2.6), Bk = H(-5.0, -23.4), Ck = H(-3.0, -19.4), Ch = H(3.4, -18.4, 0.4);
    const Sn = H(10.4, -21.0, 0.8), Ft = H(4.9, -26.0, 1.0), Md = H(2.2, -22.4, 3.6);
    m.tri(F, Bk, Md, 'coral'); m.tri(Bk, Ck, Md, 'coral'); m.tri(F, Md, Ft, 'coral'); m.tri(Ft, Md, Sn, 'coral');
    m.tri(Md, Ck, Ch, 'cream'); m.tri(Md, Ch, Sn, 'cream');
    const E = H(4.7, -23.3), N = H(10.1, -21.0);
    if (!fr.eye) m.dot(E[0], E[1], 0.85, INK, true);
    else if (fr.eye === 1) { const a = H(3.8, -23.2), b = H(4.7, -22.7), c = H(5.6, -23.1); m.line([a[0], a[1], b[0], b[1], c[0], c[1]], 0.5, INK); }
    else { const a = H(3.8, -24.3), b = H(5.4, -23.3), c = H(3.8, -22.4); m.line([a[0], a[1], b[0], b[1], c[0], c[1]], 0.5, INK); }
    m.dot(N[0], N[1], 0.75, INK);
  }
  const FOX_BASE = { a: 1.8, b: -1.6, la: 0, lb: 0, bob: 0 };
  const fx = (o) => Object.assign({}, FOX_BASE, o);
  // 8-pose walk (contact, down, passing, up for each foot) with counter-swinging sleeves and lagging tail/ears/hem
  const FOX_WALK = (() => {
    const out = [], S = 4.4, L = 2.4, bobs = [0.3, -0.3, 0.8, 1.3];
    const foot = (ph) => (ph < 0.5 ? { x: S - (ph / 0.5) * 2 * S, l: 0 } : { x: -S + ((ph - 0.5) / 0.5) * 2 * S, l: Math.sin(((ph - 0.5) / 0.5) * PI) * L });
    for (let i = 0; i < 8; i++) {
      const ph = i / 8, n = foot(ph), f = foot((ph + 0.5) % 1);
      const bob = bobs[i & 3], prev = bobs[(i + 3) & 3];
      out.push(fx({
        a: 1.0 + n.x, la: n.l, b: -0.6 + f.x, lb: f.l, bob, lean: 0.07 + (bob > 1 ? 0.025 : 0),
        ar: -n.x * 0.5, ar2: -f.x * 0.8, sw: (prev - bob) * 1.3 - n.x * 0.12,
        tx: -Math.cos(ph * TAU * 2) * 0.9, ty: (prev - 0.5) * 2.0, ey: (bob - prev) * 1.1, hy: (prev - bob) * 0.25,
      }));
    }
    return out;
  })();
  const FOX_IDLE = [
    fx({}),
    fx({ bob: 0.45, ty: -1.0, tx: 0.5, ey: -0.3, hy: -0.1, ar: -0.3, sw: -0.2 }),            // breathe in, tail lifts
    fx({ bob: -0.12, ty: 1.2, tx: -1.3, ht: 0.035, ar: 0.25, sw: 0.25 }),                   // breathe out, tail swings down
  ];
  const FOX_FR = [
    ...FOX_IDLE,                                                                             // 0-2 idle breath
    ...FOX_IDLE.map((f) => Object.assign({}, f, { eye: 1 })),                               // 3-5 blink
    fx({ e2: -2.4, ey: 0.5, ht: -0.03 }),                                                    // 6 ear flick
    ...FOX_WALK,                                                                             // 7-14 walk
    fx({ a: 6.0, b: -6.4, la: 1.4, lb: 2.4, bob: 1.4, lean: 0.22, tx: -3.6, ty: 4.0, ar: -2.6, ar2: -3.4, eb: 2.8, ey: 1.0, sw: -1.8 }), // 15 dash
    fx({ a: 3.8, b: -2.6, bob: -0.9, lean: 0.12, tx: 0.8, ty: -3.4, ar: 1.8, ar2: 1.4, e1: 1.2, e2: 1.5, ey: 1.4, sw: 1.4, hy: 0.5 }),   // 16 dash landing
    fx({ a: 3.2, b: -3.0, la: 0.6, bob: 0.6, lean: -0.2, tx: 1.6, ty: -3.8, ar: 1.6, au: 3.4, ar2: 2.6, eb: 2.6, ey: 0.8, eye: 2, sw: 1.0, ht: -0.08 }), // 17 hurt
    fx({ a: 2.8, b: -2.2, lean: 0.08, ar: 3.4, au: 5.2, ar2: -2.4, tx: -0.6, ty: 0.8, sw: -0.3 }), // 18 throw
    fx({ a: 4.4, b: 3.0, bob: -2.2, lean: 0.14, ht: 0.14, hy: 1.2, eye: 1, eb: 2.4, ey: 2.4, tx: 3.2, ty: 9, ar: 2.4, ar2: 2.2, sw: 0.6 }), // 19 down
  ];
  const FX_I = { BLINK: 3, FLICK: 6, WALK: 7, DASH: 15, LAND: 16, HURT: 17, THROW: 18, DOWN: 19 };
  // idle breath on 8 fps steps (2.5 s): neutral – in (held) – neutral – out (held)
  const FOX_IDLE_SEQ = [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0];

  // ---- small creature: origami jumping frog. Pose: y body raise, leg back-leg reach, front front-leg reach,
  //  st launch stretch, tk leg tuck, th throat puff, eye 0 open / 1 closed
  const FROG_KEYS = ['teal', 'sage', 'mustard'];
  function frog(m, fr, key) {
    const by = -fr.y, st = fr.st || 0, tk = fr.tk || 0;
    // back leg (big folded thigh)
    m.kite([-2.6, -6.4 + by, 2.2], [-9.4 - fr.leg + tk * 2.6, -0.4 - fr.leg * 0.2 - tk * 1.4, 0.4], [-3.4, -0.6 - tk * 1.2, 0], [-7.6 - fr.leg * 0.4 + tk, -7.0 + by, 0], [key, 1], key);
    // body: a diamond with an X of folds; lower half shows the cream back
    const R = [-7.4 - st * 0.8, -4.8 + by + st * 0.6, 0], T = [-1.2 + st * 0.8, -11.8 + by - st * 1.4, 0];
    const Nn = [7.8 + st * 1.0, -6.8 + by - st * 2.2, 0], Bo = [0.4, -1.2 + by * 0.4, 0], C = [0.2 + st * 0.6, -6.6 + by - st * 1.0, 3.6];
    m.tri(R, T, C, key); m.tri(T, Nn, C, key); m.tri(R, C, Bo, ['cream', 0]); m.tri(C, Nn, Bo, ['cream', 0]);
    if (fr.th) m.tri([3.0, -3.2 + by * 0.6, 0.6], [6.9, -5.8 + by, 0.4], [5.0, -1.6 + by * 0.5 + fr.th, 1.8], ['cream', 0]);
    // eyes: two raised bumps
    const ey = by - st * 1.8, ex = st * 0.9;
    m.tri([0.6 + ex, -10.4 + ey, 1.2], [2.0 + ex, -14.0 + ey, 2.2], [3.5 + ex, -10.6 + ey, 1.8], key);
    m.tri([3.4 + ex, -9.6 + ey, 1.6], [5.0 + ex, -12.8 + ey, 2.0], [6.4 + ex, -9.2 + ey, 1.2], key);
    if (fr.eye) { m.line([1.2 + ex, -11.5 + ey, 2.8 + ex, -11.4 + ey], 0.45, INK); m.line([4.2 + ex, -10.3 + ey, 5.8 + ex, -10.2 + ey], 0.45, INK); }
    else { m.dot(2.0 + ex, -11.6 + ey, 0.8, INK, true); m.dot(5.0 + ex, -10.4 + ey, 0.75, INK, true); }
    // front leg
    m.tri([3.6, -3.6 + by, 1.2], [6.6 + fr.front, -0.2 - fr.front * 0.3 - tk * 0.8, 0.4], [2.4, -0.4 - tk * 0.6, 0], [key, 1]);
  }
  const FROG_FR = [
    { y: 0, leg: 0, front: 0 },                          // 0 sit
    { y: 0.25, leg: 0, front: 0, th: 1.6 },              // 1 sit, throat puffed
    { y: 0, leg: 0, front: 0, eye: 1 },                  // 2 blink
    { y: -1.7, leg: -0.9, front: -0.6 },                 // 3 crouch (anticipation)
    { y: 1.6, leg: 5.2, front: 2.0, st: 1 },             // 4 launch: stretched, back leg thrown out
    { y: 0.8, leg: 1.2, front: 2.6, tk: 1.2, st: 0.3 },  // 5 airborne, legs tucked
    { y: -1.3, leg: -0.4, front: 3.4, st: -0.2 },        // 6 landing squash, front legs splayed
  ];

  // ---- fast creature: paper crane (u = wing raise, nb = neck/tail bob)
  function crane(m, u, key, nb) {
    nb = nb || 0;
    const wy = -11 - 12.8 * u, wx = -4.6 + 2.4 * (1 - u);
    const under = u < 0.1;
    m.kite([-0.6, -11.4, 1.3], [wx + 3.0, wy - 1.4, 0.8], [-2.6, -11.0, 0], [2.2, -11.8, 0], under ? ['cream', 1] : [key, 1]);
    m.strip([-3.6, -10.6], [-12.6, -17.4 - nb * 0.6], 2.8, 0, 1.2, key);
    m.strip([3.4, -10.8], [9.4, -19.8 + nb], 2.8, 1.0, 1.1, key);
    m.tri([8.9, -20.0 + nb, 0.9], [10.6, -20.8 + nb, 0.7], [13.6, -16.6 + nb * 1.2, 0.2], key);
    const R = [-5.0, -10.6, 0], T = [0.2, -13.6, 0], Fr = [5.6, -10.8, 0], Bo = [0.4, -7.4, 0], C = [0.2, -10.6, 3.0];
    m.tri(R, T, C, key); m.tri(T, Fr, C, key); m.tri(R, C, Bo, key); m.tri(C, Fr, Bo, key);
    m.kite([0.4, -10.4, 1.6], [wx, wy, 1.0], [-2.4, -9.9, 0], [3.0, -10.6, 0], under ? 'cream' : key);
    m.dot(10.4, -19.8 + nb, 0.5, INK);
  }
  // 6 wing poses: up (held) – fast down-stroke – low – slow recovery; the body rises on the down-stroke
  const CRANE_U = [1.0, 0.6, -0.05, -0.42, -0.15, 0.5];
  const CRANE_NB = [0.5, 0.9, 1.2, 0.7, -0.2, -0.5];
  const CRANE_LIFT = [0, 0.5, 1.3, 1.6, 1.0, 0.3];
  const CRANE_SEQ = [0, 0, 1, 2, 3, 4, 5];

  // ---- large creature: folded boar beast with a mustard mane, tail tuft and cream tusks.
  //  L = [[dx, lift] x4] far-back, far-front, near-back, near-front; hd head nod, mn mane lag, tl tail wag
  function beast(m, fr) {
    const by = -fr.bob, Y = (y) => y + by, hd = fr.hd || 0, mn = fr.mn || 0, LG = fr.L;
    const HY = (x, y) => y + by + hd * clamp((x - 6) / 8, 0, 1);
    const leg = (hx, d, near) => {
      const fx = hx + d[0], fy = -d[1];
      m.strip([hx, Y(near ? -13 : -12)], [fx, fy], near ? 6.2 : 5.6, near ? 4.6 : 4.2, near ? 1.8 : 1.6, near ? 'plum' : ['plum', 1]);
      const w = near ? 2.6 : 2.4;
      m.tri([fx - w, fy, 0], [fx + w, fy, 0], [fx, fy - (near ? 2.4 : 2.2), near ? 1.2 : 1], near ? 'mustard' : ['mustard', 1]);
    };
    leg(-10.5, LG[0], false); leg(7.5, LG[1], false);
    // tail tuft
    const tl = fr.tl || 0;
    m.kite([-18.6, Y(-15.8), 1.2], [-25.0, Y(-21.5) + tl, 0.5], [-19.6, Y(-19.4), 0], [-22.4, Y(-14.6) + tl * 0.5, 0], 'mustard');
    // mane spikes along the spine (behind the body edge); the tips lag behind the body bob
    const spine = [[-19.5, Y(-17)], [-12, Y(-28.5)], [-1, Y(-33.5)], [9, Y(-29.5)]];
    for (let s = 0; s < 3; s++) {
      const a = spine[s], b = spine[s + 1];
      for (let k = 0; k < 2; k++) {
        const p0 = L3(a, b, k / 2), p1 = L3(a, b, (k + 1) / 2), mid = L3(p0, p1, 0.5);
        const dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy);
        const lag = mn * (1 - (s * 2 + k) / 7);
        const tip = [mid[0] + (dy / l) * 7.5 - dx * 0.35 - lag * 0.4, mid[1] - (dx / l) * 7.5 - dy * 0.35 + lag, 0.6];
        m.kite([mid[0], mid[1], 2.0], tip, [p0[0], p0[1], 0], [p1[0], p1[1], 0], 'mustard');
      }
    }
    // body: a faceted dome folded around one raised point
    const M = [-3, Y(-21), 6];
    const ring = [[-17, Y(-9.5)], [-20, Y(-17)], [-12, Y(-28.5)], [-1, Y(-33.5)], [9, Y(-29.5)], [11, Y(-14)], [2, Y(-8.6)], [-8, Y(-9.2)]];
    m.fan(M, ring.map((p) => [p[0], p[1], 0]), 'plum');
    // belly band: cream back side
    m.quad([-17, Y(-9.5), 0], [-8, Y(-9.2), 0], [-8, Y(-11.8), 1.2], [-15.5, Y(-12.4), 1.2], ['cream', 1]);
    m.quad([-8, Y(-9.2), 0], [2, Y(-8.6), 0], [2, Y(-11.2), 1.2], [-8, Y(-11.8), 1.2], ['cream', 1]);
    // ear
    m.kite([8.4, HY(8.4, -28.6), 1.6], [5.0 - hd * 0.3, HY(8, -37.5) - hd * 0.3, 0.6], [6.4, HY(6.4, -27.6), 0], [11.4, HY(11.4, -29.6), 0], 'plum');
    m.tri([7.4, HY(7.4, -28.8), 0.8], [9.6, HY(9.6, -29.4), 0.8], [5.8, HY(8, -34.6), 0.8], ['cream', 1]);
    // head (nods with the stride)
    const HM = [13.2, HY(13.2, -21), 3.8];
    m.fan(HM, [[7, HY(7, -29), 0], [12.5, HY(12.5, -28.6), 0], [22.6, HY(22.6, -17.4), 0], [21.2, HY(21.2, -12.6), 0], [12, HY(12, -10.4), 0], [6.6, HY(6.6, -16), 0]], 'plum');
    m.tri([20.4, HY(20.4, -18.4), 1.0], [23.0, HY(23, -17.2), 0.6], [21.4, HY(21.4, -13.0), 0.6], ['blush', 1]);
    m.tri([16.8, HY(16.8, -13.8), 1.6], [19.2, HY(19.2, -12.9), 1.6], [21.0, HY(21, -21.2), 2.4], 'cream');   // tusk
    m.tri([12.6, HY(12.6, -23.8), 3.8], [16.8, HY(16.8, -22.6), 3.4], [13.4, HY(13.4, -21.4), 3.8], 'mustard'); // eye
    m.dot(14.4, HY(14.4, -22.7), 0.7, INK);
    leg(-13.5, LG[2], true); leg(4.5, LG[3], true);
  }
  // 8-pose lateral-sequence walk: each leg 3/4 of the cycle on the ground, 1/4 swinging; body bobs twice per cycle
  const BEAST_FR = (() => {
    const out = [], S = 3.8, LF = 2.6, duty = 0.75;
    const foot = (ph) => (ph < duty ? { x: S - (ph / duty) * 2 * S, l: 0 } : { x: -S + ((ph - duty) / (1 - duty)) * 2 * S, l: Math.sin(((ph - duty) / (1 - duty)) * PI) * LF });
    const off = [0.5, 0.75, 0.0, 0.25];
    const bobAt = (ph) => 0.55 + 0.55 * Math.cos(ph * TAU * 2);
    for (let i = 0; i < 8; i++) {
      const ph = i / 8;
      const L = off.map((o) => { const f = foot((ph + o) % 1); return [f.x, f.l]; });
      const bob = bobAt(ph), prev = bobAt(ph - 1 / 8);
      out.push({ L, bob, hd: 1.0 * Math.sin(ph * TAU * 2 + 0.9), mn: (bob - prev) * 2.6, tl: Math.sin(ph * TAU) * 2.4 });
    }
    return out;
  })();

  // ---- a crumpled paper ball (deaths): facets in the creature colour, two facets show the cream back
  function ball(m, key) {
    const rng = U.rng(4242);
    const ring = [], inner = [];
    for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU, k = 0.84 + rng.next() * 0.28; ring.push([Math.cos(a) * 6 * k, -6 + Math.sin(a) * 5.4 * k, 0]); }
    for (let i = 0; i < 9; i++) { const a = ((i + 0.5) / 9) * TAU, k = 0.42 + rng.next() * 0.22; inner.push([Math.cos(a) * 6 * k - 0.6, -6.5 + Math.sin(a) * 5.4 * k, 3.6 + rng.next() * 2.2]); }
    const c = [-0.8, -7.0, 6.4];
    for (let i = 0; i < 9; i++) {
      const j = (i + 1) % 9;
      m.tri(ring[i], ring[j], inner[i], i === 2 || i === 6 ? ['cream', 1] : key);
      m.tri(inner[i], ring[j], inner[j], key);
      m.tri(c, inner[i], inner[j], i === 4 ? 'cream' : key);
    }
  }

  /* ============================================================== props */
  function pine(m, v) {
    const H = [56, 66, 48][v], key = v === 2 ? 'teal' : 'pine';
    m.strip([0, 0.6], [0, -10], 3.8, 3.0, 1.0, 'wood');
    for (let t = 0; t < 3; t++) {
      const yb = -7 - t * H * 0.25, w = 15.5 - t * 3.8, yt = yb - H * 0.44;
      const A = [0.3, yt, 1.6], L = [-w, yb, 0], R = [w, yb + 0.6, 0], Bc = [1.0, yb + 3.0, 5.5];
      m.tri(A, L, Bc, key); m.tri(A, Bc, R, key);
    }
  }
  const TREE_KEYS = ['coral', 'mustard', 'sage', 'teal'];
  function roundTree(m, v) {
    const key = TREE_KEYS[v];
    m.strip([0, 0.6], [0, -18], 4.0, 2.8, 1.2, 'wood');
    m.strip([0.4, -12], [5.5, -19], 1.8, 0.8, 0.6, 'wood');
    const cx = 0, cy = -33, rx = 15, ry = 13.5;
    const inner = [], outer = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU - PI / 2;
      outer.push([cx + Math.cos(a) * rx * (i & 1 ? 0.92 : 1), cy + Math.sin(a) * ry * (i & 1 ? 0.92 : 1), 0]);
      const b = a + PI / 8;
      inner.push([cx - 1 + Math.cos(b) * rx * 0.5, cy - 1 + Math.sin(b) * ry * 0.5, 6.5]);
    }
    const apex = [cx - 1.6, cy - 2.2, 9.5];
    for (let i = 0; i < 8; i++) {
      const j = (i + 1) % 8;
      m.tri(outer[i], outer[j], inner[i], key);
      m.tri(inner[i], outer[j], inner[j], key);
      m.tri(apex, inner[i], inner[j], key);
    }
  }
  function stone(m, v) {
    const rng = U.rng(71 + v * 13);
    const r = [9, 12, 7][v];
    const ring = [];
    for (let i = 0; i < 7; i++) {
      const a = PI * 0.05 + (i / 7) * TAU;
      const k = 0.8 + rng.next() * 0.35;
      ring.push([Math.cos(a) * r * k, Math.min(0.6, -r * 0.42 + Math.sin(a) * r * 0.62 * k), 0]);
    }
    m.fan([-r * 0.18, -r * 0.62, r * 0.7], ring, 'stone');
    if (v === 1) {
      const ring2 = [];
      for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; ring2.push([r * 0.9 + Math.cos(a) * 4.6, Math.min(0.6, -2.4 + Math.sin(a) * 3.2), 0]); }
      m.fan([r * 0.82, -3.6, 3.2], ring2, 'stone');
    }
  }
  function house(m, v) {
    const roof = v ? 'indigo' : 'coral';
    // side wall + side roof (3/4 view)
    m.quad([10, 0, 0], [10, -15, 0], [17, -18.5, 0], [17, -3.5, 0], ['cream', 1]);
    m.quad([13.6, -14.2, 0], [0, -31, 0], [6.6, -34.5, 0], [20.4, -17.6, 0], [roof, 1]);
    // front walls folded slightly at the middle
    m.quad([-10, 0, 0], [-10, -15, 0], [0, -15, 1.6], [0, 0, 1.6], 'cream');
    m.quad([0, 0, 1.6], [0, -15, 1.6], [10, -15, 0], [10, 0, 0], 'cream');
    // door + window
    m.quad([-6.8, 0, 0.9], [-6.8, -8.4, 0.9], [-2.4, -8.4, 1.4], [-2.4, 0, 1.4], 'indigo');
    m.quad([2.6, -6.4, 1.4], [2.6, -11.2, 1.4], [7.2, -11.2, 0.7], [7.2, -6.4, 0.7], 'mustard');
    // front roof with the squash-fold flaps showing the cream back
    const A = [0, -31, 2], L = [-13.6, -14.2, 0], R = [13.6, -14.2, 0], Bc = [0, -14.2, 3.4];
    m.tri(A, L, Bc, roof); m.tri(A, Bc, R, roof);
    m.tri([-8.6, -14.2, 0.6], [-4.6, -19.6, 1.4], [-1.2, -14.2, 1.2], ['cream', 0]);
    m.tri([1.2, -14.2, 1.2], [4.6, -19.6, 1.4], [8.6, -14.2, 0.6], ['cream', 0]);
  }
  const TULIP_KEYS = [['coral', 'mustard', 'blush'], ['mustard', 'blush', 'coral']];
  function tulips(m, v) {
    const xs = [-5.5, 0.5, 5.2], hs = [12.5, 16.5, 11];
    for (let i = 0; i < 3; i++) {
      const x = xs[i], h = hs[i], key = TULIP_KEYS[v][i];
      m.strip([x, 0.4], [x + 0.6, -h + 1], 1.4, 1.0, 0.5, 'sage');
      if (i !== 1) m.kite([x + 0.2, -1.5, 1.2], [x + (i ? 4.6 : -4.8), -h * 0.55, 0.4], [x, -0.5, 0], [x + (i ? 2.4 : -2.4), -h * 0.62, 0], 'sage');
      const cx = x + 0.6, cy = -h - 1.4;
      const ring = [[cx, cy + 3.4, 0], [cx - 3.4, cy + 0.6, 0], [cx - 3.6, cy - 3.6, 0], [cx - 1.4, cy - 1.8, 0], [cx, cy - 4.4, 0], [cx + 1.4, cy - 1.8, 0], [cx + 3.6, cy - 3.6, 0], [cx + 3.4, cy + 0.6, 0]];
      m.fan([cx - 0.4, cy, 3.0], ring, key);
    }
  }
  function pinwheelHead(m, rot) {
    for (let i = 0; i < 4; i++) {
      const a = rot + (i * PI) / 2;
      const P = [Math.cos(a) * 9.5, Math.sin(a) * 9.5, 0];
      const Q = [Math.cos(a + 1.45) * 5.2, Math.sin(a + 1.45) * 5.2, 0.8];
      const key = i & 1 ? 'teal' : 'coral';
      m.tri([0, 0, 2.8], P, Q, key);
      m.tri([0, 0, 2.8], [Math.cos(a - 0.5) * 3.2, Math.sin(a - 0.5) * 3.2, 1.6], P, ['cream', 0]);
    }
    m.dot(0, 0, 1.0, '#c68c2d');
  }
  const BOAT_KEYS = ['mustard', 'coral', 'cream'];
  function boat(m, v) {
    const key = BOAT_KEYS[v];
    m.tri([-6.8, -4, 0], [0, -17.5, 1.2], [0, -4, 3.2], key);
    m.tri([0, -4, 3.2], [0, -17.5, 1.2], [6.8, -4, 0], key);
    m.quad([-12.5, -4.4, 0], [0, -4.4, 1.6], [0, 1.8, 1.6], [-7.6, 1.8, 0], key);
    m.quad([0, -4.4, 1.6], [12.5, -4.4, 0], [7.6, 1.8, 0], [0, 1.8, 1.6], key);
  }
  function lotus(m) {
    const pad = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + 0.3;
      const notch = i === 0 ? 0.35 : 1;
      pad.push([Math.cos(a) * 11 * notch, Math.sin(a) * 5.2 * notch + 0.5, 0]);
    }
    m.fan([0.4, 0.5, 1.6], pad, 'sage');
    const petal = (a, len, key, z) => {
      const tip = [Math.cos(a) * len, -2 + Math.sin(a) * len * 0.6 - 4, z];
      m.kite([0, -1.6, z + 1.4], tip, [Math.cos(a + 1.3) * 2.6, -1.6 + Math.sin(a + 1.3) * 1.6, z], [Math.cos(a - 1.3) * 2.6, -1.6 + Math.sin(a - 1.3) * 1.6, z], key);
    };
    for (let i = 0; i < 6; i++) petal(PI + (i / 5) * PI, 8.5, 'blush', 0);
    for (let i = 0; i < 4; i++) petal(PI * 1.15 + (i / 3) * PI * 0.7, 6.5, 'cream', 1);
    m.dot(0, -3.4, 1.2, '#e6ae42');
  }
  function fence(m) {
    const n = 6, w = 5.2, x0 = -(n * w) / 2;
    for (let i = 0; i < n; i++) {
      const xa = x0 + i * w, xb = xa + w, za = i & 1 ? 4.2 : 0, zb = i & 1 ? 0 : 4.2;
      m.quad([xa, 0, za], [xa, -11, za], [xb, -11 - 0.6, zb], [xb, -0.6, zb], 'cream');
      m.quad([xa, -11, za], [xa, -13.6, za], [xb, -14.2, zb], [xb, -11.6, zb], 'teal');
    }
  }

  // reeds by the shore: folded blades and two cattails
  function reeds(m, v) {
    const bl = v ? [[-6, -12, -8.4], [-3, -19, -4.6], [0.6, -23, 0.4], [3.6, -15, 5.6], [6.4, -10, 8.6]] : [[-4.6, -16, -6.6], [-1.2, -21, -2.4], [2.4, -17, 4.4], [5.2, -12, 7.6]];
    for (let i = 0; i < bl.length; i++) {
      const [x, h, tx] = bl[i];
      m.strip([x, 0.4], [tx, h], 1.7, 0, 0.6, i & 1 ? 'pine' : 'sage');
    }
    const tails = v ? [[-1.6, -24], [2.2, -19]] : [[0.2, -23.5]];
    for (const [x, h] of tails) {
      m.strip([x - 0.4, 0.2], [x, h + 5], 0.8, 0.6, 0.3, 'wood');
      m.strip([x, h + 5.4], [x + 0.2, h - 0.6], 2.4, 2.0, 1.0, ['wood', 1]);
      m.strip([x + 0.2, h - 0.6], [x + 0.3, h - 2.6], 0.6, 0, 0.2, 'wood');
    }
  }
  // low folded shrub: two faceted lobes
  const BUSH_KEYS = ['sage', 'pine', 'teal'];
  function bush(m, v) {
    const key = BUSH_KEYS[v];
    const lobe = (cx, cy, rx, ry, z) => {
      const ring = [];
      for (let i = 0; i < 7; i++) {
        const a = PI + (i / 6) * PI;
        ring.push([cx + Math.cos(a) * rx * (i & 1 ? 0.9 : 1), cy + Math.sin(a) * ry * (i & 1 ? 0.88 : 1), 0]);
      }
      ring.push([cx + rx * 0.7, cy + 1.2, 0], [cx - rx * 0.7, cy + 1.2, 0]);
      m.fan([cx - rx * 0.15, cy - ry * 0.45, z], ring, key);
    };
    lobe(-4.2, -1.0, 8.6, 9.5, 5.5);
    lobe(5.4, -0.4, 6.6, 7.2, 4.4);
  }

  const PROP_DEF = {
    reeds: { n: 2, box: [-9, -27, 10, 3], fn: reeds, mir: true, contact: [6, 1.8], sway: 0.05 },
    bush: { n: 3, box: [-14, -12, 13, 3], fn: bush, mir: true, contact: [11, 3], sway: 0.012 },
    pine: { n: 3, box: [-17, -72, 17, 4], fn: pine, mir: true, contact: [13, 4.2], tall: 60, sway: 0.014 },
    tree: { n: 4, box: [-17, -50, 17, 4], fn: roundTree, mir: true, contact: [12, 4], tall: 46, sway: 0.016 },
    stone: { n: 3, box: [-13, -14, 18, 3], fn: stone, mir: true, contact: [9, 3] },
    house: { n: 2, box: [-15, -36, 22, 3], fn: house, mir: false, contact: [16, 4.5], tall: 34 },
    tulips: { n: 2, box: [-10, -23, 10, 3], fn: tulips, mir: true, contact: [6, 2], sway: 0.035 },
    fence: { n: 1, box: [-17, -16, 17, 3], fn: fence, mir: false, contact: [15, 2.2] },
    paperBoat: { n: 3, box: [-14, -20, 14, 4], fn: boat, mir: true, water: true },
    lotus: { n: 1, box: [-13, -15, 13, 7], fn: lotus, mir: true, water: true },
  };

  /* ============================================================ effects */
  function plane(m, ang) {
    m.at(0, 0, 1, ang);
    const N = [7, 0, 1.0], LT = [-5, -4.8, 1.8], RT = [-5, 4.8, 1.8], TC = [-3.6, 0, 0];
    m.tri(N, LT, TC, 'cream'); m.tri(N, TC, RT, 'cream');
    m.tri([-5, -4.8, 1.8], [-3.0, -3.0, 1.2], [-4.6, -1.6, 0.6], 'coral');
    m.tri([-5, 4.8, 1.8], [-4.6, 1.6, 0.6], [-3.0, 3.0, 1.2], 'coral');
    m.at();
  }
  function shuriken(m, rot) {
    for (let i = 0; i < 4; i++) {
      const a = rot + (i * PI) / 2;
      const T = [Math.cos(a) * 9, Math.sin(a) * 9, 0];
      const C0 = [Math.cos(a - PI / 4) * 3.2, Math.sin(a - PI / 4) * 3.2, 1.2], C1 = [Math.cos(a + PI / 4) * 3.2, Math.sin(a + PI / 4) * 3.2, 1.2];
      m.tri(C0, T, [0, 0, 2.6], i & 1 ? 'teal' : 'coral');
      m.tri([0, 0, 2.6], T, C1, i & 1 ? 'coral' : 'teal');
    }
  }
  function luckyStar(m, rot, key, r) {
    const c = [0, 0, r * 0.62], outer = [], inner = [];
    for (let k = 0; k < 5; k++) {
      const a = rot + (k / 5) * TAU - PI / 2;
      outer.push([Math.cos(a) * r, Math.sin(a) * r, 0]);
      const b = a + PI / 5;
      inner.push([Math.cos(b) * r * 0.5, Math.sin(b) * r * 0.5, r * 0.25]);
    }
    for (let k = 0; k < 5; k++) {
      m.tri(c, inner[(k + 4) % 5], outer[k], key);
      m.tri(c, outer[k], inner[k], key);
    }
  }
  function crystal(m, th, key) {
    const cs = Math.cos(th), sn = Math.sin(th);
    const x = (v) => v * (0.35 + 0.65 * Math.abs(cs));
    const cxp = sn * 1.6;
    const T = [0, -7, 1], L = [x(-4.8), -1, 0], R = [x(4.8), -1, 0], Bm = [0, 6.4, 0.5], C = [cxp, -1.4, 3.6];
    m.tri(T, L, C, key); m.tri(T, C, R, key); m.tri(L, Bm, C, key); m.tri(C, Bm, R, key);
  }
  function butterfly(m, key) {
    m.kite([0, 0, 1.2], [-6.5, -5.5, 0], [-0.6, -1.2, 0], [-2.4, 1.2, 0], key);
    m.kite([0, 0, 1.0], [-4.6, 3.6, 0], [-1.2, 0.6, 0], [-0.4, 1.6, 0], [key, 1]);
    m.strip([-0.2, 2.2], [0.6, -2.6], 1.0, 0.6, 0.4, 'ink');
  }

  /* ============================================================== icons */
  const ICONS = {
    'hp-heart'(m) {
      const c = [24, 23, 9];
      m.fan(c, [[24, 43, 0], [6, 22, 0], [5.5, 14, 0], [10, 7.5, 0], [17, 7, 0], [24, 13.5, 0], [31, 7, 0], [38, 7.5, 0], [42.5, 14, 0], [42, 22, 0]], 'coral');
      m.tri([10, 7.5, 0.4], [17, 7, 0.4], [12.4, 12.6, 1.5], ['cream', 0]);
    },
    kills(m) { m.at(23, 33, 2.35, 0); frog(m, FROG_FR[0], 'teal'); m.at(); },
    dmg(m) {
      m.strip([10, 40], [38, 9], 9, 0, 3.5, 'stone');
      m.strip([7, 43], [14.5, 35.5], 5.2, 4.6, 1.6, 'indigo');
      m.strip([7.5, 33], [17.5, 43], 3.4, 3.4, 1.2, 'mustard');
      for (const [x, y, r] of [[40, 22, 4.5], [27, 6, 3.4]]) { luckySpark(m, x, y, r); }
    },
    rate(m) {
      const P = [[28, 3, 0], [10, 27, 0], [21, 27, 2], [15, 45, 0], [38, 18, 0], [26.5, 18, 2]];
      m.tri(P[0], P[1], P[2], 'mustard'); m.tri(P[0], P[2], P[5], 'mustard'); m.tri(P[2], P[3], P[5], 'mustard'); m.tri(P[3], P[4], P[5], 'mustard');
      m.tri([33, 4, 0], [28, 3, 0], [26.5, 18, 2], 'mustard');
    },
    multi(m) {
      for (const [x, y, a] of [[14, 30, -1.1], [24, 22, -0.75], [35, 30, -0.4]]) { m.at(x, y, 1.5, a); planeShape(m); }
      m.at();
    },
    bounce(m) {
      // waterbomb balloon: a folded cube
      const c = [24, 30], s = 11;
      const top = [[c[0], c[1] - s * 1.2, 0], [c[0] + s, c[1] - s * 0.6, 0], [c[0], c[1], 3], [c[0] - s, c[1] - s * 0.6, 0]];
      m.tri(top[0], top[1], top[2], 'teal'); m.tri(top[0], top[2], top[3], 'teal');
      m.quad([c[0] - s, c[1] - s * 0.6, 0], [c[0], c[1], 3], [c[0], c[1] + s * 1.1, 0], [c[0] - s, c[1] + s * 0.5, 0], ['teal', 0]);
      m.quad([c[0], c[1], 3], [c[0] + s, c[1] - s * 0.6, 0], [c[0] + s, c[1] + s * 0.5, 0], [c[0], c[1] + s * 1.1, 0], ['teal', 1]);
      m.tri([c[0] - s, c[1] - s * 0.6, 0.2], [c[0], c[1], 3.2], [c[0] - s * 0.5, c[1] + s * 0.25, 1.4], ['cream', 1]);
      m.tri([c[0], c[1], 3.2], [c[0] + s, c[1] - s * 0.6, 0.2], [c[0] + s * 0.5, c[1] + s * 0.25, 1.4], ['cream', 1]);
      luckySpark(m, 40, 9, 4);
      luckySpark(m, 9, 12, 3);
    },
    lantern(m) { m.at(24, 24, 2.2, 0.3); shuriken(m, 0); m.at(); },
    speed(m) {
      m.strip([4, 34], [20, 34], 2.6, 2.6, 0.6, 'cream');
      m.strip([7, 40], [21, 40], 2.4, 2.4, 0.6, 'cream');
      const base = [20, 40, 2];
      const tips = [[46, 6], [44, 15], [41, 23], [36, 30]];
      for (let i = 0; i < tips.length; i++) {
        const t = tips[i], prev = i ? tips[i - 1] : [30, 6];
        m.kite(base, [t[0], t[1], 0.5], [prev[0], prev[1], 0], [t[0] - 3, t[1] + 4, 0], i & 1 ? 'teal' : ['teal', 0]);
      }
    },
    magnet(m) {
      m.strip([11, 30], [11, 14], 9, 9, 2.4, 'coral');
      m.strip([37, 30], [37, 14], 9, 9, 2.4, 'coral');
      const arc = [];
      for (let i = 0; i <= 6; i++) { const a = PI + (i / 6) * PI; arc.push([24 + Math.cos(a) * 13, 14 + Math.sin(a) * 11]); }
      for (let i = 0; i < 6; i++) m.strip(arc[i], arc[i + 1], 9, 9, 2.4, 'coral');
      m.strip([11, 42], [11, 31], 9, 9, 2.4, 'cream');
      m.strip([37, 42], [37, 31], 9, 9, 2.4, 'cream');
    },
    hp(m) {
      m.quad([5, 14, 0], [43, 14, 0], [43, 40, 0], [5, 40, 0], 'cream');
      m.tri([5, 40, 0.5], [24, 26, 2.5], [43, 40, 0.5], ['cream', 0]);
      m.tri([5, 14, 0.2], [24, 29, 3.5], [43, 14, 0.2], ['cream', 0]);
      m.at(24, 28, 0.42, 0); ICONS['hp-heart'](m); m.at();
    },
  };
  function planeShape(m) {
    m.tri([7, 0, 1], [-5, -4.8, 1.8], [-3.6, 0, 0], 'cream'); m.tri([7, 0, 1], [-3.6, 0, 0], [-5, 4.8, 1.8], 'cream');
    m.tri([-5, -4.8, 1.8], [-3.0, -3.0, 1.2], [-4.6, -1.6, 0.6], 'coral'); m.tri([-5, 4.8, 1.8], [-4.6, 1.6, 0.6], [-3.0, 3.0, 1.2], 'coral');
  }
  function luckySpark(m, x, y, r) {
    const c = [x, y, r * 0.5];
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * TAU - PI / 2, b = a + PI / 4, b2 = a - PI / 4;
      m.tri(c, [x + Math.cos(b2) * r * 0.3, y + Math.sin(b2) * r * 0.3, 0.2], [x + Math.cos(a) * r, y + Math.sin(a) * r, 0], 'mustard');
      m.tri(c, [x + Math.cos(a) * r, y + Math.sin(a) * r, 0], [x + Math.cos(b) * r * 0.3, y + Math.sin(b) * r * 0.3, 0.2], 'mustard');
    }
  }

  /* ============================================================= ground */
  // The ground is one washi sheet with a crease grid (CS cells, 4 triangles each). Coloured sheets lie on top and
  // are cut along the crease grid: every cell has one region, and a higher sheet fills the cell corner where it wraps
  // around (two sides) – staircases become straight 45° folds. Regions get their meaning from designed sites:
  // villages sit on mustard field diamonds, orchards on blush diamonds, groves are deep-green sheets inside meadows,
  // lakes are sunk below a teal shore band. Folded paper ribbons connect neighbouring sites.
  const CS = 40;                 // crease tessellation cell (world units)
  const MAJOR = 4;               // every 4th line is a full-sheet fold
  const SITE = 520;              // one designed site per SITE x SITE block
  const waterN = (x, y) => U.fbm(x / 720 + 13.1, y / 720 - 7.7, 71, 3);
  const START_SITES = {
    '0,0': { x: 250, y: 40, type: 'village', rad: 118, fixed: true },
    '-1,0': { x: -250, y: 60, type: 'grove', rad: 112, fixed: true },
    '-1,-1': { x: -170, y: -250, type: 'orchard', rad: 92, fixed: true },
    '0,-1': { x: 330, y: -330, type: 'grove', rad: 120, fixed: true },
  };
  const siteCache = new Map();
  function siteOf(ci, cj) {
    const k = ci * 100003 + cj;
    let s = siteCache.get(k);
    if (s) return s;
    const h = U.hashInt(ci, cj, 5303), r = U.rng(h);
    const x = (ci + 0.22 + r.next() * 0.56) * SITE, y = (cj + 0.22 + r.next() * 0.56) * SITE;
    const t = r.next();
    let type = t < 0.36 ? 'village' : t < 0.6 ? 'orchard' : t < 0.84 ? 'grove' : 'none';
    if (waterN(x, y) > 0.55) type = 'none';
    const rad = type === 'village' ? 104 + r.next() * 36 : type === 'orchard' ? 82 + r.next() * 26 : 100 + r.next() * 40;
    s = { x, y, type, rad, h, ci, cj, v: r.next() };
    // the start is composed by hand: a village to the east, a grove to the west, an orchard to the north-west
    const fixed = START_SITES[ci + ',' + cj];
    if (fixed) Object.assign(s, fixed);
    if (siteCache.size > 5000) siteCache.clear();
    siteCache.set(k, s);
    return s;
  }
  const cellCache = new Map();
  function cellRegion(i, j) {
    const key = i * 73856 + j * 19349663;
    let r = cellCache.get(key);
    if (r !== undefined) return r;
    const x = (i + 0.5) * CS, y = (j + 0.5) * CS;
    r = BASE;
    const spawn = x * x + y * y < 210 * 210;
    const w = waterN(x, y);
    if (!spawn && w > 0.64) r = WATER;
    else if (!spawn && w > 0.607) r = SHORE;
    else {
      const ci = Math.floor(x / SITE), cj = Math.floor(y / SITE);
      let near = false, found = -1;
      for (let dj = -1; dj <= 1 && found < 0; dj++) {
        for (let di = -1; di <= 1; di++) {
          const s = siteOf(ci + di, cj + dj);
          if (s.type === 'village' || s.type === 'orchard') {
            if (Math.abs(x - s.x) + Math.abs(y - s.y) < s.rad) { found = s.type === 'village' ? FIELD : BLOSSOM; break; }
          } else if (s.type === 'grove') {
            const k = Math.hypot(x - s.x, y - s.y) / (s.rad * (0.78 + 0.44 * U.noise(x / 90, y / 90, 17)));
            if (k < 1) { found = GROVE; break; }
            if (k < 1.6) near = true;
          }
        }
      }
      if (found >= 0) r = found;
      else {
        const m = U.fbm(x / 470, y / 470, 31, 3);
        r = m > 0.67 ? GROVE : m > 0.53 || near ? MEADOW : BASE;
      }
    }
    if (cellCache.size > 40000) cellCache.clear();
    cellCache.set(key, r);
    return r;
  }
  // outer edge neighbour of triangle k of cell (i,j): [di, dj, k of the neighbour's triangle]
  const OUTER = [[0, -1, 2], [1, 0, 3], [0, 1, 0], [-1, 0, 1]];
  const regCache = new Map();
  function triRegion(i, j, k) {
    const key = (i * 7919 + j) * 4 + k;
    let r = regCache.get(key);
    if (r === undefined) {
      r = cellRegion(i, j);
      const o = OUTER[k], nb = cellRegion(i + o[0], j + o[1]);
      if (nb !== r && LAYER[nb] > LAYER[r]) {
        const a = OUTER[(k + 1) & 3], b = OUTER[(k + 3) & 3];
        if (cellRegion(i + a[0], j + a[1]) === nb || cellRegion(i + b[0], j + b[1]) === nb) r = nb;
      }
      if (regCache.size > 60000) regCache.clear();
      regCache.set(key, r);
    }
    return r;
  }
  function regionAtPoint(x, y) {
    const i = Math.floor(x / CS), j = Math.floor(y / CS);
    const u = x - (i + 0.5) * CS, v = y - (j + 0.5) * CS;
    const k = Math.abs(u) > Math.abs(v) ? (u > 0 ? 1 : 3) : v > 0 ? 2 : 0;
    return triRegion(i, j, k);
  }
  function triPts(i, j, k) {
    const x0 = i * CS, y0 = j * CS, x1 = x0 + CS, y1 = y0 + CS, cx = x0 + CS / 2, cy = y0 + CS / 2;
    switch (k) {
      case 0: return [x0, y0, x1, y0, cx, cy];
      case 1: return [x1, y0, x1, y1, cx, cy];
      case 2: return [x1, y1, x0, y1, cx, cy];
      default: return [x0, y1, x0, y0, cx, cy];
    }
  }
  // relief: the sheet keeps a faint memory of its folds. Every panel between two major folds (4 x 4 cells) has its
  // own crease pattern: 0 pyramids, 1 waterbomb (pyramids up/down in a checker), 2 horizontal pleats, 3 twist.
  // How strongly a panel shows its creases varies at a large scale: calm flat paper next to busy crease fields.
  const RELIEF_UP = [0.022, -0.017, -0.027, 0.013];
  function reliefAmp(i, j) { return 0.35 + 0.9 * U.fbm(i * 0.21 + 4.1, j * 0.21 - 2.3, 91, 2); }
  function patternOf(i, j) {
    const h = U.hash2(Math.floor(i / MAJOR), Math.floor(j / MAJOR), 6007);
    return h < 0.42 ? 0 : h < 0.68 ? 1 : h < 0.84 ? 2 : 3;
  }
  function creaseVis(i, j) {
    const pi = Math.floor(i / MAJOR), pj = Math.floor(j / MAJOR);
    return 0.16 + 0.84 * U.smoothstep(0.38, 0.66, U.fbm(pi * 0.42 + 3.3, pj * 0.42 - 1.7, 123, 2));
  }
  function reliefOf(i, j, k) {
    const pat = patternOf(i, j);
    if (pat === 0) return RELIEF_UP[k];
    if (pat === 1) return ((i + j) & 1) ? -RELIEF_UP[k] : RELIEF_UP[k];
    if (pat === 2) return (j & 1 ? -0.022 : 0.02) + (k === 0 ? 0.004 : k === 2 ? -0.004 : 0);
    return RELIEF_UP[(k + (i & 1) + ((j & 1) << 1)) & 3];
  }
  const rgbs = (c, m) => 'rgb(' + (clamp(c[0] * m, 0, 255) | 0) + ',' + (clamp(c[1] * m, 0, 255) | 0) + ',' + (clamp(c[2] * m, 0, 255) | 0) + ')';
  const HEM = GROUND.map((c, i) => U.rgb(U.mix(c, [255, 252, 244], i === BASE ? 0.6 : 0.55)));

  /* -------- paths: folded paper ribbons between neighbouring sites */
  const RIB_FRONT = '#e8d9bc', RIB_BACK = '#faf5ea', RIB_EDGE = 'rgba(120,92,64,0.38)';
  const pathCache = new Map();
  function pathBetween(a, b) {
    const key = a.ci + ',' + a.cj + '>' + b.ci + ',' + b.cj;
    let p = pathCache.get(key);
    if (p !== undefined) return p;
    p = null;
    if (a.type !== 'none' && b.type !== 'none' && ((a.fixed && b.fixed) || U.hash2(a.h & 0xffff, b.h & 0xffff, 77) < 0.8)) {
      // a polyline of 4 straight runs: the ribbon is folded over at every bend
      const r = U.rng(a.h ^ b.h);
      const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l;
      // the ribbon starts and ends at the doorstep of a site, not in its middle
      const ta = (a.type === 'grove' ? a.rad * 0.95 : a.rad * 0.42) / l, tb = 1 - (b.type === 'grove' ? b.rad * 0.95 : b.rad * 0.42) / l;
      const pts = [[a.x + dx * ta, a.y + dy * ta]];
      for (let s = 1; s < 4; s++) {
        const t = ta + (tb - ta) * (s / 4 + (r.next() - 0.5) * 0.08), off = (r.next() - 0.5) * l * 0.22;
        pts.push([a.x + dx * t + nx * off, a.y + dy * t + ny * off]);
      }
      pts.push([a.x + dx * tb, a.y + dy * tb]);
      let wet = false;
      for (let s = 0; s < 4 && !wet; s++) for (let q = 0; q <= 6; q++) {
        const x = U.lerp(pts[s][0], pts[s + 1][0], q / 6), y = U.lerp(pts[s][1], pts[s + 1][1], q / 6);
        const reg = regionAtPoint(x, y);
        if (reg === WATER || reg === SHORE) { wet = true; break; }
      }
      if (!wet) p = { pts, w: 11 + r.next() * 3 };
    }
    if (pathCache.size > 3000) pathCache.clear();
    pathCache.set(key, p);
    return p;
  }
  function pathsNear(x0, y0, x1, y1) {
    const out = [];
    const ci0 = Math.floor(x0 / SITE) - 1, ci1 = Math.floor(x1 / SITE) + 1, cj0 = Math.floor(y0 / SITE) - 1, cj1 = Math.floor(y1 / SITE) + 1;
    for (let cj = cj0; cj <= cj1; cj++) for (let ci = ci0; ci <= ci1; ci++) {
      const s = siteOf(ci, cj);
      for (const t of [siteOf(ci + 1, cj), siteOf(ci, cj + 1)]) {
        const p = pathBetween(s, t);
        if (!p) continue;
        let mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9;
        for (const q of p.pts) { mnx = Math.min(mnx, q[0]); mxx = Math.max(mxx, q[0]); mny = Math.min(mny, q[1]); mxy = Math.max(mxy, q[1]); }
        if (mxx < x0 - 20 || mnx > x1 + 20 || mxy < y0 - 20 || mny > y1 + 20) continue;
        out.push(p);
      }
    }
    return out;
  }
  /** distance from (x,y) to the nearest path centre line (for keeping props off the ribbons) */
  function pathDist(x, y, paths) {
    let best = 1e9;
    for (const p of paths) for (let s = 0; s < p.pts.length - 1; s++) {
      const a = p.pts[s], b = p.pts[s + 1], dx = b[0] - a[0], dy = b[1] - a[1];
      const t = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy), 0, 1);
      best = Math.min(best, Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t));
    }
    return best;
  }
  function drawRibbon(ctx, p) {
    const n = p.pts.length - 1, hw = p.w / 2;
    // crease line at bend s (1..n-1): the bisector of the two runs – the ribbon is folded flat along it
    const bis = (s) => {
      const a = p.pts[s - 1], o = p.pts[s], b = p.pts[s + 1];
      let ux = a[0] - o[0], uy = a[1] - o[1], vx = b[0] - o[0], vy = b[1] - o[1];
      const lu = Math.hypot(ux, uy) || 1, lv = Math.hypot(vx, vy) || 1;
      ux /= lu; uy /= lu; vx /= lv; vy /= lv;
      let bx = ux + vx, by = uy + vy;
      const lb = Math.hypot(bx, by);
      if (lb < 1e-3) { bx = -uy; by = ux; } else { bx /= lb; by /= lb; }
      return [bx, by];
    };
    // where the edge line at offset w*n (from vertex s, running along d) meets the crease: distance along d
    const cut = (s, dx, dy, nx, ny, w) => {
      if (s <= 0 || s >= n) return 0;
      const [bx, by] = bis(s), cdb = dx * by - dy * bx;
      if (Math.abs(cdb) < 0.15) return 0;
      return clamp((-w * (nx * by - ny * bx)) / cdb, -2.5 * hw, 2.5 * hw);
    };
    const quad = [0, 0, 0, 0, 0, 0, 0, 0];
    const seg = (s, grow) => {
      const a = p.pts[s], b = p.pts[s + 1], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
      const w = hw + grow, nx = -uy, ny = ux;
      const l0 = cut(s, ux, uy, nx, ny, w), r0 = cut(s, ux, uy, -nx, -ny, w), l1 = cut(s + 1, ux, uy, nx, ny, w), r1 = cut(s + 1, ux, uy, -nx, -ny, w);
      quad[0] = a[0] + nx * w + ux * l0; quad[1] = a[1] + ny * w + uy * l0;
      quad[2] = b[0] + nx * w + ux * l1; quad[3] = b[1] + ny * w + uy * l1;
      quad[4] = b[0] - nx * w + ux * r1; quad[5] = b[1] - ny * w + uy * r1;
      quad[6] = a[0] - nx * w + ux * r0; quad[7] = a[1] - ny * w + uy * r0;
      ctx.beginPath(); ctx.moveTo(quad[0], quad[1]); ctx.lineTo(quad[2], quad[3]); ctx.lineTo(quad[4], quad[5]); ctx.lineTo(quad[6], quad[7]); ctx.closePath();
    };
    // soft drop shadow (light from the upper left)
    ctx.save(); ctx.translate(1.4, 1.9); ctx.fillStyle = 'rgba(84,60,58,0.1)';
    for (let s = 0; s < n; s++) { seg(s, 0.3); ctx.fill(); }
    ctx.restore();
    ctx.lineJoin = 'round';
    for (let s = 0; s < n; s++) {
      seg(s, 0);
      // runs alternate front and back: every fold turns the ribbon over
      ctx.fillStyle = s & 1 ? RIB_BACK : RIB_FRONT; ctx.fill();
      ctx.strokeStyle = RIB_EDGE; ctx.lineWidth = 0.45; ctx.stroke();
      // the fold itself: a darker crease along the mitre where this run starts
      if (s > 0) {
        ctx.strokeStyle = 'rgba(96,70,52,0.5)'; ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(quad[0], quad[1]); ctx.lineTo(quad[6], quad[7]); ctx.stroke();
      }
      // dashed valley crease down the middle of the run (fold diagram notation)
      const a = p.pts[s], b = p.pts[s + 1];
      ctx.save();
      ctx.strokeStyle = s & 1 ? 'rgba(120,92,64,0.22)' : 'rgba(255,253,246,0.75)'; ctx.lineWidth = 0.5; ctx.setLineDash([3.2, 2.6]);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      ctx.restore();
    }
  }

  function* renderGround(ctx, info) {
    const i0 = Math.floor(info.wx / CS) - 1, i1 = Math.floor((info.wx + info.size) / CS) + 1;
    const j0 = Math.floor(info.wy / CS) - 1, j1 = Math.floor((info.wy + info.size) / CS) + 1;
    const byLayer = [[], [], [], [], [], []];
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const amp = reliefAmp(i, j) * creaseVis(i, j);
        for (let k = 0; k < 4; k++) {
          const r = triRegion(i, j, k);
          const rel = reliefOf(i, j, k) * amp;
          byLayer[LAYER[r]].push({ i, j, k, r, L: LAYER[r], p: triPts(i, j, k), col: rgbs(GROUND[r], 1 + (r === WATER ? 0 : Math.round(rel * 400) / 400)) });
        }
      }
    }
    const pathOf = (list) => {
      const p = new Path2D();
      for (const t of list) { const q = t.p; p.moveTo(q[0], q[1]); p.lineTo(q[2], q[3]); p.lineTo(q[4], q[5]); p.closePath(); }
      return p;
    };
    // relief tones are quantised to 0.25 % steps, so a layer is a few dozen same-colour paths (fill + seam stroke each)
    const fillTris = (list) => {
      const groups = new Map();
      for (const t of list) {
        let p = groups.get(t.col);
        if (!p) groups.set(t.col, (p = new Path2D()));
        const q = t.p;
        p.moveTo(q[0], q[1]); p.lineTo(q[2], q[3]); p.lineTo(q[4], q[5]); p.closePath();
      }
      ctx.lineWidth = 0.6;
      for (const [col, p] of groups) { ctx.fillStyle = col; ctx.fill(p); ctx.strokeStyle = col; ctx.stroke(p); }
    };
    const lay = (i, j, k) => LAYER[triRegion(i, j, k)];
    for (let L = 0; L < 6; L++) {
      const list = byLayer[L];
      if (!list.length) continue;
      if (L > 0) {
        // drop shadow of this layer onto the lower ones (two offset passes = soft edge); deeper drops cast more
        const p = pathOf(list), d = L === 2 ? 1.25 : 1;
        ctx.save();
        ctx.fillStyle = 'rgba(84,60,58,0.07)'; ctx.translate(2.6 * d, 3.2 * d); ctx.fill(p);
        ctx.fillStyle = 'rgba(84,60,58,0.09)'; ctx.translate(-1.3 * d, -1.6 * d); ctx.fill(p);
        ctx.restore();
      }
      fillTris(list);
      if (L === 0) {
        ctx.save(); ctx.clip(pathOf(list)); waterPleats(ctx, info); ctx.restore();
      } else {
        // straight folded hems: the cream back of the sheet turned over along every lower edge
        for (const t of list) {
          const q = t.p, o = OUTER[t.k];
          const cand = [
            [0, 1, lay(t.i + o[0], t.j + o[1], o[2])],
            [1, 2, lay(t.i, t.j, (t.k + 1) & 3)],
            [2, 0, lay(t.i, t.j, (t.k + 3) & 3)],
          ];
          for (const [a, b, nl] of cand) {
            if (nl >= L) continue;
            const ax = q[a * 2], ay = q[a * 2 + 1], bx = q[b * 2], by = q[b * 2 + 1];
            const c = 3 - a - b, cx = q[c * 2], cy = q[c * 2 + 1];
            const hl = Math.hypot(cx - (ax + bx) / 2, cy - (ay + by) / 2);
            const f = Math.min(0.5, 2.4 / hl);
            const a2x = ax + (cx - ax) * f, a2y = ay + (cy - ay) * f, b2x = bx + (cx - bx) * f, b2y = by + (cy - by) * f;
            ctx.fillStyle = HEM[t.r];
            ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(b2x, b2y); ctx.lineTo(a2x, a2y); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(96,72,60,0.22)'; ctx.lineWidth = 0.4;
            ctx.beginPath(); ctx.moveTo(a2x, a2y); ctx.lineTo(b2x, b2y); ctx.stroke();
            ctx.strokeStyle = 'rgba(96,72,60,0.34)'; ctx.lineWidth = 0.45;
            ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
          }
        }
      }
      yield;
    }
    // crease lines of the tessellation (not on water); calm panels show them only faintly. The visibility is constant
    // per 160-unit panel, so every panel collects its lines into a few paths and strokes each style once.
    ctx.lineCap = 'round';
    const dark = 'rgba(98,76,60,0.16)', grid = 'rgba(98,76,60,0.13)', light = 'rgba(255,253,246,0.7)';
    const CREASE_STYLE = [['rgba(98,76,60,0.07)', 0.6], [light, 0.45], [dark, 0.42], [light, 0.5], [dark, 0.38], [grid, 0.38]];
    const pi0 = Math.floor(i0 / MAJOR), pi1 = Math.floor(i1 / MAJOR), pj0 = Math.floor(j0 / MAJOR), pj1 = Math.floor(j1 / MAJOR);
    for (let pj = pj0; pj <= pj1; pj++) {
      for (let pi = pi0; pi <= pi1; pi++) {
        const bk = [null, null, null, null, null, null];
        const seg = (b, ax, ay, bx, by) => { const p = bk[b] || (bk[b] = new Path2D()); p.moveTo(ax, ay); p.lineTo(bx, by); };
        const ja = Math.max(j0, pj * MAJOR), jb = Math.min(j1, pj * MAJOR + MAJOR - 1), ia = Math.max(i0, pi * MAJOR), ib = Math.min(i1, pi * MAJOR + MAJOR - 1);
        for (let j = ja; j <= jb; j++) {
          for (let i = ia; i <= ib; i++) {
            const pat = patternOf(i, j);
            const up = pat === 1 ? ((i + j) & 1) === 0 : pat === 3 ? (i & 1) === (j & 1) : true;
            const x0 = i * CS, y0 = j * CS, cx = x0 + CS / 2, cy = y0 + CS / 2;
            const w0 = regionIsWet(triRegion(i, j, 0)), w1 = regionIsWet(triRegion(i, j, 1)), w2 = regionIsWet(triRegion(i, j, 2)), w3 = regionIsWet(triRegion(i, j, 3));
            if (pat !== 2) {
              const diag = (dx, dy, wa, wb) => {
                if (wa || wb) return;
                if (up) { seg(0, dx + 0.5, dy + 0.5, cx + 0.5, cy + 0.5); seg(1, dx, dy, cx, cy); } else seg(2, dx, dy, cx, cy);
              };
              diag(x0, y0, w3, w0); diag(x0 + CS, y0, w0, w1); diag(x0 + CS, y0 + CS, w1, w2); diag(x0, y0 + CS, w2, w3);
            }
            if (!w0 && !regionIsWet(triRegion(i, j - 1, 2)) && j % MAJOR !== 0) seg(pat === 2 && (j & 1) ? 3 : pat === 2 ? 4 : 5, x0, y0, x0 + CS, y0);
            if (!w3 && !regionIsWet(triRegion(i - 1, j, 1)) && i % MAJOR !== 0) seg(5, x0, y0, x0, y0 + CS);
          }
        }
        ctx.globalAlpha = creaseVis(pi * MAJOR, pj * MAJOR);
        for (let b = 0; b < 6; b++) if (bk[b]) { ctx.strokeStyle = CREASE_STYLE[b][0]; ctx.lineWidth = CREASE_STYLE[b][1]; ctx.stroke(bk[b]); }
      }
    }
    ctx.globalAlpha = 1;
    yield;
    // major folds in diagram notation (valley = dashed, mountain = dash-dot), drawn per panel so they fade in and out
    const M = CS * MAJOR;
    ctx.save();
    ctx.lineWidth = 0.6;
    const VD = [5, 3.5], MD = [7, 2.5, 1.2, 2.5];
    for (let gx = Math.floor(info.wx / M) * M; gx <= info.wx + info.size + 1; gx += M) {
      const valley = Math.round(gx / M) % 2 === 0;
      ctx.strokeStyle = valley ? 'rgba(59,74,135,0.3)' : 'rgba(201,91,71,0.32)';
      ctx.setLineDash(valley ? VD : MD);
      for (let gy = Math.floor(info.wy / M) * M - M; gy <= info.wy + info.size; gy += M) {
        const a = creaseVis(gx / CS, gy / CS) * creaseVis(gx / CS - 1, gy / CS);
        if (a < 0.2) continue;
        ctx.globalAlpha = a; ctx.lineDashOffset = gy;
        ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + M); ctx.stroke();
      }
    }
    for (let gy = Math.floor(info.wy / M) * M; gy <= info.wy + info.size + 1; gy += M) {
      const valley = Math.round(gy / M) % 2 !== 0;
      ctx.strokeStyle = valley ? 'rgba(59,74,135,0.3)' : 'rgba(201,91,71,0.32)';
      ctx.setLineDash(valley ? VD : MD);
      for (let gx = Math.floor(info.wx / M) * M - M; gx <= info.wx + info.size; gx += M) {
        const a = creaseVis(gx / CS, gy / CS) * creaseVis(gx / CS, gy / CS - 1);
        if (a < 0.2) continue;
        ctx.globalAlpha = a; ctx.lineDashOffset = gx;
        ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + M, gy); ctx.stroke();
      }
    }
    ctx.setLineDash([]);
    ctx.restore();
    // paper ribbons between the sites
    const paths = pathsNear(info.wx - 30, info.wy - 30, info.wx + info.size + 30, info.wy + info.size + 30);
    for (const p of paths) drawRibbon(ctx, p);
    // paper fibre over the whole sheet
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 0.5;
    const fw = FIBRE.width, sx = -(((info.wx * info.res) % fw) + fw) % fw, sy = -(((info.wy * info.res) % fw) + fw) % fw;
    for (let y = sy; y < info.px; y += fw) for (let x = sx; x < info.px; x += fw) ctx.drawImage(FIBRE, x, y);
    ctx.restore();
    yield;
    yield* groundDecals(ctx, info, paths);
  }
  const regionIsWet = (r) => r === WATER || r === SHORE;

  /** Folded waves: rows of chevron pleats – a ridge (light line), a shaded slope, a valley (dark line), a lit slope. */
  const PLEAT = ['#a9c3ea', '#7f9dd3', '#6d8cc6'];
  function waterPleats(ctx, info) {
    const PW = 18, PH = 11, A = 3.4;
    const r0 = Math.floor(info.wy / PH) - 2, r1 = Math.floor((info.wy + info.size) / PH) + 2;
    const xa = info.wx - 24, xb = info.wx + info.size + 24;
    const row = (r, dy) => {
      const off = U.hash2(r, 3, 77) * PW, h = PW / 2, pts = [];
      let x = Math.floor((xa + off) / h) * h - off;
      for (; x <= xb + h; x += h) {
        const f = Math.round((x + off) / h);
        pts.push(x, r * PH + dy + ((f & 1) ? A : 0));
      }
      return pts;
    };
    const line = (pts, back) => {
      if (!back) for (let i = 0; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
      else for (let i = pts.length - 2; i >= 0; i -= 2) ctx.lineTo(pts[i], pts[i + 1]);
    };
    for (let r = r0; r <= r1; r++) {
      const top = row(r, 0), mid = row(r, PH * 0.45), bot = row(r + 1, 0);
      ctx.fillStyle = PLEAT[2];
      ctx.beginPath(); ctx.moveTo(top[0], top[1]); line(top); line(mid, true); ctx.closePath(); ctx.fill();
      ctx.fillStyle = PLEAT[0];
      ctx.beginPath(); ctx.moveTo(mid[0], mid[1]); line(mid); line(bot, true); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(44,64,122,0.32)'; ctx.lineWidth = 0.45;
      ctx.beginPath(); ctx.moveTo(mid[0], mid[1]); line(mid); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.55;
      ctx.beginPath(); ctx.moveTo(top[0], top[1]); line(top); ctx.stroke();
    }
    // the pleats deepen towards the middle of the lake: a darker pleat sheet where the water is deep
    ctx.fillStyle = 'rgba(40,58,118,0.13)';
    for (let y = Math.floor(info.wy / CS) * CS; y < info.wy + info.size; y += CS) {
      for (let x = Math.floor(info.wx / CS) * CS; x < info.wx + info.size; x += CS) {
        if (waterN(x + CS / 2, y + CS / 2) > 0.69) ctx.fillRect(x, y, CS, CS);
      }
    }
    // folded wave crests: little cream hooks, in loose rows
    G.scatter(info, 46, 5151, 14, (x, y, rng) => {
      if (rng.next() < 0.35) return;
      if (regionAtPoint(x, y) !== WATER || regionAtPoint(x - 10, y) !== WATER || regionAtPoint(x + 10, y) !== WATER) return;
      const s = 0.8 + rng.next() * 0.5;
      const m = new Fold();
      m.at(x, Math.round(y / PH) * PH + 2, s, 0);
      m.tri([-7, 2, 0], [0, -1.2, 1.4], [-1, 2, 0.6], ['cream', 0]);
      m.tri([-1, 2, 0.6], [0, -1.2, 1.4], [4, 2, 0], ['cream', 1]);
      m.tri([0, -1.2, 1.4], [3.8, -3.6, 0.8], [2.2, 0.4, 0.8], 'cream');
      m.at();
      renderFold(ctx, m, { ol: 0.35, cw: 0.25, seam: 0.3 });
    });
  }

  /* -------- ground decals: clustered, never evenly sprinkled */
  const FLOWER_KEYS = ['blush', 'cream', 'mustard', 'cream'];
  // three tuft cuts: a fan of three, a wide four-blade clump, a slim pair
  const TUFT_SHAPES = [
    [[-1.5, 0, -3.6, -5.2, 1.4], [0, 0, 0.6, -7.0, 1.6], [1.4, 0, 3.8, -4.6, 1.4]],
    [[-2.2, 0, -4.8, -4.2, 1.3], [-0.5, 0, -1.2, -7.6, 1.6], [1.1, 0, 2.4, -6.2, 1.5], [2.4, 0, 5.2, -3.4, 1.2]],
    [[-0.8, 0, -2.6, -6.4, 1.6], [0.9, 0, 2.9, -4.8, 1.5]],
  ];
  function tuft(m, x, y, s, key, shape) {
    m.at(x, y, s, 0);
    for (const b of TUFT_SHAPES[shape || 0]) m.strip([b[0], b[1]], [b[2], b[3]], b[4], 0, 0.5 + b[4] * 0.06, key);
  }
  // ground decals are stamped from sprites baked once (per sprite resolution) – a chunk then costs a few
  // drawImage calls instead of hundreds of tiny fold meshes
  let DECALS = null;
  function decalSprites() {
    if (DECALS && DECALS.K === K) return DECALS;
    const o = { ol: 0.38, cw: 0.26, fibre: 0 };
    const D = { K, tuft: {}, flower: {}, pebble: [] };
    for (const key of ['sage', 'pine']) {
      D.tuft[key] = [];
      for (let sh = 0; sh < TUFT_SHAPES.length; sh++) for (const mir of [false, true]) D.tuft[key].push(bake([-6, -9, 6, 1.6], (m) => tuft(m, 0, 0, 1, key, sh), mir, o));
    }
    for (const key of ['blush', 'cream', 'mustard']) {
      D.flower[key] = [0, 0.5, 1.05].map((rot) => bake([-5, -5, 5, 5], (m) => flower(m, 0, 0, 1, rot, key), false, o));
    }
    const peb = (m) => { m.at(0, 0, 1, 0); m.fan([-0.6, -1.6, 2.2], [[-4, 0.6, 0], [-3.4, -1.8, 0], [-0.6, -3, 0], [2.8, -2.2, 0], [4, 0.2, 0], [0.6, 1.4, 0]], 'stone'); };
    D.pebble.push(bake([-5, -4, 5, 2.2], peb, false, o), bake([-5, -4, 5, 2.2], peb, true, o));
    // crop sprouts leaning left / right (they sit on the raised crease of a ridge)
    D.sprout = [-0.18, 0.18].map((rot) => bake([-4.6, -5.6, 4.6, 1.4], (m) => { m.at(0, 0, 1, rot); m.kite([0, 0, 1.6], [-3.4, -3.4, 1.0], [-0.6, -1.4, 1.2], [-2.6, -0.4, 1.2], 'pine'); m.kite([0, 0, 1.6], [3.0, -4.0, 1.0], [0.6, -1.6, 1.2], [2.8, -0.8, 1.2], ['pine', 1]); m.at(); }, false, o));
    DECALS = D;
    return D;
  }
  function stamp(ctx, s, x, y, sc) {
    const k = sc / K;
    ctx.drawImage(s.c, x - s.ox * k, y - s.oy * k, s.c.width * k, s.c.height * k);
  }
  function flower(m, x, y, s, rot, key) {
    m.at(x, y, s, rot);
    for (let p = 0; p < 4; p++) {
      const ang = (p / 4) * TAU;
      m.kite([0, 0, 1.5], [Math.cos(ang) * 4.0, Math.sin(ang) * 4.0, 0], [Math.cos(ang + 0.62) * 3.4, Math.sin(ang + 0.62) * 3.4, 0], [Math.cos(ang - 0.62) * 3.4, Math.sin(ang - 0.62) * 3.4, 0], key);
    }
    m.dot(0, 0, 0.9, key === 'mustard' ? '#c95b47' : '#e6ae42');
  }
  function* groundDecals(ctx, info, paths) {
    let n = 0;
    const list = [];
    const pdist = (x, y) => (paths.length ? pathDist(x, y, paths) : 1e9);
    // 1) single accents on a 15-unit grid: flowers only in drifts, pebbles on shores, grass lining the ribbons
    G.scatter(info, 15, 7331, 8, (x, y, rng) => {
      const r = rng.next(), a = rng.next(), b = rng.next(), c = rng.next();
      const reg = regionAtPoint(x, y);
      if (reg === WATER || reg === FIELD) return;
      const pd = pdist(x, y);
      if (pd < 9) return;
      const byPath = pd < 16;
      const drift = U.noise(x / 52, y / 52, 333);              // flower drifts: small dense patches, calm between
      let t = null;
      if (reg === SHORE) { if (r < 0.16) t = 'pebble'; }
      else if (reg === BLOSSOM) { if (drift > 0.56 && r < 0.42) t = 'flower'; else if (r < 0.04) t = 'scrap'; }
      else if (reg === MEADOW || reg === GROVE) {
        if (byPath && r < 0.3) t = 'tuft';
        else if (reg === MEADOW && drift > 0.75 && r < 0.7) t = 'flower';
      } else {
        if (byPath && r < 0.2) t = r < 0.07 ? 'pebble' : 'tuft';
        else if (drift > 0.8 && r < 0.4) t = 'flower';
        else if (r < 0.005) t = 'scrap';
        else if (r < 0.008) t = 'arrow';
      }
      if (t) list.push([x, y, t, a, b, c, reg]);
    });
    // 2) grass clumps: 3-7 folded tufts around one centre, biggest in the middle. They gather where something
    //    happens – along sheet edges, at ribbon verges, around shores – and leave the open paper calm.
    G.scatter(info, 62, 7417, 26, (x, y, rng) => {
      const reg = regionAtPoint(x, y);
      if (reg === WATER || reg === FIELD) return;
      const pd = pdist(x, y);
      if (pd < 13) return;
      let edge = false;
      for (let q = 0; q < 6 && !edge; q++) {
        const ang = q * 1.047 + 0.3;
        if (regionAtPoint(x + Math.cos(ang) * 20, y + Math.sin(ang) * 20) !== reg) edge = true;
      }
      const lush = reg === MEADOW || reg === GROVE || reg === SHORE;
      const p = edge ? (lush ? 0.85 : 0.6) : pd < 32 ? 0.5 : lush ? 0.2 : 0.04;
      if (rng.next() > p) return;
      const cnt = 3 + ((rng.next() * (lush ? 5 : 3)) | 0), a0 = rng.next() * TAU;
      for (let k = 0; k < cnt; k++) {
        const ang = a0 + k * 2.39996, d = k === 0 ? 0 : 2.6 + Math.sqrt(k) * 3.6 * (0.8 + rng.next() * 0.4);
        const tx = x + Math.cos(ang) * d * 1.3, ty = y + Math.sin(ang) * d * 0.75;
        const u = rng.next(), v = rng.next();
        if (regionAtPoint(tx, ty) === WATER || pdist(tx, ty) < 9) continue;
        list.push([tx, ty, 'tuft', u, 0.95 - (k / cnt) * 0.75, v, reg]);
      }
      // a clump in a meadow sometimes hides one flower or a pebble at its foot
      const acc = rng.next();
      if (lush && acc < 0.35) list.push([x + 6 + rng.next() * 4, y + 2, reg === SHORE ? 'pebble' : 'flower', rng.next(), 0.4, rng.next(), reg]);
    });
    // 3) fields: pleated crop ridges on the 45° grid of the diamond – double rows with a fallow gap, cut short
    //    around houses, fences and ribbons. A raised centre crease gives each ridge a lit and a shaded half.
    const sites = [];
    const ci0 = Math.floor(info.wx / SITE) - 1, cj0 = Math.floor(info.wy / SITE) - 1;
    for (let cj = cj0; cj <= cj0 + 2; cj++) for (let ci = ci0; ci <= ci0 + 2; ci++) { const s = siteOf(ci, cj); if (s.type === 'village') sites.push(s); }
    const ridges = [];
    for (const s of sites) {
      const R = s.rad, step = 12, M = 14;
      if (s.x + R < info.wx - M || s.x - R > info.wx + info.size + M || s.y + R < info.wy - M || s.y - R > info.wy + info.size + M) continue;
      const busy = arrangementOf(s).map((it) => [it[0], it[1], it[2] === 'house' || it[2] === 'tree' ? 24 : it[2] === 'fence' ? 20 : 14]);
      const ok = (x, y) => {
        if (Math.abs(x - s.x) + Math.abs(y - s.y) > R - 14 || Math.hypot(x - s.x, (y - s.y) * 1.2) < 54) return false;
        if (regionAtPoint(x, y) !== FIELD || pdist(x, y) < 12) return false;
        for (const q of busy) if (Math.hypot(x - q[0], y - q[1]) < q[2]) return false;
        return true;
      };
      for (let u = -R; u <= R; u += step) {
        if (Math.floor((u + R) / (step * 2)) % 3 === 2) continue;  // every third double row lies fallow
        let run = [];
        const flush = () => { if (run.length >= 3) ridges.push(run); run = []; };
        for (let v = -R; v <= R; v += 3.5) {
          const x = s.x + (u - v) * 0.7071, y = s.y + (u + v) * 0.7071;
          if (ok(x, y)) run.push([x, y]); else flush();
        }
        flush();
      }
    }
    const DS = decalSprites();
    for (const pts of ridges) {
      const p0 = pts[0], p1 = pts[pts.length - 1];
      if (Math.max(p0[0], p1[0]) < info.wx - 8 || Math.min(p0[0], p1[0]) > info.wx + info.size + 8) continue;
      if (Math.max(p0[1], p1[1]) < info.wy - 8 || Math.min(p0[1], p1[1]) > info.wy + info.size + 8) continue;
      const m = new Fold();
      // tapered ends: the ridge is folded down to a point where the row stops
      const tip = 3.2, ux = p1[0] - p0[0], uy = p1[1] - p0[1], ul = Math.hypot(ux, uy) || 1;
      const a0 = [p0[0] + (ux / ul) * tip, p0[1] + (uy / ul) * tip], a1 = [p1[0] - (ux / ul) * tip, p1[1] - (uy / ul) * tip];
      m.strip(a0, p0, 3.2, 0, 1.1, 'sage', ['sage', 1]);
      m.strip(a0, a1, 3.2, 3.2, 1.1, 'sage', ['sage', 1]);
      m.strip(a1, p1, 3.2, 0, 1.1, 'sage', ['sage', 1]);
      // sprouts sit on the crease, alternating lean, a little irregular so the row reads as hand-planted
      renderFold(ctx, m, { ol: 0.34, cw: 0.24, seam: 0.3 });
      for (let i = 1; i < pts.length - 1; i += 2) {
        const x = pts[i][0], y = pts[i][1], h = U.hash2((x * 8) | 0, (y * 8) | 0, 41);
        if (h < 0.18) continue;
        stamp(ctx, DS.sprout[i & 2 ? 0 : 1], x + (h - 0.5) * 1.2, y - 0.6, 0.62 + h * 0.22);
      }
      if ((++n & 7) === 0) yield;
    }
    // flat decals overlap front-to-back like real paper bits
    list.sort((p, q) => p[1] - q[1]);
    const D = decalSprites();
    for (const [x, y, t, a, b, c, reg] of list) {
      if (t === 'flower') {
        const key = reg === BLOSSOM ? (a < 0.6 ? 'blush' : 'cream') : FLOWER_KEYS[(a * FLOWER_KEYS.length) | 0];
        stamp(ctx, D.flower[key][(c * 3) | 0], x, y, 0.6 + b * 0.35);
        continue;
      }
      if (t === 'tuft') {
        const set = D.tuft[reg === GROVE || reg === SHORE ? 'pine' : 'sage'];
        stamp(ctx, set[(a * set.length) | 0], x, y, 0.7 + b * 0.55);
        continue;
      }
      if (t === 'pebble') { stamp(ctx, D.pebble[a < 0.5 ? 0 : 1], x, y, 0.55 + b * 0.5); continue; }
      const m = new Fold();
      if (t === 'scrap') {
        const keys = ['blush', 'sage', 'cream', 'mustard'];
        for (let q = 0; q < 2; q++) {
          m.at(x + (q ? 3 : 0), y + (q ? 2 : 0), 1.2 + b * 0.8, c * TAU + q * 2);
          m.tri([0, -1, 0.3], [1.1, 0.8, 0], [-1.1, 0.8, 0], keys[((a + q * 0.37) * keys.length | 0) % keys.length]);
        }
      } else {
        // fold arrow from the diagram
        ctx.save();
        ctx.translate(x, y); ctx.rotate(c * TAU);
        ctx.strokeStyle = 'rgba(59,74,135,0.4)'; ctx.lineWidth = 0.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 6, 9, -PI * 0.85, -PI * 0.2); ctx.stroke();
        const ex = Math.cos(-PI * 0.2) * 9, ey = 6 + Math.sin(-PI * 0.2) * 9;
        ctx.beginPath(); ctx.moveTo(ex - 2.6, ey - 1.4); ctx.lineTo(ex, ey); ctx.lineTo(ex - 0.6, ey - 3); ctx.stroke();
        ctx.restore();
        continue;
      }
      m.at();
      renderFold(ctx, m, { ol: 0.38, cw: 0.26, seam: 0.3 });
      if ((++n & 15) === 0) yield;
    }
  }

  /* ========================================================= draw helpers */
  let TV = null;
  const TF = { S: 1, ox: 0, oy: 0 };
  function tf(view) {
    if (TV !== view) { TV = view; TF.S = view.S; TF.ox = view.W / 2 - view.x * view.S; TF.oy = view.H / 2 - view.y * view.S; }
    return TF;
  }
  function blit(ctx, s, x, y, sx, sy, img) {
    const k = 1 / K, c = img || s.c;
    ctx.drawImage(c, x - s.ox * k * sx, y - s.oy * k * sy, c.width * k * sx, c.height * k * sy);
  }
  function blitRot(ctx, V, s, x, y, sx, sy, rot, img) {
    if (!rot) return blit(ctx, s, x, y, sx, sy, img);
    const S = V.S, co = Math.cos(rot) * S, si = Math.sin(rot) * S;
    ctx.setTransform(co, si, -si, co, V.ox + x * S, V.oy + y * S);
    const k = 1 / K, c = img || s.c;
    ctx.drawImage(c, -s.ox * k * sx, -s.oy * k * sy, c.width * k * sx, c.height * k * sy);
    ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
  }

  const SPR = {};
  /** Right- and left-facing sprite of one pose + their cast shadows. opt.shadow reuses the shadows of another set
   *  (blink frames), opt.crumple bakes the crumpled version (hit / hurt frames). */
  function actorSet(box, fn, opt) {
    const bo = opt.crumple ? { crumple: opt.crumple, cseed: opt.cseed } : undefined;
    const r = bake(box, (m) => fn(m), false, bo), l = bake(box, (m) => fn(m), true, bo);
    if (opt.shadow) return { r, l, sr: opt.shadow.sr, sl: opt.shadow.sl };
    return {
      r, l,
      sr: castShadow(r, opt.shx, opt.shy, opt.a, opt.contact, opt.blur),
      sl: castShadow(l, opt.shx, opt.shy, opt.a, opt.contact, opt.blur),
    };
  }
  const UPRIGHT = { shx: 0.62, shy: -0.36, a: 0.3 };

  /* -------- number sprites (Zen Maru Gothic once loaded) */
  const numCache = new Map();
  let fontOK = false, fontCheckT = -1;
  function fontReady(rt) {
    if (fontOK) return true;
    if (rt - fontCheckT < 0.5 && fontCheckT >= 0) return false;
    fontCheckT = rt;
    if (document.fonts) document.fonts.forEach((f) => { if (f.family.replace(/["']/g, '') === 'Zen Maru Gothic' && f.status === 'loaded' && f.weight === '900') fontOK = true; });
    if (fontOK) numCache.clear();
    return fontOK;
  }
  function numSprite(value, crit, rt) {
    const ok = fontReady(rt);
    const key = value + (crit ? 'c' : 'n') + (ok ? 'Z' : 'F');
    let s = numCache.get(key);
    if (s) return s;
    if (numCache.size > 400) numCache.clear();
    const fs = (crit ? 12 : 8.5) * K;
    const font = '900 ' + fs + 'px "Zen Maru Gothic", "M PLUS Rounded 1c", "Arial Rounded MT Bold", sans-serif';
    const meas = U.canvas(4, 4).ctx;
    meas.font = font;
    const txt = String(value);
    const tw = meas.measureText(txt).width;
    const w = Math.ceil(tw + fs * 1.2), h = Math.ceil(fs * 1.7);
    const { c, ctx } = U.canvas(w, h);
    const cx = w / 2, cy = h / 2;
    if (crit) {
      // a folded paper tag behind the value
      const tx = tw / 2 + fs * 0.34, ty = fs * 0.62;
      ctx.fillStyle = 'rgba(78,56,72,0.28)';
      ctx.beginPath(); ctx.moveTo(cx - tx + fs * 0.12, cy - ty + fs * 0.14); ctx.lineTo(cx + tx + fs * 0.12, cy - ty + fs * 0.14); ctx.lineTo(cx + tx + fs * 0.12, cy + ty + fs * 0.14); ctx.lineTo(cx - tx + fs * 0.12, cy + ty + fs * 0.14); ctx.fill();
      ctx.fillStyle = '#f8d372'; ctx.beginPath(); ctx.moveTo(cx - tx, cy - ty); ctx.lineTo(cx + tx, cy - ty); ctx.lineTo(cx + tx, cy); ctx.lineTo(cx - tx, cy); ctx.fill();
      ctx.fillStyle = '#e6ae42'; ctx.beginPath(); ctx.moveTo(cx - tx, cy); ctx.lineTo(cx + tx, cy); ctx.lineTo(cx + tx, cy + ty); ctx.lineTo(cx - tx, cy + ty); ctx.fill();
      ctx.strokeStyle = 'rgba(255,253,240,0.9)'; ctx.lineWidth = fs * 0.05; ctx.beginPath(); ctx.moveTo(cx - tx, cy); ctx.lineTo(cx + tx, cy); ctx.stroke();
    }
    ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    const ty0 = cy + fs * 0.04;
    if (!crit) { ctx.strokeStyle = '#fffbf3'; ctx.lineWidth = fs * 0.32; ctx.strokeText(txt, cx, ty0); }
    ctx.fillStyle = crit ? '#9b4136' : '#3b4a87';
    ctx.fillText(txt, cx, ty0);
    s = { c, ox: w / 2, oy: h / 2 };
    numCache.set(key, s);
    return s;
  }

  /* -------- screen light: soft light from the upper left, warm vignette */
  let screenC = null, screenKey = '';
  function screenLight(W, H) {
    const key = W + 'x' + H;
    if (screenKey === key && screenC) return screenC;
    screenKey = key;
    const { c, ctx } = U.canvas(W, H);
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, 'rgba(255,250,235,0.16)');
    g.addColorStop(0.45, 'rgba(255,250,235,0)');
    g.addColorStop(0.7, 'rgba(90,64,80,0)');
    g.addColorStop(1, 'rgba(90,64,80,0.14)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const r = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
    r.addColorStop(0, 'rgba(96,70,70,0)');
    r.addColorStop(1, 'rgba(96,70,70,0.17)');
    ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
    screenC = c;
    return c;
  }

  /* ================================================================ CSS */
  const CSS = `
body.style-origami { font-family: 'M PLUS Rounded 1c', 'Zen Maru Gothic', system-ui, sans-serif; color: #3d3852; }
body.style-origami #hud { padding: 16px 24px; }
body.style-origami #hud .xp { height: 20px; border: 0; border-radius: 0; overflow: hidden;
  background: linear-gradient(180deg, #fffaf1 0 48%, #ebe0cb 52% 100%);
  box-shadow: 0 0 0 1px rgba(120,96,80,.24), 3px 4px 0 rgba(82,60,72,.15); }
body.style-origami #hud .xp-fill { box-shadow: 1px 0 0 #1a5b56;
  background: linear-gradient(180deg, rgba(255,255,255,.22) 0 48%, rgba(10,40,36,.12) 52% 100%), repeating-linear-gradient(118deg, #43ad9f 0 18px, #33998c 18px 36px); }
body.style-origami #hud .lvl { right: 0; top: 0; transform: none; height: 100%; display: flex; align-items: center; padding: 0 10px 0 16px;
  font: 900 13px/1 'Zen Maru Gothic', sans-serif; letter-spacing: .06em; color: #fffbf3; text-shadow: none;
  background: linear-gradient(180deg, #ee8466 0 48%, #d8644b 52% 100%); clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 7px 50%); }
body.style-origami #hud .topline { display: grid; grid-template-columns: 1fr auto 1fr; align-items: start; margin-top: 14px; }
body.style-origami #hud .hp { position: relative; justify-self: start; gap: 8px; }
body.style-origami #hud .hp-icon, body.style-origami #hud .kills-icon { width: 44px; height: 44px; filter: drop-shadow(2px 3px 0 rgba(82,60,72,.2)); }
body.style-origami #hud .hp-bar { width: 250px; height: 26px; border: 0; border-radius: 0;
  background: linear-gradient(180deg, #fffaf1 0 50%, #e9ddc7 50% 100%);
  box-shadow: 0 0 0 1px rgba(120,96,80,.26), 3px 4px 0 rgba(82,60,72,.16); }
body.style-origami #hud .hp-fill { box-shadow: 1px 0 0 #9b4136;
  background: linear-gradient(180deg, rgba(255,255,255,.2) 0 50%, rgba(90,24,14,.13) 50% 100%), repeating-linear-gradient(62deg, #ee8063 0 15px, #df6c52 15px 30px); }
body.style-origami #hud .hp-text { position: absolute; left: 52px; width: 250px; top: 50%; transform: translateY(-50%); text-align: center;
  font: 900 15px/1 'Zen Maru Gothic', sans-serif; letter-spacing: .04em; color: #3d3852; text-shadow: 0 0 3px #fffaf1, 0 0 2px #fffaf1, 0 0 1px #fffaf1; }
body.style-origami.hurt #hud .hp { animation: origamiShake .22s linear; }
@keyframes origamiShake { 0%,100% { transform: none } 25% { transform: translate(-3px,1px) rotate(-1deg) } 75% { transform: translate(3px,-1px) rotate(1deg) } }
body.style-origami #hud .clock { position: relative; isolation: isolate; justify-self: center; min-width: 168px; padding: 9px 30px 7px; margin-top: -4px;
  background: #fbf5e8; box-shadow: 0 0 0 1px rgba(120,96,80,.24), 4px 5px 0 rgba(82,60,72,.15); }
body.style-origami #hud .clock::before { content: ''; position: absolute; inset: 0; z-index: -1;
  background: linear-gradient(to top right, transparent calc(50% - 1px), rgba(120,96,80,.2) 50%, transparent calc(50% + 1px)) left bottom / 50% 62% no-repeat,
    linear-gradient(to top left, transparent calc(50% - 1px), rgba(120,96,80,.2) 50%, transparent calc(50% + 1px)) right bottom / 50% 62% no-repeat; }
body.style-origami #hud .clock::after { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 60%; z-index: -1;
  background: linear-gradient(90deg, #f3e9d6 0 50%, #e9dcc4 50% 100%); clip-path: polygon(0 0, 100% 0, 50% 100%); }
body.style-origami #hud .clock-time { font: 900 32px/1.05 'Zen Maru Gothic', sans-serif; letter-spacing: .05em; color: #3b4a87; text-shadow: 2px 2px 0 rgba(255,251,243,.9); }
body.style-origami #hud .clock-label { font: 700 15px/1.1 'Kalam', cursive; letter-spacing: .02em; text-transform: none; opacity: 1; color: #c95b47; }
body.style-origami #hud .kills { position: relative; justify-self: end; min-width: 0; gap: 6px; padding: 3px 26px 3px 8px;
  background: linear-gradient(225deg, transparent 14px, #fbf5e8 14px);
  filter: drop-shadow(0 0 .6px rgba(110,86,70,.9)) drop-shadow(3px 4px 0 rgba(82,60,72,.15));
  font: 900 26px/1 'Zen Maru Gothic', sans-serif; color: #3d3852; text-shadow: none; }
body.style-origami #hud .kills::after { content: ''; position: absolute; right: 0; top: 0; width: 14px; height: 14px; background: linear-gradient(225deg, transparent 50%, #dccbae 50%); }
body.style-origami #stylebar { border: 0; border-radius: 0; padding: 8px 28px; gap: 14px; bottom: 16px; color: #3d3852;
  background: linear-gradient(90deg, #fcf7ec 0 50%, #f1e7d4 50% 100%);
  box-shadow: 0 0 0 1px rgba(120,96,80,.24), 4px 5px 0 rgba(82,60,72,.15); font: 700 12px/1.2 'M PLUS Rounded 1c', sans-serif; }
body.style-origami #stylebar .style-family { font: 700 15px/1 'Kalam', cursive; letter-spacing: .02em; text-transform: none; opacity: 1; color: #277f76; }
body.style-origami #stylebar .style-name { font: 900 18px/1 'Zen Maru Gothic', sans-serif; letter-spacing: .04em; color: #c95b47; }
body.style-origami #stylebar .style-hint { opacity: .75; }
body.style-origami #stylebar .auto.on { color: #277f76; }
body.style-origami #levelup { gap: 30px;
  background: repeating-linear-gradient(45deg, rgba(255,250,240,.13) 0 1px, transparent 1px 64px), repeating-linear-gradient(-45deg, rgba(255,250,240,.13) 0 1px, transparent 1px 64px),
    linear-gradient(135deg, rgba(59,74,135,.34), rgba(40,52,98,.5)); -webkit-backdrop-filter: saturate(.75); backdrop-filter: saturate(.75); }
body.style-origami #levelup .lu-title { padding: 12px 64px 14px; font: 900 54px/1 'Zen Maru Gothic', sans-serif; letter-spacing: .06em; color: #fffbf3; text-shadow: 2px 3px 0 rgba(120,40,30,.35);
  background: linear-gradient(180deg, #ee8466 0 50%, #d8644b 50% 100%); clip-path: polygon(0 0, 100% 0, calc(100% - 22px) 50%, 100% 100%, 0 100%, 22px 50%);
  animation: origamiUnfoldTitle .5s cubic-bezier(.2,1.3,.4,1) backwards; }
@keyframes origamiUnfoldTitle { from { transform: scaleX(.05); } to { transform: none; } }
body.style-origami #levelup .lu-cards { gap: 30px; }
body.style-origami #levelup .card { --r: -1.5deg; position: relative; isolation: isolate; width: 232px; min-height: 300px; padding: 0 18px 24px; gap: 8px; color: #3d3852;
  background: linear-gradient(180deg, #fffaf1, #f5ecdb); border: 0; border-radius: 0; transform: rotate(var(--r)); transform-origin: 50% 0;
  box-shadow: 0 0 0 1px rgba(120,96,80,.24), 6px 8px 0 rgba(82,60,72,.16);
  transition: transform .16s cubic-bezier(.3,1.5,.5,1); animation: origamiUnfold .6s cubic-bezier(.2,1.25,.4,1) backwards; }
body.style-origami #levelup .card:nth-child(2) { --r: 1.2deg; animation-delay: .08s; }
body.style-origami #levelup .card:nth-child(3) { --r: -.6deg; animation-delay: .16s; }
@keyframes origamiUnfold { from { transform: perspective(700px) rotateX(-88deg); opacity: 0; } to { transform: perspective(700px) rotateX(0) rotate(var(--r)); opacity: 1; } }
body.style-origami #levelup .card::before { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 118px; z-index: -1;
  background: linear-gradient(90deg, #f29074 0 50%, #e2735a 50% 100%); clip-path: polygon(0 0, 100% 0, 50% 100%); }
body.style-origami #levelup .card:nth-child(2)::before { background: linear-gradient(90deg, #5cbcae 0 50%, #35a194 50% 100%); }
body.style-origami #levelup .card:nth-child(3)::before { background: linear-gradient(90deg, #f4c862 0 50%, #e2a83e 50% 100%); }
body.style-origami #levelup .card::after { content: ''; position: absolute; inset: 0; z-index: -1; pointer-events: none;
  background: linear-gradient(to top right, transparent calc(50% - .6px), rgba(120,96,80,.18) 50%, transparent calc(50% + .6px)) left bottom / 50% 42% no-repeat,
    linear-gradient(to top left, transparent calc(50% - .6px), rgba(120,96,80,.18) 50%, transparent calc(50% + .6px)) right bottom / 50% 42% no-repeat; }
body.style-origami #levelup .card:hover { transform: translateY(-10px) rotate(0deg); }
body.style-origami #levelup .card-icon { width: 116px; height: 116px; margin-top: 28px; padding: 8px;
  background: conic-gradient(from 45deg, #fffbf3 0 25%, #f2e8d4 0 50%, #e6d9c1 0 75%, #faf4e8 0);
  box-shadow: 0 0 0 1px rgba(120,96,80,.22), 4px 5px 0 rgba(82,60,72,.15); }
body.style-origami #levelup .card-name { margin-top: 10px; font: 900 22px/1.15 'Zen Maru Gothic', sans-serif; letter-spacing: .02em; color: #3b4a87; }
body.style-origami #levelup .card-desc { font: 700 15px/1.3 'M PLUS Rounded 1c', sans-serif; opacity: 1; color: #7a6c74; }
body.style-origami #levelup .card-key { top: 0; left: 0; width: 38px; height: 38px; padding: 5px 0 0 7px; opacity: 1;
  background: linear-gradient(135deg, #3b4a87 0 50%, transparent 50%); font: 900 15px/1 'Zen Maru Gothic', sans-serif; color: #fffbf3; display: block; text-align: left; }
body.style-origami #levelup .lu-hint { font: 700 19px/1.2 'Kalam', cursive; opacity: 1; color: #fffbf3; text-shadow: 0 1px 2px rgba(30,30,60,.5); }
body.style-origami #gameover { gap: 18px; background: repeating-linear-gradient(45deg, rgba(120,96,80,.08) 0 1px, transparent 1px 64px), rgba(236,228,214,.7);
  -webkit-backdrop-filter: grayscale(.7) blur(2px); backdrop-filter: grayscale(.7) blur(2px); }
body.style-origami #gameover .go-title { font: 900 64px/1 'Zen Maru Gothic', sans-serif; letter-spacing: .05em; color: #3b4a87; text-shadow: 3px 4px 0 rgba(82,60,72,.18); }
body.style-origami #gameover .go-stats { font: 700 18px/1.3 'M PLUS Rounded 1c', sans-serif; opacity: 1; color: #3d3852; background: #fbf5e8; padding: 10px 26px;
  box-shadow: 0 0 0 1px rgba(120,96,80,.24), 4px 5px 0 rgba(82,60,72,.15); }
body.style-origami #gameover .go-hint { font: 700 20px/1 'Kalam', cursive; opacity: 1; color: #c95b47; }
body.style-origami #pausebox { font: 900 64px/1 'Zen Maru Gothic', sans-serif; letter-spacing: .08em; color: #3b4a87; text-shadow: 3px 4px 0 rgba(255,251,243,.9); }
`;

  /* ============================================================ particles */
  function keyOfEnemy(e) {
    if (e.type === 'ghost') return 'blush';
    if (e.type === 'colossus') return 'plum';
    return FROG_KEYS[Math.floor((e.seed || 0) * 3) % 3];
  }
  function heightOf(e) { return e.type === 'colossus' ? 22 : e.type === 'ghost' ? 18 : 8; }
  function conf(game, x, y, z, key, size, sp, life, o) {
    const a = Math.random() * TAU, s = sp * (0.5 + Math.random() * 0.7);
    return game.addParticle(Object.assign({
      kind: 'conf', key, x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 40 + Math.random() * 50, grav: 120,
      drag: 2.4, life: life * (0.8 + Math.random() * 0.4), size: size * (0.75 + Math.random() * 0.5), rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 10,
    }, o || {}));
  }
  function petals(game, x, y, z, n, key, key2, sp, life, size) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + Math.random() * 0.2;
      game.addParticle({ kind: 'petal', key: i & 1 ? key2 : key, x, y, z, ang: a, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, drag: 4, life, size });
    }
  }

  /**
   * A square sheet lying on the ground (y squashed by tilt): open 1 = flat sheet with a cross of creases,
   * 0 = blintz packet (all four corners folded to the centre, cream backs up). Spawns unfold it, deaths fold it back.
   */
  function drawPacket(ctx, x, y, s, rot, key, open, tilt, back) {
    const R = back ? RAMP.cream : (RAMP[key] || RAMP.coral), RB = RAMP.cream;
    const ty = tilt === undefined ? 0.55 : tilt, o = clamp(open, 0, 1), up = o >= 0.5, h = s * 0.7071;
    const px = (r, a) => x + Math.cos(a) * r, py = (r, a) => y + Math.sin(a) * r * ty;
    const lit = (a) => Math.cos(a) + Math.sin(a) < -0.2;
    const edge = (LINE[back ? 'cream' : key] || LINE.cream).edge;
    ctx.lineJoin = 'round';
    // soft contact shadow under the sheet
    ctx.fillStyle = 'rgba(78,56,72,0.16)';
    ctx.beginPath();
    for (let k = 0; k < 4; k++) { const a = rot + k * PI / 2 + PI / 4; ctx.lineTo(px(h, a) + 1.1, py(h, a) + 0.9); }
    ctx.closePath(); ctx.fill();
    // base: the square of edge midpoints, four facets around the centre
    for (let k = 0; k < 4; k++) {
      const a0 = rot + (k - 1) * PI / 2 + PI / 4, a1 = rot + k * PI / 2 + PI / 4;
      ctx.fillStyle = R[lit(rot + k * PI / 2) ? 0 : 1];
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(px(h, a0), py(h, a0)); ctx.lineTo(px(h, a1), py(h, a1)); ctx.closePath(); ctx.fill();
    }
    // corner flaps hinge on the base edges
    ctx.lineWidth = 0.42;
    for (let k = 0; k < 4; k++) {
      const a0 = rot + (k - 1) * PI / 2 + PI / 4, a1 = rot + k * PI / 2 + PI / 4, ac = rot + k * PI / 2, r = s * o;
      const L = lit(ac);
      ctx.fillStyle = up ? R[L ? 0 : 2] : RB[L ? 0 : 2];
      ctx.beginPath(); ctx.moveTo(px(h, a0), py(h, a0)); ctx.lineTo(px(r, ac), py(r, ac)); ctx.lineTo(px(h, a1), py(h, a1)); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = edge; ctx.stroke();
    }
    if (o > 0.9) {
      // the remembered creases of the opened packet
      ctx.strokeStyle = back ? 'rgba(120,96,80,0.35)' : (LINE[key] || LINE.cream).lo; ctx.lineWidth = 0.3; ctx.globalAlpha *= 0.7;
      ctx.beginPath();
      for (let k = 0; k < 4; k++) { const a = rot + k * PI / 2 + PI / 4, b = a + PI / 2; ctx.moveTo(px(h, a), py(h, a)); ctx.lineTo(px(h, b), py(h, b)); }
      ctx.stroke();
      ctx.globalAlpha /= 0.7;
    }
  }

  /** Designed prop arrangements of a site: [x, y, type, variant]. */
  function arrangement(s) {
    const r = U.rng(s.h ^ 0x5bd1), out = [];
    if (s.type === 'village') {
      const n = r.next() < 0.6 ? 3 : 2, a0 = r.next() * TAU;
      for (let i = 0; i < n; i++) {
        const a = a0 + (i / n) * TAU + (r.next() - 0.5) * 0.5, d = 30 + r.next() * 14;
        const hx = s.x + Math.cos(a) * d, hy = s.y + Math.sin(a) * d * 0.8;
        out.push([hx, hy, 'house', (i + (s.v * 2 | 0)) & 1]);
        out.push([hx + 15 + r.next() * 4, hy + 4, 'tulips', 1]);
        const fa = a + 0.5, fd = d + 30;
        out.push([s.x + Math.cos(fa) * fd, s.y + Math.sin(fa) * fd * 0.8 + 8, 'fence', 0]);
      }
      out.push([s.x + (r.next() - 0.5) * 16, s.y + 14 + r.next() * 8, 'pinwheel', 0]);
      out.push([s.x + Math.cos(a0 + PI) * 74, s.y + Math.sin(a0 + PI) * 56, 'tree', r.next() < 0.5 ? 1 : 0]);
      out.push([s.x + Math.cos(a0 + 2.2) * 80, s.y + Math.sin(a0 + 2.2) * 60, 'bush', 0]);
    } else if (s.type === 'orchard') {
      const tv = s.v < 0.5 ? 0 : 1;
      for (let u = -1; u <= 1; u++) for (let v = -1; v <= 1; v++) {
        const x = s.x + (u - v) * 25 + (r.next() - 0.5) * 3, y = s.y + (u + v) * 19 + (r.next() - 0.5) * 3;
        if (u === 0 && v === 0) { out.push([x, y + 4, 'tulips', 0]); continue; }
        out.push([x, y, r.next() < 0.15 ? 'bush' : 'tree', r.next() < 0.2 ? 1 - tv : tv]);
      }
      for (let i = 0; i < 3; i++) { const a = r.next() * TAU; out.push([s.x + Math.cos(a) * s.rad * 0.62, s.y + Math.sin(a) * s.rad * 0.5, 'tulips', 0]); }
    } else if (s.type === 'grove') {
      const pts = [];
      for (let tries = 0; tries < 60 && pts.length < 11; tries++) {
        const a = r.next() * TAU, d = Math.sqrt(r.next()) * s.rad * 0.72;
        const x = s.x + Math.cos(a) * d, y = s.y + Math.sin(a) * d * 0.85;
        if (pts.some((p) => Math.hypot(p[0] - x, (p[1] - y) * 1.3) < 21)) continue;
        pts.push([x, y]);
        out.push([x, y, 'pine', d < s.rad * 0.35 ? 1 : r.next() < 0.6 ? 0 : 2]);
      }
      for (let i = 0; i < 3; i++) { const a = r.next() * TAU; out.push([s.x + Math.cos(a) * s.rad * 0.86, s.y + Math.sin(a) * s.rad * 0.74, 'bush', 1 + (i & 1)]); }
      const a = r.next() * TAU;
      out.push([s.x + Math.cos(a) * s.rad * 0.8, s.y + Math.sin(a) * s.rad * 0.66, 'stone', 1]);
    }
    return out;
  }
  const arrCache = new Map();
  function arrangementOf(s) {
    const k = s.ci * 100003 + s.cj;
    let a = arrCache.get(k);
    if (!a) { a = arrangement(s); if (arrCache.size > 400) arrCache.clear(); arrCache.set(k, a); }
    return a;
  }

  /* =============================================================== style */
  Styles.register({
    id: 'origami',
    name: 'Origami Fold',
    family: 'Paper · Origami',
    description: 'A world folded from washi paper: flat facets with crisp mountain and valley creases, one soft light from the upper left, two-sided kami sheets and a crease-pattern ground.',
    groundColor: '#f4eee1',
    groundResMax: 2.5,
    chunkSize: 256,
    fonts: ['Zen+Maru+Gothic:wght@500;700;900', 'M+PLUS+Rounded+1c:wght@500;700;800', 'Kalam:wght@400;700'],
    css: CSS,

    init() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssH = window.__forceH || window.innerHeight || 900;
      const S = (cssH * dpr) / 360;
      K = clamp(Math.round(S * 1.6), 3, 8);
      if (!FIBRE) FIBRE = makeFibre();
      decalSprites();
      // main character: idle breath, blinks (sharing the idle shadows), ear flick, walk, dash, landing, hurt, throw, down
      const foxOpt = { ...UPRIGHT, contact: [6.5, 2.2] };
      SPR.fox = [];
      FOX_FR.forEach((fr, i) => {
        const o = i >= FX_I.BLINK && i < FX_I.FLICK ? { shadow: SPR.fox[i - FX_I.BLINK] } : i === FX_I.HURT ? { ...foxOpt, crumple: 0.9, cseed: 31 } : foxOpt;
        SPR.fox.push(actorSet([-16, -38, 14, 2], (m) => fox(m, fr), o));
      });
      // creatures + their crumpled hit frames
      const frogOpt = { shx: 0.5, shy: -0.4, a: 0.3, contact: [7.5, 2.4] };
      SPR.frog = FROG_KEYS.map((key) => {
        const set = [];
        FROG_FR.forEach((fr, i) => set.push(actorSet([-15, -18, 12, 2], (m) => frog(m, fr, key), i === 2 ? { shadow: set[0] } : frogOpt)));
        return set;
      });
      SPR.frogHit = FROG_KEYS.map((key, i) => actorSet([-15, -18, 12, 2], (m) => frog(m, FROG_FR[3], key), { ...frogOpt, crumple: 1.1, cseed: 11 + i }));
      const craneOpt = { shx: 0.05, shy: 0.42, a: 0.24, contact: null, blur: 1.4 };
      SPR.crane = CRANE_U.map((u, i) => actorSet([-14, -28, 15, 1], (m) => crane(m, u, 'blush', CRANE_NB[i]), craneOpt));
      SPR.craneHit = actorSet([-14, -28, 15, 1], (m) => crane(m, 0.5, 'blush', 0.4), { ...craneOpt, crumple: 0.9, cseed: 5 });
      const beastOpt = { shx: 0.55, shy: -0.34, a: 0.32, contact: [17, 4.6], blur: 1.4 };
      SPR.beast = BEAST_FR.map((fr) => actorSet([-27, -42, 25, 2], (m) => beast(m, fr), beastOpt));
      SPR.beastHit = actorSet([-27, -42, 25, 2], (m) => beast(m, BEAST_FR[1]), { ...beastOpt, crumple: 1.6, cseed: 3 });
      SPR.ball = {};
      for (const key of ['teal', 'sage', 'mustard', 'blush', 'plum']) {
        SPR.ball[key] = { r: bake([-7, -13, 7, 1], (m) => ball(m, key), false, { crumple: 0.8, cseed: 9 }), l: bake([-7, -13, 7, 1], (m) => ball(m, key), true, { crumple: 0.8, cseed: 9 }) };
      }
      // props
      SPR.props = {};
      for (const t in PROP_DEF) {
        const d = PROP_DEF[t];
        SPR.props[t] = [];
        for (let v = 0; v < d.n; v++) {
          const n = bake(d.box, (m) => d.fn(m, v), false);
          const l = d.mir ? bake(d.box, (m) => d.fn(m, v), true) : n;
          const sh = d.water ? null : { shx: 0.62, shy: -0.34, a: 0.28, contact: d.contact, blur: 1.6 };
          SPR.props[t].push({ n, l, sn: sh && castShadow(n, sh.shx, sh.shy, sh.a, sh.contact, sh.blur), sl: sh && (d.mir ? castShadow(l, sh.shx, sh.shy, sh.a, sh.contact, sh.blur) : null) });
        }
      }
      SPR.pinStick = bake([-3, -27, 3, 2], (m) => { m.strip([0, 0.5], [0, -26], 1.6, 1.2, 0.5, 'wood'); }, false);
      SPR.pinHead = [];
      for (let f = 0; f < 12; f++) SPR.pinHead.push(bake([-11, -11, 11, 11], (m) => pinwheelHead(m, (f / 12) * PI), false, { fibre: 0.4 }));
      SPR.pinShadow = castShadow(bake([-11, -38, 11, 2], (m) => { m.strip([0, 0.5], [0, -26], 1.6, 1.2, 0.5, 'wood'); m.at(0, -27, 1, 0); pinwheelHead(m, 0.3); m.at(); }, false), 0.62, -0.34, 0.26, [3, 1.2], 1.4);
      // effects
      SPR.plane = [];
      for (let i = 0; i < 16; i++) {
        const s = bake([-8, -8, 8, 8], (m) => plane(m, (i / 16) * TAU), false, { fibre: 0.4, ol: 0.5 });
        s.sh = castShadow(s, 0, 1, 0.3, null, 0.9);
        SPR.plane.push(s);
      }
      SPR.shuri = [];
      for (let i = 0; i < 8; i++) SPR.shuri.push(bake([-10, -10, 10, 10], (m) => shuriken(m, (i / 8) * (PI / 2)), false, { fibre: 0.4 }));
      SPR.star = [];
      for (let i = 0; i < 6; i++) SPR.star.push(bake([-5, -5, 5, 5], (m) => luckyStar(m, (i / 6) * (TAU / 5), 'mustard', 4.4), false, { fibre: 0.3, ol: 0.45 }));
      SPR.crystal = [];
      for (let i = 0; i < 8; i++) SPR.crystal.push(bake([-6, -8, 6, 7.5], (m) => crystal(m, (i / 8) * PI, 'teal'), false, { fibre: 0.3, ol: 0.5 }));
      SPR.bfly = ['blush', 'mustard', 'teal', 'coral'].map((key) => bake([-8, -7, 2, 5], (m) => butterfly(m, key), false, { fibre: 0.3, ol: 0.4 }));
      SPR.blob = (() => {
        const { c, ctx } = U.canvas(8 * K, 4 * K);
        const g = ctx.createRadialGradient(4 * K, 2 * K, 0, 4 * K, 2 * K, 4 * K);
        g.addColorStop(0, 'rgba(78,56,72,0.3)'); g.addColorStop(1, 'rgba(78,56,72,0)');
        ctx.setTransform(1, 0, 0, 0.5, 0, K); ctx.fillStyle = g; ctx.fillRect(0, -2 * K, 8 * K, 8 * K);
        return { c, ox: 4 * K, oy: 2 * K };
      })();
      if (document.fonts && document.fonts.load) { try { document.fonts.load('900 20px "Zen Maru Gothic"', '0123456789'); } catch (e) { /* ignore */ } }
    },

    /* ------------------------------------------------------------ ground */
    renderGroundChunk(ctx, info) {
      if (!FIBRE) FIBRE = makeFibre();
      return renderGround(ctx, info);
    },

    propsForChunk(info) {
      const out = [];
      const paths = pathsNear(info.wx - 40, info.wy - 40, info.wx + info.size + 40, info.wy + info.size + 40);
      const x1 = info.wx + info.size, y1 = info.wy + info.size;
      const push = (x, y, t, v) => {
        const d = PROP_DEF[t], tall = !!(d && d.tall) || t === 'pinwheel';
        if (tall && G.nearSpawn(x, y, 100)) return;
        if (G.nearSpawn(x, y, 40)) return;
        const r = U.rng(U.hashInt(Math.round(x * 4), Math.round(y * 4), 991));
        out.push({ x, y, t, v, f: !!(d && d.mir && r.next() < 0.5), ph: r.next() * TAU, pad: tall ? 80 : 30 });
      };
      const dry = (x, y, w) => regionAtPoint(x - w, y) !== WATER && regionAtPoint(x + w, y) !== WATER && regionAtPoint(x, y + 4) !== WATER;
      // 1) designed site arrangements – every prop belongs to the chunk it stands in
      const ci0 = Math.floor(info.wx / SITE) - 1, cj0 = Math.floor(info.wy / SITE) - 1;
      const sites = [];
      for (let cj = cj0; cj <= cj0 + 2; cj++) for (let ci = ci0; ci <= ci0 + 2; ci++) {
        const s = siteOf(ci, cj);
        if (s.type === 'none') continue;
        sites.push(s);
        if (s.x + s.rad < info.wx || s.x - s.rad > x1 || s.y + s.rad < info.wy || s.y - s.rad > y1) continue;
        for (const it of arrangementOf(s)) {
          const [x, y, t, v] = it;
          if (x < info.wx || x >= x1 || y < info.wy || y >= y1) continue;
          const reg = regionAtPoint(x, y);
          if (reg === WATER || reg === SHORE || !dry(x, y, 12)) continue;
          if (paths.length && pathDist(x, y, paths) < (t === 'house' ? 17 : 11)) continue;
          push(x, y, t, v);
        }
      }
      // 2) loose fill, per region, kept clear of the arrangements and the ribbons
      G.scatterOwned(info, 56, 8128, (x, y, rng) => {
        const r = rng.next(), vr = rng.next();
        for (const s of sites) {
          if ((s.type === 'village' || s.type === 'orchard') && Math.abs(x - s.x) + Math.abs(y - s.y) < s.rad * 0.7) return;
          if (s.type === 'grove' && Math.hypot(x - s.x, y - s.y) < s.rad * 0.78) return;
        }
        const reg = regionAtPoint(x, y);
        const pd = paths.length ? pathDist(x, y, paths) : 1e9;
        if (pd < 13) return;
        let t = null, v = 0;
        if (reg === WATER) {
          const cl = U.noise(x / 120, y / 120, 404);
          if (cl > 0.56 && r < 0.42) t = 'lotus';
          else if (r < 0.05) { t = 'paperBoat'; v = (vr * 3) | 0; }
        } else if (reg === SHORE) {
          if (r < 0.36) { t = 'reeds'; v = vr < 0.5 ? 0 : 1; } else if (r < 0.43) { t = 'stone'; v = 2; }
        } else if (reg === GROVE) {
          if (r < 0.3) { t = 'pine'; v = vr < 0.4 ? 0 : vr < 0.75 ? 1 : 2; } else if (r < 0.4) { t = 'bush'; v = 1; }
        } else if (reg === MEADOW) {
          if (r < 0.05) t = 'pine';
          else if (r < 0.09) { t = 'tree'; v = vr < 0.6 ? 2 : 3; }
          else if (r < 0.15) { t = 'bush'; v = (vr * 3) | 0; }
          else if (r < 0.18) { t = 'tulips'; v = vr < 0.5 ? 0 : 1; }
          else if (r < 0.2) { t = 'stone'; v = (vr * 3) | 0; }
        } else if (reg === FIELD) {
          if (r < 0.03) t = 'pinwheel';
        } else if (reg === BLOSSOM) {
          if (r < 0.07) t = 'tulips';
        } else {
          // plain paper stays calm: stones by the ribbons, the odd shrub or tree
          // ...except for a few copses at noise peaks: a tree with a bush and a stone, then calm paper again
          const cop = U.noise(x / 170, y / 170, 515);
          if (cop > 0.7 && r < 0.36) { if (r < 0.15) { t = 'tree'; v = (vr * 4) | 0; } else if (r < 0.29) { t = 'bush'; v = (vr * 3) | 0; } else { t = 'stone'; v = (vr * 3) | 0; } }
          else if (pd < 24 && r < 0.3) { t = 'stone'; v = (vr * 3) | 0; }
          else if (r < 0.022) { t = 'stone'; v = (vr * 3) | 0; }
          else if (r < 0.036) t = 'bush';
          else if (r < 0.044) { t = 'tree'; v = (vr * 4) | 0; }
          else if (r < 0.048) t = 'pinwheel';
        }
        if (!t) return;
        if (t !== 'paperBoat' && t !== 'lotus') { if (!dry(x, y, 12)) return; }
        else if (regionAtPoint(x - 14, y) !== WATER || regionAtPoint(x + 14, y) !== WATER || regionAtPoint(x, y - 8) !== WATER || regionAtPoint(x, y + 8) !== WATER) return;
        push(x, y, t, v);
      });
      return out;
    },

    drawProp(ctx, p, view) {
      const V = tf(view);
      if (p.t === 'pinwheel') {
        blit(ctx, SPR.pinStick, p.x, p.y, 1, 1);
        const f = Math.floor(view.rt * 9 + p.ph * 4) % 12;
        blit(ctx, SPR.pinHead[f], p.x, p.y - 27, 1, 1);
        return;
      }
      const set = SPR.props[p.t] && SPR.props[p.t][p.v];
      if (!set) return;
      const s = p.f ? set.l : set.n;
      const d = PROP_DEF[p.t];
      if (p.t === 'paperBoat' || p.t === 'lotus') {
        const bob = Math.sin(view.rt * 1.8 + p.ph) * 0.8, rk = Math.sin(view.rt * 1.3 + p.ph) * 0.05;
        // ripples
        ctx.strokeStyle = 'rgba(255,253,246,0.55)'; ctx.lineWidth = 0.6;
        const q = (view.rt * 0.5 + p.ph) % 1;
        ctx.globalAlpha = 1 - q;
        ctx.beginPath(); ctx.ellipse(p.x, p.y + 2, 12 + q * 10, 3.2 + q * 2.6, 0, 0, TAU); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(48,70,128,0.2)';
        ctx.beginPath(); ctx.ellipse(p.x + 1.5, p.y + 2.2, 11, 2.6, 0, 0, TAU); ctx.fill();
        blitRot(ctx, V, s, p.x, p.y + bob, 1, 1, rk);
        return;
      }
      // tall props turn translucent when the main character walks behind them
      let a = 1;
      const pl = view.game && view.game.player;
      if (d.tall && pl && pl.y < p.y - 2 && pl.y > p.y - d.tall - 4 && Math.abs(pl.x - p.x) < 16) a = 0.5;
      if (a < 1) ctx.globalAlpha = a;
      // paper on a stand: a slow wobble in the breeze, gusts roll across the world from the left
      const sw = d.sway ? (Math.sin(view.rt * 0.9 + p.ph) * 0.55 + Math.sin(view.rt * 0.43 - p.x * 0.006 + p.y * 0.002) * 0.45) * d.sway : 0;
      blitRot(ctx, V, s, p.x, p.y, 1, 1, sw);
      if (a < 1) ctx.globalAlpha = 1;
    },

    drawShadow(ctx, o, view) {
      if (o.kind === 'prop') {
        if (o.t === 'pinwheel') { blit(ctx, SPR.pinShadow, o.x, o.y, 1, 1); return; }
        const set = SPR.props[o.t] && SPR.props[o.t][o.v];
        if (!set || !set.sn) return;
        blit(ctx, (o.f && set.sl) || set.sn, o.x, o.y, 1, 1);
        return;
      }
      if (o.kind === 'enemy') {
        const r = o.type === 'colossus' ? 17 : o.type === 'ghost' ? 7 : 9;
        if (o.dying) {
          const q = deathStep(o);
          if (q >= 0.8 || (o.type === 'ghost' && q >= 0.4)) return;
          ctx.globalAlpha = 0.85;
          blit(ctx, SPR.blob, o.x + (o.type === 'ghost' ? 4 : 1), o.y + 0.5, (r / 9) * (q < 0.4 ? 1.8 : 1.15), (r / 9) * (q < 0.4 ? 1.5 : 1.0));
          ctx.globalAlpha = 1;
          return;
        }
        const P = enemyPose(o, view.rt);
        if (!P) return;
        const k = P.k;
        if (k <= 0.02) return;
        ctx.globalAlpha = k;
        if (o.type === 'ghost') blit(ctx, P.shs, o.x + P.lift * 0.45 + 2, o.y + 2.5, 0.9, 0.9);
        else { const sc = 1 - P.lift * 0.04; blit(ctx, P.shs, o.x, o.y, sc * P.sx, sc); }
        ctx.globalAlpha = 1;
        return;
      }
      const P = playerPose(o, view);
      blit(ctx, P.shs, o.x, o.y, (1 - P.lift * 0.03) * P.sx, 1 - P.lift * 0.03);
    },

    drawGem(ctx, g, view) {
      const big = g.big;
      // bob held on 12 fps steps, every collectible on its own phase
      const st = Math.floor(view.rt * 12 + g.seed * 40) / 12;
      let h = 3 + Math.sin(st * 4 + g.seed * 20) * 1.2, sc = 1;
      if (g.pop > 0) { const q = 1 - g.pop; h += Math.sin(q * PI) * 10; sc = 0.4 + 0.6 * U.ease.outBack(Math.min(1, q * 1.4)); }
      const b = SPR.blob;
      ctx.globalAlpha = 0.9;
      blit(ctx, b, g.x + 1, g.y + 0.5, big ? 1.1 : 0.7, big ? 1.1 : 0.7);
      ctx.globalAlpha = 1;
      if (big) {
        const f = Math.floor(view.rt * 8 + g.seed * 8) & 7;
        blit(ctx, SPR.crystal[f], g.x, g.y - h - 4, sc, sc);
      } else {
        const f = Math.floor(view.rt * 5 + g.seed * 6) % 6;
        blit(ctx, SPR.star[f], g.x, g.y - h - 2.5, sc, sc);
      }
    },

    drawEnemy(ctx, e, view) {
      const V = tf(view);
      const key = keyOfEnemy(e), ghost = e.type === 'ghost', r = e.type === 'colossus' ? 17 : ghost ? 7 : 9;
      if (e.dying) { drawDeath(ctx, V, e, key, r); return; }
      const P = enemyPose(e, view.rt);
      if (!P) return;
      // spawn: a folded packet drops in and unfolds; the creature rises out of the open sheet
      if (e.spawnT < 1) {
        const q = spawnStep(e), rot = ((e.seed || 0) - 0.5) * 0.6;
        if (!ghost) {
          let open = 1, s = r * 1.05, z = 0, a = 1;
          if (q < 0.1) { open = 0; s = r * 0.62; z = 4; }
          else if (q < 0.25) { open = 0.32; s = r * 0.78; }
          else if (q < 0.4) { open = 1; s = r * 1.08; }
          else { s = r * (1.08 - (q - 0.4) * 0.8); a = 1 - (q - 0.4) / 0.6; }
          if (a > 0.02) { ctx.globalAlpha = a; drawPacket(ctx, e.x, e.y + 0.5 - z, s, rot, key, open); ctx.globalAlpha = 1; }
        } else if (q < 0.5) {
          // a loose sheet see-saws down out of the sky
          const u = q / 0.5, til = Math.cos(u * 7);
          drawPacket(ctx, e.x + Math.sin(u * 6) * 5, e.y - 30 + u * 18, 6.5, rot + u * 1.4, key, 1, Math.max(0.12, Math.abs(til)) * 0.7, til < 0);
        }
      }
      if (P.hide) return;
      ctx.globalAlpha = P.alpha;
      blitRot(ctx, V, P.set, e.x, e.y - P.lift, P.sx, P.sy, P.rot, P.img);
      const fl = e.flash || 0;
      if (fl > 0.72) {
        // the core of the hit: the crumpled sheet flashes its cream back for a frame
        ctx.globalAlpha = 0.7 * P.alpha;
        blitRot(ctx, V, P.set, e.x, e.y - P.lift, P.sx, P.sy, P.rot, flashOf(P.set));
      }
      ctx.globalAlpha = 1;
    },

    drawPlayer(ctx, p, view) {
      const V = tf(view);
      const P = playerPose(p, view);
      const sx = P.sx, sy = P.sy;
      if (p.dashT > 0) {
        // paper cut-out afterimages, held for the whole dash
        const k = clamp(p.dashT / 0.2, 0, 1);
        for (let i = 2; i >= 1; i--) {
          ctx.globalAlpha = (0.42 / i) * (0.5 + 0.5 * k);
          blitRot(ctx, V, P.set, p.x - p.dashX * i * 8, p.y - p.dashY * i * 8 - P.lift, sx, sy, P.rot, flashOf(P.set));
        }
        ctx.globalAlpha = 1;
      }
      let a = 1;
      if (p.iframes > 0 && p.hurtT < 0.5 && p.dashT <= 0 && (Math.floor(view.rt * 12) & 1)) a = 0.55;
      ctx.globalAlpha = a;
      blitRot(ctx, V, P.set, p.x, p.y - P.lift, sx, sy, P.rot, P.img);
      if (p.hurtT > 0.82) {
        ctx.globalAlpha = 0.75;
        blitRot(ctx, V, P.set, p.x, p.y - P.lift, sx, sy, P.rot, flashOf(P.set));
      }
      ctx.globalAlpha = 1;
    },

    drawOrbital(ctx, o, view) {
      const V = tf(view);
      const bob = Math.sin(view.rt * 4 + o.idx * 1.7) * 1.2;
      ctx.globalAlpha = 0.8;
      blit(ctx, SPR.blob, o.x + 3, o.y + 6, 1.3, 1.3);
      ctx.globalAlpha = 1;
      const f = Math.floor(view.rt * 30 + o.idx * 3) & 7;
      blitRot(ctx, V, SPR.shuri[f], o.x, o.y - 4 + bob, 1, 0.8, 0);
    },

    drawProjectile(ctx, pr, view) {
      // the plane banks a little in flight (neighbouring rotation frames)
      const a = (((pr.angle + Math.sin(pr.age * 22 + pr.seed * 9) * 0.2) % TAU) + TAU) % TAU;
      const i = Math.round((a / TAU) * 16) & 15;
      const s = SPR.plane[i];
      ctx.globalAlpha = 0.9;
      blit(ctx, s.sh, pr.x + 2.5, pr.y + 7, 0.9, 0.55);
      // flight line: two short pencil dashes behind
      const cs = Math.cos(pr.angle), sn = Math.sin(pr.angle);
      ctx.globalAlpha = Math.min(1, pr.age * 10) * 0.55;
      ctx.strokeStyle = '#7a6c74'; ctx.lineWidth = 0.45; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pr.x - cs * 7, pr.y - sn * 7); ctx.lineTo(pr.x - cs * 12, pr.y - sn * 12);
      ctx.moveTo(pr.x - cs * 14.5, pr.y - sn * 14.5); ctx.lineTo(pr.x - cs * 17, pr.y - sn * 17);
      ctx.stroke();
      ctx.globalAlpha = 1;
      blit(ctx, s, pr.x, pr.y, 1, 1);
    },

    drawParticle(ctx, pt, view) {
      const V = tf(view), S = V.S;
      const age = pt.max - pt.life;
      if (pt.delay) { if (age < pt.delay) return; }
      const t = pt.delay ? (age - pt.delay) / (pt.max - pt.delay) : 1 - pt.life / pt.max;
      const z = pt.z || 0;
      const x = pt.x, y = pt.y - z;
      switch (pt.kind) {
        case 'conf': {
          const R = RAMP[pt.key] || RAMP.coral;
          const fl = Math.cos(view.rt * 9 + pt.seed * 30);
          const s = pt.size * (t > 0.8 ? (1 - t) / 0.2 : 1);
          if (s <= 0.02) return;
          const col = fl > 0 ? R[fl > 0.6 ? 0 : 1] : fl < -0.6 ? RAMP.cream[0] : RAMP.cream[2];
          const sw = Math.sin(view.rt * 5 + pt.seed * 17) * 1.2 * t;
          const co = Math.cos(pt.rot) * S * s, si = Math.sin(pt.rot) * S * s, f = Math.abs(fl) < 0.15 ? 0.15 : fl;
          ctx.setTransform(co, si, -si * f, co * f, V.ox + (x + sw) * S, V.oy + y * S);
          ctx.fillStyle = col;
          ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(0.95, 0.7); ctx.lineTo(-0.95, 0.7); ctx.closePath(); ctx.fill();
          ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
          return;
        }
        case 'shard': {
          const R = RAMP[pt.key] || RAMP.cream;
          const s = pt.size * (1 - t * 0.6);
          const co = Math.cos(pt.rot) * S * s, si = Math.sin(pt.rot) * S * s;
          ctx.setTransform(co, si, -si, co, V.ox + x * S, V.oy + y * S);
          ctx.fillStyle = R[0]; ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(0.8, 0.8); ctx.lineTo(0, 0.4); ctx.closePath(); ctx.fill();
          ctx.fillStyle = R[2]; ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(0, 0.4); ctx.lineTo(-0.8, 0.8); ctx.closePath(); ctx.fill();
          ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
          return;
        }
        case 'crease': {
          // a fold snapping open from the hit point: a lit mountain line beside a dark valley line
          const q = U.ease.outQuad(clamp(t / 0.55, 0, 1)), len = pt.size * (0.3 + 0.7 * q), r0 = pt.size * 0.28 * q;
          const ca = Math.cos(pt.ang), sa = Math.sin(pt.ang) * 0.72, nx = -sa * 0.8, ny = ca * 0.8;
          ctx.globalAlpha = 1 - t * t;
          ctx.lineCap = 'round';
          ctx.strokeStyle = '#fffbf3'; ctx.lineWidth = 1.0 - t * 0.5;
          ctx.beginPath(); ctx.moveTo(x + ca * r0, y + sa * r0); ctx.lineTo(x + ca * len, y + sa * len); ctx.stroke();
          ctx.strokeStyle = (LINE[pt.key] || LINE.ink).lo; ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(x + ca * r0 + nx, y + sa * r0 + ny); ctx.lineTo(x + ca * len * 0.82 + nx, y + sa * len * 0.82 + ny); ctx.stroke();
          ctx.globalAlpha = 1;
          return;
        }
        case 'petal': {
          // a two-tone kite that shoots out and folds shut again
          const R = RAMP[pt.key] || RAMP.coral;
          const open = Math.sin(Math.min(1, t * 1.15) * PI);
          const len = pt.size * (0.5 + 0.8 * open), wid = pt.size * 0.42 * open;
          if (len < 0.05) return;
          const a = pt.ang, ca = Math.cos(a), sa = Math.sin(a) * 0.6;
          const l = Math.hypot(ca, sa), ux = ca / l, uy = sa / l, nx = -uy, ny = ux;
          const bx = x - ux * len * 0.2, by = y - uy * len * 0.2;
          const tx = x + ux * len, ty = y + uy * len, mx = x + ux * len * 0.35, my = y + uy * len * 0.35;
          ctx.globalAlpha = t > 0.75 ? (1 - t) / 0.25 : 1;
          ctx.fillStyle = R[0]; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(mx + nx * wid, my + ny * wid); ctx.lineTo(tx, ty); ctx.closePath(); ctx.fill();
          ctx.fillStyle = R[2]; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.lineTo(mx - nx * wid, my - ny * wid); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = LINE[pt.key] ? LINE[pt.key].hi : '#fff'; ctx.lineWidth = 0.3;
          ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
          ctx.globalAlpha = 1;
          return;
        }
        case 'mark': {
          // residue: the flat sheet left on the ground folds itself back up (held steps) and is gone
          let open = 1, s = pt.size, a = 1;
          if (t < 0.3) open = 1;
          else if (t < 0.5) open = 0.32;
          else if (t < 0.75) { open = 0; s *= 0.8; }
          else { open = 0; s *= 0.55; a = (1 - t) / 0.25; }
          ctx.globalAlpha = a;
          drawPacket(ctx, x, y, s, pt.rot0 || 0, pt.key, open);
          ctx.globalAlpha = 1;
          return;
        }
        case 'pop': {
          // a collected star or crystal swells, lifts and is gone
          const s = pt.big ? SPR.crystal[2] : SPR.star[1];
          const sc = 1 + U.ease.outQuad(t) * 0.9;
          ctx.globalAlpha = (1 - t) * 0.9;
          blit(ctx, s, x, y - t * 9, sc, sc);
          ctx.globalAlpha = 1;
          return;
        }
        case 'sheet': {
          // the unfolded square of a sheet, tumbling away
          const R = RAMP[pt.key] || RAMP.coral;
          const s = pt.size * (0.6 + 0.4 * Math.min(1, t * 4));
          const fl = Math.cos(view.rt * 7 + pt.seed * 20);
          const co = Math.cos(pt.rot) * S * s, si = Math.sin(pt.rot) * S * s, f = Math.abs(fl) < 0.12 ? 0.12 : fl;
          ctx.globalAlpha = t > 0.6 ? (1 - t) / 0.4 : 1;
          ctx.setTransform(co, si, -si * f, co * f, V.ox + x * S, V.oy + y * S);
          const back = fl < 0;
          const tones = back ? [RAMP.cream[0], RAMP.cream[1], RAMP.cream[2], RAMP.cream[1]] : [R[0], R[1], R[2], R[1]];
          const P4 = [[0, -1], [1, 0], [0, 1], [-1, 0]];
          for (let i = 0; i < 4; i++) {
            const a = P4[i], b = P4[(i + 1) % 4];
            ctx.fillStyle = tones[i]; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.closePath(); ctx.fill();
          }
          ctx.strokeStyle = back ? 'rgba(120,96,80,0.5)' : LINE[pt.key].lo; ctx.lineWidth = 0.06;
          ctx.beginPath(); ctx.moveTo(-1, 0); ctx.lineTo(1, 0); ctx.moveTo(0, -1); ctx.lineTo(0, 1); ctx.stroke();
          ctx.strokeStyle = back ? 'rgba(120,96,80,0.6)' : LINE[pt.key].edge; ctx.lineWidth = 0.07;
          ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(1, 0); ctx.lineTo(0, 1); ctx.lineTo(-1, 0); ctx.closePath(); ctx.stroke();
          ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
          ctx.globalAlpha = 1;
          return;
        }
        case 'flash': {
          // a crisp 4-point folded sparkle
          const s = pt.size * (t < 0.3 ? t / 0.3 : 1 - (t - 0.3) / 0.7 * 0.8);
          const col = pt.color || '#fffbf3';
          ctx.globalAlpha = 1 - t * 0.6;
          ctx.fillStyle = col;
          ctx.beginPath();
          for (let k = 0; k < 4; k++) {
            const a = (k / 4) * TAU + 0.3, b = a + PI / 4;
            ctx.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s);
            ctx.lineTo(x + Math.cos(b) * s * 0.24, y + Math.sin(b) * s * 0.24);
          }
          ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(78,56,72,0.45)'; ctx.lineWidth = 0.35; ctx.stroke();
          ctx.globalAlpha = 1;
          return;
        }
        case 'ring': {
          // a crease circle in diagram notation that opens up
          const r = pt.size * (6 + 34 * U.ease.outQuad(t));
          ctx.globalAlpha = 1 - t;
          ctx.strokeStyle = pt.color || '#c95b47'; ctx.lineWidth = 1.1;
          ctx.setLineDash(pt.dash || [4, 2.5, 1, 2.5]);
          ctx.beginPath(); ctx.ellipse(pt.x, pt.y, r, r * 0.5, 0, 0, TAU); ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
          return;
        }
        case 'strip': {
          // dash: thin folded paper strips left behind
          const R = RAMP[pt.key] || RAMP.cream;
          const len = pt.size * (1 - t * 0.5), a = Math.atan2(pt.dy, pt.dx);
          const co = Math.cos(a), si = Math.sin(a);
          ctx.globalAlpha = (1 - t) * 0.9;
          ctx.fillStyle = R[0];
          ctx.beginPath(); ctx.moveTo(x, y - 0.7); ctx.lineTo(x - co * len, y - si * len - 0.7); ctx.lineTo(x - co * len, y - si * len); ctx.lineTo(x, y); ctx.fill();
          ctx.fillStyle = R[2];
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - co * len, y - si * len); ctx.lineTo(x - co * len, y - si * len + 0.7); ctx.lineTo(x, y + 0.7); ctx.fill();
          ctx.globalAlpha = 1;
          return;
        }
        default: {
          const a = U.clamp(pt.life / pt.max, 0, 1);
          ctx.globalAlpha = a; ctx.fillStyle = pt.color || '#fffbf3';
          const s = (pt.size || 2) * 0.6;
          ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y + s * 0.7); ctx.lineTo(x - s, y + s * 0.7); ctx.closePath(); ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    },

    drawNumber(ctx, n, view) {
      const V = tf(view);
      const spr = numSprite(n.value, n.crit, view.rt);
      const t = 1 - n.life / n.max;
      // unfolds vertically from a crease, then folds away
      let sy = t < 0.14 ? U.ease.outBack(t / 0.14) : 1;
      if (t > 0.78) sy *= 1 - (t - 0.78) / 0.22;
      const sx = t < 0.14 ? 0.8 + 0.2 * (t / 0.14) : 1;
      ctx.globalAlpha = t > 0.85 ? Math.max(0, 1 - (t - 0.85) / 0.15) : 1;
      blitRot(ctx, V, spr, n.x, n.y, sx, Math.max(0.05, sy), (n.seed - 0.5) * 0.2);
      ctx.globalAlpha = 1;
    },

    drawIcon(ctx, id, size) {
      const fn = ICONS[id] || ICONS.dmg;
      ctx.save();
      ctx.scale(size / 48, size / 48);
      const m = new Fold();
      fn(m);
      renderFold(ctx, m, { ol: 1.25, cw: 0.7, seam: 0.5 });
      ctx.restore();
    },

    drawWorldOverlay(ctx, view) {
      // a few origami butterflies drifting over the paper
      const V = tf(view), cell = 230, rt = view.rt;
      const x0 = Math.floor((view.x0 - 60) / cell), x1 = Math.floor((view.x1 + 60) / cell);
      const y0 = Math.floor((view.y0 - 60) / cell), y1 = Math.floor((view.y1 + 60) / cell);
      for (let cy = y0; cy <= y1; cy++) {
        for (let cx = x0; cx <= x1; cx++) {
          const h = U.hash2(cx, cy, 4417);
          if (h > 0.5) continue;
          const ph = h * 40, ph2 = U.hash2(cx, cy, 4418) * 40;
          const hx = (cx + 0.5) * cell + Math.sin(ph2) * 60, hy = (cy + 0.5) * cell + Math.cos(ph2) * 60;
          const x = hx + Math.sin(rt * 0.33 + ph) * 50 + Math.sin(rt * 0.9 + ph2) * 12;
          const y = hy + Math.cos(rt * 0.27 + ph) * 32 + Math.sin(rt * 1.2 + ph) * 8;
          if (x < view.x0 - 10 || x > view.x1 + 10 || y < view.y0 - 10 || y > view.y1 + 40) continue;
          const z = 22 + Math.sin(rt * 2 + ph) * 4;
          ctx.globalAlpha = 0.6;
          blit(ctx, SPR.blob, x + z * 0.4, y, 0.8, 0.8);
          ctx.globalAlpha = 1;
          // wing beats on 12 fps steps: open – half – closed – half, with a held glide now and then
          const st = Math.floor(rt * 12 + ph * 7), glide = (st % 23) < 5;
          const flap = glide ? 1 : [1, 0.6, 0.18, 0.6][st & 3];
          const s = SPR.bfly[(h * 100 | 0) % SPR.bfly.length];
          // two mirrored wings around the body
          const S = V.S, k = 1 / K, w = 0.25 + 0.75 * flap;
          ctx.setTransform(S * w, 0, 0, S, V.ox + x * S, V.oy + (y - z) * S);
          ctx.drawImage(s.c, -s.ox * k, -s.oy * k, s.c.width * k, s.c.height * k);
          ctx.setTransform(-S * w * 0.85, 0, 0, S * 0.95, V.ox + x * S, V.oy + (y - z) * S);
          ctx.drawImage(s.c, -s.ox * k, -s.oy * k, s.c.width * k, s.c.height * k);
          ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
        }
      }
    },

    drawScreenOverlay(ctx, view) {
      ctx.drawImage(screenLight(view.W, view.H), 0, 0);
    },

    /* --------------------------------------------------------------- hooks */
    onHit(game, e) {
      const key = keyOfEnemy(e), h = heightOf(e), big = e.type === 'colossus';
      const ang = e.kx || e.ky ? Math.atan2(e.ky, e.kx) : Math.random() * TAU;
      const x = e.x, y = e.y + 0.5;
      // core: a crisp folded sparkle
      game.addParticle({ kind: 'flash', x: x - Math.cos(ang) * 2, y, z: h, life: 0.13, size: big ? 8 : 5.5, drag: 0 });
      // main: three crease lines snap open, fanned around the hit direction
      for (let i = 0; i < 3; i++) game.addParticle({ kind: 'crease', key, x, y, z: h, ang: ang + (i - 1) * 0.8 + (Math.random() - 0.5) * 0.3, life: 0.17, size: (big ? 14 : 9.5) * (i === 1 ? 1 : 0.72), drag: 0 });
      // secondary: two-tone paper shards flung along the hit
      for (let i = 0; i < 3; i++) {
        const a = ang + (Math.random() - 0.5) * 1.8, sp = 46 + Math.random() * 40;
        game.addParticle({ kind: 'shard', key: i ? key : 'cream', x, y, z: h, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5, vz: 50 + Math.random() * 40, grav: 260, drag: 1.5, life: 0.4, size: big ? 2.2 : 1.7, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 16 });
      }
      // residue: a fleck of cream paper drifting down
      conf(game, x, y, h, 'cream', 1.1, 22, 0.65, { vz: 12, grav: 40, drag: 3 });
    },
    onKill(game, e) {
      const key = keyOfEnemy(e), h = heightOf(e), big = e.type === 'colossus', ghost = e.type === 'ghost';
      const r = big ? 17 : ghost ? 7 : 9, x = e.x, y = e.y + 0.6;
      // core flash, then the burst of kite petals, confetti, and the flat sheet left behind that folds itself away
      game.addParticle({ kind: 'flash', x, y, z: h, life: 0.16, size: big ? 12 : 8, drag: 0 });
      petals(game, x, y, h, big ? 12 : 8, key, 'cream', big ? 74 : 54, big ? 0.48 : 0.38, big ? 10 : 6.5);
      const n = big ? 14 : 7;
      for (let i = 0; i < n; i++) conf(game, x, y, h, i % 3 === 0 ? 'cream' : i % 3 === 1 ? key : 'mustard', big ? 2.4 : 1.8, big ? 80 : 55, 0.9);
      const rot = ((e.seed || 0) - 0.5) * 0.6;
      if (ghost) game.addParticle({ kind: 'mark', key, x: x + Math.sin(0.667 * 7) * 4, y: e.y + 0.5, life: 1.1, delay: 0.35, size: 6.5, rot0: rot + 0.93, drag: 0 });
      else game.addParticle({ kind: 'mark', key, x, y: e.y + 0.5, life: 1.15, delay: 0.35, size: r * 1.1, rot0: rot, drag: 0 });
      if (big) {
        game.addParticle({ kind: 'ring', x, y, life: 0.55, size: 1.3, drag: 0, color: '#5a447c' });
        game.shake = Math.max(game.shake, 4);
      }
    },
    onHurt(game, p) {
      game.addParticle({ kind: 'flash', x: p.x, y: p.y + 0.5, z: 18, life: 0.2, size: 9, drag: 0, color: '#fffbf3' });
      for (let i = 0; i < 4; i++) game.addParticle({ kind: 'crease', key: 'coral', x: p.x, y: p.y + 0.5, z: 17, ang: (i / 4) * TAU + 0.4, life: 0.2, size: 12, drag: 0 });
      for (let i = 0; i < 6; i++) conf(game, p.x, p.y + 0.5, 16, i & 1 ? 'coral' : 'cream', 1.8, 60, 0.7);
    },
    onPickup(game, g) {
      game.addParticle({ kind: 'flash', x: g.x + (Math.random() - 0.5) * 6, y: g.y + 0.5, z: 8 + Math.random() * 8, life: 0.25, size: g.big ? 6 : 3.6, drag: 0, color: g.big ? '#9ee0d4' : '#fff1bd' });
      game.addParticle({ kind: 'pop', big: !!g.big, x: g.x, y: g.y, z: g.big ? 7 : 5, life: 0.3, drag: 0 });
      if (g.big) for (let i = 0; i < 4; i++) conf(game, g.x, g.y, 8, i & 1 ? 'teal' : 'cream', 1.6, 50, 0.6);
    },
    onShoot(game, pr) {
      if (Math.random() < 0.4) {
        const a = pr.angle + PI + (Math.random() - 0.5) * 1.2;
        game.addParticle({ kind: 'shard', key: 'cream', x: pr.x, y: pr.y + 4, z: 4, vx: Math.cos(a) * 30, vy: Math.sin(a) * 20, drag: 3, life: 0.25, size: 1.1, rot: Math.random() * TAU, vr: 8 });
      }
    },
    onDash(game, p) {
      for (let i = 0; i < 4; i++) {
        game.addParticle({ kind: 'strip', key: i & 1 ? 'indigo' : 'cream', x: p.x - p.dashX * 4 + (Math.random() - 0.5) * 6, y: p.y + 0.5 - p.dashY * 4, z: 4 + i * 4 + Math.random() * 3, dx: p.dashX, dy: p.dashY, vx: -p.dashX * 10, vy: -p.dashY * 10, drag: 3, life: 0.35, size: 10 + Math.random() * 6 });
      }
      for (let i = 0; i < 3; i++) conf(game, p.x, p.y, 4, 'cream', 1.4, 40, 0.5);
    },
    onLevelUp(game, p) {
      game.addParticle({ kind: 'flash', x: p.x, y: p.y, z: 20, life: 0.22, size: 10, drag: 0, color: '#fff1bd' });
      game.addParticle({ kind: 'ring', x: p.x, y: p.y, life: 0.7, size: 1.5, drag: 0, color: '#c68c2d' });
      game.addParticle({ kind: 'ring', x: p.x, y: p.y, life: 0.85, delay: 0.12, size: 1.1, drag: 0, color: '#3b4a87', dash: [5, 3.5] });
      petals(game, p.x, p.y + 0.5, 1, 10, 'mustard', 'coral', 58, 0.75, 9);
      petals(game, p.x, p.y + 0.5, 1, 8, 'teal', 'cream', 34, 0.6, 6);
      for (let i = 0; i < 22; i++) {
        const keys = ['coral', 'mustard', 'teal', 'indigo', 'blush', 'cream'];
        conf(game, p.x + (Math.random() - 0.5) * 30, p.y + (Math.random() - 0.5) * 12, 30 + Math.random() * 16, keys[i % keys.length], 2.0, 40, 1.5, { vz: 20 + Math.random() * 40, grav: 50, drag: 2.8 });
      }
    },
    onDeath(game, p) {
      game.addParticle({ kind: 'sheet', key: 'coral', x: p.x, y: p.y, z: 16, vz: 90, grav: 120, drag: 1.4, life: 1.2, size: 10, rot: 0.4, vr: 3 });
      petals(game, p.x, p.y + 0.5, 14, 12, 'coral', 'indigo', 60, 0.7, 9);
      for (let i = 0; i < 18; i++) conf(game, p.x, p.y, 16, ['coral', 'cream', 'indigo'][i % 3], 2.2, 70, 1.2);
    },
  });

  /* ============================================================ poses */
  // Stop-motion timing: poses change on held steps (8–12 fps), every actor runs on its own phase (seed).
  const spawnStep = (e) => Math.floor(clamp(e.spawnT, 0, 0.999) * 6) / 6;
  const deathStep = (e) => Math.floor(clamp(e.deathT, 0, 0.999) * 5) / 5;
  /** Death sequence (0.35 s, 5 held steps): crumple + flash – squeeze – crumpled ball tossed – ball lands –
   *  it pops open into a flat sheet (the 'mark' particle then folds that sheet away). The crane flutters down instead. */
  function drawDeath(ctx, V, e, key, r) {
    const q = deathStep(e), ghost = e.type === 'ghost', left = e.facing < 0, dir = left ? -1 : 1;
    const hs = ghost ? SPR.craneHit : e.type === 'colossus' ? SPR.beastHit : SPR.frogHit[Math.floor((e.seed || 0) * 3) % 3];
    const hset = left ? hs.l : hs.r, lift = ghost ? 8 : 0, rot = ((e.seed || 0) - 0.5) * 0.6;
    if (q < 0.2) {
      blitRot(ctx, V, hset, e.x, e.y - lift, 1.2, 0.8, 0);
      ctx.globalAlpha = 0.6;
      blitRot(ctx, V, hset, e.x, e.y - lift, 1.2, 0.8, 0, flashOf(hset));
      ctx.globalAlpha = 1;
    } else if (q < 0.4) {
      blitRot(ctx, V, hset, e.x, e.y - lift - 1.5, ghost ? 0.55 : 0.86, 0.9, 0.15 * dir);
    } else if (!ghost) {
      if (q < 0.8) {
        const bs = (r / 9) * (q < 0.6 ? 0.8 : 0.62), b = SPR.ball[key] || SPR.ball.teal;
        blitRot(ctx, V, left ? b.l : b.r, e.x, e.y - (q < 0.6 ? 6 : 2.5) * (r / 9), bs, bs, (q < 0.6 ? 0.35 : 1.0) * dir);
      } else drawPacket(ctx, e.x, e.y + 0.5, r * 1.1, rot, key, 1);
    } else {
      const u = (q - 0.4) / 0.6, til = Math.cos(u * 6);
      drawPacket(ctx, e.x + Math.sin(u * 7) * 4, e.y - 12 * (1 - u), 6.5, rot + u * 1.4, key, 1, Math.max(0.12, Math.abs(til)) * 0.7, til < 0);
    }
  }

  const POSE = { set: null, img: null, shs: null, lift: 0, rot: 0, sx: 1, sy: 1, alpha: 1, k: 1, hide: false };
  function enemyPose(e, rt) {
    const P = POSE;
    P.lift = 0; P.rot = 0; P.sx = 1; P.sy = 1; P.alpha = 1; P.k = 1; P.hide = false;
    const left = e.facing < 0;
    const seed = e.seed || 0, anim = e.anim || 0;
    const hit = !e.dying && (e.flash || 0) > 0.45;
    let set;
    if (e.type === 'ghost') {
      // flap cycle on 12 fps steps: up (held) – fast down-stroke – low – slow recovery
      const st = Math.floor(rt * 12 + seed * 97), n = CRANE_SEQ.length;
      const f = CRANE_SEQ[((st % n) + n) % n];
      set = hit ? SPR.craneHit : SPR.crane[f];
      P.lift = 8 + CRANE_LIFT[f] + Math.sin(rt * 1.3 + seed * 9) * 1.6;
      P.rot = U.clamp((e.vx || 0) / 64, -1, 1) * 0.12;
    } else if (e.type === 'colossus') {
      const ph = anim * 0.45 + seed * 4, f = Math.floor((ph - Math.floor(ph)) * 8) & 7;
      set = hit ? SPR.beastHit : SPR.beast[f];
      P.sx = 0.96 + seed * 0.08; P.sy = P.sx;
    } else {
      // hop on 9 held steps: crouch (anticipation) – launch – airborne – land (squash) – sit (breath, blink)
      const v = Math.floor(seed * 3) % 3;
      const ph = anim * 0.38 + seed * 3, fq = Math.floor((ph - Math.floor(ph)) * 9) / 9;
      let fr;
      if (fq < 0.2) { fr = 3; P.sy = 0.94; P.sx = 1.05; }
      else if (fq < 0.3) fr = 4;
      else if (fq < 0.6) fr = 5;
      else if (fq < 0.7) { fr = 6; P.sy = 0.9; P.sx = 1.08; }
      else fr = (rt * 0.9 + seed * 5) % 3.3 < 0.17 ? 2 : Math.floor(rt * 3 + seed * 11) % 4 === 1 ? 1 : 0;
      if (fq >= 0.2 && fq < 0.7) {
        const q = clamp((fq - 0.17) / 0.5, 0, 1);
        P.lift = Math.sin(q * PI) * 6.5;
        P.rot = (q < 0.5 ? -0.16 : 0.1) * (left ? -1 : 1) * Math.sin(q * PI);
      }
      set = hit ? SPR.frogHit[v] : SPR.frog[v][fr];
      const k = 0.95 + seed * 0.1;
      P.sx *= k; P.sy *= k;
    }
    if (!set) return null;
    // hit = crease pop: crumpled + squashed for ~90 ms, then it springs back past its shape
    const fl = e.flash || 0;
    if (!e.dying && fl > 0) {
      if (fl > 0.45) { P.sx *= 1.16; P.sy *= 0.84; }
      else if (fl > 0.15) { P.sx *= 0.95; P.sy *= 1.06; }
    }
    P.set = left ? set.l : set.r;
    P.img = P.set.c;
    P.shs = left ? set.sl : set.sr;
    if (e.spawnT < 1 && !e.dying) {
      const q = spawnStep(e);
      if (e.type === 'ghost') {
        if (q < 0.5) { P.hide = true; P.k = q; }
        else { const u = (q - 0.5) / 0.5; P.sx *= u < 0.2 ? 0.5 : u < 0.5 ? 1.12 : 1; P.lift += (1 - u) * 6; P.k = q; }
      } else if (q < 0.3) { P.hide = true; P.k = 0; }
      else if (q < 0.45) { P.sy *= 0.42; P.sx *= 1.22; P.k = 0.4; }
      else if (q < 0.6) { P.sy *= 1.18; P.sx *= 0.9; P.k = 0.8; }
      else if (q < 0.75) { P.sy *= 0.93; P.sx *= 1.05; }
    }
    return P;
  }
  const PPOSE = { set: null, img: null, shs: null, lift: 0, rot: 0, sx: 1, sy: 1 };
  function playerPose(p, view) {
    const P = PPOSE;
    P.lift = 0; P.rot = 0; P.sx = 1; P.sy = 1;
    const rt = view.rt, g = view.game, dir = p.facing >= 0 ? 1 : -1;
    let fi = 0;
    if (g && g.state === 'dead' && p === g.player) fi = FX_I.DOWN;
    else if (p.hurtT > 0.5) { fi = FX_I.HURT; P.sx = 1.08; P.sy = 0.92; P.rot = -0.05 * dir; }
    else if (p.dashT > 0) { fi = FX_I.DASH; P.rot = 0.1 * (p.dashX >= 0 ? 1 : -1); P.sx = 1.1; P.sy = 0.93; P.lift = 1.2; }
    else if (p.dashCd > 1.06 && p.dashCd < 1.2) { fi = FX_I.LAND; P.sx = 1.06; P.sy = 0.95; }
    else if (p.moving) { const ph = p.anim / 6.2; fi = FX_I.WALK + (Math.floor((ph - Math.floor(ph)) * 8) & 7); }
    else if (p.shootT > 0.3) fi = FX_I.THROW;
    else {
      fi = FOX_IDLE_SEQ[Math.floor(rt * 8) % FOX_IDLE_SEQ.length];
      if (rt % 3.7 < 0.17) fi += FX_I.BLINK;
      else if (rt % 6.3 > 4.0 && rt % 6.3 < 4.36) fi = FX_I.FLICK;
    }
    if (p.shootT > 0 && fi !== FX_I.THROW) { P.sy *= 1 - 0.03 * p.shootT; P.sx *= 1 + 0.02 * p.shootT; }
    let left = p.facing < 0;
    if (p.levelT > 0) {
      // the sheet turns around once, like a card being flipped
      const c = Math.cos(Math.min(1, (1 - p.levelT) * 2) * TAU);
      if (c < 0) left = !left;
      P.sx *= Math.max(0.08, Math.abs(c));
      P.lift += Math.sin(p.levelT * PI) * 5;
    }
    const set = SPR.fox[fi];
    P.set = left ? set.l : set.r;
    P.img = P.set.c;
    P.shs = left ? set.sl : set.sr;
    return P;
  }
})();
