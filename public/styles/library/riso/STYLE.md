# Risograph Print — Game Art Style Spec

> A three-ink risograph zine: fluorescent pink, blue and yellow overprinting on recycled paper, out of register, with halftones and drum grain.

Everything is printed with only three fluorescent soy inks – pink `#ff48b0`, medium blue `#0078bf` and yellow `#ffe800` – on off-white recycled paper `#f3ede0`. There is no black plate and no outline anywhere: shapes are flat ink layers that multiply where they overlap (pink over blue turns violet, pink over yellow red-orange, blue over yellow green), and every plate sits a few pixels out of register, so edges show slivers of single inks and bare paper. Tones are coarse round halftone dots – each ink on its own screen angle – or random grain stipple, and a drum texture of clumps, streaks, missing-ink specks and soft banding runs through every layer. The UI is a zine page with crop marks, registration targets, a colour bar, stamped labels and offset ink blocks.

## At a glance

| | |
| --- | --- |
| Family | Print · Risograph |
| Mood | playful, punchy, handmade, sunny, indie |
| Best for | colourful top-down action and arcade games, zine/poster-identity indie games, music and festival projects, party and puzzle games |
| Renderer | Canvas 2D, procedural; three ink plates per sprite, multiplicative bake, cached sprites and ground chunks |
| Pixel art | No – native resolution, ground scaled nearest-neighbour so dots stay crisp |
| Complexity | 5/10 |
| Fonts | Rubik Mono One, Space Grotesk, DM Mono (Google Fonts) |
| Key colours | `#f3ede0` paper · `#ff48b0` pink · `#0078bf` blue · `#ffe800` yellow · overprints `#312d7f` violet, `#f3480d` red-orange, `#317d0e` green |

## When to use it

Use it when a project should feel printed, handmade and loud in a friendly way: arcade and top-down action with a lot of colour, indie games whose identity is a zine, poster or record sleeve, music and festival projects, party games, title cards and promo art. The limited palette gives instant brand recognition and makes every screen look like a deliberate print.

Avoid it for horror and gritty moods, for night scenes that need deep blacks (the darkest colour is a violet overprint), for photorealistic or painterly looks, and for UI-heavy simulations that rely on many neutral greys.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Recycled Paper | `#f3ede0` | Base of everything (~45 % of the screen): ground, page margin, UI panels, knocked-out eyes and highlights |
| Fluorescent Pink | `#ff48b0` | Ink 1 – density 0.93, screen angle 15° |
| Medium Blue | `#0078bf` | Ink 2 – density 0.80, screen angle 75° |
| Sunflower Yellow | `#ffe800` | Ink 3 – density 0.92, screen angle 45° |
| Pink on paper | `#f34f9f` | What a solid pink layer prints as |
| Blue on paper | `#3189b3` | What a solid blue layer prints as |
| Yellow on paper | `#f3d912` | What a solid yellow layer prints as |
| Violet overprint | `#312d7f` | Pink × blue: trousers, pupils, hair, back limbs – the darkest common colour |
| Red-orange overprint | `#f3480d` | Pink × yellow: beanie cuff, shoes, skateboard, pellet cores |
| Green overprint | `#317d0e` | Blue × yellow: tree crowns, leaves, lily pads, meadow dots |
| Three-ink near black | `#312a0a` | All three inks: tiny accents only (a mouth) |
| Pink tint 25 % | `#f3c5d0` | Blossom fields (pink halftone, tone 0.25) |
| Meadow tint | `#dedda5` | Meadow fields (yellow 0.27 + blue 0.11 halftones) |
| Path tint | `#f3e481` | Paths (yellow halftone 0.46) |

Palette rules:

- Only three inks exist. Every other colour is a product of them on paper: `paper × Π (1 − coverage × density × (1 − ink/255))` per channel. Never mix a new hex value by hand.
- Overprints multiply: pink × blue = violet `#312d7f`, pink × yellow = red-orange `#f3480d`, blue × yellow = green `#317d0e`, all three = near black `#312a0a`.
- No black, no grey. White is paper: highlights, eyes and teeth are knockouts.
- The ground stays in light tints (tone 0.1–0.5) so solid-ink characters always sit on top. Solid ground ink only for ponds and small decals.
- Each plate keeps one misregistration offset everywhere: pink (+0.72, −0.46), blue (−0.60, +0.48), yellow (+0.30, +0.66) world units on sprites; ×1.35 on the ground.

## Typography

| Family | Weights | Role | Sample CSS |
| --- | --- | --- | --- |
| Rubik Mono One | 400 | Titles, title panel, counters, bar labels, floating numbers | `font: 400 34px/1 'Rubik Mono One'; color: #0078bf; text-shadow: 3px 2px 0 rgba(255,72,176,.88);` |
| Space Grotesk | 400, 500, 700 | Card titles, general sans text | `font: 700 22px/1.12 'Space Grotesk'; letter-spacing: -.01em; color: #0078bf;` |
| DM Mono | 400, 500 | Small print: captions, labels, body copy, hints | `font: 500 11px/1.2 'DM Mono'; letter-spacing: .34em; text-transform: uppercase;` |

Type is printed, not glowing: headline type is blue with a pink copy offset 2–5 px down-right (the pink plate slipped). Small print is letter-spaced uppercase DM Mono in a single ink. Floating numbers in the world are Rubik Mono One baked as two plates – pink offset (+0.55, +0.35) units under blue, overprinting violet where they meet; emphasised numbers are paper digits knocked out of a blue starburst, overprinted with yellow and a misregistered pink copy.

## Rendering technique

The core is a **plate press**. Every sprite is drawn into one offscreen *mask canvas* that starts opaque black; its **red channel is the pink plate, green the blue plate, blue the yellow plate**.

- Adding ink: draw the shape in `#ff0000` / `#00ff00` / `#0000ff` with `globalCompositeOperation = 'lighter'`.
- Knocking ink out of one plate: draw the shape in `#00ffff` / `#ff00ff` / `#ffff00` with `'multiply'` (it zeroes only that channel). A solid fill knocks the other inks out underneath it by default – like layering paint; `knock: false` overprints instead.
- Every plate is drawn with its own translation (the misregistration), so knockouts are misregistered too – exactly the slivers of paper and single ink a real riso print has.
- A second canvas collects the *paper mask*: the union of all shapes plus explicit holes (eyes) that stay paper.
- Halftone tones are real dots on a rotated grid per ink: `r = pitch × 0.707 × √tone`, pitch 1.3 units on sprites, 2.6 on the ground, clipped to the shape. Grain stipple places random dots (0.5-unit cells, radius 0.3) with probability = tone.

The **bake** reads both canvases once and writes, per pixel: `a_i = mask_i × density_i × grain_i`, `colour = paper × Π_i (1 − a_i × (1 − ink_i))`, `alpha = max(paper mask, masks)`. It produces up to five canvases per sprite: the *print* (on paper, drawn opaque), the *multiply layer* (ink only, white = no change), a yellow *pop* copy, and the three *single plates* (ink colour with alpha = coverage).

Drawing rules:

- Characters are knocked out of the world: their paper print is drawn `source-over`, so they read on any ground.
- Props, shadows, collectibles, projectiles, orbiting objects and particles overprint the world: multiply layer with `globalCompositeOperation = 'multiply'`. (If the world underneath is dark – mixed with another style – they fall back to opaque printing.)
- The ground is shaded per pixel in 256-unit chunks: noise fields decide regions, each plate samples them at its own offset, adds AM dots or FM grain, merges decal masks, then applies grain, density mottling and banding.
- Draw order: ground chunks → ground overlay (registration targets of appearing creatures) → collectibles → y-sorted props, shadows and actors → orbiting objects → projectiles → particles → numbers → page frame.
- Sprites are baked at `K = clamp(round(screenHeight × dpr / 360 × 1.6), 3, 8)` px per unit; mirrored by a negative x scale at draw time.

## World and ground

A risograph print of a park seen from above, bottom to top:

1. **Paper** `#f3ede0` with 2 % random grain and rare darker fibre flecks.
2. **Tint clouds** on bare paper: AM halftone fades on the pink screen (15°, up to tone 0.30) and the yellow screen (45°, up to 0.26), each following its own slow noise (scale ~400 units). The dots grow toward the cloud core – `tone = ((cloud − 0.3) × 1.43)² × max` – so every cloud has a printed gradient edge, and where pink and yellow overlap the rosette prints orange. No FM speckle on open paper: the calm paper is part of the composition.
3. **Meadow fields** – hand-cut blobs (fbm at 1/560, threshold 0.6, domain-warped by 90 units): yellow halftone 0.27 at 45° plus blue halftone 0.11 at 75°, which rosette into green, plus a faint blue stipple (up to 3.5 %).
4. **Blossom fields** (fbm 1/520, threshold 0.63): pink halftone 0.25 with a light yellow stipple (up to 12 %).
5. **Paths** – a ridge of low-frequency noise, ~40 units wide: yellow halftone 0.46 with a 2 % pink speckle. Paths knock out the fields below them.
6. **Ponds** (fbm 1/430, threshold 0.66): solid blue with dashed wavy paper lines (rows 7.5 units apart, dashes 55 % of 23 units, warped ±13), and a blue halftone shore fading from tone 0.5 to 0 over 9 units outside the water.
7. **Decals** printed as extra ink on the plates on a ~13-unit grid, but **only in clumps** (`keep = smoothstep(0.48, 0.7, noise(x/120))`, probability ÷ `0.08 + 1.2·keep`) and as a drift of blue grass ticks along every region edge: blue grass ticks and tufts, five-dot flowers (pink or yellow petals with an overprinted centre), tiny confetti triangles, pink pebbles on paths, yellow lily pads on ponds (they print green) with the odd pink flower.

Every region edge is three edges: each plate samples the region fields shifted by its misregistration (`field − gradient · offset`), so a pond has a blue outline offset from the shore halftone and a path's yellow edge does not quite meet the meadow's blue dots. Drum grain (per-ink offsets into a 256 × 256 tile), density mottling (±12 % over ~120 units) and horizontal banding (±5 %) run over everything.

## Characters

All characters are a few bold shapes, no outline, a dark overprint somewhere for contrast, paper-knockout eyes. They are baked onto their own paper so they stay readable over any ground.

**Main character (~19 × 34 units including the bobble)** – a kid seen from the side, facing right:

- Yellow beanie dome (with a pink grain gradient on the far side), a red-orange cuff band (pink + yellow) and a pink bobble 8 units above the head centre.
- Face: a 6.5-unit circle of fine pink (0.34) + yellow (0.30) halftone at pitch 0.78 – a peach tint – with violet hair behind, a pink-tinted ear, two violet oval eyes, a solid pink cheek and a thin blue smile.
- Blue hoodie body with a hood bump behind the head, shaded with a pink halftone gradient (violet dots, tone 0.62 → 0 towards the front), a pink halftone pocket and a yellow star badge.
- Arms are blue capsules (r 1.4); the back arm is blue + pink (violet). Hands: yellow with pink halftone.
- Legs: violet capsules; the back leg adds yellow (three-ink, darkest). Shoes: red-orange ellipses 5 × 2.7.
- **Pose table** `kp({ bf, ff, ba, fa, b, hd, pom, lean })`: back / front foot (y < 0 = lifted), arm angles, body bob, head lag, pompom lag, lean. The upper body is printed through `Press.at(0, −8.2, lean, 0, bob)` – bobbing and leaning around the hip point – and the head adds its lag. Knees are solved like a two-bone limb: when hip and ankle come closer than the leg length 7.9, the knee moves forward by `√((L/2)² − (d/2)²)` and the leg prints as two capsules.
- **Poses**: 8 computed walk poses (`ph = i/8·2π`, foot x = `0.3 + 4.1·cos p`, lifted `2.4·sin p` on the swing, arms `±0.95·cos ph`, bob `0.9·sin 2ph`, head `0.45·sin(2ph − 0.9)`, pompom `sin(2ph − 1.8)`, lean 0.06), 3 breathing poses, a crouch (bob 2.1, arms back – the anticipation before the dash), a recoil (lean −0.22, arms flung up) and the skateboard pose: crouched on a red-orange deck (20 units long, blue wheels with paper hubs), torso leaning 0.24 rad forward.

**Small creature (~26 × 18 with arms)** – a gumdrop blob on two violet feet with two stubby arms in the body ink that swing against the steps; 6 waddle poses with the squash baked in (squash 0.6 at contact, stretched on the passing pose) and the bobble antenna / horns lagging 1.5 rad behind. Variant A: solid pink with a blue halftone gradient towards the lower front (violet dots) and a yellow bobble on a pink stalk. Variant B: solid blue with a yellow halftone lit side (green dots) and two pink horn triangles. Paper eyes (4.4 × 5.2) with violet pupils, a paper grin.

**Fast creature (~20 × 20, floating 4 units up)** – a scribbled ghost: a dome head with a wavy tail streaming back. The silhouette is a pale pink halftone (0.2) and blue halftone gradient, filled with hand scribbles: blue back-and-forth strokes (0.75 wide, 1.2 apart, 0.55 rad) and sparser pink strokes at −0.95 rad, each turning inside the silhouette. Paper eyes with violet pupils, a pink "O" mouth, three blue and pink speed squiggles trailing behind. Six frames with different scribble seeds boil the fill.

**Large creature (~54 × 60)** – a geometric monster: a blue rounded triangle body (42 wide, 47 tall) with a yellow halftone lit side, an overprinted pink disc belly (r 12.6) that prints violet inside the triangle and pink outside it, one big yellow eye (r 7) with a vertical violet slit pupil and a paper glint, a three-ink mouth band with paper teeth, a pink horn, a yellow back arm and a pink front arm (overprinting), violet block legs.

Frames: main character 14 poses, small and fast creature 6, large creature 4 – each baked once with three single-ink plates and a yellow pop copy for the motion effects below.

## Props

Props overprint the ground with multiply, so their inks combine with whatever field they stand on. Each has a blue halftone shadow ellipse shifted slightly right.

| Prop | Construction | Size (units) |
| --- | --- | --- |
| Round tree | blue trunk; yellow disc r 11.6 with a blue disc r 9.2 overprinted lower right (green lens), a blue halftone gradient, five pink fruit dots | 24 × 42 |
| Blossom tree | violet trunk with a branch; pink blob crown with yellow grain highlight and blue halftone shade | 23 × 41 |
| Pine | three stacked rounded blue triangles, each with a yellow halftone lit left half (green dots), yellow star on top | 26 × 44 |
| Bush | yellow and blue circles overlapping into a green middle, a yellow halftone top, pink berries | 20 × 16 |
| Rock | blue halftone 0.42 blob deepening to solid at the lower right, pink grain highlight; or a small violet pebble with a paper highlight streak | 18 × 10 / 13 × 7 |
| House | pink walls + blue roof (or yellow walls + pink roof), halftone gradient across the wall, yellow (or blue) windows with knocked-out crosses, violet door, round attic window, chimney | 28 × 30 |
| Flowers | three blue stems, green overprint leaves, five-circle blooms in pink or yellow with an overprinted centre | 14 × 20 |
| Potted plant | four blue leaves with yellow halftone (green) and paper slits, a pink pot with a blue band | 26 × 26 |
| Lamp | blue post, yellow lamp with a violet cap and pink core, a yellow halftone glow disc r 10.5 | 21 × 42 |

Trees, pines, flowers and plants sway by a horizontal shear of ±0.02 (flowers ±0.05).

## Effects and particles

All effects print with multiply (overprint the world) and come in the three inks only.

- **Ink pellet projectile** – pink disc r 2.7 with an overprinted yellow core (red-orange), trailing three pink halftone dots (r 1.35, 0.95, 0.6), rotated to the flight direction; tiny blue halftone shadow 6 units below.
- **Collectibles** – small: yellow diamond 6.8 × 9.6 with an overprinted pink diamond. Large: pink five-point star (r 6) with a blue overprint centre and yellow halftone, tilting ±0.4 rad. Both bob 3 ± 1.2 units over a small shadow.
- **Orbiting sun stamp** – yellow disc r 5.3 with blue dot eyes, a smile and pink halftone shading; a separate ring of 10 pink zigzag rays (r 6–8.8) spinning at 1.6 rad/s; a yellow halftone glow ellipse on the ground.
- **Impact** – a registration target in pink and blue (circle + crosshair) growing from 2.5 to 7.5 units in 0.22 s while the plates drift apart; three ink dots.
- **Burst** – a 12-point starburst (r 10.5) in one ink with a radial halftone of a second ink and a paper centre, popping with overshoot; a mono-ink splat blob with droplets on the ground; a ring of 14–22 halftone dots in two misregistered inks; 6–14 triangle confetti tumbling under gravity. Scribbled ghosts also shed scribble squiggles.
- **Collect** – a yellow four-point sparkle with a pink misregistered copy; for large collectibles a small yellow-pink dot ring and four ink dots.
- **Glow-up** – a flat ring of 26 yellow and pink dots expanding to ~50 units across the ground, a blue-pink ring at body height, eight sparkles flying out.
- **Plate separation** – appearing creatures slide in as three single-ink plates (yellow, then pink, then blue) from up to 14 units away while a misregistered registration target marks the ground; vanishing creatures pop yellow, then their plates drift apart up to 13 units and fade.

## Atmosphere and lighting

There is no light, fog or glow – the atmosphere is the print:

- **Page frame**: a recycled-paper margin of 2.4 % of the screen height around the image, with flecks; crop marks at the four corners, registration targets (two circles + crosshair) at the left, right and top centre, all printed in the three inks with their misregistration; a colour bar of seven solids/overprints and five tints in the top-left margin.
- **Drum banding and ink starvation**: a soft low-resolution paper veil over the image, up to 6 % in horizontal bands plus up to 7 % towards the right edge.
- **Shadows** are blue halftone ellipses (tone 0.6 → 0) multiplied onto the ground at alpha 0.7–0.85: actors 9.4 units wide radius, large creature 21, fast creature 5.6 and paler.
- **Glow** is a yellow halftone disc (lamps, orbiting suns).
- No vignette, no blur, no grading.

## UI

The UI is a zine layout in the same three inks.

- **Panels** are paper blocks (`#f3ede0`) with an offset solid ink block behind them – `box-shadow: 5px 5px 0 rgba(0,120,191,.92)` (blue, pink or yellow) – as if one plate slipped, and crop marks 11 px outside every corner (8 one-pixel gradients in a `::before`).
- **Bars**: paper with a halftone of one ink (`radial-gradient` dots 5 px apart), the fill a solid second ink with `mix-blend-mode: multiply` (so it overprints the dots) and a 2–3 px misregistered sliver of a third ink.
- **Title** block: paper with Rubik Mono One 34 px in blue, pink shadow 3 × 2 px, a pink offset block, a blue registration target beside it, letter-spaced DM Mono caption.
- **Counter**: a yellow tag rotated 1.5° with a pink offset block, blue mono digits, a pink registration target.
- **Big title**: a yellow strip rotated −2° with 56 px blue Rubik Mono One, a 5 × 4 px pink text shadow and 9 × 8 px pink block; it "pulls" in with the pink plate far out of register and settles.
- **Cards**: paper, rotated −1.6° / 1.2° / −0.5°, each with a different offset ink block, an 84 px colour band of dots over a solid ink with `background-blend-mode: multiply` (pink dots on yellow print red-orange, blue on pink violet, yellow on blue green), the icon on a paper stamp disc with its own offset block, a round stamped number label, crop marks.
- **Icons** are baked with the same plate press in a 48-unit box (pitch 3.4, misregistration ×2) and drawn as the multiply layer; on paper panels the canvases use `mix-blend-mode: multiply`.
- **Hint / caption** strips: solid blue with paper DM Mono text, or paper with a yellow offset block.

## Motion and animation

- **Main character walk**: 8 computed poses per stride at `floor(anim × 0.4 × 8) & 7` – contact, down, passing, up for each leg, the swing knee bending, the arms counter-swinging, head (0.9 rad delay) and pompom (1.8 rad) following through. An ink fleck kicks up on every contact pose.
- **Idle**: 3 held breathing poses on an eased 2.6 s clock (`0.5 − 0.5·cos`, thresholds 0.3 / 0.75) – it lingers at both ends; shooting squash 4.5 %.
- **Dash**: the crouch pose while `dashT > 0.165` (anticipation), then the skateboard pose with two fading single-plate copies (blue, pink) 7 and 14 units behind and four pink speed streaks 12–21 units long.
- **Struck**: the recoil pose while `hurtT > 0.45`, the yellow pop and the plates kicked out of register; while invulnerable the pink and blue plates slip 2.4 units out of register every other 1/12 s (never transparency).
- **Small creature**: 6 waddle poses at `anim × 0.85 + seed` with a 1.4-unit |sin| hop and ±0.07 rad rock; **large creature**: stomp at `anim × 0.32` with 6 % contact squash and a 2.2-unit lift.
- **Fast creature**: 6 frames at 8 fps (offset by seed); it hovers `2.6 + 3.4·smoothstep(tri)` on a triangle wave with a 2.4 s period per ghost, so it lingers at the top and bottom; the scribble fill boils.
- **Hit reaction** (~0.15 s): yellow pop, a 2.6-unit knock-back shove and a 0.22 rad tilt away from the blow easing out with `flash²`, pink and blue plates kicked ~3 units out of register, settling back.
- **Appearing**: plates slide into register yellow → pink → blue over 0.45 s; **vanishing**: a yellow pop, then the plates drift apart within 0.35 s.
- Collectibles bob at 5 rad/s; sun rays spin 1.6 rad/s; trees sway with a slow 1.3 rad/s shear.
- UI: titles pull in over 0.5 s with an overshoot; cards slide in staggered by 70 ms.

## Do and don't

Do:

- Build every asset from flat shapes, each assigned to one, two or three of the three inks.
- Let overlaps multiply on purpose – the overprint colours are the palette.
- Offset each plate by its own few-pixel misregistration, consistently everywhere.
- Shade with halftone dots of a second ink at that ink's screen angle, or with grain stipple.
- Knock out eyes, teeth and highlights to bare paper.
- Run drum grain, missing-ink specks and banding through every layer, icons included.
- Frame the screen as a printed page.

Don't:

- Don't draw outlines or use black – no comic key line, no carved block.
- Don't invent colours that cannot be made from pink, blue and yellow on paper.
- Don't use smooth gradients, glows or blur – tones are dots or grain.
- Don't register the plates perfectly; that reads as flat vector art.
- Don't fill the ground with solid ink – keep it light so solid characters stay on top.
- Don't use tiny halftone screens; the dots must be visible (pitch ≥ 1.3 units on sprites).

## Implementation recipe

1. Define the inks, densities, screen angles and one misregistration offset per ink.
2. Build a 256 × 256 drum-grain tile (clumps, streaks, noise, 2.8 % specks) and a paper grain tile once.
3. Write the press: a mask canvas (opaque black, `'lighter'`), a paper canvas, `fill(inks, shape, {tone, knock})`, `hole(shape)`, `stip()`, `line()`, `scribble()`; every call draws each ink with its own offset.
4. Bake: per pixel `colour = paper × Π(1 − mask × density × grain × (1 − ink))`, alpha = paper mask; also export a multiply layer, a yellow pop copy and single-ink plates for actors.
5. Bake all characters (both directions come from a negative x scale), props, effects and icons at init.
6. Shade the ground per pixel in cached chunks: region fields at a coarse grid, per-plate shifted sampling, AM dots / FM grain per region, decal masks, grain, mottling, banding.
7. Draw characters opaque, everything else with `multiply`; spawn, death and hit effects use the single plates.
8. Finish every frame with the page margin, crop marks, registration targets, colour bar and banding veil.
9. Skin the UI with paper blocks, offset ink blocks, crop marks, halftone gradients and multiply blending.

## Code

The three-plate mask canvas and a fill with knockout and halftone:

```js
const INK = [[255, 72, 176], [0, 120, 191], [255, 232, 0]];   // pink, blue, yellow
const DENS = [0.93, 0.8, 0.92], ANG = [15, 75, 45].map((d) => d * Math.PI / 180);
const MR = [[0.72, -0.46], [-0.6, 0.48], [0.3, 0.66]];         // misregistration per plate (world units)
const ADD = ['#ff0000', '#00ff00', '#0000ff'], KILL = ['#00ffff', '#ff00ff', '#ffff00'];

function plateT(c, P, i) { const o = MR[i]; c.setTransform(P.k, 0, 0, P.k, (o[0] - P.l) * P.k, (o[1] - P.t) * P.k); }
function fill(P, inks, shape, tone, overprint) {
  const c = P.mask;                                   // opaque black canvas, R/G/B = pink/blue/yellow plate
  if (!overprint) {                                   // knock the other plates out under this shape
    c.globalCompositeOperation = 'multiply';
    for (let j = 0; j < 3; j++) if (!inks.includes(j) || tone !== undefined) {
      plateT(c, P, j); c.fillStyle = KILL[j]; c.beginPath(); shape(c); c.fill();
    }
  }
  c.globalCompositeOperation = 'lighter';
  for (const i of inks) {
    plateT(c, P, i); c.fillStyle = ADD[i];
    c.save(); c.beginPath(); shape(c); c.clip();
    if (tone === undefined) c.fillRect(-999, -999, 1999, 1999);
    else halftone(c, i, tone, 1.3);
    c.restore();
  }
}
```

Halftone dots on a rotated screen (tone can vary per dot):

```js
function halftone(c, i, tone, pitch) {
  const ca = Math.cos(ANG[i]), sa = Math.sin(ANG[i]);
  c.beginPath();
  for (let u = -60; u <= 60; u++) for (let v = -60; v <= 60; v++) {
    const x = (u * ca - v * sa) * pitch, y = (u * sa + v * ca) * pitch;
    const t = typeof tone === 'function' ? tone(x, y) : tone;
    if (t <= 0.02) continue;
    const r = pitch * 0.7071 * Math.sqrt(Math.min(1, t));   // area coverage ≈ tone, full at 1
    c.moveTo(x + r, y); c.arc(x, y, r, 0, Math.PI * 2);
  }
  c.fill();
}
```

The bake – multiplicative overprint with drum grain:

```js
function bake(maskData, paperData, w, h, k, grain, paper) {
  const out = new ImageData(w, h), d = out.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = (y * w + x) * 4;
    const m = [maskData[o] / 255, maskData[o + 1] / 255, maskData[o + 2] / 255];
    const A = Math.max(paperData[o + 3] / 255, m[0], m[1], m[2]);
    if (A < 0.004) continue;
    const f = [1, 1, 1];
    for (let i = 0; i < 3; i++) {
      if (!m[i]) continue;
      const g = grain[(((Math.floor(y * 4 / k) + i * 71) & 255) << 8) | ((Math.floor(x * 4 / k) + i * 131) & 255)];
      const a = m[i] * DENS[i] * g;                    // coverage x density x drum grain
      for (let ch = 0; ch < 3; ch++) f[ch] *= 1 - a * (1 - INK[i][ch] / 255);
    }
    d[o] = paper[0] * f[0]; d[o + 1] = paper[1] * f[1]; d[o + 2] = paper[2] * f[2]; d[o + 3] = A * 255;
  }
  return out;
}
```

Misregistered ground regions – each plate samples the region field shifted by its offset:

```js
// v = field value at the pixel, (du, dv) = field gradient per world unit (constant per 4-unit cell)
for (let i = 0; i < 3; i++) {
  const vi = v - (du * MR[i][0] * 1.35 + dv * MR[i][1] * 1.35); // field as seen by plate i
  inside[i] = vi > 0;                                           // each plate gets its own edge
}
```

Spawning creatures: the single plates slide into register.

```js
const DIR = [[-0.8, -0.75], [0.95, -0.2], [-0.1, 1]];
function drawAppearing(ctx, sprite, x, y, q) {      // q: 0 -> 1
  ctx.globalCompositeOperation = 'multiply';
  const order = [1, 2, 0], d = (1 - q) * (1 - q) * 14;
  for (let i = 0; i < 3; i++) {
    ctx.globalAlpha = Math.min(1, Math.max(0, (q - order[i] * 0.16) / 0.4));
    ctx.drawImage(sprite.plates[i], x + DIR[i][0] * d - sprite.ox, y + DIR[i][1] * d - sprite.oy);
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
```

## Adapting it to your project

- **Other ink sets**: real riso drums include teal `#00838a`, orange `#ff6c2f`, purple `#765ba7`, green `#00a95c`, red `#ff665e`. Swap one of the three and keep the multiplicative bake – the overprints update themselves. Two inks (pink + blue) give an even stronger poster look.
- **Darker moods**: use blue + purple-ish inks on a cream paper and let the three-ink overprint carry the shadows; still no black.
- **Side view / platformers**: keep the plates and halftones, make backgrounds large flat ink fields with grain gradients for the sky.
- **Bigger sprites**: raise the sprite halftone pitch with the sprite size so dots stay coarse; never drop below ~1/14 of the sprite height.
- **Performance budget**: bake fewer frames and reuse the single plates for squash, flash and appear effects; lower the ground resolution to 2 px/unit if chunks are too slow.
- **Readability**: if a creature must stand on a field of its own ink, keep it knocked out (printed on paper) and give it a violet overprint detail.

## Performance notes

- Baked once at init (K = 4 at 1080p): 5 main-character poses, 8 small-creature frames, 4 scribbled ghosts, 4 large-creature frames – each as a paper print, yellow pop copy and three single-ink plates – plus 10 props, collectibles, projectile, sun stamp, 9 splats, 3 bursts, shadow and glow, in roughly 150 ms.
- Per frame: one `drawImage` per actor (3 extra only while appearing, vanishing or flashing), `multiply` draws for props, shadows and effects, arcs for dots, rings and confetti, five draws for the frame and banding veil – about 1 ms of drawing for ~60 actors at 1600 × 900.
- Ground chunks (256 units at 2.5 px/unit, 640 × 640 px) are shaded per pixel in a generator spread across frames, ~70 ms each; a per-cell fast path skips region interpolation where a whole 4-unit cell lies inside one region. The row shader is a plain function (not a closure inside the generator) so the JIT keeps everything in registers.
- Number sprites and icons are cached by value / id.
- Avoid per-frame `getImageData` and per-frame halftone loops – the dots always come from baked canvases or the cached ground.

## Copy-paste prompt

```text
Use the Risograph Print art style for my project:
- Only three fluorescent spot inks on off-white recycled paper #f3ede0: pink #ff48b0, medium blue #0078bf, yellow #ffe800. No black, no grey, no outlines.
- Every shape is a flat ink layer; overlapping layers multiply: pink x blue = violet #312d7f, pink x yellow = red-orange #f3480d, blue x yellow = green #317d0e.
- Each ink plate is printed slightly out of register (pink up-right, blue down-left, yellow down, ~1-2 px at game scale), knockouts too.
- Tones are coarse round halftone dots (a different screen angle per ink: 15°, 75°, 45°) or random grain stipple; shading = a second ink as a halftone gradient.
- Add drum grain: ink clumps, faint streaks, missing-ink specks, soft density banding; paper with tiny fibre flecks.
- Characters: bold simple silhouettes, paper-white eyes, a violet overprint detail for contrast, printed on their own paper so they read on any ground.
- Scenery and effects overprint the ground (multiply); shadows are blue halftone ellipses, glow is a yellow halftone disc.
- Ground: light tints only – paper with pink/yellow grain clouds, green-dotted meadow fields, pink-dotted blossom fields, yellow halftone paths, solid blue ponds with paper wave marks.
- Effects: registration-target impacts, starbursts with halftone rings, ink splats, triangle confetti, plates sliding into register when things appear.
- UI as a zine page: paper blocks with offset ink blocks, crop marks, registration targets, a colour bar, stamped labels; fonts Rubik Mono One (titles, numbers), Space Grotesk (titles in cards), DM Mono (letter-spaced small print).
- Never use smooth gradients, glow, blur or perfectly registered colours.
```
