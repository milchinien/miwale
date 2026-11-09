// Würfelglück – Pixel-Porträts der Begegnungen (32×32). window.WGEncounterArt.portrait(id) liefert ein Canvas.
((global) => {
  'use strict';
  const cache = {};
  const FACE = '#E8B48C', DARK = '#1E1A18', WHITE = '#F4EEDF';
  function make(id) {
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const g = c.getContext('2d');
    const r = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const head = (x, y, w, h) => { r(x + 1, y, w - 2, h, FACE); r(x, y + 1, w, h - 2, FACE); };
    const eyes = (x1, x2, y) => { r(x1, y, 2, 2, DARK); r(x2, y, 2, 2, DARK); };
    if (id === 'mystery') {
      r(0, 0, 32, 32, '#2B3A33'); r(0, 26, 32, 6, '#3F2E20');
      for (let k = 0; k < 16; k++) r(8 + Math.floor(k / 5), 8 + k, 16 - 2 * Math.floor(k / 5), 1, '#9A4E2C');
      r(7, 7, 18, 3, '#C27A47'); r(13, 12, 6, 2, WHITE); r(17, 14, 2, 3, WHITE); r(15, 16, 3, 2, WHITE); r(15, 20, 2, 2, WHITE);
      r(25, 22, 6, 6, WHITE); r(27, 24, 2, 2, DARK);
    } else if (id === 'fortune') {
      r(0, 0, 32, 32, '#2A1F45');
      r(7, 6, 18, 6, '#6B4F92'); r(5, 10, 22, 4, '#8A63C2'); r(13, 4, 6, 3, '#E3BE62');
      head(9, 13, 14, 10); eyes(12, 18, 16); r(14, 20, 4, 1, '#A65A4A');
      r(6, 23, 20, 9, '#6B4F92'); r(10, 25, 12, 7, '#9FE3F0'); r(12, 26, 4, 3, '#E8FBFF'); r(9, 30, 14, 2, '#3A2D5C');
    } else if (id === 'backroom') {
      r(0, 0, 32, 32, '#3A1E24');
      r(8, 4, 16, 6, '#14110F'); r(7, 7, 18, 3, '#2A2422'); r(20, 5, 3, 2, '#5A5550');
      head(9, 9, 14, 14); eyes(12, 18, 13); r(11, 18, 10, 2, '#14110F'); r(14, 21, 4, 1, '#A65A4A');
      r(5, 23, 22, 9, '#23262E'); r(13, 23, 6, 5, WHITE); r(15, 24, 2, 8, '#C2312A');
    } else if (id === 'pawnshop') {
      r(0, 0, 32, 32, '#3D3220');
      r(3, 2, 26, 2, '#8A6A2E'); [[6, 4], [13, 7], [20, 4]].forEach(([x, y]) => { r(x + 2, 3, 1, y, '#8A6A2E'); r(x, y + 3, 6, 5, '#E3BE62'); r(x + 1, y + 2, 4, 7, '#E3BE62'); r(x + 1, y + 3, 2, 2, '#FFF0B2'); });
      head(10, 15, 12, 10); eyes(13, 18, 18); r(17, 17, 4, 4, 'rgba(160,220,255,0.55)'); r(13, 23, 6, 1, '#D9D2C0');
      r(9, 14, 14, 2, '#D9D2C0'); r(6, 25, 20, 7, '#4A5A44'); r(14, 25, 4, 7, WHITE);
    } else if (id === 'lost') {
      r(0, 0, 32, 32, '#2A2E2C'); r(0, 27, 32, 5, '#463A2C');
      r(5, 12, 22, 16, '#A67C4E'); r(5, 12, 22, 3, '#C89B66'); r(14, 12, 4, 16, '#8F6A40');
      r(3, 9, 12, 4, '#C89B66'); r(17, 9, 12, 4, '#C89B66');
      r(8, 4, 8, 8, WHITE); r(11, 7, 2, 2, DARK); r(17, 5, 7, 7, '#F3C969'); r(19, 7, 1, 1, '#6B4A12'); r(22, 10, 1, 1, '#6B4A12');
    } else if (id === 'well') {
      r(0, 0, 32, 32, '#1E3A4A'); r(0, 28, 32, 4, '#2E5038');
      r(4, 4, 24, 4, '#7A4A2A'); r(2, 8, 28, 2, '#94603A'); r(7, 10, 2, 8, '#6A4326'); r(23, 10, 2, 8, '#6A4326');
      r(15, 8, 1, 7, '#D9D2C0'); r(13, 15, 5, 3, '#B58A2A');
      r(5, 18, 22, 11, '#8A8F96'); for (let y = 0; y < 3; y++) for (let x = y % 2 ? 2 : 0; x < 22; x += 5) r(5 + x, 18 + y * 4, 1, 3, '#60666E');
      r(5, 18, 22, 2, '#A8ADB3'); r(9, 20, 14, 2, '#123047');
    } else if (id === 'spring') {
      r(0, 0, 32, 32, '#1D3F4A'); r(0, 24, 32, 8, '#2F8F9D'); r(3, 26, 9, 1, '#9FE3F0'); r(18, 29, 10, 1, '#9FE3F0');
      for (let y = 0; y < 18; y++) { const w = y < 9 ? 1 + y * 1.1 : 10 - Math.abs(y - 13) * 1.2 + 3; r(16 - Math.round(w / 1.2), 4 + y, Math.round(w / 0.6), 1, '#7FD4E8'); }
      r(11, 13, 2, 5, '#E8FBFF'); r(13, 18, 2, 2, '#E8FBFF');
    } else {
      r(0, 0, 32, 32, '#2C3A30'); r(2, 3, 28, 22, '#8A6A40'); r(4, 5, 24, 18, '#22352C');
      [[7, 15], [13, 11], [19, 15], [24, 10]].forEach(([x, y]) => { r(x, y, 3, 3, WHITE); });
      r(9, 15, 5, 1, WHITE); r(15, 13, 5, 1, WHITE); r(21, 12, 4, 1, WHITE);
      r(8, 27, 14, 3, WHITE); r(20, 27, 3, 3, '#D9D2C0');
    }
    return c;
  }
  global.WGEncounterArt = { portrait: (id) => cache[id] || (cache[id] = make(id)) };
})(typeof window !== 'undefined' ? window : globalThis);
