# Watercolor Storybook — Game Art Style Spec

> Transparent watercolour washes and loose, broken ink lines on warm cold-pressed paper: a living illustrated fairy-tale book.

The whole screen reads as a page of an illustrated children's book. The ground is a per-pixel pigment simulation over cream paper: biome washes mixed subtractively, darker pigment pooled along wash edges, thin bare-paper gaps between neighbouring washes, granulation specks and pale dapples, then inked grass tufts, tiny flowers and stones on top. Characters are layered washes with soft wet-in-wet colour blooms, a paper-white highlight and a darker rim, outlined by a sepia ink line that tapers, wobbles, is thicker on the shadow side and is broken in 2–3 places. A deckled bare-paper margin frames the view. Reference: *Jack vs. the Turnip Ancestors* (pumpkin-head hero, walking turnips, frosty ghosts, a cracked turnip colossus) — but everything below is written for any game.

## At a glance

| | |
| --- | --- |
| Family | Illustrated · Watercolor |
| Mood | cozy, whimsical, autumnal, handmade, gentle |
| Best for | fairy-tale top-down action/survivor games, cozy adventure, story RPG maps, storybook board games |
| Renderer | Canvas 2D, fully procedural (no image assets) |
| Pixel art | No — native resolution, sprites baked at 3 px per world unit |
| Difficulty | 8/10 — every new asset needs several painterly iterations; init bake takes 1–3 s |
| Fonts | IM Fell English SC, Cormorant Garamond, Caveat |
| Key colours | paper `#f5eede`, sepia ink `#2a1b14`, meadow `#b2c6a2`, pumpkin `#e8832f`, coat `#41528a`, turnip violet `#7a4a8c`, gold `#e6a92f` |

## When to use it

Good fits:
- Games with a fairy-tale, folk-tale, autumn-harvest or "bedtime story" theme.
- Top-down views with mid-sized characters (18–50 world units) where washes have room to show blooms and granulation.
- Slower or medium-paced games; the soft look rewards the eye resting on the screen.
- Map screens, level-select pages, card-based UIs (paper cards and ink frames come for free).

Bad fits:
- Neon/sci-fi/gritty realism — the palette and paper ground fight the theme.
- Games with hundreds of distinct animated sprite types generated at runtime (every asset is baked at init, which costs time).
- Very tiny sprites (< 8 units): washes and broken lines collapse into mush; use flat dots with one ink stroke instead.
- Massive hordes become a violet/blue carpet; keep enemy colours distinct per type (violet, frost-blue, umber).

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Paper | `#f5eede` | The white of the image; page margin, highlights, HUD panels |
| Sepia ink | `#2a1b14` | All contours, grass tufts, text |
| Blue-black ink | `#252c46` | Ink for ghosts and for grass inside forests |
| Meadow cool | `#b2c6a2` | Meadow wash, cool end (~55 % of the ground) |
| Meadow sap | `#c2cc96` | Meadow wash, mid hue |
| Meadow ochre | `#dace98` | Meadow wash, warm end |
| Forest payne | `#8e9c92` | Forest wash |
| Forest indigo | `#828aa2` | Forest wash, indigo variant |
| Field ochre | `#e9ce88` | Golden field wash (sienna variant `#e4ba7a`) |
| Path earth | `#d8b894` | Dirt path (dark variant `#c6a280`) |
| Pumpkin | `#e8832f` | Hero head; light `#f6b45e`, shade `#bf531b`, rim `#93380f`, ribs `#7e2f0e` |
| Coat indigo | `#41528a` | Hero coat; light `#6677ad`, shade `#29345e`, rim `#1d2546` |
| Scarf red | `#b4432f` | Scarf; light `#d66a48`, dark `#862a1e` |
| Turnip violet | `#7a4a8c` | Small enemy crown; light `#a77ab5`, dark `#4e2a5c` (alt palette `#8b3d6d`/`#b4729a`/`#5a2244`) |
| Turnip skin | `#eee0ba` | Small enemy body base, ochre belly blob `#e3c886` |
| Leaf green | `#6c8a38` | Leaves; light `#a7bd68`, dark `#46602a`, rim `#3a4e1c` |
| Ghost frost | `#d3dbe3` | Fast floating enemy; shade `#8fa0bb`, deep `#6a7b9e`, rim `#6f80a2`, eyes `#20263e` |
| Brute umber | `#b06a3a` | Large brute; crown `#6b4a7d`, belly `#c99545`, deep `#5a2f2a`, limbs `#7a4e34` |
| Glow yellow | `#ffcf55` | Carved eyes/mouths; core `#fff6cf`, rim `#e0661f`; brute cracks `#ffc548`/`#fff0b0` |
| Gem gold | `#e6a92f` | XP drops; light `#fbe39c`, rim `#9a5a14`; XP bar `#dca23a` |
| Hurt alizarin | `#c23b2b` | HP bar/heart; crit numbers `#9e2a1c`; hurt vignette rgb(178,44,34) |

Palette rules:
- Paper is the lightest value. Pure `#ffffff` only for specular dots (`rgba(255,253,244,.95)`).
- Ground: light and low-chroma. Characters carry the saturated colour.
- Ground colours are mixed subtractively in absorbance space: `A = -ln(colour / paper)` per channel, summed, `out = paper * exp(-A)`.
- Every shape gets a lighter, warmer blob top-left and a darker, cooler/neighbouring-hue blob bottom-right.
- Ink is never black. Shadows are indigo glazes `rgba(50,54,92,0.2)`, never grey.

## Typography

- **IM Fell English SC** 400 — titles, clock, big counters, card names. `https://fonts.google.com/specimen/IM+Fell+English+SC`
  `font: 400 40px/1 'IM Fell English SC', 'IM Fell English', Georgia, serif; letter-spacing: 1.5px; color: #2a1b14;`
- **Cormorant Garamond** 500/600 (+ italics) — body copy, descriptions, small numbers. `https://fonts.google.com/specimen/Cormorant+Garamond`
  `font: italic 600 18px/1.2 'Cormorant Garamond', Georgia, serif; color: #5b3a24;`
- **Caveat** 500/700 — handwritten labels ("until midnight"), level tag, key hints, damage numbers. `https://fonts.google.com/specimen/Caveat`
  `font: 700 20px 'Caveat', 'Segoe Print', cursive; color: #8a3a1e;`

Text effects: HUD text over the map gets a paper halo `text-shadow: 0 0 3px #f5eede, 0 0 7px #f5eede, 0 0 12px rgba(245,238,222,.8)` (never a dark drop shadow). In-world numbers: paper-coloured stroke `rgba(246,239,224,.9)` 2.4–3 px under the ink fill, rotated ±0.14 rad. Text over dark modal veils turns paper-coloured `#f5eede` with `0 1px 4px rgba(30,18,8,.85)`.

## Rendering technique

World space: 360 world units visible vertically; light from the upper left `(LX, LY) = (-0.6, -0.8)`.

Baked at init (1–3 s total):
1. **Noise textures** (tileable Float32 fields in [0,1]): white noise → 3 passes of wrap-around box blur → normalise → sum of layers → `0.5 + v / 4.6`. `PAP` 256² (paper tooth, radii 1/2/6), `GRA` 256² (granules, radii 0/1), `WA` and `WB` 1024² (wash flow, radii 4/12/34 and 6/18/46), `STR` 256² (horizontal streaks). Plus an `EXP[i] = exp(-i/512)` lookup (4097 entries).
2. **Grain canvas** 256²: `v = 255 - max(0, GRA-0.46)*190 - max(0, 0.5-PAP)*60` (slightly warm), used as a multiply pattern on every sprite wash.
3. **Character frames** with `mkSprite(wu, hu, ax, ay)` at K = 3 px/unit: hero 3 idle + 4 walk × 3 boil = 15 frames (30×35 units, anchor 15.5/32.5); small enemy 2 palettes × 4 poses × 2 boils (26×37); ghost 4×2 (26×28); brute 4×2 (50×58). Each also gets a mirrored copy, a white "flash" copy (pixels with luminance > 0.14 pushed to paper), a 4 px blurred "soft" copy for spawning and 4 dissolve frames for dying.
4. **Props** (25 sprites), **FX sprites** (paint dots, splats, ring, star, smear, glow halos, spawn stains), **HUD textures** (paper tile, ink frames, wash bars, plaque, banners, deckled cards) and **icons**.

Per frame (draw order from the renderer):
1. Ground chunks (256 units, per-pixel shader at ≤ 2.5 px/unit, built incrementally by a generator with a 5 ms/frame budget).
2. Ground overlay: landed paint drops as flattened stains, bloom rings, spawn puddles, warm light pools under orbiting lanterns.
3. Gems (baked drop / star with a soft indigo shadow sprite).
4. Shadows: every actor appends an ellipse to one `Path2D`; it is filled once in `rgba(50,54,92,0.2)` (floating actors in a second path at 0.11) right before the first sprite draws — overlapping shadows don't double up.
5. Y-sorted props, enemies and hero as baked sprites (`drawImage`). Additive glow sprites over carved faces, brute cores and lanterns.
6. Projectiles, particles, damage numbers.
7. Screen overlay: the cached deckled page margin, drawn only as 4 edge strips (band = 11 % of height); a red "hurt" version with alpha = hurtT.

Resolution rules: no pixel snapping, smoothing on. Sprite pixel density (3 px/unit) roughly equals screen density at 1080p; ground caps at 2.5 px/unit.

## Background and ground

The ground is a custom per-pixel shader, not a texture blend:

- **World fields** (computed on a 16-px grid and bilinearly interpolated): forest `F = warped fbm(x/820, y/820)` threshold 0.575; golden field `G = warped fbm(x/640+40.3, y/640-25.7)` threshold 0.57; path `P = perlin` of a domain-warped position at scale 560, with half-width `7 + 6*noise(x/260)`; meadow hue `fbm(x/260)`; density `0.76 + 0.5*fbm(x/380)`; bleed zones `smoothstep(.52,.72, noise(x/210))`.
- Thresholded fields are converted to **signed distances** in world units by dividing by the grid gradient (`(f - T) / |∇f|`, clamped ±40).
- Per pixel, edges are perturbed by flow noise: `eF = dF + (WA-0.5)*9 + (PAP-0.5)*0.9`. The coverage is `smoothstep` over `eF / soft` with `soft = 0.45 + 5*bleed` — hard, crisp wash edges normally, wide wet-in-wet blends in bleed zones.
- **Pooling**: inside each edge the pigment density rises by `pool(d) = (1-d/2.6)²` (ramping in over 0.35 units) — the dark rim every real wash has.
- **Paper gaps**: where `WA > 0.55`, a 0.75-unit band at the edge loses 88 % of its pigment — white paper peeks between two washes.
- **Dapples**: meadow density × `(1 - 0.55*clamp((0.32-WB)*9))`, forest × `(1 - 0.42*clamp((WA-0.64)*28))` → pale flecks (visible as light streaks all over the meadow).
- **Granulation**: density × `(1 + (GRA-0.5)*k)` with k = 0.6 meadow, 1.05 forest, 1.2 path; paper tooth × `(1 + (0.5-PAP)*0.45)`.
- **Mixing**: pigments are absorbance triples (meadow cool/sap/ochre by hue, forest payne→indigo by WA, field ochre→sienna by WB, path earth→dark by WA). `out = paper * (0.95 + 0.075*PAP) * EXP[A*512]`.

Decals (drawn into the chunk with ink/wash helpers, via a seamless jittered-grid scatter so chunk borders match):
- Backrun blooms, cell 95, 55 %: wobbly ring r 5–16 units, fill paper at 20 %, multiply stroke 0.65 units at 35 % in the biome dark colour (`M #7d8a4a`, `F #3d4a5c`, `G #a8803a`, `P #8a5a36`).
- Pigment splatter, cell 64: 5–14 dots r 0.12–0.97 along a direction.
- Stones on the path (cell 30, 60 %): grey wash blob 1.6×1.1 × (0.7–2.1) with a partial ink outline on the shadow side; pebbles every 11 units.
- Leaf litter in forests (cell 8): leaf-shaped quads in 6 autumn colours (`#b5602e #cf9a45 #d9772f #a83c2a #8a7a3a #c4823a`), 0.8 alpha, vein line.
- Grass tufts (cell 12; 85 % along path borders, 42 % meadow, 16 % forest, 10 % field): 3–5 tapered blades 2.2–5.6 units long, width 0.36–0.5, alpha 0.45 (blue ink 0.38 in forest).
- Flowers (cell 24, meadow): daisy (5 cream petals 0.75×0.42 + `#d9a52e` centre), poppy (`rgba(196,62,40,.8)`), cornflower (`rgba(84,110,176,.8)`), buttercups (`rgba(232,188,52,.9)`).
- Stubble rows in fields, twigs and red-capped mushrooms in forests.

## Characters

Hero (pumpkin-head child, ~18 units wide, ~30 tall, feet at 0,0, facing right):
- Draw order: back arm (indigo ribbon 2.5→2.0 wide) + hand → legs (brown ribbons 2.3→1.9) + boots (blob 1.9×1.15) → scarf tail behind (red ribbon, waves with a per-frame `wave` value) → coat (12-point spline polygon, width −6..+6.5, y −14..−4) with 3 gold buttons r 0.48 and a centre seam → scarf wrap → **pumpkin head** (14-point ellipse rx 8.5, ry 6.9 at y −19.6, 5-lobe modulation 3.5 %, dented top) with 4 sienna rib strokes → stem + curly tendril + leaf → carved face (two triangular eyes, a nose, a 13-point zigzag grin) as glowing shapes → front arm + hand.
- Every part = `wash()` then `outline()` (width 0.5–0.95, `light` 0.45–0.55, 2–3 pieces). Control points are jittered 0.2 units per frame variant (`jit`).
- Walk: 4 poses with phase `ph = p/4 * TAU`; legs swing `±2.4*sin(ph)`, lifted feet `max(0, ±cos)*1.5`; arms swing `±1.5*sin(ph)`.
- Facing: one baked set facing right; left = horizontally mirrored canvas.
- The carved face also gets an additive warm glow sprite (18×16 units) at the face, flickering.

## Enemies and props

- **Small melee enemy (walking turnip, r 9)**: two root legs (ink strokes 1.25 wide, toes), body 10-point spline (≈17×19 units) washed cream `#eee0ba` with a large violet crown blob (rx 10.6, blur 2), lilac light and plum dark blobs, ochre belly; skin-ring strokes; 3 leaf ribbons on top that sway; angry glowing almond eyes with ink pupils and heavy tapered brows (0.85–0.95 wide); jagged frown. Body rocks ±0.075 rad with the walk.
- **Fast enemy (ghost, r 7)**: 13-point wavy sheet with 3 trailing points that ripple; frost wash with blue shade blobs, `feather: 0.85` (blurred clip → soft edge), 12 salt spots, lost-and-found blue-black ink only on 3 arcs of the outline, blurred hollow eyes and gaping mouth (`#20263e`), reaching arm with 3 claw strokes. Drawn at 90 % alpha, floating.
- **Brute (turnip colossus, r 17)**: 18-point body (34×37 units) in umber with a violet crown blob, ochre belly, dark side; moss patch; two hatching passes (angles −1.0 and 0.55, spacing 1.15/1.4) on the shadow side; 4 glowing cracks (blurred `#ffc548` 1.5 wide + `#fff0b0` 0.4 core + offset ink) from a glowing core; glowing eye sockets; thick brow stroke 1.55; withered leaf crown; massive arms and legs (ribbons 5–5.6 wide). Additive pulsing core glow per frame.
- **Pickups**: gem drop (8-point teardrop, gold wash, 0.42 ink, specular dot), big gem (5-point star 5.0/2.4 with 4 radiating ink ticks); seed projectile (cream ellipse 6.8×3.8 units); orbiting lantern (small carved violet turnip with glowing face).
- **Props**: deciduous trees (64×98 units; trunk wash + 4 branch strokes + 7 overlapping crown glazes in autumn palettes, an indigo multiply glaze on the lower right, scallop strokes along the shadow edge, falling leaves; fade to 42 % when the hero walks behind), firs (5 zigzag tiers, partial outlines), bushes (3 blobs + optional red berries), pumpkins (plain/carved), haystacks (26 straw strokes following the dome), fences, dry-stone walls, signposts with scribbled lettering and a crow, scarecrows, boulders with hatching. All baked once; mirrored variants by flipping.

Readability against the busy ground: characters are more saturated and darker than any ground wash, carry a full-value ink contour that is heaviest at the bottom-right, stand on an indigo shadow glaze, and the ground keeps its darkest marks (grass) at ≤ 45 % alpha.

## Effects and particles

- **Hit**: ink (or orange for lantern hits) splat sprite (16×16 units, blot r 3.4 + 9 droplets), life 0.17 s, alpha 0.7; 3 paint drops (ink + enemy colours) with gravity 240.
- **Kill**: 10 (brute 22) paint drops, speed 75 (110), size 2.4 (3.4); a ground bloom ring tinted violet/ghost/sienna, 1.0–1.4 s, radius grows with outQuad; a big colour splat 0.28 s. The enemy plays 4 dissolve frames (drip + noise erosion toward paper).
- **Paint drops** land: when `z <= 0.3`, they are drawn on the ground layer as flattened stains (size × 1.15, height × 0.6).
- **Spawn**: wash puddle in the enemy colour spreading under a blurred copy; the crisp sprite fades in.
- **Pickup**: 1 (big: 5) golden star sprites 4.5–7 units.
- **Level-up**: gold bloom ring (10 → 44 units, 1.2 s) + 14 stars radiating.
- **Dash**: indigo dry-brush smear (9 strokes) + 2 ghost copies at 22 %/11 % alpha + 4 umber drops.
- **Hurt**: red splat 18 units + 8 drops; the page margin is replaced by an alizarin wash creeping in (`alpha = hurtT`).
- **Hero death**: big orange splat 34 units, 24 drops in orange/indigo/red/ink, orange ring 44 units.

## Lighting, shadows and post-processing

- Light from the upper left; baked into every wash (highlight at 30 %/26 % of the bbox, dark blob bottom-right) and into ink width (`w *= 1 - light * dot(normal, L)`).
- Shadows: union `Path2D` of ellipses, offset (+0.8, +0.4) units, hero 7.6×2.8, enemies `r*0.95 × r*0.34`, props per type (tree 21×6.5); one fill `rgba(50,54,92,0.2)`; ghosts 5.2×1.9 at 0.11.
- Glows: radial sprite `rgba(255,226,140,.95) → rgba(255,196,90,.5) @35 % → 0`, composited `lighter` at 0.22–0.38 alpha with sine flicker; lantern light pools on the ground at 0.55.
- No colour grading, bloom or vignette shader. The only full-screen post effect is the page margin: `smoothstep` paper fade (32 %), a sienna rim line `rgb(120,82,58)` at 22 % 3.5 units inside the edge, then opaque paper outside; the rounded-rect edge is perturbed by `(WA-0.5)*22 + (PAP-0.5)*3` px → a torn deckle edge.

## UI and HUD

- **XP bar**: full width at the top, 20 px tall, paper backing at 55 %, an ochre wash stroke (`#dca23a` + blobs `#f2cd72 #c27a22 #e8b44a`, rim `#9a5a14`) masked with a ragged right edge, inside a hand-inked frame (4 tapered lines overshooting the corners by 6 px).
- **HP**: watercolour heart icon, red wash bar 236×22 (`#c23b2b`, blobs `#e06a50 #9a2418`), inked frame, value in IM Fell English SC 19 px.
- **Clock**: IM Fell English SC 40 px on a feathered paper plaque, Caveat 700 20 px label in `#8a3a1e` above an ink swash ornament.
- **Kill counter**: turnip icon + IM Fell 30 px.
- **Level-up**: dark warm veil, a gold wash banner with dry-brush ends behind the title, three deckle-edged paper cards (224×292, rotated −1.4°/0°/+1.1°, drop shadow) each with a painted icon, IM Fell name, italic Cormorant description and a Caveat key number in `#a3532c`.
- Icons are painted with the same wash/outline functions in a 100×100 space with a larger misregistration (1.6/1.3) and thicker lines at ≤ 48 px.

```css
.hud-bar { position: relative; height: 22px; background: rgba(245,238,222,.62);
  border: 1.5px solid rgba(42,27,20,.9);
  border-radius: 255px 18px 225px 18px / 18px 225px 18px 255px; }
.hud-bar > .fill { height: 100%; background: linear-gradient(90deg, #c23b2b, #d8483a 40%, #9a2418); }
.hud-text { font: 400 19px 'IM Fell English SC', Georgia, serif; color: #2a1b14;
  text-shadow: 0 0 3px #f5eede, 0 0 7px #f5eede, 0 0 12px rgba(245,238,222,.8); }
.hud-label { font: 700 20px 'Caveat', 'Segoe Print', cursive; color: #8a3a1e; }
.panel { background: #f5eede; color: #2a1b14; border: 1.5px solid rgba(42,27,20,.85);
  border-radius: 255px 18px 225px 18px / 18px 225px 18px 255px;
  box-shadow: 0 3px 12px rgba(60,40,20,.3); padding: 6px 24px; }
.card { width: 224px; min-height: 292px; padding: 34px 24px 28px; background: #f5eede;
  filter: drop-shadow(0 8px 10px rgba(30,18,8,.45)); transform: rotate(-1.4deg); }
.card .name { font: 400 23px 'IM Fell English SC', serif; }
.card .desc { font: italic 600 18px 'Cormorant Garamond', serif; color: #5b3a24; }
.card .key  { font: 700 24px 'Caveat', cursive; color: #a3532c; }
.veil { background: radial-gradient(ellipse at 50% 46%, rgba(245,238,222,.28), rgba(58,40,26,.68) 78%); }
```

For the bar fills, the reference bakes a wash texture (see `wash()`) to a data-URL and uses it as `background`, with a ragged-edge PNG mask on the right end.

## Motion and animation

- Hero walk: 4 poses; phase `anim * 0.8`; bob `-0.9 * |cos(phase·π/2)|`; idle bob `sin(t·2.4)·0.35`.
- Line boil: hero 3 variants at 6 fps, enemies 2 variants at 5 fps (offset by a per-enemy seed) — the hand-drawn line "breathes".
- Enemy pose speed: turnip `anim * 0.7`, ghost 0.35, brute 0.45; per-enemy scale 0.93–1.07.
- Ghost float `-2.2 + sin(t·3 + seed·9)·1.3`.
- Hit flash: white-paper copy at `min(0.55, flash·1.2)` alpha (never a pure white silhouette).
- Hero i-frames: 50 % alpha blink at 16 Hz.
- Gems: 3 variants at 4 fps; pop scale `1 + sin(pop·π)·0.7`.
- Damage numbers pop 0.55 → 1.15 in 12 % of life, then shrink slightly.
- Spawn: vertical squash 0.75 → 1 with outQuad over the spawn time.

## Do and don't

Do:
- Mix ground colour per pixel in absorbance space and darken wash edges (pooling, paper gaps).
- Wash first, ink second; offset the wash ~0.45/0.35 units from the ink (misregistration).
- Break contours into 2–3 tapered pieces, thicker on the shadow side.
- Put wet-in-wet blobs of neighbouring hues inside every shape.
- Keep the ground light and low-chroma; give characters the saturated colour.
- Bake every frame and boil variant once; per frame only `drawImage`.
- Frame the screen with a deckled paper margin and use the storybook serif + handwriting fonts.

Don't:
- Use flat fills with uniform black strokes (that becomes cartoon vector art).
- Use pure black ink or grey shadows.
- Alpha-blend biomes in RGB (muddy grey seams).
- Draw closed, constant-width outlines.
- Run canvas `filter: blur()` washes per frame.
- Add glossy specular highlights, neon glows or saturated full-screen effects.
- Let the world fill the page margin.

## Implementation recipe

1. Set up a 360-unit-tall world camera; choose 3 px/unit for sprite bakes.
2. Build the noise textures (`noiseTex`: white noise → box blur ×3 → normalise) for paper, granules and two wash-flow fields, the `EXP` table and the grain canvas.
3. Implement the brush toolkit: `spline` (Catmull-Rom), `jit`, `blobPts`, `ribbon`, `inkLine` (filled variable-width ribbon), `outline` (broken contour), `wash` (scratch canvas: fill → blobs → highlight → rim → grain → clip/feather → offset composite), `glowShape`.
4. Write each character as a function `(ctx, pose, rng)` in world units with feet at (0,0): back parts first, each part = wash + outline. Use the palette triplets (base / light / dark / rim).
5. Bake frames: for every pose × boil variant create a sprite with a different seed; also mirrored, flash and (optionally) dissolve copies.
6. Write the ground shader: world fields on a coarse grid → signed distances → per pixel edge noise, coverage, pooling, gaps, dapples, granulation → absorbance mix → `paper * exp(-A)`. Then scatter decals (blooms, stones, grass tufts, flowers) with a jittered-grid scatter seeded per cell. Cache per chunk (or once for a fixed screen).
7. Per frame: blit ground, fill the shadow union once, draw y-sorted sprites, additive glows, projectiles, particles, numbers.
8. Build the page-margin overlay once per screen size (only the edge bands) and blit it last.
9. Do the HUD as washes inside hand-inked frames with IM Fell English SC / Cormorant Garamond / Caveat.
10. Test readability with a big crowd: if enemies merge, push their ink weight up, separate hues per type, and lower ground decal alpha.

## Code

The snippets below are ported from the reference module and run on their own. `starter.js` in this folder combines them into a full working scene (ground shader, hero, turnip enemy, ghost, gems, projectile, HUD, page margin). The complete implementation (brute, props, icons, HUD textures, particles) is in [`../../js/styles/watercolor.js`](../../js/styles/watercolor.js).

Variable-width ink line (the core of every contour):

```js
const LX = -0.6, LY = -0.8; // towards the light
function inkLine(ctx, P, o) {           // P = dense points, o = {w, ta, tb, wv, ph, light, cx, cy, color, alpha}
  const n = P.length; if (n < 2) return;
  const acc = [0];
  for (let i = 1; i < n; i++) acc[i] = acc[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
  const tot = acc[n - 1] || 1, ta = o.ta ?? 0.2, tb = o.tb ?? 0.3, wv = o.wv ?? 0.3, ph = o.ph || 0, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, tx = (b[0] - a[0]) / l, ty = (b[1] - a[1]) / l, u = acc[i] / tot;
    let w = o.w;
    if (u < ta) w *= 0.2 + 0.8 * Math.sqrt(u / ta);                       // pen lands
    if (u > 1 - tb) w *= 0.1 + 0.9 * Math.sqrt(Math.max(0, 1 - u) / tb); // pen lifts
    w *= 1 + wv * (0.6 * Math.sin(acc[i] * 0.8 + ph) + 0.4 * Math.sin(acc[i] * 2.1 + ph * 2.3)); // pressure
    if (o.light) { const nx = P[i][0] - o.cx, ny = P[i][1] - o.cy, nl = Math.hypot(nx, ny) || 1; w *= 1 - o.light * (nx * LX + ny * LY) / nl; }
    w = Math.max(0.04, w) / 2;
    L.push([P[i][0] - ty * w, P[i][1] + tx * w]); R.push([P[i][0] + ty * w, P[i][1] - tx * w]);
  }
  const Q = L.concat(R.reverse());
  ctx.beginPath(); ctx.moveTo(Q[0][0], Q[0][1]); for (const p of Q) ctx.lineTo(p[0], p[1]); ctx.closePath();
  ctx.globalAlpha = o.alpha ?? 1; ctx.fillStyle = o.color || '#2a1b14'; ctx.fill(); ctx.globalAlpha = 1;
}
```

Broken contour around a closed ring (pen lifted 2–3 times, small overshoots):

```js
function outline(ctx, P, o, rnd) {      // rnd = seeded () => [0,1)
  const n = P.length, pieces = o.pieces || 2;
  let cx = 0, cy = 0; for (const p of P) { cx += p[0] / n; cy += p[1] / n; }
  let s = (rnd() * n) | 0, rem = n;
  for (let i = 0; i < pieces; i++) {
    const len = i === pieces - 1 ? rem : Math.round(rem / (pieces - i) * (0.75 + rnd() * 0.5));
    rem -= len;
    const seg = [];
    for (let j = 0; j < len + Math.round((rnd() - 0.3) * 4); j++) seg.push(P[(s + j) % n]);
    if (seg.length > 1) inkLine(ctx, seg, { cx, cy, ta: 0.12, tb: 0.16, light: 0.45, ...o, ph: rnd() * 10 });
    s += len;
  }
}
```

Sprite wash on a scratch canvas (wet-in-wet blobs, highlight, pooled rim, granulation, misregistration):

```js
let SCR = null; const MIS = [0.45, 0.35];
function wash(ctx, P, o, grain /* 256² multiply canvas, see starter.js */) {
  const cv = ctx.canvas, m = ctx.getTransform(), k = Math.hypot(m.a, m.b);
  if (!SCR || SCR.width !== cv.width || SCR.height !== cv.height) { SCR = document.createElement('canvas'); SCR.width = cv.width; SCR.height = cv.height; }
  const t = SCR.getContext('2d'), path = () => { t.beginPath(); t.moveTo(P[0][0], P[0][1]); for (const p of P) t.lineTo(p[0], p[1]); t.closePath(); };
  t.setTransform(1, 0, 0, 1, 0, 0); t.globalCompositeOperation = 'source-over'; t.clearRect(0, 0, cv.width, cv.height); t.setTransform(m);
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of P) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
  path(); t.fillStyle = o.c; t.fill();
  t.globalCompositeOperation = 'source-atop';                       // everything below stays inside the shape
  for (const b of o.blobs || []) { t.filter = `blur(${(b.blur ?? 2) * k}px)`; t.globalAlpha = b.a ?? 0.7; t.fillStyle = b.c; t.beginPath(); t.ellipse(b.x, b.y, b.rx, b.ry ?? b.rx, 0, 0, Math.PI * 2); t.fill(); }
  t.filter = 'none'; t.globalAlpha = 1;
  const lx = x0 + (x1 - x0) * 0.3, ly = y0 + (y1 - y0) * 0.26, g = t.createRadialGradient(lx, ly, 0, lx, ly, Math.max(x1 - x0, y1 - y0) * 0.62), ha = o.hi ?? 0.4;
  g.addColorStop(0, `rgba(255,251,238,${ha})`); g.addColorStop(0.55, `rgba(255,251,238,${ha * 0.35})`); g.addColorStop(1, 'rgba(255,251,238,0)');
  t.fillStyle = g; t.fillRect(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4);
  t.filter = `blur(${0.55 * k}px)`; t.globalAlpha = o.rimA ?? 0.6; t.strokeStyle = o.edge || o.c; t.lineWidth = o.rim ?? 1.4; path(); t.stroke();
  t.filter = 'none'; t.globalAlpha = o.gran ?? 0.55;
  if (grain) { t.setTransform(1, 0, 0, 1, 0, 0); t.globalCompositeOperation = 'multiply'; t.fillStyle = t.createPattern(grain, 'repeat'); t.fillRect(0, 0, cv.width, cv.height); t.setTransform(m); }
  t.globalAlpha = 1; t.globalCompositeOperation = 'destination-in'; path(); t.fillStyle = '#000'; t.fill(); // clip (grain spilled outside)
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(SCR, Math.round(MIS[0] * k), Math.round(MIS[1] * k)); ctx.restore();
}
```

Ground pigment mixing core (per pixel; `eX` = noisy signed distance to each biome edge in world units):

```js
const PAPER = [245, 238, 222];
const ab = (rgb) => rgb.map((v, i) => -Math.log(Math.max(4, v) / PAPER[i]));   // colour -> absorbance
const MEADOW = ab([178, 198, 162]), PATH = ab([216, 184, 148]);
const sst = (t) => t <= -1 ? 0 : t >= 1 ? 1 : ((t + 1) / 2) ** 2 * (2 - t);     // smoothstep on [-1,1]
const pool = (d) => d <= 0 || d >= 2.6 ? 0 : (1 - d / 2.6) ** 2 * (d < 0.35 ? d / 0.35 : 1);
function shadePixel(eP, wa, gr, pap, out) {   // eP > 0 inside the path; wa/gr/pap = flow, granule, paper noise in [0,1]
  const wP = sst(eP / 0.5), wM = 1 - wP;
  const kM = 1 + 0.5 * pool(-eP), kP = 1 + 0.9 * pool(eP);                         // pigment pools at both edges
  const gap = Math.max(0, Math.min(1, (wa - 0.55) * 7)) * Math.max(0, 1 - Math.abs(eP) / 0.75) * 0.6;
  const gran = (1 + (gr - 0.5) * (0.6 * wM + 1.2 * wP)) * (1 + (0.5 - pap) * 0.45), mul = (1 - 0.88 * Math.min(1, gap)) * gran;
  for (let k = 0; k < 3; k++) {
    const A = wM * kM * 0.9 * mul * MEADOW[k] + wP * kP * (0.82 + 0.35 * wa) * mul * PATH[k];
    out[k] = PAPER[k] * (0.95 + 0.075 * pap) * Math.exp(-A);                       // Beer-Lambert over paper
  }
}
```

## Adapting it to your game

Keep fixed: paper `#f5eede` and its texture, sepia ink, the wash recipe (base + 2–3 blobs + highlight + rim + grain + offset), broken tapered contours thicker on the shadow side, indigo glaze shadows, absorbance-space ground mixing with pooled edges, the page margin and the three fonts.

May change:
- **Biomes**: replace meadow/forest/field/path with snow (cool `#dfe6ec` / `#b8c4d6` washes, ink `#252c46`), desert (ochre/sienna), swamp (payne grey/sap) — just swap the absorbance colours; keep them light (each channel ≥ 130).
- **Characters**: any species works if it keeps big heads, chunky silhouettes and the triplet palette (base/light/dark + rim). Give each enemy class its own hue family so crowds stay distinguishable.
- **Genres**: side-scrollers can use the same washes for parallax layers (far layers: lower density, more bleed, no ink). Card/board games can reuse the deckle card and banner textures.
- **Resolution**: bake sprites at `ceil(screenPxPerUnit)`; below 2 px/unit drop granulation and rim blur (they vanish anyway).
- **Night scenes**: darken via an indigo multiply glaze over the ground, keep carved-glow light sources — never switch the ink to black.

## Performance notes

- Init is the expensive part (1–3 s in the reference): noise textures (two 1024² fields with 3 layers × 3 blur passes), ~60 character frames, ~25 props, FX and HUD textures. Every `wash()` uses 2–5 canvas blur filters on a scratch canvas the size of the sprite. Show a loading state or spread baking over frames.
- Ground chunks: per-pixel shader ~0.4 M pixels per 256-unit chunk at 2.5 px/unit; the reference builds it in a generator (yield every 1–2 rows, `putImageData` in 128-row bands) with a 5 ms/frame budget and keeps ~90 chunks cached. One reusable `ImageData` avoids 1.6 MB garbage per chunk.
- Per frame is cheap: chunk blits, one shadow `Path2D` fill, sprite `drawImage`s, 3–20 additive glows, particles from pre-baked sprites, and 4 margin strips (only the 11 % band is ever drawn). Target < 4 ms with hundreds of enemies.
- Never call `wash()`, `filter` or `getImageData` per frame. Animation = choosing among baked frames.
- `starter.js` bakes everything on its first `draw()` call (ground for the current canvas size, sprites, page margin) and then runs at well under 1 ms per frame.

## Copy-paste prompt

```text
Build my game <X> in the "Watercolor Storybook" style (miwale Game Style Library):
- Canvas 2D, procedural, 360 world units tall; light from the upper left; bake everything at init.
- Paper #f5eede is the white; ink is sepia #2a1b14 (blue-black #252c46 for cold things), never black.
- Ground: per-pixel watercolour shader. Mix biome washes in absorbance space (paper*exp(-A)),
  darken pigment pooling within 2.6 units inside every wash edge, leave 0.75-unit paper gaps,
  add granulation and pale dapples; keep it light and low-chroma (meadow #b2c6a2/#c2cc96, path #d8b894).
- Decals: inked grass tufts (3-5 tapered blades, 45 % alpha), tiny flowers, stones, bloom rings.
- Every shape = wash (base + lighter top-left blob + darker bottom-right blob, radial paper highlight,
  blurred darker rim, grain multiply) offset 0.45/0.35 units from a tapered, wobbling ink contour
  broken into 2-3 pieces and thicker on the shadow side (0.7-0.95 units for bodies).
- Characters: big heads, chunky storybook silhouettes; carved glowing yellow (#ffcf55/#fff6cf) faces.
- Bake 4 walk poses x 2-3 "boil" variants (re-jittered strokes) and cycle boils at 5-6 fps.
- Shadows: one indigo glaze rgba(50,54,92,0.2) union of ellipses per frame.
- Effects: paint splats, paint drops that land as stains, bloom rings, dry-brush trails, gold stars.
- Frame the screen with a deckled bare-paper margin. HUD = wash bars in hand-inked frames.
- Fonts: IM Fell English SC (titles/numbers), Cormorant Garamond (body), Caveat (handwritten labels).
```
