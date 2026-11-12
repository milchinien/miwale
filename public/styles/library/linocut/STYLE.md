# Linocut — Game Art Style Spec

> A moving linocut print: cream paper, carbon-black key plate, one misregistered pumpkin-orange spot plate and a sparing teal.

Everything looks like a hand-pulled linocut or woodcut print come alive. Every shape is either solid black ink with white gouges carved out of it, or bare paper with black knife marks cut into the surrounding block. Lines never have constant width: each mark is a pointed "lens" or a "taper" with a blunt start and sharp tip, exactly like a V-gouge cut. Colour comes from one pumpkin-orange spot plate printed slightly off-register, so a sliver of paper shows along one edge, and a very sparing teal second spot. There are no gradients anywhere – tone is only line density, stipple and hatching. The module's cast – a cloaked main character with a round, lobed orange head and a carved face, root-bulb creatures with solid ink crowns, paper spirits and a towering ink giant – is just an example of how to apply it.

## At a glance

| | |
| --- | --- |
| Family | Printmaking · Linocut |
| Mood | folkloric, bold, graphic, eerie, handmade |
| Best for | top-down action, folk-horror and fairy-tale games, card/board games, narrative art |
| Renderer | Canvas 2D, procedural, no image assets |
| Pixel art | No – native resolution, sprites baked at 2–5 px per world unit |
| Complexity | 6/10 – every new figure needs white lines carved into black; dense groups blur to black |
| Fonts | Rye, Alfa Slab One, Special Elite |
| Key colours | paper `#f0e7d2`, ink `#1b1715`, orange `#ea6820`, teal `#2e7674` |

## When to use it

Good fits:
- **Top-down action with clear silhouettes** – two values make every figure pop on paper.
- **Folk horror, fairy tales, legends, western** – reads as an old broadsheet or chapbook.
- **Card, board and narrative games** – static art looks like real prints.
- **Low-budget but striking**: one spot colour is a strong brand.

Bad fits:
- **Many-colour coding** (match-3, team colours) – you only have ink, paper, orange and a hint of teal.
- **Scenes with dozens of figures at once** – many black figures merge into one black mass unless halos and spacing are generous.
- **Soft, cozy pastel games** – the style is high-contrast and graphic.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Paper | `#f0e7d2` | Ground, halos, carved highlights (~65%) |
| Ink | `#1b1715` | Key plate – outlines, solid masses, all marks (~30%) |
| Pumpkin Orange | `#ea6820` | The one spot plate – main character's head, glowing cores, lantern faces, collectibles, progress bar, large floating numbers (~4%) |
| Teal | `#2e7674` | Sparing second spot – frost stipple on the floating creature, core ring of the large creature, centre of the large collectible (<1%) |
| Paper Shade | `#e2d6ba` | Darkest paper fibres (paper − 14) |
| Ink Deep | `#0d0b0a` | Hard offset shadows on cards and panels |

Palette rules:
- **Two values + flat spots.** No gradients, no alpha shading, no blur, no grey.
- **Misregistration**: the orange plate is always drawn offset by `MX = 0.8, MY = 0.55` world units (x mirrored with facing); teal by `TX = −0.55, TY = 0.45`. Same offset on every object – it is the style's signature.
- Spot colour appears inside a hole cut in the key plate (`holeSpot`: fill paper, then the colour shifted and clipped), or as its own plate under a black outline (collectible stars, seeds).
- Darker = more/wider black marks. Lighter = more white gouges.
- Paper fibres darken ink slightly (`ink + fibre·0.4`) and ink has pinholes where paper shows through.

## Typography

- **Rye** 400 – woodtype display for titles (72px for big announcement titles, 66px for end-screen titles), the clock (34px) and card keys. `https://fonts.googleapis.com/css2?family=Rye`
  `font: 400 34px/1.05 'Rye', Georgia, serif; letter-spacing: 2px; color: #1b1715; text-shadow: 2px 2px 0 #ea6820;`
  Titles on dark overlays: paper colour with `text-shadow: 5px 4px 0 #ea6820` (the misregistered orange plate behind the type).
- **Alfa Slab One** 400 – numbers: bar value text (17px), counters (22px), badge numbers (13px, paper on an ink block), floating numbers, card names (20px with a 2px ink underline). `https://fonts.googleapis.com/css2?family=Alfa+Slab+One`
  Bar value text gets an 8-direction 2px paper outline via `text-shadow` so it reads over the striped bar.
- **Special Elite** 400 – typewriter labels and descriptions (11–19px, letter-spacing 2–3px, labels with a 2px ink rule above). `https://fonts.googleapis.com/css2?family=Special+Elite`

Floating numbers (canvas): small = ink fill over a paper stroke of 0.3× font size (8.5 units tall); large = 11.5 units, paper stroke 0.36×, an ink copy offset by `(MX, MY)·0.6`, a thin ink outline, then orange fill – i.e. a two-plate print.

## Rendering technique

1. **Init** – `K = clamp(round(screenH / 360 · 4) / 4, 2, 5)` px per world unit. Build textures: the 512² paper fibre map `FIB` (Int8, −22…+14) and the 256² ink void map `VOID`.
2. **Carving toolkit** (all marks are *fills*, see Code): `lens(x0,y0,x1,y1,w,bend)` – two quadratic curves meeting in points; `taper` – blunt round start, sharp tip; `limb(pts,w0,w1)` – Catmull-Rom spline with tapering width and round caps; `smoothPath`; `crescent` – shape minus a shrunken copy shifted to the light, filled even-odd (heavy shadow contour); `holeSpot` – cut hole showing a misregistered spot plate.
3. **Figure recipe**: fill the form (paper or ink) → print the orange plate offset → clip and carve (black lenses on paper / white lenses on black) → `crescent` on the shadow side → thin ink outline 0.5–0.75 → carved face → top details (stem, leaf, teeth).
4. **Sprite bake `mk`**: draw at K px/unit with feet at the anchor; **paper halo** – a paper-tinted silhouette drawn 12× around a 0.5–0.9-unit circle with `destination-over`; **inkify** – per pixel: dark pixels where `VOID > 238` move 72% toward paper (pinholes), orange pixels get ×0.93–1.05 density and rare paper voids.
5. **Derived sprites**: negative print (`invert`, luminance mapped paper↔ink, saturated pixels → ink) for flashes; a cracked block (carved paper cracks) and shatter shards (4–6 wedges cut from the centre with jittered radial cuts, paper-coloured cut edges 0.7 units wide); orange-tinted copy of the dash pose for overprint after-images; brayer, registration mark and drifting-leaf sprites.
6. **Poses and pulls**: main character 8 computed walk poses + 4 idle breathing poses + blink + crouch + dash + recoil; each creature 6 poses. Every pose is baked as 2 carving pulls (jitter seeds `100 + v·17 + i`) × 2 facings (drawn mirrored, the orange offset mirrors too) plus a negative print.
7. **Ground chunks** (256 units, ≤ 2.5 px/unit): generator; 84×84 field grid, distances via value/|gradient|, per-pixel analytic ink coverage `a` per region, then `paper + fibre → mix toward ink by a` with pinholes; then decals.
8. **Per frame**: ground → splats → collectibles → hatched shadows → y-sorted props/creatures/main character → orbiting objects → projectiles → particles → floating numbers → drifting leaves → registration marks + ragged ink frame. Only `drawImage` of cached canvases; blit positions snapped to screen pixels.

## World and ground

The ground is a carved print on fibrous paper: every region is a different cut pattern, separated from its neighbours by bare paper gutters.

Fields (world units): `B = warped fbm(x/1000)` (biome), `D = fbm(x/300) + (B − 0.55)·0.6` (dark soil when `D > 0.74`), `R = perlin(x/3400)` warped (road where distance < 11). Biomes: `B < 0.455` field, `B > 0.565` forest, else meadow. All regions are separated by a **1.5-unit paper gutter** – carved patterns stop short of the edge, like separately cut areas of the block.

Per-region carved pattern (analytic per pixel, coverage 0…1 anti-aliased with `(halfwidth − distance)·res + 0.5`):
- **Paper** (base of everything): `#f0e7d2 + FIB` (1300 short curved fibres ±0.13 alpha, mottling ±4.5, grain ±3).
- **Meadow** (mostly clean paper): grass ticks on a 9-unit hashed grid, but **only in clumps and drifts** – density `max(0.8·smoothstep(0.57, 0.72, T)·smoothstep(0.4, 0.62, M), 0.55·edge²)` with T = fbm/140 (clump field), M = fbm/19 (clump breakup) and `edge` = 1 at a region border fading out over 8 units. Each tick has 1–3 tapered blades (angles 0.16, −0.5, 0.75 rad; length 2.2–3.55; half-width 0.46 → 0). Between the clumps the paper stays bare except for rare "chatter": 3–5 parallel short gouges on a 27-unit grid (30% of cells). Flowers and pebbles use the same clump field, so they gather where the grass is.
- **Ploughed field**: furrow lines from a warped scalar `F = (y + 0.22x + 110·(fbm − 0.5) + 9·perlin) / 4.4`; distance to the nearest line centre is `|frac(F) − 0.5| / |∇F|`; half-width `0.66·smoothstep(0.27, 0.7, M)·(0.72 + 0.56·T)` (34% of lines thinner). A carved ditch line 0.88 wide along the field edge. Leafy sprouts and clods are snapped onto furrows.
- **Forest floor**: three carved edge cuts 0.5, 2.5 and 4.3 units inside the border (widths 0.84, 0.6, 0.4), a clean band behind them (smoothstep 7 → 17 units), then oriented litter flecks (cell 4.3, length 1.3–2.8, aligned with the flow field) whose density is `0.015 + 0.72·smoothstep(0.5, 0.7, T)` – almost bare floor with dense drifts of litter, mushrooms and leaves.
- **Dark soil**: solid ink; two paper "echo" contours at 1.8 (width 0.6) and 3.4 (0.44) units inside the edge – the classic linocut outline ripple; deeper than 4.3 units, short oriented white gouge flecks (cell 4.3, 62% filled, length 1.3–2.8, aligned with the field direction ± 0.35 rad).
- **Road** (22 units wide): a curb line, then cobbles from Worley noise (cell 4.4): paper joints `(f2 − f1)·2.2 < 0.36`, stones hatched with 45° lines on their shadow side, 1 in 16 stones solid ink.
- **Ink texture**: all ink on the ground gets pinhole voids from the `VOID` map and paper fibres showing through.
- **Decals** (knocked out with a paper disc first, then carved): 5-petal flowers, stars, pebbles, skulls, bones, leaves with veins, twigs, mushrooms, leafy sprouts, round root bulbs, clods, and **carved roots** radiating from every tree into the ground (4–6 tapered limbs, 9–16 units).

## Characters

All figures share one construction: a paper-filled form carved with black lenses plus a solid-ink form carved with white gouges, the orange plate on one focal element, a crescent shadow at the lower right, a thin 0.5–0.75 ink outline and a carved face. Every sprite gets a 1.0–1.15-unit paper halo so it separates from black ground and from other figures. Every drawer works in a mirrored local space (`scale(f,1)`), so the lit side is local x-sign `LS = −f` – carved highlights always land on the screen's upper left.

**Main character** – a pumpkin-headed wanderer, feet at (0,0), ~18 × 30 units:
- **Legs**: two-bone legs – the knee is solved from hip, ankle and leg length (`kneeAt`, bent toward the facing direction); `limb` half-width 1.15 → 0.9; boots = ink ellipses with a paper shine lens; the near leg gets a paper gutter so it separates from the far one.
- **Poncho**: a short, ragged solid-ink poncho with a V-cut hem; the front hem flutters (`hem`), the back hem trails (`hemBack`). Carved white folds fan from the neck to the hem points on the lit side; a **paper folk band** (zigzag with a dot in every tooth) and a stitched hem band.
- **Scarf**: a long striped paper scarf wrapped at the neck; its tail hangs at rest and streams back when moving (`scarf`, `scarfLift`), waving with a lag.
- **Arms**: far arm mostly hidden behind the poncho; near arm = ink sleeve behind a paper gutter, paper mitten.
- **Head**: a lobed orange gourd – 22-point lobed ellipse 7.3 × 6.2; paper fill, **orange plate offset** `(MX·f, MY)`; clipped carving: rib lenses, shading lenses widening 0.16 → 0.44 on the shadow side; **crescent** shift (−1.0, −0.85) scale 0.93; outline 0.75. Carved face (triangle eyes, jagged grin), white gouge highlights on the lit side, a stem with a **curly leaf** that lags every move.
- **Pose table** (`jackPose`): `bob, lean, legs[[x, lift, heel]×2], hand, farHand, hem, hemBack, scarf, scarfLift, headDy, tilt, leaf, eyes, mouth`.
- **Walk** = 8 computed poses `ph = i/8·2π`: foot x = `0.2 + 3.4·cos(p)` (the other leg at p + π), lifted `−sin(p)·2.1` while swinging, heel up on the trailing foot; bob `0.85·sin(2ph)` (down at contact, up at passing), lean 0.07, hands counter-swing (`3.0 − 2.9·cos ph` / `−1.8 + 2.4·cos ph`). Follow-through: head `0.4·sin(2ph − 1.0)`, hem `0.75·sin(2ph − 1.1)`, leaf `1.1·sin(2ph − 1.6)`, scarf `sin(2ph − 1.8)` – each part arrives later than the body.
- **Idle** = 4 held breathing poses (rise, hold, sink, settle; bob 0 / 0.3 / 0.5 / 0.22) with the head and leaf lagging the chest, plus a **blink** pose. **Crouch** (anticipation: bob 1.7, arms back), **dash** (lean 0.34, back hem 3.2, scarf lifted 2.2, leaf whipped back), **recoil** (thrown back −0.24, arm flung up, a foot off the ground, eyes wide, mouth open).

**Small creature** (a root bulb, ~23 × 30): root legs, root arms that swing against the legs, a curling tap root behind (lags the most), leaves behind the bulb that swing after the body; inside the bulb a **solid ink crown** with white highlights and a **carved paper rim** on the lit edge (keeps the dark crowns apart in a crowd); angry carved eyes and brow, a grimace with teeth. 6 poses.

**Fast creature** (a hungry sheet-spirit, ~30 × 26): paper body with a **teal stipple plate** offset by (TX, TY), ink shading lenses on the shadow side, crescent; hollow eyes and a wailing mouth that opens and closes; a back arm and a front arm reaching alternately with claw fingers; a whipping tail that **breaks up into halftone dots**. Hovers 1.6–4.2 units above its shadow. 6 poses.

**Large creature** (a root giant, ~50 × 58): solid ink body with **concentric white arc gouges** on the upper left, white crack limbs from the core, a paper rim crescent on the lit edge, heavy arms with root fingers and a crown of leaves; the **glowing core** is an orange plate in a hole with a teal ring and carved rays and flickers between poses. 6 poses.

**Shadows** are hatched, never soft: horizontal ink lenses filling an ellipse, shifted right (light from the upper left). Main character 6.4 × 2.0, small creature 7.4 × 2.2, fast creature 4.6 × 1.4 (shrinks as it rises), large creature 16 × 4.

## Props

Scenery is carved the same way as the characters: y-sorted sprites with a paper halo and a hatched lens shadow. Light comes from the upper left, so white gouges sit on the lit side and crescents on the shadow side. Props are **placed by the land**, never sprinkled: spruces (40%), canopy trees and oaks in forest regions (62% of 92-unit cells deep inside, 30% near the edge), a few lone trees in meadows; stumps and boulders gather at forest edges and beside roads; lantern poles line the roads (4–12 units from the curb); graves cluster in graveyard zones (noise > 0.66); fences, scarecrows, crow posts and haystacks only in open meadows and fields.

- **Bare oak** (3 variants): carved roots, trunk `limb` 4.4 → 3.0, recursive branches 3 levels deep with widths ×0.6, white bark gouges on the lit side, a knot hole.
- **Canopy tree** (3 variants, one tall and narrow): **one** black canopy mass whose leaves are carved as rows of **fish-scale U-cuts** following the outline – dense on the lit upper left, sparse on the shadow side – over a forked trunk that shows through a gap under the canopy; a few leaf points hang from the shadowed underside.
- **Spruce** (2): 6 toothed tiers with white lenses.
- **Stump** (2): paper cut face with carved growth rings and a check crack over an ink trunk.
- **Boulders** (2): planar-carved ink masses – a cleared top facet hatched with parallel cuts, paper gutters between stones.
- **Graves**: round with a cross, Celtic cross, slab with a carved skull.
- **Fences** with a broken rail; a **scarecrow** with a root-bulb head and hat; **lantern poles** with flat orange ray stars; **crow posts** (2-frame beak); **haystacks** (paper dome with 17 converging ink lenses).
- **Roots**: every tree sends 4–6 tapered carved roots (9–16 units) into the ground decal layer – the tree's contact with the ground.
- **Shadows**: horizontal ink lens hatching, shifted right; tree shadow 19 × 4.6, spruce 13 × 3.6.
- **Motion**: lantern-pole rays alternate at 3.2 fps; crows open their beak every few seconds.

## Effects and particles

Every effect is layered – **core flash → main shape → debris → residue** – and every layer is a carved or printed object: knock-out stars, lens bursts, wood chips, ink drops, halftone puffs, ink splats.

- **Appear – brayer print** (0.45 s): a **registration mark** (ink cross + misregistered orange copy) is set where the figure will stand (it pops from 60% to 100%); from `spawnT` 0.16 to 0.78 a black **brayer** (ink roller with handle) rolls upward and the figure is revealed from the feet up behind it (clip rect); at 0.78 an **ink splat** is stamped on the ground and the sprite squashes and recovers (`sin(kπ)·0.13·(1 − 0.4k)`).
- **Hit** (0.16 s): the baked **negative print** (paper ↔ ink) is shown while `flash > 0.45`; the sprite squashes `0.17·cos(1.5πk)·(1 − k)` and is shoved 2.4 units along the knock-back with one overshoot. Particles: a paper-white knock-out **flash star** with ink rim (0.08 s) → a black 10-lens **burst** (0.2 s, the orange 8-lens burst for orbiting-object hits) → 2 ink drops and a wood chip with gravity.
- **Disappear – split block** (0.35 s): 0–0.12 the negative print swells (`1 + t·0.9`); 0.12–0.27 a **cracked block** (carved paper cracks); then 4 (large creature 6) wedge **shards** with fresh paper cut edges fly out `(2 + 13·outQuad(u))·size`, rise and fall `−7u + 30u²`, tumble ±(1.4–2.2)·u rad in 10 held steps, shrink after half-way and fade over the last quarter. Debris: 6–16 wood chips (orange ones on the large creature), 4–8 ink drops, 2 halftone puffs. Residue: an **ink splat** that stays 2.2–3.2 s and sinks away in 4 steps.
- **Projectile**: orange seed plate offset under a black outlined seed with a carved shine (2 pulls); trail of 3 black lenses, scaled in over 0.12 s; rotation snapped to 45° steps.
- **Orbiting object**: a carved bulb lantern (ink top, comb, orange face holes) over a slowly rotating 14-spike orange ray star printed offset by (MX, MY).
- **Collectibles**: small = orange 4-point star (offset plate) with ink outline and 4 ink spark lenses (2 frames); large = 8-point orange star, teal centre hole, 8 sparks. Hover on the held float curve, pop to ×1.7 when they appear; on pickup an orange star rises and 2–3 orange chips spring up.
- **Dash**: crouch frame, then the orange plate printed twice behind the figure (6 and 12 units back, `multiply` = overprinting ink), two speed-lens trails, 3 halftone puffs.
- **Glow-up**: a carved ripple **ring** (18 ink gouges with teeth + a 12-arc orange ring on the offset plate) expanding in 9 held steps, an orange lens burst, a flash star, 6 orange stars flying out, a rotating 18-spike orange ray star behind the main character.
- **Halftone puff** (dust): hex grid of ink dots (spacing 1.55) whose radius shrinks toward the edge; 3 frames get lighter.

## Atmosphere and lighting

- No simulated light. Light is a fixed convention from the **upper left**: crescents at the lower right, white gouges at the upper left, shadows shifted right.
- **Glow = printed rays**, not light: flat orange spike stars (12–18 spikes, alternating lengths) on the offset plate.
- **Shadows** are horizontal ink lens hatching inside an ellipse, never soft or transparent.
- **Paper halo** (0.5–0.9 units) behind every sprite – the knock-out that keeps black figures readable on dark soil and in groups.
- **Ink texture**: pinhole voids and fibres in all ink, ground and sprites alike; orange gets ±6% density grain.
- **Frame**: ragged ink strips (thickness `max(6, 1.1% of H)`, inner jagged edge every 6–18 px) plus an inner rule; no vignette.
- **Overlays** (full-screen announcements, end screens): `rgba(27,23,21,.8)` with a halftone dot pattern `radial-gradient(circle, rgba(240,231,210,.16) 0 1.3px, transparent 1.7px)` at 8px.
- **Colour grading**: none – just paper, ink and two flat spots.

## UI

- Panels: paper with an SVG noise texture, `3px solid` ink borders, radius 2px, **hard offset shadows** `4px 4px 0` ink (cards `8px 8px 0 #0d0b0a`, hovered `10px 12px 0` orange).
- Wide progress bar: orange with ink rules `repeating-linear-gradient(-62deg, orange 0 7px, ink 7px 8.5px)`; short status bar: ink with paper rules (9px / 1.5px).
- Badge: paper Alfa Slab One number on a solid ink block at the bar's right end.
- Clock / timer: double-ruled box (`box-shadow: 0 0 0 3px paper, 0 0 0 6px ink, 7px 7px 0 6px ink`), Rye time with a 2px orange offset shadow, typewriter label under a 2px rule.
- Alert state: the status bar flips to `filter: invert(1)` (negative print). Transitions use `steps()`.
- Icons are carved in a 100-unit box, big ones on a round medallion.

```css
:root { --paper:#f0e7d2; --ink:#1b1715; --org:#ea6820; --teal:#2e7674; }
.hud { font-family: 'Special Elite', 'Courier New', monospace; color: var(--ink); }
.progress { height: 20px; background: var(--paper); border: 3px solid var(--ink); border-radius: 2px; box-shadow: 4px 4px 0 var(--ink); }
.progress-fill { height: 100%; background: repeating-linear-gradient(-62deg, var(--org) 0 7px, var(--ink) 7px 8.5px);
  box-shadow: 3px 0 0 var(--ink); transition: width .15s steps(3); }
.status-bar { width: 230px; height: 22px; background: var(--paper); border: 3px solid var(--ink); border-radius: 2px; box-shadow: 4px 4px 0 var(--ink); }
.status-fill { height: 100%; background: repeating-linear-gradient(-62deg, var(--ink) 0 9px, var(--paper) 9px 10.5px); transition: width .12s steps(2); }
.bar-value { font: 400 17px 'Alfa Slab One', Georgia, serif;
  text-shadow: 2px 0 var(--paper), -2px 0 var(--paper), 0 2px var(--paper), 0 -2px var(--paper), 2px 2px var(--paper), -2px -2px var(--paper), 2px -2px var(--paper), -2px 2px var(--paper); }
.clock { background: var(--paper); border: 3px solid var(--ink); padding: 3px 22px 4px;
  box-shadow: 0 0 0 3px var(--paper), 0 0 0 6px var(--ink), 7px 7px 0 6px var(--ink); }
.clock-time { font: 400 34px/1.05 'Rye', Georgia, serif; letter-spacing: 2px; text-shadow: 2px 2px 0 var(--org); }
.clock-label { font: 11px 'Special Elite', monospace; letter-spacing: 3px; border-top: 2px solid var(--ink); padding-top: 2px; }
.card { background: var(--paper); border: 3px solid var(--ink); border-radius: 9px;
  box-shadow: inset 0 0 0 6px var(--paper), inset 0 0 0 8px var(--ink), 8px 8px 0 #0d0b0a; transition: transform .1s steps(2); }
.title { font: 400 72px 'Rye', Georgia, serif; letter-spacing: 3px; color: var(--paper); text-shadow: 5px 4px 0 var(--org); }
.alert .status-bar { filter: invert(1); }
```

## Motion and animation

Linocut motion is **held**: poses are picked by step and two hand-pulled carving variants alternate, so even fast motion feels printed. Smooth transforms are used only for positions, squash and scale.

- **Carving boil**: 2 pulls per pose, `v = floor(t·6 + seed·10) & 1` (6 fps).
- **Main character**: walk pose `floor(anim·1.3) & 7` (8 poses ≈ one stride per 6 units travelled); idle pose `floor(t·2.6) & 3` (held ~0.38 s each), blink for 0.13 s every 3.4 s; dash = crouch while `dashT > 0.165` (anticipation), then the dash pose; hurt = negative recoil while `hurtT > 0.8`, recoil pose to 0.55, then a negative-print blink at 12 Hz during the invulnerable time.
- **Creatures**: 6 poses each; small creature `floor(anim·3.2)`, large creature `floor(anim·2.8)`, fast creature `floor(t·9 + seed·13)`; pulls use `seed` too – every actor has its own phase, so a crowd never moves in lock-step.
- **Float curve** (fast creature, collectibles, drifting leaves): an eased triangle wave quantised to 14 steps per cycle – `u = frac(floor(t·14)/14)`, `tri = u < .5 ? 2u : 2 − 2u`, `tri²(3 − 2·tri)` – it lingers at the top and bottom instead of a plain sine. The fast creature hovers `1.6 + 2.6·curve` and its shadow shrinks as it rises.
- **States**: hit 0.16 s, disappearance 0.35 s, entrance 0.45 s (timings in Effects).
- **Ambient**: 8 carved leaves drift with the wind (9–18 units/s), swaying 9 units on the float curve and tumbling through 4 poses at 8 fps; lantern rays alternate at 3.2 fps; crows open their beaks every few seconds.
- **Floating numbers**: pop 1.7 → 1.0 in 0.07 s, fade in the last 0.22 s.
- **UI**: transitions use `steps(2)` / `steps(3)` like a print being swapped.

## Do and don't

Do:
- Draw only with filled marks: lenses, tapers, limbs, smooth paths.
- Give each figure a solid ink mass with white carving and a paper area with black carving.
- Print orange on a separate offset plate (same `MX, MY` everywhere).
- Shade with widening parallel lenses; put a crescent on the shadow side.
- Bake a paper halo and ink pinholes into every sprite.
- Drive walks from computed contact/down/passing/up poses with lagging scarf, hem and leaf; hold poses and swap pulls at 6 fps.
- Grow grass and litter in clumps and along edges; leave big areas of bare paper.
- Stage entrances and exits as print-shop events: registration mark, brayer, stamp, split block.

Don't:
- Don't use gradients, blur, glow, or semi-transparent shading.
- Don't add colours beyond orange and a hint of teal.
- Don't register colour perfectly inside outlines.
- Don't use constant-width vector strokes or hairlines as the main line.
- Don't tween shapes smoothly or bob things on a plain sine.
- Don't scatter tufts and dots evenly over the ground.
- Don't place black figures on black areas without a paper halo.

## Implementation recipe

1. Camera in world units (360 visible vertically); clear to paper `#f0e7d2`.
2. Copy the carving toolkit (`lens`, `taper`, `spline`, `limb`, `smoothPath`, `crescent`, `holeSpot`) and a seeded RNG.
3. Build the paper fibre map and the ink void map once.
4. Write `mk(box, draw, {halo, seed})`: draw at K px/unit → paper halo (12 offset silhouettes, destination-over) → inkify.
5. Design each character as: one solid ink mass + one paper mass, carved with lenses; add the orange plate offset on its key element; crescent bottom-right; thin outline; carved face. Drive it from a pose table (feet with lift and heel, bob, lean, hands, cloth, scarf, leaf) and compute 8 walk poses from one phase with delayed follow-through parts.
6. Bake every pose × 2 jitter seeds × 2 facings; derive negative prints, a cracked block and shatter shards.
7. Ground: noise fields → signed distances → per-pixel coverage pattern per region (clumped grass ticks, furrows, litter drifts, solid with echo contours, cobbles), 1.5-unit paper gutters, paper fibres and ink pinholes. Bake in chunks with a time budget.
8. Decals: knock out a paper disc, then carve the motif.
9. Shadows as horizontal lens hatching; effects as baked lens bursts, chips, drops, halftone puffs, orange stars/rays.
10. HUD in DOM with the CSS above; floating numbers on canvas as two-plate prints.

## Code

The core techniques, standalone. [`starter.js`](starter.js) contains a full runnable scene (paper ground with grass ticks, forest stipple and dark soil with echo contours, main character, small root creatures, floating spirits, bare trees, collectibles, projectile, HUD, frame). The complete reference module is [`../../js/styles/linocut.js`](../../js/styles/linocut.js).

```js
// The two basic knife marks. Both are FILLS with the current fillStyle (ink or paper).
const TAU = Math.PI * 2;
function lens(ctx, x0, y0, x1, y1, w, bend = 0) { // pointed both ends, half-width w, centre bent by `bend`
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1e-6, nx = -dy / L, ny = dx / L;
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, u = 2 * (bend + w), l = 2 * (bend - w);
  ctx.beginPath(); ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(mx + nx * u, my + ny * u, x1, y1);
  ctx.quadraticCurveTo(mx + nx * l, my + ny * l, x0, y0);
  ctx.fill();
}
function taper(ctx, x0, y0, x1, y1, w, bend = 0) { // blunt round start, sharp tip (blades, toes, hairs)
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1e-6, nx = -dy / L, ny = dx / L;
  const mx = (x0 + x1) / 2 + nx * bend * 2, my = (y0 + y1) / 2 + ny * bend * 2, th = Math.atan2(dy, dx);
  ctx.beginPath(); ctx.moveTo(x0 + nx * w, y0 + ny * w);
  ctx.quadraticCurveTo(mx + nx * w * 0.6, my + ny * w * 0.6, x1, y1);
  ctx.quadraticCurveTo(mx - nx * w * 0.6, my - ny * w * 0.6, x0 - nx * w, y0 - ny * w);
  ctx.arc(x0, y0, w, th - Math.PI / 2, th + Math.PI / 2, true); ctx.closePath(); ctx.fill();
}
// Example: shade the right side of a round form with widening black lenses (darker = wider)
function shadeRight(ctx, cx, cy, rx, ry) {
  ctx.fillStyle = '#1b1715';
  for (let i = 0; i < 6; i++) { const x = cx + rx * (0.36 + i * 0.105); lens(ctx, x - 0.5, cy - ry * 0.75 + i * 0.35, x + 0.1, cy + ry * 1.05, 0.16 + i * 0.055, 0.45); }
}
```

```js
// Crescent shadow contour + misregistered spot plate in a cut hole
const MX = 0.8, MY = 0.55; // orange plate offset in world units – identical for every object
function crescent(ctx, shape, cx, cy, dx, dy, s, color = '#1b1715') {
  ctx.save(); ctx.beginPath(); shape(ctx); ctx.clip();           // stay inside the form
  ctx.beginPath(); shape(ctx);                                    // outer shape ...
  ctx.save(); ctx.translate(cx + dx, cy + dy); ctx.scale(s, s); ctx.translate(-cx, -cy); shape(ctx); ctx.restore(); // ... minus a shrunken copy moved to the light
  ctx.fillStyle = color; ctx.fill('evenodd'); ctx.restore();
}
function holeSpot(ctx, shape, color, dx, dy) {
  ctx.beginPath(); shape(ctx); ctx.fillStyle = '#f0e7d2'; ctx.fill();   // the hole shows paper ...
  ctx.save(); ctx.beginPath(); shape(ctx); ctx.clip();
  ctx.translate(dx, dy); ctx.beginPath(); shape(ctx); ctx.fillStyle = color; ctx.fill(); // ... and the offset colour plate
  ctx.restore();
}
// Usage: a round orange head = paper + offset orange plate + crescent + outline
function pumpkin(ctx, x, y, r) {
  const shape = (c) => c.ellipse(x, y, r, r * 0.85, 0, 0, TAU);
  ctx.beginPath(); shape(ctx); ctx.fillStyle = '#f0e7d2'; ctx.fill();
  ctx.save(); ctx.translate(MX, MY); ctx.beginPath(); shape(ctx); ctx.fillStyle = '#ea6820'; ctx.fill(); ctx.restore();
  crescent(ctx, shape, x, y, -r * 0.14, -r * 0.12, 0.93);
  ctx.beginPath(); shape(ctx); ctx.strokeStyle = '#1b1715'; ctx.lineWidth = 0.75; ctx.stroke();
}
```

```js
// Sprite bake: paper halo behind + uneven ink (pinholes from a void-noise map)
function hash2(x, y, s) { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
const VOID = new Uint8Array(65536).map((_, i) => Math.max(0, Math.min(255, Math.round((0.5 * hash2(i & 255, i >> 8, 5) + 0.5 * hash2((i & 255) >> 3, i >> 11, 77)) * 300 - 40))));
function paperHalo(c, rPx) {
  const s = document.createElement('canvas'); s.width = c.width; s.height = c.height;
  const sc = s.getContext('2d'); sc.drawImage(c, 0, 0); sc.globalCompositeOperation = 'source-atop'; sc.fillStyle = '#f0e7d2'; sc.fillRect(0, 0, s.width, s.height);
  const ctx = c.getContext('2d'); ctx.globalCompositeOperation = 'destination-over';
  for (let i = 0; i < 12; i++) ctx.drawImage(s, Math.cos(i / 12 * TAU) * rPx, Math.sin(i / 12 * TAU) * rPx);
  ctx.globalCompositeOperation = 'source-over';
}
function inkify(c, seed) {
  const ctx = c.getContext('2d', { willReadFrequently: true }), im = ctx.getImageData(0, 0, c.width, c.height), d = im.data;
  const P = [240, 231, 210], sx = (seed * 37) & 255, sy = (seed * 91) & 255;
  for (let y = 0, i = 0; y < c.height; y++) for (let x = 0; x < c.width; x++, i += 4) {
    if (d[i + 3] < 100) continue;
    const v = VOID[(((y + sy) & 255) << 8) + ((x + sx) & 255)];
    if (d[i] < 80 && d[i + 1] < 80 && d[i + 2] < 80) { if (v > 238) for (let k = 0; k < 3; k++) d[i + k] += (P[k] - d[i + k]) * 0.72; } // pinhole
    else if (d[i] > 160 && d[i] - d[i + 2] > 100) { const f = 0.93 + v / 255 * 0.12; for (let k = 0; k < 3; k++) d[i + k] *= f; } // orange density grain
  }
  ctx.putImageData(im, 0, 0);
}
```

```js
// Ground: analytic grass ticks (1–3 tapered blades per hashed 9-unit cell). Returns ink coverage 0..1 at world X,Y.
function hashInt(x, y, s) { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return h >>> 0; }
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
function blade(dx, dy, ang, L, res) {
  const ux = Math.sin(ang), uy = -Math.cos(ang); let t = (dx * ux + dy * uy) / L;
  if (t > 1) return 0; if (t < 0) t = 0;
  return clamp01((0.46 * (1 - t) - Math.hypot(dx - ux * t * L, dy - uy * t * L)) * res + 0.5); // tapering half-width 0.46 -> 0
}
function grass(X, Y, dens, res) {
  const GC = 9, fx = X / GC, fy = Y / GC, ix = Math.floor(fx), iy = Math.floor(fy);
  const sx = fx - ix < 0.5 ? ix - 1 : ix, sy = fy - iy < 0.5 ? iy - 1 : iy; let a = 0;
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
    const h = hashInt(sx + i, sy + j, 4141); if ((h & 1023) > dens * 1024) continue;
    const dx = X - (sx + i + 0.15 + ((h >>> 10) & 255) / 255 * 0.7) * GC, dy = Y - (sy + j + 0.35 + ((h >>> 18) & 255) / 255 * 0.55) * GC;
    if (dx < -3.3 || dx > 3.3 || dy > 0.7 || dy < -4.6) continue;
    const type = (h >>> 26) & 3, L = 2.2 + ((h >>> 28) & 3) * 0.45;
    let v = blade(dx, dy, 0.16, L, res);
    if (type >= 1) v = Math.max(v, blade(dx + 0.55, dy, -0.5, L * 0.72, res));
    if (type >= 2) v = Math.max(v, blade(dx - 0.55, dy, 0.75, L * 0.66, res));
    a = Math.max(a, v);
  }
  return a; // final pixel = mix(paper + fibre, ink, a)
}
// Dark soil with echo contours (dS = signed distance inside the soil edge, world units):
//   a = clamp01(dS*res + .5); k = max((.3 - |dS-1.8|)*res + .5, (.22 - |dS-3.4|)*res + .5); a *= 1 - clamp01(k)
```

## Adapting it to your project

Keep fixed: two values + flat spots, filled knife marks only, fixed misregistration offset, light from the upper left, crescent + white gouge carving, paper halos, ink pinholes, hatched shadows, stepped animation.

May change:
- **Spot colour**: swap orange for any single strong ink (vermilion `#d8432b`, mustard `#d9a420`, ultramarine `#2f4aa0`); keep the second spot muted and rare. Paper may be white-ish or kraft (`#d9c4a0`) – keep ink at least 8:1 contrast.
- **New characters**: decide which part is solid ink and which is paper; put the spot colour on the single focal element (eyes, core, held object). Large creatures = mostly ink with concentric white arcs; small creatures = paper bodies with an ink cap so groups don't merge.
- **Dense groups of figures**: increase the halo to 1.2 units, mix paper-bodied and ink-bodied figure types.
- **New props**: same rule as characters – one solid ink mass with white gouges on the lit side, one paper mass with black lenses, hatched shadow, grass tufts at the base.
- **Side view**: ground becomes a band of solid ink with echo contours on top and grass ticks; sky is plain paper with carved stars.
- **Resolution**: everything is in world units; only K changes.

## Performance notes

- **Init cost**: every pose × variant × facing is drawn, then halo'd and inkified with `getImageData` – the main init cost (plus negative prints and shards). Use `willReadFrequently: true` canvases.
- **Ground**: chunk generators yield every 8 rows inside a 5 ms per-frame budget; the 84×84 field grid avoids per-pixel noise; per pixel only cheap hashed-cell patterns (2×2 cells), with Worley only on roads.
- **Per frame**: only sprite blits; no path rendering at runtime except the frame strips (cached) – 1000+ figures stay cheap.
- **starter.js** bakes paper, sprites and the full-screen ground on the first `draw()` (~0.3 s at 960×540) and then draws a frame in well under 1 ms.

## Copy-paste prompt

```text
Use the Linocut art style for my project:
- A moving linocut print: paper #f0e7d2, ink #1b1715, ONE spot colour orange #ea6820, rare teal #2e7674.
- No gradients, blur, glow or alpha shading. Tone only via line density, stipple and hatching.
- Every mark is a filled knife cut: "lens" (pointed both ends) or "taper" (blunt start, sharp tip);
  limbs are tapered splines. No constant-width strokes.
- Each figure = one solid ink mass carved with white gouges + one paper area carved with black lenses.
- Light from the upper left: heavy crescent (shape minus shifted shrunken copy) at the lower right,
  white gouge highlights upper left; shade = parallel black lenses getting wider.
- Orange is printed on its own plate offset by (+0.8, +0.55) world units everywhere (misregistration).
- Bake sprites with a 1-unit paper halo and ink pinholes; 8 computed walk poses (contact/down/passing/up,
  lagging scarf and hem) × 2 jittered pulls swapped at 6 fps; held poses, never smooth tweens.
- Shadows = horizontal ink lens hatching. Hit = negative print + squash; appear = brayer rolls the figure on;
  disappear = cracked block, tumbling shards, ink splat.
- Ground: fibrous paper with clumped grass ticks, furrows, litter drifts in the forest, solid-ink soil with
  echo contours, 1.5-unit paper gutters between regions, big calm paper areas. Props (trees, graves, fences) carved the same way.
- Frame: ragged ink strips with an inner rule, no vignette.
- UI: paper panels, 3px ink borders, hard 4px offset shadows, striped bars, Rye / Alfa Slab One / Special Elite.
```
