# Sumi-e Ink — Game Art Style Spec

> Monochrome ink-wash painting in motion: black sumi in five tones on warm xuan paper, one-stroke brushwork, lots of empty space, one vermilion accent.

Everything is painted with one black ink diluted into five tones — **jiao** (burnt), **nong** (thick), **zhong** (heavy), **dan** (light) and **qing** (clear) — on warm rice paper with visible fibres. Each shape is a handful of expressive single strokes: a pressed start, a tapering end, and dry-brush streaks ("flying white") where the bristles run out of ink. Washes bleed into the paper and dry with a slightly darker edge. Most of the sheet is left empty (*ma*): water is bare paper framed by its banks, mountains dissolve into mist, bamboo, plum branches and pines are built from classic brush motifs. The only colour is vermilion — seals, a few plum blossoms and the sash of the main character.

## At a glance

| | |
| --- | --- |
| Family | Painterly · Ink wash |
| Mood | serene, contemplative, elegant, airy, timeless |
| Best for | calm exploration and travel games with an East-Asian theme, martial-arts and folklore action, zen and puzzle projects, scroll menus and story maps |
| Renderer | Canvas 2D, procedural: brush ribbons + ink washes baked into sprites, per-pixel paper shader for the ground |
| Pixel art | No — native resolution; characters baked at 4 px per world unit, props at 3 px, ground up to 2.5 px |
| Complexity | 5/10 — the toolkit is small; deciding which few strokes carry a shape is the craft |
| Fonts | Ma Shan Zheng, Zhi Mang Xing, Yuji Mai, Cormorant Garamond (500/600, italic) |
| Key colours | paper `#f3ecdd`, unpainted `#f9f4e8`, jiao `#161412`, nong `#2c2926`, zhong `#56524c`, dan `#8a857c`, qing `#beb8aa`, vermilion `#ce3c26` |

## When to use it

- **Good fit:** calm top-down or 3/4 exploration and travel projects — the empty paper keeps the screen quiet and every figure reads as a dark mark on light ground.
- **Good fit:** martial-arts, folklore and spirit themes — brush figures, ink creatures, smoke spirits and seals feel native to the subject.
- **Good fit:** zen, meditation, puzzle and story projects — monochrome makes composition and rhythm the main tools.
- **Good fit:** title screens, maps and menus — hanging scrolls, handscrolls and seals make a coherent UI kit.
- **Bad fit:** anything that relies on colour coding (teams, element types, rarity by hue) — there is only one colour.
- **Bad fit:** neon, sci-fi, gritty or photoreal settings; very dense screens where empty space cannot survive.
- **Difference to its base style `watercolor`:** both share the brush toolkit (washes with blots and a dried rim, granulation, paper texture, bleeding edges), but the watercolour storybook is full colour — green meadows, blue forests, orange and violet figures held by thin brown ink lines on cold-pressed paper. Sumi-e Ink drops all hue: five ink tones only, contours are bold single brush strokes with dry-brush streaks instead of thin pen lines, the ground is mostly empty xuan paper with long fibres, water is bare paper, and vermilion is the single accent. At first glance it is black ink on warm paper, not a coloured picture book.
- **Difference to `ukiyoe`:** the woodblock print is coloured, flat and printed (bokashi blocks, hard carved key lines, off-register colour). Sumi-e Ink is painterly and monochrome: no colour blocks, no closed outlines, soft washes and broken brush strokes.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Xuan paper | `#f3ecdd` | The sheet: ground base (~75 % of the screen), panel paper, misty margin |
| Unpainted paper | `#f9f4e8` | Brightest paper: faces, eyes, collar gap, waterfalls, mist bands, flash state |
| Jiao (burnt ink) | `#161412` | Darkest tone: creature bodies, hair, crest lines, moss dots, text |
| Nong (thick ink) | `#2c2926` | Bold contours, bamboo stalks, grass, needle clusters, bar fill |
| Zhong (heavy ink) | `#56524c` | Mid tone: inner blots, shore strokes, ripples, pine trunks, card text |
| Dan (light ink) | `#8a857c` | Far props, robe shading, ground dry strokes, brush handle |
| Qing (clear ink) | `#beb8aa` | Pale washes: robe, smoke creature, far peaks, bar tracks |
| Ground ink | `#322f2c` | Ink mixed into the paper by the ground shader (density 0.03–0.19) |
| Vermilion | `#ce3c26` | The only colour: seals, plum blossoms, the sash and hair tie, orbit dots |
| Vermilion deep | `#a0261a` | Sash shading, blossom centres, seal pressure spots (menu text `#a8281a`) |
| Vermilion light | `#e47052` | Blossom hearts, seal highlights (`#e8583c`) |
| Silk mounting | `#4e4b46` | Mounting of hanging scrolls, plaques and the caption bar |
| Roller | `#2a2622` | Scroll rods and rollers (gradient `#4a4540` → `#141210`) |
| Paper rule | `#d6cebe` | Thin pale strips between silk and paper on scrolls |
| Shadow ink | `#3a3630` | Soft ground shadows at alpha 0.17–0.34 |

**Rules**
- Monochrome first: every mark uses one of the five tones over warm paper. Tones are mixed by alpha and by the tip/belly mix across a dry stroke, never by hue.
- Vermilion only for seals, a few blossoms and petals, the main character's sash and hair tie and the dots inside the orbiting circles — under about 2 % of the screen.
- No pure black and no pure white: darkest ink `#161412`, brightest paper `#f9f4e8`.
- Leave most of the sheet empty; ground washes stay below 20 % density.
- Depth by value: far things pale (dan / qing), near things dark (nong / jiao).
- Water is never tinted: it is bare paper framed by bank washes and a few flowing lines.

## Typography

| Family | Use | CSS |
| --- | --- | --- |
| **Ma Shan Zheng** 400 | Titles, clock, counters, floating numbers, seal numerals | `font: 400 40px/1 'Ma Shan Zheng', 'Zhi Mang Xing', serif; letter-spacing: 2px; color: #161412;` |
| **Zhi Mang Xing** 400 | Captions, labels, hints — a grass-script feel, often vermilion | `font: 400 19px/1.1 'Zhi Mang Xing', cursive; color: #ce3c26;` |
| **Yuji Mai** 400 | Card titles | `font: 400 22px/1.15 'Yuji Mai', serif; color: #161412;` |
| **Cormorant Garamond** 500/600 | Body copy, card text (italic 600) | `font: italic 600 18px/1.2 'Cormorant Garamond', Georgia, serif; color: #56524c;` |

- Text on the world gets a paper halo: `text-shadow: 0 0 3px #f3ecdd, 0 0 8px #f3ecdd, 0 0 14px rgba(243,236,221,.85)`.
- Seal numerals are paper-coloured `#f9f4e8` Ma Shan Zheng on a vermilion seal; seals tilt by −3 to +4 degrees.
- Hints on dark overlays: Zhi Mang Xing 26px in paper colour with `0 1px 5px rgba(16,13,10,.9)`.

## Rendering technique

**Baked once (init, ~0.8 s):**
1. Textures: a 512 px fibre tile (2600 curved hairs 5–51 px long, 62 % light at alpha 0.18–0.5, the rest dark at 0.08–0.24), a 256 px paper-tooth noise, a 512 px wash noise, a 256 px granulation tile (white with ink specks) and a 256 px light-fibre pattern.
2. Every sprite is painted with two tools — `brush()` and `wash()` — into its own canvas (characters 4 px per unit, props 3 px, small effects 6–12 px), then the light-fibre pattern is cut out with `destination-out` at 0.28 (characters) / 0.35 (props) so the ink sits *in* the paper.
3. Derived variants per sprite: a mirrored copy, a flash copy (silhouette filled with unpainted paper), a blurred appear copy (5 px) and four dissolve frames.

**The brush.** A stroke is a list of control points → Catmull-Rom spline (6 steps per segment) → a filled ribbon. Width along the arc length *s* (fraction *u*):
- start taper: `w *= 0.3 + 0.7 * sqrt(u / ta)` (ta 0–0.3),
- end taper: `w *= 0.04 + 0.96 * ((1 - u) / tb)^0.6` (tb 0–0.85),
- pressed head: `w *= 1 + press * exp(-s² / (1.2 w²))`,
- wobble: `w *= 1 + 0.12 * (0.6 sin(0.55 s + φ) + 0.4 sin(1.7 s + 2.1 φ))`.
- **Bleed:** before the stroke, the same ribbon 1.4× wider is filled at 32 % alpha with `blur(0.55 * bleed * w)`.
- **Dry brush:** a solid body (84 % of the width) ends at `u = 1 - 0.9 * dry`; then 4–18 bristle ribbons (each 1.55 / n of the width) carry on. Each bristle runs out at `1 - dry * rand^0.7 * (0.25 + 0.75 * |offset|) * 0.9` (outer bristles first) and is broken wherever `noise1(s / gs) < dry * (1.25 u - 0.25) + 0.08 * |offset|`. Bristle tone mixes from the tip ink `c` to the belly ink `c2` across the width.

**The wash.** Fill the shape on a scratch canvas → blurred darker / lighter blots `source-atop` → a blurred rim stroke (the dried edge) → granulation multiplied in → clipped back to the shape (optionally feathered with a blur) → optional vertical mist fade (`destination-out` gradient) → composited; a blurred copy underneath gives the bleed halo.

**Per frame:** cached ground chunks, then the core draw order: ground overlay (landed drops, bleed rings, appear stains), collectibles, shadows, y-sorted props and figures, orbiting circles, projectiles, particles, numbers, mist bands (world overlay), and the cached misty margin with inscription (screen overlay). Everything is `drawImage` of baked canvases.

## World and ground

An endless sheet painted per pixel in 256-unit chunks (up to 640 px), built by a generator in 5 ms slices. Fields are sampled on a 16 px grid with approximate signed distances (value minus threshold over gradient length) and interpolated bilinearly.

1. **Paper:** `#f3ecdd × (0.966 + 0.05 tooth + 0.12 fibres)`. The fibres are the most visible texture: long pale hairs and a few darker ones.
2. **Pale wash regions** (domain-warped fbm, scale 500 units, threshold 0.6): softness varies 1.5–13.5 units, the edge is displaced ±9 units by wash noise and ±5 by fibres (ink feathering into the paper), density `0.03 + 0.09 * exp(-d / (10..36))` — darkest near the edge, fading inward — plus a dried rim of 0.055 about 1.1 units inside the edge where a noise allows, granulated ±50 %. A few wetter pools add 0.06.
3. **Water:** ponds (warped fbm, scale 820, threshold 0.625) and thin streams (zero contour of warped noise at scale 860, half width 5.5–10.5 units, masked by a third noise so they thin out and end in the paper). Water is **bare paper**, 1.2 % brighter, with a shore wash inside (0.07–0.19 fading over 9 units).
4. **Banks:** on the land side a wash that is darkest at the water and fades over 8–24 units (0.04–0.17), absent in places, so lakes read as bright shapes framed by ink.
5. **Decals** (seamless across chunks, drawn with the brush):
   - long pale dry strokes for the lie of the land: 1–3 per 120-unit cell (42 %), 26–72 units long, 1.8–4.4 wide, dan / zhong at 38–58 %, dry 0.8–0.95;
   - broken shore strokes: points within 3 units of the shore are snapped onto it with one Newton step, then 11–31-unit strokes follow the bank (nong / zhong, dry 0.35–0.75), skipped where a noise is low;
   - ripples: one or two gently waving lines (9–35 units, 0.55–0.95 wide) in open water, horizontal on ponds, along the flow in streams;
   - reeds on the banks (4–8 stalks 7–16 units, some with a cattail dab), grass tufts of 2–4 curved blades in loose clusters (1–43 % chance by noise), clusters of 3–7 horizontal moss dots, rare pebbles and stepping stones, flicked ink droplets, a few vermilion petals.

## Characters

All figures face right, are baked per pose and mirrored. The ink is darkest on the creatures; the main character is the lightest figure but carries the only vermilion.

**Main character — a wandering calligrapher** (about 22 × 30 units, 40 up to the bristle tip, feet at the anchor):
- A giant calligraphy brush carried across the back: a dan handle 1.25 units wide from the lower left (−7.6, −2.4) to above the right shoulder (5.9, −33.2) with three black node ticks, a nong ferrule and a burnt-black bristle tip 2.9 wide that tapers to a point (dry 0.35, bleed).
- Robe: a qing wash (shoulders 7 units wide, hem 13.5) with dan blots, held by **one bold back stroke** (3.0 units, jiao → dan, dry 0.6, pressed start), a lighter front contour (1.4), a dry hem stroke and two short fold strokes.
- A dark V collar, a vermilion sash (2.1 units, deep vermilion `#a0261a` on one side) with a knot dot and **two sash tails** (1.8 and 1.35 units) streaming 11–13 units behind.
- One sweeping sleeve stroke (2.2) over a pale wash; a small bare-paper hand.
- Head: a bare-paper face (r 3.3) with a contour only on the front side, black hair on the back half (wash with bleed), a topknot (r 1.45) with a vermilion tie and ribbon end, one eye dash, a brow and a nose hook.
- Legs: two 2.4-unit strokes with sandal dabs; walking swaps them ±2.5 units and lifts the front foot 1.5 units.

**Small creature — ink blot** (body 15 × 12.6 units on four legs, about 20 × 17 with hair):
- A wet ink blot (jiao, or zhong with darker blots and a curled tail for the second variant), a bleed halo of 1.1 units, a dark rim, a lighter belly blot.
- Seven spiky dry-brush hairs on the top half, three satellite droplets, four 1.1-unit stroke legs that alternate.
- Two bare-paper eyes (r 1.8 and 1.5) with black pupils looking forward.

**Fast creature — smoke wisp** (about 11 × 24 units, hovering 2.5 units):
- A round head of qing wash (r 5.2) with a bare-paper glow and a dan lower blot, feathered 0.45 units and bleeding.
- A curling dry-brush tail (3.6 units, dan → qing) that loops back under the head; an inner swirl line; a broken contour on the front.
- Eyes: two slanted burnt-black dashes; a small dot mouth; a little smoke curl rising from the top.

**Large creature — ink beast** (about 46 × 40 units):
- A splashed-ink body (rx 16.5, ry 12.3) in jiao with grey wet-in-wet patches and a 2.2-unit bleed halo; nine dry fur strokes along the back.
- A radiating mane of sixteen dry strokes (2.4 units, 5–10 long) around a zhong face mask; two pale curved horns (qing / dan with a fine black edge).
- Heavy black brow, bare-paper eyes with fierce pupils, a mouth stroke with two paper fangs, a nose dot.
- Four 4.6–5.2-unit leg strokes (back ones paler), claw ticks, a flame-like tail sweep (3.9 units, dry 0.65).

## Props

| Prop | Size (units) | Construction |
| --- | --- | --- |
| Bamboo | 3–5 stalks, 38–84 tall | Jointed segments (5–11 long) with a pressed node bulge and a small dark hook across each joint; branches from upper nodes; leaf groups of 3–5 tapered leaves (7–12 long, 1.7–2.5 wide) hanging in 个 / 介 shapes. Back stalks in dan, front in nong, crown leaves in jiao. |
| Plum tree | ~50 × 56 | A gnarled trunk (5.2 wide, dry 0.55, bleed) with a jiao bark edge and knot dots; angular zig-zag branches in three values, straight new shoots; up to 20 blossoms: vermilion five-petal flowers with ink stamens, ~20 % outline-only, ~20 % buds; petals at the base. |
| Pine | ~60 × 72 | An S-curved trunk (4.4, nong → dan, dry) with a dark edge and 14 bark-scale hooks; four branches and a crown, each ending in a needle wheel: a fan of 13–18 radiating strokes over a pale wash disc, a second smaller wheel and a far pale wheel behind. |
| Rock | 18 × 11, 27 × 16, scholar rock 13 × 24 | Qing wash with a dan blot and a paper-light top, a heavy broken contour on the left and top, a light one on the right, axe-cut texture strokes, 4–8 moss dots on top, a grounding stroke and grass; the tall variant has two holes. |
| Mountain | ~90 × 112 | Rounded peaks in three values (far qing, middle dan, near zhong), each covered with horizontal "Mi dots" gathered along the crest, a broken dry crest line, the wash fading out over the lower half, unpainted mist bands across the slopes, tiny pines on ledges. Variant: two craggy pinnacles with vertical texture strokes and a bare-paper waterfall between them. |
| Hut | ~36 × 25 | A thatched roof wash with downward thatch strokes and a heavy dry ridge stroke, four thin posts, a dark interior with a tiny seated paper figure. |
| Reeds | ~16 × 26 | 9–12 long tapered stalks in two values, some with a feathery dry plume. |
| Orchid | ~40 × 22 | 6–8 long leaves that rise, swell and bow outward (width wobble 0.45), two pale flowers with dark heart dots. |

- Every prop stands on a small feathered qing wash at its base; trees and rocks add a soft shadow ellipse.
- Tall props turn 45 % transparent while the main character walks behind them.
- Placement: mountains rare (one per 300-unit cell at 45 %, 30+ units from water), pines and plums spread out, bamboo in groves where a noise exceeds 0.66, reeds only within 2–6 units of a shore, rocks anywhere including water.

## Effects and particles

- **Flung ink projectile:** a burnt-black drop (r 1.9) with a paper glint and a 21-unit tail that starts solid at the drop and breaks into dry bristle streaks; rotated along its flight.
- **Ink splash impact:** a splash sprite (blot r 3.6 with a bleed halo, ten droplets on tapered spokes) grows 55 % → 115 % and fades in 0.24 s; 2–3 drops fly off with gravity 240 and land as flattened stains.
- **Ink burst:** 10–22 drops thrown out (gravity 260) that land and stay on the paper for 1–1.8 s, a 0.3 s splash and a **bleed ring** on the ground — a pale translucent disc with a darker dried rim spreading to 15–32 units over 1–1.5 s. Smoke creatures burst into three pale smoke puffs instead.
- **Orbiting ensō:** two small one-stroke circles (r 5.6, 1.7 wide, pressed start, dry end, a gap) spinning at 2.2 rad/s with a vermilion dot in the middle and a pale shadow.
- **Collectibles:** small = an ink bead (teardrop 5 × 8 units) with a paper glint; large = a vermilion square seal (9.6 units) with eroded edges and carved abstract strokes that bobs and tilts. Collecting releases vermilion petals and a small bleed ring.
- **Ensō glow-up:** a large one-stroke circle (r 14, 2.5 wide) painted in one movement around the main character (pie clip sweeping to 330° in 0.55 s), fading over 1.4 s, with twelve vermilion petals scattering.
- **Dash smear:** a 30-unit dry streak in dan behind the figure, three after-images at 20 / 10 / 7 %, a few drops left behind.
- **Hurt:** a black splash on the figure, 8 drops (35 % of them vermilion), the paper flash, the ink margin.
- **Floating numbers:** Ma Shan Zheng 10 units, black with a paper outline; accented ones 13 units in paper colour on a small vermilion seal.

## Atmosphere and lighting

- **No light source.** The paper is the light; figures read by value. Shadows are soft pale ink ellipses (radial `rgba(58,54,48,.34)` → 0), 8 × 2.6 units under the main character, 19 × 5.7 under the large creature.
- **Misty margin:** outside a rounded rectangle (radius 10 % of the height) the screen fades to paper `#f3ecdd` at up to 82 % over 11 % of the height. The border is displaced ±6 % of the height by wash noise and ±1.4 % by fibres, so it looks like ink stopping in the paper. Built once per screen size, drawn as four strips (top, bottom, left, right; 14 % wide).
- **Inscription and seals:** four abstract glyphs (bars, a spine, falling strokes, a hook, dots) 3.4 % of the height tall in nong at 72 % down the lower left, then a square seal with carved strokes and a smaller round seal. Never real script.
- **Mist bands:** three in eight 460 × 230-unit world cells carry a soft paper-coloured band (240–380 × 62–99 units, blurred) drifting 5–11 units/s with alpha `0.32 * sin(π * phase)` so it fades in and out.
- **Hurt:** nong ink `#2c2926` seeps in from the margin along noise up to 62 % alpha and fades with the hurt timer.
- No vignette darkening, no glow, no bloom, no colour grading.

## UI

- **Hanging scroll cards** (214 × 322 px, texture 428 × 640): a cord and hook at the top, a dark rod, grey silk mounting `#4e4b46` with a faint diagonal weave and specks, pale strips `#d6cebe`, a paper field with fibres and a soft edge shade, and a heavy bottom roller with knobs that sticks out on both sides. The middle card hangs 18 px lower; hovering tilts the scroll by −1.2° around its top.
- **Card key:** a round vermilion seal (28 px) with a paper numeral at the top right of the paper field. Card title Yuji Mai 22px, text Cormorant italic 600 18px in zhong, icon 104 px painted in ink.
- **Bars:** single brush strokes — the track is a pale dry stroke (qing → dan, dry 0.5), the fill a black stroke (jiao → zhong, slightly dry) with a ragged dry-brush end mask (horizontal bristle streaks 6–28 px). The long top bar is 18 px high, the panel bar 240 × 24.
- **Level box:** a square vermilion seal (36 px) tilted −3° with a paper numeral.
- **Clock plaque / caption bar:** small handscrolls — paper inside a silk border with two thin pale rules and dark rollers on both ends. Numbers Ma Shan Zheng 40px, label Zhi Mang Xing vermilion.
- **Title:** Ma Shan Zheng 60px on one broad pale wash stroke (104 px thick, dry ends), followed by a square seal with carved strokes.
- **Icons:** painted with the same brush — an ink blot critter (counter), a vermilion plum blossom (panel icon), a calligraphy brush, three flick strokes, three ink drops, a bouncing dry line, an ensō with a vermilion dot, a swallow, a gathering spiral, a tea bowl with steam.
- Overlays behind panels: `radial-gradient(ellipse at 50% 45%, rgba(243,236,221,.42), rgba(26,23,20,.74) 80%)`.

## Motion and animation

- Main character: 4 walk poses at `phase = distance * 0.08` cycles, bob `0.9 * |cos|` units; idle alternates two breathing poses (0.22 units) at 1.4 fps. Sash tails, hair ribbon and sleeve are part of each pose — no procedural wobble.
- Small creature: 4 poses at `anim * 0.7` (legs alternate, 6 % squash); smoke creature: 4 tail poses at `anim * 0.35`, hovering `2.5 ± 1.4` units at 3 rad/s, 92 % alpha; large creature: 4 poses at `anim * 0.45`.
- Appear (0.45 s): the ground stain spreads 0.5 → 1.7 × radius (outQuad) and fades, a blurred copy rises from 70 % height, crisp strokes fade in from 35 %.
- Dissolve (0.35 s): four frames of blur + paling + fibre breakup, scale +12 %, alpha −30 %.
- Hit flash: paper silhouette at `min(0.85, flash * 1.4)`, fading at 7/s.
- Effects: splashes 0.18–0.3 s, landed drops 1–1.8 s, bleed rings 0.45–1.6 s, puffs 0.35–1 s, petals 0.8–1.5 s (sideways flutter, cosine flip).
- Collectible seals bob 1 unit at 3 rad/s and tilt 0.12 rad; mist bands drift slowly. The style never boils its lines.

## Do and don't

**Do**
- Paint each shape with a few confident strokes: pressed start, tapering or dry end.
- Leave most of the sheet empty; let water, faces, eyes and mist be bare paper.
- Use the five tones for depth — pale far, dark near.
- Let dark masses bleed with a blurred halo.
- Use dry-brush streaks on long strokes (bars, ground strokes, trunks, manes).
- Keep vermilion for seals, blossoms and the main character's sash.
- Frame the screen with a misty margin and sign it with abstract calligraphy and seals.

**Don't**
- Don't add a second colour, tinted water or coloured shadows.
- Don't draw closed constant-width outlines.
- Don't fill the ground with texture everywhere.
- Don't use hard flat blocks or crisp vector edges; washes always feather.
- Don't use pure white or pure black.
- Don't put legible text in seals or inscriptions.
- Don't make lines boil or jitter.

## Implementation recipe

1. **Paper first.** Bake a tileable fibre texture (curved hairs, mostly light) and a paper-tooth noise; the ground shader multiplies them into `#f3ecdd`.
2. **Write `brush(ctx, pts, o)`**: spline → arc length → width profile (start taper, end taper, press, wobble) → ribbon fill. Add `bleed` (blurred wider copy at 32 %) and `dry` (body + bristles with noise gaps).
3. **Write `wash(ctx, shape, o)`**: fill, blurred blots, dried rim, granulation, clip, optional feather and mist fade, optional bleed halo.
4. **Paint the cast** at 4 px per unit with 5–12 strokes each: creatures as dark blots with bare-paper eyes; the main character as a pale robe with one bold black stroke and the vermilion sash. Bake 4 walk poses and 2 idle poses, mirror them, derive the paper flash, a blurred appear copy and four dissolve frames.
5. **Paint the props** at 3 px per unit, far parts pale first: bamboo, plum, pine, rocks, Mi-dot mountains with mist, a hut, reeds, orchids.
6. **Ground shader:** pale wash regions with a dried rim, ponds and streams as bare paper with shore and bank washes; then decals with the same brush (dry land strokes, shore strokes snapped to the bank, ripples, reeds, tufts, moss dots, a few petals).
7. **Effects** as baked sprites: drops that land and stay, splash, bleed ring, ensō (small orbiting, large painted with a growing pie clip), ink bead, vermilion seal, flung drop, smoke puff, petals.
8. **Atmosphere:** misty margin with a fibre-feathered edge, drifting mist bands, inscription and seals; hurt = ink seeping in.
9. **UI:** hanging scroll cards, handscroll plaques, brush-stroke bars with a dry end mask, vermilion seals, brush fonts.

## Code

The brush — a pressed, tapering ribbon with optional dry bristles:

```js
// pts: control points [[x, y], ...]; o: { w, c: [r,g,b], c2, a, ta, tb, press, dry, gs }; rnd(): 0..1
function brush(ctx, pts, o, rnd) {
  const P = catmullRom(pts, 6), n = P.length, acc = [0];
  for (let i = 1; i < n; i++) acc.push(acc[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const tot = acc[n - 1] || 1, W = [], NX = [], NY = [];
  const ta = o.ta ?? 0.12, tb = o.tb ?? 0.35, ph = rnd() * 9;
  for (let i = 0; i < n; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    NX.push(-(b[1] - a[1]) / l); NY.push((b[0] - a[0]) / l);
    const u = acc[i] / tot;
    let w = o.w;
    if (u < ta) w *= 0.3 + 0.7 * Math.sqrt(u / ta);                                  // soft entry
    if (u > 1 - tb) w *= 0.04 + 0.96 * Math.pow((1 - u) / tb, 0.6);                  // tapering exit
    if (o.press) w *= 1 + o.press * Math.exp(-(acc[i] ** 2) / (o.w * o.w * 1.2));    // pressed head
    W.push(Math.max(0.04, w * (1 + 0.12 * Math.sin(acc[i] * 0.55 + ph))));
  }
  const ribbon = (i0, i1, o0, o1) => {
    ctx.beginPath();
    for (let i = i0; i <= i1; i++) ctx.lineTo(P[i][0] + NX[i] * W[i] * o0, P[i][1] + NY[i] * W[i] * o0);
    for (let i = i1; i >= i0; i--) ctx.lineTo(P[i][0] + NX[i] * W[i] * o1, P[i][1] + NY[i] * W[i] * o1);
    ctx.fill();
  };
  const c = o.c, c2 = o.c2 || c, dry = o.dry || 0, al = o.a ?? 1;
  ctx.fillStyle = `rgb(${c})`; ctx.globalAlpha = al;
  if (!dry) { ribbon(0, n - 1, -0.5, 0.5); ctx.globalAlpha = 1; return; }
  let ib = 0; while (ib < n - 1 && acc[ib] / tot < 1 - dry * 0.9) ib++;
  if (ib > 1) ribbon(0, ib, -0.42, 0.42);                                             // the loaded body
  const nb = 12, bw = 1.55 / nb, gs = o.gs || o.w * 0.5;
  for (let b = 0; b < nb; b++) {                                                      // bristles run out
    const off = (b + 0.5) / nb - 0.5, edge = Math.abs(off) * 2, seed = rnd() * 1000;
    const life = 1 - dry * Math.pow(rnd(), 0.7) * (0.25 + 0.75 * edge) * 0.9;
    ctx.fillStyle = `rgb(${c.map((v, k) => v + (c2[k] - v) * (off + 0.5))})`;
    ctx.globalAlpha = al * (0.62 + rnd() * 0.38);
    let s0 = -1;
    for (let i = 0; i < n; i++) {
      const u = acc[i] / tot, g = smoothNoise1D(acc[i] / gs * 0.6 + seed);
      const on = u <= life && g > dry * (u * 1.25 - 0.25) + 0.08 * edge;
      if (on && s0 < 0) s0 = i;
      if ((!on || i === n - 1) && s0 >= 0) { if ((on ? i : i - 1) > s0) ribbon(s0, on ? i : i - 1, off - bw / 2, off + bw / 2); s0 = -1; }
    }
  }
  ctx.globalAlpha = 1;
}
```

Ink bleeding into the paper — a blurred halo under any dark mark:

```js
function bleedUnder(ctx, path, color, widthUnits) {
  const m = ctx.getTransform(), k = Math.hypot(m.a, m.b);      // px per world unit
  ctx.save();
  ctx.filter = `blur(${(widthUnits * k).toFixed(1)}px)`;
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = color;
  ctx.fill(path);
  ctx.restore();
  ctx.fillStyle = color;
  ctx.fill(path);                                               // the crisp ink on top
}
```

Ground shader core — paper, a pale wash with a dried rim, water as bare paper with banks:

```js
// per pixel: P tooth 0..1, F fibres 0..1, n1/n2 wash noise 0..1, dWash/dWater signed distances in units (> 0 inside)
function inkPixel(P, F, n1, n2, dWash, dWater) {
  const sst = (t) => (t <= -1 ? 0 : t >= 1 ? 1 : ((t + 1) / 2) ** 2 * (3 - (t + 1)));
  const eW = dWater + (n1 - 0.5) * 4, inW = sst(eW / 1.2), land = 1 - inW;
  const eM = dWash + (n1 - 0.5) * 18 + (F - 0.5) * 10;                   // edge feathered by fibres
  const wash = sst(eM / (1.5 + 12 * n2)) * land;
  const rim = Math.exp(-((eM - 1.1) ** 2) / 1.6) * land * Math.min(1, Math.max(0, (n2 - 0.4) * 3));
  let dens = wash * (0.03 + 0.09 * Math.exp(-Math.max(0, eM) / (10 + 26 * n1))) + rim * 0.055;
  dens += inW * Math.exp(-Math.max(0, eW) / 9) * (0.07 + 0.12 * n2);      // shore wash inside the water
  dens += land * Math.exp(-Math.max(0, -eW) / (8 + 16 * n2)) * 0.12;      // bank wash on the land side
  const L = 0.966 + (P - 0.5) * 0.05 + (F - 0.5) * 0.12 + inW * 0.012;
  const paper = [243, 236, 221], ink = [50, 47, 44];
  return paper.map((p, i) => p * L * (1 - dens) + ink[i] * dens);
}
```

The ensō painted in one movement (glow-up):

```js
function drawEnsoReveal(ctx, ensoSprite, x, y, age) {           // age 0..1
  const sweep = Math.min(1, age * 2.6);
  ctx.save();
  ctx.translate(x, y);
  if (sweep < 1) {
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.arc(0, 0, 40, Math.PI * 0.6, Math.PI * 0.6 + Math.PI * 2 * sweep * 0.92);
    ctx.closePath(); ctx.clip();
  }
  ctx.globalAlpha = Math.min(1, (1 - age) * 2.5);
  ctx.drawImage(ensoSprite, -ensoSprite.width / 2, -ensoSprite.height / 2);
  ctx.restore();
}
```

## Adapting it to your project

- **Side view or platformer:** keep the ground as empty paper with a horizon of Mi-dot mountains fading into mist; platforms become single long dry strokes; parallax layers step from qing (far) to jiao (near).
- **More colour coding needed:** allow a second muted accent only for rare elements (for example a pale indigo wash), but keep vermilion as the single strong colour.
- **Night scenes:** do not invert to black paper; darken the paper slightly (`#e4dccb`) and add more dan washes — sumi-e night is still painted on light paper.
- **Higher resolution:** raise the bake factor (characters 6 px per unit) and the bristle count (`nb` up to 24); the dry streak scale `gs` should stay in world units.
- **Busy screens:** reduce decals first, never the empty space; lower mist band alpha to 0.2 so figures stay crisp.
- **New creatures:** start from one dark blot or one pale wash, add 3–6 strokes, and give them bare-paper eyes so they read on the paper.

## Performance notes

- Init bakes about 70 sprite canvases plus HUD textures in about 0.8 s (textures 0.22 s, characters 0.25 s, props 0.19 s, effects and HUD 0.16 s). Blur filters for bleed halos are the main cost — keep them to dark masses.
- Ground chunks (256 units, up to 640 px) cost 50–85 ms each and are built by a generator in 5 ms slices; fields are evaluated on a 16 px grid, the per-pixel loop only reads textures and interpolates. Shore snapping costs three extra field evaluations per candidate, so it only runs within 3 units of the shore.
- Per frame everything is `drawImage` of baked canvases: chunks, ~70 actors, props, particles, about six mist bands and four margin strips. With 60 actors the frame costs about 1.4–2.2 ms at 1600 × 900, in line with the watercolour module measured the same way.
- The ground overlay and the particle layer share landed drops and bleed rings: when another style owns the ground, the particle layer paints them so effects never disappear.

## Copy-paste prompt

```text
Use the Sumi-e Ink art style for my project: East-Asian monochrome ink-wash painting on warm xuan paper.
- Paper #f3ecdd with long visible fibres; brightest paper #f9f4e8; keep most of the screen empty (ma).
- One ink in five tones only: jiao #161412, nong #2c2926, zhong #56524c, dan #8a857c, qing #beb8aa.
- One accent colour only: vermilion #ce3c26 for seals, a few plum blossoms and the main character's sash.
- Draw every shape with a few single brush strokes: pressed start, tapering end, dry-brush streaks where the ink runs out.
- Dark masses bleed into the paper with a soft blurred halo; washes feather into the fibres and dry with a darker edge.
- Water is bare paper framed by pale bank washes and two or three flowing lines; mountains are rounded peaks of horizontal dots that fade into mist.
- Props: bamboo with node hooks and leaf groups, plum branches with vermilion blossoms, pines with needle wheels, rocks with moss dots, a thatched hut.
- Main character: a calligrapher in a pale grey robe held by one bold black stroke, bare-paper face, topknot, vermilion sash tails, a giant brush on the back.
- Creatures: ink blots with bare-paper eyes, pale smoke wisps, a shaggy beast of splashed ink with horns.
- Effects: flung ink drops, splashes, drops that stay on the paper, bleed rings, ensō circles, vermilion seal collectibles and petals.
- Atmosphere: misty unpainted margin, drifting mist bands, an abstract calligraphy column with red seals; no glow, no coloured light.
- UI: hanging-scroll cards with silk mounting and rollers, brush-stroke bars with ragged dry ends, vermilion seals for numbers.
- Fonts: Ma Shan Zheng (titles, numbers), Zhi Mang Xing (captions), Yuji Mai (card titles), Cormorant Garamond (body).
```
