# Cross-Stitch Sampler — Game Art Style Spec

> The whole game is a living cross-stitch sampler on Aida cloth: every cell is a real thread X, contours are backstitched.

The world is a piece of beige Aida fabric with visible holes. Everything that is not bare cloth is embroidered on a 3.2-unit stitch grid: characters and props are small cell grids in which every cell is a two-stroke thread cross with its own shadow, sheen and ply twist, outlined with a dark backstitch. Flowers are French knots and lazy daisies, water is satin stitch, pickups are glass beads and sewing buttons, enemies are stitched into existence by a darting needle and unravel into loose threads when they die. It reads like grandma's Halloween sampler come to life — warm, cosy, tactile. The reference implementation is the game *Jack vs. the Turnip Ancestors* (pumpkin-head hero, turnip creepers, ghosts, a turnip colossus); everything below is written so you can use it for any game.

## At a glance

| | |
| --- | --- |
| Family | Textile · Cross-stitch embroidery |
| Mood | cozy, handmade, nostalgic, whimsical, autumnal |
| Best for | top-down survivors/arena games, cozy farming or adventure, grid puzzle/board games, seasonal games |
| Renderer | Canvas 2D, fully procedural, no image assets |
| Pixel art | No (`pixelArt: false`) — native resolution, but all art is quantised to a 3.2-unit stitch grid |
| Difficulty | 3/10 — works like pixel art on a coarse grid; new motifs are simple stitch patterns |
| Fonts | Grandstander (600–900) for numbers/titles, Mali (500–700) for text |
| Key colours | Aida `#dccaa5`, outline `#2b1d1d`, pumpkin `#e2701f`, leaf `#55843a`, turnip `#83479a`, pond `#43729e`, rust `#a24f2a` |

## When to use it

- **Good fits:** top-down games with small, iconic actors; anything cosy, seasonal, folk-tale or "made by grandma"; games on a grid (tactics, puzzles, roguelikes) where the stitch grid doubles as the game grid; crowds of enemies (each type is a strong colour block).
- **Also good:** menus and HUDs — fabric tags, embroidery hoops and stitched titles are very recognisable.
- **Bad fits:** smooth rotation or squash-and-stretch animation (motifs only snap and swap frames); realistic or gritty tone; perspective/3D cameras; bosses that need fine facial detail (a 15×17-cell brute is about the limit of readability); very fast games where the 3.2-unit steppy motion would feel jittery.

## Color palette

Every colour is a named thread with a one-letter code (used directly in the motif strings). The real hex values:

| Swatch | Code | Hex | Role |
| --- | --- | --- | --- |
| Aida cloth | — | `#dccaa5` | Fabric base (renderer clear colour `#d9c8a4`), ~50 % of the screen |
| Backstitch black | K | `#2b1d1d` | Outline thread of characters and props |
| Pumpkin dark / rust / orange / light | Q q O o | `#6c2817` `#a4401b` `#e2701f` `#f59b40` | Hero head, pumpkins, autumn trees |
| Candle yellow / pale | y Y | `#ffd23c` `#fff2a6` | Carved faces, eyes, glowing bits |
| Greens dark→light | G g l L | `#2d5230` `#55843a` `#8daf55` `#b3c07c` | Meadow stitches, stems, pines, crowns |
| Browns | B b k | `#45291c` `#7c4a2b` `#c79a66` | Trunks, roots, feet, path border |
| Purples | P p m | `#4f2560` `#83479a` `#bc8ac7` | Small enemy body |
| Creams | c C w | `#f3e6bf` `#d8bc7f` `#fbf8f0` | Enemy faces, seeds, highlights |
| Ghost blues | i I j | `#d5e6f2` `#97b6d4` `#3c5078` | Fast spirit enemy (j = its outline + eyes) |
| Reds | r R E | `#c3312b` `#7a1c24` `#e65f3e` | Scarf, hearts, mushrooms, crits |
| Greys | a A e | `#9f9a93` `#5f5a58` `#d0cbc2` | Gravestones, metal |
| Cloak | d D | `#1d3f55` `#2e6479` | Hero body |
| Field ochre | f F h t | `#c99a3e` `#a6782e` `#e3b24d` `#f2d37c` | Crop rows, gold trees, gold accents |
| Rust forest | x X z | `#a24f2a` `#84391f` `#6b3b24` | Forest floor fill |
| Pond | N n u W | `#2b4b70` `#43729e` `#7faacf` `#bcd6ea` | Satin water, deep → shallow |
| Flowers | s v V | `#e58ca2` `#7b59a8` `#a98bd0` | French knots, daisies |
| Shadow | — | `#28160c` / `rgba(40,22,10,a)` | Every shadow |

**Palette rules**

- Shading never invents colours: a darker area switches to the next thread in the ramp (e.g. `Q → q → O → o`).
- Each stitch derives four tones from its thread: underlay `colour × 0.64`, underside `colour × 0.7`, top ply `colour`, sheen `mix(colour, white, 0.5)` at α 0.75. Hit flash = `mix(colour, white, 0.6)`.
- Bare fabric dominates. Meadow is stitched at only 3–40 % density; forests and ponds are dense but bounded by backstitch.
- Shadows are always warm brown `rgba(40,22,10,a)`; never black, never grey.
- One hue family per actor type (hero orange + navy, small enemy purple + cream, spirit pale blue, brute purple over brown) so crowds stay readable on the beige cloth.
- Gradients only on round "hardware": French knots, beads, buttons, sequins, needles, glows. Never inside stitched areas.

## Typography

- **Grandstander** — weights 600, 700, 800, 900. Chunky rounded display face for the timer, numbers, card names and big titles. <https://fonts.google.com/specimen/Grandstander>
- **Mali** — weights 500, 600, 700. Friendly handwriting for labels, descriptions, hints. <https://fonts.google.com/specimen/Mali>

Google Fonts families as loaded by the module: `Grandstander:wght@600;700;800;900`, `Mali:wght@500;600;700`.

```css
body { font-family: 'Mali', 'Grandstander', sans-serif; color: #4a2c1e; }
.timer { font: 900 35px/1 'Grandstander', sans-serif; letter-spacing: 1px; color: #a3302a;
  text-shadow: 0 1px 0 rgba(255,250,235,.9), 0 2px 0 rgba(90,30,15,.25); }
.value { font: 800 17px 'Grandstander', sans-serif; color: #7a1c24; text-shadow: 0 1px 0 rgba(255,255,255,.6); }
.label { font: 700 11px 'Mali', sans-serif; color: #6a3a1e; }
```

Text effects: a 1 px cream "embossed" highlight shadow below dark text on fabric; big titles ("Level up!", "Game over", "Pause") are filled with a tiled cross-stitch texture using `background-clip: text; color: transparent` plus `filter: drop-shadow(0 3px 0 #3a1a0c)`. In-world damage numbers are not a font at all: they are 3×5-cell stitched digit motifs.

## Rendering technique

World units: the camera shows 360 units vertically. One stitch cell `C = 3.2` units; motif sprites are baked at `CP = 8` px per cell (so `K = C / CP = 0.4` units per sprite px), with a 2 px margin around each stitch sprite (`SM`) and 5 px around each motif (`MP`).

1. **Init — fabric:** bake a 16×16-hole Aida tile (128 px). Per pixel: hole corners ×0.74, hole edges ×0.93, inner 2×2 weave checker ×1.03 / ×0.985, plus ±3.5 % row and column slub noise and ±3 % grain on base `#dccaa5`. Add 22 long 1-px slub threads (`rgba(255,250,235,0.16)` or `rgba(110,80,40,0.08)`), wrapped so the tile stays seamless.
2. **Init — stitches:** for every thread colour bake 3 jittered variants of a full cross (`makeStitch`): two diagonal strokes (`/` first, then `\` on top), each drawn as shadow (`rgba(40,22,10,.36)`, width 3.1, offset +0.45/+0.85), dark body (×0.7, width 2.9), top ply (width 2.0, nudged −0.22 up), sheen (mix white 0.5, α 0.75, width 0.7, from 18 % to 78 % of the stroke) and three twist ticks (×0.62, α 0.45, width 0.55). Endpoints jitter ±0.25 px. Half stitches use only the `/` stroke.
3. **Init — motifs:** every character frame, prop, icon and digit is a cell grid → `renderMotif`: blurred shadow (`blur(1.1px)`, α 0.42, offset 1.4/2.4 px) → underlay rect per cell (`colour × 0.64`, inset 0.6 px, so fabric barely shows) → one stitch variant per cell (`hash(x, y) % 3`) → backstitch outline along every silhouette edge (2.2 px) → inner contours (1.7 px) → free backstitch segments (stems, brows, mouths, 1.4–2.4 px).
4. **Per chunk (256 units = 80×80 cells), built incrementally as a generator:** fabric pattern fill → classify every cell (meadow / forest / field / pond / path) → lighten path cells → merge stitched cells into per-colour row runs in a `Path2D` and fill each with a seamless 4×4-stitch pattern (`createPattern` with `setTransform(DOMMatrix([K,0,0,K,0,0]))`) → satin-stitch pond → decals → backstitched region borders → soft cloth-fold overlay.
5. **Per frame, world space:** ground chunks → hero light pool (additive) → gems → shadows → y-sorted props/enemies/hero (all snapped to the cell grid via `blitCell`) → orbiting lanterns → projectiles → particles → stitched damage numbers.
6. **Screen space:** brown radial vignette sprite stretched over the screen; with run progress a `multiply` tint of `#2a2050` up to α 0.16.
7. **Grid snapping:** sprite origins are always whole cells: `gx = round(x / C − w / 2)`, `gy = round(y / C) − h`, drawn at `(gx·C − MP·K, gy·C − MP·K)`. Only particles, beads and projectiles move freely.

## Background and ground

The ground is an endless sampler. Noise fields (domain-warped fbm) decide the material per cell:

- **Path** (winding, half-width 7.5–12.5 units, from the zero line of warped Perlin noise): no stitches at all, just the cloth lightened with `rgba(255,250,236,0.42)`, edged on both sides with a `#7c4a2b` backstitch — the classic "unstitched linen road".
- **Meadow** (default): sparse full crosses in `L`/`l`/`g` (dry patches: `t`/`L`/`l`). Density `0.03 + 0.24·smoothstep(0.36, 0.78, fbm)` plus up to `+0.36` near forests; a cell is stitched when `bayer8·0.55 + hash·0.45 < density`, so stitches cluster organically.
- **Forest** (warped fbm > 0.58): every cell stitched in rust `z`/`X`/`x` (tone from fbm + Bayer), 1.8 % gold `h` and 1.6 % orange `o` accents, plus leaf motifs, mushrooms and brown knot pairs. Border: `#45291c` backstitch.
- **Fields** (cell-aligned rectangles, 160–320 × 110–220 units): rows of half stitches `/` in crop colours; every 4th row empty; rutabaga fields get purple knots; optional fences and a scarecrow.
- **Pond** (warped fbm > 0.66): satin stitch — blocks of up to 3 cells in a brick pattern (block start offset `j % 3`), each block 3 slanted parallel threads; tone `W/u/n/N` by depth; lily pads and white ripple threads. Border: navy `#2b4b70` backstitch.
- **Decals** on a 21-unit jittered grid (only on cells whose 4 neighbours share the material): French-knot flower clusters (3–5 knots in `s w h V m E` with a yellow centre and two green stem threads), lazy daisies (5 looped petals + tack stitches), three-stitch grass tufts from one hole, sequins, rows of three beads, mushrooms.
- **Cloth light**: one RGBA value per cell, smoothed: folds `(perlin(u/1100, (v−7)/260) − perlin(u/1100, (v+7)/260))·1.3` on a rotated axis, warm white `(255,248,228)` for positive, brown `(62,38,22)` for negative, α ≤ 0.15.

## Characters

The hero is a **9 × 11-cell** grid (28.8 × 35.2 units), facing right; left is a mirrored grid (free backstitch segments are mirrored too):

```
....gG...    leaf stem (g/G) + a curly backstitch stem segment
..qoOOq..
.qoOOOOq.    pumpkin head: ramp q/o/O, lit upper-left
qoOYyOYyq    carved eyes Y/y
qoOOOOOOq
qOyYyYyYq    carved grin
.qOyOyOq.
..RrrrR..    red scarf
.rdDDDdk.    navy cloak d/D, scarf end r, hand k   (frame 0)
..dDDDd..
..BB.BB..    boots
```

- Frames 1 and 2 only change the last three rows (hand swings, legs apart/together). Walk sequence `1,0,2,0`.
- Outline `K #2b1d1d` at 2.2 px; inner contour `Q #6c2817` at 1.7 px around the yellow carving (`inner: { keys: 'yY', k: 'Q' }`) so the face reads as cut into the shell.
- Extras: a white-flash copy per frame (`mix(c, white, 0.6)`, no shadow) for hurt; an additive candle glow (`rgb(255,150,60)` radial, 24×18 units, α `0.22 + 0.07 sin 9t + 0.05 sin 23t`) over the face; a 26-unit soft brown ellipse shadow under the feet; a large warm light pool (80×52 units, α ~0.5) on the ground.
- Rules: big head, 2–3-row body, 1-row feet; at most 4 threads per material; the brightest thread (yellow) is reserved for the face.

## Enemies and props

- **Small melee enemy** (turnip creeper, 7 × 8 cells): rows 0–1 leaf crown (3 frames: leaves wiggle), purple body `P/p/m` with yellow eyes, cream face `C/c`, row 7 legs `k` (3 frames). Backstitch brows (`K`, 1.6) and a zig-zag mouth (`R`). A second variant is made by **remapping** threads (`p→#a8487a, P→#6c2550, m→#d888b0`) — cheap variety.
- **Fast enemy** (ghost, 8 × 8): `i/w/I` body with `j #3c5078` eyes and outline (no black outline → lighter, airy), drawn at α 0.9, hovers 1–2 cells above its shadow, 3 tail frames at 5 fps, half-strength shadow.
- **Brute** (colossus, 15 × 17, procedural): a sphere lit by `l = −0.5nx − 0.55ny + 0.62nz + bayer4 jitter`, purple ramp `P/p/m` on the upper part and brown `z/b/k` below a wavy line, leaf crown, 2-cell yellow eyes, a yellow/red tooth row, root arms that rise per frame, backstitch brows, cracks and a smile. Additive glow over the face.
- **Spawn/death:** 6 partial masks per actor (cells sorted bottom-up with random jitter), rendered without outline and with shadow α 0.25. Spawn shows them in order while a silver needle with red thread darts across the current row; death plays them in reverse while fading.
- **Props** (y-sorted, snapped to cells, sort key = foot row): round autumn trees 13 × 16 (lit-sphere crown with 4-thread ramps `Q q O o`, `R r E o`, `F f h t`, `X q O h`; stitched trunk `k/b/z`), pines 11 × 17 (tiered, `l/g/G` by side), bare trees (pure backstitch branches 2.4 px + a crow), pumpkin pairs, gravestones 5 × 7, scarecrows, a little house, fences (rails as 2.6-px backstitch). Trees turn 55 % transparent when the hero walks behind them.
- Readability: every actor and prop has the dark outline + blurred drop shadow; ground has neither, so actors always pop off the cloth.

## Effects and particles

Everything is an embroidery material:

- **Projectile:** a cream seed (quadratic shape, gradient `#fffaf0 → #f3e6bf → #c9a86a`, outline `#8a6a3a`, 4 rib lines) with a 3-dash running-stitch trail in `rgba(255,214,120,0.35–0.75)`; sprite 56×20 px drawn at 14×5 units, rotated to velocity.
- **Hit:** cream French knot pop (life 0.18 s) + 60 % chance of one loose thread snippet; white-flash overlay on the sprite.
- **Loose thread snippet:** a 6-point random curl drawn with `quadraticCurveTo` in 4 passes (shadow 2.6, dark 2.4, body 1.4, sheen 0.5 px), 8 units, spinning, gravity 120–160.
- **Kill:** 7 threads (brute 16) in the enemy's colours, 2 beads (ghost 1, brute 5), brute drops a 4-hole button, and a dashed ring (`setLineDash([1.6, 1.2])`, width 0.9, cream or `#97b6d4`) expands 3→11 units (brute 6→22) with ease-out-quad over 0.3 s.
- **Pickups:** small = orange glass bead `#f39a2e` (radial gradient, dark hole, white glint), 5.4 units, additive glow 13 units, bob 0.8; big = gold sewing button `#e3b24d` with cream cross thread, 9 units, rocking ±0.3 rad. Pickup = 1–5 cross-stitch sparks (a stitch sprite at 2.4 units).
- **Orbiting weapon:** a 5×5-cell stitched lantern with a 28-unit additive glow.
- **Dash:** 2 ghost copies of the hero at α 0.22/k + soft fluff glows.
- **Level-up:** two dashed ellipses (gold `#e3b24d`, red `#c3312b`, dash 2.4/1.6) growing from 8 to 54 units, 16 sparks in a ring, 4 buttons.
- **Hurt / death of hero:** orange threads (`#e2701f`, `#f59b40`), red dashed ring; on death 20 threads in orange/navy/red.
- **Damage numbers:** stitched 3×5 digits (white `w` + black outline; crits `y` + `R` outline), cell size 1.3 units (crit 1.8), pop ×1.4 at spawn.

## Lighting, shadows and post-processing

- Light comes from the **upper left** everywhere: stitch shadows fall down-right, sheen lines sit up-left, sphere-shaded motifs use `(−0.5, −0.6, 0.62)`.
- **Motif drop shadow:** silhouette in `#28160c`, `blur(1.1px)`, α 0.42, offset (1.4, 2.4) px — the motif looks slightly raised off the cloth.
- **Ground shadows** under actors: a pre-baked radial ellipse (`rgba(50,28,12,.55 → .25 → 0)`), width 26 (hero), 20 (small), 16 at α 0.5 (ghost), 46 (brute), 26–34 under trees.
- **Coloured light:** additive (`lighter`) radial glow sprites in warm orange/yellow: hero pool `rgb(255,170,70)` α 0.32, face/brute glow `rgb(255,150,60)` α 0.5, gem/lantern glows `rgb(255,190–205,80–110)`. All flicker with summed sines.
- **Vignette:** 320×180 radial gradient `rgba(60,30,12,0) → 0.10 at 70 % → rgba(40,18,8,0.42)`, stretched over the screen.
- **Night grading:** `multiply` fill `#2a2050` at α `min(0.16, progress × 0.2)` — the cloth gets dusky towards the end, but stays readable.

## UI and HUD

HUD elements are sewn objects: fabric tags with a satin-stitched border and a dashed running-stitch line, bars filled with cross-stitch tiles, the timer is a wooden embroidery hoop with a metal clasp. Backgrounds use the same Aida generator rendered to data URLs (`#efe3c4` light, `#ddcba4` darker), and 8×8 px stitch tiles (one stitch on fabric) for bar fills. Icons are 12×12-cell stitched motifs. Tag border colours: red `#c0442c/#8c2a1c/#e0704c` (health), purple `#6e3a80/#4c2160/#9a62ac` (score), green `#5c8a3c/#3a6028/#86b45a` (info); level-up cards in orange, purple and green, tilting −1.5° on hover.

```css
.tag { border: 5px solid transparent; border-radius: 12px; padding: 7px 16px 7px 10px;
  background: url(aida.png) padding-box,
    repeating-linear-gradient(-52deg, #c0442c 0 2px, #8c2a1c 2px 3px, #e0704c 3px 4.5px) border-box;
  outline: 2px dashed rgba(124,29,36,.55); outline-offset: -10px;
  box-shadow: 0 4px 0 rgba(50,26,10,.35), 0 6px 14px rgba(20,10,4,.35);
  font-family: 'Mali', 'Grandstander', sans-serif; color: #4a2c1e; }
.bar { width: 216px; height: 18px; border-radius: 3px; background: url(aida-dark.png) 0 0/32px 32px;
  box-shadow: inset 0 0 0 1px rgba(110,70,30,.45), inset 0 2px 3px rgba(60,30,10,.25); }
.bar-fill { height: 100%; background: url(stitch-red.png) 0 1px/8px 8px; }
.hoop { width: 138px; height: 138px; border-radius: 50%; border: 10px solid transparent;
  background: radial-gradient(circle, rgba(255,250,235,.5) 0 40%, rgba(120,80,40,.18) 100%) padding-box,
    url(aida.png) padding-box,
    repeating-radial-gradient(circle, #c98f55 0 2px, #b47842 2px 3.5px, #d9a46a 3.5px 5px) border-box;
  box-shadow: inset 0 0 0 1px #7a4c26, inset 0 5px 10px rgba(70,40,15,.35), 0 0 0 2px #6b4221,
    0 0 0 5px #d39c60, 0 0 0 7px #6b4221, 0 7px 0 rgba(40,20,8,.3), 0 8px 18px rgba(20,10,4,.4); }
.hoop::after { content: ''; position: absolute; inset: 4px; border-radius: 50%; border: 2px dashed rgba(124,29,36,.5); }
.stitched-title { font: 900 70px 'Grandstander', sans-serif; letter-spacing: 2px;
  background: url(stitch-orange.png) 0 0/8px 8px; -webkit-background-clip: text; background-clip: text;
  color: transparent; filter: drop-shadow(0 3px 0 #3a1a0c) drop-shadow(0 0 1px #3a1a0c); }
.overlay { background: radial-gradient(ellipse at 50% 45%, rgba(80,45,20,.3), rgba(28,14,8,.82)); }
```

Generate `aida.png` with the fabric generator (4×4 holes of 8 px, base `#efe3c4`) and `stitch-*.png` as an 8×8 canvas with a darkened underlay and one `makeStitch` sprite.

## Motion and animation

- **Steppy by design:** actors snap to the 3.2-unit grid; they move in whole stitches.
- **Hero:** 3 frames, sequence `1,0,2,0`, frame = `floor(distanceWalked / 5) & 3`; idle frame 0. Only the bottom rows change.
- **Small enemy:** sequence `0,1,0,2`, frame = `floor(anim·1.6 + seed·4) & 3` with `anim = distance / 10`. **Spirit:** `floor(t·5 + seed·7) % 3`, hover 1–2 cells toggled by `sin(2.2t + seed·9) > 0.3`.
- **Spawn:** 6 stitching steps (about 1 s), needle oscillates `sin(30t)` across the motif width. **Death:** reverse steps, α `min(1, progress·3)`.
- **Hit flash:** white-flash copy overlaid at α `min(1, flash·1.3)·0.9`. **I-frames:** blink at 18 Hz to α 0.45.
- **Idle life:** glows flicker (`0.5 + 0.06 sin 7.3t + 0.04 sin 13.1t`), gems bob 0.8 units at 3 rad/s, lanterns bob 0.8 at 4 rad/s, big buttons rock `0.3 sin 2t`.
- **Particles** obey gravity (120–220) and drag (1.2–3), threads spin (`vr` ±4–5 rad/s), lifetimes 0.2–1.6 s, alpha `min(1, life·2.2)`.

## Do and don't

**Do**

- Build every sprite from a cell grid of thread codes; render each cell as a real thread X with underside, top ply, sheen and twist.
- Keep the Aida holes visible everywhere and aligned with the stitch grid (cells at multiples of 3.2 units).
- Outline silhouettes and region borders with backstitch segments that stop just short of each hole.
- Use embroidery vocabulary for every effect: French knots, beads, buttons, sequins, satin stitch, running stitch, loose threads, needles, hoops.
- Leave lots of bare fabric; suggest meadow and transitions with dithered stitch density.
- Bake stitch variants and ground chunks once; fill large areas with seamless stitch patterns.

**Don't**

- Don't use flat filled squares — it reads as pixel art, not embroidery.
- Don't rotate, scale or sub-cell-offset stitched motifs (only round hardware and projectiles rotate).
- Don't use black/grey shadows, vector ink outlines or neon colours.
- Don't stitch the whole ground densely; the fabric must breathe.
- Don't fade enemies out; unravel them stitch by stitch and leave threads.
- Don't exceed 3–4 threads per material or invent intermediate colours.

## Implementation recipe

1. Set up world units: 360 visible vertically; constants `C = 3.2`, `CP = 8`, `K = 0.4`, `SM = 2`, `MP = 5`. Smoothing stays on.
2. Define the thread palette as a map of single letters → hex (table above). Add new threads in ramps of 3–4.
3. Write the fabric generator (hole grid + weave + slubs) and bake a 16×16-hole tile.
4. Write `makeStitch(rgb, variant)` (two strokes × 5 passes) and cache 3 variants per colour; write `stitchPattern(code)` (seamless 4×4 tile).
5. Write `threadSegs(ctx, segs, rgb, width, gap)` — the 4-pass backstitch used for every line in the game.
6. Write `motif(rows, outline, segs)` + `renderMotif(m, opts)` (shadow, underlay, stitches, outline, inner contour, free segments) + `mirror(m)` + `blitCell(ctx, sprite, gx, gy)`.
7. Design actors as string grids (hero 9×11, small enemy ~7×8, fast enemy ~8×8, brute ~15×17); 3 frames that only change legs/crown/tail; bake right, left, flash and 5 partial spawn masks.
8. Build the ground per chunk: fabric fill → classify cells → bare path → per-colour run paths filled with stitch patterns → satin water → knot/daisy/tuft decals → backstitched borders → cloth folds. Spread it over frames (generator) if the world is infinite.
9. Props: more string grids or procedural lit-sphere crowns quantised to thread ramps; y-sort them with actors; snap to cells.
10. Effects: knots, beads, buttons, thread curls, dashed rings, needle, seed — all baked as small sprites at init.
11. Light: warm additive glow sprites (hero pool, faces, pickups), soft brown ellipse shadows, brown vignette, optional multiply night tint.
12. HUD: fabric tags with satin borders and dashed stitch lines, stitched bar fills, embroidery-hoop timer, Grandstander + Mali, stitched-texture titles.

## Code

The core techniques, standalone. The full working kit is [`starter.js`](starter.js) (palette, fabric, stitches, backstitch, motif renderer, hero, enemies, stitched ground, beads, glows, preview scene); the complete reference module is [`../../js/styles/crossstitch.js`](../../js/styles/crossstitch.js).

Shared helpers used below:

```js
const C = 3.2, CP = 8, K = C / CP, SM = 2, MP = 5, WHITE = [255, 255, 255];
const lerp = (a, b, t) => a + (b - a) * t;
const mul = (c, f) => c.map((v) => Math.min(255, v * f));
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const rgb = (c, a) => (a === undefined ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`);
function rng(seed) { let a = seed >>> 0; return { next() { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; } }; }
function hashInt(x, y, s) { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return h >>> 0; }
```

**1. One cross stitch** — the atom of the style (bake 3 variants per colour):

```js
function makeStitch(c3, v) {
  const c = document.createElement('canvas'); c.width = c.height = CP + SM * 2;
  const ctx = c.getContext('2d'), r = rng(v * 977 + c3[0] * 3 + c3[1] * 7 + c3[2] * 11), j = () => (r.next() - 0.5) * 0.5;
  const a = SM + 0.85, b = SM + CP - 0.85, base = mul(c3, 0.95 + r.next() * 0.1);
  const line = (x0, y0, x1, y1) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };
  ctx.lineCap = 'round';
  [[a + j(), b + j(), b + j(), a + j(), -1], [a + j(), a + j(), b + j(), b + j(), 1]].forEach(([x0, y0, x1, y1, dir], n) => {
    ctx.strokeStyle = n ? 'rgba(40,22,10,0.30)' : 'rgba(40,22,10,0.36)'; ctx.lineWidth = 3.1;
    line(x0 + 0.45, y0 + 0.85, x1 + 0.45, y1 + 0.85);                          // shadow
    ctx.strokeStyle = rgb(mul(base, 0.7)); ctx.lineWidth = 2.9; line(x0, y0, x1, y1); // underside
    const px = dir < 0 ? -0.18 : 0.18;
    ctx.strokeStyle = rgb(base); ctx.lineWidth = 2.0; line(x0 + px, y0 - 0.22, x1 + px, y1 - 0.22); // top ply
    const hx = dir < 0 ? -0.55 : 0.5;
    ctx.strokeStyle = rgb(mix(base, WHITE, 0.5), 0.75); ctx.lineWidth = 0.7;    // sheen
    line(lerp(x0, x1, 0.18) + hx, lerp(y0, y1, 0.18) - 0.6, lerp(x0, x1, 0.78) + hx, lerp(y0, y1, 0.78) - 0.6);
    ctx.strokeStyle = rgb(mul(base, 0.62), 0.45); ctx.lineWidth = 0.55;         // two-ply twist ticks
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
    for (const t of [0.3, 0.52, 0.74]) {
      const cx = x0 + dx * t, cy = y0 + dy * t;
      line(cx + uy * 0.9 - ux * 0.5, cy - ux * 0.9 - uy * 0.5, cx - uy * 0.9 + ux * 0.5, cy + ux * 0.9 + uy * 0.5);
    }
  });
  return c;
}
```

**2. Backstitch** — every outline, stem, border and fence rail:

```js
// segs = flat [x0,y0,x1,y1, ...]; w = thread width; gap = shortening at each hole
function threadSegs(ctx, segs, c3, w, gap) {
  const path = (dx, dy) => {
    ctx.beginPath();
    for (let k = 0; k < segs.length; k += 4) {
      const x0 = segs[k], y0 = segs[k + 1], x1 = segs[k + 2], y1 = segs[k + 3];
      const L = Math.hypot(x1 - x0, y1 - y0) || 1, g = Math.min(gap, L * 0.3), gx = (x1 - x0) / L * g, gy = (y1 - y0) / L * g;
      ctx.moveTo(x0 + gx + dx, y0 + gy + dy); ctx.lineTo(x1 - gx + dx, y1 - gy + dy);
    }
  };
  ctx.lineCap = 'round';
  path(w * 0.28, w * 0.42); ctx.strokeStyle = 'rgba(35,20,10,0.36)'; ctx.lineWidth = w * 1.12; ctx.stroke();
  path(0, 0); ctx.strokeStyle = rgb(mul(c3, 0.72)); ctx.lineWidth = w; ctx.stroke();
  path(-w * 0.06, -w * 0.08); ctx.strokeStyle = rgb(c3); ctx.lineWidth = w * 0.62; ctx.stroke();
  path(-w * 0.16, -w * 0.22); ctx.strokeStyle = rgb(mix(c3, WHITE, 0.45), 0.7); ctx.lineWidth = w * 0.26; ctx.stroke();
}
```

**3. Motif renderer** — cell grid → embroidered sprite, drawn snapped to the world grid:

```js
// m = { w, h, cell: [code|null], outline: code }; col(code) -> [r,g,b]; stitchSet(rgb) -> 3 makeStitch variants
function renderMotif(m, col, stitchSet) {
  const c = document.createElement('canvas'); c.width = m.w * CP + MP * 2; c.height = m.h * CP + MP * 2;
  const ctx = c.getContext('2d'), has = (x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && !!m.cell[y * m.w + x];
  const sh = document.createElement('canvas'); sh.width = c.width; sh.height = c.height;
  const sx = sh.getContext('2d'); sx.fillStyle = '#28160c';
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (has(x, y)) sx.fillRect(MP + x * CP, MP + y * CP, CP, CP);
  ctx.save(); ctx.filter = 'blur(1.1px)'; ctx.globalAlpha = 0.42; ctx.drawImage(sh, 1.4, 2.4); ctx.restore();
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (has(x, y)) {           // dense underlay
    ctx.fillStyle = rgb(mul(col(m.cell[y * m.w + x]), 0.64)); ctx.fillRect(MP + x * CP + 0.6, MP + y * CP + 0.6, CP - 1.2, CP - 1.2);
  }
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (has(x, y))
    ctx.drawImage(stitchSet(col(m.cell[y * m.w + x]))[hashInt(x, y, 77) % 3], MP + x * CP - SM, MP + y * CP - SM);
  const segs = [];
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    if (!has(x, y)) continue;
    const X0 = MP + x * CP, Y0 = MP + y * CP, X1 = X0 + CP, Y1 = Y0 + CP;
    if (!has(x, y - 1)) segs.push(X0, Y0, X1, Y0); if (!has(x, y + 1)) segs.push(X0, Y1, X1, Y1);
    if (!has(x - 1, y)) segs.push(X0, Y0, X0, Y1); if (!has(x + 1, y)) segs.push(X1, Y0, X1, Y1);
  }
  threadSegs(ctx, segs, col(m.outline), 2.2, 0.55);
  return c;
}
// feet at world (x, y): snap to whole cells, then draw at 0.4 units per sprite px
function drawActor(ctx, spr, cellsW, cellsH, x, y) {
  const gx = Math.round(x / C - cellsW / 2), gy = Math.round(y / C) - cellsH;
  ctx.drawImage(spr, gx * C - MP * K, gy * C - MP * K, spr.width * K, spr.height * K);
}
```

**4. Big stitched areas in a few fills** — merge cells into row runs per colour, fill with a seamless stitch pattern:

```js
// stitchPattern(code): 32x32 canvas, 4x4 stitches drawn with 9 wrap offsets so it tiles
function fillStitchRuns(ctx, cellsX, cellsY, keyAt, stitchPattern) {
  const paths = new Map();
  for (let j = 0; j < cellsY; j++) {
    let run = null, r0 = 0;
    for (let i = 0; i <= cellsX; i++) {
      const k = i < cellsX ? keyAt(i, j) : null;        // thread code or null (bare cloth)
      if (k === run) continue;
      if (run) { if (!paths.has(run)) paths.set(run, new Path2D()); paths.get(run).rect(r0 * C, j * C, (i - r0) * C, C); }
      run = k; r0 = i;
    }
  }
  for (const [k, p] of paths) {
    const pat = ctx.createPattern(stitchPattern(k), 'repeat');
    pat.setTransform(new DOMMatrix([K, 0, 0, K, 0, 0]));  // pattern px -> world units, aligned to the cell grid
    ctx.fillStyle = pat; ctx.fill(p);
  }
}
// meadow density: sparse, clustered by Bayer + hash
// stitched = bayer8(i, j) * 0.55 + hash2(i, j) * 0.45 < 0.03 + 0.24 * smoothstep(0.36, 0.78, fbm(x / 190, y / 190))
```

## Adapting it to your game

- **Keep fixed:** the 3.2-unit grid (or any fixed cell size ≈ 1/110 of screen height), the stitch construction (5 passes per stroke, 3 variants), dark backstitch outlines, blurred warm drop shadows, visible Aida holes, bare-fabric dominance, warm brown shadows, embroidery-only effect vocabulary, Grandstander + Mali.
- **May change:** the thread palette (swap the whole set to a winter, spring or sci-fi floss set — keep ramps of 3–4 and keep a dark outline thread), the fabric colour (white, black or navy Aida all work; recompute contrast so motifs still pop), ground materials (snow = sparse white crosses, sand = half stitches, lava = satin stitch in reds), actor designs.
- **New actors:** draw them as string grids; for round shapes use the lit-sphere quantiser (`l = −0.5nx − 0.55ny + 0.62nz` + Bayer jitter → pick thread from ramp). Make variants by thread remapping, not new art.
- **Other genres:** for platformers use a side view but keep the cell grid and snapping; for puzzle/board games let one stitch cell or a 4×4 block be the game tile; for card games make cards fabric tags with satin borders.
- **Other resolutions:** the look is resolution-independent because sprites are baked at 8 px per cell and drawn scaled with smoothing; for very large screens bake at 12–16 px per cell.

## Performance notes

- Bake at init: 3 stitch variants per thread (~45 threads → ~135 tiny canvases), seamless patterns for the ground colours, knots in 5 sizes, all actor frames (right, left, flash) and 5 spawn masks per actor, props, icons, digits, glows.
- `ctx.filter = 'blur()'` is only used during baking (motif shadows); never per frame.
- Ground chunks of 80×80 cells are built as generators within a ~5 ms per-frame budget; the per-colour run + pattern fill keeps a chunk at roughly a dozen `fill()` calls instead of up to 6400 `drawImage` calls. Noise per cell (warped fbm, path distance) is the main cost.
- Per frame: one `drawImage` per actor/prop, plus 1–2 additive glows per glowing object; hundreds of enemies are fine. Particles are cached sprites (thread curls are cached per colour × shape).
- The starter kit bakes its whole ground once per canvas size and draws a frame in well under 2 ms.

## Copy-paste prompt

```text
Build my game <X> in the "Cross-Stitch Sampler" style (miwale Game Style Library):
- The whole world is beige Aida cloth (#dccaa5) with a visible hole grid; Canvas 2D, procedural, no image assets.
- Everything drawn is embroidery on a fixed stitch grid: 1 cell = 3.2 world units (360 units = screen height), baked at 8 px per cell.
- Every cell is a real cross stitch: two diagonal thread strokes, each = warm shadow, dark underside (x0.7), top ply, white sheen line, twist ticks; 3 jittered variants per colour.
- Sprites are string grids of single-letter thread codes (hero 9x11 cells, small enemy ~7x8, brute ~15x17), outlined with a dark #2b1d1d backstitch (4-pass thread line that stops short of each hole), with a blurred warm-brown drop shadow.
- Use a DMC-like palette in ramps of 3-4 threads; never invent in-between colours; shadows are always rgba(40,22,10,a).
- Actors snap to whole cells; 3 animation frames that only change legs/crown/tail; spawn = stitched in row by row with a needle, death = unravel into loose curly threads + beads.
- Ground: bare linen paths with brown backstitch borders, sparse dithered green meadow stitches, dense rust forest, satin-stitch ponds, French-knot flowers, grass tufts; every region border is backstitched. Leave lots of bare fabric.
- Effects use embroidery materials only: French knots, glass beads (small pickups), sewing buttons (big pickups), sequins, running-stitch trails, dashed thread rings.
- Light from the upper left; warm additive candle glows; brown radial vignette.
- HUD: fabric tags with satin-stitch borders and dashed running-stitch lines, cross-stitch-tile bar fills, an embroidery-hoop timer; fonts Grandstander (numbers/titles) and Mali (text).
- Bake stitches, motifs and ground chunks once; fill large stitched areas with seamless stitch patterns.
```
