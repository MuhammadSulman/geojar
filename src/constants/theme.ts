import {MD3DarkTheme, MD3LightTheme, useTheme} from 'react-native-paper';
import type {MD3Theme} from 'react-native-paper';

export interface AppColors {
  primary: string;
  primaryDim: string;
  primarySoft: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  surfacePressed: string;
  outline: string;
  outlinePressed: string;
  onSurface: string;
  onSurfaceMuted: string;
  placeholder: string;
  favorite: string;
  error: string;
  markerBg: string;
  markerLabelBg: string;
  markerLabelText: string;
}

export type AppTheme = MD3Theme & {appColors: AppColors};

const darkAppColors: AppColors = {
  primary: '#16A34A',
  primaryDim: '#16A34A44',
  primarySoft: '#16A34A1A',
  background: '#0D0F14',
  surface: '#1E2230',
  surfaceAlt: '#161920',
  surfacePressed: '#252A3A',
  outline: '#2A2F42',
  outlinePressed: '#3A4060',
  onSurface: '#F0F2F8',
  onSurfaceMuted: '#7B82A0',
  placeholder: '#555',
  favorite: '#EF4444',
  error: '#EF4444',
  markerBg: '#FFFFFF',
  markerLabelBg: '#1E2230',
  markerLabelText: '#F0F2F8',
};

const lightAppColors: AppColors = {
  primary: '#16A34A',
  primaryDim: '#16A34A33',
  primarySoft: '#16A34A14',
  background: '#FFFFFF',
  surface: '#F4F6FA',
  surfaceAlt: '#EDF0F5',
  surfacePressed: '#E2E6EE',
  outline: '#D7DBE3',
  outlinePressed: '#B6BCC9',
  onSurface: '#1C1B1F',
  onSurfaceMuted: '#5C6275',
  placeholder: '#9AA0AC',
  favorite: '#EF4444',
  error: '#EF4444',
  markerBg: '#FFFFFF',
  markerLabelBg: '#1C1B1F',
  markerLabelText: '#FFFFFF',
};

export const DarkTheme: AppTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: darkAppColors.primary,
    background: darkAppColors.background,
    surface: darkAppColors.surface,
    surfaceVariant: darkAppColors.surfaceAlt,
    onSurface: darkAppColors.onSurface,
    onSurfaceVariant: darkAppColors.onSurfaceMuted,
    outline: darkAppColors.outline,
    error: darkAppColors.error,
  },
  appColors: darkAppColors,
};

export const LightTheme: AppTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: lightAppColors.primary,
    background: lightAppColors.background,
    surface: lightAppColors.surface,
    surfaceVariant: lightAppColors.surfaceAlt,
    onSurface: lightAppColors.onSurface,
    onSurfaceVariant: lightAppColors.onSurfaceMuted,
    outline: lightAppColors.outline,
    error: lightAppColors.error,
  },
  appColors: lightAppColors,
};

export function useAppTheme(): AppTheme {
  return useTheme() as AppTheme;
}

/**
 * Append an alpha channel to a hex color. Accepts `#RGB`, `#RRGGBB`, or
 * `#RRGGBBAA` and returns `#RRGGBBAA`. Alpha is clamped to [0, 1] and
 * rounded to 2 hex digits.
 */
export function withAlpha(hex: string, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha));
  const byte = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();

  let rgb = hex.replace('#', '');
  if (rgb.length === 3) {
    rgb = rgb
      .split('')
      .map(c => c + c)
      .join('');
  } else if (rgb.length === 8) {
    rgb = rgb.slice(0, 6);
  }
  return `#${rgb.toUpperCase()}${byte}`;
}
