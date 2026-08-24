import { Directive } from '@angular/core';

/**
 * Marks toolbar content for {@link DataTableComponent}.
 *
 * The table shows its toolbar when it has a caption, when selection is on, or
 * when this slot is filled.
 *
 * @example
 * ```html
 * <ds-flex dsTableActions [gap]="2">
 *   <ds-button variant="secondary" size="sm" iconStart="search" label="Search" />
 *   <ds-menu label="Export" [entries]="exportEntries" />
 * </ds-flex>
 * ```
 */
@Directive({
  selector: '[dsTableActions]',
  standalone: true,
})
export class DataTableActionsDirective {}

/** Marks the footer slot — pagination, totals, a "load more" button. */
@Directive({
  selector: '[dsTableFooter]',
  standalone: true,
})
export class DataTableFooterDirective {}

/** Marks the action inside the empty state. */
@Directive({
  selector: '[dsTableEmptyAction]',
  standalone: true,
})
export class DataTableEmptyActionDirective {}