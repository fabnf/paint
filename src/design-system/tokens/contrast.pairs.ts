import type { SemanticColors } from './colors.tokens';
import { CONTRAST_AA_NON_TEXT, CONTRAST_AA_TEXT } from './contrast';

/**
 * The contrast contract of a semantic colour set, as data.
 *
 * Extracted from `colors.a11y.spec.ts` (which still runs every pair against
 * Paint's own palette) so that brand packs are held to exactly the same bar:
 * a brand that cannot clear Paint's AA table is not an identity, it is a
 * regression with a name.
 */

export interface ContrastPair {
  name: string;
  foreground: keyof SemanticColors;
  background: keyof SemanticColors;
  minimum: number;
}

/** Text roles have to clear AA (4.5:1) on every surface they are allowed on. */
const TEXT_SURFACES: Array<keyof SemanticColors> = [
  'background',
  'surface',
  'surfaceElevated',
  'surfaceSunken',
];

const TEXT_ROLES: Array<keyof SemanticColors> = [
  'text',
  'textMuted',
  'textSubtle',
  'primary',
  'accent',
  'success',
  'warning',
  'danger',
  'info',
];

/** Text on its own muted tint, the way badges and callouts are painted. */
const MUTED_TINTS = [
  ['primary', 'primaryMuted'],
  ['accent', 'accentMuted'],
  ['success', 'successMuted'],
  ['warning', 'warningMuted'],
  ['danger', 'dangerMuted'],
  ['info', 'infoMuted'],
] as const;

/** Every text-level pair (AA, 4.5:1). */
export const textContrastPairs: readonly ContrastPair[] = [
  ...TEXT_ROLES.flatMap((foreground) =>
    TEXT_SURFACES.map((background) => ({
      name: `${foreground} on ${background}`,
      foreground,
      background,
      minimum: CONTRAST_AA_TEXT,
    })),
  ),

  ...MUTED_TINTS.map(([role, tint]) => ({
    name: `${role} on ${tint}`,
    foreground: role as keyof SemanticColors,
    background: tint as keyof SemanticColors,
    minimum: CONTRAST_AA_TEXT,
  })),

  /*
   * An Alert writes its title in the tone and its body in the text roles, on the
   * tone's tint. Both have to clear AA, in both themes — which is the whole
   * reason the tints exist at the ends of the scale.
   */
  ...MUTED_TINTS.flatMap(([, tint]) =>
    (['text', 'textMuted'] as const).map((role) => ({
      name: `${role} on ${tint}`,
      foreground: role as keyof SemanticColors,
      background: tint as keyof SemanticColors,
      minimum: CONTRAST_AA_TEXT,
    })),
  ),

  /*
   * Text on a filled role — button labels, and `variant="solid"` on the display
   * atoms. `onPrimary` is the ink of every filled tone (see the `.ds-tone--*`
   * properties in `styles/primitives.scss`), so it has to clear AA on all of them.
   */
  { name: 'onPrimary on primary', foreground: 'onPrimary', background: 'primary', minimum: CONTRAST_AA_TEXT },
  { name: 'onPrimary on primaryHover', foreground: 'onPrimary', background: 'primaryHover', minimum: CONTRAST_AA_TEXT },
  { name: 'onAccent on accent', foreground: 'onAccent', background: 'accent', minimum: CONTRAST_AA_TEXT },
  { name: 'onAccent on accentHover', foreground: 'onAccent', background: 'accentHover', minimum: CONTRAST_AA_TEXT },
  { name: 'onPrimary on success', foreground: 'onPrimary', background: 'success', minimum: CONTRAST_AA_TEXT },
  { name: 'onPrimary on danger', foreground: 'onPrimary', background: 'danger', minimum: CONTRAST_AA_TEXT },
  { name: 'onPrimary on warning', foreground: 'onPrimary', background: 'warning', minimum: CONTRAST_AA_TEXT },
  { name: 'onPrimary on info', foreground: 'onPrimary', background: 'info', minimum: CONTRAST_AA_TEXT },
  // The neutral tone fills with the text colour and writes on it in the surface.
  { name: 'surface on text', foreground: 'surface', background: 'text', minimum: CONTRAST_AA_TEXT },
];

/** Non-text UI (WCAG 1.4.11, 3:1): indicators, control boundaries, the focus ring. */
export const nonTextContrastPairs: readonly ContrastPair[] = [
  /*
   * Non-text UI that is only meaningful as a *shape*: a progress bar's fill
   * against its track, a presence dot against the card it sits on.
   */
  { name: 'primary on surfaceSunken (progress fill)', foreground: 'primary', background: 'surfaceSunken', minimum: CONTRAST_AA_NON_TEXT },
  { name: 'success on surface (presence dot)', foreground: 'success', background: 'surface', minimum: CONTRAST_AA_NON_TEXT },
  { name: 'warning on surface (presence dot)', foreground: 'warning', background: 'surface', minimum: CONTRAST_AA_NON_TEXT },
  { name: 'danger on surface (presence dot)', foreground: 'danger', background: 'surface', minimum: CONTRAST_AA_NON_TEXT },

  { name: 'borderControl on background', foreground: 'borderControl', background: 'background', minimum: CONTRAST_AA_NON_TEXT },
  { name: 'borderControl on surface', foreground: 'borderControl', background: 'surface', minimum: CONTRAST_AA_NON_TEXT },
  { name: 'borderControl on surfaceSunken', foreground: 'borderControl', background: 'surfaceSunken', minimum: CONTRAST_AA_NON_TEXT },
  { name: 'focusRing on background', foreground: 'focusRing', background: 'background', minimum: CONTRAST_AA_NON_TEXT },
  { name: 'focusRing on surface', foreground: 'focusRing', background: 'surface', minimum: CONTRAST_AA_NON_TEXT },
  { name: 'primary on surface (icon)', foreground: 'primary', background: 'surface', minimum: CONTRAST_AA_NON_TEXT },
];
