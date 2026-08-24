import type { IsoDate } from '../../utils/date';
import type { IsoTime } from '../../utils/time';

/**
 * A date range, with optional times on its edges.
 *
 * The same bargain as every date in Paint: `yyyy-mm-dd` and 24-hour `HH:mm`
 * strings, never a `Date` — so a filter serialised into a URL or posted to an
 * API cannot shift by a day because of where the user was sitting.
 */
export interface DateRange {
  readonly start: IsoDate | null;
  readonly end: IsoDate | null;
  /** Only meaningful when the picker was asked for time. */
  readonly startTime: IsoTime | null;
  readonly endTime: IsoTime | null;
}

/** Two days in the order the calendar reads them, whichever way they were given. */
export function orderedRange(a: IsoDate, b: IsoDate): [IsoDate, IsoDate] {
  return a <= b ? [a, b] : [b, a];
}
