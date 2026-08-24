import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { DS_COMPONENTS, DS_PRIMITIVES, type SelectOption } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Select — documentation page.
 */
@Component({
  selector: 'app-select-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI, ReactiveFormsModule],
  templateUrl: './select.page.html',
  styleUrl: './components-page.scss',
})
export class SelectPage {
  readonly people: readonly SelectOption[] = [
    { value: 'ada', label: 'Ada Lovelace', icon: 'user', description: 'Owner', group: 'Engineering' },
    { value: 'grace', label: 'Grace Hopper', icon: 'user', group: 'Engineering' },
    { value: 'alan', label: 'Alan Turing', icon: 'user', group: 'Engineering' },
    { value: 'katherine', label: 'Katherine Johnson', icon: 'user', group: 'Research' },
    { value: 'mary', label: 'Mary Jackson', icon: 'user', group: 'Research' },
    { value: 'vacant', label: 'Unassigned', disabled: true },
  ];

  readonly labels: readonly SelectOption[] = [
    { value: 'brand', label: 'Brand', icon: 'palette' },
    { value: 'a11y', label: 'Accessibility', icon: 'success' },
    { value: 'perf', label: 'Performance', icon: 'zap' },
    { value: 'docs', label: 'Documentation', icon: 'book' },
    { value: 'tokens', label: 'Tokens', icon: 'ruler' },
    { value: 'bug', label: 'Bug', icon: 'warning' },
    { value: 'frozen', label: 'Frozen', icon: 'minus', disabled: true },
  ];

  readonly sizes: readonly SelectOption[] = [
    { value: 'sm', label: 'Small' },
    { value: 'md', label: 'Medium' },
    { value: 'lg', label: 'Large' },
  ];

  readonly owner = signal<string | null>('ada');
  readonly tags = signal<string[]>(['brand', 'tokens']);
  readonly searchable = signal<string[]>([]);
  readonly size = signal<string | null>('md');
  readonly empty = signal<string | null>(null);

  /** Reactive forms demo. */
  readonly ownerControl = new FormControl<string | null>(null, Validators.required);
  readonly disabledControl = new FormControl<string | null>('grace');

  constructor() {
    this.disabledControl.disable();
  }

  readonly singleSnippet = `<ds-form-field label="Owner" hint="Who signs this off.">
  <ds-select [options]="people" [(value)]="owner" [clearable]="true" placeholder="Assign owner" />
</ds-form-field>`;

  readonly multipleSnippet = `<!-- One input flips the whole control: chips, checkboxes, array value -->
<ds-select
  [options]="labels"
  [(value)]="tags"
  [multiple]="true"
  [clearable]="true"
  placeholder="Add labels"
/>

<!-- tags() is string[] — ['brand', 'tokens'] -->`;

  readonly searchSnippet = `<ds-select
  [options]="labels"
  [(value)]="selected"
  [multiple]="true"
  [searchable]="true"
  searchPlaceholder="Filter labels…"
  emptyText="No labels match"
/>`;

  readonly formsSnippet = `// Select is a ControlValueAccessor: no wrapper, no bridge
readonly ownerControl = new FormControl<string | null>(null, Validators.required);

// template
<ds-select
  [options]="people"
  [formControl]="ownerControl"
  [invalid]="ownerControl.invalid && ownerControl.touched"
  placeholder="Assign owner"
/>`;

  readonly groupSnippet = `readonly people: SelectOption[] = [
  { value: 'ada', label: 'Ada Lovelace', icon: 'user', description: 'Owner', group: 'Engineering' },
  { value: 'grace', label: 'Grace Hopper', icon: 'user', group: 'Engineering' },
  { value: 'katherine', label: 'Katherine Johnson', icon: 'user', group: 'Research' },
  { value: 'vacant', label: 'Unassigned', disabled: true },
];`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'options', type: 'readonly SelectOption[]', default: '—', description: 'Required. Values, labels, icons, descriptions, groups.' },
    {
      name: 'value',
      type: 'model<SelectValue | SelectValue[] | null>',
      default: 'null',
      description: 'Selected value(s). Array when multiple. Two-way bindable and form-bound.',
    },
    { name: 'multiple', type: 'boolean', default: 'false', description: 'Multi-select: chips in the trigger, checkboxes in the list.' },
    { name: 'searchable', type: 'boolean', default: 'false', description: 'Shows the filter field inside the panel.' },
    { name: 'clearable', type: 'boolean', default: 'false', description: 'Offers a clear affordance once something is selected.' },
    { name: 'placeholder', type: 'string', default: `'Select…'`, description: 'Empty-state text in the trigger.' },
    { name: 'searchPlaceholder', type: 'string', default: `'Filter…'`, description: 'Placeholder for the filter field.' },
    { name: 'emptyText', type: 'string', default: `'No matches'`, description: 'Shown when the filter matches nothing.' },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Control height.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the control. Forms can disable it too.' },
    {
      name: 'label',
      type: 'string',
      default: `''`,
      description: 'Accessible name, rendered visually hidden. The control is named by this *and* its value.',
    },
    {
      name: 'labelledBy',
      type: 'string',
      default: `''`,
      description: 'Id of a visible label element. Preferred over `label` when one already exists.',
    },
    { name: 'describedBy', type: 'string', default: `''`, description: 'Id of the hint or error text describing the field.' },
    {
      name: 'searchLabel',
      type: 'string',
      default: 'from searchPlaceholder',
      description: 'Accessible name for the filter field — a placeholder is not a label.',
    },
    { name: 'clearLabel', type: 'string', default: `'Clear selection'`, description: 'Accessible name for the clear button.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Paints the danger border and sets aria-invalid.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Sets aria-required.' },
    {
      name: 'closeOnSelect',
      type: 'boolean | null',
      default: 'null',
      description: 'Defaults to closing for single and staying open for multiple.',
    },
  ];

  readonly outputs: readonly ApiRow[] = [
    {
      name: 'selectionChange',
      type: 'OutputEmitterRef<SelectValue | SelectValue[] | null>',
      default: '—',
      description: 'Emits on user-driven changes only — never on writeValue.',
    },
    { name: 'openChange', type: 'OutputEmitterRef<boolean>', default: '—', description: 'Emits on every open and close.' },
  ];
}
