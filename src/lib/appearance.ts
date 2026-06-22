import type { AccentPreset, FontPreset, ThemePreset } from '../types';

interface ThemePalette {
  appBg: string;
  cardBg: string;
  panelBg: string;
  panelAltBg: string;
  text: string;
  muted: string;
  border: string;
}

interface AccentPalette {
  accent: string;
  accentSoft: string;
  accentText: string;
}

interface FontPalette {
  display: string;
  mono: string;
}

export const THEME_PRESET_LABELS: Record<ThemePreset, string> = {
  graphite: 'Graphite',
  midnight: 'Midnight',
  paper: 'Paper',
};

export const ACCENT_PRESET_LABELS: Record<AccentPreset, string> = {
  orange: 'Orange',
  cyan: 'Cyan',
  green: 'Green',
  purple: 'Purple',
  pink: 'Pink',
};

export const FONT_PRESET_LABELS: Record<FontPreset, string> = {
  system: 'System',
  rounded: 'Rounded',
  mono: 'Mono',
  serif: 'Serif',
};

const THEMES: Record<ThemePreset, ThemePalette> = {
  graphite: {
    appBg: '#000000',
    cardBg: '#000000',
    panelBg: '#1C1C1E',
    panelAltBg: '#2C2C2E',
    text: '#F2F2F7',
    muted: '#8E8E93',
    border: '#2C2C2E',
  },
  midnight: {
    appBg: '#070C1B',
    cardBg: '#0D152B',
    panelBg: '#17233F',
    panelAltBg: '#243257',
    text: '#E8EEFF',
    muted: '#8FA2C8',
    border: '#2B3E69',
  },
  paper: {
    appBg: '#F3F1EC',
    cardBg: '#FCFBF8',
    panelBg: '#ECE7DC',
    panelAltBg: '#DFD7C7',
    text: '#202020',
    muted: '#706A5E',
    border: '#D2C9B8',
  },
};

const ACCENTS: Record<AccentPreset, AccentPalette> = {
  orange: { accent: '#FF9F0A', accentSoft: '#443012', accentText: '#111111' },
  cyan: { accent: '#64D2FF', accentSoft: '#143342', accentText: '#111111' },
  green: { accent: '#30D158', accentSoft: '#163524', accentText: '#0B0F0C' },
  purple: { accent: '#BF5AF2', accentSoft: '#331D3F', accentText: '#121212' },
  pink: { accent: '#FF5CA8', accentSoft: '#401C2E', accentText: '#121212' },
};

const FONTS: Record<FontPreset, FontPalette> = {
  system: {
    display: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'SF Mono', 'Fira Code', monospace",
  },
  rounded: {
    display: "'SF Pro Rounded', 'Avenir Next Rounded', -apple-system, 'Segoe UI', sans-serif",
    mono: "'SF Mono', 'Fira Code', monospace",
  },
  mono: {
    display: "'SF Mono', 'Fira Code', ui-monospace, monospace",
    mono: "'SF Mono', 'Fira Code', ui-monospace, monospace",
  },
  serif: {
    display: "'New York', 'Georgia', 'Times New Roman', serif",
    mono: "'SF Mono', 'Fira Code', monospace",
  },
};

export function buildAppearanceCssVariables(
  themePreset: ThemePreset,
  accentPreset: AccentPreset,
  fontPreset: FontPreset,
): Record<string, string> {
  const theme = THEMES[themePreset];
  const accent = ACCENTS[accentPreset];
  const font = FONTS[fontPreset];
  const lightTheme = themePreset === 'paper';

  return {
    '--app-bg': theme.appBg,
    '--app-card-bg': theme.cardBg,
    '--app-panel-bg': theme.panelBg,
    '--app-panel-alt-bg': theme.panelAltBg,
    '--app-text': theme.text,
    '--app-muted': theme.muted,
    '--app-border': theme.border,

    '--app-number-bg': lightTheme ? '#DDD6C8' : '#333333',
    '--app-number-active': lightTheme ? '#CAC1B0' : '#555555',
    '--app-number-text': lightTheme ? '#1A1A1A' : '#FFFFFF',

    '--app-function-bg': lightTheme ? '#D3CCBE' : '#505050',
    '--app-function-active': lightTheme ? '#C5BCAA' : '#737373',
    '--app-function-text': lightTheme ? '#1E1E1E' : '#FFFFFF',

    '--app-special-bg': lightTheme ? '#C9BEA9' : '#A5A5A5',
    '--app-special-active': lightTheme ? '#B8AB93' : '#C8C8C8',
    '--app-special-text': '#000000',

    '--app-operator-bg': accent.accent,
    '--app-operator-active': accent.accent,
    '--app-operator-text': accent.accentText,
    '--app-operator-active-bg': lightTheme ? '#F8F7F3' : '#FFFFFF',
    '--app-operator-active-text': accent.accent,

    '--app-accent-bg': accent.accentSoft,
    '--app-accent-active': accent.accentSoft,
    '--app-accent-text': accent.accent,

    '--app-danger-bg': '#3A1C1C',
    '--app-danger-active': '#5A2828',
    '--app-danger-text': '#FF453A',

    '--app-dim-bg': lightTheme ? '#E7E1D5' : '#1A1A1A',
    '--app-dim-active': lightTheme ? '#E7E1D5' : '#1A1A1A',
    '--app-dim-text': lightTheme ? '#AAA398' : '#4A4A4A',

    '--app-font-display': font.display,
    '--app-font-mono': font.mono,
  };
}
