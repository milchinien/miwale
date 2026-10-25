# Ukiyo-e Woodblock — Game Art Style Spec

> An Edo-period colour woodblock print in motion: bokashi colour blocks printed off-register, carved sumi key lines, washi fibres, seigaiha water.

Everything looks like a Hokusai or Hiroshige print that has started to move. Every shape is printed from blocks, exactly like a real woodblock print: a kinari paper underlay, flat colour blocks with **bokashi** gradients laid slightly **off-register**, and one **sumi key block** whose lines swell and thin like a carved line and grow heavier towards the lower right. Washi fibres show through every colour. The ground is a pale cream meadow with sage and ochre washes, moss and susuki fields, earth paths and Prussian-blue water with shore contour lines and **seigaiha** fans, crossed by stepped **kasumi** mist bands. The screen itself is framed like a print: an **ichimonji-bokashi** band along the top, a paper margin with a key-line border, a signature cartouche and a red **hanko** seal. The module's cast – a wandering traveller in a wide straw hat, kappa water imps, haunted paper lanterns and a club-carrying oni – shows how to apply it.

## At a glance

| | |
| --- | --- |
| Family | Print · Woodblock |
| Mood | serene, folkloric, elegant, playful, seasonal |
| Best for | folklore top-down action and adventure, calm travel games, Japanese-inspired RPGs and card games, story maps |
| Renderer | Canvas 2D, procedural, no image assets |
| Pixel art | No – native resolution, sprites baked at 3–7 px per world unit |
| Complexity | 6/10 – parts are quick to block out, but each needs a good split into colour blocks, bokashi and line weights |
| Fonts | Zen Antique, Shippori Mincho, Yuji Syuku |
| Key colours | paper `#f2e8d2`, sumi `#1e1b19`, Prussian `#24527e`, vermilion `#cf4a2c`, indigo `#2d4a72`, straw `#d8b264` |

## When to use it

Good fits:
- **Folklore and fantasy set in a stylised old Japan** – yokai, shrines, travellers, festivals.
- **Top-down action with crowds** – the black key line plus the pale ground keeps every figure readable, even 60+ at once.
- **Calm exploration, travel and seasonal games** – cherry blossom, maple and pine give natural seasonal palettes.
- **Card games, menus and story maps** – static frames look like real prints; the HUD kit is already a set of cartouches and seals.

Bad fits:
- **Sci-fi, neon or gritty modern settings** – the motifs and paper texture fight them.
- **Projects that need dynamic lighting** – there is no light model; light is printed into the blocks.
- **Very dark scenes** – the look lives on bright paper; a night version needs its own palette.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Kinari paper | `#f2e8d2` | Paper underlay of every part, panels; page margin `#efe4cb` |
| Unprinted paper | `#fbf5e6` | Flash state, eyes, petals, foam – the brightest tone |
| Sumi | `#1e1b19` | Key block: outlines, solid hair, text, borders |
| Meadow cream | `#eee4c7` | Main ground wash (~50 % of the screen) |
| Meadow sage | `#c7cf98` | Large soft bokashi patches in the meadow |
| Meadow ochre | `#e6cf96` | Warm bokashi patches in the meadow |
| Moss | `#96aa74` | Moss regions (edge `#688558`) |
| Susuki field | `#dec48a` | Dry grass field (edge `#c29650`) |
| Earth path | `#e7d4a8` | Paths (edge `#c2a372`) |
| Shallow water | `#a8c5c9` | Water at the shore |
| Prussian blue | `#24527e` | Water, ichimonji band, top bar, off-register text shadows |
| Prussian deep | `#1e456e` | Deepest water |
| Indigo | `#2d4a72` | Kimono (light `#5a7aa0`, deep `#1c3150`) |
| Vermilion | `#cf4a2c` | Sashes, torii, oni skin, crest rims, hurt tint (light `#e7845a`, deep `#9e321e`) |
| Seal red | `#c8402a` | Hanko seals and red slips in the HUD |
| Straw ochre | `#d8b264` | Straw hat, sandals, tiger skin (light `#eed79c`, deep `#a9813d`) |
| Pine green | `#3d5a45` | Pine pads, bamboo leaves (light `#748f61`, deep `#2a4031`) |
| Kappa green | `#5f9466` | Small creature (variants teal `#4b8a86`, olive `#7d8f48`) |
| Koban gold | `#d9a93b` | Collectibles, metal fittings, sparks (light `#f4d77e`, deep `#a47722`) |
| Sakura pink | `#f0c3c3` | Blossom crowns, petals (deep `#d58c97`) |
| Stone grey | `#8d918b` | Lanterns, statues, rocks (light `#c3c5b9`, deep `#5d6a76`) |
| Usuzumi | `#4b4f58` | Flat cast shadows at 15–24 % alpha, motion trails |

Palette rules:
- **Paper is the lightest value.** Pure white never appears; unprinted paper `#fbf5e6` is the brightest tone.
- **One bokashi per block.** Each coloured part has exactly one gradient between a light and a deep version of its hue.
- **Pale ground, saturated figures.** The meadow, moss and fields stay light and low in contrast; vermilion, indigo and Prussian blue belong to figures, gates and water.
- **Warm sumi.** Key lines are `#1e1b19`, never `#000`. Ground region edges use tinted lines (deep green, ochre, brown); only the water shore is sumi.
- **Accents have jobs.** Vermilion = seals, sashes, gates, danger. Gold = collectibles and small fittings.
- **Shadows are flat usuzumi ellipses.** No gradients, no blur.

## Typography

| Family | Weights | Role | Sample CSS |
| --- | --- | --- | --- |
| Zen Antique | 400 | Titles, clock, counters, floating numbers, seal numerals | `font: 400 40px/1 'Zen Antique', serif; letter-spacing: 2px; text-shadow: 2px 1.5px 0 rgba(36,82,126,.42);` |
| Shippori Mincho | 500–800 | Card names (800), body copy (600), captions (500) | `font: 800 20px/1.15 'Shippori Mincho', 'Yu Mincho', Georgia, serif;` |
| Yuji Syuku | 400 | Brush-hand labels, vertical red slips, hints | `font: 400 19px 'Yuji Syuku', serif; color: #9e321e;` |

All three are on Google Fonts (`Shippori+Mincho:wght@500;600;700;800`, `Zen+Antique`, `Yuji+Syuku`). The signature trick of the type: **every important number has an off-register colour copy** – a Prussian-blue or vermilion text shadow offset by about (2, 1.5) px, like a colour block that missed its key line. Short labels can run vertically (`writing-mode: vertical-rl`) in a red slip. Seals and cartouches never contain legible script – only abstract brush glyphs.

## Rendering technique

The whole style is one printing metaphor applied to everything:

1. **Paper underlay** – the part's shape filled with kinari paper `#f2e8d2`, unshifted.
2. **Colour block** – the same shape filled with a bokashi gradient, **translated by (+0.38, +0.30) world units**. This leaves a sliver of paper on the upper-left of every part and lets colour slip slightly past the line on the lower-right.
3. **Key block** – the outline drawn as a **stamped brush ribbon**: circles placed every `0.2 * width` along the polyline, all added to one path and filled once in sumi. Width varies along the line with `1 + 0.3 * (0.55 sin(0.85 s) + 0.45 sin(2.3 s))` and with the outward normal: `1 + 0.45 * (n · (0.6, 0.8))`, so lower-right edges are heavier. Open lines taper at both ends over `max(0.8, 2.4 * width)`.
4. **Washi fibres** – a 160 px tile of curved light and dark fibres composited `source-atop` over the finished sprite.

Parts are printed back to front, each with its own key line, so a front part cleanly covers the lines behind it. Shapes are Catmull-Rom splines through a handful of control points, sampled to dense polylines that both the fill and the ink stamps use.

Baked at init (K px per world unit, `K = clamp(round(display px per unit * 1.6), 3, 7)`): every pose of every figure, its **flash** copy (pixels whose luminance is above ~40–82 become unprinted paper, darker ones stay sumi – only the key block survives), the **hurt** copy of the main character (colour re-printed in a vermilion ramp), **dissolve** frames, all props, FX sprites and icons. Per frame: only `drawImage`, a few ellipse fills and transforms.

Draw order: ground chunks → ink pools → collectibles → shadows → y-sorted props and figures → orbiting crests → projectiles → particles → numbers → drifting petals → print frame (screen space).

## World and ground

The ground is a per-pixel shader cached in 256-unit chunks (up to 3 px per unit), built by a generator in 5 ms slices.

- **Fields on a 4-unit grid.** Four region fields (moss, susuki field, earth path, water) plus a tint noise and a line-wobble noise are sampled on a grid. Each region field is converted to an **approximate signed distance** in world units: `d = field / |gradient|` (central differences, clamped to ±60). Per pixel, distances are bilinearly interpolated.
- **Off-register regions.** Each pixel samples the region distance twice: at its own position for the **key line** and at `(x − 0.8, y − 0.6)` for the **colour** – the ground version of the misregistration.
- **Meadow base.** A ramp ochre `#e6cf96` → cream `#eee4c7` → sage `#c7cf98` driven by a 700-unit noise gives large soft bokashi patches.
- **Moss** (fbm 460, threshold 0.575): bokashi from edge `#688558` to inner `#96aa74` over 9 units; key line 0.6 units in deep green `#405a3a`.
- **Susuki field** (fbm 820, threshold 0.605): `#c29650` → `#dec48a` over 8 units; ochre line `#926c32`; brown arching grass strokes on top.
- **Earth path** (zero contour of a 1500-unit noise, ~22 units wide): `#c2a372` → `#e7d4a8` over 5 units; brown line `#7c5c3c`; pebbles and short dashes.
- **Water** (ponds at 620 units plus a winding river, suppressed within 260 units of the origin): depth bokashi `#a8c5c9` (0) → `#7aa3bc` (4) → `#406e97` (10) → `#27547f` (20) → `#1e456e` (34 units); **three paper contour lines** at 2.4 / 5.0 / 7.6 units from the shore (0.54 units wide, wobbling with noise); **seigaiha** in the deep part – fans of radius 7 units in rows 3.5 units apart, rings every 1.75 units, colour `rgb(132,170,198)` at 55 % fading in between 7 and 15 units of depth; a 0.96-unit sumi shore line.
- **Key lines wobble** ±45 % in width with a 26-unit noise, like a hand-cut block.
- **Fibres** – a 512 px luminance tile (0.5 units per texel) multiplies every ground pixel by `1 ± 0.05`.
- **Decals** (scattered on an 11-unit jittered grid, seamless across chunks): Hiroshige grass ticks – 3–4 tapered blades, 2.3–4.3 units long, clustered by a density noise – small red, white and pink five-dot flowers, fallen petals, maple leaves on moss, lily pads with lotus and paper ripple rings on water.
- **Kasumi bands** – drawn last: 2–3 stacked rounded bars, 110–190 units long and 9–13 tall, filled with a pale pink-to-cream bokashi (`#efd3c4` → `#f5ecda`) and one 1-unit brown outline around the union (stroke the whole path, then fill it on top). About one per 300 × 300 units.

## Characters

All figures face right when baked, feet at the sprite anchor; left-facing copies are mirrored.

**Main character – a wandering traveller** (about 25 units wide including the hat, 33 tall):
- A wide, shallow **sugegasa** straw cone: apex at −32.6, brim ±11.6 units at −24.2, bokashi `#f3dea4` → `#dcb76a` → `#b48a43`, 1.1-unit brim line, seven radial straw lines in brown `#6b5330`, an inner brim line in deep ochre.
- A small face peeking out under the brim (skin `#efd5ae` → `#d8b387`) with a slit eye, a short nose line and a faint blush dot.
- An **indigo kimono** tucked up for walking (`#5a7aa0` → `#1c3150`), woven with paper-white **kasuri** crosses, a white under-collar and a **vermilion sash** with an ochre stripe.
- Wide sleeves that swing with the stride, pale indigo leggings, straw sandals with red thongs, a black lacquered scabbard pointing back with a gold end cap, a wrapped hilt with a gold guard, and a cream travel bundle with indigo dots on the back.
- Poses: idle, four walk poses (stride, passing, stride, passing) and a thrust pose with the front sleeve forward.

**Small creature – kappa** (radius 9, about 20 × 24 units): a round green body (`#8fb886` → `#3a684a`; teal and olive variants), a brown turtle shell on the back with hex lines, a cream belly plate with segment lines, an ochre duck-like beak, one big paper eye with a sumi pupil, a heavy brow, a **solid black spiky hair fringe** and a pale water dish on top. Four waddle poses.

**Fast creature – chochin-obake** (radius 7, about 15 × 23 units, floating 5 units up): a barrel-shaped paper lantern with horizontal cylinder shading (`#cf9450` edges → `#f8ecd2` centre) and a warm ochre glow wash inside, curved sumi ribs, black lacquer rims with vermilion bands and a wire handle, a torn mouth with a long lolling vermilion tongue (four sway frames), one big eye and one squint.

**Large creature – oni** (radius 17, about 44 × 60 units): a vermilion body (`#e5835c` → `#c9472f` → `#8c2a1b`, radial bokashi; a Prussian-blue variant `#76a0c2` → `#22446a`), a wild black mane, ivory horns, gold eyes under solid black brows, a dark open mouth with ivory fangs, a **tiger-skin loincloth** (ochre with tapered sumi stripes), gold armlet and anklet, and an **upright studded iron club** held in front.

Rules:
- Outer silhouette lines 0.95–1.35 units, limbs 0.5–0.7, interior details 0.25–0.6 – the silhouette always reads first.
- Filled sumi areas (hair, mane, brows, lacquer) anchor small figures in a crowd.
- One hue family per creature type, so mixed groups stay readable.
- **Flash** – only the key block printed, colour blocks become unprinted paper; overlaid at `min(1, flash * 1.4)` with a slight squash.
- **Hurt** – colour blocks re-printed in vermilion, a 1.1-unit shake and a vermilion edge bokashi on screen.
- **Dash** – three usuzumi-grey after-images 7 units apart and a 0.12 rad lean.
- **Appear** – kappa and oni rise out of an ink pool (sumi or Prussian blue) with two ripple rings: the top part of the sprite is revealed bottom-up over 0.8 of the appear time. Lanterns fade and scale in.
- **Dissolve** – a 0.16 flash pop, then three baked frames where the sheet burns away from the top along noise, with a sumi rim and a thin vermilion ember line, the remaining colour fading towards paper.

## Props

Printed with the same three passes; mirrored for variety; flat usuzumi shadows at 20 %.

| Prop | Size (units) | Notes |
| --- | --- | --- |
| Pine (2) | ~59 × 73 | Ribbon trunk with bark arcs, branches to 5 flat cloud-like pads (lumpy top, flattened underside), bokashi `#748f61` → `#2a4031`, fan-shaped needle clusters printed inside |
| Maple (2) | ~44 × 57 | Short trunk, 4 lumpy lobes with bokashi (red `#ef9558` → `#8c2a1a` or gold `#f3cd68` → `#9c6a22`), star-shaped leaf prints |
| Cherry (2) | ~56 × 58 | Gnarled dark trunk, 5 pink cloud lobes `#fbe4e2` → `#dc97a0`, five-dot blossoms |
| Shrine (2) | 20 × 36 / 12 × 21 | Stone toro lantern with a glowing window; jizo statue with a vermilion bib and cap |
| Torii gate | 60 × 47 | Vermilion pillars and beams with horizontal bokashi, black bases, a curved black kasagi top beam |
| Stone (3) | up to 34 × 19 | Lumpy garden rocks, bokashi light upper-left to deep lower-right, short diagonal brush strokes, moss dots |
| Bamboo | 34 × 66 | Five stalks with node ticks, 16 lance leaves |
| Reeds | 34 × 26 | Arching susuki blades with fluffy cream-to-ochre plumes |

Rules: bokashi is light at the top and deep at the bottom; foliage blocks carry pattern prints clipped inside the block; trees, bamboo and reeds sway by skewing around the base (0.018–0.05 rad at 1.2 rad/s); placement follows the terrain (pines everywhere, cherries and shrines on the meadow, maples and bamboo on moss, reeds on the field, shrines and gates along paths, only stones in water).

## Effects and particles

- **Ink crescent projectile** – a brushed crescent (about 4 × 12 units) of sumi over an off-register vermilion block, two dashed dry-brush gaps cut out, a 22-unit tapered dry-brush trail that fades to nothing, a small flat shadow 7 units below.
- **Ink splash impact** – a baked splat (lumpy blot r 2.5 plus 8 tapered droplets) at the impact height for 0.22 s, plus two ink drops under gravity. Vermilion splat for hurts, Prussian-blue splat for water creatures.
- **Kumo smoke burst** – 4–8 stylised cloud puffs (overlapping paper discs with grey bokashi, sumi outlines and spiral curls) pop out with `outBack`, drift, rise 8 units and fade over 0.55–0.75 s. Accents per creature: a **Hokusai wave crest** with paper foam claws and blue drops (kappa), burning **paper scraps** and embers (lantern), a burst of **maple leaves** and an **ensō** ring (oni).
- **Orbiting crest** – a mitsudomoe disc (r 6.5): vermilion rim, cream field, three black commas, spinning at 6 rad/s, with a fading usuzumi wind trail of its last 8 positions.
- **Collectibles** – small gold **koban** (5.4 × 7.4 units) with stamped lines; large **oban** (7.6 × 10.4) with a red seal stamp. Both bob, turn around their vertical axis (x-scale 0.3–1) and the large one twinkles with a gold four-point spark.
- **Glow-up** – a brushed **ensō** circle (r 18, width 3.2, dry-brush gaps) laid flat on the ground expands and fades, with 18 sakura petals and 6 gold sparks.
- **Petals** – flutter with a cosine flip of the y-axis, gravity 70, drag 2.6, life 1–2 s.
- **Floating numbers** – Zen Antique, 9 units (accent 12.5): sumi with a paper outline; accent numbers vermilion with a sumi outline and an off-register indigo copy.

## Atmosphere and lighting

There is no light model – everything is printed.
- **Ichimonji-bokashi band**: 9.5 % of the screen height along the top, `rgba(22,52,88,.88)` → `rgba(36,82,126,0)`, with 46 faint wavy wood-grain streaks cut out. Built once per screen size.
- **Print margin**: 10 px per 900 px of height in `#efe4cb`, with a 2.4 px sumi border line just inside.
- **Signature cartouche + seal** in the lower right: a 24 × 104 px slip with four abstract brush marks and a 27 px vermilion seal with paper glyph strokes (sizes per 900 px of height).
- **Hurt**: a low-res vermilion edge bokashi (transparent centre → `rgba(158,50,30,.8)`) stretched over the screen at up to 85 % alpha.
- **Drifting petals and leaves**: about 40 % of 110-unit cells carry one, crossing diagonally over 7–15 s, falling from 29 units height, fading with `sin(phase)`, with a tiny shadow.
- **Shadows**: one flat usuzumi ellipse per object, offset (+0.5, +0.35) units.
- No vignette, bloom, fog or colour grading.

## UI

The HUD is a set of paper slips and seals:
- **Panels** – paper `#f4ead4` with faint fibre gradients and a **double sumi rule**: a 2–3 px outer border, a 3 px paper gap, a 1.5 px inner line (`inset` box-shadows).
- **Bars** – paper troughs with the same double rule; fills are vertical bokashi (top bar Prussian `#173a5e` → `#7ea6c4`, life bar vermilion `#8e2a1a` → `#e8906a`) with a dark inner edge at the fill end.
- **Title cartouche** – the clock in Zen Antique 40 px with an off-register Prussian shadow, beside a **vertical red slip** label in Yuji Syuku.
- **Counter** – a vertical cartouche: icon above number.
- **Seals (hanko)** – 30–42 px vermilion squares with a thin inner paper frame, slightly rotated, holding Zen Antique numerals or abstract glyphs (drawn with gradients).
- **Cards** – tall paper prints (232 × 318) with a triple frame, a coloured bokashi band at the top (Prussian, vermilion, pine), a round **mon disc** icon (paper with a double ring), a yellow title slip (`#f4e2a6` → `#e9cf88`) with its own double line, and a seal for the key number.
- **Overlay** – a warm paper wash with a faint vermilion bokashi at the bottom and `sepia(.4) saturate(.75)` on the backdrop.
- **Icons** – printed with the same toolkit in a 48-unit box: a red camellia, an oni mask, a katana with a vermilion splash, crescents with speed lines, a wave crest, the crest disc, a straw sandal, a lucky rake with koban, a sake gourd.

```css
.panel { background: repeating-linear-gradient(17deg, rgba(120,96,60,.05) 0 1px, transparent 1px 7px), #f4ead4;
  border: 2.5px solid #1e1b19; box-shadow: inset 0 0 0 3px #f4ead4, inset 0 0 0 4.5px #1e1b19, 0 8px 16px rgba(30,27,25,.3); }
.bar > .fill { background: linear-gradient(180deg, #8e2a1a 0%, #cf4a2c 45%, #e8906a 100%); }
.seal { background: #c8402a; box-shadow: inset 0 0 0 2px #c8402a, inset 0 0 0 3.2px rgba(247,238,219,.9); transform: rotate(-5deg); }
```

## Motion and animation

- Main character: 4 walk poses at `phase = distance * 0.13` cycles, bob `|sin(2π phase)|` × 1 unit, sway 0.025 rad; idle breathing ±1.5 %; a thrust pose while standing and throwing; a 5-unit hop when glowing up.
- Kappa: 4 poses at `anim * 0.36`, bob 0.9 units, tilt 0.07 rad. Oni: 4 poses at `anim * 0.3`, 5 % squash on contact, tilt 0.03 rad.
- Lanterns: 4 tongue frames at 6 fps, float 5 ± 1.8 units, lean with speed (0.16 rad) plus a 0.05 rad swing.
- Appear 0.45 s (rise out of the pool), flash fades at 7/s, dissolve 0.35 s.
- Puffs 0.55–0.75 s, splats 0.22–0.4 s, ensō 0.6–1.4 s, petals 1–2 s.
- Trees and reeds sway; petals flip with `cos(3.4 t)`; the crest spins at 6 rad/s.

## Do and don't

Do:
- Print every part in three passes: paper underlay, off-register bokashi block, stamped key line.
- Make key lines heavier on the outer silhouette and the lower-right side; taper open lines.
- Build with classic ukiyo-e motifs: seigaiha, kasumi bands, pine pads, maple stars, torii, mon crests, seals.
- Keep the ground pale so figures read in crowds.
- Let washi fibres show through every block, HUD panels included.
- Bake once; derive flash, hurt and dissolve per pixel.
- Frame the screen like a print.

Don't:
- Outline with constant-width canvas strokes – that reads as vector cartoon.
- Add soft shadows, glows, highlights or blur inside shapes.
- Use pure black or pure white.
- Stack two gradients on one block.
- Put legible script into seals or cartouches.
- Saturate the ground or use black lines on every ground edge.
- Register colour perfectly on the line.

## Implementation recipe

1. Write the toolkit: `spline()` (Catmull-Rom → polyline), `ell()`, `capsule()`, `ink()` (stamped ribbon) and `part()` (underlay + shifted bokashi block + ink).
2. Bake a 160 px fibre tile; apply it `source-atop` at the end of every bake.
3. Draw each figure back to front with `part()`; use filled sumi for hair and lacquer; add interior lines with open `ink()` calls.
4. Bake every pose at K px per unit, mirror for the other facing, derive flash / hurt / dissolve copies by remapping pixels by luminance.
5. Ground: sample region fields on a 4-unit grid, convert to distances `f / |∇f|`, then per pixel pick colours by depth (bokashi), draw key lines where `|d| < half width`, sample colour off-register, add seigaiha and contour lines in water, multiply fibres.
6. Bake decals on top, then kasumi bands (stroke the union, then fill).
7. Per frame: shadows, y-sorted `drawImage`, particles from baked FX sprites, then the cached print frame.
8. Skin the HUD with double-rule paper panels, bokashi bar fills, red slips and seals.

## Code

The stamped key line – the heart of the look:

```js
function ink(ctx, pts, w, closed) {
  let area = 0;
  for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; area += p[0] * q[1] - q[0] * p[1]; }
  const sg = area >= 0 ? 1 : -1, segs = closed ? pts.length : pts.length - 1, step = w * 0.2;
  let total = 0;
  for (let i = 0; i < segs; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; total += Math.hypot(q[0] - p[0], q[1] - p[1]); }
  ctx.beginPath();
  let s = 0, next = 0;
  for (let i = 0; i < segs; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length], L = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (!L) continue;
    const tx = (q[0] - p[0]) / L, ty = (q[1] - p[1]) / L;
    const shade = closed ? sg * ty * 0.6 - sg * tx * 0.8 : 0;          // outward normal · lower-right
    for (; next <= s + L; next += step) {
      const x = p[0] + tx * (next - s), y = p[1] + ty * (next - s);
      let k = (1 + 0.3 * (0.55 * Math.sin(next * 0.85) + 0.45 * Math.sin(next * 2.3))) * (1 + 0.45 * shade);
      if (!closed) k *= Math.min(1, 0.2 + 0.8 * Math.min(next, total - next) / (w * 2.4));
      const r = Math.max(0.04, w * k / 2);
      ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2);
    }
    s += L;
  }
  ctx.fillStyle = '#1e1b19';
  ctx.fill();
}
```

One printed part – paper underlay, off-register bokashi block, key line:

```js
function part(ctx, pts, light, deep, y0, y1, lineW) {
  const path = (c) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const p of pts) c.lineTo(p[0], p[1]); c.closePath(); };
  path(ctx); ctx.fillStyle = '#f2e8d2'; ctx.fill();                  // paper underlay
  ctx.save(); ctx.translate(0.38, 0.30);                              // misregistration
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, light); g.addColorStop(1, deep);                  // one bokashi per block
  path(ctx); ctx.fillStyle = g; ctx.fill();
  ctx.restore();
  ink(ctx, pts, lineW || 0.95, true);                                 // key block
}
```

Hit flash derived from the baked sprite – only the key block stays:

```js
function flashCopy(src) {
  const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  const x = c.getContext('2d'); x.drawImage(src, 0, 0);
  const img = x.getImageData(0, 0, c.width, c.height), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const l = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
    const t = Math.min(1, Math.max(0, (l - 40) / 42));              // 0 = ink, 1 = colour block
    d[i] = 30 + (251 - 30) * t; d[i + 1] = 27 + (245 - 27) * t; d[i + 2] = 25 + (230 - 25) * t;
  }
  x.putImageData(img, 0, 0);
  return c;
}
```

Seigaiha in a pixel shader – distance to the centre of the fan that covers a point:

```js
function seigaiha(x, y, R) {                 // fans of radius R, rows R/2 apart, odd rows shifted by R
  const H = R / 2;
  let j = Math.floor((y + R) / H);
  for (let k = 0; k < 6; k++, j--) {         // lowest row first: lower rows cover upper ones
    const yc = j * H, xs = j & 1 ? R : 0;
    const cx = xs + Math.round((x - xs) / (2 * R)) * 2 * R;
    const d = Math.hypot(x - cx, y - yc);
    if (d < R) return d;                     // ring line where d is near a multiple of R / 4
  }
  return R;
}
```

## Adapting it to your project

- **Other subjects**: any figure works if you split it into a few big colour blocks with clear bokashi directions and give it one solid sumi area (hair, hat band, lacquer). Animals, samurai, merchants, foxes and tanuki fit naturally.
- **Seasons**: swap the crown palettes (pink sakura → green summer → red maple → snow white with Prussian shadows) and the drifting particles (petals → fireflies → leaves → snow).
- **Night**: darken the ground washes with a Prussian multiply, keep the paper underlay, make lanterns and windows the light sources – still printed as ochre washes, never glows.
- **Side view**: the motifs come from landscape prints, so a side-scroller works even better – stack kasumi bands, a Mount-Fuji silhouette with bokashi, and a Hokusai wave foreground.
- **Pixel art version**: keep the block logic (paper sliver, one gradient as 2–3 dithered steps, black key line) on a low-res grid.
- **Line weight**: scale all key-line widths with sprite size, but keep the 3 : 1 ratio between silhouette and interior lines.

## Performance notes

- Init bakes about 100 sprite canvases in 0.4 s (K = 4) to 0.9 s (K = 7); the stamped key lines are the main cost. Bake once and reuse.
- Flash, hurt and dissolve variants are pixel remaps of baked sprites – much cheaper than re-drawing.
- Ground chunks (256 units, up to 768 × 768 px) cost 40–60 ms each and are built by a generator in 5 ms slices; pixels far outside every region skip the region maths.
- Per frame: chunk blits, one ellipse fill per shadow, one `drawImage` per figure or particle, a handful of drifting petals and the cached print frame (one band image, four rects, one border stroke, one signature image). With 60–80 figures on screen, drawing takes about 1 ms at 1600 × 900.
- Avoid `ctx.filter` and per-frame gradients; all bokashi is baked.

## Copy-paste prompt

```text
Use the Ukiyo-e Woodblock art style for my project: an Edo-period colour woodblock print in motion
(Hokusai / Hiroshige feel), drawn procedurally with Canvas 2D, no image assets.
- Print every shape in three passes: kinari paper underlay #f2e8d2, a flat colour block with ONE bokashi
  gradient shifted off-register by (+0.38, +0.30) units, then a sumi #1e1b19 key line.
- Key lines are stamped brush ribbons (circles along the outline in one path): silhouette 0.95-1.35 units,
  interior 0.25-0.6, swelling +-30 % along the line and heavier on the lower-right; open lines taper.
- Washi fibres show through every sprite (fibre tile drawn source-atop); no pure black or white.
- Palette: indigo #2d4a72, vermilion #cf4a2c, straw ochre #d8b264, Prussian blue #24527e, pine #3d5a45,
  sakura #f0c3c3, gold #d9a93b, ground cream #eee4c7 / sage #c7cf98 / ochre #e6cf96.
- Ground: pale meadow with soft bokashi patches, moss and dry-grass regions with tinted key lines,
  water with depth bokashi, paper contour lines along the shore and seigaiha fans in the deep, Hiroshige
  grass ticks and stepped kasumi mist bands.
- Motifs: wide straw hats, kasuri crosses, pines with flat needle pads, maples, cherry blossom, torii,
  stone lanterns, mitsudomoe crests, gold koban, ink splashes, kumo smoke curls, ensō rings, falling petals.
- Frame the screen like a print: Prussian ichimonji-bokashi band at the top, paper margin, key-line border,
  signature cartouche with abstract brush marks and a red seal.
- UI: paper slips with double sumi rules, bokashi bar fills, vertical red slips, hanko seals; fonts
  Zen Antique (numbers, titles), Shippori Mincho (body), Yuji Syuku (labels).
- Flat usuzumi shadow ellipses only; no glows, blur or rendered light.
```
