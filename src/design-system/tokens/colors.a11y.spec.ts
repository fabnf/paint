import { darkSemanticColors, lightSemanticColors, type SemanticColors } from './colors.tokens';
import { contrastRatio, contrastRatioRounded, relativeLuminance } from './contrast';
import { nonTextContrastPairs, textContrastPairs } from './contrast.pairs';

/**
 * Contrast is a property of the tokens. If a role fails here, every component
 * that uses it fails — so the system checks itself on every test run.
 *
 * The pair tables live in `contrast.pairs.ts`, because they are the contract
 * every brand pack is held to (`theme/brand-packs.spec.ts`), not just Paint's
 * own palette. The assertions here are unchanged: every text pair at AA,
 * every non-text pair at 3:1, in both modes.
 */

const THEMES: Array<[string, SemanticColors]> = [
  ['light', lightSemanticColors],
  ['dark', darkSemanticColors],
];

describe('contrast helpers', () => {
  it('computes the reference luminances', () => {
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
  });

  it('computes the reference ratio', () => {
    expect(contrastRatioRounded('#ffffff', '#000000')).toBe(21);
    expect(contrastRatioRounded('#ffffff', '#ffffff')).toBe(1);
  });

  it('reads short hex and rgb() alike', () => {
    expect(contrastRatioRounded('#fff', '#000')).toBe(21);
    expect(contrastRatioRounded('rgb(255 255 255)', 'rgb(0 0 0)')).toBe(21);
  });
});

describe('semantic colour contrast', () => {
  for (const [themeName, colors] of THEMES) {
    describe(themeName, () => {
      for (const pair of textContrastPairs) {
        it(`${pair.name} meets AA for text`, () => {
          const ratio = contrastRatio(colors[pair.foreground], colors[pair.background]);

          expect(ratio)
            .withContext(
              `${themeName}: ${pair.name} is ${contrastRatioRounded(
                colors[pair.foreground],
                colors[pair.background],
              )}:1, needs ${pair.minimum}:1`,
            )
            .toBeGreaterThanOrEqual(pair.minimum);
        });
      }

      for (const pair of nonTextContrastPairs) {
        it(`${pair.name} meets 3:1 for non-text UI`, () => {
          const ratio = contrastRatio(colors[pair.foreground], colors[pair.background]);

          expect(ratio)
            .withContext(
              `${themeName}: ${pair.name} is ${contrastRatioRounded(
                colors[pair.foreground],
                colors[pair.background],
              )}:1, needs ${pair.minimum}:1`,
            )
            .toBeGreaterThanOrEqual(pair.minimum);
        });
      }
    });
  }
});
