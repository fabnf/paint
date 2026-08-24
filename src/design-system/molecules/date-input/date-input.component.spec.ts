import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { FormFieldComponent } from '../form-field';
import { DateInputComponent } from './date-input.component';
import type { DateMatcher, DateOrder, IsoDate } from '../../utils';

@Component({
  standalone: true,
  imports: [DateInputComponent],
  template: `
    <ds-date-input
      label="Invoice date"
      [(value)]="value"
      [order]="order()"
      [separator]="separator()"
      [min]="min()"
      [max]="max()"
      [dateDisabled]="unavailable()"
      [trigger]="trigger()"
      [disabled]="disabled()"
      [(open)]="open"
      (changed)="commits.push($event)"
      (triggerClick)="requests = requests + 1"
    />
    <button type="button" id="outside">outside</button>
  `,
})
class HostComponent {
  value: IsoDate | null = null;
  open = false;
  readonly order = signal<DateOrder>('ymd');
  readonly separator = signal('-');
  readonly min = signal<IsoDate | null>(null);
  readonly max = signal<IsoDate | null>(null);
  readonly unavailable = signal<DateMatcher | null>(null);
  readonly trigger = signal(true);
  readonly disabled = signal(false);
  commits: Array<IsoDate | null> = [];
  requests = 0;
}

describe('DateInputComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);

  const field = () => query<HTMLInputElement>('input')!;
  const trigger = () => query<HTMLButtonElement>('.ds-date-input__trigger button');

  const type = (text: string) => {
    field().value = text;
    field().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const blur = () => {
    fixture.nativeElement
      .querySelector('ds-date-input')!
      .dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    fixture.detectChanges();
  };

  const enter = () => {
    field().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('is a text field, not a native date picker', () => {
    // `type="date"` hands the UI to the OS and the value to the time zone.
    expect(field().type).toBe('text');
    expect(field().getAttribute('inputmode')).toBe('numeric');
    expect(field().getAttribute('placeholder')).toBe('yyyy-mm-dd');
  });

  it('commits on blur, and reformats what was typed', () => {
    type('2026-3-4');
    expect(host.value).toBeNull();

    blur();
    expect(host.value).toBe('2026-03-04');
    expect(field().value).toBe('2026-03-04');
    expect(host.commits).toEqual(['2026-03-04']);
  });

  it('commits on Enter, without waiting for the field to be left', () => {
    type('20260304');
    enter();

    expect(host.value).toBe('2026-03-04');
    expect(field().value).toBe('2026-03-04');
  });

  it('never commits on a keystroke', () => {
    type('2026-03-04');
    expect(host.value).toBeNull();
    expect(host.commits).toEqual([]);
  });

  it('parses the order it was given, and formats it back', () => {
    host.order.set('dmy');
    host.separator.set('/');
    fixture.detectChanges();

    expect(field().getAttribute('placeholder')).toBe('dd/mm/yyyy');

    type('4/3/26');
    blur();

    expect(host.value).toBe('2026-03-04');
    expect(field().value).toBe('04/03/2026');
  });

  it('says so when the text is not a date, and keeps the text', () => {
    type('31/02/2026');
    blur();

    expect(host.value).toBeNull();
    expect(field().value).toBe('31/02/2026');
    expect(field().getAttribute('aria-invalid')).toBe('true');
    expect(query('.ds-field__error')!.textContent).toContain('Enter a date as yyyy-mm-dd.');
  });

  it('drops a date that was valid when the text stops being one', () => {
    type('2026-03-04');
    blur();
    expect(host.value).toBe('2026-03-04');

    type('tomorrow');
    blur();

    // Keeping the old date would be a lie about what the field says.
    expect(host.value).toBeNull();
    expect(host.commits).toEqual(['2026-03-04', null]);
  });

  it('clears itself when the text is emptied', () => {
    type('2026-03-04');
    blur();

    type('');
    blur();

    expect(host.value).toBeNull();
    expect(field().getAttribute('aria-invalid')).toBeNull();
    expect(query('.ds-field__error')).toBeNull();
  });

  it('stops complaining as soon as the user starts fixing it', () => {
    type('nonsense');
    blur();
    expect(field().getAttribute('aria-invalid')).toBe('true');

    type('2026-');
    expect(field().getAttribute('aria-invalid')).toBeNull();
  });

  it('flags a date the matcher says is unavailable', () => {
    host.unavailable.set((iso) => iso === '2026-03-07');
    fixture.detectChanges();

    type('2026-03-07');
    blur();

    expect(host.value).toBe('2026-03-07');
    expect(field().getAttribute('aria-invalid')).toBe('true');
    expect(query('.ds-field__error')!.textContent).toContain('not available');
  });

  it('commits an out-of-range date, and flags it', () => {
    host.min.set('2026-03-10');
    fixture.detectChanges();

    type('2026-03-04');
    blur();

    // It is a date. It is the date they typed. It is not allowed.
    expect(host.value).toBe('2026-03-04');
    expect(field().getAttribute('aria-invalid')).toBe('true');
    expect(query('.ds-field__error')!.textContent).toContain('outside the allowed range');
  });

  it('reformats a value written from outside', () => {
    host.order.set('dmy');
    host.separator.set('/');
    host.value = '2026-03-04';
    fixture.detectChanges();

    expect(field().value).toBe('04/03/2026');
  });

  it('does not rewrite the text under the caret while it is being typed', () => {
    // `2026-3-4` already parses to the value; rewriting it mid-keystroke would
    // move the caret and delete the `-` the user is about to type over.
    type('2026-3-4');
    blur();
    expect(field().value).toBe('2026-03-04');

    type('2026-3-4');
    expect(field().value).toBe('2026-3-4');
  });

  it('speaks the committed date, unambiguously', () => {
    host.order.set('dmy');
    host.separator.set('/');
    fixture.detectChanges();

    type('04/03/2026');
    blur();

    // "04/03/2026" is March in London and April in Boston. The live region is not.
    const live = query<HTMLElement>('ds-date-input > span[aria-live="polite"]')!;
    expect(live.textContent!.trim()).toBe('4 March 2026');
    expect(live.classList).toContain('visually-hidden');
  });

  describe('the calendar affordance', () => {
    it('is a button that only asks', () => {
      expect(trigger()!.getAttribute('aria-haspopup')).toBe('dialog');
      expect(trigger()!.getAttribute('aria-expanded')).toBe('false');
      expect(trigger()!.getAttribute('aria-label')).toBe('Choose date');

      trigger()!.click();
      fixture.detectChanges();

      expect(host.open).toBeTrue();
      expect(host.requests).toBe(1);
      expect(trigger()!.getAttribute('aria-expanded')).toBe('true');
      // There is no dialog. That is the organism's job.
      expect(query('[role="dialog"]')).toBeNull();
    });

    it('lives inside the field', () => {
      expect(trigger()!.closest('.ds-input__wrap')).toBeTruthy();
    });

    it('asks for the calendar on ArrowDown', () => {
      field().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      fixture.detectChanges();

      expect(host.open).toBeTrue();
      expect(host.requests).toBe(1);
    });

    it('can be left out entirely', () => {
      host.trigger.set(false);
      fixture.detectChanges();

      expect(trigger()).toBeNull();
      field().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(host.open).toBeFalse();
    });

    it('does not commit when focus moves to its own trigger', () => {
      type('2026-03-04');
      fixture.nativeElement
        .querySelector('ds-date-input')!
        .dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: trigger() }));
      fixture.detectChanges();

      expect(host.commits).toEqual([]);
    });

    it('is disabled with the field', () => {
      host.disabled.set(true);
      fixture.detectChanges();

      expect(field().disabled).toBeTrue();
      expect(trigger()!.disabled).toBeTrue();
    });
  });
});

describe('DateInputComponent inside a FormField', () => {
  @Component({
    standalone: true,
    imports: [DateInputComponent, FormFieldComponent],
    template: `
      <ds-form-field label="Invoice date" hint="Any format." [required]="true">
        <ds-date-input />
      </ds-form-field>
    `,
  })
  class FieldHost {}

  it('adopts the field through the input it wraps', async () => {
    await TestBed.configureTestingModule({
      imports: [FieldHost],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(FieldHost);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
    const hint = fixture.nativeElement.querySelector('.ds-field__hint') as HTMLElement;

    expect(label.getAttribute('for')).toBe(input.id);
    expect(input.getAttribute('aria-describedby')).toBe(hint.id);
    expect(input.required).toBeTrue();
    expect(fixture.nativeElement.querySelectorAll('label').length).toBe(1);
  });
});

describe('DateInputComponent + reactive forms', () => {
  @Component({
    standalone: true,
    imports: [DateInputComponent, ReactiveFormsModule],
    template: `<ds-date-input label="Date" [formControl]="control" />`,
  })
  class FormHostComponent {
    readonly control = new FormControl<IsoDate | null>('2026-03-04');
  }

  let fixture: ComponentFixture<FormHostComponent>;
  let host: FormHostComponent;
  const input = () => fixture.nativeElement.querySelector('input') as HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormHostComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(FormHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the control’s value', () => {
    expect(input().value).toBe('2026-03-04');
  });

  it('pushes a committed date into the control', () => {
    input().value = '2026.3.4';
    input().dispatchEvent(new Event('input'));
    input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(host.control.value).toBe('2026-03-04');
  });

  it('marks itself touched when focus leaves', () => {
    fixture.nativeElement
      .querySelector('ds-date-input')!
      .dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    expect(host.control.touched).toBeTrue();
  });

  it('empties the box on reset', () => {
    host.control.reset();
    fixture.detectChanges();
    expect(input().value).toBe('');
  });

  it('follows the forms API when disabled', () => {
    host.control.disable();
    fixture.detectChanges();
    expect(input().disabled).toBeTrue();
  });
});
