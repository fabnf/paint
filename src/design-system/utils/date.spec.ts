import {
  addDays,
  addMonths,
  clampIso,
  compareIso,
  datePattern,
  dayOfWeek,
  daysInMonth,
  endOfMonth,
  formatDateInput,
  fromIso,
  isIsoDate,
  isLeapYear,
  isSameMonth,
  isValidDateParts,
  isWithin,
  isoWeekNumber,
  localeWeekStart,
  longDateLabel,
  monthGrid,
  monthLabel,
  parseDateInput,
  startOfMonth,
  toIso,
  todayIso,
  toUtcDate,
  weekdayNames,
} from './date';

describe('date arithmetic', () => {
  describe('leap years and month lengths', () => {
    it('follows the Gregorian rule, including the centuries', () => {
      expect(isLeapYear(2024)).toBeTrue();
      expect(isLeapYear(2025)).toBeFalse();
      expect(isLeapYear(1900)).toBeFalse();
      expect(isLeapYear(2000)).toBeTrue();
    });

    it('knows February', () => {
      expect(daysInMonth(2024, 2)).toBe(29);
      expect(daysInMonth(2025, 2)).toBe(28);
      expect(daysInMonth(2025, 4)).toBe(30);
      expect(daysInMonth(2025, 12)).toBe(31);
    });
  });

  describe('parsing', () => {
    it('round-trips an ISO date', () => {
      expect(fromIso('2026-03-04')).toEqual({ year: 2026, month: 3, day: 4 });
      expect(toIso({ year: 2026, month: 3, day: 4 })).toBe('2026-03-04');
    });

    it('rejects anything that is not a real calendar date', () => {
      expect(fromIso('2026-02-30')).toBeNull();
      expect(fromIso('2025-02-29')).toBeNull();
      expect(fromIso('2026-13-01')).toBeNull();
      expect(fromIso('2026-00-10')).toBeNull();
      expect(fromIso('2026-3-4')).toBeNull();
      expect(fromIso('04/03/2026')).toBeNull();
      expect(fromIso('')).toBeNull();
      expect(fromIso(null)).toBeNull();
    });

    it('accepts the leap day of a leap year', () => {
      expect(fromIso('2024-02-29')).toEqual({ year: 2024, month: 2, day: 29 });
      expect(isIsoDate('2024-02-29')).toBeTrue();
      expect(isIsoDate('2023-02-29')).toBeFalse();
      expect(isIsoDate(20240229)).toBeFalse();
    });

    it('validates parts directly', () => {
      expect(isValidDateParts({ year: 2026, month: 2, day: 29 })).toBeFalse();
      expect(isValidDateParts({ year: 2026, month: 1, day: 31 })).toBeTrue();
      expect(isValidDateParts({ year: 2026, month: 1, day: 31.5 })).toBeFalse();
    });
  });

  describe('no time zones were harmed', () => {
    it('pins the bridge to Date at UTC midnight', () => {
      const date = toUtcDate('2026-03-04');
      expect(date.getUTCFullYear()).toBe(2026);
      expect(date.getUTCMonth()).toBe(2);
      expect(date.getUTCDate()).toBe(4);
      expect(date.getUTCHours()).toBe(0);
    });

    it('reads today from the local clock, not from UTC', () => {
      // 23:30 on the 4th, wherever the runner is sitting. An implementation that
      // went through `toISOString()` would answer "the 5th" east of Greenwich.
      const now = new Date(2026, 2, 4, 23, 30);
      expect(todayIso(now)).toBe('2026-03-04');
    });

    it('survives a year before 100', () => {
      expect(toUtcDate('0099-01-01').getUTCFullYear()).toBe(99);
    });

    it('throws on a value that is not a date, rather than guessing', () => {
      expect(() => toUtcDate('nonsense')).toThrowError(RangeError);
    });
  });

  describe('day of week', () => {
    it('counts from Sunday', () => {
      expect(dayOfWeek('2026-03-01')).toBe(0); // Sunday
      expect(dayOfWeek('2026-03-04')).toBe(3); // Wednesday
      expect(dayOfWeek('2026-03-07')).toBe(6); // Saturday
    });
  });

  describe('addDays', () => {
    it('crosses months, years and leap days', () => {
      expect(addDays('2026-03-04', 1)).toBe('2026-03-05');
      expect(addDays('2026-03-31', 1)).toBe('2026-04-01');
      expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
      expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
      expect(addDays('2025-02-28', 1)).toBe('2025-03-01');
      expect(addDays('2026-03-04', 0)).toBe('2026-03-04');
      expect(addDays('2026-03-04', 365)).toBe('2027-03-04');
    });
  });

  describe('addMonths', () => {
    it('clamps the day instead of overflowing', () => {
      // The bug every codebase ships once: Jan 31 + 1 month = Mar 3.
      expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
      expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
      expect(addMonths('2026-03-31', -1)).toBe('2026-02-28');
      expect(addMonths('2026-05-31', 1)).toBe('2026-06-30');
    });

    it('crosses years in both directions', () => {
      expect(addMonths('2026-12-15', 1)).toBe('2027-01-15');
      expect(addMonths('2026-01-15', -1)).toBe('2025-12-15');
      expect(addMonths('2026-01-15', -13)).toBe('2024-12-15');
      expect(addMonths('2026-06-15', 12)).toBe('2027-06-15');
    });
  });

  describe('bounds', () => {
    it('finds the ends of a month', () => {
      expect(startOfMonth('2026-03-04')).toBe('2026-03-01');
      expect(endOfMonth('2026-02-04')).toBe('2026-02-28');
      expect(endOfMonth('2024-02-04')).toBe('2024-02-29');
    });

    it('compares and clamps', () => {
      expect(compareIso('2026-03-04', '2026-03-05')).toBe(-1);
      expect(compareIso('2026-03-04', '2026-03-04')).toBe(0);
      expect(compareIso('2026-04-01', '2026-03-31')).toBe(1);

      expect(isWithin('2026-03-04', '2026-03-01', '2026-03-31')).toBeTrue();
      expect(isWithin('2026-03-04', '2026-03-05', null)).toBeFalse();
      expect(isWithin('2026-03-04', null, null)).toBeTrue();
      // Inclusive on both ends.
      expect(isWithin('2026-03-01', '2026-03-01', '2026-03-31')).toBeTrue();

      expect(clampIso('2026-02-01', '2026-03-01', '2026-03-31')).toBe('2026-03-01');
      expect(clampIso('2026-04-01', '2026-03-01', '2026-03-31')).toBe('2026-03-31');
      expect(clampIso('2026-03-15', '2026-03-01', '2026-03-31')).toBe('2026-03-15');
    });

    it('knows when two dates share a month', () => {
      expect(isSameMonth('2026-03-01', '2026-03-31')).toBeTrue();
      expect(isSameMonth('2026-03-31', '2026-04-01')).toBeFalse();
      expect(isSameMonth('2025-03-01', '2026-03-01')).toBeFalse();
    });
  });

  describe('ISO week numbers', () => {
    it('puts week 1 where the first Thursday is', () => {
      expect(isoWeekNumber('2026-01-01')).toBe(1); // a Thursday
      expect(isoWeekNumber('2026-01-04')).toBe(1);
      expect(isoWeekNumber('2026-01-05')).toBe(2);
    });

    it('lends the last days of a year to the next one, and vice versa', () => {
      expect(isoWeekNumber('2027-01-01')).toBe(53); // still week 53 of 2026
      expect(isoWeekNumber('2023-01-01')).toBe(52); // still week 52 of 2022
      expect(isoWeekNumber('2026-12-31')).toBe(53);
    });
  });

  describe('locale', () => {
    it('starts the week where the locale does', () => {
      expect(localeWeekStart('en-US')).toBe(0);
      expect(localeWeekStart('en-GB')).toBe(1);
      expect(localeWeekStart('de-DE')).toBe(1);
      expect(localeWeekStart('not a locale')).toBe(1);
    });

    it('names the weekdays from the week start', () => {
      const monday = weekdayNames('en-GB', 1, 'long');
      expect(monday[0]).toBe('Monday');
      expect(monday[6]).toBe('Sunday');

      const sunday = weekdayNames('en-US', 0, 'long');
      expect(sunday[0]).toBe('Sunday');
      expect(sunday[6]).toBe('Saturday');

      expect(weekdayNames('en-GB', 1, 'short')[0]).toBe('Mon');
    });

    it('names the month and the day', () => {
      expect(monthLabel('2026-03-04', 'en-GB')).toBe('March 2026');
      expect(longDateLabel('2026-03-04', 'en-GB')).toBe('4 March 2026');
    });
  });

  describe('monthGrid', () => {
    it('pads to whole weeks with the adjacent months’ days', () => {
      // March 2026 starts on a Sunday. With a Monday week start, the first row
      // reaches back into February.
      const weeks = monthGrid('2026-03-01', 1);

      expect(weeks[0].days[0].iso).toBe('2026-02-23');
      expect(weeks[0].days[0].inMonth).toBeFalse();
      expect(weeks[0].days[6].iso).toBe('2026-03-01');
      expect(weeks[0].days[6].inMonth).toBeTrue();
    });

    it('starts the week where it is told to', () => {
      const sunday = monthGrid('2026-03-01', 0);
      expect(sunday[0].days[0].iso).toBe('2026-03-01');
      expect(sunday[0].days[0].inMonth).toBeTrue();
    });

    it('is always six rows tall, so the page below it does not move', () => {
      // February 2026 fits in four rows + a lead. Without fixed weeks it is five.
      expect(monthGrid('2026-02-01', 1).length).toBe(6);
      expect(monthGrid('2026-02-01', 1, false).length).toBe(5);
      expect(monthGrid('2026-03-01', 1, false).length).toBe(6);
    });

    it('numbers every row, and every day', () => {
      const weeks = monthGrid('2026-03-01', 1);
      expect(weeks.length).toBe(6);
      expect(weeks.every((week) => week.days.length === 7)).toBeTrue();
      expect(weeks[0].weekNumber).toBe(9);
      expect(weeks[1].weekNumber).toBe(10);
    });

    it('marks exactly the days of the month as inMonth', () => {
      const inMonth = monthGrid('2026-02-01', 1)
        .flatMap((week) => week.days)
        .filter((day) => day.inMonth);

      expect(inMonth.length).toBe(28);
      expect(inMonth[0].iso).toBe('2026-02-01');
      expect(inMonth[27].iso).toBe('2026-02-28');
    });
  });

  describe('typed input', () => {
    it('describes the pattern it expects', () => {
      expect(datePattern('ymd')).toBe('yyyy-mm-dd');
      expect(datePattern('dmy', '/')).toBe('dd/mm/yyyy');
      expect(datePattern('mdy', '/')).toBe('mm/dd/yyyy');
    });

    it('formats in the order it is given', () => {
      expect(formatDateInput('2026-03-04', 'ymd')).toBe('2026-03-04');
      expect(formatDateInput('2026-03-04', 'dmy', '/')).toBe('04/03/2026');
      expect(formatDateInput('2026-03-04', 'mdy', '/')).toBe('03/04/2026');
    });

    it('parses what a human types, whatever they separate it with', () => {
      expect(parseDateInput('2026-03-04')).toBe('2026-03-04');
      expect(parseDateInput('2026/3/4')).toBe('2026-03-04');
      expect(parseDateInput('2026.03.04')).toBe('2026-03-04');
      expect(parseDateInput('20260304')).toBe('2026-03-04');
      expect(parseDateInput('  2026-03-04  ')).toBe('2026-03-04');
    });

    it('parses day-first and month-first orders', () => {
      expect(parseDateInput('4/3/2026', 'dmy')).toBe('2026-03-04');
      expect(parseDateInput('04032026', 'dmy')).toBe('2026-03-04');
      expect(parseDateInput('3/4/2026', 'mdy')).toBe('2026-03-04');
      expect(parseDateInput('03042026', 'mdy')).toBe('2026-03-04');
    });

    it('reads a two-digit year as this century', () => {
      expect(parseDateInput('4/3/26', 'dmy')).toBe('2026-03-04');
      expect(parseDateInput('26-03-04', 'ymd')).toBe('2026-03-04');
    });

    it('returns null rather than guessing', () => {
      expect(parseDateInput('')).toBeNull();
      expect(parseDateInput('   ')).toBeNull();
      expect(parseDateInput('tomorrow')).toBeNull();
      expect(parseDateInput('2026-02-30')).toBeNull();
      expect(parseDateInput('31/02/2026', 'dmy')).toBeNull();
      expect(parseDateInput('2026-03')).toBeNull();
      expect(parseDateInput('1/2/3/4')).toBeNull();
      expect(parseDateInput('202603')).toBeNull();
    });

    it('round-trips every order', () => {
      for (const order of ['ymd', 'dmy', 'mdy'] as const) {
        const text = formatDateInput('2024-02-29', order, '/');
        expect(parseDateInput(text, order)).toBe('2024-02-29');
      }
    });
  });
});
