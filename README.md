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

Oben rechts fuehrt **Portfolio →** nach `/portfolio`. `/games` leitet auf `/` um.

### Bewertungen

Jede Spielseite (`/games/<id>`) hat ganz unten, unter den Beschreibungen, einen
Bewertungsbereich wie bei Steam: Ja oder Nein zur Empfehlung, dazu freiwillig
ein oeffentlicher Satz und ein privates Feedback, das nur die Verwaltung sieht.
Die Oberflaeche steht in `shop/bewertungen.js` und `shop/bewertungen.css`;
`shop.js` legt nur den leeren Abschnitt an und ruft sie auf.

- **Ohne Account, auf Vertrauensbasis.** Jedes Geraet bekommt beim ersten
  Besuch eine zufaellige Kennung im localStorage. Pro Spiel zaehlt eine Stimme
  je Kennung; eine zweite Abgabe ersetzt die erste. Bewertungen erscheinen sofort.
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
- **Schutz.** Dieselbe Wortsperrliste wie bei den Bewertungen, verstecktes Feld
  gegen Bots, je Adresse in zehn Minuten hoechstens 8 Einreichungen, 24 Bilder
  und 150 Stimmen, hoechstens 10 unbearbeitete Ideen je Geraet.
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

**Spaeter ein Konto.** Heute gehoeren Ideen und Stimmen einem Geraet. Das steht
an genau zwei Stellen: `shop/identitaet.js` im Browser (welche Kennung mitgeht)
und `besitzerVon()` in `server/gemeinsam.mjs` (gespeichert als
`"geraet:<id>"`, bei Ideen im Feld `besitzer`, bei Stimmen als Schluessel in
`stimmen`). Ein Konto liefert dort `"konto:<id>"` aus der Sitzung; was ein
Geraet vorher angelegt hat, laesst sich bei der Anmeldung einmalig auf das
Konto umschreiben. Die Bewertungen holen ihre Kennung auch schon aus
`shop/identitaet.js`.

Bewertungen und Game Requests laufen in einem Node-Prozess (`server/start.mjs`,
gestartet von `docker/40-dienste.sh`) und teilen Hilfen aus `server/gemeinsam.mjs`.

**Produktion einmalig einrichten.** Auf dem Server neben
`docker-compose.prod.yml` eine `.env` mit `BEWERTUNGEN_ADMIN_PASSWORT=...`
anlegen und die aktualisierte Compose-Datei dorthin kopieren. Sie bindet das
Volume `miwale-bewertungen` an `/data`. Ohne Volume sind alle Bewertungen nach
dem naechsten Deployment weg.

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

Ein einfacher Server wie `python -m http.server` zeigt nur die Startseite;
`/projekte/...` und `/games` kennt er nicht.

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
`assets/games/previews/` liegen die PNG-Originale, kompakte JPEG-Webdateien
und die vollst?ndigen Generierungsprompts in `prompts.md`.


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
