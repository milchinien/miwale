# Thermal Vision — Game Art Style Spec

> The world through an infrared camera: every surface is a temperature mapped through an ironbow ramp; warm bodies glow white-hot.

Nothing in this style is painted in colour. Every pixel – ground, props, creatures, particles, even the icons – is first a **temperature** between 0 and 1 and only then pushed through one false-colour ramp, the classic "ironbow": black → deep indigo → violet → magenta → crimson → orange → yellow → white. Cold ground and tree canopies sit in indigo and near-black, warm bodies glow orange with white-hot faces and cores, every body reads a little cooler at its rim and radiates a soft halo. A camera UI frames the image: corner brackets, a temperature scale bar, °C readouts, a blinking REC dot, a tracking box, sensor grain and heat shimmer. The result feels like surveillance footage of a night that is full of hidden life.

## At a glance

| | |
| --- | --- |
| Family | Infrared · False colour |
| Mood | surveillance, nocturnal, tense, clinical, eerie |
| Best for | stealth and infiltration, night hunting or rescue, sci-fi / military top-down shooters, horror about unseen creatures, drone-camera puzzles |
| Renderer | Canvas 2D, fully procedural, no image assets |
| Pixel art | No – native resolution; sprites baked at 4 px per world unit, ground chunks at up to 2.5 px/unit |
| Complexity | 4/10 – every asset is shapes filled with temperatures; the shared bake does the rest. The work is thinking in hot/cold contrast. |
| Fonts | Share Tech Mono (readouts), Orbitron (titles, labels), Chakra Petch (card titles) |
| Key colours | `#1d0b52` indigo ground · `#64108a` purple · `#c4256a` crimson · `#f4701a` orange · `#fdc52e` yellow · `#fffdf2` white-hot · `#eef3ff` camera white |

## When to use it

Good fits:
- **Stealth, infiltration, hunting and rescue.** Heat signatures are a built-in readability system: anything alive is bright, the environment is dark, hiding places are cold shapes.
- **Horror and mystery.** The thermal camera shows what the eye cannot: residual handprints, footprints that fade, the imprint of something that just vanished.
- **Sci-fi, military and drone-camera framing.** The UI is diegetic – it is the camera you are looking through.
- **Crowded top-down action.** Warm bodies pop off the indigo ground; limb cooling and halos keep neighbours separate.
- **Small teams and AI-generated content.** New assets need no palette decisions; one ramp makes everything match.

Bad fits:
- Cozy daylight projects, picture-book stories, anything that wants material colour (wood, fabric, skin tones).
- Puzzle games that use many colour codes – you have one hue axis (temperature), not eight hues.
- Projects where the UI must feel friendly or soft.

## Color palette

The palette **is** the ramp. Each swatch is a stop of the ironbow LUT; subjects never pick a colour, they pick a temperature.

| Swatch | Hex | Role |
| --- | --- | --- |
| Absolute cold (0.00) | `#030108` | Deepest shadows, text outline base |
| Deep cold (0.08) | `#0d0626` | Tree canopies, hedgerows, cold puddles |
| Indigo ground (0.18) | `#1d0b52` | Open soil, ground fallback colour (~45 % of the screen) |
| Violet (0.28) | `#3a0f78` | Warmer soil, stubble fields, cold metal |
| Purple (0.38) | `#64108a` | Road asphalt, dry-stone walls, rocks with stored warmth |
| Magenta (0.48) | `#96158a` | Halos, insulated clothing edges, warm metal |
| Crimson (0.57) | `#c4256a` | Cool rims of warm bodies, cooling particles |
| Red-orange (0.65) | `#e3443a` | Outer body zones; REC dot and hot-spot marker in the UI |
| Orange (0.73) | `#f4701a` | Bodies, hot pipes |
| Amber (0.81) | `#fb9d12` | Warm cores, flanges, card hover |
| Yellow (0.88) | `#fdc52e` | Hot cores, eyes; UI accent labels |
| Pale yellow (0.94) | `#ffe777` | Near white-hot, floating digits |
| White-hot (1.00) | `#fffdf2` | Faces, furnace cores, flame centres, impact flash |
| Camera white | `#eef3ff` | Every overlay line, bracket, readout and HUD border |
| HUD panel | `#05030c` | Panel and label backgrounds |
| Card lavender | `#c7b8f2` | Card body text |

The LUT has 256 entries but is **quantised to 72 bands**, so smooth gradients show the faint contour banding of an 8-bit sensor.

Temperature budget (what goes where):

| Range | Subjects |
| --- | --- |
| 0.03 – 0.14 | Water, tree canopies, hedgerows, fence posts |
| 0.12 – 0.30 | Open ground, fields, shoulders |
| 0.30 – 0.46 | Road asphalt, stone walls, rocks, contact pools under props |
| 0.45 – 0.65 | Warm metal, insulated clothing, body rims, halos |
| 0.50 – 0.85 | Bodies, limbs, hot pipes |
| 0.90 – 1.00 | Faces, eyes, furnace cores, flame centres, flanges, embers |

Palette rules:
- Every visible colour of the image comes from one ramp lookup. Choose temperatures, never colours.
- Ground stays ≤ ~0.46 so every warm subject outshines it; every subject keeps at least one spot above 0.9.
- Pair a hot focal point with a cool part on every subject (white face + cold backpack, white eye + cool quills, white core + cool fur).
- The UI is the only thing outside the ramp: camera white with a dark outline, plus the ramp itself as gradients.
- No greens, cyans or greys inside the image.

## Typography

| Font | Weights | Role | CSS |
| --- | --- | --- | --- |
| Share Tech Mono | 400 | All readouts: °C, timer, counters, bar labels, timestamp, card text, floating digits | `font: 400 16px 'Share Tech Mono', monospace; color: #eef3ff; letter-spacing: 1px; text-shadow: 0 0 2px #000, 0 1px 3px #000;` |
| Orbitron | 500 / 700 / 900 | Big titles with ramp-gradient fill; tiny spaced labels (9–10 px, letter-spacing 3–5 px, `#fdc52e`) | `font: 900 50px/1 'Orbitron', sans-serif; letter-spacing: .16em; text-transform: uppercase; background: linear-gradient(180deg,#fffdf2 8%,#ffe777 30%,#fb9d12 52%,#e3443a 72%,#96158a 96%); -webkit-background-clip: text; color: transparent;` |
| Chakra Petch | 400 / 600 / 700 | Card titles, name plates | `font: 600 18px 'Chakra Petch', sans-serif; text-transform: uppercase; letter-spacing: 1.5px; color: #fffdf2;` |

All fonts are on Google Fonts. Text drawn into the canvas (scale labels, REC, timestamps, spot meter, tracking label) is Share Tech Mono in camera white with a dark `rgba(2,0,8,.8)` outline 0.22 × the font size wide, rendered once into a small bitmap and reused. Floating digits are Share Tech Mono baked into a digit atlas, pale yellow `#ffe777` with an orange `#f4701a` glow (white-hot `#fffdf2` with a red-orange glow for emphasis) and always end with a small `°` glyph.

## Rendering technique

One idea drives everything: **render temperature first, map to colour last.**

1. **Paint temperature.** Shapes are drawn on an offscreen canvas in grayscale: the gray value is the temperature (0–1), alpha is coverage. Gradients are temperature gradients (warm core → cooler edge). Semi-transparent gray over gray simply mixes temperatures.
2. **Heat pipeline (once per sprite, JS):** read the pixels, build premultiplied buffers (A, T·A), and box-blur them three times (≈ gaussian):
   - *Diffusion*: blur radius 0.55 u; the painted temperature is mixed 50 % towards the blurred one, so heat bleeds softly across part boundaries.
   - *Limb cooling*: with a 1.5 u blur of coverage `Ah`, every covered pixel is multiplied by `1 − 0.42 × (1 − min(1, Ah × 1.3))`. Rims read up to 42 % cooler – real physics (grazing angle) that gives free volume and separates neighbours.
   - *Halo*: outside the silhouette the blurred temperature × 0.6 is shown with alpha `min(1, Ah × 1.7) × 0.62 × smoothstep(0.36, 0.8, T)` – only warm things glow.
3. **Map** through the 72-band LUT into RGBA. **Variants** are other transfer functions on the same temperature map: flash `t + (1 − t) × 0.86` (halo × 1.3), cooled `0.1 + 0.34 t` (halo × 0.25), afterimage `0.74 t` (halo × 0.6). Facings are mirrored copies.
4. **Ground** is a temperature field computed in JS per 256-unit chunk (see World), stamped with decals and mapped through the same LUT, inside a generator that yields ~80 times per chunk.
5. **Per frame:** ground chunks → residual-heat imprints → collectibles → contact glows and footprints → y-sorted props and actors → orbiting orbs → projectiles → particles → floating digits → tracking box → (screen) heat shimmer, auto-gain wash, sensor grain → (display) cached camera overlay + live readouts.

Sprites are baked at K = 4 px per world unit (the screen is 360 units tall). The renderer draws at native resolution; ground chunks render at up to 2.5 px/unit with smoothing, which keeps the soft, slightly blurry thermal feel.

## World and ground

A night-time patchwork landscape seen from above, as a temperature field.

**Raw fields (sampled every 4 units, bilinear-interpolated):**
- Base temperature `0.19 + (fbm(x/340) − 0.5) × 0.18 + (fbm(x/64) − 0.5) × 0.065`; damp hollows (fbm 190 u above 0.6–0.72) −0.05.
- **Field cells**: Worley noise with a 380-unit lattice (lightly domain-warped). Each cell has a type – meadow (34 %, ±0), ploughed (28 %, +0.018 plus furrows), dry stubble (20 %, +0.075, the warmest), wet field (18 %, −0.06) – and a random furrow direction. The border distance `f2 − f1` is kept as a smooth field.
- **Roads**: distance to gently curving centrelines (rows every 1300 u, columns every 1500 u, `base + sin(x/420)·120 + sin(x/170)·24`), divided by `sqrt(1 + slope²)`.
- **Water** level (fbm 600 u) and a **wall-ness** field (fbm 520 u).

**Per pixel (crisp thresholds on the interpolated fields):**
- Furrows: `+ sin((x·cos a + y·sin a) × 0.97) × 0.05` – a 6.5-unit period.
- Fine noise from a tileable fbm tile: ±0.034 at 128 u and ±0.017 at 32 u.
- **Hedgerows**: where `f2 − f1 < 0.034` (about 13 u wide) the temperature goes to 0.10 with bumpy noise – cold dark lines between fields.
- **Dry-stone walls** (where wall-ness > 0.54): warm core 0.34 for `f2 − f1 < 0.011`, cold flanks 0.125 beside it.
- **Road**: asphalt 0.345 within 10 u of the centreline, two wheel tracks +0.03 at 5.2 u, cold gravel shoulders 0.2 out to 14 u.
- **Water**: flat 0.10 with ±0.007 ripples, a damp shore −0.04, a faint warm waterline +0.045. Roads run through ponds as fords.
- **Buried heating pipes**: straight lines on a 760-unit grid, `+0.07·exp(−d²/14) + 0.03·exp(−d²/150)`, warm manhole discs at their ends.

**Decals** stamped into the temperature buffer before mapping (deterministic per world cell, seamless across chunks):
- warm pebbles 0.6–1.6 u (+0.04–0.075), cold plant clumps of 3–6 blobs (−0.03…−0.05);
- boot-print trails: 12–22 ovals 1.15 × 2.05 u every 6.6 u, alternating sides, older prints cooler (+0.045 → +0.13);
- paired animal tracks every 4.6 u; warm resting spots 6–10 × 3.5–5.5 u (+0.07–0.11);
- compost heaps in stubble fields (three nested stamps, up to +0.39 – rare orange accents);
- soft cold puddles in wet fields.

A screen typically shows 2–4 fields, a road and a hedgerow or two; the overall impression is indigo and violet with purple roads and black tree lines.

## Characters

All characters are heat signatures, painted facing right and mirrored for the left.

**Main character – the explorer** (~14 u wide, ~30 u tall, feet at the anchor):
- Hood: circle r 5.5 at (0.6, −24.7), radial 0.7 → 0.53; fur ruff ring 0.76 (1.35 u stroke).
- Face: ellipse 2.75 × 3.25 at (3.05, −24.2), radial **1.0 → 0.86** – the hottest spot of the figure; the nose tip is a cooler dot (0.79).
- Parka: tapered torso from y −22 to −8, radial 0.8 at the chest → 0.58 at the hem; a cooler strap (0.42) and hem line (0.47).
- Arms 2.7 u strokes (near 0.64, far 0.52) with mitts (0.76 / 0.62); legs 3.1 u strokes (near 0.6, far 0.5); boots 0.32 / 0.28.
- **Backpack**: 5.6 × 11.8 u, 0.31 → 0.23, with a bedroll on top (0.2) – the darkest shape, it shows the facing at a glance.
- Walk: 8 poses (body lowest just after each contact, hood landing late); idle: 8 poses over 3.4 s – breathing, forearms hugged in front against the cold, small shivers, a foot stamp at 56 %; dash: launch crouch → streak → brake; a recoil pose with a gasping mouth.
- **Heat ranking**: the main character is baked at gain 1.0 with halo 0.72 – its face is the only white-hot point on screen; creatures are baked through a gain (critter ×0.92, hulk ×0.9, wisp ×0.86) so they sit in lower, distinct bands.

**Small creature – quilled critter** (~27 × 17 u): horizontal body ellipse 8.2 × 5.3, radial 0.82 at the chest → 0.57; a ridge of 8 quills along the back at 0.46 (cooler keratin = dark spikes on top); head r 3.9 (0.84 → 0.66), snout 0.72, cold nose 0.55, ears 0.7 / 0.8, **eye 1.0**; four 1.7 u legs (near 0.55, far 0.46); tail 0.56 → 0.3.

**Fast creature – wisp** (~12 × 24 u, hovering 3 ± 1.5 u): a flame silhouette (round bottom r 5.7, flickering tongues to y −29), radial **1.0 → 0.96 → 0.8 → 0.6**; two side tongues 0.74; two **cold eye holes** (0.36) and a small mouth (0.6). Halo 2.1 u at 85 %: wisps are the brightest subjects.

**Large creature – the hulk** (~42 × 50 u), seen from the front: wide-shouldered torso (radial 0.8 → 0.55), long arms hanging outside the body to warm fists on the ground (near 0.6, far 0.52; fists +0.08), short legs; nine cooler fur clumps along the shoulders (0.5); a **white-hot furnace core** in the chest (r 9, 1.0 → 0.98 → 0.88 fading) with five glowing fissures (0.92); a small head sunk between the shoulders with a heavy cooler brow, two white eyes and a hot mouth (0.98).

Rules: one white-hot focal point and one clearly cool part per subject; types differ by silhouette (upright, horizontal, flame, wide frontal), not by hue; far limbs 0.06–0.08 cooler; draw with source-over only – halos are baked.

## Props

Cold shapes with residual warmth, baked through the same pipeline (halo 1.6 u at 55 %, limb cooling 0.38). Each prop bakes its own contact pool into the sprite.

| Prop | Construction |
| --- | --- |
| Pine tree | 5 jagged tiers, canopy 0.03 (tip) → 0.14 – colder than the ground, a near-black silhouette; trunk 0.38; a warm ground pool r 19 at 0.4 under it (the canopy blocks radiative cooling) |
| Dead tree | Recursive branches (depth 4) at 0.08 + 0.045 × width; slightly warmer trunk base 0.29 |
| Rock | Lumpy dome, radial 0.46 (sun-warmed top) → 0.27, cold cracks 0.22; one variant carries a **warm handprint** (0.6) |
| Fence | Three cold posts (0.13 → 0.19) with sagging wires (0.2); one variant has a small **warm bird** (0.9) on the middle post |
| Ember pit | Coal bed 0.9 → 0.62, charred logs 0.5 with glowing ends 0.95, embers 0.92–1.0, a ring of 9 warm stones (0.36 / 0.42); 3 baked flicker frames |
| Steam pipe | 68-unit run on cold trestles (0.24), cylinder 0.72 top → 0.6 bottom, cooler insulated sleeves (0.5 → 0.44), **hot flanges 0.84**, valve wheel 0.76, legs diving into the ground |
| Exhaust vent | Stack 0.66 → 0.46, seams 0.58, hot rim 0.86, **white-hot throat 1.0**, rain hat 0.62; rising plume at runtime |
| Transformer | Box 0.62 → 0.5 with alternating fins (0.48 / 0.6), cold concrete pad 0.22, three stacked bushings, one **overheating connector 1.0** that flickers |

Placement follows the world: pines and dead trees line the hedgerows, rocks and ember pits sit in dry stubble, fences dot the ploughed fields, the industrial set (pipe, vent, transformer) clusters within 48 units of a buried pipe; nothing stands on roads or water. Hot props register heat shimmer.

## Effects and particles

All particles carry a start temperature `t0` and **cool as they age** (their temperature is a fraction of `t0` that drops with remaining life).

- **Hot-streak projectile**: white-hot head (r 2.3, 1.0 → 0.9, strong halo) in front of a 26-unit wedge trail painted as temperature 0.4 → 0.97 with alpha 0 → 1; grows from 15 % to full length in the first 0.1 s.
- **Impact**: the struck body flashes white-hot (flash transfer at alpha = flash), 4 hot sparks (line streaks, `t0` 0.98) and a small white puff.
- **Heat burst** (dissolve): instant white-hot pop (radius 1.25–1.5 × body radius, 0.2 s), 5–10 rising puffs growing 1.8x and cooling from 0.98 over 0.6–1.05 s, 9–18 ember streaks with gravity (cool to 45 %), a shock ring 0.6r → 3.4r (5r large) at 1.0 → 0.58.
- **Residual heat imprint**: a flat soft ellipse where the body was, 0.5–0.62 cooling to half, fading over 2.6 s (4 s large); drawn under the actors.
- **Collectibles**: small ember shard (diamond, core pulsing 0.8–0.93 over 6 frames at 5 fps), large hexagonal hot cell (core 0.9–1.0); both float over a warm puff and leave two cooled afterimages when they fly.
- **Orbiting heat orb**: white-hot orb r 3.4 with a tilted cooler ring, pulsing ±6 %, trailing a 14-sample arc that cools from 0.9 to 0.45 and thins from 3.2 to 0.8 u.
- **Collect**: a ring 3 → 11 u (18 u large) at 0.82–0.95 plus 2–6 rising motes.
- **Glow-up celebration**: a vertical heat column (white-hot base fading to magenta, 20 × 98 u), rings 6 → 72 u and 4 → 46 u, 20 rising embers and a column of warm puffs.
- **Breath & footprints**: warm breath clouds every 2.4 s; footprints every 6.5 units cooling from 0.48 to 0.24 over 5 s (the hulk: every 12 units, 7 s, r 3.6).
- **Spawn / dissolve**: appear as a cold silhouette that warms up inside a shrinking ring; dissolve by cross-fading to the cold version while slumping (width +16 %, height −38 %).

Puffs use 16 pre-baked radial sprites (one per temperature step); sparks and embers are single strokes in one of 64 cached ramp colours.

## Atmosphere and lighting

The camera is the atmosphere.

- **No light, no shadows.** A warm contact glow sits under every body: radial ramp 0.44 at 80 % → 0.37 at 42 % → 0, a flat ellipse (height 0.42); radius 12 u under the main character, creature radius × 1.45 (wisp × 1.9 at 55 %, hulk × 1.6).
- **Lens vignette** (cooler edges): radial from 34 % of the short side to 56 % of the diagonal, `rgba(3,1,12,0)` → `rgba(3,1,12,.24)` at 62 % → `rgba(2,0,7,.72)`.
- **Sensor grain**: 4 pre-baked 160 px tiles of light speckles (alpha ≤ 15·|n|) and dark speckles (alpha ≤ 36·|n|) with fixed-pattern column stripes (±0.12) and row offsets (±0.06), cycled 30 times per second at a random offset, plain source-over.
- **Heat shimmer**: the region above each hot source (vents, pipes, ember pits, transformer, the hulk, the main character's head) is copied once per frame and redrawn in 0.9-unit strips shifted sideways by `sin(y·0.9 − t·8) × 0.35–0.7 u`, strongest in its lower middle.
- **Auto gain**: strong heat events add a `screen` wash of `#fdc52e` at up to 32 % decaying with `exp(−5t)` – like a camera re-ranging.
- **Camera overlay** (u = screen height / 900): corner brackets 58u long at a 30u margin (2.2u camera white over a 4.2u dark stroke); reticle ticks 63–81u around the subject in the centre plus four small corner marks; a vertical scale bar 13u × 36 % of the height with the ramp, a white border and five labels 48.6 … −12.4, "°C" above and "IRONBOW" below; `ε 0.95   AUTO   ×1.0`; a blinking REC dot + elapsed time; a timestamp; `SP1 36.6°C` spot meter; `MAX` readout; a `NUC` label that blinks every 16 s.
- **Tracking box**: corner brackets around the hottest large subject near the centre, 0.7 u camera white over 1.5 u dark, shrinking from 1.7x to 1x within 0.25 s on acquisition, then a red hot-spot triangle and a °C label 5.4 u high.

## UI

The HUD is the camera's own interface – a measuring instrument, not a game menu.

- **Panels**: near-black translucent (`rgba(5,2,16,.78)` fading to `.35`), square corners, a 2 px camera-white left edge.
- **Bars**: 1 px camera-white border on `rgba(5,2,16,.85)`, the fill is the ironbow ramp itself, divided into 10 % segments by thin dark gaps; the long top bar has tick marks every 5 % below it and a boxed value label at its right end.
- **Timer / titles**: Share Tech Mono 36 px, letter-spacing 4 px, framed by two bracket halves (2 px camera white); a tiny Orbitron label in yellow underneath.
- **Counter**: Share Tech Mono 26 px with a thermal-image icon and a small red-orange dot.
- **Name plate**: dark strip with a glowing red-orange REC dot, Orbitron 9 px family label, Chakra Petch 15 px uppercase name.
- **Cards**: dark indigo-to-black panel with a faint border, corner brackets 16 px outside each corner, icon inside an inset viewport (`#0d0626`, 1 px border, inner shadow), Chakra Petch title, Share Tech Mono body in lavender `#c7b8f2`, a `[1]` key label in yellow, a ramp stripe along the bottom; hover lifts 6 px and turns the border amber with a warm glow.
- **Panel screen**: radial indigo dim with full-frame corner brackets and an Orbitron title filled with the ramp from white-hot down to magenta.
- **Icons** are thermal images too: shapes painted as temperatures (a heart, a critter head inside reticle brackets, hot shards and streaks, an orbit, a boot, a magnet with white-hot poles, a steaming mug) run through the same bake with a 5-unit halo.

```css
.hud-panel { padding: 6px 10px; background: linear-gradient(90deg, rgba(5,2,16,.78), rgba(5,2,16,.35)); border-left: 2px solid #eef3ff;
  font: 400 16px 'Share Tech Mono', monospace; color: #fffdf2; text-shadow: 0 0 2px #000, 0 1px 3px #000; }
.bar { position: relative; width: 236px; height: 12px; background: rgba(5,2,16,.85); border: 1px solid rgba(238,243,255,.8); }
.bar-fill { height: 100%; background: linear-gradient(90deg,#3a0f78,#96158a 22%,#e3443a 48%,#fb9d12 72%,#ffe777 92%,#fffdf2); }
.bar::after { content: ''; position: absolute; inset: 0;
  background: repeating-linear-gradient(90deg, transparent 0 calc(10% - 1px), rgba(5,2,16,.9) calc(10% - 1px) 10%); }
.card { position: relative; padding: 22px 16px 18px; background: linear-gradient(180deg, rgba(29,11,82,.62), rgba(5,2,16,.94) 46%);
  border: 1px solid rgba(238,243,255,.28); }
.card-title { font: 600 18px 'Chakra Petch', sans-serif; text-transform: uppercase; letter-spacing: 1.5px; color: #fffdf2; }
```

## Motion and animation

- **Temperature is the animation channel**: things appear by warming up, vanish by cooling down, impacts flash white-hot for ~0.15 s, every particle cools while it ages.
- Main character: 8 walk poses (legs ±3.8 u, foot lift 1.9 u, body `0.9·sin(2a − 2.33)` so it is lowest just after each contact, hood `+0.35·sin(2a − 3.4)` landing late, arms 0.8 rad against the legs); idle: 8 poses over 3.4 s (breathing, hugged forearms with shivers, a foot stamp at 56 %); dash: launch crouch (0.3 rad, anticipation) → streak (stretch 15 %) → brake (landing squash), 4 cooled afterimages whose spacing grows from 0.4× to 1.4× of 6.5 u; hurt: recoil pose, 12 % squash.
- Critter: 8 frames, legs alternate ±1.9 u, body bob 0.8 u, tail sways.
- Wisp: 8 flicker frames at 10 fps (flame tongues run up the edges), hover 3 ± 1.5 u, alpha flicker 80–100 % at 24 Hz, two cooled afterimages at −0.06 s and −0.12 s of velocity.
- Hulk: 8 frames, bob 1.3 u, knuckle walk (fists lift 2.8 u alternately), a cooling ring 14 → 30 u on each footfall.
- Props: ember pits cross-fade between 3 frames at 2.4 Hz with rising sparks; vent plumes rise 30 u in 2.4 s growing to 10 u; the faulty connector flickers.
- Camera: REC blinks at 0.8 Hz, the spot meter jitters ±0.2 °C twice a second, grain changes 30x per second, the tracking box snaps in within 0.25 s.
- **Appear** (450 ms): the cold silhouette rises from a crouch (scale 1.12 × 0.7 → 1 with a 7 % overshoot) and warms through a mid-warm stage (`0.1 + t·0.62`) to full heat.
- **Hit**: white-hot flash plus a damped squash `0.15·e^(−13t)·cos 26t` (~250 ms) and a 1.6 u knock-back push.
- **Death** (350 ms): a white-hot flare and recoil in the first 18 %, then the heat drains hot → warm → cold while the body slumps into a puddle (46 % lower, 22 % wider); the heat imprint particle stays on the ground and cools for seconds.
- **Per-actor timing**: wisp flicker 8–13 fps per actor, eased hover (quick rise, slow sink), blink and step phases from the actor seed – a crowd never moves in lock-step.

## Do and don't

Do:
- Paint gray temperatures and map them through one ramp – sprites, ground, particles and icons alike.
- Give every subject one white-hot focal point and one clearly cold part.
- Bake rim cooling and hot-only halos once; draw sprites with plain `drawImage`.
- Keep the ground in the indigo–purple band (≤ 0.46) and most props colder than the characters.
- Tell stories with residual heat: footprints, handprints, imprints, warm ground under trees.
- Let particles cool through the ramp as they age.
- Frame the image with the camera UI: brackets, scale bar, °C readouts, REC, grain, vignette.

Don't:
- Don't pick colours per subject – one green, cyan or grey pixel breaks the illusion.
- Don't draw outlines; separate bodies with temperature contrast, rim cooling and halos.
- Don't make the ground warm or busy; above ~0.46 it competes with the bodies.
- Don't make everything hot – without cold parts the image becomes orange soup.
- Don't use additive blending for bodies, or `shadowBlur` / `ctx.filter` at runtime.
- Don't run a per-pixel colour pass over the full screen every frame.
- Don't use soft rounded fonts or coloured panels.

## Implementation recipe

1. Build the ramp: 13 stops from `#030108` to `#fffdf2`, a 256-entry LUT quantised to 72 bands, and 64 cached CSS colour strings for particles.
2. Write the heat bake: paint grayscale on an offscreen canvas → `getImageData` → premultiplied buffers → 3x box blur (0.55 u and 1.5 u) → diffusion + limb cooling + hot-only halo → LUT → `putImageData`. Keep the temperature map so flash / cooled / afterimage variants are just re-mappings.
3. Paint each subject as temperatures with its feet at the origin; leave ~3x the halo radius of margin; bake 8 animation frames and mirror them.
4. Ground: per chunk, sample raw fields on a 4-unit grid, interpolate per pixel, apply crisp thresholds (hedges, walls, roads, water), add periodic fine noise, stamp decals, map through the LUT. Run it as a generator with short steps.
5. Props: same bake, with a contact pool painted into the sprite; place them by world features.
6. Particles: store `t0`, draw with `col(t0 × f(life))`; puffs from 16 pre-baked radial sprites.
7. Atmosphere: contact glows, footprints, heat shimmer strip copies, grain pattern, cached vignette + camera overlay, cached text bitmaps for live readouts.
8. HUD: camera-white 1 px borders, ramp-filled segmented bars, Share Tech Mono readouts, bracket-framed cards.

## Code

The ramp and the LUT – everything is coloured by this one function:

```js
const STOPS = [[0,'#030108'],[0.08,'#0d0626'],[0.18,'#1d0b52'],[0.28,'#3a0f78'],[0.38,'#64108a'],[0.48,'#96158a'],
  [0.57,'#c4256a'],[0.65,'#e3443a'],[0.73,'#f4701a'],[0.81,'#fb9d12'],[0.88,'#fdc52e'],[0.94,'#ffe777'],[1,'#fffdf2']]
  .map(([t, h]) => [t, [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))]);
function ramp(t) {
  t = Math.min(1, Math.max(0, t));
  for (let i = 1; i < STOPS.length; i++) if (t <= STOPS[i][0]) {
    const [t0, a] = STOPS[i - 1], [t1, b] = STOPS[i], k = (t - t0) / (t1 - t0);
    return a.map((v, j) => v + (b[j] - v) * k);
  }
  return STOPS[STOPS.length - 1][1];
}
const BANDS = 72, LUT = new Uint8ClampedArray(256 * 3);
for (let i = 0; i < 256; i++) LUT.set(ramp(Math.round((i / 255) * (BANDS - 1)) / (BANDS - 1)), i * 3);
const gray = (t, a = 1) => { const v = Math.round(Math.min(1, Math.max(0, t)) * 255); return `rgba(${v},${v},${v},${a})`; };
```

The heat bake – paint temperatures, then diffusion, limb cooling, hot-only halo, LUT:

```js
function blur3(src, w, h, r) { // 3 x separable box blur (zero outside)
  const tmp = new Float32Array(src.length), out = new Float32Array(src.length), iv = 1 / (2 * r + 1);
  let a = src;
  for (let p = 0; p < 3; p++) {
    for (let y = 0; y < h; y++) { let s = 0; for (let x = 0; x <= r && x < w; x++) s += a[y*w+x];
      for (let x = 0; x < w; x++) { tmp[y*w+x] = s * iv; if (x+r+1 < w) s += a[y*w+x+r+1]; if (x-r >= 0) s -= a[y*w+x-r]; } }
    for (let x = 0; x < w; x++) { let s = 0; for (let y = 0; y <= r && y < h; y++) s += tmp[y*w+x];
      for (let y = 0; y < h; y++) { out[y*w+x] = s * iv; if (y+r+1 < h) s += tmp[(y+r+1)*w+x]; if (y-r >= 0) s -= tmp[(y-r)*w+x]; } }
    a = out;
  }
  return out;
}
function bakeHeat(w, h, paint, K = 4, f = (t) => t) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); paint(x); // gray = temperature, alpha = coverage
  const d = x.getImageData(0, 0, w, h).data, N = w * h, A = new Float32Array(N), TA = new Float32Array(N);
  for (let i = 0; i < N; i++) { A[i] = d[i*4+3] / 255; TA[i] = d[i*4] / 255 * A[i]; }
  const Ad = blur3(A, w, h, Math.round(0.55 * K)), TAd = blur3(TA, w, h, Math.round(0.55 * K));
  const Ah = blur3(A, w, h, Math.round(1.5 * K)), TAh = blur3(TA, w, h, Math.round(1.5 * K));
  const img = x.createImageData(w, h), q = img.data, smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  for (let i = 0; i < N; i++) {
    const a = A[i]; let t = 0;
    if (a > 0.003) { const t0 = TA[i] / a, tb = TAd[i] / Math.max(Ad[i], 1e-4); t = (t0 + (tb - t0) * 0.5) * (1 - 0.42 * (1 - Math.min(1, Ah[i] * 1.3))); }
    const th = TAh[i] / Math.max(Ah[i], 1e-4), ah = Math.min(1, Ah[i] * 1.7) * 0.62 * smooth(0.36, 0.8, th) * (1 - a), oa = a + ah;
    if (oa < 0.004) continue;
    const i1 = Math.round(Math.min(1, Math.max(0, f(t))) * 255) * 3, i2 = Math.round(Math.min(1, Math.max(0, f(th * 0.6))) * 255) * 3;
    for (let k = 0; k < 3; k++) q[i*4+k] = (LUT[i1+k] * a + LUT[i2+k] * ah) / oa;
    q[i*4+3] = Math.min(255, oa * 255);
  }
  x.putImageData(img, 0, 0);
  return c; // flash: f = t => t + (1 - t) * 0.86 · cooled: f = t => 0.1 + 0.34 * t · afterimage: f = t => 0.74 * t
}
```

Painting a subject – the main character's head, as temperatures:

```js
function paintHead(c, K) {
  c.setTransform(K, 0, 0, K, 16 * K, 36 * K); // anchor = feet
  const radial = (x, y, r, t0, t1) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, gray(t0)); g.addColorStop(1, gray(t1)); return g; };
  c.beginPath(); c.rect(-8.8, -23.4, 5.6, 11.8); c.fillStyle = gray(0.27); c.fill();                  // cold backpack
  c.beginPath(); c.arc(0.6, -24.7, 5.5, 0, Math.PI * 2); c.fillStyle = radial(2.4, -24.4, 6.6, 0.7, 0.53); c.fill(); // hood
  c.beginPath(); c.ellipse(2.95, -24.3, 3.65, 4.15, 0, 0, Math.PI * 2); c.strokeStyle = gray(0.76); c.lineWidth = 1.35; c.stroke(); // fur ruff
  c.beginPath(); c.ellipse(3.05, -24.2, 2.75, 3.25, 0, 0, Math.PI * 2); c.fillStyle = radial(3, -24.8, 3.5, 1.0, 0.86); c.fill(); // white-hot face
  c.beginPath(); c.arc(5.25, -23.8, 0.7, 0, Math.PI * 2); c.fillStyle = gray(0.79); c.fill();          // cooler nose tip
}
```

Particles that cool while they age:

```js
const COLS = Array.from({ length: 64 }, (_, i) => { const c = ramp(i / 63); return `rgb(${c[0]|0},${c[1]|0},${c[2]|0})`; });
const col = (t) => COLS[Math.max(0, Math.min(63, Math.round(t * 63)))];
function drawEmber(ctx, p) { // p: {x, y, z, vx, vy, vz, life, max, t0, size}
  const k = Math.max(0, p.life / p.max), t = p.t0 * (0.45 + 0.55 * k), vy = p.vy - p.vz, sp = Math.hypot(p.vx, vy) || 1;
  const L = Math.min(5, sp * 0.03) * (0.5 + 0.5 * k), y = p.y - p.z;
  ctx.globalAlpha = Math.min(1, k * 2.5); ctx.strokeStyle = col(t); ctx.lineWidth = p.size * 0.8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(p.x, y); ctx.lineTo(p.x - p.vx / sp * L, y - vy / sp * L); ctx.stroke();
  ctx.globalAlpha = 1;
}
```

## Adapting it to your project

- **Other palettes**: the whole look is one LUT. Swap the stops for "white-hot" (black → white), "black-hot" (inverted), "rainbow" (blue → green → yellow → red) or "arctic" (blue → white → gold) and every asset follows instantly – a great unlockable camera mode.
- **New creatures**: start from the silhouette, then choose the hot focal point (eyes, mouth, core) and the cold part (shell, armour, wings, fur). Keep 0.15+ difference between neighbouring parts.
- **Mechanical subjects**: engines, batteries and motors are the hot cores; panels and shells are cold; exhausts get shimmer and plumes.
- **Indoor scenes**: floors at 0.2–0.3, walls colder with warm pipes and vents inside them, warm handprints on doors, lamps and screens as hot rectangles.
- **Stealth mechanics as visuals**: hiding = cooling down (use the cooled transfer), alert = flashing white-hot, footprints reveal paths for a few seconds.
- **Day / night**: shift the ground up (0.3–0.45) in daytime – sun-heated roads go magenta and trees turn warm while bodies stay hottest.
- **Other subjects**: any world works as long as you define its temperature budget table first.

## Performance notes

- Bake once in init (~0.4 s): the main character (8 walk + 8 idle + 3 dash + recoil), small critter 8, wisp 8, hulk 8 frames – each with 4 box blurs on the CPU – plus normal / flash / cooled / afterimage variants and mirrored copies, collectibles 2 × 6 frames, projectile head and trail, orb, 9 prop sprites, 16 puff sprites, 4 grain tiles.
- Ground chunks (256 u at up to 2.5 px/unit): ~25–40 ms each, spread over ~80 generator steps of ~1 ms. Keep the per-pixel loop in a plain function (not inside the generator body) so the engine can optimise it; precompute the periodic fine noise as pixel tables per resolution; flag grid cells that can contain hedges, roads or water so open-field pixels skip that math.
- Per frame: 1 `drawImage` per sprite (2–3 with afterimages), particles as single strokes or puff blits, one grain pattern fill (plain source-over – blend modes like `overlay` are far slower on a full screen), up to 10 small strip copies for heat shimmer, one cached overlay image, cached text bitmaps instead of `strokeText` every frame.
- Hot spot: the full-screen passes (grain, overlay) on software-rendered canvases; drop the grain first if you need headroom.

## Copy-paste prompt

```text
Use the "Thermal Vision" art style for my project: the world as seen through an infrared camera.
Render everything as a TEMPERATURE first (0 = coldest .. 1 = hottest) and map it through one
ironbow false-colour ramp: #030108, #0d0626, #1d0b52, #3a0f78, #64108a, #96158a, #c4256a,
#e3443a, #f4701a, #fb9d12, #fdc52e, #ffe777, #fffdf2 (72 quantised bands for faint banding).
Ground stays cold (indigo/violet, max ~0.46): field patchwork with cold hedgerows, warm roads,
flat cold ponds, fading warm footprints. Trees and fences are colder than the ground (near-black).
Characters are heat signatures with one white-hot focal point (face, eye, furnace core) and one
cold part (backpack, quills, fur, eye holes). Bake each sprite once: paint grayscale temperatures,
blur for diffusion, cool the rims by up to 42 %, add a halo only around warm things, map via LUT.
Effects cool through the ramp as they age: white-hot pops, ember streaks, rising puffs, rings.
Atmosphere = the camera: warm contact glows instead of shadows, vignette, animated sensor grain,
heat shimmer above hot sources, corner brackets, a temperature scale bar, °C readouts, REC dot,
timestamp and a tracking box. UI: camera-white 1 px borders, square corners, ramp-filled bars,
Share Tech Mono readouts, Orbitron titles, Chakra Petch card titles. No other colours anywhere.
```
