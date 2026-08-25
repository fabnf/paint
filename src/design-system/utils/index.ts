/**
 * Internal helpers shared by Paint's components.
 *
 * Deliberately tiny: ARIA ids, a focus trap, a roving index and a scroll lock
 * are all the plumbing the component layer needs — plus the calendar arithmetic
 * the date molecules cannot be written without, and the step/clamp arithmetic
 * the range controls share, both pure, exported and tested on their own.
 */
export * from './unique-id';
export * from './focus';
export * from './scroll-lock';
export * from './page-inert';
export * from './date';
export * from './time';
export * from './number';
