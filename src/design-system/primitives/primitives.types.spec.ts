import { cx, responsiveClasses, spaceToken, SPACE_TOKENS } from './primitives.types';

describe('primitive class helpers', () => {
  describe('spaceToken', () => {
    it('passes whole steps through', () => {
      expect(spaceToken(6)).toBe('6');
    });

    it('maps half steps onto the token layer naming', () => {
      expect(spaceToken(1.5)).toBe('1_5');
      expect(spaceToken(0.5)).toBe('0_5');
    });
  });

  describe('responsiveClasses', () => {
    it('returns nothing for null / undefined', () => {
      expect(responsiveClasses('p', null)).toEqual([]);
      expect(responsiveClasses('p', undefined)).toEqual([]);
    });

    it('emits a single class for a scalar value', () => {
      expect(responsiveClasses('p', 4)).toEqual(['p-4']);
    });

    it('emits Bootstrap breakpoint infixes for a responsive value', () => {
      expect(responsiveClasses('d', { base: 'none', md: 'flex' })).toEqual(['d-none', 'd-md-flex']);
    });

    it('omits the base class when only breakpoints are given', () => {
      expect(responsiveClasses('p', { lg: 8 })).toEqual(['p-lg-8']);
    });

    it('keeps breakpoints in mobile-first order regardless of key order', () => {
      expect(responsiveClasses('gap', { xl: 8, sm: 2, base: 1 })).toEqual([
        'gap-1',
        'gap-sm-2',
        'gap-xl-8',
      ]);
    });

    it('keeps 0 as a valid token', () => {
      expect(responsiveClasses('gap', 0)).toEqual(['gap-0']);
    });

    it('applies the token transform to responsive half steps', () => {
      expect(responsiveClasses('p', { base: 1.5, md: 2.5 })).toEqual(['p-1_5', 'p-md-2_5']);
    });
  });

  describe('cx', () => {
    it('drops falsy values and de-duplicates', () => {
      expect(cx('btn', false, null, undefined, '', 'btn', ['btn-sm', 'w-100'])).toBe(
        'btn btn-sm w-100',
      );
    });

    it('splits space-separated fragments', () => {
      expect(cx('small fw-medium', 'small')).toBe('small fw-medium');
    });
  });

  describe('SPACE_TOKENS', () => {
    it('is the 4px scale in ascending order', () => {
      const sorted = [...SPACE_TOKENS].sort((a, b) => a - b);
      expect([...SPACE_TOKENS]).toEqual(sorted);
    });
  });
});
