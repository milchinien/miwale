# Sumi-e Ink — Game Art Style Spec

> Monochrome ink-wash painting in motion: black sumi in five tones on warm xuan paper, one-stroke brushwork, lots of empty space, one vermilion accent.

Everything is painted with one black ink diluted into five tones — **jiao** (burnt), **nong** (thick), **zhong** (heavy), **dan** (light) and **qing** (clear) — on warm rice paper with visible fibres. Each figure is a handful of confident single strokes: a pressed start, a tapering end, and dry-brush streaks ("flying white") where the bristles run out of ink. The cast is a wandering calligrapher under a wide sedge hat with a vermilion sash, a hopping crow, a scuttling crab, a pale carp that swims through the air and a striped tiger — every animation pose is painted as its own drawing. Most of the sheet stays empty (*ma*): pale hill washes with one hard dried edge, ponds and streams left as bare paper inside darker banks, footpaths swept clean of ink, and props that gather where the land suggests them — bamboo in groves, plums over the water, a hut with its stone lantern by a path. The only colour is vermilion: seals, blossoms and the sash.

## At a glance

| | |
| --- | --- |
| Family | Painterly · Ink wash |
| Mood | serene, contemplative, elegant, airy, timeless |
| Best for | calm exploration and travel games with an East-Asian theme, martial-arts and folklore action, zen and puzzle projects, scroll menus and story maps |
| Renderer | Canvas 2D, procedural: brush ribbons + ink washes baked per pose into sprites, per-pixel paper shader for the ground |
| Pixel art | No — native resolution; characters baked at 5 px per world unit, props at 3 px, ground up to 2.5 px |
| Complexity | 6/10 — the toolkit is small; choosing the few strokes that carry a shape and painting every pose is the craft |
| Fonts | Ma Shan Zheng, Zhi Mang Xing, Yuji Mai, Cormorant Garamond (500/600, italic) |
| Key colours | paper `#f3ecdd`, unpainted `#f9f4e8`, jiao `#161412`, nong `#2c2926`, zhong `#56524c`, dan `#8a857c`, qing `#beb8aa`, vermilion `#ce3c26` |

## When to use it

- **Good fit:** calm top-down or 3/4 exploration and travel projects — the empty paper keeps the screen quiet and every figure reads as a dark mark on light ground.
- **Good fit:** martial-arts, folklore and nature themes — brush animals, a wandering scholar, seals and scrolls feel native to the subject.
- **Good fit:** zen, meditation, puzzle and story projects — monochrome makes composition and rhythm the main tools.
- **Good fit:** title screens, maps and menus — hanging scrolls, handscrolls and seals make a coherent UI kit.
- **Bad fit:** anything that relies on colour coding (teams, element types, rarity by hue) — there is only one colour.
- **Bad fit:** neon, sci-fi, gritty or photoreal settings; very dense screens where empty space cannot survive.
- **Difference to its base style `watercolor`:** both share the brush toolkit (washes with blots and a dried rim, granulation, paper texture, bleeding edges), but the watercolour storybook is full colour with thin pen lines. Sumi-e Ink drops all hue: five ink tones only, contours are bold single brush strokes with dry-brush streaks, the ground is mostly empty xuan paper, water is bare paper, and vermilion is the single accent.
- **Difference to `ukiyoe`:** the woodblock print is coloured, flat and printed (bokashi blocks, hard carved key lines). Sumi-e Ink is painterly and monochrome: no colour blocks, no closed outlines, soft washes and broken brush strokes.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Xuan paper | `#f3ecdd` | The sheet: ground base (~75 % of the screen), panel paper, misty margin |
| Unpainted paper | `#f9f4e8` | Brightest paper: faces, eyes, bellies, mist bands, the hit flash (ink lifted) |
| Jiao (burnt ink) | `#161412` | Darkest tone: crow, crab shell, hat brim, tiger stripes, moss dots, text |
| Nong (thick ink) | `#2c2926` | Bold contours, bamboo stalks, shore strokes, grass, HUD bar fill |
| Zhong (heavy ink) | `#56524c` | Mid tone: inner blots, ripples, far legs, pine trunks, card text |
| Dan (light ink) | `#8a857c` | Robe and body shading, hat wash, path edges, wakes, far props |
| Qing (clear ink) | `#beb8aa` | Pale washes: robe, carp and tiger bodies, mist trail, far peaks, bar tracks |
| Ground ink | `#322f2c` | Ink mixed into the paper by the ground shader (density 0.02–0.2) |
| Vermilion | `#ce3c26` | The only colour: seals, plum blossoms and petals, the sash, orbit dots, card keys |
| Vermilion deep | `#a8281a` | The far sash tail and captions; blossom centres and sash shading use `#a02618` |
| Vermilion light | `#e47052` | Blossom hearts, seal highlights (`#e8583c`) |
| Silk mounting | `#4e4b46` | Mounting of hanging scrolls, plaques and the caption bar |
| Roller | `#2a2622` | Scroll rods and rollers (gradient `#4a4540` → `#141210`) |
| Shadow ink | `#3a3630` | Soft ground shadows at alpha 0.17–0.34 |

**Rules**
- Monochrome first: every mark uses one of the five tones over warm paper. Tones are mixed by alpha and by the tip/belly mix across a dry stroke, never by hue.
- Vermilion only for seals, blossoms and petals, the main character's sash, the dots inside the orbiting circles and card keys — under about 2 % of the screen.
- No pure black and no pure white: darkest ink `#161412`, brightest paper `#f9f4e8`.
- Leave most of the sheet empty; ground washes stay below 20 % density and decals gather at features.
- Depth by value: far things pale (dan / qing), near things dark (nong / jiao); far limbs one tone paler than near ones.
- Water is never tinted: it is bare paper framed by bank washes, broken shore strokes and a few ripple lines.

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

**Baked once (init, about 1.5 s):**
1. Textures: a 512 px fibre tile (2600 curved hairs, 62 % light), a 256 px paper-tooth noise, a 512 px wash noise, a 256 px granulation tile and a light-fibre pattern.
2. Every sprite is painted with two tools — `brush()` and `wash()` — into its own canvas (characters 5 px per unit, props 3 px, small effects 5–12 px), then the light-fibre pattern is cut out with `destination-out` at 0.28 (characters) / 0.35 (props) so the ink sits *in* the paper.
3. **Poses are paintings.** A figure is a function `paint(ctx, pose, rnd)` that reads a pose record (body drop, lean, arm swing, hem trail, leg positions and lifts, lag of hat and brush, wing angle, tail curl …). Each part has its own seeded random stream, so the same stroke lands in the same place in every pose — the figure moves, the strokes do not boil.
4. Derived variants per pose: a mirrored copy and a flash copy (silhouette filled with unpainted paper); per creature a blurred spawn copy and five death frames.

**The brush.** A stroke is a list of control points → Catmull-Rom spline → a filled ribbon. Width along the arc length *s* (fraction *u*):
- start taper: `w *= 0.3 + 0.7 * sqrt(u / ta)`,
- end taper: `w *= 0.04 + 0.96 * ((1 - u) / tb)^0.6`,
- pressed head: `w *= 1 + press * exp(-s² / (1.2 w²))`,
- wobble: `w *= 1 + 0.12 * sin(0.55 s + φ)`.
- **Bleed:** the same ribbon 1.4× wider is filled underneath at 32 % alpha with `blur(0.55 * bleed * w)`.
- **Dry brush:** a solid body ends at `u = 1 - 0.9 * dry`; then 4–18 bristle ribbons carry on, each running out at `1 - dry * rand^0.7 * (0.25 + 0.75 * |offset|) * 0.9` (outer bristles first) and broken wherever a 1D noise drops below `dry * (1.25 u - 0.25)`. Bristle tone mixes from tip ink `c` to belly ink `c2`.

**The wash.** Fill the shape on a scratch canvas → blurred darker / paper-light blots `source-atop` (wet-in-wet) → a blurred rim stroke (the dried edge) → granulation multiplied in → clipped back to the shape (optionally feathered) → optional mist fade → composited; a blurred copy underneath gives the bleed halo.

**Per frame:** cached ground chunks, then: ground overlay (rings on the water, landed drops, bleed blooms, pressed seals, orbit shadows), collectibles, shadows, y-sorted props (with wind shear) and figures, orbiting circles with their wakes, projectiles, particles, numbers, mist bands, and the cached misty margin with inscription. Everything is `drawImage` of baked canvases except two small live paths: the sash tails and the orbit wakes.

## World and ground

An endless sheet painted per pixel in 256-unit chunks (up to 640 px), built by a generator in 5 ms slices. Four fields are sampled on a 16 px grid as approximate signed distances (value minus threshold over gradient length) and interpolated bilinearly.

1. **Paper:** `#f3ecdd × (0.966 + 0.05 tooth + 0.12 fibres)`, a few faint aged foxing spots.
2. **Hill washes** (domain-warped fbm, scale 500 units, threshold 0.615). The edge whose wash lies *below* it is hard: a dried rim (+0.07 density) about 1 unit inside, a softness of only 1.4–4.4 units. All other edges dissolve over up to 19 units into mist and fibres. Density `0.022 + 0.1 * exp(-d / (9..33))`, granulated ±50 %, a few wetter pools.
3. **Water:** ponds (warped fbm, scale 820, threshold 0.625) and thin streams (zero line of warped noise at scale 860, half width 5.5–10.5 units, masked so they thin out and end). Water is **bare paper**, a faint shore wash inside (0.07–0.19 fading over 9 units).
4. **Banks:** on the land side a wash that is darkest at the water and fades over 8–24 units (0.045–0.185), absent in places.
5. **Footpaths:** the zero line of a warped noise (scale 700), 8.4 units wide. Paths are swept paper: washes stop at them and only a hair of grey (0.035) marks where the track meets the grass.
6. **Decals** — drawn with the brush, seamless across chunks, and only where a feature asks for them:
   - **hill crests:** long broken dry strokes (16–46 units) snapped onto the hard upper edge of the washes, found here and lost there (a noise skips 42 %); half of them carry a cluster of 3–6 moss dots;
   - **shores:** points within 3 units of the shore are snapped onto it with one Newton step, then 11–31-unit strokes follow the bank (nong / zhong, dry 0.35–0.75); a pebble now and then;
   - **open water:** one or two gently waving ripple lines (9–35 units), along the flow in streams; now and then a fallen vermilion petal on a pond;
   - **banks:** reed stands of 4–7 stalks (7–16 units), a quarter with a cattail dab;
   - **path edges:** short dry strokes just off the track (7–20 units), with a grass clump (16 %) or a pebble (10 %); stepping stones where a path crosses water;
   - **meadows:** loose grass clumps (3–5 tufts, darker in the middle, paler at the rim) only where a meadow noise is above 0.6 — never single ticks evenly sprinkled.

## Characters

All figures face right, are baked per pose and mirrored. Every part has its own seeded stroke stream (no boiling). Value does the reading: crow and crab are the darkest masses, carp and tiger are pale washes held by black strokes, the main character carries the only vermilion.

**Main character — a wandering calligrapher** (about 19 × 31 units, 38 up to the bristle tip, feet at the anchor):
- **Sedge hat:** a wide conical dan wash (−9.2 … 9.9 units) with a zhong blot on the shadow side and a paper-light patch, two thin rib lines, a heavy upper contour and **one confident brim stroke** (1.5 units, pressed at the back, running dry at the front), a dot on the crown.
- **Head:** three-quarter profile under the brim — a bare-paper face, a single brow–nose–chin line (0.48), an eye dash (or a curved closed eye when blinking), a small ear, a knot of black hair at the nape.
- **Robe:** a qing wash with dan blots, held by **one bold back stroke** (3.0 units, jiao → dan, dry 0.6, pressed start), a lighter front contour (1.4), a dry hem stroke (1.05) and two fold strokes; a dark V collar.
- **Vermilion sash** (2.1 units) knotted at the back; the **two tails are painted live** from the knot (5.8 and 7.4 units, 1.2 / 1.55 wide, `#a8281a` behind `#ce3c26`).
- **Sleeve:** one sweeping stroke (2.2) over a pale wash with a bare-paper hand; it swings against the near leg.
- **Brush on the back:** a zhong handle with three ferrule ticks and a burnt-black bristle head (2.8 wide, dry, bleeding) above the shoulder; it lags behind the body.
- **Legs:** two strokes (near 2.3 nong, far 2.0 zhong) with straw-sandal dabs.
- **Poses:** idle ×4 (neutral, inhale, blink, a look back over the shoulder), walk ×8, dash ×2 (crouched wind-up, lunge with lean 0.34), hurt ×1 (recoil, eyes squeezed shut).

**Small creature A — crow** (about 22 × 14 units): a wet nong body with jiao blots and a bleed halo; one **dry-brush wing stroke** (3.3 units) with three primary flicks and a paler far wing behind; three tail strokes; a split beak of two strokes with a hair of paper between them; a bare-paper eye with a black pupil; thin legs with three toe ticks. Six hop poses: crouch (anticipation, 108 % × 86 %), push-off (stretched, wings opening), rise (wings up, feet tucked), downstroke, land (tail up for balance), settle. Its shadow shrinks while it is in the air.

**Small creature B — crab** (about 27 × 17 units): a shell of three merging wet dabs (nong with jiao and zhong blots) with a dark front edge and two texture dots, eyes on stalks, two claws (dark wet pincers with two dry tips) raised in turn, eight jointed legs (pressed upper segment, dry tapering tip) moving in two alternating sets. Four poses.

**Fast creature — carp** (about 28 × 10 units, swimming 13.5 units above its shadow): a body built along a nine-point spine with a travelling wave (amplitude `0.25 + 1.9 u²` towards the tail); a qing wash with a darker wet back and a bare-paper belly, four scale arcs, a dry dorsal fin, a flapping pectoral fin, a gill arc, a paper eye, two trailing barbels and a two-lobed dry tail fin. A broad pale **mist trail** (5.2 units, dry 0.85) is left behind it. Six swim poses; it also drifts on two slow, unrelated swells.

**Large creature — tiger** (about 50 × 29 units): a pale granulated qing body with a darker wet back and a paper belly, a bold dry back contour, a broken belly line; **pressed stripes** (1.1–2.3 units) start at the spine and taper down the flank — raking forward on the shoulder, hanging mid-flank, sweeping back on the haunch, two of them forked; a ringed S-tail with a dark tip; a ruff, rounded ears, brow stripes angled down to the nose over bare-paper eyes, a nose dot, a mouth line and whiskers. Eight poses of a diagonal-pair gait (legs offset by quarter cycles), body bob `0.55 cos 2φ`, the head bobbing a beat later, the tail swinging with a growing lag along its length; far legs in dan, near legs pale with dark edges and claw ticks.

## Props

| Prop | Size (units) | Construction |
| --- | --- | --- |
| Bamboo ×3 | 3–5 stalks, 64–84 tall | Jointed segments with a pressed node bulge and a dark hook across each joint; leaf groups of 3–5 tapered leaves in 个 / 介 shapes. Back stalks in dan, front in nong, crown leaves in jiao. |
| Plum tree ×2 | ~50 × 56 | A gnarled trunk (5.2 wide, dry 0.55, bleed) with knot dots; angular zig-zag branches in three values, straight new shoots; vermilion five-petal blossoms with ink stamens, some in outline, some as buds; petals at the base. |
| Pine ×2 | ~60 × 72 | An S-curved trunk (4.4, dry) with bark-scale hooks; branches ending in needle wheels — fans of radiating strokes over pale wash discs. |
| Rock ×3 | 18 × 11, 27 × 16, scholar rock 13 × 24 | A qing wash with a dan blot and a paper-light top, a heavy broken contour on the left and top, a light one on the right. One **facet line** where the stone turns from the light; on the shadow face beyond it 3–5 broad slanted **axe-cut strokes** that shorten towards the base; moss dots on top; grass at the foot. The scholar rock is a lumpy column with two waists and three holes, each a dark core with a hard ink lip above and a pale worn lip below. |
| Mountain ×2 | ~90 × 112 | Rounded peaks in three values covered with horizontal Mi dots, a broken dry crest line, the wash fading out over the lower half, mist bands across the slopes; or craggy pinnacles with a bare-paper waterfall. |
| Hut | ~36 × 25 | A thatched roof wash with thatch strokes and a heavy dry ridge, thin posts, a dark interior with a tiny seated paper figure. |
| Stone lantern ×2 | ~10 × 20 | A tall post lantern or a low snow-viewing lantern: platform, a light box with a bare-paper window, a wide cap with upturned tips, a finial. |
| Boat ×2 | ~36 × 18 | A pale hull with one bold gunwale stroke, water lines below, a seated angler with a long pole and a hair-thin line; one variant has a woven awning over the stern. |
| Reeds ×2 | ~16 × 26 | Long tapered stalks in two values, some with a feathery dry plume. |
| Orchid ×2 | ~40 × 22 | Long leaves that rise, swell and bow outward, two pale flowers with dark heart dots. |

**Placement — clusters, never sprinkles:** mountains are rare landmarks deep inside the hill washes (one 340-unit cell in two, at least 30 units from water and paths); pines stand on the hill washes, 55 % of them in pairs; bamboo only in groves where a noise exceeds 0.66 (thinning at the grove edge); plums lean over the water (9–34 units from the shore); rocks keep to paths and shores, 40 % with an orchid at the foot; a **homestead** is a hut 9–24 units off a path with a stone lantern by the door and bamboo or a plum behind; lone lanterns mark path bends; reeds stand at the water's edge; a fishing boat lies out on larger ponds.

- Every prop stands on a small feathered qing wash; trees, rocks, huts and lanterns add a soft shadow ellipse.
- **Wind:** bamboo (1), reeds (1.5), orchids (0.7), plums (0.25) and pines (0.18) shear at the top by `k = sway * (0.028 sin(0.7 t + 0.011 x + 0.004 y) + 0.02 sin(1.9 t + 0.027 x) * gust)`, a slow swell with gusts that travel across the land; the base stays. Boats rock on the swell (±0.35 units, ±0.025 rad at 1.1 rad/s).
- Tall props turn 45 % transparent while the main character walks behind them.

## Effects and particles

Every effect is layered — a flick at the contact, a main shape with a direction, debris that lands and stays, a residue that soaks away — and each layer has its own lifetime and easing.

- **Flung ink projectile:** a burnt-black drop (r 1.9) with a paper glint and a 21-unit tail that breaks into dry bristle streaks; rotated along its flight, fading in over 80 ms. 40 % of throws shed a drop that falls and stays on the paper.
- **Ink impact:** a 0.12 s ink flick at the contact (8 units, 12 for the tiger) → a 0.32 s **directional splatter** thrown along the blow (a pressed blot, seven tapered streaks, end drops; it snaps out with outQuad, then dries) → three drops flung forward with gravity 240 that land as flattened stains → a pale puff when the carp is hit.
- **Ink burst:** a 0.3 s splash (17 / 32 units) and a directional splatter → 9 (18 for the tiger) drops, **75 % in a fan of ±0.85 rad along the last blow**: big heavy drops fall short, small ones fly far, so the splatter has a direction and a size gradient → a **bleed bloom** on the paper: a pale, uneven stain with a darker tide line where the water stopped and two or three backrun lobes, spreading fast with outQuad, holding, then soaking away over 1.1–1.6 s. Crows also shed four feathers that rock side to side as they sink (1.3–1.8 s); carps thin into three rising mist puffs.
- **Orbiting ensō:** small one-stroke circles (r 5.6, 1.7 wide, pressed start, dry end, open gap) with a vermilion dot, a pale shadow and a **dry-brush wake** — two thin tapering dan ribbons that follow the circle's real path over the last 0.2 s.
- **Collectibles:** small = an ink bead (teardrop 5 × 8 units) with a paper glint; large = a vermilion square seal (9.6 units) with eroded edges and carved abstract strokes that bobs and tilts. Collecting a seal **stamps it onto the paper** (it comes down at 145 % and settles in 0.11 s, holds, then soaks in over 0.95 s) and lifts five petals; a bead leaves a small ring.
- **Ensō glow-up:** a large one-stroke circle (r 14, 2.5 wide) painted in one movement (pie clip sweeping to 330° in 0.54 s) with the loaded brush head as a dot at the front of the stroke; five drops jump from the start point, twelve vermilion petals scatter and flutter; it fades over 1.4 s.
- **Dash:** a crouched wind-up pose for 50 ms, then the lunge; two pale-ink after-images 7 units apart at 20 / 10 %, a 30-unit dry streak in dan, four drops left on the ground; the sash tails fly flat.
- **Hurt:** a black splash on the figure, 8 drops (35 % vermilion), the recoil pose with a paper flash, ink seeping in from the margin.
- **Floating numbers:** Ma Shan Zheng 10 units, black with a paper outline; accented ones 13 units in paper colour on a small vermilion seal; pop 0.55 → 1.15 → 1 with a slight tilt.

## Atmosphere and lighting

- **No light source.** The paper is the light; figures read by value. Shadows are soft pale ink ellipses (radial `rgba(58,54,48,.34)` → 0), 8 × 2.6 units under the main character, 19 × 5.4 under the tiger; the crow's shrinks while it hops.
- **Misty margin:** outside a rounded rectangle (radius 10 % of the height) the screen fades to paper `#f3ecdd` at up to 82 % over 11 % of the height. The border is displaced by wash noise and fibres, so it looks like ink stopping in the paper. Built once per screen size, drawn as four strips.
- **Inscription and seals:** four abstract glyphs 3.4 % of the height tall in nong at 72 % down the lower left, then a square seal with carved strokes and a smaller round seal. Never real script.
- **Mist bands:** three in eight 460 × 230-unit world cells carry a soft paper-coloured band (240–380 units wide) drifting 5–11 units/s with alpha `0.32 * sin(π * phase)` so it fades in and out.
- **Water life:** in 60 % of 80-unit cells inside water, a pair of rings opens every 3.6–6.2 s (radius 1.5 → 11 units with outQuad, 0.8 s apart) and fades — slow, quiet, never stealing focus.
- **Hurt:** nong ink `#2c2926` seeps in from the margin along noise up to 62 % alpha and fades with the hurt timer.
- No vignette darkening, no glow, no bloom, no colour grading.

## UI

- **Hanging scroll cards** (214 × 322 px, texture 428 × 640): a cord and hook at the top, a dark rod, grey silk mounting `#4e4b46` with a faint diagonal weave and specks, pale strips `#d6cebe`, a paper field with fibres and a soft edge shade, and a heavy bottom roller with knobs that sticks out on both sides. The middle card hangs 18 px lower; hovering tilts the scroll by −1.2° around its top.
- **Card key:** a round vermilion seal (28 px) with a paper numeral at the top right of the paper field. Card title Yuji Mai 22px, text Cormorant italic 600 18px in zhong, icon 104 px painted in ink.
- **Bars:** single brush strokes — the track is a pale dry stroke (qing → dan, dry 0.5), the fill a black stroke (jiao → zhong, slightly dry) with a ragged dry-brush end mask (horizontal bristle streaks 6–28 px). The long top bar is 18 px high, the panel bar 240 × 24.
- **Level box:** a square vermilion seal (36 px) tilted −3° with a paper numeral.
- **Clock plaque / caption bar:** small handscrolls — paper inside a silk border with two thin pale rules and dark rollers on both ends. Numbers Ma Shan Zheng 40px, label Zhi Mang Xing vermilion.
- **Title:** Ma Shan Zheng 60px on one broad pale wash stroke (104 px thick, dry ends), followed by a square seal with carved strokes.
- **Icons:** painted with the same brush — the crow itself, settled after a hop (counter), a vermilion plum blossom (panel icon), a calligraphy brush, three flick strokes, three ink drops, a bouncing dry line, an ensō with a vermilion dot, a swallow, a gathering spiral, a tea bowl with steam.
- Overlays behind panels: `radial-gradient(ellipse at 50% 45%, rgba(243,236,221,.42), rgba(26,23,20,.74) 80%)`.

## Motion and animation

Hand-painted timing: poses are held and change **on twos** (about 12 fps); only the sash tails, wakes, wind and mist move continuously.

| Actor | Poses | Timing |
| --- | --- | --- |
| Main character walk | 8: contact, down, passing, up for each foot | frame = distance × 0.13 → 12 fps at walking speed, one stride pair per 0.67 s; body drop 0 / +0.75 / +0.25 / −0.55; arms counter-swing ±1.5 units; hem trails; hat tilt and brush lag a quarter beat behind |
| Main character idle | 4 | 12 fps clock: inhale and hold every 1.25 s, blinks on two unrelated clocks (3.9 s and 5.1 s), a look back for 1.7 s every 12.6 s |
| Dash | 2 | crouched wind-up for the first 50 ms, then the lunge |
| Crow | 6 (hop) | about 9 fps, per-actor tempo 0.9–1.1× |
| Crab | 4 | about 9 fps, legs in two alternating sets, claws raised in turn |
| Carp | 6 (swim) | about 9 fps plus two slow swells (1.7 and 0.63 rad/s) |
| Tiger | 8 (gait) | about 8 fps, head and tail lag the body |

- **Sash tails (live):** at rest they hang (1.05 rad) and sway slowly (1.8 rad/s, amplitude 0.22); walking lifts them to 0.3 rad and speeds the wave up (up to 7.8 rad/s, amplitude 1.07, 22 % longer); in a dash they fly flat and 30 % longer.
- **Crowds never move in lock-step:** every creature has its own tempo (0.9–1.1×) and size (0.93–1.07×) from its seed, and its pose is driven by its own distance travelled.
- **Spawn (0.45 s):** a drop of ink falls (first 12 %), lands and spreads into a stain (0.35 → 1.5 × radius, outQuad), a soft blurred blot wicks up out of it with an outBack overshoot (height 30 % → 100 %), then the crisp strokes are painted from the ground up (the carp tail first) and the stain fades.
- **Hit (0.14 s):** knocked 1.4 units along the blow, tilted 0.17 rad, squashed to 116 % × 86 % with a squared falloff; for the first half the ink is lifted to bare paper.
- **Death (0.35 s, five frames):** the ink first pools wet and dark with a small kick (12 % wider), then bleeds into the paper, pales and breaks up along the fibres while the body spreads 30 % and sinks 50 %; the carp rises 5 units and thins into mist. The burst and bloom continue on the paper.
- **Effects:** splashes 0.12–0.3 s, splatters 0.32–0.45 s, landed drops 1–1.8 s, blooms 1.1–1.6 s, feathers 1.3–1.8 s, petals 0.8–1.5 s with a sideways flutter and a cosine flip.
- **Ambient:** plants shear in travelling gusts, mist drifts 5–11 units/s, rings open on the water every few seconds, boats rock — all slower than the actors.

## Do and don't

**Do**
- Paint each shape with a few confident strokes: pressed start, tapering or dry end.
- Paint every pose as its own drawing from a pose record; seed strokes per part so they do not boil.
- Add anticipation and follow-through: the crow crouches before it hops, the dash winds up, hat, brush, sash and tails lag.
- Leave most of the sheet empty; let water, faces, eyes and bellies be bare paper.
- Gather marks at features: crest strokes on a hard wash edge, reeds on banks, rocks by paths, a lantern by every hut.
- Give effects a direction and a life cycle: flick → splatter along the blow → drops that stay → a bloom that soaks away.
- Keep vermilion for seals, blossoms and the main character's sash.

**Don't**
- Don't add a second colour, tinted water or coloured shadows.
- Don't draw closed constant-width outlines.
- Don't sprinkle tufts or dots evenly over the ground.
- Don't animate by squashing a single drawing or by sine-bobbing everything.
- Don't use hard flat blocks or crisp vector edges; washes always feather.
- Don't use pure white or pure black.
- Don't put legible text in seals or inscriptions.

## Implementation recipe

1. **Paper first.** Bake a tileable fibre texture (curved hairs, mostly light) and a paper-tooth noise; the ground shader multiplies them into `#f3ecdd`.
2. **Write `brush(ctx, pts, o, rnd)`**: spline → arc length → width profile (start taper, end taper, press, wobble) → ribbon fill; add `bleed` (blurred wider copy) and `dry` (body + bristles with noise gaps).
3. **Write `wash(ctx, shape, o)`**: fill, blurred wet blots, dried rim, granulation, clip, optional feather, mist fade and bleed halo.
4. **Design the cast as painters with pose records.** One function per figure, one seeded stroke stream per part. Write the pose tables first: walk (contact / down / passing / up), idle (breathe, blink, look), dash (wind-up, lunge), hop (crouch, push-off, rise, downstroke, land, settle), swim and gait as phase loops. Bake each pose at 5 px per unit, mirror it, derive the paper flash, a blurred spawn copy and five death frames.
5. **Paint the props** at 3 px per unit, far parts pale first, in 2–3 designed variants each.
6. **Ground shader:** fields as signed distances (hill washes with one hard edge, water, banks, paths); then decals with the same brush, each type tied to a feature.
7. **Placement:** props by the land — groves from a noise, plums by water, homesteads by paths (hut + lantern + tree), rocks with orchids.
8. **Effects** as baked sprites with layered lifetimes: flick, directional splatter, drops that land and stay, bloom with tide line and backruns, feathers, petals, pressed seal, ensō painted with a pie clip.
9. **Atmosphere:** misty margin, mist bands, rings on the water, wind shear, inscription and seals; hurt = ink seeping in.
10. **UI:** hanging-scroll cards, handscroll plaques, brush-stroke bars with a dry end, vermilion seals, icons painted with the same brush.

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

A figure painted per pose — the walk table (contact / down / passing / up for each foot) and the live sash tails:

```js
// paint(ctx, pose, rnd) draws the whole figure for one pose; bake every pose once, same seed per part
const BY = [0, 0.75, 0.25, -0.55, 0, 0.75, 0.25, -0.55];          // body drop: contact, down, passing, up
const walk = BY.map((by, i) => {
  const p = i / 8, c = Math.cos(p * 2 * Math.PI), s = Math.sin(p * 2 * Math.PI);
  return {
    by, lean: 0.06, arm: -1.5 * c, hem: -0.7 + 0.35 * c,            // arms counter-swing, hem trails
    brush: 0.05 * Math.sin(p * 4 * Math.PI - 1.0),                  // the brush on the back lags (follow-through)
    tilt: 0.035 * Math.sin(p * 4 * Math.PI - 0.6),                  // so does the hat
    legs: { ax: 3 * c + 0.3, al: Math.max(0, -s) * 1.7, bx: -3 * c - 0.2, bl: Math.max(0, s) * 1.7 },
  };
});
const frames = walk.map((pose) => bake(40, 46, 20, 42.5, 5, (ctx) => paint(ctx, pose, seeded(5000))));
// per frame, on twos: frame = floor(distance * 0.13) & 7  -> 12 fps at walking speed

// the sash tails are the only live strokes: they hang at rest, stream back when walking (mv 0..1), fly flat in a dash
function drawSash(ctx, kx, ky, facing, t, mv) {
  const m = Math.min(1, mv);
  for (let k = 1; k >= 0; k--) {
    const len = (k ? 5.8 : 7.4) * (1 + 0.22 * m), w0 = k ? 1.2 : 1.55, ang = 1.05 - 0.75 * m + k * 0.3;
    const dx = -facing * Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    const ph = t * (1.8 + 6 * m) + k * 1.9, amp = 0.22 + 0.85 * m, L = [], R = [];
    for (let i = 0; i < 7; i++) {
      const u = i / 6, wv = amp * u * Math.sin(ph - u * 3.4), w = w0 * (1 - 0.78 * u) * 0.5;
      const x = kx + dx * len * u + nx * wv, y = ky + dy * len * u + ny * wv + u * u * 0.8 * (1 - m);
      L.push([x + nx * w, y + ny * w]); R.unshift([x - nx * w, y - ny * w]);
    }
    ctx.fillStyle = k ? '#a8281a' : '#ce3c26';
    ctx.beginPath(); L.concat(R).forEach((p) => ctx.lineTo(p[0], p[1])); ctx.closePath(); ctx.fill();
  }
}
```

Flung ink with a direction and a size gradient (no even ring of dots):

```js
function inkBurst(emit, x, y, z, n, speed, size, dir) {
  for (let i = 0; i < n; i++) {
    const fan = i < n * 0.75, k = Math.random();
    const a = fan ? dir + (Math.random() + Math.random() - 1) * 0.85 : Math.random() * Math.PI * 2;
    const s = speed * (fan ? 0.3 + k : 0.25 + k * 0.45);          // fast drops fly far ...
    emit({ x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.65, vz: 30 + Math.random() * 70, grav: 260,
      size: size * (fan ? 1.25 - k * 0.8 : 0.4 + Math.random() * 0.4),  // ... and are the small ones
      life: 1 + Math.random() * 0.8, kind: 'drop' });               // landed drops stay on the paper
  }
}
```

Ground shader core — paper, a hill wash with one hard dried edge, water as bare paper with banks:

```js
// per pixel: P tooth, F fibres, n1/n2 wash noise (0..1); dHill/dWater signed distances in units (> 0 inside);
// top 0..1 = how much this edge is the upper edge of the wash (normal of the field pointing down)
function inkPixel(P, F, n1, n2, dHill, dWater, top) {
  const sst = (t) => (t <= -1 ? 0 : t >= 1 ? 1 : ((t + 1) / 2) ** 2 * (3 - (t + 1)));
  const eW = dWater + (n1 - 0.5) * 4, inW = sst(eW / 1.2), land = 1 - inW;
  const eM = dHill + (n1 - 0.5) * (18 - 11 * top) + (F - 0.5) * (10 - 4 * top);   // ragged where soft
  const wash = sst(eM / (1.4 + 3 * n2 + 15 * (1 - top))) * land;                  // hard on top, mist below
  const rim = Math.exp(-((eM - 1.1) ** 2) / 1.6) * wash * top * Math.min(1, Math.max(0, (n2 - 0.35) * 3));
  let dens = wash * (0.022 + 0.1 * Math.exp(-Math.max(0, eM) / (9 + 24 * n1))) + rim * 0.07;
  dens += inW * Math.exp(-Math.max(0, eW) / 9) * (0.07 + 0.12 * n2);              // shore wash inside the water
  dens += land * Math.exp(-Math.max(0, -eW) / (8 + 16 * n2)) * 0.12;              // bank wash on the land side
  const L = 0.966 + (P - 0.5) * 0.05 + (F - 0.5) * 0.12 + inW * 0.014;
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

- **Side view or platformer:** keep the ground as empty paper with a horizon of Mi-dot mountains fading into mist; platforms become single long dry strokes; parallax layers step from qing (far) to jiao (near). The walk table works as is.
- **More colour coding needed:** allow a second muted accent only for rare elements (for example a pale indigo wash), but keep vermilion as the single strong colour.
- **Night scenes:** do not invert to black paper; darken the paper slightly (`#e4dccb`) and add more dan washes — sumi-e night is still painted on light paper.
- **Higher resolution:** raise the bake factor (characters 6–8 px per unit) and the bristle count (`nb` up to 24); keep the dry streak scale `gs` in world units.
- **Busy screens:** reduce decals first, never the empty space; lower mist band alpha to 0.2 so figures stay crisp.
- **New creatures:** start from one dark blot or one pale wash, add 3–6 strokes with a pressed end, give them bare-paper eyes, then write a pose table with an anticipation pose before every big move.

## Performance notes

- Init bakes about 115 sprites (39 character poses, each mirrored with a paper-flash copy, 20 death frames, 21 prop variants, ~30 effect sprites and the HUD textures) in about 1.5 s: textures 0.25 s, characters 0.8 s, props 0.28 s, effects and HUD 0.2 s. The blurred blots and bleed halos inside the washes are the main cost — keep them to the shapes that need them, or bake on a worker.
- Ground chunks (256 units, up to 640 px) are built by a generator in 5 ms slices; fields are evaluated on a 16 px grid and the per-pixel loop only reads textures and interpolates. Shore, crest and path snapping costs a few extra field evaluations per candidate, so it only runs near those features.
- Per frame everything is `drawImage` of baked canvases (chunks, actors, props, particles, mist bands, four margin strips) plus two small live paths per sash and per orbit wake; wind is a shear transform, not a re-bake. Frame cost stays within about 5 % of the previous version of the module measured in the same session.
- The ground overlay and the particle layer share landed drops, blooms and pressed seals: when another style owns the ground, the particle layer paints them so effects never disappear.

## Copy-paste prompt

```text
Use the Sumi-e Ink art style for my project: East-Asian monochrome ink-wash painting on warm xuan paper.
- Paper #f3ecdd with long visible fibres; brightest paper #f9f4e8; keep most of the screen empty (ma).
- One ink in five tones only: jiao #161412, nong #2c2926, zhong #56524c, dan #8a857c, qing #beb8aa.
- One accent colour only: vermilion #ce3c26 for seals, plum blossoms and the main character's sash.
- Draw every shape with a few single brush strokes: pressed start, tapering end, dry-brush streaks where the ink runs out.
- Dark masses bleed into the paper with a soft halo; washes feather into the fibres and dry with a darker edge.
- Ground: pale hill washes with one hard dried upper edge, water as bare paper inside darker banks, swept footpaths; marks only at features.
- Props in clusters: bamboo groves, plums leaning over water, pines in pairs on hills, rocks with axe-cut strokes and orchids, a hut with a stone lantern.
- Main character: a calligrapher in a wide sedge hat with one bold black brim stroke, a pale robe held by one black back stroke, a vermilion sash whose tails trail behind, a giant brush on the back.
- Creatures: a hopping black crow, a crab of wet dabs, a pale carp swimming through the air with a mist trail, a striped tiger.
- Paint every animation pose: 8-pose walk with contact/down/passing/up, crouch before a hop, lag on hat, sash and tails; poses change on twos.
- Effects: ink flick, splatter thrown along the blow, drops that land and stay, a bleed bloom with a tide line, ensō circles, vermilion seals stamped onto the paper.
- Atmosphere: misty unpainted margin, drifting mist, rings opening on the water, an abstract calligraphy column with red seals; no glow.
- UI: hanging-scroll cards with silk mounting and rollers, brush-stroke bars with ragged dry ends, vermilion seals; fonts Ma Shan Zheng, Zhi Mang Xing, Yuji Mai, Cormorant Garamond.
```
