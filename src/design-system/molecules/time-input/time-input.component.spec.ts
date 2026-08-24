import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TimeInputComponent } from './time-input.component';
import type { IsoTime } from '../../utils';

@Component({
  standalone: true,
  imports: [TimeInputComponent],
  template: `
    <ds-time-input
      label="Starts at"
      [(value)]="value"
      [hour12]="hour12()"
      [withSeconds]="withSeconds()"
      [step]="step()"
      [min]="min()"
      [max]="max()"
      [disabled]="disabled()"
      [readOnly]="readOnly()"
      (changed)="commits.push($event)"
    />
  `,
})
class HostComponent {
  value: IsoTime | null = null;
  readonly hour12 = signal(false);
  readonly withSeconds = signal(false);
  readonly step = signal(1);
  readonly min = signal<IsoTime | null>(null);
  readonly max = signal<IsoTime | null>(null);
  readonly disabled = signal(false);
  readonly readOnly = signal(false);
  commits: Array<IsoTime | null> = [];
}

describe('TimeInputComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);

  const field = () => query<HTMLInputElement>('input')!;

  const type = (text: string) => {
    field().value = text;
    field().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const blur = () => {
    fixture.nativeElement
      .querySelector('ds-time-input')!
      .dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    fixture.detectChanges();
  };

  const press = (key: string) => {
    field().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('is a text field with a clock on it', () => {
    expect(field().type).toBe('text');
    expect(field().getAttribute('placeholder')).toBe('hh:mm');
    expect(query('ds-icon')).toBeTruthy();
  });

  it('commits on blur, and normalises what was typed', () => {
    type('930');
    expect(host.value).toBeNull();

    blur();
    expect(host.value).toBe('09:30');
    expect(field().value).toBe('09:30');
    expect(host.commits).toEqual(['09:30']);
  });

  it('takes what people type', () => {
    for (const [typed, expected] of [
      ['9', '09:00'],
      ['9:3', '09:03'],
      ['0930', '09:30'],
      ['9.30', '09:30'],
      ['23:59', '23:59'],
    ] as const) {
      type(typed);
      blur();
      expect(host.value).withContext(typed).toBe(expected);
    }
  });

  it('understands a twelve-hour clock without storing one', () => {
    host.hour12.set(true);
    fixture.detectChanges();

    expect(field().getAttribute('placeholder')).toBe('h:mm am');

    type('9:30 pm');
    blur();

    // The display is twelve-hour; the value never is.
    expect(host.value).toBe('21:30');
    expect(field().value).toBe('9:30 PM');
  });

  it('keeps seconds only when the field has them', () => {
    type('9:30:45');
    blur();
    expect(host.value).toBe('09:30');

    host.withSeconds.set(true);
    fixture.detectChanges();

    type('9:30:45');
    blur();
    expect(host.value).toBe('09:30:45');
    expect(field().value).toBe('09:30:45');
  });

  it('says so when the text is not a time, and keeps the text', () => {
    type('25:00');
    blur();

    expect(host.value).toBeNull();
    expect(field().value).toBe('25:00');
    expect(field().getAttribute('aria-invalid')).toBe('true');
    expect(query('.ds-field__error')!.textContent).toContain('Enter a time as hh:mm.');
  });

  it('commits an out-of-range time, and flags it', () => {
    host.min.set('09:00');
    host.max.set('17:00');
    fixture.detectChanges();

    type('08:00');
    blur();

    expect(host.value).toBe('08:00');
    expect(field().getAttribute('aria-invalid')).toBe('true');
    expect(query('.ds-field__error')!.textContent).toContain('outside the allowed range');
  });

  it('clears itself when the text is emptied', () => {
    type('09:30');
    blur();

    type('');
    blur();

    expect(host.value).toBeNull();
    expect(field().getAttribute('aria-invalid')).toBeNull();
  });

  describe('stepping', () => {
    it('steps by a minute, and by the step it is given', () => {
      type('09:30');
      blur();

      press('ArrowUp');
      expect(host.value).toBe('09:31');

      host.step.set(15);
      fixture.detectChanges();

      press('ArrowUp');
      expect(host.value).toBe('09:46');
      press('ArrowDown');
      expect(host.value).toBe('09:31');
    });

    it('steps an hour with PageUp and PageDown, whatever the step is', () => {
      host.step.set(15);
      fixture.detectChanges();
      type('09:30');
      blur();

      press('PageUp');
      expect(host.value).toBe('10:30');
      press('PageDown');
      press('PageDown');
      expect(host.value).toBe('08:30');
    });

    it('updates the box as it steps', () => {
      type('09:30');
      blur();

      press('ArrowUp');
      expect(field().value).toBe('09:31');
      expect(host.commits).toEqual(['09:30', '09:31']);
    });

    it('starts at the earliest allowed time when the field is empty', () => {
      host.min.set('09:00');
      host.step.set(30);
      fixture.detectChanges();

      press('ArrowUp');
      expect(host.value).toBe('09:00');
    });

    it('stays inside the bounds: a nudge is not an escape', () => {
      host.min.set('09:00');
      host.max.set('09:45');
      host.step.set(30);
      fixture.detectChanges();

      type('09:30');
      blur();

      press('ArrowUp');
      expect(host.value).toBe('09:45');
      press('ArrowUp');
      expect(host.value).toBe('09:45');

      press('ArrowDown');
      press('ArrowDown');
      expect(host.value).toBe('09:00');
    });

    it('wraps around midnight when nothing bounds it', () => {
      type('23:59');
      blur();

      press('ArrowUp');
      // A time of day has no date to carry into.
      expect(host.value).toBe('00:00');
    });

    it('swallows the key, so the page does not scroll', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true });
      field().dispatchEvent(event);
      expect(event.defaultPrevented).toBeTrue();
    });

    it('does not step a read-only or disabled field', () => {
      type('09:30');
      blur();

      host.readOnly.set(true);
      fixture.detectChanges();
      press('ArrowUp');
      expect(host.value).toBe('09:30');

      host.readOnly.set(false);
      host.disabled.set(true);
      fixture.detectChanges();
      press('ArrowUp');
      expect(host.value).toBe('09:30');
    });
  });

  it('speaks the committed time', () => {
    type('21:30');
    blur();

    const live = query<HTMLElement>('ds-time-input > span[aria-live="polite"]')!;
    expect(live.textContent!.trim()).toBe('21:30');
    expect(live.classList).toContain('visually-hidden');
  });
});

describe('TimeInputComponent + reactive forms', () => {
  @Component({
    standalone: true,
    imports: [TimeInputComponent, ReactiveFormsModule],
    template: `<ds-time-input label="Starts at" [hour12]="true" [formControl]="control" />`,
  })
  class FormHostComponent {
    readonly control = new FormControl<IsoTime | null>('09:30');
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

  it('renders the control’s value in the display clock', () => {
    expect(input().value).toBe('9:30 AM');
    expect(host.control.value).toBe('09:30');
  });

  it('pushes a committed time into the control', () => {
    input().value = '5pm';
    input().dispatchEvent(new Event('input'));
    input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(host.control.value).toBe('17:00');
    expect(input().value).toBe('5:00 PM');
  });

  it('marks itself touched when focus leaves', () => {
    fixture.nativeElement
      .querySelector('ds-time-input')!
      .dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    expect(host.control.touched).toBeTrue();
  });

  it('follows the forms API when disabled', () => {
    host.control.disable();
    fixture.detectChanges();
    expect(input().disabled).toBeTrue();
  });
});
