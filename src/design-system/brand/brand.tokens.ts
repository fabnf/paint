/**
 * Brand tokens — Paint's product identity.
 *
 * The brand is a foundation like color or type: declared once here, consumed
 * by the logo, the documentation site and any host application that wants to
 * say "built with Paint".
 */

import { colorPrimitives } from '../tokens/colors.tokens';
import { gradients } from '../tokens/effects.tokens';

export const brand = {
  /** Product name. Always capitalised, never "PAINT" or "paint". */
  name: 'Paint',
  /** One-line positioning statement. */
  tagline: 'An atomic design system',
  /** The loud line. Display type, brand surfaces, nothing else. */
  headline: 'Paint it. Ship it.',
  /** Short descriptor used in page titles and meta. */
  shortDescription: 'Tokens, primitives, and components for Angular interfaces.',
  /** Long-form description for overview surfaces. */
  description:
    'Paint turns design decisions into typed, themeable code — foundations at the bottom, primitives and components on top, products on the shoulders of all of it.',
  /** Current release of the system. */
  version: '0.3.0',
  /** Release name for this phase of the roadmap. */
  releaseName: 'Wet Paint',
} as const;

/**
 * The signature gradient: magenta bleeding through violet into deep ink.
 * Mirrors `gradients.brand` so the logo and brand surfaces never drift apart.
 */
export const brandGradient = {
  from: colorPrimitives.magenta[500],
  via: colorPrimitives.violet[500],
  to: colorPrimitives.violet[800],
  angle: '135deg',
  css: gradients.brand,
} as const;

/**
 * Accent dabs from the primitive palette — the "paint" in Paint.
 * Used sparingly: one accent per surface, never as semantic color.
 */
export const brandAccents = {
  /** Magenta smear. Multiplies into the mark where the two meet. */
  dab: colorPrimitives.magenta[500],
  /** Lime run-off. The detail that earns a smile. */
  drip: colorPrimitives.lime[300],
  /** Sky wash for illustrations and empty states. */
  wash: colorPrimitives.sky[400],
} as const;

export type BrandAccent = keyof typeof brandAccents;
