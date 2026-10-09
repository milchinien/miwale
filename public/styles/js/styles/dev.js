/* Minimal debug style – used to test the core. Hidden from the menu unless ?style=dev. */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  let grass, dirt, moss;
  Styles.register({
    id: 'dev',
    name: 'Debug',
    family: 'Intern',
    hidden: true,
    groundColor: '#2c3a22',
    init() {
      grass = U.texture(128, 128, (x, y, o) => {
        const n = U.fbmTile(x / 16, y / 16, 8, 1, 4);
        const c = U.mix([58, 92, 40], [92, 130, 54], n);
        o[0] = c[0]; o[1] = c[1]; o[2] = c[2];
      });
      dirt = U.texture(128, 128, (x, y, o) => {
        const n = U.fbmTile(x / 32, y / 32, 4, 7, 4);
        const c = U.mix([92, 66, 44], [130, 98, 66], n);
        o[0] = c[0]; o[1] = c[1]; o[2] = c[2];
      });
      moss = U.texture(128, 128, (x, y, o) => {
        const n = U.fbmTile(x / 8, y / 8, 16, 3, 3);
        const c = U.mix([40, 70, 50], [66, 104, 70], n);
        o[0] = c[0]; o[1] = c[1]; o[2] = c[2];
      });
    },
    *renderGroundChunk(ctx, info) {
      yield* G.blendGen({
        ctx, info,
        layers: [{ tex: grass }, { tex: dirt }, { tex: moss }],
        weights(x, y, w) {
          const a = U.warped(x / 500, y / 500, 11, 1.2);
          const b = U.fbm(x / 300, y / 300, 77, 3);
          w[0] = 1;
          w[1] = U.smoothstep(0.55, 0.62, a) * 3;
          w[2] = U.smoothstep(0.58, 0.66, b) * 2;
        },
      });
    },
    propsForChunk(info) {
      const props = [];
      G.scatterOwned(info, 96, 99, (x, y, rng) => {
        if (G.nearSpawn(x, y) || !rng.chance(0.3)) return;
        props.push({ x, y, type: 'rock', s: rng.range(0.7, 1.3) });
      });
      return props;
    },
    drawProp(ctx, p) {
      ctx.fillStyle = '#777';
      ctx.beginPath(); ctx.ellipse(p.x, p.y - 5 * p.s, 10 * p.s, 7 * p.s, 0, 0, U.TAU); ctx.fill();
    },
  });
})();
