// Bewertungen auf der Spielseite (miwale.com/games/<id>), wie bei Steam:
// Daumen hoch oder runter, dazu freiwillig ein oeffentlicher Satz und ein
// privates Feedback, das nur die Verwaltung (/admin/) sieht.
//
// Ohne Account und auf Vertrauensbasis: jedes Geraet bekommt beim ersten Besuch
// eine zufaellige Kennung, pro Spiel zaehlt eine Stimme je Kennung. Der Dienst
// dahinter ist server/bewertungen.mjs.
//
// shop.js baut die Spielseite als HTML-Text und ruft danach
// MIWALE_BEWERTUNGEN.einbauen(element, spiel, sprache) auf. Alles Weitere
// passiert hier, damit die Spielseite selbst davon nichts wissen muss.
(() => {
  "use strict";

  const API = "/api/bewertungen/";
  const GERAET_SCHLUESSEL = "miwale-geraet";
  const GERAET_RE = /^[a-zA-Z0-9-]{16,64}$/;

  const TEXTE = {
    en: {
      titel: (name) => "Reviews for " + name,
      laedt: "Loading reviews…",
      aus: "Reviews are unavailable right now. Please try again later.",
      nochKeine: "No reviews yet. Be the first!",
      frage: "Would you recommend this game?",
      hoch: "Yes",
      runter: "No",
      textLabel: "Your review",
      textHilfe: "Optional and public, shown without your name. Up to 500 characters.",
      textPlatzhalter: "What did you like, what didn't work for you?",
      privatLabel: "Private feedback for the developer",
      privatHilfe: "Optional. Only the developer sees this.",
      privatPlatzhalter: "Bugs, ideas, anything you want to tell me directly",
      senden: "Post review",
      aendern: "Update review",
      sendet: "Sending…",
      loeschen: "Delete my review",
      loeschenFrage: "Delete your review for this game?",
      hinweis: "One review per game on this device. You can change or delete it anytime.",
      listeTitel: "Player reviews",
      listeLeer: "No written reviews yet.",
      entwickler: "Developer response",
      du: "Your review",
      empfohlen: "Recommended",
      nichtEmpfohlen: "Not recommended",
      geaendert: "edited",
      urteile: ["Overwhelmingly negative", "Mostly negative", "Mixed", "Mostly positive", "Very positive"],
      zahl: (prozent, n) => prozent + "% of " + n + (n === 1 ? " review is" : " reviews are") + " positive",
      fehltDaumen: "Pick Yes or No first.",
      danke: "Thanks! Your review is live.",
      geloescht: "Your review was deleted.",
      gesperrt: (w) => "Please rephrase: \"" + w.join("\", \"") + "\" isn't allowed here.",
      zuSchnell: "Too many attempts. Please wait a few minutes.",
      fehler: "That didn't work. Please try again later."
    },
    de: {
      titel: (name) => "Bewertungen zu " + name,
      laedt: "Bewertungen werden geladen …",
      aus: "Bewertungen sind gerade nicht erreichbar. Bitte später noch einmal versuchen.",
      nochKeine: "Noch keine Bewertungen. Sei die erste Stimme!",
      frage: "Würdest du das Spiel empfehlen?",
      hoch: "Ja",
      runter: "Nein",
      textLabel: "Deine Bewertung",
      textHilfe: "Freiwillig und öffentlich, erscheint ohne Namen. Höchstens 500 Zeichen.",
      textPlatzhalter: "Was hat dir gefallen, was nicht?",
      privatLabel: "Privates Feedback an den Entwickler",
      privatHilfe: "Freiwillig. Das sieht nur der Entwickler.",
      privatPlatzhalter: "Fehler, Ideen, alles, was du mir direkt sagen willst",
      senden: "Bewertung abschicken",
      aendern: "Bewertung ändern",
      sendet: "Wird gesendet …",
      loeschen: "Meine Bewertung löschen",
      loeschenFrage: "Deine Bewertung für dieses Spiel löschen?",
      hinweis: "Eine Bewertung pro Spiel auf diesem Gerät. Du kannst sie jederzeit ändern oder löschen.",
      listeTitel: "Bewertungen von Spielern",
      listeLeer: "Noch keine geschriebenen Bewertungen.",
      entwickler: "Antwort vom Entwickler",
      du: "Deine Bewertung",
      empfohlen: "Empfohlen",
      nichtEmpfohlen: "Nicht empfohlen",
      geaendert: "geändert",
      urteile: ["Äußerst negativ", "Größtenteils negativ", "Ausgeglichen", "Größtenteils positiv", "Sehr positiv"],
      zahl: (prozent, n) => prozent + " % von " + n + (n === 1 ? " Bewertung ist" : " Bewertungen sind") + " positiv",
      fehltDaumen: "Wähle zuerst Ja oder Nein.",
      danke: "Danke! Deine Bewertung ist online.",
      geloescht: "Deine Bewertung wurde gelöscht.",
      gesperrt: (w) => "Bitte anders formulieren: „" + w.join("“, „") + "“ ist hier nicht erlaubt.",
      zuSchnell: "Zu viele Versuche. Bitte ein paar Minuten warten.",
      fehler: "Das hat nicht geklappt. Bitte später noch einmal versuchen."
    }
  };

  const ICON_HOCH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>';
  const ICON_RUNTER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/></svg>';

  // Letzte Antwort je Spiel. Beim Sprachwechsel baut shop.js die Seite neu;
  // so steht der Bereich sofort wieder da, statt kurz "wird geladen" zu zeigen.
  const zwischenspeicher = new Map();

  function esc(x) {
    return String(x == null ? "" : x).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  function geraetKennung() {
    try {
      let id = localStorage.getItem(GERAET_SCHLUESSEL);
      if (!id || !GERAET_RE.test(id)) {
        id = crypto.randomUUID ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
        localStorage.setItem(GERAET_SCHLUESSEL, id);
      }
      return id;
    } catch (e) {
      // Speicher gesperrt: fuer diesen Besuch eine Kennung im Speicher halten.
      if (!geraetKennung.fluechtig) geraetKennung.fluechtig = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      return geraetKennung.fluechtig;
    }
  }

  // Stufen wie bei Steam. Unter fuenf Stimmen gibt es kein Urteil, nur die Zahl:
  // zwei Stimmen sind kein "Sehr positiv".
  function urteil(hoch, gesamt, t) {
    const prozent = Math.round((hoch / gesamt) * 100);
    const stufe = prozent >= 80 ? 4 : prozent >= 70 ? 3 : prozent >= 40 ? 2 : prozent >= 20 ? 1 : 0;
    return { prozent, stufe: gesamt < 5 ? -1 : stufe, text: gesamt < 5 ? "" : t.urteile[stufe] };
  }

  function datum(iso, sprache) {
    try { return new Intl.DateTimeFormat(sprache, { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)); }
    catch (e) { return ""; }
  }

  function einbauen(el, sp, sprache) {
    if (!el || !sp) return;
    const t = TEXTE[sprache] || TEXTE.en;
    const z = { daten: zwischenspeicher.get(sp.id) || null, fehler: false, daumen: null, sendet: false, meldung: null };
    if (z.daten) z.daumen = z.daten.eigene ? z.daten.eigene.daumen : null;
    // Wechselt die Seite, bevor eine Antwort da ist, darf sie nichts mehr zeichnen.
    const aktiv = () => el.isConnected;

    function zeichnen(formNeu) {
      const d = z.daten;
      // Die Textfelder nur neu anlegen, wenn es noetig ist: sonst verlieren sie
      // beim Wechsel des Daumens, was schon getippt war.
      if (formNeu || !el.querySelector("[data-bew-form]")) {
        el.innerHTML =
          '<h2>' + esc(t.titel(sp.name)) + "</h2>" +
          (!d ? '<p class="sp-bew__leer">' + esc(z.fehler ? t.aus : t.laedt) + "</p>" :
          '<div class="sp-bew__kopf" data-bew-kopf></div>' +
          '<div class="sp-bew__form" data-bew-form>' +
            '<p class="sp-bew__frage" id="sp-bew-frage-' + esc(sp.id) + '">' + esc(t.frage) + "</p>" +
            '<div class="sp-bew__daumen" role="group" aria-labelledby="sp-bew-frage-' + esc(sp.id) + '">' +
              '<button type="button" class="sp-bew__knopf sp-bew__knopf--hoch" data-bew-daumen="hoch">' + ICON_HOCH + "<span>" + esc(t.hoch) + "</span></button>" +
              '<button type="button" class="sp-bew__knopf sp-bew__knopf--runter" data-bew-daumen="runter">' + ICON_RUNTER + "<span>" + esc(t.runter) + "</span></button>" +
            "</div>" +
            '<label class="sp-bew__feld"><span class="sp-bew__label">' + esc(t.textLabel) + "</span>" +
              '<textarea data-bew-text maxlength="500" placeholder="' + esc(t.textPlatzhalter) + '">' + esc(d.eigene ? d.eigene.text : "") + "</textarea>" +
              '<span class="sp-bew__hilfe">' + esc(t.textHilfe) + "</span></label>" +
            '<label class="sp-bew__feld"><span class="sp-bew__label">' + esc(t.privatLabel) + "</span>" +
              '<textarea data-bew-privat maxlength="1000" placeholder="' + esc(t.privatPlatzhalter) + '">' + esc(d.eigene ? d.eigene.privat : "") + "</textarea>" +
              '<span class="sp-bew__hilfe">' + esc(t.privatHilfe) + "</span></label>" +
            // Falle fuer Bots: fuer Menschen und Vorleseprogramme unsichtbar.
            '<div class="sp-bew__falle" aria-hidden="true"><label>Website <input type="text" data-bew-falle tabindex="-1" autocomplete="off"></label></div>' +
            '<div class="sp-bew__aktionen">' +
              '<button type="button" class="sp-knopf sp-knopf--play" data-bew-senden></button>' +
              '<button type="button" class="sp-bew__loeschen" data-bew-loeschen>' + esc(t.loeschen) + "</button>" +
            "</div>" +
            '<p class="sp-bew__meldung" data-bew-meldung role="status" aria-live="polite"></p>' +
            '<p class="sp-bew__hilfe">' + esc(t.hinweis) + "</p>" +
          "</div>" +
          '<h3 class="sp-bew__listentitel">' + esc(t.listeTitel) + "</h3>" +
          '<div class="sp-bew__liste" data-bew-liste></div>');
      }
      if (!d) return;

      const gesamt = d.hoch + d.runter;
      const u = gesamt ? urteil(d.hoch, gesamt, t) : null;
      el.querySelector("[data-bew-kopf]").innerHTML = u
        ? (u.text ? '<span class="sp-bew__urteil sp-bew__urteil--' + (u.stufe >= 3 ? "gut" : u.stufe <= 1 ? "schlecht" : "mittel") + '">' + esc(u.text) + "</span>" : "") +
          '<span class="sp-bew__zahl">' + esc(t.zahl(u.prozent, gesamt)) + "</span>" +
          '<span class="sp-bew__balken" role="img" aria-label="' + esc(t.zahl(u.prozent, gesamt)) + '"><span style="width:' + u.prozent + '%"></span></span>'
        : '<span class="sp-bew__zahl">' + esc(t.nochKeine) + "</span>";

      el.querySelectorAll("[data-bew-daumen]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.bewDaumen === z.daumen)));
      const senden = el.querySelector("[data-bew-senden]");
      senden.textContent = z.sendet ? t.sendet : d.eigene ? t.aendern : t.senden;
      senden.disabled = z.sendet;
      el.querySelector("[data-bew-loeschen]").hidden = !d.eigene;
      const meldung = el.querySelector("[data-bew-meldung]");
      meldung.hidden = !z.meldung;
      meldung.textContent = z.meldung ? z.meldung.text : "";
      meldung.classList.toggle("sp-bew__meldung--fehler", !!(z.meldung && z.meldung.fehler));

      el.querySelector("[data-bew-liste]").innerHTML = d.liste.length ? d.liste.map((r) =>
        '<article class="sp-bew__eintrag' + (r.eigene ? " sp-bew__eintrag--eigen" : "") + '">' +
          '<div class="sp-bew__eintragkopf">' +
            '<span class="sp-bew__icon sp-bew__icon--' + r.daumen + '">' + (r.daumen === "hoch" ? ICON_HOCH : ICON_RUNTER) + "</span>" +
            '<span><span class="sp-bew__wer">' + esc(r.daumen === "hoch" ? t.empfohlen : t.nichtEmpfohlen) + "</span>" +
            '<span class="sp-bew__wann">' + (r.eigene ? esc(t.du) + " · " : "") + esc(datum(r.zeit, sprache)) + (r.geaendert ? " · " + esc(t.geaendert) : "") + "</span></span>" +
          "</div>" +
          '<p class="sp-bew__satz">' + esc(r.text) + "</p>" +
          (r.antwort && r.antwort.text ? '<div class="sp-bew__antwort"><span class="sp-bew__antwortwer">' + esc(t.entwickler) + '</span><p class="sp-bew__satz">' + esc(r.antwort.text) + "</p></div>" : "") +
        "</article>").join("")
        : '<p class="sp-bew__leer">' + esc(t.listeLeer) + "</p>";
    }

    function melden(fehler, text) { z.meldung = { fehler, text }; }

    async function rufen(methode, koerper) {
      const res = await fetch(API + encodeURIComponent(sp.id) + (methode === "PUT" ? "" : "?geraet=" + encodeURIComponent(geraetKennung())), {
        method: methode,
        headers: { accept: "application/json", "content-type": "application/json" },
        body: koerper ? JSON.stringify(koerper) : undefined
      });
      const daten = await res.json().catch(() => ({}));
      return { status: res.status, daten };
    }

    el.addEventListener("click", async (e) => {
      const b = e.target.closest("button");
      if (!b || !z.daten) return;

      if (b.dataset.bewDaumen) {
        z.daumen = b.dataset.bewDaumen;
        z.meldung = null;
        zeichnen(false);
        return;
      }

      if ("bewSenden" in b.dataset) {
        if (z.sendet) return;
        if (!z.daumen) { melden(true, t.fehltDaumen); zeichnen(false); return; }
        const wert = (sel) => { const f = el.querySelector(sel); return f ? f.value : ""; };
        z.sendet = true; z.meldung = null; zeichnen(false);
        try {
          const { status, daten } = await rufen("PUT", {
            geraet: geraetKennung(), daumen: z.daumen,
            text: wert("[data-bew-text]"), privat: wert("[data-bew-privat]"), website: wert("[data-bew-falle]")
          });
          if (status === 200) { z.daten = daten; zwischenspeicher.set(sp.id, daten); melden(false, t.danke); }
          else melden(true, status === 422 && daten.woerter ? t.gesperrt(daten.woerter) : status === 429 ? t.zuSchnell : t.fehler);
        } catch (err) { melden(true, t.fehler); }
        z.sendet = false;
        if (aktiv()) zeichnen(false);
        return;
      }

      if ("bewLoeschen" in b.dataset) {
        if (z.sendet || !window.confirm(t.loeschenFrage)) return;
        z.sendet = true; zeichnen(false);
        try {
          const { status, daten } = await rufen("DELETE");
          if (status === 200) {
            z.daten = daten; z.daumen = null; zwischenspeicher.set(sp.id, daten);
            el.querySelectorAll("textarea").forEach((f) => { f.value = ""; });
            melden(false, t.geloescht);
          } else melden(true, t.fehler);
        } catch (err) { melden(true, t.fehler); }
        z.sendet = false;
        if (aktiv()) zeichnen(false);
      }
    });

    zeichnen(true);
    rufen("GET")
      .then(({ status, daten }) => {
        if (status !== 200) throw new Error(status);
        zwischenspeicher.set(sp.id, daten);
        if (!aktiv()) return;
        const warLeer = !z.daten;
        z.daten = daten;
        if (warLeer) z.daumen = daten.eigene ? daten.eigene.daumen : null;
        zeichnen(warLeer);
      })
      .catch(() => {
        if (!aktiv() || z.daten) return;
        z.fehler = true;
        zeichnen(true);
      });
  }

  window.MIWALE_BEWERTUNGEN = { einbauen };
})();
