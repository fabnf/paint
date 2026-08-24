import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DS_PRIMITIVES, type RadioValue } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

interface Plan {
  readonly id: string;
  readonly label: string;
  readonly hint: string;
}

/**
 * Radio — documentation page.
 */
@Component({
  selector: 'app-radio-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DOC_UI, ReactiveFormsModule],
  templateUrl: './radio.page.html',
  styleUrl: './primitives-page.scss',
})
export class RadioPage {
  readonly target = signal<RadioValue | null>('staging');
  readonly plan = signal<RadioValue | null>('pro');

  readonly plans: readonly Plan[] = [
    { id: 'free', label: 'Free', hint: 'One theme, community support.' },
    { id: 'pro', label: 'Pro', hint: 'Unlimited themes and brand tokens.' },
    { id: 'studio', label: 'Studio', hint: 'Everything, plus shared libraries.' },
  ];

  readonly deliveryControl = new FormControl<string | null>('standard');

  readonly groupSnippet = `<!-- A pile of radios is not a question: the group gets a name of its own -->
<fieldset>
  <legend>Deploy target</legend>

  <ds-radio name="target" value="staging" label="Staging" [(groupValue)]="target" />
  <ds-radio
    name="target"
    value="prod"
    label="Production"
    hint="Visible to customers immediately."
    [(groupValue)]="target"
  />
  <ds-radio name="target" value="archive" label="Archive" [disabled]="true" [(groupValue)]="target" />
</fieldset>`;

  readonly formsSnippet = `// Every radio in the group binds the same control — writeValue
// checks the one whose value matches
readonly deliveryControl = new FormControl<string | null>('standard');

// template
<ds-radio name="delivery" value="standard" label="Standard" [formControl]="deliveryControl" />
<ds-radio name="delivery" value="express" label="Express" [formControl]="deliveryControl" />`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'value', type: 'RadioValue', default: '—', description: 'Required. What this radio stands for, reported when it is selected.' },
    { name: 'groupValue', type: 'model<RadioValue | null>', default: 'null', description: 'The value selected across the group. Shared by every radio with the same name.' },
    { name: 'name', type: 'string', default: `''`, description: 'The group. Radios that share one are a group in the browser — which is where the arrow keys come from.' },
    { name: 'label', type: 'string', default: `''`, description: 'Visible label. Also accepts projected content.' },
    { name: 'ariaLabel', type: 'string', default: `''`, description: 'Accessible name when there is no visible label.' },
    { name: 'hint', type: 'string', default: `''`, description: 'Helper text under the label. Wired into aria-describedby.' },
    { name: 'error', type: 'string', default: `''`, description: 'Error text. Implies invalid, announced politely.' },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Indicator size, from Paint’s control scale.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Sets required on the control.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Paints the invalid state without a message.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables this radio, not the group.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'selected', type: 'OutputEmitterRef<RadioValue>', default: '—', description: 'Emits this radio’s value when the user selects it.' },
    { name: 'groupValueChange', type: 'OutputEmitterRef<RadioValue | null>', default: '—', description: 'The model output behind [(groupValue)].' },
  ];
}
