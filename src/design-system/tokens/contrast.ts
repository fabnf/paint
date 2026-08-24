/**
 * Contrast math — WCAG 2.1 relative luminance and contrast ratios.
 *
 * Accessibility is a property of the tokens, not of the components that use
 * them: if a text role fails against its surface, every component fails with
 * it. These helpers let the system *check* itself (see `colors.a11y.spec.ts`)
 * and let the documentation publish measured numbers instead of promises.
 */

/** WCAG minimums. */
export const CONTRAST_AA_TEXT = 4.5;
/** Large text: ≥ 24px, or ≥ 19px bold. */
export const CONTRAST_AA_LARGE_TEXT = 3;
/** Icons, borders, focus rings and other non-text UI. */
export const CONTRAST_AA_NON_TEXT = 3;
export const CONTRAST_AAA_TEXT = 7;

/** Parses `#rgb`, `#rrggbb` or `rgb(r g b / a)` into 0–255 channels. */
export function parseColor(color: string): [number, number, number] {
  const value = color.trim();

  if (value.startsWith('#')) {
    const hex = value.slice(1);
    const full =
      hex.length === 3
        ? hex
            .split('')
            .map((char) => char + char)
            .join('')
        : hex.slice(0, 6);
    const int = Number.parseInt(full, 16);
    if (Number.isNaN(int)) {
      return [0, 0, 0];
    }
    // eslint-disable-next-line no-bitwise
    return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
  }

  const channels = value.match(/\d+(\.\d+)?/g);
  if (!channels || channels.length < 3) {
    return [0, 0, 0];
  }
  return [Number(channels[0]), Number(channels[1]), Number(channels[2])];
}

/** Relative luminance per WCAG 2.1, 0 (black) → 1 (white). */
export function relativeLuminance(color: string): number {
  const [r, g, b] = parseColor(color).map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two opaque colors, 1 → 21. */
export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);

  return (lighter + 0.05) / (darker + 0.05);
}

/** Rounded to one decimal, the way contrast is usually reported. */
export function contrastRatioRounded(foreground: string, background: string): number {
  return Math.round(contrastRatio(foreground, background) * 10) / 10;
}

export function meetsContrast(
  foreground: string,
  background: string,
  minimum: number = CONTRAST_AA_TEXT,
): boolean {
  return contrastRatio(foreground, background) >= minimum;
}
