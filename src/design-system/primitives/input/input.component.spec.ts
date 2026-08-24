import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputComponent, type InputValue } from './input.component';
import type { InputType } from '../forms/form-control.types';

@Component({
  standalone: true,
  imports: [InputComponent],
  template: `
    <ds-input
      [label]="label()"
      [ariaLabel]="ariaLabel()"
      [type]="type()"
      [(value)]="value"
      [size]="size()"
      [hint]="hint()"
      [error]="error()"
      [invalid]="invalid()"
      [required]="required()"
      [disabled]="disabled()"
      [clearable]="clearable()"
      [iconStart]="iconStart()"
      [prefix]="prefix()"
      (valueInput)="inputs.push($event)"
      (changed)="changes.push($event)"
    />
  `,
})
class HostComponent {
  value: InputValue = '';
  readonly label = signal('Email');
  readonly ariaLabel = signal('');
  readonly type = signal<InputType>('text');
  readonly size = signal<'sm' | 'md' | 'lg'>('md');
  readonly hint = signal('');
  readonly error = signal('');
  readonly invalid = signal(false);
  readonly required = signal(false);
  readonly disabled = signal(false);
  readonly clearable = signal(false);
  readonly iconStart = signal<'search' | null>(null);
  readonly prefix = signal('');
  inputs: InputValue[] = [];
  changes: InputValue[] = [];
}

describe('InputComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);

  const input = () => query<HTMLInputElement>('input')!;

  const type = (text: string) => {
    input().value = text;
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a native input on Bootstrap’s form-control substrate', () => {
    expect(input().type).toBe('text');
    expect(query('.ds-input__wrap')!.classList).toContain('form-control');
  });

  it('maps the control scale onto Bootstrap’s size classes', () => {
    host.size.set('sm');
    fixture.detectChanges();
    expect(query('.ds-input__wrap')!.classList).toContain('form-control-sm');

    host.size.set('lg');
    fixture.detectChanges();
    expect(query('.ds-input__wrap')!.classList).toContain('form-control-lg');

    host.size.set('md');
    fixture.detectChanges();
    expect(query('.ds-input__wrap')!.classList).not.toContain('form-control-sm');
  });

  it('labels the control with a real <label for>', () => {
    const label = query<HTMLLabelElement>('label')!;
    expect(label.textContent).toContain('Email');
    expect(label.getAttribute('for')).toBe(input().id);
    expect(input().id).toBeTruthy();
    expect(input().getAttribute('aria-label')).toBeNull();
  });

  it('falls back to aria-label only when there is no visible label', () => {
    host.label.set('');
    host.ariaLabel.set('Email address');
    fixture.detectChanges();

    expect(query('label')).toBeNull();
    expect(input().getAttribute('aria-label')).toBe('Email address');
  });

  it('describes the control with its hint', () => {
    host.hint.set('We only use it to sign you in.');
    fixture.detectChanges();

    const hint = query('.ds-field__hint')!;
    expect(input().getAttribute('aria-describedby')).toBe(hint.id);
    expect(hint.textContent).toContain('We only use it to sign you in.');
  });

  it('treats an error message as the invalid state, and keeps the hint', () => {
    host.hint.set('Work address.');
    host.error.set('Enter a valid email.');
    fixture.detectChanges();

    const error = query('.ds-field__error')!;
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(input().getAttribute('aria-describedby')).toBe(`${query('.ds-field__hint')!.id} ${error.id}`);
    expect(error.textContent).toContain('Enter a valid email.');
  });

  it('announces the error politely from a region that already existed', () => {
    // The live region is in the DOM before the message is, or nothing observes it.
    expect(query('.ds-field__live')).toBeTruthy();
    expect(query('.ds-field__live')!.getAttribute('aria-live')).toBe('polite');
    expect(query('.ds-field__error')).toBeNull();
  });

  it('paints invalid without a message too', () => {
    host.invalid.set(true);
    fixture.detectChanges();

    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(query('.ds-input__wrap')!.classList).toContain('ds-input__wrap--invalid');
    expect(query('.ds-field__error')).toBeNull();
  });

  it('writes through to the model on every keystroke', () => {
    type('ada@paint.dev');

    expect(host.value).toBe('ada@paint.dev');
    expect(host.inputs).toEqual(['ada@paint.dev']);
  });

  it('reflects a model change back into the DOM', () => {
    host.value = 'grace@paint.dev';
    fixture.detectChanges();
    expect(input().value).toBe('grace@paint.dev');
  });

  it('emits numbers, not numeric strings, from a number input', () => {
    host.type.set('number');
    fixture.detectChanges();

    type('42');
    expect(host.value).toBe(42);

    type('');
    expect(host.value).toBeNull();
  });

  it('does not rewrite what the user is typing into a number field', () => {
    host.type.set('number');
    fixture.detectChanges();

    // "01" parses to 1. Pushing "1" back into the element would delete a
    // character from under the caret, mid-keystroke.
    type('01');
    expect(host.value).toBe(1);
    expect(input().value).toBe('01');
  });

  it('clears from the button and from Escape, then keeps focus', () => {
    host.clearable.set(true);
    type('paint');

    expect(query('.ds-input__clear')).toBeTruthy();
    query<HTMLButtonElement>('.ds-input__clear')!.click();
    fixture.detectChanges();

    expect(host.value).toBe('');
    expect(input().value).toBe('');
    expect(document.activeElement).toBe(input());
    expect(query('.ds-input__clear')).toBeNull();

    type('paint again');
    input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(host.value).toBe('');
  });

  it('keeps the clear button out of the tab order', () => {
    host.clearable.set(true);
    type('paint');
    expect(query('.ds-input__clear')!.getAttribute('tabindex')).toBe('-1');
    expect(query('.ds-input__clear')!.getAttribute('aria-label')).toBe('Clear');
  });

  it('hides decorative icons and affixes from assistive tech', () => {
    host.iconStart.set('search');
    fixture.detectChanges();
    expect(query('ds-icon svg')!.getAttribute('aria-hidden')).toBe('true');

    host.iconStart.set(null);
    host.prefix.set('$');
    fixture.detectChanges();
    expect(query('.ds-input__affix')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('disables the native control, not just its looks', () => {
    host.disabled.set(true);
    fixture.detectChanges();

    expect(input().disabled).toBeTrue();
    expect(query('.ds-input__wrap')!.classList).toContain('ds-input__wrap--disabled');
  });

  it('marks required on the control, and the asterisk as decoration', () => {
    host.required.set(true);
    fixture.detectChanges();

    expect(input().required).toBeTrue();
    expect(query('.ds-field__required')!.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('InputComponent + reactive forms', () => {
  @Component({
    standalone: true,
    imports: [InputComponent, ReactiveFormsModule],
    template: `<ds-input label="Email" [formControl]="control" />`,
  })
  class FormHostComponent {
    readonly control = new FormControl<string | null>('ada@paint.dev', Validators.required);
  }

  let fixture: ComponentFixture<FormHostComponent>;
  let host: FormHostComponent;
  const input = () => fixture.nativeElement.querySelector('input') as HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FormHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(FormHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the control’s value', () => {
    expect(input().value).toBe('ada@paint.dev');
  });

  it('pushes user input into the control', () => {
    input().value = 'grace@paint.dev';
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.control.value).toBe('grace@paint.dev');
    expect(host.control.dirty).toBeTrue();
  });

  it('marks itself touched on blur', () => {
    expect(host.control.touched).toBeFalse();
    input().dispatchEvent(new Event('blur'));
    expect(host.control.touched).toBeTrue();
  });

  it('follows the forms API when the control is disabled', () => {
    host.control.disable();
    fixture.detectChanges();
    expect(input().disabled).toBeTrue();

    host.control.enable();
    fixture.detectChanges();
    expect(input().disabled).toBeFalse();
  });

  it('accepts a reset', () => {
    host.control.reset();
    fixture.detectChanges();
    expect(input().value).toBe('');
  });
});
