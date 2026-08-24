import { Directive } from '@angular/core';

/**
 * Marks toolbar content for {@link DataGridComponent} — the same slot, and the
 * same showing rules, as the DataTable's `[dsTableActions]`.
 *
 * @example
 * ```html
 * <ds-flex dsGridActions [gap]="2">
 *   <ds-search-field label="Search rows" [labelHidden]="true" />
 *   <ds-menu label="Export" [entries]="exportEntries" />
 * </ds-flex>
 * ```
 */
@Directive({
  selector: '[dsGridActions]',
  standalone: true,
})
export class DataGridActionsDirective {}

/** Marks the footer slot — pagination, totals, a "load more" button. */
@Directive({
  selector: '[dsGridFooter]',
  standalone: true,
})
export class DataGridFooterDirective {}

/** Marks the action inside the empty state. */
@Directive({
  selector: '[dsGridEmptyAction]',
  standalone: true,
})
export class DataGridEmptyActionDirective {}
