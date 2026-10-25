# Trick or Treat — Game Art Style Spec

> A glossy Halloween candy world: hard-candy shine, gummy jelly, matte marshmallow and chocolate on a melting chocolate floor.

Everything in this world is edible and rendered like a premium candy commercial. Each body part is a path filled with a radial gradient lit from the top-left, then given clipped "material passes": a saturated jelly edge, a warm inner glow, ribs or stripes, a lower-right rim light, and sharp white speculars. The finished sprite gets one soft cocoa-plum silhouette outline and nothing else. Below the characters lies a milk-chocolate bar floor with sunken caramel pools, pink strawberry sugar-sand, raised mint frosting with dripping glossy edges and dark cookie-crumb paths, all sprinkled with sprinkles. In the reference game (*Jack vs. the Turnip Ancestors*) the hero is a hard-candy pumpkin with a licorice body; the enemies are two-layer gummy turnips, marshmallow ghosts and a dark-chocolate brute with glowing caramel cracks.

## At a glance

| Property | Value |
| --- | --- |
| Family | Rendered Cartoon · Candy Gloss |
| Mood | sweet, playful, glossy, festive, cheeky |
| Best for | cute horde survivors, casual arcade, character puzzle games, holiday events |
| Renderer | Canvas 2D, procedural, no image assets |
| Pixel art | No (smooth, sprites baked at 3–6 px per world unit) |
| Difficulty | 6/10 |
| Fonts | Chewy (numbers, titles), Sniglet 400/800 (labels, body) |
| Key colours | `#7e4c32` chocolate, `#3a1424` cocoa outline, `#ff8d1e` candy orange, `#ffe07a` caramel glow, `#9443d8` / `#d83a8e` / `#5b52e0` gummies, `#f4acc2` pink sugar, `#a0dab8` mint |

## When to use it

- **Good fits:** cute horde survivors, casual arcade shooters, match-3 or puzzle games with characters, seasonal/holiday events, kids-friendly action, anything with "collect lots of shiny stuff".
- **Why it works:** the glossy material reads as "valuable / delicious", so pickups and kills feel rewarding; the warm ground lets saturated sprites pop; sprinkles make every action feel like a celebration.
- **Bad fits:** grim, realistic or horror-serious tones (it is always cheeky); retro low-colour games; dense strategy UIs that need calm neutrals.
- **Risk:** with too many hues and effects at once it turns into "candy chaos". Hordes of 200+ still read because every enemy shares the same silhouette treatment and outline.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Milk chocolate | `#7e4c32` | Ground base and 34-unit bar grid (~45% of the screen) |
| Choc groove | `#5d3825` | Grooves between chocolate bars (base × 0.74) |
| Caramel edge | `#ec9c3a` | Caramel pool edge band |
| Caramel deep | `#b25a1a` | Caramel pool interior |
| Strawberry sugar | `#f4acc2` | Pink sugar-sand meadows |
| Mint frosting | `#a0dab8` | Mint frosting meadows |
| Cookie crumb | `#543226` | Dark cookie-crumb paths |
| Cocoa outline | `#3a1424` | Every outline, HUD border, text outline; shadows use rgba(45,12,22,·) |
| Candy orange | `#ff8d1e` | Hero head mid (light `#ffd08a`, dark `#d24e0b`) |
| Caramel glow | `#ffe07a` | Glow inside carved faces, cracks, halos |
| Licorice | `#2c1a2a` | Hero body/limbs (light `#6a4a66`, dark `#120810`) |
| Mint scarf | `#3fd6c1` | Hero accent, white-striped (dark `#1fa596`) |
| Gummy purple | `#9443d8` | Small enemy (hi `#d9a2ff`, dark `#56168f`) |
| Gummy pink | `#d83a8e` | Small enemy (hi `#ffa6d2`, dark `#86104f`) |
| Gummy blue | `#5b52e0` | Small enemy (hi `#b8b0ff`, dark `#262092`) |
| Jelly leaf | `#55cc48` | Leaves (light `#c9ff9e`, dark `#22852e`) |
| Marshmallow | `#fbf5fb` | Fast floater (white centre, edge `#dccbe4`) |
| Dark chocolate | `#55291a` | Brute (light `#9a5e3e`, dark `#2a120a`) |
| Hot pink | `#ff5c9e` | Hit-star outline, number stripes, accents |
| Sugar flash | `#fff3f8` | Hit-flash tint |

Sprinkle set (fixed): `#ff4f8b #ffd23a #4fd6ff #7ee26a #b88cff #ff9a3a #ffffff`.

**Palette rules**
- Every material is a *triple* (light / mid / dark) used inside one radial gradient. No body is a flat fill.
- Highlights are pure white. Shadows, outlines and vignette are warm cocoa-plum — never black, never grey, never blue.
- Ground ≈ mid value, warm and slightly desaturated; characters are fully saturated with white speculars → strong figure/ground separation.
- Glow ramp for everything lit from inside: `#fffbd6 → #ffe07a (35%) → #ffa12a (75%) → #e2650e`.
- Enemy variants change only the gummy hue; shared white bottom layer and green jelly leaves keep the family readable.

## Typography

**Chewy** (400) — HUD numbers, timer, titles, damage numbers, card names. https://fonts.google.com/specimen/Chewy
**Sniglet** (400, 800) — labels, descriptions, hints. https://fonts.google.com/specimen/Sniglet
Load: `https://fonts.googleapis.com/css2?family=Chewy&family=Sniglet:wght@400;800&display=swap`

```css
.timer { font: 400 38px/1.1 'Chewy', cursive; letter-spacing: 2px; color: #fff;
  /* 16-direction cocoa outline (generated) + 2 px drop below */
  text-shadow: 2.5px 0 0 #3a1424, -2.5px 0 0 #3a1424, 0 2.5px 0 #3a1424, 0 -2.5px 0 #3a1424,
               1.8px 1.8px 0 #3a1424, -1.8px 1.8px 0 #3a1424, 1.8px -1.8px 0 #3a1424, -1.8px -1.8px 0 #3a1424,
               0 4.5px 0 #3a1424; }
.label { font: 800 12px/1 'Sniglet', sans-serif; letter-spacing: 1.6px; color: #fff3e0; text-shadow: 0 1px 0 rgba(120,30,0,.8); }
.title { font: 400 84px 'Chewy', cursive; letter-spacing: 3px; color: transparent;
  background: repeating-linear-gradient(-50deg, #fff 0 14px, #ff7ab0 14px 26px); -webkit-background-clip: text; background-clip: text;
  filter: drop-shadow(2.5px 0 0 #3a1424) drop-shadow(-2.5px 0 0 #3a1424) drop-shadow(0 2.5px 0 #3a1424) drop-shadow(0 -2.5px 0 #3a1424) drop-shadow(0 6px 0 #3a1424);
  transform: rotate(-3deg); }
```

Text effects: the module builds `text-shadow` from 16 offsets on a circle of radius w (`tso(w, col, drop)`), optionally plus 3 shadows pushed down by `drop` px for a 3-D "candy button" base. Titles are peppermint-striped (white/pink at −50°) via `background-clip: text`, tilted −2…−3°.

**Damage numbers on canvas:** Chewy at 9.5 units (crits 13), fallback `bold "Sniglet", "Arial Rounded MT Bold", sans-serif`. Stroke cocoa at 0.42·size twice (second one offset 0.08·size down), then white stroke 0.2·size, then fill: normal = white with pink stripes `rgba(255,92,150,.85)` at −0.7 rad (stripe 0.15·size, pitch 0.33·size); crit = vertical gradient `#fff27a → #ffbe2e → #ff7a1a` with white stripes; finally a top gloss gradient (white 0.65 → 0). Pop scale 0.3 → 1.35 → 1.0, fade in the last 18%.

## Rendering technique

1. **Units.** The camera shows 360 world units vertically; S = screen px per unit. Sprite bake resolution `K = clamp(round(S·1.25), 3, 6)` px per unit.
2. **Bake at init (`build(box, fn, opt)`):** create a canvas for the world-space box + 1-unit margin, `scale(K)`, `translate(-left, -top)`, round joins/caps, run the part-drawing function, then add the outline: make a solid copy tinted `#3a1424` (`source-atop`), stamp it 12 times (16 if the outline is > 2.5 px) on a circle of radius `ol·K` px, draw the original on top. Default `ol = 0.5` units.
3. **Per character:** 4 walk frames × {normal, flash-tinted `#fff3f8`, mirrored, mirrored flash} (`set4`). Hero also has a 4-frame "hurt face" set. Ghosts get a `destination-in` gradient fade at the hem (alpha 1 at y = −8 → 0.35 at y = 1).
4. **Part drawing order inside a sprite (back to front):** back accessories (scarf tail, leaves) → back arm → legs → body → front details → front arm → collar/scarf → head → face → speculars → leaf on top.
5. **Material passes per part:** (a) `gloss` radial fill; (b) clipped passes (`clipDo`): jelly edge, inner glow, stripes, ribs, grooves; (c) `rim` lower-right light; (d) `spec` white ellipses.
6. **Ground:** per-pixel material compositing into 256-unit chunks (generator, yields every few rows), max 2.5 px/unit; decals stamped afterwards at 4 px/unit.
7. **Per frame:** ground chunks → ground overlay (spawn wrappers) → pickups → shadows → y-sorted props/enemies/hero → orbitals → projectiles → particles → numbers → world overlay (drifting sugar sparkles, additive) → screen overlay (vignette).
8. All dynamic motion (squash, bob, tilt, flash) is applied at blit time through the transform; nothing is re-rendered per frame.

## Background and ground

The floor is computed per pixel from noise fields sampled on a 4-unit grid and bilinearly interpolated; each material layer is a signed field (positive = inside) whose value divided by its gradient gives a distance in pixels → perfectly antialiased edges plus distance-based shading.

- **Milk chocolate (base, `#7e4c32`)**: where a low-frequency mask (`smoothstep(.44,.58, fbm(x/620))`) is on, a **34-unit bar grid**: groove < 0.9 units darkens up to −26%; top/left 3.2-unit bevel +11%; bottom/right bevel −9%; bar centre a faint +2.5% dome. Where the mask is off, the chocolate "melts": sine gloss bands `sin(phase + x·0.018 + y·0.062)` > 0.6 brighten up to +9%, < −0.7 darken. Global tint ±4.5% from very low-frequency noise.
- **Caramel pools (sunken)**: colour from `#ec9c3a` at the edge to `#b25a1a` 0.05 field units inside. Thin glossy streaks where `sin(y·0.2 + x·0.035 + warp)` > 0.955 lerp toward rgb(255,232,170). Upper inner edge darkens (−38% falloff over 4 units: the lip casts shadow into the pool); lower inner edge gets a light lip rgb(255,226,160) between 0.7 and 2 units in. Outside the pool, the chocolate brightens 12% within 1.3 units.
- **Pink sugar-sand `#f4acc2`**: per 0.5-unit texel hash grain ±3.5%, 0.3% of texels pure `#fff6fa` sparkle; drop shadow (rgb 60,22,30) up to 28% within 2.6 units, stronger on down-facing edges; top edges +12% lighter, bottom edges −12%, very edge −12%.
- **Mint frosting `#a0dab8` (raised)**: piped ridges `sin((y + warp + x·0.16)·0.62)` ±4.5%, ridge crests lerp to white. Down-facing edges grow **drips** (every 4.2 units, 62% chance, up to 9 units long, parabolic profile). Shadow below up to 50% over 5 units. A white gloss line 0.45–1.35 units inside up-facing edges (75%), top edges +16% lighter, bottom −22%, last 0.6 units −16%.
- **Cookie-crumb paths `#543226`**: thin noise ridge `|perlin| < 0.0155` as a winding band; texture = 128-texel tileable Worley cells (0.5 units per texel), each cell domed and lit from the top-left (0.78 + 0.22·edge ± light); edge displaced by fBm for a crumbly outline; −20% at the edge and a sunken shadow on the upper side.
- **Decals** (one candidate every 15 units, 42% kept, only where the material is uniform within 4 units; each with an `rgba(50,15,20,.25)` ellipse shadow offset (0.3, 0.4)): chocolate chips, sprinkle triples, candy corn, mini marshmallows, mini pumpkins on chocolate; star glints on caramel; glints, hearts, mini lollipops, gumdrops on sugar; frosting dollops, gumdrops, sprinkles on mint; crumbs and chips on paths.

## Characters

**Hero (reference: candy pumpkin, sprite box −14…14 × −33…2 units, drawn at scale 1.06)**
- **Head** — hard-candy pumpkin: `pumpkinPath(cx 0.4, cy −19.6, rx 11.2, ry 9.1)` (superellipse with exponents 0.85/0.92, top indent 15%, bottom 7%). `gloss(#ffd08a, #ff8d1e, #d24e0b)`. Clipped: warm inner glow radial at (+2.5, +2.5) r 10 `rgba(255,214,110,.55→0)`; 4 ribs (quadratic curves at s = ±0.3, ±0.7) dark `rgba(196,72,8,.55)` 0.7 wide with a light twin `rgba(255,214,150,.45)` 0.45 wide offset −0.6. Rim `rgba(255,236,150,.9)` width 2.2.
- **Face** — triangle eyes and grin as `caramelHole`s: fill `#7a2406`, then the same shape shifted (0.2, 0.55) filled with the glow ramp → a dark carved rim on the top-left and bright caramel inside. Grin has 3 small orange `#ff9a2a` teeth. Hurt face: chevrons `>` `<` (dark 1.9 + light `#ffe07a` 0.8) and a small round mouth.
- **Speculars** — main ellipse at (cx−6, cy−4.6) 2.9×1.35, rot −0.6, alpha 0.92; dot at (cx−3, cy−6.9) 0.75×0.6; side streak at (cx−8.4, cy+1.2) 0.6×1.6 alpha 0.45.
- **Stem/leaf** — green-apple candy stick capsule (`#c8f59a/#62c043/#2f7a2a`) with white stripes, jelly leaf + curly tendril.
- **Body** — licorice ellipse 4.5×4.4 at y −8.3: `gloss(#6a4a66, #2c1a2a, #120810)` + rim `rgba(190,130,200,.55)` width 0.5r + diagonal twist grooves; two candy buttons (`#ffd43f`, `#ff5c8a`).
- **Limbs** — licorice capsules r 1.15 (arms) / 1.35 (legs), marshmallow-white mitten hands, glossy red jelly shoes `#ff8fa8/#e8304f/#8f0f2a` with a 0.75×0.32 spec.
- **Scarf** — mint gradient `#3fd6c1→#1fa596` with white stripes (1.0 wide, 1.3 gap) and a top-light/bottom-dark overlay; a waving tail behind.
- **Frames** — 4 frames of `[backFootX, backFootY, frontFootX, frontFootY, backArm, frontArm, scarfPhase]`: `[-2.3,0,2.3,0,.25,-.25,0]`, `[-3.7,-.2,3.9,-.5,.9,-.8,1.6]`, `[-2,-1.5,2.9,-2.1,.35,-.15,3.2]`, `[2.7,-.6,-1.3,-.2,-.75,.85,4.8]`. Facing = mirrored sprite.
- **Halo** — additive radial glow (18 units, `rgba(255,200,90,.8) → rgba(255,160,60,.32) @35% → 0`) at the head, alpha 0.32 ± 0.06 flicker.

## Enemies and props

**Small melee enemy — two-layer gummy (box −13…13 × −31…1.5, scale ×0.92)**
- Body `turnipPath(0, −21.6, −2.6, w 10.4)`. Base fill milky radial `#ffffff → #fff1f8 → #e9c9dc`. Clipped: coloured top half above a wavy seam `y = −11.3 + 0.9·sin(0.85x + 0.6)` filled `hi → top → dk`; white seam line 0.45.
- `jelly()` pass: milky core `rgba(255,255,255,.28)`; inner edge stroke width 0.42r in the variant's edge colour (e.g. `rgba(80,10,140,.55)`) — this saturated band is what makes it read as translucent gummy; subsurface glow at (+0.42r, +0.45r) radius 0.7r.
- 3 jelly leaves on top (gloss `#c9ff9e/#55cc48/#22852e` + jelly edge + midrib + spec). Two white gummy stubby feet.
- Face: glossy dark `#2a0f22` ellipse eyes with yellow `#ffe36e` lower catchlight and white upper catchlight, angry brows 1.2 wide, small frown `#6a1f45`. Speculars: 2.2×1.0 at (−5.6, −16.8), dot, side streak, lower-right reflection alpha 0.45.

**Fast/floating enemy — marshmallow ghost (outline 0.45 in `#5a3a66`)**
- Matte material: radial `#ffffff → #fbf5fb → #dccbe4`, **no sharp speculars**, only a soft spec (radial white 0.8 → 0, r 4.5).
- 4 piped meringue ridges (lilac shadow arc 1.1 wide + white arc 0.7 wide 0.9 above), toasted hem gradient `rgba(232,180,120,.75)` at the bottom, wavy hem animated by frame phase, hem faded to 35% alpha.
- Hollow face `#3a1630` with tiny cyan `#9fe0ff` catchlights, open mouth with pink tongue, pink blush.

**Brute — dark chocolate (box −28…28 × −67…2, outline 0.6)**
- Turnip body 39 units wide, `gloss(#9a5e3e, #55291a, #2a120a)` + peach rim `rgba(255,190,140,.5)`. Chipped shell revealing purple flesh; broad sheen arc `rgba(255,220,190,.22)` width 3.2; white-chocolate zig-zag drizzle at the top.
- **Glowing caramel cracks** (`glowCrack`): dark stroke 1.9w `#1a0805`, then `#ff9a1e` stroke with `shadowBlur 3K` orange glow, then core `#fff2a8` 0.4w. Eyes `#ffb02e` with shadowBlur glow, mouth with white teeth on a caramel gradient. 5 jelly leaves.

**Pickups:** wrapped candies — glossy body, 3-arm spiral swirl (width 0.28r), cellophane ends with white crease lines, spec at (−0.38r, −0.42r). Small = blue `#2fb8ff` r 2.4, big = orange `#ffb11f` with pink swirl r 3.6.
**Orbiting lanterns:** small two-layer gummy turnip (cream bottom, purple top) with caramel-hole face and additive glow.

**Props** (all with 0.45 outline, lollipop/cupcake 0.55): lollipop trees (stick 40 units, ribbon bow, swirl disc r 13.5 with spiral bands, inner shading, rim and 3 specs), gumdrop bushes (3 sugared gumdrops with 26 crystal dots), candy-cane fence (red licorice rails, striped posts with dashed hooks), wrapped-candy boulders, chocolate gravestones with piped frosting "R.I.P." and bead border, pumpkin candy buckets, cupcake houses (pleated liner, 3-tier frosting roof, sprinkles, cherry, warm windows). Shadows sized per prop.

## Effects and particles

All particles are baked sprites with the same outline rule; only sparkles are additive.
- **Projectile:** glossy candy seed (gloss + 1.6×0.55 spec) squashing on Y with |cos(spin)|; white gradient streak 13 units long, 1.6 wide, plus two pink side streaks 0.6 wide.
- **Hit:** 8-point rounded star r 5.6/2.4, white → `#ffb3d6`, hot-pink outline 0.35; life 0.14 s; 50% chance of a sprinkle and a sugar sparkle.
- **Sprinkles:** capsules 2.3×0.9 with white top highlight and dark bottom line, 7 colours, vz 50–120, gravity 300, drag 1.4, spin ±8 rad/s.
- **Kill:** sprinkles (8 / 16 brute), gummy chunks (6 blobs in the enemy colour + green + white), chocolate shards + caramel drops + candy corn + cream puffs + shock ring for brutes, marshmallow puffs (5-lobe cloud) for ghosts.
- **Dash:** 3 flash-tinted afterimages at 7-unit steps (alpha 0.4/i), cream puffs and sugar sparkles.
- **Spawn:** unwrapping candy-wrapper decal under the enemy (outBack in, fades after 70%), confetti; the enemy scales in with outElastic.
- **Level-up:** expanding ring (cocoa, white, dashed pink), 22 sprinkles, 14 confetti that flip (Y-scale by cos) and 8 sparkles.
- **Sugar sparkle:** 4-point star (quadratic curves, tip 3.6) over a coloured soft glow, `lighter` blend.

## Lighting, shadows and post-processing

- **Key light:** top-left, everywhere (gradient centre offset −0.38r, −0.45r). Speculars are always upper-left; rim light lower-right.
- **Shadows:** a 64×32 baked radial ellipse `rgba(45,12,22,.42) → .3 @55% → 0`, stretched per actor: hero 9×3.2 (shrinking while airborne), small enemy 9×3.2, ghost 6.2×2.2 at 70%, brute 20×6, pickups 3.2×1.3, projectiles 2.6×1 offset 6 down.
- **Glows:** additive radial glow sprite (36 units) behind the hero head and lanterns; `shadowBlur` glow baked into cracks and brute eyes.
- **Ambient sparkles:** one per 140-unit cell (60% of cells), drifting and twinkling, additive.
- **Vignette:** radial from (50%, 46%) inner r 0.35h to outer 0.62w: `rgba(60,10,50,0) → .16 @70% → rgba(50,8,40,.42)`. Plum, not black.
- **Overlays:** level-up screen tints `rgba(70,20,60,.62)` with pink glow and rotating sunburst; game-over desaturates.

## UI and HUD

Candy-shop buttons: thick cocoa border (3–4 px), solid cocoa "base" drop of 4–5 px, a universal glossy overlay (`GLOSS`), peppermint stripes in dark chocolate troughs, an orange wrapped-candy timer badge with zig-zag cellophane ends (CSS `clip-path`), a pink pill kill counter with sprinkle dots, cards with a coloured candy top (pink/mint/yellow) on cream.

```css
:root { --cocoa: #3a1424;
  --gloss: linear-gradient(180deg, rgba(255,255,255,.6) 0%, rgba(255,255,255,.12) 45%, rgba(255,255,255,0) 55%, rgba(60,0,30,.18) 100%); }
.bar { position: relative; width: 260px; height: 30px; background: linear-gradient(180deg, #3d1a14, #6a3624);
  border: 3px solid var(--cocoa); border-radius: 16px; box-shadow: 0 4px 0 var(--cocoa), inset 0 4px 6px rgba(0,0,0,.45); overflow: hidden; }
.bar > .fill { position: relative; height: 100%; border-radius: 0 13px 13px 0;
  background: var(--gloss), repeating-linear-gradient(-55deg, #ff2f55 0 12px, #fff5f7 12px 22px);
  box-shadow: inset 0 -3px 0 rgba(120,0,30,.25), inset -3px 0 0 rgba(255,255,255,.45); }
.bar > .fill::after { content: ''; position: absolute; left: 9px; right: 12px; top: 4px; height: 5px; border-radius: 3px; background: rgba(255,255,255,.75); }
.bar.xp > .fill { background: var(--gloss), repeating-linear-gradient(-55deg, #35d0c0 0 11px, #effffb 11px 20px); }
.badge { padding: 4px 30px 8px; border-radius: 999px; border: 3px solid var(--cocoa);
  background: var(--gloss), radial-gradient(ellipse at 50% 120%, #ffb347 0%, #ff8a1a 45%, #e8590c 100%);
  box-shadow: 0 5px 0 var(--cocoa), inset 0 -4px 0 rgba(140,40,0,.25); }
.pill { border-radius: 999px; border: 4px solid #c98a4e; box-shadow: 0 0 0 3px var(--cocoa), 0 5px 0 3px var(--cocoa);
  background: var(--gloss), linear-gradient(180deg, #ffc3dc, #ff8fbf); }
.card { width: 236px; min-height: 306px; border: 4px solid var(--cocoa); border-radius: 30px; color: var(--cocoa);
  background: var(--gloss), linear-gradient(180deg, #ff8fbf 0, #ff5c9e 96px, #fff4ea 96px, #ffe6d2 100%);
  box-shadow: 0 0 0 5px #8a4a2a, 0 0 0 8px var(--cocoa), 0 12px 0 8px var(--cocoa), 0 24px 34px rgba(30,5,20,.45); }
.card .icon { border-radius: 50%; background: radial-gradient(circle, #fff9fc 0 54%, transparent 55%), repeating-conic-gradient(#fff 0 7deg, #ffd0e2 7deg 14deg);
  box-shadow: 0 0 0 4px var(--cocoa), 0 5px 0 4px var(--cocoa); }
@keyframes candyPop { from { transform: scale(.2) rotate(-14deg); } to { transform: scale(1) rotate(-3deg); } }
@keyframes candyWobble { 0%,100% { transform: none } 30% { transform: scale(1.06,.92) } 65% { transform: scale(.96,1.05) } }
```

**Icons** are drawn with the same canvas material functions on a 48×48 grid (glossy jelly heart, gummy lightning bolt, waffle basket of wrapped candies, pink soup bowl) and outlined with `max(1.5, size/26)` px cocoa. Card icon backgrounds use a pink/white peppermint sunburst.

## Motion and animation

- **Hero hop-walk:** phase = `anim·0.42` hops; `f = fract(phase)`, `air = sin(f·π)`, `lift = air·3.2`; contact = `max(0, 1 − min(f, 1−f)·6)`; `sy = 1 + .07·air − .13·contact`, `sx = 1 − .04·air + .12·contact`; frame = contact > .25 ? (odd hop ? 1 : 3) : 2; tilt `0.07·facing·air`. Sugar sparkle puff on 60% of landings.
- **Idle:** breathing `sy = 1 + .03·sin(3.2t)`, `sx = 1 − .022·sin(3.2t)`, frame 0.
- **Shoot:** squash 5%. **Level-up:** wobble `sin(levelT·4π)·levelT` (sy ±18%). **Hurt:** sx +16%, sy −13%, flash overlay ≤ 0.75, hurt face. **I-frames:** blink at 16 Hz, alpha 0.5.
- **Gummy enemies:** phase `anim·0.85`, 4 frames, jelly wobble (see spec.json), rotation 0.1·sin, bob 1.3.
- **Marshmallow floaters:** 6 fps frame cycle, hover 4.5 + 1.6·sin(2.6t), squash ±5% at 4.2 rad/s, tilt by velocity.
- **Brute:** phase `anim·0.32`, cubic contact squash 8%, bob 2.
- **Hit:** sx +18%, sy −15%, flash. **Death:** 0–0.2 grow to 1.25 (outQuad), then shrink to 0 by 0.42 (inQuad) with a 44-rad/s wobble ±12% and a 60% flash overlay.
- **Pickups:** bob 1.2 ± 0.9 at 4 rad/s, sway ±0.18, squash 5%; pop with outBack (0.4 → 1) and an arc of 10 units.
- **Numbers:** scale 0.3 → 1.35 (10%) → 1.0 (24%), rise 4 units, slight random tilt ±0.15 rad.

## Do and don't

**Do**
- Fill every shape with the top-left radial gradient (light → mid @ 0.5 → dark) and add a white specular ellipse at about (−0.4r, −0.45r).
- Add lower-right rim light to round glossy forms; jelly edge bands to gummies; inner glow to hard candy.
- Pick a real candy material per object and keep it consistent (it also encodes the enemy type).
- Wrap each finished sprite in one 0.5-unit `#3a1424` outline.
- Make faces glow (caramel holes) or sparkle (dark glossy eyes with yellow + white catchlights).
- Reward everything with sprinkles, sparkles and confetti.
- Keep shadows warm, soft and elliptical.

**Don't**
- Don't use flat fills or hard cel bands — it becomes generic vector cartoon.
- Don't use black outlines or ink lines inside shapes.
- Don't vary the light direction between objects.
- Don't use grey/blue shadows or a black vignette.
- Don't make the ground as saturated as the characters.
- Don't add new random hues; extend existing triples and the sprinkle set.
- Don't rebuild gradients every frame per actor — bake.

## Implementation recipe

1. Set up a world of 360 units visible height; compute `S = canvasHeight / 360` and `K = clamp(round(S·1.25), 3, 6)`.
2. Write the helpers: `gloss`, `spec`, `softSpec`, `rim`, `clipDo`, `jelly`, `caramelHole`, shape builders (`E`, `CAP`, `roundPoly`, `blobPath`, `turnipPath`/your silhouette, `leafPath`), and `build()` with the 12-stamp outline.
3. Define materials as colour triples: hard candy, licorice, gummy (per variant hi/top/dk + edge + glow), marshmallow, chocolate, jelly leaf.
4. Design the hero head-heavy: a big glossy head (≈ 22×18 units) on a small dark body (≈ 9 units) with bright accents (scarf, shoes). Draw back-to-front, finishing with speculars.
5. Build each enemy class from one material; give it 4 frames by moving feet/leaves slightly; bake normal, flash-tinted and mirrored sprites.
6. Bake pickups (wrapped candies), projectiles (candy seed + streak), particles (sprinkles, gummy chunks, puffs, hit star, sparkle) and the shadow sprite.
7. Build the ground: chocolate base with bar grid, then noise-driven material regions (caramel sunken, sugar flat with grain, frosting raised with drips and gloss line, cookie paths). Cache in chunks; stamp decals with tiny shadows.
8. Place props (lollipop trees, gumdrop bushes, fences, gravestones, cupcake houses) by material; y-sort them with actors.
9. Per frame: blit sprites with squash/stretch/tilt transforms, additive glows behind light sources, particles, damage numbers, ambient sparkles, plum vignette.
10. Style the HUD with the CSS above: cocoa borders + base drop, gloss overlay, peppermint bars, Chewy numbers with the 16-direction outline.

## Code

The snippets below are the core techniques from the reference module, standalone. A complete runnable kit (hero, gummy enemy, marshmallow ghost, lollipop, wrapped candies, chocolate/caramel/sugar/mint/cookie ground, hit effect) is in [`starter.js`](starter.js); the full reference is [`../../js/styles/candy.js`](../../js/styles/candy.js).

```js
// Material core: top-left lit radial fill, white specular, lower-right rim light.
const TAU = Math.PI * 2;
function rg(c, x0, y0, r0, x1, y1, r1, stops) { const g = c.createRadialGradient(x0, y0, r0, x1, y1, r1); for (const s of stops) g.addColorStop(s[0], s[1]); return g; }
function lg(c, x0, y0, x1, y1, stops) { const g = c.createLinearGradient(x0, y0, x1, y1); for (const s of stops) g.addColorStop(s[0], s[1]); return g; }
function gloss(c, path, cx, cy, r, light, mid, dark) {
  c.beginPath(); path(c);
  c.fillStyle = rg(c, cx - r * 0.38, cy - r * 0.45, r * 0.05, cx, cy, r * 1.18, [[0, light], [0.5, mid], [1, dark]]);
  c.fill();
}
function spec(c, x, y, rx, ry, rot, a = 0.9) {
  c.save(); c.globalAlpha = a; c.fillStyle = '#fff';
  c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); c.fill(); c.restore();
}
function clipDo(c, path, fn) { c.save(); c.beginPath(); path(c); c.clip(); fn(c); c.restore(); }
function rim(c, path, x0, y0, x1, y1, col, w) {          // stroke clipped inside the path
  clipDo(c, path, (k) => {
    k.lineWidth = w;
    k.strokeStyle = lg(k, x0, y0, x1, y1, [[0, 'rgba(255,255,255,0)'], [0.6, 'rgba(255,255,255,0)'], [1, col]]);
    k.beginPath(); path(k); k.stroke();
  });
}
// usage: a hard-candy ball r=10
// const p = (k) => k.arc(0, 0, 10, 0, TAU);
// gloss(ctx, p, 0, 0, 10, '#ffd08a', '#ff8d1e', '#d24e0b');
// rim(ctx, p, -10, -10, 10, 10, 'rgba(255,236,150,0.9)', 2.2);
// spec(ctx, -4, -4.5, 2.9, 1.35, -0.6, 0.92); spec(ctx, -1.2, -6.5, 0.75, 0.6, 0, 0.95);
```

```js
// Gummy / jelly: milky core + saturated inner edge band + subsurface glow lower-right.
function jelly(c, path, cx, cy, r, edgeCol, glowCol) {
  clipDo(c, path, (k) => {
    k.fillStyle = rg(k, cx - r * 0.1, cy - r * 0.05, r * 0.1, cx, cy, r * 1.1,
      [[0, 'rgba(255,255,255,0.28)'], [0.55, 'rgba(255,255,255,0.06)'], [1, 'rgba(255,255,255,0)']]);
    k.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4);
    k.lineWidth = r * 0.42; k.strokeStyle = edgeCol;          // half of it is clipped away -> 0.21r band
    k.beginPath(); path(k); k.stroke();
    if (glowCol) {
      k.fillStyle = rg(k, cx + r * 0.42, cy + r * 0.45, 0, cx + r * 0.42, cy + r * 0.45, r * 0.7, [[0, glowCol], [1, 'rgba(255,255,255,0)']]);
      k.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4);
    }
  });
}
// purple gummy: gloss(c, body, 0, -12, 10.5, '#d9a2ff', '#9443d8', '#56168f');
//               jelly(c, body, 0, -12, 10.5, 'rgba(80,10,140,0.55)', 'rgba(255,170,255,0.55)');
```

```js
// Carved face hole glowing with caramel: dark fill, then the same path shifted (0.2, 0.55) with the glow ramp.
function caramelHole(c, path, bx, by, br) {
  c.beginPath(); path(c); c.fillStyle = '#7a2406'; c.fill();
  clipDo(c, path, (k) => {
    k.translate(0.2, 0.55);
    k.beginPath(); path(k);
    k.fillStyle = rg(k, bx, by, 0, bx, by, br, [[0, '#fffbd6'], [0.35, '#ffe07a'], [0.75, '#ffa12a'], [1, '#e2650e']]);
    k.fill();
  });
}
```

```js
// Bake a sprite at k px/unit and add the soft cocoa silhouette outline (12 stamped tinted copies).
function build(box, k, drawFn, ol = 0.5, olc = '#3a1424') {
  const m = 1, l = box[0] - m, t = box[1] - m;
  const c = document.createElement('canvas');
  c.width = Math.ceil((box[2] + m - l) * k); c.height = Math.ceil((box[3] + m - t) * k);
  const x = c.getContext('2d');
  x.scale(k, k); x.translate(-l, -t); x.lineJoin = 'round'; x.lineCap = 'round';
  drawFn(x);
  const tint = document.createElement('canvas'); tint.width = c.width; tint.height = c.height;
  const tx = tint.getContext('2d');
  tx.drawImage(c, 0, 0); tx.globalCompositeOperation = 'source-atop'; tx.fillStyle = olc; tx.fillRect(0, 0, c.width, c.height);
  const o = document.createElement('canvas'); o.width = c.width; o.height = c.height;
  const ox = o.getContext('2d'), w = ol * k, n = w > 2.5 ? 16 : 12;
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU; ox.drawImage(tint, Math.cos(a) * w, Math.sin(a) * w); }
  ox.drawImage(c, 0, 0);
  return { c: o, ox: -l * k, oy: -t * k, k };   // anchor = world origin (feet)
}
function blit(ctx, s, x, y, sx = 1, sy = 1) {
  const q = 1 / s.k;
  ctx.drawImage(s.c, x - s.ox * q * sx, y - s.oy * q * sy, s.c.width * q * sx, s.c.height * q * sy);
}
```

```js
// Hero hop-walk squash & stretch (applied at blit time, sprites stay baked).
function heroPose(anim, moving, t) {
  if (!moving) { const b = Math.sin(t * 3.2); return { frame: 0, lift: 0, sx: 1 - 0.022 * b, sy: 1 + 0.03 * b, rot: 0 }; }
  const ph = anim * 0.42, f = ph - Math.floor(ph), hop = Math.floor(ph), air = Math.sin(f * Math.PI);
  const contact = Math.max(0, 1 - Math.min(f, 1 - f) * 6);
  return { frame: contact > 0.25 ? (hop & 1 ? 1 : 3) : 2, lift: air * 3.2,
           sx: 1 - 0.04 * air + 0.12 * contact, sy: 1 + 0.07 * air - 0.13 * contact, rot: 0.07 * air };
}
```

## Adapting it to your game

- **Keep fixed:** the top-left gradient recipe, white speculars, lower-right rim, the single cocoa outline, warm cocoa shadows/vignette, sprinkle rewards, Chewy + Sniglet, the "material = role" idea.
- **May change:** the theme (any confectionery or toy world: Christmas candy, ice cream, bakery), the material set (add ice-cream scoop = matte with drip, fondant = flat-ish matte with sugar crystals, glass candy = jelly with stronger transparency), the ground materials (e.g. snow-sugar, jam rivers) — as long as they stay mid-value and calmer than the actors.
- **Palette swap:** replace a triple as a whole (light ≈ mid mixed 55% with white, dark ≈ mid × 0.6 — the module's own `gumdrop()` rule). Keep the outline/shadow hue warm and dark; a cool theme may shift it to a deep plum-blue but never pure black.
- **New characters:** start from a silhouette path, choose a material, add 1 main spec + 1 dot spec + 1 weak secondary reflection, then a glowing or glossy face. Bosses: bigger outline (0.6), glowing cracks with `shadowBlur`.
- **Other genres:** platformers — keep the same lighting but use a side-view ground made from the same materials (chocolate blocks with bar bevels, frosting tops with drips). Puzzle games — tiles are wrapped candies / gumdrops with the same gloss.
- **Resolution:** keep K between 3 and 6 px/unit; below 3 the speculars blur away, above 6 memory grows with little gain.

## Performance notes

- Everything except the ground is baked once: per character 4 frames × 4 variants (normal, flash, mirrored ×2); per-frame cost is `drawImage` with a transform per actor (`blitRot` sets the transform directly instead of save/restore).
- The ground is the expensive part: noise fields sampled every 4 units, per-pixel material compositing, run as a generator that yields every 4 rows and in 128-row `putImageData` bands so chunk generation never stalls a frame; resolution capped at 2.5 px/unit (`groundResMax`). Pixels whose 2×2 cell is fully inside/outside a layer skip the distance math.
- Decals are stamped into the chunk once (≤ 1 per 15 units).
- Additive glows (`lighter`) are limited to the hero halo, lanterns, sugar sparkles; `shadowBlur` is only used at bake time.
- Damage numbers are cached as sprites per value (cache cleared above 400 entries); the vignette is a 320-px sprite stretched to the screen.
- For a simpler port, the vector ground in `starter.js` (pre-baked once per canvas size) costs < 1 ms per frame.

## Copy-paste prompt

```text
Build my game <X> in the "Trick or Treat" candy-gloss style (miwale Game Style Library):
- Canvas 2D, procedural, no image assets; 360 world units of screen height; bake sprites at 3-6 px/unit.
- Everything is candy. Every shape: radial gradient lit from the TOP-LEFT (centre offset -0.38r,-0.45r; stops light / mid @0.5 / dark),
  then clipped material passes, then a lower-right rim light, then sharp white specular ellipses upper-left (alpha 0.9) + a tiny dot spec.
- Materials define roles: hard candy (hero head, inner warm glow, ribs), licorice (#6a4a66/#2c1a2a/#120810), two-layer gummy for small enemies
  (coloured top over milky bottom, saturated inner edge band 0.42r, subsurface glow), matte marshmallow for floaters (no sharp spec),
  dark chocolate with glowing caramel cracks for brutes.
- One soft cocoa-plum outline #3a1424, 0.5 units, around the whole sprite (stamp a tinted copy 12x); no inner ink lines, never black.
- Faces: carved holes glowing caramel (#7a2406 then ramp #fffbd6 > #ffe07a > #ffa12a > #e2650e), or glossy dark eyes with yellow+white catchlights.
- Ground: milk chocolate #7e4c32 with a 34-unit bar grid (dark groove, lit top-left bevel), sunken caramel pools (#ec9c3a > #b25a1a),
  pink sugar-sand #f4acc2 with sparkle grain, raised mint frosting #a0dab8 with drips and a white gloss line, cookie-crumb paths #543226, sprinkle decals.
- Shadows: soft warm ellipses rgba(45,12,22,.42). Plum vignette. Additive warm glows behind light sources.
- Effects: sprinkles (#ff4f8b #ffd23a #4fd6ff #7ee26a #b88cff #ff9a3a #fff) on every hit/kill, white-pink hit stars, sugar sparkles, confetti.
- Motion: squash & stretch everywhere (hop-walk with 12% contact squash, jelly wobble, outElastic spawns, overshoot pops).
- HUD: Chewy numbers with a 16-direction cocoa outline, Sniglet labels; 3px cocoa borders with a 5px solid drop, white gloss overlay,
  peppermint-striped bars in dark-chocolate troughs, orange wrapped-candy timer badge.
```
