# Crayon Kids — Game Art Style Spec

> A child's wax-crayon drawing brought to life: toothy paper, layered scribble fills that miss the lines, shade crayons, boiling outlines.

Everything looks as if a six-year-old drew it with a box of wax crayons on bright white drawing paper. Every coloured shape is **built up in wax layers**: a light wash, a zigzag scribble that is **printed a little off its own outline** (colouring that misses the lines), a **cooler partner crayon hatched along the lower contour** as the shade, a light-crayon gloss on top, and a tapered black outline that **overshoots its own start**. The wax **skips on the paper tooth**, so tiny white specks show through every stroke. Every drawing exists in **three redrawn versions** that boil at 8 fps — each figure on its own phase — while poses are **held on twos**. The world is **composed like a picture on the fridge**: grassy hills with a zigzag grass fringe, ponds with reeds, villages and striped crop fields along dirt roads, long blue streams crossed on plank bridges, a smiling sun in the corner — and big calm areas of white paper.

## At a glance

| | |
| --- | --- |
| Family | Hand-drawn · Wax crayon |
| Mood | cheerful, innocent, playful, handmade, sunny |
| Best for | children's and family games, cozy or comedic top-down action, educational / storybook projects, doodle-themed menus, party and casual mobile games |
| Renderer | Canvas 2D, procedural: wax layers (wash → misregistered scribble → shade crayon → gloss → outline) → paper tooth erased (destination-out) → white margin → baked sprites and cached ground chunks |
| Pixel art | No — native resolution, sprites baked at 2.5–5 px per world unit |
| Complexity | 5/10 — naive shapes forgive imprecision; the work is pose tables, three boil variants per drawing and composing the ground |
| Fonts | Gochi Hand, Patrick Hand, Caveat Brush, Schoolbell (Google Fonts) |
| Key colours | paper `#fbf8ef`, black crayon `#2b2a30`, red `#e2362c`, yellow `#fdce28`, grass `#42ae3a`, sky `#42a8ea`, purple `#8c4cc4`, shade crayons pine `#166856`, crimson `#b01c4a`, indigo `#3a3096`, sepia `#68382c` |

## When to use it

- **Good fit:** children's and family games — the look is instantly friendly and reads as "made by a kid".
- **Good fit:** cozy or comedic top-down projects with many small units — black outlines plus a white margin keep figures readable over scribbled grass, and per-figure boil phases keep crowds lively without flicker.
- **Good fit:** educational, storybook and tutorial screens; map screens that look like a drawing taped to a table.
- **Good fit:** anything that should feel handmade without hand-drawn assets — every asset is a few polygons through one `shape()` helper.
- **Bad fit:** horror, grit, realism, dark or neon moods — the light is always sunny daylight.
- **Bad fit:** precise tactical readouts and dense data UIs — the wobble and boil fight precision.
- **Bad fit:** pixel-perfect retro projects — the style relies on soft anti-aliased wax strokes.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Drawing Paper | `#fbf8ef` | Ground and the white margin around every drawing (~45 % of the screen) |
| Black Crayon | `#2b2a30` | Outlines, stick limbs, eyes, crossing-out scribble, HUD ink |
| Crayon Red | `#e2362c` | Cape, shoes, roofs, apples, the scribble-ball projectile, bar fill, tulips |
| Orange | `#f78b1f` | Sun rays, back spikes, wheat rows and outline, shade crayon of yellow |
| Sunny Yellow | `#fdce28` | Sun, stars, belly, house walls, wheat fields, horns |
| Grass Green | `#42ae3a` | Hills, tree crowns, the large creature body, tulip-field rows |
| Dark Green | `#217a38` | Grass fringe and tufts, pines, outlines of green scenery, sprouts |
| Light Green | `#9ece3a` | Second hill crayon, sunlit crowns, tulip-field base |
| Sky Blue | `#42a8ea` | Pond and stream strokes, windows, small collectible, clouds, ruler fill |
| Blue | `#2a5ec8` | Shirt, deep water, pond and stream banks, clock digits |
| Purple | `#8c4cc4` | Small scribble creature, back plates of the large creature, counter digits |
| Pink | `#f67eb4` | Rosy cheeks, hearts, blossoms, tulips, lily flowers |
| Brown | `#94582c` | Hair, trunks, doors, road edges and ruts, bridge rails, scarecrow pole |
| Tan | `#d8a262` | Road fill, bridge deck, ploughed fields, fence pickets, scarecrow head |
| Peach | `#fcc698` | Skin of the main character |
| Grey | `#929098` | Rocks, pebbles, stepping stones, chimney smoke |
| Ghost Blue | `#a8d6f6` | Fast creature (sheet ghost), water wash, cloud scribble |
| Pine | `#166856` | Shade crayon of all greens: lower hill band, crown shade, hill lower edge |
| Crimson | `#b01c4a` | Shade crayon of red: cape folds, roof shade, shoes, bar shade |
| Indigo | `#3a3096` | Shade crayon of blue and purple: shirt, deep water, stream east bank, bridge shadow |
| Sepia | `#68382c` | Shade crayon of brown and tan: trunks, plank seams, furrows, dirt ticks |
| Slate | `#606284` | Contact shadows, the construction sketch of the drawn-in entrance, rock shade, motion lines |

Two more shade crayons are used without a table row: salmon `#ee8070` (shades skin) and magenta `#ce3e94` (shades pink). Dark purple `#5c2c8c` draws the tangle lines inside the small creature.

**Palette rules**

- Only straight-from-the-box crayon colours: fully saturated, no pastels except ghost blue and the paper.
- **Shade with the partner crayon, never with black or a darker copy.** Pairs: green → pine, light green → green, red → crimson, orange → red, yellow → orange, blue / purple → indigo, sky / ghost blue → blue, pink → magenta, peach → salmon, brown → sepia, tan → brown, grey → slate. Light partners for gloss: green → light green, light green → yellow, blue → sky, yellow / sky / pink / peach → white, purple → pink, brown → tan.
- Roughly 40–50 % of the screen stays uncoloured paper. Colour sits in composed regions (hills, fields, water, roads), not sprinkled.
- Black outlines on characters, buildings and scarecrows; plants, water, roads and fields are outlined in a darker crayon of their own colour.
- Every sprite has a 0.9-unit paper-white margin, like a child colouring the background up to a figure.
- No gradients, no glow — intensity comes from scribble density, layer count and the paper tooth.

## Typography

| Font | Use | CSS |
| --- | --- | --- |
| **Gochi Hand** 400 | Counters, card titles, bar labels, caption names, floating numbers | `font: 400 40px/1 'Gochi Hand', cursive; color: #2a5ec8;` |
| **Patrick Hand** 400 | Body copy, card descriptions, hints | `font: 400 19px/1.25 'Patrick Hand', cursive; color: #57545e;` |
| **Caveat Brush** 400 | Big panel titles in rainbow crayon | `font: 400 88px/1 'Caveat Brush', cursive;` + 6-stop hard rainbow `background-clip: text` |
| **Schoolbell** 400 | Small family / category labels | `font: 400 14px/1.2 'Schoolbell', cursive; color: #217a38;` |

- Everything is handwriting. No uppercase tracking, no bold weights — a child presses harder, they don't switch fonts.
- Large text (titles, the clock digits, bar fills) is masked with a noise SVG (`feTurbulence` fractal noise, alpha = 7.2 − 11·R) so it looks waxy and speckled.
- Floating numbers: Gochi Hand at 10 units (14 for emphasis), black crayon (red for emphasis, with an orange zigzag underline), a paper-coloured halo, tooth at 0.55, tilted ±10°, popping from 0.6× to 1.1× then 1×.
- Titles are rotated −2° to −2.5°; cards ±0.8–2°. Nothing is perfectly level.

## Rendering technique

**Baked at init** (sprite scale `K = clamp(round(screenH / 360 × 1.5 × 4) / 4, 2.5, 5)` px per unit, 3.75 at 900 px):

1. **Paper tooth** — a 160 px tileable alpha map: three periodic Perlin octaves (stretched 1.6 : 1 sideways) plus per-pixel noise, thresholded so ~25 % of the wax is erased in clustered specks.
2. **Paper** — a 256 px tile of `#fbf8ef` with faint mottling (±3 levels), grain, rare dark specks and 26 short fibres at alpha 0.13.
3. **Every drawing** through `mk()`: draw polygons with the wax helpers into an offscreen canvas → erase the tooth (destination-out, alpha 1 for sprites, 0.5 for the construction sketch, 0.75 for icons) → dilate a paper-white margin (12 offset copies of a paper-coloured silhouette at 0.9 units) behind it → also bake a paper-white flash copy (creatures) or a red tint copy (main character).
4. **Variant 0** of every drawing eagerly; variants 1–2 lazily (one per ground-chunk generator step and in a 1.5 ms per-frame budget) — until baked, variant 0 stands in.

**The wax layers of one shape** (`shape()`):

| Layer | What | Typical numbers |
| --- | --- | --- |
| Wash | flat fill of the colour | alpha 0.4 |
| Scribble | zigzag sweeps across the shape, ends overshoot or stop short | spacing 0.95, width ≈ spacing × 1.05, alpha 0.85, overshoot 0.6, angle −0.55 rad |
| Misregistration | wash + scribble printed off the outline | 0.35 units in a direction that rotates by the golden angle for every baked sprite |
| Shade crayon | partner colour zigzag-hatched in a crescent along the lower contour | 34 % of the shape height, thinning to the sides, alpha 0.6 |
| Gloss (optional) | one light-partner stroke along the top contour, slightly inside | width 0.4 + 3.5 % of the shape width, alpha 0.75 |
| Outline | wobbly tapered wax loop that overshoots 7–20 % | 0.9 units, two passes |

**Per frame:** ground chunks are blitted; then the ground overlay (pond and stream ripples, colour smudges), shadows, y-sorted props and figures (all `drawImage`, props sheared for wind), orbiting crayons, projectiles, particles, numbers, and the screen overlay (sun, clouds, tape, edge darkening). Nothing is blurred or re-rasterised per frame.

## World and ground

Bottom to top inside each 256-unit chunk (built by a generator that yields after every element):

1. **Hills** — one per 430-unit cell at 84 %: a main lobe (radius 66–114) plus 1–3 overlapping lobes (45–72 % of it), shapes from 3rd + 5th harmonics. Never closer to a stream than half their width + 26 units.
   - green (65 %) or light green wash at 0.1;
   - scribble in **30-unit cells**, each cell its own random stream and ±0.4 rad angle around one hand direction per hill (−0.95…−0.3 rad), spacing 2.5, width 2.7, overshoot 3.2;
   - a second crayon (light green or yellow) over the upper 55 % of each lobe;
   - **shade band**: an up-and-down pine zigzag 13–22 units tall along the lowest contour of the whole hill, thickest in the middle;
   - **grass fringe**: where the outline faces up, a dark-green "WWW" with teeth 2.2–4 units tall; where it faces down, a firm pine line;
   - tufts in 2–4 clusters near the upper rim (never evenly spread) and sometimes one tight flower bed of 8–14 mini flowers in two colours.
2. **Crop fields** — one per 380-unit road stretch at 64 %, 118–176 × 58–86 units, 13–22 units off the road (60 % below, 40 % above), never touching hills, ponds, houses or streams. The edge along the road follows its curve; the far edge is freehand. Three kinds:
   - **wheat** — yellow base scribble, orange rows every 6.4 units, small V ears (orange, every fourth brown), a third of them skipped;
   - **ploughed earth** — tan base, sepia furrows every 6 units with a lighter ridge above, green sprouts every ~5 units;
   - **tulip rows** — light-green base, green rows every 8.6 units, cup-shaped tulips with a darker rim, one colour per row (red, pink, yellow, purple).
   Each gets a shade band in its dark crayon along the lower edge and an outline in that crayon.
3. **Streams** — one every 2300 units, meandering ±220, half width 9: a white margin is erased, ghost-blue wash at 0.42, lengthwise sky-blue strokes in 36-unit segments (blue in the middle third), indigo shade along the east bank, a white glint near the west bank, grass tuft clusters and stone groups on the banks, wobbly 1.35-unit blue banks.
4. **Ponds** — on 45 % of hills, radius 30–50 at the hill edge: white margin erased into the grass, pale wash, sky scribble cells, deeper blue in the lower middle, indigo shade band, white glint, 1.5-unit blue outline, grey stones on the lower bank, a lily-pad cluster with a pink flower, sometimes an orange fish.
5. **Roads** — long wavy horizontal roads every 760 units and side roads every 1100 units that only link some pairs (55 %, never within 110 units of a stream), 21 units wide: band erased, tan wax 0.24, lengthwise tan strokes 2.6–3.4 wide, brown ruts along the lower edge, sepia dirt ticks, wobbly 1.3-unit brown edges, pebble groups; grass tufts lean in where a road crosses a hill.
6. **Plank bridges** where a road meets a stream: indigo shadow scribbled on the water under the deck, an opaque tan deck 7 units wider than the stream on each side, sepia plank seams across every 2.5–3.1 units, two 1.7-unit brown rails with five sepia posts.
7. **Stepping stones** from each front door to the road; **doodles** (stars, hearts, spirals, a butterfly) in rare clusters on a 330-unit grid (32 %) — only in open paper.
8. **Paper tooth** over the whole chunk (world-aligned, alpha 0.92), then the paper underneath (destination-over).

Everything is seeded by world cell or segment index, so chunks join seamlessly; hill, field, side-road and stream decisions are cached per cell.

## Characters

**Main character** — a kid in a red cape holding a big orange crayon, ~30 units tall, ~18 wide (22 with the cape tip). Round peach head of 14 units (almost half the height) with a salmon shade band, spiky brown hair with a springy curl on top, black oval eyes with white dots, a thin smile, pink cheeks; blue shirt with an indigo shade and a yellow star; stick limbs (1.1–1.25 units) with peach hands; red shoes outlined in crimson; the cape is red with crimson folds. Drawn facing right, mirrored for left.

**Small creature** — a purple scribble monster (~20 × 22): a lumpy purple body with an indigo shade, dark-purple tangle lines inside, two yellow horns, big white googly eyes with lagging pupils, a toothy dark mouth, stick arms raised, stick legs.

**Fast creature** — a pale-blue sheet ghost (~22 × 22): a dome head running into a long zigzag tail, blue shade along the bottom, mitten arms, black oval eyes and a little round mouth; it floats 2.4 units up and bobs on its own phase.

**Large creature** — a big green scribble dragon (~60 × 48, drawn 2.3× its creature radius): green body with a pine shade, a yellow belly patch, purple back plates, orange spikes along the back and tail, stumpy legs, white teeth, a smoke curl from the nose.

**Rules**

- Every part goes through the wax layers; black outlines 0.9–1.25 units; faces sit toward the facing side.
- **Pose tables, not tweening.** Each drawing is computed from a handful of numbers (body bob, lean, foot x and lift, hand positions, hair-curl angle, cape hem) and baked.
- **Three boil variants** per drawing with different seeds. Each figure reads `floor(t × 8 + phase × 5.3) mod 3` with its own phase.
- **Hit (~110 ms):** two held drawings — squash 1.2 × 0.84, leaning up to 0.22 rad away from the blow, paper-white flash at 88 % — then half of that.
- **Removal (0.35 s):** struck (squash + flash, 0–6 %) → scribbled out in black zigzag levels at 6 / 20 / 32 / 44 % while shivering ±0.7 units → from 55 % it melts flat (x → 1.35, y → 0.12) and fades while the scribble knot drops to the feet → a colour smudge stays on the paper for 2.6 s.
- **Entrance (0.45 s):** the slate construction sketch is drawn left to right with a crayon tip running ahead (0–30 %) → colour fills in from the top with the crayon zigzagging along the fill edge (30–88 %) → the finished drawing pops (stretch 0.92 × 1.12).
- **Hurt main character:** the hurt drawing (knocked back, arms flung up, eyes squeezed shut) with a red tint for 0.12 s, then a 12 Hz blink.

## Props

| Prop | Variants | Size (units) |
| --- | --- | --- |
| Tree | round apple tree with red apples; tall light-green poplar with orange sun dapples; wide blossom tree with pink five-dot flowers | 32 × 48, 20 × 55, 36 × 44 |
| Pine | three dark-green tiers; two tiers with brown cones | 26 × 40, 26 × 31 |
| House | yellow classic with chimney and round attic window; tall pink two-storey; wide sky-blue cottage with a flower box | 35–51 × 34–56 (roof included) |
| Flowers | red / yellow / pink bunch; purple / orange / sky bunch; sunflower | 16 × 14, 14 × 30 |
| Bush | green with red berries; light green with purple berries | 24 × 16 |
| Rock | small grey; large grey with a pebble | 11 × 8, 15 × 10 |
| Fence | five tan pickets, two brown rails | 40 × 16 |
| Reeds | cattails with brown velvet heads; tall grass clump | 12 × 18 |
| Scarecrow | straw hat + red shirt with a yellow patch; floppy brown hat + blue shirt with a crow on the arm | 28 × 46 |
| Rainbow | six bands on two clouds (very rare, open paper) | 45 × 24 |

- Same pipeline as characters; black outlines on houses and scarecrows, own-colour outlines on plants and rocks.
- Light from above: shade under roof eaves (the wall's partner crayon) and on the trunk top under the crown, a gloss on pines and rocks, warm yellow shade inside windows.
- Every prop stands on green tick tufts and a light slate scribble shadow.
- **Composition:** houses sit above the roads in villages (42 % of road stretches are village stretches) with a fence, a flower bunch and sometimes a tree behind; orchards (3–5 trees) fill hill centres, pine groves line the upper rim, bushes sit on hill edges; reeds and rocks gather on pond and stream banks; scarecrows stand in wheat and ploughed fields, fences run along the field's far edge, a bush or flowers sit at a field corner; open paper only gets roadside stones, rare flowers and the very rare rainbow.

## Effects and particles

Every effect is made of crayon things — scribbles, crumbs, shavings, stars — and is layered: core → main shape → debris → residue, each with its own life.

- **Projectile:** a tight red scribble ball (r 3.7, crimson outline) tumbling in held 45° steps, a motion-line trail that grows in over 0.12 s, an occasional slate puff where it leaves.
- **Collectibles:** small — a sky-blue diamond with a blue shade band and a white dot; large — a yellow star with an orange shade and a tiny smiling face, rocking. Both bob on twos and twinkle for two drawings every ~1.7 s.
- **Orbiting objects:** wax crayons (body, lighter paper wrapper with a black zigzag, pointed tip) flying tangentially, wobbling ±0.35 rad on twos, two slate motion lines behind.
- **Impact:** black impact dashes (0.13 s, two drawings) → a coloured zigzag bolt (0.3 s) → three crumbs in the creature's colours hopping with gravity.
- **Burst:** a spiky yellow pow star (9 spikes) popping 0.6 → 1.22 → 1.05 in two drawings, impact dashes → stars and swirls flying out (staggered 20 ms) → shavings and crumbs falling with gravity → a colour smudge on the paper for 2.6 s. The large creature adds four red bolts around it.
- **Collect:** a four-point twinkle (0.22 s) → three to five shavings flicked outward in yellow and sky blue (0.26 s) → a star or heart floats up and fades.
- **Glow-up:** sun rays and a rainbow loop turning around the main character in held steps, growing; five stars and hearts circle outward; fades over 0.67 s.
- **Dash:** speed lines, a 25 % after-image, two dash drawings at 12 fps with a slight stretch, three slate-outlined puffs on the ground.
- **Hurt:** impact dashes over the head, three red bolts fanning up, six crumbs.

## Atmosphere and lighting

- **One light from above:** shade crayons on every lower contour, gloss on top, shade under eaves and crowns, indigo on every stream's east bank, a shadow under each bridge deck.
- **Contact shadows:** light slate scribbles (wash 0.07 + scribble 0.28) in flat ellipses; the ghost's shadow shrinks as it rises, a removed creature's shadow fades.
- **Sun:** radius 23 units, 12 rays alternating yellow and orange, an orange shade band and white gloss, blinking black eyes, a big smile, pink cheeks; 34 units in from the top-right corner.
- **Clouds:** two scalloped white shapes (~64 × 24) with pale-blue scribble, sky shade band and outline, drifting along the top 40 units.
- **Tape and edge:** beige masking tape `rgba(238,226,186,.82)` with torn zigzag ends in two corners; edge darkening `rgba(150,120,70,0.13)` over 7 % of the screen height on each side.
- **Ambient water:** up to four white ripple marks per pond and one per ~41 units of stream fade in and out on their own beats; stream marks drift 26 units downstream per cycle.

## UI

Stationery taped onto the drawing:

- **Panels** are white paper scraps `#fffdf6` with a soft drop shadow, rotated 1–1.5°, with a strip of masking tape (beige, torn zigzag ends via `clip-path`) on top.
- **The long bar** is a wooden ruler (yellow gradient, brown border, tick marks every 12 px, long ticks every 60) with a sky-blue diagonal-stripe crayon stroke as its fill, an indigo shade on its lower half and a zigzag right end.
- **The short bar** is white with a thick black crayon border (irregular `border-radius`) and a red diagonal-stripe scribble fill with a white gloss on top, a crimson shade below and a zigzag end, masked waxy; it wiggles in three steps when the main character is hurt.
- **The title** sits on a yellow sticky note with tape; digits in blue Gochi Hand with an indigo offset, the label in red Patrick Hand.
- **The counter** is a paper scrap with tape at a corner; the number in purple with a zigzag underline.
- **Cards** are white sheets with a 3 px crayon border (red, blue, green), a faint second border and a tinted foot, tape at the top, rotations −2°, 1.4°, −0.8°; hover straightens and lifts them with a springy curve. Numbers sit in hand-drawn circles.
- **Panel title** in Caveat Brush 88 px in hard rainbow stripes with an orange zigzag underline over a pale paper wash.
- **Icons** are crayon drawings in a 100-unit box using the same wax layers and shade crayons, tooth at 0.75.

## Motion and animation

- **Two clocks.** Poses advance on twos (12 fps, held drawings); the boil swaps three variants at 8 fps with a per-figure phase. The ground never boils; props boil at 70 % speed.
- **Main character walk — 8 drawings:** contact – down – passing – up for each side; dip 1.35 units at contact, foot lift 2.5 on the passing pose, arms counter-swinging ±3.4 units, the head trailing the body by 0.75 rad of the cycle, the hair curl swinging ±0.5 rad two beats late, the cape hem a quarter cycle late.
- **Idle — 4 drawings** (neutral, breathe in, crayon lifted, blink) played in a 12-step held sequence at 3.3 steps/s, so the blink and the fidget come on irregular beats.
- **Dash — 2 drawings** alternating at 12 fps, leaning in, back leg pushing off, cape streaming flat.
- **Small creature:** 6-drawing waddle, squash 1.07 × 0.92 on contact and stretch on the passing pose, arms and pupils lag. **Ghost:** 6 drawings at 9 fps, a wave travels down the zigzag tail. **Dragon:** 6 heavy drawings, body dips 2.4 units per stomp, head, wing and tail follow late.
- **States:** hit ~110 ms, removal 0.35 s, entrance 0.45 s (see Characters).
- **Particles:** pop in fast, fade over the last 30–40 %; rotations held in 0.4 rad steps; crumbs bounce with gravity.
- **Ambient:** props shear in a gust that travels across the picture (phase follows x), held on twos; water ripples fade in and out; clouds drift — all slower than the figures.

## Do and don't

**Do**

- Colour every shape in layers: wash, misregistered scribble, partner shade crayon, gloss, overshooting outline.
- Shade with the cooler partner crayon; keep one light from above.
- Keep black wobbly outlines on everything that moves and on buildings.
- Compose the ground: ponds at hill edges, reeds on banks, villages above roads, fields beside them, bridges at stream crossings — and leave big calm paper.
- Bake three variants per drawing, give every figure its own boil phase, hold poses on twos.
- Design entrance and removal in the medium: drawn in, scribbled out.
- Erase a paper tooth out of every crayon mark.

**Don't**

- No smooth vector fills, gradients, glows or airbrush shading.
- No ruler-straight or perfectly closed lines (except the UI ruler).
- Don't fill big areas with one long hatch — colour them in short patches with varied angles.
- Don't shade with black, grey or a darker copy of the same colour.
- Don't sprinkle tiny doodles evenly; cluster detail where something is.
- Don't let a crowd boil in sync or move smoothly at 60 fps.
- Don't drop outlines on characters — they vanish into the scribbles.

## Implementation recipe

1. Build the tooth alpha map and the paper tile once.
2. Write `wax()` (wobble + tapered pressure runs + overshooting closed loops), `scribble()` (zigzag with over/undershoot, optionally in cells), `shadeBand()` (partner crayon along the lower contour) and `shape()` (wash → misregistered scribble → shade → gloss → outline).
3. Write `mk(bounds, draw)`: draw → erase tooth → dilate a paper-white margin → optional flash / tint copy. Rotate the misregistration direction per call.
4. Describe each figure as a pose table; bake 8 walk / 4 idle / 2 dash / 1 hurt drawings for the main character and 6 per creature, each in three boil variants (variant 0 eagerly, the rest lazily), plus a sketch-only bake for the entrance.
5. Ground generator per chunk: hills → fields → streams → ponds → roads → bridges → stones → doodles → tooth → paper underneath. Cache cell decisions; seed everything by world cell or segment.
6. Props by composition rules (villages, orchards, groves, banks, fields), each with a few designed variants and a wind shear on twos.
7. Per frame: pick drawing by state and twos, boil index by per-figure phase, then blit. Hit / removal / entrance are sequences of held drawings, never smooth fades alone.
8. Effects from crayon bits, layered with separate lifetimes; a colour smudge as residue.

## Code

```js
// Wax line: hand wobble along the normal + pressure runs that taper at both ends + overshooting closed loops
function wax(ctx, pts, { R, w = 1, c = '#2b2a30', closed = false, wob = 0.2 }) {
  let src = pts;
  if (closed) { const n = pts.length, i0 = (R() * n) | 0, ov = Math.max(2, Math.round(n * (0.07 + R() * 0.13)));
    src = []; for (let i = 0; i <= n + ov; i++) src.push(pts[(i0 + i) % n]); }
  const P = resample(src, 0.7), f1 = 0.16 + R() * 0.14, ph = R() * Math.PI * 2;
  let s = 0;
  const Q = P.map((p, i) => {
    if (i) s += Math.hypot(p[0] - P[i - 1][0], p[1] - P[i - 1][1]);
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const off = wob * Math.sin(s * f1 + ph) + (R() - 0.5) * wob * 0.3;
    return [p[0] + ((a[1] - b[1]) / l) * off, p[1] + ((b[0] - a[0]) / l) * off];
  });
  for (let i = 0; i < Q.length - 1;) {
    const e = Math.min(Q.length - 1, i + 4 + ((R() * 6) | 0)), u = (i + e) / 2 / (Q.length - 1);
    ctx.beginPath(); ctx.moveTo(...Q[i]); for (let k = i + 1; k <= e; k++) ctx.lineTo(...Q[k]);
    ctx.lineWidth = w * (0.55 + 0.45 * Math.min(1, Math.sin(Math.PI * u) * 2.2)) * (0.86 + R() * 0.22);
    ctx.strokeStyle = c; ctx.globalAlpha = 0.8 + R() * 0.2; ctx.stroke(); ctx.globalAlpha = 1;
    i = e;
  }
}
```

```js
// Shade crayon: the cooler partner hatched up and down along the LOWER contour, thickest in the middle
const PARTNER = { '#42ae3a': '#166856', '#e2362c': '#b01c4a', '#2a5ec8': '#3a3096', '#8c4cc4': '#3a3096',
  '#94582c': '#68382c', '#fcc698': '#ee8070', '#f67eb4': '#ce3e94', '#fdce28': '#f78b1f', '#929098': '#606284' };
function shadeBand(ctx, pts, { R, c, h = 0.34, sp = 0.8 }) {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), H = Math.max(...ys) - Math.min(...ys), cx = (x0 + x1) / 2, hw = (x1 - x0) / 2;
  const zig = []; let side = 0;
  for (let x = x0 + sp * 0.3; x < x1; x += sp * (0.8 + R() * 0.4)) {
    const iv = verticalSpan(pts, x); if (!iv) continue;            // [top, bottom] of the polygon at column x
    const q = (x - cx) / hw, th = Math.min(iv[1] - iv[0], H * h * (0.5 + 0.5 * (1 - q * q)));
    zig.push(side ? [x, iv[1] + (R() - 0.3) * 0.6] : [x + sp * 0.5, iv[1] - th]); side ^= 1;
  }
  strokeZigzag(ctx, zig, c, 0.6, sp * 1.05);                        // quadratic curves through the turn points
}
// The coloured-in shape: wash + scribble printed off the outline + shade crayon + outline
function shape(ctx, pts, fill, line, R, mis /* [dx, dy], new per baked sprite */) {
  const fp = pts.map((p) => [p[0] + mis[0] * 0.35, p[1] + mis[1] * 0.35]);
  fillPoly(ctx, fp, fill, 0.4);
  scribble(ctx, fp, { R, c: fill, sp: 0.95, over: 0.6 });           // sweep ends overshoot or stop short
  shadeBand(ctx, fp, { R, c: PARTNER[fill] });
  if (line) wax(ctx, pts, { R, closed: true, w: 0.9, c: line });
}
```

```js
// Bake: draw → erase the paper tooth → dilate a paper-white margin behind the drawing
function bake(bounds, K, drawFn, toothCanvas) {
  const [x0, y0, x1, y1] = bounds, pad = 2, ax = (pad - x0) * K, ay = (pad - y0) * K;
  const A = makeCanvas((x1 - x0 + pad * 2) * K, (y1 - y0 + pad * 2) * K), a = A.getContext('2d');
  a.setTransform(K, 0, 0, K, ax, ay); a.lineCap = a.lineJoin = 'round';
  drawFn(a);
  a.setTransform(1, 0, 0, 1, 0, 0); a.globalCompositeOperation = 'destination-out';
  a.fillStyle = a.createPattern(toothCanvas, 'repeat'); a.fillRect(0, 0, A.width, A.height);
  const M = makeCanvas(A.width, A.height), m = M.getContext('2d');
  m.drawImage(A, 0, 0); m.globalCompositeOperation = 'source-in'; m.fillStyle = '#fbf8ef'; m.fillRect(0, 0, M.width, M.height);
  const O = makeCanvas(A.width, A.height), o = O.getContext('2d');
  for (let i = 0; i < 12; i++) { const t = (i / 12) * Math.PI * 2; o.drawImage(M, Math.cos(t) * 0.9 * K, Math.sin(t) * 0.9 * K); }
  o.drawImage(A, 0, 0);
  return { c: O, ax, ay, K };
}
```

```js
// Timing: poses on twos, boil per figure, and the drawn-in / scribbled-out sequences
const twos = (t) => Math.floor(t * 12) / 12;
const boil = (t, phase) => Math.floor(t * 8 + phase * 5.3) % 3;
function creatureDrawing(e, rt) {
  const v = boil(rt, e.seed);
  if (e.dying) {
    const u = e.deathT;                                              // 0..1 over 0.35 s
    const level = u < 0.06 ? -1 : u < 0.2 ? 0 : u < 0.32 ? 1 : u < 0.44 ? 2 : 3;
    if (u < 0.55) return { spr: e.set[v], scratch: level, shiver: u >= 0.2 ? ((Math.floor(rt * 24) & 1) ? 0.7 : -0.7) : 0 };
    const k = (u - 0.55) / 0.45;
    return { spr: e.set[v], sx: 1 + 0.35 * k * k, sy: Math.max(0.12, 1 - 0.88 * k * k), alpha: 1 - k * 1.5, scratch: 3 };
  }
  if (e.spawnT < 1) {
    const t = e.spawnT;                                              // 0..1 over 0.45 s
    if (t < 0.3) return { sketch: e.sketch[v], revealCols: t / 0.3 };           // construction lines, left to right
    if (t < 0.88) return { sketch: e.sketch[v], spr: e.set[v], revealRows: (t - 0.3) / 0.58 }; // colour from the top
    const p = Math.sin(((t - 0.88) / 0.12) * Math.PI);
    return { spr: e.set[v], sx: 1 - 0.08 * p, sy: 1 + 0.12 * p };   // pop
  }
  if (e.flash > 0.2) { const q = e.flash > 0.55 ? 1 : 0.45; return { spr: e.set[v], sx: 1 + 0.2 * q, sy: 1 - 0.16 * q, flash: q > 0.5 ? 0.88 : 0.35 }; }
  return { spr: e.set[v] };
}
```

```js
// Ground composition: a crop field hung below a road – rows follow the field's own quad
function cropRows(ctx, q /* [tl, tr, br, bl] */, rowSpacing, drawRowItem) {
  const at = (u, v) => { const a = lerp2(q[0], q[1], u), b = lerp2(q[3], q[2], u); return lerp2(a, b, v); };
  const rows = Math.max(4, Math.round(dist(q[0], q[3]) / rowSpacing)), items = Math.round(dist(q[0], q[1]) / 5);
  for (let r = 0; r < rows; r++) {
    const v = (r + 0.6) / rows;
    strokePolyline(ctx, Array.from({ length: 11 }, (_, i) => at(0.035 + (i / 10) * 0.93, v)));
    for (let i = 0; i < items; i++) drawRowItem(ctx, at(0.06 + (0.88 * (i + 0.5)) / items, v), r, i); // ear, sprout or tulip
  }
}
```

## Adapting it to your project

- **Side-on platformer:** keep the wax layers and boil; the shade crayon still goes on the lower contour. Hills become a ground strip with the grass fringe on top; streams become a blue band at the bottom.
- **Bigger sprites:** raise `K`; keep line widths in world units so the crayon looks the same thickness relative to the figure; add one more scribble layer rather than finer detail.
- **New colours:** always add a partner shade crayon and a light partner — a colour without a cooler partner looks flat and digital.
- **New terrain:** describe it as a region with a designed edge (fringe, bank, furrow) and a rule for what clusters next to it (reeds by water, scarecrows in fields).
- **Night or indoor scenes:** don't add glow; darken the paper slightly and use indigo and slate washes — it stays a drawing of night.
- **Performance on small devices:** lower `BOIL` to 2 variants and bake lazily; drop the second pass of `wax()` on ground strokes.

## Performance notes

- Everything that looks hand-made is baked: sprites, shadows, icons, numbers and the screen overlay. Variant 0 eagerly in init, variants 1–2 lazily (chunk generator steps + 1.5 ms per frame).
- A dense stage frame with 60+ figures is ~1.6–2 ms of blits; rotated and sheared blits are the only per-frame transforms.
- Ground chunks (256 units, up to 640 × 640 px at 2.5 px/unit) are built in a generator that yields after every hill, field, stream, pond and road: ~12–25 ms each (median ~18 ms), spread over frames. Big areas use cell scribbles culled to the chunk box, strokes are batched by colour / alpha / width into `Path2D`s.
- Hill, field, side-road and stream decisions are cached per cell; the tooth and paper are applied once per chunk as patterns.
- Hot spots: many simultaneous removal sequences (two blits each) and the halo dilation at bake time (12 extra draws per sprite).

## Copy-paste prompt

```text
Use the Crayon Kids art style for my project: a child's wax-crayon drawing on bright, toothy white paper (#fbf8ef).
Colour every shape in wax layers: a light wash (alpha 0.4), a zigzag scribble whose sweep ends overshoot or stop short
of the edge and that is printed ~0.35 units off its own outline, a cooler partner "shade crayon" zigzag-hatched in a
crescent along the lower contour (green→pine #166856, red→crimson #b01c4a, blue/purple→indigo #3a3096, brown→sepia
#68382c, grey→slate #606284), an optional light gloss stroke on top, and a wobbly tapered black outline (#2b2a30,
0.9–1.25 units) that overshoots its start. Erase a paper-tooth texture out of every mark and leave a 0.9-unit white
margin around each sprite. Saturated crayon-box colours only: red #e2362c, orange #f78b1f, yellow #fdce28, grass
#42ae3a, dark green #217a38, sky #42a8ea, blue #2a5ec8, purple #8c4cc4, pink #f67eb4, brown #94582c, tan #d8a262.
Naive shapes: big round heads, stick limbs, lollipop trees, triangle roofs, a smiling sun in the corner.
Compose the ground like a picture: grassy hills with a "WWW" grass fringe and a pine shade band along the bottom,
ponds at hill edges with reeds, villages above wavy dirt roads, striped crop fields (wheat, ploughed, tulips) beside
them, blue streams crossed on plank bridges, and big calm areas of paper.
Animate on twos with three boiling line variants per drawing (8 fps, a different phase per figure); 8-drawing walk
cycles with counter-swinging arms and a lagging hair curl; hits as two held squash drawings with a white flash;
creatures appear by being sketched and coloured in, and disappear by being scribbled out and melting flat.
Effects are crayon bits: pow stars, zigzag bolts, crumbs, shavings, hearts, a colour smudge left on the paper.
```
