# Psychedelic Card Table — Game Art Style Spec

> A Balatro-like card table: a flowing paint swirl floor, wobbling pixel cards and chip tokens, foil and holo editions, burn dissolves and a CRT screen.

The whole world is one endless **card table**, and its cloth is alive: a slow **paint swirl** in three shades of one table colour, poured, folded and twisted around the middle of the screen like a lava lamp. By default the table is green felt; in some areas it turns crimson, violet or teal, and the whole floor eases to that colour as the camera moves there. On the table everything is crisp **pixel art** in the language of a card game: a walking playing card wearing a two-pointed jester hat, chip tokens with little faces, flipping tarot cards, a big crimson token with one glaring eye, chip stacks, decks, dice and standing cards that shimmer in **foil, holographic, polychrome or negative** editions. Nothing ever just happens: everything **wobbles** with a decaying spring ("juice"), throws hard **silhouette shadows**, bursts into spinning **square particles**, shows its value in a **blue (+) or red (X) bubble**, and **burns away** with a glowing edge. Finally the whole picture sits behind curved **CRT glass** with scanlines, a chromatic fringe and bloom. It is a design study in the spirit of the visual language of Balatro, built from scratch.

## At a glance

| | |
| --- | --- |
| Family | Pixel Art · CRT Card Table |
| Mood | hypnotic, playful, snappy, retro, casino-lounge |
| Best for | card, deck-building and dice projects; casino and puzzle arcade games; menus, shops and reward screens that need juice; playful top-down action |
| Renderer | Canvas 2D sprites + two WebGL2 fragment shaders (paint swirl, CRT post pass); CPU and 2D fallbacks |
| Pixel art | Yes — 1 art pixel per world unit (360 units tall), integer upscale, sprites rotate inside the art buffer |
| Complexity | 4/10 — tiny flat sprites; the look lives in six reusable systems (swirl, juice, silhouette shadow, editions, dissolve, CRT) |
| Fonts | Jersey 10 (400) for all UI, a hand-made 3x5 pixel digit font in the world; m6x11 if you have it |
| Key colours | felt `#50846e`, chips blue `#009dff`, mult red `#fe5f55`, money gold `#f3b958`, orange `#fda200`, tarot `#a782d1`, card white `#ffffff` / edge `#bfc7d5`, panel `#3a5055` / `#26353a`, ink `#24302f` |

## When to use it

- **Good fit:** card games, deck builders, dice and casino-themed projects — the vocabulary (cards, chips, tokens, decks, editions) is already there.
- **Good fit:** anything that lives on *feedback*: scoring screens, shops, reward reveals, combo counters. The juice wobble, square bursts and counter bubbles make every number feel physical.
- **Good fit:** top-down arcade action with a playful, hypnotic tone — the swirl floor gives motion even when nothing moves.
- **Good fit:** a strong retro identity on a small art budget: sprites are tiny and flat, the shaders do the heavy lifting.
- **Bad fit:** realistic, gritty or horror settings; calm painterly nature; projects that need lighting and depth.
- **Bad fit:** very text-dense interfaces where screen curvature and scanlines hurt readability (turn the CRT down there).

## Color palette

| Swatch | Hex | Role |
| --- | --- | --- |
| Felt | `#50846e` | Base colour of the table: swirl colours `x0.9` (main), `x1.3` (highlight paint), `x0.7` (deep paint) — ~75 % of the screen |
| Crimson Table | `#b44430` | Crimson table patches (swirl contrast up to 2.3) |
| Violet Table | `#8a71e1` | Violet table patches |
| Shop Teal | `#2b6e8f` | Rare teal patches |
| Chips Blue | `#009dff` | Blue counters, bar fill, blue (+) bubbles, small chip tokens; dark lip `#0067b0` |
| Mult Red | `#fe5f55` | Red counters, panel bar, red (X) bubbles, number badges, red hat flap; dark lip `#c2453e` |
| Money Gold | `#f3b958` | Coins, notches, hat band and bells, sparkles, titles; dark `#b8862f`, light `#ffe8a8` |
| Orange | `#fda200` | Second chip token colour, caption button, labels, embers; dark `#b97500` |
| Green | `#4bc292` | Third chip token colour, green chips; dark `#2e8a64` |
| Tarot Violet | `#a782d1` | Backs of flipping cards, tarot frames; dark `#6e4f96` |
| Planet Cyan | `#13afce` | The large collectible card, blue booster packs |
| Card White | `#ffffff` | Card faces, gloves, text, hit flashes |
| Card Edge | `#bfc7d5` | 1 px edge inside every card, lip of white text boxes; shade row `#e6eaf0` |
| Hearts / Diamonds | `#f03464` / `#f06b3f` | Red suit pips |
| Spades / Clubs | `#403995` / `#235955` | Dark suit pips |
| Token Crimson | `#c9473a` | Rim of the large token; inner rim `#d85a4b`, centre `#5a1e1a` |
| Card Back Red | `#da4a41` | Deck backs; lattice `#b83a33`, white frame |
| Panel | `#3a5055` | UI panels; cards in the UI `#4f6367` with lip `#374244` |
| Panel Dark | `#26353a` | Inner wells, panel lips, empty bar channels |
| Ink | `#24302f` | Sprite outlines, eyes, legs |

**Palette rules**

- The table is always **one** base colour turned into three shades (×0.9 / ×1.3 / ×0.7). A new area or moment changes the whole table colour; it never mixes unrelated hues on the floor.
- **Blue means "adds", red means "multiplies"**: blue counters and bubbles carry a `+`, red ones an `X`. Gold is only for money and reward.
- Sprites are flat saturated colours with an ink outline. The only gradients in the whole look are the swirl and the CRT.
- White cards are the brightest thing on screen; the swirl highlight stays below them.
- The UI is dark slate with white text and one saturated accent per element.

## Typography

- **Jersey 10** (Google Fonts, 400) for every piece of UI text: titles, counters, card names and body copy. It is a condensed pixel display face close to *m6x11* (Daniel Linssen, free with credit) — use m6x11 instead if you can ship the file. Sizes run large because the x-height is small: titles 75 px, big counters 42–47 px, names 29 px, body 21 px.
- Text is always **white** (or gold for titles, dark `#374244` on white description boxes) with a **hard offset shadow** `-2px 3px 0 rgba(0,0,0,.4)` — down and slightly to the left, never blurred.
- In the world, numbers are drawn by a **hand-made 3×5 bitmap font** (0–9, `+`, `X`, `$`) on the art grid, white inside a coloured bubble — never a scaled TrueType font.
- Avoid bold weights of pixel fonts that close their counters (some faces turn "C" into "O").

## Rendering technique

The art buffer is **1 art pixel per world unit** (360 units visible vertically) and is upscaled by an integer factor with nearest neighbour (3× at 900 px). Order per frame:

1. **Swirl floor** — a WebGL2 fragment shader renders the swirl for every art pixel into an offscreen canvas of exactly the art-buffer size, which is copied into the buffer with `drawImage`. Fallback: the same math on the CPU at quarter resolution, refreshed every second frame.
2. **Card zones** — dark translucent rounded rectangles from a deterministic 230-unit grid, drawn in screen space at art-pixel positions.
3. **Shadows** — for every sprite, its own black silhouette at 33 % alpha, offset down and away from the screen centre, with the sprite's rotation and scale.
4. **Sprites, y-sorted** — characters and props, rotated and scaled around their anchor *inside* the art buffer, so tilted cards stay pixel art. Juice, squash, flip (horizontal scale) and editions are applied here.
5. **Collectibles, orbiting tokens, projectiles, particles, bubbles.**
6. **Upscale** to the display, then the **CRT pass**: the finished display image is uploaded as a texture (with mipmaps for bloom) and redrawn through the CRT shader.

Baked once at init: every sprite and its mirror, 8 edition frames per prop that can carry an edition, coin spin frames, icons. Built lazily and cached: silhouettes per sprite and colour, dissolve frames per sprite and step, bubbles per text.

## World and ground

- **The swirl.** For each art pixel take its world position `w`, fold it into bounded coordinates (the swirl only works for inputs of about ±0.5, because it reads the length of the warped vector):
  `p = (0.26 sin(w.x/150) + 0.2 sin((0.6 w.x + 0.8 w.y)/131 + 1.3), 0.26 sin(w.y/150 + 0.7) + 0.2 sin((0.6 w.y − 0.8 w.x)/127 + 2.1))`.
  This is seamless, never repeats exactly and moves 1:1 with the world. Rotate `p` by `a = spin − 20 (0.25 l + 0.75)`, where `l` is the distance from the screen centre divided by 612 — this is the **twist around the middle of the screen**. Multiply by 30 and run five domain-warp iterations driven by `flow = time × 7`. The length of the warped vector gives three weights: main paint, highlight paint and deep paint.
- **Colours.** One base colour per table patch: green felt `#50846e` by default, crimson `#b44430` and violet `#8a71e1` patches (low-frequency noise at 1500–1900 units), rare teal `#2b6e8f`. The area around the origin is always felt. Swirl colours = base ×0.9 / ×1.3 / ×0.7; contrast 1.4 on felt, up to 2.3 on crimson; lighting 0.28 adds a white glint where a paint colour peaks. The live floor **eases** to the patch under the camera (rate 1.4/s), as if the whole table changed colour.
- **Card zones.** On a 230-unit grid, 30 % of the cells hold a rounded rectangle (60–116 × 44–72 units, corners cut 2 px) filled `rgba(0,0,0,.13)`. 45 % of them get a dashed white outline (3 px dashes every 6 px, alpha .13), 40 % get 2–4 empty card slots (22 × 30) at `rgba(0,0,0,.12)`. They are the only fixed marks on the floor; keep them sparse.
- **Baked chunks** (wide views, minimaps) evaluate the same swirl at rest (flow 0, no twist) every 2 × 2 art pixels with per-pixel patch colours, plus the zones.

## Characters

All characters are table objects brought to life: 1 px ink outline `#24302f`, flat colours, minimal faces, motion from springs instead of long frame sequences.

- **Main character — the walking card** (21 × 33 art px). A white playing card 15 × 19 with a 1 px `#bfc7d5` edge, corners cut by 1 px and a lighter shade row `#e6eaf0` on the right and bottom. Red plus-shaped corner pips top-left and bottom-right. Face: two ink eyes (1 × 2), pink cheeks `#f5a3a3`, a wide red grin with a white row of teeth. Arms are single ink pixels ending in 2 × 2 white glove dots; legs are 1 px ink lines with a **red** left shoe and a **blue** right shoe. On top a two-pointed **jester hat**: red flap to the left, blue flap to the right (stepped 5-row triangles), a gold band `#f3b958` with a darker lower row, 2 × 2 gold bells at the tips. 4 walk frames (each leg lifts one pixel in turn, arms swing opposite); the sprite is mirrored for facing.
- **Small creature — chip token** (17 px disc). Rim in blue, orange or green with 8 white 2 × 2 notches at radius 6.8, a white ring, a dark centre (main colour's dark shade) with two white eye bars and a short white mouth. Two frames with the notches rotated by π/8. It **hops**: height |sin(phase)| × 5, squash 1.12 × 0.86 on landing, tilt sin(phase) × 0.1.
- **Fast creature — flipping card** (13 × 18). Back: tarot violet `#a782d1` with a pale gold frame, a darker inner frame and a gold star cross. Front: white with a diamond pip and `A` corner marks. It hovers 10–12 units up, flips by scaling its width with |cos(4.2 t)| (back shown while cos < 0) and tilts with the flip.
- **Large creature — crimson token** (34 px). Rim `#c9473a`, inner rim `#d85a4b`, 12 gold 3 × 3 notches at radius 14, a gold ring, a dark centre `#5a1e1a` with one glaring eye (white ellipse, gold iris, 2 × 2 ink pupil, white glint), angry ink brows and a flat mouth. Two notch rotations and a blink frame; it sways ±0.08 rad, pulses ±2 % and four bright pixels run around its rim.
- **Reactions.** Hit: white silhouette while the flash is above 0.4 plus the juice wobble (amount 0.4). Vanish: burn dissolve (see effects) with rising embers. Appear: the dissolve in reverse with a white-to-blue edge over 0.5 s.

## Props

Table clutter placed in small clusters on a 150-unit grid (50 % of the cells), with lots of empty swirl between them:

- **Chip stacks** — 4–8 chips (16 px wide, 3 px per chip), one or two colours per stack (red, blue, white, gold, green), a darker side band with white edge stripes, a recessed top chip. Often 2–3 stacks side by side plus a **coin pile** (gold ellipses with a light centre).
- **Standing cards** — 22 × 30 playing cards (A–K, four suits) with corner ranks in the 3×5 font, pip layouts for numbers, a framed letter for faces, a big pip for aces. They sway ±0.03 rad and may carry an **edition**: 20 % foil, 12 % holographic, 10 % polychrome, 6 % negative.
- **Decks** — a red back `#da4a41` with a white frame, a darker diamond lattice and a white centre emblem, on 3–5 visible card layers of thickness.
- **Dice** — white dice in 3/4 view (top face with pips, a grey front face with a row of pips), often in pairs.
- **Tarot cards** — gold-framed with a violet border: a sun (orange rays, gold disc) or a crescent moon with stars; 40 % foil.
- **Booster packs** — 18 × 27, crimped top and bottom edges, cyan, violet or red body with a card icon; always holographic.
- **House of cards** — three tiers of leaning white cards with horizontal cards between them.

Props share the character rules: 1 px ink outline, flat colours, silhouette shadows, no contact ellipses.

## Effects and particles

- **Square particles (the signature).** A 2–3 px square in a counter colour or white that spins (±5–7 rad/s) and shrinks with `(1 − k²)` to nothing, drag 3. Bursts: 3 on an impact, 8 when something vanishes (18 for the large token), 18 for a glow-up.
- **Popup bubble.** A pill 10 px tall: blue `+N`, red `XN` or gold `$N`, a 1 px darker lower lip (colour × 0.68), a 1 px drop shadow, white 3×5 digits. It pops in with outBack during the first 20 % of its life, wobbles with the juice formula, rises 8 units and shrinks away in the last 20 %. Floating numbers use the same bubble.
- **Burn dissolve.** Per sprite a noise mask (fbm at 1/5 px scale, 22 % bias towards the edges so it burns in from the outside). A threshold sweeps from −0.08 to 1.1 in **12 cached steps**; pixels below vanish, a 0.09 wide band above is painted from pale gold `#ffe8a0` to red `#fe5f55`. 1 px embers in orange and red rise from the edge.
- **Editions** (8 frames baked per sprite, outlines stay ink):
  - **Foil** — desaturate 60 % towards a blue-silver tint, add `bands × rings` cubed (`sin((1.4u − v)·10 + t)`, `sin(24 r − t)`) in pale blue.
  - **Holographic** — a rainbow hue along `u + v` mixed in at 32–52 %, plus a bright grid on every 4th column and 5th row.
  - **Polychrome** — hue rotated by `0.45 sin(4u + t) + 0.45 cos(5v − t) + 1.4 r`, saturation at least 0.45 (white turns into rainbow).
  - **Negative** — inverted colours tinted violet with a diagonal sheen.
- **Collectibles.** Small: a gold coin that spins by width (7, 5, 3, 5 px at 8 frames/s) and bobs. Large: a cyan mini card with a planet disc in the polychrome edition, tilting ±0.15 rad, with a twinkling white plus sparkle.
- **Thrown card.** A 5 × 7 white mini card with a red cross pip, spinning at 14 rad/s, with a trail of three shrinking white and grey squares.
- **Orbiting tokens.** Alternating blue `+` and red `X` tokens (11 px) that spin by squeezing their width with |cos(5t)|.
- **Impact / vanish / collect.** Impact: 3 squares in the creature's colour + white and a 0.18 s plus-sparkle. Vanish: the burn dissolve, a square burst and a `+10` / `+5` / `X2` bubble; the large token adds an expanding dotted gold ring and a small screen shake. Collect: 2–6 gold squares, a gold sparkle, `$5` for the large collectible.
- **Glow-up.** 18 squares in gold, white, red and blue flying outward, six sparkles, an expanding dotted gold ring, a red `X2` bubble, a ring of gold squares turning around the character, and a pulse that speeds up the floor swirl.
- **Dash.** Two blue silhouettes trailing 8 units apart, three red/blue echo silhouettes left behind as particles, white squares blown backwards.

## Atmosphere and lighting

- **CRT glass** (WebGL2 over the finished display image):
  - barrel `p *= 1 + 0.045|p|² − 0.018`, black outside the curved rectangle with an 0.8 % soft edge;
  - chromatic fringe `(uv − 0.5) × 0.004` plus 0.45 px horizontally (red outward, blue inward);
  - **bloom** from two mip levels (`log2(upscale) + 1.5` and two levels above), everything over 0.3 added at 55 %;
  - **scanlines** — one cosine dip per art-pixel row, up to 20 % darker, weaker on bright pixels;
  - noise ±1.5 % on a 2 px grid, vignette `smoothstep(1.6, 0.45, r)` mixed in at 55 %, overall ×1.04.
- **Shadows** are the sprite's own silhouette in black at 33 %, offset 3 units down and `1 + (x − camera.x) × 0.025` sideways (max ±6) — a light source above the middle of the screen. Hovering things push their shadow further away.
- **Swirl energy.** Big moments add to a pulse that speeds up the flow (up to ×3) and turns the swirl; it decays at 1.8/s.
- No fog, no light maps, no colour grading: the swirl and the CRT carry the mood. Without WebGL: a scanline pattern (one dark row per art pixel at 14 %) and a radial vignette.

## UI

- **Panels**: `#3a5055`, 12 px radius, a hard lip `0 4px 0 #26353a` and a hard offset drop shadow `-3px 9px 0 rgba(0,0,0,.32)`. No borders, no blur.
- **Wells** for values: `#26353a`, 8 px radius, big white numbers with a hard shadow.
- **Bars**: a `#26353a` channel; fills are saturated pills — blue `#009dff` or red `#fe5f55` with an inner bottom shade (`inset 0 -5px 0` dark lip) and a top highlight (`inset 0 3px 0 rgba(255,255,255,.3)`).
- **Counters** sit in their own panel: gold numbers `#f3b958` with an icon token in front.
- **Cards**: `#4f6367` bodies with a `#374244` lip, a dark icon well, a white name, and a **white description box** with dark text and a `#bfc7d5` inner lip. A red circular **number badge** sits on the top-left corner. Cards **deal in** from 70 px below with 9° tilt and 0.6 scale, staggered 0.09 s, with an overshoot curve; on hover they lift 10 px, tilt −2° and scale 1.05.
- **Titles**: gold Jersey 10 with a hard shadow, slowly wobbling ±1.6° (2.4 s). Error and end titles use mult red.
- **Caption bar**: dark rounded bar with an orange pill button (`#fda200`, lip `#b97500`).
- **Icons**: the world's pixel sprites (tokens, cards, heart, coins) on an 18 px grid, scaled by whole numbers.

## Motion and animation

- **Juice** is the heartbeat of the style: `scale += A sin(50.8 t)·((0.4 − t)/0.4)³`, `rotation += A/2 sin(40.8 t)·((0.4 − t)/0.4)²`, 0.4 s. `A` = 0.35–0.45 for hits and big moments, 0.12–0.25 for small ones. Apply it to sprites, bubbles and UI.
- Main character: 4 walk frames at `anim × 1.2`, tilt `sin(anim × 0.6π) × 0.07` while walking, idle sway ±0.025 rad, breathing ±1.5 %, lean with horizontal speed (max ±0.12).
- Chip tokens hop (period π per two notch frames), flipping cards flip at 4.2 rad/s, the large token sways at `anim × 1.6`.
- Swirl: `flow = time × 7`, up to ×3 during a pulse; colours ease at 1.4/s.
- Dissolve 0.35 s in 12 steps, appear 0.5 s, particles 0.35–0.8 s, bubbles 0.8–1.0 s, sparkles 0.2 s.
- UI: deal-in 0.55 s overshoot, hover 0.2 s overshoot, title wobble 2.4 s.

## Do and don't

**Do**

- Keep every sprite on the art-pixel grid and rotate/scale it inside the low-res buffer, so tilted cards stay pixel art.
- Give every reaction the juice wobble — hits, pickups, spawns, UI hovers.
- Use the sprite's own silhouette as its shadow, offset down and away from the screen centre.
- Keep the floor one colour family and change the whole table colour for a new area or moment.
- Show values as blue (+) and red (X) bubbles and counters; gold for money.
- Let things burn away with a glowing edge instead of just disappearing.
- Finish with the CRT pass — curvature, fringe, bloom and scanlines are part of the identity.

**Don't**

- Don't use soft ellipse shadows or ambient occlusion — shadows are hard offset silhouettes.
- Don't smooth or anti-alias the art buffer; never draw sprites at a non-integer upscale.
- Don't fill the floor with detail — the swirl needs room; props come in small clusters.
- Don't mix many hues on the table at once or lay a second pattern over the swirl.
- Don't animate with long frame sequences; use springs, squash and rotation.
- Don't use thin or elegant fonts — everything is chunky pixel type with a hard shadow.
- Don't let the swirl highlight get brighter than the white cards.

## Implementation recipe

1. Set up a low-res **art buffer** (360 units tall, 1 px per unit) and upscale it by an integer factor with `imageSmoothingEnabled = false`.
2. Write the **swirl shader** (code below) and render it into an offscreen WebGL2 canvas of the buffer's size every frame; copy it into the buffer. Add the CPU fallback.
3. Build sprites from code at init: rounded card rectangles, discs with notches, 3×5 glyphs; then a **1 px ink outline** by dilating each silhouette.
4. Draw every object through one `blit(img, x, y, anchor, rotation, scaleX, scaleY)` that snaps the anchor to the art grid; draw the **silhouette shadow** with the same transform first.
5. Add the **juice** function and call it from every event (hit, spawn, pickup, hover).
6. Bake **edition frames** (8 per sprite) and the lazy **dissolve** cache (12 steps).
7. Add **square particles** and **bubbles** (3×5 digits) to every event.
8. Run the **CRT shader** over the final display image (upload, mipmaps, draw back with `globalCompositeOperation = 'copy'`).
9. Skin the UI with slate panels, hard lips and shadows, Jersey 10, blue/red pill fills and deal-in cards.

## Code

The paint swirl as a WebGL2 fragment shader (world-anchored, twisted around the screen centre):

```js
const FS_SWIRL = `#version 300 es
precision highp float;
uniform vec2 uRes, uCam;            // art-buffer size, camera world position
uniform float uS, uFlow, uSpin;     // art px per world unit, time*7, 302.2 (+ pulse)
uniform float uContrast, uLight;    // 1.4, 0.28
uniform vec3 uC1, uC2, uC3;         // base*0.9, base*1.3, base*0.7 (0..1)
out vec4 o;
void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 off = (floor(px) + 0.5 - 0.5 * uRes) / uS;          // world offset from the screen centre
  float l = length(off / 612.);
  float a = uSpin - 20. * (0.25 * l + 0.75);                // twist around the middle of the screen
  vec2 w = uCam + off;
  vec2 p = vec2(0.26 * sin(w.x / 150.) + 0.2 * sin((w.x * 0.6 + w.y * 0.8) / 131. + 1.3),
                0.26 * sin(w.y / 150. + 0.7) + 0.2 * sin((w.y * 0.6 - w.x * 0.8) / 127. + 2.1));
  vec2 uv = mat2(cos(a), sin(a), -sin(a), cos(a)) * p * 30.;
  vec2 uv2 = vec2(uv.x + uv.y);
  for (int i = 0; i < 5; i++) {
    uv2 += sin(max(uv.x, uv.y)) + uv;
    uv += 0.5 * vec2(cos(5.1123314 + 0.353 * uv2.y + uFlow * 0.131121), sin(uv2.x - 0.113 * uFlow));
    uv -= cos(uv.x + uv.y) - sin(uv.x * 0.711 - uv.y);
  }
  float cm = 0.25 * uContrast + 0.5 * 0.25 + 1.2;
  float pv = min(2., max(0., length(uv) * 0.035 * cm));
  float c1 = max(0., 1. - cm * abs(1. - pv)), c2 = max(0., 1. - cm * abs(pv)), c3 = 1. - min(1., c1 + c2);
  float lt = (uLight - 0.2) * max(c1 * 5. - 4., 0.) + uLight * max(c2 * 5. - 4., 0.);
  float b = 0.3 / uContrast;
  o = vec4(b * uC1 + (1. - b) * (uC1 * c1 + uC2 * c2 + uC3 * c3) + lt, 1.);
}`;
```

The CRT pass over the finished display image (upload the display canvas as a texture with mipmaps; `uUp` = upscale factor):

```js
const FS_CRT = `#version 300 es
precision highp float;
in vec2 vUv; uniform sampler2D uTex; uniform vec2 uRes; uniform float uTime, uUp, uMip;
out vec4 o;
float h12(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 p = vUv * 2. - 1.;
  p *= 1. + 0.045 * dot(p, p) - 0.018;
  vec2 uv = p * 0.5 + 0.5;
  vec2 e = smoothstep(vec2(0.), vec2(0.008), uv) * smoothstep(vec2(0.), vec2(0.008), 1. - uv);
  vec2 ca = (uv - 0.5) * 0.004 + vec2(0.45 / uRes.x, 0.);
  vec2 t = vec2(uv.x, 1. - uv.y), tc = vec2(ca.x, -ca.y);
  vec3 col = vec3(texture(uTex, t + tc).r, texture(uTex, t).g, texture(uTex, t - tc).b);
  vec3 bl = textureLod(uTex, t, uMip).rgb * 0.55 + textureLod(uTex, t, uMip + 2.).rgb * 0.45;
  col += max(bl - 0.3, 0.) * 0.55;
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col *= 1. - 0.2 * (0.5 + 0.5 * cos(gl_FragCoord.y / max(uUp, 2.) * 6.2831853)) * (1. - 0.55 * clamp(lum, 0., 1.));
  col += (h12(floor(gl_FragCoord.xy / 2.) + fract(uTime * 7.31) * 91.7) - 0.5) * 0.03;
  col *= mix(1., smoothstep(1.6, 0.45, length(p * vec2(0.92, 1.))), 0.55);
  o = vec4(col * 1.04 * e.x * e.y, 1.);
}`;
// per frame: gl.texImage2D(..., displayCanvas); gl.generateMipmap(...); draw; then
// displayCtx.globalCompositeOperation = 'copy'; displayCtx.drawImage(glCanvas, 0, 0);
```

Juice, blit on the art grid and the silhouette shadow:

```js
function juice(age, A) {               // age = seconds since the event
  if (age < 0 || age > 0.4) return { s: 0, r: 0 };
  const k = (0.4 - age) / 0.4;
  return { s: A * Math.sin(50.8 * age) * k * k * k, r: A * 0.5 * Math.sin(40.8 * age) * k * k };
}
function blit(ctx, img, sx, sy, ax, ay, rot, scx, scy, alpha = 1) {   // sx, sy: art-buffer pixels
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(Math.round(sx), Math.round(sy));
  ctx.rotate(rot); ctx.scale(scx, scy);
  ctx.drawImage(img, -ax, -ay);          // nearest-neighbour inside the low-res buffer
  ctx.restore();
}
function silhouette(img) {               // cache this per sprite
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
  return c;
}
function drawWithShadow(ctx, img, x, y, ax, ay, rot, s, screenCx, lift = 0) {
  const dx = Math.max(-6, Math.min(6, (x - screenCx) * 0.025)) + 1 + lift * 0.35;
  blit(ctx, silhouette(img), x + dx, y + 3 + lift, ax, ay, rot, s, s, 0.33);
  blit(ctx, img, x, y, ax, ay, rot, s, s);
}
```

The burn dissolve (mask once per sprite, frames cached per step):

```js
function dissolveFrame(img, mask, k, burn = true) {   // mask: Float32Array, fbm(x/5, y/5)*0.78 + 0.22*(1 - edgeDistance)
  const step = Math.min(11, Math.floor(k * 12)), th = ((step + 0.5) / 12) * 1.18 - 0.08;
  const [a, b] = burn ? [[255, 232, 160], [254, 95, 85]] : [[255, 255, 255], [0, 157, 255]];
  const g = img.getContext('2d'), data = g.getImageData(0, 0, img.width, img.height), d = data.data;
  for (let i = 0; i < mask.length; i++) {
    if (d[i * 4 + 3] < 20) continue;
    if (mask[i] < th) { d[i * 4 + 3] = 0; continue; }
    if (mask[i] < th + 0.09) {
      const t = (mask[i] - th) / 0.09;
      for (let c = 0; c < 3; c++) d[i * 4 + c] = a[c] + (b[c] - a[c]) * t;
      d[i * 4 + 3] = 255;
    }
  }
  const out = document.createElement('canvas'); out.width = img.width; out.height = img.height;
  out.getContext('2d').putImageData(data, 0, 0);
  return out;
}
```

## Adapting it to your project

- **Different table colour:** pass any base colour through ×0.9 / ×1.3 / ×0.7. Red/blue gives the classic menu look (`#de443b`, `#006bb4`, deep `#162325`, contrast 3.5); one colour per area or per moment (a dangerous area turns crimson) keeps the language.
- **Screen-space menus:** drop the world fold and feed screen coordinates divided by the screen diagonal straight into the twist — that is the classic hypnotic menu background.
- **Higher resolution:** keep the art buffer at 1 px per unit and raise only the upscale; never draw sprites at 1.5× or 2.5×.
- **Card-heavy screens:** give cards a 3D tilt towards the pointer (rotate the quad around its X/Y axes with a perspective divide in a vertex shader) and use the same edition shaders on the GPU.
- **Calmer variant:** lower swirl contrast to 1, turn off the twist (`l = 0`), CRT bloom 0, scanlines 10 % — still recognisably the same family.
- **Mobile:** run the swirl at half art resolution and skip the bloom mips; the rest is cheap.

## Performance notes

- Baked once: all sprites and mirrors, 8 edition frames for each standing card, tarot card and pack, coin frames, icons.
- Lazy caches: silhouettes per sprite and colour, 12 dissolve steps per sprite and mode, bubbles per text (cleared at 200).
- Per frame on the GPU: one swirl draw at art resolution (~534 × 300 px) and one CRT draw at display resolution with a texture upload and a mipmap rebuild — cheap on any GPU; most of the cost is the texture upload of the display image. One shared WebGL2 canvas serves both passes, so a page with many previews does not run out of contexts.
- Without WebGL the CPU swirl runs at quarter resolution every second frame (a few milliseconds); the CRT becomes a cached scanline pattern plus one radial gradient.
- Baked floor chunks evaluate the swirl every 2 × 2 art pixels (~16k samples per 256-unit chunk), spread over several frames.

## Copy-paste prompt

```text
Use the "Psychedelic Card Table" art style for my project:
- A Balatro-like card-table look. The floor is one slow paint swirl (domain-warped, twisted around the screen
  centre) in three shades of one table colour: base x0.9 / x1.3 / x0.7. Default green felt #50846e; whole areas
  or moments switch the table to crimson #b44430 or violet #8a71e1, easing over about a second.
- Everything else is crisp pixel art on a low-res buffer (1 px per world unit), integer upscaled, 1 px ink outline
  #24302f, flat saturated colours, rotated and scaled inside the buffer so it stays pixel art.
- Cast: a walking white playing card with a red/blue jester hat, chip tokens with faces (blue #009dff, orange
  #fda200, green #4bc292), flipping violet tarot cards #a782d1, a big crimson token with one eye.
- Props in small clusters: chip stacks, coin piles, decks with red backs, dice, standing cards, tarot cards,
  booster packs; some in foil / holographic / polychrome / negative editions (animated pixel shaders).
- Every reaction wobbles: scale += A sin(50.8t)((0.4-t)/0.4)^3, rotation += A/2 sin(40.8t)((0.4-t)/0.4)^2.
- Shadows are the sprite's own silhouette, black 33 %, offset down and away from the screen centre.
- Effects: spinning shrinking square particles, blue (+N) / red (XN) / gold ($N) bubble popups with 3x5 pixel
  digits, burn dissolves with a gold-to-red edge and embers, plus-shaped sparkles.
- Finish with a CRT pass: barrel curve, chromatic fringe, bloom, one scanline per art-pixel row, noise, vignette.
- UI: slate panels #3a5055 with a hard lip #26353a and hard offset shadow, Jersey 10 (or m6x11) in white with a
  hard shadow, blue/red pill bars, white description boxes, red number badges, cards that deal in with overshoot.
```
