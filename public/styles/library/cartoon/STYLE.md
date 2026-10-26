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

The ground is a **flat-colour play-mat with no outlines**, so it stays visually behind every outlined figure and prop. It is **composed** like a level map: calm open meadow, groves with a darker forest floor, winding sand paths, ponds with a shore and deep centre, lilac flower meadows and autumn clay fields. Detail clusters where features meet.

- **Base** `#9ec671` (meadow).
- **Regions** are 2-octave fbm noise fields with a gentle domain warp (perlin at 1/900, ±90 u), each thresholded so `value > 0` means inside. Bottom → top:

  | Layer | Fill | Rim (inside the edge) | Field |
  | --- | --- | --- | --- |
  | Dark grass (forest floor) | `#79ae5a` | `#6a9e50`, 1.7 u | `fbm(X/520) − 0.6` |
  | Lilac flower meadow | `#c8b6da` | `#b4a0cc`, 2.0 u | `fbm(X/800) − 0.635` |
  | Autumn clay field | `#daa070` | `#c78a60`, 2.3 u | `fbm(X/1150) − 0.615` |
  | Sand clearings + paths | `#ebd3a0` | `#d8ba85`, 2.5 u | clearings `fbm(X/700) − 0.66`; paths of even width `(0.0175 − |perlin(x/1700)|)·3` |
  | Pond shore (damp sand) | `#e0cb96` | `#cdb37a`, 1.6 u | pond field + 0.014 |
  | Pond water | `#80cde2` | foam line `#e2f7f5`, 1.4 u | `fbm(X/560) − 0.675`, pushed away from the start point |
  | Deep water | `#60b2d7` | `#6fbede`, 3.0 u | pond field − 0.03 |

- **Crisp edges with a rim:** fields are sampled on a coarse 4-unit grid. Per pixel, the value `s` and its gradient are bilinearly interpolated, and `dist = s / |grad|` (in pixels) is an analytic signed distance.
  - Coverage `clamp(dist + 0.5, 0, 1)` gives a 1-px anti-aliased edge.
  - A rim factor `clamp(rimPx − dist + 0.5, 0, 1)` blends in the rim colour (a darker band, or the white foam line on water).
  - Grid cells fully inside or outside are flat-filled (fast path).
- **Brightness tint** ±3.5 % from noise at 1/1500.
- **Decals are composed, not sprinkled.** They are flat (no outline, no crescent):
  1. *Furrow rows* across the autumn fields: world-aligned rows 8.5 u apart, gently waving, dark stroke `rgb(196,136,94)` 1.15 u with a light lip `rgb(230,180,132)` 0.55 u.
  2. *Ground around props:* tuft clumps at the feet of trees, stumps, fences and signs; fallen leaves (`#c9773f`, `#e3ad5c`, `#bf5f3e`) under autumn trees; pebbles beside rocks; shore pebbles at reeds.
  3. *Drifts on a coarse 23-unit grid:* grass tuft clumps (one big three-blade tuft + 2–5 smaller ones around it). Their density ramps with a noise field (`smoothstep(0.55, 0.76, noise(x/80))`), so tufts gather in drifts and leave large calm meadow between. Flower posies (5-petal flowers `#fbf6e8 #f8de6c #f4b3c8`, centre `#f2a23a`) sit in the low-noise areas. Lilac meadows get posies of `#f3e9fb #a98bd4 #f6bad3`. Water gets rafts of 1–3 lily pads (`#86c95a`, plum rim, light veins, sometimes a pink flower) and resting white highlight arcs.
  4. *Edge fringes:* single tufts along the dark-grass rim and the path edges; flowers where the meadow meets lilac; pebbles lining sand paths and shores.
- **Ambient water:** slow white rings spread on open pond water (two per cell, 3.2 s cycle), stroked in 4 fade buckets per frame.
- **Dirt holes** (the decal ground creatures emerge from): a dirt ellipse `#b07a4c` with a 0.8 u plum rim and a dark centre `#43283f` grows with outBack, and dirt crumbs (r 1.3 `#9c6a42`, 0.5 u plum rim) fly out. Ghosts instead get a cold swirl, two lilac arcs `rgba(214,204,240)` turning on the ground.
- Chunks are 256 units, rendered at up to 3 px/unit and generated incrementally (a generator with `yield` every few rows).

## Characters

All figures use the shared outline language: one plum outline (1.15 u outer, 0.55 u inner lines), one cel crescent at the lower-right and one white gloss at the upper-left. Heads are big (~60 % of the height), bodies and limbs small and stubby, and every figure type has its own unmistakable silhouette. Every actor has its own phase (from its seed), its own scale (0.94–1.06) and its own blink timing (a ~110 ms blink every 2.7–5 s, some double-blink), so a crowd never moves in lock-step.

**Main character (pumpkin-head kid)**: about 25 u wide and 37 u tall incl. the stem, drawn at scale 1.1, feet at y = 0. A **live rig**: the body is drawn each frame in the same outline language (plum stroke pass, then shade + offset lit fill); head, stem and leaf are baked sprites.
- **Head:** squircle pumpkin (`|cos|^0.85·rx`, `|sin|^0.92·ry`, gaussian dents top and bottom), `rx 11.2`, `ry 9.1`. Fill `#ff952b`, shade `#ea681c`, four rib curves `#ec7a22`, gloss ellipse + dot.
- **Faces:** 5 baked expressions plus a flash copy:
  - carved triangle eyes and grin (hole `#8a3214`, glowing `#ffd43f` fill shifted down for carve depth, hot cores `#fff3b0`, rounded teeth);
  - blink (closed arcs);
  - hurt (`> <` eyes and an O mouth);
  - dash effort (narrowed, slanted eyes and a gritted grin);
  - joy (carved eyes squeezed into happy arches, a wide grin).
- **Stem and leaf** are separate sprites on springs. The leaf flips with the head's vertical speed and settles (stiffness 110, damping 8); the stem follows at half the angle.
- **Body:** teal `#2f9c95` torso ellipse 4.5 × 4.4 with two cream buttons and a gloss. The green scarf `#8ad04c` is a collar of two blobs plus a **spring-driven tail** (two segments, stiffness 75 and 55), with three knitted stripe bands `#c3ec8c` and a fringe. The tail swings out when running and flaps on landings.
- **Limbs:** capsules (arms r 1.15, 3.4 long, cream ball hands r 1.5; legs `#41703f` r 1.35) and shoes `#6b3d2c` (ellipse 2.1 × 1.35 with a gloss).
- **Walk (trot):** `phase = anim·0.21 + seed`, two steps per cycle.
  - Body height per step: contact 0 → down +1 → passing/up −1.6 → contact (`stepBob`, smoothstep segments).
  - Down is squashed (sx +7.5 %, sy −8.5 %), up is stretched.
  - Feet follow a cycle that lifts them on an arc (forward swing with `sin(π·w^0.8)` height, toe tilt).
  - Arms counter-swing ±0.9 rad.
  - The head lags the body by 0.14 of a step and tilts ±0.045.
  - A dust puff on every step.
- **Idle:** breathing at 2.6 s (sy ±3 %), a delayed head bob, and every ~6.5 s a glance over the shoulder (head turns −0.15, back foot steps out).
- **Throw:** the front arm whips forward (outQuad in 30 % of the time) and eases back, with a small body squash.
- **Dash:** anticipation squash (15 % of the time), then a long stretch (sx +22 %) with a 0.32 lean, both legs turning into a running wheel with a white smear arc, speed lines and three white after-images; a landing squash at the end.
- **Turn:** a quick 32 % squash of the width when the facing changes (0.14 s).
- **Hurt:** white flash for ~120 ms, the body leans away (−0.24) and squashes 16 %, the arms fly up and the scarf whips.
- **Celebrate:** crouch → jump 9 u with both arms up → land squash.

**Small creatures (root vegetables)**: scale 0.9, about 19 × 31 u, 3 designed variants. Each is baked as 8 walk frames + 8 blink frames + hurt + removal pose, all with flash copies:
- **Round bulb grump:** a round bulb, cream `#f8eacb` bottom / purple `#9b5cd0` top split by a sine wave, a three-leaf crown, googly eyes (white, plum rim, pupils + catchlights), angry brows and a frown.
- **Radish sneak:** a tall teardrop in `#e0567c` / `#fdf1e6`, one big curly sprout and a small one, a rat-tail root that whips, and sly lidded eyes.
- **Beet brute:** squat and wide in `#6f5bd0` / `#f3ecc2`, two floppy ear-leaves that flap opposite each other, a unibrow and an underbite.
- **Gait:** each variant has its own feet (hip x, stride 1.8–2.4 u, lift 1.4–2.0 u) and its own walk rate. Leaves lag the gait (overlapping action, `0.13·sin(2π(f/8 − 0.18 − 0.07i))`) and bounce in length ±6 %. Pupils glance in the walking direction.
- **Faces by pose:** walk, blink, hurt (squint + O mouth, leaves flung back) and removal (X eyes, tongue out).

**Fast creature (floating ghost)**: about 29 × 32 u, 2 body variants (a classic dome with a 3-scallop hem, or a soft-serve swirl tip leaning back with a 4-scallop hem).
- **Body:** `#f6f8ff` (shade `#c3d0ef`) with an animated hem and a wispy tail curling back, plus stub arms that sway on their own phases. Eyes are plum ovals with blue `#9fd8ff` catchlights over a gaping mouth with a pink tongue `#ff7f9e` and fangs.
- **Fade:** the bottom 9 u fade to 42 % alpha after baking, so it looks like it hovers.
- **Hover:** 4.8 u up on two summed sines (a slow rise and a quicker dip). It stretches with vertical speed and leans into travel (up to 0.18 rad).

**Large creature (root giant)**: about 57 × 71 u (about 2.5× the small creature).
- **Body:** purple `#7b3f99` top over an ochre `#efc96f` bottom, five big leaves, stubby root legs, thick arms, a bandage cross `#f6e6c4` and a bandaged forearm, crack lines.
- **Face:** glowing `#ffd43f` eyes under heavy brows and a wide grimace with two rows of cream teeth.
- **Stomp:** 8 frames at `anim·0.32`. The contact squash reaches 9 %, the rock is 0.04 rad, and the down phase sinks 0.9 u.

**States (all creatures)**
- **Hit (~140 ms):** the baked hurt pose with its white flash copy on top (`min(1, flash·1.7)`). The body squashes (sx +22 %, sy −18 %) and tilts 0.26 rad away from the blow, then an elastic wobble follows (`sin(30t)·e^(−8t)·0.12`, 0.5 s).
- **Removal (deathT 0 → 1, 0.35 s in motion):**
  - Root creatures squash in white (0–0.12). They spring up 6 u with X eyes and a twist (outBack, 0.12–0.42), then inflate and shiver (0.42–0.55).
  - They then **pop into an outlined cel cloud**: 7 discs, plum rim, lilac-grey under white, popping in with outBack, with three sparkles flying out and the cloud shrinking away.
  - Ghosts squash, then stretch upward, twisting and thinning (0.12–0.6), and leave a little soul curl that rises 14 u and thins out.
- **Spawn (spawnT 0 → 1, 0.45 s):**
  - Root creatures peek out of the dirt hole, clipped at ground level, with the leaf tips shivering (0–0.22).
  - They pop out stretched (sy 1.3, 0.22–0.48) and fall back with a 5 u hop, land in a squash (sx +28 %), then settle with a damped wobble.
  - Ghosts swirl up out of the ground: they untwist (0.9 rad), unroll from 20 % height with outBack and fade in.

## Props

Scenery is painted with exactly the same two-pass painter as the characters, so it carries the same plum outline, crescent and gloss. Each prop is baked once (1–5 designed variants, plus mirrored copies) and stands on its own flat plum shadow.

| Prop | Variants | Look |
| --- | --- | --- |
| Round tree | 4 canopies | Tapered bark trunk `#a56f48` / `#7c4e33` with a knot. The canopy is 6 overlapping circles merged as **one** part, with 0.75 u shade arcs and a gloss. Canopy pairs: green `#7fca5c`/`#57a243` (with three red apples `#ef5a52`), orange `#f2a64c`/`#d57c36`, lime `#a9d65a`/`#7fb343`, gold `#efc54e`/`#d09d36` |
| Tiered pine | 1 | Three rounded triangles (corner radius 2.6) in `#4fa564` / `#36804b` over a short trunk |
| Bush | 3 | 4 ellipses as one part in greens `#73c257`/`#4e9a40`, `#8acb5a`/`#61a444`, `#9ad16a`/`#6daa4c`; plain, red berries, or pink 5-petal flowers `#f7b5d0` |
| Rock | 3 | 7-point Catmull-Rom blob `#bdb5cd` / `#918aa9` with a zig-zag crack, ×0.66 / ×1 / ×1.2; the large one wears a mossy cap `#8cc65a` |
| Tree stump | 1 | Bark stump with two root capsules, a pale cut top with rings, a sprout |
| Cattails | 2 | 3–4 leaf blades in two greens (`#7cc35e`, `#5fae55`) with midribs and brown cattail heads |
| Pumpkin | 2 | Squircle pumpkin `#f59a3a` / `#d96f26` with ribs, stem, leaf and a curly tendril; single or a pair |
| Mushrooms | 2 | A pair of cream stalks with red `#ec5b52` or brown `#c98a52` caps with cream dots |
| Fence | 1 | Two rounded rails and three pointed posts, wood `#d4a066` / `#a9743f` |
| Signpost | 1 | Post + arrow board `#e4b77b` with a painted pumpkin |
| Hay stack | 1 | Domed mound `#f3cf62` / `#d6a33c` with straw strokes |

**Placement is composed, not sprinkled** (a 30-unit jittered grid, decisions per region):
- **Groves:** a woodland noise field (`fbm(x/430)`) marks groves.
  - Inside (> 0.615): trees (pines on dark grass), stumps and mushrooms underneath.
  - On the grove rim (0.565–0.615): bushes and the odd tree, so every wood has a soft edge.
- **Open meadow:** nearly empty. Only 1.6 % trees, 1.5 % rocks and 1.5 % bushes, so it reads as calm space.
- **Along sand paths** (within 13 u of a path): rocks, signposts and bushes.
- **Pond shores:** reed beds (55 % of the shore cells) and a few rocks. Open water carries no props; lily pads are ground decals.
- **Autumn fields:** pumpkin patches where a patch noise is high, hay stacks, orange/gold trees, and fences only along the field edges.
- **Lilac meadows:** flowering bushes and lime trees in their own little groves.
- A clear area of 95 units is kept around the starting point.

**Breeze:** trees, bushes and reeds skew around their base with two slow sways per prop (`sin(1.3t + seed)·0.55 + sin(2.9t + 1.7·seed)·0.18`) plus a **gust band** that rolls across the world (`sin(0.0045x + 0.002y − 0.8t)` above 0.6, squared). Amplitude: trees 0.025, bushes 0.035, reeds 0.075. Everything else is static.

## Effects and particles

All particles are baked sprites from the same painter (outlined, crescented):

- **Projectile:** cream seed (`#fff1c8`, shade `#e6c68a`, outline 0.85 u) whose height scales
  `0.55 + 0.45|cos(spin)|` to fake spin, with a white speed streak: three round-cap lines (1.0 u
  centre, 0.75 u sides at ±2 u) with a linear gradient alpha 0.95 → 0 over 14 units behind it.
  Small cream puff when it is launched.
- **Impact (layered):** a white 8-point core star (r 5.6 / 2.6, shade `#fff3b5`, 0.16 s, pop 0.5 → 1.2 → 0.3),
  four comic **action lines** bursting out of the impact (0.15 s), a 4-point spark flying off with gravity 220 (60 %)
  and a small dust scuff behind the creature, opposite the blow.
- **White flash:** the baked hurt pose plus its white flash copy at `min(1, flash·1.7)`, squash `sx·(1 + .22f)`,
  `sy·(1 − .18f)`, tilt 0.26 rad away from the blow, then a 0.5 s elastic wobble.
- **Removal burst (layered, 0.35 s + residue):** core star and 7 action lines at once; the creature squashes, springs
  up with X eyes and inflates (its own sprite); at 55 % it pops into an **outlined cel cloud** (7 discs: plum rim,
  lilac-grey under white, three sparkles flying out). 0.12 s after the removal starts a ring of 6 cloud puffs (9 for the large
  creature, tinted per creature) opens, 2–6 stars and 4–10 colour chunks in the creature's own colours bounce away,
  and a dust ring plus a few slow puffs linger. Ghosts leave a rising soul curl instead of chunks.
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

Smooth vector cartoon: poses are interpolated every frame. Baked creatures step through 8 frames, everything else is continuous. Every pop uses overshoot easing (`outBack`, `outElastic`, CSS `cubic-bezier(.3,1.7,.5,1)`), and nothing moves linearly.

- **Per-actor variation:** phase offset from the seed, scale 0.94–1.06, own blink timing (110 ms every 2.7–5 s, some double-blink), own idle-glance timing.
- **Main character walk (trot):** `phase = anim·0.21`, two steps per cycle.
  - Step body height `stepBob(s)`: contact 0 → down +1 (14 % of the step) → up −1.6 (passing, 62 %) → contact. Down is lowered ×0.75, up raised ×1.35.
  - Squash on the way down (sx +7.5 %, sy −8.5 % per unit), a slight stretch going up.
  - Feet on a lifted arc; arms counter-swing ±0.9 rad, phase-shifted 0.07.
  - The head lags the body by 0.14 of a step and tilts ±0.045. A dust puff on every step.
- **Secondary motion (springs, per frame):** the scarf tail is two chained springs (stiffness 75 / 55, damping 10 / 8) driven by the body's vertical speed. The stem leaf is a spring (110 / 8) driven by the head's vertical speed. Both overshoot on landings and stream back when running.
- **Idle:** breathing at a 2.6 s period (sy +3 %, sx −2.2 %), a delayed head bob, and a glance over the shoulder every ~6.5 s (1.4 s, smoothstepped).
- **Dash:** anticipation squash (first 15 %), stretch + lean 0.32 + leg wheel (10–80 %), landing squash (last 20 %). Three white after-images trail at alpha `0.38/i`.
- **Turn:** 0.14 s width squash (32 %) on every facing change.
- **Small creatures:** 8-frame waddle at `anim·0.85 + seed`, `stepBob` per step (down ×0.6, up ×1.1), squash 8–9 % on contact, rock ±0.08 rad, leaves lagging the gait.
- **Ghosts:** hover on two summed sines (`sin(th) + 0.28·sin(2th + 0.7)`, th = 2.5t), stretch ±3.5 % with vertical speed, lean up to 0.18 rad, hem frames at ~7.6 fps.
- **Large creature:** 8-frame stomp at `anim·0.32`, contact squash 9 %, rock 0.04 rad.
- **Hit:** hurt pose + white flash (~140 ms), 22 % squash + 0.26 rad tilt away from the blow, then a 0.5 s elastic wobble.
- **Removal:** squash → spring up with X eyes (outBack) → inflate and shiver → pop into a cel cloud with sparkles. Ghosts stretch up, twist and thin out into a rising soul curl.
- **Spawn:** peek out of the dirt hole (clipped, leaves shivering) → pop out stretched → hop → squash landing → damped wobble. Ghosts swirl up, untwisting, with outBack.
- **Collectibles** bob 1.1 u at `5t` with 4–5 % squash; collected gems arc up 10 u with outBack.
- **Ambient:** prop breeze with a rolling gust band; pond rings spreading every 3.2 s; butterflies drifting on two-partial paths over the meadow. All slower than the actors.
- **Floating numbers:** scale 0.3 → 1.35 (first 10 %) → 1.0, then shrink 70 % and fade in the last 28 %.

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
6. Bake 8 walk frames + 8 blink frames + a hurt pose + a removal pose per creature (each with a
   flash copy) from a foot cycle and a step-bob curve; leaves and arms lag the gait. Give every
   actor a seed for phase, scale and blink timing.
7. Rig the main character live: limbs, torso, collar and a two-segment spring scarf in the same
   outline language, a baked head with 5 expressions, a spring leaf; drive it with the trot,
   idle-glance, throw, dash, turn, hurt and celebrate rules from the Motion section.
8. Generate the ground: noise fields → per-pixel signed distance → coverage + rim blend → composed
   decals (furrow rows, ground around props, noise-ramped tuft drifts, posies, lily pads, edge
   fringes). Place props by feature: groves with soft rims, path furniture, reed beds, pumpkin
   patches. Cache it in chunks.
9. Per frame: ground, one batched shadow path, y-sort figures and props, blit with
   `translate · rotate · scale(sx·facing, sy)` around the feet, then particles and numbers.
10. Add the designed states (hit flash + tilt + wobble, removal squash → spring → cloud pop, spawn
    peek → pop → land) and the layered effects (core star, action lines, delayed puff ring, stars,
    chunks, dust ring).
11. Build the HUD in HTML/CSS with the panel/bar/card styles above; draw icons with the same
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

**2. Baking a sprite, squash & stretch, the trot and spring follow-through**

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

// the trot: body height per step (contact 0 -> down +1 -> passing/up -1.6 -> contact; + = lower)
const sstep = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
function stepBob(s) {
  s -= Math.floor(s);
  if (s < 0.14) return sstep(s / 0.14);
  if (s < 0.62) return 1 - 2.6 * sstep((s - 0.14) / 0.48);
  return -1.6 + 1.6 * sstep((s - 0.62) / 0.38);
}
// follow-through: a damped spring driven by the body's vertical speed (scarf tail, leaf, ears)
function spring(st, target, drive, dt, k = 75, damp = 10) {
  st.v += ((target - st.a) * k - st.v * damp + drive) * dt;
  st.a += st.v * dt;
  return st.a;
}
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

- Creatures are baked once at init: 8 walk + 8 blink + hurt + removal poses, each with a flash copy
  (20 canvases per variant, mirrored at draw time); props, effects and the main character's head
  sprites too. Per frame creatures cost one or two `drawImage` calls each.
- The main character is the one live rig (~45 path operations per frame, ~0.25 ms in software
  rendering). Only one is ever on screen; do not rig crowds this way.
- Props carry a tight cull pad (their own half-width + 8 units), so off-screen trees and bushes are
  neither drawn nor shadowed. Pond rings cache the visible water cells per 40-unit camera cell and
  stroke in 4 fade buckets.
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
- Ground: flat pastel play-mat (meadow #9ec671, dark grass #79ae5a, lilac #c8b6da, sand paths #ebd3a0,
  ponds #80cde2 with a white foam rim and a deep #60b2d7 centre) with crisp anti-aliased region edges;
  decals in drifts and clusters (tuft clumps, posies, lily pads, furrows), calm open meadow between.
- Props (round trees, pines, bushes, rocks, stumps, reeds, fences) use the same painter and are
  placed by feature: groves with bushy rims, rocks and signs by paths, reeds on pond shores.
- Shadows: flat plum ellipses rgba(50,30,72,0.2), all batched into one fill.
- Bake 8 walk + 8 blink frames + hurt + removal poses (with flash copies) per creature; per-actor
  phase, scale and blink. Main character: a live rig with a trot (contact-down-passing-up), arms
  counter-swinging, head lag, spring scarf and leaf, dash anticipation + stretch + landing.
- Hit: hurt pose + white flash + tilt away + elastic wobble. Removal: squash, spring up with X eyes,
  pop into an outlined cel cloud. Spawn: peek out of a dirt hole, pop out stretched, land squashed.
- Effects: white 8-point impact stars, outlined cloud puffs, yellow stars and colour chunks in bursts.
- Numbers in Lilita One with a plum outline + plum drop; UI in cream #fff4de pills with 4px plum
  borders and a solid 5px plum drop shadow; labels in Fredoka 600.
```
