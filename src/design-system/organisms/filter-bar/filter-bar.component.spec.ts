import { Component, signal } from '@angular/core';
import { TestBed, fakeAsync, tick, type ComponentFixture } from '@angular/core/testing';
import { FilterBarComponent } from './filter-bar.component';
import {
  countActiveFilters,
  EMPTY_FILTER_STATE,
  sameFilterState,
  type FilterDefinition,
  type FilterState,
} from './filter-bar.types';

const FILTERS: readonly FilterDefinition[] = [
  {
    id: 'status',
    label: 'Status',
    icon: 'tag',
    options: [
      { value: 'paid', label: 'Paid' },
      { value: 'sent', label: 'Sent' },
      { value: 'overdue', label: 'Overdue' },
    ],
  },
  {
    id: 'owner',
    label: 'Owner',
    multiple: false,
    options: [
      { value: 'ada', label: 'Ada Lovelace' },
      { value: 'grace', label: 'Grace Hopper' },
    ],
  },
];

@Component({
  standalone: true,
  imports: [FilterBarComponent],
  template: `
    <ds-filter-bar
      [filters]="filters"
      [(state)]="state"
      [applyMode]="applyMode()"
      [searchDebounce]="0"
      searchLabel="Search invoices"
      (stateChange)="emissions.push($event)"
      (cleared)="clears = clears + 1"
    >
      <button dsFilterBarActions type="button" id="extra">View</button>
    </ds-filter-bar>
  `,
})
class HostComponent {
  readonly filters = FILTERS;
  readonly state = signal<FilterState>(EMPTY_FILTER_STATE);
  readonly applyMode = signal(false);
  emissions: FilterState[] = [];
  clears = 0;
}

describe('FilterBarComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <E extends HTMLElement>(selector: string): E | null =>
    fixture.nativeElement.querySelector(selector);
  const selects = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('ds-select'));
  const chips = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.ds-filter-bar__chips ds-chip'));
  const barButton = (text: string): HTMLButtonElement | null =>
    Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.ds-filter-bar__actions button'),
    ).find((b): b is HTMLButtonElement => !!b.textContent?.includes(text)) ?? null;

  /** Opens a filter's listbox (unless already open) and clicks `label`. */
  const pick = (selectIndex: number, label: string) => {
    if (!selects()[selectIndex].querySelector('[role="option"]')) {
      const field = selects()[selectIndex].querySelector('.ds-select__field') as HTMLElement;
      field.click();
      fixture.detectChanges();
    }
    const option = Array.from(
      selects()[selectIndex].querySelectorAll<HTMLElement>('[role="option"]'),
    ).find((o) => o.textContent!.includes(label))!;
    option.click();
    fixture.detectChanges();
  };

  const typeSearch = (text: string) => {
    const input = query<HTMLInputElement>('ds-search-field input')!;
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    tick(); // zero debounce still schedules
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the search, one summarising select per filter, and the slot', () => {
    expect(query('ds-search-field')).toBeTruthy();
    expect(selects().length).toBe(2);
    expect(selects()[0].textContent).toContain('Status');
    expect(query('#extra')).toBeTruthy();
    // Nothing active: no chip row, no Clear.
    expect(chips().length).toBe(0);
    expect(barButton('Clear')).toBeNull();
  });

  it('live mode: a pick commits immediately, and the trigger summarises', fakeAsync(() => {
    pick(0, 'Paid');
    tick();

    expect(host.state().values['status']).toEqual(['paid']);
    expect(host.emissions.length).toBe(1);

    pick(0, 'Overdue');
    tick();
    expect(host.state().values['status']).toEqual(['paid', 'overdue']);

    // Summary mode: a count in the trigger, not a chip pile.
    expect(selects()[0].textContent).toContain('Status · 2');
    expect(selects()[0].querySelector('.ds-select__chips')).toBeNull();
  }));

  it('search lands in the same state object', fakeAsync(() => {
    typeSearch('mural');
    expect(host.state().search).toBe('mural');
    expect(host.emissions[host.emissions.length - 1].search).toBe('mural');
  }));

  it('active selections become labelled chips that remove in place', fakeAsync(() => {
    pick(0, 'Paid');
    pick(1, 'Ada Lovelace');
    tick();
    fixture.detectChanges();

    const labels = chips().map((chip) => chip.textContent!.replace(/\s+/g, ' ').trim());
    expect(labels.some((label) => label.includes('Status: Paid'))).toBeTrue();
    expect(labels.some((label) => label.includes('Owner: Ada Lovelace'))).toBeTrue();

    // The remove button carries the whole name, and removes only its value.
    const remove = chips()[0].querySelector(
      'button[aria-label="Remove filter Status: Paid"]',
    ) as HTMLElement;
    remove.click();
    fixture.detectChanges();

    expect(host.state().values['status']).toEqual([]);
    expect(host.state().values['owner']).toEqual(['ada']);
    expect(chips().length).toBe(1);
  }));

  it('a single-choice filter holds one value and swaps it', fakeAsync(() => {
    pick(1, 'Ada Lovelace');
    tick();
    expect(host.state().values['owner']).toEqual(['ada']);

    pick(1, 'Grace Hopper');
    tick();
    expect(host.state().values['owner']).toEqual(['grace']);
  }));

  it('Clear empties everything at once, and says so', fakeAsync(() => {
    pick(0, 'Paid');
    typeSearch('mural');

    barButton('Clear')!.click();
    fixture.detectChanges();

    expect(sameFilterState(host.state(), EMPTY_FILTER_STATE)).toBeTrue();
    expect(host.clears).toBe(1);
    expect(chips().length).toBe(0);
  }));

  describe('apply mode', () => {
    beforeEach(() => {
      host.applyMode.set(true);
      fixture.detectChanges();
    });

    it('collects edits in a draft: nothing reaches the consumer until Apply', fakeAsync(() => {
      pick(0, 'Paid');
      typeSearch('mural');

      // Edited, not committed.
      expect(host.emissions.length).toBe(0);
      expect(host.state()).toBe(EMPTY_FILTER_STATE);
      expect(chips().length).toBe(0);

      const apply = barButton('Apply')!;
      expect(apply.disabled).toBeFalse();
      apply.click();
      fixture.detectChanges();

      expect(host.emissions.length).toBe(1);
      expect(host.state().values['status']).toEqual(['paid']);
      expect(host.state().search).toBe('mural');
      expect(chips().length).toBe(1);
    }));

    it('Apply is disabled while there is nothing to apply', fakeAsync(() => {
      expect(barButton('Apply')!.disabled).toBeTrue();
      pick(0, 'Paid');
      expect(barButton('Apply')!.disabled).toBeFalse();
      barButton('Apply')!.click();
      fixture.detectChanges();
      expect(barButton('Apply')!.disabled).toBeTrue();
    }));

    it('removing a chip is immediate even in apply mode — a kept promise, revoked', fakeAsync(() => {
      pick(0, 'Paid');
      barButton('Apply')!.click();
      fixture.detectChanges();

      chips()[0].querySelector('button')!.click();
      fixture.detectChanges();

      expect(host.state().values['status']).toEqual([]);
      expect(host.emissions.length).toBe(2);

      // And the draft followed: the removed value must not resurrect.
      expect(barButton('Apply')!.disabled).toBeTrue();
    }));
  });
});

describe('filter state helpers', () => {
  it('counts individual selections across filters', () => {
    expect(countActiveFilters(EMPTY_FILTER_STATE)).toBe(0);
    expect(
      countActiveFilters({ search: '', values: { a: ['1', '2'], b: ['3'], c: [] } }),
    ).toBe(3);
  });

  it('compares states by value, tolerating missing keys', () => {
    expect(sameFilterState({ search: '', values: {} }, { search: '', values: { a: [] } })).toBeTrue();
    expect(
      sameFilterState({ search: '', values: { a: ['1'] } }, { search: '', values: { a: ['1'] } }),
    ).toBeTrue();
    expect(
      sameFilterState({ search: '', values: { a: ['1'] } }, { search: '', values: { a: ['2'] } }),
    ).toBeFalse();
    expect(sameFilterState({ search: 'x', values: {} }, { search: '', values: {} })).toBeFalse();
  });
});
