/**
 * Inline SVG path registry for the design-system icon set.
 * Paths assume a 24×24 viewBox.
 */

export interface IconDefinition {
  viewBox: string;
  /** One or more SVG path `d` values */
  paths: readonly string[];
  /** Optional stroke-based icons (default is filled) */
  stroke?: boolean;
}

export const iconRegistry = {
  check: {
    viewBox: '0 0 24 24',
    paths: ['M20 6 9 17l-5-5'],
    stroke: true,
  },
  close: {
    viewBox: '0 0 24 24',
    paths: ['M18 6 6 18', 'm6 6 12 12'],
    stroke: true,
  },
  plus: {
    viewBox: '0 0 24 24',
    paths: ['M12 5v14', 'M5 12h14'],
    stroke: true,
  },
  minus: {
    viewBox: '0 0 24 24',
    paths: ['M5 12h14'],
    stroke: true,
  },
  search: {
    viewBox: '0 0 24 24',
    paths: ['m21 21-4.3-4.3', 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z'],
    stroke: true,
  },
  chevronDown: {
    viewBox: '0 0 24 24',
    paths: ['m6 9 6 6 6-6'],
    stroke: true,
  },
  chevronRight: {
    viewBox: '0 0 24 24',
    paths: ['m9 18 6-6-6-6'],
    stroke: true,
  },
  chevronLeft: {
    viewBox: '0 0 24 24',
    paths: ['m15 18-6-6 6-6'],
    stroke: true,
  },
  arrowRight: {
    viewBox: '0 0 24 24',
    paths: ['M5 12h14', 'm12 5 7 7-7 7'],
    stroke: true,
  },
  info: {
    viewBox: '0 0 24 24',
    paths: [
      'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
      'M12 16v-4',
      'M12 8h.01',
    ],
    stroke: true,
  },
  warning: {
    viewBox: '0 0 24 24',
    paths: [
      'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
      'M12 9v4',
      'M12 17h.01',
    ],
    stroke: true,
  },
  success: {
    viewBox: '0 0 24 24',
    paths: [
      'M22 11.08V12a10 10 0 1 1-5.93-9.14',
      'M22 4 12 14.01l-3-3',
    ],
    stroke: true,
  },
  sun: {
    viewBox: '0 0 24 24',
    paths: [
      'M12 3v1',
      'M12 20v1',
      'M3 12h1',
      'M20 12h1',
      'm5.6 5.6.7.7',
      'm17.7 17.7.7.7',
      'm5.6 18.4.7-.7',
      'm17.7 6.3.7-.7',
      'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    ],
    stroke: true,
  },
  moon: {
    viewBox: '0 0 24 24',
    paths: ['M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z'],
    stroke: true,
  },
  palette: {
    viewBox: '0 0 24 24',
    paths: [
      'M12 2a10 10 0 0 0-1 19.95 1.5 1.5 0 0 0 1.5-1.5v-1.2a1.8 1.8 0 0 1 1.8-1.8h2.45A4.25 4.25 0 0 0 21 12.2 10 10 0 0 0 12 2z',
      'M7.5 11.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
      'M10.5 7.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
      'M15 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
      'M17.5 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
    ],
    stroke: true,
  },
  menu: {
    viewBox: '0 0 24 24',
    paths: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
    stroke: true,
  },
  home: {
    viewBox: '0 0 24 24',
    paths: ['m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'],
    stroke: true,
  },
  copy: {
    viewBox: '0 0 24 24',
    paths: [
      'M9 9h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2z',
      'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
    ],
    stroke: true,
  },
  code: {
    viewBox: '0 0 24 24',
    paths: ['m16 18 6-6-6-6', 'm8 6-6 6 6 6'],
    stroke: true,
  },
  layers: {
    viewBox: '0 0 24 24',
    paths: [
      'm12 2 9 5-9 5-9-5 9-5z',
      'm3 12 9 5 9-5',
      'm3 17 9 5 9-5',
    ],
    stroke: true,
  },
  box: {
    viewBox: '0 0 24 24',
    paths: [
      'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z',
      'M8 8h8v8H8z',
    ],
    stroke: true,
  },
  grid: {
    viewBox: '0 0 24 24',
    paths: [
      'M3 3h7v7H3z',
      'M14 3h7v7h-7z',
      'M14 14h7v7h-7z',
      'M3 14h7v7H3z',
    ],
    stroke: true,
  },
  columns: {
    viewBox: '0 0 24 24',
    paths: ['M3 4h18v16H3z', 'M9 4v16', 'M15 4v16'],
    stroke: true,
  },
  rows: {
    viewBox: '0 0 24 24',
    paths: ['M3 4h18v16H3z', 'M3 10h18', 'M3 15h18'],
    stroke: true,
  },
  type: {
    viewBox: '0 0 24 24',
    paths: ['M4 6V4h16v2', 'M12 4v16', 'M9 20h6'],
    stroke: true,
  },
  ruler: {
    viewBox: '0 0 24 24',
    paths: [
      'M2.5 14.6 9.4 21.5a1.5 1.5 0 0 0 2.1 0l10-10a1.5 1.5 0 0 0 0-2.1L14.6 2.5a1.5 1.5 0 0 0-2.1 0l-10 10a1.5 1.5 0 0 0 0 2.1z',
      'm7.5 9.5 2 2',
      'm11 6 2 2',
      'm14.5 2.5 2 2',
      'm4 13 2 2',
    ],
    stroke: true,
  },
  externalLink: {
    viewBox: '0 0 24 24',
    paths: [
      'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6',
      'M15 3h6v6',
      'M10 14 21 3',
    ],
    stroke: true,
  },
  sparkle: {
    viewBox: '0 0 24 24',
    paths: [
      'm12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z',
      'M19 16v4',
      'M17 18h4',
    ],
    stroke: true,
  },
  book: {
    viewBox: '0 0 24 24',
    paths: [
      'M4 19.5A2.5 2.5 0 0 1 6.5 17H20',
      'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
    ],
    stroke: true,
  },
  zap: {
    viewBox: '0 0 24 24',
    paths: ['M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5z'],
    stroke: true,
  },
  chevronUp: {
    viewBox: '0 0 24 24',
    paths: ['m18 15-6-6-6 6'],
    stroke: true,
  },
  chevronsUpDown: {
    viewBox: '0 0 24 24',
    paths: ['m7 15 5 5 5-5', 'm7 9 5-5 5 5'],
    stroke: true,
  },
  more: {
    viewBox: '0 0 24 24',
    paths: [
      'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
      'M19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
      'M5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
    ],
    stroke: true,
  },
  trash: {
    viewBox: '0 0 24 24',
    paths: [
      'M3 6h18',
      'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6',
      'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
      'M10 11v6',
      'M14 11v6',
    ],
    stroke: true,
  },
  edit: {
    viewBox: '0 0 24 24',
    paths: [
      'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7',
      'M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z',
    ],
    stroke: true,
  },
  filter: {
    viewBox: '0 0 24 24',
    paths: ['M22 3H2l8 9.46V19l4 2v-8.54z'],
    stroke: true,
  },
  download: {
    viewBox: '0 0 24 24',
    paths: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm7 10 5 5 5-5', 'M12 15V3'],
    stroke: true,
  },
  bell: {
    viewBox: '0 0 24 24',
    paths: [
      'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9',
      'M13.7 21a2 2 0 0 1-3.4 0',
    ],
    stroke: true,
  },
  window: {
    viewBox: '0 0 24 24',
    paths: ['M3 4h18a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z', 'M2 9h20'],
    stroke: true,
  },
  table: {
    viewBox: '0 0 24 24',
    paths: ['M3 3h18v18H3z', 'M3 9h18', 'M3 15h18', 'M10 3v18'],
    stroke: true,
  },
  tabs: {
    viewBox: '0 0 24 24',
    paths: ['M2 8h20v13H2z', 'M2 8V5a1 1 0 0 1 1-1h6l2 2h4'],
    stroke: true,
  },
  list: {
    viewBox: '0 0 24 24',
    paths: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
    stroke: true,
  },
  user: {
    viewBox: '0 0 24 24',
    paths: [
      'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2',
      'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    ],
    stroke: true,
  },
  tag: {
    viewBox: '0 0 24 24',
    paths: [
      'M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8z',
      'M7.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z',
    ],
    stroke: true,
  },
  refresh: {
    viewBox: '0 0 24 24',
    paths: [
      'M21 12a9 9 0 1 1-2.64-6.36',
      'M21 3v6h-6',
    ],
    stroke: true,
  },
  /** Date and time entry. */
  calendar: {
    viewBox: '0 0 24 24',
    paths: [
      'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z',
      'M16 2v4',
      'M8 2v4',
      'M3 10h18',
    ],
    stroke: true,
  },
  clock: {
    viewBox: '0 0 24 24',
    paths: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
    stroke: true,
  },
  /** Password visibility — the eye, and the eye with a line through it. */
  eye: {
    viewBox: '0 0 24 24',
    paths: [
      'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z',
      'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    ],
    stroke: true,
  },
  eyeOff: {
    viewBox: '0 0 24 24',
    paths: [
      'M10.6 6.2A9.8 9.8 0 0 1 12 6c6.4 0 10 6 10 6a18 18 0 0 1-2.7 3.4',
      'M6.6 7.6A17.7 17.7 0 0 0 2 12s3.6 7 10 7a9.6 9.6 0 0 0 4.2-1',
      'M9.9 9.9a3 3 0 0 0 4.2 4.2',
      'M3 3l18 18',
    ],
    stroke: true,
  },
  /** The form atoms: a switch, a checked box, and a chosen radio. */
  toggle: {
    viewBox: '0 0 24 24',
    paths: ['M16 6H8a6 6 0 1 0 0 12h8a6 6 0 0 0 0-12z', 'M16 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'],
    stroke: true,
  },
  checkbox: {
    viewBox: '0 0 24 24',
    paths: ['M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z', 'm8 12 3 3 5-6'],
    stroke: true,
  },
  radio: {
    viewBox: '0 0 24 24',
    paths: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
    stroke: true,
  },
  textCursor: {
    viewBox: '0 0 24 24',
    paths: ['M10 4h1a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-1', 'M14 4h-1a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h1', 'M7 12h10'],
    stroke: true,
  },
  upload: {
    viewBox: '0 0 24 24',
    paths: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm17 8-5-5-5 5', 'M12 3v12'],
    stroke: true,
  },
  file: {
    viewBox: '0 0 24 24',
    paths: [
      'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z',
      'M14 2v4a2 2 0 0 0 2 2h4',
    ],
    stroke: true,
  },
  settings: {
    viewBox: '0 0 24 24',
    paths: [
      'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
      'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
    ],
    stroke: true,
  },
} as const satisfies Record<string, IconDefinition>;

export type IconName = keyof typeof iconRegistry;

export function getIcon(name: IconName): IconDefinition {
  return iconRegistry[name];
}

export function registerIcon(name: string, definition: IconDefinition): void {
  (iconRegistry as Record<string, IconDefinition>)[name] = definition;
}
