// Konto auf der Spieleseite: der Knopf oben rechts, die Seite /account und der
// Kasten "Zum Schreiben anmelden", den Bewertungen und Game Requests zeigen.
//
// Anmelden geht nur ueber Discord oder Google; der Server (server/konten.mjs)
// macht den ganzen Ablauf, hier gibt es nur Links dorthin. Wer zum ersten Mal
// kommt, waehlt danach auf /account einen Namen.
//
// Spielen geht immer ohne Konto.
(() => {
  "use strict";

  const ID = () => window.MIWALE_IDENTITAET;
  const NAME_RE = /^[A-Za-z0-9_-]{3,20}$/;

  const TEXTE = {
    en: {
      anmelden: "Sign in",
      konto: "Account",
      seitenTitel: "Your miwale account",
      intro: "You never need an account to play. Sign in to write reviews and send game requests.",
      mit: { discord: "Continue with Discord", google: "Continue with Google", test: "Test sign-in (local only)" },
      keineAnbieter: "Signing in isn't available right now. Please try again later.",
      speichernTitel: "What we store",
      speichern: [
        "The name you pick, and when you signed up.",
        "A scrambled ID from Discord or Google, so we recognise you next time. We can't turn it back into your Discord or Google account.",
        "No email address, no password, no real name."
      ],
      datenschutz: "Privacy policy",
      laedt: "Loading…",
      neuTitel: "Almost done — pick your name",
      neuIntro: "This name appears next to your reviews and game requests.",
      nameLabel: "Name",
      nameHilfe: "3–20 characters: letters, numbers, _ and -.",
      alter: "I'm at least 13 years old and I've read the privacy policy.",
      erstellen: "Create account",
      abbrechen: "Cancel",
      angemeldetAls: "Signed in as",
      ueber: { discord: "via Discord", google: "via Google" },
      seit: (d) => "Member since " + d,
      gesperrt: "This account has been blocked. You can still play, download your data or delete the account, but you can't post anything.",
      nameAendern: "Change name",
      speichern2: "Save",
      abmelden: "Sign out",
      ueberallAbmelden: "Sign out on all devices",
      datenLaden: "Download my data",
      loeschen: "Delete account",
      loeschenFrage: "Delete your account? Your reviews and game requests are deleted too. This can't be undone.",
      geloescht: "Your account and everything that belonged to it has been deleted.",
      abgemeldet: "You're signed out.",
      gespeichert: "Saved.",
      kastenTitel: {
        bewertung: "Sign in to write a review",
        idee: "Sign in to send a game request"
      },
      kastenText: "It takes a few seconds, no email or password needed. Playing never needs an account.",
      fehler: {
        abgebrochen: "Sign-in was cancelled.",
        abgelaufen: "That took too long or came from somewhere else. Please try again.",
        anbieter: "The sign-in service didn't answer properly. Please try again.",
        gesperrt: "This account can't sign in anymore.",
        "zu-schnell": "Too many attempts. Please wait a few minutes.",
        "name-format": "Use 3–20 characters: letters, numbers, _ and -.",
        "name-vergeben": "That name is taken. Try another one.",
        "name-gesperrt": "That name isn't allowed here.",
        alter: "Please confirm the checkbox.",
        "konto-gesperrt": "This account has been blocked.",
        allgemein: "That didn't work. Please try again later."
      }
    },
    de: {
      anmelden: "Anmelden",
      konto: "Konto",
      seitenTitel: "Dein miwale-Konto",
      intro: "Zum Spielen brauchst du nie ein Konto. Mit Konto kannst du Bewertungen schreiben und Game Requests schicken.",
      mit: { discord: "Weiter mit Discord", google: "Weiter mit Google", test: "Test-Anmeldung (nur lokal)" },
      keineAnbieter: "Anmelden geht gerade nicht. Bitte später noch einmal versuchen.",
      speichernTitel: "Was gespeichert wird",
      speichern: [
        "Der Name, den du wählst, und wann du dich angemeldet hast.",
        "Eine verschlüsselte Kennung von Discord oder Google, damit wir dich beim nächsten Mal wiedererkennen. Daraus lässt sich dein Discord- oder Google-Konto nicht zurückrechnen.",
        "Keine E-Mail-Adresse, kein Passwort, kein echter Name."
      ],
      datenschutz: "Datenschutzerklärung",
      laedt: "Wird geladen …",
      neuTitel: "Fast fertig – wähle deinen Namen",
      neuIntro: "Dieser Name steht bei deinen Bewertungen und Game Requests.",
      nameLabel: "Name",
      nameHilfe: "3–20 Zeichen: Buchstaben, Ziffern, _ und -.",
      alter: "Ich bin mindestens 13 Jahre alt und habe die Datenschutzerklärung gelesen.",
      erstellen: "Konto anlegen",
      abbrechen: "Abbrechen",
      angemeldetAls: "Angemeldet als",
      ueber: { discord: "über Discord", google: "über Google" },
      seit: (d) => "Dabei seit " + d,
      gesperrt: "Dieses Konto wurde gesperrt. Spielen, Daten herunterladen und das Konto löschen geht weiter, schreiben nicht.",
      nameAendern: "Namen ändern",
      speichern2: "Speichern",
      abmelden: "Abmelden",
      ueberallAbmelden: "Auf allen Geräten abmelden",
      datenLaden: "Meine Daten herunterladen",
      loeschen: "Konto löschen",
      loeschenFrage: "Konto löschen? Deine Bewertungen und Game Requests werden mit gelöscht. Das lässt sich nicht rückgängig machen.",
      geloescht: "Dein Konto und alles, was dazu gehörte, ist gelöscht.",
      abgemeldet: "Du bist abgemeldet.",
      gespeichert: "Gespeichert.",
      kastenTitel: {
        bewertung: "Zum Schreiben einer Bewertung anmelden",
        idee: "Zum Einreichen eines Game Requests anmelden"
      },
      kastenText: "Dauert ein paar Sekunden, ohne E-Mail und Passwort. Spielen geht immer ohne Konto.",
      fehler: {
        abgebrochen: "Die Anmeldung wurde abgebrochen.",
        abgelaufen: "Das hat zu lange gedauert oder kam von woanders. Bitte noch einmal versuchen.",
        anbieter: "Der Anmeldedienst hat nicht richtig geantwortet. Bitte noch einmal versuchen.",
        gesperrt: "Mit diesem Konto kann man sich nicht mehr anmelden.",
        "zu-schnell": "Zu viele Versuche. Bitte ein paar Minuten warten.",
        "name-format": "3–20 Zeichen: Buchstaben, Ziffern, _ und -.",
        "name-vergeben": "Der Name ist schon vergeben. Probier einen anderen.",
        "name-gesperrt": "Dieser Name ist hier nicht erlaubt.",
        alter: "Bitte das Häkchen setzen.",
        "konto-gesperrt": "Dieses Konto wurde gesperrt.",
        allgemein: "Das hat nicht geklappt. Bitte später noch einmal versuchen."
      }
    }
  };

  const ICON_PERSON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';

  function esc(x) {
    return String(x == null ? "" : x).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }
  const texte = (sprache) => TEXTE[sprache] || TEXTE.en;
  const fehlerText = (t, grund) => t.fehler[grund] || t.fehler.allgemein;

  function datum(iso, sprache) {
    try { return new Intl.DateTimeFormat(sprache, { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso)); }
    catch (e) { return ""; }
  }

  function anbieterKnoepfe(t, zurueck) {
    const liste = ID().stand().anbieter;
    if (!liste.length) return '<p class="sp-konto__hilfe">' + esc(ID().geladen() ? t.keineAnbieter : t.laedt) + "</p>";
    return '<div class="sp-konto__anbieter">' + liste.map((a) =>
      '<a class="sp-konto__mit sp-konto__mit--' + esc(a) + '" href="' + esc(ID().anmeldenAdresse(a, zurueck)) + '">' +
        esc((t.mit[a]) || a) + "</a>").join("") + "</div>";
  }

  // ---- Knopf in der Kopfzeile ----------------------------------------------------
  // Gibt es mehrere Kopfzeilen nacheinander (die Seite baut sich beim Wechsel neu),
  // zeichnet das Ereignis immer die aktuelle.
  let knopfEl = null;
  let knopfSprache = "en";
  function knopfZeichnen() {
    if (!knopfEl || !knopfEl.isConnected) return;
    const t = texte(knopfSprache);
    const konto = ID().konto();
    // Ohne eingerichtete Anmeldung (Uebergang) gibt es nichts anzumelden.
    if (!konto && !ID().kontenAktiv()) { knopfEl.innerHTML = ""; return; }
    knopfEl.innerHTML = '<a class="sp-knopf sp-knopf--glas sp-konto-knopf" href="/account" data-link' +
      (konto ? ' title="' + esc(t.angemeldetAls + " " + konto.name) + '"' : "") + ">" + ICON_PERSON +
      '<span class="sp-konto-knopf__text">' + esc(konto ? konto.name : t.anmelden) + "</span></a>";
  }
  function knopf(el, sprache) {
    knopfEl = el;
    knopfSprache = sprache;
    knopfZeichnen();
  }

  // ---- Kasten "anmelden, um zu schreiben" -------------------------------------------
  function anmeldeKasten(sprache, zweck, zurueck) {
    const t = texte(sprache);
    return '<div class="sp-konto__kasten">' +
      '<p class="sp-konto__kastentitel">' + esc(t.kastenTitel[zweck] || t.anmelden) + "</p>" +
      '<p class="sp-konto__hilfe">' + esc(t.kastenText) + "</p>" +
      anbieterKnoepfe(t, zurueck || location.pathname) +
      "</div>";
  }

  // ---- Seite /account ------------------------------------------------------------------
  const seite = { el: null, sprache: "en", meldung: null };

  function zurueckAusAdresse() {
    const z = new URLSearchParams(location.search).get("zurueck") || "";
    return /^\/(?![\/\\])[A-Za-z0-9\-._~\/]{0,200}$/.test(z) && !z.includes("//") && !z.includes("/.") ? z : "/";
  }

  function meldungHtml() {
    const m = seite.meldung;
    return m ? '<p class="sp-konto__meldung' + (m.fehler ? " sp-konto__meldung--fehler" : "") + '" role="status">' + esc(m.text) + "</p>" : "";
  }

  function speicherHinweis(t) {
    return '<section class="sp-konto__info"><h2 class="sp-ueberschrift sp-ueberschrift--klein">' + esc(t.speichernTitel) + "</h2>" +
      '<ul class="sp-features">' + t.speichern.map((s) => "<li>" + esc(s) + "</li>").join("") + "</ul>" +
      '<p><a href="/privacy" data-link>' + esc(t.datenschutz) + "</a></p></section>";
  }

  function seiteZeichnen() {
    const { el, sprache } = seite;
    if (!el || !el.isConnected) return;
    const t = texte(sprache);
    const s = ID().stand();
    let inhalt;

    if (!ID().geladen()) {
      inhalt = '<p class="sp-bew__leer">' + esc(t.laedt) + "</p>";
    } else if (s.konto) {
      const k = s.konto;
      inhalt =
        '<div class="sp-konto__karte">' +
          '<span class="sp-konto__bild" aria-hidden="true">' + ICON_PERSON + "</span>" +
          '<div><p class="sp-konto__klein">' + esc(t.angemeldetAls) + "</p>" +
          '<p class="sp-konto__name">' + esc(k.name) + "</p>" +
          '<p class="sp-konto__klein">' + esc((t.ueber[k.anbieter] || k.anbieter) + " · " + t.seit(datum(k.erstellt, sprache))) + "</p></div>" +
        "</div>" +
        (k.gesperrt ? '<p class="sp-konto__meldung sp-konto__meldung--fehler">' + esc(t.gesperrt) + "</p>" : "") +
        meldungHtml() +
        (k.gesperrt ? "" :
          '<form class="sp-konto__form" data-konto-name novalidate>' +
            '<label class="sp-bew__feld"><span class="sp-bew__label">' + esc(t.nameAendern) + "</span>" +
            '<span class="sp-konto__zeile"><input name="name" maxlength="20" autocomplete="nickname" spellcheck="false" value="' + esc(k.name) + '">' +
            '<button type="submit" class="sp-knopf sp-knopf--glas">' + esc(t.speichern2) + "</button></span>" +
            '<span class="sp-bew__hilfe">' + esc(t.nameHilfe) + "</span></label>" +
          "</form>") +
        '<div class="sp-konto__aktionen">' +
          '<button type="button" class="sp-knopf sp-knopf--glas" data-konto-abmelden>' + esc(t.abmelden) + "</button>" +
          '<button type="button" class="sp-knopf sp-knopf--glas" data-konto-ueberall>' + esc(t.ueberallAbmelden) + "</button>" +
          '<a class="sp-knopf sp-knopf--glas" href="/api/konto/daten" download="miwale-konto.json">' + esc(t.datenLaden) + "</a>" +
        "</div>" +
        '<div class="sp-konto__gefahr"><button type="button" class="sp-bew__loeschen" data-konto-loeschen>' + esc(t.loeschen) + "</button></div>";
    } else if (s.registrierung) {
      inhalt =
        '<h2 class="sp-ueberschrift">' + esc(t.neuTitel) + "</h2>" +
        '<p class="sp-konto__hilfe">' + esc(t.neuIntro) + "</p>" +
        meldungHtml() +
        '<form class="sp-konto__form" data-konto-neu novalidate>' +
          '<label class="sp-bew__feld"><span class="sp-bew__label">' + esc(t.nameLabel) + "</span>" +
            '<input name="name" maxlength="20" autocomplete="nickname" spellcheck="false" required>' +
            '<span class="sp-bew__hilfe">' + esc(t.nameHilfe) + "</span></label>" +
          '<label class="sp-ideen__haken"><input type="checkbox" name="alter" required><span>' + esc(t.alter) +
            ' <a href="/privacy" target="_blank" rel="noopener">' + esc(t.datenschutz) + "</a></span></label>" +
          '<div class="sp-konto__aktionen">' +
            '<button type="submit" class="sp-knopf sp-knopf--play">' + esc(t.erstellen) + "</button>" +
            '<button type="button" class="sp-bew__loeschen" data-konto-abbrechen>' + esc(t.abbrechen) + "</button>" +
          "</div>" +
        "</form>";
    } else {
      inhalt =
        '<p class="sp-konto__hilfe">' + esc(t.intro) + "</p>" +
        meldungHtml() +
        anbieterKnoepfe(t, zurueckAusAdresse());
    }

    el.innerHTML =
      '<h1 class="sp-ideen__titel">' + esc(t.seitenTitel) + "</h1>" +
      '<div class="sp-konto__raster">' +
        '<section class="sp-kasten sp-konto__haupt">' + inhalt + "</section>" +
        speicherHinweis(t) +
      "</div>";
  }

  async function aktion(fn) {
    const t = texte(seite.sprache);
    try {
      const { status, daten } = await fn();
      if (status >= 200 && status < 300) return daten;
      seite.meldung = { fehler: true, text: fehlerText(t, daten.fehler) };
    } catch (e) {
      seite.meldung = { fehler: true, text: t.fehler.allgemein };
    }
    seiteZeichnen();
    return null;
  }

  function einbauen(el, sprache) {
    seite.el = el;
    seite.sprache = sprache;
    // Rueckmeldung vom Server nach der Anmeldung (?fehler=...) einmal zeigen,
    // dann aus der Adresse nehmen, damit sie beim Neuladen nicht wiederkommt.
    const q = new URLSearchParams(location.search);
    if (q.get("fehler")) {
      seite.meldung = { fehler: true, text: fehlerText(texte(sprache), q.get("fehler")) };
      q.delete("fehler");
      try { history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : "")); } catch (e) { /* egal */ }
    }
    seiteZeichnen();

    el.addEventListener("submit", async (e) => {
      e.preventDefault();
      const t = texte(seite.sprache);
      const form = e.target;
      const name = form.elements.name.value.trim();
      if (!NAME_RE.test(name)) { seite.meldung = { fehler: true, text: t.fehler["name-format"] }; seiteZeichnen(); return; }

      if (form.matches("[data-konto-neu]")) {
        if (!form.elements.alter.checked) { seite.meldung = { fehler: true, text: t.fehler.alter }; seiteZeichnen(); return; }
        const daten = await aktion(() => ID().senden("/api/konto/registrieren", "POST", { name, alter: true }));
        if (!daten) return;
        seite.meldung = null;
        ID().setzen(daten);
        // Zurueck dorthin, wo die Anmeldung begann (Spielseite, Game Requests).
        if (daten.zurueck && daten.zurueck !== "/account") location.assign(daten.zurueck);
        return;
      }
      if (form.matches("[data-konto-name]")) {
        const daten = await aktion(() => ID().senden("/api/konto/name", "PUT", { name }));
        if (!daten) return;
        seite.meldung = { fehler: false, text: t.gespeichert };
        ID().setzen(daten);
      }
    });

    el.addEventListener("click", async (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      const t = texte(seite.sprache);
      if ("kontoAbbrechen" in b.dataset) {
        const daten = await aktion(() => ID().senden("/api/konto/registrieren/abbrechen", "POST"));
        if (daten) { seite.meldung = null; ID().setzen(daten); }
        return;
      }
      if ("kontoAbmelden" in b.dataset || "kontoUeberall" in b.dataset) {
        const daten = await aktion(() => ID().senden("/api/konto/abmelden", "POST", { ueberall: "kontoUeberall" in b.dataset }));
        if (daten) { seite.meldung = { fehler: false, text: t.abgemeldet }; ID().setzen(daten); }
        return;
      }
      if ("kontoLoeschen" in b.dataset) {
        if (!window.confirm(t.loeschenFrage)) return;
        const daten = await aktion(() => ID().senden("/api/konto", "DELETE", { bestaetigt: true }));
        if (daten) { seite.meldung = { fehler: false, text: t.geloescht }; ID().setzen(daten); }
      }
    });
  }

  window.addEventListener("miwale-konto", () => {
    knopfZeichnen();
    seiteZeichnen();
  });

  window.MIWALE_KONTO = { knopf, einbauen, anmeldeKasten };
})();
