# BalatroFX

Balatro-inspirierter Grafikstil für Browser-Spiele. Läuft auf WebGL2 in reinem JavaScript, ohne Build-Schritt und ohne Abhängigkeiten.
Alles ist eigener Code. Es sind **keine Original-Assets** von Balatro enthalten.

## Dateien

| Datei | Inhalt |
|---|---|
| `balatro-fx.js` | Engine: Hintergrund, CRT, Sprites/Karten, Editionen, Partikel, Pop-ups, Flammen, Shake, Event-Queue, UI-Helfer |
| `balatro-fx-art.js` | Optional: prozedurale Pixel-Art (Spielkarten 71×95, Rückseite, Würfel 32×32, Joker) |

```html
<script src="balatro-fx/balatro-fx.js"></script>
<script src="balatro-fx/balatro-fx-art.js"></script>
```

**Schrift:** Balatro verwendet nach meiner Kenntnis **m6x11** von Daniel Linssen. Die Quellen haben das nicht bestätigt.
Die Schrift ist kostenlos (managore.itch.io/m6x11). Lege sie als `fonts/m6x11.ttf` ab.
Fehlt sie, greift *Pixelify Sans* (SIL OFL, liegt in `fonts/`).

## Minimalbeispiel

```js
const eng = new BalatroFX.Engine(canvas, { width: 1280, height: 720, background: 'blind' });
const tex = eng.texture(BalatroFX.Art.card('A', 'spades'));
const card = eng.sprite({ tex, x: 640, y: 400, s: 1.4, edition: 'polychrome' });

eng.on('down', () => {
  if (eng.hovered === card) {
    card.juiceUp(0.4);
    eng.popup(card.x, card.y - 90, '+11', { colour: BalatroFX.PALETTE.CHIPS });
    eng.emit(card.x, card.y, { colours: ['#009DFF', '#fff'] });
  }
});

eng.start(
  (dt) => { /* Spiellogik */ },
  (back, front, t) => { // 2D-Canvas-Ebenen hinter bzw. vor den Sprites
    BalatroFX.UI.box(back, 20, 20, 260, 80, { colour: '#3A5055', emboss: 3 });
    BalatroFX.UI.dynaText(front, 'Hallo!', 150, 60, { size: 40, time: t });
  });
```

## Render-Pipeline (pro Frame)

1. **Paint-Swirl-Hintergrund** (verpixelt, Polar-Wirbel und 5× Domain-Warping, 3 Farben)
2. 2D-Ebene **hinten** (Panels, Score-Boxen)
3. **Flammen**
4. **Sprites**: zuerst alle Schatten, dann die Karten (3D-Tilt, Edition, Dissolve)
5. **Partikel**
6. 2D-Ebene **vorne** (Buttons, Tooltips, Pop-ups)
7. **CRT-Pass**: Wölbung, chromatische Aberration, Bloom (über Mipmaps), Scanlines, Rauschen, Vignette

## API

### Engine
| Methode | Zweck |
|---|---|
| `new Engine(canvas, {width, height, maxDpr, crt, background})` | Virtuelle Auflösung, letterboxed. Der Hintergrund füllt immer den ganzen Bildschirm. |
| `texture(canvasOrImage)` | Pixel-Art-Textur (NEAREST) |
| `sprite({tex, x, y, s, r, z, edition, interactive, shadow, ambient, data})` | Karte oder Objekt anlegen |
| `emit(x, y, {count, colours, speed, size, life, spread, angle, gravity, drag, shape})` | Partikel. `shape`: `square`, `circle`, `diamond`, `star` |
| `popup(x, y, text, {colour, textColour, size, life, bubble})` | Wertblase wie „+10“ oder „X2“ |
| `setFlame(id, {x, y, w, h, intensity, colours:[hell, dunkel]})` | Flammen über einer Box (`y` = Oberkante) |
| `shake(px)` | Screen-Shake |
| `setBackground('menu'│'blind'│'boss'│'bossViolet'│'shop'│'won'│'gold'│{c1,c2,c3,contrast,…})` | Blendet weich über und dreht kurz mit |
| `setBackgroundColour(hex, {special, contrast})` | Leitet die Swirl-Farben aus einer Farbe ab, wie bei Blinds |
| `pulseBackground(spin, flow)` | Energie-Schub im Hintergrund |
| `queue(fn, delay)` | Sequenzielle Event-Queue für Scoring-Abläufe |
| `after(delay, fn)`, `tween(obj, props, dur, ease, done)` | Timer und Tweens |
| `crt` | `{enabled, amount, curvature, scanlines, bloom, chroma, noise, vignette}`, live änderbar |
| `hovered`, `mouse`, `on('down'│'up'│'move'│'hover', fn)` | Eingabe in virtuellen Koordinaten |

### Sprite
`moveTo(x, y, r, s)` bewegt per Feder mit leichtem Überschwingen. Bewegung kippt und neigt die Karte.
`juiceUp(scale, rot)` erzeugt das typische Wackeln: `sin(50.8·t)` für die Skalierung, `sin(40.8·t)` für die Rotation, Abklingzeit 0,4 s.
Weitere Methoden: `flashWhite()`, `dissolveOut(dur, {colours, onDone})`, `materialize(dur)`, `remove()`.
Eigenschaften: `edition` (`none`, `foil`, `holo`, `polychrome`, `negative`), `tint: [hex, menge]`, `alpha`, `ambient` (Idle-Schaukeln), `tiltStrength`.

### UI (Canvas 2D)
- `UI.box(ctx, x, y, w, h, {colour, radius, emboss, outline, shadow})` – abgerundete Box mit dunkler Unterkante und Schlagschatten
- `UI.button(ctx, {x, y, w, h, label, colour, hover, pressed, disabled, juice}, t)`
- `UI.text(...)` – Text mit Schatten
- `UI.dynaText(ctx, str, x, y, {size, time, wave, rotWave, pop, colour | [farben]})` – wippende Einzelbuchstaben mit Pop-in
- `UI.num(v)` – Zahlenformat mit Tausenderpunkten
- `PALETTE` – Chips `#009DFF`, Mult `#FE5F55`, Geld `#F3B958`, Panel `#3A5055` usw.

## Recherche-Notizen und was davon gesichert ist

- **Steam-Seite:** Die Seite selbst beschreibt nur „CRT fuzz“, „hand-crafted pixel art“ und eine „distinctive psychedelic world“. Technische Details stehen dort nicht.
- **Hintergrund-Shader:** Aufbau und Konstanten (Pixel-Filter 745, Spin-Amount 0.25, Contrast 3.5, Lighting 0.4, Farben `#DE443B` / `#006BB4` / `#162325`) entsprechen dem öffentlich kursierenden Balatro-Hintergrund-Shader. Abgeglichen habe ich mit der react-bits-Nachbildung.
- **Aus dem Gedächtnis rekonstruiert und nicht an Quellen geprüft:** CRT-Parameter, Editions-Shader, Dissolve, Flammen, Juice-Formel und Palette. Die Werte sind Annäherungen an den Look und keine Kopie der Originaldateien, denn die Original-Shader sind nicht frei verfügbar.
- Alle Regler lassen sich in der Demo mit **[H]** live einstellen.
