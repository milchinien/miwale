// Statistik-Seite des Minecraft-Servers (miwale.com/minecraft/statistics).
//
// Liest den Stand von /api/minecraft/ (server/minecraft.mjs) und baut daraus die
// Seite: Server-Zeile, Summen der Welt, Rangliste je Kategorie, Spielerkarten
// und die Rekorde als Inventar-Slots. Alles, was vom Server kommt, landet nur
// als Text im DOM (textContent), nie als HTML. Laedt jede Minute neu.

(function () {
  "use strict";

  const API = "/api/minecraft/";
  const NEU_LADEN_MS = 60 * 1000;
  // Ohne neuen Stand so lange gilt das Panel (und damit der Server) als aus.
  const VERALTET_MS = 20 * 60 * 1000;

  const $ = (id) => document.getElementById(id);
  function el(tag, attrs, ...kinder) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") e.className = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else if (v !== null && v !== undefined && v !== false) e.setAttribute(k, v === true ? "" : v);
    }
    for (const c of kinder.flat()) if (c !== null && c !== undefined && c !== false) e.append(c instanceof Node ? c : String(c));
    return e;
  }

  // ------------------------------------------------------------ Zahlen

  const ganz = (n) => Math.round(n).toLocaleString("de-DE");
  const komma = (n, d = 1) => n.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
  function dauer(sek) {
    const t = Math.floor(sek / 86400), h = Math.floor((sek % 86400) / 3600), m = Math.floor((sek % 3600) / 60);
    if (t) return `${t} T. ${h} Std.`;
    if (h) return `${h} Std. ${m} Min.`;
    return `${m} Min.`;
  }
  function vor(ms) {
    const s = Math.max(0, Math.round(ms / 1000));
    if (s < 60) return "gerade eben";
    const m = Math.round(s / 60);
    if (m < 60) return m === 1 ? "vor 1 Minute" : `vor ${m} Minuten`;
    const h = Math.round(m / 60);
    if (h < 48) return h === 1 ? "vor 1 Stunde" : `vor ${h} Stunden`;
    return `vor ${Math.round(h / 24)} Tagen`;
  }

  const KATEGORIEN = [
    { key: "mined", name: "Abgebaut", lang: "Blöcke abgebaut", fmt: ganz },
    { key: "mobKills", name: "Mobs besiegt", lang: "Mobs besiegt", fmt: ganz },
    { key: "playSec", name: "Spielzeit", lang: "Spielzeit", fmt: dauer },
    { key: "distanceKm", name: "Strecke", lang: "Zurückgelegt", fmt: (v) => komma(v) + " km" },
    { key: "deaths", name: "Tode", lang: "Tode", fmt: ganz },
    { key: "crafted", name: "Hergestellt", lang: "Gegenstände hergestellt", fmt: ganz },
    { key: "used", name: "Benutzt", lang: "Blöcke & Items benutzt", fmt: ganz },
    { key: "jumps", name: "Sprünge", lang: "Sprünge", fmt: ganz },
    { key: "damageDealt", name: "Schaden", lang: "Schaden ausgeteilt", fmt: (v) => ganz(v / 2) + " ♥" },
    { key: "damageTaken", name: "Eingesteckt", lang: "Schaden eingesteckt", fmt: (v) => ganz(v / 2) + " ♥" },
    { key: "fish", name: "Fische", lang: "Fische gefangen", fmt: ganz },
    { key: "bred", name: "Gezüchtet", lang: "Tiere gezüchtet", fmt: ganz },
    { key: "playerKills", name: "PvP", lang: "Spieler besiegt", fmt: ganz },
  ];
  const kat = (key) => KATEGORIEN.find((k) => k.key === key);

  const SPLASHES = [
    "Auch mit Kotwurst!", "Frisch abgebaut!", "Jetzt mit Ranglisten!", "Läuft auf einem PC!", "100 % Blöcke!",
    "Ohne Lags!", "Wie 2018!", "Mit Scheiben!", "Zahlen, Zahlen, Zahlen!", "Creeper-frei!*", "Holy tuff!",
  ];

  // ------------------------------------------------------------ Stand

  let stand = null;
  let kategorie = (location.hash.slice(1) && kat(location.hash.slice(1))) ? location.hash.slice(1) : "mined";
  let schriftGeladen = null;

  const textur = (key) => (stand && stand.texturen && stand.texturen[key] ? `${API}textur/${key}.png?v=${stand.texturen[key]}` : null);
  const texKey = (s) => String(s).toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 64);
  function bild(key, klasse, alt) {
    const src = textur(key);
    return src ? el("img", { class: klasse || "", src, alt: alt || "", loading: "lazy", decoding: "async", draggable: "false" }) : null;
  }
  const kopf = (name, klasse) => bild("kopf_" + texKey(name), "kopfbild " + (klasse || ""), "") || el("span", { class: "kopfbild " + (klasse || "") });

  function blockName(id) {
    const n = stand.namen || {};
    return n["block.minecraft." + id] || n["item.minecraft." + id] || hübsch(id);
  }
  const mobName = (id) => (stand.namen || {})["entity.minecraft." + id] || hübsch(id);
  function hübsch(id) { return id.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()); }

  function texturenSetzen() {
    const r = document.documentElement.style;
    const setze = (v, key) => { const src = textur(key); if (src) r.setProperty(v, `url("${src}")`); };
    setze("--t-dirt", "ui_dirt");
    setze("--t-button", "ui_button");
    setze("--t-button-hover", "ui_button_hover");
    setze("--t-xp", "ui_xp");
    setze("--t-xp-bg", "ui_xp_bg");
    if (stand.schrift && schriftGeladen !== stand.schrift && "FontFace" in window) {
      schriftGeladen = stand.schrift;
      const f = new FontFace("Minecraft Panel", `url("${API}schrift.woff?v=${stand.schrift}") format("woff")`);
      f.load().then((x) => document.fonts.add(x)).catch(() => {});
    }
  }

  // ------------------------------------------------------------ Teile der Seite

  function serverZeile() {
    const s = stand.server || {};
    const alt = Date.now() - Date.parse(stand.zeit) > VERALTET_MS;
    const online = s.online && !alt;
    const wer = online ? s.spielerOnline || [] : [];
    $("server").replaceChildren(
      bild("ui_grass_side", "symbol bild", "") || el("span", { class: "symbol" }),
      el("div", { class: "mitte" },
        el("div", { class: "name" }, s.name || "Minecraft-Server"),
        el("div", { class: "motd" }, online
          ? (wer.length ? `Gerade online: ${wer.join(", ")}` : "Der Server läuft – gerade spielt niemand.")
          : "Der Server ist gerade offline."),
        s.version ? el("div", { class: "motd" }, "Minecraft " + s.version) : null),
      el("div", { class: "rechts" },
        el("div", { class: "anzahl" },
          online ? el("span", {}, `${wer.length}/${s.maxSpieler || "?"}`) : el("span", { class: "offline" }, "Offline"),
          bild(online ? "ui_ping_5" : "ui_ping_unknown", "", online ? "Online" : "Offline")),
        el("div", { class: "koepfe" }, wer.map((n) => { const k = kopf(n); k.title = n; return k; }))));
  }

  function summen() {
    const t = (stand.welt && stand.welt.totals) || {};
    const eintrag = (icon, wert, was) => el("div", { class: "summe" }, bild(icon, "bild", ""), el("div", {}, el("div", { class: "wert" }, wert), el("div", { class: "was" }, was)));
    $("summen").replaceChildren(
      eintrag("kat_players", ganz(t.players || stand.spieler.length), (t.players || stand.spieler.length) === 1 ? "Spieler" : "Spieler insgesamt"),
      eintrag("kat_playsec", dauer(t.playSec || 0), "gemeinsam gespielt"),
      eintrag("kat_mined", ganz(t.mined || 0), "Blöcke abgebaut"),
      eintrag("kat_mobkills", ganz(t.mobKills || 0), "Mobs besiegt"),
      eintrag("kat_distancekm", komma(t.distanceKm || 0) + " km", "zurückgelegt"),
      eintrag("kat_crafted", ganz(t.crafted || 0), "hergestellt"),
      eintrag("kat_deaths", ganz(t.deaths || 0), "Tode"),
      eintrag("kat_jumps", ganz(t.jumps || 0), "Sprünge"));
  }

  function kategorienKnoepfe() {
    $("kategorien").replaceChildren(...KATEGORIEN.map((k) => el("button", {
      class: "knopf", type: "button", role: "tab", "aria-selected": k.key === kategorie ? "true" : "false",
      onclick: () => { kategorie = k.key; history.replaceState(null, "", "#" + k.key); kategorienKnoepfe(); rangliste(); },
    }, bild("kat_" + texKey(k.key), "bild", ""), k.name)));
  }

  function rangliste() {
    const k = kat(kategorie);
    const liste = stand.spieler.slice().sort((a, b) => b[k.key] - a[k.key] || a.name.localeCompare(b.name));
    const max = Math.max(1, ...liste.map((p) => p[k.key]));
    $("rangliste").setAttribute("aria-label", k.lang);
    if (!liste.length) { $("rangliste").replaceChildren(el("div", { class: "leer" }, "Noch hat niemand gespielt.")); return; }
    $("rangliste").replaceChildren(...liste.map((p, i) => {
      const fuell = el("div");
      fuell.style.clipPath = `inset(0 ${100 - (100 * p[k.key]) / max}% 0 0)`;
      return el("div", { class: "zeile" },
        el("div", { class: "platz" }, `${i + 1}.`),
        kopf(p.name),
        el("div", { class: "name" }, p.name),
        el("div", { class: "xp", "aria-hidden": "true" }, fuell),
        el("div", { class: "wert" }, k.fmt(p[k.key])));
    }));
  }

  function slot(icon, anzahl, titel, unter) {
    const b = bild(icon, "bild", titel);
    const s = el("div", { class: "slot", tabindex: "0", "aria-label": `${titel}: ${ganz(anzahl)}` },
      b || el("span", { class: "ersatz" }, "?"),
      anzahl > 1 ? el("span", { class: "zahl" }, anzahl >= 10000 ? Math.round(anzahl / 1000) + "k" : anzahl >= 1000 ? komma(anzahl / 1000) + "k" : String(anzahl)) : null);
    tooltip(s, titel, unter || ganz(anzahl) + "×");
    return s;
  }

  function spielerKarten() {
    const online = new Set(stand.server && stand.server.online && Date.now() - Date.parse(stand.zeit) < VERALTET_MS ? stand.server.spielerOnline : []);
    const liste = stand.spieler.slice().sort((a, b) => b.playSec - a.playSec);
    if (!liste.length) { $("spieler").replaceChildren(el("div", { class: "leer" }, "Noch keine Spieler.")); return; }
    $("spieler").replaceChildren(...liste.map((p) => {
      const zeile = (key) => { const k = kat(key); return [el("dt", {}, bild("kat_" + texKey(key), "bild", ""), k.name), el("dd", {}, k.fmt(p[key]))]; };
      const tops = [
        ...p.topMined.map((e) => slot(texKey(e.id), e.count, blockName(e.id), `${ganz(e.count)}× abgebaut`)),
        ...p.topKilled.map((e) => slot("mob_" + texKey(e.id), e.count, mobName(e.id), `${ganz(e.count)}× besiegt`)),
      ];
      return el("article", { class: "fenster karte" },
        el("div", { class: "oben" }, kopf(p.name),
          el("div", {},
            el("div", { class: "name" }, p.name),
            el("div", { class: "status " + (online.has(p.name) ? "online" : "offline") }, online.has(p.name) ? "● online" : "offline"))),
        el("dl", { class: "werte" }, ...["playSec", "mined", "mobKills", "deaths", "distanceKm", "crafted"].flatMap(zeile)),
        tops.length ? el("div", { class: "slots" }, tops) : null);
    }));
  }

  function inventare() {
    const w = stand.welt || {};
    const fenster = (titel, liste, icon, name, verb) => el("div", { class: "fenster" },
      el("h3", {}, titel),
      liste && liste.length
        ? el("div", { class: "slots" }, liste.map((e) => slot(icon(e.id), e.count, name(e.id), `${ganz(e.count)}× ${verb}`)))
        : el("div", {}, "Noch nichts."));
    $("inventare").replaceChildren(
      fenster("Meist abgebaut", w.topMined, texKey, blockName, "abgebaut"),
      fenster("Meist besiegt", w.topKilled, (id) => "mob_" + texKey(id), mobName, "besiegt"),
      fenster("Meist hergestellt", w.topCrafted, texKey, blockName, "hergestellt"),
      fenster("Häufigste Todesursachen", w.topKilledBy, (id) => "mob_" + texKey(id), mobName, "getötet von"));
  }

  // ------------------------------------------------------------ Tooltip

  function tooltip(ziel, titel, unter) {
    const tip = $("tooltip");
    const zeigen = (x, y) => {
      tip.replaceChildren(el("div", {}, titel), unter ? el("div", { class: "unter" }, unter) : null);
      tip.hidden = false;
      const r = tip.getBoundingClientRect();
      tip.style.left = Math.min(window.innerWidth - r.width - 8, x + 16) + "px";
      tip.style.top = Math.max(8, y - r.height - 8) + "px";
    };
    ziel.addEventListener("mousemove", (e) => zeigen(e.clientX, e.clientY));
    ziel.addEventListener("mouseleave", () => { tip.hidden = true; });
    ziel.addEventListener("focus", () => { const r = ziel.getBoundingClientRect(); zeigen(r.right, r.top); });
    ziel.addEventListener("blur", () => { tip.hidden = true; });
  }

  // ------------------------------------------------------------ Laden

  function standZeile() {
    if (!stand || stand.leer) return;
    const zeit = Date.parse(stand.zeit);
    $("stand").textContent = `Zuletzt aktualisiert ${vor(Date.now() - zeit)} · aktualisiert sich automatisch`;
  }

  function zeichnen() {
    texturenSetzen();
    serverZeile();
    summen();
    kategorienKnoepfe();
    rangliste();
    spielerKarten();
    inventare();
    standZeile();
  }

  async function laden() {
    try {
      const r = await fetch(API, { cache: "no-cache" });
      if (!r.ok) throw new Error(String(r.status));
      const d = await r.json();
      $("warten").hidden = !d.leer;
      $("inhalt").hidden = !!d.leer;
      if (d.leer) {
        $("stand").textContent = "";
        return;
      }
      if (stand && stand.zeit === d.zeit) { standZeile(); serverZeile(); return; }
      stand = d;
      stand.spieler = stand.spieler || [];
      zeichnen();
    } catch {
      if (!stand) $("stand").textContent = "Die Statistiken konnten nicht geladen werden. Bitte später noch einmal versuchen.";
    }
  }

  $("splash").textContent = SPLASHES[Math.floor(Math.random() * SPLASHES.length)];
  laden();
  setInterval(() => { if (!document.hidden) laden(); }, NEU_LADEN_MS);
  setInterval(standZeile, 15 * 1000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) laden(); });
})();
