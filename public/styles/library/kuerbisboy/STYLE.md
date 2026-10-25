# Pumpkin Boy — Game Art Style Spec

> A pumpkin-tinted handheld LCD: exactly four shades, Bayer dithering, crisp outlined mini sprites at 2 world units per pixel.

Pumpkin Boy ("Kürbis-Boy" in the reference module) looks like a monochrome handheld console whose screen has an orange tint. Every pixel of the world, every sprite and every HUD window is one of four warm shades: ink brown `#2a1712`, rust `#7c3a1e`, pumpkin `#e0812c` and cream `#f6d7a1`. There are no gradients and no alpha in the art: volume comes from four flat bands joined by single checkerboard rows, transparency and shadows are ordered (Bayer 4x4) dither, glow is a dithered ring. Sprites are tiny text grids (10-26 px) with an automatic 1 px ink outline. The low-res image is upscaled with nearest neighbour, and a faint LCD cell grid, vignette and recessed bezel sit on top at display resolution.

## At a glance

| Property | Value |
| --- | --- |
| Family | Pixel Art · 4 Colours |
| Mood | nostalgic, cosy-spooky, autumnal, crisp, toy-like |
| Best for | survivor-likes, top-down adventures, harvest games with a spooky twist, game jams, monster RPGs |
| Renderer | Canvas 2D, procedural, no image assets |
| Pixel art | yes - `pixelArt: { scale: 2 }` (1 art px = 2 world units, 180 art px visible vertically) |
| Difficulty | 4/10 - tiny sprites are quick, but with 4 colours every new enemy type is harder to tell apart |
| Fonts | Press Start 2P (HUD), built-in 3x5 bitmap digits (damage numbers) |
| Key colours | `#2a1712` ink · `#7c3a1e` rust · `#e0812c` pumpkin · `#f6d7a1` cream |

## When to use it

- **Good fit:** arena / survivor-likes with hordes (outlined tiny sprites stay readable even in big crowds), top-down Zelda-likes, farming or harvest games with a Halloween edge, jam games where a strict palette saves decisions, monster-collecting RPGs with a retro handheld vibe.
- **Good fit:** anything that should feel like a 1990s handheld cartridge - the four shades, the LCD grid and the double-bordered windows sell it instantly.
- **Bad fit:** games where many enemy or item types must be told apart by colour (team colours, elemental colour codes, match-3) - there is only one hue.
- **Bad fit:** high-detail characters, big bosses with fine detail, cinematic lighting, painterly or realistic worlds.
- **Bad fit:** very dense UI with many simultaneous bars - four shades make layered information hard to separate.

## Color palette

| Swatch name | Hex | Role |
| --- | --- | --- |
| Ink (index 0) | `#2a1712` | Outlines, eyes, cracks, HUD borders and text. Never on open ground. |
| Rust (index 1) | `#7c3a1e` | Shadow band, dark actor bodies (hero torso, small enemy), checker shadows, furrow and field edges, trunks. |
| Pumpkin (index 2) | `#e0812c` | Mid tone: hero head, roads, grass tufts, furrows, dithered halos, bar fills. |
| Cream (index 3) | `#f6d7a1` | Backplane: open meadow, highlights, ghost bodies, HUD window fill, damage numbers. |
| LCD gap (overlay) | `#fae4b4` @ 20% | 1 display px grid line between upscaled art pixels (only if upscale >= 3). |
| Vignette / bezel (overlay) | `#2a1712` @ 0-30% | Radial vignette 0 -> 0.16, top bezel 0.30, left bezel 0.24, cell edge 0.035. |

Palette rules:

- **Exactly four colours in the art buffer.** Index grids store 0..3 (-1 = transparent); pixels are written as precomputed 32-bit values. The only non-palette pixels come from overlays drawn *after* upscaling (LCD grid, vignette, bezel) and from anti-aliased HUD text edges.
- **Ground never uses ink.** The floor uses indices 1-3 only, so ink outlines always separate actors from the ground.
- Approximate screen ratio: 60% cream, 25% pumpkin, 12% rust, 3% ink.
- **No alpha in the art.** Fades = Bayer masks; shadows = `(x + y) & 1` checker ellipses in rust; glow = dithered pumpkin rings.
- **Hit flash = palette inversion** `INV = [3, 2, 1, 0]`, never white.
- Any colour coming from shared game code (particles, upgrade icons) is snapped to the nearest of the four shades.

## Typography

**Press Start 2P** (Google Fonts, weight 400 only) - https://fonts.google.com/specimen/Press+Start+2P
Role: every HUD string. Sizes are strict multiples of 8 px: 8 px labels, 16 px values / card text, 24 px kill counter, 32 px clock and titles.

```css
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
.clock-time  { font: 400 32px/36px 'Press Start 2P', monospace; color: #2a1712; text-shadow: 4px 4px 0 #e0812c; letter-spacing: 0; }
.clock-label { font: 400 8px 'Press Start 2P', monospace; color: #7c3a1e; letter-spacing: 1px; text-transform: uppercase; }
.lvl         { font: 400 16px/20px 'Press Start 2P', monospace; background: #2a1712; color: #f6d7a1; text-transform: uppercase; }
```

Text effects: no blur, no glow. Big numbers and titles get a **hard 4 px pumpkin offset shadow** (`4px 4px 0 #e0812c`). Secondary text is rust, never reduced opacity. Inverted tags are cream on ink.

**3x5 bitmap digits** (built into the module) for floating damage numbers: glyph grid 3 wide x 5 tall, 1 px spacing, cream fill (crit: pumpkin + `!`), full ink outline plus an extra rust underline row so 1 px gaps between digits stay readable.

## Rendering technique

1. **Constants.** `PS = 2` world units per art pixel. The game shows 360 world units vertically, so the art buffer is `360 / 2 = 180` px tall. The renderer picks `up = round(displayH / 180)` and a buffer of `ceil(displayW / up) x ceil(displayH / up)`.
2. **Palette as 32-bit words.** `PX32[i] = (255 << 24) | (b << 16) | (g << 8) | r` for the 4 colours, so ImageData can be written through a `Uint32Array`.
3. **Index grids (`IG`).** Every sprite is an `Int8Array` of palette indices (-1 = empty) built from text rows: `'0'..'3'` = colour, `'.'` = keep, `'x'` = erase. Parts are composed by stamping rows into the same grid (hero = body rows at y 10 + head rows at x 1).
4. **Auto outline.** `outline(g, col = 0)` grows the grid by 1 px on each side and fills every empty pixel that has a filled 4-neighbour with `col`. The hero gets `outline(outline(g), 3)` = ink line plus a cream halo.
5. **Bake at init.** Each grid becomes up to four canvases: right, left (mirrored), and palette-inverted right/left for hit flashes. Also baked: dither-faded ghost copies (25/50/75%), shadow ellipses per size (two checker phases), halo rings, puff frames, number sprites (cached by string).
6. **Ground chunks.** 256 world units = 128 art px per chunk, generated per pixel into ImageData (see below), drawn at integer positions.
7. **Per frame, in the art buffer:** ground chunks -> pickups -> checker shadows of all props / enemies / hero -> y-sorted props, enemies and hero -> orbitals -> projectiles -> particles -> damage numbers. Every blit is snapped: `px = round(x / PS - w * ax)`.
8. **Upscale** the buffer to the display with `imageSmoothingEnabled = false`.
9. **Display overlay** at full resolution (cached per size): LCD cell grid, vignette, bezel gradients. Then the HTML/CSS HUD on top.

## Background and ground

The floor is an autumn farmland seen from straight above, generated as deterministic functions of world position (`fieldsAt(wx, wy)`):

- **Road net:** a coarse Voronoi (cell 1150 world units), domain-warped by Perlin (amplitude 64, wavelength 540). Roads lie on the cell edges: half-width 12.5 world units for country roads (62% of edges) or 7 for footpaths. `rv < 0` = road; `rv < 2.4` gives a 1 px checkerboard-dithered fringe.
- **Plazas:** on 62% of Voronoi junctions a disc of radius 58-94 world units (graveyard or village square) filled with Worley flagstones 6.5 x 4.6 art px; joints and the lower lip of each stone are pumpkin, faces cream.
- **Fields:** a finer Voronoi patchwork (cell 400) clustered into farmland zones by low-frequency fbm. Each field has one furrow orientation (rows, columns, `/`, `\`). Field interior is inset 12 units from cell edges and 20 from roads.
- **Tall grass / forests:** fbm blobs, mostly outside farmland.

Per-pixel patterns (`gx, gy` are global art-pixel coordinates):

- `grassPx`: cream with sparse pumpkin `v` tufts or double blades in staggered 6x5 cells; density `0.06 + 0.5 * macro noise`.
- `tallPx`: 4x4 motif `3,2,3,3 / 2,3,2,3 / 2,1,2,3 / 3,3,3,3`, rows staggered by 2 px, 1 in 8 motifs knocked out.
- `roadPx`: pumpkin with a rust speck at `(gy & 3) == 1` every 4th column (rows staggered), 2 of 3 kept.
- `fieldPx`: furrow every 6 px (`r == 0`, diagonal fields also `r == 1`) in pumpkin with rust clods (1 in 11 blocks of 2x2), a crumb row in pumpkin, the rest cream.

An **edge pass** then makes every border crisp: a field pixel touching a non-field pixel becomes rust if the non-field is below it, else pumpkin; tall grass gets a rust bottom edge and pumpkin top/side edge; a meadow pixel directly below a field or tall grass becomes a checkerboard drop shadow (`(i + j) & 1 ? 2 : 3`).

**Decals** are stamped as text glyphs after the edge pass (34-unit scatter cells): `flower ['.2.','212','.2.']`, `daisy`, `stone ['.22.','2332','.11.']`, `pumpkinS ['..1..','.222.','22322','.111.']`, pebbles on roads, leaves / mushrooms in forests, bones and cracks on plazas. Field pumpkins `pumpkinF ['...1...','.23212.','2322221','2222211','.11111.']` are snapped onto the nearest furrow.

## Characters

The hero (reference: pumpkin-head Jack) is a 12x14 grid composed of a 10x10 head over a 12x4 body, then double outlined to 16x18 art px (32 x 36 world units). Head (verbatim):

```text
....11....
.22211222.
2221221222
2223222322
2233323332
2222222221
2322222231
2333233332
.22322322.
..222222..
```

Body frames (rows placed at y = 10): row 0 is always `...113311...` (collar with cream buttons).

| Frame | Rows 1-3 |
| --- | --- |
| idle | `..21111112..` `...111111...` `...11..11...` |
| w0 | `.321111112..` `...111111...` `..11...11...` |
| w1 | `.321111112..` `...111111...` `...11.11....` |
| w2 | `.321111112..` `...111111...` `...11...11..` |
| w3 | `.321111112..` `...111111...` `....11.11...` |
| throw | `..2111111...` (row 0 `...1133112..`) |
| dash | `3321111112..` `..1111111...` `.11.....11..` (head shifted +1,+1) |

Construction rules: big pumpkin-orange head (index 2) with cream carved eyes and grin (3) and rust ribs/stem (1); small rust body; legs as 2-px pairs. Idle frame 2 drops the head by 1 px. Facing left = mirrored canvas. Feet anchor at bottom centre; the sprite sits 1 px below the logical position so it stands *on* its shadow.

## Enemies and props

All enemies use a single ink outline (no cream halo), so the hero is the only actor with a light rim.

- **Small melee enemy** (walking rutabaga, 10x12 + outline): rust body, pumpkin leaf crown, cream belly band and ink/cream eyes. Grid:
  ```text
  ..2..2..2.
  ..22.2.22.
  ...21212..
  ..111111..
  .11111111.
  1113010311
  1113313311
  2121212121
  .33300332.
  ..333322..
  ```
  plus 4 leg frames (`['..1.32.1..','.1......1.']`, ...). Leaves sway 1 px on frames 1 and 3.
- **Fast floating enemy** (ghost, 11x14): cream body with ink eyes, 3 tail frames. After outlining, rows dissolve with a Bayer threshold: rows < 9 kept 100%, 9-10 75%, 11-12 50%, 13+ 30% (phase shifted per frame). Hovers 3-4 px above a small 6x2 shadow.
- **Brute** (colossus, 26x27 procedural): dithered ellipse rx 8.8 / ry 8.6 with bands by height - rust (t < 0.4), checker, pumpkin (< 0.7), checker, cream; right flank one band darker, a checkered pumpkin rim light on the upper left. Ink cracks and angry brows, cream eyes, a cream chest core whose ring pulses ink/rust, 1-px-gap root arms that get their own outline, leaf crown, 4 stomp frames.
- **Pickups:** gems 3x3 / 5x7, two-frame blink (pumpkin-edged vs. all-cream), rust 2x1 drop dot underneath; big gems spawn a 3x3 cream star.
- **Props:** round autumn trees (24x27 or 18x21) from blob unions, lit from the upper left with `L = -0.62 nx - 0.78 ny`, staggered darker leaf-clump arcs every 4 rows / 5 columns and a rust rim along the canopy bottom; a dark variant shifts all indices by -1. Also dead trees, bushes, rocks, stumps, pumpkins, jack-o-lanterns, scarecrows, fences, graves, lamp posts and signs - all text grids with ink outline (fences without outline).
- Readability rule: distinguish types by **silhouette and value mass** - dark rust blob (melee), cream blob with dither tail (floater), huge banded oval (brute).

## Effects and particles

- **Projectiles:** 4 rotation frames of an outlined seed (`['333','322']`, `['32','33','23']`, `['33.','.33']`, `['.33','33.']`), frame = `floor(spin / (PI/4)) & 3`. Trail: one rust pixel at `pos - v * 0.016 * 2.4` and one pumpkin pixel at `pos - v * 0.016 * 1.2`.
- **Hit:** inverted sprite while `flash > 0.4`; 3 pixel sparks (1 ink, 2 cream), speed 40-80, life 0.22 s.
- **Death:** inverted frame for 0.22 s, then a 4-frame puff (radius scale 0.6 / 1 / 1.7 for floater / normal / brute): one blob, five blobs, ring of six, ring of seven loose pumpkin dots. Cream with a pumpkin underside and ink outline (frame 3 rust outline). Plus 8 (brute 16, ghost 5) pixel particles cycling rust, pumpkin, cream, ink with gravity 260.
- **Particles:** always 1x1 or 2x2 art pixels in a palette colour; they **blink out** (skip every other 1/20 s) in the last 30% of their life instead of fading.
- **Spawn:** enemies rise out of the ground (clip rect at the feet, offset `h * outQuad`), ghosts fade in via 3 dither masks.
- **Pickup / level-up:** cream 3x3 stars (`['.3.','333','.3.']` / `['3.3','.3.','3.3']`) alternating; level-up = 6 stars orbiting the hero on an expanding ring 12 -> 28 units.
- **Dash:** two pumpkin checkerboard silhouettes 9 and 18 units behind, 3 puffs.
- **Hurt:** 10 2x2 particles in a ring (ink/rust), hero blinks at 15 Hz while invulnerable.

## Lighting, shadows and post-processing

- **Shadows:** rust checkerboard ellipses: hero 11x3 px, small enemy 9x2, ghost 6x2, brute 20x4, big tree 20x5 (+2 px right), props 10x3. Two checker phases are pre-baked and chosen by `(px + py) & 1` so the checker always locks to the world grid instead of crawling.
- **Light:** no light system. Lit objects swap to a brighter frame (lantern body rows `1131311 / 2333332` lit vs. `1121211 / 2222222` dark) and draw a dithered pumpkin halo ring first: `haloSprite(r0, r1, density)` keeps pixels with `r0 < d < r1` and `bayer < density * (1 - 0.6 * (d - r0)/(r1 - r0))`. Flicker: lit when `sin(t*11 + i*2.1) + sin(t*27 + seed*9) > -0.6`.
- **LCD overlay** (display res, after upscale, only if `up >= 3`): a 1 px line `rgba(250,228,180,0.2)` at every multiple of `up` (cell gaps show the light backplane - visible on dark pixels, invisible on cream) and a `rgba(42,23,18,0.035)` line at `up - 1`.
- **Vignette:** radial gradient from `0.42 * min(W,H)` to `0.58 * hypot(W,H)`, ink 0 -> 0.16.
- **Recessed bezel:** top linear gradient ink 0.30 -> 0 over `max(4, 2*up)` px, left gradient 0.24 -> 0.
- No bloom, blur, colour grading or screen shake effects beyond camera shake.

## UI and HUD

Game-Boy windows everywhere: cream fill, 4 px ink border, 4 px cream gap, 4 px ink outer ring, square corners. Bars are segmented and pixel-hard. Icons are 14x14 four-colour grids, outlined, drawn at integer multiples (`floor(size / 16)`). Hurt state inverts the HP window (ink fill, cream text). Level-up and game-over darken the scene with an ink checkerboard, not a translucent fill. Cards show a blinking ink triangle cursor (`steps(1)`).

```css
.win { background:#f6d7a1; border:4px solid #2a1712; border-radius:0;
       box-shadow:0 0 0 4px #f6d7a1, 0 0 0 8px #2a1712;
       font-family:'Press Start 2P', monospace; color:#2a1712; }
.xp      { height:28px; overflow:hidden; }
.xp-fill { background:repeating-linear-gradient(90deg,transparent 0 12px,#f6d7a1 12px 16px),
                      linear-gradient(#f6d7a1 0 4px,#e0812c 4px 16px,#7c3a1e 16px); transition:none; }
.hp-bar  { width:208px; height:24px; background:#f6d7a1; border:4px solid #2a1712; border-radius:0; }
.hp-fill { background:repeating-linear-gradient(90deg,transparent 0 8px,#f6d7a1 8px 12px),
                      linear-gradient(#e0812c 0 4px,#7c3a1e 4px); transition:none; }
.hurt .win { background:#2a1712; color:#f6d7a1; }
.icon    { width:32px; height:32px; image-rendering:pixelated; }
.overlay { background:repeating-conic-gradient(#2a1712 0 25%,transparent 0 50%) 0 0/10px 10px; }
.cursor  { animation:blink 1s steps(1) infinite; }
@keyframes blink { 0% { opacity:1 } 60% { opacity:0 } }
```

## Motion and animation

- Everything snaps to the art grid (2 world units). No sub-pixel motion, no rotation, no scaling.
- Hero: idle 2 frames at 2.2 fps (head bobs 1 px); walk 4 frames, `floor(anim * 0.9) & 3`, 1 px lift on odd frames; throw frame while `shootT > 0.55`; dash frame + afterimages.
- Small enemy: 4 frames at `anim * 1.1 + seed * 7`, 1 px lift on odd frames. Brute: 4 frames at `anim * 0.6`, legs lift 2 px alternately, body bobs 1 px, arms swing 1 px. Ghost: 3 frames at 6 fps, hover bob 1 px at 3 fps.
- Pickups: 2-frame blink at 3 fps, 1 px bob at 2 fps, spawn hop `round(sin(pop * PI) * 4)` px.
- Damage numbers: drawn 1 px higher during the first 20% of life, blink at 20 Hz in the last 25%.
- Fades are always dither steps or blinking; flicker is frame swapping. UI uses `steps(1)` and `transition: none`.

## Do and don't

Do:

- Keep every art-buffer pixel on one of the four indices; write sprites as text grids.
- Auto-outline every sprite with 1 px ink, and give the hero an extra cream halo.
- Fake shadows, transparency and glow with Bayer dither or checkerboards locked to world pixels.
- Render at 2 world units per pixel and upscale by an integer factor with smoothing off.
- Separate enemy types by silhouette and value mass.
- Reserve ink for outlines and details; the ground uses rust, pumpkin and cream only.
- Use palette inversion for hit flashes and frame swaps for flicker.

Don't:

- Add a fifth colour, gradients or `globalAlpha` inside the art buffer.
- Draw sprites at sub-pixel positions, rotate or scale them.
- Use image smoothing or anti-aliased paths in the world.
- Paint large ground areas in ink.
- Use blurred glows or soft shadows.
- Make sprites much larger than ~26 px or rely on hue to distinguish factions.

## Implementation recipe

1. Fix the camera to show 360 world units vertically; set `PS = 2`, buffer height 180 px, `up = round(displayH / 180)`.
2. Define the 4 hex colours and precompute their `PX32` words and the inversion map `[3,2,1,0]`.
3. Implement `IG(w,h)` with `rows()`, `outline(g, col)`, `toCanvas(g, map)` and a sprite-set helper producing right / left / inverted canvases.
4. Draw every actor as text rows (palette index digits). Keep the hero ~16x18 px incl. outline, small enemies ~12x14, brutes ~28x29.
5. Compose characters from parts (head + body frames), then outline: ink for everyone, ink + cream halo for the hero.
6. Write ground as per-pixel pattern functions of global art-pixel coordinates (grass tufts, tall grass motif, furrows, road speckle), choose materials from smooth noise / Voronoi fields, run an edge pass, stamp decal glyphs, write into a `Uint32Array` ImageData. Cache by chunk.
7. Bake checker shadow ellipses (2 phases), dithered halo rings, puff frames, number sprites.
8. Per frame: ground, pickups, shadows, y-sorted actors and props, orbitals, projectiles, pixel particles, numbers - all via `blit()` that rounds to whole art pixels.
9. Upscale with `imageSmoothingEnabled = false`, then draw the cached LCD overlay (grid + vignette + bezel).
10. Build the HUD as double-bordered cream windows in Press Start 2P with segmented bars, sizes in multiples of 8 px.
11. Hook gameplay events to on-style effects: inverted flash + sparks on hit, puff + pixel shower on death, stars on pickup, blink on invulnerability.

## Code

The blocks below are ported from the reference module and run on their own. A complete runnable scene (ground, hero, three enemy types, props, lanterns, projectiles, LCD overlay and HUD) is in [`starter.js`](starter.js); the full reference module is [`../../js/styles/kuerbisboy.js`](../../js/styles/kuerbisboy.js).

Palette, index grids and auto outline:

```js
const HEX = ['#2a1712', '#7c3a1e', '#e0812c', '#f6d7a1'];
const PX32 = HEX.map((h) => { const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16);
  return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0; });
function IG(w, h) {
  const a = new Int8Array(w * h).fill(-1);
  return { w, h, a,
    set(x, y, v) { if (x >= 0 && y >= 0 && x < w && y < h) a[y * w + x] = v; },
    get(x, y) { return x >= 0 && y >= 0 && x < w && y < h ? a[y * w + x] : -1; },
    rows(rows, ox = 0, oy = 0) {
      rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const c = r.charCodeAt(x);
        if (c >= 48 && c <= 51) this.set(ox + x, oy + y, c - 48); else if (c === 120) this.set(ox + x, oy + y, -1); } });
      return this;
    } };
}
function outline(g, col = 0) { // grow by 1 px, fill empty 4-neighbours of filled pixels
  const o = IG(g.w + 2, g.h + 2);
  for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) {
    const v = g.get(x - 1, y - 1);
    if (v >= 0) o.a[y * o.w + x] = v;
    else if (g.get(x - 2, y - 1) >= 0 || g.get(x, y - 1) >= 0 || g.get(x - 1, y - 2) >= 0 || g.get(x - 1, y) >= 0) o.a[y * o.w + x] = col;
  }
  return o;
}
function toCanvas(g, map) { // map = [3,2,1,0] gives the hit-flash copy
  const c = document.createElement('canvas'); c.width = g.w; c.height = g.h;
  const ctx = c.getContext('2d'), img = ctx.createImageData(g.w, g.h), d = new Uint32Array(img.data.buffer);
  g.a.forEach((v, i) => { if (v >= 0) d[i] = PX32[map ? map[v] : v]; });
  ctx.putImageData(img, 0, 0);
  return c;
}
// hero: body rows at y 10, head at x 1, then ink outline + cream halo
// const hero = toCanvas(outline(outline(IG(12, 14).rows(BODY_W0, 0, 10).rows(HEAD, 1, 0)), 3));
```

Bayer dither fade (ghost tail) and grid-locked checker shadow:

```js
const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const bay = (x, y) => B4[((y & 3) << 2) | (x & 3)];
function dissolveRows(o, f) { // o = outlined index grid; lower rows keep fewer pixels
  const g = IG(o.w, o.h);
  for (let y = 0; y < o.h; y++) {
    const lv = y < 9 ? 1 : y < 11 ? 0.75 : y < 13 ? 0.5 : 0.3;
    for (let x = 0; x < o.w; x++) { const v = o.a[y * o.w + x]; if (v >= 0 && bay(x + f, y + f * 2) < lv) g.a[y * o.w + x] = v; }
  }
  return g;
}
function shadowPair(w, h) { // two checker phases, rust (index 1)
  return [0, 1].map((ph) => { const g = IG(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (x + 0.5 - w / 2) / (w / 2), dy = (y + 0.5 - h / 2) / (h / 2);
      if (dx * dx + dy * dy <= 1.05 && ((x + y + ph) & 1) === 0) g.set(x, y, 1);
    }
    return toCanvas(g); });
}
function drawShadow(ctx, pair, x, y) { // x, y in art pixels; phase picked so the checker never crawls
  const w = pair[0].width, h = pair[0].height, px = Math.round(x - w / 2), py = Math.round(y - h / 2);
  ctx.drawImage(pair[(px + py) & 1], px, py);
}
```

Ground pixel patterns and the edge pass (global art-pixel coordinates):

```js
function hashInt(x, y, s) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return h >>> 0; }
function grassPx(gx, gy, mac) { // cream with staggered 'v' tufts in pumpkin
  const cy = Math.floor(gy / 5), sx = gx + ((cy & 1) ? 3 : 0), cx = Math.floor(sx / 6), h = hashInt(cx, cy, 77);
  if ((h & 1023) / 1024 < 0.06 + 0.5 * mac) {
    const lx = sx - cx * 6 - (h >>> 10) % 4, ly = gy - cy * 5 - (h >>> 13) % 3;
    if (((h >>> 16) & 3) < 3) { if ((ly === 0 && (lx === 0 || lx === 2)) || (ly === 1 && lx === 1)) return 2; }
    else if ((lx === 0 || lx === 2) && (ly === 0 || ly === 1) && !(lx === 2 && ly === 0)) return 2;
  }
  return 3;
}
function fieldPx(gx, gy, o) { // o: 0 rows, 1 columns, 2 '/', 3 '\'
  const f = o === 0 ? gy : o === 1 ? gx : o === 2 ? gy + gx : gy - gx, r = ((f % 6) + 6) % 6, diag = o >= 2;
  if (r === 0 || (diag && r === 1)) return hashInt(gx >> 1, gy >> 1, 21) % 11 === 0 ? 1 : 2; // furrow + clods
  if (r === (diag ? 2 : 1)) return (gx & 3) === 1 && hashInt(gx >> 2, gy, 22) % 3 === 0 ? 2 : 3;
  return 3;
}
function edgePass(mat, col, W, H) { // mat: 0 grass, 1 tall, 2 road, 3 field
  for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) {
    const k = j * W + i, m = mat[k];
    if (m === 3) { if (mat[k - 1] !== 3 || mat[k + 1] !== 3 || mat[k - W] !== 3 || mat[k + W] !== 3) col[k] = mat[k + W] !== 3 ? 1 : 2; }
    else if (m === 1) { if (mat[k + W] !== 1) col[k] = 1; else if (mat[k - W] !== 1 || mat[k - 1] !== 1 || mat[k + 1] !== 1) col[k] = 2; }
    else if (m === 0 && (mat[k - W] === 3 || mat[k - W] === 1)) col[k] = ((i + j) & 1) ? 2 : 3; // dithered drop shadow
  }
}
```

Pixel-snapped blit and the nearest-neighbour upscale with LCD grid:

```js
const PS = 2; // world units per art pixel
function blit(ctx, img, x, y, ax = 0.5, ay = 1) { // world coords, buffer transform = 1 / PS
  ctx.drawImage(img, Math.round(x / PS - img.width * ax), Math.round(y / PS - img.height * ay));
}
function present(display, buffer, up) {
  const d = display.getContext('2d');
  d.imageSmoothingEnabled = false;
  d.drawImage(buffer, 0, 0, buffer.width * up, buffer.height * up);
  if (up >= 3) {
    d.fillStyle = 'rgba(250,228,180,0.2)';
    for (let x = 0; x < display.width; x += up) d.fillRect(x, 0, 1, display.height);
    for (let y = 0; y < display.height; y += up) d.fillRect(0, y, display.width, 1);
  }
  const W = display.width, H = display.height;
  const g = d.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.hypot(W, H) * 0.58);
  g.addColorStop(0, 'rgba(42,23,18,0)'); g.addColorStop(1, 'rgba(42,23,18,0.16)');
  d.fillStyle = g; d.fillRect(0, 0, W, H);
}
```

## Adapting it to your game

- **Keep fixed:** exactly four shades ordered dark -> light, 1 art px = 2 world units (or a consistent equivalent ~180 px tall view), auto ink outline, dither-only shading, palette-inversion flash, LCD overlay, double-bordered windows.
- **Palette swaps are allowed** as long as you keep four shades of one hue family with similar value steps (luminance roughly 10% / 25% / 55% / 85%): e.g. a green "pea" LCD `#0f380f #306230 #8bac0f #9bbc0f`, an icy blue, a grape purple. Swap all four at once - never mix two tints.
- **New character types:** start from an existing grid size class (10x12 small, 11x14 floater, 26x27 brute), make the silhouette unique first, then the value mass (mostly dark vs. mostly light). Add at most one distinctive detail (horn, tail, crown).
- **Other genres:** for side-view platformers use the same grids at ~16 px tall characters and tile the ground with the same patterns (furrows become brick rows). For RPG towns, plazas with Worley flagstones and the text-grid props carry over directly.
- **Other resolutions:** change only the integer upscale factor; never scale the art buffer by a non-integer. Below `up = 3` drop the LCD grid lines but keep the vignette.

## Performance notes

- All sprite variants (facing, inverted, faded, puffs, halos, shadows, number strings) are baked once; per frame it is only `drawImage` at integer coordinates into a ~320x180 buffer.
- Ground chunks (128x128 art px) are generated by a generator function that `yield`s every 16 rows, so chunk baking spreads over frames. The expensive noise field (`fieldsAt`, two Voronoi lookups + Perlin warps + fbm) is sampled on a coarse 4 px grid and bilinearly interpolated; only flagstones use per-pixel Worley.
- Writing pixels through a `Uint32Array` over ImageData is ~10x faster than `fillRect` per pixel.
- The LCD overlay is cached per display size and composited with a single `drawImage`.
- Number sprites are cached by string (cleared after 400 entries); shadows by size.
- Hot spot: fast camera movement requesting many new ground chunks at once.

## Copy-paste prompt

```text
Build my game <X> in the "Pumpkin Boy" style (4-colour pumpkin-tinted handheld LCD pixel art):
- Use ONLY 4 colours in the game image: ink #2a1712, rust #7c3a1e, pumpkin #e0812c, cream #f6d7a1. No alpha, no gradients in the art.
- Render into a low-res buffer at 2 world units per pixel (~180 px tall view), upscale by an integer with imageSmoothingEnabled = false.
- Define every sprite as text rows of palette digits '0'-'3' ('.' = empty), compose from parts (head + body frames).
- Auto-outline every sprite with a 1 px ink 4-neighbour outline; the hero gets an extra 1 px cream halo outline.
- Hero ~16x18 px incl. outline (big pumpkin-orange head, cream carved face, small rust body); small enemies ~12x14 rust bodies; floaters cream with a Bayer-dithered fading tail; brutes ~28 px banded dithered ovals.
- Shading = four flat bands joined by single checkerboard rows, light from the upper left. Transparency/fades = Bayer 4x4 masks.
- Shadows = rust checkerboard ellipses with two baked phases locked to the pixel grid. Glow = dithered pumpkin halo ring + lit sprite frame.
- Ground: mostly cream meadow with pumpkin 'v' tufts, pumpkin roads with rust specks, fields with furrows every 6 px, crisp 1 px rust/pumpkin borders, dithered drop shadows, tiny decal glyphs. Never ink on the ground.
- Hit flash = palette inversion (0<->3, 1<->2). Particles are 1-2 px squares that blink out instead of fading.
- Animation by frame swapping only: 2 idle, 4 walk frames, 1 px bob on odd frames; everything snaps to whole pixels.
- After upscaling: faint LCD cell grid rgba(250,228,180,0.2), ink vignette to 16%, recessed top/left bezel.
- HUD: cream windows with 4 px ink border + 4 px cream gap + 4 px ink outer ring, segmented bars, Press Start 2P in multiples of 8 px, hard 4 px pumpkin text shadow on big numbers.
- Damage numbers from a 3x5 bitmap font, cream with ink outline (crits pumpkin with '!').
```
