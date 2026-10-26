// Perlen-Shop (/pearls): Avatare, Rahmen, Banner, Namensstile, Titel und
// Akzentfarben fuer das Profil, bezahlt mit Perlen, die man beim Spielen und
// Vorbeischauen sammelt. Nur Optik -- nichts davon macht ein Spiel leichter, und
// Geld spielt keine Rolle. Gekauft und geprueft wird auf dem Server (server/profil.mjs).
(() => {
  "use strict";

  const UI = window.MIWALE_PROFIL_UI;
  if (!UI) return;
  const { esc, lokal } = UI;
  const K = UI.katalog;
  const ID = () => window.MIWALE_IDENTITAET;

  const TEXTE = {
    en: {
      titel: "Pearl Shop — miwale games", ueberschrift: "Pearl Shop",
      hilfe: "Dress up your profile. Everything here is cosmetic and paid for with pearls you earn by playing.",
      anmelden: "Sign in to earn pearls and buy things.", anmeldenKnopf: "Sign in",
      bald: "Pearls and the shop open as soon as accounts go live. Have a look around already.",
      guthaben: "Your pearls", verdienenTitel: "How to earn pearls",
      verdienen: (R) => [
        "Play: 1 pearl per " + R.perleProSekunden / 60 + " minutes, up to " + R.tagesPerlenSpielzeit + " a day",
        "Visit every day: " + R.besuchPerlen + " pearls, plus a bonus for a streak (up to +" + R.serieBonusMax + ")",
        "Write a review: " + R.bewertungPerlen + " pearls per game",
        "Send a game request: " + R.ideePerlen + " pearls (up to " + R.ideenProTag + " a day)",
        "Unlock achievements and level up"
      ],
      heute: (a, b) => a + " of " + b + " pearls from playtime today",
      slots: { avatar: "Avatars", rahmen: "Frames", banner: "Banners", name: "Name styles", titel: "Titles", akzent: "Accents" },
      zeigen: "Show", filter: { alle: "All", neu: "Not owned yet", besitz: "Owned" },
      kaufen: "Buy", bestaetigen: "Confirm", tragen: "Wear", getragen: "Equipped", gekauft: "Owned",
      zuWenig: (n) => "Need " + n + " more", gesperrtSpiel: (s, min, hat) => "Play " + s + " for " + min + " min (you have " + hat + ")", gesperrtErfolg: (n) => "Unlock the achievement “" + n + "”",
      gekauftMeldung: (n) => n + " is yours now.", fehler: "That didn't work. Please try again.", vorschau: "Your look",
      seltenheit: { gewoehnlich: "Common", selten: "Rare", episch: "Epic", legendaer: "Legendary" }
    },
    de: {
      titel: "Perlen-Shop — miwale games", ueberschrift: "Perlen-Shop",
      hilfe: "Mach dein Profil schick. Alles hier ist nur Optik und wird mit Perlen bezahlt, die du beim Spielen sammelst.",
      anmelden: "Melde dich an, um Perlen zu verdienen und einzukaufen.", anmeldenKnopf: "Anmelden",
      bald: "Perlen und der Shop starten, sobald Konten freigeschaltet sind. Schau dich schon mal um.",
      guthaben: "Deine Perlen", verdienenTitel: "So verdienst du Perlen",
      verdienen: (R) => [
        "Spielen: 1 Perle je " + R.perleProSekunden / 60 + " Minuten, höchstens " + R.tagesPerlenSpielzeit + " am Tag",
        "Jeden Tag vorbeischauen: " + R.besuchPerlen + " Perlen, dazu ein Bonus für eine Serie (bis +" + R.serieBonusMax + ")",
        "Bewertung schreiben: " + R.bewertungPerlen + " Perlen je Spiel",
        "Game Request senden: " + R.ideePerlen + " Perlen (bis zu " + R.ideenProTag + " am Tag)",
        "Erfolge freischalten und Level aufsteigen"
      ],
      heute: (a, b) => a + " von " + b + " Perlen aus Spielzeit heute",
      slots: { avatar: "Avatare", rahmen: "Rahmen", banner: "Banner", name: "Namensstile", titel: "Titel", akzent: "Akzente" },
      zeigen: "Zeigen", filter: { alle: "Alle", neu: "Noch nicht gekauft", besitz: "Besitz" },
      kaufen: "Kaufen", bestaetigen: "Bestätigen", tragen: "Tragen", getragen: "Getragen", gekauft: "Besitz",
      zuWenig: (n) => "Es fehlen " + n, gesperrtSpiel: (s, min, hat) => s + " " + min + " Min. spielen (du hast " + hat + ")", gesperrtErfolg: (n) => "Schalte den Erfolg „" + n + "“ frei",
      gekauftMeldung: (n) => n + " gehört jetzt dir.", fehler: "Das hat nicht geklappt. Bitte versuch es noch einmal.", vorschau: "Dein Look",
      seltenheit: { gewoehnlich: "Gewöhnlich", selten: "Selten", episch: "Episch", legendaer: "Legendär" }
    }
  };

  const seite = { el: null, sprache: "en", slot: "avatar", filter: "alle", bestaetigen: null, meldung: "" };
  const t = () => TEXTE[seite.sprache];
  let bestaetigenTimer = null;

  function besitzt(p, it) {
    return !!it.standard || (p && p.inventar.includes(it.id)) || (!!it.erfolg && !!(p && p.erfolge[it.erfolg]));
  }

  function aktionHtml(p, it) {
    if (!p) return it.preis ? '<span class="pf-item__preis">' + UI.perleHtml() + it.preis + "</span>" : "";
    const an = p.ausruestung[it.slot] === it.id;
    if (besitzt(p, it)) {
      return an ? '<span class="pf-item__getragen">' + esc(t().getragen) + "</span>"
        : '<button type="button" class="pf-knopf" data-pf-tragen="' + esc(it.id) + '">' + esc(t().tragen) + "</button>";
    }
    if (it.erfolg) {
      const e = UI.erfolg(it.erfolg);
      return '<span class="pf-item__sperre">' + esc(t().gesperrtErfolg(e ? lokal(e.name) : it.erfolg)) + "</span>";
    }
    if (it.braucht) {
      const hat = (p.spiele[it.braucht.spiel] || {}).sek || 0;
      if (hat < it.braucht.sekunden) {
        const sp = UI.spiel(it.braucht.spiel);
        return '<span class="pf-item__sperre">' + esc(t().gesperrtSpiel(sp ? sp.name : it.braucht.spiel, Math.round(it.braucht.sekunden / 60), Math.floor(hat / 60))) + "</span>";
      }
    }
    const fehlt = it.preis - p.perlen;
    if (fehlt > 0) return '<small class="pf-item__fehlt">' + esc(t().zuWenig(fehlt)) + '</small><button type="button" class="pf-knopf" disabled>' + UI.perleHtml() + it.preis + "</button>";
    const bestaetigt = seite.bestaetigen === it.id;
    return '<span class="pf-item__preis">' + UI.perleHtml() + it.preis + '</span><button type="button" class="pf-knopf' + (bestaetigt ? " pf-knopf--bestaetigen" : "") + '" data-pf-kaufen="' + esc(it.id) + '">' + esc(bestaetigt ? t().bestaetigen : t().kaufen) + "</button>";
  }

  function itemKarte(p, it) {
    const ausr = p ? p.ausruestung : null;
    const besitz = besitzt(p, it);
    return '<li class="pf-item pf-item--shop pf-selten--' + esc(it.selten) + (besitz ? " pf-item--besitz" : "") + '">' +
      UI.itemVorschau(it, ausr, (ID().konto() || {}).name) +
      '<span class="pf-item__name">' + esc(lokal(it.name)) + '</span><small class="pf-item__art pf-selten--' + esc(it.selten) + '">' + esc(t().seltenheit[it.selten]) + "</small>" +
      '<div class="pf-item__aktion">' + aktionHtml(p, it) + "</div></li>";
  }

  function kopfHtml(p) {
    const R = K.regeln;
    const heute = p && p.heute ? p.heute.perlen : 0;
    return '<header class="pf-shopkopf"><div class="pf-shopkopf__text"><h1 class="sp-ueberschrift">' + esc(t().ueberschrift) + "</h1><p>" + esc(t().hilfe) + "</p></div>" +
      (p ? '<div class="pf-guthabenkarte"><small>' + esc(t().guthaben) + "</small><strong>" + UI.perleHtml() + p.perlen + "</strong>" +
        '<span class="pf-guthabenkarte__heute">' + esc(t().heute(heute, R.tagesPerlenSpielzeit)) + "</span>" +
        '<div class="pf-fortschritt"><span style="width:' + Math.min(100, Math.round((heute / R.tagesPerlenSpielzeit) * 100)) + '%"></span></div></div>'
        : ID().kontenAktiv() ? '<div class="pf-anmelden pf-anmelden--leise"><p>' + esc(t().anmelden) + '</p><a class="sp-knopf sp-knopf--play" href="/account?zurueck=%2Fpearls" data-anmelden>' + esc(t().anmeldenKnopf) + "</a></div>"
        : '<div class="pf-anmelden pf-anmelden--leise"><p>' + esc(t().bald) + "</p></div>") +
    "</header>" +
    '<details class="pf-verdienen"><summary>' + esc(t().verdienenTitel) + "</summary><ul>" + t().verdienen(R).map((z) => "<li>" + esc(z) + "</li>").join("") + "</ul></details>";
  }

  function vorschauHtml(p) {
    if (!p) return "";
    const k = ID().konto();
    const b = UI.bannerAttr(p.ausruestung);
    return '<aside class="pf-meinlook" aria-label="' + esc(t().vorschau) + '"><div class="' + b.klasse + '" style="' + esc(b.style) + '"></div>' +
      '<div class="pf-meinlook__innen">' + UI.avatarHtml(p.ausruestung, "m", k && k.name) + "<div>" + UI.namenHtml(k ? k.name : "", p.ausruestung) + (UI.titelText(p.ausruestung) ? '<p class="pf-titel">' + esc(UI.titelText(p.ausruestung)) + "</p>" : "") + "</div></div></aside>";
  }

  function zeichnen() {
    const el = seite.el;
    if (!el || !el.isConnected) return;
    const p = ID().konto() ? UI.stand() : null;
    const slots = ["avatar", "rahmen", "banner", "name", "titel", "akzent"];
    let liste = K.items.filter((i) => i.slot === seite.slot && !i.standard);
    if (seite.filter === "neu") liste = liste.filter((i) => !besitzt(p, i));
    if (seite.filter === "besitz") liste = liste.filter((i) => besitzt(p, i));
    // Erst das, was man kaufen kann, nach Preis; Erfolgs-Gegenstaende am Ende.
    liste.sort((a, b) => (a.erfolg ? 1 : 0) - (b.erfolg ? 1 : 0) || (a.preis || 0) - (b.preis || 0));
    const scroll = window.scrollY;
    if (p) el.style.setProperty("--pf-akzent", UI.akzent(p.ausruestung));
    el.innerHTML = '<div class="pf-shop">' + kopfHtml(p) + vorschauHtml(p) +
      '<div class="pf-shopleiste"><div class="pf-reiter" role="tablist">' + slots.map((s) => '<button type="button" role="tab" data-pf-slot="' + s + '" aria-selected="' + (seite.slot === s) + '">' + esc(t().slots[s]) + "</button>").join("") + "</div>" +
      '<select data-pf-filter aria-label="' + esc(t().zeigen) + '">' + ["alle", "neu", "besitz"].map((f) => '<option value="' + f + '"' + (seite.filter === f ? " selected" : "") + ">" + esc(t().filter[f]) + "</option>").join("") + "</select></div>" +
      '<p class="pf-meldung" role="status">' + esc(seite.meldung) + "</p>" +
      '<ul class="pf-items pf-items--shop">' + liste.map((i) => itemKarte(p, i)).join("") + "</ul></div>";
    window.scrollTo(0, scroll);
  }

  async function klick(e) {
    const z = e.target.closest("[data-pf-slot],[data-pf-kaufen],[data-pf-tragen]");
    if (!z) return;
    const d = z.dataset;
    if (d.pfSlot) { seite.slot = d.pfSlot; seite.bestaetigen = null; return zeichnen(); }
    const p = UI.stand();
    if (!p) return;
    if (d.pfKaufen) {
      // Erst anklicken, dann bestaetigen: ein versehentlicher Klick kostet nichts.
      if (seite.bestaetigen !== d.pfKaufen) {
        seite.bestaetigen = d.pfKaufen;
        clearTimeout(bestaetigenTimer);
        bestaetigenTimer = setTimeout(() => { seite.bestaetigen = null; zeichnen(); }, 4000);
        return zeichnen();
      }
      clearTimeout(bestaetigenTimer);
      seite.bestaetigen = null;
      const it = UI.item(d.pfKaufen);
      const r = await UI.senden("kaufen", { item: d.pfKaufen }).catch(() => null);
      if (r && r.status === 200) {
        UI.uebernehmen(r.daten);
        // Gleich tragen ist das, was man meistens will -- aber nur auf Wunsch.
        seite.meldung = t().gekauftMeldung(it ? lokal(it.name) : "");
      } else {
        seite.meldung = t().fehler;
        await UI.laden();
      }
      return zeichnen();
    }
    if (d.pfTragen) {
      const it = UI.item(d.pfTragen);
      if (!it) return;
      const r = await UI.senden("ausruesten", { slot: it.slot, item: it.id }).catch(() => null);
      if (r && r.status === 200) UI.uebernehmen(r.daten); else seite.meldung = t().fehler;
      zeichnen();
    }
  }

  async function einbauen(el, sprache) {
    Object.assign(seite, { el, sprache, slot: "avatar", filter: "alle", bestaetigen: null, meldung: "" });
    document.title = t().titel;
    el.addEventListener("click", klick);
    el.addEventListener("change", (e) => { if (e.target.matches("[data-pf-filter]")) { seite.filter = e.target.value; zeichnen(); } });
    zeichnen();
    await ID().bereit();
    if (ID().konto()) await UI.laden();
    zeichnen();
  }

  window.addEventListener("miwale-profil", () => {
    if (!seite.el || !seite.el.isConnected || !seite.el.querySelector(".pf-shop")) return;
    if (seite.bestaetigen) return;
    zeichnen();
  });

  const S = (window.MIWALE_PROFIL_SEITEN = window.MIWALE_PROFIL_SEITEN || {});
  S.perlen = einbauen;
  S.perlenTitel = (sprache) => TEXTE[sprache].titel;
})();
