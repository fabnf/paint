import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CheckboxGroupComponent } from './checkbox-group.component';
import type { ChoiceOption } from './choice-group.types';

const SCOPES: readonly ChoiceOption<string>[] = [
  { value: 'read', label: 'Read tokens', hint: 'See every token and theme.' },
  { value: 'write', label: 'Write tokens' },
  { value: 'admin', label: 'Manage members' },
  { value: 'owner', label: 'Transfer ownership', disabled: true },
];

@Component({
  standalone: true,
  imports: [CheckboxGroupComponent],
  template: `
    <ds-checkbox-group
      legend="Scopes"
      [options]="options"
      [(value)]="value"
      [hint]="hint()"
      [error]="error()"
      [required]="required()"
      [disabled]="disabled()"
      [selectAll]="selectAll()"
      (changed)="changes.push($event)"
    />
  `,
})
class HostComponent {
  readonly options = SCOPES;
  value: readonly string[] = ['read'];
  readonly hint = signal('');
  readonly error = signal('');
  readonly required = signal(false);
  readonly disabled = signal(false);
  readonly selectAll = signal(false);
  changes: ReadonlyArray<readonly string[]> = [];
}

describe('CheckboxGroupComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);

  const group = () => query<HTMLFieldSetElement>('fieldset')!;
  const boxes = () =>
    Array.from(
      fixture.nativeElement.querySelectorAll(
        '.ds-choice-group__options input',
      ) as NodeListOf<HTMLInputElement>,
    );
  const master = () => query<HTMLInputElement>('.ds-choice-group__master input')!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('is a fieldset with a legend — and not an invented ARIA widget', () => {
    expect(group().tagName).toBe('FIELDSET');
    // There is no role="checkboxgroup"; a fieldset already says "group".
    expect(group().getAttribute('role')).toBeNull();
    expect(query('legend')!.textContent).toContain('Scopes');
  });

  it('checks the boxes whose values are in the array', () => {
    expect(boxes().map((box) => box.checked)).toEqual([true, false, false, false]);
  });

  it('adds and removes values, keeping the options’ own order', () => {
    boxes()[2].click();
    fixture.detectChanges();
    expect(host.value).toEqual(['read', 'admin']);

    boxes()[1].click();
    fixture.detectChanges();
    // 'write' comes before 'admin' in the options, and so it does in the value.
    expect(host.value).toEqual(['read', 'write', 'admin']);

    boxes()[0].click();
    fixture.detectChanges();
    expect(host.value).toEqual(['write', 'admin']);
  });

  it('describes the group with its own hint and error, not the options’', () => {
    host.hint.set('You can change these later.');
    host.error.set('Pick at least one.');
    fixture.detectChanges();

    const hint = query('.ds-choice-group__hint')!;
    const error = query('fieldset > ds-field-messages .ds-field__error')!;

    expect(hint.textContent).toContain('You can change these later.');
    expect(group().getAttribute('aria-describedby')).toBe(`${hint.id} ${error.id}`);
  });

  it('carries a per-option hint into the checkbox it belongs to', () => {
    const hint = query('.ds-choice-group__options .ds-field__hint')!;
    expect(hint.textContent).toContain('See every token and theme.');
    expect(boxes()[0].getAttribute('aria-describedby')).toBe(hint.id);
  });

  it('disables one option, and the whole group', () => {
    expect(boxes()[3].disabled).toBeTrue();

    host.disabled.set(true);
    fixture.detectChanges();
    expect(group().disabled).toBeTrue();
  });

  describe('select all', () => {
    beforeEach(() => {
      host.selectAll.set(true);
      fixture.detectChanges();
    });

    it('is mixed while some are checked', () => {
      expect(master().indeterminate).toBeTrue();
      expect(master().checked).toBeFalse();
    });

    it('selects every enabled option when clicked, and says so', () => {
      master().click();
      fixture.detectChanges();

      expect(host.value).toEqual(['read', 'write', 'admin']);
      expect(master().checked).toBeTrue();
      expect(master().indeterminate).toBeFalse();
    });

    it('clears only what the user could have ticked', () => {
      host.value = ['read', 'write', 'admin', 'owner'];
      fixture.detectChanges();
      expect(master().checked).toBeTrue();

      master().click();
      fixture.detectChanges();

      // 'owner' is disabled: the user cannot untick it, so neither does the master.
      expect(host.value).toEqual(['owner']);
    });

    it('ignores disabled options when deciding whether all are selected', () => {
      host.value = ['read', 'write', 'admin'];
      fixture.detectChanges();

      expect(master().checked).toBeTrue();
      expect(master().indeterminate).toBeFalse();
    });
  });
});

describe('CheckboxGroupComponent + reactive forms', () => {
  @Component({
    standalone: true,
    imports: [CheckboxGroupComponent, ReactiveFormsModule],
    template: `<ds-checkbox-group legend="Scopes" [options]="options" [formControl]="control" />`,
  })
  class FormHostComponent {
    readonly options = SCOPES;
    readonly control = new FormControl<readonly string[]>(['write']);
  }

  let fixture: ComponentFixture<FormHostComponent>;
  let host: FormHostComponent;
  const boxes = () =>
    Array.from(fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FormHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(FormHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the control’s array', () => {
    expect(boxes()[1].checked).toBeTrue();
  });

  it('writes an array back, and marks itself touched', () => {
    boxes()[0].click();
    fixture.detectChanges();

    expect(host.control.value).toEqual(['read', 'write']);
    expect(host.control.touched).toBeTrue();
  });

  it('follows the forms API when disabled', () => {
    host.control.disable();
    fixture.detectChanges();
    expect(boxes().every((box) => box.disabled)).toBeTrue();
  });
});
