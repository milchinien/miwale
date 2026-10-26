# Art Deco Gold — Game Art Style Spec

> A 1920s grand lobby: onyx, emerald and midnight marble inlaid with metallic gold sunbursts, chevrons, fans and stepped corners.

The whole world is one endless **grand floor**. It is laid out on a strict 200-unit grid: every square bay is a framed marble inlay — a sunburst medallion, a harlequin of diamonds, fish-scale fans, zigzag chevrons, a reflecting pool or a parterre garden — and the bays are separated by midnight-blue terrazzo promenades with bevelled gold borders and gold compass rosettes at every crossing. The palette is tight and nocturnal: deep black, emerald and midnight blue, with **metallic gold** and ivory as the only bright notes. Gold is never flat yellow; it is always a banded gradient or a three-pass bevel stroke (dark edge, mid gold, thin bright highlight), so every line looks like polished brass inlay. Figures are elegant geometric cut-outs with a thin ink outline and a **gilded rim**: a dapper gentleman in an ivory dinner jacket and top hat, enamel scarabs carrying gold sun discs, swept-wing swifts and a gilded guardian statue with a fan headdress. Effects are gold sparkles, sunburst flashes and drifting gold leaf; the UI is a kit of Deco frames with notched corners, gold double borders and sunburst headers.

## At a glance

| | |
| --- | --- |
| Family | Vector · Art Deco |
| Mood | glamorous, opulent, nocturnal, orderly, festive |
| Best for | stylish top-down action and arcade projects, heist / casino / hotel / jazz-age settings, luxury puzzle and match games, elegant menus and card UIs, Deco city builders |
| Renderer | Canvas 2D, procedural: vector parts baked into sprites, world-anchored marble and terrazzo patterns for the floor |
| Pixel art | No — native resolution, sprites baked at 3–7 px per world unit |
| Complexity | 5/10 — a small geometric vocabulary and a reusable gold recipe; restraint and symmetry are the craft |
| Fonts | Limelight (400), Josefin Sans (300/400/600/700), Poiret One (400) |
| Key colours | onyx `#0d0e12`, midnight `#0f1a33`, terrazzo `#18233f`, emerald `#0e4a40`, jade `#2a9c84`, gold `#b8862f` / `#e6c15a` / `#fff0b8`, ivory `#f2e8d0`, ruby `#b8323f` |

## When to use it

- **Good fit:** stylish top-down action or arcade projects that want a strong, luxurious identity — dark floor, bright ivory and gold figures read well even in crowds.
- **Good fit:** heist, casino, hotel, ocean-liner, jazz-age or speakeasy settings; museum and treasure themes (scarabs, statues, gems).
- **Good fit:** puzzle, match and card games — the bay grid is a natural board, and the frames, badges and sunburst headers make a complete UI kit.
- **Good fit:** title screens, menus and store pages — the typography and frames carry the look on their own.
- **Bad fit:** cozy pastel or rustic projects; organic, painterly nature; gritty realism.
- **Bad fit:** retro pixel looks — the style depends on crisp sub-pixel pin-lines and gradients.
- **Bad fit:** projects that need very bright, colourful worlds — the palette is deliberately narrow and dark.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Onyx | `#0d0e12` | Black marble, base of the floor (~35 % of the screen); cloud `#1d1e26`, veins `#6e6553` |
| Onyx Satin | `#1b1c23` | Trousers, top hat, plinths, vases, lamp pillars |
| Midnight | `#0f1a33` | Midnight marble and scallop fields; cloud `#182a4e` |
| Terrazzo | `#18233f` | Promenades (~20 %); chips ivory `#d9ccaa`, gold `#c4953e`, jade `#2c7d6a`, black `#0b1020`, blue `#33467a` |
| Lapis | `#3460c0` | Blue enamel scarab; scallop rows `#3a5a9e` |
| Emerald | `#0e4a40` | Emerald marble in rays, diamonds and chevrons; cloud `#125548` |
| Emerald Light | `#14695a` | Fronds, fan leaves, topiary tiers, guardian crest |
| Jade | `#2a9c84` | Jade enamel, swift body, leaf highlights; light `#6fd1b6` |
| Gold | `#b8862f` | Mid gold of every bevelled line |
| Gold Light | `#e6c15a` | Accents, sparkles, sun-disc rays, speed lines |
| Gold Highlight | `#fff0b8` | Thin bright line on gold bands; top stop of gold gradients |
| Gold Dark | `#5a3d10` | Dark edge of gold bands; gold-leaf backs `#8a611d` |
| Pin Gold | `#c99a3c` | Thin pin-lines in the floor and UI frames |
| Ivory | `#f2e8d0` | Dinner jacket, medallion centres, pool coping, swift wings, UI text |
| Pearl | `#fffaf0` | Lit side of jacket and wings, gloves |
| Champagne Skin | `#ecd0a4` | The main character's face; shade `#c39b6c` |
| Bronze | `#3a332a` | Guardian body, palm trunks; light `#6a5c46`, dark `#16130f` |
| Pool Water | `#123a57` | Pools and fountain basins; deep `#0a2136`, ripples `#a8eadf` |
| Ruby | `#b8323f` | Rare warm accent: panel bar, heart icon; hurt rays `#ff7a6a` |
| Ink | `#07080b` | Outlines of figures and icons, text strokes |

**The gold recipe** (used everywhere):

- **Fill:** linear gradient with six stops `#fff0b8` 0, `#e9bf5c` .18, `#9a6c22` .42, `#c8973a` .56, `#f5d98a` .78, `#7d561a` 1 — the dark band in the middle is what makes it read as metal.
- **Line / band:** stroke the same path three times: `#5a3d10` at 1.55 × w, `#b8862f` at w, `#fff0b8` at 0.34 × w.
- **Ring:** radial gradient across the ring width: `#5a3d10`, `#f5d98a`, `#fff0b8`, `#c8973a`, `#5a3d10`.
- **Pin-line:** a single `#c99a3c` stroke of 0.4–0.6 units.

**Rules**
- Dark surfaces take about 80 % of the screen; gold is only lines, rims, bands, discs and ornaments — never a large flat field.
- Ivory is the bright accent and the main character's colour; on the floor it appears only in small centres and the pool coping.
- One enamel colour per creature (jade, lapis, onyx or pearl) plus gold trim.
- Ruby is the only warm colour besides gold and stays small.
- No pastels, no extra hues, no pure white except tiny sparkle cores.

## Typography

| Font | Weights | Role | Sample CSS |
| --- | --- | --- | --- |
| **Limelight** | 400 | Titles, counters, card titles, floating numbers | `font: 400 64px/1 'Limelight', serif; letter-spacing: .16em; text-transform: uppercase;` + gold gradient text |
| **Josefin Sans** | 300–700 | Body copy, card text, captions, small labels | `font: 400 15px/1.3 'Josefin Sans', sans-serif; color: #c9bb98;` |
| **Poiret One** | 400 | Thin taglines and hints in wide capitals | `font: 400 19px 'Poiret One'; letter-spacing: .3em; text-transform: uppercase; color: #e2cf9f;` |

- Display text is **all caps with wide tracking** (.08–.16em). Titles are filled with the gold gradient via `background-clip: text` and a hard 3 px black drop shadow.
- Small captions use Josefin Sans 600 at 10–11 px with .3–.5em tracking in jade `#9fd8c4` or ivory `#d8c9a3`.
- Floating numbers: Limelight, ivory `#f6ecd2` with an ink stroke 0.26 × size; emphasised values are 44 % larger, gold-gradient filled, on a ring of 14 short gold rays.

## Rendering technique

- **Coordinates:** the screen shows 360 world units of height. The main character is ~31 × 42 units including the top hat.
- **Baked at init:** five floor textures, all figure poses, props, effect sprites. Each figure sprite is drawn once as vector parts at K = clamp(round(screenHeight / 360 × 1.7), 3, 7) px per unit, then:
  1. the silhouette tinted gold `#c9973a` is stamped at 16 offsets on a circle of (outline + 0.42) units — the **gilded rim**;
  2. the silhouette tinted ink `#07080b` is stamped at 12 offsets on a circle of 0.5–0.8 units — the **outline**;
  3. the sprite is drawn on top.
  Two copies are derived: a warm ivory **flash** (`#fff6dc` at 86 % source-atop) and a **gold silhouette** (gold gradient at 92 % source-atop) for vanishing and dash afterimages.
- **Per frame:** sprites are blitted with one `setTransform` (scale, rotation, mirror); a few strokes for fountain water, speed lines and sunburst rays; one cached full-screen overlay.
- **Draw order:** floor chunks → ground overlay (pool ripples, appear sigils) → collectibles → shadows → y-sorted props and figures → orbiting discs → projectiles → particles → numbers → gold dust → screen overlay.
- **Floor:** 256-unit chunks at up to 2.5 px per unit, drawn by a generator that yields after each bay. Patterns are created from the baked textures with `pattern.setTransform(scale)`, so marble and terrazzo are anchored to world coordinates and continue seamlessly across chunks.
- No pixel snapping, smoothing on, miter joins (limit 3), butt caps.

## World and ground

The floor is a grid of square **bays** of 200 units. Each bay keeps a 14-unit margin on every side for the promenades, leaving a 172-unit interior.

**Bay frame** (all framed types): a stepped rectangle — each corner notched in two 7-unit steps — filled with onyx marble; a bevelled gold band of 1.25 units at 2.4 inset; a 0.45 pin-line at 7 inset (steps of 5). The inner field starts 9.5 units in, with 4.5-unit steps. Bay types are chosen by a hash of the bay index:

- **Medallion (25 %).** A 58-unit sunburst in **one of three designed variants** picked per bay, so neighbouring medallions never read as one stamp: 16 emerald rays (half-angle 0.105 rad) with an 8-point star; 12 wide midnight-glass rays (0.15 rad, turned half a ray) with a 12-point star; 24 fine emerald rays (0.07 rad) with a 6-point star. Construction (16-ray variant): onyx disc, rays tapering from radius 15 to the rim, pin-lines along their edges, 16 short gold lines between the rays from r 24 to r 53, a thin ring at r 40, a polished gold ring of 3.4 at the rim, 32 gold beads (r 1) at r 63.6, a pin ring at r 67.5. Centre: an ivory marble disc r 14 with a gold ring and an 8-point gold star (radii 11.5 / 4.4) around an onyx dot. In each field corner, a quarter fan of six alternating emerald/onyx wedges (r 32) with a gold arc, an inner pin arc at r 22 and an ivory quarter disc r 7.
- **Harlequin (17 %).** Emerald field with onyx diamonds of half-diagonal 12 on alternate rows; gold pin-lines (0.5) along both diagonal lattices; tiny ivory `#e9dcc0` lozenge studs at every vertex.
- **Scallop (15 %).** Fish-scale fans: circles of r 12 every 24 units, rows 11 units apart, alternate rows offset by 12 and drawn top to bottom so each row overlaps the one above. Rows alternate a jade gradient (`#2a9c84` → `#125447` → `#0a2e2a`) and a lapis gradient (`#3a5a9e` → `#172a52` → `#0b1428`). Each scale: a gold arc of 0.7 with a highlight, an inner arc at 0.62 r, five short rays and a small gold half-sun at the base.
- **Chevron (13 %).** Zigzag bands 13 units tall, period 26, amplitude 6.5, cycling onyx / emerald / onyx / midnight, each seam a gold line with a faint highlight. Centre inlay: an onyx diamond (half-diagonal 30) with a gold band, an ivory diamond (24), an onyx diamond (15) and a 4-point gold star.
- **Pool (13 %).** Ivory marble coping (10 units) with a gold pin-line; water in a stepped rectangle, diagonal gradient `#1a4b6b` → `#123a57` → `#0a2136`, concentric ripple rings every 9 units at 14 % alpha, three-row zigzag wavelets in the corners, a faint diagonal sheen and a bevelled gold edge. Three ripple rings expand from the centre at runtime.
- **Garden (17 %).** Hedge border `#082219` with a gold band; lawn `#0f3a2b` with 12-unit diagonal stripes `#123f2f`; four stepped parterre beds `#0a2f23` with a pin-line and 16 dotted planting rays (`rgba(70,170,130,.55)`, dash 1.5/1.7) around a small gold circle; terrazzo cross paths 14 wide with gold edges; a central basin (ivory ring r 15, water r 10.5, emerald 8-point star).

After each bay, a **varnish** darkens it — `rgba(4,5,9,.44)` over the busy all-over patterns (harlequin, scallop, chevron), `rgba(4,5,9,.3)` over the focal bays (medallion, pool, garden). The promenades read as a brighter frame, the eye goes to the medallions, and the figures stay the clearest read.

**Promenades:** 28-unit bands of calm midnight terrazzo (only 560 chips per 160-px tile) along every grid line; bevelled gold borders at ±12.4 (w 1.1), pin-lines at ±9.6; ivory lozenge studs (2.4 × 1.3) every 20 units on the centre line. **Crossings:** a 24.8-unit gold-framed square with an onyx disc r 10.4, a polished ring, an 8-point gold compass star (9.2 / 3) with a brighter 4-point star over it and an ivory centre dot.

**Textures:** marble = 192 px tileable texture: `n = fbmTile(u·4, v·4)`, `vein = (1 − |sin(2π(2u + v + 1.7n))|)^16`, a second finer vein with exponent 26 at 70 %, base mixed to cloud colour by `smoothstep(.3, .75, n)`. Used as a pattern at 0.62 (onyx), 0.55 (emerald), 0.6 (midnight), 0.5 (ivory) units per texel, rotated by a random multiple of 90° and offset per bay so neighbouring bays never match. Terrazzo = 160 px midnight base with 1100 polygon chips drawn with 9-offset wrapping.

## Characters

**Main character — the gentleman** (feet at 0, ~31 × 42 units, sprite stretched 1.1 horizontally, baked at 1.06).
- **Jacket:** ivory polygon with squared shoulders (±5.9 at −23.6), waist ±3.9 at −15.4, a hem at −11 with a pointed front cutaway, gradient `#fffaf0` → `#f1e6cb` → `#cdbb93`, a translucent shade band on the back side, a gold hem trim (0.5 + 0.18 highlight).
- **Front:** a white shirt wedge, black satin lapels with a faint sheen line, a black bow tie with a 1-unit gold knot, two gold buttons, a gold **fan pocket square** (half disc with three ray lines).
- **Head:** a geometric champagne profile with a nose step, slicked black hair under the brim with a sheen line, a short closed-eye stroke, a brow and a thin moustache.
- **Top hat:** satin crown (`#2a2b33` → `#0c0d11` → `#1a1b21`), curled brim, a gold band and a vertical sheen line.
- **Legs:** black satin quads (1.85 → 1.3 half-width), black shoes with a shine line and ivory spats; arms are ivory sleeves with black cuffs and white gloves; the front hand holds a black cane with a gold knob and ferrule.
- **Frames:** 6 walk frames (legs ±0.44 rad, foot lift 1.5 on the forward swing, arms ±0.36 opposite, cane swing) + 3 idle poses (standing; eyes closed as a 0.3-unit line; a cane tap with the arm lifted to −0.28 rad and the cane out to 0.72 rad); mirrored for facing; a ruby-tinted flash `#ff8a7a` when hurt.

**Small creature — enamel scarab** (~39 × 23 units, baked at 1.3). A domed shell (upper half-ellipse 8.4 × 6.4 plus a shallow lower curve) filled with a three-stop enamel gradient — jade `#6fd8b8` / `#1f9a80` / `#0a4a40`, lapis `#86a8f2` / `#3460c0` / `#15296a` or onyx `#5a5d6b` / `#1f2129` / `#060709`. Clipped inside: 9 gold sunburst engraving lines fanning back from the front, two concentric arcs, a soft highlight. A gold split line, a bevelled gold rim, an onyx thorax plate with a gold edge, an onyx head with an ivory eye and a **gold sun disc** with 8 rays at the front. Six legs in two layers, the near ones with a gold highlight; 4-frame tripod gait.

**Fast creature — swift** (seen from above, wingspan ~31 units, hovering 13 units). Two swept crescent wings in pearl (`#fffaf0` → `#c9b98f`) with three chevron bands (jade, gold, jade) and a gold leading edge; a jade streamlined body with a midnight cap, a gold centre line, a gold beak, ivory eye dots and a gold forked tail. 4 wing-span frames (1, 0.72, 0.38, 0.72); the sprite rotates to its flight direction; three parallel gold speed lines trail behind.

**Large creature — guardian statue** (~42 × 64 units). A gilded rectangular mask with a tapering chin, glowing jade eye slits `#9ff7de` with a soft halo; a fan headdress of 11 alternating gold / emerald wedges behind the head; a stepped bronze torso (shoulder block ±15.5, chest steps to ±8.4) with a gold rim, a stack of three gold chevrons and a gold sun medallion with a jade gem; block arms with gold bracers and gold fists; a black pleated kilt with gold pleat lines; stepped legs with gold bands and onyx feet. 4 heavy stepping frames (foot lift 1.8, body bob 0.8).

**Shared rules:** ink outline + gilded rim on every figure; hit flash = ivory silhouette up to 90 % with a 12 % squash and a 0.2 rad tilt away from the push.

**Appearing** (0.45 s): a gold sigil opens on the floor; from 20 % the figure **rises out of it** — rows of the baked gold silhouette revealed bottom-up (ease-out cubic) behind a bright `#fff0b8` reveal line 0.7 units thick, lifting 5 units; from 80 % the enamel sprite takes over while the gold fades, with a decaying 8 % squash (`sin(2πv)(1 − v)`). The swift drops in from 26 units instead.

**Vanishing** (0.35 s): for 18 % the figure gilds — gold silhouette swelling 6 % under a fading ivory flash; then it **splits into stepped horizontal bands** (6, or 9 for the large figure) drawn as row ranges of the gold silhouette, sliding apart alternately left and right with an ease-out cubic (spread 8 units, 12 for the large figure, growing towards the bottom), dropping with `u²` and fading from the top band down. Gold leaf and enamel chips take over.

## Props

All props are baked with a 0.6-unit ink outline (no gold rim) and placed **by the layout**, not randomly:

- **Statue** (on 55 % of medallions): a three-step onyx plinth (36 / 28 / 20 wide) with gold bands, a half-sunburst relief on the front; a slender gilded sun-bearer figure with raised arms holding a sun disc (r 5.4) with 16 alternating rays. ~80 units tall.
- **Fountain** (on 25 % of medallions and every pool): an octagonal ivory basin in 3/4 view (28 × 10.5) with gold rim, water with ripple ellipses, a stepped fluted column, a scallop-shell bowl and a gold finial. Water is drawn per frame: 7 arcs from the nozzle to the bowl and 6 arcs from the bowl to the basin, pale teal `rgba(200,245,235,.85)` 0.5 units, dash [2.4, 1.8] flowing at 9 units/s, plus an expanding ripple ring.
- **Palm** (four per garden): a stepped onyx planter with gold chevrons, a slightly curved segmented bronze trunk with gold rings, 9 straight-edged lozenge fronds (4 dark back, 5 front) with serration marks and gold midribs, three gold dates.
- **Topiary** (garden path ends, scallop corners): an ivory cube with a gold frame and an onyx diamond inlay, five stacked emerald tiers with chevron shading and gold edges, a gold spire.
- **Fan urn** (harlequin and chevron bays): a fan leaf of 9 pleated jade / emerald wedges with gold ribs and rim, in an onyx chevron vase with a gold lip.
- **Lamp post** (four around every other crossing, in the bays' stepped corners): stepped base, onyx pillar with fluting and three gold rings, a three-tier glowing glass lantern with gold mullions, a gold spire; an additive warm glow (radius ~26) flickering ±6 %.

Props cast a soft radial contact shadow; tall props become 55 % translucent while the main character is behind them.

## Effects and particles

- **Gold dart projectile:** a slim gold lozenge (6.4 front, 4.6 back, 1.9 wide) with a bright centre line and three parallel pin-line streaks fading behind, rotated to the flight angle, over a small additive glow.
- **Orbiting sun disc:** a gold disc r 4.4 with 12 alternating rays (6.6 / 8.6) and a glowing ivory core, spinning at 2.2 rad/s, with an additive glow and a ground shadow 8 units below.
- **Collectibles:** small = an emerald step-cut gem (octagon with two inner facet rings, gold bezel) that "turns" by squeezing its width; large = an Asscher-cut ivory diamond with stepped facets, gold bevel and four gold prongs, a warm glow and a twinkling glint. Both bob 3 ± 1.1 units.
- **Sunburst flash:** 8–28 radiating gold lines, alternate ones 72 % long, expanding with outQuad from 20 % to 100 % of the radius and fading, additive; flattened to half height when lying on the floor.
- **Gold leaf burst** (a creature vanishes): 8–16 gold leaf flakes (3.2 × 1.8) flipping between a gradient front and a dark `#8a611d` back, light gravity and high drag; 4–8 enamel shards in the creature's colour with a gold edge; a double gold floor ring; 2–4 glints. The large creature adds a short screen shake.
- **Impact:** a 4-point glint (white core, gold arms) plus a 10-ray sunburst and two gold flakes at hit height.
- **Glow-up:** a large double gold floor ring, a flat 28-ray sunburst, an upright 16-ray burst, 20 gold leaves, 8 glints; an 18-ray sunburst halo rotates behind the main character.
- **Dash:** a 35 ms crouch first, then three gold silhouettes trailing 7 units apart, three parallel gold streaks behind, small glints.
- **Hurt:** ruby-tinted rays `#ff7a6a`, ruby shards and a ruby flash over the main character.

## Atmosphere and lighting

- **Warm light from above:** radial `rgba(255,214,140,.13)` centred above the top edge, plus 28 thin additive sunburst rays at 7 % alpha fanning downward — like light from a great lobby window.
- **Vignette:** radial to `rgba(4,5,9,.66)` in the corners; it frames the scene and deepens the blacks.
- **Screen frame:** a stepped gold double pin-line 7 units from the edge (1.0 + 0.45 units, 75 % alpha) with quarter sunburst fans in the corners.
- **Gold dust:** one mote on half of the cells of a 95-unit grid, rising slowly and twinkling (15–75 % alpha), drawn additively with the glint sprite at 0.2–0.5 scale.
- **Shadows:** soft radial black ellipses (alpha .6 at the core) — main character 8.2 × 2.8, scarab 12.5 × 3.9, guardian 19 × 5.8; flying swifts keep a lighter shadow 13 units below.
- **Glow** only on light sources and treasure: lanterns, sun discs, the large collectible, the guardian's eyes. Surfaces are polished, never neon.

## UI

- **Panels:** notched two-step corners via `clip-path` (3 px steps), a 12 px SVG `border-image` frame: a metallic gradient outer line, a thin `#c99a3c` inner pin-line with smaller steps and four tiny gold diamonds; background `linear-gradient(180deg, rgba(20,28,52,.94), rgba(8,9,13,.95))`.
- **Top bar:** a 12 px black channel with a 1 px gold border, a 3 px black gap and a second faint gold ring (box-shadow); the fill is the gold gradient with dark fluting every 8 px.
- **Panel bar:** 230 × 14 px black channel with a dark gold border; ruby fill (`#f39a92` → `#c23b45` → `#7d1a26` → `#a92c38`) with fluting every 9 px.
- **Title panel:** framed panel with Limelight 34 px gold-gradient digits and a jade caption with .5em tracking.
- **Counter:** framed panel with an icon and Limelight 24 px ivory digits.
- **Cards:** 236 × 306 px, 18 px card frame (outer metallic line, double inner lines, small sunburst fans in the corners), notched corners (4.5 px). Background: a repeating conic **sunburst header** of gold rays from the top centre, a jade radial glow, a midnight → black gradient. A circular icon well (108 px) with a double gold ring; the name in Limelight 20 px caps; text in Josefin Sans 15 px `#c9bb98`; a gold diamond badge with the number sitting on the top frame line. Cards rise and fade in, staggered.
- **Modal title:** Limelight 64 px caps, gold gradient text, flanked by double pin-lines 150 px long; the backdrop is a dark radial gradient with a fine conic sunburst of gold rays at 6.5 % alpha.
- **Icons:** drawn in a 48-unit box with an ink outline (stroke 2 × 1.2–1.6) and gold-gradient fills: a ruby heart in a gold bezel, a jade scarab with a sun disc, gold darts, stacked chevrons, a zigzag bolt, a stepped glowing lantern, a stepped wing, a horseshoe magnet with ivory tips, a gold goblet with a ruby gem, a sun disc as fallback.

## Motion and animation

- Main character: 6 walk frames over 5.6 animation units per cycle, |sin| bob 0.9 units, 0.03 rad lean; idle breathing ±1.2 % at 2.2 rad/s, a cane tap every 4.3 s (rising 0.4 units on the toes), a blink every 3.2 s.
- Dash: 35 ms crouch (−10 % y, +7 % x), then lean 0.16 rad, three gold afterimages at alpha 0.42 / i, gold streaks. Hurt: 0.16 rad recoil.
- Scarab: tripod gait, 4 frames; swift: 12 wing frames per second, hover bob ±1.6 units; guardian: slow 4-frame stomp with ±0.02 rad sway.
- Appear 0.45 s: floor sigil grows (outQuad) and fades on a sine, the figure rises out of it (20–80 %) and settles (80–100 %); vanish 0.35 s: gilding (0–18 %), stepped bands sliding apart and falling (18–100 %).
- Sunbursts expand with outQuad in 0.2–0.7 s; gold leaf flips at 10 rad/s; glints scale up in the first quarter of their life and shrink.
- Ambient: lantern flicker ±6 % at 5 rad/s, fountain dashes 9 units/s, pool ripples every ~8 s, rising gold motes.
- UI: rise-and-fade entrance (24 px, 0.5 s, staggered 0.08 s); hover lift 8 px with a slight brightening.

## Do and don't

**Do**
- Draw gold as metal: banded gradients, three-pass bevel strokes, radial-gradient rings.
- Keep everything symmetric and on a grid — bays, props and ornaments are centred or mirrored.
- Use stepped (ziggurat) corners on frames, plinths, planters, panels and cards.
- Repeat the motifs: sunbursts, fans, chevrons, concentric arcs, parallel pin-lines.
- Varnish the floor fields so ivory figures and gold rims read first.
- Outline every figure in ink plus a gilded rim.
- Set titles in wide-spaced capitals; keep body text small and quiet.

**Don't**
- Don't use flat yellow for gold or let gold fill big areas.
- Don't use organic blobs, wobbly hand-drawn lines or brush textures.
- Don't add pastels or new hues.
- Don't scatter props randomly.
- Don't wrap every shape in dark lead lines (that is stained glass) or use pointed gothic arches.
- Don't put neon glow or bloom on ordinary surfaces.
- Don't let the floor become brighter than the figures.
- Do make appearing and vanishing geometric: reveal figures from the floor sigil upwards, split them into stepped bands that slide apart — never a plain fade.
- Don't repeat one medallion as a stamp; vary ray count, glass and star per bay and let the busy all-over patterns sit back.

## Implementation recipe

1. **Palette and gold helpers:** write `gold(ctx, x0, y0, x1, y1)` (six-stop gradient), `gl(ctx, w)` (three-pass bevel stroke), `ringG(...)` (radial ring) and `stepRect(...)` (notched corners). Use them for everything.
2. **Textures:** bake tileable marble (sine veins warped by tileable fbm) for onyx, emerald, midnight and ivory, and a terrazzo chip texture. Create patterns per chunk and set `pattern.setTransform(scale)` so they are anchored to world units.
3. **Floor:** for each 200-unit bay overlapping the chunk, pick a type by hash, clip to the bay, draw it, varnish it. Then draw promenades and rosettes over the grid lines. Yield after every bay.
4. **Figures:** write each figure as a function of pose parameters using polygons and gradients; bake every frame; add the gilded rim and ink outline by stamping tinted silhouettes; derive flash and gold copies.
5. **Props:** bake each prop once; place them at bay centres, parterre centres, corners and crossings; animate only the fountain water and lantern glow.
6. **Effects:** a glint sprite, gold leaf front/back sprites, enamel shards, glow gradients; sunburst rays and rings are a few strokes.
7. **Atmosphere:** bake one screen overlay per resolution (warm top light, rays, vignette, frame); add gold dust motes.
8. **UI:** SVG border-image frames + stepped clip-path, gold gradient text, fluted bars, conic sunburst headers.

## Code

Metallic gold fill, bevel line and polished ring:

```js
const GSTOPS = [[0, '#fff0b8'], [0.18, '#e9bf5c'], [0.42, '#9a6c22'], [0.56, '#c8973a'], [0.78, '#f5d98a'], [1, '#7d561a']];
function gold(c, x0, y0, x1, y1) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  for (const s of GSTOPS) g.addColorStop(s[0], s[1]);
  return g;
}
// stroke the current path as an inlaid brass line
function goldLine(c, w) {
  c.strokeStyle = '#5a3d10'; c.lineWidth = w * 1.55; c.stroke();
  c.strokeStyle = '#b8862f'; c.lineWidth = w; c.stroke();
  c.strokeStyle = '#fff0b8'; c.lineWidth = w * 0.34; c.stroke();
}
function goldRing(c, x, y, r, w) {
  const g = c.createRadialGradient(x, y, r - w / 2, x, y, r + w / 2);
  [[0, '#5a3d10'], [0.3, '#f5d98a'], [0.5, '#fff0b8'], [0.72, '#c8973a'], [1, '#5a3d10']].forEach((s) => g.addColorStop(s[0], s[1]));
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.lineWidth = w; c.strokeStyle = g; c.stroke();
}
```

Notched (ziggurat) corners, used for frames, bays, plinths and panels:

```js
function stepRect(c, x0, y0, x1, y1, s) {
  const d = 2 * s;
  const pts = [[x0 + d, y0], [x1 - d, y0], [x1 - d, y0 + s], [x1 - s, y0 + s], [x1 - s, y0 + d], [x1, y0 + d],
    [x1, y1 - d], [x1 - s, y1 - d], [x1 - s, y1 - s], [x1 - d, y1 - s], [x1 - d, y1],
    [x0 + d, y1], [x0 + d, y1 - s], [x0 + s, y1 - s], [x0 + s, y1 - d], [x0, y1 - d],
    [x0, y0 + d], [x0 + s, y0 + d], [x0 + s, y0 + s], [x0 + d, y0 + s]];
  c.moveTo(pts[0][0], pts[0][1]);
  for (const p of pts.slice(1)) c.lineTo(p[0], p[1]);
  c.closePath();
}
```

The sunburst medallion (centre of a bay):

```js
function medallion(c, cx, cy, R, emerald, onyx) {
  c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fillStyle = onyx; c.fill();
  c.beginPath();
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2 - Math.PI / 2;
    c.moveTo(cx + Math.cos(a) * 15, cy + Math.sin(a) * 15);  // rays taper to a point near the centre
    c.arc(cx, cy, R, a - 0.105, a + 0.105);
    c.closePath();
  }
  c.fillStyle = emerald; c.fill();
  c.strokeStyle = '#c99a3c'; c.lineWidth = 0.45; c.stroke();
  goldRing(c, cx, cy, R, 3.4);
  c.beginPath(); c.arc(cx, cy, 14, 0, Math.PI * 2); c.fillStyle = '#f2e8d0'; c.fill();
  goldRing(c, cx, cy, 14, 2.4);
}
```

Baking a figure with an ink outline and a gilded rim:

```js
function bake(w, h, ox, oy, K, draw) {
  const src = document.createElement('canvas'); src.width = w * K; src.height = h * K;
  const s = src.getContext('2d'); s.scale(K, K); s.translate(ox, oy); draw(s);
  const tint = (col) => {
    const t = document.createElement('canvas'); t.width = src.width; t.height = src.height;
    const c = t.getContext('2d'); c.drawImage(src, 0, 0);
    c.globalCompositeOperation = 'source-in'; c.fillStyle = col; c.fillRect(0, 0, t.width, t.height);
    return t;
  };
  const out = document.createElement('canvas'); out.width = src.width; out.height = src.height;
  const o = out.getContext('2d');
  const stamp = (img, r, n) => { for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; o.drawImage(img, Math.cos(a) * r, Math.sin(a) * r); } };
  stamp(tint('#c9973a'), (0.6 + 0.42) * K, 16); // gilded rim
  stamp(tint('#07080b'), 0.6 * K, 12);          // ink outline
  o.drawImage(src, 0, 0);
  return out;
}
```

## Adapting it to your project

- **Lighter variant:** swap onyx for ivory marble as the floor base and keep emerald and gold for the inlays; give figures a midnight outline instead of ink. Raise the varnish so gold stays below the figures.
- **Different setting:** the bay system works for casino carpets (replace bays with card-suit medallions), ocean liners (portholes, wave chevrons), hotel lobbies or museum halls.
- **Side view:** use the same frames as building facades — stepped skyscraper silhouettes, sunburst spandrels, fluted pilasters and chevron friezes.
- **New figures:** start from one geometric silhouette (a trapezoid, a stepped block, a fan), add one enamel colour, a gold trim line, a gold accent shape (disc, fan, chevron) and bake with the rim. Keep faces minimal: one eye stroke or glowing slits.
- **Busy scenes:** increase the varnish to 40 % and cut the bay pin-lines first; the promenades and the medallion rings carry the look on their own.
- **UI only:** the CSS kit (SVG frames, stepped clip-path, gold text, sunburst header) can skin any interface without the rest of the style.

## Performance notes

- Init (~150–250 ms): five textures (per-pixel fbm), 7 main-character poses, 12 scarab, 4 swift and 4 guardian sprites, each with flash and gold copies, 6 props, effect sprites.
- Per frame: blits with `setTransform`, a handful of strokes, one cached overlay — about 2 ms median with 50–100 figures at 1600 × 900, cheaper than most styles.
- Floor chunks: 256 units, up to 640 px, drawn by a generator yielding per bay (2–4 ms each). The scallop bay (~120 gradient circles) is the most expensive; cache it if you draw the floor every frame.
- Gradients are created at bake time or per chunk; avoid creating them per figure per frame.
- The fountain uses `setLineDash` per frame; with many fountains on screen, bake 8 dash phases instead.

## Copy-paste prompt

```text
Use the "Art Deco Gold" art style for my project:
- 1920s grand-lobby elegance. Palette: onyx #0d0e12, midnight #0f1a33, terrazzo #18233f, emerald #0e4a40,
  jade #2a9c84, metallic gold (#5a3d10 / #b8862f / #e6c15a / #fff0b8), ivory #f2e8d0, a touch of ruby #b8323f.
- Gold is always metal: a six-stop banded gradient for fills, a three-pass bevel stroke (dark, mid, bright
  highlight) for lines, radial gradients for rings. Never flat yellow, never large gold areas.
- Strict geometry: sunbursts, stepped ziggurat corners, chevrons, fan scallops, concentric arcs, parallel pin-lines.
  Everything symmetric and on a grid.
- Ground: a grand floor of square marble bays (sunburst medallions, harlequin diamonds, fish-scale fans, chevrons,
  reflecting pools, parterre gardens) with gold frames, separated by terrazzo promenades with gold borders and
  compass rosettes. Darken the bays slightly so figures read first.
- Figures: elegant geometric cut-outs with an ink outline plus a thin gold rim; one enamel colour per creature.
  Main character: a dapper gentleman in an ivory dinner jacket, top hat with gold band, cane.
- Props: gilded statues on stepped plinths, tiered fountains with fan-shaped water, geometric palms, topiaries,
  fan plants in chevron vases, streamlined lamp posts with glowing stepped lanterns.
- Effects: gold sparkles, sunburst flashes, flipping gold leaf, double gold rings.
- Atmosphere: warm light and faint rays from above, deep vignette, drifting gold dust, a stepped gold frame.
- UI: panels with notched corners and gold double borders, sunburst card headers, Limelight capitals in gold
  gradient, Josefin Sans body text, Poiret One hints.
- Motion: idle with blinks and a cane tap, a crouch before the dash; creatures rise out of a gold floor sigil (bottom-up gold reveal behind a bright line) and vanish by gilding and splitting into stepped bands that slide apart and fall; medallion bays come in 3 variants.
```
