/* Moonlit: hand-drawn vector art, cached architecture and articulated characters.
   Presentation only: the original simulation, rewards and save data are shared. */
(() => {
  'use strict';
  // Distinct silhouette icons are scoped to the gameplay HUD. The original
  // symbols used by navigation, upgrades and every other screen stay intact.
  const sceneIcons = {
    castle: '<path fill="currentColor" stroke="none" fill-rule="evenodd" d="M2 22V8h3V4h3v4h2V2h4v6h2V4h3v4h3v14h-8v-6a2 2 0 0 0-4 0v6ZM5 11v3h2v-3Zm12 0v3h2v-3Z"/>',
    clock: '<path fill="currentColor" stroke="none" fill-rule="evenodd" d="M9 1h6v3H9ZM12 5a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-1 3h2v5l4 2-1 2-5-3Z"/><path d="m19 5 2 2" stroke-width="2.5"/>',
    moon: '<path fill="currentColor" stroke="none" d="M14 2a10 10 0 1 0 8 15C12 21 6 10 14 2ZM18 3l1.5 3.5L23 8l-3.5 1.5L18 13l-1.5-3.5L13 8l3.5-1.5Z"/>',
    tap: '<path fill="currentColor" stroke="none" d="M9 14V7a2 2 0 0 1 4 0v5l5 1q3 1 2 4l-2 5H9l-6-7q-1-3 2-3l4 4Z"/><path d="M6 6a5 5 0 0 1 10 0" stroke-width="2"/>'
  };
  const defs = document.querySelector('svg defs');
  Object.entries(sceneIcons).forEach(([name, markup]) => {
    const symbol = document.createElementNS('http://www.w3.org/2000/svg', 'symbol');
    symbol.id = `i-moonlit-${name}`;
    symbol.setAttribute('viewBox', '0 0 24 24');
    symbol.innerHTML = markup;
    defs.appendChild(symbol);
  });
  const sceneUses = [...document.querySelectorAll('#scene use')].map(el => ({el, original: el.getAttribute('href')}));
  const bar = document.createElement('aside');
  bar.className = 'design-lab';
  bar.setAttribute('aria-label', 'Designvergleich Castle Scaremore');
  bar.innerHTML = '<div class="design-lab-title">Castle Scaremore<small>Design Preview</small></div><div class="design-switch" role="group" aria-label="Design wählen"><button type="button" data-design-choice="original" aria-pressed="false">Original</button><button type="button" data-design-choice="moonlit" aria-pressed="true">Moonlit · Neu</button></div>';
  document.body.insertBefore(bar, document.getElementById('app'));
  let selected = 'moonlit';
  try { selected = localStorage.getItem('scaremore-design') === 'original' ? 'original' : 'moonlit'; } catch (_) { /* storage may be unavailable */ }
  function select(value) {
    selected = value;
    document.body.dataset.design = value;
    bar.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.designChoice === value)));
    sceneUses.forEach(({el, original}) => {
      const name = original.slice(3);
      el.setAttribute('href', value === 'moonlit' && sceneIcons[name] ? `#i-moonlit-${name}` : original);
    });
    try { localStorage.setItem('scaremore-design', value); } catch (_) { /* visual preference is optional */ }
    window.dispatchEvent(new CustomEvent('scaremore:design'));
  }
  bar.addEventListener('click', e => { const b = e.target.closest('button'); if (b) select(b.dataset.designChoice); });
  select(selected);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const assetRoot = new URL('assets/', document.currentScript.src);
  const hallImage = new Image(), knightImage = new Image();
  [hallImage, knightImage].forEach(img => {
    img.onload = () => window.dispatchEvent(new CustomEvent('scaremore:art-ready'));
  });
  hallImage.src = new URL('moonlit-hall-clear.png', assetRoot).href;
  knightImage.src = new URL('moonlit-knight.png', assetRoot).href;
  const path = (c, d, fill, stroke, width = 1) => { const p = new Path2D(d); if (fill) { c.fillStyle = fill; c.fill(p); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(p); } };
  const oval = (c, x, y, rx, ry, color) => { c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); };
  const rect = (c, x, y, w, h, r, color) => { c.fillStyle = color; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); };
  const line = (c, x, y, xx, yy, color, width = 1) => { c.strokeStyle = color; c.lineWidth = width; c.beginPath(); c.moveTo(x, y); c.lineTo(xx, yy); c.stroke(); };
  const arch = (c, x, y, w, h, fill, stroke, lw = 1) => path(c, `M${x} ${y+h}V${y+w*.55}Q${x} ${y+w*.18} ${x+w/2} ${y}Q${x+w} ${y+w*.18} ${x+w} ${y+w*.55}V${y+h}Z`, fill, stroke, lw);
  const rooms = [
    { wall: '#293e49', stone: '#3b535d', rug: '#4a6464', flag: '#526d70' },
    { wall: '#293b4c', stone: '#425769', rug: '#495879', flag: '#506687' },
    { wall: '#273d3c', stone: '#3b5350', rug: '#424f4b', flag: '#566558' },
    { wall: '#35384f', stone: '#4b506b', rug: '#615577', flag: '#76638b' },
    { wall: '#3b3d47', stone: '#595965', rug: '#74515b', flag: '#8a5a65' }
  ];

  function background(c, W, H, L, room) {
    if (hallImage.complete && hallImage.naturalWidth) {
      c.save();
      const shifts = [0, 15, 65, -25, -10];
      if (room) c.filter = `hue-rotate(${shifts[room] || 0}deg)`;
      c.drawImage(hallImage, 0, 0, W, H);
      c.restore();
      return;
    }
    const p = rooms[room] || rooms[0];
    c.save(); c.scale(W / 400, H / 360);
    rect(c, 0, 0, 400, 360, 0, '#172b36');
    // Far wall, sparse oversized masonry, and a recessed gallery.
    rect(c, 0, 0, 400, 219, 0, p.wall);
    for (let row = 0; row < 7; row++) {
      const y = row * 33;
      line(c, 0, y, 400, y, '#162c3638');
      for (let x = (row % 2) * 42; x < 400; x += 84) line(c, x, y, x, y + 33, '#162c3638');
    }
    arch(c, 115, -50, 190, 267, '#20343f', p.stone, 9);
    arch(c, 126, -39, 168, 256, null, '#a6b8b218', 2);
    // Tall, deeply inset lancet windows, with miniature distant towers.
    [80, 362].forEach((x, i) => {
      arch(c, x - 28, 49, 56, 128, '#192c39', p.stone, 7);
      arch(c, x - 21, 57, 42, 113, '#486272');
      arch(c, x - 17, 61, 34, 105, '#739295');
      oval(c, x + 3, 84, 11, 11, '#e5e9c9');
      oval(c, x + 8, 80, 10, 10, '#739295');
      path(c, `M${x-18} 164v-28l8-10 8 10v8h8v-22l8-11 8 11v42Z`, '#3c5a68');
      line(c, x, 72, x, 173, '#243c49', 3);
      line(c, x - 21, 119, x + 21, 119, '#243c49', 3);
      rect(c, x - 34, 175, 68, 7, 2, '#48606a');
      path(c, `M${x-20} 176h40l${i ? -80 : 90} 127h-79Z`, '#bfdbca09');
    });
    // Heraldry behind the knight.
    line(c, 213, 39, 283, 39, '#b4a17e', 3);
    oval(c, 211, 39, 3, 3, '#d2bc90'); oval(c, 285, 39, 3, 3, '#d2bc90');
    path(c, 'M221 40h54v113l-27 19-27-19Z', p.flag);
    path(c, 'M227 44h42v106l-21 14-21-14Z', null, '#bfd6c12c');
    path(c, 'M248 66l5 12 13 5-13 5-5 12-5-12-13-5 13-5Z', '#d1c6a1');
    path(c, 'M245 108h6m-3-3v6', null, '#d1c6a1', 1.5);
    // Stone floor and long velvet runner use broad, quiet shapes.
    rect(c, 0, 215, 400, 145, 0, '#243640');
    rect(c, 0, 211, 400, 7, 0, '#182c37');
    for (let i = 1; i <= 4; i++) line(c, 0, 216 + i*i*8.7, 400, 216 + i*i*8.7, '#a5b9b612');
    for (let i = -3; i <= 5; i++) line(c, 200 + i*36, 218, 200 + i*110, 360, '#a5b9b60c');
    rect(c, 0, 289, 400, 61, 0, p.rug);
    rect(c, 0, 289, 400, 3, 0, '#182e3977');
    line(c, 0, 298, 400, 298, '#c7c5a66b', 1.5);
    line(c, 0, 342, 400, 342, '#c7c5a66b', 1.5);
    for (let x = 14; x < 400; x += 34) path(c, `M${x} 304l3 3-3 3-3-3Z`, '#c7c5a63d');
    // Architectural middle layer: fluted piers and capitals.
    [16, 320].forEach(x => {
      rect(c, x-11, 2, 24, 216, 2, '#223640');
      rect(c, x-8, 4, 13, 206, 1, '#3b525b');
      line(c, x-5, 10, x-5, 207, '#6b81835c', 2);
      rect(c, x-16, 204, 34, 7, 2, '#40565e');
      rect(c, x-20, 211, 42, 8, 2, '#314650');
      rect(c, x-16, 15, 34, 7, 2, '#4a6067');
    });
    // Wall-mounted brass cups, flames rendered live in the next layer.
    L.torches.forEach(tx => {
      const x = tx / W * 400, y = L.torchY / H * 360;
      rect(c, x-4, y+3, 8, 22, 4, '#182c34');
      path(c, `M${x-10} ${y}h20l-5 8h-10Z`, '#b59d75');
      line(c, x, y+8, x, y+17, '#d1b583', 3);
    });
    c.restore();
  }

  function armor(c, W, H, L) {
    if (knightImage.complete && knightImage.naturalWidth) {
      const h = L.armorH * 1.27;
      const w = h * knightImage.naturalWidth / knightImage.naturalHeight;
      oval(c, L.armorX, L.armorFeet + 2, w * .31, H * .014, '#11101a55');
      c.drawImage(knightImage, L.armorX - w / 2, L.armorFeet - h, w, h);
      return;
    }
    const s = L.armorH / 100;
    c.save(); c.translate(L.armorX, L.armorFeet); c.scale(s, s);
    oval(c, 0, 5, 34, 7, '#10232c88');
    rect(c, -31, -1, 62, 7, 2, '#334a56');
    rect(c, -27, -5, 54, 6, 2, '#72878a');
    // Cape, articulated legs and sabatons.
    path(c, 'M-18-71L-25-9H24L18-71Z', '#263f4a');
    path(c, 'M-16-43l13 1-1 34h-13l-5-4 5-14Z', '#788f96', '#263c49', 1.2);
    path(c, 'M4-42l13-1 1 31-4 5H3Z', '#a0b2af', '#263c49', 1.2);
    path(c, 'M-16-27l11-1 2 5-12 2Zm20-1 13 1-1 6-12-2Z', '#c2cdc2');
    path(c, 'M-17-12h13l2 9h-22v-4Zm20 0h13l8 5v4H2Z', '#849e9f', '#263c49', 1);
    // Faceted breastplate, raised pauldrons and leather belt.
    path(c, 'M-17-76L0-81l17 5-3 29L0-40l-14-7Z', '#94abae', '#233b48', 1.5);
    path(c, 'M0-78l14 4-3 24L0-44Z', '#b6c5bc');
    path(c, 'M-14-72L0-67l14-5M0-67v20', null, '#d7ddc8', 1.2);
    path(c, 'M-17-74q-20-4-18 12l17 5 5-10Zm34 0q20-4 18 12l-17 5-5-10Z', '#91a8ac', '#263c49', 1.5);
    path(c, 'M-31-60l10 2-3 25-10-2Zm52 2 10-2 4 24-10 3Z', '#78969f', '#263c49', 1.5);
    rect(c, -15, -48, 30, 6, 1, '#536975'); rect(c, -4, -48, 8, 6, 1, '#d1bd8d');
    // Shield and sword: bold silhouettes readable at phone size.
    path(c, 'M-37-54l14-4 14 4v17q-3 13-14 18-11-5-14-18Z', '#3a5866', '#c2b78e', 1.8);
    path(c, 'M-23-52v26m-8-19h16', null, '#b9c9b6', 2);
    path(c, 'M29-49h5v38l-2.5 6-2.5-6Z', '#c1d1c9');
    line(c, 23, -50, 40, -50, '#cbb786', 3); line(c, 32, -60, 32, -50, '#927e5c', 3);
    oval(c, 32, -62, 3, 3, '#cbb786'); oval(c, 28, -52, 5, 5, '#9bb0af');
    // Visor, neck guard and a swept plume.
    path(c, 'M-6-99q-9-16 6-19 14-1 16-9 6 18-11 21l-3 9Z', '#70918f');
    path(c, 'M-13-99l13-7 13 7 2 17L0-75l-15-7Z', '#9db3b4', '#263c49', 1.5);
    path(c, 'M0-104l11 7 2 13-13 6Z', '#cad3c2');
    path(c, 'M-13-93l13 3 13-3v6L0-84l-13-3Z', '#213b49');
    line(c, 0, -104, 0, -91, '#e0e2c9', 1.5);
    for (let x = -7; x <= 7; x += 7) line(c, x, -82, x, -79, '#45616b');
    c.restore();
  }

  function visitor(c, v, time, L, rarity) {
    if (window.ScaremoreArt?.drawVisitor(c, v, time, L, rarity)) return;
    const k = v.kind, lk = v.look, kid = k === 'kid';
    const s = L.charH / 100 * (kid ? .73 : 1);
    const afraid = ['scared', 'flee', 'startled'].includes(v.state);
    const still = ['scared', 'startled', 'photo', 'patrol', 'laugh'].includes(v.state);
    const motion = reduce.matches ? 0 : Math.sin(v.phase);
    const jump = ['scared', 'startled'].includes(v.state) && !reduce.matches ? Math.sin(Math.min(1, v.st/.38)*Math.PI)*19 : 0;
    const bob = still ? 0 : Math.abs(motion) * (kid ? 3.5 : 1.4);
    const face = v.state === 'patrol' ? (Math.sin(v.st*4)>0 ? 1 : -1) : (v.state === 'flee' ? v.dir : 1);
    const swing = still ? 0 : motion * (v.state === 'flee' || k === 'jogger' ? .9 : .48);
    oval(c, v.x, L.walkY+2, 19*s, 4*s, '#0c222c55');
    c.save(); c.translate(v.x, L.walkY-(jump+bob)*s); c.scale(s*face, s);
    c.lineCap = 'round'; c.lineJoin = 'round';
    if (v.state === 'flee') c.rotate(.13);
    if (k === 'royal') path(c, 'M-10-66Q-30-43-27-9L9-9 11-66Z', '#80657e');
    if (lk.acc === 'backpack' || k === 'hunter') {
      rect(c, -23, -65, 14, 31, 6, '#b8a580'); rect(c, -24, -52, 9, 13, 3, '#827f68');
    }
    const leg = (angle, color, dx) => {
      c.save(); c.translate(dx, -33); c.rotate(angle);
      line(c, 0, 0, 0, 23, color, 9);
      rect(c, -4.5, 21, 15, 7, 3, '#e1dfc9');
      line(c, -3, 27, 10, 27, '#94a6a0', 1); c.restore();
    };
    leg(-swing, '#344b59', -6); leg(swing, lk.pants, 6);
    const arm = (angle, back) => {
      c.save(); c.translate(back ? -11 : 10, -62); c.rotate(angle);
      line(c, 0, 0, 1, 13, lk.shirt, 9); line(c, 1, 13, 2, 23, lk.skin, 7);
      oval(c, 2, 24, 4.3, 4.3, lk.skin); c.restore();
    };
    arm(afraid ? 2.35 : -swing, true);
    rect(c, -15, -69, 30, 38, 10, lk.shirt);
    path(c, 'M-14-43q14 5 28 0v9q-14 5-28 0Z', '#142b3422');
    if (lk.vest) { path(c, 'M-12-67l8-2v31h-10Zm19-2 8 4v27H7Z', lk.vest); }
    if (k === 'police') { rect(c, -16, -37, 32, 4, 1, '#1e3445'); path(c, 'M-7-61l2 3 3 1-3 2-2 3-1-3-3-2 3-1Z', '#e0c080'); }
    rect(c, -5, -77, 12, 12, 4, lk.skin);
    // Generous head shape, tiny facial features, soft hair silhouette.
    rect(c, -18, -108, 38, 35, 14, lk.skin);
    oval(c, -17, -88, 5, 6, lk.skin); oval(c, 20, -89, 4.5, 5, lk.skin);
    path(c, 'M-19-90v-9q0-17 19-15 17-1 21 14-11 2-18-5-4 12-16 10v8Z', lk.hair);
    oval(c, 6, -91, 1.8, afraid ? 3 : 2.2, '#24363e'); oval(c, 16, -91, 1.5, afraid ? 3 : 2.2, '#24363e');
    oval(c, 1, -84, 3, 1.5, '#cd7d743d');
    if (afraid) oval(c, 12, -80, 3.2, 4.4, '#34424a');
    else path(c, 'M9-81q3 2 5-1', null, '#815f54', 1.2);
    const hat = lk.hat;
    if (hat === 'sunhat' || hat === 'beret') { rect(c, -20, -114, 37, 14, 9, '#ccb98e'); rect(c, -25, -102, 52, 5, 2, '#e3cfa3'); }
    else if (hat === 'cap' || hat === 'police' || hat === 'propeller') { rect(c, -19, -113, 39, 15, 10, hat === 'police' ? '#405b73' : lk.hatColor); rect(c, 7, -102, 23, 5, 2, hat === 'police' ? '#223b50' : lk.hatColor); }
    else if (hat === 'beanie') { rect(c, -20, -116, 40, 19, 12, lk.hatColor); rect(c, -21, -102, 42, 6, 2, '#dfcaa2'); }
    if (k === 'jogger') rect(c, -19, -100, 40, 4, 1, '#e3ddbf');
    if (k === 'royal') path(c, 'M-17-107l-2-16 10 6 8-11 9 11 11-6-3 16Z', '#d5b778');
    if (k === 'skeptic') { rect(c, -1, -96, 11, 9, 3, '#344652'); rect(c, 13, -96, 10, 9, 3, '#344652'); line(c, 10, -93, 13, -93, '#344652', 2); }
    const camera = k === 'photographer' || lk.acc === 'camera';
    if (camera) {
      path(c, 'M-7-68l9 22 12-21', null, '#283e49', 2);
      const cy = v.state === 'photo' ? -86 : -53;
      rect(c, 0, cy, 22, 15, 4, '#2b424d'); rect(c, 3, cy-3, 8, 4, 1, '#a2b8b5');
      oval(c, 13, cy+7, 5, 5, '#adc8c0'); oval(c, 13, cy+7, 3, 3, '#446578');
    }
    arm(afraid ? -2.5 : v.state === 'photo' ? -2.2 : kid ? -1.15 : swing, false);
    if (kid && !afraid) { path(c, 'M27-57h10l-5 13Z', '#d4ad76'); oval(c, 32, -59, 7, 7, lk.ice || '#dda7ab'); }
    if (k === 'hunter') { rect(c, 13, -51, 20, 10, 3, '#739185'); oval(c, 30, -47, 3, 3, '#bae7bc'); }
    if (afraid) { path(c, 'M-25-112l-5-6m13 0-1-7m43 14 5-5', null, '#e9cb91', 2.5); }
    c.restore();
    if (rarity && !afraid) {
      const y = L.walkY-(kid ? 95 : 131)*s-bob*s;
      path(c, `M${v.x} ${y-4}l3 4-3 4-3-4Z`, ['','#a8c8e7','#baa9db','#dfc58e'][rarity]);
    }
  }

  function atmosphere(c, time, W, H, L) {
    const t = reduce.matches ? 0 : time;
    c.save();
    // Broad pools of moonlight behind the action, with slow layered mist.
    for (let i = 0; i < 3; i++) {
      const x = W*(.15+i*.37)+Math.sin(t*.16+i*2)*W*.1;
      const y = H*(.69+i*.06);
      const g = c.createRadialGradient(x,y,0,x,y,W*.38);
      g.addColorStop(0, '#c7e6d40a'); g.addColorStop(1, '#c7e6d400');
      c.fillStyle=g; c.fillRect(0,H*.5,W,H*.5);
    }
    c.restore();
  }
  function foreground(c, time, W, H) {
    if (hallImage.complete && hallImage.naturalWidth) return;
    c.save(); c.scale(W/400,H/360);
    // Near columns frame the scene, without hiding the timing target.
    path(c, 'M0 0h400v12Q200-35 0 12Z', '#10232c');
    path(c, 'M0 0h7v346l10 14H0Zm400 0h-7v346l-10 14h17Z', '#152934');
    c.restore();
  }
  window.Moonlit = { get active() { return selected === 'moonlit'; }, get reduced() { return reduce.matches; }, background, armor, visitor, atmosphere, foreground };
})();
