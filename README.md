# miwale

Portfolio-Website von **miwale** — einem angehenden Ein-Personen-Game-Studio,
das Spiele mit KI-Unterstützung baut. Der Name steht für
**mi**chel · **wa**ggoner · **le**ipzig.

Dieses Repository enthält den Design-Stand der Seite: die Canvas-Dateien, das
Design System und alle Bild-Assets.

## Inhalt

| Pfad | Was es ist |
| --- | --- |
| `miwale Portfolio.dc.html` | Gemeinsame responsive Seite für Handy und Desktop, sechs Tabs |
| `support.js` | Laufzeit für die Canvas-Dateien |
| `_ds/miwale-design-system-…/` | miwale Design System: Tokens, Komponenten, Styles |
| `assets/` | Logo-Wordmarks und Wal-Maskottchen, je für hell und dunkel |
| `assets/games/` | Screenshots und Grafiken zu den Projekten |
| `assets/games/ph-*.svg` | Platzhalter für Projekte ohne Screenshot |
| `github.md` | Sync-Notiz: aus welchen Repos die Inhalte stammen |

## Aufbau der Seite

Auf allen Geräten: **Start · Projekte · Über mich · KI-Workflow · Devlog · Kontakt**.
Auf schmalen Bildschirmen werden die Inhalte einspaltig und die Navigation
horizontal scrollbar. Der Einstieg wählt keine separate Mobil-Datei mehr aus;
alte Mobil-Links werden auf dem Produktionsserver zur gemeinsamen Seite umgeleitet.

### Der Projekte-Tab

Auf dem Desktop bleibt oben der Tauchgang: Wortmarke, Scrollen, es wird dunkler.
Darunter liegen alle Projekte in einem **Wechselraster**. Vorn stehen die drei mit
einem **Trend-Rang**: Dropfall, Wavebreaker, Chromatic. Sie tragen in der oberen
Ecke ein Flammen-Abzeichen mit ihrer Nummer, warm getönt gegen die aqua Palette,
damit es als Feuer liest und nicht als zweites Statusschild. Den Rang setzt das
Feld `trend: 1|2|3` am Projekt; ohne das Feld bleibt das Abzeichen aus. Dahinter
folgen die übrigen nach Relevanz — was läuft und spielbar ist, steht weiter vorn. Jede Reihe trägt zwei Kacheln im
Verhältnis 5:7, und die nächste Reihe dreht es um: klein links und groß rechts,
dann groß links und klein rechts. Bleibt am Ende eine Kachel allein, nimmt sie
die ganze Breite. Unter 900 px Fensterbreite und auf dem Handy steht alles
untereinander.

Jede Kachel zeigt einen Screenshot als Hintergrund, leicht unscharf und
abgedunkelt; beim Überfahren wird er scharf. Der Farbschleier darüber wechselt
von Kachel zu Kachel zwischen **hellblau und weiß**. Welche Kachel welche Größe
und welchen Ton bekommt, entscheidet die Position in `PROJECTS` — nicht die
Stellung im DOM, sonst zählen Nachbarelemente mit. Davor stehen Name, eine Linie
und in Kapitälchen ein Halbsatz dazu, was das Projekt ist.

Beim Überfahren neigt sich die Kachel leicht zum Zeiger, die übrigen treten
zurück, ein Schimmer in der Akzentfarbe legt sich darüber, ein Lichtstreif läuft
einmal quer und am unteren Rand wächst eine Linie auf. Die Neigung kommt aus
einem `pointermove`-Listener am Fenster, alles Übrige aus CSS. Ohne Zeigergerät
und bei `prefers-reduced-motion` entfällt es.

### Die Startseite

Die Startseite spricht über **mich**, nicht über einzelne Projekte: kein
Projektname steht in ihren Texten. Wer welches Spiel ansehen soll, entscheidet
weiter unten der Abschnitt **„Gerade am beliebtesten"** — dort stehen dieselben
drei Trend-Projekte als Karten mit Flammen-Abzeichen, nebeneinander auf dem
Desktop, untereinander am Handy. Ein Klick springt in die Projekte und öffnet
direkt die Detailansicht.

Die frühere Kennzahlen-Strecke **„In Zahlen"** ist in beiden Fassungen entfallen,
ebenso der Schalter `showNumbers`. Die Glaskarte rechts im Desktop-Held zeigt
keine Zahlen mehr, sondern eine kurze Vorstellung und löst den Namen auf:
**mi**chel · **wa**ggoner · **le**ipzig.

### Die Leiste ueber den Kacheln

Drei Ebenen, von grob nach fein:

**Art** teilt zuerst auf: *Alle*, *Projekte*, *Spiele*. „Projekte" ist das, was
Arbeit ist — bislang allein das Bestellsystem; alles andere sind Spiele oder
Spielkonzepte. Das Feld dazu heisst `art`. Dass **Alle** dabei ist und der
Standard bleibt, ist Absicht: mit nur zwei Knoepfen waere beim Aufschlagen der
Seite immer eine Haelfte versteckt, und bei einem Verhaeltnis von 1 zu 10 waere
das die falsche.

**Sortieren nach** kennt drei Ordnungen. *Empfohlen* ist die feste Reihenfolge
aus `PROJECTS`, die drei mit Trend-Rang zuerst. *Zuletzt gebaut* geht nach dem
Feld `stand`, einem `JJJJ-MM` aus dem jeweiligen Zeitraum in den Eckdaten; was
keinen Stand hat, weil noch kein Baustart war, rutscht ans Ende statt nach vorn.
*Name A–Z* sortiert mit `localeCompare(..., "de")`, damit Umlaute und
Kleinschreibung richtig einsortiert werden.

**Filter** klappt Genre und Geraet auf. Der Knopf traegt die Zahl der gesetzten
Filter, damit im zugeklappten Zustand sichtbar bleibt, dass etwas aktiv ist.

### Filter nach Genre und Geraet

Ueber dem Kachelraster stehen zwei Reihen Knoepfe. **Genre** hat bewusst nur sechs
grobe Schubladen — Idle, Strategie, Karten, Lernspiel, Experiment, Anwendung —
damit jeder Knopf mehrere Projekte trifft; feinere Begriffe haetten meist nur
einen Treffer gehabt. **Spielbar auf** trennt Handy und PC.

Innerhalb einer Reihe gilt **oder**, zwischen den Reihen **und**: „Idle oder
Karten, und davon nur das, was am Handy laeuft". Jeder Knopf traegt seine
Trefferzahl, gezaehlt gegen die jeweils andere Reihe — die Zahl zeigt also, was
ein Klick wirklich braechte. Findet eine Auswahl nichts, steht dort ein Hinweis
statt einer leeren Flaeche.

`geraete` steht nur an dem, was sich wirklich spielen laesst. Von den sechs
Browserspielen laeuft bislang allein **Dropfall** am Handy; die uebrigen fuenf
sind auf PC gesetzt. Projekte ohne Spielfassung — das Bestellsystem, die
Lernspiele, das Design-Dokument — tragen gar kein `geraete` und tauchen unter
keinem der beiden Geraeteknoepfe auf. Das ist gewollt: man kann sie nirgends
spielen.

Die Filter stehen bewusst **nicht** in der Adresse. Sonst legte jeder Knopfdruck
einen Verlaufseintrag an und die Zurueck-Taste kaeme nicht mehr aus den Projekten
heraus.

Auf dem Desktop rechnet das Wechselraster mit der **gefilterten** Laenge, nicht
mit der vollen Projektzahl — sonst bekaeme die letzte Kachel einer ungeraden
Auswahl nie die volle Breite.

### Die Detailseite

Drei Spalten: links das Hauptbild in einem Glasrand mit Pfeilen, in der Mitte
eine schmale senkrechte Spalte mit den Miniaturen, rechts die Textspalte.
Hauptbild und Zusatzbilder bilden eine gemeinsame Galerie, der Zustand `bild`
sagt, welches groß zu sehen ist. Die mittlere Spalte ist mit 126 px fest, damit
das Bild groß bleibt; passen mehr Miniaturen nicht ins Bild, scrollt sie.

In der Textspalte stehen Name und Beschreibung auf je einer Glasfläche, und
direkt darunter nebeneinander zwei gleich hohe Blöcke: links **Spielen**, rechts
die **Eckdaten** mit zweispaltigen Kennzahlen. Der Spielen-Knopf ist selbst eine
Glasfläche (`.mw-spielen`), keine Pille darauf — aqua getönt, damit er als
Hauptaktion liest. Gibt es kein Browserspiel, nehmen die Eckdaten über
`:only-child` die ganze Breite. Erst darunter folgt „Wie und wann gebaut" über
die volle Breite, dann die Links.

Die drei Spalten bekommen ihre `grid-column` ausdrücklich zugewiesen. Ohne das
rutschte bei Projekten ohne Zusatzbilder — die mittlere Spalte entfällt dann —
die Textspalte in die 126 px schmale Miniaturenspalte. `.mw-detail__bild +
.mw-detail__text` fängt genau diesen Fall ab und lässt den Text die freie Spalte
mitnehmen.

Die Glasflächen (`.mw-glas`) sind ein Nachbau von **LiquidGlassCard** von
dorianbaffier (kokonutui.com, MIT): ein SVG-Verzerrungsfilter aus `feTurbulence`
und `feDisplacementMap` liegt als `backdrop-filter` auf einer eigenen Ebene und
bricht den Hintergrund, darüber zeichnen gestapelte Inset-Schatten die Glaskante.

Wichtig ist die Füllung: **keine eigene dunkle Farbe**, sondern eine dünne helle
Scheibe (`rgba(255,255,255,.10)` über `blur(18px) saturate(1.6) brightness(1.06)`).
So nimmt das Glas an, was dahinter liegt, und hebt es nur leicht an — auf dem
hellen Wasser wird es hell, im dunklen Bereich dunkel. Eine feste dunkle Füllung
sah wie ein aufgeklebtes Rechteck aus.

Weil die Scheibe hell ist, wurde der Kontrast der weißen Schrift nachgemessen:
Titel 3,6:1 bei 48 px (Grenze für große Schrift 3:1), Fließtext 4,68:1
(Grenze 4,5:1), Eckdaten 12,8:1. Wer die Füllung heller macht, sollte das
erneut prüfen.

Der Filter wird in `glasFilterEinsetzen()` per JS erzeugt und nicht in die
Vorlage geschrieben: beim HTML-Parsen würden Attributnamen wie `baseFrequency`
kleingeschrieben und der Filter bliebe wirkungslos. Die Verzerrung läuft mit
`scale: 14` statt der Vorlagen-30 — auf großen Flächen schmiert der höhere Wert.
Wo `backdrop-filter: url()` nicht unterstützt wird (Safari, Firefox), fällt nur
die Brechungsebene aus; Unschärfe und Kante bleiben.

Die `GlassCard` des Design Systems ist weiterhin auf den übrigen Tabs im
Einsatz — ersetzt wurde sie nur auf der Detailseite.

Ein Klick öffnet keine fremde Seite und startet auch nicht direkt das Spiel,
sondern eine **Detailseite**: Hauptscreenshot und Galerie oben, darunter „Wie und
wann gebaut" mit Eckdaten, und ganz unten die Links zum jeweiligen Repository.
Wo ein Spiel im Browser läuft, sitzt dort zusätzlich „Jetzt im Browser spielen"
und öffnet es als Overlay. Mobil übernimmt dieselbe Rolle ein Sheet von unten.

Beide Fassungen lesen dieselbe Liste `PROJECTS`, die in jeder Datei einmal im
`<script type="text/x-dc">`-Block steht. Ein neues Projekt braucht dort einen
Eintrag — in beiden Dateien, sie werden nicht geteilt.

Enthalten sind zwoelf Projekte, in dieser Reihenfolge: Dropfall, Wavebreaker,
Chromatic, Reliktenschieber, XRAI Order System, Runecall, Harmonics, Dungeons & Diplomas,
Michis Mathe Universe, mindforge-playground, The Last Outpost und der
Flappy-Prototyp. Die ersten drei sind die mit Trend-Rang.

Der Devlog-Tab steht bewusst auf „bald" und bleibt leer, bis es echte Einträge
gibt.

## Spieleseite (miwale.com)

`miwale.com/` ist die Spieleseite fuer Spieler, die zum Beispiel aus einem
YouTube-Short kommen. Aufgebaut wie ein Spieleshop, aber ohne Preise:

- **Highlights** oben: grosses Bild oder Trailer, daneben Name, darunter das
  Trend-Abzeichen, Kurztext, Screenshots (Ueberfahren zeigt sie gross), Tags
  und ein Play-Knopf. Wechselt alle 9 s. Die Buehne hat eine feste Hoehe
  (`--sp-hl-hoehe`, nur von der Fensterbreite abhaengig), damit beim Wechsel
  nichts springt. Links und rechts schaut das vorige und naechste Spiel
  herein und verblasst zum Rand hin; ab 1330 px Breite, darunter fehlt der Platz.
- **Beliebt & neu** in einem Kasten: je Seite zwei hohe und zwei kleine Karten,
  ein Pfeil blaettert weiter. Die Nachbarseite schaut links und rechts
  verschwommen herein (`--sp-reihe-guck`). Am Handy eine Wischleiste.
- **Suche** in der Kopfzeile: trifft auf Name, Tags und Kurztext; Pfeiltasten
  und Enter waehlen, Escape leert.
- **Alle Spiele** in einem Kasten: Liste mit Bild, Genres und Veroeffentlichung; beim
  Ueberfahren zeigt rechts eine Vorschau Trailer, Screenshots und Beschreibung.
- **Spielseite** `/games/<id>`: Galerie, Eckdaten, Play-Box, "Ueber das
  Spiel", Features, Steuerung und rechts aehnliche Spiele (gleiche Tags).
  `/games/<id>/spielen` oeffnet das Spiel im Vollfenster.

Dateien: `index.html` (Rahmen), `shop/shop.js` (Seite), `shop/shop.css`,
`shop/spiele.js` (Katalog). Der Katalog ist bewusst getrennt von `PROJECTS` im
Portfolio: dort stehen technische Texte, hier Texte fuer Spieler. Neue Spiele
von GitHub kommen von selbst dazu (`shop/spiele-auto.js`, siehe "Spiele von
GitHub"); ein handgeschriebener Eintrag hier ersetzt den automatischen. Nicht im Katalog stehen Projekte, die man
nicht spielen kann (Bestellsystem, Dungeons & Diplomas mit kaputter Anmeldung,
mindforge, The Last Outpost, Flappy).

Trailer und Screenshots im Querformat liegen unter `assets/games/shop/`. Ohne
eigene Aufnahmen faellt die Seite auf die Bilder aus `bilder` zurueck.
Screenshots als WebP, Trailer als VP9-WebM mit hoechstens 960×540 (siehe
"Ladezeit").

Oben rechts fuehrt **Portfolio →** nach `/portfolio`. `/games` leitet auf `/` um.

### Bewertungen

Jede Spielseite (`/games/<id>`) hat ganz unten, unter den Beschreibungen, einen
Bewertungsbereich wie bei Steam: Ja oder Nein zur Empfehlung, dazu freiwillig
ein oeffentlicher Satz und ein privates Feedback, das nur die Verwaltung sieht.
Die Oberflaeche steht in `shop/bewertungen.js` und `shop/bewertungen.css`;
`shop.js` legt nur den leeren Abschnitt an und ruft sie auf.

- **Daumen ohne, Text mit Konto.** Den Daumen und das private Feedback gibt es
  ohne Konto: Jedes Geraet bekommt beim ersten Besuch eine zufaellige Kennung im
  localStorage, pro Spiel zaehlt eine Stimme je Kennung. Oeffentlicher Text
  braucht ein Konto und steht mit dessen Namen da. Wer sich anmeldet, nimmt die
  Bewertung seines Geraets mit. Bewertungen erscheinen sofort.
- **Schutz.** Wortsperrliste auf Englisch und Deutsch, die auch Schreibweisen
  wie `sh1t` oder `s h i t` erkennt; verstecktes Feld gegen Bots; hoechstens 20
  schreibende Anfragen je Adresse in zehn Minuten. Adressen werden nur als
  Pruefsumme gespeichert.
- **Urteil.** Ab fuenf Stimmen steht ein Urteil wie "Very positive", darunter
  nur Prozent und Anzahl.
- **Dienst.** `server/bewertungen.mjs`, ohne Abhaengigkeiten, laeuft im selben
  Container neben nginx auf `127.0.0.1:8081` (gestartet von
  `server/start.mjs` aus `docker/40-dienste.sh`, startet sich nach einem Absturz selbst neu). nginx
  reicht `/api/bewertungen/` durch. Welche Spiele bewertet werden duerfen, liest
  der Dienst beim Start aus `shop/spiele.js`. Gespeichert wird in `/data`.
- **Verwaltung unter `/admin/`.** Alle Bewertungen samt privatem Feedback,
  Text oder ganze Bewertung loeschen, oeffentlich als Entwickler antworten,
  Sperrliste pflegen. Das Passwort kommt aus `BEWERTUNGEN_ADMIN_PASSWORT`; ohne
  die Variable bleibt die Verwaltung gesperrt.
- **Lokal.** `npm run dev` bedient auch die Bewertungen; sie landen in
  `.bewertungen-dev/`, das Passwort fuer `/admin/` ist `dev`.

### Game Requests

Zweiter Reiter neben Home, fuer das Format "I build your game ideas in one day".

- **`/requests`** zeigt zuerst die oeffentlichen Ideen anderer, jede mit Pfeil
  hoch und runter. Reiter *Top* (nach Punkten), *New* und *Your ideas* (die
  eigenen, auch private, mit Stand und Nachricht von miwale; dort laesst sich
  eine Idee privat oder oeffentlich schalten oder zurueckziehen). Nach dem
  Abstimmen bleibt die Reihenfolge stehen, bis man neu laedt oder den Reiter
  wechselt, damit keine Karte unter dem Finger wegspringt. Oben rechts der
  Knopf **Submit your idea**.
- **`/requests/new`** ist das Formular: Name, Genre, Plattform, Beschreibung,
  bis zu vier Skizzen oder Screenshots. Dann ohne Vorauswahl **oeffentlich**
  (alle sehen die Idee und stimmen ab) oder **privat** (nur die Verwaltung).
  Drei Haken: erwaehnt werden (nur dann fragt das Formular nach Name oder
  @Handle, und nur dann wird er gespeichert), das fertige Spiel darf auf
  miwale.com erscheinen, und Pflicht: Idee und Spiel gehoeren miwale, nicht
  dem Einsender. Den Zeitpunkt dieser Bestaetigung speichert der Dienst.
  Eigene Adresse, damit die Zurueck-Taste am Handy das Formular schliesst.
- **Abstimmen.** Eine Stimme je Geraet und Idee, nochmal tippen nimmt sie
  zurueck, fuer die eigene Idee geht es nicht. Wer wie gestimmt hat, sieht
  niemand.
- **Oeffentlich heisst sofort sichtbar**, wie bei den Bewertungen. Nur die
  **Bilder** oeffentlicher Ideen erscheinen erst, wenn die Verwaltung sie
  freigibt; bis dahin steht "images waiting for review" da. Der Einsender sieht
  seine Bilder immer.
- **Bilder.** Der Browser rechnet sie vor dem Hochladen klein (hoechstens
  1600 px, unter 900 KB, WebP oder JPEG) und neu, das entfernt auch
  Standortdaten aus Handyfotos. Jedes Bild geht einzeln an
  `POST /api/ideen/bild`, damit keine Anfrage 1 MB ueberschreitet. Der Dienst
  prueft den Bildtyp am Inhalt, legt die Dateien in `/data/ideen-bilder/` und
  raeumt Bilder weg, die nach einem Tag noch keiner Idee gehoeren. Insgesamt
  hoechstens 2 GB.
- **Einreichen nur mit Konto.** Ansehen und abstimmen kann jeder, einreichen
  nur angemeldet. Ohne Konto steht statt des Formulars "Sign in to send a game
  request"; der Entwurf bleibt.
- **Schutz.** Dieselbe Wortsperrliste wie bei den Bewertungen, verstecktes Feld
  gegen Bots, je Adresse (Einreichen und Bilder auch je Konto) in zehn Minuten
  hoechstens 8 Einreichungen, 24 Bilder und 150 Stimmen, hoechstens 10
  unbearbeitete Ideen je Konto.
- **Entwurf.** Der Text bleibt bis zum Absenden im localStorage; am Handy laedt
  die Seite manchmal neu, wenn man zum Bildauswaehlen in die Galerie wechselt.
  Den Rechte-Haken merkt er sich absichtlich nicht.
- **Verwaltung.** Reiter "Game Requests" unter `/admin/`, dasselbe Passwort:
  Stand setzen, oeffentliche Ideen ausblenden, Bilder freigeben (Kachel
  "Bilder zu prüfen" und Filter), Nachricht an den Einsender, Link zum Video
  oder Spiel, loeschen. Private Ideen kann die Verwaltung nicht oeffentlich
  machen. Zu jeder Idee stehen die drei Haken des Einsenders dabei.

Dateien: `shop/ideen.js`, `shop/ideen.css`, `server/ideen.mjs`, Tests in
`tools/ideen.test.mjs`.

**Wem gehoert was.** Ideen gehoeren einem Konto (`besitzer: "konto:<id>"`).
Stimmen gehen auch ohne Konto: dann je Geraet (`"geraet:<id>"`, die Kennung aus
`shop/identitaet.js`), angemeldet je Konto. Beides entscheidet `besitzerVon()`
in `server/gemeinsam.mjs`.

Bewertungen, Game Requests und Konten laufen in einem Node-Prozess
(`server/start.mjs`, gestartet von `docker/40-dienste.sh`) und teilen Hilfen aus
`server/gemeinsam.mjs`.

### Konten

Spielen geht immer ohne Konto. Eines braucht nur, wer eine Bewertung mit Text
schreibt oder einen Game Request schickt. Oben rechts steht "Sign in" bzw. der
Name; `/account` ist die Kontoseite, `/privacy` die Datenschutzerklaerung.
Dienst in `server/konten.mjs`, Oberflaeche in `shop/konto.js` und
`shop/identitaet.js`.

- **Anmelden nur mit Discord oder Google** (OAuth 2.0 mit PKCE, ganz auf dem
  Server). Es gibt keine Passwoerter und keine E-Mail-Adressen. Von Discord wird
  nur `identify`, von Google nur `openid` erfragt. Die Kennung des Anbieters
  wird sofort mit einem Geheimnis des Servers gehasht (HMAC, Datei
  `/data/konten-geheimnis`); gespeichert werden nur dieser Hash, der gewaehlte
  Name, Zeitpunkte und die Bestaetigung "mindestens 13".
- **Namen.** 3-20 Zeichen aus `A-Z a-z 0-9 _ -`, eindeutig ohne Ruecksicht auf
  Gross/klein, nichts mit "miwale", "admin" u. ae., Wortsperrliste gilt auch hier.
- **Sitzung.** Zufaelliges Token im Cookie `__Host-sitzung` (HttpOnly, Secure,
  SameSite=Lax), auf dem Server nur als SHA-256. 30 Tage ab dem letzten Besuch.
  Abmelden, auf allen Geraeten abmelden.
- **Fremde Seiten.** Jede aendernde Anfrage an `/api/` muss `Origin:
  https://miwale.com` tragen und darf laut `Sec-Fetch-Site` nicht von einer
  anderen Adresse kommen (`herkunftOk()` in `server/gemeinsam.mjs`).
- **Selbst loeschen und Auskunft.** Auf `/account`: Daten als JSON
  herunterladen, Konto loeschen (samt Bewertungen, Game Requests und Bildern,
  sofort).
- **Verwaltung.** Reiter "Konten" unter `/admin/`: sperren, entsperren,
  loeschen. Gesperrte Konten schreiben nichts mehr; loescht sich ein gesperrtes
  Konto, bleibt nur sein Hash, damit es nicht neu anfaengt. Bei jeder Bewertung
  und jedem Game Request steht, von welchem Konto er kommt, samt "Konto sperren".
- **Lokal.** `npm run dev` bietet eine Test-Anmeldung an ("Test sign-in (local
  only)"): beliebige Kennung eingeben, gleiche Kennung = gleiches Konto. Die gibt
  es nur in `tools/dienste-dev.mjs`, nie im Container, und nur vom eigenen
  Rechner aus (nicht vom Handy im WLAN).

### Spiele unter eigener Adresse (play.miwale.com)

Die Spiele laufen im iframe. Laegen sie unter `miwale.com`, haetten sie dieselben
Rechte wie die Seite: Ein fehlerhaftes oder boeswilliges Spiel (sie kommen auch
automatisch von GitHub) koennte im Namen eines angemeldeten Besuchers schreiben
oder sein Konto loeschen. Darum bekommen sie eine eigene Adresse.
`docker/nginx.conf` hat dafuer einen zweiten Server-Block `play.*`, der nur
`/games/` ausliefert, keine Dienste und keine Verwaltung.

Solange `SPIELE_ADRESSE` leer ist, laufen die Spiele wie bisher unter
`miwale.com` -- und **Anmelden ist aus** (`server/start.mjs` bietet dann keinen
Anbieter an). Konten gibt es erst, wenn die Spiele getrennt laufen.

**Uebergang.** Solange kein Anbieter aktiv ist, laufen Bewertungen und Game
Requests wie vor den Konten: Text und Einreichen gehen ohne Konto, je Geraet,
der Knopf "Sign in" ist ausgeblendet (`kontenPflicht()` in
`server/gemeinsam.mjs`, `kontenAktiv()` in `shop/identitaet.js`). Sobald
Discord oder Google eingerichtet ist, braucht Schreiben ein Konto, und was ein
Geraet vorher eingereicht hat, uebernimmt das Konto beim ersten Anmelden auf
diesem Geraet. Lokal zeigt `MIWALE_OHNE_KONTEN=1 npm run dev` diesen Zustand. Mit `SPIELE_ADRESSE=https://play.miwale.com` zeigt das
Spielfenster dorthin, und `miwale.com/games/<id>/...` leitet um
(`docker/30-umgebung.sh`). Spielstaende im localStorage haengen an der Adresse:
Wer schon unter `miwale.com` gespielt hat, faengt unter `play.miwale.com` neu an.

#### Anmelden einschalten (Checkliste)

Alles kostenlos. Reihenfolge einhalten: ohne getrennte Spiele-Adresse bleibt
Anmelden aus, auch wenn die Zugänge gesetzt sind.

1. **Spiele-Adresse.** DNS: `play.miwale.com` auf denselben Server wie
   `miwale.com`. Im Ingress (`dev-cloud-server-config`, campsite-nginx) einen
   Server-Block für `play.miwale.com` mit TLS, der wie `miwale.com` an den Container
   `miwale:8080` weiterleitet und den `Host` mitschickt. Prüfen:
   `curl -I https://play.miwale.com/games/wavebreaker/` → 200,
   `curl -I https://play.miwale.com/` → 404.
2. **Google.** [console.cloud.google.com](https://console.cloud.google.com) → neues
   Projekt → „APIs & Dienste“ → „OAuth-Zustimmungsbildschirm“: Typ *Extern*, App-Name
   „miwale“, Support-Mail, autorisierte Domain `miwale.com`, Datenschutz-Link
   `https://miwale.com/privacy`; nur der Bereich `openid`. Dann „Anmeldedaten“ →
   „OAuth-Client-ID“ → *Webanwendung*, autorisierte Weiterleitungs-URI genau
   `https://miwale.com/api/konto/rueckruf/google`. Client-ID und -Secret notieren.
   Den Zustimmungsbildschirm auf „In Produktion“ stellen, sonst dürfen sich nur
   eingetragene Testnutzer anmelden.
3. **Discord.** [discord.com/developers/applications](https://discord.com/developers/applications)
   → „New Application“ („miwale“, Logo) → „OAuth2“: Redirect genau
   `https://miwale.com/api/konto/rueckruf/discord`. Client-ID und (mit „Reset Secret“)
   das Secret notieren. Kein Bot, keine weiteren Rechte.
4. **Server.** In die `.env` neben `deploy/docker-compose.prod.yml` (nie ins Repo):
   ```
   SPIELE_ADRESSE=https://play.miwale.com
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   DISCORD_CLIENT_ID=...
   DISCORD_CLIENT_SECRET=...
   BEWERTUNGEN_ADMIN_PASSWORT=<lang und zufällig, z. B. openssl rand -base64 33>
   ```
   Dann `docker compose -f docker-compose.prod.yml up -d`. Das Log darf keine
   Zeile „Anmelden ist aus“ mehr zeigen (`docker logs miwale | head`).
   Kürzer: `deploy/anmelden-einschalten.sh` erledigt Schritt 4 und 5 in einem
   Lauf (fragt die Secrets verdeckt ab, prüft vorher `play.miwale.com`):
   ```
   cd /home/tobias/projects/miwale
   curl -fsSLO https://raw.githubusercontent.com/milchinien/miwale/main/deploy/anmelden-einschalten.sh
   bash anmelden-einschalten.sh
   ```
5. **Prüfen.** `curl -s https://miwale.com/api/konto/ich` zeigt
   `"anbieter":["discord","google"]`. Auf der Seite erscheinen „Sign in“, die Reiter
   „Pearl Shop“ und „Profile“; einmal mit jedem Anbieter anmelden, Namen wählen,
   abmelden, wieder anmelden (dasselbe Konto), Daten herunterladen, ein Testkonto löschen.
6. **Backup.** Das Volume `miwale-bewertungen` (`/data`: Konten, Profile, Bewertungen,
   Game Requests, `konten-geheimnis`) gehört ins nächtliche Backup. Geht
   `konten-geheimnis` verloren, erkennt der Server niemanden wieder.

Sicherheit kurz: Secrets nur in der `.env` auf dem Server; ein geleaktes Secret im
Google- bzw. Discord-Portal sofort neu erzeugen und in der `.env` tauschen. Die
Rückkehr-Adressen sind fest eingetragen, fremde Ziele lehnt der Anbieter ab.

### Sicherheits-Koepfe

`docker/sicherheit.conf` fuer alles (nosniff, Referrer-Policy, X-Frame-Options,
Permissions-Policy, HSTS), `docker/sicherheit-seite.conf` zusaetzlich fuer die
Spieleseite mit einer Content-Security-Policy ohne eingebettete Skripte. Die CI
prueft beides.

**Produktion einmalig einrichten.** Auf dem Server neben
`docker-compose.prod.yml` eine `.env` mit `BEWERTUNGEN_ADMIN_PASSWORT=...`
anlegen und die aktualisierte Compose-Datei dorthin kopieren. Sie bindet das
Volume `miwale-bewertungen` an `/data`. Ohne Volume sind alle Bewertungen nach
dem naechsten Deployment weg.

**Konten einrichten** (einmalig, kostenlos). Die Reihenfolge ist wichtig:
ohne `play.miwale.com` bleibt Anmelden aus.

1. **play.miwale.com:** DNS-Eintrag wie fuer `miwale.com` und im Ingress
   (`dev-cloud-server-config`, campsite-nginx) einen Server-Block fuer
   `play.miwale.com` mit TLS, der wie `miwale.com` an `miwale:8080` weitergibt
   und den Host mitschickt (`proxy_set_header Host $host`). Pruefen:
   `https://play.miwale.com/games/wavebreaker/` laedt. Dann
   `SPIELE_ADRESSE=https://play.miwale.com` in die `.env`.
2. **Discord:** <https://discord.com/developers/applications> -> New
   Application -> OAuth2. Redirect `https://miwale.com/api/konto/rueckruf/discord`
   eintragen. Client ID und Client Secret in die `.env`:
   `DISCORD_CLIENT_ID=...`, `DISCORD_CLIENT_SECRET=...`.
3. **Google:** <https://console.cloud.google.com/> -> neues Projekt -> "Google
   Auth Platform" -> Branding (App-Name miwale, Support-Mail) -> Zielgruppe
   "Extern" -> Clients -> "Webanwendung". Autorisierte Weiterleitungs-URI
   `https://miwale.com/api/konto/rueckruf/google`. Nur der Bereich `openid`
   wird gebraucht, dafuer ist keine Google-Pruefung noetig. In die `.env`:
   `GOOGLE_CLIENT_ID=...`, `GOOGLE_CLIENT_SECRET=...`.
4. `docker compose -f docker-compose.prod.yml up -d`. Fehlt ein Anbieter, bietet
   die Seite ihn einfach nicht an.
5. **Backup:** `/data` (Volume `miwale-bewertungen`) naechtlich sichern, z. B.
   `docker run --rm -v miwale-bewertungen:/data -v /backup:/b alpine tar czf /b/miwale-$(date +%F).tgz -C /data .`
   per Cron. Die Sicherung enthaelt `konten-geheimnis` -- so geschuetzt ablegen
   wie die `.env`.

Secrets gehoeren nur in die `.env` auf dem Server, nie ins Repository.

## Game Style Library (miwale.com/styles)

Eine offene Seite **für KIs**: 33 fertige Grafik-Styles, so genau beschrieben,
dass eine KI sie für ein eigenes Projekt übernehmen kann. Viele KIs erfinden
schlechte Styles; hier kopieren sie einen, der funktioniert. Es geht **nur um
Design**: Texte, Specs und Vorschauen erwähnen kein Spiel und keine
Spielmechanik (der Test prüft das über `GAME_WORDS` in `tools/styles-lib.mjs`).
Die Texte sind englisch.

Jeder Style ist in sechs trennbare **Design-Elemente** zerlegt: World,
Characters, Props, Effects, Atmosphere, UI & type. Palette und Render-Technik
gelten für alle.

Jeder Style liegt in `public/styles/library/<id>/` mit drei handgeschriebenen
Dateien – das Format steht in `public/styles/library/AUTHORING.md`:

| Datei | Inhalt |
| --- | --- |
| `STYLE.md` | Die vollständige Spec mit festen Abschnitten, je einer pro Element, dazu Palette, Schriften, Technik, Do/Don't, Rezept, Code, Performance, fertiger Prompt |
| `spec.json` | Dieselben Fakten als Tokens, nach Elementen gruppiert (`world`, `characters`, `props`, `effects`, `atmosphere`, `ui`) |
| `starter.js` | Starter-Code ohne Abhängigkeiten: Palette, Kern-Techniken und `draw(ctx, w, h, t)` |

Die visuelle Referenz jedes Styles ist das Modul `public/styles/js/styles/<id>.js`.

### Seiten

| Adresse | Was |
| --- | --- |
| `/styles/` | Galerie mit Filter, Suche, Mixer-Einstieg und „My designs“ |
| `/styles/<id>/` | Eigene Seite pro Style: Live-Szene, Standbilder, dann je Element ein Abschnitt mit eigener Live-Vorschau, Spec, Tokens und „Copy … spec“; danach Technik und Prompt |
| `/styles/mix/` | **Mix your own design**: pro Element einen Quell-Style wählen, Live-Vorschau, speichern, Link, Prompt |
| `/styles/design/?name=…&w=…&c=…&p=…&e=…&a=…&u=…` | Seite eines gemischten Designs (teilbarer Link) |
| `/styles/stage.html` | Die Vorschau-Engine (in Iframes eingebettet) |

`stage.html` (`js/stage.js`) lädt die Original-Module und baut daraus einen
zusammengesetzten Style: jeder Hook kommt aus dem Style, der für sein Element
gewählt ist (`?world=…&chars=…&props=…&fx=…&atmo=…&ui=…`, oder `?style=<id>`
für alle). `&view=` zeigt das ganze Design (`scene`) oder ein Element allein
(`world`, `characters`, `props`, `effects`, `atmosphere`, `ui`). Zwei Regeln
machen das Mischen stabil:

- `drawGroundOverlay` bereitet in vielen Modulen das Bild vor (Kamera-Versatz
  der Pixel-Blits, Lichtkarten, Nebel). Es läuft für jeden beteiligten Style;
  wo dessen Boden nicht zu sehen ist, gegen einen stummen Kontext.
- Ist ein Element Pixel-Art, läuft der ganze Mix in dessen Pixelraster –
  Pixel-Module blitten in Art-Pixeln und würden auf einer HD-Welt schrumpfen.

Gespeicherte Mixe liegen im `localStorage` des Browsers
(`miwale-style-mixes`); geteilt wird über den Link.

### Bewertungen und Ranglisten

Alles lässt sich mit Daumen hoch oder runter bewerten, ohne Konto, eine Stimme
je Gerät (dieselbe Gerätekennung `miwale-geraet` wie bei den Spielbewertungen):

| Ziel | Wo | Wirkung |
| --- | --- | --- |
| `style:<id>` | Kacheln der Galerie, Kopf der Style-Seite | Galerie sortiert standardmäßig nach Beliebtheit, die Top 3 tragen Abzeichen |
| `el:<id>:<element>` | jeder Element-Abschnitt, Mixer („Rate the … of …“) | Im Mixer stehen je Element die beliebtesten Quellen vorn |
| `mix:<id>` | Community-Designs | Rangliste der Community-Designs (Mixer und Startseite) |

Gereiht wird nach der unteren Grenze des Wilson-Intervalls (95 %), damit drei
von drei Stimmen nicht vor 90 von 100 stehen. Aus dem Mixer lässt sich ein Mix
**in die Community veröffentlichen** (Name mit Wortfilter, mindestens zwei
Quell-Styles; gleiche Mixe gibt es nur einmal). Dienst: `server/stimmen.mjs`
unter `/api/stimmen/`, im selben Prozess wie die Bewertungen, Datei
`stimmen.json` im Datenordner. Welche Styles es gibt, liest er aus
`styles/styles.json` (`STIMMEN_KATALOG`). Verwaltung: `GET`/`DELETE
/api/stimmen/admin/mixe[/<id>]` mit dem Passwort der Verwaltung als Bearer.
Tests: `node --test tools/stimmen.test.mjs`.

### Styles für die Bibliothek und Vorschaubilder

Neben den 20 Styles des Game-Jam-Prototyps gibt es Styles, die eigens für die
Bibliothek entstanden sind (`ORIGINALS` in `tools/styles-lib.mjs`, in der
Galerie „✦ New“). Einige davon sind **Varianten** (`VARIANTS` in
`tools/styles-lib.mjs`): Sie bauen auf der Technik eines vorhandenen Styles
auf, sehen aber deutlich anders aus; Galerie und Style-Seiten verweisen
gegenseitig darauf („⟲ Variant of …“). Ein Style ist immer ein Modul in `js/styles/<id>.js`, das
in `play.html` eingetragen ist.

`node tools/shots-styles.mjs <id> | --all` erzeugt die fünf Vorschaubilder
in `shots/` – nur Design, ohne Spiel-HUD: Szene und dichte Szene
(`stage.html`, `&dense`), Weitsicht (Kartenmodus von `play.html`), UI-Kit
(`stage.html?view=ui`) und eine Nahaufnahme. Chromium kodiert das WebP selbst.
Danach rechnet es für jedes neue Bild eine 800 px breite Fassung nach
`shots/klein/` (`tools/shots-klein.mjs`, einzeln: `node tools/shots-klein.mjs`).
Galerie, Mixer und Collagen laden nur diese; die großen Shots (bis 600 KB)
laden erst die Detailseiten und die Lightbox. Der Style-Test schlägt fehl,
wenn eine kleine Fassung fehlt.

`node tools/build-styles.mjs` erzeugt aus den Library-Ordnern `styles.json`,
`llms.txt`, `llms-full.txt`, die Seiten `/styles/<id>/` und `/styles/design/`
(aus der Vorlage `design.html`, mit vorgerenderter Spec für Leser ohne JS) und
die statische Linkliste in `index.html`. nginx liefert die Spec-Dateien als
UTF-8-Text mit `Access-Control-Allow-Origin: *` aus.

Prüfen:

```bash
node --test tools/styles.test.mjs   # Schema, Elemente, Design-only-Wortwahl, generierte Dateien aktuell (CI)
node tools/check-styles.mjs [id]    # zusätzlich im Browser: starter.js zeichnet, Vorschau-PNG zum Vergleichen
```

Ein neuer Style: Modul nach `js/styles/`, Screenshots nach `shots/`, Ordner
`library/<id>/` nach `AUTHORING.md`, Gruppe in `GROUPS` von
`tools/build-styles.mjs`, dann `node tools/build-styles.mjs`.

## Dev-Zentrale (miwale.com/dev)

Zeigt alle Projekte und die laufenden Dev-Server (localhosts) des Rechners,
an dem man gerade sitzt, und startet oder stoppt sie. Die Seite selbst weiss nichts ueber
Geraete: `public/dev/zentrale.js` fragt im Browser den **Agenten** auf
`127.0.0.1:5300` (`public/dev/agent.mjs`, ohne Abhaengigkeiten). Wer keinen
hat, sieht nur die Anleitung.

- **Einrichten, einmal pro Windows-Rechner:** auf der Seite "Kopieren", dann
  `Win+R`, `Strg+V`, `Enter`. `public/dev/installieren.ps1` legt den Agenten
  nach `%LOCALAPPDATA%\miwale-dev`, in den Autostart und ins Startmenue mit
  dem Kuerzel **Strg+Alt+D** (oeffnet die Seite). Im Repo:
  `pnpm zentrale:installieren`.
- **Projekte** findet der Agent selbst, auf allen Laufwerken (7 Ebenen tief,
  installierte Programme wie der Unity-Editor werden uebersprungen). Ein
  Projekt ist ein Ordner mit `package.json`, `project.godot`, Unity-Projekt,
  `Cargo.toml`, `CMakeLists.txt`, `.sln`, `pyproject.toml`, `index.html` oder
  `.git` (`erkenneArt`). Gestartet werden kann, was ein Skript `dev`, `start`,
  `serve` oder `develop` hat -- auch eine Ebene tiefer: Ein Git-Ordner mit
  genau einem Dev-Server darunter (`Traffic Simulator/prototypes`) ist ein
  Projekt, das dort startet. HTML-Projekte oeffnen ihre `index.html`, Godot,
  Unity & Co. nur den Ordner.
- **Kopien:** Dasselbe Projekt an mehreren Orten (die Sicherung auf `E:`, ein
  zweiter Checkout) steht nur einmal da, die anderen Fundorte klappen darunter
  auf. Kopie heisst: gleicher Ordnername und dasselbe erste Commit oder der
  eine Pfad endet auf den anderen (`sindKopien`). Gezeigt und gestartet wird
  das Original: nicht in einem Backup-/Archivordner, nicht in `tmp`, startbar,
  zuletzt bearbeitet.
- **Erstellt** ist das erste Commit, das den Ordner beruehrt; ohne Git das
  aelteste Dateidatum im Ordner (Kopieren behaelt die Dateidaten, nicht das
  Erstelldatum des Ordners). Die Git-Daten merkt sich `git.json`.
  **Bearbeitet** kommt von `.git/index`, `package.json` und dem Ordner.
  Sortiert wird per Klick auf die Spaltenkoepfe, gefiltert nach Alle /
  Startbar / Laeuft; beides merkt sich der Browser.
- Paketmanager aus `packageManager` oder der Lock-Datei. Vor jedem Start prueft
  der Agent, ob Node jedes Paket aus der `package.json` wirklich findet (nach
  dem Verschieben eines Projekts zeigen pnpms Links ins Leere) und installiert
  sonst zuerst. Scheitert der Start trotzdem, repariert er einmal selbst:
  neu installieren, und klappt das nicht, `node_modules` neu aufbauen. Fehlt
  pnpm/yarn auf dem Rechner, kommt es ueber `npx`. Nur gegen einen belegten
  Port hilft das nicht -- dann sagt die Seite, wer ihn hat. Weitere Suchordner und Ausgeblendetes stehen in
  `%LOCALAPPDATA%\miwale-dev\einstellungen.json`, Logs je Projekt in `logs\`.
- **Laufende Server:** jede Instanz einzeln, auch zwei aus demselben Ordner.
  Gezaehlt werden Node, Bun, Deno, Python & Co. mit offenem Port; zugeordnet
  ueber den Projektpfad in der Befehlszeile. "Alle stoppen" laesst Server ohne
  Projekt in Ruhe.
- **Tastatur:** Tippen sucht (Name, Ordner, Art wie "godot"), `↑`/`↓` waehlt,
  `Enter` startet/oeffnet den Treffer, `1`–`9` das Projekt mit der Nummer,
  `Entf` stoppt alle, `Esc` leert die Suche.
- **Sicherheit:** Der Agent lauscht nur auf 127.0.0.1, nimmt Anfragen nur von
  `https://miwale.com` und `http://localhost:*` an (Origin- und Host-Pruefung)
  und kennt keine freien Befehle: Starten heisst immer das Skript aus der
  `package.json` des gefundenen Ordners, stoppen nur Prozesse aus seiner
  eigenen Liste. Die CSP von `/dev/` erlaubt genau die Verbindung zum Agenten
  (`docker/sicherheit-dev.conf`). Chrome fragt beim ersten Mal, ob miwale.com
  auf das lokale Netzwerk zugreifen darf.

```bash
pnpm zentrale                 # Agent starten (falls noetig) und Seite oeffnen
node --test tools/dev-zentrale.test.mjs
```

## Adresse und Verlauf

Der sichtbare Zustand des Portfolios steht in kurzen Adressen: `/portfolio`
fuer den Start, `/projekte`, `/projekte/chromatic`, `/projekte/chromatic/spielen`,
`/ueber-mich`, `/ki-workflow`, `/devlog`, `/kontakt`. Ohne das führte die
Zurück-Taste am Handy aus der Seite heraus, sobald eine Detailansicht oder ein
Spiel offen war; jetzt schließt sie sie. Nebenbei lässt sich damit ein einzelnes
Projekt verschicken.

Tabwechsel, Detailansicht und Spiel legen über `zeige()` je einen Verlaufseintrag
an. Die Schließen-Knöpfe gehen über `schliesse()` denselben Weg zurück, damit kein
toter Eintrag liegen bleibt. Der Zähler `eigeneEintraege` merkt sich, ob es
überhaupt einen eigenen Eintrag gibt — bei einem direkt geteilten Link wird der
Zustand stattdessen ersetzt, sonst verließe Schließen die Seite.

Alle diese Pfade liefern dieselbe Datei `miwale Portfolio.dc.html` aus
(`docker/nginx.conf`, lokal `tools/games-preview.mjs`); welcher Reiter und
welches Projekt, liest die Seite aus dem Pfad. Damit `support.js`, `_ds/` und
`assets/` auch unter `/projekte/chromatic` gefunden werden, setzt die Datei
`<base href="/">`.

Auf der Spieleseite ist `/games/chromatic` ohne Schraegstrich die Spielseite,
`/games/chromatic/` mit Schraegstrich das mitgelieferte Spiel selbst.

Alte Links wie `/miwale%20Portfolio.dc.html#projekte/chromatic` gelten weiter:
nginx leitet den Dateinamen auf `/portfolio` um, der Browser behaelt den Teil hinter dem
Doppelkreuz, und die Seite ersetzt ihn durch die kurze Adresse.

## Mobile Grundlagen

Das Viewport-Meta der Mobil-Fassung trägt `viewport-fit=cover`. Ohne das liefert
`env(safe-area-inset-bottom)` auf iOS immer 0, und die Navileiste säße auf dem
Home-Indicator. Seitenrahmen und Sheet rechnen in `dvh` statt `vh`, damit die
ein- und ausfahrende Adressleiste die Höhe nicht springen lässt.

In der Desktop-Fassung steht `viewport-fit=cover` bewusst **nicht**: dort gibt es
keine Safe-Area-Angaben, und mit `cover` rutschte Inhalt im Querformat unter die
Notch.

## Rückkehr in den Tab

Browser halten weggeschaltete Tabs an: `requestAnimationFrame` ruht, Zeitgeber
werden gedrosselt, CSS-Animationen pausieren. Beim Zurückschalten liefen sie
sichtbar weiter, statt schon fertig zu sein — Elemente blendeten erneut ein, und
eine Kachel blieb unter dem alten Zeigerort geneigt stehen, bis man die Maus
bewegte.

`sofortFertig()` hängt an `visibilitychange` und `pageshow` und setzt beim
Sichtbarwerden alles in einem Rutsch in den Endzustand: Kachelneigung
zurücksetzen, einmalige Animationen per `finish()` ans Ende, alles im Bild ohne
Einblenden zeigen, dann `paintDepth()` und `scanReveal()`. Währenddessen liegt
`.mw-sofort` auf `<html>` und kappt alle Übergänge, damit nichts nachanimiert.

Endlose Hintergrundbewegungen (Lichtschächte, Schwebeteilchen) werden bewusst
nicht beendet — sonst stünde das Wasser still.

Die Sperre wird über `requestAnimationFrame` **und** einen `setTimeout` von
150 ms gelöst. Nur über rAF wäre sie hängen geblieben, wenn der Browser gerade
keine Bilder liefert — und damit wären alle Übergänge dauerhaft tot.

## Lokal ansehen

Die Canvas-Dateien laden ihre Styles per `fetch`, über `file://` bleibt die Seite
deshalb leer. Der Vite-Server kennt die kurzen Adressen und die Spiele:

```bash
npm run dev
```

Die Seite lädt bei jeder Änderung an `shop/`, `index.html`, dem Portfolio, `_ds/` oder `assets/` von selbst neu, auch auf Unterseiten wie `/library` (`tools/games-preview.mjs`, `handleHotUpdate`). Die Skripte sind keine Module, Vite allein würde das nicht tun. Laufen mehrere Dev-Server (die Dev-Zentrale zeigt sie), zeigt jeder den aktuellen Stand – Port im Browser prüfen.

Ein einfacher Server wie `python -m http.server` zeigt nur die Startseite;
`/projekte/...` und `/games` kennt er nicht.

## Ladezeit

Was eine Seite beim Öffnen lädt, misst `node tools/ladezeit.mjs <basis>
[--mobil]` (Anfragen, übertragene KB je Art, größte Dateien, LCP, fremde
Hosts, Konsolenfehler). Lokale Zeiten schwanken; die Bytes sind der
verlässliche Vergleich.

- **Keine fremden Server.** Schriften liegen in `assets/fonts/` (Quicksand,
  Manrope, JetBrains Mono; variable woff2, Latin und Latin-Ext, SIL Open Font
  License), React in `assets/vendor/` (byte-gleich mit den SRI-Hashes in
  `support.js`, das Portfolio lädt es vor `support.js`). Google Fonts blockierte
  die CSP der Spieleseite ohnehin, dort lief sie in Arial. Die CI prüft, dass
  `fonts.googleapis`, `fonts.gstatic` und `unpkg.com` nicht zurückkommen.
  Achtung beim Neu-Export des Design Systems: `_ds/.../tokens/fonts.css` darf
  den Google-Import nicht zurückbringen.
- **Bilder als WebP.** Screenshots mit Qualität 85, Pixel-Art-PNGs mit
  Transparenz verlustfrei. Logo und Maskottchen sind Palette-PNGs mit exakt
  denselben Pixeln. Trailer höchstens 960×540 (VP9, CRF um 34).
- **Caching** (`docker/nginx.conf`): `assets/fonts/` und `assets/vendor/` ein
  Jahr `immutable` — eine neue Version braucht einen neuen Dateinamen.
  `assets/` und `styles/shots/` einen Tag, danach eine Woche
  `stale-while-revalidate`. HTML, Seitenskripte und CSS fragen weiter bei
  jedem Aufruf nach (`max-age=0`), damit ein Deployment sofort ankommt.
- **Kompression** gilt für beide Hosts, also auch für die Spiel-Bundles auf
  `play.miwale.com`.
- Im **Datensparmodus** des Browsers starten die Trailer nicht von selbst.

## Teilen, Suche und Presse

Die Spieleseite ist eine Ein-Seiten-App: `index.html` hat ein leeres `#app`, den
Rest zeichnet `shop/shop.js`. Discord, X, WhatsApp und viele Crawler (auch KI)
führen kein JavaScript aus und sahen deshalb bei jedem Spiel dieselbe Vorschau.
Darum entstehen beim Bauen aus dem Katalog (`shop/spiele.js`) eigene Seiten:

| Adresse | Was |
| --- | --- |
| `/` | Startseite mit Spieleliste, `canonical` und JSON-LD (`WebSite`, `Organization`, `ItemList`) im HTML |
| `/games/<id>` und `/games/<id>/spielen` | je Spiel: eigener Titel, Beschreibung, Vorschaubild, JSON-LD (`VideoGame`, `BreadcrumbList`) und der Text im HTML. `shop.js` ersetzt den Inhalt beim Start wie bisher |
| `/press/` und `/press/miwale-presskit.zip` | Presse-Seite und Presskit: Fakten, Texte (EN/DE), Logo, Maskottchen, Farben, je Spiel Screenshots, Trailer und Teilen-Karte |
| `/sitemap.xml`, `/robots.txt` | alle Spiele, Portfolio, Styles; `/admin`, `/dev`, `/usage`, `/api` ausgeschlossen |
| `/feed.xml` | Atom-Feed: neue Spiele und Neuigkeiten. Kein Konto, keine E-Mail-Adresse |

`tools/seiten.mjs` schreibt das (Bibliothek: `tools/seiten-lib.mjs`). Es steht
**nicht im Repository**: Das Dockerfile ruft es beim Bauen auf, `npm run build`
ebenso (nach `dist/`), und der Vite-Server baut jede Seite bei der Anfrage neu.
So veraltet nichts. nginx liefert `/seiten/spiel/<id>.html`, und ein Spiel ohne
eigene Datei bekommt weiter die allgemeine `index.html`.

- **Teilen-Karten** (`assets/og/<id>.jpg`, 1200×630, JPEG): Screenshot, Logo, Name,
  Kurztext, Tags, „Play free“. `node tools/og-bilder.mjs` erzeugt die fehlenden,
  `--alle` alle neu, oder mit ids. Sie liegen im Repository;
  `tools/sync-games.mjs` erzeugt sie für neu aufgenommene Spiele selbst. Fehlt
  eine, zeigt die Seite `assets/og/miwale.jpg`.
- **Neuigkeiten** zu einem Spiel: im Katalogeintrag
  `neuigkeiten: [{ datum: "2026-11-01", titel: { en, de }, text: { en, de } }]`.
  Sie erscheinen im Feed.
- **Presskit** pflegen: Texte (`BOILERPLATE`), Farben und Kontakt stehen oben in
  `tools/seiten-lib.mjs`. Die Entwürfe der Beschreibung bitte lesen und anpassen.
- Prüfen: `node --test tools/seiten.test.mjs` (CI). Die CI ruft außerdem Spielseite,
  Startseite, Sitemap, Feed und ZIP im gebauten Image ab.
- Link-Vorschau testen: ohne JS, z. B. `curl -s https://miwale.com/games/dropfall | grep og:`,
  oder mit den Debuggern von Facebook und X (zeigen auch alte Zwischenspeicher neu an).

## Profil, Perlen und Erfolge

Wer angemeldet ist (Konten, siehe oben), bekommt ein **Profil**: Spielzeit je Spiel,
Level, Erfolge, **Perlen** und einen Perlen-Shop, in dem sich das Profil anpassen
lässt. Alles ist Optik und kostenlos erspielbar; Geld spielt keine Rolle.

| Adresse | Was |
| --- | --- |
| `/profile` | das eigene Profil mit Anpassen, Vitrine (3 Erfolge), Einstellungen und Perlen-Verlauf |
| `/u/<name>` | das Profil eines anderen, so wie es der Server freigibt |
| `/library` | Bibliothek wie bei Steam: links alle Spiele (Suche, Favoriten zuerst), rechts Regale mit Kacheln – Favoriten, Zuletzt gespielt, Alle Spiele (sortierbar). Stern auf der Kachel = Favorit, Play-Knopf startet direkt |
| `/library/<id>` | ein Spiel in der Bibliothek: Spielen, Spielzeit, zuletzt gespielt, Erfolge (freigeschaltete zuerst, neueste oben, dann nach Fortschritt), Favorit, Link zur Shop-Seite |
| `/pearls` | Perlen-Shop: Avatare, Rahmen, Banner, Namensstile, Titel, Akzentfarben |

**Anmelden** öffnet überall ein Fenster in der Mitte (wie bei den meisten großen Seiten): Wal, „Anmelden oder registrieren“, je Anbieter ein Knopf mit Logo („Weiter mit Google/Discord“). Jeder Link mit `data-anmelden` öffnet es (`shop/konto.js`); ohne JavaScript führt derselbe Link auf `/account`. Neue Konten wählen danach auf `/account` ihren Namen – dieselbe Karte, mitten auf der Seite. Am Handy kommt das Fenster als Blatt von unten.

In der Kopfzeile stehen Home · Library · Game Requests · Pearl Shop und rechts ein
Chip mit Avatar, Level und Perlen. Unter 860 px Breite wandern die Reiter als
Leiste nach unten (mit Profil als fünftem Reiter), wie in einer App. Der Chip ersetzt
dort „Sign in“ nur, wenn jemand angemeldet ist.

**Sichtbarkeit.** Das Profil ist öffentlich, **die Spielzeit privat**, bis man „Meine
Spielzeit zeigen“ einschaltet. Perlenstand und Verlauf sieht niemand außer einem selbst.
Ein verstecktes Profil liefert Fremden 404. `robots.txt` bittet Suchmaschinen, `/u/`,
`/profile` und `/library` nicht aufzulisten. Der Datenschutztext (`shop/datenschutz.js`),
der Datenabruf (`/api/konto/daten`) und das Löschen des Kontos kennen das Profil.

**Ohne Konto** zählt die Spielzeit trotzdem: im Browser (`localStorage`, Schlüssel `miwale-spielzeit`, nur auf diesem Gerät), ebenso Favoriten. Meldet man sich an, wird beides einmal ins Profil übernommen (`POST /api/profil/import`, je Spiel höchstens 6 Stunden, je Konto höchstens 20; für die Zeit selbst gibt es keine Perlen, nur Spielzeit-Erfolge können dadurch frei werden). Mit Konto zählt der Server.

**Favoriten:** Stern auf Kachel, Spielseite der Bibliothek oder der Shop-Seite (`data-fav-knopf`). Mit Konto `POST /api/profil/favorit { spiel, an }`, sonst im Browser.

**Spielzeit** zählt nur, solange das Spielfenster offen und der Tab sichtbar ist. Alle 30
Sekunden kommt ein Herzschlag (`shop/profil.js`); der Server schreibt nur die Zeit gut, die
seit dem letzten Herzschlag **wirklich** vergangen ist (höchstens 90 s, höchstens einer je
20 s, also zählen zwei Tabs nicht doppelt) und nur bis zur Tagesgrenze (12 h, 24 Perlen
aus Spielzeit). Das ist kein Schutz gegen jemanden, der die Anfragen von Hand sendet,
sondern dagegen, dass sich das lohnt: Perlen kaufen nur Optik, alles ist tempobegrenzt.

**Regeln und Katalog** stehen in `shop/profil-katalog.js` — die eine Datei, aus der die
Seite Shop und Profil zeichnet und gegen die der Server Preise, Voraussetzungen und
Erfolge prüft (`REGELN` oben: 1 Perle je 5 Minuten, Besuchsbonus, Bewertung, Game Request,
Level-Belohnung). Zu jedem Spiel entstehen von selbst ein Avatar, ein Banner (kaufbar nach
10 Minuten in diesem Spiel) und drei Spielzeit-Erfolge (10 Min, 1 Std, 10 Std). Neuer
Gegenstand: Eintrag in `ITEMS` (die `id` nie ändern, sonst verlieren Spieler ihren Kauf).
Neuer Erfolg der Plattform: Eintrag in `ERFOLGE` **und** die Bedingung in `PRUEFER` in
`server/profil.mjs` (der Test schlägt fehl, wenn eines fehlt). Texte immer en und de.

**Erfolge in einem Spiel.** Ein Spiel meldet sie über das SDK (`public/sdk/miwale.js`,
eine kleine Datei zum Kopieren ins Spiel, kein Nachladen von miwale.com):

```js
miwale.achievement("first-win");   // Spiel läuft nicht auf miwale.com? Dann tut es nichts.
```

Das Spiel schickt nur eine Nachricht an das Fenster darüber (`postMessage`). Die Seite
nimmt sie an, wenn sie aus dem Rahmen des gerade geöffneten Spiels kommt und jemand
angemeldet ist; der Server nimmt nur ids aus dem Katalog an (`SPIEL_ERFOLGE`) und nur,
wenn der Spieler dort schon gespielt hat. Ein Erfolg zählt einmal. **Es gibt noch keine
Erfolge in den Spielen**: Sie müssen in den Spiel-Repositories gemeldet **und** in
`SPIEL_ERFOLGE` eingetragen werden — ein Erfolg, der nie kommen kann, soll nicht auftauchen.

**Dienst:** `server/profil.mjs`, erreichbar unter `/api/profil/` (nginx, derselbe Prozess
wie die anderen Dienste). Gespeichert wird in `profile.json` im Datenordner, gesammelt alle
paar Sekunden (und beim Beenden). Verwaltung mit dem Passwort der Verwaltung:
`GET /api/profil/admin/profile` (Liste), `PUT …/profile/<konto-id>` mit `{ "perlen": 50 }`
(gutschreiben oder abziehen), `DELETE …/profile/<konto-id>` (zurücksetzen). Bewertungen
und Game Requests melden dem Profil über `beiBewertung` und `beiIdee` (`server/start.mjs`).
Lokal (`npm run dev`) liegen die Daten in `.bewertungen-dev/`; zum Ausprobieren melde dich
mit dem Test-Anbieter an und schenke dir Perlen: `curl -X PUT -H "Authorization: Bearer dev"
-H "Content-Type: application/json" -H "Origin: http://localhost:5310" -d '{"perlen":500}'
http://localhost:5310/api/profil/admin/profile/<konto-id>` (die Id steht in der Liste).

Prüfen: `node --test tools/profil.test.mjs` (Katalog, Regeln, Tagesgrenzen, Shop,
Sichtbarkeit, Neustart, Löschen; CI).

## Design System

Unter `_ds/` liegt das miwale Design System: Tokens für Farben, Typografie,
Abstände, Radien, Elevation, Glas-Effekte und Motion, dazu die Komponenten in
`components/`. Die Dichteregeln des Systems gelten — ein Hintergrundeffekt pro
Sektion, ein BorderBeam pro Screen, ein Scroll-Set-Piece pro Seite.

## Kontakt

- E-Mail: michi.waggoner@gmail.com
- itch.io: https://milchinien.itch.io/
- GitHub: https://github.com/milchinien

### Projektvorschauen

Elf der zwoelf Projekte verwenden eigene Illustrationen in den Projektkacheln und auf
der Startseite, auf Desktop und Mobil. Der Reliktenschieber zeigt vorerst einen
Screenshot aus dem Spiel, bis eine Illustration entsteht. Die Zuordnung steht im Feld `preview`;
`shot` und `shots` behalten die bisherigen Detailbilder. Unter
`assets/games/previews/` liegen die PNG-Originale, die WebP-Webdateien
und die vollständigen Generierungsprompts in `prompts.md`. Die PNG-Originale
kommen nicht ins Image (`.dockerignore`).


## Spiele von GitHub (automatisch)

Jedes oeffentliche Repository von `milchinien` auf GitHub wird automatisch zum
Spiel auf miwale.com, sobald es einen **spielbaren Kern** hat. Das erledigt
`tools/sync-games.mjs`, jeden Tag um 03:17 UTC als GitHub Action
(`.github/workflows/spiele.yml`) und von Hand mit `npm run games:sync`.

Fuer jedes Repository: klonen, Abhaengigkeiten installieren (pnpm, npm oder
yarn, je nach Lockfile), bauen, dann die **Kern-Pruefung**
(`tools/kern-pruefung.mjs`) in Chromium. Spielbar heisst:

1. Die Seite laedt unter `/games/<id>/`, und keine eigene Datei fehlt.
2. Kein unbehandelter Fehler, weder beim Laden noch beim Spielen.
3. Es ist etwas zu sehen, das Bild ist nicht einfarbig.
4. Es gibt etwas zum Anfassen: Zeichenflaeche, Knoepfe oder Eingabefelder.
5. Das Spiel reagiert: nach Klick auf "Start/Play", Tippen ins Bild und ein paar
   Tasten sieht es anders aus.

Dasselbe laeuft danach hochkant mit Touch. Besteht ein Spiel auch das, steht es
als "am Handy spielbar" auf der Seite. Von Hand pruefen:
`node tools/kern-pruefung.mjs public/games/chromatic chromatic`.

Was besteht, wird unter `public/games/<id>/` eingefroren (Pruefsumme und Commit
in `public/games/manifest.json`). Faellt eine neue Fassung durch, bleibt die alte
online. Unveraenderte Repositories (gleicher Commit) werden uebersprungen.

**Zwei Arten von Eintraegen.** Spiele mit handgeschriebenem Eintrag in
`shop/spiele.js` werden nur neu gebaut; Texte, Trailer und Bilder bleiben. Alle
anderen bekommen einen generierten Eintrag in `shop/spiele-auto.js` (nicht von
Hand bearbeiten) mit Bildern aus der Pruefung (`assets/games/auto/`). Sobald ein
Spiel einen Eintrag in `shop/spiele.js` bekommt, gilt der. Spiele mit externer
Adresse in `shop/spiele.js` (Dropfall, Mathe Universe auf GitHub Pages) fasst die
Automatik nicht an.

**Texte fuer neue Spiele.** Ohne weiteres nimmt die Automatik die Beschreibung des
Repositorys, sonst den ersten Absatz der README, fuer beide Sprachen gleich.
Besser: eine `miwale.json` im Spiel-Repository.

```json
{
  "name": "Idlekin",
  "status": { "en": "Early prototype", "de": "Frueher Prototyp" },
  "texte": {
    "en": { "kurz": "...", "tags": ["Idle"], "ueber": ["..."], "features": ["..."], "steuerung": "..." },
    "de": { "kurz": "...", "tags": ["Idle"], "ueber": ["..."], "features": ["..."], "steuerung": "..." }
  }
}
```

Weitere Felder in `miwale.json` (oder fuer fremde Repositories in
`tools/spiele-quellen.json`): `"aufnehmen": false` haelt ein Repository heraus;
`app`, `build`, `dist` legen fest, wo und wie gebaut wird, wenn die Erkennung
danebenliegt; `fertig` zeigt auf einen eingecheckten fertigen Web-Build. Das ist
der Weg fuer Unity (WebGL) und Godot (Web-Export), die sich ohne Lizenz und
Vorlagen nicht in der Action bauen lassen.

**Was die Action tut.** Hat sich etwas geaendert, committet sie auf den Branch
`automatisch/spiele`, laesst dort dieselbe CI laufen wie bei einem PR und spult
bei Gruen `main` vor; danach startet sie Publish. Ein Pushen mit dem
`GITHUB_TOKEN` loest sonst keine anderen Workflows aus. Der Bericht (welches
Repository warum durchgefallen ist) steht in der Zusammenfassung des Laufs und
lokal in `.spiele-cache/bericht.md`. Private Repositories bleiben aussen vor.

`npm run build` erstellt die vollst?ndige statische Seite in `dist/`, einschlie?lich beider Portfolio-Fassungen und aller Spiele. Der Docker-Build kopiert dieselben Dateien. Spielst?nde der externen GitHub-Pages-Adressen liegen auf einer anderen Origin und werden nicht automatisch ?bernommen.

Die Sortierung verwendet ein gestaltetes Disclosure-Dropdown: Auswahl per Klick oder Touch, Pfeiltasten/Home/End zum Navigieren und Escape zum Schlie?en. Tab und Klick au?erhalb schlie?en die Liste ebenfalls.
