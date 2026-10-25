# Harvest 16-Bit — Game Art Style Spec

> Cozy SNES-era autumn farmland: warm hue-shifted pixel sprites, leaf-litter carpets, furrowed fields and wooden HUD panels.

A sunny autumn afternoon on the farm in true 16-bit pixel art. One art pixel equals one world unit; the
low-res buffer is upscaled by an integer factor with nearest-neighbour sampling. Every sprite is *painted
by code* into a tiny pixel grid: ellipses and tapered leaves whose sphere normals are lit by one shared
top-left light, quantised into 3–5 step hue-shifted ramps (plum shadows, butter-yellow highlights), and
finished with an automatic 1-px outline coloured from the sprite itself. The ground is a baked material map
of three meadow greens, sunken dirt paths, ploughed fields and leaf carpets under round orange, red and gold
trees. A warm soft-light grade and a plum vignette sell the late-afternoon mood. The module's cast is a
pumpkin-headed main character with a carved glowing face, purple root creatures with leafy tops, pale
ghosts and a lumpy root colossus; any chibi cast works.

## At a glance

| Property | Value |
| --- | --- |
| Family | Pixel Art · SNES 16-bit |
| Mood | cozy, warm, nostalgic, harvest-time, gently spooky |
| Best for | top-down action games with many sprites, farming sims, cozy RPGs, harvest/Halloween themes |
| Renderer | Canvas 2D, procedural, no image assets |
| Pixel art | yes, `scale: 1` (1 art px = 1 world unit, 360 units of view height) |
| Complexity | 5/10 — new 16-bit sprites with 4 walk frames as code/text grids are painstaking, especially large creatures |
| Fonts | Pixelify Sans (400–700), Silkscreen (400, 700) |
| Key colours | `#77963b` meadow, `#de6e2c` pumpkin, `#713488` root purple, `#bc5a2f` leaves, `#ffc640` ember, `#24162a` ink plum |

## When to use it

- **Good fits:** top-down action games, farming and life sims, cozy adventure RPGs, seasonal
  (autumn, harvest, Halloween) projects, anything that wants "SNES classic" warmth with crowds of readable sprites.
- **Good because:** sprites are small (20–30 px), outlined and saturated against a calmer ground, so even
  100+ creatures on screen stay readable; everything is baked so it runs fast.
- **Bad fits:** sci-fi/neon, grim horror (too friendly), painterly or high-res projects, very zoomed-out maps
  (the 1 px = 1 unit detail turns into noise), projects needing smooth rotation/scaling of sprites.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Meadow Green | `#77963b` | Base grass, ~45 % of the screen |
| Tuft Shade | `#617f38` | Dark stem pixels of grass tufts |
| Tuft Light | `#8ea945` | Lit tuft pixels (brightest tip `#a6bd55`) |
| Golden Grass | `#9a9d45` | Dry yellow-green meadow patches |
| Clover Green | `#5b893f` | Deep clover patches with trefoils |
| Furrow Soil | `#8a5a3c` | Ploughed field (6-step furrow ramp `#a26e44 #8a5a3c #784d36 #664132 #50332f #5c3a31`) |
| Dirt Path | `#b08a5a` | Paths (light `#c4a06a`, bright `#d6b882`, dark `#987450`, rut `#9e7a50`) |
| Path Shadow | `#755244` | Shadow band under grass edges (second row `#8f6a4c`) |
| Leaf Litter | `#7c3531` | Ground between leaves (zones: `#7c3531 #86412f #93582f #8d4a2d`) |
| Rust Leaf | `#bc5a2f` | Leaf mid tone (sets: red `#c8563b/#a33b31/#7c2b33`, orange `#eda146/#d88437/#ab5e2f`) |
| Gold Leaf | `#d6a944` | Gold leaves `#efcb5d/#d6a944/#a67c37`, golden canopies |
| Pumpkin Orange | `#de6e2c` | Pumpkin ramp `#74282a #b0462a #de6e2c #f59a3c #ffc76c` (main character head, pumpkins) |
| Cloak Green | `#336046` | Cape ramp `#1b3236 #26473e #336046 #447a4c #5c9652` |
| Mustard Scarf | `#cc842e` | Scarf ramp `#8e4e26 #cc842e #f2be4c` |
| Root Purple | `#713488` | Root creature crowns, ramp `#2c1740 #4c235f #713488 #9654a8 #bf80c8` (magenta `#381634 … #d07e98`) |
| Root Cream | `#dcc290` | Root creature bulb flesh, ramp `#8a6458 #b8946e #dcc290 #f2e2b0 #fff6da` |
| Ghost Ice | `#a6bee2` | Ramp `#465482 #7488bc #a6bee2 #d4e6f6 #f6fcff`, outline `#33406c` |
| Ember Glow | `#ffc640` | Glow ramp `#f2902a #ffc640 #fff2a8` (flicker `#e07a26 #ffaa34 #ffde7a`) |
| Ink Plum | `#24162a` | Outline target, darkest pixels |
| HUD Wood | `#8f5c34` | Wooden panels, border `#2b170f`, text `#fff3d6` |

Other ramps used: leaf/foliage `#22402c #356432 #4f8c3a #78b246`, bark `#3a2228 #5a3428 #7c4c32 #9e6c44`,
wood `#3e2420 #64402a #8c5e36 #b8844c #d8aa6a`, straw `#7a5a2a … #faeaa0`, stone `#5a5064 #8a8090 #b8aea8 #e0d8c8`,
root legs `#6e5040 #a2845e #cdb282`. Tree canopies: orange `#5a2230 #963a2c #c95c2c #ea8a36 #f7ba5c`, red
`#461a30 #782434 #a6362f #cb5639 #e8844e`, gold `#573826 #946629 #c69832 #e6c24a #f6e084`, turning
`#253e3a #476636 #8a8a34 #cc8a34 #f0ba58` (green core, orange tips).

**Rules**
- Every material is a hue-shifted ramp: shadows drift to purple/plum, light drifts to yellow/cream. Never darken with black.
- Ground ≈ 70 % greens + browns; the saturated orange/red/gold comes from trees and leaf carpets.
- Characters are warmer and more saturated than the ground: pumpkin orange, root purple, cream, ember yellow.
- Ghosts are the only cool colour. Glow yellows only appear in faces, eyes, gems, lanterns, sparkles.
- No pure black; pure white only in 1-px sparkle centres and the flash silhouette.

## Typography

- **Pixelify Sans** 400/500/600/700 — titles, card names, descriptions.
  `https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;500;600;700&display=swap`
- **Silkscreen** 400/700 — HUD numbers (bar text, counters, clock, key hints).
  `https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&display=swap`

Text always gets a chunky pixel outline built from 8-direction hard `text-shadow`s plus one extra row
below (drop). The module generates it with `OUT(color, s)`:

```css
.title { font: 700 60px 'Pixelify Sans', monospace; color: #ffd36a; letter-spacing: 3px;
  text-shadow: 4px 0 #3b1d10, -4px 0 #3b1d10, 0 4px #3b1d10, 0 -4px #3b1d10, 4px 4px #3b1d10,
    -4px 4px #3b1d10, 4px -4px #3b1d10, -4px -4px #3b1d10, 0 8px #3b1d10, 4px 8px #3b1d10, -4px 8px #3b1d10; }
.clock { font: 400 34px 'Silkscreen', monospace; letter-spacing: 2px; color: #ffe08a; }  /* + OUT(#2b170f, 3) */
.hud-num { font: 700 24px 'Silkscreen', monospace; color: #fff3d6; }                      /* + OUT(#2b170f, 2) */
```

In-world floating numbers are **not** fonts: 3×5 bitmap digits (emphasis 5×6) with a vertical ramp
(`#ffffff → #e8d4aa`, emphasis `#fff6b0 → #e07a22`), an 8-neighbour outline `#2c1a2a` (emphasis `#5a1a1e`) and one drop row.

## Rendering technique

1. **Buffer:** pixel scale 1. Upscale factor `up = max(1, round(displayH / 360))`; buffer = `ceil(W/up) × ceil(H/up)`.
   Draw the world into the buffer with `imageSmoothingEnabled = false`, then one `drawImage` to the display.
   The camera is snapped to whole art pixels (`Math.round(cx * S) / S`).
2. **Init (bake once):** build every sprite with the `Pix` painter: main character (2 glow variants × 4 walk + 2 idle),
   small creature (2 colour variants × 4), ghost (4), large creature (4), white flash silhouettes (`tint(..., '#ffffff')`),
   dash afterimages (`#ffc36a`), 8 tree sprites, props, gems, seeds, sparkles, glow discs, shadows (widths 4–70),
   dust/vapour puffs, leaf particles, HUD icons (14×14 + outline = 16×16). Each gets a mirrored `l` copy.
3. **Pix painter:** a `w×h` array of `[r,g,b(,a)]`. Primitives: `set`, `rect`, `rows` (text grid + char→colour map),
   Bresenham `line`, `blob` (ellipse with sphere normal callback), `leaf` (tapered blade with lit side and rib).
   `canvas()` adds a 1-px border and, for every empty pixel with filled 4-neighbours, writes
   `mix(avg(neighbours), #24162a, 0.58 + 0.26 * luma)` — the coloured outline.
4. **Light:** `LV = normalize(-0.5, -0.6, 0.62)`; `l = n·LV`; ramp index `qi(l, thresholds)` counts how many
   thresholds `l` exceeds. Typical thresholds `[-0.22, 0.14, 0.5, 0.8]` → 5 tones.
5. **Ground (per 256×256 chunk, generator that yields):** noise fields on a 4-unit grid, bilinear sampled;
   material map; spur cleanup; tuft/trefoil/leaf stamps; colour pass with edge rules; macro tint; decals.
6. **Per frame (draw order):** ground chunks → ground overlay (ring burst) → gems → plum shadows for
   all characters and props → y-sorted props/creatures/main character → orbiting objects → projectiles → particles →
   floating numbers → world overlay (falling and wind-blown leaves) → screen overlay (grade + vignette) → integer upscale.
7. All positions are rounded; sprites are anchored at bottom centre (`x - w/2`, `y - h + 1`).

## World and ground

The ground is an endless autumn farmland baked per 256×256-unit chunk at 1 px per unit (no tiles, no image
assets). Material classes: `GRASS 0, GOLD 1, CLOVER 2, SOIL 3, PATH 4`. Grass classes are "high", soil and path
"low" — that height difference drives the edge rules that make it look like 16-bit terrain.

- **Path:** domain-warped Perlin `pathN` at 980-unit scale; distance to its zero line = `|n| / |∇n|`;
  half width `8.5 + macro * 6` units (≈ 17–29 units wide); jitter `±2.2·JA` (a tileable 64×64 jitter) makes ragged edges.
  Inside: base `#b08a5a`, a rut line where `|d - hw*0.42| < 1.05` (`#9e7a50`), edge `#a4804f` within 1.6 of the
  border, specks by hash: 5 % light `#c4a06a`, 3.5 % dark `#987450`, 1 % bright `#d6b882`. Pebbles and edge stones on top.
- **Fields:** at most one rounded rectangle (corner radius 6) per 400×300 cell, 150–290 × 96–190 units, kept away
  from forests and paths. Furrows: `fur[((Y + phase + wob) % 6)]` — a 6-px stripe ramp, horizontal 70 % of the
  time; clods 3.5 % `#b07a4c`, 2.5 % `#462a2c`; a 3-px rim `#734a35`/`#8d5d3d`. Crops (sprouts or small root
  bulbs) on every ridge row (`phase == 1`) every 8 units. Fields may carry fences on the top/bottom edge and a
  scarecrow in 40 % of cases (see Props).
- **Meadows:** clover where `fbm(x/360) + fringe > 0.64`, golden grass where `fbm(x/430) > 0.555`, else grass.
  A 52-unit mottle noise switches tone 6 (patch colour) and drives tuft density `0.05 + 0.42·smoothstep(.42,.72)`.
- **Spur cleanup:** remove 1-px spurs between height classes so every border is clean pixel art.
- **Edge rules (the "16-bit height" look):** a grass pixel with low ground below → `lip` (dark), with low ground
  above → `rim` (bright), left/right → `rim2`/`dk`. A low pixel directly under grass → grass `lip` or `sh`
  (random 50/50), second row → checkerboard of `sh2`/`sh` (2-px dithered shadow), left of grass → `sh2`.
  Under grass, soil shadows are `#3c2530`/`#513232`, path shadows `#755244`/`#8f6a4c`.
- **Leaf carpets:** density = forest field + one ellipse per tree (38×22 big, 31×18 small, `q·1.8`). Leaf stamps on
  a 3×3 grid survive when `rank < density·1.05 - 0.12`; above 0.62 density the gaps become litter colour.
  The colour zone comes from the tree above it (`TREE_ZONE = [3, 0, 2, 1]`) and `LEAFZ` picks leaf sets per zone,
  so each carpet matches its canopy (red, orange, gold or turning). Without trees, use the litter zones
  `#7c3531 #86412f #93582f #8d4a2d` and leaf sets from the palette.
- **Macro tint:** `k = 0.955 + mv*0.09` from a 1100-unit noise, red ×`(k + (mv-0.5)·0.03)`, blue ×`(k - …)` — warm and cool drift.

Stamp grids, verbatim from the module (digits are tone indices; `.` empty):

```js
// grass tufts (1 dark, 2 light, 3 bright tip) — the last two are used on golden grass
const TUFTS = [
  ['..2..', '2.1.2', '1.1.1', '.111.'],
  ['2.2', '1.1', '.1.'],
  ['.2..', '21.2', '.1.1', '..1.'],
  ['.3.3.', '.2.2.', '21.12', '.111.'],
  ['3.3', '2.2', '1.1', '.1.'],
];
const TREFOIL = [['.4.', '454', '.5.'], ['44.', '454', '.5.'], ['.44', '545', '.5.']];
// leaf stamps (1 light, 2 base, 3 dark)
const LEAFSH = [['.12.', '1223', '.23.'], ['.1.', '122', '223', '.3.'], ['12.', '223', '.3.'], ['.12', '122', '23.'], ['122', '.23']];
```

Tufts sit on a 7×6 grid, trefoils on a 5×4 grid, leaf stamps on a 3×3 grid. Ground decals (1–7 px) are text
rows plus a char→colour map, stamped deterministically across chunk borders; `s` = multiply shadow pixel
(`r*0.72, g*0.7, b*0.8`). Flowers (5 petal colours) and tiny flowers in meadows, mushrooms near leaves, mini
pumpkins and rocks in meadows, twigs, pebbles and edge stones on paths:

```js
DEC.pumpkin[1] = decal(['...g...', '.hh.oo.', 'hoohood', 'ooodooD', 'oodDdDD', '.sDDDs.'],
  { g: '#4a7030', h: '#f8a848', o: '#e07a2e', d: '#b4502a', D: '#7e3228' }, 3, 5);
DEC.mush[0] = decal(['.rrr.', 'rwrrw', 'RRRRR', '.scs.', '..cs.'],
  { r: '#d6402e', R: '#962a2e', w: '#fff4dc', c: '#efe0c0' }, 2, 4);
flower = decal(['.p.', 'PyP', '.gs'], { p: petal, P: petal2, y: '#f6d040', g: '#3f6a36' }, 1, 1);
// petals: #fbf6e6/#e2dac8, #f4d24a/#d8a838, #c79ae0/#9a6cbc, #9cc0f0/#7090cc, #f0a2b4/#d07890
```

## Characters

All characters are chibi sprites painted with the `Pix` painter (see Rendering technique): lit ellipse primitives
quantised into hue-shifted ramps, details set pixel by pixel, the automatic coloured 1-px outline, light from the
top-left, facing right with a mirrored copy for left, anchored at the feet and drawn at integer positions.
Each creature type owns one hue family so it reads instantly against the green-brown ground.

**Main character** (pumpkin-headed figure, `Pix(22, 30)`, 24×32 with outline, faces right, feet on row 29):
- **Head:** `pumpkinBody(p, 11, 9.2 + bob, 8.6, 6.7, pumpkinRamp, [-0.5, 0.05, 0.58])` — a lit ellipse
  (17×13 px, about half the sprite height) with three 1-px rib curves one tone darker; a 3-px top in
  `#b0462a/#de6e2c` and a curly 5-px stem `#2c4628/#4a7030/#6e9c3c`.
- **Face:** carved with `carve()` — glow tones 0/1/2 = `#f2902a/#ffc640/#fff2a8`; every hole pixel without a hole
  above gets a `#74282a` cut lip on top (reads as carved depth). Grid (rows from `eyeY = round(hy) - 3`):

```text
eyes at x=9:      mouth at x=8, y=eyeY+4:
.1....1..         0.......0
121..121.         1121.1211
                  .0122210.
```

- **Body:** short cape rows 17–23, `xl = round(7.4 - r*0.6)` flaring back, `xr = round(14.4 + r*0.2)`,
  tones by horizontal position (lit left `#447a4c`, right `#1b3236`), top row +1, bottom row −1; a dark fold
  at `xl + 2`. Front arm 2×3 sleeve + 2×2 glove `#a4733e/#7e512e`. Mustard scarf rows 16–17 (x 6–15) with a
  3-px tail fluttering behind.
- **Legs:** 2-px trousers `#2a2032` (far) / `#40304a` (near), boots 3 px wide `#a4733e → #331f1e` with a lit cuff.
- **Walk frames** (`bob, a, b, la, lb, hand, flap`): `{0,2,-2,0,0,1,0}`, `{-1,0,0,0,-1,0,1}`, `{0,-2,2,0,0,-1,0}`,
  `{-1,0,0,-1,0,0,1}` — legs step ±2 px, the passing frames lift a foot 1 px and bob the body up 1 px.
- **Idle:** 2 frames; frame 1 bobs only the head 1 px and flaps the scarf.
- Variants: a second set with the brighter glow ramp for flicker, a white flash silhouette and a `#ffc36a`
  silhouette (dash afterimage).

**Small creature** (purple root creature with a leafy top, 20×26): a bulb `rx 7.6, ry 7.4` that tapers below
`ny > 0.1` (`wf = 1 - 0.6·((ny-0.1)/0.9)^1.25`), a wavy purple crown (`zb = 0.02 + 0.12·sin(nx·8.5 + 1.3)`)
in the root purple ramp `#2c1740 … #bf80c8`, a blended seam band 0.13 deep, cream flesh `#8a6458 … #fff6da`,
a 1-px root tip, three `leaf()` blades on top that sway ±1 px per frame, 2-px root legs `#6e5040/#a2845e/#cdb282`.
Face: slanted `#22122c` brows, 2×2 glowing eyes, a frown with one cream fang. Two colour variants (purple /
magenta `#381634 … #d07e98`). Frames shift the bulb ±0.5 px and bob 1 px.

**Fast creature** (ghost, 22×28): a head ellipse (6.6×7.4, alpha 242) and a sheet that streams back and waves
(`ccx = cx - 4t² + sin(f·π/2 + 4.2t)·1.9t`), its lower half split into 3 tattered tails of lengths
`[0.88, 1.0, 0.76]` rotating per frame; alpha fades `235 → 130` downward. Ghost ice ramp `#465482 … #f6fcff`.
Hollow eye sockets `#100d24/#272650`, a gaping mouth that widens on odd frames, skinny reaching arms. Fixed cool
outline `#33406c` instead of the automatic one. Drawn at 86 % alpha, hovering 3 ± 1.5 units, shadow at 55 %.

**Large creature** (root colossus, 52×58): a huge lumpy root bulb (`rx 18, ry 17`, radius bumped by
`sin(5a)`/`sin(11a)`), purple crown `#2e1832 … #8e5078` with crown leaves, ochre flesh `#4e3028 … #ead08a`,
value noise ±0.11 on the light, moss speckles (lit top pixel) on crown and shoulders, a heavy brow shadow
(−2 tones), black-plum cracks `#24121e`, glowing eye sockets, a 12-px jagged ember maw, a glowing chest crack,
two 19-step root arms with knots and root fingers, 7-px gnarled stump legs.

## Props

Props use the same painter, lit ramps, top-left light and automatic coloured outline as the characters. Each
stands on a plum pixel shadow (see Atmosphere and lighting), gets a mirrored copy for variety and is y-sorted
together with the characters. Materials: bark `#3a2228 #5a3428 #7c4c32 #9e6c44`, wood
`#3e2420 #64402a #8c5e36 #b8844c #d8aa6a`, straw `#7a5a2a … #faeaa0`, foliage `#22402c #356432 #4f8c3a #78b246`.

- **Trees (56×65 small / 68×80 big, canopy radius 21 / 26):** 13 overlapping blobs (a centre blob `0.8·R`, a ring
  of 9 at `0.5–0.6·R`, 3 inner blobs raised by `z 6`), edges wobbled by `sin(7a)`/`sin(13a)`; per pixel the blob
  with the highest `sqrt(r²-d²) + z` wins and supplies the normal; light ×0.85 + 0.1, minus a top→bottom
  falloff 0.24, plus value noise ±0.15; quantised with thresholds `[-0.12, 0.2, 0.47, 0.73]` into a 5-tone
  canopy ramp (orange, red, gold or turning — see the palette). The bark trunk (half width 3.1/3.7) widens into
  a root flare in the bottom 20 %, forks into two branches below the canopy, and gets a dark canopy shadow band
  on its upper part. 4 ramps × 2 sizes = 8 tree sprites. Each tree stands on a leaf carpet in its own colour
  (see World and ground). The canopy is drawn at 60 % opacity when the main character walks behind it.
- **Hay bales:** square 26×19 (lit top face 6 rows with diagonal straw strokes, darker front, two twine bands
  `#c8643e` at x 7 and 18 with `#6a2a26`/`#9a4430` on the front, stray straw pixels) or round 28×20 (a lying
  cylinder in 4 straw tones with a spiral end on the left).
- **Fence (34×20):** two 3-px rails at rows 5 and 12 and three 3-px posts (wood ramp light → dark from left to
  right, lit top pixel), lighter grain pixels every 9 px on the rails, nail pixels `#4a4450`.
- **Pumpkin patch (38×20):** two ribbed lit pumpkins (radii ~7.2×5.6 and 5.2×4.1) with stems, curling foliage
  vines and three tapered leaves.
- **Scarecrow (30×48, optional crow):** wooden post and crossbar; plaid shirt `#7a2230 #b8402f #e0603e #f2a07a`
  with blue grid lines `#3a3a6a/#5a5a96` every 5 px and a patch `#d8b060/#f0d080`; straw tufts at sleeves and hem;
  a lit burlap head `#8a6a4a #b49268 #d4b484 #ecd6a4` with a stitched face `#3a2420`; rope at the neck; straw hat
  `#8a5a2a/#b07a3a/#c89048` with a red band `#a83a2e`. Crow: `#1e1a28/#34304a/#504c6a`, beak `#f0b040`, white eye.
- **Stump (22×14):** bark sides, two small roots, a top with alternating rings `#c8945a/#e2b878`, a core pixel
  `#a87648` and a crack `#7c4c32`.
- **Wheelbarrow (30×20):** a sloped wooden tray with slats, two small pumpkins inside, handles, a leg and a wheel
  `#3a3040/#7a7080` with a `#b8aea8` hub.
- **Crate (18×18):** a slatted wooden box with a diagonal brace, two purple root bulbs and leaves peeking out.
- **Placement:** fences on field edges (60 % top, 30 % bottom), scarecrows on 40 % of fields, hay, wheelbarrows
  and crates near fields, stumps in forests, mini decals (see World and ground) everywhere else.
- **Shadow widths:** big tree 50, small tree 40, hay 28, fence 36, pumpkins 30, scarecrow 18, stump 22,
  wheelbarrow 28, crate 18 px, offset 1–3 px right.

## Effects and particles

All effects are pixel sprites or 1-px rings at integer positions — no strokes, no blur.

- **Projectile:** 5×3 seed `['.cmm.', 'chmme', '.mee.']` (`c #fff6dc, m #eedcaa, e #c9a874, h #fff`, outline
  `#5e3a2a`), 4 rotations by `spin`; trail = 1-px `#fff2c8` dots at −4 (α .55) and −6 (α .28) units.
- **Impact:** the struck sprite shows its white flash silhouette while `flash > 0.45`; a 3-frame sparkle
  (5×5 plus `#ffe9a0/#ffc84a/#ffffff` → 3×3 → 1 px); 55 % chance of a leaf fluttering off (gravity 22, drag 1.5);
  ghosts emit vapour puffs instead; the large creature throws ochre chunks.
- **Burst:** 8 (large creature 16) square chunks (2–3 px, 1-px highlight `hi`) in the sprite's own ramp colours,
  gravity 200; 3–6 leaves; 2–5 dust puffs; a 1-px ring `#fff4d0` expanding from r 3 to 11 (large 6 → 22) over
  0.22 s. Ghosts burst into 7 vapour puffs + a pale ring. The main character's burst uses orange pumpkin chunks
  `#de6e2c/#f59a3c` with `#ffc76c` highlights and a ring `#ffb36b`.
- **Rise from soil:** creatures emerge with the sprite cropped from the top (outQuad) over a 12×3 dirt mound
  `['....hhll....', '..hlllmmmd..', '.llmmmmmdddd']` with flying dirt chunks `#6e4632/#9a663f`. Ghosts fade in
  and sink 8 units with vapour puffs instead.
- **Dust / vapour puffs:** lit pixel balls radius 1–5 (ramps `#b89c7c #d2bc9c #e8dcc0` / `#8aa2d2 #c4d8f0 #f0f8ff`), α 0.42.
- **Collectibles:** small gem 3×5 (`.a.` / `aya` / `yao` / `aoo` / `.o.`, `y #fff4b0, a #ffc23e, o #f08a2a`,
  outline `#6a2a1a`); large gem 5×7 teal `#5ce0c8/#2aa8a0/#1a6a70`. Both bob 1 px on a 3 rad/s sine over a tiny
  pixel shadow, glow with a stepped disc pulsing 0.5 ± 0.15, sparkle every ~1.25 s and pop out on a 9-px arc.
  Picking one up shows 2 (large 6) sparkles + a spark.
- **Orbiting objects:** 13×15 root-bulb lanterns with a carved glowing face circling the main character, each
  with a flickering stepped glow (see Atmosphere and lighting).
- **Ring burst:** a squashed (half-height) 1-px `#ffd25a` ring r 6 → 40 around the main character, 14 radial
  sparkles, 6 leaves.
- **Dash smear:** 3 afterimages tinted `#ffc36a`, spaced 7 units back, alpha 0.16/0.32/0.48, plus dust puffs.
- **Falling leaves:** 2–3 px leaf frames (4 rotations) drift from visible canopies; 9 wind-blown leaves wrap
  across the view (16–27 units/s right, 7 units/s down).

## Atmosphere and lighting

The mood is a warm late afternoon. One light from the top-left-front (`normalize(-0.5, -0.6, 0.62)`) is baked
into every sprite ramp; the world itself has no blur, fog or smooth gradients.

- **Shadows:** pixel ellipses `w × round(w·0.36)` in plum `rgb(40,22,56)`, alpha 92 inside `q ≤ 0.55`, 62 outside —
  two hard steps, never blurred, never black. Widths: main character 14 (12 while dashing), small creature 14,
  ghost 10 (×0.55 alpha), large creature 32, big tree 50, small tree 40, offset +1…3 units right. Ground decals
  use single multiply shadow pixels (`r*0.72, g*0.7, b*0.8`).
- **Fake height:** grass edges carry bright rims and dark lips; soil and paths get the 2-px dithered shadow band
  under grass (see World and ground).
- **Glows:** additive (`'lighter'`) discs with 3 hard alpha rings, never radial gradients: gem `r 3 #ff9030
  (.26/.06)`, large gem `r 5 #40d0c0`, lantern `r 11 #ffa040 (.32/.1)` flickering to `r 13`, main character face
  `r 9 #ffb040`. Glow colours only appear in carved faces, eyes, gems, lanterns and sparkles.
- **Transparency:** ghosts are drawn at 86 % opacity; tree canopies drop to 60 % opacity when the main character
  is behind them.
- **Grade:** a linear gradient `rgba(255,190,110,.55)` (top-left) → `rgba(255,170,100,.18)` → `rgba(80,90,160,.42)`
  (bottom-right) composited `soft-light` at α 0.5 — warm orange light, cool blue shade.
- **Vignette:** a radial gradient white → `rgb(150,110,150)` (inner radius 0.35·min(W,H), outer 0.62·diagonal)
  composited `multiply`. Grade and vignette are pre-rendered once per buffer size and applied before the upscale.

## UI

Nailed wooden planks and parchment cards. Panels: `#8f5c34` with horizontal grain, a 3 px `#2b170f` border,
inset bevel `#b97f4b`/`#5e3820`, four 3×3 nail heads (`#efe4cc` with a `#4a3426` shadow), 4 px hard drop
shadow, text `#fff3d6`. Bars: dark trough `#3a1c18` with banded flat fills (red `#ffa58a/#ee4f36/#c0302c/#8e1f2a`,
amber `#fff0a0/#ffc94a/#f19434/#c8621f` with 3-px dark notches every 12 px). Icons are 14×14 text grids +
outline, shown at 48 px with `image-rendering: pixelated`. The clock hangs on two rope strings. Cards are
parchment `#f6e6bc → #ead096` with a 4 px `#4a2a18` border, a red pin and a framed icon. All text uses the
pixel fonts with the chunky 8-direction outline (see Typography).

```css
.panel { background-color: #8f5c34; color: #fff3d6; font-family: 'Pixelify Sans', monospace;
  background-image:
    linear-gradient(#efe4cc,#efe4cc) 5px 5px/3px 3px no-repeat,
    linear-gradient(#efe4cc,#efe4cc) calc(100% - 8px) 5px/3px 3px no-repeat,
    linear-gradient(#efe4cc,#efe4cc) 5px calc(100% - 8px)/3px 3px no-repeat,
    linear-gradient(#efe4cc,#efe4cc) calc(100% - 8px) calc(100% - 8px)/3px 3px no-repeat,
    repeating-linear-gradient(180deg, rgba(0,0,0,0) 0 5px, rgba(58,30,16,.38) 5px 6px, rgba(0,0,0,0) 6px 11px,
      rgba(255,214,150,.14) 11px 12px, rgba(0,0,0,0) 12px 17px, rgba(58,30,16,.22) 17px 18px);
  border: 3px solid #2b170f;
  box-shadow: inset 3px 3px 0 #b97f4b, inset -3px -3px 0 #5e3820, 0 4px 0 rgba(26,12,6,.6); }
.bar     { width: 220px; height: 22px; border: 3px solid #2b170f; background: #3a1c18;
  box-shadow: inset 0 3px 0 #200e0c, 0 3px 0 #c58a54; }
.bar-red { height: 100%; background: linear-gradient(180deg, #ffa58a 0 3px, #ee4f36 3px 9px, #c0302c 9px 13px, #8e1f2a 13px); }
.bar-amber { background: linear-gradient(180deg, #fff0a0 0 3px, #ffc94a 3px 8px, #f19434 8px 12px, #c8621f 12px); }
.card { background: linear-gradient(180deg, #f6e6bc, #ead096); border: 4px solid #4a2a18;
  box-shadow: inset 0 0 0 3px #fbf0d0, inset 0 0 0 6px #d8b679, 0 6px 0 #2a160c, 0 0 0 3px #2a160c; }
.card-name { font: 700 23px 'Pixelify Sans', monospace; color: #6a2a14; }
```

An icon grid (the heart icon, `R #9e2a30, r #e0442e, h #ff9a7a, w #fff8e8`):

```text
..RRR...RRR...
.RrrrR.RrrrR..
Rrhhrrrrrrrrr.
Rrhwrrrrrrrrr.
Rrhrrrrrrrrrr.
Rrrrrrrrrrrrr.
.RrrrrrrrrrR..
..RrrrrrrrR...
...RrrrrrR....
....RrrrR.....
.....RrR......
......R.......
```

## Motion and animation

- Main character: 4-frame walk, 1 frame per 10 units travelled (≈ 9 fps at 92 u/s); idle 2 frames at 2.2 fps.
- Small creature ≈ 6 fps (anim × 1.6), ghost 6 fps (hover sine 3 rad/s, ±1.5 units), large creature ≈ 2.6 fps with
  foot-fall dust.
- Face glow flicker: `noise(t·9) > 0.62` → brighter glow ramp. Lantern glow flickers every 7th tick.
- Flash: white silhouette for the first 0.15 s, then 18 Hz blink at α 0.35.
- Dash: 3 tinted afterimages 7 units apart; footstep dust on frames 0 and 2.
- Gems bob 1 px on a 3 rad/s sine; pop-up arc of 9 px when they appear.
- Floating numbers pop up 2–3 px for 0.08 s, then fade.
- Everything moves in whole art pixels — no sub-pixel easing, no rotation or scaling of sprites
  (except the half-height squash of the ring burst).

## Do and don't

**Do**
- Render at 1 art px per world unit into a low-res buffer and upscale by an integer factor, smoothing off.
- Paint sprites with lit primitives and quantised hue-shifted ramps; let the baker add the coloured outline.
- Give the ground fake height with rims, lips and the 2-px dithered shadow band under grass edges.
- Put leaf carpets in the tree's own colour under trees; mix three meadow greens with noise.
- Use stepped additive glow discs and plum two-step shadows.
- Keep pixel decals tiny (1–7 px) and give them 1-px multiply shadow pixels.
- Finish with the warm soft-light grade and plum vignette.

**Don't**
- Don't use canvas strokes, arcs, blur or gradients on sprites or ground.
- Don't draw at fractional coordinates, rotate sprites or scale by non-integer factors.
- Don't use black outlines or black shadows; shadows are plum (40,22,56) at 36 %/24 % alpha.
- Don't light from more than one direction; every ramp assumes top-left light.
- Don't leave flat ground — no tufts/specks/rims reads as a placeholder.
- Don't mix pixel scales (e.g. 2× sprites over 1× ground) or add neon colours outside the ghost/ice family.

## Implementation recipe

1. Set up a canvas; compute `up = max(1, round(h / 360))` and a buffer `ceil(w/up) × ceil(h/up)`.
2. Port the `Pix` painter (set/rect/rows/line/blob/leaf/canvas with coloured outline) and `lam`/`qi`.
3. Define your ramps (3–5 hue-shifted tones each) from the palette above.
4. Write one `makeX(frame)` function per character: legs first (far leg darker), body, arms, head, face.
   Bake 4 walk frames, mirror them, bake white flash silhouettes.
5. Build the ground baker: noise fields → material map → stamps → colour pass with edge rules → decals.
   Cache it per 256-unit chunk (or once for a fixed screen).
6. Bake props (trees with the blob canopy, fences, hay) and small sprites (gems, projectiles, sparkles, glows, shadows).
7. Each frame: blit ground, shadows, y-sorted characters and props at integer positions, effects, leaves.
8. Apply the soft-light grade and multiply vignette, then upscale the buffer with nearest-neighbour.
9. Build the HUD in HTML/CSS with the wooden panel CSS and the two pixel fonts.

## Code

These are ported from the module and run standalone. `starter.js` (same folder) contains the full
painter, main character / small creature / ghost / tree builders, the ground baker and a preview scene. The
complete visual reference is `../../js/styles/harvest16.js`.

The shared light and the coloured-outline bake:

```js
const hx = (s) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const mixc = (a, b, t) => a.slice(0, 3).map((v, i) => Math.round(v + (b[i] - v) * t));
const INK = hx('#24162a');
const LV = (() => { const v = [-0.5, -0.6, 0.62], l = Math.hypot(...v); return v.map((a) => a / l); })();
const lam = (nx, ny, nz) => nx * LV[0] + ny * LV[1] + nz * LV[2];
const qi = (l, th) => { let i = 0; while (i < th.length && l > th[i]) i++; return i; };
const outlineOf = (c) => mixc(c, INK, 0.58 + 0.26 * ((c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11) / 255));

function bakeWithOutline(w, h, get /* (x,y) -> [r,g,b,a?] | null */) {
  const W = w + 2, H = h + 2, c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d'), img = ctx.createImageData(W, H), d = img.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let col = get(x - 1, y - 1), a = 255;
    if (col) a = col.length > 3 ? col[3] : 255;
    else {
      const nb = [get(x - 2, y - 1), get(x, y - 1), get(x - 1, y - 2), get(x - 1, y)].filter(Boolean);
      if (!nb.length) continue;
      const avg = [0, 1, 2].map((i) => nb.reduce((s, q) => s + q[i], 0) / nb.length);
      col = outlineOf(avg); a = nb.reduce((s, q) => s + (q.length > 3 ? q[3] : 255), 0) / nb.length;
    }
    const o = (y * W + x) * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = a;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}
```

A lit pumpkin with ribs (the main character's head and the pumpkin props), painted into a grid:

```js
function pumpkin(w, h, cx, cy, rx, ry, creases) {
  const ramp = ['#74282a', '#b0462a', '#de6e2c', '#f59a3c', '#ffc76c'].map(hx);
  const grid = new Array(w * h).fill(null), idx = new Map();
  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < w && y < h) grid[y * w + x] = c; };
  for (let y = Math.floor(cy - ry) - 1; y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx); x++) {
    const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry, dd = nx * nx + ny * ny;
    if (dd > 1) continue;
    const k = qi(lam(nx, ny, Math.sqrt(1 - dd)), [-0.22, 0.14, 0.5, 0.8]);
    idx.set(x + ',' + y, k); set(x, y, ramp[k]);
  }
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {          // 1-px rib curves
    const ny = (y + 0.5 - cy) / ry; if (Math.abs(ny) >= 0.92) continue;
    for (const c of creases) {
      const x = Math.floor(cx + c * rx * Math.sqrt(1 - ny * ny)), k = idx.get(x + ',' + y);
      if (k !== undefined) set(x, y, ramp[Math.max(0, k - 1)]);
    }
  }
  return bakeWithOutline(w, h, (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? null : grid[y * w + x]));
}
const head = pumpkin(22, 18, 11, 9.2, 8.6, 6.7, [-0.5, 0.05, 0.58]);
```

Text-grid sprites (gems, seeds, icons) and the pixel ground shadow:

```js
function rowsSprite(rows, pal, outlineHex) {
  const w = Math.max(...rows.map((r) => r.length)), h = rows.length;
  const get = (x, y) => (x < 0 || y < 0 || y >= h || !rows[y][x] || !pal[rows[y][x]] ? null : hx(pal[rows[y][x]]));
  const c = bakeWithOutline(w, h, get);
  if (outlineHex) { // fixed outline colour variant: repaint non-body pixels
    const ctx = c.getContext('2d'), img = ctx.getImageData(0, 0, c.width, c.height), oc = hx(outlineHex);
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      const o = (y * c.width + x) * 4; if (img.data[o + 3] && !get(x - 1, y - 1)) img.data.set(oc, o);
    }
    ctx.putImageData(img, 0, 0);
  }
  return c;
}
const gem = rowsSprite(['.a.', 'aya', 'yao', 'aoo', '.o.'], { y: '#fff4b0', a: '#ffc23e', o: '#f08a2a' }, '#6a2a1a');

function shadowSprite(w) { // plum ellipse, two hard alpha steps
  const h = Math.max(2, Math.round(w * 0.36)), c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d'), img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const nx = (x + 0.5 - w / 2) / (w / 2), ny = (y + 0.5 - h / 2) / (h / 2), q = nx * nx + ny * ny;
    if (q <= 1) img.data.set([40, 22, 56, q > 0.55 ? 62 : 92], (y * w + x) * 4);
  }
  ctx.putImageData(img, 0, 0);
  return c;
}
```

The ground edge rule that fakes height (inside a per-pixel colour pass over a material array `mat`, row stride `NB`):

```js
// GRASS 0, GOLD 1, CLOVER 2 are "high"; SOIL 3, PATH 4 are "low"
if (m <= CLOVER) {
  const gp = GP[m];
  if (mat[i + NB] > CLOVER) col = gp.lip;            // dark lip: grass above a drop
  else if (mat[i - NB] > CLOVER) col = gp.rim;       // bright rim: grass below a low area
  else if (mat[i - 1] > CLOVER) col = gp.rim2;
  else if (mat[i + 1] > CLOVER) col = gp.dk;
  else col = gp.t[tone[i] || (mottle[i] ? 6 : 0)];   // tuft / trefoil stamps or base
} else {
  const isS = m === SOIL, up = mat[i - NB], up2 = mat[i - 2 * NB];
  if (up <= CLOVER) col = (hash >>> 12) & 1 ? GP[up].lip : (isS ? '#3c2530' : '#755244');
  else if (up2 <= CLOVER) col = ((X + Y) & 1) || ((hash >>> 13) & 1) ? (isS ? '#513232' : '#8f6a4c') : (isS ? '#3c2530' : '#755244');
  else col = isS ? furrow[(((Y + phase) % 6) + 6) % 6] : pathColour;
}
```

## Adapting it to your project

- **Keep fixed:** 1 px = 1 unit and integer upscale; the shared light vector; quantised ramps with hue shift;
  the auto coloured outline; plum shadows; the ground edge rules; stepped glows; the grade + vignette.
- **May change:** the cast (any chibi character ~20–30 px; large creatures up to ~52×58), the crops and props,
  the season. For spring/summer swap the canopy ramps to greens and blossoms and the leaf carpets to petals;
  for winter swap meadows for snow ramps but keep the same edge rules.
- **Palette swaps:** replace whole ramps, not single colours; keep 3–5 tones, keep the hue drift
  (shadow → purple, light → yellow), keep the outline target `#24162a`.
- **New creatures:** give each its own hue family and silhouette; reuse `blob`, `leaf` and `carve`.
- **Mixing elements:** the characters work on other worlds as long as those are pixel art at the same scale;
  this world under other characters needs them pixelled at 1 px per unit with a coloured outline.
- **Other views:** side-view scenes work if you keep the top-left light; higher, zoomed-out cameras need lower
  tuft density and sprites of at least 16 px.
- **Resolution:** change the visible world height (e.g. 270 instead of 360) rather than the pixel scale.

## Performance notes

- All sprites, frames, mirrored copies and flash silhouettes are baked once in init; per frame only integer
  `drawImage` blits into the small buffer plus one upscale.
- The ground is the only heavy part: per 256×256 chunk several fbm fields on a 4-unit grid (bilinear),
  per-pixel SDF/material work and stamp passes. Build it in a generator that yields every 32 rows and cache
  chunks (the module keeps ~90).
- Field and tree placement uses cached per-cell lookups (`Map`, cleared above 6000/8000 entries).
- Overlays are pre-rendered per buffer size; leaf particles are 2–3 px sprites.
- Budget: the starter scene renders in about 2 ms per frame at 960×540 after its one-time bake.

## Copy-paste prompt

```text
Use the Harvest 16-Bit art style for my project: cozy SNES-era autumn farm pixel art.
- Render into a low-res buffer at 1 art pixel = 1 world unit (~360 units tall), integer nearest-neighbour upscale.
- Paint every sprite in code into a pixel grid: ellipses/tapered leaves lit by ONE light (-0.5,-0.6,0.62),
  quantised into 3-5 step hue-shifted ramps (shadows plum/purple, highlights yellow/cream). No gradients/strokes.
- Auto 1-px outline: empty pixels next to the sprite get the neighbours' average colour mixed 58-84% toward #24162a.
- Chibi characters ~22x30 px with big round heads, glowing carved faces (#f2902a/#ffc640/#fff2a8), 4 walk frames
  (bob 1 px, legs ±2 px), mirrored for left. Each creature type gets its own hue family.
- Ground: three meadow greens (#77963b, #9a9d45, #5b893f) from noise, tuft stamps, sunken dirt paths (#b08a5a)
  and furrowed soil fields with a 2-px dithered shadow band under grass edges, bright rims/dark lips on grass.
- Props: round autumn trees (orange/red/gold ramps) from overlapping lit blobs, with leaf-litter carpets
  (#7c3531, #bc5a2f, #d6a944) beneath; hay bales, fences, scarecrows in wood/straw ramps.
- Plum ellipse shadows rgb(40,22,56) at alpha 92/62; stepped additive glow discs for gems and lanterns.
- Effects: square 2-3 px chunks, fluttering 2-px leaves, 1-px pixel rings, white flash silhouettes.
- Atmosphere: soft-light warm→cool diagonal grade at 50% + plum multiply vignette.
- UI: nailed wooden panels #8f5c34 with #2b170f border, banded bars, Pixelify Sans + Silkscreen with chunky text-shadow outlines.
- Everything at integer pixel positions; no rotation, blur, black outlines or neon colours.
```
