import { pageBounds, pageCountOf, paginationRange, type PaginationSlot } from './pagination.range';

const at = (page: number, pageCount: number, siblingCount = 1, boundaryCount = 1): PaginationSlot[] =>
  paginationRange({ page, pageCount, siblingCount, boundaryCount });

describe('paginationRange', () => {
  it('draws every page while they all fit', () => {
    expect(at(1, 1)).toEqual([1]);
    expect(at(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(at(3, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(at(7, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('has nothing to draw for an empty set of pages', () => {
    expect(at(1, 0)).toEqual([]);
    expect(at(1, -3)).toEqual([]);
  });

  it('hides the middle, and keeps the ends', () => {
    expect(at(1, 10)).toEqual([1, 2, 3, 4, 5, 'end-ellipsis', 10]);
    expect(at(6, 10)).toEqual([1, 'start-ellipsis', 5, 6, 7, 'end-ellipsis', 10]);
    expect(at(10, 10)).toEqual([1, 'start-ellipsis', 6, 7, 8, 9, 10]);
  });

  it('never changes width as the current page travels', () => {
    const widths = new Set<number>();
    for (let page = 1; page <= 20; page++) {
      widths.add(at(page, 20).length);
    }

    // A control that resizes between clicks gets clicked twice.
    expect(widths.size).toBe(1);
    expect([...widths][0]).toBe(7);
  });

  it('draws the page rather than an ellipsis that would hide only it', () => {
    // Seven pages in seven slots: a "…" hiding one page is wider than the page.
    expect(at(3, 6)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(at(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(at(1, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    // Eight will not fit, so the gap appears — hiding two.
    expect(at(1, 8)).toEqual([1, 2, 3, 4, 5, 'end-ellipsis', 8]);
  });

  it('clamps a page that escaped upstream', () => {
    expect(at(0, 10)).toEqual(at(1, 10));
    expect(at(99, 10)).toEqual(at(10, 10));
  });

  it('takes a wider window', () => {
    expect(at(6, 11, 2)).toEqual([1, 'start-ellipsis', 4, 5, 6, 7, 8, 'end-ellipsis', 11]);
    // Even with no siblings the window keeps its width, so the control does not jump.
    expect(at(1, 11, 0)).toEqual([1, 2, 3, 'end-ellipsis', 11]);
    expect(at(6, 11, 0)).toEqual([1, 'start-ellipsis', 6, 'end-ellipsis', 11]);
  });

  it('takes more pinned pages at the ends', () => {
    expect(at(6, 12, 1, 2)).toEqual([1, 2, 'start-ellipsis', 5, 6, 7, 'end-ellipsis', 11, 12]);
    expect(at(6, 12, 1, 0)).toEqual(['start-ellipsis', 5, 6, 7, 'end-ellipsis']);
  });

  it('always contains the current page', () => {
    for (let pageCount = 1; pageCount <= 25; pageCount++) {
      for (let page = 1; page <= pageCount; page++) {
        expect(at(page, pageCount))
          .withContext(`page ${page} of ${pageCount}`)
          .toContain(page);
      }
    }
  });

  it('never repeats a page, and never goes backwards', () => {
    for (let pageCount = 1; pageCount <= 25; pageCount++) {
      for (let page = 1; page <= pageCount; page++) {
        const pages = at(page, pageCount).filter((slot): slot is number => typeof slot === 'number');
        const sorted = [...pages].sort((a, b) => a - b);

        expect(pages).withContext(`page ${page} of ${pageCount}`).toEqual(sorted);
        expect(new Set(pages).size).toBe(pages.length);
        expect(pages.every((value) => value >= 1 && value <= pageCount)).toBeTrue();
      }
    }
  });
});

describe('pageCountOf', () => {
  it('rounds up, and never reaches zero', () => {
    expect(pageCountOf(0, 10)).toBe(1);
    expect(pageCountOf(1, 10)).toBe(1);
    expect(pageCountOf(10, 10)).toBe(1);
    expect(pageCountOf(11, 10)).toBe(2);
    expect(pageCountOf(57, 10)).toBe(6);
  });

  it('survives a page size of nothing', () => {
    expect(pageCountOf(57, 0)).toBe(1);
  });
});

describe('pageBounds', () => {
  it('counts the items on the page, 1-based', () => {
    expect(pageBounds(1, 10, 57)).toEqual([1, 10]);
    expect(pageBounds(6, 10, 57)).toEqual([51, 57]);
  });

  it('has no bounds when there is nothing', () => {
    expect(pageBounds(1, 10, 0)).toEqual([0, 0]);
  });
});
