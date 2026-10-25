# Cathedral Glass — Game Art Style Spec

> A living cathedral window: jewel-tone glass pieces in dark lead came, lit from behind by warm light and coloured rays.

The whole world is one backlit stained-glass window. Floor, props, characters, collectibles, HUD icons and even floating numbers are built from the same single unit: a **glass piece** with a luminous off-centre core, a darker rim, two faint cathedral-glass streaks and an occasional glint, separated from its neighbours by near-black **lead came** (`#17131c`). The floor is a per-pixel Voronoi mosaic whose material regions (green meadow, crimson leaf carpet, amber path lanes, night-blue glass, grey diamond quarries) are separated by heavier lead. Props cast coloured light pools on the floor, glowing faces shine through, and a slow layer of coloured light rays drifts over the screen. The module's cast – a cloaked main character with a round orange rib-cut head and a glowing carved face, jewel-capped root-bulb creatures, an opal floating spirit and a violet-and-brown giant with a ruby core – serves as the example throughout.

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
| Pumpkin orange | `#ff8a22` | Main character's head ribs `#e2681a #ffa63c`; gourd props `#c85a14 #e47820 #f39232` |
| Candle gold | `#ffd23a` | Carved faces, flames (`#ff9a2a`, `#fff2a0`), lantern faces `#ffe066` |
| Hem gold | `#f2c040` | Clasps, hems (`#e0a830`), fruit jewels, stars |
| Cloak green | `#2a6e40` | Main character's clothes; `#1f5a34 #184a2c #2f7a3c #22603e` |
| Scarf red | `#c4283e` | Main character's accent; `#a51d34 #d8404e` |
| Amethyst | `#9351c8` | Caps of the small root-bulb creatures, variants `[#7a3fae #9351c8 #6a3298]`, `[#a8378c #c24ca2 #8e2c76]`, `[#5a48b8 #7060d0 #4a3a9e]` |
| Ivory | `#f4e2b4` | Small creature bodies `#e8cc90`, roots `#e6cf9a #cfae72`, seeds `#fff0c4 #e6c27a` |
| Ember | `#ff5a26` | Angry glowing creature eyes |
| Opal | `#e9e9fb` | Floating spirit mosaic; `#f0f5ff #dde8fb #f6ecfb #e0f3f4 #fbf6ec`; hollow eyes `#1e2452` |
| Earth brown | `#7e5a3c` | Large creature body, trunks; `#6b4a32 #5a3b2a #8a6440 #644530` |
| Dusk violet | `#704690` | Large creature shoulders/arms; `#5e3a7a #52306a #7c5098` |
| Ruby | `#e3203c` | Large creature core, hearts, red status bar; `#ff4a5a #b8142e #ff7080` |
| Aqua gem | `#3ac6c6` | Small collectibles `#8ff6ea #c4fff6 #279fb0`, aqua progress bar; large collectible `#ffe27a #f0a82a #fff4c0 #d88a1a` |
| Window gold fillet | `#d9ad4e` | 2 px gold ring inside UI lead borders |

Palette rules:
- **Lead is the only dark.** About 12–18 % of floor pixels are lead. No glass piece goes darker than its colour × 0.6; pure black/white never appear as a surface.
- **Floor = cool/earthy mid tones, figures = warmer, paler, brighter.** Ivory-and-amethyst root creatures, opal spirits and an orange round head all separate from green/crimson floor glass.
- **Gold and yellow mean "light source"**: faces, eyes, flames, jewels, UI numbers. Don't spend gold on large surfaces.
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
3. Bake a **flash copy** of every animated frame with mode `flash` (each piece mixed 58 % toward warm white `rgb(255,250,232)`, glow pieces 40 %) — the lead stays dark.
4. Bake glow sprites (radial gradients), glint stars, shard sprites (3 shapes × 12 colours), projectile, trail, beams, props (3 trees, 2 bushes, 2 arches, 2 candle groups, 3 graves, 3 gourd groups) and HUD icons with the same Painter (icons at outline 2.0 / inner 1.15).
5. Bake the screen overlay per screen size (vignette, frame, ripples) plus a half-resolution light layer.

Per frame (renderer order):
1. Ground chunks (256 units, generated per pixel as time-sliced generators and cached).
2. Collectibles → shadows/light pools under figures → y-sorted props, creatures and main character → orbiting objects → projectiles → particles → floating numbers.
3. Screen overlay: dark layer with `source-over`, light layer with `lighter`, offset `sin(t·0.12) × 2.5 % W`.

Every figure draw is just `drawImage` of a baked canvas with `setTransform(S·sx, 0, 0, S·sy, …)`, optional rotation, plus 1–3 additive glow blits.

**Glass piece shading** (`Painter.glass`): colour × (1 ± 0.06) → radial gradient from `(cx − 0.25r, cy − 0.3r, 0.05r)` to `(cx, cy, 1.3r)` with stops `0: mix(col, white, .3)`, `.48: col`, `1: col × .64`. Glow pieces: `0: mix(col, rgb(255,255,236), .78)`, `1: col × .9`. Pieces with r > 1.4 units get two curved streaks (white 12 %, width 0.16 r, random angle) and, with 50 % chance and r > 1.6, an elliptical glint (0.26 r × 0.1 r, rotated −0.7, white 55 %) at the upper left.

## World and ground

The floor is computed **per pixel** in world space so it is seamless and identical between chunks. Its glass cells are large (15–30 units) and in cool or earthy mid tones, so figures with smaller, brighter pieces stand out against it.

1. **Fields** on a 4-unit grid (`GSTEP = 4`), 5 layers: leaf carpet `warped(x/640, …) − 0.565`, night glass `warped(x/860, …) − 0.585`, path = a domain-warped fbm at scale 1150 (iso-line), plaza `fbm(x/520) − 0.66`, macro brightness `fbm(x/1150)`.
2. Per pixel the 4 surrounding nodes are interpolated bilinearly; value divided by the bilinear gradient magnitude gives a **signed distance in world units** — this makes borders smooth curves of constant lead width. A path pixel is where `21 − |d| > 0` (42 units wide).
3. Material priority: plaza > path > night > leaf carpet > meadow. `re` = distance to the nearest region border.
4. **Voronoi glass**: jittered grid (sites at `(i + 0.08 + 0.84·hash) × C`), cell size C: meadow 20, leaf carpet 15, night 23, path 30. Find the 3 nearest sites in the 3×3 neighbourhood; edge distance `e = (d2² − d1²) / (2·|s2 − s1|)` for the 2nd and 3rd site, combined with `smin(e1, e2, 1.6)` so vertices round off. The path additionally splits into 3 lanes at ±7 units (different palettes, extra lead along the lane lines). Plazas use 45° diamond quarries: `(x ± y) / 17`, distance to the diamond edge × 0.7071.
5. **Per-piece colour**: hashed swatch × brightness 0.93–1.07; meadow switches to the olive family where `hash < smoothstep(0.42, 0.6, fbm(site/380))`.
6. **Luminance**: `(0.6 + 0.38·smoothstep(e / (0.34·C))) × streak × (0.86 + (macro − 0.3)·0.5)`, streak = `1 + 0.055·sin((x·cos a + y·sin a)·f + φ)` per piece.
7. **Lead**: coverage `max(0.78 − eP, 1.2 − re) × res + 0.5` (antialiased over one pixel); colour ramps from `rgb(28,24,34)` at the edge to `rgb(84,78,96)` at the centre with `q = tl² × 0.85` — a soft metallic ridge.
8. **Decals** (seeded jittered scatter, only where the material is safe within a radius): 5-petal leaded flowers (`#e8668a #f2c040 #7ab8f0 #efe6ff #c87ae8`, orange centre) with two leaves on meadow every ~44 units; autumn leaves (`#e09a30 #d0602a #f2c040 #b8402a #e87a3a`) with a lead midrib on the carpet; 5-point gold stars on night glass; amber roundels on the path; seedy bubbles on quarries. Each decal piece is a `glassBlob` (gradient + 0.55–0.65 unit lead).
9. **Glints**: every ~24 units, 32 % chance, a diagonal white stroke (alpha 0.2, width 0.55, length 1.6–4) — sometimes doubled.
10. **Prop pools** baked into the chunk: contact shadow `rgba(16,12,24,0.38)` ellipse, then additive coloured radial pools (e.g. arch window: red, blue, gold pools at alpha 0.26; candles warm `rgb(255,180,70)` 0.3; graves cold `rgb(150,200,255)` 0.12).

## Characters

All figures use the same two-pass Painter: one fat outer lead came (1.9 units), glass pieces with their own gradients, inner lead 0.55. Each is baked in 4 frames plus a lit flash copy; facing = horizontal flip.

**Main character** (sprite box −14…14 × −38…3, drawn ×1.15):
- **Boots**: two capsules (`CAP`) r ≈ 2.1, `#4a2f22 / #5d3b29`, swinging ±2.2 units over 4 frames.
- **Cloak**: 7-point trapezoid (−8.8…8.8 wide at the hem, 4.6 at the shoulders, −17.2…−2.6 tall) BSP-cut into pieces ≤ 38 units² in 5 greens.
- **Golden hem**: zig-zag band split into 3 gold pieces (`#f2c040 #e0a830 #f2c040`) with thinner outline (0.5).
- **Clasp jewel**: a 1.5-unit glowing gold circle.
- **Scarf**: back tail piece + front band split diagonally into two reds.
- **Stem + leaf**: curved stem `#4f7c2c`, one leaf as two half pieces split on the midrib.
- **Head**: a round orange gourd-like ellipse, rx 10.6, ry 8.4 centred at y −24.6, divided into 5 vertical **rib lenses** (boundaries −1.05, −0.64, −0.22, 0.22, 0.64, 1.05) coloured dark-mid-light-mid-dark orange — this gives roundness without any shading pass.
- **Face**: triangle eyes, triangle nose and a 17-point jagged grin as **glow pieces** in `#ffd23a`, offset 1.5 units towards the facing side, plus two additive glows (warm halo r 16 × 1.25 at alpha ~0.32, gold r 10 × 0.55 flickering).
- 4 walk frames (feet offsets `[0, 2.2, 0, −2.2]`, back-foot lift `[0, .8, 0, .8]`); facing = horizontal flip.
- A warm additive light pool on the floor under the main character (r 20 × 0.4 squashed, ×1.6) pulsing 0.85 ± 0.15.

**Small creature** (a root bulb on legs, box −14…14 × −34…4, drawn ×0.92): bulb = bezier outline, cut into 3 coloured cap pieces (one of 3 jewel variants: amethyst, magenta, indigo) over 2 ivory pieces with a jagged seam; 3 leaves fanning out of the top swaying ±0.12 rad; two root-leg capsules; two angry quad eyes as ember glow pieces; a lead frown line. Hops with ±0.09 rad rock.

**Fast floating creature** (a sheet-like spirit, box −11…14 × −27…3): arched sheet with a 4-scallop animated hem, cut into opal mosaic pieces ≤ 70 units² with low jitter (0.06), hollow navy eye/mouth ellipses, a reaching arm capsule, cold pupils `rgba(160,220,255,.9)`. After baking, the bottom 9 units are erased with a `destination-out` gradient (0 → 0.85) so it dissolves. Drawn at alpha 0.86, floating 4 units up with a cold additive glow.

**Large creature** (a root giant, box −31…31 × −64…3): egg body (bezier, ~44 wide × 40 tall) BSP-cut into pieces ≤ 78 units², violet above y −31 and brown below (with ±3 unit noise on the boundary); capsule legs and arms with their own mosaics; a leaf crown of 5 leaves; a 4-facet **ruby core** of glow pieces with a pulsing ruby glow (0.45 ± 0.25); amber glow eyes; a jagged dark maw. Ground contact: a dark ellipse 19 × 5.5 plus an additive ruby glow on the floor.

**Readability with many figures**: every figure has the same fat lead outline, so overlapping groups read as stacked cut-outs; creature colours (ivory, amethyst, opal) are deliberately absent from floor palettes; eyes glow; there are only 3 recurring creature silhouettes with distinct sizes (small 26 units, floating 28, large 64); and shadows are simple dark ellipses that anchor each one.

General construction rules for any new character:
- Big readable primitives first (ellipse, capsule, polygon), then cut them into glass with: `mosaic()` (BSP cuts with jittered angle ±0.6 rad until each piece ≤ maxArea), `ribCells()` for round fruit/heads, `leafCells()` for leaves/wings/ears, explicit polygon cells for faces and facets.
- Piece area roughly 30–80 units² on bodies, 3–15 units² on faces and details.
- One idea per colour family per part; jitter does the rest.

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

- **Shatter (disappearing)**: 8 shards for small creatures, 6 for floating spirits, 16 for the large creature, in the figure's colours (e.g. cap colour, cream, green). Shards are baked leaded triangles/quads (outline 0.4). Physics: speed 55–75 × 0.5–1.2, vz 70, gravity 300, drag 1.4, life 0.9–1.4 s, spin ±8 rad/s, fake tumble via y-scale `0.25 + 0.75·|cos|`, glint flash when edge-on. Plus 2–5 glints and, for the large creature, a ruby ring.
- **Disappear pop**: for 0.22 s the flash copy is drawn scaled 1 → 1.18 and fading.
- **Appear**: 6–10 shards swirl in from radius 30–50 units (ease-out quad over 0.85 s), the body fades in from 60 %, the flash copy fades out, and a warm glow pulses.
- **Impact**: flash copy blitted at `min(0.62, flash × 0.9)` alpha, sprite squash (+12 % x, −8 % y), one glint star, 45 % chance of one shard.
- **Glint star**: baked 16 × 16-unit sprite: radial white core r 3 + 4 curved spikes 7.5 units, added with `lighter`, rotates slightly; tints warm, cold, rose, mint.
- **Projectile**: seed sprite rotated to heading, a 16-unit tapered additive trail, small gold glow at alpha 0.35.
- **Collectibles**: a kite split into 4 facets around (0, −1.4), two of them glowing, aqua (large: gold with a ruby centre); bobs ±1.1 units, aqua additive halo, rare twinkle glint.
- **Dash**: 3 additive flash-copy after-images behind the main character at 7-unit spacing, alpha `0.32/i`.
- **Celebration burst**: gold ring, 12 coloured vertical light beams (3.2 × 40 units; gold, rose, blue, mint) and 10 glints.
- **Ring shockwave**: ellipse ring (ry = 0.45 rx) stroked twice — lead at width w + 1.4, then the colour additively at w = 2.6 × (1 − t).
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

- **4 baked frames** per animated figure; `frame = floor(phase × 4) & 3`. Main character phase = distance × 0.42, small creature × 0.85, large creature × 0.32, floating spirit = time × 6 fps.
- **Main character**: walk lift `|sin(phase·2π)| × 2.2` units, rock `0.05 × facing × sin`, y-squash ±2 %; idle breathing y +2.5 % / x −1.5 % at 3 rad/s; action squash −4 % y; celebration wobble `sin(T·4π) × T × 12 %`.
- **Small creature**: hop `|sin| × 1.2` units, rock ±0.09 rad. **Floating spirit**: +4 units float, bob ±1.5 at 2.4 rad/s, tilt by velocity up to 0.14 rad. **Large creature**: lift 1.8 units, landing squash `(1 − up)^4 × 5 %`.
- **Flash** decays 1 → 0; blinking alternates at 14 Hz between alpha 1 and 0.55.
- **Flicker**: candle flames `0.75 + 0.25·sin(11t)·sin(7.3t)`, face glow `0.28 + 0.12·sin(9t)·sin(5.3t)`, collectible halos `0.55 + 0.15·sin(6t)`.
- **Sway**: trees/bushes skew 0.02 / 0.03 at 1.1 rad/s; light rays drift at 0.12 rad/s.
- **Numbers**: scale 0.4 → 1.25 in 12 % of life, settle to 1 by 26 %, shrink 50 % and fade in the last 20–25 %.

## Do and don't

Do:
- Draw every figure in two passes: lead outline pass, then glass pieces with inner lead.
- Give every piece its own off-centre radial gradient and ±6 % brightness jitter.
- Split shapes where a glazier would: ribs, midribs, folds, facets.
- Make faces, eyes, flames and jewels glow pieces plus an additive glow sprite.
- Anchor the floor tessellation in world space; separate regions with heavier lead.
- Cast coloured additive light pools from props.
- Pre-bake every sprite and its lit flash copy.
- Keep the overlay: vignette, lead frame with gold fillet, slow coloured rays.

Don't:
- Don't use flat fills without lead seams — it becomes generic vector art.
- Don't flash figures pure white; the flash copy keeps the lead.
- Don't make floor pieces as small as figure pieces (floor 15–30 units, figures 2–8).
- Don't use thin or coloured outlines; lead is always `#17131c`.
- Don't add directional drop shadows or realistic lighting.
- Don't use figure colours that match the floor region they stand on.
- Don't compute the per-pixel ground every frame.

## Implementation recipe

1. Set up a world of 360 units visible height; `S = canvasHeight / 360`. Choose `K = clamp(round(S × 1.5), 3, 5)` for sprite baking.
2. Implement the helpers: `mulberry32`, `hashInt`, colour `mix/mul`, `perlin/fbm`, `splitPoly`, `bsp`, `mosaic`, `ribCells`, `leafPts/leafShape/leafCells`, path helpers `ELL`, `CAP`, `PP`.
3. Implement the **Painter** with modes `outline`, `fill`, `flash` and methods `part(shape, cells, opts)`, `piece(shape, col, cx, cy, r, opts)`, `glass(cell)` exactly as in the Code section.
4. For each figure write `parts(P, frame)` declaring pieces back-to-front, with frame-dependent offsets for 4 frames. Bake `{n, f}` pairs per frame with `build(box, fn, mode, seed)`.
5. Write the ground: field nodes on a 4-unit grid, bilinear signed distances, material priority, Voronoi per material with `smin` edges, luminance curve, antialiased lead ramp. Render in chunks (256 units) into ImageData, time-sliced, cached.
6. Add decals per material with a seeded scatter, then glints, then prop contact shadows and additive light pools.
7. Bake glow sprites, glint star, shard sprites, projectile, trail; draw them with `lighter`.
8. Per frame: blit ground chunks, y-sort figures and props, blit sprites with flip/scale/rotation, glow blits, particles, numbers.
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
- Two-pass Painter, flash copies that keep the lead, shatter-into-shards disappearing.
- Glow pieces + additive glow sprites for every light source; coloured light pools; the window overlay.

May change:
- **Palette swap**: replace region families with other jewel families (e.g. sapphire sea + emerald islands + gold sand) — keep mid values (HSL lightness ~30–55 %) and 5–7 swatches per family; keep figures brighter/paler than their region.
- **New characters**: start from a silhouette, then cut along natural seams. Knights: helmet ribs + visor glow; animals: leaf-cells for ears and wings; robots work only if made of jewel colours.
- **New props**: same Painter; give each one a light-source accent (jewel, flame, window) and a coloured floor pool.
- **Other genres**: side-scrollers can use a vertical window (pointed-arch frame around the viewport) and a parallax backdrop of large-piece mosaics; puzzle games can turn each tile into a leaded piece.
- **Resolution**: bake sprites at higher K for big screens; the floor can drop to 1–1.5 px per unit on mobile — the lead antialiasing keeps it clean.
- **Cell sizes** scale with your world: floor cells ≈ 0.6–1.2 × main character width.

## Performance notes

- Sprites: ~70 canvases baked at init (main character 4×2, small creature 3 variants × 4 × 2, floating spirit 4×2, large creature 4×2, 15 prop variants, 36 shards, glows). Baking takes tens of ms; never repaint glass per frame.
- Ground: the expensive part — per pixel a bilinear field lookup, a 3×3 Voronoi search and the lead ramp. Render it once per 256-unit chunk as a time-sliced generator (yield every 2 rows) at ≤ 2.5 px per unit, cache chunks, precompute site arrays per chunk and field nodes in a shared map (cleared above 60 000 entries). Classify 4-unit cells far from any border as a single material to skip the per-pixel region test.
- Per frame: 1–3 `drawImage` per figure + a few additive glows, so 300+ figures stay cheap. Avoid `ctx.filter` and `shadowBlur`.
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
- Pre-bake each figure in 4 walk frames plus a "flash" copy (pieces mixed 58% to warm white, lead kept).
- Floor: per-pixel world-anchored Voronoi glass (cells 15-30 units), material regions from noise signed distances (meadow greens, crimson leaf carpet, amber 3-lane path, night blue, grey diamond quarries), lead 0.78 / 1.2 units with a metallic ridge rgb(84,78,96).
- Leaded decals (flowers, leaves, stars), white glint strokes, coloured additive light pools under props (trees, arches, candles, graves).
- Figures shatter into tumbling leaded shards when they disappear; impacts add a four-point glint star.
- Atmosphere: dark-violet vignette, lead window frame with gold #d9ad4e fillet, slowly drifting coloured diagonal light rays.
- UI: lead-bordered glass panels with gold fillet rings, gothic arch tops, mullioned bars; fonts Cinzel Decorative 900 + Cinzel with lead text-shadow outlines.
- Figures brighter/paler than the floor region; gold only for light sources. 360 world units visible vertically.
```
