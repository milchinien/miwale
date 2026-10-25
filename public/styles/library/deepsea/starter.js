/* Deep Sea Glow — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   Core trick: the world is almost black navy; every light comes from something alive. Dark bodies get a thin
   cold rim light from above, emissive spots (photophores, polyps, bulbs, lamp) are painted bright and get a soft
   halo from cached radial-glow sprites added with 'lighter'. Light pools on the sea floor replace shadows.
   Atmosphere = marine snow in parallax layers, soft shafts from far above and a blue depth fog at the edges.
   Ground and glow sprites are cached; per frame it is drawImage + a few vector paths. */
(function (root) {
  'use strict';
  const PALETTE = {
    abyss: '#040b18', sand: '#07101f', sandLight: '#162842', crest: '#2c4a6e', silt: '#09091b', siltLight: '#1a1838',
    rock: '#060a13', rockTop: '#1f2f48', rockRim: '#547aa6',
    cyan: '#59e8ff', teal: '#34f0c8', aqua: '#c4fdff', violet: '#9d7dff', pink: '#ff6fd2', rose: '#ff7fae', mint: '#8dffe0',
    lamp: '#fff1c8', lampGlow: '#ffc46b', suit: '#1f4d6e', suitDark: '#112e46', suitLight: '#3f7fa6', metal: '#4b6a80',
    kelp: '#16423a', kelpLeaf: '#245c4c', coral: '#3f2870', bone: '#7d90a0', glass: '#1a486a',
  };
  const P = PALETTE, TAU = Math.PI * 2;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const rgba = (h, a) => { const c = hex(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; };
  function hash(i, j, s) { let h = (Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function noise(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  const fbm = (x, y, s) => (noise(x, y, s) * 0.55 + noise(x * 2.1, y * 2.1, s + 7) * 0.3 + noise(x * 4.3, y * 4.3, s + 13) * 0.15);

  /* ---- glow sprites: one radial gradient per colour, cached; drawn with 'lighter' ---- */
  const GLOW = {};
  function glow(col) {
    if (GLOW[col]) return GLOW[col];
    const c = mk(64, 64), g = c.getContext('2d'), rg = g.createRadialGradient(32, 32, 0, 32, 32, 32), k = hex(col);
    const w = (t) => k.map((v) => Math.round(v + (255 - v) * t));
    rg.addColorStop(0, 'rgba(' + w(0.85) + ',1)'); rg.addColorStop(0.12, 'rgba(' + w(0.5) + ',0.95)');
    rg.addColorStop(0.3, rgba(col, 0.55)); rg.addColorStop(0.62, rgba(col, 0.1)); rg.addColorStop(1, rgba(col, 0));
    g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
    return (GLOW[col] = c);
  }
  function light(ctx, col, x, y, r, a, sq) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
    ctx.drawImage(glow(col), x - r, y - r * (sq || 1), r * 2, r * 2 * (sq || 1));
    ctx.restore();
  }
  const dot = (ctx, x, y, r, fill) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = fill; ctx.fill(); };

  /* ---- the sea floor: per-pixel sand ripples, light patches, a terraced rock shelf (cached per size) ---- */
  let GROUND = null, GKEY = '';
  function ground(w, h) {
    const key = w + 'x' + h;
    if (GKEY === key) return GROUND;
    const c = mk(w / 2, h / 2), g = c.getContext('2d'), img = g.createImageData(c.width, c.height), d = img.data, s = c.height / 360; // half resolution, upscaled
    const sand0 = hex(P.sand), sand1 = hex(P.sandLight), crest = hex(P.crest), rock0 = hex(P.rock), rock1 = hex(P.rockTop), rim = hex(P.rockRim);
    for (let py = 0; py < c.height; py++) for (let px = 0; px < c.width; px++) {
      const x = px / s, y = py / s;
      const L = fbm(x / 120, y / 120, 3), R = fbm(x / 120 + 5, y / 120, 9), g1 = hash(px >> 1, py >> 1, 5);
      let t = Math.min(1, Math.max(0, L * 2.2 - 0.7 + (g1 - 0.5) * 0.25));
      let col = sand0.map((v, i) => v + (sand1[i] - v) * t);
      const rip = Math.sin((x * 0.9 + y * 0.42) * 0.66 + fbm(x / 80, y / 80, 4) * 7);
      const amp = Math.max(0, Math.min(1, (fbm(x / 110, y / 110, 21) - 0.52) * 6)) * 0.7;
      if (rip > 0.55) { const k = ((rip - 0.55) * 2.2) ** 2 * amp * 0.4; col = col.map((v, i) => v + (crest[i] - v) * k); }
      else if (rip < -0.2) col = col.map((v) => v * (1 - (-0.2 - rip) * amp * 0.3));
      const e = R - 0.7;                                    // rock shelf with terraces and a lit upper lip
      if (e > -0.03) {
        if (e < 0) col = col.map((v) => v * (1 - 0.6 * (1 + e / 0.03) ** 2));
        else {
          const tf = (e * 24) % 1;
          let b = 0.3 + 0.3 * tf + (g1 - 0.5) * 0.3 + (tf < 0.15 ? (1 - tf / 0.15) * 0.45 : 0) - (tf > 0.93 ? 0.4 : 0);
          col = b <= 1 ? rock0.map((v, i) => v + (rock1[i] - v) * Math.max(0, b)) : rock1.map((v, i) => v + (rim[i] - v) * Math.min(1, b - 1));
        }
      }
      const o = (py * c.width + px) * 4;
      d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    // decals: glowing microbial mat, plankton specks, burrows, a brine pool with a glowing rim
    g.save(); g.scale(s, s);
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 260; i++) { g.fillStyle = rgba([P.cyan, P.teal, P.violet, P.pink][i & 3], 0.25 + hash(i, 1, 2) * 0.4); g.fillRect(hash(i, 2, 2) * c.width / s, hash(i, 3, 2) * 360, 0.45, 0.45); }
    for (let i = 0; i < 60; i++) {
      const a = hash(i, 4, 3) * TAU, r = Math.sqrt(hash(i, 5, 3)) * 22;
      dot(g, c.width / s * 0.22 + Math.cos(a) * r, 300 + Math.sin(a) * r * 0.65, 0.3 + hash(i, 6, 3) * 0.3, rgba(P.aqua, 0.8));
    }
    g.globalCompositeOperation = 'source-over';
    const px0 = c.width / s * 0.8, py0 = 285;
    g.beginPath(); g.ellipse(px0, py0, 46, 26, 0, 0, TAU); g.fillStyle = '#17243a'; g.fill();
    g.beginPath(); g.ellipse(px0, py0, 42, 23, 0, 0, TAU);
    const pg = g.createLinearGradient(0, py0 - 23, 0, py0 + 23); pg.addColorStop(0, '#0a0c22'); pg.addColorStop(1, '#020308');
    g.fillStyle = pg; g.fill();
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = P.violet;
    for (const [lw, a] of [[6, 0.05], [2.6, 0.12], [0.6, 0.6]]) { g.globalAlpha = a; g.lineWidth = lw; g.stroke(); }
    g.restore();
    GROUND = c; GKEY = key;
    return c;
  }

  /* ---- props (world units, base at 0,0) ---- */
  function kelp(ctx, x, y, H, t, ph) {
    const sw = Math.sin(t * 0.8 + ph) * 4;
    const pt = (k) => [x + 2 * (1 - k) * k * (-sw * 0.6) + k * k * sw, y - 2 * (1 - k) * k * H * 0.5 - k * k * H];
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - sw * 0.6, y - H * 0.5, x + sw, y - H);
    ctx.strokeStyle = P.kelp; ctx.lineWidth = 1.15; ctx.stroke();
    for (let i = 0; i < 9; i++) {
      const k = 0.1 + i / 9 * 0.88, [bx, by] = pt(k), a = (i % 2 ? -0.75 : -2.4), L = 12 * (1 - k * 0.35);
      ctx.beginPath(); ctx.ellipse(bx + Math.cos(a) * L / 2, by + Math.sin(a) * L / 2, L / 2, 1.5, a, 0, TAU);
      ctx.fillStyle = P.kelpLeaf; ctx.fill();
      dot(ctx, bx, by, 0.95, '#c6fff0'); light(ctx, P.teal, bx, by, 5, 0.5);
    }
  }
  function anemone(ctx, x, y, col, t) {
    ctx.beginPath(); ctx.moveTo(x - 3.2, y); ctx.quadraticCurveTo(x - 2.4, y - 3, x - 3.6, y - 6.4); ctx.lineTo(x + 3.6, y - 6.4); ctx.quadraticCurveTo(x + 2.4, y - 3, x + 3.2, y); ctx.fillStyle = '#3e2a5e'; ctx.fill();
    for (let i = 0; i < 14; i++) {
      const u = i / 13, an = Math.PI + 0.15 + u * (Math.PI - 0.3), bx = x + Math.cos(an) * 3.8, by = y - 6.6;
      const ex = bx + Math.cos(an) * 6 + Math.sin(t * 1.2 + i) * 0.4, ey = by - 8 * (0.55 + 0.4 * Math.sin(u * Math.PI));
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + Math.cos(an) * 1.5, by - 5, ex, ey);
      ctx.strokeStyle = rgba(col, 0.9); ctx.lineWidth = 0.8; ctx.stroke(); dot(ctx, ex, ey, 0.45, '#ffffff');
    }
    light(ctx, col, x, y - 11, 14, 0.35 + 0.15 * Math.sin(t * 1.6)); light(ctx, col, x, y, 12, 0.3, 0.42);
  }
  function tubeWorms(ctx, x, y, t) {
    for (let i = 0; i < 7; i++) {
      const tx = x - 8 + i * 2.6, h = 10 + hash(i, 9, 1) * 13, top = y - h;
      ctx.beginPath(); ctx.moveTo(tx, y); ctx.lineTo(tx + (i - 3) * 0.3, top); ctx.strokeStyle = '#7a8b9a'; ctx.lineWidth = 1.8; ctx.stroke();
      for (let k = 0; k < 6; k++) { const an = -Math.PI / 2 + (k / 5 - 0.5) * 2.1; ctx.beginPath(); ctx.moveTo(tx, top); ctx.lineTo(tx + Math.cos(an) * 3.2, top + Math.sin(an) * 3.2); ctx.strokeStyle = '#ff8aaa'; ctx.lineWidth = 0.45; ctx.stroke(); }
      light(ctx, P.rose, tx, top, 5, 0.55);
    }
    light(ctx, P.rose, x, y, 15, 0.3, 0.42);
  }

  /* ---- characters (feet at x, y; world units; facing 1 = right) ---- */
  function drawHero(ctx, x, y, t, facing) {
    const f = facing < 0 ? -1 : 1, bob = Math.sin(t * 2.1) * 0.7;
    light(ctx, P.cyan, x, y, 17, 0.4, 0.42);                               // aqua light pool
    light(ctx, P.lampGlow, x + f * 34, y, 30, 0.42, 0.36);                 // lamp pool on the floor ahead
    ctx.save(); ctx.translate(x, y + bob); ctx.scale(f, 1);
    ctx.save(); ctx.translate(6.5, -28.6); ctx.rotate(0.36);                // volumetric lamp beam
    const bg = ctx.createLinearGradient(0, 0, 64, 0); bg.addColorStop(0, 'rgba(255,236,190,0.4)'); bg.addColorStop(1, 'rgba(255,220,160,0)');
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(64, -11); ctx.lineTo(64, 11); ctx.lineTo(0, 1); ctx.fill();
    ctx.restore();
    const leg = (hx, p, col) => { const fx = hx + Math.sin(p) * 2.5; ctx.beginPath(); ctx.moveTo(hx, -8); ctx.lineTo(fx, -1.4); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(fx - 1.6, -1.9); ctx.quadraticCurveTo(fx + 4.6, -2.1, fx + 7.4, -1.4); ctx.lineTo(fx + 7.6, -0.4); ctx.quadraticCurveTo(fx + 2, 0.4, fx - 1.5, 0); ctx.fillStyle = '#17445f'; ctx.fill();
      ctx.strokeStyle = 'rgba(120,246,255,0.9)'; ctx.lineWidth = 0.42; ctx.beginPath(); ctx.moveTo(fx + 2.4, -2.1); ctx.lineTo(fx + 7.5, -1); ctx.stroke(); };
    ctx.fillStyle = P.metal; ctx.fillRect(-7.6, -19.2, 4.2, 10);                                         // air tank
    dot(ctx, -5.5, -16, 0.62, '#a8ffd8');
    leg(-0.8, t * 2 + Math.PI, P.suitDark); leg(1, t * 2, P.suit);
    ctx.beginPath(); ctx.ellipse(0.4, -12.2, 4.3, 5.3, 0, 0, TAU);
    const sg = ctx.createLinearGradient(0, -17.5, 0, -7); sg.addColorStop(0, P.suitLight); sg.addColorStop(0.4, P.suit); sg.addColorStop(1, P.suitDark);
    ctx.fillStyle = sg; ctx.fill();
    ctx.beginPath(); ctx.moveTo(1.6, -16.6); ctx.quadraticCurveTo(4.2, -13, 3, -10.2); ctx.strokeStyle = 'rgba(120,244,255,0.85)'; ctx.lineWidth = 0.32; ctx.stroke();
    dot(ctx, 2.6, -13.8, 0.85, '#d4feff');
    ctx.beginPath(); ctx.moveTo(1.4, -15.4); ctx.lineTo(3.6, -13.4); ctx.lineTo(4.6, -11); ctx.strokeStyle = P.suit; ctx.lineWidth = 2.3; ctx.stroke();
    const hx = 1, hy = -23.2, hr = 6.8;                                                                    // dome helmet
    const hg = ctx.createRadialGradient(hx + 1.8, hy - 1.4, 0.5, hx, hy, hr); hg.addColorStop(0, 'rgba(76,156,196,0.92)'); hg.addColorStop(0.55, 'rgba(26,72,106,0.95)'); hg.addColorStop(1, 'rgba(10,30,52,0.98)');
    dot(ctx, hx, hy, hr, hg);
    const fg = ctx.createRadialGradient(hx + 2.6, hy - 0.2, 0.3, hx + 1.7, hy + 0.7, 3.4); fg.addColorStop(0, '#ffe5cc'); fg.addColorStop(0.6, '#e9a987'); fg.addColorStop(1, '#8a5246');
    dot(ctx, hx + 1.7, hy + 0.7, 3.4, fg);
    dot(ctx, hx + 2.7, hy + 0.25, 0.52, '#13131d'); dot(ctx, hx + 4.3, hy + 0.35, 0.46, '#13131d');
    ctx.beginPath(); ctx.arc(hx, hy, hr - 1.2, -2.75, -1.7); ctx.strokeStyle = 'rgba(230,252,255,0.75)'; ctx.lineWidth = 0.85; ctx.stroke();
    ctx.beginPath(); ctx.arc(hx, hy, hr, 0, TAU); ctx.strokeStyle = '#5e8096'; ctx.lineWidth = 1.15; ctx.stroke();
    ctx.restore();
    light(ctx, P.cyan, x + f, y + bob - 20, 16, 0.45);                    // helmet + seam halo
    light(ctx, P.lampGlow, x + f * 6.5, y + bob - 28.6, 5, 1);           // lamp lens
  }
  function drawEnemy(ctx, x, y, t) {                                      // the small creature: a jellyfish
    const pulse = 0.5 + 0.5 * Math.cos(t * 5.3), rx = 6.2 + 2.3 * pulse, ry = 7.8 - 1.9 * pulse, rim = y - 15.5 - (1 - pulse) * 1.4 + Math.sin(t * 1.4) * 1.6;
    light(ctx, P.pink, x, y, 21, 0.34, 0.42);
    for (let i = 0; i < 7; i++) {
      const x0 = x + (-0.82 + i * 0.273) * rx;
      ctx.beginPath(); ctx.moveTo(x0, rim);
      for (let k = 1; k <= 6; k++) ctx.lineTo(x0 + Math.sin(t * 5 - k * 0.75 + i * 1.3) * 0.32 * k, rim + k * 1.9);
      ctx.strokeStyle = 'rgba(255,160,232,0.6)'; ctx.lineWidth = 0.32; ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(x - rx, rim); ctx.bezierCurveTo(x - rx, rim - ry * 1.32, x + rx, rim - ry * 1.32, x + rx, rim); ctx.quadraticCurveTo(x, rim + 1.6, x - rx, rim);
    const g = ctx.createRadialGradient(x - rx * 0.25, rim - ry * 0.75, 0.4, x, rim - ry * 0.3, rx * 1.05);
    g.addColorStop(0, 'rgba(255,222,250,0.95)'); g.addColorStop(0.4, 'rgba(236,124,234,0.8)'); g.addColorStop(1, 'rgba(112,52,192,0.72)');
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(255,205,246,0.9)'; ctx.lineWidth = 0.4; ctx.stroke();
    for (let i = 0; i <= 8; i++) dot(ctx, x - rx + (i / 8) * 2 * rx, rim + 0.2, 0.36, '#fff2fc');
    light(ctx, P.pink, x, rim - ry * 0.4, 15, 0.6);
  }
  function lanternFish(ctx, x, y, t, f) {
    const cy = y - 12 + Math.sin(t * 3.1) * 0.9, w = Math.sin(t * 14) * 0.38;
    light(ctx, P.cyan, x, y, 18, 0.24, 0.42);
    ctx.save(); ctx.translate(x, cy); ctx.scale(f, 1);
    ctx.save(); ctx.translate(-6.6, 0); ctx.rotate(w); ctx.beginPath(); ctx.moveTo(0.8, -1); ctx.lineTo(-5.6, -4.7); ctx.quadraticCurveTo(-3.8, 0, -5.6, 4.5); ctx.lineTo(0.8, 1); ctx.fillStyle = 'rgba(46,96,146,0.7)'; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.moveTo(9.2, 0.2); ctx.bezierCurveTo(8, -3.9, 2, -4.4, -3.5, -2.6); ctx.quadraticCurveTo(-6, -1.6, -7, 0); ctx.quadraticCurveTo(-6, 1.4, -3.5, 2.4); ctx.bezierCurveTo(1.5, 4, 7.5, 3.4, 9.2, 0.2);
    const g = ctx.createLinearGradient(0, -4.2, 0, 3.6); g.addColorStop(0, '#0d223c'); g.addColorStop(0.45, '#1e4168'); g.addColorStop(1, '#6b97c0'); ctx.fillStyle = g; ctx.fill();
    dot(ctx, 5.7, -0.7, 2, '#03070e'); ctx.strokeStyle = 'rgba(150,250,255,0.9)'; ctx.lineWidth = 0.38; ctx.beginPath(); ctx.arc(5.7, -0.7, 1.75, 0, TAU); ctx.stroke();
    for (let i = 0; i < 8; i++) dot(ctx, -4.6 + i * 1.5, 2.3 + 0.55 * Math.sin(i / 7 * Math.PI) - (i > 5 ? (i - 5) * 0.5 : 0), 0.5, '#c8fdff');
    ctx.restore();
    for (let i = 0; i < 4; i++) light(ctx, P.cyan, x + f * (-3 + i * 3), cy + 2.4, 4, 0.7);
  }
  function angler(ctx, x, y, t, f) {
    const cy = y - 24 + Math.sin(t * 0.9) * 1.4, j = 0.5 + 0.5 * Math.sin(t * 2.2);
    light(ctx, P.violet, x, y, 32, 0.2, 0.42);
    ctx.save(); ctx.translate(x, cy); ctx.scale(f, 1);
    ctx.beginPath(); ctx.moveTo(17.5, -5 - j * 0.6); ctx.bezierCurveTo(15.5, -13, 6, -17.5, -3, -16); ctx.bezierCurveTo(-11, -14.5, -16, -8, -16.5, -2);
    ctx.bezierCurveTo(-17, 5, -12, 11, -4, 12); ctx.bezierCurveTo(4, 13, 13, 11, 17.5, 6 + j); ctx.quadraticCurveTo(21.8, 4 + j, 21.4, 1.5 + j * 2.2); ctx.lineTo(8.5, -0.5); ctx.closePath();
    const g = ctx.createRadialGradient(12, -9, 1, 2, -2, 21); g.addColorStop(0, '#2a4068'); g.addColorStop(0.45, '#13213a'); g.addColorStop(1, '#070c18');
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(140,120,255,0.35)'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(17.5, -5); ctx.lineTo(8.5, -0.5); ctx.lineTo(21.4, 1.5 + j * 2.2); ctx.fillStyle = '#050309'; ctx.fill();
    ctx.fillStyle = '#eef5fa';
    for (let i = 0; i < 5; i++) { const k = 0.1 + i * 0.17, tx = 17.5 + (8.5 - 17.5) * k, ty = -5 + 4.5 * k; ctx.beginPath(); ctx.moveTo(tx - 0.4, ty); ctx.lineTo(tx, ty + 2.4 * (1 - k * 0.5)); ctx.lineTo(tx + 0.4, ty); ctx.fill(); }
    dot(ctx, 9.6, -9.2, 2.3, '#03050a'); dot(ctx, 9.8, -9.2, 1, '#d0fff4');
    for (let i = 0; i < 9; i++) dot(ctx, -12 + i * 2.3, 2.4 + Math.sin(i * 0.6) * 0.8, 0.44, '#d2c4ff');
    const lx = 22 + Math.sin(t * 1.3) * 1.6, ly = -19 + Math.sin(t * 2.1) * 1.3;
    ctx.beginPath(); ctx.moveTo(9.4, -15.5); ctx.quadraticCurveTo(15, -30, lx, ly); ctx.strokeStyle = '#1d2c48'; ctx.lineWidth = 0.9; ctx.stroke();
    ctx.restore();
    light(ctx, P.mint, x + f * (22 + Math.sin(t * 1.3) * 1.6), cy - 19, 16, 0.55); light(ctx, P.mint, x + f * 22, cy - 19, 5, 1);
    light(ctx, P.mint, x + f * 22, y, 24, 0.34, 0.4);
  }

  /* ---- atmosphere: shafts, marine snow, depth fog (shafts + fog cached per size) ---- */
  let ATMO = null, AKEY = '';
  function atmo(w, h) {
    const key = w + 'x' + h;
    if (AKEY === key) return ATMO;
    const fog = mk(w, h), f = fog.getContext('2d');
    const g = f.createRadialGradient(w / 2, h * 0.52, Math.min(w, h) * 0.26, w / 2, h * 0.52, Math.hypot(w, h) * 0.58);
    g.addColorStop(0, 'rgba(4,16,34,0)'); g.addColorStop(0.42, 'rgba(4,16,34,0.26)'); g.addColorStop(0.78, 'rgba(3,11,24,0.68)'); g.addColorStop(1, 'rgba(1,5,12,0.9)');
    f.fillStyle = g; f.fillRect(0, 0, w, h);
    const rays = mk(w, h), r = rays.getContext('2d');
    if ('filter' in r) r.filter = 'blur(' + Math.max(2, w / 160) + 'px)';   // blurred once, never per frame
    for (const [cx, bw, a] of [[0.18, 0.1, 0.11], [0.42, 0.07, 0.16], [0.63, 0.09, 0.09], [0.86, 0.06, 0.13]]) {
      const lg = r.createLinearGradient(0, 0, 0, h); lg.addColorStop(0, 'rgba(110,210,255,' + a + ')'); lg.addColorStop(0.55, 'rgba(90,190,240,' + a * 0.35 + ')'); lg.addColorStop(1, 'rgba(90,190,240,0)');
      r.fillStyle = lg; r.beginPath(); r.moveTo(cx * w - bw * w / 2, 0); r.lineTo(cx * w + bw * w / 2, 0); r.lineTo((cx - 0.2) * w + bw * w * 1.2, h); r.lineTo((cx - 0.2) * w - bw * w * 1.2, h); r.fill();
    }
    ATMO = { fog, rays }; AKEY = key;
    return ATMO;
  }
  function snow(ctx, w, h, t) {
    const s = h / 360;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const [n, size, a, drift, seed] of [[110, 0.5, 0.5, 3, 1], [50, 1, 0.45, 4.5, 2], [12, 3.6, 0.1, 7.5, 3]]) {
      for (let i = 0; i < n; i++) {
        const x = ((hash(i, seed, 71) * (w + 40) + (Math.sin(t * 0.3 + i) * 5 + t * 1.1) * s) % (w + 40) + w + 40) % (w + 40) - 20;
        const y = ((hash(i, seed, 72) * (h + 40) + t * drift * s) % (h + 40) + h + 40) % (h + 40) - 20;
        const r = size * (0.6 + hash(i, seed, 73) * 0.8) * s;
        ctx.globalAlpha = a * (0.6 + 0.4 * Math.sin(t * (0.8 + hash(i, seed, 74) * 2) + i));
        ctx.fillStyle = '#d8eefa'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
  }

  /* ---- preview scene ---- */
  function draw(ctx, w, h, t) {
    const s = h / 360, W = w / s;
    ctx.fillStyle = P.abyss; ctx.fillRect(0, 0, w, h);
    ctx.drawImage(ground(w, h), 0, 0, w, h);
    ctx.save(); ctx.scale(s, s);
    // living light pulses on the floor
    for (let i = 0; i < 24; i++) { const ph = (t / (2.6 + hash(i, 1, 9) * 4) + hash(i, 2, 9) * 7) % 1; if (ph < 0.3) light(ctx, [P.cyan, P.teal, P.violet, P.pink][i & 3], hash(i, 3, 9) * W, hash(i, 4, 9) * 360, 3.5, Math.sin(ph / 0.3 * Math.PI) * 0.85, 0.6); }
    kelp(ctx, W * 0.12, 250, 62, t, 0); kelp(ctx, W * 0.16, 262, 54, t, 1.7); kelp(ctx, W * 0.09, 274, 48, t, 3.1);
    tubeWorms(ctx, W * 0.34, 120, t); anemone(ctx, W * 0.66, 110, P.cyan, t); anemone(ctx, W * 0.58, 318, P.violet, t);
    const cx = W / 2;
    lanternFish(ctx, cx - 150 + Math.sin(t * 0.7) * 30, 150, t, 1);
    angler(ctx, cx + 150, 260, t, -1);
    for (const [ox, oy, ph] of [[90, 120, 0], [130, 170, 1.3], [-120, 250, 2.6]]) drawEnemy(ctx, cx + ox, oy, t + ph);
    drawHero(ctx, cx - 10, 205, t, 1);
    // orbiting moon jelly + collectibles + a glowing projectile
    const oa = t * 2.4, ox = cx - 10 + Math.cos(oa) * 44, oy = 201 + Math.sin(oa) * 37;
    light(ctx, P.cyan, ox, oy - 10, 9, 0.9); dot(ctx, ox, oy - 11, 3.2, 'rgba(214,255,250,0.85)');
    for (let i = 0; i < 4; i++) { const gx = cx + 40 + i * 14, gy = 300 + Math.sin(t * 2.4 + i) * 0.9; light(ctx, P.teal, gx, gy, 6, 0.5, 0.4); light(ctx, P.teal, gx, gy - 4.5, 6, 0.9); dot(ctx, gx, gy - 4.5, 1.5, '#e6fff6'); }
    light(ctx, P.violet, cx + 110, 296, 10, 0.5, 0.4); light(ctx, '#ffc2f0', cx + 110, 289.5, 9, 0.8); dot(ctx, cx + 110, 289.5, 3.2, '#f1d4ff');
    const px = cx + 20 + ((t * 120) % 120), py = 198;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const tg = ctx.createLinearGradient(px - 22, 0, px, 0); tg.addColorStop(0, 'rgba(40,160,255,0)'); tg.addColorStop(1, 'rgba(170,250,255,0.9)');
    ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(px - 22, py); ctx.lineTo(px, py - 1.4); ctx.lineTo(px, py + 1.4); ctx.fill(); ctx.restore();
    light(ctx, P.aqua, px, py, 6, 1);
    // a burst of glowing plankton with a light ring
    const bt = (t % 1.6) / 1.6;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = P.pink; ctx.globalAlpha = 1 - bt; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.ellipse(cx - 60, 310, 6 + bt * 26, (6 + bt * 26) * 0.42, 0, 0, TAU); ctx.stroke(); ctx.restore();
    for (let i = 0; i < 14; i++) { const a = hash(i, 5, 5) * TAU, d = (10 + hash(i, 6, 5) * 26) * Math.sqrt(bt); light(ctx, [P.pink, '#ffc2f0', '#b18cff'][i % 3], cx - 60 + Math.cos(a) * d, 302 + Math.sin(a) * d * 0.7 - bt * 8, 3.5, 1 - bt); }
    ctx.restore();
    const A = atmo(w, h);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.7 + 0.2 * Math.sin(t * 0.31); ctx.drawImage(A.rays, Math.sin(t * 0.11) * w * 0.03, 0); ctx.restore();
    snow(ctx, w, h, t);
    ctx.drawImage(A.fog, 0, 0);
  }

  const Starter = { id: 'deepsea', name: 'Deep Sea Glow', palette: PALETTE, fonts: ['Exo 2:wght@600;800', 'Quantico:wght@400;700', 'Comfortaa:wght@400;700'], drawHero, drawEnemy, draw };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['deepsea'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
