# Paper World — Game Art Style Spec

> A handmade craft-table diorama: cut construction-paper puppets with white sticker rims and brass split pins on layered kraft, felt and newsprint.

Everything looks as if it was cut from real craft materials and laid out on a table under a warm lamp at the top-left. The ground is a stack of large sheets: kraft paper, corrugated cardboard, green felt, a carpet of cut paper leaves and torn newspaper scraps. Characters are jointed paper puppets. Each body part is a separate flat piece with a cream "sticker" rim, paper grain and its own soft drop shadow, and brass split pins hold the joints together. There are **no ink outlines anywhere**. The eye reads edges from the cream rim, the side thickness of the sheets and the warm brown shadows that always fall right-down. In the reference game (*Jack vs. the Turnip Ancestors*) the hero is a pumpkin-head puppet, the enemies are turnip puppets, tissue-paper ghosts and a cardboard golem, and hits shred enemies into tumbling paper scraps and confetti.

## At a glance

| Property | Value |
| --- | --- |
| Family | Papercraft · Cut-paper diorama |
| Mood | cozy, handmade, playful, warm, storybook |
| Best for | top-down action/survivor, cozy adventure, board-game adaptations, family games, seasonal events |
| Renderer | Canvas 2D, fully procedural, no image assets |
| Pixel art | No. Native resolution, sprites baked at 4 px per world unit |
| Difficulty | 6/10. Jointed puppets made of many pieces with pins, rims and shadows; the layered ground is expensive |
| Fonts | Patrick Hand, Gochi Hand, Caveat Brush (Google Fonts) |
| Key colours | kraft `#a87c54`, felt `#607c46`, card `#c49c6c`, rim `#fbf6ea`, pumpkin `#e57d2c`, aubergine `#6e3c6d`, teal `#36a596`, shadow `rgb(48,26,12)` |

## When to use it

- **Good fits:** top-down games with medium enemy counts, cozy adventures, farming, puzzle and board-game conversions, kids' games, Halloween or Christmas events. The tactile depth reads well at the usual 360-unit-tall camera.
- **Good for "charming but readable":** the cream rim makes every actor pop against busy ground without any dark outline.
- **Bad fits:** bullet-hell games with hundreds of tiny projectiles (each would need rim + shadow, and the screen turns to confetti), grim realism, horror that has to feel threatening, sci-fi neon.
- **Risky:** very large hordes. Dense crowds of cream-rimmed puppets merge into a white mass (visible in late-game screenshots), so give each enemy type a distinct silhouette and dominant colour.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Kraft ground | `#a87c54` | Base table / kraft paper (tint B `#b4885c`) |
| Kraft | `#ad8259` / dark `#7d5838` / light `#c9a275` | Kraft paper pieces, fold tabs, belts |
| Cardboard | `#c49c6c` / dark `#96714a` / light `#dcbb8c` | Corrugated card sheets, fences, golem |
| Felt green | `#607c46` (tint B `#768442`) | Felt meadow sheets |
| Moss felt | `#868440` | Olive felt patches with a running stitch |
| Newsprint | `#ddd5c0` | Newspaper scraps |
| Paper core | `#f6eedc` | White fibres at torn edges |
| Thread | `#f4e8ce` | Running stitches on felt |
| Sticker rim | `#fbf6ea` | Rim around every cut piece; text outline; HUD borders |
| Cream | `#f2e7cf` / dark `#dccdab` | Paper flowers, sticks, light details |
| Ink brown | `#3b2a26` | Text and darkest drawn details |
| Shadow brown | `#301a0c` = `rgb(48,26,12)` | Every shadow at 0.2–0.6 alpha |
| Pumpkin | `#e57d2c` / light `#f59c4c` / dark `#bb5a20` / deep `#9c4618` | Hero head, fruit props, accents |
| Glow | `#ffcf4a` / hot `#fff3b8` / deep `#f0922a` | Light behind cut-out holes |
| Aubergine | `#6e3c6d` / light `#9c629a` / dark `#4a2649` / deep `#2e1530` | Hero tunic, enemy caps and brows |
| Mustard | `#d6a43a` / dark `#ac7f26` / light `#ecc463` | Buttons, cuffs, hay |
| Leaf | `#76a54e` / light `#a3cc6a` / dark `#4d7a35` | Sprouts, scarf, leaves |
| Red | `#c4432f` / dark `#8e2c22` | HP bar, crit numbers, buttons, labels |
| Teal | `#36a596` / mid `#5cc3b2` / dark `#1d6d68` | XP gems, XP bar |
| Denim | `#4f6f95` | Occasional cool accent (pinwheels, notebook lines) |
| Brass | `#d4ac4a` / light `#fff0b0` / dark `#8f6d24` | Split pins |
| Ghost tissue | `rgba(188,212,232,0.62)` / `rgba(248,251,253,0.72)` | Translucent enemies |

**Palette rules**
- Use muted craft-paper colours, never neon. Pumpkin `#e57d2c` and teal `#36a596` are the most saturated colours allowed.
- The ground is about 80% warm browns, tans and felt greens. Characters carry the accents: pumpkin for the hero, aubergine and cream for enemies, teal and gold for pickups.
- Shadows are always `rgb(48,26,12)` at partial alpha. Never use black or grey shadows. The leaf carpet's internal shadows use a slightly different multiplier per channel (R × 0.86, G × 0.97, B × 1.0) so shade goes warm, not dull.
- The cream rim `#fbf6ea` is the brightest common value. Only glows and highlights go whiter.
- Never use pure `#000`. The darkest values are `#3a1408` (inside the cut holes), `#2a1424` (pupils) and `#2e1530`.
- Each ground material has two tints mixed by low-frequency noise, plus a global brightness factor `0.93 + 0.13·noise`, so large areas never look flat.

## Typography

All three fonts are hand-lettered and come from Google Fonts. Always weight 400.

- **Patrick Hand.** Body text, labels, card descriptions, the style bar. `https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap`
  `font: 400 19px/26px 'Patrick Hand', 'Gochi Hand', cursive; color: #3b2a26;`
- **Gochi Hand.** Numbers and short words: HP text, kill counter, card titles, damage numbers, key badges. `https://fonts.googleapis.com/css2?family=Gochi+Hand&display=swap`
  `font: 400 22px/1 'Gochi Hand', cursive; color: #3b2a26;`
- **Caveat Brush.** Big titles ("Level Up!", "Game Over"), the clock, the style name. `https://fonts.googleapis.com/css2?family=Caveat+Brush&display=swap`
  `font: 400 74px/1 'Caveat Brush', cursive; color: #e57d2c; letter-spacing: 2px;`

**Text effects**
- **Titles get a cut-out sticker rim and are rotated −2° to −3°:** `text-shadow: -3px -3px 0 #fbf6ea, 3px -3px 0 #fbf6ea, -3px 3px 0 #fbf6ea, 3px 3px 0 #fbf6ea, 0 4px 0 #fbf6ea, 7px 10px 6px rgba(20,10,5,.55);`
- **Labels sit on cream paper stickers:** `background:#fbf6ea; padding:0 9px; transform:rotate(-2deg); box-shadow:2px 3px 4px rgba(48,26,12,.4)`.
- **In-world damage numbers:**
  - Font: Gochi Hand, 8 world units tall (11 for crits), rotated by ±0.17 rad per number.
  - Each number gets a shadow fill rgba(48,26,12,0.35) offset (0.5, 0.7), then a stroke 1.8 wide in `#fbf6ea` (2.4 wide in `#fff3c0` for crits), then the fill `#3b2a26` (crit `#c4432f`).
  - Numbers pop in over 18% of their life with easeOutBack, starting from scale 0.4.

## Rendering technique

The look comes from one primitive, the **cut piece**, plus strict top-left lighting.

1. **Init: build the paper grain tile.** It is 256×256 px.
   - Each pixel is 50/50 cream `(255,250,235)` or brown `(60,36,20)`, at alpha 0–22/255 and 0–20/255 respectively.
   - On top go 520 short curved fibres, 3–11 px long and 0.5–1.1 px wide, in `rgba(255,248,230,0.22)` (55% of them) or `rgba(70,40,20,0.16)`. 30% of the fibres are rotated 90°.
2. **Init: bake every cut piece** with `mkPart(bbox, draw, opts)`:
   1. Draw the flat shape in world units into a canvas at **K = 4 px per unit**.
   2. **Rim:** dilate the silhouette by `rim × K` px (default rim 0.55 units, 0.3–0.6 range) in `#fbf6ea`. Stamp the one-colour silhouette around 3 rings (r, 0.6r, 0.3r), with `max(8, round(r·3.2))` stamps per ring, then draw the original on top.
   3. **Grain:** fill the grain pattern `source-atop` at alpha 1. Use 0.4–0.7 for foil gems and tissue.
   4. **Light:** fill a diagonal linear gradient (0,0)→(w,h) `source-atop` with stops `0: rgba(255,250,232,a)`, `0.45: transparent`, `1: rgba(50,25,10,1.2a)`. Use a = 0.1 by default, 0.04–0.06 for gems and lanterns.
   5. **Shadow image:** make a `rgb(48,26,12)` silhouette blurred by `0.35 × K` px (`ctx.filter = 'blur()'`, or 10 offset stamps at alpha/4 as a fallback).
3. **Init: compose puppet frames** with `composeFrame(fw, fh, footX, footY, facing, parts)`:
   - Each part is `{p, x, y, r, sh, pin}`, drawn back-to-front at its pivot and rotation.
   - Before each part, draw its shadow image at alpha 0.34, offset **(0.42, 0.55) units** in screen space. Props use (0.55, 0.7).
   - Pins are collected through the current transform and drawn last, unmirrored.
4. **Init: wrap each frame** with `dropSprite`.
   - The whole-puppet shadow is offset **(0.9, 1.1)**, blurred 0.7 units, at alpha 0.3. The brute uses (1.4, 1.7), blur 1.0. Ghosts use alpha ≈ 0.
   - A white flash copy is the frame tinted `#fffaf0` at 95% `source-atop`.
5. **Ground chunks.** These are 256×256 world units, rendered asynchronously (generator that yields every 2 rows) at ≤ 2.5 px per unit, then decals are drawn on top (see the next section).
6. **Per frame, in order:**
   1. Ground chunks.
   2. Gems.
   3. Shadows for every actor and prop: blob or projected cast shadow.
   4. Props, enemies and hero, y-sorted.
   5. Orbitals.
   6. Projectiles.
   7. Particles.
   8. Damage numbers.
   9. Screen vignette.
7. **Resolution.** Sprites are drawn with smoothing on and scaled by `sc / K`. World scale is `canvasHeight / 360`. Nothing is snapped to pixels.

## Background and ground

The floor is a top-down view of material sheets stacked on kraft paper. In the reference, each layer is a noise field turned into a **signed distance** (`(fbm − threshold) / |∇fbm|`, clamped to ±90), then shaded per pixel. Layer parameters (shadow offset, blur and alpha, and side thickness are in world units):

| Layer (bottom → top) | Threshold | Edge wobble | Fibre noise | Thickness | Shadow offset | Shadow blur | Shadow alpha |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Kraft base | n/a | – | – | – | – | – | – |
| Cardboard | 0.50 | 0.6 | 0.10 | 1.0 | (1.4, 1.8) | 1.5 | 0.40 |
| Felt | 0.49 | 1.2 | 0.22 | 1.4 | (1.7, 2.2) | 1.9 | 0.42 |
| Moss felt | 0.67 | 0.9 | 0.22 | 0.9 | (1.2, 1.6) | 1.4 | 0.38 |
| Leaf carpet | 0.595 | per leaf | – | – | (0.6, 0.75) | small | 0.42 |
| Newspaper | 0.70 | 2.0 | 0.45 | 0.35 | (1.0, 1.3) | 1.1 | 0.36 |

How each material is shaded:
- **Kraft:**
  - Mixes `[168,124,84]` and `[180,136,92]` by noise.
  - Its luminance texture is mottled fbm plus 2600 mostly horizontal fibres, 3–11 texels long, in `rgba(255,236,200,0.15)` / `rgba(60,36,16,0.13)`.
  - Specks: 260 dark `rgba(50,30,15,0.35)` and 90 light, each 0.4–1 texel.
- **Cardboard** `[196,156,108]`:
  - The top liner is multiplied by a corrugation ridge profile with a **period of 3.2 units**: `1 + 0.055·sin(u·2π − 0.6) − 0.075·gauss(u−0.9, 0.07) + 0.03·gauss(u−0.3, 0.08)`.
  - The side face shows flutes: `0.66 + 0.16·|sin(x·2.3)|`.
  - A 0.7-unit lighter lip (×1.1) runs along the cut edge.
- **Felt:**
  - Mixes `[96,124,70]` and `[118,132,66]`. Moss felt is `[134,132,64]`.
  - The texture is 5200 short curly arcs, radius 1.2–3.2, at ±0.13 alpha.
  - The side is ×(0.72 − 0.12·s).
  - The rim within 1 unit of the edge is lighter (×1.12) on the lamp side and darker (×0.94) on the far side.
  - Moss felt gets a cream thread `[244,232,206]` checker, 1.55–2.15 units inside the edge: a running stitch.
- **Leaf carpet:**
  - A 512² texture of 46×46 = 2116 cut leaves, 8–12 units long and 0.5–0.66 of that wide. Shapes: 30% maple, otherwise oval or wavy.
  - Leaf colours from `[176,82,48] [200,112,50] [206,158,62] [150,58,44] [140,92,54] [184,128,58]`, mixed 45% toward `[172,102,54]` and then 20% toward `[160,94,52]`.
  - Each leaf is darker on one side of the midrib (×0.86 vs ×1.04) and has a lighter midrib fold (×1.13), faint veins (×0.94) and a darker cut edge (×0.9).
  - Each leaf casts a shadow (24% darker) onto lower leaves, offset 2 texels.
  - The carpet's outline is made of whole leaves: a leaf is visible when the region's distance at the leaf centre plus a per-leaf random reach (≤ 5 units) is positive.
- **Newspaper:**
  - Base `#ddd5c0` with yellowed blotches.
  - 8 columns 64 texels wide (25.6 units).
  - Line height 3.2 texels: word bars `rgba(70,64,60,0.32)` 1.3 tall, headline bars `rgba(40,36,34,0.5)` 4.4 tall, halftone pictures of dots `rgba(55,50,48,0.38)` on a 2.6 grid.
  - Column rules are 0.8 wide.
  - The torn edge is a **white fibre core** `[246,238,220]`, 0.55–1.0 units wide (noise-varied), with a slightly lighter band just inside it.
- **Compositing:**
  - The final pixel is `colour × (0.93 + 0.13·noiseA + 0.06·(noiseB−0.5))`.
  - The accumulated shadow from upper layers is applied per channel as ×(1 − 0.86k, 1 − 0.97k, 1 − k), which keeps shade warm.
  - Within 2.4 units outside a sheet's edge there is extra ambient-occlusion darkening of 0.2·(1 + s/2.4)².

**Decals** are baked into each chunk using a scattered grid (24-unit cells for small decals, 170-unit cells for big ones) and chosen by the region underneath:
- **Felt:** punched 5–6-petal paper flowers, felt grass fringes, sewing buttons with cross-stitched thread, glued pebbles, loose leaves.
- **Kraft:** pebble clusters, confetti dots (0.55–0.95 units, each with a shadow offset (0.3, 0.4)), lace doilies (15-unit scalloped disc with punched holes), coffee rings, folds (a light line plus a dark line offset 0.45), dashed cut lines with tiny scissors.
- **Cardboard:** masking tape (zig-zag torn ends, `rgba(234,220,170,0.8)`), staples (grey `#a9a9a9` line with a highlight and shadow), stamped "this side up" arrows.

Decal sprites are 6 px per unit, with grain at 0.9, light at 0.08, and a shadow offset (0.45, 0.55)·scale at alpha 0.34.

## Characters

The **hero is a jointed puppet** about 18 units wide and 30 tall. The frame is 34×42 units with feet at (17, 38), drawn at scale 1.08. Pieces, back to front:

1. **Back leg** (`#6f4c30` trousers, `#3e281b` boot) and **front leg** (`#8d6440`, `#5b3d2a` boot). Each is 2.9 units wide and 6.6 long, with a dashed seam `rgba(255,235,200,0.35)` and a highlight strip across the boot. Rim 0.45.
2. **Back arm**, in the darker tunic colour `#4a2649`, with a cuff and hand.
3. **Scarf tail**: green `#76a54e` with diagonal `#4d7a35` stripes every 2.4 units and fringe strokes.
4. **Tunic body** `#6e3c6d`:
   - The hem is a zig-zag of 7 teeth.
   - A front panel in `#9c629a` is a second layer with its own 0.3-unit shadow.
   - A kraft-dark belt with a brass buckle.
   - A dashed stitch hem `rgba(250,236,210,0.7)`, 0.2 wide, dash [0.55, 0.45].
   - Two mustard buttons with shadows.
5. **Front arm**, with a **brass split pin at the shoulder** (radius 0.5).
6. **Stem**: `#5f6e30` with a curly tendril `#7c9a40`.
7. **Pumpkin head**, 19 units wide:
   - Four stacked ellipse lobes: `#9c4618` (8.7×7.5), `#bb5a20`, `#e57d2c`, `#f59c4c` (front, offset +0.9). Each lobe drops a shadow `rgba(70,25,5,0.28)` offset (0.3, 0.4).
   - One pencil rib line.
   - The face is **cut out**: two triangle eyes, a triangle nose and a jagged 9-tooth mouth, all `glowHole`s (dark `#3a1408`, then a radial gradient `#fffbe0 → #ffe066 → #ffa21e` shifted (0.32, 0.45)).
   - The face sits 1.7 units toward the facing side.
8. **Scarf wrap**: green with stripes and a `#a3cc6a` knot.

**Hero animation:**
- **Walk:** leg angle `sin(φ)·0.55`, arms opposite, hip lift `(1 − cos(leg))·6.6 − |cos φ|·0.45`, lean 0.07 rad, head tilt `sin(2φ)·0.06`, scarf `−0.25 + sin(2φ)·0.18`.
- **Frame sets:** 8 walk frames, 8 throw frames (front arm at −2.15 rad) and 4 idle frames (breathing only) per facing.
- **Mirroring:** facing −1 mirrors all pieces, but pins are drawn after the mirror so their highlight stays top-left.
- **Face glow:** an additive 22-unit glow sprite sits over the face at (x + facing·2.6, y − 24.2) and flickers.

**Rules that keep characters on-style:**
- Use flat fills only. Volume comes from overlapping layers, each with its own little shadow.
- Faces are holes or paper strips, never painted lines.
- Every piece has a rim. Thin pieces use 0.35–0.45, large ones 0.55–0.6.
- Joints that should read as articulated get a brass pin (radius 0.42–0.8).
- Proportions are storybook: the head is about 60% of the height, with stubby limbs.

## Enemies and props

**Small melee enemy (turnip creeper)**, frame 30×36, feet at (15, 32):
- **Bulb:** turnip path 7.4 wide and 15.2 tall, filled with a vertical gradient `#efe2b8 → #dcc68a`.
- **Cap:** a **torn aubergine cap** (`tornCap`) at 60% height: a jagged line stepping every 1.1 units ±0.45 with a sine wave of 0.5. Under it lie a 0.55-unit white core strip `#fbf6ea` and a shadow strip `rgba(48,26,12,0.22)`.
- **Cap details:** brush streaks `rgba(156,98,154,0.5)` on the cap, pencil growth rings and root hairs on the bulb.
- **Face:**
  - Two curved glowing eye holes (`#fff2a0 → #ffb02e → #e0561c`) with dark pupils `#2a1424`.
  - Angry brows are aubergine-deep paper strips, each with a 0.3-unit shadow.
  - The frown is a jagged dark cut `#3a1830`.
- **Other parts:** two root legs, two stubby arms (front one pinned) and three upright leaves (one pinned at the base).
- **Animation:** 6 frames with wobble ±0.12 rad, hop 0.9 units and leaf sway.
- **Variant:** a second palette swaps the aubergine for `#843a63` / `#b4618c`.

**Fast enemy (tissue ghost)**, frame 30×32:
- Two sheets of tissue paper:
  - Back sheet: `rgba(188,212,232,0.62)`, radius 7.2, with a 4-tip hem.
  - Front sheet: `rgba(248,251,253,0.72)`, scaled 0.86×0.9.
- Two tissue-strip arms reach forward.
- Crinkle strokes, alternating white 0.7 and `rgba(120,140,170,0.28)`.
- Hollow eyes `rgba(43,36,64,0.88)` with pale catch-lights, a gaping oval mouth and four white sequins.
- Rim 0.35 in `rgba(255,255,255,0.75)`, grain 0.7, no puppet shadow. Drawn at alpha 0.92 with a bob.

**Large brute (cardboard golem)**, frame 64×68, bulb 17×32:
- **Body:** cardboard `#c49c6c` with a cream-painted lower half `#e9d9ae` and brush streaks.
- **Torn liner:** a 2.6-unit **exposed corrugated band** (`#dcbb8c` with vertical flute lines every 0.95 units), with a torn aubergine painted top above it.
- **Repairs:** a pencil crack patched with two masking-tape strips (`rgba(236,222,172,0.88)`, zig-zag ends), plus four staples.
- **Face:** a jagged 11-point glowing core hole, slanted glowing eye slits and a heavy brow strip.
- **Limbs:** cardboard-tube arms with a gradient `#dcbb8c → #c49c6c → #96714a`, an elliptical tube end with rings, tape and root fingers. Two pins.
- **Shadow and glow:** a larger drop shadow (1.4, 1.7) and a pulsing additive glow on the core.

**Props.** These are stand-up cut-outs, each on a **fold tab** (a trapezoid of `#c9a275` at the foot) and with a **projected cast shadow**:
- **Building the shadow:**
  - Skew the silhouette with `setTransform(1, 0, −0.42, −0.26, …)` so it falls right-down from the foot.
  - Fade it from 1 to 0.45 alpha with distance, blur it by 1.4 units and add a dark contact blob at the base.
  - Draw at alpha 0.78.
- **Trees:** a tapered trunk `#76503a` with branches and a shaded right half, plus three scalloped crowns (11/9/8 bumps, depth 0.18–0.22) in autumn triplets such as `#9a6a2a / #c8962e / #e2be5a`. The crown carries a pin.
- **Pines:** four zig-zag felt tiers from `#445e34` to `#859a4e`.
- **Pumpkins:** five concentric ellipses alternating tones, plus a stem and a leaf.
- **Gravestones:** grey `#9b97a3` with an inner border, an emblem, scribbled text lines and a moss scallop at the base.
- **Picket fences:** card pickets alternating `#c49c6c` / `#cba574`, with tape.
- **Hay mounds:** 140 straw strokes.
- **Pinwheels:** spin in real time; brass pin on the hub.

**Pickups and orbitals:**
- **Gems** are **origami foil**: 4 triangular facets (teal `#bff3e8 #5cc3b2 #36a596 #1d6d68`; big gold `#fff1a6 #f0c64a #d39a2a #9a6a18`), a white fold line and a top-left gleam.
- **Lanterns** are vellum turnips (radial `#fff3c4 → #f5d690 → #c9a0c8`) with glowing cut faces, swinging ±0.12 rad.

## Effects and particles

- **Paper scraps.** On a hit, spawn 1–2. On a kill, 8 (small), 6 (ghost) or 18 (brute).
  - Shapes: 6 cached Path2D polygons with 5–7 vertices at radius 0.55–1.05.
  - Colours: the enemy's own palette (creeper `#6e3c6d #9c629a #efe2b8 #e3cf8a #76a54e`).
  - Physics: vz 25–80, gravity 70, drag 2.2, spin ±6 rad/s, size 1.7–4.
  - Each scrap flips: y-scale `max(0.18, |cos(rot·1.7)|)`, and the back colour is the front colour × 0.72.
  - 0.16-unit cream edge. While airborne, a tiny shadow rectangle on the ground at alpha 0.16.
- **Confetti.** Dots and strips in the 7 confetti colours. Gravity 120, drag 2.4, sideways flutter `sin(age·7)·0.6`. Hits fire 2, kills 5–14, level-up 46.
- **Torn death.** The sprite is clipped by a fixed 8-point zig-zag tear path. The two halves move apart by `side·k·w·0.7`, rotate `side·k·0.7` rad, rise 3 units and fade `1 − k²`. A 0.9-unit cream line marks the tear.
- **Brute death.** Adds 6 kraft-coloured dust puffs `#d8c4a0`.
- **Projectile.** A spinning seed piece (scale 0.85) with its own part shadow (0.5, 0.7) at alpha 0.35. Behind it run a cream streak (1.6 wide, from 3 to 11 units back) and a pumpkin streak (0.7 wide, from 4 to 13).
- **Pickup.** An additive 8-point star glint (radius 4.5, or 7 for big gems) for 0.28 s. Gems also twinkle on their own 12% of the time.
- **Dash.** 5 pale puffs `#e6d6b4` and 3 trailing sprite copies, 7 units apart, at alpha 0.21 / 0.14 / 0.07.
- **Hurt.** 7 scraps in the hero palette plus 4 confetti. The sprite blinks to alpha 0.45 at 9 Hz during invulnerability and is overlaid with the white flash copy.
- **Level-up.** A 46-piece confetti fountain plus a squash-and-stretch wobble.

## Lighting, shadows and post-processing

- **Light direction:** fixed top-left. All shadows fall right-down, and the offset grows with layer height:
  - parts inside a puppet: (0.42, 0.55)
  - decals: (0.45, 0.55)
  - leaves in the carpet: (0.6, 0.75)
  - whole puppets: (0.9, 1.1)
  - ground sheets: (1.0–1.7, 1.3–2.2)
- **Actor contact shadow:** a radial blob `rgba(48,26,12,0.62) → 0.36 @0.55 → 0`, offset (+1.2, +0.6), drawn at alpha 0.75. Sizes:
  - hero 9×3.6
  - small enemy 8.5×3.2
  - brute 19×6
  - ghost 6.5×2.4 at alpha 0.55
- **Prop shadows:** projected skewed cast shadows (see Enemies and props).
- **Glow:** only additive (`'lighter'`) radial sprites over carved faces, lanterns and the brute's core. Nothing else glows.
- **Vignette:** one screen-space radial gradient centred at (0.45 W, 0.42 H). Stops: `rgba(255,236,200,0.05)` from 0.35R, `rgba(70,40,20,0)` at 0.6, `rgba(60,30,15,0.36)` at R (R = half the diagonal). Cache it per screen size.
- **No colour grading, bloom or blur post-processing.** The warmth is all in the palette and shadows.

## UI and HUD

The HUD is made of craft materials too:
- **Bars** are paper strips. Each has a 3px cream rim (`box-shadow: 0 0 0 3px #fbf6ea`), a warm offset shadow and a slight rotation (−0.4° to 0.6°).
- **Bar fills** have a torn zig-zag right edge (clip-path). The HP fill is tomato red with cream polka dots. The XP fill is diagonal teal stripes.
- **Counters** sit on cream stickers.
- **The timer** sits on lined notebook paper: a red margin line, blue ruled lines and a brass split pin at the top.
- **Level-up cards** are lined notebook pages rotated −3°, 1.5° and 3.5°, each with striped washi tape (teal, mustard or plum) across the top. Hovering a card straightens it.
- **Key badges** are pumpkin circles with a cream rim.
- **Icons** are small cut-paper drawings on a 48-unit canvas: 1.6 rim, grain 0.7, light 0.08, and a shadow offset (1.4, 1.9) at alpha 0.42.

```css
.hud-bar { width: 240px; height: 22px; background: #c9a275; border-radius: 2px; transform: rotate(0.6deg); overflow: hidden;
  box-shadow: 0 0 0 3px #fbf6ea, 3px 5px 6px rgba(48,26,12,.45);
  background-image: repeating-linear-gradient(0deg, rgba(90,60,30,.12) 0 1px, transparent 1px 4px); }
.hud-bar > .fill { height: 100%;
  background: radial-gradient(circle at 5px 5px, rgba(255,240,220,.55) 1.6px, transparent 2px) 0 0/10px 10px, #c4432f;
  clip-path: polygon(0 0, 100% 0, calc(100% - 4px) 25%, 100% 50%, calc(100% - 4px) 75%, 100% 100%, 0 100%); }
.hud-xp { height: 24px; background: #f4ead2; transform: rotate(-0.4deg); box-shadow: 0 0 0 3px #fbf6ea, 3px 5px 6px rgba(48,26,12,.45); }
.hud-xp > .fill { background: repeating-linear-gradient(-45deg, #36a596 0 9px, #5cc3b2 9px 18px); }
.hud-label { font: 400 22px 'Gochi Hand', cursive; color: #3b2a26; background: #fbf6ea; padding: 0 9px;
  border-radius: 2px; transform: rotate(-2deg); box-shadow: 2px 3px 4px rgba(48,26,12,.4); }
.hud-note { position: relative; background: #fffdf6; padding: 6px 26px 4px; transform: rotate(-1.5deg); border-radius: 2px;
  background-image: linear-gradient(transparent 13px, rgba(196,67,47,.5) 13px 15px, transparent 15px),
                    repeating-linear-gradient(transparent 0 19px, rgba(79,111,149,.28) 19px 20px);
  box-shadow: 3px 6px 8px rgba(48,26,12,.45); font: 400 40px/1 'Caveat Brush', cursive; color: #3b2a26; }
.hud-note::before { content: ''; position: absolute; left: 50%; top: -6px; width: 15px; height: 15px; margin-left: -7px; border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #fff0b0, #d4ac4a 50%, #8f6d24); box-shadow: 1px 2px 2px rgba(48,26,12,.5); }
.card { background: #fffdf6; border-radius: 3px; transform: rotate(-3deg); box-shadow: 4px 9px 12px rgba(20,10,5,.55);
  background-image: linear-gradient(transparent 58px, rgba(196,67,47,.55) 58px 60px, transparent 60px),
                    repeating-linear-gradient(transparent 0 25px, rgba(79,111,149,.25) 25px 26px); }
.card::before { content: ''; position: absolute; top: -12px; left: 50%; width: 92px; height: 26px; margin-left: -46px; transform: rotate(-4deg);
  background: repeating-linear-gradient(-45deg, rgba(54,165,150,.75) 0 7px, rgba(154,230,214,.75) 7px 14px); }
.overlay { background: radial-gradient(ellipse at center, rgba(60,35,20,.35), rgba(40,22,12,.72)); }
```

## Motion and animation

- **Puppet rule:** rigid pieces rotate around pivots. Shapes never deform, except spawn pop and level-up squash on the whole sprite.
- **Hero:**
  - Walk: 8 frames per stride; the stride takes 2.4 animation units (`frame = floor(anim/2.4·8) & 7`).
  - Idle: 4 frames at 3 fps (breathing hip bob 0.45).
  - Throw: the front arm swings up to −2.15 rad while `shootT > 0.45`.
- **Small enemy:** 6 frames, frame = `floor(anim·0.42·6) % 6`.
- **Brute:** 6 frames at rate 0.22, bob 1.4, tilt ±0.05.
- **Ghost:** 6 frames at about 7 fps (`floor(t·7 + seed·13) % 6`) plus a bob of `−2.5 − sin(3.1t + seed·20)·1.6`.
- **Per-instance variety:** each enemy is scaled by 0.93 + seed·0.14 and starts at a random phase.
- **Spawn:** `sy = max(0.06, easeOutBack((t − 0.1)/0.9))`, `sx = 1 + (1 − t)·0.3`. Ghosts also fade in over 0.4 of the spawn time.
- **Death:** tear apart over the death time (see Effects).
- **Gems:** bob 0.9 at 3.5 rad/s. The paper turn is `scaleX = 0.35 + 0.65·|cos(2.2t)|`, and the spawn pop is easeOutBack.
- **Orbiting lanterns:** bob 1.2 and swing 0.12 rad at 5 rad/s.
- **Pinwheels:** spin at 1.2–2.8 rad/s.
- **Face glow flicker:** `0.3 + 0.05·sin(9t) + 0.04·sin(23.7t)`, plus 0.12 while shooting.

## Do and don't

**Do**
- Build every object from separate flat cut pieces. Give each one the cream rim, grain, top-left light and an offset shadow.
- Keep all shadows warm brown and offset right-down. A higher layer gets a larger offset.
- Use craft materials as your vocabulary: kraft, felt, corrugated card, newsprint, tissue, washi/masking tape, staples, buttons, split pins, doilies.
- Show material edges: torn white fibre cores, sheet side thickness, corrugation flutes, stitches.
- Put brass split pins on joints and on the hubs of round props.
- Make faces from cut-out holes with warm light behind them, or from paper strips.
- Pre-bake every frame and ground chunk.

**Don't**
- Don't draw black or dark outlines. The cream rim and shadows do that job.
- Don't use smooth radial "3D" shading on bodies. Stack flat layers instead.
- Don't use grey or black shadows, or let shadows point in different directions.
- Don't morph limbs in walk cycles. Only rotate rigid parts.
- Don't use neon, glossy specular highlights or metallic gradients (brass pins are the one exception).
- Don't leave any piece without grain. Clean fills instantly look digital.
- Don't dilate or blur at runtime. It costs dozens of drawImage calls per piece.

## Implementation recipe

1. **Set up the camera.** Use a world-unit camera with a visible height of 360 units, `scale = canvasHeight / 360`, and smoothing on.
2. **Write the material helpers:** `cv`, `sil` (silhouette), `dilate` (rim), `softShadow` (blur), `buildGrain`, `applyGrain`, `applyLight`, and `mkPart(bbox, draw, {rim, grain, light, shBlur, rimColor})` at K = 4 px per unit.
3. **Write `drawPin`.** It draws the brass split pin: a shadow disc offset (0.18, 0.24), a radial gradient `#fff0b0 → #d4ac4a @0.45 → #8f6d24` centred at −0.35r, and a slot line.
4. **Write the puppet helpers:** `composeFrame` (parts with pivots, per-part shadow offset (0.42, 0.55) at alpha 0.34, pins drawn last) and `dropSprite` (puppet shadow (0.9, 1.1), blur 0.7, alpha 0.3, plus a white flash copy).
5. **Design the hero** as 6–9 pieces: legs, body, arms, head, accessory.
   - Round forms: stacked lobes in deep/dark/mid/light.
   - Face: `glowHole` cut-outs.
   - Clothing: a lighter front panel and a stitch line.
   - Bake 8 walk, 8 action and 4 idle frames per facing.
6. **Design each enemy type** with the same pieces but its own dominant colour and silhouette.
   - Use torn caps (`tornCap`) to split two colours on one piece.
   - Use tissue (alpha sheets, translucent rim) for spirits and cardboard (tape, staples, corrugation) for brutes.
7. **Build the ground** as stacked material sheets on a base paper. For each sheet:
   - Draw a blurred shadow offset right-down.
   - Draw the darker side face shifted down by the sheet's thickness.
   - Fill the top with a material texture (2.5 texels per unit).
   - Torn sheets get a white core edge; felt gets a running stitch.
8. **Scatter baked decals** (flowers, buttons, tape, staples, confetti) by region. Each is a mini cut piece with a shadow.
9. **Build props** as stand-up cut-outs on fold tabs, each with a skewed, blurred cast shadow.
10. **Draw actors per frame:** contact blob shadow, then the sprite blit, then the flash overlay, then additive glows. Y-sort actors and props together.
11. **Add the effects:** two-sided flipping paper scraps, confetti, tear-apart death and streaked projectiles.
12. **Finish with the warm vignette.** Then build the HUD in CSS with paper strips, stickers, notebook paper, washi tape and the hand-lettered fonts.

## Code

The snippets below are the core techniques, ported from the reference so they run on their own. `starter.js` (in this folder) contains all of them plus a working hero, creeper, ghost, tree, pumpkin, gems, layered ground and a preview `draw()`. The full reference module is `../../js/styles/paper.js`.

**1. The cut piece (rim + grain + light + shadow)**

```js
const K = 4, TAU = Math.PI * 2, SH = 'rgb(48,26,12)';
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
function sil(src, col) { const c = cv(src.width, src.height), x = c.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); return c; }
function dilate(src, r, col) { // white sticker rim
  const pad = Math.ceil(r) + 2, c = cv(src.width + pad * 2, src.height + pad * 2), x = c.getContext('2d'), s = sil(src, col);
  for (const rr of [r, r * 0.6, r * 0.3]) { const n = Math.max(8, Math.round(rr * 3.2)); for (let i = 0; i < n; i++) { const a = ((i + 0.5) / n) * TAU; x.drawImage(s, pad + Math.cos(a) * rr, pad + Math.sin(a) * rr); } }
  x.drawImage(s, pad, pad); return { c, pad };
}
function applyLight(x, w, h, a) { // top-left lamp across the whole piece
  x.save(); x.globalCompositeOperation = 'source-atop';
  const g = x.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, `rgba(255,250,232,${a})`); g.addColorStop(0.45, 'rgba(255,250,232,0)'); g.addColorStop(1, `rgba(50,25,10,${a * 1.2})`);
  x.fillStyle = g; x.fillRect(0, 0, w, h); x.restore();
}
function mkPart(bb, draw, rim = 0.55, grainTile = null) {
  const c = cv((bb[2] - bb[0]) * K + 4, (bb[3] - bb[1]) * K + 4), x = c.getContext('2d');
  x.setTransform(K, 0, 0, K, -bb[0] * K + 2, -bb[1] * K + 2); draw(x);
  const d = dilate(c, rim * K, '#fbf6ea'); const ix = d.c.getContext('2d'); ix.drawImage(c, d.pad, d.pad);
  if (grainTile) { ix.save(); ix.globalCompositeOperation = 'source-atop'; ix.fillStyle = ix.createPattern(grainTile, 'repeat'); ix.fillRect(0, 0, d.c.width, d.c.height); ix.restore(); }
  applyLight(ix, d.c.width, d.c.height, 0.1);
  const pad = Math.ceil(0.35 * K * 2.5) + 2, sh = cv(d.c.width + pad * 2, d.c.height + pad * 2), sx = sh.getContext('2d');
  sx.filter = `blur(${0.35 * K}px)`; sx.drawImage(sil(d.c, SH), pad, pad); sx.filter = 'none';
  return { img: d.c, ox: -bb[0] * K + 2 + d.pad, oy: -bb[1] * K + 2 + d.pad, sh, shPad: pad };
}
```

**2. Puppet frame with per-part shadows and brass pins**

```js
function drawPin(x, px, py, r) {
  x.fillStyle = 'rgba(48,26,12,0.35)'; x.beginPath(); x.arc(px + 0.18, py + 0.24, r * 1.05, 0, TAU); x.fill();
  const g = x.createRadialGradient(px - r * 0.35, py - r * 0.35, r * 0.1, px, py, r);
  g.addColorStop(0, '#fff0b0'); g.addColorStop(0.45, '#d4ac4a'); g.addColorStop(1, '#8f6d24');
  x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill();
  x.strokeStyle = 'rgba(90,60,20,0.55)'; x.lineWidth = 0.12;
  x.beginPath(); x.moveTo(px - r * 0.55, py + r * 0.1); x.lineTo(px + r * 0.55, py - r * 0.1); x.stroke();
}
function composeFrame(fw, fh, footX, footY, facing, list) {
  const c = cv(fw * K, fh * K), x = c.getContext('2d'), pins = [];
  for (const it of list) {
    const p = it.p, place = (dx, dy) => { x.setTransform(K, 0, 0, K, (footX + dx) * K, (footY + dy) * K); x.scale(facing, 1); x.translate(it.x, it.y); if (it.r) x.rotate(it.r); };
    if (it.sh !== 0) { place(0.42, 0.55); x.globalAlpha = it.sh ?? 0.34; x.drawImage(p.sh, (-p.ox - p.shPad) / K, (-p.oy - p.shPad) / K, p.sh.width / K, p.sh.height / K); }
    place(0, 0); x.globalAlpha = 1; x.drawImage(p.img, -p.ox / K, -p.oy / K, p.img.width / K, p.img.height / K);
    if (it.pin) { const m = x.getTransform(); pins.push([(m.a * it.pin[0] + m.c * it.pin[1] + m.e) / K, (m.b * it.pin[0] + m.d * it.pin[1] + m.f) / K, it.pin[2]]); }
  }
  x.setTransform(K, 0, 0, K, 0, 0); for (const q of pins) drawPin(x, q[0], q[1], q[2]); // unmirrored -> highlight stays top-left
  return c;
}
```

**3. Cut-out glowing face hole and torn two-colour cap**

```js
function glowHole(x, path, gx, gy, gr, hot, mid, edge) {
  x.save(); path(); x.clip();
  x.fillStyle = '#3a1408'; x.fillRect(gx - gr * 3, gy - gr * 3, gr * 6, gr * 6); // the cut edge (paper thickness)
  x.translate(0.32, 0.45);                                                     // light paper sits lower-right of the hole
  const g = x.createRadialGradient(gx, gy, 0, gx, gy, gr * 1.5);
  g.addColorStop(0, hot); g.addColorStop(0.5, mid); g.addColorStop(1, edge);
  x.fillStyle = g; path(); x.fill(); x.restore();
}
function tornCap(x, rand, x0, x1, y, top, col, coreW) { // rand() in [0,1)
  const pts = []; for (let px = x0; px <= x1 + 0.01; px += 1.1) pts.push([px, y + (rand() * 2 - 1) * 0.45 + Math.sin(px * 0.45) * 0.5]);
  const poly = (dy) => { x.beginPath(); x.moveTo(pts[0][0], top); for (const p of pts) x.lineTo(p[0], p[1] + dy); x.lineTo(pts[pts.length - 1][0], top); x.closePath(); };
  x.fillStyle = 'rgba(48,26,12,0.22)'; poly(coreW + 0.35); x.fill(); // shadow
  x.fillStyle = '#fbf6ea'; poly(coreW); x.fill();                    // white paper core
  x.fillStyle = col; poly(0); x.fill();                              // coloured layer
}
```

**4. A ground sheet and the projected prop shadow**

```js
// one stacked material sheet: shadow on what lies below, side thickness, textured top (world units, ctx scaled by s)
function sheet(x, s, path, fill, L /* {ox, oy, soft, sh, thick, side} */) {
  x.save(); x.filter = `blur(${L.soft * s}px)`; x.translate(L.ox, L.oy); path(x); x.fillStyle = `rgba(48,26,12,${L.sh})`; x.fill(); x.restore();
  x.save(); x.translate(0, L.thick); path(x); x.fillStyle = L.side; x.fill(); x.restore();
  path(x); x.fillStyle = fill; x.fill();
}
// felt: sheet(x, s, feltPath, feltPattern, { ox: 1.7, oy: 2.2, soft: 1.9, sh: 0.42, thick: 1.4, side: '#455a33' })

function castShadow(spr /* {img, ax, ay} foot in px */, kx = 0.42, ky = 0.26) {
  const src = spr.img, fx = spr.ax, fy = spr.ay, blur = 1.4 * K, pad = Math.ceil(blur * 2.5) + 4;
  const w = src.width + fy * kx + pad * 2, h = fy * ky + pad * 2 + 12, t = cv(w, h), x = t.getContext('2d');
  x.setTransform(1, 0, -kx, -ky, kx * fy + pad, ky * fy + pad + 6); x.drawImage(sil(src, '#000'), 0, 0); x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalCompositeOperation = 'destination-in';
  const g = x.createLinearGradient(0, pad + 6, 0, h); g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,0.45)');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  const c = cv(w, h), y = c.getContext('2d'); y.filter = `blur(${blur}px)`; y.drawImage(sil(t, SH), 0, 0); y.filter = 'none';
  return { img: c, ax: fx + pad, ay: pad + 6 }; // draw at alpha 0.78 under the prop
}
```

## Adapting it to your game

- **Keep fixed:**
  - the cut-piece pipeline (rim, grain, light, shadow)
  - top-left light and warm brown right-down shadows
  - no outlines
  - rigid-piece puppet animation
  - brass pins
  - torn white cores
  - hand-lettered fonts
  - the paper-strip HUD
- **Re-theme by changing materials, not technique:**
  - **Winter:** white felt `#e8ecef`, blue tissue, silver-foil gems.
  - **Ocean:** blue crepe paper with wavy torn edges, sand-coloured kraft, shell buttons.
  - **Sci-fi:** silver card, black construction paper, foil stickers (keep the cream rim).
- **Palette swaps:** keep one warm base paper (~25%), one cool large material (felt/denim), and 2–3 saturated accents reserved for actors. The shadow colour stays a warm dark brown.
- **New character types:**
  - Start from a silhouette made of 3–8 overlapping pieces.
  - Give each type one dominant colour plus cream.
  - Add one "material story" detail (tape patch, stitch, torn cap, foil).
- **Other genres:** side-scrollers work well. Keep the same shadow offsets, put sheets in parallax layers, and give each depth layer a larger shadow offset and blur. Board and puzzle games can use whole cards and tokens as cut pieces.
- **Resolution:** if sprites are shown larger than about 4 px per unit, raise K to 6–8, and scale the rim and blur with it (they are defined in world units).

## Performance notes

- **Init (about 1 s in the reference):**
  - Every piece is baked: rim dilation is about 24 drawImage calls per piece, plus grain, light and blur.
  - Every animation frame is baked (about 90 puppet frames).
  - Props and decals are baked.
  - Five 512² material lookup textures and the 2116-leaf carpet are built.
- **Ground** is the hot spot:
  - Per-pixel shading evaluates 5 signed-distance layers with edge noise and shadow look-ups.
  - Chunks are 256 units, at most 2.5 px per unit, rendered asynchronously by a generator that yields every two rows and every 128-row band so the frame rate holds while the camera moves.
  - Field nodes outside the chunk are evaluated with identical maths, so borders are seamless.
- **Per frame:**
  - Only `drawImage` of chunks and baked sprites, plus blob shadows, a few additive glows, particles (paths, cheap) and a cached vignette.
  - A crowd of 300 puppets is fine, because each is 1–2 blits.
- **Budget:** keep particle counts modest (a kill spawns 8–18 scraps). Never call `filter: blur` or `dilate` per frame. The starter.js preview bakes everything on the first call and then runs in about 1 ms per frame.

## Copy-paste prompt

```text
Build my game <X> in the "Paper World" cut-paper diorama style (Canvas 2D, procedural, no image assets):
- Everything is cut from craft materials on a table: kraft paper #a87c54, corrugated card #c49c6c, felt #607c46, cut leaves, torn newsprint #ddd5c0.
- Every object = separate flat cut pieces. Each piece: flat fill, 0.3-0.6 unit cream sticker rim #fbf6ea (dilated silhouette),
  paper grain texture source-atop, a diagonal light gradient (cream top-left -> brown bottom-right, alpha ~0.1), and its own blurred shadow.
- NO dark outlines. Edges come from the cream rim and warm brown shadows rgb(48,26,12) that always fall right-down.
- Shadow offsets grow with height: parts (0.42,0.55), puppets (0.9,1.1) blur 0.7, ground sheets (1.4-1.7, 1.8-2.2) blur 1.5-1.9.
- Characters are jointed paper puppets: 6-9 rigid pieces rotating around pivots, brass split pins (#fff0b0->#d4ac4a->#8f6d24) on joints.
- Faces are cut-out holes showing glowing paper (#fffbe0 -> #ffe066 -> #ffa21e), offset so the dark cut edge shows top-left.
- Round forms = stacked flat lobes in 4 tones; two-colour pieces use a torn edge with a white paper core.
- Ground = stacked material sheets, each with offset shadow and darker side thickness; torn newsprint, stitched felt, leaf carpet; decals: buttons, paper flowers, tape, staples, confetti.
- Props are stand-up cut-outs on fold tabs with skewed projected cast shadows.
- Effects: two-sided flipping paper scraps, confetti, enemies tear in half on death.
- Palette is muted craft colours (pumpkin #e57d2c, aubergine #6e3c6d, mustard #d6a43a, leaf #76a54e, teal #36a596). No black, no neon.
- Fonts: Patrick Hand (body), Gochi Hand (numbers), Caveat Brush (titles) with cream sticker outlines; HUD = paper strips with cream rim, notebook paper, washi tape.
- Bake all pieces, frames and ground once; per frame only drawImage. Warm brown vignette on top.
```
