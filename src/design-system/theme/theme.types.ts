import type { SemanticColors } from '../tokens/colors.tokens';
import { darkSemanticColors, lightSemanticColors } from '../tokens/colors.tokens';
import type { ElevationShadows } from '../tokens/effects.tokens';
import { blendModes, darkShadows, gradients, lightShadows, textures } from '../tokens/effects.tokens';
import { fontFamilies, fontSizes, fontWeights, letterSpacings, lineHeights, typeRamp } from '../tokens/typography.tokens';
import { avatarSizes, controlSizes, radii, spacingScale, spacingSemantic } from '../tokens/spacing.tokens';
import type { BrandPack } from './brand-packs';

export type ThemeMode = 'light' | 'dark';

export interface ThemeDefinition {
  mode: ThemeMode;
  colors: SemanticColors;
  /** Elevation resolves per mode: ink-tinted in light, abyssal in dark. */
  shadows: ElevationShadows;
}

export const lightTheme: ThemeDefinition = {
  mode: 'light',
  colors: lightSemanticColors,
  shadows: lightShadows,
};

export const darkTheme: ThemeDefinition = {
  mode: 'dark',
  colors: darkSemanticColors,
  shadows: darkShadows,
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const;

/**
 * Resolves a brand pack at a mode into the `ThemeDefinition` the rest of the
 * theme layer already speaks. Shadows stay Paint's per-mode elevation: brands
 * differ in voice, not in physics.
 */
export function resolveThemeDefinition(pack: BrandPack, mode: ThemeMode): ThemeDefinition {
  return {
    mode,
    colors: pack.colors[mode],
    shadows: mode === 'dark' ? darkShadows : lightShadows,
  };
}

/**
 * The semantic colour roles as `--ds-color-*` properties — the part of the
 * variable set that changes per brand and per mode. Exported on its own so the
 * scoped brand directive can paint exactly this onto one host.
 */
export function semanticColorVariables(colors: SemanticColors): Record<string, string> {
  return {
    '--ds-color-background': colors.background,
    '--ds-color-surface': colors.surface,
    '--ds-color-surface-elevated': colors.surfaceElevated,
    '--ds-color-surface-sunken': colors.surfaceSunken,
    '--ds-color-border': colors.border,
    '--ds-color-border-strong': colors.borderStrong,
    '--ds-color-border-control': colors.borderControl,
    '--ds-color-text': colors.text,
    '--ds-color-text-muted': colors.textMuted,
    '--ds-color-text-subtle': colors.textSubtle,
    '--ds-color-primary': colors.primary,
    '--ds-color-primary-hover': colors.primaryHover,
    '--ds-color-primary-muted': colors.primaryMuted,
    '--ds-color-on-primary': colors.onPrimary,
    '--ds-color-accent': colors.accent,
    '--ds-color-accent-hover': colors.accentHover,
    '--ds-color-accent-muted': colors.accentMuted,
    '--ds-color-on-accent': colors.onAccent,
    '--ds-color-success': colors.success,
    '--ds-color-success-muted': colors.successMuted,
    '--ds-color-warning': colors.warning,
    '--ds-color-warning-muted': colors.warningMuted,
    '--ds-color-danger': colors.danger,
    '--ds-color-danger-muted': colors.dangerMuted,
    '--ds-color-info': colors.info,
    '--ds-color-info-muted': colors.infoMuted,
    '--ds-color-focus-ring': colors.focusRing,
    '--ds-color-overlay': colors.overlay,
  };
}

/**
 * A pack's optional non-colour overrides, as the same custom properties the
 * base theme publishes — gradients, radii, font families, and the type-ramp
 * family slots that follow an overridden face. Only overridden keys are
 * emitted: everything else keeps the Paint value the base set just wrote.
 */
export function brandOverrideVariables(pack: BrandPack): Record<string, string> {
  const vars: Record<string, string> = {};

  for (const [key, value] of Object.entries(pack.gradients ?? {})) {
    vars[`--ds-gradient-${key}`] = value;
  }
  for (const [key, value] of Object.entries(pack.radii ?? {})) {
    vars[`--ds-radius-${key}`] = value;
  }

  const fonts = pack.fonts ?? {};
  if (fonts.sans) {
    vars['--ds-font-sans'] = fonts.sans;
  }
  if (fonts.display) {
    vars['--ds-font-display'] = fonts.display;
  }
  if (fonts.mono) {
    vars['--ds-font-mono'] = fonts.mono;
  }

  // The type ramp pins each role to a face; a role pinned to an overridden
  // face follows the brand, so `--ds-type-h1-family` never contradicts
  // `--ds-font-display`.
  for (const [name, style] of Object.entries(typeRamp)) {
    if (fonts.display && style.fontFamily === fontFamilies.display) {
      vars[`--ds-type-${name}-family`] = fonts.display;
    } else if (fonts.sans && style.fontFamily === fontFamilies.sans) {
      vars[`--ds-type-${name}-family`] = fonts.sans;
    } else if (fonts.mono && style.fontFamily === fontFamilies.mono) {
      vars[`--ds-type-${name}-family`] = fonts.mono;
    }
  }

  return vars;
}

/** Maps a theme definition to CSS custom properties. */
export function themeToCssVariables(theme: ThemeDefinition): Record<string, string> {
  const colorVars = semanticColorVariables(theme.colors);

  // Elevation, texture and gradient — the "printed, not rendered" layer.
  const effectVars: Record<string, string> = {};
  for (const [key, value] of Object.entries(theme.shadows)) {
    effectVars[`--ds-shadow-${key}`] = value;
  }
  for (const [key, value] of Object.entries(textures)) {
    effectVars[`--ds-texture-${key}`] = value;
  }
  for (const [key, value] of Object.entries(gradients)) {
    effectVars[`--ds-gradient-${key}`] = value;
  }
  effectVars['--ds-blend-pigment'] = blendModes[theme.mode];

  const typographyVars: Record<string, string> = {
    '--ds-font-sans': fontFamilies.sans,
    '--ds-font-display': fontFamilies.display,
    '--ds-font-mono': fontFamilies.mono,
    '--ds-font-weight-regular': String(fontWeights.regular),
    '--ds-font-weight-medium': String(fontWeights.medium),
    '--ds-font-weight-semibold': String(fontWeights.semibold),
    '--ds-font-weight-bold': String(fontWeights.bold),
  };

  for (const [key, value] of Object.entries(fontSizes)) {
    typographyVars[`--ds-font-size-${key}`] = value;
  }

  for (const [key, value] of Object.entries(lineHeights)) {
    typographyVars[`--ds-line-height-${key}`] = String(value);
  }

  for (const [key, value] of Object.entries(letterSpacings)) {
    typographyVars[`--ds-letter-spacing-${key}`] = value;
  }

  for (const [name, style] of Object.entries(typeRamp)) {
    typographyVars[`--ds-type-${name}-family`] = style.fontFamily;
    typographyVars[`--ds-type-${name}-size`] = style.fontSize;
    typographyVars[`--ds-type-${name}-weight`] = String(style.fontWeight);
    typographyVars[`--ds-type-${name}-line-height`] = String(style.lineHeight);
    typographyVars[`--ds-type-${name}-letter-spacing`] = style.letterSpacing;
  }

  const spacingVars: Record<string, string> = {};
  for (const [key, value] of Object.entries(spacingScale)) {
    spacingVars[`--ds-space-${String(key).replace('.', '_')}`] = value;
  }
  for (const [key, value] of Object.entries(spacingSemantic)) {
    spacingVars[`--ds-space-${kebab(key)}`] = value;
  }
  for (const [key, value] of Object.entries(radii)) {
    spacingVars[`--ds-radius-${key}`] = value;
  }

  // Control sizing: one scale shared by Button, Input, Textarea, Checkbox,
  // Radio and Switch, so a row of mixed controls lines up.
  const controlVars: Record<string, string> = {};
  for (const [size, metrics] of Object.entries(controlSizes)) {
    for (const [metric, value] of Object.entries(metrics)) {
      controlVars[`--ds-control-${kebab(metric)}-${size}`] = value;
    }
  }
  for (const [size, value] of Object.entries(avatarSizes)) {
    controlVars[`--ds-avatar-size-${size}`] = value;
  }

  return {
    ...colorVars,
    ...effectVars,
    ...typographyVars,
    ...spacingVars,
    ...controlVars,
    '--ds-theme-mode': theme.mode,
  };
}

function kebab(value: string): string {
  return value.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
