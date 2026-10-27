/* Native art for the new enemies / upgrades in the 'paper' world (Papierwelt) – see js/content/ART_API.md.
   Same craft vocabulary as js/styles/paper.js: cut construction-paper puppets with white sticker rims, paper grain,
   top-left light, soft offset drop shadows, brass split pins, torn caps, glowing cut-out holes. Parts are cut once,
   puppet frames are composed lazily (per type / facing / pose) and cached. */
(function () {
  'use strict';
  const U = window.U, CT = window.Content;
  const TAU = Math.PI * 2;
  const K = 4; // sprite px per world unit (same as the style)

  /* ---------- palette (copied from the style) ---------- */
  const C = {
    ink: '#3b2a26', rim: '#fbf6ea', cream: '#f2e7cf',
    kraft: '#ad8259', kraftDark: '#7d5838', kraftLight: '#c9a275',
    card: '#c49c6c', cardDark: '#96714a', cardLight: '#dcbb8c',
    mustard: '#d6a43a', mustardDark: '#ac7f26', mustardLight: '#ecc463',
    pumpkin: '#e57d2c', pumpkinDark: '#bb5a20', pumpkinDeep: '#9c4618', pumpkinLight: '#f59c4c',
    glow: '#ffcf4a', glowHot: '#fff3b8', glowDeep: '#f0922a',
    red: '#c4432f', redDark: '#8e2c22',
    moss: '#5f7d45', olive: '#8c8a43', leaf: '#76a54e', leafLight: '#a3cc6a', leafDark: '#4d7a35',
    aub: '#6e3c6d', aubLight: '#9c629a', aubDark: '#4a2649', aubDeep: '#2e1530',
    denim: '#4f6f95', denimDark: '#3a5679', denimLight: '#7192b7',
    brass: '#d4ac4a', brassLight: '#fff0b0', brassDark: '#8f6d24',
    teal: '#36a596', tealLight: '#9ae6d6', tealDark: '#1d6d68', tealMid: '#5cc3b2',
    gold: '#e6b23a', goldLight: '#fff1a6', goldDark: '#a5731b',
    lime: '#b6d84a', toxic: '#8fd43a', toxicDark: '#2f5a18',
    beet: '#b02a45', beetDark: '#7a1a33', beetLight: '#d85a6e',
    shadow: 'rgb(48,26,12)',
  };
  const CONF = ['#e57d2c', '#d6a43a', '#36a596', '#c4432f', '#9c629a', '#f2e7cf', '#76a54e'];

  /* ---------- canvas helpers (as in the style) ---------- */
  function cv(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
  const g2 = (c) => c.getContext('2d');
  let HAS_FILTER = false;
  function blurInto(x, src, dx, dy, px) {
    if (px <= 0.25) { x.drawImage(src, dx, dy); return; }
    if (HAS_FILTER) { x.filter = 'blur(' + px.toFixed(2) + 'px)'; x.drawImage(src, dx, dy); x.filter = 'none'; return; }
    const a = x.globalAlpha, n = 10;
    x.globalAlpha = a / 4;
    for (let i = 0; i < n; i++) { const t = (i / n) * TAU, r = px * (i & 1 ? 0.5 : 1); x.drawImage(src, dx + Math.cos(t) * r, dy + Math.sin(t) * r); }
    x.globalAlpha = a;
  }
  function sil(src, color) {
    const c = cv(src.width, src.height), x = g2(c);
    x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    return c;
  }
  function dilate(src, r, color) {
    const pad = Math.ceil(r) + 2;
    const c = cv(src.width + pad * 2, src.height + pad * 2), x = g2(c);
    const s = sil(src, color);
    for (const rr of [r, r * 0.6, r * 0.3]) {
      const n = Math.max(8, Math.round(rr * 3.2));
      for (let i = 0; i < n; i++) { const a = ((i + 0.5) / n) * TAU; x.drawImage(s, pad + Math.cos(a) * rr, pad + Math.sin(a) * rr); }
    }
    x.drawImage(s, pad, pad);
    return { c, pad };
  }
  function softShadow(src, blurPx, color) {
    const pad = Math.ceil(blurPx * 2.5) + 2;
    const c = cv(src.width + pad * 2, src.height + pad * 2);
    blurInto(g2(c), sil(src, color || C.shadow), pad, pad, blurPx);
    return { c, pad };
  }
  let GRAIN = null;
  function buildGrain() {
    const n = 256, c = cv(n, n), x = g2(c);
    const r = U.rng(4243);
    const im = x.createImageData(n, n), d = im.data;
    for (let i = 0; i < n * n; i++) {
      const v = r.next(), o = i * 4;
      if (v < 0.5) { d[o] = 255; d[o + 1] = 250; d[o + 2] = 235; d[o + 3] = (r.next() * 22) | 0; }
      else { d[o] = 60; d[o + 1] = 36; d[o + 2] = 20; d[o + 3] = (r.next() * 20) | 0; }
    }
    x.putImageData(im, 0, 0);
    x.lineCap = 'round';
    for (let i = 0; i < 360; i++) {
      const px = r.next() * n, py = r.next() * n, a = r.range(-0.6, 0.6) + (r.chance(0.3) ? Math.PI / 2 : 0);
      const l = r.range(3, 11), light = r.chance(0.55);
      x.strokeStyle = light ? 'rgba(255,248,230,0.22)' : 'rgba(70,40,20,0.16)';
      x.lineWidth = r.range(0.5, 1.1);
      x.beginPath(); x.moveTo(px, py);
      x.quadraticCurveTo(px + Math.cos(a) * l * 0.5 + r.range(-1, 1), py + Math.sin(a) * l * 0.5 + r.range(-1, 1), px + Math.cos(a) * l, py + Math.sin(a) * l);
      x.stroke();
    }
    GRAIN = c;
  }
  function applyGrain(x, w, h, k) {
    x.save(); x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = 'source-atop'; x.globalAlpha = k === undefined ? 1 : k;
    x.fillStyle = x.createPattern(GRAIN, 'repeat');
    x.translate((Math.random() * 256) | 0, (Math.random() * 256) | 0);
    x.fillRect(-256, -256, w + 256, h + 256);
    x.restore();
  }
  function applyLight(x, w, h, a) {
    x.save(); x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = 'source-atop';
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, 'rgba(255,250,232,' + a + ')'); g.addColorStop(0.45, 'rgba(255,250,232,0)'); g.addColorStop(1, 'rgba(50,25,10,' + a * 1.2 + ')');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.restore();
  }
  /** a cut paper piece; draw() in world units, pivot (0,0) inside bbox [x0,y0,x1,y1] */
  function mkPart(bb, draw, o) {
    o = o || {};
    const rim = o.rim === undefined ? 0.55 : o.rim;
    const w = (bb[2] - bb[0]) * K, h = (bb[3] - bb[1]) * K;
    const c = cv(w + 4, h + 4), x = g2(c);
    x.setTransform(K, 0, 0, K, -bb[0] * K + 2, -bb[1] * K + 2);
    x.lineJoin = 'round'; x.lineCap = 'round';
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
  /** puppet frame from parts: {p, x, y, r, sx, sy, sh, alpha, pin:[px,py,r]} ; feet at (footX, footY) */
  function composeFrame(fw, fh, footX, footY, facing, list) {
    const c = cv(fw * K, fh * K), x = g2(c);
    const pins = [];
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
        place(0.42, 0.55);
        x.globalAlpha = it.sh === undefined ? 0.34 : it.sh;
        x.drawImage(p.sh, (-p.ox - p.shPad) / K, (-p.oy - p.shPad) / K, p.sh.width / K, p.sh.height / K);
      }
      place(0, 0);
      x.globalAlpha = it.alpha === undefined ? 1 : it.alpha;
      x.drawImage(p.img, -p.ox / K, -p.oy / K, p.img.width / K, p.img.height / K);
      if (it.pin) {
        const m = x.getTransform();
        pins.push([(m.a * it.pin[0] + m.c * it.pin[1] + m.e) / K, (m.b * it.pin[0] + m.d * it.pin[1] + m.f) / K, it.pin[2]]);
      }
    }
    x.globalAlpha = 1;
    x.setTransform(K, 0, 0, K, 0, 0);
    for (const q of pins) drawPin(x, q[0], q[1], q[2]);
    x.setTransform(1, 0, 0, 1, 0, 0);
    return c;
  }
  function mkSprite(frame, footX, footY, o) {
    o = o || {};
    const offX = o.dx === undefined ? 0.9 : o.dx, offY = o.dy === undefined ? 1.1 : o.dy;
    const blur = (o.blur === undefined ? 0.7 : o.blur) * K;
    const pad = Math.ceil(blur * 2.5 + Math.max(offX, offY) * K) + 2;
    const c = cv(frame.width + pad * 2, frame.height + pad * 2), x = g2(c);
    x.globalAlpha = o.alpha === undefined ? 0.3 : o.alpha;
    blurInto(x, sil(frame, C.shadow), pad + offX * K, pad + offY * K, blur);
    x.globalAlpha = 1;
    x.drawImage(frame, pad, pad);
    const s = { img: c, ax: footX * K + pad, ay: footY * K + pad };
    s.flash = { img: U.tint(frame, '#fffaf0', 0.95), ax: footX * K, ay: footY * K };
    if (o.hot) s.hot = { img: U.tint(frame, o.hot, 0.62), ax: footX * K, ay: footY * K };
    return s;
  }
  function blit(ctx, s, x, y, sc, sx, sy) {
    sc = sc || 1;
    const kx = (sc * (sx === undefined ? 1 : sx)) / K, ky = (sc * (sy === undefined ? 1 : sy)) / K;
    ctx.drawImage(s.img, x - s.ax * kx, y - s.ay * ky, s.img.width * kx, s.img.height * ky);
  }
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
  function scallop(x, cx, cy, rx, ry, n, depth, rot) {
    x.beginPath();
    for (let i = 0; i <= n; i++) {
      const a0 = rot + (i / n) * TAU, a1 = rot + ((i + 0.5) / n) * TAU, a2 = rot + ((i + 1) / n) * TAU;
      if (i === 0) x.moveTo(cx + Math.cos(a0) * rx, cy + Math.sin(a0) * ry);
      if (i === n) break;
      x.quadraticCurveTo(cx + Math.cos(a1) * rx * (1 + depth), cy + Math.sin(a1) * ry * (1 + depth), cx + Math.cos(a2) * rx, cy + Math.sin(a2) * ry);
    }
    x.closePath();
  }
  function rgba(c, a) { const h = U.hex(c); return 'rgba(' + h[0] + ',' + h[1] + ',' + h[2] + ',' + a + ')'; }
  function shade(c, f) { return U.rgb(U.mul(U.hex(c), f)); }
  function turnipPath(x, w, h) {
    x.beginPath();
    x.moveTo(0, -h);
    x.bezierCurveTo(w * 0.68, -h, w * 1.05, -h * 0.7, w, -h * 0.4);
    x.bezierCurveTo(w * 0.95, -h * 0.15, w * 0.4, -h * 0.04, w * 0.04, h * 0.1);
    x.bezierCurveTo(-w * 0.4, -h * 0.04, -w * 0.95, -h * 0.15, -w, -h * 0.4);
    x.bezierCurveTo(-w * 1.05, -h * 0.7, -w * 0.68, -h, 0, -h);
    x.closePath();
  }
  function rutaPath(x, r, k) {
    x.save(); x.scale(1, k);
    x.beginPath();
    x.moveTo(0, -r * 0.9);
    x.bezierCurveTo(r * 0.72, -r * 0.98, r * 1.06, -r * 0.5, r, 0);
    x.bezierCurveTo(r * 0.94, r * 0.55, r * 0.42, r * 0.82, 0, r * 0.98);
    x.bezierCurveTo(-r * 0.42, r * 0.82, -r * 0.94, r * 0.55, -r, 0);
    x.bezierCurveTo(-r * 1.06, -r * 0.5, -r * 0.72, -r * 0.98, 0, -r * 0.9);
    x.closePath();
    x.restore();
  }
  function tornLine(r, x0, x1, y, step, amp, wave) {
    const pts = [];
    for (let px = x0; px <= x1 + 0.01; px += step) pts.push([px, y + r.range(-amp, amp) + Math.sin(px * 0.45) * (wave || 0)]);
    return pts;
  }
  function tornCap(x, pts, top, col, coreW) {
    const poly = (dy) => {
      x.beginPath(); x.moveTo(pts[0][0], top);
      for (const p of pts) x.lineTo(p[0], p[1] + dy);
      x.lineTo(pts[pts.length - 1][0], top); x.closePath();
    };
    x.fillStyle = 'rgba(48,26,12,0.22)'; poly(coreW + 0.35); x.fill();
    x.fillStyle = C.rim; poly(coreW); x.fill();
    x.fillStyle = col; poly(0); x.fill();
  }
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
  function tapeStrip(x, cx, cy, len, wid, ang) {
    x.save(); x.translate(cx, cy); x.rotate(ang);
    x.beginPath();
    x.moveTo(-len / 2, -wid / 2);
    for (let k = 0; k <= 4; k++) x.lineTo(len / 2 + (k % 2 ? 0.35 : 0), -wid / 2 + (k / 4) * wid);
    for (let k = 4; k >= 0; k--) x.lineTo(-len / 2 - (k % 2 ? 0.35 : 0), -wid / 2 + (k / 4) * wid);
    x.closePath();
    x.fillStyle = 'rgba(48,26,12,0.18)';
    x.save(); x.translate(0.2, 0.3); x.fill(); x.restore();
    x.fillStyle = 'rgba(236,222,172,0.88)'; x.fill();
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
  function leafPath(x, type, len, wid) {
    const hl = len / 2, N = 40;
    x.beginPath();
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
    x.closePath();
  }
  function drawPaperLeaf(x, type, len, wid, col) {
    leafPath(x, type, len, wid);
    x.fillStyle = col; x.fill();
    x.save(); x.clip();
    x.fillStyle = 'rgba(60,20,10,0.16)'; x.fillRect(-len, 0, len * 2, len);
    x.strokeStyle = 'rgba(255,235,200,0.45)'; x.lineWidth = len * 0.035;
    x.beginPath(); x.moveTo(-len / 2, 0); x.lineTo(len / 2, 0); x.stroke();
    x.strokeStyle = 'rgba(60,20,10,0.16)'; x.lineWidth = len * 0.025;
    for (let i = -2; i <= 2; i++) {
      const u = (i / 3) * len * 0.4;
      x.beginPath(); x.moveTo(u, 0); x.lineTo(u + len * 0.12, -wid * 0.36); x.moveTo(u, 0); x.lineTo(u + len * 0.12, wid * 0.36); x.stroke();
    }
    x.restore();
    x.strokeStyle = shade(col, 0.7); x.lineWidth = len * 0.04;
    x.beginPath(); x.moveTo(-len / 2, 0); x.lineTo(-len / 2 - len * 0.16, len * 0.04); x.stroke();
  }
  function leafUp(len, wid, col, type, rimW) {
    return mkPart([-wid, -len - 1.5, wid, 1.5], (x) => {
      x.rotate(-Math.PI / 2); x.translate(len / 2, 0);
      drawPaperLeaf(x, type || 0, len, wid, col);
    }, { rim: rimW === undefined ? 0.45 : rimW });
  }
  function radial(size, stops) {
    const c = cv(size, size), x = g2(c), g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    for (const [o, col] of stops) g.addColorStop(o, col);
    x.fillStyle = g; x.fillRect(0, 0, size, size);
    return c;
  }
  function starPath(x, cx, cy, n, r0, r1, rot) {
    x.beginPath();
    for (let i = 0; i < n * 2; i++) { const a = (rot || 0) + (i / (n * 2)) * TAU, rr = i % 2 ? r1 : r0; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    x.closePath();
  }
  /** angry glowing eye pair like the creeper's (cut-out holes) */
  function angryEyes(x, fx, ey, sz, cols, browCol) {
    const s = sz || 1;
    const eye = (cx, flip) => () => { x.beginPath(); x.moveTo(cx - 1.5 * s * flip, ey - 0.9 * s); x.quadraticCurveTo(cx, ey + 1.6 * s, cx + 1.5 * s * flip, ey - 0.1 * s); x.closePath(); };
    glowHole(x, eye(fx - 2.4 * s, 1), fx - 2.4 * s, ey, 2 * s, cols[0], cols[1], cols[2]);
    glowHole(x, eye(fx + 2.4 * s, -1), fx + 2.4 * s, ey, 2 * s, cols[0], cols[1], cols[2]);
    x.fillStyle = '#2a1424';
    x.beginPath(); x.ellipse(fx - 2.1 * s, ey + 0.1 * s, 0.32 * s, 0.6 * s, 0, 0, TAU); x.ellipse(fx + 2.1 * s, ey + 0.1 * s, 0.32 * s, 0.6 * s, 0, 0, TAU); x.fill();
    const brow = () => {
      x.beginPath(); x.moveTo(fx - 4.3 * s, ey - 2.3 * s); x.lineTo(fx - 0.6 * s, ey - 0.9 * s); x.lineTo(fx - 0.7 * s, ey - 0.1 * s); x.lineTo(fx - 4.4 * s, ey - 1.5 * s); x.closePath();
      x.moveTo(fx + 4.3 * s, ey - 2.3 * s); x.lineTo(fx + 0.6 * s, ey - 0.9 * s); x.lineTo(fx + 0.7 * s, ey - 0.1 * s); x.lineTo(fx + 4.4 * s, ey - 1.5 * s); x.closePath();
    };
    x.fillStyle = 'rgba(30,10,25,0.35)'; x.save(); x.translate(0.2, 0.3); brow(); x.fill(); x.restore();
    x.fillStyle = browCol || C.aubDeep; brow(); x.fill();
  }
  const EYE_FIRE = ['#fff2a0', '#ffb02e', '#e0561c'];
  const EYE_TOXIC = ['#f6ffc8', '#b6f04a', '#3f8a1c'];
  const EYE_RED = ['#fff0d0', '#ff5a3a', '#a01010'];
  function rootLeg(col, len) {
    len = len || 1;
    return mkPart([-1.6, -0.6, 2.4, 6 * len], (x) => {
      x.save(); x.scale(1, len);
      x.beginPath(); x.moveTo(-0.85, 0); x.quadraticCurveTo(-0.7, 3, 0.2, 4.6); x.quadraticCurveTo(1.4, 5.4, 1.9, 4.6);
      x.quadraticCurveTo(1.1, 4.6, 0.75, 3.6); x.quadraticCurveTo(0.6, 2, 0.85, 0); x.closePath();
      x.fillStyle = col; x.fill();
      x.strokeStyle = 'rgba(110,80,40,0.4)'; x.lineWidth = 0.15;
      x.beginPath(); x.moveTo(-0.5, 1.4); x.lineTo(0.4, 1.6); x.moveTo(-0.4, 2.7); x.lineTo(0.5, 2.9); x.stroke();
      x.restore();
    }, { rim: 0.4 });
  }
  function armPart(col) {
    return mkPart([-1, -0.8, 4.4, 3.6], (x) => {
      x.beginPath(); x.moveTo(0, -0.45); x.quadraticCurveTo(2.2, -0.3, 3.4, 1.2); x.lineTo(3.9, 0.8); x.lineTo(3.6, 2.1); x.lineTo(2.7, 1.9);
      x.quadraticCurveTo(1.8, 0.6, 0, 0.5); x.closePath();
      x.fillStyle = col; x.fill();
    }, { rim: 0.35 });
  }

  /* ---------- lazily built sprite sets ---------- */
  const P = {}; // parts per type
  const FR = {}; // frame cache
  const ANY = {}; // group -> some already built frame (fallback while the budget is used up)
  let budget = 3, lastRt = -1;
  /** cached frame; at most 3 new frames are cut per rendered frame (others show a sibling frame meanwhile) */
  function frame(key, make, view) {
    let s = FR[key];
    if (s) return s;
    if (view.rt !== lastRt) { lastRt = view.rt; budget = 3; }
    const grp = key.slice(0, 3) + key.slice(-1);
    if (budget <= 0 && ANY[grp]) return ANY[grp];
    budget--;
    s = FR[key] = make();
    ANY[grp] = s;
    return s;
  }
  const NF = 6;
  const phaseIdx = (anim, rate) => ((Math.floor(anim * rate * NF) % NF) + NF) % NF;

  /* ===== Rüben-Spucker ===== */
  const SP = { W: 7.6, H: 14.6 };
  function spitterParts() {
    const r = U.rng(2101), W = SP.W, H = SP.H;
    const bulb = mkPart([-W - 1.5, -H - 1.5, W + 1.5, 3], (x) => {
      turnipPath(x, W, H);
      const g = x.createLinearGradient(0, -H, 0, 1); g.addColorStop(0, '#ebe8b8'); g.addColorStop(1, '#cfd48e');
      x.fillStyle = g; x.fill();
      x.save(); turnipPath(x, W, H); x.clip();
      // mottled sickly-green blotches
      for (let i = 0; i < 6; i++) { scallop(x, r.range(-W * 0.8, W * 0.6), r.range(-H * 0.55, -1), r.range(0.8, 1.6), r.range(0.6, 1.2), 6, 0.15, r.next() * 3); x.fillStyle = rgba(i % 2 ? '#9cbf52' : '#b9c86a', 0.55); x.fill(); }
      const pts = tornLine(r, -W - 1, W + 1, -H * 0.66, 1.1, 0.45, 0.5);
      tornCap(x, pts, -H - 2, '#5a3466', 0.55);
      // toxic-green paper spots glued on the purple cap
      for (const [sx, sy, sr, col] of [[-3.6, -H + 3.4, 1.35, C.toxic], [0.8, -H + 1.6, 1, C.lime], [-0.6, -H * 0.76, 0.95, C.leaf], [3.8, -H * 0.79, 0.8, C.lime], [-5.4, -H * 0.72, 0.7, C.toxic]]) {
        scallop(x, sx, sy, sr, sr * 0.85, 7, 0.14, r.next() * 2); x.fillStyle = col; x.fill();
      }
      x.strokeStyle = rgba(C.aubLight, 0.45); x.lineWidth = 0.45;
      for (let i = 0; i < 3; i++) { const yy = -H + 2.4 + i * 1.3; x.beginPath(); x.moveTo(-W * 0.2 + i, yy); x.quadraticCurveTo(2, yy - 0.7, W * 0.55 - i * 0.6, yy - 0.2); x.stroke(); }
      x.strokeStyle = 'rgba(90,100,40,0.38)'; x.lineWidth = 0.18;
      for (const yy of [-4.2, -2.4]) { x.beginPath(); x.moveTo(-W * 0.7, yy); x.quadraticCurveTo(0, yy + 1.1, W * 0.7, yy); x.stroke(); }
      x.restore();
      x.strokeStyle = 'rgba(130,130,60,0.7)'; x.lineWidth = 0.22;
      for (const [hx, hy, dx] of [[-4.2, -2.6, -1.4], [4.4, -2.8, 1.3], [-2.2, -0.9, -1.0]]) { x.beginPath(); x.moveTo(hx, hy); x.lineTo(hx + dx, hy + 0.7); x.stroke(); }
      angryEyes(x, 1.6, -H * 0.53, 0.95, EYE_TOXIC, '#2a1a30');
    });
    const snout = (hot) => mkPart([-1.2, -4.6, 9, 7.6], (x) => {
      const tube = () => { x.beginPath(); x.moveTo(-0.6, -2.7); x.quadraticCurveTo(3.4, -2.3, 5.7, -3.4); x.lineTo(5.7, 3.4); x.quadraticCurveTo(3.4, 2.3, -0.6, 2.7); x.closePath(); };
      tube();
      const g = x.createLinearGradient(0, -3, 0, 3); g.addColorStop(0, '#dadb9c'); g.addColorStop(1, '#a9b866');
      x.fillStyle = g; x.fill();
      x.save(); tube(); x.clip();
      x.strokeStyle = 'rgba(70,80,30,0.4)'; x.lineWidth = 0.2;
      for (const px of [1.6, 3.4]) { x.beginPath(); x.moveTo(px, -3); x.quadraticCurveTo(px + 0.7, 0, px, 3); x.stroke(); }
      x.fillStyle = 'rgba(255,255,230,0.35)'; x.fillRect(-1, -2.4, 7, 0.8);
      x.restore();
      // puckered lip ring
      scallop(x, 5.9, 0, 1.7, 3.7, 9, 0.1, 0.2);
      x.fillStyle = '#8fae4a'; x.fill();
      x.strokeStyle = 'rgba(40,60,20,0.45)'; x.lineWidth = 0.18;
      for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU; x.beginPath(); x.moveTo(5.9 + Math.cos(a) * 1.0, Math.sin(a) * 2.4); x.lineTo(5.9 + Math.cos(a) * 1.6, Math.sin(a) * 3.5); x.stroke(); }
      const hole = () => { x.beginPath(); x.ellipse(6.15, 0, 0.95, 2.35, 0, 0, TAU); };
      if (hot) glowHole(x, hole, 6.2, 0, 2.6, '#fbffd8', '#b6f04a', '#3f8a1c');
      else { hole(); x.fillStyle = '#1f2a14'; x.fill(); x.fillStyle = 'rgba(140,210,60,0.55)'; x.beginPath(); x.ellipse(6.4, 0.9, 0.45, 0.9, 0, 0, TAU); x.fill(); }
      // green drool drip
      x.beginPath(); x.moveTo(5.1, 3.1); x.quadraticCurveTo(5.0, 4.6, 5.5, 5.4); x.arc(5.75, 5.7, 0.75, Math.PI * 0.9, Math.PI * 2.15, true);
      x.quadraticCurveTo(6.4, 4.4, 6.3, 3.3); x.closePath();
      x.fillStyle = C.toxic; x.fill();
      x.fillStyle = 'rgba(255,255,220,0.7)'; x.beginPath(); x.arc(5.5, 5.5, 0.25, 0, TAU); x.fill();
    }, { rim: 0.45 });
    return {
      bulb, snoutIdle: snout(false), snoutHot: snout(true),
      rootB: rootLeg('#b6b47a'), rootF: rootLeg('#d6d39a'), arm: armPart('#c9c88c'),
      leaves: [leafUp(9, 4.2, C.lime, 2), leafUp(10, 4.4, C.leafDark, 2), leafUp(8.5, 3.8, C.toxic, 0)],
    };
  }
  /** c = swell (0 walk, >0 aiming) */
  function spitterFrame(fc, ph, c) {
    const p = P.spitter || (P.spitter = spitterParts());
    const W = SP.W, H = SP.H;
    const s = Math.sin(ph);
    const wob = c ? 0 : s * 0.12, bob = c ? 0 : -Math.abs(Math.cos(ph)) * 0.9;
    const by = -4.2 + bob - c * 0.4;
    const sx = 1 + 0.17 * c, sy = 1 + 0.07 * c;
    const cx = Math.sin(wob) * H * sy, cy = by - Math.cos(wob) * H * sy;
    const sway = Math.sin(ph * 2 + 0.6) * 0.12;
    const spread = c * 0.25;
    const mx = W * 0.55 * sx - 0.3 * c, my = by - H * 0.3 * sy;
    return mkSprite(composeFrame(40, 38, 20, 34, fc, [
      { p: p.rootB, x: -1.8, y: by + 0.2, r: s * 0.5 },
      { p: p.arm, x: -W * sx + 0.4 + Math.sin(wob) * 6, y: by - 7, r: Math.PI - 0.4 - s * 0.3 - c * 0.5, sh: 0.25 },
      { p: p.leaves[1], x: cx - 0.6, y: cy + 0.8, r: -0.6 + sway + wob - spread },
      { p: p.leaves[2], x: cx + 0.6, y: cy + 0.8, r: 0.6 + sway + wob + spread },
      { p: p.rootF, x: 1.8, y: by + 0.2, r: -s * 0.5 },
      { p: p.bulb, x: 0, y: by, r: wob, sx, sy },
      { p: c ? p.snoutHot : p.snoutIdle, x: mx, y: my, r: wob - c * 0.12, sx: 1 + c * 0.12, sy: 1 + c * 0.18 },
      { p: p.leaves[0], x: cx, y: cy + 1.2, r: 0.05 + sway * 1.4 + wob, pin: [0, 0, 0.5] },
      { p: p.arm, x: W * sx * 0.82 + Math.sin(wob) * 4, y: by - 2.4, r: 0.75 + s * 0.35 + c * 0.5, pin: [0.3, 0, 0.42] },
    ]), 20, 34);
  }
  const spitMouth = (c) => [SP.W * 0.55 * (1 + 0.17 * c) - 0.3 * c + 6.3, -4.2 - c * 0.4 - SP.H * 0.3 * (1 + 0.07 * c)];

  /* ===== Zündrübe ===== */
  function bomberParts() {
    const r = U.rng(2201), R = 6.3;
    const body = mkPart([-R - 1.5, -R - 2, R + 1.5, R + 3.5], (x) => {
      const path = () => {
        x.beginPath(); x.moveTo(0, -R);
        x.bezierCurveTo(R * 0.62, -R * 1.02, R * 1.04, -R * 0.55, R, 0.2);
        x.bezierCurveTo(R * 0.96, R * 0.62, R * 0.5, R * 0.95, 0.4, R * 1.02);
        x.quadraticCurveTo(-1.2, R * 1.32, -3.6, R * 1.2); x.quadraticCurveTo(-1.6, R * 1.12, -0.6, R * 0.98);
        x.bezierCurveTo(-R * 0.55, R * 0.92, -R * 0.98, R * 0.6, -R, 0.2);
        x.bezierCurveTo(-R * 1.04, -R * 0.55, -R * 0.62, -R * 1.02, 0, -R);
        x.closePath();
      };
      path(); x.fillStyle = C.beet; x.fill();
      x.save(); path(); x.clip();
      // darker torn lower half for weight
      const pts = tornLine(r, -R - 1, R + 1, R * 0.28, 1, 0.4, 0.4).map((q) => [q[0], q[1]]);
      x.fillStyle = C.beetDark;
      x.beginPath(); x.moveTo(pts[0][0], R * 2); for (const q of pts) x.lineTo(q[0], q[1]); x.lineTo(pts[pts.length - 1][0], R * 2); x.closePath(); x.fill();
      // beetroot rings (pencil + light paper)
      x.strokeStyle = 'rgba(255,190,200,0.35)'; x.lineWidth = 0.3;
      for (const rr of [R * 0.82, R * 0.6]) { x.beginPath(); x.ellipse(-0.6, 0.6, rr, rr * 0.92, 0, Math.PI * 0.95, Math.PI * 1.75); x.stroke(); }
      // orange warning patch on top (the crown)
      x.fillStyle = C.pumpkin;
      x.beginPath(); x.moveTo(-3.6, -R - 1); x.lineTo(-3.2, -R + 2.1); x.lineTo(-1.6, -R + 1.5); x.lineTo(-0.4, -R + 2.4); x.lineTo(1.2, -R + 1.6); x.lineTo(2.6, -R + 2.3); x.lineTo(3.8, -R + 1.2); x.lineTo(4, -R - 1); x.closePath(); x.fill();
      x.fillStyle = 'rgba(255,240,200,0.5)'; x.fillRect(-2.6, -R + 0.3, 4, 0.45);
      // highlight
      x.fillStyle = 'rgba(255,235,235,0.35)'; x.beginPath(); x.ellipse(-3.4, -1.6, 1.0, 2.2, 0.35, 0, TAU); x.fill();
      x.restore();
      // mean little eyes + one heavy brow
      const fx = 1.9, ey = -0.6;
      const eye = (cx, d) => () => { x.beginPath(); x.moveTo(cx - 1.25 * d, ey - 0.5); x.lineTo(cx + 1.15 * d, ey + 0.35); x.lineTo(cx - 0.9 * d, ey + 1.0); x.closePath(); };
      glowHole(x, eye(fx - 1.9, 1), fx - 1.9, ey + 0.2, 1.5, '#fff6c0', '#ffd23f', '#e07a1c');
      glowHole(x, eye(fx + 1.9, -1), fx + 1.9, ey + 0.2, 1.5, '#fff6c0', '#ffd23f', '#e07a1c');
      x.fillStyle = 'rgba(20,5,10,0.35)';
      const brow = () => { x.beginPath(); x.moveTo(fx - 3.7, ey - 2.1); x.lineTo(fx, ey - 0.6); x.lineTo(fx + 3.7, ey - 2.1); x.lineTo(fx + 3.5, ey - 1.0); x.lineTo(fx, ey + 0.2); x.lineTo(fx - 3.5, ey - 1.0); x.closePath(); };
      x.save(); x.translate(0.2, 0.3); brow(); x.fill(); x.restore();
      x.fillStyle = '#3a0d1c'; brow(); x.fill();
      // gritted grin
      x.fillStyle = '#3a0d1c';
      x.beginPath(); x.moveTo(fx - 2.2, ey + 2.4); x.lineTo(fx + 2.4, ey + 2.1); x.lineTo(fx + 1.9, ey + 3.4); x.lineTo(fx - 1.8, ey + 3.5); x.closePath(); x.fill();
      x.strokeStyle = '#f2e7cf'; x.lineWidth = 0.22;
      x.beginPath(); for (const tx of [-1, 0, 1]) { x.moveTo(fx + tx * 1.05, ey + 2.3); x.lineTo(fx + tx * 1.05, ey + 3.4); } x.stroke();
      staple(x, -4.2, 2.6, 1.1, 1.8);
    }, { rim: 0.5 });
    // fuse: twisted kraft string, pivot at its base, tip at (2.2,-7.4)
    const fuse = mkPart([-1.6, -8.6, 3.6, 1], (x) => {
      x.strokeStyle = C.kraftDark; x.lineWidth = 0.8;
      x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(-1.2, -2.6, 1.6, -4.2, 0.6, -5.8); x.quadraticCurveTo(0.2, -6.8, 2.2, -7.4); x.stroke();
      x.strokeStyle = C.kraftLight; x.lineWidth = 0.35; x.setLineDash([0.5, 0.55]);
      x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(-1.2, -2.6, 1.6, -4.2, 0.6, -5.8); x.quadraticCurveTo(0.2, -6.8, 2.2, -7.4); x.stroke();
      x.setLineDash([]);
      x.fillStyle = '#3a2418'; x.beginPath(); x.arc(2.2, -7.4, 0.6, 0, TAU); x.fill();
    }, { rim: 0.3 });
    const leaf = (col, len) => mkPart([-2.4, -len - 1.5, 2.4, 1.5], (x) => {
      x.strokeStyle = C.beet; x.lineWidth = 0.5; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -len * 0.4); x.stroke();
      x.translate(0, -len * 0.35); x.rotate(-Math.PI / 2); x.translate(len * 0.32, 0);
      drawPaperLeaf(x, 0, len * 0.7, len * 0.42, col);
      x.strokeStyle = 'rgba(176,42,69,0.8)'; x.lineWidth = 0.22; x.beginPath(); x.moveTo(-len * 0.3, 0); x.lineTo(len * 0.3, 0); x.stroke();
    }, { rim: 0.35 });
    const leg = (dark) => mkPart([-1.4, -0.6, 2.6, 4.6], (x) => {
      x.beginPath(); x.moveTo(-0.75, 0); x.lineTo(-0.5, 2.8); x.quadraticCurveTo(0.4, 3.9, 1.9, 3.5); x.lineTo(1.6, 2.7); x.lineTo(0.5, 2.6); x.lineTo(0.75, 0); x.closePath();
      x.fillStyle = dark ? '#6a1428' : '#8e2a3c'; x.fill();
    }, { rim: 0.35 });
    return { body, fuse, leafA: leaf(C.leafDark, 6.5), leafB: leaf(C.leaf, 5.5), legB: leg(true), legF: leg(false) };
  }
  const BO = { R: 6.3, cy: -9.2 };
  function bomberFrame(fc, ph) {
    const p = P.bomber || (P.bomber = bomberParts());
    const s = Math.sin(ph), bob = -Math.abs(Math.cos(ph)) * 0.8, wob = s * 0.1;
    const cy = BO.cy + bob;
    const top = [Math.sin(wob) * BO.R, cy - Math.cos(wob) * BO.R + 0.6];
    const sp = mkSprite(composeFrame(26, 30, 13, 27, fc, [
      { p: p.legB, x: -2, y: cy + 5.2, r: s * 0.9 },
      { p: p.leafA, x: top[0] - 0.8, y: top[1], r: -0.7 + wob + Math.sin(ph * 2) * 0.1 },
      { p: p.legF, x: 2.2, y: cy + 5.2, r: -s * 0.9 },
      { p: p.fuse, x: top[0] + 0.4, y: top[1] + 0.2, r: wob * 2 },
      { p: p.body, x: 0, y: cy, r: wob },
      { p: p.leafB, x: top[0] + 0.6, y: top[1] + 0.3, r: 0.75 + wob + Math.sin(ph * 2 + 1) * 0.12, pin: [0, 0, 0.4] },
    ]), 13, 27, { hot: '#fff4d6' });
    // fuse tip in body space (facing +x): rotate (2.2,-7.4) by wob*2
    const a = wob * 2, tx = 2.2 * Math.cos(a) + 7.4 * Math.sin(a), ty = 2.2 * Math.sin(a) - 7.4 * Math.cos(a);
    sp.tip = [top[0] + 0.4 + tx, top[1] + 0.2 + ty];
    return sp;
  }

  /* ===== Wurzel-Bock ===== */
  function chargerParts() {
    const r = U.rng(2301);
    const bodyPath = (x) => {
      x.beginPath(); x.moveTo(-15.5, -3.8);
      x.bezierCurveTo(-10.5, -7.0, -2.5, -7.9, 3.2, -6.6);
      x.bezierCurveTo(8.6, -5.4, 12.0, -1.6, 11.6, 2.6);
      x.bezierCurveTo(11.2, 5.8, 7.2, 6.8, 2.6, 6.0);
      x.bezierCurveTo(-3.2, 5.2, -9.4, 2.4, -15.5, -3.8);
      x.closePath();
    };
    const body = (eyes) => mkPart([-20, -10.5, 13, 8], (x) => {
      // thin curling root tail
      x.strokeStyle = '#c8aa74'; x.lineWidth = 1.1;
      x.beginPath(); x.moveTo(-14.5, -3.6); x.quadraticCurveTo(-18.6, -5.4, -18.2, -8.0); x.quadraticCurveTo(-17.9, -9.6, -16.6, -9.2); x.stroke();
      x.lineWidth = 0.6; x.beginPath(); x.moveTo(-16.6, -9.2); x.lineTo(-16.0, -8.4); x.stroke();
      bodyPath(x);
      const g = x.createLinearGradient(0, -7, 0, 6); g.addColorStop(0, '#f0e0b4'); g.addColorStop(0.55, '#e0c690'); g.addColorStop(1, '#c4a46c');
      x.fillStyle = g; x.fill();
      x.save(); bodyPath(x); x.clip();
      // darker torn under-side (belly in shade)
      const pts = tornLine(r, -16, 13, 2.6, 1.2, 0.45, 0.5);
      x.fillStyle = '#b8955c';
      x.beginPath(); x.moveTo(pts[0][0], 9); for (const q of pts) x.lineTo(q[0], q[1] + Math.max(0, -q[0] - 4) * 0.35); x.lineTo(pts[pts.length - 1][0], 9); x.closePath(); x.fill();
      // light brush streaks on the back
      x.strokeStyle = 'rgba(255,248,225,0.6)'; x.lineWidth = 0.5;
      for (let i = 0; i < 3; i++) { const yy = -6 + i * 1.1; x.beginPath(); x.moveTo(-9 + i * 1.6, yy + 0.9); x.quadraticCurveTo(-3, yy - 0.6, 2.5 - i, yy - 0.1); x.stroke(); }
      // parsnip wrinkles: short broken pencil rings
      x.strokeStyle = 'rgba(110,75,35,0.5)'; x.lineWidth = 0.22;
      for (const [px, y0, y1] of [[-11.5, -4.4, -1.4], [-8, -5.6, -2.6], [-4.5, -6.4, -4.0], [-4.2, 0.6, 3.2], [-1, -6.6, -4.6], [-0.6, 1.8, 4.6]]) { x.beginPath(); x.moveTo(px, y0); x.quadraticCurveTo(px + 0.9, (y0 + y1) / 2, px + 0.2, y1); x.stroke(); }
      x.restore();
      // root hairs
      x.strokeStyle = 'rgba(120,90,50,0.8)'; x.lineWidth = 0.22;
      for (const [hx, hy, dx, dy] of [[-12, -0.6, -0.6, 1.4], [-7.5, 2.4, -0.2, 1.4], [-3, 4.6, 0.1, 1.2], [-14, -3.2, -1.2, 0.5]]) { x.beginPath(); x.moveTo(hx, hy); x.lineTo(hx + dx, hy + dy); x.stroke(); }
      // face on the lowered head (front)
      const fx = 7.9, ey = -0.6;
      if (eyes === 'dizzy') {
        x.fillStyle = '#f8f0dc'; x.beginPath(); x.arc(fx - 1.9, ey, 1.25, 0, TAU); x.arc(fx + 1.9, ey, 1.25, 0, TAU); x.fill();
        x.strokeStyle = C.ink; x.lineWidth = 0.3;
        for (const ex of [fx - 1.9, fx + 1.9]) {
          x.beginPath();
          for (let i = 0; i <= 24; i++) { const a = i * 0.55, rr = 0.1 + i * 0.045; const px = ex + Math.cos(a) * rr, py = ey + Math.sin(a) * rr; if (i) x.lineTo(px, py); else x.moveTo(px, py); }
          x.stroke();
        }
      } else {
        const cols = eyes === 'red' ? EYE_RED : EYE_FIRE;
        const eye = (cx, d) => () => { x.beginPath(); x.moveTo(cx - 1.35 * d, ey - 0.9); x.lineTo(cx + 1.35 * d, ey + 0.1); x.lineTo(cx - 0.9 * d, ey + 1.05); x.closePath(); };
        glowHole(x, eye(fx - 1.9, 1), fx - 1.9, ey, 1.7, cols[0], cols[1], cols[2]);
        glowHole(x, eye(fx + 1.9, -1), fx + 1.9, ey, 1.7, cols[0], cols[1], cols[2]);
      }
      // heavy brow strip
      const brow = () => { x.beginPath(); x.moveTo(fx - 4, ey - 2.7); x.lineTo(fx, ey - 1.2); x.lineTo(fx + 3.7, ey - 2.9); x.lineTo(fx + 3.5, ey - 1.6); x.lineTo(fx, ey - 0.25); x.lineTo(fx - 3.8, ey - 1.5); x.closePath(); };
      x.fillStyle = 'rgba(20,5,10,0.3)'; x.save(); x.translate(0.2, 0.3); brow(); x.fill(); x.restore();
      x.fillStyle = '#5a3a22'; brow(); x.fill();
      // snout: nostrils + snort mouth
      x.fillStyle = 'rgba(120,80,40,0.25)'; x.beginPath(); x.ellipse(9.6, 3.0, 2.4, 1.7, 0.2, 0, TAU); x.fill();
      x.fillStyle = '#4a2c18';
      x.beginPath(); x.ellipse(10.7, 2.5, 0.38, 0.6, 0.3, 0, TAU); x.ellipse(9.3, 2.8, 0.38, 0.6, 0.3, 0, TAU); x.fill();
      x.beginPath(); x.moveTo(6.4, 4.4); x.lineTo(7.6, 3.9); x.lineTo(8.6, 4.5); x.lineTo(9.8, 4.0); x.lineTo(9.5, 5.0); x.lineTo(6.8, 5.2); x.closePath(); x.fill();
      staple(x, -9.5, -2.2, 1.3, 2.0); staple(x, -8.2, -2.6, 1.4, 2.0);
    }, { rim: 0.55 });
    // curled ram horn: pivot at the base, curls back-up-down-forward
    const horn = (dark) => mkPart([-10.5, -6.6, 2.4, 5.6], (x) => {
      const base = dark ? '#7a5a3c' : '#9c7a52', ridge = dark ? 'rgba(50,30,15,0.55)' : 'rgba(60,38,18,0.55)';
      const N = 40, pts = [], a0 = -0.25, R0 = 4.9;
      for (let i = 0; i <= N; i++) {
        const t = i / N, a = a0 - t * 5.1, rr = R0 * (1 - 0.6 * t);
        pts.push([Math.cos(a) * rr - Math.cos(a0) * R0, Math.sin(a) * rr - Math.sin(a0) * R0, 3.0 * (1 - 0.68 * t)]);
      }
      x.fillStyle = base;
      for (const q of pts) { x.beginPath(); x.arc(q[0], q[1], q[2] * 0.5 + 0.35, 0, TAU); x.fill(); }
      x.fillStyle = 'rgba(40,20,5,0.18)';
      for (const q of pts) { x.beginPath(); x.arc(q[0] + 0.2, q[1] + 0.35, q[2] * 0.32, 0, TAU); x.fill(); }
      x.strokeStyle = ridge; x.lineWidth = 0.22;
      for (let i = 2; i < N; i += 3) {
        const q = pts[i], n = pts[i + 1], dx = n[0] - q[0], dy = n[1] - q[1], l = Math.hypot(dx, dy) || 1, w = q[2] * 0.5 + 0.3;
        x.beginPath(); x.moveTo(q[0] - (dy / l) * w, q[1] + (dx / l) * w); x.lineTo(q[0] + (dy / l) * w, q[1] - (dx / l) * w); x.stroke();
      }
      x.strokeStyle = 'rgba(255,240,210,0.5)'; x.lineWidth = 0.32;
      x.beginPath(); for (let i = 0; i < N * 0.7; i++) { const q = pts[i]; if (i) x.lineTo(q[0], q[1] - q[2] * 0.25); else x.moveTo(q[0], q[1] - q[2] * 0.25); } x.stroke();
    }, { rim: 0.45 });
    const leg = (dark) => mkPart([-1.8, -1, 2.6, 7.4], (x) => {
      x.beginPath(); x.moveTo(-1.4, -0.4); x.lineTo(1.4, -0.4); x.quadraticCurveTo(1.3, 3, 0.9, 5.2); x.quadraticCurveTo(1.6, 5.8, 2.2, 6.4); x.lineTo(-1.2, 6.4); x.quadraticCurveTo(-1.5, 3, -1.4, -0.4); x.closePath();
      x.fillStyle = dark ? '#a98c5c' : '#d2b882'; x.fill();
      x.fillStyle = dark ? '#5a3f28' : C.kraftDark; x.fillRect(-1.3, 5.3, 3.4, 1.1);
      x.strokeStyle = 'rgba(100,70,35,0.4)'; x.lineWidth = 0.15;
      x.beginPath(); x.moveTo(-1, 1.6); x.lineTo(1, 1.8); x.moveTo(-1, 3.2); x.lineTo(0.9, 3.4); x.stroke();
    }, { rim: 0.4 });
    return {
      body: body('n'), bodyRed: body('red'), bodyDizzy: body('dizzy'),
      hornB: horn(true), hornF: horn(false), legB: leg(true), legF: leg(false),
      leaves: [leafUp(7, 3.4, C.leafDark, 2, 0.4), leafUp(8.5, 3.8, C.leaf, 0, 0.4), leafUp(6.5, 3.2, C.leafLight, 2, 0.4)],
    };
  }
  /** mode: 'chase' | 'tele' | 'dash' | 'rest' */
  function chargerFrame(fc, mode, ph) {
    const p = P.charger || (P.charger = chargerParts());
    const s = Math.sin(ph);
    let tilt = 0, bob = -Math.abs(Math.cos(ph)) * 0.9, lf = s * 0.5, lb = -s * 0.5, lf2 = -s * 0.5, lb2 = s * 0.5, hy = -10.8;
    let body = p.body;
    if (mode === 'tele') {
      tilt = -0.2; bob = -1.2; body = p.bodyRed;
      lf = -0.9 + s * 0.6; lf2 = -0.5 - s * 0.3; lb = 0.35; lb2 = 0.25;
    } else if (mode === 'dash') {
      tilt = 0.16; bob = 0.6; body = p.bodyRed;
      lf = -1.0; lf2 = -0.8; lb = 0.95; lb2 = 0.8;
    } else if (mode === 'rest') {
      tilt = 0.05 * s; bob = 0.4; body = p.bodyDizzy;
      lf = 0.25; lf2 = -0.2; lb = 0.25; lb2 = -0.25;
    }
    const by = hy + bob;
    const rot = (px, py) => [px * Math.cos(tilt) - py * Math.sin(tilt), by + px * Math.sin(tilt) + py * Math.cos(tilt)];
    const fl = rot(6.2, 3.4), bl = rot(-6.2, 1.2), head = rot(3.8, -5.6), tuft = rot(-1.6, -6.6);
    const sw = Math.sin(ph * 2) * 0.1;
    const sp = mkSprite(composeFrame(48, 40, 24, 36, fc, [
      { p: p.legB, x: fl[0] - 2.2, y: fl[1], r: lf2 },
      { p: p.legB, x: bl[0] - 2.0, y: bl[1], r: lb2 },
      { p: p.leaves[0], x: tuft[0] - 1.2, y: tuft[1] + 1, r: -1.05 + tilt + sw },
      { p: p.leaves[2], x: tuft[0] + 0.6, y: tuft[1] + 1, r: -0.2 + tilt - sw },
      { p: p.hornB, x: head[0] - 1.5, y: head[1] + 0.3, r: tilt - 0.12 },
      { p: p.legF, x: fl[0], y: fl[1], r: lf },
      { p: p.legF, x: bl[0], y: bl[1], r: lb },
      { p: body, x: 0, y: by, r: tilt },
      { p: p.leaves[1], x: tuft[0] - 0.2, y: tuft[1] + 1.2, r: -0.6 + tilt + sw * 1.4, pin: [0, 0, 0.42] },
      { p: p.hornF, x: head[0], y: head[1] + 0.8, r: tilt, pin: [0, 0, 0.6] },
    ]), 24, 36, { dx: 1.1, dy: 1.3, blur: 0.8 });
    sp.eye = rot(7.9, -0.6); sp.top = rot(2, -9);
    return sp;
  }

  /* ===== Rüben-Ahnin ===== */
  function motherParts() {
    const r = U.rng(2401), R = 12.6, KY = 1.12;
    const body = mkPart([-R - 2, -R * KY - 2, R + 2, R * KY + 3], (x) => {
      rutaPath(x, R, KY);
      const g = x.createLinearGradient(0, -R, 0, R); g.addColorStop(0, '#f3e6bf'); g.addColorStop(1, '#e0c98e');
      x.fillStyle = g; x.fill();
      x.save(); rutaPath(x, R, KY); x.clip();
      const pts = tornLine(r, -R - 2, R + 2, -R * 0.1, 1.3, 0.55, 0.7);
      tornCap(x, pts, -R * 1.4, C.aub, 0.55);
      x.strokeStyle = rgba(C.aubLight, 0.5); x.lineWidth = 0.6;
      for (let i = 0; i < 6; i++) { const yy = r.range(-R * 0.9, -R * 0.3), xx = r.range(-R * 0.8, R * 0.2); x.beginPath(); x.moveTo(xx, yy); x.quadraticCurveTo(xx + 3, yy - 0.7, xx + r.range(4, 7), yy - 0.2); x.stroke(); }
      // age wrinkles (pencil)
      x.strokeStyle = 'rgba(100,70,40,0.4)'; x.lineWidth = 0.22;
      for (const yy of [R * 0.35, R * 0.55, R * 0.72]) { x.beginPath(); x.moveTo(-R * 0.7, yy); x.quadraticCurveTo(0, yy + 1.4, R * 0.7, yy); x.stroke(); }
      x.fillStyle = 'rgba(60,20,10,0.13)'; x.beginPath(); x.ellipse(R * 0.6, R * 0.3, R * 0.6, R * 1.1, 0, 0, TAU); x.fill();
      x.restore();
      x.strokeStyle = 'rgba(140,110,60,0.7)'; x.lineWidth = 0.26;
      for (const [hx, hy, dx] of [[-8, 7, -1.6], [8.6, 6.6, 1.5], [-5, 10, -1.1], [3, 12.4, 1]]) { x.beginPath(); x.moveTo(hx, hy); x.lineTo(hx + dx, hy + 0.9); x.stroke(); }
      // face: half-lidded glowing eyes behind round brass spectacles
      const fx = 2.6, ey = -1.2;
      for (const ex of [fx - 3.2, fx + 3.2]) {
        const lid = () => { x.beginPath(); x.ellipse(ex, ey + 0.3, 1.5, 1.0, 0, 0, Math.PI); x.closePath(); };
        glowHole(x, lid, ex, ey + 0.6, 1.6, '#fff2a0', '#ffb02e', '#e0561c');
        x.fillStyle = C.aubDeep; x.fillRect(ex - 1.8, ey + 0.05, 3.6, 0.5);
      }
      x.strokeStyle = C.brassDark; x.lineWidth = 0.55;
      for (const ex of [fx - 3.2, fx + 3.2]) { x.beginPath(); x.arc(ex, ey + 0.6, 2.25, 0, TAU); x.stroke(); }
      x.strokeStyle = C.brass; x.lineWidth = 0.32;
      for (const ex of [fx - 3.2, fx + 3.2]) { x.beginPath(); x.arc(ex, ey + 0.6, 2.25, Math.PI * 0.9, Math.PI * 1.7); x.stroke(); }
      x.strokeStyle = C.brassDark; x.lineWidth = 0.45; x.beginPath(); x.moveTo(fx - 1, ey + 0.2); x.quadraticCurveTo(fx, ey - 0.5, fx + 1, ey + 0.2); x.stroke();
      x.fillStyle = 'rgba(255,255,255,0.55)'; for (const ex of [fx - 3.9, fx + 2.5]) { x.beginPath(); x.ellipse(ex, ey - 0.4, 0.35, 0.7, 0.5, 0, TAU); x.fill(); }
      // crow's feet + stern little mouth
      x.strokeStyle = 'rgba(90,50,40,0.5)'; x.lineWidth = 0.2;
      for (const sd of [-1, 1]) for (const d of [-0.6, 0, 0.6]) { const ex = fx + sd * 5.9; x.beginPath(); x.moveTo(ex, ey + 0.6 + d * 0.6); x.lineTo(ex + sd * 1.2, ey + 0.6 + d * 1.4); x.stroke(); }
      x.fillStyle = '#4a1d34';
      x.beginPath(); x.moveTo(fx - 1.8, ey + 5.2); x.quadraticCurveTo(fx, ey + 4.3, fx + 1.8, ey + 5.2); x.quadraticCurveTo(fx, ey + 4.9, fx - 1.8, ey + 5.2); x.fill();
    }, { rim: 0.6 });
    // red polka-dot headscarf, pivot = body centre
    const scarf = mkPart([-R - 2.5, -R * KY - 3, R + 4.5, 2], (x) => {
      const path = () => {
        x.beginPath(); x.moveTo(-R - 0.8, -3.5);
        x.bezierCurveTo(-R - 1.4, -R * 1.25, R * 1.0, -R * 1.42, R + 0.9, -4.6);
        x.lineTo(R - 0.6, -3.2);
        x.bezierCurveTo(R * 0.7, -R * 0.9, -R * 0.75, -R * 0.95, -R + 1.2, -2.4);
        x.closePath();
      };
      path(); x.fillStyle = C.red; x.fill();
      x.save(); path(); x.clip();
      x.fillStyle = '#f6ead0';
      for (let i = 0; i < 16; i++) { const a = Math.PI + (i / 15) * Math.PI, rr = R * 0.92 + (i % 2) * 1.6; x.beginPath(); x.arc(Math.cos(a) * rr * 0.98, -4 + Math.sin(a) * rr * 0.98, 0.55, 0, TAU); x.fill(); }
      x.fillStyle = 'rgba(60,10,10,0.2)'; x.fillRect(0, -R * 2, R * 2, R * 2);
      x.restore();
      x.strokeStyle = 'rgba(255,240,220,0.9)'; x.lineWidth = 0.3; x.setLineDash([0.9, 0.7]);
      x.beginPath(); x.moveTo(-R + 0.2, -3.2); x.bezierCurveTo(-R * 0.75, -R * 1.02, R * 0.72, -R * 0.98, R - 0.2, -3.9); x.stroke(); x.setLineDash([]);
      // knot + two flaps on the front side
      x.fillStyle = C.redDark;
      x.beginPath(); x.moveTo(R - 0.6, -4.2); x.lineTo(R + 3.6, -1.4); x.lineTo(R + 2.2, 0.4); x.closePath(); x.fill();
      x.fillStyle = C.red;
      x.beginPath(); x.moveTo(R - 0.4, -4.4); x.lineTo(R + 3.9, -6.2); x.lineTo(R + 3.2, -3.6); x.closePath(); x.fill();
      x.beginPath(); x.ellipse(R + 0.2, -4.2, 1.3, 1.1, 0, 0, TAU); x.fill();
    }, { rim: 0.5 });
    // mustard knitted shawl over the lower body
    const shawl = mkPart([-R - 2, -2, R + 2, 9], (x) => {
      const path = () => { x.beginPath(); x.moveTo(-R - 0.4, -1.2); x.quadraticCurveTo(0, 2.4, R + 0.4, -1.2); x.lineTo(R * 0.8, 3.2); x.quadraticCurveTo(0, 6.2, -R * 0.8, 3.2); x.closePath(); };
      path(); x.fillStyle = C.mustard; x.fill();
      x.save(); path(); x.clip();
      x.strokeStyle = 'rgba(120,80,20,0.45)'; x.lineWidth = 0.22;
      for (let row = 0; row < 2; row++) for (let i = -7; i <= 7; i++) { const px = i * 1.7 + (row % 2) * 0.85, py = 1.4 + row * 1.6 + Math.abs(i) * 0.05; x.beginPath(); x.moveTo(px - 0.5, py - 0.4); x.lineTo(px, py + 0.3); x.lineTo(px + 0.5, py - 0.4); x.stroke(); }
      x.fillStyle = 'rgba(60,30,10,0.18)'; x.fillRect(2, -2, R * 2, 12);
      x.restore();
      x.strokeStyle = C.mustardDark; x.lineWidth = 0.4;
      for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { const px = sd * (R * 0.82 + i * 0.55), py = 2.4 - i * 0.9; x.beginPath(); x.moveTo(px, py); x.lineTo(px + sd * 0.4, py + 2.2); x.stroke(); }
      drawPin(x, 0, 4.2, 0.75);
    }, { rim: 0.45 });
    const baby = (cap, lean) => mkPart([-3.6, -9, 3.6, 3], (x) => {
      x.save(); x.translate(0.4, -4.4); x.rotate(-Math.PI / 2 + lean); x.translate(2, 0); drawPaperLeaf(x, 0, 4.2, 2.2, C.leafLight); x.restore();
      turnipPath(x, 2.8, 5.2); x.fillStyle = '#f1e4bf'; x.fill();
      x.save(); turnipPath(x, 2.8, 5.2); x.clip();
      tornCap(x, tornLine(U.rng(3), -4, 4, -3.2, 0.8, 0.25, 0.2), -7, cap, 0.35);
      x.restore();
      x.fillStyle = '#2a1424';
      x.beginPath(); x.arc(0.0, -2.2, 0.38, 0, TAU); x.arc(1.6, -2.2, 0.38, 0, TAU); x.fill();
      x.fillStyle = 'rgba(230,110,120,0.55)'; x.beginPath(); x.arc(-0.6, -1.2, 0.5, 0, TAU); x.arc(2.3, -1.2, 0.5, 0, TAU); x.fill();
    }, { rim: 0.35 });
    const foot = (dark) => mkPart([-3.2, -1, 5, 8.6], (x) => {
      x.fillStyle = dark ? '#b9a173' : '#d8c194';
      x.beginPath(); x.moveTo(-2.2, -0.5); x.lineTo(2.2, -0.5); x.quadraticCurveTo(2, 4.5, 1.6, 6); x.lineTo(-1.8, 6); x.quadraticCurveTo(-2.3, 4, -2.2, -0.5); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(110,80,40,0.4)'; x.lineWidth = 0.18; x.beginPath(); x.moveTo(-1.6, 2.4); x.lineTo(1.5, 2.6); x.moveTo(-1.6, 4.2); x.lineTo(1.4, 4.4); x.stroke();
      x.fillStyle = dark ? '#5a3f28' : C.kraftDark;
      x.beginPath(); x.moveTo(-2.4, 5.6); x.lineTo(2.4, 5.6); x.quadraticCurveTo(4.6, 6, 4.4, 7.6); x.lineTo(-2.4, 7.6); x.closePath(); x.fill();
    }, { rim: 0.45 });
    const cane = mkPart([-1.2, -2, 4.5, 15.6], (x) => {
      x.strokeStyle = C.kraftDark; x.lineWidth = 1.1;
      x.beginPath(); x.moveTo(0.6, 14.6); x.lineTo(0.4, 1.5); x.quadraticCurveTo(0.4, -1.3, 2.4, -1.2); x.quadraticCurveTo(3.8, -1, 3.6, 0.8); x.stroke();
      x.strokeStyle = C.kraftLight; x.lineWidth = 0.35;
      x.beginPath(); x.moveTo(0.2, 13.8); x.lineTo(0.05, 2); x.stroke();
    }, { rim: 0.4 });
    return {
      body, scarf, shawl, cane, footB: foot(true), footF: foot(false), arm: armPart('#d6c08e'),
      babies: [baby('#b4618c', -0.3), baby(C.aubLight, 0.1), baby('#843a63', 0.35)],
      leaves: [leafUp(8, 4, C.leafDark, 0, 0.45), leafUp(9, 4.4, C.leaf, 2, 0.45)],
    };
  }
  const MO = { R: 12.6, KY: 1.12 };
  function motherFrame(fc, ph) {
    const p = P.mother || (P.mother = motherParts());
    const R = MO.R, KY = MO.KY;
    const s = Math.sin(ph), bob = -Math.abs(Math.cos(ph)) * 1.1, tilt = s * 0.06;
    const cy = -6 - R * KY * 0.98 + bob;
    const rot = (px, py) => [px * Math.cos(tilt) - py * Math.sin(tilt), cy + px * Math.sin(tilt) + py * Math.cos(tilt)];
    const top = rot(0, -R * KY * 0.95), hand = rot(R * 0.95, R * 0.42), handB = rot(-R * 0.92, R * 0.3);
    const bb = (i) => Math.sin(ph * 2 + i * 1.7) * 0.4;
    return mkSprite(composeFrame(46, 52, 23, 48, fc, [
      { p: p.footB, x: -4.6, y: -8.6 + bob * 0.3, r: s * 0.3 },
      { p: p.arm, x: handB[0] + 0.5, y: handB[1], r: Math.PI - 0.3 - s * 0.2, sh: 0.25 },
      { p: p.leaves[0], x: top[0] - 1.5, y: top[1] + 1.5, r: -0.75 + tilt },
      { p: p.leaves[1], x: top[0] + 1.6, y: top[1] + 1.5, r: 0.7 + tilt },
      { p: p.footF, x: 4.6, y: -8.6 + bob * 0.3, r: -s * 0.3 },
      { p: p.body, x: 0, y: cy, r: tilt },
      { p: p.shawl, x: rot(0, R * 0.5)[0], y: rot(0, R * 0.5)[1], r: tilt },
      { p: p.scarf, x: 0, y: cy, r: tilt },
      { p: p.babies[0], x: top[0] - 5.4, y: top[1] + 2.8 + bb(0), r: -0.35 + tilt },
      { p: p.babies[2], x: top[0] + 5.6, y: top[1] + 2.6 + bb(2), r: 0.35 + tilt },
      { p: p.babies[1], x: top[0] + 0.2, y: top[1] + 0.4 + bb(1), r: tilt * 0.5, pin: [0.6, -1, 0.42] },
      { p: p.cane, x: hand[0] + 0.6, y: hand[1] - 0.6, r: -0.06 + s * 0.12 },
      { p: p.arm, x: hand[0] - 3, y: hand[1] - 1.2, r: 0.25 + s * 0.15, pin: [0.3, 0, 0.5] },
    ]), 23, 48, { dx: 1.2, dy: 1.5, blur: 0.9 });
  }

  /* ===== Rübchen ===== */
  function sproutParts(v) {
    const r = U.rng(2501 + v), W = 4.4, H = 8.4;
    const cap = v ? '#b4618c' : C.aubLight;
    const bulb = mkPart([-W - 1, -H - 1, W + 1, 2], (x) => {
      turnipPath(x, W, H);
      x.fillStyle = '#f4e8c4'; x.fill();
      x.save(); turnipPath(x, W, H); x.clip();
      tornCap(x, tornLine(r, -W - 1, W + 1, -H * 0.62, 0.8, 0.3, 0.3), -H - 2, cap, 0.4);
      x.fillStyle = 'rgba(60,20,10,0.12)'; x.beginPath(); x.ellipse(W * 0.7, -H * 0.3, W * 0.5, H * 0.6, 0, 0, TAU); x.fill();
      x.restore();
      // big cute-angry eyes
      const fx = 1.3, ey = -H * 0.44;
      for (const ex of [fx - 1.5, fx + 1.5]) {
        x.fillStyle = '#2a1424'; x.beginPath(); x.ellipse(ex, ey, 0.9, 1.1, 0, 0, TAU); x.fill();
        x.fillStyle = '#ffd23f'; x.beginPath(); x.arc(ex + 0.15, ey + 0.15, 0.45, 0, TAU); x.fill();
        x.fillStyle = '#fff'; x.beginPath(); x.arc(ex - 0.3, ey - 0.4, 0.28, 0, TAU); x.fill();
      }
      x.fillStyle = C.aubDeep;
      x.beginPath(); x.moveTo(fx - 2.8, ey - 2.1); x.lineTo(fx - 0.4, ey - 1.0); x.lineTo(fx - 0.5, ey - 0.5); x.lineTo(fx - 2.8, ey - 1.4); x.closePath(); x.fill();
      x.beginPath(); x.moveTo(fx + 2.8, ey - 2.1); x.lineTo(fx + 0.4, ey - 1.0); x.lineTo(fx + 0.5, ey - 0.5); x.lineTo(fx + 2.8, ey - 1.4); x.closePath(); x.fill();
      x.fillStyle = '#3a1830'; x.beginPath(); x.ellipse(fx, ey + 2.1, 0.7, 0.45, 0, 0, TAU); x.fill();
      x.fillStyle = 'rgba(230,110,120,0.5)'; x.beginPath(); x.arc(fx - 2.6, ey + 1.2, 0.6, 0, TAU); x.arc(fx + 2.8, ey + 1.2, 0.6, 0, TAU); x.fill();
    }, { rim: 0.4 });
    const leg = (dark) => mkPart([-1, -0.5, 1.8, 3.6], (x) => {
      x.beginPath(); x.moveTo(-0.5, 0); x.lineTo(-0.35, 2.2); x.quadraticCurveTo(0.4, 3.0, 1.3, 2.6); x.lineTo(1.0, 2.0); x.lineTo(0.4, 2.0); x.lineTo(0.5, 0); x.closePath();
      x.fillStyle = dark ? '#b9a173' : '#d8c194'; x.fill();
    }, { rim: 0.3 });
    return { bulb, legB: leg(true), legF: leg(false), leaf: leafUp(7, 4.2, v ? C.leafLight : C.leaf, 0, 0.4), leaf2: leafUp(4, 2.4, C.leafDark, 0, 0.35) };
  }
  function sproutFrame(v, fc, ph) {
    const p = P['sprout' + v] || (P['sprout' + v] = sproutParts(v));
    const s = Math.sin(ph), bob = -Math.abs(Math.cos(ph)) * 0.8, wob = s * 0.14;
    const by = -2.6 + bob, H = 8.4;
    const cx = Math.sin(wob) * H, cy = by - Math.cos(wob) * H;
    return mkSprite(composeFrame(20, 22, 10, 19, fc, [
      { p: p.legB, x: -1.1, y: by + 0.2, r: s * 0.8 },
      { p: p.leaf2, x: cx - 0.4, y: cy + 0.6, r: -0.7 + wob },
      { p: p.legF, x: 1.1, y: by + 0.2, r: -s * 0.8 },
      { p: p.bulb, x: 0, y: by, r: wob },
      { p: p.leaf, x: cx + 0.2, y: cy + 0.8, r: 0.25 + wob + Math.sin(ph * 2) * 0.15, pin: [0, 0, 0.32] },
    ]), 10, 19, { dx: 0.7, dy: 0.9, blur: 0.5 });
  }

  /* ---------- small sprites: shot, glows, stars ---------- */
  const SM = {};
  function buildSmall() {
    SM.blob = radial(64, [[0, 'rgba(48,26,12,0.62)'], [0.55, 'rgba(48,26,12,0.36)'], [1, 'rgba(48,26,12,0)']]);
    SM.glow = radial(96, [[0, 'rgba(255,214,110,0.95)'], [0.25, 'rgba(255,170,60,0.45)'], [0.6, 'rgba(240,110,30,0.12)'], [1, 'rgba(240,110,30,0)']]);
    SM.green = radial(96, [[0, 'rgba(210,255,140,0.95)'], [0.3, 'rgba(150,240,70,0.5)'], [0.65, 'rgba(90,200,40,0.14)'], [1, 'rgba(90,200,40,0)']]);
    SM.lilac = radial(96, [[0, 'rgba(240,210,255,0.9)'], [0.35, 'rgba(200,150,240,0.4)'], [1, 'rgba(160,100,220,0)']]);
    SM.red = radial(96, [[0, 'rgba(255,200,150,0.95)'], [0.3, 'rgba(255,80,40,0.5)'], [1, 'rgba(255,40,20,0)']]);
    // enemy spit: a glob of toxic green paper with dark cut edge + pale rim
    SM.shot = mkPart([-5.2, -5, 6.4, 5], (x) => {
      const path = () => {
        x.beginPath();
        x.moveTo(5.4, 0);
        x.bezierCurveTo(4.6, -2.6, 2, -4.3, -0.8, -4.1);
        x.bezierCurveTo(-3.8, -3.9, -4.6, -1.4, -4.4, 0.4);
        x.bezierCurveTo(-4.2, 2.8, -1.8, 4.2, 0.8, 4.0);
        x.bezierCurveTo(3, 3.8, 4.6, 2.2, 5.4, 0);
        x.closePath();
      };
      path(); x.fillStyle = C.toxicDark; x.fill();
      x.save(); x.translate(-0.25, -0.15); x.scale(0.84, 0.82); path(); x.fillStyle = '#7fd32f'; x.fill();
      x.clip(); x.fillStyle = '#b8f25a'; x.beginPath(); x.ellipse(-0.8, -1.2, 3.6, 2.4, -0.2, 0, TAU); x.fill();
      x.restore();
      x.fillStyle = '#f4ffd0'; x.beginPath(); x.ellipse(-1.4, -1.6, 1.4, 0.85, -0.35, 0, TAU); x.fill();
      x.fillStyle = '#2f5a18'; x.beginPath(); x.arc(1.8, 1.3, 0.5, 0, TAU); x.arc(2.9, -0.4, 0.35, 0, TAU); x.fill();
    }, { rim: 0.6, rimColor: '#f6ffde', light: 0.06, shBlur: 0.4 });
    SM.drop = mkPart([-2, -2, 2, 2], (x) => {
      x.beginPath(); x.arc(0, 0, 1.4, 0, TAU); x.fillStyle = C.toxicDark; x.fill();
      x.beginPath(); x.arc(-0.15, -0.15, 1.0, 0, TAU); x.fillStyle = '#9be33e'; x.fill();
    }, { rim: 0.4, rimColor: '#f6ffde', light: false, grain: 0.5 });
    // paper star (dizzy + spark)
    SM.star = mkPart([-2.4, -2.4, 2.4, 2.4], (x) => { starPath(x, 0, 0, 5, 2, 0.85, -Math.PI / 2); x.fillStyle = C.mustardLight; x.fill(); x.fillStyle = 'rgba(255,255,255,0.4)'; x.beginPath(); x.arc(-0.5, -0.5, 0.5, 0, TAU); x.fill(); }, { rim: 0.35, light: 0.05 });
    SM.spark = mkPart([-2.6, -2.6, 2.6, 2.6], (x) => { starPath(x, 0, 0, 6, 2.4, 0.8, 0); x.fillStyle = C.glow; x.fill(); starPath(x, 0, 0, 6, 1.3, 0.5, 0.3); x.fillStyle = '#fffbe0'; x.fill(); }, { rim: 0.3, light: false });
  }

  /* ---------- shared enemy blit: spawn / flash / torn-in-two death (exactly like the style's creeper) ---------- */
  const TEAR = [[0.1, -1.05], [-0.25, -0.85], [0.2, -0.68], [-0.15, -0.5], [0.25, -0.32], [-0.2, -0.15], [0.15, 0.02], [-0.1, 0.2]];
  function tearPath(ctx, side, h, w) {
    ctx.beginPath(); ctx.moveTo(side * w * 2, -h * 1.2);
    for (const [dx, t] of TEAR) ctx.lineTo(dx * w * 0.5, t * h);
    ctx.lineTo(side * w * 2, h * 0.3); ctx.closePath();
  }
  /** returns {sx, sy} used, or null when dying (death drawn) */
  function drawPuppet(ctx, e, s, sc, h, w, opt) {
    opt = opt || {};
    const bx = opt.dx || 0, by = opt.dy || 0;
    if (e.dying) {
      const k = e.deathT;
      h *= sc; w *= sc;
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - k * k);
        ctx.translate(e.x + side * k * w * 0.7, e.y - k * 3);
        ctx.rotate(side * k * 0.7);
        ctx.translate(0, -h * 0.4);
        tearPath(ctx, side, h, w); ctx.clip();
        blit(ctx, s, 0, h * 0.4, sc);
        ctx.strokeStyle = C.rim; ctx.lineWidth = 0.9;
        ctx.beginPath(); TEAR.forEach(([dx, t], i) => (i ? ctx.lineTo(dx * w * 0.5, t * h) : ctx.moveTo(dx * w * 0.5, t * h))); ctx.stroke();
        ctx.restore();
      }
      return null;
    }
    let sx = opt.sx || 1, sy = opt.sy || 1;
    if (e.spawnT < 1) {
      const t = e.spawnT;
      sy *= Math.max(0.06, U.ease.outBack(U.clamp((t - 0.1) / 0.9, 0, 1)));
      sx *= 1 + (1 - t) * 0.3;
    }
    blit(ctx, s, e.x + bx, e.y + by, sc, sx, sy);
    if (opt.hot > 0.02 && s.hot) { ctx.globalAlpha = opt.hot; blit(ctx, s.hot, e.x + bx, e.y + by, sc, sx, sy); }
    if (e.flash > 0.05) { ctx.globalAlpha = Math.min(0.6, e.flash * 0.9); blit(ctx, s.flash, e.x + bx, e.y + by, sc, sx, sy); }
    ctx.globalAlpha = 1;
    return { sx, sy };
  }
  /** body-space point → world */
  const at = (e, sc, f, px, py, sx, sy) => [e.x + f * px * sc * (sx || 1), e.y + py * sc * (sy || 1)];
  function glowAt(ctx, img, x, y, R, a) {
    if (a <= 0.01) return;
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, a);
    ctx.drawImage(img, x - R, y - R, R * 2, R * 2);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  const scOf = (e) => 0.93 + e.seed * 0.14;
  const fcI = (e) => (e.facing > 0 ? 1 : -1);

  /* ---------- icons (same framing as the style: no frame, white sticker rim, grain, offset shadow) ---------- */
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
  function iconPumpkin(x, cx, cy, r, face, lit) {
    x.fillStyle = '#6a4a2a'; x.fillRect(cx - 1.4, cy - r - 3.4, 2.8, 4.4);
    const lobe = (ox, rx, col) => { x.beginPath(); x.ellipse(cx + ox, cy, rx, r * 0.95, 0, 0, TAU); x.fillStyle = col; x.fill(); };
    lobe(-r * 0.45, r * 0.62, C.pumpkinDark); lobe(r * 0.45, r * 0.62, C.pumpkinDark); lobe(-r * 0.22, r * 0.6, C.pumpkin); lobe(r * 0.22, r * 0.6, C.pumpkin); lobe(0, r * 0.45, C.pumpkinLight);
    x.fillStyle = 'rgba(60,20,10,0.16)'; x.beginPath(); x.ellipse(cx + r * 0.5, cy + r * 0.3, r * 0.7, r * 0.7, 0, 0, TAU); x.fill();
    if (face) {
      const gf = (p) => (lit ? glowHole(x, p, cx, cy, r, '#fffbe0', '#ffd75a', '#ff9a2a') : (p(), (x.fillStyle = '#3a1408'), x.fill()));
      gf(() => { x.beginPath(); x.moveTo(cx - r * 0.62, cy - r * 0.05); x.lineTo(cx - r * 0.34, cy - r * 0.5); x.lineTo(cx - r * 0.06, cy - r * 0.05); x.closePath(); });
      gf(() => { x.beginPath(); x.moveTo(cx + r * 0.06, cy - r * 0.05); x.lineTo(cx + r * 0.34, cy - r * 0.5); x.lineTo(cx + r * 0.62, cy - r * 0.05); x.closePath(); });
      gf(() => { x.beginPath(); x.moveTo(cx - r * 0.62, cy + r * 0.2); x.lineTo(cx - r * 0.3, cy + r * 0.36); x.lineTo(cx, cy + r * 0.22); x.lineTo(cx + r * 0.3, cy + r * 0.36); x.lineTo(cx + r * 0.62, cy + r * 0.2); x.lineTo(cx + r * 0.4, cy + r * 0.62); x.lineTo(cx - r * 0.4, cy + r * 0.62); x.closePath(); });
    }
  }
  const ICONS = {
    leech(x) {
      // pumpkin soup bowl, steam and a little red heart
      for (const [sx, ph] of [[15, 0], [22, 1.5]]) {
        x.strokeStyle = 'rgba(255,255,255,0.92)'; x.lineWidth = 1.8; x.beginPath();
        for (let k = 0; k <= 10; k++) { const yy = 20 - k * 1.5, xx = sx + Math.sin(k * 0.8 + ph) * 2.2; if (k) x.lineTo(xx, yy); else x.moveTo(xx, yy); }
        x.stroke();
      }
      const heart = (cx, cy, s) => { x.beginPath(); x.moveTo(cx, cy + 6 * s); x.bezierCurveTo(cx - 8 * s, cy, cx - 6 * s, cy - 7 * s, cx, cy - 3 * s); x.bezierCurveTo(cx + 6 * s, cy - 7 * s, cx + 8 * s, cy, cx, cy + 6 * s); x.closePath(); };
      heart(36, 13, 1.25); x.fillStyle = C.red; x.fill();
      heart(35.4, 12.6, 0.8); x.fillStyle = '#e0604a'; x.fill();
      // bowl
      x.fillStyle = C.teal;
      x.beginPath(); x.moveTo(4, 26); x.lineTo(44, 26); x.quadraticCurveTo(43, 43, 24, 43); x.quadraticCurveTo(5, 43, 4, 26); x.closePath(); x.fill();
      x.save(); x.clip();
      x.fillStyle = C.tealDark; x.fillRect(26, 24, 22, 22);
      x.fillStyle = C.teal; x.beginPath(); x.ellipse(22, 30, 16, 14, 0, 0, TAU); x.fill();
      x.strokeStyle = 'rgba(255,240,220,0.85)'; x.lineWidth = 1.1; x.setLineDash([2, 1.6]);
      x.beginPath(); x.moveTo(6, 32); x.quadraticCurveTo(24, 36, 42, 32); x.stroke(); x.setLineDash([]);
      x.restore();
      x.fillStyle = C.pumpkin; x.beginPath(); x.ellipse(24, 26, 19, 3.6, 0, 0, TAU); x.fill();
      x.fillStyle = C.pumpkinLight; x.beginPath(); x.ellipse(19, 25.4, 8, 1.6, 0, 0, TAU); x.fill();
      seedShape(x, 30, 25.6, 5, 0.3); seedShape(x, 14, 26.4, 4.4, -0.4);
      x.fillStyle = C.tealDark; x.fillRect(17, 42, 14, 3);
    },
    thorns(x) {
      // spiky armoured turnip shell: ring of cut thorns around a purple rutabaga
      x.save(); x.translate(24, 25);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU + 0.13, c = Math.cos(a), s = Math.sin(a), px = -s, py = c;
        x.fillStyle = i % 2 ? C.kraftDark : C.card;
        x.beginPath(); x.moveTo(c * 13 + px * 3.8, s * 13 + py * 3.8); x.lineTo(c * 22.5, s * 22.5); x.lineTo(c * 13 - px * 3.8, s * 13 - py * 3.8); x.closePath(); x.fill();
      }
      x.fillStyle = C.cardDark; x.beginPath(); x.arc(0, 0, 15, 0, TAU); x.fill();
      x.strokeStyle = 'rgba(255,240,220,0.9)'; x.lineWidth = 1; x.setLineDash([2, 1.6]); x.beginPath(); x.arc(0, 0, 13.2, 0, TAU); x.stroke(); x.setLineDash([]);
      x.translate(0, 1.5);
      rutaPath(x, 10, 1); x.fillStyle = '#efe2b8'; x.fill();
      x.save(); rutaPath(x, 10, 1); x.clip();
      tornCap(x, tornLine(U.rng(71), -12, 12, 0.5, 1.6, 0.6, 0.4), -13, C.aub, 0.9);
      x.fillStyle = 'rgba(60,20,10,0.15)'; x.beginPath(); x.ellipse(6, 3, 6, 9, 0, 0, TAU); x.fill();
      x.restore();
      x.fillStyle = '#fff2a0';
      for (const sd of [-1, 1]) { x.beginPath(); x.moveTo(sd * 6, -3.6); x.lineTo(sd * 1.4, -1.6); x.lineTo(sd * 5, -0.6); x.closePath(); x.fill(); }
      x.restore();
    },
    dashup(x) {
      // rolling pumpkin with kraft speed strips and a curling motion arrow
      x.fillStyle = C.kraft;
      for (const [y0, l] of [[18, 13], [26, 17], [34, 12]]) x.fillRect(3, y0 - 1.4, l, 2.8);
      x.strokeStyle = C.mustard; x.lineWidth = 2.2;
      x.beginPath(); x.arc(30, 26, 16, -2.3, -0.7); x.stroke();
      x.fillStyle = C.mustard; x.beginPath(); x.moveTo(44, 12); x.lineTo(36.5, 11.2); x.lineTo(41.6, 17.6); x.closePath(); x.fill();
      x.save(); x.translate(30, 28); x.rotate(0.45); iconPumpkin(x, 0, 0, 12.5, true, true); x.restore();
    },
    range(x) {
      // seed flying a long dotted arc into a paper target
      x.strokeStyle = C.teal; x.lineWidth = 2.6; x.setLineDash([0.1, 4.2]);
      x.beginPath(); x.moveTo(5, 43); x.quadraticCurveTo(12, 2, 33, 10); x.stroke(); x.setLineDash([]);
      const T = [37, 34];
      for (const [rr, col] of [[10, C.red], [7.2, C.cream], [4.4, C.red], [1.8, C.cream]]) { x.fillStyle = col; x.beginPath(); x.ellipse(T[0], T[1], rr, rr * 0.9, 0, 0, TAU); x.fill(); }
      x.fillStyle = 'rgba(60,20,10,0.18)'; x.beginPath(); x.ellipse(T[0] + 3, T[1] + 2, 8, 7, 0, 0, TAU); x.fill();
      seedShape(x, 30, 12, 15, 0.55);
      x.fillStyle = C.mustard;
      for (const [sx, sy, sr] of [[44, 22, 3.2]]) { starPath(x, sx, sy, 4, sr, sr * 0.38, 0); x.fill(); }
    },
  };

  /* ---------- particles on kill (paper scraps in the enemy's own colours) ---------- */
  const PAL = {
    spitter: ['#5a3466', '#ebe8b8', C.toxic, C.lime, '#cfd48e'],
    bomber: [C.beet, C.beetDark, C.pumpkin, C.leafDark],
    charger: ['#ead6a6', C.kraft, '#a8875e', C.leaf],
    mother: [C.aub, '#f3e6bf', C.red, C.mustard, C.aubLight],
    sprout: [C.aubLight, '#b4618c', '#f4e8c4', C.leafLight],
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

  const SHADOW = { spitter: [8.5, 3.2], bomber: [7, 2.8], charger: [12.5, 3.8], mother: [14.5, 4.8], sprout: [5.4, 2.2] };

  CT.art('paper', {
    init() {
      const t = cv(2, 2).getContext('2d');
      HAS_FILTER = typeof t.filter === 'string' && t.filter === 'none';
      buildGrain();
      buildSmall();
    },
    enemies: {
      spitter(ctx, e, view) {
        const sc = scOf(e) * 1.02, f = fcI(e);
        let s, opt = {};
        if (e.mode === 'aim' && !e.dying) {
          const lv = Math.min(3, 1 + Math.floor((e.charge || 0) * 3));
          s = frame('sp:a' + lv + (f > 0 ? 'R' : 'L'), () => spitterFrame(f, 0, lv / 3), view);
          opt.dx = Math.sin(view.rt * 70 + e.seed * 9) * 0.35 * e.charge;
        } else {
          const i = phaseIdx(e.anim, 0.42);
          s = frame('sp:w' + i + (f > 0 ? 'R' : 'L'), () => spitterFrame(f, (i / NF) * TAU, 0), view);
          const k = e.spit || 0;
          if (k > 0) { opt.sx = 1 + 0.16 * k; opt.sy = 1 - 0.13 * k; opt.dx = -f * 1.6 * k; }
        }
        const r = drawPuppet(ctx, e, s, sc, 26, 11, opt);
        if (!r || e.spawnT < 1) return;
        if (e.mode === 'aim') {
          const c = e.charge || 0, m = spitMouth(Math.min(3, 1 + Math.floor(c * 3)) / 3);
          const [mx, my] = at(e, sc, f, m[0], m[1]);
          glowAt(ctx, SM.green, mx + (opt.dx || 0), my, 5 + 8 * c, 0.3 + 0.65 * c);
        } else if (e.spit > 0) {
          const k = e.spit, m = spitMouth(0);
          const [mx, my] = at(e, sc, f, m[0], m[1], r.sx, r.sy);
          glowAt(ctx, SM.green, mx, my, 9 * k, 0.8 * k);
          ctx.globalAlpha = Math.min(1, k * 1.6);
          for (let i = 0; i < 5; i++) {
            const a = (i - 2) * 0.32 + (e.seed - 0.5) * 0.4, d = 2 + (1 - k) * (9 + i * 2.2);
            blitPart(ctx, SM.drop, mx + f * Math.cos(a) * d, my + Math.sin(a) * d - (1 - k) * 2 + (i % 2) * 1.2, 0.55 + 0.25 * k);
          }
          ctx.globalAlpha = 1;
        }
      },
      bomber(ctx, e, view) {
        const f = fcI(e), i = phaseIdx(e.anim, e.armed ? 0.9 : 0.75);
        const s = frame('bo:' + i + (f > 0 ? 'R' : 'L'), () => bomberFrame(f, (i / NF) * TAU), view);
        let sc = scOf(e) * 0.97, hot = 0, opt = {};
        if (e.armed && !e.dying) {
          const fu = e.fuse || 0;
          const freq = 5 + fu * 22;
          const on = Math.sin(view.rt * freq * TAU * 0.5 + e.seed * 10) > 0;
          const pulse = 1 + 0.12 * fu + (on ? 0.05 : 0);
          opt.sx = pulse; opt.sy = pulse;
          hot = on ? 0.75 : 0.12;
          opt.hot = hot;
          opt.dx = Math.sin(view.rt * 80) * 0.5 * fu;
        }
        const r = drawPuppet(ctx, e, s, sc, 20, 9, opt);
        if (!r) return;
        if (e.spawnT < 1) return;
        // fuse spark
        const fu = e.armed ? e.fuse || 0 : 0;
        const [tx, ty] = at(e, sc, f, s.tip[0], s.tip[1], r.sx, r.sy);
        const flick = 0.75 + 0.25 * Math.sin(view.rt * 31 + e.seed * 7);
        glowAt(ctx, SM.glow, tx + (opt.dx || 0), ty, (4 + fu * 8) * flick, 0.55 + fu * 0.4);
        ctx.save(); ctx.translate(tx + (opt.dx || 0), ty); ctx.rotate(view.rt * 9 + e.seed * 5);
        blitPart(ctx, SM.spark, 0, 0, (0.55 + fu * 0.7) * flick);
        ctx.restore();
      },
      charger(ctx, e, view) {
        const f = fcI(e), sc = scOf(e) * 1.0;
        const mode = e.dying ? 'chase' : e.mode || 'chase';
        let s, opt = {};
        const t = view.rt;
        if (mode === 'tele') {
          const i = Math.floor(t * 9 + e.seed * 4) & 1;
          s = frame('ch:t' + i + (f > 0 ? 'R' : 'L'), () => chargerFrame(f, 'tele', i * Math.PI), view);
          const k = Math.min(1, (e.modeT || 0) / 0.72);
          opt.dx = Math.sin(t * 75 + e.seed * 9) * (0.3 + 0.7 * k);
          opt.dy = -Math.abs(Math.sin(t * 9)) * 0.6;
        } else if (mode === 'dash') {
          const i = Math.floor(t * 16) & 1;
          s = frame('ch:d' + i + (f > 0 ? 'R' : 'L'), () => chargerFrame(f, 'dash', i * Math.PI * 0.5), view);
          opt.sx = 1.1; opt.sy = 0.93;
          // speed smear: fading copies behind + cream paper speed strips
          const dx = e.dashX || f, dy = e.dashY || 0;
          for (let k2 = 3; k2 >= 1; k2--) { ctx.globalAlpha = 0.3 - k2 * 0.07; blit(ctx, s, e.x - dx * k2 * 7, e.y - dy * k2 * 7, sc, 1.1, 0.93); }
          ctx.globalAlpha = 0.8; ctx.strokeStyle = C.rim; ctx.lineCap = 'round';
          for (let j = 0; j < 3; j++) {
            const oy = -8 - j * 6, ox = ((t * 60 + j * 17) % 14);
            ctx.lineWidth = 1.4 - j * 0.3;
            ctx.beginPath(); ctx.moveTo(e.x - dx * (10 + ox), e.y + oy - dy * (10 + ox)); ctx.lineTo(e.x - dx * (22 + ox + j * 3), e.y + oy - dy * (22 + ox)); ctx.stroke();
          }
          ctx.globalAlpha = 1;
        } else if (mode === 'rest') {
          const i = Math.floor(t * 5 + e.seed * 3) % 3;
          s = frame('ch:r' + i + (f > 0 ? 'R' : 'L'), () => chargerFrame(f, 'rest', (i / 3) * TAU), view);
          opt.dx = Math.sin(t * 7) * 0.8;
        } else {
          const i = phaseIdx(e.anim, 0.5);
          s = frame('ch:c' + i + (f > 0 ? 'R' : 'L'), () => chargerFrame(f, 'chase', (i / NF) * TAU), view);
        }
        const r = drawPuppet(ctx, e, s, sc, 26, 14, opt);
        if (!r || e.spawnT < 1) return;
        if (mode === 'tele' || mode === 'dash') {
          // red glare in the eyes
          const [ex, ey] = at(e, sc, f, s.eye[0], s.eye[1], r.sx, r.sy);
          glowAt(ctx, SM.red, ex + (opt.dx || 0), ey, mode === 'tele' ? 6 + 4 * Math.min(1, e.modeT / 0.72) : 6, 0.75);
          if (mode === 'tele') {
            // scraping dust puffs at the front hoof
            const [hx, hy] = at(e, sc, f, 8, 0);
            ctx.fillStyle = '#e6d6b4';
            for (let j = 0; j < 3; j++) {
              const ph = (t * 3 + j / 3) % 1;
              ctx.globalAlpha = 0.55 * (1 - ph);
              ctx.beginPath(); ctx.arc(hx - f * ph * 9 - f * j, hy - ph * 4, 1.2 + ph * 2.2, 0, TAU); ctx.fill();
            }
            ctx.globalAlpha = 1;
          }
        } else if (mode === 'rest') {
          // dizzy: paper stars circling the head
          const [hx, hy] = at(e, sc, f, s.top[0], s.top[1] - 4);
          for (let j = 0; j < 3; j++) {
            const a = t * 5 + (j / 3) * TAU, d = Math.sin(a);
            const px = hx + Math.cos(a) * 7.5, py = hy + d * 2.2;
            blitPartShadow(ctx, SM.star, px + 0.5, py + 0.7, 0.8 + 0.25 * d, 0.3);
            blitPart(ctx, SM.star, px, py, 0.8 + 0.25 * d);
          }
        }
      },
      mother(ctx, e, view) {
        const f = fcI(e), i = phaseIdx(e.anim, 0.3);
        const s = frame('mo:' + i + (f > 0 ? 'R' : 'L'), () => motherFrame(f, (i / NF) * TAU), view);
        const sc = 0.96 + e.seed * 0.08;
        const b = e.dying ? 0 : e.birth || 0;
        const opt = {};
        if (b > 0) {
          const w = Math.sin((1 - b) * Math.PI * 3) * b;
          opt.sy = 1 + 0.16 * w; opt.sx = 1 - 0.12 * w;
        }
        if (b > 0) glowAt(ctx, SM.lilac, e.x, e.y - 18 * sc, 26 + 8 * (1 - b), b * 0.7);
        const r = drawPuppet(ctx, e, s, sc, 40, 17, opt);
        if (!r) return;
        if (b > 0.05) {
          // little paper stars popping off her head
          const [hx, hy] = at(e, sc, f, 0, -42);
          for (let j = 0; j < 4; j++) {
            const a = -Math.PI / 2 + (j - 1.5) * 0.7, d = (1 - b) * 14 + 4;
            ctx.globalAlpha = Math.min(1, b * 2);
            blitPart(ctx, SM.star, hx + Math.cos(a) * d, hy + Math.sin(a) * d * 0.8, 0.7);
          }
          ctx.globalAlpha = 1;
        }
      },
      sprout(ctx, e, view) {
        const f = fcI(e), v = e.seed < 0.5 ? 0 : 1, i = phaseIdx(e.anim, 0.85);
        const s = frame('so:' + v + i + (f > 0 ? 'R' : 'L'), () => sproutFrame(v, f, (i / NF) * TAU), view);
        drawPuppet(ctx, e, s, 0.95 + e.seed * 0.1, 14, 6);
      },
    },
    shadow(ctx, o) {
      const d = SHADOW[o.type];
      if (!d || !SM.blob) return false;
      let a = 1;
      if (o.dying) a *= 1 - o.deathT; else if (o.spawnT < 1) a *= o.spawnT;
      if (a <= 0.02) return;
      let rw = d[0], rh = d[1];
      if (o.type === 'bomber' && o.armed) { rw *= 1 + 0.12 * (o.fuse || 0); }
      ctx.globalAlpha = a * 0.75;
      ctx.drawImage(SM.blob, o.x - rw + 1.2, o.y - rh + 0.6, rw * 2, rh * 2);
      ctx.globalAlpha = 1;
    },
    onKill(game, e) {
      const big = e.type === 'mother', small = e.type === 'sprout';
      const cols = PAL[e.type] || PAL.sprout;
      scraps(game, e.x, e.y, big ? 22 : small ? 6 : 12, big ? 14 : small ? 4 : 8, cols, big ? 3.4 : small ? 1.8 : 2.6, big ? 80 : 60);
      confettiBurst(game, e.x, e.y, big ? 20 : 10, big ? 10 : small ? 2 : 5, big ? 85 : 60, 0.8, 1.3);
    },
    shot(ctx, s, view) {
      const y = s.y - s.z;
      const sp = Math.hypot(s.vx, s.vy) || 1, ux = s.vx / sp, uy = s.vy / sp;
      // trail of droplets
      for (let i = 1; i <= 3; i++) {
        ctx.globalAlpha = 0.85 - i * 0.2;
        blitPart(ctx, SM.drop, s.x - ux * i * 4.6 + Math.sin(s.age * 20 + i) * 0.5, y - uy * i * 4.6 + Math.cos(s.age * 17 + i) * 0.5, 0.95 - i * 0.18);
      }
      ctx.globalAlpha = 1;
      glowAt(ctx, SM.green, s.x, y, 12, 0.55 + 0.15 * Math.sin(view.rt * 14 + s.seed * 9));
      const wob = 1 + 0.1 * Math.sin(view.rt * 18 + s.seed * 10);
      ctx.save(); ctx.translate(s.x, y); ctx.rotate(Math.atan2(uy, ux)); ctx.scale(wob, 2 - wob);
      blitPartShadow(ctx, SM.shot, 0.5, 0.8, 0.95, 0.35);
      blitPart(ctx, SM.shot, 0, 0, 0.95);
      ctx.restore();
    },
    icons: (() => {
      const out = {};
      for (const id of Object.keys(ICONS)) {
        out[id] = function (ctx, size) {
          if (!GRAIN) buildGrain();
          const key = id + ':' + size;
          let c = ICON_CACHE[key];
          if (!c) c = ICON_CACHE[key] = paperIcon(size, ICONS[id]);
          ctx.drawImage(c, 0, 0);
        };
      }
      return out;
    })(),
  });
})();
