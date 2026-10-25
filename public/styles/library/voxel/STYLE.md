# Voxel Cube World — Game Art Style Spec

> A bright MagicaVoxel-style miniature world: every object is a real 3D cube grid, baked to sprites under one warm afternoon sun.

Characters, props, collectibles, particles and even HUD icons are small 3D voxel grids. A tiny software voxel renderer (about 100 lines) turns each grid into sprites once at startup: 3/4 orthographic view with a 46° pitch, three face tones, per-voxel colour jitter, neighbour ambient occlusion and a painter's sort. The ground is a flat field of 4×4-unit voxel tiles with one-voxel height steps that show their side faces and a lit edge, and everything casts a blocky, slightly blurred sun shadow to the lower right. The result reads like a tabletop toy diorama: saturated autumn colours, chunky shapes, no outlines. The sample cast is a pumpkin-headed figure in a navy cloak and teal scarf, purple-and-cream root creatures with leafy tops, white floating ghosts and a big plum-coloured root creature with glowing cracks.

## At a glance

| | |
| --- | --- |
| Family | 3D Look · Voxel |
| Mood | cheerful, toy-like, cozy, crisp, sunny |
| Best for | top-down arena and action games, farming and village sims, tactics, builder/puzzle games, casual mobile games |
| Renderer | Canvas 2D + built-in software voxel renderer (sprites baked at init) |
| Pixel art | No — native resolution, blits snapped to whole screen pixels |
| Difficulty | 3/10 — new assets are 3D cube grids described in code; light, AO and shadows come from the renderer |
| Fonts | Bungee (numbers, titles), Chakra Petch 500/600/700 (labels) |
| Key colours | `#6da548` grass · `#94949a` stone · `#cfa86e` path · `#f7842a` pumpkin · `#ffd84a` glow · `#9b54d2` creature purple · `#2b2446` HUD panel |

## When to use it

- **Good fits:** top-down or 3/4 arena scenes, farming/village sims, tactics, casual mobile games, builder and puzzle games. Anything with many small readable figures on a tile-like world.
- **Good fit for AI-built projects:** a new creature or prop is just a 3D grid of cubes described with `box()`/`blob()` calls; lighting, AO and shadows come for free from the renderer. Very consistent output.
- **Bad fits:** dark horror (the look depends on bright sun), smooth organic or realistic characters, projects whose camera must rotate freely (sprites are baked for a fixed pitch and 2 yaws).
- **Bad fit:** very large creatures with many frames at high resolution — bake time and memory grow with voxel count × frames × yaws.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Meadow Grass | `#6da548` | Main ground (shades `#689f45 #6da548 #71aa4a #66a044 #75ad4d #6aa246`), ~40% of the screen |
| Flagstone | `#94949a` | Stone tiles (`#94949a #8e8f96 #9a9a9d #8a8b92 #97938d`), moss tiles `#82905f` |
| Sand Path | `#cfa86e` | Paths (`#cfa86e #c59d63 #d7b37c #be955d`), shore `#dcbd86` |
| Ploughed Field | `#8e5d3a` | Field tiles, alternating rows with `#7b4f31` |
| Leaf Litter | `#b47643` | Autumn floor (`#a8673e #b47643 #9e5c3a #bf8a4c #935538 #857c46 #ad6e40`) |
| Pond Blue | `#4aa6dc` | Water → deep `#3784c2`, light `#5cb6e6`, glints `#e8f8ff` |
| Step Side | `#7e5536` | Side faces of raised tiles: grass `#7e5536`, leaf `#70452b`, field `#5c3a23`, stone `#63646e`, path `#94693f`, water `#3a6f9e` |
| Pumpkin | `#f7842a` | Main character's head / pumpkin props; ribs `#e86f22`, top `#fb9036`, carved rim `#8a3412`, stem `#5b7a2a` |
| Carved Glow | `#ffd84a` | Emissive face; hot `#fff1a2`, mouth `#ffc23a` |
| Night Cloak | `#36325f` | Main character's clothes; `#27234a` hem, `#4c4787` light, shirt `#efe2c4`, pants `#5b4232`, boots `#2c221e` |
| Teal Scarf | `#22b8a2` | Main character accent; dark `#178c7c` |
| Root Purple | `#9b54d2` | Small creature top; `#7a3db2`, `#b672e2`, brows `#3a1a50` |
| Root Cream | `#f4e9cc` | Small creature belly; `#ddcfa8`, roots `#c9a46c`, leaves `#5fbe3b`/`#3e8f2b`, eyes `#ff4a2c` (emissive) |
| Ghost White | `#f6faff` | Fast creature; `#dfe9f8`, `#b8d6f3`, tail `#94bfea`, holes `#1c2044` |
| Plum | `#6c3e88` | Large creature top; `#54306b`, `#81509e`, roots `#946a42`/`#6f4b2d`, cracks `#ff9a2a`/`#ffd36a`, eyes `#ffef8a` |
| Gem Mint | `#5df0b6` | Small collectible gems; `#b6ffe0`, `#2fc596`; large collectibles gold `#ffc43a #fff0a0 #e8932a` |
| Pine Green | `#2f6e4c` | Pines (`#255a3e`, `#3d8659`); autumn crowns orange `#f08a2c`, red `#df4c34`, yellow `#f0c03e` |
| HUD Panel | `#2b2446` | Panels and cards |
| HUD Edge | `#151024` | Panel border, drop edge, text shadows |
| HUD Gold | `#ffc23e` | Titles, big counters, emphasised numbers |

**Palette rules**

- Only bright, saturated mid-tones in the world. No pure black; the darkest world colours are carved holes (`#1c2044`, `#24122c`, `#2c221e`).
- Every material uses 2–4 close shades chosen per voxel with a hash (`rnd3(x,y,z,seed)`), never one flat colour.
- Light shifts hue: sunlit tops warmer (r×1.035, b×0.965), shadow sides cooler and bluer.
- Only emissive voxels glow (faces, cracks, eyes, lamps), always yellow/orange/red, always with an additive glow sprite.
- Creatures purple/white, main character orange + navy + teal, world green/grey/brown/blue — each layer owns its hue range.
- The UI lives in its own dark-purple family so it never blends with the bright world.

## Typography

**Bungee** 400 — HUD numbers, big counters, titles, card names, floating numbers. https://fonts.google.com/specimen/Bungee

```css
.counter-big { font: 400 34px/1.05 'Bungee', 'Chakra Petch', system-ui, sans-serif; color: #ffc23e; letter-spacing: 2px;
               text-shadow: 0 2px 0 #d9741c, 0 4px 0 #a2470f, 0 6px 0 #151024; }
.title       { font: 400 64px/1 'Bungee', sans-serif; color: #ffc23e; letter-spacing: 3px;
               text-shadow: 0 3px 0 #e8801e, 0 6px 0 #c55a12, 0 9px 0 #8a3a0c, 0 12px 0 #151024, 0 20px 26px rgba(0,0,0,.45); }
.counter     { font: 400 24px/1 'Bungee', sans-serif; color: #fff; text-shadow: 0 3px 0 #151024; }
```

**Chakra Petch** 500/600/700 — labels, descriptions, hints. https://fonts.google.com/specimen/Chakra+Petch

```css
.label { font: 700 11px/1 'Chakra Petch', system-ui, sans-serif; color: #b7a9e6; letter-spacing: 3px; }
.desc  { font: 600 15px/1.3 'Chakra Petch', system-ui, sans-serif; color: #ddd4f6; }
```

Text effects: titles are "extruded" with 3–4 stacked hard `text-shadow`s stepping down 3 px each through darker oranges into `#151024` — never blurred glows. Small white numbers get a 2–3 px hard shadow below in `#151024`. Floating in-world numbers (canvas): Bungee 7 units (emphasised: 9 units + "!"), shadow copy offset (+0.3, +1.0) in `#1a1028` (emphasised `#5a200a`), fill `#ffffff` (emphasised `#ffc23e`).

## Rendering technique

The core is a voxel grid + a sprite baker. Coordinates: voxel `x` = right, `y` = toward the viewer (front), `z` = up. A grid is a `Uint16Array(w*d*h)` of colour ids (0 = empty).

1. **Scale.** `K = clamp(round(screenH/360*4)/4, 1.5, 4)` sprite px per world unit; `PPV = max(3, round(K*1.9))` sprite px per voxel; `VW = PPV/K` ≈ 1.9–2 world units per voxel.
2. **Colours.** `C(hex, {em, jit})` registers a colour id with optional emissive flag and per-voxel jitter (default 0.045).
3. **Models.** Built with `box(x0,y0,z0,x1,y1,z1,c)`, `blob(cx,cy,cz,rx,ry,rz,c,p)` (super-ellipsoid; p=2 ellipsoid, p≈2.6 soft-box, p=3–4 rounded box), `set()`, `paintFront(x,z,c)` (paint the front-most voxel of a column — faces, cracks) and `recolor()`. A colour argument may be a function `(x,y,z) => id` for gradients and random speckle.
4. **Projection** (`prep(yaw, ppv)`): rotate around z: `R(x,y) = [x·cos+y·sin, −x·sin+y·cos]`; screen `sx = R.x·ppv`, `sy = (R.y·sin46° − z·cos46°)·ppv`. `SP = sin46° = 0.719` (ground depth factor), `CP = cos46° = 0.695` (height factor). A face is visible when `R(n).y·CP + n.z·SP > 0`. Face quads are grown by `1 + 0.8/ppv` to hide seams.
5. **Face tones (the light).** Top = 1.0. Sides: `tone = 0.76 − 0.15 · R(n).x`. With yaw +0.6 the visible faces are top (1.0), the −x face pointing screen-left (0.884) and the +y face pointing screen-right (0.675); with yaw −0.6 it's +y left (0.845) and +x right (0.636). So the sun always comes from the upper left.
6. **Colour per face:** `k = jitter · tone · ao`, `jitter = 1 ± jit` from a hash of (x,y,z,seed). AO: each solid voxel next to the open face along its two tangents subtracts 0.075; side faces at z=0 ×0.9. Tops: `r·k·1.035, g·k·1.015, b·k·0.965`. Sides: `cool = (1−tone)·0.45`; `r·k·(1−cool·0.25), g·k·(1−cool·0.1), b·k·(1+cool·0.5) + cool·14`. Emissive voxels ignore light: `k = jitter·(top ? 1.02 : 0.95)`.
7. **Sort and fill.** Collect exposed voxels, sort by depth `R.y·CP + z·SP` ascending, fill each visible face as a 4-point path. The sprite's anchor is the footprint centre at z=0.
8. **Shadows** (`renderShadow`): for each surface voxel push its footprint quad at height z and z+1 sheared by `(z·0.62, z·0.26)` units, fill black, draw at alpha 0.62 with `blur(0.16·PPV px)`, plus a 0.55-alpha contact layer for voxels with z ≤ 1.5. Drawn under figures at alpha 0.42.
9. **Bake list:** main character 5 frames × 2 yaws (±0.6), each creature 4 frames × 2 yaws, collectibles/lanterns as 6–8-frame spin sets (`yaw = i/n · π/2 + 0.2`; a quarter turn suffices for 4-fold symmetric models), props at one fixed yaw (−0.4 to 0.6), debris cubes 1×1×1 in 6 yaws at `2K` px per unit with AO off.
10. **Per frame:** blit ground chunks → water glints + warm light pool under the main character → shadows of all figures/props → y-sorted props/creatures/main character → orbiting objects → projectiles → particles → floating numbers → vignette. Blits are snapped: `round(x·S − ax·S/K)/S`.

## World and ground

The ground is a flat, stepped voxel diorama seen from above, rendered per pixel into cached chunks. It uses the same sun as everything else (upper left), so its step faces and shadows match the voxel sprites.

- **Tiles:** the world is a grid of 4×4-unit cells. `cellMat(i,j)` is a pure function of the cell index returning `{mat, h}`: GRASS h1 (h2 in raised clumps where `fbm(x/230) > 0.655`), LEAF h1/h2, FIELD h0, STONE h1, PATH h0, WATER h−1. Large regions come from domain-warped fbm (scales 820–1050 units), ponds from fbm at 560, paths from `|perlin(x/430)| < 0.034` — zero-crossing lines become winding paths. Region borders get clustered jitter (`noise(x/15)`) so edges are chunky, not smooth.
- **Materials and colours:** grass `#689f45 #6da548 #71aa4a #66a044 #75ad4d #6aa246`; leaf litter `#a8673e #b47643 #9e5c3a #bf8a4c #935538 #857c46 #ad6e40`; stone `#94949a #8e8f96 #9a9a9d #8a8b92 #97938d` with moss `#82905f`; path `#cfa86e #c59d63 #d7b37c #be955d` with shore `#dcbd86`; field `#8e5d3a`/`#7b4f31`; water `#4aa6dc` → deep `#3784c2`, light `#5cb6e6`.
- **Colour per tile:** pick from the material's shade list with `noise(x/44)·0.85 + hash·0.3 − 0.1`; field rows alternate `#8e5d3a`/`#7b4f31` by `j & 1` (furrows); stone tiles become moss `#82905f` in patches; raised tiles ×1.05; whole world ×(0.95 + 0.1·noise(x/620)). Water deepens toward the pond centre and 30% of water tiles use the light shade.
- **Per-pixel pass** (fy, fx = position inside the tile in units, `edge = max(0.42, 1/res)`):
  - if the north tile is higher: band `= min(3.5, Δh·1.9)` units. Inside it: `fy < edge` → north colour ×1.14 + 6 (lit edge); grass/leaf lip `fy < 1.05` → north colour ×0.8; else side colour `SIDEC[mat] · (0.98 − 0.2·fy/band) · sideJitter(0.94–1.04)`. Side colours: grass `#7e5536`, leaf `#70452b`, field `#5c3a23`, stone `#63646e`, path `#94693f`, water `#3a6f9e`. Just below the band (0.9 units) ×0.84 contact shadow.
  - a higher west tile casts sun shadow: `fx < 1.5` ×0.8, `fx < 2` ×0.9.
  - tile bevel: top edge ×1.035, bottom ×0.95, left ×1.015, right ×0.965; stone joints bottom/right ×0.86, top/left ×1.05.
- **Decals** on a 7-unit jittered grid, positions snapped to 0.5 units, skipped inside step bands. All are "mini cubes": `mini(x,y,s,h,top,side)` = shadow rect `rgba(30,40,20,.22)` + side rect height `h·CP` + top rect depth `s·SP`. Grass: 38% tufts (2–4 blades 0.8 wide, 1.2–2.8 tall, tops `#8acb57 #7cbd4c #97d462`, sides `#5f9a3a #548c34 #68a440`), 9% flowers (white/yellow/red/violet/pink heads 1.6 wide on a 1.6-tall stem `#6aa844`/`#4c8030`), 3% pebbles (`#b9b9bc`/`#86868d` or `#a6a39f`/`#7c7973`). Leaf floor: flat 1.6×1.1 leaves in `#f08a2c #e05a2e #f2b23e #c94a2c #e8702a` with a shadow `rgba(60,30,10,.22)` offset (0.4, 0.4). Field: sprouts (`#86c556`/`#5b9338`, `#9bd666`/`#6aa444`). Stone: pebbles, moss, little L-shaped cracks `rgba(70,72,82,.55)`. Water: lily pads, reeds at shores.
- **Animated:** 16% of water tiles get a glint (1.8×0.55 + 0.6×0.6 rects `#e8f8ff`) shown when `sin(t·1.7 + phase) > 0.55`.
- **Scale:** one tile = 4 world units = 2 voxels, so ground steps line up with the 2-unit voxel size of characters and props.

## Characters

All characters are voxel grids at ≈ 2 world units per voxel, built from `blob()` bodies, `box()` limbs and faces painted with `paintFront()`. No outlines: the face tones and dark "carved" voxels separate the forms. Each character is baked twice, yaw +0.6 (facing right) and −0.6 (facing left) — never mirror the sprite, the light would flip. Each figure casts the blocky sun shadow to the lower right at alpha 0.42 (floating figures 0.22).

**Main character** — a pumpkin-headed figure in a navy cloak and teal scarf, a 10×9×18-voxel grid (≈ 20 × 18 × 36 world units, ~30 units tall on screen):

- **Legs:** two 2×2 columns at x 3–4 and 5–6, z 0–2, `#5b4232` with a boot voxel `#2c221e` at the bottom.
- **Body (cloak):** z = 3: 8×6 hem slab with a darker border `#27234a`; z 4–6: 6×5 torso `#36325f`, a 2-voxel lighter front panel `#4c4787` with a shirt collar `#efe2c4`; arms are 1-voxel columns at x=1 and x=8 with glove voxels `#7d5634`.
- **Scarf:** a full ring at z = 7 (teal `#22b8a2`, every 3rd voxel `#178c7c`) plus a 2-voxel tail hanging at the back.
- **Head:** `blob(5, 4.5, hz=b+8.6, 5.05, 4.4, 3.75, p=2.6)` — a soft-box pumpkin (big head on a short body: 10×9×8 voxels on a 6-voxel body). Ribs: `cos(atan2(y,x)·5) > 0.55` → `#e86f22`, top layers `#fb9036`, base `#f7842a`. Stem 2 voxels `#5b7a2a`, 3 leaf voxels `#7cc24a`.
- **Face:** a list of (x,z) pixels painted with `paintFront`: two triangular eyes (3 + 1 voxel), a 5-wide jagged mouth over two rows. Eyes `#ffd84a`, mouth `#ffc23a`, eye centres `#fff1a2` — all emissive. Every 4-neighbour of a face pixel that isn't itself a face pixel is painted `#8a3412` (dark carved rim) — this replaces an outline.
- **Animation frames:** f0 idle, f1–f4 walk. `legY = [0,1,0,−1,0]` shifts legs ±1 voxel in y, `lift = [0,0,1,0,1]` raises body and head by 1 voxel on passing frames, one boot is raised 1 voxel on f2/f4, arms counter-swing (`armY = −legY`).
- **Glow:** an additive warm glow sprite 22×18 units over the face (alpha 0.34 ± 0.06, sin t·9) and a 60×30 warm light pool on the ground at alpha 0.14.

**Small creature** — a purple root creature with a cream belly and a leafy top, 10×10×15 voxels: one `blob(5,5,cz,4.7,4.5,4.4)` with a noisy vertical gradient: top purple (`#9b54d2`, 18% `#b672e2` speckle, crown `#7a3db2`), a 50/50 mixed band, cream belly `#f4e9cc`/`#ddcfa8`. Two 1-voxel root legs `#c9a46c`, a leaf tuft of 3 small boxes (`#5fbe3b`, stem `#3e8f2b`) that sways ±1 voxel per frame. Face: 2 emissive red eyes `#ff4a2c`, a 4-wide brow and 2-voxel mouth `#3a1a50`. 4 frames: legs shift ±1 voxel, body lifts 1 voxel on alternate frames.

**Fast creature** — a white floating ghost, 11×9×15 voxels: head `blob(5.5,4.5,10.2, 4.4,3.7,3.9)` white `#f6faff` with frost speckle, a tail of 7 stacked thin discs shrinking and swaying downward (`#dfe9f8` → `#b8d6f3` → `#94bfea`), 2×3 arm slabs that bob 1 voxel. Hollow 2×2 eyes and an O-mouth in `#1c2044`. Floats 2.5 ± 1.5 units above the ground, drawn at alpha 0.84 with shadow alpha 0.22.

**Large creature** — a big plum-coloured root creature with glowing cracks, 19×16×25 voxels: big `blob(9.5,8,12.5, 7.6,6.6,8.4, p=2.4)` purple top (`#6c3e88`, speckles `#54306b`/`#81509e`) over a brown root bottom (`#946a42`, `#6f4b2d`), 4×4 stump legs with `#5c3f27` feet, 3-wide arm columns with brown fists, a leaf crown (`#4b8a3a`/`#356b2f`), 3 vertical emissive crack lines alternating `#ff9a2a`/`#ffd36a`, 4 pale emissive eyes `#ffef8a` under a dark brow, mouth `#24122c`. Plus an additive orange glow (30×26 units, alpha 0.32 ± 0.12) over the chest.

**Rules for all characters**

- Keep one voxel ≈ 2 world units: main character ≈ 10 voxels wide, small creatures ≈ 10, large creatures ≈ 19.
- One dominant colour family per character plus a contrasting light underside (cream, white), so silhouettes read on any ground.
- Faces are 1-voxel pixels on the front surface: emissive yellow for warm friendly glow, emissive red eyes with dark brows for menacing creatures, dark holes for ghosts.
- Animation is done by rebuilding the grid per frame (legs ±1 voxel, body lift 1 voxel, arms counter-swing, leaves sway ±1 voxel) — never by rotating or scaling the sprite.

## Props

Props are voxel grids with the same renderer, the same ≈ 2-unit voxel and the same sun as the characters. Each is baked at one fixed yaw between −0.4 and 0.6 with its own shadow (drawn at alpha 0.40), and is y-sorted together with the characters.

- **Deciduous tree** 15×15×24: 3×3 trunk 11 voxels tall (`#7a5236`, 30% `#5f3f29`) with root voxels and a short side branch; crown = one big p=3.2 blob + 4 random p=3 blobs + a top blob. Three autumn colour sets: orange `#f08a2c #e2701f #f7a845 #d45f1d`, red `#df4c34 #c93a2c #ec6a45 #b02f28`, yellow `#f0c03e #e2a52f #f8d867 #d4902a`; the top layers favour the light shade.
- **Pine** 13×13×25: dark trunk `#5f3f29`, 5 stacked tiers of p=2.6 discs shrinking upward (radii 6.2, 5, 3.8, 2.6, 1.5), bottom layer of each tier `#255a3e`, body `#2f6e4c` with 20% `#3d8659`, a 2-voxel tip.
- **Pumpkin** 8×8×8 / 11×11×10: ribbed blob in `#f7842a`/`#e86f22`/`#fb9036`, stem `#5b7a2a`, leaf `#7cc24a`; optionally carved with an emissive face `#ffd84a` and a small warm glow (radius 7 units at height 4).
- **Hay bale** 10×9×9: p=3 blob `#ebc75c`, 30% `#d3aa45`, top `#f6dc84`, with a dark binding band.
- **Crate** 6×6×6: wood `#b07a46` with 25% `#c9965c`, darker edges `#7c5230` where ≥ 2 coordinates are on the border.
- **Gravestone** 7×3×10: stone `#a9abb2`/`#8a8d97` with mossy base `#7f9a52` and an engraved cross `#5e606b`; a variant is a slim stone cross with a `#c3c4c8` cap.
- **Lamp post** 5×5×15: iron `#3b3540`/`#5a5262`, emissive glass `#ffcf5a` with a hot band `#fff3b8`, plus a warm glow of radius 14 units at height 21, alpha 0.5 ± 0.08.
- **Fence** 13×1×6: three posts `#7c5230` and two rails `#c9965c`. **Bush** 8×7×6: `#4f9a3c`/`#3e7f31` with 7% red berry voxels `#e2423a`. **Mossy rock** 7×6×5: `#9a9ca4`/`#80838d` with moss on top. **Mushroom** 7×7×7: red cap `#e2463a` with `#fff6e8` dots on a `#f0e3c6` stem, plus a small second mushroom.
- **Placement:** props only stand where the tile and the tile to the south have the same material and height — never on steps, water or paths. Leaf floor gets dense trees, pines, mushrooms, bushes; grass gets sparse trees, bushes, rocks, hay; fields get pumpkin clusters, hay, fences, crates; stone gets gravestone pairs, lamp posts, crates.
- **Readability:** tall props (trees, pines) drop to alpha 0.45 when the main character walks behind them.

## Effects and particles

Effects are built from the same vocabulary as the world: little cubes, square rings and additive glows. Everything stays blocky — no round particles, no circular rings.

- **Cube debris** — the signature effect. 1×1×1 voxel cubes pre-rendered in 6 yaw frames at `2K` px per unit with AO off, coloured from the palette of the object that bursts (e.g. `#9b54d2 #7a3db2 #f4e9cc #ddcfa8 #5fbe3b #b672e2` for the small creature). Small impact: 2–3 cubes (size 1.6, speed 50, life 0.5 s, vz 60). Full burst: 14 cubes (size 2.3, speed 70, vz 110, life 1.1 s). Large-creature burst: 34 cubes (size 3.6, vz 140, spread 24) + ring + 8 sparks + camera shake 4. Ghost burst: 10 cubes with negative gravity (−30) that float up. Physics: gravity 320, drag 1.4, tumble = frame `floor(rot·2) mod 6`, small dark square shadow when z ≤ 0.5, fade over the last 30% of life.
- **Sparks:** plain squares 1.4–2.4 units (`#ffffff`, `#ffd27a`), drag 4, life ~0.3 s.
- **Rings:** `strokeRect(x−r, y−r·SP, 2r, 2r·SP)` — square, squashed to the ground plane. Radius 8→54 (large gold ring `#ffd84a`), 10→48 (large-creature burst `#fff1c8`), easing outQuad, width `lw·k + 0.4`, alpha `0.85·k`.
- **Projectiles:** spinning 3×2×4 voxel seed (`#f8edd2`/`#dcc394`, 6 spin frames) + 3 trailing squares 3.2 units apart, sizes 1.75/1.3/0.85, alphas 0.41/0.27/0.13 in `#fff6dc` / `#ffe2a8`; no glow.
- **Rising appearance:** a creature sprite is revealed bottom-up in whole voxel layers (`PPV·CP` px steps, outQuad) with 4 dirt cubes (`#8c5b37 #a87a4c #6fae46`) hopping around.
- **Impact flash:** white silhouette (source-atop tint) at alpha `min(0.58, flash·0.8)`. Red tint for the main character: `#ff4a3a` silhouette; a blink effect alternates alpha 0.5/1 at 18 Hz.
- **Squash and burst:** squash x `1+0.35t`, y `1−0.6t` over 0.28 s with white overlay `0.6·(1−t)`, then the cube burst.
- **Speed trail:** 3 orange (`#ffb347`) silhouette afterimages 6 units apart at alpha 0.17·(4−i) + 6 dust cubes (`#e9dcc0 #d8c7a2 #f3ead6`).
- **Collectibles:** small gem = stepped octahedron (5×5×7; per layer a diamond `|x−c|+|y−c| ≤ r`), mint `#5df0b6`/`#b6ffe0` top half, dark `#2fc596` bottom half; large variant 7×7×10 in gold `#ffc43a #fff0a0 #e8932a`. Spin set of 8, hover 2.4 ± 0.9 units, mint (or gold) additive glow, flat dark square shadow. Collecting: 2–5 tiny mint/gold sparks and a pop hop `sin(pop·π)·9`.
- **Orbiting objects:** a small 8×8×11 purple-and-cream root lantern with an emissive carved face (`#ffd84a`, `#fff1a2`) and leaf top, spin set of 8 at 0.85·PPV, warm glow 32×32 units at alpha 0.5 ± 0.12.

## Atmosphere and lighting

- **One sun** from the upper left, baked into face tones (top 1.0, sides `0.76 − 0.15·R(n).x`, sunlit tops warmed, shadow sides cooled toward blue) and into shadow shear (0.62, 0.26 per unit height). There is no runtime lighting of sprites.
- **Cast shadows:** every voxel footprint at z and z+1 sheared to the lower right, filled black, blurred `0.16·PPV px`, layer alpha 0.62 plus a 0.55 contact layer for z ≤ 1.5. Drawn at alpha 0.42 for characters, 0.40 for props, 0.22 for floating figures; small collectibles/orbiting objects/projectiles use a flat dark `#1d2a14` rectangle at 0.22–0.28 alpha instead.
- **Ground shadows:** step faces darken toward their base (×0.98 → ×0.78), a 0.9-unit contact strip ×0.84 under each step, and a 1.5-unit strip ×0.8 east of every higher tile (sun from the west).
- **Glows:** a 64 px radial gradient sprite (stops 0 → 0.9, 0.35 → 0.35, 1 → 0 alpha) in warm `rgb(255,190,80)`, mint `rgb(120,255,200)`, gold `rgb(255,200,80)` or hot `rgb(255,150,50)`, drawn with `globalCompositeOperation = 'lighter'`. Only emissive parts get one: carved faces, cracks, eyes, lamps, collectibles.
- **Ground light:** only a 60×30 warm pool under the main character (alpha 0.14 ± 0.02) and blinking glints on water.
- **Vignette** (screen space, a 320×180 canvas stretched): radial gradient centred at (w/2, 0.48h), inner radius 0.32h, outer 0.62w; stops `rgba(30,20,60,0)` → 0.6: `rgba(30,20,60,.12)` → 1: `rgba(24,14,50,.42)`. Plus a vertical warm wash `rgba(255,236,190,.10)` at the top fading out by 35%.
- **Overlay screens** dim the world with `radial-gradient(ellipse at 50% 45%, rgba(40,30,80,.35), rgba(16,10,34,.78))`.
- No outlines, no bloom pass, no colour grading, no film grain. Darker moods are made with more emissive voxels and glow sprites, not by darkening the renderer.

## UI

Flat dark-purple slabs that look like a chunky block: hard bevel insets, a 3 px near-black edge and a 6 px hard drop edge. Bars are segmented every 18 px and have three hard colour bands. Icons are the style's own voxel models rendered at icon size (ppv fitted to 84% of the box, floored when ≥ 2.5) with a dark offset silhouette shadow. Cards sit on a two-tone background (`#3d335f` top 52%, `#30284c` below), icon wells use a 24 px checker `#251e3c/#2c2447`, number keys are gold split buttons. Hovered cards lift by 8 px.

```css
:root { --panel: #2b2446; --edge: #151024; --gold: #ffc23e; }
.panel {
  background: var(--panel); border-radius: 3px; padding: 7px 14px; color: #fff;
  font: 600 15px/1.3 'Chakra Petch', system-ui, sans-serif;
  box-shadow: inset 0 3px 0 rgba(255,255,255,.16), inset 3px 0 0 rgba(255,255,255,.07),
              inset 0 -4px 0 rgba(0,0,0,.38), inset -3px 0 0 rgba(0,0,0,.22),
              0 0 0 3px var(--edge), 0 6px 0 3px var(--edge), 0 10px 18px rgba(10,6,24,.35);
}
.bar { width: 216px; height: 22px; background: #160f22; border-radius: 2px; overflow: hidden;
  box-shadow: inset 0 3px 0 rgba(0,0,0,.55), 0 0 0 2px #0e0a18; }
.bar.red > i { display: block; height: 100%;            /* red bar */
  background: repeating-linear-gradient(90deg, rgba(0,0,0,0) 0 15px, rgba(50,8,16,.8) 15px 18px),
              linear-gradient(180deg, #ffb09a 0 22%, #f0443a 22% 70%, #b3242a 70% 100%); }
.bar.mint > i { display: block; height: 100%;           /* mint progress bar */
  background: repeating-linear-gradient(90deg, rgba(0,0,0,0) 0 15px, rgba(16,40,40,.75) 15px 18px),
              linear-gradient(180deg, #c8ffee 0 20%, #57e6b4 20% 68%, #26a888 68% 100%); }
.counter-big { font: 400 34px/1.05 'Bungee', sans-serif; color: var(--gold); letter-spacing: 2px;
  text-shadow: 0 2px 0 #d9741c, 0 4px 0 #a2470f, 0 6px 0 var(--edge); }
.key { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 2px;
  font: 400 15px/1 'Bungee', sans-serif; color: #2b1a0c; background: linear-gradient(180deg, #ffd36a 0 50%, #f3a13a 50%);
  box-shadow: inset 0 -3px 0 rgba(0,0,0,.25), 0 0 0 2px var(--edge); }
.overlay { background: radial-gradient(ellipse at 50% 45%, rgba(40,30,80,.35), rgba(16,10,34,.78)); }
```

- HUD panel in canvas: `#151024` rect 3 px larger on each side (9 px taller), `#2b2446` fill, a 3 px top highlight `rgba(255,255,255,.16)` and a 4 px bottom shade `rgba(0,0,0,.38)`.
- Counters next to bars: Bungee 15 px white with a 2 px `#151024` shadow below (e.g. "86/100").

## Motion and animation

- Frame-stepped: main character walk frame `1 + (floor(anim·1.6) & 3)`, small creature `floor(anim·1.8) & 3`, large creature `floor(anim·1.3) & 3`, ghost `floor(t·6 + seed·4) & 3`.
- Idle main character hops `max(0, sin(t·2.6))·0.6` units; the ghost floats `2.5 + sin(t·2.8 + seed·20)·1.5`.
- Collectibles: frame `floor((t·1.6 + seed·7)·8) mod 8`, hover `2.4 + sin(t·3 + seed·10)·0.9`; collect pop hop `sin(pop·π)·9`.
- Orbiting lanterns: spin frame derived from the orbit angle (`angle/(π/2)·8`), hover `9 + sin(t·4 + i·1.7)·1.2`.
- Positions snap to screen pixels; sprites are never smoothly rotated. Only particles and the squash scale.
- Flicker: glows ±0.02–0.12 alpha at 4–11 rad/s; water glints blink when `sin(t·1.7 + phase) > 0.55`.
- Floating numbers: scale 0.6 → 1.15 in the first 12% of life, then down to 1.0; alpha `clamp(life·3)`; emphasised numbers get a "!" and gold colour.

## Do and don't

**Do**

- Model everything (props, collectibles, particles, icons) as voxel grids and run them through the same renderer.
- Keep one voxel ≈ 2 world units; main character ≈ 10 voxels wide, small creatures ≈ 10, large creatures ≈ 19.
- Bake two yaws (±0.6 rad) per character instead of mirroring.
- Use 2–4 hashed shades per material plus the ±4.5% per-voxel jitter and AO.
- Paint faces onto the front-most voxels; surround glowing faces with a dark carved rim.
- Give every object the sheared blocky sun shadow to the lower right.
- Build the ground from 4×4-unit tiles with visible 1-voxel steps and lit edges.

**Don't**

- Don't draw outlines or black strokes.
- Don't use smooth gradients or round vector shapes on characters or props (only glows and the vignette are soft).
- Don't rotate or scale baked sprites at runtime — bake another yaw/frame.
- Don't mix voxel sizes in one scene.
- Don't use round rings or round particles — use squashed square rings and cubes.
- Don't light from more than one direction or darken the world for night scenes.
- Don't use dull, desaturated colours for the world.

## Implementation recipe

1. Copy `starter.js`'s `Vox`, `C()`, `prep()`, `renderVox()`, `renderShadow()` and `blit()` into your project. Keep the constants: pitch 46°, `SHX 0.62`, `SHY 0.26`, tone formula `0.76 − 0.15·R(n).x`, AO 0.075, jitter 0.045.
2. Decide the world scale: 360 world units visible vertically; compute `K` and `PPV = max(3, round(K·1.9))` from the screen height at startup.
3. Register your palette with `C()`; mark glowing colours `{ em: 1 }`. Give each material 2–4 shades.
4. Write one builder function per figure `model(frame) → Vox`: start with `blob()` for bodies (p 2–2.6), `box()` for limbs, `paintFront()` for faces. Make animation by shifting legs/arms by ±1 voxel per frame (4 walk frames).
5. At init, bake every character: frames × yaw ±0.6, plus one shadow per yaw. Bake collectibles as 8-frame spin sets, props at a fixed yaw, and 1-voxel debris cubes in 6 yaws per palette colour.
6. Build the ground: a pure `cellMat(i,j)` (material + height) on a 4-unit grid, per-tile colour pick, then the per-pixel pass for steps (lit edge, lip, side band, contact shadow, west shadow, tile bevel). Render in chunks (e.g. 256 units) and cache them. Scatter mini-cube decals on a 7-unit jittered grid.
7. Per frame: draw ground chunks → ground overlays → all shadows → y-sorted props/characters → orbiting objects → projectiles → particles → floating numbers → vignette.
8. Add effects as cubes, sparks and squashed square rings; emissive parts get an additive radial glow.
9. Build the HUD with the `.panel` / segmented bar CSS; render HUD icons with the same voxel renderer.
10. Check the result: bright sunny diorama, no outlines, sun from the upper left, blocky shadows to the lower right.

## Code

The starter kit `starter.js` contains the full renderer, the main character, three creature types, props, a voxel ground and a preview scene. The complete reference module is `../../js/styles/voxel.js`. The essential techniques:

**1. Voxel grid and model building**

```js
class Vox { // x = right, y = towards the viewer, z = up; values = colour ids (0 = empty)
  constructor(w, d, h, seed = 1) { this.w = w; this.d = d; this.h = h; this.seed = seed; this.a = new Uint16Array(w * d * h); }
  in(x, y, z) { return x >= 0 && y >= 0 && z >= 0 && x < this.w && y < this.d && z < this.h; }
  get(x, y, z) { return this.in(x, y, z) ? this.a[(z * this.d + y) * this.w + x] : 0; }
  set(x, y, z, c) { x |= 0; y |= 0; z |= 0; if (!this.in(x, y, z)) return this;
    const v = typeof c === 'function' ? c(x, y, z) : c; if (v != null && v >= 0) this.a[(z * this.d + y) * this.w + x] = v; return this; }
  box(x0, y0, z0, x1, y1, z1, c) { for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, z, c); return this; }
  blob(cx, cy, cz, rx, ry, rz, c, p = 2) { // super-ellipsoid
    for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++) for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
        if (Math.abs((x + .5 - cx) / rx) ** p + Math.abs((y + .5 - cy) / ry) ** p + Math.abs((z + .5 - cz) / rz) ** p <= 1) this.set(x, y, z, c);
    return this;
  }
  paintFront(x, z, c) { for (let y = this.d - 1; y >= 0; y--) if (this.get(x, y, z)) return this.set(x, y, z, c); return this; }
}
// Example: small creature body with a noisy purple-over-cream gradient (ids come from C('#9b54d2') etc.)
// m.blob(5, 5, 6.3, 4.7, 4.5, 4.4, (x, y, z) => { const t = z + .5 - 6.3 + (rnd3(x, y, z, 5) - .5) * 1.6;
//   return t > 1.6 ? PURPLE : t > 0.4 ? (rnd3(x, y, z, 3) < .5 ? PURPLE : CREAM) : CREAM; });
```

**2. Projection and face tones**

```js
const PITCH = 46 * Math.PI / 180, SP = Math.sin(PITCH), CP = Math.cos(PITCH);
const FACES = [[1,0,0], [-1,0,0], [0,1,0], [0,-1,0], [0,0,1], [0,0,-1]];
function prep(yaw, ppv) {
  const c = Math.cos(yaw), s = Math.sin(yaw), R = (x, y) => [x * c + y * s, -x * s + y * c];
  const proj = (x, y, z) => { const r = R(x, y); return [r[0] * ppv, (r[1] * SP - z * CP) * ppv]; };
  const ex = 1 + 0.8 / ppv, faces = [];
  for (const n of FACES) {
    const rn = R(n[0], n[1]);
    if (rn[1] * CP + n[2] * SP <= 1e-3) continue;              // facing away from the camera
    const a = n[0] ? 0 : n[1] ? 1 : 2, b = (a + 1) % 3, cc = (a + 2) % 3, fc = proj(n[0] / 2, n[1] / 2, n[2] / 2), pts = [];
    for (const [u, v] of [[-.5, -.5], [.5, -.5], [.5, .5], [-.5, .5]]) {
      const p = [0, 0, 0]; p[a] = n[a] / 2; p[b] = u; p[cc] = v; const q = proj(p[0], p[1], p[2]);
      pts.push(fc[0] + (q[0] - fc[0]) * ex, fc[1] + (q[1] - fc[1]) * ex);   // grown 0.8 px: no seams
    }
    const t1 = [0, 0, 0], t2 = [0, 0, 0]; t1[b] = 1; t2[cc] = 1;
    faces.push({ n, pts, t1, t2, top: n[2] === 1, tone: n[2] === 1 ? 1 : 0.76 - 0.15 * rn[0] }); // sun from screen-left
  }
  return { R, faces };
}
```

**3. Shading one face** (inside the sorted voxel loop of `renderVox`; `j` = per-voxel jitter)

```js
function shadeFace(col, f, m, x, y, z, j) {
  const cc = col.c;                                       // [r, g, b]
  if (col.em) { const k = j * (f.top ? 1.02 : 0.95); return [cc[0] * k, cc[1] * k, cc[2] * k]; }
  const nx = x + f.n[0], ny = y + f.n[1], nz = z + f.n[2];
  let ao = 1;
  for (const t of [f.t1, f.t2]) { if (m.get(nx + t[0], ny + t[1], nz + t[2])) ao -= 0.075; if (m.get(nx - t[0], ny - t[1], nz - t[2])) ao -= 0.075; }
  if (!f.top && z === 0) ao *= 0.9;
  const k = j * f.tone * ao;
  if (f.top) return [cc[0] * k * 1.035, cc[1] * k * 1.015, cc[2] * k * 0.965];   // warm top
  const cool = (1 - f.tone) * 0.45;                                              // cool sides
  return [cc[0] * k * (1 - cool * 0.25), cc[1] * k * (1 - cool * 0.1), cc[2] * k * (1 + cool * 0.5) + cool * 14];
}
// j = 1 + (hash(x, y, z, model.seed) - 0.5) * 2 * col.jit   (jit 0.045 by default)
// draw order: sort exposed voxels by  R(x,y)[1] * CP + (z + 0.5) * SP  ascending, then fill each face quad.
```

**4. Ground step shading** (per pixel; `cm` = this tile, `n` = tile to the north, `fx/fy` = position in the 4-unit tile)

```js
const SIDEC = [[126,85,54], [112,69,43], [92,58,35], [99,100,110], [148,105,63], [58,111,158]]; // grass, leaf, field, stone, path, water
const LIP = [1, 1, 0, 0, 0, 0];
function groundPixel(cm, n, west, fx, fy, edge) {
  let [r, g, b] = cm.c, m = 1;
  if (n.h > cm.h) {
    const band = Math.min(3.5, (n.h - cm.h) * 1.9);
    if (fy < band) {
      if (fy < edge) return [n.c[0] * 1.14 + 6, n.c[1] * 1.14 + 6, n.c[2] * 1.12 + 6];      // lit edge
      if (LIP[n.mat] && fy < 1.05) return [n.c[0] * .8, n.c[1] * .8, n.c[2] * .82];        // grass lip
      const s = SIDEC[n.mat], k = (0.98 - 0.2 * fy / band) * n.sj;                         // side face
      return [s[0] * k, s[1] * k, s[2] * k];
    }
    if (fy < band + 0.9) m *= 0.84;                                                          // contact shadow
  }
  if (west.h > cm.h) m *= fx < 1.5 ? 0.8 : fx < 2 ? 0.9 : 1;                                 // sun from the west
  if (fy > 4 - edge) m *= 0.95; else if (fy < edge) m *= 1.035;                              // tile bevel
  if (fx > 4 - edge) m *= 0.965; else if (fx < edge) m *= 1.015;
  return [r * m, g * m, b * m];
}
```

**5. Square ground ring and cube debris**

```js
const SP = Math.sin(46 * Math.PI / 180);
function drawRing(ctx, x, y, r0, r1, k, color, lw) {          // k = remaining life 1 -> 0
  const t = 1 - k, r = r0 + (r1 - r0) * (1 - (1 - t) * (1 - t));
  ctx.globalAlpha = k * 0.85; ctx.strokeStyle = color; ctx.lineWidth = lw * k + 0.4;
  ctx.strokeRect(x - r, y - r * SP, r * 2, r * 2 * SP); ctx.globalAlpha = 1;
}
// debris: cubeFrames = 6 renderVox() calls of a 1x1x1 grid at yaw k/6 * PI/2 (AO off);
// per particle: z += vz*dt; vz -= 320*dt; drag 1.4; frame = floor(rot * 2) mod 6; drawn at (x, y - z).
```

## Adapting it to your project

- **Keep fixed:** pitch 46°, the tone formula and AO/jitter values, sun from the upper left with shadow shear (0.62, 0.26), voxel size ≈ 2 world units, two baked yaws, no outlines, square rings and cube particles, 4-unit ground tiles with steps.
- **May change:** all colours, as long as each material has 2–4 close shades, tops stay warm and sides cool, and creatures / main character / world keep separate hue families. A winter world: white/blue ground with side colour `#8a9ab0`; a desert: sand tiles with terracotta steps.
- **New characters:** start from the closest existing model size (10×9×18 main character, 10×10×15 small creature, 19×16×25 large creature). One blob body + small limbs; faces via `paintFront`. Robots → `box()` with p≈4 blobs; animals → horizontal blobs with 4 leg columns.
- **Mixing elements:** the voxel characters sit well on any flat, bright ground if you keep the lower-right blocky shadow; the voxel world accepts other characters if they are lit from the upper left and stay saturated.
- **Other camera setups:** for a side view, use pitch ~20° and yaw ±0.3; for an isometric builder, yaw π/4 with all props using the same yaw. Side-scrolling scenes can bake more yaws (8) for turning.
- **Other resolutions:** recompute `K`/`PPV` from the screen height and re-bake; never upscale baked sprites by more than ~1.2×.
- **Night or interiors:** lower all base colours by ~30% and add more emissive voxels + glow sprites instead of changing the renderer.

## Performance notes

- Baking cost scales with exposed voxels × visible faces × frames × yaws. The reference module bakes 5×2 main-character frames, 3 creature types × 4 × 2, spin sets, ~15 props and ~40 debris-cube sets in a few hundred ms.
- Per frame everything is `drawImage` of cached canvases: a creature costs 2–3 blits (shadow, sprite, optional flash/glow). Crowds of 300+ figures are fine.
- Cache tinted copies (impact flash, red tint, speed trail) per frame+colour on first use.
- Ground chunks (256 units) are rendered per pixel with several noise calls per tile — run it as a generator spread over frames (~5 ms budget) and keep ~90 chunks cached. Cap the ground resolution (`groundResMax` 2.5 px/unit).
- Shadow blur uses `ctx.filter`; it runs only at bake time.
- `starter.js` bakes everything on the first call (~100 ms) and then draws a frame in about 1 ms.

## Copy-paste prompt

```text
Use the Voxel Cube World art style for my project: a MagicaVoxel look in Canvas 2D, no image assets.
- Every character, prop, collectible, particle and HUD icon is a 3D voxel grid (Uint16Array, x right, y toward viewer, z up)
  built with box(), blob() (super-ellipsoid) and paintFront() for faces. One voxel = ~2 world units; 360 units on screen vertically.
- At init bake each grid to sprites with a software renderer: rotate by yaw (characters ±0.6 rad, 2 facings, never mirror),
  orthographic projection with 46° pitch (sx = R.x*ppv, sy = (R.y*sin46 - z*cos46)*ppv), painter's sort by R.y*cos46 + z*sin46.
- Face tones: top 1.0 (warmed), sides 0.76 - 0.15*R(n).x (sun from the upper left), sides cooled toward blue,
  per-voxel jitter ±4.5%, AO -7.5% per solid neighbour around each face. Emissive voxels (glowing faces) skip shading.
- No outlines ever. Carved faces get a dark rim of voxels. Glow = additive radial sprite.
- Blocky shadows: voxel footprints sheared (0.62, 0.26) per unit height to the lower right, blurred, alpha 0.42.
- Ground: flat 4x4-unit voxel tiles (grass #6da548, stone #94949a, path #cfa86e, field #8e5d3a, water #4aa6dc), 2-4 shades each,
  heights -1..2; a higher tile shows a 1.9-unit side face band + lit edge, small mini-cube decals (tufts, flowers, pebbles).
- Props (autumn trees, pines, pumpkins, hay, crates, lamp posts) use the same voxel size and sun, one fixed yaw each.
- Walk cycles: 4 frames made by shifting legs ±1 voxel and lifting the body 1 voxel. Collectibles spin through 8 baked yaws.
- Effects: tumbling 1-voxel cube debris in the object's colours, squashed SQUARE rings, white silhouette impact flash.
- Bright saturated autumn palette, purple radial vignette. HUD: #2b2446 slabs with 3px #151024 edge + hard bevel,
  segmented bars with 3 hard colour bands, Bungee numbers with stacked hard drop shadows, Chakra Petch labels.
```
