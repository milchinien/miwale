# Storybook visitors and chests

Generated with the built-in image generation tool. All final PNG assets are in this directory; no runtime dependency on the generator. Only Castle Scaremore consumes them.

## Preview and tests

Open `../../art-preview.html` through the development server (from this asset directory it is `../../art-preview.html`; server URL `/art-preview.html` when ghost-castle is the server root). No saves or currency are used by the preview.

Run `node --test ghost-castle/tests/storybook.test.mjs` from `prototype`.

## Animation contract

Eight visitor types, each with a 4 × 4 alpha sheet: 0–1 idle; 2–7 walk; 8–10 recoil/fright/recovery; 11–14 fleeing; 15 special action. Walk/run cadence follows movement phase. Both directions use the same registered frames, mirrored. Photos, patrols, refused scares and detector actions select their corresponding pose. Scare and flight take priority over earlier special actions. Reduced motion holds a readable frame per state.

Two chests, each with a 4 × 2 alpha sheet: closed, anticipation, crack, opening, opening wider, fully open, overshoot, settle. Opening lasts 680 ms; reveal follows the finished sprite animation. A per-modal guard prevents repeated purchase/roll calls. Animation makes no changes to reward odds or gem prices.

Frames are registered from alpha in `storybook.js` at load time: visitor pelvis and floor anchors use a constant sheet scale; chest body width/baseline keeps the base planted as the lid moves. The original vector rendering remains available through Original.

## Source prompts

### visitor-tourist.png

Use case: stylized-concept. Production sprite sheet for a high-quality 2D mobile haunted castle game. EXACTLY 16 full-body sprites of the SAME tourist character in a strict even 4 columns by 4 rows grid. Transparent background. Square 2048x2048 canvas if possible. Every cell same size, no grid lines, no text or labels, no floor shadows, no effects. Full character fits inside every cell with generous empty padding, feet on same baseline. Camera is side view facing RIGHT, slightly three-quarter to see face. Consistent scale, proportions, costume and lighting in ALL frames.
ART DIRECTION: confident hand-drawn European storybook animation, like a boutique hand-animated indie game. Clean tapered dark aubergine outline, flat warm matte color blocks with ONE simple shadow plane. NOT 3D, NOT glossy, NOT realistic, NOT chibi, NOT generic round baby faces. Expressive angular oval face, distinctive long nose, thick expressive eyebrows, tiny eyes, adults about 4 heads tall. Anatomically coherent hands and limbs. Charming graphic character silhouette. Palette muted burgundy, warm ochre, dusty sage, cream and charcoal violet matching a cozy haunted medieval castle.
CHARACTER: adult female tourist, warm tan skin, short wavy dark brown bob, ochre beret, cream blouse under muted rust-orange sleeveless jacket, dark plum tapered trousers, simple cream sneakers, small sage cross-body satchel. NO camera. Clear distinctive confident adult design.
Frames left-to-right row-by-row:
row1: 0 relaxed idle arms resting; 1 idle curious head tilted up; 2 walking right left foot forward contact; 3 walking right body dips passing into stride.
row2: 4 walking right legs passing under body; 5 walking right right foot forward opposite contact; 6 walking right body dips opposite stride; 7 walking right opposite passing pose.
row3: 8 startled recoil torso back eyebrows up; 9 big scared reaction arms lifted frightened open mouth; 10 recovering from fright knees bent hands still raised; 11 sprinting right full stretched stride left leg forward.
row4: 12 sprinting right passing pose left leg tucked; 13 sprinting right opposite full stretched stride right leg forward; 14 sprinting right opposite passing pose; 15 tourist unfolds and reads a small paper castle map.
Keep same character identity and costume exactly throughout. The walk and run frames must visibly alternate legs. All poses face RIGHT. NO duplicate posing. Crisp silhouette at 70 pixels high. Actual alpha transparency.

### visitor-kid.png

The attached image is ONLY a style and grid-layout reference. Generate a NEW character sheet with the different character below; match its clean 2D inked storybook style and transparent 4x4 grid exactly. Do not reproduce the female tourist.
Use case: stylized-concept. Production sprite sheet for a high-quality 2D mobile haunted castle game. EXACTLY 16 full-body sprites of the SAME tourist character in a strict even 4 columns by 4 rows grid. Transparent background. Square 2048x2048 canvas if possible. Every cell same size, no grid lines, no text or labels, no floor shadows, no effects. Full character fits inside every cell with generous empty padding, feet on same baseline. Camera is side view facing RIGHT, slightly three-quarter to see face. Consistent scale, proportions, costume and lighting in ALL frames.
ART DIRECTION: confident hand-drawn European storybook animation, like a boutique hand-animated indie game. Clean tapered dark aubergine outline, flat warm matte color blocks with ONE simple shadow plane. NOT 3D, NOT glossy, NOT realistic, NOT chibi, NOT generic round baby faces. Expressive angular oval face, distinctive long nose, thick expressive eyebrows, tiny eyes, adults about 4 heads tall. Anatomically coherent hands and limbs. Charming graphic character silhouette. Palette muted burgundy, warm ochre, dusty sage, cream and charcoal violet matching a cozy haunted medieval castle.
CHARACTER: a curious school-age boy with brown skin, tightly curled dark hair, a muted sage-green hoodie with cream cuffs, ochre shorts, plum socks and cream sneakers, holding a small pink ice cream in the near hand ONLY in frames 0 through 8 and 15. In startled and fleeing frames 9 through 14 his hands are EMPTY: he has dropped the ice cream. About 3.5 heads tall, graphic angular expressive face, not a toddler, clear consistent head and costume.
Frames left-to-right row-by-row:
row1: 0 relaxed idle arms resting; 1 idle curious head tilted up; 2 walking right left foot forward contact; 3 walking right body dips passing into stride.
row2: 4 walking right legs passing under body; 5 walking right right foot forward opposite contact; 6 walking right body dips opposite stride; 7 walking right opposite passing pose.
row3: 8 startled recoil torso back eyebrows up; 9 big scared reaction arms lifted frightened open mouth; 10 recovering from fright knees bent hands still raised; 11 sprinting right full stretched stride left leg forward.
row4: 12 sprinting right passing pose left leg tucked; 13 sprinting right opposite full stretched stride right leg forward; 14 sprinting right opposite passing pose; 15 boy looks delighted at his ice cream.
Keep same character identity and costume exactly throughout. The walk and run frames must visibly alternate legs. All poses face RIGHT. NO duplicate posing. Crisp silhouette at 70 pixels high. Actual alpha transparency.

### visitor-photographer.png

The attached image is ONLY a style and grid-layout reference. Generate a NEW character sheet with the different character below; match its clean 2D inked storybook style and transparent 4x4 grid exactly. Do not reproduce the female tourist.
Use case: stylized-concept. Production sprite sheet for a high-quality 2D mobile haunted castle game. EXACTLY 16 full-body sprites of the SAME tourist character in a strict even 4 columns by 4 rows grid. Transparent background. Square 2048x2048 canvas if possible. Every cell same size, no grid lines, no text or labels, no floor shadows, no effects. Full character fits inside every cell with generous empty padding, feet on same baseline. Camera is side view facing RIGHT, slightly three-quarter to see face. Consistent scale, proportions, costume and lighting in ALL frames.
ART DIRECTION: confident hand-drawn European storybook animation, like a boutique hand-animated indie game. Clean tapered dark aubergine outline, flat warm matte color blocks with ONE simple shadow plane. NOT 3D, NOT glossy, NOT realistic, NOT chibi, NOT generic round baby faces. Expressive angular oval face, distinctive long nose, thick expressive eyebrows, tiny eyes, adults about 4 heads tall. Anatomically coherent hands and limbs. Charming graphic character silhouette. Palette muted burgundy, warm ochre, dusty sage, cream and charcoal violet matching a cozy haunted medieval castle.
CHARACTER: a lanky middle-aged male photographer with fair skin, long angular nose, short brown beard, round dark spectacles, a muted sage fisherman bucket hat, ochre field vest over a cream long-sleeve shirt, charcoal plum trousers, brown walking shoes. A small simple black camera on a neck strap is always present, bouncing with his body. About 4 heads tall; elegant exaggerated narrow silhouette, not a baby face.
Frames left-to-right row-by-row:
row1: 0 relaxed idle arms resting; 1 idle curious head tilted up; 2 walking right left foot forward contact; 3 walking right body dips passing into stride.
row2: 4 walking right legs passing under body; 5 walking right right foot forward opposite contact; 6 walking right body dips opposite stride; 7 walking right opposite passing pose.
row3: 8 startled recoil torso back eyebrows up; 9 big scared reaction arms lifted frightened open mouth; 10 recovering from fright knees bent hands still raised; 11 sprinting right full stretched stride left leg forward.
row4: 12 sprinting right passing pose left leg tucked; 13 sprinting right opposite full stretched stride right leg forward; 14 sprinting right opposite passing pose; 15 photographer lifts camera in BOTH hands to his eye and takes a picture.
Keep same character identity and costume exactly throughout. The walk and run frames must visibly alternate legs. All poses face RIGHT. NO duplicate posing. Crisp silhouette at 70 pixels high. Actual alpha transparency.

### visitor-jogger.png

Attached sheet is ONLY a style and exact 4x4 grid reference. Create the different character specified below. Match clean hand-inked 2D storybook style and same frame order. Do not copy the reference tourist's clothing or face.
Use case: stylized-concept. Production sprite sheet for a high-quality 2D mobile haunted castle game. EXACTLY 16 full-body sprites of the SAME tourist character in a strict even 4 columns by 4 rows grid. Transparent background. Square 2048x2048 canvas if possible. Every cell same size, no grid lines, no text or labels, no floor shadows, no effects. Full character fits inside every cell with generous empty padding, feet on same baseline. Camera is side view facing RIGHT, slightly three-quarter to see face. Consistent scale, proportions, costume and lighting in ALL frames.
ART DIRECTION: confident hand-drawn European storybook animation, like a boutique hand-animated indie game. Clean tapered dark aubergine outline, flat warm matte color blocks with ONE simple shadow plane. NOT 3D, NOT glossy, NOT realistic, NOT chibi, NOT generic round baby faces. Expressive angular oval face, distinctive long nose, thick expressive eyebrows, tiny eyes, adults about 4 heads tall. Anatomically coherent hands and limbs. Charming graphic character silhouette. Palette muted burgundy, warm ochre, dusty sage, cream and charcoal violet matching a cozy haunted medieval castle.
CHARACTER: an athletic adult woman runner with medium brown skin, dark hair in a short swinging ponytail, cream sweatband, dusty burgundy track jacket with a single cream stripe on the sleeve, charcoal shorts, long cream socks and muted ochre running shoes. About 4 heads tall, lean athletic angular silhouette, long nose and expressive eyebrows. No camera, no bag, no hat.
Frames left-to-right row-by-row:
row1: 0 relaxed idle arms resting; 1 idle curious head tilted up; 2 walking right left foot forward contact; 3 walking right body dips passing into stride.
row2: 4 walking right legs passing under body; 5 walking right right foot forward opposite contact; 6 walking right body dips opposite stride; 7 walking right opposite passing pose.
row3: 8 startled recoil torso back eyebrows up; 9 big scared reaction arms lifted frightened open mouth; 10 recovering from fright knees bent hands still raised; 11 sprinting right full stretched stride left leg forward.
row4: 12 sprinting right passing pose left leg tucked; 13 sprinting right opposite full stretched stride right leg forward; 14 sprinting right opposite passing pose; 15 runner stops with hands on hips catching her breath.
Keep same character identity and costume exactly throughout. The walk and run frames must visibly alternate legs. All poses face RIGHT. NO duplicate posing. Crisp silhouette at 70 pixels high. Actual alpha transparency.

### visitor-skeptic.png

Attached sheet is ONLY a style and exact 4x4 grid reference. Create the different character specified below. Match clean hand-inked 2D storybook style and same frame order. Do not copy the reference tourist's clothing or face.
Use case: stylized-concept. Production sprite sheet for a high-quality 2D mobile haunted castle game. EXACTLY 16 full-body sprites of the SAME tourist character in a strict even 4 columns by 4 rows grid. Transparent background. Square 2048x2048 canvas if possible. Every cell same size, no grid lines, no text or labels, no floor shadows, no effects. Full character fits inside every cell with generous empty padding, feet on same baseline. Camera is side view facing RIGHT, slightly three-quarter to see face. Consistent scale, proportions, costume and lighting in ALL frames.
ART DIRECTION: confident hand-drawn European storybook animation, like a boutique hand-animated indie game. Clean tapered dark aubergine outline, flat warm matte color blocks with ONE simple shadow plane. NOT 3D, NOT glossy, NOT realistic, NOT chibi, NOT generic round baby faces. Expressive angular oval face, distinctive long nose, thick expressive eyebrows, tiny eyes, adults about 4 heads tall. Anatomically coherent hands and limbs. Charming graphic character silhouette. Palette muted burgundy, warm ochre, dusty sage, cream and charcoal violet matching a cozy haunted medieval castle.
CHARACTER: a stocky older gentleman skeptic with pale skin, swept silver hair and a pointed silver moustache, heavy arched eyebrows, angular long nose, small half-moon glasses, plum tweed sleeveless vest over a cream shirt with rolled cuffs, muted slate trousers, polished dark brown shoes. Slight belly and stout legs but no round baby face. About 4 heads tall. NO hat, NO camera, NO bag.
Frames left-to-right row-by-row:
row1: 0 relaxed idle arms resting; 1 idle curious head tilted up; 2 walking right left foot forward contact; 3 walking right body dips passing into stride.
row2: 4 walking right legs passing under body; 5 walking right right foot forward opposite contact; 6 walking right body dips opposite stride; 7 walking right opposite passing pose.
row3: 8 startled recoil torso back eyebrows up; 9 big scared reaction arms lifted frightened open mouth; 10 recovering from fright knees bent hands still raised; 11 sprinting right full stretched stride left leg forward.
row4: 12 sprinting right passing pose left leg tucked; 13 sprinting right opposite full stretched stride right leg forward; 14 sprinting right opposite passing pose; 15 skeptic folds both arms across his chest and raises one doubtful eyebrow, unimpressed.
Keep same character identity and costume exactly throughout. The walk and run frames must visibly alternate legs. All poses face RIGHT. NO duplicate posing. Crisp silhouette at 70 pixels high. Actual alpha transparency.

### visitor-police.png

Attached sheet is ONLY a style and exact 4x4 grid reference. Create the different character specified below. Match clean hand-inked 2D storybook style and same frame order. Do not copy the reference tourist's clothing or face.
Use case: stylized-concept. Production sprite sheet for a high-quality 2D mobile haunted castle game. EXACTLY 16 full-body sprites of the SAME tourist character in a strict even 4 columns by 4 rows grid. Transparent background. Square 2048x2048 canvas if possible. Every cell same size, no grid lines, no text or labels, no floor shadows, no effects. Full character fits inside every cell with generous empty padding, feet on same baseline. Camera is side view facing RIGHT, slightly three-quarter to see face. Consistent scale, proportions, costume and lighting in ALL frames.
ART DIRECTION: confident hand-drawn European storybook animation, like a boutique hand-animated indie game. Clean tapered dark aubergine outline, flat warm matte color blocks with ONE simple shadow plane. NOT 3D, NOT glossy, NOT realistic, NOT chibi, NOT generic round baby faces. Expressive angular oval face, distinctive long nose, thick expressive eyebrows, tiny eyes, adults about 4 heads tall. Anatomically coherent hands and limbs. Charming graphic character silhouette. Palette muted burgundy, warm ochre, dusty sage, cream and charcoal violet matching a cozy haunted medieval castle.
CHARACTER: a stout friendly middle-aged female castle security police officer with dark brown skin, dark navy-plum rounded peaked police cap with one small brass badge, matching navy-plum uniform jacket and trousers, cream shirt collar, simple brass badge on chest, brown belt, black shoes. Expressive firm eyebrows, distinct angular face, about 4 heads tall. No weapon, no camera, no bag.
Frames left-to-right row-by-row:
row1: 0 relaxed idle arms resting; 1 idle curious head tilted up; 2 walking right left foot forward contact; 3 walking right body dips passing into stride.
row2: 4 walking right legs passing under body; 5 walking right right foot forward opposite contact; 6 walking right body dips opposite stride; 7 walking right opposite passing pose.
row3: 8 startled recoil torso back eyebrows up; 9 big scared reaction arms lifted frightened open mouth; 10 recovering from fright knees bent hands still raised; 11 sprinting right full stretched stride left leg forward.
row4: 12 sprinting right passing pose left leg tucked; 13 sprinting right opposite full stretched stride right leg forward; 14 sprinting right opposite passing pose; 15 police officer raises one hand to shade her eyes and peers around carefully.
Keep same character identity and costume exactly throughout. The walk and run frames must visibly alternate legs. All poses face RIGHT. NO duplicate posing. Crisp silhouette at 70 pixels high. Actual alpha transparency.

### visitor-hunter.png

Attached sheet is ONLY a style and exact 4x4 grid reference. Create the different character specified below. Match clean hand-inked 2D storybook style and same frame order. Do not copy the reference tourist's clothing or face.
Use case: stylized-concept. Production sprite sheet for a high-quality 2D mobile haunted castle game. EXACTLY 16 full-body sprites of the SAME tourist character in a strict even 4 columns by 4 rows grid. Transparent background. Square 2048x2048 canvas if possible. Every cell same size, no grid lines, no text or labels, no floor shadows, no effects. Full character fits inside every cell with generous empty padding, feet on same baseline. Camera is side view facing RIGHT, slightly three-quarter to see face. Consistent scale, proportions, costume and lighting in ALL frames.
ART DIRECTION: confident hand-drawn European storybook animation, like a boutique hand-animated indie game. Clean tapered dark aubergine outline, flat warm matte color blocks with ONE simple shadow plane. NOT 3D, NOT glossy, NOT realistic, NOT chibi, NOT generic round baby faces. Expressive angular oval face, distinctive long nose, thick expressive eyebrows, tiny eyes, adults about 4 heads tall. Anatomically coherent hands and limbs. Charming graphic character silhouette. Palette muted burgundy, warm ochre, dusty sage, cream and charcoal violet matching a cozy haunted medieval castle.
CHARACTER: a wiry eccentric elderly female paranormal investigator, light olive skin, short messy silver hair, round amber goggles pushed onto forehead, sage long-sleeve utility jumpsuit with rolled cuffs, brown boots, ochre leather belt. Carries a compact brass-and-sage ghost detector nozzle in right hand connected by a short hose to a small plum backpack with a single glowing mint gauge. Tool is whimsical measuring equipment, not a realistic firearm. Angular expressive nose and narrow face, 4 heads tall.
Frames left-to-right row-by-row:
row1: 0 relaxed idle arms resting; 1 idle curious head tilted up; 2 walking right left foot forward contact; 3 walking right body dips passing into stride.
row2: 4 walking right legs passing under body; 5 walking right right foot forward opposite contact; 6 walking right body dips opposite stride; 7 walking right opposite passing pose.
row3: 8 startled recoil torso back eyebrows up; 9 big scared reaction arms lifted frightened open mouth; 10 recovering from fright knees bent hands still raised; 11 sprinting right full stretched stride left leg forward.
row4: 12 sprinting right passing pose left leg tucked; 13 sprinting right opposite full stretched stride right leg forward; 14 sprinting right opposite passing pose; 15 investigator extends ghost detector forward to scan for a ghost, focused expression.
Keep same character identity and costume exactly throughout. The walk and run frames must visibly alternate legs. All poses face RIGHT. NO duplicate posing. Crisp silhouette at 70 pixels high. Actual alpha transparency.

### visitor-royal.png

Attached sheet is ONLY a style and exact 4x4 grid reference. Create the different character specified below. Match clean hand-inked 2D storybook style and same frame order. Do not copy the reference tourist's clothing or face.
Use case: stylized-concept. Production sprite sheet for a high-quality 2D mobile haunted castle game. EXACTLY 16 full-body sprites of the SAME tourist character in a strict even 4 columns by 4 rows grid. Transparent background. Square 2048x2048 canvas if possible. Every cell same size, no grid lines, no text or labels, no floor shadows, no effects. Full character fits inside every cell with generous empty padding, feet on same baseline. Camera is side view facing RIGHT, slightly three-quarter to see face. Consistent scale, proportions, costume and lighting in ALL frames.
ART DIRECTION: confident hand-drawn European storybook animation, like a boutique hand-animated indie game. Clean tapered dark aubergine outline, flat warm matte color blocks with ONE simple shadow plane. NOT 3D, NOT glossy, NOT realistic, NOT chibi, NOT generic round baby faces. Expressive angular oval face, distinctive long nose, thick expressive eyebrows, tiny eyes, adults about 4 heads tall. Anatomically coherent hands and limbs. Charming graphic character silhouette. Palette muted burgundy, warm ochre, dusty sage, cream and charcoal violet matching a cozy haunted medieval castle.
CHARACTER: an elegant elderly male royal visitor, pale skin, groomed white beard, angular long face and proud arched eyebrows, a SMALL antique brass crown with three points, plum velvet tunic, short burgundy cape with cream collar, cream tights, simple charcoal court shoes. About 4 heads tall. Distinct dignified silhouette and poised posture. No camera, no bag.
Frames left-to-right row-by-row:
row1: 0 relaxed idle arms resting; 1 idle curious head tilted up; 2 walking right left foot forward contact; 3 walking right body dips passing into stride.
row2: 4 walking right legs passing under body; 5 walking right right foot forward opposite contact; 6 walking right body dips opposite stride; 7 walking right opposite passing pose.
row3: 8 startled recoil torso back eyebrows up; 9 big scared reaction arms lifted frightened open mouth; 10 recovering from fright knees bent hands still raised; 11 sprinting right full stretched stride left leg forward.
row4: 12 sprinting right passing pose left leg tucked; 13 sprinting right opposite full stretched stride right leg forward; 14 sprinting right opposite passing pose; 15 royal places hand on chest and lifts chin indignantly as if saying Not amused.
Keep same character identity and costume exactly throughout. The walk and run frames must visibly alternate legs. All poses face RIGHT. NO duplicate posing. Crisp silhouette at 70 pixels high. Actual alpha transparency.

### chest-crypt.png

Use case: stylized-concept. Actual production sprite sheet for a premium stylized 2D mobile haunted castle game. EXACTLY 8 sprites in a precise evenly spaced 4 columns by 2 rows grid. Transparent background, landscape 2:1 sheet. No text, no labels, no grid lines, no floor shadows, no separate sparkles or effects. The SAME chest from the SAME fixed slightly elevated three-quarter front camera in EVERY cell. Base of the box stays in exactly same position and same size throughout, centered horizontally, sitting on baseline at 86% of each cell. Generous 10% padding around sprites.
CHEST DESIGN: a compact sturdy old crypt treasure chest, warm dark walnut body with only three broad plank shapes, chunky matte aged pewter bands and softly rounded corners, one large simple ivory ghost-shaped keyhole plate. Dusty slate-violet shadows, restrained pale brass hinge pins. Simple handsome memorable silhouette, warm wood and dark silver, no jewels.
STYLE: hand-inked storybook game illustration, clean dark aubergine outer contour, broad clean flat matte color planes, one cel-shaded shadow plane and thin warm edge highlight. Absolutely no photorealism, no 3D render, no grunge texture, no noisy details, no tiny decorative lines. Beautiful simple readable silhouette at 90 pixels wide.
ANIMATION: a mechanically coherent opening animation, the lid HINGED AT THE BACK, always visibly attached to the chest. Interior very dark plum, subtle warm light at the opening; no contents visible.
Cells left to right, row by row:
0 chest fully CLOSED and resting.
1 chest still closed, tiny squash in anticipation, latch loosens.
2 lid lifted just 10 degrees leaving a thin warm light slit.
3 lid opening at 35 degrees, still on rear hinge.
4 lid opening at 65 degrees.
5 lid opening at 95 degrees fully open, top lid upright and attached, interior visible.
6 lid at 105 degrees slight overshoot, still attached to rear hinge.
7 lid at 95 degrees settled final open pose, exactly the same box as first cell.
Do not morph the chest design between frames. Keep chest base width and floor baseline EXACTLY identical in every frame. Never detach or fly off the lid. Actual alpha transparency.

### chest-royal.png

Use case: stylized-concept. Actual production sprite sheet for a premium stylized 2D mobile haunted castle game. EXACTLY 8 sprites in a precise evenly spaced 4 columns by 2 rows grid. Transparent background, landscape 2:1 sheet. No text, no labels, no grid lines, no floor shadows, no separate sparkles or effects. The SAME chest from the SAME fixed slightly elevated three-quarter front camera in EVERY cell. Base of the box stays in exactly same position and same size throughout, centered horizontally, sitting on baseline at 86% of each cell. Generous 10% padding around sprites.
CHEST DESIGN: a compact elegant royal treasure chest, muted deep burgundy enamel body, broad pale antique brass bands, softly rounded corners, ONE central simple four-point pale mint jewel set in a small crown-shaped lock plate. Dark plum shadows, cream gold edges. Simple handsome memorable silhouette, regal but restrained, no elaborate filigree or excessive gemstones.
STYLE: hand-inked storybook game illustration, clean dark aubergine outer contour, broad clean flat matte color planes, one cel-shaded shadow plane and thin warm edge highlight. Absolutely no photorealism, no 3D render, no grunge texture, no noisy details, no tiny decorative lines. Beautiful simple readable silhouette at 90 pixels wide.
ANIMATION: a mechanically coherent opening animation, the lid HINGED AT THE BACK, always visibly attached to the chest. Interior very dark plum, subtle warm light at the opening; no contents visible.
Cells left to right, row by row:
0 chest fully CLOSED and resting.
1 chest still closed, tiny squash in anticipation, latch loosens.
2 lid lifted just 10 degrees leaving a thin warm light slit.
3 lid opening at 35 degrees, still on rear hinge.
4 lid opening at 65 degrees.
5 lid opening at 95 degrees fully open, top lid upright and attached, interior visible.
6 lid at 105 degrees slight overshoot, still attached to rear hinge.
7 lid at 95 degrees settled final open pose, exactly the same box as first cell.
Do not morph the chest design between frames. Keep chest base width and floor baseline EXACTLY identical in every frame. Never detach or fly off the lid. Actual alpha transparency.
