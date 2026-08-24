/**
 * Calendar arithmetic for Paint's date molecules.
 *
 * **A date is not an instant.** "4 March 2026" is the same day in Tokyo and in
 * Lima; `new Date('2026-03-04')` is a moment in UTC that, rendered in Lima, is
 * the 3rd. Every function here speaks `yyyy-mm-dd` strings — the format
 * `<input type="date">` uses, the format JSON uses, and the only one that cannot
 * silently shift a day because of where the user is sitting.
 *
 * `Date` appears in exactly two places: to ask the system what day it is, and to
 * hand something to `Intl` for formatting. Both pin the time zone to UTC, so
 * neither can drift.
 */

/** A calendar date, `yyyy-mm-dd`. Never a timestamp, never a `Date`. */
export type IsoDate = string;

/**
 * A day that cannot be picked — a weekend, a holiday, a booked room.
 *
 * A predicate rather than a list, because a year of holidays is not an array,
 * and because the calendar asks once per rendered cell and no more.
 */
export type DateMatcher = (date: IsoDate) => boolean;

export interface DateParts {
  year: number;
  /** 1–12. Not the 0–11 that has cost the industry a decade of bugs. */
  month: number;
  day: number;
}

const ISO_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (value: number, length = 2): string => String(value).padStart(length, '0');

/** Is `year` a leap year, by the Gregorian rule? */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Days in a month. `month` is 1–12. */
export function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31;
}

/** Is this a real calendar date? 31 February is not. */
export function isValidDateParts({ year, month, day }: DateParts): boolean {
  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    year >= 1 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth(year, month)
  );
}

/** Parses `yyyy-mm-dd`. Returns `null` for anything else, including 2026-02-30. */
export function fromIso(value: string | null | undefined): DateParts | null {
  if (!value) {
    return null;
  }

  const match = ISO_PATTERN.exec(value);
  if (!match) {
    return null;
  }

  const parts = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  return isValidDateParts(parts) ? parts : null;
}

export function toIso({ year, month, day }: DateParts): IsoDate {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

export function isIsoDate(value: unknown): value is IsoDate {
  return typeof value === 'string' && fromIso(value) !== null;
}

/** Parses, or throws with the offending value. Internal: the components validate first. */
function partsOf(iso: IsoDate): DateParts {
  const parts = fromIso(iso);
  if (!parts) {
    throw new RangeError(`Not an ISO date: ${JSON.stringify(iso)}`);
  }
  return parts;
}

/**
 * A `Date` pinned to UTC midnight — the only safe bridge to `Intl` and to
 * `getUTCDay()`. Never render it with a local-time formatter.
 */
export function toUtcDate(iso: IsoDate): Date {
  const { year, month, day } = partsOf(iso);
  const date = new Date(Date.UTC(year, month - 1, day));
  // Years 0–99 are "19xx" to the Date constructor, and to nobody else.
  date.setUTCFullYear(year);
  return date;
}

/** `0` Sunday … `6` Saturday. */
export function dayOfWeek(iso: IsoDate): number {
  return toUtcDate(iso).getUTCDay();
}

/** Today, where the user is sitting. Injectable for tests: pass a `Date`. */
export function todayIso(now: Date = new Date()): IsoDate {
  return toIso({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() });
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const date = toUtcDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIso({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  });
}

/**
 * Adds months, clamping the day to the end of the target month.
 *
 * 31 January + 1 month is 28 February, not 3 March. Overflowing into the next
 * month is what `Date.setMonth` does, and it is never what a calendar means.
 */
export function addMonths(iso: IsoDate, months: number): IsoDate {
  const { year, month, day } = partsOf(iso);
  const total = year * 12 + (month - 1) + months;
  const nextYear = Math.floor(total / 12);
  const nextMonth = (total % 12) + 1;

  return toIso({
    year: nextYear,
    month: nextMonth,
    day: Math.min(day, daysInMonth(nextYear, nextMonth)),
  });
}

export function startOfMonth(iso: IsoDate): IsoDate {
  const { year, month } = partsOf(iso);
  return toIso({ year, month, day: 1 });
}

export function endOfMonth(iso: IsoDate): IsoDate {
  const { year, month } = partsOf(iso);
  return toIso({ year, month, day: daysInMonth(year, month) });
}

export function isSameMonth(a: IsoDate, b: IsoDate): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

/** `-1`, `0` or `1`. Lexicographic order *is* chronological order, for ISO dates. */
export function compareIso(a: IsoDate, b: IsoDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function isBefore(a: IsoDate, b: IsoDate): boolean {
  return a < b;
}

export function isAfter(a: IsoDate, b: IsoDate): boolean {
  return a > b;
}

/** Inclusive on both ends. `null` bounds mean "no bound". */
export function isWithin(iso: IsoDate, min?: IsoDate | null, max?: IsoDate | null): boolean {
  if (min && iso < min) {
    return false;
  }
  return !(max && iso > max);
}

export function clampIso(iso: IsoDate, min?: IsoDate | null, max?: IsoDate | null): IsoDate {
  if (min && iso < min) {
    return min;
  }
  return max && iso > max ? max : iso;
}

/**
 * ISO-8601 week number. Week 1 is the one containing the first Thursday of the
 * year — which is why the answer sometimes belongs to the previous year, and why
 * nobody should write this twice.
 */
export function isoWeekNumber(iso: IsoDate): number {
  const date = toUtcDate(iso);
  // Shift to the Thursday of this week; its year is the week-numbering year.
  const dayNumber = (date.getUTCDay() + 6) % 7; // Monday = 0
  date.setUTCDate(date.getUTCDate() - dayNumber + 3);

  const thursday = date.getTime();
  const firstThursday = Date.UTC(date.getUTCFullYear(), 0, 4);
  const firstDayNumber = (new Date(firstThursday).getUTCDay() + 6) % 7;

  return (
    1 + Math.round((thursday - firstThursday + firstDayNumber * 86_400_000) / (7 * 86_400_000))
  );
}

// —— Locale ——

/** `0` Sunday … `6` Saturday. */
export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * The first day of the week, per the locale.
 *
 * `Intl.Locale`'s week info is the right answer and the one browsers are
 * converging on; where it is missing, Sunday is right for the `en-US` family and
 * Monday is right for most of the rest — which is a guess, so `weekStart` is an
 * input on every component that needs one.
 */
export function localeWeekStart(locale: string): WeekStart {
  try {
    const intlLocale = new Intl.Locale(locale) as Intl.Locale & {
      weekInfo?: { firstDay: number };
      getWeekInfo?: () => { firstDay: number };
    };
    const firstDay = intlLocale.getWeekInfo?.().firstDay ?? intlLocale.weekInfo?.firstDay;
    if (firstDay) {
      // Intl counts Monday = 1 … Sunday = 7.
      return (firstDay % 7) as WeekStart;
    }
  } catch {
    // An invalid locale tag. Fall through to the guess.
  }

  return /^en(-(US|CA|PH|MX|IL|JP|ZA))?$/i.test(locale) ? 0 : 1;
}

/** Weekday names starting at `weekStart`, e.g. `['Mo','Tu',…]`. */
export function weekdayNames(
  locale: string,
  weekStart: WeekStart,
  format: 'narrow' | 'short' | 'long' = 'short',
): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: format, timeZone: 'UTC' });
  // 2024-01-07 was a Sunday, so index 0 lines up with `dayOfWeek` = 0.
  return Array.from({ length: 7 }, (_, index) =>
    formatter.format(new Date(Date.UTC(2024, 0, 7 + ((index + weekStart) % 7)))),
  );
}

/** "March 2026". */
export function monthLabel(iso: IsoDate, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(toUtcDate(iso));
}

/** "4 March 2026" — the accessible name of a day. */
export function longDateLabel(iso: IsoDate, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(
    toUtcDate(iso),
  );
}

// —— The month grid ——

export interface CalendarDay {
  iso: IsoDate;
  /** Day of the month, 1–31. */
  day: number;
  /** False for the leading and trailing days of the adjacent months. */
  inMonth: boolean;
}

export interface CalendarWeek {
  /** ISO-8601 week number, for the optional leading column. */
  weekNumber: number;
  days: CalendarDay[];
}

/**
 * The weeks of a month, padded with the adjacent months' days.
 *
 * `fixedWeeks` always returns six rows, because a grid that is five rows tall in
 * February and six in March moves everything below it when the user pages
 * through the year.
 */
export function monthGrid(
  monthIso: IsoDate,
  weekStart: WeekStart = 1,
  fixedWeeks = true,
): CalendarWeek[] {
  const first = startOfMonth(monthIso);
  const { year, month } = partsOf(first);
  const lead = (dayOfWeek(first) - weekStart + 7) % 7;
  const total = daysInMonth(year, month);

  const weeksNeeded = Math.ceil((lead + total) / 7);
  const weeks = fixedWeeks ? 6 : weeksNeeded;

  const start = addDays(first, -lead);
  const result: CalendarWeek[] = [];

  for (let week = 0; week < weeks; week++) {
    const days: CalendarDay[] = [];
    for (let day = 0; day < 7; day++) {
      const iso = addDays(start, week * 7 + day);
      days.push({ iso, day: partsOf(iso).day, inMonth: isSameMonth(iso, first) });
    }
    result.push({ weekNumber: isoWeekNumber(days[0].iso), days });
  }

  return result;
}

// —— Typed input ——

/** The order of the three numbers in a typed date. */
export type DateOrder = 'ymd' | 'dmy' | 'mdy';

/** The pattern a `DateOrder` expects, e.g. `dd/mm/yyyy`. Shown as a placeholder. */
export function datePattern(order: DateOrder, separator = '-'): string {
  const parts: Record<DateOrder, string[]> = {
    ymd: ['yyyy', 'mm', 'dd'],
    dmy: ['dd', 'mm', 'yyyy'],
    mdy: ['mm', 'dd', 'yyyy'],
  };
  return parts[order].join(separator);
}

export function formatDateInput(iso: IsoDate, order: DateOrder, separator = '-'): string {
  const { year, month, day } = partsOf(iso);
  const parts: Record<DateOrder, string[]> = {
    ymd: [pad(year, 4), pad(month), pad(day)],
    dmy: [pad(day), pad(month), pad(year, 4)],
    mdy: [pad(month), pad(day), pad(year, 4)],
  };
  return parts[order].join(separator);
}

/**
 * Parses what a human actually types.
 *
 * Accepts any of `- / . ` or nothing at all between the numbers: `4/3/2026`,
 * `04.03.2026`, `20260304`, `2026-3-4`. Two-digit years become 20xx, which is
 * wrong for 1926 and right for everything a form is likely to be collecting —
 * type four digits when you mean four digits.
 *
 * Returns `null` for anything it cannot turn into a real calendar date, so the
 * caller can say so rather than guess.
 */
export function parseDateInput(text: string, order: DateOrder = 'ymd'): IsoDate | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  const groups = trimmed.split(/[^\d]+/).filter(Boolean);
  let numbers: number[];

  if (groups.length === 3) {
    numbers = groups.map(Number);
  } else if (groups.length === 1 && groups[0].length === 8) {
    // 20260304 / 04032026 — three fixed-width fields, no separators.
    const digits = groups[0];
    numbers =
      order === 'ymd'
        ? [Number(digits.slice(0, 4)), Number(digits.slice(4, 6)), Number(digits.slice(6, 8))]
        : [
            Number(digits.slice(0, 2)),
            Number(digits.slice(2, 4)),
            Number(digits.slice(4, 8)),
          ];
  } else {
    return null;
  }

  const [a, b, c] = numbers;
  let year: number;
  let month: number;
  let day: number;

  if (order === 'ymd') {
    [year, month, day] = [a, b, c];
  } else if (order === 'dmy') {
    [day, month, year] = [a, b, c];
  } else {
    [month, day, year] = [a, b, c];
  }

  if (year < 100) {
    year += 2000;
  }

  const parts = { year, month, day };
  return isValidDateParts(parts) ? toIso(parts) : null;
}
