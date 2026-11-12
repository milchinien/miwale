# Rubber Hose 1930s — Game Art Style Spec

> Black-and-white 1930s animation: ink figures with elbow-less rubber-hose limbs, white gloves and pie-cut eyes, projected through grainy, scratched film.

The look of an early sound cartoon, rebuilt from code. Every figure is a round, bouncy ink shape whose arms and legs are single bowed curves — **rubber hoses** with no elbows and no knees — ending in puffy four-finger **white gloves** and oversized **shoes**. Eyes are **pie-cut** ink ovals with a wedge missing. There is no colour: one ink, four warm greys and two whites. The whole world keeps time: trees sway, daisies bob, cottages squash and the main character taps a toe on one shared **120 bpm beat**. The ground is a flat grey studio wash with crisp ink contour lines and tiny ink decals. On top sits a **projector**: grain, dust, hairs, scratches, flicker, a jumping gate and a heavy vignette with rounded gate corners, all stepped at 24 frames per second. UI panels are dark **title cards** with double paper rules and Art-Nouveau corner curls.

## At a glance

| | |
| --- | --- |
| Family | Cartoon · Vintage animation |
| Mood | jaunty, nostalgic, musical, mischievous, slightly eerie |
| Best for | retro top-down action with crowds of characters, vintage cartoon platformers and brawlers, music or rhythm projects, spooky-cute or carnival themes, nostalgic title screens |
| Renderer | Canvas 2D, procedural: two-pass part painter (merged ink outline → flat greys) → baked multi-frame sprites; per-pixel signed-distance ground; baked film layer |
| Pixel art | No — native resolution, sprites baked at 3–6 px per world unit |
| Complexity | 4/10 — outlines and shading are automatic; good rubber-hose animation is the craft |
| Fonts | Limelight 400, Rye 400, Special Elite 400 (Google Fonts) |
| Key colours | ink `#16120e`, soot `#3a342d`, slate `#6d665b`, ash `#a0988a`, fog `#cdc5b5`, paper `#efe9dc`, white `#faf7ef`, face `#e6dece`, ground `#cfc8b9` |

## When to use it

- **Good fit:** anything that wants instant period charm — vintage cartoon brawlers, platformers, carnival or haunted-house themes, music and rhythm projects (the shared beat is built in).
- **Good fit:** crowded top-down scenes. Black figures with pale faces, white gloves and light shoes read strongly against the light-mid grey ground, even by the hundred.
- **Good fit:** title screens, trailers and menus — the ornamental title cards and the film gate frame any screen.
- **Bad fit:** projects that depend on colour coding (teams, elements, rarity) — there is no hue to code with; use shape, value and pattern instead.
- **Bad fit:** clean modern UI products, realism, gritty drama.
- **Bad fit:** tiny low-resolution screens — grain and thin ink lines need pixels.

**How it differs from its base style `cartoon`.** Both share the same machinery: a two-pass part painter that gives every sprite one merged outline, baked frames with flash copies, a cel crescent per part and lots of squash & stretch. `cartoon` is a candy-bright modern vector look — deep-plum outlines, saturated fills, glossy highlights, a green play-mat and chunky toy UI. Rubber Hose drops every hue: pure ink outlines, four warm greys and two whites. Limbs become stroked elbow-less curves with gloves and big shoes instead of stubby capsules. Eyes are pie-cut instead of googly. Walks bounce through 8 frames instead of hopping. Props dance in sync to a beat. The ground gets ink contour lines. A full projector layer (grain, scratches, dust, flicker, weave, vignette) sits over everything, and the UI is ornamental title cards instead of rounded pills. Pick `cartoon` for cheerful, colourful and contemporary. Pick Rubber Hose for nostalgic, musical and monochrome.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Ink | `#16120e` | All outlines, black bodies, limbs, pupils, mouths, notes, ground contours |
| Soot | `#3a342d` | Tree trunks, roofs, toadstool caps, dark sweater stripes, inner ears |
| Slate | `#6d665b` | Shorts, derby hats, barrels, tongues, grey creatures; shade `#4f493f` |
| Ash | `#a0988a` | Tree canopies, hill mounds, fence rails, coin emboss |
| Fog | `#cdc5b5` | The crescent shade of every white part; puffs |
| Paper | `#efe9dc` | Walls, light stripes, coins, UI rules and UI text |
| Highlight White | `#faf7ef` | Gloves, eye whites, bow tie, shines, petals |
| Face | `#e6dece` | Face masks of ink figures; shade `#c9c0ae` |
| Shoe | `#d9d1c1` | Big shoes; shade `#a59d8e` |
| Sheet | `#f4efe4` | Ghost sheet; shade `#cbc3b3` |
| Ground Base | `#cfc8b9` | Base wash (~45 % of the screen) |
| Meadow Wash | `#bdb6a6` | Soft meadow regions, lighter rim `#c6bfb0`, thin 0.42 contour |
| Hill Wash | `#968e7f` | Rolling hills, rim `#aaa293`, inner contour ring, hatch on the shade side |
| Road | `#e5dece` | The winding road (constant ~21 u), rim `#d6cebe`, pebbled shoulders |
| Pond | `#4e4840` | Ponds, rim `#6e675c`, shore ring, paper ripples, cattails |
| Sepia Grade | `#978c7b` | `color` blend at 74 % — only over foreign colours |
| Gate Black | `#0c0a08` | Vignette, gate corners, dark dust and scratches |
| Title Card | `#17130f` | UI panels and cards |
| Caption Grey | `#b9b1a1` | UI labels |

**Rules**
- No hue anywhere. The faint warmth (silver-sepia) is built into the greys themselves.
- Read by **value**: black bodies + pale face masks + white gloves + light shoes on a light-mid ground.
- The brightest whites are reserved for small focal shapes: gloves, eyes, buttons, petals, collectibles.
- Dark ground regions (hills, ponds) stay small and rare, so ink figures never sink into them.
- Exactly one grey crescent per part; black parts stay flat black with a thin white rim arc.
- When elements of other styles are shown under the film, a `color` blend of `#978c7b` at 74 % desaturates them to match.

## Typography

| Font | Use | CSS |
| --- | --- | --- |
| **Limelight** 400 | Titles, counters, the clock, floating numbers, bar caps | `font: 400 34px/1.05 'Limelight', Georgia, serif; letter-spacing: .06em; color: #efe9dc; text-shadow: 2px 3px 0 #000;` |
| **Rye** 400 | Card names | `font: 400 21px/1.15 'Rye', Georgia, serif; color: #efe9dc; text-shadow: 2px 2px 0 #000;` |
| **Special Elite** 400 | Body copy, labels, hints — the typewritten intertitle | `font: 400 15px/1.3 'Special Elite', 'Courier New', monospace; color: #cfc7b7;` |

- Labels are small caps-like: Special Elite 12 px, letter-spacing .22–.28 em, `#b9b1a1`.
- Titles always sit on dark card fills with a hard black drop shadow (no blur).
- Floating numbers in the world: Limelight, white fill with an ink stroke 0.26 × size plus a 1-unit offset ink copy; emphasised numbers invert to ink fill with a white then ink double stroke.

## Rendering technique

**Baked once (init):**
- Sprite resolution `K = clamp(round(screenH·dpr/360 · 1.25), 3, 6)` px per world unit.
- Main character: 8 walk frames, 2 idle (toe tap), 2 run (leg wheel), 1 recoil. Small creature: 3 tones × 6 hop frames. Fast creature: 6 wobble frames. Large creature: 4 stomp frames. Each one normal + flash, both facings.
- Props (8 kinds, 1–3 variants, both facings), notes, coin, diamond, bird (2 frames), puffs (3 tones), star, POW burst, twinkle, ink drop, sweat drop, speed lines, shadow, lamp glow.

**The part painter.** A sprite is a function that declares parts back to front. It runs twice on the same canvas:
1. *Outline pass:* every part's path is stroked with width `2 × 1.0` and filled in ink. Overlaps merge into one silhouette outline.
2. *Fill pass:* each part is clipped to itself and filled with its shade grey. Then it is clipped again to itself shifted up-left (0.4–2.6 units) and filled with the base grey, which leaves one crescent on the lower right. Details (eyes, stitches, buttons) and white shines follow.

Limbs (`hose`) are stroked quadratic curves that take part in both passes (outline width = limb width + 2). The flash pass replaces every fill with white (`#fbf8f0` / `#e3dccd`). For ghosts it uses negative ink (`#1d1813` / `#3a342d`). Face details are kept in the flash.

**Per frame:**
1. Ground chunks (cached).
2. Spawn puddles.
3. Collectibles.
4. Ink drop shadows.
5. Y-sorted props and figures (props are skewed and scaled by the beat).
6. Orbiting birds, notes, particles, numbers.
7. Floating ambient notes.
8. The film layer on the display canvas: optional grade → one baked film blit → dust → scratches → cue mark.

## World and ground

A flat, painted studio background seen from above, laid out like a cartoon backdrop: a winding road, rolling hills, ponds and small villages, with calm open meadow in between. Noise and cell fields are sampled on a 4-unit grid per 256-unit chunk. Each pixel gets a signed distance `value / |gradient|` to every region edge. That gives three things:
- a crisp anti-aliased edge,
- a lighter **inner rim band** (1.8–3.4 units), so regions read as gently raised,
- a centred **ink contour** 0.8 units wide, weighted by layer (line hierarchy: a soft 0.42 for meadow washes, full ink for hills, road and ponds).

| Layer (bottom → top) | Fill | Rim | Shape |
| --- | --- | --- | --- |
| Base wash | `#cfc8b9` | — | ±4 % brightness tint, period ~1400 u |
| Meadow wash | `#bdb6a6` | `#c6bfb0`, 3.0 u | warped low-frequency noise (~620 u); a soft, thin edge line |
| Rolling hills | `#968e7f` | `#aaa293`, 3.4 u | one lobed oval per jittered 400-unit cell (55 % of cells), sometimes a second ridge lobe; inner contour ring 6 u inside |
| The road | `#e5dece` | `#d6cebe`, 1.8 u | the zero line of a warped 1500-u noise divided by its gradient → a constant width of ~21 units, gently wavering |
| Ponds | `#4e4840` | `#6e675c`, 3.0 u | lobed ovals on a 560-unit grid, cut back from the road and the hills; shore ring 4.2 u inside |

**Decals are placed by feature, not sprinkled.** All of them are baked into the chunk:
1. *Hills:* parallel ink hatch strokes inside the lower-right rim (the shade side, with light from the upper left) and a pale shine arc on the upper-left rim.
2. *Edges:* grass clumps where two regions meet. Each is one tall three-stroke tuft with smaller ones leaning off it along a shallow arc, never a straight row. Cattail reeds stand at the water's edge.
3. *Road:* outlined paper pebbles lining both shoulders, a few faint wheel dashes inside.
4. *Water:* paper ripple arcs following the shore ring, slate lily pads in little rafts.
5. *Flower patches:* at most one per 150-unit cell, only on plain meadow. Small ink-ringed daisies sit around a centre, where a big smiling daisy prop may stand, plus a few tufts.
6. *Open meadow:* only a handful of ink wind-curls, so large calm areas stay calm.

## Characters

All figures face right and are mirrored for left. Size: the main character is ~20 units wide and ~36 tall. Shadows are solid ink ellipses at 36 % opacity. Every figure has its own animation phase (from its seed or position), so a crowd never moves in lock-step.

**Main character — a jaunty ink cat-fellow.**
- *Head:* black ellipse 7.1 × 6.7 with a thin white rim arc. Two pointed ears (roundPoly, radius 1.0); the front ear has a soot inner ear. The ears and the head tilt lag behind the body (follow-through).
- *Face mask:* pale `#e6dece` with two lobes over the eyes and a snout that sticks out past the head outline.
- *Face:* pie-cut eyes 1.05 × 1.95; an ink button nose with a white glint; a wide open grin with a slate tongue; a small cheek crease. Expressions: normal, blink, "oops" (skid), hurt (X eyes, O mouth).
- *Body:* black ellipse torso 4.0 × 4.7, a white bow tie with slate polka dots, slate shorts with two white buttons.
- *Limbs:* ink hoses (arms 1.45, legs 1.75) and a curly tail ending in a spiral, which swings a quarter cycle behind the body.
- *Gloves:* white palm 2.05 × 1.85, a thumb, a rolled cuff and two ink stitch lines.
- *Shoes:* pale ovals 3.75 × 2.1 with a toe-cap arc and a white shine.
- *Baked poses (19 sprites, each normal + flash, both facings):*
  - walk: 8 frames from a pose table. Foot x is `[6.2, 3.2, 0.2, −3.0, −6.0, −3.6, 1.0, 4.6]`, foot lift `[0, 0, 0, 0.5, 1.3, 3.4, 4.6, 2.4]`, shoe angle −0.38 … 0.52. The body bob for contact / down / passing / up is `0.3 / 1.3 / −0.7 / −1.9` (+ = lower). The far leg runs half a cycle behind. Each arm swings against the leg on its side **one frame late**, and the noodle bows behind the motion;
  - idle: 4 beat poses (dip on the beat, rise, up + toe tap, settle) + 2 blink frames, with hands on hips and the arms bowing outward;
  - run: the body leans 0.24 and the legs become a **wheel** of ink motion arcs around a faint grey disc, with ears and tail streaming back;
  - skid: held for 0.16 s after every run. Heels are dug in, the body is thrown back (−0.17), the arms fly up behind and the face reads "oops";
  - recoil: arms flung up, legs splayed, X eyes, O mouth.

**Small creature — a hopping imp.** About 13 wide, 17 tall (drawn at 1.12).
- *Body:* round, 6.5 × 5.9, in three designed tones: ink (with pale horns and pale shoes), slate, and paper (both with ink horns and soot shoes).
- *Head parts:* two curved horns and a pale two-lobed face patch.
- *Face:* white eyes with pie-cut pupils and a toothy grin with two white fangs.
- *Limbs and tail:* an arrow-tipped tail, tiny gloves and little shoes.
- *Hop (6 frames):* 0 crouch (anticipation) · 1 take-off stretch · 2 rise · 3 apex · 4 fall stretch · 5 landing squash.
  - Air height is `[0, 0.42, 0.86, 1, 0.62, 0.1] × 3.8 u`.
  - Squash per frame is `[0.9, −0.8, −0.35, 0.05, −0.5, 0.6]` (+ squash, − stretch): width × (1 + 0.11·s), height × (1 − 0.13·s).
  - The legs tuck in the air and the tail whips.

**Fast creature — a sheet ghost.**
- *Sheet:* white `#f4efe4` with a fog crescent, a wavy three-scallop hem and a curling tail.
- *Face:* big pie-cut ink eyes, worried brows and an O mouth with a slate tongue.
- *Arms:* two noodle arms (width 2.0–2.1) reaching forward, each with a small oval hand.
- *Fade:* the bottom 9 units fade to 35 % opacity. Its flash is **negative** (ink).
- *Motion:* 6 wobble frames at 8 fps. It hovers 4.6 units up on an uneven two-partial bob that lingers near the top. It stretches while rising, squashes while sinking, and leans into its motion (up to 0.16 rad).

**Large creature — the big bully.** About 46 wide, 60 tall.
- *Body:* a barrel body in a **striped sweater** (paper/soot bands 3.1 units high, every 6.2) over soot trousers with two buttons.
- *Head:* a black head with a stubbled pale jaw, a heavy ink unibrow, small pie eyes, a big bulb nose and a scowl with an underbite tooth.
- *Hat:* a slate derby with a black band, baked as a **separate sprite** and placed on the head top each frame, so it can lag:
  - it jumps up to 2.6 units a little after every heavy landing and tips the other way;
  - it jumps 7 units on a hit;
  - it pops off and tumbles away on removal.
- *Limbs:* thick ink hose arms (3.7–3.9) ending in huge gloved fists (glove scale 1.9–2.0); short thick legs in black boots with a white shine.
- *Stomp (8 frames):* body bob `[1.8, 0.6, −0.9, 0.2]` twice, foot lift `[0, 2.3, 4.4, 2.0]` alternating legs, lean ±0.085, fists swinging opposite, plus a 3 % squash on the shared beat.

**States (all creatures).**
- *Hit (~120 ms):* a sharp squash that springs back through a stretch.
  - The spring is `sp = e^(−11t)·cos(30t)`, applied as width × (1 + 0.8·A·sp) and height × (1 − A·sp), with A = 0.3 (0.2 for the bully).
  - The body recoils, rotating up to 0.32 rad away from the blow.
  - The flash sprite (white, or ink for ghosts) is laid on top at `min(0.9, flash·1.4)`.
- *Removal (deathT 0 → 1, 0.35 s in motion):*
  - Imps and the bully jolt up, stretched, in the flash colour (0–0.14). They slam down into a pancake (0.14–0.3), then spin shut like a coin under the poof (0.3–0.52).
  - The bully's hat flies off on a parabola and tumbles.
  - A pale copy of the creature (the soul) with a little halo rises 26 units (34 for the bully), sways and fades.
  - Ghosts puff up in negative, then deflate and sink into an empty, crumpled sheet that fades.
- *Spawn (spawnT 0 → 1, 0.45 s):*
  - An ink puddle spreads first (until 0.18).
  - The creature springs out of it stretched (height 0.1 → 1.3, up 4.5 u), lands in a squash and settles with a damped wobble `e^(−5u)·cos(9u)`.
  - Ghosts instead unroll upward out of their puff: a thin streak first, then they fill out with an outBack overshoot.

## Props

| Prop | Variants | Look |
| --- | --- | --- |
| Tree | 3 | Curly tree: wavy soot trunk (hose 3.3), cloud canopy of 6 ash circles with a slate crescent, 5 ink spiral curls, fog highlight arcs · swirled poplar: tall slate flame shape with 4 ink chevron bands and a curl at the tip · bare curly tree: soot trunk with four branches, each ending in a spiral curl |
| House | 2 | Cottage: paper walls slightly out of square, a soot roof with scalloped shingle rows, a slate chimney, windows like sleepy eyes (half-drawn slate shade), a door like a mouth · crooked house: tall, leaning, clapboard lines, a round attic window and a steep scalloped roof |
| Windmill | 1 | A tapering paper tower with a fog crescent and an ink door; four lattice sails as a separate sprite that turns |
| Picket fence | 1 | Five white pickets, each leaning differently, on two ash rails |
| Daisy clump | 1 | Three smiling daisies (9 white petals, an ink centre with two white eyes and a smile) on ink stems with slate leaves |
| Cattails | 2 | Two or three slate blades and ink cattail heads, the tallest bending over |
| Hill mound | 2 | Low ash dome with a slate crescent, a fog highlight ridge, ink tufts along the top and a curl |
| Street lamp | 1 | Ink post with curly scroll arms and a white lantern; a soft white radial glow flickers at 24 fps |
| Barrel / crate | 2 | Slate barrel with ink hoops and ash staves; ash crate with an ink X brace |
| Toadstools | 2 | Paper stems under soot caps with paper spots, two or three in a cluster |

**Placement is composed**, never a uniform scatter:
- **Hill groves:** 2–4 trees stand on an arc along the upper rim of most hills (78 %), sometimes with toadstools at their feet. About a third of the hills carry a windmill on the crest.
- **Villages:** one per 520-unit cell at most (46 %), only on plain meadow. Each has 2 or 3 houses in a staggered row, picket fences at both ends (80 %), one lamp post, one barrel or crate, and trees framing the back corners.
- **The road:** lamp posts stand on its shoulders. Fences follow its straight east–west runs, projected exactly onto a line 7–8 units outside the edge.
- **Ponds:** cattails ring the shore, projected onto the shore line; a few stand back as bare reeds.
- **Flower patches:** the big daisy clump stands at the centre of a decal flower patch.
- A clear area of 95 units is kept around the starting point.

**The dance.** All props share one beat at 120 bpm (`q` = squash pulse, `sway` = alternating swing). Each prop type has its own response and its own **lag**, so tall things follow through after the beat. Each prop also swings with its own amplitude (0.8–1.2):

| Prop | Sway (skew) | Squash | Lag |
| --- | --- | --- | --- |
| Tree | 0.045 | 4 % | 0.07 s |
| House | 0.025 | 5 % | 0.03 s |
| Windmill | 0.02 | 3.5 % | 0.05 s (sails turn 0.85 rad/s and kick on every beat) |
| Daisies | 0.09 | 7 % | 0.02 s |
| Cattails | 0.12 | 3 % | 0.10 s |
| Lamp | 0.03 | 3 % | 0.06 s |
| Toadstools | — | 8 % | 0.01 s |
| Fence | 0.03 | — | — |

The skew is anchored at the base (`setTransform(S·sx, 0, −skew·S·sy, S·sy, x, y)`). The cottage chimney sends three curly smoke puffs up in turn. Lamp glows and windmill sails ride along with the sway.

## Effects and particles

- **Projectile:** an ink eighth note, a beamed pair or a sixteenth with a thin white halo outline. It wobbles ±0.35 rad and stays upright, trailed by three short ink speed lines.
- **Small collectible:** a paper coin with an ash ring and a star emboss. It spins by squashing its width to `max(0.18, |cos(t·5)|)` and bobs above a shadow.
- **Large collectible:** a white faceted diamond with fog and ash facets and ink facet lines. It pulses 8 % on the beat and flashes a 4-point twinkle.
- **Orbiting object:** a small white bird with a black wing (2 frames at 10 fps), bobbing, facing along its path.
- **Impact:** a jagged white **POW** burst with 11 spikes and a fog centre, scaling 0.5 → 1.25 → 0.35 over 0.16 s, plus a twinkle flying off.
- **Poof:** a large central cloud puff and 5–9 smaller puffs bursting out and rising 7 units (white and fog, each with an inner ink spiral). Add 2–6 white stars bouncing with gravity and 3–7 ink drops.
- **Large poof:** adds an ink + white ring (0.45 s) and 14 radiating ink rays.
- **Spawn:** an ink puddle with five splatter dots and a paper glint spreads out (outBack) and throws up ink drops. The creature springs out of it stretched, and the puddle dries away. Ghosts unroll out of a curly puff instead.
- **Removal residue:** the poof covers the coin-spin; a pale **soul** copy of the creature with a small ink-ringed halo floats up, swaying, and fades. The bully's derby tumbles away on a parabola.
- **Recoil:** a big POW, 4 stars and two white sweat drops.
- **Glow-up:** ring + rays, 8 notes floating up with a sway (1.1–1.5 s), 6 stars.
- **Run:** 3 grey dust puffs, 4 ink zip dashes, and live speed lines behind the figure.
- **Ambient:** single notes drift up and fade above the ground, one per ~190-unit cell, 3.4 s cycle.

## Atmosphere and lighting

The projector runs on the display canvas after everything else. It steps at **24 fps**: `tick = floor(time × 24)`, and every random choice is a hash of the tick.

1. **Grade.** `globalCompositeOperation = 'color'` with `#978c7b` at 74 % keeps luminance but replaces hue and saturation. The native palette is already graded, so this pass only runs while other styles' elements are on screen.
2. **Film layer (one blit).** Baked per screen size at grain resolution (1 grain px = `round(H/900 × 1.3)` display px), in 3 variants. Each texel pre-composites three layers:
   - a flat flicker: −4.5 %, 0 or +3 % brightness;
   - the vignette: radial ink, alpha 0 → 0.18 → 0.48 → 0.76 from 40 % to 102 % of the half diagonal, centred at 48 % height;
   - the rounded gate: corner radius 7.5 % of the height, blurred, 94 % black;
   - grain: white/dark specks, alpha ≤ 0.21.

   Each tick picks a variant (bright flashes are rare) and a ±3 px offset. The vertical offset doubles as **gate weave**: the frame edge jumps by about a pixel.
3. **Dust:** 0–4 specks (ellipses 0.8–3.6 px) or curly hairs per tick, black or white, alpha 0.55–0.9, never repeated in the next frame.
4. **Scratches:** 3 slots. Each lives 14, 25 or 36 film frames, is active 42 % of the time and jitters ±1.5 px sideways. Two slots are white, one is black; alpha 0.16–0.34.
5. **Cue mark:** a black dot with a pale ring, top right, 5 frames every 30 s.

Light inside the scene is implied from the top-left (shines top-left, crescents bottom-right). The only emitted light is the lamp glow.

## UI

- **Title-card panel:** an inline SVG `border-image` (72 × 72, slice 26, `fill`):
  - a dark `#17130f` card with rounded corners;
  - an outer 2 px paper rule with **concave corners**;
  - an inner 0.9 px rule;
  - an Art-Nouveau curl and a small dot in each corner, and a paper dot at each outer corner.

  Border width: 20–32 px. It carries `filter: drop-shadow(0 5–9px 0 rgba(10,8,6,.32–.42))`, a hard lip with no blur.
- **Top bar = film strip:** a black strip with sprocket holes (repeating paper dashes top and bottom). The fill is silver film frames: `#d8d0c0` 38 px with `#8f877a` 2 px dividers. A black cap shows the number in Limelight.
- **Pill bar:** 2 px paper border plus a 3 px ink ring, a black trough, a paper engraving-hatch fill (`repeating-linear-gradient(-45deg, #efe9dc 0 4px, #c9c1b1 4px 6px)`) and a white gloss band. The number sits centred in Limelight with an ink outline.
- **Counter / title / caption bar:** title cards with a Limelight number or name and a Special Elite label.
- **Overlay:** a sunburst of 30 pale rays (`repeating-conic-gradient`), a radial darkening and a backdrop `grayscale(1) sepia(.2) brightness(.86)`.
- **Cards:** title cards 246 × 304. The icon sits in a white medallion with a triple ink/paper/ink ring. Names are in Rye and text in Special Elite. A number disc (paper on ink) sits on the top-left corner. Cards pop in with a rubbery squash (0.6 × 1.4 → 1.08 × 0.9 → 1) and jelly-wobble on hover.
- **Closing screen:** an **iris-out**. A circle with a 220 vmax ink box-shadow shrinks from 260 vmax to 62 vmin.
- **Icons:** drawn with the same painter at 2.2 px outline in a 48 × 48 box. They include a smiling heart with pie eyes, an imp head with X eyes, a glove punching through a POW burst, a lightning bolt, notes, a striped ball, a bird, a winged shoe, a horseshoe magnet and a steaming pie.

## Motion and animation

- **The beat:** `b = time × 2`; `q = max(0, cos(frac(b)·π))^6 + max(0, −cos(frac(b)·π))^6` (a sharp pulse on each beat); `sway = cos(b·π)`. Props sample it with their own lag, so the dance ripples instead of snapping.
- **Per-actor phases:** creatures offset their cycles by their seed, and the main character's blink by its position. No two figures hop, bob or blink together.
- **Walk:**
  - `cycle = anim × 0.2`, 8 drawn frames (contact, down, passing, up — twice);
  - body bob `0.3 / 1.3 / −0.7 / −1.9` per quarter, with an extra squash on the two down frames (sx 1.035 / sy 0.955) and a stretch on the up frames (sx 0.98 / sy 1.03);
  - the lifted foot rises up to 4.6 u and bows its leg forward;
  - the arms swing against the legs one frame late, and the hoses bow behind the motion (overlapping action);
  - ears and head tilt run on a double-frequency sine, the tail a quarter cycle behind;
  - a dust puff on 45 % of steps.
- **Idle:** four poses locked to the beat (dip, rise, toe tap, settle), a 2.2 % sway, a blink every ~3.3 s on its own phase.
- **Run → skid:** two run frames alternating 22 times a second under a 16 % stretch, then 0.16 s of skid that eases out of a 12 % squash.
- **Imps:** 6-frame hop at `anim × 0.55 + seed` (crouch → stretch → apex → stretch → squash), rock ±0.07 rad.
- **Ghosts:** 6 wobble frames at 8 fps; an uneven hover `sin(t)·1.5 + sin(2t + 1.1)·0.55` at 2.6 rad/s that stretches 5 % while rising; lean up to 0.16 rad.
- **Bully:** 8-frame stomp at `anim × 0.3 + seed`, 3 % squash on the beat; the hat lags each landing by about 0.16 of a cycle.
- **Hit:** a damped spring, `e^(−11t)·cos(30t)` (squash → stretch → settle in ~120 ms), a recoil tilt away from the blow and a flash overlay.
- **Spawn:** puddle first, then a stretched spring out of it, a squash landing and a damped wobble; ghosts unroll upward with an outBack overshoot.
- **Removal:** jolt (stretch, flash colour) → pancake slam → coin-spin shut; the soul with a halo floats up; the bully's hat tumbles off; ghosts deflate into an empty sheet.
- **Glow-up:** bounce `sy 1 + 0.2·sin(4π·t)·t` with a 5-unit lift.
- **Floating numbers:** start tall (sy 1.6), overshoot wide (sx 1.4), settle, then shrink 70 % and fade.
- **Film:** always 24 fps, whatever the frame rate.

## Do and don't

**Do**
- Draw limbs as one bowed curve, and exaggerate the bow when they swing.
- Give every hand a white glove and every foot a big shoe.
- Cut a wedge out of every pupil.
- Give ink bodies a pale face mask.
- Sync everything idle to one beat.
- Keep the ground light-mid grey.
- Step film effects at 24 fps.
- Frame every UI panel as an ornamental title card.

**Don't**
- Add colour — even one hue breaks the illusion.
- Draw elbows, knees or realistic tapered limbs.
- Use soft gradients or glossy highlights on figures.
- Let grain, dust and scratches swallow small figures.
- Animate props out of sync.
- Put dark regions under dense crowds of ink figures.
- Use modern sans-serif fonts.

## Implementation recipe

1. **Palette first:** ink, 4 warm greys, 2 whites, plus face/shoe/sheet tones. Nothing else.
2. **Painter:** write the two-pass part painter (`part` for closed shapes, `hose` for limbs, `detail` for faces). One outline weight (1.0 u), one crescent per part.
3. **Signature parts:** `pieEye`, `glove`, `shoe`, `hosePath(x1, y1, x2, y2, bend)`.
4. **Main character:** a pose function that reads pose tables (foot x, lift, angle, bob per frame) and returns limb end points and bends. Arms take the leg phase one frame late. Bake 8 walk + 6 idle (4 beat poses, 2 blinks) + 2 run + 1 skid + 1 recoil frames, each normal + flash, mirrored.
5. **Creatures:** imp (6 hop frames from an air + squash table, × 3 tones), ghost (6 wobble frames, negative flash, bottom fade), bully (8 stomp frames + a separate hat sprite with a per-frame anchor). Give every actor its own phase.
6. **Props:** the same painter; draw them with a base-anchored skew + scale from the shared beat.
7. **Ground:** cell-based hills and ponds + a constant-width road + soft meadow washes → signed distance → fill, lighter rim, weighted ink contour, inner ring → feature-placed ink decals (edge clumps, shoulder pebbles, shore ripples, flower patches). Then place props as groves, villages, road furniture and shore reeds.
8. **Effects:** notes, coin, diamond, bird, POW, puffs with spirals, stars, ink drops; give each a pop / fade curve.
9. **Film:** bake 3 film-layer variants per screen size and blit one per frame with a tick-hashed offset. Then dust, scratches and a cue mark. Grade only foreign colours.
10. **UI:** an ornamental SVG `border-image` for all panels, a film-strip bar, Limelight / Rye / Special Elite.

## Code

**Two-pass painter with rubber-hose limbs**

```js
const INK = '#16120e', OL = 1.0;
function Painter(ctx, mode) { this.c = ctx; this.mode = mode; }       // mode: 'outline' | 'fill'
Painter.prototype.part = function (shape, fill, o = {}) {
  const c = this.c; c.beginPath(); shape(c);
  if (this.mode === 'outline') { c.lineWidth = OL * 2; c.strokeStyle = c.fillStyle = INK; c.stroke(); c.fill(); return; }
  c.save(); c.clip();
  c.fillStyle = o.shade || fill; c.fillRect(-500, -500, 1000, 1000);   // shade everywhere…
  if (o.shade) {                                                          // …lit colour clipped to the shifted shape
    c.beginPath(); c.save(); c.translate(o.sh[0], o.sh[1]); shape(c); c.restore(); c.clip();
    c.fillStyle = fill; c.fillRect(-500, -500, 1000, 1000);
  }
  c.restore();
};
function ctrl(x1, y1, x2, y2, bend) {                                     // the bow: move the middle sideways
  const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1;
  return [(x1 + x2) / 2 - (dy / l) * bend, (y1 + y2) / 2 + (dx / l) * bend];
}
Painter.prototype.hose = function (x1, y1, x2, y2, bend, w, col) {      // a limb – never an elbow
  const c = this.c, q = ctrl(x1, y1, x2, y2, bend);
  c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(q[0], q[1], x2, y2);
  c.lineWidth = this.mode === 'outline' ? w + OL * 2 : w;
  c.strokeStyle = this.mode === 'outline' ? INK : col; c.stroke();
  return Math.atan2(y2 - q[1], x2 - q[0]);                               // end direction -> glove angle
};
function paint(ctx, fn) { ctx.lineCap = ctx.lineJoin = 'round'; fn(new Painter(ctx, 'outline')); fn(new Painter(ctx, 'fill')); }
```

**Pie-cut eye, the walk and hop tables, the hit spring**

```js
function pieEye(c, x, y, rx, ry, faceColour) {
  c.save(); c.translate(x, y);
  c.fillStyle = INK; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); c.fill(); c.clip();
  c.fillStyle = faceColour;                                               // the wedge shows the face behind
  c.beginPath(); c.moveTo(rx * 0.15, -ry * 0.12); c.lineTo(rx * 1.4, -ry * 1.05); c.lineTo(rx * 1.4, -ry * 0.25); c.fill();
  c.restore();
}
// The walk is a pose TABLE (contact, down, passing, up – twice), not a sine: held, readable poses.
const WALK = { x: [6.2, 3.2, 0.2, -3.0, -6.0, -3.6, 1.0, 4.6], l: [0, 0, 0, 0.5, 1.3, 3.4, 4.6, 2.4],
  a: [-0.38, -0.05, 0, 0.22, 0.52, 0.35, 0.05, -0.25], bob: [0.3, 1.3, -0.7, -1.9] };  // bob: + = lower
function walkPose(f) {                                                    // f = 0..7
  const g = (f + 4) % 8, bob = WALK.bob[f % 4];                          // far leg half a cycle behind
  const leg = (k, x0) => [x0 + WALK.x[k], -WALK.l[k], WALK.l[k] > 0.3 ? -(1.1 + 0.6 * WALK.l[k]) : 1.0, WALK.a[k]];
  const arm = (k) => -WALK.x[(k + 7) % 8] / 6.2;                          // arms: the leg phase ONE FRAME LATE
  const sN = arm(f), sF = arm(g);
  return { bob, near: leg(f, 1.0), far: leg(g, -1.0),
    nearHand: [3.2 + sN * 6.0, -9.2 + bob - sN * sN * 1.9], farHand: [-1.6 + sF * 5.0, -9.6 + bob - sF * sF * 1.6] };
}
// The imp hop: crouch (anticipation) → take-off stretch → rise → apex → fall stretch → landing squash.
const IMP_AIR = [0, 0.42, 0.86, 1.0, 0.62, 0.1], IMP_SQ = [0.9, -0.8, -0.35, 0.05, -0.5, 0.6];
const hopBody = (f) => ({ y: -7.8 - IMP_AIR[f] * 3.8, rx: 6.5 * (1 + 0.11 * IMP_SQ[f]), ry: 5.9 * (1 - 0.13 * IMP_SQ[f]) });
// Hit: a damped spring – squash, stretch, settle in ~120 ms (t = seconds since the hit).
const hitSpring = (t, A = 0.3) => { const sp = Math.exp(-11 * t) * Math.cos(30 * t); return { sx: 1 + 0.8 * A * sp, sy: 1 - A * sp }; };
```

**The shared beat for dancing props**

```js
function beat(time) {
  const b = time * 2, ph = b - Math.floor(b);                             // 120 bpm
  const q = Math.max(0, Math.cos(ph * Math.PI)) ** 6 + Math.max(0, -Math.cos(ph * Math.PI)) ** 6;
  return { q, sway: Math.cos(b * Math.PI) };
}
function drawDancing(ctx, sprite, x, y, S, amp, time, lag) {              // base-anchored skew + squash
  const { q, sway } = beat(time - lag), sx = 1 + amp * 0.7 * q, sy = 1 - amp * q;   // lag 0.03–0.1 s: tall props follow through
  ctx.setTransform(S * sx, 0, -sway * amp * S * sy, S * sy, x * S, y * S);
  ctx.drawImage(sprite.canvas, -sprite.ax, -sprite.ay, sprite.w, sprite.h);
}
```

**The projector: one baked film layer per screen size**

```js
function makeFilmLayers(W, H, g) {                                        // g = grain px size
  const w = Math.ceil(W / g) + 8, h = Math.ceil(H / g) + 8;
  const base = document.createElement('canvas'); base.width = w; base.height = h;
  const b = base.getContext('2d'), R = Math.hypot(w, h) / 2;
  const v = b.createRadialGradient(w / 2, h * 0.48, R * 0.4, w / 2, h * 0.48, R * 1.02);
  [[0, 0], [0.55, 0.18], [0.85, 0.48], [1, 0.76]].forEach(([t, a]) => v.addColorStop(t, `rgba(14,11,8,${a})`));
  b.fillStyle = v; b.fillRect(0, 0, w, h);
  // …rounded gate (even-odd rect minus round rect, blurred), then per texel: flicker ∘ vignette ∘ grain
  return [-0.045, 0, 0.03].map((flicker) => bakeGrainOver(base, flicker));
}
function drawFilm(ctx, layers, W, H, g, time) {
  const tick = Math.floor(time * 24), h = (k) => hash(tick, k);           // 24 fps cadence
  const L = layers[h(2) < 0.62 ? 1 : h(3) < 0.6 ? 0 : 2];
  const weave = Math.round(Math.sin(time * 2.1) + (h(1) - 0.5));          // ~1 px gate jump
  const ox = 4 + Math.round((h(4) - 0.5) * 6), oy = 4 + Math.round((h(5) - 0.5) * 6) - weave;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(L, ox, oy, Math.ceil(W / g), Math.ceil(H / g), 0, 0, Math.ceil(W / g) * g, Math.ceil(H / g) * g);
  // then 0–4 dust specks / hairs and up to 3 long scratches, all hashed from `tick`
}
```

## Adapting it to your project

- **Side view:** the figures are already drawn in profile-3/4. Keep the 8-frame walk, add a jump pose with both legs bowed back and arms up, and turn the ground washes into rolling horizontal hills with the same rim + ink contour.
- **More creatures:** any round body + face mask + pie eyes + gloves + shoes reads as part of this cast. Vary the silhouette (ears, horns, hats), not the colour.
- **Telling groups apart without colour:** use patterns (stripes, polka dots, checks), the three body tones (ink / slate / paper) and hats.
- **Lighter film:** for dense scenes or long sessions, halve grain alpha and the scratch probability; keep the vignette and gate, which frame the image without hurting readability.
- **Music:** drive `beat()` from your actual soundtrack BPM, and props will dance on the music.
- **Mixing:** the projector works over any other art. The `color` grade turns colourful scenes silver-sepia, and the gate and grain do the rest.

## Performance notes

- All sprites (~190 canvases including flash and mirrored copies, the separate bully hat and the windmill sails) are baked once in init. Per frame it is only `drawImage` with transforms; the beat is computed once per frame (props re-sample it with their lag, which is a few multiplications).
- Ground chunks are generators: the per-pixel distance work runs only in grid cells near an edge (others are block-filled); decals are baked into the chunk.
- The film layer is baked per screen size (3 variants at grain resolution). Each frame costs **one** full-screen `drawImage`, plus a handful of strokes for dust and scratches.
- The `color` grade is a full-screen blend. Skip it when only native elements are visible.
- Never copy the canvas onto itself for gate weave — moving the gate layer gives the same jump for free.
- Floating-number sprites are cached per value (cleared at 500).

## Copy-paste prompt

```text
Use the Rubber Hose 1930s art style for my project:
- Pure black-and-white early-1930s cartoon look: ink #16120e outlines, fills only in warm greys
  #3a342d, #6d665b, #a0988a, #cdc5b5 and whites #efe9dc / #faf7ef. No hue anywhere.
- Characters: round ink bodies with pale face masks (#e6dece), pie-cut eyes (ink ovals with a wedge cut out),
  elbow-less rubber-hose limbs (one bowed curve per limb), puffy white four-finger gloves and big pale shoes.
- One merged ink outline per figure (outline pass at 2x weight, then fills), one grey crescent per part,
  thin white rim shines on black parts.
- 8-frame bouncy walk (contact, down, passing, up x2) with arms one frame behind the legs; limbs bow like
  noodles; hops with crouch anticipation, stretch and landing squash; a lagging hat, ears and tail.
- Hits: a squash that springs back through a stretch (~120 ms) + flash; removals: jolt, pancake, coin-spin,
  then a pale soul with a halo floats up. Spawns: an ink puddle, then a stretched spring out of it.
- Everything idle dances on one shared 120 bpm beat: props squash on the beat and sway from beat to beat.
- Ground: flat grey washes (#cfc8b9 base, #bdb6a6 meadows, #968e7f hills, #e5dece road, #4e4840 ponds) with a
  lighter inner rim and a crisp 0.8-unit ink contour; decals only where features meet (tuft clumps at edges,
  pebbles on the road shoulders, ripples at the shore, daisy patches), calm open meadow between.
- Props in designed groups: tree groves on hill rims, little villages (houses, fences, lamp, barrel), lamps
  along the road, cattails around ponds, windmills on hill crests; all dance on the beat with per-type lag.
- Effects: music-note projectiles, POW bursts, curly cloud poofs, white stars, ink drops.
- Atmosphere at 24 fps: grain, dust, hairs, scratches, flicker, ~1 px gate weave, heavy vignette with
  rounded projector-gate corners, faint silver-sepia tone.
- UI: dark title cards with double paper rules and Art-Nouveau corner curls; Limelight for numbers and
  titles, Rye for card names, Special Elite for body text; a film-strip progress bar.
```
