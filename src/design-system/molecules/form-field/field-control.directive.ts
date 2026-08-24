import { Directive, ElementRef, computed, inject } from '@angular/core';
import { DS_FIELD } from '../../primitives/forms/field-context';
import { describedBy as joinIds } from '../../primitives/forms/form-control.types';

/**
 * Wires a *native* control into the `<ds-form-field>` it is written inside.
 *
 * Paint's own controls ask the field for their id and description themselves.
 * Everything else — a `<select>`, an `<input type="color">`, a third-party
 * control — needs one attribute, and then the field's label points at it, its
 * hint describes it, and its error marks it invalid.
 *
 * @example
 * ```html
 * <ds-form-field label="Colour" hint="Pick one, or type a hex.">
 *   <input dsFieldControl type="color" class="form-control" />
 * </ds-form-field>
 * ```
 */
@Directive({
  selector: '[dsFieldControl]',
  standalone: true,
  host: {
    '[attr.id]': 'controlId()',
    '[attr.aria-describedby]': 'describedByIds()',
    '[attr.aria-invalid]': 'ariaInvalid()',
    '[attr.required]': 'field.required() ? "" : null',
    '[attr.disabled]': 'field.disabled() ? "" : null',
  },
})
export class FieldControlDirective {
  /**
   * Required, not optional: the directive exists in order to be told what it is.
   * Outside a field it would have nothing to say, and silently doing nothing is
   * worse than failing.
   */
  protected readonly field = inject(DS_FIELD);

  /**
   * Whatever the element already described itself with.
   *
   * Read once, at construction — static attributes are on the element before a
   * directive is built, and the host binding below has not run yet. Reading it
   * later would read back our own answer.
   */
  private readonly ownDescribedBy = inject<ElementRef<HTMLElement>>(
    ElementRef,
  ).nativeElement.getAttribute('aria-describedby');

  protected readonly controlId = computed(() => this.field.controlId());
  protected readonly ariaInvalid = computed(() => (this.field.invalid() ? 'true' : null));

  /** The field's messages first; the element's own description keeps its place. */
  protected readonly describedByIds = computed(() =>
    joinIds(this.field.describedByIds(), this.ownDescribedBy),
  );
}
