import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { DS_COMPONENTS, DS_PRIMITIVES, type ChoiceOption } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * RadioGroup & CheckboxGroup — documentation page.
 */
@Component({
  selector: 'app-choice-group-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI, ReactiveFormsModule],
  templateUrl: './choice-group.page.html',
  styleUrl: './components-page.scss',
})
export class ChoiceGroupPage {
  readonly targets: readonly ChoiceOption<string>[] = [
    { value: 'staging', label: 'Staging', hint: 'Rebuilt on every merge.' },
    { value: 'prod', label: 'Production', hint: 'Visible to customers immediately.' },
    { value: 'archive', label: 'Archive', hint: 'Frozen. Ask an owner to unfreeze it.', disabled: true },
  ];

  readonly sizes: readonly ChoiceOption<string>[] = [
    { value: 'sm', label: 'Small' },
    { value: 'md', label: 'Medium' },
    { value: 'lg', label: 'Large' },
  ];

  readonly scopes: readonly ChoiceOption<string>[] = [
    { value: 'read', label: 'Read tokens', hint: 'See every token and theme.' },
    { value: 'write', label: 'Write tokens', hint: 'Change values and publish a theme.' },
    { value: 'members', label: 'Manage members', hint: 'Invite and remove collaborators.' },
    { value: 'owner', label: 'Transfer ownership', hint: 'Only an owner can grant this.', disabled: true },
  ];

  readonly target = signal<string | null>('staging');
  readonly size = signal<string | null>('md');
  readonly granted = signal<readonly string[]>(['read']);

  /** Reactive forms: a required group is invalid until something is picked. */
  readonly planControl = new FormControl<string | null>(null, Validators.required);
  readonly submitted = signal(false);

  readonly plans: readonly ChoiceOption<string>[] = [
    { value: 'free', label: 'Free', hint: 'One theme, community support.' },
    { value: 'pro', label: 'Pro', hint: 'Unlimited themes and brand tokens.' },
    { value: 'studio', label: 'Studio', hint: 'Everything, plus shared libraries.' },
  ];

  planError(): string {
    const control = this.planControl;
    return (control.touched || this.submitted()) && control.invalid ? 'Pick a plan.' : '';
  }

  submit(): void {
    this.submitted.set(true);
    this.planControl.markAsTouched();
  }

  readonly radioSnippet = `<ds-radio-group
  legend="Deploy target"
  hint="Production is visible to customers immediately."
  [options]="targets"
  [(value)]="target"
/>

<!-- Renders a <fieldset role="radiogroup"> with a <legend>, one shared name,
     and the browser's own arrow-key pattern. -->`;

  readonly checkboxSnippet = `<ds-checkbox-group
  legend="Scopes"
  hint="You can change these later."
  [options]="scopes"
  [selectAll]="true"
  [(value)]="granted"
/>

<!-- granted() is string[], in the options' own order -->`;

  readonly formsSnippet = `readonly planControl = new FormControl<string | null>(null, Validators.required);

<ds-radio-group
  legend="Plan"
  [options]="plans"
  [formControl]="planControl"
  [required]="true"
  [error]="planError()"
/>`;

  readonly radioInputs: readonly ApiRow[] = [
    { name: 'options', type: 'readonly ChoiceOption[]', default: '—', description: 'Required. Value, label, optional hint, optional disabled.' },
    { name: 'value', type: 'model<T | null>', default: 'null', description: 'The selected value. Two-way bindable and form-bound.' },
    { name: 'legend', type: 'string', default: `''`, description: 'The question. Rendered as the <legend> that names the group.' },
    { name: 'legendHidden', type: 'boolean', default: 'false', description: 'Keeps the name, loses the visible legend.' },
    { name: 'ariaLabel', type: 'string', default: `''`, description: 'Accessible name when there is no legend at all.' },
    { name: 'hint / error', type: 'string', default: `''`, description: 'Describe the group. The error also marks every radio invalid.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'aria-required on the group, required on every radio.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the <fieldset>, and with it every radio.' },
    { name: 'orientation', type: `'vertical' | 'horizontal'`, default: `'vertical'`, description: 'One per line, or side by side.' },
    { name: 'name', type: 'string', default: 'generated', description: 'The shared name. It is what hands the arrow keys to the browser.' },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Indicator size.' },
  ];

  readonly checkboxInputs: readonly ApiRow[] = [
    { name: 'options', type: 'readonly ChoiceOption[]', default: '—', description: 'Required. Value, label, optional hint, optional disabled.' },
    { name: 'value', type: 'model<readonly T[]>', default: '[]', description: 'The selected values, in the options’ own order.' },
    { name: 'selectAll', type: 'boolean', default: 'false', description: 'A tri-state master above the options.' },
    { name: 'selectAllLabel', type: 'string', default: `'Select all'`, description: 'What the master is called.' },
    { name: 'legend / legendHidden / ariaLabel', type: 'string | boolean', default: `''`, description: 'The question, and how it is exposed.' },
    { name: 'hint / error', type: 'string', default: `''`, description: 'Describe the group.' },
    { name: 'required / disabled', type: 'boolean', default: 'false', description: 'As above. Disabled goes on the <fieldset>.' },
    { name: 'orientation', type: `'vertical' | 'horizontal'`, default: `'vertical'`, description: 'One per line, or side by side.' },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Indicator size.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'changed', type: 'OutputEmitterRef<T | readonly T[]>', default: '—', description: 'Emits on user interaction only — never when a form writes the value in.' },
    { name: 'valueChange', type: 'OutputEmitterRef<…>', default: '—', description: 'The model output behind [(value)].' },
  ];
}
