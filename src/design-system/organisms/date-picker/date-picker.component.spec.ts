import { Component, signal } from '@angular/core';
import { TestBed, fakeAsync, tick, type ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { IsoDate } from '../../utils';
import { DatePickerComponent } from './date-picker.component';

/** March 2026: starts on a Sunday, and the 4th is a Wednesday. */
const TODAY: IsoDate = '2026-03-04';

@Component({
  standalone: true,
  imports: [DatePickerComponent],
  template: `
    <ds-date-picker
      label="Invoice date"
      [today]="today"
      [(value)]="value"
      [min]="min()"
      (changed)="changes.push($event)"
      (openChange)="opens.push($event)"
    />
    <button type="button" id="outside">outside</button>
  `,
})
class HostComponent {
  readonly today = TODAY;
  value: IsoDate | null = null;
  readonly min = signal<IsoDate | null>(null);
  changes: Array<IsoDate | null> = [];
  opens: boolean[] = [];
}

describe('DatePickerComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const textbox = (): HTMLInputElement =>
    fixture.nativeElement.querySelector('ds-date-input input');
  const trigger = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('.ds-date-input__trigger button');
  const panel = (): HTMLElement | null =>
    fixture.nativeElement.querySelector('.ds-date-picker__panel');
  const day = (iso: IsoDate): HTMLButtonElement | null =>
    fixture.nativeElement.querySelector(`[data-date="${iso}"]`);

  const open = () => {
    trigger().click();
    fixture.detectChanges();
    tick(); // placement + focus macrotask
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('is a field first: closed, typed into, committed', () => {
    expect(panel()).toBeNull();

    textbox().value = '2026-03-12';
    textbox().dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    textbox().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(host.value).toBe('2026-03-12');
    expect(host.changes).toEqual(['2026-03-12']);
    expect(panel()).toBeNull();
  });

  it('wires the trigger to the dialog it now actually opens', fakeAsync(() => {
    expect(trigger().getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');

    open();
    expect(panel()).toBeTruthy();
    expect(panel()!.getAttribute('role')).toBe('dialog');
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(trigger().getAttribute('aria-controls')).toBe(panel()!.id);
    expect(host.opens).toEqual([true]);
  }));

  it('moves focus into the grid on open, onto the day that matters', fakeAsync(() => {
    host.value = '2026-03-12';
    fixture.detectChanges();

    open();
    expect(document.activeElement).toBe(day('2026-03-12'));
  }));

  it('opens on ArrowDown, the way date fields always have', fakeAsync(() => {
    textbox().focus();
    textbox().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(panel()).toBeTruthy();
    expect(document.activeElement).toBe(day(TODAY));
  }));

  it('picking a day commits, closes and returns focus to the field', fakeAsync(() => {
    open();
    day('2026-03-20')!.click();
    fixture.detectChanges();
    tick();

    expect(host.value).toBe('2026-03-20');
    expect(host.changes).toEqual(['2026-03-20']);
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(textbox());
    // The field shows what the grid chose.
    expect(textbox().value).toBe('2026-03-20');
  }));

  it('closes on Escape, back to the field, without the key escaping further', fakeAsync(() => {
    open();
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    const stop = spyOn(escape, 'stopPropagation').and.callThrough();
    panel()!.dispatchEvent(escape);
    fixture.detectChanges();
    tick();

    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(textbox());
    expect(stop).toHaveBeenCalled();
    expect(host.opens).toEqual([true, false]);
  }));

  it('closes on an outside click, without stealing focus back', fakeAsync(() => {
    open();
    (fixture.nativeElement.querySelector('#outside') as HTMLElement).click();
    fixture.detectChanges();

    expect(panel()).toBeNull();
  }));

  it('never holds Tab: focus leaving closes the dialog behind itself', fakeAsync(() => {
    open();
    panel()!.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: fixture.nativeElement.querySelector('#outside'),
      }),
    );
    fixture.detectChanges();

    expect(panel()).toBeNull();
  }));

  it('the grid and the field share one set of rules', fakeAsync(() => {
    host.min.set('2026-03-10');
    fixture.detectChanges();

    open();
    const early = day('2026-03-05')!;
    expect(early.getAttribute('aria-disabled')).toBe('true');

    early.click();
    fixture.detectChanges();
    tick();

    // A disabled day is readable, not pickable — the dialog stays.
    expect(host.value).toBeNull();
    expect(panel()).toBeTruthy();
  }));

  it('speaks ControlValueAccessor', fakeAsync(() => {
    @Component({
      standalone: true,
      imports: [DatePickerComponent, ReactiveFormsModule],
      template: `<ds-date-picker [today]="'2026-03-04'" [formControl]="control" />`,
    })
    class FormHost {
      readonly control = new FormControl<IsoDate | null>('2026-03-02');
    }

    const form = TestBed.createComponent(FormHost);
    form.detectChanges();

    const input = form.nativeElement.querySelector('ds-date-input input') as HTMLInputElement;
    expect(input.value).toBe('2026-03-02');

    (form.nativeElement.querySelector('.ds-date-input__trigger button') as HTMLElement).click();
    form.detectChanges();
    tick();
    form.detectChanges();

    (form.nativeElement.querySelector('[data-date="2026-03-09"]') as HTMLElement).click();
    form.detectChanges();
    tick();

    expect(form.componentInstance.control.value).toBe('2026-03-09');

    form.componentInstance.control.disable();
    form.detectChanges();
    expect(input.disabled).toBeTrue();
  }));
});
