# Castle Scaremore

Browser game with timed scares, upgrades, quests, and a layered animated castle intro.

This repository contains **Castle Scaremore only**. Other games and video-production projects from the surrounding workspace are not part of it.

## Run locally

From this directory, run `python -m http.server 5181` (Windows: `py -m http.server 5181`), then open http://localhost:5181.

No build step is required. Save data stays in the browser's local storage. The Original / Moonlit selector switches the visual design.

## Checks

With Node.js installed, run `node --test tests/puppet-motion.test.cjs tests/storybook.test.mjs`.

`art-preview.html` previews the character animations without modifying save data.

## Project layout

- `app.js`: progression, shop, interface, and intro composition.
- `game.js`: gameplay simulation and scene rendering.
- `moonlit.*`, `storybook.*`, `puppet-*.js`: visual presentation and animation.
- `assets/`, `sfx/`: game artwork and audio.
- `tests/`: animation regression checks.

Local review screenshots in `.shots/` are excluded from version control.
