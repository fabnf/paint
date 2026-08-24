import { ChangeDetectionStrategy, Component, computed, forwardRef, input } from '@angular/core';
import {
  FieldLabelComponent,
  FieldMessagesComponent,
} from '../../primitives/forms/field-chrome.component';
import { DS_FIELD, type FieldContext } from '../../primitives/forms/field-context';
import { describedBy as joinIds } from '../../primitives/forms/form-control.types';
import { uniqueId } from '../../utils';

/**
 * FormField — the label, the hint, the error, and the control between them.
 *
 * The atoms can each draw their own label and messages. A form of eight fields
 * then repeats the same four inputs eight times, and the day the design changes
 * — an asterisk moves, an error gains an icon — it changes in eight places. This
 * molecule owns that chrome once, and wires it to whatever control is written
 * inside it.
 *
 * The wiring is DI, not DOM: the field publishes a {@link FieldContext}, and the
 * control asks for it (`FormControlBase`, `<ds-select>`, or the
 * `[dsFieldControl]` directive on a native element). Nothing reaches into
 * anything, nothing is queried after render, and a control written outside a
 * field behaves exactly as it did before.
 *
 * **The field owns the id.** Its `<label for>` must point at the control, so the
 * control adopts the field's id. Pass `id` to the field, never to the control.
 *
 * **A checkbox's label goes beside it, not above it.** Use the atom's own
 * `label` for `<ds-checkbox>` and `<ds-switch>`, and a `<ds-radio-group>` or
 * `<ds-checkbox-group>` for a set of them — a `<label for>` above a group would
 * name one control and leave the rest anonymous.
 *
 * @example
 * ```html
 * <ds-form-field label="Email" hint="We only use it to sign you in." [error]="emailError()">
 *   <ds-input type="email" autocomplete="email" [(value)]="email" />
 * </ds-form-field>
 *
 * <!-- Anything that can adopt an id: Paint's controls, or a native one -->
 * <ds-form-field label="Owner" [required]="true">
 *   <ds-select [options]="people" [(value)]="owner" />
 * </ds-form-field>
 *
 * <ds-form-field label="Colour" hint="Hex, or pick one.">
 *   <input dsFieldControl type="color" class="form-control" />
 * </ds-form-field>
 * ```
 */
@Component({
  selector: 'ds-form-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FieldLabelComponent, FieldMessagesComponent],
  providers: [
    {
      provide: DS_FIELD,
      useExisting: forwardRef(() => FormFieldComponent),
    },
  ],
  template: `
    <div class="ds-field">
      @if (label() && !labelHidden()) {
        <ds-field-label
          [labelId]="labelId() || ''"
          [for]="controlId()"
          [text]="label()"
          [required]="required()"
          [disabled]="disabled()"
        >
          @if (optional() && !required()) {
            <!-- "Optional" is cheaper to read than an asterisk is to decode,
                 and it is the minority case that deserves the word. -->
            <span class="ds-field__optional">{{ optionalText() }}</span>
          }
        </ds-field-label>
      } @else if (label()) {
        <!-- Still a real label, still pointing at the control; just not on screen. -->
        <label class="visually-hidden" [attr.id]="labelId()" [attr.for]="controlId()">
          {{ label() }}
        </label>
      }

      <ng-content />

      <ds-field-messages
        [class.ds-field__messages--spaced]="hasMessage()"
        [hint]="hint()"
        [hintId]="hintId()"
        [error]="error()"
        [errorId]="errorId()"
      />
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .ds-field__optional {
      margin-inline-start: var(--ds-space-1_5);
      font-weight: var(--ds-font-weight-regular);
      font-size: var(--ds-font-size-xs);
      color: var(--ds-color-text-subtle);
      letter-spacing: var(--ds-letter-spacing-normal);
    }
  `,
})
export class FormFieldComponent implements FieldContext {
  /** Id of the control. Generated when omitted — and adopted by the control. */
  readonly fieldId = input<string>('', { alias: 'id' });
  /** Visible label, rendered as a real `<label for>`. */
  readonly label = input<string>('');
  /**
   * Keeps the label as the control's accessible name, but takes it off the
   * screen. For a field whose purpose is obvious from a placeholder and a
   * search icon — and for nothing else.
   */
  readonly labelHidden = input(false);
  /** Helper text under the control. Joins `aria-describedby`. */
  readonly hint = input<string>('');
  /** Error text. Implies `invalid`, is announced politely, joins `aria-describedby`. */
  readonly error = input<string>('');
  /** Marks the label, and the control. */
  readonly required = input(false);
  /** Says so in words, because most fields are required and the asterisk is noise. */
  readonly optional = input(false);
  readonly optionalText = input<string>('Optional');
  /** Paints the control invalid without a message. */
  readonly invalidField = input(false, { alias: 'invalid' });
  /** Disables the control inside. */
  readonly disabledField = input(false, { alias: 'disabled' });

  private readonly generatedId = uniqueId('ds-field');

  // —— FieldContext ——

  readonly controlId = computed(() => this.fieldId() || this.generatedId);
  readonly labelId = computed(() => (this.label() ? `${this.controlId()}-label` : null));

  protected readonly hintId = computed(() => `${this.controlId()}-hint`);
  protected readonly errorId = computed(() => `${this.controlId()}-error`);
  protected readonly hasMessage = computed(() => !!this.hint() || !!this.error());

  /** Hint, then error. The control appends whatever it is told by the consumer. */
  readonly describedByIds = computed(() =>
    joinIds(this.hint() ? this.hintId() : null, this.error() ? this.errorId() : null),
  );

  /** A message is a claim of invalidity; the control's `aria-invalid` must agree. */
  readonly invalid = computed(() => this.invalidField() || !!this.error());

  readonly disabled = computed(() => this.disabledField());
}
