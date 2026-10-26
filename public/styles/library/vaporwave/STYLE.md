# Vaporwave Sunset — Game Art Style Spec

> Pastel vaporwave plazas of pink marble, checkerboards and tiled pools under a sunset wash, with VHS fringes on every sprite.

A sunny 80s/90s vaporwave world seen from above. The floor is a plaza on a 32-unit block grid: rose marble slabs, lavender checkerboards, a deep purple pastel grid and mint terrazzo, separated by raised white trims, with stepped swimming pools (mosaic band, white coping) cut into it. Every character, prop and icon is a solid, gradient-shaded drawing with a deep-indigo outline, baked once together with a soft pastel bloom and a pink-left / cyan-right chroma fringe, as if played from a worn VHS tape. Palms, Ionic columns, marble busts, pink flamingos, a beige CRT monitor and floating gradient spheres, pyramids and iridescent rings dress the plazas. A sunset wash (peach at the top, violet at the bottom), scanlines, faint tape grain and a slowly rolling tracking band finish the picture; the interface is a kit of 90s OS windows with gradient title bars and chrome lettering.

## At a glance

| | |
| --- | --- |
| Family | Vector · Vaporwave |
| Mood | dreamy, nostalgic, sunny, ironic, chill |
| Best for | retro-themed arcade and arena games, chill exploration and collecting, lo-fi / synthwave-adjacent music projects, 90s-internet menus and promo art, satirical games |
| Renderer | Canvas 2D, fully procedural, no image assets |
| Pixel art | No – native resolution, sprites baked at 4 px per world unit |
| Complexity | 4/10 – closed paths + gradients + one shared bake; the craft is in the gradient ramps and a calm floor |
| Fonts | Monoton (titles), Rubik Mono One (chrome numbers, card titles), VT323 (body, labels, counters) |
| Key colours | `#2a1a4c` ink · `#ff5fc1` hot pink · `#ffd1ea` blush · `#fff27a` sun · `#b892ff` lavender · `#5ee7ff` cyan · `#8ff5d2` mint · `#fff5fb` marble |

## When to use it

Vaporwave Sunset is a variant of **Neon Midnight** (`neon`) and shares its core trick – the glow is baked into each sprite once instead of being computed per frame – but it flips almost everything else:

- **Light instead of dark.** Neon Midnight is ≥ 60 % near-black with colour only as emitted light; Vaporwave Sunset is ~70 % pastel (marble, checker, terrazzo, water) with one deep purple grid region for contrast.
- **Solid shapes instead of tubes.** Neon draws hollow glowing tube outlines over dark glass fills; here every subject is a filled, gradient-shaded shape with a deep-indigo outline and only a soft pastel bloom.
- **VHS instead of neon signage.** The signature detail is a pink/cyan chroma fringe baked into every sprite, scanlines, tape grain and a rolling tracking band – not hot white tube cores.
- **Different subjects.** Marble statues, columns, palms, flamingos, CRT monitors, low-poly dolphins and floating gradient shapes replace gravestones, pylons and holographic trees.
- **Daylight sunset.** Long violet shadows to the lower right and a warm-to-violet wash; neon has no shadows, only floor pools of light.

Good fits:
- **Retro-themed arcade and arena games** – outlined, gradient-filled subjects stay readable in crowds on the bright floor.
- **Chill exploration, collecting and lo-fi music projects** – the palette is calm and sunny, the motion soft.
- **Menus, title screens, promo art** with a 90s-internet / mall / OS-window flavour – the UI kit is half the style.
- **Satirical or meme-flavoured games** – busts in pixel sunglasses and one-eyed pyramids are part of the vocabulary.

Bad fits:
- Horror, grit or realism – everything is pastel and ironic.
- Night scenes or dark moods – use Neon Midnight instead.
- Naturalistic or historical settings – the marble and palms are props in a dream mall, not history.
- Projects that need subtle facial acting – faces are tiny and iconic (shades, one eye, glowing slits).

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Ink indigo | `#2a1a4c` | All outlines, text strokes, UI borders, hard offset shadows |
| Hot pink | `#ff5fc1` | Main character jacket, small creature, grid lines, title bars, rings |
| Bubblegum | `#ff9ad5` | Mid pink of gradients, grid lines, flamingos |
| Blush | `#ffd1ea` | Light end of pink gradients, bellies, highlights |
| Peach | `#ffc1a1` | Warm accents, palm trunks, confetti |
| Sun yellow | `#fff27a` | Top of the sunset sun, sunglasses reflection, emphasised numbers |
| Sunset amber | `#ffb36b` | Middle of the sunset sun, warm bloom |
| Lavender | `#b892ff` | Side faces, shadows on pink subjects, title-bar middle |
| Lilac | `#dccbff` | Pale violet panels and fills |
| Violet | `#7a4fd0` | Dark pyramid faces, jacket hem, creature feet |
| Dusk violet | `#4b2a86` | Cast shadows (as rgba(75,42,134,·)) |
| Mint | `#8ff5d2` | Palm fronds, laurel wreath, small collectibles |
| Teal | `#3fd8c8` | Jacket band, dark end of palm fronds |
| Cyan | `#5ee7ff` | Fast creature, hair, statue eyes, grid crosses |
| Aqua | `#1fb2e0` | Deep water, iris shading |
| Marble white | `#fff5fb` | Statues, columns, busts, trims, pool coping |
| Marble shade | `#c9b0ee` | Shadow side of marble |
| Skin / shade | `#ffcfb0` / `#f2a58c` | Main character face and hands |
| Fringe pink / cyan | `#ff3fae` / `#2fe0ff` | The baked chroma fringe, glitch flashes, tracking lines |
| Rose marble | `#ffdcee` | Marble slab base, veins `#c76aa8` (lilac slabs `#eee2ff`/`#8a62c8`, peach slabs `#ffe6d8`/`#cf7f90`) |
| Checker | `#fff0f8` / `#cdb3f7` | Light / dark squares |
| Grid purple | `#6d49b8` | Pastel grid base |
| Terrazzo mint | `#c6f4e3` | Terrazzo base |
| Pool water | `#93f1ff` → `#62dcf7` → `#2399d6` | Shallow → deep; mosaic band `#2f63d8` + `#ff7fcf` |

Palette rules:
- **Pastel first.** About 70 % of the screen is light; one deep grid-purple region per screen gives contrast.
- **Indigo, not black.** Every subject has a `#2a1a4c` outline; black and grey never appear.
- **Gradient every surface**, near-white tint → base hue → deeper hue, lit from the upper left. Flat fills only for small details and low-poly facets.
- **Fixed fringe direction:** pink on the left edge, cyan on the right edge, for every sprite and icon.
- **Hue families per subject:** pink/peach main character and small creatures, cyan/lavender fast creatures, white/lilac marble statues, yellow → pink suns.
- Forbidden: browns, greys, olive/khaki. Pale yellow strokes on mint or peach turn khaki – use pink or cyan rings there.

## Typography

- **Monoton** 400 – big panel titles, pause and end screens. Its multi-line letters read like chrome mall signage. https://fonts.google.com/specimen/Monoton
- **Rubik Mono One** 400 – chrome numbers (timer, floating numbers), card titles, the style name plate. https://fonts.google.com/specimen/Rubik+Mono+One
- **VT323** 400 – body text, labels, counters, hints: a VHS on-screen-display / terminal feel. https://fonts.google.com/specimen/VT323

```css
/* chrome numbers: sky gradient above a hard horizon, sunset below */
.chrome{font:400 40px/1.05 'Rubik Mono One',sans-serif;letter-spacing:2px;
  background:linear-gradient(180deg,#ffffff 0%,#c4f6ff 30%,#5ee7ff 47%,#2a1a4c 50%,#7a4fd0 54%,#ff5fc1 70%,#ffe0f2 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-stroke:1px #2a1a4c;
  filter:drop-shadow(3px 3px 0 #2a1a4c) drop-shadow(0 0 12px rgba(255,95,193,.7))}
/* panel title with a VHS colour split */
.title{font:400 66px/1 'Monoton',cursive;letter-spacing:4px;color:#fff;
  text-shadow:-4px 0 #2fe0ff,4px 0 #ff3fae,0 6px 0 #2a1a4c,0 0 30px rgba(255,95,193,.8)}
/* labels: white VT323 with a small pink/cyan split */
.label{font:400 20px 'VT323',monospace;letter-spacing:6px;color:#fff;
  text-shadow:-2px 0 rgba(255,63,174,.85),2px 0 rgba(47,224,255,.85)}
```

Floating numbers are baked into a digit atlas once the web font is loaded (Rubik Mono One 46 px): a 9 px ink stroke and a hot-pink fill offset 3 px down-right (the hard shadow), then a 7 px ink stroke and the chrome gradient fill (`#ffffff → #9ff0ff | #4b2a86 → #ff7fcf → #ffe8f6`, hard horizon at 50 %). The emphasised variant is gold chrome (`#fffbe0 → #fff27a | #c0399e → #ffb36b → #fff2b0`) over a cyan shadow. Drawn 9.5 u tall (13 u emphasised) with a pop-in.

## Rendering technique

1. **One draw function per sprite.** `pose(ctx, phase)` draws closed paths in back-to-front order: each part is filled with a gradient, then outlined in ink (`fs(ctx, fill, lw)`). Limbs are polylines stroked twice (`limb`: ink at width + 1.6, colour at width). No separate glow pass.
2. **Bake** (`K = 4` px per world unit, round caps/joins). Render the sharp art into a canvas `full`, then compose a second canvas:
   - bloom: `tint(full, bloomColour)` with `filter: blur(2.2 u·K)` at 45–90 % alpha (pink for warm subjects, cyan, lavender, mint or amber per subject);
   - chroma fringe: `tint(full, #ff3fae)` drawn 0.5 u to the left and `tint(full, #2fe0ff)` 0.5 u to the right at 80 %;
   - the sharp art on top.
   The fringe peeks out only at the left and right edges, so it reads as a VHS colour split without any per-frame cost.
3. **Characters** (`makeSprite`): bake right-facing art, mirror the *sharp* art for left-facing and compose each side separately (the fringe stays pink-left / cyan-right). Keep white, pink and cyan silhouettes of the sharp art for flashes, afterimages and the switch-off effect.
4. **Props** (`bakeProp`): bake like sprites and also bake a **long shadow**: the sharp silhouette tinted `#4b2a86`, mapped with `setTransform(1, 0, −0.62, −0.28, 0.62·base, 1.28·base)` (each point at height h above the base moves 0.62·h right and lands 0.28·h below the base), blurred 0.6 u. Floating props get no baked shadow.
5. **Ground** is baked per 256 u chunk at up to 2.5 px/u by a generator (yields between layers). Patterns that must line up across chunks are world-anchored canvas patterns (`pattern.setTransform(scale)`), so they never seam.
6. **Per frame** (360 u visible vertically): ground chunks → screen-blended pink light under the main character and amber light under orbiting objects → shadows (prop long shadows, actor ellipses) → props and characters y-sorted (one `drawImage` each; flash copies on top during a hit) → orbiting objects → projectiles → particles (batched into a few paths) → floating numbers → short glitch strips on big impacts → cached display overlay + tracking band.
7. **No pixel snapping and no low-res buffer.** Sprites are slightly supersampled at 1080p.

## World and ground

The floor is "a dream shopping-mall plaza at sunset", built from crisp 32-unit blocks.

1. **Regions.** For each 32 u block sample at its centre: domain warp `q = fbm(x/1300, y/1300) − 0.5`, `X = x/860 + 1.4·q`, then four 2-octave fbm fields; the largest wins (`argmax`). Plazas are 300–700 u wide with stair-stepped borders. Block values are computed with a one-block margin so neighbouring chunks agree.
2. **Rose marble slabs** (one per block). Fill with a tileable marble texture (256 px = 128 u): veins are iso-lines `1 − smoothstep(0, 0.04, |n − 0.5|)` of a domain-warped tileable fbm, plus thinner secondary veins (`0.025`) and a cloudy two-colour base. Variants: rose `#ffdcee/#f5b8da` veins `#c76aa8` (68 %), lilac `#eee2ff/#cfb8f6` veins `#8a62c8` (22 %), peach `#ffe6d8/#f8c2b6` veins `#cf7f90` (10 %). Bevel: white 0.7 u on the top/left edge at 75 %, violet `rgba(122,60,150,.28)` 0.8 u bottom/right. 7 % of slabs get a diamond inlay of a contrasting marble with a white edge and a cyan dot.
3. **Checkerboard plazas.** 16 u squares, `#fff0f8` and `#cdb3f7`, two dark squares per block.
4. **Pastel grid.** Base `#6d49b8`; 8 u lines `rgba(255,154,213,.3)` 0.4 u; 32 u lines drawn twice (2.6 u `rgba(255,95,193,.28)` glow, 0.65 u `#ff9ad5` core); cyan `#5ee7ff` crosses (6 u) every 64 u. Drawn over the whole chunk and clipped to the grid blocks.
5. **Memphis terrazzo.** Base `#c6f4e3`; chips: on a 5.2 u jittered grid, 42 % chance, irregular 3–5-gons r 0.4–1.25 u in `#ffa8dc #c2a2ff #7fe4f5 #ffc9ae #f4fffb #ff7fcf`, 6 % `#8a64d8`. Rare (58 u cells, 30 %) memphis marks 1.0 u thick: zig-zags, half circles, triangle outlines in hot pink, violet or aqua.
6. **Gloss.** Marble and checker get soft diagonal white light bands (tileable, period 256 u, ≤ 20 % alpha) – the floor looks polished.
7. **Decals.** White four-point sparkles (46 u cells, 40 %, r 1.6–2.8 u) except on the grid, which gets cyan wire circles, triangles and sparkles. Landmarks (420 u cells, 60 %, r 15–22 u, only where all of it lies in one region and no water is near): on marble/checker a **striped sun inlay** (white rim r + 3.4 with 16 pink rays, a yellow → amber → pink → magenta disc with four white bands in the lower half); on the grid a wire sun (cyan ring with glow, pink horizontal lines); on terrazzo a blush memphis circle with an aqua triangle.
8. **Trims.** On every block edge between two regions: a violet shadow strip 1.1 u wide offset 1.4 u to the right/below, then a white `#fff6fb` strip 2.8 u wide centred on the edge (ends extended by 1.4 u so corners close), lilac seams every 16 u.
9. **Pools.** 16 u cells are water where `fbm(x/420, y/420, 3 oct) > 0.625` (never near the start). Depth = Chebyshev distance to the nearest dry cell (up to 4), coloured `#93f1ff #62dcf7 #40c6ee #2cafe2 #2399d6`, written into a tiny one-pixel-per-cell image and drawn upscaled with smoothing (soft depth gradient), clipped to the water cells. On top: a caustic web (warped Worley cell edges, 64 u period, 55 % white), short white and blush wave glints, a mosaic band of 1.7 u tiles alternating `#2f63d8` / `#ff7fcf` 1.7 u inside each edge, a violet coping shadow (4.6 u, 22 %) inside the north and west edges, and a white `#fffafd` coping 3.4 u wide straddling every edge with lilac seams every 8 u.

Scale: a 1600 × 900 view shows two or three floor types, one trim line and often a pool.

## Characters

All characters are chunky sticker-like drawings: gradient fills lit from the upper left, deep-indigo outlines (silhouettes 0.85–1.0 u, faces 0.4–0.6 u), a bloom in their hue and the pink/cyan fringe. Each type owns one hue family and a very different silhouette (tall figure, triangle, long horizontal fish shape, huge statue).

**Main character** (feet at 0,0, ~18 u wide, ~34 u tall, faces right) – a cool figure in wayfarer sunglasses:
- **Head**: circle r 5.9 at (0.8, −23.3), radial gradient `#ffe8d6 → #ffcfb0 → #f2a58c` from the upper left; ear ellipse 1.3 × 1.8 at the back.
- **Hair**: a tall flattop (top at −33.9) with rounded corners, sloping up to the front, a fringe edge over the forehead and a sideburn; vertical gradient `#d4fcff → #5ee7ff → #9a8cff → #7a4fd0`; three faint comb lines and one white shine.
- **Sunglasses**: wayfarer shape across the face (−0.8 … 6.9 u), gradient `#1d1040 → #5b2a9a → #ff5fc1 → #fff27a` (a sunset reflected in the lenses), two white glints, temple arm to the ear. A small smirk.
- **Jacket**: trapezoid torso −17.8 … −8.4, pink gradient `#ff9ae0 → #ff4fb4`, clipped colour blocks: a teal → cyan diagonal band and a violet hem band; white collar triangle, faint zipper.
- **Limbs**: arms 2.7 u hot pink with a violet cuff and skin hands r 1.3; legs 3.0 u indigo (`#4a3699` front, `#33246e` back), white rounded sneakers 5.4 × 2.7 u with a pink stripe. Back limbs are darker.
- **Frames**: 8 walk frames, idle, dash (rotated 0.24 rad, arms swept back, legs spread). Baked box 16/40/16/6 u (dash 20/40/22/6).

**Small creature** (~18 × 18 u) – a one-eyed pyramid on two feet:
- Three-quarter pyramid: apex (0.4, −18.2), base corners (−8.8, −2), (4.4, −0.6), (9.2, −4.6). Front face gradient `#fff0f8 → #ff9ad5 → #ff5fc1` with two yellow sunset stripes near the base and a white highlight sliver along the left edge; side face `#d7c2ff → #b892ff → #7a4fd0`.
- One big eye (white ellipse 3 × 2.5, cyan → aqua iris r 1.55, ink pupil, white glint) and an ink brow. Two violet ellipse feet.
- Two baked frames (open, blink). Hops at runtime: up to 5.5 u, squash on landing.

**Fast creature** (~31 × 13 u) – a low-poly bottlenose dolphin:
- Flat facets around three spine points: cyan back facets `#a8f4ff #7eeeff #5ee7ff #49cdf2 #3fb7ec`, blush/lilac belly facets `#fff0f8 #ffd1ea #f6c0ee #e2c6fb`, violet tail and flukes `#8a68ea #6c4bd2`; facet seams in ink at 28 %; outline 0.85 u.
- Short beak with a mouth line, round melon, curved dorsal fin (gradient cyan), small violet pectoral fin, ink eye with a glint.
- 6 tail-beat frames; floats 3 u above its shadow and bobs.

**Large creature** (~46 × 60 u) – a walking marble statue:
- Torso: broad shoulders tapering to the waist, marble gradient `#ffffff → #f6ecfb → #dcc8f2 → #c2a6ea`, a pink sash diagonally across, faint pec and ab lines, 1.0 u outline.
- A broken chunk at the left shoulder shows a dark `#3a2470` core with a cyan wireframe; glowing hot-pink cracks with a white core across the chest.
- Arms: thick marble limbs (5.2 u, 2.0 u ink border) with a white highlight stroke and round fists. Legs: fluted column drums on plinths.
- Head: marble ellipse 7.4 × 8.4 with a ring of curls behind and a row in front, a mint laurel wreath, brow line, glowing cyan eye slits with a soft cyan halo, nose and mouth lines.
- 8 walk frames, bloom lavender, blur 2.8 u, fringe 0.6 u.

**States** (all from the baked silhouettes):
- *Appear* (0.45 s): like a CRT switching on – the sprite opens vertically from 5 % to 100 % height and narrows from 135 % to 100 % width around its centre, a white line across it, a white-out fading, a ring on the floor in the type colour.
- *Hit*: white silhouette at the flash strength; while > 45 %, pink and cyan copies 1.8 u to each side.
- *Disappear* (0.35 s): like a CRT switching off – squash to a line (ease-in), widen 40 %, white-out, pink/cyan copies drifting apart; then a shrinking white line with pink/cyan edges.
- *Hurt* (main character): blink at 18 Hz, white flash and a 2.4 u pink/cyan split.

## Props

All props are baked like characters (gradient fills, ink outline, bloom 40 %, fringe). Standing props carry a long violet shadow (see Rendering technique) drawn at 34 % before anything else, so it never covers a character.

- **Palm** (two variants, ~60 u tall): trunk of 11 flared segments along a quadratic curve (peach `#ffe0cc → #e5917f` or lilac `#e9dcff → #9f7fe0`), a crown of 11 serrated fronds (spine curve with alternating blade widths, gradient mint → teal or blush → hot pink), three coconuts. Sways with a ±0.03 shear. Often in pairs.
- **Ionic column** (~39 u): plinth, fluted shaft with a cyan rim line on the left and a pink one on the right, abacus and two volutes. **Broken column**: jagged top at −21 … −24 u, a fallen drum lying to the right, a chip of rubble.
- **Marble bust** on a pink plinth (~37 u): shoulders with drapery lines, three-quarter head with curls, profile nose; variant two wears black pixel sunglasses with white, pink and cyan glints.
- **Pink flamingo** (single or a pair): pink gradient body, S-neck stroked twice, white beak with an ink tip, thin legs, one bent.
- **CRT monitor** (~26 u): beige-lilac box in three-quarter view, screen showing a sunset (gradient sky, striped sun, pink perspective grid), scanlines, glare triangle, mint and pink buttons, vents. Flickers.
- **Floating shapes** (hover 25 u, bob ±2.2 u, soft ellipse shadow): a glossy pearl sphere (radial blush → pink → lavender → cyan rim) or a chrome sphere (sky gradient above a curved horizon, dark-violet → pink reflection with a grid below, a yellow sun); a square pyramid rotating through 12 baked frames (faces lit by a 3D normal, colours from `#5b2a9a #9a6cf0 #ff7fcf #ffb38a #fff27a`); an iridescent ring made of 40 shaded spheres sorted back to front, wobbling ±0.16 rad.

Placement: one candidate per 100 u cell (50 %), never on or next to water, never near the start; the floor type picks the mix (marble: columns, busts, palms, spheres; checker: busts, columns, monitors, pyramids, flamingos; grid: pyramids, spheres, rings, monitors; terrazzo: palms, flamingos, rings, columns).

## Effects and particles

- **Projectile**: an iridescent compact disc r 3.6 (conic gradient `#ffd1ea #b892ff #5ee7ff #8ff5d2 #fff27a #ffc1a1`, white label ring, ink hole) with a white bloom, spinning in a plane squashed to 72 %; trail: a blurred streak 26 u long fading from transparent cyan through lavender to pink with a white core near the head.
- **Collectibles**: rotating octahedra (8 baked frames) with flat facets from a pastel ramp – small: `#1590c8 → #45d4f5 → #8ff5d2 → #dcfff3`, large: `#6a3fc8 → #b892ff → #ff9ad5 → #ffe0f2`; ink silhouette, white sparkle, bloom 80 %, a small floor shadow; flying ones leave a 35 % ghost.
- **Orbiting object**: a striped sunset sun r 5.6 with an amber bloom, trailing a pink/cyan polyline of its last 10 positions (stored relative to the main character).
- **Impact**: three short streaks (white + the creature colour) with a faint ink underlay, two confetti triangles, a small white ring.
- **Burst**: 7–8 confetti triangles with thin ink edges in the creature's colours, pink/cyan glitch squares, a squashed ring (colour 1.8 u + white 0.55 u core) and white/yellow streaks. The statue breaks into 16 white and lilac marble chunks (quads with 0.6 u ink edges), extra confetti, 14 glitch squares, two rings and a short screen glitch.
- **Collect**: a thin mint (small) or pink (large) ring and rising white or blush four-point stars.
- **Glow-up**: a light column (yellow → pink → transparent cyan) screen-blended over the main character, an expanding ring (ink 2.4 u + yellow 1.3 u), a pink inner ring, 16 rising stars and confetti.
- **Dash**: a cyan ring, pink/cyan glitch squares and backward streaks.

Particles are collected per kind, colour and alpha step (4 steps) and flushed as one path each: triangles and chunks fill + thin ink stroke, squares fill, rings stroke twice, streaks stroke twice (ink underlay at 40 %, then colour). If no flush hook runs (mixed with another style's atmosphere), the module switches to immediate drawing.

## Atmosphere and lighting

- **Sun from the upper left, low.** Prop shadows are long sheared silhouettes in `#4b2a86` at 34 %; actor shadows are soft violet ellipses (`rgba(75,42,134,.5) → 0`) nudged 2.5 u to the right; floating things get a smaller ellipse that shrinks as they rise.
- **Light pools.** A pink soft disc under the main character and amber discs under orbiting objects, drawn with `screen` at ~30 %.
- **Sunset wash** (cached per screen size): vertical gradient `rgba(255,186,110,.3)` at the top → `rgba(255,130,196,.1)` at 30 % → clear at 60 % → `rgba(84,30,168,.32)` at the bottom; a warm sun glare `rgba(255,238,170,.24)` centred just above the top edge.
- **Vignette** `rgba(42,10,80,.5)` in the corners; **edge fringe**: pink `rgba(255,63,174,.16)` fading over the left 7 %, cyan `rgba(47,224,255,.15)` over the right 7 %.
- **Scanlines** 1 px every 3 px (4 px above 1100 px height) at 6 % indigo, and a 4 % tape-grain noise tile, both baked into the same overlay.
- **Tracking band**: every 8.5 s a band 3 % of the height rolls down: 9 % white, a pink line at the top and a cyan line at the bottom (35 %), nine white noise streaks and animated snow (22 %) inside it. It is painted on top – copying the canvas onto itself every frame stalls the GPU.
- **Glitch** only on big moments (0.14 s large-creature burst, 0.24 s hurt, 0.45 s end): 3–6 horizontal strips shifted ±20 px and an 8 % pink flash.

## UI

A kit of **90s OS windows**, re-skinned entirely in CSS:
- **Panels**: lilac gradient `#f6efff → #ddcdfb`, a 2 px bevel (white top-left, `#6b4fa8` bottom-right), a 2 px ink frame (`box-shadow: 0 0 0 2px #2a1a4c`) and a hard offset shadow (`5px 5px 0 2px rgba(42,26,76,.4)`). Square corners.
- **Title bars**: 26 px, `linear-gradient(90deg, #ff5fc1, #b892ff 55%, #5ee7ff)` with faint scanlines, a 2 px ink bottom border and three little window buttons on the right (lilac squares in ink frames). Card numbers sit in the title bar in white VT323 with an ink shadow.
- **Bars**: sunken (reversed bevel) on `#1d1040`, fill gradients (pink → coral → amber → yellow, or the title-bar gradient), segmented by dark 3 px gaps every 14–17 px plus a white top sheen.
- **Counters and badges**: dark ink chips with a pink 2 px border and a cyan offset shadow, white VT323 numbers with a pink/cyan split.
- **Cards**: 232 × 274 px windows with a title bar, a white radial glow behind the 104 px icon, a dotted divider, Rubik Mono One 14 px uppercase title, VT323 21 px body in `#5b3a9a`. Hover lifts 8 px and turns the shadow pink.
- **Panel backdrop**: a sunset gradient (indigo → purple → pink → peach → yellow, with scanlines), a big striped sun behind the title (`mask-image` bands) and a perspective grid floor (cyan horizontals, pink verticals on deep purple).
- **Icons** (canvas, 96-unit design box): the same sticker language – gradient fills, 4–6 unit ink outlines, a white gloss spot, and a pink/cyan fringe made by drawing tinted copies 2.8 % of the size to each side. Motifs: gradient heart with sunset stripes, the one-eyed pyramid, CDs (single, triple, in motion, ricochet), a striped sun with an orbit ring, a winged sneaker, a pink horseshoe magnet, a soda can with a heart and a mint plus.

```css
.panel{padding:5px 10px;background:linear-gradient(180deg,#f6efff,#ddcdfb);
  border:2px solid;border-color:#ffffff #6b4fa8 #6b4fa8 #ffffff;
  box-shadow:0 0 0 2px #2a1a4c,5px 5px 0 2px rgba(42,26,76,.4);font:400 22px 'VT323',monospace;color:#2a1a4c}
.titlebar{height:26px;border-bottom:2px solid #2a1a4c;
  background:repeating-linear-gradient(0deg,rgba(255,255,255,.18) 0 1px,transparent 1px 3px),
             linear-gradient(90deg,#ff5fc1 0%,#b892ff 55%,#5ee7ff 100%)}
.bar{position:relative;height:18px;background:#1d1040;border:2px solid;border-color:#6b4fa8 #ffffff #ffffff #6b4fa8}
.bar-fill{height:100%;background:linear-gradient(90deg,#ff5fc1,#ff8fa3 45%,#ffb36b 75%,#fff27a)}
.bar::after{content:'';position:absolute;inset:0;
  background:repeating-linear-gradient(90deg,transparent 0 14px,rgba(29,16,64,.85) 14px 17px),
             linear-gradient(rgba(255,255,255,.5),rgba(255,255,255,0) 55%)}
```

## Motion and animation

- **Walk**: 8 frames per cycle (frame = anim / 3 mod 1), legs swing ±3.6 u with a 1.8 u lift, arms counter-swing, body bob 1.1 u twice per cycle. Idle: a ±0.5 u breathing bob at 3 rad/s.
- **Dash**: lean 0.24 rad and four afterimages 7 u apart alternating pink and cyan (alpha 0.4 → 0.1). Fast walking leaves a faint pink/cyan double image at 12 %.
- **Small creature**: hop phase = anim·0.3; height `sin(πφ)·5.5`; squash `1 − 0.18·cos(2πφ)³₊` on landing, 107 % stretch in the air, width compensated by `1/√sy`; blinks 7 % of the time.
- **Fast creature**: 6 frames at 1.8 cycles/s, hover bob ±1.4 u, pink and cyan afterimages at 8 % / 16 % of the velocity (alpha 0.3 / 0.22).
- **Large creature**: 8 frames, column legs lift 3.2 u, arm swing ±1.6 u; each footfall a white + pink floor ring growing 14 → 30 u.
- **Props**: floating shapes bob ±2.2 u at 1.7 rad/s; pyramids turn 90° every 1.7 s; rings wobble; palms sway; the monitor flickers 4 % of the time.
- **Collectibles** bob ±0.8 u and cycle 8 rotation frames at 1.5 Hz; numbers pop in at 130 % and fade over the last 40 % of their life.

## Do and don't

Do:
- Outline everything in deep indigo `#2a1a4c` at 0.6–1.0 units.
- Give every surface a gradient lit from the upper left.
- Bake bloom and the pink-left / cyan-right fringe into the sprite once.
- Use vaporwave icons as props: marble busts, columns, palms, flamingos, CRTs, floating geometric shapes.
- Build floors from crisp blocks with white trims; pools get white coping and a mosaic band.
- Let shadows be long, violet and fall to the lower right.
- Keep one deep purple region on screen for contrast.
- Dress the UI as 90s OS windows with gradient title bars and chrome numbers.

Don't:
- Use black outlines or grey shadows.
- Blur, shift or colour-split the whole screen every frame.
- Fill large subjects with flat colour.
- Let floor chips and sparkles compete with the subjects – they stay small and sparse.
- Put pale yellow lines on mint or peach floors.
- Mix in naturalistic textures (wood grain, grass, dirt).
- Push the VHS noise above a whisper (< 5 % alpha).

## Implementation recipe

1. Set up a 360-unit-tall world view and a bake resolution of 4 px per unit.
2. Write `fs(ctx, fill, lw)` (fill then ink stroke) and `limb(ctx, pts, w, col)`; draw each subject as closed gradient-filled paths, back to front.
3. Write `bake(l, t, r, b, draw, {bloom, bloomA, blur})`: draw the sharp art, then compose blurred tint (bloom) → pink copy −0.5 u → cyan copy +0.5 u → sharp art.
4. For characters bake 8 walk frames + idle + dash, mirror the sharp art for the other facing and keep white/pink/cyan silhouettes.
5. For standing props also bake the sheared long shadow; draw shadows in a pass before the y-sorted subjects.
6. Ground: pick a floor type per 32 u block, fill marble/checker/grid/terrazzo, add gloss and decals, then trims between different blocks, then pools on 16 u cells. Use world-anchored patterns; cache chunks.
7. Effects: confetti triangles, glitch squares, rings and streaks batched by colour; CRT-on/off for appearing and disappearing.
8. Overlay: cache the sunset wash, vignette, fringe, scanlines and grain per screen size; paint the tracking band on top each frame.
9. UI: bevelled lilac panels, gradient title bars, sunken segmented bars, chrome numbers, Monoton titles, VT323 text.

## Code

The snippets below are the core techniques, cleaned up from the style module. `starter.js` in this folder contains them plus the main character, two creature types, props, the floor and a complete preview scene. The full reference implementation is [`../../js/styles/vaporwave.js`](../../js/styles/vaporwave.js).

```js
// Fill + ink outline, and limbs stroked twice. Ink is deep indigo, never black.
const INK = '#2a1a4c';
function fs(c, fill, lw, col = INK) { if (fill) { c.fillStyle = fill; c.fill(); } if (lw) { c.strokeStyle = col; c.lineWidth = lw; c.stroke(); } }
function limb(c, pts, w, col) {
  c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.strokeStyle = INK; c.lineWidth = w + 1.6; c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke();
}
const grad = (c, x0, y0, x1, y1, st) => { const g = c.createLinearGradient(x0, y0, x1, y1);
  for (let i = 0; i < st.length; i += 2) g.addColorStop(st[i], st[i + 1]); return g; };
```

```js
// Bake once: sharp art + pastel bloom + VHS chroma fringe (pink left, cyan right). K = px per world unit.
const K = 4;
const mk = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
function tint(src, col) { const c = mk(src.width, src.height), x = c.getContext('2d');
  x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); return c; }
function bake(l, t, r, b, draw, { bloom = '#ff5fc1', bloomA = 0.55, blur = 2.2, fringe = 0.5 } = {}) {
  const w = Math.ceil((l + r) * K), h = Math.ceil((t + b) * K);
  const full = mk(w, h), f = full.getContext('2d');
  f.lineCap = f.lineJoin = 'round'; f.setTransform(K, 0, 0, K, l * K, t * K); draw(f);
  const out = mk(w, h), x = out.getContext('2d');
  x.filter = `blur(${blur * K}px)`; x.globalAlpha = bloomA; x.drawImage(tint(full, bloom), 0, 0); x.filter = 'none';
  x.globalAlpha = 0.8; x.drawImage(tint(full, '#ff3fae'), -fringe * K, 0); x.drawImage(tint(full, '#2fe0ff'), fringe * K, 0);
  x.globalAlpha = 1; x.drawImage(full, 0, 0);
  return { img: out, full, w: w / K, h: h / K, ax: l / (l + r), ay: t / (t + b) };
}
```

```js
// Long sunset shadow for a standing prop: shear the silhouette so height h lands 0.62h right and 0.28h below the base.
function longShadow(full, baseY /* px */, extraRight /* px */) {
  const c = mk(full.width + extraRight, Math.ceil(baseY * 1.3) + 12), x = c.getContext('2d');
  x.filter = `blur(${0.6 * K}px)`;
  x.setTransform(1, 0, -0.62, -0.28, 0.62 * baseY, 1.28 * baseY);
  x.drawImage(tint(full, '#4b2a86'), 0, 0, full.width, baseY, 0, 0, full.width, baseY);
  return c; // draw at 34 % alpha before the y-sorted subjects
}
```

```js
// Striped sunset sun (orbiting object, inlays, monitor screen): gradient disc with bands cut out of the lower half.
function sun(c, r) {
  c.save(); c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2);
  c.fillStyle = grad(c, 0, -r, 0, r, [0, '#fff7b0', 0.3, '#fff27a', 0.55, '#ffb36b', 0.8, '#ff5fc1', 1, '#c0399e']); c.fill();
  c.globalCompositeOperation = 'destination-out';
  for (const [y, h] of [[0.12, 0.08], [0.32, 0.11], [0.54, 0.14], [0.76, 0.16]]) c.fillRect(-r - 1, y * r, r * 2 + 2, h * r);
  c.restore(); c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.strokeStyle = 'rgba(42,26,76,0.85)'; c.lineWidth = 0.55; c.stroke();
}
```

```js
// CRT switch-on (appear) and switch-off (disappear) from one baked sprite s {img, flash, w, h, ax, ay}; cy = body centre.
function crtOn(ctx, s, x, footY, cy, k /* 0..1 */) {
  const e = 1 - (1 - k) * (1 - k), ky = 0.05 + 0.95 * e, kx = 1.35 - 0.35 * e, w = s.w * kx, h = s.h * ky;
  const dy = cy - (cy - (footY - s.ay * s.h)) * ky;
  ctx.globalAlpha = 0.5 + 0.5 * e; ctx.drawImage(s.img, x - s.ax * w, dy, w, h);
  ctx.globalAlpha = 1 - e; ctx.drawImage(s.flash, x - s.ax * w, dy, w, h);
  ctx.fillStyle = '#fff'; ctx.fillRect(x - 15, cy - 0.5, 30, 1); ctx.globalAlpha = 1;
}
```

## Adapting it to your project

- **Other worlds**: keep the block grid and trims, swap the floor types – a mall (terrazzo + checker + escalator-stripe tiles), a beach (sand gradient + towels as checker), a computer desktop (teal desktop + window frames as plazas).
- **Other subjects**: anything iconic of 80s/90s consumer culture works – cassette tapes, soda cans, sneakers, game consoles, Greek heads, dolphins, palm trees. Give each a gradient ramp, an indigo outline and the bake.
- **Night variant**: darken the floor bases by ~40 %, drop the warm wash and keep the pink/cyan fringe – it slides toward the base neon style without losing the solid shapes.
- **Pixel art**: render the world into a 1/3-size buffer with nearest-neighbour upscaling; keep the outline at one art pixel and the fringe at one pixel.
- **Accessibility**: the fringe and tracking band are decoration; offer a toggle that drops the overlay and the afterimages. Keep subject outlines – they carry readability.
- **Colour meanings**: pink = main character / friendly warmth, cyan = speed, white marble = heavy. Keep the mapping consistent if you add types.

## Performance notes

- **Baked once at load**: ~60 character frames × 2 facings with white, pink and cyan silhouettes; 16 collectible frames; 12 pyramid frames; 13 prop sprites with their shadow canvases; three marble textures (256 px), gloss, caustic and noise tiles. Init is a few hundred ms.
- **Ground**: 256 u chunks at ≤ 2.5 px/u take ~5–6 ms each, split over several frames by a generator – regions are sampled once per 32 u block and water once per 16 u cell (hundreds of samples, not tens of thousands). Patterns are canvas fills, not per-pixel loops.
- **Per frame**: one `drawImage` per actor/prop (+1–2 during flashes, afterimages for fast creatures), batched particles (one path per kind/colour/alpha step), one full-screen cached overlay, and a small painted tracking band. About 1–1.5 ms for ~60 actors at 1600 × 900 in a headless browser.
- **Hot spots**: full-screen composites dominate at high resolutions – keep everything that covers the screen in one cached overlay. Never `drawImage(canvas, …)` the canvas onto itself every frame; it forces a GPU flush (20–30 ms). The glitch strips do it only for fractions of a second.
- `screen` blending is used only for small light pools and the glow-up column.

## Copy-paste prompt

```text
Use the Vaporwave Sunset art style for my project (Canvas 2D, procedural, no image assets):
- Sunny 80s/90s vaporwave, seen from above. ~70 % of the screen is pastel; one deep purple region for contrast.
- Every sprite is solid shapes with gradients lit from the upper left and a deep-indigo #2a1a4c outline (0.85–1.0 units
  on silhouettes, 0.4–0.6 on details, never black). Bake each sprite ONCE: sharp art + blurred tinted copy (pastel bloom,
  2.2 units, ~55 %) + a pink #ff3fae copy 0.5 units left and a cyan #2fe0ff copy 0.5 units right behind it (VHS fringe).
- Main character: cool figure, cyan-to-violet flattop, wayfarer sunglasses reflecting a sunset, pink windbreaker with a teal
  band, indigo trousers, white sneakers. Small creatures: hopping one-eyed pink pyramids. Fast: low-poly cyan dolphins with
  pink/cyan afterimages. Large: a walking white marble statue with a pink sash, laurel wreath and glowing cyan eyes.
- Props: palms, Ionic columns (whole/broken), marble busts (one in pixel shades), flamingos, a CRT showing a sunset, floating
  gradient spheres, rotating pyramids and iridescent rings. Long sheared violet shadows fall to the lower right.
- Floor on a 32-unit block grid: rose marble slabs with veins, lavender checker (#fff0f8/#cdb3f7), purple pastel grid
  (#6d49b8 + pink lines), mint terrazzo; white raised trims between types; stepped pools with depth gradient, caustics,
  a pink/blue mosaic band and white coping.
- Effects: iridescent CD projectile with a pink-to-cyan trail, pastel octahedron collectibles, striped sunset-sun orbiters,
  confetti triangles with ink edges, glitch squares, rings with a white core. Appear/disappear like a CRT switching on/off.
- Atmosphere: sunset wash (peach top, violet bottom), violet vignette, pink/cyan edge fringe, scanlines, faint tape grain
  (all one cached overlay) and a painted tracking band rolling down every 8.5 s.
- UI: 90s OS windows – lilac bevelled panels, gradient title bars pink→lavender→cyan, sunken segmented bars, chrome
  Rubik Mono One numbers, Monoton titles with a cyan/pink split, VT323 body text.
```
