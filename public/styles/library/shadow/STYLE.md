# Shadow Theatre — Game Art Style Spec

> Backlit paper shadow-puppet theatre: indigo-black cut-paper silhouettes over glowing teal, violet, crimson and amber light fields.

The screen is a lit puppet stage seen from above. The **floor is the light**: big organic colour fields (moonlit teal, dusk violet, crimson, amber) glow like a backlit paper screen. They are joined by thin ink seams threaded with lace beads and covered in flat ink cut-outs: grass tufts, leaves, filigree scrolls, dandelion clocks and stars. **Everything that stands is a flat silhouette** in indigo-black ink `#0b0510`, built from tapered strokes, lens leaves and spiral curls in the tradition of Lotte Reiniger and *Limbo*. The only colour on a silhouette is **emissive**: the hero's carved pumpkin face, the small enemies' acid-green eyes, the brute's magenta cracks. There is also a soft baked rim of light. Ghosts invert the rule and are pale glowing veils. Velvet curtains, a scalloped valance and a vignette frame the scene as a theatre. The reference game is *Jack vs. the Turnip Ancestors* (a top-down survivor-like). Treat it only as an example.

## At a glance

| | |
| --- | --- |
| Family | Silhouette · Paper Shadow Puppets |
| Mood | fairy-tale gothic, warm, mysterious, theatrical, cosy-spooky |
| Best for | survivor-likes / hordes, halloween & folklore action, silhouette puzzle-platformers, storybook adventures |
| Renderer | Canvas 2D, fully procedural (no image assets) |
| Pixel art | No – smooth, anti-aliased, sprites baked at K ≈ 1.3 × (screen px / 360) px per world unit |
| Difficulty | 4/10 – silhouettes are easy; making many enemy types readable by outline alone takes thought |
| Fonts | Cinzel (numbers, titles), IM Fell English SC (small-caps labels), Cormorant Garamond (body) |
| Key colours | ink `#0b0510`, amber `#ffc662`, crimson `#f26a52`, violet `#b682dc`, teal `#76ccc6`, face gold `#ffd65e`, eye green `#d8ff62`, crack magenta `#ff5ad2` |

## When to use it

- **Great for hordes.** A flat silhouette reads at any size, and 200 black shapes on a glowing floor stay legible. In the late game the screen fills with ink and the emissive eyes still separate the enemy types.
- **Halloween, folklore, fairy tales, gothic storybooks.** The puppet-theatre framing adds narrative charm for free.
- **Silhouette platformers and puzzle games.** The light/ink split is the whole visual language.
- **Bad for colour-coded gameplay.** Team colours, element types or equipment cannot show on bodies; only small emissive marks are allowed.
- **Bad for daylight, sci-fi or "realistic" settings,** and for games whose characters need readable faces or costumes.
- **Bad for tiny units in dense strategy games.** Silhouettes under ~12 px tall lose their identifying curls.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Shadow Ink | `#0b0510` | Every silhouette, prop, curtain and HUD plate (25–35 % of the screen) |
| Lace Ink | `#16081c` | Ground seams (85 %) and lace decals (layer at 80 %) |
| Amber Core / Edge | `#ffc662` / `#ea7a2c` | Warm amber field: centre / near seams (largest field type) |
| Hot Gold | `#fff0c4` | Hot heart deep inside amber fields |
| Crimson Core / Edge | `#f26a52` / `#b02a42` | Crimson field |
| Violet Core / Edge | `#b682dc` / `#6840a2` | Dusk-violet field |
| Moon Teal Core / Edge | `#76ccc6` / `#2c748c` | Moonlit water field (ripple highlights rgb(215,255,245)) |
| Face Core → Ember | `#fffbe2` → `#ffd65e` → `#ff9a22` → `#ff6a10` | Carved face gradient (radial), bloom `rgba(255,150,40,.95)` |
| Hero Rim | `#ffb24a` | Hero's permanent rim of light |
| Eye Green | `#d8ff62` | Small-enemy eyes: `#ffffe0` → `#d8ff62` → `#7fe02a`, bloom `rgba(170,255,70,.95)` |
| Crack Magenta | `#ff5ad2` | Brute cracks (stroke `#ffb8f0`, shadow `rgba(255,70,210,1)`), core and eyes |
| Veil White | `#dcefff` | Ghost veil: `#fbfdff` → `#dcefff` → `#a9d4ff` |
| Ghost Hollow | `#1c0f36` | Ghost eye/mouth holes |
| Gem Aqua | `#3fe0d8` | Small XP gem (`#fff` → `#b8fff4` → `#3fe0d8`); big gem `#fff0a8` → `#ffb03a` |
| Velvet | `#2a0a20`, `#240818` | Curtain sheen stripes |
| HUD Gold | `#ffd98a` | HUD headings; hairline `rgba(255,196,120,.55)` |

Exact field colours (RGB, edge → core): teal `[44,116,140]→[118,204,198]`, violet `[104,64,162]→[182,130,220]`, crimson `[176,42,66]→[242,106,82]`, amber `[234,122,44]→[255,198,98]`.

**Palette rules**

- There are only two materials: **light** (the floor, glows and emissive parts) and **ink** (everything standing). No mid-tones on bodies.
- Silhouettes are always `#0b0510` at full opacity. Never tint a body in a field colour, and never use pure `#000`.
- Character colour must be small and emissive. One emissive hue per class: hero orange-gold, small enemies acid green, brutes magenta, ghosts cold blue-white.
- Fields always neighbour in the order teal | violet | crimson | amber, because they are thresholds of one noise value. Target roughly 40 % amber, 30 % crimson, 20 % violet and 10 % teal on screen.
- Warm light (gold/orange) belongs to the hero and friendly objects (lanterns, lit pumpkins, the follow-spot).

## Typography

- **Cinzel** 400/700/900 – https://fonts.google.com/specimen/Cinzel – timer, numbers, titles, level badge, damage numbers, card names.
  `font: 900 34px/1.05 'Cinzel', Georgia, serif; letter-spacing: 3px; color: #ffe4a6; text-shadow: 0 0 6px rgba(255,170,70,1), 0 0 16px rgba(255,110,40,.8);`
- **IM Fell English SC** 400 – https://fonts.google.com/specimen/IM+Fell+English+SC – small-caps labels and hints ("until midnight").
  `font: 13px 'IM Fell English SC', Georgia, serif; letter-spacing: 3px; color: #f4c99a;`
- **Cormorant Garamond** 500/600/700 – https://fonts.google.com/specimen/Cormorant+Garamond – body text, card descriptions, stats.
  `font: 700 20px/1.15 'Cormorant Garamond', Georgia, serif; color: #22081a;`

Text effects:
- Glowing HUD text uses ink shadows to cut it out of the floor, then an orange glow: `text-shadow: 0 0 2px #0b0510, 0 0 3px #0b0510, 0 0 8px rgba(255,150,60,.85), 0 0 18px rgba(255,110,40,.5)`.
- Big titles ("LEVEL UP!") are Cinzel 900 at 68 px, letter-spacing 4 px, `#ffe6ad`, with `text-shadow: 0 0 3px #0b0510, 0 0 12px rgba(255,170,70,1), 0 0 34px rgba(255,100,40,.8)`.
- **Damage numbers on canvas** are Cinzel 700 at 8.6 world units (12.5 for crits). Each gets an ink stroke of 0.24 × font size, drawn with `shadowBlur = 0.35 × size` in `rgba(255,190,110,.7)` (crits: 0.5 × size in `rgba(255,140,40,.95)`). The fill is a vertical gradient `#fff → #ffe2b0` (crits `#fff → #ffe07a → #ff8a22`). The number is baked to a sprite cache keyed by value.

## Rendering technique

The world is drawn in world units with 360 units visible vertically. The hero is about 18 units wide and 33 tall.

1. **Init: pick the bake resolution.** `K = clamp(round(screenHeightPx / 360 × 1.3 × 4) / 4, 2.5, 5)` px per world unit (DPR is capped at 2). The extra 1.3 keeps silhouettes crisp when they are slightly scaled.
2. **Bake every sprite** with `mk(x0, y0, x1, y1, draw, pad)`. It creates a canvas of `(x1 − x0 + 2·pad) × K` px and sets the transform to K. Fill and stroke are `#0b0510` with round caps and joins. The draw function then paints in world units with feet at (0, 0) and the figure facing +x.
3. **Per sprite, also bake:**
   - a mirrored copy, for facing −x;
   - a rim-light copy `rimSpr(s, colour, rad)`: tint the silhouette, stamp it 8 times around a circle of `d = rad·K·0.55` px, blur by `d`, then add the unblurred stamps at 60 %;
   - for the hero, a white "hurt" rim (`rad 1.1`);
   - for enemies, torn-paper shard sets for the death animation.
4. **Bake glows** as radial-gradient squares: `glowSpr(radius, stops)`. Examples: the warm pool (r 30), the face halo (r 9), gold (r 10), pink (r 12), cyan (r 6), embers (r 3) and the dark contact shadow (r 10, `rgba(14,5,20,.55)`).
5. **Ground chunks** of 256 world units are rendered by a generator (see next section) at up to 2.5 px per unit, then cached.
6. **Per frame, in order:**
   - ground chunks;
   - contact shadows and the hero's additive follow-spot;
   - props, enemies, hero, gems, orbitals and projectiles, all y-sorted;
   - particles;
   - damage numbers;
   - the theatre-frame overlay, baked once per screen size.
7. **Light is always additive.** Glows, rims, embers, flares and trails use `globalCompositeOperation = 'lighter'`. Ink is drawn with normal `source-over`.
8. **Blit with world-unit sizes.** Draw with `drawImage(c, x − ax/K, y − ay/K, w/K, h/K)`, and snap positions to device pixels when not rotating. Wobble and sway use a rotate transform around the feet.

## Background and ground

The floor is a **light field shader**, computed per pixel from one scalar noise value:

```
f(x, y) = (warped(x/1300, y/1300, seed 501, warp 0.85, 3 oct) − 0.5) × 9.5 + (fbm(x/420, y/420, seed 502, 2 oct) − 0.5) × 0.9
```

- **Bands.** The thresholds `TH = [−0.95, −0.3, 0.35]` split f into teal | violet | crimson | amber. Neighbouring bands blend over ±0.075 f-units (`smoothstep`).
- **Colour inside a band.** Take the depth into the band (its distance to the nearest threshold) and compute `t = smoothstep(0, 0.75, depth) × (0.55 + 0.45·gloss)`, where `gloss = fbm(x/520, y/520, 503, 3)`. The colour lerps from the edge colour towards the core colour by t. Amber also lerps towards the hot `#fff0c4` by `smoothstep(0.9, 2.2, depth) × (0.25 + 0.4·gloss)`. The result is finally multiplied by `0.9 + 0.2·gloss`.
- **Sampling grid.** f, gloss, colour, teal weight, ripple phase and a **signed distance to the nearest seam** are sampled on a 4-unit grid with an 8-unit margin. The distance is `sd = (f − nearestThreshold) / |∇f|`, clamped to ±60 units. Pixels interpolate the grid bilinearly.
- **Light bleed.** Where `|sd| < 6`, lerp towards rgb(255,240,215) by `(1 − |sd|/6)² × 0.22`. Each seam looks like a slit where light leaks through.
- **Moonlit ripples.** Only on teal: `phase = y·0.72 + 7·perlin(x/95, y/95) + 2.5·perlin(x/33, y/33)`. Where `sin(phase) > 0.86`, lerp towards rgb(215,255,245) by `(sin − 0.86) × 7.1 × tealWeight × 0.42`. This gives thin wavy horizontal highlight lines.
- **Paper grain.** A 256² Int8 tile: a 3×3 box sum of hash noise × 3.2 plus the raw value × 5, plus 70 random-walk fibres of 8–34 px (+4 each). It is added as R +g, G +0.9g, B +0.8g.
- **Seam line.** `a = (0.36 − |sd|)·res + 0.5`. Where `a > 0`, lerp towards `#16081c` by `min(1, a) × 0.85`. The line is about 0.72 units wide and anti-aliased.
- **Lace layer.** These are ink vector paths drawn into a separate canvas, then composited onto the chunk **once at 80 % alpha**, so the light glows faintly through.
  - **Seam beads.** Points are scattered every 4.2 units and kept where `|sd| < 2.4`. Each point is projected onto the seam (`p − n·sd`) and offset 1.1–1.5 units to one side. It becomes one of three motifs:
    - 45 %: a dot (r 0.62) inside a ring (r 1.25, 0.32-unit stroke);
    - 35 %: a pair of lens leaves (2.3 long);
    - 20 %: two dots (r 0.42 and 0.3).
  - **Field decals.** Each decal kind has its own scatter cell size, and decals are skipped within 0.06 f-units of a seam:
    - amber: grass tufts (cell 15), 5–9 tapered blades 3.5–8 units long, density raised by a noise mask; dandelion clocks (14 radial seeds on a stem);
    - crimson: filigree double scrolls (cell 30, 62 %, spirals 9–15 units with leaves) and lace rosettes (cell 64);
    - violet: small fallen leaves and maple shapes (cell 15/34) and 4–5-point cut-out stars plus additive light glints (cell 17);
    - teal: broken ripple ellipses (2–3 rings, radius 3.5 + 3.2k, height × 0.4, dashed in random gaps), reeds with cattail heads, lily pads;
    - large fern rosettes and branching root systems (cell 165).
- **Additive glints.** These go on top of the lace. Violet gets 4-point stars in `rgba(255,236,190,.55)` with a `rgba(255,250,230,.7)` dot. Teal ripples get pale ellipses in `rgba(220,255,250,.35)`.

Scale: fields are hundreds of units across (noise period about 1300 units), so one screen shows 2–4 fields. Decals are tiny: 2–15 units, with strokes of 0.25–0.85 units.

## Characters

**The hero** (reference: pumpkin-head Jack) measures about −14…9 units in x and −33…1.5 units in y, with the feet at the origin. Draw order, back to front:

1. **Back leg.** A jointed puppet leg: hip → knee (4.2 units) → foot (4.4 units) as a `limb` 1.15 → 0.9 wide. The foot is a 1.4 → 0.7 limb ending in a toe curl (2.2 long, turn −5.5).
2. **Back arm.** Shoulder at (−1.6, sh + 0.8), upper arm 3.4, forearm 3.2, a 1.0-unit limb ending in a hand circle (r 0.85).
3. **Front leg.**
4. **Cloak.** From the shoulders (y = −16.2 + bob) to a **jagged hem** of 7 zig-zag points alternating +1.3 / −0.7. The hem trails backwards by 2.2 units when walking. A small clasp curl sits at the back edge.
5. **Scarf.** An ellipse (3.5 × 1.3) plus two streaming tails: limbs 1.6 → 0.5, 11.6 units long when walking, hanging down when idle, waving at twice the step frequency.
6. **Front arm.** Width 1.1.
7. **Pumpkin head.** Four overlapping ellipses (`pumpkinShape`, rx 6.8, ry 5.4) at (0.8, −22.4). Add a stem limb (1.5 → 0.9) curving back, a leaf (4.2 long) and a long spiral curl (4.6, turn 6).
8. **Carved face**, the brightest thing on screen. Two triangular eyes, a triangle nose and a zig-zag grin with two teeth. It is filled by `glowFill` with the radial `FACE` gradient (centre `#fffbe2`, radius 6) and a 1.6-unit bloom.

**Frames.** There are 6 walk frames (phase i/6) and 4 idle frames, each baked with a warm rim (`#ffb24a`, rad 1.3), a white hurt rim and mirrored copies. The walk bob is `−|cos(phase)| × 0.9`, and the head bobs separately with a 0.4 phase lag.

**Per frame:**
- an additive follow-spot pool (r 30, scaled 1.1 × 0.62, alpha 0.55 ± 0.05);
- a contact shadow (0.8 × 0.26);
- the rim at 75 % ('lighter');
- the sprite;
- an additive face halo (r 9) at the head position, flickering `0.8 + 0.12·sin(11t) + 0.08·sin(27t)`.

## Enemies and props

Every type gets **a unique outline and one emissive colour**.

- **Small melee enemy** (turnip "creeper", about 24 × 30 units):
  - body: a bulb ellipse (7.8 × 7.0, or 7.0 × 7.6 for the variant) with a little top knob;
  - movement parts: two jointed root legs ending in curls, a taproot tail curling behind, curled arms, and root hairs;
  - **filigree leaf crown:** 3–4 curved stems (curlPts, 6.4–8.6 long) with a large leaf at each tip and two side leaves;
  - mouth: a zig-zag mouth **cut out** with `destination-out`, so the floor light shows through;
  - eyes: two angry slanted glowing eyes in acid green (bloom 1.3).

  It has 2 variants × 6 frames and rocks ±0.075 rad as it walks.
- **Fast enemy / ghost:**
  - the inversion of the rule: a white veil (head ellipse 5 × 5.6, a ragged lower edge, three curled tail wisps and two reaching arms with three long fingers);
  - colouring: tinted `source-atop` with a vertical gradient `#fbfdff → #dcefff → #a9d4ff`, then faded towards the tail with `destination-in` (95 % → 35 % alpha);
  - face: hollow eye and mouth ellipses in `#1c0f36`;
  - halos: the sprite is composited over a **dark halo** (tint `#160828`, blur 2.2·K px, alpha 0.42) and then a **light halo** (tint `#d6f0ff`, blur 1.4·K px, alpha 0.95), so it glows on any field.

  It has 4 frames and hovers.
- **Brute** (colossus, about 44 × 62 units):
  - body: a knobby bulb (radius 15 × 14 modulated by `1 + 0.07·sin(5a) + 0.05·sin(9a)`);
  - limbs: massive gorilla arms (5.2 → 2.6) with claws, and thick legs;
  - crown and beard: an **antler crown** of five thick curled stems with big leaves, and a dangling root beard;
  - emissive: **magenta cracks**, stroked `#ffb8f0` at 0.5–0.7 units with `shadowBlur 1.6·K` in `rgba(255,70,210,1)`, a diamond core and slit eyes in the same magenta;
  - extra glow: an additive pink glow (r 12) on the chest pulses at runtime.
- **Pickups:**
  - **small gems** are ink teardrops with an aqua glass interior and an additive cyan glow;
  - **big gems** are gold with a curl on top and a rotating 4-point flare.
- **Orbiting helper** (turnip lantern): an ink bulb with a leaf crown and a gold glowing carved face, plus an additive gold glow.
- **Props** are standing ink silhouettes baked once and y-sorted with the actors:
  - **trees:** recursive branching, three depths, tips ending in curls, about 4 leaves per tip, a cut-out knothole, roots with curls;
  - **iron gates:** pillars with cut-out arches, spear-tipped bars on an arched top, a ring lace band and scrolls;
  - **fences:** spear pickets with S-curls between the rails;
  - **graves:** a Celtic cross with a see-through ring, a round stone with a crescent-moon window, a crooked wooden cross with a wreath;
  - **scarecrows** with a crow;
  - **crow posts** (2-frame head flick);
  - **lantern poles** with a curled hook and a glowing pane;
  - **lit pumpkins** on curly vines, with an additive flickering gold glow;
  - **weeds** (thistles, tall grass, fiddlehead ferns).

  Trees and scarecrows sway like hinged puppets, weeds sway faster, and all props get a squashed contact shadow.

**Readability with many enemies.** Bodies all merge into one ink mass, so identity comes from:
1. the outline features that stick out (crowns, veils, antlers);
2. the emissive colour code (green dots = small enemies, magenta = brutes, white = ghosts, gold = hero);
3. the hero's constant warm rim and spotlight.

Enemies only get a rim when hit (cream `#fff6dc`, capped at 0.9, or 0.7 for brutes). Never give them a permanent rim.

## Effects and particles

All effects are light (additive) or paper (ink).

- **Projectile** (pumpkin seed):
  - a baked lens shape with a gradient `#ffcf7a → #fff6d8 → #fff` and a 1.2-unit bloom;
  - rotated along its velocity with a spin wobble of `sin(spin) × 0.6`;
  - an additive tapered trail 11 units long that grows in over the first 0.125 s;
  - an ember glow at 70 %, scaled 1.4.
- **Hit:**
  - 3 additive spark streaks (7-unit lens, transparent orange → `rgba(255,250,220,1)`), 0.22–0.32 s;
  - a 4-point flare for 0.16 s;
  - the enemy rim flash.
- **Death** (paper crumble):
  - for the first 0.14 s, the rim at 90 % over the sprite;
  - then the pre-cut **torn shards** (5 for small enemies, 4 for ghosts, 7 for brutes) fly outward by `2 + 10·outQuad(u)` units, rise 5 units, then fall `22·u²`, rotate ±(1.4–2.2)·u, shrink to 70 % and fade with `1 − u²`;
  - each shard's torn edge glows `#ff9a3a`;
  - paper-scrap particles (4–6-gon ink chips with one ember-lit edge) tumble with gravity 160;
  - embers rise;
  - a flare (size 1.1, or 2.4 for brutes).
- **Ghost death:** 5 pale curled wisps drift up, and cold embers.
- **Embers:** 3-unit additive radial sprites rising (gravity −18, drag 2.2), flickering `0.7 + 0.3·sin(30t + seed)`. There are warm, cold and pink variants.
- **Pickup:** one small ember (cold for small gems, warm for big ones).
- **Dash:** three ink-tinted afterimages (alpha 0.4/i, 6 units apart) and an ember trail.
- **Level up:**
  - a light ring (r 10.5) with 12 small stars, growing `0.4 + 1.2·outQuad(age)`;
  - a large flare (2.8);
  - 14 embers;
  - a rotating flare above the hero's head while `levelT > 0`.
- **Enemy spawn:** the enemy rises from a stage slot like a rod puppet. It uses `outBack(t × 1.15)` from 95 % of its height below, is clipped at the floor, shows a visible 0.7-unit ink rod, gets an additive warm slot glow and swings by `sin(14t)·(1 − t)·0.25` rad.

## Lighting, shadows and post-processing

- **There is no directional light.** The light comes from below and behind the paper, which means from the floor.
- **Contact shadows** are a dark radial sprite (`rgba(14,5,20,.55)` → 0), squashed to about 0.3 of its width under each actor. Prop shadow width comes from the prop's `sh` value, e.g. 1.9 for trees and 0.5 for crow posts.
- **Follow-spot:** an additive warm pool under the hero (r 30, `rgba(255,214,140,.55)` centre).
- **Emissive bloom** is baked: `glowFill` draws a gradient path once with `shadowBlur = bloom·K` and then again sharp. Additive glow sprites flicker around faces and lanterns at runtime.
- **Theatre frame overlay**, baked per screen size:
  - a radial vignette centred at (W/2, 0.52H), from 0.28·max(W, H) to 0.72·max(W, H): `rgba(14,4,22,0)` → `0.22` at 60 % → `0.7` at the edge;
  - **side curtains** 3.4 % of the width with a bezier tie-back waist at 42 % height, velvet sheen gradient `#0b0510 / #2a0a20 / #0b0510 / #240818 / #0b0510`, and an ink tassel;
  - a **scalloped valance** (16 scallops, 3.2 % of the height) with tassel cords and triangles;
  - an ink **stage lip** gradient over the bottom 6 %.
- **No colour grading or blur** at runtime. Everything is baked.

## UI and HUD

HUD pieces are **ink plates with a gold hairline**: an ink ring, a hairline ring, a second ink ring and a warm outer glow. Bars have glowing gradient fills inset 4–6 px. Numbers are Cinzel with an orange glow. The timer sits in a plate with a rounded-bottom "lambrequin" shape and has ink scroll ornaments (SVG) on both sides. Icons sit on a glowing radial disc (`#fff3c8 → #ffc35a → #ea6236 → #7a1c46`) with an ink border ring of 24 alternating beads, and the icon art is ink silhouettes with small emissive faces. Level-up cards are tiny stages: an amber-to-crimson radial glow, an ink curtain and scalloped valance cut-out over the top and sides, an ink stage-lip arc at the bottom with the key number in glowing gold, and a lift of 8 px plus a bigger glow on hover.

```css
.hud { font-family: 'Cormorant Garamond', Georgia, serif; color: #ffe9c4; }
.bar { height: 18px; background: #0b0510; border-radius: 9px; position: relative;
  box-shadow: 0 0 0 2px #0b0510, 0 0 0 3px rgba(255,196,120,.55), 0 0 0 5px #0b0510, 0 0 16px 2px rgba(255,80,60,.35); }
.bar > .fill { position: absolute; top: 6px; bottom: 6px; left: 4px; border-radius: 3px;
  background: linear-gradient(90deg, #a0103a, #ff4a36 55%, #ffc39a); box-shadow: 0 0 6px #ff7a5a, 0 0 14px rgba(255,60,50,.9); }
.xp > .fill { background: linear-gradient(90deg, #ff5a1f, #ffb347 55%, #fff4cc); box-shadow: 0 0 6px #ffc46a, 0 0 14px rgba(255,120,40,.9); }
.panel { background: #0b0510; padding: 4px 30px 6px; border-radius: 6px 6px 40px 40px / 6px 6px 22px 22px;
  box-shadow: inset 0 0 0 1px rgba(255,196,120,.55), 0 0 0 3px #0b0510, 0 0 22px 4px rgba(255,140,60,.35); }
.timer { font: 900 34px/1.05 'Cinzel', Georgia, serif; letter-spacing: 3px; color: #ffe4a6;
  text-shadow: 0 0 6px rgba(255,170,70,1), 0 0 16px rgba(255,110,40,.8); }
.label { font: 13px 'IM Fell English SC', Georgia, serif; letter-spacing: 3px; color: #f4c99a; border-top: 1px solid rgba(255,196,120,.55); }
.pill { background: #0b0510; padding: 1px 16px 2px; border-radius: 16px; color: #ffe4a6; font: 700 22px 'Cinzel', serif;
  box-shadow: inset 0 0 0 1px rgba(255,196,120,.55), 0 0 14px 2px rgba(255,140,60,.35); text-shadow: 0 0 8px rgba(255,150,60,.9); }
.card { width: 228px; min-height: 318px; color: #0b0510; border: 3px solid #0b0510; border-radius: 12px 12px 6px 6px;
  background: radial-gradient(ellipse 80% 70% at 50% 52%, #fff2c8 0%, #ffc45e 30%, #f0743a 60%, #b02c48 84%, #4a1438 100%);
  box-shadow: 0 0 0 2px rgba(255,196,120,.55), 0 0 0 6px #0b0510, 0 0 34px 6px rgba(255,130,50,.4); }
.card:hover { transform: translateY(-8px); box-shadow: 0 0 0 2px #ffd98a, 0 0 0 6px #0b0510, 0 0 48px 12px rgba(255,150,60,.65); }
.overlay { background: radial-gradient(ellipse at 50% 48%, rgba(255,140,60,.28), rgba(40,8,30,.7) 45%, rgba(8,2,12,.92) 80%); }
```

When the hero is hurt, the HP bar's hairline turns `#ff8a6a` and the glow grows to `0 0 26px 6px rgba(255,60,40,.8)`.

## Motion and animation

Everything moves like a **rod puppet**: jointed limbs swing, and whole sprites rock around the feet.

- **Hero:**
  - walk: 6 frames advanced at `anim × 1.5`; idle: 4 frames at 2.6 fps;
  - the legs swing ±0.6 rad and the knees bend by `0.55·max(0, sin(phase + side·1.4))`;
  - the cloak hem flutters at 2× the step frequency;
  - when hurt, the sprite blinks to 45 % alpha at 14 Hz during i-frames and the white rim is added.
- **Small enemy:** 6 frames at 4.8 per anim second, rocking ±0.075 rad, with a per-enemy seed offset so crowds never march in sync.
- **Brute:** 6 frames at 3.6 per anim second, rocking ±0.035 rad, with feet lifted up to 3.6 units.
- **Ghost:** 4 frames at 6 fps. It floats 2.2 units up, bobs ±1.2 units at 3.1 rad/s and sways ±0.06 rad. It has no walk cycle.
- **Props:** trees sway ±0.012 rad and scarecrows ±0.02 rad at 0.7 rad/s. Weeds sway ±0.05 rad at 1.3 rad/s. The crow flicks its head on every 4th beat (0.8 Hz). Lanterns and pumpkins flicker with `0.75 + 0.15·sin(9t) + 0.1·sin(23t)`.
- **Gems:** bob ±0.8 units at 3 rad/s, the glow pulses 0.75–1.0 at 5 rad/s, and on pickup they pop up to 1.6×.
- **Damage numbers:** pop from 1.6× to 1× in 0.08 s and fade over the last 0.25 s.

## Do and don't

**Do**
- Make the floor the brightest, most colourful layer, and keep everything standing flat ink.
- Build shapes from tapered limbs, lens leaves and spiral curls, and end every tip in a curl or leaf.
- Give each enemy class a unique silhouette feature and exactly one emissive colour.
- Keep the hero permanently rim-lit in a warm follow-spot, because it must win against any crowd.
- Carve holes (`destination-out`) for mouths, windows and knotholes so the light shows through.
- Bake everything at init (frames, mirrors, rims, glows, shards) and only blit per frame.
- Frame the scene as a stage: curtains, valance, vignette and stage lip.

**Don't**
- Don't outline or gradient-shade silhouettes. The lit edge comes only from the additive rim copy.
- Don't paint features in body colour, or give enemies warm emissives that compete with the hero's face.
- Don't let lace decals rival the actors. Keep them fine (0.25–0.85-unit strokes) at 80 %.
- Don't use pure black, grey or photo textures. Ink is indigo-black `#0b0510`.
- Don't run `ctx.filter` or `shadowBlur` per frame.
- Don't make the light fields small and noisy. They are hundreds of units across.
- Don't add a directional sun shadow. Shadows are only soft contact blobs.

## Implementation recipe

1. Set up a world-unit camera (360 units tall). Compute `K = clamp(round(hPx / 360 × 1.3 × 4) / 4, 2.5, 5)`.
2. Implement the toolkit: `spline`, `limb(pts, w0, w1)`, `curlPts`/`curl`, `leaf`, `ell`, `circ`, `poly`, `star`, `cut`, `pumpkinShape` (or your own primitive bulb) and `glowFill`.
3. Implement `mk()` (bake at K, feet at origin, ink fill), `flip`, `tint`, `rimSpr` (8 stamps + blur) and `glowSpr`.
4. Design the hero as a puppet: torso and cloak, jointed limbs with curl tips, a distinctive head with one emissive feature. Bake 6 walk + 4 idle frames with rim copies.
5. Design each enemy class with a unique protruding feature and one emissive colour. Bake 4–6 frames each, plus a hit rim and torn shards.
6. Write the ground shader: one warped-noise scalar → 4 threshold bands → edge-to-core colour → light bleed near the seam → optional ripples → paper grain → seam line. Use a 4-unit sample grid with bilinear interpolation, and render chunks in a generator.
7. Draw the lace layer: seam beads projected onto `sd = 0`, then field-specific ink decals. Composite it at 80 %.
8. Bake props as silhouettes, scatter them by field (warm props on amber and crimson, reeds on teal) and y-sort them with the actors.
9. Per frame: draw the ground, contact shadows, the hero spotlight, y-sorted sprites (rim 'lighter' first, then ink), additive emissive halos, particles and numbers, then the theatre frame.
10. Effects: additive flares, sparks, embers and trails; ink paper scraps; torn-shard deaths.
11. Build the HUD with ink plates, gold hairline rings, glowing gradient bars and Cinzel numbers.

## Code

These are the core techniques, ported from the reference module so they run standalone. `starter.js` has the complete runnable kit: ground shader, lace, hero, small enemy, ghost, brute, gems, projectile, frame. The full reference is `../../js/styles/shadow.js`.

```js
// Tapered cut-paper limb along a Catmull-Rom-smoothed polyline (the basic building block).
function spline(p, sub) {
  const o = [];
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p[i + 1];
    for (let k = 0; k < sub; k++) {
      const t = k / sub, t2 = t * t, t3 = t2 * t;
      o.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  o.push(p[p.length - 1]);
  return o;
}
function limb(c, pts, w0, w1, sub) {
  const s = pts.length > 2 ? spline(pts, sub || 5) : pts, n = s.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = s[Math.max(0, i - 1)], b = s[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const w = (w0 + (w1 - w0) * (i / (n - 1))) * 0.5;
    L.push([s[i][0] - dy * w, s[i][1] + dx * w]); R.push([s[i][0] + dy * w, s[i][1] - dx * w]);
  }
  c.beginPath(); c.moveTo(L[0][0], L[0][1]);
  for (let i = 1; i < n; i++) c.lineTo(L[i][0], L[i][1]);
  for (let i = n - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]);
  c.closePath(); c.fill();
  c.beginPath(); c.arc(s[0][0], s[0][1], w0 / 2, 0, Math.PI * 2); c.fill();
}
// Spiral that tightens towards its end – every tip in this style finishes in one.
function curlPts(x, y, a, len, turn, n = 12) {
  const p = [[x, y]]; let h = a;
  for (let i = 0; i < n; i++) {
    const t = i / n; h += (turn * (0.25 + 1.75 * t)) / n;
    const s = (len / n) * (1.35 - 0.85 * t);
    x += Math.cos(h) * s; y += Math.sin(h) * s; p.push([x, y]);
  }
  return p;
}
// usage: ctx.fillStyle = '#0b0510'; limb(ctx, curlPts(0, 0, -1.2, 6, 5.5), 0.8, 0.1, 3);
```

```js
// Emissive fill (carved face / eyes / lantern pane): gradient + baked bloom. K = px per world unit.
const FACE = [[0, '#fffbe2'], [0.35, '#ffd65e'], [0.75, '#ff9a22'], [1, '#ff6a10']];
function glowFill(c, path, cx, cy, r, stops, bloom, bloomCol, K) {
  c.save();
  const g = c.createRadialGradient(cx, cy, 0, cx, cy, r);
  stops.forEach((s) => g.addColorStop(s[0], s[1]));
  c.fillStyle = g;
  c.shadowColor = bloomCol; c.shadowBlur = bloom * K;   // pass 1: bloom halo
  c.beginPath(); path(c); c.fill();
  c.shadowBlur = 0;                                     // pass 2: crisp shape on top
  c.beginPath(); path(c); c.fill();
  c.restore();
}
// Hole in the paper: the floor light shows through.
function cut(c, fn) { c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; fn(); c.restore(); }
```

```js
// Rim of light around a baked silhouette (hero aura, hit flash). Add it with 'lighter' BEFORE the ink sprite.
function tint(src, col) {
  const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  const x = c.getContext('2d'); x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'source-atop'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
  return c;
}
function rimSprite(src, color, rad, K) {          // rad in world units: hero 1.3, small enemy 1.2, brute 1.6
  const t = tint(src, color), d = Math.max(1, rad * K * 0.55);
  const tmp = document.createElement('canvas'); tmp.width = src.width; tmp.height = src.height;
  const tc = tmp.getContext('2d');
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; tc.drawImage(t, Math.cos(a) * d, Math.sin(a) * d); }
  const out = document.createElement('canvas'); out.width = src.width; out.height = src.height;
  const oc = out.getContext('2d');
  oc.filter = `blur(${d.toFixed(1)}px)`; oc.drawImage(tmp, 0, 0); oc.filter = 'none';
  oc.globalAlpha = 0.6; oc.drawImage(tmp, 0, 0);
  return out;
}
// per frame: ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.75; ctx.drawImage(rim, …);
//            ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.drawImage(ink, …);
```

```js
// Ground light fields: one noise scalar f → four glowing bands. Per pixel, add bleed, seam line, grain.
const TH = [-0.95, -0.3, 0.35], BW = 0.075, HOT = [255, 240, 196];
const BANDS = [ { e: [44,116,140], c: [118,204,198] }, { e: [104,64,162], c: [182,130,220] },
                { e: [176,42,66], c: [242,106,82] },   { e: [234,122,44], c: [255,198,98] } ];
const ss = (a, b, x) => { let t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function bandCol(i, f, gloss, o) {
  let d = i === 0 ? TH[0] - f : i === 3 ? f - TH[2] : Math.min(f - TH[i - 1], TH[i] - f); if (d < 0) d = 0;
  const B = BANDS[i], t = ss(0, 0.75, d) * (0.55 + 0.45 * gloss);
  for (let k = 0; k < 3; k++) o[k] = B.e[k] + (B.c[k] - B.e[k]) * t;
  if (i === 3) { const h = ss(0.9, 2.2, d) * (0.25 + 0.4 * gloss); for (let k = 0; k < 3; k++) o[k] += (HOT[k] - o[k]) * h; }
}
function fieldColor(f, gloss, out) {
  const s0 = ss(TH[0] - BW, TH[0] + BW, f), s1 = ss(TH[1] - BW, TH[1] + BW, f), s2 = ss(TH[2] - BW, TH[2] + BW, f);
  const w = [1 - s0, s0 - s1, s1 - s2, s2], t = [0, 0, 0]; out[0] = out[1] = out[2] = 0;
  for (let i = 0; i < 4; i++) if (w[i] > 0.001) { bandCol(i, f, gloss, t); for (let k = 0; k < 3; k++) out[k] += t[k] * w[i]; }
  for (let k = 0; k < 3; k++) out[k] *= 0.9 + 0.2 * gloss;
}
// sd = (f - nearestThreshold) / |grad f|  (world units to the seam), res = px per unit
function shadePixel(rgb, sd, res, grain) {
  const a = Math.abs(sd);
  if (a < 6) { const e = 1 - a / 6, k = e * e * 0.22; rgb[0] += (255 - rgb[0]) * k; rgb[1] += (240 - rgb[1]) * k; rgb[2] += (215 - rgb[2]) * k; }
  rgb[0] += grain; rgb[1] += grain * 0.9; rgb[2] += grain * 0.8;
  const l = (0.36 - a) * res + 0.5;
  if (l > 0) { const t = Math.min(1, l) * 0.85; rgb[0] += (22 - rgb[0]) * t; rgb[1] += (8 - rgb[1]) * t; rgb[2] += (28 - rgb[2]) * t; }
}
```

## Adapting it to your game

- **Keep fixed:**
  - the light-floor / ink-actor split;
  - ink `#0b0510`;
  - the limb / leaf / curl vocabulary with curled tips;
  - one emissive colour per actor class;
  - the additive rim on the hero;
  - the seam-plus-lace ground;
  - the theatre frame.
- **Re-theme the fields.** You may swap the four band colours as long as they stay luminous, saturated and ordered from cool to warm. A winter game could use ice-blue | lilac | rose | pale gold, and a desert game indigo | magenta | orange | sand. Keep the hot heart in the warmest band.
- **Re-theme the emissives.** Use the warmest colour (gold/orange) for the player and friendly lights, and cooler or acid colours for enemies.
- **New characters.** Start from a bulb, a body or a veil, add one protruding identity feature (crown, horns, wings, antlers, hat), jointed limbs ending in curls, and an emissive face or carved mouth. Test the silhouette at 30 px tall in ink only.
- **Side-view games.** Use the same silhouettes and use the light fields as a horizontal backdrop (bands by height plus noise). This is the classic Reiniger look.
- **Other resolutions.** Everything is in world units. Only K changes. Keep K ≥ 2.5 or the thin curls break up.

## Performance notes

- **Baked once:**
  - all frames, mirrors and rim and hurt-rim copies. A rim costs 8 drawImages + 1 blur filter at bake time only;
  - ghost halos (2 blurred passes);
  - torn shards, glows, about 20 prop sprites, icons;
  - number sprites (cached per value, cleared above 300 entries);
  - the theatre frame (per screen size).
- **Per frame:** only `drawImage` with transforms, about 1–3 per actor (shadow, rim when flashing, sprite, glow), plus particles. Hundreds of enemies stay cheap. Cap hit-rim alpha and particle counts in big crowds.
- **The ground is the hot spot:**
  - per 256-unit chunk: about a 70² noise grid (domain-warped fbm = 3 fbm calls per sample) plus a per-pixel loop at up to 2.5 px/unit (about 400k pixels);
  - run it as a generator that yields every 2 rows and every 32 lace motifs, so chunks stream without frame drops;
  - lace decals are vector paths into one offscreen canvas per chunk.
- **Check filter support** (`ctx.filter = 'blur(1px)'`), and fall back to unblurred stamps on browsers without it.

## Copy-paste prompt

```text
Build my game <X> in the "Shadow Theatre" style (backlit paper shadow-puppet theatre, Lotte Reiniger / Limbo):
- The FLOOR is the light: huge organic glowing colour fields from one domain-warped noise value, thresholds -0.95/-0.3/0.35
  → moon teal #76ccc6 | dusk violet #b682dc | crimson #f26a52 | amber #ffc662 (edge colours #2c748c/#6840a2/#b02a42/#ea7a2c, amber gets a hot #fff0c4 heart).
- Seams between fields: thin ink line #16081c (0.72 world units) with light bleeding 6 units out of it; paper grain over everything.
- Ink lace on the floor at 80 % opacity: beads/rings/leaf pairs along seams, grass tufts on amber, filigree scrolls on crimson, leaves and stars on violet, broken ripple rings on teal.
- EVERYTHING standing is a flat silhouette in #0b0510, no outlines, no shading, built from tapered limbs, lens leaves and spiral curls; every tip ends in a curl.
- Only colour on silhouettes is emissive: hero face gold (#fffbe2→#ffd65e→#ff6a10 with bloom), small enemies acid-green eyes #d8ff62, brutes magenta cracks #ff5ad2. Carve mouths with destination-out.
- Ghost-type enemies invert: pale blue-white veil with a dark blurred halo under a light blurred halo.
- Hero always has a warm #ffb24a rim (8 tinted offset stamps, blurred, drawn with 'lighter') and an additive follow-spot pool; enemies get a cream rim only when hit.
- Each enemy class = unique outline feature + one emissive colour, so a crowd of 200 stays readable.
- Effects are light (additive flares, sparks, embers, glowing seed trails) or paper (torn shards with glowing #ff9a3a edges, ink scraps).
- Motion like rod puppets: jointed limb swings, whole-sprite rocking, enemies rise from stage slots on a rod.
- Frame: vignette, velvet curtains, scalloped valance with tassels, stage lip. HUD = ink plates with gold hairline rings, glowing gradient bars, Cinzel numbers, IM Fell English SC labels, Cormorant Garamond body.
- Bake all sprites/rims/glows once at ~1.3 × screen px per world unit; per frame only blit.
```
