/**
 * Shared contracts for Paint's form-control atoms.
 *
 * Input, Textarea, Checkbox, Radio and Switch are five different controls with
 * one story: the same size scale, the same labelling model, the same way of
 * saying "this is wrong and here is why". That story lives here so it cannot
 * drift, and so a `Field` molecule can later be built on top of it without
 * re-deciding anything.
 */

import type { ControlSizeToken } from '../../tokens/spacing.tokens';

/**
 * Control height, from Paint's one control scale
 * (`tokens/spacing.tokens.ts` → `controlSizes`). Shared with `ds-button`, so a
 * row of mixed controls lines up.
 */
export type ControlSize = ControlSizeToken;

/** size → Bootstrap `.form-control` size class. `md` is the unsuffixed default. */
const FORM_CONTROL_SIZE_CLASS: Record<ControlSize, string> = {
  sm: 'form-control-sm',
  md: '',
  lg: 'form-control-lg',
};

export function formControlSizeClass(size: ControlSize): string {
  return FORM_CONTROL_SIZE_CLASS[size];
}

/** The `<ds-icon>` size that sits comfortably inside a control of this height. */
const CONTROL_ICON_SIZE: Record<ControlSize, 'xs' | 'sm' | 'md'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
};

export function controlIconSize(size: ControlSize): 'xs' | 'sm' | 'md' {
  return CONTROL_ICON_SIZE[size];
}

/**
 * Joins the ids a control is described by, in reading order, and returns `null`
 * rather than an empty string — `aria-describedby=""` is a real attribute that
 * points at nothing.
 */
export function describedBy(...ids: Array<string | false | null | undefined>): string | null {
  const present = ids.filter((id): id is string => !!id);
  return present.length ? present.join(' ') : null;
}

/**
 * The text kinds of `<input>` Paint's text atom accepts.
 *
 * Deliberately not the full HTML list: `checkbox`, `radio` and `file` are
 * different controls with different semantics — `type` is not a styling knob.
 * `date`/`color` render OS widgets Paint cannot theme, so they stay out until
 * there is a component that owns them.
 */
export type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'search'
  | 'tel'
  | 'url'
  | 'number';
