# Starry Night — Game Art Style Spec

> A living Van Gogh night painting: thick, directional impasto strokes in ultramarine, viridian and cadmium yellow that follow every form.

The whole scene looks like a freshly painted post-impressionist canvas at night (think *The Starry Night*, *Wheat Field with Cypresses* and *Café Terrace at Night*). Meadows, wheat fields, paths, forests and ponds are built from three sizes of thick oil dabs – big calm strokes everywhere, smaller bright ones gathered only along designed edges – and every stroke follows the form of its region. Characters are painted stroke by stroke with prussian-blue contours and move in held, hand-painted poses; light sources radiate concentric bands of yellow and pale turquoise comma strokes. The UI is a museum: gilded frames, brush-stroke bars and little framed paintings as cards. The module's main character has a round orange gourd head with a carved glowing face, an ultramarine coat and a red scarf; the creatures are violet-and-cream root bulbs with leafy tops, hooded pale-turquoise wisps with swirl tails and a hunched plum-and-umber colossus with glowing orange cracks.

## At a glance

| | |
| --- | --- |
| Family | Traditional media · Impasto oil painting |
| Mood | dreamy, vibrant, nocturnal, restless, artful |
| Best for | atmospheric night adventures, top-down action with a free camera, art/museum themes, night exploration |
| Renderer | Canvas 2D, fully procedural, no image assets |
| Pixel art | No – smooth, native resolution; sprites baked at 3 px per world unit and trimmed |
| Complexity | 8/10 – every new asset is built from many oriented brush strokes, every pose is its own painting |
| Fonts | Cinzel (600/800), Caveat Brush (400), Alegreya italic (500) |
| Key colours | `#141c30` under-painting, `#2e5944` viridian meadow, `#866c2a` wheat ochre, `#3d4180` violet path, `#26409a` ultramarine, `#ffd040` cadmium, `#9fd4dc` halo turquoise, `#111733` prussian contour |

## When to use it

- **Good fits:** top-down projects with a free-roaming camera (the infinite painted landscape shines), atmospheric night adventures, art-themed projects, slow to mid-paced action where the viewer has time to enjoy the canvas.
- **Works with care:** dense crowds – at 100+ figures the screen becomes a carpet of strokes; strong contours and creature colours that contrast with the ground are mandatory, and the calm coat strokes of the ground must stay calm.
- **Bad fits:** competitive shooters and precision platformers (stroke-broken silhouettes blur exact shapes), UI-heavy strategy (the busy ground fights with dense UI), very low-end devices (long bake times).
- **Why:** the look comes from texture density with a strict hierarchy – big calm areas, busy edges, bright focal points. Without that hierarchy it turns into noise.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Night under-painting | `#141c30` | Clear colour, dark base between ground strokes |
| Prussian contour | `#111733` | Contour strokes of the main character, houses, region borders |
| Meadow viridian | `#2e5944` | Meadow mid tone – the dominant ground colour |
| Meadow light | `#70944e` | Brightest meadow strokes |
| Moonlit rim | `#9aae4c` | Rim strokes on the lit side of forests, moonlit cypress tongues |
| Forest black-green | `#173024` | Forest floor mid tone |
| Wheat ochre | `#866c2a` | Wheat field mid tone |
| Wheat light | `#bc9a3e` | Brightest wheat strokes |
| Path violet | `#3d4180` | Roads and paths |
| Pond blue | `#26579c` | Water |
| Ultramarine coat | `#26409a` | Main character's clothing |
| Cobalt light | `#4a76cc` | Cloth highlights, speed smear |
| Gourd orange | `#d86c1e` | Main character's head mid tone |
| Scarlet | `#c8341e` | Scarf, red bar, alert vignette |
| Cadmium yellow | `#ffd040` | Creature eyes, impact dabs, halo bands |
| Chrome yellow | `#ffe070` | Halo bands, stars, clock digits (`#ffe27a`) |
| Star white | `#fff6c8` | Hottest light centres |
| Halo turquoise | `#9fd4dc` | Outer bands of every light halo |
| Root violet | `#763896` | Small root creature, top half |
| Root cream | `#e2d09a` | Small root creature, bottom half |
| Ghost turquoise | `#a2d0d2` | Fast floating creature |
| Frame gold | `#d8aa48` | Gilded UI frames |

**Ground ramps** (6 steps dark → light, the module's `MATS`):

| Region | Ramp | Accents |
| --- | --- | --- |
| Wheat | `#3c2e18 #54421e #6c5624 #866c2a #a08232 #bc9a3e` | `#2e3e70 #4e5a28 #a65e28` |
| Meadow | `#1a3430 #23463c #2e5944 #3c6a48 #527e4a #70944e` | `#2e4a86 #8a8a3a #3a6a7a` |
| Path | `#1c1e44 #262a5a #31356c #3d4180 #4c4f94 #6264a8` | `#8e7c6c #2c4f72 #6a4f8e` |
| Forest | `#0a1612 #10221a #173024 #1f3e2c #2a4c34 #3a5c3e` | `#1a2650 #3a4a24 #0e2a36` |
| Pond | `#10244e #163268 #1d4384 #26579c #3270ae #4a8fbc` | `#78c0c0 #c6d2a0 #e8c850` |

**Edge-band strokes:** ink `#0c1228 #111733 #18202e`, moonlit rim `#6f8e3c #9aae4c #c4c062`, cast shadow `#0b1330 #111b3e #0d1a28`, shore ripples `#4f94aa #86c8c8 #bfe4d4`, path ruts `#5e5a86 #7a6e8e #8e7c6c`, poppies `#b02a1a #d8452a #ec6a32`, gold reflections `#d08a26 #eeb63a #ffd862 #fff0a8`.

**Character ramps:** coat `#141d52 #1d2c78 #26409a #3157b4 #4a76cc #7aa0e0`; gourd `#8e3a12 #b8521a #d86c1e #ec8a28 #f6aa3c #fcd06a`; scarf `#8a1a10 #c8341e #e8502a #f6883a`; leaf `#163a2a #1f5a3a #2f7a4a #4a9a52 #80bc5c`; root violet `#34124c #55206f #763896 #985ab6 #c28cd8`, magenta `#3e1040 … #d488b8`, beet `#2a0c2a … #a85478`; cream `#9c8656 #c4ad78 #e2d09a #f4e9c2 #fffbe8`; wisp `#3d64a6 #6e9ec8 #a2d0d2 #cbece4 #f2fbf4`; colossus plum `#1c1220 … #a27aa4`, umber `#22160e … #a07c52`; carved glow `#4a1206 #ffb52e #ffe070 #fff6c8`.

**Rules**

- Cool colours own ~85 % of the screen. Warm yellows/oranges are *light*: the main character, lanterns, windows, collectibles, eyes, impacts.
- Value structure first: the big coat strokes are low contrast (ridge 12 %, shadow edge ×0.82); full-contrast and accent strokes are spent on edges and focal points.
- Shadows shift hue, they do not just darken: a cool `#7a3a4a` in the gourd's core shadow, cobalt `#4a5ab0` in the wisp, ultramarine `#22355f` on cypresses, blue `#3a4a7a` on haystacks.
- Complementary accents (blue in wheat, ochre in meadow, gold in water) are 3 % of the smaller strokes, up to 25 % inside cluster drifts – never an even sprinkle.
- Outlines are never `#000`: `#111733`, `#1d1036`, `#0c0812`, `#1f3a78` (wisp), `#04080a` (cypress).
- Hit tint is warm cream `#fff0c8`, never white. UI uses golds (`#d8aa48`, `#fbe7a0`) and night blue (`#121a44`).

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

Floating numbers (canvas): `400 12px "Caveat Brush"` (emphasised 17 px), fill `#f6c43a` (emphasised `#f6602a`), `strokeText` outline `#121838` (2.8 / 3.6), a highlight pass in `#fff4c0` at 75 % offset (−0.35, −0.45), rotated ±0.15 rad, popping 0.55 → 1.2 in the first 12 % of their life.

## Rendering technique

Everything rests on **one primitive**, `stroke(ctx, x, y, angle, len, wid, col, rng, opts)`: an impasto dab in local space –

1. a filled body with a blunt rounded start, sides bent by ±0.18 × length, a pointed tip;
2. a **light ridge** along the upper third (lineWidth 0.48 × half-width, colour 30 % toward `#fff6dc`, `opts.hi`);
3. a **shadow edge** along the lower side (0.32 × half-width, colour × 0.58, `opts.lo`);
4. a **bristle groove** (0.08 × width, colour × 0.7) at a random lateral offset.

On top sit three tools: `paint(polygon, {col, ang, sp, len, wid, edge})` fills a shape with a jittered grid of strokes clipped to it, oriented by a form function and coloured by ramp picking; `contour()` lays dark strokes along an outline, up to 55 % thicker on the shadow side; `seg()` / `polyStroke()` paint limbs, stems and cracks.

Pipeline:

1. **Init (bake once):** a ground stroke atlas (each region's ramp in three stroke sizes, accents and the edge-band sets, ~150 strokes on one 1024 × 560 sheet, trimmed and read back once); ~45 character poses; ~20 props plus 5 wind poses for each swaying one; FX sprites (halos, glow, pools, shadow, star, dabs, comma flicks, smear, trail, wind stroke, rings, swirls); UI textures (async, one per `setTimeout` task). Painting happens on CPU canvases (`willReadFrequently`), the result is trimmed to its painted pixels (+1 px) and copied to a normal canvas for fast blits; mirrored copies are prebuilt.
2. **Ground chunks** (256 × 256 units, generator): noise fields, edge distances and normals on a 5-unit grid → under-painting with canvas weave into an `ImageData` → three stroke passes splatted in pure JS (exact span rasterising, nearest sampling, alpha-over) → decals → `putImageData` in 160-px bands. Yields every 40 strokes, so walking never hitches.
3. **Per frame, draw order:** ground chunks → additive light pools → collectibles → painted shadows → y-sorted props / creatures / main character → orbiting lanterns → projectiles → particles → floating numbers → wind strokes and fireflies → varnish vignette → DOM UI.
4. **Resolution:** not pixel art; ground at up to 2.5 px/unit, sprites at 3 px/unit (collectibles 6 px/unit), drawn with smoothing. Every per-frame blit is axis-aligned except the few rotating halos and effect dabs.

## World and ground

Five regions – wheat, meadow, path, forest, pond – each a field of thick oil dabs over a dark under-painting, each with its own stroke flow, so regions read by direction as much as by colour.

- **Regions from noise (world units):** forest where `warped(x/760, y/760) > 0.6`, pond where `warped(x/640 + 31.7, …) < 0.314` (raised near the start point so no pond appears there), wheat where `fbm(x/470, y/470)` crosses 0.5, meadow elsewhere. Paths: the 0.5 iso-line of `fbm(x/980)`; distance = `|p − 0.5| / |∇p|`, path weight fades between 9 and 15 units. Every boundary gets a **signed edge distance** `(field − threshold) / |∇field|` and a normal, computed from grid gradients.
- **Flow per region:** wheat – furrows parallel to the field edge (edge tangent); meadow – grass in the wind (angle −0.45 rad ± 1.5 from `fbm(x/380)`), bending around forests and ponds within ~12 units; path – along the path tangent; forest – curly foliage dabs from `perlin(x/46) × 3.2`; pond – ripples parallel to the shore.
- **Three stroke scales** (the detail hierarchy):
  - *coat* – a 6.6-unit jittered grid, one stroke per cell, 1.55× longer and 1.45× wider than the region stroke (wheat 9 × 2.5, meadow 10 × 2.6, path 10 × 2.5, forest 6 × 2.7, pond 10 × 2.4), low contrast, ramp index 1.5 + light;
  - *body* – a 4.5-unit grid, kept with probability `0.3 + 0.62 · detail`, index 2.4 + light;
  - *focal* – a 2.9-unit grid, only where `detail > 0.12` (probability `detail² · 1.15`), scale 0.55–0.8, index 3.1 + light.
  `detail` = proximity to a designed edge (forest 16 units, wheat 11, pond 14, path border 9) or a high cluster noise `fbm(x/70)`.
- **Designed edges** (replace strokes in the body/focal passes): broken ink borders along every region boundary (`#0c1228`, `#111733`, `#18202e`, 5.6 × 1.7); a moonlit rim (`#6f8e3c`, `#9aae4c`, `#c4c062`) on forest edges that face the light, 3–8 units wide; ultramarine cast-shadow strokes (`#0b1330`, `#111b3e`) on the far side, up to ~14 units; light shore ripples within 6 units of water; worn ruts 4.6 units from the path centre; poppy drifts inside wheat edges where clusters are high.
- **Light term:** macro brightness `(fbm(x/250) − 0.5) · 2.4`; wheat furrow bands `0.75 · sin(edgeDist · 0.95)`; meadow wind waves `0.42 · sin(…/7)` across the wind; pond shallows +1.3 near the shore; −1.3 inside a forest's cast shadow; +1.1 on the moonlit forest edge.
- **Under-painting:** wheat `rgb(46,34,20)`, meadow `rgb(17,32,28)`, path `rgb(17,17,40)`, forest `rgb(7,13,12)`, pond `rgb(10,21,50)`, × (0.8 + 0.45 · macro), bilinear on the 5-unit grid; a 4-pixel canvas weave darkens alternate cell edges to 0.87. It shows between strokes, which keeps the night dark.
- **Decals with intent:** wind eddies only in open meadow (cell 330, 50 %: 22–30 strokes on a 1.4–1.9-turn spiral, radius 18–30, squashed 0.72); star whorls in deep water (cell 80, gold centre, pond accents outside); star reflections (cell 46: five gold dabs in a ring); flower drifts near edges inside clusters (cell 8: 2–3 tiny dabs in `#f4efd8`, `#ffd84a`, `#7aa8e8`, `#c8a0e0`).
- All randomness is seeded per world cell, so chunks agree and borders are seamless. The ground itself is static.

## Characters

All characters are painted offscreen at 3 px/unit with `paint()` and `contour()`. **Every body part has its own seeded generator** (`RNG(seed, part)`), so the strokes stay put from pose to pose and the motion reads as one painted figure moving, not as boiling noise. Light comes from the upper left (`index = base − dx·1.5 − dy·1.3` ± jitter).

**Main character** (≈18 wide × 30 tall; feet at the anchor) – a round orange gourd head with a carved glowing face, an ultramarine coat, a rope belt and a red scarf:

- Legs: thigh and shin `seg()` strokes 2.7 / 2.4 wide (`#1f192c` far, `#30273f` near) with a knee that bends with the lift, boots 3.9 × 2.15 (`#140c08` / `#24170f`).
- Arms: upper and lower arm strokes with a light sleeve stroke, cream hand dab `#e8cf9c`; the far arm in `#1d2c78`, the near arm in `#3157b4`.
- Coat: a Catmull-Rom polygon from the shoulders (y −16) to a flared hem (y −4) that swings against the step; vertical fold strokes (`−π/2 + x·0.07`), coat ramp by `2.3 − x·0.3 − (y+10)·0.05`, prussian contour 1.05 × 3; two cadmium buttons, a rope belt `#7a5a2a` / `#c8a050`, a scarf knot of four scarlet dabs (the tail is drawn live, see Motion).
- Head: rx 8.8, ry 7.4, 22.6 units above the feet, lagging the body; strokes follow the **meridians** of the gourd (the slope of the meridian ellipse through each point); four darker rib lines; cool `#7a3a4a` dabs in the core shadow; contour 1.1 × 3.2; stem, leaf and a curling vine tendril as the characterful top of the silhouette.
- Face looks to +x: carved triangle eyes and nose, a 13-point zig-zag mouth; `carved()` = dark rim offset (0.35, 0.4) `#4a1206`, fill `#ffb52e`, 62 % inset `#ffe070`, 30 % inset `#fff6c8`.

**Small creatures** (three root-bulb designs, about 18 × 26): a round violet/cream bulb with four leaves, a tall magenta/cream radish with two long curling leaves and a long root tail, a wide plum/gold beet with ring-shaped strokes and one rolled leaf. Strokes wrap around the bulb, the colour splits at a wavy band line, contour `#1d1036`; big cadmium eye strokes `#ffcf40` with dark pupils `#3a0a10` and heavy slanted brows `#1d0f2a`; root arms and two short legs.

**Fast creature** (hooded wisp, about 20 × 26): a hooded sheet whose hood tip curls back and flutters, a Starry-Night swirl for a tail (dark under-stroke `#1f3a78` plus a pale stroke), reaching arms behind the body; strokes swirl around the hood, cobalt `#4a5ab0` in the cool shadow; deep painted eye hollows `#0d1430` with a tiny cadmium glint, an open mouth. Drawn at alpha 0.92 with a forward lean of 0.16 rad baked into all its poses.

**Large creature** (root colossus, about 44 × 46): a hunched body with high shoulders and the head mass pushed forward, painted with big strokes (`sp 2.0, len 5.4, wid 2.05`) – plum above, umber below, moss `#6fa4b0` / `#b4d0c4` on the lit back – contour `#0c0812` 1.7 × 4.4; glowing cracks in three passes (`#1a0c08`, `#ffb030`/`#ff9a20`/`#ffc84a`, `#fff2b0`) with a 7-stroke core; deep-set cadmium eyes under a brow ridge; long root arms that swing with lag; a crown of five big leaves that bounces late after each stomp.

Every creature gets a scale 0.92–1.08 and an animation phase from its seed; frames are mirrored for facing.

## Props

Painted once with the same tools, each grounded by a painted stroke shadow, and placed where the ground composition asks for them:

- **Cypress** ×3 (70 / 84 / 58 units): lobed flame tongues twisting upward, nearly vertical swaying strokes 7.5 × 2.0, ramp `#081210 … #3f6e40`, moonlit tongues `#6f7c34` / `#9aa850` on the left, cool `#22355f` dabs on the right, dark grooves between tongues, contour `#04080a`. A wall of them along forest edges (55 % of 46-unit cells near the edge, 22 % deeper inside) and groups of 2–3 in open meadow. 45 % transparent when the main character walks behind one.
- **Olive tree** ×2: twisted trunk strokes `#3a2c2a … #7a5e44`, three foliage masses of radial strokes in sage greens `#1e2e2c … #94a482` with `#4a6a8c` dabs, contour skipped on the lit side; in groves where a cluster noise is high.
- **Haystack** ×2: a dome of radiating strokes `#5a3e16 … #f0d062`, blue `#3a4a7a` on the shadow side, loose straw at the foot; in wheat, often in pairs.
- **Sunflowers** (3 or 2 heads, 20–30 units): 13 petal strokes in `#e8a020` / `#f6c030` / `#ffd84a` around a dark seed head; along the inner wheat edge and in house gardens.
- **Irises** (3 or 5 blooms): blue-green sword leaves `#1d4a40 … #5aa078`, ultramarine petals `#2f3a9a` / `#4a56c0` with a cadmium beard; in clumps on pond shores with open shore between.
- **Stones** ×3: rounded forms whose strokes wrap the form, warm moonlit top `#b0a888`, cool shadow, grass tufts at the foot; along paths.
- **Houses** ×3: two cream cottages (`#a88a5a … #f6ecc8` walls, blue side wall, red roof `#7a2e1e … #f09a58`, chimney, door) and a village church with a blue roof, a tower and a pointed steeple; windows are flat `#ffc93a` with a `#fff0a0` stroke and dark cross bars – each window is a light source. Near paths, often with a sunflower garden.
- **Street lamp**: dark pole 27 units, lantern head `#ffd24a` with a `#fff4c0` hot stroke; 15–22 units from a path centre.
- **Wind:** cypresses (0.03), olives (0.025), sunflowers (0.05) and irises (0.06) have five baked lean poses (skew −1 … +1 × sway about the base); a gust wave `t·1.25 − x·0.0085 − y·0.004` travels across the world and picks the pose, so plants move in held poses and slower than the actors.

## Effects and particles

Everything is paint: dabs, comma flicks, rings of strokes, painted-on swirls, puddles. Each effect is layered (core flash → main shape → debris → residue) with its own lifetime.

- **Impact:** an 8-ray star stroke flash (0.12 s, additive) → two comma flicks thrown along the blow (0.22 s; one yellow or orange, one in the creature colour) → three dabs that fall with gravity 240 and lie squashed on the ground (0.6–1.0 s). The creature squashes and leans back with a warm tint for 150 ms.
- **Unpainting (vanish, 0.35 s):** the first 15 % squash + warm flash; then the body slumps into a puddle (+20 % wide, −62 % tall; the wisp stretches up into its swirl instead) while 8 / 9 / 14 of its own strokes peel off with a staggered release (0–32 %), ride a spiral up and away (radius × 2.6, 12–15 units up), stretch as they are pulled and thin out. Layered with a star flash, a ring of 18 tangential strokes (0.34 s), a painted-on swirl (0.5–0.8 s), 9–20 dabs and a puddle stain that lingers 1.3–1.8 s.
- **Painted-on swirl:** 2–3 arms of 7–10 loaded strokes appear from the centre outwards (each stroke revealed at `age·2.6 − t·0.9`), opaque, turning slowly; outer strokes dry first (they thin to 25 % width, then fade). Squashed 0.6 to lie on the ground.
- **Glow-up:** a gold painted-on swirl (radius 32, 1 s) around the main character's feet that passes *behind* the figure (strokes in its column above the feet are skipped), a 22-unit core star, and 9 stars flung out along the arms on spiral paths, released one after another.
- **Collectibles:** small = a golden four-ray painted star (`#7a3a10` under-strokes, `#f0a020` rays, `#fff6c8` core) in a small halo, twinkling on its own clock; large = a turquoise night crystal (`#2a8a9a … #f4fff0`, contour `#0e2a40`) in a cool halo; both bob on an eased curve and pop when they drop.
- **Collect:** 2 (large: 5) stars that curl around the collectible, plus an inward ring of strokes (0.28 s).
- **Projectile:** a cream seed (7 × 5 units) with a growing 8–18-unit comet stroke trail (`#d86c1e`, `#ffd040`, `#fff6c8`, faded by a gradient) and a faint additive glow.
- **Orbiting lanterns:** small root-bulb lanterns with flickering carved faces (3 poses at 5 fps) hanging from their handles, swinging behind the orbit, each in a 26-unit halo.
- **Speed smear:** a push-off puff of 4 dabs, 6 parallel long strokes (30 × 12 units, 0.35 s), 3 trailing dabs, 2 fading copies of the main character.
- **Appear:** see Motion – a paint vortex plus the creature painted in from the ground up.

## Atmosphere and lighting

- **One light:** moonlight from the upper left (`LDX −0.6, LDY −0.8`) decides every ramp, rim and cast shadow, on the ground and on sprites.
- **Halos** are the only warm light: a soft radial core plus concentric bands of overlapping comma strokes whose radius wobbles ±5 % – chrome yellow inside, pale turquoise `#9fd4dc` outside, the Starry-Night rhythm. Drawn with `lighter`, rotating 0.35–1.1 rad/s: 40 units around the main character's head at alpha 0.42 × (0.85 + 0.15 sin 2.2t); 26 around each lantern; radius 13 × size around windows and lamps, flickering 0.85 + 0.1 sin 7t + 0.05 sin 17t.
- **Face glow:** a 16 × 14 additive glow in the carved face, 0.3 + 0.08 sin 11t + 0.05 sin 23t with a short dip every ~3 s – a candle on its own uneven clock.
- **Light pools:** additive `rgba(255,200,90,0.5) → 0` ellipses under lamps and windows (60 × 30 × size, alpha 0.45), the main character (40 × 16, 0.32) and each lantern.
- **Shadows:** a baked ellipse of 16 dark ultramarine strokes (`#0c1030`, `#141a44`) at alpha 0.62 (wisp 0.35), offset to the lower right, sized per object.
- **Wind and fireflies:** long translucent wind strokes (64 × 10 units, alpha ≤ 0.2) drift along the wind on 7–12 s clocks in one of four 300-unit cells; fireflies (small halos 6–9 units) drift in half the 170-unit cells and twinkle between 0.15 and 0.65 on varied timings.
- **Varnish vignette:** a rounded band 13 % of the screen height in `rgb(12,10,30)`, alpha `t² · 0.62`, with loose dark strokes along the border; a scarlet `rgb(200,52,24)` version with red strokes flashes as an alert. Baked once per screen size, drawn as four strips.
- No post-process filters; never a white flash.

## UI

A museum: every element is a gilded frame around a small painting.

- **Gold frame:** 9 stroked bands `#2a1c06 #7a5414 #d8aa48 #fbe7a0 #b8862c #6a4610 #e6c068 #8a6018 #3a2808`, a row of radial-gradient beads on the middle band, 8-petal rosettes in the corners; used as a CSS `border-image` (30 px slice).
- **Bars:** the track is a texture of horizontal brush strokes in night blues (`#0e1638 … #26408a`); fills are stroke textures in reds `#a8281a … #ffb060` or golds `#c88a1c … #fff0a8`, with a ragged painted right edge (a CSS mask of 9 brush strokes).
- **Clock panel, title banner, cards:** framed night paintings – strokes swirling around a centre, a few painted stars of 10 strokes, a dark wash at the bottom of the cards; icons are little paintings in halos (112 px on cards, 42 px in the bar row).
- Title text `'A new masterpiece!'` in Cinzel 800 44 px `#ffe27a`; cards 232 × 304 px lift 8 px on hover.

```css
.panel { background: #121a44; border: 9px solid #d8aa48; border-image: linear-gradient(#fbe7a0, #b8862c 40%, #6a4610 60%, #e6c068) 9; box-shadow: 0 6px 16px rgba(0,0,0,.5); color: #f6e6b0; font-family: 'Cinzel', Georgia, serif; }
.bar { position: relative; height: 20px; background: repeating-linear-gradient(90deg, #16224e 0 18px, #1d2c6a 18px 30px, #0e1638 30px 44px); outline: 4px solid #d8aa48; box-shadow: 0 3px 10px rgba(0,0,0,.55); }
.bar > .fill { height: 100%; background: repeating-linear-gradient(90deg, #d0401e 0 16px, #ea6028 16px 28px, #f6883a 28px 38px, #a8281a 38px 50px); clip-path: polygon(0 0, 100% 0, calc(100% - 6px) 30%, 100% 55%, calc(100% - 5px) 100%, 0 100%); }
```

## Motion and animation

Hand-painted timing: poses are **held**, never tweened, and every pose is its own painting.

- **Main character walk:** 8 poses (contact, down, passing, up for each foot) at ~12 fps – legs swing ±4 units with a 2.1-unit foot lift and a bending knee, arms counter-swing ±3.2, body bob 1.7 (lowest just after contact), the head lags the step by ~1 rad (bob 0.8, tilt 0.06), a 0.075 rad lean into the walk, the coat hem swings against the step.
- **Idle:** 4 breathing poses (neutral – inhale – hold – exhale) at 2.5 fps; the shoulders and scarf rise, the head tilts slightly.
- **Dash:** an anticipation crouch (squash, arms back) for the first 35 ms, then the stretched lunge pose; speed smear and two fading copies.
- **Recoil:** a pose leaning back with arms up and the head tossed back, plus an orange tint and the scarlet vignette.
- **Scarf (follow-through):** a damped spring (stiffness 70, damping 8) whose target angle depends on the state (idle hang, walk flutter `sin 7.3t`, dash streaming), chained in three strokes that curl with the spring's angular velocity.
- **Root creatures:** 6 waddle poses at ~12 fps – a squash on contact, a hop, a 0.09 rad tilt, leaves lagging the body by ~0.9 rad.
- **Wisp:** 6 poses at 9 fps (tail swirl, fluttering hood tip, reaching arms) and an eased hover `(sin t + 0.35 sin(2t + 1.1)) · 1.1` – a quick rise and a slow sink.
- **Colossus:** 6 heavy stomp poses at ~8 fps with a bob, a tiny squash on contact, dust dabs at the feet on the two contact poses, a late-bouncing leaf crown, lagging arms, and a crack glow pulsing 0.26 + 0.14 sin 4t.
- **Appear (0.45 s):** a paint vortex spins up on the ground; from 12 % the creature is painted in from the ground up (ease-out), crouched at 88 % height, with three loaded dabs riding the reveal edge; from 72 % it overshoots to 112 % height / 93 % width and settles.
- **Hit:** 150 ms, eased `k²`: +17 % width, −15 % height, a 0.2 rad lean back, warm tint `#fff0c8` at `flash^1.5 · 0.9`.
- **Vanish:** the unpainting (see Effects) – nothing simply fades.
- **Ambient:** gust-wave plant sway (period ~5 s), wind strokes on 7–12 s clocks, fireflies, halos rotating 0.35–1.1 rad/s – all slower than the actors.

## Do and don't

**Do**

- Build everything from the same stroke primitive – ground, characters, props, halos, effects, UI bars.
- Spend detail where the eye should go: big calm strokes for areas, small bright strokes on designed edges and faces.
- Give every region a flow that follows its form (furrows along the field edge, ripples along the shore, grass bending around obstacles).
- Outline characters and regions with broken dark contour strokes, thicker on the shadow side.
- Keep light warm and additive, alternating with pale turquoise in the halos.
- Paint every animation pose as its own painting with per-part seeds, and hold the poses.
- Make effects out of paint: strokes that are painted on, peel off, swirl and dry.

**Don't**

- Don't scatter bright strokes evenly over the ground – gather them on edges and in clusters.
- Don't leave smooth gradients or flat fills as final surfaces.
- Don't draw thin vector outlines or pure black.
- Don't fade a creature out with alpha alone or slice it digitally – let its paint run and peel away.
- Don't let creature colours match the ground (no green creatures on the meadow).
- Don't rotate or skew sprites per frame when a baked pose can do it.
- Don't make ground strokes thinner than ~2 world units – it turns into noise.

## Implementation recipe

1. Write `stroke()` (body, ridge, shadow edge, groove) and test single dabs at 3 px/unit until they look like loaded oil paint.
2. Write `paint(polygon, opts)` and `contour()`; decide the light direction once (upper left) and use it in every colour function.
3. Define 6-step ramps per material (dark → light) and 2–3 complementary accents.
4. Ground: compute region fields, signed edge distances and normals on a coarse grid; paint the under-painting; then the coat pass (every cell, calm), the body pass (denser near edges), the focal pass (edges only); replace strokes on edge bands with ink, rim, shadow, ripple and drift sets; add decals only where they mean something.
5. Characters: one generator per body part; write the figure as a function of pose parameters (leg swing/lift, arm swing, bob, lean, head lag, hem) and bake 8 walk + 4 idle + dash + recoil poses; creatures 6 poses each. Trim every sprite.
6. Props: paint once, add 5 baked wind poses for plants and trees, place them by the ground composition (edges, clusters, paths, shores).
7. Light: bake yellow/turquoise comma-stroke halos and warm pools; draw them additively only at real light sources.
8. Effects: dab and flick sprites; painted-on swirls, peeling-stroke vanishing, spiral stars; layer every effect and keep it short.
9. Atmosphere and UI: varnish vignette, wind strokes, fireflies; gilded frames, stroke-texture bars, framed paintings for panels.

## Code

The impasto dab – the only primitive:

```js
function stroke(ctx, x, y, ang, len, wid, col, r, o = {}) {
  const hl = len / 2, hw = wid / 2, b = (o.bend ?? (r() - 0.5) * 0.36) * len;
  const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const mix = (c, d, t) => c.map((v, i) => v + (d[i] - v) * t);
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(-hl, -hw * 0.85);
  ctx.quadraticCurveTo(0, -hw * 1.25 + b, hl, b * 0.12 - hw * 0.14);
  ctx.lineTo(hl + hw * 0.35, b * 0.12); ctx.lineTo(hl, b * 0.12 + hw * 0.14);
  ctx.quadraticCurveTo(0, hw * 1.25 + b, -hl, hw * 0.85);
  ctx.quadraticCurveTo(-hl - hw * 1.15, 0, -hl, -hw * 0.85);
  ctx.fillStyle = rgb(col); ctx.fill();
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-hl * 0.88, -hw * 0.32); ctx.quadraticCurveTo(0, -hw * 0.5 + b, hl * 0.72, b * 0.12 - hw * 0.08);
  ctx.lineWidth = hw * 0.48; ctx.strokeStyle = rgb(mix(col, [255, 246, 220], o.hi ?? 0.3), 0.8); ctx.stroke();   // light ridge
  ctx.beginPath(); ctx.moveTo(-hl * 0.95, hw * 0.6); ctx.quadraticCurveTo(0, hw * 0.86 + b, hl * 0.85, b * 0.12 + hw * 0.1);
  ctx.lineWidth = hw * 0.32; ctx.strokeStyle = rgb(col.map((v) => v * (o.lo ?? 0.58)), 0.75); ctx.stroke();      // shadow edge
  ctx.restore();
}
```

The detail hierarchy of the ground – three passes, small bright strokes only near edges:

```js
// field(x, y) -> { mat, edgeDist, flowAngle, light }; detail = closeness to a designed edge (0..1)
const PASSES = [
  { cell: 6.6, base: 1.5, scale: 1.5, keep: () => true, calm: true },                       // coat
  { cell: 4.5, base: 2.4, scale: 1.0, keep: (d, u) => u < 0.3 + 0.62 * d },                 // body
  { cell: 2.9, base: 3.1, scale: 0.65, keep: (d, u) => d > 0.12 && u < d * d * 1.15 },     // focal
];
for (const P of PASSES) for (let cy = 0; cy * P.cell < H; cy++) for (let cx = 0; cx * P.cell < W; cx++) {
  const r = seeded(cx, cy, P.cell), x = (cx + r()) * P.cell, y = (cy + r()) * P.cell;
  const f = field(x, y), detail = Math.max(0, 1 - Math.abs(f.edgeDist) / 12);
  if (!P.keep(detail, r())) continue;
  if (!P.calm && Math.abs(f.edgeDist) < 1.1) { stroke(ctx, x, y, f.edgeAngle, 4.8, 1.7, INK, r); continue; }   // broken ink border
  const ramp = RAMPS[f.mat], idx = Math.max(0, Math.min(5, Math.round(P.base + f.light + (r() - 0.5))));
  stroke(ctx, x, y, f.flowAngle, LEN[f.mat] * P.scale, WID[f.mat] * P.scale, ramp[idx], r, P.calm ? { hi: 0.12, lo: 0.82 } : {});
}
```

A walk pose as parameters – bake 8 of them, hold each for ~83 ms:

```js
function walkPose(i) {            // i = 0..7: contact, down, passing, up for each foot
  const ph = (i / 8) * Math.PI * 2, s = Math.sin(ph), c = Math.cos(ph);
  return {
    legF: s, legB: -s,                                     // foot swing ×4 units
    liftF: Math.max(0, c) * 2.1, liftB: Math.max(0, -c) * 2.1,
    bob: (Math.sin(ph - 0.4) ** 2 - 0.5) * 1.7,            // lowest just after contact
    armF: -s, armB: s,                                     // counter-swing ×3.2 units
    hem: -c * 0.8, lean: 0.075,
    headBob: (Math.sin(ph - 1.0) ** 2 - 0.5) * 0.8,        // the head lags the body
  };
}
const frame = poses[Math.floor(t * 12) & 7];               // on twos
```

A swirl painted on stroke by stroke (dab = a baked single stroke sprite):

```js
function paintSwirl(ctx, x, y, R, age, rot, dabs, arms = 3, per = 10, hole = 0) {
  const grow = 0.55 + 0.45 * (1 - (1 - Math.min(1, age * 1.8)) ** 2);
  for (let k = 0; k < arms; k++) for (let j = 0; j < per; j++) {
    const t = j / (per - 1), reveal = Math.min(1, Math.max(0, (age * 2.6 - t * 0.9) / 0.22));
    if (reveal <= 0) break;                                                // painted from the centre out
    const dry = 1 - Math.min(1, Math.max(0, (age + t * 0.14 - 0.5) / 0.5));  // outer strokes dry first
    if (dry <= 0) continue;
    const a = rot + k * (Math.PI * 2 / arms) + t * 4 + age * 1.4, rr = R * (0.14 + t * 0.82) * grow;
    const sx = x + Math.cos(a) * rr, sy = y + Math.sin(a) * rr * 0.6;
    if (hole && sy < y + 2 && Math.abs(sx - x) < hole) continue;            // passes behind a standing figure
    const L = R * (0.42 + t * 0.18) * (0.4 + 0.6 * reveal);
    ctx.save(); ctx.globalAlpha = dry > 0.35 ? 1 : dry / 0.35;
    ctx.translate(sx, sy); ctx.rotate(a + Math.PI / 2 + 0.14);
    ctx.drawImage(dabs[(j + k) % dabs.length], -L / 2, -L * 0.21 * dry, L, L * 0.43 * (0.25 + 0.75 * dry));
    ctx.restore();
  }
}
```

## Adapting it to your project

- **Daylight / other seasons:** keep the primitive and the hierarchy, swap the ramps (wheat to green barley, meadow to pale sage, under-painting to a warm ochre) and turn halos into a single sun with long rays of strokes; shadows become violet.
- **Side view:** paint a sky band with the same whorls (big coat strokes along curl noise, stars as yellow/turquoise halos) and a ground strip with furrows running to the horizon.
- **Smaller screens / many figures:** raise creature contrast (thicker contours, brighter eyes) and lower the body-pass probability so the ground stays calm.
- **New creatures:** pick a colour family absent from the ground, write one form-describing angle function, give every body part its own seed and bake 6 poses; add one characterful silhouette feature (a crown, a tendril, a hood tip).
- **New props:** decide where the ground composition wants them (edge, cluster, path, shore) before drawing them; trees and plants get baked wind poses.

## Performance notes

- **Init:** stroke atlas, ~45 character poses, ~20 props plus 5 wind poses each for swaying ones, FX sprites and UI textures – roughly 1 s on a mid-range laptop. UI textures are built one per `setTimeout` task after the switch.
- **Ground chunk:** noise and edge fields on a 5-unit grid, ~8–10 k atlas strokes splatted in pure JS (exact horizontal spans, nearest sampling), yielding every 40 strokes; ~90–120 ms per chunk spread over frames.
- **Per frame:** ground chunk blits, one axis-aligned `drawImage` per character or prop (wind and the wisp's lean are baked poses), additive rotated halos only at light sources, cached vignette strips. Painted swirls and unpainting draw 7–30 small dab sprites each while they live (0.35–1 s).
- Every sprite is trimmed to its painted pixels – transparent margins cost fill rate on every blit. Props use a tight cull margin (the renderer already keeps room for tall props).
- Avoid per-frame paths: no stroke is ever painted with the path API at runtime.

## Copy-paste prompt

```text
Use the Starry Night art style for my project: a living Van Gogh night painting.
Everything is built from one primitive: a thick impasto brush stroke (filled body with a blunt start
and tapered tip, a light ridge 30 % toward #fff6dc, a darker shadow edge, a bristle groove).
Palette: under-painting #141c30, meadow #2e5944/#70944e, wheat #866c2a/#bc9a3e, forest #173024,
path violet #3d4180, pond #26579c, ultramarine #26409a, cadmium #ffd040, chrome #ffe070,
star white #fff6c8, halo turquoise #9fd4dc, prussian contours #111733.
Ground: regions from noise with designed edges; three stroke scales – big calm low-contrast strokes
everywhere, medium strokes gathering near edges, small bright strokes only on edges; each region's
strokes follow its form (furrows along the field edge, grass bending in the wind, ripples along shores);
dark broken ink borders, moonlit rims on lit forest edges, ultramarine cast shadows on the far side.
Characters and props: painted stroke by stroke with form-following angles, ramp shading lit from the
upper left with hue-shifted shadows, dark stroke contours; one seed per body part; walk = 8 held poses,
creatures 6 poses, wind sway = baked lean poses. Light only at real sources: additive halos of
yellow-inside / turquoise-outside comma-stroke bands. Effects are paint: swirls painted on stroke by
stroke, vanishing figures whose strokes peel off and spiral away, comma flicks, dabs that land.
UI: gilded frames, brush-stroke bars, framed little night paintings; fonts Cinzel, Caveat Brush, Alegreya.
```
