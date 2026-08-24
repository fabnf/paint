import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  forwardRef,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { FieldLabelComponent, FieldMessagesComponent } from '../forms/field-chrome.component';
import { FormControlBase } from '../forms/form-control.base';
import { formControlSizeClass } from '../forms/form-control.types';
import { cx } from '../primitives.types';

/** How a textarea may be resized. `auto` grows with the content. */
export type TextareaResize = 'none' | 'vertical' | 'auto';

/**
 * Textarea — the multi-line text atom.
 *
 * Input's longer sibling: the same label, hint, error and size contract, over a
 * real `<textarea class="form-control">`. Adds the two things multi-line entry
 * actually needs — growing with its content, and a character count that does not
 * shout it into a screen reader on every keystroke.
 *
 * @example
 * ```html
 * <ds-textarea label="Notes" [(value)]="notes" [rows]="4" />
 * <ds-textarea label="Bio" resize="auto" [maxLength]="280" [showCount]="true" [(value)]="bio" />
 * <ds-textarea label="Summary" formControlName="summary" [error]="summaryError()" />
 * ```
 */
@Component({
  selector: 'ds-textarea',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FieldLabelComponent, FieldMessagesComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true,
    },
  ],
  template: `
    <div class="ds-field">
      @if (label()) {
        <ds-field-label
          [for]="controlId()"
          [text]="label()"
          [required]="isRequired()"
          [disabled]="isDisabled()"
        />
      }

      <textarea
        #control
        [class]="classes()"
        [id]="controlId()"
        [attr.name]="name() || null"
        [value]="value()"
        [rows]="rows()"
        [disabled]="isDisabled()"
        [readOnly]="readOnly()"
        [required]="isRequired()"
        [attr.placeholder]="placeholder() || null"
        [attr.maxlength]="maxLength()"
        [attr.spellcheck]="spellcheck()"
        [attr.aria-label]="ariaLabelAttr()"
        [attr.aria-describedby]="describedByIds()"
        [attr.aria-invalid]="ariaInvalid()"
        (input)="onInput($event)"
        (change)="changed.emit(value())"
        (blur)="markTouched()"
      ></textarea>

      <div class="ds-textarea__footer" [class.ds-textarea__footer--spaced]="hasFooter()">
        <ds-field-messages
          [hint]="hint()"
          [hintId]="hintId()"
          [error]="error()"
          [errorId]="errorId()"
        />

        @if (showCount()) {
          <!--
            aria-hidden: a live counter would interrupt every keystroke. The
            limit is announced once, as part of the field's description, and the
            browser enforces it anyway.
          -->
          <span
            class="ds-textarea__count"
            [class.ds-textarea__count--full]="atLimit()"
            aria-hidden="true"
            >{{ countLabel() }}</span
          >
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    textarea {
      display: block;
      width: 100%;
      padding-block: var(--ds-space-2);
      line-height: var(--ds-line-height-normal);
    }

    .ds-textarea--none {
      resize: none;
    }

    .ds-textarea--vertical {
      resize: vertical;
    }

    /* Auto-grow measures the element, so it must not be able to scroll. */
    .ds-textarea--auto {
      resize: none;
      overflow-y: hidden;
    }

    .ds-textarea--invalid {
      border-color: var(--ds-color-danger);
    }

    .ds-textarea--invalid:focus {
      border-color: var(--ds-color-danger);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--ds-color-danger) 28%, transparent);
    }

    .ds-textarea__footer--spaced {
      margin-block-start: var(--ds-space-1_5);
    }

    .ds-textarea__footer {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--ds-space-3);
    }

    .ds-textarea__footer > ds-field-messages {
      flex: 1 1 auto;
    }

    .ds-textarea__count {
      flex-shrink: 0;
      margin-inline-start: auto;
      font-family: var(--ds-font-mono);
      font-size: var(--ds-font-size-xs);
      font-variant-numeric: tabular-nums;
      color: var(--ds-color-text-subtle);
    }

    .ds-textarea__count--full {
      color: var(--ds-color-danger);
      font-weight: var(--ds-font-weight-semibold);
    }
  `,
})
export class TextareaComponent extends FormControlBase<string> {
  readonly value = model<string>('');
  readonly placeholder = input<string>('');
  /** Visible lines. The starting height when `resize` is `auto`. */
  readonly rows = input(3);
  readonly readOnly = input(false);
  readonly spellcheck = input<boolean | null>(null);
  /** Hard limit enforced by the browser, and the denominator of the counter. */
  readonly maxLength = input<number | null>(null);
  /** Show the character count under the field. */
  readonly showCount = input(false);
  readonly resize = input<TextareaResize>('vertical');

  /** Emits on every keystroke. */
  readonly valueInput = output<string>();
  /** Emits when the value is committed (blur). */
  readonly changed = output<string>();

  private readonly controlRef = viewChild<ElementRef<HTMLTextAreaElement>>('control');

  protected readonly classes = computed(() =>
    cx(
      'form-control',
      formControlSizeClass(this.size()),
      `ds-textarea--${this.resize()}`,
      this.isInvalid() && 'ds-textarea--invalid',
    ),
  );

  /** `140` on its own, or `140/280` when there is a limit to count towards. */
  protected readonly countLabel = computed(() => {
    const max = this.maxLength();
    return max === null ? `${this.value().length}` : `${this.value().length}/${max}`;
  });

  /** The hint, the error and the counter share one line under the field. */
  protected readonly hasFooter = computed(() => this.hasMessage() || this.showCount());

  protected readonly atLimit = computed(() => {
    const max = this.maxLength();
    return max !== null && this.value().length >= max;
  });

  constructor() {
    super();

    // Re-measure whenever the value or the mode changes — including the value
    // a form writes in, which never passes through `onInput`.
    effect(() => {
      this.value();
      this.resize();
      this.autoGrow();
    });
  }

  protected onInput(event: Event): void {
    const next = (event.target as HTMLTextAreaElement).value;
    this.value.set(next);
    this.onChangeCallback(next);
    this.valueInput.emit(next);
  }

  /** Focuses the control. */
  focus(): void {
    this.controlRef()?.nativeElement.focus();
  }

  /**
   * Collapse, then measure: `scrollHeight` only shrinks back once the element is
   * no taller than its content. `height: auto` also restores the height `rows`
   * asks for, which is the floor the field never drops below.
   */
  private autoGrow(): void {
    const element = this.controlRef()?.nativeElement;
    if (!element || this.resize() !== 'auto') {
      return;
    }

    element.style.height = 'auto';
    const rowsHeight = element.offsetHeight;
    // `scrollHeight` is the content box; `border-box` sizing wants the borders too.
    const borders = element.offsetHeight - element.clientHeight;
    element.style.height = `${Math.max(element.scrollHeight + borders, rowsHeight)}px`;
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }
}
