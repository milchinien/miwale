# Ukiyo-e Woodblock — Game Art Style Spec

> An Edo-period colour woodblock print in motion: bokashi colour blocks printed off-register, carved sumi key lines, washi fibres, seigaiha water.

Everything looks like a Hokusai or Hiroshige print that has started to move. Every shape is printed from blocks, exactly like a real woodblock print: a kinari paper underlay, flat colour blocks with **one bokashi** gradient each laid slightly **off-register**, and one **sumi key block** whose lines swell, taper and grow heavier towards the lower right. Washi fibres show through every colour. The ground is a composed landscape print: a cream-to-ochre meadow whose bokashi follows the land (sage skirts around moss, a celadon breath along the water), susuki fields, earth roads lined with **Tokaido avenues** of pines or cherries, torii and stone lanterns at the roadside, and Prussian-blue water with paper contour lines, **seigaiha** fans and slow ripple rings. Figures move on held poses like hand-printed animation, and every hit, death and appearance is a printed event: a paper-white impact star with carved speed lines, a figure cut in two along a vermilion-cored slash, a paper lantern folding flat while it burns, a creature rising out of an ink pool. The screen is framed like a print: an **ichimonji-bokashi** band along the top, a paper margin with a key-line border, a signature cartouche and a red **hanko** seal. The module's cast – a wandering traveller in a wide straw hat, kappa water imps, haunted paper lanterns and a club-carrying oni – shows how to apply it.

## At a glance

| | |
| --- | --- |
| Family | Print · Woodblock |
| Mood | serene, folkloric, elegant, playful, seasonal |
| Best for | folklore top-down action and adventure, calm travel games, Japanese-inspired RPGs and card games, story maps |
| Renderer | Canvas 2D, procedural, no image assets |
| Pixel art | No – native resolution, sprites baked at 3–7 px per world unit |
| Complexity | 7/10 – parts are quick to block out, but each needs a good split into colour blocks, bokashi, line weights and a pose table |
| Fonts | Zen Antique, Shippori Mincho, Yuji Syuku |
| Key colours | paper `#f2e8d2`, sumi `#1e1b19`, Prussian `#24527e`, vermilion `#cf4a2c`, indigo `#2d4a72`, straw `#d8b264` |

## When to use it

Good fits:
- **Folklore and fantasy set in a stylised old Japan** – yokai, shrines, travellers, festivals, the old highway.
- **Top-down action with crowds** – the black key line plus the pale ground keeps every figure readable, even 60+ at once.
- **Calm exploration, travel and seasonal games** – cherry blossom, maple and pine give natural seasonal palettes; roads with tree avenues give the map direction.
- **Card games, menus and story maps** – static frames look like real prints; the HUD kit is already a set of cartouches and seals.

Bad fits:
- **Sci-fi, neon or gritty modern settings** – the motifs and paper texture fight them.
- **Projects that need dynamic lighting** – there is no light model; light is printed into the blocks.
- **Very dark scenes** – the look lives on bright paper; a night version needs its own palette.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Kinari paper | `#f2e8d2` | Paper underlay of every part, panels; page margin `#efe4cb` |
| Unprinted paper | `#fbf5e6` | Flash state, eyes, petals, impact star, foam – the brightest tone |
| Sumi | `#1e1b19` | Key block: outlines, solid hair, speed lines, text, borders |
| Meadow cream | `#eee4c7` | Main ground wash (~45 % of the screen) |
| Meadow ochre | `#e6cf96` | Warm low-frequency bokashi in the meadow |
| Meadow sage | `#c7cf98` | Skirt spreading 30 units out from every moss edge |
| Shore celadon | `#d6e0ce` | Pale skirt 18 units wide along every shore |
| Moss | `#96aa74` | Moss regions (edge `#688558`) |
| Susuki field | `#dec48a` | Dry grass field (edge `#c29650`) |
| Earth road | `#e7d4a8` | Roads (edge `#c2a372`) |
| Shallow water | `#a8c5c9` | Water at the shore |
| Prussian blue | `#24527e` | Water, ichimonji band, top bar, ink pools, off-register text shadows (light `#7ea6c4`, deep `#173a5e`) |
| Prussian deep | `#1e456e` | Deepest water |
| Indigo | `#2d4a72` | Kimono (light `#5a7aa0`, deep `#1c3150`) |
| Vermilion | `#cf4a2c` | Sashes, torii, oni skin, crest rims, impact heart, cut core, hurt tint (light `#e7845a`, deep `#9e321e`) |
| Seal red | `#c8402a` | Hanko seals and red slips in the HUD |
| Straw ochre | `#d8b264` | Sandals, tiger skin, plumes (light `#eed79c`, deep `#a9813d`) |
| Pine green | `#3d5a45` | Pine pads, avenue pines, bamboo leaves (light `#748f61`, deep `#2a4031`) |
| Kappa green | `#5f9466` | Small creature (variants teal `#4b8a86`, olive `#7d8f45`) |
| Koban gold | `#d9a93b` | Collectibles, pickup ring, fittings, sparks (light `#f4d77e`, deep `#a47722`) |
| Sakura pink | `#f0c3c3` | Blossom crowns, petals, petal carpets (deep `#d58c97`) |
| Stone grey | `#8d918b` | Lanterns, statues, rocks (light `#c3c5b9`, deep `#5d6a76`) |
| Usuzumi | `#4b4f58` | Flat cast shadows at 15–24 % alpha, after-images, motion trails |

Palette rules:
- **Paper is the lightest value.** Pure white never appears; unprinted paper `#fbf5e6` is the brightest tone.
- **One bokashi per block.** Each coloured part has exactly one gradient between a light and a deep version of its hue.
- **Pale ground, saturated figures.** The meadow, moss and fields stay light and low in contrast; vermilion, indigo and Prussian blue belong to figures, gates and water. Check a desaturated screenshot: the indigo traveller is the darkest, clearest mass on screen.
- **Ground tints follow the land.** Sage appears only as a skirt around moss, celadon only along water; the broad ochre ↔ cream wash is the only free variation.
- **Warm sumi.** Key lines are `#1e1b19`, never `#000`. Ground region edges use tinted lines (deep green, ochre, brown); only the water shore is sumi.
- **Accents have jobs.** Vermilion = seals, sashes, gates, impacts, danger. Gold = collectibles and small fittings.
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

Baked at init (K px per world unit, `K = clamp(round(display px per unit * 1.6), 3, 7)`): every pose of every figure (about 270 canvases including mirrored copies), its **flash** copy (pixels whose luminance is above ~40–82 become unprinted paper, darker ones stay sumi – only the key block survives), the **hurt** copy of the main character (colour re-printed in a vermilion ramp), three **burn** frames per creature variant, all props with their **ground stamps**, FX sprites and icons. Per frame: only `drawImage`, a few ellipse fills and transforms.

Draw order: ground chunks → water ripples → ink pools → collectibles → shadows and prop ground stamps → y-sorted props and figures → orbiting crests → projectiles → particles (in emit order) → numbers → drifting petals → print frame (screen space).

## World and ground

The ground is a per-pixel shader cached in 256-unit chunks (up to 3 px per unit), built by a generator in 5 ms slices. It is composed like a landscape print: large calm areas, regions with designed edges, and detail clustered where the land changes.

- **Fields on a 4-unit grid.** Four region fields (moss, susuki field, earth road, water = ponds ∪ river) plus a wash noise and a line-wobble noise are sampled on a grid. Each region field is converted to an **approximate signed distance** in world units: `d = field / |gradient|` (central differences, clamped to ±60). Per pixel, distances are bilinearly interpolated.
- **Off-register regions.** Each pixel samples the region distance twice: at its own position for the **key line** and at `(x − 0.8, y − 0.6)` for the **colour** – the ground version of the misregistration.
- **Meadow wash.** A 700-unit noise smoothsteps between ochre `#e6cf96` and cream `#eee4c7`. Then two **bokashi skirts driven by distance**: sage `#c7cf98` up to 80 % within 30 units of any moss edge, celadon `#d6e0ce` up to 60 % within 18 units of water. Colour change therefore always announces a region – no free-floating blotches, no light halos between patches.
- **Moss** (fbm 460, threshold 0.575): bokashi from edge `#688558` to inner `#96aa74` over 9 units; key line 0.6 units in deep green `#405a3a`.
- **Susuki field** (fbm 820, threshold 0.605): `#c29650` → `#dec48a` over 8 units; ochre line `#926c32`.
- **Earth road** (zero contour of a 1500-unit noise, ~22 units wide): `#c2a372` → `#e7d4a8` over 5 units; brown line `#7c5c3c`; two trodden ruts 4.6 units in from each verge.
- **Plank bridges** where a road crosses water: planks 2.5 units wide following the road tangent (from the signed road field's gradient) with dark seams, vermilion rails `#cf4e2e` with sumi posts every 7.5 units, dark end beams and a deck shadow on the water.
- **Water** (ponds at 620 units plus a winding river, kept 260 units from the origin): depth bokashi `#a8c5c9` (0) → `#7aa3bc` (4) → `#406e97` (10) → `#27547f` (20) → `#1e456e` (34 units); **three paper contour lines** `#e9efe9` at 2.4 / 5.0 / 7.6 units from the shore (wobbling with noise); **seigaiha** in the deep part – fans of radius 7 units in rows 3.5 units apart, rings every 1.75 units, colour `#84aac6` at 55 % fading in between 7 and 15 units of depth; a 0.96-unit sumi shore line.
- **Key lines wobble** ±45 % in width with a 26-unit noise, like a hand-cut block.
- **Fibres** – a 512 px luminance tile (0.5 units per texel) multiplies every ground pixel by `1 ± 0.05`.

**Decals** are baked on top from a 9-unit jittered grid, but placed by **region distance**, never evenly:
- Meadow grass ticks (3–4 tapered blades) only in **tight clumps** – a 46-unit noise, top ~15 %, up to 70 % fill inside a clump – and in **skirts along every edge** (moss 17, water 12, field 10, road 7 units, density rising towards the edge). Open paper stays open.
- **Flower patches** with one colour each (vermilion `#d0573d`, paper white or pink, chosen by a 170-unit noise) inside clumps.
- On moss: darker fringe grass along the rim, single fallen maple leaves deep inside.
- On fields: susuki plumes and dry strokes in drifts.
- On roads: pebbles on the verges.
- In water: reeds in the shallows where a noise allows, **lily colonies** 3.5–13 units from the shore (some with a lotus), single ripple rings in the deep.

## Characters

All figures face right when baked, feet at the sprite anchor; left-facing copies are mirrored. Actors vary in scale by ±6 % and in colour variant by seed.

**Main character – a wandering traveller** (about 23 units wide including the hat, 33 tall):
- A wide, shallow **sugegasa** straw cone: apex at −32.6, brim ±11.6 units at −24.2, bokashi `#ecc775` → `#cf9e4f` → `#94672b` (mid-value, so it reads on the pale meadow), a 1.15-unit key line, seven radial straw lines `#5a4122`, an inner brim line and a pale straw band.
- A small face under the brim (skin `#efd5ae` → `#d8b387`) with a dot eye with a paper glint, a brow, a short nose and a faint blush; the eye closes to a curved line for blinks and the recoil pose.
- An **indigo kimono** tucked up for walking (`#3b5b86` → `#15253d`), woven with paper-white **kasuri** crosses, a white under-collar and a **vermilion obi** with an ochre cord.
- Square traveller's sleeves with pale cuff linings and the hand showing at the cuff, white leggings bound with sumi cords, straw sandals with vermilion straps, a black lacquered scabbard pointing back with a gold end cap, a wrapped hilt with a gold guard, a cream travel bundle with indigo dots, and **two vermilion hat cords** behind the neck.
- 15 baked poses: 8 walk, 2 breathing idles, blink, throw release, throw follow-through, dash lunge, hurt recoil.

**Small creature – kappa** (radius 9, about 20 × 24 units): a round green body (`#8fb886` → `#3a684a`; teal `#4b8a86` and olive `#7d8f45` variants), a brown turtle shell on the back with plate lines, a cream belly plate with segment lines, an ochre beak, one big paper eye with a sumi pupil, a heavy brow, a **solid black spiky hair fringe** and a pale water dish on top. Four waddle poses (feet planted, lifted, planted, other foot lifted).

**Fast creature – chochin-obake** (radius 7, about 15 × 23 units, hovering 5 units up): a barrel-shaped paper lantern with horizontal cylinder shading (`#cf9450` edges → `#f8ecd2` centre) and a warm ochre glow wash inside, curved sumi ribs, black lacquer rims with vermilion bands and a wire handle, a torn mouth with a long lolling tongue (four sway frames), one big eye and one squint.

**Large creature – oni** (radius 17, about 44 × 60 units): a vermilion body (`#e5835c` → `#c9472f` → `#8c2a1b`, radial bokashi; a Prussian-blue variant `#76a0c2` → `#3f6c96` → `#22446a`), a wild black mane, ivory horns, gold eyes under solid black brows, a dark open mouth with ivory fangs, a **tiger-skin loincloth** (ochre with tapered sumi stripes), gold armlet and anklet, and an **upright studded iron club** held in the front fist. Four heavy stomping poses.

Rules:
- Outer silhouette lines 0.95–1.35 units, limbs 0.5–0.7, interior details 0.25–0.6 – the silhouette always reads first.
- Filled sumi areas (hair, mane, brows, lacquer) anchor small figures in a crowd.
- One hue family per creature type, so mixed groups stay readable.
- **Flash** – only the key block printed; colour blocks become unprinted paper.
- **Hurt** – colour blocks re-printed in vermilion, recoil pose, a shake and a vermilion edge bokashi on screen.
- **Appear, hit and death** are designed sequences (see Motion) – never a plain fade.

## Props

Printed with the same three passes; mirrored for variety. Each prop stands on its own **ground stamp** – a baked canvas with the flat usuzumi shadow (about 20 %) and the prop's own litter spread in a Gaussian carpet – drawn in the shadow pass under everything that stands.

| Prop | Size (units) | Notes | Ground stamp |
| --- | --- | --- | --- |
| Pine (2) | ~59 × 73 | Ribbon trunk with bark arcs, branches to flat cloud-like pads (lumpy top, flat underside), bokashi `#748f61` → `#2a4031`, fan-shaped needle clusters printed inside | needles and two-tone cones |
| Maple (2) | ~44 × 57 | Short trunk, lumpy lobes with bokashi (red `#ef9558` → `#8c2a1a` or gold `#f3cd68` → `#9c6a22`), star-shaped leaf prints | 18 fallen leaves in the crown colours |
| Cherry (2) | ~56 × 58 | Gnarled dark trunk, 5 pink cloud lobes `#fbe4e2` → `#dc97a0`, five-dot blossoms | a carpet of 46 petals |
| Shrine (2) | 20 × 36 / 12 × 21 | Stone toro lantern with a lit window; jizo statue with a vermilion bib and cap | raked gravel bed with two rake rings |
| Torii gate | 60 × 47 | Vermilion pillars and beams with horizontal bokashi, black bases, a curved black kasagi top beam | two stone footings |
| Stone (3) | up to 34 × 19 | Lumpy garden rocks, bokashi light upper-left to deep lower-right, short diagonal brush strokes, moss dots | grass tufts and pebbles |
| Bamboo (2) | 34 × 66 | A mature grove of five culms / a young leaning clump of three with a striped shoot, node ticks, lance leaves | fallen lance leaves |
| Reeds (2) | 34 × 34 | Shore cattails with velvet heads / susuki with cream-to-ochre plumes | ripple rings (shore version) |

Rules:
- Bokashi is light at the top and deep at the bottom; foliage blocks carry pattern prints clipped inside the block.
- Trees, bamboo and reeds sway by skewing around the base (0.018–0.05 rad at 1.2 rad/s, per-prop phase).
- **Placement is composed** – every prop belongs to a feature of the land:
  - **Tokaido avenues**: stretches of road lined on both verges with one tree kind (pines or cherries chosen by a 900-unit noise), 7–13 units from the road centre on a 30-unit planting grid with gaps where a 520-unit avenue noise drops.
  - Stone lanterns and jizo at the roadside; a **torii astride straight north-south road stretches**, flanked by two stone lanterns 27 units to each side.
  - Reeds on shores, pines on moss rims, bamboo groves and maples inside moss, susuki and maples on fields, single rocks in ponds, a few lone stones and cherries in the open meadow.
- The spawn area (95 units around the origin) and bridges stay clear.

## Effects and particles

Every effect is printed in the medium – ink, paper, gold leaf, petals – and layered: core → main shape → secondary debris → residue, each with its own lifetime and easing.

- **Ink crescent projectile** – a brushed crescent (about 4 × 12 units) of sumi over an off-register vermilion block, two dashed dry-brush gaps cut out, a 22-unit tapered dry-brush trail that fades to nothing, a small flat shadow 7 units below.
- **Layered impact** – placed on the side of the figure that took the blow:
  1. an ink splat underneath (0.26 s, grows from 55 % to 105 % in the first 20 %, fades after 55 %);
  2. a jagged **nine-point paper-white star** with a 0.62-unit key line and an off-register vermilion heart (0.15 s; snaps open from 50 % to 115 % in 60 ms with `outQuad`, then shrinks while it fades);
  3. **three carved speed lines** – sumi wedges thrown along the knock-back direction ±0.6 rad, 6–9 units long (9–12 on the large creature); they shoot out with `outQuad` and are eaten from the inside with `inQuad` (0.2 s);
  4. two ink drops (vermilion for the orbiting crest) that fall under gravity and land.
- **Kumo smoke burst** – 4–8 stylised cloud puffs (overlapping paper discs with grey bokashi, sumi outlines and spiral curls) pop out with `outBack`, drift, rise 8 units and fade over 0.55–0.75 s. Accents per creature: a Prussian splat, a **Hokusai wave crest** with paper foam claws and blue drops (kappa); burning **paper scraps** and rising embers (lantern); a burst of 12 **maple leaves**, ink drops and an **ensō** ring (oni).
- **Orbiting crest** – a mitsudomoe disc (r 6.5): vermilion rim, cream field, three black commas, spinning at 6 rad/s with a 1.2-unit bob, a tapered usuzumi ribbon trail through its last 8 positions (filled once as a single polygon, 3.6 units wide at the crest, so no beads at the joints) and its own small shadow.
- **Collectibles** – small gold **koban** (5.4 × 7.4 units) with stamped lines; large **oban** (7.6 × 10.4) with a red seal stamp. Both bob, turn around their vertical axis (x-scale 0.3–1) and the large one twinkles with a gold four-point spark. On drop they pop up 9 units with `outBack`.
- **Pickup** – a **gold ring printed on the ground** with a sumi rim that widens from 2 to 8 units and thins out (0.3 s, 0.42 s for the large coin), plus 1–3 four-point gold sparks rising off the coin.
- **Glow-up** – a brushed **ensō** circle (r 18, width 3.2, dry-brush gaps) laid flat on the ground expands and fades, with 18 sakura petals and 6 gold sparks; the figure hops 5 units with a squash wobble.
- **Hurt** – a vermilion splat, vermilion drops and three petals.
- **Dash** – four usuzumi streaks and three dust puffs behind the lunge.
- **Petals** – flutter with a cosine flip of the y-axis, gravity 70, drag 2.6, life 1–2 s.
- **Floating numbers** – Zen Antique, 9 units (accent 12.5): sumi with a paper outline; accent numbers vermilion with a sumi outline and an off-register indigo copy.

## Atmosphere and lighting

There is no light model – everything is printed.
- **Ichimonji-bokashi band**: 9.5 % of the screen height along the top, `rgba(22,52,88,.88)` → `rgba(36,82,126,0)`, with 46 faint wavy wood-grain streaks cut out. Built once per screen size.
- **Print margin**: 10 px per 900 px of height in `#efe4cb`, with a 2.4 px sumi border line just inside.
- **Signature cartouche + seal** in the lower right: a 24 × 104 px slip with four abstract brush marks and a 27 px vermilion seal with paper glyph strokes (sizes per 900 px of height).
- **Hurt**: a low-res vermilion edge bokashi (transparent centre → `rgba(158,50,30,.8)`) stretched over the screen at up to 85 % alpha.
- **Drifting petals and leaves**: about 30 % of 110-unit cells carry one, crossing diagonally over 7–15 s, falling from 29 units height, fading with `sin(phase)`, with a tiny shadow.
- **Water ripples**: one pair of paper-white rings per 64-unit cell of deep water (more than 9 units from the shore), expanding from 2 to 10 units over a 4–7 s period per cell, alpha `sin(phase) * 0.6`, drawn under all actors. The water depth of each cell is cached, so this costs a few ellipses per frame.
- **Shadows**: one flat usuzumi ellipse per actor, offset (+0.5, +0.35) units, shrinking while a creature appears or dies; props use their baked ground stamps.
- No vignette, bloom, fog or colour grading.

## UI

The HUD is a set of paper slips and seals:
- **Panels** – paper `#f4ead4` with faint fibre gradients and a **double sumi rule**: a 2–3 px outer border, a 3 px paper gap, a 1.5 px inner line (`inset` box-shadows).
- **Bars** – paper troughs with the same double rule; fills are vertical bokashi (top bar Prussian `#173a5e` → `#7ea6c4`, life bar vermilion `#8e2a1a` → `#e8906a`) with a dark inner edge at the fill end. The life bar shakes 3 px for 0.25 s when the figure is hurt.
- **Title cartouche** – the clock in Zen Antique 40 px with an off-register Prussian shadow, beside a **vertical red slip** label in Yuji Syuku.
- **Counter** – a vertical cartouche: icon above number.
- **Seals (hanko)** – 30–42 px vermilion squares with a thin inner paper frame, slightly rotated, holding Zen Antique numerals or abstract glyphs (drawn with gradients).
- **Cards** – tall paper prints (232 × 318) with a triple frame, a coloured bokashi band at the top (Prussian, vermilion, pine), a round **mon disc** icon, a yellow title slip (`#f4e2a6` → `#e9cf88`) with its own double line, and a seal for the key number. The panel title **unrolls** from the centre (`clip-path`, 0.5 s) and the cards rise 40 px one after another (0.45 s, 70 ms stagger); a hovered card lifts 8 px and tilts −0.6°.
- **Overlay** – a warm paper wash with a faint vermilion bokashi at the bottom and `sepia(.4) saturate(.75)` on the backdrop.
- **Icons** – printed with the same toolkit in a 48-unit box: a red camellia on pine needles, an oni mask, a katana with a vermilion splash, crescents with speed lines, a wave crest, the crest disc, a straw sandal, a lucky rake with koban, a sake gourd.

```css
.panel { background: repeating-linear-gradient(17deg, rgba(120,96,60,.05) 0 1px, transparent 1px 7px), #f4ead4;
  border: 2.5px solid #1e1b19; box-shadow: inset 0 0 0 3px #f4ead4, inset 0 0 0 4.5px #1e1b19, 0 8px 16px rgba(30,27,25,.3); }
.bar > .fill { background: linear-gradient(180deg, #8e2a1a 0%, #cf4a2c 45%, #e8906a 100%); }
.seal { background: #c8402a; box-shadow: inset 0 0 0 2px #c8402a, inset 0 0 0 3.2px rgba(247,238,219,.9); transform: rotate(-5deg); }
.title { animation: unroll .5s cubic-bezier(.2,.9,.3,1) backwards; }
@keyframes unroll { from { clip-path: inset(0 50% 0 50%); } to { clip-path: inset(0 0 0 0); } }
```

## Motion and animation

Timing is hand-printed: poses are **held frames**, never tweened; the world always moves slower than the actors.

Main character:
- **Walk** – 8 poses: contact, down, passing, up for each leg. One pose per 7.9 units of travel, about 11.6 poses per second at full speed (≈ animating on twos). The body drop (−0.55 to +0.85 units) and lean are drawn into the poses, so the feet stay planted – no floating sine bob. A small dust puff kicks up on about 3 of 4 contacts.
- **Overlapping action** – sleeves swing one pose behind the legs (±0.46 rad), the hat lags the body drop by up to 0.4 units, the two hat cords stream back from hanging (0.35) to almost horizontal (0.75) on the passing poses.
- **Idle** – two breathing poses held 1.4 s each (the chest rises 0.38 units, the hat lifts), and a one-frame blink every 3.3 s for about 0.15–0.2 s. Both cycles are phased per actor from its position, so groups never move in lock-step.
- **Throw** – a release pose with the front sleeve thrown forward (80 ms) and a follow-through pose (75 ms), only while standing.
- **Dash** – anticipation: a 40 ms wind-up squash (x 0.9, y 1.08); action: a stretched lunge pose (x 1.12, lean 2.3) with three usuzumi after-images 7 units apart; follow-through: an 80 ms landing squash of 7 %.
- **Hurt** – a recoil pose (eyes shut, leaning back) for 150 ms, colour re-printed in vermilion and fading, a 0.9-unit shake at 70 rad/s.
- **Glow-up** – a 5-unit hop with a three-beat squash wobble.

Creatures:
- **Kappa** – 4 waddle poses at `anim * 0.36` cycles, a 5 % squash on every footfall, 0.9-unit bob, ±0.07 rad tilt.
- **Oni** – 4 stomping poses at `anim * 0.3` cycles, a heavy footfall squash of 6 % using the contact curve `(1 − |sin|)^4`, a 1.6-unit lift, ±0.03 rad tilt.
- **Lantern** – 4 tongue frames on twos (6 fps); an **asymmetric hover** 5.4 ± 1.5 units from `sin(p) + 0.3 sin(2p + 0.6)` (quick rise, slow sink) with the paper ribs stretching 7 % on the rise and folding on the sink; a lean of up to 0.16 rad with its speed plus a slow 0.045 rad swing.
- **Phases** – every creature starts with a random `anim` and seed, so no two waddle or hover together.

States:
- **Appear (0.45 s)** – kappa and oni: an ink pool (Prussian for kappa, sumi for oni) pops open with `outBack` in the first 20 %, two ripple rings spread from it, the sprite rises out bottom-up (`outQuad`) from 8 % to 68 %, then settles with a ±10 % stretch-and-squash while the pool fades. Lanterns unfold from a flat disc (y-scale 0.1 → 0.3 in 25 %, then `outBack` to 1, wider at first), rise 4 units and light up once (a key-block flash at up to 60 % alpha).
- **Hit** – the key-block-only flash is held about 64 ms, then fades at 7/s; a 15 % squash with one rebound (`cos(1.4πq)(1 − q)`), a knock-back lean of up to 0.26 rad and a 1.2-unit shove away from the blow.
- **Death (0.35 s)** – a 49 ms key-block flash pop growing 10 %. Kappa and oni are **cut through the print** along a diagonal (slope 0.42): a paper-white lens with sumi edges and a vermilion core marks the cut and closes over the next third; the upper half slides 30 % of the figure height down the cut and tips 0.55 rad; both halves sink 1.6 units while their colour lifts off to the bare key block, then fade after 68 %. Lanterns **fold flat like an accordion** (y-scale 1 → 0.28, x 1.28, sinking 4.5 units) while the paper burns away from the top through three baked burn frames with a sumi and vermilion rim, fading after 70 %.

Ambient: trees sway at 1.2 rad/s with per-prop phases, petals cross the screen in 7–15 s, water ripples breathe on 4–7 s periods.

## Do and don't

Do:
- Print every part in three passes: paper underlay, off-register bokashi block, stamped key line.
- Make key lines heavier on the outer silhouette and the lower-right side; taper open lines.
- Build with classic ukiyo-e motifs: seigaiha, pine pads, maple stars, torii, stone lanterns, mon crests, seals, tree avenues along the road.
- Compose the ground: tie every colour change and every prop to a feature, leave calm open paper between clumps.
- Animate on held poses with overlapping action and per-actor phases.
- Design hits, deaths and appearances as printed events.
- Bake once; derive flash, hurt and burn frames per pixel; bake each prop's contact into a ground stamp.
- Frame the screen like a print.

Don't:
- Outline with constant-width canvas strokes – that reads as vector cartoon.
- Add soft shadows, glows, highlights or blur inside shapes.
- Use pure black or pure white.
- Stack two gradients on one block or tint the ground with free noise blotches.
- Sprinkle grass and flowers evenly over the meadow.
- Tween walk poses or bob every actor on the same sine.
- Put legible script into seals or cartouches.
- Register colour perfectly on the line.

## Implementation recipe

1. Write the toolkit: `spline()` (Catmull-Rom → polyline), `ell()`, `capsule()`, `ribbon()`, `ink()` (stamped ribbon) and `part()` (underlay + shifted bokashi block + ink).
2. Bake a 160 px fibre tile; apply it `source-atop` at the end of every bake.
3. Define each figure as a function of a pose record (foot positions and lifts, body drop, lean, sleeve angles, cord streaming, hat lag, eye open) and draw it back to front with `part()`; use filled sumi for hair and lacquer.
4. Bake every pose at K px per unit, mirror for the other facing, derive flash / hurt / burn copies by remapping pixels by luminance.
5. Ground: sample region fields on a 4-unit grid, convert to distances `f / |∇f|`; per pixel compute the meadow wash plus the distance-driven skirts, then per region pick colours by depth (bokashi), draw key lines where `|d| < half width`, sample colour off-register, add ruts, bridges, seigaiha and contour lines, multiply fibres.
6. Bake decals on top by region distance: clumps, edge skirts, one-colour flower patches, colonies.
7. Place props per feature (avenues along roads, shrines at the roadside, reeds on shores) and bake a ground stamp per prop and variant.
8. Per frame: ripples, stamps and shadows, y-sorted `drawImage` with the pose chosen by distance or time, layered particles from baked FX sprites, then the cached print frame.
9. Skin the HUD with double-rule paper panels, bokashi bar fills, red slips and seals.

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

Held-pose walk with overlapping action – a pose table, not a sine:

```js
// foot x / lift (back, front), body drop, lean, sleeve swing (back, front), hat-cord streaming, hat lag
const P = (bf, bl, ff, fl, by, lean, bs, fs, cord, hy) => ({ bf, bl, ff, fl, by, lean, bs, fs, cord, hy });
const WALK = [
  P(-4.2, 0.3, 4.4, 0, 0.25, 0.5, 0.24, -0.26, 0.35, 0.2),   // contact
  P(-3.0, 1.1, 2.6, 0, 0.85, 0.6, 0.42, -0.46, 0.55, -0.3),  // down: sleeves still swinging from the last step
  P(0.4, 2.3, 0.2, 0, 0.05, 0.5, 0.3, -0.34, 0.75, 0.35),    // passing: cords stream back
  P(2.8, 1.3, -2.2, 0.1, -0.55, 0.4, 0.04, -0.06, 0.5, 0.3), // up
  // … the same four for the other leg (mirror bf/ff, bl/fl, bs/fs)
];
function walkPose(distance) { return WALK[Math.floor(distance * 0.126) % WALK.length]; }  // one pose per 7.9 units
function idlePose(t, phase) {                                  // per-actor phase: crowds never breathe together
  const u = t + phase;
  if (((u / 3.3) % 1) < 0.05) return 'blink';
  return ((u / 2.8) % 1) > 0.5 ? 'breathe-in' : 'idle';
}
```

Layered impact – star, splat, carved speed lines, drops, each with its own curve:

```js
function drawImpact(ctx, x, y, t, dir, star) {        // t = 0..1 over 0.2 s, dir = knock-back angle
  const outQuad = (q) => 1 - (1 - q) * (1 - q), inQuad = (q) => q * q;
  if (t < 0.75) {                                      // core: paper-white star, open in 40 % of its life
    const q = t / 0.75, s = q < 0.4 ? 0.5 + 0.65 * outQuad(q / 0.4) : 1.15 - (q - 0.4) * 0.5;
    ctx.globalAlpha = q > 0.5 ? 1 - (q - 0.5) / 0.5 : 1;
    ctx.drawImage(star, x - star.width * s / 2, y - star.height * s / 2, star.width * s, star.height * s);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = '#1e1b19';                           // speed lines: shoot out, then eaten from the inside
  for (let i = -1; i <= 1; i++) {
    const a = dir + i * 0.62, L = 7, r1 = 2.5 + L * outQuad(Math.min(1, t * 2.4)), r0 = 2.5 + L * (t < 0.3 ? 0 : inQuad((t - 0.3) / 0.7));
    if (r1 - r0 < 0.4) continue;
    const co = Math.cos(a), si = Math.sin(a) * 0.72, w = 0.62 * (1 - t * 0.4);
    const ax = x + co * r0, ay = y + si * r0, bx = x + co * r1, by = y + si * r1, mx = ax + (bx - ax) * 0.35, my = ay + (by - ay) * 0.35;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(mx - si * w, my + co * w); ctx.lineTo(bx, by); ctx.lineTo(mx + si * w, my - co * w); ctx.fill();
  }
}
```

Distance-driven meadow wash – colour follows the land, not a noise blotch:

```js
// dMoss, dWater: signed distances in world units (+ inside the region), wash: low-frequency noise 0..1
function meadow(wash, dMoss, dWater) {
  const ss = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v));
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  let c = mix([230, 207, 150], [238, 228, 199], ss((wash - 0.31) * 3.3));   // ochre -> cream
  c = mix(c, [199, 207, 152], ss((dMoss + 30) / 28) * 0.8);                 // sage skirt around moss
  c = mix(c, [214, 224, 206], ss((dWater + 18) / 16) * 0.6);                // celadon skirt along water
  return c;
}
```

## Adapting it to your project

- **Other subjects**: any figure works if you split it into a few big colour blocks with clear bokashi directions and give it one solid sumi area (hair, hat band, lacquer). Animals, samurai, merchants, foxes and tanuki fit naturally. Give each one a pose table with at least contact / passing poses and one piece of follow-through (a tail, a sleeve, a scarf, a cord).
- **Seasons**: swap the crown palettes (pink sakura → green summer → red maple → snow white with Prussian shadows), the ground stamps (petal carpet → fallen leaves → snow ring) and the drifting particles (petals → fireflies → leaves → snow).
- **Night**: darken the ground washes with a Prussian multiply, keep the paper underlay, make lanterns and windows the light sources – still printed as ochre washes, never glows.
- **Side view**: the motifs come from landscape prints, so a side-scroller works even better – stacked mist bands, a mountain silhouette with bokashi, a wave foreground, a road with an avenue of pines receding.
- **Pixel art version**: keep the block logic (paper sliver, one gradient as 2–3 dithered steps, black key line) on a low-res grid.
- **Line weight**: scale all key-line widths with sprite size, but keep the 3 : 1 ratio between silhouette and interior lines.

## Performance notes

- Init bakes about 270 sprite canvases (poses with mirrored, flash, hurt and burn copies, props and their ground stamps, FX) in well under a second; the stamped key lines are the main cost. Bake once and reuse.
- Flash, hurt and burn variants are pixel remaps of baked sprites – much cheaper than re-drawing.
- Ground chunks (256 units, up to 768 × 768 px) cost about 80–100 ms each and are built by a generator in 5 ms slices; pixels far outside every region skip the region maths, and the meadow skirts skip their distance lookups more than 36 / 24 units from moss / water.
- Prop placement samples the region distances once per candidate (≈ 0.5 ms per chunk).
- Per frame: chunk blits, one ground-stamp blit per prop, one ellipse per actor shadow, one `drawImage` per figure or particle, a few ripple ellipses (water depth cached per 64-unit cell), a handful of drifting petals and the cached print frame (one band image, four rects, one border stroke, one signature image).
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
  sakura #f0c3c3, gold #d9a93b, ground cream #eee4c7 / ochre #e6cf96, sage skirt #c7cf98 around moss.
- Ground: a composed landscape print - meadow wash whose colour follows the regions, moss and dry-grass
  fields with tinted key lines, roads with ruts and plank bridges lined by avenues of pines or cherries,
  water with depth bokashi, paper contour lines, seigaiha fans and slow ripple rings; grass in clumps and
  edge skirts, never sprinkled.
- Figures on held poses: an 8-pose walk with sleeves, hat and cords lagging, breathing and blinking on
  per-actor phases; hits = key-block flash + squash + knock-back lean; deaths = a cut through the print or
  a lantern folding as it burns; appearances = rising out of an ink pool.
- Effects in the medium: paper-white impact star with a vermilion heart and carved speed lines, ink splats,
  kumo smoke curls, ensō rings, gold koban with a printed pickup ring, falling petals.
- Frame the screen like a print: Prussian ichimonji-bokashi band at the top, paper margin, key-line border,
  signature cartouche with abstract brush marks and a red seal.
- UI: paper slips with double sumi rules, bokashi bar fills, vertical red slips, hanko seals; fonts
  Zen Antique (numbers, titles), Shippori Mincho (body), Yuji Syuku (labels).
- Flat usuzumi shadow ellipses only; no glows, blur or rendered light.
```
