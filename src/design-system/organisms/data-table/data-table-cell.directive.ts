import { Directive, TemplateRef, inject, input } from '@angular/core';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Context handed to a `[dsCell]` template. */
export interface DataTableCellContext<T = any> {
  /** The row — `let-row` or the implicit `let-row`. */
  $implicit: T;
  row: T;
  /** The raw value at the column's key. */
  value: unknown;
  /** Row index in the rendered (sorted) order. */
  index: number;
}

/**
 * Marks a template as the renderer for one DataTable column.
 *
 * Without it, cells render as text. With it, a column can hold anything Paint
 * can draw — badges, avatars, a Menu.
 *
 * @example
 * ```html
 * <ds-data-table [columns]="columns" [rows]="rows">
 *   <ng-template dsCell="status" let-row>
 *     <ds-text variant="label" [tone]="row.status === 'paid' ? 'success' : 'warning'">
 *       {{ row.status }}
 *     </ds-text>
 *   </ng-template>
 *
 *   <!-- Bind [dsCellRows] to infer the row type: `row` is fully typed -->
 *   <ng-template dsCell="amount" [dsCellRows]="invoices" let-row let-value="value">
 *     <ds-text variant="code">{{ row.currency }} {{ value }}</ds-text>
 *   </ng-template>
 * </ds-data-table>
 * ```
 */
@Directive({
  selector: '[dsCell]',
  standalone: true,
})
export class DataTableCellDirective<T = any> {
  /** Column key this template renders. */
  readonly dsCell = input.required<string>();

  /**
   * Type-inference helper. Bind the same array you passed to `[rows]` and
   * `let-row` becomes typed; omit it and the row is `any`.
   */
  readonly dsCellRows = input<readonly T[] | null>(null);

  readonly template = inject<TemplateRef<DataTableCellContext<T>>>(TemplateRef);

  /** Gives the template strict typing for `let-row`. */
  static ngTemplateContextGuard<T>(
    _directive: DataTableCellDirective<T>,
    _context: unknown,
  ): _context is DataTableCellContext<T> {
    return true;
  }
}
