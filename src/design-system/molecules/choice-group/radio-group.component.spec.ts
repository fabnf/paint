import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormFieldComponent } from '../form-field';
import { RadioGroupComponent } from './radio-group.component';
import type { ChoiceOption } from './choice-group.types';

const TARGETS: readonly ChoiceOption<string>[] = [
  { value: 'staging', label: 'Staging' },
  { value: 'prod', label: 'Production', hint: 'Visible to customers immediately.' },
  { value: 'archive', label: 'Archive', disabled: true },
];

@Component({
  standalone: true,
  imports: [RadioGroupComponent],
  template: `
    <ds-radio-group
      [legend]="legend()"
      [legendHidden]="legendHidden()"
      [options]="options"
      [(value)]="value"
      [hint]="hint()"
      [error]="error()"
      [required]="required()"
      [disabled]="disabled()"
      [orientation]="orientation()"
      (changed)="changes.push($event)"
    />
  `,
})
class HostComponent {
  readonly options = TARGETS;
  value: string | null = 'staging';
  readonly legend = signal('Deploy target');
  readonly legendHidden = signal(false);
  readonly hint = signal('');
  readonly error = signal('');
  readonly required = signal(false);
  readonly disabled = signal(false);
  readonly orientation = signal<'vertical' | 'horizontal'>('vertical');
  changes: string[] = [];
}

describe('RadioGroupComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);

  const group = () => query<HTMLFieldSetElement>('fieldset')!;
  const inputs = () =>
    Array.from(fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('is a fieldset with a legend, and a radiogroup to ARIA', () => {
    expect(group().tagName).toBe('FIELDSET');
    expect(group().getAttribute('role')).toBe('radiogroup');

    const legend = query<HTMLLegendElement>('legend')!;
    expect(legend.textContent).toContain('Deploy target');
    expect(group().getAttribute('aria-labelledby')).toBe(legend.id);
  });

  it('renders one radio per option, sharing one generated name', () => {
    expect(inputs().length).toBe(3);
    const names = new Set(inputs().map((input) => input.name));
    expect(names.size).toBe(1);
    expect([...names][0]).toBeTruthy();
  });

  it('checks the radio whose value matches, and reports a pick', () => {
    expect(inputs()[0].checked).toBeTrue();

    inputs()[1].click();
    fixture.detectChanges();

    expect(host.value).toBe('prod');
    expect(host.changes).toEqual(['prod']);
    expect(inputs()[0].checked).toBeFalse();
  });

  it('describes the group with its own hint and error, not the options’', () => {
    host.hint.set('Pick one.');
    host.error.set('You must choose a target.');
    fixture.detectChanges();

    // The group's hint is its own element, above the options; its error is below.
    const hint = query('.ds-choice-group__hint')!;
    const error = query('fieldset > ds-field-messages .ds-field__error')!;

    expect(hint.textContent).toContain('Pick one.');
    expect(group().getAttribute('aria-describedby')).toBe(`${hint.id} ${error.id}`);
  });

  it('marks the radios invalid, where the focus lands — not the group twice', () => {
    host.error.set('You must choose a target.');
    fixture.detectChanges();

    expect(inputs().every((input) => input.getAttribute('aria-invalid') === 'true')).toBeTrue();
    expect(group().getAttribute('aria-invalid')).toBeNull();
  });

  it('carries per-option hints into the radios themselves', () => {
    const hints = fixture.nativeElement.querySelectorAll(
      '.ds-choice-group__options .ds-field__hint',
    ) as NodeListOf<HTMLElement>;

    expect(hints.length).toBe(1);
    expect(hints[0].textContent).toContain('Visible to customers immediately.');
    expect(inputs()[1].getAttribute('aria-describedby')).toBe(hints[0].id);
  });

  it('requires the group and every radio in it', () => {
    host.required.set(true);
    fixture.detectChanges();

    expect(group().getAttribute('aria-required')).toBe('true');
    expect(inputs().every((input) => input.required)).toBeTrue();
    expect(query('.ds-field__required')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('disables one option without disabling the group', () => {
    expect(inputs()[2].disabled).toBeTrue();
    expect(inputs()[0].disabled).toBeFalse();
  });

  it('disables the whole group with the fieldset', () => {
    host.disabled.set(true);
    fixture.detectChanges();

    expect(group().disabled).toBeTrue();
    expect(inputs().every((input) => input.disabled)).toBeTrue();
  });

  it('hides the legend without losing the group’s name', () => {
    host.legendHidden.set(true);
    fixture.detectChanges();

    const legend = query<HTMLLegendElement>('legend')!;
    expect(legend.classList).toContain('visually-hidden');
    expect(group().getAttribute('aria-labelledby')).toBe(legend.id);
  });

  it('lays the options out on one line when asked', () => {
    host.orientation.set('horizontal');
    fixture.detectChanges();

    expect(query('.ds-choice-group__options')!.classList).toContain(
      'ds-choice-group__options--horizontal',
    );
    expect(group().getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('is a field in its own right: a FormField above it does not reach in', async () => {
    @Component({
      standalone: true,
      imports: [RadioGroupComponent, FormFieldComponent],
      template: `
        <ds-form-field label="Outer" hint="Outer hint">
          <ds-radio-group legend="Target" [options]="options" />
        </ds-form-field>
      `,
    })
    class NestedHost {
      readonly options = TARGETS;
    }

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({ imports: [NestedHost] }).compileComponents();
    const nested = TestBed.createComponent(NestedHost);
    nested.detectChanges();

    const radios = Array.from(
      nested.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>,
    );
    const ids = new Set(radios.map((input) => input.id));
    // The *field's* hint, not the per-option hint the group renders inside it.
    const outerHintId = (
      nested.nativeElement.querySelector(
        'ds-form-field > .ds-field > ds-field-messages .ds-field__hint',
      ) as HTMLElement
    ).id;

    // Three radios, three ids. Without the DS_FIELD cut-off they would all have
    // adopted the field's one id, its label would name all three, and its hint
    // would describe each of them.
    expect(ids.size).toBe(3);
    expect(
      radios.every((input) => !(input.getAttribute('aria-describedby') ?? '').includes(outerHintId)),
    ).toBeTrue();
  });
});

describe('RadioGroupComponent + reactive forms', () => {
  @Component({
    standalone: true,
    imports: [RadioGroupComponent, ReactiveFormsModule],
    template: `<ds-radio-group legend="Target" [options]="options" [formControl]="control" />`,
  })
  class FormHostComponent {
    readonly options = TARGETS;
    readonly control = new FormControl<string | null>('prod');
  }

  let fixture: ComponentFixture<FormHostComponent>;
  let host: FormHostComponent;
  const inputs = () =>
    Array.from(fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FormHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(FormHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('checks the radio the control points at', () => {
    expect(inputs()[1].checked).toBeTrue();
  });

  it('writes the picked value back, and marks itself touched', () => {
    inputs()[0].click();
    fixture.detectChanges();

    expect(host.control.value).toBe('staging');
    expect(host.control.touched).toBeTrue();
  });

  it('follows the forms API when disabled', () => {
    host.control.disable();
    fixture.detectChanges();
    expect(inputs().every((input) => input.disabled)).toBeTrue();
  });
});
