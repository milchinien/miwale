# Low-Poly Diorama — Game Art Style Spec

> A toy-like autumn miniature world of flat-shaded triangle facets in soft afternoon light, with tilt-shift blur at the screen edges.

Every character, prop, collectible and ground tile is a real triangle mesh, projected with a fixed 44° three-quarter orthographic camera and flat-shaded by one warm sun plus a cool-sky / warm-ground ambient. Characters are **rigs**: separate part meshes on pivots (hip, knee, shoulder, elbow, neck, cape rings, scarf knot), re-posed for every frame and pre-rendered at 16 yaw angles, so walks with real contact and passing poses, breathing, blinks, lunges, hit reactions and facet break-ups all stay inside the medium while costing like 2D. The ground is a jittered triangle lattice lit from a tiny height field and composed into meadows, single-species groves, ponds with reed shores and winding trodden paths. Soft indigo cast shadows, glowing carved faces and a tilt-shift band make the scene look like a photographed tabletop diorama.

## At a glance

| | |
| --- | --- |
| Family | 3D Look · Low Poly |
| Mood | cozy, toy-like, sunny, autumnal, playful |
| Best for | top-down action games with crowds of units, cozy farming sims, tactics maps, casual adventure, idle builders |
| Renderer | Canvas 2D + a ~300-line software 3D pipeline (mesh → yaw → ortho projection → flat shading → painter's sort → baked sprite) |
| Pixel art | No — native resolution, sprites baked at 2–4 px per world unit |
| Complexity | 5/10 — triangle meshes by coordinates are fiddlier than voxels, but predictable once learned |
| Fonts | Baloo 2 (600/700/800), Nunito (600–900) |
| Key colours | meadow `#9cb876`, leaf litter `#c98e57`, pumpkin `#f48a2c`, root lilac `#a77ccf`, cape `#4b68a3`, glow `#ffc43a`, shadow `#2c3263` |

## When to use it

- **Good fit:** top-down or 3/4 projects with many units on screen (crowd action, RTS, tactics, farming, town builders). Pre-rendered mesh sprites give real 3D readability at 2D cost.
- **Good fit:** cozy / family / casual tone — the toy-like proportions, warm sun and pastel palette are friendly by default.
- **Good fit:** projects where facing matters — 16 baked yaw angles make direction obvious.
- **Bad fit:** horror, grit, realism — the pastel diorama look fights tension.
- **Bad fit:** side-scrollers and precise platformers — the 44° camera and soft shadows assume a ground plane seen from above.
- **Bad fit:** hundreds of *unique* animated models — every new model is code (coordinates), and every animation frame multiplies bake time by 16 yaws.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Meadow | `#9cb876` | Grass ground (variants `#95b16f` `#a3bd7d` `#99b572`), ~55 % of the screen |
| Leaf Litter | `#c98e57` | Autumn forest floor (variants `#bf824f` `#cf9c5d` `#c08a55`) |
| Sand | `#e2cb9c` | Sand, pond shores, farm yards (variants `#dbc392` `#e6d2a6` `#dfc797`) |
| Pond Water | `#6fb4c8` | Pond facets (`#69aec4` `#76b9cc` `#6cb1c6`), deepening to `#4b8fb4`, rim facets 42 % foam `#cdeae6` |
| Trodden Earth | `#c49a6c` | Paths (`#bc9164` `#c9a274` `#c09667`) – darker than sand so paths read |
| Rock ground | `#c2b49c` | Rocky biome (`#b8aa92` `#c9bca5` `#bcae97`), 18 % facets mossy `#98aa78` |
| Field soil | `#ab805d` | Ploughed fields (`#a47a59` `#b08662` `#a87d5b`) |
| Pumpkin | `#f48a2c` | Main character's head, pumpkin props — the main warm accent |
| Pumpkin Rib | `#e27526` | Alternating rib colour |
| Carved Glow | `#ffc43a` | Emissive carved faces; hot core `#fff1a6`, rim `#6e2e10` |
| Cape Blue | `#4b68a3` | Main character's cape |
| Linen | `#f3e6c8` | Main character's shirt (hem `#dccaa2`); pants `#6c4e3f`, boots `#46332c`, gloves `#73a052` |
| Scarf Red | `#d65d42` | Main character's scarf |
| Root Lilac | `#a77ccf` | Small creature top half (dark `#8661b4`) |
| Root Cream | `#f3e5bb` | Small creature bottom half (dark `#e2cf9a`, root legs `#dcc495`) |
| Leaf Green | `#80b25c` | All leaf blades, other side `#5f9248` |
| Ghost | `#c6def6` | Fast creature; ramp `#a6b5ec` → `#eaf5ff`, holes `#29325a` / `#161b33` |
| Rock Colossus | `#7f5c95` | Large creature top (mid `#9c7c90`, low `#c19c64`), cracks `#ffa63a`, core `#ffe58c` |
| Pine | `#4e8d6e` | Conifers (`#3f775c`, `#5c9c79`), trunks `#8c5c3e` |
| Mint Gem | `#4fe3b0` | Small collectible gem; large gem `#5cbdf6` |
| Shadow Indigo | `#2c3263` | Character shadows (props `#7d86c4` multiplied) |
| HUD Ink / Cream | `#3e3a58` / `#fffaf2` | HUD text / HUD panels |

Autumn tree crowns use four warm triads ordered by role **[mid, shadow side, sunlit top]** and picked by face normal (not at random): maple `#dc5d43 #cf4d3c #e6714b`, oak `#ee8b3a #e47a31 #f2a046`, birch `#ecb544 #e3a23c #f2c35a`, poplar `#d07a3f #c4653a #e09447`; birch bark `#ece6da` with marks `#4a4540`. Reeds `#8aa457` with cattails `#7a5038`, lily pads `#6fa452`, soil chunks `#8a6448 #a47a57 #6b4e3c`. Houses: walls `#f5ecd8`, roof `#cf6644` (ridge `#b4553a`), barn `#bf5540` with a slate roof `#7d7f96`, windows `#ffd77a` (emissive), door `#7a5038`. Wood `#ad7a50` / dark `#8a5e3d` / light `#cfa475`. Hay `#ecc766` / `#d4ab4f`, rocks `#b4ab9e` / `#9a9288` with moss `#95ad6c`, mushrooms `#d9583f`.

**Rules**
- Everything is mid-value and slightly desaturated; only emissive faces (glow, cracks, windows, gems) are fully saturated.
- The ground lives in a narrow value band so characters pop by hue: orange main character, lilac root creatures, white ghosts, green/red/orange trees.
- Shadows and vignettes are cool indigo/violet — never black or grey.
- Each material = 2–4 base colours used by **role** (dark underside / mid / lit top, chosen from the face normal); the lighting makes the rest of the ramp. Only ±3 % jitter per face on top – random tones per face read as confetti.
- Water is the only large cool area; keep it mid-value so the orange main character stays the clearest read.
- No pure black anywhere (darkest `#161b33`), no pure white surfaces except impact flashes and sparkle stars.

## Typography

**Baloo 2** — weights 600, 700, 800 — headings, HUD counters, floating numbers. `https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&display=swap`

```css
.title { font: 800 58px/1 'Baloo 2', 'Nunito', system-ui, sans-serif; color: #fff; letter-spacing: 1px;
  text-shadow: 0 1px 0 #f39a52, 0 2px 0 #ee8c45, 0 3px 0 #e8803c, 0 4px 0 #e07434, 0 5px 0 #d6692e, 0 12px 20px rgba(60,40,100,.45); }
.clock { font: 800 32px/1.1 'Baloo 2', sans-serif; color: #3e3a58; letter-spacing: 1px; }
```

**Nunito** — weights 600–900 — body text, labels, descriptions. `https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap`

```css
.desc  { font: 700 14px/1.35 'Nunito', 'Baloo 2', system-ui, sans-serif; color: #7e7898; }
.label { font: 800 10px/1 'Nunito', sans-serif; color: #8f87ab; letter-spacing: 2.2px; text-transform: uppercase; }
```

Text effects: big titles get a stacked 1-px "extruded" text-shadow (5 layers in an orange ramp, or a violet ramp `#a98bd6 → #8264b4` for sombre titles) plus a soft violet drop shadow — like a toy logo. Floating numbers on the canvas: `800 6.6px "Baloo 2"` (emphasised 8.4 px), white fill with a 1.5-unit `#463c66` stroke; emphasised numbers `#ffcf48` fill, 2-unit `#8a3a1c` stroke and a `!` suffix. Round line joins everywhere.

## Rendering technique

Coordinate system for models: **x = right / front of the model, y = south (towards the camera), z = up**, units = world units (the screen shows 360 world units vertically; the main character is ~17 × 31). The front of every model is **+x**; yaw rotates around z, and yaw = π/2 faces the camera.

1. **Camera.** Fixed pitch 44°: `SP = sin 44°`, `CP = cos 44°`. After yaw rotation `X = x·cos − y·sin`, `Y = x·sin + y·cos`, the orthographic projection is `screenX = ax + X·K`, `screenY = ay + (Y·SP − Z·CP)·K`, where `K` = sprite px per world unit and `(ax, ay)` = sprite anchor (feet).
2. **Back-face culling** against the view vector `(0, CP, SP)`: a face is visible when `ny·CP + nz·SP > 1e-4`. Double-sided faces (`ds`: leaves, cape, roof planes) flip their normal instead of being culled.
3. **Flat shading** per face: `d = max(0, n·L)`, `h = 0.5 + 0.5·nz`, `rgb = col · (SKY·h + GND·(1−h) + SUN·d)`, with `L = normalize(−0.58, 0.3, 0.76)`, `SKY = [0.47, 0.52, 0.67]`, `GND = [0.52, 0.44, 0.38]`, `SUN = [0.7, 0.62, 0.45]`. Optional `lift` blends back toward the base colour (ghost 0.3, gems 0.18, puffs 0.25). Emissive faces (`em`) skip shading entirely.
4. **Painter's sort** by `depth = −avgY·CP − avgZ·SP + bias` (far first). Decals painted onto surfaces use negative `bias` (−0.5 rim, −0.9 fill, −1.2 core) so they always win.
5. **Fill + same-colour stroke** (`lineWidth 0.85` px, round joins) hides the AA hairlines between facets. No outlines.
6. **Baking.** At init: `K = clamp(round(screenH/360·4)/4, 2, 4)`. Every character is baked at 16 yaws × N frames (`spriteSet`), every prop at one yaw, all with a shared feet anchor. Shadows are baked once per character type.
7. **Per frame:** fill `#a1b97e`, blit ground chunks, draw gem shadows/gems, draw character shadows, y-sort props + characters and blit their sprites (pixel-snapped to the view scale), then orbiting objects, projectiles, particles, floating numbers, then the screen-space tilt-shift + vignette.

Models are defined by **code, not data files**, from five primitives:
- `lathe(profile, segs, opts)` — surface of revolution from `[[r, z, offsetX?, offsetY?], …]` bottom→top (r = 0 is a pole). Options: `ribs` (every odd segment ×0.88 radius → pumpkin ribs), `twist` (radians per ring), `jitter` (random radius/height dents), `a0/a1` (open arc, e.g. a half-cape), `capB/capT`, and `col(ring, seg, upperHalf)` to colour each quad half.
- `box(sx, sy, sz, col)` — 12 triangles, auto-oriented outward.
- `ico(sub, {r, sx, sy, sz, jitter, col(nx,ny,nz,rng)})` — icosphere (20 or 80 faces), colour chosen per face from its direction (e.g. moss on faces with `nz > 0.62`).
- `leaf(len, wid, c1, c2, fold, bend)` — 7-vertex folded blade along +x, two colours either side of the ridge, double-sided.
- `feature(mesh, polygon, R, Rv, cz, col, opts)` — a 2D polygon `[[u, v]]` (u lateral, v height) ear-clipped and projected onto the front of an ellipsoid (radius R, half-height Rv, centre height cz), emissive. `carved()` stacks three: rim ×1.3 `#6e2e10`, fill `#ffc43a`, hot core ×0.5 `#fff1a6`.

Composition uses 3×4 affine matrices: `mesh.add(part, chain(T(x,y,z), RY(a), RX(b), SC(s)))`.

## World and ground

The world is an endless faceted tabletop, lit by the same sun and shading formula as every model (see *Rendering technique*). It is **composed**: every region has a designed edge, and small details appear where something causes them.

- Base fill `#a1b97e` behind everything.
- A jittered equilateral **triangle lattice**: cell `CS = 24` units, row height `24·0.866`, odd rows offset by half a cell, each vertex jittered ±26 % in x and ±23 % in y by a hash.
- Each vertex gets a **biome**, in priority order: rock (`fbm(x/330) > 0.675`), ploughed-field rectangles, **pond** (`fbm(x/300) > 0.70`) with a **sand shore** band (`> 0.684`), **path** (`|perlin(x/560)| < 0.042` – a thin winding ridge line through meadows and woods), forest (`warped(x/780) > 0.578`), sand, grass. The start area is kept dry. A clean-up pass absorbs lone vertices (but never breaks a path).
- Height: `biomeBase + rough · (hash·1.3 + perlin(x/75)·1.6) + perlin(x/280)·6`. Base / roughness: grass 0 / 1.2, forest 0.9 / 1.5, sand −1.6 / 0.7, rock 3.6 / 1.9, field −0.6 / 0.5, yard −1.0 / 0.5, path −0.5 / 0.35, water −3.0 / 0.14 (no large-scale swell) – so the shore facets tilt down into a lit bank.
- Biome colours: meadow `#9cb876 #95b16f #a3bd7d #99b572`, forest floor `#c98e57 #bf824f #cf9c5d #c08a55`, sand / yard `#e2cb9c #dbc392 #e6d2a6 #dfc797`, rock `#c2b49c …`, field `#ab805d …`, path `#c49a6c #bc9164 #c9a274 #c09667`, water `#6fb4c8 #69aec4 #76b9cc #6cb1c6`.
- **Facet tone** = one of the 4 variants chosen by a 64-unit noise field (`noise(mx/64)·0.85 + hash·0.3`), so tones form soft patches – large calm areas instead of per-facet confetti. Accents: 18 % mossy rock `#98aa78`, 3.5 % dry grass, 6 % darker forest. Mixed border facets mix 50 % with the neighbour 40 % of the time (toothed edges). Water facets deepen toward `#4b8fb4` with distance into the pond; water facets touching the shore mix 42 % foam `#cdeae6`.
- Macro tint `col · (1 + mt·0.12 + 0.012, 1 + mt·0.1, 1 + mt·0.05 − 0.01)`, `mt = fbm(x/520) − 0.5`; the facet normal goes through **the same `shadeRGB`** as the models.
- Ploughed fields: furrows every 14 units (3.2-unit darker north band, 3.4-unit lighter south band) with two-tone vine triangles.
- **Decals with intent** (baked into the chunk, y-sorted):
  - 14 leaf triangles in an ellipse (24 × 13) under every deciduous tree, shifted to the shadow side, **in that tree's own crown triad** – the litter tells you which tree dropped it.
  - 3 mushrooms `#d9583f` at the foot of 35 % of pines; 4 pebbles and tufts ringed around boulders.
  - Grass tufts (6 blades `#a4c27a`/`#87a865`) along region edges (30 % of edge cells, 1.2 % elsewhere); flowers only inside **meadow patches** (`fbm(x/110) > 0.6`), 2–4 per cluster, one colour per patch from `#fff4e0 #c9a5ea #ff9c84 #ffd45e #f2b6d6`.
  - Shores: reed clumps (6 blades `#8aa457` + 2 cattails `#7a5038`) on half of the shore cells; pond interiors: lily pads `#6fa452` in noise clusters, one in four with a pink flower; path edges: pebbles and tufts.
  - Forest floor between trees: only 5 % loose leaves.
- Prop cast shadows are multiplied into the chunk at alpha 0.62 (`#7d86c4`).
- Chunks: 256 world units, up to 3 px/unit, built incrementally by a generator (yield every 4 rows and every 64 decals). Water facet centres are stored per chunk for the animated glints.

## Characters

All characters are chunky toy figures built from lathes, boxes, icospheres and leaf blades (see *Rendering technique*), each with a readable face on the +x front, pre-rendered at 16 yaws and grounded by an indigo shadow. They are **rigs**: every part is its own mesh on a pivot, and every animation frame is the rig re-posed and baked – a sprite is never squashed to fake a pose.

**Main character** (example: a pumpkin-headed farm figure), built at native scale and scaled ×1.1, ~17 × 31 units:
- **Legs:** thigh lathe `[[1.58,0],[1.5,4.05]]` (pants `#6c4e3f`) from the hip, shin lathe `[[1.5,0],[1.62,1.7],[1.42,2.3],[1.47,3.9]]` (boot ring `#46332c`) hanging from a **knee** 3.8 below the hip, plus a 2.7 × 2.8 × 1.8 boot box pushed forward 1.1. Legs at y = ±2.05.
- **Hip height from the stance leg:** `hip = max over legs of 3.8·cos(a) + 3.9·cos(a + knee)`, so one foot always touches z = 0 and the body bob (low at contact, high at passing) falls out of the leg pose.
- **Torso:** 8-segment lathe `[[4.15,6.3],[4.5,7.2],[3.95,10.2],[3.35,12.9],[2.1,14.5],[0,14.8]]` in linen `#f3e6c8` (hem `#dccaa2`), belt ring, a small light-wood belt buckle `#cfa475` on the front (focal detail), scarf ring `#d65d42`. Breathing widens the chest rings by up to 0.14.
- **Scarf tail:** a box with a darker stripe hanging from a pivot at the knot (z 14.4); its angle trails the motion (0.35 idle → 1.35 in the lunge).
- **Cape:** an open lathe arc 0.6π–1.4π (the back half), double-sided `#4b68a3`, three rings: the hem ring is pushed back by `cape`, lifted by `capeLift` and swayed sideways by `capeSway`, the middle ring follows at 50 %/45 %.
- **Arms:** upper arm lathe from the shoulder (z 13.1, y ±4) + fore arm on an **elbow** 2.6 below, glove icosphere `#73a052`.
- **Head** on a neck pivot (z 15): pumpkin `sphereProf` radius 7.8, half-height 6.5, 16 segments, `ribs 0.88`, ribs `#f48a2c` / `#e27526`, twisted stem `#7a8a3e` and a leaf whose angle lags the bob. **Face:** two triangle eyes, a nose and a 13-point grin, `carved()` rim `#6e2e10` → glow `#ffc43a` → hot core `#fff1a6`. Blink: the eyes become thin slits without hot core. Hurt: the grin becomes an open hexagon.
- **16 poses × 16 yaws:** 8 walk, 4 breathing idle, 1 blink, dash crouch, dash lunge, hurt (see *Motion*).
- **Shadow:** idle mesh projected along the sun, blur 1.4, AO radius 6.2, `#2c3263` at alpha 0.5. A warm additive glow (r 9) sits over the face when it points toward the camera (40 % during a blink).

**Small creature** (lilac-and-cream root creatures), two designed variants chosen by the actor's seed:
- *Round:* 9-ring lathe `[[0,2.4],[2.8,3],[5.7,4.7],[7.7,7.4],[8.1,10.1],[7.1,12.8],[4.9,15],[1.8,16.3],[0,16.5]]`, jitter 0.32, twist 0.2; four leaf blades (8.8 × 3.3) fanned from z 15.8 plus one upright; angry slanted eyes `#4a2a5e` / `#ffd43c` / `#fff6c0`, brows `#5a3a78`, zig-zag mouth `#3d2552`.
- *Tall:* narrower 10-ring lathe up to 18.7 with a pointed top, a **crest** of three upright 11.5-unit blades fanned 0.55 rad apart, a curled olive sprout `#7c8e47`, a long root tail at the back, heavier flat brows and a lopsided grin with one fang.
- Ring colours for both: bottom `#e2cf9a`, cream `#f3e5bb`, a split cream/lilac ring (zig-zag colour border), lilac `#a77ccf`, top `#8661b4`. Root legs `#dcc495` with flattened cream feet.
- 6 walk poses + 1 hit pose (squashed 0.82, tilted back 0.34, leaves flung up, eyes squeezed to "> <", mouth open).

**Fast creature** (a pale teardrop spirit): one lathe whose lower rings drift back (`−t²·6.5`) and sway (`sin(phase + z·0.33)·t·2.2`) into a whipping tail; ramp `#a6b5ec` → `#c6def6` → `#eaf5ff`; **mitten hands** (rounded lathes, not cones) that alternate a slow swim stroke; a soft **wisp** on top (a wide leaf blade in `#eaf5ff`/`#c6def6`) that trails behind; hollow eye and mouth holes `#29325a` / `#161b33`. Hit pose: bent back, hands flung up, eyes and mouth 1.3× wider. Alpha 0.84, shading lift 0.3, shadow = AO blob only.

**Large creature** (a purple rock colossus, ~3× the main character): 8-segment lathe radius 17.4, jitter 1.0, bands `#c19c64` → `#9c7c90` → `#7f5c95`, emissive crack strips `#ffa63a`, a hexagonal core (`#5e3a2a` / `#ffa63a` / `#ffe58c`), slit eyes, icosphere shoulders and lathe arms with cracks, a crown of 5 leaves (`#7c8e47` / `#617638`) whose tilt lags each stomp. A pulsing additive glow follows the chest.

**Character rules**
- Creatures differ by hue *and* silhouette: round or crested root creature (lilac/cream), teardrop + tail + wisp (pale blue), huge cracked rock (purple with orange cracks).
- Sizes: main character ≈ 17 × 31, small creatures 16–21, large creatures 3× the main character.
- Every creature has 6 walk poses + a hit pose; per-actor phase comes from its own animation counter or seed.

## Props

Props are baked once at a single yaw with the same camera, sun and shading as the characters; each gets its own sun-projected shadow, multiplied into the ground at 0.62 in `#7d86c4`.

- **Four deciduous species** (designed variants, not jittered copies). Crown faces take the **dark / mid / light** tone of the species triad from their normal (`nz < −0.12` / middle / `nz > 0.42`, ±3 %), so every crown reads as one lit volume:
  - *Maple* (h 56, red): stout trunk `#8c5c3e`, one fork, a flattened crown (r 0.3·h, sz 0.8) with 4 side lobes.
  - *Oak* (h 62, orange): two branch forks, a broad **flat canopy** of 4 overlapping lobes (sz 0.6) and one higher lobe off-centre.
  - *Birch* (h 64, yellow): slim white trunk `#ece6da` with scattered dark marks `#4a4540`, 4 small clumps hung off alternate sides, largest lowest.
  - *Poplar* (h 78, rust): a single tall column crown (sz 2.25) with a lower side lobe.
- **Groves:** a 210-unit noise field picks the dominant species of an area (pines below 0.4, then maple → oak → birch → poplar); 85 % of the trees follow it. Density rises from 22 % at the forest edge to 54 % inside, so edges thin out into the meadow.
- **Pines:** 4 stacked jittered cones (7 segments), tier colour by role – dark skirt `#3f775c` on the bottom tier, `#4e8d6e` in the middle, a light sunlit top tier `#5c9c79`, underside ×0.85; trunk `#8c5c3e`; heights 58, 70, 82.
- **Boulders:** flattened icosphere (sub 1, sx 1.25, sz 0.72, jitter 0.16), radius 5 / 7.5 / 10, upward faces moss `#95ad6c`, others `#b4ab9e` / `#9a9288`; ringed by pebbles and tufts in the ground.
- **Pumpkins:** ribbed lathes (14 segments, ribs 0.86) radius 5.4–8.4 in three orange/yellow pairs with a stem and a leaf; **carved pumpkins** add triangle eyes and a jagged grin with the stacked carved glow.
- **Houses and barns:** boxes + double-sided roof planes + gables + ridge beam, ×1.5. House walls `#f5ecd8`, roof `#cf6644`, chimney; barn walls `#bf5540`, slate roof `#7d7f96`, cross-braced door; emissive windows `#ffd77a` in `#cfa475` frames. Farms group a house or barn with fences, hay and a carved pumpkin and are never placed next to a pond.
- **Haystacks**, **hay bales**, **fences** (3 posts `#8a5e3d`, rails `#ad7a50`), **stumps** as small farm/forest props.
- **Ground props** (baked as decals): reed clumps with cattails, notched lily pads, mini pumpkins, mushrooms, flowers, tufts, pebbles.

**Prop rules**
- Tall props fade to alpha 0.42 when the main character is behind them; low props never fade.
- Tall props stay in forest/rock biomes (plus 3 % of meadow cells), never on paths, shores or water.
- Keep props in the same faceting budget as characters: ≤ 16 segments, icospheres sub 0–1.

## Effects and particles

Every burst is **layered**: a core flash, the main shape (shards / pieces), secondary debris (leaf chips, puffs, sparks) and a lingering residue – each with its own lifetime and easing, all in facets.

- **Core flash** – a faceted star (5–8 points, inner radius 36 %) in a rim colour (`#fff1c9` hit, `#e9d6ff` small creature, `#dcebff` spirit, `#ffd27a` colossus, `#ffb35c` main character) with a white inner star rotated half a point; radius grows r0 → r1 with outQuad over 0.12–0.22 s, alpha `k²`.
- **Faceted shards** – flat triangles and 4-sided plates (32 %) with gravity 260, drag 1.6, spin; colour from an 8-step brightness palette of the source (`f = 0.6 + 0.45·t`) chosen per frame by `|cos(rot·1.1 + seed·6)|`, so they glint like real facets. They bounce on the ground (z clamps, velocity ×−0.35), rest, then shrink and fade in the last 35 %. Leaf-green chips (`#80b25c`, `#5f9248`, `#7c8e47`) come off leafy creatures; gold emissive chips with a small additive glow come out of the colossus core and celebrations.
- **Faceted ground ring** – a 12-gon on the ground (y × 0.5) expanding with outCubic, stroke `lw·(1 − t)`; big bursts stagger a second ring by 0.08–0.12 s (`#f6ecd6`, `#ffcf6a`, `#e6f1ff`, `#ffd666`, `#bdf5df`).
- **Residue** – a flat 7-vertex faceted patch (radius 8–20, jitter 28 %) in `#5a4060` / `#9fb6e8` / `#4a3a4a` at 30 % alpha, fading in over 0.12 s and out over the last 45 % of 0.9–2 s.
- **Facet break-up (vanish)** – 0–14 %: the hit pose swells 1.16 × 0.92 and whites out; 14–100 %: it is cut into 9 clip polygons (an inner core of 3 triangles fanned from the body centre + an outer ring of 6 quads) that fly out (15 units outer, 6 inner), up (17·up·u − 44·u²), spin 1.2–3.6 rad, land on the ground and fade after 55 %; a white copy fades out over the first 38 %. Spirits: pieces drift up 8–20 units and shrink to 40 %. Colossus: pieces move 45 % as far and crumble downward. At most 6 break-ups per frame; extra ones sink and fade.
- **Ground-opening appear** – a dark faceted hole `#4a3a3a` opens with outQuad, 5 cracks run out, 6 soil chunks are pushed up 5–10 units and thrown aside; the creature rises out of the clipped hole with outBack (overshoot), stretching 1.13 on the way up and squashing 0.9 on landing (0.45 s). Spirits: a frost disc + faceted frost ring, the body fades in with a 28 Hz flicker, drops 14 units and un-stretches from 1.5 to 1.
- **Low-poly puffs** – baked icosphere sprites (r 3, sub 1) in `#f6eedf` `#e0ecfb` `#d8c09a` `#fff3c9`, scale 0.7 → 1.4 while fading; dash dust and secondary dust of bursts.
- **Projectile** – flattened 8-segment seed lathe (`#f8ebc6`, rim `#dfc58c`) in 8 roll frames, rotated to its direction, tapered cream trail triangle `#fff6dc` (alpha 0.45, up to 16 units), dark ground dot.
- **Collectibles** – octahedron gems (mint `#4fe3b0` r 2.1 / sky `#5cbdf6` r 3.1) spinning 8 frames over a quarter turn with a halo; eased bob that holds at the top and bottom; every ~2.6 s a 4-point white glint catches the sun. Pickup: small flash + 12-gon ring + 3–5 rising star motes.
- **Orbiting objects** – lilac-and-cream lantern meshes with a carved face (×1.3) hovering 9 units in an additive warm glow (r 18).
- **Dash** – two cool white after-images of the lunge pose 7 units apart, three cream speed facets behind the body, 5 dust puffs and a small ground ring.
- **Celebration** – flash, a gold 12-gon ring 8 → 52, a mint ring 6 → 34 staggered 0.12 s, gold emissive chips rising, 14 star motes.

## Atmosphere and lighting

- One sun, `L = normalize(−0.58, 0.3, 0.76)` — from the upper left, slightly from the front, high. Same vector for models, ground facets, decals and shadow projection. Never change it per asset. Ambient is hemispheric: cool sky `[0.47, 0.52, 0.67]` above, warm bounce `[0.52, 0.44, 0.38]` below, sun `[0.7, 0.62, 0.45]`.
- **Cast shadows** (`makeShadow`): each vertex is projected onto the ground along the sun (`x += z·(−Lx/Lz)`, `y += z·(−Ly/Lz)`, then `y·SP`), triangles filled black, blurred with `ctx.filter = blur(1.4–2.4 units)` at alpha 0.5–0.62, plus a radial AO blob (radius 5–30 units, alpha 0.85–0.9), then recoloured with `source-in` to `#2c3263` (characters, drawn at alpha 0.5; ghosts 0.3) or `#7d86c4` (props, multiplied into the ground at 0.62). Shadows therefore fall to the lower right.
- **Glows**: additive (`lighter`) radial sprites only — warm `rgba(255,214,120,.75) → rgba(255,140,40,0)` (r 24), small `rgba(255,225,140,.9) → rgba(255,150,50,0)` (r 10), cold `rgba(220,240,255,.5)` (r 12). Emissive faces, windows and cracks glow by being unlit, not by bloom.
- **Tilt-shift** (screen space, every frame): copy the top 20 % and bottom 17 % of the frame into 1/8-size canvases (that is the blur), tint the top band with `rgba(232,238,250,.34 → 0)` haze and the bottom with `rgba(70,62,110,0 → .26)`, then draw each band back in 7 slices with alpha `(1 − e)^1.6` fading toward the centre.
- **Side vignette**: 9 %-wide gradients `rgba(60,55,100,.22) → 0` on the left and right.
- **Modal overlay**: `radial-gradient(ellipse at 50% 46%, rgba(255,246,232,.30), rgba(66,56,104,.66))` with `backdrop-filter: blur(3px)`.
- **Ambient motion** (always slower than the actors): leaves in the grove colours tumble down over the woods – one per other 64-unit cell, 5–8 s per fall from 50 units, drifting 18 units sideways, flipping with `cos(3.4·t)`; faceted 4-point glints blink slowly (`sin(1.1·t + phase) > 0.5`) on 20 % of pond facets.
- No bloom, no colour grading beyond that.

## UI

Toy-like rounded pills: cream `#fffaf2` panels, `border-radius 22px` / `999px`, violet drop shadow `0 6px 16px rgba(58,48,96,.24)` plus an inset bottom lip `inset 0 -4px 0 rgba(150,130,180,.13)`. Bars have a 4 px cream border, glossy vertical gradient fills and a white 5 px highlight stripe. Round icon badges overlap the start of bars (`margin-left: -12px`). Icons are low-poly meshes rendered at a custom pitch (18–40°) into radial-gradient circles (`#ffffff → #d6f2e8 / #ffe4cf / #e8ddf8`). Cards: 28 px radius, `linear-gradient(180deg, #fffefb, #fbf3e9)`, hover lifts 8 px. Text in Baloo 2 800, ink `#3e3a58`, labels `#8f87ab`.

```css
.hud-panel { background: #fffaf2; padding: 3px 26px 7px; border-radius: 22px;
  box-shadow: 0 6px 16px rgba(58,48,96,.24), inset 0 -4px 0 rgba(150,130,180,.13);
  font: 800 32px/1.1 'Baloo 2', 'Nunito', system-ui, sans-serif; color: #3e3a58; }
.hud-label { font: 800 10px/1 'Nunito', sans-serif; color: #8f87ab; letter-spacing: 2.2px; }
.icon-badge { width: 50px; height: 50px; padding: 5px; border-radius: 50%;
  background: radial-gradient(circle at 45% 35%, #ffffff, #fff1e4 75%);
  box-shadow: 0 6px 16px rgba(58,48,96,.24), inset 0 -3px 0 rgba(160,120,90,.14); }
.bar { position: relative; width: 230px; height: 28px; margin-left: -12px; background: #f2e6e2;
  border: 4px solid #fffaf2; border-radius: 999px; overflow: hidden;
  box-shadow: 0 6px 16px rgba(58,48,96,.24), inset 0 2px 3px rgba(110,50,50,.16); }
.bar-fill { position: relative; height: 100%; border-radius: 999px;
  background: linear-gradient(180deg, #ffa58a 0%, #f46d5d 55%, #dd5449 100%); box-shadow: inset 0 -3px 0 rgba(120,20,20,.14); }
.bar-fill::after { content: ''; position: absolute; left: 14px; right: 8px; top: 3px; height: 5px; border-radius: 99px; background: rgba(255,255,255,.45); }
.bar-alt { height: 24px; background: #e9e3f1; border: 4px solid #fffaf2; border-radius: 999px; }
.bar-alt-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #62dcb4, #6fd1d8 55%, #74c3f4); }
.card { width: 226px; border-radius: 28px; background: linear-gradient(180deg, #fffefb, #fbf3e9); color: #3e3a58;
  box-shadow: 0 18px 36px rgba(40,30,80,.34), inset 0 -6px 0 rgba(150,130,190,.16); transition: transform .14s; }
.card:hover { transform: translateY(-8px) scale(1.02); }
.overlay { background: radial-gradient(ellipse at 50% 46%, rgba(255,246,232,.30), rgba(66,56,104,.66)); backdrop-filter: blur(3px); }
```

## Motion and animation

The medium is smooth 3D, so poses interpolate in time (frames change every step of the cycle), but every pose is a designed rig pose.

- **Walk (main character):** 8 poses per stride, `frame = floor(anim·0.5·8) % 8` (anim advances with distance, so feet barely slide). Per leg `f = phase (+π)`: hip pitch `−0.58·sin f`, knee `0.1 + 1.05·max(0, cos f)^1.4` (the knee folds only in the swing phase), arms `0.62·sin f` with elbow `0.35 + 0.4·max(0, −sin f)` (counter-swing), torso lean 0.11, twist `0.12·sin`, roll `0.045·cos` over the stance leg. Follow-through: cape hem, scarf tail and head leaf peak at `sin(2·phase − 1.1…1.4)`, i.e. a moment after the bob; the head lags the body by 0.9 rad.
- **Idle:** 4 breathing poses over 2 s (chest +0.14, shoulders out 0.03, body +0.12, head lagging), and a **blink** pose for 0.14 s every 3.6 s (eye slits, face glow down to 40 %).
- **Dash:** the first 45 ms show the **crouch** (anticipation: knees fold, hip drops 1.2, lean 0.36, arms back 0.95), then the airborne **lunge** (+1.0 hip, lean 0.42, legs split −0.95 / +0.85, cape 5 units back and lifted 3.4, scarf 1.35) with after-images and speed facets; yaw snaps toward the dash direction (rate 0.5).
- **Hurt:** hurt pose while `hurtT > 0.62` (~130 ms), sprite tilted 0.16·hurtT² away from the facing, white flash 0.9; afterwards alpha 0.5/1 blinking at 18 Hz while invulnerable.
- **Small creature:** 6 poses at `anim·0.55`: legs ±0.65 with lift 1.5, body roll ±0.13, squash 0.935 at contact / stretch 1.065 at passing (volume kept), body up 1.1 at passing, leaves lag the bounce by 1.3 rad. **Colossus:** 6 poses at `anim·0.42`: feet lift 3.8, body drops 1.5 on every footfall, shoulders roll, arms swing ±0.5, leaf crown lags. **Spirit:** 6 poses at 1.5 cycles/s + seed: tail whip, alternating mitten strokes, trailing wisp; hover `1.6 + 3·smoothstep(triangle(0.45·t + seed))` – it holds at the top and bottom of each bob instead of a plain sine.
- **Per-actor phase:** walk frames come from each actor's own counter (randomised at spawn), spirits from their seed – crowds never move in lock-step.
- **Hit reaction (~140 ms, flash 1 → 0):** hit pose + white flash while flash > 0.25, sprite rotated `±0.26·smoothstep(flash)` in the push direction (0.12 for the colossus), squash 1.09 / 0.92, shoved 1.5 units.
- **Vanish (0.35 s):** swell + white-out for 14 %, then the facet break-up (see *Effects*). **Appear (0.45 s):** ground opening for the first 20 %, then rise with outBack + stretch/squash.
- **Facing:** smoothed yaw (angleLerp: 0.22 main character, 0.16 small creatures, 0.08 colossus), quantised to 16 baked angles; without velocity, actors turn to a 3/4 view of their facing side.
- **Gems:** 1.5 quarter-turns/s, eased bob 1.6 → 3.4, pop-hop 9 units on appearing. **Lanterns:** hover `9 + 1.2·sin(4t)`. **Floating numbers:** pop 0.55 → 1.15 in the first 14 % of life.

## Do and don't

**Do**
- Build every visible thing as a real triangle mesh and shade it with the same sun and ambient constants.
- Rig characters from part meshes on pivots; derive the hip from the stance leg; bake each pose at 16 yaws.
- Give every action its sequence: crouch before the lunge, hit pose under the flash, swell before the break-up, a ground opening before the rise.
- Colour crowns and tiers by face normal (dark / mid / light); keep facets big (5–9 segment lathes, icospheres sub 0–1).
- Compose the ground: single-species groves, litter in the crown's own colours, reeds on shores, flowers in patches, pebbles along paths.
- Give every object a sun-projected, blurred indigo shadow plus an AO blob.
- Finish with the tilt-shift bands and the soft violet side vignette.

**Don't**
- Don't add black outlines or cel ink lines.
- Don't use smooth / per-vertex shading or gradients on models – one colour per triangle.
- Don't pick facet colours at random per face; use the normal (models) or a low-frequency noise field (ground).
- Don't sprinkle decals evenly over a biome; place them where something causes them.
- Don't fake poses by squashing sprites – squash only accents a real pose (contact, landing, hit).
- Don't use grey/black shadows, and don't mix pitches or light directions between assets.
- Don't over-saturate the ground; it must stay a calm mid-value backdrop.

## Implementation recipe

1. Define the world: 360 world units of height on screen, ground plane = world xy, camera pitch 44°, sun `normalize(−0.58, 0.3, 0.76)`, ambient constants from *Rendering technique*.
2. Copy the 3D core from `starter.js`: matrices (`T`, `SC`, `RX`, `RY`, `RZ`, `chain`), `Mesh` (`vert`, `tri`, `add`, `orient`), `lathe`, `box`, `ico`, `leaf`, `triangulate`, `feature`, `carved`, `shadeRGB`, `drawMesh`.
3. At startup compute `K = clamp(round(screenH/360·4)/4, 2, 4)`.
4. Model the main character as a rig: big lathe/sphere head (≈ 60 % of height) with a carved emissive face on +x on a neck pivot, thigh + shin with a knee, upper + fore arm with an elbow, a 3-ring cape and a scarf tail on pivots. Write it as `mJack(pose)` and derive the hip height from the stance leg. Write pose functions: `walk(phase)`, `idle(i, blink)`, `crouch()`, `stretch()`, `hurt()`.
5. Model 2–3 creature types with distinct silhouettes and hues (round or crested root creature, teardrop spirit with tail and wisp, huge cracked rock), each with 6 walk poses + a hit pose and a face on +x; give the small one 2 designed variants.
6. Bake: for each character `spriteSet(poses, 16 yaws)`; for each prop a single yaw. Bake a shadow (`makeShadow`) per type, the white flash tints of the hit/hurt/lunge poses, and the 9 break-up clip polygons per set.
7. Build the ground per 256-unit chunk: jittered triangle lattice (24 units), biome (incl. ponds, shores, paths) + height per vertex, facet tone from a 64-unit noise field, height-field normal → `shadeRGB`, decals placed by cause (litter under crowns, reeds on shores, tufts on edges, flowers in meadow patches), prop shadows multiplied in at 0.62.
8. Per frame: blit ground chunks; water glints; gems; character shadows (alpha 0.5); y-sort props + characters and blit (hit tilt / spawn rise / break-up with transforms and clips); additive face glows; projectiles with trails; layered particles (flash, shards, rings, residue, puffs); falling leaves; floating numbers in Baloo 2.
9. Screen post: tilt-shift top 20 % / bottom 17 % via 1/8 downscale + haze gradients, then side vignette.
10. HUD in HTML/CSS with the cream pill styles above; render card icons with the same mesh pipeline at a custom pitch.

## Code

The snippets below are the core techniques, standalone. `starter.js` (same folder) contains the complete, runnable kit (meshes, main character, creatures, trees, ground, tilt-shift, preview scene). The full reference module is [`../../js/styles/lowpoly.js`](../../js/styles/lowpoly.js).

**Camera, light and flat shading**

```js
const SP = Math.sin(44 * Math.PI / 180), CP = Math.cos(44 * Math.PI / 180);
const LV = (() => { const v = [-0.58, 0.3, 0.76], l = Math.hypot(...v); return v.map((c) => c / l); })();
const SKY = [0.47, 0.52, 0.67], GND = [0.52, 0.44, 0.38], SUN = [0.7, 0.62, 0.45];
function shadeRGB(c, nx, ny, nz, lift = 0) {
  const d = Math.max(0, nx * LV[0] + ny * LV[1] + nz * LV[2]), h = 0.5 + 0.5 * nz;
  return c.map((v, i) => { const s = v * (SKY[i] * h + GND[i] * (1 - h) + SUN[i] * d); return s + (v - s) * lift; });
}
const rgbs = (c) => 'rgb(' + c.map((v) => Math.max(0, Math.min(255, v)) | 0).join(',') + ')';
```

**Projecting, culling, sorting and filling a mesh** (`m.v` = flat xyz array, `m.f` = `{a, b, c, col, em, ds, bias}`)

```js
function drawMesh(ctx, m, { yaw = 0, K, ax, ay, lw = 0.85, lift = 0 }) {
  const cs = Math.cos(yaw), sn = Math.sin(yaw), v = m.v, n = v.length / 3;
  const X = new Float32Array(n), Y = new Float32Array(n), Z = new Float32Array(n), list = [];
  for (let i = 0; i < n; i++) { X[i] = v[i*3] * cs - v[i*3+1] * sn; Y[i] = v[i*3] * sn + v[i*3+1] * cs; Z[i] = v[i*3+2]; }
  for (const f of m.f) {
    const { a, b, c } = f;
    const e1 = [X[b]-X[a], Y[b]-Y[a], Z[b]-Z[a]], e2 = [X[c]-X[a], Y[c]-Y[a], Z[c]-Z[a]];
    let nx = e1[1]*e2[2] - e1[2]*e2[1], ny = e1[2]*e2[0] - e1[0]*e2[2], nz = e1[0]*e2[1] - e1[1]*e2[0];
    const l = Math.hypot(nx, ny, nz); if (l < 1e-9) continue;
    nx /= l; ny /= l; nz /= l;
    if (ny * CP + nz * SP <= 1e-4) { if (!f.ds) continue; nx = -nx; ny = -ny; nz = -nz; } // back-face
    const dep = -((Y[a]+Y[b]+Y[c]) / 3) * CP - ((Z[a]+Z[b]+Z[c]) / 3) * SP + (f.bias || 0);
    list.push({ a, b, c, dep, s: rgbs(f.em ? f.col : shadeRGB(f.col, nx, ny, nz, lift)) });
  }
  list.sort((p, q) => q.dep - p.dep);
  ctx.lineJoin = 'round'; ctx.lineWidth = lw;
  for (const t of list) {
    ctx.fillStyle = ctx.strokeStyle = t.s; ctx.beginPath();
    for (const i of [t.a, t.b, t.c]) ctx.lineTo(ax + X[i] * K, ay + (Y[i] * SP - Z[i] * CP) * K);
    ctx.closePath(); ctx.fill(); ctx.stroke(); // same-colour stroke hides AA seams
  }
}
```

**A lathe — the workhorse primitive** (pumpkins, bodies, legs, cones, ghost sheets)

```js
function lathe(prof, segs, o = {}) { // prof: [[r, z], ...] bottom -> top, r = 0 is a pole
  const m = { v: [], f: [] }, vert = (x, y, z) => (m.v.push(x, y, z), m.v.length / 3 - 1);
  const col = typeof o.col === 'function' ? o.col : () => o.col, rings = [];
  prof.forEach(([r, z], i) => {
    if (r <= 1e-4) return rings.push({ pole: vert(0, 0, z) });
    const idx = [];
    for (let j = 0; j < segs; j++) {
      const a = (j / segs) * Math.PI * 2 + (o.twist || 0) * i, rr = r * (o.ribs && j & 1 ? o.ribs : 1);
      idx.push(vert(Math.cos(a) * rr, Math.sin(a) * rr, z));
    }
    rings.push({ idx });
  });
  for (let i = 0; i < rings.length - 1; i++) {
    const A = rings[i], B = rings[i + 1];
    for (let j = 0; j < segs; j++) {
      const j1 = (j + 1) % segs, tri = (a, b, c, k) => m.f.push({ a, b, c, col: col(i, j, k), bias: 0 });
      if (A.idx && B.idx) { tri(A.idx[j], A.idx[j1], B.idx[j1], 0); tri(A.idx[j], B.idx[j1], B.idx[j], 1); }
      else if (A.idx) tri(A.idx[j], A.idx[j1], B.pole, 0);
      else tri(A.pole, B.idx[j1], B.idx[j], 1);
    }
  }
  return m;
}
// ribbed pumpkin: alternating rib colours, 16 segments, radius 7.8, half-height 6.5
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const pumpkin = lathe([-90, -62, -34, -8, 18, 44, 66].map((e) => [e <= -89.99 ? 0 : 7.8 * Math.cos(e * Math.PI / 180), 6.5 + 6.5 * Math.sin(e * Math.PI / 180)])
  .concat([[1.56, 12.8], [0, 12]]), 16, { ribs: 0.88, col: (i, j) => hex(j & 1 ? '#e27526' : '#f48a2c') });
```

**Rig: hip height from the stance leg** (one foot always on the ground; the bob comes for free)

```js
const L1 = 3.8, L2 = 3.9; // thigh, shin
function walkPose(ph) {
  const legs = [], arms = [];
  for (let k = 0; k < 2; k++) {
    const f = ph + (k ? 0 : Math.PI);
    legs.push([-0.58 * Math.sin(f), 0.1 + 1.05 * Math.pow(Math.max(0, Math.cos(f)), 1.4)]); // knee folds in the swing phase
    arms.push([0.62 * Math.sin(f), 0.35 + 0.4 * Math.max(0, -Math.sin(f))]);                  // counter-swing, elbow bends forward
  }
  const lag = 0.5 + 0.5 * Math.sin(2 * ph - 1.4);                                               // follow-through peaks after the bob
  return { legs, arms, lean: 0.11, twist: 0.12 * Math.sin(ph), cape: 1.5 + 0.9 * lag, scarf: 0.5 + 0.3 * lag };
}
function hipHeight(pose) {
  let hip = 0;
  for (const [a, knee] of pose.legs) hip = Math.max(hip, L1 * Math.cos(a) + L2 * Math.cos(a + knee));
  return hip + (pose.bob || 0);
}
// leg k: mesh.add(thigh, T(0,0,-L1)); mesh.add(shin, chain(T(0,0,-L1), RY(knee), T(0,0,-L2)));
//        body.add(leg, chain(T(0, side * 2.05, hipHeight(pose)), RY(a)));
```

**Facet break-up: clip the current pose into flying pieces**

```js
// pieces: [{ p: [x0,y0, x1,y1, ...] (world units, relative to the feet), gx, gy (centroid), dx, dy, sp, up, spin }]
function drawBreakUp(ctx, img, K, ax, ay, pieces, x, y, u) {           // u: 0 -> 1 over the vanish
  const ease = 1 - (1 - u) * (1 - u), fade = 1 - Math.min(1, Math.max(0, (u - 0.55) / 0.45));
  for (const pc of pieces) {
    const ox = pc.dx * pc.sp * ease, oy = pc.dy * pc.sp * 0.5 * ease;
    const oz = Math.max(pc.gy + 1.2, pc.up * 17 * u - 44 * u * u);       // thrown up, falls, rests on the ground
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(x + pc.gx + ox, y + pc.gy + oy - oz);
    ctx.rotate(pc.spin * ease);
    ctx.beginPath();
    for (let i = 0; i < pc.p.length; i += 2) ctx.lineTo(pc.p[i] - pc.gx, pc.p[i + 1] - pc.gy);
    ctx.clip();
    ctx.drawImage(img, -ax / K - pc.gx, -ay / K - pc.gy, img.width / K, img.height / K);
    ctx.restore();
  }
}
```

**Sun-projected soft shadow sprite**

```js
function makeShadow(mesh, yaw, K, { ao = 6, aoA = 0.85, dirA = 0.6, blur = 1.6, col = '#2c3263' } = {}) {
  const cs = Math.cos(yaw), sn = Math.sin(yaw), kx = -LV[0] / LV[2], ky = -LV[1] / LV[2], v = mesh.v, PX = [], PY = [];
  for (let i = 0; i < v.length / 3; i++) {
    const x = v[i*3], y = v[i*3+1], z = Math.max(0, v[i*3+2]);
    PX[i] = (x * cs - y * sn + z * kx) * K; PY[i] = (x * sn + y * cs + z * ky) * SP * K; // slide along the sun ray
  }
  const pad = Math.ceil(blur * K * 2.5) + 2, x0 = Math.min(-ao * K, ...PX), y0 = Math.min(-ao * SP * K, ...PY);
  const w = Math.ceil(Math.max(ao * K, ...PX) - x0) + pad * 2, h = Math.ceil(Math.max(ao * SP * K, ...PY) - y0) + pad * 2;
  const ax = Math.round(-x0 + pad), ay = Math.round(-y0 + pad);
  const A = Object.assign(document.createElement('canvas'), { width: w, height: h }), a = A.getContext('2d');
  const B = Object.assign(document.createElement('canvas'), { width: w, height: h }), b = B.getContext('2d');
  a.fillStyle = '#000';
  for (const f of mesh.f) { a.beginPath(); a.moveTo(ax + PX[f.a], ay + PY[f.a]); a.lineTo(ax + PX[f.b], ay + PY[f.b]); a.lineTo(ax + PX[f.c], ay + PY[f.c]); a.fill(); }
  b.globalAlpha = dirA; b.filter = `blur(${(blur * K).toFixed(1)}px)`; b.drawImage(A, 0, 0); b.filter = 'none'; b.globalAlpha = 1;
  b.save(); b.translate(ax, ay); b.scale(1, SP * 0.95);                      // ambient-occlusion blob
  const g = b.createRadialGradient(0, 0, 0, 0, 0, ao * K);
  g.addColorStop(0, `rgba(0,0,0,${aoA})`); g.addColorStop(0.55, `rgba(0,0,0,${aoA * 0.55})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  b.fillStyle = g; b.beginPath(); b.arc(0, 0, ao * K, 0, Math.PI * 2); b.fill(); b.restore();
  b.globalCompositeOperation = 'source-in'; b.fillStyle = col; b.fillRect(0, 0, w, h); // recolour to indigo
  return { c: B, ax, ay };
}
```

## Adapting it to your project

- **Keep fixed:** pitch 44°, the sun vector, SKY/GND/SUN constants, outline-free fill+stroke facets, 16 baked yaws, indigo shadows, tilt-shift + side vignette, chunky faceting (≤ 16 segments), the cream-pill HUD.
- **May change:** the palette, as long as you keep (a) a calm mid-value ground in 4 close variants per biome, (b) 2–4 base colours per material, (c) saturated colours only on emissive parts. A winter re-theme: ground `#dfe7ef`-ish variants, shadows stay indigo, pines stay, crowns become white icospheres.
- **New characters:** compose from lathe + box + ico + leaf as a rig (parts on pivots); put a readable face on +x with `feature`/`carved`; write pose functions (walk, idle, hit) and bake 6–8 walk poses + 1 hit pose. Keep the main character ≈ 17 × 31 units and small creatures 16–21 units; large creatures 3× size. Design 2 variants of the most common creature.
- **Mixing elements:** the world, props and characters all depend on the shared camera (pitch 44°) and sun; when combining them with another style, keep those two constants and the indigo shadows, and swap only palettes and shapes.
- **Other project types:** a city builder uses `box` houses with gable roofs (already in the reference); a tactics map can snap units to the triangle lattice; a side-on view is *not* supported — change the camera pitch only if you re-bake everything.
- **Other resolutions:** only `K` changes; bake at `clamp(round(H/360·4)/4, 2, 4)` and keep world units. Low-end devices: bake 8 yaws instead of 16.

## Performance notes

- Baking is the main cost: main character 16 yaws × 16 poses, each creature set 16 × 7 (two small-creature variants), ~22 props, ~35 decal sprites, puffs, icons, plus the flash tints of the hit/hurt/lunge poses – pre-baked so no canvas is created during play. Bake, never draw meshes live.
- Per frame: one `drawImage` per character/shadow (a save/transform/restore while hit or appearing), a handful of additive glows, layered particles. Break-ups clip 9 pieces each and are capped at 6 per frame – the rest sink and fade.
- Ground chunks (256 units at ≤ 3 px/unit) are built by a generator that yields every 4 rows and every 64 decals within a 5 ms/frame budget. Litter, decals and prop shadows are baked in; water glint positions are stored per chunk.
- Ambient leaves use a memoised biome lookup per 64-unit cell (≈ 80 cells per screen, no noise per frame).
- Shadows use `ctx.filter = blur()` only at bake time. Tilt-shift: two 1/8-scale band copies and 14 slice blits per frame – the largest per-frame cost of the style.
- Measured against the previous version of this style: same median frame, dense scene ±5 %, chunk build +15–20 %.
- `starter.js` renders its whole preview in a few ms by caching every sprite and the ground canvas.

## Copy-paste prompt

```text
Use the Low-Poly Diorama art style for my project:
- Canvas 2D, no image assets. Write a tiny 3D pipeline: triangle meshes -> yaw -> orthographic 3/4
  projection (pitch 44°, screenY = (Y*sin44 - Z*cos44)*K) -> back-face cull -> painter's sort -> fill.
- Flat shading per triangle: col*(SKY*h + GND*(1-h) + SUN*max(0,n·L)), h = .5+.5*nz,
  L = normalize(-0.58, 0.3, 0.76), SKY [.47,.52,.67], GND [.52,.44,.38], SUN [.7,.62,.45]. No outlines.
- Build models from lathes (5-16 segments), boxes, icospheres (sub 0-1, jittered) and folded leaf blades.
  Faces/windows/cracks are emissive polygons stacked rim/fill/hot core on the model's +x front.
- Characters are rigs (knees, elbows, neck, cape rings, scarf pivot); hip height from the stance leg.
  Bake 8 walk + 4 idle + blink + dash crouch/lunge + hurt poses (creatures 6 walk + hit) at 16 yaws.
- Main character ~17x31 world units (360 units of screen height), big head ~60 % of the height, glowing face.
- Ground: jittered triangle lattice (24 units), tones from a noise field (meadow #9cb876, forest #c98e57,
  sand #e2cb9c, ponds #6fb4c8 with reed shores, trodden paths #c49a6c); litter under crowns, flowers in patches.
- Props: 4 tree species in groves (crown tone by face normal), tiered pines, mossy boulders, pumpkins, houses.
- Shadows: mesh projected along the sun, blurred, + AO blob, tinted indigo #2c3263 (never black).
- Palette: pumpkin #f48a2c, lilac #a77ccf, cream #f3e5bb, cape #4b68a3, glow #ffc43a, gems #4fe3b0.
- Effects, layered: faceted star flash -> shards/plates -> 12-gon ground rings + puffs -> faceted residue;
  vanish = facet break-up of the pose, appear = ground opens and the creature rises with overshoot.
- Post: tilt-shift (top 20 % / bottom 17 % via 1/8 downscale + haze) and a soft violet side vignette.
- UI: cream #fffaf2 pills, violet drop shadows, glossy gradient bars, fonts Baloo 2 800 + Nunito.
```
