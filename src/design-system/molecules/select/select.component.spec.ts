import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { SelectComponent } from './select.component';
import { toSelectRows, type SelectOption, type SelectValue } from './select.types';

const OPTIONS: readonly SelectOption[] = [
  { value: 'ada', label: 'Ada Lovelace', group: 'Engineering' },
  { value: 'grace', label: 'Grace Hopper', description: 'Admiral', group: 'Engineering' },
  { value: 'alan', label: 'Alan Turing', group: 'Research' },
  { value: 'vacant', label: 'Unassigned', disabled: true },
];

@Component({
  standalone: true,
  imports: [SelectComponent],
  template: `
    <ds-select
      [options]="options"
      [(value)]="value"
      [multiple]="multiple()"
      [searchable]="searchable()"
      [clearable]="clearable()"
      [disabled]="disabled()"
      label="Owner"
      (selectionChange)="changes.push($event)"
    />
    <button type="button" id="outside">outside</button>
  `,
})
class HostComponent {
  readonly options = OPTIONS;
  value: SelectValue | SelectValue[] | null = null;
  readonly multiple = signal(false);
  readonly searchable = signal(false);
  readonly clearable = signal(false);
  readonly disabled = signal(false);
  changes: Array<SelectValue | SelectValue[] | null> = [];
}

describe('toSelectRows', () => {
  it('keeps ungrouped options first and gathers groups in first-seen order', () => {
    const rows = toSelectRows(OPTIONS);

    expect(rows.map((row) => row.label)).toEqual([
      'Unassigned',
      'Engineering',
      'Ada Lovelace',
      'Grace Hopper',
      'Research',
      'Alan Turing',
    ]);
  });

  it('numbers options in rendered order, skipping headers', () => {
    const rows = toSelectRows(OPTIONS);
    const options = rows.filter((row) => row.kind === 'option');

    expect(options.map((row) => row.optionIndex)).toEqual([0, 1, 2, 3]);
  });
});

describe('SelectComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const trigger = (): HTMLButtonElement => fixture.nativeElement.querySelector('.ds-select__trigger');
  const field = (): HTMLElement => fixture.nativeElement.querySelector('.ds-select__field');
  const panel = (): HTMLElement | null => fixture.nativeElement.querySelector('[role="listbox"]');
  const options = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('[role="option"]'));
  const chips = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll('.ds-select__chip'));
  const open = () => {
    trigger().click();
    fixture.detectChanges();
  };
  const keydown = (key: string) => {
    trigger().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a combobox trigger inside a Bootstrap form-control field', () => {
    expect(field().classList).toContain('form-control');
    expect(trigger().getAttribute('role')).toBe('combobox');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(trigger().getAttribute('aria-haspopup')).toBe('listbox');
    expect(panel()).toBeNull();
  });

  it('shows the placeholder until something is selected', () => {
    expect(fixture.nativeElement.querySelector('.ds-select__placeholder')).toBeTruthy();
  });

  it('opens a listbox with grouped options', () => {
    open();

    expect(panel()!.getAttribute('role')).toBe('listbox');
    expect(options().length).toBe(4);
    expect(panel()!.querySelectorAll('.dropdown-header').length).toBe(2);
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
  });

  // —— single ——

  it('picks a value, closes, and emits once', () => {
    open();
    options()[1].click();
    fixture.detectChanges();

    expect(host.value).toBe('ada');
    expect(host.changes).toEqual(['ada']);
    expect(panel()).toBeNull();
    expect(fixture.nativeElement.querySelector('.ds-select__single-label').textContent).toContain(
      'Ada Lovelace',
    );
  });

  it('marks the selected option for assistive tech', () => {
    host.value = 'ada';
    fixture.detectChanges();
    open();

    expect(options()[1].getAttribute('aria-selected')).toBe('true');
    expect(options()[2].getAttribute('aria-selected')).toBe('false');
  });

  it('ignores disabled options', () => {
    open();
    options()[0].click();
    fixture.detectChanges();

    expect(host.value).toBeNull();
    expect(host.changes).toEqual([]);
  });

  // —— multiple ——

  it('accumulates values, keeps the panel open, and renders chips', () => {
    host.multiple.set(true);
    fixture.detectChanges();
    open();

    options()[1].click();
    fixture.detectChanges();
    options()[2].click();
    fixture.detectChanges();

    expect(host.value).toEqual(['ada', 'grace']);
    expect(panel()).toBeTruthy();
    expect(chips().length).toBe(2);
  });

  it('toggles a selected value off', () => {
    host.multiple.set(true);
    host.value = ['ada'];
    fixture.detectChanges();
    open();

    options()[1].click();
    fixture.detectChanges();

    expect(host.value).toEqual([]);
  });

  it('draws a checkbox in multiple mode without nesting a control in the option', () => {
    host.multiple.set(true);
    fixture.detectChanges();
    open();

    const check = options()[1].querySelector('.ds-select__check')!;

    expect(check).toBeTruthy();
    expect(check.getAttribute('aria-hidden')).toBe('true');
    // A listbox option must not contain a focusable control.
    expect(options()[1].querySelector('input, button, a, [tabindex]')).toBeNull();
    expect(panel()!.getAttribute('aria-multiselectable')).toBe('true');
  });

  it('exposes options as plain listbox items', () => {
    open();

    expect(options()[0].tagName).toBe('LI');
    expect(panel()!.querySelectorAll('button, input').length).toBe(0);
  });

  it('names the combobox by its label and its value', () => {
    host.value = 'ada';
    fixture.detectChanges();

    const labelledBy = trigger().getAttribute('aria-labelledby')!.split(' ');

    expect(labelledBy.length).toBe(2);
    const name = labelledBy
      .map((id) => document.getElementById(id)!.textContent!.trim())
      .join(' ');
    expect(name).toContain('Owner');
    expect(name).toContain('Ada Lovelace');
  });

  it('keeps chip removal and clearing outside the combobox', () => {
    host.multiple.set(true);
    host.clearable.set(true);
    host.value = ['ada'];
    fixture.detectChanges();

    // Controls live in the field, as siblings of the combobox button.
    expect(trigger().querySelector('button')).toBeNull();
    expect(field().querySelectorAll('button').length).toBe(3); // chip remove, combobox, clear
  });

  it('describes multiple mode with a keyboard hint', () => {
    host.multiple.set(true);
    fixture.detectChanges();

    const describedBy = trigger().getAttribute('aria-describedby')!;
    expect(document.getElementById(describedBy)!.textContent).toContain('Backspace');
  });

  it('removes a chip without opening the panel', () => {
    host.multiple.set(true);
    host.value = ['ada', 'grace'];
    fixture.detectChanges();

    (chips()[0].querySelector('.ds-select__chip-remove') as HTMLElement).click();
    fixture.detectChanges();

    expect(host.value).toEqual(['grace']);
    expect(panel()).toBeNull();
  });

  it('peels the last chip off with Backspace when the filter is empty', () => {
    host.multiple.set(true);
    host.value = ['ada', 'grace'];
    fixture.detectChanges();
    open();
    keydown('Backspace');

    expect(host.value).toEqual(['ada']);
  });

  // —— clearing ——

  it('clears to null in single mode and to [] in multiple mode', () => {
    host.clearable.set(true);
    host.value = 'ada';
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.ds-select__clear') as HTMLElement).click();
    fixture.detectChanges();
    expect(host.value).toBeNull();

    host.multiple.set(true);
    host.value = ['ada'];
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.ds-select__clear') as HTMLElement).click();
    fixture.detectChanges();
    expect(host.value).toEqual([]);
  });

  // —— search ——

  it('filters on label, description and group', () => {
    host.searchable.set(true);
    fixture.detectChanges();
    open();

    const search: HTMLInputElement = fixture.nativeElement.querySelector('.ds-select__search-input');

    search.value = 'admiral';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(options().length).toBe(1);

    search.value = 'research';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(options().length).toBe(1);

    search.value = 'nothing here';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(options().length).toBe(0);
    expect(fixture.nativeElement.querySelector('.ds-select__empty')).toBeTruthy();
  });

  // —— keyboard ——

  it('opens with ArrowDown and tracks the active option with aria-activedescendant', () => {
    keydown('ArrowDown');
    expect(panel()).toBeTruthy();

    const active = trigger().getAttribute('aria-activedescendant');
    expect(active).toBeTruthy();
    expect(document.getElementById(active!)!.getAttribute('role')).toBe('option');
  });

  it('skips disabled options with the arrows and picks with Enter', () => {
    open();
    // Starts on the first enabled option (Ada); move down to Grace.
    keydown('ArrowDown');
    keydown('Enter');

    expect(host.value).toBe('grace');
  });

  it('closes on Escape', () => {
    open();
    keydown('Escape');

    expect(panel()).toBeNull();
  });

  it('closes on an outside click', () => {
    open();
    fixture.nativeElement.querySelector('#outside').click();
    fixture.detectChanges();

    expect(panel()).toBeNull();
  });

  it('cannot be opened when disabled', () => {
    host.disabled.set(true);
    fixture.detectChanges();

    expect(trigger().disabled).toBeTrue();

    keydown('ArrowDown');
    expect(panel()).toBeNull();
  });
});

// —— forms ——

@Component({
  standalone: true,
  imports: [SelectComponent, ReactiveFormsModule],
  template: `<ds-select [options]="options" [formControl]="control" label="Owner" />`,
})
class FormHostComponent {
  readonly options = OPTIONS;
  readonly control = new FormControl<SelectValue | null>(null, Validators.required);
}

describe('SelectComponent + reactive forms', () => {
  let fixture: ComponentFixture<FormHostComponent>;
  let host: FormHostComponent;

  const trigger = (): HTMLButtonElement => fixture.nativeElement.querySelector('.ds-select__trigger');
  const field = (): HTMLElement => fixture.nativeElement.querySelector('.ds-select__field');
  const options = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('[role="option"]'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FormHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(FormHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('starts invalid, pristine and untouched', () => {
    expect(host.control.invalid).toBeTrue();
    expect(host.control.touched).toBeFalse();
  });

  it('writes the control value through and validates', () => {
    trigger().click();
    fixture.detectChanges();
    options()[1].click();
    fixture.detectChanges();

    expect(host.control.value).toBe('ada');
    expect(host.control.valid).toBeTrue();
    expect(host.control.touched).toBeTrue();
  });

  it('reflects a value set from the form', () => {
    host.control.setValue('alan');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ds-select__single-label').textContent).toContain(
      'Alan Turing',
    );
  });

  it('honours control.disable()', () => {
    host.control.disable();
    fixture.detectChanges();

    expect(trigger().disabled).toBeTrue();
  });
});
