# Starry Night — Game Art Style Spec

> A living Van Gogh night painting: every surface is thick, swirling impasto brush strokes in ultramarine, viridian and cadmium yellow.

The whole scene looks like a freshly painted post-impressionist canvas at night (think *The Starry Night* and *Café Terrace at Night*). Meadows, wheat fields, paths and ponds are made of thousands of short, thick, directional dabs that follow swirling flow fields; characters are painted stroke by stroke with dark prussian-blue contours; every light source radiates concentric rings of glowing yellow strokes. The UI is a museum: gilded frames, brush-stroke bars and little framed paintings as cards. The module's main character has a round orange gourd head with a carved glowing face and an ultramarine coat; the creatures are violet-and-cream root bulbs with leafy tops, pale turquoise floating spirits and a large plum-and-umber colossus with glowing orange cracks.

## At a glance

| | |
| --- | --- |
| Family | Traditional media · Impasto oil painting |
| Mood | dreamy, vibrant, nocturnal, restless, artful |
| Best for | atmospheric night adventures, top-down action with a free camera, art/museum themes, night exploration |
| Renderer | Canvas 2D, fully procedural, no image assets |
| Pixel art | No – smooth, native resolution; sprites baked at 3 px per world unit |
| Complexity | 8/10 – every new asset is built from many oriented brush strokes; keeping it readable against the busy ground takes tuning |
| Fonts | Cinzel (600/800), Caveat Brush (400), Alegreya italic (500) |
| Key colours | `#141c30` night under-painting, `#2e5944` viridian meadow, `#866c2a` wheat ochre, `#3d4180` violet path, `#26409a` ultramarine, `#ffd040` cadmium, `#fff6c8` star white, `#111733` prussian contour |

## When to use it

- **Good fits:** top-down projects with a free-roaming camera (the infinite painted landscape shines), atmospheric night adventures, art-themed projects, slow to mid-paced action where the viewer has time to enjoy the canvas.
- **Works with care:** dense crowds of creatures – at 100+ figures the screen becomes a carpet of strokes; strong contours and creature colours that contrast with the ground are mandatory.
- **Bad fits:** competitive shooters and precision platformers (stroke-broken silhouettes blur exact shapes), UI-heavy strategy (the busy ground fights with dense UI), scenes that need hundreds of distinct tiny units, very low-end devices (long bake times).
- **Why:** the look comes from visual *texture density*. Everything is busy by design; the project must tolerate a high-frequency background.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Night under-painting | `#141c30` | Clear colour, dark base behind ground strokes |
| Prussian contour | `#111733` | Outline strokes of the main character and many props |
| Meadow viridian | `#2e5944` | Meadow mid tone – the dominant ground colour |
| Meadow light | `#70944e` | Brightest meadow strokes |
| Forest black-green | `#142a20` | Forest / dark grass |
| Wheat ochre | `#866c2a` | Wheat field mid tone |
| Wheat light | `#bc9a3e` | Brightest wheat strokes |
| Path violet | `#3d4180` | Roads and paths |
| Pond blue | `#26579c` | Water |
| Ultramarine coat | `#26409a` | Main character's clothing |
| Cobalt light | `#4a76cc` | Cloth highlights, speed smear |
| Gourd orange | `#d86c1e` | Main character's head mid tone |
| Scarlet | `#c8341e` | Scarf, red bar, alert vignette |
| Cadmium yellow | `#ffd040` | Eyes, impact dabs |
| Chrome yellow | `#ffe070` | Halo rings, stars, clock digits (`#ffe27a`) |
| Star white | `#fff6c8` | Hottest light centres |
| Root violet | `#763896` | Small root creature, top half |
| Root cream | `#e2d09a` | Small root creature, bottom half |
| Ghost turquoise | `#a2d0d2` | Fast floating creature |
| Frame gold | `#d8aa48` | Gilded UI frames |

**Ground material ramps** (6 steps dark → light, from the module's `MATS`):

| Material | Ramp | Accents (12–14 % of pass-2 strokes) |
| --- | --- | --- |
| Wheat | `#3c2e18 #54421e #6c5624 #866c2a #a08232 #bc9a3e` | `#2e3e70 #a65e28 #4e5a28` |
| Meadow | `#1a3430 #23463c #2e5944 #3c6a48 #527e4a #70944e` | `#2e4a86 #8a8a3a #3a6a7a` |
| Path | `#1c1e44 #262a5a #31356c #3d4180 #4c4f94 #6264a8` | `#6a4f8e #2c4f72 #7a6a5a` |
| Forest | `#08120f #0e1d18 #142a20 #1b3828 #24462f #305639` | `#1a2650 #3a4a24 #0e2a36` |
| Pond | `#10244e #163268 #1d4384 #26579c #3270ae #4a8fbc` | `#78c0c0 #c6d2a0 #e8c850` |

**Character ramps:** coat `#141d52 #1d2c78 #26409a #3157b4 #4a76cc #7aa0e0`; gourd orange `#8e3a12 #b8521a #d86c1e #ec8a28 #f6aa3c #fcd06a`; leaf `#163a2a #1f5a3a #2f7a4a #4a9a52 #80bc5c`; root violet `#34124c #55206f #763896 #985ab6 #c28cd8`; cream `#9c8656 #c4ad78 #e2d09a #f4e9c2 #fffbe8`; ghost `#3d64a6 #6e9ec8 #a2d0d2 #cbece4 #f2fbf4`; colossus plum `#1c1220 #2e1c30 #46284a #603a62 #7e5480 #a27aa4`, umber `#22160e #35231a #4c3322 #664630 #82603e #a07c52`; carved glow `#4a1206 #ffb52e #ffe070 #fff6c8`.

**Rules**

- Cool colours (blues, violets, greens) own ~85 % of the screen. Warm yellows/oranges are *light*: the main character, lanterns, windows, collectibles, eyes, impacts.
- Never a flat colour: neighbouring strokes mix 2–4 steps of the same ramp; a macro fbm (scale 250 units) shifts the ramp index by up to ±1.6 so fields have large lighter and darker patches.
- Complementary accent dabs (blue in wheat, ochre in meadow) are essential for the Van Gogh vibration.
- Outlines are never `#000`: `#111733`, `#1d1036`, `#0c0812`, `#1f3a78` (ghost), `#04080a` (cypress).
- Impact flash tint is warm `#ffc84a` drawn additively, never white.
- No neon, no pastel UI greys; UI uses golds (`#d8aa48`, `#fbe7a0`) and night blue (`#121a44`).

## Typography

- **Cinzel** 600/800 — titles, clock digits, card names. <https://fonts.google.com/specimen/Cinzel> — gold `#ffe27a`, embossed: `text-shadow: 0 2px 0 #3a2408, 0 0 14px rgba(255,200,80,.45)`, `letter-spacing: 2px`.
- **Caveat Brush** 400 — labels, bar text, counters, floating numbers. <https://fonts.google.com/specimen/Caveat+Brush> — cream `#fff0c8` / pale blue `#cfe4ff`, `text-shadow: 0 2px 0 #0a0e24, 0 0 6px rgba(6,8,26,.9)`.
- **Alegreya** italic 500 — descriptions. <https://fonts.google.com/specimen/Alegreya> — `#e6eefa`, `text-shadow: 0 1px 3px #000`.

```css
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Caveat+Brush&family=Alegreya:ital,wght@1,500&display=swap');
.timer { font: 800 36px/1 'Cinzel', 'Trajan Pro', Georgia, serif; color: #ffe27a; letter-spacing: 2px; text-shadow: 0 2px 0 #3a2408, 0 0 14px rgba(255,200,80,.45); }
.label { font: 400 23px 'Caveat Brush', 'Segoe Print', cursive; color: #fff0c8; text-shadow: 0 2px 0 #0a0e24, 0 0 6px rgba(6,8,26,.9); }
.desc  { font: italic 500 18px 'Alegreya', Georgia, serif; color: #e6eefa; text-shadow: 0 1px 3px #000; }
```

In-world floating numbers (canvas): `400 12px "Caveat Brush"` (emphasised 17 px), fill `#f6c43a` (emphasised `#f6602a`), outline `strokeText` `#121838` with lineWidth 2.8 (emphasised 3.6), then a highlight pass in `#fff4c0` (emphasised `#ffd27a`) at 75 % alpha offset by (−0.35, −0.45) units, rotated ±0.15 rad.

## Rendering technique

The look rests on **one primitive**, `stroke(ctx, x, y, angle, len, wid, col, rng, opts)`: an impasto dab drawn in local space as

1. a filled body: blunt rounded start (`quadraticCurveTo` bulge of 1.15 × half-width behind the start), slightly bent sides (random bend ±0.18 × length), a pointed tip at `len/2 + 0.35·halfWidth`;
2. a **light ridge**: a curve along the upper third, lineWidth 0.48 × half-width, colour mixed 30 % toward `#fff6dc` (`opts.hi`), alpha 0.8;
3. a **shadow edge**: a curve along the lower side, lineWidth 0.32 × half-width, colour × 0.58, alpha 0.75;
4. a **bristle groove**: a thin line (0.08 × width) at a random lateral offset, colour × 0.7, alpha 0.55.

Pipeline:

1. **Init (bake once):**
   - Ground stroke atlas: for each of 5 materials, 6 ramp colours + 3 accents × 3 variants, plus gold and flower dabs, painted onto one 1024 × 320 sheet at 3 px/unit, each trimmed to its painted bounding box, read back once with `getImageData`.
   - Characters: every animation frame is a separate painting (main character 3 idle + 4 walk, small root creature 2 colour variants × 4, floating ghost 3, large colossus 4) via `paint()` into CPU canvases (`willReadFrequently: true` – thousands of tiny anti-aliased paths raster faster there), then copied into a normal canvas for fast blitting; mirrored copies prebuilt.
   - Props (cypress ×3 heights, olive ×2, hay ×2, house ×2 with light positions, lamp, sunflowers ×2), FX sprites (halos, glow, pool, swirls, dabs, shadow, star, smear, trail), UI textures (async, one per `setTimeout` task).
2. **Ground chunks (256 × 256 world units, generated incrementally):** sample materials and flow vectors on a 5-unit grid, fill an `ImageData` with the bilinear under-painting × canvas weave, then splat ~6 000 atlas strokes in pure JS (rotated nearest-neighbour sampling with alpha-over), then decals, then `putImageData` in 160-px bands. The generator yields every 30 strokes so no frame hitches.
3. **Per frame, draw order:** ground chunks → ground overlay (additive light pools, appear swirls) → collectibles → shadows → y-sorted props/creatures/main character → orbiting objects → projectiles → particles → floating numbers → fireflies (additive) → screen varnish vignette → UI (DOM).
4. **Resolution:** not pixel art; ground at up to 2.5 px/unit (`groundResMax`), sprites at 3 px/unit (collectibles 6 px/unit) and scaled with smoothing.

## World and ground

The ground is an endless painted night landscape of five materials – wheat, meadow, path, forest, pond – each a field of thick oil dabs over a dark under-painting, each with its own stroke direction so regions read by direction as much as by colour.

- **Materials** from noise (world units): forest where `warped(x/760, y/760) > 0.6`, pond where another warped field `< 0.31` (kept ≥150 units from the start point), wheat where `fbm(x/470, y/470)` crosses 0.5, meadow elsewhere. Paths are the 0.5 iso-line of a large fbm (scale 980): distance to the line = `|p − 0.5| / |∇p|`, path where distance < 9–15 units (≈24 units wide), with the tangent of the iso-line as its flow.
- **Flow fields** (`fieldAt`): curl of fbm at scale 120 (`v0,v1`) and 52 (`v2,v3`) – rotate the gradient by 90° (`(-gy, gx)/|g|`) so strokes swirl around noise blobs, producing the Starry-Night whorls.
  - wheat: `(v0·0.5, −1 + v1·0.5)` – mostly vertical stalks;
  - meadow: `(v0, v1)` – big swirls;
  - path: path tangent + 0.22 · `(v0, v1)` – flowing along the road;
  - forest: `(v2, v3)` – tight small swirls;
  - pond: `0.85·(v2,v3) + 0.3·(v0,v1)`.
  Every stroke adds ±0.15 rad jitter.
- **Stroke sizes per material** (length L × width W, bend): wheat 9 × 2.5 (0.55), meadow 8 × 2.7 (0.45), path 11 × 2.5 (0.22), forest 6.5 × 2.6 (0.45), pond 10 × 2.5 (0.62).
- **Two passes:** pass 1 on a jittered grid of 4.3 units, one stroke per cell, ramp index `floor(rand·4 + bias − 0.4)` at scale 1.12 × (0.8–1.2); pass 2 on 6.2 units, kept with probability `pB` (wheat 0.75, meadow 0.62, path 0.55, forest 0.4, pond 0.72), index `2 + floor(rand·3 + bias)`, `acP` 12–14 % accent strokes. `bias = (macro − 0.5) · 3.2`, macro = `fbm(x/250, y/250)`.
- **Material per stroke** is chosen randomly by the interpolated weights, so borders dissolve into interleaved strokes instead of hard edges.
- **Under-painting:** per-material dark colours (wheat `rgb(46,34,20)`, meadow `rgb(17,32,28)`, path `rgb(17,17,40)`, forest `rgb(6,11,10)`, pond `rgb(10,21,50)`) × (0.8 + 0.45 · macro), with a 4-pixel canvas weave: alternate 4 × 4 cells darken their edge rows or columns to 0.87.
- **Decals:** path lamp reflections (cell 26, 32 %: 2–4 gold dabs side by side across the path), meadow wildflowers (cell 12, 20 %: 2–3 tiny 3 × 2 dabs in `#f4efd8`, `#ffd84a`, `#7aa8e8`), wheat ears (cell 9, 14 %: vertical gold dabs), poppies (cell 34, `#e0582a`), pond whorls (cell 70: 18–26 strokes on a 1.6–2.4-turn spiral, radius 12–20, squashed 0.62, gold in the centre), star reflections (cell 40: 5 gold dabs in a ring).
- **Runtime ground overlay:** warm additive light pools under lamps, windows, the main character and orbiting lanterns (see Atmosphere), and paint swirls where creatures appear (see Effects).
- All randomness is seeded per world cell (`hashInt(cx, cy, seed)`), so neighbouring chunks agree and borders are seamless.
- The ground is never animated – the painting itself is static.

## Characters

All characters are painted offscreen at 3 px/unit with `paint()`: a polygon gets a flat base fill, then a jittered grid of strokes (spacing 1.25–2.0 units, length 3.4–5.4, width 1.35–2.05) clipped to the shape, each stroke oriented by a form-describing angle function (meridians on round heads, vertical on cloth, tangential around blobs) and coloured by ramp picking with light from the upper left (`base − dx·1.5 − dy·1.3` ± random jitter). A row of dark strokes forms the contour, 30–55 % thicker on the down-right shadow side. Limbs are single `seg()` strokes. Every animation frame is a separate painting with a new seed, so the strokes "boil" gently between frames.

**Main character** (34 × 42 unit canvas, anchor (17, 37) = feet; ≈18 wide × 30 tall) – a figure with a big round orange gourd head with a carved glowing face, a long ultramarine coat and a red scarf:

- Legs: two `seg()` strokes 2.5 wide in `#2b2238`, boots 3.6 × 2.0 strokes in `#1e130e`; walk pose swings feet ±1.9 units and lifts the forward one 1.3.
- Coat: a Catmull-Rom spline polygon from shoulders (y −16) widening to a hem at y −4, painted with `sp 1.55, len 4.2, wid 1.5`, vertical strokes (`−π/2 + x·0.07`), coat ramp picked by `2.2 − x·0.28 ± 0.8` (lit from the left), prussian contour 1.0 × 3. Two yellow button dabs `#f0c040`.
- Scarf: four alternating `#c8341e`/`#e8502a` dabs at the neck plus a fluttering tail behind (two segs).
- Head: 44-point ellipse rx 8.8, ry 7.4 centred at (0.6, −22.6) with 3.5-lobe ribbing, strokes follow the **meridians** of the sphere (`merid()` computes the slope of the meridian through each point), orange ramp by `2.6 − dx·1.5 − dy·1.3`; four darker rib lines (`polyStroke`, 0.75 wide); contour 1.1 × 3.2; green stem and leaf.
- Face looks to +x: carved triangles for eyes (size 1.7, tall 1.25) and nose, a zig-zag 13-point mouth. `carved()` = dark rim offset (0.35, 0.4) `#4a1206`, fill `#ffb52e`, 62 % inset `#ffe070`, 30 % inset `#fff6c8`.
- It carries its own light halo (see Atmosphere), so it is always the brightest point on screen.
- Facing: mirror the sprite; frames re-painted with new seeds.

**Small creature** (root bulb, 30 × 34) – a violet-and-cream root bulb with a leafy top and angry yellow eyes:

- A 40-point bulb, narrower at the bottom; strokes run around the bulb (`atan2(dx/rx², −dy/ry²)·0.7`), painted with `sp 1.25, len 3.4, wid 1.4`.
- The top half is violet, the bottom cream, with a wavy split line `0.5 + 0.08·sin(x·0.9)`. A thin root tail (`#8a6a48`, 0.8 wide) hangs below.
- Four leaf strokes on top (6.4 × 2.5, `#1f5a3a`/`#2f7a4a`) with a light `#80bc5c` vein stroke each; contour `#1d1036` 0.95.
- Angry eyes: yellow dabs `#ffcf40` 2.4 × 1.6 with dark pupils `#3a0a10` and slanted brows `#1d0f2a`; a short dark mouth stroke `#2a0c22`.
- Two colour variants (violet/cream and magenta/gold).

**Fast creature** (floating ghost, 30 × 32) – a pale turquoise spirit with a wavy tail:

- A spline body with a wavy tail whose control points move with the phase; two reaching arm strokes behind it.
- Strokes swirl around the head centre (`atan2 + π/2 + 0.35`); ghost ramp brightest in the centre; contour `#1f3a78` 0.8.
- Flat dark ellipses for eyes and an "O" mouth (`#0d1430`, inner `#26407e`, tiny pale catch-lights) – the only non-stroke details, for instant readability.
- Drawn at alpha 0.9, hovering ±1.2 units.

**Large creature** (colossus, 66 × 64) – a hulking plum-and-umber root giant with glowing orange cracks:

- A 44-point blob rx 17.5, ry 16.5 painted with bigger strokes (`sp 2.0, len 5.4, wid 2.05`): plum above, umber below, turquoise rim light `#6fa4b0`/`#b4d0c4` on the upper-left edge; contour `#0c0812` 1.6 × 4.4.
- Glowing cracks: three passes of `polyStroke` per crack (dark 2.0 `#1a0c08`, orange 1.15 `#ffb030`/`#ff9a20`/`#ffc84a`, white-hot 0.45 `#fff2b0`) plus a 7-stroke glowing core; an additive `glow` sprite pulses on the core.
- Root arms (2 segs + 3 finger strokes), crown of 5 leaves (up to 11 units long, 3.8 wide), thick legs (6.4 wide) with root toes, yellow eyes `#ffd040` under heavy dark brows, a dark mouth with an orange inner line.

**Readability against the busy ground:** every character gets (1) a dark painted contour, (2) a painted shadow, (3) a colour family the ground does not use (violet, cream, pale turquoise, plum), (4) yellow eyes. Stroke direction always describes the form, never the ground flow.

## Props

Props are y-sorted sprites painted once with the same `paint()` / `seg()` / `stroke()` tools as the characters, each standing on a painted shadow. They follow the ground materials: tall cypresses in forests (and rarely meadows), olives in meadows, haystacks and sunflowers in wheat, houses and lamps near paths.

- **Cypress** – the signature flame-shaped tree: 60, 70 or 82 units tall, width `7.6·sin(π·(0.16+0.86t))^0.75 · (1 − 0.25t)` with a 12 % ripple, a wobbling centre line (`2.4·sin(4.6t)·t`); strokes 7.5 × 2.0 (spacing 1.9) nearly vertical, swaying `0.6·sin(t·11 + x·0.35)`; ramp `#081210 #0e2018 #153222 #1e442c #2c5838 #3f6e40` with 8 % `#22355f` blue dabs and 4 % `#6f7c34` olive dabs on the lit side; contour `#04080a` 1.3 × 4.5; a short trunk `#2a1a14`. Becomes 45 % transparent when the main character walks behind it. Shadow 8 × 2.6.
- **Olive tree:** a twisted trunk of segs (`#3a2c2a #5a4636 #7a5e44`) + 3 foliage blobs (17 × 10.5 and two 9 × 6.5) with radial-tangential strokes 4.4 × 1.9 in sage greens `#1e2e2c … #94a482` and 10 % `#4a6a8c` blue dabs; contour `#142028` 1.1, skipped on the lit side. Shadow 16 × 4.5.
- **Haystack:** a dome 28 × 22 units (and a 0.8-scale variant), strokes 5.6 × 1.8 radiating from below the base, ramp `#5a3e16 … #f0d062`, 30 % `#3a4a7a` blue strokes on the shadow (right) side, contour `#2a1a0a` 1.2, six loose straw strokes `#f0d062` at the foot.
- **Sunflowers:** clumps of 2 or 3 stems 20–30 units tall (leaf greens, two leaf strokes 4.4 × 2.2 each), heads of 13 petal strokes 3.0 × 1.3 in `#e8a020/#f6c030/#ffd84a` around a dark seed head `#4a2e14` with `#7a5020`/`#2a1a0a` dabs, partial contour `#5a3a10`.
- **House:** cream front wall (`#a88a5a … #f6ecc8`, strokes alternating horizontal/vertical, 8 % `#6a7aa8` dabs), blue side wall (`#2e3c6a … #5e6c9a`, vertical strokes), red tiled roof (`#7a2e1e … #f09a58`, near-horizontal strokes), small chimney; prussian contours 1.0 × 3.2. Two or three lit windows: flat `#ffc93a` fill, a `#fff0a0` highlight stroke, cross bars `#3a2a20`; variant 0 has a dark blue door `#1a2450` with a gold handle line `#ffc84a`.
- **Street lamp:** a dark pole 27 units tall (`#141a2a`, highlight `#3a4a6a`), a trapezoid lantern head filled `#ffd24a` with a `#fff4c0` hot stroke and a small cap.
- **Light-emitting props:** houses and lamps return light positions that receive additive halos and ground light pools (see Atmosphere).
- **Placement:** keep props off paths and ponds and ≥95 units from the start point; cypress on a 46-unit grid (50 % in forest, 2.5 % in meadow), olive 110 (30 %, meadow only), hay 120 (36 %, wheat), sunflowers 85 (18 % wheat, 5 % meadow), houses 330 (50 %, within 70 units of a path, not in forest), lamps 120 (65 %, 15–22 units from the path centre).

## Effects and particles

All effects are made of the same paint dabs and strokes, pre-baked as small sprites.

- **Projectile (seed-shaped):** cream seed (7 × 5 units, fill `#f4e6c0`, contour `#3a2410`) rotated to its flight angle, preceded by a 16 × 4 unit trail made of an orange 15 × 2.2 stroke and a yellow 12 × 0.9 stroke, faded by a `destination-in` linear gradient.
- **Impact:** 3 paint dabs (4.6 × 1.9 units; one yellow/orange, two in the struck creature's colour set) with velocity 30–80, `vz` 20–60, gravity 240; when they land they lie squashed (scale y 0.6) and fade. Plus a 4-stroke additive star (`#fff6c8`/`#ffe070`, 8 units; 12 for large creatures) for 0.18 s.
- **Burst (creature vanishes):** 9 dabs (22 for large creatures, speed 75/110, size 1.8/2.6) and a paint swirl particle (3 spiral arms × 16 strokes in the creature's colours) expanding with outQuad and turning 3 rad over its life.
- **Vanish:** the sprite rises 3 units, scales to 1.2, alpha (1 − d)², with an additive warm `#ffc84a` flash for the first 40 %.
- **Collectibles:** small teardrop paintings (gold ramp `#c8641a #f0a020 #ffd84a #fff6c8`; large ones turquoise `#2a8a9a #5cc4c8 #a8ecdc #f4fff0`, 1.6× size) baked at 6 px/unit, bobbing ±0.5–1 unit, each inside a rotating small halo (additive, alpha 0.55 ± 0.15). On pick-up: 1 (large: 5) star sprites rising.
- **Orbiting objects:** small root lanterns (12 × 16 units: a violet-and-cream bulb with three leaves, carved glowing eyes and mouth, a dark wire handle) circling the main character, each with its own rotating halo (28 units, alpha 0.5).
- **Speed smear (dash):** 6 long parallel strokes in `#4a76cc`, `#a2d0d2`, `#f6aa3c`, `#26409a` (30 × 12 units) fading over 0.35 s, plus 4 blue/turquoise dabs flung backwards; 2 ghost copies of the main character at alpha 0.25/0.125.
- **Appear swirl:** a 3-arm spiral of 16 strokes per arm in the creature's colours, squashed to 0.55 height, spinning −5 rad/s while the creature grows out of the ground.
- **Gold celebration burst:** a gold swirl 44 units + 14 stars bursting radially; also a growing gold swirl under the main character.
- **Alert flash (main character struck):** a dab burst in red/orange/yellow/blue, an 18-unit star, the sprite flashed with additive warm tint, and the scarlet vignette (see Atmosphere).
- **Floating numbers:** Caveat Brush digits in `#f6c43a` / `#f6602a` with a `#121838` outline (see Typography).

## Atmosphere and lighting

The scene is a night painting: dark ultramarine under-painting, cool colours everywhere, and warm light that exists only as additive, slowly rotating rings of yellow strokes.

- **Halos:** `haloSprite(px, colours, rings)` = radial gradient core (55 % → 0) + rings `[radius, alpha, strokeLen, strokeWidth]` (fractions of the radius) of tangential strokes. Gold halo (160 px, 5 rings, `#fff6c8 → #ffe070 → #ffc83a → #f0a030 → #d08a26`) for the main character, lamps and lanterns; cool halo (128 px) for large collectibles; small halo (64 px) for collectibles and fireflies. Always `globalCompositeOperation = 'lighter'`, slowly rotating (0.35–1.2 rad/s).
- **Main character light:** two gold halos 44 and 72 units around the face, alpha 0.6 / 0.34 × pulse (0.85–1.0), rotating +0.6 and −0.4 rad/s, plus a flickering 16 × 14 glow at the carved face (`0.32 + 0.08 sin(11t) + 0.05 sin(23t)`) and a 36 × 14 warm pool on the ground.
- **Prop lights:** houses and lamps get additive halos of radius 13 × size, flickering `0.85 + 0.1 sin(7t) + 0.05 sin(17t)`.
- **Ground light pools:** `pool` radial sprite (rgba(255,200,90,0.5) → 0) 60 × 30 units per lamp/window at alpha 0.45, additive.
- **Shadows:** a baked sprite of 16 dark ultramarine strokes (`#0c1030`, `#141a44`) in an ellipse, drawn at alpha 0.62 (ghost 0.35), sized per object (main character 16 × 5.6, large creature ~35 × 12, cypress 8 × 2.6, olive 16 × 4.5, house 17 × 4).
- **Varnish vignette:** a rounded-rectangle band 13 % of the screen height, colour rgb(12,10,30) (`#0c0a1e`), alpha `t² · 0.62`, plus loose dark edge strokes (22 × 6 units, alpha ≤ 0.5). Alert version in rgb(200,52,24) with scarlet strokes, faded by `hurtT`. Baked once per screen size; only the 4 border strips are drawn.
- **Fireflies:** on a 130-unit world grid, 3 of 4 cells host a small halo (7–10 units) drifting ±14/±10 units and twinkling between alpha 0.25 and 0.7.
- **Grading:** no post-process filter – the night mood comes from the palette (cool colours ~85 % of the screen) and the dark under-painting; impact tints are warm `#ffc84a`, never white.

## UI

The UI is a gallery: every panel and bar sits in a gilded frame, fills are brush-stroke textures, and cards are little framed night paintings.

- **Gold frame** (`goldFrame`): 9 concentric `strokeRect` bands across the thickness t – `#2a1c06 8 %, #7a5414 12 %, #d8aa48 14 %, #fbe7a0 6 %, #b8862c 16 %, #6a4610 8 %, #e6c068 14 %, #8a6018 12 %, #3a2808 10 %` – plus gold beads (radial gradient `#fff4c0 → #d8aa48 → #5a3a0c`) every 0.22 t along the middle and 8-petal corner rosettes. Used as a CSS `border-image` (slice 30).
- **Bars:** textures of horizontal brush strokes (`strokeBar`: 16–30 px long, 5–8 px wide) – track `#0e1638 #16224e #1d2c6a #26408a`, gold bar `#c88a1c … #fff0a8`, red bar `#a8281a … #ffb060`; the fill has a ragged painted right edge (mask of 9 random-length strokes).
- **Clock panel:** a small night painting (swirling blue strokes + 2 stars) in a 22-px gold frame; "22:09" in Cinzel 800 36 px `#ffe27a`, label in Caveat Brush 18 px `#cfe4ff`.
- **Counters:** Caveat Brush digits in cream `#fff0c8` with a dark `#0a0e24` drop shadow, beside small painted icons (e.g. a scarlet `#d0341e` heart).
- **Cards:** 232 × 304 px framed night paintings (strokes swirling around a centre, darkened lower half), icon 112 px painted with the same strokes inside a gold halo, title Cinzel 19 px gold, description Alegreya italic 18 px. Overlay behind cards: `radial-gradient(ellipse at 50% 45%, rgba(20,28,70,.35), rgba(6,6,20,.82) 75%)`. Hover lifts the card 8 px and scales it 1.02.
- **Icons:** painted at 100 × 100 with the same `paint()`/`stroke()` (heart, root bulb, seed, basket…), stroke sizes 3–6 px.

```css
.panel { background: #121a44; color: #f6e6b0; font-family: 'Cinzel', Georgia, serif;
  border: 9px solid #d8aa48; border-image: linear-gradient(#fbe7a0, #b8862c 40%, #6a4610 60%, #e6c068) 9;
  box-shadow: 0 6px 16px rgba(0,0,0,.5); }
.bar { position: relative; height: 20px; outline: 4px solid #d8aa48; box-shadow: 0 3px 10px rgba(0,0,0,.55);
  background: repeating-linear-gradient(90deg, #16224e 0 18px, #1d2c6a 18px 30px, #0e1638 30px 44px); }
.bar > .fill { height: 100%; transition: width .15s;
  background: repeating-linear-gradient(90deg, #d0401e 0 16px, #ea6028 16px 28px, #f6883a 28px 38px, #a8281a 38px 50px);
  clip-path: polygon(0 0, 100% 0, calc(100% - 6px) 30%, 100% 55%, calc(100% - 5px) 100%, 0 100%); }
.timer { font: 800 36px/1 'Cinzel', serif; color: #ffe27a; letter-spacing: 2px; text-shadow: 0 2px 0 #3a2408, 0 0 14px rgba(255,200,80,.45); }
.label { font: 400 23px 'Caveat Brush', cursive; color: #fff0c8; text-shadow: 0 2px 0 #0a0e24, 0 0 6px rgba(6,8,26,.9); }
.card  { width: 232px; min-height: 304px; padding: 36px 26px 30px; color: #f6e6b0; box-shadow: 0 12px 26px rgba(0,0,0,.65); }
.card:hover { transform: translateY(-8px) scale(1.02); }
```

For the real look, bake `goldFrame()` and `strokeBar()` into canvases at startup and use `canvas.toDataURL()` as `border-image` / `background` (that is what the module does).

## Motion and animation

- **Main character:** 4 walk frames (phase `p/4·2π`: leg = sin, bob = −|cos|·0.7, arm = −sin, scarf flutter = cos), switched by distance walked; 3 idle frames at 3.5 fps plus a sine bob of 0.4 units (2.4 rad/s).
- **Small creature:** 4 frames (legs ±1.7, bob −0.8, body tilt ±0.07 rad, leaves ±0.12 rad). **Fast floating creature:** 3 frames at 5 fps, hover `sin(3t)·1.2`. **Large creature:** 4 frames at a slower rate (lift ±2.4, arm swing ±1.2).
- **Appear:** stretch from 35 % to 100 % height (outQuad), width 1.25 → 1, alpha `smoothstep(0.2, 0.9)`, with a paint swirl beneath spinning −5 rad/s.
- **Impact flash:** additive warm tint copy, alpha `min(0.55, flash·0.9)`.
- **Lights:** halos rotate 0.35–1.2 rad/s; face glow flickers `0.32 + 0.08 sin(11t) + 0.05 sin(23t)`; collectibles pulse with `sin(5t)`.
- **Floating numbers:** pop 0.55 → 1.2 in the first 12 % of life, shrink to 1.0, rise 6 units, fade at `life·2.6`.
- The painting itself is static; motion comes from characters, rotating halos and drifting fireflies. Never animate the ground strokes (too expensive and visually exhausting).

## Do and don't

**Do**

- Build *everything* from the same stroke primitive – ground, characters, props, halos, UI bars, icons.
- Give every ground material its own flow field and stroke size so regions read by direction, not only by colour.
- Outline characters with dark contour strokes, 30–55 % thicker on the shadow side.
- Make light warm, additive and slowly rotating – the only saturated yellow on screen.
- Bake strokes into offscreen canvases (atlas, sprites, chunks); only blit per frame.
- Seed all randomness per world cell / per sprite so repaints are identical.
- Frame UI elements like paintings in a gallery.

**Don't**

- Don't leave flat fills or smooth gradients as visible surfaces – base fills must be covered by strokes.
- Don't use thin vector outlines or pure black.
- Don't call thousands of `stroke()` per frame.
- Don't give creatures colours that exist in the ground beneath them (no green creature on the meadow).
- Don't use white impact flashes or clean sans-serif fonts.
- Don't orient all strokes the same way or make ground strokes thinner than ~2 world units.
- Don't animate the ground.

## Implementation recipe

1. Set up a camera where the screen shows 360 world units vertically; scale = `canvasHeight / 360`.
2. Implement `stroke()` exactly as in the Code section; test it on a dark canvas – it must look like a thick oil dab with a ridge.
3. Implement `paint(polygon, opts)` (base fill → clipped jittered grid of strokes → `contour()`), `seg()` and `polyStroke()`.
4. Define 6-step ramps for each material and character; write `rampPick(ramp, value)`.
5. Paint each character frame into an offscreen canvas at 3 px/unit: limbs as `seg()`, bodies as `paint()` with a form-following angle function and a light term (`base − dx·1.5 − dy·1.3`), eyes as yellow dabs or `carved()` holes. Bake 3–4 frames per character with different seeds.
6. Paint props the same way (cypress, olive, haystack, sunflowers, house, lamp) and record the light positions of windows and lamps.
7. Build a ground stroke atlas (per material: 6 ramp colours + 3 accents × 2–3 variants).
8. Write `fieldAt(x, y)` returning material weights and flow vectors (curl of fbm at 120 and 52 units, path tangent, macro brightness).
9. For each ground chunk (or, for a fixed-size world, once): fill the under-painting, run pass 1 (cell 4.3) and pass 2 (cell 6.2) of atlas strokes along the material's flow, then decals. Do it in a generator spread across frames.
10. Bake halo, glow, pool, shadow, star, dab, trail and swirl sprites.
11. Per frame: blit ground, light pools, shadows, y-sorted characters and props, then additive halos for every light, projectiles, particles, numbers, fireflies, vignette.
12. Build the UI: bake `goldFrame()` and `strokeBar()` to data URLs and use them in CSS; Cinzel for numbers, Caveat Brush for labels.
13. Verify readability with a dense crowd of creatures on every ground material; boost contours or creature brightness where they sink in.

## Code

The core techniques below are ported from the module and run stand-alone (Canvas 2D only). The complete runnable starter with main character, creatures, ground, halos and UI is [`starter.js`](starter.js); the full module is [`../../js/styles/vangogh.js`](../../js/styles/vangogh.js).

```js
// Helpers
const TAU = Math.PI * 2;
const rng = (seed) => { let a = seed >>> 0; return { next() { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; } }; };
const H = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rgb = (c, a) => (a === undefined ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`);
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const mul = (c, f) => c.map((v) => Math.min(255, v * f));

/** One impasto dab: body, light ridge, shadow edge, bristle groove. */
function stroke(ctx, x, y, ang, len, wid, col, r, o = {}) {
  const hl = len * 0.5, hw = wid * 0.5, b = (o.bend ?? (r.next() - 0.5) * 0.36) * len;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  if (o.a !== undefined) ctx.globalAlpha = o.a;
  ctx.beginPath();
  ctx.moveTo(-hl, -hw * 0.85);
  ctx.quadraticCurveTo(0, -hw * 1.25 + b, hl, b * 0.12 - hw * 0.14);
  ctx.lineTo(hl + hw * 0.35, b * 0.12); ctx.lineTo(hl, b * 0.12 + hw * 0.14);
  ctx.quadraticCurveTo(0, hw * 1.25 + b, -hl, hw * 0.85);
  ctx.quadraticCurveTo(-hl - hw * 1.15, 0, -hl, -hw * 0.85);
  ctx.fillStyle = rgb(col); ctx.fill();
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-hl * 0.88, -hw * 0.32); ctx.quadraticCurveTo(0, -hw * 0.5 + b, hl * 0.72, b * 0.12 - hw * 0.08);
  ctx.lineWidth = hw * 0.48; ctx.strokeStyle = rgb(mix(col, [255, 246, 220], o.hi ?? 0.3), 0.8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-hl * 0.95, hw * 0.6); ctx.quadraticCurveTo(0, hw * 0.86 + b, hl * 0.85, b * 0.12 + hw * 0.1);
  ctx.lineWidth = hw * 0.32; ctx.strokeStyle = rgb(mul(col, 0.58), 0.75); ctx.stroke();
  const v1 = (r.next() - 0.5) * hw * 0.9;
  ctx.beginPath(); ctx.moveTo(-hl * 0.55, v1); ctx.quadraticCurveTo(hl * 0.2, v1 * 0.8 + b * 0.9, hl * 0.95, b * 0.12 + v1 * 0.3);
  ctx.lineWidth = Math.max(0.05, wid * 0.08); ctx.lineCap = 'butt'; ctx.strokeStyle = rgb(mul(col, 0.7), 0.55); ctx.stroke();
  ctx.restore();
}
```

```js
// Painting a region: base fill, clipped jittered grid of strokes, painted contour.
const pathOf = (P) => { const p = new Path2D(); p.moveTo(...P[0]); for (const q of P.slice(1)) p.lineTo(...q); p.closePath(); return p; };
function inPoly(P, x, y) { let ins = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) ins = !ins; } return ins; }
const rampPick = (pal, v) => pal[Math.max(0, Math.min(pal.length - 1, Math.round(v)))];

function paint(ctx, P, r, o) { // o = { base, sp, len, wid, jit, col(x,y,r), ang(x,y,r), edge:{col,w,l} }
  const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
  const path = pathOf(P), sp = o.sp, sy = sp * 0.75, jit = o.jit ?? 0.25;
  ctx.fillStyle = rgb(o.base); ctx.fill(path);
  ctx.save(); ctx.clip(path);
  for (let y = Math.min(...ys); y <= Math.max(...ys) + sy / 2; y += sy)
    for (let x = Math.min(...xs); x <= Math.max(...xs) + sp / 2; x += sp) {
      const px = x + (r.next() - 0.5) * sp, py = y + (r.next() - 0.5) * sy;
      if (!inPoly(P, px, py)) continue;
      stroke(ctx, px, py, o.ang(px, py, r) + (r.next() - 0.5) * jit * 2,
        o.len * (0.75 + r.next() * 0.5), o.wid * (0.8 + r.next() * 0.4), o.col(px, py, r), r);
    }
  ctx.restore();
  if (o.edge) contour(ctx, P, r, o.edge);
}
function contour(ctx, P, r, e) { // strokes along the edge, thicker on the down-right shadow side
  const cx = P.reduce((s, p) => s + p[0], 0) / P.length, cy = P.reduce((s, p) => s + p[1], 0) / P.length;
  const step = e.l * 0.6; let carry = r.next() * step;
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    if (L < 1e-6) continue;
    let d = carry;
    for (; d < L; d += step) {
      const x = a[0] + dx * d / L, y = a[1] + dy * d / L, ol = Math.hypot(x - cx, y - cy) || 1;
      const sh = ((x - cx) / ol) * 0.55 + ((y - cy) / ol) * 0.83;
      stroke(ctx, x, y, Math.atan2(dy, dx) + (r.next() - 0.5) * 0.2, e.l * (0.8 + r.next() * 0.4),
        e.w * (0.7 + 0.55 * Math.min(1, Math.max(0, sh * 0.5 + 0.5))), e.col, r, { hi: 0.16 });
    }
    carry = d - L;
  }
}

// Example: a round head with strokes following the sphere's meridians, lit from the upper left.
function paintHead(ctx, seed) {
  const r = rng(seed), cx = 0, cy = -22.6, rx = 8.8, ry = 7.4, head = [];
  const ORANGE = ['#8e3a12', '#b8521a', '#d86c1e', '#ec8a28', '#f6aa3c', '#fcd06a'].map(H);
  for (let i = 0; i < 44; i++) { const a = (i / 44) * TAU, k = 1 + 0.035 * Math.abs(Math.sin(a * 3.5)); head.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
  const merid = (x, y) => { const dy = y - cy, q = Math.sqrt(Math.max(0.06, 1 - (dy / ry) ** 2)), kk = (x - cx) / (rx * q); return Math.atan2(1, (-kk * rx * dy) / (ry * ry * q)); };
  paint(ctx, head, r, { base: ORANGE[2], sp: 1.3, len: 3.6, wid: 1.45, jit: 0.12, ang: merid,
    col: (x, y, q) => rampPick(ORANGE, 2.6 - (x - cx) / rx * 1.5 - (y - cy) / ry * 1.3 + (q.next() - 0.5) * 1.3),
    edge: { col: H('#111733'), w: 1.1, l: 3.2 } });
}
```

```js
// Ground: flow field from the curl of fbm + stamping pre-rendered stroke sprites along it (bake once).
const hashInt = (x, y, s) => { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return (h ^ (h >>> 16)) >>> 0; };
function perlin(x, y, s) {
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, f = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const g = (ix, iy, dx, dy) => { const a = ((hashInt(ix, iy, s) & 15) / 16) * TAU; return Math.cos(a) * dx + Math.sin(a) * dy; };
  const u = f(fx), v = f(fy), a = g(x0, y0, fx, fy), b = g(x0 + 1, y0, fx - 1, fy), c = g(x0, y0 + 1, fx, fy - 1), d = g(x0 + 1, y0 + 1, fx - 1, fy - 1);
  return (a + u * (b - a) + v * (c + u * (d - c) - a - u * (b - a))) * 1.414;
}
function fbm(x, y, seed, oct) { let a = 1, f = 1, t = 0, n = 0; for (let i = 0; i < oct; i++) { t += a * perlin(x * f, y * f, seed + i * 101); n += a; a *= 0.5; f *= 2; } return Math.min(1, Math.max(0, (t / n) * 0.5 + 0.5)); }
function curl(x, y, scale, seed) {
  const s = 1 / scale, n = fbm(x * s, y * s, seed, 2);
  const gx = fbm((x + 2) * s, y * s, seed, 2) - n, gy = fbm(x * s, (y + 2) * s, seed, 2) - n, m = Math.hypot(gx, gy) + 1e-9;
  return [-gy / m, gx / m]; // gradient rotated 90°: strokes circle around noise blobs -> swirls
}
function strokeSprite(L, W, bend, hex, seed, k = 3) { // one dab baked at k px per world unit
  const r = rng(seed), w = (L + W * 2) * k, h = (W * 2.2 + L * bend * 0.5 + 1) * k;
  const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h);
  const g = c.getContext('2d'); g.translate(w / 2, h / 2); g.scale(k, k);
  stroke(g, 0, 0, 0, L, W, H(hex), r, { bend: (r.next() - 0.5) * bend });
  return c;
}
// Meadow: L 8, W 2.7, bend 0.45, ramp #1a3430 #23463c #2e5944 #3c6a48 #527e4a #70944e
function paintMeadow(g, wWorld, hWorld, s /* px per unit */) {
  const pal = ['#1a3430', '#23463c', '#2e5944', '#3c6a48', '#527e4a', '#70944e'];
  const SPR = pal.map((c, i) => [0, 1].map((v) => strokeSprite(8, 2.7, 0.45, c, 100 + i * 2 + v)));
  g.fillStyle = 'rgb(17,32,28)'; g.fillRect(0, 0, wWorld * s, hWorld * s); // under-painting
  for (const [cell, base, span, sc, keep] of [[4.3, -0.4, 4, 1.12, 1], [6.2, 2, 3, 1, 0.62]]) {
    for (let cy = 0; cy < hWorld / cell; cy++) for (let cx = 0; cx < wWorld / cell; cx++) {
      const r = rng((cx * 73856093) ^ (cy * 19349663) ^ (cell * 1000));
      const x = (cx + r.next()) * cell, y = (cy + r.next()) * cell;
      if (r.next() > keep) continue;
      const bias = (fbm(x / 250, y / 250, 61, 2) - 0.5) * 3.2;          // macro light/dark patches
      const idx = Math.max(0, Math.min(5, Math.floor(base + r.next() * span + bias)));
      const [vx, vy] = curl(x, y, 120, 51), ang = Math.atan2(vy, vx) + (r.next() - 0.5) * 0.3;
      const spr = SPR[idx][(r.next() * 2) | 0], k = (s / 3) * sc * (0.8 + r.next() * 0.4);
      const co = Math.cos(ang) * k, si = Math.sin(ang) * k;
      g.setTransform(co, si, -si, co, x * s, y * s);
      g.drawImage(spr, -spr.width / 2, -spr.height / 2);
    }
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
}
```

```js
// Light halo: concentric rings of tangential strokes; draw additively and rotate slowly every frame.
function haloSprite(px, cols, rings) { // rings: [radius, alpha, strokeLen, strokeWidth] as fractions of R
  const c = document.createElement('canvas'); c.width = c.height = px;
  const ctx = c.getContext('2d'), R = px / 2, r = rng(px * 7 + cols.length);
  const g = ctx.createRadialGradient(R, R, 0, R, R, R * 0.5);
  g.addColorStop(0, rgb(H(cols[0]), 0.55)); g.addColorStop(0.5, rgb(H(cols[1]), 0.18)); g.addColorStop(1, rgb(H(cols[1]), 0));
  ctx.fillStyle = g; ctx.fillRect(0, 0, px, px);
  rings.forEach(([rad, al, len, wid], i) => {
    const rr = rad * R, n = Math.max(6, Math.round((TAU * rr) / (len * R * 0.85))), off = r.next() * TAU;
    for (let k = 0; k < n; k++) {
      const a = off + (k / n) * TAU + (r.next() - 0.5) * 0.12;
      stroke(ctx, R + Math.cos(a) * rr, R + Math.sin(a) * rr, a + Math.PI / 2 + 0.12, len * R * (0.8 + r.next() * 0.4), wid * R,
        H(cols[Math.min(cols.length - 1, i + (r.next() < 0.3 ? 1 : 0))]), r, { a: al * (0.7 + r.next() * 0.3), bend: 0.12 });
    }
  });
  return c;
}
const GOLD_HALO = haloSprite(160, ['#fff6c8', '#ffe070', '#ffc83a', '#f0a030', '#d08a26'],
  [[0.2, 0.9, 0.14, 0.07], [0.34, 0.75, 0.15, 0.065], [0.5, 0.55, 0.15, 0.06], [0.66, 0.38, 0.15, 0.055], [0.84, 0.22, 0.14, 0.05]]);
function drawCharacterLight(ctx, x, y, t) { // light around the main character's face; ctx in world units
  const pulse = 0.85 + 0.15 * Math.sin(t * 2.2);
  ctx.globalCompositeOperation = 'lighter';
  for (const [size, alpha, spin] of [[44, 0.6, 0.6], [72, 0.34, -0.4]]) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * spin); ctx.globalAlpha = alpha * pulse;
    ctx.drawImage(GOLD_HALO, -size / 2, -size / 2, size, size); ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
}
```

## Adapting it to your project

- **Keep fixed:** the stroke primitive and its proportions, painting by ramp picking, dark contour strokes, flow-field ground with per-material direction, additive rotating stroke halos for light, gold-framed museum UI, the night base with warm lights.
- **May change:** the landscape materials (e.g. snow `#c8d4e8` ramp with blue accents, sand, cobblestones painted as short curved arcs), the colour ramps (keep 6 steps, dark → light, and a complementary accent set), the characters (any shape: build a polygon, choose an angle function that describes its form – radial for blobs, vertical for cloth, meridians for spheres), the props (any object painted with `paint()`, contour and shadow).
- **Daytime variant:** lift the under-painting and ramps (sky blues `#6a9ad0`, warmer yellows) but keep contours dark and keep halos for the sun and collectibles; reduce vignette alpha to ~0.35.
- **Other views:** side-scrollers can paint backgrounds as large flow-field panels (sky whorls with curl at scale 200) and keep characters as sprites; card-based projects can use the framed-painting card and painted icons directly.
- **Mixing elements:** the characters work on other worlds if they keep their dark contours and shadows; the ground works under other characters only if those have strong outlines and colours absent from the ground.
- **Other resolutions:** keep stroke sizes in world units (ground width ≥ 2 units). For a camera showing more of the world, scale the stroke size up with it, or the canvas turns into noise.
- **New creatures:** pick a colour family absent from the ground, give it yellow eyes, a 0.8–1.6 contour, and a matching dab-burst colour set.

## Performance notes

- **Bake budget:** the module spends ~0.5–1.5 s at init (atlas, ~25 character frames, ~10 props, FX). UI textures are created asynchronously, one per `setTimeout`.
- **Chunks:** 256 × 256 units at ≤ 2.5 px/unit. Each chunk: ~4 000 grid samples (several fbm calls each) + ~6 000 stroke splats + decals. The module splats atlas strokes in pure JS into an `ImageData` (exact span solving per row, no per-pixel bounds tests) and yields every 30 strokes / 16 rows inside a generator, building chunks within a 5 ms per-frame budget. Buffers are pooled to avoid GC pauses.
- **CPU vs GPU canvases:** paint with many small paths on `willReadFrequently: true` canvases (software rasteriser, faster for this), then copy into a normal canvas before blitting every frame.
- **Per frame:** one `drawImage` per character or prop, ~2–5 additive rotated halos per light, cached vignette strips. 2–4 ms in the module with hundreds of creatures; the starter scene takes ~3 ms.
- **Hot spots:** large crowds (sprite count, not strokes), too many lights (each is 1–2 additive draws), re-baking anything per frame. Never call `stroke()` inside the frame loop except for a handful of particles – use baked dab sprites instead.
- **Static worlds:** if your world is finite, bake the whole ground once into a few large canvases instead of chunking.

## Copy-paste prompt

```text
Use the Starry Night art style (Van Gogh impasto oil painting at night) for my project:
- Everything is made of one brush-stroke primitive: a thick dab with blunt start, tapered tip,
  a light ridge (colour mixed 30% to #fff6dc), a shadow edge (colour x0.58) and a bristle groove.
- Night palette: under-painting #141c30, meadow ramp #1a3430..#70944e, wheat #3c2e18..#bc9a3e,
  paths #1c1e44..#6264a8 (violet), ponds #10244e..#4a8fbc; warm #ffd040/#ffe070/#fff6c8 only for light,
  the main character and collectibles. Outlines are dark strokes (#111733), never black lines.
- World: two passes of 8x2.7-unit strokes (cells 4.3 and 6.2 world units) stamped from pre-baked sprites
  along per-material flow fields (curl of fbm at 120 and 52 units = swirls; wheat vertical; paths along tangent),
  12-14% complementary accent dabs, macro fbm (250 units) shifting ramp index. Bake it, never per frame.
- Characters: paint each frame offscreen at 3 px/unit: polygon base fill, clipped jittered grid of strokes
  (spacing ~1.3, length ~3.6, width ~1.45) oriented by the form, ramp-picked with light from the upper left,
  dark contour strokes thicker on the shadow side, yellow eyes / glowing carved faces. 3-4 frames each.
- Creatures use colours absent from the ground (violet/cream, pale turquoise, plum with glowing cracks).
- Props: flame-shaped cypresses, olive trees, haystacks, sunflowers, cream houses with lit windows, lamps.
- Atmosphere: additive halos of concentric tangential yellow strokes, slowly rotating, warm ground light pools,
  stroke shadows, dark varnish vignette band (13% of height), drifting firefly halos.
- Effects are paint dabs, 4-stroke stars and 3-arm paint swirls; impact flash is warm #ffc84a, never white.
- UI: gilded 9-band gold frames, brush-stroke bars, Cinzel 800 gold numbers, Caveat Brush labels,
  Alegreya italic descriptions, cards as small framed night paintings.
- Performance: bake strokes into canvases at init/chunk build; per frame only drawImage + a few additive halos.
```
