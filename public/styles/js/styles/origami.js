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
  // ground sheets (pale washi) – region ids: 0 base paper, 1 sage, 2 mustard, 3 coral, 4 teal, 5 water
  const GROUND = [
    hexA('#f4eee1'), hexA('#d5e1c0'), hexA('#f2dca6'), hexA('#f3cebe'), hexA('#c3dfd6'), hexA('#88a8d8'),
  ];
  const WATER = 5, BASE = 0;
  const LAYER = [1, 2, 3, 4, 5, 0];
  const SHADOW = 'rgb(78,56,72)';

  /* ============================================================== light */
  const LV = (() => { const v = [-0.55, -0.45, 0.7], l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; })();
  function toneOf(nx, ny, nz) {
    const d = nx * LV[0] + ny * LV[1] + nz * LV[2];
    return d > 0.8 ? 0 : d > 0.55 ? 1 : d > 0.3 ? 2 : 3;
  }

  /* ========================================================= fold meshes */
  function Fold() { this.v = []; this.f = []; this.idx = new Map(); this.dots = []; this.T = null; }
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
    renderFold(ctx, m, { mirror, ol: o.ol, cw: o.cw, seam: 0.9 / K });
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
  // ---- main character: a folded fox in an indigo kimono (faces +x)
  function fox(m, fr) {
    const by = -fr.bob, Y = (y) => y + by, e = fr.ear || 0, tw = fr.tail || 0;
    // tail (behind everything)
    const TA = [-2.4, Y(-9.6), 1.8], TB = [-12.8 + tw * 0.5, Y(-22.6) + tw, 1.2];
    const TP = [-10.6, Y(-11.4) + tw * 0.4, 0], TQ = [-4.6 + tw * 0.2, Y(-18.8) + tw * 0.6, 0];
    m.kite(TA, TB, TP, TQ, 'coral');
    m.kite(L3(TA, TB, 0.6), TB, L3(TP, TB, 0.52), L3(TQ, TB, 0.52), 'cream');
    // legs (dark paws), back one a step darker
    m.strip([-1.7, Y(-8.2)], [fr.b, -fr.lb], 3.0, 2.1, 1.0, ['ink', 1]);
    m.tri([fr.b - 1.3, -fr.lb, 0], [fr.b + 2.4, -fr.lb + 0.2, 0], [fr.b - 0.4, -fr.lb - 2.2, 0.9], ['ink', 1]);
    m.strip([1.8, Y(-8.2)], [fr.a, -fr.la], 3.0, 2.1, 1.0, 'ink');
    m.tri([fr.a - 1.3, -fr.la, 0], [fr.a + 2.5, -fr.la + 0.2, 0], [fr.a - 0.4, -fr.la - 2.2, 0.9], 'ink');
    // kimono body: one sheet folded down the middle
    const Nk = [0.8, Y(-18.8), 2.2], BL = [-6.4, Y(-6.0), 0], BR = [6.8, Y(-6.4), 0], BC = [0.9, Y(-5.2), 2.6];
    m.tri(Nk, BL, BC, 'indigo'); m.tri(Nk, BC, BR, 'indigo');
    // obi sash
    const s0 = 0.55, s1 = 0.7;
    m.quad(L3(Nk, BL, s0), L3(Nk, BC, s0), L3(Nk, BC, s1), L3(Nk, BL, s1), 'mustard');
    m.quad(L3(Nk, BC, s0), L3(Nk, BR, s0), L3(Nk, BR, s1), L3(Nk, BC, s1), 'mustard');
    // hem: the cream back of the sheet folded up
    m.quad(L3(Nk, BL, 0.9), L3(Nk, BC, 0.9), BC, BL, 'cream');
    m.quad(L3(Nk, BC, 0.9), L3(Nk, BR, 0.9), BR, BC, 'cream');
    // collar
    m.tri([Nk[0] - 2.6, Nk[1] + 0.9, 1.2], [Nk[0] + 0.2, Nk[1] + 5.0, 2.4], [Nk[0] + 0.1, Nk[1] + 0.1, 2.6], 'cream');
    m.tri([Nk[0] + 0.1, Nk[1] + 0.1, 2.6], [Nk[0] + 0.2, Nk[1] + 5.0, 2.4], [Nk[0] + 2.8, Nk[1] + 0.7, 1.2], 'cream');
    // front sleeve + paw
    const ar = fr.arm || 0;
    const SA = [3.2, Y(-16.4), 1.8], SB = [6.0 + ar, Y(-9.6), 1.6];
    m.kite(SA, SB, [1.8, Y(-11.4), 0], [7.8 + ar * 0.6, Y(-14.0), 0], 'indigo');
    m.tri([SB[0] - 1.0, SB[1] + 0.3, 0.6], [SB[0] + 1.6, SB[1] - 0.2, 0.6], [SB[0] + 0.6, SB[1] + 2.2, 1], 'ink');
    // ears (behind the head), inner ear = cream back side
    const H = (x, y, z) => [x, Y(y), z || 0];
    m.kite(H(-2.7, -26.0, 1.8), H(-4.6 + e, -34.0), H(-4.8, -24.4), H(-0.6, -27.0), 'coral');
    m.tri(H(-3.9, -25.9, 0.6), H(-1.5, -26.7, 0.6), H(-4.2 + e * 0.9, -31.6, 0.6), ['cream', 1]);
    m.kite(H(2.6, -26.6, 1.8), H(2.4 + e, -34.8), H(0.4, -26.9), H(4.8, -25.6), 'coral');
    m.tri(H(1.3, -26.9, 0.6), H(3.9, -26.1, 0.6), H(2.5 + e * 0.9, -32.2, 0.6), ['cream', 1]);
    // head
    const F = H(-0.4, -27.4, 2.6), Bk = H(-5.0, -23.4), Ck = H(-3.0, -19.4), Ch = H(3.4, -18.4, 0.4);
    const Sn = H(10.4, -21.0, 0.8), Ft = H(4.9, -26.0, 1.0), Md = H(2.2, -22.4, 3.6);
    m.tri(F, Bk, Md, 'coral'); m.tri(Bk, Ck, Md, 'coral'); m.tri(F, Md, Ft, 'coral'); m.tri(Ft, Md, Sn, 'coral');
    m.tri(Md, Ck, Ch, 'cream'); m.tri(Md, Ch, Sn, 'cream');
    m.dot(4.7, Y(-23.3), 0.85, INK, true);
    m.dot(10.1, Y(-21.0), 0.75, INK);
  }
  const FOX_FR = [
    { a: 1.8, b: -1.6, la: 0, lb: 0, bob: 0, tail: 0, arm: 0 },
    { a: 4.8, b: -4.4, la: 0, lb: 1.0, bob: 0.3, tail: -1.0, arm: 1.3 },
    { a: 1.4, b: -0.9, la: 1.8, lb: 0, bob: 1.1, tail: 0.4, arm: 0.2 },
    { a: -3.6, b: 3.8, la: 1.0, lb: 0, bob: 0.3, tail: 1.0, arm: -1.3 },
    { a: 0.6, b: 0.2, la: 0, lb: 1.8, bob: 1.1, tail: 0, arm: 0 },
    { a: 6.0, b: -6.4, la: 1.4, lb: 2.4, bob: 1.4, tail: 2.6, arm: -2.2, ear: -2.6 }, // dash
  ];

  // ---- small creature: origami jumping frog
  const FROG_KEYS = ['teal', 'sage', 'mustard'];
  function frog(m, fr, key) {
    const by = -fr.y;
    // back leg (big folded thigh)
    m.kite([-2.6, -6.4 + by, 2.2], [-9.4 - fr.leg, -0.4 - fr.leg * 0.2, 0.4], [-3.4, -0.6, 0], [-7.6 - fr.leg * 0.4, -7.0 + by, 0], [key, 1], key);
    // body: a diamond with an X of folds; lower half shows the cream back
    const R = [-7.4, -4.8 + by, 0], T = [-1.2, -11.8 + by, 0], Nn = [7.8, -6.8 + by, 0], B = [0.4, -1.2 + by * 0.4, 0], C = [0.2, -6.6 + by, 3.6];
    m.tri(R, T, C, key); m.tri(T, Nn, C, key); m.tri(R, C, B, ['cream', 0]); m.tri(C, Nn, B, ['cream', 0]);
    // eyes
    m.tri([0.6, -10.4 + by, 1.2], [2.0, -14.0 + by, 2.2], [3.5, -10.6 + by, 1.8], key);
    m.tri([3.4, -9.6 + by, 1.6], [5.0, -12.8 + by, 2.0], [6.4, -9.2 + by, 1.2], key);
    m.dot(2.0, -11.6 + by, 0.8, INK, true);
    m.dot(5.0, -10.4 + by, 0.75, INK, true);
    // front leg
    m.tri([3.6, -3.6 + by, 1.2], [6.6 + fr.front, -0.2 - fr.front * 0.3, 0.4], [2.4, -0.4, 0], [key, 1]);
  }
  const FROG_FR = [
    { y: 0, leg: 0, front: 0 },          // sit
    { y: -1.4, leg: -0.6, front: -0.4 }, // crouch
    { y: 1.2, leg: 4.0, front: 1.8 },    // leap
  ];

  // ---- fast creature: paper crane (u = wing raise)
  function crane(m, u, key) {
    const wy = -11 - 12.8 * u, wx = -4.6 + 2.4 * (1 - u);
    const under = u < 0.1;
    m.kite([-0.6, -11.4, 1.3], [wx + 3.0, wy - 1.4, 0.8], [-2.6, -11.0, 0], [2.2, -11.8, 0], under ? ['cream', 1] : [key, 1]);
    m.strip([-3.6, -10.6], [-12.6, -17.4], 2.8, 0, 1.2, key);
    m.strip([3.4, -10.8], [9.4, -19.8], 2.8, 1.0, 1.1, key);
    m.tri([8.9, -20.0, 0.9], [10.6, -20.8, 0.7], [13.6, -16.6, 0.2], key);
    const R = [-5.0, -10.6, 0], T = [0.2, -13.6, 0], Fr = [5.6, -10.8, 0], Bo = [0.4, -7.4, 0], C = [0.2, -10.6, 3.0];
    m.tri(R, T, C, key); m.tri(T, Fr, C, key); m.tri(R, C, Bo, key); m.tri(C, Fr, Bo, key);
    m.kite([0.4, -10.4, 1.6], [wx, wy, 1.0], [-2.4, -9.9, 0], [3.0, -10.6, 0], under ? 'cream' : key);
    m.dot(10.4, -19.8, 0.5, INK);
  }
  const CRANE_U = [1, 0.45, -0.35, 0.45];

  // ---- large creature: folded boar beast with a mustard mane and cream tusks
  function beast(m, fr) {
    const by = -fr.bob, Y = (y) => y + by;
    m.strip([-10.5, Y(-12)], [-10.5 - fr.a * 0.8, 0], 5.6, 4.2, 1.6, ['plum', 1]);
    m.tri([-10.5 - fr.a * 0.8 - 2.4, 0, 0], [-10.5 - fr.a * 0.8 + 2.4, 0, 0], [-10.5 - fr.a * 0.8, -2.2, 1], ['mustard', 1]);
    m.strip([7.5, Y(-12)], [7.5 - fr.b * 0.8, 0], 5.6, 4.2, 1.6, ['plum', 1]);
    m.tri([7.5 - fr.b * 0.8 - 2.4, 0, 0], [7.5 - fr.b * 0.8 + 2.4, 0, 0], [7.5 - fr.b * 0.8, -2.2, 1], ['mustard', 1]);
    // mane spikes along the spine (behind the body edge)
    const spine = [[-19.5, Y(-17)], [-12, Y(-28.5)], [-1, Y(-33.5)], [9, Y(-29.5)]];
    for (let s = 0; s < 3; s++) {
      const a = spine[s], b = spine[s + 1];
      for (let k = 0; k < 2; k++) {
        const p0 = L3(a, b, k / 2), p1 = L3(a, b, (k + 1) / 2), mid = L3(p0, p1, 0.5);
        const dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy);
        const tip = [mid[0] + (dy / l) * 7.5 - dx * 0.35, mid[1] - (dx / l) * 7.5 - dy * 0.35, 0.6];
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
    m.kite([8.4, Y(-28.6), 1.6], [5.0, Y(-37.5), 0.6], [6.4, Y(-27.6)], [11.4, Y(-29.6)], 'plum');
    m.tri([7.4, Y(-28.8), 0.8], [9.6, Y(-29.4), 0.8], [5.8, Y(-34.6), 0.8], ['cream', 1]);
    // head
    const HM = [13.2, Y(-21), 3.8];
    m.fan(HM, [[7, Y(-29), 0], [12.5, Y(-28.6), 0], [22.6, Y(-17.4), 0], [21.2, Y(-12.6), 0], [12, Y(-10.4), 0], [6.6, Y(-16), 0]], 'plum');
    m.tri([20.4, Y(-18.4), 1.0], [23.0, Y(-17.2), 0.6], [21.4, Y(-13.0), 0.6], ['blush', 1]);
    // tusk
    m.tri([16.8, Y(-13.8), 1.6], [19.2, Y(-12.9), 1.6], [21.0, Y(-21.2), 2.4], 'cream');
    // eye
    m.tri([12.6, Y(-23.8), 3.8], [16.8, Y(-22.6), 3.4], [13.4, Y(-21.4), 3.8], 'mustard');
    m.dot(14.4, Y(-22.7), 0.7, INK);
    // near legs
    m.strip([-13.5, Y(-13)], [-13.5 + fr.a, 0], 6.2, 4.6, 1.8, 'plum');
    m.tri([-13.5 + fr.a - 2.6, 0, 0], [-13.5 + fr.a + 2.6, 0, 0], [-13.5 + fr.a, -2.4, 1.2], 'mustard');
    m.strip([4.5, Y(-13)], [4.5 + fr.b, 0], 6.2, 4.6, 1.8, 'plum');
    m.tri([4.5 + fr.b - 2.6, 0, 0], [4.5 + fr.b + 2.6, 0, 0], [4.5 + fr.b, -2.4, 1.2], 'mustard');
  }
  const BEAST_FR = [{ a: 3.6, b: -3.6, bob: 0 }, { a: 0.4, b: -0.4, bob: 1.3 }, { a: -3.6, b: 3.6, bob: 0 }, { a: -0.4, b: 0.4, bob: 1.3 }];

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
      const xa = x0 + i * w, xb = xa + w, za = i & 1 ? 2.4 : 0, zb = i & 1 ? 0 : 2.4;
      m.quad([xa, 0, za], [xa, -11, za], [xb, -11 - 0.6, zb], [xb, -0.6, zb], 'cream');
      m.quad([xa, -11, za], [xa, -13.6, za], [xb, -14.2, zb], [xb, -11.6, zb], 'teal');
    }
  }

  const PROP_DEF = {
    pine: { n: 3, box: [-17, -72, 17, 4], fn: pine, mir: true, contact: [13, 4.2], tall: 60 },
    tree: { n: 4, box: [-17, -50, 17, 4], fn: roundTree, mir: true, contact: [12, 4], tall: 46 },
    stone: { n: 3, box: [-13, -14, 18, 3], fn: stone, mir: true, contact: [9, 3] },
    house: { n: 2, box: [-15, -36, 22, 3], fn: house, mir: false, contact: [16, 4.5], tall: 34 },
    tulips: { n: 2, box: [-10, -23, 10, 3], fn: tulips, mir: true, contact: [6, 2] },
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
  const CS = 40;                 // crease tessellation cell (world units)
  const MAJOR = 4;               // every 4th line is a full-sheet fold
  function regionAt(x, y) {
    const d2 = x * x + y * y;
    const w = U.fbm(x / 720 + 13.1, y / 720 - 7.7, 71, 3);
    if (w > 0.64 && d2 > 190 * 190) return WATER;
    const s = U.fbm(x / 420, y / 420, 31, 3);
    if (s < 0.5) return BASE;
    const c = U.fbm(x / 1000 - 3.3, y / 1000 + 9.1, 47, 2);
    return c < 0.44 ? 1 : c < 0.5 ? 2 : c < 0.56 ? 3 : 4;
  }
  // triangle k of cell (i,j): 0 N, 1 E, 2 S, 3 W
  function triCentroid(i, j, k) {
    const x0 = i * CS, y0 = j * CS;
    switch (k) {
      case 0: return [x0 + CS / 2, y0 + CS / 6];
      case 1: return [x0 + (CS * 5) / 6, y0 + CS / 2];
      case 2: return [x0 + CS / 2, y0 + (CS * 5) / 6];
      default: return [x0 + CS / 6, y0 + CS / 2];
    }
  }
  const regCache = new Map();
  function triRegion(i, j, k) {
    const key = (i * 7919 + j) * 4 + k;
    let r = regCache.get(key);
    if (r === undefined) {
      const c = triCentroid(i, j, k);
      r = regionAt(c[0], c[1]);
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
  // outer edge neighbour of triangle k of cell (i,j)
  const OUTER = [[0, -1, 2], [1, 0, 3], [0, 1, 0], [-1, 0, 1]];
  // relief: the sheet keeps a faint memory of its folds. Every panel between two major folds (4 x 4 cells) has its
  // own crease pattern: 0 pyramids, 1 waterbomb (pyramids up/down in a checker), 2 horizontal pleats, 3 twist.
  const RELIEF_UP = [0.022, -0.017, -0.027, 0.013];
  function reliefAmp(i, j) { return 0.35 + 0.9 * U.fbm(i * 0.21 + 4.1, j * 0.21 - 2.3, 91, 2); }
  function patternOf(i, j) {
    const h = U.hash2(Math.floor(i / MAJOR), Math.floor(j / MAJOR), 6007);
    return h < 0.42 ? 0 : h < 0.68 ? 1 : h < 0.84 ? 2 : 3;
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

  function* renderGround(ctx, info) {
    const i0 = Math.floor(info.wx / CS) - 1, i1 = Math.floor((info.wx + info.size) / CS) + 1;
    const j0 = Math.floor(info.wy / CS) - 1, j1 = Math.floor((info.wy + info.size) / CS) + 1;
    const tris = [];
    const byLayer = [[], [], [], [], [], []];
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const amp = reliefAmp(i, j);
        for (let k = 0; k < 4; k++) {
          const r = triRegion(i, j, k);
          const rel = reliefOf(i, j, k) * amp;
          const t = { i, j, k, r, L: LAYER[r], p: triPts(i, j, k), col: rgbs(GROUND[r], 1 + (r === WATER ? 0 : rel)) };
          tris.push(t);
          byLayer[t.L].push(t);
        }
      }
    }
    const pathOf = (list) => {
      const p = new Path2D();
      for (const t of list) { const q = t.p; p.moveTo(q[0], q[1]); p.lineTo(q[2], q[3]); p.lineTo(q[4], q[5]); p.closePath(); }
      return p;
    };
    const fillTris = (list) => {
      for (const t of list) {
        const q = t.p;
        ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[2], q[3]); ctx.lineTo(q[4], q[5]); ctx.closePath();
        ctx.fillStyle = t.col; ctx.fill();
        ctx.strokeStyle = t.col; ctx.lineWidth = 0.6; ctx.stroke();
      }
    };
    const lay = (i, j, k) => LAYER[triRegion(i, j, k)];
    for (let L = 0; L < 6; L++) {
      const list = byLayer[L];
      if (!list.length) continue;
      if (L > 0) {
        // drop shadow of this layer onto the lower ones (two offset passes = soft edge)
        const p = pathOf(list);
        ctx.save();
        ctx.fillStyle = 'rgba(84,60,58,0.07)'; ctx.translate(2.6, 3.2); ctx.fill(p);
        ctx.fillStyle = 'rgba(84,60,58,0.09)'; ctx.translate(-1.3, -1.6); ctx.fill(p);
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
    // crease lines of the tessellation (not on water)
    ctx.lineCap = 'round';
    const dark = 'rgba(98,76,60,0.16)', grid = 'rgba(98,76,60,0.13)', light = 'rgba(255,253,246,0.7)';
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const pat = patternOf(i, j);
        const up = pat === 1 ? ((i + j) & 1) === 0 : pat === 3 ? (i & 1) === (j & 1) : true;
        const x0 = i * CS, y0 = j * CS, cx = x0 + CS / 2, cy = y0 + CS / 2;
        const w = [0, 1, 2, 3].map((k) => triRegion(i, j, k) === WATER);
        // diagonals: corner -> centre, between triangles (W,N)=TL, (N,E)=TR, (E,S)=BR, (S,W)=BL
        const diag = [[x0, y0, 3, 0], [x0 + CS, y0, 0, 1], [x0 + CS, y0 + CS, 1, 2], [x0, y0 + CS, 2, 3]];
        for (const d of diag) {
          if (pat === 2 || w[d[2]] || w[d[3]]) continue;
          if (up) {
            ctx.strokeStyle = 'rgba(98,76,60,0.07)'; ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.moveTo(d[0] + 0.5, d[1] + 0.5); ctx.lineTo(cx + 0.5, cy + 0.5); ctx.stroke();
            ctx.strokeStyle = light; ctx.lineWidth = 0.45;
          } else { ctx.strokeStyle = dark; ctx.lineWidth = 0.42; }
          ctx.beginPath(); ctx.moveTo(d[0], d[1]); ctx.lineTo(cx, cy); ctx.stroke();
        }
        // top + left grid edges
        if (!w[0] && triRegion(i, j - 1, 2) !== WATER && j % MAJOR !== 0) {
          if (pat === 2 && (j & 1)) { ctx.strokeStyle = light; ctx.lineWidth = 0.5; }
          else { ctx.strokeStyle = pat === 2 ? dark : grid; ctx.lineWidth = 0.38; }
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + CS, y0); ctx.stroke();
        }
        if (!w[3] && triRegion(i - 1, j, 1) !== WATER && i % MAJOR !== 0) {
          ctx.strokeStyle = grid; ctx.lineWidth = 0.38; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + CS); ctx.stroke();
        }
      }
    }
    yield;
    // major folds in diagram notation: valley = dashed, mountain = dash-dot
    const M = CS * MAJOR;
    ctx.save();
    ctx.lineWidth = 0.6;
    for (let gx = Math.floor(info.wx / M) * M; gx <= info.wx + info.size + 1; gx += M) {
      const valley = Math.round(gx / M) % 2 === 0;
      ctx.strokeStyle = valley ? 'rgba(59,74,135,0.28)' : 'rgba(201,91,71,0.3)';
      ctx.setLineDash(valley ? [5, 3.5] : [7, 2.5, 1.2, 2.5]);
      const ys = Math.floor(info.wy / 17) * 17 - 17;
      ctx.beginPath(); ctx.moveTo(gx, ys); ctx.lineTo(gx, info.wy + info.size + 17); ctx.stroke();
    }
    for (let gy = Math.floor(info.wy / M) * M; gy <= info.wy + info.size + 1; gy += M) {
      const valley = Math.round(gy / M) % 2 !== 0;
      ctx.strokeStyle = valley ? 'rgba(59,74,135,0.28)' : 'rgba(201,91,71,0.3)';
      ctx.setLineDash(valley ? [5, 3.5] : [7, 2.5, 1.2, 2.5]);
      const xs = Math.floor(info.wx / 17) * 17 - 17;
      ctx.beginPath(); ctx.moveTo(xs, gy); ctx.lineTo(info.wx + info.size + 17, gy); ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
    // paper fibre over the whole sheet
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 0.5;
    const fw = FIBRE.width, sx = -(((info.wx * info.res) % fw) + fw) % fw, sy = -(((info.wy * info.res) % fw) + fw) % fw;
    for (let y = sy; y < info.px; y += fw) for (let x = sx; x < info.px; x += fw) ctx.drawImage(FIBRE, x, y);
    ctx.restore();
    yield;
    yield* groundDecals(ctx, info);
  }

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
    // folded wave crests: little cream hooks
    G.scatter(info, 52, 5151, 14, (x, y, rng) => {
      if (regionAtPoint(x, y) !== WATER || regionAtPoint(x - 8, y) !== WATER || regionAtPoint(x + 8, y) !== WATER) return;
      const s = 0.8 + rng.next() * 0.5;
      const m = new Fold();
      m.at(x, y, s, 0);
      m.tri([-7, 2, 0], [0, -1.2, 1.4], [-1, 2, 0.6], ['cream', 0]);
      m.tri([-1, 2, 0.6], [0, -1.2, 1.4], [4, 2, 0], ['cream', 1]);
      m.tri([0, -1.2, 1.4], [3.8, -3.6, 0.8], [2.2, 0.4, 0.8], 'cream');
      m.at();
      renderFold(ctx, m, { ol: 0.35, cw: 0.25, seam: 0.3 });
    });
  }

  const FLOWER_KEYS = ['blush', 'cream', 'mustard', 'cream'];
  function* groundDecals(ctx, info) {
    let n = 0;
    const list = [];
    G.scatter(info, 21, 7331, 8, (x, y, rng) => {
      const r = rng.next();
      if (r > 0.13) return;
      const reg = regionAtPoint(x, y);
      if (reg === WATER) return;
      list.push([x, y, r, rng.next(), rng.next(), rng.next(), reg]);
    });
    for (const [x, y, r, a, b, c, reg] of list) {
      const m = new Fold();
      if (r < 0.022) {
        // flat folded flower: 5 kite petals
        const key = FLOWER_KEYS[(a * FLOWER_KEYS.length) | 0], s = 0.6 + b * 0.35, rot = c * TAU;
        m.at(x, y, s, rot);
        for (let p = 0; p < 4; p++) {
          const ang = (p / 4) * TAU;
          const tip = [Math.cos(ang) * 4.0, Math.sin(ang) * 4.0, 0];
          m.kite([0, 0, 1.5], tip, [Math.cos(ang + 0.62) * 3.4, Math.sin(ang + 0.62) * 3.4, 0], [Math.cos(ang - 0.62) * 3.4, Math.sin(ang - 0.62) * 3.4, 0], key);
        }
        m.dot(0, 0, 0.9, key === 'mustard' ? '#c95b47' : '#e6ae42');
      } else if (r < 0.105) {
        // folded grass blades
        const key = reg === 1 || reg === 4 ? 'pine' : 'sage', s = 0.8 + b * 0.5;
        m.at(x, y, s, 0);
        m.strip([-1.5, 0], [-3.6, -5.2], 1.4, 0, 0.5, key);
        m.strip([0, 0], [0.6, -7.0], 1.6, 0, 0.6, key);
        m.strip([1.4, 0], [3.8, -4.6], 1.4, 0, 0.5, key);
      } else if (r < 0.122) {
        // paper scraps / confetti lying flat
        const keys = ['blush', 'sage', 'cream', 'mustard'];
        for (let q = 0; q < 2; q++) {
          const key = keys[((a + q * 0.37) * keys.length | 0) % keys.length];
          const sx = x + (q ? 3 : 0), sy = y + (q ? 2 : 0), s = 1.2 + b * 0.8, rot = c * TAU + q * 2;
          m.at(sx, sy, s, rot);
          m.tri([0, -1, 0.3], [1.1, 0.8, 0], [-1.1, 0.8, 0], key);
        }
      } else if (r < 0.127) {
        // fold arrow from the diagram
        ctx.save();
        ctx.translate(x, y); ctx.rotate(c * TAU);
        ctx.strokeStyle = 'rgba(59,74,135,0.38)'; ctx.lineWidth = 0.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 6, 9, -PI * 0.85, -PI * 0.2); ctx.stroke();
        const ex = Math.cos(-PI * 0.2) * 9, ey = 6 + Math.sin(-PI * 0.2) * 9;
        ctx.beginPath(); ctx.moveTo(ex - 2.6, ey - 1.4); ctx.lineTo(ex, ey); ctx.lineTo(ex - 0.6, ey - 3); ctx.stroke();
        ctx.restore();
        continue;
      } else continue;
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
  function actorSet(box, fn, opt) {
    const r = bake(box, (m) => fn(m), false), l = bake(box, (m) => fn(m), true);
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
      // main character
      SPR.fox = FOX_FR.map((fr) => actorSet([-14, -36, 12, 2], (m) => fox(m, fr), { ...UPRIGHT, contact: [6.5, 2.2] }));
      // creatures
      SPR.frog = FROG_KEYS.map((key) => FROG_FR.map((fr) => actorSet([-14, -16, 10, 2], (m) => frog(m, fr, key), { shx: 0.5, shy: -0.4, a: 0.3, contact: [7.5, 2.4] })));
      SPR.crane = CRANE_U.map((u) => actorSet([-14, -26, 15, 1], (m) => crane(m, u, 'blush'), { shx: 0.05, shy: 0.42, a: 0.24, contact: null, blur: 1.4 }));
      SPR.beast = BEAST_FR.map((fr) => actorSet([-25, -40, 25, 2], (m) => beast(m, fr), { shx: 0.55, shy: -0.34, a: 0.32, contact: [17, 4.6], blur: 1.4 }));
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
      G.scatterOwned(info, 60, 8128, (x, y, rng) => {
        const r = rng.next(), vr = rng.next();
        const reg = regionAtPoint(x, y);
        let t = null, v = 0;
        if (reg === WATER) {
          if (r < 0.12) { t = 'paperBoat'; v = (vr * 3) | 0; }
          else if (r < 0.24) t = 'lotus';
        } else if (reg === BASE) {
          if (r < 0.05) t = 'pinwheel';
          else if (r < 0.1) { t = 'stone'; v = (vr * 3) | 0; }
          else if (r < 0.15) { t = 'tulips'; v = vr < 0.5 ? 0 : 1; }
          else if (r < 0.18) t = 'fence';
          else if (r < 0.215) { t = 'pine'; v = vr < 0.5 ? 0 : 2; }
          else if (r < 0.24) { t = 'tree'; v = (vr * 4) | 0; }
        } else if (reg === 1) {
          if (r < 0.17) { t = 'pine'; v = (vr * 3) | 0; }
          else if (r < 0.27) { t = 'tree'; v = vr < 0.6 ? 2 : 0; }
          else if (r < 0.34) { t = 'tulips'; v = vr < 0.5 ? 0 : 1; }
          else if (r < 0.38) { t = 'stone'; v = (vr * 3) | 0; }
        } else if (reg === 2) {
          if (r < 0.12) { t = 'tree'; v = vr < 0.5 ? 0 : 1; }
          else if (r < 0.18) { t = 'house'; v = vr < 0.5 ? 0 : 1; }
          else if (r < 0.24) t = 'pinwheel';
          else if (r < 0.29) t = 'fence';
          else if (r < 0.34) { t = 'tulips'; v = 1; }
        } else if (reg === 3) {
          if (r < 0.13) { t = 'tree'; v = vr < 0.6 ? 0 : 1; }
          else if (r < 0.21) { t = 'tulips'; v = 0; }
          else if (r < 0.26) { t = 'stone'; v = (vr * 3) | 0; }
          else if (r < 0.3) { t = 'house'; v = 1; }
        } else {
          if (r < 0.18) { t = 'pine'; v = vr < 0.6 ? 2 : 1; }
          else if (r < 0.26) { t = 'stone'; v = (vr * 3) | 0; }
          else if (r < 0.31) { t = 'tree'; v = 3; }
        }
        if (!t) return;
        const tall = t === 'pine' || t === 'tree' || t === 'house';
        if (tall && G.nearSpawn(x, y, 100)) return;
        if (G.nearSpawn(x, y, 40)) return;
        if (t !== 'paperBoat' && t !== 'lotus') {
          // keep land props off the water
          if (regionAtPoint(x - 12, y) === WATER || regionAtPoint(x + 12, y) === WATER || regionAtPoint(x, y + 4) === WATER) return;
        } else if (regionAtPoint(x - 14, y) !== WATER || regionAtPoint(x + 14, y) !== WATER || regionAtPoint(x, y - 8) !== WATER || regionAtPoint(x, y + 8) !== WATER) return;
        const d = PROP_DEF[t];
        out.push({ x, y, t, v, f: !!(d && d.mir && rng.chance(0.5)), ph: rng.next() * TAU, pad: tall ? 80 : 30 });
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
      blit(ctx, s, p.x, p.y, 1, 1);
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
        const P = enemyPose(o, view.rt);
        if (!P) return;
        let k = P.k;
        if (k <= 0.02) return;
        if (o.type === 'ghost') {
          ctx.globalAlpha = k;
          blit(ctx, P.shs, o.x + P.lift * 0.45 + 2, o.y + 2.5, 0.9, 0.9);
        } else {
          ctx.globalAlpha = k;
          const sc = 1 - P.lift * 0.04;
          blit(ctx, P.shs, o.x, o.y, sc * P.sx, sc);
        }
        ctx.globalAlpha = 1;
        return;
      }
      const P = playerPose(o, view);
      blit(ctx, P.shs, o.x, o.y, (1 - P.lift * 0.03) * P.sx, 1 - P.lift * 0.03);
    },

    drawGem(ctx, g, view) {
      const big = g.big;
      let h = 3 + Math.sin(view.rt * 4 + g.seed * 20) * 1.2, sc = 1;
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
      const P = enemyPose(e, view.rt);
      if (!P) return;
      const key = keyOfEnemy(e);
      // spawn: a flat square sheet on the ground folds itself up into the creature
      if (e.spawnT < 1 && !e.dying && e.type !== 'ghost') {
        const q = e.spawnT, r = e.type === 'colossus' ? 17 : 9;
        const a = 1 - U.smoothstep(0.45, 1, q);
        if (a > 0.01) {
          const R = RAMP[key], s = r * (1.25 - q * 0.6), rot = q * 1.6;
          ctx.globalAlpha = a;
          const c = Math.cos(rot) * s, sn = Math.sin(rot) * s * 0.55;
          const pts = [[e.x + c, e.y + sn], [e.x - sn / 0.55 * 1, e.y + c * 0.55], [e.x - c, e.y - sn], [e.x + sn / 0.55, e.y - c * 0.55]];
          for (let i = 0; i < 4; i++) {
            const p0 = pts[i], p1 = pts[(i + 1) % 4];
            ctx.fillStyle = R[i === 0 || i === 3 ? 0 : i === 1 ? 1 : 2];
            ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.closePath(); ctx.fill();
          }
          ctx.strokeStyle = LINE[key].edge; ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < 4; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
      let sx = P.sx, sy = P.sy, alpha = P.alpha;
      if (e.dying) {
        // unfold: flatten into a sheet and fade
        const q = e.deathT;
        if (q >= 1) return;
        const k = U.ease.outQuad(Math.min(1, q / 0.7));
        sx *= 1 + 0.35 * k; sy *= 1 - 0.85 * k; alpha *= 1 - q * q;
        ctx.globalAlpha = alpha;
        blitRot(ctx, V, P.set, e.x, e.y - P.lift * (1 - k), sx, sy, P.rot * (1 - k), P.img);
        ctx.globalAlpha = alpha * (1 - q);
        blitRot(ctx, V, P.set, e.x, e.y - P.lift * (1 - k), sx, sy, P.rot * (1 - k), flashOf(P.set));
        ctx.globalAlpha = 1;
        return;
      }
      const fl = e.flash || 0;
      if (fl > 0) { sx *= 1 + 0.16 * fl; sy *= 1 - 0.14 * fl; }
      ctx.globalAlpha = alpha;
      blitRot(ctx, V, P.set, e.x, e.y - P.lift, sx, sy, P.rot, P.img);
      if (fl > 0.02) {
        ctx.globalAlpha = Math.min(0.85, fl * 1.2) * alpha;
        blitRot(ctx, V, P.set, e.x, e.y - P.lift, sx, sy, P.rot, flashOf(P.set));
      }
      ctx.globalAlpha = 1;
    },

    drawPlayer(ctx, p, view) {
      const V = tf(view);
      const P = playerPose(p, view);
      let sx = P.sx, sy = P.sy;
      if (p.dashT > 0) {
        const k = U.clamp(p.dashT / 0.2, 0, 1);
        for (let i = 3; i >= 1; i--) {
          ctx.globalAlpha = (0.38 / i) * k;
          blitRot(ctx, V, P.set, p.x - p.dashX * i * 7, p.y - p.dashY * i * 7 - P.lift, sx, sy, P.rot, flashOf(P.set));
        }
        ctx.globalAlpha = 1;
      }
      let a = 1;
      const hurt = p.hurtT > 0;
      if (p.iframes > 0 && !hurt && p.dashT <= 0 && (Math.floor(view.rt * 16) & 1)) a = 0.55;
      ctx.globalAlpha = a;
      blitRot(ctx, V, P.set, p.x, p.y - P.lift, sx, sy, P.rot, P.img);
      if (hurt) {
        ctx.globalAlpha = Math.min(0.9, p.hurtT * 1.2);
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
      const a = ((pr.angle % TAU) + TAU) % TAU;
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
      const t = 1 - pt.life / pt.max;
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
        case 'sheet': {
          // the unfolded square of a creature, tumbling away
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
          ctx.setLineDash([4, 2.5, 1, 2.5]);
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
          const flap = Math.abs(Math.sin(rt * 11 + ph * 3));
          const s = SPR.bfly[(h * 100 | 0) % SPR.bfly.length];
          const dir = Math.cos(rt * 0.33 + ph) > 0 ? 1 : -1;
          // two mirrored wings around the body
          const S = V.S, k = 1 / K, w = 0.25 + 0.75 * flap;
          ctx.setTransform(S * w, 0, 0, S, V.ox + x * S, V.oy + (y - z) * S);
          ctx.drawImage(s.c, -s.ox * k, -s.oy * k, s.c.width * k, s.c.height * k);
          ctx.setTransform(-S * w * 0.85, 0, 0, S * 0.95, V.ox + x * S, V.oy + (y - z) * S);
          ctx.drawImage(s.c, -s.ox * k, -s.oy * k, s.c.width * k, s.c.height * k);
          ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
          void dir;
        }
      }
    },

    drawScreenOverlay(ctx, view) {
      ctx.drawImage(screenLight(view.W, view.H), 0, 0);
    },

    /* --------------------------------------------------------------- hooks */
    onHit(game, e) {
      const key = keyOfEnemy(e), h = heightOf(e);
      game.addParticle({ kind: 'flash', x: e.x + (Math.random() - 0.5) * 4, y: e.y + 0.5, z: h + (Math.random() - 0.5) * 4, life: 0.16, size: e.type === 'colossus' ? 7 : 5, drag: 0 });
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * TAU, sp = 40 + Math.random() * 40;
        game.addParticle({ kind: 'shard', key: i ? key : 'cream', x: e.x, y: e.y + 0.5, z: h, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5, vz: 50 + Math.random() * 40, grav: 260, drag: 1.5, life: 0.4, size: 1.6, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 16 });
      }
    },
    onKill(game, e) {
      const key = keyOfEnemy(e), h = heightOf(e), big = e.type === 'colossus';
      const x = e.x, y = e.y + 0.6;
      game.addParticle({ kind: 'sheet', key, x, y, z: h, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 10, vz: 70 + Math.random() * 30, grav: 150, drag: 1.6, life: 0.9, size: big ? 11 : 6, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 7 });
      petals(game, x, y, h, big ? 12 : 8, key, 'cream', big ? 70 : 52, big ? 0.5 : 0.4, big ? 9 : 5.5);
      const n = big ? 16 : 8;
      for (let i = 0; i < n; i++) conf(game, x, y, h, i % 3 === 0 ? 'cream' : i % 3 === 1 ? key : 'mustard', big ? 2.4 : 1.8, big ? 80 : 55, 0.9);
      if (big) { game.addParticle({ kind: 'ring', x, y, life: 0.55, size: 1.3, drag: 0, color: '#5a447c' }); game.shake = Math.max(game.shake, 4); }
    },
    onHurt(game, p) {
      game.addParticle({ kind: 'flash', x: p.x, y: p.y + 0.5, z: 18, life: 0.2, size: 8, drag: 0, color: '#fffbf3' });
      for (let i = 0; i < 6; i++) conf(game, p.x, p.y + 0.5, 16, i & 1 ? 'coral' : 'cream', 1.8, 60, 0.7);
    },
    onPickup(game, g) {
      game.addParticle({ kind: 'flash', x: g.x + (Math.random() - 0.5) * 6, y: g.y + 0.5, z: 8 + Math.random() * 8, life: 0.25, size: g.big ? 6 : 3.6, drag: 0, color: g.big ? '#9ee0d4' : '#fff1bd' });
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
      game.addParticle({ kind: 'ring', x: p.x, y: p.y, life: 0.7, size: 1.5, drag: 0, color: '#c68c2d' });
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
  const POSE = { set: null, img: null, sh: null, lift: 0, rot: 0, sx: 1, sy: 1, alpha: 1, k: 1 };
  function enemyPose(e, rt) {
    const P = POSE;
    P.lift = 0; P.rot = 0; P.sx = 1; P.sy = 1; P.alpha = 1; P.k = 1;
    const left = e.facing < 0;
    let set;
    const seed = e.seed || 0, anim = e.anim || 0;
    if (e.type === 'ghost') {
      const f = Math.floor(rt * 10 + seed * 4) & 3;
      set = SPR.crane[f];
      P.lift = 8 + Math.sin(rt * 3 + seed * 9) * 1.8 + (f === 0 ? -0.8 : f === 2 ? 0.8 : 0);
      P.rot = U.clamp((e.vx || 0) / 64, -1, 1) * 0.12;
    } else if (e.type === 'colossus') {
      const f = Math.floor(anim * 0.32 * 4 + seed * 4) & 3;
      set = SPR.beast[f];
      const ph = anim * 0.32 * TAU;
      P.rot = Math.sin(ph) * 0.03;
      P.sx = 0.96 + seed * 0.08; P.sy = P.sx;
    } else {
      const v = Math.floor(seed * 3) % 3;
      const ph = anim * 0.5 + seed * 3, f = ph - Math.floor(ph);
      let fr = 0;
      if (f < 0.2) { fr = 1; P.sy = 1 - 0.08 * Math.sin((f / 0.2) * PI); P.sx = 1 + 0.06 * Math.sin((f / 0.2) * PI); }
      else if (f < 0.78) {
        const q = (f - 0.2) / 0.58;
        P.lift = Math.sin(q * PI) * 4.5;
        fr = q < 0.8 ? 2 : 0;
        P.rot = (q < 0.5 ? -0.2 : 0.12) * (left ? -1 : 1) * Math.sin(q * PI);
      }
      set = SPR.frog[v][fr];
      P.sx *= 0.95 + seed * 0.1; P.sy *= 0.95 + seed * 0.1;
    }
    if (!set) return null;
    P.set = left ? set.l : set.r;
    P.img = P.set.c;
    P.sh = (left ? set.sl : set.sr).c;
    // shadow image must be drawn with the shadow's own anchor
    P.shs = left ? set.sl : set.sr;
    if (e.spawnT < 1 && !e.dying) {
      const q = U.clamp(e.spawnT, 0, 1);
      if (e.type === 'ghost') { P.alpha = q; P.lift += (1 - q) * 30; P.k = q; }
      else {
        const p = q < 0.25 ? 0 : U.ease.outBack((q - 0.25) / 0.75);
        P.sy *= Math.max(0.02, p); P.sx *= 1 + (1 - Math.min(1, p)) * 0.3;
        P.k = Math.min(1, p);
        if (p <= 0.02) P.alpha = 0;
      }
    }
    if (e.dying) P.k = Math.max(0, 1 - e.deathT * 1.5);
    return P;
  }
  const PPOSE = { set: null, img: null, sh: null, lift: 0, rot: 0, sx: 1, sy: 1 };
  function playerPose(p, view) {
    const P = PPOSE;
    P.lift = 0; P.rot = 0; P.sx = 1; P.sy = 1;
    let fi = 0;
    if (p.dashT > 0) { fi = 5; P.rot = 0.12 * (p.dashX >= 0 ? 1 : -1); P.sx = 1.08; P.sy = 0.95; }
    else if (p.moving) {
      const ph = p.anim / 4.6, f = ph - Math.floor(ph);
      fi = 1 + (Math.floor(f * 4) & 3);
      P.lift = Math.abs(Math.sin(f * TAU)) * 1.1;
      P.rot = 0.04 * (p.facing >= 0 ? 1 : -1);
    } else {
      const b = Math.sin(view.rt * 3);
      P.sy = 1 + 0.018 * b; P.sx = 1 - 0.012 * b;
    }
    if (p.shootT > 0) { P.sy *= 1 - 0.04 * p.shootT; P.sx *= 1 + 0.03 * p.shootT; }
    if (p.hurtT > 0) { P.sx *= 1 + 0.12 * p.hurtT; P.sy *= 1 - 0.1 * p.hurtT; P.rot += Math.sin(p.hurtT * 30) * 0.06 * p.hurtT; }
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
    P.sh = (left ? set.sl : set.sr).c;
    P.shs = left ? set.sl : set.sr;
    return P;
  }
})();
