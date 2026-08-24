import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { InputComponent } from '../../primitives/input';
import { CheckboxComponent } from '../../primitives/checkbox';
import { SelectComponent } from '../select';
import { FieldControlDirective } from './field-control.directive';
import { FormFieldComponent } from './form-field.component';

@Component({
  standalone: true,
  imports: [FormFieldComponent, InputComponent],
  template: `
    <ds-form-field
      [label]="label()"
      [hint]="hint()"
      [error]="error()"
      [required]="required()"
      [invalid]="invalid()"
      [disabled]="disabled()"
      [optional]="optional()"
      [labelHidden]="labelHidden()"
    >
      <ds-input [(value)]="value" />
    </ds-form-field>
  `,
})
class HostComponent {
  value = '';
  readonly label = signal('Email');
  readonly hint = signal('');
  readonly error = signal('');
  readonly required = signal(false);
  readonly invalid = signal(false);
  readonly disabled = signal(false);
  readonly optional = signal(false);
  readonly labelHidden = signal(false);
}

describe('FormFieldComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);

  const input = () => query<HTMLInputElement>('input')!;
  const label = () => query<HTMLLabelElement>('label')!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('labels the control inside it, with a real <label for>', () => {
    expect(label().textContent).toContain('Email');
    expect(label().getAttribute('for')).toBe(input().id);
    expect(input().id).toBeTruthy();
  });

  it('renders exactly one label: the control draws none of its own', () => {
    expect(fixture.nativeElement.querySelectorAll('label').length).toBe(1);
    expect(input().getAttribute('aria-label')).toBeNull();
  });

  it('keeps the label as the name when it is hidden', () => {
    host.labelHidden.set(true);
    fixture.detectChanges();

    expect(label().classList).toContain('visually-hidden');
    expect(label().getAttribute('for')).toBe(input().id);
  });

  it('describes the control with the field’s hint', () => {
    host.hint.set('We only use it to sign you in.');
    fixture.detectChanges();

    const hint = query('.ds-field__hint')!;
    expect(input().getAttribute('aria-describedby')).toBe(hint.id);
  });

  it('pushes hint and error into aria-describedby, in reading order', () => {
    host.hint.set('Work address.');
    host.error.set('That is not an email.');
    fixture.detectChanges();

    expect(input().getAttribute('aria-describedby')).toBe(
      `${query('.ds-field__hint')!.id} ${query('.ds-field__error')!.id}`,
    );
  });

  it('treats the field’s error as the control’s invalid state', () => {
    host.error.set('That is not an email.');
    fixture.detectChanges();

    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(query('.ds-input__wrap')!.classList).toContain('ds-input__wrap--invalid');
  });

  it('paints invalid without a message too', () => {
    host.invalid.set(true);
    fixture.detectChanges();
    expect(input().getAttribute('aria-invalid')).toBe('true');
  });

  it('requires and disables the control it wraps', () => {
    host.required.set(true);
    host.disabled.set(true);
    fixture.detectChanges();

    expect(input().required).toBeTrue();
    expect(input().disabled).toBeTrue();
    expect(query('.ds-field__required')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('says “Optional” in words, and only when it is not required', () => {
    host.optional.set(true);
    fixture.detectChanges();
    expect(query('.ds-field__optional')!.textContent!.trim()).toBe('Optional');

    host.required.set(true);
    fixture.detectChanges();
    expect(query('.ds-field__optional')).toBeNull();
  });

  it('announces the error from a region that already existed', () => {
    expect(query('.ds-field__live')!.getAttribute('aria-live')).toBe('polite');
    expect(query('.ds-field__error')).toBeNull();
  });
});

describe('FormFieldComponent with a checkbox', () => {
  @Component({
    standalone: true,
    imports: [FormFieldComponent, CheckboxComponent],
    template: `
      <ds-form-field label="Terms" hint="You can revoke consent." [required]="true">
        <ds-checkbox label="I accept" />
      </ds-form-field>
    `,
  })
  class CheckboxHost {}

  it('still wires id, description and required into the control', async () => {
    await TestBed.configureTestingModule({ imports: [CheckboxHost] }).compileComponents();
    const fixture = TestBed.createComponent(CheckboxHost);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const hint = fixture.nativeElement.querySelector('.ds-field__hint') as HTMLElement;

    expect(input.required).toBeTrue();
    expect(input.getAttribute('aria-describedby')).toBe(hint.id);
    // The checkbox keeps its own label beside the box; the field's is above.
    expect(fixture.nativeElement.querySelectorAll('label').length).toBe(2);
  });
});

describe('FormFieldComponent with a Select', () => {
  @Component({
    standalone: true,
    imports: [FormFieldComponent, SelectComponent],
    template: `
      <ds-form-field label="Owner" hint="Who signs it off." [required]="true" [error]="error">
        <ds-select [options]="options" />
      </ds-form-field>
    `,
  })
  class SelectHost {
    readonly options = [{ value: 'ada', label: 'Ada Lovelace' }];
    error = '';
  }

  let fixture: ComponentFixture<SelectHost>;
  const trigger = () => fixture.nativeElement.querySelector('.ds-select__trigger') as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SelectHost] }).compileComponents();
    fixture = TestBed.createComponent(SelectHost);
    fixture.detectChanges();
  });

  it('points the label at the combobox trigger, which is a labelable element', () => {
    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
    expect(label.getAttribute('for')).toBe(trigger().id);
  });

  it('names the trigger by the field’s label *and* its value', () => {
    const labelId = (fixture.nativeElement.querySelector('label') as HTMLElement).id;
    expect(labelId).toBeTruthy();
    expect(trigger().getAttribute('aria-labelledby')).toContain(labelId);
  });

  it('forwards the field’s description, required and invalid state', () => {
    fixture.componentInstance.error = 'Pick an owner.';
    fixture.detectChanges();

    const hint = fixture.nativeElement.querySelector('.ds-field__hint') as HTMLElement;
    const error = fixture.nativeElement.querySelector('.ds-field__error') as HTMLElement;

    expect(trigger().getAttribute('aria-describedby')).toBe(`${hint.id} ${error.id}`);
    expect(trigger().getAttribute('aria-required')).toBe('true');
    expect(trigger().getAttribute('aria-invalid')).toBe('true');
  });
});

describe('FieldControlDirective', () => {
  @Component({
    standalone: true,
    imports: [FormFieldComponent, FieldControlDirective],
    template: `
      <ds-form-field label="Colour" [hint]="hint" [error]="error" [required]="true" [disabled]="disabled">
        <input dsFieldControl type="color" class="form-control" aria-describedby="swatch-help" />
      </ds-form-field>
      <span id="swatch-help">Hex values only.</span>
    `,
  })
  class NativeHost {
    hint = 'Pick one, or type a hex.';
    error = '';
    disabled = false;
  }

  let fixture: ComponentFixture<NativeHost>;
  const input = () => fixture.nativeElement.querySelector('input') as HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NativeHost] }).compileComponents();
    fixture = TestBed.createComponent(NativeHost);
    fixture.detectChanges();
  });

  it('adopts the field’s id so the label points at a native control', () => {
    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
    expect(input().id).toBeTruthy();
    expect(label.getAttribute('for')).toBe(input().id);
  });

  it('appends the field’s description to the element’s own', () => {
    const hint = fixture.nativeElement.querySelector('.ds-field__hint') as HTMLElement;
    expect(input().getAttribute('aria-describedby')).toBe(`${hint.id} swatch-help`);
  });

  it('forwards required, disabled and the error’s invalid state', () => {
    expect(input().hasAttribute('required')).toBeTrue();
    expect(input().getAttribute('aria-invalid')).toBeNull();

    fixture.componentInstance.error = 'Not a colour.';
    fixture.componentInstance.disabled = true;
    fixture.detectChanges();

    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(input().disabled).toBeTrue();
  });
});

describe('a control outside any field', () => {
  @Component({
    standalone: true,
    imports: [InputComponent],
    template: `<ds-input label="Email" hint="Alone." [required]="true" />`,
  })
  class LoneHost {}

  it('still draws its own label, hint and required state', async () => {
    await TestBed.configureTestingModule({ imports: [LoneHost] }).compileComponents();
    const fixture = TestBed.createComponent(LoneHost);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
    const hint = fixture.nativeElement.querySelector('.ds-field__hint') as HTMLElement;

    expect(label.getAttribute('for')).toBe(input.id);
    expect(input.getAttribute('aria-describedby')).toBe(hint.id);
    expect(input.required).toBeTrue();
  });
});
