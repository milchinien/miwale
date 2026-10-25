# Linocut — Game Art Style Spec

> A moving linocut print: cream paper, carbon-black key plate, one misregistered pumpkin-orange spot plate and a sparing teal.

The game looks like a hand-pulled linocut or woodcut print come alive. Every shape is either solid black ink with white gouges carved out of it, or bare paper with black knife marks cut into the surrounding block. Lines never have constant width: each mark is a pointed "lens" or a "taper" with a blunt start and sharp tip, exactly like a V-gouge cut. Colour comes from one pumpkin-orange spot plate printed slightly off-register, so a sliver of paper shows along one edge, and a very sparing teal second spot. There are no gradients anywhere – tone is only line density, stipple and hatching. The reference game is *Jack vs. the Turnip Ancestors* (pumpkin-headed hero vs. turnips, ghosts and a turnip colossus); use it only as an example.

## At a glance

| | |
| --- | --- |
| Family | Printmaking · Linocut |
| Mood | folkloric, bold, graphic, eerie, handmade |
| Best for | top-down action/survivor, folk-horror and fairy-tale games, card/board games, narrative art |
| Renderer | Canvas 2D, procedural, no image assets |
| Pixel art | No – native resolution, sprites baked at 2–5 px per world unit |
| Difficulty | 6/10 – carving white lines into black is detail work per figure; hordes blur to black |
| Fonts | Rye, Alfa Slab One, Special Elite |
| Key colours | paper `#f0e7d2`, ink `#1b1715`, orange `#ea6820`, teal `#2e7674` |

## When to use it

Good fits:
- **Top-down action with clear silhouettes** – two values make every figure pop on paper.
- **Folk horror, fairy tales, legends, western** – reads as an old broadsheet or chapbook.
- **Card, board and narrative games** – static art looks like real prints.
- **Low-budget but striking**: one spot colour is a strong brand.

Bad fits:
- **Many-colour coding** (match-3, team colours) – you only have ink, paper, orange and a hint of teal.
- **Massive hordes** – dozens of black enemies merge into one black mass unless halos and spacing are generous.
- **Soft, cozy pastel games** – the style is high-contrast and graphic.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Paper | `#f0e7d2` | Ground, halos, carved highlights (~65%) |
| Ink | `#1b1715` | Key plate – outlines, solid masses, all marks (~30%) |
| Pumpkin Orange | `#ea6820` | The one spot plate – hero head, cores, lantern faces, gems, XP, crits (~4%) |
| Teal | `#2e7674` | Sparing second spot – ghost frost stipple, brute core ring, big gem centre (<1%) |
| Paper Shade | `#e2d6ba` | Darkest paper fibres (paper − 14) |
| Ink Deep | `#0d0b0a` | Hard offset shadows on cards and panels |

Palette rules:
- **Two values + flat spots.** No gradients, no alpha shading, no blur, no grey.
- **Misregistration**: the orange plate is always drawn offset by `MX = 0.8, MY = 0.55` world units (x mirrored with facing); teal by `TX = −0.55, TY = 0.45`. Same offset on every object – it is the style's signature.
- Spot colour appears inside a hole cut in the key plate (`holeSpot`: fill paper, then the colour shifted and clipped), or as its own plate under a black outline (gems, seeds).
- Darker = more/wider black marks. Lighter = more white gouges.
- Paper fibres darken ink slightly (`ink + fibre·0.4`) and ink has pinholes where paper shows through.

## Typography

- **Rye** 400 – woodtype display for titles (72px level-up, 66px game over), the clock (34px) and card keys. `https://fonts.googleapis.com/css2?family=Rye`
  `font: 400 34px/1.05 'Rye', Georgia, serif; letter-spacing: 2px; color: #1b1715; text-shadow: 2px 2px 0 #ea6820;`
  Titles on dark overlays: paper colour with `text-shadow: 5px 4px 0 #ea6820` (the misregistered orange plate behind the type).
- **Alfa Slab One** 400 – numbers: HP text (17px), kills (22px), level badge (13px, paper on an ink block), damage numbers, card names (20px with a 2px ink underline). `https://fonts.googleapis.com/css2?family=Alfa+Slab+One`
  HP text gets an 8-direction 2px paper outline via `text-shadow` so it reads over the striped bar.
- **Special Elite** 400 – typewriter labels and descriptions (11–19px, letter-spacing 2–3px, labels with a 2px ink rule above). `https://fonts.googleapis.com/css2?family=Special+Elite`

Damage numbers (canvas): normal = ink fill over a paper stroke of 0.3× font size (8.5 units tall); crit = 11.5 units, paper stroke 0.36×, an ink copy offset by `(MX, MY)·0.6`, a thin ink outline, then orange fill – i.e. a two-plate print.

## Rendering technique

1. **Init** – `K = clamp(round(screenH / 360 · 4) / 4, 2, 5)` px per world unit. Build textures: the 512² paper fibre map `FIB` (Int8, −22…+14) and the 256² ink void map `VOID`.
2. **Carving toolkit** (all marks are *fills*, see Code): `lens(x0,y0,x1,y1,w,bend)` – two quadratic curves meeting in points; `taper` – blunt round start, sharp tip; `limb(pts,w0,w1)` – Catmull-Rom spline with tapering width and round caps; `smoothPath`; `crescent` – shape minus a shrunken copy shifted to the light, filled even-odd (heavy shadow contour); `holeSpot` – cut hole showing a misregistered spot plate.
3. **Figure recipe**: fill the form (paper or ink) → print the orange plate offset → clip and carve (black lenses on paper / white lenses on black) → `crescent` on the shadow side → thin ink outline 0.5–0.75 → carved face → top details (stem, leaf, teeth).
4. **Sprite bake `mk`**: draw at K px/unit with feet at the anchor; **paper halo** – a paper-tinted silhouette drawn 12× around a 0.5–0.9-unit circle with `destination-over`; **inkify** – per pixel: dark pixels where `VOID > 238` move 72% toward paper (pinholes), orange pixels get ×0.93–1.05 density and rare paper voids.
5. **Derived sprites**: negative print (`invert`, luminance mapped paper↔ink, saturated pixels → ink) for hit flashes; death shards (4–5 wedges cut from the centre with jittered radial cuts, paper-coloured cut edges 0.7 units wide); orange-tinted ghost of the hero for dash after-images.
6. **Variants**: hero 4 walk + 2 idle poses × 2 carving variants (seeds `100 + v·7 + i`) × 2 facings (drawn mirrored, the orange offset mirrors too); enemies 4 × 2 × 2.
7. **Ground chunks** (256 units, ≤ 2.5 px/unit): generator; 84×84 field grid, distances via value/|gradient|, per-pixel analytic ink coverage `a` per region, then `paper + fibre → mix toward ink by a` with pinholes; then decals.
8. **Per frame**: ground → splats → gems → hatched shadows → y-sorted props/enemies/hero → orbitals → projectiles → particles → numbers → ragged ink frame. Only `drawImage` of cached canvases; blit positions snapped to screen pixels.

## Background and ground

Fields (world units): `B = warped fbm(x/1000)` (biome), `D = fbm(x/300) + (B − 0.55)·0.6` (dark soil when `D > 0.74`), `R = perlin(x/3400)` warped (road where distance < 11). Biomes: `B < 0.455` field, `B > 0.565` forest, else meadow. All regions are separated by a **1.5-unit paper gutter** – carved patterns stop short of the edge, like separately cut areas of the block.

Per-region carved pattern (analytic per pixel, coverage 0…1 anti-aliased with `(halfwidth − distance)·res + 0.5`):
- **Meadow** (mostly clean paper): grass ticks on a 9-unit hashed grid, density `0.1 + 0.5·smoothstep(0.32, 0.72, T)` (T = fbm/140); each tick has 1–3 tapered blades (angles 0.16, −0.5, 0.75 rad; length 2.2–3.55; half-width 0.46 → 0). Rare "chatter": 3–5 parallel short gouges on a 27-unit grid (30% of cells).
- **Ploughed field**: furrow lines from a warped scalar `F = (y + 0.22x + 110·(fbm − 0.5) + 9·perlin) / 4.4`; distance to the nearest line centre is `|frac(F) − 0.5| / |∇F|`; half-width `0.66·smoothstep(0.27, 0.7, M)·(0.72 + 0.56·T)` (34% of lines thinner). A carved ditch line 0.88 wide along the field edge. Turnip sprouts and clods are snapped onto furrows.
- **Forest floor**: stipple dots r 0.3–0.54 on a 2.5-unit hashed grid, density 0.14–0.66; an 0.84-wide edge line 0.5 units inside the border and a clean gap behind it.
- **Dark soil**: solid ink; two paper "echo" contours at 1.8 (width 0.6) and 3.4 (0.44) units inside the edge – the classic linocut outline ripple; deeper than 4.3 units, short oriented white gouge flecks (cell 4.3, 62% filled, length 1.3–2.8, aligned with the field direction ± 0.35 rad).
- **Road** (22 units wide): a curb line, then cobbles from Worley noise (cell 4.4): paper joints `(f2 − f1)·2.2 < 0.36`, stones hatched with 45° lines on their shadow side, 1 in 16 stones solid ink.
- **Paper**: `#f0e7d2 + FIB` (1300 short curved fibres ±0.13 alpha, mottling ±4.5, grain ±3).
- **Decals** (knocked out with a paper disc first, then carved): 5-petal flowers, stars, pebbles, skulls, bones, leaves with veins, twigs, mushrooms, sprouts, turnips, clods, and **carved roots** radiating from every tree into the ground (4–6 tapered limbs, 9–16 units).

## Characters

**Hero** (Jack), feet at (0,0), ~16 × 30 units, facing via `scale(f,1)`:
- **Legs**: `limb` half-width 1.15 → 0.9, boots = ink ellipses 1.8 × 1.05 with a paper shine lens.
- **Cloak**: 14-point polygon, solid ink, jittered ±0.125; **white carved folds** on the lit side: lenses of half-width 0.44, 0.34, 0.26 from the hem upward, plus an arm separation gouge.
- **Scarf**: paper shape with a 0.45–0.5 ink outline and ink stripe lenses; tail flutters with `scarf` ±0.6.
- **Hand**: paper disc r 1.25 with ink outline.
- **Pumpkin head**: 22-point lobed ellipse 7.3 × 6.2 (top flattened near the stem); paper fill, **orange plate offset** `(MX·f, MY)`; clipped carving: 4 rib lenses (half-width 0.26/0.34), 6 shading lenses on the right widening 0.16 → 0.44, 4 horizontal lenses at the bottom; **crescent** shift (−1.0, −0.85) scale 0.93; ink outline 0.75.
- **Face** (shifted 0.95 toward facing): solid ink triangle eyes and nose, a jagged grin with two "teeth" notches; two white gouge highlights at the upper left of the head.
- **Stem** taper 1.1 wide, one leaf (ink lens with a paper midrib).
- Poses: `WALK` = 4 keyframes (feet `[3.3,0]/[-3,0]`, `[1,0]/[-0.4,-1.5]`…, bob −0.8 on passing poses), `IDLE` = 2.

## Enemies and props

- **Small melee enemy** (turnip creeper, ~16 × 28): root legs (`limb` 0.85 → 0.55 + two toe tapers), three leaves behind, smooth bulb; inside the clip a **solid ink crown** above a wavy line `y = −12.4 + 0.45·sin(0.95x + 0.6)`, an **engraved comb** of 13 tapers hanging into the paper underside (getting longer to the right = shadow), white crown highlights, ink lenses on the lower right; carved paper lens eyes with ink pupils, a black grimace lens with two paper teeth; crescent + 0.7 outline; root hairs.
- **Floating enemy** (ghost, ~15 × 24): paper body; **teal stipple plate** (230 candidate dots r 0.26–0.42, probability rising to the lower right) offset by (TX, TY); 4 ink shading lenses on the right; crescent; black eye/mouth ellipses; reaching tapered arms with 3 finger tapers; the tail dissolves into 3 shrinking ink dots.
- **Brute** (colossus, ~37 × 57): solid ink body (18-point blob, narrowed top) with **concentric white arc gouges** on the upper left (6 arcs shrinking 14.4 → 2.9), white crack limbs from the core, a paper rim crescent on the lit edge, a **teal ring + orange core** in holes, a paper 4-point star and 10 carved rays; thick limbs 3.1 → 1.8 with root fingers; crown of 5 leaves.
- **Pickups**: small gem = orange 4-point star (offset plate) with ink outline and 4 ink spark lenses (2 frames: lengths 3.8/4.6); big gem = 8-point orange star, teal centre hole, 8 sparks.
- **Orbiting lantern**: turnip lantern (ink top, comb, orange face holes) over a rotating 14-spike orange ray star.
- **Props**: bare oaks (roots, trunk `limb` 4.4 → 3.0, recursive branches 3 levels deep with widths ×0.6, white bark gouges on the lit side, knot hole), crowned trees (8 ink lobes with 3 scalloped white arc gouges each), spruces (6 toothed tiers with white lenses), graves (round with cross, Celtic cross, slab with carved skull), fences with a broken rail, scarecrow, lantern poles with orange rays, crows (2-frame beak), haystacks (paper dome with 17 converging ink lenses). Grass tufts at every base.
- **Shadows**: never soft – horizontal ink lenses filling an ellipse (one per 0.75 units of height, half-width 0.33–0.45), shifted right (light from upper left). Hero 6.4 × 2.0, small enemy 7.4 × 2.2, ghost 4.6 × 1.4, brute 16 × 4, tree 19 × 4.6.

## Effects and particles

- **Spawn – block stamped down**: for `spawnT < 0.5` draw the sprite at scale `1 + (1−k)²·0.9`, raised 10·(1−k) units, alpha 0.25 → 1; at contact stamp an **ink splat** (smooth 14-point blob with tapered spatters, 3 paper gouges) on the ground and squash `±sin(kπ)·0.14·(1−k)`.
- **Hit**: negative-print sprite while `flash > 0.45`, a radial burst of 10 black lenses (orange 8-lens burst for lantern hits), wood chips flying with gravity.
- **Death – carved shatter**: 0.16 s negative print scaled 1 + t·0.6, then 4 (brute 5) pre-cut shards fly out `2 + 12·outQuad(u)` units, rotate ±1.6 rad, fall `26u²`, alpha `1 − u²`; ink drops and a ground splat that fades in its last 0.5 s.
- **Projectile**: orange seed plate offset under a black outlined seed with a carved shine; trail of 3 black lenses.
- **Dash**: 2 orange-tinted after-images (alpha 0.55/i) and a trail sprite.
- **Pickup**: orange 4-point star sprite; **level up**: a 16-segment orange gouge-arc ring and a big rotating 18-spike orange ray star behind the hero.
- **Halftone puff** (dust): hex grid of ink dots (spacing 1.55) whose radius shrinks toward the edge; 3 frames get lighter.

## Lighting, shadows and post-processing

- Fixed light from the **upper left**: crescents at the lower right, white gouges at the upper left, shadows shifted right.
- **Glow = printed rays**, not light: flat orange spike stars (12–18 spikes, alternating lengths) on the offset plate.
- **Paper halo** (0.5–0.9 units) behind every sprite – the knock-out that keeps black figures readable on dark soil and in crowds.
- **Ink texture**: pinhole voids and fibres in all ink, ground and sprites alike.
- **Frame**: ragged ink strips (thickness `max(6, 1.1% of H)`, inner jagged edge every 6–18 px) plus an inner rule; no vignette.
- Overlays (level up, game over): `rgba(27,23,21,.8)` with a halftone dot pattern `radial-gradient(circle, rgba(240,231,210,.16) 0 1.3px, transparent 1.7px)` at 8px.

## UI and HUD

- Panels: paper with an SVG noise texture, `3px solid` ink borders, radius 2px, **hard offset shadows** `4px 4px 0` ink (cards `8px 8px 0 #0d0b0a`, hovered `10px 12px 0` orange).
- XP bar: orange with ink rules `repeating-linear-gradient(-62deg, orange 0 7px, ink 7px 8.5px)`; HP bar: ink with paper rules (9px / 1.5px).
- Level badge: paper Alfa Slab One on a solid ink block at the bar's right end.
- Clock: double-ruled box (`box-shadow: 0 0 0 3px paper, 0 0 0 6px ink, 7px 7px 0 6px ink`), Rye time with a 2px orange offset shadow, typewriter label under a 2px rule.
- Hurt: the HP bar flips to `filter: invert(1)` (negative print). Transitions use `steps()`.
- Icons are carved in a 100-unit box, big ones on a round medallion.

```css
:root { --paper:#f0e7d2; --ink:#1b1715; --org:#ea6820; --teal:#2e7674; }
.hud { font-family: 'Special Elite', 'Courier New', monospace; color: var(--ink); }
.xp { height: 20px; background: var(--paper); border: 3px solid var(--ink); border-radius: 2px; box-shadow: 4px 4px 0 var(--ink); }
.xp-fill { height: 100%; background: repeating-linear-gradient(-62deg, var(--org) 0 7px, var(--ink) 7px 8.5px);
  box-shadow: 3px 0 0 var(--ink); transition: width .15s steps(3); }
.hp-bar { width: 230px; height: 22px; background: var(--paper); border: 3px solid var(--ink); border-radius: 2px; box-shadow: 4px 4px 0 var(--ink); }
.hp-fill { height: 100%; background: repeating-linear-gradient(-62deg, var(--ink) 0 9px, var(--paper) 9px 10.5px); transition: width .12s steps(2); }
.hp-text { font: 400 17px 'Alfa Slab One', Georgia, serif;
  text-shadow: 2px 0 var(--paper), -2px 0 var(--paper), 0 2px var(--paper), 0 -2px var(--paper), 2px 2px var(--paper), -2px -2px var(--paper), 2px -2px var(--paper), -2px 2px var(--paper); }
.clock { background: var(--paper); border: 3px solid var(--ink); padding: 3px 22px 4px;
  box-shadow: 0 0 0 3px var(--paper), 0 0 0 6px var(--ink), 7px 7px 0 6px var(--ink); }
.clock-time { font: 400 34px/1.05 'Rye', Georgia, serif; letter-spacing: 2px; text-shadow: 2px 2px 0 var(--org); }
.clock-label { font: 11px 'Special Elite', monospace; letter-spacing: 3px; border-top: 2px solid var(--ink); padding-top: 2px; }
.card { background: var(--paper); border: 3px solid var(--ink); border-radius: 9px;
  box-shadow: inset 0 0 0 6px var(--paper), inset 0 0 0 8px var(--ink), 8px 8px 0 #0d0b0a; transition: transform .1s steps(2); }
.title { font: 400 72px 'Rye', Georgia, serif; letter-spacing: 3px; color: var(--paper); text-shadow: 5px 4px 0 var(--org); }
.hurt .hp-bar { filter: invert(1); }
```

## Motion and animation

- **Carving boil**: 2 variants per pose, `v = floor(t·6 + seed·10) & 1` (6 fps).
- **Hero**: walk pose `floor(anim·1.25) & 3`, idle `floor(t·2.2) & 1`. Hurt: negative print while `hurtT > 0.6`, then blink at 14 Hz for 0.75 s.
- **Small enemy**: `floor(anim·3.2) & 3`; **brute**: `anim·2.4`; **ghost**: `floor(t·5 + seed·9) & 3`, hovering 2.2 units with a bob quantised to 0.4-unit steps (`round(sin·2.5)·0.4`) – even motion feels stepped.
- **Gems**: 2 frames at 4 fps, bob ±0.7; pop to ×1.7 on pickup.
- **Props**: lantern pole rays alternate at 3.2 fps; crows open their beak occasionally.
- **Numbers**: pop 1.7 → 1.0 in 0.07 s, fade in the last 0.22 s.

## Do and don't

Do:
- Draw only with filled marks: lenses, tapers, limbs, smooth paths.
- Give each figure a solid ink mass with white carving and a paper area with black carving.
- Print orange on a separate offset plate (same `MX, MY` everywhere).
- Shade with widening parallel lenses; put a crescent on the shadow side.
- Bake a paper halo and ink pinholes into every sprite.
- Use hatched-lens shadows and paper gutters between ground regions.
- Keep animation stepped (variant swaps, quantised bobs).

Don't:
- Don't use gradients, blur, glow, or semi-transparent shading.
- Don't add colours beyond orange and a hint of teal.
- Don't register colour perfectly inside outlines.
- Don't use constant-width vector strokes or hairlines as the main line.
- Don't tween shapes smoothly.
- Don't place black figures on black areas without a paper halo.

## Implementation recipe

1. Camera in world units (360 visible vertically); clear to paper `#f0e7d2`.
2. Copy the carving toolkit (`lens`, `taper`, `spline`, `limb`, `smoothPath`, `crescent`, `holeSpot`) and a seeded RNG.
3. Build the paper fibre map and the ink void map once.
4. Write `mk(box, draw, {halo, seed})`: draw at K px/unit → paper halo (12 offset silhouettes, destination-over) → inkify.
5. Design each character as: one solid ink mass + one paper mass, carved with lenses; add the orange plate offset on its key element; crescent bottom-right; thin outline; carved face. Use 4 key poses as data tables (foot positions, bob, cloth swing).
6. Bake 4 poses × 2 jitter seeds × 2 facings; derive negative prints and shatter shards.
7. Ground: noise fields → signed distances → per-pixel coverage pattern per region (grass ticks, furrows, stipple, solid with echo contours, cobbles), 1.5-unit paper gutters, paper fibres and ink pinholes. Bake in chunks with a time budget.
8. Decals: knock out a paper disc, then carve the motif.
9. Shadows as horizontal lens hatching; effects as baked lens bursts, chips, drops, halftone puffs, orange stars/rays.
10. HUD in DOM with the CSS above; damage numbers on canvas as two-plate prints.

## Code

The core techniques, standalone. [`starter.js`](starter.js) contains a full runnable scene (paper ground with grass ticks, forest stipple and dark soil with echo contours, hero, turnips, ghosts, bare trees, gems, projectile, HUD, frame). The complete reference module is [`../../js/styles/linocut.js`](../../js/styles/linocut.js).

```js
// The two basic knife marks. Both are FILLS with the current fillStyle (ink or paper).
const TAU = Math.PI * 2;
function lens(ctx, x0, y0, x1, y1, w, bend = 0) { // pointed both ends, half-width w, centre bent by `bend`
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1e-6, nx = -dy / L, ny = dx / L;
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, u = 2 * (bend + w), l = 2 * (bend - w);
  ctx.beginPath(); ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(mx + nx * u, my + ny * u, x1, y1);
  ctx.quadraticCurveTo(mx + nx * l, my + ny * l, x0, y0);
  ctx.fill();
}
function taper(ctx, x0, y0, x1, y1, w, bend = 0) { // blunt round start, sharp tip (blades, toes, hairs)
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1e-6, nx = -dy / L, ny = dx / L;
  const mx = (x0 + x1) / 2 + nx * bend * 2, my = (y0 + y1) / 2 + ny * bend * 2, th = Math.atan2(dy, dx);
  ctx.beginPath(); ctx.moveTo(x0 + nx * w, y0 + ny * w);
  ctx.quadraticCurveTo(mx + nx * w * 0.6, my + ny * w * 0.6, x1, y1);
  ctx.quadraticCurveTo(mx - nx * w * 0.6, my - ny * w * 0.6, x0 - nx * w, y0 - ny * w);
  ctx.arc(x0, y0, w, th - Math.PI / 2, th + Math.PI / 2, true); ctx.closePath(); ctx.fill();
}
// Example: shade the right side of a round form with widening black lenses (darker = wider)
function shadeRight(ctx, cx, cy, rx, ry) {
  ctx.fillStyle = '#1b1715';
  for (let i = 0; i < 6; i++) { const x = cx + rx * (0.36 + i * 0.105); lens(ctx, x - 0.5, cy - ry * 0.75 + i * 0.35, x + 0.1, cy + ry * 1.05, 0.16 + i * 0.055, 0.45); }
}
```

```js
// Crescent shadow contour + misregistered spot plate in a cut hole
const MX = 0.8, MY = 0.55; // orange plate offset in world units – identical for every object
function crescent(ctx, shape, cx, cy, dx, dy, s, color = '#1b1715') {
  ctx.save(); ctx.beginPath(); shape(ctx); ctx.clip();           // stay inside the form
  ctx.beginPath(); shape(ctx);                                    // outer shape ...
  ctx.save(); ctx.translate(cx + dx, cy + dy); ctx.scale(s, s); ctx.translate(-cx, -cy); shape(ctx); ctx.restore(); // ... minus a shrunken copy moved to the light
  ctx.fillStyle = color; ctx.fill('evenodd'); ctx.restore();
}
function holeSpot(ctx, shape, color, dx, dy) {
  ctx.beginPath(); shape(ctx); ctx.fillStyle = '#f0e7d2'; ctx.fill();   // the hole shows paper ...
  ctx.save(); ctx.beginPath(); shape(ctx); ctx.clip();
  ctx.translate(dx, dy); ctx.beginPath(); shape(ctx); ctx.fillStyle = color; ctx.fill(); // ... and the offset colour plate
  ctx.restore();
}
// Usage: a pumpkin = paper + offset orange plate + crescent + outline
function pumpkin(ctx, x, y, r) {
  const shape = (c) => c.ellipse(x, y, r, r * 0.85, 0, 0, TAU);
  ctx.beginPath(); shape(ctx); ctx.fillStyle = '#f0e7d2'; ctx.fill();
  ctx.save(); ctx.translate(MX, MY); ctx.beginPath(); shape(ctx); ctx.fillStyle = '#ea6820'; ctx.fill(); ctx.restore();
  crescent(ctx, shape, x, y, -r * 0.14, -r * 0.12, 0.93);
  ctx.beginPath(); shape(ctx); ctx.strokeStyle = '#1b1715'; ctx.lineWidth = 0.75; ctx.stroke();
}
```

```js
// Sprite bake: paper halo behind + uneven ink (pinholes from a void-noise map)
function hash2(x, y, s) { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
const VOID = new Uint8Array(65536).map((_, i) => Math.max(0, Math.min(255, Math.round((0.5 * hash2(i & 255, i >> 8, 5) + 0.5 * hash2((i & 255) >> 3, i >> 11, 77)) * 300 - 40))));
function paperHalo(c, rPx) {
  const s = document.createElement('canvas'); s.width = c.width; s.height = c.height;
  const sc = s.getContext('2d'); sc.drawImage(c, 0, 0); sc.globalCompositeOperation = 'source-atop'; sc.fillStyle = '#f0e7d2'; sc.fillRect(0, 0, s.width, s.height);
  const ctx = c.getContext('2d'); ctx.globalCompositeOperation = 'destination-over';
  for (let i = 0; i < 12; i++) ctx.drawImage(s, Math.cos(i / 12 * TAU) * rPx, Math.sin(i / 12 * TAU) * rPx);
  ctx.globalCompositeOperation = 'source-over';
}
function inkify(c, seed) {
  const ctx = c.getContext('2d', { willReadFrequently: true }), im = ctx.getImageData(0, 0, c.width, c.height), d = im.data;
  const P = [240, 231, 210], sx = (seed * 37) & 255, sy = (seed * 91) & 255;
  for (let y = 0, i = 0; y < c.height; y++) for (let x = 0; x < c.width; x++, i += 4) {
    if (d[i + 3] < 100) continue;
    const v = VOID[(((y + sy) & 255) << 8) + ((x + sx) & 255)];
    if (d[i] < 80 && d[i + 1] < 80 && d[i + 2] < 80) { if (v > 238) for (let k = 0; k < 3; k++) d[i + k] += (P[k] - d[i + k]) * 0.72; } // pinhole
    else if (d[i] > 160 && d[i] - d[i + 2] > 100) { const f = 0.93 + v / 255 * 0.12; for (let k = 0; k < 3; k++) d[i + k] *= f; } // orange density grain
  }
  ctx.putImageData(im, 0, 0);
}
```

```js
// Ground: analytic grass ticks (1–3 tapered blades per hashed 9-unit cell). Returns ink coverage 0..1 at world X,Y.
function hashInt(x, y, s) { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return h >>> 0; }
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
function blade(dx, dy, ang, L, res) {
  const ux = Math.sin(ang), uy = -Math.cos(ang); let t = (dx * ux + dy * uy) / L;
  if (t > 1) return 0; if (t < 0) t = 0;
  return clamp01((0.46 * (1 - t) - Math.hypot(dx - ux * t * L, dy - uy * t * L)) * res + 0.5); // tapering half-width 0.46 -> 0
}
function grass(X, Y, dens, res) {
  const GC = 9, fx = X / GC, fy = Y / GC, ix = Math.floor(fx), iy = Math.floor(fy);
  const sx = fx - ix < 0.5 ? ix - 1 : ix, sy = fy - iy < 0.5 ? iy - 1 : iy; let a = 0;
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
    const h = hashInt(sx + i, sy + j, 4141); if ((h & 1023) > dens * 1024) continue;
    const dx = X - (sx + i + 0.15 + ((h >>> 10) & 255) / 255 * 0.7) * GC, dy = Y - (sy + j + 0.35 + ((h >>> 18) & 255) / 255 * 0.55) * GC;
    if (dx < -3.3 || dx > 3.3 || dy > 0.7 || dy < -4.6) continue;
    const type = (h >>> 26) & 3, L = 2.2 + ((h >>> 28) & 3) * 0.45;
    let v = blade(dx, dy, 0.16, L, res);
    if (type >= 1) v = Math.max(v, blade(dx + 0.55, dy, -0.5, L * 0.72, res));
    if (type >= 2) v = Math.max(v, blade(dx - 0.55, dy, 0.75, L * 0.66, res));
    a = Math.max(a, v);
  }
  return a; // final pixel = mix(paper + fibre, ink, a)
}
// Dark soil with echo contours (dS = signed distance inside the soil edge, world units):
//   a = clamp01(dS*res + .5); k = max((.3 - |dS-1.8|)*res + .5, (.22 - |dS-3.4|)*res + .5); a *= 1 - clamp01(k)
```

## Adapting it to your game

Keep fixed: two values + flat spots, filled knife marks only, fixed misregistration offset, light from the upper left, crescent + white gouge carving, paper halos, ink pinholes, hatched shadows, stepped animation.

May change:
- **Spot colour**: swap orange for any single strong ink (vermilion `#d8432b`, mustard `#d9a420`, ultramarine `#2f4aa0`); keep the second spot muted and rare. Paper may be white-ish or kraft (`#d9c4a0`) – keep ink at least 8:1 contrast.
- **New characters**: decide which part is solid ink and which is paper; put the spot colour on the single focal element (eyes, core, weapon). Brutes = mostly ink with concentric white arcs; small fodder = paper bodies with an ink cap so crowds don't merge.
- **Hordes**: increase the halo to 1.2 units, mix paper-bodied and ink-bodied enemy types.
- **Side view**: ground becomes a band of solid ink with echo contours on top and grass ticks; sky is plain paper with carved stars.
- **Resolution**: everything is in world units; only K changes.

## Performance notes

- **Init cost**: every pose × variant × facing is drawn, then halo'd and inkified with `getImageData` – the main init cost (plus negative prints and shards). Use `willReadFrequently: true` canvases.
- **Ground**: chunk generators yield every 8 rows inside a 5 ms per-frame budget; the 84×84 field grid avoids per-pixel noise; per pixel only cheap hashed-cell patterns (2×2 cells), with Worley only on roads.
- **Per frame**: only sprite blits; no path rendering at runtime except the frame strips (cached) – 1000+ actors stay cheap.
- **starter.js** bakes paper, sprites and the full-screen ground on the first `draw()` (~0.3 s at 960×540) and then draws a frame in well under 1 ms.

## Copy-paste prompt

```text
Build my game <X> in the "Linocut" style (miwale Game Style Library):
- A moving linocut print: paper #f0e7d2, ink #1b1715, ONE spot colour orange #ea6820, rare teal #2e7674.
- No gradients, blur, glow or alpha shading. Tone only via line density, stipple and hatching.
- Every mark is a filled knife cut: "lens" (pointed both ends) or "taper" (blunt start, sharp tip);
  limbs are tapered splines. No constant-width strokes.
- Each figure = one solid ink mass carved with white gouges + one paper area carved with black lenses.
- Light from the upper left: heavy crescent (shape minus shifted shrunken copy) at the lower right,
  white gouge highlights upper left; shade = parallel black lenses getting wider.
- Orange is printed on its own plate offset by (+0.8, +0.55) world units everywhere (misregistration).
- Bake sprites with a 0.9-unit paper halo and ink pinholes; 4 poses × 2 jittered variants swapped at 6 fps.
- Shadows = horizontal ink lens hatching. Hits = negative print; deaths = carved shards + ink splat.
- Ground: fibrous paper with grass ticks, furrows, stipple forest, solid-ink soil with echo contours,
  1.5-unit paper gutters between regions.
- HUD: paper panels, 3px ink borders, hard 4px offset shadows, striped bars, Rye / Alfa Slab One / Special Elite.
```
