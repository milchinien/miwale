// Generated cup illustrations are rasterized once, never from full-size PNGs
// inside a render loop. Logical sprite size remains 36 x 48 game units.
((global) => {
  'use strict';
  const cache = Object.create(null);
  const ids = ['classic', 'jonny', 'sprint', 'marathon', 'gambler', 'velvet', 'clover', 'highroller', 'twin', 'iron', 'sack', 'glass', 'chaos'];
  const base = new URL('../assets/cups/runtime/', document.currentScript ? document.currentScript.src : new URL('ui/cup-art.js', document.baseURI));
  global.WGCupArt = { get: (id) => cache[id] || null };
  // Embedded data: URIs (ui/art-data.js) first: a PNG loaded from file:// taints the canvas and
  // the WebGL upload then throws, which froze the game.
  const embedded = (global.WGArtData && global.WGArtData.cups) || {};
  ids.forEach((id) => {
    const img = new Image();
    img.onload = () => {
      img.onload = null;
      const c = document.createElement('canvas'); c.width = 72; c.height = 96;
      const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
      const scale = Math.min(c.width / img.naturalWidth, c.height / img.naturalHeight);
      const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
      g.drawImage(img, Math.floor((c.width - w) / 2), Math.floor((c.height - h) / 2), w, h);
      // Tainted (cross-origin) pictures must never reach the game canvas: keep the drawn fallback.
      try { g.getImageData(0, 0, 1, 1); } catch (e) { return; }
      cache[id] = c;
      global.dispatchEvent(new CustomEvent('wg-cup-art-ready', { detail: id }));
    };
    img.src = embedded[id + '-v1.png'] || new URL(id + '-v1.png', base).href;
  });
})(window);
