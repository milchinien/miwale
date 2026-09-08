# miwale

Portfolio-Website von **miwale** — einem angehenden Ein-Personen-Game-Studio aus
Leipzig, das Spiele mit KI-Unterstützung baut. Der Name steht für
**mi**chel · **wa**ggoner · **le**ipzig.

Dieses Repository enthält den Design-Stand der Seite: die Canvas-Dateien, das
Design System und alle Bild-Assets.

## Inhalt

| Pfad | Was es ist |
| --- | --- |
| `miwale Portfolio.dc.html` | Desktop-Fassung der Seite, sechs Tabs |
| `miwale Portfolio Mobil.dc.html` | Mobil-Fassung, auf vier Tabs gekürzt |
| `support.js` | Laufzeit für die Canvas-Dateien |
| `_ds/miwale-design-system-…/` | miwale Design System: Tokens, Komponenten, Styles |
| `assets/` | Logo-Wordmarks und Wal-Maskottchen, je für hell und dunkel |
| `assets/games/` | Screenshots und Grafiken zu den Projekten |
| `assets/games/ph-*.svg` | Platzhalter für Projekte ohne Screenshot |
| `github.md` | Sync-Notiz: aus welchen Repos die Inhalte stammen |

## Aufbau der Seite

Desktop: **Start · Projekte · Über mich · KI-Workflow · Devlog · Kontakt**
Mobil: **Start · Projekte · Über mich · Kontakt**

### Der Projekte-Tab

Auf dem Desktop bleibt oben der Tauchgang: Wortmarke, Scrollen, es wird dunkler.
Darunter liegen alle Projekte in einem **Wechselraster**, nach Relevanz sortiert —
was läuft und spielbar ist, steht vorn. Jede Reihe trägt zwei Kacheln im
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

Enthalten sind elf Projekte: Chromatic, Wavebreaker, XRAI Order System, Runecall,
Dropfall, Harmonics, Dungeons & Diplomas, Michis Mathe Universe,
mindforge-playground, The Last Outpost und der Flappy-Prototyp.

Der Devlog-Tab steht bewusst auf „bald" und bleibt leer, bis es echte Einträge
gibt.

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
deshalb leer. Ein einfacher Server im Projektordner genügt:

```bash
python -m http.server 8000
```

Danach `http://localhost:8000/miwale%20Portfolio.dc.html` im Browser öffnen.

## Design System

Unter `_ds/` liegt das miwale Design System: Tokens für Farben, Typografie,
Abstände, Radien, Elevation, Glas-Effekte und Motion, dazu die Komponenten in
`components/`. Die Dichteregeln des Systems gelten — ein Hintergrundeffekt pro
Sektion, ein BorderBeam pro Screen, ein Scroll-Set-Piece pro Seite.

## Kontakt

- E-Mail: michi.waggoner@gmail.com
- itch.io: https://milchinien.itch.io/
- GitHub: https://github.com/milchinien
