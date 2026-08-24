/**
 * Color tokens — atomic design foundations.
 * Primitive scales feed semantic aliases used by the theme.
 *
 * Direction: "Wet Paint" (v0.3.0). Neutrals are violet-cast ink rather than
 * grey, the primary is an electric violet, and magenta + lime carry the brand's
 * artistic streak. Status hues stay conventional — surprise belongs to the
 * brand, never to an error message.
 */

export const colorPrimitives = {
  white: '#ffffff',
  black: '#07060d',

  /** Neutrals with a violet cast — paper in a studio, not a grey box. */
  ink: {
    50: '#f8f7fb',
    100: '#f0eef6',
    200: '#e0dcea',
    300: '#c2bcd6',
    400: '#8d84ab',
    500: '#6b6285',
    600: '#5b5375',
    700: '#48415e',
    800: '#332e45',
    900: '#221e30',
    950: '#141221',
  },

  /** Primary — electric violet. The wet ink everything else mixes into. */
  violet: {
    50: '#f4f1ff',
    100: '#ebe4ff',
    200: '#d9cdff',
    300: '#bda5ff',
    400: '#9b72ff',
    500: '#7c3dff',
    600: '#6a1bf5',
    700: '#5811d4',
    800: '#4a12ab',
    900: '#3d1389',
    950: '#250a5c',
  },

  /** Accent — magenta bleed. Used sparingly, always on purpose. */
  magenta: {
    50: '#fff0f8',
    100: '#ffe2f2',
    200: '#ffc6e6',
    300: '#ff98d0',
    400: '#fb5bb0',
    500: '#ef2d92',
    600: '#c80b6c',
    700: '#a60a59',
    800: '#890d4c',
    900: '#731043',
    950: '#450523',
  },

  /** Energy — lime. The unmixed dab that keeps the palette awake. */
  lime: {
    50: '#f7ffe5',
    100: '#ecffc2',
    200: '#d9ff8a',
    300: '#c2fb47',
    400: '#aef018',
    500: '#93d400',
    600: '#72a800',
    700: '#567d04',
    800: '#456209',
    900: '#3a520d',
    950: '#1f2e05',
  },

  emerald: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
  },

  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    // Tuned (not stock): 700 carries warning *text*, so it has to clear 4.5:1
    // on the lightest and the darkest light surface alike.
    700: '#a84c06',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },

  rose: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
    950: '#4c0519',
  },

  sky: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },
} as const;

export type ColorPrimitiveScale = keyof typeof colorPrimitives;
export type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

/** Semantic color roles resolved per theme mode. */
export interface SemanticColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  /** Sunken wells: code blocks, previews, table heads. */
  surfaceSunken: string;
  border: string;
  borderStrong: string;
  /**
   * Boundary of an interactive control (input, select, checkbox).
   * Held at ≥ 3:1 against its surface for WCAG 1.4.11 (non-text contrast).
   */
  borderControl: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  primaryHover: string;
  primaryMuted: string;
  onPrimary: string;
  /** Brand accent — pairs with primary for expressive moments. */
  accent: string;
  accentHover: string;
  accentMuted: string;
  onAccent: string;
  success: string;
  successMuted: string;
  warning: string;
  warningMuted: string;
  danger: string;
  dangerMuted: string;
  info: string;
  infoMuted: string;
  focusRing: string;
  /** Scrim behind dialogs and drawers. */
  overlay: string;
}

export const lightSemanticColors: SemanticColors = {
  background: colorPrimitives.ink[100],
  surface: colorPrimitives.white,
  surfaceElevated: colorPrimitives.white,
  surfaceSunken: colorPrimitives.ink[50],
  border: colorPrimitives.ink[200],
  borderStrong: colorPrimitives.ink[300],
  borderControl: colorPrimitives.ink[400],
  text: colorPrimitives.ink[950],
  textMuted: colorPrimitives.ink[600],
  // 400 would only reach 3:1 — metadata is still text, so it gets AA.
  textSubtle: colorPrimitives.ink[500],
  primary: colorPrimitives.violet[600],
  primaryHover: colorPrimitives.violet[700],
  primaryMuted: colorPrimitives.violet[50],
  onPrimary: colorPrimitives.white,
  accent: colorPrimitives.magenta[600],
  accentHover: colorPrimitives.magenta[700],
  accentMuted: colorPrimitives.magenta[50],
  onAccent: colorPrimitives.white,
  // 700 rather than 600: status colours are text and button fills as often as
  // they are decoration, and the 600 steps land between 3.2:1 and 4.1:1.
  success: colorPrimitives.emerald[700],
  successMuted: colorPrimitives.emerald[50],
  warning: colorPrimitives.amber[700],
  warningMuted: colorPrimitives.amber[50],
  danger: colorPrimitives.rose[700],
  dangerMuted: colorPrimitives.rose[50],
  info: colorPrimitives.sky[700],
  infoMuted: colorPrimitives.sky[50],
  focusRing: colorPrimitives.violet[500],
  overlay: 'rgb(20 18 33 / 55%)',
};

export const darkSemanticColors: SemanticColors = {
  background: colorPrimitives.ink[950],
  surface: colorPrimitives.ink[900],
  surfaceElevated: colorPrimitives.ink[800],
  surfaceSunken: colorPrimitives.black,
  border: colorPrimitives.ink[700],
  borderStrong: colorPrimitives.ink[600],
  borderControl: colorPrimitives.ink[400],
  text: colorPrimitives.ink[50],
  // One step brighter than it looks like it needs: muted and subtle text also
  // appear on elevated surfaces (ink 800), where 300/400 would fail AA.
  textMuted: colorPrimitives.ink[200],
  textSubtle: colorPrimitives.ink[300],
  // Dark mode wants *lighter* brand tones: 400 only reaches 3.9:1 on an
  // elevated surface, 300 clears 6:1 and reads better on ink.
  primary: colorPrimitives.violet[300],
  primaryHover: colorPrimitives.violet[200],
  primaryMuted: colorPrimitives.violet[950],
  onPrimary: colorPrimitives.ink[950],
  accent: colorPrimitives.magenta[300],
  accentHover: colorPrimitives.magenta[200],
  accentMuted: colorPrimitives.magenta[950],
  onAccent: colorPrimitives.ink[950],
  success: colorPrimitives.emerald[400],
  successMuted: colorPrimitives.emerald[950],
  warning: colorPrimitives.amber[400],
  warningMuted: colorPrimitives.amber[950],
  danger: colorPrimitives.rose[400],
  dangerMuted: colorPrimitives.rose[950],
  info: colorPrimitives.sky[400],
  infoMuted: colorPrimitives.sky[950],
  focusRing: colorPrimitives.violet[400],
  overlay: 'rgb(7 6 13 / 72%)',
};
