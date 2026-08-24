import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DS_PRIMITIVES } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

interface Scope {
  readonly id: string;
  readonly label: string;
  readonly hint: string;
}

/**
 * Checkbox — documentation page.
 */
@Component({
  selector: 'app-checkbox-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DOC_UI],
  templateUrl: './checkbox.page.html',
  styleUrl: './primitives-page.scss',
})
export class CheckboxPage {
  readonly remember = signal(true);
  readonly terms = signal(false);

  readonly scopes: readonly Scope[] = [
    { id: 'read', label: 'Read tokens', hint: 'See every token and theme.' },
    { id: 'write', label: 'Write tokens', hint: 'Change values and publish a theme.' },
    { id: 'admin', label: 'Manage members', hint: 'Invite and remove collaborators.' },
  ];

  readonly granted = signal<readonly string[]>(['read']);

  /** Tri-state parent: checked when all are, mixed when some are. */
  readonly allGranted = computed(() => this.granted().length === this.scopes.length);
  readonly someGranted = computed(() => this.granted().length > 0 && !this.allGranted());

  isGranted(id: string): boolean {
    return this.granted().includes(id);
  }

  toggleScope(id: string, checked: boolean): void {
    this.granted.update((granted) =>
      checked ? [...granted, id] : granted.filter((scope) => scope !== id),
    );
  }

  toggleAll(checked: boolean): void {
    this.granted.set(checked ? this.scopes.map((scope) => scope.id) : []);
  }

  readonly basicSnippet = `<ds-checkbox label="Remember me" [(checked)]="remember" />
<ds-checkbox
  label="I accept the terms"
  hint="You can revoke consent at any time."
  [error]="submitted() && !terms() ? 'You must accept to continue.' : ''"
  [(checked)]="terms"
/>`;

  readonly mixedSnippet = `<!-- indeterminate is native, so it is announced as "mixed" -->
<ds-checkbox
  label="All scopes"
  [checked]="allGranted()"
  [indeterminate]="someGranted()"
  (changed)="toggleAll($event)"
/>

@for (scope of scopes; track scope.id) {
  <ds-checkbox
    [label]="scope.label"
    [hint]="scope.hint"
    [checked]="isGranted(scope.id)"
    (changed)="toggleScope(scope.id, $event)"
  />
}`;

  readonly submitted = signal(false);

  readonly inputs: readonly ApiRow[] = [
    { name: 'checked', type: 'model<boolean>', default: 'false', description: 'Checked state. Two-way bindable and form-bound.' },
    { name: 'indeterminate', type: 'model<boolean>', default: 'false', description: 'Neither on nor off. Native, so it is announced as “mixed”.' },
    { name: 'label', type: 'string', default: `''`, description: 'Visible label. Also accepts projected content.' },
    { name: 'ariaLabel', type: 'string', default: `''`, description: 'Accessible name when there is no visible label.' },
    { name: 'hint', type: 'string', default: `''`, description: 'Helper text under the label. Wired into aria-describedby.' },
    { name: 'error', type: 'string', default: `''`, description: 'Error text. Implies invalid, announced politely.' },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Indicator size, from Paint’s control scale.' },
    { name: 'value', type: 'string | null', default: 'null', description: 'value of the native control, for native form submission.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Sets required on the control and marks the label.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Paints the invalid state without a message.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the control. Forms can disable it too.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'changed', type: 'OutputEmitterRef<boolean>', default: '—', description: 'Emits on user interaction only — never when a form writes the value in.' },
    { name: 'checkedChange', type: 'OutputEmitterRef<boolean>', default: '—', description: 'The model output behind [(checked)].' },
  ];
}
