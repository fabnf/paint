import type { IconName } from '../../icons';

/** The value a Select option carries. */
export type SelectValue = string | number;

/** One option in a {@link SelectComponent}. */
export interface SelectOption {
  value: SelectValue;
  label: string;
  /** Optional leading icon. */
  icon?: IconName;
  /** Second line, for options that need a hint. */
  description?: string;
  disabled?: boolean;
  /** Options sharing a group render under one sticky header. */
  group?: string;
}

/** Flattened render model: headers and options in one list. */
export interface SelectRow {
  kind: 'group' | 'option';
  label: string;
  option?: SelectOption;
  /** Index into the filtered option list, for roving focus. */
  optionIndex?: number;
}

/**
 * Builds the render rows for a list of options.
 *
 * Ungrouped options keep their order at the top; grouped options gather under a
 * single header, in the order their group first appears. Options are never
 * re-sorted within a group, and `optionIndex` follows the rendered order so
 * keyboard navigation matches what the eye sees.
 */
export function toSelectRows(options: readonly SelectOption[]): SelectRow[] {
  const ungrouped = options.filter((option) => !option.group);
  const groupNames: string[] = [];

  for (const option of options) {
    if (option.group && !groupNames.includes(option.group)) {
      groupNames.push(option.group);
    }
  }

  const rows: SelectRow[] = [];
  let optionIndex = 0;

  const pushOption = (option: SelectOption) => {
    rows.push({ kind: 'option', label: option.label, option, optionIndex: optionIndex++ });
  };

  ungrouped.forEach(pushOption);

  for (const group of groupNames) {
    rows.push({ kind: 'group', label: group });
    options.filter((option) => option.group === group).forEach(pushOption);
  }

  return rows;
}
