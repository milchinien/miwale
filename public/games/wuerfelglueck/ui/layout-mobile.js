// Würfelglück – Layout "Mobile": Handy im Querformat (wird nur auf Touch-Geräten benutzt, siehe index.html).
// Große Knöpfe und Schrift. Nutzt die ganze Breite des Bildschirms: links die Werte, in der Mitte Relikte,
// Würfel und Beutel, rechts Verbrauchsgüter und Handarten (im Shop: Weiter, Neu würfeln, Tresor).
// Die Positionen hängen vom sichtbaren Bereich ab und werden bei jeder Größenänderung neu berechnet (relayout).
(window.WG_LAYOUTS = window.WG_LAYOUTS || []).push((K) => {
  const { S, R, UI, P, eng, J, B } = K;
  const { darken, lighten } = K;

  const SIDE_W = 300, RIGHT_W = 270, M = 10;
  const G = { VL: 0, VR: 1280, lx: M, rx: 1000, c0: 322, c1: 988, cw: 666, cx: 655 };
  const DIE_Y = 340, BAG_Y = 646, SHOP_Y = 300, RELIC_Y = 78, CONS_Y = 156;

  // Schriftgröße verkleinern, bis der Text in die Breite passt
  function fit(ctx, text, maxW, size, min = 15) {
    ctx.font = UI.font(size);
    while (size > min && ctx.measureText(text).width > maxW) ctx.font = UI.font(--size);
    return size;
  }
  function stat(ctx, x, y, w, h, label, value, colour, j, t) {
    UI.box(ctx, x, y, w, h, { colour: P.PANEL, radius: 10, emboss: 3 });
    UI.text(ctx, label, x + w / 2, y + 17, { size: 21, colour: P.TEXT_LABEL });
    UI.box(ctx, x + 8, y + 34, w - 16, h - 42, { colour: P.PANEL_DARK, radius: 8, shadow: false });
    K.juiced(ctx, j, x + w / 2, y + 34 + (h - 42) / 2, t, () => UI.text(ctx, String(value), x + w / 2, y + 34 + (h - 42) / 2, { size: 38, colour }));
  }
  // Tag-Plaketten vergrößert (Trefferflächen für die Tooltips werden mit umgerechnet)
  function bigTags(ctx, cx, cy, k) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
    const rects = K.tagSummary(ctx, 0, 0);
    ctx.restore();
    K.setTagRects(rects.map((r) => ({ x: cx + r.x * k, y: cy + r.y * k, w: r.w * k, h: r.h * k, tag: r.tag })));
  }

  // ── Linke Spalte: Runde, Ziel, Score, Pips x Power, Hände, Geld, Stage, Upgrades ──
  function drawSidebar(ctx, t) {
    const x = G.lx, cx = x + SIDE_W / 2, lab = K.blindLabel();
    UI.box(ctx, x, 8, SIDE_W, 704, { colour: P.SIDEBAR, radius: 16, shadow: true });
    UI.box(ctx, x + 10, 18, 280, 106, { colour: lab.colour, radius: 12, emboss: 4 });
    const name = (S.phase === 'shop' ? 'Next: ' : '') + lab.name;
    UI.dynaText(ctx, name, cx, 42, { size: fit(ctx, name, 260, 30, 20), time: t, wave: 1.5 });
    if (K.jonnyBoss && K.jonnyBoss()) K.drawJonnyHead(ctx, x + 14, 20, 44);
    UI.box(ctx, x + 20, 64, 260, 50, { colour: darken(lab.colour, 0.5), radius: 9, shadow: false });
    UI.text(ctx, 'Target', x + 66, 89, { size: 22, colour: P.TEXT_LABEL });
    UI.text(ctx, UI.num(S.target), x + 194, 89, { size: fit(ctx, UI.num(S.target), 160, 36, 22), colour: P.RED });
    // Score
    UI.box(ctx, x + 10, 134, 280, 62, { colour: P.PANEL, radius: 10, emboss: 3 });
    UI.text(ctx, 'Score', x + 52, 165, { size: 22, colour: P.TEXT_LABEL });
    UI.box(ctx, x + 96, 141, 186, 48, { colour: P.PANEL_DARK, radius: 8, shadow: false });
    K.juiced(ctx, J.score, x + 189, 165, t, () => UI.text(ctx, UI.num(S.dispScore), x + 189, 165, { size: fit(ctx, UI.num(S.dispScore), 176, 36, 20) }));
    // Pips x Power (während der Abschluss-Animation fliegt Power in Pips)
    UI.box(ctx, x + 10, 206, 280, 88, { colour: P.PANEL, radius: 10, emboss: 3 });
    const fz = K.fuse();
    K.juiced(ctx, J.chips, x + 76, 250, t, () => {
      UI.box(ctx, x + 20, 216, 112, 66, { colour: fz && fz.merged ? P.ORANGE : P.CHIPS, radius: 9, emboss: 4 });
      const txt = fz && fz.chipsText !== null ? fz.chipsText : UI.num(S.chips);
      UI.text(ctx, txt, x + 76, 247, { size: fit(ctx, txt, 104, fz && fz.merged ? 32 : 38, 18) });
    });
    if (!fz) UI.text(ctx, 'X', x + 150, 248, { size: 30, colour: P.RED });
    if (!fz || !fz.hideMult) K.juiced(ctx, J.mult, x + 224, 250, t, () => {
      UI.box(ctx, x + 168, 216, 112, 66, { colour: P.MULT, radius: 9, emboss: 4 });
      UI.text(ctx, K.fmtMult(S.mult), x + 224, 247, { size: fit(ctx, K.fmtMult(S.mult), 104, 38, 18) });
    });
    // Hände / Neu würfeln
    stat(ctx, x + 10, 304, 135, 86, 'Hands', S.hands, P.BLUE, J.hands, t);
    stat(ctx, x + 155, 304, 135, 86, 'Rerolls', S.rerolls, P.RED, J.rerolls, t);
    // Geld (und Tresor)
    UI.box(ctx, x + 10, 400, 280, 64, { colour: P.PANEL, radius: 10, emboss: 3 });
    UI.box(ctx, x + 20, 407, 260, 50, { colour: P.PANEL_DARK, radius: 8, shadow: false });
    const vault = K.upg('vault'), mx = vault ? x + 110 : cx;
    K.juiced(ctx, J.money, mx, 432, t, () => UI.dynaText(ctx, K.money(), mx, 432, { size: 42, colour: S.money < 0 ? P.RED : P.MONEY, time: t, wave: 1 }));
    if (vault) { UI.text(ctx, 'Vault', x + 228, 421, { size: 17, colour: P.TEXT_DIM }); UI.text(ctx, '$' + S.vault, x + 228, 443, { size: 26, colour: P.GOLD }); }
    // Stage und Runde
    UI.box(ctx, x + 10, 474, 280, 56, { colour: P.PANEL, radius: 10, emboss: 3 });
    UI.text(ctx, 'Stage ' + Math.min(S.ante, K.ANTES) + '/' + K.ANTES, x + 80, 502, { size: 24, colour: P.ORANGE });
    UI.text(ctx, 'Round ' + (S.blindIdx + 1) + '/' + K.BLINDS.length, x + 214, 502, { size: 24, colour: P.ORANGE });
    // Upgrades
    UI.box(ctx, x + 10, 540, 280, 162, { colour: P.PANEL, radius: 10, emboss: 3 });
    UI.text(ctx, 'Upgrades', cx, 558, { size: 21, colour: P.TEXT_LABEL });
    if (!S.upgrades.length) {
      UI.text(ctx, 'The shop offers one', cx, 612, { size: 19, colour: P.TEXT_DIM });
      UI.text(ctx, 'new upgrade per stage', cx, 638, { size: 19, colour: P.TEXT_DIM });
    }
  }

  // ── Mitte oben: Relikte ──
  function drawTop(ctx) {
    K.area(ctx, G.c0, 8, G.cw, 160);
    if (!S.relics.length) UI.text(ctx, 'No relics yet - buy them in the shop', G.cx, RELIC_Y, { size: fit(ctx, 'No relics yet - buy them in the shop', G.cw - 30, 24), colour: P.TEXT_DIM });
    UI.text(ctx, 'Relics ' + S.relics.length + '/' + K.relicMax(), G.c0 + 14, 154, { size: 19, colour: P.TEXT_SOFT, align: 'left' });
    bigTags(ctx, G.cx + 60, 153, 1.3);
  }

  // ── Rechte Spalte: Einstellungen, Verbrauchsgüter ──
  function drawRight(ctx) {
    const x = G.rx;
    K.area(ctx, x, 84, RIGHT_W, 164);
    if (!S.cons.length) {
      UI.text(ctx, 'Constellations,', x + RIGHT_W / 2, 140, { size: 20, colour: P.TEXT_DIM });
      UI.text(ctx, 'Oracles & Tallies', x + RIGHT_W / 2, 166, { size: 20, colour: P.TEXT_DIM });
    }
    UI.text(ctx, 'Consumables ' + S.cons.length + '/' + R.MAX_CONS, x + RIGHT_W / 2, 234, { size: 18, colour: P.TEXT_SOFT });
  }

  // ── Mitte unten: Beutel ──
  function drawBag(ctx) {
    if (K.tutorial && K.tutorial()) return;   // Platz für Jonny
    K.area(ctx, G.c0, 574, G.cw, 138);
    const txt = 'Bag ' + S.bag.length + '/' + K.bagMax() + '  ·  ' + K.drawCount() + ' dice per hand';
    const job = K.jobLine && K.jobLine();
    UI.text(ctx, txt, G.c0 + 14, 594, { size: fit(ctx, txt, job ? G.cw * 0.36 : G.cw - 28, 20), colour: P.TEXT_SOFT, align: 'left' });
    if (job) UI.text(ctx, job.text, G.c1 - 14, 594, { size: fit(ctx, job.text, G.cw * 0.6, 19, 12), colour: job.colour, align: 'right' });
  }

  function drawPlay(ctx) {
    const pv = S.phase === 'select' ? K.preview() : null, W = G.cw - 24;
    let line = null, col = P.TEXT_SOFT, size = 30;
    if (S.handName) { line = S.handName; col = P.GOLD; size = 36; }
    else if (pv && K.isBust(pv)) { line = 'BUST!  ' + pv.skulls + ' Skulls'; col = P.RED; }
    else if (pv) line = pv.name + '   ' + R.handValues(pv.name, S.levels).join(' x ') + (pv.skulls ? '   ' + pv.skulls + ' Skull' + (pv.skulls > 1 ? 's' : '') : '');
    if (line) UI.text(ctx, line, G.cx, 210, { size: fit(ctx, line, W, size, 20), colour: col });
    if (K.isBossBlind() && S.boss) {
      const b = S.boss.name + ': ' + S.boss.desc;
      UI.text(ctx, b, G.cx, 244, { size: fit(ctx, b, W, 21, 14), colour: lighten(S.boss.colour, 0.45) });
    }
    // Statuszeile: Luck, Augenzahl-Stufen, Anker
    const L = K.luck(), parts = [];
    if (L > 0) parts.push(['Luck ' + L + '%', P.GREEN]);
    const nl = [1, 2, 3, 4, 5, 6].filter((v) => (S.numLevels[v] || 1) > 1);
    if (nl.length) parts.push([nl.map((v) => v + 's Lv ' + S.numLevels[v]).join('  '), lighten(K.TYPE_COL.tally, 0.4)]);
    if (K.anchorCap()) parts.push(['Anchors ' + K.anchorCap(), P.ANCHOR]);
    if (parts.length) {
      const txt = parts.map((q) => q[0]).join('   ·   ');
      const sz = fit(ctx, txt, W, 21, 14);
      ctx.font = UI.font(sz);
      let xx = G.cx - ctx.measureText(txt).width / 2;
      parts.forEach((q, i) => {
        const s = (i ? '   ·   ' : '') + q[0];
        UI.text(ctx, s, xx, 548, { size: sz, colour: q[1], align: 'left' });
        ctx.font = UI.font(sz); xx += ctx.measureText(s).width;
      });
    } else if (!['lost', 'runWon'].includes(S.phase) && !(K.tutorial && K.tutorial())) {
      UI.text(ctx, 'Tap dice to hold them  ·  touch and hold anything for details', G.cx, 548, { size: fit(ctx, 'Tap dice to hold them  ·  touch and hold anything for details', W, 19, 14), colour: P.TEXT_HINT });
    }
    drawHands(ctx);
  }

  // Handarten-Tabelle (rechte Spalte); Antippen einer Zeile erklärt die Handart
  function drawHands(ctx) {
    const x = G.rx, pv = S.phase === 'select' ? K.preview() : null;
    K.area(ctx, x, 258, RIGHT_W, 454);
    UI.text(ctx, 'Hands  (Pips x Power)', x + RIGHT_W / 2, 276, { size: 19, colour: P.TEXT_SOFT });
    const hl = S.handName || (pv && pv.name), rects = [];
    R.HAND_ORDER.forEach((n, i) => {
      const y = 316 + i * 39, on = n === hl, lv = S.levels[n] || 1;
      if (on) UI.box(ctx, x + 5, y - 18, RIGHT_W - 10, 36, { colour: P.HIGHLIGHT, radius: 6, shadow: false });
      const val = R.handValues(n, S.levels).join(' x ');
      ctx.font = UI.font(20);
      const vw = ctx.measureText(val).width;
      const lvTxt = lv > 1 ? 'Lv' + lv : '';
      UI.text(ctx, n, x + 12, y, { size: fit(ctx, n, RIGHT_W - 34 - vw - (lvTxt ? 38 : 0), 20, 14), colour: on ? P.GOLD : P.TEXT_SOFT, align: 'left' });
      if (lvTxt) UI.text(ctx, lvTxt, x + RIGHT_W - 18 - vw - 8, y + 1, { size: 15, colour: P.PLANET, align: 'right' });
      UI.text(ctx, val, x + RIGHT_W - 12, y, { size: 20, colour: on ? P.GOLD : lv > 1 ? lighten(P.PLANET, 0.3) : P.TEXT_SOFT, align: 'right' });
      rects.push({ x: x + 4, y: y - 19, w: RIGHT_W - 8, h: 38, term: 'hand:' + n });
    });
    K.setTagRects(rects);
  }

  // Shop-Plätze 0-2: Angebote, 4: Upgrade, 3: Würfel (immer ganz rechts)
  const SHOP_ORDER = [0, 1, 2, 4, 3];
  const shopGap = () => Math.min(150, (G.cw - 40) / 5);
  const shopX = (k) => G.cx + (SHOP_ORDER.indexOf(k) - 2) * shopGap();

  function drawShop(ctx, front, t) {
    K.area(ctx, G.c0, 178, G.cw, 386);
    UI.dynaText(front, 'SHOP', G.c0 + 70, 206, { size: 34, time: t, wave: 2, colour: P.GOLD });
    (S.shop || []).forEach((it, k) => {
      if (!it) return;
      const x = shopX(k);
      UI.box(ctx, x - 40, 210, 80, 36, { colour: it.special ? K.JONNY_GOLD : P.MONEY, radius: 8, emboss: 3, outline: it.special ? '#FFFFFF' : undefined, outlineWidth: 2 });
      UI.text(ctx, '$' + it.price, x, 228, { size: 26, colour: P.BLACK, shadow: false });
      const label = it.special ? "Jonny's Special" : K.TYPE_NAME[it.type];
      UI.text(ctx, label, x, 384, { size: fit(ctx, label, shopGap() - 8, 18, 13), colour: it.special ? K.JONNY_GOLD : lighten(K.TYPE_COL[it.type], 0.35) });
    });
    if (S.shop && !S.shop[4]) {
      const x = shopX(4), note = K.upgradeNote().split(' ');
      const half = Math.ceil(note.length / 2);
      UI.text(ctx, note.slice(0, half).join(' '), x, SHOP_Y - 12, { size: 17, colour: P.TEXT_FAINT });
      UI.text(ctx, note.slice(half).join(' '), x, SHOP_Y + 12, { size: 17, colour: P.TEXT_FAINT });
    }
    const lab = K.blindLabel(), W = G.cw - 24;
    if (K.drawJob && !(K.tutorial && K.tutorial())) K.drawJob(ctx, { x: G.c0 + 12, y: 486, w: W, h: 40 });
    else { const up = 'Up next: ' + lab.name + '  ·  Target ' + UI.num(S.target); UI.text(ctx, up, G.cx, 506, { size: fit(ctx, up, W, 24), colour: P.TEXT_SOFT }); }
    if (S.boss && S.ante <= K.ANTES) {
      const b = 'Boss of this stage: ' + S.boss.name + ' - ' + S.boss.desc;
      UI.text(ctx, b, G.cx, 540, { size: fit(ctx, b, W, 20, 14), colour: lighten(S.boss.colour, 0.45) });
    }
    // Rechte Spalte: Weiter, Neu würfeln, Tresor
    const x = G.rx;
    K.area(ctx, x, 258, RIGHT_W, 454);
    UI.box(ctx, x + 6, 460, RIGHT_W - 12, 244, { colour: P.PANEL, radius: 10, emboss: 3 });
    const vx = x + RIGHT_W / 2;
    if (!K.upg('vault')) {
      UI.text(ctx, 'Vault', vx, 488, { size: 26, colour: P.TEXT_DIM });
      ['Locked - buy the', 'Vault upgrade to save', 'money that grows'].forEach((s, i) => UI.text(ctx, s, vx, 540 + i * 30, { size: 20, colour: P.TEXT_DIM }));
    } else {
      UI.text(ctx, 'Vault', vx, 484, { size: 24, colour: P.TEXT_LABEL });
      UI.text(ctx, '$' + S.vault + ' / $' + K.VAULT_MAX, vx, 520, { size: 34, colour: P.GOLD });
      UI.text(ctx, '+20% every round', vx, 556, { size: 18, colour: P.TEXT_HINT });
      UI.text(ctx, 'withdrawing costs $2', vx, 580, { size: 18, colour: P.TEXT_HINT });
    }
  }

  function drawMenu(back, front, t) {
    UI.dynaText(front, 'WÜRFELGLÜCK', 640, 150, { size: 112, time: t, wave: 4, rotWave: 0.05, colour: [P.RED, P.BLUE, P.MONEY, P.GREEN] });
    UI.dynaText(front, K.menuSub ? K.menuSub() : 'a dice roguelite', 640, 232, { size: 34, time: t, wave: 1.5, colour: '#FFFFFF' });
    UI.text(front, 'Hold dice, reroll, play your hand. 8 stages. Good luck.', 640, 686, { size: 24, colour: P.TEXT_SOFT });
  }

  const L = {
    id: 'mobile', name: 'Mobile', mobile: true,
    die: { x: 655, y: DIE_Y, lift: 30, gap: (n) => Math.min(n > 5 ? 112 : 128, (G.cw - 110) / Math.max(1, n - 1)) },
    diceText: { below: 64, size: 21, numbers: false },
    relicPos: (i, n) => ({ x: G.cx + (i - (n - 1) / 2) * Math.min(108, (G.cw - 110) / Math.max(1, n - 1)), y: RELIC_Y }),
    consPos: (i, n) => ({ x: G.rx + RIGHT_W / 2 + (i - (n - 1) / 2) * 128, y: CONS_Y }),
    bagPos: (k, n) => {
      const gap = Math.min(62, (G.cw - 70) / Math.max(1, n - 1)), w = gap * (n - 1);
      return { x: G.cx - w / 2 + k * gap, y: BAG_Y };
    },
    bagScale: 1.7,
    upgPos: (k) => ({ x: G.lx + 40 + (k % 6) * 44, y: 604 + Math.floor(k / 6) * 52 }),
    upgScale: 1.25,
    shopPos: (k) => ({ x: shopX(k), y: SHOP_Y }),
    buyBtn: (k) => ({ x: shopX(k) - 60, y: 404, w: 120, h: 76, size: 26 }),
    buttons: {},
    msg: { x: 655, y: 300, maxW: 640 },
    msgSizes: { title: 60, sub: 26, small: 22 },
    scoreBox: { w: 112, h: 66 },
    chaos: { y: 172, size: 19, h: 30 },
    homeGap: 270,
    menuDie: (i) => { const t = i / 4 - 0.5; return { x: 640 + t * 620, y: 392 + t * t * 70, r: t * 0.25, s: 3.6 }; },
    logo: { x: 250, y: 90, w: 780, h: 120 },
    flames: { chips: { x: 30, y: 216, w: 112, h: 90 }, mult: { x: 178, y: 216, w: 112, h: 90 } },
    spots: {},
    tutAreas: {},
    tut: {},
    view: () => G,
    drawMenu,
    drawFrame: (back, front, t) => { drawSidebar(back, t); drawTop(back); drawRight(back); drawBag(back); },
    drawPlay: (back) => drawPlay(back),
    drawShop,
    // Knöpfe für das ausgewählte Ding (Use/Sell/Act): unter der Karte, beim Beutel-Würfel darüber
    placeSel(sp, kind, act) {
      const clampRow = (btns) => {
        const l = Math.min(...btns.map((b) => b.x)), r = Math.max(...btns.map((b) => b.x + b.w));
        const dx = l < G.VL + 6 ? G.VL + 6 - l : r > G.VR - 6 ? G.VR - 6 - r : 0;
        btns.forEach((b) => { b.x += dx; });
      };
      if (kind === 'bagdie') { B.act.x = sp.x - B.act.w / 2; B.act.y = sp.y - 44 - B.act.h - 6; clampRow([B.act]); return; }
      const y = sp.y + 64 + 8;
      if (kind === 'cons') { B.use.x = sp.x - B.use.w - 4; B.use.y = y; B.sell.x = sp.x + 4; B.sell.y = y; clampRow([B.use, B.sell]); return; }
      if (kind === 'relic') {
        B.sell.y = y; B.act.y = y;
        if (act) { B.sell.x = sp.x - B.sell.w - 4; B.act.x = sp.x + 4; clampRow([B.sell, B.act]); } else { B.sell.x = sp.x - B.sell.w / 2; clampRow([B.sell]); }
      }
    },
    relayout,
  };

  function relayout() {
    const v = eng.view || { left: 0, right: 1280 };
    G.VL = Math.max(-320, Math.floor(v.left));
    G.VR = Math.min(1600, Math.ceil(v.right));
    G.lx = G.VL + M;
    G.rx = G.VR - M - RIGHT_W;
    G.c0 = G.lx + SIDE_W + 12; G.c1 = G.rx - 12;
    G.cw = G.c1 - G.c0; G.cx = Math.round((G.c0 + G.c1) / 2);
    const cx = G.cx, lx = G.lx, rx = G.rx;
    L.die.x = cx;
    L.msg.x = cx; L.msg.maxW = Math.min(900, G.cw + 120);
    L.flames.chips.x = lx + 20; L.flames.mult.x = lx + 168;
    L.buttons = {
      roll: { x: cx - 284, y: 436, w: 272, h: 92, size: 32 }, play: { x: cx + 12, y: 436, w: 272, h: 92, size: 32 },
      start: { x: 520, y: 520, w: 240, h: 104, size: 46 },
      options: { x: 800, y: 532, w: 230, h: 84, size: 30 }, trophies: { x: 250, y: 532, w: 230, h: 84, size: 30 },
      retry: { x: cx + 10, y: 440, w: 250, h: 88, size: 30 }, home: { x: cx - 260, y: 440, w: 250, h: 88, size: 30 },
      next: { x: rx + 6, y: 268, w: RIGHT_W - 12, h: 92, size: 32 }, shopReroll: { x: rx + 6, y: 372, w: RIGHT_W - 12, h: 78, size: 28 },
      deposit: { x: rx + 14, y: 612, w: 118, h: 80, size: 21 }, withdraw: { x: rx + 138, y: 612, w: 118, h: 80, size: 21 },
      settings: { x: rx, y: 10, w: RIGHT_W, h: 66, size: 28 },
      use: { w: 128, h: 70, size: 28 }, sell: { w: 136, h: 70, size: 26 }, act: { w: 168, h: 70, size: 24 },
    };
    L.spots = {
      money: [lx + 150, 404], score: [lx + 150, 165], total: [lx + 150, 136], chipsBox: [lx + 76, 249], multBox: [lx + 224, 249],
      scoreBox: [lx + 189, 165], upgrade: [lx + 150, 560], vault: [lx + 150, 404], cons: [rx + RIGHT_W / 2, CONS_Y], vaultBox: [rx + RIGHT_W / 2, 520],
    };
    L.tutAreas = {
      target: { x: lx + 12, y: 20, w: 276, h: 102 }, score: { x: lx + 12, y: 136, w: 276, h: 58 }, pipspower: { x: lx + 12, y: 208, w: 276, h: 84 },
      hands_left: { x: lx + 12, y: 306, w: 131, h: 82 }, money: { x: lx + 12, y: 402, w: 276, h: 60 }, hands: { x: rx + 4, y: 262, w: RIGHT_W - 8, h: 446 },
    };
    // Jonny: Gesicht unten links in der Mitte, Sprechblase bis zum rechten Rand (verdeckt dort die unteren Handarten)
    // Jonny außerhalb des Tutorials: überall am Platz des Tutorials, im Shop nur kurz eingeblendet (der Beutel bleibt frei)
    const jt = () => ({ face: L.tut.face, box: L.tut.tip, k: 1, fit: true });
    L.jonny = { get corner() { return jt(); }, get shop() { return jt(); }, get end() { return jt(); }, shopTransient: true };
    L.jobSpot = () => [G.cx, 560];
    L.buttons.help = { x: lx + 20, y: 650, w: 260, h: 50, size: 26 };
    L.tut = {
      face: { x: G.c0 + 4, y: 576, s: 1.75 },
      tip: { x: G.c0 + 140, y: 566, w: G.VR - M - (G.c0 + 140), h: 140 },
      modalBox: { x: 430, y: 196, w: 640, h: 200 }, modalFace: { x: 210, y: 176, s: 2.9 },
      yes: { x: 400, y: 440, w: 300, h: 92, size: 32 }, no: { x: 740, y: 440, w: 260, h: 92, size: 30 },
      x: { x: G.VR - 100, y: 20, w: 84, h: 84, size: 44 },
      done: { x: G.VR - M - 300, y: 450, w: 290, h: 88, size: 30 },
      font: 1.3, lineH: 34,
    };
  }
  relayout();
  return L;
});
