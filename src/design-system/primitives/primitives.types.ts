/**
 * Shared primitive contracts.
 *
 * Primitives accept Paint tokens and emit Bootstrap utility classes. Keeping
 * the vocabulary here guarantees `ds-box`, `ds-flex`, `ds-stack` and `ds-grid`
 * stay consistent, and that Bootstrap is an implementation detail consumers
 * never have to learn.
 */

/**
 * Space tokens available to primitives — the 4px scale from
 * `tokens/spacing.tokens.ts`, mirrored into Bootstrap's `$spacers`.
 */
export const SPACE_TOKENS = [
  0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 20, 24,
] as const;

export type SpaceValue = (typeof SPACE_TOKENS)[number];

/**
 * Token → class fragment. Half steps such as `1.5` become `1_5`, since a dot
 * is not valid in a CSS class name (the token layer names them the same way).
 */
export function spaceToken(value: string | number): string {
  return String(value).replace('.', '_');
}

/** Responsive breakpoints, named after Bootstrap's grid tiers. */
export const BREAKPOINTS = ['sm', 'md', 'lg', 'xl', 'xxl'] as const;

export type Breakpoint = (typeof BREAKPOINTS)[number];

/**
 * A value that can be set per breakpoint.
 *
 * @example
 * ```html
 * <ds-grid [cols]="{ base: 1, md: 2, lg: 4 }" />
 * ```
 */
export type Responsive<T> = T | ({ base?: T } & Partial<Record<Breakpoint, T>>);

export type JustifyContent = 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
export type AlignItems = 'start' | 'end' | 'center' | 'baseline' | 'stretch';
export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
export type FlexWrap = 'wrap' | 'nowrap' | 'wrap-reverse';

export type Radius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'blob';
export type Elevation = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'glow';

export type Surface =
  | 'transparent'
  | 'surface'
  | 'surface-elevated'
  | 'surface-sunken'
  | 'canvas'
  | 'primary'
  | 'primary-muted'
  | 'accent'
  | 'accent-muted'
  | 'success-muted'
  | 'warning-muted'
  | 'danger-muted'
  | 'info-muted'
  // Brand paint mixes (tokens/effects.tokens.ts). Decorative: they carry their
  // own text color, because a gradient has no semantic role.
  | 'brand'
  | 'wash'
  | 'energy';

export type BorderSide = true | false | 'top' | 'bottom' | 'start' | 'end';

const ELEVATION_CLASS: Record<Elevation, string> = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  glow: 'shadow-glow',
};

const SURFACE_CLASS: Record<Surface, string> = {
  transparent: '',
  surface: 'bg-surface',
  'surface-elevated': 'bg-surface-elevated',
  'surface-sunken': 'bg-surface-sunken',
  canvas: 'bg-canvas',
  primary: 'bg-primary text-on-primary',
  'primary-muted': 'bg-primary-muted',
  accent: 'bg-accent text-on-accent',
  'accent-muted': 'bg-accent-muted',
  'success-muted': 'bg-success-muted',
  'warning-muted': 'bg-warning-muted',
  'danger-muted': 'bg-danger-muted',
  'info-muted': 'bg-info-muted',
  // The mixes are saturated in every theme, so their text color is fixed.
  brand: 'bg-brand text-white',
  wash: 'bg-wash text-white',
  energy: 'bg-energy text-black',
};

/** `rounded-*` values registered in Paint's Bootstrap utility extension. */
export function radiusClass(radius: Radius | null | undefined): string {
  return radius ? `rounded-${radius}` : '';
}

export function elevationClass(elevation: Elevation | null | undefined): string {
  return elevation ? ELEVATION_CLASS[elevation] : '';
}

export function surfaceClass(surface: Surface | null | undefined): string {
  return surface ? SURFACE_CLASS[surface] : '';
}

export function borderClass(border: BorderSide | null | undefined): string {
  if (!border) {
    return '';
  }
  return border === true ? 'border' : `border-${border}`;
}

/**
 * Expands a {@link Responsive} value into Bootstrap's responsive class
 * infix form, e.g. `d`/`flex` → `d-flex d-md-block`.
 */
export function responsiveClasses<T extends string | number>(
  prefix: string,
  value: Responsive<T> | null | undefined,
  transform: (value: T) => string = (v) => spaceToken(v),
): string[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (typeof value !== 'object') {
    return [`${prefix}-${transform(value as T)}`];
  }

  const classes: string[] = [];
  const record = value as { base?: T } & Partial<Record<Breakpoint, T>>;

  if (record.base !== undefined) {
    classes.push(`${prefix}-${transform(record.base)}`);
  }

  for (const breakpoint of BREAKPOINTS) {
    const breakpointValue = record[breakpoint];
    if (breakpointValue !== undefined) {
      classes.push(`${prefix}-${breakpoint}-${transform(breakpointValue)}`);
    }
  }

  return classes;
}

/** Joins class fragments, dropping empties and duplicates. */
export function cx(...values: Array<string | string[] | false | null | undefined>): string {
  const classes = new Set<string>();

  for (const value of values) {
    if (!value) {
      continue;
    }
    const parts = Array.isArray(value) ? value : value.split(' ');
    for (const part of parts) {
      if (part) {
        classes.add(part);
      }
    }
  }

  return [...classes].join(' ');
}
