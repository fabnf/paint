import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormFieldComponent } from '../../molecules/form-field';
import { SliderComponent } from './slider.component';

@Component({
  standalone: true,
  imports: [SliderComponent],
  template: `
    <ds-slider
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
      [showValue]="showValue()"
      [valueText]="valueText()"
      [tone]="tone()"
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
  readonly showValue = signal(false);
  readonly valueText = signal('');
  readonly tone = signal<'primary' | 'accent' | 'success'>('primary');
  inputs: number[] = [];
  changes: number[] = [];
}

describe('SliderComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);
  const range = () => query<HTMLInputElement>('input[type="range"]')!;

  const press = (key: string) => {
    range().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    fixture.detectChanges();
  };

  const drag = (to: number) => {
    range().value = String(to);
    range().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a native range input on Bootstrap’s form-range substrate', () => {
    expect(range().type).toBe('range');
    expect(range().classList).toContain('form-range');
    expect(range().min).toBe('0');
    expect(range().max).toBe('100');
    expect(range().step).toBe('1');
    expect(range().value).toBe('40');
  });

  it('labels the control with a real <label for>', () => {
    const label = query<HTMLLabelElement>('label')!;
    expect(label.textContent).toContain('Volume');
    expect(label.getAttribute('for')).toBe(range().id);
    expect(range().getAttribute('aria-label')).toBeNull();
  });

  it('falls back to aria-label only when there is no visible label', () => {
    host.label.set('');
    host.ariaLabel.set('Volume level');
    fixture.detectChanges();

    expect(query('label')).toBeNull();
    expect(range().getAttribute('aria-label')).toBe('Volume level');
  });

  it('describes the control with its hint, and treats an error as invalid', () => {
    host.hint.set('Louder is not better.');
    fixture.detectChanges();
    expect(range().getAttribute('aria-describedby')).toBe(query('.ds-field__hint')!.id);

    host.error.set('Too loud for the room.');
    fixture.detectChanges();
    expect(range().getAttribute('aria-invalid')).toBe('true');
    expect(range().getAttribute('aria-describedby')).toBe(
      `${query('.ds-field__hint')!.id} ${query('.ds-field__error')!.id}`,
    );
    expect(range().classList).toContain('ds-slider__control--invalid');
  });

  it('paints how much of the range is behind the thumb', () => {
    expect(range().style.getPropertyValue('--ds-slider-fill')).toBe('40%');

    drag(75);
    expect(range().style.getPropertyValue('--ds-slider-fill')).toBe('75%');
  });

  it('writes a drag through to the model on every movement', () => {
    drag(55);
    expect(host.value).toBe(55);
    expect(host.inputs).toEqual([55]);
    expect(host.changes).toEqual([]);

    range().dispatchEvent(new Event('change'));
    expect(host.changes).toEqual([55]);
  });

  it('reflects a model change back into the DOM', () => {
    host.value = 10;
    fixture.detectChanges();
    expect(range().value).toBe('10');
  });

  it('snaps a value written from outside onto the step grid and inside the bounds', () => {
    host.step.set(5);
    host.value = 57;
    fixture.detectChanges();
    expect(range().value).toBe('55');

    host.value = 240;
    fixture.detectChanges();
    expect(range().value).toBe('100');
  });

  describe('keyboard', () => {
    it('steps with the arrow keys', () => {
      press('ArrowRight');
      expect(host.value).toBe(41);
      press('ArrowUp');
      expect(host.value).toBe(42);
      press('ArrowLeft');
      expect(host.value).toBe(41);
      press('ArrowDown');
      expect(host.value).toBe(40);
    });

    it('jumps to the ends with Home and End', () => {
      press('End');
      expect(host.value).toBe(100);
      press('Home');
      expect(host.value).toBe(0);
    });

    it('moves ten steps with the Page keys', () => {
      host.step.set(5);
      fixture.detectChanges();

      press('PageUp');
      expect(host.value).toBe(90);
      press('PageDown');
      expect(host.value).toBe(40);
    });

    it('stops at the bounds', () => {
      host.value = 100;
      fixture.detectChanges();
      press('ArrowRight');
      expect(host.value).toBe(100);

      host.value = 0;
      fixture.detectChanges();
      press('ArrowLeft');
      expect(host.value).toBe(0);
    });

    it('treats a key press as a whole gesture: input and change at once', () => {
      press('ArrowRight');
      expect(host.inputs).toEqual([41]);
      expect(host.changes).toEqual([41]);
    });

    it('claims the keys it handles and leaves the rest alone', () => {
      const handled = new KeyboardEvent('keydown', { key: 'End', cancelable: true });
      range().dispatchEvent(handled);
      expect(handled.defaultPrevented).toBeTrue();

      const ignored = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
      range().dispatchEvent(ignored);
      expect(ignored.defaultPrevented).toBeFalse();
    });

    it('steps in decimals without floating-point dust', () => {
      host.min.set(0);
      host.max.set(1);
      host.step.set(0.1);
      host.value = 0.3;
      fixture.detectChanges();

      press('ArrowRight');
      expect(host.value).toBe(0.4);
      press('ArrowRight');
      expect(host.value).toBe(0.5);
    });

    it('does nothing while disabled', () => {
      host.disabled.set(true);
      fixture.detectChanges();

      press('End');
      expect(host.value).toBe(40);
      expect(range().disabled).toBeTrue();
    });
  });

  describe('value label', () => {
    it('shows the number next to the label when asked', () => {
      expect(query('.ds-slider__value')).toBeNull();

      host.showValue.set(true);
      fixture.detectChanges();
      expect(query('.ds-slider__value')!.textContent!.trim()).toBe('40');
      // The control announces its own value; the visible one is for eyes.
      expect(query('.ds-slider__value')!.getAttribute('aria-hidden')).toBe('true');
    });

    it('says what the number means, on screen and to a screen reader', () => {
      host.showValue.set(true);
      host.valueText.set('40%');
      fixture.detectChanges();

      expect(query('.ds-slider__value')!.textContent!.trim()).toBe('40%');
      expect(range().getAttribute('aria-valuetext')).toBe('40%');
    });
  });

  it('takes the control scale and a tone', () => {
    host.size.set('lg');
    host.tone.set('accent');
    fixture.detectChanges();

    expect(query('.ds-field')!.classList).toContain('ds-field--lg');
    expect(range().classList).toContain('ds-tone--accent');
  });
});

describe('SliderComponent + reactive forms', () => {
  @Component({
    standalone: true,
    imports: [SliderComponent, ReactiveFormsModule],
    template: `<ds-slider label="Opacity" [max]="10" [formControl]="control" />`,
  })
  class FormHostComponent {
    readonly control = new FormControl<number | null>(7);
  }

  let fixture: ComponentFixture<FormHostComponent>;
  let host: FormHostComponent;
  const range = () => fixture.nativeElement.querySelector('input') as HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FormHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(FormHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('writes the form value into the control', () => {
    expect(range().value).toBe('7');
  });

  it('reports movements back to the form', () => {
    range().value = '3';
    range().dispatchEvent(new Event('input'));
    expect(host.control.value).toBe(3);
  });

  it('sits at the minimum when the form holds nothing', () => {
    host.control.reset();
    fixture.detectChanges();
    expect(range().value).toBe('0');
  });

  it('is disabled by the form', () => {
    host.control.disable();
    fixture.detectChanges();
    expect(range().disabled).toBeTrue();
  });

  it('marks itself touched on blur', () => {
    expect(host.control.touched).toBeFalse();
    range().dispatchEvent(new Event('blur'));
    expect(host.control.touched).toBeTrue();
  });
});

describe('SliderComponent inside <ds-form-field>', () => {
  @Component({
    standalone: true,
    imports: [SliderComponent, FormFieldComponent],
    template: `
      <ds-form-field id="vol" label="Volume" hint="Louder is not better." error="Too loud.">
        <ds-slider [(value)]="value" />
      </ds-form-field>
    `,
  })
  class FieldHostComponent {
    value = 20;
  }

  let fixture: ComponentFixture<FieldHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FieldHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(FieldHostComponent);
    fixture.detectChanges();
  });

  it('adopts the field’s id, description and validity', () => {
    const range = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(range.id).toBe('vol');
    expect(fixture.nativeElement.querySelector('label').getAttribute('for')).toBe('vol');
    expect(range.getAttribute('aria-describedby')).toBe('vol-hint vol-error');
    expect(range.getAttribute('aria-invalid')).toBe('true');
    // The field draws the chrome; the control draws none of its own.
    expect(fixture.nativeElement.querySelectorAll('label').length).toBe(1);
  });
});
