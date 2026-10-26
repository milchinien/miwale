# Watercolor Storybook — Game Art Style Spec

> Transparent watercolour washes and loose, broken ink lines on warm cold-pressed paper: a living illustrated fairy-tale book.

The whole screen reads as a page of an illustrated children's book. The ground is a per-pixel pigment simulation over cream paper: terrain washes mixed subtractively, darker pigment pooled along wash edges, thin bare-paper gaps, granulation and lifted light pools — composed into meadows with drifts of flowers, ponds rimmed by reeds and lily pads, forests of tiered storybook trees with sunlit clearings, and winding dirt paths. Characters are layered washes with soft wet-in-wet blooms, a paper-white highlight and a darker rim, outlined by a sepia ink line that tapers, wobbles, is thicker on the shadow side and is broken in 2–3 places. They move on painted, held poses driven by small rigs: an 8-pose walk with planted feet and a trailing scarf, breathing idles with blinks, a squash-and-lift hit, a dissolve in which the pigment slumps and bleeds into a puddle. A deckled bare-paper margin frames the view. The module's cast — a pumpkin-headed child in an indigo coat and red scarf, violet-crowned root creatures with leafy tops, frosty floating sheets and a huge cracked umber root creature with glowing seams — shows the look, but every element below works for any subject.

## At a glance

| | |
| --- | --- |
| Family | Illustrated · Watercolor |
| Mood | cozy, whimsical, autumnal, handmade, gentle |
| Best for | fairy-tale top-down action games, cozy adventure and farming games, story RPG maps, storybook board games |
| Renderer | Canvas 2D, fully procedural (no image assets) |
| Pixel art | No — native resolution, sprites baked at 3 px per world unit |
| Complexity | 8/10 — every new asset needs several painterly iterations; init bake takes 1–3 s |
| Fonts | IM Fell English SC, Cormorant Garamond, Caveat |
| Key colours | paper `#f5eede`, sepia ink `#2a1b14`, meadow `#b2c6a2`, pumpkin `#e8832f`, coat `#41528a`, root violet `#7a4a8c`, gold `#e6a92f` |

## When to use it

Good fits:
- Projects with a fairy-tale, folk-tale, autumn-harvest or "bedtime story" theme.
- Top-down views with mid-sized characters (18–50 world units) where washes have room to show blooms and granulation.
- Slower or medium-paced projects; the soft look rewards the eye resting on the screen.
- Map screens, chapter-select pages, card-based UIs (paper cards and ink frames come for free).

Bad fits:
- Neon/sci-fi/gritty realism — the palette and paper ground fight the theme.
- Projects with hundreds of distinct animated sprite types generated at runtime (every asset is baked at init, which costs time).
- Very tiny sprites (< 8 units): washes and broken lines collapse into mush; use flat dots with one ink stroke instead.
- Very dense crowds of creatures become a violet/blue carpet; keep creature colours distinct per type (violet, frost-blue, umber).

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Paper | `#f5eede` | The white of the image; page margin, highlights, HUD panels |
| Sepia ink | `#2a1b14` | All contours, grass tufts, text |
| Blue-black ink | `#252c46` | Ink for ghost creatures and for grass inside forests |
| Meadow cool | `#b2c6a2` | Meadow wash, cool end (largest ground area) |
| Meadow sap | `#c2cc96` | Meadow wash, mid hue |
| Meadow ochre | `#dace98` | Meadow wash, warm end |
| Forest payne | `#8e9c92` | Forest floor wash |
| Forest indigo | `#828aa2` | Forest floor wash, indigo variant |
| Canopy light | `#acb880` | Sunlit pools on the forest floor (lifted areas warm towards it) |
| Field ochre | `#e9ce88` | Golden field wash (sienna variant `#e4ba7a`) |
| Path earth | `#d8b894` | Dirt path (dark variant `#c6a280`) |
| Pond deep | `#6a84aa` | Pond centre; shallows `#b0cccc`, muddy bank band `#cebe96` |
| Pumpkin | `#e8832f` | Main character's head; light `#f6b45e`, shade `#bf531b`, rim `#93380f`, ribs `#7e2f0e` |
| Coat indigo | `#41528a` | Main character's coat; light `#6677ad`, shade `#29345e`, rim `#1d2546` |
| Scarf red | `#b4432f` | Scarf; light `#d66a48`, dark `#862a1e` |
| Root violet | `#7a4a8c` | Small creature's crown; light `#a77ab5`, dark `#4e2a5c` (alt palette `#8b3d6d`/`#b4729a`/`#5a2244`) |
| Root cream | `#eee0ba` | Small creature's body base, ochre belly blob `#e3c886` |
| Leaf green | `#6c8a38` | Leaves, bushes, reeds; light `#a7bd68`, dark `#46602a`, rim `#3a4e1c` |
| Ghost frost | `#d3dbe3` | Fast floating creature; shade `#8fa0bb`, deep `#6a7b9e`, rim `#6f80a2`, eyes `#20263e` |
| Umber | `#b06a3a` | Large creature; crown `#6b4a7d`, belly `#c99545`, deep `#5a2f2a`, limbs `#7a4e34` |
| Glow yellow | `#ffcf55` | Carved eyes/mouths; core `#fff6cf`, rim `#e0661f`; large-creature cracks `#ffc548`/`#fff0b0` |
| Gold | `#e6a92f` | Collectibles; light `#fbe39c`, rim `#9a5a14`; brush twinkles `#d9972e`; top bar `#dca23a` |
| Alizarin red | `#c23b2b` | Red bar and heart icon; accent counters `#9e2a1c`; red edge tint rgb(178,44,34) |

Palette rules:
- Paper is the lightest value. Pure `#ffffff` only for specular dots (`rgba(255,253,244,.95)`).
- Ground: light and low-chroma (meadow largest, then forest floor, golden fields, paths ~10 %, ponds a few %). Characters carry the saturated colour.
- Ground colours are mixed subtractively in absorbance space: `A = -ln(colour / paper)` per channel, summed, `out = paper * exp(-A)`.
- Every shape gets a lighter, warmer blob top-left and a darker, cooler/neighbouring-hue blob bottom-right (orange → yellow-ochre / burnt sienna, violet → lilac / plum).
- Trees use four autumn triplets (light / mid / accent) plus a dark edge at 50–62 % of the mid colour; foliage tiers are multiply glazes, never opaque paint.
- Ink is never black: warm sepia `#2a1b14`, cold subjects (ghosts, forest grass) switch to blue-black `#252c46`. Shadows are indigo glazes `rgba(50,54,92,0.2)`, never grey.

## Typography

- **IM Fell English SC** 400 — titles, clock, big counters, card names (old-book small caps). `https://fonts.google.com/specimen/IM+Fell+English+SC`
  `font: 400 40px/1 'IM Fell English SC', 'IM Fell English', Georgia, serif; letter-spacing: 1.5px; color: #2a1b14;`
- **Cormorant Garamond** 500/600 (+ italics) — body copy, descriptions, small numbers. `https://fonts.google.com/specimen/Cormorant+Garamond`
  `font: italic 600 18px/1.2 'Cormorant Garamond', Georgia, serif; color: #5b3a24;`
- **Caveat** 500/700 — handwritten labels ("until midnight"), small tags, key hints, floating counters. `https://fonts.google.com/specimen/Caveat`
  `font: 700 20px 'Caveat', 'Segoe Print', cursive; color: #8a3a1e;`

Text effects: HUD text over the map gets a paper halo `text-shadow: 0 0 3px #f5eede, 0 0 7px #f5eede, 0 0 12px rgba(245,238,222,.8)` (never a dark drop shadow). In-world numbers: paper-coloured stroke `rgba(246,239,224,.9)` 2.4–3 px under the ink fill, rotated ±0.14 rad. Text over dark modal veils turns paper-coloured `#f5eede` with `0 1px 4px rgba(30,18,8,.85)`.

## Rendering technique

World space: 360 world units visible vertically; light from the upper left `(LX, LY) = (-0.6, -0.8)`.

Baked at init (1–3 s total):
1. **Noise textures** (tileable Float32 fields in [0,1]): white noise → 3 passes of wrap-around box blur → normalise → sum of layers → `0.5 + v / 4.6`. `PAP` 256² (paper tooth, radii 1/2/6), `GRA` 256² (granules, radii 0/1), `WA` and `WB` 1024² (wash flow, radii 4/12/34 and 6/18/46), `STR` 256² (horizontal streaks). Plus an `EXP[i] = exp(-i/512)` lookup (4097 entries).
2. **Grain canvas** 256²: `v = 255 - max(0, GRA-0.46)*190 - max(0, 0.5-PAP)*60` (slightly warm), used as a multiply pattern on every sprite wash.
3. **Character poses** with `mkSprite(wu, hu, ax, ay)` at K = 3 px/unit, every pose drawn by a rig function `(ctx, pose, rng)`: main character 6 idle + blink + glance + 8 walk + crouch + dash + flinch = 19 frames (34×36 units, anchor 18/33); small creature 2 colourings × (6 waddle + 1 hit) (28×37); fast creature 6 + 1 (28×28); large creature 6 + 1 (50×60). Each frame also gets a mirrored copy and a paper-lifted "flash" copy (pixels with luminance > 0.14 pushed to paper); each creature set gets a 4 px blurred "soft" copy (spawn) and 6 dissolve frames baked from its hit pose. The main character's frames store the baked face position so the glow follows the head.
4. **Props** (28 sprites), **FX sprites** (paint dots, watercolour splashes, bloom ring, paper-lift cores, brush ticks, leaf bits, wisps, dust puffs, smear, glow halos, stains), **HUD textures** (paper tile, ink frames, wash bars, plaque, banners, deckled cards) and **icons**.

Per frame (draw order):
1. Ground chunks (256 units, per-pixel shader at ≤ 2.5 px/unit, built incrementally by a generator with a 5 ms/frame budget).
2. Ground overlay: landed paint drops as flattened stains, bloom rings, residue puddles of dissolved creatures, spawn stains, dust puffs, warm light pools under orbiting lanterns.
3. Collectibles (baked gold drop / star with a soft indigo shadow sprite).
4. Shadows: every actor appends an ellipse to one `Path2D`; it is filled once in `rgba(50,54,92,0.2)` (floating actors in a second path at 0.11) right before the first sprite draws — overlapping shadows don't double up.
5. Y-sorted props (with wind shear), creatures and main character as baked sprites (`drawImage`, squash/stretch by scaling about the feet). Additive glow sprites over carved faces, the large creature's core and lanterns.
6. Projectiles, particles, floating counters, then the ambient falling leaves (world overlay).
7. Screen overlay: the cached deckled page margin, drawn only as 4 edge strips (band = 11 % of height); a red-tinted version with alpha = tint strength.

Resolution rules: no pixel snapping, smoothing on. Sprite pixel density (3 px/unit) roughly equals screen density at 1080p; ground caps at 2.5 px/unit; collectibles bake at 4 px/unit, small FX at 4–6.

## World and ground

The ground is a custom per-pixel watercolour shader over paper `#f5eede`, not a texture blend. It paints five terrain washes — meadow (`#b2c6a2` / `#c2cc96` / `#dace98`), forest floor (`#8e9c92` → `#828aa2`, warming to `#acb880` in light pools), golden field (`#e9ce88` → sienna `#e4ba7a`), dirt path (`#d8b894` → `#c6a280`) and ponds (`#b0cccc` → `#6a84aa`) — and is baked into 256-unit chunks.

- **World fields** (computed on a 16-px grid and bilinearly interpolated): forest `F = warped fbm(x/820, y/820)` threshold 0.575; golden field `G = warped fbm(x/640+40.3, y/640-25.7)` threshold 0.57; ponds `W = warped fbm(x/300-17.1, y/300+8.9)` threshold 0.68, pushed down within 90 units of the start point; path `P = perlin` of a domain-warped position at scale 560, with half-width `7 + 6*noise(x/260)`; meadow hue `fbm(x/260)`; density `0.76 + 0.5*fbm(x/380)`; bleed zones `smoothstep(.52,.72, noise(x/210))`; lift field `0.72*noise(x/96) + 0.28*noise(x/37)`.
- Thresholded fields are converted to **signed distances** in world units by dividing by the grid gradient (`(f - T) / |∇f|`, clamped ±40).
- Per pixel, edges are perturbed by flow noise: `eF = dF + (WA-0.5)*9 + (PAP-0.5)*0.9`. The coverage is `smoothstep` over `eF / soft` with `soft = 0.45 + 5*bleed` — hard, crisp wash edges normally, wide wet-in-wet blends (up to 5.45 units) in bleed zones. Pixels more than 10.5 units from the forest and field edges, 5 from the path and 8 from any pond take an exact fast path (masks are 0/1, no pooling or gaps).
- **Pooling**: inside each edge the pigment density rises by `pool(d) = (1-d/2.6)²` (ramping in over 0.35 units; up to ×1.85) — the dark rim every real wash has. Ponds pool ×2.25 at the shore and get a muddy bank band `#cebe96` 5 units wide outside.
- **Paper gaps**: where `WA > 0.55`, a 0.75-unit band at the edge loses 88 % of its pigment — white paper peeks between two washes; around ponds a reserved white line appears where `WB > 0.42`.
- **Water**: shallows → deep by distance from the shore (`dep = eW/26`), streak glints where the streak texture and `WB` are high (density × (1 − 0.85·glint)).
- **Lifted light pools**: where the lift field passes 0.64 the pigment is wiped back (meadow −34 %, forest −38 %), with a darker tide line (×1.55) at the pool's edge; in forests the lifted pigment shifts towards canopy light `#acb880` (75 %) — sun falling through the leaves.
- **Granulation**: density × `(1 + (GRA-0.5)*k)` with k = 0.55 meadow, 0.8 forest, 0.6 field, 1.2 path, 0.35 water; paper tooth × `(1 + (0.5-PAP)*0.45)`.
- **Mixing**: pigments are absorbance triples. `out = paper * (0.95 + 0.075*PAP) * EXP[A*512]`. Keep every terrain colour light (each channel ≥ 100).

Ground decals — composed, never sprinkled (drawn into the chunk via a seamless jittered-grid scatter so chunk borders match):
- **Under every tree** (same placement function as the tree props): 16–26 fallen leaves in that tree's three colours, biased to the shadow side, two root strokes, a grass tuft or two, sometimes red-capped mushrooms; under firs: needle strokes, 1–3 cones, mushrooms.
- **Ponds**: lily pads (cell 26, near the bank); reed props in clumps along the shore (see Props).
- **Grass tufts** (cell 11): 92 % on pond banks, 78 % along path borders, 45 % at forest edges, otherwise only inside clumps of a low-frequency clump field (`noise(x/58)·0.65 + noise(x/23)·0.35 > 0.62`) with near-empty paper between them. 3–5 tapered blades 2.2–5.6 units, alpha 0.45 (blue-black at 0.38 in forests), a soft green wash dab under some.
- **Flowers** (cell 9) only in drifts (`noise(x/105) > 0.66`), one species per 210-unit patch (daisy, poppy, cornflower, buttercups) plus 18 % strays.
- Leaf litter along forest edges (26 %) and sparse inside; stones on paths (cell 30, 60 %) with partial ink outlines on the shadow side, pebbles every 11 units; stubble rows in golden fields; twigs in forests.
- Few, large accidents of the medium: backrun blooms (cell 150, 50 %, wobbly ring r 5–16 units, paper fill at 20 %, multiply stroke in the terrain's dark colour `M #7d8a4a`, `F #3d4a5c`, `G #a8803a`, `P #8a5a36`) and rare pigment splatter (cell 130, 32 %).

The ground keeps its darkest marks (grass) at ≤ 60 % alpha so characters and props on top stay readable.

## Characters

Shared construction: every part is `wash()` (base fill + 2–3 blurred wet-in-wet blobs + paper highlight + blurred darker rim + grain multiply, offset 0.45/0.35 units) followed by `outline()` (a broken sepia ink contour, width 0.5–0.95, `light` 0.45–0.55, 2–3 pieces). Control points are jittered 0.12–0.28 units per pose with a per-pose seed, so each frame is a fresh hand-drawn take (the line "boils" as poses change). Storybook proportions: big round head (about half the height), small body, stubby legs. Faces are carved glowing shapes (warm yellow wash `#ffcf55`, white-hot core `#fff6cf`, orange rim `#e0661f`, thin ink) or ink dots with heavy tapered brows, readable at 3 px per unit. Each character stands on an indigo glaze shadow ellipse.

**Main character** (pumpkin-headed child in an indigo coat and red scarf, ~18 units wide, ~30 tall, feet at 0,0, facing right). A rig returns body drop, lean, head drop and tilt, breath, two feet `(x, lift)`, two hands and the scarf tail `(angle, wave, length)` for each pose; the drawing function places every part from it:
- Draw order: back arm (indigo ribbon 2.5→2.0 through a bent elbow) + hand → legs (brown ribbons 2.3→1.9 from the riding hips through a knee to the planted foot) + boots (blob 1.9×1.15, toe tips up when lifted) → scarf tail behind (red ribbon built from angle + travelling wave) → coat (12-point spline, swells with the breath) with 3 gold buttons r 0.48 and a seam → scarf wrap → **pumpkin head** hinged at the neck (14-point ellipse rx 8.5, ry 6.9 at y −19.6, 5-lobe modulation 3.5 %, dented top, tilt + lag) with 4 sienna rib strokes → stem, tendril and a leaf that flutters with the scarf → carved face (open / blink slits / squeezed shut, grin or round "o") → front arm + hand.
- **Walk** (8 poses, `ph = i/8·TAU`): body `0.75·cos(2(ph−0.35))` (lowest just after contact), head `0.5·cos(2(ph−0.95))` (settles a beat later), tilt `0.04·sin(2ph−0.7)`, lean 0.07, feet `−1.4 + 2.5·cos ph` / `1.6 − 2.5·cos ph` with lift `max(0, ∓sin ph)·2`, hands counter-swing `∓2.7·cos ph`, scarf tail angle `0.24 + 0.07·cos 2ph`, wave `sin(2ph − 1.5)`.
- **Idle** (6 poses): breath `sin(br·TAU)` lifts the chest 0.22 and the coat 1.2/2.8 %, the head follows 0.7 rad later; plus a **blink** pose (eyes dim to slits) and a **glance** pose (face turns 1.3 units toward the viewer, head tilt 0.05).
- **Crouch** (anticipation: body down 1.9, knees bent, arms in), **dash** (lean 0.3, legs split, arms back, scarf streaming), **flinch** (lean back, arms up, eyes squeezed, round mouth).
- Facing: one baked set facing right; left = mirrored canvas. The carved face gets an additive warm glow sprite (18×16 units) at the stored face position, flickering. Shadow ellipse 7.6×2.8 units (9×2.4 while dashing).

**Small creature** (violet-crowned root creature with a leafy top, r 9): two root legs (ink strokes 1.25 wide with two toes) and a trailing root tail; body 10-point spline (≈17×19 units) washed cream `#eee0ba` with a large violet crown blob (rx 10.6, blur 2), lilac light and plum dark blobs, ochre belly `#e3c886`; skin-ring strokes; 3 leaf ribbons that lag the body; angry glowing almond eyes with ink pupils, heavy tapered brows, jagged frown. Waddle (6 poses): squash `0.05·cos 2ph` on each contact, body drop `0.65·cos 2ph`, rock `0.085·sin ph`, leaves `1.7·sin(ph − 1.25)`. Hit pose: tilted back, eyes as ink chevrons, red open mouth, leaves flung. Two colourings: violet `#7a4a8c`/`#a77ab5`/`#4e2a5c` and magenta-plum `#8b3d6d`/`#b4729a`/`#5a2244`. Shadow `r·0.95 × r·0.36`.

**Fast creature** (frosty floating sheet, r 7): 13-point sheet whose three hem points ripple with a wave travelling down (`sin p`, `sin(p − 1.3)`, `sin(p − 2.6)`) and two reaching arms trailing by 0.9 rad; frost wash `#d3dbe3` with blue shade blobs (`#8fa0bb`, deep `#6a7b9e`), `feather: 0.85` (blurred clip → soft edge), 12 salt spots, lost-and-found blue-black ink `#252c46` only on 3 arcs, blurred hollow eyes and a mouth that breathes with the hem; brows rise in alarm on the hit pose. Drawn at 90 % alpha with an eased hover (`sign(s)·|s|^0.6`, holds at both ends); lighter shadow 5.2×1.9 at 0.11.

**Large creature** (huge cracked umber root creature, r 17): 18-point body (34×37 units) in umber `#b06a3a` with a violet crown blob `#6b4a7d`, ochre belly `#c99545`, dark side `#5a2f2a`; moss patch; two hatching passes on the shadow side; 4 glowing cracks (blurred `#ffc548` 1.5 wide + `#fff0b0` 0.4 core + offset ink) from a glowing core; glowing eye sockets; brow stroke 1.55; withered leaf crown that bounces a beat after each stomp; massive arms that swing late (`sin(ph − 0.55)·2.2`) and legs (ribbons 5–5.6 wide). Heavy stomp: the mass drops `2.1·cos² ph`. Additive pulsing core glow per frame, flaring on a hit.

**States**: hit = the hit pose, squashed 12 %/10 % against the knock for 140 ms, with the paper-lifted copy on top fading with the flash; dissolve and spawn see Effects. Crowds: pose index `floor(anim·rate·0.5 + seed·n)`, scale `0.93 + seed·0.14`, breathing `sin(t·(2.1 + 0.8·seed) + 40·seed)·1.2 %` — no two creatures move in sync.

Readability against the busy ground: characters are more saturated and darker than any ground wash, carry a full-value ink contour that is heaviest at the bottom-right, and stand on an indigo shadow glaze. Give each creature type its own hue family (violet, frost-blue, umber) so groups stay distinguishable.

## Props

All 28 prop sprites are baked once at 3 px/unit with the same wash + broken-outline toolkit; mirrored variants come from flipping the canvas. Each prop stands on its own indigo glaze shadow ellipse (part of the shared shadow `Path2D`) and plants sway in the wind (see Motion).

- **Deciduous trees** (72×102 units, anchor 36/98), four designed crowns: broad oak, tall poplar, leaning two-mass and a young sparse tree, each with its own palette (`#d9a443 #c26a31 #8a8a3a`, `#9aa648 #d0a046 #6f7f3a`, `#e08a3a #b8452c #d6aa4c`, `#c49a3e #8f8a3a #b5602e`). Construction: flared trunk wash with bark strokes on the shade side; limbs fork from 36 % of the height (a Y below the crown) and fan up, their tips pulled inside the crown; the crown silhouette is the union of 6–8 lobes found by ray-casting from the centre (72 rays) — one scalloped shape; (1) one light wet wash for the whole crown (light colour + warm `#f4dc98` top-left, mid colour bleeding in bottom-right); (2) three foliage tiers clipped to the crown, each a multiply glaze at 45–50 % with a hard scalloped top edge: mid tier at −0.12 R, darker tier at +0.4 R climbing 0.3 per unit toward the shade side, dark under-crown band `#5a4648` at +0.8 R; a cool `#7d86a8` glaze on the lower right; (3) 9–14 leaf dabs breaking the silhouette (light on the lit rim, mid colour hanging underneath), 4 paper-white reserved leaves on the lit side; (4) ink only on the shade side of the silhouette plus one loose stroke along the middle tier; two falling leaves. Shadow 21×6.5. Crowns fade to 42 % alpha while a character is behind them.
- **Firs** (40×92, 2 variants): short brown trunk `#6b4a32`, 5 zigzag tiers narrowing to the top (`#4f6458`, light `#7a9474`, deep `#2c3a50`), partial outlines on the shade side. Shadow 13×4.5.
- **Bushes** (30×22, 3 variants): 3 overlapping blobs (`#7d8f45`, light `#a9b86a`, dark `#4f6428`, rim `#2f3a1a`, 92 % alpha), optional red berries. Shadow 10×3.2.
- **Reeds** (24×34, 3 variants): clumps of tapered leaf blades with brown cattail heads and a yellow iris, two dark tufts at the base. Shadow 6×1.6.
- **Pumpkins** (orange `#e8832f`, amber `#e6a33a`, pale cream `#e9dcc0`; one carved variant with a glowing face), in groups of 1–3 in fields and meadows. Shadow 8 or 6 × 2.4.
- **Haystacks** (round and tall), **fences** (intact/broken, runs every 31.5 units), **dry-stone walls**, **signposts** beside paths, **scarecrows** in golden fields, **boulders** (large + small companion, hatched shadow side).

Placement composes the world: trees on two jittered grids (76-unit cells everywhere with 50 % inside forests, 16 % at the edges, 3 % in meadows; plus 64-unit cells only deep inside forests, 60 % firs), bushes gathered along forest edges and pond banks (42 %, often in pairs), reeds in clumps on the shore (22-unit cells, 62 %), boulders in pairs by paths and water, signs 3–16 units beside paths, nothing within 95 units of the start point or on paths and water.

## Effects and particles

All effects are pre-baked sprites in the same wash + ink language — paint and paper, never light. Every effect is layered: **core** (a blotted paper-white lift that snaps open) → **main shape** (an ink or pigment splash) → **debris** (paint drops, torn leaf bits, wisps) → **residue** (drops and puddles that stay on the ground and dry out).

- **Watercolour splash** sprite (16×16 units, 2 variants per colour): a wet pool (10-point blob 3.3×2.9) whose pigment dried into a dark pooled rim (`rim 0.95` at 62 % of the colour) and a paper-pale centre, 5–7 detached teardrops thrown outward (thin tail toward the pool, head away, 4.6–7 units out), 6 fine spatter dots further out. Colours: ink, violet, plum, frost, sienna, ochre, gold, red, orange, indigo, umber.
- **Impact**: paper-lift core 0.13 s (12 units, 20 for the large creature) → ink splash 0.24 s (11/18 units, orange for lantern hits) growing with ease-out → 4 paint drops along the knock direction (gravity 240) that land as flattened stains; the fast creature adds a rising grey-blue wisp.
- **Dissolve**: core 0.18 s → creature-coloured splash 0.36 s → backrun bloom ring on the ground (1.1–1.5 s, the wet ring pushes out fast, then dries and fades) → residue stain in the creature's colours (1.8–2.4 s) → 9 (large: 18) paint drops and 3–6 torn leaf bits that tumble edge-on (or 3 rising wisps for the fast creature); the large creature adds three brush twinkles. Meanwhile the creature itself freezes in its hit pose and lifts to paper (0–18 %), then plays 6 dissolve frames: per-column drips run the wash down, the base spreads up to 32 %, the colour bleeds out from the top toward paper, the shape squashes and its puddle grows underneath.
- **Spawn**: a wet stain in the creature's colours blooms first (ease-out), the 4 px blurred copy rises out of it with a 12 % stretch and an 8 % overshoot, the crisp sprite and ink line fade in from 45 %; the shadow grows in with it.
- **Paint drops** (6×6 sprites, 3 shapes per colour) stretch along their flight while fast; when `z ≤ 0.3` and slow they are drawn on the ground layer as flattened stains. Life 0.9–1.7 s, drag 1.6.
- **Seed projectile**: cream seed wash with ink outline, spinning, preceded by an 18-unit dry-brush trail (tapered ribbon, orange gradient, 5 streak gaps cut out); every second throw drops an orange fleck.
- **Collectibles**: small gold drop (8-point teardrop, gold wash `#e6a92f`, specular dot) pops in with an overshoot; large gold star hovers with an eased hold and shows a brush twinkle (four tapered ochre ticks `#d9972e` + paper core) for 0.36 s every 2.2 s, on its own phase.
- **Collect**: brush ticks (1, large 3) that pop with outBack and drift up, gold drops (2/5); the large one also gets a paper-lift core and a gold bloom ring (13 units, 0.7 s).
- **Gold bloom**: gold ring 40 units over 1.2 s, a paper-lift core, 8 ticks around the character, 12 gold/orange drops.
- **Dash**: indigo dry-brush smear (9 strokes) 0.38 s, two umber dust puffs that bloom and fade on the ground, 4 umber drops, two wet echo copies of the character at 20 %/10 %.
- **Red splash**: paper-lift core, red splash 18 units, 8 drops — paired with the red edge tint (see Atmosphere).
- **Orbiting lantern**: a small carved violet root lantern with a glowing face, hanging from a looped stalk and swinging against the orbit, casting a warm light pool on the ground.
- **Floating counters**: Caveat 700, 10.5 px (accent 15 px, `#9e2a1c` on a faint red splash), paper-coloured 2.4–3 px stroke behind, rotated ±0.14 rad, pop-in scale 0.55 → 1.15.

## Atmosphere and lighting

- **Light** from the upper left `(-0.6, -0.8)`; baked into every wash (highlight at 30 %/26 % of the bbox, dark blob bottom-right) and into ink width (`w *= 1 - light * dot(normal, L)`) — contours are thicker on the shadow side.
- **Shadows**: union `Path2D` of ellipses, offset (+0.8, +0.4) units, main character 7.6×2.8, creatures `r·0.95 × r·0.36` (growing in during the spawn), props per type (tree 21×6.5); one fill `rgba(50,54,92,0.2)`; floating creatures 5.2×1.9 at 0.11. Overlaps never double up. Never black or grey.
- **Glows**: radial sprite `rgba(255,226,140,.95) → rgba(255,196,90,.5) @35 % → 0`, composited `lighter` at 0.22–0.38 alpha with sine flicker (`0.3 + 0.08 sin(11t) + 0.05 sin(23t)`); lantern light pools on the ground at 0.55. Only carved faces, cracks and lanterns glow.
- **Ambient life**: single autumn leaves drift through the scene — world-anchored 230-unit cells, 5 of 8 hold a leaf; each falls from 74 units over 82 % of a 10–17 s period, drifts 52 units sideways with the wind plus a 7-unit flutter, tumbles edge-on and casts its own soft indigo shadow that sharpens as it lands. Trees, firs, reeds, bushes, haystacks and scarecrows shear in slow gusts. Always slower than the actors.
- **Frame**: no colour grading, bloom or vignette shader. The only full-screen post effect is the deckled page margin (~2.4 % of height, corner radius 7 %): `smoothstep` paper fade (32 %, over 9 % of height), a sienna rim line `rgb(120,82,58)` at 22 % 3.5 units inside the edge, then opaque paper outside; the rounded-rect edge is perturbed by `(WA-0.5)*22 + (PAP-0.5)*3` px → a torn deckle edge. Built per pixel once per screen size, only inside the 11 % edge bands.
- **Red edge tint**: an alizarin wash `rgb(178,44,34)` replaces the margin and creeps in from the edges, alpha = tint strength.
- **Night variant**: darken via an indigo multiply glaze over the ground, keep carved-glow light sources — never switch the ink to black.

## UI

- **Top bar**: full width at the top, 20 px tall, paper backing at 55 %, an ochre wash stroke (`#dca23a` + blobs `#f2cd72 #c27a22 #e8b44a`, rim `#9a5a14`) masked with a ragged right edge, inside a hand-inked frame (4 tapered lines overshooting the corners by 6 px).
- **Red bar**: watercolour heart icon, red wash bar 236×22 (`#c23b2b`, blobs `#e06a50 #9a2418`), inked frame, value in IM Fell English SC 19 px.
- **Clock**: IM Fell English SC 40 px on a feathered paper plaque, Caveat 700 20 px label in `#8a3a1e` above an ink swash ornament.
- **Counter**: small painted icon + IM Fell 30 px.
- **Card choice screen**: dark warm veil, a gold wash banner with dry-brush ends behind the title, three deckle-edged paper cards (224×292, rotated −1.4°/0°/+1.1°, drop shadow) each with a painted icon, IM Fell name, italic Cormorant description and a Caveat key number in `#a3532c`.
- Icons are painted with the same wash/outline functions in a 100×100 space with a larger misregistration (1.6/1.3) and thicker lines at ≤ 48 px.

```css
.hud-bar { position: relative; height: 22px; background: rgba(245,238,222,.62);
  border: 1.5px solid rgba(42,27,20,.9);
  border-radius: 255px 18px 225px 18px / 18px 225px 18px 255px; }
.hud-bar > .fill { height: 100%; background: linear-gradient(90deg, #c23b2b, #d8483a 40%, #9a2418); }
.hud-text { font: 400 19px 'IM Fell English SC', Georgia, serif; color: #2a1b14;
  text-shadow: 0 0 3px #f5eede, 0 0 7px #f5eede, 0 0 12px rgba(245,238,222,.8); }
.hud-label { font: 700 20px 'Caveat', 'Segoe Print', cursive; color: #8a3a1e; }
.panel { background: #f5eede; color: #2a1b14; border: 1.5px solid rgba(42,27,20,.85);
  border-radius: 255px 18px 225px 18px / 18px 225px 18px 255px;
  box-shadow: 0 3px 12px rgba(60,40,20,.3); padding: 6px 24px; }
.card { width: 224px; min-height: 292px; padding: 34px 24px 28px; background: #f5eede;
  filter: drop-shadow(0 8px 10px rgba(30,18,8,.45)); transform: rotate(-1.4deg); }
.card .name { font: 400 23px 'IM Fell English SC', serif; }
.card .desc { font: italic 600 18px 'Cormorant Garamond', serif; color: #5b3a24; }
.card .key  { font: 700 24px 'Caveat', cursive; color: #a3532c; }
.veil { background: radial-gradient(ellipse at 50% 46%, rgba(245,238,222,.28), rgba(58,40,26,.68) 78%); }
```

For the bar fills, the module bakes a wash texture (see `wash()`) to a data-URL and uses it as `background`, with a ragged-edge PNG mask on the right end.

## Motion and animation

Painted held poses, not tweened shapes. Timings:

- **Main character walk**: 8 poses, pose `floor(anim·1.25) & 7` (distance-based) → ~11 fps at walking speed; contact – down – passing – up twice per cycle (see Characters).
- **Idle**: 6 breathing poses held 0.42 s each (on twos); blink 0.18 s every 3.9 s (a second quick blink every third time); glance toward the viewer for 1.2 s every 9.7 s; the face glow dims to 45 % during the blink.
- **Dash**: crouch frame for the first 40 ms (anticipation, squash 1.08×0.9), stretch frame for the lunge (1.1×0.94) with two wet echo copies; landing squash 10 % recovered with outBack over 150 ms.
- **Hurt**: flinch frame for the first 45 % (squash up to 8 %/7 %), with a paper-lifted copy fading on top; afterwards a 12 Hz flicker to 55 % alpha while protected.
- **Creatures**: 6-pose cycles held, not interpolated: small ~7 fps (anim·3.9·0.5), fast ~4.5 fps (anim·1.4·0.5) with an eased hover `−2.4 + hover(2.7t + 9·seed)·1.4`, large ~3.3 fps (anim·3.0·0.5); phase offset `seed·n`, scale 0.93–1.07 and a 1.2 % breathing squash at a per-seed rate.
- **Hit**: hit pose for 140 ms, squash `1 + 0.12k` / `1 − 0.1k` with `k = 1 − hitT/0.14`, paper lift at `min(0.8, flash·1.4)`.
- **Dissolve**: 0.35 s — freeze and lift (0–18 %), then 6 frames with squash `0.92 − 0.2·easeInOut(u)` and alpha `1 − 0.6u²`.
- **Spawn**: 0.45 s — stain blooms (`easeOut3(2.2·t)`), rise `smoothstep(0.18, 0.75, t)` with a 12 % stretch, overshoot `sin((t−0.75)/0.25·π)·0.08`, crisp sprite from 45 %.
- **Collectibles**: 3 variants at 4 fps; pop `1 + sin(pop·π)·0.55` (extra 15 % height in the first half); large stars hover 1.1 units with an eased hold.
- **Lanterns**: swing `−0.32·cos(angle) + 0.06·sin(5.3t)` from the stalk, bob with the eased hover.
- **Wind**: shear `amp · (0.55 + 0.45 sin(0.37t + 0.004x)) · (0.75 sin(1.25t + 0.031x + 0.011y) + 0.25 sin(2.9t + 0.07x))`, amp tree 0.03, fir 0.018, reeds 0.075, bush 0.022, haystack 0.008, scarecrow 0.012.
- **Effects** ease out (cubic) and fade with `life^0.6` or linear tails; nothing is linear in scale.
- Tree crowns in front of a character fade to 42 % alpha.

## Do and don't

Do:
- Mix ground colour per pixel in absorbance space and darken wash edges (pooling, paper gaps).
- Compose the ground: reeds and lily pads by water, litter and roots under trees, flowers in single-species drifts, tufts in clumps with calm paper between them.
- Wash first, ink second; offset the wash ~0.45/0.35 units from the ink (misregistration).
- Break contours into 2–3 tapered pieces, thicker on the shadow side.
- Build foliage as glazes: one light silhouette wash, then clipped multiply tiers with hard scalloped edges on the shade side.
- Pose characters with a rig (planted feet, lagging head, trailing cloth/leaves) and bake 6–8 poses per cycle; give every creature its own phase.
- Layer every effect: paper-lift core, splash, drops, residue that dries on the ground.
- Bake every frame once; per frame only `drawImage`. Frame the screen with a deckled paper margin and the storybook fonts.

Don't:
- Use flat fills with uniform black strokes (that becomes cartoon vector art).
- Use pure black ink or grey shadows.
- Sprinkle tufts, flowers or dots evenly over the ground.
- Paint tree crowns as rows of equal circles, or decorate them with small marks that read as eyes.
- Replace drawn poses with sine bobs, or let a crowd animate in sync.
- Run canvas `filter: blur()` washes per frame.
- Use glowing circles as effects, glossy highlights or saturated full-screen effects; let the world fill the page margin.

## Implementation recipe

1. Set up a 360-unit-tall world camera; choose 3 px/unit for sprite bakes.
2. Build the noise textures (`noiseTex`: white noise → box blur ×3 → normalise) for paper, granules and two wash-flow fields, the `EXP` table and the grain canvas.
3. Implement the brush toolkit: `spline` (Catmull-Rom), `jit`, `blobPts`, `ribbon`, `inkLine` (filled variable-width ribbon), `outline` (broken contour), `wash` (scratch canvas: fill → blobs → highlight → rim → grain → clip/feather → offset composite, optional `multiply` for glazes), `glowShape`.
4. Write a rig per character: a function `pose → {body drop, lean, head drop/tilt, feet, hands, cloth wave}`; then a drawing function `(ctx, pose, rng)` in world units with feet at (0,0) that places every part from the rig: back parts first, each part = wash + outline.
5. Bake poses: 8 walk + 6 idle + blink + action poses for the main character, 6 cycle poses + a hit pose for creatures, each with its own seed; also mirrored, paper-lifted, soft and dissolve copies.
6. Write the ground shader: world fields on a coarse grid → signed distances → per pixel edge noise, coverage, pooling, gaps, lift pools, granulation → absorbance mix → `paper * exp(-A)`; add a fast path for pixels far from every edge. Then place decals by rule (under trees, by water, along paths, in clump/drift fields) with a jittered-grid scatter seeded per cell. Cache per chunk.
7. Bake props with the same toolkit (trees: lobe-union silhouette wash + clipped glaze tiers); give each a shadow ellipse size and a sway amount; place them by region.
8. Per frame: blit ground, fill the shadow union once, draw y-sorted sprites (pose by phase-offset index, squash by scaling about the feet), additive glows, projectiles, layered particles, counters, ambient leaves.
9. Build the page-margin overlay once per screen size (only the edge bands) and blit it last.
10. Do the HUD as washes inside hand-inked frames with IM Fell English SC / Cormorant Garamond / Caveat.
11. Test readability with a big crowd and in greyscale: if creatures merge, push their ink weight up, separate hues per type, and lower ground decal alpha.

## Code

The snippets below are ported from the module and run on their own. `starter.js` in this folder combines them into a full working scene (ground shader with clumped decals and forest light pools, the rigged main character, waddling root creatures with per-creature phases, glaze-tier trees with wind, a watercolour splash, collectibles, projectile, page margin). The complete implementation (fast and large creatures, ponds, props, icons, HUD textures, particles) is in [`../../js/styles/watercolor.js`](../../js/styles/watercolor.js).

Walk rig (8 poses: contact – down – passing – up, twice) — the drawing function only reads these numbers:

```js
function walkRig(ph) {                    // ph = i / 8 * 2π
  const s = Math.sin(ph), c = Math.cos(ph);
  return {
    bodyDy: 0.75 * Math.cos(2 * (ph - 0.35)),        // lowest just after each contact
    headDy: 0.5 * Math.cos(2 * (ph - 0.95)),         // the head settles a beat later (overlap)
    tilt: 0.04 * Math.sin(2 * ph - 0.7), lean: 0.07,
    feet: [[-1.4 + 2.5 * c, Math.max(0, -s) * 2], [1.6 - 2.5 * c, Math.max(0, s) * 2]],   // [x, lift], planted when lift = 0
    hands: [[-5 - 2.7 * c, -7.3 - 0.7 * c * c], [5.7 + 2.7 * c, -7.5 - 0.7 * c * c]],    // counter-swing
    tail: [0.24 + 0.07 * Math.cos(2 * ph), Math.sin(2 * ph - 1.5), 1.08],                 // scarf: angle, travelling wave, length
  };
}
// legs: hip = -5 + bodyDy rides with the body, knee between hip and foot, foot at (x, -0.9 - lift)
```

Foliage tiers clipped to a crown silhouette (the tree's value structure in three glazes):

```js
// sil = closed outline of the crown (union of lobes), B = its bbox, R = crown radius, wash() as below
function tier(B, ccx, ccy, R, yf, rr, slant, rnd) {   // scalloped top edge, open below
  const pts = []; let x = B.x0 - rr * 0.6;
  while (x < B.x1 + rr * 0.3) {
    const w = rr * (0.75 + rnd() * 0.55), cx = x + w, ty = ccy + R * yf - slant * (cx - ccx);
    for (let k = 0; k <= 5; k++) { const a = Math.PI + (k / 5) * Math.PI; pts.push([cx + Math.cos(a) * w, ty + Math.sin(a) * w * 0.72]); }
    x += w * 1.8;
  }
  return pts.concat([[B.x1 + 3, B.y1 + 4], [B.x0 - 3, B.y1 + 4]]);
}
const tracePath = (c, P) => { c.beginPath(); P.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
ctx.save(); tracePath(ctx, sil); ctx.clip();          // everything below stays inside the crown
wash(ctx, tier(B, ccx, ccy, R, -0.12, R * 0.27, 0.12, rnd), { c: mid, alpha: 0.5, op: 'multiply', rim: 1.0 });
wash(ctx, tier(B, ccx, ccy, R, 0.4, R * 0.2, 0.3, rnd), { c: dark, alpha: 0.5, op: 'multiply', rim: 0.9 });   // climbs on the shade side
wash(ctx, tier(B, ccx, ccy, R, 0.8, R * 0.13, 0.2, rnd), { c: '#5a4648', alpha: 0.45, op: 'multiply', rim: 0.6 });
ctx.restore();
```

Variable-width ink line (the core of every contour):

```js
const LX = -0.6, LY = -0.8; // towards the light
function inkLine(ctx, P, o) {           // P = dense points, o = {w, ta, tb, wv, ph, light, cx, cy, color, alpha}
  const n = P.length; if (n < 2) return;
  const acc = [0];
  for (let i = 1; i < n; i++) acc[i] = acc[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
  const tot = acc[n - 1] || 1, ta = o.ta ?? 0.2, tb = o.tb ?? 0.3, wv = o.wv ?? 0.3, ph = o.ph || 0, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, tx = (b[0] - a[0]) / l, ty = (b[1] - a[1]) / l, u = acc[i] / tot;
    let w = o.w;
    if (u < ta) w *= 0.2 + 0.8 * Math.sqrt(u / ta);                       // pen lands
    if (u > 1 - tb) w *= 0.1 + 0.9 * Math.sqrt(Math.max(0, 1 - u) / tb); // pen lifts
    w *= 1 + wv * (0.6 * Math.sin(acc[i] * 0.8 + ph) + 0.4 * Math.sin(acc[i] * 2.1 + ph * 2.3)); // pressure
    if (o.light) { const nx = P[i][0] - o.cx, ny = P[i][1] - o.cy, nl = Math.hypot(nx, ny) || 1; w *= 1 - o.light * (nx * LX + ny * LY) / nl; }
    w = Math.max(0.04, w) / 2;
    L.push([P[i][0] - ty * w, P[i][1] + tx * w]); R.push([P[i][0] + ty * w, P[i][1] - tx * w]);
  }
  const Q = L.concat(R.reverse());
  ctx.beginPath(); ctx.moveTo(Q[0][0], Q[0][1]); for (const p of Q) ctx.lineTo(p[0], p[1]); ctx.closePath();
  ctx.globalAlpha = o.alpha ?? 1; ctx.fillStyle = o.color || '#2a1b14'; ctx.fill(); ctx.globalAlpha = 1;
}
```

Broken contour around a closed ring (pen lifted 2–3 times, small overshoots):

```js
function outline(ctx, P, o, rnd) {      // rnd = seeded () => [0,1)
  const n = P.length, pieces = o.pieces || 2;
  let cx = 0, cy = 0; for (const p of P) { cx += p[0] / n; cy += p[1] / n; }
  let s = (rnd() * n) | 0, rem = n;
  for (let i = 0; i < pieces; i++) {
    const len = i === pieces - 1 ? rem : Math.round(rem / (pieces - i) * (0.75 + rnd() * 0.5));
    rem -= len;
    const seg = [];
    for (let j = 0; j < len + Math.round((rnd() - 0.3) * 4); j++) seg.push(P[(s + j) % n]);
    if (seg.length > 1) inkLine(ctx, seg, { cx, cy, ta: 0.12, tb: 0.16, light: 0.45, ...o, ph: rnd() * 10 });
    s += len;
  }
}
```

Sprite wash on a scratch canvas (wet-in-wet blobs, highlight, pooled rim, granulation, misregistration):

```js
let SCR = null; const MIS = [0.45, 0.35];
function wash(ctx, P, o, grain /* 256² multiply canvas, see starter.js */) {
  const cv = ctx.canvas, m = ctx.getTransform(), k = Math.hypot(m.a, m.b);
  if (!SCR || SCR.width !== cv.width || SCR.height !== cv.height) { SCR = document.createElement('canvas'); SCR.width = cv.width; SCR.height = cv.height; }
  const t = SCR.getContext('2d'), path = () => { t.beginPath(); t.moveTo(P[0][0], P[0][1]); for (const p of P) t.lineTo(p[0], p[1]); t.closePath(); };
  t.setTransform(1, 0, 0, 1, 0, 0); t.globalCompositeOperation = 'source-over'; t.clearRect(0, 0, cv.width, cv.height); t.setTransform(m);
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of P) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
  path(); t.fillStyle = o.c; t.fill();
  t.globalCompositeOperation = 'source-atop';                       // everything below stays inside the shape
  for (const b of o.blobs || []) { t.filter = `blur(${(b.blur ?? 2) * k}px)`; t.globalAlpha = b.a ?? 0.7; t.fillStyle = b.c; t.beginPath(); t.ellipse(b.x, b.y, b.rx, b.ry ?? b.rx, 0, 0, Math.PI * 2); t.fill(); }
  t.filter = 'none'; t.globalAlpha = 1;
  const lx = x0 + (x1 - x0) * 0.3, ly = y0 + (y1 - y0) * 0.26, g = t.createRadialGradient(lx, ly, 0, lx, ly, Math.max(x1 - x0, y1 - y0) * 0.62), ha = o.hi ?? 0.4;
  g.addColorStop(0, `rgba(255,251,238,${ha})`); g.addColorStop(0.55, `rgba(255,251,238,${ha * 0.35})`); g.addColorStop(1, 'rgba(255,251,238,0)');
  t.fillStyle = g; t.fillRect(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4);
  t.filter = `blur(${0.55 * k}px)`; t.globalAlpha = o.rimA ?? 0.6; t.strokeStyle = o.edge || o.c; t.lineWidth = o.rim ?? 1.4; path(); t.stroke();
  t.filter = 'none'; t.globalAlpha = o.gran ?? 0.55;
  if (grain) { t.setTransform(1, 0, 0, 1, 0, 0); t.globalCompositeOperation = 'multiply'; t.fillStyle = t.createPattern(grain, 'repeat'); t.fillRect(0, 0, cv.width, cv.height); t.setTransform(m); }
  t.globalAlpha = 1; t.globalCompositeOperation = 'destination-in'; path(); t.fillStyle = '#000'; t.fill(); // clip (grain spilled outside)
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = o.alpha ?? 1;      // alpha + 'multiply' turn a wash into a glaze
  if (o.op) ctx.globalCompositeOperation = o.op;
  ctx.drawImage(SCR, Math.round(MIS[0] * k), Math.round(MIS[1] * k)); ctx.restore();
}
```

Ground pigment mixing core (per pixel; `eX` = noisy signed distance to each terrain edge in world units):

```js
const PAPER = [245, 238, 222];
const ab = (rgb) => rgb.map((v, i) => -Math.log(Math.max(4, v) / PAPER[i]));   // colour -> absorbance
const MEADOW = ab([178, 198, 162]), PATH = ab([216, 184, 148]);
const sst = (t) => t <= -1 ? 0 : t >= 1 ? 1 : ((t + 1) / 2) ** 2 * (2 - t);     // smoothstep on [-1,1]
const pool = (d) => d <= 0 || d >= 2.6 ? 0 : (1 - d / 2.6) ** 2 * (d < 0.35 ? d / 0.35 : 1);
function shadePixel(eP, wa, gr, pap, out) {   // eP > 0 inside the path; wa/gr/pap = flow, granule, paper noise in [0,1]
  const wP = sst(eP / 0.5), wM = 1 - wP;
  const kM = 1 + 0.5 * pool(-eP), kP = 1 + 0.9 * pool(eP);                         // pigment pools at both edges
  const gap = Math.max(0, Math.min(1, (wa - 0.55) * 7)) * Math.max(0, 1 - Math.abs(eP) / 0.75) * 0.6;
  const gran = (1 + (gr - 0.5) * (0.6 * wM + 1.2 * wP)) * (1 + (0.5 - pap) * 0.45), mul = (1 - 0.88 * Math.min(1, gap)) * gran;
  for (let k = 0; k < 3; k++) {
    const A = wM * kM * 0.9 * mul * MEADOW[k] + wP * kP * (0.82 + 0.35 * wa) * mul * PATH[k];
    out[k] = PAPER[k] * (0.95 + 0.075 * pap) * Math.exp(-A);                       // Beer-Lambert over paper
  }
}
```

## Adapting it to your project

Keep fixed: paper `#f5eede` and its texture, sepia ink, the wash recipe (base + 2–3 blobs + highlight + rim + grain + offset), broken tapered contours thicker on the shadow side, indigo glaze shadows, absorbance-space ground mixing with pooled edges, the page margin and the three fonts.

May change:
- **Terrain**: replace meadow/forest/field/path with snow (cool `#dfe6ec` / `#b8c4d6` washes, ink `#252c46`), desert (ochre/sienna), swamp (payne grey/sap) — just swap the absorbance colours; keep them light (each channel ≥ 130).
- **Characters**: any species works if it keeps big heads, chunky silhouettes and the triplet palette (base/light/dark + rim). Give each creature type its own hue family so crowds stay distinguishable.
- **Props**: any object works as wash + broken outline with a light top-left blob, an indigo glaze bottom-right and its own shadow ellipse; keep the autumn leaf-litter colours as the accent range.
- **Formats**: side-scrollers can use the same washes for parallax layers (far layers: lower density, more bleed, no ink). Card/board projects can reuse the deckle card and banner textures.
- **Resolution**: bake sprites at `ceil(screenPxPerUnit)`; below 2 px/unit drop granulation and rim blur (they vanish anyway).
- **Night scenes**: darken via an indigo multiply glaze over the ground, keep carved-glow light sources — never switch the ink to black.

## Performance notes

- Init is the expensive part (1–3 s in the module): noise textures (two 1024² fields with 3 layers × 3 blur passes), ~60 character frames plus flash/soft/dissolve copies, 28 props, FX and HUD textures. Every `wash()` uses 2–5 canvas blur filters on a scratch canvas the size of the sprite. Show a loading state or spread baking over frames.
- Ground chunks: per-pixel shader ~0.4 M pixels per 256-unit chunk at 2.5 px/unit; the module builds it in a generator (yield every 1–2 rows, `putImageData` in 128-row bands) with a 5 ms/frame budget and keeps ~90 chunks cached. One reusable `ImageData` avoids 1.6 MB garbage per chunk. Water terms run only within 8 units of a pond, and pixels far from every wash edge take an exact fast path (no pooling/gap maths), which keeps the richer shader at the cost of the original one.
- Per frame is cheap: chunk blits, one shadow `Path2D` fill, sprite `drawImage`s (wind sway is a shear followed by the exact inverse shear instead of `save/restore`), 3–20 additive glows, particles from pre-baked sprites, a handful of falling leaves, and 4 margin strips (only the 11 % band is ever drawn).
- Never call `wash()`, `filter` or `getImageData` per frame. Animation = choosing among baked frames.
- `starter.js` bakes everything on its first `draw()` call (ground for the current canvas size, sprites, page margin) and then runs at well under 1 ms per frame.

## Copy-paste prompt

```text
Use the Watercolor Storybook art style for my project:
- Canvas 2D, procedural, 360 world units tall; light from the upper left; bake everything at init.
- Paper #f5eede is the white; ink is sepia #2a1b14 (blue-black #252c46 for cold things), never black.
- World: per-pixel watercolour shader. Mix terrain washes in absorbance space (paper*exp(-A)), pool pigment
  within 2.6 units inside every wash edge, leave 0.75-unit paper gaps, add granulation and lifted light pools
  (warm sap #acb880 in forests); meadow #b2c6a2/#c2cc96, path #d8b894, ponds #b0cccc -> #6a84aa.
- Compose the ground: reeds and lily pads by water, leaf litter and roots under each tree, flowers in
  single-species drifts, grass tufts in clumps with calm paper between them. Never sprinkle evenly.
- Every shape = wash (base + lighter top-left blob + darker bottom-right blob, paper highlight, pooled rim,
  grain) offset 0.45/0.35 units from a tapered, wobbling ink contour broken into 2-3 pieces, thicker on the shadow side.
- Characters: big heads, chunky storybook silhouettes, carved glowing faces (#ffcf55/#fff6cf). Pose them with a rig:
  8-pose walk (contact-down-passing-up), planted feet, head lags, scarf/leaves trail; 6 breathing idles + blink;
  hit = squash + paper lift for 140 ms; death = slump and bleed into a puddle; spawn = rise out of a wet stain.
- Creatures: 6-pose held cycles at 3-7 fps with a per-creature phase, scale and breathing rate.
- Trees: one light crown wash + clipped multiply foliage tiers with scalloped edges; ink on the shade side; wind shear.
- Effects in layers: paper-lift core, watercolour splash with pooled rim and teardrops, paint drops that land as
  stains, bloom rings and residue that dry out. One indigo glaze shadow rgba(50,54,92,0.2) per frame.
- Deckled bare-paper page margin; wash bars in hand-inked frames; deckle-edged paper cards.
- Fonts: IM Fell English SC (titles/numbers), Cormorant Garamond (body), Caveat (handwritten labels).
```
