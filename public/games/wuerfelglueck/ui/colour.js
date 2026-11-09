// Würfelglück – Farbrechnung für Colour Studio und Barrierefreiheit. window.WGColour
// Rein rechnerisch (keine Grafik), damit Node-Tests die Kontrastregeln prüfen können.
((global) => {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const toRgb = (hex) => { const h = hex.replace('#', ''); return [0, 2, 4].map((k) => parseInt(h.substr(k, 2), 16)); };
  const toHex = (rgb) => '#' + rgb.map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('').toUpperCase();
  const mix = (a, b, k) => { const x = toRgb(a), y = toRgb(b); return toHex(x.map((v, i) => v + (y[i] - v) * k)); };
  const lighten = (hex, k) => mix(hex, '#FFFFFF', k);
  const darken = (hex, k) => mix(hex, '#000000', k);
  const rgba = (hex, a) => { const c = toRgb(hex); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; };
  function luminance(hex) {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const [r, g, b] = toRgb(hex).map(f);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function contrast(a, b) {
    const x = luminance(a), y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  // Text so weit aufhellen oder abdunkeln, bis er auf dem Grund lesbar ist
  function ensureContrast(fg, bg, ratio = 4.5) {
    if (contrast(fg, bg) >= ratio) return fg;
    const toward = luminance(bg) > 0.18 ? '#000000' : '#FFFFFF';
    for (let k = 0.05; k <= 1.0001; k += 0.05) { const c = mix(fg, toward, k); if (contrast(c, bg) >= ratio) return c; }
    return toward;
  }
  // Farbton drehen (Grad) und optional Sättigung skalieren
  function shiftHue(hex, deg, sat = 1) {
    const [r, g, b] = toRgb(hex).map((v) => v / 255), max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
    let h = 0, s = 0;
    if (d > 1e-6) {
      s = d / (1 - Math.abs(2 * l - 1));
      h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    h = (h + deg + 720) % 360; s = clamp(s * sat, 0, 1);
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
    const seg = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor(h / 60) % 6];
    return toHex(seg.map((v) => (v + m) * 255));
  }

  // ── Colour Studio: aus zwei UI-Farben alle Flächen, Akzente und Textfarben ableiten ──
  // Spielinformation (Pips, Power, Geld, Schädel, Luck, Rundenfarben, Seltenheiten, Boss) wird hier bewusst nicht gesetzt.
  function deriveUi(primary, secondary) {
    let panel = primary;
    while (contrast('#FFFFFF', panel) < 4.5) panel = darken(panel, 0.08);
    const dark = darken(panel, 0.35), solid = darken(panel, 0.5);
    const accent = ensureContrast(secondary, solid, 3);
    const text = (base) => ensureContrast(base, solid, 4.5);
    return {
      PANEL: panel, PANEL_DARK: dark, L_BLACK: lighten(dark, 0.08), WON: panel,
      SIDEBAR: rgba(darken(panel, 0.45), 0.88), OVERLAY_SOLID: rgba(solid, 0.97), OVERLAY: rgba(solid, 0.94),
      CHIP_OFF: rgba(lighten(dark, 0.1), 0.95), HIGHLIGHT: rgba(accent, 0.35), GOLD: accent,
      TEXT_SOFT: text(mix('#FFFFFF', accent, 0.08)), TEXT_LABEL: text(mix('#FFFFFF', accent, 0.15)),
      TEXT_HINT: text(mix('#FFFFFF', panel, 0.25)), TEXT_DIM: text(mix('#FFFFFF', panel, 0.4)), TEXT_FAINT: text(mix('#FFFFFF', panel, 0.5)),
    };
  }
  // Dritte Farbe (Tiefe), falls sie nicht selbst gewählt wurde
  const autoDepth = (c1) => mix(darken(c1, 0.72), '#101418', 0.3);
  // Hintergründe aller Spielsituationen: Menü und Tisch direkt, Shop, Gewonnen, Gold und Verloren abgeleitet.
  // Die Bossfarbe wird nicht hier gesetzt: Boss-Runden behalten sie, weil sie Spielinformation ist.
  function deriveBg(col) {
    const c1 = col.c1, c2 = col.c2, c3 = col.c3 || autoDepth(c1), c4 = col.c4 || null;
    const look = (a, b, c, contrastV, extra) => Object.assign({ c1: a, c2: b, c3: c, c4, contrast: contrastV, lighting: 0.3, spinAmount: 0.25 }, extra);
    return {
      menu: look(c1, c2, c3, 3.2, { lighting: 0.35 }),
      table: look(c1, c2, c3, 1.4),
      shop: look(shiftHue(c1, 22), shiftHue(c2, 22), darken(c3, 0.1), 1.8),
      won: look(shiftHue(c1, 0, 0.5), shiftHue(c2, 0, 0.5), c3, 1.2),
      gold: look(mix(c1, '#D4AF37', 0.65), mix(c2, '#D4AF37', 0.4), darken(c3, 0.15), 2.5),
      lose: look(mix(c1, '#6A2A22', 0.75), mix(c2, '#24130F', 0.7), '#14090A', 3),
    };
  }

  // ── Farbsehen: Signalfarben aus der farbfehlsichtigkeitssicheren Okabe-Ito-Palette ──
  const CVD = {
    deuteranopia: { RED: '#D55E00', MULT: '#D55E00', XMULT: '#D55E00', GREEN: '#56B4E9', PALE_GREEN: '#4A9CC9', BLUE: '#0072B2', CHIPS: '#0072B2', ORANGE: '#E69F00', IMPORTANT: '#E69F00', GOLD: '#F0E442', MONEY: '#F0E442', LUCK_TEXT: '#0072B2', SKULL: '#7A2E7A', GOLD_TEXT: '#8A7A00' },
    protanopia: { RED: '#E69F00', MULT: '#E69F00', XMULT: '#E69F00', GREEN: '#56B4E9', PALE_GREEN: '#4A9CC9', BLUE: '#0072B2', CHIPS: '#0072B2', ORANGE: '#F0E442', IMPORTANT: '#F0E442', GOLD: '#F0E442', MONEY: '#F0E442', LUCK_TEXT: '#0072B2', SKULL: '#5B3A8C', GOLD_TEXT: '#8A7A00' },
    tritanopia: { RED: '#D55E00', MULT: '#D55E00', XMULT: '#D55E00', GREEN: '#009E73', PALE_GREEN: '#008762', BLUE: '#00798C', CHIPS: '#00798C', ORANGE: '#E0553A', IMPORTANT: '#E0553A', GOLD: '#F2A0B8', MONEY: '#F2A0B8', LUCK_TEXT: '#007A59', SKULL: '#6A2A4A', GOLD_TEXT: '#A8446A' },
  };
  // Hoher Kontrast: dunklere Flächen, hellerer Text
  const HIGH_CONTRAST = {
    PANEL: '#15181A', PANEL_DARK: '#000000', L_BLACK: '#24282B', SIDEBAR: 'rgba(0,0,0,0.94)', OVERLAY_SOLID: 'rgba(0,0,0,0.98)', OVERLAY: 'rgba(0,0,0,0.96)',
    TEXT_SOFT: '#FFFFFF', TEXT_LABEL: '#FFFFFF', TEXT_HINT: '#F2F2F2', TEXT_DIM: '#E0E0E0', TEXT_FAINT: '#CFCFCF', CHIP_OFF: 'rgba(40,44,47,0.98)',
  };

  const api = { clamp, toRgb, toHex, mix, lighten, darken, rgba, luminance, contrast, ensureContrast, shiftHue, deriveUi, autoDepth, deriveBg, CVD, HIGH_CONTRAST };
  global.WGColour = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
