import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { NumberInputComponent, type NumberInputValue } from './number-input.component';

@Component({
  standalone: true,
  imports: [NumberInputComponent],
  template: `
    <ds-number-input
      [label]="label()"
      [ariaLabel]="ariaLabel()"
      [(value)]="value"
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [size]="size()"
      [hint]="hint()"
      [error]="error()"
      [required]="required()"
      [disabled]="disabled()"
      [readOnly]="readOnly()"
      [prefix]="prefix()"
      [suffix]="suffix()"
      [inputMode]="inputMode()"
      [labelledBy]="labelledBy()"
      [decrementLabel]="decrementLabel()"
      [incrementLabel]="incrementLabel()"
      (valueInput)="inputs.push($event)"
      (changed)="changes.push($event)"
    />
  `,
})
class HostComponent {
  value: NumberInputValue = 3;
  readonly label = signal('Seats');
  readonly ariaLabel = signal('');
  readonly min = signal<number | null>(1);
  readonly max = signal<number | null>(12);
  readonly step = signal(1);
  readonly size = signal<'sm' | 'md' | 'lg'>('md');
  readonly hint = signal('');
  readonly error = signal('');
  readonly required = signal(false);
  readonly disabled = signal(false);
  readonly readOnly = signal(false);
  readonly prefix = signal('');
  readonly suffix = signal('');
  readonly inputMode = signal('');
  readonly labelledBy = signal('');
  readonly decrementLabel = signal('Decrease');
  readonly incrementLabel = signal('Increase');
  inputs: NumberInputValue[] = [];
  changes: NumberInputValue[] = [];
}

describe('NumberInputComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);
  const input = () => query<HTMLInputElement>('input')!;
  const down = () => query<HTMLButtonElement>('.ds-number__step--down')!;
  const up = () => query<HTMLButtonElement>('.ds-number__step--up')!;

  const type = (text: string) => {
    input().value = text;
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const press = (key: string) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    input().dispatchEvent(event);
    fixture.detectChanges();
    return event;
  };

  const leave = () => {
    input().dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  };

  const enter = () => {
    input().dispatchEvent(new Event('focus'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a native number input between two real buttons, in the Input’s chrome', () => {
    expect(input().type).toBe('number');
    expect(input().value).toBe('3');
    expect(query('.ds-number__wrap')!.classList).toContain('form-control');
    expect(down().tagName).toBe('BUTTON');
    expect(up().tagName).toBe('BUTTON');
    expect(down().getAttribute('type')).toBe('button');
  });

  it('mirrors the constraints onto the element', () => {
    expect(input().getAttribute('min')).toBe('1');
    expect(input().getAttribute('max')).toBe('12');
    expect(input().getAttribute('step')).toBe('1');
    expect(input().getAttribute('autocomplete')).toBe('off');
  });

  it('labels the control with a real <label for>, like every other form atom', () => {
    const label = query<HTMLLabelElement>('label')!;
    expect(label.textContent).toContain('Seats');
    expect(label.getAttribute('for')).toBe(input().id);

    host.label.set('');
    host.ariaLabel.set('Number of seats');
    fixture.detectChanges();
    expect(query('label')).toBeNull();
    expect(input().getAttribute('aria-label')).toBe('Number of seats');
  });

  it('can be named by an element elsewhere, which wins over aria-label', () => {
    host.label.set('');
    host.ariaLabel.set('Seats');
    host.labelledBy.set('shared-label');
    fixture.detectChanges();
    expect(input().getAttribute('aria-labelledby')).toBe('shared-label');
    expect(input().getAttribute('aria-label')).toBeNull();
  });

  it('describes the control with its hint and error, and an error is invalid', () => {
    host.hint.set('Up to twelve.');
    host.error.set('Pick at least one seat.');
    fixture.detectChanges();

    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(input().getAttribute('aria-describedby')).toBe(
      `${query('.ds-field__hint')!.id} ${query('.ds-field__error')!.id}`,
    );
    expect(query('.ds-number__wrap')!.classList).toContain('ds-number__wrap--invalid');
  });

  it('maps the control scale onto Bootstrap’s size classes', () => {
    host.size.set('sm');
    fixture.detectChanges();
    expect(query('.ds-number__wrap')!.classList).toContain('form-control-sm');
    host.size.set('lg');
    fixture.detectChanges();
    expect(query('.ds-number__wrap')!.classList).toContain('form-control-lg');
  });

  describe('the buttons', () => {
    it('step the value and report a commit', () => {
      up().click();
      fixture.detectChanges();
      expect(host.value).toBe(4);
      expect(input().value).toBe('4');
      expect(host.changes).toEqual([4]);

      down().click();
      down().click();
      fixture.detectChanges();
      expect(host.value).toBe(2);
      expect(host.changes).toEqual([4, 3, 2]);
    });

    it('are named, and stay out of the tab order', () => {
      expect(down().getAttribute('aria-label')).toBe('Decrease');
      expect(up().getAttribute('aria-label')).toBe('Increase');
      expect(down().getAttribute('tabindex')).toBe('-1');
      expect(up().getAttribute('tabindex')).toBe('-1');

      host.decrementLabel.set('Fewer seats');
      host.incrementLabel.set('More seats');
      fixture.detectChanges();
      expect(down().getAttribute('aria-label')).toBe('Fewer seats');
      expect(up().getAttribute('aria-label')).toBe('More seats');
    });

    it('keep the caret in the field when clicked', () => {
      const mousedown = new MouseEvent('mousedown', { cancelable: true, bubbles: true });
      up().dispatchEvent(mousedown);
      expect(mousedown.defaultPrevented).toBeTrue();
    });

    it('disable at the bounds, so the field never offers a step it would refuse', () => {
      host.value = 12;
      fixture.detectChanges();
      expect(up().disabled).toBeTrue();
      expect(down().disabled).toBeFalse();

      host.value = 1;
      fixture.detectChanges();
      expect(down().disabled).toBeTrue();
      expect(up().disabled).toBeFalse();
    });

    it('disable with the field', () => {
      host.disabled.set(true);
      fixture.detectChanges();
      expect(up().disabled).toBeTrue();
      expect(down().disabled).toBeTrue();
      expect(input().disabled).toBeTrue();

      host.disabled.set(false);
      host.readOnly.set(true);
      fixture.detectChanges();
      expect(up().disabled).toBeTrue();
      expect(input().readOnly).toBeTrue();
    });

    it('start an empty field at zero, or the nearest allowed value', () => {
      host.value = null;
      fixture.detectChanges();
      expect(input().value).toBe('');

      up().click();
      fixture.detectChanges();
      expect(host.value as NumberInputValue).toBe(1);

      host.min.set(-10);
      host.value = null;
      fixture.detectChanges();
      down().click();
      fixture.detectChanges();
      expect(host.value as NumberInputValue).toBe(0);
    });
  });

  describe('the keyboard', () => {
    it('steps with the arrow keys and claims them', () => {
      expect(press('ArrowUp').defaultPrevented).toBeTrue();
      expect(host.value).toBe(4);
      expect(press('ArrowDown').defaultPrevented).toBeTrue();
      expect(host.value).toBe(3);
    });

    it('stops at the bounds', () => {
      host.value = 12;
      fixture.detectChanges();
      press('ArrowUp');
      expect(host.value).toBe(12);
    });

    it('settles the value on Enter without swallowing the key', () => {
      type('40');
      const event = press('Enter');
      expect(event.defaultPrevented).toBeFalse();
      expect(host.value).toBe(12);
      expect(input().value).toBe('12');
      expect(host.changes).toEqual([12]);
    });

    it('leaves other keys to the platform', () => {
      expect(press('Tab').defaultPrevented).toBeFalse();
      expect(press('Home').defaultPrevented).toBeFalse();
    });
  });

  describe('typing', () => {
    it('writes every parsed keystroke to the model, uncorrected', () => {
      // "1" on the way to "12" is not yet out of range; nothing is clamped mid-thought.
      type('40');
      expect(host.value).toBe(40);
      expect(input().value).toBe('40');
      expect(host.inputs).toEqual([40]);
    });

    it('does not rewrite what is being typed', () => {
      type('07');
      expect(host.value).toBe(7);
      expect(input().value).toBe('07');
    });

    it('reports an empty field as null, never NaN', () => {
      type('');
      expect(host.value).toBeNull();
      expect(host.inputs).toEqual([null]);
    });
  });

  describe('leaving the field', () => {
    it('clamps to the bounds', () => {
      enter();
      type('40');
      leave();
      expect(host.value).toBe(12);
      expect(input().value).toBe('12');

      type('-5');
      leave();
      expect(host.value).toBe(1);
    });

    it('snaps to the step grid, anchored at min', () => {
      host.step.set(5);
      host.min.set(0);
      host.max.set(100);
      fixture.detectChanges();

      enter();
      type('17');
      leave();
      expect(host.value).toBe(15);
      expect(input().value).toBe('15');
    });

    it('rounds a decimal step to its own precision', () => {
      host.step.set(0.01);
      host.min.set(0);
      host.max.set(null);
      fixture.detectChanges();

      type('3.456');
      leave();
      expect(host.value).toBe(3.46);
    });

    it('reports a commit only when something changed', () => {
      enter();
      leave();
      expect(host.changes).toEqual([]);

      enter();
      type('5');
      leave();
      expect(host.changes).toEqual([5]);
    });

    it('drops a half-typed entry with the focus', () => {
      type('');
      input().value = '-';
      leave();
      expect(input().value).toBe('');
      expect(host.value).toBeNull();
    });

    it('leaves an empty field empty', () => {
      type('');
      leave();
      expect(host.value).toBeNull();
      expect(input().value).toBe('');
    });
  });

  describe('the keypad hint', () => {
    it('asks for a numeric keypad when the field cannot go negative', () => {
      expect(input().getAttribute('inputmode')).toBe('numeric');

      host.step.set(0.5);
      fixture.detectChanges();
      expect(input().getAttribute('inputmode')).toBe('decimal');
    });

    it('keeps the platform’s keyboard when a minus sign may be needed', () => {
      host.min.set(null);
      fixture.detectChanges();
      expect(input().getAttribute('inputmode')).toBeNull();

      host.min.set(-3);
      fixture.detectChanges();
      expect(input().getAttribute('inputmode')).toBeNull();
    });

    it('defers to an explicit inputMode', () => {
      host.inputMode.set('tel');
      fixture.detectChanges();
      expect(input().getAttribute('inputmode')).toBe('tel');
    });
  });

  it('shows decorative affixes and hides them from assistive tech', () => {
    host.prefix.set('$');
    host.suffix.set('/seat');
    fixture.detectChanges();

    const affixes = Array.from(fixture.nativeElement.querySelectorAll('.ds-number__affix')) as HTMLElement[];
    expect(affixes.map((affix) => affix.textContent!.trim())).toEqual(['$', '/seat']);
    expect(affixes.every((affix) => affix.getAttribute('aria-hidden') === 'true')).toBeTrue();
  });

  it('reflects a model change back into the DOM', () => {
    host.value = 9;
    fixture.detectChanges();
    expect(input().value).toBe('9');

    host.value = null;
    fixture.detectChanges();
    expect(input().value).toBe('');
  });

  it('marks required on the control, and the asterisk as decoration', () => {
    host.required.set(true);
    fixture.detectChanges();
    expect(input().required).toBeTrue();
    expect(query('.ds-field__required')!.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('NumberInputComponent + reactive forms', () => {
  @Component({
    standalone: true,
    imports: [NumberInputComponent, ReactiveFormsModule],
    template: `<ds-number-input label="Quantity" [min]="1" [max]="5" [formControl]="control" />`,
  })
  class FormHostComponent {
    readonly control = new FormControl<number | null>(2, Validators.required);
  }

  let fixture: ComponentFixture<FormHostComponent>;
  let host: FormHostComponent;
  const input = () => fixture.nativeElement.querySelector('input') as HTMLInputElement;
  const up = () => fixture.nativeElement.querySelector('.ds-number__step--up') as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FormHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(FormHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('writes the form value into the control, and numbers back out', () => {
    expect(input().value).toBe('2');

    up().click();
    expect(host.control.value).toBe(3);

    input().value = '4';
    input().dispatchEvent(new Event('input'));
    expect(host.control.value).toBe(4);
  });

  it('accepts a string from the form and hands back a number', () => {
    host.control.setValue('5' as unknown as number);
    fixture.detectChanges();
    expect(input().value).toBe('5');
  });

  it('becomes empty with the form', () => {
    host.control.reset();
    fixture.detectChanges();
    expect(input().value).toBe('');
    expect(host.control.value).toBeNull();
  });

  it('is disabled by the form, buttons included', () => {
    host.control.disable();
    fixture.detectChanges();
    expect(input().disabled).toBeTrue();
    expect(up().disabled).toBeTrue();
  });

  it('marks itself touched on blur', () => {
    expect(host.control.touched).toBeFalse();
    input().dispatchEvent(new Event('blur'));
    expect(host.control.touched).toBeTrue();
  });
});
