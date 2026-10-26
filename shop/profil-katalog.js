// Katalog des Profils: Perlen-Shop, Erfolge und Spielregeln. Eine Quelle fuer die
// Seite (shop/profil*.js) und den Server (server/profil.mjs): der Server prueft
// Preise, Voraussetzungen und Erfolge gegen genau diese Datei, die Seite zeichnet
// daraus Shop und Profil. Darum nur Daten und ein paar Hilfen, kein DOM.
//
// Muss NACH shop/spiele.js und shop/spiele-auto.js geladen werden: Fuer jedes
// Spiel entstehen daraus ein Avatar, ein Banner und drei Spielzeit-Erfolge.
//
// Aendern:
//  - Neuer Gegenstand: Eintrag in ITEMS. id nie aendern, sonst verlieren Spieler
//    ihren Kauf. Preise darf man aendern (wer schon gekauft hat, behaelt ihn).
//  - Neuer Erfolg der Plattform: Eintrag in ERFOLGE und die Bedingung in
//    server/profil.mjs (PRUEFER). Erfolge in einem Spiel: SPIEL_ERFOLGE unten, das
//    Spiel meldet sie mit miwale.erfolg("<id>") (public/sdk/miwale.js).
//  - Texte immer in en UND de.
(() => {
  "use strict";
  const spiele = window.MIWALE_SPIELE || [];

  // ---- Regeln ----------------------------------------------------------------------
  // Perlen gibt es nur fuer das, was man tut -- nie fuer Geld. Gezaehlt wird
  // Spielzeit nur, solange das Spielfenster offen und der Tab sichtbar ist, mit
  // Tagesgrenze, damit ein offener Tab nicht ueber Nacht Perlen sammelt.
  const REGELN = {
    perleProSekunden: 300,       // 1 Perle je 5 Minuten Spielzeit
    tagesPerlenSpielzeit: 24,    // ... hoechstens 24 am Tag (2 Stunden)
    tagesSekundenMax: 8 * 3600,  // mehr Spielzeit zaehlt am Tag nicht
    besuchPerlen: 5,             // taeglich beim ersten Besuch
    serieBonusMax: 5,            // dazu +1 je Tag in Folge, bis 5
    bewertungPerlen: 10,         // einmal je Spiel, fuer die erste Bewertung
    ideePerlen: 15,              // je Game Request, hoechstens 3 am Tag
    ideenProTag: 3,
    levelPerlen: 5,              // je neuem Level, mal dem Level
    ep: { minute: 1, erfolg: 40, besuch: 10, bewertung: 20, idee: 30 },
    levelFaktor: 50,             // Erfahrung fuer Level L: 50 * L * (L - 1)
    tageBlockSek: 90,            // ein Herzschlag zaehlt hoechstens so viele Sekunden
    verlaufMax: 40
  };

  // ---- Symbole (Pfade stehen in shop/profil.js) -------------------------------------
  const SYMBOLE = ["stern", "blitz", "flamme", "krone", "tropfen", "fisch", "qualle", "anker", "muschel", "seestern",
    "kristall", "mond", "herz", "uhr", "buch", "zahnrad", "karte", "flagge", "pokal", "schluessel", "blase", "welle",
    "kompass", "schild", "perle"];

  // ---- Gegenstaende ----------------------------------------------------------------
  // slot: avatar | rahmen | banner | name | titel | akzent
  // preis: Perlen. standard: Jeder hat ihn, kostet nichts.
  // erfolg: nicht kaeuflich, kommt mit diesem Erfolg.
  // braucht: { spiel, sekunden } Mindest-Spielzeit in diesem Spiel.
  // selten: gewoehnlich | selten | episch | legendaer (nur Anzeige)
  const T = (en, de) => ({ en, de });
  const ITEMS = [
    // Avatare: Symbol auf Farbverlauf. Der Wal ist der Standard.
    { id: "av-wal", slot: "avatar", art: "wal", name: T("Whale", "Wal"), standard: true, preis: 0, selten: "gewoehnlich" },
    { id: "av-welle", slot: "avatar", symbol: "welle", farben: ["#0F8CA6", "#3FC6DC"], name: T("Wave", "Welle"), preis: 20, selten: "gewoehnlich" },
    { id: "av-blase", slot: "avatar", symbol: "blase", farben: ["#33488C", "#7FE0EE"], name: T("Bubbles", "Blasen"), preis: 20, selten: "gewoehnlich" },
    { id: "av-fisch", slot: "avatar", symbol: "fisch", farben: ["#E8A33D", "#E2596B"], name: T("Fish", "Fisch"), preis: 25, selten: "gewoehnlich" },
    { id: "av-qualle", slot: "avatar", symbol: "qualle", farben: ["#7B8FCB", "#E2596B"], name: T("Jellyfish", "Qualle"), preis: 35, selten: "gewoehnlich" },
    { id: "av-anker", slot: "avatar", symbol: "anker", farben: ["#172449", "#4A62AD"], name: T("Anchor", "Anker"), preis: 35, selten: "gewoehnlich" },
    { id: "av-muschel", slot: "avatar", symbol: "muschel", farben: ["#E2596B", "#FAE6C4"], name: T("Shell", "Muschel"), preis: 40, selten: "gewoehnlich" },
    { id: "av-seestern", slot: "avatar", symbol: "seestern", farben: ["#E8A33D", "#FFB25B"], name: T("Starfish", "Seestern"), preis: 40, selten: "gewoehnlich" },
    { id: "av-mond", slot: "avatar", symbol: "mond", farben: ["#070C1A", "#4A62AD"], name: T("Moon", "Mond"), preis: 45, selten: "selten" },
    { id: "av-herz", slot: "avatar", symbol: "herz", farben: ["#E2596B", "#FFB25B"], name: T("Heart", "Herz"), preis: 45, selten: "selten" },
    { id: "av-blitz", slot: "avatar", symbol: "blitz", farben: ["#172449", "#E8A33D"], name: T("Lightning", "Blitz"), preis: 60, selten: "selten" },
    { id: "av-flamme", slot: "avatar", symbol: "flamme", farben: ["#E2596B", "#E8A33D"], name: T("Flame", "Flamme"), preis: 60, selten: "selten" },
    { id: "av-kristall", slot: "avatar", symbol: "kristall", farben: ["#33488C", "#BFF1F7"], name: T("Crystal", "Kristall"), preis: 90, selten: "episch" },
    { id: "av-krone", slot: "avatar", symbol: "krone", farben: ["#8A5A12", "#FFD36B"], name: T("Crown", "Krone"), preis: 150, selten: "episch" },
    { id: "av-pokal", slot: "avatar", symbol: "pokal", farben: ["#8A5A12", "#FFD36B"], name: T("Trophy", "Pokal"), erfolg: "zehn-stunden", selten: "legendaer" },

    // Rahmen um den Avatar
    { id: "rf-keiner", slot: "rahmen", name: T("No frame", "Kein Rahmen"), standard: true, preis: 0, selten: "gewoehnlich" },
    { id: "rf-aqua", slot: "rahmen", farben: ["#3FC6DC", "#7FE0EE"], name: T("Aqua ring", "Aqua-Ring"), preis: 25, selten: "gewoehnlich" },
    { id: "rf-koralle", slot: "rahmen", farben: ["#E2596B", "#FFB25B"], name: T("Coral ring", "Korallen-Ring"), preis: 40, selten: "gewoehnlich" },
    { id: "rf-eis", slot: "rahmen", farben: ["#BFF1F7", "#7B8FCB"], name: T("Ice", "Eis"), preis: 50, selten: "selten" },
    { id: "rf-gold", slot: "rahmen", farben: ["#FFD36B", "#B8860B"], name: T("Gold", "Gold"), preis: 60, selten: "selten" },
    { id: "rf-neon", slot: "rahmen", farben: ["#7FE0EE", "#9B7BFF"], animiert: true, name: T("Neon glow", "Neon-Leuchten"), preis: 90, selten: "episch" },
    { id: "rf-flamme", slot: "rahmen", farben: ["#FF6A3D", "#FFD36B"], animiert: true, name: T("Fire ring", "Feuerring"), preis: 110, selten: "episch" },
    { id: "rf-regenbogen", slot: "rahmen", farben: ["#E2596B", "#E8A33D", "#2FB47C", "#3FC6DC", "#9B7BFF"], animiert: true, name: T("Rainbow", "Regenbogen"), preis: 160, selten: "legendaer" },
    { id: "rf-perle", slot: "rahmen", farben: ["#FFFFFF", "#BFF1F7", "#E8EDF9"], animiert: true, name: T("Pearl shine", "Perlenglanz"), erfolg: "sammler-10", selten: "legendaer" },

    // Banner hinter dem Profil
    { id: "bn-tiefsee", slot: "banner", farben: ["#0D3A4E", "#071A29"], name: T("Deep sea", "Tiefsee"), standard: true, preis: 0, selten: "gewoehnlich" },
    { id: "bn-riff", slot: "banner", farben: ["#0F8CA6", "#2FB47C"], name: T("Reef", "Riff"), preis: 30, selten: "gewoehnlich" },
    { id: "bn-daemmerung", slot: "banner", farben: ["#33488C", "#E2596B"], name: T("Dusk", "Dämmerung"), preis: 30, selten: "gewoehnlich" },
    { id: "bn-wald", slot: "banner", farben: ["#173B2B", "#4C9A5E"], name: T("Forest", "Wald"), preis: 30, selten: "gewoehnlich" },
    { id: "bn-vulkan", slot: "banner", farben: ["#2B0D0D", "#E2596B"], name: T("Volcano", "Vulkan"), preis: 60, selten: "selten" },
    { id: "bn-nordlicht", slot: "banner", farben: ["#071A29", "#2FB47C", "#9B7BFF"], animiert: true, name: T("Aurora", "Nordlicht"), preis: 80, selten: "episch" },
    { id: "bn-sterne", slot: "banner", farben: ["#050A16", "#22336B"], sterne: true, name: T("Starry night", "Sternennacht"), preis: 100, selten: "episch" },

    // Namensstile
    { id: "nm-standard", slot: "name", name: T("Plain", "Schlicht"), standard: true, preis: 0, selten: "gewoehnlich" },
    { id: "nm-aqua", slot: "name", farben: ["#7FE0EE"], name: T("Aqua", "Aqua"), preis: 30, selten: "gewoehnlich" },
    { id: "nm-koralle", slot: "name", farben: ["#FF8F8F"], name: T("Coral", "Koralle"), preis: 30, selten: "gewoehnlich" },
    { id: "nm-mint", slot: "name", farben: ["#8FEFC4"], name: T("Mint", "Minze"), preis: 30, selten: "gewoehnlich" },
    { id: "nm-violett", slot: "name", farben: ["#B9A3FF"], name: T("Violet", "Violett"), preis: 30, selten: "gewoehnlich" },
    { id: "nm-gold", slot: "name", farben: ["#FFD36B"], name: T("Gold", "Gold"), preis: 40, selten: "selten" },
    { id: "nm-verlauf", slot: "name", farben: ["#7FE0EE", "#B9A3FF"], verlauf: true, name: T("Gradient", "Verlauf"), preis: 90, selten: "episch" },
    { id: "nm-neon", slot: "name", farben: ["#7FE0EE"], leuchten: true, name: T("Neon", "Neon"), preis: 120, selten: "episch" },
    { id: "nm-schimmer", slot: "name", farben: ["#FFD36B", "#FFFFFF"], schimmer: true, name: T("Shimmer", "Schimmer"), preis: 140, selten: "legendaer" },

    // Titel unter dem Namen
    { id: "ti-keiner", slot: "titel", name: T("No title", "Kein Titel"), standard: true, preis: 0, selten: "gewoehnlich" },
    { id: "ti-neuling", slot: "titel", name: T("Newcomer", "Neuling"), standard: true, preis: 0, selten: "gewoehnlich" },
    { id: "ti-taucher", slot: "titel", name: T("Diver", "Taucher"), preis: 30, selten: "gewoehnlich" },
    { id: "ti-idle", slot: "titel", name: T("Idle addict", "Idle-Süchtiger"), preis: 40, selten: "gewoehnlich" },
    { id: "ti-kartenhai", slot: "titel", name: T("Card shark", "Kartenhai"), preis: 40, selten: "gewoehnlich" },
    { id: "ti-tueftler", slot: "titel", name: T("Tinkerer", "Tüftler"), preis: 40, selten: "gewoehnlich" },
    { id: "ti-nachteule", slot: "titel", name: T("Night owl", "Nachteule"), preis: 40, selten: "gewoehnlich" },
    { id: "ti-perlentaucher", slot: "titel", name: T("Pearl diver", "Perlentaucher"), preis: 100, selten: "selten" },
    { id: "ti-wal", slot: "titel", name: T("Whale friend", "Walfreund"), preis: 200, selten: "episch" },
    { id: "ti-entdecker", slot: "titel", name: T("Explorer", "Entdecker"), erfolg: "entdecker-5", selten: "selten" },
    { id: "ti-stammgast", slot: "titel", name: T("Regular", "Stammgast"), erfolg: "serie-7", selten: "selten" },
    { id: "ti-marathon", slot: "titel", name: T("Marathon player", "Marathonspieler"), erfolg: "fuenfzig-stunden", selten: "episch" },
    { id: "ti-legende", slot: "titel", name: T("Legend", "Legende"), erfolg: "level-20", selten: "legendaer" },

    // Akzentfarbe des Profils (Linien, Knoepfe, Balken)
    { id: "ak-aqua", slot: "akzent", farben: ["#7FE0EE"], name: T("Aqua", "Aqua"), standard: true, preis: 0, selten: "gewoehnlich" },
    { id: "ak-koralle", slot: "akzent", farben: ["#FF8F8F"], name: T("Coral", "Koralle"), preis: 25, selten: "gewoehnlich" },
    { id: "ak-mint", slot: "akzent", farben: ["#8FEFC4"], name: T("Mint", "Minze"), preis: 25, selten: "gewoehnlich" },
    { id: "ak-gold", slot: "akzent", farben: ["#FFD36B"], name: T("Gold", "Gold"), preis: 25, selten: "gewoehnlich" },
    { id: "ak-violett", slot: "akzent", farben: ["#B9A3FF"], name: T("Violet", "Violett"), preis: 25, selten: "gewoehnlich" },
    { id: "ak-rosa", slot: "akzent", farben: ["#FF9FD0"], name: T("Pink", "Rosa"), preis: 25, selten: "gewoehnlich" }
  ];

  // Zu jedem Spiel ein Avatar und ein Banner mit dem Bild des Spiels. Erst nach
  // zehn Minuten in diesem Spiel kaeuflich: ein Abzeichen fuers Dabeigewesensein.
  for (const sp of spiele) {
    ITEMS.push({ id: "av-spiel-" + sp.id, slot: "avatar", art: "spiel", spiel: sp.id, name: T(sp.name, sp.name), preis: 60, braucht: { spiel: sp.id, sekunden: 600 }, selten: "selten" });
    ITEMS.push({ id: "bn-spiel-" + sp.id, slot: "banner", art: "spiel", spiel: sp.id, name: T(sp.name, sp.name), preis: 90, braucht: { spiel: sp.id, sekunden: 600 }, selten: "selten" });
  }

  // ---- Erfolge der Plattform -------------------------------------------------------
  // stufe: bronze | silber | gold | platin. Die Bedingungen stehen in server/profil.mjs.
  const E = (id, symbol, stufe, perlen, name, text) => ({ id, symbol, stufe, perlen, name, text, art: "plattform" });
  const ERFOLGE = [
    E("willkommen", "welle", "bronze", 5, T("Welcome aboard", "Willkommen an Bord"), T("Create your profile.", "Dein Profil anlegen.")),
    E("erste-minuten", "uhr", "bronze", 5, T("First dive", "Erster Tauchgang"), T("Play for 10 minutes in total.", "Insgesamt 10 Minuten spielen.")),
    E("eine-stunde", "uhr", "silber", 10, T("Getting comfortable", "Eingelebt"), T("Play for 1 hour in total.", "Insgesamt 1 Stunde spielen.")),
    E("zehn-stunden", "pokal", "gold", 40, T("Deep diver", "Tiefseetaucher"), T("Play for 10 hours in total.", "Insgesamt 10 Stunden spielen.")),
    E("fuenfzig-stunden", "pokal", "platin", 100, T("Marathon", "Marathon"), T("Play for 50 hours in total.", "Insgesamt 50 Stunden spielen.")),
    E("entdecker-3", "kompass", "bronze", 10, T("Curious", "Neugierig"), T("Play 3 different games for at least a minute each.", "3 verschiedene Spiele je mindestens eine Minute spielen.")),
    E("entdecker-5", "kompass", "silber", 25, T("Explorer", "Entdecker"), T("Play 5 different games for at least a minute each.", "5 verschiedene Spiele je mindestens eine Minute spielen.")),
    E("erste-bewertung", "stern", "bronze", 10, T("Critic", "Kritiker"), T("Write your first review.", "Deine erste Bewertung schreiben.")),
    E("ideengeber", "schluessel", "bronze", 10, T("Idea machine", "Ideengeber"), T("Send your first game request.", "Deinen ersten Game Request senden.")),
    E("serie-3", "flamme", "bronze", 10, T("Three in a row", "Drei in Folge"), T("Visit on 3 days in a row.", "An 3 Tagen hintereinander vorbeischauen.")),
    E("serie-7", "flamme", "silber", 25, T("Regular", "Stammgast"), T("Visit on 7 days in a row.", "An 7 Tagen hintereinander vorbeischauen.")),
    E("serie-30", "flamme", "gold", 100, T("Part of the furniture", "Fester Bestandteil"), T("Visit on 30 days in a row.", "An 30 Tagen hintereinander vorbeischauen.")),
    E("level-5", "schild", "bronze", 10, T("Level 5", "Level 5"), T("Reach level 5.", "Level 5 erreichen.")),
    E("level-10", "schild", "silber", 30, T("Level 10", "Level 10"), T("Reach level 10.", "Level 10 erreichen.")),
    E("level-20", "schild", "gold", 80, T("Level 20", "Level 20"), T("Reach level 20.", "Level 20 erreichen.")),
    E("erster-kauf", "perle", "bronze", 5, T("First purchase", "Erster Einkauf"), T("Buy something in the Pearl Shop.", "Etwas im Perlen-Shop kaufen.")),
    E("ausgestattet", "kristall", "bronze", 10, T("Dressed up", "Ausgestattet"), T("Use a non-default avatar, frame and banner at once.", "Gleichzeitig Avatar, Rahmen und Banner, die nicht Standard sind.")),
    E("sammler-10", "muschel", "gold", 50, T("Collector", "Sammler"), T("Own 10 items from the shop.", "10 Gegenstände aus dem Shop besitzen.")),
    E("perlenvermoegen", "perle", "silber", 20, T("Pearl hoard", "Perlenschatz"), T("Earn 500 pearls in total.", "Insgesamt 500 Perlen verdienen."))
  ];

  // Je Spiel drei Erfolge allein aus der Spielzeit, ohne dass das Spiel etwas tun muss.
  const SPIEL_ZEIT = [["10m", 600, "bronze", 3, T("First steps", "Erste Schritte"), T("minutes", "Minuten")], ["1h", 3600, "silber", 10, T("Hooked", "Gepackt"), T("hour", "Stunde")], ["10h", 36000, "gold", 30, T("Devoted", "Hingebungsvoll"), T("hours", "Stunden")]];
  const SPIEL_ZEIT_ERFOLGE = [];
  for (const sp of spiele) {
    for (const [kurz, sek, stufe, perlen, name, einheit] of SPIEL_ZEIT) {
      const n = kurz === "10m" ? 10 : kurz === "1h" ? 1 : 10;
      SPIEL_ZEIT_ERFOLGE.push({
        id: "spiel:" + sp.id + ":" + kurz, art: "spielzeit", spiel: sp.id, sekunden: sek, symbol: "uhr", stufe, perlen,
        // Unter dem Spiel (Bibliothek, Profil) ohne den Namen davor.
        titel: name,
        name: T(sp.name + ": " + name.en, sp.name + ": " + name.de),
        text: T("Play " + sp.name + " for " + n + " " + (kurz === "1h" ? "hour" : einheit.en) + ".", sp.name + " " + n + " " + (kurz === "1h" ? "Stunde" : einheit.de) + " lang spielen.")
      });
    }
  }

  // ---- Erfolge, die ein Spiel selbst meldet ----------------------------------------
  // Ein Spiel ruft miwale.erfolg("<id>") (public/sdk/miwale.js). Hier stehen nur
  // die, die ein Spiel wirklich meldet -- ein Erfolg, der nie kommen kann, ist nur
  // ein Rätsel. Eintrag: { id, symbol, stufe, perlen, name: {en,de}, text: {en,de} }.
  // Die ids im Profil heissen "spiel:<spiel>:<id>".
  const SPIEL_ERFOLGE = {
    // dropfall: [{ id: "arena-1", symbol: "stern", stufe: "bronze", perlen: 5, name: T("Arena 1 cleared", "Arena 1 geschafft"), text: T("…", "…") }],
  };
  const SPIEL_EIGENE = [];
  for (const [spiel, liste] of Object.entries(SPIEL_ERFOLGE)) {
    for (const e of liste) SPIEL_EIGENE.push({ ...e, id: "spiel:" + spiel + ":" + e.id, art: "spiel", spiel, eigeneId: e.id, titel: e.name });
  }

  window.MIWALE_PROFIL = {
    version: 1,
    waehrung: { en: { viele: "Pearls", eine: "Pearl" }, de: { viele: "Perlen", eine: "Perle" } },
    regeln: REGELN,
    symbole: SYMBOLE,
    items: ITEMS,
    stufen: ["bronze", "silber", "gold", "platin"],
    erfolge: [...ERFOLGE, ...SPIEL_ZEIT_ERFOLGE, ...SPIEL_EIGENE],
    // Erfahrung, die fuer Level L noetig ist (Level 1 ab 0).
    levelAb: (level) => REGELN.levelFaktor * level * (level - 1),
    levelVon(ep) {
      let l = 1;
      while (ep >= this.levelAb(l + 1)) l++;
      return l;
    }
  };
})();
