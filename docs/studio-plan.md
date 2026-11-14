# Plan: miwale Studio (Spiele hochladen wie bei Steam/itch.io) und neue Verwaltung

Stand 2026-11-13. Ziel: Jeder kann ein im Browser spielbares Spiel auf miwale.com
hochladen, seine Store-Seite selbst gestalten und zur Prüfung einreichen. Admins
prüfen in einer neuen Verwaltung mit sicherem Login und bekommen bei jeder
Einreichung eine E-Mail.

## Entscheidungen (mit dem User geklärt)

- Entwickler melden sich mit **Discord/Google oder mit E-Mail + Passwort** an
  (dasselbe Konto-System wie Bewertungen und Game Requests).
- Admins haben **eigene Konten: Benutzername + Passwort + 2FA (TOTP)**.
- E-Mails gehen per **SMTP**; Zugangsdaten nur als Umgebungsvariablen auf dem Server.
- Die bestehenden Spiele bleiben im festen Katalog (`shop/spiele.js`). Neue Spiele
  kommen über das Studio. In der Verwaltung lassen sich für alle Spiele die
  Sichtbarkeit und die Hervorhebung einstellen.

## Sicherheitsgrundsätze

1. Hochgeladene Spiele sind fremder Code. Sie laufen **nur unter play.miwale.com**
   (`SPIELE_ADRESSE`), nie unter miwale.com. Ohne `SPIELE_ADRESSE` nimmt das Studio
   keine Uploads an, und miwale.com liefert `/community/` nicht aus.
2. Bilder und Videos werden an den ersten Bytes erkannt (PNG, JPEG, WebP, GIF, MP4,
   WebM). Kein SVG, kein HTML. Dateinamen vergibt der Server.
3. ZIP-Builds: Pfade ohne `..` und ohne absolute Pfade, Obergrenzen für Dateizahl,
   entpackte Größe und Kompressionsverhältnis. Entpackt wird in einen neuen Ordner
   mit zufälliger Kennung.
4. Admin-Passwörter mit scrypt, 2FA nach RFC 6238, Sitzung im Cookie
   `__Host-verwaltung` (HttpOnly, Secure, SameSite=Strict, 12 h). Tempobremse bei
   falschen Versuchen. Das alte Verwaltungs-Passwort dient nur noch dazu, das
   **erste** Admin-Konto anzulegen; danach gilt es nicht mehr.
5. E-Mail-Konten: scrypt, Bestätigungslink und Passwort-Reset per Mail, einmalige
   Tokens (nur der Hash wird gespeichert), Tempobremse je Adresse und E-Mail.

## Ablauf für Entwickler (wie Steamworks)

`/studio` zeigt die eigenen Projekte. Ein Projekt hat eine Checkliste:

1. **Store-Seite fertigstellen**: Name, Kurz- und Langbeschreibung, Genre, Tags,
   Sprachen, Features, Steuerung, Geräte, Grafiken (Icon, Header, Kapselbilder,
   mindestens 3 Screenshots, Trailer empfohlen).
2. **Inhalte & Altersfreigabe**: Fragebogen (Gewalt, Blut, Horror, sexuelle Inhalte,
   Glücksspiel, Mikrotransaktionen, KI-Inhalte, Online-Multiplayer, Nutzerdaten).
   Daraus ergibt sich eine Empfehlung 0/6/12/16/18 und die Inhaltshinweise.
3. **Datenschutz & Rechte**: Datenschutzhinweis (Pflicht, wenn Daten gesammelt
   werden) und Bestätigung der Rechte an Musik, Bildern und Code samt Lizenzangaben.
4. **Technische Angaben**: Engine, Eingabe, Seitenverhältnis, Internet nötig,
   Speichern im Browser.
5. **Build hochladen**: ZIP mit `index.html`. Testlauf in der Vorschau.
6. **Zur Prüfung einreichen**: Store-Seite und Build werden einzeln geprüft.
7. **Veröffentlichungsdatum festlegen**: „sofort nach Freigabe“ oder ein Datum
   (bis dahin „Demnächst“).
8. **Veröffentlichen**.

Nach der Veröffentlichung bearbeitet der Entwickler einen Entwurf. Änderungen an
Store-Seite oder Build gehen erst nach erneuter Prüfung live.

## Datenmodell (`/data/studio/projekte.json`)

```
projekt = {
  id, slug, besitzer (Konto-ID), erstellt, geaendert,
  status: "entwurf" | "eingereicht" | "abgelehnt" | "freigegeben" | "veroeffentlicht" | "gesperrt",
  entwurf: seite,           // was der Entwickler bearbeitet
  live: seite | null,       // was auf miwale.com steht
  builds: [{ id, hochgeladen, groesse, dateien, notiz, start }],
  entwurfBuild, liveBuild,  // Build-IDs
  einreichung: { zeit, build, notiz } | null,
  pruefung: { seite: null|"ok"|"abgelehnt", build: null|"ok"|"abgelehnt", nachricht, wer, zeit },
  verlauf: [{ zeit, wer, aktion, notiz }],
  veroeffentlichung: { modus: "sofort"|"datum", datum }
}
seite = { name, kurz, lang, genre, tags[], sprachen[], features[], steuerung, geraete[],
          entwickler, webseite, medien{ icon, header, kapsel, kapselKlein, kapselHoch, screens[], trailer },
          inhalt{ gewalt, blut, horror, sexuell, gluecksspiel, mikrotransaktionen, ki, kiText,
                  multiplayer, daten, datenText, datenschutzUrl, hinweise },
          technik{ engine, eingabe[], format, internet, speichern },
          rechte{ eigene, lizenzen, bestaetigt } }
```

## Schnittstellen

- `/api/studio/...` (server/studio.mjs): Projekte, Medien, Builds, Einreichen,
  Katalog (`/api/studio/katalog.js` für die Spieleseite), Einstellungen der Seite.
- `/api/verwaltung/...` (server/verwaltung.mjs): Admin-Login mit 2FA, Admin-Konten,
  Einstellungen, Postausgang. Die anderen Dienste akzeptieren die Admin-Sitzung.
- `/api/konto/email/...` (server/konten.mjs): Registrieren, Anmelden, Bestätigen,
  Passwort vergessen/zurücksetzen.
- server/post.mjs: SMTP (465 mit TLS oder 587 mit STARTTLS) und Postausgang.

## Verwaltung (`/admin/`)

- Login: Benutzername + Passwort, danach 6-stelliger Code. Ersteinrichtung mit dem
  alten Passwort, inklusive 2FA-Einrichtung.
- Reiter: **Einreichungen** (Store-Seite als Vorschau, Fragebogen, Build spielen,
  Checkliste, Seite/Build einzeln freigeben oder ablehnen mit Nachricht),
  **Spiele** (alle Spiele: verstecken, hervorheben, Community-Spiele sperren),
  **Seite** (Ankündigungsbanner, Studio offen/zu, Grenzen, Genres, Empfänger der
  E-Mails, Test-Mail), **Admins** (anlegen, 2FA zurücksetzen, entfernen),
  **Postausgang**, dazu die bisherigen Reiter (Bewertungen, Game Requests, Konten).

## Auslieferung

- nginx: `/api/studio/` (Uploads bis 512 MB, ungepuffert), `/api/verwaltung/`,
  `/studio`-Routen auf `index.html`. Auf play.miwale.com: `/community/<slug>/` aus
  `/data/studio/live/`, `/vorschau/<build>/` aus `/data/studio/builds/`, mit
  passenden Köpfen für Unity-Builds (.br/.gz, .wasm).
- Umgebung: `SMTP_HOST`, `SMTP_PORT`, `SMTP_BENUTZER`, `SMTP_PASSWORT`, `SMTP_ABSENDER`,
  `MELDUNG_AN`.

## Was auf dem Server noch fehlt (Tobias)

1. play.miwale.com im Ingress + certbot (siehe docs von Anmelden), `SPIELE_ADRESSE`.
2. SMTP-Zugang in die `.env`.
3. Erstes Admin-Konto unter miwale.com/admin anlegen (mit dem alten Passwort).

## Arbeitsschritte

1. Server: post.mjs, zip-lesen.mjs, verwaltung.mjs, studio.mjs, E-Mail-Konten. Tests.
2. Spieleseite: Community-Katalog einbinden, Spielseite mit Entwickler, Altersfreigabe,
   Inhaltshinweisen, Sprachen; E-Mail-Login im Konto-Bereich.
3. Studio-Oberfläche `/studio` (Dashboard, Editor, Vorschau, Checkliste).
4. Verwaltung neu: Login mit 2FA, Einreichungen, Spiele, Seite, Admins, Postausgang.
5. nginx, Dockerfile, Compose, README. Tests grün, lokal im Browser prüfen, live.
