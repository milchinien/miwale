# Blueprint — Game Art Style Spec

> A living technical drawing: white line work, dimension lines and hatching on deep cyan-blue drafting paper with a fine grid.

Everything on screen is drawn like an engineer's drafting sheet. Deep cyan-blue paper with an 8-unit grid carries faint drawings at every scale — floor plans with hatched walls and door swings, gear details, hatched sections, north arrows, callout bubbles, spot heights and handwritten notes. On top of it, characters and props are crisp mechanical drawings in white and pale cyan: outlined tube limbs, 45° hatching for shade, graduated lines on cylinders, center marks on every circle and chain-dash center lines. A navy knock-out halo around each sprite lifts it off the busy paper. One amber "highlighter" accent marks friendly and collectible things, red pencil marks hostile eyes and corrections. Fold creases, coffee rings, eraser smudges, a sheet border with zone letters and a title block make the sheet feel handled and alive; effects are dashed trajectories, measurement callouts, rubber stamps and red-pencil cross-outs.

## At a glance

| | |
| --- | --- |
| Family | Line art · Technical drawing |
| Mood | precise, clever, nerdy, calm, handmade |
| Best for | engineering and building games, puzzle and logic games, factory / automation sims, machine tower defense, top-down arena action with crowded screens |
| Renderer | Canvas 2D, fully procedural, no image assets, no web fonts on the canvas |
| Pixel art | No – native resolution, sprites baked at 4–7 px per world unit |
| Complexity | 4/10 – new assets are line drawings of engineered primitives; the two-pass bake keeps them readable; the craft is in the drafting details |
| Fonts | Built-in single-stroke lettering (canvas), Share Tech Mono (HUD), Architects Daughter (handwritten notes) |
| Key colours | `#0e5088` paper · `#f2faff` ink · `#a9dcf6` pale cyan · `#062a4a` navy halo · `#1c6aa8` body fill · `#ffcf4a` amber · `#ff5b4d` red pencil |

## When to use it

Good fits:
- **Engineering, building and factory games.** The subject matter and the look are the same thing: machines drawn as machines.
- **Puzzle and logic games.** Dimension lines, grids and callouts make spatial information feel deliberate and readable.
- **Tower defense or arena action with many creatures.** The navy halo plus white outline separates every sprite even in tight crowds; creature types differ by silhouette (gear, drone, cylinder) rather than by colour.
- **Educational or "maker" projects**, technical museums, tutorials with diagrams.
- **Teams that need lots of assets quickly.** Most objects are rectangles, circles, gears and tubes plus a few annotations.

Bad fits:
- Horror, gore or emotional close-ups – the style is cool, cerebral and friendly.
- Lush nature settings – organic shapes look odd as engineering drawings (they can work as architect's symbols, sparingly).
- Gameplay that colour-codes many categories – you only get two accents (amber, red) before the blueprint illusion breaks.
- Photoreal or painterly projects.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Blueprint paper | `#0e5088` | World base, ~70 % of the screen |
| Paper dark | `#0a4374` | Mottling low end |
| Paper light | `#16609c` | Mottling high end; sun-faded patches mix towards `rgb(32,106,162)` |
| Grid / ground line | `#e2f4ff` | Grid (7.5 % minor, 17 % major) and all ground drawings at 12–55 % alpha |
| Ink white | `#f2faff` | Character outlines, lettering, projectile arrow |
| Pale cyan | `#a9dcf6` | Secondary lines, details, tab labels |
| Construction cyan | `#74b6de` | Inner construction circles |
| Navy halo | `#062a4a` | Knock-out halo behind every sprite, shadows, HUD panels |
| Navy separation | `#072e52` | Thin line under each white outline |
| Body fill | `#1c6aa8` | Character bodies (lighter than the paper) |
| Back-limb fill | `#165b93` | Far limbs, back struts |
| Top face | `#2a7dbd` | Upper faces, joints, domes |
| Lens dark | `#08304f` | Lenses, gauges, portholes, grilles |
| Prop line | `#d3ebfa` | Scenery outlines |
| Prop fill | `#14598f` | Scenery fills |
| Water | `#04284c` | Canal fill at 50 % |
| Road surface | `#0f538c` | Blank road strip (hides the grid) |
| Red pencil | `#ff5b4d` | Creature eyes, revision clouds, cross-outs, hurt marks, stamps |
| Amber highlighter | `#ffcf4a` | Main character helmet and pencil, collectibles, orbiting discs, approval stamp |
| Eraser pink | `#f3b6ae` | Eraser crumbs, pencil eraser |
| Coffee | `#c4a060` | Coffee rings at 7–34 % |

Palette rules:
- **Blue first.** Paper and navy cover at least 85 % of the screen; everything else is line work.
- **Light lines only.** Lines are white or pale cyan, never black. Darkness appears only as the navy halo, shadows and panel backgrounds.
- **Two accents, fixed meaning.** Amber = friendly / collectible, red = hostile / correction. Never use red for something friendly.
- **Fills stay blue.** Character fill `#1c6aa8` is a step *lighter* than the paper so bodies read as cut-outs; scenery fill `#14598f` stays close to the paper so characters win.
- **Faint paper.** Nothing drawn on the ground exceeds ~55 % alpha white.
- No gradients on forms, no glow, no saturated colours besides the two accents.

## Typography

| Family | Use | Notes |
| --- | --- | --- |
| Built-in single-stroke lettering | Everything drawn on the canvas: dimensions, labels, floating numbers, title block, stamps, ground notes | Polylines on a 4x6 grid, advance 5.7, uppercase only, round caps; italic = x-shear 0.2, "handwritten" = ±0.35 u vertex jitter |
| Share Tech Mono 400 | HUD numbers, labels, panel titles, card names | `font: 400 34px/1.1 'Share Tech Mono', monospace; letter-spacing: 4px; color: #f2faff;` Titles add 10–14 px letter-spacing and uppercase |
| Architects Daughter 400 | Handwritten notes in the UI: card descriptions, hints, captions | `font: 400 16px/1.3 'Architects Daughter', cursive; color: #ffcf4a;` |

The canvas never uses web fonts, so lettering is identical in every mix and never pops in late. Line width of the stroke lettering is about 8 % of the cap height (0.42 u at 4.2 u caps on the ground, 0.8–1.0 u for floating numbers with a 2.4 u navy halo).

## Rendering technique

Shared pipeline:
1. **init()** picks the bake resolution `K = clamp(ceil(screenScale * 1.6) + 1, 4, 7)` px per world unit (screenScale = display height / 360) and bakes every sprite once.
2. **Two-pass sprite painting.** Each part of a drawing is a path function. The *back* pass fills the path in navy `#062a4a` and strokes it `lineWidth + 2.3` in navy, building one knock-out halo for the whole sprite. The *main* pass then fills (`#1c6aa8` etc.), clips hatching into the shape, strokes a navy separation line (`lineWidth + 0.85`) and finally the white outline. Construction lines are main-pass only, so they float over the paper without a halo.
3. **Copies:** a white silhouette (hit flash) for every frame, a red silhouette for main character frames. Facing is a negative-x transform at draw time – no mirrored copies.
4. **Ground** is baked per 256-unit chunk by a generator (yields between ~12 phases) at up to 3 px per unit; everything is drawn in world coordinates so it lines up across chunks.
5. **Per frame:** shadows (one drawImage each) → y-sorted props / creatures / main character (one drawImage each, plus a white flash at `alpha = flash*1.2`) → orbiting discs and projectiles (sprite + one dashed trail stroke) → vector particles → cached number sprites → a cached display overlay (sheet frame).

Draw order inside a character: construction center line → back limbs → body → head → accents → front limb. Inside a prop: annotations first, then the object.

## World and ground

The world is an endless drafting sheet, built in this order:

1. **Paper base.** An 8-unit colour grid (`fbm(x/900)` 85 % + `noise(x/160)` 15 %) ramps between `#0a4374`, `#0e5088` and `#16609c`; slow sun-faded patches mix towards `rgb(32,106,162)` by up to 22 %. The small grid is upscaled with smoothing, sample centres aligned to world multiples of 8, so chunks match.
2. **Canals.** A band of constant half-width 15 u around the zero line of `perlin(x/760) + 0.3*perlin(x/260)`, using `d = f / |grad f|` as signed distance, intersected with a region mask (`max(|d| - 15, -maskDistance)`), so canals have square-cut ends. Filled `#04284c` at 50 % with a 2-unit soft edge, *before* the grid.
3. **Grid.** 0.9 px lines every 8 u at `rgba(205,236,255,.075)`, 1.15 px lines every 40 u at `.17`.
4. **Topographic contours** in some regions (mask noise): marching squares on `fbm(x/560)` every 0.024; thin lines 0.32 u at 8.5–15 %, every fifth line 0.55 u at 14–26 %; skipped on water and roads.
5. **Roads.** Band of half-width 8 u, filled `#0f538c` at 96 % (a blank strip that hides grid and contours).
6. **Paper grain** over everything: a 256 px tileable tile (white/navy speckles, low-alpha fbm, 70 short curved fibres) used as a world-aligned pattern at 1/3 scale.
7. **Line work for bands.** Canal bank 0.7 u at 55 %, outer line at +3.2 u (30 %), flow lines at −6 and −12 u drawn on every other lattice cell (reads as dashed), comb hachures on the land side (2.2 / 4.2 u alternating, 30 %), small wave marks (two quadratic arcs, 6 u) every ~22 u inside. Road edges 0.7 u at 48 %, curb lines at +2.2 u, dashed centre line.
8. **Drawings at three scales** (all `#e2f4ff`):
   - long construction lines across the sheet (700-unit cells, 70 %, 0.3 u at 12 %, some chain-dashed);
   - big drawings (440-unit cells, 85 %, alpha factor 0.75–1): floor plans (walls 4 u thick with 45° hatching at 30 %, outlines 0.5 u at 55 %, windows as two glass lines, doors as leaf + quarter-circle swing, column grid with lettered bubbles, overall dimensions in mm, room labels like `LAB 07` with area `18.2 M²`), gear details (toothed outline, chain-dash pitch circle and center lines, bore with keyway, bolt circle with center marks, diameter dimension, `DETAIL C SCALE 2:1`), hatched L/T sections with a hole and `SECTION A-A` double-underlined, north arrows with scale bars, detail callout bubbles with a dashed boundary circle;
   - mid-size parts (180-unit cells, 62 %): plate with 4 holes + `4X Ø4.8`, bolt elevation with thread hatch and `M5X32`, angle measure with arc and degrees, isometric box with dashed hidden edges, circle with radius callout, dimension chain;
   - small notes (150-unit cells): spot heights `+12.40` with a cross, handwritten notes (`VERIFY ON SITE`, `CHECK CLEARANCE`, `SEE DETAIL 3`, … italic, jittered, 42 % white or 62 % red, often with a curved leader arrow), registration crosses.
9. **Red pencil** (560-unit cells, 60 %): revision clouds (scalloped ellipse, 0.6 u at 55 %) with a delta triangle and letter, circled question marks, check marks with OK, strike-throughs with an arrow.
10. **Handling marks.** Eraser smudges (soft radial `rgba(160,212,245,.075)` + a ghost line), fold creases every 1024 u in x and 768 u in y (10-unit band: 7 % highlight, 22 % navy shadow, a 0.5 u highlight line), coffee rings (`#c4a060`: main ring 2 u at 34 %, inner ring 16 %, partial ring 22 %, 7 % fill, an optional drip).

Three fixed landmark drawings near the start point (a gear detail, a floor plan, a section) and one coffee ring make the first view composed. Scenery and big drawings avoid canals and roads.

## Characters

All characters share the two-pass bake, body fill `#1c6aa8`, back limbs `#165b93`, top faces `#2a7dbd`, lenses `#08304f`, white outlines 0.95–1.15 u, tube limbs (navy halo, 0.55 u white rim, blue core), hatching on the lower-right, and center marks on round parts.

**Main character – engineer robot** (~15 u wide body, ~32 u to the helmet top, ~36 u to the antenna ball; drawn at 0.92 scale):
- Boxy head 13.4 x 10.4 u (radius 2.2) with hatching on the right third; a big lens eye r 3.4 (dark fill, inner construction ring, white pupil r 1.15 with a dark dot, center mark extending 1.8 u outside the rim) offset towards the facing direction; a three-line speaker grille; an ear bolt with a slot.
- Amber safety helmet: half-ellipse 6.3 x 5.1 u plus a 16.6 u brim, darker amber hatching on the right, a ridge line. A thin antenna with a red ball sways from the helmet.
- Torso 10.6 x 8.8 u with a belt line, a chest gauge (dark disc, five ticks, amber needle) and four rivets; a sprung neck.
- Tube limbs 1.75–2.1 u with round joints, rounded-box feet, round hands. The front hand holds a 10.5 u hexagonal amber drafting pencil with a pale ferrule, pink eraser and a dark graphite tip.
- A chain-dash center line runs through the whole figure from 3 u below the feet to 42 u up.
- Frames: 4 idle (bob ±0.4 u, antenna sway, a lens blink), 8 walk, 1 dash (leaning 0.2 rad, pencil forward like a lance, three baked dashed speed lines behind).

**Small creature – cog crawler** (~20 x 22 u): a gear body (9, 8 or 11 teeth, root r ~6.2, tip r ~8) centred 10.8 u above the ground, with a chain-dash pitch circle, a dark hub r 2.9, a red eye r 1.65 with a white glint, two angry brow strokes, two feelers with balls and four jointed legs (back pair darker). Three variants (tooth count, spokes, slit pupil). Six frames per gait cycle turn the gear exactly one tooth pitch.

**Fast creature – survey drone** (~24 x 20 u, drawn at 0.8 scale, hovering 5 u up): a capsule body 12.4 x 6.2 u with a lighter dome, a dashed equator line, a red lens r 1.75 with a brow, two struts to rotor hubs, rotor discs as dashed ellipses (5.4 x 1.15 u) with one blade line whose length follows `cos(phase)`, skids, dashed downwash lines and an amber plumb bob on a dashed line. Four rotor frames; tilts with its velocity.

**Large creature – boiler walker** (~42 x 60 u): a vertical cylinder r 14 from y −45 to −19.5 with elliptical caps (ry 3.4), graduated vertical shading lines (`x = 14*cos(theta)`, theta 0.12–1.05 step 0.13), a dashed inner ring on the top face, a riveted seam, two portholes (r 2.9 / 2.6) with red pupils and heavy brow strokes, a grille mouth, a small name plate, a smoke stack puffing three dashed circles, clamp arms (3 u tubes with C-clamps) and piston legs (4.4 u tubes, knee discs with center marks, trapezoid foot plates with bolts). A live callout leader with `Ø28` is drawn beside it (opposite its facing) so the lettering never mirrors.

States:
- **Hit:** white silhouette over the sprite at `alpha = min(.9, flash*1.2)`, scaled up 6 %.
- **Draft-in (0.45 s):** a dashed construction ellipse shrinks from 2.6r to 1.2r around a center mark; after 8 % the sprite is revealed from the feet up (source-rect crop) with a white pen line on the edge.
- **Erase (0.35 s):** the sprite is wiped from left to right while fading to 50 %, and a red X is drawn over it in two strokes (2.6 u navy underlay, 1.2 u red), fading out at the end.
- **Main character hurt:** red silhouette at `alpha = hurtT*1.1` plus a fast ±0.05 rad shake; invulnerability blinks to 55 % at 14 Hz.

## Props

Elevation drawings with the same bake, but dimmer: outline `#d3ebfa` 0.85 u, halo 1.9 u, fill `#14598f`, details in pale cyan, and at least one annotation each.

- **Architect's tree:** trunk tube 2.8 u with two branch tubes; canopy = union of four circles (strokes at double width first, then all fills, giving one clean contour), hatching clipped to the lower right, center marks on each circle, a dashed construction arc; a chain-dash center line.
- **Conifer:** four hatched triangles stacked on a short trunk.
- **Rock:** a faceted polygon with internal facet lines and stipple dots on the right.
- **Crate:** front face with inner frame and diagonal brace, top face `#1d68a3`, hatched side face, stencil `NO 12`, a width dimension below.
- **Tank `T-2`:** cylinder r 8.5 on four legs, graduated shading, top dome, ladder, an amber level gauge, a height dimension.
- **Street lamp:** pole tube with an arm, hatched lamp head, amber bulb, a dashed amber light cone with a dashed ellipse on the ground.
- **Lattice tower:** tapering truss with X-bracing per level, cross arm with insulators, amber tip light, a `71.5` height dimension and a ground line.
- **Theodolite `STA 3`:** tripod tubes, instrument box with a dark dial, telescope with a chain-dash sight line, an amber plumb line down to a center mark on the ground.
- **Valve `V-04`:** pipe with bolted flanges and horizontal hatching on the lower half, valve body, stem and a front hand wheel with four spokes, a ground line with hatch ticks.

Placement: one candidate per 92-unit cell, 34 % kept, weighted tree 24 %, rock 18 %, crate 14 %, valve 9 %, lamp 9 %, theodolite 9 %, tank 9 %, tower 8 %; never on water or roads, none within 90 u of the start. Only tree, rock and lamp are mirrored (the others carry lettering).

## Effects and particles

- **Projectile – flying dimension arrow:** filled white arrowhead (3.6 u, navy halo) rotated to its flight direction; a dashed trail (`[2.4, 1.7]`, offset `−age*40`) through its last 7 positions, 1.6 u navy underlay + 0.6 u white at 85 %, with a perpendicular extension tick at the start.
- **Collectibles:** small = amber hex nut (r 2.9) with a paper-coloured hole and a white glint; large = amber 8-tooth gear (r 4.6) with darker hatching and a center mark, spinning at 1.6 rad/s, with a small amber leader tag. Both bob 1.2 u above a scaled ground-line shadow; spawn pop with ease-out-back.
- **Orbiting discs:** amber protractors (r 6, drawn at 0.85) with 24 degree ticks, a half-circle scale, a red needle and a paper hub, spinning at 5 rad/s, trailed by a dashed amber line through their last 11 positions.
- **Impact:** a center-mark crosshair with a circle (5 u, 7 u on large creatures) shrinking to 70 % and fading in 0.2 s, plus two white / pale tick sparks.
- **Erase burst:** 6 (14 on large) eraser crumbs – `#f3b6ae` capsules with a navy edge, gravity 240 – plus paper-dust dots and a dashed construction ring on the ground squashed to 42 % (large ones add a live radius label `R##`).
- **Launch mark:** half of the shots leave a tiny pale crosshair at the muzzle.
- **Collect:** an amber check mark pops (ease-out-back) and rises; large collectibles add a small amber ring.
- **Dash:** a full dimension line with extension lines and arrowheads from start to end of the dash, labelled `Δ 62`; a dashed ring at the start and four dashed speed lines.
- **Celebration:** an amber dashed construction circle growing to R64 with a live radius line and label, a white ring, 12 amber ticks and an `APPROVED` rubber stamp (double rounded frame, tilted −0.16 rad) slamming in from 1.7x.
- **Hurt:** a red-pencil scribble drawn progressively over the main character, a red ring 5→20 u, red ticks, a red vignette on the screen edges.
- **Floating numbers:** measurement callouts – the value in stroke lettering on a shelf line with a slanted leader and dot; strong values are red, larger and circled.

## Atmosphere and lighting

- **Shadows are drafting ground lines.** A baked shadow (unit radius 10): navy radial pool `rgba(3,22,42,.55)` squashed to 36 %, a 0.5 u ground line at 45 % white, five diagonal hatch ticks below it. Scaled per subject: main character 9.5, small creature 10.5, fast creature 6.5, large creature 19, props 6–15, collectibles 3–4.
- **Plotted route.** The main character's path is drawn behind it as a dashed line (last 44 points, sampled every 7 u) with station crosses every 6 points, in three alpha bands (10 / 21 / 32 %).
- **Desk lamp + vignette.** Radial `rgba(190,232,255,.07)` from the upper left (22 %, 12 %); navy vignette from 36 % of the short side to 58 % of the diagonal, ending at `rgba(2,16,32,.6)`.
- **Sheet frame.** Outer line 1 px at 50 % (inset 7 px), inner line 2 px at 75 % (inset 21 px), the strip between them darkened to `rgba(4,30,56,.5)`; zone ticks every ~200 px with letters H…A along top and bottom and numbers down the sides; centring marks on every edge.
- **Title block** (300 x 74 px at 900 px height, lower right): navy panel with cells `TITLE / FIELD STUDY`, `DRAWN` with an amber handwritten name, `SHEET 04 / 12`, `SCALE 1:20`, `REV B`, `DATE 10.26`, plus a red revision delta beside it.
- The overlay is drawn once per screen size into a cached canvas – one drawImage per frame.
- No glow, bloom, colour grading or additive light anywhere.

## UI

The HUD is drawing-sheet furniture:
- **Panels** are title-block cells: `rgba(6,42,74,.84)`, 1.5 px `#dff3ff` border, square corners, a tab label (`FIG. 1`) sitting on the top border.
- **Bars** have hairline tick marks every 22 px; fills are 45° hatch patterns (`repeating-linear-gradient(45deg, …)`) with a solid end line – white normally, red when hurt.
- **The thin top bar is a scale ruler** (ticks every 10 px, long ticks every 50 px) with an amber hatched fill.
- **The title cell** has a caption strip `SHEET 04 — REV B`, a 34 px Share Tech Mono value and an amber handwritten label; an inner hairline frame.
- **Counters are rubber stamps:** red `#ff6b5c` text and 2.5 px border, rounded 5 px, an outline 3 px outside, rotated −2.5°.
- **Cards** are drawing sheets: grid background, inner border, a circled number, a dashed icon circle with a crosshair, Share Tech Mono uppercase titles, amber Architects Daughter descriptions, a bottom title strip `DWG A-01 SCALE 1:1`. Hover lifts and tilts the card and turns its border amber.
- **Panel titles** get a dimension line underneath (hairline + two extension ticks); they reveal left-to-right with `clip-path`.
- **Icons** are drawn by the style in two passes (navy halo, then lines) on a 24-unit grid: a cog-crawler face, a geometric heart built from two construction circles, a pen nib, a stopwatch, fanned dimension arrows, a reflected trajectory off a hatched wall, a disc on a dashed orbit, a wheel with motion lines, a horseshoe magnet with dashed field lines, a wrench with a plus.

```css
.hud-panel { position: relative; padding: 7px 14px 7px 8px; background: rgba(6,42,74,.84); border: 1.5px solid #dff3ff; font: 400 15px 'Share Tech Mono', monospace; color: #f2faff; }
.hud-panel::before { content: 'FIG. 1'; position: absolute; top: -9px; left: 8px; padding: 0 5px; font: 400 10px/16px 'Share Tech Mono', monospace; letter-spacing: 2px; color: #a9dcf6; background: #0b4475; border: 1px solid rgba(223,243,255,.55); }
.bar { position: relative; width: 230px; height: 16px; border: 1.5px solid #dff3ff; background: rgba(3,26,48,.85); }
.bar::after { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(90deg, transparent 0 22px, rgba(223,243,255,.5) 22px 23px); }
.bar-fill { height: 100%; background: repeating-linear-gradient(45deg, rgba(236,248,255,.95) 0 1.6px, transparent 1.6px 4.6px), rgba(236,248,255,.14); border-right: 2px solid #f2faff; }
.stamp { display: inline-block; padding: 3px 16px; color: #ff6b5c; font: 400 26px 'Share Tech Mono', monospace; border: 2.5px solid #ff6b5c; border-radius: 5px; outline: 1px solid rgba(255,107,92,.55); outline-offset: 3px; transform: rotate(-2.5deg); }
```

## Motion and animation

- **Main character:** walk 8 frames (bob −|sin|·1.1 u, feet ±3.3 u, lift 1.9 u, arms ±0.65 rad, antenna on a phase offset); idle 4 frames at 1.4 cycles/s (bob ±0.4 u, one lens blink); dash: one leaning pose plus three fading white after-images 7 u apart.
- **Small creature:** 6 frames per cycle; the gear turns exactly one tooth pitch per cycle, so it rolls continuously; legs alternate in pairs; feelers wiggle at double frequency; body rocks ±0.05 rad.
- **Fast creature:** 4 rotor frames at 14 fps, hover float `sin(t*3)*1.5 u`, tilt up to 0.18 rad with horizontal speed, plumb bob swing ±0.9 u.
- **Large creature:** 6 frames, bob 1.3 u, feet lift 2.8 u, smoke circles rise 9 u and grow from 1.4 to 4 u over one cycle.
- **Transitions:** draft-in 0.45 s (feet first), erase 0.35 s (wipe + red X in two overlapping strokes).
- **Numbers and stamps:** pop 0.55→1.15→1x in 0.25 s and fade over the last 30 %; stamps slam from 1.7x in 15 % of their life.
- **Rings** ease out (quad) and fade linearly; trajectory dashes move with age so lines look like they are being drawn.
- No squash and stretch on machines beyond small 3–10 % pulses (shooting, celebration).

## Do and don't

Do:
- Bake each sprite in two passes (navy halo first, then fill + hatching + white outline) and only drawImage at runtime.
- Put a center mark on every important circle and a chain-dash center line through symmetric objects.
- Shade with 45° hatching on the lower-right; graduate the lines on cylinders.
- Annotate: dimension lines with filled arrowheads, single-stroke capitals, leaders with dots.
- Keep the paper busy but faint (≤ 55 % alpha), so the haloed characters always win.
- Reserve amber for friendly / collectible things and red pencil for hostile eyes and corrections.
- Frame the screen like a sheet (border with zone marks, title block).

Don't:
- Don't use black outlines, glow, bloom or soft gradients on forms.
- Don't bake lettering into sprites that get mirrored – draw labels live.
- Don't fill bodies with the paper colour; they vanish into the grid.
- Don't add more hues – a third accent breaks the blueprint illusion.
- Don't draw wobbly organic outlines for machines; only handwritten notes may wobble.
- Don't let ground drawings compete with thick lines or high alpha.
- Don't rely on web fonts inside the canvas.

## Implementation recipe

1. Fill the background with `#0e5088`; add a smoothly upscaled mottling grid and a world-aligned grain pattern.
2. Draw the grid: 8-unit minor lines at 7.5 %, 40-unit major lines at 17 %.
3. Add bands (canals, roads) as signed-distance bands from noise fields; mask-fill them, then contour the banks with marching squares.
4. Scatter faint drawings at three scales (big plans and gear details, mid-size parts, small notes) plus red-pencil corrections, creases and coffee rings – deterministic per world cell so chunks match.
5. Build the drafting toolkit: stroke lettering, `dimLine()`, `centerMark()`, `hatchLines()`, `arrowHead()`.
6. Write each subject as path functions and paint them through `shp()` / `tube()` / `ln()` / `con()` so the same code produces the navy back pass and the main pass.
7. Bake frames: main character 4 idle + 8 walk + 1 dash, creatures 4–6 frames each; add white (and for the main character red) silhouette copies.
8. Draw per frame: ground-line shadows, y-sorted sprites with a mirrored transform for facing, flash overlays, dashed trails, vector particles.
9. Implement draft-in (crop from the feet up) and erase (wipe + red X) directly in the creature draw.
10. Cache the sheet frame and title block per screen size; skin the HUD with title-block cells, hatched bars and rubber stamps.

## Code

Two-pass painting helpers – one path function, two passes:

```js
let PASS = 'main';
const NAVY = '#062a4a', SEP = '#072e52', INK = '#f2faff', HALO = 2.3;
function shp(c, path, o) {           // filled part with outline (+ optional hatching)
  const lw = o.lw === undefined ? 1 : o.lw;
  if (PASS === 'back') { path(c); c.fillStyle = NAVY; c.fill(); c.lineWidth = lw + HALO; c.strokeStyle = NAVY; c.stroke(); return; }
  path(c); if (o.fill) { c.fillStyle = o.fill; c.fill(); }
  if (o.hatch) {                     // 45° hatching clipped to the shape and a sub-rectangle
    const r = o.hatch; c.save(); path(c); c.clip(); c.beginPath(); c.rect(r[0], r[1], r[2] - r[0], r[3] - r[1]); c.clip();
    c.beginPath(); for (let k = -60; k <= 60; k += 1.2) { c.moveTo(r[0] + k, r[1]); c.lineTo(r[0] + k + 60, r[1] + 60); }
    c.lineWidth = 0.32; c.strokeStyle = 'rgba(226,244,255,0.5)'; c.stroke(); c.restore();
  }
  path(c); c.lineWidth = lw + 0.85; c.strokeStyle = SEP; c.stroke();
  c.lineWidth = lw; c.strokeStyle = o.col || INK; c.stroke();
}
function tube(c, path, w, core) {    // outlined limb
  if (PASS === 'back') { path(c); c.lineWidth = w + HALO; c.strokeStyle = NAVY; c.stroke(); return; }
  path(c); c.lineWidth = w + 0.85; c.strokeStyle = SEP; c.stroke();
  c.lineWidth = w; c.strokeStyle = INK; c.stroke();
  c.lineWidth = w - 1.1; c.strokeStyle = core || '#1c6aa8'; c.stroke();
}
function bake(w, h, K, ox, oy, draw) { // ox/oy: anchor in world units inside the box
  const cv = document.createElement('canvas'); cv.width = w * K; cv.height = h * K;
  const c = cv.getContext('2d'); c.lineCap = c.lineJoin = 'round';
  for (const p of ['back', 'main']) { PASS = p; c.setTransform(K, 0, 0, K, ox * K, oy * K); draw(c); }
  PASS = 'main'; return cv;
}
```

Drafting primitives – center mark, dimension line, single-stroke lettering:

```js
function centerMark(c, x, y, r, ext) {
  const k = Math.min(1.2, r * 0.35);
  c.moveTo(x - k, y); c.lineTo(x + k, y); c.moveTo(x, y - k); c.lineTo(x, y + k);
  c.moveTo(x - r - ext, y); c.lineTo(x - r + 0.6, y); c.moveTo(x + r - 0.6, y); c.lineTo(x + r + ext, y);
  c.moveTo(x, y - r - ext); c.lineTo(x, y - r + 0.6); c.moveTo(x, y + r - 0.6); c.lineTo(x, y + r + ext);
}
const GLYPH = { '0': [[1,0,3,0,4,1,4,5,3,6,1,6,0,5,0,1,1,0]], '1': [[1,1.2,2.2,0,2.2,6],[1,6,3.4,6]], A: [[0,6,2,0,4,6],[0.7,4,3.3,4]] /* … */ };
function text(c, s, x, y, h) {       // baseline at y, left aligned; uppercase polylines on a 4x6 grid
  const k = h / 6;
  for (const ch of s.toUpperCase()) {
    for (const p of GLYPH[ch] || []) for (let j = 0; j < p.length; j += 2) (j ? c.lineTo : c.moveTo).call(c, x + p[j] * k, y - h + p[j + 1] * k);
    x += 5.7 * k;
  }
}
function dimLine(c, x1, y1, x2, y2, off, label, col) {
  const L = Math.hypot(x2 - x1, y2 - y1), nx = (y2 - y1) / L, ny = -(x2 - x1) / L, ux = -ny, uy = nx;
  const ax = x1 + nx * off, ay = y1 + ny * off, bx = x2 + nx * off, by = y2 + ny * off;
  c.beginPath(); c.moveTo(x1 + nx * 1.5, y1 + ny * 1.5); c.lineTo(ax + nx * 2, ay + ny * 2);
  c.moveTo(x2 + nx * 1.5, y2 + ny * 1.5); c.lineTo(bx + nx * 2, by + ny * 2); c.moveTo(ax, ay); c.lineTo(bx, by);
  c.strokeStyle = col; c.lineWidth = 0.35; c.stroke();
  c.beginPath();
  for (const [px, py, s] of [[ax, ay, -1], [bx, by, 1]]) { c.moveTo(px, py); c.lineTo(px - ux * s * 3 + nx, py - uy * s * 3 + ny); c.lineTo(px - ux * s * 3 - nx, py - uy * s * 3 - ny); c.closePath(); }
  c.fillStyle = col; c.fill();
  c.save(); c.translate((ax + bx) / 2, (ay + by) / 2); c.rotate(Math.atan2(y2 - y1, x2 - x1));
  c.beginPath(); text(c, label, -label.length * 2.6 * 0.75, -0.6, 4.5); c.lineWidth = 0.4; c.stroke(); c.restore();
}
```

Signed-distance band for canals and roads (constant width, square ends):

```js
// f = band field (perlin), m = region mask (noise - 0.5); both evaluated on a 4-unit lattice
function bandValue(f, gradF, m, gradM, halfWidth) {
  const d = f / Math.max(1e-6, gradF);     // approx. distance to the zero line of f
  const md = m / Math.max(1e-6, gradM);    // approx. distance into the mask region
  return Math.max(Math.abs(d) - halfWidth, -md); // < 0 inside the band
}
// fill: alpha = clamp(0.5 - v / 2, 0, 1) per mask pixel; banks: marching squares at v = 0, +3.2, -6, -12
```

Graduated cylinder shading and the erase effect:

```js
function cylinderShade(c, cx, r, y0, y1) {   // call inside a clip of the cylinder outline
  c.beginPath();
  for (let th = 0.12; th <= 1.05; th += 0.13) { const x = cx + r * Math.cos(th); c.moveTo(x, y0); c.lineTo(x, y1); }
  c.lineWidth = 0.34; c.strokeStyle = 'rgba(226,244,255,0.5)'; c.stroke();
}
function drawErased(ctx, sprite, x, y, scale, q, cx, cy, R) { // q = 0..1 over 0.35 s
  const wipe = Math.min(1, q * 1.25), w = sprite.width, h = sprite.height, k = scale;
  if (wipe < 1) { ctx.globalAlpha = 1 - q * 0.5; ctx.drawImage(sprite, wipe * w, 0, (1 - wipe) * w, h, x - w * k / 2 + wipe * w * k, y - h * k, (1 - wipe) * w * k, h * k); }
  const k1 = Math.min(1, q / 0.4), k2 = Math.max(0, Math.min(1, (q - 0.3) / 0.4));
  ctx.globalAlpha = q > 0.8 ? (1 - q) / 0.2 : 1; ctx.beginPath();
  ctx.moveTo(cx - R, cy - R); ctx.lineTo(cx - R + 2 * R * k1, cy - R + 2 * R * k1);
  if (k2 > 0) { ctx.moveTo(cx + R, cy - R); ctx.lineTo(cx + R - 2 * R * k2, cy - R + 2 * R * k2); }
  ctx.lineWidth = 2.6; ctx.strokeStyle = 'rgba(6,42,74,0.7)'; ctx.stroke();
  ctx.lineWidth = 1.2; ctx.strokeStyle = '#ff5b4d'; ctx.stroke(); ctx.globalAlpha = 1;
}
```

## Adapting it to your project

- **Other subjects:** anything engineered translates directly – vehicles (side elevation, wheels with center marks), buildings (front elevation + floor plan on the ground), tools, plants as architect's symbols (circle unions, hatched triangles). Give each one annotation.
- **Animals or people:** build them from capsules, circles and joints like mannequins or mechanical toys; keep faces to one lens/eye shape plus a brow stroke.
- **More categories:** separate by silhouette and hatching density, not colour. If you truly need a third accent, use a desaturated ochre and keep it rare.
- **Day/night or variants:** swap the paper for a white-print variant (paper `#f4f1e8`, lines `#1c3f6e`, halo `#f4f1e8`) – the pipeline stays identical.
- **Pixel-art projects:** bake at 1 px per unit with 1-unit outlines and drop the hatching to every second pixel; dimension text becomes a 3x5 pixel font.
- **UI-heavy projects:** title-block cells, tab labels and rubber stamps scale well; keep Architects Daughter for short notes only.

## Performance notes

- Everything that looks expensive is baked once: 13 main-character frames (+ white and red copies), 18 small-creature frames, 4 drone frames, 6 large-creature frames (all + white copies), 10 prop sprites, collectibles, arrow, disc, shadow and the grain tile. Mirroring is a transform, so no flipped copies.
- Ground chunks (256 u, up to 3 px/u) are built by a generator in ~12 phases: lattice fields (≈ 4,800 points), masks at 2 u per pixel, marching squares, scattered drawings. Average 7–12 ms per chunk, spread over frames.
- Per frame: one drawImage per actor, prop and shadow; one dashed stroke per projectile and orbiting disc; vector particles (short paths); number sprites cached per value (cache cleared above 400); one cached overlay image.
- Measured: median ~2.3 ms per frame with ~90 creatures at 1600 x 900.
- Hot spots: `setLineDash` per trail (cheap but not free – batch if you have hundreds), and per-pixel mask building in chunk generation.

## Copy-paste prompt

```text
Use the "Blueprint" art style for my project: a living technical drawing.
- Background: deep cyan-blue drafting paper #0e5088 with subtle mottling (#0a4374..#16609c), paper grain,
  a fine grid (8-unit lines at 7.5 % white, 40-unit lines at 17 %), fold creases and faint coffee rings.
- The ground carries faint white drawings (12-55 % alpha): floor plans with hatched walls and door swings,
  gear details with center lines, hatched sections, north arrows, dimension chains, handwritten notes,
  red-pencil revision clouds. Canals/roads are constant-width bands with crisp banks and hachures.
- Characters and props are mechanical drawings: white outlines #f2faff (~1 unit), blue fills #1c6aa8,
  outlined tube limbs, 45° hatching on the lower-right, graduated lines on cylinders, center marks on circles,
  chain-dash center lines. Every sprite has a navy #062a4a knock-out halo ~1.1 units wide so it pops.
- Exactly two accents: amber #ffcf4a for friendly things and collectibles, red pencil #ff5b4d for hostile eyes
  and corrections. No black lines, no glow, no gradients on forms.
- Lettering: single-stroke technical capitals (stroke font), dimension lines with filled arrowheads.
- Effects: dashed trajectories, measurement callouts, construction circles, eraser crumbs, red-pencil X
  cross-outs, an APPROVED rubber stamp. Shadows are ground lines with hatch ticks over a soft navy pool.
- Frame the screen like a drawing sheet: border with zone letters, title block (SHEET 04, REV B).
- UI: title-block cells with 1.5 px pale borders, hatched bars, red rubber-stamp counters,
  Share Tech Mono + Architects Daughter.
```
