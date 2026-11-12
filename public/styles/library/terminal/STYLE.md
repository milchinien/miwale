# Terminal ASCII — Game Art Style Spec

> The world drawn entirely in text glyphs on a green phosphor CRT: one fixed character grid, glowing multi-glyph figures, scanlines.

Everything on screen is a character in one fixed grid. A cell is **6 × 10 world units**, so the 360-unit-tall view is exactly 36 text rows. The ground is a field of dim glyphs – sparse ticks for meadows, clubs and spades for forests, `~` and `≈` for water, `░▒▓█` density ramps for hills, dotted amber dirt roads and rogue-style rooms with `#` walls around dotted floors. Figures are small multi-glyph sprites on opaque cell plates that erase the ground beneath them and glow like hot phosphor: an `@`-headed adventurer in amber standing on a blinking cursor, little `(ö)` critters, flickering `(*)` spirits trailing glyph tails, and a red block-letter brute made of half blocks. Effects are glyph bursts, rings of characters, expanding box-drawing frames and typed-out words. The whole picture sits behind scanlines, a breathing flicker, a rolling refresh band and a barrel vignette with rounded glass corners. Phosphor green carries about 90 % of the screen; amber marks the main character and every light; cyan and red are signals, used sparingly.

## At a glance

| | |
| --- | --- |
| Family | Text Mode · CRT Phosphor |
| Mood | nostalgic, nocturnal, hacker, minimal, eerie |
| Best for | grid-based dungeon crawlers, hacker/cyber themes, minimalist action or puzzle games, rapid prototypes with no art budget, retro computing tributes |
| Renderer | Canvas 2D, procedural; glyph atlas baked per cell size, cells blitted |
| Pixel art | no – full display resolution, but every glyph snaps to the **6 × 10-unit** cell grid |
| Complexity | 3/10: new assets are two short text grids; the engine (atlas + character ROM) is written once |
| Fonts | VT323 (world glyphs, numbers, titles), IBM Plex Mono (small body text) – Google Fonts |
| Key colours | `#020a05` screen · `#1a6331` / `#2a994b` phosphor · `#4ddb76` bright · `#ffb238` amber · `#5cefff` cyan · `#ff4257` red |

## When to use it

- **Good fits:** dungeon crawlers and turn-based grid games, hacker or cyberpunk stories told through a terminal, minimal arcade action, puzzle games on a grid, prototypes that need a strong look with zero drawn art.
- **Good when** the screen gets crowded: plates erase the ground under every figure and the figures glow against a dim field, so crowds stay readable.
- **Good when** you want text to be part of the world – messages type themselves out, damage scrambles glyphs, the HUD is a set of terminal windows.
- **Bad fits:** cozy, cute or pastel projects, realistic or painterly worlds, bright daylight scenes.
- **Bad for** designs that depend on faces, costumes or many subtly different figure types – a figure has 3–7 cells of detail.

## Color palette

Every family is a brightness ramp (brightest first in code). Fading means stepping down the ramp, never alpha.

| Swatch | Hex | Role |
| --- | --- | --- |
| Screen black `bg` | `#020a05` | background of every cell, HUD panels |
| Plate `plate` | `#010502` | opaque plates behind figures/props/collectibles/text, dark glyph of inverse cells |
| Phosphor deep `g0` | `#0a2613` | solid █ hill cores |
| Phosphor dim `g1` | `#113d20` | most grass ticks, forest floor dots, ▓ hill shade |
| Phosphor low `g2` | `#1a6331` | meadow ticks, forest glyphs, ░ ▒ hill edges, room floors, prop shade |
| Phosphor mid `g3` | `#2a994b` | room walls, prop bodies, HUD frames and labels |
| Phosphor bright `g4` | `#4ddb76` | small-creature shells, tree tips, HUD text and bars |
| Phosphor hot `g5` | `#a3ffbd` | big HUD numbers, card titles, numbers |
| Phosphor white `g6` | `#e6fff0` | small-creature eye, hottest numbers |
| Amber deep `a0` | `#3d2405` | dim road dots, sand |
| Amber dark `a1` | `#7a4a0e` | road dots, shore sand, wood (trunks, frames, logs), empty bar segments |
| Amber `a2` | `#c97f19` | main character's torso and legs, doors, chest, bridges |
| Amber bright `a3` | `#ffb238` | main character's arms, projectile trail, spinner brackets, PWR bar, cursor |
| Amber light `a4` | `#ffd98e` | large creature's teeth, fire sparks, bar text |
| Amber white `a5` | `#fff3da` | main character's `@` head, projectile head, spinner core |
| Cyan dim `c1` | `#0f5c62` | water `~` `≈` |
| Cyan `c2` | `#1fb0b9` | spirit brackets, water crests, glyph tails |
| Cyan bright `c3` | `#5cefff` | collectibles, LEDs, stairs, glow-up frame and text |
| Cyan white `c4` | `#ccfbff` | spirit core, collectible blink |
| Red `r2` | `#ff4257` | large creature, `x` eyes, error text and scramble |
| Red light `r3` | `#ff8a96` | large creature's horn tips, scramble highlights |
| Red dark `r1` | `#86131f` | large creature's feet, rare ♦ flowers |
| Water cells | `#031a1e` / `#042229` | cell background of shallow / deep water |
| Region cells | `#071f0f` · `#04170c` · `#0e0d05` | cell background of rooms · dense forest · roads and bridges |

**Palette rules**

- Green carries ~90 % of the picture. The ground never gets brighter than `#2a994b`, except room walls (20 % `#4ddb76`) and tree tips.
- Amber belongs to the main character, light sources and warm materials (wood, sand, roads, treasure). No creature is amber.
- Cyan is for collectibles, spirits, water and the glow-up; red only for the large creature, small-creature eyes, errors and alerts.
- Cell backgrounds are near-black tints of their material, never mid tones – they are what makes the map readable from far away.
- Flash = inverse video: the plate lit in the brightest step of the figure's colour family, the glyphs in plate black.

## Typography

- **VT323** (Google Fonts, 400) is the world font and the display font. In the world it is set at **1.25 × cell height** (31 px for a 25-px cell): VT323's advance is 0.4 em, so a 6 × 10 cell is filled; baseline at 79 % of the cell height. Before the web font has loaded the glyphs fall back to Share Tech Mono / Consolas at 0.9 × cell height and everything is re-baked once VT323 arrives.
- **Bold = double strike:** figure, prop and effect glyphs are drawn twice, the second time shifted right by max(1 px, 10 % of the cell width) – exactly how text terminals made bold.
- **IBM Plex Mono** (400–600) for small body text in the UI: card descriptions, captions and hints, 11–15 px, often uppercase with 2–3 px letter spacing.
- HUD numbers: VT323 26–52 px with a two-layer phosphor glow `text-shadow: 0 0 6px rgba(77,219,118,.75), 0 0 16px rgba(77,219,118,.25)` (amber equivalent for amber text).
- Prompts and cursors are typography too: `> ` and `$ ` before captions, a blinking `█` or `_` after titles (1.06 s, `steps(1)`).

## Rendering technique

The shared pipeline:

1. **Character grid.** Cell = 6 × 10 world units. A world point maps to cell `(floor(x / 6), floor(y / 10))`; screen position of a cell = `round(col · 6 · S + ox)`, `round(row · 10 · S + oy)` with S = screenH / 360.
2. **Character ROM.** Block elements (`█ ▀ ▄ ▌ ▐ ■ ▪ ▁`), shades (`░ ▒ ▓` as 25 / 50 / 75 % dot lattices with dot size max(1, round(cellH / 12))), box drawing (`─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼` and the double set `═ ║ ╔ ╗ ╚ ╝`, stroke max(1, round(0.15 · cellW))) and seven bitmap symbols the font lacks (`♣ ♠ ♥ ◆ ◇ ≈ ▲ ☼ ↑ ♦`, 7-column pixel grids fitted into 90 % × 72 % of the cell) are drawn procedurally with rounded rects. Everything else is VT323 text.
3. **Glyph atlas.** One atlas per cell pixel size. A slot is one (glyph, colour, mode) on an 8 × 8-slot page (small pages keep re-uploads cheap when a slot is added); slot size = cell + 2 × pad (pad = 0.9 × cell height for glowing modes). Modes: plain (ground), glow (wide shadow blur 0.9 × cellH at 70 % alpha + tight 0.32 × cellH + crisp double-struck), inverse (lit cell with its own glow, glyph in plate black), soft (single 0.3 × blur). The common slots are baked in one warm-up on the first frame at a new cell size; anything else is baked on first use, then reused forever.
4. **Ground chunks** (240 units = 40 × 24 cells) evaluate one material + glyph + colour + background per cell from noise, including a one-cell margin, fill the backgrounds, then blit plain atlas glyphs. Built with a generator in row batches and cached.
5. **Sprites** (figures and props) are text grids: glyph rows + colour-key rows. They are baked once per cell size into one canvas (plates → wide bloom → tight halo → crisp glyphs) and drawn with one `drawImage`. Transient states (appear, scramble, dissolve) are drawn cell by cell from the atlas instead.
6. **Draw order:** ground chunks → water crests and light pools → collectibles → shadows (only the main character's cursor and lamp glow) → y-sorted props and figures → orbiting spinners → projectiles → particles → numbers → row tearing → scanlines, refresh band, flicker, vignette.

## World and ground

One glyph per cell, chosen by material in this priority order:

- **Rooms** – cell-aligned rectangles 11–19 × 7–11 cells, at most one per 44 × 30-cell region (42 % chance), never near the start point or water. Half are rogue rooms with `#` walls (`#2a994b`, 20 % `#4ddb76`, 13 % ruined into `▒` or `,`), half have double-line walls `╔═╗ ║ ╚═╝`. Floors are a regular `.` on every cell in `#1a6331` (12 % brighter). 2–3 doors `+` in amber `#c97f19`. Cell background `#071f0f`.
- **Water** – warped noise < 0.335: shallow cells 50 % `~`, deep cells (< 0.265) 42 % `≈` + 20 % `~`, all in `#0f5c62` (20–30 % `#1fb0b9`), on `#031a1e` / `#042229` cell backgrounds. Where a road crosses water it becomes a plank bridge `=` in amber. A 0.02-wide shore band of `. , ·` in amber dark frames every lake.
- **Roads** – cells within 8 units of two noise curves: centre `·` and `:`, edges `. , '`, all amber dark `#7a4a0e` / `#3d2405` on `#0e0d05`.
- **Hills** – fbm > 0.665, drawn as a density ramp from the rim inward: `░` (`#1a6331`) → `▒` → `▓` (`#113d20`, 12 % `▲` peaks in `#2a994b`) → solid `█` in `#0a2613`.
- **Forest** – warped noise > 0.54; density rises over 0.11 of noise. 8–48 % of cells are `♣ ♠ ^` (`#1a6331`, 18 % `#2a994b`), the rest `.` `,` in `#113d20` on `#04170c` once dense.
- **Grass** – 4–44 % of cells (by meadow noise, so open grass stays calm) get `. , ' \` "` in `#113d20` / `#1a6331`; meadow patches use `" , ; '` one step brighter. Flowers grow only in small beds inside meadows (4 × 2-cell patches, 12 % of them): 30 % of the cells in a bed show amber `*` or, in some beds, red `♦` – colour in clusters, never sprinkled.
- A slow macro noise shifts grass and forest glyphs one brightness step up or down in large areas, so the field breathes like an unevenly worn tube.
- **Animated water:** every frame, water cells where `sin(0.42·col + 1.1·row − 1.9·t + 1.4·sin(0.7·row + 0.6·t)) > 0.9` get a crest: plate in the water background, `~` in `#1fb0b9`; the top 2.5 % become a glowing `≈` in `#5cefff`.
- **Light pools:** campfires put an additive amber radial (50 % alpha, radius 46 units, flickering ±3) on the ground.

The ground stays dim and at most half filled – the figures own the brightness.

## Characters

Every figure is a text grid: glyph rows + colour-key rows (`.` = no cell, ground stays visible; `K` = plate without glyph). Each used cell gets an opaque `#010502` plate, then the glyphs are baked with a wide bloom (shadow blur 1.0 × cell height at 75 % alpha), a tight halo (0.3 ×) and a crisp double-struck pass. Facing left mirrors the rows and swaps paired glyphs (`/ ↔ \`, `( ↔ )`, `< ↔ >`, `[ ↔ ]`, `{ ↔ }`, `▌ ↔ ▐`).

**Main character – the `@` adventurer, 3 × 3 cells (18 × 30 units)**

```text
~@        a H .  scarf #c97f19 trailing behind, white-amber head #fff3da
/█\       A a A  arms #ffb238, torso #c97f19
/ \       a K a  legs #c97f19 (gap = plate only)
```

- **16 held poses** (glyph rows, facing right):

```text
walk 0-7   ~@  ~@  -@  -@  ~@  ~@  -@  -@     scarf lags the legs by one pose
           /█\ -█\ |█| /█- /█\ /█- |█| -█\    arms counter-swing, hang at passing
           / \ /|  ·|  ·|\ / \ ·|\ ·|  /|     legs: stride, push, pass, reach
idle 8-11  ,@  ,@  `@  ,@  / /█\ /█\ |█| |█|   breathing: arms relax on the exhale, scarf hangs and sways
blink 12   ,o          crouch 13  ~@ <█  /_\   lunge 14  =@ -█= / >   hurt 15  ~X \█/ / \
```

- Walk at `anim × 0.9` (8 poses per stride); idle poses held 0.5 s each; blink for 0.16 s every 3.6 s; the crouch shows for the first 45 ms of a dash (anticipation), then the lunge.
- While firing, the arm on the facing side becomes `- / \ |` by aim angle.
- Dash: lunge pose in white-amber with a streaming `=` scarf, and three afterimages one step apart down the ramp `▓ ▒ ░` in amber.
- It stands on a blinking amber `▁` cursor in the cell below its feet (1.06 s period) and carries a faint amber lamp glow (16 %, 52 units).
- Hit: the hurt pose, with 55 % of its cells scrambling to red noise glyphs (`#%&$@?!*+=/\<>{}[]~^:;░▒▓`) every 1/24 s. Glow-up: all glyphs swap to cyan at 12 Hz. Invulnerable: dim and unglowing every other 1/16 s.

**Small creature – a glyph critter, 3 × 2 cells**

```text
(ö)   g W g    shell #4ddb76, eye #e6fff0        {x}   g R g   red eyes #ff4257
/"\   d g d    legs #2a994b / underside #4ddb76  / \   d K d
```

Two designed variants (55 % / 45 %), 4 scuttle poses at `anim × 1.6 + seed` (`/"\ |"| \"/ |"|`, `/ \ | | \ / | |`), a blink pose (`(-)`, `{-}`) for 5 % of each actor's own 3 s cycle, and a hit pose (`(×)` over `\"/`, `{#}` over `/ \`).

**Fast creature – a flickering spirit, 3 × 1 cells**

`(*) {+} (×) <*> {x} (+)` cycling at 11 fps, brackets `#1fb0b9`, core `#ccfbff`. It never mirrors. Behind it the last four cells it occupied show `+ · · .` fading through the cyan ramp.

**Large creature – a block-letter brute, 7 × 4 cells (42 × 40 units)**

```text
▀▄   ▄▀    horn tips #ff8a96, horns #ff4257
▄█O█O█▄    body #ff4257, eyes O #fff3da
█▀vvv▀█    teeth v #ffd98e
▀ █ █ ▀    feet #86131f   (frame 2:  █ ▀ █ )
```

4 stomp poses at `anim × 1.0`: the horns pump (`▀▄   ▄▀` ↔ `▄▀   ▀▄`), the jaw chomps (`vvv` ↔ `VVV`), the feet swap; it blinks (`O` → `-`) on its own timer; hit pose: eyes `×`, mouth `###`.

**States shared by all creatures**

- **Appear (0 → 1):** cells type in one by one between 25 % and 90 % of the appear time in reading order; before that each cell shows a dim scrambling noise glyph (from 12 % on).
- **Hit:** while flash > 0.25 the creature shows its hit pose and is knocked one whole cell in the push direction (flash > 0.55); while flash > 0.45 the sprite turns into inverse video – every plate lit in the family's brightest colour with glow, glyphs in plate black. A one-frame `█` block marks the impact cell.
- **Per-actor timing:** walk poses come from each actor's own counter plus its seed, blinks run on seed-shifted timers – a crowd never moves in lock-step.
- **Dissolve (0 → 1):** starting from the hit pose, each cell drifts 1.5–4 cells in its own direction (and up), shows its own glyph for the first 18 %, then decays `▓ ▒ ░ · .` while stepping down its colour ramp; cells vanish between 45 % and 100 %.

## Props

Same text-grid sprites with plates, snapped to cells and y-sorted with the figures. Only light-emitting keys get bloom; stone, wood and foliage are drawn without glow.

| Prop | Glyphs | Colours |
| --- | --- | --- |
| Pine, 5 × 6 | stacked `^` tiers (1, 3, 5, 3, 5) and a `║` trunk | tip `#a3ffbd` (glowing), `#4ddb76` / `#2a994b` / `#1a6331`, trunk `#7a4a0e` |
| Oak, 6 × 4 | ` .&&. ` `(&&&&)` `(&%&&)` `` `||` `` | `#4ddb76` / `#2a994b`, trunk `#7a4a0e` |
| Bush, 4 × 2 | ` ,, ` `(&&)` | `#2a994b` |
| Boulder, 6 × 3 | ` .--. ` `(.░▒▓)` `` `----´ `` | `#2a994b` rim, `#1a6331` / `#113d20` shading |
| Monolith, 3 × 5 | `▲` `▐■▌` `▐▒▌` `▐▒▌` `▄█▄` | `#1a6331`, LED `■` `#5cefff` (2 on, 1 off at 1.4 Hz) |
| Signpost, 5 × 4 | `┌───┐` `│>_ │` `└─┬─┘` `  │  ` | wood `#7a4a0e`, prompt `#ffb238`, blinking `_` `#ffd98e` |
| Ruin wall | `# ##` / `####` or `##` / `###` / `###` | `#2a994b` |
| Campfire, 3 × 3 | sparks `, ' ` (moving), `)▲(` / `(▲)`, logs `=#=` | flame `#ffb238`, core `#fff3da`, sparks `#ffd98e`, logs `#7a4a0e` |
| Stairs | `>` | `#5cefff`, pulsing |
| Chest | `[=]` | `#c97f19` / `#ffb238` |

- Rooms are furnished from their own seed: campfire in the middle (60 %), stairs (55 %), chest (60 %), monolith (40 %).
- Outside: trees dense in forest (42 % per 42-unit cell) and rare on meadows (1.2 %), bushes, boulders near hills, monoliths, ruins, signposts 12 units beside roads, rare campfires.
- A tree with a figure standing behind it is redrawn without plates and one step dimmer, so the figure shows through.

## Effects and particles

Every particle is one glyph on the cell grid – no shapes, no sprites.

- **Glyph burst:** impacts throw 2 glyphs from `* + ' \`` in the struck figure's colour family; bursts throw 6 (16 for the large creature) of the figure's *own* glyphs plus 3–8 `* + x`. Glyphs decay to `·` then `.` (shade glyphs to `▒` then `░`) in their last 45 % and step down the colour ramp; glow turns soft below 30 % of life.
- **Ash residue:** 4 (large: 9) cells of shade glyphs stay where a figure dissolved and decay `▒ → ░ → · → .` over 1.1–1.6 s in the figure's darkest colours, each cell vanishing at its own moment.
- **Layering:** impact = one-frame `█` → 2 burst glyphs; burst = the figure's own glyphs + `* + x` → glyph ring → ash residue.
- **Glyph ring:** a ring of `*` (large creature: `#`, plus an amber `▓` ring) on the grid, radius 4 → 22 units (46 for large) with ease-out over 0.32–0.55 s, squashed to 0.6 vertically, one glyph per cell, turning to `·` after 60 %.
- **Collect:** a cyan `+` rises from the main character; large collectibles add a small `◇` ring.
- **Glow-up:** a cyan box-drawing frame `┌─┐ │ └─┘` grows from 1 to 6 cells half-height around the main character over 0.7 s, `[ OK ]` types itself above, and ten `↑ ▲` glyphs rise in cyan and amber.
- **Typed text:** words appear one character per cell (on plates) over the first 30 % of their life with a blinking `█` cursor at the end, and scramble into noise glyphs in the last 25 %. Used for `OK`, `ERR` (red, when the main character is hit) and `SIGNAL LOST`.
- **Collectibles:** small = one cyan `◆` on a plate blinking to `◇` one frame in five (3 fps); large = `[◆]`. When attracted they leave a `·` one cell behind. Freshly dropped ones pop `·` → `+` → `◆`.
- **Orbiting object:** a terminal spinner `| / - \` at 12 fps in `#fff3da` between amber `( )` brackets, with a soft `·` on the previous spot of its orbit.
- **Projectile:** a `#fff3da` `*` on a plate, then the direction glyph `- \ | /` (angle in 45° steps) in amber, then a dim `·`.
- **Floating numbers:** digits type into consecutive cells over the first 18 % of their life on plates in `#e6fff0` (highlighted: `#fff3da` with a trailing `!`), decaying to `. ·` in the last 22 %.
- **Row tearing:** heavy impacts (large burst 0.14 s, hit on the main character 0.22 s, final burst 0.5 s) slide 2–5 strips of 1–3 text rows sideways by up to two cells, settling back.
- Bursts sent by other systems with arbitrary colours are snapped to the nearest phosphor family and level, so foreign effects still look like text.

## Atmosphere and lighting

- **Phosphor bloom is baked**, not post-processed: every glowing glyph carries its own two-pass shadow-blur halo in the atlas. A full-screen downsample bloom was tested and dropped – reading back the frame costs ~20 ms in software rendering.
- **No shadows.** Figures stand in cells; the main character stands on its blinking cursor and casts a faint amber lamp glow.
- **Scanlines:** every max(3, round(screenH / 300)) display pixels a dark row a third of that height at `rgba(0,0,0,0.42)`, drawn at display resolution.
- **Flicker:** a black veil of 1.2–6.2 % alpha: hashed noise at 30 Hz plus a slow swell `0.02 · max(0, sin(1.7 t))`.
- **Rolling refresh band:** an additive gradient `rgba(120,255,170,0.035)`, 14 % of the screen tall, sweeping top to bottom every 9.8 s.
- **Barrel vignette:** radial black 0 → 16 % (at 55 %) → 50 % (85 %) → 82 % in the corners, plus 6 %-wide edge bands at 55 % that darken toward each border, plus rounded black screen corners with a radius of 7.5 % of the short side.
- **Glass:** a soft radial reflection `rgba(200,255,220,0.045)` at the upper left.
- Light sources are amber additive pools (campfires) and glowing glyph halos; there is no global light direction.

## UI

The HUD is a set of terminal windows.

- **Window:** near-black `rgba(2,10,5,.9)` with a scanline texture `repeating-linear-gradient(0deg, rgba(0,0,0,.28) 0 1px, transparent 1px 3px)`, 2-px `#2a994b` border, square corners, a 3-px screen-black outer ring and a soft glow `0 0 14px rgba(77,219,118,.28)` plus an inner glow.
- **Title in the border:** like a fieldset legend – ` PWR ` in amber VT323 20 px on a screen-black patch at `top: -12px`.
- **Bars:** block segments 8 px + 2 px gap: bright green (`#4ddb76`) for the top progress bar, amber (`#ffb238`) for the panel bar, both with a `drop-shadow` glow over a dim segmented track; a dim three-letter label `BUF` to the left and the number in `[07]` brackets to the right.
- **Big numbers:** VT323 52 px `#a3ffbd` with the phosphor text-shadow and a blinking block cursor; captions in IBM Plex Mono 11 px uppercase with a `>` prompt in amber.
- **Counter:** a window with a small creature icon and `×128`.
- **Cards:** windows 236 × 290 px with a lit `#2a994b` title strip carrying `[1]`, a 96-px icon, VT323 30 px uppercase title, Plex Mono 13 px body. Hover: frame and strip turn amber and the title turns inverse video (`#ffd98e` background, black text).
- **Panel title:** `> SELECT ONE` in VT323 64 px with a blinking `█`; the dimmed backdrop is a radial near-black veil with scanlines.
- **Caption bar:** a window with `$ ` before the family, the name in VT323 with a blinking `_`.
- **Icons:** 1–3 rows of glyph art on transparent ground, double-struck with glow (`»»»`, `\|/ -*- /|\`, `(☼)`, `>◆<`, `♥+`, `-=@` …), sized so the art fills ~94 % of the icon width.
- No transitions; all blinks are `steps(1)`.

## Motion and animation

- Everything moves in whole cells (6 units across, 10 down); only the camera scrolls smoothly. Movement reads as discrete terminal steps – embrace it.
- Held poses, never tweens: main character 8 walk poses at `anim × 0.9`, 4 idle poses (0.5 s each) + blink, crouch → lunge, hurt; critters 4 poses at `anim × 1.6`, brutes 4 at `anim × 1.0`, both with a hit pose and own blink timers; spirits flicker at 11 fps.
- Secondary motion is a glyph that changes one pose late: the scarf cell (`~ ~ - -`), the brute's jaw.
- Blinks are hard steps: cursors 1.06 s period, collectibles one frame in five, invulnerability 16 Hz, glow-up 12 Hz.
- Spinner 12 fps, campfire 7 fps, monolith LED 1.4 Hz (2 on / 1 off), water crests 1.9 rad/s.
- Decay is a ramp, never a fade: `* → + → · → .` and `█ → ▓ → ▒ → ░`, with one colour step darker per band.
- Text always types in, then scrambles out.

## Do and don't

**Do**

- Snap every glyph to the cell grid and draw at whole display pixels.
- Bake glyphs once into an atlas (glyph + colour + mode) and blit cells; bake multi-cell sprites once per cell size.
- Put an opaque plate behind every figure, prop, collectible and text cell.
- Keep the ground dim and sparse (≤ 50 % filled, ≤ `#2a994b`).
- Draw block, shade and box glyphs procedurally so they tile seamlessly.
- Use inverse video for flashes, scrambled glyphs for hits and typed text for messages.
- Choose glyphs by silhouette: half blocks for masses, slashes for limbs, brackets for shells.

**Don't**

- No sub-cell positions, rotated or scaled glyphs, or mixed glyph sizes in one grid.
- No colours outside the phosphor ramps; no amber creatures, no green main character.
- No per-frame full-screen blur or bloom; the glow lives in the baked glyphs.
- No drop shadows, gradients inside cells or rounded proportional fonts in the world.
- No dense, bright ground textures – they swallow the figures.
- No alpha fades for decay.

## Implementation recipe

1. Pick the cell: 6 × 10 world units (aspect 0.6, like a monospace font). Screen height = 36 rows.
2. Load VT323; until it is loaded use a monospace fallback at 0.9 × cell height, then clear the atlas and repaint cached ground once.
3. Write `paintGlyph(ctx, ch, x, y, w, h, bold)`: procedural blocks/shades/box lines/bitmap symbols, otherwise `fillText` at 1.25 × h, baseline 0.79 h, double strike for bold.
4. Build the atlas: slots keyed by mode + glyph + colour, baked on first use with shadow blur for glow.
5. Generate the ground per cell (material → glyph → colour → background) in chunks of 40 × 24 cells, with a one-cell margin.
6. Define figures and props as glyph rows + colour-key rows; bake each state once (plates, bloom, halo, crisp).
7. Draw everything at `round(col · cellW + ox)`, feet in the cell that holds y.
8. Implement appear (type-in), flash (inverse), dissolve (drift + ramp) cell by cell from the atlas.
9. Effects = single glyph particles, glyph rings, box frames and typed text.
10. Finish with scanlines, flicker, refresh band and a cached vignette canvas.

## Code

The glyph painter with the procedural character ROM and double-strike bold:

```js
const ROM = { '♣': ['..xxx..', '..xxx..', 'xx.x.xx', 'xxxxxxx', 'xx.x.xx', '...x...', '..xxx..'] };
const rect = (g, x0, y0, x1, y1) => { const a = Math.round(x0), b = Math.round(y0); g.fillRect(a, b, Math.max(1, Math.round(x1) - a), Math.max(1, Math.round(y1) - b)); };
function paintGlyph(g, ch, x, y, w, h, bold) {
  if (ch === ' ') return;
  if (ch === '█') return rect(g, x, y, x + w, y + h);
  if (ch === '▀') return rect(g, x, y, x + w, y + h / 2);
  if (ch === '▄') return rect(g, x, y + h / 2, x + w, y + h);
  const shade = { '░': 1, '▒': 2, '▓': 3 }[ch];
  if (shade) {                                     // 25 / 50 / 75 % dot lattices
    const d = Math.max(1, Math.round(h / 12));
    for (let j = 0; j * d < h; j++) for (let i = 0; i * d < w; i++) {
      const on = shade === 1 ? i % 2 === 0 && j % 2 === 0 : shade === 2 ? ((i + j) & 1) === 0 : !(i % 2 && j % 2);
      if (on) g.fillRect(Math.round(x + i * d), Math.round(y + j * d), d, d);
    }
    return;
  }
  const rom = ROM[ch];
  if (rom) {                                       // bitmap symbol fitted into the glyph box
    const n = rom.length, ps = Math.min((w * 0.9) / 7, (h * 0.72) / Math.max(6, n));
    const bx = x + (w - ps * 7) / 2, by = y + h * 0.8 - ps * n;
    for (let j = 0; j < n; j++) for (let i = 0; i < 7; i++) if (rom[j][i] === 'x') rect(g, bx + i * ps, by + j * ps, bx + (i + 1) * ps, by + (j + 1) * ps);
    return;
  }
  g.font = Math.round(h * 1.25) + 'px "VT323", monospace';
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.fillText(ch, x + w / 2, y + h * 0.79);
  if (bold) g.fillText(ch, x + w / 2 + Math.max(1, w * 0.1), y + h * 0.79);   // double strike
}
```

The glyph atlas – bake on first use, blit forever:

```js
function makeAtlas(cw, ch) {
  const pad = Math.ceil(ch * 0.9), sw = Math.ceil(cw) + pad * 2, sh = Math.ceil(ch) + pad * 2, per = 16;
  const page = document.createElement('canvas'); page.width = sw * per; page.height = sh * per;
  const g = page.getContext('2d'), map = new Map(); let n = 0;
  function get(glyph, col, glow) {
    const key = (glow ? 1 : 0) + glyph + col;
    let s = map.get(key);
    if (s) return s;
    const k = n++, sx = (k % per) * sw, sy = Math.floor(k / per) * sh, x = sx + pad, y = sy + pad;
    g.save(); g.beginPath(); g.rect(sx, sy, sw, sh); g.clip(); g.fillStyle = col;
    if (glow) {
      g.shadowColor = col;
      g.globalAlpha = 0.7; g.shadowBlur = ch * 0.9; paintGlyph(g, glyph, x, y, cw, ch, true);
      g.globalAlpha = 1; g.shadowBlur = ch * 0.32; paintGlyph(g, glyph, x, y, cw, ch, true);
      g.shadowBlur = 0;
    }
    paintGlyph(g, glyph, x, y, cw, ch, glow);
    g.restore();
    map.set(key, (s = { sx, sy }));
    return s;
  }
  return { get, draw(ctx, glyph, col, glow, px, py) { const s = get(glyph, col, glow); ctx.drawImage(page, s.sx, s.sy, sw, sh, px - pad, py - pad, sw, sh); } };
}
```

A multi-glyph sprite on opaque plates, snapped to the grid by its feet:

```js
const HERO = { g: [' @ ', '/█\\', '/ \\'], k: ['.H.', 'AaA', 'aKa'] };       // '.' = no cell, 'K' = plate only
const KEY = { H: '#fff3da', A: '#ffb238', a: '#c97f19' };
function bakeSprite(def, cw, ch) {
  const w = def.g[0].length, h = def.g.length, pad = Math.ceil(ch * 0.9);
  const c = document.createElement('canvas'); c.width = Math.ceil(w * cw) + pad * 2; c.height = Math.ceil(h * ch) + pad * 2;
  const g = c.getContext('2d'), X = (i) => pad + Math.round(i * cw), Y = (j) => pad + Math.round(j * ch);
  g.fillStyle = '#010502';
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (def.k[j][i] !== '.') g.fillRect(X(i), Y(j), X(i + 1) - X(i), Y(j + 1) - Y(j));
  for (let pass = 0; pass < 3; pass++) {                     // wide bloom, tight halo, crisp
    g.save(); if (pass === 0) g.globalAlpha = 0.75;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const k = def.k[j][i], glyph = def.g[j][i];
      if (k === '.' || k === 'K' || glyph === ' ') continue;
      g.fillStyle = KEY[k];
      if (pass < 2) { g.shadowColor = KEY[k]; g.shadowBlur = ch * (pass === 0 ? 1 : 0.3); }
      paintGlyph(g, glyph, X(i), Y(j), X(i + 1) - X(i), Y(j + 1) - Y(j), true);
    }
    g.restore();
  }
  return { c, pad, w, h };
}
function putSprite(ctx, s, x, y, S, ox, oy) {               // world (x, y) = feet; 6 × 10-unit cells
  const left = Math.round(x / 6 - s.w / 2), top = Math.floor(y / 10) - s.h + 1;
  ctx.drawImage(s.c, Math.round(left * 6 * S + ox) - s.pad, Math.round(top * 10 * S + oy) - s.pad);
}
```

The dissolve – each cell drifts and decays down the shade ramp:

```js
function drawDissolve(atlas, def, left, top, t, seed, cellPx) {   // t: 0 → 1
  const ramp = ['▓', '▒', '░', '·', '.'], fam = ['#e6fff0', '#a3ffbd', '#4ddb76', '#2a994b', '#1a6331'];
  for (let j = 0; j < def.g.length; j++) for (let i = 0; i < def.g[j].length; i++) {
    if (def.k[j][i] === '.' || def.g[j][i] === ' ') continue;
    const h1 = hash(i + j * 9, seed, 3), h2 = hash(i * 5 + j, seed, 4);
    if (t > 0.45 + h1 * 0.55) continue;                       // this cell is gone
    const a = h2 * Math.PI * 2, d = t * (1.5 + h1 * 2.5);
    const dc = Math.round(Math.cos(a) * d), dr = Math.round(Math.sin(a) * d * 0.6 - t * 1.2);
    const glyph = t < 0.18 ? def.g[j][i] : ramp[Math.min(4, Math.floor((t - 0.18) * 7 + h1 * 1.5))];
    atlas.draw(ctx, glyph, fam[Math.min(4, Math.floor(t * 3) + (t < 0.18 ? 0 : 1))], true,
      (left + i + dc) * cellPx.w, (top + j + dr) * cellPx.h);
  }
}
```

## Adapting it to your project

- **Side view:** keep the grid, build platforms from `═ █ ▀` rows and ladders from `H`; the same sprites work in profile.
- **Other phosphors:** swap the green ramp for an amber-only (classic amber monitor) or white/blue ramp, keep one contrasting family for the main character and one signal colour.
- **Bigger figures:** go to 5 × 4 cells for the main character, but keep creatures readable by silhouette first (brackets, blocks, slashes), colour second.
- **Grid snapping too coarse?** Halve the cell to 3 × 5 units for figures only, never for the ground – or keep full cells and lean into the stepping as a feature.
- **Menus and dialogue** are free: typed text, `> ` prompts, box-drawing windows and inverse-video selection.
- **Without web fonts:** draw every glyph from the procedural ROM (extend the 7-column bitmaps) – the look survives and becomes fully deterministic.

## Performance notes

- Per frame the cost is a handful of `drawImage` calls: one per figure or prop (baked sprite), one per particle glyph, a few hundred water-crest cells, one pattern fill for scanlines and one cached vignette canvas. A crowded scene with 60–120 figures spends ~1–2 ms (median) in the drawing code in headless Chromium.
- On the first frame at a new cell size a warm-up bakes ~600 common glyph slots and all ~50 figure states at once, so no later frame pays for baking; resizing clears and re-warms.
- Atlas pages and sprite canvases are created with `willReadFrequently: true` (CPU-backed): they are drawn into once and then only used as `drawImage` sources.
- Ground chunks (40 × 24 cells) are built with a generator in row batches (noise per cell, then backgrounds, then glyph blits) and cached by the core; chunks built before the web font arrived are repainted in place, three per frame.
- Avoid full-screen readbacks (downsample bloom, `getImageData`): they stall the GPU pipeline – row tearing copies the canvas onto itself only during impacts.
- `shadowBlur` is expensive, which is exactly why it only ever runs at bake time.

## Copy-paste prompt

```text
Use the Terminal ASCII art style for my project:
- Render everything as text glyphs on one fixed character grid: cell = 6 x 10 world units (screen height = 36 rows). Snap every glyph to whole cells.
- Bake glyphs once into a glyph atlas (glyph + colour + mode: plain / glow / inverse) and blit cells; draw block, shade (░▒▓ as 25/50/75 % dot lattices) and box-drawing glyphs procedurally.
- Font: VT323 at 1.25 x cell height, double-struck for bold; IBM Plex Mono for small UI text.
- Palette: screen #020a05; phosphor green ramp #0a2613 #113d20 #1a6331 #2a994b #4ddb76 #a3ffbd #e6fff0 (~90 % of the screen); amber #7a4a0e #c97f19 #ffb238 #ffd98e #fff3da for the main character and lights; cyan #0f5c62 #1fb0b9 #5cefff and red #ff4257 only as signals.
- Ground: sparse dim ticks . , ' " for meadows, ♣ ♠ ^ forests, ~ ≈ water on dark teal cells, ░▒▓█ hill ramps, dotted amber roads, rooms with # walls, . floors and + doors. Keep it dim and at most half filled.
- Figures are small multi-glyph sprites on opaque black cell plates with a baked phosphor glow: a 3x3 @-headed adventurer in amber on a blinking ▁ cursor, (ö) critters, flickering (*) spirits with glyph tails, a 7x4 red half-block brute.
- Flash = inverse video. Appear = cells type in through scrambling noise glyphs. Dissolve = cells drift apart and decay ▓ ▒ ░ · .
- Effects: single-glyph bursts, rings of * on the grid, expanding ┌─┐ frames, typed-out words that scramble away, a | / - \ spinner, a * projectile with a direction-glyph trail.
- Atmosphere: scanlines, 1-6 % flicker, rolling refresh band, barrel vignette with rounded glass corners, row tearing on impacts. No shadows, no full-screen blur.
- UI: terminal windows (2 px #2a994b frame, glow, scanline texture, title cut into the border), block-segment bars, > prompts and blinking █ cursors.
```
