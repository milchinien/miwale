# Visitor animation v2

Scope: Castle Scaremore's Moonlit visitors only. Scene layout and game rules are unchanged.

- Eight generated transparent part atlases, two costume/face variants each.
- 6 columns × 3 rows. Each variant: normal head, frightened head, torso, upper arm, forearm/hand, thigh, shin, shoe, accessory.
- Each part is isolated into its own padded bitmap, keeping only its largest connected alpha island. No full atlas cell is drawn into the game.
- Per variant: 16 idle, 32 walk, 48 run, 16 reaction, 16 action key poses. Joint interpolation supplies smooth intermediate frames without ghosted/doubled feet.
- Two-bone legs keep near/far identity and alternate by half a cycle. Stance travel is matched to game movement. Child running cadence accounts for the smaller character scale.
- 120 ms pose transitions; reduced-motion support; precomputed far-limb shading; bounded cached sprites.
- Variants alternate as visitors first render. All eight existing gameplay kinds retain their behavior.

Use `art-preview.html` for all 16 designs, direction changes, quarter-speed playback and pause/step controls. This page does not access save data. Exact generation prompts: [PROMPTS.md](PROMPTS.md).

Validation: `node --test prototype/ghost-castle/tests/puppet-motion.test.cjs prototype/ghost-castle/tests/storybook.test.mjs` from the workspace root. Includes limb alternation/length, foot contact, loop continuity, cutout contamination, state priority, transitions and chest timeline regression tests.
