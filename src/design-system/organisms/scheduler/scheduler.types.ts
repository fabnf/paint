import { addDays, dayOfWeek, endOfMonth, startOfMonth, type IsoDate, type WeekStart } from '../../utils/date';
import type { Tone } from '../../primitives/tone.types';

/**
 * One event. The host's data, and deliberately *not* a collection item: an
 * event has a start, an end and a calendar, and a list row has none of those.
 *
 * Times are ISO strings — `2026-03-04` for an all-day event, or
 * `2026-03-04T09:30` for one with a clock. No `Date`s in the contract: a date
 * that crosses a time zone on the way into a component is a date that shows up
 * on the wrong day.
 */
export interface SchedulerEvent<T = unknown> {
  readonly id: string;
  readonly title: string;
  /** `yyyy-mm-dd` or `yyyy-mm-ddThh:mm`. */
  readonly start: string;
  /** Absent: a point in time (or the whole day, when `allDay`). */
  readonly end?: string;
  readonly allDay?: boolean;
  /** Which calendar it belongs to — shown, and filtered on by the host. */
  readonly calendar?: string;
  /** The event's paint, from the shared tones. Never a colour. */
  readonly tone?: Tone;
  readonly location?: string;
  readonly description?: string;
  readonly data?: T;
}

/** How much is on screen. */
export type SchedulerView = 'month' | 'week' | 'day' | 'agenda';

/** The range a view is showing, inclusive. */
export interface SchedulerRange {
  readonly start: IsoDate;
  readonly end: IsoDate;
  readonly view: SchedulerView;
}

export interface SchedulerEventEvent<T = unknown> {
  readonly event: SchedulerEvent<T>;
  /** The day it was opened from, when that is known. */
  readonly date: IsoDate | null;
}

/** The date part of an event's start or end. */
export function dateOf(value: string): IsoDate {
  return value.slice(0, 10);
}

/** The clock part, or `''` for an all-day event. */
export function timeOf(value: string): string {
  const time = value.slice(11, 16);
  return time.length === 5 ? time : '';
}

/** Minutes since midnight, for stacking. An absent clock is midnight. */
export function minutesOf(value: string): number {
  const time = timeOf(value);
  if (!time) {
    return 0;
  }
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** Does this event touch this day? Multi-day events touch several. */
export function occursOn<T>(event: SchedulerEvent<T>, iso: IsoDate): boolean {
  const start = dateOf(event.start);
  const end = event.end ? dateOf(event.end) : start;
  return iso >= start && iso <= end;
}

/** The events of one day, earliest first, all-day ones at the top. */
export function eventsOn<T>(
  events: readonly SchedulerEvent<T>[],
  iso: IsoDate,
): SchedulerEvent<T>[] {
  return events
    .filter((event) => occursOn(event, iso))
    .sort((a, b) => {
      if (!!a.allDay !== !!b.allDay) {
        return a.allDay ? -1 : 1;
      }
      return minutesOf(a.start) - minutesOf(b.start) || a.title.localeCompare(b.title);
    });
}

/** The range a view covers, given the date it is anchored on. */
export function rangeFor(view: SchedulerView, anchor: IsoDate, weekStart: WeekStart = 1): SchedulerRange {
  switch (view) {
    case 'month':
      return { view, start: startOfMonth(anchor), end: endOfMonth(anchor) };
    case 'week': {
      const lead = (dayOfWeek(anchor) - weekStart + 7) % 7;
      const start = addDays(anchor, -lead);
      return { view, start, end: addDays(start, 6) };
    }
    case 'day':
      return { view, start: anchor, end: anchor };
    case 'agenda':
      // A fortnight: long enough to be a plan, short enough to read.
      return { view, start: anchor, end: addDays(anchor, 13) };
  }
}

/** One step forward or back, in whatever the view's own unit is. */
export function stepAnchor(view: SchedulerView, anchor: IsoDate, direction: 1 | -1): IsoDate {
  switch (view) {
    case 'month': {
      const moved = addDays(startOfMonth(anchor), direction > 0 ? 32 : -1);
      return startOfMonth(moved);
    }
    case 'week':
      return addDays(anchor, 7 * direction);
    case 'day':
      return addDays(anchor, direction);
    case 'agenda':
      return addDays(anchor, 14 * direction);
  }
}

/** Every day of a range, inclusive. */
export function daysBetween(start: IsoDate, end: IsoDate): IsoDate[] {
  const days: IsoDate[] = [];
  for (let day = start; day <= end; day = addDays(day, 1)) {
    days.push(day);
  }
  return days;
}

/** An event, placed in a column so overlaps stay readable. */
export interface PlacedEvent<T = unknown> {
  readonly event: SchedulerEvent<T>;
  /** 0-based column within its overlapping group. */
  readonly column: number;
  /** How many columns that group needs. */
  readonly columns: number;
  /** Minutes from midnight, and how long it runs (clamped to the day). */
  readonly startMinute: number;
  readonly duration: number;
}

/**
 * Packs a day's timed events into columns.
 *
 * Overlapping events share the width of the day rather than covering each
 * other: a group of events that touch gets as many columns as its widest
 * overlap, and each event takes the first free one. Readability is the whole
 * requirement here — an event hidden behind another is an event nobody goes to.
 */
export function placeDay<T>(events: readonly SchedulerEvent<T>[]): PlacedEvent<T>[] {
  const timed = events
    .filter((event) => !event.allDay)
    .map((event) => {
      const startMinute = minutesOf(event.start);
      const endMinute = event.end ? minutesOf(event.end) : startMinute + 60;
      return {
        event,
        startMinute,
        duration: Math.max(30, (endMinute > startMinute ? endMinute : startMinute + 60) - startMinute),
      };
    })
    .sort((a, b) => a.startMinute - b.startMinute || a.duration - b.duration);

  const placed: PlacedEvent<T>[] = [];
  let group: typeof timed = [];
  let groupEnd = -1;

  const flush = () => {
    if (!group.length) {
      return;
    }
    const columnEnds: number[] = [];
    const assigned = group.map((entry) => {
      let column = columnEnds.findIndex((end) => end <= entry.startMinute);
      if (column === -1) {
        column = columnEnds.length;
      }
      columnEnds[column] = entry.startMinute + entry.duration;
      return { entry, column };
    });
    const columns = columnEnds.length;
    for (const { entry, column } of assigned) {
      placed.push({ ...entry, column, columns });
    }
    group = [];
    groupEnd = -1;
  };

  for (const entry of timed) {
    if (group.length && entry.startMinute >= groupEnd) {
      flush();
    }
    group.push(entry);
    groupEnd = Math.max(groupEnd, entry.startMinute + entry.duration);
  }
  flush();

  return placed;
}
