import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DS_PRIMITIVES } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Textarea — documentation page.
 */
@Component({
  selector: 'app-textarea-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DOC_UI],
  templateUrl: './textarea.page.html',
  styleUrl: './primitives-page.scss',
})
export class TextareaPage {
  readonly notes = signal('');
  readonly bio = signal('Mixes pigment for a living.');
  readonly grow = signal('Type a few lines — the field follows.');

  readonly basicSnippet = `<ds-textarea
  label="Notes"
  [rows]="4"
  hint="Markdown is supported."
  [(value)]="notes"
/>`;

  readonly autoSnippet = `<!-- 'auto' grows with the content; 'none' and 'vertical' are the handles -->
<ds-textarea label="Comment" resize="auto" [rows]="2" [(value)]="comment" />`;

  readonly countSnippet = `<ds-textarea
  label="Bio"
  [maxLength]="140"
  [showCount]="true"
  hint="Up to 140 characters."
  [(value)]="bio"
/>

<!-- the counter is aria-hidden: the limit is in the hint, announced once,
     instead of interrupting every keystroke -->`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'value', type: 'model<string>', default: `''`, description: 'The text. Two-way bindable and form-bound.' },
    { name: 'rows', type: 'number', default: '3', description: 'Visible lines. The starting height when resize is auto.' },
    { name: 'resize', type: `'none' | 'vertical' | 'auto'`, default: `'vertical'`, description: 'Resize handle, or grow with the content.' },
    { name: 'maxLength', type: 'number | null', default: 'null', description: 'Hard limit enforced by the browser, and the denominator of the counter.' },
    { name: 'showCount', type: 'boolean', default: 'false', description: 'Show the character count. Hidden from assistive tech.' },
    { name: 'label', type: 'string', default: `''`, description: 'Visible label, rendered as a real <label for>.' },
    { name: 'ariaLabel', type: 'string', default: `''`, description: 'Accessible name when there is no visible label.' },
    { name: 'hint', type: 'string', default: `''`, description: 'Helper text under the field. Wired into aria-describedby.' },
    { name: 'error', type: 'string', default: `''`, description: 'Error text. Implies invalid, announced politely.' },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Type size and padding, from Paint’s control scale.' },
    { name: 'placeholder', type: 'string', default: `''`, description: 'An example of the format — never a substitute for a label.' },
    { name: 'readOnly', type: 'boolean', default: 'false', description: 'Focusable and copyable, but not editable.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Sets required on the control and marks the label.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Paints the invalid state without a message.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the control. Forms can disable it too.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'valueInput', type: 'OutputEmitterRef<string>', default: '—', description: 'Emits on every keystroke.' },
    { name: 'changed', type: 'OutputEmitterRef<string>', default: '—', description: 'Emits when the value is committed (blur).' },
    { name: 'valueChange', type: 'OutputEmitterRef<string>', default: '—', description: 'The model output behind [(value)].' },
  ];
}
