# 8-Bit Arcade — Game Art Style Spec

> A lost NES cartridge: strict 2C02 palette, black-outlined 3-colour sprites, tile-language meadows and checker-flicker ghosts.

Everything should look like it ships on a late-era NES/Famicom cartridge. Every colour comes from the NES PPU (2C02) palette. Every sprite part uses at most three colours plus a 1-px pure-black outline, and figures are stacked from several such parts (head, scarf, tunic, face glow) the way NES games layered sprites. The world is made of flat colour areas with hard, tile-like edges: a dark-green meadow with light-green lips and tufts that gather along every edge, brown forest floor behind black cliff lines with a dithered canopy-shade band, ochre dirt roads with worn wheel ruts and pebbly shoulders, navy ponds ringed with cattails, and grey brick plazas dotted with tombstones. Nothing is anti-aliased, nothing has a gradient and the world uses no alpha: transparency is a checkerboard and blinking is sprite flicker. What lifts it above a 2-frame shuffle is the animation: an 8-frame walk with counter-swinging arms, a head that lands one frame after the body and a scarf that flaps a frame behind; hopping root creatures that squash and stretch while their leaf crowns lag; designed appear and disappear sequences. The cast drawn in this style: a main character with a round orange pumpkin head, carved yellow face, green scarf and blue tunic, small purple beet and crimson radish creatures with leaf crowns, white hooded ghosts with checkered tails, and a large beet-headed sack golem.

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
| Dark red `red0` | `#881400` | tree trunks, pumpkin ribs and underside, empty hearts, leaf litter |
| Crimson `crim` | `#A80020` | radish creature top |
| Red `red` | `#F83800` | hearts, HUD labels, burst rays, hit-flash outline, radish highlight, red flower heads |
| Orange `orange` | `#E45C10` | main character's head, pumpkins, projectile trail |
| Light orange `lorange` | `#FCA044` | warm 3-px glint on the main character's head |
| Gold `gold` | `#F8B800` | large collectibles, highlighted numbers, lantern glow, flowers |
| Yellow `yellow` | `#F8D878` | main character's carved face, autumn highlight |
| Navy `navy` | `#0000BC` | water base, main character's trousers, hem and near sleeve |
| Blue `blue` | `#0058F8` | water ring, small-collectible shade |
| Royal blue `blue2` | `#0078F8` | main character's tunic |
| Cyan `cyan` | `#3CBCFC` | ghost tails, small collectibles, progress-bar fill, wave tops |
| Ice `ice` | `#A4E4FC` | spare accent |
| Purple `purple` | `#940084` | beet creature top, large-creature head, lantern cap |
| Magenta `magenta` | `#D800CC` | spare accent |
| Pink `pink` | `#F878F8` | 2-px highlights on creature bulbs, lantern cap glint |
| Violet `violet` | `#6844FC` | spare accent |

**Palette rules**

- **Max 3 colours + black per sprite part.** The main character is stacked from parts like NES sprite layers: head (orange, dark red, light-orange glint), face glow (yellow), stem and scarf (two greens), tunic (royal blue, navy, cream), belt and boots (dark brown). Far limbs are black.
- **Ground ratio:** about 50 % `#005800`, 25 % `#503000`, 10 % `#AC7C00` road, and the rest water, stone and decals.
- **Creature variants are designed, not jittered:** the beet and the radish share the builder but differ in bulb proportions, crown shape and palette.
- **Flash is a palette swap**, never an overlay: main character alternates an all-white and an all-red palette, root creatures and the large creature turn white with a red outline and face, ghosts turn yellow and red.
- **Pure black** is only for outlines, far limbs, faces, cliff lines, dithered shadows and UI windows.

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

**Composed edges.** Inside every forest edge a 2–3 px **canopy-shade band** of black checker pixels (every other pixel within 2 px of grass, a sparser checker at 3 px) gives the forest depth. Roads get two worn **wheel ruts**: dark-brown pixels where the distance to the road centre is 5.4 ± 0.6 world units, broken on ~1 in 7 hashed 8-px cells so they read as tracks.

**Decals** are glyphs (`[dx, dy, colour]` triplets built from text rows), stamped one per hashed grid cell, only on their own material and never on edge pixels. Placement is **clustered, never even**:

- grass tufts on a 6-px grid: within 5 px of any other material 70 % (30 % of them 3-row tall grass) so tufts line every edge; in fbm patches (`/150`) > 0.66 tall grass at 80 %, a 0.58–0.66 rim at 45 %; the open meadow only 1.8 % — calm areas stay calm
- flower beds on a 23-px grid where fbm (`/200`) > 0.6 and no edge within 7 px: 5–7 px glyphs of 3–6 white, gold and red heads with green stems
- forest leaf litter on a 5-px grid in fbm clumps (60 % inside, 5 % outside) in `#881400`/`#AC7C00`; black 3-px twigs only near the forest rim
- road pebbles on a 6-px grid only on the shoulders (within 3 px of the road edge, 55 %)

**Water** gets anchors on an 11 × 7 px grid (only where the whole 9 × 6 neighbourhood is water). A 5 × 2 px wave glyph in cyan `#3CBCFC` or blue `#0058F8` toggles between two shapes at 2.2 Hz. This is the only per-frame animation of the ground.

**No noise texture.** Surfaces are flat fills; all texture comes from the decal glyphs above.

## Characters

Every figure is **posed from parts on a char grid** and run through the same `mk` builder, so all of them share the 1-px black auto-outline and ≤ 3 colours + black per part. Sprites are baked lazily per pose (`key → {r, l}`, `l` = horizontal flip) and the common poses are warmed at init. Figure families differ by **silhouette first, palette second**.

### Main character

A round orange pumpkin head with a carved glowing face, a curled stem with one leaf, a green scarf whose tail trails behind, a blue tunic with a brown belt and a cream buckle, navy trousers and brown boots. Grid 16 × 20 (feet on the last row), with the outline 18 × 22 px ≈ 27 × 33 world units; the visible body is about 12 × 18 px ≈ 18 × 27 units.

- **Parts and colours:** head `o #E45C10` orange, `d #881400` ribs and shaded underside, `h #FCA044` 3-px warm glint upper left, face glow `y #F8D878`; stem/scarf `g #00A800`, `G #005800`, leaf `l #58D854`; tunic `b #0078F8`, hem, trousers and near sleeve `n #0000BC`; hands and buckle `c #FCE0A8`; belt and boots `r #503000`; the far arm and far leg are black `k` so depth reads without extra colours.
- **Head:** a 12 × 9 ellipse (`nx² + ny² ≤ 1.06`), ribs at x = 3 and 8 only on the top two and bottom three rows, underside (`ny > 0.62`) in `#881400`. The face is turned one pixel towards the facing side: two 3-px triangle eyes (1-px peak over a 3-px base) at x = 5 and 9, a 6-px grin with one tooth and a 3-px lower lip.
- **Faces by state:** `blink` = eyes become a dark 3-px line; `hurt` = eyes squeezed into glowing lines and the mouth an open 3 × 2 "O".
- **Walk = 8 computed poses** (contact, down, passing, up × both legs): body offset `[0, +1, 0, -1, 0, +1, 0, -1]` px, legs from a table of 3-row layouts, a hip row fills the gap on "up" frames. Arms counter-swing (near arm back while the near leg is forward, far arm visible in front). The head offset is the **previous frame's body offset** (it lands one frame late), the scarf tail alternates two flap shapes one frame behind the step, and the stem leaf lifts when the head drops.
- **Idle:** breathing on a 1.1 s beat (body down 1 px, head following 0.12 s later), stem leaf flicks at 1.5 fps, blink every 3.4 s for 0.13 s, a two-frame scarf flutter every 4.3 s. Each figure gets its own phase offset, so clones never move in lock-step.
- **Dash:** 50 ms wind-up crouch (body 2 px down, boots wide, arms back) → stretch pose (legs split, head 2 px forward, scarf straight back) with two orange checker afterimages 10 and 20 units behind → 120 ms skid (front boot sliding, body low, head leaning back).
- **Throw:** for ~90 ms after each shot the near arm snaps out at shoulder height.
- **Hurt:** a recoil pose (arms flung up, head tipped back, hurt face) for ~150 ms in a palette that alternates white and red every 4 frames, then classic flicker (skip drawing when `frame & 2`).
- **Shadow:** a 12-px checker-dithered black ellipse under the feet, skipped on flicker frames.

### Small creature (beet / radish)

Grid 15 × 18. A round bulb (purple `#940084` top, cream `#FCE0A8` bottom, one checker row between them, a pink `#F878F8` 2-px highlight upper left), angry black brows over 2 × 2 eyes with a white glint, a black grin with two white teeth, cream root legs and a leaf crown in `#00A800` with a `#005800` base. Two designed variants: the **beet** (purple, round, three-leaf fan crown) and the **radish** (crimson `#A80020` top with a `#F83800` highlight, 0.6 px narrower and one row taller, two long curling leaves).

- **Hop cycle, 4 frames at ~8 fps:** land (squash: half-width 6.3, height 8, legs splayed, crown flops wide) → push (5.3 × 9) → air (stretch: 4.7 × 10, lifted 2 px, legs tucked, crown lags downwards) → fall (5.3 × 9, legs reaching, crown lifts). The phase comes from each creature's seed.
- **Hit (~130 ms):** squash frame, eyes squeezed into lines, open mouth, a 2-px recoil away from the facing side, and a flash palette (white body, red outline and face) on alternating 2-frame windows.
- **Appear (0.45 s):** a dirt mound heaves twice (ochre/brown, 12 px wide) → the creature climbs out (only its top rows show, the mound covers the cut) → it lands in the squash frame.
- **Disappear (0.35 s):** ~100 ms white/red "pop" in the squash pose → the 4-frame burst. Debris, tumbling leaf scraps and a small lingering smoke puff come from the effects layer.

### Fast floating creature (hooded ghost)

Grid 16 × 19: a white `#FCFCFC` hood with a peak, cyan `#3CBCFC` shading along the back and lower body, solid 2 × 3 black eyes with a cyan glint, a mouth that opens for 0.5 s every 2.6 s and a stubby arm reaching forward (2 positions at 3 fps). Rows from 11 down are the tail: tapering, curving back and waving through 4 frames at 7 fps; it is drawn with `tailFrom: 11` (checker pixels, no outline) and the parity flips every 2 frames so it shimmers.

- **Float:** an eased 8-step lift `[0,0,1,2,3,3,2,1]` px (+3 px base) at 5 fps — it holds at the top and bottom instead of a plain sine.
- **Hit:** yellow/red flash palette and a narrower "flinch" body.
- **Appear:** the sheet unrolls from the hood down in checker while flickering. **Disappear:** a yellow/red pop that rises, then the sheet loses rows from the bottom while it floats 14 px up, with a star sparkle.

### Large creature (sack golem)

Grid 28 × 34: a 17-px-wide beet head (purple top, cream lower half, checker seam, pink highlight) with gold `#F8B800` eyes under black brows and a black-and-cream stitched grin, a five-leaf crown, an ochre `#AC7C00` burlap sack body with dark-brown `#503000` hem and sides, a black stitched centre seam and a gold checker patch, swinging ochre root arms with cream fists, and stumpy brown legs with black feet.

- **Stomp, 4 frames:** contact (body drops 1 px, legs apart, crown flops) → passing → contact (other leg) → up (body rises 1 px, crown lifts). Arms swing opposite to the legs. A grey dust sprite puffs at the front foot on each contact.
- **Hit:** squashed contact frame with shut eyes, white/yellow/red flash palette with a red outline. **Appear:** a 20-px mound heaves, the golem climbs out. **Disappear:** pop → large burst (`R = 1.7`) plus 3 extra bursts.

## Props

Props are outlined sprites standing on the ground, drawn with the same `mk` builder and NES rules as the figures: 1-px black outline, ≤ 3 colours + black, flat fills, light on the upper left, black on the lower right. They are blitted at their feet (bottom-centre) on whole art pixels and y-sorted with the figures.

- **Round trees** 24 × 28 px: 7 overlapping canopy circles over a dark-red `#881400` trunk (rows 17–27, black right edge, flared foot). Each canopy pixel belongs to its last circle; the lower-right rim (`dd > 0.72 && nx + ny > 0.45`) is black, the upper-left crescent (`nx + ny < -0.55`, `0.3 < dd < 0.9`) is the light colour, and a global checker shade (`gx + gy > 0.55`, every other pixel black) is laid over the lower right of the canopy. Green: `#00A800` with `#58D854` highlight; 16 % are autumn: `#AC7C00` with `#F8D878` highlight. Dense in forests, rare on meadows, never on roads.
- **See-through trees:** every tree also has a `see` variant (a checker copy, `checker: 0`) that is drawn instead when a figure stands behind it, so nothing is hidden and no alpha is needed.
- **Dead trees** 22 × 30 px in forests (12 % of forest trees): a 3-px light-grey `#BCBCBC` trunk with a mid-grey `#7C7C7C` right side, forked bare branches, a few black knot pixels.
- **Pines** 17 × 31 px in forest interiors (45 % of trees where the forest field is ≥ 0.05 above the edge): three stacked tiers with jagged rims, light-green `#58D854` ticks on the left rims, black checker shade on the right half, a black line under each tier and a dark-red trunk; two designed variants and a checker see-through copy.
- **Cattails** 8 × 10 px in small stands of 1–2 on the grass ring around ponds: green stems with dark-brown `#503000` heads and ochre highlights.
- **Bushes** 18 × 10 px: 4 canopy circles with the same rim/crescent rule in `#00A800` / `#58D854`.
- **Rocks** 8 × 5 and 5 × 4 px: light-grey top-left, mid-grey body.
- **Pumpkins** 11 × 8 px in small patches of 1–3: orange `#E45C10` with dark-red `#881400` ribs and a green stem, plain (two yellow glints) or carved (gold `#F8B800` face).
- **Fences** 16 × 9 px in short runs of 2–5: ochre pickets with two dark-brown rails.
- **Signposts** 11 × 11 px beside roads: an ochre board with dark-brown writing lines on a dark-brown post.
- **Tombstones** in 4 shapes (rounded, cross, small rounded, slanted), 7–10 rows tall: white `#FCFCFC` with a light-grey right side and base and a black cross. In rows on the brick plazas and alone at forest edges.
- **Stone statue** 14 × 22 px in the middle of each plaza: a white-and-light-grey stone pumpkin with a black carved face on a stepped pedestal.
- **Shadows** (checker ellipses) go only under round trees (20 px), pines (16 px), dead trees (12 px) and the statue (16 px); small props stand directly on the ground.

## Effects and particles

All effects are built procedurally on tiny pixel grids at init, use only palette colours and are blitted at whole art pixels. Every effect is layered (flash → main shape → debris → residue), and fading is done by blinking, never by alpha.

- **Impact:** a 7 × 7 white cross flash → a 9 × 9 gold/red X of sparks around a white core → four far gold corner dots (3 frames over 0.2 s), plus 3 debris bits in the struck figure's own colours (gravity 170).
- **Disappear burst:** the figure's own white pop, then 4 procedural frames on an odd `ceil(18R)` square: white core + gold cross; white disc, gold ring and red diagonal rays; red/gold checker ring; 8 red/gold bits. `R = 1` or 1.7.
- **Debris:** 6 (12 for the large creature) chunks in the figure's colours, 2-px chunks get a black 1-px rim like tiny sprites, gravity 230; leaf scraps (4 spinning 2 × 2 frames) fly off root creatures, cyan stars rise from ghosts; they blink in their last 30 %.
- **Residue:** a small smoke puff that rises slowly for 0.6–0.8 s and flickers out.
- **Collect:** an expanding diamond outline (radius 3, 5, 7; cyan for small, gold for large collectibles) + a rising star + 3 pixels thrown upwards.
- **Glow-up:** a 9 × 40 px checker light column (white core, gold sides, two parities alternating every 4 frames) that shrinks from the top, a gold ring and 10 stars flying outwards.
- **Collectibles:** 5 × 6 px cyan/blue and 7 × 8 px gold/orange diamonds spinning through 4 frames (`0,0,0,1,2,3` at 9 fps), an eased bob `[0,1,2,1]` at 4 fps and a star glint on the upper corner every ~1.8 s, each with its own phase.
- **Orbiting lantern:** 9 × 12 px: black bail handle, purple cap with a pink glint, cream frame, glass that flickers through gold → yellow → white in the sequence `0,1,0,2,1,0` at 9 fps (phase per lantern), and a gold spark one step behind on the orbit.
- **Projectile:** a 3-px cream pumpkin seed with an ochre tip, 4 rotation frames chosen from its spin, and a 3-dot trail (cream, gold, flickering orange).
- **Dust:** 3 × 3 grey/white plus and a 4-dot corner frame, under heavy footfalls and behind a dash (3 puffs).
- **Floating numbers:** 3×5 bitmap digits, white, 8-neighbour black outline; highlighted numbers gold at 2×.

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

- **Timing on the NES beat:** poses are held whole frames (8–12 fps), positions snap to art pixels, nothing is tweened.
- **Main character:** 8-frame walk at `floor(anim * 1.3) & 7` (~12 fps at normal speed, 0.67 s per cycle); head lags the body by one frame, scarf flaps a frame behind the step. Idle breath 1.1 s, blink every 3.4 s, leaf at 1.5 fps.
- **Small creature:** 4-frame hop at `floor(anim * 2.2 + phase) & 3`; squash 6.3 × 8 → stretch 4.7 × 10; crown lags (droops going up, lifts falling).
- **Ghost:** tail 7 fps × 4 frames, eased lift `[0,0,1,2,3,3,2,1]` at 5 fps, arm 3 fps, mouth 0.5 s per 2.6 s.
- **Large creature:** 4-frame stomp at `floor(anim * 1.6 + phase) & 3`, body drop on contacts, dust on each contact.
- **Per-actor phase:** every figure has a phase (`seed × 10`, or random once for clones) added to all its idle timers.
- **States:** hit ~130 ms (squash + flash + recoil), appear 0.45 s (mound → climb → land; ghosts unroll), disappear 0.35 s (100 ms pop → burst). Flicker = skip drawing when `frameCounter & 2`.
- **World:** water waves toggle at 2.2 Hz; nothing else in the ground moves.

## Do and don't

**Do**

- Build figures from posed parts on a char grid (legs table, arm table, head, scarf) and bake each pose once.
- Keep each sprite part to 3 colours + black, all from the NES palette table; push depth with black far limbs.
- Animate with real held poses: 8-frame walks, 4-frame hops and stomps, a head or crown that lands a frame late.
- Give every state its own sequence: wind-up before a dash, squash on hit, mound before an appearance, pop before a burst.
- Cluster ground decals along edges and in patches and leave the open meadow calm.
- Round every blit to whole art pixels; use checker pixels for transparency and flicker for blinking.
- Use Press Start 2P at multiples of 8 px, with uppercase red labels.

**Don't**

- Don't use gradients, glows, blur, alpha fades or anti-aliased shapes in the world.
- Don't use colours outside the NES palette (no `#333`, no pastel mixes).
- Don't use coloured or 2-px outlines on figures (the red outline of the hit flash is the only exception).
- Don't rotate or scale sprites. Bake extra frames, poses or flips instead.
- Don't animate with a 2-frame leg toggle or a sine bob on everything; don't let crowds share one phase.
- Don't sprinkle tufts, pebbles or leaves evenly over a whole material.
- Don't put noise textures on the ground. Use only flat fills, ruts, dither bands and glyph decals.

## Implementation recipe

1. Set the view: 360 world units tall, `PS = 1.5`, a 240-row art buffer, integer upscale `up = max(1, round(screenH / 240))`, smoothing off.
2. Copy the NES palette table (`PALETTE` in `starter.js`) and the `mk(rows, map, opt)` sprite builder.
3. Build the main character from parts on a 16 × 20 grid: a legs table (stand, contact, passing, up for both legs, crouch, split, skid, hurt), sleeve/hand tables for near and far arm, scarf shapes, an ellipse head with a carved face. Compose the 8 walk poses, idle, dash and hurt poses; bake `{r, l}` per pose lazily.
4. Creatures: one parametric grid per family (bulb ellipse per hop frame + crown polylines; ghost row widths + tail wave; golem parts), variants by shape parameters and palette. Ghost tails use `tailFrom` with two parities.
5. Effect frames on small grids: impact (3), burst (4), puff (3), star (3), ring (3), light column (2 parities), spin (4), mound (3), leaf scraps (4), seed rotation (4), 3×5 digits.
6. Ground: 5 materials from noise on a 2×2 px block grid, edge table (lip, cliff, ring), canopy dither band inside forest edges, wheel ruts from the road distance field, then decals stamped on hashed cells — tufts near edges and in patches, flower beds, clumped leaf litter, pebbles on road shoulders. Bake per chunk with a generator.
7. Props: circle-built round trees, tiered pines, bushes, cattails at pond shores, grid rocks, tombstones, fences and signs.
8. Each frame: blit chunks → wave toggles → checker shadows → y-sorted figures and props → lanterns → projectiles → particles → numbers, all at rounded art-pixel positions.
9. HUD: a black bar, Press Start 2P, red labels, a heart row, a segmented progress bar, double-bordered black windows, checker-dither dimming.
10. Check: zoom into a screenshot and verify that every pixel is a palette colour, every sprite has a black 1-px rim, and no pixel is blended; check a walk contact sheet for 8 distinct poses.

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
// usage: rows of chars + a char->hex map; tails from row 11 on become checker pixels without outline
// const tail = [0, 1].map((p) => mk(ghostRows, { W: '#FCFCFC', B: '#3CBCFC', k: '#000000' }, { tailFrom: 11, parity: p }));
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

**5. Posed parts: an 8-frame walk where the head lands one frame late.**

```js
// legs: [x0, x1, row] on the 3 ground rows; far leg drawn black, near leg navy with a brown boot
const LEGS = {
  cA: { far: [[5, 6, 0], [4, 5, 1], [3, 4, 2]], near: [[8, 9, 0], [9, 10, 1], [10, 12, 2]] },   // contact, near leg forward
  pA: { far: [[5, 6, 0], [6, 8, 1]],            near: [[7, 8, 0], [7, 8, 1], [7, 9, 2]] },     // passing, far foot lifted
  uA: { far: [[6, 7, 0], [8, 10, 1]],           near: [[7, 8, 0], [7, 8, 1], [6, 8, 2]] },     // up
  cB: { far: [[7, 8, 0], [8, 9, 1], [9, 11, 2]], near: [[6, 7, 0], [5, 6, 1], [4, 5, 2]] },
  pB: { far: [[6, 7, 0], [6, 7, 1], [6, 8, 2]], near: [[8, 9, 0], [9, 11, 1]] },
  uB: { far: [[6, 7, 0], [6, 7, 1], [5, 7, 2]], near: [[8, 9, 0], [10, 12, 1]] },
};
const WALK = [
  { legs: 'cA', bob: 0, arm: 'back' }, { legs: 'cA', bob: 1, arm: 'back' }, { legs: 'pA', bob: 0, arm: 'mid' }, { legs: 'uA', bob: -1, arm: 'mid' },
  { legs: 'cB', bob: 0, arm: 'fwd' },  { legs: 'cB', bob: 1, arm: 'fwd' },  { legs: 'pB', bob: 0, arm: 'mid' }, { legs: 'uB', bob: -1, arm: 'mid' },
];
WALK.forEach((w, i) => {
  w.headBob = WALK[(i + 7) & 7].bob - w.bob;       // head offset = previous frame's body offset -> it arrives late
  w.scarf = ((i + 1) >> 1) & 1;                     // scarf flaps one frame behind the step
});
const sprites = new Map();                          // bake each pose once: key -> { r, l }
function walkSprite(anim, build) {
  const w = WALK[Math.floor(anim * 1.3) & 7];       // ~12 fps at walking speed, held whole frames
  const key = w.legs + w.bob + w.headBob + w.arm + w.scarf;
  if (!sprites.has(key)) sprites.set(key, build(w)); // build(w) composes legs, scarf, torso, arms, head on a char grid -> mk()
  return sprites.get(key);
}
```

## Adapting it to your project

- **Keep fixed:** the NES palette table, 3 colours + black per sprite part, the 1-px black auto-outline, held-pose animation with real cycles, rounding to art pixels, checker transparency and flicker, Press Start 2P with red uppercase labels, and the black HUD bar.
- **Free to change:** which palette entries you pick for your biome. A dungeon could use `#7C7C7C`, `#BCBCBC` and `#503000` floors with `#881400` lava, and a snow area `#FCFCFC`, `#A4E4FC` and `#0058F8`. The materials and edge table, the part tables and the sizes are yours too.
- **New characters:** start from the part tables: a legs table with contact/passing/up layouts, sleeve + hand positions per swing, and a big head with a 2-colour face. Add one or two features that animate on their own (scarf, ears, tail, crown) and let them lag a frame.
- **Mixing elements:** the characters and props work on any flat ground as long as they keep the black outline and palette; the world works with other figures if they are snapped to the same art-pixel grid.
- **Side-view projects:** use the same builder for 16 × 16 tiles and the same legs/arms tables seen from the side.
- **Other resolutions:** keep `PS` so that the view is about 240 rows tall (NES), and only ever upscale by integers.

## Performance notes

- Sprites are tiny canvases baked once per pose and cached (`Map` keyed by the pose fields); walk, hop, float and stomp poses are warmed at init, rare poses bake on first use in well under a millisecond. Effect frames and shadows in 7 sizes are baked at init; floating numbers are cached per value.
- Ground: noise fields are sampled on an 8-px grid and bilinearly interpolated per 2×2 block; the road distance is stored per pixel for the ruts; chunks (171 × 171 px) bake in a generator that yields every few rows. Decal placement checks neighbours 3–9 px away inside a 14-px margin, so stamps stay seamless across chunks.
- Per frame: only `drawImage` blits (a few with a source rect for the climb-out and dissolve clips), a few wave `fillRect`s and the optional scanline pattern. The starter scene draws in about 1–2 ms.
- Avoid per-frame `getImageData`. Keep all pixel loops at bake time.

## Copy-paste prompt

```text
Use the 8-Bit Arcade (NES) art style for my project: <X>.
- Render into a low-res buffer: 1 art pixel = 1.5 world units, view = 240 art rows, integer upscale, imageSmoothingEnabled = false.
- Only use NES 2C02 palette colours: #000000 #FCFCFC #BCBCBC #7C7C7C #005800 #00A800 #58D854 #503000 #AC7C00 #F0D0B0
  #FCE0A8 #881400 #A80020 #F83800 #E45C10 #FCA044 #F8B800 #F8D878 #0000BC #0058F8 #0078F8 #3CBCFC #940084 #F878F8.
- Sprites are char grids + char->colour maps; a builder adds a 1-px pure black outline. Max 3 colours + black per part,
  figures stacked from parts (head, scarf, tunic, face glow); far limbs black for depth; flip for facing.
- Animate with held poses: 8-frame walk (contact/down/passing/up) with counter-swinging arms, head landing one frame late,
  a scarf or crown that lags; 4-frame squash & stretch hops; eased 8-step ghost float; per-actor phase offsets.
- States: dash wind-up -> stretch + checker afterimages -> skid; hit = squash + flash palette + 2-px recoil;
  appear = dirt mound -> climb out -> land (ghosts unroll in checker); disappear = white pop -> 4-frame burst.
- No gradients, no alpha, no anti-aliasing, no rotation or scaling. Transparency = checkerboard; blinking = flicker.
- Ground: flat materials on 2x2-pixel blocks with NES edge tiles (grass lip, black forest cliff + dithered shade band,
  road with wheel ruts and pebbly shoulders, ponds with black + blue rings and cattails). Tufts gather at edges and in
  patches, flowers in small beds, the open meadow stays calm. Water waves toggle 2 frames.
- Effects layered: cross flash -> X sparks -> far dots; outlined debris in the figure's colours, tumbling leaf scraps,
  a lingering smoke puff; diamond rings on collect; a checker light column for big moments.
- UI: black status bar, Press Start 2P at 8/16/32 px, red uppercase labels, 8x7 hearts, segmented cyan/blue bar,
  black windows with double white borders, checker-dither dimming behind menus.
```
