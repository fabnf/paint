/**
 * Numeric arithmetic for Paint's range-style controls.
 *
 * Slider and NumberInput both promise the same three things — a value never
 * leaves `[min, max]`, stepping lands on the step grid, and `0.1 + 0.2` does
 * not become `0.30000000000000004` on the way to the screen. Those rules live
 * here once, pure and tested, so the two controls cannot disagree about them.
 *
 * The grid is anchored at `min` when there is one, as the HTML spec anchors a
 * `<input type="number">`'s `step` at its `min` — so a field with `min=1
 * step=2` steps 1, 3, 5, not 0, 2, 4.
 */

/** Decimal places a number is written with. `1e-7` is treated as 7. */
export function decimalPlaces(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const text = String(value);
  const exponent = /e-(\d+)$/i.exec(text);
  if (exponent) {
    return Number(exponent[1]);
  }
  const point = text.indexOf('.');
  return point === -1 ? 0 : text.length - point - 1;
}

/**
 * Rounds to the precision a `step` is written in, which is what turns
 * `0.1 * 3` back into `0.3`. A `step` of `1` rounds to integers.
 */
export function roundToStep(value: number, step: number): number {
  const places = decimalPlaces(step);
  return Number(value.toFixed(Math.min(places, 20)));
}

/** Keeps a value inside `[min, max]`. Either bound may be absent. */
export function clamp(value: number, min: number | null = null, max: number | null = null): number {
  let next = value;
  if (min !== null && Number.isFinite(min)) {
    next = Math.max(next, min);
  }
  if (max !== null && Number.isFinite(max)) {
    next = Math.min(next, max);
  }
  return next;
}

/**
 * Moves a value onto the nearest point of the step grid, then inside the
 * bounds. A `step` of `0` or less means "any value": only the clamp applies.
 */
export function snapToGrid(
  value: number,
  step: number,
  min: number | null = null,
  max: number | null = null,
): number {
  if (!Number.isFinite(value)) {
    return clamp(min ?? 0, min, max);
  }
  if (!(step > 0)) {
    return clamp(value, min, max);
  }
  const base = min !== null && Number.isFinite(min) ? min : 0;
  const snapped = roundToStep(base + Math.round((value - base) / step) * step, step);
  return clamp(snapped, min, max);
}

/**
 * One step up or down from `value`, on the grid and inside the bounds.
 *
 * An off-grid starting value (typed, or written in by a form) first lands on
 * the grid in the direction of travel, so `+` from `2.5` with `step=1` gives
 * `3`, not `3.5` — the same thing the native spin buttons do.
 */
export function stepValue(
  value: number,
  direction: 1 | -1,
  step: number,
  min: number | null = null,
  max: number | null = null,
): number {
  const size = step > 0 ? step : 1;
  const base = min !== null && Number.isFinite(min) ? min : 0;
  const offset = (value - base) / size;
  const onGrid = Math.abs(offset - Math.round(offset)) < 1e-9;
  const index = onGrid
    ? Math.round(offset) + direction
    : direction > 0
      ? Math.ceil(offset)
      : Math.floor(offset);
  return clamp(roundToStep(base + index * size, size), min, max);
}

/** `0 → 0`, `max → 100`: where a value sits on its range, for a fill or a thumb. */
export function percentOf(value: number, min: number, max: number): number {
  if (!(max > min)) {
    return 0;
  }
  const ratio = (clamp(value, min, max) - min) / (max - min);
  return ratio * 100;
}
