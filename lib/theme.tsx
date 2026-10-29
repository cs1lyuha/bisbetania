import React, { createContext, useContext, useMemo } from 'react';
import { Platform, View, useColorScheme } from 'react-native';
import { vars } from 'nativewind';
import { usePersistentState } from './storage';
import { neutralsFor } from './color';

export const ACCENTS = {
  betania: { light: '#1A472A', dark: '#4C9A6A', tint: '#EAF4EC', darkTint: '#1C2E23' },
  ocean: { light: '#1E4E8C', dark: '#5B8FD6', tint: '#E8EFF9', darkTint: '#1A2638' },
  burgundy: { light: '#7A1F3D', dark: '#C7577A', tint: '#F7E9EE', darkTint: '#33191F' },
  violet: { light: '#5B3A8E', dark: '#9A7BD0', tint: '#F0EAF8', darkTint: '#261E33' },
  amber: { light: '#8A5A12', dark: '#D49A3A', tint: '#F8F0E1', darkTint: '#332A1A' },
  teal: { light: '#0F5E63', dark: '#3FA7A9', tint: '#E3F2F2', darkTint: '#16302F' },
} as const;

export type Accent = keyof typeof ACCENTS;
export type ThemeMode = 'system' | 'light' | 'dark';

// Auriul jocurilor și al realizărilor: iese în evidență pe oricare dintre cele 6 accente (e și culoarea flăcării seriei).
const GOLD = {
  light: { goldFrom: '#FFD27A', goldTo: '#F59E0B', onGold: '#2B1A03' },
  dark: { goldFrom: '#E3A23C', goldTo: '#B9700C', onGold: '#1A1004' },
};

export const HIGHLIGHTS = {
  yellow: { light: '#FDF0B5', dark: '#5A4B12' },
  green: { light: '#D5F0D9', dark: '#1F4A2B' },
  blue: { light: '#D6E6FB', dark: '#1D3554' },
  pink: { light: '#F9D9E6', dark: '#4D2235' },
} as const;
export type HighlightColor = keyof typeof HIGHLIGHTS;

export interface Settings {
  accent: Accent;
  mode: ThemeMode;
  fontSize: number;
  serif: boolean;
  notify: boolean;
  notifyHour: number;
}

const DEFAULT_SETTINGS: Settings = {
  accent: 'betania',
  mode: 'system',
  fontSize: 18,
  serif: true,
  notify: false,
  notifyHour: 8,
};

function rgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

function makeColors(accent: Accent, dark: boolean) {
  const a = ACCENTS[accent];
  // Fundalul, cardurile, marginile și textul sunt din nuanța accentului (vezi lib/color.ts).
  const n = neutralsFor(a.light, dark);
  return {
    isDark: dark,
    primary: dark ? a.dark : a.light,
    primaryDeep: a.light,
    // Varianta deschisă a accentului, în ambele moduri: capătul luminos al gradientului din antete.
    primaryBright: a.dark,
    primaryLight: dark ? a.darkTint : a.tint,
    // Textul de pe primary: alb pe accentul închis; în modul întunecat accentul e deschis și albul n-ar avea contrast.
    onPrimary: dark ? n.bg : '#FFFFFF',
    heroOverlay: `${a.light}B8`,
    ...(dark ? GOLD.dark : GOLD.light),
    ...n,
  };
}

export type ThemeColors = ReturnType<typeof makeColors>;

interface ThemeContextType {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  colors: ThemeColors;
  serifFont: string | undefined;
  loaded: boolean;
}

const SERIF = Platform.select({ ios: 'Georgia', default: 'serif' });

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings, loaded] = usePersistentState<Settings>('settings', DEFAULT_SETTINGS);
  const system = useColorScheme();
  const dark = settings.mode === 'dark' || (settings.mode === 'system' && system === 'dark');
  const colors = useMemo(() => makeColors(settings.accent, dark), [settings.accent, dark]);

  const value = useMemo<ThemeContextType>(
    () => ({
      settings,
      updateSettings: (patch) => setSettings((prev) => ({ ...prev, ...patch })),
      colors,
      serifFont: settings.serif ? SERIF : undefined,
      loaded,
    }),
    [settings, colors, loaded, setSettings],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1, backgroundColor: colors.bg }, themeVars(colors)]}>{children}</View>
    </ThemeContext.Provider>
  );
}

/** Culorile temei ca variabile CSS, pentru clasele NativeWind (bg-card, text-ink…). */
function themeVars(colors: ThemeColors) {
  return vars({
    '--primary': rgb(colors.primary),
    '--primary-light': rgb(colors.primaryLight),
    '--on-primary': rgb(colors.onPrimary),
    '--bg': rgb(colors.bg),
    '--card': rgb(colors.card),
    '--ink': rgb(colors.ink),
    '--muted': rgb(colors.muted),
    '--line': rgb(colors.line),
  });
}

/**
 * Pune din nou variabilele temei. Necesar în ferestrele <Modal>: pe web sunt randate în afara
 * elementului rădăcină și altfel ar primi culorile implicite (luminoase).
 */
export function ThemeScope({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <View style={[{ flex: 1 }, themeVars(colors)]}>{children}</View>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
}
