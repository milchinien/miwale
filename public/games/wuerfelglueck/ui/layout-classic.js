// Würfelglück – Layout "Classic": das ursprüngliche Layout (Seitenleiste links, Relikte oben, Beutel unten).
// Bleibt unverändert erhalten, damit man jederzeit zurückschalten kann.
(window.WG_LAYOUTS = window.WG_LAYOUTS || []).push((K) => {
  const { S, R, UI, P, eng, J, B } = K;
  const { darken, lighten } = K;

  const RELIC_ROW = { x: 630, y: 80, gap: 112 };
  const CONS_ROW = { x: 1102, y: 80, gap: 110 };
  const BAG_ROW = { x: 372, y: 636, gap: 58 };
  const UPG_ROW = { x: 52, y: 640, gap: 42, perRow: 6 };
  // Plätze 0-2: Angebote, 3: Würfel (immer ganz rechts), 4: Upgrade
  const SHOP_X = [410, 525, 640, 885, 765], SHOP_Y = 330;
  const row = (o) => (i, n) => ({ x: o.x + (i - (n - 1) / 2) * o.gap, y: o.y });
  const bagGap = (n) => Math.min(BAG_ROW.gap, 880 / Math.max(1, n - 1));

  function drawSidebar(ctx, t, front) {
    const lab = K.blindLabel();
    UI.box(ctx, 16, 10, 282, 700, { colour: P.SIDEBAR, radius: 16, shadow: true });
    // Blind und Ziel (im Shop: der nächste Blind)
    UI.box(ctx, 28, 22, 258, 100, { colour: lab.colour, radius: 12, emboss: 4 });
    UI.dynaText(ctx, (S.phase === 'shop' ? 'Next: ' : '') + lab.name, 157, 46, { size: S.phase === 'shop' ? 26 : 30, time: t, wave: 1.5 });
    if (K.jonnyBoss && K.jonnyBoss()) K.drawJonnyHead(ctx, 32, 20, 46);   // Endboss: Jonnys Kopf neben seinem Namen
    UI.box(ctx, 40, 66, 234, 46, { colour: darken(lab.colour, 0.5), radius: 9, shadow: false });
    UI.text(ctx, 'Target', 82, 89, { size: 18, colour: P.TEXT_LABEL });
    UI.text(ctx, UI.num(S.target), 196, 89, { size: 32, colour: P.RED });
    // Punkte dieses Blinds
    UI.box(ctx, 28, 134, 258, 56, { colour: P.PANEL, radius: 10, emboss: 3 });
    UI.text(ctx, 'Score', 70, 162, { size: 20, colour: P.TEXT_LABEL });
    UI.box(ctx, 112, 141, 166, 42, { colour: P.PANEL_DARK, radius: 8, shadow: false });
    K.juiced(ctx, J.score, 195, 162, t, () => UI.text(ctx, UI.num(S.dispScore), 195, 162, { size: 32 }));
    // Handart, Chips × Mult
    UI.box(ctx, 28, 202, 258, 128, { colour: P.PANEL, radius: 10, emboss: 3 });
    if (S.handName) K.juiced(front, J.name, 157, 228, t, () => UI.dynaText(front, S.handName, 157, 228, { size: 26, time: t, pop: Math.min(1, (eng.time - S.handNameT) * 3), wave: 1.5 }));
    // Während der Abschluss-Animation fliegt Power in Pips (K.fuse liefert, was gerade zu zeigen ist)
    const fz = K.fuse();
    K.juiced(ctx, J.chips, 92, 286, t, () => {
      UI.box(ctx, 40, 254, 104, 62, { colour: fz && fz.merged ? P.ORANGE : P.CHIPS, radius: 9, emboss: 4 });
      UI.text(ctx, fz && fz.chipsText !== null ? fz.chipsText : UI.num(S.chips), 92, 284, { size: fz && fz.merged ? 30 : 36 });
    });
    if (!fz) UI.text(ctx, 'X', 157, 285, { size: 30, colour: P.RED });
    if (!fz || !fz.hideMult) K.juiced(ctx, J.mult, 222, 286, t, () => {
      UI.box(ctx, 170, 254, 104, 62, { colour: P.MULT, radius: 9, emboss: 4 });
      UI.text(ctx, K.fmtMult(S.mult), 222, 284, { size: 36 });
    });
    // Hände / Neu würfeln
    K.statBox(ctx, 28, 344, 124, 76, 'Hands', S.hands, P.BLUE, J.hands, t);
    K.statBox(ctx, 162, 344, 124, 76, 'Rerolls', S.rerolls, P.RED, J.rerolls, t);
    // Geld (und Tresor)
    UI.box(ctx, 28, 432, 258, 58, { colour: P.PANEL, radius: 10, emboss: 3 });
    UI.box(ctx, 40, 440, 234, 42, { colour: P.PANEL_DARK, radius: 8, shadow: false });
    const mx = K.upg('vault') ? 122 : 157;
    K.juiced(ctx, J.money, mx, 461, t, () => UI.dynaText(ctx, K.money(), mx, 461, { size: 38, colour: S.money < 0 ? P.RED : P.MONEY, time: t, wave: 1 }));
    if (K.upg('vault')) { UI.text(ctx, 'Vault', 232, 452, { size: 14, colour: P.TEXT_DIM }); UI.text(ctx, '$' + S.vault, 232, 471, { size: 22, colour: P.GOLD }); }
    // Ante / Blind
    K.statBox(ctx, 28, 502, 124, 76, 'Stage', Math.min(S.ante, K.ANTES) + '/' + K.ANTES, P.ORANGE, K.still, t);
    K.statBox(ctx, 162, 502, 124, 76, 'Round', (S.blindIdx + 1) + '/' + K.BLINDS.length, P.ORANGE, K.still, t);
    // Upgrades
    UI.box(ctx, 28, 590, 258, 110, { colour: P.PANEL, radius: 10, emboss: 3 });
    UI.text(ctx, 'Upgrades', 157, 606, { size: 17, colour: P.TEXT_LABEL });
    if (!S.upgrades.length) {
      UI.text(ctx, 'One new upgrade is offered', 157, 640, { size: 14, colour: P.TEXT_DIM });
      UI.text(ctx, 'in the shop every stage', 157, 658, { size: 14, colour: P.TEXT_DIM });
    }
  }

  function drawTop(ctx) {
    K.area(ctx, 330, 16, 600, 138);
    if (!S.relics.length) UI.text(ctx, 'No relics yet - buy them in the shop', 630, 78, { size: 18, colour: P.TEXT_DIM });
    UI.text(ctx, 'Relics ' + S.relics.length + '/' + K.relicMax(), 344, 144, { size: 14, colour: P.TEXT_SOFT, align: 'left' });
    K.setTagRects(K.tagSummary(ctx, 690, 141));
    K.area(ctx, 944, 16, 316, 138);
    if (!S.cons.length) UI.text(ctx, 'Constellations, Oracles & Tallies', 1102, 78, { size: 15, colour: P.TEXT_DIM });
    UI.text(ctx, 'Consumables ' + S.cons.length + '/' + R.MAX_CONS, 1102, 145, { size: 14, colour: P.TEXT_SOFT });
  }

  function drawBag(ctx) {
    K.area(ctx, 330, 560, 930, 144);
    UI.text(ctx, 'Bag ' + S.bag.length + '/' + K.bagMax() + '  ·  ' + K.drawCount() + ' dice per hand', 350, 578, { size: 15, colour: P.TEXT_SOFT, align: 'left' });
    const job = K.jobLine && K.jobLine();
    if (job) UI.text(ctx, job.text, 1160, 578, { size: K.fitText(ctx, job.text, 560, 15), colour: job.colour, align: 'right' });
    else UI.text(ctx, '[Enter] Play  [R] Reroll  [1-6] Hold  ·  drag relics to reorder  ·  [O]', 1160, 578, { size: 13, colour: P.TEXT_DIM, align: 'right' });
  }

  function drawPlay(ctx) {
    K.area(ctx, 330, 168, 660, 312);
    const pv = S.phase === 'select' ? K.preview() : null;
    if (S.handName) UI.text(ctx, S.handName, 660, 200, { size: 34, colour: P.GOLD });
    else if (pv && K.isBust(pv)) UI.text(ctx, 'BUST!  ' + pv.skulls + ' Skulls', 660, 200, { size: 30, colour: P.RED });
    else if (pv) UI.text(ctx, pv.name + '   ' + R.handValues(pv.name, S.levels).join(' x ') + (pv.skulls ? '   ' + pv.skulls + ' Skull' + (pv.skulls > 1 ? 's' : '') : ''), 660, 200, { size: 28, colour: P.TEXT_SOFT });
    if (K.isBossBlind() && S.boss) UI.text(ctx, S.boss.name + ': ' + S.boss.desc, 660, 236, { size: 17, colour: lighten(S.boss.colour, 0.45) });
    // Statuszeile: Luck und Augenzahl-Stufen
    const L = K.luck();
    if (L > 0) UI.text(ctx, 'Luck ' + L + '%', 346, 458, { size: 16, colour: P.GREEN, align: 'left' });
    const nl = [1, 2, 3, 4, 5, 6].filter((v) => (S.numLevels[v] || 1) > 1);
    if (nl.length) UI.text(ctx, 'Numbers  ' + nl.map((v) => v + ': Lv ' + S.numLevels[v]).join('   '), 660, 458, { size: 15, colour: lighten(K.TYPE_COL.tally, 0.4) });
    else if (!['lost', 'runWon'].includes(S.phase)) UI.text(ctx, 'Click dice to hold them. Oracles work on held dice.', 660, 458, { size: 14, colour: P.TEXT_HINT });
    if (K.anchorCap()) UI.text(ctx, 'Anchors ' + K.anchorCap(), 974, 458, { size: 14, colour: P.ANCHOR, align: 'right' });
    // Handarten-Tabelle mit Stufen und Spielzählern
    K.area(ctx, 1004, 168, 256, 312);
    UI.text(ctx, 'Hands (Pips x Power)', 1132, 186, { size: 16, colour: P.TEXT_SOFT });
    const hl = S.handName || (pv && pv.name), mp = K.mostPlayed();
    R.HAND_ORDER.forEach((n, i) => {
      const y = 212 + i * 29, on = n === hl, lv = S.levels[n] || 1, cnt = S.handCounts[n] || 0;
      if (on) UI.box(ctx, 1010, y - 11, 244, 27, { colour: P.HIGHLIGHT, radius: 5, shadow: false });
      UI.text(ctx, n, 1016, y - 1, { size: 15, colour: on ? P.GOLD : P.TEXT_SOFT, align: 'left' });
      UI.text(ctx, 'Lv ' + lv + (cnt ? '  ·  played ' + cnt + (n === mp ? ' (most)' : '') : ''), 1016, y + 11, { size: 11, colour: lv > 1 ? P.PLANET : P.TEXT_FAINT, align: 'left' });
      UI.text(ctx, R.handValues(n, S.levels).join(' x '), 1250, y + 4, { size: 15, colour: on ? P.GOLD : P.TEXT_SOFT, align: 'right' });
    });
  }

  function drawShop(ctx, front, t) {
    K.area(ctx, 330, 168, 930, 378);
    UI.dynaText(front, 'SHOP', 640, 200, { size: 40, time: t, wave: 2, colour: P.GOLD });
    K.shopLabels(ctx, (k) => ({ x: SHOP_X[k], price: 251, label: 396 }));
    if (S.shop && !S.shop[4]) UI.text(ctx, K.upgradeNote(), SHOP_X[4], SHOP_Y, { size: 13, colour: P.TEXT_FAINT });
    // Tresor
    UI.box(ctx, 966, 304, 286, 150, { colour: P.PANEL, radius: 10, emboss: 3 });
    if (!K.upg('vault')) {
      UI.text(ctx, 'Vault', 1109, 330, { size: 22, colour: P.TEXT_DIM });
      UI.text(ctx, 'Locked - buy the Vault upgrade', 1109, 372, { size: 15, colour: P.TEXT_DIM });
      UI.text(ctx, 'to save money that grows', 1109, 392, { size: 15, colour: P.TEXT_DIM });
    } else {
      UI.text(ctx, 'Vault', 1109, 326, { size: 20, colour: P.TEXT_LABEL });
      UI.text(ctx, '$' + S.vault + ' / $' + K.VAULT_MAX, 1109, 356, { size: 30, colour: P.GOLD });
      UI.text(ctx, '+20% every round  ·  withdrawing costs $2', 1109, 386, { size: 13, colour: P.TEXT_HINT });
    }
    // Unten: links Jonny hinter der Theke (zeichnet das Spiel), daneben sein Auftrag, rechts der Boss der Stage
    if (K.drawJob) K.drawJob(ctx, { x: 776, y: 460, w: 180, h: 80 });
    if (S.boss && S.ante <= K.ANTES) {
      UI.box(ctx, 966, 460, 286, 80, { colour: P.PANEL, radius: 10, emboss: 3 });
      UI.text(ctx, 'Stage boss: ' + S.boss.name, 1109, 476, { size: 16, colour: lighten(S.boss.colour, 0.45) });
      K.wrapPlain(ctx, S.boss.desc, 262, 13).slice(0, 3).forEach((ln, i) => UI.text(ctx, ln, 1109, 497 + i * 15, { size: 13, colour: P.TEXT_SOFT }));
    }
  }

  function drawMenu(back, front, t) {
    UI.dynaText(front, 'WÜRFELGLÜCK', 640, 170, { size: 96, time: t, wave: 4, rotWave: 0.05, colour: [P.RED, P.BLUE, P.MONEY, P.GREEN] });
    UI.dynaText(front, K.menuSub ? K.menuSub() : 'a dice roguelite', 640, 240, { size: 28, time: t, wave: 1.5, colour: '#FFFFFF' });
    UI.text(front, 'Hold dice, reroll, play your hand. 8 stages. Good luck.', 640, 672, { size: 18, colour: P.TEXT_SOFT });
  }

  return {
    id: 'classic', name: 'Classic',
    die: { x: 660, y: 360, lift: 26, gap: (n) => (n > 5 ? 104 : 118) },
    relicPos: row(RELIC_ROW), consPos: row(CONS_ROW),
    bagPos: (k, n) => ({ x: BAG_ROW.x + k * bagGap(n), y: BAG_ROW.y }), bagScale: 1.4,
    upgPos: (k) => ({ x: UPG_ROW.x + (k % UPG_ROW.perRow) * UPG_ROW.gap, y: UPG_ROW.y + Math.floor(k / UPG_ROW.perRow) * 44 }),
    shopPos: (k) => ({ x: SHOP_X[k], y: SHOP_Y }),
    buyBtn: (k) => ({ x: SHOP_X[k] - 50, y: 412, w: 100, h: 38 }),
    buttons: {
      roll: { x: 430, y: 494, w: 220, h: 52 }, play: { x: 670, y: 494, w: 220, h: 52 },
      start: { x: 530, y: 560, w: 220, h: 66, size: 34 }, options: { x: 760, y: 566, w: 150, h: 54, size: 24 },
      retry: { x: 715, y: 420, w: 160, h: 54 },
      next: { x: 1024, y: 186, w: 170, h: 52, size: 24 }, shopReroll: { x: 1024, y: 246, w: 170, h: 44, size: 22 },
      deposit: { x: 976, y: 404, w: 128, h: 38 }, withdraw: { x: 1112, y: 404, w: 132, h: 38 },
    },
    msg: { x: 660, y: 300, maxW: 640 },   // Mitte des Würfelfelds (330–990)
    scoreBox: { w: 104, h: 62 },
    menuDie: (i) => { const t = i / 4 - 0.5; return { x: 640 + t * 560, y: 400 + t * t * 80, r: t * 0.25, s: 3 }; },
    flames: { chips: { x: 40, y: 254, w: 104, h: 90 }, mult: { x: 170, y: 254, w: 104, h: 90 } },
    spots: { money: [157, 430], score: [157, 160], total: [157, 128], chipsBox: [92, 285], multBox: [222, 285], scoreBox: [195, 162], upgrade: [222, 236], vault: [157, 400], cons: [1132, 300], vaultBox: [1109, 356] },
    drawMenu,
    drawFrame: (back, front, t) => { drawSidebar(back, t, front); drawTop(back); drawBag(back); },
    drawPlay: (back) => drawPlay(back),
    drawShop,
  };
});
