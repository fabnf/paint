import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Internal chrome shared by the form atoms: the label above a control, and the
 * hint / error line below it.
 *
 * Not exported from the design system. These are not components consumers
 * compose with — they are the two halves of a field that Input, Textarea,
 * Checkbox, Radio and Switch must render *identically*, down to the id wiring.
 * When the `Field` molecule lands, it will render the same markup.
 */

/**
 * The `<label>` of a text control, with the required marker.
 *
 * The asterisk is decorative: `required` on the native control is what assistive
 * technology reports, and "Email *" is not a field name.
 */
@Component({
  selector: 'ds-field-label',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label
      class="form-label ds-field__label"
      [attr.id]="labelId() || null"
      [attr.for]="for()"
      [class.ds-field__label--disabled]="disabled()"
    >
      {{ text() }}
      @if (required()) {
        <span class="ds-field__required" aria-hidden="true">*</span>
      }
      <!-- Slot for the one thing a label may carry besides its text: the word
           "Optional", from the field that owns it. -->
      <ng-content />
    </label>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class FieldLabelComponent {
  /** Id of the control this label names. */
  readonly for = input<string>('');
  /** Id of the label itself, for controls named by `aria-labelledby`. */
  readonly labelId = input<string>('');
  readonly text = input<string>('');
  readonly required = input(false);
  readonly disabled = input(false);
}

/**
 * The hint and error line under a control.
 *
 * The hint stays when an error appears: it explains the format, the error
 * explains this attempt, and dropping one to show the other loses the advice
 * precisely when it is needed.
 *
 * The live region is rendered whether or not there is an error: a region
 * inserted *with* its text is frequently never announced, because there was
 * nothing to observe when the text arrived.
 */
@Component({
  selector: 'ds-field-messages',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (hint()) {
      <p class="form-text ds-field__hint" [id]="hintId()">{{ hint() }}</p>
    }

    <div class="ds-field__live" aria-live="polite">
      @if (error()) {
        <p class="ds-field__error" [id]="errorId()">
          <span class="visually-hidden">Error:</span>
          {{ error() }}
        </p>
      }
    </div>
  `,
  styles: `
    /*
     * Always rendered, and never display:none — a region that is not in the
     * accessibility tree when the text arrives is a region nobody hears. With no
     * hint and no error it is simply an empty, zero-height block.
     */
    :host {
      display: block;
    }
  `,
})
export class FieldMessagesComponent {
  readonly hint = input<string>('');
  readonly hintId = input<string>('');
  readonly error = input<string>('');
  readonly errorId = input<string>('');
}
