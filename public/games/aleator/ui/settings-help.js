// Aleator – Erklärungen zu jeder Einstellung (rechte Hälfte des Einstellungs-Fensters).
// text: feste Erklärung (immer da). shots: optionale Beispielbilder, jedes mit eigener Zeile darüber.
// Bilder: assets/settings/<name>.webp, erzeugt mit tools/settings_shots.py aus dem echten Spiel und als data: URIs
// in ui/settings-shots-data.js gepackt (das Spiel lädt diese Datei erst beim ersten Öffnen der Einstellungen).
// Schlüssel = key der Einstellungszeile; 'tab:<id>' gilt für Reiter ohne Zeilen (z. B. Controls).
(function (global) {
  'use strict';
  const shot = (name, caption) => ({ name, caption });
  const pair = (key, offCap, onCap) => [shot(key + '_off', offCap), shot(key + '_on', onCap)];

  const HELP = {
    // ── Audio ──
    master: { text: 'Turns everything up or down at once: music, sound effects and Jonny. The other sliders are mixed under this one.' },
    music: { text: 'Volume of the soundtrack. Press N at any time to skip to the next song.' },
    sfx: { text: 'Dice, coins, buttons and scoring sounds. Turn it down if the scoring rattle gets too much during long runs.' },
    voice: { text: "Jonny mumbles along while his lines type out. At 0 he is silent, but his speech bubbles still show." },
    songTitles: { text: 'When a new song starts, a small card in the bottom right corner shows its name for a few seconds. Click the card to skip the song.' },
    muteBg: { text: 'Mutes the game while its window or tab is in the background. Sound comes back as soon as you click back in.' },

    // ── Video ──
    font: {
      text: 'The pixel font for all text. Jersey 10 is the default: narrow and bold like a scoreboard. Aleator Pixel is drawn for this game. Pixelify Sans is wider and rounder.',
      shots: [shot('font_jersey10', 'Jersey 10'), shot('font_aleator', 'Aleator Pixel'), shot('font_pixelify', 'Pixelify Sans')],
    },
    crt: {
      text: 'An old TV look: curved screen, scanlines, a little glow and colour fringing on the edges. Turning it off gives a flat, sharp picture.',
      shots: pair('crt', 'Off: flat and sharp', 'On: curved tube with scanlines'),
    },
    shake: { text: 'How hard the screen shakes on big scores, busts and boss hits. Reduced keeps a small bump, Off keeps the screen still.' },
    particles: { text: 'Sparks, coins and confetti. Fewer particles look calmer and help on slow computers.' },
    fullscreen: { text: 'Fills the whole screen with the game. Esc in your browser leaves fullscreen again. Not saved, because browsers only allow it after a click.' },

    // ── Style ──
    palette: {
      text: 'The colour set for buttons, panels and the table. More palettes unlock through trophies and challenges. Locked ones show how to get them.',
      shots: [shot('palette_felt', 'Felt & Brass'), shot('palette_neon', 'Neon Night')],
    },
    background: {
      text: 'The moving pattern behind everything. It always takes its colours from the palette, so every background works with every palette.',
      shots: [shot('bg_lava', 'Lava'), shot('bg_checker', 'Checker')],
    },
    material: { text: 'The surface of your dice: matte, polished, pearl and more. Only changes how the dice look, never how they roll.' },
    studio: { text: 'Mix your own colours for the background and the interface. Text contrast adjusts itself. Opens after your first won run.' },

    // ── Look ──
    lookShadow: {
      text: 'Boxes and buttons drop a solid, dark shadow instead of a soft see-through one. Looks more like hand-placed pixel art.',
      shots: pair('lookShadow', 'Off: soft see-through shadow', 'On: hard pixel shadow'),
    },
    lookBevel: {
      text: 'Every box gets a thin light line on top and a dark line at the bottom, so it reads as a raised piece instead of a flat sticker.',
      shots: pair('lookBevel', 'Off: flat colour', 'On: light edge on top, shade at the bottom'),
    },
    lookCalm: {
      text: 'In the main menu only PLAY keeps a strong colour. The other buttons share one quiet colour, so your eye goes straight to PLAY.',
      shots: pair('lookCalm', 'Off: every button in its own colour', 'On: one bright button, the rest calm'),
    },
    lookFrame: {
      text: 'Big windows get a double frame, small rivets in the corners and a faint pixel grain in the fill, instead of a plain box with a gold line.',
      shots: pair('lookFrame', 'Off: plain box with a line', 'On: double frame, rivets and grain'),
    },
    lookTilt: {
      text: 'A few things sit slightly crooked, like they were put there by hand: menu buttons, price tags and the open tab, which also sticks out a little.',
      shots: pair('lookTilt', 'Off: everything perfectly straight', 'On: slightly crooked, hand-placed'),
    },
    lookText: {
      text: 'Rewritten menu and hint texts with a bit more character. Off brings back the plain original wording.',
      shots: pair('lookText', 'Off: original text', 'On: rewritten text'),
    },
    lookOwn: {
      text: "Aleator's own colours on the standard palette, and headings in the Aleator Pixel font. Other palettes and the Colour Studio stay as they are.",
      shots: pair('lookOwn', 'Off: standard Felt & Brass', 'On: Aleator colours and heading font'),
    },
    lookIcons: {
      text: 'Thin white borders around icons and swatches become dark pixel outlines, the way the item art itself is drawn.',
      shots: pair('lookIcons', 'Off: thin white border', 'On: dark pixel outline'),
    },
    lookButtons: {
      text: 'Buttons become thick blocks with a visible side. Hover lifts the top and it sways a little, a click pushes it down onto its base and it springs back when you let go.',
      shots: pair('lookButtons', 'Off: flat button, hovered', 'On: thick block, lifted by hover'),
    },

    // ── Gameplay ──
    speed: { text: 'How fast dice roll and scores count up. Fast and Very fast skip nothing, everything just plays quicker.' },
    tipDelay: { text: 'How long you hover before a tooltip opens. Instant opens it right away. Keep the mouse still on a tooltip to pin it and read the underlined words.' },
    textSpeed: { text: "How quickly Jonny's lines type out. Instant shows the whole line at once." },
    jonnyTalk: { text: 'How often Jonny comments in the shop and during runs. Less keeps only the important lines, Off keeps only what you need to know.' },
    reset: { text: 'Deletes trophies, unlocks, stats and play time. Runs in your save slots stay. Click twice to confirm. This cannot be undone, and it happens right away, without Apply.' },

    // ── Access ──
    cvd: {
      text: 'Shifts the game colours so they stay apart with common types of colour blindness. Pick the one that matches your eyes.',
      shots: [shot('cvd_off', 'Off'), shot('cvd_deuteranopia', 'Deuteranopia')],
    },
    shapeHints: {
      text: 'Special dice faces get a small symbol in the corner, so you can tell them apart without relying on colour.',
    },
    highContrast: {
      text: 'Darker background, stronger colours and a black outline around all text.',
      shots: pair('highContrast', 'Off', 'On'),
    },
    textSize: { text: 'Makes tooltips and the text in them larger. Large and XL also give the tooltip boxes more room.' },
    readFont: {
      text: 'Switches long texts like tooltips and descriptions to a plainer font that is easier to read. Headings keep the pixel look.',
    },
    bgMotion: { text: 'How much the background moves. Slow calms it down, Still freezes it completely.' },
    accMore: { text: 'Opens the second page with more options: background light, fewer flashes, less motion, scoring speed, Shift by clicking and photosensitive safe mode.' },
    bgBright: {
      text: 'Dims the background so the dice and text stand out more.',
      shots: [shot('bgBright_100', '100%'), shot('bgBright_40', '40%')],
    },
    noFlash: { text: 'Big flashes on scores and boss hits become a soft fade instead of a bright blink.' },
    reduceMotion: { text: 'Turns off wobbling text, bouncing buttons and the CRT noise. Dice still roll, but everything around them stays calm.' },
    skipScore: { text: 'Tap to skip: press Space or click during scoring to finish it quickly. Always fast: scoring always plays at high speed.' },
    clickShift: { text: 'Adds a Shift button. Click it, then click two dice to move one, instead of dragging. Also on the S key.' },
    photosafe: {
      text: 'One switch for a safe picture: no flashes, no CRT, no screen shake, calm background, less motion and fewer particles. While it is on, it wins over those single settings. Turn it off and your own settings come back as they were.',
    },
    accBack: { text: 'Back to the first page of the access options.' },

    // ── Reiter ohne Zeilen ──
    'tab:controls': { text: 'Every key does the same thing everywhere in the game. Tab and Enter let you play without a mouse. The focused button gets a white frame.' },
  };

  global.WG_SETTINGS_HELP = HELP;
})(typeof window !== 'undefined' ? window : globalThis);
