/* Paper World — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md */
(function (root) {
  'use strict';
  const PALETTE = {
    ink: '#3b2a26', rim: '#fbf6ea', cream: '#f2e7cf', kraft: '#ad8259', kraftDark: '#7d5838', kraftLight: '#c9a275',
    groundKraft: '#a87c54', card: '#c49c6c', cardDark: '#96714a', cardLight: '#dcbb8c', felt: '#607c46', moss: '#868440',
    newsprint: '#ddd5c0', paperCore: '#f6eedc', thread: '#f4e8ce', mustard: '#d6a43a', mustardDark: '#ac7f26',
    pumpkin: '#e57d2c', pumpkinDark: '#bb5a20', pumpkinDeep: '#9c4618', pumpkinLight: '#f59c4c', glow: '#ffcf4a',
    red: '#c4432f', redDark: '#8e2c22', leaf: '#76a54e', leafLight: '#a3cc6a', leafDark: '#4d7a35',
    aub: '#6e3c6d', aubLight: '#9c629a', aubDark: '#4a2649', aubDeep: '#2e1530', boot: '#5b3d2a', bootDark: '#3e281b',
    brass: '#d4ac4a', brassLight: '#fff0b0', brassDark: '#8f6d24', teal: '#36a596', tealMid: '#5cc3b2', tealDark: '#1d6d68',
    shadow: '#301a0c',
  };
  const C = PALETTE, TAU = Math.PI * 2, K = 4;          // K = sprite resolution: canvas px per world unit
  const SH = 'rgb(48,26,12)';                           // every shadow is warm brown, never black

  /* ---------- tiny helpers ---------- */
  function cv(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
  const g2 = (c) => c.getContext('2d');
  function rng(seed) { // mulberry32
    let a = seed >>> 0;
    const n = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    return { next: n, range: (lo, hi) => lo + (hi - lo) * n(), chance: (p) => n() < p };
  }
  const hexRGB = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const rgba = (h, a) => 'rgba(' + hexRGB(h).join(',') + ',' + a + ')';
  const shade = (h, f) => 'rgb(' + hexRGB(h).map((v) => Math.min(255, Math.round(v * f))).join(',') + ')';
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  /** draw src blurred by px (real CSS blur filter) */
  function blurInto(x, src, dx, dy, px) { x.filter = 'blur(' + px.toFixed(2) + 'px)'; x.drawImage(src, dx, dy); x.filter = 'none'; }
  /** one-colour silhouette of a canvas */
  function sil(src, col) { const c = cv(src.width, src.height), x = g2(c); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); return c; }
  /** morphological dilation = the white "sticker" rim around every cut piece */
  function dilate(src, r, col) {
    const pad = Math.ceil(r) + 2, c = cv(src.width + pad * 2, src.height + pad * 2), x = g2(c), s = sil(src, col);
    for (const rr of [r, r * 0.6, r * 0.3]) { const n = Math.max(8, Math.round(rr * 3.2)); for (let i = 0; i < n; i++) { const a = ((i + 0.5) / n) * TAU; x.drawImage(s, pad + Math.cos(a) * rr, pad + Math.sin(a) * rr); } }
    x.drawImage(s, pad, pad);
    return { c, pad };
  }
  function softShadow(src, blur) { const pad = Math.ceil(blur * 2.5) + 2, c = cv(src.width + pad * 2, src.height + pad * 2); blurInto(g2(c), sil(src, SH), pad, pad, blur); return { c, pad }; }

  /* ---------- paper material: grain + top-left light (applied source-atop to every piece) ---------- */
  let GRAIN = null, grainN = 0;
  function buildGrain() {
    const n = 256, c = cv(n, n), x = g2(c), r = rng(4242), im = x.createImageData(n, n), d = im.data;
    for (let i = 0; i < n * n; i++) { const o = i * 4, light = r.next() < 0.5; d[o] = light ? 255 : 60; d[o + 1] = light ? 250 : 36; d[o + 2] = light ? 235 : 20; d[o + 3] = (r.next() * (light ? 22 : 20)) | 0; }
    x.putImageData(im, 0, 0); x.lineCap = 'round';
    for (let i = 0; i < 520; i++) { // short curved fibres
      const px = r.next() * n, py = r.next() * n, a = r.range(-0.6, 0.6) + (r.chance(0.3) ? Math.PI / 2 : 0), l = r.range(3, 11);
      x.strokeStyle = r.chance(0.55) ? 'rgba(255,248,230,0.22)' : 'rgba(70,40,20,0.16)'; x.lineWidth = r.range(0.5, 1.1);
      x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a) * l * 0.5 + r.range(-1, 1), py + Math.sin(a) * l * 0.5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
    }
    GRAIN = c;
  }
  function applyGrain(x, w, h, k) {
    x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-atop'; x.globalAlpha = k;
    x.fillStyle = x.createPattern(GRAIN, 'repeat'); grainN++; x.translate((grainN * 97) % 256, (grainN * 61) % 256);
    x.fillRect(-256, -256, w + 256, h + 256); x.restore();
  }
  function applyLight(x, w, h, a) {
    x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-atop';
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, 'rgba(255,250,232,' + a + ')'); g.addColorStop(0.45, 'rgba(255,250,232,0)'); g.addColorStop(1, 'rgba(50,25,10,' + a * 1.2 + ')');
    x.fillStyle = g; x.fillRect(0, 0, w, h); x.restore();
  }
  /** A cut paper piece. draw(x) in world units, pivot (0,0) inside bbox. -> {img, ox, oy, sh, shPad} */
  function mkPart(bb, draw, o) {
    o = o || {};
    const rim = o.rim === undefined ? 0.55 : o.rim, c = cv((bb[2] - bb[0]) * K + 4, (bb[3] - bb[1]) * K + 4), x = g2(c);
    x.setTransform(K, 0, 0, K, -bb[0] * K + 2, -bb[1] * K + 2); x.lineJoin = 'round'; x.lineCap = 'round';
    draw(x);
    let img = c, ox = -bb[0] * K + 2, oy = -bb[1] * K + 2;
    if (rim > 0) { const d = dilate(c, rim * K, o.rimColor || C.rim); g2(d.c).drawImage(c, d.pad, d.pad); img = d.c; ox += d.pad; oy += d.pad; }
    if (o.grain !== false) applyGrain(g2(img), img.width, img.height, o.grain || 1);
    if (o.light !== false) applyLight(g2(img), img.width, img.height, o.light || 0.1);
    const s = softShadow(img, (o.shBlur || 0.35) * K);
    return { img, ox, oy, sh: s.c, shPad: s.pad };
  }
  /** brass split pin (always lit from top-left) */
  function drawPin(x, px, py, r) {
    x.fillStyle = 'rgba(48,26,12,0.35)'; x.beginPath(); x.arc(px + 0.18, py + 0.24, r * 1.05, 0, TAU); x.fill();
    const g = x.createRadialGradient(px - r * 0.35, py - r * 0.35, r * 0.1, px, py, r);
    g.addColorStop(0, C.brassLight); g.addColorStop(0.45, C.brass); g.addColorStop(1, C.brassDark);
    x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(90,60,20,0.55)'; x.lineWidth = 0.12; x.beginPath(); x.moveTo(px - r * 0.55, py + r * 0.1); x.lineTo(px + r * 0.55, py - r * 0.1); x.stroke();
  }
  /** Puppet frame: parts {p,x,y,r,sh,pin:[px,py,r]} at pivots (feet at footX/footY). Each part casts a shadow on the parts below. */
  function composeFrame(fw, fh, footX, footY, facing, list, shx, shy) {
    const c = cv(fw * K, fh * K), x = g2(c), pins = [];
    for (const it of list) {
      const p = it.p;
      const place = (dx, dy) => { x.setTransform(K, 0, 0, K, (footX + dx) * K, (footY + dy) * K); x.scale(facing, 1); x.translate(it.x, it.y); if (it.r) x.rotate(it.r); };
      if (it.sh !== 0) { place(shx || 0.42, shy || 0.55); x.globalAlpha = it.sh === undefined ? 0.34 : it.sh; x.drawImage(p.sh, (-p.ox - p.shPad) / K, (-p.oy - p.shPad) / K, p.sh.width / K, p.sh.height / K); }
      place(0, 0); x.globalAlpha = 1;
      x.drawImage(p.img, -p.ox / K, -p.oy / K, p.img.width / K, p.img.height / K);
      if (it.pin) { const m = x.getTransform(); pins.push([(m.a * it.pin[0] + m.c * it.pin[1] + m.e) / K, (m.b * it.pin[0] + m.d * it.pin[1] + m.f) / K, it.pin[2]]); }
    }
    x.setTransform(K, 0, 0, K, 0, 0);
    for (const q of pins) drawPin(x, q[0], q[1], q[2]);
    return c;
  }
  /** whole-puppet drop shadow offset right-down (0.9, 1.1 wu, blur 0.7 wu, alpha 0.3) + white hit-flash copy */
  function dropSprite(frame, footX, footY, o) {
    o = o || {};
    const ox = o.dx || 0.9, oy = o.dy || 1.1, blur = (o.blur || 0.7) * K, pad = Math.ceil(blur * 2.5 + Math.max(ox, oy) * K) + 2;
    const c = cv(frame.width + pad * 2, frame.height + pad * 2), x = g2(c);
    x.globalAlpha = o.alpha === undefined ? 0.3 : o.alpha; blurInto(x, sil(frame, SH), pad + ox * K, pad + oy * K, blur);
    x.globalAlpha = 1; x.drawImage(frame, pad, pad);
    return { img: c, ax: footX * K + pad, ay: footY * K + pad };
  }
  function blit(ctx, s, x, y, sc) { const k = (sc || 1) / K; ctx.drawImage(s.img, x - s.ax * k, y - s.ay * k, s.img.width * k, s.img.height * k); }
  function blitPart(ctx, p, x, y, sc, shA) {
    const k = sc / K;
    if (shA) { ctx.globalAlpha = shA; ctx.drawImage(p.sh, x + 0.5 - (p.ox + p.shPad) * k, y + 0.7 - (p.oy + p.shPad) * k, p.sh.width * k, p.sh.height * k); ctx.globalAlpha = 1; }
    ctx.drawImage(p.img, x - p.ox * k, y - p.oy * k, p.img.width * k, p.img.height * k);
  }

  /* ---------- shared cut shapes ---------- */
  function leafPath(x, type, len, wid) {
    const hl = len / 2; x.beginPath();
    if (type === 1) { for (let i = 0; i <= 60; i++) { const th = (i / 60) * TAU; let R = hl * (0.6 + 0.4 * Math.pow(Math.abs(Math.cos(th * 2.5)), 0.7)); if (th > 2.75 && th < 3.55) R *= 0.6; x.lineTo(Math.cos(th) * R, Math.sin(th) * R); } }
    else for (let s = 0; s < 2; s++) for (let i = 0; i <= 30; i++) {
      const t = s === 0 ? -1 + i / 15 : 1 - i / 15;
      let hw = (wid / 2) * Math.sqrt(Math.max(0, 1 - t * t)) * (1 - 0.22 * t);
      if (type === 2) hw *= 0.74 + 0.26 * Math.cos(t * Math.PI * 3.5);
      x.lineTo(t * hl, (s === 0 ? -1 : 1) * hw);
    }
    x.closePath();
  }
  /** cut paper leaf: flat fill, shaded lower half, light midrib fold, darker veins, stem */
  function drawPaperLeaf(x, type, len, wid, col) {
    leafPath(x, type, len, wid); x.fillStyle = col; x.fill();
    x.save(); x.clip();
    x.fillStyle = 'rgba(60,20,10,0.16)'; x.fillRect(-len, 0, len * 2, len);
    x.strokeStyle = 'rgba(255,235,200,0.45)'; x.lineWidth = len * 0.035; x.beginPath(); x.moveTo(-len / 2, 0); x.lineTo(len / 2, 0); x.stroke();
    x.strokeStyle = 'rgba(60,20,10,0.16)'; x.lineWidth = len * 0.025; x.beginPath();
    for (let i = -2; i <= 2; i++) { const u = (i / 3) * len * 0.4; x.moveTo(u, 0); x.lineTo(u + len * 0.12, -wid * 0.36); x.moveTo(u, 0); x.lineTo(u + len * 0.12, wid * 0.36); }
    x.stroke(); x.restore();
    if (type !== 1) { x.strokeStyle = shade(col, 0.7); x.lineWidth = len * 0.04; x.beginPath(); x.moveTo(-len / 2, 0); x.lineTo(-len / 2 - len * 0.16, len * 0.04); x.stroke(); }
  }
  function turnipPath(x, w, h) {
    x.beginPath(); x.moveTo(0, -h);
    x.bezierCurveTo(w * 0.68, -h, w * 1.05, -h * 0.7, w, -h * 0.4); x.bezierCurveTo(w * 0.95, -h * 0.15, w * 0.4, -h * 0.04, w * 0.04, h * 0.1);
    x.bezierCurveTo(-w * 0.4, -h * 0.04, -w * 0.95, -h * 0.15, -w, -h * 0.4); x.bezierCurveTo(-w * 1.05, -h * 0.7, -w * 0.68, -h, 0, -h); x.closePath();
  }
  /** torn colour cap: shadow strip, white paper core, then the coloured layer above a jagged line */
  function tornCap(x, r, x0, x1, y, top, col, coreW) {
    const pts = []; for (let px = x0; px <= x1 + 0.01; px += 1.1) pts.push([px, y + r.range(-0.45, 0.45) + Math.sin(px * 0.45) * 0.5]);
    const poly = (dy) => { x.beginPath(); x.moveTo(pts[0][0], top); for (const p of pts) x.lineTo(p[0], p[1] + dy); x.lineTo(pts[pts.length - 1][0], top); x.closePath(); };
    x.fillStyle = 'rgba(48,26,12,0.22)'; poly(coreW + 0.35); x.fill();
    x.fillStyle = C.rim; poly(coreW); x.fill();
    x.fillStyle = col; poly(0); x.fill();
  }
  /** cut-out hole with glowing paper behind; dark cut edge shows at top-left */
  function glowHole(x, path, gx, gy, gr, hot, mid, edge) {
    x.save(); path(); x.clip();
    x.fillStyle = '#3a1408'; x.fillRect(gx - gr * 3, gy - gr * 3, gr * 6, gr * 6);
    x.translate(0.32, 0.45);
    const g = x.createRadialGradient(gx, gy, 0, gx, gy, gr * 1.5); g.addColorStop(0, hot); g.addColorStop(0.5, mid); g.addColorStop(1, edge);
    x.fillStyle = g; path(); x.fill(); x.restore();
  }
  const leafUp = (len, wid, col, type) => mkPart([-wid, -len - 1.5, wid, 1.5], (x) => { x.rotate(-Math.PI / 2); x.translate(len / 2, 0); drawPaperLeaf(x, type, len, wid, col); }, { rim: 0.45 });

  /* ---------- hero: paper puppet (pumpkin head, aubergine tunic, felt scarf, brass pin at the shoulder) ---------- */
  const SPR = {};
  function buildHero() {
    const leg = (dk) => mkPart([-2.2, -0.8, 4, 7.6], (x) => {
      x.fillStyle = dk ? '#6f4c30' : '#8d6440'; x.beginPath(); x.moveTo(-1.45, -0.2); x.lineTo(1.45, -0.2); x.lineTo(1.25, 4.9); x.lineTo(-1.35, 4.9); x.closePath(); x.fill();
      x.fillStyle = dk ? C.bootDark : C.boot; x.beginPath(); x.moveTo(-1.55, 4.4); x.lineTo(1.3, 4.4); x.quadraticCurveTo(3.5, 4.9, 3.4, 6.6); x.lineTo(-1.55, 6.6); x.closePath(); x.fill();
      x.fillStyle = 'rgba(255,240,210,0.28)'; x.fillRect(-1.55, 4.4, 2.85, 0.45);
    }, { rim: 0.45 });
    const body = mkPart([-6, -10.6, 6.2, 3], (x) => {
      const path = () => { x.beginPath(); x.moveTo(-3.3, -9.5); x.lineTo(3.4, -9.5); x.quadraticCurveTo(4.7, -4, 5, 1.1); for (let i = 0; i <= 7; i++) x.lineTo(5 - (10 * i) / 7, 1.1 + (i % 2 ? 1 : 0)); x.quadraticCurveTo(-4.7, -4, -3.3, -9.5); x.closePath(); };
      path(); x.fillStyle = C.aub; x.fill(); x.save(); path(); x.clip();
      x.fillStyle = 'rgba(30,10,30,0.25)'; x.beginPath(); x.moveTo(0.9, -9.5); x.lineTo(3.9, -9.5); x.lineTo(5.6, 2.4); x.lineTo(1.6, 2.4); x.closePath(); x.fill();
      x.fillStyle = C.aubLight; x.beginPath(); x.moveTo(0.6, -9.6); x.lineTo(3.7, -9.6); x.lineTo(5.4, 2.4); x.lineTo(1.3, 2.4); x.closePath(); x.fill();
      x.fillStyle = 'rgba(40,15,10,0.25)'; x.fillRect(-6, -2.2, 12, 1.9); x.fillStyle = C.kraftDark; x.fillRect(-6, -2.5, 12, 1.7);
      x.fillStyle = C.brass; x.fillRect(1.6, -2.75, 2.1, 2.2); x.fillStyle = C.kraftDark; x.fillRect(2.15, -2.2, 1, 1.1);
      x.strokeStyle = 'rgba(250,236,210,0.7)'; x.lineWidth = 0.2; x.setLineDash([0.55, 0.45]); x.beginPath(); x.moveTo(-4.6, -0.2); x.lineTo(4.6, -0.2); x.stroke(); x.setLineDash([]);
      x.restore();
      for (const by of [-7.4, -5]) { x.fillStyle = 'rgba(40,15,10,0.35)'; x.beginPath(); x.arc(2.75, by + 0.2, 0.62, 0, TAU); x.fill(); x.fillStyle = C.mustard; x.beginPath(); x.arc(2.6, by, 0.6, 0, TAU); x.fill(); }
    });
    const arm = (dk) => mkPart([-2, -1.2, 2.2, 8.4], (x) => {
      x.fillStyle = dk ? C.aubDark : C.aub; x.beginPath(); x.moveTo(-1.25, -0.6); x.quadraticCurveTo(0, -1.2, 1.25, -0.6); x.lineTo(1.05, 5.4); x.lineTo(-1.05, 5.4); x.closePath(); x.fill();
      x.fillStyle = dk ? '#5f4a2c' : C.mustard; x.fillRect(-1.15, 4.5, 2.3, 1);
      x.fillStyle = dk ? '#c9b48c' : '#ecdcb8'; x.beginPath(); x.ellipse(0.15, 6.6, 1.35, 1.45, 0, 0, TAU); x.fill();
    }, { rim: 0.45 });
    const head = mkPart([-10, -16.5, 10.5, 1.2], (x) => {
      const cy = -7.6;
      for (const [ox, rx, ry, col] of [[0, 8.7, 7.5, C.pumpkinDeep], [-3.6, 5.2, 7.1, C.pumpkinDark], [3.9, 5, 7.15, C.pumpkin], [0.9, 4.6, 7.35, C.pumpkinLight]]) {
        x.fillStyle = 'rgba(70,25,5,0.28)'; x.beginPath(); x.ellipse(ox + 0.3, cy + 0.4, rx, ry, 0, 0, TAU); x.fill();   // each lobe = separate layer with its own shadow
        x.fillStyle = col; x.beginPath(); x.ellipse(ox, cy, rx, ry, 0, 0, TAU); x.fill();
      }
      const fx = 1.7, P = (pts) => () => { x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(fx + a, cy + b) : x.moveTo(fx + a, cy + b))); x.closePath(); };
      const holes = [P([[-4.9, -0.1], [-2.7, -4.4], [-0.6, -0.2]]), P([[0.6, -0.2], [2.7, -4.4], [4.8, -0.1]]), P([[-0.7, 1.3], [0, 0.1], [0.7, 1.3]]),
        P([[-5, 1.9], [0, 2.9], [5, 1.9], [4.4, 3.6], [3.1, 3.1], [2.2, 4.2], [1.1, 3.5], [-0.6, 5.3], [-1.6, 4], [-2.9, 4.5], [-3.8, 3.4], [-4.6, 3.5]])];
      for (const p of holes) glowHole(x, p, fx, cy + 0.5, 6.5, '#fffbe0', '#ffe066', '#ffa21e');
    });
    const stem = mkPart([-3, -6, 6, 1.4], (x) => {
      x.fillStyle = '#5f6e30'; x.beginPath(); x.moveTo(-1.1, 0.8); x.lineTo(-0.7, -3.4); x.quadraticCurveTo(0.5, -5, 2, -4.2); x.lineTo(1.2, 0.8); x.closePath(); x.fill();
      x.strokeStyle = '#7c9a40'; x.lineWidth = 0.4; x.beginPath(); x.moveTo(1.2, -1.6); x.bezierCurveTo(3.6, -1.8, 4.6, -4.2, 3.2, -4.6); x.stroke();
    }, { rim: 0.4 });
    const stripes = (x, k0, k1) => { x.save(); x.clip(); x.fillStyle = C.leafDark; for (let k = k0; k < k1; k += 2.4) { x.beginPath(); x.moveTo(k, -2.5); x.lineTo(k + 1, -2.5); x.lineTo(k + 2.4, 3); x.lineTo(k + 1.4, 3); x.closePath(); x.fill(); } x.restore(); };
    const wrap = mkPart([-5.6, -2, 6.2, 2.8], (x) => {
      x.beginPath(); x.moveTo(-4.8, -0.9); x.quadraticCurveTo(0, 0.2, 5, -1); x.lineTo(5.3, 1.4); x.quadraticCurveTo(0, 2.6, -4.9, 1.2); x.closePath(); x.fillStyle = C.leaf; x.fill(); stripes(x, -6, 7);
      x.fillStyle = C.leafLight; x.beginPath(); x.ellipse(3.4, 0.6, 1.35, 1.15, 0, 0, TAU); x.fill();
    }, { rim: 0.45 });
    const tail = mkPart([-11, -2.4, 1.5, 3.6], (x) => {
      x.beginPath(); x.moveTo(0.6, -1.1); x.quadraticCurveTo(-4.5, -1.6, -8.6, 0.1); x.lineTo(-8.4, 2.5); x.quadraticCurveTo(-4.4, 1.2, 0.6, 1.3); x.closePath(); x.fillStyle = C.leaf; x.fill(); stripes(x, -9, 1);
    }, { rim: 0.4 });
    const legB = leg(true), legF = leg(false), armB = arm(true), armF = arm(false);
    const frame = (fc, ph) => {
      const s = Math.sin(ph), legA = s * 0.55, hip = -6.6 + (1 - Math.cos(legA)) * 6.6 - Math.abs(Math.cos(ph)) * 0.45, lean = 0.07;
      const sh = hip - 8.9, neck = hip - 9.6, tilt = Math.sin(ph * 2) * 0.06, tailA = -0.25 + Math.sin(ph * 2) * 0.18;
      const f = composeFrame(34, 42, 17, 38, fc, [
        { p: legB, x: -0.9, y: hip, r: legA }, { p: armB, x: -2.4 + lean * 9, y: sh + 0.4, r: s * 0.5 }, { p: tail, x: -0.6 + lean * 10, y: neck + 0.9, r: tailA },
        { p: legF, x: 0.9, y: hip, r: -legA }, { p: body, x: 0, y: hip, r: lean }, { p: armF, x: 2.6 + lean * 9, y: sh + 0.4, r: -s * 0.55, pin: [0, 0, 0.5] },
        { p: stem, x: 0.6 + lean * 10, y: neck - 14.6, r: tilt * 2 + 0.05 }, { p: head, x: 0.4 + lean * 10, y: neck, r: tilt }, { p: wrap, x: 0.4 + lean * 10, y: neck + 0.1, r: tilt * 0.5 },
      ]); return dropSprite(f, 17, 38);
    };
    SPR.hero = { 1: [], '-1': [] }; for (const fc of [1, -1]) for (let i = 0; i < 8; i++) SPR.hero[fc].push(frame(fc, (i / 8) * TAU));
  }

  /* ---------- small enemy: turnip creeper (cream bulb, torn aubergine cap, glowing cut eyes) ---------- */
  function buildCreeper() {
    const W = 7.4, H = 15.2, r = rng(1300);
    const bulb = mkPart([-W - 1.5, -H - 1.5, W + 1.5, 3], (x) => {
      turnipPath(x, W, H); const g = x.createLinearGradient(0, -H, 0, 1); g.addColorStop(0, '#efe2b8'); g.addColorStop(1, '#dcc68a'); x.fillStyle = g; x.fill();
      x.save(); turnipPath(x, W, H); x.clip(); tornCap(x, r, -W - 1, W + 1, -H * 0.6, -H - 2, C.aub, 0.55);
      x.strokeStyle = rgba(C.aubLight, 0.5); x.lineWidth = 0.5;
      for (let i = 0; i < 4; i++) { const yy = -H + 2 + i * 1.3; x.beginPath(); x.moveTo(-W * 0.6 + i, yy); x.quadraticCurveTo(-1, yy - 0.8, W * 0.3 - i * 0.6, yy - 0.2); x.stroke(); }
      x.strokeStyle = 'rgba(120,90,50,0.35)'; x.lineWidth = 0.18; for (const yy of [-4.4, -2.6]) { x.beginPath(); x.moveTo(-W * 0.7, yy); x.quadraticCurveTo(0, yy + 1.1, W * 0.7, yy); x.stroke(); }
      x.restore();
      const fx = 1.9, ey = -H * 0.46, eye = (cx, f) => () => { x.beginPath(); x.moveTo(cx - 1.5 * f, ey - 0.9); x.quadraticCurveTo(cx, ey + 1.6, cx + 1.5 * f, ey - 0.1); x.closePath(); };
      glowHole(x, eye(fx - 2.4, 1), fx - 2.4, ey, 2, '#fff2a0', '#ffb02e', '#e0561c'); glowHole(x, eye(fx + 2.4, -1), fx + 2.4, ey, 2, '#fff2a0', '#ffb02e', '#e0561c');
      x.fillStyle = '#2a1424'; x.beginPath(); x.ellipse(fx - 2.1, ey + 0.1, 0.32, 0.6, 0, 0, TAU); x.ellipse(fx + 2.1, ey + 0.1, 0.32, 0.6, 0, 0, TAU); x.fill();
      for (const [col, d] of [['rgba(30,10,25,0.35)', 0.3], [C.aubDeep, 0]]) { // angry brows: paper strips with their own shadow
        x.fillStyle = col; for (const f of [-1, 1]) { x.beginPath(); x.moveTo(fx + f * 4.3 + d, ey - 2.3 + d); x.lineTo(fx + f * 0.6 + d, ey - 0.9 + d); x.lineTo(fx + f * 0.7 + d, ey - 0.1 + d); x.lineTo(fx + f * 4.4 + d, ey - 1.5 + d); x.closePath(); x.fill(); }
      }
      x.fillStyle = '#3a1830'; x.beginPath(); [[-2.2, 3.4], [-1.1, 2.6], [0, 3.1], [1.1, 2.6], [2.2, 3.4], [1.1, 3.2], [0, 3.6], [-1.1, 3.2]].forEach(([a, b]) => x.lineTo(fx + a, ey + b)); x.closePath(); x.fill();
    });
    const root = (dk) => mkPart([-1.6, -0.6, 2.4, 6], (x) => { x.beginPath(); x.moveTo(-0.85, 0); x.quadraticCurveTo(-0.7, 3, 0.2, 4.6); x.quadraticCurveTo(1.4, 5.4, 1.9, 4.6); x.quadraticCurveTo(1.1, 4.6, 0.75, 3.6); x.quadraticCurveTo(0.6, 2, 0.85, 0); x.closePath(); x.fillStyle = dk ? '#b9a173' : '#d8c194'; x.fill(); }, { rim: 0.4 });
    const armP = mkPart([-1, -0.8, 4.4, 3.6], (x) => { x.beginPath(); x.moveTo(0, -0.45); x.quadraticCurveTo(2.2, -0.3, 3.4, 1.2); x.lineTo(3.9, 0.8); x.lineTo(3.6, 2.1); x.lineTo(2.7, 1.9); x.quadraticCurveTo(1.8, 0.6, 0, 0.5); x.closePath(); x.fillStyle = '#cfb889'; x.fill(); }, { rim: 0.35 });
    const lv = [leafUp(9, 4.2, C.leaf, 0), leafUp(10.5, 4.6, C.leafDark, 2), leafUp(8, 3.8, C.leafLight, 0)], rB = root(true), rF = root(false);
    SPR.creeper = { 1: [], '-1': [] }; for (const fc of [1, -1]) for (let i = 0; i < 6; i++) {
      const ph = (i / 6) * TAU, s = Math.sin(ph), wob = s * 0.12, by = -4.2 - Math.abs(Math.cos(ph)) * 0.9, cx = Math.sin(wob) * H, cy = by - Math.cos(wob) * H, sway = Math.sin(ph * 2 + 0.6) * 0.12;
      SPR.creeper[fc].push(dropSprite(composeFrame(30, 36, 15, 32, fc, [
        { p: rB, x: -1.8, y: by + 0.2, r: s * 0.5 }, { p: armP, x: -W + 0.4, y: by - 7, r: Math.PI - 0.4 - s * 0.3, sh: 0.25 },
        { p: lv[1], x: cx - 0.6, y: cy + 0.8, r: -0.55 + sway + wob }, { p: lv[2], x: cx + 0.6, y: cy + 0.8, r: 0.6 + sway + wob },
        { p: rF, x: 1.8, y: by + 0.2, r: -s * 0.5 }, { p: bulb, x: 0, y: by, r: wob }, { p: lv[0], x: cx, y: cy + 1.2, r: 0.05 + sway * 1.4 + wob, pin: [0, 0, 0.5] },
        { p: armP, x: W - 0.6, y: by - 6.4, r: 0.35 + s * 0.35, pin: [0.3, 0, 0.42] },
      ]), 15, 32));
    }
  }

  /* ---------- fast enemy: tissue-paper ghost (two translucent sheets, white translucent rim) ---------- */
  function buildGhost() {
    const shape = (x, R, cy, w, lean) => {
      x.beginPath(); x.moveTo(-R, cy); x.arc(0, cy, R, Math.PI, 0); x.bezierCurveTo(R + 0.3, cy + 5, R + 1.1, cy + 8, R + 0.4 + lean + Math.sin(w) * 0.6, cy + 12.5);
      for (let i = 0; i < 4; i++) { x.lineTo(R * (1 - (2 * (i + 0.5)) / 4) * 0.95 + lean + Math.sin(w + i * 1.3) * 0.9, cy + 14.2 + (i % 2) * 1.3); if (i < 3) x.lineTo(R * (1 - (2 * (i + 1)) / 4) * 0.9 + lean * 0.8, cy + 10.2 + Math.cos(w + i) * 0.5); }
      x.lineTo(-R - 0.4 + lean, cy + 12.5); x.bezierCurveTo(-R - 1.1, cy + 8, -R - 0.3, cy + 5, -R, cy); x.closePath();
    };
    SPR.ghost = [];
    for (let i = 0; i < 6; i++) {
      const ph = (i / 6) * TAU;
      const p = mkPart([-12, -27, 13, 2], (x) => {
        shape(x, 7.2, -17.5, ph, -1.2); x.fillStyle = 'rgba(188,212,232,0.62)'; x.fill();
        x.beginPath(); x.moveTo(3, -13.5); x.quadraticCurveTo(7, -14.2, 10.6, -13.2 + Math.sin(ph) * 0.9); x.lineTo(11.8, -11.8 + Math.sin(ph) * 0.9); x.quadraticCurveTo(7, -12, 3, -11.5); x.closePath(); x.fillStyle = 'rgba(232,240,248,0.8)'; x.fill();
        x.save(); x.translate(0.6, 0.4); x.scale(0.86, 0.9); shape(x, 7.2, -18.5, ph + 1.7, -0.8); x.fillStyle = 'rgba(248,251,253,0.72)'; x.fill(); x.restore();
        x.fillStyle = 'rgba(43,36,64,0.88)'; x.beginPath(); x.ellipse(-0.6, -18.6, 1.35, 2.05, 0.25, 0, TAU); x.fill(); x.beginPath(); x.ellipse(4.1, -18.6, 1.35, 2.05, -0.25, 0, TAU); x.fill();
        x.beginPath(); x.ellipse(1.9, -13.4, 1.45, 2.5 + Math.sin(ph) * 0.3, 0, 0, TAU); x.fill();
        x.fillStyle = 'rgba(160,190,230,0.75)'; x.beginPath(); x.arc(-0.3, -19.3, 0.36, 0, TAU); x.arc(4.4, -19.3, 0.36, 0, TAU); x.fill();
      }, { rim: 0.35, rimColor: 'rgba(255,255,255,0.75)', grain: 0.7, light: 0.06, shBlur: 0.5 });
      SPR.ghost.push(dropSprite(composeFrame(30, 32, 15, 29, 1, [{ p, x: 0, y: 0, sh: 0.18 }]), 15, 29, { alpha: 0.001 }));
    }
  }

  /* ---------- props + pickups ---------- */
  /** projected cast shadow of an upright cut-out: skewed silhouette, blurred, darker at the foot */
  function castShadow(spr, kx, ky) {
    const src = spr.img, fx = spr.ax, fy = spr.ay, blur = 1.4 * K, pad = Math.ceil(blur * 2.5) + 4, w = src.width + fy * kx + pad * 2, h = fy * ky + pad * 2 + 12;
    const t = cv(w, h), x = g2(t); x.setTransform(1, 0, -kx, -ky, kx * fy + pad, ky * fy + pad + 6); x.drawImage(sil(src, '#000'), 0, 0); x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = 'destination-in'; const g = x.createLinearGradient(0, pad + 6, 0, h); g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,0.45)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    const c = cv(w, h); blurInto(g2(c), sil(t, SH), 0, 0, blur);
    return { img: c, ax: fx + pad, ay: pad + 6 };
  }
  function scallop(x, rx, ry, n, depth, rot) { x.beginPath(); for (let i = 0; i < n; i++) { const a0 = rot + (i / n) * TAU, a1 = rot + ((i + 0.5) / n) * TAU, a2 = rot + ((i + 1) / n) * TAU; if (!i) x.moveTo(Math.cos(a0) * rx, Math.sin(a0) * ry); x.quadraticCurveTo(Math.cos(a1) * rx * (1 + depth), Math.sin(a1) * ry * (1 + depth), Math.cos(a2) * rx, Math.sin(a2) * ry); } x.closePath(); }
  function buildProps() {
    const r = rng(500), tab = mkPart([-9, -3.6, 9, 0.8], (x) => { x.beginPath(); x.moveTo(-8, 0.3); x.lineTo(8, 0.3); x.lineTo(6, -3); x.lineTo(-6, -3); x.closePath(); x.fillStyle = C.kraftLight; x.fill(); }, { rim: 0.3, light: 0.05 });
    const trunk = mkPart([-12, -43, 12, 1], (x) => {
      x.beginPath(); x.moveTo(-3, 0); x.quadraticCurveTo(-1.9, -20, -1.6, -40); x.lineTo(1.6, -40); x.quadraticCurveTo(1.9, -20, 3, 0); x.closePath();
      for (const [by, d, l, up] of [[22, -1, 8, 6], [28, 1, 7, 5]]) { x.moveTo(d * 1.3, -by); x.quadraticCurveTo(d * l * 0.6, -by - up * 0.3, d * l, -by - up); x.lineTo(d * l + d * 0.2, -by - up + 1.4); x.quadraticCurveTo(d * l * 0.5, -by + 1.4, d * 1.3, -by + 2.4); x.closePath(); }
      x.fillStyle = '#76503a'; x.fill(); x.save(); x.clip(); x.fillStyle = 'rgba(30,15,5,0.2)'; x.fillRect(0, -43, 12, 44); x.restore();
    });
    const crown = (rx, ry, col, n, d) => { const rot = r.next() * TAU; return mkPart([-rx - 3, -ry - 3, rx + 3, ry + 3], (x) => { scallop(x, rx, ry, n, d, rot); x.fillStyle = col; x.fill(); x.save(); x.clip(); x.fillStyle = 'rgba(40,15,5,0.12)'; x.translate(rx * 0.25, ry * 0.3); scallop(x, rx * 0.85, ry * 0.8, n, d, rot); x.fill(); x.restore(); }, { rim: 0.6 }); };
    const tree = { img: composeFrame(60, 82, 30, 78, 1, [{ p: tab, x: 0, y: 0, sh: 0 }, { p: trunk, x: 0, y: 0, sh: 0.3 }, { p: crown(21, 17, '#9a6a2a', 11, 0.18), x: 0, y: -52 }, { p: crown(16, 13, '#c8962e', 9, 0.2), x: -4.5, y: -50 }, { p: crown(11, 9, '#e2be5a', 8, 0.22), x: 5, y: -46, pin: [0, 0, 0.75] }], 0.55, 0.7), ax: 30 * K, ay: 78 * K };
    tree.shadow = castShadow(tree, 0.42, 0.26); SPR.tree = tree;
    const cols = [C.pumpkinDeep, C.pumpkinDark, C.pumpkin, C.pumpkinLight];
    const pBody = mkPart([-11, -16, 11, 1], (x) => { [9.5, 7.8, 5.9, 3.8, 1.7].forEach((rx, i) => { x.beginPath(); x.ellipse(0, -7.4, rx, 7.4 - (4 - i) * 0.12, 0, 0, TAU); x.fillStyle = cols[Math.min(3, i % 2 === 0 ? (i >> 1) + 1 : i >> 1)]; x.fill(); x.strokeStyle = 'rgba(80,30,10,0.25)'; x.lineWidth = 0.22; x.stroke(); }); });
    const pStem = mkPart([-3, -5, 4, 1], (x) => { x.beginPath(); x.moveTo(-1, 0.5); x.lineTo(-0.6, -3.4); x.quadraticCurveTo(0.6, -4.6, 1.8, -3.6); x.lineTo(1.1, 0.5); x.closePath(); x.fillStyle = '#6a7a38'; x.fill(); }, { rim: 0.4 });
    const pk = { img: composeFrame(26, 22, 13, 19, 1, [{ p: pStem, x: 0, y: -14.2 }, { p: pBody, x: 0, y: 0 }], 0.55, 0.7), ax: 13 * K, ay: 19 * K };
    pk.shadow = castShadow(pk, 0.42, 0.26); SPR.pumpkin = pk;
    const gem = (sc, c4) => mkPart([-3.2 * sc, -4.2 * sc, 3.2 * sc, 4.2 * sc], (x) => { // origami foil gem: 4 facets
      const w = 2.4 * sc, h = 3.4 * sc, T = [0, -h], R = [w, -h * 0.12], B = [0, h], L = [-w, -h * 0.12], M = [w * 0.1, -h * 0.05];
      [[T, L, M], [T, M, R], [L, B, M], [M, B, R]].forEach((tr, i) => { x.beginPath(); tr.forEach((p) => x.lineTo(p[0], p[1])); x.closePath(); x.fillStyle = c4[i]; x.fill(); });
      x.fillStyle = 'rgba(255,255,255,0.75)'; x.beginPath(); x.moveTo(-w * 0.55, -h * 0.25); x.lineTo(-w * 0.15, -h * 0.72); x.lineTo(-w * 0.05, -h * 0.55); x.closePath(); x.fill();
    }, { rim: 0.35, grain: 0.4, light: 0.04 });
    SPR.gem = gem(1, ['#bff3e8', '#5cc3b2', '#36a596', '#1d6d68']); SPR.gemBig = gem(1.55, ['#fff1a6', '#f0c64a', '#d39a2a', '#9a6a18']);
    SPR.seed = mkPart([-4, -3, 4.6, 3], (x) => { x.beginPath(); x.moveTo(-3, 0); x.bezierCurveTo(-3, -2.3, 2, -2.2, 3.5, 0); x.bezierCurveTo(2, 2.2, -3, 2.3, -3, 0); x.closePath(); x.fillStyle = '#f4e8c6'; x.fill(); x.fillStyle = 'rgba(255,255,245,0.8)'; x.beginPath(); x.ellipse(-0.4, -0.6, 2.2, 0.7, 0, 0, TAU); x.fill(); }, { rim: 0.35, rimColor: '#8a5a24', light: 0.06 });
    SPR.button = mkPart([-2.6, -2.6, 2.6, 2.6], (x) => { x.beginPath(); x.arc(0, 0, 1.9, 0, TAU); x.fillStyle = C.red; x.fill(); x.strokeStyle = shade(C.red, 0.75); x.lineWidth = 0.28; x.beginPath(); x.arc(0, 0, 1.4, 0, TAU); x.stroke(); x.fillStyle = 'rgba(40,20,15,0.55)'; for (const h of [-0.45, 0.45]) { x.beginPath(); x.arc(h, 0, 0.2, 0, TAU); x.fill(); } }, { rim: 0, grain: 0.5 });
    SPR.flower = mkPart([-3.2, -3.2, 3.2, 3.2], (x) => { for (let k = 0; k < 5; k++) { x.save(); x.rotate(0.3 + (k / 5) * TAU); x.beginPath(); x.ellipse(1.45, 0, 1.35, 0.95, 0, 0, TAU); x.fillStyle = '#e8b84a'; x.fill(); x.restore(); } x.beginPath(); x.arc(0, 0, 0.85, 0, TAU); x.fillStyle = C.aub; x.fill(); }, { rim: 0 });
    SPR.glow = cv(96, 96); const gx = g2(SPR.glow), gg = gx.createRadialGradient(48, 48, 0, 48, 48, 48);
    [[0, 'rgba(255,214,110,0.95)'], [0.25, 'rgba(255,170,60,0.45)'], [0.6, 'rgba(240,110,30,0.12)'], [1, 'rgba(240,110,30,0)']].forEach(([o, c]) => gg.addColorStop(o, c)); gx.fillStyle = gg; gx.fillRect(0, 0, 96, 96);
  }

  /* ---------- ground: stacked material sheets (kraft < cardboard < felt < moss < leaf carpet < newsprint) ---------- */
  function tile(n, base, paint) { const c = cv(n, n), x = g2(c); x.fillStyle = base; x.fillRect(0, 0, n, n); paint(x, rng(n + base.length * 7)); return c; }
  function fibres(x, r, n, lo, hi, light, dark, horiz) { x.lineCap = 'round'; for (let i = 0; i < n; i++) { const px = r.next() * 256, py = r.next() * 256, a = horiz ? r.range(-0.45, 0.45) : r.next() * Math.PI, l = r.range(lo, hi); x.strokeStyle = r.chance(0.5) ? light : dark; x.lineWidth = r.range(0.6, 1.3); x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a) * l * 0.5 + 1, py + Math.sin(a) * l * 0.5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); } }
  function specks(x, r, n, col) { x.fillStyle = col; for (let i = 0; i < n; i++) { x.beginPath(); x.arc(r.next() * 256, r.next() * 256, r.range(0.4, 0.9), 0, TAU); x.fill(); } }
  function mottle(x, r, n, a) { for (let i = 0; i < n; i++) { const px = r.next() * 256, py = r.next() * 256, rr = r.range(20, 60), g = x.createRadialGradient(px, py, 0, px, py, rr), c = r.chance(0.5) ? '255,240,215' : '60,36,16'; g.addColorStop(0, 'rgba(' + c + ',' + a + ')'); g.addColorStop(1, 'rgba(' + c + ',0)'); x.fillStyle = g; x.fillRect(px - rr, py - rr, rr * 2, rr * 2); } }
  /** blob outline in world units (sum of sines), optionally jagged */
  function blob(cx, cy, R, sx, sy, seed) {
    const r = rng(seed), hs = [2, 3, 4, 5].map((k) => [k, r.range(0.05, 0.16) / (k * 0.45), r.next() * TAU]);
    const rad = (a) => R * (1 + hs.reduce((s, [k, am, ph]) => s + am * Math.sin(k * a + ph), 0));
    return { rad, inside: (px, py, m) => { const dx = (px - cx) / sx, dy = (py - cy) / sy; return Math.hypot(dx, dy) < rad(Math.atan2(dy, dx)) - m; },
      path(x, inset, jag) { const j = rng(seed + 9); x.beginPath(); for (let i = 0; i < 160; i++) { const a = (i / 160) * TAU, rr = rad(a) - inset + (jag ? j.range(-jag, jag) : 0); x.lineTo(cx + Math.cos(a) * rr * sx, cy + Math.sin(a) * rr * sy); } x.closePath(); } };
  }
  /** one ground sheet: soft offset shadow on what is below, darker side thickness, textured top */
  function sheet(x, s, b, fill, L) {
    x.save(); x.filter = 'blur(' + (L.soft * s).toFixed(1) + 'px)'; x.translate(L.ox, L.oy); b.path(x, 0, L.jag); x.fillStyle = 'rgba(48,26,12,' + L.sh + ')'; x.fill(); x.restore();
    x.save(); x.translate(0, L.thick); b.path(x, 0, L.jag); x.fillStyle = L.side; x.fill(); x.restore();
    b.path(x, 0, L.jag); x.fillStyle = fill; x.fill();
  }
  function bakeGround(w, h) {
    const s = h / 360, W = w / s, c = cv(w, h), x = g2(c), pat = (t, k) => { const p = x.createPattern(t, 'repeat'); p.setTransform(new DOMMatrix().scale(k)); return p; };
    x.setTransform(s, 0, 0, s, 0, 0);
    const kraft = tile(256, '#a87c54', (t, r) => { mottle(t, r, 14, 0.08); fibres(t, r, 1300, 3, 11, 'rgba(255,236,200,0.15)', 'rgba(60,36,16,0.13)', true); specks(t, r, 130, 'rgba(50,30,15,0.35)'); specks(t, r, 45, 'rgba(255,240,215,0.35)'); });
    const card = tile(256, '#c49c6c', (t, r) => { for (let y = 0; y < 256; y += 8) { t.fillStyle = 'rgba(70,45,20,0.16)'; t.fillRect(0, y + 6.6, 256, 1.2); t.fillStyle = 'rgba(255,240,210,0.12)'; t.fillRect(0, y + 1.6, 256, 2); } fibres(t, r, 350, 2, 7, 'rgba(255,240,210,0.10)', 'rgba(70,45,20,0.10)', true); specks(t, r, 80, 'rgba(60,35,15,0.30)'); });
    const felt = (base) => tile(256, base, (t, r) => { mottle(t, r, 10, 0.07); t.lineCap = 'round'; for (let i = 0; i < 2600; i++) { const px = r.next() * 256, py = r.next() * 256, a0 = r.next() * TAU; t.strokeStyle = r.chance(0.5) ? 'rgba(255,255,235,0.13)' : 'rgba(20,30,10,0.13)'; t.lineWidth = r.range(0.5, 1); t.beginPath(); t.arc(px, py, r.range(1.2, 3.2), a0, a0 + r.range(0.8, 2.2)); t.stroke(); } });
    const news = tile(512, '#ddd5c0', (t, r) => { for (let col = 0; col < 8; col++) { const x0 = col * 64 + 4, x1 = col * 64 + 61; for (let row = 0; row < 160;) { if (r.chance(0.05)) { t.fillStyle = 'rgba(40,36,34,0.5)'; for (let cx = x0; cx < x1 - 6;) { const ww = r.range(6, 16); t.fillRect(cx, row * 3.2 + 1, Math.min(ww, x1 - cx), 4.4); cx += ww + 3; } row += 3; } else { t.fillStyle = 'rgba(70,64,60,0.32)'; for (let cx = x0; cx < x1 - 2;) { const ww = r.range(3, 12); t.fillRect(cx, row * 3.2 + 0.9, Math.min(ww, x1 - cx), 1.3); cx += ww + 2; } row++; } } t.fillStyle = 'rgba(60,55,50,0.28)'; t.fillRect(col * 64 + 1, 0, 0.8, 512); } });
    x.fillStyle = pat(kraft, 0.4); x.fillRect(0, 0, W, 360);                                    // 2.5 texels per world unit
    const bCard = blob(W * 0.16, 335, 120, 1.7, 0.75, 11), bFelt = blob(W * 0.86, 190, 150, 1.0, 1.25, 23), bMoss = blob(W * 0.92, 285, 48, 1.3, 0.8, 37), bLeaf = blob(W * 0.36, 120, 140, 1.45, 0.95, 41), bNews = blob(W * 0.88, 55, 42, 1.4, 0.75, 53);
    sheet(x, s, bCard, pat(card, 0.4), { ox: 1.4, oy: 1.8, soft: 1.5, sh: 0.4, thick: 1.0, side: '#8a6a45' });
    sheet(x, s, bFelt, pat(felt('#607c46'), 0.4), { ox: 1.7, oy: 2.2, soft: 1.9, sh: 0.42, thick: 1.4, side: '#455a33' });
    sheet(x, s, bMoss, pat(felt('#868440'), 0.4), { ox: 1.2, oy: 1.6, soft: 1.4, sh: 0.38, thick: 0.9, side: '#5f5e2e' });
    x.save(); x.setLineDash([1.4, 1.4]); x.strokeStyle = C.thread; x.lineWidth = 0.6; bMoss.path(x, 1.85, 0); x.stroke(); x.restore();   // running stitch
    // leaf carpet: hundreds of overlapping cut leaves, each with its own offset shadow (0.6, 0.75); leafy outline
    const r = rng(9001), LC = [[176, 82, 48], [200, 112, 50], [206, 158, 62], [150, 58, 44], [140, 92, 54], [184, 128, 58]];
    x.save(); bLeaf.path(x, 4, 0); x.fillStyle = 'rgb(112,62,40)'; x.fill(); x.restore();
    for (let gy = -40; gy < 280; gy += 4.6) for (let gx = -40; gx < W * 0.85; gx += 4.6) {
      const px = gx + r.range(0, 4.6), py = gy + r.range(0, 4.6);
      if (!bLeaf.inside(px, py, 2 - r.next() * 6)) continue;
      const len = r.range(8, 12), type = r.chance(0.3) ? 1 : r.chance(0.35) ? 2 : 0, col = mix(mix(LC[(r.next() * 6) | 0], [172, 102, 54], 0.45), [160, 94, 52], 0.2), a = r.next() * TAU;
      x.save(); x.translate(px + 0.6, py + 0.75); x.rotate(a); leafPath(x, type, len, len * 0.58); x.fillStyle = 'rgba(48,26,12,0.24)'; x.fill(); x.restore();
      x.save(); x.translate(px, py); x.rotate(a); drawPaperLeaf(x, type, len, len * 0.58, 'rgb(' + col.map((v) => v * r.range(0.95, 1.05) | 0).join(',') + ')'); x.restore();
    }
    // newspaper scrap: torn white paper core around the printed sheet
    sheet(x, s, bNews, C.paperCore, { ox: 1.0, oy: 1.3, soft: 1.1, sh: 0.36, thick: 0.35, side: '#c9c2b4', jag: 0.5 });
    x.save(); bNews.path(x, 0.8, 0.35); x.fillStyle = pat(news, 0.4); x.fill(); x.restore();
    // decals: confetti dots on kraft, buttons + punched flowers on felt
    const d = rng(7001);
    for (let i = 0; i < 70; i++) { const px = d.next() * W, py = d.next() * 360, rad = d.range(0.55, 0.95); if (bLeaf.inside(px, py, -4) || bFelt.inside(px, py, -4)) continue; x.fillStyle = 'rgba(48,26,12,0.3)'; x.beginPath(); x.arc(px + 0.3, py + 0.4, rad, 0, TAU); x.fill(); x.fillStyle = CONF[i % 7]; x.beginPath(); x.arc(px, py, rad, 0, TAU); x.fill(); }
    for (let i = 0; i < 40; i++) { const px = d.next() * W, py = d.next() * 360; if (!bFelt.inside(px, py, 6) || bNews.inside(px, py, -6) || bMoss.inside(px, py, -4)) continue; blitPart(x, i % 4 ? SPR.flower : SPR.button, px, py, 0.8 + d.next() * 0.4, 0.34); }
    x.setTransform(1, 0, 0, 1, 0, 0);
    const R = Math.hypot(w, h) / 2, v = x.createRadialGradient(w * 0.45, h * 0.42, R * 0.35, w / 2, h / 2, R);   // warm vignette
    v.addColorStop(0, 'rgba(255,236,200,0.05)'); v.addColorStop(0.6, 'rgba(70,40,20,0)'); v.addColorStop(1, 'rgba(60,30,15,0.36)');
    return { c, vig: v };
  }
  const CONF = ['#e57d2c', '#d6a43a', '#36a596', '#c4432f', '#9c629a', '#f2e7cf', '#76a54e'];

  let READY = false, GROUND = null, GKEY = ''; function init() { if (READY) return; buildGrain(); buildProps(); buildHero(); buildCreeper(); buildGhost(); READY = true; }
  function contactShadow(ctx, x, y, rw, rh, a) { // soft warm blob, nudged right-down
    const g = ctx.createRadialGradient(x + 1.2, y + 0.6, 0, x + 1.2, y + 0.6, rw);
    g.addColorStop(0, 'rgba(48,26,12,' + 0.62 * a + ')'); g.addColorStop(0.55, 'rgba(48,26,12,' + 0.36 * a + ')'); g.addColorStop(1, 'rgba(48,26,12,0)');
    ctx.save(); ctx.translate(x + 1.2, y + 0.6); ctx.scale(1, rh / rw); ctx.translate(-x - 1.2, -y - 0.6); ctx.fillStyle = g; ctx.fillRect(x - rw + 1.2, y - rw + 0.6, rw * 2, rw * 2); ctx.restore();
  }

  /** Draws the hero with feet at (x, y). t = seconds, facing = 1 | -1. */
  function drawHero(ctx, x, y, t, facing) {
    init(); const f = facing < 0 ? -1 : 1, JS = 1.08; contactShadow(ctx, x, y, 9, 3.6, 0.75);
    blit(ctx, SPR.hero[f][Math.floor(t * 10) & 7], x, y, JS);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.3 + Math.sin(t * 9) * 0.05 + Math.sin(t * 23.7) * 0.04;   // carved face glows
    ctx.drawImage(SPR.glow, x + f * 2.4 * JS - 11, y - 22.4 * JS - 11, 22, 22);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  /** Draws a typical enemy (turnip creeper) with feet at (x, y). */
  function drawEnemy(ctx, x, y, t, facing, seed) {
    init(); seed = seed || 0; contactShadow(ctx, x, y, 8.5, 3.2, 0.75);
    blit(ctx, SPR.creeper[facing < 0 ? -1 : 1][Math.floor(t * 7 + seed * 13) % 6], x, y, 0.93 + seed * 0.14);
  }
  function drawGhost(ctx, x, y, t, seed) {
    const bob = -2.5 - Math.sin(t * 3.1 + seed * 20) * 1.6; contactShadow(ctx, x, y, 6.5, 2.4, 0.4);
    ctx.globalAlpha = 0.92; blit(ctx, SPR.ghost[Math.floor(t * 7 + seed * 13) % 6], x, y + bob, 1); ctx.globalAlpha = 1;
  }

  /** Paints a complete preview scene into a w×h canvas at time t (seconds): ground, hero, enemies, an effect. */
  function draw(ctx, w, h, t) {
    init();
    const key = w + 'x' + h; if (key !== GKEY) { GROUND = bakeGround(w, h); GKEY = key; }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(GROUND.c, 0, 0);
    const s = h / 360, W = w / s; ctx.setTransform(s, 0, 0, s, 0, 0);
    const hx = W * 0.5, hy = 215;
    // pickups (bob + paper turn = horizontal squash)
    [[0.6, 250], [0.64, 262], [0.57, 270], [0.68, 240]].forEach(([fx, gy], i) => {
      const px = W * fx, bob = -3.2 - Math.sin(t * 3.5 + i * 10) * 0.9, turn = Math.cos(t * 2.2 + i * 6);
      contactShadow(ctx, px, gy, 3, 1.2, 0.5); ctx.save(); ctx.translate(px, gy + bob); ctx.scale(0.35 + 0.65 * Math.abs(turn), 1); blitPart(ctx, i === 3 ? SPR.gemBig : SPR.gem, 0, 0, 1); ctx.restore();
    });
    // y-sorted actors and props, upright cut-outs get a projected cast shadow
    const list = [
      { y: 205, f: () => { ctx.globalAlpha = 0.78; blit(ctx, SPR.tree.shadow, W * 0.41, 205); ctx.globalAlpha = 1; blit(ctx, SPR.tree, W * 0.41, 205); } },
      { y: 300, f: () => { ctx.globalAlpha = 0.78; blit(ctx, SPR.pumpkin.shadow, W * 0.83, 300); ctx.globalAlpha = 1; blit(ctx, SPR.pumpkin, W * 0.83, 300); blit(ctx, SPR.pumpkin, W * 0.86, 306, 0.75); } },
      { y: hy, f: () => drawHero(ctx, hx + Math.sin(t * 0.7) * 3, hy, t, 1) },
      { y: 222, f: () => drawEnemy(ctx, W * 0.62, 222, t, -1, 0.3) }, { y: 150, f: () => drawEnemy(ctx, W * 0.74, 150, t, -1, 0.7) },
      { y: 300, f: () => drawEnemy(ctx, W * 0.3, 300, t, 1, 0.1) }, { y: 110, f: () => drawEnemy(ctx, W * 0.22, 110, t, 1, 0.5) },
      { y: 265, f: () => drawGhost(ctx, W * 0.15, 265, t, 0.2) }, { y: 95, f: () => drawGhost(ctx, W * 0.9, 95, t, 0.6) },
    ].sort((a, b) => a.y - b.y);
    for (const o of list) o.f(); // y-sorted
    // seed projectile with a cream speed streak
    const px = hx + 22 + ((t * 120) % 50), py = hy - 14;
    ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(251,246,234,0.5)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(px - 3, py); ctx.lineTo(px - 11, py); ctx.stroke();
    ctx.strokeStyle = 'rgba(229,125,44,0.35)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(px - 4, py); ctx.lineTo(px - 13, py); ctx.stroke();
    ctx.save(); ctx.translate(px, py); ctx.rotate(t * 8); blitPart(ctx, SPR.seed, 0, 0, 0.85, 0.35); ctx.restore();
    // hit burst on an enemy: paper scraps (two-sided, cream edge) + confetti, deterministic per t
    const ex = W * 0.62, ey = 222, ph = (t * 0.9) % 1;
    for (let i = 0; i < 12; i++) {
      const r = rng(i * 31 + 7), a = r.next() * TAU, sp = 30 + r.next() * 40, life = ph * 0.9, fl = Math.cos(t * 9 + i);
      const qx = ex + Math.cos(a) * sp * life, qy = ey - 12 + Math.sin(a) * sp * life * 0.6 - (50 * life - 60 * life * life);
      ctx.globalAlpha = 1 - ph; ctx.save(); ctx.translate(qx, qy); ctx.rotate(r.next() * TAU + t * 6);
      if (i % 2) { const col = [C.aub, C.aubLight, '#efe2b8', C.leaf][i % 4]; ctx.scale(2.2, 2.2 * Math.max(0.18, Math.abs(fl))); ctx.beginPath(); for (let k = 0; k < 5; k++) { const b = (k / 5) * TAU, dd = 0.6 + r.next() * 0.45; ctx.lineTo(Math.cos(b) * dd, Math.sin(b) * dd * 0.8); } ctx.closePath(); ctx.fillStyle = fl < 0 ? shade(col, 0.72) : col; ctx.fill(); ctx.strokeStyle = 'rgba(251,246,234,0.9)'; ctx.lineWidth = 0.16; ctx.stroke(); }
      else { ctx.fillStyle = CONF[i % 7]; ctx.fillRect(-0.9, -0.3 * Math.max(0.2, Math.abs(fl)), 1.8, 0.6 * Math.max(0.2, Math.abs(fl))); }
      ctx.restore();
    }
    ctx.globalAlpha = 1; // damage number: hand-lettered, cream sticker outline, soft offset shadow
    ctx.save(); ctx.translate(ex + 2, ey - 34 - ph * 6); ctx.rotate(-0.08); ctx.font = '11px "Gochi Hand", "Patrick Hand", cursive'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(48,26,12,0.35)'; ctx.fillText('34', 0.5, 0.7); ctx.lineWidth = 2.4; ctx.strokeStyle = '#fff3c0'; ctx.strokeText('34', 0, 0); ctx.fillStyle = C.red; ctx.fillText('34', 0, 0); ctx.restore();
    // HUD note: lined notebook paper pinned with a brass split pin
    ctx.save(); ctx.translate(W / 2, 26); ctx.rotate(-0.026); ctx.fillStyle = 'rgba(48,26,12,0.35)'; ctx.fillRect(-26, -13, 56, 32);
    ctx.fillStyle = '#fffdf6'; ctx.fillRect(-28, -16, 56, 32); ctx.fillStyle = 'rgba(79,111,149,0.28)'; for (let ly = -2; ly < 16; ly += 6.5) ctx.fillRect(-28, ly, 56, 0.4);
    ctx.fillStyle = 'rgba(196,67,47,0.5)'; ctx.fillRect(-28, 4, 56, 0.7);
    ctx.fillStyle = C.ink; ctx.font = '19px "Caveat Brush", cursive'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('22:09', 0, -4);
    ctx.fillStyle = C.redDark; ctx.font = '6.5px "Patrick Hand", cursive'; ctx.fillText('till midnight', 0, 10); drawPin(ctx, 0, -16, 2.2); ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = GROUND.vig; ctx.fillRect(0, 0, w, h);
  }

  const Starter = { id: 'paper', name: 'Paper World', palette: PALETTE, fonts: ['Patrick Hand', 'Gochi Hand', 'Caveat Brush'], drawHero, drawEnemy, draw };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['paper'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
