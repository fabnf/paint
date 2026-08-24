/**
 * Clock arithmetic for Paint's time molecule.
 *
 * Like dates, times here are plain strings: `HH:mm` or `HH:mm:ss`, always
 * 24-hour, always zero-padded. A time of day is not an instant either — "09:30"
 * is when the shop opens, not a moment on a timeline — so there is no `Date`,
 * no offset and no DST to get wrong.
 *
 * Twelve-hour clocks are a *display* decision. The value never changes.
 */

/** `HH:mm` or `HH:mm:ss`, 24-hour. */
export type IsoTime = string;

export interface TimeParts {
  hour: number;
  minute: number;
  second: number;
}

const TIME_PATTERN = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

const pad = (value: number): string => String(value).padStart(2, '0');

export function isValidTimeParts({ hour, minute, second }: TimeParts): boolean {
  return (
    Number.isInteger(hour) &&
    Number.isInteger(minute) &&
    Number.isInteger(second) &&
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59 &&
    second >= 0 &&
    second <= 59
  );
}

export function fromIsoTime(value: string | null | undefined): TimeParts | null {
  if (!value) {
    return null;
  }

  const match = TIME_PATTERN.exec(value.trim());
  if (!match) {
    return null;
  }

  const parts = {
    hour: Number(match[1]),
    minute: Number(match[2]),
    second: match[3] ? Number(match[3]) : 0,
  };

  return isValidTimeParts(parts) ? parts : null;
}

export function toIsoTime({ hour, minute, second }: TimeParts, withSeconds = false): IsoTime {
  const base = `${pad(hour)}:${pad(minute)}`;
  return withSeconds ? `${base}:${pad(second)}` : base;
}

export function isIsoTime(value: unknown): value is IsoTime {
  return typeof value === 'string' && fromIsoTime(value) !== null;
}

/** Minutes since midnight. Seconds are truncated, not rounded: 09:30:59 is 09:30. */
export function toMinutes(time: IsoTime): number {
  const parts = fromIsoTime(time);
  if (!parts) {
    throw new RangeError(`Not a time: ${JSON.stringify(time)}`);
  }
  return parts.hour * 60 + parts.minute;
}

export function toSeconds(time: IsoTime): number {
  const parts = fromIsoTime(time);
  if (!parts) {
    throw new RangeError(`Not a time: ${JSON.stringify(time)}`);
  }
  return parts.hour * 3600 + parts.minute * 60 + parts.second;
}

/** Lexicographic order is chronological order, for zero-padded 24-hour times. */
export function compareTime(a: IsoTime, b: IsoTime): number {
  const left = toSeconds(a);
  const right = toSeconds(b);
  return left < right ? -1 : left > right ? 1 : 0;
}

export function isTimeWithin(time: IsoTime, min?: IsoTime | null, max?: IsoTime | null): boolean {
  if (min && compareTime(time, min) < 0) {
    return false;
  }
  return !(max && compareTime(time, max) > 0);
}

export function clampTime(time: IsoTime, min?: IsoTime | null, max?: IsoTime | null): IsoTime {
  if (min && compareTime(time, min) < 0) {
    return min;
  }
  return max && compareTime(time, max) > 0 ? max : time;
}

/**
 * Adds minutes, wrapping around midnight.
 *
 * A time of day has no date to carry into, so 23:50 + 20 minutes is 00:10. The
 * caller knows whether that means tomorrow; this does not.
 */
export function addMinutes(time: IsoTime, minutes: number, withSeconds = false): IsoTime {
  const parts = fromIsoTime(time);
  if (!parts) {
    throw new RangeError(`Not a time: ${JSON.stringify(time)}`);
  }

  const total = (((parts.hour * 60 + parts.minute + minutes) % 1440) + 1440) % 1440;

  return toIsoTime(
    { hour: Math.floor(total / 60), minute: total % 60, second: parts.second },
    withSeconds,
  );
}

/**
 * Rounds a time to the nearest multiple of `step` minutes, counting from
 * midnight. The value a stepper lands on should not depend on where it started.
 */
export function snapToStep(time: IsoTime, step: number, withSeconds = false): IsoTime {
  if (step <= 1) {
    return time;
  }

  const minutes = toMinutes(time);
  const snapped = Math.round(minutes / step) * step;
  const wrapped = ((snapped % 1440) + 1440) % 1440;

  return toIsoTime({ hour: Math.floor(wrapped / 60), minute: wrapped % 60, second: 0 }, withSeconds);
}

// —— Typed input ——

/**
 * Parses what a human actually types into a time field.
 *
 * `9` → 09:00. `930` → 09:30. `9:3` → 09:03. `0930` → 09:30. `9pm` → 21:00.
 * `9:30 PM` → 21:30. `12am` → 00:00, because midnight is hour zero and the
 * twelve-hour clock is a historical accident.
 *
 * Returns `null` when it cannot be sure, so the caller can say so.
 */
export function parseTimeInput(text: string, withSeconds = false): IsoTime | null {
  const trimmed = text.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  const meridiem = /\s*([ap])\.?m\.?$/.exec(trimmed);
  const body = meridiem ? trimmed.slice(0, meridiem.index).trim() : trimmed;
  const groups = body.split(/[^\d]+/).filter(Boolean);

  let hour: number;
  let minute = 0;
  let second = 0;

  if (groups.length === 1) {
    const digits = groups[0];
    if (digits.length <= 2) {
      hour = Number(digits);
    } else if (digits.length === 3) {
      hour = Number(digits.slice(0, 1));
      minute = Number(digits.slice(1));
    } else if (digits.length === 4) {
      hour = Number(digits.slice(0, 2));
      minute = Number(digits.slice(2));
    } else if (digits.length === 6) {
      hour = Number(digits.slice(0, 2));
      minute = Number(digits.slice(2, 4));
      second = Number(digits.slice(4));
    } else {
      return null;
    }
  } else if (groups.length === 2 || groups.length === 3) {
    hour = Number(groups[0]);
    minute = Number(groups[1]);
    second = groups[2] ? Number(groups[2]) : 0;
  } else {
    return null;
  }

  if (meridiem) {
    if (hour < 1 || hour > 12) {
      return null;
    }
    const pm = meridiem[1] === 'p';
    hour = pm ? (hour === 12 ? 12 : hour + 12) : hour === 12 ? 0 : hour;
  }

  const parts = { hour, minute, second };
  if (!isValidTimeParts(parts)) {
    return null;
  }

  // A field that does not show seconds does not keep them.
  return toIsoTime(parts, withSeconds);
}

/**
 * Formats a time for a human. `hour12` switches the *display* only: the value
 * this came from, and the value typing it back produces, stay 24-hour.
 */
export function formatTimeInput(time: IsoTime, hour12 = false, withSeconds = false): string {
  const parts = fromIsoTime(time);
  if (!parts) {
    throw new RangeError(`Not a time: ${JSON.stringify(time)}`);
  }

  if (!hour12) {
    return toIsoTime(parts, withSeconds);
  }

  const suffix = parts.hour < 12 ? 'AM' : 'PM';
  const hour = parts.hour % 12 || 12;
  const body = withSeconds
    ? `${hour}:${pad(parts.minute)}:${pad(parts.second)}`
    : `${hour}:${pad(parts.minute)}`;

  return `${body} ${suffix}`;
}

/** "9:30 AM" / "09:30" — the accessible name, spoken in full. */
export function spokenTime(time: IsoTime, locale: string, withSeconds = false): string {
  const parts = fromIsoTime(time);
  if (!parts) {
    return '';
  }

  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    second: withSeconds ? '2-digit' : undefined,
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(2024, 0, 1, parts.hour, parts.minute, parts.second)));
}
