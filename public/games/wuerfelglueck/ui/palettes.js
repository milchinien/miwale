// Würfelglück – Farbpaletten. Jede Palette setzt die UI-Farben (BalatroFX.PALETTE + eigene Schlüssel)
// und die Hintergrundfarben je Spielsituation. "Original" entspricht dem ersten Look.
// bg: menu = volle Swirl-Farben; die anderen = Grundfarbe (+ special) wie setBackgroundColour.
(function (global) {
  'use strict';
  const PALETTES = [
    {
      id: 'felt', name: 'Felt & Brass',
      colours: {
        RED: '#E2553F', BLUE: '#1FA8A0', GREEN: '#5DBB63', PALE_GREEN: '#4E9A6A', ORANGE: '#E89A3C', IMPORTANT: '#F0A030',
        GOLD: '#E3BE62', MONEY: '#EFC160', PURPLE: '#8E6BB0', BLACK: '#2B2A24', L_BLACK: '#4A463A', GREY: '#6C6656',
        CHIPS: '#1FA8A0', MULT: '#E2553F', XMULT: '#E2553F', PLANET: '#2E9FC0', TAROT: '#A57BC4',
        PANEL: '#3B4A3E', PANEL_DARK: '#253029', BLIND: '#2F6B52', BOSS: '#A3402E', WON: '#4A463A',
        TEXT_SOFT: '#EEE6D2', TEXT_LABEL: '#E2D8BF', TEXT_DIM: '#B7AC92', TEXT_HINT: '#CFC5AA', TEXT_FAINT: '#8A8169',
        ANCHOR: '#8FD3E0', SIDEBAR: 'rgba(26,34,29,0.88)', HIGHLIGHT: 'rgba(227,190,98,0.35)', CHIP_OFF: 'rgba(58,66,58,0.95)',
        OVERLAY_SOLID: 'rgba(28,36,31,0.97)', OVERLAY: 'rgba(28,36,31,0.94)', AREA: 'rgba(0,0,0,0.22)',
        GOLD_TEXT: '#B58A2A', LUCK_TEXT: '#2E8A4E', SKULL: '#8F2D3B', FLAME: '#FFD98A', FLAME_CHIPS: '#B8F0E8', ROW_OFF: '#D6CFBE',
        ROUND_1: '#2E8C7A', ROUND_2: '#C98A2E', ROUND_3: '#A3402E', SELL: '#C98A2E', DEPOSIT: '#B58A2A',
      },
      bg: {
        menu: { c1: '#C9473A', c2: '#1F7A62', c3: '#141E19', contrast: 3.2, lighting: 0.35, spinAmount: 0.25 },
        table: { base: '#2F6B52', contrast: 1 }, shop: { base: '#2E5E4E', special: '#E3BE62', contrast: 1.6 },
        won: { base: '#4A463A', contrast: 1 }, gold: { base: '#B8862B', special: '#E2553F', contrast: 2.5 },
        lose: { base: '#6A2A22', special: '#24130F', contrast: 3 },
      },
    },
    {
      id: 'neon', name: 'Neon Night',
      colours: {
        RED: '#FF3D8B', BLUE: '#00C8F0', GREEN: '#3BE38A', PALE_GREEN: '#35B57A', ORANGE: '#FFA126', IMPORTANT: '#FFA126',
        GOLD: '#FFD447', MONEY: '#FFD447', PURPLE: '#9C6BFF', BLACK: '#1A1730', L_BLACK: '#353060', GREY: '#565084',
        CHIPS: '#00C8F0', MULT: '#FF3D8B', XMULT: '#FF3D8B', PLANET: '#22C3E6', TAROT: '#B58CFF',
        PANEL: '#272350', PANEL_DARK: '#17142F', BLIND: '#3B2A7E', BOSS: '#B0306A', WON: '#353060',
        TEXT_SOFT: '#E6E2FF', TEXT_LABEL: '#D6D0FF', TEXT_DIM: '#A39BD6', TEXT_HINT: '#BEB7EA', TEXT_FAINT: '#756DA8',
        ANCHOR: '#7FE8FF', SIDEBAR: 'rgba(18,15,42,0.88)', HIGHLIGHT: 'rgba(255,61,139,0.32)', CHIP_OFF: 'rgba(48,42,92,0.95)',
        OVERLAY_SOLID: 'rgba(20,17,44,0.97)', OVERLAY: 'rgba(20,17,44,0.94)', AREA: 'rgba(0,0,0,0.25)',
        GOLD_TEXT: '#C79A12', LUCK_TEXT: '#14A060', SKULL: '#9A2B5E', FLAME: '#FFB3D6', FLAME_CHIPS: '#B3F2FF', ROW_OFF: '#D3CFEA',
        ROUND_1: '#3D7BFF', ROUND_2: '#C24CFF', ROUND_3: '#B0306A', SELL: '#C79A12', DEPOSIT: '#C79A12',
      },
      bg: {
        menu: { c1: '#FF3D8B', c2: '#2B1E8A', c3: '#0B0A1E', contrast: 3.4, lighting: 0.4, spinAmount: 0.3 },
        table: { base: '#3B2A7E', contrast: 1.2 }, shop: { base: '#2A2475', special: '#00C8F0', contrast: 1.8 },
        won: { base: '#353060', contrast: 1 }, gold: { base: '#7A4CC2', special: '#FFD447', contrast: 2.5 },
        lose: { base: '#5A1A3A', special: '#1A0812', contrast: 3 },
      },
    },
    {
      id: 'sunset', name: 'Sunset Arcade',
      colours: {
        RED: '#FF6A3D', BLUE: '#3D86FF', GREEN: '#5BC98C', PALE_GREEN: '#4FA877', ORANGE: '#FFA53D', IMPORTANT: '#FFA53D',
        GOLD: '#FFC857', MONEY: '#FFC857', PURPLE: '#B565D9', BLACK: '#2B1F33', L_BLACK: '#4E3756', GREY: '#705A7A',
        CHIPS: '#3D86FF', MULT: '#FF6A3D', XMULT: '#FF6A3D', PLANET: '#3DB5FF', TAROT: '#C78BE8',
        PANEL: '#4A2E50', PANEL_DARK: '#2E1C33', BLIND: '#7A3358', BOSS: '#C23B2E', WON: '#4E3756',
        TEXT_SOFT: '#F8E4EC', TEXT_LABEL: '#EED6E0', TEXT_DIM: '#C9A3B6', TEXT_HINT: '#DDBFCC', TEXT_FAINT: '#94738A',
        ANCHOR: '#9FD0FF', SIDEBAR: 'rgba(38,22,42,0.88)', HIGHLIGHT: 'rgba(255,200,87,0.33)', CHIP_OFF: 'rgba(74,48,80,0.95)',
        OVERLAY_SOLID: 'rgba(40,24,44,0.97)', OVERLAY: 'rgba(40,24,44,0.94)', AREA: 'rgba(0,0,0,0.22)',
        GOLD_TEXT: '#C08A1E', LUCK_TEXT: '#2E8F5F', SKULL: '#8F2D3B', FLAME: '#FFE08A', FLAME_CHIPS: '#BCD6FF', ROW_OFF: '#E2D0D8',
        ROUND_1: '#3D86FF', ROUND_2: '#E0782E', ROUND_3: '#C23B2E', SELL: '#E0782E', DEPOSIT: '#C08A1E',
      },
      bg: {
        menu: { c1: '#FF7A3D', c2: '#7A2E8F', c3: '#1F1027', contrast: 3.3, lighting: 0.4, spinAmount: 0.25 },
        table: { base: '#7A3358', contrast: 1 }, shop: { base: '#5A2E6F', special: '#FFC857', contrast: 1.6 },
        won: { base: '#4E3756', contrast: 1 }, gold: { base: '#C2702E', special: '#FF6A3D', contrast: 2.5 },
        lose: { base: '#6A2A2A', special: '#2A1010', contrast: 3 },
      },
    },
    {
      id: 'original', name: 'Original',
      colours: {
        // BalatroFX.PALETTE bleibt wie geliefert; hier nur die Würfelglück-Schlüssel
        TEXT_SOFT: '#E0E8EA', TEXT_LABEL: '#D5E0E2', TEXT_DIM: '#9FB0B4', TEXT_HINT: '#B9C7CA', TEXT_FAINT: '#7F9296',
        ANCHOR: '#8FC8FF', SIDEBAR: 'rgba(28,40,44,0.86)', HIGHLIGHT: 'rgba(253,162,0,0.35)', CHIP_OFF: 'rgba(60,72,76,0.95)',
        OVERLAY_SOLID: 'rgba(30,40,44,0.97)', OVERLAY: 'rgba(30,40,44,0.94)', AREA: 'rgba(0,0,0,0.2)',
        GOLD_TEXT: '#C9A13B', LUCK_TEXT: '#4BC292', SKULL: '#8F2D3B', FLAME: '#FFD27A', FLAME_CHIPS: '#BFE6FF', ROW_OFF: '#C9D3D5',
        ROUND_1: '#3C7BD0', ROUND_2: '#D99A2B', ROUND_3: '#B44430', SELL: '#D99A2B', DEPOSIT: '#C9A13B',
      },
      bg: {
        menu: { c1: '#DE443B', c2: '#006BB4', c3: '#162325', contrast: 3.5, lighting: 0.4, spinAmount: 0.25 },
        table: { base: '#50846E', contrast: 1 }, shop: { base: '#2B6E8F', special: '#4BC292', contrast: 1.6 },
        won: { base: '#4F6367', contrast: 1 }, gold: { base: '#C08A2E', special: '#FE5F55', contrast: 2.5 },
        lose: { base: '#6A2A2A', special: '#2A1010', contrast: 3 },
      },
    },
  ];
  global.WG_PALETTES = PALETTES;
})(typeof window !== 'undefined' ? window : globalThis);
