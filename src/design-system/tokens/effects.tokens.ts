/**
 * Effect tokens — elevation, texture and gradient.
 *
 * The "Wet Paint" direction asks for surfaces that feel printed rather than
 * rendered: shadows carry a violet cast instead of neutral grey, and brand
 * surfaces wear a grain overlay so flat color never looks plastic.
 */

import { colorPrimitives } from './colors.tokens';

/** Shadow ramp. Resolved per theme: ink-tinted in light, abyssal in dark. */
export interface ElevationShadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  /** Colored glow used for primary/accent emphasis. */
  glow: string;
}

export const lightShadows: ElevationShadows = {
  sm: '0 1px 2px rgb(20 18 33 / 6%), 0 1px 3px rgb(20 18 33 / 4%)',
  md: '0 4px 12px -2px rgb(20 18 33 / 10%), 0 2px 6px -2px rgb(20 18 33 / 6%)',
  lg: '0 16px 32px -8px rgb(20 18 33 / 16%), 0 4px 12px -4px rgb(20 18 33 / 8%)',
  xl: '0 32px 64px -16px rgb(20 18 33 / 24%), 0 8px 24px -8px rgb(37 10 92 / 12%)',
  glow: '0 12px 32px -8px rgb(106 27 245 / 45%)',
};

export const darkShadows: ElevationShadows = {
  sm: '0 1px 2px rgb(7 6 13 / 40%), 0 1px 3px rgb(7 6 13 / 28%)',
  md: '0 4px 12px -2px rgb(7 6 13 / 52%), 0 2px 6px -2px rgb(7 6 13 / 36%)',
  lg: '0 16px 32px -8px rgb(7 6 13 / 64%), 0 4px 12px -4px rgb(7 6 13 / 44%)',
  xl: '0 32px 64px -16px rgb(7 6 13 / 72%), 0 8px 24px -8px rgb(124 61 255 / 20%)',
  glow: '0 12px 32px -8px rgb(155 114 255 / 40%)',
};

export type ElevationToken = keyof ElevationShadows;

/**
 * Grain — a tiny fractal-noise SVG, inlined as a data URI.
 *
 * Layer it over a gradient with `background-blend-mode` (or a pseudo element at
 * low opacity) to break up flat fills. No request, no asset pipeline.
 */
const GRAIN_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.42'/%3E%3C/svg%3E";

/**
 * Hatching — diagonal pencil strokes for empty states and placeholder areas.
 */
const HATCH_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Cpath d='M-2 2 2-2M0 8 8 0M6 10l4-4' stroke='%238d84ab' stroke-width='1' stroke-opacity='0.45'/%3E%3C/svg%3E";

export const textures = {
  grain: `url("${GRAIN_SVG}")`,
  hatch: `url("${HATCH_SVG}")`,
} as const;

export type TextureToken = keyof typeof textures;

/**
 * How two pigments mix when they overlap.
 *
 * On paper, wet paint darkens where it layers (multiply). On a lit screen in
 * dark mode the same trick turns to mud, so pigment lightens instead (screen).
 * Resolved per theme, consumed by the logo and brand illustrations.
 */
export const blendModes = {
  light: 'multiply',
  dark: 'screen',
} as const;

export type BlendMode = (typeof blendModes)[keyof typeof blendModes];

/** Gradients that make up the brand's paint mixes. */
export const gradients = {
  /** Signature: magenta bleeding through violet into deep ink. */
  brand: `linear-gradient(135deg, ${colorPrimitives.magenta[500]} 0%, ${colorPrimitives.violet[500]} 52%, ${colorPrimitives.violet[800]} 100%)`,
  /** Cooler mix for secondary brand surfaces. */
  wash: `linear-gradient(135deg, ${colorPrimitives.violet[500]} 0%, ${colorPrimitives.sky[500]} 100%)`,
  /** The unmixed dab: lime into magenta. Use once per screen, at most. */
  energy: `linear-gradient(135deg, ${colorPrimitives.lime[300]} 0%, ${colorPrimitives.magenta[500]} 100%)`,
} as const;

export type GradientToken = keyof typeof gradients;
