import { Directive } from '@angular/core';

/**
 * Marks trailing toolbar content on a {@link FilterBarComponent} — a view
 * toggle, a density switch, an export menu: the things that live at the end
 * of a filter row without being filters.
 *
 * @example
 * ```html
 * <ds-filter-bar [filters]="filters" [(state)]="state">
 *   <ds-flex dsFilterBarActions [gap]="2">
 *     <ds-menu label="Export" size="sm" [entries]="exportEntries" />
 *   </ds-flex>
 * </ds-filter-bar>
 * ```
 */
@Directive({
  selector: '[dsFilterBarActions]',
  standalone: true,
})
export class FilterBarActionsDirective {}
