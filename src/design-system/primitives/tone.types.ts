/**
 * Tone — the shared colour vocabulary of the display & feedback atoms.
 *
 * Badge, Chip, Spinner, Progress and Divider all take a `tone`. A tone is not a
 * colour: it is a *meaning* that the theme resolves into four custom properties
 * (`--ds-tone-fg`, `--ds-tone-bg`, `--ds-tone-solid`, `--ds-tone-on-solid`),
 * declared once in `styles/primitives.scss`. Components read those properties
 * and never name a colour themselves, which is what keeps `tone="danger"` the
 * same red in both themes and in every atom.
 */

export const TONES = [
  'neutral',
  'primary',
  'accent',
  'success',
  'warning',
  'danger',
  'info',
] as const;

export type Tone = (typeof TONES)[number];

/**
 * How a tone is painted.
 *
 * - `soft` — tinted background, coloured text. The default, because a page of
 *   solid badges is a page of alarms.
 * - `solid` — filled block. Reserve it for the one thing that matters.
 * - `outline` — border only, for a quiet label on a busy surface.
 */
export const TONE_VARIANTS = ['soft', 'solid', 'outline'] as const;

export type ToneVariant = (typeof TONE_VARIANTS)[number];

/** The class that binds an element to a tone's custom properties. */
export function toneClass(tone: Tone): string {
  return `ds-tone--${tone}`;
}
