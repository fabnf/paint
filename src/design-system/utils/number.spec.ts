import { clamp, decimalPlaces, percentOf, roundToStep, snapToGrid, stepValue } from './number';

describe('numeric arithmetic', () => {
  describe('decimalPlaces', () => {
    it('counts the digits after the point', () => {
      expect(decimalPlaces(1)).toBe(0);
      expect(decimalPlaces(0.5)).toBe(1);
      expect(decimalPlaces(0.25)).toBe(2);
      expect(decimalPlaces(1e-7)).toBe(7);
      expect(decimalPlaces(Number.NaN)).toBe(0);
    });
  });

  describe('roundToStep', () => {
    it('writes the value with the step’s precision', () => {
      expect(roundToStep(0.1 * 3, 0.1)).toBe(0.3);
      expect(roundToStep(2.999999, 1)).toBe(3);
      expect(roundToStep(1.2345, 0.01)).toBe(1.23);
    });
  });

  describe('clamp', () => {
    it('keeps a value inside either or both bounds', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-1, 0, 10)).toBe(0);
      expect(clamp(11, 0, 10)).toBe(10);
      expect(clamp(-50, null, 10)).toBe(-50);
      expect(clamp(50, 0, null)).toBe(50);
    });
  });

  describe('snapToGrid', () => {
    it('lands on the nearest step, anchored at min', () => {
      expect(snapToGrid(4, 5, 0, 100)).toBe(5);
      expect(snapToGrid(2, 5, 0, 100)).toBe(0);
      // min=1 step=2 → 1, 3, 5 — never 0, 2, 4
      expect(snapToGrid(4, 2, 1, 9)).toBe(5);
      expect(snapToGrid(0.26, 0.1, 0, 1)).toBe(0.3);
    });

    it('clamps after snapping', () => {
      expect(snapToGrid(104, 5, 0, 100)).toBe(100);
      expect(snapToGrid(-3, 5, 0, 100)).toBe(0);
    });

    it('treats a non-positive step as “any value”', () => {
      expect(snapToGrid(4.37, 0, 0, 10)).toBe(4.37);
      expect(snapToGrid(12, 0, 0, 10)).toBe(10);
    });

    it('falls back to the minimum when there is no number at all', () => {
      expect(snapToGrid(Number.NaN, 1, 3, 10)).toBe(3);
      expect(snapToGrid(Number.NaN, 1, null, 10)).toBe(0);
    });
  });

  describe('stepValue', () => {
    it('moves one step in either direction', () => {
      expect(stepValue(3, 1, 1, 0, 10)).toBe(4);
      expect(stepValue(3, -1, 1, 0, 10)).toBe(2);
      expect(stepValue(0.3, 1, 0.1, 0, 1)).toBe(0.4);
    });

    it('stops at the bounds', () => {
      expect(stepValue(10, 1, 1, 0, 10)).toBe(10);
      expect(stepValue(0, -1, 1, 0, 10)).toBe(0);
      expect(stepValue(9.5, 1, 1, 0, 10)).toBe(10);
    });

    it('lands an off-grid value on the grid in the direction of travel', () => {
      expect(stepValue(2.5, 1, 1, 0, 10)).toBe(3);
      expect(stepValue(2.5, -1, 1, 0, 10)).toBe(2);
      expect(stepValue(4, 1, 2, 1, 9)).toBe(5);
      expect(stepValue(4, -1, 2, 1, 9)).toBe(3);
    });

    it('treats a non-positive step as one', () => {
      expect(stepValue(3, 1, 0, null, null)).toBe(4);
    });
  });

  describe('percentOf', () => {
    it('places a value on its range', () => {
      expect(percentOf(0, 0, 100)).toBe(0);
      expect(percentOf(50, 0, 100)).toBe(50);
      expect(percentOf(100, 0, 100)).toBe(100);
      expect(percentOf(15, 10, 20)).toBe(50);
    });

    it('clamps out-of-range values and survives an empty range', () => {
      expect(percentOf(150, 0, 100)).toBe(100);
      expect(percentOf(-5, 0, 100)).toBe(0);
      expect(percentOf(5, 5, 5)).toBe(0);
    });
  });
});
