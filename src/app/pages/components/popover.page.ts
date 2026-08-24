import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DS_COMPONENTS, DS_PRIMITIVES, type SelectOption } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Popover — documentation page.
 */
@Component({
  selector: 'app-popover-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI],
  templateUrl: './popover.page.html',
  styleUrl: './components-page.scss',
})
export class PopoverPage {
  readonly statuses: readonly SelectOption[] = [
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
  ];

  readonly status = signal<string | null>(null);
  readonly overdueOnly = signal(false);
  readonly applied = signal('');

  apply(): void {
    const status = this.status() ?? 'any status';
    this.applied.set(`Showing ${status}${this.overdueOnly() ? ', overdue only' : ''}.`);
  }

  readonly basicSnippet = `<ds-popover label="Filters" icon="filter" title="Filter invoices" [dismissible]="true">
  <ds-stack [gap]="3">
    <ds-form-field label="Status">
      <ds-select [options]="statuses" [(value)]="status" placeholder="Any status" />
    </ds-form-field>
    <ds-switch label="Overdue only" [(checked)]="overdueOnly" />
    <ds-button size="sm" (clicked)="apply()">Apply</ds-button>
  </ds-stack>
</ds-popover>`;

  readonly autofocusSnippet = `<!-- Default: focus lands on the panel, so its name is announced first. -->
<ds-popover label="Legend" title="What the colours mean">…</ds-popover>

<!-- A popover that exists to be typed into can say so. -->
<ds-popover label="Rename" icon="edit">
  <ds-input label="Project name" dsPopoverAutofocus />
</ds-popover>`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'label', type: 'string', default: `'Open'`, description: 'Trigger label. Doubles as the panel’s accessible name when there is no title.' },
    { name: 'title', type: 'string', default: `''`, description: 'Heading rendered inside the panel, and its accessible name.' },
    { name: 'icon', type: 'IconName | null', default: 'null', description: 'Trigger icon.' },
    { name: 'iconOnly', type: 'boolean', default: 'false', description: 'Icon-only trigger; label becomes the accessible name.' },
    { name: 'caret', type: 'boolean', default: 'false', description: 'Show the chevron on the trigger.' },
    { name: 'variant / size', type: 'ButtonVariant / ButtonSize', default: `'secondary' / 'md'`, description: 'Forwarded to the trigger Button.' },
    { name: 'align', type: `'start' | 'end'`, default: `'start'`, description: 'Which edge of the trigger the panel lines up with.' },
    { name: 'width', type: 'number', default: '320', description: 'Panel width in px.' },
    { name: 'dismissible', type: 'boolean', default: 'false', description: 'A named close button in the header. Escape and outside clicks always work.' },
    { name: 'closeLabel', type: 'string', default: `'Close'`, description: 'The close button’s accessible name.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the trigger.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'openChange', type: 'OutputEmitterRef<boolean>', default: '—', description: 'Emits on every open and close.' },
  ];

  readonly slots: readonly ApiRow[] = [
    { name: '(default)', type: 'content', default: '—', description: 'The panel body. Anything goes: forms, buttons, text.' },
    { name: '[dsPopoverAutofocus]', type: 'attribute', default: '—', description: 'Marks the element that takes focus on open, instead of the panel.' },
  ];
}
