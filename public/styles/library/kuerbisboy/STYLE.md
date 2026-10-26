# Pumpkin Boy — Game Art Style Spec

> A pumpkin-tinted handheld LCD: exactly four shades, Bayer dithering, crisp outlined mini sprites at 2 world units per pixel.

Pumpkin Boy ("Kürbis-Boy" in the module) looks like a monochrome handheld console whose screen has an orange tint. Every pixel of the world, every sprite and every HUD window is one of four warm shades: ink brown `#2a1712`, rust `#7c3a1e`, pumpkin `#e0812c` and cream `#f6d7a1`. There are no gradients and no alpha in the art: volume comes from four flat bands joined by single checkerboard rows, transparency and shadows are ordered (Bayer 4x4) dither, glow is a dithered ring. Sprites are tiny text grids (10-26 px) with an automatic 1 px ink outline. The low-res image is upscaled with nearest neighbour, and a faint LCD cell grid, vignette and recessed bezel sit on top at display resolution.

## At a glance

| Property | Value |
| --- | --- |
| Family | Pixel Art · 4 Colours |
| Mood | nostalgic, cosy-spooky, autumnal, crisp, toy-like |
| Best for | crowded top-down arena games, top-down adventures, harvest games with a spooky twist, short prototypes with a strict palette, monster-collecting RPGs |
| Renderer | Canvas 2D, procedural, no image assets |
| Pixel art | yes - `pixelArt: { scale: 2 }` (1 art px = 2 world units, 180 art px visible vertically) |
| Complexity | 4/10 - tiny sprites are quick to draw, but with 4 colours every new creature design is harder to tell apart |
| Fonts | Press Start 2P (HUD), built-in 3x5 bitmap digits (floating numbers) |
| Key colours | `#2a1712` ink · `#7c3a1e` rust · `#e0812c` pumpkin · `#f6d7a1` cream |

## When to use it

- **Good fit:** top-down scenes with big crowds of creatures (outlined tiny sprites stay readable even in dense groups), top-down Zelda-likes, farming or harvest games with a Halloween edge, quick prototypes where a strict palette saves decisions, monster-collecting RPGs with a retro handheld vibe.
- **Good fit:** anything that should feel like a 1990s handheld cartridge - the four shades, the LCD grid and the double-bordered windows sell it instantly.
- **Bad fit:** projects where many creature or item types must be told apart by colour (team colours, elemental colour codes, match-3) - there is only one hue.
- **Bad fit:** high-detail characters, very large creatures with fine detail, cinematic lighting, painterly or realistic worlds.
- **Bad fit:** very dense UI with many simultaneous bars - four shades make layered information hard to separate.

## Color palette

| Swatch name | Hex | Role |
| --- | --- | --- |
| Ink (index 0) | `#2a1712` | Outlines, eyes, cracks, HUD borders and text. Never on open ground. |
| Rust (index 1) | `#7c3a1e` | Shadow band, dark character bodies (main character torso, small creature), checker shadows, furrow and field edges, trunks. |
| Pumpkin (index 2) | `#e0812c` | Mid tone: main character head, roads, grass tufts, furrows, dithered halos, bar fills. |
| Cream (index 3) | `#f6d7a1` | Backplane: open meadow, highlights, ghost bodies, HUD window fill, floating numbers. |
| LCD gap (overlay) | `#fae4b4` @ 20% | 1 display px grid line between upscaled art pixels (only if upscale >= 3). |
| Vignette / bezel (overlay) | `#2a1712` @ 0-30% | Radial vignette 0 -> 0.16, top bezel 0.30, left bezel 0.24, cell edge 0.035. |

Palette rules:

- **Exactly four colours in the art buffer.** Index grids store 0..3 (-1 = transparent); pixels are written as precomputed 32-bit values. The only non-palette pixels come from overlays drawn *after* upscaling (LCD grid, vignette, bezel) and from anti-aliased HUD text edges.
- **Ground never uses ink.** The floor uses indices 1-3 only, so ink outlines always separate characters and props from the ground.
- Approximate screen ratio: 60% cream, 25% pumpkin, 12% rust, 3% ink.
- **No alpha in the art.** Fades = Bayer masks; shadows = `(x + y) & 1` checker ellipses in rust; glow = dithered pumpkin rings.
- **Flash = palette inversion** `INV = [3, 2, 1, 0]`, never white.
- Any colour coming from shared code (particles, icons) is snapped to the nearest of the four shades.

## Typography

**Press Start 2P** (Google Fonts, weight 400 only) - https://fonts.google.com/specimen/Press+Start+2P
Role: every HUD string. Sizes are strict multiples of 8 px: 8 px labels, 16 px values / card text, 24 px counters, 32 px clock and titles.

```css
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
.clock-time  { font: 400 32px/36px 'Press Start 2P', monospace; color: #2a1712; text-shadow: 4px 4px 0 #e0812c; letter-spacing: 0; }
.clock-label { font: 400 8px 'Press Start 2P', monospace; color: #7c3a1e; letter-spacing: 1px; text-transform: uppercase; }
.tag         { font: 400 16px/20px 'Press Start 2P', monospace; background: #2a1712; color: #f6d7a1; text-transform: uppercase; }
```

Text effects: no blur, no glow. Big numbers and titles get a **hard 4 px pumpkin offset shadow** (`4px 4px 0 #e0812c`). Secondary text is rust, never reduced opacity. Inverted tags are cream on ink.

**3x5 bitmap digits** (built into the module) for numbers floating in the world: glyph grid 3 wide x 5 tall, 1 px spacing, cream fill (emphasised variant: pumpkin + `!`), full ink outline plus an extra rust underline row so 1 px gaps between digits stay readable.

## Rendering technique

1. **Constants.** `PS = 2` world units per art pixel. The screen shows 360 world units vertically, so the art buffer is `360 / 2 = 180` px tall. The renderer picks `up = round(displayH / 180)` and a buffer of `ceil(displayW / up) x ceil(displayH / up)`.
2. **Palette as 32-bit words.** `PX32[i] = (255 << 24) | (b << 16) | (g << 8) | r` for the 4 colours, so ImageData can be written through a `Uint32Array`.
3. **Index grids (`IG`).** Every sprite is an `Int8Array` of palette indices (-1 = empty) built from text rows: `'0'..'3'` = colour, `'.'` = keep, `'x'` = erase. Parts are composed by stamping rows into the same grid (main character = body rows at y 10 + head rows at x 1).
4. **Auto outline.** `outline(g, col = 0)` grows the grid by 1 px on each side and fills every empty pixel that has a filled 4-neighbour with `col`. The main character gets `outline(outline(g), 3)` = ink line plus a cream halo.
5. **Bake at init.** Each grid becomes up to four canvases: right, left (mirrored), and palette-inverted right/left for flash frames. Also baked: dither-faded ghost copies (25/50/75%), shadow ellipses per size (two checker phases), halo rings, puff frames, number sprites (cached by string).
6. **Ground chunks.** 256 world units = 128 art px per chunk, generated per pixel into ImageData (see World and ground), drawn at integer positions.
7. **Per frame, in the art buffer:** ground chunks -> collectibles -> checker shadows of all props / creatures / main character -> y-sorted props, creatures and main character -> orbiting objects -> projectiles -> particles -> floating numbers. Every blit is snapped: `px = round(x / PS - w * ax)`.
8. **Upscale** the buffer to the display with `imageSmoothingEnabled = false`.
9. **Display overlay** at full resolution (cached per size): LCD cell grid, vignette, bezel gradients. Then the HTML/CSS HUD on top.

## World and ground

The floor is an autumn farmland seen from straight above, painted only in rust, pumpkin and cream (never ink) at 1 art px = 2 world units, and generated as deterministic functions of world position (`fieldsAt(wx, wy)`):

- **Road net:** a coarse Voronoi (cell 1150 world units), domain-warped by Perlin (amplitude 64, wavelength 540). Roads lie on the cell edges: half-width 12.5 world units for country roads (62% of edges) or 7 for footpaths. `rv < 0` = road; `rv < 2.4` gives a 1 px checkerboard-dithered fringe.
- **Plazas:** on 62% of Voronoi junctions a disc of radius 58-94 world units (graveyard or village square) filled with Worley flagstones 6.5 x 4.6 art px; joints and the lower lip of each stone are pumpkin, faces cream.
- **Fields:** a finer Voronoi patchwork (cell 400) clustered into farmland zones by low-frequency fbm. Each field has one furrow orientation (rows, columns, `/`, `\`). Field interior is inset 12 units from cell edges and 20 from roads.
- **Tall grass / forests:** fbm blobs, mostly outside farmland.

Per-pixel patterns (`gx, gy` are global art-pixel coordinates):

- `grassPx`: cream with pumpkin `v` tufts or double blades in staggered 6x5 cells. The density is passed in by the caller: `0.008 + 0.62 * edge² + 0.32 * smoothstep(0.7, 0.85, macro)`, where `edge = 1 - d / 18` and `d` is the distance in world units to the nearest road, field or tall-grass edge. Tufts line the edges, the open meadow stays calm.
- `tallPx`: 4x4 motif `3,2,3,3 / 2,3,2,3 / 2,1,2,3 / 3,3,3,3`, rows staggered by 2 px, 1 in 8 motifs knocked out.
- `roadPx`: pumpkin with a rust speck at `(gy & 3) == 1` every 4th column (rows staggered), 2 of 3 kept.
- `fieldPx`: furrow every 6 px (`r == 0`, diagonal fields also `r == 1`) in pumpkin with rust clods (1 in 11 blocks of 2x2), a crumb row in pumpkin, the rest cream.

An **edge pass** then makes every border crisp: a field pixel touching a non-field pixel becomes rust if the non-field is below it, else pumpkin; tall grass gets a rust bottom edge and pumpkin top/side edge; a meadow pixel directly below a field or tall grass becomes a checkerboard drop shadow (`(i + j) & 1 ? 2 : 3`).

**Decals** are stamped as text glyphs after the edge pass (34-unit scatter cells): `flower ['.2.','212','.2.']`, `daisy`, `stone ['.22.','2332','.11.']`, `pumpkinS ['..1..','.222.','22322','.111.']`, pebbles on roads, leaves / mushrooms in forests, bones and cracks on plazas. Field pumpkins `pumpkinF ['...1...','.23212.','2322221','2222211','.11111.']` are snapped onto the nearest furrow.

Keep the ground busy but low-contrast (mostly cream with pumpkin marks) so ink-outlined characters and props pop on top of it.

## Characters

All characters are built on char grids and converted to palette-index grids (`0` ink `#2a1712`, `1` rust `#7c3a1e`, `2` pumpkin `#e0812c`, `3` cream `#f6d7a1`), auto-outlined with 1 px ink, mirrored for facing left and baked with a palette-inverted copy for flash frames. The main character and the small and fast creatures are **posed from parts** and baked lazily per pose (key → sprite set, common poses warmed at init). Feet anchor at bottom centre; every blit snaps to whole art pixels (2 world units). Animation is held poses only, never tweening.

### Main character

A 12 x 16 grid (with ink outline and the extra cream halo 16 x 20 px): a 10 x 7 pumpkin head (pumpkin `2`, rust ribs at x = 2 and 7 on the top and bottom rows, rust underside, two cream glint pixels upper left), a carved face turned one pixel to the facing side (two 2 x 2 ink eye holes with a cream glint in the upper-left pixel, an ink smile with a cream tooth that curls up at both corners), an ink stem with a rust leaf; a cream scarf collar whose tail trails behind, a rust coat with a pumpkin belt and cream buckle, an ink hem, ink near leg, rust far leg and far arm, cream hands.

- **Walk = 8 computed poses** (contact, down, passing, up per leg) from a legs table: body offsets `[0, +1, 0, -1, 0, +1, 0, -1]` px, a hip row fills the gap on "up" frames, near arm swings back/forward against the legs, far arm shows in front on the opposite step. The **head uses the previous frame's body offset** (it lands a frame late), the scarf tail alternates two flap shapes one frame behind the step, and the stem leaf lifts when the head drops. Frame = `floor(anim * 1.3) & 7` (~12 fps).
- **Idle:** breath on a 1.1 s beat (body down 1 px, head following 0.12 s later), leaf flick at 1.5 fps, blink (eyes become a single ink row) every 3.4 s for 0.13 s, a two-frame scarf flutter every 4.3 s; each figure has its own phase.
- **Dash:** 50 ms crouch wind-up (body 2 px down, boots wide, arms back) → stretch pose (legs split, head 1 px forward, scarf straight back) with two pumpkin checker afterimages 9 and 18 world units behind → 120 ms skid. **Throw:** the near arm snaps out at shoulder height for ~90 ms after a shot.
- **Hurt:** a recoil pose (arms up, head tipped back, squeezed eyes, open "O" mouth) that alternates normal and palette-inverted every 2 frames, then the classic flicker (skip drawing on even 15 Hz frames).
- **Shadow:** checker ellipse 11 x 3 px.

### Creatures

- **Small creature** (12 x 14 grid): a hopping root with a rust top, a one-row rust/pumpkin checker seam and a pumpkin bottom (the pale variant has a cream bottom, is 0.5 px narrower and a row taller), a pumpkin highlight upper left, cream eyes with ink pupils under angry ink brows, an ink grin with two cream teeth, rust root legs and a pumpkin leaf crown (three-leaf fan or two long leaves). **Hop cycle, 4 frames:** land (squash: half-width 5.3, height 6, legs splayed, crown flops) → push (4.5 x 7) → air (stretch: 3.9 x 8, 2 px up, legs tucked, crown lags down) → fall (crown lifts). Frame = `floor(anim * 1.6 + phase) & 3`. Shadow 9 x 2 px.
- **Fast creature** (13 x 16 ghost): a cream hood with a peak, pumpkin shade on its back and lower body, a rust tail rim, two separate 2 x 2 ink eye holes, a mouth that opens for 0.5 s every 2.6 s and a reaching arm (2 positions at 3 fps). The tail waves through 4 frames at 7 fps. After outlining, rows dissolve with a Bayer threshold (rows < 10 kept 100 %, 10-11 75 %, 12-13 55 %, 14+ 35 %). It floats on an eased lift `[0, 0, 1, 2, 3, 3, 2, 1]` px (+3 px) at 5 fps. The dark outline and pumpkin shade keep it readable on the cream meadow.
- **Large creature** (a root colossus, 26 x 27 procedural): dithered ellipse rx 8.8 / ry 8.6 with bands by height (rust top, checker, pumpkin, checker, cream), right flank one band darker, a checkered pumpkin rim light upper left, ink cracks and angry brows, cream eyes, a cream chest core whose ring pulses ink/rust, 1-px-gap root arms with their own outline, leaf crown; 4 stomp frames (legs lift 2 px alternately, body bobs 1 px, arms swing 1 px). Shadow 20 x 4 px.

### States (all creatures)

- **Hit (~130 ms):** palette-inverted frame while `flash > 0.4`, the squash pose with shut eyes for the small creature, and a 2-px recoil away from the facing side.
- **Appear (0.45 s):** a rust/pumpkin dirt mound (10 px, 18 px for the colossus) heaves for 0.13 s, then the creature climbs out (only its top rows drawn, eased by `outQuad`, the mound in front covers the cut) and lands in its squash frame. Ghosts fade in through the 25/50/75/100 % dither levels.
- **Disappear (0.35 s):** an inverted "pop" in the squash pose that blinks for ~90 ms, then the 4-frame puff (small, normal or large). Ghosts instead rise 10 px while dithering away level by level.

## Props

Props are y-sorted with the characters, drawn as text grids of palette digits with a 1 px ink 4-neighbour outline (fences are the only exception: no outline), and each stands on a rust checkerboard shadow ellipse.

- **Round autumn trees** (24x27 big or 18x21 small) built from blob unions, lit from the upper left with `L = -0.62 nx - 0.78 ny` in four bands with checker transitions, staggered darker leaf-clump arcs every 4 rows / 5 columns and a rust rim along the canopy bottom. Trunk 4 px (3 px small) with a pumpkin left and ink right column. A dark variant shifts all indices by -1. Shadow 20x5 px (small tree 14x4), offset 2 px right.
- **Dead tree:** 18x16 bare rust branch fork, ink outline; shadow 12x3.
- **Small field props:** bush `['...2222...','.22333222.','2233322221','2232222121','1222212211','.11111111.']`, rock `['..3332..','.333322.','33322221','32222111','.111111.']`, stump `['.3332.','322221','111111','1.11.1']`; shadow 10x3, offset 1 px right.
- **Pumpkins:** 9x7 ribbed pumpkin `['....1....','...11....','.2212122.','222121222', ...]`; carved lantern pumpkin (`jackolantern`) with cream eyes and grin rows `232232321 / 233333331` that swaps to the plain pumpkin when its flicker is off and gets a dithered halo (see Atmosphere).
- **Scarecrow:** 10x16 - rust hat brim, pumpkin face with cream eyes, a 10 px wide rust crossbar with pumpkin hands, 2 px pole; shadow 10x3.
- **Fence:** 14x5 tile of rust posts every 7 px with two pumpkin rails, no outline and no shadow, placed along upper field borders with gaps.
- **Graves:** three headstone grids (6x8 rounded stone with rust inscription lines, 6x8 cross, 7x7 slab) in cream with a pumpkin/rust base row, set on graveyard plazas.
- **Lamp post:** 10x17 - 2 px rust pole, rust arm and hanging lamp; lit frame rows `23332 / 23032 / 22222`, unlit `22222 / 22122 / 12221`; shadow 8x3.
- **Sign:** 11x9 cream board with rust lettering row on a 2 px rust post; shadow 8x3.
- Every prop keeps the four-band, light-from-upper-left shading and stays within ~26 px so it reads at the same scale as the characters.

## Effects and particles

All effects use only the four tones, snap to the 2-unit grid and fade by blinking or dither, never by alpha. Every effect is layered: flash → main shape → debris → residue.

- **Impact:** a 3-frame sprite over 0.2 s (7 x 7 cream cross with an ink rim → 9 x 9 ink/rust X of sparks around a cream core → four far ink corner dots), plus 3 debris pixels (ink, rust, cream) with gravity 200.
- **Disappear burst:** the inverted pop (see States) → 4 puff frames: one round cream blob, five clustered blobs with pumpkin undersides, six small blobs in a ring (rust outline), seven tiny pumpkin specks; small, normal and large sizes.
- **Debris and residue:** 7 (14 for the colossus) 1-2 px chunks in rust/pumpkin/ink with gravity 260, tumbling 2 x 2 rust leaf scraps (4 rotation frames, outlined) from root creatures, cream sparks rising from ghosts, and a small puff that drifts up and lingers 0.55-0.8 s.
- **Collect:** an expanding diamond outline (radius 2, 4, 6; ink, then rust with a cream inner line, the last one broken) plus the star sparkle.
- **Glow-up:** a 7 x 30 px light column (cream core, pumpkin every third row, rust checker sides, ink edge ticks; 2 phases alternating at 8 fps) that shrinks from the top over 0.55 s, a ring, 8 outward stars and the orbiting stars around the main character.
- **Projectiles:** 4 rotation frames of an outlined seed (`['333','322']`, `['32','33','23']`, `['33.','.33']`, `['.33','33.']`), frame = `floor(spin / (PI/4)) & 3`. Trail: one rust pixel at `pos - v * 0.016 * 2.4` and one pumpkin pixel at `pos - v * 0.016 * 1.2`.
- **Collectibles:** small 3 x 3 and large 5 x 7 outlined gems blinking between 2 frames at 3 fps, a 2 x 1 rust contact pixel below, a hop of `sin(pop * PI) * 4` px when they appear; large ones flash a star.
- **Orbiting lantern:** 7 x 8 outlined lantern with a cream glass that flickers lit/unlit from two summed sines and a dithered pumpkin halo ring (radius 3-7) while lit.
- **Dash dust:** three puffs left behind along the dash.
- **Floating numbers:** a 3 x 5 pixel font, outlined, cached per string; they blink out at 20 Hz in the last 25 %.

## Atmosphere and lighting

- **Shadows:** rust checkerboard ellipses: main character 11x3 px, small creature 9x2, ghost 6x2, large creature 20x4, big tree 20x5 (+2 px right), small tree 14x4, dead tree 12x3, scarecrow 10x3, lamp post / sign 8x3, other props 10x3 (+1 px right); fences none. Two checker phases are pre-baked and chosen by `(px + py) & 1` so the checker always locks to the world grid instead of crawling.
- **Ground drop shadow:** meadow pixels directly below a field or tall-grass edge become a pumpkin/cream checkerboard row.
- **Light:** no light system and no light direction beyond the fixed upper-left shading in the sprites. Lit objects swap to a brighter frame (lantern body rows `1131311 / 2333332` lit vs. `1121211 / 2222222` dark) and draw a dithered pumpkin halo ring first: `haloSprite(r0, r1, density)` keeps pixels with `r0 < d < r1` and `bayer < density * (1 - 0.6 * (d - r0)/(r1 - r0))` (vertical distance scaled by 1.15). Sizes: lamp post `(4, 8, 0.62)`, carved pumpkin `(5, 8.5, 0.5)`, small lantern `(3, 7, 0.45)`.
- **Flicker:** frame swapping only. Lamp posts lit when `sin(t*9 + ph) + sin(t*23 + ph*3) > -0.5`, carved pumpkins when `sin(t*7 + ph) > -0.7`, lanterns as above.
- **LCD overlay** (display res, after upscale, only if `up >= 3`): a 1 px line `rgba(250,228,180,0.2)` at every multiple of `up` (cell gaps show the light backplane - visible on dark pixels, invisible on cream) and a `rgba(42,23,18,0.035)` line at `up - 1`.
- **Vignette:** radial gradient from `0.42 * min(W,H)` to `0.58 * hypot(W,H)`, ink 0 -> 0.16.
- **Recessed bezel:** top linear gradient ink 0.30 -> 0 over `max(4, 2*up)` px, left gradient 0.24 -> 0.
- **Modal dimming:** overlays darken the scene with a 10x10 px ink checkerboard (`repeating-conic-gradient`), never a translucent fill.
- No bloom, blur, colour grading or post effects beyond a plain camera shake.

## UI

Handheld-style windows everywhere: cream fill, 4 px ink border, 4 px cream gap, 4 px ink outer ring, square corners. Bars are segmented and pixel-hard (12 px on / 4 px cream gap for the wide bar, 8 px on / 4 px gap for the short bar) with a lighter top stripe. Icons are 14x14 four-colour grids, outlined, drawn at integer multiples (`floor(size / 16)`). The alert state inverts the bar window (ink fill, cream text). Modal screens darken the scene with an ink checkerboard, not a translucent fill. Cards are cream windows with a blinking ink triangle cursor (`steps(1)`). All text Press Start 2P in multiples of 8 px; big numbers get the hard 4 px pumpkin offset shadow; tags are cream on ink.

```css
.win { background:#f6d7a1; border:4px solid #2a1712; border-radius:0;
       box-shadow:0 0 0 4px #f6d7a1, 0 0 0 8px #2a1712;
       font-family:'Press Start 2P', monospace; color:#2a1712; }
.bar-wide      { height:28px; overflow:hidden; }
.bar-wide-fill { background:repeating-linear-gradient(90deg,transparent 0 12px,#f6d7a1 12px 16px),
                            linear-gradient(#f6d7a1 0 4px,#e0812c 4px 16px,#7c3a1e 16px); transition:none; }
.bar      { width:208px; height:24px; background:#f6d7a1; border:4px solid #2a1712; border-radius:0; }
.bar-fill { background:repeating-linear-gradient(90deg,transparent 0 8px,#f6d7a1 8px 12px),
                       linear-gradient(#e0812c 0 4px,#7c3a1e 4px); transition:none; }
.alert .win { background:#2a1712; color:#f6d7a1; }
.icon    { width:32px; height:32px; image-rendering:pixelated; }
.overlay { background:repeating-conic-gradient(#2a1712 0 25%,transparent 0 50%) 0 0/10px 10px; }
.cursor  { animation:blink 1s steps(1) infinite; }
@keyframes blink { 0% { opacity:1 } 60% { opacity:0 } }
```

## Motion and animation

- Held poses on the handheld beat (8-12 fps), whole-pixel snapping, no tweening of position on the art grid.
- Main character: 8-pose walk at `floor(anim * 1.3) & 7` with body offsets `[0,1,0,-1,…]`, counter-swinging arms, the head one frame behind the body, the scarf one frame behind the step; idle breath 1.1 s (head 0.12 s later), blink 3.4 s, leaf 1.5 fps, scarf flutter 4.3 s; dash = 50 ms wind-up → stretch → 120 ms skid; throw arm ~90 ms; hurt recoil ~150 ms.
- Small creature: 4-frame squash & stretch hop at `floor(anim * 1.6 + phase) & 3`; the leaf crown droops while rising and lifts while falling.
- Ghost: tail 4 frames at 7 fps, eased lift `[0,0,1,2,3,3,2,1]` at 5 fps, arm 3 fps, mouth 0.5 s per 2.6 s. Large creature: 4 stomp frames at `anim * 0.6 + phase`.
- Per-actor phase: every figure gets its own phase (`seed × 10`, random once for clones) added to all timers, so crowds never move in lock-step.
- Collectibles blink at 3 fps, bob 1 px at 2 fps and hop `sin(pop * PI) * 4` px when they appear. Floating numbers rise, sit 1 px higher in the first 20 % of life and blink out at 20 Hz in the last 25 %.
- Lights flicker by frame swap (lit / unlit), never by alpha; UI blinks use `steps(1)`.

## Do and don't

**Do**

- Use exactly the four tones everywhere (world, sprites, effects, HUD, icons).
- Pose figures from parts on a char grid (legs table, arm table, head, scarf or crown) and bake each pose once.
- Give every cycle real poses and one lagging feature: the head a frame late, the scarf or leaf crown a frame behind.
- Give every state its own sequence: wind-up before a dash, squash and recoil on hit, a mound before an appearance, an inverted pop before a puff.
- Keep the meadow calm: tufts gather along roads, fields and tall grass; flowers grow in small beds.
- Use palette inversion for flash frames and frame swaps for flicker.
- Keep ink for outlines, faces and the darkest accents; let the main character carry the only cream halo.

**Don't**

- Don't add a fifth colour, a tint or any alpha blending.
- Don't animate with a 2-pixel leg shuffle or a plain bob on everything; don't let crowds share one phase.
- Don't sprinkle tufts or decals evenly over the meadow.
- Don't draw a light figure on the light ground without an ink outline and a darker shade side.
- Don't use smooth gradients or sub-pixel positions.
- Don't put ink on the ground (only rust, pumpkin and cream).
- Don't use rounded corners or soft shadows in the UI.

## Implementation recipe

1. Fix the camera to show 360 world units vertically; set `PS = 2`, buffer height 180 px, `up = round(displayH / 180)`.
2. Define the 4 hex colours and precompute their `PX32` words and the inversion map `[3,2,1,0]`.
3. Implement `IG(w,h)` with `rows()`, `outline(g, col)`, `toCanvas(g, map)` and a sprite-set helper producing right / left / inverted canvases.
4. Draw every character and prop as text rows (palette index digits). Keep the main character ~16x18 px incl. outline, small creatures ~12x14, large creatures ~28x29.
5. Compose characters from parts (head + body frames), then outline: ink for everyone, ink + cream halo for the main character.
6. Write ground as per-pixel pattern functions of global art-pixel coordinates (grass tufts, tall grass motif, furrows, road speckle), choose materials from smooth noise / Voronoi fields, run an edge pass, stamp decal glyphs, write into a `Uint32Array` ImageData. Cache by chunk.
7. Bake checker shadow ellipses (2 phases), dithered halo rings, puff frames, number sprites.
8. Per frame: ground, collectibles, shadows, y-sorted characters and props, orbiting objects, projectiles, pixel particles, numbers - all via `blit()` that rounds to whole art pixels.
9. Upscale with `imageSmoothingEnabled = false`, then draw the cached LCD overlay (grid + vignette + bezel).
10. Build the HUD as double-bordered cream windows in Press Start 2P with segmented bars, sizes in multiples of 8 px.
11. Use on-style feedback effects: inverted flash + sparks on impact, puff + pixel shower when something vanishes, stars on collectibles, blinking instead of fading.

## Code

The blocks below are ported from the module and run on their own. A complete runnable scene (ground, main character, three creature types, props, lanterns, projectiles, LCD overlay and HUD) is in [`starter.js`](starter.js); the full module is [`../../js/styles/kuerbisboy.js`](../../js/styles/kuerbisboy.js).

Palette, index grids and auto outline:

```js
const HEX = ['#2a1712', '#7c3a1e', '#e0812c', '#f6d7a1'];
const PX32 = HEX.map((h) => { const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16);
  return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0; });
function IG(w, h) {
  const a = new Int8Array(w * h).fill(-1);
  return { w, h, a,
    set(x, y, v) { if (x >= 0 && y >= 0 && x < w && y < h) a[y * w + x] = v; },
    get(x, y) { return x >= 0 && y >= 0 && x < w && y < h ? a[y * w + x] : -1; },
    rows(rows, ox = 0, oy = 0) {
      rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const c = r.charCodeAt(x);
        if (c >= 48 && c <= 51) this.set(ox + x, oy + y, c - 48); else if (c === 120) this.set(ox + x, oy + y, -1); } });
      return this;
    } };
}
function outline(g, col = 0) { // grow by 1 px, fill empty 4-neighbours of filled pixels
  const o = IG(g.w + 2, g.h + 2);
  for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) {
    const v = g.get(x - 1, y - 1);
    if (v >= 0) o.a[y * o.w + x] = v;
    else if (g.get(x - 2, y - 1) >= 0 || g.get(x, y - 1) >= 0 || g.get(x - 1, y - 2) >= 0 || g.get(x - 1, y) >= 0) o.a[y * o.w + x] = col;
  }
  return o;
}
function toCanvas(g, map) { // map = [3,2,1,0] gives the inverted flash copy
  const c = document.createElement('canvas'); c.width = g.w; c.height = g.h;
  const ctx = c.getContext('2d'), img = ctx.createImageData(g.w, g.h), d = new Uint32Array(img.data.buffer);
  g.a.forEach((v, i) => { if (v >= 0) d[i] = PX32[map ? map[v] : v]; });
  ctx.putImageData(img, 0, 0);
  return c;
}
// main character: body rows at y 10, head at x 1, then ink outline + cream halo
// const mainCharacter = toCanvas(outline(outline(IG(12, 14).rows(BODY_W0, 0, 10).rows(HEAD, 1, 0)), 3));
```

Bayer dither fade (ghost tail) and grid-locked checker shadow:

```js
const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const bay = (x, y) => B4[((y & 3) << 2) | (x & 3)];
function dissolveRows(o, f) { // o = outlined index grid; lower rows keep fewer pixels
  const g = IG(o.w, o.h);
  for (let y = 0; y < o.h; y++) {
    const lv = y < 9 ? 1 : y < 11 ? 0.75 : y < 13 ? 0.5 : 0.3;
    for (let x = 0; x < o.w; x++) { const v = o.a[y * o.w + x]; if (v >= 0 && bay(x + f, y + f * 2) < lv) g.a[y * o.w + x] = v; }
  }
  return g;
}
function shadowPair(w, h) { // two checker phases, rust (index 1)
  return [0, 1].map((ph) => { const g = IG(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (x + 0.5 - w / 2) / (w / 2), dy = (y + 0.5 - h / 2) / (h / 2);
      if (dx * dx + dy * dy <= 1.05 && ((x + y + ph) & 1) === 0) g.set(x, y, 1);
    }
    return toCanvas(g); });
}
function drawShadow(ctx, pair, x, y) { // x, y in art pixels; phase picked so the checker never crawls
  const w = pair[0].width, h = pair[0].height, px = Math.round(x - w / 2), py = Math.round(y - h / 2);
  ctx.drawImage(pair[(px + py) & 1], px, py);
}
```

Ground pixel patterns and the edge pass (global art-pixel coordinates):

```js
function hashInt(x, y, s) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return h >>> 0; }
function grassPx(gx, gy, mac) { // cream with staggered 'v' tufts in pumpkin
  const cy = Math.floor(gy / 5), sx = gx + ((cy & 1) ? 3 : 0), cx = Math.floor(sx / 6), h = hashInt(cx, cy, 77);
  if ((h & 1023) / 1024 < mac) {            // mac = density from the caller: high near edges, tiny on open meadow
    const lx = sx - cx * 6 - (h >>> 10) % 4, ly = gy - cy * 5 - (h >>> 13) % 3;
    if (((h >>> 16) & 3) < 3) { if ((ly === 0 && (lx === 0 || lx === 2)) || (ly === 1 && lx === 1)) return 2; }
    else if ((lx === 0 || lx === 2) && (ly === 0 || ly === 1) && !(lx === 2 && ly === 0)) return 2;
  }
  return 3;
}
function fieldPx(gx, gy, o) { // o: 0 rows, 1 columns, 2 '/', 3 '\'
  const f = o === 0 ? gy : o === 1 ? gx : o === 2 ? gy + gx : gy - gx, r = ((f % 6) + 6) % 6, diag = o >= 2;
  if (r === 0 || (diag && r === 1)) return hashInt(gx >> 1, gy >> 1, 21) % 11 === 0 ? 1 : 2; // furrow + clods
  if (r === (diag ? 2 : 1)) return (gx & 3) === 1 && hashInt(gx >> 2, gy, 22) % 3 === 0 ? 2 : 3;
  return 3;
}
function edgePass(mat, col, W, H) { // mat: 0 grass, 1 tall, 2 road, 3 field
  for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) {
    const k = j * W + i, m = mat[k];
    if (m === 3) { if (mat[k - 1] !== 3 || mat[k + 1] !== 3 || mat[k - W] !== 3 || mat[k + W] !== 3) col[k] = mat[k + W] !== 3 ? 1 : 2; }
    else if (m === 1) { if (mat[k + W] !== 1) col[k] = 1; else if (mat[k - W] !== 1 || mat[k - 1] !== 1 || mat[k + 1] !== 1) col[k] = 2; }
    else if (m === 0 && (mat[k - W] === 3 || mat[k - W] === 1)) col[k] = ((i + j) & 1) ? 2 : 3; // dithered drop shadow
  }
}
```

Pixel-snapped blit and the nearest-neighbour upscale with LCD grid:

```js
const PS = 2; // world units per art pixel
function blit(ctx, img, x, y, ax = 0.5, ay = 1) { // world coords, buffer transform = 1 / PS
  ctx.drawImage(img, Math.round(x / PS - img.width * ax), Math.round(y / PS - img.height * ay));
}
function present(display, buffer, up) {
  const d = display.getContext('2d');
  d.imageSmoothingEnabled = false;
  d.drawImage(buffer, 0, 0, buffer.width * up, buffer.height * up);
  if (up >= 3) {
    d.fillStyle = 'rgba(250,228,180,0.2)';
    for (let x = 0; x < display.width; x += up) d.fillRect(x, 0, 1, display.height);
    for (let y = 0; y < display.height; y += up) d.fillRect(0, y, display.width, 1);
  }
  const W = display.width, H = display.height;
  const g = d.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.hypot(W, H) * 0.58);
  g.addColorStop(0, 'rgba(42,23,18,0)'); g.addColorStop(1, 'rgba(42,23,18,0.16)');
  d.fillStyle = g; d.fillRect(0, 0, W, H);
}
```

## Adapting it to your project

- **Keep fixed:** exactly four shades ordered dark -> light, 1 art px = 2 world units (or a consistent equivalent ~180 px tall view), auto ink outline, dither-only shading, palette-inversion flash, LCD overlay, double-bordered windows.
- **Palette swaps are allowed** as long as you keep four shades of one hue family with similar value steps (luminance roughly 10% / 25% / 55% / 85%): e.g. a green "pea" LCD `#0f380f #306230 #8bac0f #9bbc0f`, an icy blue, a grape purple. Swap all four at once - never mix two tints.
- **New character designs:** start from an existing grid size class (10x12 small, 11x14 floater, 26x27 large), make the silhouette unique first, then the value mass (mostly dark vs. mostly light). Add at most one distinctive detail (horn, tail, crown).
- **Mixing elements:** the characters and props work on any light, low-contrast ground; if you pair them with another style's world, snap that world to the four shades and keep ink off the ground. Using this world under another style's characters works best if those characters are re-coloured to the four shades and given the 1 px ink outline.
- **Other genres:** for side-view platformers use the same grids at ~16 px tall characters and tile the ground with the same patterns (furrows become brick rows). For RPG towns, plazas with Worley flagstones and the text-grid props carry over directly.
- **Other resolutions:** change only the integer upscale factor; never scale the art buffer by a non-integer. Below `up = 3` drop the LCD grid lines but keep the vignette.

## Performance notes

- All sprite variants (facing, inverted, faded, puffs, halos, shadows, number strings) are baked once; per frame it is only `drawImage` at integer coordinates into a ~320x180 buffer.
- Ground chunks (128x128 art px) are generated by a generator function that `yield`s every 16 rows, so chunk baking spreads over frames. The expensive noise field (`fieldsAt`, two Voronoi lookups + Perlin warps + fbm) is sampled on a coarse 4 px grid and bilinearly interpolated; only flagstones use per-pixel Worley.
- Writing pixels through a `Uint32Array` over ImageData is ~10x faster than `fillRect` per pixel.
- The LCD overlay is cached per display size and composited with a single `drawImage`.
- Number sprites are cached by string (cleared after 400 entries); shadows by size.
- Hot spot: fast camera movement requesting many new ground chunks at once.

## Copy-paste prompt

```text
Use the Kürbis-Boy art style (pumpkin-tinted 4-colour handheld LCD) for my project: <X>.
- Exactly four colours everywhere: #2a1712 ink, #7c3a1e rust, #e0812c pumpkin, #f6d7a1 cream. No other colour, no alpha.
- Render into a low-res buffer: 1 art pixel = 2 world units (view = 180 art rows), integer upscale, smoothing off, then an LCD grid.
- Sprites are char grids converted to palette indices, auto-outlined with 1 px ink; the main character also gets a cream halo.
- Pose figures from parts (legs table, arm table, head, scarf or leaf crown) and bake each pose once.
- Animate with held poses: 8-pose walk (contact/down/passing/up) with counter-swinging arms, the head landing a frame late,
  a scarf that flaps a frame behind; 4-frame squash & stretch hops; an eased 8-step ghost float; per-actor phase offsets.
- States: dash wind-up -> stretch + checker afterimages -> skid; hit = inverted palette + squash + 2 px recoil;
  appear = dirt mound -> climb out -> land (ghosts fade in through dither levels); disappear = inverted pop -> 4-frame puff.
- Ground: a calm cream meadow; pumpkin 'v' tufts gather along roads, fields and tall grass; flowers in small beds;
  pumpkin roads with rust specks, furrowed fields, 4x4 tall-grass motif, flagstone plazas, dithered drop shadows. No ink on the ground.
- Effects layered: cross flash -> X sparks -> far dots; puffs, debris, tumbling leaf scraps, a lingering puff;
  diamond rings on collect; a dithered light column for big moments.
- UI: cream panels with double ink borders, pixel font, dithered bars, blinking steps(1) cursors.
```
