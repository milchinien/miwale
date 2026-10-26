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
      karteTitel: "Sign in or create an account",
      karteText: "Keep your playtime, achievements and pearls on every device. Playing never needs an account.",
      karteFuss: "We never see a password and don't store your email address.",
      schliessen: "Close",
      intro: "You never need an account to play. Sign in to write reviews and send game requests.",
      mit: { discord: "Continue with Discord", google: "Continue with Google", test: "Test sign-in (local only)" },
      keineAnbieter: "Signing in isn't available right now. Please try again later.",
      speichernTitel: "What we store",
      speichern: [
        "The name you pick, and when you signed up.",
        "A scrambled ID from Discord or Google, so we recognise you next time. We can't turn it back into your Discord or Google account.",
        "No email address, no password, no real name.",
        "Your profile: playtime per game, achievements, pearls and the items you picked. Others only see what you share (more in the privacy policy)."
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
      meinProfil: "Your profile",
      abmelden: "Sign out",
      ueberallAbmelden: "Sign out on all devices",
      datenLaden: "Download my data",
      loeschen: "Delete account",
      loeschenFrage: "Delete your account? Your reviews, game requests and profile are deleted too. This can't be undone.",
      geloescht: "Your account and everything that belonged to it has been deleted.",
      abgemeldet: "You're signed out.",
      gespeichert: "Saved.",
      kastenTitel: {
        bewertung: "Sign in to write a review",
        idee: "Sign in to send a game request",
        profil: "Sign in to create your profile"
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
      karteTitel: "Anmelden oder registrieren",
      karteText: "Behalte Spielzeit, Erfolge und Perlen auf jedem Gerät. Zum Spielen brauchst du nie ein Konto.",
      karteFuss: "Wir sehen nie ein Passwort und speichern keine E-Mail-Adresse.",
      schliessen: "Schließen",
      intro: "Zum Spielen brauchst du nie ein Konto. Mit Konto kannst du Bewertungen schreiben und Game Requests schicken.",
      mit: { discord: "Weiter mit Discord", google: "Weiter mit Google", test: "Test-Anmeldung (nur lokal)" },
      keineAnbieter: "Anmelden geht gerade nicht. Bitte später noch einmal versuchen.",
      speichernTitel: "Was gespeichert wird",
      speichern: [
        "Der Name, den du wählst, und wann du dich angemeldet hast.",
        "Eine verschlüsselte Kennung von Discord oder Google, damit wir dich beim nächsten Mal wiedererkennen. Daraus lässt sich dein Discord- oder Google-Konto nicht zurückrechnen.",
        "Keine E-Mail-Adresse, kein Passwort, kein echter Name.",
        "Dein Profil: Spielzeit je Spiel, Erfolge, Perlen und die Gegenstände, die du gewählt hast. Andere sehen nur, was du freigibst (mehr in der Datenschutzerklärung)."
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
      meinProfil: "Dein Profil",
      abmelden: "Abmelden",
      ueberallAbmelden: "Auf allen Geräten abmelden",
      datenLaden: "Meine Daten herunterladen",
      loeschen: "Konto löschen",
      loeschenFrage: "Konto löschen? Deine Bewertungen, Game Requests und dein Profil werden mit gelöscht. Das lässt sich nicht rückgängig machen.",
      geloescht: "Dein Konto und alles, was dazu gehörte, ist gelöscht.",
      abgemeldet: "Du bist abgemeldet.",
      gespeichert: "Gespeichert.",
      kastenTitel: {
        bewertung: "Zum Schreiben einer Bewertung anmelden",
        idee: "Zum Einreichen eines Game Requests anmelden",
        profil: "Melde dich an, um dein Profil anzulegen"
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

  // Logos der Anbieter. Google: das "G" nach den Vorgaben von Google fuer
  // "Mit Google anmelden"; Discord: das Logo der Marke.
  const LOGOS = {
    google: '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>',
    discord: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#5865F2" d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>',
    test: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'
  };

  function anbieterKnoepfe(t, zurueck) {
    const liste = ID().stand().anbieter;
    if (!liste.length) return '<p class="sp-konto__hilfe">' + esc(ID().geladen() ? t.keineAnbieter : t.laedt) + "</p>";
    return '<div class="an-anbieter">' + liste.map((a) =>
      '<a class="an-anbieter__knopf an-anbieter__knopf--' + esc(a) + '" href="' + esc(ID().anmeldenAdresse(a, zurueck)) + '">' +
        (LOGOS[a] || LOGOS.test) + "<span>" + esc((t.mit[a]) || a) + "</span></a>").join("") + "</div>";
  }

  // Inhalt der Anmelde-Karte: im Fenster in der Mitte und auf /account derselbe.
  function karteHtml(t, zurueck, titelId) {
    return '<img class="an-karte__wal" src="assets/mascot-whale-light.png" alt="" width="64" height="42">' +
      '<h2 class="an-karte__titel" id="' + (titelId || "an-titel") + '">' + esc(t.karteTitel) + "</h2>" +
      '<p class="an-karte__text">' + esc(t.karteText) + "</p>" +
      anbieterKnoepfe(t, zurueck) +
      '<p class="an-karte__fuss">' + esc(t.karteFuss) + ' <a href="/privacy" data-link>' + esc(t.datenschutz) + "</a></p>";
  }

  // ---- Anmelde-Fenster in der Mitte --------------------------------------------------
  // Wie auf den meisten Seiten: "Anmelden" oeffnet ein Fenster ueber der Seite statt
  // auf eine eigene Seite zu wechseln. Jeder Link mit data-anmelden oeffnet es. Ohne
  // JavaScript fuehrt derselbe Link auf /account.
  let fenster = null;
  let vorherFokus = null;
  function fensterSprache() { return document.documentElement.lang === "de" ? "de" : "en"; }
  function fensterZeichnen() {
    if (!fenster) return;
    const t = texte(fensterSprache());
    const zurueck = location.pathname === "/account" ? zurueckAusAdresse() : location.pathname + location.search;
    fenster.querySelector(".an-karte__inhalt").innerHTML = karteHtml(t, zurueck);
    fenster.querySelector("[data-an-zu]").setAttribute("aria-label", t.schliessen);
  }
  function fensterOeffnen() {
    if (ID().konto()) { location.href = "/profile"; return; }
    if (fenster) return;
    vorherFokus = document.activeElement;
    fenster = document.createElement("div");
    fenster.className = "an-fenster";
    fenster.innerHTML = '<div class="an-karte" role="dialog" aria-modal="true" aria-labelledby="an-titel">' +
      '<button type="button" class="an-karte__zu" data-an-zu><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' +
      '<div class="an-karte__inhalt"></div></div>';
    document.body.appendChild(fenster);
    document.documentElement.classList.add("an-offen");
    fensterZeichnen();
    requestAnimationFrame(() => fenster && fenster.classList.add("an-fenster--da"));
    const erster = fenster.querySelector(".an-anbieter__knopf, [data-an-zu]");
    if (erster) erster.focus();
  }
  function fensterSchliessen() {
    if (!fenster) return;
    fenster.remove();
    fenster = null;
    document.documentElement.classList.remove("an-offen");
    if (vorherFokus && vorherFokus.focus) vorherFokus.focus();
  }
  document.addEventListener("click", (e) => {
    const z = e.target.closest("[data-anmelden]");
    if (z && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
      e.preventDefault();
      e.stopPropagation();
      fensterOeffnen();
      return;
    }
    if (!fenster) return;
    if (e.target.closest("[data-an-zu]") || e.target === fenster) { fensterSchliessen(); return; }
    // Datenschutz-Link: Fenster zu, die Seite navigiert selbst.
    if (e.target.closest(".an-karte a[data-link]")) fensterSchliessen();
  }, true);
  document.addEventListener("keydown", (e) => {
    if (!fenster) return;
    if (e.key === "Escape") { fensterSchliessen(); return; }
    // Fokus im Fenster halten.
    if (e.key === "Tab") {
      const ziele = [...fenster.querySelectorAll("a[href], button")];
      if (!ziele.length) return;
      const erstes = ziele[0], letztes = ziele[ziele.length - 1];
      if (e.shiftKey && document.activeElement === erstes) { e.preventDefault(); letztes.focus(); }
      else if (!e.shiftKey && document.activeElement === letztes) { e.preventDefault(); erstes.focus(); }
    }
  });

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
    // Mit geladenem Profil zeigt der Knopf Avatar, Level und Perlen (shop/profil.js).
    const chip = konto && window.MIWALE_PROFIL_UI ? window.MIWALE_PROFIL_UI.chipHtml(konto) : null;
    if (chip) { knopfEl.innerHTML = chip; return; }
    knopfEl.innerHTML = '<a class="sp-knopf sp-knopf--glas sp-konto-knopf" href="/account" ' + (konto ? "data-link" : "data-anmelden") +
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
          '<a class="sp-knopf sp-knopf--play" href="/profile" data-link>' + esc(t.meinProfil) + "</a>" +
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
      // Abgemeldet: dieselbe Karte wie im Fenster, mitten auf der Seite.
      el.innerHTML = '<div class="an-seite"><div class="an-karte">' + meldungHtml() + '<div class="an-karte__inhalt">' + karteHtml(t, zurueckAusAdresse()) + "</div></div></div>";
      return;
    }

    if (s.registrierung && !s.konto) {
      el.innerHTML = '<div class="an-seite"><div class="an-karte an-karte--neu"><img class="an-karte__wal" src="assets/mascot-whale-light.png" alt="" width="64" height="42">' + inhalt + "</div></div>";
      return;
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
    if (fenster) { if (ID().konto()) fensterSchliessen(); else fensterZeichnen(); }
  });
  // Perlen und Level im Knopf oben folgen dem Profil.
  window.addEventListener("miwale-profil", knopfZeichnen);

  window.MIWALE_KONTO = { knopf, einbauen, anmeldeKasten, oeffnen: fensterOeffnen, schliessen: fensterSchliessen };
})();
