import { hexToRgbTriplet, themeToBootstrapVariables } from './bootstrap.bridge';
import { darkTheme, lightTheme } from './theme.types';

describe('bootstrap bridge', () => {
  describe('hexToRgbTriplet', () => {
    it('converts 6-digit hex', () => {
      expect(hexToRgbTriplet('#1d51f1')).toBe('29, 81, 241');
    });

    it('converts 3-digit hex', () => {
      expect(hexToRgbTriplet('#fff')).toBe('255, 255, 255');
    });

    it('tolerates a missing hash and whitespace', () => {
      expect(hexToRgbTriplet(' 0a0a0a ')).toBe('10, 10, 10');
    });

    it('falls back to black for invalid input', () => {
      expect(hexToRgbTriplet('not-a-color')).toBe('0, 0, 0');
    });
  });

  describe('themeToBootstrapVariables', () => {
    it('points Bootstrap’s body variables at the Paint theme', () => {
      const vars = themeToBootstrapVariables(lightTheme);

      expect(vars['--bs-body-bg']).toBe(lightTheme.colors.background);
      expect(vars['--bs-body-color']).toBe(lightTheme.colors.text);
      expect(vars['--bs-border-color']).toBe(lightTheme.colors.border);
    });

    it('publishes rgb triplets for Bootstrap’s utility classes', () => {
      const vars = themeToBootstrapVariables(lightTheme);

      expect(vars['--bs-primary']).toBe(lightTheme.colors.primary);
      expect(vars['--bs-primary-rgb']).toBe(hexToRgbTriplet(lightTheme.colors.primary));
      expect(vars['--bs-primary-bg-subtle']).toBe(lightTheme.colors.primaryMuted);
    });

    it('maps every semantic role', () => {
      const vars = themeToBootstrapVariables(lightTheme);

      for (const role of ['primary', 'success', 'warning', 'danger', 'info', 'secondary']) {
        expect(vars[`--bs-${role}`]).withContext(role).toBeDefined();
        expect(vars[`--bs-${role}-rgb`]).withContext(`${role} rgb`).toBeDefined();
      }
    });

    it('resolves differently per theme so a switch re-tints Bootstrap', () => {
      const light = themeToBootstrapVariables(lightTheme);
      const dark = themeToBootstrapVariables(darkTheme);

      expect(dark['--bs-body-bg']).not.toBe(light['--bs-body-bg']);
      expect(dark['--bs-primary']).not.toBe(light['--bs-primary']);
    });

    it('delegates typography and radii to the Paint token variables', () => {
      const vars = themeToBootstrapVariables(lightTheme);

      expect(vars['--bs-body-font-family']).toBe('var(--ds-font-sans)');
      expect(vars['--bs-border-radius']).toBe('var(--ds-radius-md)');
      expect(vars['--bs-border-radius-pill']).toBe('var(--ds-radius-full)');
    });
  });
});
