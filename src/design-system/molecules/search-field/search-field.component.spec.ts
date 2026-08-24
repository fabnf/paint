import { Component, signal } from '@angular/core';
import { TestBed, fakeAsync, tick, type ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SearchFieldComponent } from './search-field.component';

@Component({
  standalone: true,
  imports: [SearchFieldComponent],
  template: `
    <ds-search-field
      [label]="label()"
      [labelHidden]="labelHidden()"
      [(value)]="value"
      [debounce]="debounce()"
      [loading]="loading()"
      [resultCount]="resultCount()"
      [landmark]="landmark()"
      (search)="searches.push($event)"
      (submitted)="submits.push($event)"
      (cleared)="clears = clears + 1"
    />
  `,
})
class HostComponent {
  value = '';
  readonly label = signal('Search invoices');
  readonly labelHidden = signal(false);
  readonly debounce = signal(300);
  readonly loading = signal(false);
  readonly resultCount = signal<number | null>(null);
  readonly landmark = signal(false);
  searches: string[] = [];
  submits: string[] = [];
  clears = 0;
}

describe('SearchFieldComponent', () => {
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

  it('is a search input, labelled, with the browser’s own affordances', () => {
    expect(input().type).toBe('search');
    expect(query<HTMLLabelElement>('label')!.getAttribute('for')).toBe(input().id);
    expect(input().getAttribute('autocomplete')).toBe('off');
  });

  it('hides the label without losing it', () => {
    host.labelHidden.set(true);
    fixture.detectChanges();

    expect(query('label')).toBeNull();
    expect(input().getAttribute('aria-label')).toBe('Search invoices');
  });

  it('is not a landmark unless it is the landmark', () => {
    const field = fixture.nativeElement.querySelector('ds-search-field') as HTMLElement;
    expect(field.getAttribute('role')).toBeNull();

    host.landmark.set(true);
    fixture.detectChanges();
    expect(field.getAttribute('role')).toBe('search');
  });

  it('debounces: keystrokes are not queries', fakeAsync(() => {
    type('pa');
    type('pai');
    type('paint');
    expect(host.searches).toEqual([]);

    tick(299);
    expect(host.searches).toEqual([]);

    tick(1);
    expect(host.searches).toEqual(['paint']);
  }));

  it('emits on every keystroke when the debounce is off', fakeAsync(() => {
    host.debounce.set(0);
    fixture.detectChanges();

    type('pa');
    type('paint');
    expect(host.searches).toEqual(['pa', 'paint']);
  }));

  it('answers a clear immediately — emptying a filter is not a thought in progress', fakeAsync(() => {
    type('paint');
    tick(300);
    host.searches = [];

    type('');
    expect(host.searches).toEqual(['']);
    expect(host.clears).toBe(1);
    tick(300);
    expect(host.searches).toEqual(['']);
  }));

  it('flushes the pending debounce on Enter, and submits once', fakeAsync(() => {
    type('paint');
    input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(host.searches).toEqual(['paint']);
    expect(host.submits).toEqual(['paint']);

    // The timer was cancelled, not raced.
    tick(300);
    expect(host.searches).toEqual(['paint']);
  }));

  it('never runs the same query twice', fakeAsync(() => {
    type('paint');
    tick(300);
    input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(host.searches).toEqual(['paint']);
    expect(host.submits).toEqual(['paint']);
  }));

  it('puts a decorative spinner inside the field while a query is in flight', () => {
    expect(query('.ds-spinner')).toBeNull();

    host.loading.set(true);
    fixture.detectChanges();

    const spinner = query('.ds-spinner')!;
    expect(spinner.closest('.ds-input__wrap')).toBeTruthy();
    expect(spinner.getAttribute('aria-hidden')).toBe('true');
  });

  it('announces the settled result count, politely, from a region that pre-exists', fakeAsync(() => {
    const status = query('[role="status"]')!;
    expect(status.textContent!.trim()).toBe('');

    host.loading.set(true);
    fixture.detectChanges();
    expect(status.textContent!.trim()).toBe('Searching…');

    host.loading.set(false);
    host.resultCount.set(12);
    type('paint');
    tick(300);
    fixture.detectChanges();

    expect(status.textContent!.trim()).toBe('12 results');

    host.resultCount.set(1);
    fixture.detectChanges();
    expect(status.textContent!.trim()).toBe('1 result');
  }));

  it('says nothing before the first query has settled', () => {
    host.resultCount.set(12);
    fixture.detectChanges();
    expect(query('[role="status"]')!.textContent!.trim()).toBe('');
  });

  it('describes the field by its status, so the count survives a re-focus', () => {
    expect(input().getAttribute('aria-describedby')).toBe(query('[role="status"]')!.id);
  });
});

describe('SearchFieldComponent + reactive forms', () => {
  @Component({
    standalone: true,
    imports: [SearchFieldComponent, ReactiveFormsModule],
    template: `<ds-search-field label="Search" [formControl]="control" [debounce]="0" />`,
  })
  class FormHostComponent {
    readonly control = new FormControl('invoices');
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
    expect(input().value).toBe('invoices');
  });

  it('pushes typing into the control', () => {
    input().value = 'paint';
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.control.value).toBe('paint');
  });

  it('marks itself touched when focus leaves', () => {
    input().dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    expect(host.control.touched).toBeTrue();
  });

  it('follows the forms API when disabled', () => {
    host.control.disable();
    fixture.detectChanges();
    expect(input().disabled).toBeTrue();
  });
});
