// Konto auf der Spieleseite: der Knopf oben rechts, die Seite /account und der
// Kasten "Zum Schreiben anmelden", den Bewertungen und Game Requests zeigen.
//
// Anmelden geht ueber Discord oder Google (der Server, server/konten.mjs, macht
// den ganzen Ablauf, hier gibt es nur Links dorthin; wer zum ersten Mal kommt,
// waehlt danach auf /account einen Namen) oder mit E-Mail und Passwort, wenn der
// Server "email" unter den Anbietern nennt. Dazu Bestaetigen per Link, Passwort
// vergessen (?zuruecksetzen=<token>) und Passwort aendern.
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
      karteFussEmail: "With Discord or Google we never see a password. With email we store your address and a scrambled password.",
      schliessen: "Close",
      intro: "You never need an account to play. Sign in to write reviews and send game requests.",
      mit: { discord: "Continue with Discord", google: "Continue with Google", test: "Test sign-in (local only)", email: "Continue with email" },
      oder: "or",
      email: "Email",
      passwort: "Password",
      passwortHilfe: "At least 8 characters.",
      passwortWiederholen: "Repeat password",
      passwortAlt: "Current password",
      passwortNeu: "New password",
      emailAnmelden: "Sign in",
      emailRegistrieren: "Create account",
      zuRegistrieren: "Create an account",
      zuAnmelden: "Sign in instead",
      vergessen: "Forgot password?",
      registrierenTitel: "Create an account with email",
      vergessenTitel: "Reset your password",
      vergessenText: "Enter your email address. We'll send you a link to set a new password.",
      linkSchicken: "Send link",
      vergessenGesendet: "If there's an account for this address, a link is on its way. Check your inbox.",
      registriertBestaetigen: "Almost done! We've sent you an email. Open the link in it to confirm your address, then sign in.",
      bestaetigenFehlt: "Please confirm your email address first. The link is in the email we sent you.",
      erneutSenden: "Send the confirmation email again",
      erneutGesendet: "Sent. Check your inbox and the spam folder.",
      zuruecksetzenTitel: "Set a new password",
      zuruecksetzenText: "Pick a new password for your miwale account.",
      passwortSpeichern: "Save password",
      zurueckgesetzt: "Your new password is saved and you're signed in.",
      bestaetigt: "Your email address is confirmed. Welcome to miwale!",
      passwortAendern: "Change password",
      passwortGeaendert: "Password changed. Other devices have been signed out.",
      studio: "miwale Studio",
      keineAnbieter: "Signing in isn't available right now. Please try again later.",
      speichernTitel: "What we store",
      speichern: [
        "The name you pick, and when you signed up.",
        "A scrambled ID from Discord or Google, so we recognise you next time. We can't turn it back into your Discord or Google account.",
        "With Discord or Google: no email address, no password, no real name. With email sign-in: your address and the password in a scrambled form nobody can read back.",
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
      ueber: { discord: "via Discord", google: "via Google", email: "via email" },
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
      kastenText: "It takes a few seconds. Playing never needs an account.",
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
        falsch: "Email or password is wrong.",
        bestaetigen: "Please confirm your email address first. The link is in the email we sent you.",
        email: "Please enter a valid email address.",
        "passwort-kurz": "The password needs at least 8 characters.",
        "passwort-gleich": "The two passwords don't match.",
        "email-vergeben": "There's already an account with this address. Sign in or reset the password.",
        "keine-post": "We can't send emails right now. Please try again later.",
        "link-abgelaufen": "This link has expired or was already used. Please request a new one.",
        "schon-da": "You already have an account. Please sign in.",
        anmelden: "Please sign in again.",
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
      karteFussEmail: "Mit Discord oder Google sehen wir nie ein Passwort. Mit E-Mail speichern wir die Adresse und ein verschlüsseltes Passwort.",
      schliessen: "Schließen",
      intro: "Zum Spielen brauchst du nie ein Konto. Mit Konto kannst du Bewertungen schreiben und Game Requests schicken.",
      mit: { discord: "Weiter mit Discord", google: "Weiter mit Google", test: "Test-Anmeldung (nur lokal)", email: "Weiter mit E-Mail" },
      oder: "oder",
      email: "E-Mail",
      passwort: "Passwort",
      passwortHilfe: "Mindestens 8 Zeichen.",
      passwortWiederholen: "Passwort wiederholen",
      passwortAlt: "Bisheriges Passwort",
      passwortNeu: "Neues Passwort",
      emailAnmelden: "Anmelden",
      emailRegistrieren: "Konto anlegen",
      zuRegistrieren: "Konto erstellen",
      zuAnmelden: "Doch anmelden",
      vergessen: "Passwort vergessen?",
      registrierenTitel: "Konto mit E-Mail erstellen",
      vergessenTitel: "Passwort zurücksetzen",
      vergessenText: "Gib deine E-Mail-Adresse ein. Wir schicken dir einen Link, mit dem du ein neues Passwort festlegst.",
      linkSchicken: "Link schicken",
      vergessenGesendet: "Wenn es zu dieser Adresse ein Konto gibt, ist ein Link unterwegs. Schau in dein Postfach.",
      registriertBestaetigen: "Fast geschafft! Wir haben dir eine E-Mail geschickt. Öffne den Link darin, um deine Adresse zu bestätigen, und melde dich dann an.",
      bestaetigenFehlt: "Bitte bestätige zuerst deine E-Mail-Adresse. Den Link findest du in der E-Mail von uns.",
      erneutSenden: "Bestätigungs-Mail noch einmal senden",
      erneutGesendet: "Verschickt. Schau in dein Postfach und in den Spam-Ordner.",
      zuruecksetzenTitel: "Neues Passwort festlegen",
      zuruecksetzenText: "Wähle ein neues Passwort für dein miwale-Konto.",
      passwortSpeichern: "Passwort speichern",
      zurueckgesetzt: "Dein neues Passwort ist gespeichert und du bist angemeldet.",
      bestaetigt: "Deine E-Mail-Adresse ist bestätigt. Willkommen bei miwale!",
      passwortAendern: "Passwort ändern",
      passwortGeaendert: "Passwort geändert. Andere Geräte wurden abgemeldet.",
      studio: "miwale Studio",
      keineAnbieter: "Anmelden geht gerade nicht. Bitte später noch einmal versuchen.",
      speichernTitel: "Was gespeichert wird",
      speichern: [
        "Der Name, den du wählst, und wann du dich angemeldet hast.",
        "Eine verschlüsselte Kennung von Discord oder Google, damit wir dich beim nächsten Mal wiedererkennen. Daraus lässt sich dein Discord- oder Google-Konto nicht zurückrechnen.",
        "Mit Discord oder Google: keine E-Mail-Adresse, kein Passwort, kein echter Name. Mit E-Mail: deine Adresse und das Passwort in einer Form, die niemand zurücklesen kann.",
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
      ueber: { discord: "über Discord", google: "über Google", email: "über E-Mail" },
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
      kastenText: "Dauert ein paar Sekunden. Spielen geht immer ohne Konto.",
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
        falsch: "E-Mail oder Passwort stimmt nicht.",
        bestaetigen: "Bitte bestätige zuerst deine E-Mail-Adresse. Den Link findest du in der E-Mail von uns.",
        email: "Bitte eine gültige E-Mail-Adresse eingeben.",
        "passwort-kurz": "Das Passwort braucht mindestens 8 Zeichen.",
        "passwort-gleich": "Die beiden Passwörter sind nicht gleich.",
        "email-vergeben": "Mit dieser Adresse gibt es schon ein Konto. Melde dich an oder setze das Passwort zurück.",
        "keine-post": "Wir können gerade keine E-Mails verschicken. Bitte später noch einmal versuchen.",
        "link-abgelaufen": "Der Link ist abgelaufen oder wurde schon benutzt. Bitte fordere einen neuen an.",
        "schon-da": "Du hast schon ein Konto. Bitte melde dich an.",
        anmelden: "Bitte melde dich neu an.",
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
    test: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    email: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'
  };

  const mitEmail = () => ID().stand().anbieter.includes("email");

  // mitFormular: in der Karte steht das E-Mail-Formular selbst darunter; im
  // kleinen Kasten (Bewertungen, Game Requests) oeffnet ein Knopf das Fenster.
  function anbieterKnoepfe(t, zurueck, mitFormular) {
    const liste = ID().stand().anbieter.filter((a) => a !== "email");
    if (!liste.length && !mitEmail()) return '<p class="sp-konto__hilfe">' + esc(ID().geladen() ? t.keineAnbieter : t.laedt) + "</p>";
    return '<div class="an-anbieter">' + liste.map((a) =>
      '<a class="an-anbieter__knopf an-anbieter__knopf--' + esc(a) + '" href="' + esc(ID().anmeldenAdresse(a, zurueck)) + '">' +
        (LOGOS[a] || LOGOS.test) + "<span>" + esc((t.mit[a]) || a) + "</span></a>").join("") +
      (mitEmail() && !mitFormular ? '<a class="an-anbieter__knopf an-anbieter__knopf--email" href="/account?zurueck=' + esc(encodeURIComponent(zurueck || "/")) + '" data-anmelden>' +
        LOGOS.email + "<span>" + esc(t.mit.email) + "</span></a>" : "") +
      "</div>";
  }

  // ---- E-Mail und Passwort -------------------------------------------------------
  // Ein Formular mit drei Arten: anmelden, registrieren, vergessen. Der Zustand
  // gilt fuer Fenster und /account gemeinsam (es ist immer nur eins zu sehen).
  const email = { modus: "anmelden", meldung: null, erneut: "", adresse: "", laeuft: false };

  function emailMeldungHtml(t) {
    const m = email.meldung;
    if (!m) return "";
    return '<div class="sp-konto__meldung an-email__meldung' + (m.fehler ? " sp-konto__meldung--fehler" : "") + '" role="status">' + esc(m.text) +
      (email.erneut ? ' <button type="button" class="an-email__link" data-email-erneut>' + esc(t.erneutSenden) + "</button>" : "") + "</div>";
  }

  function emailFormHtml(t, ziel) {
    const m = email.modus;
    const feld = (name, label, typ, auto, extra) => '<label class="an-email__feld"><span>' + esc(label) + "</span>" +
      '<input name="' + name + '" type="' + typ + '" autocomplete="' + auto + '"' + (extra || "") + "></label>";
    return '<form class="an-email" data-email="' + m + '" data-ziel="' + esc(ziel || "") + '" novalidate>' +
      (m === "registrieren" ? '<p class="an-email__titel">' + esc(t.registrierenTitel) + "</p>" : "") +
      (m === "vergessen" ? '<p class="an-email__titel">' + esc(t.vergessenTitel) + '</p><p class="an-email__text">' + esc(t.vergessenText) + "</p>" : "") +
      emailMeldungHtml(t) +
      (m === "registrieren" ? feld("name", t.nameLabel, "text", "nickname", ' maxlength="20" spellcheck="false" aria-describedby="an-name-hilfe"') +
        '<span class="an-email__hilfe" id="an-name-hilfe">' + esc(t.nameHilfe) + "</span>" : "") +
      feld("email", t.email, "email", "email", ' maxlength="200" spellcheck="false" value="' + esc(email.adresse) + '"') +
      (m !== "vergessen" ? feld("passwort", t.passwort, "password", m === "registrieren" ? "new-password" : "current-password", ' maxlength="200"') : "") +
      (m === "registrieren" ? '<span class="an-email__hilfe">' + esc(t.passwortHilfe) + "</span>" +
        '<label class="sp-ideen__haken an-email__haken"><input type="checkbox" name="alter"><span>' + esc(t.alter) +
        ' <a href="/privacy" target="_blank" rel="noopener">' + esc(t.datenschutz) + "</a></span></label>" : "") +
      '<button type="submit" class="an-email__los"' + (email.laeuft ? " disabled" : "") + ">" +
        esc(m === "registrieren" ? t.emailRegistrieren : m === "vergessen" ? t.linkSchicken : t.emailAnmelden) + "</button>" +
      '<div class="an-email__wechsel">' +
        (m === "anmelden" ? '<button type="button" class="an-email__link" data-email-modus="vergessen">' + esc(t.vergessen) + "</button>" +
          '<button type="button" class="an-email__link" data-email-modus="registrieren">' + esc(t.zuRegistrieren) + "</button>"
          : '<button type="button" class="an-email__link" data-email-modus="anmelden">' + esc(t.zuAnmelden) + "</button>") +
      "</div></form>";
  }

  // Inhalt der Anmelde-Karte: im Fenster in der Mitte und auf /account derselbe.
  // ziel: wohin nach der Anmeldung mit E-Mail ("" = bleiben).
  function karteHtml(t, zurueck, titelId, ziel) {
    const knoepfe = ID().stand().anbieter.filter((a) => a !== "email").length;
    return '<img class="an-karte__wal" src="assets/mascot-whale-light.png" alt="" width="64" height="42">' +
      '<h2 class="an-karte__titel" id="' + (titelId || "an-titel") + '">' + esc(t.karteTitel) + "</h2>" +
      '<p class="an-karte__text">' + esc(t.karteText) + "</p>" +
      (email.modus === "anmelden" || !mitEmail() ? anbieterKnoepfe(t, zurueck, true) : "") +
      (mitEmail() ? (knoepfe && email.modus === "anmelden" ? '<div class="an-oder"><span>' + esc(t.oder) + "</span></div>" : "") + emailFormHtml(t, ziel) : "") +
      '<p class="an-karte__fuss">' + esc(mitEmail() ? t.karteFussEmail : t.karteFuss) + ' <a href="/privacy" data-link>' + esc(t.datenschutz) + "</a></p>";
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
    const erster = fenster.querySelector(".an-anbieter__knopf, .an-email input, [data-an-zu]");
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
      const ziele = [...fenster.querySelectorAll("a[href], button:not([disabled]), input")];
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
  const seite = { el: null, sprache: "en", meldung: null, token: null };

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
    } else if (seite.token) {
      // Link aus der Mail "Passwort zuruecksetzen".
      el.innerHTML = '<div class="an-seite"><div class="an-karte an-karte--neu"><img class="an-karte__wal" src="assets/mascot-whale-light.png" alt="" width="64" height="42">' +
        '<h2 class="sp-ueberschrift">' + esc(t.zuruecksetzenTitel) + "</h2>" +
        '<p class="sp-konto__hilfe">' + esc(t.zuruecksetzenText) + "</p>" + meldungHtml() +
        '<form class="sp-konto__form" data-konto-zuruecksetzen novalidate>' +
          '<label class="sp-bew__feld"><span class="sp-bew__label">' + esc(t.passwortNeu) + '</span><input name="passwort" type="password" autocomplete="new-password" maxlength="200"><span class="sp-bew__hilfe">' + esc(t.passwortHilfe) + "</span></label>" +
          '<label class="sp-bew__feld"><span class="sp-bew__label">' + esc(t.passwortWiederholen) + '</span><input name="wiederholen" type="password" autocomplete="new-password" maxlength="200"></label>' +
          '<div class="sp-konto__aktionen"><button type="submit" class="sp-knopf sp-knopf--play">' + esc(t.passwortSpeichern) + "</button></div>" +
        "</form></div></div>";
      return;
    } else if (s.konto) {
      const k = s.konto;
      inhalt =
        '<div class="sp-konto__karte">' +
          '<span class="sp-konto__bild" aria-hidden="true">' + ICON_PERSON + "</span>" +
          '<div><p class="sp-konto__klein">' + esc(t.angemeldetAls) + "</p>" +
          '<p class="sp-konto__name">' + esc(k.name) + "</p>" +
          '<p class="sp-konto__klein">' + esc((t.ueber[k.anbieter] || k.anbieter) + (k.email ? " (" + k.email + ")" : "") + " · " + t.seit(datum(k.erstellt, sprache))) + "</p></div>" +
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
        // Nur E-Mail-Konten haben ein Passwort bei uns.
        (k.anbieter === "email" ?
          '<form class="sp-konto__form sp-konto__passwort" data-konto-passwort novalidate>' +
            '<p class="sp-bew__label">' + esc(t.passwortAendern) + "</p>" +
            '<input name="email" type="email" autocomplete="username" value="' + esc(k.email || "") + '" hidden>' +
            '<label class="sp-bew__feld"><span class="sp-bew__hilfe">' + esc(t.passwortAlt) + '</span><input name="alt" type="password" autocomplete="current-password" maxlength="200"></label>' +
            '<label class="sp-bew__feld"><span class="sp-bew__hilfe">' + esc(t.passwortNeu) + " · " + esc(t.passwortHilfe) + '</span><span class="sp-konto__zeile"><input name="neu" type="password" autocomplete="new-password" maxlength="200">' +
            '<button type="submit" class="sp-knopf sp-knopf--glas">' + esc(t.speichern2) + "</button></span></label>" +
          "</form>" : "") +
        '<div class="sp-konto__aktionen">' +
          '<a class="sp-knopf sp-knopf--play" href="/profile" data-link>' + esc(t.meinProfil) + "</a>" +
          '<a class="sp-knopf sp-knopf--glas" href="/studio" data-link>' + esc(t.studio) + "</a>" +
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
      const ziel = new URLSearchParams(location.search).get("zurueck") ? zurueckAusAdresse() : "";
      el.innerHTML = '<div class="an-seite"><div class="an-karte">' + meldungHtml() + '<div class="an-karte__inhalt">' + karteHtml(t, zurueckAusAdresse(), null, ziel) + "</div></div></div>";
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
    // Dasselbe fuer die Links aus den Mails: ?bestaetigt=1 und ?zuruecksetzen=<token>.
    // Den Token sofort aus der Adresse nehmen (Verlauf, geteilte Bildschirme).
    const q = new URLSearchParams(location.search);
    let weg = false;
    if (q.get("fehler")) {
      seite.meldung = { fehler: true, text: fehlerText(texte(sprache), q.get("fehler")) };
      q.delete("fehler");
      weg = true;
    }
    if (q.get("bestaetigt") === "1") {
      seite.meldung = { fehler: false, text: texte(sprache).bestaetigt };
      q.delete("bestaetigt");
      weg = true;
    }
    if (q.get("zuruecksetzen")) {
      const token = q.get("zuruecksetzen");
      if (/^[A-Za-z0-9_-]{10,100}$/.test(token)) seite.token = token;
      q.delete("zuruecksetzen");
      weg = true;
    }
    if (weg) { try { history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : "")); } catch (e) { /* egal */ } }
    seiteZeichnen();

    el.addEventListener("submit", async (e) => {
      const t = texte(seite.sprache);
      const form = e.target;
      // Das E-Mail-Formular der Karte behandelt der Teil weiter unten (auch im Fenster).
      if (form.matches("[data-email]")) return;
      e.preventDefault();

      if (form.matches("[data-konto-zuruecksetzen]")) {
        const passwort = form.elements.passwort.value;
        if (passwort.length < 8) { seite.meldung = { fehler: true, text: t.fehler["passwort-kurz"] }; seiteZeichnen(); return; }
        if (passwort !== form.elements.wiederholen.value) { seite.meldung = { fehler: true, text: t.fehler["passwort-gleich"] }; seiteZeichnen(); return; }
        const token = seite.token;
        const daten = await aktion(() => ID().senden("/api/konto/email/zuruecksetzen", "POST", { token, passwort }));
        if (!daten) return;
        seite.token = null;
        seite.meldung = { fehler: false, text: t.zurueckgesetzt };
        ID().setzen(daten);
        return;
      }
      if (form.matches("[data-konto-passwort]")) {
        const alt = form.elements.alt.value, neu = form.elements.neu.value;
        if (neu.length < 8) { seite.meldung = { fehler: true, text: t.fehler["passwort-kurz"] }; seiteZeichnen(); return; }
        const daten = await aktion(() => ID().senden("/api/konto/email/passwort", "POST", { alt, neu }));
        if (!daten) return;
        seite.meldung = { fehler: false, text: t.passwortGeaendert };
        seiteZeichnen();
        return;
      }

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

  // ---- E-Mail-Formular: im Fenster und auf /account --------------------------------
  function kartenNeu() {
    seiteZeichnen();
    fensterZeichnen();
  }
  function emailFehler(t, daten, status) {
    const grund = (daten && daten.fehler) || "allgemein";
    email.meldung = { fehler: true, text: fehlerText(t, grund) };
    email.erneut = grund === "bestaetigen" ? email.adresse : "";
    if (status === 0) email.meldung.text = t.fehler.allgemein;
  }
  async function emailSenden(form) {
    const t = texte(document.documentElement.lang === "de" ? "de" : "en");
    const f = form.elements;
    const modus = form.dataset.email;
    email.adresse = f.email.value.trim();
    email.erneut = "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.adresse)) { email.meldung = { fehler: true, text: t.fehler.email }; kartenNeu(); fokusEmail(); return; }
    let url, koerper;
    if (modus === "anmelden") {
      url = "/api/konto/email/anmelden"; koerper = { email: email.adresse, passwort: f.passwort.value };
    } else if (modus === "registrieren") {
      const name = f.name.value.trim();
      if (!NAME_RE.test(name)) { email.meldung = { fehler: true, text: t.fehler["name-format"] }; kartenNeu(); fokusEmail(); return; }
      if (f.passwort.value.length < 8) { email.meldung = { fehler: true, text: t.fehler["passwort-kurz"] }; kartenNeu(); fokusEmail(); return; }
      if (!f.alter.checked) { email.meldung = { fehler: true, text: t.fehler.alter }; kartenNeu(); fokusEmail(); return; }
      url = "/api/konto/email/registrieren"; koerper = { name, email: email.adresse, passwort: f.passwort.value, alter: true };
    } else {
      url = "/api/konto/email/vergessen"; koerper = { email: email.adresse };
    }
    email.laeuft = true;
    form.querySelector(".an-email__los").disabled = true;
    let antwort = { status: 0, daten: {} };
    try { antwort = await ID().senden(url, "POST", koerper); } catch (e) { /* Netz */ }
    email.laeuft = false;
    const { status, daten } = antwort;
    if (modus === "vergessen") {
      if (status === 200) email.meldung = { fehler: false, text: t.vergessenGesendet };
      else emailFehler(t, daten, status);
      kartenNeu();
      return;
    }
    if (status === 202 && daten.bestaetigen) {
      // Registriert, aber erst nach dem Link aus der Mail angemeldet.
      email.modus = "anmelden";
      email.meldung = { fehler: false, text: t.registriertBestaetigen };
      email.erneut = email.adresse;
      kartenNeu();
      return;
    }
    if (status === 200 || status === 201) {
      email.meldung = null;
      email.modus = "anmelden";
      const ziel = form.dataset.ziel || "";
      ID().setzen(daten);
      if (ziel && ziel !== location.pathname) location.assign(ziel);
      return;
    }
    emailFehler(t, daten, status);
    kartenNeu();
    fokusEmail();
  }
  function fokusEmail() {
    const f = document.querySelector(".an-email");
    const feld = f && (f.querySelector("input:not([type=checkbox]):placeholder-shown") || f.querySelector("input"));
    if (feld && !f.contains(document.activeElement)) feld.focus();
  }
  document.addEventListener("submit", (e) => {
    const form = e.target.closest("form[data-email]");
    if (!form) return;
    e.preventDefault();
    if (!email.laeuft) emailSenden(form);
  });
  document.addEventListener("click", async (e) => {
    const modus = e.target.closest("[data-email-modus]");
    if (modus) {
      const f = modus.closest("form");
      if (f && f.elements.email) email.adresse = f.elements.email.value.trim();
      email.modus = modus.dataset.emailModus;
      email.meldung = null;
      email.erneut = "";
      kartenNeu();
      const neu = document.querySelector(".an-email input");
      if (neu) neu.focus();
      return;
    }
    if (e.target.closest("[data-email-erneut]")) {
      const t = texte(document.documentElement.lang === "de" ? "de" : "en");
      const { status, daten } = await ID().senden("/api/konto/email/erneut", "POST", { email: email.erneut }).catch(() => ({ status: 0, daten: {} }));
      if (status === 200) { email.meldung = { fehler: false, text: t.erneutGesendet }; email.erneut = ""; }
      else emailFehler(t, daten, status);
      kartenNeu();
    }
  });

  window.addEventListener("miwale-konto", () => {
    knopfZeichnen();
    seiteZeichnen();
    if (fenster) { if (ID().konto()) fensterSchliessen(); else fensterZeichnen(); }
  });
  // Perlen und Level im Knopf oben folgen dem Profil.
  window.addEventListener("miwale-profil", knopfZeichnen);

  window.MIWALE_KONTO = { knopf, einbauen, anmeldeKasten, oeffnen: fensterOeffnen, schliessen: fensterSchliessen };
})();
