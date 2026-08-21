# miwale — design system

miwale is a one-person game studio building games with AI assistance. The whale is the studio mascot: it swims through the wordmark in place of the "w", and the whole visual system is built around it — deep water, cold light, frosted glass.

The design language is **glassmorphism over deep water**: translucent, blurred panels floating on either navy-to-teal depth or a pale ice-blue surface light. Nothing is flat and nothing is heavy.

## Sources this system was built from

Provided by the user as uploads (no codebase, no Figma file, no live product):

| File | What it gave us |
| --- | --- |
| `uploads/ChatGPT Image 18. Aug. 2026, 13_32_00.png` | The **miwale GAMES** wordmark — the only real brand asset. Ink sampled at `#172449`. Extracted to `assets/`. |
| `uploads/🦷 Glassmorphism Dental Care Mobile App UI Design …jfif` | Reference for the mobile glass language: aqua gradients, pill CTAs, frosted cards on a blue field, soft 18–24px radii. |
| `uploads/Creative Portfolio Website Design Inspiration …jfif` | Reference for the desktop/web language: panel-on-panel layout, ice-white glass, hairline dividers, stat rows, thin-bordered cards. |
| `uploads/UI-kit of the meditation app.jfif` | Reference for the **component inventory and kit layout** (buttons ×4 states, fields, toggles, checkbox/radio, slider, cards, sentiment scale, chips, nav, stepper, modals, badges, progress). |

Explicit instruction from the user: **take design only, no content.** Nothing textual from the references was reused. All copy in this system is written for miwale.

Two substitutions are flagged for your review — see **Type substitution** and **Iconography** below.

## Index

| Path | What it is |
| --- | --- |
| `styles.css` | The single entry point consumers link. `@import` list only. |
| `tokens/` | `colors.css`, `typography.css`, `spacing.css`, `radius.css`, `elevation.css`, `glass.css`, `motion.css`, `fonts.css`, `base.css` |
| `components/miwale-ui.css` | Class layer the React primitives render against (`.mw-*`). |
| `components/core/` | Button, IconButton, Badge, Tag |
| `components/forms/` | Input, Textarea, Select, Checkbox, Radio, Switch, Slider |
| `components/surfaces/` | GlassCard, MediaCard, Stat, Modal |
| `components/navigation/` | Tabs, BottomNav, Stepper |
| `components/feedback/` | ProgressBar, Rating |
| `components/miwale-motion.css` | Class layer for the expressive components (keyframes, marquee, beams, glass sheen). |
| `components/text/` | TextAnimate, SplitText, TextType, NumberTicker, MorphingText, LineShadowText, StrokeText, DiaTextReveal, TextLoop, Text3DFlip, CircularText, Highlighter, MediaText, ScrollReveal |
| `components/motion/` | AnimatedBeam, Meteors, Particles, BorderBeam, Backlight, Pointer, GridBackdrop, DottedMap |
| `components/scroll/` | Marquee, HorizontalScroll, StickyStack, ScrollProgress, ScrollExpand |
| `components/playful/` | ShinyButton, InteractiveHoverButton, LiquidGlassCard, AvatarCircles, CircularProgress, ThemeToggler, DeviceFrame, QuoteCard |
| `guidelines/` | Foundation specimen cards (Colors, Type, Spacing, Brand) |
| `ui_kits/website/` | miwale.games marketing site — home, game detail, devlog |
| `ui_kits/studio_app/` | miwale Studio companion app — sign-in, home, playtest, feedback |
| `assets/` | Wordmark and mascot, light and dark variants |
| `SKILL.md` | Agent-skill entry point |

### Components

Core: **Button**, **IconButton**, **Badge**, **Tag**.
Forms: **Input**, **Textarea**, **Select**, **Checkbox**, **Radio**, **Switch**, **Slider**.
Surfaces: **GlassCard**, **MediaCard**, **Stat**, **Modal**.
Navigation: **Tabs**, **BottomNav**, **Stepper**.
Feedback: **ProgressBar**, **Rating**.

Text effects: **TextAnimate**, **SplitText**, **TextType**, **NumberTicker**, **MorphingText**, **LineShadowText**, **StrokeText**, **DiaTextReveal**, **TextLoop**, **Text3DFlip**, **CircularText**, **Highlighter**, **MediaText**, **ScrollReveal**.
Motion & backdrops: **AnimatedBeam**, **Meteors**, **Particles**, **BorderBeam**, **Backlight**, **Pointer**, **GridBackdrop**, **DottedMap**.
Scroll: **Marquee**, **HorizontalScroll**, **StickyStack**, **ScrollProgress**, **ScrollExpand**.
Playful controls: **ShinyButton**, **InteractiveHoverButton**, **LiquidGlassCard**, **AvatarCircles**, **CircularProgress**, **ThemeToggler**, **DeviceFrame**, **QuoteCard**.

The inventory follows the component families enumerated in the meditation-app UI-kit reference, which was the only source that defined a component list.

**Intentional additions** (not in any source, added because the kits need them):
- **GlassCard** — the reference sheets show glass panels everywhere but never name them as a component; miwale needs one container primitive.
- **MediaCard** — game capsules with key art are the core content unit of a games studio.
- **Stat** — the portfolio reference has a metric row; miwale's site needs the same for shipped-games numbers.

## Content fundamentals

miwale writes like a developer talking to players, not like a publisher.

**Voice.** First person plural for the studio ("we ship a build every Friday"), second person for the player ("you salvage what's left"). Never "our team is excited to announce".

**Casing.** Sentence case for every heading, button and menu item — "Play the demo", not "Play The Demo". Uppercase is reserved for two things: eyebrow labels (`DEVLOG 014`) and badges (`ALPHA`), both at 12px with 0.16em tracking.

**Sentence shape.** Short, factual, concrete. State the mechanic, the platform, the date. No hype adjectives, no "revolutionary", no exclamation marks.

- Yes: "A salvage roguelike set under 4 km of water. Twelve-minute runs, procedural wrecks."
- Yes: "Build 0.4.2 is on the beta channel. Water shader is still flickering on AMD."
- No: "Dive into an epic underwater adventure like never before!"

**Numbers stay literal** and live in JetBrains Mono when they are technical: `build 0.4.2-beta`, `seed 8813-TIDE`, `60 fps / 4.1 ms`.

**AI is described as a tool, never as magic.** "AI-assisted production, hand-tuned play." Say what it does — generates variants, drafts dialogue passes, batches asset iterations — and say a human tuned the result.

**Buttons are verbs**: "Play demo", "Join the playtest", "Read devlog", "Upload build". Never "Submit", "Click here", "Learn more →" as a lone CTA.

**Emoji: no.** Not in UI, not in headings, not in devlogs. Sentiment scales use typographic glyphs (`☺ ◡ — ◠ ☹`), status uses badges. The whale mascot carries all the personality the brand needs.

**German note.** The studio is German-speaking. When writing German copy use the informal *du*, and keep sentence case in headings the same way.

## Visual foundations

**Palette.** Three families and nothing else. **Navy** (`--navy-800: #172449`, sampled from the wordmark) for ink, solid fills and deep-water beds. **Aqua** (`--aqua-500: #17A9C4`) as the single accent — primary actions, active states, focus rings, progress fills. **Ice** cool greys for surfaces, hairlines and muted text; never neutral grey, always blue-shifted. Semantic green/amber/rose appear only in badges and validation. At most two background fields per screen.

**Two background worlds.** `--grad-surf` (pale ice light, `#F6FAFD → #E4F8FB → #DEE8F2`) for marketing pages and documents. `--grad-deep` (`#0C142B → #172449 → #0B4A5E`) for heroes, the app shell and footers. Glass panels only ever sit on one of these two, or on key art.

**Type.** Two families. Quicksand (rounded geometric, matching the wordmark's terminals) for display and headings at 600/700, tracking `-0.02em` above 32px. Manrope for all running text, labels and controls at 400/500/600. JetBrains Mono for build numbers, seeds and token names. Body copy 16px / 1.65, capped near 60 characters.

**Backgrounds and imagery.** Gradients yes — but only the two named beds, never decorative purple or rainbow gradients. No repeating patterns, no textures, no grain, no hand-drawn illustration. Key art is full-bleed inside `MediaCard` with a bottom-up navy scrim (`--scrim-deep`) rather than a solid caption bar. Image colour vibe: cold, high-contrast, teal-lit deep water; warm tones only as a small light source inside key art.

**Transparency and blur.** This is the signature. Panels use `backdrop-filter: blur(18px) saturate(1.4)` with a white fill at 34/55/72% depending on how much text they carry — more text, more opacity. Over deep water, panels invert to navy at 42/62% with a white hairline at 16%. Blur steps up to 32px for modals and dropdowns, down to 10px for small controls. Never blur a surface that sits on a flat colour: glass needs something behind it to be worth the cost.

**Borders.** One hairline, 1px, always: `--border-hairline` (`#DEE8F2`) on light, `rgba(255,255,255,.62)` on glass, `rgba(255,255,255,.16)` on dark glass. No 2px borders, no coloured left-border accents.

**Shadows.** Navy-tinted, never black: `0 8px 24px rgba(12,20,43,.10)` at rest, `0 18px 44px` on lift, `0 32px 72px` for modals. Glass panels add `inset 0 1px 0 rgba(255,255,255,.6)` — the top-edge light that makes them read as physical. Only primary actions get the aqua glow `0 10px 28px rgba(15,140,166,.28)`. Fields use an inner shadow instead of an outer one.

**Corner radii.** Generous and soft, matching the wordmark's rounded terminals: 8 / 12 / 18 / 24 / 32 / 44px, plus pills. Every control (button, chip, badge, toggle, icon button) is a full pill. Cards are 24px, page-level panels 32px, fields 12px. Never square corners.

**Cards** are frosted rectangles: 24px radius, 24px padding, 1px white hairline, `--glass-shadow`, and no header rule. Interactive cards lift 3px on hover and deepen their shadow; they never change colour.

**Hover states** lighten and lift: buttons `translateY(-1px)` plus a deeper shadow, glass fills step from 55% to 72% white, ghost buttons pick up an `--aqua-100` wash, plain icons darken from `--ice-600` to `--navy-800`. Opacity is never used as a hover effect.

**Press states** compress: `scale(.98)` for buttons, `scale(.94)` for icon buttons, and the aqua accent deepens one step to `--aqua-700`. Press is fast (90–150ms) and release is slower (220ms).

**Focus** is always the same: `0 0 0 3px rgba(63,198,220,.45)`. No outline colour changes per component.

**Animation.** Two registers, and the difference matters.

*Interface motion* — anything the user operates. Durations 90 / 150 / 220 / 360 / 560ms, `cubic-bezier(.22,.61,.36,1)` on entry, `cubic-bezier(.16,.84,.44,1)` for anything that glides (toggle knobs, sheets). Modals fade the scrim and rise 12px with a 0.98→1 scale. No bounce, no spring overshoot. Controls never animate to attract attention.

*Expressive motion* — the marketing surface. This register is deliberately playful and it is the point of the brand: light travels, text assembles itself, sections stack and slide, backgrounds move like water. It lives in `components/text/`, `/motion/`, `/scroll/` and `/playful/`, and a landing page is expected to use a lot of it (see **Expressive motion layer** below). Never inside forms, tables, the app shell or anything a player is mid-task in.

Every expressive component respects `prefers-reduced-motion: reduce` through `components/miwale-motion.css`.

**Layout.** 1200px max content width, 32px page gutters, 16px stack rhythm inside cards and 32px between sections. Panels nest: a page is a stack of glass panels, and dense content sits in a grid inside one panel rather than as loose floating cards. Fixed elements are the site header (glass, blurred, hairline at bottom on scroll) and the app's floating tab bar (16px above the safe area, 24px side inset). Nothing else pins.

**Protection.** Text over imagery is protected by the `--scrim-deep` gradient, not by capsules or solid bars. Badges over imagery use `--badge glass` instead.

## Expressive motion layer

Marketing surfaces built with this system should look **playful and experimental, never quiet**. The 32 components in `components/text/`, `/motion/`, `/scroll/` and `/playful/` exist to be used in quantity — a landing page that uses three of them is under-built.

**Baseline for a miwale landing page.** Every full page gets, at minimum:

1. A moving background bed — `Particles`, `Meteors` or `GridBackdrop` (one per section, not stacked).
2. A hero headline that assembles itself — `TextAnimate`, `StrokeText`, `MediaText` or `Text3DFlip`.
3. One scroll set piece — `HorizontalScroll`, `StickyStack` or `ScrollExpand`.
4. At least one endless band — `Marquee` with `QuoteCard`, tags or wordmarks, ideally two rows counter-running.
5. Live numbers — `NumberTicker` in every stat row.
6. `ScrollProgress` pinned to the page, and `Pointer` on the one section that deserves its own cursor.
7. Buttons from `/playful/` rather than plain `Button` on the hero and the closing CTA.

**Density rules, so "a lot" does not become noise.**
- One background effect per section. `Particles` and `Meteors` never share a section.
- One `BorderBeam` per screen — it marks the single card you want clicked.
- One scroll set piece per page. Two pinned sections in a row disorients.
- Text effects: one per heading, and never on body copy except `ScrollReveal`.
- All effect colour comes from the aqua family. No effect introduces a hue that is not in `tokens/colors.css`.
- Effects go **behind or around** content, never over text a player has to read.

**The app shell is the opposite.** `ui_kits/studio_app/` stays calm: interface motion only, plus `CircularProgress`, `Marquee` for build tickers and `DeviceFrame` for previews. Nothing that loops in the background while somebody is filing a bug report.

**Reference implementation.** `ui_kits/website/` is the worked example of the rules above:
- `Home.jsx` — hero on `GridBackdrop` + `Particles`, `MorphingText` eyebrow, `TextAnimate` + `LineShadowText` headline, `ShinyButton` pair, `AvatarCircles`, stat card ringed by `BorderBeam` with `NumberTicker` values and a `TextType` build line; `TextLoop` divider; `Pointer` over the games grid; `ScrollExpand` trailer set piece holding `StrokeText`; two counter-running `Marquee` rows of `QuoteCard`; `DottedMap` + `Meteors` reach section with `InteractiveHoverButton`; `ScrollReveal` and `CircularProgress` in the AI Lab panel.
- `Chrome.jsx` — `ScrollProgress` on the sticky header, `ShinyButton` as the header CTA, `CircularText` seal and a wordmark `Marquee` in the footer.
- `GameDetail.jsx` — `Meteors` over key art, `DiaTextReveal` title, `SplitText` lede, `Backlight` trailer plate, `BorderBeam` on the playtest panel, `CircularProgress` milestone.
- `Devlog.jsx` — `GridBackdrop` hero, `TextAnimate` headline, build-ticker `Marquee`, `Highlighter`, `TextLoop` divider, `HorizontalScroll` build history.
- `studio_app/AppHome.jsx` — the calm register: `TextType`, `NumberTicker`, `CircularProgress`, one small `Marquee` ticker, nothing else.

## Iconography

**Substituted set — flagged for review.** No icon assets were provided with the uploads, so this system uses **[Lucide](https://lucide.dev) 0.400.0** from CDN as the closest match to the thin, rounded, uniform-stroke icons in all three reference sheets.

- Stroke width **1.75**, sizes **20px** (inline, chips, fields) and **24px** (nav, toolbars). 28px only in empty states.
- `currentColor` always — icons inherit text colour and never carry their own.
- No filled icon variants, no duotone, no per-icon colour.
- Load it as `<script src="https://unpkg.com/lucide@0.400.0/dist/umd/lucide.js">` then `lucide.createIcons()`; markup is `<i data-lucide="gamepad-2">`.
- Common set in use: `home, gamepad-2, sparkles, user, search, bell, play, download, heart, share-2, settings, calendar, message-square, bug, git-branch, cpu, waves, anchor, chevron-right, plus`.
- **No emoji as icons.** Unicode glyphs are used in exactly two places: the checkbox tick (`✓`), the select caret (`▾`) and the sentiment faces in `Rating`.
- The whale mascot is not an icon. It appears at avatar/mark size only (`assets/mascot-whale.png`).

**If you have the real icon set, drop it into `assets/icons/` and this section should be rewritten.**

## Type substitution — needs your input

No font files were supplied. The wordmark is set in a rounded geometric sans that the system approximates with **Quicksand** (Google Fonts). Manrope and JetBrains Mono are deliberate picks, not guesses.

**Please send the actual wordmark font** (or name it) and this system will be updated: `tokens/typography.css` and `tokens/fonts.css` are the only files that change.

## Logo

The wordmark is the only real brand asset provided, so nothing was drawn or reconstructed. `assets/mascot-whale.png` is a crop of the whale directly out of that file, not a redraw.

- `assets/logo-wordmark.png` — navy ink, for light surfaces
- `assets/logo-wordmark-light.png` — ice ink, for deep-water surfaces
- `assets/mascot-whale.png` / `-light.png` — mascot alone
- `assets/logo-source.png` — the original upload, untouched

Clear space equals the cap height of the wordmark on all sides. Minimum width 120px. Never recolour, rotate, outline, add a glow, or place the navy version on anything darker than `--ice-200`.
