import { lightSemanticColors, type SemanticColors } from '../tokens/colors.tokens';
import { contrastRatio, contrastRatioRounded } from '../tokens/contrast';
import { nonTextContrastPairs, textContrastPairs } from '../tokens/contrast.pairs';
import {
  builtInBrandPacks,
  emberBrandPack,
  paintBrandPack,
  tidewaterBrandPack,
} from './brand-packs';
import type { ThemeMode } from './theme.types';

const MODES: readonly ThemeMode[] = ['light', 'dark'];

/** The canonical role list: whatever Paint's own palette publishes. */
const SEMANTIC_ROLES = Object.keys(lightSemanticColors) as Array<keyof SemanticColors>;

describe('brand packs', () => {
  it('Paint is the default pack, and is still Wet Paint', () => {
    expect(builtInBrandPacks[0]).toBe(paintBrandPack);
    expect(paintBrandPack.id).toBe('paint');

    // By reference, not by copy: the token file stays the single source.
    expect(paintBrandPack.colors.light).toBe(lightSemanticColors);
    expect(paintBrandPack.colors.light.primary).toBe('#6a1bf5'); // violet
    expect(paintBrandPack.colors.light.accent).toBe('#c80b6c'); // magenta
    expect(paintBrandPack.gradients).toBeUndefined();
    expect(paintBrandPack.radii).toBeUndefined();
    expect(paintBrandPack.fonts).toBeUndefined();
  });

  it('ids are unique and names are human', () => {
    const ids = builtInBrandPacks.map((pack) => pack.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const pack of builtInBrandPacks) {
      expect(pack.name.length).toBeGreaterThan(0);
      expect(pack.name).not.toBe(pack.id);
    }
  });

  for (const pack of builtInBrandPacks) {
    describe(pack.name, () => {
      for (const mode of MODES) {
        it(`publishes the full semantic set for ${mode}`, () => {
          for (const role of SEMANTIC_ROLES) {
            expect(pack.colors[mode][role])
              .withContext(`${pack.id}/${mode} is missing "${role}"`)
              .toEqual(jasmine.any(String));
            expect((pack.colors[mode][role] as string).length).toBeGreaterThan(0);
          }
        });

        /*
         * Every pack clears exactly the contrast table Paint's palette is held
         * to (colors.a11y.spec.ts): a brand that fails AA is not an identity,
         * it is a regression with a name.
         */
        it(`clears every AA text pair in ${mode}`, () => {
          const colors = pack.colors[mode];
          for (const pair of textContrastPairs) {
            expect(contrastRatio(colors[pair.foreground], colors[pair.background]))
              .withContext(
                `${pack.id}/${mode}: ${pair.name} is ${contrastRatioRounded(
                  colors[pair.foreground],
                  colors[pair.background],
                )}:1, needs ${pair.minimum}:1`,
              )
              .toBeGreaterThanOrEqual(pair.minimum);
          }
        });

        it(`clears every 3:1 non-text pair in ${mode}`, () => {
          const colors = pack.colors[mode];
          for (const pair of nonTextContrastPairs) {
            expect(contrastRatio(colors[pair.foreground], colors[pair.background]))
              .withContext(
                `${pack.id}/${mode}: ${pair.name} is ${contrastRatioRounded(
                  colors[pair.foreground],
                  colors[pair.background],
                )}:1, needs ${pair.minimum}:1`,
              )
              .toBeGreaterThanOrEqual(pair.minimum);
          }
        });
      }
    });
  }

  it('the packs are tellable apart at a glance — not tints of Paint', () => {
    // A different identity means a different primary *hue*, not a nudged
    // lightness. 1.15:1 between two colours of similar lightness is already
    // visibly different pigment; these clear it in every pairing.
    const packs = [paintBrandPack, tidewaterBrandPack, emberBrandPack];

    for (const mode of MODES) {
      for (let a = 0; a < packs.length; a++) {
        for (let b = a + 1; b < packs.length; b++) {
          const first = packs[a].colors[mode];
          const second = packs[b].colors[mode];
          expect(first.primary)
            .withContext(`${packs[a].id} and ${packs[b].id} share a ${mode} primary`)
            .not.toBe(second.primary);
          expect(first.accent).not.toBe(second.accent);
          // The neutrals shift too: cool slate vs warm stone vs ink.
          expect(first.background).not.toBe(second.background);
        }
      }
    }

    // And the non-colour voice differs where the packs claim it does.
    expect(tidewaterBrandPack.radii!['md']).not.toBe(emberBrandPack.radii!['md']);
    expect(tidewaterBrandPack.fonts?.display).toContain('DM Sans');
  });
});
