// Profil-Seiten: /profile (das eigene, mit Anpassen und Einstellungen) und
// /u/<name> (das eines anderen, so wie der Server es freigibt).
// Zustand, Bausteine und Hinweise stehen in shop/profil.js.
(() => {
  "use strict";

  const UI = window.MIWALE_PROFIL_UI;
  if (!UI) return;
  const { esc, lokal, symbol } = UI;
  const K = UI.katalog;

  const TEXTE = {
    en: {
      titel: (n) => n + " — miwale profile", titelEigen: "Your profile — miwale games",
      laedt: "Loading…", nichtGefunden: "This profile doesn't exist, or its owner keeps it private.",
      anmeldenTitel: "Sign in to create your profile",
      baldTitel: "Profiles are coming soon", baldText: "As soon as accounts go live you get a profile with achievements, pearls and your own look. Your playtime is already being saved on this device — see your library.",
      anpassen: "Customize", einstellungen: "Settings", shop: "Pearl Shop", fertig: "Done",
      mitglied: (d) => "Member since " + d, serie: (n) => n + "-day best streak", versteckt: "Only you can see this profile.",
      level: (n) => "Level " + n, ep: (a, b) => a + " / " + b + " XP",
      statZeit: "Playtime", statZeitPrivat: "Private", statErfolge: "Achievements", statItems: "Items owned", statSerie: "Best streak", tage: (n) => n + (n === 1 ? " day" : " days"),
      vitrine: "Showcase", vitrineLeer: "No achievements on display yet.", vitrineBearbeiten: "Edit showcase", vitrineHilfe: "Pick up to 3 achievements to show off.",
      erfolge: "Achievements", alle: "All", offen: "Locked", frei: "Unlocked", plattform: "miwale",
      spielzeit: "Playtime by game", zuletzt: (d) => "last played " + d, nie: "never played",
      verlauf: "Pearl history", verlaufLeer: "Nothing yet — play something!",
      anpassenTitel: "Customize your profile", anpassenHilfe: "Wear anything you own. Buy more in the Pearl Shop.",
      getragen: "Equipped", tragen: "Wear",
      slots: { avatar: "Avatar", rahmen: "Frame", banner: "Banner", name: "Name style", titel: "Title", akzent: "Accent" },
      einstellungenTitel: "Privacy and settings",
      sichtbar: "Public profile", sichtbarHilfe: "Others can open your profile at /u/" , spielzeitZeigen: "Show my playtime", spielzeitHilfe: "Show total and per-game playtime on your public profile. Off by default.",
      daten: "Download my data", datenschutz: "Privacy policy", gespeichert: "Saved.", fehler: "That didn't work. Please try again.",
      grund: {
        spielzeit: (g) => "Playtime: " + g, besuch: "Daily visit", erfolg: (n) => "Achievement: " + n, bewertung: (g) => "Review: " + g, idee: "Game request",
        level: (n) => "Level " + n + " reached", kauf: (n) => "Bought " + n, verwaltung: "Adjustment by miwale"
      },
      fortschritt: (a, b) => a + " / " + b,
      seltenheit: "Rarity",
      levelWort: "Level", statSpiele: "Games played", perlenTitel: "Pearls", bibliothek: "Library", abzeichen: "Badges",
      spieleTitel: "Games and achievements", spieleLeer: "No games played yet.", aufgezeichnet: (z) => z + " on record",
      erfolgFortschritt: (a, b) => "Achievements " + a + " of " + b, inBibliothek: "Open in library", spielen: "Play", shopSeite: "Store page", gesperrt: "Locked", konto: "Account"
    },
    de: {
      titel: (n) => n + " — miwale-Profil", titelEigen: "Dein Profil — miwale games",
      laedt: "Lädt…", nichtGefunden: "Dieses Profil gibt es nicht, oder sein Besitzer hält es privat.",
      anmeldenTitel: "Melde dich an, um dein Profil anzulegen",
      baldTitel: "Profile kommen bald", baldText: "Sobald Konten freigeschaltet sind, bekommst du ein Profil mit Erfolgen, Perlen und deinem eigenen Look. Deine Spielzeit wird schon jetzt auf diesem Gerät gespeichert — schau in deine Bibliothek.",
      anpassen: "Anpassen", einstellungen: "Einstellungen", shop: "Perlen-Shop", fertig: "Fertig",
      mitglied: (d) => "Dabei seit " + d, serie: (n) => "Beste Serie: " + n + " Tage", versteckt: "Nur du siehst dieses Profil.",
      level: (n) => "Level " + n, ep: (a, b) => a + " / " + b + " EP",
      statZeit: "Spielzeit", statZeitPrivat: "Privat", statErfolge: "Erfolge", statItems: "Besitz", statSerie: "Beste Serie", tage: (n) => n + (n === 1 ? " Tag" : " Tage"),
      vitrine: "Vitrine", vitrineLeer: "Noch keine Erfolge ausgestellt.", vitrineBearbeiten: "Vitrine bearbeiten", vitrineHilfe: "Wähle bis zu 3 Erfolge zum Angeben.",
      erfolge: "Erfolge", alle: "Alle", offen: "Gesperrt", frei: "Freigeschaltet", plattform: "miwale",
      spielzeit: "Spielzeit je Spiel", zuletzt: (d) => "zuletzt gespielt " + d, nie: "nie gespielt",
      verlauf: "Perlen-Verlauf", verlaufLeer: "Noch nichts — spiel etwas!",
      anpassenTitel: "Dein Profil anpassen", anpassenHilfe: "Trag alles, was du besitzt. Mehr gibt es im Perlen-Shop.",
      getragen: "Getragen", tragen: "Tragen",
      slots: { avatar: "Avatar", rahmen: "Rahmen", banner: "Banner", name: "Namensstil", titel: "Titel", akzent: "Akzent" },
      einstellungenTitel: "Datenschutz und Einstellungen",
      sichtbar: "Öffentliches Profil", sichtbarHilfe: "Andere können dein Profil unter /u/", spielzeitZeigen: "Meine Spielzeit zeigen", spielzeitHilfe: "Zeigt Gesamt- und Spielzeit je Spiel auf deinem öffentlichen Profil. Standardmäßig aus.",
      daten: "Meine Daten herunterladen", datenschutz: "Datenschutzerklärung", gespeichert: "Gespeichert.", fehler: "Das hat nicht geklappt. Bitte versuch es noch einmal.",
      grund: {
        spielzeit: (g) => "Spielzeit: " + g, besuch: "Täglicher Besuch", erfolg: (n) => "Erfolg: " + n, bewertung: (g) => "Bewertung: " + g, idee: "Game Request",
        level: (n) => "Level " + n + " erreicht", kauf: (n) => "Gekauft: " + n, verwaltung: "Korrektur durch miwale"
      },
      fortschritt: (a, b) => a + " / " + b,
      seltenheit: "Seltenheit",
      levelWort: "Level", statSpiele: "Gespielte Spiele", perlenTitel: "Perlen", bibliothek: "Bibliothek", abzeichen: "Abzeichen",
      spieleTitel: "Spiele und Erfolge", spieleLeer: "Noch keine Spiele gespielt.", aufgezeichnet: (z) => z + " gespielt",
      erfolgFortschritt: (a, b) => "Erfolge " + a + " von " + b, inBibliothek: "In der Bibliothek öffnen", spielen: "Spielen", shopSeite: "Shop-Seite", gesperrt: "Gesperrt", konto: "Konto"
    }
  };

  const seite = { el: null, sprache: "en", name: null, vm: null, offen: new Set(), filter: "alle", anpassen: false, slot: "avatar", einstellungen: false, vitrineBearbeiten: false, meldung: "" };
  const t = () => TEXTE[seite.sprache];
  const ERFOLG_ANZAHL = K.erfolge.length;

  function datumKurz(iso) {
    try { return new Intl.DateTimeFormat(seite.sprache, { month: "short", year: "numeric" }).format(new Date(iso)); } catch (e) { return String(iso).slice(0, 7); }
  }
  function datumTag(iso) {
    try { return new Intl.DateTimeFormat(seite.sprache, { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)); } catch (e) { return String(iso).slice(0, 10); }
  }
  const zeitText = (s) => UI.T().sekunden(s);

  // ---- Daten -----------------------------------------------------------------------------
  // Beide Quellen (eigenes Profil, fremdes Profil) in eine Gestalt bringen.
  function ausEigenem(p, konto) {
    const gesamt = Object.values(p.spiele).reduce((s, x) => s + x.sek, 0);
    return {
      name: konto.name, erstellt: p.erstellt, level: p.level, ep: p.ep, levelAb: p.levelAb, naechstesLevelAb: p.naechstesLevelAb,
      ausruestung: p.ausruestung, vitrine: p.vitrine, erfolge: p.erfolge, serieBeste: p.serie.beste, inventarAnzahl: p.inventar.length,
      spielzeit: { gesamt, spiele: Object.entries(p.spiele).map(([id, x]) => ({ id, sek: x.sek, zuletzt: x.zuletzt })).sort((a, b) => b.sek - a.sek) },
      eigenes: true, versteckt: !p.sichtbar, perlen: p.perlen, inventar: p.inventar, verlauf: p.verlauf,
      sichtbar: p.sichtbar, spielzeitZeigen: p.spielzeitZeigen, heute: p.heute
    };
  }
  function ausFremdem(p) {
    return { ...p, serieBeste: p.serie.beste, inventar: [], verlauf: [] };
  }

  async function einbauen(el, sprache, name) {
    Object.assign(seite, { el, sprache, name: name || null, vm: null, offen: new Set(), filter: "alle", anpassen: false, slot: "avatar", einstellungen: false, vitrineBearbeiten: false, meldung: "" });
    el.addEventListener("click", klick);
    el.addEventListener("change", aendern);
    // Aufgeklappte Gruppen merken, damit ein Neuzeichnen sie nicht wieder zuklappt.
    el.addEventListener("toggle", (e) => {
      const k = e.target.dataset && e.target.dataset.pfGruppe;
      if (k === undefined || k === "") return;
      if (e.target.open) seite.offen.add(k); else seite.offen.delete(k);
    }, true);
    el.innerHTML = '<p class="pf-laedt">' + esc(t().laedt) + "</p>";
    const konto = ID().konto ? ID().konto() : null;
    await ID().bereit();
    if (seite.el !== el) return;
    if (!name) {
      document.title = t().titelEigen;
      if (!ID().konto()) { el.innerHTML = ID().kontenAktiv() ? anmeldeKasten() : baldKasten(); return; }
      await UI.laden();
      if (seite.el !== el) return;
      const p = UI.stand();
      if (!p) { el.innerHTML = '<p class="pf-laedt">' + esc(t().fehler) + "</p>"; return; }
      seite.vm = ausEigenem(p, ID().konto());
    } else {
      document.title = t().titel(name);
      const r = await UI.holen("u/" + encodeURIComponent(name)).catch(() => null);
      if (seite.el !== el) return;
      if (!r || r.status !== 200) { el.innerHTML = '<p class="pf-laedt">' + esc(t().nichtGefunden) + "</p>"; return; }
      seite.vm = ausFremdem(r.daten.profil);
      document.title = t().titel(seite.vm.name);
      if (konto && konto.name.toLowerCase() === seite.vm.name.toLowerCase() && UI.stand()) {
        // Das eigene Profil ueber /u/<name> geoeffnet: mit allen Werkzeugen zeigen.
        seite.vm = ausEigenem(UI.stand(), konto);
      }
    }
    zeichnen();
  }
  const ID = () => window.MIWALE_IDENTITAET;

  // Anmelden ist noch nicht eingerichtet: erklaeren statt eines toten Knopfs.
  function baldKasten() {
    return '<div class="pf-anmelden"><h1>' + esc(t().baldTitel) + "</h1><p class=\"pf-hilfe\">" + esc(t().baldText) + '</p><p><a class="sp-knopf sp-knopf--play" href="/library" data-link>' + esc(t().bibliothek) + "</a></p></div>";
  }

  function anmeldeKasten() {
    const k = window.MIWALE_KONTO;
    return '<div class="pf-anmelden"><h1>' + esc(t().anmeldenTitel) + "</h1>" + (k ? k.anmeldeKasten(seite.sprache, "profil", "/profile") : "") + "</div>";
  }

  // ---- Zeichnen --------------------------------------------------------------------------
  function koepfeHtml(vm) {
    const b = UI.bannerAttr(vm.ausruestung);
    const titel = UI.titelText(vm.ausruestung);
    const naechst = vm.naechstesLevelAb - vm.levelAb;
    return '<header class="pf-kopf">' +
      '<div class="' + b.klasse + '" style="' + esc(b.style) + '"></div><div class="pf-kopf__schleier"></div>' +
      '<div class="pf-kopf__innen">' +
        UI.avatarHtml(vm.ausruestung, "l", vm.name) +
        '<div class="pf-kopf__text"><h1 class="pf-kopf__name">' + UI.namenHtml(vm.name, vm.ausruestung) + "</h1>" +
          (titel ? '<p class="pf-titel">' + esc(titel) + "</p>" : "") +
          '<p class="pf-meta">' + esc(t().mitglied(datumKurz(vm.erstellt))) + (vm.versteckt ? ' · <span class="pf-privat">' + esc(t().versteckt) + "</span>" : "") + "</p></div>" +
        '<div class="pf-level"><div class="pf-level__zeile"><span>' + esc(t().levelWort) + '</span><span class="pf-level__abzeichen">' + vm.level + "</span></div>" +
          '<div class="pf-balken" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + UI.levelProzent(vm) + '"><span style="width:' + UI.levelProzent(vm) + '%"></span></div>' +
          "<small>" + esc(t().ep(vm.ep - vm.levelAb, naechst)) + "</small>" +
          (vm.eigenes ? '<div class="pf-kopf__knoepfe">' +
            '<button type="button" class="pf-knopf" data-pf-anpassen aria-pressed="' + seite.anpassen + '">' + esc(seite.anpassen ? t().fertig : t().anpassen) + "</button>" +
            '<button type="button" class="pf-knopf" data-pf-einstellungen aria-pressed="' + seite.einstellungen + '">' + esc(t().einstellungen) + "</button></div>" : "") +
        "</div>" +
      "</div></header>";
  }

  // Seitenleiste rechts: Werte, Abzeichen (Erfolge der Plattform), Perlen und Links.
  function seitenleisteHtml(vm) {
    const freie = Object.keys(vm.erfolge).length;
    const zeit = vm.spielzeit ? zeitText(vm.spielzeit.gesamt) : t().statZeitPrivat;
    const gespielt = vm.spielzeit ? vm.spielzeit.spiele.filter((s) => s.sek > 0 && UI.spiel(s.id)).length : null;
    const werte = [
      [t().statZeit, zeit],
      gespielt !== null ? [t().statSpiele, String(gespielt)] : null,
      [t().statErfolge, freie + " / " + ERFOLG_ANZAHL],
      [t().statItems, String(vm.inventarAnzahl)],
      [t().statSerie, t().tage(vm.serieBeste || 0)]
    ].filter(Boolean);
    const plattform = K.erfolge.filter((e) => e.art === "plattform")
      .map((e, i) => ({ e, am: vm.erfolge[e.id] || null, i }))
      .sort((a, b) => (b.am ? 1 : 0) - (a.am ? 1 : 0) || String(b.am || "").localeCompare(String(a.am || "")) || a.i - b.i);
    const frei = plattform.filter((x) => x.am).length;
    return '<aside class="pf-leiste">' +
      '<section class="pf-kasten"><dl class="pf-werte">' + werte.map(([n, w]) => "<div><dt>" + esc(n) + "</dt><dd>" + esc(w) + "</dd></div>").join("") + "</dl></section>" +
      (vm.eigenes ? '<section class="pf-kasten"><h2>' + esc(t().perlenTitel) + '</h2><p class="pf-guthaben">' + UI.perleHtml() + "<b>" + vm.perlen + "</b> " + esc(UI.waehrung(vm.perlen)) + "</p>" +
        '<p class="pf-links"><a href="/pearls" data-link>' + esc(t().shop) + '</a><a href="/library" data-link>' + esc(t().bibliothek) + "</a></p></section>" : "") +
      '<section class="pf-kasten"><h2>' + esc(t().abzeichen) + " <span>" + frei + " / " + plattform.length + '</span></h2><ul class="pf-abzeichen">' +
        plattform.map((x) => '<li class="' + (x.am ? "ist-frei" : "") + '" tabindex="0" title="' + esc(lokal(x.e.name) + " — " + lokal(x.e.text) + (x.am ? " (" + datumTag(x.am) + ")" : "")) + '">' + UI.erfolgSymbol(x.e, !x.am) + "<span>" + esc(lokal(x.e.name)) + "</span></li>").join("") +
      "</ul></section>" +
      (vm.eigenes ? verlaufHtml(vm) : "") +
    "</aside>";
  }

  function vitrineHtml(vm) {
    const ids = (vm.vitrine || []).filter((id) => vm.erfolge[id] && UI.erfolg(id));
    if (!vm.eigenes && !ids.length) return "";
    const slots = [0, 1, 2].map((i) => {
      const e = ids[i] && UI.erfolg(ids[i]);
      const sp = e && e.spiel ? UI.spiel(e.spiel) : null;
      return e ? '<div class="pf-vitrine__platz pf-vitrine__platz--voll">' + UI.erfolgSymbol(e) + "<strong>" + esc(lokal(e.titel || e.name)) + "</strong><small>" + esc(sp ? sp.name : lokal(e.text)) + "</small></div>"
        : '<div class="pf-vitrine__platz"></div>';
    }).join("");
    return '<section class="pf-kasten"><div class="pf-kasten__kopf"><h2>' + esc(t().vitrine) + "</h2>" +
      (vm.eigenes ? '<button type="button" class="pf-link" data-pf-vitrine>' + esc(seite.vitrineBearbeiten ? t().fertig : t().vitrineBearbeiten) + "</button>" : "") + "</div>" +
      (!ids.length && vm.eigenes && !seite.vitrineBearbeiten ? '<p class="pf-hilfe">' + esc(t().vitrineLeer) + "</p>" : "") +
      '<div class="pf-vitrine">' + slots + "</div>" +
      (vm.eigenes && seite.vitrineBearbeiten ? vitrineWahl(vm) : "") + "</section>";
  }

  function vitrineWahl(vm) {
    const frei = Object.keys(vm.erfolge).map((id) => UI.erfolg(id)).filter(Boolean);
    return '<p class="pf-hilfe">' + esc(t().vitrineHilfe) + '</p><div class="pf-wahl">' + frei.map((e) => {
      const an = (vm.vitrine || []).includes(e.id);
      const sp = e.spiel ? UI.spiel(e.spiel) : null;
      return '<button type="button" class="pf-wahl__knopf" data-pf-vitrine-wahl="' + esc(e.id) + '" aria-pressed="' + an + '" title="' + esc(lokal(e.text)) + '">' + UI.erfolgSymbol(e) + "<span>" + esc((sp ? sp.name + ": " : "") + lokal(e.titel || e.name)) + "</span></button>";
    }).join("") + "</div>";
  }

  // Erfolge eines Spiels, sortiert: freigeschaltete zuerst (neueste oben), dann nach Fortschritt.
  function erfolgeVon(vm, spielId) {
    const sek = vm.spielzeit ? ((vm.spielzeit.spiele.find((s) => s.id === spielId) || {}).sek || 0) : 0;
    return K.erfolge.filter((e) => e.spiel === spielId).map((e, i) => {
      const am = vm.erfolge[e.id] || null;
      const anteil = am ? 1 : vm.spielzeit && e.art === "spielzeit" ? Math.min(1, sek / e.sekunden) : 0;
      return { e, am, anteil, i };
    }).sort((a, b) => (b.am ? 1 : 0) - (a.am ? 1 : 0) || String(b.am || "").localeCompare(String(a.am || "")) || b.anteil - a.anteil || a.i - b.i);
  }

  // Spiele mit Spielzeit und Erfolgen, wie "Letzte Aktivitaeten" bei Steam. Jede Zeile
  // klappt die Erfolge dieses Spiels auf; am eigenen Profil fuehrt ein Link in die Bibliothek.
  function spieleHtml(vm) {
    const zeiten = new Map((vm.spielzeit ? vm.spielzeit.spiele : []).map((s) => [s.id, s]));
    const mitErfolg = new Set(Object.keys(vm.erfolge).map((id) => (UI.erfolg(id) || {}).spiel).filter(Boolean));
    const ids = [...new Set([...zeiten.keys(), ...mitErfolg])].filter((id) => UI.spiel(id) && ((zeiten.get(id) || {}).sek > 0 || mitErfolg.has(id)));
    ids.sort((a, b) => String((zeiten.get(b) || {}).zuletzt || "").localeCompare(String((zeiten.get(a) || {}).zuletzt || "")) || ((zeiten.get(b) || {}).sek || 0) - ((zeiten.get(a) || {}).sek || 0));
    const zeilen = ids.map((id) => {
      const sp = UI.spiel(id);
      const z = zeiten.get(id);
      const liste = erfolgeVon(vm, id);
      const frei = liste.filter((x) => x.am);
      const offen = seite.offen.has(id);
      return '<details class="pf-spiel" data-pf-gruppe="' + esc(id) + '"' + (offen ? " open" : "") + "><summary>" +
        '<img src="' + esc(sp.bild) + '" alt="" loading="lazy">' +
        '<span class="pf-spiel__text"><strong>' + esc(sp.name) + "</strong><small>" +
          esc([z && z.sek ? t().aufgezeichnet(zeitText(z.sek)) : "", z && z.zuletzt ? t().zuletzt(datumTag(z.zuletzt)) : ""].filter(Boolean).join(" · ")) + "</small></span>" +
        '<span class="pf-spiel__erfolge"><small>' + esc(t().erfolgFortschritt(frei.length, liste.length)) + '</small><span class="pf-balken"><span style="width:' + (liste.length ? Math.round((frei.length / liste.length) * 100) : 0) + '%"></span></span>' +
          '<span class="pf-spiel__symbole">' + frei.slice(0, 6).map((x) => UI.erfolgSymbol(x.e)).join("") + "</span></span>" +
      "</summary>" +
      '<ul class="pf-erfolge">' + liste.map((x) => erfolgZeile(vm, x)).join("") + "</ul>" +
      (vm.eigenes ? '<p class="pf-links"><a href="/library/' + esc(id) + '" data-link>' + esc(t().inBibliothek) + '</a><a href="/games/' + esc(id) + '/spielen" data-link>' + esc(t().spielen) + "</a></p>" : '<p class="pf-links"><a href="/games/' + esc(id) + '" data-link>' + esc(t().shopSeite) + "</a></p>") +
      "</details>";
    }).join("");
    return '<section class="pf-kasten"><div class="pf-kasten__kopf"><h2>' + esc(t().spieleTitel) + "</h2></div>" +
      (zeilen || '<p class="pf-hilfe">' + esc(t().spieleLeer) + "</p>") + "</section>";
  }

  function erfolgZeile(vm, x) {
    const e = x.e;
    let rechts;
    if (x.am) rechts = "<small>" + esc(datumTag(x.am)) + "</small>";
    else if (vm.eigenes && x.anteil > 0) rechts = '<span class="pf-erfolg__fortschritt"><span class="pf-balken"><span style="width:' + Math.round(x.anteil * 100) + '%"></span></span><small>' + esc(t().fortschritt(zeitText(Math.round(x.anteil * e.sekunden)), zeitText(e.sekunden))) + "</small></span>";
    else rechts = "<small>" + esc(t().gesperrt) + "</small>";
    return '<li class="pf-erfolg' + (x.am ? " ist-frei" : "") + '">' + UI.erfolgSymbol(e, !x.am) +
      '<div class="pf-erfolg__text"><strong>' + esc(lokal(e.titel || e.name)) + "</strong><span>" + esc(lokal(e.text)) + "</span></div>" +
      '<div class="pf-erfolg__rechts">' + rechts + '<span class="pf-erfolg__perlen">' + UI.perleHtml() + e.perlen + "</span></div></li>";
  }

  function grundText(g) {
    const [art, rest] = String(g.grund).split(":");
    const f = t().grund[art];
    if (!f) return g.grund;
    if (typeof f === "string") return f;
    if (art === "spielzeit" || art === "bewertung") return f((UI.spiel(rest) || {}).name || rest);
    if (art === "erfolg") { const e = UI.erfolg(String(g.grund).slice(7)); return f(e ? lokal(e.name) : rest); }
    if (art === "kauf") return f(lokal((UI.item(rest) || {}).name) || rest);
    return f(rest);
  }

  function verlaufHtml(vm) {
    const zeilen = (vm.verlauf || []).slice(0, 10).map((g) =>
      "<li><span>" + esc(grundText(g)) + '</span><b class="' + (g.perlen < 0 ? "pf-minus" : "pf-plus") + '">' + (g.perlen > 0 ? "+" : "") + g.perlen + "</b></li>").join("");
    return '<section class="pf-kasten"><h2>' + esc(t().verlauf) + "</h2>" +
      (zeilen ? '<ul class="pf-verlauf">' + zeilen + "</ul>" : '<p class="pf-hilfe">' + esc(t().verlaufLeer) + "</p>") + "</section>";
  }

  function besitzt(vm, it) {
    return !!it.standard || vm.inventar.includes(it.id) || (!!it.erfolg && !!vm.erfolge[it.erfolg]);
  }

  function anpassenHtml(vm) {
    const slots = ["avatar", "rahmen", "banner", "name", "titel", "akzent"];
    const eigene = K.items.filter((i) => i.slot === seite.slot && besitzt(vm, i));
    return '<section class="pf-kasten pf-panel"><div class="pf-kasten__kopf"><h2>' + esc(t().anpassenTitel) + '</h2><a class="pf-link" href="/pearls" data-link>' + esc(t().shop) + "</a></div>" +
      '<div class="pf-reiter" role="tablist">' + slots.map((s) => '<button type="button" role="tab" data-pf-slot="' + s + '" aria-selected="' + (seite.slot === s) + '">' + esc(t().slots[s]) + "</button>").join("") + "</div>" +
      '<div class="pf-items">' + eigene.map((i) => {
        const an = vm.ausruestung[i.slot] === i.id;
        return '<button type="button" class="pf-item' + (an ? " ist-an" : "") + '" data-pf-tragen="' + esc(i.id) + '" aria-pressed="' + an + '">' +
          UI.itemVorschau(i, vm.ausruestung, vm.name) + '<span class="pf-item__name">' + esc(lokal(i.name)) + '</span><small class="pf-item__art pf-selten--' + esc(i.selten) + '">' + esc(an ? t().getragen : lokal(UI.SELTEN[i.selten])) + "</small></button>";
      }).join("") + "</div></section>";
  }

  function einstellungenHtml(vm) {
    return '<section class="pf-kasten pf-panel"><div class="pf-kasten__kopf"><h2>' + esc(t().einstellungenTitel) + "</h2></div>" +
      '<label class="pf-schalter"><input type="checkbox" data-pf-sichtbar' + (vm.sichtbar ? " checked" : "") + '><span><strong>' + esc(t().sichtbar) + "</strong><small>" + esc(t().sichtbarHilfe) + esc(vm.name) + "</small></span></label>" +
      '<label class="pf-schalter"><input type="checkbox" data-pf-zeitzeigen' + (vm.spielzeitZeigen ? " checked" : "") + (vm.sichtbar ? "" : " disabled") + '><span><strong>' + esc(t().spielzeitZeigen) + "</strong><small>" + esc(t().spielzeitHilfe) + "</small></span></label>" +
      '<p class="pf-links pf-links--knoepfe"><a class="pf-knopf" href="/api/konto/daten" download="miwale-konto.json">' + esc(t().daten) + '</a><a class="pf-knopf" href="/account" data-link>' + esc(t().konto) + '</a><a class="pf-knopf" href="/privacy" data-link>' + esc(t().datenschutz) + "</a></p>" +
      '<p class="pf-meldung" role="status">' + esc(seite.meldung) + "</p></section>";
  }

  function zeichnen() {
    const vm = seite.vm;
    if (!seite.el || !vm) return;
    const scroll = window.scrollY;
    seite.el.style.setProperty("--pf-akzent", UI.akzent(vm.ausruestung));
    seite.el.innerHTML = '<div class="pf-profil">' + koepfeHtml(vm) +
      (vm.eigenes && seite.anpassen ? anpassenHtml(vm) : "") + (vm.eigenes && seite.einstellungen ? einstellungenHtml(vm) : "") +
      '<div class="pf-spalten"><div class="pf-hauptspalte">' + vitrineHtml(vm) + spieleHtml(vm) + "</div>" + seitenleisteHtml(vm) + "</div></div>";
    window.scrollTo(0, scroll);
  }

  // ---- Ereignisse ------------------------------------------------------------------------
  async function speichern(pfad, koerper) {
    const r = await UI.senden(pfad, koerper).catch(() => null);
    seite.meldung = r && r.status === 200 ? t().gespeichert : t().fehler;
    return r && r.status === 200 ? r.daten : null;
  }

  async function klick(e) {
    const z = e.target.closest("[data-pf-anpassen],[data-pf-einstellungen],[data-pf-slot],[data-pf-tragen],[data-pf-filter],[data-pf-vitrine],[data-pf-vitrine-wahl]");
    if (!z || !seite.vm) return;
    const d = z.dataset;
    const vm = seite.vm;
    if ("pfAnpassen" in d) { seite.anpassen = !seite.anpassen; if (seite.anpassen) seite.einstellungen = false; return zeichnen(); }
    if ("pfEinstellungen" in d) { seite.einstellungen = !seite.einstellungen; if (seite.einstellungen) seite.anpassen = false; seite.meldung = ""; return zeichnen(); }
    if (d.pfSlot) { seite.slot = d.pfSlot; return zeichnen(); }
    if (d.pfFilter) { seite.filter = d.pfFilter; return zeichnen(); }
    if ("pfVitrine" in d) { seite.vitrineBearbeiten = !seite.vitrineBearbeiten; return zeichnen(); }
    if (d.pfTragen) {
      const it = UI.item(d.pfTragen);
      if (!it || vm.ausruestung[it.slot] === it.id) return;
      const alt = vm.ausruestung[it.slot];
      vm.ausruestung = { ...vm.ausruestung, [it.slot]: it.id };
      zeichnen();
      const r = await UI.senden("ausruesten", { slot: it.slot, item: it.id }).catch(() => null);
      if (!r || r.status !== 200) { vm.ausruestung = { ...vm.ausruestung, [it.slot]: alt }; zeichnen(); return; }
      UI.uebernehmen(r.daten);
      return;
    }
    if (d.pfVitrineWahl !== undefined || d.pfVitrineWahl) {
      const id = d.pfVitrineWahl;
      const liste = (vm.vitrine || []).slice();
      const i = liste.indexOf(id);
      if (i >= 0) liste.splice(i, 1); else if (liste.length < 3) liste.push(id); else return;
      const r = await speichern("einstellungen", { vitrine: liste });
      if (r) { vm.vitrine = r.vitrine; const stand = UI.stand(); if (stand) stand.vitrine = r.vitrine; }
      zeichnen();
    }
  }

  async function aendern(e) {
    const z = e.target;
    const vm = seite.vm;
    if (!vm || !vm.eigenes) return;
    if (z.matches("[data-pf-sichtbar]")) {
      const r = await speichern("einstellungen", { sichtbar: z.checked });
      if (r) { vm.sichtbar = r.sichtbar; vm.versteckt = !r.sichtbar; const s = UI.stand(); if (s) s.sichtbar = r.sichtbar; } else z.checked = !z.checked;
      zeichnen();
    } else if (z.matches("[data-pf-zeitzeigen]")) {
      const r = await speichern("einstellungen", { spielzeitZeigen: z.checked });
      if (r) { vm.spielzeitZeigen = r.spielzeitZeigen; const s = UI.stand(); if (s) s.spielzeitZeigen = r.spielzeitZeigen; } else z.checked = !z.checked;
      zeichnen();
    }
  }

  // Der Chip in der Kopfzeile und die Seite bleiben im Gleichschritt: Perlen und
  // Level aendern sich, waehrend man hier ist (Herzschlaege, Hinweise).
  window.addEventListener("miwale-profil", () => {
    const vm = seite.vm;
    const stand = UI.stand();
    if (!vm || !vm.eigenes || !stand || !seite.el || !seite.el.isConnected) return;
    Object.assign(vm, { perlen: stand.perlen, ep: stand.ep, level: stand.level, levelAb: stand.levelAb, naechstesLevelAb: stand.naechstesLevelAb, erfolge: stand.erfolge, verlauf: stand.verlauf, inventar: stand.inventar, inventarAnzahl: stand.inventar.length });
    if (document.activeElement && seite.el.contains(document.activeElement) && /INPUT|BUTTON/.test(document.activeElement.tagName)) return;
    zeichnen();
  });

  const S = (window.MIWALE_PROFIL_SEITEN = window.MIWALE_PROFIL_SEITEN || {});
  S.profil = einbauen;
  S.titel = (sprache, name) => (name ? TEXTE[sprache].titel(name) : TEXTE[sprache].titelEigen);
})();
