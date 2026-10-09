// Dev-Werkzeug: simuliert einen aktiven Spieler, um das Balancing zu messen.
// Nutzung im Browser (Dev-Server, Sandbox-URL z. B. /?tutorial=done&skills=haul:1):
//   const bot = await (await import('/balance-bot.js')).createBot(); await bot.runAsync(1200); bot.report()
// run() rechnet am Stück (blockiert den Tab), runAsync() in kleinen Häppchen, damit die Seite bedienbar bleibt.
// Der Bot erfüllt Aufträge (Ruf!), kauft Land-Reihen und Skills – immer das Günstigste zuerst.
export async function createBot({ hitInterval = 0.4, idle = false } = {}) {
  const g = window.__game;
  const s = g.state;
  const w = g.world;
  const st = await import('/src/state.js');
  const wk = await import('/src/workers.js');
  const sp = await import('/src/species.js');
  const od = await import('/src/orders.js');
  const ld = await import('/src/land.js');
  const of = await import('/src/offline.js');
  const bd = await import('/src/buildings.js');
  const cu = await import('/src/customers.js');
  const { SKILL_TREES } = await import('/src/skilltrees.js');
  const ALL = SKILL_TREES.flatMap((t) => t.nodes);
  const lvl = (n) => s.skills[n.id] ?? 0;
  const avail = (n) => (n.requires ?? []).every((r) => (s.skills[r] ?? 0) > 0) && lvl(n) < n.max;
  const bot = { t: 0, earned: 0, buys: [], log: [], hitCd: 0, colCd: 0, wages: 0, orders: 0 };
  const minutes = () => (bot.t / 60).toFixed(1);

  bot.tick = (dt) => {
    bot.t += dt;
    const before = s.money;
    st.advanceTime(s, dt);
    of.decayIdle(s, dt);
    if (s.money < before) bot.wages += before - s.money;
    w.update(dt, dt);
    od.tickOrders(s, dt, w.hasSawmill());
    bot.hitCd -= dt;
    if (bot.hitCd <= 0 && hitInterval > 0) {
      bot.hitCd = hitInterval;
      const tree = w.trees.find((t) => t.phase === 'grown');
      if (tree) w.debug.hit(tree);
    }
    bot.colCd -= dt;
    if (bot.colCd > 0) return;
    bot.colCd = 0.6;
    // Holzarten mischen: sobald Birke/Kiefer freigeschaltet sind, je etwa ein Viertel der Bäume (für Aufträge)
    const want = sp.SPECIES_ORDER.filter((id) => id !== 'oak' && sp.isSpeciesUnlocked(s, id))
      .find((id) => w.trees.filter((t) => t.species === id).length < s.treeCap * 0.25);
    if (want) {
      const key = sp.speciesOf(want).sapling;
      const p = sp.saplingBuyPrice(w.treeSlots().used, s.saplingPriceMult, want);
      if (!(s.inventory[key] > 0) && s.money >= p * 2) {
        s.money -= p;
        s.inventory[key] = (s.inventory[key] ?? 0) + 1;
      }
    }
    // Idle-Spieler: klickt nicht, sammelt nicht ein und pflanzt nicht selbst (macht alles der Worker)
    if (!idle) {
      for (const it of [...w.items]) w.debug.collect(it);
      for (const tr of w.trees) {
        if (tr.phase !== 'stump') continue;
        if (!(want && w.debug.replantWith(tr, want))) w.debug.replant(tr);
      }
    }
    w.debug.placeBedsAuto(); // neue Baumbeete sofort setzen
    if (want) w.debug.plantFree(want);
    while (w.debug.plantFree()); // freie Plätze bepflanzen (auch Idle-Spieler schauen ab und zu rein)
    // Aufträge liefern, sobald die Truhe reicht
    for (const o of [...(s.orders?.list ?? [])]) {
      const money = s.money;
      if (od.deliverOrder(s, o.id)) {
        bot.earned += s.money - money;
        bot.orders++;
      }
    }
    const slots = w.treeSlots();
    const stumps = w.trees.filter((t) => t.phase === 'stump').length;
    const need = stumps + (slots.cap - slots.used);
    if (s.inventory.sapling > need + 2) bot.earned += st.sellItem(s, 'sapling', s.inventory.sapling - need - 2);
    // Holz verkaufen, aber was offene Aufträge brauchen, bleibt in der Truhe (außer die Truhe ist fast voll)
    const crowded = st.chestUsed(s) >= s.woodCap - 3;
    for (const key of ['wood', 'birch_log', 'pine_log', 'goldwood', 'oak_plank', 'birch_plank', 'pine_plank']) {
      const n = (s.inventory[key] ?? 0) - (crowded ? 0 : st.orderReserve(s, key));
      if (n > 0) bot.earned += st.sellItem(s, key, n);
    }
    const price = sp.saplingBuyPrice(slots.used, s.saplingPriceMult);
    if (need > s.inventory.sapling && s.money >= price * 1.5) {
      s.money -= price;
      s.inventory.sapling++;
    }
    if (s.workers.length < s.workerCap) {
      wk.ensureBoard(s);
      let best = -1;
      let bestP = Infinity;
      s.board.notes.forEach((c, i) => {
        if (!c) return;
        const p = wk.hirePrice(s, c);
        if (p < bestP) {
          bestP = p;
          best = i;
        }
      });
      if (best >= 0 && s.money >= bestP) {
        wk.hire(s, best);
        bot.buys.push(`${minutes()}m hire#${s.workers.length} ${bestP}`);
      }
    }
    // Günstigstes aus Skills, Land-Reihen und Sägewerk (Bau + Ausbau) kaufen
    const skill = ALL.filter(avail).map((n) => ({ n, c: n.cost(lvl(n)) }));
    const land = ld.SIDES.filter((d) => ld.canExpand(s, d)).map((d) => ({ side: d, c: ld.rowPrice(s, d) }));
    const mills = w.buildings.filter((b) => b.type === 'sawmill');
    const build = [];
    if (s.repLevel >= 2 && !mills.length) build.push({ build: 'sawmill', c: w.buildPrice('sawmill') });
    for (const b of mills) {
      const next = bd.BUILDING_DEFS.sawmill.levels[b.level + 1];
      if (next) build.push({ upgrade: b, c: next.cost });
    }
    const cand = [...skill, ...land, ...build].sort((a, b) => a.c - b.c)[0];
    if (cand && s.money >= cand.c) {
      if (cand.side) {
        w.expandLand(cand.side);
        bot.buys.push(`${minutes()}m land-${cand.side} ${cand.c}`);
      } else if (cand.build) {
        if (w.debug.buildAnywhere(cand.build)) bot.buys.push(`${minutes()}m build-${cand.build} ${cand.c}`);
      } else if (cand.upgrade) {
        if (w.buildingApi.upgrade(cand.upgrade)) bot.buys.push(`${minutes()}m sawmill-lv${cand.upgrade.level + 1} ${cand.c}`);
      } else {
        s.money -= cand.c;
        s.skills[cand.n.id] = lvl(cand.n) + 1;
        st.recomputeStats(s);
        bot.buys.push(`${minutes()}m ${cand.n.id}${cand.n.max > 1 ? lvl(cand.n) : ''} ${cand.c}`);
      }
    }
  };

  let nextLog = 60;
  const logLine = () => {
    const slots = w.treeSlots();
    const hearts = cu.CUSTOMERS.map((c) => cu.hearts(s, c.id)).join('');
    const species = sp.SPECIES_ORDER.map((id) => w.trees.filter((t) => t.species === id).length).join('/');
    bot.log.push(`${Math.round(bot.t / 60)}m earned ${Math.round(bot.earned)} money ${Math.round(s.money)} wages ${Math.round(bot.wages)} trees ${slots.used}/${slots.cap} (${species}) workers ${s.workers.length} skills ${Object.keys(s.skills).length} land ${ld.rowsBought(s)} rep ${s.reputation} orders ${bot.orders} hearts ${hearts} mill ${w.buildings.filter((b) => b.type === 'sawmill').map((b) => b.level + 1).join() || '-'}`);
  };
  // Einnahmen pro Minute (für den Vergleich mit den Zielwerten)
  bot.snapshot = () => ({ t: Math.round(bot.t), earned: Math.round(bot.earned), skills: Object.keys(s.skills).length, workers: s.workers.length, rep: s.reputation, land: ld.rowsBought(s) });
  const step = (until, dt) => {
    while (bot.t < until) {
      bot.tick(dt);
      if (bot.t >= nextLog) {
        logLine();
        nextLog += 60;
      }
    }
  };

  bot.run = (seconds, dt = 0.1) => {
    step(bot.t + seconds, dt);
    return bot;
  };
  // In Häppchen von chunk Spielsekunden, dazwischen bekommt der Browser Luft
  bot.runAsync = async (seconds, dt = 0.1, chunk = 20) => {
    const end = bot.t + seconds;
    while (bot.t < end) {
      step(Math.min(end, bot.t + chunk), dt);
      await new Promise((r) => setTimeout(r, 0));
    }
    return bot;
  };
  bot.report = () => ({ log: bot.log, buys: bot.buys });
  return bot;
}
