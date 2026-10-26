# Clay World — Game Art Style Spec

> Stop-motion plasticine miniature set: soft gradient-built clay figures with fingerprints, warm studio light and 12 fps boil.

Everything looks hand-rolled from modelling clay and filmed on a tabletop miniature set (think Aardman / Clay Jam). Characters are stacks of soft lumpy balls and sausages with **no outlines**: each part is lit by a warm top-left key light, darkened by inner ambient occlusion along its bottom edge, caught by a warm rim light along its top edge, covered in faint thumbprints and topped with a broad, soft specular. The ground is a set of flat clay sheets — meadow, soil, purple clay, ochre paths and sunken glossy ponds — with raised bevelled edges and a lumpy hand-pressed surface. All animation steps at 12 fps and every frame is a slightly different "boil" of the same model. The examples below use the module's cast — a main character with a round orange gourd head and a carved glowing face, two-tone root-bulb creatures with googly eyes, a glossy white floating sheet creature and a lumpy root giant with glowing cracks — but everything applies to any subject.

## At a glance

| Property | Value |
| --- | --- |
| Family | Claymation · Stop-motion plasticine |
| Mood | cozy, handmade, playful, tactile, warm |
| Best for | top-down action/arena, cozy adventure and farming, puzzle/party, casual mobile |
| Renderer | Canvas 2D, fully procedural, no image assets |
| Pixel art | No — native resolution, sprites baked at 3–5 px per world unit |
| Complexity | 5/10 — soft shapes are forgiving, but each new figure needs a few passes to read as plasticine |
| Fonts | Chewy (titles, numbers), Baloo 2 500–800 (body) |
| Key colours | meadow `#76a454`, purple clay `#806c96`, ochre path `#d6a262`, pond `#7ebad2`, pumpkin `#ee7a22`, candle `#ffd458`, plum shadow `#401a34`, panel cream `#f5ddb8` |

## When to use it

- **Good fits:** top-down action and arena games, cozy adventures, farming and village sims, party and puzzle games, kids' games, casual mobile. The soft volumes read well at 15–60 world units per character and stay friendly even with "monsters".
- **Good fits:** projects with chunky, toy-like characters and a limited cast (3–10 creature types). Each type can be a distinct colour pair.
- **Bad fits:** grim, horror or realistic projects — the warm studio light and rounded forms are inherently cute.
- **Bad fits:** pixel-precise retro games, tiny units (< 8 units tall: the shading turns to mush) or hundreds of distinct character designs (each needs hand-tuning).
- **Bad fits:** fast smooth-motion games where 12 fps stepping would feel laggy (e.g. competitive shooters).

## Color palette

| Swatch name | Hex | Role |
| --- | --- | --- |
| Meadow clay | `#76a454` | Default ground (~40% of screen); canvas clear colour `#78a854` |
| Meadow light | `#8cac5a` | Second meadow tone blended in large noise patches |
| Purple clay | `#806c96` | Dusty-purple heath patches with little groups of gravestones |
| Soil | `#986c4a` | Raised brown fields |
| Ochre path | `#d6a262` | Raised winding paths and clearings |
| Pond | `#7ebad2` | Sunken glossy water sheets |
| Pumpkin orange | `#ee7a22` | Main character's round gourd head, main accent; HUD numbers `#f07a24` |
| Overall blue | `#3c62a6` | Main character's body; pants `#344c80` |
| Scarf green | `#68ae48` | Main character's scarf; leaves `#60a246`; foliage `#609e4a` |
| Skin cream | `#f8e0ba` | Hands; shoes `#6c422a` |
| Bulb purple | `#8650ac` | Top layer of the small root-bulb creatures (variants `#b24c8e`, `#685cbe`) |
| Bulb cream | `#f4e8cc` | Body of the small root-bulb creatures (variants `#f6e2ce`, `#eee8c6`) |
| Brow plum | `#4a2852` | Eyebrows, dark accents |
| Ghost white | `#eaf0fc` | Floating sheet creature; shaded to `#96a4ce` |
| Giant mauve | `#7e5a68` | Large root giant; lumps `#6c4a5c`, `#946c76`; roots `#a07660` |
| Candle ramp | `#fff7c4` → `#ffd458` → `#ff8f22` | All glow: carved faces, cracks, cores, lanterns |
| Cavity | `#4e1606` | Inside of carved holes; cracks `#2c1218` + `#ff9a3a` |
| Plum shadow | `#401a34` | Shadow tint target; AO `rgba(58,20,40)`, contact `rgba(52,22,24)`, ground shadow `rgba(44,24,16)` |
| Warm white | `#fffbf0` | Highlight target; rim light `rgba(255,247,230)` |
| Panel cream | `#f5ddb8` | UI slabs (`#fff5e2` → `#f5ddb8` → `#e0b98a`), base `#b98654` |
| Seed gold | `#ffca40` | Small collectibles; large collectibles `#ff7c34` |

**Palette rules**

- Colours come in as RGB triples and are shaded with two helpers, never with grey:
  - `lighten(c, t) = mix(c, [255,251,240], t)` (warm white)
  - `darken(c, t) = mix(c * (1 - t), [64,26,52], t * 0.3)` (multiplied, then pulled 30%·t toward plum)
- Saturated-but-chalky toy colours. No neon, no pure `#000`, no pure `#fff` except tiny glossy dots and pupil catch-lights.
- Ground sheets stay mid-value so the glossier, brighter characters pop.
- Each creature family is a two-tone pair (dark top layer smeared over a light body) — groups read as colour clusters.
- Glow is reserved for the candle ramp, composited with `'lighter'`.
- Approx. ratio: 60% ground greens/purples, 25% character colours, 15% warm accents and cream UI.

## Typography

**Chewy** (400) — titles, HUD numbers, card names, floating numbers. <https://fonts.google.com/specimen/Chewy>
```css
font: 400 40px/1.1 'Chewy', 'Baloo 2', system-ui, sans-serif; letter-spacing: 2px; color: #f07a24;
text-shadow: 0 2px 0 #c85e1a, 0 4px 0 #a84a12, 0 5px 0 #8c3c0e, 0 9px 10px rgba(40,18,6,.45);
```

**Baloo 2** (500, 600, 700, 800) — labels, descriptions, hints. <https://fonts.google.com/specimen/Baloo+2>
```css
font: 800 12px/1.2 'Baloo 2', system-ui, sans-serif; letter-spacing: 2px; color: #9a6a44;
```

Text effects:
- **Extruded clay letters:** stack 3–5 hard `text-shadow`s 1–3 px apart in progressively darker versions of the text colour, then one soft drop shadow. Big titles (84 px) use `0 3px 0 #e08a26, 0 6px 0 #c06a1c, 0 9px 0 #9c5214, 0 11px 0 #7e4210, 0 20px 22px rgba(20,8,2,.55)` and are rotated `-2deg`.
- **Cream text on coloured clay:** `#fff6e6` with `0 1px 0 <dark>, 0 2px 0 <darker>, 0 3px 4px rgba(40,18,6,.6)`.
- **In-world floating numbers** are baked sprites: Chewy 9.5 units (13 for the large variant), a blurred dark copy 0.13 em lower, 3 stacked "side" copies (large variant `#b24a16` → `#ffa82e`), a vertical gradient face (lighten 0.45 → base → darken 0.12) and a radial white highlight clipped to the upper half with `source-atop`.

## Rendering technique

1. **Init:** choose sprite resolution `K = clamp(round(screenPxPerUnit * 1.2), 3, 5)` px per world unit (360 world units are visible vertically).
2. **Build the fingerprint tile** (192×192 px, tileable via 9 offset draws): 7 thumbprints of 5–8 concentric partial ellipses (radius 9–18 px, aspect 1.25, sweep π–1.9π) plus 12 curved tool smears. Every stroke is drawn twice: dark `rgba(70,28,20,0.1)` (0.9 px), then light `rgba(255,246,232,0.09)` 0.9 px lower.
3. **Build the ground height texture** (256×256, 2 texels per unit, tileable fBm) and convert it to a lighting modulator `MOD = (h[x-1,y-1] - h[x+1,y+1]) * 2.4 + (h - 0.5) * 0.08 + hashNoise * 0.008` — a diagonal derivative = light from the top-left.
4. **Bake every sprite** into its own canvas at K px/unit: the main character (1 stand + 8 walk poses, plus one squeezed-face hurt drawing), each creature type × 4 frames (× 3 colour variants), props (2–4 variants each), collectibles, projectile, 14 crumb balls, 14 splats, the rising mound. Each frame gets its own RNG seed (`100 + frame`, `200 + variant*10 + frame`, ...) so lumps and fingerprint offsets differ — this is the boil. A cream-tinted copy (`#fff8ec`, source-atop) and mirrored copies are stored next to each frame.
5. **Ground chunks** (256 units, ≤ 2.5 px/unit) are rendered lazily by a generator that yields every few rows: sample material fields on a 4-unit grid, per pixel compute signed distance + lit bevel/shadow, multiply by `MOD`, `putImageData`, then stamp decals with canvas paths.
6. **Per frame draw order:** ground chunks → ground overlay (additive light pool under the main character, collectible glows, splats, rising mounds) → collectibles → soft shadows of all figures/props → y-sorted props, creatures, main character (blits) → orbiting objects → projectiles → particles → floating numbers → screen overlay (vignette + top light).
7. Sprites are drawn with `drawImage` at `1/K` scale, optionally under a rotation transform. Smoothing stays ON (this is not pixel art).

## World and ground

The floor is a **tabletop of flat clay sheets** laid on top of each other, all lit by the same top-left key light `L = (-0.42, -0.907)`.

The set is **composed like a model railway table**: a calm green meadow sheet, one winding ochre path rolled to a constant width, small furrowed garden beds, dusty-purple heath patches and sunken ponds, with props grouped around these features.

- **Fields:** domain-warped fBm fields (warp ±110 units at 1/900 frequency) decide the garden beds (soil, scale 460, threshold 0.64), heath patches (purple, 420 / 0.675) and ponds (420 / 0.675). The **path** is `13 + 1.8·perlin(x/210) − |n| / |∇n|` in world units, where n is a warped 1/1500 perlin. That is half-width minus the distance to the noise's zero line, so it keeps a constant ~26-unit width and only wavers gently. A field > 0 means "inside the sheet". Later layers sit on top: meadow < soil < heath < pond < path.
- **Signed distance:** fields are sampled on a 4-unit grid and bilinearly interpolated; `dist = value / |gradient|` gives a pixel distance to the sheet edge, `ld = -(grad · L) / |grad|` with `L = (-0.42, -0.907)` gives how much the edge faces the light.
- **Raised sheet (soil, purple, path):** outside within `SW = 3.4` units → cast shadow `k = 0.4 * sh² * (0.35 + 0.65 * max(0, -ld))`; inside within `BW = 3.0` units → bevel `f = 1 + ld * 0.42 * p² + 0.09 * exp(-((p - 0.55)/0.22)²) - 0.03 * p³` (p = 1 at the edge → 0 inside). The Gaussian term is a thin bright crest just inside the edge — the "rolled lip" of a clay sheet. 1-pixel anti-aliased coverage `cov = clamp(dist + 0.5)`.
- **Sunken sheet (pond):** a darker wet bank outside (`1 - 0.1q²` over 0.7·BW), an inverted bevel inside (`1 - max(ld,0)*0.34p² + max(-ld,0)*0.16p² - 0.05p²` over 1.3·BW), and a much smoother surface (`m = 0.35`).
- **Surface lumps:** `colour * (1 + MOD * m) * tint` with m = 1 (meadow), 1.1 (soil), 1 (purple), 0.35 (pond), 0.9 (path); `tint = 1 ± 4.5%` from very low-frequency noise. Meadow blends `#76a454` ↔ `#8cac5a` by smoothstep(0.3, 0.7, noise/420).
- **Decals are composed, not sprinkled** (jittered 10-unit grid):
  - *Drifts:* the meadow's grass imprints (fans of 3–5 curved strokes, 0.65 units, alpha 0.16) and rolled green sprouts (sausage strokes 1.0 wide) only appear where a drift field `smoothstep(0.56, 0.78, noise(x/170))` is high. Large stretches of meadow stay plain modelled clay.
  - *Fringes:* sprouts line the meadow wherever it meets another sheet. Ochre pebbles line the path edges and brown pebbles the bed edges.
  - *Posies:* flowers come in posies of 4–7 (`#faf6ec`, `#f6a0b6`, `#fcd65a`, `#b096e2`, petals 0.82 units with a darker under-copy 0.2 lower, yellow bump centre), only where a sparse patch field `noise(x/110) > 0.7` peaks.
  - *Furrows:* world-aligned rows 7 units apart, gently waving, pressed into the garden beds with the modelling tool (imprint 1.0 wide, alpha 0.2). Rows continue across chunks. A few pebbles (`#b28460`, `#7e583e`, `#a0968c`, `#c4a078`), pink worms (`#e28c96`) and twigs.
  - *Heath:* rare spiral imprints; purple pebbles and tiny lilac mushrooms in drift clusters.
  - Pond: lily pads in rafts where the drift field is high (`#58964a` / `#70ae56`, 4 × 2.6 units, notch line in pond colour), ripple rings, and **studio-light reflections**: a radial white blob squashed to 0.32 height, rotated -0.18, 9–16 units wide, plus a 0.55-alpha core ellipse.
  - Path: the odd thumbprint (5 concentric partial ellipses, 0.85 units apart) and pairs of footprints.
- An **imprint** is a dark stroke `rgba(52,26,12,a)` plus a lighter stroke `rgba(255,246,222,0.95a)` at 0.6 width shifted 0.6w down; a **bump** (pebble) is a shadow ellipse offset (+0.22rx, +0.5ry), a radial gradient body and a small highlight ellipse at the upper left.
- **Ground overlays** drawn per frame: an additive warm light pool under the main character (34 × 18 units, alpha 0.16), collectible glows, temporary clay splats, clay mounds where figures rise.

## Characters

All figures are chunky toy assemblies of clay primitives painted back to front with the **clay() painter** (table below); each part casts a soft contact shadow onto the parts behind it. No outlines anywhere — silhouettes separate by value, bottom AO and the soft ground shadow.

**Main character** (~21 units wide, ~33 tall incl. stem, drawn at scale 1.06) is an assembly of ~20 clay parts painted back to front:

1. Scarf tail (two capsules r 1.5, swinging angle per frame 0.22–0.58 rad).
2. Back arm: capsule r 1.25 in body blue + cream hand ellipse 1.5 × 1.45.
3. Legs: capsules r 1.4 in `#344c80` + shoe ellipses 2.3 × 1.4 in `#6c422a`.
4. Body: lumpy blob 4.7 × 4.4 (`#3c62a6`, amt 0.08) with two pressed fold grooves; a yellow button 0.75.
5. Front arm, then the scarf ring (lump 6 × 2.3 with 4 vertical grooves).
6. Stem capsule (r 1.35, `#787434`) and a leaf (`#68a646`) with a curly tendril stroke.
7. **Head:** a round orange gourd — superellipse 10.2 × 8.4 (exponents 0.85/0.92, dents at top and bottom), `spec 0.55`, `gloss 0.7`, `lit 0.24`, `ao 0.55`, highlight at (-5.0, -4.6) radius 4.4; 4 curved rib grooves (width 0.75, alpha 0.3); carved face (two triangle eyes, a zig-zag grin) with candle light.

Proportions: head ≈ 55–60% of height, body tiny, limbs stubby (r 1.25–1.4). Feet at y = 0, origin bottom-centre.

**Animation frames:** 1 stand + **8 walk poses** (contact, down, passing, up, then the same with the legs swapped), each baked with its own lump seed. Every frame is `[back foot x, y, front foot x, y, back arm, front arm, body lift, head lift]`, computed from a pose table:
- near-foot x `[3.8, 2.2, 0, −2.2, −3.6, −1.6, 1.0, 2.8]`, lift `[0, 0, 0, 0, 0.2, 1.6, 2.1, 1.0]`; the far foot runs half a cycle behind;
- body lift `[0, −0.85, 0.45, 1.05]` twice (down is lower, up is higher);
- arms swing at `−0.78 · x / 3.8` of the **previous** frame (overlapping action);
- the heavy head takes the previous frame's lift, so it lags the body by one drawing;
- the scarf tail flutters twice per cycle (`0.44 + 0.16·sin`).

The stand frame is `[-2.1,0, 2.3,0, 0.18,-0.18, 0, 0]`. A separate hurt drawing swaps the carved face for squeezed slits and an "O" mouth. Facing = mirrored sprite.

**Small creature** (a two-tone root bulb, ~21 × 22 units, scale 0.92): three leaf blades (leafPath, length 8–10, width 2.5–2.9, centre groove), two root legs (capsules r 1.5, `#e4caa0`), a bulb body (cream base, `spec 0.35`, `lit 0.12`) with a **second clay layer smeared on top** — a wavy-bottomed purple shape painted inside the body's clip with its own AO and contact shadow. Two googly eyes (white clay balls 2.5 × 2.8 with black pupils `#1e1420` and a white catch-light), angry brow capsules (`#4a2852`, r 0.75, `cast 0.5`), a pressed frown groove (width 0.7, alpha 0.55). Three colour variants: `#8650ac`, `#b24c8e`, `#685cbe` tops. Per-instance size `0.94 + seed * 0.12`.

**Fast floating creature** (a glossy white sheet, ~20 × 24): one custom silhouette with a 3-scallop animated hem and a wispy tail, colour `#eaf0fc` shaded with `dark: #96a4ce` (cool shadow for a cool material), `spec 0.55`, `gloss 0.5`, `lit 0.3`, `rim 0.3`. Sad dark sockets `#3a3c62`, tiny white catch-lights, an "O" mouth whose height pulses. Two stubby arm ellipses. Drawn at alpha 0.84, floating 5 units up.

**Large creature** (a lumpy root giant, ~37 × 64): a 14-point lumpy body (amt 0.12, narrowing toward the top), extra lumps on shoulders and hips, capsule arms r 4.4 with three root-finger capsules, glowing **cracks** (3 strokes: `#2c1218` 1.5 → `#ff9a3a` 0.65 → `#ffe9a6` 0.25), a carved glowing core (cavity `#3a1410`, candle gradient offset +0.9 down), eyes as dark sockets with yellow `#ffc94a` irises, a jagged mouth, and an additive pulsing glow on the core. Four leaves on top.

Readability: creatures are lighter/glossier than the ground and always carry eyes; small creatures sit at ~0.6× the main character's height, large ones ~2×.

**The clay() painter** — the material illusion, in order:

| Step | What | Numbers |
| --- | --- | --- |
| Contact shadow | the shape filled with `source-atop` + shadow, so it only darkens parts already painted behind it | `rgba(52,22,24,0.42)`, blur `min(0.4R, 2.4)` units, offset `(min(0.06R,0.45), min(0.2R,1.4))` |
| Base | flat fill in the base colour, then clip to the shape | — |
| Key light | radial gradient from `(cx-0.25rx, cy-0.5ry)` r `0.04R` to `(cx+0.05rx, cy+0.05ry)` r `1.22R` | stops `0: lighten(col, 0.2)`, `0.5: col`, `1: darken(col, 0.4)` |
| Fingerprints | the 192 px tile as pattern, random offset per part (seeded) | alpha 1 (0.5–0.6 on eyes/collectibles, 0 on tiny glossy parts) |
| Inner AO | fill "big rect minus shape" (even-odd) 3000 units away; only its shadow falls back inside the clip | `rgba(58,20,40,0.5)`, blur `0.6R`, offset `(-0.1R, -0.3R)` → darkens the bottom inner edge |
| Rim light | same trick with a warm shadow | `rgba(255,247,230,0.42)`, blur `0.26R`, offset `(+0.04R, +0.12R)` → glows along the top inner edge |
| Detail | grooves, faces, carved holes, painted inside the clip | — |
| Soft specular | radial blob at `(cx-0.3rx, cy-0.52ry)` r `0.45R`, rotated -0.45 rad, scaled 1.4 × 0.8 | stops `0: rgba(255,255,252,spec)`, `0.45: spec*0.38`, `1: 0`; default spec 0.3 |
| Gloss dot (optional) | small ellipse inside the spec | `0.32 × 0.17` of spec radius, alpha `gloss` (0.4–0.85) |

Parameters per part: `lit` (key light strength), `dark` (override shadow colour), `ao`, `rim`, `spec`, `gloss`, `fp`, `cast`, `hi` (highlight position/radius).

## Props

Props use the same clay() painter and back-to-front assembly as the characters (contact shadows between parts, pressed grooves for detail, broad soft spec, glossy dots only on berries). Each prop has a fixed soft plum-brown shadow ellipse and 1–4 baked variants.

- **Trees** (4): capsule trunk r 3.4 `#865e40` with 3 grooves, 5 lumpy foliage balls r 8–11 alternating ±5 % lightness. Variants: green with red berries, lime, autumn orange, blue-green with white blossoms. Shadow 17 × 5.5.
- **Bushes** (2): 4 lumps + red or yellow berries; shadow 14 × 4.5.
- **Cattails** (2): 3–4 rolled green blades (capsules r 0.85 in `#5c9646` / `#7cac52`) and brown cattail heads `#805232` on thin stems.
- **Mushrooms** (2): dome + cream spots. **Fences** (2): capsule posts and rails with pressed grooves. **Gourds** (2) with pressed ribs. **Gravestones** (2): grey slab `#9a96a4` with a pressed cross and a chipped corner. **Hay dome** with 90 straw strokes. **Rocks** (2): 1–2 grey lumps.

**Placement is composed** (32-unit jittered grid):
- **Groves:** a woodland field `fbm(x/380)` makes groves on the meadow.
  - Inside (> 0.62): trees (40 %), mushrooms underneath (10 %) and a few bushes.
  - On the rim (0.575–0.62): bushes (30 %), the odd tree and rock.
- **Open meadow:** nearly empty (1 % trees, 1 % rocks, 0.6 % bushes).
- **Pond shores:** cattails, 55 % of the meadow cells next to water.
- **Path edges:** fences (10 %) and rocks (6 %).
- **Garden beds:** pumpkin patches where a patch field is high, a hay dome, an autumn tree at the edge.
- **Heath:** gravestones in little groups (only where a group field peaks), purple mushrooms, a blossom tree, rocks.
- A clear area of 95 units stays around the start point.

**Breeze, on twos:** trees (0.018), bushes (0.012) and cattails (0.06) skew around their base. The sway is sampled at 12 fps (`floor(t·12)/12`), so the set looks nudged by an animator between exposures. Each prop has its own phase.

## Effects and particles

- **Clay crumbs:** impacts (55% chance, 1 crumb) and disappearing figures (5 / 3 / 12 crumbs for small / floating / large) throw off baked clay balls (2 × 1.85 units, `spec 0.45`, `fp 0.6`) in the figure's colours; velocity 40–85, upward 50–110, gravity 300, drag 1.6; on ground contact they squash to 1.25 × 0.72; shrink out in the last 18% of life.
- **Splats:** a flat lumpy pancake (4.6 × 2.4, amt 0.25, `rim 0.3`) plus 3 droplets, scaled 1.05 (2.1 for large creatures), random ±0.3 rad, live 1.7–2.2 s; pop-in with outBack over 8%, fade and flatten to 50% height in the last 30%.
- **Squash-out (disappearing):** `sx × (1 + 0.7k)`, `sy × (1 - 0.8k)`, `k = outQuad(min(1, q/0.55))`, fade after 50%, cream flash copy at `0.5 × (1 - q)`.
- **Impact flash:** sprite squashes `1 + 0.16·flash` / `1 - 0.15·flash` and a cream copy is overlaid at `min(0.55, flash × 0.8)`; plus an additive white puff (`rgba(255,255,248,0.95)` → 0, size 6–9, 0.12 s).
- **Projectiles:** baked cream seed with a tapered soft streak (`rgba(255,244,214,0.75)` → 0, 11.5 units long, 3 units thick), fading in over 1/14 s, with a tiny ground shadow 6 units below; the seed "flips" with `sy = 0.6 + 0.4|cos(step)|`.
- **Collectibles:** a seed/drop shape 1.7 × 2.0 (`#ffca40`, large `#ff7c34` ×1.45) with `spec 0.7`, `gloss 0.85`, bobbing 3 ± 1 units with a tiny shadow and additive glow (r 5.5 / 9); collecting = small additive flash on the main character.
- **Celebration burst:** a 26-unit flash, 18 multi-coloured crumbs and 8 dust puffs in a ring.
- **Dash:** 3 after-image copies at alpha `0.32/i` 6 units apart along the dash, sprite stretched 1.18 × 0.9, plus beige dust puffs.
- **Rise from the ground:** figures emerge from a dark clay mound (lump 10.5 × 4.2 with a dark hole gradient `#2c160c → #6e4630`) revealed in 8 discrete row steps with a 12% wobble.
- **Dust puffs:** soft beige radial blobs (`rgba(236,214,182,0.9)`) that grow 0.6 → 1.5× and fade over 0.25–0.6 s.
- **Candle glow:** carved faces, lanterns and creature cores get an additive glow sprite pulsing ±0.08–0.1 alpha on the 12 fps step.

## Atmosphere and lighting

- **Key light:** top-left everywhere — sprite gradients, highlights, ground bevels (`L = (-0.42, -0.907)`), pebbles, UI radial gradients at `30% 18%`.
- **Shadow colour:** always plum, never grey or black — `darken()` pulls toward `#401a34`, AO `rgba(58,20,40)`, contact `rgba(52,22,24)`, ground shadows `rgba(44,24,16)`; highlights go toward warm white `#fffbf0`.
- **Figure shadows:** a radial sprite `rgba(44,24,16,0.5)` → `0.34 @ 0.45` → 0, stretched to an ellipse (main character 10.2 × 3.6, small creature 8.8 × 3.0, large creature 21 × 6.6, floating creature 6.2 × 2.3 at alpha 0.6), shifted +8% of rx to the right.
- **Warm practical lights:** additive (`'lighter'`) glow sprite `rgba(255,214,120,0.85) → rgba(255,170,70,0.35) @ 0.35 → 0` for the light pool under the main character (34 × 18, alpha 0.16), its carved face (11 × 10, alpha 0.3 ± 0.08), lanterns (12, alpha 0.45 ± 0.1), creature cores (11, alpha 0.32 ± 0.1) and collectibles.
- **Screen overlay** (one 320 × 180 sprite stretched to the screen): elliptical vignette (scaled 1 × 0.62) `rgba(70,34,16,0)` at r 70 → `0.12` at 60% → `rgba(56,26,12,0.46)` at r 215; a warm top light band `rgba(255,232,206,0.24)` → 0 over the top 19%; a faint bottom band `rgba(255,226,196,0.2)`; a whole-screen warm wash `rgba(255,186,110,0.04)`.
- **Menu backdrops:** `radial-gradient(rgba(255,206,140,.28), rgba(46,22,10,.7) 78%)` with `backdrop-filter: blur(3px) saturate(.75)`; a sombre variant adds `grayscale(.7) brightness(.7)`.

## UI

The HUD is made of the same clay: **slabs with thickness**. Panels use a cream radial gradient, an inner white top highlight, an inner brown bottom shadow, a solid 5–8 px darker base (`0 5px 0 #b98654`) for thickness and a soft drop shadow. Border radii are deliberately uneven (`26px 30px 24px 28px / 28px 24px 30px 26px`) so nothing is machine-perfect. Bars are pressed grooves (dark brown inset) with glossy pill fills and a blurred white highlight strip (red fill, or a gold variant `#fff0a8 #ffd055 #f0a52c #c97c18`). A faint thumbprint sits in a corner of each panel. Cards come in cream, green (`#cde6ae`) and lilac (`#dcc6ee`) clay; their icons are drawn with the same clay() painter at 48-unit icon space.

```css
.clay-panel { position: relative; padding: 3px 30px 9px; border-radius: 26px 30px 24px 28px / 28px 24px 30px 26px;
  background: radial-gradient(120% 140% at 30% 18%, #fff5e2 0%, #f5ddb8 45%, #e0b98a 100%);
  box-shadow: inset 0 3px 3px rgba(255,255,255,.8), inset 0 -6px 10px rgba(150,88,40,.38),
    inset 4px 0 8px rgba(255,255,255,.25), 0 5px 0 #b98654, 0 13px 18px rgba(50,24,10,.38); }
.clay-panel::after { content: ''; position: absolute; right: 9px; bottom: 7px; width: 22px; height: 27px;
  border-radius: 50%; transform: rotate(-24deg); pointer-events: none;
  background: repeating-radial-gradient(ellipse at 50% 58%, rgba(120,66,26,.2) 0 1px, rgba(255,255,255,.22) 1px 2px, rgba(0,0,0,0) 2px 3.3px);
  -webkit-mask: radial-gradient(closest-side, #000 60%, transparent); mask: radial-gradient(closest-side, #000 60%, transparent); }
.clay-number { font-family: 'Chewy', 'Baloo 2', system-ui, sans-serif; font-size: 40px; letter-spacing: 2px; color: #f07a24;
  text-shadow: 0 2px 0 #c85e1a, 0 4px 0 #a84a12, 0 5px 0 #8c3c0e, 0 9px 10px rgba(40,18,6,.45); }
.clay-bar { position: relative; width: 250px; height: 30px; border-radius: 999px; overflow: hidden;
  background: linear-gradient(180deg, #6a4430, #8a5c40 60%, #9f6e4e);
  box-shadow: inset 0 4px 7px rgba(30,12,4,.65), inset 0 -2px 2px rgba(255,220,180,.25),
    0 2px 0 rgba(255,236,210,.35), 0 8px 12px rgba(40,20,8,.32); }
.clay-bar > .fill { height: 100%; border-radius: 999px;
  background: linear-gradient(180deg, #ffab8f 0%, #f2613f 36%, #d23e26 72%, #a92c18 100%);   /* gold variant: #fff0a8 #ffd055 #f0a52c #c97c18 */
  box-shadow: inset 0 -4px 5px rgba(90,18,4,.45), inset 0 2px 2px rgba(255,220,200,.6); }
.clay-bar > .fill::after { content: ''; position: absolute; left: 12px; right: 16px; top: 5px; height: 5px;
  border-radius: 4px; background: rgba(255,255,255,.55); filter: blur(1px); }
.clay-button { border-radius: 999px; padding: 6px 26px 8px; color: #fff6e6; font-family: 'Chewy', sans-serif; font-size: 24px;
  background: radial-gradient(circle at 36% 30%, #ffc988, #f08a3a 60%, #c9621e); text-shadow: 0 2px 0 #9c4a16;
  box-shadow: inset 0 3px 3px rgba(255,255,255,.55), inset 0 -4px 6px rgba(120,40,0,.4), 0 5px 0 #9c4a16, 0 12px 16px rgba(20,8,2,.45); }
@keyframes clayWobble { 0%,100% { transform: none } 33% { transform: translate(-3px,1px) scale(1.04,.95) } 66% { transform: translate(3px,-1px) scale(.97,1.03) } }
@keyframes clayPop { 0% { transform: scale(.3,.1) rotate(-6deg); } 50% { transform: scale(1.15,.85) rotate(-1deg); }
  75% { transform: scale(.95,1.06) rotate(-3deg); } 100% { transform: scale(1) rotate(-2deg); } }
/* use with steps(): animation: clayPop .5s steps(6) backwards;  alert: clayWobble .26s steps(3) */
```

## Motion and animation

- **12 fps everything (on twos):** `step = Math.floor(t * 12)`; positions of bobs/pulses use `Math.floor(t * 12) / 12`. Removal sequences step at 40 steps per sequence.
- **Boil:** per step, `bj = hash(step, seed) - 0.5` → `sx *= 1 + bj*0.02`, `sy *= 1 - bj*0.018`, `rot += bj2*0.025` (main character) / `0.035`, `0.03`, `0.04` (creatures). Combined with per-frame seeded bakes this makes the clay "breathe" like re-sculpted stop-motion.
- **Main character walk:** 8 drawn poses at `frame = 1 + (floor(anim · 1.3) & 7)` (12 fps at walking speed). The down poses squash `1.045 × 0.955` at draw time, the up poses stretch `0.975 × 1.03`; lean `0.035 × facing`. Arms one drawing behind the legs, the head one drawing behind the body. Idle breathes `sy = 1 + 0.025·sin(floor(t*6)/6 * 2.8)`. Action squash up to 5 %, celebration wobble ±16 %, impact squash 15 % wide.
- **Small creature hop (8 steps at 12 fps, 4 boiled drawings held on twos, own phase per creature):**
  - steps: crouch, take-off stretch, rise, apex, fall, fall stretch, landing squash, settle;
  - air `[0, 0.5, 0.92, 1, 0.7, 0.25, 0, 0] × 2.8` units;
  - squash `[0.8, −0.6, −0.25, 0.05, −0.15, −0.45, 1.0, 0.35]` (width × (1 + 0.085·s), height × (1 − 0.095·s));
  - tilt up to ±0.08 rad.
- **Large creature:** 4-frame stomp; odd frames lift 1.4 units and stretch 2 %, even frames squash 1.08 × 0.92 (heavy contact); rock ±0.035.
- **Floating creature:** hover `5 + sin(th)·1.6 + sin(2th + 0.7)·0.45` units on twos, stretching 4.5 % while it rises and squashing while it sinks; tilt `clamp(vx/60) * 0.14`.
- **Hit (~0.5 s):** a thumb-press dent that springs back, stepped at 24 fps.
  - Spring: `w = e^(−9t)·cos(26t)`, width × (1 + 0.24w), height × (1 − 0.22w).
  - The body tilts 0.28 rad away from the blow, decaying `e^(−8t)`.
  - The pale clay flash copy is laid on top at `min(0.85, flash·1.3)`.
- **Removal (deathT 0 → 1, 0.35 s in motion):**
  - *Squish:* the creature stretches up in anticipation (height +16 %, 0–0.12), then is pressed flat by an invisible thumb with a little twist (width 1.9, height 0.2, 0.12–0.3). The clay disc then shivers and sinks into the set (0.3–1).
  - *Ghosts:* puff up in the pale flash, then slump, spread and melt into a puddle that fades.
  - Clay crumbs (0.8 s) and a splat decal (1.7–2.2 s) carry the residue.
- **Spawn:** a clay mound swells (outBack), the creature rises out of the ground row by row (8 visible steps) with a wobble, and the mound shrinks away; ghosts fade up out of it.
- **Collectibles:** bob `3 + sin(q*4 + seed*20)` units; when collected they hop `sin(πt)·9` and pop with outBack.
- **Floating numbers:** pop 0.4 → 1.25 → 1 with an extra horizontal squash in the first 22 % of life, shrink to 40 % and fade at the end, rotated ±0.125 rad.
- **Camera:** impacts squash sprites, never shake them; only big bursts shake the camera (3 units).
- UI animations use `steps()` timing; never ease smoothly.

## Do and don't

**Do**
- Paint every shape with the clay() painter (base → key-light radial → fingerprints → inner AO → rim → detail → soft spec).
- Assemble figures back to front so each part casts a soft contact shadow on what lies behind.
- Press details in as grooves (dark furrow + light lip 0.55w lower).
- Step all animation at 12 fps and bake each frame with its own seed.
- Keep the light top-left on sprites, ground bevels, pebbles and UI gradients alike.
- Use lumpy 11-point blobs for organic forms and keep proportions chunky and toy-like.
- Reserve the candle glow ramp for important/magical things and add it with `'lighter'`.

**Don't**
- Don't draw outlines or ink lines — it becomes cartoon vector art.
- Don't use hard cel bands or black/grey shadows; shadows are soft and plum.
- Don't tween smoothly at 60 fps.
- Don't use perfect geometric circles for bodies, foliage or rocks.
- Don't add strong grain/noise overlays; texture is faint fingerprints and lumps only.
- Don't use tiny hard highlights everywhere (that is plastic/candy); clay spec is broad, only heads and berries get a glossy dot.
- Don't use neon or fully saturated hues.

## Implementation recipe

1. Set a world unit scale: e.g. 360 units of screen height; main character ≈ 21 × 33 units with feet at the origin.
2. Implement `lighten`, `darken` (toward `#fffbf0` / `#401a34`), a seeded RNG and a 2D hash.
3. Build the fingerprint tile (192 px) once.
4. Implement the `clay(ctx, shapeFn, colour, opts)` painter exactly as in the table under *Characters*, with `PK` = px per unit of the target canvas.
5. Add primitives: ellipse, capsule, lumpy blob (`lumpPts` 11 points, amt 0.06–0.25 + `blobPath` Catmull-Rom), and custom silhouettes; wrap them as `cE`, `cCap`, `cLump`.
6. Add `groove`, `eye` and `carve` helpers.
7. Design each character as an ordered list of parts (back limbs → body → front limbs → head → face). Give the head the strongest spec + gloss. Define 4 walk frames as small tables of foot/arm positions.
8. Bake every frame of every figure to a canvas at `K = clamp(round(pxPerUnit*1.2), 3, 5)` with a unique seed; store mirrored and cream-flash copies.
9. Build the ground: define material fields (noise or hand-painted masks), compute SDF bevel/shadow per pixel, multiply by the lumpy height modulator, then stamp decals. Cache in chunks.
10. Per frame: ground → ground glows/splats → shadows → y-sorted sprites (with 12 fps boil transforms) → projectiles → particles → numbers → vignette overlay.
11. Implement juice: crumbs, splats, squash on impacts and disappearing, cream flash, additive glows.
12. Style the HTML UI with the clay-panel CSS, Chewy extruded numbers and `steps()` animations.

## Code

The snippets below are the core techniques, ported from the module and runnable on their own. `starter.js` (next to this file) contains all of them wired together, plus the ground baker and a full preview scene; the complete reference module is [`../../js/styles/clay.js`](../../js/styles/clay.js).

```js
// Shade helpers: highlights toward warm white, shadows toward plum.
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgbS = (a, al) => al === undefined ? `rgb(${a[0] | 0},${a[1] | 0},${a[2] | 0})` : `rgba(${a[0] | 0},${a[1] | 0},${a[2] | 0},${al})`;
const lighten = (c, t) => mix(c, [255, 251, 240], t);
const darken = (c, t) => mix(c.map((v) => v * (1 - t)), [64, 26, 52], t * 0.3);
```

```js
// The plasticine painter. PK = canvas px per world unit, FPC = fingerprint tile canvas, PR = seeded rng().
function clay(c, shape, col, o) {
  const [cx, cy, rx, ry] = o.b, R = Math.max(rx, ry), base = rgbS(col);
  if (o.cast !== 0) {                                   // soft contact shadow on parts already painted
    c.save(); c.globalCompositeOperation = 'source-atop';
    c.shadowColor = `rgba(52,22,24,${o.cast || 0.42})`; c.shadowBlur = Math.min(R * 0.4, 2.4) * PK;
    c.shadowOffsetX = Math.min(R * 0.06, 0.45) * PK; c.shadowOffsetY = Math.min(R * 0.2, 1.4) * PK;
    c.fillStyle = base; c.beginPath(); shape(c); c.fill(); c.restore();
  }
  c.save(); c.beginPath(); shape(c); c.fillStyle = base; c.fill(); c.clip();
  const g = c.createRadialGradient(cx - rx * 0.25, cy - ry * 0.5, R * 0.04, cx + rx * 0.05, cy + ry * 0.05, R * 1.22);
  g.addColorStop(0, rgbS(lighten(col, o.lit ?? 0.2))); g.addColorStop(0.5, base); g.addColorStop(1, rgbS(o.dark || darken(col, 0.4)));
  c.fillStyle = g; c.fillRect(cx - R * 2.5, cy - R * 2.5, R * 5, R * 5);
  if (o.fp !== 0 && FPC) {                              // fingerprints, random offset per part
    const pat = c.createPattern(FPC, 'repeat'); pat.setTransform(new DOMMatrix([1 / PK, 0, 0, 1 / PK, PR() * 60, PR() * 60]));
    c.globalAlpha = o.fp || 1; c.fillStyle = pat; c.fillRect(cx - R * 1.6, cy - R * 1.6, R * 3.2, R * 3.2); c.globalAlpha = 1;
  }
  const OFF = 3000;                                     // inner AO + rim: blurred shadows of the shape's OUTSIDE
  c.save(); c.beginPath(); c.rect(cx - R * 3 + OFF, cy - R * 3, R * 6, R * 6); c.translate(OFF, 0); shape(c); c.translate(-OFF, 0);
  c.fillStyle = '#000';
  c.shadowColor = `rgba(58,20,40,${o.ao ?? 0.5})`; c.shadowBlur = R * 0.6 * PK;
  c.shadowOffsetX = -OFF * PK - R * 0.1 * PK; c.shadowOffsetY = -R * 0.3 * PK; c.fill('evenodd');
  if (o.rim !== 0) {
    c.shadowColor = `rgba(255,247,230,${o.rim ?? 0.42})`; c.shadowBlur = R * 0.26 * PK;
    c.shadowOffsetX = -OFF * PK + R * 0.04 * PK; c.shadowOffsetY = R * 0.12 * PK; c.fill('evenodd');
  }
  c.restore();
  if (o.detail) { c.save(); o.detail(c); c.restore(); }
  const sp = o.spec ?? 0.3;
  if (sp > 0) {                                         // broad, tilted soft specular (+ optional gloss dot)
    const h = o.hi || [cx - rx * 0.3, cy - ry * 0.52, R * 0.45];
    c.save(); c.translate(h[0], h[1]); c.rotate(-0.45); c.scale(1.4, 0.8);
    const sg = c.createRadialGradient(0, 0, 0, 0, 0, h[2]);
    sg.addColorStop(0, `rgba(255,255,252,${sp})`); sg.addColorStop(0.45, `rgba(255,253,244,${sp * 0.38})`); sg.addColorStop(1, 'rgba(255,252,240,0)');
    c.fillStyle = sg; c.beginPath(); c.arc(0, 0, h[2], 0, Math.PI * 2); c.fill();
    if (o.gloss) { c.fillStyle = `rgba(255,255,255,${o.gloss})`; c.beginPath(); c.ellipse(-h[2] * 0.1, -h[2] * 0.06, h[2] * 0.32, h[2] * 0.17, 0, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }
  c.restore();
}
```

```js
// Lumpy hand-rolled ball: 11 jittered points joined by a closed Catmull-Rom spline.
function lumpPts(cx, cy, rx, ry, n, amt, r) {
  const pts = [], ph = r() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, k = 1 + (r() - 0.5) * amt + Math.sin(a * 3 + ph) * amt * 0.25;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return pts;
}
function blobPath(c, pts) {
  const n = pts.length; c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  c.closePath();
}
// Pressed groove (ribs, folds, wood grain): dark furrow + light lip below.
function groove(c, path, w, a) {
  c.lineCap = 'round'; c.strokeStyle = `rgba(58,22,18,${a})`; c.lineWidth = w; c.beginPath(); path(c); c.stroke();
  c.save(); c.translate(0, w * 0.55); c.strokeStyle = `rgba(255,240,220,${a * 0.75})`; c.lineWidth = w * 0.5;
  c.beginPath(); path(c); c.stroke(); c.restore();
}
// Carved hole with candle light shifted down (wall thickness).
function carve(c, path, glow) {
  c.save(); c.beginPath(); path(c); c.fillStyle = '#4e1606'; c.fill(); c.clip();
  c.translate(0.15, 0.8); c.beginPath(); path(c); c.fillStyle = glow; c.fill(); c.restore();
}
```

```js
// Raised clay sheet edge, per pixel. dist = signed distance in px (>0 inside), ld = edge facing light (-1..1),
// bwPx/swPx = bevel 3.0 and shadow 3.4 world units in px. Returns new [r,g,b] over the colour underneath.
function sheetPixel(under, layer, dist, ld, bwPx, swPx) {
  let [r, g, b] = under;
  if (dist < 0.5) {                                   // cast shadow just outside the sheet
    let sh = 1 + dist / swPx;
    if (sh > 0) { sh = Math.min(1, sh); const k = 0.4 * sh * sh * (0.35 + 0.65 * Math.max(0, -ld)); r *= 1 - k; g *= 1 - k; b *= 1 - k; }
  }
  if (dist > -0.5) {                                  // lit bevel + bright crest inside the edge
    const cov = Math.min(1, dist + 0.5), p = Math.max(0, Math.min(1, 1 - dist / bwPx)), cr = (p - 0.55) / 0.22;
    const f = 1 + ld * 0.42 * p * p + 0.09 * Math.exp(-cr * cr) - 0.03 * p * p * p;
    r += (layer[0] * f - r) * cov; g += (layer[1] * f - g) * cov; b += (layer[2] * f - b) * cov;
  }
  return [r, g, b];                                   // afterwards multiply by (1 + MOD * m) for the lumpy surface
}
```


## Adapting it to your project

- **Keep fixed:** the clay() painter and its numbers, no outlines, top-left warm light, plum shadows, 12 fps stepping with boil, fingerprints, grooves for detail, raised-sheet ground with bevels, the cream clay UI slabs.
- **May change:** all hues. Swap palettes per biome (e.g. snow world: sheets `#e8eef4` / `#b8c8dc`, ice pond, but keep shadows plum-blue and highlights warm), as long as sheets stay mid-value and characters stay brighter and glossier.
- **New characters:** compose from 8–25 primitives; give each type a unique silhouette and colour pair; eyes are the main readability cue. Large creatures = more lumps + glowing cracks/core; flying ones = single smooth silhouette, cool shading, floating shadow.
- **New props:** same painter, lumpy blobs and capsules, grooves for grain, a fixed soft shadow ellipse.
- **Other genres:** side-scrollers work well — turn the ground into stacked clay strata (same bevel maths along a horizontal edge) and keep the soft shadow under figures. Puzzle games: tiles become clay slabs with the UI panel recipe.
- **Other resolutions:** keep `K` between 3 and 5 px/unit; below 3 the AO/rim blur disappears, above 5 baking costs balloon. For tiny on-screen units (< 10 units) reduce to base + key light + spec.

## Performance notes

- Never call the clay() painter per frame — it uses several `shadowBlur` fills per part. Bake everything (main character 9 poses + 1 hurt drawing, creatures 4 frames × variants, props, particles, icons) at init; the module bakes ~80 sprites in well under a second.
- Per frame cost is just `drawImage` blits + a handful of additive glow sprites + one full-screen overlay sprite (< 2 ms for hundreds of figures).
- Ground is the hot spot: per-pixel SDF + texture lookup. Render 256-unit chunks lazily with a generator (yield every 4 rows / per 128-pixel band), cap ground resolution at 2.5 px/unit, and skip per-pixel SDF work in grid cells that are fully inside or outside every sheet (classify each 4-unit cell first — the module does this and only runs the full maths near edges).
- Cache floating-number sprites per value (clear above 400 entries); wait for the Chewy font before caching.
- Clay splats are capped at 150; crumbs are pooled particles.

## Copy-paste prompt

```text
Use the Clay World art style for my project (stop-motion plasticine miniature set):
- Canvas 2D, procedural, no image assets, no outlines anywhere.
- Every body part goes through one clay() painter: flat base, radial key-light gradient from the upper-left
  (lighten 0.2 toward #fffbf0 -> base at 0.5 -> darken 0.4 toward plum #401a34 at 1.22R), a tiled faint fingerprint
  pattern, inner ambient occlusion rgba(58,20,40,0.5) along the bottom and a warm rim rgba(255,247,230,0.42) along the
  top (both made with blurred offset shadows of the shape's outside), then a broad soft specular tilted -0.45 rad.
- Characters are chunky toy assemblies of lumpy balls, capsules and blobs painted back to front; each part casts a
  soft contact shadow onto parts behind it. Big glossy heads, googly white-clay eyes or carved glowing faces.
- Details are pressed grooves (dark furrow + light lip below), never drawn lines. Props (trees, fences, rocks) the same way.
- Ground: flat clay sheets (meadow #76a454, purple #806c96, soil #986c4a, ochre path #d6a262, sunken pond #7ebad2)
  with raised bevelled edges (3 units), soft cast shadows (3.4 units), light from (-0.42,-0.907), a lumpy hand-pressed
  height texture, and imprinted decals (grass tool marks, flowers, pebbles, thumbprints, lily pads, glossy reflections).
- Warm studio lighting: soft plum-brown ellipse shadows under figures, additive candle glow (#fff7c4 -> #ffd458 -> #ff8f22),
  warm brown vignette.
- Bake all sprites once at 3-5 px per world unit, one seeded bake per animation frame (boil); animate at 12 fps steps
  with small hash jitter in scale/rotation; squash and stretch on steps and impacts; clay crumb particles and splats.
- UI: cream clay slabs with inner highlight/shadow, a solid darker base for thickness, uneven border radii, Chewy
  extruded numbers (#f07a24 with stacked darker text-shadows), Baloo 2 body text, steps() animations.
```
