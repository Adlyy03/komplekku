/**
 * Komplekku Design System Tokens
 * Source of truth: desain.md §3-7
 */

import { Platform } from 'react-native';

// §3.1 Primary — "Pine"
export const primary = {
  50: '#F1F6F4',
  100: '#DCEAE4',
  200: '#B8D5CA',
  300: '#8CBAA9',
  400: '#5F9C87',
  500: '#3D7D69',
  600: '#28624F', // primary brand color
  700: '#1E4D3E',
  800: '#173D31',
  900: '#102A22',
} as const;

// §3.2 Secondary — "Clay"
export const secondary = {
  50: '#FBF3EE',
  200: '#EBCBB8',
  500: '#C97F55',
  600: '#AD6540',
  700: '#8A4F32',
} as const;

// §3.3 Accent — "Amber"
export const accent = {
  100: '#FBEEC9',
  500: '#D9A441',
  700: '#A9791F',
} as const;

// §3.4 Neutral — "Stone"
export const stone = {
  0: '#FFFFFF',
  25: '#FAF9F7',
  50: '#F4F2EF',
  100: '#E9E6E1',
  200: '#D9D4CC',
  300: '#BFB9AE',
  400: '#9C958A',
  500: '#7D766A',
  600: '#5E594F',
  700: '#443F37',
  800: '#2E2A24',
  900: '#1C1915',
} as const;

// §3.5 Semantic
export const semantic = {
  success: { 50: '#EEF6EE', 500: '#3F8C4D', 700: '#2A5F34' },
  warning: { 50: '#FBF3E4', 500: '#C98A2E', 700: '#8F5F19' },
  error: { 50: '#FBEEEC', 500: '#C4523F', 700: '#8E3A2B' },
  info: { 50: '#EEF3F8', 500: '#3E6FA8', 700: '#2A4C74' },
} as const;

export const Colors = {
  primary,
  secondary,
  accent,
  stone,
  semantic,
} as const;

// §5 Spacing System — 8pt base grid
export const Spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

// §6 Border Radius
export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

// §7 Shadow / Elevation
export const Elevation = {
  0: {
    // border only, no shadow
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  1: {
    shadowColor: '#1C1915',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  2: {
    shadowColor: '#1C1915',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  3: {
    shadowColor: '#1C1915',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  4: {
    shadowColor: '#1C1915',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 40,
    elevation: 10,
  },
} as const;

// §4 Typography
export const FontFamily = {
  display: 'Fraunces_600SemiBold',
  displayMedium: 'Fraunces_500Medium',
  body: 'Inter_400Regular',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
} as const;

export const Typography = {
  displayL: {
    fontFamily: FontFamily.display,
    fontSize: 32,
    lineHeight: 32 * 1.1,
    fontWeight: '600' as const,
  },
  displayM: {
    fontFamily: FontFamily.display,
    fontSize: 26,
    lineHeight: 26 * 1.15,
    fontWeight: '600' as const,
  },
  h1: {
    fontFamily: FontFamily.display,
    fontSize: 22,
    lineHeight: 22 * 1.2,
    fontWeight: '600' as const,
  },
  h2: {
    fontFamily: FontFamily.display,
    fontSize: 20,
    lineHeight: 20 * 1.25,
    fontWeight: '600' as const,
  },
  h3: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 17,
    lineHeight: 17 * 1.3,
    fontWeight: '600' as const,
  },
  bodyL: {
    fontFamily: FontFamily.body,
    fontSize: 16,
    lineHeight: 16 * 1.5,
    fontWeight: '400' as const,
  },
  bodyM: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 14 * 1.5,
    fontWeight: '400' as const,
  },
  bodyS: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    lineHeight: 13 * 1.45,
    fontWeight: '400' as const,
  },
  label: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    lineHeight: 13 * 1.2,
    fontWeight: '600' as const,
  },
  overline: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    lineHeight: 11 * 1.2,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.66,
  },
  numericPrice: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 18,
    lineHeight: 18 * 1.2,
    fontWeight: '700' as const,
  },
} as const;

// Tab bar constants
export const TAB_BAR_HEIGHT = 56;
export const MAX_CONTENT_WIDTH = 1120;
