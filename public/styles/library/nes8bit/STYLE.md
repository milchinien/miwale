# 8-Bit Arcade — Game Art Style Spec

> A lost NES cartridge: strict 2C02 palette, black-outlined 3-colour sprites, tile-language meadows and checker-flicker ghosts.

Everything should look like it ships on a forgotten NES/Famicom cartridge. Every colour comes from the NES PPU (2C02) palette. Every sprite uses at most three colours plus a 1-px pure-black outline. The world is made of flat colour areas with hard, tile-like edges: a dark-green meadow with light-green lips, brown forest floor behind black cliff lines, ochre dirt roads, navy ponds with a blue ring, and grey brick plazas dotted with tombstones. Nothing is anti-aliased, nothing has a gradient, and the world uses no alpha. Transparency is drawn as a checkerboard and blinking as sprite flicker, so the screen reads like real 1986 hardware. The cast drawn in this style: a main character with a round orange pumpkin head and a carved yellow face in blue overalls, small purple root creatures with leafy tops, white floating ghosts with checkered tails, and a large purple-and-ochre root giant. Everything below is written so you can apply it to any top-down or side-view project.

## At a glance

| | |
| --- | --- |
| Family | Pixel Art · NES 8-bit |
| Mood | nostalgic, punchy, playful, arcade, crisp |
| Best for | top-down action games, arcade shooters, Zelda-like adventures, retro platformers, quick prototypes with strict rules |
| Renderer | Canvas 2D, procedural; all sprites are text grids baked at init |
| Pixel art | yes, 1 art pixel = **1.5 world units** (360-unit-tall view = **240 art rows**, NES height) |
| Complexity | 3/10: small sprites as text grids; the strict NES rules help because there are fewer decisions |
| Fonts | Press Start 2P (Google Fonts) |
| Key colours | `#005800` meadow · `#503000` forest floor · `#AC7C00` road · `#E45C10` main character · `#940084` creatures · `#FCFCFC` ghosts · `#000000` outlines |

## When to use it

- **Good fits:** top-down action and arena shooters, Zelda-like adventures, platformers, score-attack arcade games, short prototypes. The constraints make new assets fast to produce and keep everything consistent.
- **Good when** many figures share the screen. Black outlines and saturated flat colour keep a crowd readable on the busy ground.
- **Bad fits:** atmospheric horror or moody lighting (there is no light system), painterly or soft cozy projects, and designs that need many subtly different figure types (3 colours per sprite leave little room for nuance).
- **Bad for** UI-heavy strategy with dense text, because the 8-px font is big and chunky.

## Color palette

All values are from the NES 2C02 master palette (the module's `P` table). Use **nothing else** in the world.

| Swatch | Hex | Role |
| --- | --- | --- |
| Black `k` | `#000000` | outlines, cliff lines, shadows, HUD/menu background |
| White `w` | `#FCFCFC` | ghosts, tombstones, HUD text, window borders, sparks |
| Light grey `g1` | `#BCBCBC` | plaza highlight, stones, dead trees |
| Mid grey `g2` | `#7C7C7C` | plaza bricks, rocks |
| Meadow `gr0` | `#005800` | grass base (~50 % of the screen) |
| Leaf green `gr1` | `#00A800` | tufts, grass lip, canopy, leaves on sprites |
| Light green `gr2` | `#58D854` | canopy/bush highlight |
| Dark brown `br0` | `#503000` | forest floor, road edge, large-creature feet |
| Ochre `ochre` | `#AC7C00` | road, forest lip, autumn canopy, large-creature body |
| Sand `sand` | `#F0D0B0` | road lip at water, light pebbles |
| Cream `cream` | `#FCE0A8` | creature faces/bodies, seed projectile, lantern glass |
| Dark red `red0` | `#881400` | tree trunks, empty hearts, leaf litter |
| Crimson `crim` | `#A80020` | spare accent |
| Red `red` | `#F83800` | hearts, HUD labels, burst rays, flash colour |
| Orange `orange` | `#E45C10` | main character's head, pumpkins, projectile trail |
| Light orange `lorange` | `#FCA044` | spare accent |
| Gold `gold` | `#F8B800` | large collectibles, highlighted numbers, lantern glow, flowers |
| Yellow `yellow` | `#F8D878` | main character's carved face, autumn highlight |
| Navy `navy` | `#0000BC` | water base |
| Blue `blue` | `#0058F8` | water ring, small-collectible shade |
| Royal blue `blue2` | `#0078F8` | main character's overalls |
| Cyan `cyan` | `#3CBCFC` | ghost tails, small collectibles, progress-bar fill, wave tops |
| Ice `ice` | `#A4E4FC` | spare accent |
| Purple `purple` | `#940084` | small-creature heads, large-creature head, lantern cap |
| Magenta `magenta` | `#D800CC` | second small-creature palette |
| Pink `pink` | `#F878F8` | large-creature flash |
| Violet `violet` | `#6844FC` | spare accent |

**Palette rules**

- **Max 3 colours + black per sprite part.** The main character is built like two stacked NES sprites: the head uses orange, yellow and green, and the body uses blue and green.
- **Ground ratio:** about 50 % `#005800`, 25 % `#503000`, 10 % `#AC7C00` road, and the rest water, stone and decals.
- **Creature families are palette swaps** of one grid: the purple and magenta root creatures share a sprite.
- **Flash is a palette swap**, never an overlay: main character → white head and red body, root creature → red and white, ghost → yellow and red, large creature → pink, white, yellow and red.
- **Pure black** is only for outlines, cliff lines, dithered shadows and UI windows.

## Typography

**Press Start 2P**, weight 400. Google Fonts: `https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap`

- It is used for everything. Use sizes that are multiples of 8 px: 8 px for hints, 16 px for labels and stats, 24 px for the main counter, 32 px for the clock and titles.
- Labels are **UPPERCASE in red `#F83800`** (`-LIFE-`, short bar labels, the caption under the clock). Values are white `#FCFCFC`. Titles and card names are gold `#F8B800`.
- No text shadows, no outlines, `letter-spacing: 0`. Blinking uses `steps(1)`.

```css
.label { font: 16px/1 'Press Start 2P', monospace; color: #f83800; text-transform: uppercase; }
.value { font: 16px/1 'Press Start 2P', monospace; color: #fcfcfc; text-shadow: none; }
.clock { font: 32px/1 'Press Start 2P', monospace; color: #fcfcfc; }
```

On canvas, draw text into the low-res art buffer at 8 px (the font's native 8×8 grid) so it upscales with the pixels.

## Rendering technique

1. **Art buffer.** `PS = 1.5` world units per art pixel. The upscale factor is `up = max(1, round(screenH / 240))`, and the buffer is `ceil(screenW / up) × ceil(screenH / up)`. Draw everything into the buffer with `imageSmoothingEnabled = false`, then `drawImage(buffer, 0, 0, bw * up, bh * up)` onto the display.
2. **Bake at init.** Every sprite comes from the `mk(rows, map, opt)` builder. A text grid (one char per pixel, `.` = empty) plus a char→hex map becomes a small canvas, with a 1-px black outline added on every empty pixel whose 4-neighbour is filled. Each sprite is baked as `{r, l}` (right and left facing, `l` = horizontal flip), for 2 frames and every palette variant (normal, flash, checker see-through copy).
3. **Bake ground per chunk.** Chunks are 256 world units = 171 × 171 px. The material map is evaluated per 2×2 px block, then each pixel gets its base colour or an edge colour, then decals are stamped. A generator `yield`s every few rows so baking never stalls a frame.
4. **Per frame, in this order:** ground chunks (integer positions) → animated water waves → all shadows → y-sorted props, creatures and main character → orbiting lanterns → projectiles → particles → floating numbers → (display) optional scanlines.
5. **Snap everything.** The blit helpers convert world → screen with `Math.round(x * S + ox)` and draw at an integer anchor (`feet`: bottom-centre, `mid`: centre). Never draw a sprite at a fractional position or with a transform scale.
6. **CRT hint.** Only when `up ≥ 3`, a pattern darkens the bottom display row of every art-pixel row with `rgba(0,0,0,0.16)`. This is the only alpha in the whole style, and it lives in display space.

## World and ground

The ground is a top-down overworld of flat material areas. There are five materials, decided per 2×2 art-pixel block (this gives the chunky 2-px stair steps of NES tiles), at 1 art pixel = 1.5 world units:

| Material | Rule (reference) | Base | Edge colours |
| --- | --- | --- | --- |
| Plaza | octagonal rect, 88–132 × 60–92 px, `cut = 6`, ~42 % of 460-px cells | brick tile | black outer ring, light-grey `#BCBCBC` second ring |
| Water | warped noise `/520` < 0.335 | `#0000BC` | black outer ring, blue `#0058F8` second ring |
| Road | distance to 2 domain-warped Perlin zero-lines < 11 world units | `#AC7C00` | sand `#F0D0B0` next to water, dark brown `#503000` next to grass/forest |
| Forest floor | warped noise `/640` > 0.555 | `#503000` | **black** cliff line next to grass, ochre lip next to road/water |
| Grass | everything else | `#005800` | leaf-green `#00A800` lip next to any other material |

Priority when classifying a block: plaza > water > road > forest > grass. The overall ratio is about 50 % grass, 25 % forest floor, 10 % road, the rest water, stone and decals.

**Edges are the tile language.** Every boundary is a single 1-px line (or a 2-ring for water and plazas), never a blend: grass gets a leaf-green lip, forest floor sits behind a black cliff line where it meets grass, roads get a dark-brown edge and a sand lip at water.

**Brick tile.** 12 × 6 px running bond, with rows offset by 6. Mortar (`ly === 5` or `lx === 11`) is black. The top-left 5×1 and 1×3 of each brick is `#BCBCBC`, and the rest is `#7C7C7C`. Every ~10th brick gets a 4-px black crack.

**Decals** are glyphs (`[dx, dy, colour]` triplets built from text rows). One glyph is stamped per hashed grid cell, only on its own material and never on edge pixels:

- grass tufts on an 8-px grid (`'a.a' / '.a.'`, `'a.a.a' / '.a.a.'`, and others) in `#00A800`. Density follows big fbm patches (`0.3 + dn * 0.5`), and where `dn > 0.6` the 3-row "tall grass" variants are used
- flowers on a 19-px grid: `'.w.' / 'w.w' / '.w.'` in white or gold
- forest leaf litter on a 5-px grid (42 %): single `#881400`/`#AC7C00` pixels and 2-px pairs; black 3-px twigs on a 17-px grid
- road pebbles on a 7-px grid (32 %): `#503000` dots, with `#F0D0B0` highlights

**Water** gets anchors on an 11 × 7 px grid (only where the whole 9 × 6 neighbourhood is water). A 5 × 2 px wave glyph in cyan `#3CBCFC` or blue `#0058F8` toggles between two shapes at 2.2 Hz. This is the only per-frame animation of the ground.

**No noise texture.** Surfaces are flat fills; all texture comes from the decal glyphs above.

## Characters

Every figure is a text grid run through the same `mk` builder, so all of them share the 1-px black auto-outline, ≤ 3 colours + black per part, 2 frames and a horizontal flip for facing. Figure families differ by **silhouette first, palette second**.

### Main character

A round orange pumpkin head with a carved yellow face and a green stem, on a small body in blue overalls with green vine sleeves. The grid is 13 px wide and 19 rows tall. With the outline that is 15 × 21 px, about 22 × 31 world units. Verbatim from the module:

```text
......gg.....   HEAD (10 rows)          o = #E45C10 orange
.....gg......                           y = #F8D878 yellow (carved face)
..ooooooooo..                           g = #00A800 green (stem, vine sleeves)
.ooooooooooo.                           b = #0078F8 blue overalls
oooooyoooyooo   <- eyes (1-px peaks)    k = #000000 shoes
ooooyyyoyyyoo
ooooooooooooo
ooooyoyoyoyoo   <- zig-zag mouth
.oooyyyyyyyo.
..ooooooooo..
...ggggggg...   BODY (7 rows)
..ggbbbbbbb..
.gg.bbbbbbbb.
...bbbbbbbbbg
..gbbbbbbbbb.
..bbbbbbbbbb.
..bbbbbbbbb..
....bb.bb....   LEGS frame 0  |  frame 1: '...bb...bb...'
...kkk.kkk...                 |           '..kkk....kk..'
```

- **Proportions:** the head is more than half the height (10 of 19 rows). A big readable face makes the character, and the body is a simple block.
- **Face:** made only from the second colour cut into the head (yellow on orange). Eyes are 3-px triangles and the mouth is an alternating row.
- **Frames:** 2 walk frames (legs together / legs apart). Idle has no leg change, just a 1-px bob at 1.8 Hz.
- **Facing:** a horizontal flip of the baked canvas (`{r, l}`).
- **Flash:** the flash palette `{o: white, y: red, g: white, b: red}` for the first 0.4 s, then flicker (skip drawing when `frame & 2`).
- **Afterimages:** when moving fast, 2 afterimages 9 and 18 world units behind, all orange, with `checker: 0` and no outline.
- **Shadow:** a 12-px checker-dithered black ellipse (12 × 4) under the feet. It is skipped on flicker frames.

### Small creature (root creature)

14 × 15 px: a purple root creature with a leafy green top, a round purple head with black slit eyes, and a cream lower half with a checkered `k/c` mouth of teeth. One row of legs alternates between 2 frames, and the sprite lifts 1 px on frame 1 (a hop). Palette variants: `P = #940084` or `#D800CC`, `c = #FCE0A8`, `g = #00A800`. Shadow: 12 px.

```text
...gg.g.gg....
....ggggg.....
......g.......
....PPPPPP....
..PPPPPPPPPP..
.PPPkPPPPPPkP.
.PPPPkkPPkkPP.
.PPPPckPPckPP.
.PPPPccPPccPP.
.cPcPcPcPcPcP.     <- checker seam between the two colour bands
.cccccccccccc.
..cckckckckcc.     <- teeth
...cckkkkkkc..
....cccccc....
...c..cc..c...     legs frame 0 (frame 1: '....c.cc.c....')
```

### Fast floating creature (ghost)

A 13-px-wide white `#FCFCFC` head with cyan `#3CBCFC` shading on the left and lower edge, black eyes and an open black mouth, plus a 6-row tail that tapers to a single pixel. The tail is built with `tailFrom: 10`: rows from 10 on keep only pixels where `(x + y + parity) & 1 == 0` and get **no outline**. Two parities are baked, and the parity flips with the frame counter, so the tail shimmers like NES flicker transparency. It hovers 3–4 px above an 8-px shadow, and its 2 tail frames (the second one curls to the right) alternate at 3 Hz.

### Large creature (root giant)

22 × 27 px. The top is a purple `#940084` root head with a leafy green crown and gold `#F8B800` eyes under black brows. The body is ochre `#AC7C00` with dark-brown `#503000` cracks and a checkered black mouth, with long arms hanging at both sides, joined to the head by a checker seam row. Legs have 2 frames with dark-brown feet, each footfall spawns a small grey dust sprite, and it casts a 24-px shadow. Its flash palette is pink `#F878F8`, white, yellow and red. When removed it disappears in a big burst (`R = 1.7`) with 3 extra bursts.

## Props

Props are outlined sprites standing on the ground, drawn with the same `mk` builder and NES rules as the figures: 1-px black outline, ≤ 3 colours + black, flat fills, light on the upper left, black on the lower right. They are blitted at their feet (bottom-centre) on whole art pixels and y-sorted with the figures.

- **Round trees** 24 × 28 px: 7 overlapping canopy circles over a dark-red `#881400` trunk (rows 17–27, black right edge, flared foot). Each canopy pixel belongs to its last circle; the lower-right rim (`dd > 0.72 && nx + ny > 0.45`) is black, the upper-left crescent (`nx + ny < -0.55`, `0.3 < dd < 0.9`) is the light colour, and a global checker shade (`gx + gy > 0.55`, every other pixel black) is laid over the lower right of the canopy. Green: `#00A800` with `#58D854` highlight; 16 % are autumn: `#AC7C00` with `#F8D878` highlight. Dense in forests, rare on meadows, never on roads.
- **See-through trees:** every tree also has a `see` variant (a checker copy, `checker: 0`) that is drawn instead when a figure stands behind it, so nothing is hidden and no alpha is needed.
- **Dead trees** 22 × 30 px in forests (12 % of forest trees): a 3-px light-grey `#BCBCBC` trunk with a mid-grey `#7C7C7C` right side, forked bare branches, a few black knot pixels.
- **Bushes** 18 × 10 px: 4 canopy circles with the same rim/crescent rule in `#00A800` / `#58D854`.
- **Rocks** 8 × 5 and 5 × 4 px: light-grey top-left, mid-grey body.
- **Pumpkins** 11 × 8 px in small patches of 1–3: orange `#E45C10` with dark-red `#881400` ribs and a green stem, plain (two yellow glints) or carved (gold `#F8B800` face).
- **Fences** 16 × 9 px in short runs of 2–5: ochre pickets with two dark-brown rails.
- **Signposts** 11 × 11 px beside roads: an ochre board with dark-brown writing lines on a dark-brown post.
- **Tombstones** in 4 shapes (rounded, cross, small rounded, slanted), 7–10 rows tall: white `#FCFCFC` with a light-grey right side and base and a black cross. In rows on the brick plazas and alone at forest edges.
- **Stone statue** 14 × 22 px in the middle of each plaza: a white-and-light-grey stone pumpkin with a black carved face on a stepped pedestal.
- **Shadows** (checker ellipses) go only under trees (20 px), dead trees (12 px) and the statue (16 px); small props stand directly on the ground.

## Effects and particles

All effects are built procedurally on tiny pixel grids at init, use only palette colours and are blitted at whole art pixels. Fading is done by blinking, never by alpha.

- **Disappear burst:** 4 procedural frames on an odd `ceil(18R)` square, no outline: (0) white core + gold cross; (1) white disc, gold ring, red diagonal rays; (2) red/gold checker ring; (3) 8 red/gold bits flying out. Each frame lasts 1/4 of 1 s. `R = 1` for small figures, 1.7 for the large creature.
- **Appear puff:** 3 frames on a 17 × 15 grid. Overlapping white circles with a light-grey bottom grow, then 7 grey dots in a ring without outline. 0.2 s per frame, and the last frame lingers over the newly appeared figure.
- **Impact particles:** 2 square particles (2 px) in the struck figure's own two colours (root creature: cream + purple; ghost: white + cyan), plus a 1-px white spark for 0.08 s. Gravity 160.
- **Debris burst:** 6 particles (14 for the large creature), speed 50 to 70, gravity 220, life 0.6–0.9 s. They **blink** (skip odd frames) in their last 30 %.
- **Star sparkle:** a 3-frame star: 3×3 white plus, 5×5 star with gold arms, 4 corner dots. Cyan for small collectibles. Used when something is collected, on a flash, and as a ring of 10 stars for a big moment.
- **Collectibles:** small ones are 5 × 6 px cyan/blue diamonds and large ones are 7 × 8 px gold/orange, both with a white facet and outlined. They spin through 4 frames whose width shrinks to a sliver.
- **Orbiting lantern:** a 9 × 10 px purple-capped cream lantern with a green handle, whose glass blinks between gold and white at 4 Hz.
- **Projectile:** a 2×2 cream/white seed (outlined to 4×4) that alternates colour every frame. A 1-px gold/cream dot 4 px behind and an orange dot 7 px behind form the trail.
- **Dust:** 3 × 3 grey/white plus and a 4-dot corner frame, no outline, 0.3–0.4 s; under heavy footfalls and behind fast movement.
- **Floating numbers:** 3×5 bitmap digits, white, 1-px gaps, 8-neighbour black outline (`diag: true`). Highlighted numbers are gold at 2× scale. Cache per value.

## Atmosphere and lighting

- **No lighting.** The world is evenly lit with flat colour, and light is implied only by sprite highlights (upper-left on canopies, bushes, stones) and blinking glows (lantern glass, white-hot burst cores).
- **Shadows** are black ellipses `w × round(w/3)` where only checker pixels are set (`(x + y + par) & 1`). Two parities are baked, and the one where `(screenX + screenY) & 1` matches is picked so the dither stays locked to the screen grid. Sizes: 8 (ghost), 12 (main character, small creature, dead tree), 16 (statue), 20 (tree), 24 (large creature). All shadows are drawn before any sprite.
- **Transparency** is always a checkerboard (ghost tails, afterimages, see-through trees, shadows), never alpha.
- **Flicker:** a blinking figure, fading particles (last 30 %) and fading numbers (last 25 %) skip drawing when `frameCounter & 2`.
- **Post:** none in the world: no vignette, no glow, no colour grading, no fog. On the display only, when `up ≥ 3`, faint scanlines darken one display row per art row (`rgba(0,0,0,0.16)`).
- **Frame:** the black HUD bar across the top acts as the screen frame; letterbox areas are black `#000000`.
- **Menus dim** the world with a **checker dither** (CSS `repeating-conic-gradient(#000 0 25%, transparent 0 50%) 0 0 / 8px 8px`), never with a translucent overlay.

## UI

The HUD is a solid **black status bar** across the top, like an NES status area, all in Press Start 2P:

- Left: a red `-LIFE-` label, then a row of hearts. Each heart is the 8 × 7 grid `'.rr.rr..','rWrrrrr.','rrrrrrr.','rrrrrrr.','.rrrrr..','..rrr...','...r....'`, drawn at 3× (24 × 21 px). Full hearts are red with a white glint, empty hearts are `#881400`. The bar is a repeat-x of hearts clipped to the fill percentage, with a white `100/100` beside it.
- Centre: the clock in 32 px white, with a 16 px red uppercase caption below.
- Right: a counter: a 48-px creature icon, a gold `×` and the count in white.
- Below: a short red label and a 16-px-tall progress bar with a 4-px white frame. The fill repeats 8 px cyan, 4 px blue, 4 px black, giving a segmented meter. A white `LV 4`-style tier label sits at the right.
- **Windows** (choice cards, pause, stats) are black with a double white border, made from box-shadow rings. A blinking white triangle cursor marks the selected card. Card names are gold and keys are red.

```css
.hud { font-family: 'Press Start 2P', monospace; color: #fcfcfc; background: #000;
  padding: 14px 32px 12px; box-shadow: 0 4px 0 #000; image-rendering: pixelated; }
.hud .label { font-size: 16px; color: #f83800; text-transform: uppercase; }
.bar { height: 16px; background: #000; box-shadow: 0 0 0 4px #fcfcfc; border-radius: 0; }
.bar-fill { height: 100%; transition: none;
  background: repeating-linear-gradient(90deg, #3cbcfc 0 8px, #0058f8 8px 12px, #000 12px 16px); }
.window { background: #000; border: 4px solid #fcfcfc; border-radius: 0;
  box-shadow: 0 0 0 4px #000, inset 0 0 0 4px #000, inset 0 0 0 8px #fcfcfc; }
.dim { background: repeating-conic-gradient(#000 0 25%, transparent 0 50%) 0 0 / 8px 8px; }
.blink { animation: nesblink 1s steps(1) infinite; }
@keyframes nesblink { 0% { opacity: 1; } 50% { opacity: 0; } }
```

Icons are 16 × 16 text-grid sprites with the same palette rules. Render them as pixelated SVG data URLs (`shape-rendering='crispEdges'`, one `<rect>` per run) or as canvases scaled by an integer factor.

## Motion and animation

- **2 frames for everything.** Main character walk: `floor(anim) & 1`. Small creature: `floor(anim * 1.6) & 1`, with a 1-px hop on frame 1. Large creature: `floor(anim * 1.2) & 1`, with a dust puff on each frame change. Ghost tail: 3 Hz, plus a hover toggle of 3/4 px at 2 Hz.
- **Idle bob:** 1 px at 1.8 Hz. **Collectible spin:** sequence `0,0,0,1,2,3` at 9 fps, 1-px bob at 2.5 Hz, and a pop arc of up to 8 px when it appears.
- **2-frame toggles** for the world: water waves at 2.2 Hz, lantern glass at 4 Hz.
- **Snap, don't ease.** Positions are rounded to art pixels every frame, and the camera moves in whole pixels. UI has `transition: none` and blinks use `steps(1)`.
- **Flicker = invisibility.** For blinking figures, fading particles (last 30 %) and fading numbers (last 25 %), skip drawing when `frameCounter & 2`.
- **Disappear:** a 4-frame burst over 1 s. **Appear:** a 3-frame puff over 0.6 s before the figure shows up.

## Do and don't

**Do**

- Encode every sprite as a text grid plus a char→colour map, and let the builder add the black outline.
- Keep each sprite to 3 colours + black, all from the NES palette table.
- Round every blit to whole art pixels and upscale with smoothing off.
- Use checker pixels for transparency and shadows, and flicker for blinking.
- Create creature variants by palette swap before drawing new grids.
- Give every ground boundary a 1-px lip or a black cliff line.
- Use Press Start 2P at multiples of 8 px, with uppercase red labels.

**Don't**

- Don't use gradients, glows, blur, alpha fades or anti-aliased shapes in the world.
- Don't use colours outside the NES palette (no `#333`, no pastel mixes).
- Don't use coloured or 2-px outlines.
- Don't rotate or scale sprites. Bake extra frames or flips instead.
- Don't animate ordinary figures with more than 2 frames.
- Don't use rounded, blurred or tweened UI.
- Don't put noise textures on the ground. Use only flat fills and glyph decals.

## Implementation recipe

1. Set the view: 360 world units tall, `PS = 1.5`, a 240-row art buffer, integer upscale `up = max(1, round(screenH / 240))`, smoothing off.
2. Copy the NES palette table (`PALETTE` in `starter.js`) and the `mk(rows, map, opt)` sprite builder.
3. Draw your main character as a ~13 × 19 text grid: a big head with a 2-colour face, a small body in 1–2 colours, and 2 leg rows × 2 frames. Bake `{r, l}` for both frames, plus a flash palette.
4. Draw each creature family as one grid (small: ~14 × 15, large: ~22 × 27) and palette-swap it for variants. Floating or ethereal creatures get a checker tail (`tailFrom`, two parities).
5. Build effect frames procedurally on small grids: burst (4 frames), puff (3), star (3), collectible spin (4), 3×5 digits.
6. Ground: define 3–5 materials from noise or level data on a 2×2 px block grid. Fill base colours and apply the edge table (lip, cliff or ring), then stamp decal glyphs on hashed grid cells. Bake per chunk with a generator.
7. Props: build trees and bushes procedurally from circles (light upper-left crescent, black lower-right rim, checker shade). Write rocks, tombstones, fences and signs as grids.
8. Each frame: blit chunks → 2-frame tile animations → checker shadows → y-sorted figures and props → orbiting objects → projectiles → particles → numbers, all at rounded art-pixel positions.
9. HUD: a black bar, Press Start 2P, red labels, a heart row, a segmented progress bar, and double-bordered black windows. Dim the world with checker dither.
10. Check: zoom into a screenshot and verify that every pixel is a palette colour, every sprite has a black 1-px rim, and no pixel is blended.

## Code

Everything below runs on its own. `starter.js` contains the full preview scene (ground baker, all sprites, HUD). The complete reference module is `../../js/styles/nes8bit.js`.

**1. The sprite builder: text grid → outlined NES sprite (ported 1:1).**

```js
function mk(rows, map, opt = {}) {
  const h = rows.length, w = Math.max(...rows.map((r) => r.length));
  const o = opt.outline === false ? 0 : 1, W = w + 2 * o, H = h + 2 * o;
  const cell = new Array(W * H).fill(null), src = new Uint8Array(W * H);
  const tailFrom = opt.tailFrom ?? 1e9, par = opt.parity || 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < rows[y].length; x++) {
    const c = map[rows[y][x]]; if (!c) continue;
    const i = (y + o) * W + x + o;
    if (y >= tailFrom) { if (((x + y + par) & 1) === 0) cell[i] = c; src[i] = 2; } // checker tail, no outline
    else { cell[i] = c; src[i] = 1; }
  }
  if (o) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; if (src[i]) continue;
    let n = (x > 0 && src[i - 1] === 1) || (x < W - 1 && src[i + 1] === 1) || (y > 0 && src[i - W] === 1) || (y < H - 1 && src[i + W] === 1);
    if (!n && opt.diag) n = (x > 0 && y > 0 && src[i - W - 1] === 1) || (x < W - 1 && y > 0 && src[i - W + 1] === 1) ||
      (x > 0 && y < H - 1 && src[i + W - 1] === 1) || (x < W - 1 && y < H - 1 && src[i + W + 1] === 1);
    if (n) cell[i] = '#000000';
  }
  if (opt.checker !== undefined) for (let i = 0; i < W * H; i++) if ((((i % W) + ((i / W) | 0)) & 1) !== opt.checker) cell[i] = null;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d'), img = ctx.createImageData(W, H);
  cell.forEach((hex, i) => { if (!hex) return; const v = parseInt(hex.slice(1), 16);
    img.data.set([v >> 16, (v >> 8) & 255, v & 255, 255], i * 4); });
  ctx.putImageData(img, 0, 0);
  return c;
}
// usage: a ghost (head rows 0-9 solid, tail rows 10+ checkered), two parities
const GHOST_ROWS = ['...WWWWW.....', '..WWWWWWW....', '.WWWWWWWWW...', '.WWWkkWWkkW..', '.WWWkkWWkkW..', '.BWWWWWWWWWW.',
  '.BWWWWkkWWWWW', '.BBWWkkkkWWW.', '..BWWWkkWWW..', '..BBWWWWWWB..', '..BBBWWWWBB..', '...BBWWWBB...', '...BBBWBB....',
  '....BBBB.....', '....BBB......', '.....B.......'];
const ghost = [0, 1].map((p) => mk(GHOST_ROWS, { W: '#FCFCFC', B: '#3CBCFC', k: '#000000' }, { tailFrom: 10, parity: p }));
```

**2. Pixel-snapped blitting and the low-res buffer.**

```js
const PS = 1.5;                                        // world units per art pixel
function setupBuffer(display) {
  const up = Math.max(1, Math.round(display.height / (360 / PS)));
  const buf = document.createElement('canvas');
  buf.width = Math.ceil(display.width / up); buf.height = Math.ceil(display.height / up);
  return { buf, ctx: buf.getContext('2d'), up };
}
// world -> art pixel, always rounded; anchor = bottom-centre of the sprite ("feet")
function blitFeet(ctx, img, wx, wy, cam, lift = 0) {
  const x = Math.round((wx - cam.x) / PS + ctx.canvas.width / 2);
  const y = Math.round((wy - cam.y) / PS + ctx.canvas.height / 2);
  ctx.drawImage(img, x - (img.width >> 1), y - (img.height - 1 + lift));
}
function present(display, b) {
  const d = display.getContext('2d');
  d.imageSmoothingEnabled = false;
  d.drawImage(b.buf, 0, 0, b.buf.width * b.up, b.buf.height * b.up);
  if (b.up >= 3) { d.fillStyle = 'rgba(0,0,0,0.16)'; for (let y = b.up - 1; y < display.height; y += b.up) d.fillRect(0, y, display.width, 1); }
}
```

**3. Tile-language edge rules for the ground (per pixel, after the 2×2-block material map).**

```js
// mat: Uint8Array with a margin M around the chunk, EW = row width. 0 grass, 1 forest, 2 road, 3 water, 4 plaza
function edgeColour(mat, i, EW, C, brick) {
  const m = mat[i], n = [mat[i - 1], mat[i + 1], mat[i - EW], mat[i + EW]];
  const diff = n.some((q) => q !== m);
  const far = mat[i - 2] !== m || mat[i + 2] !== m || mat[i - 2 * EW] !== m || mat[i + 2 * EW] !== m;
  if (m === 4) return diff ? C.k : far ? C.g1 : brick();          // black ring, light-grey ring, bricks
  if (m === 3) return diff ? C.k : far ? C.blue : C.navy;           // black ring, blue ring, navy
  if (m === 0) return diff ? C.gr1 : C.gr0;                         // light-green lip on grass
  if (m === 1) return n.includes(0) ? C.k : diff ? C.ochre : C.br0; // black cliff vs grass
  return n.includes(3) ? C.sand : diff ? C.br0 : C.ochre;           // road: sand at water, brown edge
}
```

**4. Checker shadow and invulnerability flicker.**

```js
function shadowSprite(w, par) {
  const h = Math.max(2, Math.round(w / 3)), rows = [];
  for (let y = 0; y < h; y++) {
    let s = '';
    for (let x = 0; x < w; x++) {
      const dx = (x + 0.5 - w / 2) / (w / 2), dy = (y + 0.5 - h / 2) / (h / 2);
      s += dx * dx + dy * dy <= 1 && ((x + y + par) & 1) === 0 ? 'k' : '.';
    }
    rows.push(s);
  }
  return mk(rows, { k: '#000000' }, { outline: false });
}
// pick the parity that matches the screen grid so the dither never crawls
const pickShadow = (set, sx, sy) => set[(sx + sy) & 1];
// flicker: skip drawing on every other 2-frame window while a figure blinks
const visible = (frame, blinking) => !(blinking && (frame & 2));
```

## Adapting it to your project

- **Keep fixed:** the NES palette table, 3 colours + black per sprite, the 1-px black auto-outline, 2 animation frames, rounding to art pixels, checker transparency and flicker, Press Start 2P with red uppercase labels, and the black HUD bar.
- **Free to change:** which palette entries you pick for your biome. A dungeon could use `#7C7C7C`, `#BCBCBC` and `#503000` floors with `#881400` lava, and a snow area `#FCFCFC`, `#A4E4FC` and `#0058F8`. The materials and edge table, the sprite grids and the sizes are yours too.
- **New characters:** start from a 13 × 19 (main character) or 14 × 15 (small creature) grid with a big head and face, then palette-swap for variants. Large creatures can be built from several outlined grids stacked (head + body + legs) as long as each part stays at ≤ 3 colours.
- **Mixing elements:** the characters and props work on any flat ground as long as they keep the black outline and palette; the world works with other figures if they are snapped to the same art-pixel grid.
- **Side-view projects:** use the same builder for 16 × 16 tiles. Give the ground surfaces the grass-lip and black-cliff rules and keep the 8-px decal grid.
- **Other resolutions:** keep `PS` so that the view is about 240 rows tall (NES), and only ever upscale by integers.

## Performance notes

- Sprites are tiny canvases baked once at init: 2 frames × 2 facings × palette variants, plus effect frames and shadows in 6 sizes. Floating numbers are cached per value (the cache is cleared after 300).
- Ground: the reference samples the noise fields on an 8-px grid, bilinearly interpolates them per 2×2 block, and bakes 171 × 171 px chunks in a generator that yields every 4–8 rows, so bakes spread over frames.
- Per frame: only `drawImage` blits, a few wave `fillRect`s and the optional scanline pattern. Thousands of figures stay well under 8 ms. The starter scene draws in about 1 ms.
- Avoid per-frame `getImageData`. Keep all pixel loops at bake time.

## Copy-paste prompt

```text
Use the 8-Bit Arcade (NES) art style for my project: <X>.
- Render into a low-res buffer: 1 art pixel = 1.5 world units, view = 240 art rows, integer upscale, imageSmoothingEnabled = false.
- Only use NES 2C02 palette colours: #000000 #FCFCFC #BCBCBC #7C7C7C #005800 #00A800 #58D854 #503000 #AC7C00 #F0D0B0
  #FCE0A8 #881400 #F83800 #E45C10 #F8B800 #F8D878 #0000BC #0058F8 #0078F8 #3CBCFC #940084 #D800CC #F878F8.
- Every sprite is a text grid (one char per pixel) + char->colour map; a builder adds a 1-px pure black outline.
- Max 3 colours + black per sprite part; big heads with 2-colour faces; exactly 2 animation frames; flip for facing.
- Variants and flashes are palette swaps. No gradients, no alpha, no anti-aliasing, no rotation or scaling in the world.
- Transparency = checkerboard pixels (ghost tails, afterimages, shadows, see-through trees); blinking = flicker (skip when frame & 2).
- Ground = flat material areas on a 2x2-pixel block grid: grass #005800 with #00A800 lip, forest #503000 behind a black cliff
  line, road #AC7C00 with #503000 edge, water #0000BC with black + #0058F8 rings, 12x6 grey brick plazas.
- Decals: 2-row grass tufts on an 8-px grid, 3x3 flowers, 1-px leaf litter, pebbles; water waves toggle 2 frames.
- Props: circle-built trees and bushes (light upper-left crescent, black lower-right rim, checker shade), grid rocks, fences, signs, tombstones.
- Effects: 4-frame white/gold/red burst, 3-frame puff and star, 4-frame spinning collectibles, 3x5 bitmap number digits.
- Round every blit to whole art pixels; snap, never ease. No lighting, no vignette; optional faint scanlines only on the display.
- UI: black status bar, Press Start 2P at 8/16/32 px, red uppercase labels, rows of 8x7 hearts, segmented cyan/blue bar,
  black windows with double white borders, checker-dither dimming behind menus.
```
