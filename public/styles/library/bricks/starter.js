/* Toy Bricks – starter kit (miwale Game Style Library). Dependency-free Canvas 2D.
   A tiny brick renderer: grids of stud x stud x plate cells, every cell knows its part, so each part gets
   a glossy front gradient, a sheen band, lit rims, dark gaps to its neighbours and a stud on every open top.
   Plus a molded toy figure (cylinder head, printed face, claw hands) and a stud-covered baseplate.
   World units: the screen shows 360 units vertically. */
(function (root) {
  'use strict';
  const PALETTE = {
    baseplate: '#47a347', baseplateDark: '#2f8540', lime: '#8cc63f', tan: '#e2cb96', road: '#666d73', curb: '#c6cbce',
    plaza: '#a7acb0', water: '#3d92e8', waterStud: '#8fcaff', red: '#d4231c', yellow: '#f7c81e', blue: '#1c5fc6',
    green: '#21883f', brightGreen: '#4caf48', darkGreen: '#1d6b34', white: '#f2f2ec', black: '#2a2c31', brown: '#7b4527',
    orange: '#f07e1f', lightGrey: '#a7acb0', darkGrey: '#5f666c', azure: '#33b1e2', figSkin: '#f7c51e', figShirt: '#f07e1f',
    figLegs: '#1f4f9a', figHat: '#e6d2a0', print: '#1b1d22', hudPanel: '#f2f2ec', hudEdge: '#1b1d22',
  };
  const SX = 6, SY = 4.2, PH = 2.1, STUD_R = 1.8, STUD_RY = STUD_R * SY / SX, STUD_H = 1.05;
  const TAU = Math.PI * 2;
  const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const cl = (v) => Math.max(0, Math.min(255, v | 0));
  const shade = (h, f, add = 0) => { const c = rgb(h); return 'rgb(' + cl(c[0] * f + add) + ',' + cl(c[1] * f + add) + ',' + cl(c[2] * f + add) + ')'; };
  function makeCanvas(w, h) {
    w = Math.max(1, Math.ceil(w)); h = Math.max(1, Math.ceil(h));
    if (typeof document !== 'undefined') { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
    return new OffscreenCanvas(w, h);
  }
  const hash = (x, y, s) => { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  /* ---------- 1. stud: cylinder + top + highlight crescent + contact shadow (baked per colour) ---------- */
  const STUDS = new Map();
  function stud(col, k, alpha = 1) {
    const key = col + k + alpha;
    if (STUDS.has(key)) return STUDS.get(key);
    const rx = STUD_R * k, ry = STUD_RY * k, hh = STUD_H * k, pad = 2 + Math.ceil(k * 0.5);
    const c = makeCanvas(rx * 2 + pad * 2 + k * 0.6, ry * 2 + hh + pad * 2 + k * 0.4), g = c.getContext('2d');
    const cx = pad + rx, cy = pad + ry + hh;
    g.fillStyle = 'rgba(10,20,40,0.26)'; g.beginPath(); g.ellipse(cx + k * 0.42, cy + k * 0.2, rx * 1.06, ry * 1.12, 0, 0, TAU); g.fill();
    g.globalAlpha = alpha;
    const side = g.createLinearGradient(cx - rx, 0, cx + rx, 0);
    side.addColorStop(0, shade(col, 0.98)); side.addColorStop(0.24, shade(col, 1.16, 6)); side.addColorStop(0.55, shade(col, 0.92)); side.addColorStop(1, shade(col, 0.64));
    g.fillStyle = side; g.beginPath(); g.moveTo(cx - rx, cy - hh); g.lineTo(cx - rx, cy); g.ellipse(cx, cy, rx, ry, 0, Math.PI, 0, true); g.lineTo(cx + rx, cy - hh); g.fill();
    g.fillStyle = shade(col, 1.12, 6); g.beginPath(); g.ellipse(cx, cy - hh, rx, ry, 0, 0, TAU); g.fill();
    g.globalAlpha = 1;
    g.strokeStyle = 'rgba(255,255,255,0.88)'; g.lineWidth = Math.max(1, k * 0.34); g.lineCap = 'round';
    g.beginPath(); g.ellipse(cx, cy - hh, rx * 0.7, ry * 0.66, 0, Math.PI * 1.02, Math.PI * 1.52); g.stroke();
    const s = { c, ax: cx, ay: cy };
    STUDS.set(key, s);
    return s;
  }

  /* ---------- 2. brick grid: parts fill cells (x right, y toward viewer, z up; cell = 1 stud x 1 stud x 1 plate) ---------- */
  function model(w, d, h) { return { w, d, h, cell: new Int32Array(w * d * h), parts: [null] }; }
  function part(m, x, y, z, w, d, h, col, o = {}) {
    const id = m.parts.length;
    m.parts.push({ x, y, z, w, d, h, col, tile: !!o.tile, round: !!o.round, print: o.print || null });
    for (let zz = z; zz < z + h; zz++) for (let yy = y; yy < y + d; yy++) for (let xx = x; xx < x + w; xx++) {
      if (xx >= 0 && yy >= 0 && zz >= 0 && xx < m.w && yy < m.d && zz < m.h) m.cell[(zz * m.d + yy) * m.w + xx] = id;
    }
    return m;
  }
  const at = (m, x, y, z) => (x < 0 || y < 0 || z < 0 || x >= m.w || y >= m.d || z >= m.h ? 0 : m.cell[(z * m.d + y) * m.w + x]);

  /* ---------- 3. renderer: rows back to front, plates bottom to top; anchor = footprint centre at z = 0 ---------- */
  function render(m, k) {
    const ox = m.w / 2, oy = m.d / 2, pad = Math.ceil(k) + 2;
    const top = -oy * SY - m.h * PH - STUD_H - STUD_RY - 0.4, left = -ox * SX - 0.4;
    const ax = Math.ceil(-left * k) + pad, ay = Math.ceil(-top * k) + pad;
    const c = makeCanvas((m.w * SX + 1.3) * k + pad * 2, (m.d * SY - top - oy * SY + 0.6) * k + pad * 2), g = c.getContext('2d');
    const PX = (x) => Math.round(ax + (x - ox) * SX * k), PY = (y, z) => Math.round(ay + ((y - oy) * SY - z * PH) * k);
    const lw = Math.max(1, Math.round(k * 0.28));
    const isRound = (x, y, z) => { const b = at(m, x, y, z); return b && m.parts[b].round; };
    for (let y = 0; y < m.d; y++) for (let z = 0; z < m.h; z++) for (let x = 0; x < m.w; x++) {
      const b = at(m, x, y, z);
      if (!b) continue;
      const p = m.parts[b];
      if (p.round) { if (x === p.x && y === p.y + p.d - 1) roundSlice(p, z); continue; }
      const above = at(m, x, y, z + 1), aboveRound = above && isRound(x, y, z + 1);
      if (!at(m, x, y + 1, z) || isRound(x, y + 1, z)) {            // front face: glossy vertical gradient + sheen
        const x0 = PX(x), x1 = PX(x + 1), y0 = PY(y + 1, z + 1), y1 = PY(y + 1, z);
        const gr = g.createLinearGradient(0, PY(y + 1, p.z + p.h), 0, PY(y + 1, p.z) + 0.01);
        gr.addColorStop(0, shade(p.col, 1.2, 12)); gr.addColorStop(0.13, shade(p.col, 1.02)); gr.addColorStop(0.6, shade(p.col, 0.88)); gr.addColorStop(1, shade(p.col, 0.7));
        g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0);
        const sh = g.createLinearGradient(PX(p.x), 0, PX(p.x + p.w) + 0.01, 0);
        sh.addColorStop(0, 'rgba(255,255,255,.05)'); sh.addColorStop(0.1, 'rgba(255,255,255,.24)'); sh.addColorStop(0.22, 'rgba(255,255,255,.03)'); sh.addColorStop(0.72, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.12)');
        g.fillStyle = sh; g.fillRect(x0, y0, x1 - x0, y1 - y0);
        if (z === p.z + p.h - 1 && (!above || aboveRound)) { g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(x0, y0, x1 - x0, lw); }   // lit rim
        if (z === p.z && z > 0 && at(m, x, y, z - 1)) { g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x0, y1 - lw, x1 - x0, lw); }       // gap below
        const bl = at(m, x - 1, y, z);
        if (!bl) { g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x0, y0, lw, y1 - y0); }
        else if (bl !== b) { g.fillStyle = 'rgba(0,0,0,.36)'; g.fillRect(x0, y0, lw, y1 - y0); }                                     // gap between parts
        if (!at(m, x + 1, y, z)) { g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x1 - lw, y0, lw, y1 - y0); }
      }
      if (!above || aboveRound) {                                    // top face + stud
        const x0 = PX(x), x1 = PX(x + 1), y0 = PY(y, z + 1), y1 = PY(y + 1, z + 1);
        g.fillStyle = shade(p.col, 1.06, 4); g.fillRect(x0, y0, x1 - x0, y1 - y0);
        const bb = at(m, x, y - 1, z);
        if (!bb) { g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x0, y0, x1 - x0, lw); }
        else if (bb !== b && !at(m, x, y - 1, z + 1)) { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x0, y0, x1 - x0, lw); }
        const br = at(m, x + 1, y, z);
        if (br && br !== b && !at(m, x + 1, y, z + 1)) { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x1 - lw, y0, lw, y1 - y0); }
        if (!p.tile && !above) { const s = stud(p.col, k); g.drawImage(s.c, Math.round((x0 + x1) / 2 - s.ax), Math.round((y0 + y1) / 2 - s.ay)); }
      }
      if (p.print && x === p.x + p.w - 1 && y === p.y + p.d - 1 && z === p.z + p.h - 1) p.print(g, { x0: PX(p.x), x1: PX(p.x + p.w), y0: PY(y + 1, p.z + p.h), y1: PY(y + 1, p.z) });
    }
    function roundSlice(p, z) {                                      // cylinder slice: horizontal gradient + bottom half ellipse
      const xa = PX(p.x), xb = PX(p.x + p.w), cx = (xa + xb) / 2, rx = ((xb - xa) / 2) * 0.97;
      const ry = ((PY(p.y + p.d, 0) - PY(p.y, 0)) / 2) * 0.97, cyc = (zz) => (PY(p.y, zz) + PY(p.y + p.d, zz)) / 2;
      const yT = cyc(z + 1), yB = cyc(z);
      const gr = g.createLinearGradient(cx - rx, 0, cx + rx, 0);
      gr.addColorStop(0, shade(p.col, 0.95)); gr.addColorStop(0.2, shade(p.col, 1.2, 10)); gr.addColorStop(0.42, shade(p.col, 1.02)); gr.addColorStop(0.8, shade(p.col, 0.8)); gr.addColorStop(1, shade(p.col, 0.62));
      g.fillStyle = gr; g.beginPath(); g.moveTo(cx - rx, yT); g.lineTo(cx - rx, yB); g.ellipse(cx, yB, rx, ry, 0, Math.PI, 0, true); g.lineTo(cx + rx, yT); g.fill();
      if (z === p.z + p.h - 1 && !at(m, p.x, p.y, z + 1)) {
        g.fillStyle = shade(p.col, 1.1, 6); g.beginPath(); g.ellipse(cx, yT, rx, ry, 0, 0, TAU); g.fill();
        g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = lw; g.beginPath(); g.ellipse(cx, yT, rx - lw / 2, ry - lw / 2, 0, 0.12 * Math.PI, 0.88 * Math.PI); g.stroke();
        if (!p.tile) { const s = stud(p.col, k); g.drawImage(s.c, Math.round(cx - s.ax), Math.round(yT - s.ay)); }
        if (p.print) p.print(g, { x0: cx - rx, x1: cx + rx, y0: cyc(p.z + p.h), y1: cyc(p.z), cx, rx });
      }
    }
    return { c, ax, ay };
  }

  /* ---------- 4. models ---------- */
  const P = PALETTE;
  function eye(g, r) {
    const cy = r.y0 + (r.y1 - r.y0) * 0.55;
    g.fillStyle = P.print; g.beginPath(); g.ellipse(r.cx + r.rx * 0.3, cy, r.rx * 0.42, r.rx * 0.5, 0, 0, TAU); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(r.cx + r.rx * 0.16, cy - r.rx * 0.2, r.rx * 0.13, 0, TAU); g.fill();
  }
  function grin(g, r) {
    const w = r.x1 - r.x0, h = r.y1 - r.y0, x0 = r.x0 + w * 0.2, x1 = r.x1 - w * 0.2, y0 = r.y0 + h * 0.42, y1 = r.y0 + h * 0.8;
    g.fillStyle = P.print; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, y0 + (y1 - y0) * 0.35, x1, y0); g.quadraticCurveTo((x0 + x1) / 2, y1 + (y1 - y0) * 0.5, x0, y0); g.fill();
  }
  function beetle(f) {                       // small creature: red brick beetle, 4 x 3 x 7 cells, 6 scuttle poses
    // feet jump a whole stud, the body hops a whole plate, the eye bricks lag the hop by one pose (follow-through in clicks)
    const m = model(4, 3, 7), a = [0, 0, 1, 1, 1, 0][f], b = 1 - a, bob = [0, 1, 0, 0, 1, 0][f], eyeZ = 4 + Math.max(bob, [0, 0, 1, 0, 0, 1][f]);
    part(m, 0, a, 0, 1, 2, 1, P.black); part(m, 3, b, 0, 1, 2, 1, P.black);
    part(m, 1, 0, bob, 2, 3, 1, P.darkGrey);
    part(m, 1, 0, 1 + bob, 2, 3, 3, P.red, { print: grin });
    part(m, 1, 0, 4 + bob, 2, 2, 1, '#9e1d18');
    part(m, 1, 2, eyeZ, 1, 1, 2, P.white, { round: true, print: eye }); part(m, 2, 2, eyeZ, 1, 1, 2, P.white, { round: true, print: eye });
    return m;
  }
  function tree() {                          // prop: stepped brick tree with round fruit plates
    const m = model(5, 3, 15);
    part(m, 2, 1, 0, 1, 1, 3, P.brown, { round: true }); part(m, 2, 1, 3, 1, 1, 3, P.brown, { round: true });
    part(m, 1, 0, 6, 3, 3, 1, P.darkGreen);
    part(m, 0, 0, 7, 2, 3, 3, P.brightGreen); part(m, 2, 0, 7, 3, 3, 3, P.green);
    part(m, 1, 0, 10, 2, 3, 3, P.brightGreen); part(m, 3, 0, 10, 1, 3, 3, P.green);
    part(m, 1, 0, 13, 3, 3, 1, P.lime); part(m, 2, 1, 14, 1, 1, 1, P.brightGreen, { round: true });
    for (const [x, y, z] of [[0, 2, 10], [4, 1, 10], [3, 2, 14]]) part(m, x, y, z, 1, 1, 1, P.red, { round: true });
    return m;
  }

  /* ---------- 5. main character: molded toy figure, feet at (x, y), drawn in world units ---------- */
  function vGrad(g, x0, x1, h) {
    const gr = g.createLinearGradient(x0, 0, x1, 0);
    gr.addColorStop(0, shade(h, 0.96)); gr.addColorStop(0.2, shade(h, 1.2, 10)); gr.addColorStop(0.45, shade(h, 1.02)); gr.addColorStop(1, shade(h, 0.72));
    return gr;
  }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  /** Walk pose f (0-7) of the toy figure: rigid legs on the hip pin, arms counter-swinging on the shoulder pins, hop at passing. */
  const figPose = (f) => { const L = [0.42, 0.28, 0, -0.28, -0.42, -0.28, 0, 0.28][f]; return { legs: [L, -L], arms: [-L * 1.25, L * 1.25], bob: f % 4 === 2 ? -1.2 : f % 4 === 3 ? -0.4 : 0, hatLag: f % 4 === 3 ? -0.4 : 0 }; };
  function drawHero(ctx, x, y, t, facing = 1) {
    const fx = facing < 0 ? -1 : 1, q = figPose(Math.floor(t * 12) % 8), bob = q.bob; // poses held and stepped on twos (~12 fps), like a brickfilm
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(10,25,45,0.3)'; ctx.beginPath(); ctx.ellipse(1.6, 0.6, 7.5, 2.8, 0, 0, TAU); ctx.fill();
    const legTop = -9.4 + bob, len = 10.3 - Math.min(0, bob);
    for (const [px, a] of [[-2.22, q.legs[0]], [2.22, q.legs[1]]].sort((p, r) => p[1] - r[1])) { // back leg first, darker
      ctx.save(); ctx.translate(px, legTop); ctx.rotate(-a * fx);
      ctx.fillStyle = vGrad(ctx, -2.07, 2.07, a < -0.05 ? shade(P.figLegs, 0.8) : P.figLegs); rr(ctx, -2.07, 0, 4.15, len, 0.7); ctx.fill();
      ctx.fillStyle = shade(P.figLegs, 0.66); rr(ctx, -2.07, len - 1.6, 4.15, 1.6, 0.6); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = shade(P.figLegs, 0.9); rr(ctx, -4.6, legTop - 1.9, 9.2, 2.4, 0.6); ctx.fill();
    const tT = -19.6 + bob, tB = -10.9 + bob;
    ctx.beginPath(); ctx.moveTo(-3.7, tT); ctx.lineTo(3.7, tT); ctx.lineTo(4.85, tB); ctx.lineTo(-4.85, tB); ctx.closePath();
    ctx.fillStyle = vGrad(ctx, -4.85, 4.85, P.figShirt); ctx.fill();
    ctx.strokeStyle = '#6b3a1c'; ctx.lineWidth = 1.15; ctx.beginPath(); ctx.moveTo(-fx * 3.2, tT); ctx.lineTo(fx * 4.4, tB - 1.4); ctx.stroke();
    ctx.fillStyle = '#6b3a1c'; ctx.fillRect(-4.7, tB - 1.7, 9.4, 1.05);
    ctx.fillStyle = P.red; ctx.beginPath(); ctx.moveTo(-2.5, tT); ctx.lineTo(2.5, tT); ctx.lineTo(fx * 0.7, tT + 3.1); ctx.fill();
    [-1, 1].forEach((s, k) => {                                      // arms rotate on the shoulder pins + C-shaped claw hands
      const th = -q.arms[k] * fx, shX = s * 3.75, shY = tT + 1.1, vx = s * 2.45, vy = 6.0;
      const hX = shX + vx * Math.cos(th) - vy * Math.sin(th), hY = shY + vx * Math.sin(th) + vy * Math.cos(th);
      ctx.strokeStyle = shade(P.figShirt, 0.86); ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(shX, shY); ctx.quadraticCurveTo((shX + hX) / 2 + s, (shY + hY) / 2 + 0.4, hX, hY - 1.1); ctx.stroke();
      ctx.fillStyle = vGrad(ctx, hX - 1.4, hX + 1.4, P.figSkin); ctx.beginPath(); ctx.arc(hX, hY, 1.4, 0, TAU); ctx.fill();
      ctx.fillStyle = shade(P.figSkin, 0.55); ctx.beginPath(); ctx.arc(hX + s * 0.25, hY + 0.55, 0.62, 0, TAU); ctx.fill();
    });
    const hT = -27.1 + bob, hB = -20.2 + bob, fo = fx * 0.85, ey = -23.9 + bob;  // cylinder head + printed face
    ctx.fillStyle = vGrad(ctx, -3.6, 3.6, P.figSkin);
    ctx.beginPath(); ctx.moveTo(-3.6, hT); ctx.lineTo(-3.6, hB - 0.9); ctx.ellipse(0, hB - 0.9, 3.6, 0.95, 0, Math.PI, 0, true); ctx.lineTo(3.6, hT); ctx.fill();
    ctx.fillStyle = P.print;
    for (const ex of [-1.35, 1.35]) { ctx.beginPath(); ctx.ellipse(fo + ex, ey, 0.5, 0.76, 0, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = P.print; ctx.lineWidth = 0.48; ctx.beginPath(); ctx.arc(fo, ey + 0.7, 1.5, 0.22 * Math.PI, 0.78 * Math.PI); ctx.stroke();
    ctx.translate(0, q.hatLag);                                       // the helmet is a separate piece that lags the hop
    ctx.fillStyle = shade(P.figHat, 0.66); ctx.beginPath(); ctx.ellipse(0, hT + 0.95, 5.8, 1.95, 0, 0, TAU); ctx.fill();   // pith helmet
    ctx.fillStyle = vGrad(ctx, -5.8, 5.8, P.figHat); ctx.beginPath(); ctx.ellipse(0, hT + 0.5, 5.8, 1.85, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, hT, 4.05, 4.5, 0, Math.PI, TAU); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8a5a2c'; ctx.fillRect(-4.05, hT - 1.2, 8.1, 1.2);
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(-1.7, hT - 2.8, 1.15, 0.55, -0.55, 0, TAU); ctx.fill();
    ctx.restore();
  }

  /* ---------- 6. cache: sprites baked once per scale ---------- */
  let cache = null;
  function bake(w, h) {
    const k = h / 360;
    const S = { k, w, h, beetle: [0, 1, 2, 3, 4, 5].map((f) => render(beetle(f), k * 1.5)), tree: render(tree(), k * 1.5), bg: makeCanvas(w, h) };
    const g = S.bg.getContext('2d'), W = w / k;
    const mat = (i, j) => {                      // baseplate, a pond of transparent-blue plates, a tiled road
      const x = (i + 0.5) * SX, y = (j + 0.5) * SY;
      const d = Math.hypot((x - W * 0.72) / 1.3, y - 120);
      if (d < 52) return 'water';
      if (d < 66) return 'tan';
      if (Math.abs(y - (250 + Math.sin(x / 90) * 26)) < 13) return 'road';
      return x + y * 0.7 < 140 ? 'dark' : 'plate';
    };
    const COL = { plate: P.baseplate, dark: P.baseplateDark, tan: P.tan, road: P.road, water: P.water };
    for (let j = -1; j < 360 / SY + 2; j++) {
      for (let i = 0; i < W / SX + 1; i++) {
        const mt = mat(i, j), lv = mt === 'water' ? -1 : 0, y0 = Math.round((j * SY - lv * PH) * k), y1 = Math.round(((j + 1) * SY - lv * PH) * k);
        const x0 = Math.round(i * SX * k), x1 = Math.round((i + 1) * SX * k);
        g.fillStyle = COL[mt]; g.fillRect(x0, y0, x1 - x0, y1 - y0);
        if (mt === 'road') { g.fillStyle = 'rgba(0,0,0,.2)'; if (i % 2 === 0) g.fillRect(x0, y0, 1, y1 - y0); if (j % 2 === 0) g.fillRect(x0, y0, x1 - x0, 1); }
        if (mt !== 'water' && mat(i, j + 1) === 'water') {                   // baseplate edge above the water
          const gr = g.createLinearGradient(0, y1, 0, y1 + PH * k); gr.addColorStop(0, shade(COL[mt], 1.16, 10)); gr.addColorStop(1, shade(COL[mt], 0.64));
          g.fillStyle = gr; g.fillRect(x0, y1, x1 - x0, Math.round(PH * k));
        }
      }
      for (let i = 0; i < W / SX + 1; i++) {
        const mt = mat(i, j);
        if (mt === 'road') continue;
        const cx = (i + 0.5) * SX * k, cy = ((j + 0.5) * SY - (mt === 'water' ? -PH : 0)) * k;
        const hv = hash(i, j, 7), bx = Math.floor((i * SX) / 70), by = Math.floor((j * SY) / 50);
        const bed = hash(bx, by, 11) < 0.22 && Math.hypot(((i * SX) % 70) - 35, ((j * SY) % 50) - 25) < 20; // flower beds, not a sprinkle
        if ((mt === 'plate' || mt === 'dark') && bed && hv < 0.35) {          // a toy flower part instead of a stud
          for (let q = 0; q < 5; q++) {
            const a = (q / 5) * TAU;
            g.fillStyle = [P.red, P.yellow, P.white][Math.floor(hash(bx, by, 12) * 3)]; // one colour per bed g.beginPath(); g.ellipse(cx + Math.cos(a) * 1.6 * k, cy + Math.sin(a) * 1.3 * k - k, 1.2 * k, k, 0, 0, TAU); g.fill();
          }
          g.fillStyle = P.yellow; g.beginPath(); g.ellipse(cx, cy - k, 0.8 * k, 0.7 * k, 0, 0, TAU); g.fill();
          continue;
        }
        const s = mt === 'water' ? stud(P.waterStud, k, 0.75) : stud(COL[mt], k);
        g.drawImage(s.c, Math.round(cx - s.ax), Math.round(cy - s.ay + k * 0.4));
      }
    }
    return S;
  }

  /* ---------- 7. creature + scene ---------- */
  function drawEnemy(ctx, x, y, t) {
    if (!cache) return;
    const s = cache.beetle[Math.floor(t * 10) % 6], k = cache.k * 1.5;
    ctx.fillStyle = 'rgba(10,25,45,0.28)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 1, 13, 5, 0, 0, TAU); ctx.fill();
    ctx.drawImage(s.c, x - s.ax / k, y - s.ay / k, s.c.width / k, s.c.height / k);
  }
  function coin(ctx, x, y, t, col) {
    const a = t * 4, rx = Math.max(0.4, 3.1 * Math.abs(Math.cos(a)));
    ctx.fillStyle = 'rgba(10,25,45,0.25)'; ctx.beginPath(); ctx.ellipse(x + 0.8, y + 5, 3, 1.2, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = shade(col, 0.62); ctx.beginPath(); ctx.ellipse(x + 0.5, y, rx, 3.1, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = shade(col, 1.1, 10); ctx.beginPath(); ctx.ellipse(x, y, rx, 3.1, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 0.45; ctx.beginPath(); ctx.ellipse(x, y, rx * 0.62, 1.9, 0, 1.05 * Math.PI, 1.5 * Math.PI); ctx.stroke();
  }
  function draw(ctx, w, h, t) {
    if (!cache || cache.w !== w || cache.h !== h) cache = bake(w, h);
    const k = cache.k, W = w / k, bk = k * 1.5;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(cache.bg, 0, 0);
    ctx.scale(k, k);
    const actors = [];
    for (const [tx, ty] of [[0.12, 95], [0.3, 60], [0.88, 300], [0.18, 330]]) actors.push({ y: ty, f: () => { const s = cache.tree; ctx.fillStyle = 'rgba(10,25,45,0.25)'; ctx.beginPath(); ctx.ellipse(W * tx + 6, ty + 2, 17, 6, 0, 0, TAU); ctx.fill(); ctx.drawImage(s.c, W * tx - s.ax / bk, ty - s.ay / bk, s.c.width / bk, s.c.height / bk); } });
    const hx = W * 0.45 + Math.sin(t * 0.6) * W * 0.12, face = Math.cos(t * 0.6) >= 0 ? 1 : -1;
    actors.push({ y: 205, f: () => drawHero(ctx, hx, 205, t, face) });
    for (let i = 0; i < 3; i++) { const bx = W * (0.25 + i * 0.22) + Math.sin(t * 0.8 + i * 2) * 14, by = 160 + i * 38; actors.push({ y: by, f: () => drawEnemy(ctx, bx, by, t + i * 0.3) }); }
    for (let i = 0; i < 5; i++) coin(ctx, W * 0.55 + i * 14, 150 + Math.sin(t * 3 + i) * 1.2, t + i * 0.4, i === 2 ? P.yellow : P.azure);
    actors.sort((a, b) => a.y - b.y).forEach((a) => a.f());
    const ph = (t % 1.6) / 1.6;                                    // a burst of single bricks, deterministic
    for (let i = 0; i < 9; i++) {
      const a = hash(i, 1, 3) * TAU, sp = 30 + hash(i, 2, 3) * 40, z = Math.max(0, (90 + hash(i, 3, 3) * 50) * ph * 1.2 - 330 * ph * ph);
      const x = W * 0.68 + Math.cos(a) * sp * ph, y = 215 + Math.sin(a) * sp * 0.6 * ph - z;
      ctx.save(); ctx.translate(x, y); ctx.rotate(ph * 8 + i); ctx.globalAlpha = ph > 0.8 ? (1 - ph) * 5 : 1;
      const col = [P.red, P.yellow, P.blue, P.white][i % 4];
      ctx.fillStyle = shade(col, 0.8); ctx.fillRect(-4, -2, 8, 4); ctx.fillStyle = shade(col, 1.12, 6); ctx.fillRect(-4, -3.2, 8, 1.6);
      ctx.restore();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const v = ctx.createRadialGradient(w / 2, h / 2, h * 0.36, w / 2, h / 2, w * 0.64);
    v.addColorStop(0, 'rgba(20,40,80,0)'); v.addColorStop(1, 'rgba(14,26,60,0.34)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  const Starter = { id: 'bricks', name: 'Toy Bricks', palette: PALETTE, fonts: ['Titan One', 'Fredoka:wght@400;500;600;700'], drawHero, drawEnemy, draw, render, model, part, stud };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['bricks'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
