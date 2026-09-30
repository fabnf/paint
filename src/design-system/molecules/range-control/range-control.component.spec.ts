import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormFieldComponent } from '../form-field';
import { RangeControlComponent } from './range-control.component';

@Component({
  standalone: true,
  imports: [RangeControlComponent],
  template: `
    <ds-range-control
      [label]="label()"
      [ariaLabel]="ariaLabel()"
      [(value)]="value"
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [size]="size()"
      [hint]="hint()"
      [error]="error()"
      [disabled]="disabled()"
      [required]="required()"
      [prefix]="prefix()"
      [suffix]="suffix()"
      (valueInput)="inputs.push($event)"
      (changed)="changes.push($event)"
    />
  `,
})
class HostComponent {
  value = 40;
  readonly label = signal('Volume');
  readonly ariaLabel = signal('');
  readonly min = signal(0);
  readonly max = signal(100);
  readonly step = signal(1);
  readonly size = signal<'sm' | 'md' | 'lg'>('md');
  readonly hint = signal('');
  readonly error = signal('');
  readonly disabled = signal(false);
  readonly required = signal(false);
  readonly prefix = signal('');
  readonly suffix = signal('');
  inputs: number[] = [];
  changes: number[] = [];
}

describe('RangeControlComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);
  const range = () => query<HTMLInputElement>('input[type="range"]')!;
  const number = () => query<HTMLInputElement>('input[type="number"]')!;
  const up = () => query<HTMLButtonElement>('.ds-number__step--up')!;

  const drag = (to: number) => {
    range().value = String(to);
    range().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const type = (text: string) => {
    number().value = text;
    number().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  /** What a real blur does: `blur` on the element, then `focusout` up the tree. */
  const leave = () => {
    number().dispatchEvent(new Event('blur'));
    number().dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a slider and a number field showing the same value', () => {
    expect(range().value).toBe('40');
    expect(number().value).toBe('40');
  });

  it('gives both controls the same constraints', () => {
    host.min.set(10);
    host.max.set(50);
    host.step.set(5);
    fixture.detectChanges();

    expect(range().min).toBe('10');
    expect(range().max).toBe('50');
    expect(range().step).toBe('5');
    expect(number().getAttribute('min')).toBe('10');
    expect(number().getAttribute('max')).toBe('50');
    expect(number().getAttribute('step')).toBe('5');
  });

  describe('one label', () => {
    it('draws exactly one label, pointing at the slider', () => {
      const labels = fixture.nativeElement.querySelectorAll('label') as NodeListOf<HTMLLabelElement>;
      expect(labels.length).toBe(1);
      expect(labels[0].textContent).toContain('Volume');
      expect(labels[0].getAttribute('for')).toBe(range().id);
    });

    it('names the number field by the same label', () => {
      const label = query<HTMLLabelElement>('label')!;
      expect(label.id).toBeTruthy();
      expect(number().getAttribute('aria-labelledby')).toBe(label.id);
      expect(number().getAttribute('aria-label')).toBeNull();
      expect(number().id).not.toBe(range().id);
    });

    it('falls back to aria-label on both when there is no visible label', () => {
      host.label.set('');
      host.ariaLabel.set('Volume level');
      fixture.detectChanges();

      expect(query('label')).toBeNull();
      expect(range().getAttribute('aria-label')).toBe('Volume level');
      expect(number().getAttribute('aria-label')).toBe('Volume level');
      expect(number().getAttribute('aria-labelledby')).toBeNull();
    });

    it('draws the hint and error once, and describes both controls with them', () => {
      host.hint.set('Louder is not better.');
      host.error.set('Too loud.');
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('.ds-field__hint').length).toBe(1);
      expect(fixture.nativeElement.querySelectorAll('.ds-field__error').length).toBe(1);
      const described = `${query('.ds-field__hint')!.id} ${query('.ds-field__error')!.id}`;
      expect(range().getAttribute('aria-describedby')).toBe(described);
      expect(number().getAttribute('aria-describedby')).toBe(described);
      expect(range().getAttribute('aria-invalid')).toBe('true');
      expect(number().getAttribute('aria-invalid')).toBe('true');
    });

    it('marks the label required and disables both controls', () => {
      host.required.set(true);
      host.disabled.set(true);
      fixture.detectChanges();

      expect(query('.ds-field__required')).toBeTruthy();
      expect(range().disabled).toBeTrue();
      expect(number().disabled).toBeTrue();
      expect(up().disabled).toBeTrue();
    });
  });

  describe('one value', () => {
    it('moves the number when the slider moves', () => {
      drag(65);
      expect(host.value).toBe(65);
      expect(number().value).toBe('65');
      expect(host.inputs).toEqual([65]);
    });

    it('moves the slider when the number is typed, clamped', () => {
      type('30');
      expect(host.value).toBe(30);
      expect(range().value).toBe('30');

      type('240');
      expect(host.value).toBe(100);
      expect(range().value).toBe('100');
    });

    it('does not rewrite the digits while they are being typed', () => {
      host.min.set(10);
      fixture.detectChanges();

      // "1" on the way to "12": the model is clamped to 10, the field still says 1.
      type('1');
      expect(host.value).toBe(10);
      expect(number().value).toBe('1');

      type('12');
      expect(host.value).toBe(12);
      expect(number().value).toBe('12');
    });

    it('shows the settled value once the field is left', () => {
      type('240');
      expect(number().value).toBe('240');
      leave();
      expect(number().value).toBe('100');
      expect(host.value).toBe(100);
      expect(host.changes).toEqual([100]);
    });

    it('restores the value when the field is left empty', () => {
      type('');
      expect(host.value).toBe(40);
      leave();
      expect(number().value).toBe('40');
      expect(range().value).toBe('40');
    });

    it('steps from the buttons and reports a commit', () => {
      up().click();
      fixture.detectChanges();
      expect(host.value).toBe(41);
      expect(range().value).toBe('41');
      expect(host.changes).toEqual([41]);
    });

    it('reflects a model change into both controls', () => {
      host.value = 77;
      fixture.detectChanges();
      expect(range().value).toBe('77');
      expect(number().value).toBe('77');
    });

    it('reports a slider gesture ending', () => {
      drag(50);
      range().dispatchEvent(new Event('change'));
      expect(host.changes).toEqual([50]);
    });
  });

  it('speaks the unit with the slider’s value', () => {
    expect(range().getAttribute('aria-valuetext')).toBeNull();

    host.prefix.set('$');
    fixture.detectChanges();
    expect(range().getAttribute('aria-valuetext')).toBe('$40');
    expect(query('.ds-number__affix')!.textContent!.trim()).toBe('$');

    host.prefix.set('');
    host.suffix.set('%');
    fixture.detectChanges();
    expect(range().getAttribute('aria-valuetext')).toBe('40%');
  });

  it('passes the control scale down', () => {
    host.size.set('lg');
    fixture.detectChanges();
    expect(query('.ds-number__wrap')!.classList).toContain('form-control-lg');
    expect(query('ds-slider .ds-field')!.classList).toContain('ds-field--lg');
  });
});

describe('RangeControlComponent + reactive forms', () => {
  @Component({
    standalone: true,
    imports: [RangeControlComponent, ReactiveFormsModule],
    template: `<ds-range-control label="Opacity" [max]="10" [formControl]="control" />`,
  })
  class FormHostComponent {
    readonly control = new FormControl<number | null>(7);
  }

  let fixture: ComponentFixture<FormHostComponent>;
  let host: FormHostComponent;
  const range = () => fixture.nativeElement.querySelector('input[type="range"]') as HTMLInputElement;
  const number = () => fixture.nativeElement.querySelector('input[type="number"]') as HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FormHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(FormHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('writes the form value into both controls', () => {
    expect(range().value).toBe('7');
    expect(number().value).toBe('7');
  });

  it('reports either control back to the form', () => {
    range().value = '3';
    range().dispatchEvent(new Event('input'));
    expect(host.control.value).toBe(3);

    number().value = '9';
    number().dispatchEvent(new Event('input'));
    expect(host.control.value).toBe(9);
  });

  it('sits at the minimum when the form holds nothing', () => {
    host.control.reset();
    fixture.detectChanges();
    expect(range().value).toBe('0');
    expect(number().value).toBe('0');
  });

  it('is disabled by the form', () => {
    host.control.disable();
    fixture.detectChanges();
    expect(range().disabled).toBeTrue();
    expect(number().disabled).toBeTrue();
  });

  it('marks itself touched when either control loses focus', () => {
    expect(host.control.touched).toBeFalse();
    range().dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    expect(host.control.touched).toBeTrue();
  });
});

describe('RangeControlComponent inside <ds-form-field>', () => {
  @Component({
    standalone: true,
    imports: [RangeControlComponent, FormFieldComponent],
    template: `
      <ds-form-field id="vol" label="Volume" hint="Louder is not better." error="Too loud.">
        <ds-range-control [(value)]="value" />
      </ds-form-field>
    `,
  })
  class FieldHostComponent {
    value = 20;
  }

  let fixture: ComponentFixture<FieldHostComponent>;
  const query = <T extends HTMLElement>(selector: string): T => fixture.nativeElement.querySelector(selector);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FieldHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(FieldHostComponent);
    fixture.detectChanges();
  });

  it('gives the field’s id to the slider only, and its label to both', () => {
    const range = query<HTMLInputElement>('input[type="range"]');
    const number = query<HTMLInputElement>('input[type="number"]');
    expect(range.id).toBe('vol');
    expect(number.id).toBe('vol-number');
    expect(query('label').getAttribute('for')).toBe('vol');
    expect(number.getAttribute('aria-labelledby')).toBe('vol-label');
    expect(fixture.nativeElement.querySelectorAll('label').length).toBe(1);
  });

  it('forwards the field’s description and validity to both controls', () => {
    for (const control of [query('input[type="range"]'), query('input[type="number"]')]) {
      expect(control.getAttribute('aria-describedby')).toBe('vol-hint vol-error');
      expect(control.getAttribute('aria-invalid')).toBe('true');
    }
  });
});