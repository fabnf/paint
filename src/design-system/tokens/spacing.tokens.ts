/**
 * Spacing tokens — 4px base scale for layout rhythm.
 */

export const spacingScale = {
  0: '0',
  px: '1px',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
} as const;

export type SpacingToken = keyof typeof spacingScale;

/** Semantic spacing aliases for common layout patterns. */
export const spacingSemantic = {
  /** Tight gap inside compact controls */
  controlGap: spacingScale[1.5],
  /** Default gap between related elements */
  inlineGap: spacingScale[2],
  /** Padding inside buttons / inputs */
  controlPaddingX: spacingScale[3],
  controlPaddingY: spacingScale[2],
  /** Section / stack spacing */
  stackSm: spacingScale[3],
  stackMd: spacingScale[4],
  stackLg: spacingScale[6],
  stackXl: spacingScale[8],
  /** Page gutters */
  pageGutter: spacingScale[6],
  pageGutterLg: spacingScale[10],
  /** Card / surface padding */
  surfacePadding: spacingScale[5],
  surfacePaddingLg: spacingScale[8],
} as const;

export type SpacingSemantic = keyof typeof spacingSemantic;

/**
 * Control sizing — the one scale every form atom measures itself against.
 *
 * Button, Input, Textarea, Checkbox, Radio and Switch all take `size`, and a
 * row that mixes them (`<ds-input> <ds-button>`) must line up. `height` is the
 * outer box of a text control; `indicator` is the square of a checkbox / radio,
 * and the height of a switch track. `switchWidth` keeps the track's aspect
 * ratio at 2:1 so the thumb has somewhere to travel.
 *
 * Values are `rem`, not `em`: a control nested in small text must not shrink
 * below its touch target.
 */
export const controlSizes = {
  sm: {
    height: '2rem',
    fontSize: '0.875rem',
    paddingX: spacingScale[2.5],
    indicator: '0.875rem',
    switchWidth: '1.75rem',
  },
  md: {
    height: '2.5rem',
    fontSize: '0.9375rem',
    paddingX: spacingScale[3],
    indicator: '1.0625rem',
    switchWidth: '2.125rem',
  },
  lg: {
    height: '3rem',
    fontSize: '1rem',
    paddingX: spacingScale[3.5],
    indicator: '1.25rem',
    switchWidth: '2.5rem',
  },
} as const;

/** `sm | md | lg` — the shared size key of every Paint control. */
export type ControlSizeToken = keyof typeof controlSizes;

/**
 * Avatar sizing — the one scale for a person-shaped square.
 *
 * A wider scale than the controls', because an avatar is read at a glance in a
 * table row (`xs`) and studied on a profile (`xl`). `sm`, `md` and `lg` line up
 * with the control heights on purpose: an avatar beside an input is a row, not
 * a pile.
 */
export const avatarSizes = {
  xs: '1.5rem',
  sm: '2rem',
  md: '2.5rem',
  lg: '3rem',
  xl: '4rem',
} as const;

export type AvatarSizeToken = keyof typeof avatarSizes;

/**
 * Border radius tokens.
 *
 * "Wet Paint" rounds harder than the first release: md is the new default for
 * controls, 2xl shapes the big brand surfaces, and `blob` is an intentionally
 * irregular radius for decorative, non-interactive shapes only.
 */
export const radii = {
  none: '0',
  sm: '0.375rem',
  md: '0.625rem',
  lg: '0.875rem',
  xl: '1.25rem',
  '2xl': '1.75rem',
  full: '9999px',
  /** Hand-cut edges. Brand surfaces, stickers, illustration frames. */
  blob: '62% 38% 54% 46% / 52% 56% 44% 48%',
} as const;

export type RadiusToken = keyof typeof radii;
