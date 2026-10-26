# Paper World — Game Art Style Spec

> A handmade craft-table diorama: stop-motion paper puppets with cream sticker rims and brass split pins on layered kraft, felt and newsprint.

Everything looks as if it was cut from real craft materials and laid out on a table under a warm lamp at the top-left. The ground is a stack of large sheets: kraft paper, corrugated cardboard, green felt, a carpet of cut paper leaves and torn newspaper scraps. Characters are jointed paper puppets. Each body part is a separate flat piece with a cream "sticker" rim, paper grain and its own soft drop shadow, and brass split pins hold the joints together. There are **no ink outlines anywhere**. The eye reads edges from the cream rim, the side thickness of the sheets and the cool plum-brown shadows that always fall right-down. Everything moves like hand-moved stop-motion: held poses on twos, cards that pop up on fold tabs, tissue spirits dangling on threads, figures that rip apart and fall flat. The sample cast is a puppet with a round, carved orange pumpkin head and an aubergine tunic, cream root-bulb creatures with torn aubergine caps, translucent tissue-paper ghosts and a large cardboard golem; a path of cardstock stepping stones leads across the table, and impacts snap open card starbursts that shed two-sided paper scraps and confetti.

## At a glance

| Property | Value |
| --- | --- |
| Family | Papercraft · Cut-paper diorama |
| Mood | cozy, handmade, playful, warm, storybook |
| Best for | top-down action games, cozy adventure and farming games, board-game adaptations, family games, seasonal events |
| Renderer | Canvas 2D, fully procedural, no image assets |
| Pixel art | No. Native resolution, sprites baked at 4 px per world unit |
| Complexity | 6/10. Every new asset is a puppet of many separate pieces, each needing rim, grain, light, shadow and pins; the layered ground is expensive |
| Fonts | Patrick Hand, Gochi Hand, Caveat Brush (Google Fonts) |
| Key colours | kraft `#a87c54`, felt `#607c46`, card `#c49c6c`, rim `#fbf6ea`, pumpkin `#e57d2c`, aubergine `#6e3c6d`, teal `#36a596`, shadow `rgb(44,24,34)` |

## When to use it

- **Good fits:** top-down scenes with a medium number of characters on screen, cozy adventures, farming, puzzle and board-game conversions, kids' games, Halloween or Christmas themes. The tactile depth reads well at the usual 360-unit-tall camera.
- **Good for "charming but readable":** the cream rim makes every character pop against busy ground without any dark outline.
- **Bad fits:** bullet-hell shooters with hundreds of tiny projectiles (each would need rim + shadow, and the screen turns to confetti), grim realism, horror that has to feel threatening, sci-fi neon.
- **Risky:** very large crowds. Dense groups of cream-rimmed puppets merge into a white mass, so give each creature type a distinct silhouette and dominant colour.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Kraft ground | `#a87c54` | Base table / kraft paper (tint B `#b4885c`) |
| Kraft | `#ad8259` / dark `#7d5838` / light `#c9a275` | Kraft paper pieces, fold tabs, belts |
| Cardboard | `#c49c6c` / dark `#96714a` / light `#dcbb8c` | Corrugated card sheets, fences, golem |
| Felt green | `#607c46` (tint B `#768442`) | Felt meadow sheets |
| Moss felt | `#868440` | Olive felt patches with a running stitch |
| Newsprint | `#ddd5c0` | Newspaper scraps |
| Paper core | `#f6eedc` | White fibres at torn edges |
| Thread | `#f4e8ce` | Running stitches on felt |
| Sticker rim | `#fbf6ea` | Rim around every cut piece; text outline; HUD borders |
| Cream | `#f2e7cf` / dark `#dccdab` | Paper flowers, sticks, light details |
| Ink brown | `#3b2a26` | Text and darkest drawn details |
| Shadow plum | `#2c1822` = `rgb(44,24,34)` | Every shadow at 0.2–0.6 alpha: a cool, slightly violet shade under the warm lamp |
| Pumpkin | `#e57d2c` / light `#f59c4c` / dark `#bb5a20` / deep `#9c4618` | Main character head, fruit props, accents |
| Glow | `#ffcf4a` / hot `#fff3b8` / deep `#f0922a` | Light behind cut-out holes |
| Aubergine | `#6e3c6d` / light `#9c629a` / dark `#4a2649` / deep `#2e1530` | Main character tunic, creature caps and brows |
| Plum cap | `#843a63` / light `#b4618c` | Cap of the second small-creature variant |
| Mustard | `#d6a43a` / dark `#ac7f26` / light `#ecc463` | Buttons, cuffs, hay |
| Leaf | `#76a54e` / light `#a3cc6a` / dark `#4d7a35` | Sprouts, scarf, leaves |
| Red | `#c4432f` / dark `#8e2c22` | Main bar fill, emphasis numbers, buttons, labels |
| Teal | `#36a596` / mid `#5cc3b2` / dark `#1d6d68` | Collectible gems, secondary bar |
| Denim | `#4f6f95` | Occasional cool accent (pinwheels, notebook lines) |
| Brass | `#d4ac4a` / light `#fff0b0` / dark `#8f6d24` | Split pins |
| Ghost tissue | `rgba(188,212,232,0.62)` / `rgba(248,251,253,0.72)` | Translucent creatures |

**Palette rules**
- Use muted craft-paper colours, never neon. Pumpkin `#e57d2c` and teal `#36a596` are the most saturated colours allowed.
- The ground is about 80% warm browns, tans and felt greens. Characters carry the accents: pumpkin for the main character, aubergine and cream for creatures, teal and gold for collectibles.
- Shadows are always plum-brown `rgb(44,24,34)` at partial alpha: hue-shifted cooler than the warm paper they fall on. Never use black or grey shadows. The leaf carpet's internal shadows use a slightly different multiplier per channel (R × 0.86, G × 0.97, B × 1.0) so shade goes warm, not dull.
- The cream rim `#fbf6ea` is the brightest common value. Only glows and highlights go whiter.
- Never use pure `#000`. The darkest values are `#3a1408` (inside the cut holes), `#2a1424` (pupils) and `#2e1530`.
- Each ground material has two tints mixed by low-frequency noise, plus a global brightness factor `0.93 + 0.13·noise`, so large areas never look flat.
- Glow colours (`#fffbe0 → #ffe066 → #ffa21e`) only appear inside cut-out holes and as additive halos.

## Typography

All three fonts are hand-lettered and come from Google Fonts. Always weight 400.

- **Patrick Hand.** Body text, labels, card descriptions, the style bar. `https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap`
  `font: 400 19px/26px 'Patrick Hand', 'Gochi Hand', cursive; color: #3b2a26;`
- **Gochi Hand.** Numbers and short words: bar text, counters, card titles, floating numbers, key badges. `https://fonts.googleapis.com/css2?family=Gochi+Hand&display=swap`
  `font: 400 22px/1 'Gochi Hand', cursive; color: #3b2a26;`
- **Caveat Brush.** Big titles and banners ("Well done!"), the clock, the style name. `https://fonts.googleapis.com/css2?family=Caveat+Brush&display=swap`
  `font: 400 74px/1 'Caveat Brush', cursive; color: #e57d2c; letter-spacing: 2px;`

**Text effects**
- **Titles get a cut-out sticker rim and are rotated −2° to −3°:** `text-shadow: -3px -3px 0 #fbf6ea, 3px -3px 0 #fbf6ea, -3px 3px 0 #fbf6ea, 3px 3px 0 #fbf6ea, 0 4px 0 #fbf6ea, 7px 10px 6px rgba(20,10,5,.55);`
- **Labels sit on cream paper stickers:** `background:#fbf6ea; padding:0 9px; transform:rotate(-2deg); box-shadow:2px 3px 4px rgba(44,24,34,.4)`.
- **Floating in-world numbers:**
  - Font: Gochi Hand, 8 world units tall (11 for emphasised numbers), rotated by ±0.17 rad per number.
  - Each number gets a shadow fill rgba(44,24,34,0.35) offset (0.5, 0.7), then a stroke 1.8 wide in `#fbf6ea` (2.4 wide in `#fff3c0` when emphasised), then the fill `#3b2a26` (emphasised `#c4432f`).
  - Numbers pop in over 18% of their life with easeOutBack, starting from scale 0.4.

## Rendering technique

The look comes from one primitive, the **cut piece**, plus strict top-left lighting. Every element (characters, props, ground decals, effects, icons) is built from it.

1. **Init: build the paper grain tile.** It is 256×256 px.
   - Each pixel is 50/50 cream `(255,250,235)` or brown `(60,36,20)`, at alpha 0–22/255 and 0–20/255 respectively.
   - On top go 520 short curved fibres, 3–11 px long and 0.5–1.1 px wide, in `rgba(255,248,230,0.22)` (55% of them) or `rgba(70,40,20,0.16)`. 30% of the fibres are rotated 90°.
2. **Init: bake every cut piece** with `mkPart(bbox, draw, opts)`:
   1. Draw the flat shape in world units into a canvas at **K = 4 px per unit**.
   2. **Rim:** dilate the silhouette by `rim × K` px (default rim 0.55 units, 0.3–0.6 range) in `#fbf6ea`. Stamp the one-colour silhouette around 3 rings (r, 0.6r, 0.3r), with `max(8, round(r·3.2))` stamps per ring, then draw the original on top.
   3. **Grain:** fill the grain pattern `source-atop` at alpha 1. Use 0.4–0.7 for foil gems and tissue.
   4. **Light:** fill a diagonal linear gradient (0,0)→(w,h) `source-atop` with stops `0: rgba(255,250,232,a)`, `0.45: transparent`, `1: rgba(50,25,10,1.2a)`. Use a = 0.1 by default, 0.04–0.06 for gems and lanterns.
   5. **Shadow image:** make a `rgb(44,24,34)` silhouette blurred by `0.35 × K` px (`ctx.filter = 'blur()'`, or 10 offset stamps at alpha/4 as a fallback).
3. **Init: compose puppet frames** with `composeFrame(fw, fh, footX, footY, facing, parts)`:
   - Each part is `{p, x, y, r, sh, pin}`, drawn back-to-front at its pivot and rotation.
   - Before each part, draw its shadow image at alpha 0.34, offset **(0.42, 0.55) units** in screen space. Props use (0.55, 0.7).
   - Pins are collected through the current transform and drawn last, unmirrored.
4. **Init: wrap each frame** with `dropSprite`.
   - The whole-puppet shadow is offset **(0.9, 1.1)**, blurred 0.7 units, at alpha 0.3. The large golem uses (1.4, 1.7), blur 1.0. Ghosts use alpha ≈ 0.
   - A white flash copy is the frame tinted `#fffaf0` at 95% `source-atop`.
5. **Stop-motion clock.** Secondary motion is sampled on `on2(t) = floor(t·12)/12` (12 fps), and every action is a held pre-baked pose, so nothing glides.
6. **Ground chunks.** These are 256×256 world units, rendered asynchronously (generator that yields every 2 rows) at ≤ 2.5 px per unit, then decals are drawn on top (see World and ground).
7. **Per frame, in order:**
   1. Ground chunks.
   2. Collectible gems.
   3. Shadows for every character and prop: blob or projected cast shadow.
   4. Props and characters, y-sorted together.
   5. Orbiting objects.
   6. Projectiles.
   7. Particles.
   8. Floating numbers.
   9. Screen vignette.
8. **Resolution.** Sprites are drawn with smoothing on and scaled by `sc / K`. World scale is `canvasHeight / 360`. Nothing is snapped to pixels.

## World and ground

The floor is a top-down view of a craft table: material sheets stacked on kraft paper under a top-left lamp. Each layer is a noise field turned into a **signed distance** (`(fbm − threshold) / |∇fbm|`, clamped to ±90), then shaded per pixel, so outlines are smooth blobs with a slight wobble. Every sheet casts a soft warm-brown shadow right-down onto what lies beneath and shows a darker side face (its thickness) along its lower edge. Layer parameters (shadow offset, blur and alpha, and side thickness are in world units):

| Layer (bottom → top) | Threshold | Edge wobble | Fibre noise | Thickness | Shadow offset | Shadow blur | Shadow alpha |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Kraft base | n/a | – | – | – | – | – | – |
| Cardboard | 0.50 | 0.6 | 0.10 | 1.0 | (1.4, 1.8) | 1.5 | 0.40 |
| Felt | 0.49 | 1.2 | 0.22 | 1.4 | (1.7, 2.2) | 1.9 | 0.42 |
| Moss felt | 0.67 | 0.9 | 0.22 | 0.9 | (1.2, 1.6) | 1.4 | 0.38 |
| Leaf carpet | 0.595 | per leaf | – | – | (0.6, 0.75) | small | 0.42 |
| Newspaper | 0.70 | 2.0 | 0.45 | 0.35 | (1.0, 1.3) | 1.1 | 0.36 |

How each material is shaded:
- **Kraft:**
  - Mixes `[168,124,84]` and `[180,136,92]` by noise.
  - Its luminance texture is mottled fbm plus 2600 mostly horizontal fibres, 3–11 texels long, in `rgba(255,236,200,0.15)` / `rgba(60,36,16,0.13)`.
  - Specks: 260 dark `rgba(50,30,15,0.35)` and 90 light, each 0.4–1 texel.
- **Cardboard** `[196,156,108]`:
  - The top liner is multiplied by a corrugation ridge profile with a **period of 3.2 units**: `1 + 0.055·sin(u·2π − 0.6) − 0.075·gauss(u−0.9, 0.07) + 0.03·gauss(u−0.3, 0.08)`.
  - The side face shows flutes: `0.66 + 0.16·|sin(x·2.3)|`.
  - A 0.7-unit lighter lip (×1.1) runs along the cut edge.
- **Felt:**
  - Mixes `[96,124,70]` and `[118,132,66]`. Moss felt is `[134,132,64]`.
  - The texture is 5200 short curly arcs, radius 1.2–3.2, at ±0.13 alpha.
  - The side is ×(0.72 − 0.12·s).
  - The rim within 1 unit of the edge is lighter (×1.12) on the lamp side and darker (×0.94) on the far side.
  - Moss felt gets a cream thread `[244,232,206]` checker, 1.55–2.15 units inside the edge: a running stitch.
- **Leaf carpet:**
  - A 512² texture of 46×46 = 2116 cut leaves, 8–12 units long and 0.5–0.66 of that wide. Shapes: 30% maple, otherwise oval or wavy.
  - Leaf colours from `[176,82,48] [200,112,50] [206,158,62] [150,58,44] [140,92,54] [184,128,58]`, mixed 45% toward `[172,102,54]` and then 20% toward `[160,94,52]`.
  - Each leaf is darker on one side of the midrib (×0.86 vs ×1.04) and has a lighter midrib fold (×1.13), faint veins (×0.94) and a darker cut edge (×0.9).
  - Each leaf casts a shadow (24% darker) onto lower leaves, offset 2 texels.
  - The carpet's outline is made of whole leaves: a leaf is visible when the region's distance at the leaf centre plus a per-leaf random reach (≤ 5 units) is positive.
- **Newspaper:**
  - Base `#ddd5c0` with yellowed blotches.
  - 8 columns 64 texels wide (25.6 units).
  - Line height 3.2 texels: word bars `rgba(70,64,60,0.32)` 1.3 tall, headline bars `rgba(40,36,34,0.5)` 4.4 tall, halftone pictures of dots `rgba(55,50,48,0.38)` on a 2.6 grid.
  - Column rules are 0.8 wide.
  - The torn edge is a **white fibre core** `[246,238,220]` (`#f6eedc`), 0.55–1.0 units wide (noise-varied), with a slightly lighter band just inside it.
- **Compositing:**
  - The final pixel is `colour × (0.93 + 0.13·noiseA + 0.06·(noiseB−0.5))`.
  - The accumulated shadow from upper layers is applied per channel as ×(1 − 0.86k, 1 − 0.97k, 1 − k), which keeps shade warm.
  - Within 2.4 units outside a sheet's edge there is extra ambient-occlusion darkening of 0.2·(1 + s/2.4)².

**Composition.** The ground is designed in three scales: big material sheets, then a path and grouped props, then small decals clustered where they belong. All decals are flat cut pieces at 6 px per unit (grain 0.9, light 0.08, shadow (0.45, 0.55)·scale at alpha 0.34) baked into the chunk.
- **Stepping-stone path.** The zero line of a slow noise field (`perlin(x/540, y/540)`) meanders across felt, kraft and card. Each 10-unit cell owns the stone that lands in it after one Newton step onto the line; 2 of 16 cells skip a stone. Stones are grey cardstock pieces turned along the path and staggered 0.6–1.4 units left/right like footsteps, with pebbles or felt tufts beside them. There are no stones on leaves or newsprint. Props keep 13 units and big decals 22 units away from the path.
- **Felt-edge fringe.** Grass tufts sit along the meadow's cut edge in runs (noise > 0.5), never as an even border. Loose cut leaves lie up to 9 units outside each leaf carpet, thinning with distance.
- **Flower drifts.** Punched 5–6-petal paper flowers only appear where a 170-unit fbm exceeds 0.6: 4–13 per drift with a dense centre and a thin rim, one or two flower kinds per drift, two tufts at the base.
- **Prop litter.** Each prop group bakes its own ground detail: leaf litter in the crown's colours thrown to the shadow side of trees, straw strokes around hay, pebbles and a flower at gravestones, tufts along fences, flowers around pinwheels, and a curling paper vine (`#4d7a35` with a `#8fb35a` highlight and leaves) linking each pumpkin patch.
- **Rare singles.** On 170-unit cells: lace doilies and coffee rings on kraft, folds and dashed cut lines, stamped "this side up" arrows on cardboard. On 26-unit cells, a very sparse layer (3–14%) of buttons, masking tape, staples, confetti and pebble trios, each only in its own region.

## Characters

Every character is a **jointed paper puppet**: separate flat cut pieces (rim, grain, light, own shadow) rotated around pivots, drawn back-to-front, each dropping a blurred shadow (0.42, 0.55 units, alpha 0.34) onto the pieces below, with brass split pins on the visible joints. Every pose is a pre-baked **held frame** with a whole-puppet shadow (0.9, 1.1, blur 0.7, alpha 0.3) and a cream flash copy.

**Main character** — about 18 units wide and 30 tall: a small puppet in an aubergine tunic and green striped scarf with a big round pumpkin head whose face is carved out and glows. Frame 36×44 units, feet at (18, 40), drawn at scale 1.08. Pieces, back to front:

1. **Back leg** (`#6f4c30` trousers, `#3e281b` boot) and **front leg** (`#8d6440`, `#5b3d2a` boot) with a dashed seam and a boot highlight; each leg piece is scaled 0.72–1.1 in length so the planted foot stays on the ground.
2. **Back arm** in the darker tunic colour `#4a2649`, with a cuff and hand.
3. **Scarf tail**: green `#76a54e` with diagonal `#4d7a35` stripes and a fringe; it is the main follow-through piece.
4. **Tunic body** `#6e3c6d`: a 7-tooth zig-zag hem, a `#9c629a` front panel as a second layer, a kraft belt with a brass buckle, a dashed stitch hem `rgba(250,236,210,0.7)` and two mustard buttons.
5. **Front arm** with a **brass split pin at the shoulder**.
6. **Stem**: `#5f6e30` with a curly tendril `#7c9a40`, pivoting on its own so it can flop.
7. **Pumpkin head**, 19 units wide: four stacked lobes `#9c4618`, `#bb5a20`, `#e57d2c`, `#f59c4c` (front, offset +0.9), each with a `rgba(70,25,5,0.28)` shadow offset (0.3, 0.4). The face is **cut out** (triangle eyes and nose, jagged mouth) as `glowHole`s: dark `#3a1408`, then `#fffbe0 → #ffe066 → #ffa21e` shifted (0.32, 0.45). The face sits 1.7 units toward the facing side.
8. **Scarf wrap** with stripes and a `#a3cc6a` knot.

**Main character poses (34 per facing, mirrored for the other facing with pins drawn unmirrored):**
- **Walk, 8 poses:** 4 key poses per step (contact, down, passing, up), mirrored for the second step. Hip heights −5.55 / −5.15 / −6.45 / −7.05, lean 0.04–0.09 rad, the body piece squashes 3.5% on the down pose and stretches 3% on the up pose. The head lags the hip by one pose (`headDy = lag·0.55`), the scarf tail and stem by two.
- **Walk-and-throw, 8 poses:** the same walk with the front arm raised to −2.05 / −2.3 rad.
- **Idle, 8 poses:** breathing (hip ±0.22, body ±2%), head lagging 0.9 rad and stem 1.7 rad behind the breath.
- **Look-around, 4 poses:** a quick look up over the shoulder with the stem flopping after the head.
- **Dash, 3 poses:** anticipation crouch (hip −4.9, squash 0.92), stretched leap (hip −7.3, scarf streaming −1.05 rad), recover.
- **Toss, 2 poses** (release, follow-through) and **hurt, 1 pose** (thrown back, arms up, scarf flying).
- **Face glow:** an additive 22-unit glow over the face at (x + facing·2.6, y − 24.2), flickering on twos.

**Small creature (root bulb)** — two designed variants, frame 32×38, feet at (16, 33):
- **Lanky:** a bulb 7.4 wide and 15.2 tall, aubergine `#6e3c6d` torn cap, three upright leaves (one pinned).
- **Squat:** 8.4 × 13.4, plum `#843a63` cap with `#b4618c` streaks, one big dark leaf, a small olive leaf and a **curled paper sprout** (a strip rolled round a pencil).
- **Shared:** cream bulb gradient `#efe2b8 → #dcc68a`; the torn cap (`tornCap`, jagged step 1.1 ±0.45 plus a 0.5 sine) sits over a 0.55-unit white core and a shadow strip; glowing curved eye holes `#fff2a0 → #ffb02e → #e0561c` with `#2a1424` pupils; angry brows of aubergine-deep paper strips; a jagged frown `#3a1830`; two root legs and two stubby arms (front one pinned).
- **8 waddle poses:** the bulb rocks ±0.13 rad over the planted root, squashes x +7.5% / y −8.5% on each footfall, and the leaves arrive one radian late.

**Fast creature (tissue ghost)** — frame 30×37, feet at (15, 33):
- Two tissue sheets: `rgba(188,212,232,0.62)` behind and `rgba(248,251,253,0.72)` in front (0.86×0.9), tissue-strip arms, crinkle strokes, hollow eyes `rgba(43,36,64,0.85)`, a gaping mouth and four frost sequins.
- **Silhouette feature:** the tissue is gathered into a twisted knot with three flared tips and tied to a thin thread `#5a4658` (0.38 wide, drawn as three fading segments) that rises 20 units, so the ghost dangles like a puppet.
- Rim 0.35 in `rgba(255,255,255,0.75)`, grain 0.7, no puppet shadow, drawn at alpha 0.93. **6 hem-flutter poses** at 8 fps.

**Large creature (cardboard golem)** — frame 66×70, feet at (33, 64):
- **Body:** cardboard `#c49c6c` with a cream-painted lower half `#e9d9ae`, a torn aubergine painted top over an **exposed corrugated band** (`#dcbb8c`, flutes every 0.95 units), masking-tape patches over a pencil crack, staples, and a leaf crown.
- **Face and core:** slanted glowing eye slits under a heavy brow strip and a glowing jagged star-shaped core hole with a pulsing additive glow.
- **Limbs:** cardboard-tube arms (`#dcbb8c → #c49c6c → #96714a`) with tape bands, ring ends and root fingers; two pins.
- **8 stomp poses:** a heavy landing on each step (`|sin(φ − 0.4)|³`) and an arm whip that trails the body. Drop shadow (1.4, 1.7).

**Rules that keep characters on-style:**
- Flat fills only; volume comes from overlapping layers, each with its own little shadow. Round forms are 3–5 stacked lobes.
- Faces are holes or paper strips, never painted lines. Every piece has a rim (0.35–0.45 thin, 0.55–0.6 large).
- Proportions are storybook: the head is about 60% of the height, with stubby limbs.
- Each creature type has its own dominant colour, silhouette feature and material: cream + aubergine root bulbs, tissue on a thread, cardboard + tape.

## Props

Props are **stand-up cut-outs**: each stands on a **fold tab** (a trapezoid of `#c9a275`; grey `#b3aebb` for stones; with a darker 0.7-unit crease band) and is composed like a puppet frame with part shadows offset (0.55, 0.7). Every prop gets a **projected cast shadow**: the silhouette skewed with `setTransform(1, 0, −0.42, −0.26, …)` so it falls right-down from the foot, faded 1 → 0.45 with distance, blurred 1.4 units, with a dark contact blob `rgba(44,24,34,0.55)` at the base; drawn at alpha 0.78 and y-sorted with the characters.

The prop set (2–3 designed variants each):
- **Round trees** (frame 60×82): a tapered trunk `#76503a` with cut branches and a shaded right half, three scalloped crowns (11/9/8 bumps) in autumn triplets `#9c4a2a / #c86a30 / #d9a23e`, `#8c3a2c / #b8542e / #e08a3a`, `#9a6a2a / #c8962e / #e2be5a`; brass pin on the front crown.
- **Pines** (frame 44×70): four zig-zag felt tiers `#445e34 → #859a4e` (dark variant `#3f5a30 → #76994c`) with shaded right halves.
- **Bare tree**: a thin dark trunk `#5e4034` with five hanging paper leaves.
- **Pumpkins** (frame 26×22): five concentric ellipses in orange, mustard or cream colourways with rib strokes, a stem `#6a7a38` and a leaf.
- **Mushrooms**: a spotted red pair, a tall tan parasol, or a huddle of small cream caps, each cap shaded on its right side.
- **Gravestones**: grey `#9b97a3`, arched or cross-shaped, inner border, emblem, scribbled text lines, moss-felt scallop at the base.
- **Picket fences**: card pickets alternating `#c49c6c` / `#cba574` on `#96714a` rails, held with masking tape. **Hay mounds**: 140 straw strokes. **Pinwheels**: striped cream stick, four coloured blades, brass hub pin, spinning 1.2–2.8 rad/s with a soft rotating shadow.

**Placement as groups.** One site per 128-unit cell (50% chance, none within 95 units of the start or 13 units of the path), chosen by region:
- **Felt:** a round tree with 0–2 mushrooms on its shady right side, a pumpkin patch of 1–3 (side ones 0.7–0.95 scale), hay or a pinwheel.
- **Moss felt:** a pine stand (one tall pine plus 1–2 younger ones at 0.62–0.8 behind it) or mushrooms.
- **Leaf carpet:** a bare tree, or a row of 1–3 gravestones 20 units apart.
- **Cardboard:** fences, pinwheels, pumpkins. **Newsprint:** at most a pinwheel.

**Ambient motion:** trees, pines and bare trees rock on their fold tab, `a = 0.014·sin(on2(t)·0.9 + x·0.031 + y·0.017) + 0.004·sin(on2(t)·2.3 + x·0.05)`, so neighbours never sway in lock-step.

## Effects and particles

Effects are layered like a paper pop-up: **core flash → main shape → debris → residue**, each with its own lifetime and easing, and all of them made of paper.

- **Card starburst (core).** A cut card star (`#ecc463` with a `#fff3b8` centre; red `#e0604a` / `#ffd9b8` when the main character is struck) snaps open with easeOutBack over the first 40% of its 0.15 s life, then shrinks; stepped on twos, with its own part shadow.
- **Petal ring (main shape).** Nine cut petals in the destroyed figure's colours burst outwards (radius 0.25 → 1.2 × size, easeOut), each folding over as it flies (y-scale `|cos(t·4 + i·1.3)|`, back colour ×0.72, every third petal cream). 0.36 s, 0.45 s for large figures.
- **Paper scraps (debris → residue).** Six cached 5–7-gon Path2D shapes in the source figure's palette: 2 per impact (3 on large figures), 8 / 6 / 16 when a small / ghost / large figure is destroyed, 7 when the main character is struck. vz 25–80, gravity 70, drag 2.2, spin ±6 rad/s. Each flips (y-scale `max(0.18, |cos(rot·1.7)|)`, back colour ×0.72 when cos < 0) and has a 0.16-unit cream edge. The ground shadow tightens as the scrap lands, and landed scraps lie flat until their 0.9–1.6 s life ends.
- **Tear-apart.** A destroyed card creature is clipped along fixed 8-point zig-zag tear paths, ripping top first: two pieces, or three for the large figure (a middle strip). With `e1 = easeOut(k/0.3)` and `e2 = easeIn((k − 0.12)/0.88)`, the pieces slide apart (`w·(0.22·e1 + 0.55·e2)`), rotate `side·(0.1·e1 + 1.05·e2)` and hinge flat (height × `1 − 0.66·e2²`, middle 0.82). The card back darkens (flash copy at `0.45·e2`), a 1.0-unit cream line marks the tear, and everything fades over the last 28%. The large figure adds 6 kraft dust clumps `#d8c4a0`.
- **Tissue crumple.** The ghost's thread snaps and whips up 16 units; the sheet scrunches to 0.34×0.45 with a jittered double copy; from 30% a crumpled tissue ball (crease facets, one eye hole) drops to the ground and bounces once.
- **Confetti.** Dots and strips in `#e57d2c #d6a43a #36a596 #c4432f #9c629a #f2e7cf #76a54e`, gravity 120, drag 2.4, sideways flutter `sin(age·7)·0.6`.
- **Celebration.** A cut-card sunburst ring snaps open (easeOutBack over 30%) and turns on twos for 0.85 s, plus 8 curly paper streamers trailing behind their flight, 6 folded paper stars (gold / teal) and 30 confetti.
- **Projectile.** A spinning cut seed (`#f4e8c6`, brown rim, scale 0.85) with its own part shadow, a cream streak `rgba(251,246,234,0.5)` 1.6 wide (3–11 units back) and a pumpkin streak 0.7 wide (4–13).
- **Collectibles.** Origami foil gems (4 triangular facets; teal `#bff3e8 #5cc3b2 #36a596 #1d6d68`, large gold `#fff1a6 #f0c64a #d39a2a #9a6a18`) that hop on twos and fake a paper turn. Collecting pops a folded paper star plus 3–5 confetti; an additive 8-point glint twinkles on its own 12% of the time.
- **Orbiting objects.** Vellum root-bulb lanterns (radial `#fff3c4 → #f5d690 → #c9a0c8`) with glowing cut faces that hang on a short wire and trail behind their orbit.
- **Dash.** Three stacked cream card silhouettes of the current pose, 6.5 units apart (alpha 0.38 / 0.26 / 0.14, scale −4% each), three torn cream speed strips, and clumps of five torn paper flecks `#e6d6b4` that spread and thin — never soft circles.
- **Glow halos.** A 96 px radial sprite `rgba(255,214,110,0.95) → rgba(255,170,60,0.45) @0.25 → rgba(240,110,30,0.12) @0.6 → 0`, drawn `'lighter'` at about 0.3 over faces, lanterns and the golem core.

## Atmosphere and lighting

- **Light direction:** one warm lamp, fixed top-left. All shadows fall right-down, and the offset grows with layer height:
  - parts inside a puppet: (0.42, 0.55)
  - parts inside a prop: (0.55, 0.7)
  - decals: (0.45, 0.55)
  - leaves in the carpet: (0.6, 0.75)
  - whole puppets: (0.9, 1.1), blur 0.7
  - ground sheets: (1.0–1.7, 1.3–2.2), blur 1.1–1.9
- **Shadow colour:** always plum-brown `rgb(44,24,34)` at 0.2–0.6 alpha, never black or grey. It is deliberately cooler than the lamp-lit paper (hue-shifted shade).
- **Per-piece light:** each cut piece carries the diagonal source-atop gradient (cream top-left at a ≈ 0.1, brown 1.2a bottom-right), and lobe layers drop `rgba(70,25,5,0.28)` shadows offset (0.3, 0.4).
- **Character contact shadow:** a radial blob `rgba(44,24,34,0.62) → 0.36 @0.55 → 0`, offset (+1.2, +0.6), drawn at alpha 0.75. Sizes:
  - main character 9×3.6
  - small creature 8.5×3.2
  - large creature 19×6
  - ghost 6.5×2.4 at alpha 0.55
- **Prop shadows:** projected skewed cast shadows (see Props).
- **Ambient motion:** slow and stepped: trees rock on their fold tabs, pinwheels spin, ghosts sway on their threads. Nothing drifts across the screen.
- **Glow:** only additive (`'lighter'`) radial sprites over carved faces, lanterns and the golem's core. Nothing else glows.
- **Vignette:** one screen-space radial gradient centred at (0.45 W, 0.42 H). Stops: `rgba(255,236,200,0.05)` from 0.35R, `rgba(70,40,20,0)` at 0.6, `rgba(60,30,15,0.36)` at R (R = half the diagonal). Cache it per screen size.
- **No colour grading, bloom or blur post-processing.** The warmth is all in the palette and shadows.
- **Modal overlay:** `radial-gradient(ellipse at center, rgba(60,35,20,.35), rgba(40,22,12,.72))`, warm brown, never grey.

## UI

The HUD is made of craft materials too:
- **Bars** are paper strips. Each has a 3px cream rim (`box-shadow: 0 0 0 3px #fbf6ea`), a warm offset shadow and a slight rotation (−0.4° to 0.6°).
- **Bar fills** have a torn zig-zag right edge (clip-path). The main bar fill is tomato red with cream polka dots. The secondary bar fill is diagonal teal stripes.
- **Counters** sit on cream stickers.
- **The timer** sits on lined notebook paper: a red margin line, blue ruled lines and a brass split pin at the top.
- **Cards** are lined notebook pages rotated −3°, 1.5° and 3.5°, each with striped washi tape (teal, mustard or plum) across the top. Hovering a card straightens it.
- **Key badges** are pumpkin circles with a cream rim.
- **Icons** are small cut-paper drawings on a 48-unit canvas: 1.6 rim, grain 0.7, light 0.08, and a shadow offset (1.4, 1.9) at alpha 0.42.

```css
.hud-bar { width: 240px; height: 22px; background: #c9a275; border-radius: 2px; transform: rotate(0.6deg); overflow: hidden;
  box-shadow: 0 0 0 3px #fbf6ea, 3px 5px 6px rgba(44,24,34,.45);
  background-image: repeating-linear-gradient(0deg, rgba(90,60,30,.12) 0 1px, transparent 1px 4px); }
.hud-bar > .fill { height: 100%;
  background: radial-gradient(circle at 5px 5px, rgba(255,240,220,.55) 1.6px, transparent 2px) 0 0/10px 10px, #c4432f;
  clip-path: polygon(0 0, 100% 0, calc(100% - 4px) 25%, 100% 50%, calc(100% - 4px) 75%, 100% 100%, 0 100%); }
.hud-bar2 { height: 24px; background: #f4ead2; transform: rotate(-0.4deg); box-shadow: 0 0 0 3px #fbf6ea, 3px 5px 6px rgba(44,24,34,.45); }
.hud-bar2 > .fill { background: repeating-linear-gradient(-45deg, #36a596 0 9px, #5cc3b2 9px 18px); }
.hud-label { font: 400 22px 'Gochi Hand', cursive; color: #3b2a26; background: #fbf6ea; padding: 0 9px;
  border-radius: 2px; transform: rotate(-2deg); box-shadow: 2px 3px 4px rgba(44,24,34,.4); }
.hud-note { position: relative; background: #fffdf6; padding: 6px 26px 4px; transform: rotate(-1.5deg); border-radius: 2px;
  background-image: linear-gradient(transparent 13px, rgba(196,67,47,.5) 13px 15px, transparent 15px),
                    repeating-linear-gradient(transparent 0 19px, rgba(79,111,149,.28) 19px 20px);
  box-shadow: 3px 6px 8px rgba(44,24,34,.45); font: 400 40px/1 'Caveat Brush', cursive; color: #3b2a26; }
.hud-note::before { content: ''; position: absolute; left: 50%; top: -6px; width: 15px; height: 15px; margin-left: -7px; border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #fff0b0, #d4ac4a 50%, #8f6d24); box-shadow: 1px 2px 2px rgba(44,24,34,.5); }
.card { background: #fffdf6; border-radius: 3px; transform: rotate(-3deg); box-shadow: 4px 9px 12px rgba(20,10,5,.55);
  background-image: linear-gradient(transparent 58px, rgba(196,67,47,.55) 58px 60px, transparent 60px),
                    repeating-linear-gradient(transparent 0 25px, rgba(79,111,149,.25) 25px 26px); }
.card::before { content: ''; position: absolute; top: -12px; left: 50%; width: 92px; height: 26px; margin-left: -46px; transform: rotate(-4deg);
  background: repeating-linear-gradient(-45deg, rgba(54,165,150,.75) 0 7px, rgba(154,230,214,.75) 7px 14px); }
.overlay { background: radial-gradient(ellipse at center, rgba(60,35,20,.35), rgba(40,22,12,.72)); }
```

## Motion and animation

- **Stop-motion rule:** poses are held pre-baked frames, never tweened. Secondary motion (glow flicker, ghost bob and sway, prop rocking, starbursts, collectible hops, lantern bob) is sampled on a 12 fps clock `on2(t) = floor(t·12)/12`. Pieces rotate rigidly; squash is a few percent on a whole piece.
- **Main character:**
  - Walk: `frame = floor(anim/5·8) & 7`, one stride per 50 world units (about 15 poses/s at walking pace). While throwing, the walk-and-throw set is used.
  - Idle: 8 breathing poses at 5 fps; every 5.5 s a 0.8 s look-around in 4 poses (0.2 s each).
  - Dash: crouch while `dashT > 0.165` (the first 35 ms), leap, then recover for the last 50 ms.
  - Standing throw: release while `shootT > 0.72`, then follow-through.
  - Struck: hurt pose for 0.18 s with a cream flash copy, then blinks on twos (alpha 0.5 every other 1/12 s) while invulnerable.
  - Celebration squash: `sy = 1 + sin(on2(T)·14)·T·0.12`, `sx = 2 − sy`, T running 1 → 0 over 0.67 s.
- **Small creature:** `frame = floor(anim·0.42·8) % 8`, so the waddle advances with distance travelled and every creature starts at its own phase.
- **Large creature:** 8 poses at rate 0.28, heavy landing and arm whip; the core glow pulses on twos.
- **Fast creature (ghost):** 6 flutter frames at 8 fps (`floor(t·8 + seed·13)`), a yo-yo bob `−2.2 − 1.9·(0.5 + 0.5·sin(on2(t)·1.7 + seed·20))^2.2`, and a pendulum sway on its thread integrated in 1/12 s steps: target `clamp(vx·0.006, ±0.38) + 0.07·sin`, spring 0.32, damping 0.24, kicked ±0.22 by hits.
- **Appear (0.45 s):** card creatures slide out flat on a kraft fold tab and hinge upright: `u = (t − 0.2)/0.8`, `sy = 0.06 + 0.94·easeOutBack(u)`, x-scale grows from 0.55 then overshoots by `(1 − u)·0.14`, tilt `(1 − u)²·0.18`, the tab fades. Ghosts are lowered 34 units on their thread with an easeOutBack overshoot and fade in over the first third.
- **Hit (~140 ms):** flash decays at 7/s; `hk = flash²`; the figure squashes against the blow (`sx·(1 + 0.17·hk)`, `sy·(1 − 0.15·hk)`) and is knocked back `0.24·hk` rad on its base, with the cream flash copy at `flash·1.1`.
- **Destroyed (0.35 s):** tear-apart or tissue crumple (see Effects); the contact shadow fades with it.
- **Per-instance variety:** scale `0.93 + seed·0.14` (large 0.97 + seed·0.06), own phase for walk, flutter, bob and sway, so crowds never move in lock-step.
- **Collectibles:** a hop on twos (`outQuad` lift over 35%, `smoothstep` settle, 1.6 units) and a paper turn `scaleX = 0.35 + 0.65·|cos(2.2t)|`; appear pop easeOutBack.
- **Orbiting lanterns:** eased bob on twos and a pendulum lag of `−sin(orbitAngle)·0.2` rad plus a small flutter.
- **Pinwheels:** 1.2–2.8 rad/s. **Face glow:** `0.3 + 0.05·sin(9t) + 0.04·sin(23.7t)` on twos, +0.12 while throwing.

## Do and don't

**Do**
- Build every object from separate flat cut pieces. Give each one the cream rim, grain, top-left light and an offset shadow.
- Keep all shadows plum-brown and offset right-down. A higher layer gets a larger offset.
- Animate like stop-motion: held poses on twos, 4 key poses per step, parts that lag (head one pose, scarf and stem two).
- Give every state its own paper action: pop-up cards to appear, squash-and-knock-back for hits, tearing or crumpling to disappear.
- Compose the ground: one path that leads somewhere, props in small groups with baked litter, flowers in drifts.
- Use craft materials as your vocabulary and show their edges: torn white cores, sheet thickness, corrugation flutes, stitches, tape, pins.
- Pre-bake every frame and ground chunk.

**Don't**
- Don't draw black or dark outlines. The cream rim and shadows do that job.
- Don't use smooth radial "3D" shading on bodies. Stack flat layers instead.
- Don't use grey or black shadows, or let shadows point in different directions.
- Don't bend or morph pieces, and don't tween poses smoothly at 60 fps — it looks floaty and digital.
- Don't sprinkle decals evenly, and don't simply fade figures out.
- Don't leave any piece without grain. Clean fills instantly look digital.
- Don't dilate or blur at runtime. It costs dozens of drawImage calls per piece.

## Implementation recipe

1. **Set up the camera.** Use a world-unit camera with a visible height of 360 units, `scale = canvasHeight / 360`, and smoothing on.
2. **Write the material helpers:** `cv`, `sil` (silhouette), `dilate` (rim), `softShadow` (blur), `buildGrain`, `applyGrain`, `applyLight`, and `mkPart(bbox, draw, {rim, grain, light, shBlur, rimColor})` at K = 4 px per unit.
3. **Write `drawPin`.** It draws the brass split pin: a shadow disc offset (0.18, 0.24), a radial gradient `#fff0b0 → #d4ac4a @0.45 → #8f6d24` centred at −0.35r, and a slot line.
4. **Write the puppet helpers:** `composeFrame` (parts with pivots, per-part shadow offset (0.42, 0.55) at alpha 0.34, pins drawn last) and `dropSprite` (puppet shadow (0.9, 1.1), blur 0.7, alpha 0.3, plus a white flash copy).
5. **Design the main character** as 6–9 pieces: legs, body, arms, head, accessory.
   - Round forms: stacked lobes in deep/dark/mid/light.
   - Face: `glowHole` cut-outs.
   - Clothing: a lighter front panel and a stitch line.
   - Bake 8 walk (4 key poses × 2 steps), 8 walk-and-action, 8 idle and a few action poses per facing; let the head lag one pose and loose parts two.
6. **Design each creature type** with the same pieces but its own dominant colour and silhouette.
   - Use torn caps (`tornCap`) to split two colours on one piece.
   - Use tissue (alpha sheets, translucent rim) for spirits and cardboard (tape, staples, corrugation) for large figures.
7. **Build the ground** as stacked material sheets on a base paper. For each sheet:
   - Draw a blurred shadow offset right-down.
   - Draw the darker side face shifted down by the sheet's thickness.
   - Fill the top with a material texture (2.5 texels per unit).
   - Torn sheets get a white core edge; felt gets a running stitch.
8. **Compose the decals:** a stepping-stone path along a noise zero line, fringes in runs along sheet edges, flower drifts where a slow noise is high, and litter around each prop group. Each decal is a mini cut piece with a shadow.
9. **Build props** as stand-up cut-outs on fold tabs, each with a skewed, blurred cast shadow, placed as small groups by region.
10. **Draw characters per frame:** pick the held pose, then contact blob shadow, sprite blit, flash overlay and additive glows. Spawn, hit and death are transforms or clips of the same baked frame. Y-sort characters and props together.
11. **Add the layered effects:** card starburst, petal ring, two-sided flipping scraps that land, confetti, tear-apart, tissue crumple and streaked projectiles.
12. **Finish with the warm vignette.** Then build the HUD in CSS with paper strips, stickers, notebook paper, washi tape and the hand-lettered fonts.

## Code

The snippets below are the core techniques, ported from the module so they run on their own. `starter.js` (in this folder) contains them plus a stop-motion main character (4 key poses per step, lagging head and scarf), a waddling root-bulb creature, a ghost on a thread, a tree, pumpkins, a stepping-stone path, layered ground and a preview `draw()`. The full module is `../../js/styles/paper.js`.

**1. The cut piece (rim + grain + light + shadow)**

```js
const K = 4, TAU = Math.PI * 2, SH = 'rgb(44,24,34)';
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
function sil(src, col) { const c = cv(src.width, src.height), x = c.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); return c; }
function dilate(src, r, col) { // white sticker rim
  const pad = Math.ceil(r) + 2, c = cv(src.width + pad * 2, src.height + pad * 2), x = c.getContext('2d'), s = sil(src, col);
  for (const rr of [r, r * 0.6, r * 0.3]) { const n = Math.max(8, Math.round(rr * 3.2)); for (let i = 0; i < n; i++) { const a = ((i + 0.5) / n) * TAU; x.drawImage(s, pad + Math.cos(a) * rr, pad + Math.sin(a) * rr); } }
  x.drawImage(s, pad, pad); return { c, pad };
}
function applyLight(x, w, h, a) { // top-left lamp across the whole piece
  x.save(); x.globalCompositeOperation = 'source-atop';
  const g = x.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, `rgba(255,250,232,${a})`); g.addColorStop(0.45, 'rgba(255,250,232,0)'); g.addColorStop(1, `rgba(50,25,10,${a * 1.2})`);
  x.fillStyle = g; x.fillRect(0, 0, w, h); x.restore();
}
function mkPart(bb, draw, rim = 0.55, grainTile = null) {
  const c = cv((bb[2] - bb[0]) * K + 4, (bb[3] - bb[1]) * K + 4), x = c.getContext('2d');
  x.setTransform(K, 0, 0, K, -bb[0] * K + 2, -bb[1] * K + 2); draw(x);
  const d = dilate(c, rim * K, '#fbf6ea'); const ix = d.c.getContext('2d'); ix.drawImage(c, d.pad, d.pad);
  if (grainTile) { ix.save(); ix.globalCompositeOperation = 'source-atop'; ix.fillStyle = ix.createPattern(grainTile, 'repeat'); ix.fillRect(0, 0, d.c.width, d.c.height); ix.restore(); }
  applyLight(ix, d.c.width, d.c.height, 0.1);
  const pad = Math.ceil(0.35 * K * 2.5) + 2, sh = cv(d.c.width + pad * 2, d.c.height + pad * 2), sx = sh.getContext('2d');
  sx.filter = `blur(${0.35 * K}px)`; sx.drawImage(sil(d.c, SH), pad, pad); sx.filter = 'none';
  return { img: d.c, ox: -bb[0] * K + 2 + d.pad, oy: -bb[1] * K + 2 + d.pad, sh, shPad: pad };
}
```

**2. Puppet frame with per-part shadows and brass pins**

```js
function drawPin(x, px, py, r) {
  x.fillStyle = 'rgba(44,24,34,0.35)'; x.beginPath(); x.arc(px + 0.18, py + 0.24, r * 1.05, 0, TAU); x.fill();
  const g = x.createRadialGradient(px - r * 0.35, py - r * 0.35, r * 0.1, px, py, r);
  g.addColorStop(0, '#fff0b0'); g.addColorStop(0.45, '#d4ac4a'); g.addColorStop(1, '#8f6d24');
  x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill();
  x.strokeStyle = 'rgba(90,60,20,0.55)'; x.lineWidth = 0.12;
  x.beginPath(); x.moveTo(px - r * 0.55, py + r * 0.1); x.lineTo(px + r * 0.55, py - r * 0.1); x.stroke();
}
function composeFrame(fw, fh, footX, footY, facing, list) {
  const c = cv(fw * K, fh * K), x = c.getContext('2d'), pins = [];
  for (const it of list) {
    const p = it.p, place = (dx, dy) => { x.setTransform(K, 0, 0, K, (footX + dx) * K, (footY + dy) * K); x.scale(facing, 1); x.translate(it.x, it.y); if (it.r) x.rotate(it.r); };
    if (it.sh !== 0) { place(0.42, 0.55); x.globalAlpha = it.sh ?? 0.34; x.drawImage(p.sh, (-p.ox - p.shPad) / K, (-p.oy - p.shPad) / K, p.sh.width / K, p.sh.height / K); }
    place(0, 0); x.globalAlpha = 1; x.drawImage(p.img, -p.ox / K, -p.oy / K, p.img.width / K, p.img.height / K);
    if (it.pin) { const m = x.getTransform(); pins.push([(m.a * it.pin[0] + m.c * it.pin[1] + m.e) / K, (m.b * it.pin[0] + m.d * it.pin[1] + m.f) / K, it.pin[2]]); }
  }
  x.setTransform(K, 0, 0, K, 0, 0); for (const q of pins) drawPin(x, q[0], q[1], q[2]); // unmirrored -> highlight stays top-left
  return c;
}
```

**3. Cut-out glowing face hole and torn two-colour cap**

```js
function glowHole(x, path, gx, gy, gr, hot, mid, edge) {
  x.save(); path(); x.clip();
  x.fillStyle = '#3a1408'; x.fillRect(gx - gr * 3, gy - gr * 3, gr * 6, gr * 6); // the cut edge (paper thickness)
  x.translate(0.32, 0.45);                                                     // light paper sits lower-right of the hole
  const g = x.createRadialGradient(gx, gy, 0, gx, gy, gr * 1.5);
  g.addColorStop(0, hot); g.addColorStop(0.5, mid); g.addColorStop(1, edge);
  x.fillStyle = g; path(); x.fill(); x.restore();
}
function tornCap(x, rand, x0, x1, y, top, col, coreW) { // rand() in [0,1)
  const pts = []; for (let px = x0; px <= x1 + 0.01; px += 1.1) pts.push([px, y + (rand() * 2 - 1) * 0.45 + Math.sin(px * 0.45) * 0.5]);
  const poly = (dy) => { x.beginPath(); x.moveTo(pts[0][0], top); for (const p of pts) x.lineTo(p[0], p[1] + dy); x.lineTo(pts[pts.length - 1][0], top); x.closePath(); };
  x.fillStyle = 'rgba(44,24,34,0.22)'; poly(coreW + 0.35); x.fill(); // shadow
  x.fillStyle = '#fbf6ea'; poly(coreW); x.fill();                    // white paper core
  x.fillStyle = col; poly(0); x.fill();                              // coloured layer
}
```

**4. A ground sheet**

```js
// one stacked material sheet: shadow on what lies below, side thickness, textured top (world units, ctx scaled by s)
function sheet(x, s, path, fill, L /* {ox, oy, soft, sh, thick, side} */) {
  x.save(); x.filter = `blur(${L.soft * s}px)`; x.translate(L.ox, L.oy); path(x); x.fillStyle = `rgba(44,24,34,${L.sh})`; x.fill(); x.restore();
  x.save(); x.translate(0, L.thick); path(x); x.fillStyle = L.side; x.fill(); x.restore();
  path(x); x.fillStyle = fill; x.fill();
}
// felt: sheet(x, s, feltPath, feltPattern, { ox: 1.7, oy: 2.2, soft: 1.9, sh: 0.42, thick: 1.4, side: '#455a33' })
```

**5. Stop-motion clock and the tear-apart death**

```js
const on2 = (t) => Math.floor(t * 12) / 12; // sample secondary motion at 12 fps
const easeIn = (t) => t * t, easeOut = (t) => 1 - (1 - t) * (1 - t);
const TEAR = [[0.1, -1.05], [-0.25, -0.85], [0.2, -0.68], [-0.15, -0.5], [0.25, -0.32], [-0.2, -0.15], [0.15, 0.02], [-0.1, 0.2]];
// k = 0..1 over 0.35 s; sprite(ctx) draws the baked frame with feet at (0,0); h, w = frame height and width in units
function tearApart(ctx, x, y, k, h, w, sprite) {
  const e1 = easeOut(Math.min(1, k / 0.3)), e2 = easeIn(Math.min(1, Math.max(0, (k - 0.12) / 0.88)));
  for (const side of [-1, 1]) {
    ctx.save(); ctx.globalAlpha = k > 0.72 ? 1 - (k - 0.72) / 0.28 : 1;
    ctx.translate(x + side * (w * 0.22 * e1 + w * 0.55 * e2), y);
    ctx.rotate(side * (0.1 * e1 + 1.05 * e2));                  // the half topples outwards ...
    ctx.scale(1 - 0.28 * Math.sin(e2 * Math.PI), 1 - 0.66 * e2 * e2); // ... and hinges flat onto the ground
    ctx.beginPath(); ctx.moveTo(side * w * 3, -h * 1.2);
    for (const [dx, t] of TEAR) ctx.lineTo(dx * w * 0.5, t * h);
    ctx.lineTo(side * w * 3, h * 0.3); ctx.closePath(); ctx.clip();
    sprite(ctx);
    ctx.strokeStyle = '#fbf6ea'; ctx.lineWidth = 1; ctx.beginPath();     // white torn core along the rip
    TEAR.forEach(([dx, t], i) => (i ? ctx.lineTo(dx * w * 0.5, t * h) : ctx.moveTo(dx * w * 0.5, t * h))); ctx.stroke();
    ctx.restore();
  }
}
```

## Adapting it to your project

- **Keep fixed:**
  - the cut-piece pipeline (rim, grain, light, shadow)
  - top-left light and warm brown right-down shadows
  - no outlines
  - rigid-piece puppet animation
  - brass pins
  - torn white cores
  - hand-lettered fonts
  - the paper-strip HUD
- **Re-theme by changing materials, not technique:**
  - **Winter:** white felt `#e8ecef`, blue tissue, silver-foil gems.
  - **Ocean:** blue crepe paper with wavy torn edges, sand-coloured kraft, shell buttons.
  - **Sci-fi:** silver card, black construction paper, foil stickers (keep the cream rim).
- **Palette swaps:** keep one warm base paper (~25%), one cool large material (felt/denim), and 2–3 saturated accents reserved for characters. The shadow colour stays a warm dark brown.
- **New character types:**
  - Start from a silhouette made of 3–8 overlapping pieces.
  - Give each type one dominant colour plus cream.
  - Add one "material story" detail (tape patch, stitch, torn cap, foil).
- **Mixing elements:** the characters drop onto any ground as long as their shadows stay warm and right-down; the craft-table ground works under other character styles if those get a cream rim or a soft offset shadow.
- **Other genres:** side-scrollers work well. Keep the same shadow offsets, put sheets in parallax layers, and give each depth layer a larger shadow offset and blur. Board and puzzle games can use whole cards and tokens as cut pieces.
- **Resolution:** if sprites are shown larger than about 4 px per unit, raise K to 6–8, and scale the rim and blur with it (they are defined in world units).

## Performance notes

- **Init (about 1 s in the module):** every piece is baked (rim dilation is about 24 drawImage calls per piece, plus grain, light and blur); about 130 puppet frames (main character 68, small creatures 32, ghosts 12, golem 16); props, decals and effect sprites; five 512² material lookup textures and the 2116-leaf carpet.
- **Ground** is the hot spot: per-pixel shading over 5 signed-distance layers with edge noise and shadow look-ups, in 256-unit chunks at ≤ 2.5 px per unit, rendered by a generator that yields every few rows so the frame rate holds while the camera moves. Path stones, fringes, flower drifts and prop litter are baked into the same chunk with the same deterministic per-cell hashes, so borders are seamless.
- **Per frame:** only `drawImage` of chunks and baked sprites, blob shadows, a few additive glows, cheap path particles and a cached vignette. Held poses mean no per-frame tweening; a crowd of 300 puppets is 1–2 blits each. The 0.35 s tear-apart costs 2–3 clipped blits, a ghost 3 thread segments.
- **Budget:** keep particle counts modest (a destroyed figure sheds 6–16 scraps). Never call `filter: blur` or `dilate` per frame. The starter.js preview bakes everything on the first call and then runs in about 1 ms per frame.

## Copy-paste prompt

```text
Use the Paper World art style for my project: a stop-motion cut-paper craft-table diorama (Canvas 2D, procedural, no image assets).
- Everything is cut from craft materials on a table: kraft paper #a87c54, corrugated card #c49c6c, felt #607c46, cut leaves, torn newsprint #ddd5c0.
- Every object = separate flat cut pieces. Each piece: flat fill, 0.3-0.6 unit cream sticker rim #fbf6ea (dilated silhouette),
  paper grain source-atop, a diagonal light gradient (cream top-left -> brown bottom-right, alpha ~0.1), and its own blurred shadow.
- NO dark outlines. Edges come from the cream rim and cool plum-brown shadows rgb(44,24,34) that always fall right-down.
- Characters are jointed paper puppets: 6-9 rigid pieces rotating around pivots, brass split pins on joints, faces cut out over glowing paper.
- Animate like stop-motion: pre-baked held poses, walk = 4 key poses per step (contact, down, passing, up), head lags one pose,
  scarf/stem two; secondary motion sampled at 12 fps. Cards pop up on a fold tab to appear, squash and tilt back for ~140 ms when hit,
  tear apart along a zig-zag and fall flat when destroyed; tissue spirits hang on a thread, sway like pendulums and crumple into a ball.
- Ground = stacked material sheets with offset shadows and side thickness, crossed by a path of cardstock stepping stones;
  props stand in small groups on fold tabs with skewed cast shadows and baked litter; paper flowers gather in drifts, never sprinkled.
- Effects are layered paper: card starburst -> petal ring -> two-sided flipping scraps that land -> confetti; no glowing circles.
- Palette: muted craft colours (pumpkin #e57d2c, aubergine #6e3c6d, mustard #d6a43a, leaf #76a54e, teal #36a596). No black, no neon.
- Fonts: Patrick Hand, Gochi Hand, Caveat Brush with cream sticker outlines; HUD = paper strips, notebook paper, washi tape.
- Bake all pieces, frames and ground once; per frame only drawImage.
```
