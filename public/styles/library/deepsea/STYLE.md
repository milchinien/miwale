# Deep Sea Glow — Game Art Style Spec

> The abyssal sea floor at night, lit only by living light: glowing jellies, kelp and coral, marine snow and blue depth fog.

A dark navy sea floor of sand ripples, terraced rock shelves and brine pools, with kelp forests, coral, tube-worm gardens and whale bones – and **no light except what lives there**. Every creature and plant carries its own soft cyan, teal, violet or pink glow: photophores along a fish's belly, polyp tips on coral, gas bulbs on kelp, a pulsing jellyfish bell, the lure of an anglerfish. The one warm note is the helmet lamp of a small diver, whose cone of light picks out the sand ahead. Marine snow drifts past in three parallax layers, faint caustics and light shafts fall from far above, and a blue depth fog swallows the edges of the frame. Unlike hard neon line art, the glow here is soft, blurred and always attached to something alive – the image feels quiet, deep and full of hidden life.

## At a glance

| | |
| --- | --- |
| Family | Underwater · Bioluminescent |
| Mood | mysterious, calm, wondrous, lonely, dreamy |
| Best for | underwater exploration, calm atmospheric adventures, light-and-darkness horror, worlds with glowing life, relaxing collect-and-explore games |
| Renderer | Canvas 2D, fully procedural, no image assets |
| Pixel art | No – native resolution; characters baked at 5 px per world unit, props at 4, ground chunks at up to 2.5 px/unit |
| Complexity | 5/10 – a dark body + a few emissive spots per asset; the shared bake makes it glow. The skill is restraint. |
| Fonts | Exo 2 (titles, numbers), Quantico (labels, card titles), Comfortaa (body copy) |
| Key colours | `#040b18` abyss · `#162842` sand · `#59e8ff` cyan · `#34f0c8` teal · `#9d7dff` violet · `#ff6fd2` pink · `#fff1c8` lamp |

## When to use it

Good fits:
- **Underwater and deep-space exploration.** Darkness hides the map; every glow is a point of interest, a creature or a collectible.
- **Calm, atmospheric adventures.** Slow drifting particles, breathing lights and soft fog make a relaxing, meditative mood.
- **Light-and-darkness horror.** A tiny warm lamp in a cold dark world; things appear out of the fog, a large shape is only betrayed by its lure.
- **Crowded scenes that must stay readable.** Each creature type owns a glow colour and a silhouette, and its light pool marks its position on the floor.
- **Relaxing collect-and-explore games.** Collectibles are glowing orbs and pearls – the brightest small things on screen.

Bad fits:
- Bright daylight settings, farming, picture-book warmth.
- Puzzle or strategy games that need many colour codes or warm hues – the palette is cold and the world is dark.
- Interfaces that must feel flat, corporate or paper-like.
- Projects that want hard graphic line art – that is what neon styles are for.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Abyss | `#040b18` | Background, fallback ground colour, fog base |
| Sand | `#07101f` | Dark sand, the darkest ground (~45 % of the floor) |
| Sand light | `#162842` | Lighter sand patches |
| Ripple crest | `#2c4a6e` | Thin bright crests of sand ripples (the brightest ground tone) |
| Silt | `#09091b` | Violet-black silt basins |
| Silt light | `#1a1838` | Mottling inside silt basins |
| Rock | `#060a13` | Rock crevices and step shadows |
| Rock top | `#1f2f48` | Lit faces of rock terraces |
| Rock rim | `#547aa6` | Lit upper lips of rock shelves |
| Cyan | `#59e8ff` | Main glow: lantern fish photophores, diver seams, glass sponges, projectile, sonar UI |
| Teal | `#34f0c8` | Kelp bulbs, microbial mats, small collectible, title glow |
| Aqua white | `#c4fdff` | Hot cores of cyan lights, flashes, highlights |
| Violet | `#9d7dff` | Anglerfish rim and lateral dots, vents, brine pool rims, large collectible |
| Pink | `#ff6fd2` | Jellyfish, coral polyps, sea stars, UI bar fill |
| Rose | `#ff7fae` | Tube-worm plumes, fan coral |
| Mint | `#8dffe0` | Anglerfish lure and eye |
| Lamp | `#fff1c8` | Helmet lamp lens – the only warm light |
| Lamp glow | `#ffc46b` | Lamp halo, lamp floor pool, belt-buckle light |
| Suit | `#1f4d6e` | Diving suit |
| Suit dark | `#112e46` | Far limbs, suit shadow side |
| Bone | `#7d90a0` | Whale bones, tube-worm tubes (dim, cold) |

Palette rules:
- **~85 % of the screen is near-black navy** (`#040b18`–`#1f2f48`). Glow colours cover a few percent of the pixels but carry all the contrast.
- Every bright spot has a **white-mixed core** (75–85 % towards white) and a falloff in its own colour – that is what makes it read as light instead of paint.
- **One warm colour only:** the helmet lamp (`#fff1c8` / `#ffc46b`). Nothing else is warm, so the main character is always found by its lamp.
- **One glow colour per creature type:** small jelly pink, fast fish cyan, large anglerfish violet with a mint lure. Props reuse the palette at lower intensity.
- Dark bodies are never pure black – navy or violet-black with a cold rim light (`rgba(150,196,255,.42)`).
- No greens, oranges, reds or greys as surface colours; white only for tiny highlights and teeth.

## Typography

| Family | Weights | Role | Sample CSS |
| --- | --- | --- | --- |
| **Exo 2** | 600, 700, 800 | Panel titles, timer, counters, bar numbers, floating digits | `font: 800 25px/1 'Exo 2', sans-serif; letter-spacing: 1px; color: #eafffb; text-shadow: 0 0 8px #34f0c8, 0 0 20px rgba(52,240,200,.55);` |
| **Quantico** | 400, 700 | Spaced instrument labels and card titles, uppercase | `font: 700 15px 'Quantico', sans-serif; text-transform: uppercase; letter-spacing: 1.5px; color: #e6fffb;` |
| **Comfortaa** | 400, 600, 700 | Body copy, card descriptions, caption bar | `font: 600 14px/1.45 'Comfortaa', sans-serif; color: #9fdcf0;` |

All three are Google Fonts. Exo 2 gives the rounded-technical "instrument display" feel, Quantico the stencilled panel labels, Comfortaa the soft, friendly body text. Text never sits on a flat colour: it glows (`text-shadow` in teal, cyan or pink) on dark glass. Small labels get wide letter-spacing (3–4 px). Floating digits are baked from Exo 2 700/800 with a 7 px blurred cyan (or pink for strong ones) glow and a dark 6 px outline.

## Rendering technique

The shared pipeline:

1. **Two passes per sprite at bake time.** Every subject is drawn by one function twice: pass `full` paints the visible body; pass `glow` paints only the parts that emit light (seams, dots, tips, lure, translucent bells at low alpha).
2. **Halo bake.** The glow pass is blurred twice with `ctx.filter` – `blur(3.2 u)` at full alpha (a second time if the glow strength is > 1) and `blur(0.9 u)` at 80 % – onto a halo canvas. A flat radial **light pool** (an ellipse 0.42 high under the sprite origin, radius 12–46 u, alpha 0.1–0.32) is painted into the same halo.
3. **Compose.** For props and creatures the halo is added onto the body with `'lighter'` once, so each appears with **one `drawImage`** at runtime. The main character keeps the halo separate and draws it additively *after* the body, so its glow blooms over neighbours.
4. **Variants.** Facing = mirrored copies; flash = body silhouette tinted `#e6fffb`; hurt = tinted `#ff5c9a`. Both are added on top with `'lighter'`.
5. **Glow sprites.** A 64 px radial gradient per colour (white-mixed core at 0–12 %, colour at 30 %, 10 % at 62 %, 0 at the edge) is cached and reused for particles, light pools, floor pulses and the lure.

Draw order per frame: ground chunks → floor light pulses → collectibles → the diver's light pools and contact shadow → y-sorted props, creatures (their pools are baked in) and the diver → orbiting jellies → projectiles → particles → digits → marine snow → one half-resolution layer with depth fog, light shafts and caustics.

Resolution: native. Sprites are baked at 5 px/u (characters) and 4–6 px/u (props, effects), drawn scaled. Ground chunks are 256 units at up to 2.5 px/u.

## World and ground

The floor is computed per pixel from smooth noise fields, then decorated with vector decals.

**Fields** (sampled on a 4-unit grid, interpolated bilinearly per pixel; channels are only interpolated where they are needed):
- *rock* – fbm at 330 u, domain-warped by a second fbm (260 u) for organic outlines
- *silt* – fbm at 640 u
- *ripple warp* and *ripple direction* – fbm at 170 u (phase offset, amplitude 7) and 900 u (angle 0.45 ± 1.3 rad)
- *macro light* – fbm at 210 u
- *ripple patches* – fbm at 150 u; ripples only appear where it is above 0.5–0.64
- grain: one 256 px tileable fbm tile, read at 2 texels per unit (fine) and 0.5 (coarse)

**Sand**: `#07101f` → `#162842` driven by macro light and grain. **Ripples**: `sin((x·cos a + y·sin a)·0.66 + warp)` – a wavelength of ≈ 9.5 units. Crests above 0.55 lerp towards `#2c4a6e` by `((s − 0.55)·2.22)² · 0.5`, troughs below −0.2 are darkened by up to 26 %. Ripples exist only in patches, so the floor reads as sand fields, not as a fingerprint.

**Silt basins** (silt field < 0.43, full at 0.36): `#09091b` → `#1a1838` mottled by the coarse grain; ripples drop to 20 %.

**Rock shelves** (rock field > 0.6): 24 terraces per field unit. Within one step the tone ramps from `#060a13` to `#1f2f48`; the first 16 % after a step is the **lip**, brightened by the dot product of the field gradient with the top-left light (0.45, 0.85); the last 7 % is a dark crevice; the very outer edge gets the `#547aa6` rim. A band of 0.035 field units outside the shelf is darkened by up to 60 % as a soft contact shadow.

**Decals** (deterministic per world cell, so they continue across chunk borders):
- worm and sea-cucumber trails: two dotted dark lines with a faint lighter centre, 14–26 steps of 3.2 × 2.2 u
- pebbles 0.6–1.5 u with a lit upper arc, burrows (dark hole + raised rim, 35 % with a teal glowing tip), small shells
- brittle stars (thin bent arms) and sea stars (5 solid arms) in pink or violet over a soft pool
- **microbial mats**: 13–28 u soft pools in teal, cyan or violet with 30–70 glowing dots, denser in the middle
- plankton specks 0.16–0.38 u in the four glow colours, barnacle glints along rock lips
- **brine pools** (one chance per 560-unit cell, never on rock): organic blob r 34–60 u (two sine harmonics), 0.62 high; dark crust ring, 140 mussels on the shore, near-black gradient surface `#0a0c22 → #020308` with faint concentric ripples, and a violet → cyan → violet rim drawn as three additive strokes (7 / 3 / 0.6 u at 5 / 12 / 55 %)

At runtime the floor breathes: about 45 % of 46-unit cells flash a small glow (2.2–5.6 u) once every 2.6–6.6 s, sometimes with a wider pool.

## Characters

**Main character – the diver** (~18 u wide, ~31 u tall, feet at the origin, facing right):
- **Dome helmet**: a 6.8 u glass circle centred 23 u up, radial gradient `rgba(76,156,196,.92)` → `rgba(10,30,52,.98)`; a 1.15 u steel bezel `#5e8096` with four bolts, an upper-left reflection arc and a highlight dot, a 0.3 u cyan rim glow.
- **Face** inside the glass: a warm-lit round face (`#ffe5cc → #e9a987 → #8a5246`), dark hair fringe, two small dark eyes with a white glint, a pink blush and a tiny smile – the friendliest thing in the deep.
- **Suit**: a 4.3 × 5.3 u torso ellipse with a `#3f7fa6 → #1f4d6e → #112e46` gradient, dark belt with a warm buckle light, a glowing cyan seam and chest light, short arms (2.3 u strokes) with a wrist light.
- **Air tank** on the back (4.2 × 10 u, metal gradient) with a valve, a hose to the helmet and a mint indicator light.
- **Flippers**: 9 u long, glowing cyan along their top edge.
- **Helmet lamp**: a small housing on the upper front of the dome with a warm `#fff1c8` lens. Per frame it throws a soft volumetric cone (66 × 26 u, 55 % alpha, tilted 0.36 rad down) and a warm pool on the floor 34 u ahead.
- Its own halo is drawn additively at 1.1 over the body, plus a 38 × 15 u cyan floor pool and a faint dark contact smudge.

**Small creature – jellyfish** (~17 × 22 u, hovering): a bell built from a cubic dome and eight scalloped rim curves, radial gradient `rgba(255,222,250,.95)` → `rgba(236,124,234,.8)` → `rgba(112,52,192,.72)`; a darker inner dome, four glowing gonad loops, nine rim dots, three frilly oral arms and seven thin tentacles. Pink light pool 2.3 × radius.

**Fast creature – lantern fish** (~21 × 9 u): a slim navy body (`#0d223c → #1e4168 → #6b97c0` belly), forked translucent tail with a glowing edge, a big black eye with a cyan ring, a row of 8 belly photophores, 6 lateral ones and two bright head lights. Cyan pool 2.6 × radius; when fast it leaves two faint afterimages.

**Large creature – anglerfish** (~41 × 30 u): a huge rounded body (`#2a4068 → #13213a → #070c18`, lit near the face by its own lure), darker blotches, a cold rim light along the back, a gaping mouth with 6 upper and 6 longer lower needle teeth (pale, faintly glowing), a small mint eye, 9 violet lateral dots, pectoral fin and fan tail with violet edges, three tipped dorsal spines. The **lure** is drawn per frame: a rod from the forehead arching forward and a mint bulb (glow 11 u + soft 30 u halo) that sways ±1.6 u and pulses, throwing a mint pool on the sand.

Rules: bodies dark, light in a few features; silhouette tells the type, colour confirms it; everything except the diver hovers and bobs; flashes are added silhouettes, never recolours. Creatures emerge from the dark when they appear (alpha = t², glow 1.8 t, a shrinking light ring on the floor) and dissolve by rising 6 u, growing 30 % and fading while a plankton burst takes over.

## Props

All props are dark-bodied with a few glowing parts and a baked light pool:

| Prop | Look | Glow |
| --- | --- | --- |
| Kelp | 50–68 u stalk, 8–11 alternating leaf blades with gradients and a lighter midrib, root tangle | teal gas bulbs at every blade base, tiny hydroid specks |
| Coral (branching) | violet branches 3 → 0.7 u thick with a lighter upper-left stroke | pink polyp tips with three satellites |
| Coral (fan) | a fan of deep-magenta branches | rose polyp dots along every branch |
| Tube worms | 7–10 pale ringed tubes (9–24 u) on a dark crust | rose feathery plumes |
| Whale fall | rib cage: 16 vertebrae and 7 rib pairs; skull: a large skull mass with eye sockets, two jaw bones, scattered vertebrae | pink worm colonies, aqua bacterial mats |
| Anemone | violet column, crown of 18 curved tentacles | tentacle tips in cyan, violet or pink |
| Rock | faceted basalt boulder with cracks and a lit top edge | cyan barnacles, a pink sea star or a violet-tipped urchin |
| Vent | 32 u mineral chimney with crust ridges | violet mouth glow, mineral sparkles; dark smoke puffs and bubbles at runtime |
| Glass sponge | lattice vase (translucent fill, crossing lines) or violet ribbed barrel | glowing rim and lattice |

Placement follows the ground: kelp grows in forests (its own noise field, 3–6 strands per spot), coral, rocks, anemones and vents prefer rock shelves, whale falls, sponges and tube worms the silt basins; nothing grows in brine pools or near the start. Kelp bends through 8 baked frames, anemones sway with a small shear, glow spots on anemones, tube worms and vents pulse with a small additive glow.

## Effects and particles

- **Glowing projectile** – a 2 u white-to-cyan orb with a halo and a 22 u tapered cyan tail that grows in 0.1 s; three tiny aqua sparks wobble behind it.
- **Plankton burst** – 22 (38 for the large creature) glowing motes in the creature's colours, pushed out at 30–150 u/s, stopped by heavy water drag (3.2) and floating slowly upwards, living 0.8–1.6 s; a 0.25 s core flash, 4–9 bubbles, and for the large creature a dark ink puff and a wide violet ring.
- **Light rings** – additive ellipses drawn twice (3.6 × width at 22 %, then the line); flat floor rings (0.42 high) expand with ease-out; upright rings at body height for impacts.
- **Bubble streams** – a baked bubble (thin pale ring, inner glow, white highlight) rising with buoyancy, wobbling ±0.8 u: from the helmet every 1.3–2.6 s, behind a dash, from vents, on bursts.
- **Collectibles** – small: a teal-white orb (core r 1.55, ring r 2.7) bobbing above a teal pool; large: a 3.3 u pearl (white → lilac → violet) with a rotating four-point glint.
- **Orbiting moon jelly** – a tiny aqua-white jellyfish with 4 pulse frames circling 10 u above the floor, trailing a fading arc.
- **Impact spark** – six motes, a 0.14 s aqua flash, a small upright ring; the body gets an aqua-white silhouette at up to 75 %.
- **Glow-up** – a teal light column, three rising ellipse rings, 24 rising motes in all four glow colours, 12 bubbles and two floor rings.
- **Floating digits** – Exo 2 with a soft cyan glow (pink for strong ones), popping in and drifting up.

Particles are additive glow sprites (or the bubble / ink sprites); all of them slow down quickly and float up – nothing falls.

## Atmosphere and lighting

- **No cast shadows.** Hovering subjects get coloured light pools on the sand; only the diver (and the anglerfish) have a faint dark contact smudge.
- **Depth fog** – radial: transparent inside 26 % of the short side, `rgba(4,16,34,.26)` at 42 %, `rgba(3,11,24,.68)` at 78 %, `rgba(1,5,12,.9)` in the corners; plus a faint lighter murky band `rgba(30,92,130,.12)` over the top 40 %.
- **Light shafts** – four slanted beams, 6–10 % of the width at the top widening 2.4×, cyan-blue at 9–16 % fading to 0, blurred once and baked into the static fog layer at 80 %.
- **Caustics** – one 256 px tile of domain-warped Worley cell edges (f2 − f1 < 0.11), drawn twice in world space (205 u and 282 u per tile, the second rotated 90°), drifting in different directions at 7 % and 5.5 % – a faint, slowly shimmering web of light.
- **Marine snow** – 84 tiny specks (0.3–0.75 u, parallax 1.06), 42 small ones (0.65–1.25 u, parallax 1.32), 12 big out-of-focus discs (2.6–4.6 u, parallax 1.95, 14 % alpha), sinking 3–7.5 u/s, swaying and twinkling. Parallax > 1 because they float between camera and floor.
- Fog, shafts and caustics are composed in **one half-resolution layer** each frame (static fog + shaft base, two translation-only caustic fills) and blitted once, nearest-neighbour – everything in it is soft and low-contrast, so the 2 × 2 blocks never show. The snow is drawn before it, so the fog also swallows distant specks.
- In style mixes on a bright floor the separate halos are scaled down by the floor's luminance so they don't blow out to white.

## UI

A **submersible instrument panel** made of dark glass:
- **Panels**: `linear-gradient(180deg, rgba(14,40,60,.86), rgba(4,14,26,.9))`, 16 px radius, 1 px `rgba(110,220,255,.38)` border, a 3 px dark outer ring (`0 0 0 3px rgba(8,22,34,.75)`), a soft cyan outer glow and four **rivet dots** (radial gradients 7 px from each corner).
- **Top bar = glass tube**: 12 px, fully rounded, teal fluid fill `#13708f → #34f0c8 → #c8fff2` with tiny white bubbles drifting through it, double bezel ring; a **depth-gauge tick scale** (minor ticks every 2.5 %, major every 12.5 %) under it; the number sits in a pill-shaped porthole badge.
- **Second bar**: 14 px glass capsule, pink fill `#b0207a → #ff6fd2 → #ffc8ee` with a pink glow and a white sheen over the top 40 %.
- **Timer = sonar screen**: a 112 px disc with concentric rings every 13 px, crosshair, a pink and a mint blip that pulse every 2.2 s, and a conic **sweep** rotating every 4.5 s; the label sits on a small plate under the disc.
- **Cards**: 26 px radius glass with rivets, double bezel ring, a diagonal glass sheen, the icon inside a **porthole** (104 px circle, 4 px `#1d3a50` frame, cyan rim); hover lifts by 8 px and turns the rim pink.
- **Overlays**: a radial dark-water veil with faint sonar rings, light enough that the panels behind stay readable.
- **Icons** are drawn by the style with glow (`shadowBlur` at icon bake time): a pink heart with bubbles, a jellyfish, a glowing spear tip, orbs with trails, a flipper with streaks, an open clam with a pearl, an air tank with a plus.

```css
.panel { padding: 8px 14px; border-radius: 16px;
  background: radial-gradient(circle at 7px 7px, rgba(170,228,255,.55) 0 1.5px, transparent 2.2px),
              linear-gradient(180deg, rgba(14,40,60,.86), rgba(4,14,26,.9));
  border: 1px solid rgba(110,220,255,.38);
  box-shadow: 0 0 0 3px rgba(8,22,34,.75), 0 0 18px rgba(40,170,230,.22), inset 0 1px 0 rgba(255,255,255,.1); }
.bar { width: 228px; height: 14px; border-radius: 999px; background: rgba(2,8,18,.92);
  border: 1px solid rgba(255,140,220,.5); box-shadow: inset 0 2px 5px rgba(0,0,0,.8); overflow: hidden; }
.bar-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #b0207a, #ff6fd2 55%, #ffc8ee);
  box-shadow: 0 0 12px rgba(255,111,210,.8); }
.sonar { width: 112px; height: 112px; border-radius: 50%;
  background: repeating-radial-gradient(circle, transparent 0 12px, rgba(90,232,255,.16) 12px 13px),
              radial-gradient(circle, rgba(10,46,66,.92), rgba(3,12,24,.94) 70%);
  border: 2px solid rgba(110,225,255,.6); box-shadow: 0 0 0 5px rgba(10,26,40,.9), 0 0 26px rgba(60,210,255,.3); }
```

## Motion and animation

- **Water slows everything.** Particles use drag 2.6–3.2 and negative gravity (they float up); lights breathe instead of blinking.
- **Diver**: 8 walk frames – flippers kick ±3.1 u with a 1.6 u lift, body bob 0.9 u, arms swing ±0.75 rad. Idle floats 0.7 u at 2.1 rad/s. Dash tilts the figure 0.62 rad into a swimming pose with three halo afterimages 8 u apart. Bubble clusters of 3–5 rise from the helmet every 1.3–2.6 s and accelerate upwards.
- **Jellyfish**: 8 pulse frames at ~0.85 cycles/s – bell narrows 8.5 → 6.2 u, rises 1.4 u, tentacles stretch and wave.
- **Lantern fish**: 6 tail frames at 2.4 cycles/s, tail swing ±0.38 rad, pectoral flap.
- **Anglerfish**: 8 frames of jaw opening and fin flaps; the lure sways ±1.6 u at 1.3 rad/s and pulses ±15 %.
- **Kelp**: 8 baked bend frames over ~7.7 s; anemones sway with a shear of ±0.05; vent smoke rises 34 u over ~4.5 s.
- **Atmosphere**: the two caustic layers drift in different directions (≈ 2.8 u/s each), so the light web slowly shimmers; snow sinks 3–7.5 u/s; floor pulses rise and fall within 30 % of their period.
- **UI**: sonar sweep 4.5 s per turn, blips 2.2 s, bubbles in the top bar 3 s.

## Do and don't

Do:
- Keep ~85 % of the image near-black navy and let a few small, bright, living lights carry the picture.
- Paint bodies dark with a thin cold rim light from above, then add emissive dots, seams and tips.
- Give every glowing subject a coloured light pool on the sand – it replaces shadows and grounds hovering creatures.
- Give each creature type its own glow colour and silhouette.
- Bake halos once and add them with `'lighter'`; pre-composite halos into sprites that appear in numbers.
- Use slow, organic motion: pulses, sways, drifting snow, rising bubbles.
- Frame the scene with depth: fog at the edges, parallax snow, faint shafts and caustics.

Don't:
- Draw hard outlines or neon line art – the glow is soft and belongs to living things.
- Light the floor evenly or brighten it above `#2c4a6e`; the sand must stay darker than every creature.
- Add warm colours to the world – the helmet lamp is the only warm light.
- Use `ctx.filter` or `shadowBlur` per frame.
- Stack several full-resolution full-screen layers – compose fog, shafts and caustics small and blit once.
- Make creatures fully transparent ghosts – bodies need opacity and a rim to read.
- Fill the water with bright particles; marine snow is faint and tiny.

## Implementation recipe

1. Pick a 360-unit-high view; the main character is ~18 × 31 units.
2. Build the glow-sprite cache: one radial gradient per palette glow colour.
3. Write every subject as `draw(ctx, pass)`: body shapes only in pass `full`, emissive shapes in both passes (brighter colours in `full`).
4. Bake each sprite: body canvas + glow canvas → halo (two blurs + floor pool) → compose; mirror for facing; tint for flash/hurt.
5. Ground: compute noise fields on a coarse grid, per pixel sand + ripples + silt + terraced rock, then deterministic decals (mats, trails, stars, pools). Cache per chunk.
6. Per frame: ground → floor pulses → pools under subjects → y-sorted sprites (one drawImage each) → particles (additive glow sprites, bubbles).
7. Atmosphere: marine snow (three parallax layers) → half-resolution layer with static fog + shafts and world-aligned caustics → one nearest-neighbour blit.
8. UI: dark glass panels with rivets and bezel rings, glass-tube bars, a sonar disc, porthole icons, Exo 2 / Quantico / Comfortaa with glow.

## Code

Two-pass bake with a blurred halo and a floor light pool – the heart of the style:

```js
function bake(l, t, r, b, draw, { k = 4, wide = 3.2, tight = 0.9, glowA = 1, pool } = {}) {
  const w = Math.ceil((l + r) * k), h = Math.ceil((t + b) * k);
  const mk = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const paint = (pass) => { const c = mk(), g = c.getContext('2d');
    g.lineCap = g.lineJoin = 'round'; g.setTransform(k, 0, 0, k, l * k, t * k); draw(g, pass); return c; };
  const body = paint('full'), glow = paint('glow'), halo = mk(), hc = halo.getContext('2d');
  if (pool) { // [colour, radius, alpha] – a flat light pool on the floor under the origin
    const [col, R, a] = pool; hc.save(); hc.translate(l * k, t * k); hc.scale(1, 0.42);
    const g = hc.createRadialGradient(0, 0, 0, 0, 0, R * k);
    g.addColorStop(0, col + Math.round(a * 255).toString(16).padStart(2, '0')); g.addColorStop(1, col + '00');
    hc.fillStyle = g; hc.fillRect(-R * k, -R * k, R * k * 2, R * k * 2); hc.restore();
  }
  hc.filter = `blur(${wide * k}px)`; hc.globalAlpha = Math.min(1, glowA); hc.drawImage(glow, 0, 0);
  hc.filter = `blur(${tight * k}px)`; hc.globalAlpha = Math.min(1, 0.8 * glowA); hc.drawImage(glow, 0, 0);
  hc.filter = 'none';
  // pre-composite: ONE drawImage per object at runtime
  const out = mk(), oc = out.getContext('2d');
  oc.drawImage(body, 0, 0); oc.globalCompositeOperation = 'lighter'; oc.drawImage(halo, 0, 0);
  return { img: out, w: w / k, h: h / k, ax: (l * k) / w, ay: (t * k) / h };
}
// emissive helper: the same path is painted in both passes
const emit = (g, pass, col, glowCol) => { g.fillStyle = pass === 'full' ? col : (glowCol || col); g.fill(); };
const body = (g, pass, col) => { if (pass === 'full') { g.fillStyle = col; g.fill(); } };
```

A pulsing jellyfish drawn for the bake (`ph` 0..1 → 8 frames):

```js
function jelly(g, pass, ph) {
  const a = ph * Math.PI * 2, pulse = 0.5 + 0.5 * Math.cos(a);
  const rx = 6.2 + 2.3 * pulse, ry = 7.8 - 1.9 * pulse, rim = -15.5 - (1 - pulse) * 1.4;
  for (let i = 0; i < 7; i++) {                          // tentacles
    const x0 = (-0.82 + i * 0.273) * rx; g.beginPath(); g.moveTo(x0, rim);
    for (let k = 1; k <= 6; k++) g.lineTo(x0 + Math.sin(a - k * 0.75 + i * 1.3) * 0.32 * k, rim + k * (1.75 + 0.4 * (1 - pulse)));
    g.strokeStyle = pass === 'full' ? 'rgba(255,160,232,.6)' : 'rgba(255,110,220,.4)'; g.lineWidth = pass === 'full' ? 0.32 : 0.8; g.stroke();
  }
  g.beginPath(); g.moveTo(-rx, rim);                    // bell: cubic dome + scalloped rim
  g.bezierCurveTo(-rx, rim - ry * 1.32, rx, rim - ry * 1.32, rx, rim);
  for (let i = 0; i < 8; i++) { const x0 = rx - i / 8 * 2 * rx, x1 = rx - (i + 1) / 8 * 2 * rx; g.quadraticCurveTo((x0 + x1) / 2, rim + 1, x1, rim); }
  if (pass === 'full') {
    const gr = g.createRadialGradient(-rx * 0.25, rim - ry * 0.75, 0.4, 0, rim - ry * 0.3, rx * 1.05);
    gr.addColorStop(0, 'rgba(255,222,250,.95)'); gr.addColorStop(0.4, 'rgba(236,124,234,.8)'); gr.addColorStop(1, 'rgba(112,52,192,.72)');
    g.fillStyle = gr;
  } else g.fillStyle = 'rgba(255,100,215,.45)';
  g.fill();
  for (let i = 0; i <= 8; i++) { g.beginPath(); g.arc(-rx + i / 8 * 2 * rx, rim + 0.2, 0.36, 0, 7); emit(g, pass, '#fff2fc', '#ff8ae0'); }
}
```

Sea-floor pixel: sand, patchy ripples and terraced rock with a lit lip (`f` = interpolated fields, `g1`/`g2` = grain 0..1):

```js
function floorPixel(x, y, f, g1, g2) {
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  let t = Math.min(1, Math.max(0, f.light * 2.2 - 0.62 + (g1 - 0.5) * 0.5 + (g2 - 0.5) * 0.7));
  let c = mix([7, 16, 31], [22, 40, 66], t);                                   // #07101f -> #162842
  const amp = smoothstep(0.5, 0.64, f.patch) * (0.55 + 0.45 * t);
  const s = Math.sin((x * Math.cos(f.dir) + y * Math.sin(f.dir)) * 0.66 + f.warp);
  if (s > 0.55) c = mix(c, [44, 74, 110], ((s - 0.55) * 2.22) ** 2 * amp * 0.5);  // crest #2c4a6e
  else if (s < -0.2) c = c.map((v) => v * (1 - (-0.2 - s) * 1.25 * amp * 0.26));
  const e = f.rock - 0.6;
  if (e > -0.035 && e < 0) c = c.map((v) => v * (1 - 0.6 * (1 + e / 0.035) ** 2)); // contact shadow
  if (e >= 0) {
    const tf = (e * 24) % 1, lit = (0.45 * f.gx + 0.85 * f.gy) / (Math.hypot(f.gx, f.gy) + 1e-7);
    let b = 0.32 + 0.3 * tf + (g1 - 0.5) * 0.5 + (tf < 0.16 ? (1 - tf / 0.16) * lit * 0.5 : 0) - (tf > 0.93 ? 0.45 : 0);
    if (e < 0.012) b += (1 - e / 0.012) * Math.max(0, lit) * 0.7;
    c = b <= 1 ? mix([6, 10, 19], [31, 47, 72], Math.max(0, b)) : mix([31, 47, 72], [84, 122, 166], Math.min(1, b - 1));
  }
  return c;
}
const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
```

Atmosphere in one half-resolution layer (static fog + shafts, two world-aligned caustic layers), blitted once. `A.base` is the fog + shaft image at half size, `A.tiles` are two caustic tiles pre-scaled to the layer (205 u and 282 u per tile, the second rotated 90°):

```js
function drawAtmosphere(ctx, W, H, S, camX0, camY0, t, A /* {layer, base, tiles: [{c, n}, {c, n}]} */) {
  const lc = A.layer.getContext('2d'), lw = A.layer.width, lh = A.layer.height, LS = S * lw / W;
  lc.setTransform(1, 0, 0, 1, 0, 0);
  lc.globalCompositeOperation = 'copy'; lc.globalAlpha = 1; lc.drawImage(A.base, 0, 0);
  lc.globalCompositeOperation = 'lighter';
  const layers = [[A.tiles[0], 2.4, 1.5, 0, 0, 0.075], [A.tiles[1], -1.7, 2.2, 90, 40, 0.06]];
  for (const [T, vx, vy, ox, oy, a] of layers) {
    T.pat = T.pat || lc.createPattern(T.c, 'repeat');
    const mod = (v) => Math.round(((v % T.n) + T.n) % T.n);         // translation only: no resampling
    T.pat.setTransform(new DOMMatrix([1, 0, 0, 1, mod((ox + t * vx - camX0) * LS), mod((oy + t * vy - camY0) * LS)]));
    lc.fillStyle = T.pat; lc.globalAlpha = a; lc.fillRect(0, 0, lw, lh);
  }
  const sm = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;                                 // soft content: nearest 2x is invisible and cheap
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.drawImage(A.layer, 0, 0, W, H);
  ctx.imageSmoothingEnabled = sm;
}
```

## Adapting it to your project

- **Another setting with living light** – a cave, a night forest of fungi, a nebula: keep the two-pass bake, the light pools and the fog; swap sand for moss or dust and kelp for mushrooms.
- **Brighter or calmer**: raise the sand to `#162842` only, double the floor pulses, or remove the shafts for an even darker, lonelier mood.
- **More creature types**: give each a new glow colour from the palette and a clearly different silhouette; never reuse pink, cyan or violet + mint for a second type.
- **Readability in crowds**: increase the floor pool alpha rather than the halo – pools mark positions without washing bodies together.
- **Side view**: the bodies are already drawn in side view; turn the floor into a horizon band and let the marine snow sink vertically.
- **Mixing with other styles**: the halos are pre-composited; on bright floors reduce the halo strength by floor luminance (here: down to 30 %).

## Performance notes

- Baked once (~0.4 s): diver 10 poses, jellyfish 8, lantern fish 6, anglerfish 8 frames with flash/hurt tints and mirrored copies; collectibles, projectile, 4 moon-jelly frames, 24 kelp bend frames, 13 other props, glow sprites, one caustic tile.
- Ground chunks (256 u) are generators split into ~57 steps of at most a few ms (field grid, pixel rows, decal passes, brine pools), ~60–100 ms per chunk in total; channels are interpolated lazily.
- Per frame: **one drawImage per prop, creature and collectible** (halos and floor pools pre-composited, sprites cropped to their visible pixels), ~140 snow sprites, one half-resolution compose (fog + shaft base, two translation-only caustic fills) and **one** nearest-neighbour full-screen blit. No blur filters, no per-frame gradients.
- The expensive mistake to avoid is fill rate and draw-call count: separate additive halos and pools for every sprite, uncropped sprite margins and several full-screen layers (each costs as much as the whole ground) tripled the frame time before they were merged; a bilinear upscaling blit costs ~4× an unscaled one in software rasterisers.

## Copy-paste prompt

```text
Use the "Deep Sea Glow" art style for my project: the abyssal sea floor at night, lit only by
living light. 85 % of the image is near-black navy: sand #07101f..#162842 with patchy sine ripples
(thin crests #2c4a6e), violet-black silt #09091b, terraced rock shelves #060a13..#1f2f48 with lit
lips #547aa6, glowing microbial mats, worm trails, sea stars and brine pools with a violet rim.
Every light belongs to something alive, in soft cold colours: cyan #59e8ff, teal #34f0c8, violet
#9d7dff, pink #ff6fd2, rose #ff7fae, mint #8dffe0 – each with a white-mixed core and a blurred halo
(bake: body pass + emissive pass, blur 3.2 u and 0.9 u, add with 'lighter'). The only warm light
is the helmet lamp (#fff1c8) of a small diver with a glass dome helmet and glowing suit seams.
Creatures hover and glow in their own colour: pink pulsing jellyfish, fast cyan lantern fish with
photophores, a dark anglerfish with needle teeth and a mint lure. No shadows – coloured light pools
on the sand. Props: kelp with teal bulbs, coral with pink polyps, tube worms, whale bones, anemones,
vents, glass sponges. Effects: plankton bursts, light rings, bubble streams, glowing orbs and pearls.
Atmosphere: marine snow in 3 parallax layers, faint shafts and caustics from above, blue depth fog.
UI: a submersible instrument panel – dark glass, rivets, sonar disc, porthole icons, Exo 2 /
Quantico / Comfortaa with soft glow. Slow organic motion: everything drifts, pulses and floats up.
```
