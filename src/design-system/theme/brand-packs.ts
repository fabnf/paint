import type { SemanticColors } from '../tokens/colors.tokens';
import { darkSemanticColors, lightSemanticColors } from '../tokens/colors.tokens';
import type { GradientToken } from '../tokens/effects.tokens';
import type { RadiusToken } from '../tokens/spacing.tokens';
import type { ThemeMode } from './theme.types';

/**
 * A brand pack: one identity, both modes, the whole vocabulary.
 *
 * Components never see a pack — they keep reading `--ds-*`, which is the whole
 * point. A pack is what the theme layer pours into those properties: a **full**
 * semantic colour set for light and for dark (the same roles
 * `ThemeDefinition` has always published — a brand that forgot a role would be
 * shipping a bug, so the type refuses partials), plus optional overrides for
 * the few non-colour tokens a brand may own: gradients, radii, font families.
 *
 * Everything a pack does not override stays Paint's: spacing, type scale,
 * shadows, motion. Brands differ in voice, not in physics.
 */
export interface BrandPack {
  /** Stable id: persisted, written to `data-brand`, used by `[dsBrand]`. */
  readonly id: string;
  /** Human name, for switchers and galleries. Packs do not get a lockup. */
  readonly name: string;
  /** The full semantic set, per mode. No partials — the type insists. */
  readonly colors: Readonly<Record<ThemeMode, SemanticColors>>;
  /** Brand paint mixes. Omitted gradients stay Paint's. */
  readonly gradients?: Partial<Record<GradientToken, string>>;
  /** Corner language. A corporate pack may cut tighter, a warm one rounder. */
  readonly radii?: Partial<Record<RadiusToken, string>>;
  /** Font stacks. No font files are loaded here — bring stacks, not URLs. */
  readonly fonts?: Partial<Record<'sans' | 'display' | 'mono', string>>;
}

/**
 * Paint — the default pack, and the design system's own face.
 *
 * Exactly the palette the system has always had: Wet Paint's violet, magenta
 * and ink, by reference, not by copy — `tokens/colors.tokens.ts` remains the
 * single place those values live.
 */
export const paintBrandPack: BrandPack = {
  id: 'paint',
  name: 'Paint',
  colors: {
    light: lightSemanticColors,
    dark: darkSemanticColors,
  },
  // No overrides: the base tokens *are* Paint.
};

/*
 * The status roles are shared physics, not brand voice: success must mean the
 * same green to a colour-blind user on every brand, and these values already
 * clear every AA pair in both modes. A pack may still override them — the
 * type takes a full set — but the built-in packs deliberately agree.
 */
const statusLight = {
  success: lightSemanticColors.success,
  successMuted: lightSemanticColors.successMuted,
  warning: lightSemanticColors.warning,
  warningMuted: lightSemanticColors.warningMuted,
  danger: lightSemanticColors.danger,
  dangerMuted: lightSemanticColors.dangerMuted,
  info: lightSemanticColors.info,
  infoMuted: lightSemanticColors.infoMuted,
} as const;

const statusDark = {
  success: darkSemanticColors.success,
  successMuted: darkSemanticColors.successMuted,
  warning: darkSemanticColors.warning,
  warningMuted: darkSemanticColors.warningMuted,
  danger: darkSemanticColors.danger,
  dangerMuted: darkSemanticColors.dangerMuted,
  info: darkSemanticColors.info,
  infoMuted: darkSemanticColors.infoMuted,
} as const;

/**
 * Tidewater — the cool corporate pack.
 *
 * Teal primary on blue-slate neutrals, a cool blue accent, corners cut a step
 * tighter, and the serif display face traded for the sans stack: a brand that
 * wears a suit. Every pair below clears the same AA contrast bars as Paint's
 * own palette (see `brand-packs.spec.ts`, which enforces it).
 */
export const tidewaterBrandPack: BrandPack = {
  id: 'tidewater',
  name: 'Tidewater',
  colors: {
    light: {
      background: '#eef3f4',
      surface: '#ffffff',
      surfaceElevated: '#ffffff',
      surfaceSunken: '#f3f7f8',
      border: '#d7e0e3',
      borderStrong: '#b9c7cc',
      borderControl: '#748c95',
      text: '#0e1f26',
      textMuted: '#42606c',
      textSubtle: '#53707b',
      primary: '#0f6f68',
      primaryHover: '#0b5a54',
      primaryMuted: '#d9f2ef',
      onPrimary: '#ffffff',
      accent: '#1d5bd8',
      accentHover: '#1a49ac',
      accentMuted: '#dfe9fd',
      onAccent: '#ffffff',
      ...statusLight,
      focusRing: '#0d9488',
      overlay: 'rgb(14 31 38 / 55%)',
    },
    dark: {
      background: '#0a1519',
      surface: '#12242b',
      surfaceElevated: '#1a323b',
      surfaceSunken: '#060e11',
      border: '#27424c',
      borderStrong: '#38565f',
      borderControl: '#6b868f',
      text: '#e9f1f3',
      textMuted: '#bed0d6',
      textSubtle: '#a3bac1',
      primary: '#4fd6c5',
      primaryHover: '#83e4d8',
      primaryMuted: '#07302c',
      onPrimary: '#0a1519',
      accent: '#87b5ff',
      accentHover: '#b0ccff',
      accentMuted: '#102546',
      onAccent: '#0a1519',
      ...statusDark,
      focusRing: '#2dd4bf',
      overlay: 'rgb(4 10 12 / 72%)',
    },
  },
  gradients: {
    brand: 'linear-gradient(135deg, #14b8a6 0%, #0f6f68 52%, #10365c 100%)',
    wash: 'linear-gradient(135deg, #0f6f68 0%, #1d5bd8 100%)',
    energy: 'linear-gradient(135deg, #5eead4 0%, #1d5bd8 100%)',
  },
  radii: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
  },
  fonts: {
    // A corporate brand has no serif moments: headings use the sans stack.
    display: '"DM Sans", "Segoe UI", system-ui, sans-serif',
  },
};

/**
 * Ember — the warm pack.
 *
 * Amber primary on stone neutrals, a kiln-red accent, corners a step rounder.
 * Unmistakably not Paint and not Tidewater at a glance — which is the test a
 * second and third brand exist to pass.
 */
export const emberBrandPack: BrandPack = {
  id: 'ember',
  name: 'Ember',
  colors: {
    light: {
      background: '#f7f1e8',
      surface: '#fffcf7',
      surfaceElevated: '#fffcf7',
      surfaceSunken: '#f3eadd',
      border: '#e6dac7',
      borderStrong: '#cdbca2',
      borderControl: '#95805f',
      text: '#271c10',
      textMuted: '#6a5636',
      textSubtle: '#7a6645',
      primary: '#9a4d00',
      primaryHover: '#7d3f00',
      primaryMuted: '#ffe8c7',
      onPrimary: '#ffffff',
      accent: '#b32d27',
      accentHover: '#92241f',
      accentMuted: '#ffe4de',
      onAccent: '#ffffff',
      ...statusLight,
      focusRing: '#c2410c',
      overlay: 'rgb(39 28 16 / 55%)',
    },
    dark: {
      background: '#191007',
      surface: '#241a0e',
      surfaceElevated: '#322414',
      surfaceSunken: '#100a04',
      border: '#453624',
      borderStrong: '#5c4a33',
      borderControl: '#8b7355',
      text: '#f7efe3',
      textMuted: '#d9c8ab',
      textSubtle: '#c3b090',
      primary: '#f3a73c',
      primaryHover: '#f8c470',
      primaryMuted: '#3c2605',
      onPrimary: '#191007',
      accent: '#ff9d8a',
      accentHover: '#ffbfb2',
      accentMuted: '#42110b',
      onAccent: '#191007',
      ...statusDark,
      focusRing: '#f59e0b',
      overlay: 'rgb(10 6 2 / 72%)',
    },
  },
  gradients: {
    brand: 'linear-gradient(135deg, #f59e0b 0%, #c2410c 52%, #7c2d12 100%)',
    wash: 'linear-gradient(135deg, #c2410c 0%, #b32d27 100%)',
    energy: 'linear-gradient(135deg, #fde68a 0%, #ff6d4d 100%)',
  },
  radii: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
  },
};

/** The packs Paint ships. A host registers what it offers — this, or its own. */
export const builtInBrandPacks: readonly BrandPack[] = [
  paintBrandPack,
  tidewaterBrandPack,
  emberBrandPack,
];
