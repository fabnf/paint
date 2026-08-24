/**
 * Bootstrap theme bridge.
 *
 * Paint primitives render Bootstrap classes, and Bootstrap exposes its own
 * `--bs-*` custom property API. This module translates a Paint
 * `ThemeDefinition` into that API so Bootstrap components inherit Paint's
 * semantic roles — in both directions of a light/dark switch — without
 * recompiling any Sass.
 *
 * Paint tokens stay the single source of truth: `--ds-*` is authored,
 * `--bs-*` is derived.
 */

import type { ThemeDefinition } from './theme.types';

/** Converts `#rrggbb` / `#rgb` to the `"r, g, b"` triplet Bootstrap expects. */
export function hexToRgbTriplet(hex: string): string {
  const value = hex.trim().replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((char) => char + char)
          .join('')
      : value;

  const int = Number.parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(int)) {
    return '0, 0, 0';
  }

  // eslint-disable-next-line no-bitwise
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255].join(', ');
}

/**
 * Maps a Paint theme onto Bootstrap's custom properties.
 *
 * Bootstrap compiles utilities such as `.text-primary` / `.bg-primary` against
 * `--bs-*-rgb` triplets, so both hex and RGB forms are published.
 */
export function themeToBootstrapVariables(theme: ThemeDefinition): Record<string, string> {
  const { colors } = theme;

  const vars: Record<string, string> = {
    // Body & surfaces
    '--bs-body-bg': colors.background,
    '--bs-body-bg-rgb': hexToRgbTriplet(colors.background),
    '--bs-body-color': colors.text,
    '--bs-body-color-rgb': hexToRgbTriplet(colors.text),
    '--bs-emphasis-color': colors.text,
    '--bs-emphasis-color-rgb': hexToRgbTriplet(colors.text),
    '--bs-secondary-color': colors.textMuted,
    '--bs-secondary-color-rgb': hexToRgbTriplet(colors.textMuted),
    '--bs-secondary-bg': colors.surface,
    '--bs-secondary-bg-rgb': hexToRgbTriplet(colors.surface),
    '--bs-tertiary-color': colors.textSubtle,
    '--bs-tertiary-color-rgb': hexToRgbTriplet(colors.textSubtle),
    '--bs-tertiary-bg': colors.surfaceElevated,
    '--bs-tertiary-bg-rgb': hexToRgbTriplet(colors.surfaceElevated),

    // Elevation — Bootstrap's shadow utilities read these.
    '--bs-box-shadow-sm': 'var(--ds-shadow-sm)',
    '--bs-box-shadow': 'var(--ds-shadow-md)',
    '--bs-box-shadow-lg': 'var(--ds-shadow-lg)',

    // Borders & focus
    '--bs-border-color': colors.border,
    '--bs-border-color-translucent': colors.border,
    '--bs-focus-ring-color': colors.focusRing,

    // Links
    '--bs-link-color': colors.primary,
    '--bs-link-color-rgb': hexToRgbTriplet(colors.primary),
    '--bs-link-hover-color': colors.primaryHover,
    '--bs-link-hover-color-rgb': hexToRgbTriplet(colors.primaryHover),

    // Typography
    '--bs-body-font-family': 'var(--ds-font-sans)',
    '--bs-body-font-size': 'var(--ds-font-size-md)',
    '--bs-body-font-weight': 'var(--ds-font-weight-regular)',
    '--bs-body-line-height': 'var(--ds-line-height-normal)',
    '--bs-font-monospace': 'var(--ds-font-mono)',
    '--bs-code-color': colors.text,

    // Radii
    '--bs-border-radius': 'var(--ds-radius-md)',
    '--bs-border-radius-sm': 'var(--ds-radius-sm)',
    '--bs-border-radius-lg': 'var(--ds-radius-lg)',
    '--bs-border-radius-xl': 'var(--ds-radius-xl)',
    '--bs-border-radius-xxl': 'var(--ds-radius-2xl)',
    '--bs-border-radius-pill': 'var(--ds-radius-full)',
  };

  // Paint's brand accent is not a Bootstrap role; it reaches CSS through
  // Paint's own utility values (bg-accent / text-accent) in styles/bootstrap.scss.
  const roles: ReadonlyArray<readonly [string, string, string]> = [
    ['primary', colors.primary, colors.primaryMuted],
    ['success', colors.success, colors.successMuted],
    ['warning', colors.warning, colors.warningMuted],
    ['danger', colors.danger, colors.dangerMuted],
    ['info', colors.info, colors.infoMuted],
    ['secondary', colors.textMuted, colors.surfaceSunken],
  ];

  for (const [name, base, subtle] of roles) {
    vars[`--bs-${name}`] = base;
    vars[`--bs-${name}-rgb`] = hexToRgbTriplet(base);
    vars[`--bs-${name}-text-emphasis`] = base;
    vars[`--bs-${name}-bg-subtle`] = subtle;
    vars[`--bs-${name}-border-subtle`] = base;
  }

  return vars;
}
