# miwale

Portfolio-Website von **miwale** — einem angehenden Ein-Personen-Game-Studio aus
Leipzig, das Spiele mit KI-Unterstützung baut. Der Name steht für
**mi**chel · **wa**ggoner · **le**ipzig.

Live: <https://miwale.com>

## Stack

Statische Seite mit [Astro](https://astro.build). Kein Backend, keine Datenbank.
Die Inhalte liegen im Repo, der Devlog als Markdown — ein Commit ist damit
gleichzeitig Inhalt, Versionsstand und Audit-Spur.

Im Browser laufen rund 24 KB JavaScript: Astros Seitenwechsel und die
Scroll-Engine für den Hintergrund. Sonst nichts.

## Entwickeln

```bash
npm install
npm run dev      # http://localhost:4321
npm run check    # Typecheck + Frontmatter-Schemas
npm run build    # nach dist/
```

## Aufbau

| Pfad | Was es ist |
| --- | --- |
| `src/pages/` | Eine Datei je Route. `devlog/[...slug].astro` rendert die Einträge. |
| `src/components/ds/` | Bausteine des Design Systems (Karte, Button, Tag, Texteffekte) |
| `src/components/Ocean.astro` | Der Ozean-Hintergrund, rein deklarativ |
| `src/scripts/ocean.ts` | Scroll-Engine: schreibt `--depth`, `--sy`, `--dive` |
| `src/styles/` | Design-Tokens und Stile, alles CSS |
| `src/content/blog/` | Devlog-Einträge als Markdown |
| `deploy/` | Compose-Datei und Pull-Deployment für den Server |
| `design/` | Die Original-Exporte aus Claude Design (Referenz, nicht gebaut) |

## Devlog schreiben

Neue Datei unter `src/content/blog/`, benannt nach dem Muster
`2026-08-21-kurzer-slug.md`. Der Dateiname wird zur URL. Als Vorlage dient
`src/content/blog/_template.md` (Dateien mit `_` am Anfang werden ignoriert).

Das Frontmatter wird gegen ein Schema geprüft (`src/content.config.ts`).
Passt ein Eintrag nicht, **schlägt der Build fehl**, statt die Seite still
kaputtzumachen. `draft: true` hält einen Eintrag zurück.

## Wie es live geht

1. Änderung auf einem Branch, Pull Request gegen `main`.
2. `CI` muss grün sein: Typecheck, Build, Smoke-Test der Seiten, Container-Build.
3. Nach dem Merge baut `Publish` das Image und schiebt es nach
   `ghcr.io/milchinien/miwale`.
4. Der Server prüft alle fünf Minuten selbst auf ein neues Image und rollt es
   aus (`deploy/miwale-deploy.sh` per systemd-Timer).

Der Server zieht, statt dass die Pipeline pusht: `dev-cloud` liegt hinter
Tailscale und hat keinen offenen SSH-Port. Dadurch braucht die Pipeline weder
Zugangsdaten zum Server noch überhaupt dessen Adresse.

## Der Hintergrund

Der Ozean hängt an drei CSS-Variablen, die `src/scripts/ocean.ts` einmal pro
Frame auf `<html>` schreibt: `--depth` (0 = Oberfläche, 1 = Tiefsee), `--sy`
(Scrollposition) und `--dive` (Tauchgang auf der Projekte-Seite). Alle Ebenen
leiten ihre Deckkraft und Parallaxe in CSS daraus ab.

Zwei Regeln halten das ruhig, und beide sind der Grund, warum die erste Fassung
geruckelt hat:

- **Lesen und Schreiben sind getrennt.** Erst werden alle Geometrien gelesen,
  danach wird geschrieben. Gemischt erzwingt jeder Lesezugriff nach einem
  Schreibzugriff ein synchrones Re-Layout.
- **Ein Element hat entweder eine `@keyframes`-Animation oder einen
  variablengesteuerten `transform` — nie beides.** Sonst überschreiben sich
  Keyframes und Inline-Style gegenseitig, und die Animation bleibt hängen.

Sichtbarwerden von Text läuft über `IntersectionObserver`, nicht über eine
Messung pro Frame. Ohne JavaScript ist aller Text sichtbar.

## Design System

`src/styles/` enthält die Tokens und Komponenten-Stile aus dem miwale Design
System. Sie sind aus `design/_ds/` **kopiert**: bei einem neuen Export aus
Claude Design müssen die Dateien nachgezogen werden. Die JavaScript-Komponenten
des Exports (`_ds_bundle.js`) werden nicht verwendet — sie sind als
`.astro`-Komponenten auf denselben CSS-Klassen neu gebaut.

## Kontakt

- E-Mail: michi.waggoner@gmail.com
- itch.io: <https://milchinien.itch.io/>
- GitHub: <https://github.com/milchinien>
