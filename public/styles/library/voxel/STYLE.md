# Voxel Cube World — Game Art Style Spec

> A bright MagicaVoxel-style miniature world: every actor is a real 3D cube grid, baked to sprites under one warm afternoon sun.

Characters, props, pickups, particles and even HUD icons are small 3D voxel grids. A tiny software voxel renderer (about 100 lines) turns each grid into sprites once at startup: 3/4 orthographic view with a 46° pitch, three face tones, per-voxel colour jitter, neighbour ambient occlusion and a painter's sort. The ground is a flat field of 4×4-unit voxel tiles with one-voxel height steps that show their side faces and a lit edge, and everything casts a blocky, slightly blurred sun shadow to the lower right. The result reads like a tabletop toy diorama: saturated autumn colours, chunky shapes, no outlines. In the reference game (*Jack vs. the Turnip Ancestors*) the hero is a pumpkin-headed boy, the enemies are turnips, ghosts and a giant turnip brute.

## At a glance

| | |
| --- | --- |
| Family | 3D Look · Voxel |
| Mood | cheerful, toy-like, cozy, crisp, sunny |
| Best for | top-down survivor / arena games, farming sims, tactics, roguelikes, builder/puzzle games |
| Renderer | Canvas 2D + built-in software voxel renderer (sprites baked at init) |
| Pixel art | No — native resolution, blits snapped to whole screen pixels |
| Difficulty | 3/10 |
| Fonts | Bungee (numbers, titles), Chakra Petch 500/600/700 (labels) |
| Key colours | `#6da548` grass · `#94949a` stone · `#cfa86e` path · `#f7842a` pumpkin · `#ffd84a` glow · `#9b54d2` enemy purple · `#2b2446` HUD panel |

## When to use it

- **Good fits:** top-down or 3/4 arena games, survivors, farming/village sims, tactics, roguelikes, casual mobile games. Anything with many small readable actors on a tile-like world.
- **Good fit for AI-built games:** a new enemy is just a 3D grid of cubes described with `box()`/`blob()` calls; lighting, AO and shadows come for free from the renderer. Very consistent output.
- **Bad fits:** dark horror (the look depends on bright sun), smooth organic or realistic characters, games whose camera must rotate freely (sprites are baked for a fixed pitch and 2 yaws).
- **Bad fit:** huge bosses with many frames at high resolution — bake time and memory grow with voxel count × frames × yaws.

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
| Pumpkin | `#f7842a` | Hero head / pumpkins; ribs `#e86f22`, top `#fb9036`, carved rim `#8a3412`, stem `#5b7a2a` |
| Carved Glow | `#ffd84a` | Emissive face; hot `#fff1a2`, mouth `#ffc23a` |
| Night Cloak | `#36325f` | Hero clothes; `#27234a` hem, `#4c4787` light, shirt `#efe2c4`, pants `#5b4232`, boots `#2c221e` |
| Teal Scarf | `#22b8a2` | Hero accent; dark `#178c7c` |
| Turnip Purple | `#9b54d2` | Small enemy top; `#7a3db2`, `#b672e2`, brows `#3a1a50` |
| Turnip Cream | `#f4e9cc` | Small enemy belly; `#ddcfa8`, roots `#c9a46c`, leaves `#5fbe3b`/`#3e8f2b`, eyes `#ff4a2c` (emissive) |
| Ghost White | `#f6faff` | Fast enemy; `#dfe9f8`, `#b8d6f3`, tail `#94bfea`, holes `#1c2044` |
| Brute Plum | `#6c3e88` | Brute top; `#54306b`, `#81509e`, roots `#946a42`/`#6f4b2d`, cracks `#ff9a2a`/`#ffd36a`, eyes `#ffef8a` |
| Gem Mint | `#5df0b6` | XP gems; `#b6ffe0`, `#2fc596`; big gems gold `#ffc43a #fff0a0 #e8932a` |
| Pine Green | `#2f6e4c` | Pines (`#255a3e`, `#3d8659`); autumn crowns orange `#f08a2c`, red `#df4c34`, yellow `#f0c03e` |
| HUD Panel | `#2b2446` | Panels and cards |
| HUD Edge | `#151024` | Panel border, drop edge, text shadows |
| HUD Gold | `#ffc23e` | Titles, timer, crit numbers |

**Palette rules**

- Only bright, saturated mid-tones in the world. No pure black; the darkest world colours are carved holes (`#1c2044`, `#24122c`, `#2c221e`).
- Every material uses 2–4 close shades chosen per voxel with a hash (`rnd3(x,y,z,seed)`), never one flat colour.
- Light shifts hue: sunlit tops warmer (r×1.035, b×0.965), shadow sides cooler and bluer.
- Only emissive voxels glow (faces, cracks, eyes, lamps), always yellow/orange/red, always with an additive glow sprite.
- Enemies purple/white, hero orange + navy + teal, world green/grey/brown/blue — each layer owns its hue range.
- The UI lives in its own dark-purple family so it never blends with the bright world.

## Typography

**Bungee** 400 — HUD numbers, timer, titles, card names, floating damage numbers. https://fonts.google.com/specimen/Bungee

```css
.timer   { font: 400 34px/1.05 'Bungee', 'Chakra Petch', system-ui, sans-serif; color: #ffc23e; letter-spacing: 2px;
           text-shadow: 0 2px 0 #d9741c, 0 4px 0 #a2470f, 0 6px 0 #151024; }
.title   { font: 400 64px/1 'Bungee', sans-serif; color: #ffc23e; letter-spacing: 3px;
           text-shadow: 0 3px 0 #e8801e, 0 6px 0 #c55a12, 0 9px 0 #8a3a0c, 0 12px 0 #151024, 0 20px 26px rgba(0,0,0,.45); }
.counter { font: 400 24px/1 'Bungee', sans-serif; color: #fff; text-shadow: 0 3px 0 #151024; }
```

**Chakra Petch** 500/600/700 — labels, descriptions, hints. https://fonts.google.com/specimen/Chakra+Petch

```css
.label { font: 700 11px/1 'Chakra Petch', system-ui, sans-serif; color: #b7a9e6; letter-spacing: 3px; }
.desc  { font: 600 15px/1.3 'Chakra Petch', system-ui, sans-serif; color: #ddd4f6; }
```

Text effects: titles are "extruded" with 3–4 stacked hard `text-shadow`s stepping down 3 px each through darker oranges into `#151024` — never blurred glows. Small white numbers get a 2–3 px hard shadow below in `#151024`. In-world damage numbers (canvas): Bungee 7 units (crit 9 units + "!"), shadow copy offset (+0.3, +1.0) in `#1a1028` (crit `#5a200a`), fill `#ffffff` (crit `#ffc23e`).

## Rendering technique

The core is a voxel grid + a sprite baker. Coordinates: voxel `x` = right, `y` = toward the viewer (front), `z` = up. A grid is a `Uint16Array(w*d*h)` of colour ids (0 = empty).

1. **Scale.** `K = clamp(round(screenH/360*4)/4, 1.5, 4)` sprite px per world unit; `PPV = max(3, round(K*1.9))` sprite px per voxel; `VW = PPV/K` ≈ 1.9–2 world units per voxel.
2. **Colours.** `C(hex, {em, jit})` registers a colour id with optional emissive flag and per-voxel jitter (default 0.045).
3. **Models.** Built with `box(x0,y0,z0,x1,y1,z1,c)`, `blob(cx,cy,cz,rx,ry,rz,c,p)` (super-ellipsoid; p=2 ellipsoid, p≈2.6 soft-box, p=3–4 rounded box), `set()`, `paintFront(x,z,c)` (paint the front-most voxel of a column — faces, cracks) and `recolor()`. A colour argument may be a function `(x,y,z) => id` for gradients and random speckle.
4. **Projection** (`prep(yaw, ppv)`): rotate around z: `R(x,y) = [x·cos+y·sin, −x·sin+y·cos]`; screen `sx = R.x·ppv`, `sy = (R.y·sin46° − z·cos46°)·ppv`. `SP = sin46° = 0.719` (ground depth factor), `CP = cos46° = 0.695` (height factor). A face is visible when `R(n).y·CP + n.z·SP > 0`. Face quads are grown by `1 + 0.8/ppv` to hide seams.
5. **Face tones (the light).** Top = 1.0. Sides: `tone = 0.76 − 0.15 · R(n).x`. With yaw +0.6 the visible faces are top (1.0), the −x face pointing screen-left (0.884) and the +y face pointing screen-right (0.675); with yaw −0.6 it's +y left (0.845) and +x right (0.636). So the sun always comes from the upper left.
6. **Colour per face:** `k = jitter · tone · ao`, `jitter = 1 ± jit` from a hash of (x,y,z,seed). AO: each solid voxel next to the open face along its two tangents subtracts 0.075; side faces at z=0 ×0.9. Tops: `r·k·1.035, g·k·1.015, b·k·0.965`. Sides: `cool = (1−tone)·0.45`; `r·k·(1−cool·0.25), g·k·(1−cool·0.1), b·k·(1+cool·0.5) + cool·14`. Emissive voxels ignore light: `k = jitter·(top ? 1.02 : 0.95)`.
7. **Sort and fill.** Collect exposed voxels, sort by depth `R.y·CP + z·SP` ascending, fill each visible face as a 4-point path. The sprite's anchor is the footprint centre at z=0.
8. **Shadows** (`renderShadow`): for each surface voxel push its footprint quad at height z and z+1 sheared by `(z·0.62, z·0.26)` units, fill black, draw at alpha 0.62 with `blur(0.16·PPV px)`, plus a 0.55-alpha contact layer for voxels with z ≤ 1.5. Drawn under actors at alpha 0.42.
9. **Bake list:** hero 5 frames × 2 yaws (±0.6), each enemy 4 frames × 2 yaws, pickups/lanterns as 6–8-frame spin sets (`yaw = i/n · π/2 + 0.2`; a quarter turn suffices for 4-fold symmetric models), props at one fixed yaw (0–0.6), debris cubes 1×1×1 in 6 yaws at `2K` px per unit with AO off.
10. **Per frame:** blit ground chunks → water glints + hero light pool → shadows of all actors/props → y-sorted props/enemies/hero → orbitals → projectiles → particles → damage numbers → vignette. Blits are snapped: `round(x·S − ax·S/K)/S`.

## Background and ground

- **Tiles:** the world is a grid of 4×4-unit cells. `cellMat(i,j)` is a pure function of the cell index returning `{mat, h}`: GRASS h1 (h2 in raised clumps where `fbm(x/230) > 0.655`), LEAF h1/h2, FIELD h0, STONE h1, PATH h0, WATER h−1. Large regions come from domain-warped fbm (scales 820–1050 units), ponds from fbm at 560, paths from `|perlin(x/430)| < 0.034` — zero-crossing lines become winding paths. Region borders get clustered jitter (`noise(x/15)`) so edges are chunky, not smooth.
- **Colour per tile:** pick from the material's shade list with `noise(x/44)·0.85 + hash·0.3 − 0.1`; field rows alternate `#8e5d3a`/`#7b4f31` by `j & 1` (furrows); stone tiles become moss `#82905f` in patches; raised tiles ×1.05; whole world ×(0.95 + 0.1·noise(x/620)).
- **Per-pixel pass** (fy, fx = position inside the tile in units, `edge = max(0.42, 1/res)`):
  - if the north tile is higher: band `= min(3.5, Δh·1.9)` units. Inside it: `fy < edge` → north colour ×1.14 + 6 (lit edge); grass/leaf lip `fy < 1.05` → north colour ×0.8; else side colour `SIDEC[mat] · (0.98 − 0.2·fy/band) · sideJitter(0.94–1.04)`. Just below the band (0.9 units) ×0.84 contact shadow.
  - a higher west tile casts sun shadow: `fx < 1.5` ×0.8, `fx < 2` ×0.9.
  - tile bevel: top edge ×1.035, bottom ×0.95, left ×1.015, right ×0.965; stone joints bottom/right ×0.86, top/left ×1.05.
- **Decals** on a 7-unit jittered grid, positions snapped to 0.5 units, skipped inside step bands. All are "mini cubes": `mini(x,y,s,h,top,side)` = shadow rect `rgba(30,40,20,.22)` + side rect height `h·CP` + top rect depth `s·SP`. Grass: 38% tufts (2–4 blades 0.8 wide, 1.2–2.8 tall, `#8acb57/#5f9a3a`), 9% flowers (white/yellow/red/violet/pink heads 1.6 wide on a 1.6-tall stem), 3% pebbles. Leaf floor: flat 1.6×1.1 leaves in `#f08a2c #e05a2e #f2b23e #c94a2c #e8702a` with a shadow offset (0.4, 0.4). Field: sprouts. Stone: pebbles, moss, little L-shaped cracks `rgba(70,72,82,.55)`. Water: lily pads, reeds at shores.
- **Animated:** 16% of water tiles get a glint (1.8×0.55 + 0.6×0.6 rects `#e8f8ff`) shown when `sin(t·1.7 + phase) > 0.55`.

## Characters

The hero is a 10×9×18-voxel grid (≈ 20 × 18 × 36 world units, ~30 units tall on screen):

- **Legs:** two 2×2 columns at x 3–4 and 5–6, z 0–2, `#5b4232` with a boot voxel `#2c221e` at the bottom.
- **Body (cloak):** z = 3: 8×6 hem slab with a darker border `#27234a`; z 4–6: 6×5 torso `#36325f`, a 2-voxel lighter front panel `#4c4787` with a shirt collar `#efe2c4`; arms are 1-voxel columns at x=1 and x=8 with glove voxels `#7d5634`.
- **Scarf:** a full ring at z = 7 (teal `#22b8a2`, every 3rd voxel `#178c7c`) plus a 2-voxel tail hanging at the back.
- **Head:** `blob(5, 4.5, hz=b+8.6, 5.05, 4.4, 3.75, p=2.6)` — a soft-box pumpkin. Ribs: `cos(atan2(y,x)·5) > 0.55` → `#e86f22`, top layers `#fb9036`. Stem 2 voxels `#5b7a2a`, 3 leaf voxels `#7cc24a`.
- **Face:** a list of (x,z) pixels painted with `paintFront`: two triangular eyes (3 + 1 voxel), a 5-wide jagged mouth over two rows. Eyes `#ffd84a`, mouth `#ffc23a`, eye centres `#fff1a2` — all emissive. Every 4-neighbour of a face pixel that isn't itself a face pixel is painted `#8a3412` (dark carved rim) — this replaces an outline.
- **Animation frames:** f0 idle, f1–f4 walk. `legY = [0,1,0,−1,0]` shifts legs ±1 voxel in y, `lift = [0,0,1,0,1]` raises body and head by 1 voxel on passing frames, one boot is raised 1 voxel on f2/f4, arms counter-swing (`armY = −legY`).
- **Facing:** baked twice, yaw +0.6 (right) and −0.6 (left). Never mirror the sprite — the light would flip.
- **Glow:** an additive warm glow sprite 22×18 units over the face (alpha 0.34 ± 0.06, sin t·9) and a 60×30 warm light pool on the ground at alpha 0.14.

## Enemies and props

- **Small melee enemy** (turnip, 10×10×15): one `blob(5,5,cz,4.7,4.5,4.4)` with a noisy vertical gradient: top purple (`#9b54d2`, 18% `#b672e2` speckle, crown `#7a3db2`), a 50/50 mixed band, cream belly `#f4e9cc`/`#ddcfa8`. Two 1-voxel root legs, a leaf tuft of 3 small boxes that sways ±1 voxel per frame. Face: 2 emissive red eyes `#ff4a2c`, a 4-wide brow and 2-voxel mouth `#3a1a50`.
- **Fast enemy** (ghost, 11×9×15): head `blob(5.5,4.5,10.2, 4.4,3.7,3.9)` white with frost speckle, a tail of 7 stacked thin discs shrinking and swaying downward (`#dfe9f8` → `#b8d6f3` → `#94bfea`), 2×3 arm slabs. Hollow 2×2 eyes and an O-mouth in `#1c2044`. Floats 2.5 ± 1.5 units, alpha 0.84, shadow alpha 0.22.
- **Brute** (19×16×25): big `blob(9.5,8,12.5, 7.6,6.6,8.4, p=2.4)` purple top / brown root bottom, 4×4 stump legs, 3-wide arm columns with brown fists, a leaf crown, 3 vertical emissive crack lines alternating `#ff9a2a`/`#ffd36a`, 4 pale emissive eyes `#ffef8a` under a dark brow. Plus an additive orange glow (30×26 units) over the chest.
- **Pickups:** gem = stepped octahedron (5×5×7; per layer a diamond `|x−c|+|y−c| ≤ r`), mint top half, dark bottom half; big variant 7×7×10 in gold. Spin set of 8.
- **Orbiting lantern:** small 8×8×11 turnip with an emissive carved face, spin set of 8 at 0.85·PPV.
- **Props** (fixed yaw 0–0.6, own shadows, y-sorted with actors): deciduous tree 15×15×24 (3×3 trunk, crown = one big p=3.2 blob + 4 random p=3 blobs + a top blob, three autumn colour sets); pine 13×13×25 (5 stacked tiers of p=2.6 discs shrinking upward); pumpkin 8×8×8 / 11×11×10 (optionally carved and glowing); hay bale (p=3 blob); crate 6×6×6 (darker edges where ≥2 coordinates are on the border); gravestone 7×3×10 with an engraved cross; lamp post 5×5×15 with emissive glass; fence 13×1×6; bush with 7% red berry voxels; mossy rock; mushroom.
- **Readability:** tall props (trees) drop to alpha 0.45 when the hero walks behind them. Props avoid steps, water and paths (they're only placed where the tile and the tile to the south have the same material and height).

## Effects and particles

- **Cube debris** — the signature effect. Hit: 2–3 cubes (size 1.6, speed 50, life 0.5 s, vz 60). Kill: 14 cubes (size 2.3, speed 70, vz 110, life 1.1 s); brute: 34 cubes (size 3.6, vz 140, spread 24) + ring + 8 sparks + screen shake 4. Ghost kill: 10 cubes with negative gravity (−30) that float up. Physics: gravity 320, drag 1.4, tumble = frame `floor(rot·2) mod 6`, small dark square shadow when z ≤ 0.5, fade over the last 30% of life. Colours = the victim's palette (e.g. `#9b54d2 #7a3db2 #f4e9cc #ddcfa8 #5fbe3b #b672e2`).
- **Sparks:** plain squares 1.4–2.4 units (`#ffffff`, `#ffd27a`), drag 4, life ~0.3 s.
- **Rings:** `strokeRect(x−r, y−r·SP, 2r, 2r·SP)` — square, squashed to the ground plane. Radius 8→54 (level-up `#ffd84a`), 10→48 (brute death `#fff1c8`), easing outQuad, width `lw·k + 0.4`.
- **Projectiles:** spinning voxel seed + 3 trailing squares; no glow.
- **Spawn:** enemy sprite revealed bottom-up in whole voxel layers (`PPV·CP` px steps, outQuad) with 4 dirt cubes (`#8c5b37 #a87a4c #6fae46`) hopping around.
- **Hit flash:** white silhouette at alpha `min(0.58, flash·0.8)`. Hero hurt: red `#ff4a3a` silhouette; invulnerability blinks alpha 0.5/1 at 18 Hz.
- **Death:** squash x `1+0.35t`, y `1−0.6t` over 0.28 s with white overlay `0.6·(1−t)`, then cube burst.
- **Dash:** 3 orange (`#ffb347`) silhouette ghosts 6 units apart at alpha 0.17·(4−i) + 6 dust cubes.
- **Pickup:** 2–5 tiny mint/gold sparks.

## Lighting, shadows and post-processing

- **One sun** from the upper left, baked into face tones and into shadow shear (0.62, 0.26 per unit height). There is no runtime lighting of sprites.
- **Shadows:** baked per model; actors 0.42 alpha, props 0.40, ghosts 0.22; small pickups/orbitals/projectiles use a flat dark `#1d2a14` rectangle at 0.22–0.28 alpha instead.
- **Glows:** a 64 px radial gradient sprite (stops 0 → 0.9, 0.35 → 0.35, 1 → 0 alpha) in warm `rgb(255,190,80)`, mint `rgb(120,255,200)`, gold `rgb(255,200,80)` or hot `rgb(255,150,50)`, drawn with `globalCompositeOperation = 'lighter'`.
- **Ground light:** only a 60×30 warm pool under the hero (alpha 0.14) and glints on water.
- **Vignette** (screen space, a 320×180 canvas stretched): radial gradient centred at (w/2, 0.48h), inner radius 0.32h, outer 0.62w; stops `rgba(30,20,60,0)` → 0.6: `rgba(30,20,60,.12)` → 1: `rgba(24,14,50,.42)`. Plus a vertical warm wash `rgba(255,236,190,.10)` at the top fading out by 35%.
- No bloom pass, no colour grading, no film grain.

## UI and HUD

Flat dark-purple slabs that look like a chunky block: hard bevel insets, a 3 px near-black edge and a 6 px hard drop edge. Bars are segmented every 18 px and have three hard colour bands. Icons are the game's own voxel models rendered at icon size (ppv fitted to 84% of the box, floored when ≥ 2.5) with a dark offset silhouette shadow. Cards sit on a two-tone background (`#3d335f` top 52%, `#30284c` below), icon wells use a 24 px checker `#251e3c/#2c2447`, number keys are gold split buttons. Hovered cards lift by 8 px.

```css
:root { --panel: #2b2446; --edge: #151024; --gold: #ffc23e; }
.panel {
  background: var(--panel); border-radius: 3px; padding: 7px 14px; color: #fff;
  font: 600 15px/1.3 'Chakra Petch', system-ui, sans-serif;
  box-shadow: inset 0 3px 0 rgba(255,255,255,.16), inset 3px 0 0 rgba(255,255,255,.07),
              inset 0 -4px 0 rgba(0,0,0,.38), inset -3px 0 0 rgba(0,0,0,.22),
              0 0 0 3px var(--edge), 0 6px 0 3px var(--edge), 0 10px 18px rgba(10,6,24,.35);
}
.hp-bar { width: 216px; height: 22px; background: #160f22; border-radius: 2px; overflow: hidden;
  box-shadow: inset 0 3px 0 rgba(0,0,0,.55), 0 0 0 2px #0e0a18; }
.hp-bar > i { display: block; height: 100%;
  background: repeating-linear-gradient(90deg, rgba(0,0,0,0) 0 15px, rgba(50,8,16,.8) 15px 18px),
              linear-gradient(180deg, #ffb09a 0 22%, #f0443a 22% 70%, #b3242a 70% 100%); }
.xp-bar > i { display: block; height: 100%;
  background: repeating-linear-gradient(90deg, rgba(0,0,0,0) 0 15px, rgba(16,40,40,.75) 15px 18px),
              linear-gradient(180deg, #c8ffee 0 20%, #57e6b4 20% 68%, #26a888 68% 100%); }
.timer { font: 400 34px/1.05 'Bungee', sans-serif; color: var(--gold); letter-spacing: 2px;
  text-shadow: 0 2px 0 #d9741c, 0 4px 0 #a2470f, 0 6px 0 var(--edge); }
.key { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 2px;
  font: 400 15px/1 'Bungee', sans-serif; color: #2b1a0c; background: linear-gradient(180deg, #ffd36a 0 50%, #f3a13a 50%);
  box-shadow: inset 0 -3px 0 rgba(0,0,0,.25), 0 0 0 2px var(--edge); }
.overlay { background: radial-gradient(ellipse at 50% 45%, rgba(40,30,80,.35), rgba(16,10,34,.78)); }
```

## Motion and animation

- Frame-stepped: hero walk frame `1 + (floor(anim·1.6) & 3)`, small enemy `floor(anim·1.8) & 3`, brute `floor(anim·1.3) & 3`, ghost `floor(t·6 + seed·4) & 3`.
- Idle hero hops `max(0, sin(t·2.6))·0.6` units; the ghost floats `2.5 + sin(t·2.8 + seed·20)·1.5`.
- Pickups: frame `floor((t·1.6 + seed·7)·8) mod 8`, hover `2.4 + sin(t·3 + seed·10)·0.9`; collect pop hop `sin(pop·π)·9`.
- Orbital lanterns: spin frame derived from the orbit angle (`angle/(π/2)·8`), hover `9 + sin(t·4 + i·1.7)·1.2`.
- Positions snap to screen pixels; sprites are never smoothly rotated. Only particles and the death squash scale.
- Flicker: glows ±0.02–0.12 alpha at 4–11 rad/s.
- Damage numbers: scale 0.6 → 1.15 in the first 12% of life, then down to 1.0; alpha `clamp(life·3)`.

## Do and don't

**Do**

- Model everything (props, pickups, particles, icons) as voxel grids and run them through the same renderer.
- Keep one voxel ≈ 2 world units; hero ≈ 10 voxels wide, small enemies ≈ 10, brutes ≈ 19.
- Bake two yaws (±0.6 rad) per character instead of mirroring.
- Use 2–4 hashed shades per material plus the ±4.5% per-voxel jitter and AO.
- Paint faces onto the front-most voxels; surround glowing faces with a dark carved rim.
- Give every object the sheared blocky sun shadow to the lower right.
- Build the ground from 4×4-unit tiles with visible 1-voxel steps and lit edges.

**Don't**

- Don't draw outlines or black strokes.
- Don't use smooth gradients or round vector shapes on actors (only glows and the vignette are soft).
- Don't rotate or scale baked sprites at runtime — bake another yaw/frame.
- Don't mix voxel sizes in one scene.
- Don't use round rings or round particles — use squashed square rings and cubes.
- Don't light from more than one direction or darken the world for night scenes.
- Don't use dull, desaturated colours for the world.

## Implementation recipe

1. Copy `starter.js`'s `Vox`, `C()`, `prep()`, `renderVox()`, `renderShadow()` and `blit()` into your project. Keep the constants: pitch 46°, `SHX 0.62`, `SHY 0.26`, tone formula `0.76 − 0.15·R(n).x`, AO 0.075, jitter 0.045.
2. Decide the world scale: 360 world units visible vertically; compute `K` and `PPV = max(3, round(K·1.9))` from the screen height at startup.
3. Register your palette with `C()`; mark glowing colours `{ em: 1 }`. Give each material 2–4 shades.
4. Write one builder function per actor `model(frame) → Vox`: start with `blob()` for bodies (p 2–2.6), `box()` for limbs, `paintFront()` for faces. Make animation by shifting legs/arms by ±1 voxel per frame (4 walk frames).
5. At init, bake every actor: frames × yaw ±0.6, plus one shadow per yaw. Bake pickups as 8-frame spin sets, props at a fixed yaw, and 1-voxel debris cubes in 6 yaws per palette colour.
6. Build the ground: a pure `cellMat(i,j)` (material + height) on a 4-unit grid, per-tile colour pick, then the per-pixel pass for steps (lit edge, lip, side band, contact shadow, west shadow, tile bevel). Render in chunks (e.g. 256 units) and cache them. Scatter mini-cube decals on a 7-unit jittered grid.
7. Per frame: draw ground chunks → ground overlays → all shadows → y-sorted props/actors → orbitals → projectiles → particles → numbers → vignette.
8. Add effects as cubes, sparks and squashed square rings; emissive parts get an additive radial glow.
9. Build the HUD with the `.panel` / segmented bar CSS; render HUD icons with the same voxel renderer.
10. Compare against the reference screenshots: bright sunny diorama, no outlines, sun from the upper left, blocky shadows to the lower right.

## Code

The starter kit `starter.js` contains the full renderer, the hero, three enemy types, props, a voxel ground and a preview scene. The complete reference module is `../../js/styles/voxel.js`. The essential techniques:

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
// Example: small enemy body with a noisy purple-over-cream gradient (ids come from C('#9b54d2') etc.)
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

## Adapting it to your game

- **Keep fixed:** pitch 46°, the tone formula and AO/jitter values, sun from the upper left with shadow shear (0.62, 0.26), voxel size ≈ 2 world units, two baked yaws, no outlines, square rings and cube particles, 4-unit ground tiles with steps.
- **May change:** all colours, as long as each material has 2–4 close shades, tops stay warm and sides cool, and enemies/hero/world keep separate hue families. A winter world: white/blue ground with side colour `#8a9ab0`; a desert: sand tiles with terracotta steps.
- **New characters:** start from the closest existing model size (10×9×18 hero, 10×10×15 small, 19×16×25 brute). One blob body + small limbs; faces via `paintFront`. Robots → `box()` with p≈4 blobs; animals → horizontal blobs with 4 leg columns.
- **Other genres:** for a side view, use pitch ~20° and yaw ±0.3; for an isometric builder, yaw π/4 with all props using the same yaw. Platformers can bake more yaws (8) for turning.
- **Other resolutions:** recompute `K`/`PPV` from the screen height and re-bake; never upscale baked sprites by more than ~1.2×.
- **Night or interiors:** lower all base colours by ~30% and add more emissive voxels + glow sprites instead of changing the renderer.

## Performance notes

- Baking cost scales with exposed voxels × visible faces × frames × yaws. The reference bakes ~5×2 hero frames, 3 enemy types × 4 × 2, spin sets, ~15 props and ~40 debris-cube sets in a few hundred ms.
- Per frame everything is `drawImage` of cached canvases: an enemy costs 2–3 blits (shadow, sprite, optional flash/glow). Hordes of 300+ are fine.
- Cache tinted copies (hit flash, hurt, dash) per frame+colour on first use.
- Ground chunks (256 units) are rendered per pixel with several noise calls per tile — run it as a generator spread over frames (~5 ms budget) and keep ~90 chunks cached. Cap the ground resolution (`groundResMax` 2.5 px/unit).
- Shadow blur uses `ctx.filter`; it runs only at bake time.
- `starter.js` bakes everything on the first call (~100 ms) and then draws a frame in about 1 ms.

## Copy-paste prompt

```text
Build my game <X> in the "Voxel Cube World" style (MagicaVoxel look, Canvas 2D, no image assets):
- Every character, prop, pickup, particle and HUD icon is a 3D voxel grid (Uint16Array, x right, y toward viewer, z up)
  built with box(), blob() (super-ellipsoid) and paintFront() for faces. One voxel = ~2 world units; 360 units on screen vertically.
- At init bake each grid to sprites with a software renderer: rotate by yaw (characters ±0.6 rad, 2 facings, never mirror),
  orthographic projection with 46° pitch (sx = R.x*ppv, sy = (R.y*sin46 - z*cos46)*ppv), painter's sort by R.y*cos46 + z*sin46.
- Face tones: top 1.0 (warmed), sides 0.76 - 0.15*R(n).x (sun from the upper left), sides cooled toward blue,
  per-voxel jitter ±4.5%, AO -7.5% per solid neighbour around each face. Emissive voxels (glowing faces) skip shading.
- No outlines ever. Carved faces get a dark rim of voxels. Glow = additive radial sprite.
- Blocky shadows: voxel footprints sheared (0.62, 0.26) per unit height to the lower right, blurred, alpha 0.42.
- Ground: flat 4x4-unit voxel tiles (grass #6da548, stone #94949a, path #cfa86e, field #8e5d3a, water #4aa6dc), 2-4 shades each,
  heights -1..2; a higher tile shows a 1.9-unit side face band + lit edge, small mini-cube decals (tufts, flowers, pebbles).
- Walk cycles: 4 frames made by shifting legs ±1 voxel and lifting the body 1 voxel. Pickups spin through 8 baked yaws.
- Effects: tumbling 1-voxel cube debris in the victim's colours, squashed SQUARE rings, white silhouette hit flash.
- Bright saturated autumn palette, purple radial vignette. HUD: #2b2446 slabs with 3px #151024 edge + hard bevel,
  segmented bars with 3 hard colour bands, Bungee numbers with stacked hard drop shadows, Chakra Petch labels.
```
