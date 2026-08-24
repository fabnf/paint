import { ChangeDetectionStrategy, Component, TemplateRef, input, viewChild } from '@angular/core';
import type { IconName } from '../../icons';
import { uniqueId } from '../../utils';

/**
 * Tab — one panel inside {@link TabsComponent}.
 *
 * Declares the tab's label and holds its content in a template, so the panel is
 * only built when the tab is selected (and torn down when it is not).
 *
 * @example
 * ```html
 * <ds-tab label="Overview" icon="home">…panel…</ds-tab>
 * ```
 */
@Component({
  selector: 'ds-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The content lives in a template; TabsComponent stamps it into the panel.
  template: `<ng-template><ng-content /></ng-template>`,
})
export class TabComponent {
  /** Visible label. Keep it to one or two words. */
  readonly label = input.required<string>();
  /** Stable id, used for `[selected]` and deep links. Defaults to the label. */
  readonly tabId = input<string>('');
  /** Optional leading icon. */
  readonly icon = input<IconName | null>(null);
  /** Optional trailing count. `0` still renders — pass `null` to hide. */
  readonly badge = input<string | number | null>(null);
  /**
   * How the badge is spoken, e.g. `'12 unread'`.
   *
   * The badge itself is hidden from assistive tech: sitting flush against the
   * label it would be read as "Activity12". Defaults to "<badge> items".
   */
  readonly badgeLabel = input<string>('');
  readonly disabled = input(false);

  /** Panel content, stamped by the parent. */
  readonly content = viewChild.required(TemplateRef);

  /** Internal fallback id, so ARIA wiring works without a `tabId`. */
  readonly uid = uniqueId('ds-tab');

  get resolvedId(): string {
    return this.tabId() || this.label();
  }
}
