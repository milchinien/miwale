// Datenschutzerklaerung der Spieleseite (/privacy). Beschreibt, was die Dienste
// in server/ wirklich speichern -- wer dort etwas aendert, passt es hier an.
(() => {
  "use strict";

  const TEXTE = {
    en: {
      titel: "Privacy policy",
      stand: "Last updated: September 2026",
      abschnitte: [
        ["Who is responsible", [
          "Michel Waggoner, contact: michi.waggoner@gmail.com. Write to this address for any question about your data or to use your rights."
        ]],
        ["Playing without an account", [
          "You can play every game without an account and without signing up.",
          "Your browser keeps a few things locally (localStorage): your language, a random device ID for thumbs up/down, drafts of forms and the save games of the games. They stay on your device; only the device ID is sent along when you rate a game."
        ]],
        ["Server logs", [
          "Like every website, the server briefly records technical access data (IP address, time, requested page, browser). This is needed to run and protect the site (Art. 6(1)(f) GDPR). The logs are rotated automatically and overwritten after a short time."
        ]],
        ["Reviews and game requests", [
          "Reviews (thumbs, public text, private feedback) and game requests (text, images, optional name) are stored on our server. Next to them we store a salted checksum of your IP address to spot abuse — not the address itself.",
          "Public texts and picked game requests are visible to everyone, together with your account name. Private feedback is only visible to the developer.",
          "Legal basis: providing the feature you use (Art. 6(1)(b) GDPR). They stay until you delete them, delete your account, or we remove them."
        ]],
        ["Account and sign-in with Discord or Google", [
          "Writing reviews and sending game requests needs an account. You sign in with Discord or Google; we never see a password.",
          "When you click \"Continue with Discord/Google\", you go to their website, and their privacy policy applies there. We ask them only for a user ID (Discord: \"identify\", Google: \"openid\") — no email address, no real name, no friends list. Discord and Google may process data in the USA.",
          "We store: the name you pick, when you signed up and last visited, that you confirmed being at least 13, and a scrambled form of the ID (keyed hash) so we recognise you next time. We can't turn it back into your Discord or Google account.",
          "To keep you signed in, we set one cookie (sign-in session, 30 days after your last visit) and during sign-in two short-lived ones. They are strictly necessary, so no consent banner is needed. There are no tracking or advertising cookies.",
          "Legal basis: Art. 6(1)(b) GDPR. You need to be at least 13 years old to create an account."
        ]],
        ["Blocking", [
          "Accounts that break the rules can be blocked. If a blocked account is deleted, we keep only its scrambled ID, so it can't simply sign up again (Art. 6(1)(f) GDPR)."
        ]],
        ["Content from other websites", [
          "Some games run on GitHub Pages (github.io), and the notifications show thumbnails from YouTube (Google). Opening them sends your IP address to those services."
        ]],
        ["Your rights", [
          "You can ask for access to your data, correction, deletion, restriction and a copy, and you can object to processing (Art. 15–21 GDPR). You can download your data and delete your account yourself on the account page, at any time and immediately.",
          "You can also complain to a data protection authority."
        ]]
      ]
    },
    de: {
      titel: "Datenschutzerklärung",
      stand: "Stand: September 2026",
      abschnitte: [
        ["Verantwortlich", [
          "Michel Waggoner, Kontakt: michi.waggoner@gmail.com. An diese Adresse kannst du dich mit allen Fragen zu deinen Daten wenden und deine Rechte geltend machen."
        ]],
        ["Spielen ohne Konto", [
          "Alle Spiele kannst du ohne Konto und ohne Anmeldung spielen.",
          "Dein Browser speichert ein paar Dinge lokal (localStorage): deine Sprache, eine zufällige Gerätekennung für Daumen hoch/runter, Entwürfe von Formularen und die Spielstände der Spiele. Das bleibt auf deinem Gerät; nur die Gerätekennung wird mitgeschickt, wenn du ein Spiel bewertest."
        ]],
        ["Server-Protokolle", [
          "Wie jede Website speichert der Server kurz technische Zugriffsdaten (IP-Adresse, Zeit, aufgerufene Seite, Browser). Das ist nötig, um die Seite zu betreiben und zu schützen (Art. 6 Abs. 1 lit. f DSGVO). Die Protokolle werden automatisch rotiert und nach kurzer Zeit überschrieben."
        ]],
        ["Bewertungen und Game Requests", [
          "Bewertungen (Daumen, öffentlicher Text, privates Feedback) und Game Requests (Text, Bilder, freiwilliger Name) werden auf unserem Server gespeichert. Dazu speichern wir eine Prüfsumme deiner IP-Adresse mit geheimem Zusatz, um Missbrauch zu erkennen – nicht die Adresse selbst.",
          "Öffentliche Texte und ausgewählte Game Requests sieht jeder, zusammen mit deinem Kontonamen. Privates Feedback sieht nur der Entwickler.",
          "Rechtsgrundlage: Bereitstellung der Funktion, die du nutzt (Art. 6 Abs. 1 lit. b DSGVO). Die Daten bleiben, bis du sie löschst, dein Konto löschst oder wir sie entfernen."
        ]],
        ["Konto und Anmeldung mit Discord oder Google", [
          "Zum Schreiben von Bewertungen und für Game Requests brauchst du ein Konto. Du meldest dich mit Discord oder Google an; ein Passwort sehen wir nie.",
          "Klickst du auf „Weiter mit Discord/Google“, landest du auf deren Seite, und dort gilt deren Datenschutzerklärung. Wir fragen dort nur eine Nutzerkennung ab (Discord: „identify“, Google: „openid“) – keine E-Mail-Adresse, keinen echten Namen, keine Freundesliste. Discord und Google verarbeiten Daten unter Umständen in den USA.",
          "Wir speichern: den Namen, den du wählst, wann du dich angemeldet hast und zuletzt da warst, dass du bestätigt hast, mindestens 13 zu sein, und eine verschlüsselte Form der Kennung (Hash mit geheimem Schlüssel), damit wir dich wiedererkennen. Daraus lässt sich dein Discord- oder Google-Konto nicht zurückrechnen.",
          "Damit du angemeldet bleibst, setzen wir ein Cookie (Sitzung, 30 Tage nach deinem letzten Besuch) und während der Anmeldung zwei kurzlebige. Sie sind technisch notwendig, darum braucht es keinen Cookie-Banner. Tracking- oder Werbe-Cookies gibt es nicht.",
          "Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO. Ein Konto kannst du ab 13 Jahren anlegen."
        ]],
        ["Sperren", [
          "Konten, die gegen die Regeln verstoßen, können gesperrt werden. Wird ein gesperrtes Konto gelöscht, behalten wir nur dessen verschlüsselte Kennung, damit es sich nicht einfach neu anmelden kann (Art. 6 Abs. 1 lit. f DSGVO)."
        ]],
        ["Inhalte anderer Seiten", [
          "Einige Spiele laufen auf GitHub Pages (github.io), und die Benachrichtigungen zeigen Vorschaubilder von YouTube (Google). Beim Öffnen geht deine IP-Adresse an diese Dienste."
        ]],
        ["Deine Rechte", [
          "Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO). Deine Daten herunterladen und dein Konto löschen kannst du jederzeit selbst auf der Kontoseite, sofort.",
          "Außerdem kannst du dich bei einer Datenschutz-Aufsichtsbehörde beschweren."
        ]]
      ]
    }
  };

  function esc(x) {
    return String(x == null ? "" : x).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  function einbauen(el, sprache) {
    if (!el) return;
    const t = TEXTE[sprache] || TEXTE.en;
    el.innerHTML = '<article class="sp-recht">' +
      '<h1 class="sp-ideen__titel">' + esc(t.titel) + "</h1>" +
      '<p class="sp-konto__klein">' + esc(t.stand) + "</p>" +
      t.abschnitte.map(([titel, absaetze]) =>
        '<section><h2 class="sp-ueberschrift sp-ueberschrift--klein">' + esc(titel) + "</h2>" +
        absaetze.map((a) => "<p>" + esc(a) + "</p>").join("") + "</section>").join("") +
      "</article>";
  }

  window.MIWALE_DATENSCHUTZ = { einbauen, titel: (sprache) => (TEXTE[sprache] || TEXTE.en).titel };
})();
