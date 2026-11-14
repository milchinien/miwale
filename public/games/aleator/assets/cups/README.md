# Cup artwork

Thirteen transparent originals generated with built-in Imagegen. Exact prompts
are recorded in `prompts.json`; names match the cup IDs in `game.js`.

The game loads only `runtime/*-v1.png` (72 x 96), prepared with nearest-neighbor
sampling. Original PNGs are retained for future edits and never loaded by the
game. `ui/cup-art.js` caches one canvas per cup; WebGL sprites retain their
original logical size of 36 x 48. Late image loads update existing textures.

Regenerate runtime PNGs with `node tools/build-art-sprites.cjs` from the project
root. This optional build tool requires Playwright and Microsoft Edge; set
`PLAYWRIGHT_PATH` if Playwright is installed outside the project. The game has
no new runtime dependency. The same tool builds the 128 x 128 encounter PNGs.

Browser regression check: `node tests/art-browser.cjs` (also `--mobile`).
It uses a fresh profile, exercises the Codex, cup selection and all eight
in-game encounters, and prints diagnostic rendering timings. Timings depend
on hardware and are not a guaranteed speedup or a pass/fail FPS threshold.
