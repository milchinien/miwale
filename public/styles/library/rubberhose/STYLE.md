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
| Meadow Wash | `#b2aa9a` | Meadow regions, lighter rim `#bfb8a9` |
| Hummock Wash | `#928a7c` | Dark rolling hills, rim `#a39b8c`, inner contour ring |
| Path | `#e4ddcd` | Winding paths, rim `#d6cebe` |
| Pond | `#565047` | Ponds, rim `#726b60`, paper ripples |
| Sepia Grade | `#978c7b` | `color` blend at 74 % — only over foreign colours |
| Gate Black | `#0c0a08` | Vignette, gate corners, dark dust and scratches |
| Title Card | `#17130f` | UI panels and cards |
| Caption Grey | `#b9b1a1` | UI labels |

**Rules**
- No hue anywhere. The faint warmth (silver-sepia) is built into the greys themselves.
- Read by **value**: black bodies + pale face masks + white gloves + light shoes on a light-mid ground.
- The brightest whites are reserved for small focal shapes: gloves, eyes, buttons, petals, collectibles.
- Dark ground regions (hummocks, ponds) stay small and rare, so ink figures never sink into them.
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

A flat, painted studio background seen from above. Noise fields are sampled on a 4-unit grid per 256-unit chunk. Each pixel gets a signed distance `value / |gradient|` to every region edge. That gives three things:
- a crisp anti-aliased edge,
- a lighter **inner rim band** (2.4–2.8 units), so regions read as gently raised,
- a centred **ink contour** 0.8 units wide at 92 % opacity.

Dark hummocks get a second, fainter ring 5.5 units inside (ponds at 4 units). That turns them into rolling hills.

| Layer (bottom → top) | Fill | Rim | Extra |
| --- | --- | --- | --- |
| Base wash | `#cfc8b9` | — | ±4 % brightness tint, period ~1400 u |
| Meadow wash | `#b2aa9a` | `#bfb8a9`, 2.4 u | noise period ~440 u |
| Dark hummocks | `#928a7c` | `#a39b8c`, 2.8 u | inner ring at 5.5 u, alpha 0.45 |
| Winding path | `#e4ddcd` | `#d6cebe`, 1.6 u | zero-contour of 1600-u noise → even width |
| Ponds | `#565047` | `#726b60`, 2.6 u | inner ring 4 u; kept away from paths |

**Decals** (jittered 11-unit grid, only where the material is uniform for 4.5 units):
- base: three-stroke ink tufts (0.5 u lines), spiral curls, tiny ink-ringed white daisies, short dashes;
- meadow: tufts, hatch clusters (3–5 parallel 0.4 u strokes), daisies;
- hummocks: pale tufts, ink hatch, curls;
- path: paper pebbles with an ink ring, faint dashes;
- ponds: paper ripple arcs, slate lily pads with a notch.

## Characters

All figures face right and are mirrored for left. Size: the main character is ~20 units wide and ~36 tall. Shadows are solid ink ellipses at 36 % opacity.

**Main character — a jaunty ink cat-fellow.**
- *Head:* black ellipse 7.1 × 6.7 with a thin white rim arc. Two pointed ears (roundPoly, radius 1.0); the front ear has a soot inner ear.
- *Face mask:* pale `#e6dece` with two lobes over the eyes and a snout that sticks out past the head outline.
- *Face:* pie-cut eyes 1.05 × 1.95; an ink button nose with a white glint; a wide open grin with a slate tongue; a small cheek crease.
- *Body:* black ellipse torso 4.0 × 4.7, a white bow tie with slate polka dots, slate shorts with two white buttons.
- *Limbs:* ink hoses — arms 1.45, legs 1.75 — and a curly tail ending in a spiral.
- *Gloves:* white palm 2.05 × 1.85, a thumb, a rolled cuff and two ink stitch lines.
- *Shoes:* pale ovals 3.75 × 2.1 with a toe-cap arc and a white shine.
- *Poses:*
  - walk: 8 frames;
  - idle: hands on hips (the arms bow outward), toe tap;
  - run: the body leans 0.24 and the legs become a **wheel** of ink motion arcs (4 outer, 3 inner) around a faint grey disc, with the shoes flung front and back;
  - recoil: arms flung up, legs splayed, X eyes, O mouth.

**Small creature — a hopping imp.** About 13 wide, 17 tall (drawn at 1.12).
- *Body:* round, 6.5 × 5.9, in three tones: ink, slate or paper.
- *Head parts:* two curved horns (fog on ink bodies, ink on light ones) and a pale two-lobed face patch.
- *Face:* white eyes with pie-cut pupils and a toothy grin with two white fangs.
- *Limbs and tail:* an arrow-tipped tail, tiny gloves and little shoes.
- *Hop:* 6 frames; the body rises 3.2 units and the legs tuck in the air.

**Fast creature — a sheet ghost.**
- *Sheet:* white `#f4efe4` with a fog crescent, a wavy three-scallop hem and a curling tail.
- *Face:* big pie-cut ink eyes, worried brows and an O mouth with a slate tongue.
- *Arms:* two noodle arms (width 2.0–2.1) reaching forward, each with a small oval hand.
- *Fade:* the bottom 9 units fade to 35 % opacity.
- *Motion:* 6 wobble frames at 8 fps; it floats 4.5 units above its shadow.

**Large creature — the big bully.** About 46 wide, 60 tall.
- *Body:* a barrel body in a **striped sweater** (paper/soot bands 3.1 units high, every 6.2), soot trousers with two buttons.
- *Head:* a black head with a stubbled pale jaw, a heavy ink unibrow, small pie eyes, a big bulb nose and a scowl with an underbite tooth. A slate derby hat with a black band sits on top.
- *Limbs:* thick ink hose arms (3.7–3.9) ending in huge gloved fists (glove scale 1.9–2.0); short thick legs in black boots with a white shine.
- *Motion:* 4 stomp frames.

## Props

| Prop | Look |
| --- | --- |
| Curly tree | Wavy soot trunk (hose 3.3), cloud canopy of 6 ash circles with a slate crescent, 5 ink spiral curls, fog highlight arcs |
| Swirled poplar | Tall slate flame shape with 4 ink chevron bands and a curl at the tip |
| Bare curly tree | Soot trunk with four branches, each ending in a spiral curl |
| Cottage | Paper walls slightly out of square, a soot roof with scalloped shingle rows, a slate chimney with three curly smoke puffs, windows like sleepy eyes (half-drawn slate shade), a door like a mouth |
| Crooked house | Tall, leaning, with clapboard lines, a round attic window and a steep scalloped roof |
| Picket fence | Five white pickets, each leaning differently, on two ash rails |
| Daisy clump | Three smiling daisies (9 white petals, ink centre with two white eyes and a smile) on ink stems with slate leaves |
| Hill mound | Low ash dome with a slate crescent, a fog highlight ridge, ink tufts along the top and a curl |
| Street lamp | Ink post with curly scroll arms and a white lantern; a soft white radial glow flickers at 24 fps |
| Barrel / crate | Slate barrel with ink hoops and ash staves; ash crate with an ink X brace |
| Toadstools | Paper stems under soot caps with paper spots, two or three in a cluster |

**The dance.** All props share one beat at 120 bpm. With `q` as the squash pulse and `sway` as the alternating swing:
- trees: skew `sway × 0.04–0.05`, squash 4 %;
- daisies: skew 0.09, squash 7 %;
- houses: skew 0.025, squash 5 %;
- toadstools: squash 8 %;
- fences: sway only.

The skew is anchored at the base (`setTransform(S·sx, 0, −skew·S·sy, S·sy, x, y)`).

## Effects and particles

- **Projectile:** an ink eighth note, a beamed pair or a sixteenth with a thin white halo outline. It wobbles ±0.35 rad and stays upright, trailed by three short ink speed lines.
- **Small collectible:** a paper coin with an ash ring and a star emboss. It spins by squashing its width to `max(0.18, |cos(t·5)|)` and bobs above a shadow.
- **Large collectible:** a white faceted diamond with fog and ash facets and ink facet lines. It pulses 8 % on the beat and flashes a 4-point twinkle.
- **Orbiting object:** a small white bird with a black wing (2 frames at 10 fps), bobbing, facing along its path.
- **Impact:** a jagged white **POW** burst with 11 spikes and a fog centre, scaling 0.5 → 1.25 → 0.35 over 0.16 s, plus a twinkle flying off.
- **Poof:** a large central cloud puff and 5–9 smaller puffs bursting out and rising 7 units (white and fog, each with an inner ink spiral). Add 2–6 white stars bouncing with gravity and 3–7 ink drops.
- **Large poof:** adds an ink + white ring (0.45 s) and 14 radiating ink rays.
- **Spawn:** an ink puddle with five splatter dots and a paper glint spreads out (outBack), throws up ink drops, then dries away.
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

- **The beat:** `b = time × 2`; `q = max(0, cos(frac(b)·π))^6 + max(0, −cos(frac(b)·π))^6` (sharp pulse on each beat); `sway = cos(b·π)`.
- **Walk:**
  - `cycle = anim × 0.2`, 8 frames;
  - the body is highest (−1.8 u) at passing;
  - the lifted foot rises 3 u and bows its leg forward (bend −1.1 to −3.7), the planted leg bows back 1.0;
  - arms swing ±4.4 u opposite the legs with bend `2.4·cos(phase)`;
  - contact squash at draw time: sx 1.06, sy 0.93;
  - a dust puff at about 70 % of steps.
- **Idle:** toe tap on odd beats (front shoe rotated −0.42), squash 3.5 % on every beat.
- **Imps:** hop through 6 frames at `anim × 0.55`, contact squash sx 1.10 / sy 0.88, rock ±0.08.
- **Ghosts:** bob ±1.8 at 2.6 rad/s, breathe ±5 %, lean into horizontal speed (up to 0.14 rad).
- **Bully:** stomps through 4 frames at `anim × 0.3`, contact squash 7–8 %, plus the beat pulse.
- **Hit:** squash sx +22 % / sy −18 % and overlay the flash sprite at `min(0.9, flash·1.4)`.
- **Spawn:** elastic stretch out of the puddle (`outElastic`, sx compensates 0.7–1.6).
- **Removal:** stretch up to 0.7 × 1.4 in the flash colour over 0.09 s, then snap flat (1.6 × 0) by 0.19 s.
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
4. **Main character:** a pose function returning bob, lean, limb end points and bends per frame. Bake 8 walk + 2 idle + 2 run + 1 recoil frames, each normal + flash, mirrored.
5. **Creatures:** imp (6 hop frames × 3 tones), ghost (6 wobble frames, negative flash, bottom fade), bully (4 stomp frames).
6. **Props:** the same painter; draw them with a base-anchored skew + scale from the shared beat.
7. **Ground:** noise fields → signed distance → fill, lighter rim, centred ink contour, inner contour ring for hills → ink decals.
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

**Pie-cut eye and the walk pose**

```js
function pieEye(c, x, y, rx, ry, faceColour) {
  c.save(); c.translate(x, y);
  c.fillStyle = INK; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); c.fill(); c.clip();
  c.fillStyle = faceColour;                                               // the wedge shows the face behind
  c.beginPath(); c.moveTo(rx * 0.15, -ry * 0.12); c.lineTo(rx * 1.4, -ry * 1.05); c.lineTo(rx * 1.4, -ry * 0.25); c.fill();
  c.restore();
}
function walkPose(f) {                                                    // f = 0..7
  const ph = (f / 8) * Math.PI * 2, s = Math.sin(ph), cc = Math.cos(ph);
  const up = Math.max(0, cc), upB = Math.max(0, -cc);
  const bob = -1.8 * (1 - Math.abs(s));                                   // two bounces per cycle
  const leg = (x, lift) => [x, -3 * lift, lift > 0.05 ? -(1.1 + 2.6 * lift) : 1.0];  // foot x, y, bend
  return { bob, near: leg(1.5 + 4.7 * s, up), far: leg(-0.9 - 4.7 * s, upB),
    nearHand: [2.6 - 4.4 * s, -9 + bob, 2.4 * cc], farHand: [-1.6 + 4.4 * s, -9.4 + bob, -2.4 * cc] };
}
```

**The shared beat for dancing props**

```js
function beat(time) {
  const b = time * 2, ph = b - Math.floor(b);                             // 120 bpm
  const q = Math.max(0, Math.cos(ph * Math.PI)) ** 6 + Math.max(0, -Math.cos(ph * Math.PI)) ** 6;
  return { q, sway: Math.cos(b * Math.PI) };
}
function drawDancing(ctx, sprite, x, y, S, amp, time) {                   // base-anchored skew + squash
  const { q, sway } = beat(time), sx = 1 + amp * 0.7 * q, sy = 1 - amp * q;
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

- All sprites (~170 canvases including flash and mirrored copies) are baked once in init. Per frame it is only `drawImage` with transforms; the beat is computed once per frame.
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
- 8-frame bouncy walk with two bounces per cycle; limbs bow like noodles; strong squash & stretch.
- Everything idle dances on one shared 120 bpm beat: props squash on the beat and sway from beat to beat.
- Ground: flat grey washes (#cfc8b9 base, #b2aa9a meadows, #928a7c hills, #e4ddcd paths) with a lighter
  inner rim and a crisp 0.8-unit ink contour; tiny ink tufts, curls, hatch strokes and daisies.
- Props: curly trees with spiral curls, cottages with eye-like windows and curly smoke, picket fences,
  smiling daisies, curly street lamps.
- Effects: music-note projectiles, POW bursts, curly cloud poofs, white stars, ink drops.
- Atmosphere at 24 fps: grain, dust, hairs, scratches, flicker, ~1 px gate weave, heavy vignette with
  rounded projector-gate corners, faint silver-sepia tone.
- UI: dark title cards with double paper rules and Art-Nouveau corner curls; Limelight for numbers and
  titles, Rye for card names, Special Elite for body text; a film-strip progress bar.
```
