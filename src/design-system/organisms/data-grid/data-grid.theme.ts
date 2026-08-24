import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type Theme,
} from 'ag-grid-community';

let modulesRegistered = false;

/**
 * AG Grid is modular; Paint registers the whole Community set once, the first
 * time a grid is constructed — because an organism that works until the first
 * filter is opened is a trap. Enterprise modules are deliberately absent.
 *
 * Called from the component, not at module scope: a top-level side effect
 * here would drag AG Grid into the bundle of every app that touches Paint's
 * barrel, grid or no grid.
 */
export function registerPaintGridModules(): void {
  if (!modulesRegistered) {
    ModuleRegistry.registerModules([AllCommunityModule]);
    modulesRegistered = true;
  }
}

/**
 * The token bridge: AG Grid's Quartz theme, re-pointed at Paint's custom
 * properties — the same trick `theme/bootstrap.bridge.ts` plays on Bootstrap.
 *
 * Every value is a `var(--ds-*)` reference, not a copied colour, so the grid
 * follows the active theme at runtime: flip Paint to dark and the grid flips
 * with it, no second theme object, no re-render. `browserColorScheme:
 * 'inherit'` hands the scrollbars and native inputs the same deal.
 */
const paintParams = {
  // Colour roles
  accentColor: 'var(--ds-color-primary)',
  backgroundColor: 'var(--ds-color-surface)',
  foregroundColor: 'var(--ds-color-text)',
  borderColor: 'var(--ds-color-border)',
  headerBackgroundColor: 'var(--ds-color-surface-sunken)',
  headerTextColor: 'var(--ds-color-text-muted)',
  subtleTextColor: 'var(--ds-color-text-subtle)',
  rowHoverColor: 'color-mix(in srgb, var(--ds-color-surface-sunken) 60%, transparent)',
  selectedRowBackgroundColor: 'color-mix(in srgb, var(--ds-color-primary) 9%, transparent)',
  menuBackgroundColor: 'var(--ds-color-surface)',
  menuTextColor: 'var(--ds-color-text)',
  chromeBackgroundColor: 'var(--ds-color-surface)',
  modalOverlayBackgroundColor: 'color-mix(in srgb, var(--ds-color-surface) 66%, transparent)',

  // Controls inside the grid (header checkbox, filter inputs)
  checkboxCheckedBackgroundColor: 'var(--ds-color-primary)',
  checkboxCheckedBorderColor: 'var(--ds-color-primary)',
  checkboxIndeterminateBackgroundColor: 'var(--ds-color-primary)',
  checkboxIndeterminateBorderColor: 'var(--ds-color-primary)',
  checkboxUncheckedBorderColor: 'var(--ds-color-border-strong, var(--ds-color-border))',
  inputBackgroundColor: 'var(--ds-color-surface)',
  inputBorder: { color: 'var(--ds-color-border-control, var(--ds-color-border))' },
  inputFocusBorder: { color: 'var(--ds-color-primary)' },
  focusShadow: '0 0 0 3px color-mix(in srgb, var(--ds-color-focus-ring) 32%, transparent)',

  // Type and shape
  fontFamily: 'var(--ds-font-sans)',
  fontSize: 'var(--ds-font-size-sm)',
  headerFontSize: 'var(--ds-font-size-xs)',
  headerFontWeight: 600,
  wrapperBorderRadius: 'var(--ds-radius-lg)',
  borderRadius: 'var(--ds-radius-sm)',

  // Let the browser paint scrollbars and carets for the active scheme.
  browserColorScheme: 'inherit',
} as const;

let comfortable: Theme | undefined;
let compact: Theme | undefined;

/**
 * Paint's grid theme. `spacing` is the one knob the two densities disagree on:
 * Quartz derives paddings and row heights from it, which is exactly what a
 * density switch should mean — one decision, applied everywhere.
 *
 * Functions, not consts: a top-level `withParams()` call cannot be proven
 * pure, and would weld AG Grid into every bundle that touches Paint's barrel.
 * Built once, on first use, by the first grid.
 */
export function paintGridTheme(): Theme {
  return (comfortable ??= themeQuartz.withParams({ ...paintParams, spacing: 8 }));
}

/** The compact cut, for the screens this organism exists for. */
export function paintGridThemeCompact(): Theme {
  return (compact ??= themeQuartz.withParams({ ...paintParams, spacing: 5 }));
}
