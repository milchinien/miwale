# Quality bar for styles – no slop

A style in this library is copied by AIs. If it looks generic, every game built
from it looks generic. "Slop" is art that looks auto-generated: generic shapes,
noise sprinkled everywhere, random colour, stiff or floaty motion, effects that
are just coloured circles. Every style must pass this list. Judge from real
images: preview shots (`node tools/shots-styles.mjs <id>`), the stage views and
motion contact sheets (`node tools/filmstrip-styles.mjs <id> <view>`).

## Shape and design
- **Designed silhouettes.** Each actor is recognisable as a black silhouette: a
  clear head/body/limb read, one or two characterful features (a hat, a tail, a
  lantern, a horn). No "circle with eyes", no clip-art blobs.
- **Shape language.** One consistent vocabulary per style (round & soft, angular,
  geometric, ragged …), used for characters, props, UI and effects alike.
- **Detail hierarchy.** Big – medium – small: large calm areas, a few medium
  features, small details clustered where the eye should go (faces, focal
  props). Not the same detail density everywhere.
- **Variation with intent.** Props and creatures come in a few designed
  variants (2–4), not random scale/hue jitter of one shape.

## Colour and value
- **Limited, named palette** used with roles. No random rainbow.
- **Value structure first.** Actors read against the ground in greyscale; the
  main character is the clearest read on screen. Check a screenshot desaturated.
- **Shading with intent.** Hue-shift shadows/highlights (cooler shadows, warmer
  light, or whatever the medium dictates) instead of just darker/lighter or a
  muddy gradient. One light direction for the whole world.

## World
- **Composed ground.** Regions with designed edges and transitions, paths that
  lead somewhere, clusters of props near features (trees at forest edges, reeds
  by water, stones by paths). Detail at three scales.
- **No sprinkle noise.** Avoid evenly scattered dots/tufts over everything and
  visible tiling or repeating stamps.
- **Grounding.** Every standing object has contact (shadow, base, occlusion) in
  the style's own way.

## Motion – the biggest slop tell
- **Real cycles.** Walks with contact – down – passing – up poses (at least 4–8
  drawn or computed poses), weight shift, arms counter-swinging; floaters bob
  with ease, not with a plain sine on everything.
- **Principles.** Anticipation before actions (dash wind-up, spawn crouch),
  follow-through and overlapping action (scarves, ears, hair, tails, cloth lag),
  squash & stretch where the medium allows, ease-in/out (never linear).
- **Idle life.** Breathing, blinking, small fidgets on varied timings so a crowd
  does not move in lock-step (per-actor phase offsets).
- **Readable states.** Hit = a sharp reaction (flash/squash/knock-back pose)
  for 80–150 ms; death = a designed sequence (not just fade-out); spawn = an
  entrance that fits the medium.
- **Timing fits the medium.** Pixel art and hand-drawn styles animate "on twos"
  (8–12 fps) with held poses; smooth vector/3D styles interpolate.
- **Ambient motion** in the world (wind in grass/trees, water, drifting
  particles) – subtle, slower than the actors, never stealing focus.

## Effects
- **Layered.** Core flash → main shape → secondary debris → lingering residue,
  each with its own lifetime curve and easing.
- **In the medium.** Ink splats in ink styles, paper bits in paper styles, glyphs
  in text styles. No generic glowing circles unless the style is about glow.
- **Readable and short.** Big effects do not hide actors; they decay quickly.

## UI
- Same material and shape language as the world, clean typography with real
  hierarchy (title / label / value), no default-looking boxes.

## Budget
- Better, not slower: frame cost stays within ~30 % of the style's previous
  cost (`node tools/perf-styles.mjs <id>`, measured in the same session), ground
  chunks stay incremental, nothing is blurred or re-rasterised per frame that
  could be baked once.
