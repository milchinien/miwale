# Bouncy Cartoon — Game Art Style Spec

> Candy-bright HD vector cartoon: thick deep-plum outlines, one cel-shade crescent, one white gloss and bouncy squash & stretch.

A clean, high-resolution vector cartoon. Every object is a chunky,
rounded silhouette with **one** thick deep-plum outline (`#3a2240`), a flat fill, **exactly one**
darker cel-shade crescent and **one** white glossy highlight. Characters are big-headed, round
and expressive (angry brows, googly eyes, carved grins) and bounce constantly with squash and
stretch. The ground is a flat pastel play-mat of soft grass, lilac and sand regions with crisp
edges and tiny vector tufts and flowers, so the outlined figures pop clearly even when several
hundred of them crowd the screen. The examples below are a pumpkin-headed main character, small
purple-and-cream root-bulb creatures, floating white ghosts and a large root giant.

## At a glance

| | |
| --- | --- |
| Family | Vector · Cartoon |
| Mood | cheerful, bouncy, toy-like, punchy, friendly |
| Best for | top-down arena shooters, crowded top-down action, casual mobile action, party games, kid-friendly adventures |
| Renderer | Canvas 2D, fully procedural (no image assets), sprites baked once into offscreen canvases |
| Pixel art | No – native resolution, sprites baked at 3–6 px per world unit |
| Complexity | 3/10 |
| Fonts | Lilita One (numbers, titles), Fredoka 400–700 (labels, body) |
| Key colours | `#3a2240` plum outline · `#9ec671` meadow · `#ff952b` pumpkin · `#2f9c95` teal · `#9b5cd0` purple · `#f6f8ff` ghost · `#ffd43f` glow · `#fff4de` panel |

## When to use it

- **Great fit:** scenes with hundreds of on-screen figures that must stay readable – the single
  outline colour merges each figure into one crisp sticker-like silhouette.
- **Great fit:** casual, family-friendly or party games; arena shooters; shop or inventory screens
  with lots of item icons (icons use the very same painter at 2.6 px outline on a 48 px grid).
- **Great fit for AI-generated content:** shapes are ellipses, capsules and blobs described by a
  handful of numbers – new characters and props are fast to author.
- **Bad fit:** horror, grim drama, realistic sims – the style is relentlessly cheerful.
- **Bad fit:** atmospheric exploration that relies on darkness or lighting; there is no lighting
  system, only implied top-left light.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Plum Outline | `#3a2240` | The only ink colour: silhouettes, pupils, brows, mouths, HUD borders, text outlines |
| Meadow | `#9ec671` | Base ground (~55% of the screen) |
| Deep Grass | `#79ae5a` | Dark grass patches (rim `#6a9e50`) |
| Lilac Meadow | `#c8b6da` | Flower-meadow regions (rim `#b4a0cc`) |
| Sand Path | `#ebd3a0` | Paths and clearings (rim `#d8ba85`) |
| Clay Field | `#daa070` | Autumn/rust regions (rim `#c78a60`) |
| Pumpkin | `#ff952b` | Main character head; shade `#ea681c`, rib lines `#ec7a22` |
| Candle Glow | `#ffd43f` | Carved eyes/mouth, stars, highlighted numbers; hot core `#fff3b0`, carve rim `#8a3214` |
| Teal Coat | `#2f9c95` | Main character body; shade `#22736f` |
| Leaf / Scarf | `#86cf4c` / `#8ad04c` | Leaves and scarf; shades `#59a33a` / `#5ea83a`, scarf stripes `#c3ec8c` |
| Legs / Shoes | `#41703f` / `#6b3d2c` | Shades `#2f5431` / `#4c291f` |
| Bulb Purple | `#9b5cd0` | Small creature top (variants `#bd5aa6`, `#7d66d8`); shade `#7241aa` |
| Bulb Cream | `#f8eacb` | Small creature bottom; shade `#e0c595` |
| Root Beige | `#efd49e` | Creature limbs and large-creature arms; shade `#cfac70` |
| Ghost White | `#f6f8ff` | Floating ghost creature; shade `#c3d0ef`, tongue `#ff7f9e`, catchlight `#9fd8ff` |
| Giant | `#7b3f99` / `#efc96f` | Large creature top / bottom; shades `#58297a` / `#cf9f4c`, bandages `#f6e6c4` |
| Gem Green / Blue | `#74e690` / `#62c8ff` | Gem collectibles (small / large); facets `#2fae66` / `#2f83e0` |
| Berry Red | `#ef5a52` | Berries, mushroom caps |
| Panel Cream | `#fff4de` | HUD panels and cards |
| Bar Trough | `#563a5e` | Bar background |
| Shadow | `rgba(50,30,72,0.2)` | Ground shadows (plum at 20%) |

**Palette rules**

- Every colour is a **pair**: fill + one darker shade, about 15–25% darker and a touch more
  saturated, often shifted toward purple/warm (`#ff952b` → `#ea681c`, `#f6f8ff` → `#c3d0ef`).
  Never a third tone on a body.
- The outline is **always** `#3a2240`. Never black, never per-object outline colours.
- Ground colours are pastel and desaturated; characters are saturated. The main character is
  warm (orange + teal), creatures are cool (purple, white) – the main character never gets lost
  in a crowd.
- Highlights are pure white at alpha 0.92. Ground shadows are plum at 20%, never grey.
- `#ffd43f` is reserved for light, stars, collect sparkles and highlighted numbers.

## Typography

**Lilita One** (400) – floating numbers, clock, counters, titles, card names.
Google Fonts: `https://fonts.googleapis.com/css2?family=Lilita+One&display=swap`

**Fredoka** (400, 500, 600, 700) – labels, descriptions, hints.
Google Fonts: `https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap`

Text effects:

- **Sticker outline:** HUD numbers get a 16-direction plum `text-shadow` ring (radius 2 px for
  18 px text, 2.5 px for the 36 px clock, 5 px for 78 px titles) plus an extra solid drop of the
  same plum 2–5 px further down. The module generates it:

```css
/* tso(2.5, '#3a2240', 2) – shortened to 8 directions here */
.clock-time { font: 400 36px/1.1 'Lilita One', 'Fredoka', sans-serif; letter-spacing: 1.5px; color: #ff8a2a;
  text-shadow: 2.5px 0 0 #3a2240, -2.5px 0 0 #3a2240, 0 2.5px 0 #3a2240, 0 -2.5px 0 #3a2240,
    1.8px 1.8px 0 #3a2240, -1.8px 1.8px 0 #3a2240, 1.8px -1.8px 0 #3a2240, -1.8px -1.8px 0 #3a2240, 0 5px 0 #3a2240; }
.clock-label { font: 600 12px 'Fredoka', sans-serif; letter-spacing: 1.6px; color: #8a6280; }
.big-title { font: 400 78px 'Lilita One', sans-serif; letter-spacing: 3px; color: #ffd43f; transform: rotate(-3deg); }
```

- **In-canvas floating numbers:** Lilita One at 9 world units (highlighted values 12.5 u). Stroke
  plum at `0.3*fs`, draw a plum copy `0.09*fs` lower (stroke + fill) as a drop, then the face:
  white, or for highlighted values a vertical gradient `#fff27a` → `#ffc93a` (0.5) → `#ff8a2a`.
  Cache one sprite per value.
- Big titles are slightly rotated (-2° to -3°) and pop in with `cubic-bezier(.3,1.7,.5,1)`.

## Rendering technique

Shared by every element (characters, props, effects, icons):

1. **Choose sprite resolution.** `K = clamp(round(screenPxPerUnit * 1.25), 3, 6)` canvas px per
   world unit, where `screenPxPerUnit = displayHeight / 360`.
2. **Describe every sprite as a part list** `fn(P)` declared back-to-front:
   `P.part(shapeFn, fill, { shade, sh:[dx,dy], inner, detail, hi, hi2, ol })` plus
   `P.detail(fn)` for faces and strokes.
3. **Bake each sprite in two passes** into its own canvas (`ctx.scale(K,K)`, round joins/caps):
   - *Outline pass*: every part is stroked **and** filled in `#3a2240` with
     `lineWidth = 2 * 1.15` u. Because all parts are filled plum, overlaps merge into one
     silhouette with one even 1.15 u border.
   - *Fill pass*: each part clips to its shape, optionally strokes a 0.55 u inner separation line
     (`lineWidth 1.1`, only the inner half survives the clip), fills the whole part with the
     **shade** colour, then clips again to the **same shape translated by `sh`** (e.g.
     `[-1.9, -1.6]`) and fills the **lit** colour. The uncovered sliver bottom-right is the cel
     crescent. Then `detail`, then gloss: white ellipse `hi` at alpha 0.92 plus a white dot `hi2`.
   - *Flash pass* (third copy): same, but lit = `#ffffff`, shade = `#efe6f6`, no details.
4. **Bake 4 animation frames** for each animated figure, a flash copy of each, and mirrored copies
   (or mirror at blit time with `scale(-1,1)`).
5. **Per frame:** ground chunks (cached images) → ground overlay (dirt holes) → gem collectibles →
   one batched shadow path → y-sorted props, creatures, main character → orbiting objects →
   projectiles → particles → floating numbers → world overlay (butterflies) → HTML HUD.
6. **Blit with transforms only:** `translate(x, y) · rotate(tilt) · scale(sx*facing, sy)` around
   the **feet**, then `drawImage(c, -ox/K, -oy/K, w/K, h/K)`. All squash/stretch is done here.
7. Everything is drawn in world units (360 units visible vertically); no pixel snapping needed.

## World and ground

The ground is a **flat-colour play-mat with no outlines** – it stays visually behind every
outlined figure and prop.

- **Base** `#9ec671` (meadow).
- **Regions** are 2-octave fbm noise fields with a gentle domain warp (perlin at 1/900, ±90 u),
  each thresholded so `value > 0` means inside: dark grass `#79ae5a` (`fbm(X/520) - 0.6`), lilac
  meadows `#c8b6da` (`fbm(X/800) - 0.635`), clay fields `#daa070` (`fbm(X/1150) - 0.615`), sand
  clearings `#ebd3a0` (`fbm(X/700) - 0.66`) and **sand paths of even width** =
  `(0.0175 - |perlin(x/1700)|) * 3` (the zero contour of a noise field, so it winds and branches).
  Layers stack bottom → top in that order. Regions are big and calm – 100–400 units across.
- **Crisp edges with a rim:** fields are sampled on a coarse 4-unit grid. Per pixel, the value
  `s` and its gradient are bilinearly interpolated; `dist = s / |grad|` (in pixels) is an analytic
  signed distance. Coverage `clamp(dist + 0.5, 0, 1)` gives a 1-px anti-aliased edge; a rim
  factor `clamp(rimPx - dist + 0.5, 0, 1)` blends in the rim colour for a darker band just inside
  the edge: dark grass rim `#6a9e50` 1.7 u, lilac `#b4a0cc` 2.0 u, clay `#c78a60` 2.3 u, sand
  `#d8ba85` 2.5 u. Grid cells fully inside/outside are flat-filled (fast path).
- **Brightness tint** ±3.5% from noise at 1/1500.
- **Decals** on a 12-unit jittered grid, only where the material is the same within 4.5 u. They
  are flat (no outline, no crescent):
  - meadow: 30% grass tufts (3 curved blades, stroke 0.8 u, `rgb(130,175,94)`), 6% flowers
    (5 petals radius 0.72·s at distance 0.95·s, white/cream/yellow `#f8de6c`/pink `#f4b3c8`,
    centre `#f2a23a`), 4% dot clusters;
  - dark grass: 38% tufts `rgb(98,150,74)`; lilac: 50% flowers (`#f3e9fb`, `#a98bd4`,
    `#f6bad3`, centre `#f6d36a`) + 12% tufts `rgb(170,150,192)`;
  - clay: fallen leaves (`#c9773f`, `#e3ad5c`, `#bf5f3e`) with a 0.35 u vein;
  - sand: 10% pebbles (3 stacked ellipses `#b9a588`, `#cdbfae`, `#ddd2c4`), 16% dots.
- **Dirt holes** (ground decal from which ground creatures emerge): a dirt ellipse `#b07a4c` with
  a 0.8 u plum rim and a dark centre `#43283f` grows with outBack; dirt crumbs (circles r 1.3
  `#9c6a42`, plum 0.5 u rim) fly out.
- Chunks are 256 units, rendered at up to 3 px/unit, generated incrementally (generator with
  `yield` every few rows).

## Characters

All figures use the shared two-pass painter: one plum outline (1.15 u outer, 0.55 u inner lines),
one cel crescent at the lower-right, one white gloss at the upper-left, 4 baked frames plus a
white flash copy. Heads are big (~60% of the height), bodies and limbs tiny and stubby, and every
figure type has its own unmistakable silhouette.

**Main character (pumpkin-head kid)** – box `[-15,-34] .. [15,2.5]`, drawn at scale 1.1 (≈ 25 u
wide, 37 u tall incl. stem), feet at y = 0.

- **Head:** squircle pumpkin path (`|cos|^0.85 * rx`, `|sin|^0.92 * ry`, gaussian dents at top
  and bottom) centred at (0.4, -19.6), `rx 11.2`, `ry 9.1`. Fill `#ff952b`, shade `#ea681c`,
  crescent offset `[-1.9, -1.6]`, inner line 0.55, four rib curves (`quadraticCurveTo`, 0.6 u,
  `#ec7a22`). Gloss ellipse at (cx-6.3, cy-4.3) radii 2.5×1.3 rot -0.6 and a 0.6 u dot.
- **Face (carved):** offset +2.2 u toward the facing side. Triangle eyes (rounded 0.8) and a
  crescent grin: fill the hole `#8a3214`, clip, translate (0.25, 0.85) and fill the same shape
  `#ffd43f` → visible carve depth on top. Hot cores `#fff3b0` in the eyes, 3 rounded pumpkin
  teeth clipped into the mouth. Pained-face variant: chevron `> <` eyes and an O mouth.
- **Stem** capsule (0.1,-27)→(1.2,-30.9) r 1.3 `#7f9b3b`; one leaf (len 5.4, width 2) with midrib;
  a 0.6 u plum curly tendril.
- **Body:** teal `#2f9c95` ellipse 4.5×4.4 at (0,-8.3) with two cream buttons; green scarf
  ellipse 5.7×2.3 at y -11 plus a blob scarf tail hanging back with two light stripes `#c3ec8c`
  and fringe strokes.
- **Limbs:** capsules r 1.15 (arms, length 3.4) with cream ball hands r 1.5; legs `#41703f` r 1.35
  from y -5.6 to the feet, shoes `#6b3d2c` = ellipse 2.1×1.35 with a tiny gloss.
- **4 frames** `[backFootX, backFootY, frontFootX, frontFootY, backArm, frontArm, scarfPhase]`:
  `[-2.3,0, 2.3,0, .25,-.25, 0]`, `[-3.7,-.2, 3.9,-.5, .9,-.8, 1.6]`,
  `[-2,-1.5, 2.9,-2.1, .35,-.15, 3.2]`, `[2.7,-.6, -1.3,-.2, -.75,.85, 4.8]`.
- Facing = horizontal mirror of the baked canvas.

**Small creature (grumpy root bulb)** – scale 0.9, box `[-14,-32]..[14,2.5]`.

- Bulb body (bezier onion shape, top -21.6, bottom -2.6, half-width 10.4) with a **two-tone
  fill**: cream `#f8eacb` bottom, purple `#9b5cd0` top separated by a sine wave
  (`y = -10.8 + 0.8 sin(0.9x + 0.6)`), both with their own shades (`#e0c595`, `#7241aa`).
  Crescent `[-1.8,-1.5]`.
- Three leaves (lengths 8.2, 8, 10.2) on top, swaying ±0.1 rad per frame. Two beige root capsule
  legs r 1.45.
- Face: googly eyes (white ellipses 2.5×2.8 and 2.3×2.7 with 0.7 u plum rim, pupils r 1.25
  looking toward the front, white catchlights r 0.38), angry brows 1.35 u, small frown arc 0.9 u.
- Three colour variants for the top: purple `#9b5cd0`, magenta `#bd5aa6`, indigo `#7d66d8`.

**Fast creature (floating ghost)** – box `[-15,-28]..[14,2.5]`.

- Body: `#f6f8ff` bezier dome (shade `#c3d0ef`) with a 3-scallop hem animated by phase and a wispy
  tail curling back; little stub arms as ellipses.
- Eyes: plum ovals with `#9fd8ff` catchlights; gaping plum mouth with pink tongue `#ff7f9e` and
  two white fangs.
- After baking, the bottom 9 u fade to 42% alpha (`destination-in` linear gradient), so it looks
  like it hovers.

**Large creature (root giant)** – box `[-28,-68]..[29,3]`, about 2.5× the small creature.

- Body 39 u wide, 41 u tall, purple `#7b3f99` top / ochre `#efc96f` bottom (shades `#58297a` /
  `#cf9f4c`), crescent `[-2.8,-2.3]`.
- Five big leaves in two greens, stubby root legs r 3.5 with ellipse feet, thick capsule arms
  r 3.1.
- A bandage cross (`#f6e6c4`, rounded rects 11.5×3.4 at ±0.68 rad) and a bandaged forearm,
  zig-zag crack lines 0.75 u.
- Glowing `#ffd43f` eyes, heavy plum brow wedges and a wide plum grimace with two rows of cream
  triangle teeth (`#fff6e2`).

**Creating new figures:** start from a distinctive silhouette (blob, capsule tower, bean, star),
give it a big readable face (googly eyes + brows, or a carved glowing face), a fill/shade pair,
4 frames, a flash copy and its own shadow size. Large figures are 2–2.5× the small ones; a giant
centrepiece can be 4×.

## Props

Scenery is painted with exactly the same two-pass painter as the characters, so it carries the
same plum outline, crescent and gloss. Each prop is baked once (1–5 variants, plus mirrored
copies) and stands on its own flat plum shadow.

- **Round tree** – box `[-20,-64]..[20,2]`. Tapered bark trunk `#a56f48` / shade `#7c4e33` with a
  small knot circle. Canopy = 6 overlapping circles (radius 7–11.5 u) merged as **one** part,
  crescent `[-2.8,-2.6]`, six small 0.75 u shade arcs, gloss ellipse 3.3×1.7 plus a dot. Canopy
  pairs: green `#7fca5c`/`#57a243`, orange `#f2a64c`/`#d57c36`, lime `#a9d65a`/`#7fb343`, gold
  `#efc54e`/`#d09d36`. The green tree carries three red apples (r 1.4, `#ef5a52`, 0.5 u plum rim,
  white catchlight).
- **Tiered pine** – three rounded triangles (corner radius 2.6 u, half-widths 14 / 11.5 / 9,
  heights 18 / 16 / 14) in `#4fa564` / shade `#36804b` over a short bark trunk, gloss on the top
  tier.
- **Bush** – box `[-15,-20]..[15,2]`, 4 ellipses as one part, crescent `[-2.1,-2.0]`, three shade
  arcs. Greens `#73c257`/`#4e9a40`, `#8acb5a`/`#61a444`, `#9ad16a`/`#6daa4c`. Variants: red berries
  (r 1.15 with plum rim and catchlight) or pink 5-petal flowers `#f7b5d0` with `#ffd43f` centres.
- **Rock** – 7-point Catmull-Rom blob `#bdb5cd` / shade `#918aa9` with a small zig-zag crack line,
  in three sizes (×0.66, ×1, ×1.2); the large one wears a mossy cap `#8cc65a` / `#66a443`.
- **Pumpkin** – squircle pumpkin `#f59a3a` / shade `#d96f26` with rib lines, a short stem, a leaf
  with midrib and a curly tendril; single (rx 8.8, ry 6.6) or a pair with a smaller one (rx 6.0).
- **Mushrooms** – a pair of different sizes: cream stalks `#f6ead2` / `#d9c6a4`, caps red
  `#ec5b52` / `#c03f45` or brown `#c98a52` / `#a4683a` with cream dots `#fff6e6`.
- **Fence** – two rounded rails 35×2.7 u and three pointed posts with nail dots, wood `#d4a066` /
  shade `#a9743f`.
- **Signpost** – wooden post plus an arrow-shaped board `#e4b77b` / `#c38f56` with a small painted
  pumpkin and an arrow.
- **Hay stack** – domed bezier mound `#f3cf62` / shade `#d6a33c` with 16 straw strokes `#c99434`,
  6 light strokes `#fbe9a4` and a few straws sticking out of the top.
- **Placement by region:** meadow = round trees, bushes, rocks, mushrooms, fences, signs; dark
  grass = pines, berry bushes, mushrooms, mossy rocks; lilac = flower bushes, lime trees, small
  rocks; clay = pumpkins, orange/gold trees, hay, fences, brown mushrooms; sand = rocks, hay,
  signs, fences.
- **Sway:** trees and bushes skew around their base (`sin(1.3t + seed)` × 0.025 for trees, 0.035
  for bushes); everything else is static.

## Effects and particles

All particles are baked sprites from the same painter (outlined, crescented):

- **Projectile:** cream seed (`#fff1c8`, shade `#e6c68a`, outline 0.85 u) whose height scales
  `0.55 + 0.45|cos(spin)|` to fake spin, with a white speed streak: three round-cap lines (1.0 u
  centre, 0.75 u sides at ±2 u) with a linear gradient alpha 0.95 → 0 over 14 units behind it.
  Small cream puff when it is launched.
- **Impact star:** 8-point white star (r 5.6 / 2.6, rounded 0.4, shade `#fff3b5`), life 0.14 s,
  scale 0.5 → 1.2 → 0.3; 60% chance of a 4-point white spark (shade `#fff0a0`) flying off with
  gravity 220.
- **White flash:** overlay the white flash copy at `min(0.85, flash*1.3)` alpha and squash
  (`sx *= 1 + 0.22f`, `sy *= 1 - 0.18f`).
- **Pop-out burst:** inflate the white flash sprite to 1.28× in 0.22 s with a ±10% wobble
  (`sin(q*40)`), then shrink to 0 by 0.5 s. Spawn 6 (large creature: 9) cloud puffs radially
  (5 merged ellipses, white/blue-white/orange variants, scale outBack in the first 20% then
  quadratic shrink, rising 7 u), 2–6 yellow stars (`#ffd43f`/`#f39a1e`) with gravity 180, and
  4–10 colour chunks (6-point blobs in the figure's colours, outline 0.75 u) bouncing away.
  Large creatures add a shockwave ring.
- **Shockwave ring:** flat ellipse (ry = 0.45·r), r = size·(4 + 26·outQuad(t)), stroked plum at
  width `w + 1.4`, then white/yellow at `w`, `w = 2.4·(1 - t)`.
- **Dash smear:** 3 white after-images at alpha `0.42/i`, 7 u apart, figure stretched 1.2 × 0.88,
  cream dust puffs.
- **Celebration burst:** yellow ring, 10 stars in a circle, 18 outlined confetti rectangles
  (0.45 u outline) in `#ff6b6b #ffd43f #62c8ff #74e690 #c38bff #ff9e3d` that flip by scaling y
  with `cos(t*9)`.
- **Gem collectibles:** rounded pentagon (`roundPoly`, r 0.55) `#74e690` with a dark facet
  triangle `#2fae66`, a 35% plum girdle line, gloss + dot; the large gem is ×1.55 in blue
  `#62c8ff` / `#2f83e0`. Gems bob above their own small shadow; when collected they arc up 10 u
  with outBack and leave a small spark.
- **Orbiting lantern:** a mini purple/cream root bulb with a carved glowing face plus an additive
  radial glow sprite (`rgba(255,226,120,.75)` → 0) pulsing at alpha 0.5±0.12.
- **Floating numbers:** see Typography – baked Lilita One sprites, pop 0.3 → 1.35 → 1.0.
- **Ring of puffs:** 10 orange puffs in a ring for the main character's own pop-out.

## Atmosphere and lighting

- **No lighting system.** Light is implied from the top-left by the cel crescent (always bottom
  right) and the gloss (always top left, pure white at 0.92 alpha).
- **Ground shadows:** flat ellipses (main character 9.2×3.3 u at scale 1.1, small creature
  7.7×2.8, ghost 5.8×2.1, large creature 18.5×5.8, round tree 16×5.2, pine 15×5, bush 12×3.8,
  rock 9.5×3, pumpkin 10×3.2, mushrooms 7×2.3, fence 18×2.6, sign 6×2, hay 14×4) collected into
  **one path** per frame and filled once with `rgba(50,30,72,0.2)` – overlapping shadows never
  stack darker. The main character's shadow shrinks while hopping; floating things (ghost, gems,
  lanterns, butterflies) have small detached shadows below them. Never grey, black or blurred.
- **Glow** only for light sources: an additive (`lighter`) radial sprite behind lanterns; carved
  faces glow by colour alone (`#ffd43f` with a `#fff3b0` core).
- **Ambient life:** butterflies (4 pastel wing pairs `#fff6d0`/`#f2d77a`, `#ffd1e4`/`#f39cbf`,
  `#d4ecff`/`#9cc9f2`, `#fff1a8`/`#f5c542`, 0.55 u outline) drift at z 16 over the meadow with
  their own small shadows.
- **Overlays:** none on the live scene. A menu overlay dims it with `backdrop-filter:
  saturate(.2) brightness(.78)` + a purple veil `rgba(72,36,104,.6)` and cream sunburst rays
  (`repeating-conic-gradient`, 9° stripes). An end-screen overlay goes `grayscale(1)
  brightness(.62) blur(2px)` under a purple radial vignette (`rgba(40,18,58,.55)` at the edges
  over `rgba(70,40,105,.5)`).

## UI

Chunky toy HUD in HTML/CSS: cream pills and plum troughs, 4 px plum borders, big radii and a
**solid** 4–5 px plum drop (`box-shadow: 0 5px 0`) instead of blurred shadows. Bars get a 3-stop
vertical gradient and a white gloss strip. Counters use Lilita One with the sticker outline,
labels Fredoka 600 in muted mauve `#8a6280`. Icons are drawn with the same part painter on a
48 px grid with a 2.6 px outline (heart, root bulb, lightning, pot, basket...). Choice cards have
a coloured header band (orange, mint, violet) and pop in with overshoot easing.

```css
.hud-panel { background: #fff4de; border: 4px solid #3a2240; border-radius: 20px;
  box-shadow: 0 5px 0 #3a2240; padding: 2px 24px 7px; color: #3a2240;
  font-family: 'Fredoka', 'Baloo 2', system-ui, sans-serif; }
.bar { position: relative; height: 32px; background: #563a5e; border: 4px solid #3a2240;
  border-radius: 17px; box-shadow: 0 4px 0 #3a2240, inset 0 4px 0 rgba(0,0,0,.25); overflow: hidden; }
.bar-fill { position: relative; height: 100%; border-radius: 0 13px 13px 0;
  background: linear-gradient(180deg, #ff9a9a 0%, #ff5466 48%, #df3550 100%);
  box-shadow: inset 0 -3px 0 rgba(0,0,0,.12); }
.bar-fill::after { content: ''; position: absolute; left: 9px; right: 12px; top: 4px; height: 5px;
  border-radius: 3px; background: rgba(255,255,255,.55); }
.bar.alt { height: 26px; border-radius: 15px; }
.bar.alt .bar-fill { background: linear-gradient(180deg, #9af7d8 0%, #45d6ad 50%, #2cb892 100%); }
.card { width: 236px; min-height: 304px; color: #3a2240; border: 5px solid #3a2240; border-radius: 28px;
  background: linear-gradient(180deg, #ffd27f 0, #ffb24c 92px, #fff6e4 92px);
  box-shadow: 0 9px 0 #3a2240, 0 18px 30px rgba(20,8,30,.35);
  transition: transform .14s cubic-bezier(.3,1.6,.5,1); }
.card:nth-child(2) { background: linear-gradient(180deg, #9af0d6 0, #45d0aa 92px, #fff6e4 92px); }
.card:nth-child(3) { background: linear-gradient(180deg, #d4b6ff 0, #a982ea 92px, #fff6e4 92px); }
.card:hover { transform: translateY(-10px) rotate(-1.5deg) scale(1.03); }
.card-icon { width: 124px; height: 124px; border: 5px solid #3a2240; border-radius: 50%;
  background: radial-gradient(circle at 38% 32%, #ffffff, #fff1d2 65%, #ffe2a8); box-shadow: 0 5px 0 #3a2240; }
@keyframes pop { from { transform: scale(.2) rotate(-14deg); } to { transform: scale(1) rotate(-3deg); } }
```

When the red bar drops, its panel shakes for 0.22 s (±3 px, ±1°).

## Motion and animation

- **Main character hops** rather than walks: `phase = anim*0.42`, `f = fract(phase)`,
  `air = sin(f*PI)`, lift `3.4·air` u. Contact factor `max(0, 1 - min(f, 1-f)*6)`:
  `sy = 1 + .07air - .13contact`, `sx = 1 - .04air + .12contact`. Frame 2 in the air, frames 1/3
  alternate on landings, tilt `0.07·facing·air` rad, a dust puff behind on every landing.
- **Idle:** breathing `sy = 1 + .03 sin(3.2t)`, `sx = 1 - .022 sin(3.2t)`. A launch squashes 5%,
  a celebration wobbles ±18%, a flinch squashes 16% with the pained face.
- **Small creature:** 4 frames at `anim*0.85`, rock `±0.1` rad, bob 1.3 u, 5–6% squash on
  contact, per-instance random scale 0.94–1.06.
- **Ghost:** floats 4.5 u up, bob ±1.6 u at `2.6t`, hem frames at 7 fps, 4% wobble at `5.2t`,
  lean up to 0.16 rad into its velocity.
- **Large creature:** `anim*0.32`, lift 2 u, cubic contact squash 8%, rock 0.035 rad.
- **Appearing:** ground creatures stretch out of the dirt hole with `outElastic`; ghosts fade in +
  outBack.
- **Collectibles** bob 1.1 u at `5t` with 4–5% squash; collected gems arc up 10 u with outBack.
- **Props:** trees and bushes sway by skewing around the base (0.025 / 0.035 at `1.3t`).
- **Floating numbers:** scale 0.3 → 1.35 (first 10%) → 1.0, shrink 70% and fade in the last 28%.
- Overshoot easing everywhere: `outBack`, `outElastic`, CSS `cubic-bezier(.3,1.7,.5,1)`.

## Do and don't

**Do**

- Use one outline colour `#3a2240`, drawn as a separate pass so parts merge into one silhouette.
- Give every shape exactly one cel crescent (self-clip offset up-left) and one white gloss at the
  top-left.
- Build from fat rounded primitives: ellipses, capsules, Catmull-Rom blobs, rounded polygons.
- Bake sprites once; only transform them at draw time.
- Squash, stretch and overshoot everything.
- Keep the ground flat, pastel and outline-free with crisp region edges.
- Batch ground shadows into one translucent plum fill.
- Pre-bake white flash copies for flash feedback.

**Don't**

- Don't use black or per-object outline colours or random line weights.
- Don't add gradients or textures to character bodies.
- Don't draw thin, spiky, realistic anatomy or hard 90° corners.
- Don't outline ground regions or decals.
- Don't use blurred or grey shadows; UI shadows are solid plum lips.
- Don't re-path hundreds of figures every frame.
- Don't make the ground as saturated as the characters.

## Implementation recipe

1. Set up a world-unit camera: `scale = canvasHeight / 360`; the main character is ~25 × 37 units.
2. Define the palette as fill/shade pairs plus `OUT = '#3a2240'`, `OL = 1.15`, `IL = 0.55`.
3. Implement the `Painter` (outline / fill / flash modes) and `gloss()` exactly as in the Code
   section, plus shape helpers `E`, `CAP`, `blobPath`, `roundPoly`, `leafPath`.
4. Implement `build(box, fn, mode)` that creates a canvas of `(box size) * K`, scales by `K`,
   runs `fn` with an outline painter and then with a fill (or flash) painter.
5. Write each figure and prop as a part list, back to front: tail/back limbs → body → front
   limbs → head → face details → top decorations. Give every big part `shade`, `sh` and `hi`.
6. Make 4 frames per figure by varying limb endpoints and small offsets (feet, arm angles, leaf
   sway, hem phase); bake normal + flash for each.
7. Generate the ground: noise fields → per-pixel signed distance → coverage + rim blend → flat
   decals. Cache it in chunks.
8. Per frame: ground, one batched shadow path, y-sort figures and props, blit with
   `translate · rotate · scale(sx·facing, sy)` around the feet, then particles and numbers.
9. Add the motion rules (hop, waddle, float, stomp, overshoot pops) and the effects (impact star,
   flash, puff burst, stars, chunks, ring).
10. Build the HUD in HTML/CSS with the panel/bar/card styles above; draw icons with the same
    painter on a 48 px grid and a 2.6 px outline.

## Code

The snippets below are the real techniques from the module, made standalone. The complete
runnable kit is [`starter.js`](./starter.js); the full reference implementation (all creatures,
props, icons, ground and effects) is [`../../js/styles/cartoon.js`](../../js/styles/cartoon.js).

**1. The two-pass part painter (outline merge + cel crescent + gloss)**

```js
const OUT = '#3a2240', OL = 1.15, FLASH_SH = '#efe6f6', TAU = Math.PI * 2;
function Painter(ctx, mode, ol) { this.ctx = ctx; this.mode = mode; this.ol = ol; }
Painter.prototype.part = function (shape, fill, o = {}) {
  const ctx = this.ctx;
  if (this.mode === 'outline') {              // pass 1: everything plum, stroke at 2x weight
    ctx.beginPath(); shape(ctx);
    ctx.lineWidth = (o.ol != null ? o.ol : this.ol) * 2;
    ctx.strokeStyle = OUT; ctx.fillStyle = OUT; ctx.stroke(); ctx.fill();
    return;
  }
  const flash = this.mode === 'flash';
  ctx.save(); ctx.beginPath(); shape(ctx);
  if (o.inner) { ctx.lineWidth = o.inner * 2; ctx.strokeStyle = OUT; ctx.stroke(); } // inner line
  ctx.clip();
  const paint = (shade) => {
    ctx.fillStyle = flash ? (shade ? FLASH_SH : '#fff') : (shade ? o.shade || fill : fill);
    ctx.fillRect(-500, -500, 1000, 1000);
  };
  if (o.sh) {                                  // shade everywhere, lit colour on the shifted shape
    paint(true);
    ctx.save(); ctx.translate(o.sh[0], o.sh[1]); ctx.beginPath(); shape(ctx); ctx.restore();
    ctx.clip(); paint(false);
  } else paint(false);
  ctx.restore();
  if (!flash && o.hi) {                         // gloss: white ellipse at the top-left
    ctx.save(); ctx.beginPath(); shape(ctx); ctx.clip();
    ctx.globalAlpha = 0.92; ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(o.hi[0], o.hi[1], o.hi[2], o.hi[3], o.hi[4] || 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
};
```

**2. Baking a sprite and blitting it with squash & stretch**

```js
let K = 3; // canvas px per world unit
function build(box, fn, mode) {
  const cv = document.createElement('canvas');
  cv.width = Math.ceil((box[2] - box[0]) * K); cv.height = Math.ceil((box[3] - box[1]) * K);
  const ctx = cv.getContext('2d');
  ctx.scale(K, K); ctx.translate(-box[0], -box[1]);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  fn(new Painter(ctx, 'outline', OL));
  fn(new Painter(ctx, mode || 'fill', OL));
  return { c: cv, ox: -box[0] * K, oy: -box[1] * K };
}
function blit(ctx, s, x, y, sx, sy, rot = 0, facing = 1) { // pivot = feet
  ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(sx * facing, sy);
  ctx.drawImage(s.c, -s.ox / K, -s.oy / K, s.c.width / K, s.c.height / K);
  ctx.restore();
}
// example prop: a bush = 4 ellipses as ONE part
const E = (x, y, rx, ry) => (c) => { c.moveTo(x + rx, y); c.ellipse(x, y, rx, ry, 0, 0, TAU); };
const bush = build([-15, -20, 15, 2], (P) => P.part(
  (c) => { E(-6.4, -6, 6.4, 6)(c); E(6, -5.8, 6, 5.6)(c); E(0, -9.6, 7.6, 7.2)(c); E(-0.5, -4.6, 7, 4.8)(c); },
  '#73c257', { shade: '#4e9a40', sh: [-2.1, -2.0], hi: [-4.8, -13, 2.2, 1.1, -0.6] }));
```

**3. Carved glowing face and two-tone body fill**

```js
function carve(c, pathFn, dx = 0.2, dy = 0.7) {   // dark rim + glowing inside shifted down
  c.save();
  c.beginPath(); pathFn(c); c.fillStyle = '#8a3214'; c.fill(); c.clip();
  c.translate(dx, dy); c.beginPath(); pathFn(c); c.fillStyle = '#ffd43f'; c.fill();
  c.restore();
}
// fill function for P.part: cream bottom, purple top, wavy split (root-bulb creature);
// shade=true gives the shade pair
const turnipFill = (col, waveY, amp, freq) => (c, shade) => {
  c.fillStyle = shade ? col.botSh : col.bot; c.fillRect(-500, -500, 1000, 1000);
  c.fillStyle = shade ? col.topSh : col.top;
  c.beginPath(); c.moveTo(-60, -120); c.lineTo(60, -120); c.lineTo(60, waveY);
  for (let x = 60; x >= -60; x -= 0.5) c.lineTo(x, waveY + amp * Math.sin(x * freq + 0.6));
  c.closePath(); c.fill();
};
```

**4. Ground: crisp region edges with an inner rim from a sampled noise field**

```js
// F: field values on a grid every `cpx` pixels (value > 0 = inside). Returns [r,g,b] for one pixel.
function shadePixel(F, nx, px, py, cpx, base, layer /* {f:[r,g,b], r:[r,g,b], rimPx} */) {
  const gx = Math.floor(px / cpx), gy = Math.floor(py / cpx), u = px / cpx - gx, v = py / cpx - gy;
  const A = F[gy * nx + gx], B = F[gy * nx + gx + 1], C = F[(gy + 1) * nx + gx], D = F[(gy + 1) * nx + gx + 1];
  const s = (A + (B - A) * u) * (1 - v) + (C + (D - C) * u) * v;
  const du = (B - A) * (1 - v) + (D - C) * v, dv = (C - A) * (1 - u) + (D - B) * u;
  const g = Math.sqrt(du * du + dv * dv) / cpx;
  const dist = g > 1e-9 ? s / g : (s > 0 ? 99 : -99);          // signed distance in pixels
  const cov = Math.min(1, Math.max(0, dist + 0.5));              // 1-px anti-aliased edge
  const rim = Math.min(1, Math.max(0, layer.rimPx - dist + 0.5)); // darker band just inside
  return base.map((b, i) => {
    const lay = layer.f[i] + (layer.r[i] - layer.f[i]) * rim;
    return b + (lay - b) * cov;
  });
}
```

**5. Batched shadows and sticker floating numbers**

```js
function drawShadows(ctx, items) {                 // one path, one fill -> no darker overlaps
  ctx.beginPath();
  for (const a of items) { ctx.moveTo(a.x + a.rx, a.y); ctx.ellipse(a.x, a.y, a.rx, a.ry, 0, 0, Math.PI * 2); }
  ctx.fillStyle = 'rgba(50,30,72,0.2)'; ctx.fill();
}
// floating number: plum outline + plum drop, white or (highlighted) yellow -> orange gradient face
function damageNumber(ctx, x, y, txt, crit) {
  const fs = crit ? 12.5 : 9;
  ctx.font = fs + 'px "Lilita One", "Fredoka", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#3a2240'; ctx.lineWidth = fs * 0.3;
  ctx.strokeText(txt, x, y + fs * 0.09); ctx.fillStyle = '#3a2240'; ctx.fillText(txt, x, y + fs * 0.09);
  ctx.strokeText(txt, x, y);
  if (crit) { const g = ctx.createLinearGradient(0, y - fs * 0.45, 0, y + fs * 0.4);
    g.addColorStop(0, '#fff27a'); g.addColorStop(0.5, '#ffc93a'); g.addColorStop(1, '#ff8a2a'); ctx.fillStyle = g; }
  else ctx.fillStyle = '#fff';
  ctx.fillText(txt, x, y);
}
```

## Adapting it to your project

- **Keep fixed:** the single plum outline and its weights (1.15 / 0.55 u), the two-pass
  painter, exactly one crescent + one gloss per shape, top-left light, flat pastel ground with
  rim bands, batched plum shadows, overshoot motion, Lilita One + Fredoka, the solid-lip UI.
- **May change:** all fill/shade pairs. For a re-theme (e.g. sci-fi or underwater) pick saturated
  warm colours for the main character, cool or contrasting ones for creatures and a pastel,
  low-contrast ground (sea-foam, pale sand, light slate). Keep each shade ~20% darker than its
  fill and keep the outline dark plum – or switch it globally to another very dark, slightly
  coloured ink (e.g. deep navy `#22264a`), never black.
- **Mixing elements:** the characters and props carry the look on their own (plum outline +
  crescent + gloss), so they sit well on another style's ground as long as that ground is calmer
  and less saturated than they are. When using only this world, keep it outline-free so other
  figures stay in front.
- **Other genres:** side-view platformers – reuse the same sprites, keep the hop squash; puzzle or
  card projects – use the painter for tiles and icons (48 px grid, 2.6 px outline).
- **Other resolutions:** only `K` changes (3–6 px per unit); outlines scale with world units so the
  look is identical on phones and 4K.

## Performance notes

- Everything is baked once at init: 4 frames × (normal + flash) × 2 facings per figure, ~60
  canvases in total; per frame only `drawImage` with transforms. 300+ figures stay well under
  budget.
- Ground: 256-unit chunks generated incrementally; noise is sampled on a 4-unit grid and the
  per-pixel distance work runs only in grid cells that touch an edge (others are flat-filled with
  `Uint32Array.fill`). Decals are baked into the chunk. Cap ground resolution at 3 px/unit.
- Shadows: one path + one fill per frame. Floating numbers: one cached sprite per value (cache
  cleared at 500 entries; re-baked once Lilita One has loaded).
- Hot spots: chunk generation during fast movement and very large particle bursts; keep puffs
  and chunks as baked sprites, never as live paths.

## Copy-paste prompt

```text
Use the Bouncy Cartoon art style for my project (Canvas 2D, procedural, no image assets):
- Bright HD vector cartoon. ONE outline colour for everything: deep plum #3a2240, 1.15 world units
  outer silhouette (inner separation lines 0.55), round caps/joins. Never black.
- Paint every sprite in two passes into an offscreen canvas: pass 1 strokes+fills all parts in plum
  at 2x the outline width (merged silhouette), pass 2 fills each part: shade colour, then the lit
  colour clipped to the same shape shifted ~(-1.5,-1.5) units -> one crisp cel crescent bottom-right,
  then one white gloss ellipse (alpha 0.92) + tiny dot at the top-left. No gradients on bodies.
- Fat rounded shapes only: ellipses, capsule limbs, blobs, rounded polygons. Big heads, tiny bodies,
  googly eyes with plum pupils and white catchlights, thick angry brows.
- Colours come in fill/shade pairs (shade ~20% darker). Main character warm (orange #ff952b + teal
  #2f9c95), creatures cool (purple #9b5cd0 / cream, ghost white #f6f8ff), glow #ffd43f for light.
- Ground: flat pastel play-mat (meadow #9ec671, dark grass #79ae5a, lilac #c8b6da, sand paths #ebd3a0)
  with crisp anti-aliased region edges and a slightly darker inner rim; tiny tufts and 5-petal flowers.
- Props (round trees, bushes, rocks, fences) use the same outline + crescent + gloss painter.
- Shadows: flat plum ellipses rgba(50,30,72,0.2), all batched into one fill.
- Bake 4 frames + a white flash copy per figure; animate only by transforms: hop/waddle squash &
  stretch, tilt, bob, overshoot (outBack/outElastic) pops.
- Effects: white 8-point impact stars, outlined cloud puffs, yellow stars and colour chunks in bursts.
- Numbers in Lilita One with a plum outline + plum drop; UI in cream #fff4de pills with 4px plum
  borders and a solid 5px plum drop shadow; labels in Fredoka 600.
```
