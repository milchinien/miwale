# Low-Poly Diorama — Game Art Style Spec

> A toy-like autumn miniature world of flat-shaded triangle facets in soft afternoon light, with tilt-shift blur at the screen edges.

Every character, prop, pickup and ground tile is a real triangle mesh, projected with a fixed 44° three-quarter orthographic camera and flat-shaded by one warm sun plus a cool-sky / warm-ground ambient. The meshes are pre-rendered into sprite canvases (16 yaw angles × a few animation frames), so the game reads as 3D but costs like 2D. The ground is a jittered triangle lattice lit from a tiny height field — the signature faceted meadow. Soft indigo cast shadows, glowing carved faces and a tilt-shift band at the top and bottom make the scene look like a photographed tabletop diorama.

## At a glance

| | |
| --- | --- |
| Family | 3D Look · Low Poly |
| Mood | cozy, toy-like, sunny, autumnal, playful |
| Best for | top-down survivor / horde games, cozy farming sims, tactics maps, casual adventure, idle builders |
| Renderer | Canvas 2D + a ~300-line software 3D pipeline (mesh → yaw → ortho projection → flat shading → painter's sort → baked sprite) |
| Pixel art | No — native resolution, sprites baked at 2–4 px per world unit |
| Difficulty | 5/10 — triangle meshes by coordinates are fiddlier than voxels, but predictable once learned |
| Fonts | Baloo 2 (600/700/800), Nunito (600–900) |
| Key colours | meadow `#9cb876`, leaf litter `#c98e57`, pumpkin `#f48a2c`, turnip lilac `#a77ccf`, cape `#4b68a3`, glow `#ffc43a`, shadow `#2c3263` |

## When to use it

- **Good fit:** top-down or 3/4 games with many units (survivors, RTS, tactics, farming, town builders). Pre-rendered mesh sprites give real 3D readability at 2D cost.
- **Good fit:** cozy / family / casual tone — the toy-like proportions, warm sun and pastel palette are friendly by default.
- **Good fit:** games where facing matters — 16 baked yaw angles make direction obvious.
- **Bad fit:** horror, grit, realism — the pastel diorama look fights tension.
- **Bad fit:** side-scrollers and precise platformers — the 44° camera and soft shadows assume a ground plane seen from above.
- **Bad fit:** hundreds of *unique* animated models — every new model is code (coordinates), and every animation frame multiplies bake time by 16 yaws.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Meadow | `#9cb876` | Grass ground (variants `#95b16f` `#a3bd7d` `#99b572`), ~55 % of the screen |
| Leaf Litter | `#c98e57` | Autumn forest floor (variants `#bf824f` `#cf9c5d` `#c08a55`) |
| Sand Path | `#e2cb9c` | Sand / farm yard (variants `#dbc392` `#e6d2a6` `#dfc797`) |
| Rock ground | `#c2b49c` | Rocky biome (`#b8aa92` `#c9bca5` `#bcae97`), 18 % facets mossy `#98aa78` |
| Field soil | `#ab805d` | Ploughed fields (`#a47a59` `#b08662` `#a87d5b`) |
| Pumpkin | `#f48a2c` | Hero head, pumpkin props — the main warm accent |
| Pumpkin Rib | `#e27526` | Alternating rib colour |
| Carved Glow | `#ffc43a` | Emissive carved faces; hot core `#fff1a6`, rim `#6e2e10` |
| Cape Blue | `#4b68a3` | Hero cape |
| Linen | `#f3e6c8` | Hero shirt (hem `#dccaa2`); pants `#6c4e3f`, boots `#46332c`, gloves `#73a052` |
| Scarf Red | `#d65d42` | Hero scarf |
| Turnip Lilac | `#a77ccf` | Main enemy colour (dark `#8661b4`) |
| Turnip Cream | `#f3e5bb` | Enemy bottom half (dark `#e2cf9a`, roots `#dcc495`) |
| Leaf Green | `#80b25c` | All leaf blades, other side `#5f9248` |
| Ghost | `#c6def6` | Fast enemy; ramp `#a6b5ec` → `#eaf5ff`, holes `#29325a` / `#161b33` |
| Brute | `#7f5c95` | Large enemy top (mid `#9c7c90`, low `#c19c64`), cracks `#ffa63a`, core `#ffe58c` |
| Pine | `#4e8d6e` | Conifers (`#3f775c`, `#5c9c79`), trunks `#8c5c3e` |
| Mint Gem | `#4fe3b0` | Small XP gem; big gem `#5cbdf6` |
| Shadow Indigo | `#2c3263` | Actor shadows (props `#7d86c4` multiplied) |
| HUD Ink / Cream | `#3e3a58` / `#fffaf2` | HUD text / HUD panels |

Autumn tree crowns use four warm triads, picked per face: `#ee8b3a #e47a31 #f2a046`, `#dc5d43 #cf4d3c #e6714b`, `#ecb544 #e3a23c #f2c35a`, `#d07a3f #e09447 #c4653a`. Houses: walls `#f5ecd8`, roof `#cf6644`, barn `#bf5540`, windows `#ffd77a` (emissive). Hay `#ecc766` / `#d4ab4f`, rocks `#b4ab9e` / `#9a9288` with moss `#95ad6c`.

**Rules**
- Everything is mid-value and slightly desaturated; only emissive faces (glow, cracks, windows, gems) are fully saturated.
- The ground lives in a narrow value band so actors pop by hue: orange hero, lilac enemies, white ghosts, green/red/orange trees.
- Shadows and vignettes are cool indigo/violet — never black or grey.
- Each material = 2–4 base colours; the lighting makes the ramp. Add ±3–7 % multiplicative jitter per face for organic things.
- No pure black anywhere (darkest `#161b33`), no pure white surfaces except hit flashes and sparkle stars.

## Typography

**Baloo 2** — weights 600, 700, 800 — headings, HUD numbers, damage numbers. `https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&display=swap`

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

Text effects: big titles get a stacked 1-px "extruded" text-shadow (5 layers in an orange ramp, or violet `#a98bd6 → #8264b4` for game over) plus a soft violet drop shadow — like a toy logo. Damage numbers on the canvas: `800 6.6px "Baloo 2"` (crit 8.4 px), white fill with a 1.5-unit `#463c66` stroke; crits `#ffcf48` fill, 2-unit `#8a3a1c` stroke and a `!` suffix. Round line joins everywhere.

## Rendering technique

Coordinate system for models: **x = right / front of the model, y = south (towards the camera), z = up**, units = world units (the screen shows 360 world units vertically; the hero is ~17 × 31). The front of every model is **+x**; yaw rotates around z, and yaw = π/2 faces the camera.

1. **Camera.** Fixed pitch 44°: `SP = sin 44°`, `CP = cos 44°`. After yaw rotation `X = x·cos − y·sin`, `Y = x·sin + y·cos`, the orthographic projection is `screenX = ax + X·K`, `screenY = ay + (Y·SP − Z·CP)·K`, where `K` = sprite px per world unit and `(ax, ay)` = sprite anchor (feet).
2. **Back-face culling** against the view vector `(0, CP, SP)`: a face is visible when `ny·CP + nz·SP > 1e-4`. Double-sided faces (`ds`: leaves, cape, roof planes) flip their normal instead of being culled.
3. **Flat shading** per face: `d = max(0, n·L)`, `h = 0.5 + 0.5·nz`, `rgb = col · (SKY·h + GND·(1−h) + SUN·d)`, with `L = normalize(−0.58, 0.3, 0.76)`, `SKY = [0.47, 0.52, 0.67]`, `GND = [0.52, 0.44, 0.38]`, `SUN = [0.7, 0.62, 0.45]`. Optional `lift` blends back toward the base colour (ghost 0.3, gems 0.18, puffs 0.25). Emissive faces (`em`) skip shading entirely.
4. **Painter's sort** by `depth = −avgY·CP − avgZ·SP + bias` (far first). Decals painted onto surfaces use negative `bias` (−0.5 rim, −0.9 fill, −1.2 core) so they always win.
5. **Fill + same-colour stroke** (`lineWidth 0.85` px, round joins) hides the AA hairlines between facets. No outlines.
6. **Baking.** At init: `K = clamp(round(screenH/360·4)/4, 2, 4)`. Every actor is baked at 16 yaws × N frames (`spriteSet`), every prop at one yaw, all with a shared feet anchor. Shadows are baked once per actor type.
7. **Per frame:** fill `#a1b97e`, blit ground chunks, draw gem shadows/gems, draw actor shadows, y-sort props + actors and blit their sprites (pixel-snapped to the view scale), then orbitals, projectiles, particles, numbers, then the screen-space tilt-shift + vignette.

Models are defined by **code, not data files**, from five primitives:
- `lathe(profile, segs, opts)` — surface of revolution from `[[r, z, offsetX?, offsetY?], …]` bottom→top (r = 0 is a pole). Options: `ribs` (every odd segment ×0.88 radius → pumpkin ribs), `twist` (radians per ring), `jitter` (random radius/height dents), `a0/a1` (open arc, e.g. a half-cape), `capB/capT`, and `col(ring, seg, upperHalf)` to colour each quad half.
- `box(sx, sy, sz, col)` — 12 triangles, auto-oriented outward.
- `ico(sub, {r, sx, sy, sz, jitter, col(nx,ny,nz,rng)})` — icosphere (20 or 80 faces), colour chosen per face from its direction (e.g. moss on faces with `nz > 0.62`).
- `leaf(len, wid, c1, c2, fold, bend)` — 7-vertex folded blade along +x, two colours either side of the ridge, double-sided.
- `feature(mesh, polygon, R, Rv, cz, col, opts)` — a 2D polygon `[[u, v]]` (u lateral, v height) ear-clipped and projected onto the front of an ellipsoid (radius R, half-height Rv, centre height cz), emissive. `carved()` stacks three: rim ×1.3 `#6e2e10`, fill `#ffc43a`, hot core ×0.5 `#fff1a6`.

Composition uses 3×4 affine matrices: `mesh.add(part, chain(T(x,y,z), RY(a), RX(b), SC(s)))`.

## Background and ground

- A jittered equilateral **triangle lattice**: cell `CS = 24` units, row height `24·0.866`, odd rows offset by half a cell, each vertex jittered ±26 % in x and ±23 % in y by a hash.
- Each vertex gets a **biome** (grass, forest, sand, rock, field, yard) from warped fbm masks and a **height**: `biomeBase + rough · (hashNoise·1.3 + perlin(x/75)·1.6) + perlin(x/280)·6`. Base heights / roughness: grass 0 / 1.2, forest 0.9 / 1.5, sand −1.6 / 0.7, rock 3.6 / 1.9, field −0.6 / 0.5, yard −1.0 / 0.5. A clean-up pass absorbs lone vertices into the surrounding biome.
- Each triangle takes the majority biome, picks one of its **4 colour variants** by hash, and on mixed borders mixes 50 % with the neighbour biome 40 % of the time — this produces the jagged, toothed biome edges seen in the shots. Rare accents: 18 % mossy rock facets, 4.5 % dry grass facets, 8 % darker forest facets.
- Macro tint: `col · (1 + mt·0.12 + 0.012, 1 + mt·0.1, 1 + mt·0.05 − 0.01)` with `mt = fbm(x/520) − 0.5` — a gentle warm/cool drift over large areas.
- The facet normal from the height field goes through **the same `shadeRGB`** as the models, so ground and actors share light.
- Ploughed fields: horizontal furrows every 14 units — a 3.2-unit darker north band and 3.4-unit lighter south band per row — with tiny two-tone vine triangles along the ridges.
- **Decals** on an 11-unit jittered grid, baked into the chunk: low-poly grass tufts (6 leaf blades, `#a4c27a`/`#87a865`, 4.2 % of grass cells), clusters of 2–4 ten-point flowers (`#fff4e0 #c9a5ea #ff9c84 #ffd45e #f2b6d6`), pebbles, mushrooms (`#d9583f`), mini pumpkins in fields, and on forest floor 34 % of cells get 1–3 two-tone fallen-leaf triangles (`#e0893f #d4613f #e9b347 #b8693f #c9a04a`, each shaded as two faces).
- Prop cast shadows are drawn into the chunk with `multiply` at alpha 0.62 (`#7d86c4`), so trees ground themselves for free.
- Chunks are 256 world units, rendered at up to 3 px/unit, generated incrementally with a generator function (yield every 4 rows).

## Characters

The hero (example: a pumpkin-headed farm boy) is built at native scale and then scaled ×1.1:
- **Legs:** 6-segment lathes `[[1.5,0],[1.62,1.7],[1.42,2.3],[1.5,7.6]]`, bottom ring boot `#46332c`, rest pants `#6c4e3f`, plus a `2.7×2.8×1.8` boot box pushed forward 1.1. Legs at y = ±2.05, swing `±0.62·sin(phase)` rad around the hip (z 7.6) and lift up to 1.1.
- **Torso:** 8-segment lathe `[[4.15,6.3],[4.5,7.2],[3.95,10.2],[3.35,12.9],[2.1,14.5],[0,14.8]]` in linen `#f3e6c8` (hem `#dccaa2`), a belt ring in pants colour at z 9–10, a scarf ring `#d65d42` at z 13–15.25 plus a dangling scarf box at the back.
- **Cape:** an *open* lathe arc from 0.6π to 1.4π (the back half), double-sided, `#4b68a3`, whose lowest ring is pushed backwards by `1 + |sin|·1.2` while walking — the cape flares with the stride.
- **Arms:** 5-segment lathes hanging from z 13.1 at y = ±4, glove = 20-face icosphere `#73a052`, swing ±0.7 rad opposite to the legs.
- **Head:** pumpkin = `sphereProf` with elevations `[−90, −62, −34, −8, 18, 44, 66]°`, radius 7.8, half-height 6.5, centre z 21.6, 16 segments with `ribs 0.88` and alternating `#f48a2c` / `#e27526`; a twisted 5-segment stem `#7a8a3e` and one leaf blade on top. Head bobs `|cos(phase)|·0.35`.
- **Face:** two triangular eyes, a small nose triangle and a 13-point jagged grin, each `carved()` (rim → glow → hot core) onto the +x side. The face is emissive, so it stays bright in every orientation.
- **Frames:** 6 walk phases (`i/6·2π`) + 1 idle, × 16 yaws. Torso leans `sin·0.07` rad.
- **Shadow:** mesh projected along the sun, blur 1.4 units, plus an AO ellipse radius 6.2 units, tinted `#2c3263`, drawn at alpha 0.5.
- A warm additive glow sprite (r 9 units) sits over the face whenever it points toward the camera.

## Enemies and props

**Small melee enemy** (turnip): 9-segment lathe body `[[0,2.4],[2.8,3],[5.7,4.7],[7.7,7.4],[8.1,10.1],[7.1,12.8],[4.9,15],[1.8,16.3],[0,16.5]]`, jitter 0.32, twist 0.2. Ring colours: bottom `#e2cf9a`, rings 1–2 cream `#f3e5bb`, ring 3 split cream/lilac (zig-zag colour border), rings 4–5 lilac `#a77ccf`, top `#8661b4`, ±3 % jitter. Four leaves (8.8 × 3.3, bend −1.4) fan out from z 15.8 and sway with the walk phase. Face: angry slanted eyes stacked `#4a2a5e` / `#ffd43c` / `#fff6c0`, brows `#5a3a78`, a zig-zag mouth `#3d2552`. Two thin root legs. 4 frames × 16 yaws. ~16 units wide, ~20 tall.

**Fast enemy** (ghost): one lathe whose ring centres drift backwards (`−t²·6.5`) and sway sideways (`sin(phase + z·0.33)·t·2`) toward the bottom — the body becomes a trailing sheet. Colour ramps by ring from `#a6b5ec` to `#eaf5ff`. Hollow eye and mouth holes are non-emissive double features `#29325a` / `#161b33`. Drawn at alpha 0.8, hovering 2.5 ± 1.6, shading lift 0.3, shadow only an AO blob (alpha 0.3).

**Brute** (rock colossus, ~3× the hero): 8-segment lathe radius 17.4, jitter 1.0, coloured in bands `#c19c64` → `#9c7c90` → `#7f5c95`, with emissive orange crack strips (`strip()` = a polyline turned into quads, then `feature`), a hexagonal glowing core (`#5e3a2a` / `#ffa63a` / `#ffe58c`), slit eyes, icosphere shoulders + lathe arms with crack strips, a crown of 5 big leaves (`#7c8e47` / `#617638`). A pulsing additive glow follows the chest.

**Props** (one yaw each, baked once): pines = 4 stacked jittered cones cycling `#3f775c/#4e8d6e/#5c9c79` (heights 58–82); autumn trees = tapered trunk + 1 big + 1–2 small subdivided icospheres (sub 1, jitter 0.1) with per-face colours from a warm triad (heights 54–69); boulders = flattened icosphere (sx 1.25, sz 0.72) with mossy top faces; pumpkins (radius 5.4–8.4, ribbed, leaf); jack-o'-lanterns; houses and barns from boxes + two roof planes + gables, emissive windows `#ffd77a`; haystacks, hay bales, fences, stumps.

Readability rules: enemies never use the ground hues; props that can hide the hero become alpha 0.42 when the hero is behind them; tall props are only placed in forest/rock biomes and kept away from spawn.

## Effects and particles

- **Faceted shards** — every hit and death sprays small flat triangles (hit: 2–3 of size 1.7; kill: 12 of size 2.6; brute: 26 of size 4.2) with gravity 260, drag 1.6, spin. Colour = an 8-step brightness palette of the victim's colours (`f = 0.6 + 0.45·t`, slight warm/cool shift), index chosen per frame from `|cos(rot·1.1 + seed·6)|`, so they glint like real facets.
- **Low-poly puffs** — baked icosphere sprites (r 3, sub 1, jitter 0.14) in `#f6eedf`, `#e0ecfb`, `#d8c09a`, `#fff3c9`; scale 0.7 → 1.4 over life, fade.
- **Sparks / motes** — 4-point diamond stars (`#ffffff`, `#ffd27a`, `#ffe27a`, `#bdf5df`), lifetime ~0.28 s.
- **Rings** — ground ellipses (ry = rx/2) expanding with outQuad: death of the brute `#f6ecd6` 10→46, level-up `#ffd666` 8→52.
- **Spawn** — dark ground ellipse + expanding cream ring + 6 puffs; sprite revealed bottom-up.
- **Hit flash** — white silhouette copy, alpha `flash·1.1`. **Death** — 0.22 s squash (×1.3 wide, ×0.45 tall) + 55 % white overlay, fading out.
- **Projectile** — flattened 8-segment seed lathe rendered top-down (special pitch sp 0.94 / cp 0.34) in 8 roll frames, tapered cream trail triangle `#fff6dc` alpha 0.45, ground dot.
- **Pickups** — octahedron gems (r 2.1 / 3.1) spin 8 frames over a quarter turn with a soft halo and shadow dot; orbiting lanterns (a small turnip-lantern mesh ×1.3 with carved face) hover 9 units with an additive warm glow (r 18).
- **Dash** — 3 white-silhouette ghosts of the hero behind it at alpha 0.16·(4−i), plus 5 puffs.

## Lighting, shadows and post-processing

- One sun, `L = normalize(−0.58, 0.3, 0.76)` — from the upper left, slightly from the front, high. Same vector for models, ground facets, decals and shadow projection. Never change it per asset.
- **Cast shadows** (`makeShadow`): each vertex is projected onto the ground along the sun (`x += z·(−Lx/Lz)`, `y += z·(−Ly/Lz)`, then `y·SP`), triangles filled black, blurred with `ctx.filter = blur(1.4–2.4 units)` at alpha 0.5–0.62, plus a radial AO blob (radius 5–30 units, alpha 0.85–0.9), then recoloured with `source-in` to `#2c3263` (actors, drawn at alpha 0.5; ghosts 0.3) or `#7d86c4` (props, multiplied into the ground at 0.62). Shadows therefore fall to the lower right.
- **Glows**: additive (`lighter`) radial sprites only — warm `rgba(255,214,120,.75) → rgba(255,140,40,0)`, small `rgba(255,225,140,.9) → rgba(255,150,50,0)`, cold `rgba(220,240,255,.5)`.
- **Tilt-shift** (screen space, every frame): copy the top 20 % and bottom 17 % of the frame into 1/8-size canvases (that is the blur), tint the top band with `rgba(232,238,250,.34 → 0)` haze and the bottom with `rgba(70,62,110,0 → .26)`, then draw each band back in 7 slices with alpha `(1 − e)^1.6` fading toward the centre.
- **Side vignette**: 9 %-wide gradients `rgba(60,55,100,.22) → 0` on the left and right.
- No bloom, no colour grading beyond that.

## UI and HUD

Toy-like rounded pills: cream `#fffaf2` panels, `border-radius 22px` / `999px`, violet drop shadow `0 6px 16px rgba(58,48,96,.24)` plus an inset bottom lip `inset 0 -4px 0 rgba(150,130,180,.13)`. Bars have a 4 px cream border, glossy vertical gradient fills and a white 5 px highlight stripe. Round icon badges overlap the start of bars (`margin-left: -12px`). Icons are low-poly meshes rendered at a custom pitch (18–40°) into radial-gradient circles (`#ffffff → #d6f2e8 / #ffe4cf / #e8ddf8`). Level-up cards: 28 px radius, `linear-gradient(180deg, #fffefb, #fbf3e9)`, hover lifts 8 px.

```css
.hud-panel { background: #fffaf2; padding: 3px 26px 7px; border-radius: 22px;
  box-shadow: 0 6px 16px rgba(58,48,96,.24), inset 0 -4px 0 rgba(150,130,180,.13);
  font: 800 32px/1.1 'Baloo 2', 'Nunito', system-ui, sans-serif; color: #3e3a58; }
.hud-label { font: 800 10px/1 'Nunito', sans-serif; color: #8f87ab; letter-spacing: 2.2px; }
.icon-badge { width: 50px; height: 50px; padding: 5px; border-radius: 50%;
  background: radial-gradient(circle at 45% 35%, #ffffff, #fff1e4 75%);
  box-shadow: 0 6px 16px rgba(58,48,96,.24), inset 0 -3px 0 rgba(160,120,90,.14); }
.hp-bar { position: relative; width: 230px; height: 28px; margin-left: -12px; background: #f2e6e2;
  border: 4px solid #fffaf2; border-radius: 999px; overflow: hidden;
  box-shadow: 0 6px 16px rgba(58,48,96,.24), inset 0 2px 3px rgba(110,50,50,.16); }
.hp-fill { position: relative; height: 100%; border-radius: 999px;
  background: linear-gradient(180deg, #ffa58a 0%, #f46d5d 55%, #dd5449 100%); box-shadow: inset 0 -3px 0 rgba(120,20,20,.14); }
.hp-fill::after { content: ''; position: absolute; left: 14px; right: 8px; top: 3px; height: 5px; border-radius: 99px; background: rgba(255,255,255,.45); }
.xp-bar { height: 24px; background: #e9e3f1; border: 4px solid #fffaf2; border-radius: 999px; }
.xp-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #62dcb4, #6fd1d8 55%, #74c3f4); }
.card { width: 226px; border-radius: 28px; background: linear-gradient(180deg, #fffefb, #fbf3e9); color: #3e3a58;
  box-shadow: 0 18px 36px rgba(40,30,80,.34), inset 0 -6px 0 rgba(150,130,190,.16); transition: transform .14s; }
.card:hover { transform: translateY(-8px) scale(1.02); }
.overlay { background: radial-gradient(ellipse at 50% 46%, rgba(255,246,232,.30), rgba(66,56,104,.66)); backdrop-filter: blur(3px); }
```

## Motion and animation

- **Hero:** 6 walk frames per stride, `frame = floor(anim·0.5·6) % 6`; hop `|sin(2π·anim·0.5)|·1.1`; idle frame with breathing bob `0.35 + 0.35·sin(2.4·t)`. Yaw follows velocity via `angleLerp(rate 0.22)`, quantised to 16 baked angles.
- **Small enemy:** 4 frames, `anim·0.55` cycles, hop 1.4, yaw rate 0.16. **Brute:** 4 frames at `anim·0.42`, hop 0.6, yaw rate 0.08 (turns heavily). **Ghost:** 4 frames at 1.4 cycles/s regardless of speed, hover `2.5 + 1.6·sin(2.6·t)`.
- Animation is mesh-level (limb rotation around pivots, leaf sway, cape flare), never sprite squash — except the 0.22 s death squash.
- **Gems:** 1.5 quarter-turns/s, bob `2.2 + 0.8·sin(3t)`, pop-hop 9 units when spawned. **Lanterns:** hover `9 + 1.2·sin(4t)`, glow alpha `0.5 + 0.12·sin(11t)`.
- **Damage numbers:** pop from 0.55 to 1.15 scale in the first 14 % of life, then settle to 1.0, fade in the last third.
- **Hurt:** white overlay at `hurtT`; invulnerability blinks at 18 Hz (alpha 0.5/1).
- **Carved-face glow:** flicker `0.22 + 0.06·sin(9t)`.

## Do and don't

**Do**
- Build every visible thing as a real triangle mesh and shade it with the same sun and ambient constants.
- Pre-render meshes into sprites at 16 yaws × a few frames; blit sprites per frame.
- Keep facets big: 5–9 segment lathes, icospheres with subdivision 0–1, ±10–15 % jitter on organic forms.
- Paint faces, windows and cracks as emissive polygons (rim / fill / hot core) with negative depth bias.
- Give every object a sun-projected, blurred indigo shadow plus an AO blob.
- Finish with the tilt-shift bands and the soft violet side vignette.
- Pick 2–4 base colours per material and let lighting create the ramp.

**Don't**
- Don't add black outlines or cel ink lines.
- Don't use smooth / per-vertex shading or gradients on models — one colour per triangle.
- Don't use bitmap textures or noise grain on surfaces.
- Don't render meshes live per frame for crowds.
- Don't use grey/black shadows or let actors float without shadows.
- Don't mix pitches or light directions between assets.
- Don't over-saturate the ground; it must stay a calm mid-value backdrop.

## Implementation recipe

1. Define the world: 360 world units of height on screen, ground plane = world xy, camera pitch 44°, sun `normalize(−0.58, 0.3, 0.76)`, ambient constants from *Rendering technique*.
2. Copy the 3D core from `starter.js`: matrices (`T`, `SC`, `RX`, `RY`, `RZ`, `chain`), `Mesh` (`vert`, `tri`, `add`, `orient`), `lathe`, `box`, `ico`, `leaf`, `triangulate`, `feature`, `carved`, `shadeRGB`, `drawMesh`.
3. At startup compute `K = clamp(round(screenH/360·4)/4, 2, 4)`.
4. Model the hero: big lathe/sphere head (≈ 60 % of height) with a carved emissive face on +x, a small lathe body, box feet, icosphere hands. Write it as a function of `phase` and `walk` so legs/arms rotate around pivots.
5. Model 2–3 enemy types with distinct silhouettes and hues (round + leaf crown, tapered sheet, huge cracked rock). Give each a face on +x.
6. Bake: for each actor `spriteSet(frames, 16 yaws)`; for each prop a single yaw. Bake a shadow (`makeShadow`) per type. Bake white flash silhouettes lazily.
7. Build the ground per 256-unit chunk: jittered triangle lattice (24 units), biome + height per vertex, 4 colour variants per biome, height-field normal → `shadeRGB`, decals on an 11-unit grid, prop shadows multiplied in at 0.62.
8. Per frame: blit ground chunks; draw gems; draw actor shadows (alpha 0.5); y-sort props + actors and blit (pixel-snap to view scale); additive face glows; projectiles with trails; shard/puff/spark particles; damage numbers in Baloo 2.
9. Screen post: tilt-shift top 20 % / bottom 17 % via 1/8 downscale + haze gradients, then side vignette.
10. HUD in HTML/CSS with the cream pill styles above; render upgrade icons with the same mesh pipeline at a custom pitch.

## Code

The snippets below are the core techniques, standalone. `starter.js` (same folder) contains the complete, runnable kit (meshes, hero, enemies, trees, ground, tilt-shift, preview scene). The full reference module is [`../../js/styles/lowpoly.js`](../../js/styles/lowpoly.js).

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

**A lathe — the workhorse primitive** (pumpkins, bodies, legs, cones, ghosts)

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

## Adapting it to your game

- **Keep fixed:** pitch 44°, the sun vector, SKY/GND/SUN constants, outline-free fill+stroke facets, 16 baked yaws, indigo shadows, tilt-shift + side vignette, chunky faceting (≤ 16 segments), the cream-pill HUD.
- **May change:** the palette, as long as you keep (a) a calm mid-value ground in 4 close variants per biome, (b) 2–4 base colours per material, (c) saturated colours only on emissive parts. A winter re-theme: ground `#dfe7ef`-ish variants, shadows stay indigo, pines stay, crowns become white icospheres.
- **New characters:** compose from lathe + box + ico + leaf; put a readable face on +x with `feature`/`carved`; animate with pivot rotations per phase; bake 4–6 frames. Keep the hero ≈ 17 × 31 units and enemies 14–20 units; bosses 3× size.
- **Other genres:** a city builder uses `box` houses with gable roofs (already in the reference); a tactics game can snap units to the triangle lattice; a side-on view is *not* supported — rotate the camera pitch only if you re-bake everything.
- **Other resolutions:** only `K` changes; bake at `clamp(round(H/360·4)/4, 2, 4)` and keep world units. Low-end devices: bake 8 yaws instead of 16.

## Performance notes

- Baking is the main cost: hero 16 × 7 sprites, each enemy 16 × 4, ~20 props, ~25 decal sprites, puffs, icons — a few hundred milliseconds at init. Ghost/brute meshes have 300–900 triangles; bake them, never draw live.
- Per frame: one `drawImage` per actor/shadow, plus a handful of additive glows. Hundreds of enemies stay under budget.
- Ground chunks (256 units at ≤ 3 px/unit) are built by a generator that yields every 4 rows and every 64 decals, within a 5 ms/frame budget, so streaming never hitches. Prop shadows are baked into chunks.
- Shadows use `ctx.filter = blur()` only at bake time.
- Tilt-shift: two 1/8-scale copies of screen bands and 14 slice blits per frame — cheap.
- `starter.js` renders its whole preview in ~4–8 ms by caching every sprite and the ground canvas.

## Copy-paste prompt

```text
Build my game <X> in the "Low-Poly Diorama" style (miwale Game Style Library):
- Canvas 2D, no image assets. Write a tiny 3D pipeline: triangle meshes -> yaw -> orthographic 3/4
  projection (pitch 44°, screenY = (Y*sin44 - Z*cos44)*K) -> back-face cull -> painter's sort -> fill.
- Flat shading per triangle: col*(SKY*h + GND*(1-h) + SUN*max(0,n·L)), h = .5+.5*nz,
  L = normalize(-0.58, 0.3, 0.76), SKY [.47,.52,.67], GND [.52,.44,.38], SUN [.7,.62,.45]. No outlines.
- Build models from lathes (5-16 segments), boxes, icospheres (sub 0-1, jittered) and folded leaf blades.
  Faces/windows/cracks are emissive polygons stacked rim/fill/hot core on the model's +x front.
- Pre-render every actor at 16 yaw angles x 4-6 animation frames into sprites; props at one yaw.
- Hero ~17x31 world units (360 units of screen height), big head ~60 % of the height, glowing face.
- Ground: jittered triangle lattice (24 units), 4 close colour variants per biome (meadow #9cb876,
  forest #c98e57, sand #e2cb9c), lit from a tiny height field with the same shading; baked tufts/leaves.
- Shadows: mesh projected along the sun, blurred, + AO blob, tinted indigo #2c3263 (never black).
- Palette: pumpkin #f48a2c, lilac #a77ccf, cream #f3e5bb, cape #4b68a3, glow #ffc43a, gems #4fe3b0.
- Effects: faceted triangle shards, low-poly icosphere puffs, ground ellipse rings, additive warm glows.
- Post: tilt-shift (top 20 % / bottom 17 % via 1/8 downscale + haze) and a soft violet side vignette.
- HUD: cream #fffaf2 pills, violet drop shadows, glossy gradient bars, fonts Baloo 2 800 + Nunito.
```
