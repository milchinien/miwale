# Pop-Art Comic — Game Art Style Spec

> A printed 1960s comic book come alive: brush-ink outlines, flat process colours, Ben-Day dots and slipped colour plates.

Everything on screen looks like cheap four-colour newsprint. Sprites are flat process colours with thick, slightly
lopsided black brush outlines; volume comes only from halftone dots (bigger dots = darker) in a crescent on the
shadow side plus a solid spot-black rim; a cyan or magenta colour plate peeks out from behind each figure because the
"printing press" is out of register. The ground is warm paper divided into big organic regions, each with its own
rotated dot screen and separated by inked contour lines. Kills explode into jagged yellow starbursts with POW!/ZONK!
balloons. The reference implementation is the game *Jack vs. the Turnip Ancestors* (pumpkin-head hero vs. turnip
hordes), but nothing in the technique is specific to it.

## At a glance

| Property | Value |
| --- | --- |
| Family | Comic · Pop-Art print |
| Mood | loud, playful, punchy, retro, spooky-fun |
| Best for | arena survivors, brawlers, top-down action with hordes, superhero/Halloween party games |
| Renderer | Canvas 2D, fully procedural, no image assets |
| Pixel art | No — native resolution, sprites baked at 3–5 px per world unit |
| Difficulty | 5/10 — every new object needs outline, dots and plate offset individually; the ground is expensive |
| Fonts | Bangers (shouts, numbers, titles), Comic Neue 700 (body text) |
| Key colours | ink `#1b1620`, paper `#f4ecd4`, yellow `#ffe23a`, red `#e8262c`, cyan `#2ec4ef`, magenta `#e0338f` |

## When to use it

Good fits:
- **Horde/arena games** — saturated actors on pale dotted paper stay readable even with 200 enemies on screen.
- **Action with lots of feedback** — hits, kills and level-ups map naturally to comic bursts and sound words.
- **Halloween, superhero, B-movie, pulp themes** — the 60s horror-comic print language is instantly recognisable.
- **UI-heavy games** (upgrade cards, shops) — comic panels with hard shadows make crisp, characterful UI.

Bad fits:
- **Atmospheric or realistic horror** — there are no soft lights, no darkness, no gradients.
- **Calm cozy games** — the style shouts; it is hard to make it quiet.
- **Strict retro pixel games** — this is vector-smooth with anti-aliasing, not a pixel grid.
- **Mostly-dark scenes** — paper is light by definition; a "night" region is pale blue paper with blue dots, not black.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Ink | `#1b1620` | All outlines, spot blacks, shadow dots, text strokes, panel frame (rgb 30,24,36 for ground ink) |
| Newsprint | `#f4ecd4` | Paper, panel gutter, UI bar backgrounds |
| Meadow paper | `#ede9c7` | Base ground (~50 %) under green dots `#68b062` |
| Autumn paper | `#fad880` | Field region under orange-red dots `#e8623e` |
| Night paper | `#c8d2e8` | Night region under blue dots `#5668b2` |
| Graveyard paper | `#e0d3de` | Graveyard region under violet dots `#8660a0` |
| Path paper | `#f9e9aa` | Paths: no dots, diagonal ink hatching along the edges |
| Process Yellow | `#ffe23a` | Bursts, glow dots, carved faces, clock panel, LEVEL UP |
| Process Red | `#e8262c` | HP bar, burst dots, sound-word text |
| Process Cyan | `#2ec4ef` | Misregistered plate, XP bar, gems, ghost eyes (dot sister `#1aa0d8`) |
| Process Magenta | `#e0338f` | Second plate, enemy dots, big gems |
| Pumpkin Orange | `#ff8a1c` | Hero head (shade dots `#e0301e`, rib lines `#d8561a`) |
| Cape Blue | `#2c6ad0` | Hero cape and sleeves (dots `#0f2f80`) |
| Scarf Red | `#ea2a33` | Hero scarf (dots `#8a0c22`) |
| Pants | `#2b2846` | Hero legs (back leg `#1f1c36`), glove `#fffaf0` |
| Leaf Green | `#3fae49` | Leaf crowns (dots `#1a6a2c`), stems `#4c8a2a` |
| Turnip Magenta | `#d4308c` | Small enemy A top (cyan dots, shade `#5a0c48`), bottom `#fdeabb` with `#f08a3c` dots |
| Turnip Violet | `#8a3cc0` | Small enemy B top (magenta dots, shade `#2a0a50`), bottom `#f8e6a6` |
| Ghost White | `#fcfbf4` | Ghost body, dust puffs (shade dots `#1aa0d8`) |
| Brute Plum / Clay | `#8a3a86` / `#c98545` | Brute top / bottom, shade `#3a1030`, limbs `#9a5a30` |
| Flash Yellow | `#ffe94a` | Hit/impact frame fill with `#ff7a1a` shade dots |

Palette rules:
- Every fill has a **darker dot sister** used only for halftone shade. Never shade by darkening the fill.
- Black is always warm ink `#1b1620`, never `#000`.
- Ground = pale paper tints with mid-saturation dots. Actors = full-saturation process colours. This value gap is
  what keeps hordes readable.
- Plates are only cyan `#2ec4ef` (solid actors, bursts) or magenta `#e0338f` (ghosts, gems, projectiles) at 60–65 %
  alpha; props use pink `#ff3d6e` at 45 %.
- Complementary dot overlays: cyan dots on magenta, magenta on violet, yellow on magenta, red on yellow.
- No gradients, no blur, no glow — tone is dot size or dot density.

## Typography

**Bangers** 400 — https://fonts.google.com/specimen/Bangers — sound words, damage numbers, HUD numbers, titles, card
names. Fallback stack: `"Bangers", "Luckiest Guy", Impact, "Arial Black", sans-serif` (use bold when falling back).

```css
.clock-time { font: 400 38px/1 'Bangers', Impact, sans-serif; letter-spacing: 2px; color: #1b1620; text-shadow: 2px 2px 0 #e8262c; }
.lu-title   { font: 400 92px/1 'Bangers', Impact, sans-serif; letter-spacing: 4px; color: #ffe23a; transform: rotate(-4deg); }
```

**Comic Neue** 700 — https://fonts.google.com/specimen/Comic+Neue — labels, descriptions, hints; often uppercase with
1 px letter-spacing.

```css
.hint { font: 700 16px/1.25 'Comic Neue', 'Comic Sans MS', sans-serif; letter-spacing: 1px; text-transform: uppercase; color: #1b1620; }
```

Text effects:
- **Ink outline in CSS**: 16 hard `text-shadow`s around a circle (`cos/sin × w px, 0 blur, #1b1620`) plus one drop
  shadow `8px 8px 0 #1b1620` for big titles (w = 4 for titles, 2 for HP text, 1.5 for small labels).
- **On canvas**: draw a colour-plate copy offset (−0.7, +0.6) units at 85 % alpha (magenta, or cyan for crits), then
  `strokeText` with lineWidth = 0.22 × font size in ink, then `fillText` in white/yellow.
- **Crit numbers**: yellow fill with red halftone dots clipped to the lower half of the letters (`source-atop`).
- **Sound words** get a hard drop shadow of ink offset (+0.9, +0.9) units before the stroke.

## Rendering technique

1. **Choose bake resolution** `K = clamp(round(screenHeightPx / 360 × 1.4), 3, 5)` pixels per world unit. The camera
   shows 360 world units vertically.
2. **Bake every sprite** once with the *part painter* (see Code). For each part, in order:
   1. `clip()` to the part shape;
   2. flat fill (or a two-tone fill function);
   3. optional Ben-Day overlay `dots: [colour, rf, spacing, rotationDeg]` across the whole part;
   4. **shade crescent**: clip to "everything minus the shape shifted by `sh`" (even-odd) and fill with dots in the
      dark sister colour (`rf` 0.45–0.62). `sh` points toward the light (negative x/y), so the crescent appears on the
      bottom-right;
   5. **spot-black crescent**: same trick with a smaller offset `spot` (≈ 40 % of `sh`), filled solid ink;
   6. details (ribs, patterns) and white shine ellipses at top-left;
   7. `restore()` and stroke the outline **twice**: width `w`, then `0.85 w` translated by (`0.3 w`, `0.36 w`). The
      result is a brush line that swells on the bottom-right.
   8. optional interior ink lines at `0.55 × ol` (≈ 0.55 units).
3. **Halftone tile**: a T×T canvas (T = round(spacing × K), min 3 px) with circles at the 4 corners and the centre
   (a 45° diamond lattice), radius = `rf × T / 2`; used as a repeating pattern with
   `pattern.setTransform(DOMMatrix().rotate(deg).scale(1/K))` so the dots live in world units. Sprite dot spacing is
   1.3 units (`DSP`).
4. **Misregistration**: after painting, tint a silhouette copy of the sprite with the plate colour and draw it
   `destination-over` at alpha 0.65, offset (−0.5 K, +0.375 K) px — i.e. 0.5 units left, 0.375 down.
5. **Variants per actor**: 4 animation frames × {normal, flash} × {right, left (mirrored canvas)}. The flash frame is
   painted with the same code but every fill becomes `#ffe94a` and shade dots `#ff7a1a`, dots/details are skipped.
6. **Per frame**: ground chunks (cached) → ground overlay (spawn bursts, hero glow) → pickups → shadows → y-sorted
   props/enemies/hero → orbitals → projectiles → particles → numbers → screen overlay (vignette dots + panel frame).
   Everything except the ground is `drawImage` of baked canvases with scale/rotation.
7. Sprites are drawn with smoothing on (the style is anti-aliased vector print, not pixel art).

## Background and ground

The floor is computed **per pixel** in world space so dots never swim or seam between chunks (256-unit chunks, at most
2.5 px/unit):

- **Region fields**: four domain-warped fBm fields (warp: Perlin at 1/900 × 110 units; field scales 1/1000, 1/1250,
  1/820) minus thresholds (0.55, 0.635, 0.625) decide autumn, night and graveyard regions; a fourth field
  `(0.02 − |perlin(x/1500)|) × 3.2` makes winding paths. The topmost positive layer wins (path > graveyard > night >
  autumn > meadow).
- **Grid + signed distance**: fields are sampled on a 4-unit grid and bilinearly interpolated; the bilinear gradient
  gives a signed distance `field / |∇field|`. Cells far inside/outside are flagged so most pixels skip the work.
- **Ink contours**: ink coverage `(hw − |dist|) × res + 0.5`, clamped 0..1, where half-width `hw = 0.42 + 0.62 ×
  noise(x/36)` — a 0.84–2.08-unit brush line that thickens and thins.
- **Dot screens** (one per material, multiply-blended into the paper colour):

| Region | Paper rgb | Dot ink rgb | Spacing | Angle | Radius (× spacing) |
| --- | --- | --- | --- | --- | --- |
| Meadow | 237,233,199 | 104,176,98 | 3.3 | 45° | 0.17–0.33 |
| Autumn | 250,216,128 | 232,98,62 | 3.0 | 15° | 0.15–0.31 |
| Night | 200,210,232 | 86,104,178 | 3.0 | 45° | 0.22–0.36 |
| Graveyard | 224,211,222 | 134,96,160 | 2.8 | 60° | 0.20–0.36 |
| Path | 249,233,170 | — | — | — | hatching |

  Dot radius is interpolated by a tone field `0.5 + perlin(x/240)·0.42 + perlin(x/1300)·0.3`, so the print gets
  denser and lighter in patches like a worn screen. Coverage is anti-aliased: `(radius − d) × res + 0.5`.
- **Path hatching**: within 14 units of a path edge, diagonal lines `(x − y)·0.7071 / 1.7` of half-width
  `0.34 × taper` that fade over a noise-varying length 1.5–10.5 units — the comic "speed hatching" along a road.
- **Paper**: × yellowing `1 ± 0.04` (noise/1700), × grain `0.985 + (hash − 0.5)·0.045 + fibre·0.025`.
- **Decals** (scatter every ~15 units, skipped within 5 units of a region edge): meadow — 3-blade ink grass tufts
  (30 %), 5-petal white/pink flowers with yellow centre (6 %); autumn — red/yellow leaves, stubble strokes; night —
  white 4-point glints; graveyard — branching cracks, pebbles; path — pebbles with a black crescent, ink specks;
  1.5 % rare ink splats anywhere.

## Characters

The hero (reference: pumpkin-head boy) is ~21 × 34 units at 1.12× scale, feet at y = 0:

- **Head**: superellipse pumpkin (`|cos|^0.85`, `|sin|^0.92`, dented 15 % at the top, 7 % at the bottom) centred at
  (0.4, −22.6), rx 8.4, ry 6.9, orange `#ff8a1c`, outline 1.15, shade crescent `[-2.3, -1.9]` with `#e0301e` dots
  rf 0.55, spot `[-0.85, -0.75]`, four curved rib lines `#d8561a` 0.55 wide, two white shine ellipses top-left.
  Green stem capsule. Face = carved triangles and a zig-zag grin: black hole, yellow `#ffe23a` interior shifted
  (+0.3, +0.55) inside, leaving a black rim on the top-left.
- **Body**: blue cape quad-curve shape (shade `[1.7, -1.3]`, spot `[0.75, -0.55]`, two fold lines 0.5), red scarf knot
  ellipse and a waving scarf tail polygon behind everything.
- **Limbs**: capsules (`CAP`) — legs r 1.35 in `#2b2846` (back leg darker `#1f1c36`), black ellipse shoes with a
  white shine; arms r 1.25 in cape blue with Ben-Day overlay, white glove ellipses with cyan-dot shade.
- **Paint order**: scarf tail → back leg → back arm → front leg → cape → front arm → scarf knot → stem → head → face.
- **Frames**: 0 idle, 1 contact A, 2 passing (front foot lifted 1.9), 3 contact B; each frame is a row of numbers
  (back foot x/y, front foot x/y, back/front arm angle, cape flare). Cape flare also swings the hem and scarf tail.
- **Facing**: bake once facing right, mirror the canvas for left (the face is offset +1.4 units toward the facing).
- **Plate**: cyan behind the hero.

## Enemies and props

All actors use the same painter so they share outline weight, dot spacing and light direction. Readability with large
hordes comes from: saturated colours vs. pale ground, distinct silhouettes per type, big yellow eyes, the cyan
fringe separating overlapping sprites, and the halftone shadow anchoring each one.

- **Small melee enemy** (turnip, ~17 × 28 units at 0.92×): teardrop turnip body (bezier, top −20.6, bottom −2.6,
  half-width 8.5), *two-tone*: magenta/violet top with complementary dots (rf 0.42) above a wavy ink line at y −12.2
  (amplitude 0.9), cream bottom with sparse orange dots (rf 0.22, rotated 30°). Three dotted leaves on top, stubby
  capsule legs. Face: yellow eye ellipses with ink pupils, angular ink brows, ink frown with a pink tongue and white
  fangs. Two colour variants chosen by seed.
- **Fast/floating enemy** (ghost, ~25 × 26): white sheet with a 7-unit dome and a wavy tail whose control points move
  with frame phase; strong cyan-dot shade `[-2.6, -1.6]` rf 0.62; cyan dots over the bottom 12 units; the bottom 28 %
  is erased with a `destination-out` gradient to 75 % so it hovers. Ink oval eyes with cyan catchlights, gaping
  ink mouth. Magenta plate (not cyan) so it reads as a different "ink".
- **Brute** (colossus, ~48 × 66): giant turnip (half-width 17.8, outline 1.45), plum top/clay bottom, five dark
  leaves, capsule arms r 3.0 with blob fists, zig-zag crack lines, a yellow star-shaped glowing core in the chest with
  ink rays, angular glowing eyes and a mouth with yellow teeth. Plays slower, has a smaller hit-flash cap (0.6).
- **Pickups**: cyan teardrop gem (big: magenta 5-point star with yellow dots), bobbing ±1 unit above a tiny dot shadow;
  magenta plate.
- **Props**: trees (circle-union crown, green or orange, hatched leaf strokes, sway via skew ±0.02), dead trees,
  berry bushes, rocks, wooden fences/signs, pumpkins (one lit), scarecrow with red/blue-dot shirt, hay bales,
  gravestones. Circle unions are converted to **one** polygon (ray-cast outline, 144 samples) so the even-odd shade
  crescent works. Props use a pink `#ff3d6e` plate at 45 % — weaker than actors, so actors pop.

## Effects and particles

- **Hit impact** (0.16 s): 8-point yellow star r 6.5/2.4 with red dots and a white inner star, scale 0.5 → 1.2 → 0.3;
  45 % chance of 7 black tapered speed-line wedges radiating from r 4.5 outward. Enemy overdrawn with its flash frame.
- **Kill burst** (0.34 s, brute 0.5 s ×1.9): 12-point jagged star r 10/5.6 in yellow/white/orange/yellow with red,
  cyan, dark-red or purple dot rings; pops with outBack in the first 16 %, grows +35 %/life, fades last 40 %.
- **Chunks**: 4 (small), 2 (ghost), 9 (brute) five-sided polygons in the enemy's colours with spot-black crescent,
  thrown with gravity 280; plus 2–6 ink droplets (ghosts: cyan).
- **Sound words**: POW! ZACK! KRACH! PENG! ZONK! PLOPP! for normal kills (30 %, ≥ 1.3 s apart), bigger WUMMS!/RUMMS!
  for brutes (always) with a 16-wedge ring shockwave, AUTSCH! when the hero is hurt (≥ 2.2 s apart). Max 3 alive.
  Colour sets `[fill, text, plate]`: yellow/red/orange-dot, red/yellow/dark-red, cyan/white/dark-blue, white/red/cyan.
- **Damage numbers**: see Typography; scale 0.3 → 1.35 → 1.0 over the first 24 % of life, random tilt ±0.15 rad.
- **Dash**: cyan and magenta silhouettes at 6 and 12 units behind, 60 % alpha, plus 4 ink speed lines; 3 white puffs.
- **Footstep / shot puffs**: white circle-union cloud with cyan-dot shade, outBack pop, quadratic shrink.
- **Level-up**: yellow ring of 16 wedges + 8 white 4-point twinkles with cyan shade flying out.
- **Spawn**: flattened yellow star with red dots and a black hole on the ground; enemy grows with outElastic; ink
  droplets fly out.

## Lighting, shadows and post-processing

- **Light** is always top-left; it exists only as crescent placement and white shine ellipses.
- **Contact shadows** are two concentric ellipses of ink dots (outer 9.6 × 3.5 units, rf 0.5, spacing 1.15; inner
  6.4 × 2.3, rf 0.95), drawn at 55 % alpha (hero 65 %, ghost 35 %) and scaled per type (brute 19, small 8.4, ghost 6).
- **Hero light**: a hex grid of yellow `#ffe23a` dots (spacing 1.6) within radius 15, dot radius `(1 − d)^0.7 × 0.88`,
  squashed to 1.5 × 0.62 on the floor at 80 % alpha. Orbiting lanterns get the same glow at 0.8 × flickering alpha.
- **No blur, no bloom, no colour grading.**
- **Screen overlay** (baked once per resolution): a hex grid of ink dots (spacing max(7, H/100) px) whose radius grows
  with `smoothstep(0.9, 1.42, distance from centre)` at 42 % alpha — a halftone vignette; a paper gutter of
  max(4, 0.6 % H) px; and a black panel frame of the same width drawn as jittered 24-segment strokes (width
  ×0.9–1.2) so it looks hand-inked. Only tiles that contain pixels are blitted.

## UI and HUD

Comic panels: zero radius, 3 px ink borders, **solid offset shadows** (4–8 px, no blur), slight rotations (±1–4°),
skewed bars, dotted fills via `radial-gradient` patterns. Kill counter is a white oval speech bubble with a tail;
level-up title sits in a 16-point red starburst with yellow dots; upgrade cards are cream with dotted colour headers
(cyan, yellow, pink), rotated −1.5°/1°/−0.5° and popping in with an overshoot cubic-bezier. Icons are painted with the
same part painter on a 48-unit grid (outline 2.4, dot spacing 3.6) with a 1.4 px misregistered plate.

```css
.hud-panel { background: #ffe23a; border: 3px solid #1b1620; border-radius: 0; box-shadow: 5px 5px 0 #1b1620;
  padding: 4px 18px 5px; transform: rotate(-1deg); font-family: 'Bangers', Impact, sans-serif; font-size: 38px;
  letter-spacing: 2px; color: #1b1620; text-shadow: 2px 2px 0 #e8262c; }
.hp-bar { width: 250px; height: 28px; overflow: hidden; transform: skewX(-10deg);
  background: radial-gradient(circle, rgba(27,22,32,.22) 1.1px, transparent 1.6px) 0 0/6px 6px, #f4ecd4;
  border: 3px solid #1b1620; border-radius: 0; box-shadow: 4px 4px 0 #1b1620; }
.hp-fill { height: 100%; border-right: 3px solid #1b1620;
  background: radial-gradient(circle, #8a0c22 1.8px, transparent 2.3px) 0 0/6px 6px, #e8262c; }
.xp-fill { height: 100%; border-right: 3px solid #1b1620;
  background: radial-gradient(circle, #1474b8 1.7px, transparent 2.2px) 0 0/6px 6px, #2ec4ef; }
.kills { padding: 4px 26px 4px 12px; background: #fff; border: 3px solid #1b1620; border-radius: 50%;
  box-shadow: 4px 4px 0 #1b1620; font: 400 30px 'Bangers', Impact, sans-serif; }
.card { background: #fbf5e2; border: 4px solid #1b1620; box-shadow: 8px 8px 0 #1b1620; transform: rotate(-1.5deg);
  animation: popCard .45s cubic-bezier(.3,1.5,.5,1) backwards; }
@keyframes popCard { from { transform: translateY(70px) scale(.6) rotate(8deg); opacity: 0; } }
.hurt .hp { animation: popShake .22s steps(3) 1; }
@keyframes popShake { 33% { transform: translate(-4px,2px) rotate(-1.5deg) } 66% { transform: translate(4px,-2px) rotate(1.5deg) } }
```

Overlays: level-up backdrop = radial dark vignette + red dots (2.2 px / 11 px) + yellow sunburst
`repeating-conic-gradient` (7° rays at 15 %) over `rgba(27,22,32,.62)`; game-over = ink dots over dark red.

## Motion and animation

- **Hero walk**: frame sequence 1, 2, 3, 2 at `anim × 0.4`; lift `sin(f·π) × 1.8` units, tilt `0.05 × facing ×
  sin(f·π)`; a dust puff on every other step (50 %).
- **Hero idle**: `sy = 1 + 0.025 sin(3.2t)`, `sx = 1 − 0.018 sin(3.2t)`. Shooting squashes 5 %; level-up wobbles
  `sin(levelT·4π)` ±16 %; hurt overlays the yellow flash and squashes 14/12 %. I-frames blink at 16 Hz to 45 % alpha.
- **Small enemy**: 4 frames at `anim × 0.85`, rotation `sin × 0.09`, hop 1.2 units, 5 % squash at contact, random
  scale 0.94–1.06.
- **Ghost**: 4 tail frames at 7 fps, hover 4.5 units up, bob ±1.6 at 2.6 rad/s, lean `vx/64 × 0.14`, alpha 0.94.
- **Brute**: 4 frames at `anim × 0.32`, contact squash `(1 − up)^3 × 7 %`, rotation ±0.03, hop 2 units.
- **Spawn**: solid enemies grow vertically with outElastic (width compensates `1/√p`), ghosts fade + outBack.
- **Hit**: flash frame alpha `min(cap, flash × 1.4)`, squash sx +18 %, sy −14 %.
- **Death**: 0–0.2 s inflate to 1.25× in the yellow frame (outQuad), 0.2–0.42 s shrink to 0 (inQuad) while rotating
  +0.6 rad; the kill burst covers it.
- **Pops everywhere use overshoot** (outBack, outElastic, CSS `cubic-bezier(.3,1.8,.5,1)`).

## Do and don't

Do:
- Route every shape through one part painter (fill → dots → shade crescent → spot black → double outline).
- Bake sprites once: 4 frames × normal/flash × both facings; blit at runtime.
- Shade with dot size in the colour's darker sister; keep the light top-left.
- Slip a cyan/magenta plate 0.5 units behind every sprite.
- Keep actors saturated and the ground pale.
- Use jagged star balloons + Bangers for loud events, rate-limited to 3 on screen.
- Give every UI panel a hard offset ink shadow and zero radius.

Don't:
- Use gradients, `shadowBlur`, filters or soft glows.
- Use pure `#000` or hairline outlines (< 0.4 units).
- Give two ground regions the same dot angle and spacing.
- Spam sound words — more than 3 turns into noise.
- Let enemies share the dominant colour of the ground region they walk on.
- Round UI corners or use translucent glass panels.
- Compute halftone per frame for sprites.

## Implementation recipe

1. Set up a camera that shows 360 world units vertically; compute `S = screenPx / 360` and `K = clamp(round(S × 1.4), 3, 5)`.
2. Copy the palette; for every new colour define a darker dot sister.
3. Implement `dotPattern(colour, rf, T)` (cached diamond-lattice tile) and the `Painter` with `dots`, `crescent`,
   `part`, `detail` (see Code / `starter.js`).
4. Implement shape helpers: ellipse `E`, capsule `CAP`, polygon `POLY`, bezier blob, circle union → polygon, star
   points with seeded jitter, plus any signature shapes (pumpkin superellipse, turnip bezier).
5. Model each actor as a function `parts(P, frame)` painting back-to-front. Store walk poses as small number tables.
6. `build(box, fn, mode, plate)` each frame into a canvas at K px/unit with 1.9 units margin, then add the plate
   silhouette `destination-over` at 65 % alpha offset (−0.5, +0.375) units. Build `mode = 'flash'` too. Mirror for
   left-facing.
7. Bake shadows (two dot ellipses), the hero glow (hex dot grid), bursts, impact star, chunks, puffs, twinkles.
8. Ground: noise fields on a 4-unit grid → bilinear signed distance → per-pixel region, ink contour of varying
   half-width, one rotated AA dot screen per region, grain, path hatching; render in chunks (generator/worker); then
   scatter ink decals.
9. Per frame: ground → spawn bursts + glow → pickups → shadows → y-sorted actors/props → projectiles → particles →
   numbers → baked screen overlay.
10. Hook game events: hit → impact + flash; kill → burst + chunks + ink + maybe a sound word; dash → plate smear.
11. Build the HUD in HTML/CSS with the panel rules above, fonts Bangers + Comic Neue 700.
12. Check readability with 200 enemies: if they mush together, raise saturation contrast to the floor, not outline width.

## Code

The core techniques, standalone. A complete runnable kit (hero, small enemy, ground, overlay, bursts, sound words) is
in [`starter.js`](starter.js); the full reference module is [`../../js/styles/popart.js`](../../js/styles/popart.js).

**1. Halftone tile + part painter** (the heart of the style):

```js
const INK = '#1b1620', TAU = Math.PI * 2;
const PAT = new Map();
function dotPattern(ctx, col, rf, T) {           // T px tile, dots at corners + centre (45° lattice)
  const key = col + '|' + rf + '|' + T;
  if (PAT.has(key)) return PAT.get(key);
  const cv = document.createElement('canvas'); cv.width = cv.height = T;
  const c = cv.getContext('2d'), r = rf * T * 0.5;
  c.fillStyle = col; c.beginPath();
  for (const q of [[0, 0], [T, 0], [0, T], [T, T], [T / 2, T / 2]]) { c.moveTo(q[0] + r, q[1]); c.arc(q[0], q[1], r, 0, TAU); }
  c.fill();
  const p = ctx.createPattern(cv, 'repeat'); PAT.set(key, p); return p;
}
function Painter(c, k) { this.c = c; this.k = k; this.ol = 1.0; this.dsp = 1.3; }
Painter.prototype.dots = function (col, rf, sp, rot) {
  const T = Math.max(3, Math.round((sp || this.dsp) * this.k)), p = dotPattern(this.c, col, rf, T);
  let m = new DOMMatrix(); if (rot) m = m.rotate(rot);
  p.setTransform(m.scale(1 / this.k));            // dots measured in world units
  this.c.fillStyle = p; this.c.fillRect(-999, -999, 1999, 1999);
};
Painter.prototype.crescent = function (shape, sh, fn) { // area of shape NOT covered by shape shifted by sh
  const c = this.c; c.save(); c.beginPath(); c.rect(-999, -999, 1999, 1999);
  c.translate(sh[0], sh[1]); shape(c); c.translate(-sh[0], -sh[1]); c.clip('evenodd'); fn(); c.restore();
};
Painter.prototype.part = function (shape, fill, o = {}) {
  const c = this.c;
  c.save(); c.beginPath(); shape(c); c.clip();
  c.fillStyle = fill; c.fillRect(-999, -999, 1999, 1999);
  if (o.dots) this.dots(...o.dots);
  if (o.sh) this.crescent(shape, o.sh, () => this.dots(...(o.shade || [INK, 0.45])));
  if (o.spot) this.crescent(shape, o.spot, () => { c.fillStyle = INK; c.fillRect(-999, -999, 1999, 1999); });
  if (o.hi) { c.fillStyle = '#fff'; for (const h of o.hi) { c.beginPath(); c.ellipse(h[0], h[1], h[2], h[3], h[4] || 0, 0, TAU); c.fill(); } }
  c.restore();
  const w = o.ol != null ? o.ol : this.ol;      // brush outline: heavier bottom-right
  c.strokeStyle = INK; c.lineWidth = w; c.beginPath(); shape(c); c.stroke();
  c.save(); c.translate(w * 0.3, w * 0.36); c.lineWidth = w * 0.85; c.beginPath(); shape(c); c.stroke(); c.restore();
};
// usage (world units, light top-left):
// P.part(E(0,-22.6,8.4,6.9), '#ff8a1c', { ol: 1.15, sh: [-2.3,-1.9], shade: ['#e0301e', 0.55], spot: [-0.85,-0.75], hi: [[-4,-26.2,2.1,0.85,-0.6]] });
```

**2. Bake with a misregistered colour plate:**

```js
function bakeSprite(box, paint, K, plate) {      // box = [l, t, r, b] in world units, feet at y = 0
  const m = 1.9, l = box[0] - m, t = box[1] - m;
  const cv = document.createElement('canvas');
  cv.width = Math.ceil((box[2] + m - l) * K); cv.height = Math.ceil((box[3] + m - t) * K);
  const ctx = cv.getContext('2d');
  ctx.scale(K, K); ctx.translate(-l, -t); ctx.lineJoin = ctx.lineCap = 'round';
  paint(new Painter(ctx, K));
  if (plate) {
    const tn = document.createElement('canvas'); tn.width = cv.width; tn.height = cv.height;
    const tc = tn.getContext('2d'); tc.drawImage(cv, 0, 0);
    tc.globalCompositeOperation = 'source-atop'; tc.fillStyle = plate; tc.fillRect(0, 0, tn.width, tn.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'destination-over'; ctx.globalAlpha = 0.65;
    ctx.drawImage(tn, -0.5 * K, 0.375 * K);       // plate slips 0.5 units left, 0.375 down
  }
  return { c: cv, ox: -l * K, oy: -t * K };       // draw at (x - ox/K, y - oy/K), size / K
}
```

**3. Ground pixel: rotated anti-aliased dot screen + brush contour:**

```js
// x, y world units; res = px per unit; tone 0..1; dist = signed distance to region edge (units); lw = noise 0..1
function groundPixel(x, y, res, paper, scr, tone, dist, lw) {
  let r = paper[0], g = paper[1], b = paper[2];
  if (scr) {
    const ca = Math.cos(scr.a), sa = Math.sin(scr.a);
    const su = (x * ca + y * sa) / scr.sp, sv = (y * ca - x * sa) / scr.sp;
    const fu = su - Math.floor(su) - 0.5, fv = sv - Math.floor(sv) - 0.5;
    const d = Math.hypot(fu, fv) * scr.sp, rad = scr.sp * (scr.r0 + (scr.r1 - scr.r0) * tone);
    const cov = Math.min(1, (rad - d) * res + 0.5);                 // 1-pixel AA edge
    if (cov > 0) { r *= 1 - cov * (1 - scr.ink[0] / 255); g *= 1 - cov * (1 - scr.ink[1] / 255); b *= 1 - cov * (1 - scr.ink[2] / 255); }
  }
  const hw = 0.42 + 0.62 * lw;                                      // contour half-width 0.42..1.04
  const ink = Math.max(0, Math.min(1, (hw - Math.abs(dist)) * res + 0.5));
  return [r + (30 - r) * ink, g + (24 - g) * ink, b + (36 - b) * ink];
}
// meadow: groundPixel(x, y, 2.5, [237,233,199], { ink: [104,176,98], sp: 3.3, a: 0.785, r0: 0.17, r1: 0.33 }, tone, dist, lw)
```

**4. Halftone contact shadow and dot glow (no blur anywhere):**

```js
function bakeShadow(P) {                          // paint into a Painter-backed canvas, box [-10,-4,10,4]
  const c = P.c;
  c.save(); c.beginPath(); c.ellipse(0, 0, 9.6, 3.5, 0, 0, TAU); c.clip(); P.dots(INK, 0.5, 1.15); c.restore();
  c.save(); c.beginPath(); c.ellipse(0, 0, 6.4, 2.3, 0, 0, TAU); c.clip(); P.dots(INK, 0.95, 1.15); c.restore();
}
function bakeGlow(c) {                            // box [-16,-16,16,16]; draw at 1.5 x 0.62 under the hero, alpha 0.8
  const sp = 1.6; c.fillStyle = '#ffe23a'; c.beginPath();
  for (let j = -10; j <= 10; j++) for (let i = -10; i <= 10; i++) {
    const x = i * sp + (j & 1 ? sp / 2 : 0), y = j * sp * 0.866, d = Math.hypot(x, y) / 15;
    if (d >= 1) continue;
    const r = Math.pow(1 - d, 0.7) * sp * 0.55; c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU);
  }
  c.fill();
}
```

## Adapting it to your game

Keep fixed: the painter pipeline and its order, ink `#1b1620`, outline ~1 unit with the doubled offset stroke, top-left
light, dot spacing ~1.3 units on sprites and ~3 units on the ground, misregistered cyan/magenta plates, no blur, comic
bursts + Bangers, hard-shadow UI.

May change:
- **Palette**: swap process colours freely, but each new fill needs a darker dot sister and must stay more saturated
  than the floor. Keep plates to two colours (cyan + magenta or a pair from your palette).
- **Theme**: sci-fi → chrome blue robots with cyan-dot shade and a magenta plate; western → leather browns with red
  dot overlays. The ground regions become desert/rock/water with their own screen angles.
- **New actors**: build from ellipses/capsules/polygons, give each type its own silhouette and dominant colour, carved
  or ink faces with big yellow eyes. Bosses: thicker outline (1.4–1.6) and a glowing core detail.
- **Genres**: side-scrollers work well (keep the shade on the bottom-right); for platformers, turn region fields into
  horizontal bands and keep the contour lines.
- **Resolution**: everything is in world units; only K changes. At very low resolutions raise dot spacing so dots stay
  ≥ 3 px.
- **Sound words**: localise the word lists; keep them short, uppercase, with "!".

## Performance notes

- Bake cost: ~40 actor canvases (4 frames × 2 modes × 2 facings per type) plus props and FX at 3–5 px/unit — a few
  hundred ms once at start. Runtime per actor is one `drawImage` (+1 for the flash), so 300+ enemies are fine.
- The ground is the hot spot: up to 4 region distances, a rotated dot screen, grain and hatching per pixel. Mitigations
  used by the reference: 4-unit noise grid with bilinear interpolation, per-cell "deep inside / far outside" flags that
  skip distance work, 256-unit chunks rendered as a generator yielding every 2 rows, resolution capped at 2.5 px/unit,
  `putImageData` in 128-row strips.
- Text sprites (numbers, sound words) are cached by value and colour; clear the cache above ~600 entries. Rebuild
  them once the web font has loaded (check `document.fonts` every 0.5 s).
- The screen overlay is baked once per resolution and only non-empty tiles are redrawn.
- `starter.js` bakes the ground once per canvas size and then draws a frame in well under 1 ms.

## Copy-paste prompt

```text
Build my game <X> in the "Pop-Art Comic" style (1960s printed comic book):
- Canvas 2D, procedural, no images. Camera shows 360 world units vertically; bake sprites at 3–5 px per unit.
- Paint every shape with one part painter: clip -> flat process colour -> optional Ben-Day dots -> halftone shade
  crescent (shape minus itself shifted toward the top-left light, filled with darker-sister dots) -> smaller solid
  black crescent -> white shine ellipses -> ink outline #1b1620 ~1 unit stroked twice (2nd at 0.85 width shifted +0.3,+0.36).
- Dots live in world units: diamond-lattice pattern, spacing 1.3 on sprites, radius factor 0.3–0.62.
- Behind every sprite draw a cyan #2ec4ef (or magenta #e0338f) silhouette at 65 % alpha offset 0.5 units left/0.375 down.
- Bake 4 walk frames + a yellow #ffe94a flash frame, both facings; runtime = drawImage only.
- Ground: pale newsprint regions (meadow #ede9c7 + green dots, autumn #fad880 + red dots, etc.), each with its own
  rotated anti-aliased dot screen whose dot size follows a tone noise, separated by brush ink contours 0.8–2 units wide.
- Shadows = ellipses of ink dots; glows = grids of yellow dots. No gradients, no blur, no #000.
- Saturated actors on pale ground; distinct silhouette + colour per enemy type; big yellow eyes.
- Kills: jagged 12-point yellow star with red dot rings + flying chunks + ink drops; sometimes a POW!/ZONK! balloon
  (Bangers, ink stroke, offset plate), max 3 on screen.
- HUD: Bangers + Comic Neue 700, zero-radius panels, 3 px ink borders, hard 4–8 px offset shadows, skewed dotted bars.
- Screen: ink-dot vignette in the corners and a hand-inked black panel frame around the view.
```
