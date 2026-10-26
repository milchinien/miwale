/* Toy Bricks ("bricks") – a toy-box world built from glossy plastic interlocking bricks.
   Same idea as the voxel module (3D cell grids baked to sprites once in init()), but the cells here are
   stud-pitch x stud-pitch x plate-height pieces seen straight from the front at a steep 3/4 angle:
   every grid is a list of real parts (bricks, plates, smooth tiles, round bricks) and the little software
   renderer draws each part with a glossy vertical gradient, a sheen band, lit rims, dark gaps between parts
   and a round stud (highlight crescent + contact shadow) on every open top cell.
   The ground is a stud-covered baseplate drawn row by row (raised plates show their front edge), with smooth
   tiles for roads, transparent-blue plates for water, and flowers / plants as small toy parts.
   The main character and the fast creature are molded figure parts painted with canvas paths (cylinder head,
   printed face, claw hands / a translucent ghost piece), also baked once. */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2;
  const hex = U.hex, clamp = U.clamp;

  /* ================================ geometry (world units on screen) ================================ */
  const SX = 6;            // stud pitch across
  const SY = 4.2;          // stud pitch in depth (foreshortened top faces)
  const PH = 2.1;          // plate height; a brick = 3 plates
  const STUD_R = 1.8, STUD_RY = (STUD_R * SY) / SX, STUD_H = 1.05;
  const SHX = 0.36, SHY = 0.2; // shadow shear per unit of height (light from the upper left)

  let K = 4;               // sprite px per world unit (baked a bit above screen resolution)
  let VSC = 2.5;           // current view scale (pixel snapping)
  let RT = 0;

  /* ================================ colours ================================ */
  const COLS = [null];
  const colIds = new Map();
  function C(h, a = 1) {
    const key = h + '/' + a;
    let id = colIds.get(key);
    if (id) return id;
    id = COLS.length;
    COLS.push({ h, c: hex(h), a });
    colIds.set(key, id);
    return id;
  }
  const strCache = new Map();
  function rgbs(r, g, b) {
    r = clamp(r, 0, 255) | 0; g = clamp(g, 0, 255) | 0; b = clamp(b, 0, 255) | 0;
    const k = (r << 16) | (g << 8) | b;
    let s = strCache.get(k);
    if (!s) { s = 'rgb(' + r + ',' + g + ',' + b + ')'; strCache.set(k, s); }
    return s;
  }
  const sh = (col, f, add = 0) => rgbs(col.c[0] * f + add, col.c[1] * f + add, col.c[2] * f + add);
  const shx = (h, f, add = 0) => { const c = hex(h); return rgbs(c[0] * f + add, c[1] * f + add, c[2] * f + add); };

  const P = {
    red: C('#d4231c'), yellow: C('#f7c81e'), blue: C('#1c5fc6'), green: C('#21883f'), bgreen: C('#4caf48'),
    lime: C('#8cc63f'), dkgreen: C('#1d6b34'), white: C('#f2f2ec'), black: C('#2a2c31'), tan: C('#e2cb96'),
    dtan: C('#a38d63'), lgrey: C('#a7acb0'), dgrey: C('#5f666c'), brown: C('#7b4527'), orange: C('#f07e1f'),
    azure: C('#33b1e2'), pink: C('#f58cba'), dred: C('#9e1d18'), purple: C('#7b4fbf'),
    trBlue: C('#62b0ff', 0.62), trClear: C('#e6f4ff', 0.5), trRed: C('#ff3b2b', 0.88), trYellow: C('#ffd84a', 0.88),
    trOrange: C('#ff9a26', 0.86), trGreen: C('#7dff8a', 0.7),
  };

  /* ================================ brick grid ================================ */
  /** A grid of cells (x right, y toward the viewer, z up; 1 cell = 1 stud x 1 stud x 1 plate).
      Every cell remembers the part it belongs to, so the renderer knows where the gaps between parts are. */
  class Bk {
    constructor(w, d, h) {
      this.w = w; this.d = d; this.h = h;
      this.c = new Uint8Array(w * d * h);
      this.b = new Uint16Array(w * d * h);
      this.info = [null];
      this.glows = [];
      this.mir = false;
    }
    in(x, y, z) { return x >= 0 && y >= 0 && z >= 0 && x < this.w && y < this.d && z < this.h; }
    i(x, y, z) { return (z * this.d + y) * this.w + x; }
    at(x, y, z) { return this.in(x, y, z) ? this.c[this.i(x, y, z)] : 0; }
    bid(x, y, z) { return this.in(x, y, z) ? this.b[this.i(x, y, z)] : 0; }
    round(x, y, z) { const b = this.bid(x, y, z); return b ? this.info[b].round : false; }
    /** Add a part: corner (x, y, z), size w x d studs, h plates. o: { tile, round, print(ctx, r, k, mirrored) } */
    part(x, y, z, w, d, h, col, o = {}) {
      const id = this.info.length;
      this.info.push({ x, y, z, w, d, h, col, tile: !!o.tile, round: !!o.round, print: o.print || null });
      for (let zz = z; zz < z + h; zz++) for (let yy = y; yy < y + d; yy++) for (let xx = x; xx < x + w; xx++) {
        if (!this.in(xx, yy, zz)) continue;
        const i = this.i(xx, yy, zz);
        this.c[i] = col; this.b[i] = id;
      }
      return this;
    }
    brick(x, y, z, w, d, col, o) { return this.part(x, y, z, w, d, 3, col, o); }
    plate(x, y, z, w, d, col, o) { return this.part(x, y, z, w, d, 1, col, o); }
    tile(x, y, z, w, d, col, o) { return this.part(x, y, z, w, d, 1, col, Object.assign({ tile: true }, o)); }
    glow(x, y, z, r, col) { this.glows.push({ x, y, z, r, col }); return this; }
    mirror() {
      const m = new Bk(this.w, this.d, this.h);
      m.mir = !this.mir;
      for (let k = 1; k < this.info.length; k++) {
        const p = this.info[k];
        m.part(this.w - p.x - p.w, p.y, p.z, p.w, p.d, p.h, p.col, p);
      }
      // keep cells that were overwritten exactly as they are
      for (let z = 0; z < this.h; z++) for (let y = 0; y < this.d; y++) for (let x = 0; x < this.w; x++) {
        const s = this.i(x, y, z), t = m.i(this.w - 1 - x, y, z);
        m.c[t] = this.c[s]; m.b[t] = this.b[s];
      }
      m.glows = this.glows.map((g) => Object.assign({}, g, { x: this.w - g.x }));
      return m;
    }
  }

  /* ================================ stud sprite ================================ */
  const STUDS = new Map();
  /** One stud (cylinder + top + highlight crescent + contact shadow). Anchor = centre of the stud base. */
  function studSprite(id, k) {
    const key = id + '@' + k;
    let s = STUDS.get(key);
    if (s) return s;
    const col = COLS[id];
    const rx = STUD_R * k, ry = STUD_RY * k, hh = STUD_H * k;
    const pad = 2 + Math.ceil(k * 0.5);
    const { c, ctx } = U.canvas(rx * 2 + pad * 2 + k * 0.6, ry * 2 + hh + pad * 2 + k * 0.4);
    const cx = pad + rx, cy = pad + ry + hh;
    // contact shadow
    ctx.fillStyle = 'rgba(10,20,40,0.26)';
    ctx.beginPath(); ctx.ellipse(cx + k * 0.42, cy + k * 0.2, rx * 1.06, ry * 1.12, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = col.a < 1 ? Math.min(1, col.a + 0.15) : 1;
    // cylinder side
    const g = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
    g.addColorStop(0, sh(col, 0.98)); g.addColorStop(0.24, sh(col, 1.16, 6)); g.addColorStop(0.55, sh(col, 0.92)); g.addColorStop(1, sh(col, 0.64));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(cx - rx, cy - hh); ctx.lineTo(cx - rx, cy);
    ctx.ellipse(cx, cy, rx, ry, 0, Math.PI, 0, true);
    ctx.lineTo(cx + rx, cy - hh); ctx.closePath(); ctx.fill();
    // top
    const tg = ctx.createLinearGradient(cx - rx, cy - hh - ry, cx + rx, cy - hh + ry);
    tg.addColorStop(0, sh(col, 1.2, 8)); tg.addColorStop(1, sh(col, 1.02));
    ctx.fillStyle = tg;
    ctx.beginPath(); ctx.ellipse(cx, cy - hh, rx, ry, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(0,0,0,0.13)'; ctx.lineWidth = Math.max(0.6, k * 0.12);
    ctx.beginPath(); ctx.ellipse(cx, cy - hh, rx, ry, 0, 0, TAU); ctx.stroke();
    // highlight crescent (upper left)
    ctx.strokeStyle = 'rgba(255,255,255,0.88)'; ctx.lineWidth = Math.max(1, k * 0.34); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(cx, cy - hh, rx * 0.7, ry * 0.66, 0, Math.PI * 1.02, Math.PI * 1.52); ctx.stroke();
    // lit rim on the front of the stud
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = Math.max(0.7, k * 0.16);
    ctx.beginPath(); ctx.ellipse(cx, cy - hh, rx * 0.96, ry * 0.94, 0, Math.PI * 0.15, Math.PI * 0.6); ctx.stroke();
    s = { c, ax: cx, ay: cy };
    STUDS.set(key, s);
    return s;
  }

  /* ================================ brick renderer ================================ */
  /** Render a brick grid -> { c, ax, ay, glow[] } (anchor = centre of the footprint at z = 0). */
  function renderBk(m, k) {
    const W = m.w, D = m.d, H = m.h;
    const ox = W / 2, oy = D / 2;
    const pad = Math.ceil(k) + 2;
    const top = -oy * SY - H * PH - STUD_H - STUD_RY - 0.4, left = -ox * SX - 0.4;
    const right = (W - ox) * SX + 0.9, bot = (D - oy) * SY + 0.6;
    const ax = Math.ceil(-left * k) + pad, ay = Math.ceil(-top * k) + pad;
    const { c, ctx } = U.canvas(Math.ceil((right - left) * k) + pad * 2, Math.ceil((bot - top) * k) + pad * 2);
    const PX = (x) => Math.round(ax + (x - ox) * SX * k);
    const PY = (y, z) => Math.round(ay + ((y - oy) * SY - z * PH) * k);
    const lw = Math.max(1, Math.round(k * 0.28));
    const fgs = new Map(), sgs = new Map(), rgs = new Map();
    const frontGrad = (b, y, col, inf) => {
      const key = b * 256 + y;
      let g = fgs.get(key);
      if (!g) {
        g = ctx.createLinearGradient(0, PY(y + 1, inf.z + inf.h), 0, PY(y + 1, inf.z) + 0.01);
        g.addColorStop(0, sh(col, 1.2, 12)); g.addColorStop(0.13, sh(col, 1.02)); g.addColorStop(0.6, sh(col, 0.88)); g.addColorStop(1, sh(col, 0.7));
        fgs.set(key, g);
      }
      return g;
    };
    const sheen = (b, inf) => {
      let g = sgs.get(b);
      if (!g) {
        g = ctx.createLinearGradient(PX(inf.x), 0, PX(inf.x + inf.w) + 0.01, 0);
        const n = inf.w >= 2 ? 1 : 0.6;
        g.addColorStop(0, 'rgba(255,255,255,' + 0.05 * n + ')'); g.addColorStop(0.1, 'rgba(255,255,255,' + 0.24 * n + ')');
        g.addColorStop(0.22, 'rgba(255,255,255,' + 0.03 * n + ')'); g.addColorStop(0.72, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.12)');
        sgs.set(b, g);
      }
      return g;
    };
    const stud = (id, cx, cy) => { const s = studSprite(id, k); ctx.drawImage(s.c, Math.round(cx - s.ax), Math.round(cy - s.ay)); };
    const drawPrint = (inf, r) => { try { inf.print(ctx, r, k, m.mir); } catch (e) { /* prints are decoration */ } };

    function roundSlice(b, inf, z) {
      const col = COLS[inf.col];
      const xa = PX(inf.x), xb = PX(inf.x + inf.w);
      const cx = (xa + xb) / 2, rx = ((xb - xa) / 2) * 0.97;
      const ry = ((PY(inf.y + inf.d, 0) - PY(inf.y, 0)) / 2) * 0.97;
      const cyc = (zz) => (PY(inf.y, zz) + PY(inf.y + inf.d, zz)) / 2;
      const yT = cyc(z + 1), yB = cyc(z);
      let g = rgs.get(b);
      if (!g) {
        g = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
        g.addColorStop(0, sh(col, 0.95)); g.addColorStop(0.2, sh(col, 1.2, 10)); g.addColorStop(0.42, sh(col, 1.02));
        g.addColorStop(0.8, sh(col, 0.8)); g.addColorStop(1, sh(col, 0.62));
        rgs.set(b, g);
      }
      ctx.globalAlpha = col.a;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx - rx, yT); ctx.lineTo(cx - rx, yB);
      ctx.ellipse(cx, yB, rx, ry, 0, Math.PI, 0, true);
      ctx.lineTo(cx + rx, yT); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      const zTop = inf.z + inf.h - 1;
      if (z === inf.z && z > 0 && m.at(inf.x, inf.y, z - 1)) {
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = lw;
        ctx.beginPath(); ctx.ellipse(cx, yB - lw * 0.5, rx, ry, 0, 0.05, Math.PI - 0.05); ctx.stroke();
      }
      if (z === zTop) {
        let open = true;
        for (let yy = inf.y; yy < inf.y + inf.d; yy++) for (let xx = inf.x; xx < inf.x + inf.w; xx++) if (m.at(xx, yy, z + 1)) open = false;
        if (open) {
          ctx.globalAlpha = col.a;
          const tg = ctx.createLinearGradient(cx - rx, yT - ry, cx + rx, yT + ry);
          tg.addColorStop(0, sh(col, 1.16, 8)); tg.addColorStop(1, sh(col, 1.0));
          ctx.fillStyle = tg;
          ctx.beginPath(); ctx.ellipse(cx, yT, rx, ry, 0, 0, TAU); ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = lw;
          ctx.beginPath(); ctx.ellipse(cx, yT, rx - lw * 0.5, ry - lw * 0.5, 0, 0.12 * Math.PI, 0.88 * Math.PI); ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,0.4)';
          ctx.beginPath(); ctx.ellipse(cx, yT, rx * 0.8, ry * 0.78, 0, 1.05 * Math.PI, 1.45 * Math.PI); ctx.stroke();
          if (!inf.tile) {
            for (let yy = inf.y; yy < inf.y + inf.d; yy++) for (let xx = inf.x; xx < inf.x + inf.w; xx++) {
              stud(inf.col, (PX(xx) + PX(xx + 1)) / 2, (PY(yy, z + 1) + PY(yy + 1, z + 1)) / 2);
            }
          }
        }
        if (inf.print) drawPrint(inf, { x0: cx - rx, x1: cx + rx, y0: cyc(inf.z + inf.h), y1: cyc(inf.z), cx, rx, ry, round: true });
      }
    }

    for (let y = 0; y < D; y++) {
      for (let z = 0; z < H; z++) {
        for (let x = 0; x < W; x++) {
          const id = m.c[m.i(x, y, z)];
          if (!id) continue;
          const b = m.b[m.i(x, y, z)], inf = m.info[b];
          if (inf.round) {
            if (x === inf.x && y === inf.y + inf.d - 1) roundSlice(b, inf, z);
            continue;
          }
          const col = COLS[id];
          const frontOpen = !m.at(x, y + 1, z) || m.round(x, y + 1, z);
          const above = m.at(x, y, z + 1), aboveRound = above && m.round(x, y, z + 1);
          if (frontOpen) {
            const x0 = PX(x), x1 = PX(x + 1), y0 = PY(y + 1, z + 1), y1 = PY(y + 1, z);
            ctx.globalAlpha = col.a;
            ctx.fillStyle = frontGrad(b, y, col, inf); ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
            ctx.globalAlpha = 1;
            ctx.fillStyle = sheen(b, inf); ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
            if (z === inf.z + inf.h - 1 && (!above || aboveRound)) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x0, y0, x1 - x0, lw); }
            if (z === inf.z && z > 0 && m.at(x, y, z - 1)) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x0, y1 - lw, x1 - x0, lw); }
            const bl = m.bid(x - 1, y, z), br = m.bid(x + 1, y, z);
            if (!bl || m.info[bl].round) { ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x0, y0, lw, y1 - y0); }
            else if (bl !== b) { ctx.fillStyle = 'rgba(0,0,0,0.36)'; ctx.fillRect(x0, y0, lw, y1 - y0); }
            if (!br || m.info[br].round) { ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x1 - lw, y0, lw, y1 - y0); }
          }
          if (!above || aboveRound) {
            const x0 = PX(x), x1 = PX(x + 1), y0 = PY(y, z + 1), y1 = PY(y + 1, z + 1);
            ctx.globalAlpha = col.a;
            ctx.fillStyle = sh(col, 1.06, 4); ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
            ctx.globalAlpha = 1;
            const bb = m.bid(x, y - 1, z);
            if (!bb) { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x0, y0, x1 - x0, lw); }
            else if (bb !== b && !m.at(x, y - 1, z + 1)) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x0, y0, x1 - x0, lw); }
            const br = m.bid(x + 1, y, z);
            if (br && br !== b && !m.at(x + 1, y, z + 1)) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x1 - lw, y0, lw, y1 - y0); }
            if (!m.bid(x - 1, y, z)) { ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(x0, y0, lw, y1 - y0); }
            if (!inf.tile && !above) stud(id, (x0 + x1) / 2, (y0 + y1) / 2);
          }
          if (inf.print && x === inf.x + inf.w - 1 && y === inf.y + inf.d - 1 && z === inf.z + inf.h - 1) {
            drawPrint(inf, { x0: PX(inf.x), x1: PX(inf.x + inf.w), y0: PY(y + 1, inf.z + inf.h), y1: PY(y + 1, inf.z) });
          }
        }
      }
    }
    const glow = m.glows.map((g) => ({ x: (g.x - ox) * SX, y: (g.y - oy) * SY - g.z * PH, r: g.r, col: g.col }));
    return { c, ax, ay, glow, w: W, d: D, h: H };
  }

  /** Soft footprint shadow, sheared to the lower right by the height of each column. */
  function renderShadowBk(m, k, alpha = 0.5) {
    const ox = m.w / 2, oy = m.d / 2, hm = m.h * PH;
    const left = -ox * SX - 1.5, right = (m.w - ox) * SX + hm * SHX + 2, top = -oy * SY - 1.5, bot = (m.d - oy) * SY + hm * SHY + 2;
    const pad = Math.ceil(k * 1.5) + 2;
    const ax = Math.ceil(-left * k) + pad, ay = Math.ceil(-top * k) + pad;
    const cw = Math.ceil((right - left) * k) + pad * 2, ch = Math.ceil((bot - top) * k) + pad * 2;
    const L = U.canvas(cw, ch);
    L.ctx.fillStyle = '#000';
    for (let y = 0; y < m.d; y++) for (let x = 0; x < m.w; x++) {
      let zt = -1;
      for (let z = 0; z < m.h; z++) if (m.at(x, y, z)) zt = z + 1;
      if (zt < 0) continue;
      const rnd = m.round(x, y, 0);
      for (let z = 0; z <= zt; z += 0.5) {
        const dx = z * PH * SHX, dy = z * PH * SHY;
        const x0 = ax + ((x - ox) * SX + dx) * k, y0 = ay + ((y - oy) * SY + dy) * k;
        if (rnd) { L.ctx.beginPath(); L.ctx.ellipse(x0 + SX * k / 2, y0 + SY * k / 2, SX * k * 0.5, SY * k * 0.5, 0, 0, TAU); L.ctx.fill(); }
        else L.ctx.fillRect(x0, y0, SX * k + 0.5, SY * k + 0.5);
      }
    }
    const { c, ctx } = U.canvas(cw, ch);
    if (canFilter) ctx.filter = 'blur(' + (k * 0.9).toFixed(1) + 'px)';
    ctx.globalAlpha = alpha;
    ctx.drawImage(L.c, 0, 0);
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
    return { c, ax, ay };
  }
  const canFilter = (() => { try { return 'filter' in document.createElement('canvas').getContext('2d'); } catch (e) { return false; } })();

  /* ---------- world-space blits ---------- */
  function blit(ctx, s, x, y) {
    const w = s.c.width / K, h = s.c.height / K;
    ctx.drawImage(s.c, Math.round(x * VSC - (s.ax * VSC) / K) / VSC, Math.round(y * VSC - (s.ay * VSC) / K) / VSC, w, h);
  }
  function blitScaled(ctx, s, x, y, sx, sy) {
    ctx.drawImage(s.c, x - (s.ax / K) * sx, y - (s.ay / K) * sy, (s.c.width / K) * sx, (s.c.height / K) * sy);
  }

  /* ================================ prints (decorations on front faces) ================================ */
  const DARK = '#1b1d22';
  function pEye(ctx, r, k, mir) {
    const dir = mir ? -1 : 1;
    const cy = r.y0 + (r.y1 - r.y0) * 0.55;
    ctx.fillStyle = DARK;
    ctx.beginPath(); ctx.ellipse(r.cx + dir * r.rx * 0.3, cy, r.rx * 0.42, r.rx * 0.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(r.cx + dir * r.rx * 0.3 - r.rx * 0.14, cy - r.rx * 0.2, r.rx * 0.13, 0, TAU); ctx.fill();
  }
  function pGrin(ctx, r) {
    const w = r.x1 - r.x0, h = r.y1 - r.y0;
    const x0 = r.x0 + w * 0.2, x1 = r.x1 - w * 0.2, y0 = r.y0 + h * 0.42, y1 = r.y0 + h * 0.8;
    ctx.fillStyle = DARK;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo((x0 + x1) / 2, y0 + (y1 - y0) * 0.35, x1, y0);
    ctx.quadraticCurveTo((x0 + x1) / 2, y1 + (y1 - y0) * 0.5, x0, y0);
    ctx.fill();
    ctx.fillStyle = '#fff';
    for (const fx of [0.34, 0.66]) {
      const cx = x0 + (x1 - x0) * fx;
      ctx.beginPath(); ctx.moveTo(cx - w * 0.05, y0 + (y1 - y0) * 0.22); ctx.lineTo(cx + w * 0.05, y0 + (y1 - y0) * 0.22); ctx.lineTo(cx, y0 + (y1 - y0) * 0.62); ctx.fill();
    }
  }
  function pChest(ctx, r) {
    const w = r.x1 - r.x0, h = r.y1 - r.y0;
    const x0 = r.x0 + w * 0.16, y0 = r.y0 + h * 0.2, pw = w * 0.68, ph = h * 0.62;
    ctx.fillStyle = '#f7c81e';
    rrect(ctx, x0, y0, pw, ph, h * 0.12); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x0 + h * 0.08, y0 + h * 0.05, pw - h * 0.16, Math.max(1, h * 0.06));
    ctx.fillStyle = DARK;
    for (let i = 0; i < 3; i++) ctx.fillRect(x0 + pw * 0.08, y0 + ph * (0.25 + i * 0.22), pw * 0.36, Math.max(1, ph * 0.09));
    const cx = x0 + pw * 0.72, cy = y0 + ph * 0.5, cr = ph * 0.34;
    ctx.fillStyle = DARK; ctx.beginPath(); ctx.arc(cx, cy, cr * 1.2, 0, TAU); ctx.fill();
    const g = ctx.createRadialGradient(cx - cr * 0.3, cy - cr * 0.3, cr * 0.1, cx, cy, cr);
    g.addColorStop(0, '#fff2c2'); g.addColorStop(0.35, '#ff5a3a'); g.addColorStop(1, '#b8160e');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, cr, 0, TAU); ctx.fill();
  }
  function pGrille(ctx, r) {
    const w = r.x1 - r.x0, h = r.y1 - r.y0;
    ctx.fillStyle = 'rgba(20,24,40,0.55)';
    for (let i = 0; i < 4; i++) rrect(ctx, r.x0 + w * (0.26 + i * 0.13), r.y0 + h * 0.3, w * 0.06, h * 0.45, w * 0.03), ctx.fill();
  }
  function pRobotFace(ctx, r) {
    const w = r.x1 - r.x0, h = r.y1 - r.y0;
    for (const fx of [0.3, 0.7]) {
      const cx = r.x0 + w * fx, cy = r.y0 + h * 0.46, cr = h * 0.27;
      ctx.fillStyle = DARK; ctx.beginPath(); ctx.arc(cx, cy, cr * 1.25, 0, TAU); ctx.fill();
      const g = ctx.createRadialGradient(cx - cr * 0.3, cy - cr * 0.35, cr * 0.1, cx, cy, cr);
      g.addColorStop(0, '#fff6d0'); g.addColorStop(0.3, '#ff5a36'); g.addColorStop(1, '#c0160e');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, cr, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = DARK;
    for (let i = 0; i < 5; i++) ctx.fillRect(r.x0 + w * (0.33 + i * 0.075), r.y0 + h * 0.78, Math.max(1, w * 0.035), h * 0.12);
  }
  function pDoor(ctx, r) {
    const w = r.x1 - r.x0, h = r.y1 - r.y0;
    ctx.strokeStyle = 'rgba(10,20,50,0.45)'; ctx.lineWidth = Math.max(1, w * 0.05);
    ctx.strokeRect(r.x0 + w * 0.16, r.y0 + h * 0.1, w * 0.68, h * 0.36);
    ctx.strokeRect(r.x0 + w * 0.16, r.y0 + h * 0.54, w * 0.68, h * 0.36);
    ctx.fillStyle = '#f7c81e'; ctx.beginPath(); ctx.arc(r.x0 + w * 0.76, r.y0 + h * 0.5, w * 0.08, 0, TAU); ctx.fill();
  }
  function pWindow(ctx, r) {
    const w = r.x1 - r.x0, h = r.y1 - r.y0;
    const x0 = r.x0 + w * 0.14, y0 = r.y0 + h * 0.16, ww = w * 0.72, hh = h * 0.68;
    const g = ctx.createLinearGradient(x0, y0, x0 + ww, y0 + hh);
    g.addColorStop(0, '#bfe6ff'); g.addColorStop(0.5, '#4f9fe8'); g.addColorStop(1, '#2a6fc4');
    ctx.fillStyle = g; ctx.fillRect(x0, y0, ww, hh);
    ctx.fillStyle = '#f2f2ec'; ctx.fillRect(x0 + ww / 2 - w * 0.04, y0, w * 0.08, hh); ctx.fillRect(x0, y0 + hh / 2 - w * 0.04, ww, w * 0.08);
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x0 + ww * 0.1, y0 + hh * 0.08, ww * 0.12, hh * 0.3);
  }
  function pArrow(ctx, r, k, mir) {
    const w = r.x1 - r.x0, h = r.y1 - r.y0, d = mir ? -1 : 1, cx = (r.x0 + r.x1) / 2, cy = (r.y0 + r.y1) / 2;
    ctx.fillStyle = '#d4231c';
    ctx.beginPath();
    ctx.moveTo(cx - d * w * 0.3, cy - h * 0.12); ctx.lineTo(cx + d * w * 0.06, cy - h * 0.12); ctx.lineTo(cx + d * w * 0.06, cy - h * 0.3);
    ctx.lineTo(cx + d * w * 0.32, cy); ctx.lineTo(cx + d * w * 0.06, cy + h * 0.3); ctx.lineTo(cx + d * w * 0.06, cy + h * 0.12);
    ctx.lineTo(cx - d * w * 0.3, cy + h * 0.12); ctx.closePath(); ctx.fill();
  }
  function pCross(ctx, r) {
    const w = r.x1 - r.x0, h = r.y1 - r.y0, cx = (r.x0 + r.x1) / 2, cy = (r.y0 + r.y1) / 2, s = Math.min(w, h) * 0.62, t = s * 0.34;
    ctx.fillStyle = '#d4231c';
    ctx.fillRect(cx - t / 2, cy - s / 2, t, s); ctx.fillRect(cx - s / 2, cy - t / 2, s, t);
  }
  function pCar(ctx, r) {
    const w = r.x1 - r.x0, h = r.y1 - r.y0;
    for (const fx of [0.22, 0.78]) {
      const cx = r.x0 + w * fx, cy = r.y1 - h * 0.05, cr = h * 0.72;
      ctx.fillStyle = DARK; ctx.beginPath(); ctx.arc(cx, cy, cr, 0, TAU); ctx.fill();
      ctx.fillStyle = '#a7acb0'; ctx.beginPath(); ctx.arc(cx, cy, cr * 0.48, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(cx - cr * 0.18, cy - cr * 0.18, cr * 0.16, 0, TAU); ctx.fill();
    }
  }
  function pStripe(ctx, r) {
    const h = r.y1 - r.y0;
    ctx.fillStyle = '#f2f2ec'; ctx.fillRect(r.x0, r.y0 + h * 0.38, r.x1 - r.x0, h * 0.26);
  }
  function rrect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  /* ================================ brick models ================================ */
  // small creature, two designed variants (4 x 3 x 7): a red brick beetle with eye studs, or a yellow striped beetle with an antenna.
  // f 0-5 scuttle poses (feet step one stud, the body hops one plate, the eyes lag the hop), 6 hit pose (jumps up, feet out, X eyes)
  function beetleModel(f, v = 0) {
    const m = new Bk(4, 3, 9);
    const hit = f >= 6;
    const st = hit ? 0 : [0, 0, 1, 1, 1, 0][f], bob = hit ? 1 : [0, 1, 0, 0, 1, 0][f], eyeBob = hit ? 1 : [0, 0, 1, 0, 0, 1][f];
    const fA = st ? 1 : 0, fB = st ? 0 : 1;
    if (hit) { m.plate(0, 0, 0, 1, 1, P.black).plate(3, 0, 0, 1, 1, P.black).plate(0, 2, 0, 1, 1, P.black).plate(3, 2, 0, 1, 1, P.black); }
    else {
      m.plate(0, fA, 0, 1, 1, P.black).plate(3, fB, 0, 1, 1, P.black);
      m.plate(0, fA + 1, 0, 1, 1, P.black).plate(3, fB + 1, 0, 1, 1, P.black);
    }
    m.plate(1, 0, bob, 2, 3, P.dgrey);
    const body = v ? P.yellow : P.red, top = v ? P.black : P.dred;
    m.brick(1, 0, 1 + bob, 2, 3, body, { print: v ? pStripe : pGrin });
    m.plate(1, 0, 4 + bob, 2, 2, top);
    const eyeZ = 4 + Math.max(bob, eyeBob);
    const eyeOpt = { round: true, print: hit ? pCross : pEye };
    if (v) {
      m.part(1, 2, eyeZ, 1, 1, 2, P.white, eyeOpt);
      m.part(2, 2, eyeZ, 1, 1, 1, P.white, { round: true, print: hit ? pCross : pEye });
      m.part(1, 0, 5 + bob, 1, 1, 2, P.black, { round: true });
      m.part(1, 0, 7 + bob, 1, 1, 1, P.red, { round: true, tile: true });
    } else {
      m.part(1, 2, eyeZ, 1, 1, 2, P.white, eyeOpt);
      m.part(2, 2, eyeZ, 1, 1, 2, P.white, eyeOpt);
    }
    return m;
  }
  // large creature: a brick-built robot (7 x 3 x 22). f 0-5 stomp poses (feet lift, arms counter-swing, head and antenna lag), 6 hit pose (arms up)
  function robotModel(f) {
    const m = new Bk(7, 3, 22);
    const hit = f >= 6;
    const lL = hit ? 0 : [0, 1, 1, 0, 0, 0][f], lR = hit ? 0 : [0, 0, 0, 0, 1, 1][f], arm = hit ? 0 : [1, 1, 0, -1, -1, 0][f];
    const hd = hit ? 1 : [0, 0, 1, 0, 0, 1][f];
    m.plate(1, 0, lL, 2, 3, P.dgrey).part(1, 0, 1 + lL, 2, 2, 3 - lL, P.dgrey);
    m.plate(4, 0, lR, 2, 3, P.dgrey).part(4, 0, 1 + lR, 2, 2, 3 - lR, P.dgrey);
    m.plate(1, 0, 4, 5, 2, P.black);
    m.brick(1, 0, 5, 5, 3, P.blue, { print: pGrille });
    m.brick(1, 0, 8, 5, 3, P.blue, { print: pChest });
    const aL = arm > 0 ? 1 : 0, aR = arm < 0 ? 1 : 0, up = hit ? 5 : 0;
    m.part(0, aL, 6 + up, 1, 2, 5, P.lgrey).plate(0, aL, 5 + up, 1, 2, P.red);
    m.part(6, aR, 6 + up, 1, 2, 5, P.lgrey).plate(6, aR, 5 + up, 1, 2, P.red);
    m.plate(0, aL, 11 + up, 1, 2, P.yellow).plate(6, aR, 11 + up, 1, 2, P.yellow);
    m.part(3, 1, 11, 1, 1, 1 + hd, P.dgrey, { round: true });
    m.brick(2, 1, 12 + hd, 3, 2, P.lgrey, { print: pRobotFace });
    m.part(3, 1, 15 + hd, 1, 1, 2, P.black, { round: true });
    m.part(3, 1, 17 + hd + (hit ? 1 : 0), 1, 1, 1, P.trRed, { round: true, tile: true });
    m.glow(3.5, 1.5, 17.5 + hd, hit ? 10 : 7, 'red').glow(2.95, 3, 13.4 + hd, 6, 'red').glow(4.05, 3, 13.4 + hd, 6, 'red').glow(4.6, 3, 9.3, 7, 'red');
    return m;
  }
  function beaconModel() {
    const m = new Bk(1, 1, 5);
    m.part(0, 0, 0, 1, 1, 1, P.black, { round: true });
    m.part(0, 0, 1, 1, 1, 3, P.trOrange, { round: true });
    m.part(0, 0, 4, 1, 1, 1, P.yellow, { round: true });
    return m;
  }
  function boltModel() {
    const m = new Bk(1, 1, 1);
    return m.part(0, 0, 0, 1, 1, 1, P.yellow, { round: true });
  }

  /* -------- props -------- */
  function treeModel(v) {
    const m = new Bk(5, 3, 15);
    const g1 = v ? P.bgreen : P.green, g2 = v ? P.green : P.bgreen, g3 = v ? P.lime : P.bgreen;
    m.part(2, 1, 0, 1, 1, 3, P.brown, { round: true }).part(2, 1, 3, 1, 1, 3, P.brown, { round: true });
    m.plate(1, 0, 6, 3, 3, P.dkgreen);
    m.brick(0, 0, 7, 2, 3, g1).brick(2, 0, 7, 3, 3, g2);
    m.brick(1, 0, 10, 2, 3, g1).brick(3, 0, 10, 1, 3, g2);
    m.plate(1, 0, 13, 3, 3, g3);
    m.part(2, 1, 14, 1, 1, 1, g1, { round: true });
    const fruit = v ? P.red : P.yellow;
    m.part(0, 2, 10, 1, 1, 1, fruit, { round: true }).part(4, 1, 10, 1, 1, 1, fruit, { round: true });
    m.part(0, 0, 10, 1, 1, 1, g3, { round: true }).part(4, 2, 10, 1, 1, 1, g2, { round: true }).part(3, 2, 14, 1, 1, 1, fruit, { round: true });
    return m;
  }
  function pineModel() {
    const m = new Bk(5, 3, 16);
    m.part(2, 1, 0, 1, 1, 3, P.brown, { round: true });
    m.brick(0, 0, 3, 5, 3, P.dkgreen);
    m.plate(1, 0, 6, 3, 3, P.green);
    m.brick(1, 0, 7, 3, 3, P.dkgreen);
    m.plate(1, 0, 10, 3, 3, P.green);
    m.brick(2, 1, 11, 1, 1, P.dkgreen).brick(2, 0, 11, 1, 1, P.dkgreen);
    m.part(2, 1, 14, 1, 1, 2, P.green, { round: true });
    return m;
  }
  function bushModel() {
    const m = new Bk(3, 2, 5);
    m.brick(0, 0, 0, 3, 2, P.green);
    m.part(0, 1, 3, 1, 1, 1, P.bgreen, { round: true }).part(1, 0, 3, 1, 1, 1, P.bgreen, { round: true });
    m.part(2, 1, 3, 1, 1, 1, P.lime, { round: true }).part(1, 1, 3, 1, 1, 1, P.red, { round: true }).part(2, 0, 3, 1, 1, 1, P.bgreen, { round: true });
    return m;
  }
  function rockModel() {
    const m = new Bk(3, 2, 7);
    m.brick(0, 0, 0, 2, 2, P.dgrey).brick(2, 0, 0, 1, 2, P.lgrey);
    m.brick(0, 0, 3, 2, 2, P.lgrey);
    m.part(2, 1, 3, 1, 1, 1, P.dgrey, { round: true });
    m.tile(1, 0, 6, 1, 1, P.dgrey).tile(0, 1, 6, 1, 1, P.dgrey);
    return m;
  }
  function lampModel() {
    const m = new Bk(3, 3, 16);
    m.plate(0, 0, 0, 3, 3, P.dgrey);
    for (let z = 1; z < 12; z += 3) m.part(1, 1, z, 1, 1, Math.min(3, 12 - z), P.black, { round: true });
    m.plate(1, 1, 12, 1, 1, P.black);
    m.part(1, 1, 13, 1, 1, 2, P.trYellow, { round: true });
    m.part(1, 1, 15, 1, 1, 1, P.black, { round: true, tile: true });
    m.glow(1.5, 1.5, 14, 13, 'warm');
    return m;
  }
  function fenceModel() {
    const m = new Bk(4, 1, 6);
    m.brick(0, 0, 0, 1, 1, P.white).brick(0, 0, 3, 1, 1, P.white, { tile: true });
    m.brick(3, 0, 0, 1, 1, P.white).brick(3, 0, 3, 1, 1, P.white, { tile: true });
    m.plate(1, 0, 1, 2, 1, P.white, { tile: true }).plate(1, 0, 4, 2, 1, P.white, { tile: true });
    return m;
  }
  function pileModel() {
    const m = new Bk(4, 3, 9);
    m.brick(0, 1, 0, 4, 2, P.red);
    m.brick(0, 0, 0, 2, 1, P.yellow);
    m.brick(3, 0, 0, 1, 1, P.white);
    m.brick(1, 1, 3, 2, 2, P.blue);
    m.plate(0, 2, 3, 1, 1, P.lime);
    m.brick(1, 1, 6, 1, 1, P.orange).plate(2, 1, 6, 1, 2, P.azure);
    return m;
  }
  function houseModel() {
    const m = new Bk(5, 4, 14);
    const walls = [[2, 3], [3, 2], [2, 3]];
    walls.forEach((ws, row) => {
      let x = 0;
      for (const w of ws) { m.brick(x, 0, row * 3, w, 4, row === 1 && x === 0 ? P.red : P.red); x += w; }
    });
    m.part(2, 3, 0, 1, 1, 6, P.blue, { tile: true, print: pDoor });
    m.part(0, 3, 3, 1, 1, 3, P.white, { tile: true, print: pWindow });
    m.part(4, 3, 3, 1, 1, 3, P.white, { tile: true, print: pWindow });
    m.plate(0, 0, 9, 5, 4, P.white);
    m.brick(0, 0, 10, 5, 3, P.dgrey);
    m.plate(1, 0, 13, 3, 2, P.dgrey);
    m.brick(4, 0, 10, 1, 1, P.dred).plate(4, 0, 13, 1, 1, P.dred);
    return m;
  }
  function coneModel() {
    const m = new Bk(1, 1, 5);
    m.tile(0, 0, 0, 1, 1, P.orange);
    m.part(0, 0, 1, 1, 1, 3, P.orange, { round: true, tile: true, print: pStripe });
    m.part(0, 0, 4, 1, 1, 1, P.white, { round: true });
    return m;
  }
  function signModel() {
    const m = new Bk(3, 1, 10);
    m.part(1, 0, 0, 1, 1, 3, P.brown, { round: true }).part(1, 0, 3, 1, 1, 3, P.brown, { round: true });
    m.part(0, 0, 6, 3, 1, 3, P.white, { tile: true, print: pArrow });
    return m;
  }

  /* -------- icon models -------- */
  function mosaic(rows, pal) {
    const d = rows.length, w = Math.max(...rows.map((r) => r.length));
    const m = new Bk(w, d, 1);
    rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (pal[row[x]]) m.plate(x, y, 0, 1, 1, pal[row[x]]); });
    return m;
  }
  const ICON_MODELS = {
    'hp-heart': () => mosaic(['.RR.RR.', 'RRRRRRR', 'RRRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'], { R: P.red }),
    kills: () => beetleModel(0),
    dmg: () => {
      const m = new Bk(3, 2, 13);
      for (let z = 0; z < 9; z += 3) m.part(1, 1, z, 1, 1, 3, P.brown, { round: true });
      m.brick(0, 0, 9, 3, 2, P.lgrey).plate(0, 0, 12, 3, 2, P.dgrey);
      return m;
    },
    rate: () => mosaic(['...YYY', '..YYY.', '.YYY..', 'YYYYYY', '...YY.', '..YY..', '.YY...', '.Y....'], { Y: P.yellow, O: P.orange }),
    multi: () => {
      const m = new Bk(3, 2, 3);
      m.part(1, 0, 0, 1, 1, 3, P.yellow, { round: true });
      m.part(0, 1, 0, 1, 1, 3, P.red, { round: true }).part(2, 1, 0, 1, 1, 3, P.blue, { round: true });
      return m;
    },
    bounce: () => {
      const m = new Bk(2, 2, 7);
      for (let z = 0; z < 6; z++) m.part(0, 0, z, 2, 2, 1, z & 1 ? P.white : P.red, { round: true, tile: z < 5 });
      m.part(0, 1, 6, 1, 1, 1, P.yellow, { round: true });
      return m;
    },
    lantern: () => beaconModel(),
    speed: () => {
      const m = new Bk(4, 2, 7);
      m.plate(0, 0, 0, 4, 2, P.dgrey, { tile: true, print: pCar });
      m.brick(0, 0, 1, 4, 2, P.red);
      m.part(1, 0, 4, 2, 2, 2, P.trBlue);
      m.tile(1, 0, 6, 2, 2, P.red);
      return m;
    },
    magnet: () => mosaic(['GG..GG', 'RR..RR', 'RR..RR', 'RR..RR', 'RRRRRR', '.RRRR.'], { R: P.red, G: P.lgrey }),
    hp: () => {
      const m = new Bk(2, 2, 6);
      m.brick(0, 0, 0, 2, 2, P.white, { print: pCross }).brick(0, 0, 3, 2, 2, P.white);
      return m;
    },
  };

  /* ================================ molded figures (vector, baked) ================================ */
  const FIG = { skin: '#f7c51e', shirt: '#f07e1f', legs: '#1f4f9a', hat: '#e6d2a0', band: '#8a5a2c', strap: '#6b3a1c', bandana: '#d4231c', pack: '#7b4527' };
  function glossV(ctx, y0, y1, h, f0 = 1.08, f1 = 0.74) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, shx(h, f0, 6)); g.addColorStop(0.5, shx(h, 0.96)); g.addColorStop(1, shx(h, f1));
    return g;
  }
  function glossH(ctx, x0, x1, h) {
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, shx(h, 0.96)); g.addColorStop(0.2, shx(h, 1.2, 10)); g.addColorStop(0.45, shx(h, 1.02)); g.addColorStop(1, shx(h, 0.72));
    return g;
  }
  /** Main character poses (a toy figure: rigid legs swing on the hip pin, arms on the shoulder pins, the head turns).
      0-7 walk (stepped like a played-with toy, hop at passing), 8-11 idle fidgets, 12 blink, 13 dash crouch, 14 dash lunge, 15 hurt. */
  const F_IDLE = 8, F_BLINK = 12, F_CROUCH = 13, F_LUNGE = 14, F_HURT = 15;
  function figPose(f) {
    if (f < 8) {
      const L = [0.42, 0.28, 0, -0.28, -0.42, -0.28, 0, 0.28][f];
      return { legs: [L, -L], arms: [-L * 1.25, L * 1.25], bob: f % 4 === 2 ? -1.2 : f % 4 === 3 ? -0.4 : 0, lean: 0.05, look: 0.85, hatLag: f % 4 === 3 ? -0.4 : 0 };
    }
    if (f < 12) {
      const k = f - 8;
      return { legs: [0, 0], arms: [[0, 0], [0.08, -0.1], [0, 0], [-0.1, 0.12]][k], bob: k === 3 ? -0.3 : 0, look: [0.85, 1.6, -0.3, 0.85][k], hand: k === 2 ? 1 : 0 };
    }
    if (f === F_BLINK) return { legs: [0, 0], arms: [0, 0], blink: true, look: 0.85 };
    if (f === F_CROUCH) return { legs: [0.22, -0.18], arms: [-0.95, -0.85], bob: 1.4, lean: -0.08, look: 1.1, hatLag: 0.3 };
    if (f === F_LUNGE) return { legs: [0.7, -0.7], arms: [-1.25, -1.1], bob: -1, lean: 0.22, look: 1.2, hatLag: -0.8 };
    return { legs: [-0.25, 0.3], arms: [2.5, 2.3], bob: -0.5, lean: -0.16, look: 0.4, hurt: true, hatLag: -2.2 };
  }
  /** The main character: a toy figure (explorer) painted with glossy plastic paths. Feet at (0, 0). */
  function figPaint(ctx, f, fx) {
    const q = figPose(f), bob = q.bob || 0;
    ctx.save();
    if (q.lean) ctx.rotate(fx * q.lean);
    ctx.lineJoin = 'round';
    // legs: rigid pieces swinging on the hip pin (back leg first, darker)
    const legTop = -9.4 + bob, len = 9.4 - Math.min(0, bob) + 0.9;
    const legs = [[-2.22, q.legs[0]], [2.22, q.legs[1]]].sort((a, b) => a[1] - b[1]);
    for (const [px, a] of legs) {
      const back = a < -0.05;
      ctx.save();
      ctx.translate(px, legTop);
      ctx.rotate(-a * fx);
      ctx.fillStyle = glossV(ctx, 0, len, FIG.legs, back ? 0.95 : 1.12, back ? 0.62 : 0.74);
      rrect(ctx, -2.07, 0, 4.15, len, 0.7); ctx.fill();
      ctx.fillStyle = shx(FIG.legs, back ? 0.55 : 0.68);
      rrect(ctx, -2.07, len - 1.6, 4.15, 1.6, 0.6); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-1.47, 1, 0.55, len - 3);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-1.77, len - 1.6, 3.5, 0.3);
      ctx.restore();
    }
    // hips
    ctx.fillStyle = glossV(ctx, legTop - 2, legTop + 0.5, FIG.legs, 1.0, 0.7);
    rrect(ctx, -4.6, legTop - 1.9, 9.2, 2.4, 0.6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-4.2, legTop - 1.85, 8.4, 0.3);
    // backpack (peeks out on the side away from the facing direction)
    const tT = -19.6 + bob, tB = -10.9 + bob;
    ctx.fillStyle = glossV(ctx, tT, tB, FIG.pack);
    rrect(ctx, fx > 0 ? -6.4 : 4.2, tT + 1.3, 2.2, 7.2, 0.9); ctx.fill();
    // torso
    ctx.beginPath();
    ctx.moveTo(-3.7, tT); ctx.lineTo(3.7, tT); ctx.lineTo(4.85, tB); ctx.lineTo(-4.85, tB); ctx.closePath();
    ctx.fillStyle = glossH(ctx, -4.85, 4.85, FIG.shirt); ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(-5, tB - 2.4, 10, 2.4);
    ctx.strokeStyle = FIG.strap; ctx.lineWidth = 1.15; ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(-fx * 3.2, tT - 0.3); ctx.lineTo(fx * 4.4, tB - 1.4); ctx.stroke();
    ctx.fillStyle = FIG.strap; ctx.fillRect(-5, tB - 1.7, 10, 1.05);
    ctx.fillStyle = '#f7c81e'; ctx.fillRect(-0.6, tB - 1.85, 1.2, 1.35);
    ctx.fillStyle = 'rgba(80,30,0,0.35)'; rrect(ctx, fx * 0.9 - 0.2 + (fx > 0 ? 0 : -2), tT + 3.2, 2.2, 1.8, 0.3); ctx.fill();
    ctx.restore();
    ctx.fillStyle = FIG.bandana;
    ctx.beginPath(); ctx.moveTo(-2.5, tT - 0.1); ctx.lineTo(2.5, tT - 0.1); ctx.lineTo(fx * 0.7, tT + 3.1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-2.2, tT, 2.4, 0.35);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 0.55; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-3.3, tT + 0.8); ctx.lineTo(-4.2, tB - 3); ctx.stroke();
    // arms on the shoulder pins + claw hands (the hand turns on its wrist pin in one idle fidget)
    [-1, 1].forEach((s, k) => {
      const a = q.arms[k] || 0, th = -a * fx;
      const shX = s * 3.75, shY = tT + 1.1, vx = s * 2.45, vy = 6.0;
      const hX = shX + vx * Math.cos(th) - vy * Math.sin(th), hY = shY + vx * Math.sin(th) + vy * Math.cos(th);
      const mx = shX + (hX - shX) * 0.5 + s * 1.0, my = shY + (hY - shY) * 0.5 + 0.4;
      ctx.lineCap = 'round';
      ctx.strokeStyle = shx(FIG.shirt, 0.86); ctx.lineWidth = 3.0;
      ctx.beginPath(); ctx.moveTo(shX, shY); ctx.quadraticCurveTo(mx, my, hX, hY - 1.1); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(shX - 0.5 * s, shY - 0.6); ctx.quadraticCurveTo(mx - s * 0.4, my - 0.8, hX - s * 0.9, hY - 1.8); ctx.stroke();
      ctx.fillStyle = glossH(ctx, hX - 1.4, hX + 1.4, FIG.skin);
      ctx.beginPath(); ctx.arc(hX, hY, 1.4, 0, TAU); ctx.fill();
      const ha = (q.hand && s > 0 ? 1.4 : 0) + th;
      ctx.fillStyle = shx(FIG.skin, 0.55);
      ctx.beginPath(); ctx.arc(hX + Math.sin(ha) * 0.55 + s * 0.25 * Math.cos(ha), hY + Math.cos(ha) * 0.55, 0.62, 0, TAU); ctx.fill();
    });
    // neck + head (yellow cylinder with a printed face that looks around)
    const hb = bob + (q.hatLag ? 0 : 0);
    const hT = -27.1 + hb, hB = -20.2 + hb;
    ctx.fillStyle = shx(FIG.skin, 0.78); ctx.fillRect(-1.6, hB - 0.2, 3.2, 1.2);
    ctx.fillStyle = glossH(ctx, -3.6, 3.6, FIG.skin);
    ctx.beginPath(); ctx.moveTo(-3.6, hT); ctx.lineTo(-3.6, hB - 0.9); ctx.ellipse(0, hB - 0.9, 3.6, 0.95, 0, Math.PI, 0, true); ctx.lineTo(3.6, hT); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; rrect(ctx, -2.65, hT + 1.6, 0.6, 3.6, 0.3); ctx.fill();
    const fo = fx * (q.look !== undefined ? q.look : 0.85), ey = -23.9 + hb;
    ctx.fillStyle = DARK; ctx.strokeStyle = DARK; ctx.lineCap = 'round';
    if (q.blink) {
      ctx.lineWidth = 0.45;
      ctx.beginPath(); for (const ex of [-1.35, 1.35]) { ctx.moveTo(fo + ex - 0.55, ey + 0.1); ctx.quadraticCurveTo(fo + ex, ey + 0.45, fo + ex + 0.55, ey + 0.1); } ctx.stroke();
    } else if (q.hurt) {
      for (const ex of [-1.4, 1.4]) { ctx.beginPath(); ctx.arc(fo + ex, ey, 0.78, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#fff'; for (const ex of [-1.4, 1.4]) { ctx.beginPath(); ctx.arc(fo + ex, ey, 0.38, 0, TAU); ctx.fill(); }
    } else {
      for (const ex of [-1.35, 1.35]) { ctx.beginPath(); ctx.ellipse(fo + ex, ey, 0.5, 0.76, 0, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#fff';
      for (const ex of [-1.35, 1.35]) { ctx.beginPath(); ctx.arc(fo + ex - 0.16, ey - 0.3, 0.18, 0, TAU); ctx.fill(); }
    }
    ctx.lineWidth = 0.42;
    ctx.beginPath(); ctx.moveTo(fo - 2.0, ey - 1.35 - (q.hurt ? 0.4 : 0)); ctx.lineTo(fo - 0.8, ey - 1.6 - (q.hurt ? 0.5 : 0)); ctx.moveTo(fo + 0.8, ey - 1.6 - (q.hurt ? 0.5 : 0)); ctx.lineTo(fo + 2.0, ey - 1.35 - (q.hurt ? 0.4 : 0)); ctx.stroke();
    if (q.hurt) { ctx.fillStyle = DARK; ctx.beginPath(); ctx.ellipse(fo, ey + 1.6, 0.8, 0.95, 0, 0, TAU); ctx.fill(); }
    else { ctx.lineWidth = 0.48; ctx.beginPath(); ctx.arc(fo, ey + 0.7, 1.5, 0.22 * Math.PI, 0.78 * Math.PI); ctx.stroke(); }
    // pith helmet: a separate piece that lags the hop and pops up on a hit
    const bY = hT + 0.5 + (q.hatLag || 0);
    ctx.fillStyle = shx(FIG.hat, 0.66);
    ctx.beginPath(); ctx.ellipse(0, bY + 0.45, 5.8, 1.95, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = glossH(ctx, -5.8, 5.8, FIG.hat);
    ctx.beginPath(); ctx.ellipse(0, bY, 5.8, 1.85, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 0.4;
    ctx.beginPath(); ctx.ellipse(0, bY, 5.5, 1.6, 0, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, bY - 0.5, 4.05, 4.5, 0, Math.PI, TAU); ctx.closePath();
    ctx.fillStyle = glossH(ctx, -4.05, 4.05, FIG.hat); ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = FIG.band; ctx.fillRect(-4.2, bY - 1.7, 8.4, 1.2);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.ellipse(-1.7, bY - 3.3, 1.15, 0.55, -0.55, 0, TAU); ctx.fill();
    ctx.fillStyle = shx(FIG.hat, 1.05);
    ctx.beginPath(); ctx.ellipse(0, bY - 4.95, 0.9, 0.42, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  /** Fast creature: a translucent ghost piece (sheet with raised arms). f 0-5 drift poses, 6 hit (flared, arms high). Bottom at (0, 0). */
  function ghostPaint(ctx, f) {
    const hit = f >= 6, ph = hit ? 0 : (f / 6) * TAU;
    const aL = hit ? -3.2 : Math.sin(ph) * 1.2, aR = hit ? -3.2 : -Math.sin(ph) * 1.2, fl = hit ? 1.4 : 1;
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(-6.2, -14.5);
      ctx.arc(0, -14.5, 6.2, Math.PI, TAU);
      ctx.lineTo(6.6, -8.5);
      ctx.quadraticCurveTo(9.6, -11.4 + aR, 9.9, -13.6 + aR);
      ctx.quadraticCurveTo(10.6, -9.5, 7.2 * fl, -5.6);
      ctx.lineTo(7.4 * fl, -1.2);
      for (let i = 0; i < 4; i++) {
        const x1 = 7.4 * fl - ((i + 1) * 14.8 * fl) / 4, xm = 7.4 * fl - ((i + 0.5) * 14.8 * fl) / 4;
        ctx.quadraticCurveTo(xm, 1.4 + Math.sin(ph + i * 1.7) * 1.2, x1, -1.2 + Math.sin(ph * 2 + i) * 0.4);
      }
      ctx.lineTo(-7.2 * fl, -5.6);
      ctx.quadraticCurveTo(-10.6, -9.5, -9.9, -13.6 + aL);
      ctx.quadraticCurveTo(-9.6, -11.4 + aL, -6.6, -8.5);
      ctx.closePath();
    };
    path();
    const g = ctx.createRadialGradient(-1.5, -14, 1, 0, -9, 12);
    g.addColorStop(0, 'rgba(250,253,255,0.5)'); g.addColorStop(0.6, 'rgba(205,232,255,0.55)'); g.addColorStop(1, 'rgba(150,200,245,0.78)');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 0.75; ctx.stroke();
    ctx.save(); path(); ctx.clip();
    ctx.strokeStyle = 'rgba(110,165,225,0.45)'; ctx.lineWidth = 1.6; path(); ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.1; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, -14.5, 4.7, 1.12 * Math.PI, 1.42 * Math.PI); ctx.stroke();
    ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-5.4, -10.5); ctx.lineTo(-5.6, -5.5); ctx.stroke();
    ctx.fillStyle = DARK;
    const er = hit ? 1.35 : 1;
    ctx.beginPath(); ctx.ellipse(-2.1, -14.4, 1.05 * er, 1.5 * er, 0, 0, TAU); ctx.ellipse(2.1, -14.4, 1.05 * er, 1.5 * er, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -10.2, 0.95 * er, (1.25 + Math.sin(ph) * 0.25) * er, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-2.4, -15, 0.32, 0, TAU); ctx.arc(1.8, -15, 0.32, 0, TAU); ctx.fill();
  }
  /** Collectible: a round stud coin standing up, spin angle a. Centre at (0, 0). */
  function coinPaint(ctx, a, big) {
    const R = big ? 4.3 : 3.1, T = big ? 1.5 : 1.15;
    const h = big ? '#ffc81e' : '#2f9bff';
    const cs = Math.cos(a), sn = Math.sin(a);
    const rx = Math.max(0.35, R * Math.abs(cs)), e = T * Math.abs(sn), off = (e / 2) * (sn >= 0 ? 1 : -1);
    ctx.fillStyle = shx(h, 0.62);
    ctx.beginPath(); ctx.ellipse(-off, 0, rx, R, 0, 0, TAU); ctx.fill();
    ctx.fillRect(Math.min(-off, off), -R, Math.abs(off * 2), R * 2);
    const g = ctx.createLinearGradient(off - rx, -R, off + rx, R);
    g.addColorStop(0, shx(h, 1.3, 30)); g.addColorStop(0.45, shx(h, 1.02)); g.addColorStop(1, shx(h, 0.74));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(off, 0, rx, R, 0, 0, TAU); ctx.fill();
    if (Math.abs(cs) > 0.3) {
      ctx.strokeStyle = shx(h, 0.75); ctx.lineWidth = R * 0.16;
      ctx.beginPath(); ctx.ellipse(off, 0, rx * 0.62, R * 0.62, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = R * 0.14; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.ellipse(off, 0, rx * 0.62, R * 0.62, 0, 1.05 * Math.PI, 1.5 * Math.PI); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath(); ctx.ellipse(off - rx * 0.45, -R * 0.5, Math.max(0.2, rx * 0.16), R * 0.2, 0.4, 0, TAU); ctx.fill();
  }
  function bakeVec(w, h, ax, ay, k, fn) {
    const pad = 2;
    const { c, ctx } = U.canvas(w * k + pad * 2, h * k + pad * 2);
    ctx.translate(pad + ax * k, pad + ay * k);
    ctx.scale(k, k);
    fn(ctx);
    return { c, ax: pad + ax * k, ay: pad + ay * k, glow: [] };
  }

  /* ================================ sprite caches ================================ */
  const SET = {}, PROPS = {}, FX = {}, DEBRIS = {};
  const DEB = {};
  function charSet(builder, nf, k) {
    const frames = [[], []];
    let shadow = null;
    for (let f = 0; f < nf; f++) {
      const m = builder(f);
      frames[0].push(renderBk(m, k));
      frames[1].push(renderBk(m.mirror(), k));
      if (f === 0) shadow = renderShadowBk(m, k, 0.42);
    }
    return { frames, shadow, tint: new Map() };
  }
  function tintOf(set, side, fi, color) {
    const key = side * 100 + fi + color;
    let t = set.tint.get(key);
    if (!t) { const s = set.frames[side][fi]; t = { c: U.tint(s.c, color), ax: s.ax, ay: s.ay, glow: s.glow }; set.tint.set(key, t); }
    return t;
  }
  function glowSprite(r, g, b, size = 64) {
    return U.sprite(size, size, (ctx, w) => {
      const gr = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      gr.addColorStop(0, `rgba(${r},${g},${b},0.9)`); gr.addColorStop(0.35, `rgba(${r},${g},${b},0.32)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = gr; ctx.fillRect(0, 0, w, w);
    });
  }
  function softShadow() {
    return U.sprite(64, 32, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(10,25,45,0.5)'); g.addColorStop(0.55, 'rgba(10,25,45,0.32)'); g.addColorStop(1, 'rgba(10,25,45,0)');
      ctx.save(); ctx.scale(1, h / w); ctx.fillStyle = g; ctx.fillRect(0, 0, w, w); ctx.restore();
    });
  }
  function star(size, col) {
    return U.sprite(size, size, (ctx, w) => {
      const c = w / 2;
      ctx.fillStyle = col;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU - Math.PI / 2, r = i & 1 ? w * 0.09 : w * 0.48;
        ctx.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r);
      }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(c, c, w * 0.08, 0, TAU); ctx.fill();
    });
  }

  function buildAll() {
    STUDS.clear();
    // main character: 16 poses (0-7 walk, 8-11 idle, 12 blink, 13 crouch, 14 lunge, 15 hurt), for both facings
    SET.fig = { frames: [[], []], tint: new Map() };
    for (let side = 0; side < 2; side++) for (let f = 0; f < 16; f++) {
      SET.fig.frames[side].push(bakeVec(28, 40, 14, 37.5, K, (ctx) => figPaint(ctx, f, side ? -1 : 1)));
    }
    SET.ghost = { frames: [[], []], tint: new Map() };
    for (let f = 0; f < 7; f++) {
      const s = bakeVec(23, 22, 11.5, 20.5, K, (ctx) => ghostPaint(ctx, f));
      SET.ghost.frames[0].push(s);
      SET.ghost.frames[1].push({ c: U.flipX(s.c), ax: s.c.width - s.ax, ay: s.ay, glow: [] });
    }
    SET.creeper = charSet((f) => beetleModel(f, 0), 7, K);
    SET.creeper2 = charSet((f) => beetleModel(f, 1), 7, K);
    SET.colossus = charSet(robotModel, 7, K);
    SET.beacon = renderBk(beaconModel(), K);
    SET.bolt = renderBk(boltModel(), K);
    SET.coin = [], SET.coinBig = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI;
      SET.coin.push(bakeVec(9, 9, 4.5, 4.5, K, (ctx) => coinPaint(ctx, a, false)));
      SET.coinBig.push(bakeVec(12, 12, 6, 6, K, (ctx) => coinPaint(ctx, a, true)));
    }
    const prop = (name, m, o = {}) => {
      const s = renderBk(m, K);
      s.sh = renderShadowBk(m, K, 0.45);
      s.hw = (m.w * SX) / 2;
      s.top = s.ay / K;
      Object.assign(s, o);
      PROPS[name] = s;
    };
    prop('tree', treeModel(0), { occl: true });
    prop('tree1', treeModel(1), { occl: true });
    prop('pine', pineModel(), { occl: true });
    prop('bush', bushModel());
    prop('rockPile', rockModel());
    prop('lampPost', lampModel(), { occl: true });
    prop('fence', fenceModel());
    prop('brickPile', pileModel());
    prop('house', houseModel(), { occl: true });
    prop('trafficCone', coneModel());
    prop('signPost', signModel());
    // flying debris: 1x1 brick, 1x2 brick, 2x2 plate, 1x1 round plate, 1x1 plate
    const shapes = [
      (c) => new Bk(1, 1, 3).brick(0, 0, 0, 1, 1, c),
      (c) => new Bk(2, 1, 3).brick(0, 0, 0, 2, 1, c),
      (c) => new Bk(2, 2, 1).plate(0, 0, 0, 2, 2, c),
      (c) => new Bk(1, 1, 1).part(0, 0, 0, 1, 1, 1, c, { round: true }),
      (c) => new Bk(1, 1, 1).plate(0, 0, 0, 1, 1, c),
    ];
    const debCols = new Set();
    Object.assign(DEB, {
      creeper: [P.red, P.red, P.black, P.white, P.dred], creeper2: [P.yellow, P.yellow, P.black, P.white, P.red], ghost: [P.trClear, P.trClear, P.trBlue],
      colossus: [P.blue, P.lgrey, P.dgrey, P.yellow, P.red, P.black], fig: [P.orange, P.blue, P.yellow, P.tan],
      toy: [P.red, P.yellow, P.blue, P.lime, P.white, P.orange, P.azure], gold: [P.yellow, P.trYellow, P.orange],
      dust: [P.white, P.lgrey], blue: [P.azure, P.trBlue, P.white],
    });
    for (const k in DEB) for (const c of DEB[k]) debCols.add(c);
    for (const c of debCols) DEBRIS[c] = shapes.map((fn) => renderBk(fn(c), K));
    FX.warm = glowSprite(255, 210, 110);
    FX.red = glowSprite(255, 70, 40);
    FX.blue = glowSprite(120, 190, 255);
    FX.gold = glowSprite(255, 210, 80);
    FX.white = glowSprite(255, 255, 255);
    FX.shadow = softShadow();
    FX.star = star(32, '#fff6c8');
    FX.starB = star(32, '#d8f1ff');
    VIG = null;
  }

  /* ================================ ground: a stud-covered baseplate ================================ */
  const GR = 0, FOR = 1, HILL = 2, SAND = 3, ROAD = 4, CURB = 5, PLAZA = 6, WATER = 7, DEEP = 8;
  const MATS = [
    { h: '#47a347', lvl: 0, stud: true, seam: 16 },   // baseplate green
    { h: '#2f8540', lvl: 0, stud: true, seam: 16 },   // dark green baseplate
    { h: '#8cc63f', lvl: 1, stud: true, seam: 4 },    // raised lime plates
    { h: '#e2cb96', lvl: 0, stud: true, seam: 8 },    // tan baseplate
    { h: '#666d73', lvl: 0, stud: false, seam: 2 },   // road tiles
    { h: '#c6cbce', lvl: 0, stud: false, seam: 2 },   // curb tiles
    { h: '#a7acb0', lvl: 1, stud: true, seam: 4 },    // raised light grey plates
    { h: '#3d92e8', lvl: -1, stud: true, seam: 8, trans: true }, // transparent blue plates
    { h: '#2b70d2', lvl: -1, stud: true, seam: 8, trans: true },
  ];
  const MAT_COL = MATS.map((m) => C(m.h));
  const WATER_STUD = C('#8fcaff', 0.75);
  for (const m of MATS) {
    const c = hex(m.h);
    m.top = rgbs(c[0], c[1], c[2]);
    m.f0 = rgbs(c[0] * 1.16 + 10, c[1] * 1.16 + 10, c[2] * 1.16 + 10);
    m.f1 = rgbs(c[0] * 0.84, c[1] * 0.84, c[2] * 0.84);
    m.f2 = rgbs(c[0] * 0.64, c[1] * 0.64, c[2] * 0.64);
  }

  /** Distance (world units) to the zero line of a noise field: |n| / |grad n| keeps the road width constant. */
  function lineDist(x, y, sc, ox, oy, seed) {
    const v = U.perlin(x / sc + ox, y / sc + oy, seed);
    const gx = U.perlin((x + 1) / sc + ox, y / sc + oy, seed) - v, gy = U.perlin(x / sc + ox, (y + 1) / sc + oy, seed) - v;
    return Math.abs(v) / Math.max(1e-5, Math.sqrt(gx * gx + gy * gy));
  }
  const ROAD_W = 11.5;
  function roadV(i, j) {
    const x = (i + 0.5) * SX, y = (j + 0.5) * SY;
    return Math.min(lineDist(x, y, 600, 0, 0, 55), lineDist(x, y, 860, 9.1, -3.3, 66));
  }
  const isRoadCell = (i, j) => roadV(i, j) < ROAD_W;
  /** Centre line of a road (white lane dash tiles). */
  function roadCentre(i, j) {
    const v = roadV(i, j);
    if (v > 3) return false;
    return (v <= roadV(i - 1, j) && v <= roadV(i + 1, j)) || (v <= roadV(i, j - 1) && v <= roadV(i, j + 1));
  }
  /** Material of a ground cell (cell = one stud). Pure function of the cell -> seamless chunks. */
  function baseMat(i, j) {
    const x = (i + 0.5) * SX, y = (j + 0.5) * SY;
    const pond = U.fbm(x / 520 + 3.1, y / 520 - 7.7, 91, 3) - (x * x + y * y < 90 * 90 ? 0.2 : 0);
    if (pond > 0.705) return DEEP;
    if (pond > 0.668) return WATER;
    if (isRoadCell(i, j)) return ROAD;
    if (pond > 0.64) return SAND;
    if (U.fbm(x / 340 - 4.2, y / 340 + 8.1, 23, 3) > 0.672) return PLAZA;
    if (U.fbm(x / 250 + 1.7, y / 250 - 2.9, 11, 3) > 0.645) return HILL;
    if (U.fbm(x / 300 + 5.3, y / 300 + 0.7, 37, 2) > 0.625) return FOR;
    return GR;
  }
  function cellMat(i, j) {
    const m = baseMat(i, j);
    if (m !== ROAD) return m;
    if (baseMat(i - 1, j) !== ROAD || baseMat(i + 1, j) !== ROAD || baseMat(i, j - 1) !== ROAD || baseMat(i, j + 1) !== ROAD) return CURB;
    return ROAD;
  }

  /* ---- small toy parts on the ground (baked per resolution) ---- */
  const DECALS = new Map();
  const FLOWER_COLS = ['#d4231c', '#f7c81e', '#f2f2ec', '#f58cba', '#33b1e2', '#7b4fbf'];
  function decalSprite(kind, v, k) {
    const key = kind + v + '@' + k;
    let s = DECALS.get(key);
    if (s) return s;
    const W = 9, H = 12;
    s = bakeVec(W, H, W / 2, H - 3, k, (ctx) => {
      if (kind === 'flower') {
        const h = FLOWER_COLS[v % FLOWER_COLS.length];
        ctx.fillStyle = 'rgba(10,30,10,0.28)'; ctx.beginPath(); ctx.ellipse(0.5, 0.4, 3.3, 2.5, 0, 0, TAU); ctx.fill();
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * TAU - Math.PI / 2 + v;
          const px = Math.cos(a) * 1.6, py = Math.sin(a) * 1.28 - 0.9;
          ctx.fillStyle = shx(h, 0.72); ctx.beginPath(); ctx.ellipse(px + 0.15, py + 0.35, 1.2, 1.0, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = shx(h, 1.06, 6); ctx.beginPath(); ctx.ellipse(px, py, 1.2, 0.98, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.arc(px - 0.45, py - 0.35, 0.3, 0, TAU); ctx.fill();
        }
        ctx.fillStyle = v % FLOWER_COLS.length === 1 ? '#f07e1f' : '#f7c81e';
        ctx.beginPath(); ctx.ellipse(0, -0.95, 0.85, 0.7, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(-0.3, -1.2, 0.25, 0, TAU); ctx.fill();
      } else if (kind === 'plant') {
        const h = v & 1 ? '#4caf48' : '#21883f';
        ctx.fillStyle = 'rgba(10,30,10,0.28)'; ctx.beginPath(); ctx.ellipse(0.8, 0.4, 2.6, 1.4, 0, 0, TAU); ctx.fill();
        const leaf = (ang, len, wid) => {
          ctx.save(); ctx.rotate(ang);
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(wid, -len * 0.45, 0, -len); ctx.quadraticCurveTo(-wid, -len * 0.45, 0, 0);
          ctx.fillStyle = glossH(ctx, -wid, wid, h); ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 0.28;
          ctx.beginPath(); ctx.moveTo(-wid * 0.25, -len * 0.25); ctx.quadraticCurveTo(-wid * 0.45, -len * 0.55, -0.1, -len * 0.85); ctx.stroke();
          ctx.restore();
        };
        leaf(-0.75, 5.2, 1.3); leaf(0.75, 5.2, 1.3); leaf(0.05, 6.8, 1.45);
      } else if (kind === 'round') {
        const h = ['#d4231c', '#f7c81e', '#1c5fc6', '#f2f2ec', '#f07e1f', '#33b1e2'][v % 6];
        ctx.fillStyle = 'rgba(10,30,10,0.3)'; ctx.beginPath(); ctx.ellipse(0.5, 0.35, 2.8, 2.25, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = glossH(ctx, -2.6, 2.6, h);
        ctx.beginPath(); ctx.moveTo(-2.6, -1.6); ctx.lineTo(-2.6, 0); ctx.ellipse(0, 0, 2.6, 2.08, 0, Math.PI, 0, true); ctx.lineTo(2.6, -1.6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = shx(h, 1.08, 6); ctx.beginPath(); ctx.ellipse(0, -1.6, 2.6, 2.08, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = shx(h, 1.0); ctx.beginPath(); ctx.ellipse(0, -2.4, 1.55, 1.24, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = shx(h, 1.16, 10); ctx.beginPath(); ctx.ellipse(0, -2.9, 1.55, 1.24, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 0.4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.ellipse(0, -2.9, 1.1, 0.85, 0, 1.05 * Math.PI, 1.52 * Math.PI); ctx.stroke();
      } else if (kind === 'lily') {
        ctx.fillStyle = 'rgba(0,30,80,0.3)'; ctx.beginPath(); ctx.ellipse(0.6, 0.5, 3.6, 2.8, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = glossH(ctx, -3.4, 3.4, '#4caf48');
        ctx.beginPath(); ctx.moveTo(0, -0.6); ctx.ellipse(0, -0.6, 3.4, 2.6, 0, -1.1, 4.9); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#f58cba'; ctx.beginPath(); ctx.ellipse(0.4, -1.2, 1.2, 0.95, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0.1, -1.45, 0.32, 0, TAU); ctx.fill();
      }
    });
    DECALS.set(key, s);
    return s;
  }

  const WATER_SPARK = new Map();
  function* groundChunk(ctx, info) {
    const res = info.res, wx = info.wx, wy = info.wy;
    const i0 = Math.floor(wx / SX) - 1, i1 = Math.floor((wx + info.size) / SX) + 1;
    const j0 = Math.floor(wy / SY) - 1, j1 = Math.floor((wy + info.size) / SY) + 2;
    const GW = i1 - i0 + 3, GH = j1 - j0 + 3;
    const M = new Uint8Array(GW * GH);
    // base materials (+1 border), then curbs
    const B = new Uint8Array(GW * GH);
    for (let gj = 0; gj < GH; gj++) {
      if ((gj & 3) === 3) yield;
      for (let gi = 0; gi < GW; gi++) B[gj * GW + gi] = baseMat(i0 - 1 + gi, j0 - 1 + gj);
    }
    for (let gj = 0; gj < GH; gj++) for (let gi = 0; gi < GW; gi++) {
      const k = gj * GW + gi;
      let m = B[k];
      if (m === ROAD) {
        const n = (dx, dy) => { const a = gi + dx, b = gj + dy; return a < 0 || b < 0 || a >= GW || b >= GH ? ROAD : B[b * GW + a]; };
        if (n(-1, 0) !== ROAD || n(1, 0) !== ROAD || n(0, -1) !== ROAD || n(0, 1) !== ROAD) m = CURB;
      }
      M[k] = m;
    }
    const mat = (i, j) => M[(j - j0 + 1) * GW + (i - i0 + 1)];
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const X = (x) => Math.round((x - wx) * res), Y = (y) => Math.round((y - wy) * res);
    const lw = Math.max(1, Math.round(res * 0.3));
    ctx.fillStyle = MATS[GR].top;
    ctx.fillRect(0, 0, info.px, info.px);
    const sparks = [];
    for (let j = j0; j <= j1; j++) {
      if ((j & 1) === 1) yield;
      // pass 1: plate tops, edges and front faces
      for (let i = i0; i <= i1; i++) {
        const mi = mat(i, j), m = MATS[mi], lvl = m.lvl;
        const x0 = X(i * SX), x1 = X((i + 1) * SX);
        const y0 = Y(j * SY - lvl * PH), y1 = Y((j + 1) * SY - lvl * PH);
        ctx.fillStyle = m.top; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
        const mn = mat(i, j - 1), ms = mat(i, j + 1), mw = mat(i - 1, j), me = mat(i + 1, j);
        const ln = MATS[mn].lvl, ls = MATS[ms].lvl, lwv = MATS[mw].lvl;
        // seams between plates / tiles
        const sz = m.seam;
        if (mw === mi && ((i % sz) + sz) % sz === 0) { ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x0, y0, lw, y1 - y0); }
        if (mn === mi && ((j % sz) + sz) % sz === 0) { ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x0, y0, x1 - x0, lw); }
        if (mi === ROAD && (((i + j) % 4) + 4) % 4 < 2 && roadCentre(i, j)) {
          ctx.fillStyle = '#eeeeE8'; ctx.fillRect(x0 + lw, y0 + lw, x1 - x0 - lw * 2, y1 - y0 - lw * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x0 + lw, y0 + lw, x1 - x0 - lw * 2, lw);
          ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x0 + lw, y1 - lw * 2, x1 - x0 - lw * 2, lw);
        }
        if (!m.stud && ((j % 2) + 2) % 2 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(x0, y0 + lw, x1 - x0, lw); }
        if (!m.stud && ((i % 2) + 2) % 2 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x0 + lw, y0, lw, y1 - y0); }
        if (m.trans) {
          ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(x0, y0, x1 - x0, (y1 - y0) >> 1);
          if (mn !== WATER && mn !== DEEP) { ctx.fillStyle = 'rgba(0,20,60,0.3)'; ctx.fillRect(x0, y0, x1 - x0, Math.round(res * 1.4)); }
          if (mi === WATER && U.hash2(i, j, 31) < 0.12) sparks.push((i + 0.25 + U.hash2(i, j, 32) * 0.5) * SX, (j + 0.2 + U.hash2(i, j, 33) * 0.6) * SY - lvl * PH, U.hash2(i, j, 34) * TAU);
        }
        // raised edges: lit rims, contact shadows from higher neighbours
        if (ln < lvl) { ctx.fillStyle = 'rgba(255,255,255,0.42)'; ctx.fillRect(x0, y0, x1 - x0, lw); }
        if (lwv < lvl) { ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(x0, y0, lw, y1 - y0); }
        if (ln > lvl) {
          const g = ctx.createLinearGradient(0, y0, 0, y0 + res * 2.2);
          g.addColorStop(0, 'rgba(10,25,40,0.34)'); g.addColorStop(1, 'rgba(10,25,40,0)');
          ctx.fillStyle = g; ctx.fillRect(x0, y0, x1 - x0, Math.ceil(res * 2.2));
        }
        if (lwv > lvl) {
          const g = ctx.createLinearGradient(x0, 0, x0 + res * 2.4, 0);
          g.addColorStop(0, 'rgba(10,25,40,0.3)'); g.addColorStop(1, 'rgba(10,25,40,0)');
          ctx.fillStyle = g; ctx.fillRect(x0, y0, Math.ceil(res * 2.4), y1 - y0);
        }
        // front face of a plate that stands above its southern neighbour
        if (ls < lvl) {
          const fy1 = Y((j + 1) * SY - ls * PH);
          const g = ctx.createLinearGradient(0, y1, 0, fy1);
          g.addColorStop(0, m.f0); g.addColorStop(0.25, m.f1); g.addColorStop(1, m.f2);
          ctx.fillStyle = g; ctx.fillRect(x0, y1, x1 - x0, fy1 - y1);
          ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x0, y1, x1 - x0, lw);
          if (me !== mi && MATS[me].lvl < lvl) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x1 - lw, y1, lw, fy1 - y1); }
        }
      }
      // pass 2: studs and small toy parts of this row
      for (let i = i0; i <= i1; i++) {
        const mi = mat(i, j), m = MATS[mi];
        const cx = X((i + 0.5) * SX), cy = Y((j + 0.5) * SY - m.lvl * PH);
        const h = U.hash2(i, j, 777);
        let decal = null;
        if (mi === GR || mi === FOR) {
          // flower beds: one colour per bed (noise patches); plants cluster in clumps; loose round studs are rare
          const wx = (i + 0.5) * SX, wy = (j + 0.5) * SY;
          const bed = U.noise(wx / 70, wy / 70, 1301), clump = U.noise(wx / 48, wy / 48, 1302);
          if (bed > 0.68 && h < 0.3) decal = decalSprite('flower', ((Math.floor(U.noise(wx / 160, wy / 160, 1303) * 9) + (h < 0.03 ? 2 : 0)) % 6) + 6 * Math.floor(h * 9), res);
          else if (clump > 0.64 ? h < 0.14 : h < 0.004) decal = decalSprite('plant', Math.floor(U.hash2(i, j, 6) * 4), res);
          else if (h > 0.9992) decal = decalSprite('round', Math.floor(U.hash2(i, j, 7) * 60), res);
        } else if (mi === HILL) {
          if (h < 0.02) decal = decalSprite('flower', Math.floor(U.hash2(i, j, 5) * 60), res);
          else if (h < 0.03) decal = decalSprite('plant', 1, res);
        } else if (mi === SAND) {
          if (h < 0.012) decal = decalSprite('round', Math.floor(U.hash2(i, j, 7) * 60), res);
        } else if (mi === PLAZA) {
          if (h < 0.012) decal = decalSprite('flower', Math.floor(U.hash2(i, j, 5) * 60), res);
        } else if (mi === WATER) {
          const shore = mat(i - 1, j) < WATER || mat(i + 1, j) < WATER || mat(i, j - 1) < WATER || mat(i, j + 1) < WATER;
          if (!shore && h < 0.02) decal = decalSprite('lily', 0, res);
        }
        if (decal) { ctx.drawImage(decal.c, cx - decal.ax, cy - decal.ay + Math.round(res * 0.6)); continue; }
        if (!m.stud) continue;
        const s = studSprite(m.trans ? WATER_STUD : MAT_COL[mi], res);
        ctx.drawImage(s.c, Math.round(cx - s.ax), Math.round(cy - s.ay + res * 0.4));
      }
    }
    ctx.restore();
    WATER_SPARK.set(info.cx + ',' + info.cy, new Float32Array(sparks));
    if (WATER_SPARK.size > 160) WATER_SPARK.delete(WATER_SPARK.keys().next().value);
  }

  /* ================================ props ================================ */
  const PROP_TABLE = {
    [GR]: [[0.1, 'tree'], [0.14, 'pine'], [0.21, 'bush'], [0.24, 'rockPile'], [0.27, 'fence'], [0.282, 'brickPile'], [0.292, 'signPost']],
    [FOR]: [[0.22, 'pine'], [0.44, 'tree'], [0.52, 'bush'], [0.55, 'rockPile']],
    [HILL]: [[0.1, 'tree'], [0.18, 'bush'], [0.22, 'rockPile'], [0.25, 'brickPile']],
    [SAND]: [[0.08, 'rockPile'], [0.12, 'brickPile'], [0.15, 'trafficCone'], [0.17, 'signPost']],
    [PLAZA]: [[0.12, 'lampPost'], [0.22, 'house'], [0.27, 'signPost'], [0.32, 'brickPile'], [0.36, 'trafficCone'], [0.4, 'bush']],
    [CURB]: [[0.1, 'trafficCone'], [0.17, 'lampPost']],
  };
  function genProps(info) {
    const out = [];
    G.scatterOwned(info, 46, 7071, (x, y, rng) => {
      if (G.nearSpawn(x, y, 70)) return;
      const ci = Math.floor(x / SX), cj = Math.floor(y / SY);
      const mi = cellMat(ci, cj);
      const table = PROP_TABLE[mi];
      if (!table) return;
      const r = rng.next();
      let t = null;
      for (const [p, name] of table) if (r < p) { t = name; break; }
      if (!t) return;
      const s = PROPS[t];
      const i0 = ci - Math.floor(s.w / 2), j0 = cj - Math.floor(s.d / 2);
      for (let j = j0; j < j0 + s.d; j++) for (let i = i0; i < i0 + s.w; i++) if (cellMat(i, j) !== mi) return;
      if (mi !== CURB && cellMat(i0, j0 + s.d) !== mi) return; // keep props off plate edges
      const lift = MATS[mi].lvl * PH;
      const px = i0 * SX + (s.w * SX) / 2, py = j0 * SY + (s.d * SY) / 2;
      const pr = { x: px, y: py, t, lift, sortY: py + s.d * SY * 0.3, pad: 80 };
      if (t === 'tree' && rng.next() < 0.45) pr.v = 1;
      out.push(pr);
    });
    return out;
  }

  /* ================================ particles ================================ */
  const SHAPE_W = [0.22, 0.35, 0.26, 0.12, 0.05];
  const SHAPE_CUM = (() => { let a = 0; const s = SHAPE_W.reduce((p, q) => p + q, 0); return SHAPE_W.map((w) => (a += w / s)); })();
  function pickShape(only) {
    if (only !== undefined) return only;
    const r = Math.random();
    for (let i = 0; i < SHAPE_CUM.length; i++) if (r < SHAPE_CUM[i]) return i;
    return 0;
  }
  function bricks(game, x, y, z, pal, n, o = {}) {
    const sp = o.speed || 70;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = sp * (0.35 + Math.random() * 0.8);
      game.addParticle({
        x: x + (Math.random() - 0.5) * (o.spread || 6), y: y + (Math.random() - 0.5) * (o.spread || 6) * 0.5,
        z: z + Math.random() * (o.zr || 6), vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: (o.vz || 90) * (0.5 + Math.random() * 0.8),
        grav: o.grav !== undefined ? o.grav : 330, drag: o.drag !== undefined ? o.drag : 1.3, life: (o.life || 1) * (0.7 + Math.random() * 0.6),
        size: (o.size || 2.4) * (0.75 + Math.random() * 0.5), kind: 'brick', ci: pal[(Math.random() * pal.length) | 0], sh: pickShape(o.shape),
        vr: (Math.random() - 0.5) * 14, rot: Math.random() * TAU,
      });
    }
  }
  function sparks(game, x, y, z, n, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = (o.speed || 70) * (0.3 + Math.random() * 0.8);
      game.addParticle({ x, y, z: z + Math.random() * 4, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: (o.vz || 30) * Math.random(), grav: o.grav || 0, drag: 3.5, life: (o.life || 0.45) * (0.6 + Math.random() * 0.7), size: (o.size || 4) * (0.7 + Math.random() * 0.6), kind: 'star', blue: !!o.blue, vr: (Math.random() - 0.5) * 6 });
    }
  }
  function ring(game, x, y, r0, r1, life = 0.6, color = '#ffffff', studs = 12) {
    game.addParticle({ x, y, z: 0, life, r0, r1, color, studs, kind: 'ring', drag: 0 });
  }
  /** Core flash: a white plastic pop (star + quick ring) that snaps open. */
  function pop(game, x, y, z, size, life, blue) {
    const p = game.addParticle({ x, y, z, life, size, kind: 'pop', drag: 0 });
    if (p) p.blue = !!blue;
  }
  const FR = { breaks: 0 };
  const setOf = (e) => (e.type === 'creeper' && e.seed > 0.5 ? SET.creeper2 : SET[e.type]);
  const setKey = (e) => (e.type === 'creeper' && e.seed > 0.5 ? 'creeper2' : e.type);
  /** Vanish: the hit pose pops apart into brick-sized blocks (source rectangles of the sprite) that jump out, tumble in
      stepped turns (stop-motion on twos), land on the baseplate and fade; the ghost piece floats apart instead. */
  function popApart(ctx, set, side, x, y, u, type, seed) {
    const s = set.frames[side][6], fl = u < 0.35 ? tintOf(set, side, 6, '#ffffff') : null;
    const W = s.c.width, H = s.c.height, big = type === 'colossus', ghost = type === 'ghost';
    const cols = big ? 3 : 2, rows = big ? 5 : 3, pw = W / cols, ph = H / rows;
    const us = Math.floor(u * 12) / 12; // positions advance on twos
    const ease = 1 - (1 - us) * (1 - us), fade = 1 - U.smoothstep(0.55, 1, u);
    const cy0 = -(s.ay / K) * 0.5;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const h = U.hashInt(c, r, (seed * 1e5) | 0);
      const hx = (h & 255) / 255, hy = ((h >>> 8) & 255) / 255, hs = ((h >>> 16) & 255) / 255;
      const gx = (c * pw + pw / 2 - s.ax) / K, gy = (r * ph + ph / 2 - s.ay) / K;
      let dx = gx + (hx - 0.5) * 2, dy = gy - cy0;
      const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const sp = (big ? 9 : 14) * (0.7 + hx * 0.6);
      const ox = dx * sp * ease, oy = dy * sp * 0.45 * ease;
      const oz = ghost ? (6 + hy * 10) * ease : Math.max(gy + 1.5, (big ? 8 : 16) * (0.6 + hy * 0.7) * us - (big ? 34 : 44) * us * us);
      const rot = Math.round((hs - 0.5) * 8 * ease) * (Math.PI / 6);
      ctx.save();
      ctx.globalAlpha = fade * (ghost ? 0.85 : 1);
      ctx.translate(x + gx + ox, y + gy + oy - oz);
      if (rot) ctx.rotate(rot);
      if (ghost) { const sc = 1 - 0.55 * u; ctx.scale(sc, sc); }
      ctx.drawImage(s.c, c * pw, r * ph, pw, ph, -pw / 2 / K, -ph / 2 / K, pw / K, ph / K);
      if (fl) { ctx.globalAlpha = fade * (1 - u / 0.35); ctx.drawImage(fl.c, c * pw, r * ph, pw, ph, -pw / 2 / K, -ph / 2 / K, pw / K, ph / K); }
      ctx.restore();
    }
  }
  /** Appear: built up plate by plate from the baseplate while two bricks drop in; then it clicks into place
      (a small press-down bounce and a white pop on top). The ghost piece fades in and drops onto its peg instead. */
  function clickTogether(ctx, e, set, s, y) {
    const t = e.spawnT;
    if (e.type === 'ghost') {
      const u = U.smoothstep(0, 1, t);
      ctx.globalAlpha = u;
      blitScaled(ctx, s, e.x, y - (1 - u) * 10, 0.75 + u * 0.25, 0.75 + u * 0.25 + (1 - u) * 0.3);
      ctx.globalAlpha = 1;
      return;
    }
    const u = Math.min(1, t / 0.75);
    if (u < 1) {
      const layer = PH * K, total = s.c.height;
      const vis = Math.min(total, Math.ceil((U.ease.outQuad(u) * total) / layer) * layer);
      if (vis > 0) {
        const sy = total - vis;
        const x0 = Math.round(e.x * VSC - (s.ax * VSC) / K) / VSC, y0 = Math.round(y * VSC - (s.ay * VSC) / K) / VSC;
        ctx.drawImage(s.c, 0, sy, s.c.width, vis, x0, y0 + sy / K, s.c.width / K, vis / K);
      }
      const pal = DEB[setKey(e)] || DEB.toy;
      for (let i = 0; i < 2; i++) {
        const fr = DEBRIS[pal[(i + Math.floor(e.seed * 7)) % pal.length]][i];
        const z = (1 - ((u * 2 + i * 0.5) % 1)) * 26;
        ctx.globalAlpha = Math.min(1, (1 - u) * 3);
        blitScaled(ctx, fr, e.x + (i ? 5 : -5), e.y - 8 - z, 0.8, 0.8);
      }
      ctx.globalAlpha = 1;
      return;
    }
    const b = (t - 0.75) / 0.25;
    const sq = b < 0.35 ? 1 - 0.08 * Math.sin((b / 0.35) * Math.PI) : 1 + 0.04 * Math.sin(((b - 0.35) / 0.65) * Math.PI);
    blitScaled(ctx, s, e.x, y, 1 / Math.sqrt(sq), sq);
    if (b < 0.45) {
      const k = 1 - b / 0.45, ss = 6 + (1 - k) * 6;
      ctx.globalAlpha = k;
      ctx.drawImage(FX.star, e.x - ss / 2, y - s.ay / K - ss / 2 + 2, ss, ss);
      ctx.globalAlpha = 1;
    }
  }

  /* ================================ screen fx ================================ */
  let VIG = null;
  function vignette() {
    if (VIG) return VIG;
    VIG = U.sprite(320, 180, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h * 0.5, h * 0.36, w / 2, h * 0.5, w * 0.64);
      g.addColorStop(0, 'rgba(20,40,80,0)'); g.addColorStop(0.65, 'rgba(20,40,80,0.08)'); g.addColorStop(1, 'rgba(14,26,60,0.34)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const t = ctx.createRadialGradient(w * 0.18, -h * 0.1, 0, w * 0.18, -h * 0.1, w * 0.62);
      t.addColorStop(0, 'rgba(255,252,235,0.16)'); t.addColorStop(1, 'rgba(255,252,235,0)');
      ctx.fillStyle = t; ctx.fillRect(0, 0, w, h);
    });
    return VIG;
  }

  const NUM_FONT = "'Titan One', 'Fredoka', system-ui, sans-serif";

  /* ================================ CSS: brick-built HUD, instruction-booklet cards ================================ */
  const FH = "'Titan One', 'Fredoka', system-ui, sans-serif";
  const FB = "'Fredoka', system-ui, sans-serif";
  const B = 'body.style-bricks';
  /** A row of studs seen from the side, sitting on top of a brick panel. */
  const studRow = (top, side, dark) =>
    `radial-gradient(ellipse 2.6px 1.1px at 8.5px 2px, rgba(255,255,255,.9) 0 90%, transparent 100%) 0 0 / 22px 9px repeat-x,
     radial-gradient(ellipse 6px 2.6px at 11px 2.7px, ${top} 0 92%, transparent 100%) 0 0 / 22px 9px repeat-x,
     linear-gradient(90deg, transparent 0 5px, ${side} 5px 8px, ${top} 8px 10px, ${side} 10px 14px, ${dark} 14px 17px, transparent 17px) 0 2.7px / 22px 6.3px repeat-x`;
  const brick = (c, lt, dk, edge) => `background: linear-gradient(180deg, ${lt} 0 3px, ${c} 3px 45%, ${dk} 100%); border-radius: 5px;
    box-shadow: inset 0 2px 0 rgba(255,255,255,.55), inset 2px 0 0 rgba(255,255,255,.28), inset -2px 0 0 rgba(0,0,0,.14), inset 0 -3px 0 rgba(0,0,0,.2), 0 4px 0 ${edge}, 0 9px 16px rgba(20,30,60,.32);`;
  const studs = (top, side, dark) => `content: ''; position: absolute; left: 7px; right: 7px; top: -8px; height: 9px; pointer-events: none; background: ${studRow(top, side, dark)};`;
  const topStuds = (lt, c, dk) => `radial-gradient(circle at 42% 38%, rgba(255,255,255,.85) 0 1.4px, transparent 2.2px), radial-gradient(circle at 50% 50%, ${lt} 0 3.2px, ${c} 3.6px 4.4px, ${dk} 4.8px 5.4px, transparent 5.9px)`;
  const css = `
${B} { font-family: ${FB}; }
${B} #hud { padding: 18px 24px; }
${B} #hud .xp { height: 20px; border: none; border-radius: 5px; overflow: visible; background: linear-gradient(180deg, #7b8389 0 2px, #5f666c 2px 60%, #4c5257); box-shadow: inset 0 3px 4px rgba(0,0,0,.35), 0 3px 0 #33383c, 0 7px 12px rgba(20,30,60,.3); }
${B} #hud .xp-fill { border-radius: 4px; background: ${topStuds('#fff1a0', '#f7c81e', '#b88a0c')} 0 0 / 18px 20px, linear-gradient(180deg, #ffe680, #f7c81e 40%, #d9a612); box-shadow: inset 0 2px 0 rgba(255,255,255,.5), inset -2px 0 0 rgba(0,0,0,.18); }
${B} #hud .lvl { right: 10px; font: 400 14px/1 ${FH}; color: #fff; letter-spacing: 1px; text-shadow: 0 2px 0 #1b1d22, 1px 0 0 #1b1d22, -1px 0 0 #1b1d22, 0 -1px 0 #1b1d22; }
${B} #hud .topline { margin-top: 26px; align-items: flex-start; }
${B} #hud .hp { position: relative; gap: 10px; padding: 8px 14px 9px 9px; ${brick('#f2f2ec', '#ffffff', '#d6d6cf', '#a9aaa3')} }
${B} #hud .hp::before { ${studs('#ffffff', '#e6e6df', '#b9bab3')} }
${B} #hud .hp-icon, ${B} #hud .kills-icon { width: 38px; height: 38px; }
${B} #hud .hp-bar { width: 210px; height: 22px; border: none; border-radius: 4px; background: #2b2e33; box-shadow: inset 0 3px 4px rgba(0,0,0,.6), 0 1px 0 rgba(255,255,255,.7); }
${B} #hud .hp-fill { border-radius: 3px; background: ${topStuds('#ff8c7a', '#d4231c', '#8e1410')} 0 1px / 18px 20px, linear-gradient(180deg, #f2554a, #d4231c 45%, #a8180f); box-shadow: inset 0 2px 0 rgba(255,255,255,.45); }
${B} #hud .hp-text { font: 400 16px/1 ${FH}; color: #1b1d22; min-width: 76px; text-shadow: none; }
${B} #hud .clock { position: relative; padding: 8px 26px 9px; min-width: 170px; ${brick('#f7c81e', '#ffe680', '#d9a612', '#a37a08')} }
${B} #hud .clock::before { ${studs('#ffe680', '#f2bf12', '#b98c08')} }
${B} #hud .clock-time { font: 400 34px/1.05 ${FH}; color: #1b1d22; letter-spacing: 1px; text-shadow: 0 2px 0 rgba(255,255,255,.55); }
${B} #hud .clock-label { font: 700 11px/1 ${FB}; color: #5a4300; letter-spacing: 3px; opacity: 1; margin-top: 4px; }
${B} #hud .kills { position: relative; min-width: 0; gap: 10px; padding: 8px 18px 9px 10px; ${brick('#1c5fc6', '#5b92e6', '#154a9c', '#0d3474')} text-shadow: none; }
${B} #hud .kills::before { ${studs('#5b92e6', '#2a6cd2', '#123e85')} }
${B} #hud .kills-num { font: 400 26px/1 ${FH}; color: #fff; min-width: 62px; text-align: right; text-shadow: 0 2px 0 #0d3474; }
${B}.hurt #hud .hp { background: linear-gradient(180deg, #ffd9d4 0 3px, #ffb3a8 3px 45%, #f08a7c); }
${B}.hurt #hud .hp-bar { filter: brightness(1.25); }
${B} #stylebar { padding: 9px 20px; bottom: 16px; border: none; border-radius: 5px; background: linear-gradient(180deg, #4a4d54 0 2px, #2a2c31 2px 60%, #1f2125); box-shadow: inset 0 2px 0 rgba(255,255,255,.22), 0 4px 0 #0f1012, 0 9px 16px rgba(20,30,60,.3); }
${B} #stylebar .style-family { font: 700 10px ${FB}; color: #a7acb0; letter-spacing: 2px; opacity: 1; }
${B} #stylebar .style-name { font: 400 17px ${FH}; color: #f7c81e; letter-spacing: .5px; }
${B} #stylebar .style-hint { font: 600 12px ${FB}; color: #e6e6df; opacity: .85; }
${B} #stylebar .auto.on { color: #8cc63f; }
${B} #levelup { background: radial-gradient(ellipse at 50% 46%, rgba(232,245,253,.42), rgba(120,176,224,.52)); gap: 30px; }
${B} #levelup .lu-title { font: 400 66px/1 ${FH}; color: #f7c81e; letter-spacing: 2px; -webkit-text-stroke: 3px #1b1d22; paint-order: stroke fill;
  text-shadow: 0 5px 0 #1b1d22, 0 9px 0 #d4231c, 0 12px 0 #1b1d22, 0 22px 24px rgba(20,40,80,.35); }
${B} #levelup .lu-cards { gap: 28px; }
${B} #levelup .card { width: 226px; min-height: 290px; padding: 24px 16px 20px; gap: 10px; border: 3px solid #1b1d22; border-radius: 14px; color: #1b1d22;
  background: linear-gradient(180deg, #ffffff 0 62%, #e8f3fb 62%); box-shadow: 0 6px 0 #1b1d22, 0 14px 24px rgba(20,40,80,.3); transition: transform .12s; }
${B} #levelup .card:hover { transform: translateY(-8px) rotate(-1deg); }
${B} #levelup .card::after { content: '1x'; position: absolute; left: 74px; top: 124px; font: 600 14px/1 ${FB}; color: #1b1d22; }
${B} #levelup .card-icon { width: 120px; height: 120px; margin-left: 26px; border-radius: 10px; background: #fbfdff; border: 2px solid #1b1d22;
  box-shadow: inset 0 0 0 4px #dcebf7; }
${B} #levelup .card-name { font: 700 20px/1.15 ${FB}; color: #1b1d22; margin-top: 10px; }
${B} #levelup .card-desc { font: 500 15px/1.3 ${FB}; color: #3b4652; opacity: 1; }
${B} #levelup .card-key { top: 10px; left: 14px; opacity: 1; font: 400 40px/1 ${FH}; color: #1b1d22; }
${B} #levelup .lu-hint { font: 600 15px ${FB}; color: #1b3a5c; letter-spacing: .5px; opacity: .9; }
${B} #gameover { background: radial-gradient(ellipse at 50% 42%, rgba(226,242,252,.86), rgba(150,196,232,.94)); gap: 20px; }
${B} #gameover .go-title { font: 400 60px/1 ${FH}; color: #d4231c; -webkit-text-stroke: 3px #1b1d22; paint-order: stroke fill; text-shadow: 0 5px 0 #1b1d22, 0 14px 20px rgba(20,40,80,.3); }
${B} #gameover .go-stats { position: relative; font: 600 18px ${FB}; color: #1b1d22; padding: 12px 26px; opacity: 1; ${brick('#f2f2ec', '#ffffff', '#d6d6cf', '#a9aaa3')} }
${B} #gameover .go-stats::before { ${studs('#ffffff', '#e6e6df', '#b9bab3')} }
${B} #gameover .go-hint { font: 600 14px ${FB}; color: #1b3a5c; }
${B} #pausebox { font: 400 54px ${FH}; color: #f7c81e; -webkit-text-stroke: 3px #1b1d22; paint-order: stroke fill; text-shadow: 0 5px 0 #1b1d22; }
`;

  /* ================================ the style ================================ */
  const sideOf = (f) => (f < 0 ? 1 : 0);
  let fxOx = 0, fxOy = 0, fxS = 1;
  let LASTP = null, OCCL = -1; // main character sprite of this frame + frame time when a prop covered it
  function drawGlows(ctx, s, x, y, a) {
    if (!s.glow || !s.glow.length) return;
    ctx.globalCompositeOperation = 'lighter';
    for (const g of s.glow) {
      ctx.globalAlpha = a;
      const spr = g.col === 'red' ? FX.red : FX.warm;
      ctx.drawImage(spr, x + g.x - g.r, y + g.y - g.r, g.r * 2, g.r * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  Styles.register({
    id: 'bricks',
    name: 'Toy Bricks',
    family: '3D Look · Toy Bricks',
    description: 'A toy-box world of glossy plastic bricks: stud-covered baseplates, smooth tiled roads, transparent-blue water plates and a little explorer figure with claw hands.',
    groundColor: '#47a347',
    groundResMax: 2.5,
    chunkSize: 256,
    fonts: ['Titan+One', 'Fredoka:wght@400;500;600;700'],
    css,

    init() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const h = (window.__forceH || window.innerHeight || 900) * dpr;
      K = clamp(Math.round((h / 360) * 1.6 * 2) / 2, 2.5, 7);
      VSC = h / 360;
      buildAll();
    },

    renderGroundChunk(ctx, info) { return groundChunk(ctx, info); },
    propsForChunk(info) { return genProps(info); },

    drawGroundOverlay(ctx, view) {
      VSC = view.S;
      RT = view.rt;
      FR.breaks = 0;
      fxS = view.S; fxOx = view.W / 2 - view.x * view.S; fxOy = view.H / 2 - view.y * view.S;
      // glints on the transparent water plates
      const s = 256;
      const cx0 = Math.floor(view.x0 / s), cx1 = Math.floor(view.x1 / s), cy0 = Math.floor(view.y0 / s), cy1 = Math.floor(view.y1 / s);
      ctx.fillStyle = '#ffffff';
      for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
        const arr = WATER_SPARK.get(cx + ',' + cy);
        if (!arr || !arr.length) continue;
        for (let i = 0; i < arr.length; i += 3) {
          const x = arr[i], y = arr[i + 1];
          if (x < view.x0 - 4 || x > view.x1 + 4 || y < view.y0 - 4 || y > view.y1 + 4) continue;
          const v = Math.sin(view.rt * 1.6 + arr[i + 2]);
          if (v < 0.4) continue;
          ctx.globalAlpha = (v - 0.4) * 1.3;
          ctx.fillRect(x - 1.6, y - 0.25, 3.2, 0.5);
          ctx.fillRect(x - 0.25, y - 1.1, 0.5, 2.2);
        }
      }
      ctx.globalAlpha = 1;
    },

    drawProp(ctx, p, view) {
      const s = PROPS[p.v ? p.t + p.v : p.t];
      if (!s) return;
      const y = p.y - (p.lift || 0);
      let a = 1;
      if (s.occl) {
        const pl = view.game.player;
        if (pl.y < p.y - 3 && pl.y > p.y - s.top + 6 && Math.abs(pl.x - p.x) < s.hw + 4) { a = 0.32; OCCL = view.rt; }
      }
      ctx.globalAlpha = a;
      blit(ctx, s, p.x, y);
      ctx.globalAlpha = 1;
      if (s.glow.length) drawGlows(ctx, s, p.x, y, 0.55 + 0.08 * Math.sin(RT * 3 + p.x));
    },

    drawShadow(ctx, o) {
      if (o.kind === 'prop') {
        const s = PROPS[o.v ? o.t + o.v : o.t];
        if (!s || !s.sh) return;
        blit(ctx, s.sh, o.x, o.y - (o.lift || 0));
        return;
      }
      let w = 15, h = 6, a = 0.75, dx = 1.6;
      if (o.kind === 'enemy') {
        a = o.type === 'ghost' ? 0.38 : 1;
        if (o.dying) a *= Math.max(0, 1 - o.deathT);
        if (o.spawnT < 1) a *= o.spawnT;
        if (a <= 0.01) return;
        if (o.type !== 'ghost') {
          const set = setOf(o);
          if (!set) return;
          ctx.globalAlpha = a;
          blit(ctx, set.shadow, o.x, o.y);
          ctx.globalAlpha = 1;
          return;
        }
        w = 14; h = 5;
      }
      if (a <= 0.01) return;
      ctx.globalAlpha = a;
      ctx.drawImage(FX.shadow, o.x - w / 2 + dx, o.y - h / 2 + 0.6, w, h);
      ctx.globalAlpha = 1;
    },

    drawGem(ctx, g, view) {
      const fr = g.big ? SET.coinBig : SET.coin;
      const t = view.rt * 1.4 + g.seed * 7;
      const fi = Math.floor(t * fr.length) % fr.length;
      const hop = g.pop > 0 ? Math.sin(g.pop * Math.PI) * 10 : 0;
      const z = (g.big ? 6 : 4.4) + Math.sin(view.rt * 3 + g.seed * 10) * 0.9 + hop;
      ctx.globalAlpha = 0.5;
      const sw = g.big ? 9 : 6.5;
      ctx.drawImage(FX.shadow, g.x - sw / 2 + 0.8, g.y - sw * 0.2, sw, sw * 0.4);
      ctx.globalAlpha = 1;
      if (g.big) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.35;
        ctx.drawImage(FX.gold, g.x - 11, g.y - z - 11, 22, 22);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
      blit(ctx, fr[fi], g.x, g.y - z);
      const tw = Math.sin(view.rt * 4 + g.seed * 30);
      if (tw > 0.7) {
        ctx.globalAlpha = (tw - 0.7) * 3;
        const ss = g.big ? 6 : 4.5;
        ctx.drawImage(FX.star, g.x - (g.big ? 3 : 2) - ss / 2, g.y - z - (g.big ? 3 : 2) - ss / 2, ss, ss);
        ctx.globalAlpha = 1;
      }
    },

    drawEnemy(ctx, e) {
      const set = setOf(e);
      if (!set) return;
      const side = sideOf(e.facing), NW = 6;
      let fi, lift = 0;
      if (e.type === 'ghost') {
        fi = Math.floor(RT * 7 + e.seed * 6) % NW;
        // eased hover: holds at the top and bottom, own phase per actor
        const w = U.fract(RT * 0.42 + e.seed * 3.7), tri = w < 0.5 ? w * 2 : 2 - w * 2;
        lift = 2.6 + U.smoothstep(0, 1, tri) * 3.2;
      } else fi = Math.floor(e.anim * (e.type === 'creeper' ? 2.7 : 1.8)) % NW;
      if (fi < 0) fi += NW;
      const y = e.y - lift;
      if (e.dying) {
        const t = e.deathT, s = set.frames[side][NW];
        if (t < 0.14) {
          const u = t / 0.14;
          blitScaled(ctx, s, e.x, y, 1.08, 1.05);
          ctx.globalAlpha = u * 0.85;
          blitScaled(ctx, tintOf(set, side, NW, '#ffffff'), e.x, y, 1.08, 1.05);
          ctx.globalAlpha = 1;
        } else if (FR.breaks++ < 8) popApart(ctx, set, side, e.x, y, (t - 0.14) / 0.86, e.type, e.seed);
        else { const u = (t - 0.14) / 0.86; ctx.globalAlpha = 1 - u; blitScaled(ctx, s, e.x, y + u * 4, 1, 1 - 0.6 * u); ctx.globalAlpha = 1; }
        return;
      }
      const s0 = set.frames[side][fi];
      if (e.spawnT < 1) { clickTogether(ctx, e, set, s0, y); return; }
      const hk = e.flash;
      if (hk > 0.25) fi = NW;
      const s = set.frames[side][fi];
      if (hk > 0.25) {
        // hit: hit pose, knocked one stud-step in the push direction, white plastic flash
        const dir = Math.abs(e.kx) > 2 ? Math.sign(e.kx) : -e.facing;
        const kx = hk > 0.55 ? dir * 2 : 0;
        blitScaled(ctx, s, e.x + kx, y, 1.06, 0.95);
        ctx.globalAlpha = Math.min(0.75, hk * 0.9);
        blitScaled(ctx, tintOf(set, side, fi, '#ffffff'), e.x + kx, y, 1.06, 0.95);
        ctx.globalAlpha = 1;
      } else blit(ctx, s, e.x, y);
      if (e.type === 'colossus') drawGlows(ctx, s, e.x, y, 0.4 + 0.12 * Math.sin(RT * 5 + e.seed * 9));
      if (e.type === 'ghost') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.16;
        ctx.drawImage(FX.blue, e.x - 12, y - 22, 24, 24);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
    },

    drawPlayer(ctx, p, view) {
      const set = SET.fig;
      const side = sideOf(p.dashT > 0 ? (p.dashX < 0 ? -1 : 1) : p.facing);
      let fi;
      if (p.hurtT > 0.62) fi = F_HURT;
      else if (p.dashT > 0) fi = 0.2 - p.dashT < 0.05 ? F_CROUCH : F_LUNGE;
      // walk on twos: 8 poses stepped at ~12 fps (toy / stop-motion feel)
      else if (p.moving) fi = Math.floor(p.anim * 1.3) % 8;
      else fi = (view.rt + 1.3) % 3.8 < 0.16 ? F_BLINK : F_IDLE + (Math.floor(view.rt / 0.75) % 4);
      const s = set.frames[side][fi];
      if (p.levelT > 0) {
        const t = 1 - p.levelT, r = 10 + t * 34;
        ctx.globalAlpha = p.levelT * 0.85;
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.4 * p.levelT + 0.4;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r * 0.8, 0, 0, TAU); ctx.stroke();
        const st = studSprite(P.yellow, K);
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * TAU + Math.round(t * 8) / 4;
          blitScaled(ctx, st, p.x + Math.cos(a) * r, p.y + Math.sin(a) * r * 0.8, 0.9, 0.9);
        }
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = p.levelT * 0.5;
        ctx.drawImage(FX.warm, p.x - 26, p.y - 42, 52, 52);
        ctx.globalCompositeOperation = 'source-over';
      }
      if (p.dashT > 0 && fi === F_LUNGE) {
        const tt = tintOf(set, side, fi, '#ffffff');
        for (let i = 2; i >= 1; i--) {
          ctx.globalAlpha = 0.2 * (3 - i) * Math.min(1, p.dashT * 6);
          blit(ctx, tt, p.x - Math.round(p.dashX * i * 3.5) * 2, p.y - Math.round(p.dashY * i * 3.5) * 2);
        }
      }
      let a = 1;
      if (p.iframes > 0 && p.hurtT <= 0 && p.dashT <= 0) a = Math.floor(view.rt * 18) % 2 ? 0.5 : 1;
      ctx.globalAlpha = a;
      blit(ctx, s, p.x, p.y);
      LASTP = { s, x: p.x, y: p.y, rt: view.rt };
      if (p.hurtT > 0 && fi === F_HURT) {
        ctx.globalAlpha = Math.min(0.6, p.hurtT * 0.8);
        blit(ctx, tintOf(set, side, fi, '#ff3b2b'), p.x, p.y);
      }
      ctx.globalAlpha = 1;
    },

    drawOrbital(ctx, o, view) {
      const hover = 10 + Math.sin(view.rt * 4 + o.idx * 1.7) * 1.4;
      const gy = o.y + 6;
      ctx.globalAlpha = 0.45;
      ctx.drawImage(FX.shadow, o.x - 4, gy - 1.8, 9, 3.6);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.5 + 0.12 * Math.sin(view.rt * 9 + o.idx);
      ctx.drawImage(FX.warm, o.x - 15, gy - hover - 21, 30, 30);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      blit(ctx, SET.beacon, o.x, gy - hover);
    },

    drawProjectile(ctx, pr) {
      const ca = Math.cos(pr.angle), sa = Math.sin(pr.angle);
      ctx.globalAlpha = 0.35;
      ctx.drawImage(FX.shadow, pr.x - 2.5, pr.y + 5, 5, 2);
      ctx.strokeStyle = 'rgba(255,248,214,0.7)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(pr.x - ca * 2, pr.y - sa * 2); ctx.lineTo(pr.x - ca * 12, pr.y - sa * 12); ctx.stroke();
      ctx.globalAlpha = 1;
      for (let i = 2; i >= 1; i--) {
        ctx.globalAlpha = 0.5 - i * 0.15;
        blitScaled(ctx, SET.bolt, pr.x - ca * i * 4.5, pr.y + 2 - sa * i * 4.5, 0.75 - i * 0.12, 0.75 - i * 0.12);
      }
      ctx.globalAlpha = 1;
      blitScaled(ctx, SET.bolt, pr.x, pr.y + 2, 0.85, 0.85);
    },

    drawParticle(ctx, pt, view) {
      if (view) { fxS = view.S; fxOx = view.W / 2 - view.x * view.S; fxOy = view.H / 2 - view.y * view.S; }
      const k = pt.life / pt.max;
      const x = pt.x, y = pt.y - pt.z;
      switch (pt.kind) {
        case 'brick': {
          const set = DEBRIS[pt.ci];
          if (!set) break;
          const s = set[pt.sh] || set[0];
          const sc = pt.size / 3.2;
          const a = k < 0.25 ? k / 0.25 : 1;
          if (pt.z < 3) { ctx.globalAlpha = a * 0.4; ctx.drawImage(FX.shadow, pt.x - 3 * sc, pt.y - 1, 6 * sc, 2.4 * sc); }
          ctx.globalAlpha = a;
          const w = (s.c.width / K) * sc, h = (s.c.height / K) * sc;
          const cs = Math.cos(pt.rot) * fxS, sn = Math.sin(pt.rot) * fxS;
          ctx.setTransform(cs, sn, -sn, cs, fxOx + x * fxS, fxOy + y * fxS);
          ctx.drawImage(s.c, -w / 2, -h / 2, w, h);
          ctx.setTransform(fxS, 0, 0, fxS, fxOx, fxOy);
          break;
        }
        case 'pop': {
          // white plastic pop: a star that snaps open + a thin ring, gone in ~0.15 s
          const t = 1 - k, sz = pt.size * (0.45 + 0.55 * (1 - (1 - t) * (1 - t)));
          ctx.globalAlpha = Math.min(1, k * 1.8);
          ctx.drawImage(pt.blue ? FX.starB : FX.star, x - sz / 2, y - sz / 2, sz, sz);
          ctx.globalAlpha = k * 0.8;
          ctx.strokeStyle = pt.blue ? '#d8f1ff' : '#ffffff'; ctx.lineWidth = 0.9 * k + 0.3;
          ctx.beginPath(); ctx.ellipse(x, y, sz * 0.42, sz * 0.36, 0, 0, TAU); ctx.stroke();
          break;
        }
        case 'star': {
          const s = pt.size * (0.4 + Math.sin(k * Math.PI) * 0.8);
          ctx.globalAlpha = Math.min(1, k * 2.5);
          ctx.drawImage(pt.blue ? FX.starB : FX.star, x - s / 2, y - s / 2, s, s);
          break;
        }
        case 'ring': {
          const t = 1 - k;
          const r = pt.r0 + (pt.r1 - pt.r0) * U.ease.outQuad(t);
          ctx.globalAlpha = k * 0.8;
          ctx.strokeStyle = pt.color; ctx.lineWidth = 1.6 * k + 0.4;
          ctx.beginPath(); ctx.ellipse(pt.x, pt.y, r, r * 0.8, 0, 0, TAU); ctx.stroke();
          const st = studSprite(P.yellow, K);
          for (let i = 0; i < pt.studs; i++) {
            const a = (i / pt.studs) * TAU + t;
            blitScaled(ctx, st, pt.x + Math.cos(a) * r, pt.y + Math.sin(a) * r * 0.8, 0.8, 0.8);
          }
          break;
        }
        default: {
          ctx.globalAlpha = k;
          ctx.fillStyle = pt.color || '#fff';
          const s = pt.size;
          ctx.fillRect(x - s / 2, y - s / 2, s, s);
        }
      }
      ctx.globalAlpha = 1;
    },

    drawNumber(ctx, n) {
      const k = n.life / n.max, age = 1 - k;
      const pop = age < 0.14 ? 0.6 + (age / 0.14) * 0.55 : 1.15 - Math.min(0.15, (age - 0.14) * 0.6);
      const sz = Math.round((n.crit ? 10 : 7.5) * pop * 2) / 2;
      ctx.globalAlpha = clamp(k * 3, 0, 1);
      ctx.font = sz + 'px ' + NUM_FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      const txt = '' + n.value;
      ctx.lineWidth = n.crit ? 2.2 : 1.7;
      ctx.strokeStyle = '#1b1d22';
      ctx.strokeText(txt, n.x, n.y + 0.6);
      ctx.strokeText(txt, n.x, n.y);
      ctx.fillStyle = n.crit ? '#f7c81e' : '#ffffff';
      ctx.fillText(txt, n.x, n.y);
      ctx.globalAlpha = 1;
    },

    drawWorldOverlay(ctx, view) {
      // x-ray: a figure hidden behind a tall prop shows through faintly
      if (LASTP && LASTP.rt === view.rt && OCCL === view.rt) {
        ctx.globalAlpha = 0.72;
        blit(ctx, LASTP.s, LASTP.x, LASTP.y);
        ctx.globalAlpha = 1;
      }
    },

    drawScreenOverlay(ctx, view) {
      ctx.drawImage(vignette(), 0, 0, view.W, view.H);
    },

    drawIcon(ctx, id, size) {
      const mk = ICON_MODELS[id];
      if (!mk) return;
      const m = mk();
      const probe = renderBk(m, 6);
      const fit = Math.min((size * 0.84) / (probe.c.width - 6), (size * 0.84) / (probe.c.height - 6));
      const s = renderBk(m, 6 * fit);
      const dx = Math.round((size - s.c.width) / 2), dy = Math.round((size - s.c.height) / 2);
      ctx.globalAlpha = 0.28;
      ctx.drawImage(U.tint(s.c, '#10203a'), dx + Math.max(1, size * 0.04), dy + Math.max(1, size * 0.05));
      ctx.globalAlpha = 1;
      ctx.drawImage(s.c, dx, dy);
      if (id === 'lantern') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.5;
        const r = size * 0.32;
        ctx.drawImage(FX.warm || glowSprite(255, 210, 110), size / 2 - r, size * 0.48 - r, r * 2, r * 2);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
    },

    /* ---------------- hooks ---------------- */
    onHit(game, e, src) {
      const pal = DEB[setKey(e)] || DEB.toy;
      const z = e.type === 'colossus' ? 24 : e.type === 'ghost' ? 14 : 10;
      pop(game, e.x, e.y, z, 9, 0.12, e.type === 'ghost');
      bricks(game, e.x, e.y, z, pal, e.type === 'colossus' ? 3 : 2, { speed: 55, life: 0.55, size: 1.9, vz: 70, shape: Math.random() < 0.5 ? 3 : 4 });
      sparks(game, e.x, e.y, z, 2, { speed: 60, life: 0.3, size: 4.5, blue: src === 'lantern' ? false : e.type === 'ghost' });
    },
    onKill(game, e) {
      const pal = DEB[setKey(e)] || DEB.toy;
      if (e.type === 'colossus') {
        pop(game, e.x, e.y, 26, 30, 0.2, false);
        bricks(game, e.x, e.y, 10, pal, 24, { speed: 100, life: 1.5, size: 3.4, vz: 150, zr: 36, spread: 26 });
        ring(game, e.x, e.y, 10, 52, 0.6, '#ffffff', 14);
        sparks(game, e.x, e.y, 26, 8, { speed: 110, life: 0.6, size: 6 });
        bricks(game, e.x, e.y, 2, pal, 5, { speed: 40, life: 2.2, size: 1.8, vz: 30, shape: 3 }); // loose studs left on the baseplate
        game.shake = Math.max(game.shake || 0, 4);
      } else if (e.type === 'ghost') {
        pop(game, e.x, e.y, 12, 16, 0.16, true);
        bricks(game, e.x, e.y, 10, pal, 9, { speed: 45, life: 0.9, size: 2.2, vz: 50, grav: -40, drag: 2.4 });
        sparks(game, e.x, e.y, 12, 4, { speed: 50, life: 0.5, size: 4.5, blue: true });
      } else {
        pop(game, e.x, e.y, 10, 16, 0.16, false);
        bricks(game, e.x, e.y, 6, pal, 10, { speed: 75, life: 1.15, size: 2.4, vz: 115, zr: 12 });
        ring(game, e.x, e.y, 5, 22, 0.35, '#ffffff', 6);
        bricks(game, e.x, e.y, 2, pal, 3, { speed: 30, life: 1.8, size: 1.6, vz: 25, shape: 3 }); // loose studs left behind
        sparks(game, e.x, e.y, 10, 2, { speed: 60, life: 0.35, size: 4.5 });
      }
    },
    onHurt(game, p) {
      pop(game, p.x, p.y, 16, 12, 0.14, false);
      bricks(game, p.x, p.y, 14, DEB.fig, 5, { speed: 70, life: 0.75, size: 2, vz: 85, shape: 3 });
      sparks(game, p.x, p.y, 16, 3, { speed: 80, life: 0.35, size: 5 });
    },
    onPickup(game, g) {
      pop(game, g.x, g.y, 6, g.big ? 10 : 7, 0.12, !g.big);
      sparks(game, g.x, g.y, 6, g.big ? 5 : 2, { speed: 40, vz: 30, life: 0.4, size: g.big ? 5.5 : 4, blue: !g.big });
      if (g.big) bricks(game, g.x, g.y, 6, DEB.gold, 3, { speed: 35, life: 0.6, size: 1.6, vz: 70, shape: 3 });
    },
    onShoot(game, pr) {
      if (Math.random() < 0.25) sparks(game, pr.x, pr.y + 3, 3, 1, { speed: 20, life: 0.25, size: 3 });
    },
    onDash(game, p) {
      bricks(game, p.x - p.dashX * 4, p.y, 1, DEB.dust, 6, { speed: 36, life: 0.5, size: 1.6, vz: 40, shape: 3 });
      ring(game, p.x, p.y, 3, 14, 0.28, '#ffffff', 4);
    },
    onLevelUp(game, p) {
      pop(game, p.x, p.y, 18, 26, 0.22, false);
      ring(game, p.x, p.y, 8, 56, 0.75, '#ffffff', 16);
      bricks(game, p.x, p.y, 6, DEB.toy, 16, { speed: 42, life: 1.25, size: 2.3, vz: 120, grav: 200 });
      sparks(game, p.x, p.y, 18, 6, { speed: 60, life: 0.6, size: 5.5 });
    },
    onDeath(game, p) {
      pop(game, p.x, p.y, 16, 26, 0.22, false);
      bricks(game, p.x, p.y, 12, DEB.fig, 28, { speed: 90, life: 1.6, size: 2.8, vz: 125, zr: 20 });
    },
  });
})();
