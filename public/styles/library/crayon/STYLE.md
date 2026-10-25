# Crayon Kids — Game Art Style Spec

> A child's wax-crayon drawing brought to life: toothy white paper, zigzag scribble fills that go outside the lines, wobbly boiling outlines.

Everything looks as if a six-year-old drew it with a box of wax crayons on bright white drawing paper. Shapes are **coloured in** rather than shaded: a light wax layer, then zigzag sweeps whose ends overshoot the outline or stop short of it. The wax **skips on the paper tooth**, so tiny white specks show through every stroke. Outlines are wobbly black crayon loops that **overshoot their own start**. Every drawing exists in **three hand-drawn versions** that swap seven times a second, so the whole picture **boils** like animation on paper. Proportions are naive — big round heads, stick limbs, lollipop trees, triangle-roof houses, a smiling sun in the corner — and most of the sheet stays white.

## At a glance

| | |
| --- | --- |
| Family | Hand-drawn · Wax crayon |
| Mood | cheerful, innocent, playful, handmade, sunny |
| Best for | children's and family games, cozy or comedic top-down action, educational / storybook projects, doodle-themed menus, party and casual mobile games |
| Renderer | Canvas 2D, procedural: wax lines + zigzag scribbles → paper tooth erased (destination-out) → white margin → baked sprites and cached ground chunks |
| Pixel art | No — native resolution, sprites baked at 2.5–5 px per world unit |
| Complexity | 4/10 — naive shapes forgive imprecision; the work is three boil variants per pose and keeping outlines strong |
| Fonts | Gochi Hand, Patrick Hand, Caveat Brush, Schoolbell (Google Fonts) |
| Key colours | paper `#fbf8ef`, black crayon `#2b2a30`, red `#e2362c`, orange `#f78b1f`, yellow `#fdce28`, grass `#42ae3a`, sky blue `#42a8ea`, blue `#2a5ec8`, purple `#8c4cc4`, pink `#f67eb4`, brown `#94582c` |

## When to use it

- **Good fit:** children's and family games — the look is instantly friendly and reads as "made by a kid".
- **Good fit:** cozy or comedic top-down projects with many small units — black outlines plus a white margin keep figures readable even over scribbled grass.
- **Good fit:** educational, storybook and tutorial screens; level-select maps that look like a drawing on a fridge.
- **Good fit:** anything that should feel handmade without hand-drawn assets — every asset is a few polygons, so new content is cheap.
- **Bad fit:** horror, grit, realism, dark or neon moods — there is no light, no shadow mood, only sunny paper.
- **Bad fit:** precise tactical readouts and dense data UIs — the wobble and boil fight precision.
- **Bad fit:** pixel-perfect retro projects — the style relies on soft anti-aliased wax strokes.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Drawing Paper | `#fbf8ef` | Ground and the white margin around every drawing (~55 % of the screen) |
| Black Crayon | `#2b2a30` | Outlines, stick limbs, eyes, motion lines, HUD ink |
| Crayon Red | `#e2362c` | Cape, shoes, roofs, apples, the scribble-ball projectile, bar fill |
| Orange | `#f78b1f` | Sun rays, back spikes, star outlines, fish |
| Sunny Yellow | `#fdce28` | Sun, stars, belly, house walls, sticky note |
| Grass Green | `#42ae3a` | Grass patches, tree crowns, the large creature's body |
| Dark Green | `#217a38` | Grass tick tufts, pine trees, outlines of green scenery |
| Light Green | `#9ece3a` | Second grass crayon, sunlit crown scribble |
| Sky Blue | `#42a8ea` | Pond scribble, windows, small collectible, cloud outlines, ruler fill |
| Blue | `#2a5ec8` | Shirt, pond outline and waves, title digits |
| Purple | `#8c4cc4` | Small scribble monster, the dragon's wing, counter digits |
| Dark Purple | `#5c2c8c` | Tangle lines inside the scribble monster |
| Pink | `#f67eb4` | Rosy cheeks, hearts, blossoms |
| Brown | `#94582c` | Hair, trunks, doors, path edges, fence outlines |
| Tan | `#d8a262` | Dirt path, fence pickets |
| Peach | `#fcc698` | Skin |
| Grey | `#929098` | Scribbled shadows (alpha 0.1–0.3), rocks, pebbles, smoke, motion trails |
| Ghost Blue | `#a8d6f6` | The fast creature, pond base layer, cloud scribble |

**Rules**
- Only straight-from-the-box crayon colours: saturated, no pastels except ghost blue. Mixing happens only by scribbling one crayon over another (light green over green, blue over sky blue, orange over yellow).
- White paper is the dominant colour. Colour patches, ponds and paths; leave the rest white with a few doodles.
- Characters and buildings: black crayon outlines. Plants, ponds and paths: a darker crayon of their own colour (crowns `#217a38`, trunks brown mixed 40 % toward black, ponds `#2a5ec8`, paths `#94582c`).
- Every sprite gets a 0.9-unit paper-white margin, like a child colouring the background around a figure.
- No gradients, no glow. Intensity comes only from scribble density, stroke overlap and the paper tooth.

## Typography

| Font | Use | CSS |
| --- | --- | --- |
| **Gochi Hand** 400 | Counters, card titles, bar labels, caption names, floating numbers | `font: 400 40px/1 'Gochi Hand', cursive; color: #2a5ec8;` |
| **Patrick Hand** 400 | Body copy, card descriptions, hints | `font: 400 19px/1.25 'Patrick Hand', cursive; color: #57545e;` |
| **Caveat Brush** 400 | Big panel titles in rainbow crayon | `font: 400 88px/1 'Caveat Brush', cursive;` + 6-stop hard rainbow `background-clip: text` |
| **Schoolbell** 400 | Small family / category labels | `font: 400 14px/1.2 'Schoolbell', cursive; color: #217a38;` |

- Everything is handwriting. No uppercase tracking, no bold weights — a child presses harder, they don't switch fonts.
- Large text (titles, the title digits, bar fills) is masked with a noise SVG (`feTurbulence` fractal noise, alpha = 7.2 − 11·R) so it looks waxy and speckled.
- Floating numbers: Gochi Hand at 10 units (14 for emphasis), black crayon (red for emphasis, with an orange zigzag underline), a paper-coloured 0.32 em halo, tooth at 0.55, tilted ±10°, popping from 0.6× to 1.1× then 1×.
- Titles are rotated −2° to −2.5°; cards ±0.8–2°. Nothing is perfectly level.

## Rendering technique

The whole look comes from four drawing helpers and one compositing trick.

1. **Wax line** — resample a polyline every 0.7 units, push each point along the normal by a low-frequency wobble (`amp · (0.65·sin(s·f1+φ1) + 0.35·sin(s·f2+φ2))`, amp 0.2 units, f1 0.16–0.3, f2 0.55–1.0, plus 15 % jitter). Stroke in **pressure runs** of 4–9 points (width × 0.86–1.08, alpha 0.8–1), then a second pass offset by up to 0.32 widths at 0.55× width, alpha 0.5. **Closed loops** start at a random vertex, go round once and continue 7–20 % further while drifting outward by 0.3–0.9 widths — the overshoot of a real hand.
2. **Zigzag scribble** — pick an angle, step across the shape in scan lines `sp × 0.75–1.25` apart, find the shape's extent on each line, and alternately take its left and right end; connecting them gives diagonal sweeps. Each end moves outward by `over × (−0.4…1)`: it overshoots the outline or stops short. Sweeps are drawn as slightly bowed quadratic curves in runs of 2–5 with varying alpha and width.
3. **Cell scribble** (large areas) — a real child colours a big area in short patches. Tile the shape with jittered, overlapping squares (30 units, step 0.78×), and scribble shape ∩ square in each with its own angle (base ±0.4). Overlaps get darker; edges look spiky.
4. **Coloured-in shape** = flat wax layer (alpha 0.4) + zigzag scribble (alpha 0.85) + wax outline.
5. **Paper tooth** — a 160 px tileable alpha map (three periodic Perlin octaves stretched 1.6:1, plus per-pixel noise, thresholded `clamp((v − 0.1)/0.26)·235`) is filled over each finished drawing with `destination-out`. About a quarter of the wax disappears in clustered specks.
6. **White margin** — copy the sprite, `source-in` fill it with paper colour, draw it 18 times on a 0.9-unit circle (plus centre) under the sprite.

**Baked at init:** 2 idle + 4 walk + 1 dash poses of the main character, 4 frames × 3 creatures, ~17 prop variants, all particles, shadows, icons — each in three boil variants (variant 0 immediately, 1–2 lazily) and mirrored for facing left. **Per frame:** only `drawImage` blits, rotated blits for particles and orbiting crayons. **Draw order:** ground chunks → fading scribble marks → collectibles → shadows → props and actors sorted by y → orbiting crayons → projectiles → particles → numbers → screen overlay (edge darkening, tape, clouds, sun). Sprite resolution `K = clamp(round(h/360 · 1.5 · 4)/4, 2.5, 5)` px per unit; blits are snapped to device pixels.

## World and ground

One endless sheet of drawing paper; the screen shows 360 world units of height.

- **Paper:** a 256 px tile of `#fbf8ef` with faint mottling (±3 levels), fine grain, rare dark specks and 26 short brown fibres at alpha 0.13. It is drawn **last**, underneath everything, with `destination-over`, after the tooth has been erased out of the crayon layer.
- **Grass patches:** one per 270-unit cell (70 %), radius 55–118 units, a lumpy ellipse `r(θ) = R·(1 + a1·sin 3θ + a2·sin 5θ)` stretched 0.8–1.3 and rotated. Light wax layer `#42ae3a` at 0.12, cell scribble (spacing 2.5, width 2.7, overshoot up to 3.4 units), a second crayon (light green or green) on an offset sub-area at 0.5, dark green three-blade tick tufts (~1 per 360 sq units) and single blades sticking out of the edge.
- **Ponds:** one per 560-unit cell (66 %), radius 42–78, never on a path. A white margin is erased into whatever is below, then ghost-blue wax 0.4, sky-blue cell scribble, a darker blue scribble low in the middle, a 1.5-unit blue outline that overshoots, 3–5 little wave arcs, sometimes a lily pad with a pink flower or an orange fish.
- **Dirt paths:** a horizontal path every 760 units and a vertical one every 1100, each wobbling with two sines (amplitude ~46+18 units). 21 units wide: band erased, tan wax at 0.24, lengthwise tan strokes 2.6–3.4 wide (the way a child colours a road), short brown dirt dashes, two wobbly brown edges 1.3 wide, grey outlined pebbles.
- **Doodles:** on a 40-unit jittered grid — grass tufts (16 %), five-dot flowers (5.5 %), pebble pairs, butterflies, and rare stars, hearts, spirals. Inside grass only flowers.
- **Seamless chunks:** everything is generated per world cell / path segment with a seed from its index; each chunk draws every item that touches it and the tooth pattern is aligned to world pixels, so chunk borders are invisible.

## Characters

All figures are drawn facing right with the feet at (0, 0), then mirrored.

**Main character — a kid in a red cape** (~30 units tall, ~20 wide with cape):
- Head: lumpy circle r 7.1 × 6.8 at y −22, peach `#fcc698` wax layer 0.6 + scribble 0.75, black outline 0.95.
- Hair: brown spiky cap — 8 spikes at r 8.5 ± 0.7 between base points at r 6.9, closed by a zigzag fringe over the forehead; brown scribble, black outline 0.75.
- Face (shifted 1.6 units toward the facing side): two black oval eyes 0.8 × 1.1 with a white 0.28 highlight, a thin smile arc (0.6 width), pink scribbled cheeks.
- Shirt: trapezoid from shoulders ±3.4 at y −15.5 to hem ±4.6 at −6.4, blue scribble, a yellow five-point star with an orange outline on the chest.
- Cape: red, behind everything, from the shoulders to a fluttering hem at the back (tip at x −12). On dash it streams out flat behind.
- Limbs: black crayon lines 1.1–1.25 wide; round peach hands r 1.2–1.3 with black outline; red oval shoes.
- Poses: idle 2 frames (0.6 bob, arms out), walk 4 frames (1.3 bounce, legs ±3 units, cape tip ±1.3), dash 1 (fist punched forward, cape flat).

**Small creature — scribble monster** (~20 × 20): a lumpy purple ball r 8 at y −11, purple wax 0.5 + scribble 0.9, a random looping dark-purple "tangle" line inside, a black fuzzy outline plus a loose second loop in dark purple (wobble 0.35–0.5). Big white googly eyes (r 2.4 and 1.9) with black outlines and pupils looking forward, an open dark mouth with three white triangle teeth, a little zigzag hair tuft, stick arms raised with three-finger tips, stick legs.

**Fast creature — ghost** (~22 × 20): a round head r 6.4 flowing into a body whose lower edge is a **zigzag tail** sweeping back to a point at x −12. Ghost-blue wax 0.55 + scribble 0.9, a faint white scribble highlight, black outline 0.95. Two black oval eyes, a dark "oo" mouth, a pink cheek, two outlined mitten arms reaching forward. It floats 2.4 units above its shadow and bobs.

**Large creature — scribble dragon** (~58 × 48): green body ellipse 13.6 × 10.6, yellow belly with four orange plate arcs, three orange back spikes, a green tail with yellow spikes and an orange arrow tip, a purple scalloped wing on the back with two black spars, two stubby legs (the far one darker) with black claw ticks, a neck to a big head with yellow horns, black nostrils, a white eye with black pupil and angry brow, three white teeth, a pink cheek, and a grey smoke curl from the nose on every other frame. Black outlines 1.0–1.25.

**States:** hit = white tint overlay up to 0.85 alpha plus a ±1.2-unit sideways jitter; hurt main character = red tint overlay and blinking; spawn = revealed top to bottom with a crayon tip scribbling along the edge; removal = crossed out with black scribble in three steps, then shrink to 50 % and fade.

## Props

| Prop | Size (units) | Construction |
| --- | --- | --- |
| Lollipop tree | 32 × 48 | Brown trunk (vertical scribble, darker outline, one branch stroke), scalloped green crown r 14 with dark green outline, lighter sub-scribble; variants plain, red apples, pink five-dot blossoms |
| Pine | 24 × 42 | Three stacked dark-green triangles, short trunk, little yellow star on top |
| House | 43 × 58 | Yellow / pink / sky-blue walls 34 × 25, red triangle roof to 43 up, brown door with yellow knob, two sky-blue cross windows, round attic window, red chimney with three grey outlined smoke puffs; black outlines |
| Flowers | 16 × 14 | Three stems with leaves, six-petal outlined heads (red/yellow/pink or purple/orange/sky) with yellow centres |
| Sunflower | 14 × 30 | Tall dark-green stem, two leaves, 11-point yellow petal star with orange outline, brown seeded centre |
| Bush | 24 × 16 | Scalloped green puff with red or purple berries |
| Rock | 11–15 × 8 | Grey lumpy blob with a crack, optional pebble |
| Fence | 40 × 16 | Five tan pickets with pointed tops and brown outlines, two brown rails drawn over them |
| Rainbow | 45 × 24 | Six concentric 2.7-wide wax arcs (red → purple) standing on two white clouds with sky-blue outlines |

Every prop stands on 2–7 green tick tufts (a child's ground line) and a light grey scribble shadow, has the white margin and boils with three variants. Houses line the horizontal paths; trees, pines, bushes and flowers gather on grass; open paper gets only sparse rocks, flowers, bushes and the odd rainbow.

## Effects and particles

All effects are little crayon drawings, baked once, blitted with rotation and scale.

- **Projectile:** a tight red scribble ball (r 3.6) spinning, three short motion lines trailing behind.
- **Collectibles:** small — a sky-blue kid diamond with facet lines and a white dot; large — a yellow star with an orange outline and a tiny smile, rocking ±0.15 rad. Both bob 0.8 units and pop in at 1.6×.
- **Orbiting objects:** wax crayons (16 × 4.4 units: coloured body, light paper wrapper with a black zigzag, pointed tip) flying tangentially, two grey motion lines behind.
- **Impact:** a small zigzag lightning stroke (yellow, orange or sky blue) plus two wax crumbs in the creature's colours that hop and fall.
- **Burst:** a 9-spike yellow "pow" star with red outline and orange centre popping 0.5 → 1.1×, 3–6 stars and hearts flying out, 4–12 crumbs, four red zigzags around the large creature, and a fading scribble mark on the paper for 2.6 s.
- **Collect:** a small star or a pink scribbled heart floating up.
- **Glow-up:** a double yellow/orange scribbled ring expanding, eight stars and hearts flying out, five stars circling the character.
- **Dash:** three black motion lines, a faint after-image, grey-outlined cloud puffs on the ground.
- **Hurt:** three red zigzags above the head and red/black crumbs.

## Atmosphere and lighting

- **No lighting.** Flat daylight; colours never change with position.
- **Shadows:** light grey zigzag scribbles in flattened ellipses (wax 0.1 + scribble 0.3) — 7 × 2.4 under the main character, 17 × 4.6 under the dragon, 20 × 3.4 under houses.
- **The sun:** a crayon sun with a face 34 units in from the top-right corner (radius 23, 12 rays alternating long yellow / short orange, some bent), swaying ±0.06 rad and boiling.
- **Clouds:** two scalloped white clouds with pale-blue scribble and sky-blue outlines drifting along the top edge.
- **Tape:** two beige masking-tape strips with torn zigzag ends taped diagonally into the top-left and bottom-right corners — the drawing is stuck to the table.
- **Edge darkening:** 7 % of the screen height on every side, `rgba(150,120,70,0.13)` → 0. No vignette, no grading, no fog.

## UI

Stationery taped onto the drawing:

- **Panels** are white paper scraps `#fffdf6` with a soft drop shadow, rotated 1–1.5°, with a strip of masking tape (beige, torn zigzag ends via `clip-path`) on top.
- **The long bar** is a wooden ruler (yellow gradient, brown border, tick marks every 12 px, long ticks every 60) with a sky-blue diagonal-stripe crayon stroke as its fill and a zigzag right end.
- **The short bar** is white with a thick black crayon border (irregular `border-radius`) and a red diagonal-stripe scribble fill with a zigzag end, masked waxy.
- **The title** sits on a yellow sticky note with tape; digits in blue Gochi Hand, the label in red Patrick Hand.
- **The counter** is a paper scrap with tape at a corner; the number in purple with a zigzag underline.
- **Cards** are white sheets with a 3 px crayon border (red, blue, green per card), a faint second border, tape at the top, rotations −2°, 1.4°, −0.8°; hover straightens and lifts them. Numbers sit in hand-drawn circles.
- **Panel title** in Caveat Brush 88 px in hard rainbow stripes with an orange zigzag underline. Backdrop: a pale paper wash.
- **Icons** are crayon drawings in a 100-unit box (heart, scribble monster, pow star, scribble balls, crayon box, bouncing ball, orbiting crayons, sneaker, horseshoe magnet, bandage on a heart) with the tooth at 0.75.

## Motion and animation

- **Boil** is the signature: three variants of every drawing swap **together** 7 times a second. The ground is static.
- Walk 4 frames (main character ~1.25 frames per stride unit), idle 2 frames at 2 fps, dash a single pose.
- Small creature: bounce 1.4 units, arms waving; fast creature: floats with ±1.4 bob, zigzag tail waves; large creature: 1.6-unit stomp, wing flaps ±2.2.
- Spawn reveal 0.45 s top to bottom; removal crossed out over the first 36 % of 0.35 s, then shrink and fade.
- Particles pop in quickly and fade over their last 35–40 %; crumbs hop with gravity and bounce once.

## Do and don't

**Do**
- Let scribbles overshoot and fall short of the outline.
- Keep black wobbly outlines on everything that moves and on buildings.
- Leave lots of white paper.
- Bake three variants of every drawing and swap them in sync at ~7 fps.
- Erase a paper tooth out of every crayon mark.
- Use naive kid shapes: big heads, stick limbs, lollipop trees, triangle roofs, a sun with a face.
- Leave a white margin around figures on coloured ground.

**Don't**
- Use smooth vector fills, gradients, glows or airbrush shading.
- Draw perfectly closed or ruler-straight lines (the UI ruler is the one exception).
- Fill a large area with one long continuous hatch — colour it in short patches.
- Use muted or pastel palettes.
- Add realistic perspective, anatomy or light.
- Boil the ground, or boil objects out of sync.
- Drop outlines on characters — they vanish into the scribbles.

## Implementation recipe

1. Build the tooth alpha map (160 px, tileable) and the paper tile (256 px).
2. Write `wax(ctx, pts, {w, c, closed})`, `scribble(ctx, pts, {ang, sp, over, cell})` and `shape(ctx, pts, fill, line)`.
3. Write a `bake(bounds, draw)` that draws in world units at K px/unit, erases the tooth, adds the white margin and returns `{canvas, anchor}`.
4. Draw every character, creature and prop as functions of `(ctx, rng, frame)`; bake each pose with three seeds; mirror for facing left.
5. Ground chunks: grass patches → ponds (erase margin first) → paths (erase band first) → doodles → erase tooth (world-aligned) → paper underneath with `destination-over`.
6. Per frame: `variant = floor(time · 7) % 3`, blit everything with that variant; scribbled shadow first, sort by y.
7. Effects: bake pow, zigzag, star, heart, crumb, ring, puff and motion-line sprites; spawn them from impact, burst, collect and dash events.
8. Screen overlay per screen size: edge darkening + tape; per frame two clouds and the sun (three variants each).
9. HUD: paper scraps with tape, ruler bar, crayon-bordered cards, handwritten fonts, waxy noise mask on fills and titles.

## Code

Wax line with pressure runs and an overshooting closed loop:

```js
function waxLine(ctx, pts, rnd, { w = 1, color = '#2b2a30', closed = false, amp = 0.2 } = {}) {
  let src = pts;
  if (closed) {
    const n = pts.length, i0 = Math.floor(rnd() * n), extra = Math.max(2, Math.round(n * (0.07 + rnd() * 0.13)));
    src = [];
    for (let i = 0; i <= n + extra; i++) src.push(pts[(i0 + i) % n]);
  }
  const P = [];
  for (let i = 1; i < src.length; i++) {
    const [ax, ay] = src[i - 1], [bx, by] = src[i], k = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / 0.7));
    for (let j = 0; j < k; j++) P.push([ax + (bx - ax) * j / k, ay + (by - ay) * j / k]);
  }
  const f = 0.16 + rnd() * 0.14, ph = rnd() * 6.28;
  let s = 0;
  const Q = P.map((p, i) => {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    if (i) s += Math.hypot(p[0] - P[i - 1][0], p[1] - P[i - 1][1]);
    const off = amp * Math.sin(s * f + ph) + (rnd() - 0.5) * amp * 0.3;
    return [p[0] + (a[1] - b[1]) / l * off, p[1] + (b[0] - a[0]) / l * off];
  });
  ctx.lineCap = ctx.lineJoin = 'round';
  for (let i = 0; i < Q.length - 1;) {
    const e = Math.min(Q.length - 1, i + 4 + Math.floor(rnd() * 6));
    ctx.beginPath(); ctx.moveTo(...Q[i]);
    for (let k = i + 1; k <= e; k++) ctx.lineTo(...Q[k]);
    ctx.lineWidth = w * (0.86 + rnd() * 0.22);
    ctx.globalAlpha = 0.8 + rnd() * 0.2;
    ctx.strokeStyle = color; ctx.stroke();
    i = e;
  }
  ctx.globalAlpha = 1;
}
```

Zigzag scribble that goes outside the lines:

```js
function scribbleFill(ctx, poly, rnd, { angle = -0.55, spacing = 1, width = 1.05, over = 0.6, color = '#42ae3a' } = {}) {
  const dx = Math.cos(angle), dy = Math.sin(angle), nx = -dy, ny = dx;
  const proj = poly.map(([x, y]) => x * nx + y * ny);
  const zig = [];
  let side = 0;
  for (let off = Math.min(...proj) + spacing * 0.3; off < Math.max(...proj); off += spacing * (0.75 + rnd() * 0.5)) {
    let t0 = Infinity, t1 = -Infinity;
    for (let i = 0; i < poly.length; i++) {
      const A = poly[i], B = poly[(i + 1) % poly.length];
      const va = A[0] * nx + A[1] * ny - off, vb = B[0] * nx + B[1] * ny - off;
      if ((va < 0) === (vb < 0)) continue;
      const t = va / (va - vb), s = (A[0] + (B[0] - A[0]) * t) * dx + (A[1] + (B[1] - A[1]) * t) * dy;
      t0 = Math.min(t0, s); t1 = Math.max(t1, s);
    }
    if (t0 > t1) continue;
    const ext = over * (rnd() * 1.4 - 0.4);           // overshoot – or stop short
    const s = side ? t1 + ext : t0 - ext;
    zig.push([dx * s + nx * off, dy * s + ny * off]);
    side ^= 1;
  }
  ctx.beginPath();
  zig.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.lineWidth = width; ctx.strokeStyle = color; ctx.globalAlpha = 0.85; ctx.stroke(); ctx.globalAlpha = 1;
}
```

Paper tooth + white margin when baking a sprite:

```js
function finishSprite(spriteCanvas, toothCanvas, unitPx, paper = '#fbf8ef') {
  const w = spriteCanvas.width, h = spriteCanvas.height, c = spriteCanvas.getContext('2d');
  c.save();
  c.globalCompositeOperation = 'destination-out';        // the wax skips the paper valleys
  c.fillStyle = c.createPattern(toothCanvas, 'repeat');
  c.fillRect(0, 0, w, h);
  c.restore();
  const mask = Object.assign(document.createElement('canvas'), { width: w, height: h }), m = mask.getContext('2d');
  m.drawImage(spriteCanvas, 0, 0);
  m.globalCompositeOperation = 'source-in';
  m.fillStyle = paper; m.fillRect(0, 0, w, h);
  const out = Object.assign(document.createElement('canvas'), { width: w, height: h }), o = out.getContext('2d');
  const r = 0.9 * unitPx;                                // 0.9 world units of white margin
  for (let i = 0; i < 12; i++) o.drawImage(mask, Math.cos(i / 12 * 6.283) * r, Math.sin(i / 12 * 6.283) * r);
  o.drawImage(mask, 0, 0);
  o.drawImage(spriteCanvas, 0, 0);
  return out;
}
```

The boil — three variants, one global beat:

```js
const variants = [0, 1, 2].map((v) => bake(bounds, (ctx) => drawHero(ctx, seededRandom(100 + v * 31))));
function drawFrame(ctx, time) {
  const v = Math.floor(time * 7) % 3;          // same index for every drawing on screen
  ctx.drawImage(variants[v], x - anchorX, y - anchorY);
}
```

## Adapting it to your project

- **Side view:** the figures are already side-view kid drawings; add a green scribble ground band with tick tufts along the bottom and a blue sky scribble at the top.
- **Other subjects:** stay with what a child would draw — cars as a box with two circles, cats as a circle head with triangle ears, castles as a rectangle with a zigzag top. Outline in black, colour in with one or two crayons.
- **Night or seasons:** swap the paper for black paper and use the same crayons (they look brighter); or add snow as white-margin blobs and orange-brown leaves. Keep the tooth.
- **Bigger sprites:** raise K and keep line widths in world units; increase scribble spacing a little so it still looks like crayon, not a pen.
- **Calmer boil:** drop to 2 variants or 4–5 fps for menus; never go above ~8 fps.
- **UI:** reuse the paper-scrap + tape pattern for every panel; a ruler for progress, a crayon box for inventories.

## Performance notes

- Everything is baked once: variant 0 of every pose in init (~580 ms on a desktop), variants 1–2 lazily inside the ground-chunk generator and in a 1.5 ms per-frame budget — the scene boils fully within the first seconds.
- Per frame only blits: about 1–2 ms for a dense scene with 60+ actors at 1600 × 900.
- Ground chunks (256 units, up to 640 × 640 px) are built in a generator that yields after every patch, pond and path: 10–20 ms each, spread over frames. Use Path2D batches keyed by colour/alpha/width for tufts and scribbles.
- The tooth and paper are patterns — two full-chunk fills, no per-pixel work at runtime.
- Screen overlay strips (edge darkening + tape) are baked per screen size; the sun and clouds are three small sprites each.

## Copy-paste prompt

```text
Use the "Crayon Kids" art style for my project: a child's wax-crayon drawing brought to life.
- Background: bright, slightly toothy white drawing paper #fbf8ef; most of it stays white.
- Colour areas like a child: a light wax layer plus zigzag scribbles whose ends overshoot or stop short of the outline;
  big areas are coloured in short back-and-forth patches with slightly different angles.
- Erase a tileable paper-tooth noise out of every crayon mark so white specks show through the wax.
- Outlines: wobbly black crayon (#2b2a30, ~1 unit wide) drawn in pressure runs; closed loops overshoot their start.
- Naive proportions: big round heads, stick limbs, dot eyes, rosy cheeks; lollipop trees, triangle-roof houses,
  scribbled grass patches, a blue scribble pond with an outline, a brown dirt path, a smiling sun in a corner.
- Crayon-box palette: red #e2362c, orange #f78b1f, yellow #fdce28, green #42ae3a, sky blue #42a8ea, blue #2a5ec8,
  purple #8c4cc4, pink #f67eb4, brown #94582c, black. No gradients, no glow.
- Leave a 0.9-unit paper-white margin around every figure.
- Bake three variants of every drawing and swap them together at 7 fps so the whole picture boils.
- Effects are crayon doodles: spiky pow stars, zigzags, hearts, little stars, motion lines, cloud puffs.
- UI: paper scraps with masking tape, a wooden ruler as a bar, crayon-bordered cards, handwritten fonts
  (Gochi Hand, Patrick Hand, Caveat Brush for rainbow titles).
```
