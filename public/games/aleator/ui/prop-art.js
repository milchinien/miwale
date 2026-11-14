// Small embedded PNGs keep file:// play origin-clean for the WebGL UI upload.
((global) => {
  'use strict';
  const cache = Object.create(null);
  const embedded = (global.WGArtData && global.WGArtData.props) || {};
  global.WGPropArt = {
    draw(ctx, id, x, y, w, h) {
      const image = cache[id];
      if (!image) return false;
      ctx.save(); ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, Math.round(x), Math.round(y), w, h);
      ctx.restore();
      return true;
    },
    ready: (id) => !!cache[id],
  };
  ['telephone-idle', 'telephone-lifted', 'mystery-cover', 'crystal-ball'].forEach(id => {
    const src = embedded[id + '-v1.png'];
    if (!src) return; // Keep the procedural drawing when art is unavailable.
    const img = new Image();
    img.onload = () => { cache[id] = img; img.onload = null; };
    img.src = src;
  });
})(window);
