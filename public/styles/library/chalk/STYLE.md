# Chalkboard — Game Art Style Spec

> Drawn live with pastel chalk on a slate-green board: side-of-the-chalk fills, cool hatched shadows, eraser wipes and line boil on twos.

The whole world is one big blackboard drawing, and every form is built the way a real chalk drawing is built: the board is wiped clean behind the figure, the colour goes on with the *side* of the chalk as broken parallel dashes that are heavier where the light (upper left) hits, the shadow is hatched in a *cooler* chalk instead of being darkened, a warm stroke catches the light and the *tip* of the chalk draws an outline that presses harder on the shadow side. The board's tooth punches clustered holes through everything. Figures are redrawn on a 12 fps clock and hold each drawing for two or three ticks, they are sketched onto the board in one sweeping stroke when they appear and wiped off by a felt eraser in zig-zag passes when they go, leaving a dusty smear. The module's cast – a main character with a big carved orange head, a curled stem and a long mint scarf, round and tall root-bulb creatures, a hooded wisp with a streaming tail and a hunched root giant with a lit carved core – is used below as the example.

## At a glance

| | |
| --- | --- |
| Family | Traditional media · Chalk |
| Mood | playful, handmade, nostalgic, cozy-spooky, doodly |
| Best for | top-down action games, kids/educational games, cozy seasonal games, board-game adaptations |
| Renderer | Canvas 2D, procedural, no image assets |
| Pixel art | No – native resolution, sprites baked at 2–3.5 px per world unit |
| Complexity | 6/10 – forgiving stroke, but every figure is posed, baked in redrawn variants, grained and haloed |
| Fonts | Cabin Sketch, Fredericka the Great, Architects Daughter, Rock Salt |
| Key colours | board `#25332d`, chalk `#eeeee5`, orange `#f89c52`, lavender `#c2acec`, violet `#9680ce`, mint `#98deb2`, yellow `#f9e58c` |

## When to use it

Good fits:
- **Top-down action with many figures** – the baked board halo keeps doodles readable on hatched ground, and per-actor timing keeps crowds alive.
- **Kids, school or educational themes** – the blackboard is instantly familiar.
- **Cozy-spooky / seasonal projects** – pastel chalk on dark green softens horror themes.
- **Board-game, puzzle or strategy adaptations** – region borders are crisp white chalk lines, like a drawn map.

Bad fits:
- **Realistic or gritty projects** – chalk always reads as a hand drawing on a school board.
- **Glow-heavy sci-fi, neon, dense bullet patterns** – the style emits no light; dozens of bright effects turn into white mush.
- **Projects needing depth and dramatic lighting** – everything is flat, matte and front-lit from the upper left.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Slate Board | `#25332d` | Ground base, board halo behind figures, eye and mouth holes (~55% of the screen) |
| Board Deep | `#1c2823` | Text shadows, HUD panel backgrounds `rgba(22,32,28,.55)` |
| White Chalk | `#eeeee5` | Outlines, the cloak, the fast creature, region borders, paths, burst poofs, HUD lines |
| Pumpkin Orange | `#f89c52` | The main character's head, gourds, lantern, large creature core, field furrows |
| Deep Orange | `#de6c34` | Shadow side and ribs on orange objects |
| Lavender | `#c2acec` | Small creature shoulder, large creature body, forest cross-hatch, shadow hatching on white/cream, far limbs |
| Violet | `#9680ce` | Cool shadow hatching inside coloured forms |
| Mint | `#98deb2` | Scarf, leaves, meadow grass clumps, progress bar |
| Leaf Green | `#70bc7e` | Second leaf colour, stems |
| Butter Yellow | `#f9e58c` | Carved faces, pupils, warm highlight strokes, field plot borders, stars, titles |
| Pink | `#f7a8c6` | Second small-creature variant, scarf stripes, status bar, large collectible |
| Light Blue | `#9eccf0` | Pond rubs and ripples, fast creature tail, small collectible |
| Cream | `#f4e8ce` | Creature bulbs and near limbs, seed projectile, warm highlight on white |
| Eraser Wood | `#b08058` | The eraser that wipes figures away |
| Frame Wood | `#93663f` | Board frame (gradient `#7a5232` → `#93663f` → `#5c3b22`) |
| Frame Wood Dark | `#5c3b22` | Frame shadow side |

Palette rules:
- The board covers most of the screen; chalk never fills an area to full opacity except eyes, pupils and tiny details – the board must show through the side fill.
- Every chalk is a pastel; no saturated primaries, no black, no pure white (`#eeeee5` is the brightest).
- **Shadows are cooler, not darker**: lavender/violet hatching over the form colour. **Light is warmer**: a cream or yellow side-fill patch in the upper left.
- Each region and each creature type owns one chalk: meadow mint, forest lavender, fields orange/yellow, pond light blue; small creature lavender or pink, fast creature white + blue, large creature lavender with an orange core.
- Near limbs are white/cream, far limbs lavender – depth through temperature.
- Wood brown appears only on the frame and the eraser.

## Typography

| Family | Weights | Role | Sample CSS |
| --- | --- | --- | --- |
| Cabin Sketch | 400, 700 | HUD values, floating numbers, card titles, counters | `font: 700 34px/1 'Cabin Sketch', cursive; color: #eeeee5; letter-spacing: 2px; text-shadow: 0 0 4px #1c2823;` |
| Fredericka the Great | 400 | Big titles (announcements, end screen, pause) | `font: 400 78px/1 'Fredericka the Great', cursive; letter-spacing: 3px; color: #f9e58c;` |
| Architects Daughter | 400 | Body text, labels, descriptions | `font: 400 15px/1.3 'Architects Daughter', cursive; letter-spacing: 1px; color: #f89c52;` |
| Rock Salt | 400 | Handwritten words on the board (decals) | `font: 400 20px 'Rock Salt', cursive; color: rgba(238,238,229,.62);` |

Hierarchy: title (Fredericka, yellow, underlined with an orange chalk stroke) → label (Cabin Sketch 700, yellow or white) → body (Architects Daughter, white or orange). All text gets the same board-tooth mask as the art. Floating numbers are pre-rendered Cabin Sketch sprites with a board-coloured halo, tilted ±0.125 rad.

## Rendering technique

Shared pipeline:
1. **Init**: build the 128×128 board-tooth mask, five tileable 512×512 ground textures (at the chunk resolution), and the *first* redrawn variant of every pose, prop, particle and icon. Sprite resolution `K = clamp(round(screenH/360·4)/4, 2, 3.5)` px per world unit.
2. **Sprite bake** (`mk`): draw with the chalk toolkit in world units → punch out the tooth mask (`destination-out`, strength 0.3–0.9) → build a **solid** board-coloured mask of the real strokes (alpha > 70 → 255, 28–70 ramp, below 28 → 0, so faint rubs cast no halo and premultiplied rounding cannot tint it) → dilate it in 10 directions at r and r/2 (r = 0.6–1.1 units) → draw that halo at alpha 0.6–0.9 under the chalk. A white flash copy (`#f6f6ee` source-atop at 0.82) is kept per pose.
3. **Idle-time baking**: the remaining 1–2 redrawn variants per pose are baked in `requestIdleCallback` slices of 4–10 ms – never inside a frame. Mirrored copies and prop lean drawings are made once, on first use.
4. **Ground**: 256-unit chunks built by a generator inside the renderer's 5 ms per-frame budget (64×64 field grid → per-pixel composite → `putImageData` in 96-row bands → decals).
5. **Per frame**: shadows pass → y-sorted props and actors as axis-aligned `drawImage` of cached canvases → particles → frame overlay. Transforms only for hits, spawns, deaths, lanterns and particles.

The chalk toolkit:
- **stroke** – tip line: resampled every 1 unit, jitter ±0.12, runs of 3–7 points each with its own width ×0.78–1.18 and alpha ×0.72–1, 1–3 points of overshoot on closed shapes, a lighter offset second pass (45% width, 40% alpha).
- **side** – side-of-the-chalk fill: broken parallel dashes 1.1–4.6 units long at −0.42 rad, row spacing 0.46, 28–40% gaps, a slow pressure wave across rows, alpha falling towards the lower right (`lit`).
- **hatch** – loose, slightly bent parallel lines clipped to a shape (spacing ~1.05–1.4, width 0.36–0.45).
- **rub** – a flat, faint fill (alpha 0.1–0.3).
- **form** – the recipe: board fill → rub → side fill (lit) → cool hatch on a shadow ellipse offset by (+0.62 rx, +0.7 ry) → warm side-fill patch at (−0.38 rx, −0.5 ry) → outline with an extra ×0.75 pass where the edge faces the lower right.

## World and ground

The ground is an infinite blackboard map, composited per pixel from noise fields:
- **Base**: `#25332d` + macro brightness drift (fbm /520, ±11) + a baked smudge texture.
- **Regions**: forest where a warped fbm (/760) < 0.455, fields where it is > 0.553, pond where a second fbm (/420) > 0.585, meadow elsewhere. The signed distance (value / gradient) draws **0.5-unit white chalk borders** (alpha 0.8 × grain) and drives everything else.
- **Edges**: a region dust tint (3–5% of the region colour) plus a side-of-the-chalk band just inside each edge (5–15%) that fades over 5–7 units.
- **Forest**: lavender cross-hatching dense for the first 5–30 units inside the edge, then only in clusters – calm board deep inside; a second lavender line 2.6 units inside the border.
- **Fields**: Worley plots (82-unit cells), three furrow patterns in orange/yellow, each plot with its own direction and texture offset, one in three drawn as outline only; yellow 0.42-unit plot borders.
- **Pond**: a light-blue rub along the shore, three ripple lines parallel to it at 2.8 / 5.9 / 9.5 units (alpha 0.62 → 0.28), a darker damp middle (−7 brightness).
- **Meadow**: mint grass clumps only along region borders, beside paths and in a few noise patches – never an even sprinkle.
- **Paths**: 17-unit winding bands (a domain-warped zero line), faint dust rub, broken edge lines 0.8 units inside, stipple dust in patches.
- **Decals** (baked into the chunk): a few big old eraser wipes per screen, each over a half-erased older doodle or word (the "ghost layer"); doodles (star, sparkle, spiral, moon, bat, gourd, arrow, heart, flower, snowflake, tally, tic-tac-toe …) in small groups where a cluster mask is high or along borders; Rock Salt words fully inside one chunk ("Boo!", "Psst!", "Hello" …); pebble groups along path edges.

Detail at three scales: region shapes (hundreds of units), edge bands and plots (5–80 units), strokes and grain (< 2 units).

## Characters

All figures are drawn facing right with feet at (0, 0), then mirrored. Poses are parameter sets (feet, body drop, lean, lagging head and cloth), each baked as a sprite in 2–3 redrawn variants.

**Main character** (~18 × 31 units, the clearest read on screen):
- Big round head: ellipse 7.8 × 6.7 with 6 subtle lobes, side-filled orange with deep-orange ribs, a violet hatch on the lower right, a yellow highlight patch upper left, a 1.2-unit orange outline.
- Signature: a green stem with a curled mint tendril and one leaf. Carved face: two yellow triangle eyes, a nose and a jagged grin on board-coloured holes; eyes close for blinks, the mouth opens to an "o" when hurt.
- Tattered white cloak (side fill 0.64, lavender shadow hatch, cream highlight, two yellow buttons) whose hem lags behind the body; a mint scarf band with pink stripes and two tails that stream back.
- Two-bone IK legs (thigh 4.1, shin 3.9) with lavender boots that roll at the toe; far limbs lavender, near limbs white.
- A faint orange chalk rub around the head (three rings, alpha 0.035–0.05) – no glow.

**Small creature** (bulb ~16 × 17 on stubby root legs, body centre 13.6 up):
- Variant A: round bulb (rx 8.2), lavender shoulder above a wavy line, cream body, three leaves. Variant B: tall bulb (6.6 × 9.2), pink shoulder, white body, two leaves, longer taproot.
- Rootlet arms with three claws, a curly taproot tail that swings behind, one heavy brow over board-coloured eyes with yellow pupils, a toothy slit.
- 6-pose waddle: squash at each contact, lean into the step, leaves lag the bob.

**Fast creature** (~14 × 21, floats):
- A hooded head r 6.3 and a tail that tapers over 13.5 units and carries a travelling wave; a reaching three-claw arm in front, a faint far arm behind.
- Soft white rub fading towards the tail, side fill, light-blue hatching and a blue outline along the tail; hollow board-coloured eyes and mouth. Variant B: pointed hood and a frayed, split tail end.
- 6 flutter poses, time driven; floats 1.4–4.2 units above its shadow with hang time.

**Large creature** (~44 × 58):
- A hunched lavender bulb with violet hatching, a white wavy shoulder line, a leaf crown that lags, an angry brow, yellow eyes and a toothy mouth, a nine-point carved core in orange and yellow.
- Knuckle-dragging arms (near cream, far lavender) and short root legs; 6 stomp poses with 5.5% squash on contact and a dust puff baked under the planted foot.

## Props

Doodles drawn with the same recipe, each kind in 2–3 designed variants, each with a board halo (0.6–0.85 units) and a grained contact shadow:
- **Trees**: round tree with a mint scribble crown, autumn tree with an orange crown and falling leaves, pine with stacked tiers, bare tree with recursive branches (sometimes a bat).
- **Graveyard**: round stone with "RIP", cross, pointed stone – placed in groups of 2–4.
- **Fields and paths**: fence (posts and rails), scarecrow in a lavender coat, gourd groups (3 variants), signpost, stones.
- **Water and forest floor**: reeds (2), toadstools (2), bushes (2).

Placement is composed on 44-unit cells: a belt of trees in the first 34 units inside forest edges and clusters further in, toadstools at tree feet, reeds within 7 units of the pond shore, stones and signposts within 22–26 units of paths, gourds and scarecrows in plots, fences along field edges; nothing tall within 11 units of a path or 95 units of the start point.

Readability: a tree, pine, bare tree or scarecrow standing in front of the main character (the character above its foot and within 30 units sideways) is drawn at 42% opacity, easing back to full over 16–30 units – the main character is never hidden.

Wind: trees, reeds, bushes and the scarecrow own three drawings – leaning left, upright, leaning right by 0.01–0.05 rad about the foot – swapped on 6 fps ticks by a slow two-sine gust with a per-prop phase.

## Effects and particles

Every effect is layered: **core tick → main shape → debris → lingering residue**, all in chalk.
- **Impact**: a hard white four-ray tick (0.1 s, shrinking 1.35 → 0.65) → a ring of 6–8 radiating chalk strokes around a rubbed star that pops in at 0.55 → 1.25 size and settles (0.26 s; yellow for orbiting hits, orange for dash hits) → 2–4 crumbs in the creature's colours with gravity 160 → a small dust puff (0.45 s).
- **Burst**: tick → a scalloped chalk **poof** (6–8 lobes, side fill inside a tip outline, two curls) in the creature's colour, bursting in with an `outBack` overshoot and thinning over 0.42 s → 6–12 bouncing crumbs (gravity 220) → 2–4 drifting dust motes → a smear decal on the board (2.8 s).
- **Sketched-in appearance** (0.45 s, stepped on twos): the construction sketch (tip lines only) is revealed by a clockwise sweep from 12 o'clock with a chalk-tip dot on the edge; from 42% the coloured drawing fades in, then a small squash-and-stretch pop.
- **Eraser wipe** (0.35 s): 50 ms white recoil (1.13 × 0.89 + flash), then a felt eraser (wood top `#b08058`, grey felt with white dust) wipes the figure in 3 zig-zag bands (4 on the large creature); wiped parts survive as a 30% smeared haze.
- **Projectile**: a cream seed 6.6 × 3.8 with a white outline and rows of short broken white dashes behind it that grow in over 0.12 s.
- **Orbiting lantern**: a carved orange lantern (3 variants) that swings against its travel direction and drags a dusty streak along the orbit tangent.
- **Collectibles**: small light-blue gem, large pink star with a yellow core; hang-time float of 1.6 units, an overshooting hop when they appear, a twinkle tick on the large one every ~1.8 s. Collect = tick + a rising yellow star (+3 small stars for large).
- **Dash**: three fading chalk after-images, two speed strokes, white/mint dust behind the feet. **Celebration**: rotating double ring (yellow 11.5 + orange 9.4 with 12 ticks), a big tick, 8 stars at 70 units/s, yellow dust.

## Atmosphere and lighting

- One light direction, upper left, baked into every form (side-fill falloff, shadow hatch position, outline weight) and into the ground's edge bands.
- **Contact shadows**: grained radial ellipses `rgba(12,20,16,.62)` → `.38` at 62% → 0 – main character 7 × 2.2, small creature 7.5 × 2.3, fast creature 4.8 × 1.4 (tightens when it dips), large creature 18 × 4.6, tree 16 × 4. The shadow stretches to 1.35 × 0.8 during the dash and fades out during the eraser wipe.
- **Board halo** behind every figure: the board colour wipes the ground texture locally – the key readability device.
- Glows are faint chalk rubs, never light: orange rings around the main character's head, yellow behind lanterns.
- Edge vignette `rgba(6,12,9,.5)` → `.18` → 0 over 10% of the height / 7% of the width.
- **Frame**: a wooden frame (thickness max(8 px, 1.3% of H), bottom ledge 1.8×) with grain strokes, chalk sticks and an eraser on the ledge, 700 settled dust specks above the ledge.
- No colour grading; the board colour sets the mood.

## UI

- Panels and bars are chalk outlines (`2.5px solid rgba(238,238,229,.92)`) with deliberately uneven border radii, backgrounds `rgba(22,32,28,.55)`.
- Bar fills are diagonal hatching via `repeating-linear-gradient(-58deg, …)`: progress bar mint, status bar pink with orange gaps.
- The whole HUD gets an SVG noise `mask-image`, so text and lines have the same tooth holes as the art.
- Cards: board-coloured with a smudge gradient, 3 px chalk borders, rotated −1.6° / 0.9° / −0.5°, pinned with orange / lavender / mint magnets; hover lifts by 8 px and the border turns yellow.
- Titles: Fredericka the Great in yellow with an orange chalk underline (`::after`, 5 px, rotated −1°).
- A chalk clock dial (double white circle, yellow quarter ticks, a small gourd at 12, white hour hand, orange minute hand) hangs under the clock readout when the HUD is visible.
- Icons are drawn with the same toolkit in a 100-unit box and grained.

```css
.hud { color: #eeeee5; font-family: 'Architects Daughter', 'Comic Sans MS', cursive; }
.status-bar { width: 240px; height: 22px; background: rgba(22,32,28,.55);
  border: 2.5px solid rgba(238,238,229,.92); border-radius: 4px 14px 6px 12px / 12px 5px 14px 4px; }
.status-fill { height: 100%; background: repeating-linear-gradient(-58deg, rgba(247,168,198,.95) 0 3.5px, rgba(247,156,82,.45) 3.5px 7px); }
.progress { height: 18px; background: rgba(22,32,28,.55); border: 2.5px solid rgba(238,238,229,.92);
  border-radius: 14px 4px 12px 5px / 5px 12px 4px 14px; }
.progress-fill { height: 100%; background: repeating-linear-gradient(-58deg, rgba(152,222,178,.95) 0 3px, rgba(152,222,178,.3) 3px 7px); }
.counter { font-family: 'Cabin Sketch', cursive; font-weight: 700; font-size: 30px; }
.card { background: radial-gradient(ellipse at 30% 20%, rgba(220,235,225,.07), transparent 60%), #25332d;
  border: 3px solid rgba(238,238,229,.92); border-radius: 22px 8px 24px 6px / 6px 24px 8px 22px; transform: rotate(-1.6deg); }
.title { font: 400 78px 'Fredericka the Great', cursive; letter-spacing: 3px; color: #f9e58c; }
.title::after { content: ''; display: block; height: 5px; width: 86%; margin: 2px auto 0;
  border-radius: 50% 40% 60% 30%; background: #f89c52; transform: rotate(-1deg); }
/* tooth holes on any element */
.chalky { -webkit-mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n' x='0' y='0'><feTurbulence type='fractalNoise' baseFrequency='1.15' numOctaves='2' seed='4' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 -9 0 0 0 6.1'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  mask-image: inherit; }
```

## Motion and animation

Hand-drawn timing: the board is redrawn **on a 12 fps clock**; each actor holds a drawing for **2 or 3 ticks** (chosen by its seed) before switching to its next redrawn variant – a crowd never boils in lock-step. Poses change at 6–10 per second; nothing tweens smoothly except positions.

| Action | Poses / timing |
| --- | --- |
| Main character walk | 8 poses (contact, down, passing, up × 2 steps) at ~10 poses/s; body drop +0.15 / +0.95 / −0.2 / −0.95, head follows one pose late, scarf and hem lag, arms counter-swing |
| Idle | 3 breathing poses played 0-1-2-1, 0.45 s each; blink every 3.4 s for 0.14 s; per-instance phase |
| Dash | anticipation drawing (crouch, lean back, arms pulled back), then the stretch drawing (lean 0.4 rad, legs split, scarf straight back) with after-images; 120 ms landing crouch |
| Hurt | recoil drawing (head back, arms up, "o" mouth) for 150 ms + white flash, then blinking while invulnerable |
| Small creature | 6 poses, ~6/s, squash 7% at contact, leaf lag, tail swing |
| Fast creature | 6 flutter poses at 6/s (time driven); float = smoothstep on a triangle wave (hang time at top and bottom), shadow tightens on dips |
| Large creature | 6 stomp poses, ~5/s, 5.5% squash and a dust puff on contact |
| Hit | 140 ms: squash 1.17 × 0.86, 0.2 rad lean away from the blow, 1.4-unit shove, white flash copy (large creature at 55%) |
| Appear / wipe | 0.45 s sketched in (stepped on twos) / 0.35 s eraser wipe |
| Numbers | scrawl in 0.55 → 1.15 → 1 in 0.16 s, rubbed out over the last 0.22 s |
| Ambient | props swap lean drawings on 6 fps ticks; lantern swings with follow-through; collectibles float with hang time |

Effect ages are stepped on the 12 fps clock too (sizes jump, positions glide), so effects feel drawn, not simulated.

## Do and don't

Do:
- Build every form with the recipe: board fill, faint rub, side fill heavier in the light, cool hatch in the shadow, warm stroke in the light, outline pressed harder on the shadow side.
- Keep one light (upper left) for figures, props and ground.
- Pose figures parametrically and bake each pose in 2–3 redrawn variants; hold drawings for 2–3 ticks at 12 fps with per-actor offsets.
- Give every figure a designed feature (curled stem and scarf, taproot tail, streaming wisp tail, lit core).
- Cluster texture and props at features; leave calm board areas.
- Appear by sketching in, disappear by an eraser wipe, leave dust and smears.

Don't:
- Use gradients as lighting, `lighter` glows, or hard drop shadows.
- Use black outlines or pure white; chalk is `#eeeee5` at most.
- Darken shadows with grey or black – hatch them in a cooler chalk.
- Fill shapes at full opacity or scatter grass and doodles evenly.
- Regenerate strokes or rotate big sprites per frame – bake and swap.
- Tween every frame; hold poses on twos.

## Implementation recipe

1. Pick a board colour (`#25332d`) and 6–8 pastel chalks; give each region and creature type one chalk.
2. Write the toolkit: `stroke`, `side`, `hatch`, `rub`, `fillBoard`, and `form` that chains them with one light direction.
3. Build the 128×128 tooth mask (clustered noise pores + single pores + drag streaks).
4. Write `mk(box, draw)`: draw at K px/unit, punch out the tooth mask, add a thresholded board halo, keep a flash copy.
5. Describe each figure as a function of a pose object; define walk (8), idle (3), dash (2), hurt (1) and creature cycles (6).
6. Bake variant 0 of every pose at init, the other variants in idle time; mirror on first use.
7. At draw time pick pose by stride or time, variant by `boilIdx(time, seed)`, and blit axis-aligned; use a transform only for hits, appearances and wipes.
8. Ground: noise fields → signed distances → borders, edge bands, clustered textures, paths, decals; bake per chunk incrementally.
9. Effects: tick → main shape → crumbs → residue, all from baked chalk sprites, aged on the 12 fps clock.

## Code

The core techniques, standalone. A complete runnable scene is in [`starter.js`](starter.js); the full reference module is [`../../js/styles/chalk.js`](../../js/styles/chalk.js).

```js
// Seeded RNG + the tip-of-the-chalk stroke (pressure runs + lighter double pass)
function rng(seed) { let a = seed >>> 0; return { next() { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; } }; }
const J = (s, r) => (r.next() - 0.5) * 2 * s, R = (a, b, r) => a + (b - a) * r.next();
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
function resample(pts, closed, step) {
  const src = closed ? pts.concat([pts[0]]) : pts, out = [src[0].slice()]; let carry = 0;
  for (let i = 1; i < src.length; i++) {
    const a = src[i - 1], b = src[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1e-6) continue;
    let d = step - carry;
    while (d <= L) { out.push([a[0] + (b[0] - a[0]) * d / L, a[1] + (b[1] - a[1]) * d / L]); d += step; }
    carry = L - (d - step);
  }
  return out;
}
function stroke(ctx, pts, o) {
  const r = o.rng, w = o.w || 1, a = o.a ?? 1, c = o.c || [238, 238, 229];
  const P = resample(pts, !!o.closed, 1);
  if (o.closed && P.length > 5) for (let i = 1, ov = 1 + ((r.next() * 3) | 0); i <= ov; i++) P.push(P[i].slice());
  for (const p of P) { p[0] += J(0.12, r); p[1] += J(0.12, r); }
  for (let i = 0; i < P.length - 1; ) {
    const e = Math.min(P.length - 1, i + 3 + ((r.next() * 5) | 0));
    ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]);
    for (let k = i + 1; k <= e; k++) ctx.lineTo(P[k][0], P[k][1]);
    ctx.lineWidth = w * (0.78 + r.next() * 0.4); ctx.strokeStyle = rgba(c, a * (0.72 + r.next() * 0.28)); ctx.stroke();
    i = e;
  }
  if (o.dbl !== false && P.length > 2) {
    const ox = J(w * 0.32, r), oy = J(w * 0.32, r);
    ctx.beginPath(); ctx.moveTo(P[0][0] + ox, P[0][1] + oy);
    for (let k = 1; k < P.length; k++) ctx.lineTo(P[k][0] + ox, P[k][1] + oy);
    ctx.lineWidth = w * 0.45; ctx.strokeStyle = rgba(c, a * 0.4); ctx.stroke();
  }
}
```

```js
// Side-of-the-chalk fill (broken dashes, pressure wave, light from the upper left) and the form recipe
function poly(ctx, p) { ctx.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]); ctx.closePath(); }
function bbox(p) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const q of p) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); } return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, rx: (x1 - x0) / 2, ry: (y1 - y0) / 2 }; }
function side(ctx, pts, { rng: r, c, a = 0.6, ang = -0.42, sp = 0.46, gap = 0.3, lit = 1 }) {
  const b = bbox(pts), Rr = Math.hypot(b.rx, b.ry) + 1, dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
  ctx.save(); ctx.beginPath(); poly(ctx, pts); ctx.clip();
  const ph = r.next() * 6;
  for (let off = -Rr; off <= Rr; off += sp * (0.8 + r.next() * 0.4)) {
    const press = 0.62 + 0.38 * Math.sin(off * 0.85 + ph) * Math.sin(off * 0.31 + ph * 2);
    for (let s = -Rr - r.next() * 2; s < Rr; ) {
      const L = R(1.1, 4.6, r);
      if (r.next() > gap) {
        const mx = nx * off + dx * (s + L / 2), my = ny * off + dy * (s + L / 2);
        const l = (-mx * 0.6 - my * 0.8) / (Math.max(b.rx, b.ry) + 0.01);       // +1 upper left .. -1 lower right
        const k = Math.min(1, Math.max(0, 0.75 + 0.5 * l * lit));
        ctx.beginPath(); ctx.moveTo(b.cx + nx * off + dx * s, b.cy + ny * off + dy * s);
        ctx.lineTo(b.cx + nx * off + dx * (s + L), b.cy + ny * off + dy * (s + L));
        ctx.lineWidth = 0.56 * R(0.8, 1.35, r); ctx.strokeStyle = rgba(c, a * press * R(0.55, 1, r) * k); ctx.stroke();
      }
      s += L + R(0.15, 1.3, r);
    }
  }
  ctx.restore();
}
function hatch(ctx, pts, { rng: r, c, a = 0.8, ang = 0.82, sp = 1.05, w = 0.36 }) {
  const b = bbox(pts), Rr = Math.hypot(b.rx, b.ry) + 1, dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
  ctx.save(); ctx.beginPath(); poly(ctx, pts); ctx.clip();
  for (let off = -Rr; off <= Rr; off += sp * (0.75 + r.next() * 0.5)) {
    const bx = b.cx + nx * off, by = b.cy + ny * off, s0 = -Rr * R(0.55, 1.15, r), s1 = Rr * R(0.55, 1.15, r), bend = J(0.5, r);
    ctx.beginPath(); ctx.moveTo(bx + dx * s0, by + dy * s0); ctx.quadraticCurveTo(bx + nx * bend, by + ny * bend, bx + dx * s1, by + dy * s1);
    ctx.lineWidth = w * R(0.7, 1.3, r); ctx.strokeStyle = rgba(c, a * R(0.55, 1, r)); ctx.stroke();
  }
  ctx.restore();
}
const rub = (ctx, p, c, a) => { ctx.beginPath(); poly(ctx, p); ctx.fillStyle = rgba(c, a); ctx.fill(); };
const fillBoard = (ctx, p) => { ctx.beginPath(); poly(ctx, p); ctx.fillStyle = '#25332d'; ctx.fill(); };
const ell = (cx, cy, rx, ry, n) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * 6.2832) * rx, cy + Math.sin(i / n * 6.2832) * ry]);
// every body part: e.g. form(ctx, headPts, { rng, c: ORANGE, sh: VIOLET, hi: YELLOW, line: ORANGE, lw: 1.2 })
function form(ctx, pts, o) {
  const b = bbox(pts);
  fillBoard(ctx, pts);                                              // hide everything behind
  rub(ctx, pts, o.c, o.rubA ?? 0.16);                               // faint dust film
  side(ctx, pts, { rng: o.rng, c: o.c, a: o.a ?? 0.64, lit: o.lit ?? 1 }); // body colour, heavier in the light
  ctx.save(); ctx.beginPath(); poly(ctx, pts); ctx.clip();
  hatch(ctx, ell(b.cx + b.rx * 0.62, b.cy + b.ry * 0.7, b.rx * 1.05, b.ry * 0.95, 20), { rng: o.rng, c: o.sh }); // cool shadow
  if (o.hi) side(ctx, ell(b.cx - b.rx * 0.38, b.cy - b.ry * 0.5, b.rx * 0.5, b.ry * 0.34, 16), { rng: o.rng, c: o.hi, a: 0.7, gap: 0.2 }); // warm light
  ctx.restore();
  stroke(ctx, pts, { rng: o.rng, closed: true, w: o.lw || 0.9, c: o.line || [238, 238, 229] });
}
```

```js
// Sprite bake: tooth mask punched out, then a SOLID board-coloured halo (faint rubs cast none)
function bake(w, h, K, ax, ay, draw, grain, halo = 0.9, haloA = 0.85) {
  const A = document.createElement('canvas'); A.width = w; A.height = h;
  const a = A.getContext('2d'); a.setTransform(K, 0, 0, K, ax, ay); a.lineCap = a.lineJoin = 'round';
  draw(a); a.setTransform(1, 0, 0, 1, 0, 0);
  a.globalCompositeOperation = 'destination-out'; a.globalAlpha = 0.9;
  a.fillStyle = a.createPattern(grain, 'repeat'); a.fillRect(0, 0, w, h);
  a.globalCompositeOperation = 'source-over'; a.globalAlpha = 1;
  const M = document.createElement('canvas'); M.width = w; M.height = h;
  const m = M.getContext('2d', { willReadFrequently: true }); m.drawImage(A, 0, 0);
  const img = m.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const al = d[i + 3]; d[i] = 37; d[i + 1] = 51; d[i + 2] = 45; d[i + 3] = al > 70 ? 255 : al > 28 ? (al - 28) * 6 : 0; }
  m.putImageData(img, 0, 0);
  const O = document.createElement('canvas'); O.width = w; O.height = h;
  const o = O.getContext('2d'), D = document.createElement('canvas'); D.width = w; D.height = h;
  const dc = D.getContext('2d'), r = halo * K;
  for (let k = 0; k < 10; k++) { const an = k / 10 * 6.2832 + 0.3; dc.drawImage(M, Math.cos(an) * r, Math.sin(an) * r); dc.drawImage(M, Math.cos(an) * r / 2, Math.sin(an) * r / 2); }
  o.globalAlpha = haloA; o.drawImage(D, 0, 0); o.globalAlpha = 1; o.drawImage(A, 0, 0);
  return { c: O, ch: A, ax, ay };
}
```

```js
// Hand-drawn timing: 12 fps clock, per-actor holds of 2–3 ticks, hang-time floats, pose choice
const TICK = (t) => Math.floor(t * 12);
function boilIdx(t, seed, n) {                       // which redrawn variant is on the board now
  const hold = seed > 0.62 ? 3 : 2;
  return Math.floor((TICK(t) + ((seed * 997) | 0)) / hold) % n;
}
const easeIO = (t) => t * t * (3 - 2 * t);
function floatY(t, seed, rate) {                     // 0..1 with hang time at both ends, not a plain sine
  const u = (t * rate + seed * 3) % 2; return easeIO(u < 1 ? u : 2 - u);
}
function pickPose(actor, t) {
  if (actor.hurt > 0.55) return 'hurt';
  if (actor.dashT > 0) return actor.dashT > 0.17 ? 'dash0' : 'dash1';   // anticipation, then stretch
  if (actor.moving) return 'walk' + (Math.floor(actor.stride * 1.1) % 8);
  const bt = t + actor.phase;
  if (bt % 3.4 < 0.14) return 'blink';
  return 'idle' + [0, 1, 2, 1][Math.floor(bt * 2.2) % 4];
}
// hit reaction: q = flash 1 -> 0 over 0.14 s
function hitTransform(q, kd) { const s = q * q * (3 - 2 * q); return { sx: 1 + 0.17 * s, sy: 1 - 0.14 * s, rot: kd * 0.2 * s, dx: kd * 1.4 * s }; }
```

## Adapting it to your project

- **Other boards**: a black slate (`#1f2326`) or a dark blue board works with the same chalks; keep the halo in the board colour.
- **Other casts**: keep one designed feature per figure and one chalk per type; build each from 3–6 `form` shapes and a few strokes, then pose it with parameters.
- **Side view**: the same toolkit works; move the light to the upper left of the screen and keep the cool-hatch offset at the lower right.
- **Bigger sprites**: raise K to 3.5 and widen the halo to ~1.2 units; keep the stroke widths in world units.
- **Fewer figures, more detail**: add a third redrawn variant everywhere and hold for 2 ticks only.
- **Calmer look**: drop the doodle decals and words, keep the region borders and edge bands.

## Performance notes

- Init (the expensive part): tooth mask, five 512×512 textures and the first variant of every pose/prop/particle; the remaining variants are baked in idle-time slices of 4–10 ms, so frames never hitch on baking.
- Per frame: axis-aligned `drawImage` of cached canvases. Mirrored copies and prop lean drawings are created once on first use. Hits, appearances, wipes, lanterns and particles use a transform.
- Ground chunks are generators inside a 5 ms per-frame budget; the per-pixel loop (Worley noise only inside fields) is the hot spot.
- The halo needs one `getImageData` per sprite at bake time; nothing reads pixels per frame.
- Measured against the previous version of this style (4 interleaved runs): play frame median about +17%, dense scene render about the same, ground chunk build about +24% (spread over frames by the 5 ms budget).

## Copy-paste prompt

```text
Use the Chalkboard art style for my project: everything looks drawn live with pastel chalk on a
slate-green school board (#25332d) inside a wooden frame. Chalks: white #eeeee5, orange #f89c52,
deep orange #de6c34, lavender #c2acec, violet #9680ce, mint #98deb2, leaf green #70bc7e,
butter yellow #f9e58c, pink #f7a8c6, light blue #9eccf0, cream #f4e8ce. No black, no pure white.
Build every form like a chalk drawing: fill the board colour first, a faint rub, a side-of-the-chalk
fill of broken parallel dashes heavier in the light from the upper left, cool lavender/violet hatching
in the shadow, a warm cream/yellow stroke in the light, and a broken tip outline pressed harder on the
shadow side. Punch a clustered board-tooth mask out of everything and bake a solid board-coloured halo
behind every figure. Figures have designed silhouettes and parametric poses (8-pose walk, 3-pose idle
with blinks, dash anticipation, hurt recoil, 6-pose creature cycles), each pose baked in 2-3 redrawn
variants; redraw on a 12 fps clock and hold each drawing for 2-3 ticks per actor. Hits: 140 ms squash,
lean and white flash. Appear by being sketched in with one sweeping stroke; disappear by a felt eraser
wiping in zig-zag bands, leaving a dusty smear. Effects are layered chalk: tick, radiating strokes or a
scalloped poof, crumbs, dust. Ground: regions with crisp white chalk borders, texture dense at edges and
in clusters, calm board elsewhere, dusty paths. UI: hatched bars, wobbly chalk borders, Cabin Sketch,
Fredericka the Great and Architects Daughter.
```
