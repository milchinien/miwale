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
| `assets/games/` | Screenshots aus Chromatic, Icons und Rahmen aus Wavebreaker |
| `github.md` | Sync-Notiz: aus welchen Repos die Inhalte stammen |

## Aufbau der Seite

Desktop: **Start · Projekte · Über mich · KI-Workflow · Devlog · Kontakt**
Mobil: **Start · Projekte · Über mich · Kontakt**

Der Tab „Projekte" zeigt drei Arbeiten:

- **Chromatic** — Roguelite-Deckbuilder mit Echtzeit-Kampf im Browser.
  TypeScript und Vite, ohne Engine oder Framework, 25-Karten-Deck, 59 Unit-Tests.
- **Wavebreaker** — futuristisches Idle-Verteidigungsspiel. TypeScript und Vite,
  DOM-freie Simulation, 692 Selbsttests, vor dem Bau ein 16-Kapitel-GDD.
- **xrai.order-system** — Bestell-App für den Gasthof Nüßleshof: QR-Code am
  Tisch scannen, bestellen, Küche sieht die Bestellung. Im echten Einsatz.

Der Devlog-Tab steht bewusst auf „bald" und bleibt leer, bis es echte Einträge
gibt.

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
