# Neon Midnight — Game Art Style Spec

> Glowing neon tube line-art with baked halos on a near-black holographic floor of circuit, hex and halftone regions.

Every character and prop is drawn as glowing tubes: a saturated coloured line with a near-white "hot" core, on top of a soft halo that is pre-blurred once at load time, around a near-black tinted glass fill. The floor is a dark midnight board split into noise-shaped districts, each with its own faint additive pattern (violet grid, teal hexagons, magenta halftone dots, copper circuit traces, blue water scanlines), separated by thin glowing contour lines. Scanlines, a violet vignette and short chromatic glitches finish the look: a Halloween rave at 23:59. The reference game is *Jack vs. the Turnip Ancestors* (a pumpkin-headed hero against turnip creepers, ghosts and crystal colossi), but nothing here depends on that theme.

## At a glance

| | |
| --- | --- |
| Family | Vector · Neon |
| Mood | electric, nocturnal, synthwave, rave, crisp |
| Best for | arcade shooters, survivor-likes, twin-stick / bullet hell, rhythm games, retro-futuristic puzzles |
| Renderer | Canvas 2D, fully procedural, no image assets |
| Pixel art | No – native resolution, sprites baked at 4 px per world unit |
| Difficulty | 3/10 – line drawings plus glow; risk: too many effects get garish |
| Fonts | Orbitron (HUD), Monoton (titles), Audiowide (brand), Rajdhani (body) |
| Key colours | `#05040d` void · `#ff7a1a` hero · `#ff3ad6` magenta · `#6ff4ff` cyan · `#b44dff` acid · `#8dff2a` toxic · `#c6ff3a` lime |

## When to use it

Good fits:
- **Survivor-likes / arena shooters with hundreds of enemies.** Glass-filled outlines occlude each other cleanly and each enemy type owns one hue, so hordes stay countable.
- **Rhythm, music and synthwave games.** The palette, the flicker and the additive bursts work with a beat.
- **Retro-futuristic, cyber, Tron-like or Halloween-night settings.** Any setting that can plausibly be "at night, made of light".
- **Small teams and AI-generated content.** Everything is paths with a few line widths; new enemies are quick to draw.

Bad fits:
- Cozy, pastoral or daylight games – the style has no ambient light.
- Story games that need faces with subtle expression or material detail (cloth, wood, skin).
- Very cluttered UIs or text-heavy games – glowing text gets tiring.
- Games where colour carries a lot of different meanings: you only get ~5 hue families before it turns into a rainbow.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Void | `#05040d` | Canvas/page background, ~60 % of the screen |
| Midnight floor | `#06050f` | Ground fallback colour |
| Hero orange | `#ff7a1a` | Hero head outline, hero floor light, hero death fragments |
| Amber | `#ffae35` | Hero body/limbs, level-up ring, lanterns |
| Back-limb amber | `#c8761c` | Limbs on the far side of the hero |
| Scarf yellow | `#ffe14a` | Hero accent, shot sparks |
| Stem green | `#9cff4a` | Stems and small organic accents |
| Magenta | `#ff3ad6` | Small melee enemy outline, kill counter |
| Violet | `#b066ff` | Enemy leaves, secondary enemy lines |
| Root lilac | `#d77bff` | Enemy legs/roots |
| Cyan | `#6ff4ff` | Fast/floating enemy, HUD labels and frames |
| Ice | `#eaffff` | Highlights on cyan actors |
| Acid violet | `#b44dff` | Brute outline |
| Acid dark | `#7a38d6` | Brute facet lines |
| Toxic green | `#8dff2a` | Brute core, cracks, eyes, stomp rings |
| Lime | `#c6ff3a` | Small XP gems, level badge |
| Gem cyan | `#45f4ff` | Big XP gems |
| Seed orange | `#ff9a2e` | Player projectile |
| Lavender / dark | `#c3b5ff` / `#6a5ad0` | Props (graves, fences) front / back edges |
| Pink sign | `#ff4fd8` | Pylons, sign frames, HP bar border |
| Hurt pink | `#ff2a7a` | Damage flash, chroma split (with cyan `#2ae8ff`) |

Body fills (always near-black, alpha 0.95–0.97): hero `rgba(26,10,3,.96)`, pumpkin head `rgba(30,9,2,.97)`, small enemy `rgba(32,4,34,.96)`, brute `rgba(22,6,38,.97)`, ghost `rgba(6,26,44,.58)` (the only translucent body), props `rgba(12,8,30,.95)`.

Palette rules:
- **Black first.** At least 60 % of the screen is near-black. Colour only exists as emitted light.
- **One hue family per actor type**, used consistently for its sprite, particles, floor pool and spawn ring.
- **Line + hot core.** Every primary line is its colour plus a core stroke of that colour mixed 62 % towards white. Never white or dark outlines.
- **Fills are the hue darkened to rgb ≈ 20–32.** Never fill a body with a saturated colour.
- **Floor < 15 % brightness**, patterns ≤ ~0.5 alpha, so any actor outshines the ground.
- Forbidden: browns, greys, beiges, desaturated mid-tones, daylight sky colours.

## Typography

- **Orbitron** 500/700/900 – HUD numbers, timer, labels, damage numbers, card titles. https://fonts.google.com/specimen/Orbitron
- **Monoton** 400 – big screen titles (LEVEL UP!, GAME OVER, PAUSE); its multi-stroke letters look like bent neon tubes. https://fonts.google.com/specimen/Monoton
- **Audiowide** 400 – brand / style name plate. https://fonts.google.com/specimen/Audiowide
- **Rajdhani** 500/600/700 – body text, descriptions, menus. https://fonts.google.com/specimen/Rajdhani

```css
/* timer: gradient-filled numbers with two drop-shadow glows */
.clock-time{font:900 38px/1.05 'Orbitron',sans-serif;letter-spacing:3px;
  background:linear-gradient(180deg,#fff7e0 0%,#ffd36b 36%,#ff7a1a 62%,#ff2bd0 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 0 5px rgba(255,90,40,.8)) drop-shadow(0 0 16px rgba(255,43,208,.55))}
.clock-label{font:600 10px 'Orbitron',sans-serif;letter-spacing:5px;color:#8ff8ff;text-shadow:0 0 6px #1ed8ff}
.title{font:400 68px/1 'Monoton',cursive;color:#ffd36b;letter-spacing:6px;
  text-shadow:0 0 6px #ff8a1f,0 0 18px #ff3ad6,0 0 42px rgba(255,43,208,.7)}
.desc{font:600 17px 'Rajdhani',sans-serif;color:#b8f6ff;text-shadow:0 0 6px rgba(40,200,255,.45)}
```

Text effects: always a pale tinted fill (`#ffe6fb`, `#d8f8ff`, `#ffe2b0`) plus 1–3 `text-shadow` layers in the saturated hue (6 px, 14–18 px, 42 px). Labels use wide letter-spacing (3–5 px), uppercase.
Damage numbers are baked into a digit atlas (Orbitron 46 px): blur 6 px + blur 2 px glow fill (`#2fd8ff` normal, `#ff6a1a` crit), a 6 px dark edge stroke (`rgba(3,8,26,.92)`), then the fill (`#f4fdff` normal, `#ffe58a` crit, weight 900). Rendered 8.6 u tall (12.5 u for crits) with a pop-in scale.

## Rendering technique

1. **Sprite pass functions.** Each drawable is a function `pose(ctx, pass, phase)` that issues the same paths twice: `pass = 'full'` and `pass = 'glow'`. Two helpers decide what each pass does:
   - `tube(ctx, pass, col, lw)`: full → stroke `col` at `lw`, then a core stroke at `lw*0.36` in `mix(col, white, 0.62)`. Glow → stroke `col` at `lw*1.8`. Options: `hot:false` (no core – for detail lines), `glow:false` (no halo), `gw` (halo width factor), `glowCol`, `hotCol`.
   - `fillIn(ctx, pass, fillCol, glowCol)`: full → near-black fill; glow → optional glowing fill (faces, eyes, cores).
2. **Bake** (`bakeSet`, K = 4 px/unit, round caps/joins): render both passes into separate canvases, then composite onto a third: glow pass with `filter: blur(2.2u*K px)` at alpha 0.7, (extra copy at 0.7*(glowA−1) if glowA > 1.2), glow pass with `blur(0.6u*K px)` at alpha 0.6, then the sharp full pass at alpha 1. Brutes use wide = 2.6, gems wide 1.6/tight 0.5, lanterns wide 3.0/tight 0.8/glowA 1.5.
3. **Character variants** (`makeSprite`): for every frame bake right-facing, mirror it for left-facing, and create silhouette copies of the *sharp* pass tinted white `#ffffff`, magenta `#ff2a7a` and cyan `#2ae8ff` (via `source-atop` fill). These are the hit flash and chroma split.
4. **Props** (`bakeProp`): baked like sprites, plus an elliptical floor pool (radial gradient, y-scale 0.34) and a reflection: the sprite flipped vertically at 36 % scale, faded by a 30 %→0 gradient (`destination-in`). Hologram props get 0.55 u gaps punched out every 2.2 u with `destination-out`.
5. **Ground** is baked per 256 u chunk (resolution up to 2.5 px/u), incrementally with a generator. See next section.
6. **Per frame**, draw order (world space, 360 u visible vertically): ground chunks → contact pools → additive ground overlay (hero light spill, lantern glows) → props and actors y-sorted (one `drawImage` each; additive flash copies on top when hit) → projectiles (additive) → particles (collected into buckets and flushed as a few additive strokes) → damage numbers → screen glitch → display overlay (scanlines + vignette + fringe, cached per resolution).
7. **No pixel snapping, no low-res buffer.** Smooth scaling of the 4 px/u sprites is fine; at 1080p one unit is 3 px, so sprites are slightly supersampled.

## Background and ground

The floor is "a circuit board seen at night" split into districts:

1. **Fields.** Per world point sample 4 fbm fields (2 octaves) with domain warp: `q = fbm(x/1150, y/1150) − 0.5`, `X = x/1050 + q*1.3`. Also a water field `fbm(x/560 …, 3 oct)` and a slow brightness field `fbm(x/240)`. Sample on a 4 u grid with a 2-cell margin so chunks match.
2. **Base colour.** Softmax of the 4 fields with temperature 0.012 (nearly hard borders, a 1–2 cell blend) mixes the bases: violet `rgb(8,8,32)`, teal `rgb(3,15,21)`, magenta `rgb(30,4,22)`, copper `rgb(14,9,15)`. Water (`smoothstep(0.625, 0.645, wat)`) mixes in `rgb(2,9,30)`. Multiply by `0.7 + 0.6*bright`. Put it in a tiny ImageData and draw it scaled up with smoothing.
3. **Patterns.** Each region draws its full pattern on a scratch canvas, then `destination-in` with its upscaled weight mask (alpha = weight × (0.42 + 0.58·smoothstep(0.3, 0.7, bright))), then composites onto the chunk with `lighter`:
   - *Violet grid*: 8 u lines at `rgba(120,80,255,.16)`, every 32 u a 4 px halo `rgba(120,70,255,.1)` + 1 px `rgba(165,115,255,.5)`, a 5.2 u cross `rgba(225,200,255,.85)` every 64 u.
   - *Teal hex*: pointy hexes of radius 9 u, 1 px `rgba(40,215,195,.34)`; 7.5 % of cells lit with fill `rgba(40,215,195,.075)` and inner hex at 52 % radius `rgba(100,255,230,.6)`; 2.5 % get a 1.1 u dot.
   - *Magenta halftone*: staggered 6 u grid, dot radius `0.42 + 1.25*smoothstep(0.3,0.78,noise(x/120,y/120))`, `rgba(255,70,200,.52)`; 1.2 % big dots (0.9 u bright + 2.6 u ring).
   - *Copper circuit*: in 26 u cells (42 % chance) a trace of 2–3 segments, 8–26 u long, turning ±45°, 0.6 u `rgba(255,150,60,.38)`; 45 % of traces are 2–3 parallel offset lines 2.8 u apart. End pads r 1.2 u ring, start vias r 0.7 u filled; chips (96 u cells, 30 %): 10–16 × 6–10 u rectangles with 2 u pins.
   - *Water*: 1 px horizontal lines every 2 u `rgba(40,130,255,.24)` plus glints 2–12 u long (`rgba(90,190,255,.55)` / `rgba(200,240,255,.8)`).
4. **Decals** (`lighter`): star dust squares 0.3–0.75 u in pale lilac/white/cyan/pink at 22–55 %; line glyphs 1.8–3.2 u (cross, moon, star, diamond, triangle, ring, chevrons, bat, rune; 13 % are pumpkins in `#ff9a3c`), each stroked 2.2 u at 16 % + 0.5 u at full; landmarks 18–28 u (targets with tick rings, clock faces at 23:59, moons with stars) stroked 5 u/5 %, 1.8 u/16 %, 0.55 u/42 %.
5. **Contours.** Marching squares on `field_i − max(other fields)` at iso 0 (skipping water cells) and on the water field at iso 0.635 and 0.657. Each segment set is stroked three times additively (`glowStroke`): 6 u at 5 %·k, 2 u at 15 %·k, 1.15 px at 62 %·k in the line colour mixed 35 % to white. Line colours: violet `rgb(136,104,255)`, teal `rgb(30,214,196)`, magenta `rgb(255,64,206)`, copper `rgb(255,150,64)`; water `rgb(90,200,255)` (k 1.15) and an inner contour `rgb(60,150,255)` (k 0.45).

Scale: districts are 300–800 u across, so a screen usually shows 2–3 of them and one border curve.

## Characters

**Hero** (feet at 0,0, ~18 u wide, ~30 u tall, faces right):
- **Head**: pumpkin path, ellipse rx 7.6 × ry 6.3 centred at (0.5, −21.7), radius modulated `1 + 0.035·cos(6t) − 0.08·max(0,−sin t)^14` (6 lobes, flattened top), fill `rgba(30,9,2,.97)`, outline `#ff7a1a` 1.3 u with hot core. Two side ribs `rgba(255,110,30,.55)` 0.55 u (full pass only). Stem `#9cff4a` 1.15 u curving right.
- **Face**: two triangle eyes and a zig-zag grin, filled with a radial gradient `#fffbe2 → #ffe08a (55 %) → #ffa526`, glowing `#ffb000` in the glow pass – it is the brightest thing on screen.
- **Body**: small tunic trapezoid (−2.6..2.6 at the top, −4..4 at the hem) filled near-black, outlined `#ffae35` 1.05 u; a satchel strap `#ffcf7a` 0.5 u without core.
- **Limbs**: stick limbs 1.0–1.05 u (hip → knee → foot → toe; shoulder → elbow → hand with a 0.85 u filled hand). Front limbs `#ffae35`, back limbs `#c8761c`.
- **Scarf**: front wrap `#ffe14a` 1.7 u + two trailing tails 1.15 u / 0.8 u that wave at 2× walk frequency.
- **Frames**: 8 walk frames (`phase = i/8`), 1 idle, 1 dash (body rotated 0.26 rad, limbs stretched, scarf horizontal). Baked box: 16 u left, 38 u up, 16 u right, 6 u down (dash: 20 u sides).
- **Facing** is a mirrored copy, not a redraw. Invulnerability blinks at 18 Hz to 40 % alpha.

The hero gets an orange floor light: an additive radial glow `#ff8a2a` at 34 % alpha, 116 × 52 u, under the feet, plus a contact pool (dark core 55 %, orange rim 22 %) 26 u wide.

## Enemies and props

Every enemy type owns one hue family and one strong silhouette; all have near-black glass fills.

- **Small melee enemy** ("creeper", ~18 × 27 u): a bulb (bezier, −8.9..8.9 × −20..−4.2) outlined magenta `#ff3ad6` 1.25 u, filled `rgba(32,4,34,.96)`; the top part above a sine wave line is tinted `rgba(170,40,215,.42)` (clipped) with a violet 0.6 u wave line – a "liquid level" that suggests volume. Three violet `#b066ff` leaves on top (0.8 u), lilac `#d77bff` root legs (0.95 u), angry slanted triangle eyes filled `#ffeafb` glowing `#ff5fe4`, a zig-zag mouth `#ffa6f2`. 8 frames, bob 1.2 u, rock ±0.09 rad.
- **Fast floating enemy** ("ghost", ~22 × 30 u): a sheet with dome head (radius 6.6 u) and a wavy hem whose control points move with three phase-shifted sines. Fill is translucent `rgba(6,26,44,.58)`, inner rim `rgba(111,244,255,.2)` 3.4 u clipped inside, outline cyan `#6ff4ff` 1.15 u. Black hollow oval eyes and mouth (`#010409`) with 0.42 u cyan rims and tiny white pupils, three-fingered stick arms, two twinkling white star sparkles with cyan glow. 6 frames, glowA 1.15; hovers 2.5 u above its pool with ±1.3 u float.
- **Brute** ("colossus", ~40 × 52 u, scaled 0.92): a 12-point crystal body outlined acid violet `#b44dff` 1.4 u; an inner hexagon connected to the outline by 11 facet lines in `#7a38d6` 0.55 u (no core) – this faceting is its whole shading. Top band tinted `rgba(150,60,230,.32)`. Thick arms drawn as a 5.4 u violet stroke with a 3.3 u dark stroke inside (a hollow tube), hex fists, block legs, three jagged crown leaves. Toxic green `#8dff2a` cracks (0.6 u) radiate from a pulsing hex core filled `#fbfff0 → #c8ff6a → #45c414`, and two slit eyes 1.35 u. Footfalls emit a squashed green ring 14 → 30 u.
- **Pickups**: XP gems are 4-vertex octahedra rotated per frame (8 frames over 90°): only front faces drawn, translucent fills `hexA(col, 0.3–0.75)`, a 0.6 u outline with a pure white core, a white 0.5 u specular dot. Lime `#c6ff3a` small (yc −7.5 u), cyan `#45f4ff` big. They are drawn with `lighter` and get a baked floor glow ellipse.
- **Orbiting lanterns**: small carved pumpkin lanterns (`#ffb84a` outline, gradient face), glow wide 3.0 u / glowA 1.5, swinging ±0.18 rad, with an additive amber light arc behind them.
- **Props** (lavender, pink, teal – never the enemy colours): gravestones/crosses/fences in lavender `#c3b5ff` with a fake 3D extrusion (a copy of the outline offset (1.9, −1.4) u in `#6a5ad0` 0.5 u plus connecting edges), street lamps `#7fd8ff` with a warm `#ffbe55` bulb, pylons `#ff4fd8` with cyan bands, holo trees `#38f5d6` (recursive branches, line width 0.35 + depth·0.22) with orange fruit and hologram scan gaps, sign posts with pink frame + cyan inner frame + icon, shrines.

Readability with many enemies:
- Dark glass fills mean a crowd is a stack of opaque shapes, each fully outlined – no line soup.
- Halos are baked at alpha ≤ 0.7, so 100 overlapping sprites don't white out. Do **not** draw actors with `lighter`; only effects are additive.
- Each type differs in hue *and* silhouette (round bulb with leaves / dome sheet with hem / huge faceted block) and size class.
- Props avoid enemy hues and sit at lower brightness; floor patterns stay ≤ 0.5 alpha.

## Effects and particles

All effects are additive (`globalCompositeOperation = 'lighter'`) and use only the source's own colours plus white.

- **Particles are lines, not dots.** A spark is a line from its position back along its velocity, length `min(9, 1 + speed·0.035)·size·0.5`. Fragments are rotating short lines. Dots are tiny squares.
- **Batching**: particles go into buckets keyed by colour + quantised alpha (4 levels) + line-width class (0.45 / 0.8 / 1.3 u). Each bucket is one path stroked twice: `lineWidth·3.2` at `alpha·0.28` (the glow) then `lineWidth` at `alpha` (the core).
- **Rings**: ellipses squashed to 42 % height (floor rings) or 100 % (air rings), radius eased out `r0 + (r1−r0)(1−(1−e)²)`.
- **Projectile**: baked trail (24 × 2.4 u orange gradient wedge with a white core, blurred 0.9 u then re-stamped sharp) behind a seed sprite; trail scales in over 0.1 s and out in the last 0.15 s. 2 muzzle sparks (`#ff9a2e`, `#ffe14a`).
- **Hit**: white flash silhouette (alpha flash·1.2) + magenta/cyan copies ±1.4 u when flash > 0.5; 4 sparks (2 white, 2 enemy colour), white ring 1.5 → 7 u in 0.14 s.
- **Kill**: 7 / 9 / 20 fragments (ghost / small / brute), length 3.6 / 4.2 / 6.5 u, in the enemy's two colours (68 % primary), gravity 170; 5–10 white sparks; floor ring 0.6r → 3.2r. Brutes add a 5r toxic ring, an air ring and 12 green dots, plus a 0.12 s screen glitch.
- **Dying sprite**: scales to 1.35×, sinks 3 u, image fades at 1.6/s while the white flash fades at 1.4/s and magenta/cyan copies drift apart by `2 + 4t` u.
- **Spawn**: warp ring shrinking 2.4r → r plus a bottom-up reveal with a bright scan line on the edge.
- **Pickup**: ring 3 → 11 u (18 u big) + 2–6 rising dots in the gem colour.
- **Dash**: 4 additive after-images, 7 u apart, alpha 0.34 → 0.10; orange ring 4 → 24 u; 8 sparks in `#ff7a1a`/`#ffe14a` thrown backwards.
- **Level-up**: 18 × 92 u vertical beam (amber → transparent magenta, soft-edged), amber ring 6 → 70 u, lime ring 4 → 46 u, 22 rising sparks in lime/amber/yellow.
- **Hurt**: 10 sparks in `#ff2a7a`/`#ffae35`, pink ring, and a 0.22 s screen glitch (strips of the frame redrawn shifted ±18 px, 6 % pink wash).

## Lighting, shadows and post-processing

- **No drop shadows.** Actors sit on **contact pools**: a radial sprite with a dark core (`rgba(0,0,0,darkA)` to 38 %, 75 % of that to 38 %) fading into a coloured rim at 62 % and transparent at the edge, drawn as an ellipse `2rw × 0.8rw`. Hero: orange, dark 0.55, rim 0.22, rw 13. Small: magenta 0.5/0.2. Ghost: cyan 0.22/0.16 (it floats). Brute: toxic 0.55/0.2. Radius = enemy radius × 1.45 (ghost 1.3).
- **Light spill**: additive radial glows (stops 100 % / 45 % @ 0.35 / 12 % @ 0.7 / 0) under the hero (34 %) and each lantern (30 %), squashed vertically.
- **Glow** is baked into sprites (see Rendering technique). Never `shadowBlur` at runtime – only for HUD icons baked once.
- **Display overlay** (built once per resolution): 1 px black lines every 3 px (4 px above 1100 px height) at 12 %; radial vignette from 32 % of the short side to 56 % of the diagonal: `rgba(6,0,18,0)` → `rgba(6,0,18,.3)` at 62 % → `rgba(2,0,8,.78)`; additive lens fringe in the outer 9 % of the width: magenta `rgba(255,40,200,.10)` on the left, cyan `rgba(40,220,255,.09)` on the right.
- **Glitch**: brief horizontal strip displacement + pink wash, triggered by impactful events only.
- **Flicker**: neon props randomly dim to 55 % (3.5 % chance per 1/13 s tick), holograms breathe.

## UI and HUD

Panels are near-black translucent with a 1 px neon border and an outer glow; bars are skewed −22° and segmented every 25 px; numbers are Orbitron with gradient fills and glow. Level-up cards stand over a CSS perspective grid (magenta 1 px lines, 64 × 34 px, rotateX(62deg)) with magenta corner brackets and a cyan border. Icons are drawn with the same tube logic (shadowBlur = size/9, line 4.6 px at 96 px icon size, 7.5 px when ≤ 48 px, a hot core at 36 %).

```css
.hud-panel{background:linear-gradient(90deg,rgba(30,6,40,.88),rgba(6,10,30,.88));border:1px solid rgba(255,79,216,.75);
  border-radius:2px;box-shadow:0 0 14px rgba(255,60,200,.35),inset 0 0 10px rgba(80,220,255,.15);
  font:600 13px 'Rajdhani',sans-serif;color:#d8f8ff}
.hp-bar{position:relative;width:250px;height:15px;transform:skewX(-22deg);background:rgba(22,4,26,.82);
  border:1px solid #ff4fd8;box-shadow:0 0 12px rgba(255,60,200,.6),inset 0 0 8px rgba(0,0,0,.9)}
.hp-fill{height:100%;background:linear-gradient(90deg,#ff2bd0,#ff5a6a 45%,#ff8a1f 80%,#ffc23a);box-shadow:0 0 14px rgba(255,100,60,.9)}
.hp-bar::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 23px,rgba(10,2,14,.85) 23px 25px)}
.xp{position:relative;height:12px;background:rgba(8,4,22,.8);border:1px solid rgba(180,120,255,.7);border-radius:2px;
  box-shadow:0 0 10px rgba(160,80,255,.5),inset 0 0 6px rgba(0,0,0,.9)}
.xp-fill{height:100%;background:linear-gradient(90deg,#2af0ff 0%,#7dffb0 60%,#c6ff3a 100%);box-shadow:0 0 12px rgba(120,255,200,.8)}
.lvl{padding:1px 9px;background:#0b0620;border:1px solid #c6ff3a;font:700 11px 'Orbitron',sans-serif;color:#eaffc0;
  letter-spacing:1px;text-shadow:0 0 6px #b6ff3a;box-shadow:0 0 10px rgba(198,255,58,.55)}
.card{background:linear-gradient(170deg,rgba(74,24,124,.62),rgba(10,6,30,.93) 58%,rgba(6,20,42,.93));
  border:1px solid rgba(111,244,255,.85);border-radius:3px;
  box-shadow:0 0 18px rgba(60,220,255,.38),inset 0 0 26px rgba(170,80,255,.32),inset 0 1px 0 rgba(255,255,255,.25)}
.card:hover{transform:translateY(-8px);border-color:#ffd36b;box-shadow:0 0 28px rgba(255,160,60,.55),inset 0 0 30px rgba(255,120,40,.25)}
.overlay{background:repeating-linear-gradient(0deg,rgba(0,0,0,.16) 0 1px,transparent 1px 3px),
  radial-gradient(ellipse at 50% 42%,rgba(52,12,88,.6),rgba(3,2,12,.9) 72%)}
```

## Motion and animation

- All animation is **baked frames** chosen by phase; nothing is re-drawn as paths at runtime.
- **Hero**: 8-frame walk, cycle = 3 distance-units of anim time; bob `−|sin a|·1.1` u, foot swing ±3.5 u, foot lift 1.7 u, arm swing 0.75 rad; idle bob `sin(t·3.2)·0.5` u; dash pose tilts 0.26 rad.
- **Small enemy**: 8 frames, speed `anim·0.36`, bob 1.2 u, rock ±0.09 rad, leaves sway ±0.1 rad, feet lift 1.9 u.
- **Fast enemy**: 6 frames at 1.7 cycles/s; hem waves via 3 sines 2.1 rad apart; float 1.3 u at 2.6 rad/s; 5 % glitch frames; after-images when speed > 8.
- **Brute**: 8 frames at `anim·0.22`, bob 1.5 u, foot lift 3 u, core pulse ±0.35 u at 2× frequency, stomp ring in the first 35 % of each half-cycle.
- **Gems**: 8 frames at 1.6 cycles/s, bob 0.7 u at 3 rad/s, pop-up 6 u on spawn.
- **Projectiles**: spin flip `0.65 + 0.35·|cos(spin)|` on Y.
- **Damage numbers**: pop scale `1 + max(0, life − 0.78)·2.6`, fade with `min(1, life·2.4)`.
- Easing: ease-out quad for rings and spawn reveal; linear fades. No squash-and-stretch on bodies – the look is crisp and mechanical.

## Do and don't

Do:
- Bake the glow once per sprite (blurred fat-stroke pass + sharp pass) and only `drawImage` at runtime.
- Give every primary line a near-white hot core at 36 % width; skip it on detail lines.
- Fill bodies with near-black glass of their own hue.
- Use `lighter` for every light effect: halos, particles, rings, floor glows, gems.
- Keep the floor dark and patterned at low alpha; mark region borders with thin glowing contours.
- Keep one hue family per actor type across sprite, particles, pool and spawn ring.
- Finish with scanlines, violet vignette and the magenta/cyan lens fringe.

Don't:
- Use `shadowBlur` or `ctx.filter` per frame on sprites – it kills performance.
- Draw dark or black outlines, or pure white outlines.
- Leave shapes unfilled (wireframes) or fill them with bright colour.
- Put gradients or textures on character bodies; use 1–3 interior lines for volume.
- Brighten the floor patterns above ~0.5 alpha.
- Mix more than two hues + white in one effect.
- Draw actors themselves with `lighter` – crowds would white out.

## Implementation recipe

1. Set up a Canvas 2D game with a world-space camera; pick a vertical view of ~360 world units and a hero ~18 × 30 u.
2. Copy the helpers from `starter.js`: `tube`, `fillIn`, `bakeSet`, `makeSprite`, `tint`, `flip`, `makePool`.
3. Define your palette: background `#05040d`, then one hue family per actor type (hero warm orange/amber/yellow, enemies magenta, cyan, acid violet + toxic green, pickups lime/cyan).
4. Write each actor as `pose(ctx, pass, phase)` with feet at (0,0), facing right: closed silhouette paths → `fillIn(dark glass)` → outline `tube(col, 1.15–1.4)` → thinner detail tubes (`hot:false`) → glowing eyes/faces via `fillIn(fill, glowFill)`.
5. At load time bake N frames per actor with `makeSprite(left, top, right, bottom, pose)` (8 walk frames, 6 for floaters), which yields both facings + white/magenta/cyan silhouettes.
6. Build the floor: dark base + region patterns (grid / hex / halftone / circuit / water) masked by noise regions and added with `lighter`, star dust, faint glyphs, glowing marching-squares borders. Bake per chunk.
7. Each frame: ground → contact pools → additive light spill → y-sorted sprites (`drawImage`) → additive flashes → projectiles → batched additive particles → numbers → glitch → cached overlay.
8. Effects: line sparks, line fragments and squashed rings in the source's colours plus white, always two strokes (3.2× at 28 %, 1× at 100 %).
9. HUD: Orbitron numbers with gradient + glow, skewed segmented bars, 1 px neon borders, Monoton titles.
10. Check readability with 200 enemies on screen; if it blooms out, reduce halo alpha (`glowA`), not the line colour.

## Code

The snippets below are the core techniques, cleaned up from the reference module. `starter.js` in this folder contains all of them plus the hero, three enemy types, gems, the procedural floor and a complete preview scene. The full reference implementation is [`../../js/styles/neon.js`](../../js/styles/neon.js).

```js
// Neon tube + glass fill: the same path is drawn in a 'full' and a 'glow' pass.
const hot = (hex, k = 0.62) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 'rgb(' + c.map((v) => Math.round(v + (255 - v) * k)).join(',') + ')'; };
function tube(c, pass, col, lw, o = {}) {
  if (pass === 'full') {
    c.strokeStyle = col; c.lineWidth = lw; c.stroke();
    if (o.hot !== false) { c.strokeStyle = o.hotCol || hot(col); c.lineWidth = lw * 0.36; c.stroke(); }
  } else if (o.glow !== false) { c.strokeStyle = o.glowCol || col; c.lineWidth = lw * (o.gw || 1.8); c.stroke(); }
}
function fillIn(c, pass, col, glowCol) {
  if (pass === 'full') { if (col) { c.fillStyle = col; c.fill(); } } else if (glowCol) { c.fillStyle = glowCol; c.fill(); }
}
```

```js
// Bake once: blurred glow pass (wide + tight) under the sharp pass. K = px per world unit.
const K = 4;
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function bakeSet(l, t, r, b, draw, { wide = 2.2, tight = 0.6, glowA = 1 } = {}) {
  const w = Math.ceil((l + r) * K), h = Math.ceil((t + b) * K);
  const pass = (p) => { const c = mk(w, h), x = c.getContext('2d');
    x.lineCap = 'round'; x.lineJoin = 'round'; x.setTransform(K, 0, 0, K, l * K, t * K); draw(x, p); return c; };
  const full = pass('full'), glow = pass('glow'), out = mk(w, h), x = out.getContext('2d');
  x.filter = `blur(${wide * K}px)`; x.globalAlpha = Math.min(1, 0.7 * glowA); x.drawImage(glow, 0, 0);
  if (glowA > 1.2) { x.globalAlpha = Math.min(1, 0.7 * (glowA - 1)); x.drawImage(glow, 0, 0); }
  x.filter = `blur(${tight * K}px)`; x.globalAlpha = Math.min(1, 0.6 * glowA); x.drawImage(glow, 0, 0);
  x.filter = 'none'; x.globalAlpha = 1; x.drawImage(full, 0, 0);
  return { img: out, full, w: w / K, h: h / K, ax: (l * K) / w, ay: (t * K) / h };
}
// Usage: world-space draw with feet anchor
// const s = bakeSet(16, 38, 16, 6, (c, p) => heroPose(c, p, 0));
// ctx.drawImage(s.img, x - s.ax * s.w, y - s.ay * s.h, s.w, s.h);
```

```js
// Hit flash + chroma split from silhouette copies of the sharp pass.
function tint(src, col) { const c = mk(src.width, src.height), x = c.getContext('2d');
  x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); return c; }
// at bake: s.flash = tint(s.full, '#ffffff'); s.red = tint(s.full, '#ff2a7a'); s.cyan = tint(s.full, '#2ae8ff');
function drawHit(ctx, s, x, y, flash) {
  const at = (img, dx) => ctx.drawImage(img, x + dx - s.ax * s.w, y - s.ay * s.h, s.w, s.h);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = Math.min(1, flash * 1.2); at(s.flash, 0);
  if (flash > 0.5) { ctx.globalAlpha = 0.75 * flash; at(s.red, -1.4); at(s.cyan, 1.4); }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
```

```js
// Batched additive particles: one path per colour/alpha bucket, stroked as halo + core.
const buckets = new Map();
function bucket(color, alpha, lwClass) {
  const aq = alpha > 0.82 ? 4 : alpha > 0.55 ? 3 : alpha > 0.3 ? 2 : 1, key = color + aq + lwClass;
  if (!buckets.has(key)) buckets.set(key, { color, a: aq / 4, lw: [0.45, 0.8, 1.3][lwClass], lines: [], rings: [] });
  return buckets.get(key);
}
function flush(ctx) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (const b of buckets.values()) {
    if (!b.lines.length && !b.rings.length) continue;
    ctx.beginPath();
    for (let i = 0; i < b.lines.length; i += 4) { ctx.moveTo(b.lines[i], b.lines[i + 1]); ctx.lineTo(b.lines[i + 2], b.lines[i + 3]); }
    for (let i = 0; i < b.rings.length; i += 4) { const [x, y, rx, ry] = b.rings.slice(i, i + 4);
      ctx.moveTo(x + rx, y); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); }
    ctx.strokeStyle = b.color;
    ctx.globalAlpha = b.a * 0.28; ctx.lineWidth = b.lw * 3.2; ctx.stroke();
    ctx.globalAlpha = b.a; ctx.lineWidth = b.lw; ctx.stroke();
    b.lines.length = 0; b.rings.length = 0;
  }
  ctx.restore();
}
// spark: bucket(col, life, 1).lines.push(x, y, x - vx/sp * L, y - vy/sp * L); floor ring: rings.push(x, y, r, r * 0.42)
```

```js
// Glowing region border: three additive strokes of one Path2D (world units; px = 1 / pixelsPerUnit).
function glowStroke(ctx, path, rgb, px, k) {
  const c = (a, m = 0) => `rgba(${rgb.map((v) => Math.round(v + (255 - v) * m)).join(',')},${a})`;
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = c(0.05 * k); ctx.lineWidth = 6; ctx.stroke(path);
  ctx.strokeStyle = c(0.15 * k); ctx.lineWidth = 2; ctx.stroke(path);
  ctx.strokeStyle = c(0.62 * k, 0.35); ctx.lineWidth = 1.15 * px; ctx.stroke(path);
  ctx.globalCompositeOperation = 'source-over';
}
```

## Adapting it to your game

Keep fixed (this *is* the style):
- Near-black background and floor, colour only as light.
- The two-pass bake: line + hot core at 36 %, 1.8× halo blurred 2.2 u @ 70 % + 0.6 u @ 60 %.
- Dark glass fills, round caps/joins, line widths 0.3–1.4 u at a 360 u tall view.
- Additive effects in the source's colours + white, particles as lines, squashed floor rings.
- Scanlines, vignette, lens fringe.

May change:
- **Palette swap**: any saturated hues work if each actor family stays one hue and lines stay bright on black. Example "Tron" variant: hero cyan, enemies orange/red, pickups white. Keep hot cores as `mix(col, white, 0.62)` and fills as the hue at rgb ≈ 20–32.
- **New character types**: start from a strong closed silhouette, add 2–3 protrusions and glowing eyes; give it an unused hue or reuse a family only with a very different silhouette and size.
- **Floor**: swap the district patterns for your theme (city map, starfield, music staff, topographic lines) but keep them under 0.5 alpha and keep glowing borders.
- **Genres**: side-view platformers work (draw ground edges as glowing contours, add the reflection trick to everything standing on the floor); puzzle games can use the tube look for tiles.
- **Resolution**: keep K ≈ px-per-unit × 1.3–2. At 4K raise K to 8; on mobile 3 is enough. Blur radii are in world units × K, so they scale automatically.
- **Mood**: drop the glitches and fringe for a calmer "neon sign" look; drop Monoton for Audiowide titles if you want less retro.

## Performance notes

- Bake cost: each frame is 3 canvases + 2 blur filters + 3 tint copies + 4 mirrored copies. The reference bakes ~60 character frames, 16 gem frames and ~14 props at init (~0.3–0.6 s on desktop). Bake lazily or in a generator if you have more.
- Runtime per actor: 1 `drawImage` (2–4 when flashing or trailing). 500 enemies is fine on desktop.
- Particles: never one stroke per particle; bucket by colour/alpha/width – the reference ends up with ~10–20 strokes per frame regardless of particle count.
- Ground: baked per 256 u chunk at ≤ 2.5 px/u with a generator that yields between steps (fields, base, each pattern layer, decals, contours) so chunk streaming never hitches. The masks are tiny (67 × 67) ImageData upscaled with smoothing.
- Overlay: one cached full-screen canvas per resolution.
- Damage digits: baked atlas per font weight; re-baked once the web font has loaded.
- Avoid: runtime `shadowBlur`/`filter`, `lighter` on actor sprites (overdraw blooms), per-frame gradient creation for many objects.

## Copy-paste prompt

```text
Build my game <X> in the "Neon Midnight" art style (Canvas 2D, procedural, no image assets):
- Background near-black #05040d; colour exists only as emitted light. At least 60 % of the screen stays black.
- Every sprite is neon tube line-art: draw each path twice, a 'full' pass (line in colour + a core stroke at 36 % width
  in the colour mixed 62 % to white) and a 'glow' pass (same path at 1.8x width). At load time blur the glow pass
  (blur 2.2 world units at 70 % alpha + 0.6 units at 60 %) and stamp the sharp pass on top. Never blur per frame.
- Bodies are closed silhouettes filled with near-black glass of their own hue (alpha 0.95); faces/eyes are the brightest fill.
- Line widths at a 360-unit-tall view: silhouettes 1.15–1.4, limbs ~1.0, details 0.3–0.7 (no hot core). Round caps/joins.
- One hue family per actor type: hero orange #ff7a1a / amber #ffae35 / yellow #ffe14a; small enemy magenta #ff3ad6 + violet #b066ff;
  fast enemy cyan #6ff4ff; brute acid violet #b44dff with toxic green #8dff2a core; pickups lime #c6ff3a / cyan #45f4ff.
- Bake 8 walk frames per actor, mirrored copies, and white/#ff2a7a/#2ae8ff silhouettes for hit flash + chroma split.
- No shadows: contact pools (dark core, coloured rim ellipse) and additive floor light under light sources.
- Floor: dark noise districts with faint additive patterns (violet grid, teal hexes, magenta halftone, copper circuit traces,
  blue water lines) ≤ 0.5 alpha, separated by thin glowing contour lines; sparse star dust.
- Effects are additive ('lighter'), in the source's colours + white: line sparks, line fragments, rings squashed to 42 %,
  each stroked twice (3.2x width at 28 % alpha, then 1x). Batch particles by colour.
- Post: 1 px scanlines every 3 px at 12 %, violet vignette, magenta-left/cyan-right lens fringe, short glitch on big hits.
- HUD: Orbitron numbers with gradient fill + glow, skewed segmented bars, 1 px neon borders, Monoton titles, Rajdhani body.
```
