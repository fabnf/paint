import { formatFileSize, matchesAccept } from './file-upload.types';

const file = (name: string, type: string, size = 10): File =>
  new File([new Uint8Array(size)], name, { type });

describe('matchesAccept', () => {
  it('accepts everything when the expression is empty', () => {
    expect(matchesAccept(file('a.bin', 'application/octet-stream'), '')).toBeTrue();
    expect(matchesAccept(file('a.bin', ''), '   ')).toBeTrue();
  });

  it('matches extensions, case-insensitively', () => {
    expect(matchesAccept(file('report.CSV', 'text/csv'), '.csv')).toBeTrue();
    expect(matchesAccept(file('report.tsv', 'text/tab-separated-values'), '.csv')).toBeFalse();
  });

  it('matches exact MIME types', () => {
    expect(matchesAccept(file('logo.png', 'image/png'), 'image/png')).toBeTrue();
    expect(matchesAccept(file('logo.webp', 'image/webp'), 'image/png')).toBeFalse();
  });

  it('matches wildcard MIME types', () => {
    expect(matchesAccept(file('logo.webp', 'image/webp'), 'image/*')).toBeTrue();
    expect(matchesAccept(file('notes.txt', 'text/plain'), 'image/*')).toBeFalse();
  });

  it('takes a comma-separated list, any rule wins', () => {
    const accept = 'image/*, .pdf, text/csv';
    expect(matchesAccept(file('scan.pdf', 'application/pdf'), accept)).toBeTrue();
    expect(matchesAccept(file('photo.jpg', 'image/jpeg'), accept)).toBeTrue();
    expect(matchesAccept(file('rows.csv', 'text/csv'), accept)).toBeTrue();
    expect(matchesAccept(file('notes.txt', 'text/plain'), accept)).toBeFalse();
  });
});

describe('formatFileSize', () => {
  it('speaks bytes like a person', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(999)).toBe('999 B');
    expect(formatFileSize(18 * 1024)).toBe('18 KB');
    expect(formatFileSize(4.2 * 1024 * 1024)).toBe('4.2 MB');
    expect(formatFileSize(1.5 * 1024 * 1024 * 1024)).toBe('1.5 GB');
  });

  it('keeps one decimal under ten of a unit, none above', () => {
    expect(formatFileSize(9.46 * 1024)).toBe('9.5 KB');
    expect(formatFileSize(123.4 * 1024)).toBe('123 KB');
  });

  it('returns nothing for nonsense', () => {
    expect(formatFileSize(-1)).toBe('');
    expect(formatFileSize(Number.NaN)).toBe('');
    expect(formatFileSize(Number.POSITIVE_INFINITY)).toBe('');
  });
});
