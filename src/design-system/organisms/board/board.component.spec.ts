import { Component, signal } from '@angular/core';
import { TestBed, fakeAsync, tick, type ComponentFixture } from '@angular/core/testing';
import { BoardComponent } from './board.component';
import { moveCard, type BoardCard, type BoardColumn, type BoardMove } from './board.types';

const COLUMNS: readonly BoardColumn[] = [
  {
    id: 'todo',
    label: 'To do',
    tone: 'neutral',
    cards: [
      { id: 'rail', title: 'Tune the rail', badge: 'Design', badgeTone: 'info', assignee: 'Ada Lovelace', tone: 'info' },
      { id: 'grid', title: 'Grid density pass', description: 'Compact rows on the blotter.' },
    ],
  },
  {
    id: 'doing',
    label: 'In progress',
    tone: 'primary',
    cards: [{ id: 'docs', title: 'Write the docs', badge: 'Bug', badgeTone: 'danger' }],
  },
  { id: 'done', label: 'Done', tone: 'success', cards: [] },
];

describe('moveCard', () => {
  it('moves across columns: remove, clamp, insert', () => {
    const next = moveCard(COLUMNS, { cardId: 'rail', fromColumnId: 'todo', toColumnId: 'doing', toIndex: 0 });
    expect(next[0].cards.map((c) => c.id)).toEqual(['grid']);
    expect(next[1].cards.map((c) => c.id)).toEqual(['rail', 'docs']);
    // The originals were never touched.
    expect(COLUMNS[0].cards.length).toBe(2);
  });

  it('clamps a too-deep index to the end', () => {
    const next = moveCard(COLUMNS, { cardId: 'rail', fromColumnId: 'todo', toColumnId: 'done', toIndex: 99 });
    expect(next[2].cards.map((c) => c.id)).toEqual(['rail']);
  });

  it('reorders within a column through the same arithmetic', () => {
    const next = moveCard(COLUMNS, { cardId: 'rail', fromColumnId: 'todo', toColumnId: 'todo', toIndex: 1 });
    expect(next[0].cards.map((c) => c.id)).toEqual(['grid', 'rail']);
  });

  it('a move for a card nobody has is a no-op', () => {
    const next = moveCard(COLUMNS, { cardId: 'ghost', fromColumnId: 'todo', toColumnId: 'done', toIndex: 0 });
    expect(next.map((c) => c.cards.length)).toEqual([2, 1, 0]);
  });
});

describe('BoardComponent', () => {
  @Component({
    standalone: true,
    imports: [BoardComponent],
    template: `
      <ds-board
        [columns]="columns()"
        label="Release board"
        (cardMove)="apply($event)"
        (cardOpen)="opened.push($event.id)"
      />
    `,
  })
  class HostComponent {
    readonly columns = signal<readonly BoardColumn[]>(COLUMNS);
    moves: BoardMove[] = [];
    opened: string[] = [];

    apply(move: BoardMove): void {
      // The real loop: the host applies the move the board asked for.
      this.moves.push(move);
      this.columns.update((columns) => moveCard(columns, move));
    }
  }

  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <E extends HTMLElement>(selector: string): E | null =>
    fixture.nativeElement.querySelector(selector);
  const lanes = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.ds-board__column'));
  const card = (id: string): HTMLElement => query(`[data-card-id="${id}"]`)!;
  const cardIds = (lane: number): string[] =>
    Array.from(lanes()[lane].querySelectorAll('[data-card-id]'), (el: Element) =>
      el.getAttribute('data-card-id')!,
    );
  const announcement = () => query('[aria-live="assertive"]')!.textContent!.trim();

  const key = (id: string, key: string) => {
    card(id).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    fixture.detectChanges();
  };
  const dragEvent = (type: string, transfer: DataTransfer) =>
    new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: transfer });

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders lanes with counted headers, and an honest empty column', () => {
    expect(query('.ds-board')!.getAttribute('aria-label')).toBe('Release board');
    expect(lanes().length).toBe(3);
    expect(lanes()[0].textContent).toContain('To do');
    expect(lanes()[0].querySelector('.ds-board__count')!.textContent!.trim()).toBe('2');
    expect(lanes()[2].querySelector('.ds-board__empty')!.textContent).toContain('No cards');
  });

  it('wears the card chrome: tone edge, badge, avatar, description', () => {
    const rail = card('rail');
    expect(rail.querySelector('.ds-board__edge')!.classList).toContain('ds-tone--info');
    expect(rail.querySelector('ds-badge')!.textContent).toContain('Design');
    expect(rail.querySelector('ds-avatar')).toBeTruthy();
    expect(card('grid').textContent).toContain('Compact rows on the blotter.');
  });

  it('opens on click and on Enter — detail is the host\'s business', () => {
    card('docs').click();
    expect(host.opened).toEqual(['docs']);

    key('rail', 'Enter');
    expect(host.opened).toEqual(['docs', 'rail']);
    expect(host.moves.length).toBe(0);
  });

  it('Space grabs and announces; Escape lets go without moving anything', () => {
    key('rail', ' ');
    expect(card('rail').getAttribute('aria-pressed')).toBe('true');
    expect(announcement()).toContain('Grabbed Tune the rail');

    key('rail', 'Escape');
    expect(card('rail').getAttribute('aria-pressed')).toBe('false');
    expect(announcement()).toContain('Let go of Tune the rail');
    expect(host.moves.length).toBe(0);
  });

  it('ungrabbed arrows move nothing', () => {
    key('rail', 'ArrowRight');
    key('rail', 'ArrowDown');
    expect(host.moves.length).toBe(0);
  });

  it('a grabbed card travels across lanes by arrow, keeping focus and the grab', fakeAsync(() => {
    key('rail', ' ');
    key('rail', 'ArrowRight');
    tick();
    fixture.detectChanges();

    expect(host.moves).toEqual([
      { cardId: 'rail', fromColumnId: 'todo', toColumnId: 'doing', toIndex: 0 },
    ]);
    expect(cardIds(1)).toEqual(['rail', 'docs']);
    expect(document.activeElement).toBe(card('rail'));
    expect(card('rail').getAttribute('aria-pressed')).toBe('true');
    expect(announcement()).toBe('Moved Tune the rail to In progress, position 1 of 2.');

    // …and on into the empty column, landing at the only place there is.
    key('rail', 'ArrowRight');
    tick();
    fixture.detectChanges();
    expect(cardIds(2)).toEqual(['rail']);
    expect(announcement()).toBe('Moved Tune the rail to Done, position 1 of 1.');

    // The end of the board is a fact, not a move.
    key('rail', 'ArrowRight');
    expect(announcement()).toBe('Already in the last column.');
    expect(host.moves.length).toBe(2);

    // Space drops it where it stands.
    key('rail', ' ');
    expect(card('rail').getAttribute('aria-pressed')).toBe('false');
    expect(announcement()).toContain('Dropped Tune the rail in Done.');
  }));

  it('ArrowDown and ArrowUp reorder within the lane, edges included', fakeAsync(() => {
    key('rail', ' ');
    key('rail', 'ArrowDown');
    tick();
    fixture.detectChanges();

    expect(cardIds(0)).toEqual(['grid', 'rail']);
    expect(announcement()).toBe('Moved Tune the rail to To do, position 2 of 2.');

    key('rail', 'ArrowDown');
    expect(announcement()).toBe('Already at the bottom.');

    key('rail', 'ArrowUp');
    tick();
    fixture.detectChanges();
    expect(cardIds(0)).toEqual(['rail', 'grid']);

    key('rail', 'ArrowUp');
    expect(announcement()).toBe('Already at the top.');
    expect(host.moves.length).toBe(2);
  }));

  it('drags to a lane: the card joins the end, the lane lights up on the way', fakeAsync(() => {
    const transfer = new DataTransfer();
    card('rail').dispatchEvent(dragEvent('dragstart', transfer));
    fixture.detectChanges();
    expect(card('rail').classList).toContain('ds-board__card--dragging');

    lanes()[1].dispatchEvent(dragEvent('dragover', transfer));
    fixture.detectChanges();
    expect(lanes()[1].classList).toContain('ds-board__column--over');

    lanes()[1].dispatchEvent(dragEvent('drop', transfer));
    tick();
    fixture.detectChanges();

    expect(host.moves.pop()).toEqual({
      cardId: 'rail',
      fromColumnId: 'todo',
      toColumnId: 'doing',
      toIndex: 1,
    });
    expect(cardIds(1)).toEqual(['docs', 'rail']);
    expect(lanes()[1].classList).not.toContain('ds-board__column--over');
  }));

  it('drags onto an empty lane', fakeAsync(() => {
    const transfer = new DataTransfer();
    card('docs').dispatchEvent(dragEvent('dragstart', transfer));
    lanes()[2].dispatchEvent(dragEvent('dragover', transfer));
    lanes()[2].dispatchEvent(dragEvent('drop', transfer));
    tick();
    fixture.detectChanges();

    expect(cardIds(2)).toEqual(['docs']);
    expect(lanes()[1].querySelector('.ds-board__empty')).toBeTruthy();
  }));

  it('drops onto a card to take its slot — post-removal arithmetic included', fakeAsync(() => {
    // Cross-lane: docs dropped onto grid slides in front of it.
    const transfer = new DataTransfer();
    card('docs').dispatchEvent(dragEvent('dragstart', transfer));
    card('grid').dispatchEvent(dragEvent('dragover', transfer));
    card('grid').dispatchEvent(dragEvent('drop', transfer));
    tick();
    fixture.detectChanges();

    expect(host.moves.pop()).toEqual({
      cardId: 'docs',
      fromColumnId: 'doing',
      toColumnId: 'todo',
      toIndex: 1,
    });
    expect(cardIds(0)).toEqual(['rail', 'docs', 'grid']);

    // Same lane, onto the adjacent card below: after removal that slot is the
    // one the card already holds — the board refuses to call it a move.
    const again = new DataTransfer();
    card('rail').dispatchEvent(dragEvent('dragstart', again));
    card('docs').dispatchEvent(dragEvent('drop', again));
    tick();
    expect(host.moves.length).toBe(0);
    expect(cardIds(0)).toEqual(['rail', 'docs', 'grid']);
  }));

  it('a drop where the card already stands is not a move', fakeAsync(() => {
    const transfer = new DataTransfer();
    card('docs').dispatchEvent(dragEvent('dragstart', transfer));
    lanes()[1].dispatchEvent(dragEvent('drop', transfer));
    tick();

    expect(host.moves.length).toBe(0);
  }));
});
