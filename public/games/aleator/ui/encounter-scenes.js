// Aleator – animierte Pixel-Kulissen der Begegnungen. window.WGEncounterScenes.draw(ctx, id, x, y, w, h, t, moving)
// Alles liegt auf einem 4-Pixel-Raster, damit es zu den Würfeln passt. moving = false ("Less motion") friert die Kulisse ein.
((global) => {
  'use strict';
  const PX = 4;
  function draw(ctx, id, x, y, w, h, t0, moving) {
    const t = moving ? t0 : 0;
    const r = (ax, ay, aw, ah, col, a) => {
      ctx.fillStyle = col; if (a !== undefined) ctx.globalAlpha = a;
      ctx.fillRect(x + Math.round(ax / PX) * PX, y + Math.round(ay / PX) * PX, Math.max(PX, Math.round(aw / PX) * PX), Math.max(PX, Math.round(ah / PX) * PX));
      if (a !== undefined) ctx.globalAlpha = 1;
    };
    const noise = (n) => { const q = Math.sin(n * 127.1) * 43758.5; return q - Math.floor(q); };
    // Aufsteigende Teilchen (Rauch, Staub, Funken)
    const motes = (n, col, speed, size, a) => {
      for (let i = 0; i < n; i++) {
        const life = (t * speed + noise(i)) % 1, mx = noise(i + 40) * w + Math.sin(t + i) * 10;
        r(mx, h - life * h, size, size, col, a * Math.sin(life * Math.PI));
      }
    };
    const table = (col, top) => { r(0, top, w, h - top, col); r(0, top, w, PX * 2, 'rgba(255,255,255,0.14)'); };
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const cx = w / 2;
    if (id === 'mystery') {
      r(0, 0, w, h, '#1F2B26');
      for (let i = 0; i < 7; i++) r(cx - 60 - i * 34, i * 34, 120 + i * 68, 34, '#F3D79A', 0.05);
      table('#2F5A45', h * 0.68);
      r(cx - 8, 0, 16, 18, '#555048'); r(cx - 34, 16, 68, 12, '#8A6A40');
      motes(12, '#F3D79A', 0.06, 4, 0.5);
    } else if (id === 'fortune') {
      r(0, 0, w, h, '#231A3C');
      for (let i = 0; i < 40; i++) r(noise(i) * w, noise(i + 9) * h * 0.7, 4, 4, '#E3BE62', 0.3 + 0.5 * Math.abs(Math.sin(t * 1.3 + i)));
      for (let i = 0; i < 9; i++) { r(i * 24, 0, 16, h * 0.86 - (i % 2) * 14, '#5B3F86'); r(w - i * 24 - 16, 0, 16, h * 0.86 - (i % 2) * 14, '#5B3F86'); }
      table('#3A2D5C', h * 0.8);
      motes(18, '#C8B6F0', 0.09, 8, 0.2);
    } else if (id === 'backroom') {
      r(0, 0, w, h, '#2A1519');
      for (let i = 0; i < 16; i++) r(i * 64, 0, 4, h, '#341B20');
      const sw = Math.sin(t * 1.1) * 26;
      for (let i = 0; i < 8; i++) r(cx + sw * (i / 8), i * 8, 4, 8, '#14110F');
      r(cx + sw - 10, 62, 24, 20, '#FFE7A8');
      for (let i = 0; i < 5; i++) r(cx + sw - 50 - i * 34, 82 + i * 30, 104 + i * 68, 30, '#FFD98A', 0.09);
      table('#1F4A36', h * 0.72);
      motes(16, '#8A8078', 0.05, 12, 0.13);
    } else if (id === 'pawnshop') {
      r(0, 0, w, h, '#33291A');
      [0.14, 0.42].forEach((sy, row) => {
        r(0, h * sy + 34, w, 8, '#6A4A22');
        for (let i = 0; i < 12; i++) {
          const n = noise(i * 3 + row), ix = 22 + i * (w / 12), glint = Math.sin(t * 2 + i * 1.7 + row) > 0.94;
          r(ix, h * sy + 34 - 12 - n * 18, 18 + n * 8, 12 + n * 18, ['#B58A2A', '#7A5A8A', '#5A8A7A', '#A0522D'][(i + row) % 4]);
          if (glint) r(ix + 4, h * sy + 34 - 16 - n * 18, 8, 8, '#FFF6D0');
        }
      });
      table('#6F4A25', h * 0.72);
      motes(10, '#E3BE62', 0.05, 4, 0.35);
    } else if (id === 'lost') {
      r(0, 0, w, h, '#23262A');
      for (let i = 0; i < 5; i++) r(40 + i * 18, i * 42, 150, 42, '#BFD2E0', 0.05);
      r(w - 150, 26, 110, 80, '#39424A'); r(w - 98, 26, 6, 80, '#23262A'); r(w - 150, 62, 110, 6, '#23262A');
      table('#463A2C', h * 0.7);
      motes(26, '#D8D0B8', 0.035, 4, 0.5);
    } else if (id === 'well') {
      r(0, 0, w, h, '#16303F');
      for (let i = 0; i < 30; i++) r(noise(i) * w, noise(i + 5) * h * 0.5, 4, 4, '#CFE8F5', 0.2 + 0.5 * Math.abs(Math.sin(t + i)));
      r(0, h * 0.82, w, h * 0.18, '#27462F');
      r(cx - 112, h * 0.56, 224, h * 0.3, '#7D828A');
      for (let row = 0; row < 3; row++) for (let i = (row % 2) * 16; i < 224; i += 32) r(cx - 112 + i, h * 0.56 + 12 + row * 22, 4, 16, '#5C626A');
      r(cx - 112, h * 0.56, 224, 12, '#A8ADB3'); r(cx - 96, h * 0.56 + 12, 192, 8, '#0D2432');
      r(cx - 130, 18, 260, 14, '#7A4A2A'); r(cx - 124, 30, 10, h * 0.56 - 30, '#5F3C22'); r(cx + 114, 30, 10, h * 0.56 - 30, '#5F3C22');
    } else if (id === 'spring') {
      r(0, 0, w, h, '#143039');
      for (let i = 0; i < 14; i++) { const hh = 26 + noise(i) * 60; r(i * (w / 14), 0, w / 14 - 6, hh, '#1F4752'); }
      for (let i = 0; i < 6; i++) { const f = (t * 0.7 + noise(i + 20)) % 1; r(90 + i * (w - 180) / 5, 70 + f * h * 0.5, 4, 12, '#9FE3F0', 0.8 * (1 - f * 0.6)); }
      r(0, h * 0.66, w, h * 0.34, '#2F8F9D');
      for (let i = 0; i < 9; i++) r((t * (8 + i * 3) + noise(i) * w) % w, h * 0.7 + i * 11, 44 + noise(i + 3) * 60, 4, '#9FE3F0', 0.6);
      motes(14, '#D6F5FB', 0.05, 8, 0.1);
    } else {
      r(0, 0, w, h, '#6B4E2E');
      r(14, 12, w - 28, h - 32, '#22352C');
      for (let i = 0; i < 26; i++) r(30 + noise(i) * (w - 90), 26 + noise(i + 7) * (h - 70), 26 + noise(i + 2) * 50, 4, '#FFFFFF', 0.04);
      r(30, h - 20, w - 60, 8, '#4F3820');
      r(70, h - 26, 56, 10, '#F4EEDF'); r(146, h - 26, 34, 10, '#E8A0A0');
    }
    ctx.restore();
  }
  global.WGEncounterScenes = { draw };
})(typeof window !== 'undefined' ? window : globalThis);
