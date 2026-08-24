import {
  addMinutes,
  clampTime,
  compareTime,
  formatTimeInput,
  fromIsoTime,
  isIsoTime,
  isTimeWithin,
  isValidTimeParts,
  parseTimeInput,
  snapToStep,
  spokenTime,
  toIsoTime,
  toMinutes,
  toSeconds,
} from './time';

describe('clock arithmetic', () => {
  describe('parsing', () => {
    it('round-trips a 24-hour time', () => {
      expect(fromIsoTime('09:30')).toEqual({ hour: 9, minute: 30, second: 0 });
      expect(fromIsoTime('23:59:59')).toEqual({ hour: 23, minute: 59, second: 59 });
      expect(toIsoTime({ hour: 9, minute: 30, second: 0 })).toBe('09:30');
      expect(toIsoTime({ hour: 9, minute: 30, second: 5 }, true)).toBe('09:30:05');
    });

    it('rejects the impossible', () => {
      expect(fromIsoTime('24:00')).toBeNull();
      expect(fromIsoTime('09:60')).toBeNull();
      expect(fromIsoTime('9:30 PM')).toBeNull();
      expect(fromIsoTime('nonsense')).toBeNull();
      expect(fromIsoTime('')).toBeNull();
      expect(fromIsoTime(null)).toBeNull();
      expect(isIsoTime('09:30')).toBeTrue();
      expect(isIsoTime(930)).toBeFalse();
    });

    it('validates parts directly', () => {
      expect(isValidTimeParts({ hour: 23, minute: 59, second: 59 })).toBeTrue();
      expect(isValidTimeParts({ hour: 24, minute: 0, second: 0 })).toBeFalse();
      expect(isValidTimeParts({ hour: 1.5, minute: 0, second: 0 })).toBeFalse();
    });
  });

  describe('measuring', () => {
    it('counts from midnight', () => {
      expect(toMinutes('00:00')).toBe(0);
      expect(toMinutes('09:30')).toBe(570);
      expect(toMinutes('23:59')).toBe(1439);
      expect(toSeconds('00:01:30')).toBe(90);
    });

    it('truncates seconds to the minute, rather than rounding them away', () => {
      expect(toMinutes('09:30:59')).toBe(570);
    });

    it('throws on a value that is not a time', () => {
      expect(() => toMinutes('half past nine')).toThrowError(RangeError);
    });

    it('compares, bounds and clamps', () => {
      expect(compareTime('09:00', '09:30')).toBe(-1);
      expect(compareTime('09:30', '09:30')).toBe(0);
      expect(compareTime('10:00', '09:30')).toBe(1);

      expect(isTimeWithin('09:30', '09:00', '17:00')).toBeTrue();
      expect(isTimeWithin('08:59', '09:00', '17:00')).toBeFalse();
      expect(isTimeWithin('09:00', '09:00', '17:00')).toBeTrue();
      expect(isTimeWithin('09:30', null, null)).toBeTrue();

      expect(clampTime('08:00', '09:00', '17:00')).toBe('09:00');
      expect(clampTime('18:00', '09:00', '17:00')).toBe('17:00');
      expect(clampTime('12:00', '09:00', '17:00')).toBe('12:00');
    });
  });

  describe('addMinutes', () => {
    it('adds and subtracts', () => {
      expect(addMinutes('09:30', 15)).toBe('09:45');
      expect(addMinutes('09:30', -45)).toBe('08:45');
      expect(addMinutes('09:30', 60)).toBe('10:30');
    });

    it('wraps around midnight, because a time of day has no date to carry into', () => {
      expect(addMinutes('23:50', 20)).toBe('00:10');
      expect(addMinutes('00:10', -20)).toBe('23:50');
      expect(addMinutes('00:00', -1)).toBe('23:59');
      expect(addMinutes('09:30', 1440)).toBe('09:30');
    });

    it('keeps the seconds it was given', () => {
      expect(addMinutes('09:30:45', 15, true)).toBe('09:45:45');
    });
  });

  describe('snapToStep', () => {
    it('snaps to a multiple of the step, counting from midnight', () => {
      expect(snapToStep('09:07', 15)).toBe('09:00');
      expect(snapToStep('09:08', 15)).toBe('09:15');
      expect(snapToStep('09:38', 30)).toBe('09:30');
      expect(snapToStep('09:46', 30)).toBe('10:00');
    });

    it('leaves a one-minute step alone', () => {
      expect(snapToStep('09:07', 1)).toBe('09:07');
    });

    it('wraps rather than reaching tomorrow', () => {
      expect(snapToStep('23:50', 30)).toBe('00:00');
    });
  });

  describe('typed input', () => {
    it('parses the shapes people actually type', () => {
      expect(parseTimeInput('9')).toBe('09:00');
      expect(parseTimeInput('09')).toBe('09:00');
      expect(parseTimeInput('930')).toBe('09:30');
      expect(parseTimeInput('0930')).toBe('09:30');
      expect(parseTimeInput('9:3')).toBe('09:03');
      expect(parseTimeInput('9:30')).toBe('09:30');
      expect(parseTimeInput('09.30')).toBe('09:30');
      expect(parseTimeInput('  9:30  ')).toBe('09:30');
      expect(parseTimeInput('23:59')).toBe('23:59');
    });

    it('understands the twelve-hour clock, including its midnight', () => {
      expect(parseTimeInput('9pm')).toBe('21:00');
      expect(parseTimeInput('9 PM')).toBe('21:00');
      expect(parseTimeInput('9:30 p.m.')).toBe('21:30');
      expect(parseTimeInput('9am')).toBe('09:00');
      expect(parseTimeInput('12am')).toBe('00:00');
      expect(parseTimeInput('12pm')).toBe('12:00');
      expect(parseTimeInput('12:30am')).toBe('00:30');
    });

    it('keeps seconds only when the field has them', () => {
      expect(parseTimeInput('9:30:45', true)).toBe('09:30:45');
      expect(parseTimeInput('093045', true)).toBe('09:30:45');
      expect(parseTimeInput('9:30:45')).toBe('09:30');
    });

    it('returns null rather than guessing', () => {
      expect(parseTimeInput('')).toBeNull();
      expect(parseTimeInput('   ')).toBeNull();
      expect(parseTimeInput('noon')).toBeNull();
      expect(parseTimeInput('25:00')).toBeNull();
      expect(parseTimeInput('9:60')).toBeNull();
      expect(parseTimeInput('13pm')).toBeNull();
      expect(parseTimeInput('0pm')).toBeNull();
      expect(parseTimeInput('am')).toBeNull();
      expect(parseTimeInput('12345')).toBeNull();
    });
  });

  describe('formatting', () => {
    it('keeps 24-hour times as they are', () => {
      expect(formatTimeInput('09:30')).toBe('09:30');
      expect(formatTimeInput('09:30:05', false, true)).toBe('09:30:05');
    });

    it('renders a twelve-hour clock without changing the value', () => {
      expect(formatTimeInput('09:30', true)).toBe('9:30 AM');
      expect(formatTimeInput('21:30', true)).toBe('9:30 PM');
      expect(formatTimeInput('00:00', true)).toBe('12:00 AM');
      expect(formatTimeInput('12:00', true)).toBe('12:00 PM');
      expect(formatTimeInput('12:05:30', true, true)).toBe('12:05:30 PM');
    });

    it('round-trips through a twelve-hour display', () => {
      for (const time of ['00:00', '00:30', '09:30', '12:00', '12:30', '21:45', '23:59']) {
        expect(parseTimeInput(formatTimeInput(time, true))).toBe(time);
      }
    });

    it('speaks a time in full', () => {
      expect(spokenTime('09:30', 'en-US')).toBe('9:30 AM');
      expect(spokenTime('21:30', 'en-GB')).toBe('21:30');
      expect(spokenTime('', 'en-GB')).toBe('');
    });
  });
});
