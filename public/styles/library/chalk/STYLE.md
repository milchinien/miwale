# Chalkboard — Game Art Style Spec

> Drawn live with pastel chalk on a slate-green school board: broken grainy strokes, loose hatching, eraser smears and doodles.

The whole world is one big Halloween blackboard drawing. Every figure is a simple doodle: a few smooth closed shapes, each filled with the board colour, given a faint translucent "rub" of chalk, hatched with loose parallel lines and outlined with a broken, pressure-varying chalk stroke. A grain mask knocks tiny holes into every stroke so the dark board shows through. Pastel chalks (orange, lavender, mint, butter yellow, pink, light blue) sit on a dark slate-green board inside a wooden frame with chalk sticks on the ledge. Nothing glows and nothing explodes: figures are *drawn onto* the board when they appear and *wiped off with an eraser* when they disappear. The module's cast – a cloaked main character with a round orange head and a carved yellow face, cream root-bulb creatures with lavender caps, white floating spirits and a lavender giant – is used below as the example.

## At a glance

| | |
| --- | --- |
| Family | Traditional media · Chalk |
| Mood | playful, handmade, nostalgic, cozy-spooky, doodly |
| Best for | top-down action games, kids/educational games, cozy Halloween games, board-game adaptations |
| Renderer | Canvas 2D, procedural, no image assets |
| Pixel art | No – native resolution, sprites baked at 2–3.5 px per world unit |
| Complexity | 5/10 – forgiving stroke, but every figure needs several redrawn variants and the ground is expensive |
| Fonts | Cabin Sketch, Fredericka the Great, Architects Daughter, Rock Salt |
| Key colours | board `#25332d`, chalk `#eeeee5`, orange `#f89c52`, lavender `#c2acec`, mint `#98deb2`, yellow `#f9e58c` |

## When to use it

Good fits:
- **Top-down action with many figures** – the board colour halo keeps doodles readable even on hatched ground.
- **Kids, school or educational themes** – the blackboard is instantly familiar.
- **Cozy-spooky / seasonal projects** – pastel chalk on dark green softens horror themes.
- **Board-game, puzzle or strategy adaptations** – region borders are crisp white chalk lines, like a drawn map.

Bad fits:
- **Realistic or gritty projects** – chalk always reads as a child's drawing.
- **Glow-heavy sci-fi, neon, bullet hell** – the style has no light emission; dozens of bright effects turn into white mush.
- **Large crowds of one colour** – 40 lavender creatures blend into a lavender blob; vary colours per type.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Slate Board | `#25332d` | Ground base, sprite "eraser halo", fill of every hole (eyes, mouths) – ~55% of the screen |
| Board Deep | `#1c2823` | Text shadows, HUD panel background `rgba(22,32,28,.55)` |
| White Chalk | `#eeeee5` | Main outlines, the main character's cloak, floating spirits, paths, region borders, HUD frames |
| Pumpkin Orange | `#f89c52` | Main character's round head, gourds, core of the large creature, labels |
| Deep Orange | `#de6c34` | Shadow hatching and ribs on orange objects |
| Lavender | `#c2acec` | Caps of the small creatures, forest cross-hatch, large creature body |
| Mint | `#98deb2` | Meadow tufts, leaves, the main character's scarf, progress bar |
| Leaf Green | `#70bc7e` | Second leaf colour, stems |
| Butter Yellow | `#f9e58c` | Eyes and mouths, field rows, large floating numbers, stars, title text |
| Pink | `#f7a8c6` | Status bar, hearts, scarf stripes, large collectible |
| Light Blue | `#9eccf0` | Frost biome, small collectibles, hem of the floating spirit |
| Cream | `#f4e8ce` | Bulbs and legs of the small creatures, seed projectiles |
| Eraser Wood | `#b08058` | Eraser top (only on the eraser that wipes figures away) |
| Frame Wood | `#93663f` | Board frame (gradient `#7a5232 → #93663f → #5c3b22`) |
| Frame Wood Dark | `#5c3b22` | Frame shadow side |

Palette rules:
- The board colour dominates. Chalk is *translucent*: rub fills use alpha 0.1–0.72; only eyes, mouths and crumbs reach 0.95–1.
- Pastels only. No black, no saturated primaries, nothing brighter than `#eeeee5`.
- One chalk colour per biome (meadow mint, forest lavender, field orange/yellow, frost light blue) and one per creature type.
- Holes are board-coloured (`fillBoard()`), never black. Shadows are `rgba(10,18,14,0.55→0)` radial ellipses.
- Brown wood exists only on the screen frame and the eraser.

## Typography

- **Cabin Sketch** 400/700 – HUD numbers, floating numbers, card titles, counters. `https://fonts.googleapis.com/css2?family=Cabin+Sketch:wght@400;700`
  `font: 700 34px/1 'Cabin Sketch', cursive; letter-spacing: 2px; color: #eeeee5; text-shadow: 0 0 4px #1c2823;`
- **Fredericka the Great** 400 – big titles (announcement 78px, end screen 66px, pause 64px). `https://fonts.googleapis.com/css2?family=Fredericka+the+Great`
  Title underline: a 5px orange `#f89c52` bar with `border-radius: 50% 40% 60% 30%`, rotated −1°.
- **Architects Daughter** 400 – labels and body text (15–21px). `https://fonts.googleapis.com/css2?family=Architects+Daughter`
- **Rock Salt** 400 – handwritten words scribbled on the ground ("Boo!", "Psst!"), 8 world units tall, alpha 0.62, with a wobbly underline at 0.08× font size.

Text effects: no hard outlines in the DOM HUD; a soft `0 0 3–4px #1c2823` shadow. Canvas floating numbers are white (large variant: yellow 13 units, small 9.5 units), get a thick `rgba(30,42,37,0.88)` stroke of 0.3× font size behind them, the large ones an orange underline swoosh, and the grain mask at 0.8. Every HUD element carries an SVG `feTurbulence` mask so text has chalk holes too.

## Rendering technique

1. **Init** – choose `K = clamp(round(screenH / 360 * 4) / 4, 2, 3.5)` sprite px per world unit. Build the 128×128 **grain mask**, the ground textures, and all sprites.
2. **Chalk toolkit** – all art is made with three functions (see Code):
   - `stroke(pts, {w, c, a, closed, dbl, step, j})` – resample the polyline every `step` (1.0) units, jitter each point ±`j` (0.12), split into runs of 3–7 points, each run with width ×0.78–1.18 and alpha ×0.72–1.0; closed shapes overshoot 1–3 points past the start; then a second "double pass" offset by ±0.32·w at 45% width and 40% alpha.
   - `hatch(poly, {ang, sp, w, c, a, skip, inset})` – clip to the polygon, draw quadratic lines at spacing `sp·(0.75–1.25)` with random start/end (55–115% of the radius) and ±0.5 bend.
   - `rub(poly, c, a)` – flat translucent fill. `fillBoard(poly)` – opaque board-colour fill to hide what's behind.
3. **Shape recipe** (every body part): `fillBoard → rub → hatch (clipped) → stroke outline`. Details (eyes, mouth) come last.
4. **Sprite bake (`mk`)** – draw into an offscreen canvas with `setTransform(K,0,0,K,ax,ay)`, round caps/joins; punch the grain with `destination-out` (alpha 1, pattern offset per sprite); then build the **eraser halo**: threshold alpha > 26 into a solid board-colour silhouette, draw it 12× around a 1-unit circle (+6 at half radius), put it behind the chalk at alpha 0.6–0.9. Also bake a white flash copy (`source-atop`, alpha 0.6) and a mirrored copy for facing left.
5. **Variants** – main character 4 walk + 2 idle frames, each in 3 boil variants (seeds `100 + i·7 + v·31`); creatures 4 frames × 3 variants (2 built lazily in background); collectibles 2, lanterns 3.
6. **Ground chunks** (256 units, ≤ 2.5 px/unit) – generator function that yields every row: compute noise fields on a 65×65 grid (4-unit cells), convert to signed distances, then per pixel composite board + textures + border lines; then stamp decals. Chunk work is limited to 5 ms per frame.
7. **Per frame** – blit ground chunks; ground overlay (smears); collectibles; shadows; y-sorted props/creatures/main character (sprite swaps only); lanterns; projectiles; particles; floating numbers; screen overlay (cached frame parts + clock face + two drawn hands).
8. Positions are snapped to whole screen pixels (`Math.round(x * S) / S`) to avoid shimmer.

## World and ground

The ground is a chalk drawing of a map, not a texture: biomes are separated by crisp white chalk border lines, and each biome is filled with its own pastel stroke motif. Fields (world units, Perlin/fbm):
- `A = warped fbm(x/760)` → biome: `A < 0.455` forest, `A > 0.553` field, else meadow; inside meadow `F = fbm(x/420) > 0.585` is frost.
- `R = perlin(x/1250)` domain-warped → path where `|R| / |∇R| < 8.5` units.
- Distances: `d = (A − threshold) / |∇A|` gives a distance in world units, wobbled by `perlin(x/11)·0.45`.

Per pixel:
- **Board**: `#25332d` + `(H − 0.5)·22` (H = fbm/520) + smudge texture (160 radial blots r 8–45 units alpha 0.03–0.09, light or dark; 40 long swipes) clamped ±16.
- **Dust tint**: 5–8% of the biome colour, faded in from the borders.
- **Texture** (512² tiles drawn with wrap-around so they tile):
  - Meadow: one grass tuft per 46 unit² – 3–4 parallel strokes 2.4–4.4 units long, ±0.45 rad from vertical, 0.55 units wide; colours 60% mint, 26% leaf green, 9% yellow, 5% white; alpha 0.5–0.88.
  - Forest: two families of broken diagonal lines (slope +1, spacing 3.6, lavender/pink; slope −1, spacing 4.2, lavender/white), segments 2–9 units, gaps 1.2–5.5 → a woven cross-hatch.
  - Field: Worley cells (size 82) are plots, each with one of three patterns: orange lines slope 0.5, yellow lines slope −1, or short vertical yellow/orange ticks in rows; plot borders are 0.42-unit yellow lines.
  - Frost: light-blue radial rubs (r 6–18, alpha 0.12–0.26), faint white swipes, white/blue asterisks.
  - Density × `0.32 + 0.68·smoothstep(0.28, 0.72, T)` (T = fbm/150), × grain value `gm`.
- **Borders**: wherever `|d| < 0.5` units a white chalk line, alpha `0.8·(0.3 + 0.7·gm)`. Textures fade to 0 within ~1.4 units of the line, so the border reads cleanly.
- **Path**: band 17 units wide, +6 brightness, filled with stipple dots (r 0.3–0.55) whose alpha peaks 1.3 units inside the edge (dotted border) and is sparse in the middle; pebbles are outlined ellipses (alpha 0.62).
- **Decals**: eraser swipes (60% of 300-unit cells: arcs r 60–140, width 14–26, 3 passes alpha 0.026 + 8 thin streaks 0.045), doodles every 66 units (30% chance, 7+ units away from borders; set chosen per biome: forest bat/moon/spiral/spirit, field gourd/root bulb/arrow/tally, meadow flower/heart/star/tic-tac-toe, frost snowflake/star/moon) at alpha 0.5–0.72, scale 0.9–1.35, rotation ±0.35; Rock Salt words every 330 units.

## Characters

Every figure follows the shape recipe (`fillBoard → rub → hatch → stroke`), carries a board halo (0.8–1.1 units) and is baked in 4 frames × 3 line-boil variants; facing left = mirrored canvas. Faces are solid butter yellow – the brightest spot on any figure.

**Main character**, feet at (0,0), ~16 wide, ~31 tall, drawn facing right:
- **Legs**: two 3-point strokes, width 1.35 white, from hip (±1.6, −7.6) to foot; feet are short 1.7-unit strokes pointing forward. Walk: foot x = ±1.9 + sin(phase)·2.6, lift = max(0, −sin·side)·1.7.
- **Cloak**: 8-point spline trapezoid from y −15.6 to −6; `fillBoard`, rub white 0.34, hatch angle 1.05 spacing 1.25, outline 0.95.
- **Arms**: 3-point strokes width 1.1 (back, alpha 0.8) and 1.15 (front) with a 0.9 dot hand.
- **Scarf**: mint stroke 1.9 wide across the neck, a 1.6-wide tail flapping behind, two pink 0.5 stripes.
- **Head**: a round orange gourd shape – ellipse 7.9 × 6.7 centred at (0.3, −21.6) with 6 lobes (`r·(1 + 0.035·cos(6a))`); rub orange 0.72; clipped deep-orange hatching on the lower-left (angle −0.75), yellow hatch highlight upper-right; two deep-orange rib curves; orange outline 1.2; leaf-green stem 1.5.
- **Face** shifted 1.4 units toward the facing side: two yellow triangle eyes with a white dot, a 12-point zigzag grin, all solid yellow 0.95.
- **Glow**: radial orange rub behind the head (0.32 → 0.12 → 0, r 14) using `destination-over`.
- Frames: 4 walk + 2 idle × 3 boil variants.

**Small creature** (a root bulb on legs, 16 × 30): cream bulb 15.8 × 15.8 (rub 0.2), the top half clipped below a wave line is lavender (rub 0.6 + hatching −0.8 rad), the lower half has sparse white hatching; white outline 0.95; three lens leaves (mint/leaf green, 6.4–8.6 long); yellow ellipse eyes with board pupils and angry white brow strokes; zigzag mouth. Tilts ±0.09 rad while walking.

**Fast floating creature** (a sheet-like spirit, 14 × 21): radial white rub (0.8 centre → 0.34 edge), sparse hatching, outline broken into a white upper part and a light-blue frosty hem; wispy trailing strokes; a reaching arm with two finger strokes; eyes and mouth are board-coloured holes with faint blue rims. Drawn at alpha 0.9, floating 2.2 units up.

**Large creature** (a root giant, 33 × 59): big lavender body with double cross-hatching (lavender 0.8 rad + pink −0.8 rad), cream lower band, white cracks, a 1.5-wide outline, an orange/yellow glowing core with 8 tick rays, yellow eyes with heavy brows, root-finger arms 2.6–2.8 wide, and a crown of 5 big leaves.

## Props

Props are chalk doodles made with the same toolkit and shape recipe, y-sorted with the figures, each with a board halo, soft shadow, grass tufts at the base and a short ground line. Outlines 1.0–1.2 units, details 0.35–0.6.

- **Tree**: hatched trunk with white bark ticks, bumpy 11-lobe crown filled with one 120-point scribble in a second colour; crown variants mint / orange / yellow. Shadow 16 × 4.
- **Dead tree**: recursive branches 3 levels deep, sometimes with a bat.
- **Graves**: round with "RIP", cross, pointed.
- **Fences**: 4 posts, 2 rails.
- **Scarecrow** in a lavender coat, **gourd groups**, **signposts**.
- **Placement**: only on 60-unit cells with ≤ 30% chance, never within 12 units of a path.

## Effects and particles

All effects are baked chalk sprites drawn with `globalAlpha` and scale – no additive blending.
- **Appear – drawn onto the board**: reveal the sprite top-down (`rows = h · outQuad(appearT)`) with a 1.6-unit bright chalk tip `rgba(245,245,236,.95)` moving along the edge.
- **Disappear – eraser wipe**: over `t` 0→1, crop the sprite from one side (`cut = w · clamp(u·1.2)`), draw a stretched copy (×(1 + 0.9u), alpha 0.45·(1−u)) behind, and draw a rotated eraser sprite (wood top `#b08058` with grain lines, grey felt `rgb(84,88,86)`) at the cut, its angle wobbling `sin(u·20)·0.08`. Leave a tinted chalk smear (9 faint horizontal streaks alpha 0.08–0.2) for 2.6 s. Plus 3 (large creature 7) dust puffs and 6 (12) crumbs.
- **Impact**: a white (or yellow for orbiting objects) scribble – 5-ray burst, zigzag or spiral – for 0.22 s, plus 2 crumbs (grainy quads 3 × 1.4 units) flying with gravity 160 in the figure's colours. Flash: the white `source-atop` copy at alpha ≤ 0.75.
- **Projectile**: cream seed 6.2 × 3.6 with yellow hatching and an orange midline; trail = 3 rows of broken white dashes, thinner and fainter with distance, scaled in over 0.12 s.
- **Collectibles**: small = light-blue diamond 4.4 × 6.4 with white hatching; large = pink diamond 8 × 11 with yellow hatching, a yellow outline and 6 spark ticks; 2 variants flipping at 5 fps. Collecting pops a 5-point yellow star (0.35 s).
- **Orbiting object**: a small round orange lantern with a lavender lid, yellow triangle eyes, two leaves, and a yellow radial rub behind it.
- **Celebration**: rotating double ring (yellow r 11.5 + orange r 9.6 + 12 ticks) and 8 stars at 70 units/s.
- **Dash**: 2 fading after-images (alpha 0.4/i, 7 units apart) and 4 dust puffs.
- **Dust puffs**: 7 radial white blobs (alpha 0.42) + 18 specks, tinted per chalk colour, growing with outQuad.
- **Main character flash**: yellow scribble at the chest, 6 crumbs, and blinking at 14 Hz for 0.9 s.

## Atmosphere and lighting

- **No real lighting**, no additive blending. Glows are **rubs painted behind** the chalk (`destination-over`): the main character's head orange `rgba(248,156,82,.32→0)` r 14, lantern yellow `.3→0` r 10.
- **Shadows**: radial ellipses `rgba(10,18,14,.55) → .3 at 70% → 0`, squashed (main character 7 × 2.2, small creature 7.5 × 2.3, floating 4.6 × 1.4, large 17 × 4.4, tree 16 × 4). Drawn in a separate pass under all figures.
- **Eraser halo**: the key readability device – the board colour around each sprite erases the busy ground texture locally, exactly like a real chalk drawing where you wipe space before drawing a figure.
- **Screen frame** (baked once per resolution): edge vignette `rgba(6,12,9,.5→.18→0)` over 10% height / 7% width, 700 chalk-dust specks concentrated above the bottom ledge, a wooden frame (thickness `max(8, 1.3% of H)`, bottom ledge 1.8×) with wood-grain strokes, chalk sticks (white, pink, yellow, mint, orange) and an eraser on the ledge, and grain at 0.25.
- **Colour grading**: none – the dark board itself sets the mood.

## UI

- Panels and bars are chalk outlines (`2.5px solid rgba(238,238,229,.92)`) with deliberately uneven border-radius so they look hand-drawn, backgrounds `rgba(22,32,28,.55)`.
- Bar fills are diagonal chalk hatching via `repeating-linear-gradient(-58deg, …)`: progress bar mint, status bar pink with orange gaps.
- The whole HUD gets an SVG noise `mask-image` for chalk holes.
- A chalk clock: double white circle, yellow ticks at quarters, a little orange gourd at 12, the last two hours hatched in lavender, white hour hand and orange minute hand.
- Cards: board-coloured cards with a smudge gradient, chalk borders, each card rotated −1.6°/0.9°/−0.5° and pinned with a coloured magnet (orange/lavender/mint) at the top.
- Icons: drawn with the same toolkit in a 100-unit box (heart, seed, bag, shoe, magnet, bowl) and given grain.

```css
.hud { color: #eeeee5; font-family: 'Architects Daughter', 'Comic Sans MS', cursive; }
.status-bar { width: 240px; height: 22px; background: rgba(22,32,28,.55);
  border: 2.5px solid rgba(238,238,229,.92); border-radius: 4px 14px 6px 12px / 12px 5px 14px 4px; }
.status-fill { height: 100%; background: repeating-linear-gradient(-58deg, rgba(247,168,198,.95) 0 3.5px, rgba(247,156,82,.45) 3.5px 7px); }
.progress { height: 18px; background: rgba(22,32,28,.55); border: 2.5px solid rgba(238,238,229,.92);
  border-radius: 14px 4px 12px 5px / 5px 12px 4px 14px; }
.progress-fill { height: 100%; background: repeating-linear-gradient(-58deg, rgba(152,222,178,.95) 0 3px, rgba(152,222,178,.3) 3px 7px); }
.bar-value, .counter { font-family: 'Cabin Sketch', cursive; font-weight: 700; font-size: 21px; }
.clock-time { font: 700 34px/1 'Cabin Sketch', cursive; letter-spacing: 2px; text-shadow: 0 0 4px #1c2823; }
.clock-label { font: 15px 'Architects Daughter', cursive; color: #f89c52; text-shadow: 0 0 4px #1c2823; }
.card { background: radial-gradient(ellipse at 30% 20%, rgba(220,235,225,.07), transparent 60%), #25332d;
  border: 3px solid rgba(238,238,229,.92); border-radius: 22px 8px 24px 6px / 6px 24px 8px 22px; }
.title { font: 400 78px 'Fredericka the Great', cursive; letter-spacing: 3px; color: #f9e58c; }
/* chalk holes on any element */
.chalky { -webkit-mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n' x='0' y='0'><feTurbulence type='fractalNoise' baseFrequency='1.15' numOctaves='2' seed='4' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 -9 0 0 0 6.1'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  mask-image: inherit; }
```

## Motion and animation

- **Line boil**: `variant = floor(t·7 + seed·3) % 3` – the drawing jitters at 7 fps on every figure, even when standing still. This is what makes it look "live".
- **Main character**: walk frame `floor(anim·1.25) & 3`; leg swing 2.6 units, bob −|cos|·1.0; idle 2 frames at 2.2 fps with a 0.45 bob; scarf tail flaps with the swing.
- **Small creature**: 4 frames at `anim·3.2`, tilt ±0.09 rad, bob 0.9. **Large creature**: `anim·2.4`, bob 1.6, leg lift 2.2.
- **Floating spirit**: 4 wave frames at 5 fps, hover 2.2 + sin(3.1t)·1.1.
- **Collectibles**: 2 variants at 5 fps, bob ±0.7; when collected they pop to ×1.6 and rise 4 units.
- **Floating numbers**: scale 0.6 → 1 in 0.08 s, random tilt ±0.125 rad, fade in the last 0.22 s.
- **Appear reveal** uses `outQuad`; eraser wipe wobbles its angle by `sin(u·20)·0.08`.

## Do and don't

Do:
- Build every shape as `fillBoard → rub → hatch → stroke`.
- Keep strokes broken: resample, jitter, pressure runs, double pass.
- Punch the grain mask into every sprite, word and HUD element.
- Bake a board-coloured halo behind every figure and prop.
- Use one pastel per biome and per creature type; yellow is reserved for eyes, mouths and rewards.
- Keep the 7 fps line boil running.
- Make all feedback chalk-native: scribbles, crumbs, dust, eraser wipes, smears.

Don't:
- Don't use additive glows, smooth shaded gradients or hard drop shadows.
- Don't use black or pure white; never fill a large shape at full opacity.
- Don't draw clean geometric lines or perfect circles.
- Don't introduce saturated or dark colours (red, navy, purple ink).
- Don't regenerate strokes per frame – bake and swap.
- Don't let ground texture run right up to region borders – fade it out so the white border line reads.

## Implementation recipe

1. Set up a world-unit camera (360 units visible vertically). Fill the screen with `#25332d`.
2. Copy the chalk toolkit (`resample`, `stroke`, `hatch`, `rub`, `fillBoard`, `spl`, `ell`) and a seeded RNG.
3. Build the 128×128 grain mask and `applyGrain()` (destination-out pattern).
4. Write `mk(box, drawFn, {halo, haloA})` that bakes a sprite at K px/unit, applies grain and the board halo.
5. Design each character as 4–8 spline polygons in world units with feet at (0,0). Apply the shape recipe; add solid yellow eyes last.
6. Bake 4 animation frames × 3 seeds per character; mirror for facing; bake a white flash copy.
7. Ground: define biome noise fields, convert to distances with value/|gradient|, pre-bake 512² tileable chalk textures per biome, and composite per pixel (board + smudge + tint + texture × density × grain + white border lines). Build in chunks with a generator to spread the cost.
8. Scatter decals (eraser swipes, biome doodles, handwritten words) into the chunk and props as y-sorted sprites.
9. Draw per frame: ground → smears → collectibles → shadows → y-sorted sprites (variant = boil) → orbiting objects → projectiles → particles → numbers → frame overlay.
10. Implement the appear reveal and the eraser-wipe disappear; particles from baked dust, crumb, scribble, star and ring sprites.
11. Build the HUD in DOM with the CSS above (chalk borders, hatched fills, noise mask, chalk fonts).

## Code

The core techniques, standalone. A complete runnable scene (ground, main character, creatures, tree, collectibles, projectile, HUD, frame) is in [`starter.js`](starter.js); the full reference module is [`../../js/styles/chalk.js`](../../js/styles/chalk.js).

```js
// Seeded RNG + helpers used by everything below
function rng(seed) { let a = seed >>> 0; return { next() { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; } }; }
const J = (s, r) => (r.next() - 0.5) * 2 * s;
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
function resample(pts, closed, step) {
  const src = closed ? pts.concat([pts[0]]) : pts, out = [src[0].slice()]; let carry = 0;
  for (let i = 1; i < src.length; i++) {
    const a = src[i - 1], b = src[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1e-6) continue;
    let d = step - carry;
    while (d <= L) { out.push([a[0] + (b[0] - a[0]) * d / L, a[1] + (b[1] - a[1]) * d / L]); d += step; }
    carry = L - (d - step);
  }
  return out;
}
/** Chalk line: pressure runs of 3–7 points + a lighter offset double pass. */
function stroke(ctx, pts, o) {
  const r = o.rng, w = o.w || 1, a = o.a ?? 1, c = o.c || [238, 238, 229], j = o.j ?? 0.12;
  const P = resample(pts, !!o.closed, o.step || 1);
  if (o.closed && P.length > 5) for (let i = 1, ov = 1 + ((r.next() * 3) | 0); i <= ov; i++) P.push(P[i].slice()); // overshoot
  for (const p of P) { p[0] += J(j, r); p[1] += J(j, r); }
  for (let i = 0; i < P.length - 1; ) {
    const e = Math.min(P.length - 1, i + 3 + ((r.next() * 5) | 0));
    ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]);
    for (let k = i + 1; k <= e; k++) ctx.lineTo(P[k][0], P[k][1]);
    ctx.lineWidth = w * (0.78 + r.next() * 0.4); ctx.strokeStyle = rgba(c, a * (0.72 + r.next() * 0.28)); ctx.stroke();
    i = e;
  }
  if (o.dbl !== false && P.length > 2) {
    const ox = J(w * 0.32, r), oy = J(w * 0.32, r);
    ctx.beginPath(); ctx.moveTo(P[0][0] + ox, P[0][1] + oy);
    for (let k = 1; k < P.length; k++) ctx.lineTo(P[k][0] + ox + J(0.08, r), P[k][1] + oy + J(0.08, r));
    ctx.lineWidth = w * 0.45; ctx.strokeStyle = rgba(c, a * 0.4); ctx.stroke();
  }
}
```

```js
// Loose hatching clipped to a polygon, plus rub / fillBoard, and the shape recipe
function poly(ctx, p) { ctx.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]); ctx.closePath(); }
function hatch(ctx, pts, { rng: r, ang = 0.9, sp = 1.4, w = 0.45, c = [238, 238, 229], a = 0.7, skip = 0 }) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + 1;
  const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
  ctx.save(); ctx.beginPath(); poly(ctx, pts); ctx.clip();
  for (let off = -R; off <= R; off += sp * (0.75 + r.next() * 0.5)) {
    if (r.next() < skip) continue;
    const s0 = -R * (0.55 + r.next() * 0.6), s1 = R * (0.55 + r.next() * 0.6), bx = cx + nx * off, by = cy + ny * off, bend = (r.next() - 0.5);
    ctx.beginPath(); ctx.moveTo(bx + dx * s0, by + dy * s0); ctx.quadraticCurveTo(bx + nx * bend, by + ny * bend, bx + dx * s1, by + dy * s1);
    ctx.lineWidth = w * (0.7 + r.next() * 0.6); ctx.strokeStyle = rgba(c, a * (0.55 + r.next() * 0.45)); ctx.stroke();
  }
  ctx.restore();
}
const rub = (ctx, p, c, a) => { ctx.beginPath(); poly(ctx, p); ctx.fillStyle = rgba(c, a); ctx.fill(); };
const fillBoard = (ctx, p) => { ctx.beginPath(); poly(ctx, p); ctx.fillStyle = '#25332d'; ctx.fill(); };
// The recipe for every body part (e.g. a round orange head):
function chalkShape(ctx, pts, col, r) {
  fillBoard(ctx, pts);                                         // hide lines behind
  rub(ctx, pts, col, 0.5);                                     // faint flat fill
  hatch(ctx, pts, { rng: r, ang: -0.75, sp: 1.15, c: col, a: 0.85 }); // texture/shade
  stroke(ctx, pts, { rng: r, closed: true, w: 1.2, c: col });  // broken outline
}
```

```js
// Grain mask + sprite bake with the board-coloured "eraser halo"
function hash2(x, y, s) { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
function buildGrain() {
  const N = 128, c = document.createElement('canvas'); c.width = c.height = N;
  const ctx = c.getContext('2d'), im = ctx.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const h = hash2(x, y, 77), h2 = hash2(x >> 1, y >> 1, 78), h3 = hash2(x >> 2, y, 79);
    im.data[(y * N + x) * 4 + 3] = Math.min(255, h < 0.1 ? 110 + h * 600 : h2 < 0.1 ? 55 : h3 < 0.05 ? 80 : h * 22);
  }
  ctx.putImageData(im, 0, 0); return c;
}
const GRAIN = buildGrain();
function bakeChalkSprite(w, h, K, ax, ay, draw, halo = 1, haloA = 0.9) {
  const mkc = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const A = mkc(), a = A.getContext('2d', { willReadFrequently: true });
  a.setTransform(K, 0, 0, K, ax, ay); a.lineCap = a.lineJoin = 'round'; draw(a);
  a.setTransform(1, 0, 0, 1, 0, 0); a.globalCompositeOperation = 'destination-out';
  a.fillStyle = a.createPattern(GRAIN, 'repeat'); a.fillRect(0, 0, w, h); a.globalCompositeOperation = 'source-over';
  const src = a.getImageData(0, 0, w, h), sil = new ImageData(w, h);
  for (let i = 0; i < src.data.length; i += 4) if (src.data[i + 3] > 26) sil.data.set([37, 51, 45, 255], i);
  const M = mkc(); M.getContext('2d').putImageData(sil, 0, 0);
  const D = mkc(), d = D.getContext('2d'), r = halo * K;
  for (let k = 0; k < 12; k++) { const an = k / 12 * Math.PI * 2; d.drawImage(M, Math.cos(an) * r, Math.sin(an) * r); if (k & 1) d.drawImage(M, Math.cos(an) * r / 2, Math.sin(an) * r / 2); }
  const O = mkc(), o = O.getContext('2d');
  o.globalAlpha = haloA; o.drawImage(D, 0, 0); o.globalAlpha = 1; o.drawImage(A, 0, 0);
  return O; // draw with drawImage(O, x - ax/K, y - ay/K, w/K, h/K) in world space
}
```

```js
// Ground pixel: board + smudge + texture x density x grain + white border line from a signed distance
// d1, d2 = (A - threshold) / |grad A| in world units; res = px per unit; tex = RGBA of a 512² tileable chalk texture
function groundPixel(out, px, py, d1, d2, H, T, gm, smudge, res, tex, regionCol) {
  const BOARD = [37, 51, 45], CW = [238, 238, 229], LW = 0.5;
  const hz = (H - 0.5) * 22 + smudge;
  let r = BOARD[0] + hz * 0.9, g = BOARD[1] + hz, b = BOARD[2] + hz * 0.95;
  const near = Math.min(Math.abs(d1), Math.abs(d2));
  const fade = Math.max(0, Math.min(1, (near - LW - 0.9) * 0.6));     // keep texture off the border
  r += (regionCol[0] - r) * 0.05 * fade; g += (regionCol[1] - g) * 0.05 * fade; b += (regionCol[2] - b) * 0.05 * fade;
  const t4 = (((py & 511) << 9) + (px & 511)) * 4;
  const sm = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  const a = tex[t4 + 3] / 255 * (0.32 + 0.68 * sm(0.28, 0.72, T)) * fade * gm;
  r += (tex[t4] - r) * a; g += (tex[t4 + 1] - g) * a; b += (tex[t4 + 2] - b) * a;
  const line = Math.max(0, Math.min(1, (LW - near) * res + 0.5)) * 0.8 * (0.3 + 0.7 * gm); // anti-aliased chalk border
  out[0] = r + (CW[0] - r) * line; out[1] = g + (CW[1] - g) * line; out[2] = b + (CW[2] - b) * line;
}
```

## Adapting it to your project

Keep fixed: the board colour family (dark desaturated green or charcoal), the chalk toolkit and shape recipe, grain on everything, the board halo, translucent fills, the line boil, chalk-native effects (eraser, smears, crumbs, dust).

May change:
- **Palette swap**: any set of 6–8 *pastel* chalks works. A black slate board (`#2a2c2e`) with white/yellow/pink is a valid variant; keep the board ≥ 4× darker than the chalks.
- **New characters**: decompose them into 3–8 closed silhouettes; give each creature type one signature chalk colour and solid yellow (or white) eyes. Large creatures get thicker outlines (1.5) and double cross-hatching.
- **New props**: same recipe, outline 1.0–1.2, a scribble fill in a second colour, grass tufts and a ground line at the base.
- **Biomes**: one texture per biome made from a stroke motif (tufts, crosshatch, rows, dots, asterisks) and a white border line between biomes. Indoor scenes: draw tiles as hatched rectangles with chalk grid lines.
- **Side view / platformer**: same toolkit; ground is a hatched band with a thick white top line; sky is plain board with doodle stars.
- **Resolution**: scale K with the screen; keep stroke widths in world units so the look is resolution-independent.

## Performance notes

- **Bake once**: all sprites (≈ 12 main-character + 36 creature + props + particles + doodles), textures (6 × 512²) and the screen frame. Budget ~0.5 s at init; extra boil variants are built lazily within the first frames.
- **Chunked ground**: 256-unit chunks at ≤ 2.5 px/unit, built by a generator yielding every pixel row, max 5 ms of building per frame, with a ring of pre-built chunks around the view. The field grid is only 65 × 65 per chunk; the per-pixel loop only does bilinear lookups and texture reads (Worley only in fields).
- **Per frame**: only `drawImage` of cached canvases; the clock face is cached, only its two hands are stroked.
- **Batch strokes** when baking textures: group by colour/alpha/width into `Path2D` (the module's `Batch` class) – thousands of tufts in a few `stroke()` calls.
- The halo step uses `getImageData` – create those canvases with `willReadFrequently: true`.
- `starter.js` bakes everything on the first `draw()` and then runs at well under 1 ms per frame.

## Copy-paste prompt

```text
Use the Chalkboard art style for my project:
- Everything is drawn with pastel chalk on a dark slate-green board #25332d inside a wooden frame.
- Chalks: white #eeeee5, orange #f89c52, deep orange #de6c34, lavender #c2acec, mint #98deb2,
  leaf #70bc7e, butter yellow #f9e58c, pink #f7a8c6, light blue #9eccf0, cream #f4e8ce. No black, no glow.
- Strokes: resample every 1 unit, jitter ±0.12, split into 3–7-point runs with random width (×0.78–1.18)
  and alpha (×0.72–1), overshoot closed shapes, add a 45%-width 40%-alpha offset double pass.
- Every shape: fill with board colour, translucent rub (alpha ≤ 0.72), loose clipped hatching, chalk outline.
- Eyes/mouths solid butter yellow; holes are board-coloured.
- Bake sprites offscreen, punch a 128² grain mask with destination-out, add a 1-unit board-coloured halo behind.
- 4 animation frames × 3 differently seeded variants, swapped at 7 fps (line boil).
- Ground: noise biomes with crisp white chalk border lines; meadow = mint tufts, forest = lavender
  cross-hatch, field = orange/yellow rows; smudges and faint eraser swipes; doodles scattered at low alpha.
- Props (trees, graves, fences) are doodles with the same recipe; soft dark ellipse shadows, glows only as rubs behind.
- Appearing = drawn top-down with a chalk tip; disappearing = eraser wipe + smear; impacts = scribbles + crumbs.
- UI: chalk outlines with uneven radii, diagonal hatched bar fills, Cabin Sketch / Architects Daughter /
  Fredericka the Great fonts, SVG noise mask for chalk holes.
```
