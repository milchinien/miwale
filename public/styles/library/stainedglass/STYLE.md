# Cathedral Glass — Game Art Style Spec

> A living cathedral window: jewel-tone glass pieces in dark lead came, lit from behind by warm light and coloured rays.

The whole world is one backlit stained-glass window. Floor, props, characters, collectibles, HUD icons and even floating numbers are built from the same single unit: a **glass piece** with a luminous off-centre core, a darker rim, two faint cathedral-glass streaks and an occasional glint, separated from its neighbours by near-black **lead came** (`#17131c`). The floor is a per-pixel Voronoi mosaic composed like a real window: material regions (green meadow, crimson leaf carpet, amber path lanes, night-blue glass, grey diamond quarries) are filled with large calm pieces, edged inside by a strip of small gold, pearl or jewel pieces, separated by heavy lead and punctuated by rare rose-window medallions. Props cast coloured light pools on the floor, glowing faces shine through, and a slow layer of coloured light rays drifts over the screen. Figures are leaded-glass puppets whose arms, head and scarf move against the body, and they break apart along their own lead lines. The module's cast – a cloaked main character with a round orange rib-cut head and a glowing carved face, jewel-capped root-bulb creatures, an opal floating spirit and a violet-and-brown giant with a ruby core – serves as the example throughout.

## At a glance

| | |
| --- | --- |
| Family | Mosaic · Stained Glass |
| Mood | luminous, sacred, festive, handcrafted, storybook |
| Best for | top-down action games with many figures, fairy-tale action RPGs, puzzle and match games, holiday-themed arcade games, card/board UIs |
| Renderer | Canvas 2D, fully procedural, no image assets |
| Pixel art | No — native resolution, sprites baked at 3–5 px per world unit |
| Complexity | 7/10 — every new figure has to be split sensibly into glass pieces and still stay readable; the ground is already busy |
| Fonts | Cinzel Decorative (700/900), Cinzel (500/700/900) |
| Key colours | lead `#17131c`, meadow `#2a6e48`, crimson `#a23a4e`, amber `#c28a38`, pumpkin `#ff8a22`, candle gold `#ffd23a`, amethyst `#9351c8`, ruby `#e3203c`, aqua `#3ac6c6`, gold fillet `#d9ad4e` |

## When to use it

Good fits:
- **Top-down action with many figures on screen** — the fat lead silhouette keeps 200+ figures readable on a busy floor.
- **Fairy-tale, religious, medieval or seasonal themes** (harvest, Halloween, Christmas, saints, knights, gardens).
- **Puzzle, match-3 and board games** — the piece-and-lead grammar maps naturally onto tiles and cards.
- **Menus, choice screens, card games** — arched leaded cards with gold fillets look premium.

Bad fits:
- **Fast competitive shooters** that need a calm, low-contrast background — the floor is intentionally busy.
- **Gritty realism, horror without whimsy, hard sci-fi** — glass reads as warm and sacred.
- **Pixel-art or retro games** — this is smooth, antialiased vector-like glass.
- **Minimalist UIs** — everything here is ornamented.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Lead came | `#17131c` | All outlines, seams, text strokes, UI borders |
| Lead ridge | `#544e60` | Metallic highlight in the centre of floor lead (rgb 84,78,96) |
| Meadow green | `#2a6e48` | Main floor; family `#327a4e #265f44 #3a8250 #2a7058 #2f6c40` |
| Olive meadow | `#5f7a33` | Alternate meadow patches; `#55702f #4c652b #687f38 #59702d` |
| Leaf carpet crimson | `#a23a4e` | Autumn region; `#8e2a3c #7c2234 #ad4c38 #963046 #a35c2c #b0405a` |
| Amber path | `#c28a38` | Path centre lane `#cf9a44 #b98034 #d4a24c`; outer lanes `#a8742e #b07c33 #9c6a2a #b5813a` |
| Night glass | `#304296` | Graveyard region; `#28388a #3a2e86 #46348e #243478 #2c4e90 #383a92` |
| Clear quarry | `#646e8a` | Diamond-quarry plazas; `#5c6884 #6c7088 #58647e #6a6486 #62727e` |
| Gold border strip | `#c99030` | Small pieces inside the leaf-carpet edge; `#b57a26 #d8a845 #a86c22` |
| Pearl border strip | `#93a5cf` | Small pieces inside the night-glass edge; `#7f92c0 #7183b4 #a0b0d8` |
| Jewel border strip | `#2c4aa8` | Alternating jewels inside the plaza edge; `#9e2a42 #a8323e #c0902e` |
| Pumpkin orange | `#ff8a22` | Main character's head ribs `#e2681a #ffa63c`; gourd props `#c85a14 #e47820 #f39232` |
| Candle gold | `#ffd23a` | Carved faces, flames (`#ff9a2a`, `#fff2a0`), lantern faces `#ffe066` |
| Hem gold | `#f2c040` | Clasps, hems (`#e0a830`), fruit jewels, stars |
| Cloak green | `#2a6e40` | Main character's cloak; `#1f5a34 #184a2c #2f7a3c #22603e`; sleeves `#2c7244 / #1f5634`, leggings `#4b3868 / #3a2a50` |
| Scarf red | `#c4283e` | Main character's accent; `#a51d34 #d8404e` |
| Amethyst | `#9351c8` | Caps of the small root-bulb creatures, variants `[#7a3fae #9351c8 #6a3298]`, `[#a8378c #c24ca2 #8e2c76]`, `[#5a48b8 #7060d0 #4a3a9e]` |
| Ivory | `#f4e2b4` | Small creature bodies `#e8cc90`, roots `#e6cf9a #cfae72`, seeds `#fff0c4 #e6c27a` |
| Ember | `#ff5a26` | Angry glowing creature eyes |
| Opal | `#e9e9fb` | Floating spirit hood panels and drapery strips; `#f0f5ff #dde8fb #f6ecfb #e0f3f4 #fbf6ec`; hollow eyes `#1e2452` |
| Earth brown | `#7e5a3c` | Large creature body, trunks; `#6b4a32 #5a3b2a #8a6440 #644530` |
| Dusk violet | `#704690` | Large creature shoulders/arms; `#5e3a7a #52306a #7c5098` |
| Ruby | `#e3203c` | Large creature core, hearts, red status bar; `#ff4a5a #b8142e #ff7080` |
| Aqua gem | `#3ac6c6` | Small collectibles `#8ff6ea #c4fff6 #279fb0`, aqua progress bar; large collectible `#ffe27a #f0a82a #fff4c0 #d88a1a` |
| Window gold fillet | `#d9ad4e` | 2 px gold ring inside UI lead borders |

Palette rules:
- **Lead is the only dark.** About 12–18 % of floor pixels are lead. No glass piece goes darker than its colour × 0.6; pure black/white never appear as a surface.
- **Floor = cool/earthy mid tones, figures = warmer, paler, brighter.** Ivory-and-amethyst root creatures, opal spirits and an orange round head all separate from green/crimson floor glass.
- **Gold and yellow mean "light source"**: faces, eyes, flames, jewels, UI numbers. Don't spend gold on large surfaces.
- **Strips in the complementary metal**: gold round crimson, pearl round night blue, ruby/blue jewels round grey quarries; the open meadow has none.
- **Never flat**: every piece picks a random swatch from a 4–7 colour family and gets ±6–7 % brightness jitter.
- Dark accents inside figures (mouths `#3a1a2a`, hollow eyes `#1e2452`) are still glass, not lead.

## Typography

**Cinzel Decorative** — weights 700, 900 — titles, timer, counters, floating numbers, card names.
`https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900`

**Cinzel** — weights 500, 700, 900 — labels, bar value text, card descriptions, hints.
`https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900`

```css
.title { font: 900 66px/1 'Cinzel Decorative', 'Cinzel', serif; letter-spacing: 4px; color: #ffd86a; }
.label { font: 700 11px/1 'Cinzel', Georgia, serif; letter-spacing: 3px; color: #cfdaff; text-shadow: 0 1px 2px #17131c; }
.card-desc { font: 700 15px/1.3 'Cinzel', serif; color: #2a1a10; background: linear-gradient(180deg, #fbefcf, #e8cf96); }
```

Text effects:
- **Lead outline via text-shadow**: 12 shadows around a circle (`cos(i/12·2π)·w px sin(i/12·2π)·w px 0 #17131c`) with w = 1.5–3.5 px, plus an optional `0 0 14px rgba(255,200,90,.7)` glow for headline gold text.
- Gold text colours: `#ffdf7e`, `#ffd86a`, `#ffe7a0`, `#ffe08a`; parchment descriptions use dark brown `#2a1a10` on cream.
- **Canvas floating numbers**: `900 9.2u` (large variant `12.5u`) Cinzel Decorative, stroked twice in lead (width 0.26 × font size, once shifted down by 0.06 × size), gradient fill (large `#fff6c0 → #ffcf40 → #ff7a1a`, small `#ffffff → #e6eeff → #a9c0ee`), then a `source-atop` white 50 % band across the top 22 %.

## Rendering technique

The visible world is 360 world units tall; the main character is ~24 units wide and ~42 tall at its 1.15 draw scale.

At init:
1. Compute the sprite resolution `K = clamp(round(screenPxPerUnit × 1.5), 3, 5)` px per world unit.
2. **Bake every figure with the two-pass Painter** (`build(box, fn, mode, seed)`): a figure is a function that declares parts back-to-front. Pass 1 (`outline`) fills *and* strokes each part's shape in lead with lineWidth `2 × 0.95` units — the union becomes one clean fat outer came. Pass 2 (`fill`) clips into each part, paints its glass cells, then strokes the part border at `0.55 × 1.2` units and every cell edge at 0.55 units.
3. Bake a **flash copy** of every animated frame and part with mode `flash` (each piece mixed 58 % toward warm white `rgb(255,250,232)`, glow pieces 40 %) — the lead stays dark.
4. Cut **shatter pieces** from the finished creature sprites (BSP into 5–16 convex pieces, each re-leaded along the cut, see Code). Bake glow sprites (radial gradients), glint stars, the impact starburst, the rose medallion, shard sprites (3 shapes × 12 colours), projectile, trail, beams, props (3 trees, 2 bushes, 2 arches, 2 candle groups, 3 graves, 3 gourd groups) and HUD icons with the same Painter (icons at outline 2.0 / inner 1.15).
5. Bake the screen overlay per screen size (vignette, frame, ripples) plus a half-resolution light layer.

Per frame (renderer order):
1. Ground chunks (256 units, generated per pixel as time-sliced generators and cached).
2. Collectibles → shadows/light pools under figures → y-sorted props, creatures and main character → orbiting objects → projectiles → particles → floating numbers.
3. Screen overlay: dark layer with `source-over`, light layer with `lighter`, offset `sin(t·0.12) × 2.5 % W`.

Every figure draw is just `drawImage` of baked canvases with `setTransform(S·sx, 0, 0, S·sy, …)` and optional rotation: the main character is 6 part blits (scarf ×2, back arm, body frame, front arm, head) placed through one shared body transform, a creature 1–3 blits, plus 1–3 additive glow blits.

**Glass piece shading** (`Painter.glass`): colour × (1 ± 0.06) → radial gradient from `(cx − 0.25r, cy − 0.3r, 0.05r)` to `(cx, cy, 1.3r)` with stops `0: mix(col, white, .3)`, `.48: col`, `1: col × .64`. Glow pieces: `0: mix(col, rgb(255,255,236), .78)`, `1: col × .9`. Pieces with r > 1.4 units get two curved streaks (white 12 %, width 0.16 r, random angle) and, with 50 % chance and r > 1.6, an elliptical glint (0.26 r × 0.1 r, rotated −0.7, white 55 %) at the upper left.

## World and ground

The floor is computed **per pixel** in world space so it is seamless and identical between chunks. It is composed like a real window, with three scales of detail: **large calm pieces** (19–30 units) inside each region, a **border strip of small 8-unit pieces** just inside the edge of every leaf, night and plaza region, and **heavy lead** between regions. Rare **rose medallions** are the focal points. Figures, with smaller and brighter pieces, stand out against it.

1. **Fields** on a 4-unit grid (`GSTEP = 4`), 5 layers: leaf carpet `warped(x/760, …, warp 0.95, 2 octaves) − 0.565`, night glass `warped(x/980, …, 1.05, 2) − 0.585`, path = a domain-warped fbm at scale 1150 (iso-line), plaza `fbm(x/520) − 0.66`, macro brightness `fbm(x/1150)`. Two octaves keep region outlines broad and calm (few islands).
2. Per pixel the 4 surrounding nodes are interpolated bilinearly; value divided by the bilinear gradient magnitude gives a **signed distance in world units**, so borders are smooth curves of constant lead width. A path pixel is where `21 − |d| > 0` (42 units wide).
3. Material priority: plaza > path > night > leaf carpet > meadow. `re` = distance to the nearest region border; `od` = distance to the region's *own* outline.
4. **Voronoi glass**: jittered grid (sites at `(i + 0.08 + 0.84·hash) × C`), cell size C: meadow 24, leaf carpet 19, night 27, path 30. Find the 3 nearest sites in the 3×3 neighbourhood; edge distance `e = (d2² − d1²) / (2·|s2 − s1|)` for the 2nd and 3rd site, combined with `smin(e1, e2, 1.6)` so vertices round off. The path splits into 3 lanes at ±7 units (different palettes, extra lead along the lane lines). Plazas use 45° diamond quarries: `(x ± y) / 17`, distance to the diamond edge × 0.7071.
5. **Border strip**: where `od < 6.5` inside a leaf, night or plaza region the pixel uses an 8-unit Voronoi instead, coloured from the strip palette of that region (gold `#c99030 #b57a26 #d8a845 #a86c22` round the crimson carpet, pearl `#7f92c0 #93a5cf #7183b4 #a0b0d8` round the night glass, jewels `#9e2a42 #2c4aa8 #a8323e #c0902e` round the quarries). A lead line marks the strip's inner edge (`eP = min(eP, |od − 6.5| − 0.25)`). The meadow has no strip. Cells within 6.4 + 1.2 + 1.5 + 6.5 units of a border are classified per pixel, all others as a whole.
6. **Per-piece colour**: hashed swatch × brightness 0.93–1.07; meadow switches to the olive family where `hash < smoothstep(0.42, 0.6, fbm(site/380))`.
7. **Luminance**: `(0.52 + 0.36·smoothstep(e / (0.34·C))) × streak × (0.82 + (macro − 0.3)·0.5)`, streak = `1 + 0.055·sin((x·cos a + y·sin a)·f + φ)` per piece. The floor stays a little darker than the figures.
8. **Lead**: coverage `max(0.78 − eP, 1.2 − re) × res + 0.5` (antialiased over one pixel); colour ramps from `rgb(28,24,34)` at the edge to `rgb(84,78,96)` at the centre with `q = tl² × 0.85`, a soft metallic ridge.
9. **Rose medallions**: one candidate per 430-unit cell (60 %), only where the material is the same for 34 units around and not at the start point. Radius 22–27: dark base disc, a ring of 16 alternating sectors between 0.8 R and R, 8 pointed petals between 0.24 R and 0.76 R (two alternating colours), an ivory centre and a jewel centre piece, lead rings 1.5 and 1.05 units wide. Palettes per region (meadow: gold/ruby petals on deep teal; carpet: gold/amber on wine; plaza: blue/ruby on slate).
10. **Clustered decals** (seeded jittered scatter, only where the material is safe within a radius): **flower sprays** of 3–6 leaded 5-petal blossoms (`#e8668a #f2c040 #7ab8f0 #efe6ff #c87ae8`, one large 1.15, the rest 0.6–0.9) on 92-unit cells, mostly within 48 units of a meadow edge; **leaf drifts** of 3–5 overlapping autumn leaves in a row on the carpet; **constellations** of 3–5 gold stars joined by thin gold lines `rgba(240,206,120,.42)` on night glass; sparse amber roundels on the path; seedy bubbles on quarries. No even sprinkle and no scattered glints.
11. **Prop pools** baked into the chunk: contact shadow `rgba(16,12,24,0.38)` ellipse, then additive coloured radial pools (arch window: red, blue, gold pools at alpha 0.26; candles warm `rgb(255,180,70)` 0.3; graves cold `rgb(150,200,255)` 0.12).

## Characters

All figures use the same two-pass Painter: one fat outer lead came (1.9 units), glass pieces with their own gradients, inner lead 0.55, a lit flash copy of every frame; facing = horizontal flip with mirrored part angles. Pieces always follow form; nothing is cut randomly across a face.

**Main character** (drawn ×1.15, ~24 wide, ~42 tall with stem) is a **layered puppet** so parts can move against each other:
- **Body frames** (box −13…14 × −22…3), 10 of them: 8 walk poses, stand and dash. Each has two legs (plum leggings `#4b3868 / #3a2a50` as capsules from the hip at y −8.6, rounded boots `#4a2f22 / #5d3b29` with the toe forward) and the cloak. Pose `i`: near foot x = 3.5·cos(2πi/8), far foot the opposite, the foot swinging forward lifts up to 2.2 units.
- **Cloak**: 10-point trapezoid (4.9 wide at the shoulders, 8.8 at the hem, y −17.6…−5) with a fixed BSP mosaic in 5 greens, a lead centre seam, and a **golden hem band** of 6 alternating gold pieces (`#f2c445 / #d99e2c`). The cloak and hem are drawn through a shear `x' = x + k(y + 17.6)`, so the hem swings ±1.2 units behind the stride while the glass pattern stays fixed.
- **Clasp jewel** 1.5-unit gold glow piece; a front **scarf band** in two reds.
- **Arms** (separate sprites on shoulder pivots at (±5.4…6, −15.6)): sleeve capsule `#2c7244` (back arm `#1f5634`), gold cuff, leather mitten.
- **Head** (separate sprite on the neck pivot, y −17.6): a round orange gourd-like ellipse rx 10.4, ry 8.2, cut into 5 vertical **rib lenses** (boundaries −1.05, −0.64, −0.22, 0.22, 0.64, 1.05), stem `#4f7c2c` and a two-piece leaf. Three faces as **glow pieces** in `#ffd23a`: looking ahead (offset 1.6 units towards the facing), looking at the viewer (centred, wider grin) and squint (flat slit eyes for blinks and pain).
- **Scarf tail**: two segments (upper `#a51d34`, lower `#c4283e` with a gold fringe) hanging from the knot at (−5.6, −18.2), each on its own spring.
- Glows: a warm halo (r 16 × 1.25, alpha ~0.32) behind the head and a flickering gold glow on the face; a warm light pool on the floor under the feet.

**Small creature** (a root bulb on legs, ×0.92): bulb = bezier outline cut into 3 jewel cap pieces (amethyst, magenta or indigo variant) over 2 ivory pieces with a jagged seam; two ember glow eyes and a lead frown; two root-leg capsules (6 frames). The **leaf crown** (3 leaves) is a separate sprite pivoting on the bulb top, and **blink lids** (cap-coloured pieces with a lead line) are a separate overlay.

**Fast floating creature** (a hooded spirit): a dome hood split into 3 panels (the centre one glowing) above a lead seam, 4 vertical **drapery strips** that lean with the sway, and a hem of 3 rippling points (6 frames). Hollow navy eyes and mouth `#1e2452` with cold pupils, a reaching arm. The bottom 10 units fade out with a `destination-out` gradient; drawn at alpha 0.88 with a cold glow.

**Large creature** (a root giant, box −32…32 × −64…3, 6 frames): egg body BSP-cut into pieces ≤ 78 units², violet above y −31 and brown below; capsule legs that lift alternately up to 3.4 units and arms that swing ±2.8 against them; a crown of 5 leaves leaning behind the stride; a 4-facet **ruby core** with a pulsing ruby glow; amber glow eyes; a jagged dark maw.

**Readability with many figures**: the same fat lead outline everywhere (groups read as stacked cut-outs), creature colours absent from floor palettes, glowing eyes, only 3 creature silhouettes with distinct sizes (small 26 units, floating 28, large 64), dark ellipse shadows.

General construction rules for any new character:
- Big readable primitives first (ellipse, capsule, polygon), then cut them into glass with `mosaic()` (BSP), `ribCells()` for round shapes, `leafCells()` for leaves, wings and ears, explicit polygon cells for faces, folds and facets.
- Piece area roughly 30–80 units² on bodies, 3–15 units² on faces and details.
- Bake every part that should move (limbs, head, crowns, tails, cloth ends) as its own sprite with a pivot; keep large parts in the body frames.

## Props

Props use the same Painter and the same two-pass construction as the characters (fat lead silhouette, shaded glass pieces, inner lead), and each casts a dark contact shadow plus coloured additive light pools onto the floor.

- **Trees**: BSP trunk + 5 foliage lobes (ellipse mosaic + 2–3 leaf pieces each) in autumn/summer/blossom families with glowing fruit jewels; sway as a horizontal skew of 0.02 at 1.1 rad/s.
- **Bushes**: 3 lobes + berry jewels; skew 0.03.
- **Gothic arch**: stone mosaic frame, jewel-mosaic window (pieces ≤ 11 units²), mullion, quatrefoil with a ruby centre; casts red, blue and gold floor pools at alpha 0.26.
- **Candles**: ivory pieces + layered flame glow pieces + a flickering warm glow (`0.75 + 0.25·sin(11t)·sin(7.3t)`); warm pool `rgb(255,180,70)` 0.3.
- **Graves**: grey mosaic slabs with an inlaid pale-blue glowing cross; cold pool `rgb(150,200,255)` 0.12.
- **Gourds**: rib lenses in `#c85a14 #e47820 #f39232`, sometimes carved with a glowing face.
- Baked once: 3 trees, 2 bushes, 2 arches, 2 candle groups, 3 graves, 3 gourd groups.

## Effects and particles

Every effect is made of glass, light or lead, and layers a core flash, a main shape, debris and residue with their own timing.

- **Shatter (disappearing)**: the creature's own finished sprite, cut at init into 9 (small), 8 (floating) or 16 (large) convex pieces, each re-leaded (0.62 units) along the cut. 0–14 % of the death time: the lit pieces crack apart by 0.5 units over a white-hot additive glow; 14–100 %: they fly out with an ease-out cubic (reach 15 / 14 / 26 units × 0.7–1.3), rise and fall in an arc, spin up to ±4.5 rad; lit pieces switch to normal glass at 28 % and everything fades over the last third. Residue: 6–16 loose shard particles (3 baked leaded shapes in the figure's colours, gravity 300, drag 1.4, life 0.9–1.4 s, tumble via y-scale `0.25 + 0.75·|cos|`) fall and rest on the floor, glinting when edge-on.
- **Appearing**: a coarse cut of the lit sprite (5 pieces, 8 for the large creature) flies in from 1.5 × reach along curved paths with an ease-out cubic over 70 % of 0.45 s while a warm glow grows; then the whole figure flashes and settles with a decaying squash `sin(2πu)(1 − u) × 12 %`.
- **Impact**: core = white glint star; main = the **leaded starburst** (8 lens rays `#f2c040 / #fff2c0`, 5 and 7.6 units, white-hot centre) over a warm glow, growing 0.35 → 1.15 × size with an ease-out over 0.17 s and fading after 45 %; debris = one shard (55 %). On the figure: lit copy at `min(0.75, flash × 1.1)`, +14 % x / −10 % y squash, a 0.24 rad tilt away from the push.
- **Burst flare**: an additive glow in the creature's colour (violet, cold blue, ruby) decaying quadratically over 0.18 s (large: 0.3 s); the large creature adds a ring made of short glass pieces (lead ellipse + dashed colour stroke 3.6 / 1.1 added on top, ry = 0.45 rx).
- **Glint star**: baked 16 × 16-unit sprite: white core r 3 + 4 curved spikes 7.5 units, added with `lighter`; tints warm, cold, rose, mint.
- **Projectile**: seed sprite rotated to heading, y-scale 0.6–1 by spin, a 16-unit tapered additive trail, small gold glow at alpha 0.35.
- **Collectibles**: a kite split into 4 facets around (0, −1.4), two of them glowing, aqua (large: gold with a ruby centre); bobs ±1.1 units, aqua halo, rare twinkle; the large one leaves a small gold ring when collected.
- **Dash**: 3 additive lit after-images of the dash body and head at 7-unit spacing, alpha `0.3/i`.
- **Rose-window light (celebration)**: the rose medallion sprite (r 23) projected onto the floor with `lighter` (alpha 0.62, flattened to 0.48), unfolding with an ease-out-back over 28 % of 1.1 s, holding and fading after 65 %; 12 vertical light beams (3.2 × 40 units; gold, rose, blue, mint), a gold ring and 10 glints on top.
- **Main character flash**: one rose glint and 5 orange/gold shards; full shatter = 18 shards.

## Atmosphere and lighting

- **No directional light.** The light comes *through* the glass: highlights are always at the upper-left of each piece's own centre, and glowing elements are brighter pieces plus additive glow sprites.
- **Glow sprites**: radial gradients with alpha stops `0: .9, .25: .45, .6: .12, 1: 0`, colours warm `rgb(255,190,80)` r 16, gold `rgb(255,210,90)` r 10, aqua `rgb(110,240,220)` r 10, cold `rgb(150,200,255)` r 14, ruby `rgb(255,60,80)` r 14. Always drawn with `globalCompositeOperation = 'lighter'`.
- **Shadows**: flat ellipses, `rgba(14,10,22,0.42)` (floating spirit 0.25), small creature 8 × 2.6, floating 5 × 1.7, large 19 × 5.5, main character 7.5 × 2.4. No hard-offset or directional drop shadows.
- **Coloured light pools** from props baked into the ground chunk with `lighter` (see World and ground and Props).
- **Screen overlay** (baked per screen size, s = H/900):
  - Vignette like a deep window embrasure: radial from 0.28 H to 0.56 × diagonal, `rgba(14,8,26, 0 / .1 @ .55 / .36 @ .85)` → `rgba(10,6,20,.62)`.
  - Window frame: lead stroke 10 s at inset 5 s (`rgba(16,12,22,.85)`), gold fillet 2 s at inset 11 s (`rgba(214,170,80,.35)`), dark corner rosettes r 110 s.
  - 70 faint wavy ripple lines (white 2.8 % / navy 3 %), screen-anchored like real pane distortion.
  - **Light layer** at 55 % × 50 % resolution: warm centre `rgba(255,226,170,.16)` plus five diagonal coloured rays (rose, gold, blue, amber, lilac) at alpha 0.075 → 0.028 → 0, slanted 0.45 H; added with `lighter`, stretched to 110 % width and drifting `sin(t·0.12) × 2.5 %` of the width.

## UI

- **Panels** are glass in lead: 3–5 px lead border, `box-shadow: 0 0 0 2px #d9ad4e, 0 0 0 6px #17131c` (gold fillet then outer lead), jewel radial-gradient fill, gothic arch radii (`70px 70px 16px 16px / 56px 56px 16px 16px`).
- **Bars**: dark glass trough; fill = repeating lead mullions every 40–46 px over a 3-stop vertical gradient (red bar `#ffc0b4 → #ec3c52 → #9a1630`, aqua bar `#c8fff0 → #4fdcbc → #149a80`), outer colour glow and a white 50 % highlight strip.
- **Cards**: tall pointed-arch cards (`112px 112px 14px 14px / 128px 128px 14px 14px`) with a diamond lead quarry pattern (two 45° repeating gradients, lead 2.5 px every 22.5 px) over blue/ruby/green jewel gradients, double gold+lead inner and outer rings, a round glowing icon medallion and a parchment description plate.
- **Icons** are drawn with the same Painter (outline 2.0, inner 1.15 at 48 px icon size).

```css
.hud-panel {
  padding: 8px 30px 9px; border: 4px solid #17131c;
  border-radius: 70px 70px 16px 16px / 56px 56px 16px 16px;
  background: radial-gradient(ellipse at 50% 30%, rgba(255,230,170,.28), transparent 60%),
              radial-gradient(ellipse at 50% 35%, #4a63c8 0%, #26357e 55%, #141b48 100%);
  box-shadow: 0 0 0 2px #d9ad4e, 0 0 0 6px #17131c, 0 8px 18px rgba(0,0,0,.55), inset 0 0 18px rgba(0,0,30,.6);
  font: 900 34px/1.05 'Cinzel Decorative', 'Cinzel', serif; color: #ffdf7e;
}
.bar {
  position: relative; width: 250px; height: 26px; border: 3px solid #17131c; border-radius: 14px; overflow: hidden;
  background: linear-gradient(180deg, #2a0c16, #4a1626 50%, #22080f);
  box-shadow: 0 0 0 2px #d9ad4e, 0 0 0 5px #17131c, 0 5px 12px rgba(0,0,0,.55), inset 0 3px 5px rgba(0,0,0,.6);
}
.bar-fill {
  height: 100%;
  background: repeating-linear-gradient(90deg, transparent 0 46px, #17131c 46px 49px),
              linear-gradient(180deg, #ffc0b4 0%, #ec3c52 44%, #9a1630 100%);
  box-shadow: 0 0 12px rgba(255,90,110,.6);
}
.bar-fill::after { content: ''; position: absolute; left: 7px; right: 7px; top: 3px; height: 5px; border-radius: 3px; background: rgba(255,255,255,.5); }
.card {
  border: 5px solid #17131c; border-radius: 112px 112px 14px 14px / 128px 128px 14px 14px;
  background: radial-gradient(ellipse at 50% 26%, rgba(255,236,190,.5), rgba(255,236,190,0) 46%),
    repeating-linear-gradient(45deg, transparent 0 20px, rgba(23,19,28,.8) 20px 22.5px),
    repeating-linear-gradient(-45deg, transparent 0 20px, rgba(23,19,28,.8) 20px 22.5px),
    linear-gradient(180deg, #3d58c4 0%, #283a96 46%, #5a1f6e 100%);
  box-shadow: inset 0 0 0 3px #d9ad4e, inset 0 0 0 7px #17131c, 0 0 0 3px #d9ad4e, 0 0 0 7px #17131c, 0 16px 34px rgba(0,0,0,.65);
}
```

## Motion and animation

Smooth, interpolated motion (baked frames for the shapes, continuous transforms for weight and timing); every figure has its own phase offset.

- **Main character walk**: phase = fract(distance × 0.3); body frame = nearest of 8. Lift `0.55 × (1 + cos(4π(phase − 0.375)))`: lowest just after contact, highest at passing. y-stretch ±1.5 % with the lift, rock `0.035·sin(2π·phase)`, arms counter-swing ±0.55 rad against the legs, the head bobs 0.07 of a cycle late and tilts ±0.05 rad, the hem shears behind the stride.
- **Scarf tail**: damped springs (upper: stiffness 150, damping 10; lower: 70 / 7) towards `0.2 + min(0.95, speed × 0.0105)` rad (+0.3 while dashing) plus flutter `0.09·sin(6.5t)`; the lower segment aims at 0.6 × the upper angle plus its own flutter, so it lags, bends and overshoots on stops and turns.
- **Idle**: breathing y ±1.8 % / x ∓1 % at 1.9 rad/s, head lagging 0.7 rad, arms drift ±0.05 rad, head tilt ±0.03 rad at 0.7 rad/s; squint blink when `fract(t/3.3 + φ) < 0.035` (~0.11 s), looks at the viewer when `fract(t/5.3 + φ) > 0.82` (~1 s).
- **Dash** (0.2 s): first 20 % a crouch (y −14 %, x +10 %, arms back 0.5), then the dash frame leaning 0.2 rad, x +10 %, arms swept back 1.05 / 0.85 rad, head tilted back, lifted 1.3 units, easing out over the last 30 %.
- **Throw**: the near arm swings forward to −1.45 rad and eases back as the action timer decays (0.2 s), body squash −3 %. **Hurt**: squint face, 0.2 rad recoil, +5 % x / −5 % y, arms flung, lit copy for 0.33 s; blinking alternates at 14 Hz between alpha 1 and 0.55 while protected.
- **Small creature**: phase = distance × 0.55 + 3·seed, 6 frames, two hops per cycle (lift `|sin| × 1.4`, contact squash `(1 − up)³ × 7 %`), waddle ±0.08 rad; crown swings `0.16·sin(2π·phase − 1.5)` and dips on contact; blink lids when `fract(t/2.7 + 5.3·seed) < 0.05`.
- **Floating spirit**: hem frames at 8 fps (`fract(1.35t + 3·seed)`), hover 4.6 units with an eased bob `1.5·(sin w + 0.32·sin(2w + 1.1))`, w = 2.3t + 12·seed; tilt by velocity up to 0.16 rad, +5 % x stretch with speed.
- **Large creature**: phase = distance × 0.3 + seed, 6 frames, lift `|sin| × 1.8` units, landing squash `(1 − up)⁴ × 5 %`, rock ±0.025 rad.
- **Appear** 0.45 s (pieces in, flash, settle), **disappear** 0.35 s (crack, burst, fade), **hit** ~0.14 s (see Effects).
- **Flicker**: candle flames `0.75 + 0.25·sin(11t)·sin(7.3t)`, face glow `0.28 + 0.12·sin(9t)·sin(5.3t)`, collectible halos `0.55 + 0.15·sin(6t)`.
- **Ambient**: trees/bushes skew 0.02 / 0.03 at 1.1 rad/s; light rays drift at 0.12 rad/s; 26 dust motes rise slowly and twinkle at 0.8–1.8 rad/s.
- **Numbers**: scale 0.4 → 1.25 in 12 % of life, settle to 1 by 26 %, shrink 50 % and fade in the last 20–25 %.

## Do and don't

Do:
- Draw every figure part in two passes: lead outline pass, then glass pieces with inner lead.
- Give every piece its own off-centre radial gradient and ±6 % brightness jitter.
- Split shapes where a glazier would: ribs, midribs, folds, hood and drapery strips, facets.
- Bake moving parts (arms, head, crown, scarf) as separate leaded sprites so they can swing, lag and overshoot.
- Make faces, eyes, flames and jewels glow pieces plus an additive glow sprite.
- Compose the floor: large calm cells inside regions, small pieces in border strips along the edges, heavy lead between regions, rare rose medallions.
- Break figures along their own lead lines when they disappear, and assemble them from the same glass when they appear.
- Cast coloured additive light pools from props; keep the window overlay.

Don't:
- Don't use flat fills without lead seams; it becomes generic vector art.
- Don't flash figures pure white; the flash copy keeps the lead.
- Don't cut a random mosaic across a face.
- Don't make the floor one even tessellation, and don't make floor pieces as small as figure pieces (floor 19–30 units, strips 8, figures 2–8).
- Don't sprinkle flowers, stars or glints evenly; cluster them along edges or as constellations.
- Don't use thin or coloured outlines; lead is always `#17131c`.
- Don't add directional drop shadows or realistic lighting.
- Don't compute the per-pixel ground every frame.

## Implementation recipe

1. Set up a world of 360 units visible height; `S = canvasHeight / 360`. Choose `K = clamp(round(S × 1.5), 3, 5)` for sprite baking.
2. Implement the helpers: `mulberry32`, `hashInt`, colour `mix/mul`, `perlin/fbm`, `splitPoly`, `bsp`, `mosaic`, `ribCells`, `leafPts/leafShape/leafCells`, path helpers `ELL`, `CAP`, `PP`.
3. Implement the **Painter** with modes `outline`, `fill`, `flash` and methods `part(shape, cells, opts)`, `piece(shape, col, cx, cy, r, opts)`, `glass(cell)` exactly as in the Code section.
4. For each figure write `parts(P, pose)` declaring pieces back-to-front. Split the main character into body frames (8 walk poses + stand + dash), arms, head faces and scarf segments, each with a pivot; bake `{n, f}` pairs with `build(box, fn, mode, seed)` using the same seed for all frames of a part (so the glass jitter does not flicker). Cut shatter pieces from the finished creature sprites.
5. Write the ground: field nodes on a 4-unit grid, bilinear signed distances, material priority, Voronoi per material with `smin` edges, the 8-unit border strip inside each region edge, luminance curve, antialiased lead ramp. Render in chunks (256 units) into ImageData, time-sliced, cached.
6. Add rose medallions, clustered decals (flower sprays near edges, leaf drifts, constellations), then prop contact shadows and additive light pools.
7. Bake glow sprites, glint star, shard sprites, projectile, trail; draw them with `lighter`.
8. Per frame: blit ground chunks, y-sort figures and props, compose the puppet parts through one body transform, run the scarf springs, blit creatures with crown/lids, play spawn and death with the cut pieces, glow blits, particles, numbers.
9. Bake and draw the overlay (vignette + frame + ripples, then the half-res light layer additively).
10. Build the HUD with the CSS recipes: lead border, gold fillet ring, jewel gradients, mullioned bars, Cinzel fonts with lead text-shadow.

## Code

The snippets below are cleaned-up ports from the module. `starter.js` contains all of them wired together (main character, small root-bulb creature, floating spirit, large creature, faceted collectibles, seed projectile, shards, ground, overlay). The full reference module is `../../js/styles/stainedglass.js`.

Glass piece shading and the two-pass Painter:

```js
const LEAD = '#17131c', WARM = [255, 250, 232];
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const mul = (c, f) => c.map((v) => Math.min(255, v * f));
const rgb = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
function mulberry32(a) { return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function Painter(ctx, mode, seed) { this.ctx = ctx; this.mode = mode; this.ol = 0.95; this.il = 0.55; this.rnd = mulberry32(seed); }
Painter.prototype.part = function (shape, cells, o = {}) {
  const c = this.ctx;
  if (this.mode === 'outline') { // pass 1: one fat outer came for the whole figure
    c.beginPath(); shape(c); c.lineWidth = (o.ol ?? this.ol) * 2;
    c.strokeStyle = c.fillStyle = LEAD; c.stroke(); c.fill(); return;
  }
  c.save(); c.beginPath(); shape(c); c.clip();
  for (const cell of cells) this.glass(cell, o);
  c.restore();
  c.beginPath(); shape(c); c.lineWidth = this.il * 1.2; c.strokeStyle = LEAD; c.stroke();
};
Painter.prototype.glass = function (cell, o) {
  const c = this.ctx, glow = cell.glow || o.glow;
  let col = mul(hex(cell.col), 1 + (this.rnd() - 0.5) * 0.12);
  if (this.mode === 'flash') col = mix(col, WARM, glow ? 0.4 : 0.58); // lit glass, lead stays
  const r = Math.max(0.6, cell.r);
  const g = c.createRadialGradient(cell.cx - r * 0.25, cell.cy - r * 0.3, r * 0.05, cell.cx, cell.cy, r * 1.3);
  g.addColorStop(0, rgb(glow ? mix(col, [255, 255, 236], 0.78) : mix(col, [255, 255, 255], 0.3)));
  g.addColorStop(0.48, rgb(col));
  g.addColorStop(1, rgb(mul(col, glow ? 0.9 : 0.64)));
  c.beginPath(); cell.path(c); c.fillStyle = g; c.fill();
  if (!glow && r > 1.6 && this.rnd() < 0.5) { // glint
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.beginPath(); c.ellipse(cell.cx - r * 0.38, cell.cy - r * 0.42, r * 0.26, r * 0.1, -0.7, 0, Math.PI * 2); c.fill();
    c.beginPath(); cell.path(c);
  }
  c.lineWidth = this.il; c.strokeStyle = LEAD; c.stroke();
};
/** Bake a figure: fn(P) declares parts; box = [x0,y0,x1,y1] in world units; K = px per unit. */
function build(box, fn, mode, seed, K) {
  const cv = document.createElement('canvas');
  cv.width = Math.ceil((box[2] - box[0]) * K); cv.height = Math.ceil((box[3] - box[1]) * K);
  const x = cv.getContext('2d'); x.lineJoin = x.lineCap = 'round'; x.scale(K, K); x.translate(-box[0], -box[1]);
  fn(new Painter(x, 'outline', seed)); fn(new Painter(x, mode, seed));
  return cv;
}
```

BSP mosaic — cut any convex polygon into glass pieces:

```js
function splitPoly(poly, px, py, nx, ny) {
  const a = [], b = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    const dp = (p[0] - px) * nx + (p[1] - py) * ny, dq = (q[0] - px) * nx + (q[1] - py) * ny;
    (dp >= 0 ? a : b).push(p);
    if ((dp >= 0) !== (dq >= 0)) { const t = dp / (dp - dq), m = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]; a.push(m); b.push(m); }
  }
  return [a, b];
}
const area = (p) => Math.abs(p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1]; }, 0)) / 2;
function bsp(poly, maxArea, rnd, out = [], depth = 0) {
  if (area(poly) <= maxArea || depth > 9) { out.push(poly); return out; }
  const xs = poly.map((q) => q[0]), ys = poly.map((q) => q[1]);
  const cx = xs.reduce((s, v) => s + v) / xs.length, cy = ys.reduce((s, v) => s + v) / ys.length;
  const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys), ext = Math.max(w, h);
  const ang = (w > h ? 0 : Math.PI / 2) + (rnd() - 0.5) * 1.2, nx = Math.cos(ang), ny = Math.sin(ang);
  const [a, b] = splitPoly(poly, cx + nx * (rnd() - 0.5) * 0.35 * ext, cy + ny * (rnd() - 0.5) * 0.35 * ext, nx, ny);
  if (a.length < 3 || b.length < 3) { out.push(poly); return out; }
  bsp(a, maxArea, rnd, out, depth + 1); bsp(b, maxArea, rnd, out, depth + 1);
  return out;
}
// usage: cells = bsp(cloakPolygon, 38, mulberry32(7)).map((p) => ({ path: (c) => polyPath(c, p), col: pick(), cx, cy, r }))
```

Floor pixel: Voronoi edge distance + antialiased lead with metallic ridge:

```js
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
/** sites: 3 nearest {sx, sy, col, C} sorted by squared distance d1<d2<d3; re = distance to region border. */
function glassPixel(x, y, s1, s2, s3, d1, d2, d3, re, res) {
  const e1 = (d2 - d1) / (2 * Math.hypot(s2.sx - s1.sx, s2.sy - s1.sy));
  const e2 = (d3 - d1) / (2 * Math.hypot(s3.sx - s1.sx, s3.sy - s1.sy));
  const eP = smin(e1, e2, 1.6), e = Math.min(eP, re);
  let t = Math.min(1, Math.max(0, e / (s1.C * 0.34)));
  const lum = 0.6 + 0.38 * t * t * (3 - 2 * t);           // dark rim -> bright core
  let [r, g, b] = s1.col.map((v) => v * lum);
  const cov = Math.max(0.78 - eP, 1.2 - re) * res + 0.5;   // piece lead 0.78, region lead 1.2 (half widths)
  if (cov > 0) {
    const k = Math.min(1, cov), tl = Math.min(1, Math.max(0, Math.max(1 - eP / 0.78, 1 - re / 1.2))), q = tl * tl * 0.85;
    r += (28 + 56 * q - r) * k; g += (24 + 54 * q - g) * k; b += (34 + 62 * q - b) * k; // ridge rgb(84,78,96)
  }
  return [r, g, b];
}
```

Shatter: cut a finished sprite into re-leaded pieces once, then animate them:

```js
/** spr = { c: canvas, ox, oy } (anchor in px); n pieces; K = px per unit; cy0 = centre height (units, negative = up). */
function shatter(spr, n, seed, cy0, K) {
  const rnd = mulberry32(seed), W = spr.c.width, H = spr.c.height, out = [], lw = 0.62 * K;
  for (const poly of bsp([[0, 0], [W, 0], [W, H], [0, H]], (W * H) / n, rnd)) {
    const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
    const x0 = Math.floor(Math.min(...xs) - lw), y0 = Math.floor(Math.min(...ys) - lw);
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(Math.max(...xs) + lw) - x0; cv.height = Math.ceil(Math.max(...ys) + lw) - y0;
    const c = cv.getContext('2d'); c.translate(-x0, -y0);
    const path = () => { c.beginPath(); poly.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
    c.save(); path(); c.clip(); c.drawImage(spr.c, 0, 0); c.restore();
    c.lineJoin = 'round'; c.strokeStyle = '#17131c'; c.lineWidth = lw; path(); c.stroke(); // new lead along the break
    c.globalCompositeOperation = 'destination-in'; c.drawImage(spr.c, 0, 0);            // keep it inside the figure
    const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length;
    const lx = (mx - spr.ox) / K, ly = (my - spr.oy) / K, l = Math.hypot(lx, ly - cy0) || 1;
    out.push({ cv, ox: mx - x0, oy: my - y0, lx, ly, dx: lx / l, dy: (ly - cy0) / l, d: 0.7 + rnd() * 0.6, vr: (rnd() - 0.5) * 9, up: 0.6 + rnd() * 0.8 });
  }
  return out; // (drop pieces whose canvas is almost empty)
}
/** Offset of a piece at death progress q (0..1), reach in world units. */
function pieceOffset(p, q, reach) {
  const u = Math.min(1, Math.max(0, (q - 0.14) / 0.86)), e = 1 - Math.pow(1 - u, 3);
  const D = Math.min(1, q / 0.14) * 0.5 + e * reach * p.d;
  return { x: p.dx * D, y: p.dy * D * 0.75 - reach * p.up * 0.55 * Math.sin(u * Math.PI * 0.85) + reach * 0.5 * u * u, rot: p.vr * u };
}
```

Rib lenses for round heads and fruit (roundness without shading):

```js
function ribCells(cx, cy, rx, ry, fs, cols) { // fs e.g. [-1.05,-0.64,-0.22,0.22,0.64,1.05]
  const out = [], PI = Math.PI;
  for (let i = 0; i < fs.length - 1; i++) {
    const a = fs[i], b = fs[i + 1]; let path;
    if (a < 0 && b > 0) { const o = Math.max(-a, b); path = (c) => { c.moveTo(cx + rx * o, cy); c.ellipse(cx, cy, rx * o, ry, 0, 0, 2 * PI); }; }
    else if (b <= 0) { const o = -a, n = Math.max(0.01, -b); path = (c) => { c.moveTo(cx, cy - ry); c.ellipse(cx, cy, rx * o, ry, 0, -PI / 2, PI / 2, true); c.ellipse(cx, cy, rx * n, ry, 0, PI / 2, -PI / 2, false); c.closePath(); }; }
    else { const n = Math.max(0.01, a), o = b; path = (c) => { c.moveTo(cx, cy - ry); c.ellipse(cx, cy, rx * o, ry, 0, -PI / 2, PI / 2, false); c.ellipse(cx, cy, rx * n, ry, 0, PI / 2, -PI / 2, true); c.closePath(); }; }
    out.push({ path, col: cols[i % cols.length], cx: cx + rx * (Math.max(-1, a) + Math.min(1, b)) / 2, cy: cy - ry * 0.1, r: Math.max(rx * (b - a) * 0.75, ry * 0.95) });
  }
  return out;
}
```

## Adapting it to your project

Keep fixed (this *is* the style):
- Lead `#17131c`, outer came 1.9 units, inner 0.55, floor lead 0.78 / 1.2 half-widths with the metallic ridge.
- The per-piece radial gradient (30 % white core, ×0.64 rim) and brightness jitter.
- Two-pass Painter, flash copies that keep the lead, figures that break along their own lead lines.
- The composed floor: large calm cells, border strips of small pieces, heavy region lead.
- Glow pieces + additive glow sprites for every light source; coloured light pools; the window overlay.

May change:
- **Palette swap**: replace region families with other jewel families (e.g. sapphire sea + emerald islands + gold sand) — keep mid values (HSL lightness ~30–55 %) and 5–7 swatches per family; keep figures brighter/paler than their region.
- **New characters**: start from a silhouette, then cut along natural seams. Knights: helmet ribs + visor glow; animals: leaf-cells for ears and wings; robots work only if made of jewel colours.
- **New props**: same Painter; give each one a light-source accent (jewel, flame, window) and a coloured floor pool.
- **Other genres**: side-scrollers can use a vertical window (pointed-arch frame around the viewport) and a parallax backdrop of large-piece mosaics; puzzle games can turn each tile into a leaded piece.
- **Resolution**: bake sprites at higher K for big screens; the floor can drop to 1–1.5 px per unit on mobile — the lead antialiasing keeps it clean.
- **Cell sizes** scale with your world: floor cells ≈ 0.6–1.2 × main character width.

## Performance notes

- Sprites: ~150 canvases baked at init (main character 10 body frames + 2 arms + 3 heads + 2 scarf segments, each ×2; small creature 3 variants × 6 frames × 2 + crown + lids; floating spirit and large creature 6 × 2; ~80 shatter pieces cut once with one `getImageData` each; 15 prop variants, 36 shards, glows, starburst, rose). Baking takes ~100 ms; never repaint glass per frame.
- Ground: the expensive part — per pixel a bilinear field lookup, a 3×3 Voronoi search (region or border-strip sites) and the lead ramp. Render it once per 256-unit chunk as a time-sliced generator (yield every 2 rows) at ≤ 2.5 px per unit, cache chunks, precompute site arrays per chunk and field nodes in a shared map (cleared above 60 000 entries). Classify 4-unit cells far from any border as a single material to skip the per-pixel region test.
- Per frame: the main character is 6 part blits, a creature 1–3, an appearing creature 5–8 pieces, a breaking one 8–16 pieces (one pass: lit pieces switch to normal ones at 28 %), so 300+ figures stay cheap. Avoid `ctx.filter` and `shadowBlur`.
- Overlay: baked per screen size; the light layer is half resolution and only stretched.
- Floating numbers are cached as sprites by value + size variant (cache cleared at 400 entries).

## Copy-paste prompt

```text
Use the Cathedral Glass art style for my project (Canvas 2D, procedural, no image assets):
- Everything is backlit stained glass: jewel-tone pieces separated by near-black lead #17131c.
- Each glass piece: off-centre radial gradient (30% white core at upper-left, base colour at 48%, colour x0.64 rim), ±6% brightness jitter, two faint white streaks, a small elliptical glint on half the pieces.
- Draw every figure in two passes: (1) fill+stroke every part in lead with lineWidth 1.9 world units = one fat outer outline; (2) clip into each part, paint its glass cells, stroke inner lead 0.55.
- Cut shapes like a glazier: BSP mosaics for bodies/clothes, vertical rib lenses for round fruit/heads, leaves split on the midrib, faceted gems.
- Faces, eyes, flames, jewels are glow pieces (78% warm-white core) plus additive radial glow sprites ('lighter').
- Main character = layered puppet: 8 walk body frames + stand + dash, separate arms (counter-swing), head with 3 faces (ahead, viewer, squint blink), 2-segment scarf on springs that lags and overshoots. Every part baked with a "flash" copy (pieces mixed 58% to warm white, lead kept).
- Floor: per-pixel world-anchored Voronoi glass, large calm cells (19-30 units) inside broad noise regions (meadow greens, crimson leaf carpet, amber 3-lane path, night blue, grey diamond quarries), a strip of 8-unit pieces inside each region edge (gold, pearl, jewels), lead 0.78 / 1.2 units with a metallic ridge rgb(84,78,96), rare rose-window medallions.
- Clustered leaded decals (flower sprays near edges, leaf drifts, star constellations), never an even sprinkle; coloured additive light pools under props (trees, arches, candles, graves).
- Figures crack along their own lead lines and burst into their real pieces when they disappear, and assemble from flying pieces when they appear; impacts add a leaded gold starburst; celebrations project a rose window as light onto the floor.
- Atmosphere: dark-violet vignette, lead window frame with gold #d9ad4e fillet, slowly drifting coloured diagonal light rays.
- UI: lead-bordered glass panels with gold fillet rings, gothic arch tops, mullioned bars; fonts Cinzel Decorative 900 + Cinzel with lead text-shadow outlines.
- Figures brighter/paler than the floor region; gold only for light sources. 360 world units visible vertically.
```
