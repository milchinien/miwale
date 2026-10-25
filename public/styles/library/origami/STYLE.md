# Origami Fold — Game Art Style Spec

> A world folded from washi paper: flat facets with crisp mountain and valley creases on a giant crease-pattern sheet.

Every character, creature, prop, collectible and icon is a small **fold mesh**: flat triangular facets with a pseudo height per vertex. One soft light from the upper left gives each facet a flat tone from a 4-step ramp per paper colour (light / base / shade / deep). Shared edges are classified automatically: a **mountain fold** catches the light as a thin bright line, a **valley fold** is a thin dark line, an open edge is the deep-toned paper edge. The paper is two-sided like real kami — hems, bellies, inner ears, wing backs and confetti show the cream back of the sheet. The ground is one endless sheet scored with a crease tessellation; pastel sheets lie on top along straight folded hems with short drop shadows, and pleated blue water is sunk below. Soft plum shadows, sheared to the lower right, lift every folded object off the paper.

## At a glance

| | |
| --- | --- |
| Family | Paper · Origami |
| Mood | calm, crafted, gentle, playful, tidy |
| Best for | cozy top-down action and adventure, puzzle and board-game adaptations, children's games, zen / seasonal projects, papercraft menus and maps |
| Renderer | Canvas 2D, procedural: 2D fold meshes with z heights → flat tone per facet → automatic crease lines → baked sprites |
| Pixel art | No — native resolution, sprites baked at 3–8 px per world unit |
| Complexity | 5/10 — shading and creases are automatic; designing folds that read as origami is the craft |
| Fonts | Zen Maru Gothic (500/700/900), M PLUS Rounded 1c (500/700/800), Kalam (400/700) |
| Key colours | washi `#f4eee1`, coral `#e8755b`, kami cream `#f3e9d6`, indigo `#4f62a6`, teal `#35a194`, mustard `#e6ae42`, blush `#ee9597`, plum `#76599b`, water `#88a8d8` |

## When to use it

- **Good fit:** cozy top-down or 3/4 projects with many small units — the pale ground and saturated folded figures stay readable in crowds.
- **Good fit:** puzzle games, board-game adaptations, map and menu screens — the crease grid is a natural board, and envelopes, tabs and notes make a coherent UI kit.
- **Good fit:** children's, educational, zen and seasonal projects — calm light, soft washi colours, no harsh contrast.
- **Good fit:** anything that wants "handmade" without hand-drawn assets — every asset is code, so variants are cheap.
- **Bad fit:** horror, grit, realism; dark neon or high-contrast moods — matte paper has no glow.
- **Bad fit:** projects needing hundreds of distinct, finely animated models — each pose is a rebuilt mesh, baked twice (both facing directions).
- **Bad fit:** retro pixel looks — the style relies on crisp sub-pixel crease lines.

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Washi White | `#f4eee1` | Base sheet of the ground (~50 % of the screen), hem `#fbf8f0` |
| Sage Sheet | `#d5e1c0` | Pale green sheet on the ground |
| Mustard Sheet | `#f2dca6` | Pale yellow sheet |
| Coral Sheet | `#f3cebe` | Pale coral sheet |
| Teal Sheet | `#c3dfd6` | Pale teal sheet |
| Water | `#88a8d8` | Sunken water; pleats lit `#a9c3ea`, shaded `#6d8cc6` |
| Coral | `#e8755b` | Main character fur, roofs — ramp `#f7a283` `#e8755b` `#c95b47` `#9b4136` |
| Kami Cream | `#f3e9d6` | The back of every sheet — ramp `#fffbf3` `#f3e9d6` `#dccbae` `#b5a083` |
| Indigo | `#4f62a6` | Kimono, doors, diagram ink — ramp `#7488c9` `#4f62a6` `#3b4a87` `#283462` |
| Teal | `#35a194` | Small creature, orbiting star — ramp `#63c2b3` `#35a194` `#277f76` `#1a5b56` |
| Sage | `#98b37d` | Small creature, stems, grass — ramp `#bdd39b` `#98b37d` `#779562` `#587149` |
| Mustard | `#e6ae42` | Sash, mane, small collectible — ramp `#f8d372` `#e6ae42` `#c68c2d` `#936624` |
| Blush | `#ee9597` | Paper crane, tulips, lotus — ramp `#f9c0bd` `#ee9597` `#cd7279` `#9d525c` |
| Plum | `#76599b` | Large creature — ramp `#9a7fbb` `#76599b` `#5a447c` `#3f3059` |
| Pine | `#60a077` | Pine tiers — ramp `#88c197` `#60a077` `#46805c` `#305d44` |
| Wood | `#b0875e` | Trunks, sticks — ramp `#d4ae83` `#b0875e` `#8b6543` `#63472f` |
| Stone | `#cac3ba` | Boulders — ramp `#e6e1da` `#cac3ba` `#a8a098` `#7f7873` |
| Paw Ink | `#3d3747` | Main character's legs — ramp `#5a5368` `#3d3747` `#2e2936` `#201c27` |
| Ink | `#2a2433` | Eyes, noses; mixed into paper edges |
| Shadow Plum | `#4e3848` | Cast shadows at alpha 0.24–0.32 |
| HUD Ink | `#3d3852` | HUD text; titles `#3b4a87`, captions `#c95b47` |

Derived line colours per ramp: **paper edge** = deep tone mixed 38 % toward `#2a2433`; **mountain highlight** = light tone mixed 55 % toward white; **valley line** = deep tone mixed 15 % toward ink.

**Rules**
- Every paper colour is exactly a 4-step ramp; the light picks the step per facet. No gradients inside facets, no in-between tones.
- The ground is pale; everything standing on it uses the saturated mid-value ramps. Actors pop by value first, hue second.
- Two-sided paper: wherever a sheet turns over, switch to the cream ramp.
- Hue ownership: coral + indigo = main character; teal / sage / mustard = small creatures; blush = fast creature; plum + mustard mane = large creature.
- Water is the only large saturated ground area, always sunk below the paper.
- Shadows are plum `rgb(78,56,72)` at low alpha — never black or grey. No pure black (darkest `#201c27`).

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

Canvas numbers: `900 8.5u "Zen Maru Gothic"` (emphasised 12 units) in indigo `#3b4a87` with a 0.32×size cream `#fffbf3` border; emphasised values in deep coral `#9b4136` on a folded mustard tag (upper half `#f8d372`, lower half `#e6ae42`, cream crease line, plum shadow offset). No all-caps; slight positive letter-spacing on titles.

## Rendering technique

**The fold mesh.** A model is a list of triangles in screen space (x right, y down, units = world units) with a z height per vertex. Points are de-duplicated (rounded to 1/64 unit), so faces that share two points share an edge.

1. **Normal & tone.** For each face, n = cross(b−a, c−a), flipped to face the viewer (nz ≥ 0). d = n·L with L = normalize(−0.55, −0.45, 0.7). Tone = d > 0.8 → light, > 0.55 → base, > 0.3 → shade, else deep. A flat face (d ≈ 0.70) is the base tone; tilting toward the upper left lightens, toward the lower right darkens. An optional tone offset (+1) pushes far legs and far wings back.
2. **Fill.** Faces are drawn in authoring order (back to front) and stroked in their own colour at 0.9 px to hide anti-aliasing seams.
3. **Edges.** Each edge is drawn once, when the later of its two faces is drawn:
   - **open edge** (one face): paper edge, deep tone toward ink, 0.55 units;
   - **shared edge**: take the far vertex of the earlier face and its signed distance to the later face's plane, divided by its distance from the edge. Below −0.025 → **mountain** (light-tone highlight, alpha 0.9, 0.3 units); above +0.025 → **valley** (deep line, alpha 0.6); flat → nothing (same colour) or a soft seam (alpha 0.45, different colours).
4. **Details.** Ink dot eyes (0.75–0.85 units, white catch-light) and noses on top.
5. **Paper fibre.** A tileable 160 px fibre canvas is laid over the sprite with `source-atop` at 0.55.

**Baking.** Everything is baked once at `K = clamp(round(screenHeight/360·1.6), 3, 8)` px per unit into sprites anchored at the feet. The **left-facing version is rebuilt from mirrored geometry** (x → −x, then re-lit) — never flipped — so the light stays in the upper left. Each sprite also gets a baked shadow sprite.

**Per frame.** Ground chunks (cached) → shadows of all y-sorted objects → props/creatures/main character sorted by y → orbiting objects → projectiles → particles → numbers → ambient butterflies → screen light overlay. Native resolution, smoothing on.

## World and ground

- **Crease tessellation.** 40-unit squares, each split into four triangles (N, E, S, W) by both diagonals. Every triangle gets one region id from noise at its centroid — so every region border runs along crease lines and is straight.
- **Regions.** Water where `fbm(x/720) > 0.64` (kept 190 units away from the start); else a coloured sheet where `fbm(x/420) ≥ 0.5`, its colour from `fbm(x/1000)`: < 0.44 sage, < 0.5 mustard, < 0.56 coral, else teal; else the washi base.
- **Relief.** The sheet remembers its folds: each triangle's colour is multiplied by `1 + relief·amp` (amp 0.35–1.25 from slow noise). Every 4×4-cell panel between two major folds has its own pattern: **pyramids** (42 %, N +0.022, E −0.017, S −0.027, W +0.013), **waterbomb** (26 %, pyramids up/down in a checker), **pleats** (16 %, rows alternately +0.02 / −0.022) and **twist** (16 %, the tone set rotated per cell).
- **Layering.** Drawn bottom to top: water, base, sage, mustard, coral, teal. Before each layer, its union path is filled twice as a drop shadow onto the layers below: offset (+2.6, +3.2) at `rgba(84,60,58,.07)` and (+1.3, +1.6) at `.09`. The base sheet's shadow falls into the water as an inner shadow.
- **Hems.** Along every edge bordering a lower layer, a 2.4-unit strip inside the sheet in its colour mixed 55 % toward `#fffcf4` (the folded-over back), with a fold line `rgba(96,72,60,.22)` 0.4 and the paper edge `rgba(96,72,60,.34)` 0.45.
- **Water.** Clipped to the water triangles: chevron pleat rows (period 18, row height 11, zig-zag amplitude 3.4, each row phase-shifted by a hash). Per row: shaded slope `#6d8cc6` from the ridge to the valley at 45 % of the row, lit slope `#a9c3ea` down to the next ridge; valley line `rgba(44,64,122,.32)` 0.45, ridge line `rgba(255,255,255,.7)` 0.55. Small cream three-facet wave crests on a 52-unit grid.
- **Crease lines.** Pyramid diagonals are mountain folds: `rgba(255,253,246,.7)` 0.45 with a faint dark twin offset 0.5 units; down-pyramids and pleat valleys `rgba(98,76,60,.16)`; grid edges `rgba(98,76,60,.13)`. Not drawn on water.
- **Diagram notation.** Every 160 units a full-sheet fold: valley folds dashed `[5, 3.5]` in indigo `rgba(59,74,135,.28)`, mountain folds dash-dot `[7, 2.5, 1.2, 2.5]` in coral `rgba(201,91,71,.3)`, 0.6 units.
- **Fibre** over each chunk at 0.5.
- **Decals** (sparse — 13 % of a 21-unit jittered grid, never on water): folded grass (3 pointed strips, sage or pine), 4-petal flat folded flowers in blush / cream / mustard (scale 0.6–0.95), pairs of tiny two-tone scraps, and rare curved fold arrows (indigo, alpha 0.38).

## Characters

All models face +x; feet at (0, 0); y up is negative. Built from three primitives: **kite** (two triangles folded along an axis A–B, side corners P, Q), **folded strip** (legs, necks, tails; centre crease raised by z) and **fan** (triangles around one raised point — heads, bodies, crowns).

**Main character — the folded fox** (~26 × 36 units including ears and tail):
- **Tail:** a big coral kite from the hip (−2.4, −9.6) to the tip (−12.8, −22.6), sides (−10.6, −11.4) and (−4.6, −18.8); the outer 40 % is a cream kite (the tip).
- **Legs:** folded strips in paw ink (3.0 → 2.1 wide), the back one +1 tone, with a small triangular paw.
- **Kimono:** one indigo sheet folded down the middle: neck (0.8, −18.8, z 2.2), hem corners (−6.4, −6) and (6.8, −6.4), centre (0.9, −5.2, z 2.6) — the left half lit, the right half shaded. Mustard sash between 55 % and 70 % of the height, cream hem in the last 10 %, cream V collar, an indigo kite sleeve with a paw.
- **Ears:** two coral kites to (−4.6, −34) and (2.4, −34.8) with cream inner triangles (+1 tone).
- **Head:** six facets around a raised muzzle peak (2.2, −22.4, z 3.6): forehead, back of the head, cheek, top of the muzzle in coral; the two lower facets cream. Ink eye (4.7, −23.3) r 0.85 with a catch-light, ink nose at the snout tip (10.1, −21).
- **Poses:** idle, 4 walk frames (paw offsets ±4.8, lifts up to 1.8, 0.3–1.1 body bob, tail and sleeve swing), dash (legs spread ±6, ears laid back 2.6 units, tail raised).

**Small creature — jumping frog** (~18 × 14): a diamond body with an X of folds around a raised centre (0.2, −6.6, z 3.6) — the two upper facets in the creature colour, the two lower ones cream (belly); a big folded back thigh (+1 tone), a small front leg, two little pyramid eyes with ink pupils. Variants teal, sage, mustard. Frames: sit, crouch (body 1.4 lower), leap (legs extended 4 units).

**Fast creature — paper crane** (~26 × 21, hovering 8 units up): diamond body fan, tail strip to (−12.6, −17.4), neck strip to (9.4, −19.8) with a downward beak, far wing (+1 tone) and near wing as kites. Wing raise u ∈ {1, 0.45, −0.35, 0.45}; when u < 0.1 the wings show their cream backs. Blush.

**Large creature — folded boar** (~46 × 40): a plum body fan of 8 points around a raised flank point (−3, −21, z 6), a cream belly band, a 6-point head fan with a blush snout tip, a cream tusk, a mustard eye with an ink pupil, a plum ear with a cream inside, six mustard spike kites along the spine and four strip legs with mustard hooves (far pair +1 tone).

**States:** hit = cream `#fffaf0` silhouette at alpha `min(0.85, flash·1.2)` plus a 16 % squash; appear = a flat four-facet square of the creature's colour rotating 1.6 rad and shrinking while the creature unfolds upward (outBack on y-scale after 25 %); the crane drops in from 30 units while fading in; vanish (0.35 s) = flatten (y-scale → 0.15, x → 1.35) and fade with a fading cream flash. Hurt main character = cream flash + squash + wobble; blinking at 16 Hz during invulnerability.

## Props

- **Pines:** wood strip trunk (3.8 → 3.0), three kite tiers bottom-to-top (half-widths 15.5 / 11.7 / 7.9, heights 48–66), the centre crease raised (bottom centre z 5.5) so the left half is lit. Pine green or teal.
- **Round trees:** strip trunk + one branch; crown of 8 outer points (rx 15, ry 13.5, alternate points 92 %), 8 inner points at half radius (z 6.5) and a raised apex (z 9.5) = 24 facets. Coral, mustard, sage or teal.
- **Boulders:** a fan of 7 jittered points (radius 7–12) around a raised point at the upper left (z 0.7·r); one variant with a second small stone. Stone ramp.
- **Origami house:** front walls folded slightly at the middle in cream, side wall +1 tone, side roof +1 tone, front roof as one folded triangle (coral or indigo) with two cream squash-fold flap triangles; indigo door, mustard window.
- **Tulips:** three sage stems (two with folded leaves), cup-shaped heads (8-point fan) in coral / mustard / blush.
- **Pinwheel:** stick + head of four blades (coral / teal alternating, each with a cream inner flap), 12 baked rotation frames over 180°, turning at 9 frames/s.
- **Accordion screen:** six cream panels alternately tilted (z 0 / 2.4) so they alternate lit and shaded, with teal top bands.
- **On water:** paper boats (mustard / coral / cream: a folded sail over a two-half hull) and lotus (blush and cream petal kites on a notched sage pad) bob 0.8 units, rock ±0.05 rad, with an expanding cream ripple ellipse and a blue under-shadow.
- All land props cast the shared sheared shadow (blur 1.6, alpha 0.28, contact ellipse); pines, trees and houses turn 50 % translucent when the main character is behind them.

## Effects and particles

- **Paper-plane projectile:** a folded dart — cream wings with coral tips, a valley crease down the middle — baked at 16 angles (re-lit per angle), its own soft shadow 7 units below (squashed 0.55), two short pencil dashes `#7a6c74` behind.
- **Orbiting shuriken:** a two-tone origami star — four arms, each split into coral and teal halves around a raised centre — 8 rotation frames over 90°, 30 frames/s, over a plum blob.
- **Collectibles:** small = mustard lucky star (5 points, 10 facets, r 4.4, 6 rotation frames); large = teal folded crystal (4 facets) turning through 8 frames. Bob 3 ± 1.2 units over a plum blob; pop in with outBack.
- **Impact:** a crisp 4-point folded sparkle (cream, thin plum edge) at hit height plus 3 two-tone shards (gravity 260).
- **Unfolding burst:** 8–12 two-tone kite petals (creature colour + cream) shoot out and fold shut again (length `0.5 + 0.8·sin(πt)`), the flat square sheet of the creature tumbles up and away flipping between colour front and cream back, 8–16 confetti follow; the large creature adds a dash-dot crease ring in plum and a small screen shake.
- **Two-sided confetti:** flat triangles flipping with `cos(t·9)` — colour front when positive, cream back when negative — swaying sideways, gravity 50–120, drag 2.4–2.8.
- **Collect:** a small 4-point sparkle (cream-yellow, teal-white for large) and a few confetti for large collectibles.
- **Glow-up:** a dashed mustard crease ellipse opening to 40 units, two ground-level rings of petals (10 mustard/coral, 8 teal/cream) and 22 confetti drifting down from 30–46 units; the main character turns once like a card.
- **Dash:** folded paper strips (cream and indigo, light/shade halves) trailing behind, plus three cream afterimages at alpha 0.38/i.

## Atmosphere and lighting

- **One light**, L = normalize(−0.55, −0.45, 0.7), for models, ground relief and water pleats alike.
- **Cast shadows:** silhouette tinted `rgb(78,56,72)`, sheared x' = x − 0.62·y, y' = −0.36·y around the feet (the shadow falls to the lower right), blurred 1.1 units (props 1.6) at alpha 0.3 (props 0.28), plus a contact ellipse at 85 % of that alpha. Flying creatures: flattened (y' = 0.42·y), unsheared shadow offset by 0.45 × their height to the right, alpha 0.24.
- **Layer shadows** between ground sheets (see World).
- **Screen light** baked per size: linear gradient `rgba(255,250,235,.16)` (upper left) → clear at 45–70 % → `rgba(90,64,80,.14)` (lower right), plus a radial vignette to `rgba(96,70,70,.17)`.
- **Ambient life:** origami butterflies — two kite wings, flapping by horizontal scale 0.25–1 at 11 rad/s — on a 230-unit grid, 22 ± 4 units above a soft blob shadow.
- **Matte:** no glow, no bloom, no fog.

## UI

The HUD is folded paper — no rounded corners, hard offset shadows `rgba(82,60,72,.15)`, 1 px edges `rgba(120,96,80,.24)`.

- **Top bar:** a cream strip folded lengthwise (`linear-gradient(180deg, #fffaf1 0 48%, #ebe0cb 52%)`), fill = teal pleats `repeating-linear-gradient(118deg, #43ad9f 0 18px, #33998c 18px 36px)` with the same top/bottom fold overlay, value on a coral tab notched on the left.
- **Panel + bar:** heart icon (a faceted coral fold heart) + a 250×26 folded strip with coral pleats, value centred in Zen Maru Gothic 900 15 px with a cream halo.
- **Title / clock:** an envelope — cream `#fbf5e8`, a flap triangle (`clip-path: polygon(0 0, 100% 0, 50% 100%)`, two-tone halves) and diagonal crease lines; digits indigo Zen Maru 900 32 px, a Kalam caption in coral.
- **Counter:** a paper tab with a dog-eared top-right corner (`linear-gradient(225deg, transparent 14px, #fbf5e8 14px)` + a `#dccbae` fold triangle).
- **Caption bar:** a note folded down the middle (`#fcf7ec` / `#f1e7d4` halves), Kalam family in teal, name in coral Zen Maru 900.
- **Cards:** envelopes 232 × 300, slightly rotated (−1.5° / 1.2° / −0.6°), with a coloured flap triangle (coral / teal / mustard halves), bottom diagonal creases, a folded-square icon plate (`conic-gradient(from 45deg, #fffbf3 0 25%, #f2e8d4 0 50%, #e6d9c1 0 75%, #faf4e8 0)`), an indigo corner tab with the key number. They unfold from the top edge (`perspective(700px) rotateX(-88deg)` → 0) and straighten on hover.
- **Panel title:** a coral ribbon with V-notched ends and a horizontal centre fold.
- **Modal overlay:** indigo tint with a diagonal crease grid of light lines every 64 px.
- **Icons** are fold meshes drawn into the 48-unit icon box with 1.25-unit paper edges and 0.7-unit creases: fold heart, frog face, folded blade, lightning, three planes, waterbomb cube, shuriken, folded wing with speed strips, folded magnet, envelope with a heart.

```css
.bar { position: relative; width: 250px; height: 26px; background: linear-gradient(180deg, #fffaf1 0 50%, #e9ddc7 50% 100%);
  box-shadow: 0 0 0 1px rgba(120,96,80,.26), 3px 4px 0 rgba(82,60,72,.16); overflow: hidden; }
.bar-fill { height: 100%; box-shadow: 1px 0 0 #9b4136;
  background: linear-gradient(180deg, rgba(255,255,255,.2) 0 50%, rgba(90,24,14,.13) 50% 100%), repeating-linear-gradient(62deg, #ee8063 0 15px, #df6c52 15px 30px); }
.card { position: relative; isolation: isolate; width: 232px; min-height: 300px; background: linear-gradient(180deg, #fffaf1, #f5ecdb);
  box-shadow: 0 0 0 1px rgba(120,96,80,.24), 6px 8px 0 rgba(82,60,72,.16); transform: rotate(-1.5deg); }
.card::before { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 118px; z-index: -1;
  background: linear-gradient(90deg, #f29074 0 50%, #e2735a 50% 100%); clip-path: polygon(0 0, 100% 0, 50% 100%); }
```

## Motion and animation

- Main character: 4 walk frames per 4.6 animation units, `|sin|` step bob 1.1 units, 0.04 rad lean; idle breathing ±1.8 %; firing squashes 4 %.
- Frog: hop cycle at anim·0.5 — 20 % crouch (8 % squash), 58 % airborne (4.5-unit arc, −0.2 rad nose-up, +0.12 on the way down), land.
- Crane: 4 wing frames at 10/s, hover 8 ± 1.8 units, banking ±0.12 rad with its velocity.
- Boar: 4 walk frames at anim·0.32·4, ±0.03 rad sway, size jitter ±4 %.
- Appear 0.45 s (fold up from a sheet), vanish 0.35 s (flatten), hit flash decays at 7/s.
- Glow-up card turn: horizontal scale `|cos(2π·min(1, 2t))|`, mirrored sprite on the back half, lift 5 units.
- Numbers unfold from a crease in the first 14 % of their life (outBack on y-scale), fold away in the last 22 %.
- Props: pinwheel 9 frames/s; boats bob 0.8 units at 1.8 rad/s with a ripple every 2 s.
- UI: cards unfold 0.6 s, staggered 0.08 s; the title ribbon unfolds horizontally in 0.5 s.

## Do and don't

**Do**
- Model every asset as facets with a z height per vertex and let one shared light choose the tone.
- Draw shared edges as creases (bright mountain, dark valley); stroke only open edges as paper edges.
- Show the cream back of the paper wherever a sheet turns over.
- Keep the ground pale and structured by its crease pattern; put colour on the things standing on it.
- Let region borders follow crease lines — straight, hemmed and shadowed.
- Bake both facing directions from mirrored geometry so the light never flips.
- Lift every folded object with a soft plum shadow falling to the lower right.

**Don't**
- Don't use smooth gradients or airbrush shading — folds are straight.
- Don't add thick black outlines; edges are paper edges in the colour's own deep tone.
- Don't flip sprites with a negative scale.
- Don't cut torn or scissor-cut silhouettes — that is cut-paper, not origami.
- Don't fill the ground with saturated colour or dense decals.
- Don't make shadows black or grey, or point them in different directions.
- Don't add glow, bloom or neon — paper is matte.

## Implementation recipe

1. Define the ramps (4 hex values per paper colour) and derive the three line colours per ramp.
2. Write the fold mesh: de-duplicated points with z, `tri`, `quad`, `kite`, `strip`, `fan`, `dot`, an optional transform (`at(x, y, scale, rot)`).
3. Write `renderFold`: normals → tones → fill + seam stroke → edges classified as open / mountain / valley / seam → dots.
4. Write `bake(box, fn, mirror)` at K px per unit with fibre on top, and `castShadow(sprite, shx, shy, alpha, contact)` with a blur filter.
5. Author the main character facing +x as a function of a pose object; bake idle + walk frames + dash for both directions; same for each creature.
6. Ground per chunk: classify the four triangles of every 40-unit cell, colour with the panel's relief pattern, draw layers with offset shadows and hems, clip water and draw chevron pleats, then crease lines, diagram lines, fibre, sparse decals. Use a generator and cache the region per triangle.
7. Props: bake each variant (and mirrored copies) with shadows; place them per region on a jittered 60-unit grid, keeping land props off the water and boats/lotus fully on it.
8. Effects: bake planes at 16 angles, shuriken and stars as rotation frames; draw petals, confetti, strips and sheets as tiny two-tone paths per frame.
9. Add the screen light overlay and the butterflies; skin the HUD with the paper CSS.

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
Fold.prototype.strip = function (p0, p1, w0, w1, z, key) {                                             // leg / neck / tail
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
// for a shared edge p-q between face i (drawn now) and face j (drawn earlier), d = far vertex of face j:
function creaseKind(nI, P, D) {
  const s = (nI[0] * (D[0] - P[0]) + nI[1] * (D[1] - P[1]) + nI[2] * (D[2] - P[2])) / (Math.hypot(D[0] - P[0], D[1] - P[1]) + 1e-6);
  return Math.abs(s) < 0.025 ? 'flat' : s < 0 ? 'mountain' : 'valley';
}
// mountain: stroke ramp.light mixed 55 % with white, alpha .9, 0.3 units
// valley:   stroke ramp.deep  mixed 15 % with ink,   alpha .6, 0.3 units
// open edge (no neighbour): ramp.deep mixed 38 % with ink, 0.55 units
```

**Sheared soft cast shadow**

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

**Folded-wave water (chevron pleats)**

```js
function waves(ctx, x0, x1, y0, y1, hash) {
  const PW = 18, PH = 11, A = 3.4;
  const row = (r, dy) => { const off = hash(r) * PW, pts = []; for (let x = Math.floor((x0 + off) / (PW / 2)) * (PW / 2) - off; x <= x1 + PW; x += PW / 2) pts.push([x, r * PH + dy + (Math.round((x + off) / (PW / 2)) & 1 ? A : 0)]); return pts; };
  const band = (a, b, col) => { ctx.fillStyle = col; ctx.beginPath(); a.forEach((p) => ctx.lineTo(...p)); b.slice().reverse().forEach((p) => ctx.lineTo(...p)); ctx.fill(); };
  for (let r = Math.floor(y0 / PH) - 1; r <= y1 / PH + 1; r++) {
    const top = row(r, 0), mid = row(r, PH * 0.45), bot = row(r + 1, 0);
    band(top, mid, '#6d8cc6'); band(mid, bot, '#a9c3ea');                       // shaded slope, lit slope
    ctx.strokeStyle = 'rgba(44,64,122,.32)'; ctx.lineWidth = 0.45; ctx.beginPath(); mid.forEach((p) => ctx.lineTo(...p)); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 0.55; ctx.beginPath(); top.forEach((p) => ctx.lineTo(...p)); ctx.stroke();
  }
}
```

**Two-sided confetti**

```js
function confetti(ctx, x, y, size, rot, t, seed, ramp, cream) {
  const flip = Math.cos(t * 9 + seed * 30), f = Math.abs(flip) < 0.15 ? 0.15 : flip;
  const co = Math.cos(rot) * size, si = Math.sin(rot) * size;
  ctx.save(); ctx.transform(co, si, -si * f, co * f, x, y);
  ctx.fillStyle = flip > 0 ? ramp[flip > 0.6 ? 0 : 1] : cream[flip < -0.6 ? 0 : 2];  // colour front, cream back
  ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(0.95, 0.7); ctx.lineTo(-0.95, 0.7); ctx.closePath(); ctx.fill();
  ctx.restore();
}
```

## Adapting it to your project

- **Keep fixed:** the light vector, 4-step ramps, automatic mountain/valley creases, cream back side, mirrored re-baking, plum shadows to the lower right, a pale crease-pattern ground, the paper-tab / envelope UI.
- **May change:** the palette — keep a pale ground (≥ 85 % lightness), mid-value saturated ramps for actors, and a cream back-side ramp. A winter theme: base `#eef2f5`, sheets in ice blue and lilac, indigo and coral actors stay.
- **New characters:** start from kites, strips and fans; decide one raised point per body part — that is where the light breaks. Keep the main character ~26 × 36 units with a big readable silhouette (ears, tail), small creatures 14–20 units, large creatures ~2.5× the main character. Bake every pose twice.
- **Mixing elements:** the characters and props depend only on the light vector and the shadow rule — on another style's ground, keep the plum sheared shadows. The crease-pattern ground works under other characters if their shadows are soft and fall to the lower right.
- **Other project types:** the crease grid doubles as a board for puzzles or tactics (snap to the 40-unit cells); menus can be built from the envelope cards and paper tabs alone; for side views, author meshes in profile — the shading still works because it only needs z.
- **Other resolutions:** only K changes (`clamp(round(H/360·1.6), 3, 8)`); lines are in world units and scale with it.

## Performance notes

- Init bakes roughly 150 sprites plus their blurred shadows (main character 6 poses × 2, frogs 3 × 3 × 2, crane 4 × 2, boar 4 × 2, 19 props + mirrored copies, 12 pinwheel frames, 16 planes, 8 shuriken, 6 stars, 8 crystals, butterflies) in about 150–250 ms. Hit flashes are tinted lazily and cached on the sprite.
- Per frame: one shadow + one sprite blit per object, tiny particle paths, one full-screen overlay — about 1 ms of script with 100+ creatures on screen.
- Ground chunks (256 units at ≤ 2.5 px/unit) are vector-drawn by a generator that yields after every layer, the crease pass and every 16 decals (~4 ms per chunk); region lookups per triangle are cached.
- `ctx.filter` blur is used only while baking shadows; ground shadows are two offset fills instead of a blur so chunk borders stay seamless.
- The starter kit caches its sprites and the ground canvas and redraws its preview in a few milliseconds.

## Copy-paste prompt

```text
Use the Origami Fold art style for my project:
- Canvas 2D, no image assets. Everything is a "fold mesh": triangles in screen space with a z height per vertex,
  shared points de-duplicated so faces share edges. Bake meshes once into sprites (K px per world unit, 360 units = screen height).
- One light from the upper left, L = normalize(-0.55,-0.45,0.7). Facet tone from d = n·L: >.8 light, >.55 base, >.3 shade, else deep,
  using 4-step ramps: coral #f7a283/#e8755b/#c95b47/#9b4136, indigo #7488c9/#4f62a6/#3b4a87/#283462, teal #63c2b3/#35a194/#277f76/#1a5b56,
  mustard #f8d372/#e6ae42/#c68c2d/#936624, blush #f9c0bd/#ee9597/#cd7279/#9d525c, cream back side #fffbf3/#f3e9d6/#dccbae/#b5a083.
- Shared edges: mountain fold = thin bright line (light tone + 55 % white), valley fold = thin dark line; open edges = deep-tone paper edge.
- Paper is two-sided: hems, bellies, inner ears, wing backs and confetti show the cream back.
- Mirror by rebuilding geometry (x -> -x) and re-lighting, never by flipping the image.
- Main character: a coral origami fox in an indigo kimono with a mustard sash, cream hem, dark paws, kite ears and a kite tail (~26x36 units).
  Creatures: teal/sage/mustard jumping frogs, blush paper cranes hovering 8 units up, a plum folded boar with a mustard spiked mane.
- Ground: a washi sheet #f4eee1 with a 40-unit crease tessellation (squares + diagonals, faint pyramid relief), pastel sheets
  (#d5e1c0 #f2dca6 #f3cebe #c3dfd6) laid on top along crease lines with cream hems and offset drop shadows, sunken water #88a8d8 as chevron pleats,
  major folds every 160 units in diagram notation (dashed valley, dash-dot mountain).
- Shadows: silhouette tinted rgb(78,56,72), sheared to the lower right, blurred, alpha ~0.3. Paper fibre texture on everything.
- Effects: paper-plane projectiles, two-tone shuriken, lucky stars, unfolding petal bursts, tumbling sheets, two-sided confetti.
- UI: folded paper strips with pleated fills, envelope panels with flaps, dog-eared tabs, envelope cards that unfold; fonts Zen Maru Gothic 900,
  M PLUS Rounded 1c, Kalam for handwritten notes.
```
