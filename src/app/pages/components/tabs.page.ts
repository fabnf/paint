import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DS_COMPONENTS, DS_PRIMITIVES } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Tabs — documentation page.
 */
@Component({
  selector: 'app-tabs-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI],
  templateUrl: './tabs.page.html',
  styleUrl: './components-page.scss',
})
export class TabsPage {
  /** Two-way bound demo. */
  readonly active = signal<string | null>('palette');

  readonly basicSnippet = `<ds-tabs>
  <ds-tab label="Overview">…panel…</ds-tab>
  <ds-tab label="Activity" [badge]="12">…panel…</ds-tab>
  <ds-tab label="Archive" [disabled]="true">…panel…</ds-tab>
</ds-tabs>`;

  readonly variantSnippet = `<ds-tabs variant="underline">…</ds-tabs>
<ds-tabs variant="pills">…</ds-tabs>
<ds-tabs variant="segmented">…</ds-tabs>`;

  readonly controlledSnippet = `<ds-tabs [(selected)]="tab">
  <ds-tab tabId="palette" label="Palette" icon="palette">…</ds-tab>
  <ds-tab tabId="type" label="Type" icon="type">…</ds-tab>
</ds-tabs>

<!-- tab() is 'palette' | 'type' — the ids you chose, not an index -->`;

  readonly lazySnippet = `<!-- ds-tab holds its content in a template: only the
     selected panel is ever built, and it is torn down on switch -->
<ds-tabs>
  <ds-tab label="Cheap">Rendered now</ds-tab>
  <ds-tab label="Expensive">
    <app-huge-chart />  <!-- not instantiated until selected -->
  </ds-tab>
</ds-tabs>`;

  readonly iconSnippet = `<ds-tabs align="fitted">
  <ds-tab label="Inbox" icon="bell" [badge]="3">…</ds-tab>
  <ds-tab label="Drafts" icon="edit">…</ds-tab>
</ds-tabs>`;

  readonly tabsApi: readonly ApiRow[] = [
    {
      name: 'variant',
      type: `'underline' | 'pills' | 'segmented'`,
      default: `'underline'`,
      description: 'Visual flavour. Underline for page-level, segmented for toolbars.',
    },
    {
      name: 'align',
      type: `'start' | 'center' | 'end' | 'fitted'`,
      default: `'start'`,
      description: 'Distribution of the tab list. `fitted` stretches tabs to fill the row.',
    },
    { name: 'label', type: 'string', default: `''`, description: 'Accessible name for the tab list.' },
    {
      name: 'selected',
      type: 'model<string | null>',
      default: 'null',
      description: 'Selected tab id. Two-way bindable; falls back to the first enabled tab.',
    },
  ];

  readonly tabsOutputs: readonly ApiRow[] = [
    {
      name: 'selectedChanged',
      type: 'OutputEmitterRef<string>',
      default: '—',
      description: 'Emits the newly selected tab id on user interaction.',
    },
  ];

  readonly tabApi: readonly ApiRow[] = [
    { name: 'label', type: 'string', default: '—', description: 'Required. Visible label, and the default id.' },
    { name: 'tabId', type: 'string', default: `''`, description: 'Stable id for [selected] and deep links.' },
    { name: 'icon', type: 'IconName | null', default: 'null', description: 'Leading icon.' },
    { name: 'badge', type: 'string | number | null', default: 'null', description: 'Trailing count. `0` renders; `null` hides.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Skipped by pointer and keyboard alike.' },
  ];
}
