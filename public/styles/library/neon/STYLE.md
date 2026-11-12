# Neon Midnight — Game Art Style Spec

> Glowing neon tube line-art with baked halos on a calm near-black floor of glowing roads, pattern districts and water.

Every character and prop is drawn as glowing tubes: a saturated coloured line with a near-white "hot" core, a soft halo pre-blurred once at load time and a near-black tinted glass fill. Light is ranked like a stage: the main character carries the brightest halo and a warm floor light, creatures glow one step lower, props lower still, and the floor stays a calm dark board – faint patterns gather in districts, meandering light roads with violet kerbs connect them, reeds fringe the lakes and a few floor plazas carry the detail. Scanlines, a violet vignette and short chromatic glitches finish the look: a Halloween rave at 23:59 — black, electric and crisp.

## At a glance

| | |
| --- | --- |
| Family | Vector · Neon |
| Mood | electric, nocturnal, synthwave, rave, crisp |
| Best for | arcade shooters, top-down arena action with crowded screens, twin-stick / bullet-hell games, rhythm games, retro-futuristic puzzles |
| Renderer | Canvas 2D, fully procedural, no image assets |
| Pixel art | No – native resolution, sprites baked at 4 px per world unit |
| Complexity | 3/10 – new assets are line drawings plus the shared glow bake; the risk is restraint: too many effects get garish |
| Fonts | Orbitron (HUD), Monoton (titles), Audiowide (brand), Rajdhani (body) |
| Key colours | `#05040d` void · `#ff7a1a` character orange · `#ff3ad6` magenta · `#6ff4ff` cyan · `#b44dff` acid · `#8dff2a` toxic · `#c6ff3a` lime |

## When to use it

Good fits:
- **Top-down arena action with crowded screens (hundreds of creatures).** Glass-filled outlines occlude each other cleanly and each creature type owns one hue, so crowds stay countable.
- **Rhythm, music and synthwave games.** The palette, the flicker and the additive bursts work with a beat.
- **Retro-futuristic, cyber, Tron-like or Halloween-night settings.** Any setting that can plausibly be "at night, made of light".
- **Small teams and AI-generated content.** Everything is paths with a few line widths; new characters and props are quick to draw.

Bad fits:
- Cozy, pastoral or daylight projects – the style has no ambient light.
- Story projects that need faces with subtle expression or material detail (cloth, wood, skin).
- Very cluttered or text-heavy interfaces – glowing text gets tiring.
- Projects where colour carries many different meanings: you only get ~5 hue families before it turns into a rainbow.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Void | `#05040d` | Canvas/page background, ~60 % of the screen |
| Midnight floor | `#06050f` | Ground fallback colour |
| Character orange | `#ff7a1a` | Main character head outline, its floor light, its dissolve fragments |
| Amber | `#ffae35` | Main character body/limbs, celebration ring, lanterns |
| Back-limb amber | `#c8761c` | Limbs on the far side of the main character |
| Scarf yellow | `#ffe14a` | Main character accent, projectile sparks |
| Stem green | `#9cff4a` | Stems and small organic accents |
| Magenta | `#ff3ad6` | Small creature outline, counter glow |
| Violet | `#b066ff` | Creature leaves, secondary creature lines |
| Root lilac | `#d77bff` | Creature legs/roots |
| Cyan | `#6ff4ff` | Fast floating creature, HUD labels and frames |
| Ice | `#eaffff` | Highlights on cyan subjects |
| Acid violet | `#b44dff` | Large creature outline |
| Acid dark | `#7a38d6` | Large creature facet lines |
| Toxic green | `#8dff2a` | Large creature core, cracks, eyes, footfall rings |
| Lime | `#c6ff3a` | Small collectible gems, badge |
| Gem cyan | `#45f4ff` | Large collectible gems |
| Seed orange | `#ff9a2e` | Projectile |
| Lavender / dark | `#c3b5ff` / `#6a5ad0` | Props (gravestones, fences) front / back edges |
| Pink sign | `#ff4fd8` | Pylons, sign frames, bar border |
| Flash pink | `#ff2a7a` | Impact flash, chroma split (with cyan `#2ae8ff`) |

Body fills (always near-black, alpha 0.95–0.97): main character `rgba(26,10,3,.96)`, its pumpkin head `rgba(30,9,2,.97)`, small creature `rgba(32,4,34,.96)`, large creature `rgba(22,6,38,.97)`, fast floating creature `rgba(6,26,44,.58)` (the only translucent body), props `rgba(12,8,30,.95)`.

Palette rules:
- **Black first.** At least 60 % of the screen is near-black (`#05040d` to `#1e0416`). Colour only exists as emitted light.
- **One hue family per subject type**, used consistently for its sprite, particles, floor pool and appear ring. Never swap families between types.
- **Line + hot core.** Every primary line is its colour plus a core stroke of that colour mixed 62 % towards white. Never white or dark outlines.
- **Fills are the hue darkened to rgb ≈ 20–32.** Never fill a body with a saturated colour.
- **Floor < 15 % brightness**, patterns ≤ ~0.5 alpha, so any character outshines the ground.
- Forbidden: browns, greys, beiges, desaturated mid-tones, daylight sky colours.

## Typography

- **Orbitron** 500/700/900 – HUD numbers, timer, labels, floating numbers, card titles. https://fonts.google.com/specimen/Orbitron
- **Monoton** 400 – big screen titles (MIDNIGHT, PAUSE); its multi-stroke letters look like bent neon tubes. https://fonts.google.com/specimen/Monoton
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
Floating numbers are baked into a digit atlas (Orbitron 46 px): blur 6 px + blur 2 px glow fill (`#2fd8ff` normal, `#ff6a1a` emphasised), a 6 px dark edge stroke (`rgba(3,8,26,.92)`), then the fill (`#f4fdff` normal, `#ffe58a` emphasised, weight 900). Rendered 8.6 u tall (12.5 u for the emphasised variant) with a pop-in scale.

## Rendering technique

1. **Sprite pass functions.** Each drawable is a function `pose(ctx, pass, phase)` that issues the same paths twice: `pass = 'full'` and `pass = 'glow'`. Two helpers decide what each pass does:
   - `tube(ctx, pass, col, lw)`: full → stroke `col` at `lw`, then a core stroke at `lw*0.36` in `mix(col, white, 0.62)`. Glow → stroke `col` at `lw*1.8`. Options: `hot:false` (no core – for detail lines), `glow:false` (no halo), `gw` (halo width factor), `glowCol`, `hotCol`.
   - `fillIn(ctx, pass, fillCol, glowCol)`: full → near-black fill; glow → optional glowing fill (faces, eyes, cores).
2. **Bake** (`bakeSet`, K = 4 px/unit, round caps/joins): render both passes into separate canvases, then composite onto a third: glow pass with `filter: blur(2.2u*K px)` at alpha 0.7, (extra copy at 0.7*(glowA−1) if glowA > 1.2), glow pass with `blur(0.6u*K px)` at alpha 0.6, then the sharp full pass at alpha 1. The large creature uses wide = 2.6, gems wide 1.6/tight 0.5, lanterns wide 3.0/tight 0.8/glowA 1.5.
3. **Character variants** (`makeSprite`): for every frame bake right-facing, mirror it for left-facing, and create silhouette copies of the *sharp* pass tinted white `#ffffff`, magenta `#ff2a7a` and cyan `#2ae8ff` (via `source-atop` fill). These are the impact flash and chroma split.
4. **Props** (`bakeProp`): baked like sprites, plus an elliptical floor pool and a floor reflection (see Props). Hologram props get 0.55 u gaps punched out every 2.2 u with `destination-out`.
5. **Ground** is baked per 256 u chunk (resolution up to 2.5 px/u), incrementally with a generator. See World and ground.
6. **Per frame**, draw order (world space, 360 u visible vertically): ground chunks → contact pools → additive ground overlay (main-character light spill, lantern glows) → props and characters y-sorted (one `drawImage` each; additive flash copies on top during an impact) → projectiles (additive) → particles (collected into buckets and flushed as a few additive strokes) → floating numbers → screen glitch → display overlay (scanlines + vignette + fringe, cached per resolution).
7. **No pixel snapping, no low-res buffer.** Smooth scaling of the 4 px/u sprites is fine; at 1080p one unit is 3 px, so sprites are slightly supersampled.

## World and ground

The floor is "a city map of light seen at night": dark districts, roads that lead somewhere, lakes with lit shores and a few plazas. It stays near-black (< 15 % brightness) so everything standing on it outshines it.

1. **Fields.** Per world point sample 4 fbm district fields (2 octaves) with domain warp `q = fbm(x/1150, y/1150) − 0.5`, `X = x/1050 + q·1.3`; a water field `fbm(x/560 …, 3 oct)`; a slow intensity field `fbm(x/240)`; and a **road field** `fbm(x/780 + q·0.6, …, 2 oct)`. Sample on a 4 u grid with a 2-cell margin so chunks match.
2. **Base colour.** Softmax (temperature 0.012) of the 4 fields mixes violet `rgb(8,8,32)`, teal `rgb(3,15,21)`, magenta `rgb(30,4,22)`, copper `rgb(14,9,15)`; water (`smoothstep(0.625, 0.645, wat)`) mixes in `rgb(2,9,30)`. Brightness `(0.72 + 0.5·intensity)·(1 − 0.3·roadNear)`. Drawn as a tiny ImageData scaled up with smoothing. Fallback `#06050f`.
3. **Pattern districts.** Each district pattern is drawn on a scratch canvas, masked (`destination-in`) by weight × `(0.16 + 0.84·smoothstep(0.38, 0.74, intensity))` × `(1 − 0.8·roadNear)` and added with `lighter`. So patterns bloom only inside clusters, calm gaps lie between them and road shoulders stay clean:
   - *Violet grid*: 8 u lines `rgba(120,80,255,.09)`; every 32 u a 4 px halo + 1 px `rgba(165,115,255,.34)`; a 5.2 u cross `rgba(225,200,255,.6)` every 64 u.
   - *Teal hex*: radius 9 u, 1 px `rgba(40,215,195,.24)`; 7.5 % of cells lit with an inner hex.
   - *Magenta halftone*: staggered 6 u grid, dot radius 0.42–1.67 u by noise, `rgba(255,70,200,.36)`.
   - *Copper circuit boards*: traces in 26 u cells with a chance of `0.06 + 0.5·smoothstep(0.42, 0.68, fbm(x/340))` – boards, not an even carpet – 2–3 segments turning ±45°, 0.6 u `rgba(255,150,60,.27)`, pads, vias and chips with pins.
   - *Water*: 1 px lines every 2 u `rgba(40,130,255,.24)` plus moonlight glints.
4. **Light roads.** The 0.5 iso-line of the road field (marching squares, cells inside water skipped, so roads end at the shore) is stroked four times: additive shoulder 17 u `rgba(110,80,255,.045)`, kerb 11.6 u `#3a2f86`, surface 10.4 u `#06050d` (leaving two 0.6 u kerb lines), centre line additive 2.4 u `rgba(255,150,70,.07)` + 0.5 u `rgba(255,190,120,.34)`. Roads are 300–500 u apart and meander for thousands of units.
5. **Floor plazas** (the only ground decals, `lighter`): one candidate per 360 u cell (55 %), never within 34 u of a road or on water: a landmark 18–26 u (target rings with ticks, clock face at 23:59, carved pumpkin, crescent moon with stars) stroked 5 u / 1.8 u / 0.55 u at 36 %, ringed at r + 9..13 u by 6–9 glyphs that alternate between two types (cross, moon, star, diamond, triangle, ring, chevrons, bat, rune), every third one brighter. No dust, no evenly sprinkled glyphs.
6. **Contours.** Marching squares on `field_i − max(other fields)` (skipping water) and on the water field at 0.635 and 0.657; each stroked three times additively (6 u at 5 %·k, 2 u at 15 %·k, 1.15 px at 62 %·k, colour mixed 35 % to white). District borders k 0.4 (quiet), shores k 0.95 (the strongest ground light) plus an inner shore line k 0.32.

Scale: districts are 300–800 u across; a screen shows 2–3 districts, usually one road and often a shore.

## Characters

All characters are outline drawings made of neon tubes over near-black glass fills: one dominant outline colour per type with a hot near-white core (36 % width, colour mixed 62 % to white), thinner interior details (0.3–0.7 u) without a core, round caps and joins, a 1.8× halo baked once. Poses are **computed** from a few parameters (two-bone IK limbs, travelling waves for cloth, leaves and tails) and baked into frames. Halo strength (`glowA`) ranks the cast: main character 1.25, fast creature 1.0, large creature 0.9, small creature 0.85.

**Main character** (feet at 0,0, ~18 u wide, ~31 u tall to the stem tip, faces right) – a pumpkin-headed courier:
- **Head**: pumpkin path rx 7.6 × ry 6.3 at (0.5, −21.9), radius `1 + 0.035·cos 6t − 0.08·max(0,−sin t)^14`, fill `rgba(30,9,2,.97)`, outline `#ff7a1a` 1.35 u with hot core; two side ribs `rgba(255,110,30,.55)`; a dim magenta rim `rgba(255,58,214,.55)` on the lower-left (shadow side of the upper-right key light); stem `#9cff4a` 1.15 u with a curled 0.5 u leaf. The head rotates around the neck (tilt) and bobs half a beat after the body.
- **Face**: triangle eyes and a zig-zag grin filled with `#fffbe2 → #ffe08a → #ffa526`, glowing `#ffb000`; the hurt pose squints (chevron eyes, round mouth). A candle glow (`#ffb84a`, flickering) sits behind it at draw time – the warmest point on screen.
- **Jacket**: a short tunic from narrow shoulders (±2.9 u) flaring to a hem (±4.4 u) whose corners swing late, fill `rgba(26,10,3,.96)`, outline `#ffae35` 1.0 u, a dim zip and hem band `rgba(255,170,70,.42)`; a satchel `#ffcf7a` on a diagonal strap.
- **Legs**: hip → knee → ankle by two-bone IK (thigh 4.3, shin 4.0 u, knee bends forward), 1.15 u tubes; heeled boots (heel to toe 3.6 u, dark fill, 0.75 u outline) pitched around the ankle. Far limbs `#c06a18`, near limbs `#ffae35`.
- **Arms**: shoulder → elbow → hand by IK (2.9 + 2.9 u, elbow bends back), 1.05 u, a 0.95 u mitten hand.
- **Scarf**: front wrap `#ffe14a` 1.75 u and two tails (4 and 3 links of ~2.7 u) whose link angles follow a travelling wave – each link 0.95 rad behind the previous – and curl towards the ground; fringed ends.
- **Frames**: 8 walk, 8 idle, 3 dash (launch / streak / brake), 1 hurt; box 17 u left/right, 38 u up, 6 u down (dash 21 u).

**Small creature** (~22 × 27 u) – a magenta root bulb: bezier bulb (−8.9..8.9 × −20..−4.2) outlined `#ff3ad6` 1.25 u, filled `rgba(32,4,34,.96)`, a "liquid level" cap tinted `rgba(170,40,215,.42)` above a wavy violet line and an indigo shadow crescent on the lower left; a violet `#b066ff` crown of three leaves; lilac `#d77bff` root legs (far leg `#a95ccc`); two root arms – the near one reaches forward with a small claw; a dangling root tail; slanted triangle eyes `#ffeafb` (blink: two thin lines) and a jagged mouth that opens on each step. 8 poses + 8 blink poses.

**Fast creature** (~22 × 30 u) – a hollow-eyed wisp: a dome head (r 6.6 u) and a long rippling tail, translucent fill `rgba(6,26,44,.58)` with an inner cyan rim, outline `#6ff4ff` 1.15 u; black oval eyes with white pupils (blink: flattened ovals), a breathing oval mouth, two three-fingered claws that reach forward and retract, two twinkling frost sparkles. 8 poses + 8 blink poses + 2 glitch frames.

**Large creature** (~40 × 55 u, scaled 0.92) – a faceted root golem: 12-point crystal body in acid violet `#b44dff` 1.4 u over `rgba(22,6,38,.97)`, 11 facet lines `#7a38d6`, a tinted top band, an indigo shadow arc on the left, hollow tube arms (5.4 u violet around 3.3 u dark) ending in hex fists, block legs, a crown of three jagged leaves, toxic-green `#8dff2a` cracks around a pulsing hex core (`#fbfff0 → #c8ff6a → #45c414`) and two slit eyes. 8 poses.

Readability rules:
- Silhouette first: pumpkin + scarf + satchel, bulb + leaf crown + root arms, dome + tail + claws, crystal + crown + fists – each type identifiable as a black shape.
- Detail hierarchy: calm dark glass bodies, a few medium lines, small bright details clustered on faces.
- Dark glass fills keep crowds as stacks of opaque shapes; characters are never drawn with `lighter`.
- Facing is a mirrored copy; flash/chroma copies are white `#ffffff`, magenta `#ff2a7a` and cyan `#2ae8ff` silhouettes of the sharp pass.
- Contact pools: main character orange dark 0.6 / rim 0.26, rw 14; creatures radius × 1.4 (fast × 1.2).

## Props

Props use the same tube + glass logic in their own dimmer hues – lavender, pink, teal, lamp blue, shore blue, never creature colours – and are baked at `glowA` 0.6–0.85 so they sit below the actors in the light hierarchy. Only lamp bulbs, carved faces, orbs and fruit carry full light.

- **Construction**: closed outline 0.85–1.0 u with hot core, near-black fill `rgba(12,8,30,.95)`, details 0.35–0.6 u without core. Fake 3D: an outline copy offset (1.9, −1.4) u in `#6a5ad0` (pylons `#9b3a9a`) plus corner links.
- **Gravestones** (3): round-topped stone with engraved cross, a cross on a mound, a tilted small stone with text lines – lavender `#c3b5ff`.
- **Fences** (2): an intact run of four pointed pickets and two rails; a broken run with a leaning picket, a sagging rail and a fallen picket.
- **Street lamps** (2): a crook lamp and a twin-arm road lamp, `#7fd8ff` pole with two collar rings, dark hood, warm bulb `#fff1c6` glowing `#ffbe55`.
- **Carved pumpkins** (2): single or a pair, `#ff8a2a` with ribs, stem and a gradient face.
- **Pylons** (2): a tall obelisk with three cyan bands, tip orb and floating halo; a squat beacon with twin flares.
- **Holo trees** (3): recursive branches (depth 4, trunk 13 u or 10 u), trunk `#38f5d6`, mid branches `#2fd6bd`, twigs `#23a894` without core – the big shape is bright, the fine ends fade; orange fruit on 28 % of tips; scan gaps.
- **Sign posts** (3): pink-framed board with a pumpkin + arrow, moon + stars or warning icon.
- **Shrine**: violet plinth with a hologram of the leafy bulb and a cyan halo.
- **Shore reeds** (3 clusters of 7–11 stems): thin `#2a7fd6` stems (0.45 u, no core), a few hot `#8fe6ff` seed tips and leaf blades – small bright accents along the waterline.
- **Floor pool + reflection**: every prop bakes a radial ellipse in its hue (lavender `#9d8cff` r 12 at 0.22, lamp `#ffb84a` r 18–20 at 0.4, pumpkins at 0.34, reeds `#3a8cff` at 0.14) and a flipped reflection at 25–40 % height fading from 30 %.
- **Composition** (props are placed by rules, not sprinkled): road lamps and a few signs stand 7.5–12 u from the road centre line; reeds only within 9 u of a shore (distance from the water-field gradient); trees in groves of 2–4 around a seed tree; graves in yards of 3–5 with a fence in front; everything else keeps 22 u off the roads and picks its kind by district (yards, fences, shrines on the violet grid; groves and pylons on teal; pumpkins, trees and fences on halftone; pylons, shrines and pumpkins on circuit boards).
- **Ambient life**: lamps, signs and pylons double-blink (50 % / 78 %) on a per-prop clock; holograms breathe 84–100 %; trees sway with a slow shear (±0.025, 0.7 rad/s, phase by position) pivoting on the base.

## Effects and particles

All effects are additive (`lighter`), use the source's own colours plus white, and are **layered**: core flash → main shape → debris → lingering residue, each with its own lifetime.

- **Particle kinds**: sparks are lines along their velocity (`min(9, 1 + speed·0.035)·size·0.5`); fragments are rotating short lines; *star flashes* are four-point stars that snap open (`r·(0.35 + 0.65·√e)`) and die in 90–160 ms; *rings* are ellipses (42 % for floor rings, 100 % in the air) eased out cubic; *data bits* are tiny squares that rise (negative gravity) and stutter out in their last half; *scorches* are thin floor ellipses that tighten and fade over ~1 s; *streaks* are short vertical light lines.
- **Batching**: particles go into buckets keyed by colour + quantised alpha (4 levels) + width class (0.45 / 0.8 / 1.3 u); each bucket is one path stroked twice (3.2× width at 28 %, then 1× at full). The batch is flushed after the last visible particle of the frame, so effects also render when another style draws the overlays.
- **Projectile**: baked trail (24 × 2.4 u orange wedge with white inner wedge, blurred 0.9 u, re-stamped sharp) at 85 % behind a seed sprite `#ff9a2e` that flips to fake spin; 2 launch sparks.
- **Impact**: white star 6 u (90 ms) → white ring 1.5 → 8 u (150 ms) → 4 sparks fanned around the knock-back direction → 1 rising bit in the target's second colour. The target squashes and leans (see Motion) under a white silhouette flash with magenta/cyan copies ±1.6 u.
- **De-rez death** (350 ms): white squashed silhouette (0–22 %) → 5 bands (large: 7) that shear apart with quadratic ease-in and dissolve top-first, alternate bands with magenta/cyan copies (14–86 %) → a hot floor line 2.4r wide that shrinks to a point (50–100 %). Burst on top: star 12 u (large 22 u), 7 / 9 / 20 line fragments in the creature's two colours with gravity 170, 4–8 white sparks, floor ring 0.6r → 3r, 3–8 rising bits, a scorch ellipse (0.95 s; large 1.4 s). The large creature adds a 5r toxic ring, an air ring, 12 green dots and a 0.12 s screen glitch.
- **Warp-in** (450 ms): three dashed sigil arcs rotate and close in from 2.5r to 1.2r, a light column rises and fades, the body builds from the feet up behind a hot scan edge, then settles with an 8 % overshoot. Pools fade in with it.
- **Collectible gems**: octahedra, 8 rotation frames over 90°, translucent faces, white-core outline, lime `#c6ff3a` / cyan `#45f4ff`, baked floor glow; eased float; a rare four-point glint. Collect: ring 3 → 11 u (18 u large), vertical streak 16/26 u, 2–6 rising dots.
- **Orbiting lanterns**: carved pumpkin lanterns (`#ffb84a`, glowA 1.4) hanging from the handle as a pendulum, with an amber trail along their real recent path (up to 9 points, alpha rising quadratically to the head).
- **Fast-creature trails and glitch**: 2 after-images at 20 % / 9 %; 4 % of frames swap in a pre-baked glitch frame.
- **Dash**: launch/streak/brake poses, 4 after-images whose spacing grows with dash progress, orange ring 4 → 24 u, floor scorch, 8 sparks thrown backwards.
- **Celebration**: warm star 16 u, vertical beam 18 × 92 u, amber ring 6 → 70 u, lime ring 4 → 46 u, 22 rising sparks, 6 drifting lime bits.
- **Main-character impact**: pink star, 10 sparks `#ff2a7a`/`#ffae35`, pink ring and a 0.22 s glitch.

## Atmosphere and lighting

- **Pitch-black ambient, ranked emitted light.** Brightest: the main character (glowA 1.25, warm floor light, candle glow behind the face). Next: creatures (0.85–1.0). Then props (0.6–0.85, single hot accents). Faintest: the floor (patterns ≤ 0.35 alpha, district borders k 0.4) – except the shores, which carry the strongest ground line.
- **One key light** from the upper right: shapes get a dim cool rim on their lower-left (magenta on the pumpkin head, indigo on bulb and golem); far limbs are one shade darker.
- **No drop shadows.** Contact pools: a radial sprite with a dark core fading into a coloured rim, drawn as `2rw × 0.8rw`. Main character orange (dark 0.6, rim 0.26, rw 14), small creature magenta (0.5 / 0.14), fast creature cyan (0.2 / 0.12, pulsing with its hover), large creature toxic (0.55 / 0.16). Pools fade in during warp-in and out during death.
- **Light spill**: additive radial glow `#ff8a2a` at 40 % ± 4 % flicker (124 × 56 u) plus a tight amber core at 18 % under the main character; a 26 % amber pool under each lantern. Nothing else lights the floor.
- **Prop floor pools and reflections** make the floor read as glossy black glass.
- **Glow** is baked into sprites; never `shadowBlur` or `filter` at runtime (HUD icons are baked once).
- **Display overlay** (built once per resolution): 1 px lines every 3 px (4 px above 1100 px) at 12 %; radial vignette `rgba(6,0,18,0)` → `rgba(6,0,18,.3)` at 62 % → `rgba(2,0,8,.78)`; additive lens fringe in the outer 9 %: magenta `rgba(255,40,200,.10)` left, cyan `rgba(40,220,255,.09)` right.
- **Glitch**: 3–6 strips (4–28 px) redrawn shifted ±18 px plus a 6 % `#ff2a7a` wash – 0.22 s on a main-character impact, 0.12 s for a large creature, 0.4 s for the strongest event.
- **Flicker**: props double-blink on per-prop clocks, holograms breathe 84–100 %, pumpkins flicker 90 ± 10 %.

## UI

Panels are near-black translucent with a 1 px neon border and an outer glow; bars are skewed −22° and segmented every 25 px; numbers are Orbitron with gradient fills and glow. Choice cards stand over a CSS perspective grid (magenta 1 px lines, 64 × 34 px, rotateX(62deg)) with magenta corner brackets and a cyan border. Icons are drawn with the same tube logic (shadowBlur = size/9, line 4.6 px at 96 px icon size, 7.5 px when ≤ 48 px, a hot core at 36 %).

- **HUD panel**: horizontal gradient from deep magenta-violet to deep blue at 88 %, 1 px pink border, pink outer glow + faint cyan inner glow, Rajdhani 13 px text `#d8f8ff`.
- **Main bar**: 250 × 15 px, skewed −22°, pink border `#ff4fd8`, fill gradient magenta → coral → orange → gold, dark 2 px segment gaps every 25 px.
- **Secondary bar**: 12 px tall, violet border, fill cyan → mint → lime.
- **Badge**: dark `#0b0620` chip with a lime border and Orbitron 11 px text.
- **Counter**: Orbitron 800 24 px `#ffe6fb` with a magenta glow; the timer uses the gradient `.clock-time` style from Typography.
- **Card**: violet-to-navy gradient glass, 1 px cyan border at 62 %, faint inner violet glow, content centred; the title carries a short magenta neon rule under it (title → rule → body hierarchy); on hover it lifts 8 px and turns gold/orange.

```css
.hud-panel{background:linear-gradient(90deg,rgba(30,6,40,.88),rgba(6,10,30,.88));border:1px solid rgba(255,79,216,.75);
  border-radius:2px;box-shadow:0 0 14px rgba(255,60,200,.35),inset 0 0 10px rgba(80,220,255,.15);
  font:600 13px 'Rajdhani',sans-serif;color:#d8f8ff}
.bar{position:relative;width:250px;height:15px;transform:skewX(-22deg);background:rgba(22,4,26,.82);
  border:1px solid #ff4fd8;box-shadow:0 0 12px rgba(255,60,200,.6),inset 0 0 8px rgba(0,0,0,.9)}
.bar-fill{height:100%;background:linear-gradient(90deg,#ff2bd0,#ff5a6a 45%,#ff8a1f 80%,#ffc23a);box-shadow:0 0 14px rgba(255,100,60,.9)}
.bar::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 23px,rgba(10,2,14,.85) 23px 25px)}
.meter{position:relative;height:12px;background:rgba(8,4,22,.8);border:1px solid rgba(180,120,255,.7);border-radius:2px;
  box-shadow:0 0 10px rgba(160,80,255,.5),inset 0 0 6px rgba(0,0,0,.9)}
.meter-fill{height:100%;background:linear-gradient(90deg,#2af0ff 0%,#7dffb0 60%,#c6ff3a 100%);box-shadow:0 0 12px rgba(120,255,200,.8)}
.badge{padding:1px 9px;background:#0b0620;border:1px solid #c6ff3a;font:700 11px 'Orbitron',sans-serif;color:#eaffc0;
  letter-spacing:1px;text-shadow:0 0 6px #b6ff3a;box-shadow:0 0 10px rgba(198,255,58,.55)}
.counter{font:800 24px 'Orbitron',sans-serif;color:#ffe6fb;text-shadow:0 0 8px #ff3ad6,0 0 18px rgba(255,58,214,.55)}
.card{background:linear-gradient(170deg,rgba(60,20,104,.6),rgba(9,6,26,.94) 52%,rgba(5,14,32,.95));
  border:1px solid rgba(111,244,255,.62);border-radius:3px;
  box-shadow:0 0 14px rgba(60,220,255,.24),inset 0 0 22px rgba(150,70,255,.2),inset 0 1px 0 rgba(255,255,255,.18)}
.card:hover{transform:translateY(-8px);border-color:#ffd36b;box-shadow:0 0 28px rgba(255,160,60,.55),inset 0 0 30px rgba(255,120,40,.25)}
.overlay{background:repeating-linear-gradient(0deg,rgba(0,0,0,.16) 0 1px,transparent 1px 3px),
  radial-gradient(ellipse at 50% 42%,rgba(52,12,88,.6),rgba(3,2,12,.9) 72%)}
```

## Motion and animation

Smooth vector timing: poses are computed and baked (8 per cycle), then chosen by phase; squash, stretch and leans are applied at draw time as cheap axis-aligned scaling.

- **Walk** (main character, one cycle per 2.4 distance units): contact (0) – down (.125, body 0.85 u lower) – passing (.25) – up (.375, highest) – contact (.5) for each step: `bodyY = 0.85·sin 2a`. Feet: `x = ±3.5·cos a`, lift `2·max(0, ∓sin a)` on the swinging leg, toe pitch from −0.55 rad (push-off) to +0.3 (heel strike). Arms counter-swing ±0.62 rad with extra elbow bend on the forward swing. Overlap: head `+0.4·sin(2a − 1.1)` and tilt `0.04·sin(2a − 1.3)`, hem `0.7·sin(2a − 1.5)`, scarf links `0.26·sin(2a − 1 − 0.95·i)`. Slight 0.07 rad forward lean.
- **Idle** (8 poses over 3.2 s): breath lifts shoulders 0.32 u and the head 0.36 u half a beat later; a head-tilt fidget (0.085 rad) peaks at 62 % of the cycle; arms, hem and scarf drift on their own phases; the face's candle glow flickers on two beating sines plus noise, so it never loops visibly.
- **Dash** (0.2 s): launch crouch (lean 0.46 rad, body 1.3 u lower – the anticipation), streak (stretch 16 %, scarf streaming, legs trailing), brake (lean −0.14, scarf whipping over the top) with a landing squash; after-images spread as the dash progresses.
- **Hurt**: recoil pose (lean back 0.24 rad, arms up, squint) held while the flash lasts, 12 % squash, small knock-back offset, 18 Hz blink during invulnerability.
- **Small creature**: 8 poses at `anim·0.36`; bob 1.3 u, squash/stretch `0.065·cos 2a` (squash on contact), body rock ±0.08 rad, leaf crown `0.17·sin(2a − 1.3)`, root arms and tail on their own phases, mouth opens with each step.
- **Fast creature**: 8 poses at `1.45–1.95` cycles/s (per actor); tail ripples travel back (1.5 rad apart), claws reach and retract; hover = quick rise (38 % of the period) and slow settle, 2.2–4.2 u above the pool, squashing 5 % at the bottom.
- **Large creature**: 8 poses at `anim·0.22` on a warped phase (`p + 0.07·sin 4πp`) so each foot hangs and then drops; 4.5 % squash on impact, fists `1.6·sin(a − 0.7)` behind the legs, crown whips late; a toxic floor ring per footfall (quadratic fade, 13 → 31 u).
- **Blink**: 110 ms on a per-actor clock of 2.4–4.6 s (small and fast creatures).
- **Hit reaction** (all creatures): `squash = 0.15·e^(−13t)·cos 26t` for ~250 ms – a sharp squash, a stretch rebound and a settle – plus a lean of up to 0.24 rad in the knock-back direction.
- **Per-actor phase offsets** everywhere (seed-driven): walk phase, hover phase, blink clock, prop flicker, tree sway – a crowd never moves in lock-step.
- **Gems**: 8 frames at 1.6 cycles/s, eased float 1.6 u, glint 9 % of a 2.4 s period; projectiles flip-spin; floating numbers pop `1 + max(0, life − 0.78)·2.6`.

## Do and don't

Do:
- Bake the glow once per sprite (blurred fat-stroke pass + sharp pass) and only `drawImage` at runtime.
- Rank the light: main character brightest, creatures one step lower, props lower with single hot accents, floor faint.
- Give every primary line a near-white hot core at 36 % width; fill bodies with near-black glass of their own hue.
- Compute poses (IK limbs, travelling waves for cloth, leaves and tails) and bake 8 frames per cycle plus blink variants.
- Compose the floor: roads that lead somewhere, lamps along them, reeds on shores, groves and yards, detail in a few plazas.
- Layer every effect: star flash → ring/shape → debris → slow residue.
- Use `lighter` for light only: halos, particles, rings, floor glows, gems.

Don't:
- Use `shadowBlur` or `ctx.filter` per frame – it ruins performance.
- Let everything glow equally; bright floors or bright props flatten the hierarchy.
- Scatter dust, glyphs or traces evenly over the ground.
- Draw dark outlines, pure white outlines or unfilled wireframes.
- Animate with one plain sine on everything – use contact/passing poses, lag and eased hovers.
- Mix more than two hues + white in one effect.
- Draw characters themselves with `lighter` – crowds would white out.
- Use daylight colours, browns or greys.

## Implementation recipe

1. Set up a Canvas 2D scene with a world-space camera; pick a vertical view of ~360 world units and a main character ~18 × 30 u.
2. Copy the helpers from `starter.js`: `tube`, `fillIn`, `bake`, `ik`, the pumpkin path and the scarf chain.
3. Define your palette: background `#05040d`, then one hue family per subject type (main character warm orange/amber/yellow; creatures magenta, cyan, acid violet + toxic green; collectibles lime/cyan; props lavender/pink/teal/blue).
4. Write each character as `pose(ctx, pass, phase)` with feet at (0,0), facing right: compute joint positions (IK for limbs, travelling waves for cloth), then closed silhouettes → `fillIn(dark glass)` → outline `tube(col, 1.15–1.4)` → thinner detail tubes (`hot:false`) → glowing faces via `fillIn(fill, glowFill)`.
5. At load time bake 8 frames per cycle (walk, idle; blink variants for creatures; launch/streak/brake for the dash) with both facings and white/magenta/cyan silhouettes; set `glowA` per class (1.25 main character, ≤ 1 creatures, ≤ 0.85 props).
6. Bake props with a floor pool, a reflection and (for holograms) scan gaps; place them by rules (along roads, on shores, in groves and yards).
7. Build the floor per chunk: dark base, pattern districts masked by intensity and road distance, light roads from one iso-line, a few plazas, glowing contours.
8. Each frame: ground → contact pools → additive light spill → y-sorted sprites (axis-aligned `drawImage`, squash as scale) → additive flashes → projectiles → batched additive particles → numbers → glitch → cached overlay.
9. Effects: star flash, ring, debris lines, bits/scorch residue – each with its own life; death = flash → de-rez bands → floor line; warp-in = sigil → beam → build → overshoot.
10. HUD: Orbitron numbers with gradient + glow, skewed segmented bars, 1 px neon borders, Monoton titles.
11. Check readability with 200 creatures on screen and in greyscale; if it blooms out, lower `glowA` of the crowd, not of the main character.

## Code

The snippets below are the core techniques, cleaned up from the style module. `starter.js` in this folder contains all of them plus the main character, three creature types, gems, the procedural floor and a complete preview scene. The full reference implementation is [`../../js/styles/neon.js`](../../js/styles/neon.js).

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
// Usage: world-space draw of the main character with its feet as anchor
// const s = bakeSet(16, 38, 16, 6, (c, p) => heroPose(c, p, 0));
// ctx.drawImage(s.img, x - s.ax * s.w, y - s.ay * s.h, s.w, s.h);
```

```js
// Impact flash + chroma split from silhouette copies of the sharp pass.
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

```js
// Computed walk pose: contact – down – passing – up, two-bone IK legs, a scarf that follows a travelling wave.
function ik(ax, ay, bx, by, l1, l2, bend) { // bend -1: joint in front (knee), +1: behind (elbow)
  let dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1e-3;
  if (d > l1 + l2 - 0.02) { const k = (l1 + l2 - 0.02) / d; bx = ax + dx * k; by = ay + dy * k; dx *= k; dy *= k; d = l1 + l2 - 0.02; }
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  return [ax + dx * a / d - dy / d * h * bend, ay + dy * a / d + dx / d * h * bend, bx, by];
}
function walkPose(ph) {            // ph 0..1, two steps per cycle
  const a = ph * Math.PI * 2;
  return {
    bodyY: 0.85 * Math.sin(2 * a), // lowest just after each contact, highest at passing/up
    footA: [0.6 + 3.5 * Math.cos(a), -2 * Math.max(0, -Math.sin(a))],
    footB: [-0.4 - 3.5 * Math.cos(a), -2 * Math.max(0, Math.sin(a))],
    armA: -0.62 * Math.cos(a), armB: 0.62 * Math.cos(a),
    headY: 0.85 * Math.sin(2 * a) + 0.4 * Math.sin(2 * a - 1.1), // overlap: the head lands late
    scarf: (i) => Math.PI - 0.5 - 0.12 * i + 0.26 * Math.sin(2 * a - 1 - 0.95 * i),
  };
}
```

## Adapting it to your project

Keep fixed (this *is* the style):
- Near-black background and floor, colour only as light.
- The two-pass bake: line + hot core at 36 %, 1.8× halo blurred 2.2 u @ 70 % + 0.6 u @ 60 %.
- Dark glass fills, round caps/joins, line widths 0.3–1.4 u at a 360 u tall view.
- Additive effects in the source's colours + white, particles as lines, squashed floor rings.
- Scanlines, vignette, lens fringe.

May change:
- **Palette swap**: any saturated hues work if each subject family stays one hue and lines stay bright on black. Example "Tron" variant: main character cyan, creatures orange/red, collectibles white. Keep hot cores as `mix(col, white, 0.62)` and fills as the hue at rgb ≈ 20–32.
- **New character types**: start from a strong closed silhouette, add 2–3 protrusions and glowing eyes; give it an unused hue or reuse a family only with a very different silhouette and size.
- **New props**: closed outline + dark fill + one lavender/pink/teal tube, an offset back-edge copy for depth, a floor pool and a reflection; keep them dimmer than characters.
- **Floor**: swap the district patterns for your theme (city map, starfield, music staff, topographic lines) but keep them under 0.5 alpha and keep glowing borders.
- **Mixing with other styles**: the characters work on any very dark world; the world works under any bright line-art characters; the atmosphere (scanlines, vignette, fringe) can be laid over other dark styles.
- **Views**: side-view platformers work (draw ground edges as glowing contours, add the reflection trick to everything standing on the floor); puzzle projects can use the tube look for tiles.
- **Resolution**: keep K ≈ px-per-unit × 1.3–2. At 4K raise K to 8; on mobile 3 is enough. Blur radii are in world units × K, so they scale automatically.
- **Mood**: drop the glitches and fringe for a calmer "neon sign" look; drop Monoton for Audiowide titles if you want less retro.

## Performance notes

- Bake cost: each frame is 3 canvases + 2 blur filters + 3 tint copies + 4 mirrored copies. The module bakes ~70 frames (main character 20, small creature 16, fast creature 16 + 2 glitch, large creature 8, gems 16) and 22 prop variants at init. Bake lazily or in a generator if you have more.
- Runtime per character: 1 axis-aligned `drawImage` (2–4 when flashing or trailing); squash/stretch is just a scaled destination rect, a rotated transform is only used while a hit lean plays. Death bands cost 5–7 extra draws per dying creature.
- Particles: bucketed by colour/alpha/width – ~10–25 strokes per frame regardless of particle count; flushed after the last visible particle.
- Ground: baked per 256 u chunk at ≤ 2.5 px/u with a generator that yields between steps (fields, base, each pattern layer, roads, plazas, contours); roads reuse the marching-squares code on one extra noise field.
- Prop placement samples the noise fields a few hundred times per chunk (once, when the chunk is built).
- Measured against the previous version in the same session: play frame ×1.07, chunk build ×1.13, dense stage ×1.20.
- Avoid: runtime `shadowBlur`/`filter`, `lighter` on character sprites, per-frame gradients for many objects, hundreds of tiny props (merge them into clusters like the reed sprites).

## Copy-paste prompt

```text
Use the Neon Midnight art style for my project (Canvas 2D, procedural, no image assets):
- Background near-black #05040d; colour exists only as emitted light. At least 60 % of the screen stays black.
- Every sprite is neon tube line-art: each path drawn in a 'full' pass (line + a core at 36 % width mixed 62 % to white)
  and a 'glow' pass (1.8x width), the glow blurred once at load (2.2 + 0.6 world units). Never blur per frame.
- Rank the light: main character brightest (halo x1.25, warm floor light, candle glow behind its face), creatures one
  step lower, props lower (only bulbs/faces/cores fully lit), floor patterns at most 0.35 alpha.
- Bodies: closed silhouettes filled with near-black glass of their own hue; faces are the brightest fill; far limbs darker.
- Main character: pumpkin head (orange #ff7a1a), short flared amber #ffae35 jacket, satchel, IK legs with boots, a long
  two-tail yellow #ffe14a scarf on a travelling wave. Creatures: magenta root bulb with leaf crown and root arms,
  cyan wisp with claws and rippling tail, acid-violet #b44dff crystal golem with toxic #8dff2a hex core.
- Motion: 8 computed poses per cycle (contact/down/passing/up, counter-swinging arms, lagging head, hem and scarf),
  8-pose breathing idle with a fidget, launch/streak/brake dash with stretch and landing squash, blinks on per-actor
  clocks, damped hit squash (~250 ms), de-rez death (flash, shearing bands, floor line) and sigil warp-in.
- Floor: dark districts whose faint patterns (violet grid, teal hexes, magenta halftone, copper circuit boards) gather
  in clusters; meandering light roads with violet kerbs and a dim warm centre line, lamps along them; lakes with bright
  shores and reeds; a few plazas of landmark + glyph ring. No evenly scattered dust or glyphs.
- Effects additive in the source's colours + white, layered: star flash → ring → line debris → rising bits / scorch.
- Atmosphere: 1 px scanlines every 3 px, violet vignette, magenta/cyan lens fringe, short glitch on big impacts.
- UI: Orbitron numbers with gradient + glow, skewed segmented bars, 1 px neon borders, Monoton titles, Rajdhani body.
```
