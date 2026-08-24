/** The value a choice carries. Ids, never indexes: a list can be reordered. */
export type ChoiceValue = string | number | boolean;

/** One option in a `<ds-radio-group>` or a `<ds-checkbox-group>`. */
export interface ChoiceOption<T extends ChoiceValue = ChoiceValue> {
  value: T;
  label: string;
  /** Second line, under the label. Wired into the control's `aria-describedby`. */
  hint?: string;
  disabled?: boolean;
}

/** Side by side, or one per line. Vertical unless the options are one word each. */
export type ChoiceOrientation = 'vertical' | 'horizontal';
