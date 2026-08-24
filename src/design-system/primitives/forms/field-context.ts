import { InjectionToken, type Signal } from '@angular/core';

/**
 * The contract between a field and the control inside it.
 *
 * It lives in the atom layer on purpose. The control must not import the
 * molecule that wraps it — it only knows that *something above it might be a
 * field*, and asks, through DI, for the four things a field owns: the id its
 * label points at, the ids of the text describing it, and whether the field has
 * declared the whole thing required, invalid or disabled.
 *
 * Everything is a `Signal`, so a control folds the field's state into its own
 * `computed`s and re-renders when either side changes.
 *
 * Implemented by `<ds-form-field>`. Consumed by `FormControlBase` (and therefore
 * by Input, Textarea, Checkbox, Radio and Switch), by `<ds-select>` and by the
 * `[dsFieldControl]` directive for native controls.
 */
export interface FieldContext {
  /** Id the field's `<label for>` points at. The control must adopt it. */
  readonly controlId: Signal<string>;
  /** Id of the field's `<label>` element, for controls named by `aria-labelledby`. */
  readonly labelId: Signal<string | null>;
  /** Hint and error ids, in reading order, or `null` when the field is silent. */
  readonly describedByIds: Signal<string | null>;
  readonly invalid: Signal<boolean>;
  readonly required: Signal<boolean>;
  readonly disabled: Signal<boolean>;
}

/**
 * Present only inside a `<ds-form-field>`. Always inject it `{ optional: true }`:
 * every Paint control has to keep working on its own.
 */
export const DS_FIELD = new InjectionToken<FieldContext>('DS_FIELD');
