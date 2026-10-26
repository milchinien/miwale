# Origami Fold — Game Art Style Spec

> A world folded from washi paper: flat-lit facets, mountain and valley creases, hemmed pastel sheets and stop-motion paper puppets.

Every character, creature, prop, collectible and icon is a small **fold mesh**: flat triangular facets with a pseudo height per vertex. One soft light from the upper left gives each facet a flat tone from a 4-step ramp per paper colour (light / base / shade / deep). Shared edges are classified automatically: a **mountain fold** catches the light as a thin bright line, a **valley fold** is a thin dark line, an open edge is the deep-toned paper edge. The paper is two-sided like real kami — hems, ribbon folds, bellies, inner ears, wing backs and confetti show the cream back of the sheet. The ground is one endless washi sheet scored with a crease tessellation; **designed sites** sit on it — villages on mustard field diamonds with pleated crop ridges, orchards on blush diamonds, deep-green groves inside meadows, lakes sunk below a teal shore band — joined by **folded paper ribbons**. Actors move like **stop-motion paper puppets**: held poses on 8–12 fps steps, tails and ears lagging one pose behind, frogs that crouch before they hop, creatures that crumple into a paper ball and pop open into a flat sheet.

## At a glance

| | |
| --- | --- |
| Family | Paper · Origami |
| Mood | calm, crafted, gentle, playful, tidy |
| Best for | cozy top-down action and adventure, puzzle and board-game adaptations, children's games, zen / seasonal projects, papercraft menus and maps |
| Renderer | Canvas 2D, procedural: 2D fold meshes with z heights → flat tone per facet → automatic crease lines → baked pose sprites |
| Pixel art | No — native resolution, sprites baked at 3–8 px per world unit |
| Complexity | 6/10 — shading and creases are automatic; designing folds, held poses and crumple sequences is the craft |
| Fonts | Zen Maru Gothic (500/700/900), M PLUS Rounded 1c (500/700/800), Kalam (400/700) |
| Key colours | washi `#f4eee1`, coral `#e8755b`, kami cream `#f3e9d6`, indigo `#4f62a6`, teal `#35a194`, mustard `#e6ae42`, blush `#ee9597`, plum `#76599b`, water `#88a8d8` |

## When to use it

- **Good fit:** cozy top-down or 3/4 projects with many small units — the pale ground and saturated folded figures stay readable in crowds.
- **Good fit:** puzzle games, board-game adaptations, map and menu screens — the crease grid is a natural board, and envelopes, tabs and notes make a coherent UI kit.
- **Good fit:** children's, educational, zen and seasonal projects — calm light, soft washi colours, no harsh contrast.
- **Good fit:** anything that wants "handmade" without hand-drawn assets — every asset is code, so variants are cheap.
- **Bad fit:** horror, grit, realism; dark neon or high-contrast moods — matte paper has no glow.
- **Bad fit:** projects needing hundreds of distinct, finely animated models — each pose is a mesh baked twice (both facing directions).
- **Bad fit:** retro pixel looks — the style relies on crisp sub-pixel crease lines.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Washi White | `#f4eee1` | Base sheet of the ground (~45 % of the screen), hem `#fbf8f0` |
| Meadow Sheet | `#d5e1c0` | Pale green sheet on the base paper |
| Grove Sheet | `#b7cf9e` | Deeper green sheet under pine groves |
| Field Sheet | `#f2dca6` | Mustard diamond under every village, carries the crop ridges |
| Blossom Sheet | `#f3cebe` | Blush diamond under every orchard |
| Shore Band | `#c3dfd6` | Teal band around every lake, one layer below the base |
| Water | `#88a8d8` | Sunken water; pleats `#a9c3ea` / `#7f9dd3` / `#6d8cc6` |
| Ribbon Kraft | `#e8d9bc` | Front of the folded paper ribbons; back `#faf5ea` |
| Coral | `#e8755b` | Main character fur, roofs — ramp `#f7a283` `#e8755b` `#c95b47` `#9b4136` |
| Kami Cream | `#f3e9d6` | The back of every sheet — ramp `#fffbf3` `#f3e9d6` `#dccbae` `#b5a083` |
| Indigo | `#4f62a6` | Kimono, doors, diagram ink — ramp `#7488c9` `#4f62a6` `#3b4a87` `#283462` |
| Teal | `#35a194` | Small creature, orbiting star — ramp `#63c2b3` `#35a194` `#277f76` `#1a5b56` |
| Sage | `#98b37d` | Small creature, crop ridges, grass — ramp `#bdd39b` `#98b37d` `#779562` `#587149` |
| Mustard | `#e6ae42` | Sash, mane, small collectible — ramp `#f8d372` `#e6ae42` `#c68c2d` `#936624` |
| Blush | `#ee9597` | Paper crane, tulips, lotus — ramp `#f9c0bd` `#ee9597` `#cd7279` `#9d525c` |
| Plum | `#76599b` | Large creature — ramp `#9a7fbb` `#76599b` `#5a447c` `#3f3059` |
| Pine | `#60a077` | Pine tiers, sprouts, shore grass — ramp `#88c197` `#60a077` `#46805c` `#305d44` |
| Wood | `#b0875e` | Trunks, sticks — ramp `#d4ae83` `#b0875e` `#8b6543` `#63472f` |
| Stone | `#cac3ba` | Boulders, pebbles — ramp `#e6e1da` `#cac3ba` `#a8a098` `#7f7873` |
| Paw Ink | `#3d3747` | Main character's legs — ramp `#5a5368` `#3d3747` `#2e2936` `#201c27` |
| Ink | `#2a2433` | Eyes, noses, closed-eye lines; mixed into paper edges |
| Shadow Plum | `#4e3848` | Cast shadows at alpha 0.24–0.32 |

Derived line colours per ramp: **paper edge** = deep tone mixed 38 % toward `#2a2433`; **mountain highlight** = light tone mixed 55 % toward white; **valley line** = deep tone mixed 15 % toward ink. HUD body text is `#3d3852`, titles `#3b4a87`, captions `#c95b47`.

**Rules**
- Every paper colour is exactly a 4-step ramp; the light picks the step per facet. No gradients inside facets, no in-between tones.
- The ground is pale; everything standing on it uses the saturated mid-value ramps. Actors pop by value first, hue second — a desaturated screenshot still separates them from the washi.
- Ground sheets carry meaning: mustard = village field, blush = orchard, deep green = grove, teal = shore. Never use them as random colour patches.
- Two-sided paper: wherever a sheet turns over, use the cream ramp.
- Main character = coral + indigo + cream + dark paws; small creatures teal / sage / mustard; fast creature blush; large creature plum + mustard. Keep creature hues off the main character.
- Shadows are plum at low alpha, never black or grey. No pure black anywhere (darkest `#201c27`).

## Typography

**Zen Maru Gothic** — 500, 700, 900 — titles, counters, card titles, floating numbers. `https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700;900&display=swap`

```css
.counter { font: 900 32px/1.05 'Zen Maru Gothic', sans-serif; letter-spacing: .05em; color: #3b4a87; text-shadow: 2px 2px 0 rgba(255,251,243,.9); }
.ribbon-title { font: 900 54px/1 'Zen Maru Gothic', sans-serif; letter-spacing: .06em; color: #fffbf3; text-shadow: 2px 3px 0 rgba(120,40,30,.35); }
```

**M PLUS Rounded 1c** — 500, 700, 800 — body copy, descriptions, caption bar. `https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@500;700;800&display=swap`

```css
.desc { font: 700 15px/1.3 'M PLUS Rounded 1c', sans-serif; color: #7a6c74; }
```

**Kalam** — 400, 700 — handwritten notes on the paper: labels, hints, families, like pencil marks. `https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=swap`

```css
.note { font: 700 15px/1.1 'Kalam', cursive; color: #c95b47; }
```

Canvas numbers: `900 8.5u "Zen Maru Gothic"` (emphasised 12 units) in indigo `#3b4a87` with a cream `#fffbf3` border; emphasised values in deep coral `#9b4136` on a folded mustard tag (upper half `#f8d372`, lower half `#e6ae42`, cream crease line). Hierarchy: title (Zen Maru 900, large) → label (Kalam, coral or teal) → value (Zen Maru 900, indigo). No all-caps.

## Rendering technique

**The fold mesh.** A model is a list of triangles in screen space (x right, y down, units = world units) with a z height per vertex. Points are de-duplicated (rounded to 1/64 unit), so faces that share two points share an edge.

1. **Normal & tone.** For each face, n = cross(b−a, c−a), flipped to face the viewer. d = n·L with L = normalize(−0.55, −0.45, 0.7). Tone = d > 0.8 → light, > 0.55 → base, > 0.3 → shade, else deep. A flat face is the base tone; an optional +1 offset pushes far legs, far sleeves and far wings back.
2. **Fill.** Faces are drawn in authoring order (back to front) and stroked in their own colour to hide anti-aliasing seams.
3. **Edges.** Each edge is drawn once: **open edge** → paper edge, 0.55 units; **shared edge** → signed distance of the earlier face's far vertex to the later face's plane, normalised: below −0.025 → **mountain** (bright, 0.3 units), above +0.025 → **valley** (dark, 0.3 units), flat → nothing or a soft colour seam.
4. **Details.** Ink dot eyes (0.75–0.85 units, white catch-light), dot noses, 0.45–0.5-unit ink lines for closed eyes.
5. **Crumple.** Hit and fall poses re-bake the same mesh with every shared vertex jittered (xy ±0.45·amount, z ±2.5·amount, amount 0.8–1.6): the sheet stays connected, facets catch new tones like crushed paper.
6. **Paper fibre.** A tileable 160 px fibre canvas over every sprite with `source-atop` at 0.55.

**Baking.** Every pose is baked once at `K = clamp(round(screenHeight/360·1.6), 3, 8)` px per unit into sprites anchored at the feet. The **left-facing version is rebuilt from mirrored geometry** (x → −x, then re-lit) — never flipped — so the light stays in the upper left. Each pose gets its own baked shadow sprite (blink poses reuse the idle shadows).

**Stop-motion playback.** Motion is a choice of baked pose per held step (`floor(time · fps + seed · k)`), plus a little continuous squash, lift and lean. Nothing is tweened between poses.

**Per frame.** Ground chunks (cached) → shadows of all y-sorted objects → props / creatures / main character sorted by y → orbiting objects → projectiles → particles → numbers → ambient butterflies → screen light overlay. Native resolution, smoothing on.

## World and ground

The ground is one endless washi sheet `#f4eee1`, scored with a **crease tessellation**: 40-unit squares, each split into four triangles (N, E, S, W) by its diagonals. Coloured sheets lie on top and are cut along this grid.

**Sites give the regions a reason.** One designed site per 520 × 520 block (jittered inside the middle 56 %):

| Site | Share | Sheet | Shape | Contents |
| --- | --- | --- | --- | --- |
| Village | 36 % | Field `#f2dca6` | diamond, \|dx\|+\|dy\| < 104–140 | 2–3 houses, tulips, screens, pinwheel, crop ridges |
| Orchard | 24 % | Blossom `#f3cebe` | diamond 82–108 | 3 × 3 grid of round trees, tulip bed |
| Grove | 24 % | Grove `#b7cf9e` | circle 100–140, edge wobbled by noise | ~11 tiered pines, bushes, a boulder |
| Open | 16 % | — | — | calm paper |

The area around the start is composed by hand (a village to the east, a grove to the west, an orchard to the north-west). Meadows `#d5e1c0` come from `fbm(x/470) > 0.53` and a 1.6× halo around every grove; very high values become groves of their own. Lakes come from a slower `fbm(x/720)`: above 0.64 water, 0.607–0.64 a teal shore band `#c3dfd6`; no water within 210 units of the start.

**Folded edges.** Each 40-unit cell takes one region; a higher sheet also fills a cell triangle where it wraps around two sides, so staircases become straight 45° folds. Stacking order bottom to top: water, shore, base, meadow, grove, field / blossom. Before each layer its union is filled twice with an offset (+1.3, +1.6 at alpha 0.09 and +2.6, +3.2 at alpha 0.07, `rgba(84,60,58)`) — a soft drop shadow onto the sheets below. Along every edge over a lower sheet a 2.4-unit **hem** shows the turned-over paper (sheet colour mixed 55 % toward `#fffcf4`) with a faint fold line and a paper-edge line.

**Relief.** Every 160-unit panel has its own crease pattern — 42 % pyramids, 26 % waterbomb checker, 16 % horizontal pleats, 16 % twist. Triangle tone × (1 + relief·amp) with relief N +0.022, E −0.017, S −0.027, W +0.013. A large-scale noise makes some panels calm and flat and others busy, so the grid never reads as wallpaper. Crease lines: mountain diagonals `rgba(255,253,246,.7)` with a faint shadow twin, valley lines `rgba(98,76,60,.16)`, grid lines `rgba(98,76,60,.13)`. Major folds every 160 units in **diagram notation** — valley dashed `[5, 3.5]` indigo, mountain dash-dot `[7, 2.5, 1.2, 2.5]` coral — faded with the panel calmness.

**Water** is sunk below everything as chevron pleats (period 18, row 11, amplitude 3.4): shaded slope `#6d8cc6`, valley line `rgba(44,64,122,.32)`, lit slope `#a9c3ea`, ridge line `rgba(255,255,255,.7)`, plus small cream three-facet wave crests.

**Ribbons** connect neighbouring sites (80 % of pairs, never across water) from doorstep to doorstep: 11–14 units wide, four straight runs with small random offsets. At every bend the ribbon is **folded flat along the bisector** — each run is cut on that mitre line, the runs alternate front `#e8d9bc` and back `#faf5ea`, and the fold gets a crease `rgba(96,70,52,.5)`. A dashed centre crease, a paper edge `rgba(120,92,64,.38)` and a drop shadow (+1.4, +1.9, alpha 0.1) finish it.

**Decals — clustered, never sprinkled.** All stamped from baked sprites:
- **Grass clumps:** 3–7 folded tufts (three cuts: fan of three, wide four-blade, slim pair; sage, or pine in groves and at shores) on a golden-angle spiral, biggest in the middle. Probability 85 % at sheet edges in lush regions, 60 % at other edges, 50 % along ribbon verges, 20 % inside meadows, 4 % on open paper.
- **Flowers** (4 folded petals, blush / cream / mustard) only inside small drifts (`noise(x/52) > 0.75`), single grass blades only lining the ribbons, pebbles only on shores.
- **Crop ridges** in village fields: pleated sage ridges 3.2 units wide on the 45° grid, a row every 12 units, double rows with every third pair fallow, tapered ends, folded pine sprouts every ~7 units leaning alternately — cut short around houses, fences, the pinwheel and the ribbons.
- Rare two-tone paper scraps and curved indigo fold arrows on open paper.

Paper fibre is laid over the whole chunk at alpha 0.5.

## Characters

All actors are fold meshes in 3/4 side view, baked as held poses for both facing directions.

**Main character — origami fox** (~14 units wide in the kimono, ~24 with the tail, ~36 tall to the ear tips; feet at the anchor):
- Head: a coral mask around one raised point over a cream muzzle that ends in a raised snout peak; ink dot eye with a catch-light, dot nose — the detail cluster of the whole figure.
- Ears: two coral kites with cream inner triangles (the back of the paper).
- Kimono: one indigo sheet folded down the middle, a mustard obi band, a cream hem turned up at the bottom, a cream collar; the near sleeve is an indigo kite with a cream cuff and an ink paw.
- Legs: dark ink strips with folded paws, the far leg one tone darker.
- Tail: a big coral kite behind the body, its tip folded back to show cream.
- 20 poses: 3 idle breaths, the same 3 with closed eyes (blink), ear flick, 8 walk poses, dash, dash landing, hurt (crumpled, squeezed eyes), throw (sleeve raised), down.
- Overlap: tail tip, ear tips and kimono hem take the previous pose's bob, so they follow through by one pose.

**Small creature — jumping frog** (~17 × 14 units, r9; teal, sage or mustard): a diamond body with an X of folds, the lower half cream, a big folded back thigh, a small front leg, two raised eye bumps with ink dots. 7 poses: sit, sit with throat puff, blink, crouch, launch (stretched, back leg thrown out), airborne (legs tucked), landing squash, plus a crumpled hit pose per colour.

**Fast creature — paper crane** (~28 × 24 units, r7; blush): the classic crane — diamond body, folded neck strip with a pointed head, tail strip, two kite wings. On the down-stroke the wings show the cream back. Hovers 8 units above its shadow. 6 wing poses: up, half, down-stroke, low, recovery, half; plus a crumpled pose.

**Large creature — folded boar** (~48 × 42 units, r17; plum): a faceted dome body around one raised point, a cream belly band, a separate nodding head with a cream tusk, blush snout and mustard eye, six mustard mane spikes along the spine, a mustard tail tuft, four strip legs with mustard hooves. 8 walk poses (lateral sequence), plus a crumpled pose.

**Crowd rules.** Every creature has its own phase (from its seed) for hops, flaps and steps and its own size (frog 0.95–1.05, boar 0.96–1.04); idle blinks and throat puffs run on unrelated periods. No two neighbours move in lock-step.

## Props

Props are baked with the same fold engine and shadows, and placed **by design**:

- **Village:** 2–3 houses 30–44 units from the centre (coral or indigo roofs) each with a tulip cluster beside it and an accordion screen further out, a pinwheel near the centre, a round tree and a bush on the rim.
- **Orchard:** a 3 × 3 diamond grid of round trees (25 × 19 spacing, one colour per orchard with an occasional odd one) around a tulip bed, three more tulip clumps on the rim.
- **Grove:** ~11 tiered pines (the tallest variant in the core), three bushes and a boulder on the rim.
- **Loose fill per region:** lakes carry lotus clusters and the odd paper boat; shores grow reeds and stones; meadows get scattered pines, trees, bushes, tulips and stones; open paper stays calm — stones beside the ribbons, the rare shrub, tree or pinwheel.

| Prop | Variants | Construction |
| --- | --- | --- |
| Pine | 3 (two pine-green heights, one teal) | three kite tiers folded down the middle, left half lit, wood strip trunk |
| Round tree | 4 (coral, mustard, sage, teal) | crown of 8 outer + 8 inner points and a raised apex (24 facets), trunk with one branch |
| Bush | 3 (sage, pine, teal) | 2–3 folded lobes |
| Boulder | 3 | fan of 7 jittered points around a raised point at the upper left |
| House | 2 (coral / indigo roof) | front wall folded at the middle, cream side wall, indigo door, mustard window, roof triangle with two cream squash-fold flaps |
| Tulips | 2 colour orders | three folded cups on sage stems with leaves |
| Reeds | 2 | pine / sage blade strips with wood heads |
| Screen | 1 | accordion of cream and teal pleats |
| Pinwheel | 12 rotation frames | coral and teal blades with cream inner flaps on a wood stick, 9 fps |
| Paper boat | 3 (mustard, coral, cream) | classic folded boat, water only |
| Lotus | 1 | two rings of blush petals on a pad, water only |

Paper on a stand sways: a slow rotation per prop (reeds 0.05, tulips 0.035, trees 0.014–0.016, bushes 0.012 rad) mixing its own sine with a gust that rolls across the world from the left. Boats and lotus bob 0.8 units and rock ±0.05 rad with an expanding cream ripple. Tall props turn 50 % translucent when the main character is behind them; the start keeps 100 units free of tall props.

## Effects and particles

All effects are paper: folded sparkles, crease lines, kite petals, two-sided confetti, flat sheets. Each has core → main → secondary → residue with its own lifetime.

- **Projectile — paper plane:** cream dart with coral wing tips and a valley crease, baked at 16 angles, banking ±0.2 rad in flight, own shadow 7 units below, two pencil dashes `#7a6c74` behind.
- **Orbiting object — shuriken:** two-tone coral / teal throwing star, 8 rotation frames over 90° at 30 fps, bobbing 1.2 units over a shadow blob.
- **Collectibles:** small = mustard lucky star (6 frames, 5 fps); large = teal folded crystal (8 frames, 8 fps). Bob 3 ± 1.2 units on held 12 fps steps, each on its own phase; new ones pop up 10 units with an outBack scale. Collect: a tinted 4-point sparkle and the star swelling to 1.9× while lifting 9 units in 0.3 s (+ teal / cream confetti for the large one).
- **Impact:** core — a crisp cream 4-point sparkle with a thin plum edge, 0.13 s; main — three crease lines snapping open in a fan around the hit direction (lit mountain line beside a dark valley line, 0.17 s, outQuad); secondary — three two-tone shards flung along the hit (gravity 260); residue — one cream fleck drifting down for 0.65 s.
- **Burst (crumple and unfold):** flash 0.16 s; 8 (large: 12) two-tone kite petals shoot out and fold shut again (sin envelope); 7 (14) two-sided confetti; the flat sheet left on the ground folds itself back up in held steps over 1.1 s (open → half → closed → shrinking fade). The large creature adds a plum dash-dot crease ring and a short shake.
- **Two-sided confetti:** flat triangles flipping with cos(t·9) — colour front (light / base tone) when positive, cream back when negative — swaying sideways, gravity 40–120, high drag.
- **Glow-up:** pale-gold sparkle, a dash-dot mustard crease ellipse opening to 40 units and a dashed indigo one 0.12 s later, a ground ring of 10 mustard / coral petals plus 8 teal / cream petals, 22 confetti drifting down from 30–46 units; the main character turns once like a card.
- **Dash:** cream and indigo folded strips trail the dash direction; two cream cut-out afterimages 8 units apart at alpha 0.42 / i.
- **Main character hit:** cream sparkle, 4 coral crease lines, 6 confetti. **Final fall:** the coral sheet tumbles up and away, 12 coral / indigo petals, 18 confetti.
- **Floating numbers:** unfold vertically from a crease (outBack, first 14 % of life) and fold away (last 22 %).

## Atmosphere and lighting

- **One light** for everything: L = normalize(−0.55, −0.45, 0.7). Shadows always fall to the lower right.
- **Cast shadows:** silhouette tinted `rgb(78,56,72)`, sheared x' = x − 0.62·y, y' = −0.36·y around the feet, blurred 1.1 units (props and the large creature 1.4–1.6), alpha 0.3 (crane 0.24, props 0.28), plus a contact ellipse. Hopping actors' shadows shrink with height (× (1 − lift·0.04)); the crane's shadow is offset by its hover height.
- **Sheet shadows** on the ground are two offset fills (no blur), so chunk borders stay seamless.
- **Screen light**, baked once per size: linear gradient from `rgba(255,250,235,.16)` at the upper left to `rgba(90,64,80,.14)` at the lower right, plus a radial vignette to `rgba(96,70,70,.17)`.
- **Ambient life**, slower than the actors: origami butterflies (two kite wings, beats on 12 fps steps open – half – closed – half with held glides) on a 230-unit grid, 22 ± 4 units above their shadows; props sway at 0.4–0.9 rad/s.
- No glow, bloom or fog — paper is matte. Modal overlays: indigo tint `linear-gradient(135deg, rgba(59,74,135,.34), rgba(40,52,98,.5))` with a diagonal crease grid of light lines every 64 px.

## UI

The HUD is folded paper — no rounded corners, hard offset shadows `rgba(82,60,72,.15)`, 1 px edges `rgba(120,96,80,.24)`.

- **Top bar:** a cream strip folded lengthwise (`linear-gradient(180deg, #fffaf1 0 48%, #ebe0cb 52%)`), fill = teal pleats `repeating-linear-gradient(118deg, #43ad9f 0 18px, #33998c 18px 36px)` with the same fold overlay, value on a coral tab notched on the left.
- **Panel + bar:** a faceted coral fold heart + a 250 × 26 folded strip with coral pleats, value centred in Zen Maru Gothic 900 15 px with a cream halo.
- **Title / clock:** an envelope — cream `#fbf5e8`, a two-tone flap triangle (`clip-path: polygon(0 0, 100% 0, 50% 100%)`) and diagonal creases; digits indigo Zen Maru 900 32 px, a Kalam caption in coral.
- **Counter:** a paper tab with a dog-eared corner (`linear-gradient(225deg, transparent 14px, #fbf5e8 14px)` + a `#dccbae` fold triangle).
- **Caption bar:** a note folded down the middle (`#fcf7ec` / `#f1e7d4`), Kalam family in teal, name in coral Zen Maru 900.
- **Cards:** envelopes 232 × 300, slightly rotated (−1.5° / 1.2° / −0.6°), coloured flap triangles (coral / teal / mustard halves), bottom diagonal creases, a folded-square icon plate (`conic-gradient`), an indigo corner tab with the number. They unfold from the top edge and straighten on hover.
- **Panel title:** a coral ribbon with V-notched ends and a horizontal centre fold.
- **Icons** are fold meshes in a 48-unit box with 1.25-unit paper edges and 0.7-unit creases.

```css
.bar { position: relative; width: 250px; height: 26px; background: linear-gradient(180deg, #fffaf1 0 50%, #e9ddc7 50% 100%);
  box-shadow: 0 0 0 1px rgba(120,96,80,.26), 3px 4px 0 rgba(82,60,72,.16); overflow: hidden; }
.bar-fill { height: 100%; box-shadow: 1px 0 0 #9b4136;
  background: linear-gradient(180deg, rgba(255,255,255,.2) 0 50%, rgba(90,24,14,.13) 50% 100%), repeating-linear-gradient(62deg, #ee8063 0 15px, #df6c52 15px 30px); }
.card { position: relative; isolation: isolate; width: 232px; min-height: 300px; background: linear-gradient(180deg, #fffaf1, #f5ecdb);
  box-shadow: 0 0 0 1px rgba(120,96,80,.24), 6px 8px 0 rgba(82,60,72,.16); transform: rotate(-1.5deg);
  animation: unfold .6s cubic-bezier(.2,1.25,.4,1) backwards; }
.card::before { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 118px; z-index: -1;
  background: linear-gradient(90deg, #f29074 0 50%, #e2735a 50% 100%); clip-path: polygon(0 0, 100% 0, 50% 100%); }
@keyframes unfold { from { transform: perspective(700px) rotateX(-88deg); opacity: 0; } to { transform: perspective(700px) rotateX(0) rotate(-1.5deg); opacity: 1; } }
```

## Motion and animation

Everything plays like a stop-motion paper puppet: **held poses on 8–12 fps steps**, every actor on its own phase.

| Actor / state | Timing | Poses and principles |
| --- | --- | --- |
| Main character walk | 8 poses per cycle (6.2 animation units ≈ 0.67 s at walking speed ≈ 12 fps) | contact – down – passing – up per foot; stride 4.4, foot lift 2.4, bob 0.3 / −0.3 / 0.8 / 1.3, lean 0.07–0.095 rad; sleeves counter-swing the feet; tail, ears and hem lag one pose |
| Main character idle | 8 fps steps, 2.5 s loop | neutral – breathe in (held 0.75 s, tail lifts) – neutral – breathe out (held, tail swings); blink every 3.7 s for 0.17 s; ear flick every 6.3 s for 0.36 s |
| Throw | while aiming | sleeve raised, 3 % recoil squash |
| Dash | 0.2 s + 0.14 s landing | wind-up lean 0.22 rad, ears swept back, tail streaming, squash 1.1 / 0.93 lifted 1.2; landing pose squash 1.06 / 0.95 |
| Main character hurt | ~0.17 s + blinking | crumpled pose, squeezed eyes, squash 1.08 / 0.92, cream flash; then 12 fps blinking while untouchable |
| Glow-up | first ⅓ s | one card flip: horizontal scale cos(2πt), mirrored pose on the back half, lift 5 units |
| Frog hop | 9 held steps per hop | crouch 20 % (squash 1.05 / 0.94, anticipation) – launch – airborne arc 6.5 units, tilt −0.16 → +0.1 rad – landing squash 1.08 / 0.9 – sit with throat puffs and blinks |
| Crane flap | 12 fps, 7-step loop | up (held 2 steps) – half – down-stroke – low – recovery – half; body rises up to 1.6 units on the down-stroke, neck bobs; hover 8 ± 1.6, banking ±0.12 rad |
| Boar walk | 8 poses | lateral sequence, each leg 3/4 of the cycle on the ground; body bobs twice per cycle (0–1.1), head nods ±1, mane tips lag, tail wags ±2.4 |
| Hit (crease pop) | ~80 ms + ~40 ms | crumpled hit pose squashed 1.16 / 0.84 with a cream flash on the first frames, then a spring-back 0.95 / 1.06 |
| Vanish | 0.35 s, 5 held steps | crumple + flash (1.2 / 0.8) – squeeze – crumpled paper ball tossed up 6 units – ball lands – pops open into a flat sheet; the crane is crushed and its loose sheet see-saws down. The sheet then folds itself away over 1.1 s |
| Appear | 0.45 s, 6 held steps | a folded packet drops in, half-opens, opens flat; the creature rises out squashed (1.22 / 0.42) – stretched (0.9 / 1.18) – settles (1.05 / 0.93) while the sheet shrinks and fades. Crane: a loose sheet see-saws down from 30 units, then the crane pops in with pinched wings and a 1.12 overshoot |
| Collectibles | 12 fps bob steps | per-item phase; spin frames 5–8 fps |
| HUD cards | 0.6 s, staggered 0.08 s | unfold from the top edge (rotateX −88° → 0); title ribbon unfolds scaleX 0.05 → 1 in 0.5 s |

Ambient motion (butterflies, prop sway, pinwheels, boats) is always slower and smaller than the actors.

## Do and don't

**Do**
- Model every asset as facets with a z height per vertex and let one shared light choose 1 of 4 tones per facet.
- Draw shared edges as creases: bright for mountain folds, dark for valley folds; stroke only open edges as paper edges.
- Show the cream back of the paper wherever a sheet turns over.
- Animate with held poses (8–12 fps); let tails, ears, hems and manes lag one pose behind the body.
- Give every region a reason (villages on fields, orchards on blossom, groves in meadows, reeds at shores) and connect sites with folded ribbons.
- Gather grass in clumps at edges, verges and shores; leave open paper calm.
- Bake both facing directions from mirrored geometry so the light never flips.

**Don't**
- Don't use smooth gradients, airbrush shading or rounded blobs — paper folds are straight.
- Don't add thick black outlines; edges are paper edges in the colour's deep tone.
- Don't mirror sprites with negative scale — the light would jump to the right.
- Don't tween poses smoothly or drive every actor with one shared sine — it stops looking like paper puppets.
- Don't cut organic, torn or scissor-cut silhouettes — that is cut paper, not origami.
- Don't scatter tufts and flowers evenly or fill the ground with saturated colour.
- Don't make shadows black or grey, and don't let them point in different directions; no glow or neon.

## Implementation recipe

1. Write the fold mesh (`pt`, `tri`, `kite`, `strip`, `fan`, `dot`, `line`) and the renderer: per-facet tone from the light, crease classification per shared edge, paper edges, fibre overlay.
2. Bake: for every pose call the model function with a pose object, bake right- and left-facing (mirrored geometry), then bake a sheared, blurred shadow per pose. Add crumpled copies (jittered vertices) for hit and fall poses.
3. Define pose tables: walk cycles as foot functions (contact → lift arc), idle sequences as index lists played on held steps, overlapping parts reading the previous pose's bob.
4. Ground chunk generator: crease cells → region per triangle from designed sites and noise → layers bottom to top with offset shadows and hems → crease lines and diagram folds → ribbons with mitred folds → fibre → clustered decals stamped from baked sprites → crop ridges.
5. Props from site arrangements first, then a sparse per-region fill that keeps clear of arrangements and ribbons.
6. Per frame: choose a pose per actor from its state and its own phase, blit its shadow and sprite with a small squash / lean; particles are flat paper shapes with front / back flips.
7. HUD from CSS: folded strips, envelopes, tabs, envelope cards that unfold.

## Code

**Fold mesh primitives**

```js
function Fold() { this.v = []; this.f = []; this.idx = new Map(); }
Fold.prototype.pt = function ([x, y, z = 0]) {            // shared points -> shared edges
  const k = Math.round(x * 64) + ',' + Math.round(y * 64) + ',' + Math.round(z * 64);
  let i = this.idx.get(k);
  if (i === undefined) { i = this.v.length / 3; this.v.push(x, y, z); this.idx.set(k, i); }
  return i;
};
Fold.prototype.tri = function (a, b, c, key, off = 0) { this.f.push({ a: this.pt(a), b: this.pt(b), c: this.pt(c), key, off }); return this; };
Fold.prototype.kite = function (A, B, P, Q, key) { return this.tri(A, P, B, key).tri(A, B, Q, key); };  // folded along A-B
Fold.prototype.strip = function (p0, p1, w0, w1, z, key) {                                             // leg / neck / tail / ridge
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  const L0 = [p0[0] + nx * w0 / 2, p0[1] + ny * w0 / 2], R0 = [p0[0] - nx * w0 / 2, p0[1] - ny * w0 / 2];
  const L1 = [p1[0] + nx * w1 / 2, p1[1] + ny * w1 / 2], R1 = [p1[0] - nx * w1 / 2, p1[1] - ny * w1 / 2];
  const C0 = [p0[0], p0[1], z], C1 = [p1[0], p1[1], z];
  return this.tri(L0, C0, C1, key).tri(L0, C1, L1, key).tri(C0, R0, R1, key).tri(C0, R1, C1, key);
};
```

**Tones and automatic creases**

```js
const L = normalize([-0.55, -0.45, 0.7]);                 // light from the upper left
const toneOf = (n) => { const d = n[0] * L[0] + n[1] * L[1] + n[2] * L[2]; return d > 0.8 ? 0 : d > 0.55 ? 1 : d > 0.3 ? 2 : 3; };
// shared edge p-q between face i (drawn now) and face j (drawn earlier); D = far vertex of face j
function creaseKind(nI, P, D) {
  const s = (nI[0] * (D[0] - P[0]) + nI[1] * (D[1] - P[1]) + nI[2] * (D[2] - P[2])) / (Math.hypot(D[0] - P[0], D[1] - P[1]) + 1e-6);
  return Math.abs(s) < 0.025 ? 'flat' : s < 0 ? 'mountain' : 'valley';
}
// crumpled pose: same mesh, every shared vertex jittered before lighting (facets catch new tones)
function crumple(verts, amount, hash) {
  for (let i = 0; i < verts.length; i += 3) {
    verts[i] += (hash(i, 1) - 0.5) * amount * 0.9; verts[i + 1] += (hash(i, 2) - 0.5) * amount * 0.9; verts[i + 2] += (hash(i, 3) - 0.5) * amount * 5;
  }
}
```

**Sheared soft cast shadow (baked once per pose)**

```js
function castShadow(s, shx = 0.62, shy = -0.36, alpha = 0.3, K = 4) {  // s = { c: canvas, ox, oy } anchored at the feet
  const pad = Math.ceil(K * 3), W = Math.ceil(s.c.width + shx * s.oy) + pad * 2, H = Math.ceil(-shy * s.c.height) + pad * 2 + K * 4;
  const out = Object.assign(document.createElement('canvas'), { width: W, height: H }), g = out.getContext('2d');
  const sil = Object.assign(document.createElement('canvas'), { width: s.c.width, height: s.c.height }), q = sil.getContext('2d');
  q.drawImage(s.c, 0, 0); q.globalCompositeOperation = 'source-in'; q.fillStyle = 'rgb(78,56,72)'; q.fillRect(0, 0, sil.width, sil.height);
  const ax = s.ox + pad, ay = pad + K * 2;
  g.filter = `blur(${(K * 1.1).toFixed(1)}px)`; g.globalAlpha = alpha;
  g.setTransform(1, 0, -shx, shy, ax - s.ox + shx * s.oy, ay - shy * s.oy);   // x' = x - shx*y, y' = shy*y around the feet
  g.drawImage(sil, 0, 0);
  return { c: out, ox: ax, oy: ay };
}
```

**Stop-motion pose choice (held steps, own phase, anticipation)**

```js
// frog hop: 9 held steps per hop – crouch, launch, airborne, land, sit
function frogPose(anim, seed, time) {
  const ph = anim * 0.38 + seed * 3, q = Math.floor((ph - Math.floor(ph)) * 9) / 9;   // held step
  if (q < 0.2) return { frame: 'crouch', sx: 1.05, sy: 0.94, lift: 0 };              // anticipation
  if (q < 0.7) {
    const u = Math.min(1, Math.max(0, (q - 0.17) / 0.5));
    return { frame: q < 0.3 ? 'launch' : q < 0.6 ? 'air' : 'land', sx: q < 0.6 ? 1 : 1.08, sy: q < 0.6 ? 1 : 0.9,
             lift: Math.sin(u * Math.PI) * 6.5, rot: (u < 0.5 ? -0.16 : 0.1) * Math.sin(u * Math.PI) };
  }
  const blink = (time * 0.9 + seed * 5) % 3.3 < 0.17;
  return { frame: blink ? 'blink' : Math.floor(time * 3 + seed * 11) % 4 === 1 ? 'puff' : 'sit', sx: 1, sy: 1, lift: 0 };
}
// vanish in 5 held steps: crumple+flash, squeeze, ball tossed, ball lands, flat sheet
const vanishStep = (t) => ['flash', 'squeeze', 'ballUp', 'ballDown', 'sheet'][Math.min(4, Math.floor(t * 5))];
```

**Folded paper ribbon (mitred at every bend)**

```js
function ribbon(ctx, pts, w, front = '#e8d9bc', back = '#faf5ea') {
  const n = pts.length - 1, hw = w / 2, unit = (x, y) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
  const bis = (s) => { const [ux, uy] = unit(pts[s - 1][0] - pts[s][0], pts[s - 1][1] - pts[s][1]), [vx, vy] = unit(pts[s + 1][0] - pts[s][0], pts[s + 1][1] - pts[s][1]);
    const b = Math.hypot(ux + vx, uy + vy) < 1e-3 ? [-uy, ux] : unit(ux + vx, uy + vy); return b; };
  const cut = (s, dx, dy, nx, ny) => { if (s <= 0 || s >= n) return 0; const [bx, by] = bis(s), c = dx * by - dy * bx;
    return Math.abs(c) < 0.15 ? 0 : Math.max(-2.5 * hw, Math.min(2.5 * hw, (-hw * (nx * by - ny * bx)) / c)); };
  for (let s = 0; s < n; s++) {
    const a = pts[s], b = pts[s + 1], [ux, uy] = unit(b[0] - a[0], b[1] - a[1]), nx = -uy, ny = ux;
    const P = [[a, nx, ny, cut(s, ux, uy, nx, ny)], [b, nx, ny, cut(s + 1, ux, uy, nx, ny)], [b, -nx, -ny, cut(s + 1, ux, uy, -nx, -ny)], [a, -nx, -ny, cut(s, ux, uy, -nx, -ny)]]
      .map(([p, ex, ey, t]) => [p[0] + ex * hw + ux * t, p[1] + ey * hw + uy * t]);
    ctx.beginPath(); P.forEach((p) => ctx.lineTo(p[0], p[1])); ctx.closePath();
    ctx.fillStyle = s & 1 ? back : front; ctx.fill();                    // every fold turns the ribbon over
    ctx.strokeStyle = 'rgba(120,92,64,.38)'; ctx.lineWidth = 0.45; ctx.stroke();
    if (s > 0) { ctx.strokeStyle = 'rgba(96,70,52,.5)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); ctx.lineTo(P[3][0], P[3][1]); ctx.stroke(); }
  }
}
```

## Adapting it to your project

- **Keep fixed:** the light vector, 4-step ramps, automatic mountain / valley creases, cream back side, mirrored re-baking, plum shadows to the lower right, held-pose stop-motion timing, a pale crease-pattern ground whose sheets mean something, the paper-tab / envelope UI.
- **May change:** the palette — keep a pale ground (≥ 85 % lightness), mid-value saturated ramps for actors and a cream back-side ramp. A winter theme: base `#eef2f5`, sheets in ice blue and lilac, indigo and coral actors stay.
- **New characters:** start from kites, strips and fans; one raised point per body part — that is where the light breaks. Give each a readable silhouette feature (ears, tail, wings, mane) and pose it over 6–8 held frames with one lagging part. Keep the main character ~14 × 36 units, small creatures 14–20 units, large creatures ~2.5× the main character.
- **New sites:** a site = a sheet shape on the crease grid + an arrangement of props + its own decals (a pond with lily pads, a market square with stalls). Connect it with a ribbon.
- **Mixing elements:** characters and props depend only on the light vector and the shadow rule — on another style's ground, keep the plum sheared shadows. The crease-pattern ground works under other characters if their shadows are soft and fall to the lower right.
- **Other project types:** the crease grid doubles as a board (snap to 40-unit cells); menus can be built from the envelope cards and paper tabs alone; for side views, author meshes in profile — shading only needs z.
- **Other resolutions:** only K changes (`clamp(round(H/360·1.6), 3, 8)`); lines are in world units and scale with it.

## Performance notes

- Init bakes all poses with their blurred shadows: main character 20 poses × 2 directions, 3 frog colours × 7 poses + 3 crumpled ones, 6 crane and 8 boar poses + crumpled ones, 5 paper balls, 24 prop variants, 12 pinwheel frames, 16 planes, 8 shuriken, 6 stars, 8 crystals, 4 butterflies and 23 ground-decal sprites. Hit flashes are tinted lazily and cached on the sprite.
- Per frame: one shadow + one sprite blit per object, tiny particle paths, one full-screen overlay. Pose choice is a few integer operations — held steps cost nothing extra.
- Ground chunks (256 units at ≤ 2.5 px/unit) are vector-drawn by a generator that yields after every layer, the crease pass, the decal pass and every 8 crop ridges; sites, cell regions, ribbons and arrangements are cached. Triangles are grouped by colour (relief quantised to 0.25 % steps) so a layer is a few dozen fill + seam-stroke paths; crease lines are collected into a few paths per 160-unit panel (their visibility is constant per panel); grass, flowers, pebbles and crop sprouts are stamped from baked sprites (one `drawImage` each) instead of building a fold mesh per decal. About 4–5 ms of script per chunk.
- `ctx.filter` blur is used only while baking shadows; ground sheet shadows are two offset fills instead of a blur so chunk borders stay seamless.
- The starter kit caches its sprites and the ground canvas and redraws its preview in a few milliseconds.

## Copy-paste prompt

```text
Use the Origami Fold art style for my project:
- Canvas 2D, no image assets. Everything is a "fold mesh": triangles in screen space with a z height per vertex,
  shared points de-duplicated so faces share edges. Bake every pose once into a sprite (K px per world unit, 360 units = screen height).
- One light from the upper left, L = normalize(-0.55,-0.45,0.7). Facet tone from d = n·L: >.8 light, >.55 base, >.3 shade, else deep,
  using 4-step ramps: coral #f7a283/#e8755b/#c95b47/#9b4136, indigo #7488c9/#4f62a6/#3b4a87/#283462, teal #63c2b3/#35a194/#277f76/#1a5b56,
  mustard #f8d372/#e6ae42/#c68c2d/#936624, blush #f9c0bd/#ee9597/#cd7279/#9d525c, cream back side #fffbf3/#f3e9d6/#dccbae/#b5a083.
- Shared edges: mountain fold = thin bright line, valley fold = thin dark line; open edges = deep-tone paper edge. Paper is two-sided (cream back).
- Mirror by rebuilding geometry (x -> -x) and re-lighting, never by flipping the image.
- Animate like stop-motion paper puppets: held poses on 8-12 fps steps, own phase per actor, tails/ears/hems lag one pose,
  crouch before hops, hit = crumpled pose squashed for ~80 ms, vanish = crumple -> paper ball -> flat sheet that folds itself away.
- Main character: a coral origami fox in an indigo kimono with a mustard sash, cream hem, dark paws, kite ears and a kite tail.
  Creatures: teal/sage/mustard jumping frogs, blush paper cranes hovering 8 units up, a plum folded boar with a mustard spiked mane.
- Ground: a washi sheet #f4eee1 with a 40-unit crease tessellation; designed sites on it – villages on mustard field diamonds #f2dca6
  with pleated crop ridges, orchards on blush diamonds #f3cebe, groves on #b7cf9e inside meadows #d5e1c0, lakes #88a8d8 (chevron pleats)
  below a teal shore band #c3dfd6 – edges along crease lines with cream hems and offset drop shadows, folded paper ribbons
  (#e8d9bc / #faf5ea, mitred at the bends) between sites, grass in clumps at edges and verges only.
- Shadows: silhouette tinted rgb(78,56,72), sheared to the lower right, blurred, alpha ~0.3. Paper fibre texture on everything.
- Effects: paper-plane projectiles, two-tone shuriken, lucky stars, crease-line impacts, kite-petal bursts, two-sided confetti.
- UI: folded paper strips with pleated fills, envelope panels with flaps, dog-eared tabs, envelope cards that unfold; fonts Zen Maru Gothic 900,
  M PLUS Rounded 1c, Kalam for handwritten notes.
```
