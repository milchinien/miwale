# Dusk Grove — Game Art Style Spec

> Modern HD-2D pixel art: an enchanted forest clearing at golden-to-violet dusk, rim-lit sprites, banded glows, bloom and long shadows.

Dusk Grove is low-resolution pixel art (1 world unit = 1 art pixel, nearest-neighbour upscaled) that is *lit like a 3D scene*. Every sprite is shaded per pixel from a fixed light vector into a hand-picked, hue-shifted colour ramp, then finished with a warm sun rim on its left/top edges, a cool violet sky bounce on its right edge and a selective outline tinted from its own colours. Carved faces, mushrooms, runes and lanterns are emissive and throw additive, banded pixel glows; shadows are long silhouettes sheared to the upper right. Finally the low-res buffer is colour-graded peach-to-violet, bloomed, vignetted and tilt-shifted before it is upscaled. The mood is the last golden minute before night: warm, magical, slightly melancholic.

## At a glance

| | |
| --- | --- |
| Family | Pixel Art · Modern HD-2D |
| Mood | enchanted, warm, melancholic, cozy, mysterious |
| Best for | top-down action games, cozy adventure RPGs, fairy-tale exploration, enchanted-forest and harvest-festival projects |
| Renderer | Canvas 2D, fully procedural (no image files) |
| Pixel art | yes — `pixelArt: { scale: 1 }`, 360 art px of view height, integer upscale, smoothing off |
| Complexity | 7/10 — the most detailed pixel style: every new asset needs ramp shading, rim light, a tinted outline, a sheared shadow and often a glow |
| Fonts | Cinzel (500/700/900) for headlines, Pixelify Sans (400–700) for numbers/body |
| Key colours | ink `#150c29`, grass `#246248`, pumpkin `#f79a3e`, teal cape `#1f6076`, root violet `#7426a0`, ghost ice `#7ab3e4`, mushroom cyan `#7ee0cc`, gold `#e8b85a`, rim `#ffcfa2`, bounce `#8d86ea` |

## When to use it

Good fits:
- **Top-down action games with many characters on screen** — rim light and glows keep every figure readable on a busy, dark-ish ground.
- **Cozy-but-eerie fantasy** (fairy tales, enchanted forests, harvest festivals, Halloween) — the dusk grade sells "magic hour".
- **Projects with a day-to-night arc** — the grade can deepen towards midnight (a `#4a3a8a` multiply at `progress*0.4`).
- **Exploration scenes with many props** — trees, ruins, lanterns and ponds look rich because every one of them is lit consistently.

Bad fits:
- **Bright midday or sunny cartoon looks** — the whole look relies on low warm light and cool shadows.
- **Sci-fi, urban, hard-surface worlds** — the ramps and texture language are organic (leaves, moss, stone, petals).
- **Tiny-icon readability / huge crowds (500+ sprites)** — detail and glows turn to mush at high density.
- **Teams that need to crank out assets quickly** — every new asset must get the same shading, rim, outline, shadow and glow treatment.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Ink | `#150c29` | Shadow-side outline base, deepest dark (never pure black) |
| Night | `#1e1538` | Deep background darks |
| Plum | `#4a2c62` | Lit-side outline tint |
| Dusk Shadow | `#1a1034` | Cast shadows, decal shadows (alpha 0.18–0.5) |
| Grass | `#246248` | Main ground mid-tone, ~55% of the screen |
| Meadow | `#589250` | Lighter meadow patches with blossom pixels |
| Forest Earth | `#36273a` | Forest floor under trees |
| Ruin Stone | `#504a69` | Cobbles, pillars, rocks |
| Pond | `#1e3e68` | Water |
| Sun Rim | `#ffcfa2` | Warm rim light (leaves use `#ffd08a`) |
| Sky Bounce | `#8d86ea` | Cool rim on right edges |
| Pumpkin | `#f79a3e` | Main character's pumpkin head, the warmest focal colour |
| Teal Cape | `#1f6076` | Main character's cloth |
| Root Violet | `#7426a0` | Small root creatures |
| Ghost Ice | `#7ab3e4` | Floating ghost creatures |
| Mushroom Cyan | `#7ee0cc` | Emissive mushrooms, runes, large-creature eyes |
| Amber | `#ffaa48` | Small collectible shards, projectile glow |
| Gold Trim | `#e8b85a` | UI borders, diamonds, rings |
| Blossom Pink | `#e58bb4` | Flowers, petals |
| Lavender | `#9a7fe0` | Flowers, lupines |
| Candle Cream | `#fff4dc` | UI headline text, hottest glow cores |

Every material is a **ramp** (dark → light). The real ramps from the module:

```text
grass   #0a1d2a #0d2732 #11323a #153d3f #194943 #1e5546 #246248 #2c6f4a #387d4d #4a8c51 #62a056
meadow  #0e2733 #13333a #183f3f #1e4b43 #255846 #2d6548 #38734a #46824d #589250 #70a456 #8eb75d
earth   #150f1d #1c1525 #241b2d #2d2134 #36273a #412e40 #4d3645 #5b404b #6b4b50
stone   #141127 #1f1b34 #2a2641 #36324f #433e5c #504a69 #5f5876 #6f6782 #82788f #988b9e #b3a2b0
moss    #11292a #173a31 #1f4d37 #2a613c #387541 #4a8a47 #62a04f #82b65a
water   #131a3c #16244c #1a305a #1e3e68 #244f74 #2b627e #357486 #43878d
bark    #160f22 #21162d #2d1d36 #3b2540 #4b2f49 #5d3a51 #714758 #88565f #a26a68
leaf    #0a1328 #0d1b33 #10253d #133046 #163d4c #1a4b51 #1f5a54 #266a56 #307a57 #3e8a57 #539b58 #71ad5c #9cc063 #cfd27a
pumpkin #3a1428 #64202c #93332c #c24f2c #e5742f #f79a3e #ffc35c #ffe08c
cape    #0c1430 #102241 #143354 #194866 #1f6076 #2a7a85 #40978f #6ab8a4
violet  #1a0d33 #2a1150 #3f166c #581d88 #7426a0 #922fb0 #b044b8 #d06cc4 #eea0d6   (root creature top)
rbody   #2e1636 #4d2a44 #7a4a4c #a8704c #cf9748 #e8b950 #f6d572 #fff0b0   (root creature belly / roots)
ice     #1a2252 #223672 #2c4f92 #3a6cb0 #5590cc #7ab3e4 #a4d3f4 #cfecfb #f0fcff
shroom  #0c2440 #123a5a #185274 #1f6c8a #2a8a9a #3fb0ae #7ee0cc #d0fff2
amber   #6e2430 #b2452e #e3763a #ffaa48 #ffd27a #fff2c4
tops    #0d2629 #133b36 #1b5440 #256e48 #36894e #52a455 #78bf5e #a6d66c   (leaf crowns, stems, ferns)
flowers pink #a24f7e #e58bb4 #ffc4dc · lav #5d47a2 #9a7fe0 #cfbfff · white #9d93b4 #e8e0ec #ffffff
        peach #c0605a #f7a688 #ffd9bf · gold #b8702a #f2c04e #fff0a0 · centre #ffcf4e
```

Palette rules:
- **Hue-shift every ramp**: darks drift to blue/indigo/violet, lights drift to warm yellow-green or peach. Never darken by mixing with black, never lighten with white.
- The **world is cool** (teal greens, violets, indigo); **warmth only comes from light** — rims, pumpkin, flames, amber, the sun grade.
- **Emissive colours** are the only fully saturated light colours and always come with a glow: carved face `#fff6c4 #ffd05a #ff9a2e #d4581e`, creature eyes `#ff4f7a` + `#ffe2ec`, mushrooms/runes `#7ee0cc #d0fff2 #6ff5e0`.
- Ground stays in the mid-dark range of its ramp (grass indices 3–7, meadow 4–8) so rim-lit sprites pop.
- Flowers are tiny 3–5 px motifs; they sprinkle, never dominate.
- The screen tint multiplies everything (peach on the left, violet on the right) — author sprites slightly brighter/warmer than the target.

## Typography

**Cinzel** — weights 500, 700, 900 — engraved storybook serif for the clock, titles, overlay headlines, card names and small caps labels.
Google Fonts: `https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&display=swap`

```css
.clock { font-family: 'Cinzel', serif; font-weight: 900; font-size: 32px; color: #fff4dc; letter-spacing: 3px;
  text-shadow: 0 0 14px rgba(255,170,110,.65), 0 2px 0 #1a0f24; }
.label { font-family: 'Cinzel', serif; font-weight: 700; font-size: 10px; color: #e8b85a; letter-spacing: 4px;
  border-top: 1px solid rgba(232,184,90,.55); padding-top: 3px; text-shadow: 0 1px 0 #1a0f24; }
.title { font-family: 'Cinzel', serif; font-weight: 900; font-size: 46px; letter-spacing: 6px; color: #fff2c4;
  text-shadow: 0 0 22px rgba(255,170,90,.75), 0 3px 0 #2a1238; }
.title::before, .title::after { content: '\2726'; color: #e8b85a; font-size: 24px; margin: 0 18px; vertical-align: middle; }
```

**Pixelify Sans** — weights 400–700 — pixel-grid sans for bar values, counters, card descriptions and general UI.
Google Fonts: `https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;500;600;700&display=swap`

```css
.bar-text { font-family: 'Pixelify Sans', system-ui, sans-serif; font-size: 15px; font-weight: 600; color: #ffe8c8;
  text-shadow: 0 1px 0 #1a0f24, 0 0 8px rgba(255,150,80,.5); }
.counter { font-size: 22px; font-weight: 600; color: #ffe8f2; text-shadow: 0 1px 0 #1a0f24, 0 0 10px rgba(230,110,200,.55); }
```

Text effects: always a **warm outer glow** (`rgba(255,170,90,.5–.8)`) plus a **hard 1–3 px dark drop line** (`#1a0f24` / `#2a1238`) straight down. Labels use wide letter-spacing (3–6 px). Floating in-world numbers are not fonts but 4x6 pixel digits (white → peach gradient per row, emphasised: `#fffbe0 → #ff7048` with a `#5a1a2a` outline), with a `#1c0f34` down-right drop shadow and a 3-px pop on appearing.

## Rendering technique

1. **Buffer**: render into an offscreen canvas that is `ceil(displayW/up) x ceil(displayH/up)` with `up = max(1, round(displayH / 360))`. 1 art pixel = 1 world unit; the view shows 360 units of height. `imageSmoothingEnabled = false` everywhere except inside the bloom/tilt-shift helpers.
2. **Init – paint sprites pixel by pixel** into a `Pix` buffer (RGBA + a flag byte per pixel: `EMIT=1` emissive, `NOOUT=2` no outline, `NORIM=4` no rim). Volumes are ellipsoids (`blob`) or cylinder rows: for each pixel compute a normal `(nx, ny, nz)`, `v = dot(n, L) * 0.5 + 0.5 + bias + texture`, `L = normalize(-0.62, -0.5, 0.6)`, colour = `ramp[floor(v * ramp.length)]`.
3. **Init – finish pass** on every sprite (`finish`): rim on lit edges, cool bounce on the right edge, then a selective outline in a canvas grown by 1 px per side. Mirror the *unfinished* pixels for the left-facing version and finish that too (so the rim stays on the left!). Also bake a white flash copy (`#fff8f0`, source-atop).
4. **Init – shadows** (`makeShadow`): each opaque pixel at height `h = anchorY - y` is moved to `(x + h*0.8, anchorY - h*0.3)`; 1-px holes closed, then 3 alpha bands (outer 0.18, body 0.34, contact blob 0.5) in `#1a1034`.
5. **Init – glows**: a cached banded sprite per `(type, radius, flat)`.
6. **Ground chunks** (256x256 px) are built lazily via generators (5 ms per frame budget) and cached (max 90).
7. **Per frame, draw order**: ground chunks → ground overlay (additive flat light pools, swaying grass) → collectibles → all shadows → y-sorted props/creatures/main character (each followed by its additive glows) → orbiting objects → projectiles → particles → floating numbers → world overlay (fireflies, drifting petals) → screen grade on the buffer → nearest-neighbour upscale to the display → DOM HUD.
8. **Every draw position is rounded** to whole pixels (`Math.round(x) - ox`). Scaling effects (squash) use integer target sizes.

## World and ground

The floor is a top-down forest clearing generated per pixel at 1 px per unit (base fill `#1e4a44` while chunks are still building). It is lit by the same low sun as everything else: light from the upper left, cool bluish shadows under raised materials.

- **Fields** (sampled on an 8-unit grid and bilinearly interpolated so chunks match): forest = domain-warped fbm `/760`, meadow = fbm `/520`, ruins = warped fbm `/600`, water = fbm `/420`, light pools = fbm `/230`, texture variant = fbm `/150`. Around the world origin the meadow is boosted and the rest suppressed (`exp(-(x²+y²)/250²)`).
- **Classification** (with fine/clump noise jitter): water `> 0.69`, stone `> 0.625`, forest `> 0.57`, else grass. Heights: grass 3, stone 2, forest 1, water 0. One-pixel islands are despeckled. Rough coverage: ~55% grass, ~20% meadow/flowers, the rest forest earth, stone ruins, ponds.
- **Textures** (256x256, tileable):
  - *Grass* (ramp `#0a1d2a … #62a056`, two variants): `v = 0.5 + 1.5*(fbm/64 - .5) + 0.6*(fbm/16 - .5) + 0.32*(fbm/4 - .5)` posterised into grass ramp indices 3–7 — big soft tonal patches with crisp steps — plus 1400 blade tufts (2–4 blades, 1–3 px tall, one step lighter, a darker root pixel).
  - *Meadow*: same with the meadow ramp (indices 4–8) and 1700 tufts; a blossom map (340 clusters of 3–9 three-pixel flowers, each with a random threshold) appears where the meadow weight exceeds the threshold, so flowers thicken towards meadow centres. Flowers are pink, lavender, white, peach and gold with a `#ffcf4e` centre.
  - *Forest earth* (ramp `#150f1d … #6b4b50`): earth ramp fbm with moss patches, 1100 fallen leaves (muted rust/ochre/mauve 3–4 px), 260 petals, 70 twigs.
  - *Stone ruins* (ramp `#141127 … #b3a2b0`): brick courses 12–20 px high, stones 14–40 px wide with a bright top row (+0.2), lit left column, dark bottom/right; cracks, broken stones showing earth, wet stones, moss creeping through joints.
  - *Water* (ramp `#131a3c … #43878d`): depth-indexed water ramp, long soft pink sky-reflection bands (+34, +10, +22 RGB), ripple dashes in `rgb(238,196,214)`.
- **Edge pass**: grass tips spill 1–2 px over lower materials; pixels below/right of a higher material get a bluish cast shadow (`r*0.5, g*0.48, b*0.62+14`, strength 0.62); upper lips of raised materials are lit; water gets a dark top edge and a pale foam line at the bottom.
- **Macro light**: warm pools `r*(1+0.17w) g*(1+0.07w) b*(1-0.05w)` and cool shade `r*0.9 g*0.93 b*1.06` from the light-pool field.
- **Decals** on a jittered 15-unit world grid (deterministic hash per cell → seamless across chunks): tufts, flowers, lavender spikes, daisies, clover, pebbles (grass); ferns, tufts (forest); moss, pebbles (stone); lily pads (water). Each decal casts a 1-px `#1a1034` alpha-90 shadow to its right. Forest roots are drawn as bark-ramp pixel strokes; small glowing mushrooms get a baked cyan halo.
- **Per frame** near the camera: every 22-unit cell with hash < 70/255 gets a 5-frame swaying grass/meadow/fern sprite; blades lean away from the main character as it walks through. Additive flat light pools from glowing objects are laid over the ground (see Atmosphere and lighting).

## Characters

All characters are pixel sprites painted in code from shaded primitives (ellipsoid blobs, cylinder-shaded cones and legs, 2-px leaf strokes) on a 1-px grid, lit from `L = normalize(-0.62, -0.5, 0.6)`, then run through the finish pass (warm rim `#ffcfa2` left/top, cool bounce `#8d86ea` right, selective outline from ink `#150c29` / plum `#4a2c62`) and mirrored for the left-facing version. Each frame also exists as a white flash copy (`#fff8f0`). Every character casts the long sheared shadow (`kx 0.8, ky 0.3`, `#1a1034`) plus a contact ellipse at alpha 0.5. Proportions are head-heavy chibi: head ≈ 40% of height, a short cone body, 2-px legs; silhouettes must read at 1x (big round heads/bulbs, leaf crowns, clear legs, never more than ~4 colour steps in a 3x3 area). Each creature type owns **one ramp family** and one glow colour, so types read at a glance.

**Main character** — a pumpkin-headed figure in a teal hooded cape, 26x32 px sprite, feet anchor (13, 32):

- **Head** (≈ 40% of height): ellipsoid `rx 7.6, ry 6.4` centred at (13.5, 8.5) in the pumpkin ramp, with 4 vertical rib grooves (longitude ±0.085 around -0.62, -0.22, 0.2, 0.6 → -0.16 value). Stem from the stem ramp, a 4-px leaf from `tops`.
- **Face**: emissive carved face in 3/4 view shifted 1 px to the facing side — two upward triangle eyes (`#ffd05a`, core `#fff6c4`, edge `#ff9a2e`) and an 8-px jagged grin with a darker `#d4581e` lower row. Around every glowing hole the rind is re-coloured as a carved wall (ramp index 0 above, 1 at the sides, 2 below). Plus an additive warm glow r14 at the face, alpha 0.3 flickering `0.85 + 0.1 sin(8.1t) + 0.05 sin(19.3t)`.
- **Body**: a teal cape cone from y 14 to 25, half-width 3.8 → 7.2, cylinder-shaded with fold lines every 4 px, a magenta lining (`#7a2f5a → #c45a7a`) on the front edge, a ragged hem (every 3rd pixel cut, shifting with the frame). A hood blob behind the head, a leather strap and satchel with gold clasp pixels, a 2-px arm.
- **Legs**: 2-px pants columns (back leg one ramp step darker), 3-px leather boots.
- **Frames**: walk 6 frames — body bob `[1,0,0,1,0,0]`, head bob `[1,1,0,1,1,0]`, front foot x `[2,1,-1,-2,-1,1]`, lifts on frames 4–5 / 1–2, arm swing ±1, hem flutter; idle 4 frames — bob `[0,0,1,1]`. A separate "throwing" set with the arm extended forward. Each frame exists for both facings plus a white flash copy; the dash pose uses a `#c88cf0` silhouette copy.

**Small creature** — a violet root creature with a leafy top, 24x28:

- Pointed bulb `rx 7.6, ry 7.1` that narrows at the bottom (`rx * (1 - ny²*0.38)`), violet ramp (`#1a0d33 … #eea0d6`) on top, cream/ochre `rbody` belly, the seam a sine line broken by a 1-px checkerboard. Gloss highlight `#ffeefa` (NORIM).
- Three 2-px leaf strokes as a crown, 2-px root legs, a tail root.
- Angry eyes: 2-px emissive `#ff4f7a` with a `#ffe2ec` core, `#24082c` brows and a frown; eye glow 'eye' r3.
- Waddle: 6 frames, bulb shear `tilt [0,1,1,0,-1,-1]`. A second colour variant uses a magenta ramp.

**Fast creature** — a floating icy ghost, 26x30:

- Round head r 6.6, tapering S-curved tail 18 px, ice ramp (`#1a2252 … #f0fcff`), alpha 230 at the head → 75 at the tail and a Bayer-dithered dissolve below 55% of the tail.
- Hollow `#120c2c` eye sockets with a 1-px `#bff4ff` emissive pupil, a gaping mouth, a semi-transparent reaching arm.
- Finish with a white-cyan rim `#f4ffff` 0.5, bounce `#7466e6` 0.3, outline alpha 0.55 in blue outline colours (`#141640` / `#3a4a9a`).
- Floats 4 px up with a soft 16x6 oval shadow (alpha 70/255), occasional twinkle sparkles.

**Large creature** — a mossy colossus, 60x58:

- Huge ellipsoid `rx 19, ry 16.5` in an old-violet top / ochre belly, rough noise, a mossy cap with tiny flowers.
- Gnarled bark-ramp root arms and stubby legs, cracks with one glowing pixel, a heavy brow ridge with deep-set cyan eyes `#6ff5e0`, a glowing belly rune, a big leaf crown.
- Cyan glows r14 at the belly and r5 at the eye, pulsing `0.75 + 0.25 sin(2.2t)`; contact shadow radius 14.

## Props

Every prop is painted with the same ramp shading, finish pass (trees use the leaf rim `#ffd08a` at 0.5, cool 0.26) and a long sheared shadow (`kx 0.78, ky 0.28`, alpha 0.3, colour `#1a1034`), anchored at the base so props y-sort with characters. Organic materials only: bark, leaves, moss, stone, petals.

- **Round oak** 104x106: cylinder-shaded bark trunk (half-width 3.8 → 6.2, flaring at the base, moss on the shaded side) with 3–4 roots spreading over the ground; a canopy of 30 leaf clusters r 8–14 (plus 3 low clusters r 13) lit by the whole crown's normal `0.42 - gx*0.24 - gy*0.3`, darker undersides, small leaf cells (4.6 x 3.6 px, lit top row, dark seam).
- **Blossom tree**: the same build with a pink bloom ramp.
- **Birch** 70x112: white bark ramp with dark lenticels, 2 roots, trunk starting at y 30.
- **Mossy rock** (w+2 x h+2, e.g. 22x14): stone ramp blob with a noisy edge, faceted bands, a moss cap on the upper left with rare white flower pixels.
- **Ruined pillar** 20 wide, height + 9: plinth, cylinder-shaded fluted shaft (groove every 3 px), optional capital or a broken top; moss on top and at the foot, ivy climbing; optional cyan emissive rune with a cyan glow r12 at 0.4.
- **Stone arch** 76x70: two block pillars (joint every 9 px) and 11 voussoirs between radius 21 and 31, moss on the crown, hanging ivy; broken variant missing part of the arc with a fallen block at the foot.
- **Stone lantern** 16x31: plinth, post, a roof in 4 steps and a flame window (emissive flame ramp); warm light r16 at 0.6 and a ground pool r34, flickering.
- **Glowing mushroom cluster** 26x22: 3–4 caps on pale stems (cap r `2.2 + h*0.35`), an emissive gill row and emissive spots; cyan glow r14 at 0.3 and a cyan ground pool r30, pulsing.
- **Bushes** 30x21: 7 leaf blobs with noisy edges; berry, rose or white-flower variants (2x2 berries / 5-pixel flowers with a `#ffcf4e` centre).
- **Lupines** 16x26: 2–3 flower spikes (8–11 px) in lavender/pink/white with leaf fans at the base. **Big ferns** 30x18: 5–7 arching fronds.
- Trees fade to 55% opacity when the main character walks behind them.

## Effects and particles

- **Additive banded glow** — the core effect. Cached per `(type, r, flat)`; 3 bands if r < 5, 4 if r < 12, else 5; colour from hot core to tinted rim; alpha `(1 - band/bands)^1.6`; band edges broken with Bayer 8x8 dither; `globalCompositeOperation = 'lighter'`. Types: warm (`#fff0b8 #ffab4a #d8456a`), amber, cyan (`#e8fffa #58e8d6 #3a6ad0`), ice, pink, rose, eye (`#ffe0ea #ff4f7a #8a2060`), fly, sun. Flat (`ry = 0.55 r`) for ground pools.
- **Projectile** — 9x9 seed sprite baked in 16 rotations x 3 spin widths, amber glow r5 at 0.45, a 5-px trail `#ffe9a0 #ffc35a #ff9a4a #f06a6a #c04a8a` (alpha `0.8 - i*0.14`), a 2x1 shadow 7 px below. Launch flash: a 7x7 four-point star.
- **Impact** — short pink/ice bloom glow (0.16 s), a star, 3 petals of the struck creature's material (leaf/violet, ice, moss/ochre) with gravity 220.
- **Dissolve burst** — flash sprite stretched sx `1+0.3t`, squashed to sy 0.1 after t 0.3, alpha `1-0.8t`, a fading glow (pink, ice or cyan); 8–26 petals, 5–14 rising light motes, a gold ring for large creatures. No blood: things dissolve into flowers and light.
- **Emerge** — ground creatures rise out of a 2-row soil mound (`#2a1d2e` / `#4a3540`) with swirling pink/white petals (only the top part of the sprite drawn); ghosts stretch in (sx 0.6 → 1, sy 1.6 → 1).
- **Collectibles** — small amber shard 5x7 (blob, emissive sparkle pixel, 2-frame twinkle), large rose crystal 9x11 (faceted: 4 flat values by quadrant). Both bob ±1.2 px and have a flat glow under them and a round glow on them. When collected: a rising amber/rose mote; large ones add a ring.
- **Orbiting objects** (lanterns) — 14x17 mini violet bulb with a carved emissive face (`#ffc040 #ff8a2a #fff2b0`), a leaf on top, warm glow r13, a `hot` frame switching on `sin(11t) > 0.2`, a small soft shadow.
- **Dash** — 3 violet afterimages (alpha 0.16/0.32/0.48, 7-unit steps), 5 lavender dust puffs (4 sizes, ramp `#6a5a8a … #efe2e6`), petals.
- **Ring burst** — two elliptical gold pixel rings (`#ffe08e` + inner `#c48a3a`, y squashed 0.62) expanding to 80 and 44 px, 18 rising motes, 14 petals.
- **Hit flash on the main character** — red/ember petals, an 'eye' bloom, and a full-screen `#ff6a8a` multiply flash at `hurtT*0.35`.
- **Ambient** — 2 fireflies per 120-unit cell (1-px `#f6ffd0` core + 'fly' glow r5, pulsing `max(0, sin(1.4t+φ))`), 14 drifting 3x3 petals blown to the lower right.

## Atmosphere and lighting

- **Light model**: one low sun from the upper left/front: `L = normalize(-0.62, -0.5, 0.6)`. All shading, rims and shadows agree with it.
- **Rim** (finish pass): pixel with empty left neighbour → lerp to `#ffcfa2` by 0.42; empty top → 0.75 of that; empty top-left diagonal → 0.3. Otherwise empty right → lerp to `#8d86ea` by 0.22 (0.4 strength if only diagonals are empty). Emissive/NORIM pixels skip it.
- **Shadows**: sheared silhouettes `kx 0.8, ky 0.3` (props `0.78/0.28`), banded alpha 0.18/0.34/0.5, colour `#1a1034`; characters add a contact ellipse (radius 6, large creature 14) at 0.5. Shadows always fall to the upper right.
- **Coloured light**: additive flat pools on the ground — warm r50 at 0.42 + amber r16 at 0.35 around the main character, orbiting lanterns r26, stone lanterns r34, mushrooms (cyan r30), projectiles r7. Emissives are rare focal accents; never glow everything.
- **Screen grade** (on the low-res buffer, in this order):
  1. *Tilt-shift*: the top and bottom 16% strips are downsampled 2x, upsampled and masked back with a 0.95 → 0 gradient.
  2. *Tint* (multiply): linear gradient from (0, 0.1H) to (W, 0.9H): `#fff0dc` 0, `#f0dce0` 0.4, `#b8a6d4` 0.75, `#8a76c0` 1.
  3. *Bloom*: downsample to 1/5, multiply the small image with itself twice (squares → only highlights survive), draw back with `screen` at alpha 0.7 with smoothing on.
  4. *Sun glow + god rays*: radial gradient from (-0.05W, -0.1H), r 0.75W: `rgba(255,170,110,.55)` → `rgba(255,140,120,.22)` at 0.35 → 0; plus 7 rotated (0.42 rad) soft ray bands of alpha 0.05–0.12 fading out to the lower right. Drawn source-over at `0.9 + 0.1 sin(0.35t)`.
  5. *Vignette* (multiply, alpha 0.9): elliptical radial `#ffffff` at 0.22W → `#e4dcf0` → `#5c4a8a` at 0.72W. Deepen with a `#4a3a8a` multiply over time for a later hour.
- **Overlays**: a full-screen `#ff6a8a` multiply flash when the main character is hit; a radial `rgba(60,30,80,.55)` → `rgba(14,8,30,.86)` dim behind menus.

## UI

Storybook-at-dusk: translucent deep-indigo glass panels (`rgba(22,12,42,.72)`) with thin gold `#e8b85a` trim, gold 45°-rotated diamonds, engraved Cinzel headings with a warm glow and a 1–3 px dark drop line (`#1a0f24`), Pixelify Sans numbers. A full-width progress bar on top (teal → cream fill `#3fb0ae → #7ee0cc → #ffd08a → #fff2c4`, gold diamond end caps), a HUD panel top-left with a pixel heart icon and a sunset-orange bar (`#ffb36a → #f07a3a → #c2402c`), a central clock with a gold-ruled label, a counter top-right. Cards are violet-to-navy gradient panels with a gold frame, a dark 4 px moat, a faint 5 px gold outer ring and a gold diamond on the top edge; hover lifts 8 px and brightens the frame. Icons are 18x18 pixel sprites with the same rim/outline pass, scaled by integer factors only.

```css
.hud { font-family: 'Pixelify Sans', system-ui, sans-serif; color: #f4e6ff; }
.panel { background: linear-gradient(90deg, rgba(22,12,42,.72), rgba(22,12,42,.25));
  border-left: 2px solid #e8b85a; border-radius: 2px 18px 18px 2px; padding: 6px 14px 6px 8px; }
.bar { position: relative; height: 12px; border-radius: 2px; background: rgba(18,8,30,.85);
  border: 1px solid rgba(232,184,90,.7); box-shadow: 0 0 0 1px rgba(10,5,20,.8); }
.bar::before, .bar::after { content: ''; position: absolute; top: 50%; width: 9px; height: 9px; background: #e8b85a;
  transform: translateY(-50%) rotate(45deg); box-shadow: 0 0 8px rgba(255,200,120,.7); }
.bar::before { left: -6px; } .bar::after { right: -6px; }
.bar.warm > i { display: block; height: 100%; background: linear-gradient(#ffb36a 0%, #f07a3a 40%, #c2402c 100%);
  box-shadow: 0 0 10px rgba(255,120,60,.6), inset 0 1px 0 rgba(255,236,190,.6); }
.bar.teal > i { display: block; height: 100%; background: linear-gradient(90deg, #3fb0ae 0%, #7ee0cc 45%, #ffd08a 85%, #fff2c4 100%);
  box-shadow: 0 0 12px rgba(126,224,204,.55), inset 0 -3px 0 rgba(20,60,80,.35), inset 0 1px 0 rgba(255,255,255,.45); }
.card { width: 220px; min-height: 270px; padding: 26px 18px 18px; border-radius: 4px;
  background: linear-gradient(180deg, rgba(48,28,82,.94) 0%, rgba(26,16,50,.96) 60%, rgba(18,30,46,.96) 100%);
  border: 1px solid #e8b85a;
  box-shadow: 0 0 0 4px rgba(20,10,34,.85), 0 0 0 5px rgba(232,184,90,.35), 0 14px 30px rgba(0,0,0,.5), inset 0 0 30px rgba(126,224,204,.08); }
.card::before { content: ''; position: absolute; left: 50%; top: -6px; width: 10px; height: 10px; background: #e8b85a;
  transform: translateX(-50%) rotate(45deg); box-shadow: 0 0 10px rgba(255,200,120,.8); }
.overlay { background: radial-gradient(ellipse at 50% 45%, rgba(60,30,80,.55) 0%, rgba(14,8,30,.86) 75%); }
```

## Motion and animation

- **Main character**: walk 6 frames advanced at `anim * 1.5` (≈ 9 fps), idle 4 frames at 3.2 fps with a 1-px breathing bob. The throw pose squashes `sx 1+0.07, sy 1-0.06`; a celebration stretch `sy +0.12`; a hit squash `sx +0.1, sy -0.08` with a white flash while `hurtT > 0.55`; a blink at alpha 0.5 at 9 Hz right after a hit.
- **Small creature**: 6-frame waddle (`anim * 2.2`), bulb shear and leaf sway ±0.15 rad. **Fast creature (ghost)**: 6 frames at 9 fps, tail S-curve phase per frame, float `4 + 1.5 sin(3t)`. **Large creature**: 6 frames (`anim * 2.4`), 2-px stomp bob, arms swing.
- **Hit reaction** on creatures: `sx 1 + 0.14*flash, sy 1 - 0.12*flash`, flash sprite above 0.5.
- **Light flicker**: lantern `0.82 + 0.12 sin(9t) + 0.06 sin(23t)`; main-character light pool `0.9 + 0.06 sin(7.3t) + 0.04 sin(17.1t)`; mushrooms `0.75 + 0.25 sin(1.6t)`; collectibles twinkle `0.5 + 0.18 sin(4t)`.
- **Ambient**: grass sway 5 frames picked by `sin(2.1t + x*0.045 + y*0.03) + sin(0.7t + x*0.01)`; petals drift at 10–22 units/s.
- **Pixel discipline**: round every position; never draw sub-pixel or freely rotated sprites — rotations are pre-baked (16 directions).

## Do and don't

Do:
- Render at 360 art pixels of height, upscale by an integer factor, smoothing off.
- Shade every sprite pixel from the light vector `(-0.62, -0.5, 0.6)` into a hue-shifted ramp.
- Run the finish pass on every sprite: warm rim left/top, cool bounce right, selective tinted outline.
- Give every emissive pixel an additive *banded* glow.
- Cast long sheared shadows to the upper right in `#1a1034`.
- Apply the grade (tint, bloom, sun, vignette) on the low-res buffer before upscaling.
- Sprinkle tiny flowers, petals and fireflies everywhere.
- Bake everything once; per frame only blit.

Don't:
- Use pure black or single-colour outlines.
- Use smooth gradients or anti-aliased shapes inside sprites.
- Light from the right or drop shadows down/left — the sun is fixed.
- Draw at sub-pixel positions or rotate sprites at runtime.
- Use bright saturated daylight greens or an unlit, flat ground.
- Turn the UI into flat modern material design.
- Glow everything — emissives are rare focal accents.

## Implementation recipe

1. Create a low-res buffer: `up = max(1, round(H/360))`, buffer `ceil(W/up) x ceil(H/up)`; 1 world unit = 1 px.
2. Implement `Pix` (RGBA + flag array), `blob()` (ellipsoid N·L → ramp index) and a cylinder-row helper for trunks, capes, legs.
3. Define ramps for every material (copy the ones above, hue-shifted dark → light).
4. Implement `finish()` (rim + bounce + selective outline, canvas +1 px per side) and `makeShadow()` (shear `0.8/0.3`, 3 alpha bands).
5. Paint the main character at ~26x32 px: big shaded head with an emissive face, cone body, 2-px legs. Make 6 walk + 4 idle frames by offsetting parts by 1 px. Finish both facings (mirror the raw pixels, then finish) and bake flash copies.
6. Paint each creature type in its own ramp with glowing eyes; large creatures ~60 px, small creatures ~24 px.
7. Implement cached banded glows and draw them with `'lighter'` after every emissive sprite.
8. Build the ground: posterised fbm textures per material, a material map from large fbm fields, height-based edge shading, decals on a hashed grid, warm/cool macro light. Cache it in chunks.
9. Each frame: ground → light pools → shadows → y-sorted sprites + glows → projectiles/particles → fireflies/petals → grade on the buffer → nearest-neighbour upscale.
10. Build the HUD in DOM/CSS with indigo glass, gold trim, Cinzel + Pixelify Sans.
11. Check: at 1x every figure has a warm left edge, a violet right edge, a tinted outline, a shadow to the upper right; nothing is black; all positions are integers.

## Code

These are the core techniques from the module, made standalone. `starter.js` in this folder contains all of them plus the main character, a small root creature, a ghost, a tree, mushrooms, a rock, a ground baker and a complete preview scene. The full implementation is `../../js/styles/dusk.js`.

Ramp shading of an ellipsoid into a pixel buffer:

```js
const LDIR = (() => { const v = [-0.62, -0.5, 0.6], n = Math.hypot(...v); return v.map((c) => c / n); })();
/** buf = {w, h, d: Uint8ClampedArray(w*h*4)}; ramp = [[r,g,b], ...] dark -> light. */
function blob(buf, cx, cy, rx, ry, ramp, bias = 0) {
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx); x++) {
      if (x < 0 || y < 0 || x >= buf.w || y >= buf.h) continue;
      const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry, dd = nx * nx + ny * ny;
      if (dd > 1) continue;
      const nz = Math.sqrt(1 - dd);
      const v = (nx * LDIR[0] + ny * LDIR[1] + nz * LDIR[2]) * 0.5 + 0.5 + bias;
      const c = ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(v * ramp.length)))];
      const o = (y * buf.w + x) * 4;
      buf.d[o] = c[0]; buf.d[o + 1] = c[1]; buf.d[o + 2] = c[2]; buf.d[o + 3] = 255;
    }
  }
}
```

The finish pass — two-tone rim light and selective outline (returns a new RGBA array, 1 px larger per side):

```js
const RIM = [255, 207, 162], BOUNCE = [141, 134, 234], INK = [21, 12, 41], PLUM = [74, 44, 98];
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function finish(d, w, h, emit /* Uint8Array: 1 = emissive, skip rim */, rimA = 0.42, coolA = 0.22) {
  const sol = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0;
  const src = new Uint8ClampedArray(d);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, q = i * 4;
    if (!d[q + 3] || emit[i]) continue;
    const lit = !sol(x - 1, y) ? 1 : !sol(x, y - 1) ? 0.75 : !sol(x - 1, y - 1) ? 0.3 : 0;
    const dk = !sol(x + 1, y) ? 1 : (!sol(x + 1, y - 1) && !sol(x + 1, y + 1)) ? 0.4 : 0;
    const [c, t] = lit ? [RIM, rimA * lit] : [BOUNCE, coolA * dk];
    for (let k = 0; k < 3; k++) src[q + k] += (c[k] - src[q + k]) * t;
  }
  const W = w + 2, H = h + 2, out = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let k = 0; k < 4; k++) out[((y + 1) * W + x + 1) * 4 + k] = src[(y * w + x) * 4 + k];
  for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) {
    const x = X - 1, y = Y - 1;
    if (sol(x, y)) continue;
    let nb = -1, shadowSide = false;
    if (sol(x - 1, y)) { nb = y * w + x - 1; shadowSide = true; }
    else if (sol(x, y - 1)) { nb = (y - 1) * w + x; shadowSide = true; }
    else if (sol(x + 1, y)) nb = y * w + x + 1;
    else if (sol(x, y + 1)) nb = (y + 1) * w + x;
    if (nb < 0) continue;
    const c = [d[nb * 4], d[nb * 4 + 1], d[nb * 4 + 2]];
    const oc = shadowSide ? mix(c.map((v) => v * 0.32), INK, 0.55) : mix(c.map((v) => v * 0.55), PLUM, 0.45);
    const t = (Y * W + X) * 4;
    out[t] = oc[0]; out[t + 1] = oc[1]; out[t + 2] = oc[2]; out[t + 3] = d[nb * 4 + 3];
  }
  return { data: out, w: W, h: H };
}
```

Banded additive glow sprite (cache it; draw with `ctx.globalCompositeOperation = 'lighter'`):

```js
const B8 = [0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,
  3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21].map((v) => (v + 0.5) / 64);
function glowSprite(cols /* 3 rgb: core, mid, rim */, r, flat) {
  const rx = r, ry = flat ? Math.max(2, Math.round(r * 0.55)) : r, w = rx * 2 + 1, h = ry * 2 + 1;
  const bands = r < 5 ? 3 : r < 12 ? 4 : 5;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d'), img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dd = Math.hypot((x - rx) / (rx + 0.5), (y - ry) / (ry + 0.5));
    if (dd >= 1) continue;
    const b = dd * bands; let bi = Math.floor(b);
    if (b - bi > 0.55 && B8[((y & 7) << 3) | (x & 7)] < (b - bi - 0.55) / 0.45) bi++;   // dithered band edge
    if (bi >= bands) continue;
    const t = Math.min(1, (bi / bands) / (1 - 1 / bands)) * 2, i = Math.min(1, Math.floor(t)), f = t - i;
    const o = (y * w + x) * 4;
    for (let k = 0; k < 3; k++) img.data[o + k] = cols[i][k] + (cols[i + 1][k] - cols[i][k]) * f;
    img.data[o + 3] = 255 * Math.pow(1 - bi / bands, 1.6);
  }
  ctx.putImageData(img, 0, 0);
  return c;
}
// warm: [[255,240,184],[255,171,74],[216,69,106]]  cyan: [[232,255,250],[88,232,214],[58,106,208]]
```

Long sheared cast shadow (`ax, ay` = feet anchor inside the sprite):

```js
function shadowMask(d, w, h, ax, ay, kx = 0.8, ky = 0.3) {
  const pts = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!d[(y * w + x) * 4 + 3]) continue;
    const hgt = Math.max(0, ay - (y + 0.5));                 // height above the feet
    pts.push(Math.floor(x + hgt * kx), Math.floor(ay - 0.5 - hgt * ky));
  }
  return pts; // rasterise into a mask, close 1-px gaps, add a 1-px outer band; fill #1a1034 at alpha 0.34 (band 0.18)
}
```

Screen grade on the low-res buffer `b` (W x H), before the nearest-neighbour upscale:

```js
function grade(b, W, H, tint, sun, vig, small1, small2) {   // tint/sun/vig: prebaked W x H canvases; small: W/5 x H/5
  b.globalCompositeOperation = 'multiply'; b.drawImage(tint, 0, 0);
  const s1 = small1.getContext('2d'), s2 = small2.getContext('2d');
  s1.globalCompositeOperation = 'copy'; s1.drawImage(b.canvas, 0, 0, W, H, 0, 0, small1.width, small1.height);
  s2.globalCompositeOperation = 'copy'; s2.drawImage(small1, 0, 0);
  s2.globalCompositeOperation = 'multiply'; s2.drawImage(small1, 0, 0); s2.drawImage(small1, 0, 0); // keep highlights only
  b.imageSmoothingEnabled = true; b.globalCompositeOperation = 'screen'; b.globalAlpha = 0.7;
  b.drawImage(small2, 0, 0, W, H); b.imageSmoothingEnabled = false;
  b.globalCompositeOperation = 'source-over'; b.globalAlpha = 0.9; b.drawImage(sun, 0, 0);
  b.globalCompositeOperation = 'multiply'; b.drawImage(vig, 0, 0);
  b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1;
}
```

## Adapting it to your project

Keep fixed (this *is* the style):
- 1 unit = 1 art pixel, ~360 px view height, integer upscale.
- The light vector, the rim/bounce colours and the selective outline rule.
- Hue-shifted ramps, banded additive glows, sheared shadows to the upper right.
- The grade chain (tint, bloom, sun, vignette) and the "warmth comes only from light" rule.

May change:
- **Setting**: swap ramps for another organic biome (autumn forest: rust/ochre leaf ramps; snowy dusk: lavender-white ground, keep warm rims; swamp: teal water dominant). Re-derive every ramp with the same hue-shift direction.
- **Characters**: any species, as long as it is built from shaded primitives, has a head-heavy silhouette, one ramp family per type and emissive eyes/faces with glows.
- **Time of day**: shift the tint gradient (more violet = later; `#4a3a8a` multiply for midnight). Do not go to neutral daylight.
- **Camera**: side views work if you keep the sun upper-left and shear shadows onto the floor plane; towns can use the stone/ruin textures as streets.
- **Resolution**: 270–400 px of height all work; below that the rim/outline eats the forms.
- **Mixing elements**: the characters keep their look on another world as long as the rim, outline and sheared shadow stay; the world and atmosphere grade can host flat-shaded sprites from other styles, but give them at least the warm-left / violet-right rim.

## Performance notes

- **Bake once**: characters (2 facings x 6 walk + 4 idle + throw frames + flash copies), props, shadows, glow sprites (cache by type/radius/flat), petals, 4x6 digit sprites (cache up to 400 numbers). Init takes ~100–300 ms.
- **Ground**: 256x256 chunks built with generators that `yield` every 8–32 rows; 5 ms budget per frame; cache up to 90 chunks; field values sampled on an 8-unit grid and interpolated.
- **Per frame**: blits only, plus ~50 sway sprites, up to a few hundred small glows and five full-buffer composites. Because the buffer is tiny (~640x360), the grade costs well under 2 ms.
- **Hot spots**: many big glows (keep r ≤ 50 and counts bounded), the bloom downsample (keep it at 1/5), and painting sprites at runtime — never paint per frame.

## Copy-paste prompt

```text
Use the Dusk Grove art style for my project: modern HD-2D pixel art at golden-to-violet dusk.
- Render to a low-res buffer 360 px tall (1 world unit = 1 px), upscale by an integer factor with imageSmoothingEnabled=false.
- No image files: paint every sprite pixel by pixel from shaded ellipsoids/cylinders. Shade with
  v = dot(normal, normalize(-0.62,-0.5,0.6))*0.5+0.5 and pick ramp[floor(v*len)] from hand-made hue-shifted ramps
  (darks shift to indigo/violet, lights to warm yellow). No smooth gradients inside sprites, no pure black.
- Finish pass on every sprite: warm rim #ffcfa2 (0.42) on left/top edges, cool bounce #8d86ea (0.22) on right edges,
  1-px selective outline = neighbour colour*0.32 mixed with ink #150c29 (shadow side) or *0.55 with plum #4a2c62 (lit side).
- Long cast shadows: silhouette sheared x+h*0.8, y-h*0.3 (towards upper right), #1a1034, alpha bands 0.18/0.34/0.5.
- Emissive faces/eyes/mushrooms/lanterns + additive banded glows (3–5 dithered bands, 'lighter').
- Main character ~26x32 px, head-heavy, glowing carved face; walk 6 frames, idle 4; each creature type owns one ramp + glow colour.
- Props: round oaks with leaf-cluster canopies, mossy rocks, ruined pillars, stone lanterns, glowing mushrooms, all with the same rim and shadow.
- Ground: posterised fbm grass (#0a1d2a…#62a056) with tufts and tiny 3–5 px flowers, meadows, forest earth, mossy stone ruins, ponds.
- Fireflies and drifting petals; impacts and dissolves burst into petals and light motes, no gore.
- Grade on the buffer: multiply #fff0dc→#f0dce0→#b8a6d4→#8a76c0 (top-left to bottom-right), bloom (1/5 size, squared, screen 0.7),
  upper-left sun glow, violet vignette #5c4a8a.
- UI: indigo glass panels rgba(22,12,42,.72), gold #e8b85a trim and diamonds, Cinzel 900 headings with warm glow, Pixelify Sans numbers.
- Round every draw position to whole pixels; bake all sprites/shadows/glows once.
```
