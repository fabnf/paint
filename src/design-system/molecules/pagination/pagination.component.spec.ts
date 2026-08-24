import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { PaginationComponent, type PaginationVariant } from './pagination.component';

@Component({
  standalone: true,
  imports: [PaginationComponent],
  template: `
    <ds-pagination
      [(page)]="page"
      [total]="total()"
      [pageSize]="pageSize()"
      [pageCount]="pageCount()"
      [variant]="variant()"
      [showSummary]="showSummary()"
      [disabled]="disabled()"
      (pageChange)="changes.push($event)"
    />
  `,
})
class HostComponent {
  page = 1;
  readonly total = signal(57);
  readonly pageSize = signal(10);
  readonly pageCount = signal(0);
  readonly variant = signal<PaginationVariant>('pages');
  readonly showSummary = signal(false);
  readonly disabled = signal(false);
  changes: number[] = [];
}

describe('PaginationComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);

  const buttons = () =>
    Array.from(
      fixture.nativeElement.querySelectorAll('button.page-link') as NodeListOf<HTMLButtonElement>,
    );
  const pageButton = (page: number) =>
    buttons().find((button) => button.textContent!.trim() === String(page))!;
  const previous = () => buttons()[0];
  const next = () => buttons()[buttons().length - 1];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('is a named nav around a list of buttons', () => {
    expect(query('nav')!.getAttribute('aria-label')).toBe('Pagination');
    expect(query('ul.pagination')).toBeTruthy();
    // Buttons, not links: nothing here changes the URL.
    expect(fixture.nativeElement.querySelectorAll('a').length).toBe(0);
  });

  it('counts the pages from the items', () => {
    // 57 invoices, ten at a time.
    expect(pageButton(6)).toBeTruthy();
    expect(buttons().some((button) => button.textContent!.trim() === '7')).toBeFalse();
  });

  it('takes a page count directly', () => {
    host.total.set(0);
    host.pageCount.set(3);
    fixture.detectChanges();

    expect(pageButton(3)).toBeTruthy();
    expect(buttons().some((button) => button.textContent!.trim() === '4')).toBeFalse();
  });

  it('names every page, and marks the current one', () => {
    expect(pageButton(2).getAttribute('aria-label')).toBe('Page 2');
    expect(pageButton(1).getAttribute('aria-current')).toBe('page');
    expect(pageButton(2).getAttribute('aria-current')).toBeNull();
    expect(pageButton(1).closest('li')!.classList).toContain('active');
  });

  it('changes the page, once, and says which', () => {
    pageButton(3).click();
    fixture.detectChanges();

    expect(host.page).toBe(3);
    expect(host.changes).toEqual([3]);
    expect(pageButton(3).getAttribute('aria-current')).toBe('page');

    // Clicking the page you are on is not a change.
    pageButton(3).click();
    expect(host.changes).toEqual([3]);
  });

  it('steps with the arrows, and stops at the ends', () => {
    expect(previous().disabled).toBeTrue();
    expect(previous().getAttribute('aria-label')).toBe('Previous page');

    next().click();
    fixture.detectChanges();
    expect(host.page).toBe(2);
    expect(previous().disabled).toBeFalse();

    host.page = 6;
    fixture.detectChanges();
    expect(next().disabled).toBeTrue();
  });

  it('never emits a page that cannot exist', () => {
    host.page = 6;
    fixture.detectChanges();

    next().click();
    expect(host.changes).toEqual([]);
    expect(host.page).toBe(6);
  });

  it('draws a gap that is not a button', () => {
    host.total.set(200);
    fixture.detectChanges();

    const gap = query('.ds-pagination__gap span')!;
    expect(gap.getAttribute('aria-hidden')).toBe('true');
    expect(gap.tagName).toBe('SPAN');
  });

  it('announces the page in a region that was already there', () => {
    const live = query('[role="status"]')!;
    expect(live.textContent!.trim()).toBe('Page 1 of 6');
    expect(live.classList).toContain('visually-hidden');

    pageButton(2).click();
    fixture.detectChanges();
    expect(live.textContent!.trim()).toBe('Page 2 of 6');
  });

  it('summarises the items, not the pages', () => {
    host.showSummary.set(true);
    fixture.detectChanges();
    expect(query('.ds-pagination__summary')!.textContent!.trim()).toBe('1–10 of 57');

    host.page = 6;
    fixture.detectChanges();
    expect(query('.ds-pagination__summary')!.textContent!.trim()).toBe('51–57 of 57');

    host.total.set(0);
    host.page = 1;
    fixture.detectChanges();
    expect(query('.ds-pagination__summary')!.textContent!.trim()).toBe('Nothing to show');
  });

  it('shrinks to a counter when there is no room', () => {
    host.variant.set('compact');
    fixture.detectChanges();

    expect(query('.ds-pagination__current')!.textContent!.trim()).toBe('1 / 6');
    // Prev and next, and nothing else.
    expect(buttons().length).toBe(2);

    next().click();
    fixture.detectChanges();
    expect(host.page).toBe(2);
  });

  it('disables every button at once', () => {
    host.page = 3;
    host.disabled.set(true);
    fixture.detectChanges();

    expect(buttons().every((button) => button.disabled)).toBeTrue();
    pageButton(4).click();
    expect(host.page).toBe(3);
  });
});
