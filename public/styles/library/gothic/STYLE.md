# Gothic Night — Game Art Style Spec

> Moonlit cursed churchyard in detailed pixel art: a banded light map darkens a cold world; only faces, lanterns and candles glow warm.

A cold, desaturated night in detailed 1:1 pixel art. Mossy gravestones, bare black trees, cobble paths, flagstone plazas and leaf litter sit under slowly drifting mist. Every sprite and texture is painted **fully lit** from muted blue-grey, violet, moss and plum ramps. A per-frame **light map** is then multiplied over the image: blue moonlight ambient, a banded vignette, drifting cloud light, and posterised warm point lights. Warm colour appears only where there is light: the main character's flickering carved pumpkin face, lanterns, seeds, candles and embers. Creatures keep a few **emissive eye pixels** that pierce the dark. The modules show a pumpkin-headed main character in a violet cloak, purple-and-cream root creatures with leafy tops, skeletal ghosts and a large cracked root giant with a glowing green core, but every rule below applies to any subject.

## At a glance

| | |
| --- | --- |
| Family | Pixel Art · Dark |
| Mood | eerie, melancholic, atmospheric, cozy-spooky, nocturnal |
| Best for | top-down action games, horror games, dungeon crawlers, Halloween projects, light-radius scenes |
| Renderer | Canvas 2D, procedural, per-pixel painted sprites, multiplied light map |
| Pixel art | yes, **1 art pixel = 1 world unit** (view = 360 art rows), integer upscale |
| Complexity | 6/10: detailed pixel sprites, and every new asset must fit into the light system; dark-but-readable is a balancing act |
| Fonts | UnifrakturMaguntia, Silkscreen, Pirata One, IM Fell English |
| Key colours | `#0b0910` outline · `#687cb2` moon ambient · `#2a422b` grass · `#666d7f` stone · `#bd5314` pumpkin · `#ffcc4a` carved glow · `#6ee03a` toxic eyes · `#8aa0c0` ghosts |

## When to use it

- **Good fits:** night-time action games, horror and Halloween themes, graveyard, crypt or forest maps, and designs where a light radius around the main character matters. The multiply light map gives the darkness for free.
- **Good when** you want atmosphere with readable sprites. Characters and props get only 55 % of the darkening, and eyes are emissive.
- **Bad fits:** bright or cheerful projects, very small sprites (the shading needs about 20 px), and very dense UI. Also avoid it on low-end devices that need hundreds of lights.
- **Risky:** the more warm lights you add, the less special the main character's glow becomes. Keep warm light rare.

## Color palette

Ramps are authored fully lit. Index 0 is the darkest.

| Swatch | Hex | Role |
| --- | --- | --- |
| Ink outline | `#0b0910` | 1-px outline of every sprite |
| Night ground | `#12151e` | clear colour |
| Moon ambient | `#687cb2` (104,124,178) | light-map base, multiplied over everything |
| Soil | `#1e171c #291f25 #36292e #443539 #554441 #69574e` | bare earth |
| Grass | `#141f18 #1a291d #213423 #2a422b #365233 #46653d #5b7b48` | grass tufts |
| Ground moss | `#1a2a20 #223827 #2c492e #385a35 #486d3e #5e844a` | moss carpets |
| Cobble | `#232731 #2f3441 #3d4351 #4d5464 #5f6778 #767e90 #9098a8` | paths, pebbles |
| Flagstone | `#28292f … #9898a2` (7 steps) | plazas, floor slabs |
| Stone | `#1d2030 #2a2e3e #3a3f51 #4e5466 #666d7f #81889a #a2a8b8` | gravestones, pillars, angels |
| Moss | `#1d2b1c #2a3f25 #3a5530 #4f6c3c` | moss on stone |
| Bark | `#151118 #1f1922 #2b232d #3a3039 #4d4049 #63555c` | dead trees, roots |
| Leaves | rust `#3e2018…#985c34`, ochre `#3e3018…#947a42`, plum `#33182a…#80465a`, ash `#2e2a26…#766b5e` | leaf litter |
| Pumpkin | `#3a1206 #652108 #93370c #bd5314 #de7826 #f3a046` | main character's head |
| Carved face | `#b84808 #ff8a1c #ffcc4a #fff4c4` (+ flesh `#eeb060`) | emissive face |
| Cloak | `#0f0b17 #1a1428 #271f40 #372e58 #4f4880` | main character's cloak |
| Scarf | `#2e0b1e #4e1632 #74244a #9a3a62` | main character's scarf |
| Root purple | `#1c0a24 #33123c #4e1c58 #6c2a76 #8a4292 #ab68b0` (variant 2: `#200a1c…#b868a2`) | small creatures' bulb tops |
| Root cream | `#3e3022 #625038 #8a7650 #b09c6a #d2c28c #e8dcae` | small creatures' lower half, lantern body |
| Toxic eye | `#2e8a1e #6ee03a #c8ff7a #f4ffd8` | emissive eyes, large creature's core |
| Ghost | `#1e2840 #3a4a6c #5e7396 #8aa0c0 #b6c8de #e2ecf6` | ghosts |
| Ghost eye | `#1a8aa0 #4ae8ff #c8ffff` | emissive ghost eyes |
| Fire | `#7a1c06 #c8460c #ff8a1c #ffc848 #fff2b8` | embers, flames, seed trails |
| Gem / soul | `#0c3a48 #14808a #36d6c0 #8cfff0 #e8fffa` | collectible gems, rising wisps |
| Blood | `#d8343c` (glass `#8a1a1a`) | red bar, grave lights |
| Tarnished gold | `#a8874c` (hi `#f0d89a`) | UI ornaments |

**Palette rules**

- **Author everything fully lit.** The light map creates the night. Never pre-darken sprites.
- About **90 % cold colour** (blue-grey, violet, moss, plum). **Warm orange and yellow only on light sources and emissive details.**
- **Emissive pixels** (face, eyes, flames, embers, gems, wisps, floating numbers) are drawn after the light and are the brightest pixels on screen.
- Every material has its own 3–7-step ramp. Pick tones with Bayer-8 dither and never alpha-blend them.
- Identify creature families by eye colour (green root creatures, cyan ghosts, green-cored giants) and silhouette.
- Outlines are always near-black `#0b0910`, never pure black and never coloured (except the cool ghost and gem outlines).

## Typography

| Font | Use | CSS |
| --- | --- | --- |
| **UnifrakturMaguntia** (blackletter) | titles, clock label, overlay headings | `font: 400 62px/1 'UnifrakturMaguntia', 'Pirata One', serif; color: #f4e6c4; text-shadow: 4px 4px 0 #000, 0 0 22px rgba(255,140,40,.45);` |
| **Silkscreen** (pixel) | clock digits, bar labels, counters | `font: 400 28px/1.1 'Silkscreen', monospace; color: #e8eefa; letter-spacing: 2px; text-shadow: 3px 3px 0 #000, 0 0 12px rgba(150,180,255,.35);` |
| **Pirata One** | card names, roman numerals I–IV | `font: 400 25px/1.05 'Pirata One', serif; color: #f4e6c4; text-shadow: 2px 2px 0 #000;` |
| **IM Fell English** (italic) | descriptions, hints, body | `font: italic 400 16px/1.25 'IM Fell English', Georgia, serif; color: #c2bad4;` |

Google Fonts: `https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Silkscreen&family=Pirata+One&family=IM+Fell+English:ital@0;1&display=swap`

- Text always gets a **hard black offset shadow** (1–4 px). Warm labels add a faint orange glow, `0 0 8px rgba(255,140,40,.4)`.
- The blackletter label is warm `#f0a850`. Numbers are pale moon-white `#e8eefa` / `#eadfc8`.
- Floating numbers in the world are **3×5 pixel glyphs**, not a font. Normal digits fade from white `#ffffff` through `#f2eef8` to `#b4b4c8` with a `#0c0a12` outline. The emphasised variant is 2× size in `#ffc070`, `#ff5a1e` and `#b81e0e` with a `#2a0606` outline (8-neighbour).

## Rendering technique

1. **Buffer.** `pixelArt.scale = 1`. The upscale factor is `up = max(1, round(screenH / 360))` and the buffer is `ceil(screen / up)`. Draw all world art into it with smoothing off, then upscale with nearest neighbour.
2. **Bake at init.** Build six tileable 256² ground textures (soil, grass, moss, leaves, cobble, flagstone, each `{rgb, thr}`), all props with their moon shadows, every character frame (each with `{r, l}` canvases plus an eye-pixel list), the light sprites, and the fog and cloud textures.
3. **Ground chunks** (256 × 256 px) are generated per pixel in a generator that yields every 16 rows. Then the chunk's decals are drawn into it.
4. **Per frame, in this order:**
   1. ground chunks
   2. two drifting mist layers
   3. **build the light map** (copy the base, add cloud light, stamp point lights) and **multiply it at alpha 1**
   4. shadows (dithered ellipses at alpha 120/255, moon shadows of props at 0.42)
   5. y-sorted props, creatures and main character, painted normally (ghosts at 0.86 alpha)
   6. **multiply the light map again at alpha 0.55**, so sprites only get 55 % of the darkening. Together with step 3 the ground ends up darker than the sprites standing on it.
   7. **bloom** sprites with `globalCompositeOperation = 'lighter'`
   8. **emissive pass:** eye pixels, carved face, giant's core, lanterns, seeds and trails, embers, wisps, sparks, floating numbers
   9. a screen-space red flash tint
5. **Pixel rules:** every blit uses `Math.round` positions. Sprites never scale or rotate (seeds are pre-baked in 16 rotations). Alpha is allowed only for shadows, mist, ghosts, lights and fades.

## World and ground

A moonlit moor and churchyard, generated per pixel at 1 art pixel = 1 world unit and later darkened by the light map (see Atmosphere). All ground colours come from the cold soil, grass, moss, leaf, cobble and flagstone ramps above, picked with Bayer-8 dither. Ground textures have **no outlines**: forms are separated by dark mortar or gap pixels and by cast shadows.

The world is made of **biome fields**, sampled per 8-px grid point and bilinearly interpolated per pixel:

- grass coverage: `smoothstep(0.4, 0.52, warped(x/560) + 0.08 − yard * 0.2)`
- moss selector: `fbm(x/240)`
- leaves: `smoothstep(0.585, 0.68, warped(x/430))`
- paths: two Perlin zero-lines `|a| < 0.028…0.062`
- plazas: `smoothstep(0.61, 0.67, warped(x/640))`
- brightness: `0.9 + 0.2 * fbm(x/420)`
- hue drift
- graveyard density ("yard")

Layers are stacked per pixel, and each one **reveals its texture only where its per-pixel threshold `thr` is below the field value**. That makes borders break up into single grass tufts, loose stones and single leaves instead of clean lines.

1. **Soil:** `v = 0.36 + (fbm(x/32) − .5) * .55 + (fbm(x/8) − .5) * .35` → soil ramp with dither 0.5, plus 1500 lit pebble dots and 110 2–3-px cobble pebbles with a soil shadow.
2. **Grass:** tone from two fbm octaves plus 5200 blades (2–4 px tall, brightening upward, 30 % lean). The threshold is `clamp((fbm(x/16) − .28) / .44 * .72 + worleyDist/8 * .42, 0, .985)`, which forms clumps around Worley cell centres. Pixels within 0.035 of the threshold are darkened × 0.72, so tufts get a dark rim. Moss replaces grass where the moss field is above 0.57.
3. **Leaves:** 2900 leaf shapes of 4–6 px in 4 families (rust, ochre, plum, ash). The first pixel is the lit tone and the last is the dark tone. They are sorted by threshold so leaves appear one by one, and each casts a 1-px (+1, +1) shadow (× 0.72).
4. **Flagstones / cobbles:** rows 12–17 px tall with slabs 15–30 px wide, a lit top row (+0.14) and left column (+0.08), dark bottom and right, chipped corners, and cracks on 28 % of slabs. Cobbles are Worley stones (22 × 28 cells per tile). The mortar is `(d2 − d1) / (2|b − a|) < 0.85`, and each stone is lit `−0.55 rx − 0.8 ry` with a highlight or shadow rim. Mortar areas inside paths turn into dark soil or moss.
5. **3/4 cast shadow:** if the pixel above is stone and this one is not, multiply × 0.62/0.66. Grass over soil gives × 0.8.
6. **Decals:** grave mounds (13 × 21 shaded soil ellipses, optionally mossy), open graves, gnarled bark roots around trees, puddles (dark rim, lighter bottom edge, white-blue moon reflection ellipse), floor slabs with engraved crosses, cracks, moss patches, skulls and bones (text sprites with a 1-px drop shadow), candle stubs, drooping dead flowers in `#5a4a6a #7a6a8a #4a2a3a #6a3a4a #8a8a9a`, twigs and single leaves.
7. **Mist** drifts over the ground in two banded layers before the light map is applied (details in Atmosphere).

Skull decal, verbatim (`a…e` → bone ramp, `e` = eye socket `#0a080c`, drop shadow `#100c12` at alpha 150):

```text
 bbb       ' bbbb '
bbbbc      'abbbbc'
beebc      'beebec'
bcbcd      'bbcbbd'
 ccd       ' cdcd '
```

## Characters

All characters are painted **per pixel** from shaded shapes: ellipse or polygon masks, sphere-normal shading lit from the upper left (normalised −0.52, −0.64, 0.56), `tone = base + shade * k` quantised into a 3–7-step ramp with Bayer-8 dither (strength about 0.3), then wrapped in a **1-px `#0b0910` outline** (4-neighbour). Colours are authored fully lit; the light map darkens characters by only 55 %, and **eyes and faces are emissive pixel lists** drawn after the light so they read in the dark. Each frame stores a right-facing canvas and a mirrored left-facing one. Feet anchor at the outline's bottom row, and every character sits on a dithered shadow ellipse (solid core `< 0.55`, Bayer checker outside, `[6, 6, 14]` at alpha 120).

**Main character (22 × 34 px, 24 × 36 with outline, feet anchor at column 11).** A pumpkin-headed figure in a violet cloak and wine scarf, built per pixel in `makeHero(frame)`:

- **Legs:** 2 px wide, dark trousers `pants[0..2]` (`#110e17 #1d1927 #2b2537`), 4-px boots (`#0d0a0b #211719 #352729`). The back leg uses darker tones. Each pose offsets the legs by ±2 px and lifts the passing foot 1–2 px.
- **Scarf:** a 10 × 3 band in wine ramp `[3, 2, 1]` under the head, plus a tail line flying back to one of 4 offsets `[-8, 3] [-9, 2] [-8, 4] [-7, 5]`.
- **Cloak:** rows from `top = by + 14` to `bot = by + 26`, half-width `4.3 + t * 3.2` (trapezoid). The left edge is lit `CL[4]/CL[3]`, the left 22 % is `CL[3]` and the right 20 % is `CL[1]`. Two fold columns are `CL[1]` and one deep crease `CL[0]`. The hem is ragged (`(x * 7 + 3) % 5`), and the lower cloak sways with the frame. A 2 × 2 glove (`#2a1e1c #463430 #64504a`) peeks out at the right.
- **Head:** an ellipse 7.6 × 6.3 at (10.5, by + 7.2), about 40 % of the height, carrying the colour identity. Tone is `0.47 + shade(n) * 0.42`. Ribs come from `asin(nx)`: grooves −0.17 and ridge centres +0.05. The bottom rim is −0.12. Ramp pick uses dither 0.3. A 5-pixel olive stem (`#1c190f…#6a6832`) sits on top.
- **Carved face:** 28 offsets `[dx, dy, level]` around (12, by + 4), using face ramp `level + 1`. Each pixel gets a `#eeb060` "flesh" pixel below it when the next row is empty, giving a carved depth edge. It is redrawn **after the light** as an emissive overlay with 3 flicker levels.
- **Light:** the largest warm light in the scene, 96 × 78 (see Atmosphere), plus a shadow ellipse 8 × 2.5.
- **Frames:** walk = 8 poses (contact, down, passing, up per leg) `{legs ±2, passing lift 2, bob 0/+1/0/−1, cloak sway, scarf 0–3, hand −1/0/+1}`; the glove swings against the near leg and the head (with stem and carved face) uses the previous pose's body offset, so it lands one frame late. Idle = 4 breath poses on a 1.1 s beat: the body sinks 1 px and the head follows 0.14 s later (and rises later). A dash leaves 3 afterimages (violet `#3a1c5a` silhouettes and one orange `#ff7a1a`) at alpha 0.18–0.54. A struck pose is a white silhouette, followed by blinking at 0.45 alpha.

Carved face offsets, verbatim from the module:

```js
const FACE = [ // [dx, dy, level] -> colour = face ramp[level + 1]
  [-4,0,0],[4,0,0], [-4,1,1],[-3,1,0],[3,1,0],[4,1,1], [-4,2,1],[-3,2,2],[-2,2,1],[2,2,1],[3,2,2],[4,2,1],
  [0,3,1], [-4,4,0],[4,4,0], [-4,5,1],[-3,5,2],[-1,5,2],[0,5,2],[1,5,2],[3,5,2],[4,5,1],
  [-3,6,1],[-2,6,2],[-1,6,1],[1,6,1],[2,6,2],[3,6,1],
];
```

**Small creature (purple root creature with a leafy top, 20 × 26 + outline):**

- **Bulb:** an ellipse 7.4 × 7 lit `0.42 + shade * 0.45`. The top is purple and the bottom cream, with a wavy boundary `ny − (0.12 + 0.1 sin(5nx))` dithered over 0.14.
- **Leaves:** 3–4 leaves (`#122012 #1c341c #2a4c26 #3c6532 #557f42`), rotated tapered ellipses (width `1.9 sin(πt·0.9 + .15)`), with a lit upper side, dark midrib and wilted brown tips (last 20 %, `#3e3420 #5a4c2a #78683a`). They sway ±7° over the 4 frames.
- **Details:** purple veins (4 random walks), 2 cream root legs, root hairs.
- **Face:** angry dark brows `#14061a`, **emissive green eyes** (`eyeG`), and a dark mouth with two cream teeth.
- **Variants:** two palette variants (purple / wine-purple) with 3 or 4 leaves. Shadow ellipse 6 × 2.

**Fast creature (skeletal ghost, 27 × 28 + cool `#141a2e` outline):**

- **Body:** a skull ellipse 4.3 × 4.6 and a torso 3.8 × 4.2 with 3 white rib rows and a spine, in the pale ghost ramp.
- **Face:** square black eye sockets `#070a14` with **cyan emissive eyes**, and a gaping 2 × 4 mouth.
- **Arms:** one arm reaches forward with a 3-finger hand (`reach` 0/1/2/1).
- **Tail:** a wavy tail (`sin(3.4t + phase)`) that **dissolves via Bayer dither** below row 21 (`dith < (y − 21) / 8`, pixels deleted).
- **Drawing:** drawn at 0.86 alpha, floating on an eased lift `3 + [0,0,1,2,3,3,2,1]` px at 5 fps (holds at the top and bottom), with a pale 16 × 13 light, a 3-pixel icy trail and a faint 4 × 1.5 shadow at alpha 70.

**Large creature (cracked root giant, 46 × 54 + outline):**

- **Legs and arms:** 2 bark legs 6 px wide, and long gnarled arms with 3-claw hands that swing ±2 px.
- **Crown:** 5 stalk crowns with wilted tips.
- **Body:** a 15.5 × 16 ellipse, purple top over bark-brown `kBark`. It is cracked by Worley edges (`f2 − f1 < 0.13` → `#0e0810`) and has moss on the crown.
- **Core:** a **glowing green diamond core** (core ramp, pulsing +1 level when `sin(4t) > 0.5`). It has a 36 × 29 green light and green bloom.
- **Face:** a brow line, 3-pixel green eyes, and a crooked mouth crack. Shadow ellipse 15 × 4.

## Props

Props are painted per pixel like the characters (upper-left moon light, ramp quantisation with Bayer dither, 1-px `#0b0910` outline), but built on a **tone canvas**: each pixel holds a material id (stone, moss, bark, iron) and a tone, and edge rules are applied before the ramp pick (+0.17 left edge, +0.1 top, −0.15 right, −0.08 bottom; trees use stronger left light +0.32). They are y-sorted with the characters and get the same 55 % light-map darkening.

- **Gravestones:** 9 shapes (round, arch, cross, obelisk, broken, wide, small, …) × 3 tilts (0, −0.09, +0.08). The tone canvas holds a lit front face (`0.42 + 0.2 * height`), a 2-px extruded side/top (tones 0.74 / 0.2), and the edge rules. Engraved crosses use a dark groove (0.05) next to a lit lip (0.66), plus cracks. Moss (`#1d2b1c…#4f6c3c`) grows from the top edge and the bottom 4 rows.
- **Celtic ring crosses** (24 × 38): a shaft with a ring of radius 4.2–6.2, knotwork hints on the shaft (tone 0.3), heavy moss.
- **Broken pillars** (22 × 36): a 4-row capital and a shaft broken off at a jagged height of 16–26 px, flute grooves every 2 px, moss, and 4 bits of rubble around the base.
- **Weeping angels** (34 × 50): a 9-row pedestal with a 2-px dark side, two polygon wings behind, a robe with fold lines every 3 px, a bowed head with raised arms, moss and dark weathering streaks.
- **Dead trees** (70 × 92): recursive branches (depth ≤ 4, ≤ 220 segments) stamped as discs, with flared roots and a knot hole. They use the bark ramp with strong left lighting (+0.32).
- **Iron fences:** segments 13 px wide with two rails and 4 bars ending in spear tips (iron ramp `#0e0e15 #1a1a25 #2a2a3a #424258 #5e5e78`), between 5-px stone posts with a capped top.
- **Candle clusters** (16 × 14): 3–5 wax candles (`#6e6656 #a49c84 #d0c8ae #ece6d0`) 3–9 px tall over a wax puddle, with 1–2-px flames that animate in 3 frames and a 34 × 26 warm light.
- **Grave lights:** 1 in 6 graves has one, a red glass lantern (`#8a1a1a` glass, `#ff8a5a / #ff6a4a` flame, `#ffe0a0` hot pixel) with a 20 × 15 red light and red bloom.

Every prop gets a **moon shadow**: each opaque pixel at height `h` above the base is copied to `(x + 0.55h, 1 + 0.3h)` in near-black `[5, 5, 12]` (2 px tall), drawn at alpha 0.42. Shadows fall to the lower right because the moon is upper left.

## Effects and particles

Effects are mostly **emissive**: drawn after the light pass with warm fire, teal gem or icy colours, always as whole pixels, often with their own small banded light sprite in the light map and a little `'lighter'` bloom.

- **Projectile (seed):** a 9 × 9 cream seed (`seed` ramp `#5e4428 #9a7c4e #cdb47e #eee0b0 #fffaea`, `#2a1606` outline) pre-baked in 16 angles. The trail is 4 pixels `#ffc848 #ff8a1c #c8460c #7a1c06` at `3 + 2.2j` px behind (2 px, then 1 px), alpha `1 − 0.2j`. It also gets a 14 × 11 warm light and 5 × 5 bloom.
- **Embers:** the main character's head emits one ember every 0.16 s (1 px, ±1 px wobble). The colour steps down the fire ramp with remaining life (> .75 → `#fff2b8`, … → `#c8460c`). Embers are emissive.
- **Impact burst:** root creatures spray 3–5 juice pixels (`#3a0a26 #64123e #901c52 #bc3068`) that land as 2-px puddles, plus white/yellow sparks with a 1-px tail. Ghosts give frost sparks `#dffaff #a8e8ff #ffffff`.
- **Vanish:** the sprite is white for 0.18 s, then at half alpha until 0.4 s, under a white flash light (15 × 13, large creatures 28 × 24). Then come chunks (2–3-px squares with a dark underside), a mist puff for ghosts, and a **wisp**: a 7 × 12 teal soul shape with a dithered tail and its own 14 × 14 light, rising.
- **Collectibles (gems):** small gems are 6 × 8 (large: 8 × 11) diamonds in the teal gem ramp with a `#061c24` outline. A glint travels down the left facet over 4 frames. Each has its own 10 × 8 (22 × 18) cyan light, and large gems add cyan bloom. Collecting one shows a cross-shaped glint in `#e8fffa` with 4 outer dots.
- **Orbiting objects (lanterns):** 13 × 15 purple/cream root lanterns on an iron handle, with fire-ramp eyes and mouth (3 frames), a 42 × 34 light and bloom. They are drawn emissive.
- **Ring burst:** an expanding **broken ember circle** (r = 4…40 in steps of 3, y squashed 1.25): dashes of `rgb(255,244,206)` / `rgb(255,168,78)` with gaps, carrying six small ember crosses (`#fff0c4` centre, `#ff963c` arms, a dark-red foot) over 0.6 s, with 18 embers and 4 wisps — never a plain circle.
- **Disappear:** a pale flash (16 % of the sequence); then ground creatures are **dragged back into the grave soil** — their visible height shrinks (`inQuad`) behind the dirt heap — while chunks, juice and a soul wisp fly; ghosts rise 13 px and thin out.
- **Emerge:** ground creatures are revealed bottom-up (outQuad) from an outlined dirt heap. Ghosts fade in from mist while dropping 8 px.
- **Red flash:** a red 60 × 50 light on the main character, orange/yellow sparks, and a screen tint (see Atmosphere).

## Atmosphere and lighting

The night is one **light map** canvas the size of the art buffer, rebuilt every frame and multiplied over the image. All colours stay authored fully lit; this pass alone produces the darkness, the vignette and the warm pools of light.

1. **Base** (baked per size): ambient `rgb(104,124,178)` × `f`. The vignette is `v = smoothstep(0.5, 1.12, dist)` with `dist` normalised by (0.6 W, 0.62 H) and the centre 6 px above the middle. `v` is posterised to 5 bands with ±0.4 Bayer dither, and `f = 1 − v * 0.5` (edges down to 50 %).
2. **Cloud light:** a banded tileable cloud texture `rgb(22,26,38)` drawn at 512 px scale with `'lighter'`, drifting at (7, 3) px/s.
3. **Point lights:** `makeLight(rx, ry, inner, outer, maxA, bands, pow)` sprites. Falloff `f = (1 − d)^pow` is posterised to `bands` with Bayer dither, the colour mixes outer → inner, and alpha = `q * maxA`. They are drawn `source-over` with alpha = flicker:

| Light | Size (rx × ry) | Inner → outer | Bands |
| --- | --- | --- | --- |
| main character | 96 × 78 (pow 0.85) | (255,214,160) → (255,140,60) | 7 |
| lantern | 42 × 34 | (255,206,140) → (255,120,40) | 5 |
| candle | 34 × 26 | (255,200,120) → (255,110,40) | 5 |
| grave light | 20 × 15 | (255,150,110) → (220,50,40) | 4 |
| projectile | 14 × 11 | (255,214,150) → (255,140,60) | 3 |
| small / large gem | 10 × 8 / 22 × 18 | (200,255,240) → (80,230,210) | 3 / 4 |
| ghost | 16 × 13, alpha 0.5 | (200,225,255) → (140,180,255) | 3 |
| giant's core | 36 × 29 | (190,255,160) → (80,210,80) | 4 |
| red flash | 60 × 50 | (255,120,100) → (200,30,30) | 4 |

**Flicker:** `flick(t, seed) = 0.86 + 0.09 * perlin(7.3t, 17.1seed) + 0.05 * sin(23t + 40seed)`. The main-character light is also scaled by `0.985 + fl * 0.02` and grows × (1 + 0.3 · ringT) during the ring burst.

**Apply:** use `globalCompositeOperation = 'multiply'` with the light canvas, at alpha 1 after the ground and at alpha 0.55 after the sprites. Ambient moonlight is about 45 % blue brightness, so nothing goes pitch black.

**Bloom:** small banded warm sprites (11 × 10 at 0.32 maxA for the main character and lanterns, 6 × 6 for candles, red 6 × 5 for grave lights, green 12 × 12 for cores, cyan 5 × 5 for large gems) are added with `'lighter'`.

**Shadows:** sprite shadows are dithered ellipses (solid core `< 0.55`, Bayer checker outside) in `[6, 6, 14]` at alpha 120. Sizes: main character 8 × 2.5, small creature 6 × 2, large creature 15 × 4, ghost/gem 4 × 1.5 at 70 alpha. Props cast sheared moon shadows toward the lower right (`[5, 5, 12]` at 0.42).

**Mist:** two tileable banded fog textures (3 alpha levels, max 0.2 / 0.12, `rgb(196,208,232)`), at scale 2 and 1, drifting at (5, 1.5) and (−7, 2) px/s, drawn before the light so they are darkened too.

**Red flash tint:** multiply the light base at `flashT * 0.35`, then fill `#6a0010` at `flashT * 0.18`.

## UI

- **Top bar:** a full-width teal bar, 14 px tall, in an iron frame. The fill is a horizontal-band gradient `#c8fff0 / #5fd8bc / #2a9688 / #17565a` with dark 2-px separators every 30 px. A Silkscreen 10 px counter sits at the right.
- **Red bar:** 236 × 18, red bands `#ffb0a0 / #d8343c / #9a1822 / #5c0c14` with separators every 24 px, a 32-px pixel heart icon, and Silkscreen `100/100`.
- **Clock:** a dark box with clipped top corners, gold pixel crosses on both sides, Silkscreen 28 px time, and a blackletter warm label.
- **Skull counter:** a pixel skull icon with Silkscreen 20 px.
- **Iron frame:** a 2-px grey frame `#4d5266`, a 2-px black outline, an inset black line and a hard drop shadow. No rounded corners.
- **Tarot cards:** 206 × 300, a radial navy-violet background, a 3-px tarnished gold border and inner bronze line, pixel corner ornaments (10 × 10 sprites rotated 4×), roman numerals, an arched icon window with a warm glow, Pirata One names with a gold rule, and italic IM Fell English descriptions. Hover lifts the card by 8 px and adds an orange glow.

```css
.frame { border: 2px solid #4d5266; outline: 2px solid #06070b; border-radius: 0;
  box-shadow: inset 0 0 0 2px #06070b, inset 0 2px 0 2px #1a1c28, 0 4px 0 2px rgba(0,0,0,.45); }
.bar-top { height: 14px; background: #0b0c13; position: relative; overflow: hidden; }
.bar-top-fill { height: 100%; background: linear-gradient(#c8fff0 0 2px, #5fd8bc 2px 6px, #2a9688 6px 9px, #17565a 9px); }
.bar-top::after { content: ''; position: absolute; inset: 0;
  background: repeating-linear-gradient(90deg, transparent 0 30px, rgba(6,7,11,.75) 30px 32px); }
.bar-red-fill { height: 100%; background: linear-gradient(#ffb0a0 0 2px, #d8343c 2px 8px, #9a1822 8px 12px, #5c0c14 12px); }
.clock { padding: 4px 32px 6px; background: linear-gradient(#141624, #090a10);
  clip-path: polygon(0 10px, 10px 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%); }
.clock-time { font: 400 28px/1.1 'Silkscreen', monospace; color: #e8eefa; letter-spacing: 2px;
  text-shadow: 3px 3px 0 #000, 0 0 12px rgba(150,180,255,.35); }
.clock-label { font: 400 17px/1 'UnifrakturMaguntia', 'Pirata One', serif; color: #f0a850;
  text-shadow: 2px 2px 0 #000, 0 0 8px rgba(255,140,40,.4); }
.card { width: 206px; min-height: 300px; border: 3px solid #a8874c; outline: 3px solid #06070b; image-rendering: pixelated;
  box-shadow: inset 0 0 0 3px #0b0a10, inset 0 0 0 5px #5a4628, 0 14px 30px rgba(0,0,0,.75);
  background: radial-gradient(ellipse at 50% 32%, #2e2848 0, #18152a 45%, #0b0a12 100%); }
.card-name { font: 400 25px/1.05 'Pirata One', serif; color: #f4e6c4; text-shadow: 2px 2px 0 #000; }
.card-desc { font: italic 400 16px/1.25 'IM Fell English', Georgia, serif; color: #c2bad4; }
```

Icons are 16 × 16 painted pixel sprites in the same ramps (heart, skull, seeds, lantern, shoe…), scaled by an integer factor.

## Motion and animation

- **Main character:** 8 walk poses at `floor(anim · 1.3) & 7` (~12 fps), the head one frame behind the body, the glove counter-swinging; 4 idle breath poses (1.1 s beat, head 0.14 s behind) with a per-figure phase. The scarf tail cycles 4 positions and the cloak sways ±1 at the hem.
- **Small creature:** 4 frames at anim × 1.6 (bob 0/−1/0/−1, tilt 0/+1/0/−1, leaf sway 0/+7°/0/−7°, alternating leg lifts). **Large creature:** 4 frames at anim × 2 (body bob, arm swing ±2, leg lift 2 px).
- **Ghost:** 4 frames at 7 fps (tail phase steps of π/2, arm reach 0/1/2/1). Float is the eased lift `3 + [0,0,1,2,3,3,2,1]` px at 5 fps (per-creature phase). A 3-pixel trail shows when speed > 10.
- **Light:** continuous flicker (see above). Lantern eyes cycle 3 frames at 10 fps with a ±1 px sway at 5 rad/s. Candle flames have 3 frames at 9 fps.
- **Gems:** 8-step cycle at 5 fps (glint frames 0–3, then frame 3 held), bob ±1 px at 3 rad/s, a pop arc of up to 6 px.
- **Floating numbers:** pop up 2 px for the first 0.1 s, then fade in 3 alpha steps (1, 0.66, 0.33).
- **Ambience:** mist drifts at 5 and −7 px/s, cloud light at (7, 3) px/s.

## Do and don't

**Do**

- Paint sprites per pixel from lit shapes and quantise them into ramps with Bayer-8 dither.
- Author colours fully lit and let one multiplied light map create the night.
- Give the main character the biggest warm light, and keep warm colour for light sources.
- Draw eyes, faces, flames, gems and numbers after the light pass.
- Posterise light falloff into bands with dithered edges.
- Outline every sprite with `#0b0910` and cast sheared moon shadows toward the lower right.
- Break up material borders with per-pixel thresholds (single tufts, stones, leaves).

**Don't**

- Don't go pitch black. Ambient moonlight is about 45 % blue, and sprites get only 55 % of the darkening.
- Don't put saturated or warm colours on ordinary surfaces.
- Don't use smooth gradients or blur for lights and fog.
- Don't draw emissive details before the light (they get darkened).
- Don't use clean material borders or visibly repeating tiles.
- Don't use pure black or thick outlines.
- Don't flood the screen with warm lights. The main character must stay the focal glow.

## Implementation recipe

1. Set up a 1:1 art buffer: 360 rows tall, integer upscale, smoothing off.
2. Write the helpers: `Pix` (set, ellipse, line, outline, canvas), Bayer-8 `dith(x, y)`, `pick(ramp, tone, x, y, dither)`, and `shade(nx, ny)` with light direction (−0.52, −0.64, 0.56).
3. Define 3–7-step ramps per material, cold for the world and warm only for lights.
4. Paint the main character: ellipse head with sphere shading, cloak, scarf, legs, then the outline. Bake 4 walk and 2 idle frames plus an emissive face overlay with 3 brightness levels.
5. Paint each creature family the same way, and record the **eye pixels** of each frame for the emissive pass. Give floating creatures a dithered fade and 0.86 alpha.
6. Build props with a tone canvas (front face, extruded side, edge rules, moss), outline them, and bake a moon shadow per prop.
7. Generate the ground per pixel: biome fields → layered textures with per-pixel thresholds → cast shadows → decals. Bake it in chunks.
8. Build `makeLight` sprites for every light type and a base light map with a banded vignette.
9. Each frame: ground → mist → light map (copy base, clouds, point lights × flicker) → multiply 1 → shadows → y-sorted sprites → multiply 0.55 → bloom (`lighter`) → emissive pixels → UI.
10. Tune readability: check that every creature shows its eyes and silhouette at the edge of the light, and lower the vignette or raise `ENT_A` if not.

## Code

These blocks are standalone and dependency-free. `starter.js` has the full preview: main character, root creatures, ghosts, gravestones, ground, light map, bloom, emissive pass and HUD. The full reference module is `../../js/styles/gothic.js` (2600 lines, with the large creature, trees, angels, fences and flagstones).

**1. Bayer-8 dither, ramp pick and moon shading: the core of every sprite.**

```js
const BAY = [];
for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
  let v = 0;
  for (let i = 0; i < 3; i++) { const bx = (x >> i) & 1, by = (y >> i) & 1; v += (((bx ^ by) << 1) | by) * 4 ** (2 - i); }
  BAY.push((v + 0.5) / 64);
}
const dith = (x, y) => BAY[((y & 7) << 3) | (x & 7)];
// tone 0..1 -> ramp entry; d = dither strength (0.3 sprites, 0.5 ground)
function pick(ramp, v, x, y, d) {
  let i = Math.floor(v * ramp.length + (d ? (dith(x, y) - 0.5) * d : 0));
  return ramp[Math.max(0, Math.min(ramp.length - 1, i))];
}
const L = [-0.52, -0.64, 0.56], ln = Math.hypot(...L), LD = L.map((v) => v / ln); // moon: upper left, high
const shade = (nx, ny) => nx * LD[0] + ny * LD[1] + Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)) * LD[2];
// usage: a ribbed pumpkin head on an RGBA pixel buffer
function paintPumpkin(set, cx, cy, rx, ry, ramp) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
    const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
    if (nx * nx + ny * ny > 1) continue;
    let v = 0.47 + shade(nx, ny) * 0.42;
    const sf = (Math.asin(nx) / (Math.PI / 2)) * 2.6 + 0.5, fr = sf - Math.floor(sf);
    if (fr < 0.13 || fr > 0.94) v -= 0.17; else if (fr > 0.42 && fr < 0.58) v += 0.05; // rib grooves / ridges
    if (ny > 0.74) v -= 0.12;
    set(x, y, pick(ramp, v, x, y, 0.3));
  }
}
```

**2. Banded light sprites and the per-frame light map.**

```js
function makeLight(rx, ry, inner, outer, maxA, bands, pw) {
  const w = Math.ceil(rx) * 2, h = Math.ceil(ry) * 2, c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d'), img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = Math.hypot((x + 0.5 - w / 2) / rx, (y + 0.5 - h / 2) / ry);
    if (d >= 1) continue;
    const q = Math.min(1, Math.floor(Math.pow(1 - d, pw) * bands + (dith(x, y) - 0.5) * 0.55 + 0.35) / bands);
    if (q <= 0) continue;
    const o = (y * w + x) * 4;
    for (let k = 0; k < 3; k++) img.data[o + k] = outer[k] + (inner[k] - outer[k]) * q;
    img.data[o + 3] = Math.round(q * maxA * 255);
  }
  g.putImageData(img, 0, 0);
  return c;
}
const mainLight = makeLight(96, 78, [255, 214, 160], [255, 140, 60], 1, 7, 0.85); // main character's warm light
const flick = (t, s) => 0.86 + 0.09 * Math.sin(t * 7.3 + s * 17.1) * Math.cos(t * 3.1) + 0.05 * Math.sin(t * 23 + s * 40);
// lightCtx: same size as the art buffer; base = ambient (104,124,178) with banded vignette (baked once)
function buildLight(lightCtx, base, lights, t) {
  lightCtx.globalCompositeOperation = 'copy'; lightCtx.globalAlpha = 1; lightCtx.drawImage(base, 0, 0);
  lightCtx.globalCompositeOperation = 'source-over';
  for (const L of lights) {                   // {spr, x, y, seed}
    lightCtx.globalAlpha = Math.min(1, flick(t, L.seed));
    lightCtx.drawImage(L.spr, Math.round(L.x - L.spr.width / 2), Math.round(L.y - L.spr.height / 2));
  }
}
function applyLight(ctx, lightCanvas, alpha) {   // 1 after the ground, 0.55 after the sprites
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = alpha;
  ctx.drawImage(lightCanvas, 0, 0); ctx.restore();
}
```

**3. Outline pass and moon shadow for props.**

```js
// p: { w, h, d: Uint8ClampedArray RGBA }. Returns a new buffer 2 px larger with a 1-px outline.
function outline(p, col = [11, 9, 16]) {
  const W = p.w + 2, H = p.h + 2, d = new Uint8ClampedArray(W * H * 4);
  const al = (x, y) => (x < 0 || y < 0 || x >= p.w || y >= p.h ? 0 : p.d[(y * p.w + x) * 4 + 3]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const sx = x - 1, sy = y - 1, t = (y * W + x) * 4;
    if (al(sx, sy)) d.set(p.d.subarray((sy * p.w + sx) * 4, (sy * p.w + sx) * 4 + 4), t);
    else if (al(sx - 1, sy) || al(sx + 1, sy) || al(sx, sy - 1) || al(sx, sy + 1)) d.set([...col, 255], t);
  }
  return { w: W, h: H, d };
}
// shadow pixel for every opaque pixel, sheared by its height above the base row (moon upper left)
function moonShadow(p, baseY, kx = 0.55, ky = 0.3) {
  const out = [];
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
    if (!p.d[(y * p.w + x) * 4 + 3]) continue;
    const h = Math.max(0, baseY - y), sx = Math.round(x + h * kx), sy = Math.round(1 + h * ky);
    out.push([sx, sy], [sx, sy + 1]);            // drawn in [5,5,12] at alpha 0.42 below the prop's base
  }
  return out;
}
```

**4. Ground layering with per-pixel thresholds (tufts that dissolve at the edge).**

```js
// cover: grass coverage field 0..1 at this pixel; thr: per-pixel threshold texture (clumps); rgb: grass texture colour
function layerGrass(base, cover, thr, rgb) {
  if (cover <= 0.003 || thr >= cover) return { col: base, layer: 0 };
  let col = rgb;
  if (cover - thr < 0.035 && cover < 0.97) col = col.map((v) => v * 0.72);  // dark rim where a tuft ends
  return { col, layer: 1 };
}
// 3/4-view cast shadow: stones darken the pixel below them, grass darkens soil below it
function castShadow(col, layerAbove, layer) {
  if (layerAbove === 4 && layer < 4) return [col[0] * 0.62, col[1] * 0.62, col[2] * 0.66];
  if (layerAbove === 1 && layer === 0) return col.map((v) => v * 0.8);
  return col;
}
```

## Adapting it to your project

- **Keep fixed:** 1:1 pixel art with a near-black outline, ramp quantisation with Bayer-8 dither, the moon from the upper left, the two-step multiply (ground 1.0 / sprites 0.55), posterised light sprites, the emissive pass, cold-world/warm-light colour logic, and the iron and blackletter UI.
- **Re-theme by swapping ramps:** a crypt could use stone and flagstone everywhere with green torches (swap the fire ramp for a toxic one). A frozen moor could raise the ambient to `(130,150,200)` and use ice-blue lights. A swamp could use moss ramps with purple will-o'-wisps. Keep the ambient blue and the light sources the only saturated colour.
- **New creatures:** pick a silhouette and **one eye colour** per family, then give them a light or glow if they must be found in the dark. Paint around 20–30 px for small creatures and 45–55 px for large ones, with 4 frames.
- **Mixing elements:** the characters work on other worlds as long as a dark multiply pass or a dim ground keeps their emissive eyes special; the light map and mist (Atmosphere) can darken a world from another style if its colours are authored fully lit.
- **Other genres:** platformers can use the same light map (a radius around the main character and torches on walls). Strategy games need a brighter ambient (`ENT_A` up to 0.4) and larger sprites.
- **Other resolutions:** keep about 360 art rows. Going much lower loses the shading detail, and much higher makes the per-pixel ground expensive.

## Performance notes

- Init is the expensive part. Six 256² textures, about 30 gravestones, 4 trees, around 100 character frames, 20 light sprites, and the fog and cloud textures take roughly 0.5–1 s. Bake them once and show a loading frame.
- Ground chunks are generated per pixel in a generator that yields every 16 rows, with fields sampled on an 8-px grid and interpolated. Budget about 5 ms per frame for chunk work.
- Per frame: one light-map rebuild (one canvas copy, cloud tiles, one `drawImage` per light), **two full-buffer multiply blits**, a few dozen bloom blits, and `fillRect` per emissive pixel. Keep visible lights to a few dozen and the eye list small (6 pixels per creature).
- Reuse the light-map canvas, and cache the vignette base per buffer size. The starter scene runs in about 1 ms.

## Copy-paste prompt

```text
Use the Gothic Night art style for my project:
- 1 art pixel = 1 world unit, ~360 art rows, integer nearest-neighbour upscale; every sprite has a 1-px #0b0910 outline.
- Paint sprites per pixel: ellipses/shapes shaded with sphere normals lit from the upper left (-0.52,-0.64,0.56),
  tone = 0.45 + shade*0.42, picked from 3-7 step colour ramps with Bayer-8 dither. No smooth gradients.
- Cold, desaturated ramps for the world (blue-grey stone #666d7f, night grass #2a422b, soil #36292e, violet, moss, plum
  leaves). Warm orange/yellow (#bd5314, #ff8a1c, #ffcc4a) ONLY on light sources.
- Author colours fully lit. Each frame build a light map: ambient rgb(104,124,178) with a 5-band dithered vignette,
  drifting cloud light, and posterised radial light sprites (main character 96x78 warm, lanterns 42x34, candles, red
  grave lights, cyan gems, pale ghost glows). Flicker 0.86 +/- 0.14. Multiply it onto the ground at 100 %, draw the
  y-sorted sprites, multiply again at 55 %, add small warm bloom with 'lighter'.
- Emissive pass after the light: creature eyes (green #6ee03a, cyan #4ae8ff), the carved glowing face of the main
  character, flames, embers, seeds, gems, wisps, floating numbers.
- Ground per pixel: dithered soil, grass tufts and leaves revealed by per-pixel thresholds (borders dissolve into
  single tufts/leaves), Worley cobbles with lit top-left edges, 3/4 cast shadows, decals (skulls, candles, mounds).
- Props: mossy gravestones with extruded sides and sheared moon shadows toward the lower right, dead trees, fences.
- Two drifting banded mist layers (alpha <= 0.2). 4-frame walks, 2-frame idles, ghosts at 86 % alpha with dithered tails.
- UI: iron frames (#4d5266 + black), Silkscreen numbers with hard black shadows, UnifrakturMaguntia labels in #f0a850,
  Pirata One / IM Fell English on tarot-style gold-framed cards.
```
