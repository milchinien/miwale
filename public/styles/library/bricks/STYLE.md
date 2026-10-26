# Toy Bricks — Game Art Style Spec

> A toy-box world of glossy plastic bricks: stud-covered baseplates, tiled roads, transparent-blue water plates and a little toy figure.

Everything is built from interlocking plastic parts seen from a steep 3/4 front view: bricks, plates, smooth tiles and round bricks, each baked to sprites at startup by a small cell renderer that gives every part a glossy front gradient, a sheen band, lit rims, dark gaps to its neighbours and a round stud with a highlight crescent on every open top. The ground is a green baseplate covered in studs, with raised lime and grey plates, smooth grey road tiles with white lane dashes and transparent-blue water plates. The main character is a molded toy figure with a yellow cylinder head, printed face and claw hands, posed like a played-with toy: rigid legs swing on the hip pin, arms on the shoulder pins, the head looks around, the helmet pops up when it is hit. Creatures are brick beetles in two designs, a translucent ghost piece and a brick-built robot; they click together from the baseplate and pop apart into bricks. Saturated toy-box primaries, crisp and cheerful.

## At a glance

| | |
| --- | --- |
| Family | 3D Look · Toy Bricks |
| Mood | playful, cheerful, tactile, bright, nostalgic |
| Best for | family and kids games, top-down action/arena games, builder and sandbox games, puzzle and party games, casual mobile |
| Renderer | Canvas 2D + a small brick-cell renderer and a vector figure painter (sprites baked at init) |
| Pixel art | No — native resolution, sprites baked at ~1.6× screen scale, blits snapped to screen pixels |
| Complexity | 4/10 — props and creatures are a few `part()` calls; molded figures are hand-written paths |
| Fonts | Titan One (titles, counters, step numbers), Fredoka 400–700 (card text, labels) |
| Key colours | `#47a347` baseplate · `#666d73` road tile · `#3d92e8` water plate · `#d4231c` red · `#f7c81e` yellow · `#1c5fc6` blue · `#f7c51e` figure yellow · `#1b1d22` print black |

## When to use it

- **Good fits:** cheerful top-down scenes with many small readable figures, family and kids games, builder/sandbox games (the grid *is* the building system), party and puzzle games, casual mobile.
- **Good fit for AI-built projects:** a new prop or creature is just a list of parts on a stud grid (`brick(x, y, z, w, d, colour)`); gloss, rims, gaps, studs and shadows come from the renderer, so results stay consistent.
- **How it differs from its base style `voxel` (Voxel Cube World):** both bake 3D cell grids to sprites at init, but `voxel` is a matte MagicaVoxel autumn diorama — tiny cubes with per-voxel colour jitter and ambient occlusion, rotated ±0.6 rad so you see diamond-shaped tops and two side faces, natural greens and browns. Toy Bricks uses real part proportions (1 stud × 1 stud × 1 plate cells, 3 plates = 1 brick), a straight front view with only tops and fronts, *glossy* plastic gradients and rims instead of jitter/AO, a stud on every open top, dark gaps between parts, smooth tiles, transparent parts, molded figures and toy-box primaries. At a glance: voxel = carved matte cubes in sunlight, Toy Bricks = shiny studded plastic under studio light.
- **Bad fits:** horror or grim drama, realistic or painterly worlds, soft-bodied organic animation, cameras that must rotate.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Baseplate Green | `#47a347` | Main ground plate with studs (~55% of the screen) |
| Dark Baseplate | `#2f8540` | Darker green patches (woods) |
| Lime Plate | `#8cc63f` | Raised plates (+1 plate), front edge visible |
| Sand Tan | `#e2cb96` | Tan baseplate around water |
| Road Tile | `#666d73` | Smooth 2×2 road tiles; lane dashes `#eeeee8` |
| Curb Tile | `#c6cbce` | One-stud light grey border of roads |
| Plaza Grey | `#a7acb0` | Raised light grey plates; light grey parts |
| Water Blue | `#3d92e8` | Transparent-blue water plates (−1 plate), deep `#2b70d2`, studs `#8fcaff` at 0.75 alpha |
| Toy Red | `#d4231c` | Beetle body, fruit, house walls; dark red `#9e1d18` |
| Toy Yellow | `#f7c81e` | Fruit, robot shoulders, projectiles, bars |
| Toy Blue | `#1c5fc6` | Robot torso, counter panel |
| Leaf Green | `#21883f` | Tree crowns with bright green `#4caf48`, dark green `#1d6b34`, lime `#8cc63f` |
| Toy White | `#f2f2ec` | Fences, eye studs, windows, white panel |
| Toy Black | `#2a2c31` | Feet, lamp posts, robot hips |
| Reddish Brown | `#7b4527` | Trunks, posts, backpack |
| Dark Grey | `#5f666c` | Robot legs, rocks, roofs |
| Toy Orange | `#f07e1f` | Figure shirt, cones; transparent orange `#ff9a26` beacons |
| Figure Yellow | `#f7c51e` | Figure head and claw hands |
| Figure Blue | `#1f4f9a` | Figure legs |
| Ghost Clear | `#cde8ff` | Translucent ghost (0.5–0.78 alpha) |
| Collectible Azure | `#2f9bff` | Small stud coins; large coins `#ffc81e` |
| Print Black | `#1b1d22` | Printed faces, card borders, title outlines |

Transparent parts: water `#62b0ff` @0.62, clear `#e6f4ff` @0.5, red `#ff3b2b` @0.88, yellow `#ffd84a` @0.88, orange `#ff9a26` @0.86.

**Palette rules**

- Only saturated toy-box primaries plus white, black, tan and two greys. Every part is one flat plastic colour — no noise, no jitter, no texture.
- All shading comes from the fixed gloss recipe (rim ×1.2+12 → ×1.02 → ×0.88 → bottom ×0.7). Never hand-pick a darker shade for the same part.
- Transparent parts keep their hue at 0.5–0.88 alpha with brighter highlights; only warm transparent parts glow.
- Hue families per layer: world green/tan/grey/blue, creatures red/white/blue/clear, main character orange + yellow + dark blue (pops on every ground).
- Prints are flat `#1b1d22` shapes with tiny white glints, like pad printing.

## Typography

**Titan One** 400 — titles, big counters, step numbers, floating numbers. https://fonts.google.com/specimen/Titan+One

```css
.title   { font: 400 66px/1 'Titan One', 'Fredoka', system-ui, sans-serif; color: #f7c81e; letter-spacing: 2px;
           -webkit-text-stroke: 3px #1b1d22; paint-order: stroke fill;
           text-shadow: 0 5px 0 #1b1d22, 0 9px 0 #d4231c, 0 12px 0 #1b1d22, 0 22px 24px rgba(20,40,80,.35); }
.counter { font: 400 34px/1.05 'Titan One', sans-serif; color: #1b1d22; text-shadow: 0 2px 0 rgba(255,255,255,.55); }
.step    { font: 400 40px/1 'Titan One', sans-serif; color: #1b1d22; }   /* booklet step number */
```

**Fredoka** 400/500/600/700 — card titles, body copy, labels, hints. https://fonts.google.com/specimen/Fredoka

```css
.card-title { font: 700 20px/1.15 'Fredoka', system-ui, sans-serif; color: #1b1d22; }
.card-text  { font: 500 15px/1.3 'Fredoka', system-ui, sans-serif; color: #3b4652; }
.label      { font: 700 11px/1 'Fredoka', sans-serif; letter-spacing: 3px; color: #5a4300; }
```

Titles are outlined with a 3 px `#1b1d22` stroke and "built up" from hard stacked shadows (black, red, black) like a sticker on a box. Floating in-world numbers (canvas): Titan One 7.5 units (emphasised 10), stroked twice with `#1b1d22` (1.7 / 2.2 units, the first stroke offset 0.6 down), white fill (emphasised `#f7c81e`).

## Rendering technique

**Grid.** A model is `w × d × h` cells: `x` right, `y` toward the viewer, `z` up. One cell = 1 stud × 1 stud × 1 plate. On screen: 1 stud = `SX = 6` units across and `SY = 4.2` units deep, 1 plate = `PH = 2.1` units tall (a brick = 3 plates = 6.3 units). Each cell stores a colour and the **id of the part** it belongs to; parts are added with `part(x, y, z, w, d, h, colour, { tile, round, print })`, plus shortcuts `brick` (h = 3), `plate` (h = 1) and `tile` (h = 1, no studs).

**Projection.** Straight front view, no yaw: screen `x = (x − w/2)·SX`, `y = (y − d/2)·SY − z·PH`. Only top faces and front faces exist, and every face is an axis-aligned rectangle — so coordinates can be rounded to whole pixels and neighbouring cells of one part never show hairline seams.

**Order.** Rows back to front (`y` ascending), within a row plates bottom to top (`z` ascending). A cell can only hide cells behind and below it, so this simple loop is a correct painter's order — studs drawn with their cell are automatically covered by anything in front.

**Per cell.**
1. *Front face* if the cell in front is empty (or round): fill with the part's vertical gradient (spans the whole part, not the cell: ×1.2+12 at 0, ×1.02 at 0.13, ×0.88 at 0.6, ×0.7 at 1), then the part's horizontal sheen (white 0.05 → 0.24 at 10% → 0.03 at 22% → clear → black 0.12 at the right end).
2. *Edges:* top rim `rgba(255,255,255,.6)` on the part's top plate; gap line `rgba(0,0,0,.4)` at the bottom of a part resting on another; left end light `.3` (open) or dark gap `.36` (different part); right end dark `.2` when open. Line width `max(1, round(0.28·K))` px.
3. *Top face* if nothing is above: flat colour ×1.06+4, white back rim `.5` (open behind) or dark seam `.3` (different part behind), dark seam on the right when the right neighbour is another part, and a **stud** unless the part is a tile.
4. *Print:* after the part's last front cell, `print(ctx, rect, k, mirrored)` draws decoration over its whole front face (eyes, grin, windows, arrows, chest panels).

**Round parts** (1×1 or 2×2) are drawn as cylinder slices when the loop reaches their front row: a rectangle plus the bottom half of the footprint ellipse filled with a horizontal cylinder gradient (×0.95, ×1.2 at 20%, ×1.02, ×0.8, ×0.62), a dark gap arc where they rest on a part, and on the top slice an ellipse (×1.16 → ×1.0) with a white front rim arc, an inner highlight arc and studs.

**Studs** are baked sprites per colour and resolution: contact shadow ellipse `rgba(10,20,40,.26)` offset (+0.42, +0.2), cylinder (radius 1.8, height 1.05 units, footprint ry = 1.26) with a horizontal gradient, lighter top ellipse, a faint dark rim, a white highlight crescent (0.34 units wide, angles 1.02π–1.52π at 70% radius) and a faint lit front rim.

**Molded figures** (main character, ghost, coins) are canvas paths with the same light: horizontal cylinder gradients, white streak highlights on the left, flat prints. They are painted once per frame and facing into sprites.

**Baking.** `K = clamp(round(screenH/360 × 1.6 × 2)/2, 2.5, 7)` sprite px per world unit — about 1.6× screen scale so zoomed views stay crisp; sprites are drawn down-scaled with smoothing. Facing left = the grid mirrored in `x` and baked again (prints receive `mirrored`), never a flipped sprite, so the light stays on the upper left.

**Draw order per frame:** ground chunks → water glints → shadows → y-sorted props, creatures and main character → orbiting beacons → projectiles → particles → floating numbers → x-ray copy of the hidden main character → vignette.

## World and ground

The ground is an endless baseplate seen from the same front view, drawn row by row into cached 256-unit chunks with integer pixel coordinates (`round((x − chunkX)·res)`), so chunks line up seamlessly.

- **Cells and levels.** The ground uses the same stud grid (6 × 4.2 units). A pure function of the cell index returns the material; its level is fixed per material: water −1, baseplate/tan/road/curb 0, lime and grey plates +1. A cell at level L is drawn `L·2.1` units higher.
- **Materials:** baseplate `#47a347` (default), dark baseplate `#2f8540` (fbm(x/300) > 0.625), lime plates `#8cc63f` (fbm(x/250) > 0.645), grey plates `#a7acb0` (fbm(x/340) > 0.672), tan `#e2cb96` (pond field 0.64–0.668), water `#3d92e8` (> 0.668), deep water `#2b70d2` (> 0.705). The pond field is fbm(x/520) lowered by 0.2 within 90 units of the world origin so the start area is dry.
- **Roads:** two noise networks; the distance to each zero line is `|n| / |∇n|` (in world units), and a cell is road when the smaller distance < 11.5 — constant-width winding roads (≈ 4 studs) with clean junctions. A road cell touching any non-road cell becomes a curb tile `#c6cbce`. Road tiles are 2×2 with dark seams every 2 cells and a 0.16-alpha white line along each tile row. Lane dashes: road cells on the local minimum of the distance (along x or y) with distance < 3 get a white tile `#eeeee8` with a white top line and a dark bottom line, in a 2-on / 2-off pattern along `(i + j) mod 4`.
- **Plate seams:** dark 0.2-alpha lines every 16 studs on baseplates, every 4 on raised plates, every 8 on tan and water — the world reads as many plates laid side by side.
- **Raised edges:** a cell above its southern neighbour shows a 2.1-unit glossy front face (×1.16+10 → ×0.84 at 25% → ×0.64) with a white top rim; raised cells get a white rim on their back and left edges; lower cells get a 2.2-unit contact shadow under a higher northern neighbour and a 2.4-unit shadow gradient right of a higher western neighbour.
- **Water:** transparent-blue plates with pale blue studs at 0.75 alpha, a 0.07 white sheen on the upper half of each cell, a 1.4-unit dark band under the shore edge, lily pads (green round tile with a pink flower) on 2% of open water cells, and white cross glints blinking on 12% of the cells.
- **Toy parts instead of studs, grown in beds** (pure functions of the cell): flower plates — five glossy petals (red, yellow, white, pink, azure, violet) around a yellow centre stud — only inside **flower beds** (`noise(x/70) > 0.68`, 30 % of the cells there), one colour per bed from `noise(x/160)` with rare accents; leaf plants (three pointed glossy leaves) in **clumps** (`noise(x/48) > 0.64` → 14 %, elsewhere 0.4 %); loose 1×1 round plates only 0.08 %; flowers on 2 % of lime plates; lily pads on open water. Nothing is sprinkled evenly.

## Characters

All characters share the upper-left studio light and cast a soft shadow to the lower right. Two construction methods: molded figures (paths) and brick-built creatures (cell grids).

**Main character — toy explorer figure** (~31 units tall, ~15 wide, feet at the anchor):

- **Legs:** two 4.15 × 9.4-unit rounded rectangles in `#1f4f9a` with a vertical gloss gradient, a darker 1.6-unit foot band, a white streak highlight; the back leg is darker (×0.82). Hip piece 9.2 × 2.4 units above them with a white top rim.
- **Torso:** trapezoid 7.4 units wide at the shoulders, 9.7 at the hips, 8.7 tall, orange `#f07e1f` with a horizontal cylinder gradient and a white streak along its left edge. Printed details: a brown `#6b3a1c` strap from the shoulder away from the facing side to the opposite hip, a brown belt with a yellow buckle, a small pocket, a red `#d4231c` bandana triangle at the neck.
- **Arms and hands:** 3-unit-thick curved strokes from the shoulders, ending in yellow `#f7c51e` C-shaped claw hands (a 1.4-unit circle with a darker 0.62-unit notch at the front-bottom).
- **Head:** yellow cylinder 7.2 units wide and 6.9 tall with a rounded bottom, cylinder gradient and a white vertical highlight streak. Printed face shifted 0.85 units toward the facing direction: two black oval eyes (0.5 × 0.76) with white glints, short brows, a smile arc.
- **Pith helmet:** brim ellipse 11.6 × 3.7 units in `#e6d2a0` over a darker underside, dome 8.1 × 4.5 with a brown `#8a5a2c` band, a white highlight spot and a small top button. A brown backpack peeks out on the side away from the facing direction.
- **Posed like a toy:** legs are rigid pieces rotating on the hip pin (the back leg is drawn first and darker), arms rotate on the shoulder pins (`hand = shoulder + rotate((±2.45, 6.0), −angle·facing)`), the claw's notch turns on the wrist pin, the face print looks around (offset −0.3 … 1.6 units toward the facing side), and the helmet is a separate piece that lags the hop (−0.4) and pops up 2.2 units on a hit.
- **16 poses** per facing: 0–7 walk (legs `[0.42, 0.28, 0, −0.28, −0.42, −0.28, 0, 0.28]` rad, the other leg mirrored, arms ×1.25 opposite, hop 1.2 units at passing), 8–11 idle fidgets (look further, look away + turn a hand, breath), 12 blink (eyes as small arcs), 13 dash crouch (1.4 lower, leaning back, arms back), 14 dash lunge (leaning 0.22 rad, legs ±0.7, arms swept back), 15 hurt (leaning back, arms up, round white-ringed eyes, raised brows, O-mouth, helmet popped up).

**Small creature — brick beetles in two designs** (4 × 3 × 9 cells, ~24 × 26 units), picked by the actor's seed:
- *Red beetle:* a dark grey 2×3 base plate, a 2×3 red brick body with a printed black grin and two white fangs, a dark red 2×2 shell plate, two white 1×1 round bricks (2 plates tall) as eyes with black pupils.
- *Yellow beetle:* a yellow brick body with a black stripe print, a black shell plate, one tall and one short white eye brick and a black round antenna with a red round tile on top.
- 6 scuttle poses: black 1×2 side feet jump one stud forward/back, the body hops one plate (2.1 units), the eye bricks lag the hop by one pose. Hit pose: the body jumps a plate, all four feet splay out, the eyes print an X.

**Fast creature — translucent ghost piece** (~20 wide, ~20 tall): a sheet with a round head (radius 6.2), raised stubby arms and a four-scallop wavy hem; fill is a radial gradient from `rgba(250,253,255,.5)` to `rgba(150,200,245,.78)` at the edges, a 0.75-unit white rim, an inner `rgba(110,165,225,.45)` rim, a white gloss arc on the head and a streak on the left. Printed face: black oval eyes (1.05 × 1.5) with white glints and an O-mouth. Hovers on an eased bob (2.6–5.8 units, holding at the top and bottom, own phase per actor) with a faint additive blue glow; 6 poses alternate the arms and ripple the hem, the hit pose flares the sheet, throws the arms high and widens the eyes 1.35×.

**Large creature — brick robot** (7 × 3 × 22 cells, ~42 × 52 units): dark grey 2×3 feet and 2×2 legs, a black hip plate, a blue 5×3 torso of two stacked bricks (lower one printed with a 4-slot grille, upper one with a yellow chest panel and a glowing red core), light grey 1×2 arms with yellow shoulder plates and red hands, a light grey 3×2 head printed with two glowing red eyes and a mouth grille, a black round antenna with a transparent red tip. 6 stomp poses: one foot lifts a plate, the arms swing a stud opposite, the head and antenna rise one plate a pose later (lag). Hit pose: arms raised five plates, bigger antenna glow. Additive red glows sit on the eyes, core and tip.

**Rules**

- Brick creatures move in whole cells only (feet a stud, legs a plate) — like real toy parts.
- Faces are prints: flat black ovals with white glints, never painted shading.
- One dominant colour per creature with white or black accents; keep the main character's orange/yellow/blue unique.
- No outlines; silhouettes come from the gloss, rims and gaps.

## Props

Props are cell grids on the same stud grid as the ground. Their footprint snaps to whole studs (`x = i0·6 + w·3`, `y = j0·4.2 + d·2.1`), they are lifted by 2.1 units on raised plates, y-sorted with the figures (sort key = anchor + 0.3·depth) and each has a baked footprint shadow.

- **Tree** (5×3×15): two 1×1 round brown bricks as trunk, a dark green 3×3 plate, a 5-wide crown layer (2×3 + 3×3 bricks in green/bright green), a 3-wide layer with round leaf plates and red or yellow round fruit plates on the steps, a lime 3×3 plate and a round top plate.
- **Pine** (5×3×16): short round trunk, dark green 5×3 brick, green 3×3 plate, dark green 3×3 brick, green plate, a 1-stud column and a round green tip.
- **Bush** (3×2×5): green 3×2 brick with round bright green, lime and red plates on top.
- **Rock pile** (3×2×7): dark and light grey bricks stepping up, a round dark plate, two smooth tiles on top.
- **Fence** (4×1×6): two white 1×1 posts (brick + smooth brick), two smooth 1×2 white rails between them.
- **Brick pile** (4×3×9): a loose stack — red 2×4, yellow 1×2, white 1×1, blue 2×2 on top, a lime plate, an orange 1×1 and an azure 1×2 plate.
- **Sign post** (3×1×10): round brown post, white 3×1 smooth sign (3 plates) printed with a red arrow.
- **Cone** (1×1×5): orange square tile, orange round 3-plate body with a white stripe print, white round top.
- **Lamp post** (3×3×16): dark grey 3×3 base plate, black round post, transparent yellow round head with a warm glow (radius 13 units), black round cap tile.
- **House** (5×4×14): red walls laid in running bond (layers of 2+3 / 3+2 / 2+3 stud bricks), a printed blue door (two panels, yellow knob), two white window parts with printed blue glass and white mullions, a white plate, a dark grey roof brick and plate, a dark red chimney.

Placement: a jittered 46-unit grid; a prop stands only if every footprint cell has the anchor's material and the row in front does too (never on plate edges, roads or water; cones and lamps may stand on curbs). Tall props (trees, pines, lamp, house) fade to 0.32 when the main character is behind them; the figure is then redrawn over them at 0.72.

## Effects and particles

- **Plastic pop** — The core flash of every hit, burst, pickup and celebration: a white 4-point star (cool blue for clear pieces) that snaps open from 45 % to full size with outQuad and a thin white ring around it, 0.12–0.22 s.
- **Flying single bricks** — Bursts throw baked loose parts (1×1 brick, 1×2 brick, 2×2 plate, 1×1 round plate, 1×1 plate) in the colours of what burst; they tumble (±7 rad/s), fly with vz 50–150, gravity 330, drag 1.3, bounce, leave a soft shadow near the ground and fade in the last 25 %. Ghost pieces float upward.
- **Loose studs (residue)** — Each burst also drops 3–5 round 1×1 plates that barely jump (vz 25–30) and lie on the baseplate for 1.8–2.2 s before fading – what is left of the creature.
- **Stud ring** — An ellipse (r × 0.8 r) easing out to 22–56 units, white stroke at 0.8·k alpha, with 4–16 yellow studs riding on it; the celebration ring's studs advance in quarter steps.
- **Click-together appearance** — Brick creatures are built up from the baseplate in whole plate rows (outQuad over 75 % of 0.45 s) while two loose bricks drop in, then they press down (squash 0.92) and spring back (1.04) with a white pop on top – the click. The ghost fades in, drops 10 units onto its peg and un-stretches.
- **Pop apart** — A vanishing creature swells (1.08 × 1.05) and whites out for 14 %, then its hit pose splits into brick-sized blocks (2×3, robot 3×5) that jump out and up, land on the baseplate and fade; positions advance on twos and rotations snap to 30° steps (stop-motion). The ghost piece floats apart and shrinks. At most 8 per frame.
- **Stud coins** — Collectibles are round stud coins spinning through 10 baked frames: azure #2f9bff small, gold #ffc81e large with a gold glow; raised ring, highlight crescent, edge band, hovering 4.4–6 units with a twinkle star.
- **Projectile and orbiting beacon** — A yellow 1×1 round plate with two fading copies and a pale yellow speed line; a transparent orange round brick on a black plate with a yellow cap hovering 10 ± 1.4 units in a warm glow.
- **Sparkles:** 4-point stars `#fff6c8` (clear pieces `#d8f1ff`) with a white dot, 3–6 units, scaled by `0.4 + sin(life·π)·0.8`.
- **Layering:** every burst = plastic pop (core) → flying bricks (main) → sparkles + stud ring (secondary) → loose studs on the ground (residue).

## Atmosphere and lighting

- One bright studio light from the upper left, baked into every gradient, rim and stud crescent. No dynamic lighting except glows.
- **Cast shadows** (props, beetle, robot): every column's footprint drawn at heights 0 … top in 0.5-plate steps, sheared by (0.36, 0.2) units per unit of height to the lower right, filled black, blurred 0.9·K px, alpha 0.42 (creatures) / 0.45 (props).
- **Soft shadows** (figure, ghost, coins, beacons, debris): radial ellipse `rgba(10,25,45,.5 → .32 → 0)`, offset 1.6 units to the right.
- **Glow:** 64 px radial sprites (0.9 → 0.32 → 0) drawn with `lighter`: warm `rgb(255,210,110)`, red `rgb(255,70,40)`, cool `rgb(120,190,255)`, gold — only on transparent emissive parts.
- **Vignette:** radial gradient from `rgba(20,40,80,0)` at 0.36·h through `rgba(20,40,80,.08)` to `rgba(14,26,60,.34)` at the corners, plus a warm-white light spot `rgba(255,252,235,.16)` at the top-left.
- **X-ray:** when a tall prop covers the main character, the figure is redrawn over it at 0.72 alpha.
- Overlay screens tint the world with pale booklet blue `radial-gradient(rgba(232,245,253,.42), rgba(120,176,224,.52))`.
- No grain, no bloom pass, no colour grading, no outlines.

## UI

The HUD is brick-built; the cards are instruction-booklet pages.

- **Brick panel:** `linear-gradient(180deg, light 0 3px, colour 3px 45%, dark 100%)`, radius 5 px, inset white top rim (2 px, .55) and left rim (.28), dark right (.14) and bottom (3 px, .2) rims, a 4 px hard drop edge in a darker shade and a soft `0 9px 16px rgba(20,30,60,.32)` shadow. A row of side-view studs sits on the top edge (`::before`, 9 px tall, 22 px pitch): a 12 px body with a light/dark split, a 6 × 2.6 px top ellipse and a tiny white glint. White brick `#f2f2ec` (edge `#a9aaa3`) for the panel with bar, yellow brick `#f7c81e` (edge `#a37a08`) for the title box, blue brick `#1c5fc6` (edge `#0d3474`) for the counter.
- **Bars:** a recessed dark tile `#2b2e33` (inset shadow, 1 px white bottom highlight); the fill is a plate seen from above — red `#d4231c` (or yellow `#f7c81e` for the long top bar) with a top-view stud every 18 px (light centre, ring, dark edge, glint) and an inset white top line.
- **Caption bar:** a black smooth tile `#2a2c31` with a 4 px `#0f1012` drop edge; name in yellow Titan One, small labels in grey Fredoka.
- **Cards (instruction booklet):** white page with a pale blue `#e8f3fb` bottom 38%, 3 px `#1b1d22` border, radius 14, hard 6 px `#1b1d22` drop edge; a big Titan One step number (40 px, `#1b1d22`) in the top-left corner; the icon sits in a parts-callout box (white, 2 px `#1b1d22` border, radius 10, 4 px inner `#dcebf7` ring) with a small "1x" count in its corner. Hover: lift 8 px and tilt −1°.
- **Icons:** the same parts rendered small — a heart mosaic of 1×1 red plates, a lightning mosaic of yellow plates, a U-magnet mosaic, a hammer of round brown bricks and a grey brick, three round bricks, a red/white spring stack, a toy car, a white brick with a printed red cross, the beacon, the beetle — fitted to 84% of the box with a 0.28-alpha dark offset silhouette.

## Motion and animation

- The toy is animated like a brickfilm: poses are held and stepped, not tweened. Main character walk: 8 poses at frame = floor(anim·1.3) mod 8 (~12 fps at walking speed): legs ±0.42 / ±0.28 / 0 rad on the hip pins, arms counter-swing at 1.25× the leg angle, the figure hops 1.2 units at passing, the helmet lags the hop.
- Idle: 4 fidget poses held 0.75 s each (look further toward the facing side, look away while turning a hand on its wrist pin, small breath), and a blink pose for 0.16 s every 3.8 s.
- Dash: crouch pose for the first 50 ms (body 1.4 lower, leaning back, arms back = anticipation), then the lunge (leaning 0.22 rad, legs ±0.7, arms back) with two white copies two units apart; hurt pose while hurtT > 0.62 with a red tint; invulnerability blinks at 18 Hz.
- Beetles: 6 poses at anim·2.7, robot 6 poses at anim·1.8, ghost 6 poses at 7 fps + seed with an eased hover (holds at the top and bottom, own phase per actor) – crowds never move in lock-step.
- Hit: hit pose + white flash while flash > 0.25, knocked 2 units in the push direction for the first half, squash 1.06 × 0.95.
- All brick motion is in whole cells (studs, plates); debris and coins move smoothly, break-up blocks move on twos.
- Coins spin 1.4 sets per second and bob ±0.9 units; floating numbers pop from 0.6 to 1.15 in the first 14 % of their life.

## Do and don't

**Do**

- Build every prop, creature, icon and debris piece from real part sizes on one grid: 1 stud = 6 units across, 4.2 deep, 1 plate = 2.1 units, 1 brick = 3 plates.
- Let the part structure do the line work: rims on top edges, dark gaps between parts, staggered bricks in walls.
- Put a stud on every open top that is not a smooth tile, and on every baseplate cell.
- Use only flat saturated toy colours and the fixed gloss recipe; make transparent parts translucent with brighter highlights.
- Snap props to whole studs so they sit exactly on the baseplate grid.
- Mirror brick grids (not sprites) for the other facing so the light stays on the upper left.
- Use smooth tiles (no studs) for roads, signs and roofs to give the eye calm areas.
- Pose the figure like a toy: rotate rigid parts on their pins, hold poses, hop at passing; give every state its pose (blink, crouch, lunge, hurt).
- Grow decorations in beds: one flower colour per bed, leaf plants in clumps, almost no loose studs elsewhere.

**Don't**

- Don't add outlines or strokes around parts.
- Don't use noise, texture, dithering or per-cell colour jitter — plastic is clean and uniform.
- Don't rotate the camera or show side faces; the look depends on the straight front 3/4 view.
- Don't use half-stud offsets or arbitrary sizes; nothing may float between studs.
- Don't use muted, earthy or pastel palettes for the world; it must feel like a toy box.
- Don't make every surface studded: roads, curbs, signs and roof tiles stay smooth.
- Don't use brand names, logos or embossed lettering on studs.
- Don't tween poses smoothly or squash the figure – toys don't bend.
- Don't sprinkle flowers and loose studs evenly over the baseplate.

## Implementation recipe

1. Define the grid constants (`SX = 6`, `SY = 4.2`, `PH = 2.1`) and a colour list of flat toy colours (transparent ones with alpha).
2. Write the cell grid: `part(x, y, z, w, d, h, colour, {tile, round, print})` storing colour + part id per cell; add `brick/plate/tile` helpers and `mirror()`.
3. Write the stud sprite baker (cylinder gradient, top ellipse, crescent, contact shadow), cached per colour and resolution.
4. Write the renderer: loop `y`, `z`, `x`; draw front faces with the part gradient + sheen + rims/gaps, top faces + studs, round parts as cylinder slices, prints last. Round all coordinates.
5. Bake a shadow per grid (sheared footprint, blurred).
6. Paint the molded figures with paths from a pose (`figPose(f)`: leg/arm pin angles, hop, lean, look, hat lag, blink/hurt) and bake 16 poses for both facings; give brick creatures 6 walk poses + a hit pose and a second design for the most common one.
7. Build the baseplate: per-cell material + level, rows back to front, front faces on level drops, seams, studs, toy parts; cache 256-unit chunks.
8. Place props on whole studs, y-sort with figures, fade tall props over the figure and redraw it as an x-ray copy.
9. Effects: plastic pop → tumbling baked loose parts → sparkles + stud rings → loose studs left on the baseplate; click-together appearance and pop-apart vanish; stud coins.
10. HUD: brick panels with CSS stud rows, stud-covered bar fills, booklet cards with step numbers and callout boxes.

## Code

**1. Parts on a grid**

```js
const SX = 6, SY = 4.2, PH = 2.1;               // stud across, stud deep, plate height (world units)
function model(w, d, h) { return { w, d, h, cell: new Int32Array(w * d * h), parts: [null] }; }
function part(m, x, y, z, w, d, h, col, o = {}) {
  const id = m.parts.length;
  m.parts.push({ x, y, z, w, d, h, col, tile: !!o.tile, round: !!o.round, print: o.print || null });
  for (let zz = z; zz < z + h; zz++) for (let yy = y; yy < y + d; yy++) for (let xx = x; xx < x + w; xx++)
    if (xx >= 0 && yy >= 0 && zz >= 0 && xx < m.w && yy < m.d && zz < m.h) m.cell[(zz * m.d + yy) * m.w + xx] = id;
  return m;
}
// a beetle: base plate, body brick with a printed grin, shell plate, two round eye bricks
const m = model(4, 3, 6);
part(m, 1, 0, 0, 2, 3, 1, '#5f666c'); part(m, 1, 0, 1, 2, 3, 3, '#d4231c', { print: grin });
part(m, 1, 0, 4, 2, 2, 1, '#9e1d18'); part(m, 1, 2, 4, 1, 1, 2, '#f2f2ec', { round: true, print: eye });
```

**2. Glossy front face, rims and gaps**

```js
// inside the loop over y (back to front), z (bottom to top), x — p = part of the cell, b = its id
const gr = g.createLinearGradient(0, PY(y + 1, p.z + p.h), 0, PY(y + 1, p.z));      // spans the whole part
gr.addColorStop(0, shade(p.col, 1.2, 12)); gr.addColorStop(0.13, shade(p.col, 1.02));
gr.addColorStop(0.6, shade(p.col, 0.88));  gr.addColorStop(1, shade(p.col, 0.7));
g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0);
const sheen = g.createLinearGradient(PX(p.x), 0, PX(p.x + p.w), 0);
sheen.addColorStop(0, 'rgba(255,255,255,.05)'); sheen.addColorStop(0.1, 'rgba(255,255,255,.24)');
sheen.addColorStop(0.22, 'rgba(255,255,255,.03)'); sheen.addColorStop(0.72, 'rgba(0,0,0,0)'); sheen.addColorStop(1, 'rgba(0,0,0,.12)');
g.fillStyle = sheen; g.fillRect(x0, y0, x1 - x0, y1 - y0);
if (z === p.z + p.h - 1 && !above) { g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(x0, y0, x1 - x0, lw); }  // lit rim
if (z === p.z && z > 0 && at(x, y, z - 1)) { g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x0, y1 - lw, x1 - x0, lw); } // gap
const left = at(x - 1, y, z);
g.fillStyle = !left ? 'rgba(255,255,255,.3)' : left !== b ? 'rgba(0,0,0,.36)' : 'transparent';
g.fillRect(x0, y0, lw, y1 - y0);
```

**3. The stud**

```js
function stud(g, cx, cy, col, k) {                // (cx, cy) = centre of the stud base, k = px per unit
  const rx = 1.8 * k, ry = rx * 4.2 / 6, hh = 1.05 * k;
  g.fillStyle = 'rgba(10,20,40,.26)'; g.beginPath(); g.ellipse(cx + .42 * k, cy + .2 * k, rx * 1.06, ry * 1.12, 0, 0, 2 * Math.PI); g.fill();
  const s = g.createLinearGradient(cx - rx, 0, cx + rx, 0);
  s.addColorStop(0, shade(col, .98)); s.addColorStop(.24, shade(col, 1.16, 6)); s.addColorStop(.55, shade(col, .92)); s.addColorStop(1, shade(col, .64));
  g.fillStyle = s; g.beginPath(); g.moveTo(cx - rx, cy - hh); g.lineTo(cx - rx, cy);
  g.ellipse(cx, cy, rx, ry, 0, Math.PI, 0, true); g.lineTo(cx + rx, cy - hh); g.fill();
  g.fillStyle = shade(col, 1.12, 6); g.beginPath(); g.ellipse(cx, cy - hh, rx, ry, 0, 0, 2 * Math.PI); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.88)'; g.lineWidth = Math.max(1, .34 * k); g.lineCap = 'round';
  g.beginPath(); g.ellipse(cx, cy - hh, rx * .7, ry * .66, 0, Math.PI * 1.02, Math.PI * 1.52); g.stroke();   // crescent
}
```

**4. Baseplate row with a raised plate edge**

```js
for (let j = j0; j <= j1; j++) {                  // rows back to front
  for (let i = i0; i <= i1; i++) {
    const m = MATS[mat(i, j)], lv = m.lvl, below = MATS[mat(i, j + 1)].lvl;
    const x0 = X(i * 6), x1 = X((i + 1) * 6), y0 = Y(j * 4.2 - lv * 2.1), y1 = Y((j + 1) * 4.2 - lv * 2.1);
    g.fillStyle = m.top; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    if (below < lv) {                              // glossy front edge of a raised plate
      const fy = Y((j + 1) * 4.2 - below * 2.1), gr = g.createLinearGradient(0, y1, 0, fy);
      gr.addColorStop(0, m.f0); gr.addColorStop(.25, m.f1); gr.addColorStop(1, m.f2);
      g.fillStyle = gr; g.fillRect(x0, y1, x1 - x0, fy - y1);
    }
  }
  for (let i = i0; i <= i1; i++) if (MATS[mat(i, j)].stud) drawStudSprite(i, j);   // studs after the row
}
```

**5. Molded figure head with a printed face**

```js
function head(g, top, bottom, facing) {            // yellow cylinder, 7.2 units wide
  const gr = g.createLinearGradient(-3.6, 0, 3.6, 0);
  gr.addColorStop(0, '#ecbd1d'); gr.addColorStop(.2, '#ffe33a'); gr.addColorStop(.45, '#fcc91f'); gr.addColorStop(1, '#b28e15');
  g.fillStyle = gr; g.beginPath(); g.moveTo(-3.6, top); g.lineTo(-3.6, bottom - .9);
  g.ellipse(0, bottom - .9, 3.6, .95, 0, Math.PI, 0, true); g.lineTo(3.6, top); g.fill();
  const fo = facing * .85, ey = top + 3.2;
  g.fillStyle = '#1b1d22';
  for (const ex of [-1.35, 1.35]) { g.beginPath(); g.ellipse(fo + ex, ey, .5, .76, 0, 0, 2 * Math.PI); g.fill(); }
  g.strokeStyle = '#1b1d22'; g.lineWidth = .48; g.beginPath(); g.arc(fo, ey + .7, 1.5, .22 * Math.PI, .78 * Math.PI); g.stroke();
}
```

## Adapting it to your project

- **Keep fixed:** the front 3/4 view without yaw, the grid proportions (6 × 4.2 × 2.1), the gloss recipe and rim/gap lines, studs on open tops, upper-left light with lower-right sheared shadows, flat toy colours.
- **May change:** all colours (a space theme: dark grey baseplate `#3a3f45`, transparent green and red parts; a winter theme: white baseplate with light blue tiles), as long as each part stays one flat colour and the world keeps calm smooth-tile areas.
- **New props:** sketch them as layers of bricks and plates from the bottom up; stagger bricks in walls; use round 1×1 parts for posts and trunks, tiles for anything that should look finished.
- **New creatures:** a 2×3 or 3×3 body brick, printed face on the front, round bricks for eyes, plates for feet that move one stud per frame. Large ones are robots or golems stacked from bricks.
- **New figures:** reuse the molded figure: change torso print, colours and headgear (cap, helmet, hair piece), keep the cylinder head, claw hands and printed face.
- **Mixing elements:** the baseplate ground suits any bright, crisp character style with soft lower-right shadows; brick characters sit well on flat stylised grounds. Avoid mixing with painterly or noisy textures.
- **Other resolutions:** recompute K from the screen height and re-bake; keep K ≥ the screen scale.

## Performance notes

- Everything is baked in `init()`: figure 16 poses × 2 facings, ghost 7 poses (+ flipped copies), two beetle designs and the robot 7 poses × 2 mirrored grids, 11 props + shadows, ~80 loose-part sprites, 20 coin frames — a few hundred ms.
- Per frame: 1–3 `drawImage` per object; flash/tint copies cached on first use; one `setTransform` per tumbling brick. Pop-apart draws source rectangles (no clip paths), at most 8 creatures per frame.
- Ground chunks: per cell one `fillRect` + one stud `drawImage` (plus seams and edges), as a generator yielding every two rows (~20 ms per 256-unit chunk spread over frames); stud, flower and plant sprites cached per resolution; ground resolution capped at 2.5 px per unit.
- Roads cost a few extra noise samples (distance = |n| / |∇n| needs 3 samples per network), still cheap per cell.
- Measured in the same noisy conditions as the voxel module, steady frames cost about the same and chunk builds are cheaper. `starter.js` bakes its background once per size and draws a frame in about a millisecond.

## Copy-paste prompt

```text
Use the Toy Bricks art style for my project: a glossy plastic toy-brick world in Canvas 2D, no image assets.
- Grid: 1 cell = 1 stud x 1 stud x 1 plate; on screen a stud is 6 units across and 4.2 deep, a plate 2.1 units (brick = 3 plates).
  The screen shows 360 units vertically. Straight front 3/4 view, no yaw: only top and front faces, all axis-aligned rectangles.
- Models are lists of parts (brick, plate, smooth tile, round brick) stored per cell with a part id; bake them to sprites once.
  Draw rows back to front, plates bottom to top. Front faces: vertical gradient over the whole part (x1.2 rim, x1.02, x0.88, x0.7)
  + a white sheen band at 10% of its width; white rim on top edges, dark gap lines between parts, light left / dark right ends.
- A stud on every open top (cylinder gradient, lighter top, white highlight crescent upper left, soft contact shadow); tiles have none.
- Flat saturated toy colours only (red #d4231c, yellow #f7c81e, blue #1c5fc6, green #21883f, white, black, tan, greys); transparent parts
  at 0.5-0.88 alpha. No outlines, no texture, no noise. Light from the upper left, blurred shadows sheared to the lower right.
- Ground: a stud-covered green baseplate #47a347 with raised lime/grey plates (front edge visible), smooth grey road tiles #666d73
  with light curbs and white lane dashes, transparent-blue water plates one plate lower, flowers and leaf plants as small toy parts.
- Main character: a molded toy figure ~31 units tall: cylinder yellow head with a printed face, claw hands, orange torso, blue legs,
  explorer helmet; posed like a toy (rigid legs/arms rotating on pins, hop at passing, helmet lags), 8 walk poses on twos,
  4 idle fidgets + blink, crouch before a lunge, hurt pose with the helmet popping up. Creatures: a red brick beetle with round eye bricks, a translucent ghost piece,
  a big brick robot with glowing red eyes. Brick creatures move in whole studs/plates.
- Effects, layered: white plastic pop -> flying bricks that tumble and bounce -> sparkles + stud rings -> loose studs left lying;
  creatures click together plate by plate and pop apart into brick blocks (stop-motion steps). Flowers grow in beds.
- UI: brick panels with a row of studs on top and hard drop edges, bars filled with stud-covered plates, instruction-booklet cards
  (white page, black border, big step number, parts-callout box with "1x"); fonts Titan One + Fredoka.
```
