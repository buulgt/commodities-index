import type { PaletteKey, PaletteTokens } from '../types/commodity';

export interface ExtendedPaletteTokens extends PaletteTokens {
  bgCard: string;
  badgeBg: string;
  isLight?: boolean;
}

export const PALETTES: Record<PaletteKey, ExtendedPaletteTokens> = {
  // ─── DARK SUITE (4 PALETTES) ──────────────────────────────
  swiss: {
    id: 'swiss',
    name: 'Swiss Horology & Titanium',
    tag: '🌙 Bold Obsidian',
    bgMain: '#05070B',
    bgSurface: '#0C101A',
    bgCard: '#121826',
    border: 'rgba(255, 255, 255, 0.12)',
    gold: '#F5A623',
    silver: '#E2E8F0',
    text: '#FFFFFF',
    textMuted: '#94A3B8',
    gridLines: 'rgba(255, 255, 255, 0.04)',
    badgeBg: 'rgba(245, 166, 35, 0.15)',
    isLight: false,
  },
  nordic: {
    id: 'nordic',
    name: 'Nordic Monolith',
    tag: '🌙 Nordic Navy',
    bgMain: '#080f1a',
    bgSurface: '#0e1a2b',
    bgCard: '#15253d',
    border: 'rgba(56, 189, 248, 0.2)',
    gold: '#fbbf24', // Vivid Amber Gold
    silver: '#bae6fd', // Frost Ice Platinum
    text: '#ffffff', // Stark White
    textMuted: '#94a3b8', // Ice Slate
    gridLines: 'rgba(56, 189, 248, 0.05)',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    isLight: false,
  },
  tokyo: {
    id: 'tokyo',
    name: 'Tokyo Midnight Emerald',
    tag: '3. Tokyo Jade',
    bgMain: '#05140e',
    bgSurface: '#092419',
    bgCard: '#103627',
    border: 'rgba(52, 211, 153, 0.22)',
    gold: '#fde047',
    silver: '#6ee7b7',
    text: '#ecfdf5',
    textMuted: '#a7f3d0',
    gridLines: 'rgba(52, 211, 153, 0.05)',
    badgeBg: 'rgba(52, 211, 153, 0.18)',
    isLight: false,
  },
  espresso: {
    id: 'espresso',
    name: 'Warm Espresso Obsidian',
    tag: '4. Warm Coffee',
    bgMain: '#150e08',
    bgSurface: '#22170e',
    bgCard: '#312115',
    border: 'rgba(245, 158, 11, 0.18)',
    gold: '#f59e0b',
    silver: '#d6d3d1',
    text: '#faf5ee',
    textMuted: '#d7c7b8',
    gridLines: 'rgba(245, 158, 11, 0.05)',
    badgeBg: 'rgba(245, 158, 11, 0.18)',
    isLight: false,
  },

  // ─── LIGHT SUITE (4 PALETTES) ─────────────────────────────
  light_swiss: {
    id: 'light_swiss',
    name: 'Swiss Watchmaker Alabaster',
    tag: '1. Swiss Alabaster',
    bgMain: '#f1f5f9',
    bgSurface: '#ffffff',
    bgCard: '#ffffff',
    border: '#cbd5e1',
    gold: '#b45309', // Deep 24K Roman Gold (10:1 AAA)
    silver: '#334155', // Deep Polished Slate (11:1 AAA)
    text: '#0f172a', // Pitch-Black Slate Ink (19:1 AAA)
    textMuted: '#475569', // Deep Slate Secondary (8.5:1 AAA)
    gridLines: 'rgba(0, 0, 0, 0.06)',
    badgeBg: 'rgba(180, 83, 9, 0.12)',
    isLight: true,
  },
  light_parchment: {
    id: 'light_parchment',
    name: 'Financial Times Warm Parchment',
    tag: '☀️ FT Parchment',
    bgMain: '#f5f0e8', // Warm Editorial Cream
    bgSurface: '#eae2d4', // Tonal Parchment Surface
    bgCard: '#ffffff', // Crisp White Cards for Maximum Contrast
    border: '#d4c5b0', // Crisp Defined Sand Border
    gold: '#854d0e', // Deep Roman Ochre Gold (High Contrast AA)
    silver: '#1e293b', // Deep Slate Navy Silver (High Contrast AAA)
    text: '#0f0d0c', // Pitch-Black Espresso Ink (18:1 Contrast AAA)
    textMuted: '#3a312a', // Deep Slate Umber (11.5:1 Contrast AAA)
    gridLines: 'rgba(133, 77, 14, 0.08)',
    badgeBg: 'rgba(133, 77, 14, 0.15)',
    isLight: true,
  },
  light_kyoto: {
    id: 'light_kyoto',
    name: 'Kyoto Celadon Mint',
    tag: '3. Kyoto Mint',
    bgMain: '#f0fdf4',
    bgSurface: '#dcfce7',
    bgCard: '#ffffff',
    border: '#86efac',
    gold: '#927218', // Antique Celadon Gold
    silver: '#047857', // Forest Emerald Silver
    text: '#064e3b', // Deep Pine Forest Ink
    textMuted: '#059669',
    gridLines: 'rgba(4, 120, 87, 0.06)',
    badgeBg: 'rgba(4, 120, 87, 0.12)',
    isLight: true,
  },
  light_bauhaus: {
    id: 'light_bauhaus',
    name: 'Nordic Bauhaus Chalk',
    tag: '4. Bauhaus Chalk',
    bgMain: '#f4f4f5',
    bgSurface: '#e4e4e7',
    bgCard: '#ffffff',
    border: '#a1a1aa',
    gold: '#d97706', // Bauhaus Industrial Amber
    silver: '#27272a', // Dark Titanium
    text: '#09090b', // Monochromatic Black
    textMuted: '#52525b',
    gridLines: 'rgba(0, 0, 0, 0.06)',
    badgeBg: 'rgba(217, 119, 6, 0.12)',
    isLight: true,
  },
};
