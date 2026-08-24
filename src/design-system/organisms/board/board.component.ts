import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { AvatarComponent } from '../../primitives/avatar';
import { BadgeComponent } from '../../primitives/badge';
import { toneClass } from '../../primitives/tone.types';
import { uniqueId } from '../../utils';
import type { BoardCard, BoardColumn, BoardMove } from './board.types';

/**
 * Board — columns, cards, and the two ways a card travels.
 *
 * The kanban every app wires one-off, wired once. The host owns the columns
 * and their card arrays; the board renders them verbatim and **emits** —
 * `cardMove` when a card should travel (the host applies it, usually with the
 * exported {@link moveCard} helper), `cardOpen` when one is opened (the host
 * shows Paint detail: a `ds-drawer`, a route — never a bespoke modal here).
 *
 * **Never mouse-only.** Dragging works, and so does the keyboard, as a first
 * citizen: focus a card, `Enter` opens it, `Space` grabs it — then the arrows
 * move it between positions and lanes, `Space` drops it, `Escape` lets go.
 * Every step is announced ("Moved to Review, position 1 of 2"), because a
 * card that moves silently moves for nobody.
 *
 * @example
 * ```html
 * <ds-board [columns]="columns()" (cardMove)="apply($event)" (cardOpen)="open($event)" />
 * ```
 * ```ts
 * apply(move: BoardMove) { this.columns.update(c => moveCard(c, move)); }
 * ```
 */
@Component({
  selector: 'ds-board',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AvatarComponent, BadgeComponent],
  template: `
    <div class="ds-board" role="group" [attr.aria-label]="label()">
      @for (column of columns(); track column.id) {
        <section
          class="ds-board__column"
          [class.ds-board__column--over]="dragOverColumn() === column.id"
          [attr.aria-labelledby]="headerId(column.id)"
          (dragover)="onColumnDragOver(column, $event)"
          (dragleave)="onColumnDragLeave(column)"
          (drop)="onColumnDrop(column, $event)"
        >
          <header class="ds-board__header">
            @if (column.tone) {
              <span class="ds-board__column-dot {{ toneClassOf(column.tone) }}" aria-hidden="true"></span>
            }
            <h3 class="ds-board__column-label" [id]="headerId(column.id)">{{ column.label }}</h3>
            <span class="ds-board__count" aria-hidden="true">{{ column.cards.length }}</span>
            <span class="visually-hidden">, {{ column.cards.length }} cards</span>
          </header>

          <ul class="ds-board__cards">
            @for (card of column.cards; track card.id) {
              <li class="ds-board__slot">
                <div
                  class="ds-board__card"
                  [class.ds-board__card--grabbed]="grabbedId() === card.id"
                  [class.ds-board__card--dragging]="draggingId() === card.id"
                  role="button"
                  tabindex="0"
                  draggable="true"
                  [attr.data-card-id]="card.id"
                  [attr.aria-pressed]="grabbedId() === card.id"
                  [attr.aria-describedby]="instructionsId"
                  (click)="cardOpen.emit(card)"
                  (keydown)="onCardKeydown(card, column, $event)"
                  (dragstart)="onDragStart(card, column, $event)"
                  (dragend)="onDragEnd()"
                  (dragover)="onCardDragOver($event)"
                  (drop)="onCardDrop(card, column, $event)"
                >
                  @if (card.tone) {
                    <span class="ds-board__edge {{ toneClassOf(card.tone) }}" aria-hidden="true"></span>
                  }

                  <span class="ds-board__title">{{ card.title }}</span>
                  @if (card.description) {
                    <span class="ds-board__description">{{ card.description }}</span>
                  }

                  @if (card.badge || card.assignee) {
                    <span class="ds-board__meta">
                      @if (card.badge) {
                        <ds-badge [tone]="card.badgeTone ?? 'neutral'" size="sm">
                          {{ card.badge }}
                        </ds-badge>
                      }
                      @if (card.assignee) {
                        <ds-avatar class="ds-board__assignee" [name]="card.assignee" size="xs" />
                      }
                    </span>
                  }
                </div>
              </li>
            } @empty {
              <li class="ds-board__empty" aria-hidden="true">{{ emptyColumnText() }}</li>
            }
          </ul>
        </section>
      }
    </div>

    <!-- One sentence of instructions, shared by every card via describedby. -->
    <span class="visually-hidden" [id]="instructionsId">
      Press Enter to open. Press Space to grab, arrow keys to move, Space to drop, Escape to let go.
    </span>

    <!-- The journey, narrated: grabs, every step, the drop. -->
    <span class="visually-hidden" aria-live="assertive">{{ announcement() }}</span>
  `,
  styles: `
    :host {
      display: block;
    }

    .ds-board {
      display: flex;
      align-items: flex-start;
      gap: var(--ds-space-3);
      overflow-x: auto;
      padding-block-end: var(--ds-space-2);
    }

    .ds-board__column {
      flex: 1 0 14rem;
      max-width: 20rem;
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-2);
      padding: var(--ds-space-2_5);
      background: var(--ds-color-surface-sunken);
      border: 1px solid var(--ds-color-border);
      border-radius: var(--ds-radius-lg);
    }

    .ds-board__column--over {
      border-color: var(--ds-color-primary);
      background: color-mix(in srgb, var(--ds-color-primary-muted) 55%, var(--ds-color-surface-sunken));
    }

    .ds-board__header {
      display: flex;
      align-items: center;
      gap: var(--ds-space-2);
      padding-inline: var(--ds-space-1);
    }

    .ds-board__column-dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: var(--ds-radius-full);
      background: var(--ds-tone-solid, var(--ds-color-border-strong));
      flex-shrink: 0;
    }

    .ds-board__column-label {
      margin: 0;
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-semibold);
      color: var(--ds-color-text);
      flex: 1 1 auto;
      min-width: 0;
    }

    .ds-board__count {
      font-size: var(--ds-font-size-xs);
      font-variant-numeric: tabular-nums;
      color: var(--ds-color-text-subtle);
      background: var(--ds-color-surface);
      border: 1px solid var(--ds-color-border);
      border-radius: var(--ds-radius-full);
      padding: 0 0.45rem;
    }

    .ds-board__cards {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-2);
      margin: 0;
      padding: 0;
      list-style: none;
      min-height: 2.5rem;
    }

    .ds-board__card {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-1);
      padding: var(--ds-space-2_5) var(--ds-space-3);
      background: var(--ds-color-surface);
      border: 1px solid var(--ds-color-border);
      border-radius: var(--ds-radius-md);
      box-shadow: var(--ds-shadow-sm);
      cursor: grab;
      overflow: hidden;
    }

    .ds-board__card:hover {
      border-color: var(--ds-color-border-strong);
    }

    .ds-board__card:focus-visible {
      outline: 2px solid var(--ds-color-focus-ring);
      outline-offset: 2px;
    }

    /* Grabbed: lifted and inked, so the mode is visible, not just audible. */
    .ds-board__card--grabbed {
      border-color: var(--ds-color-primary);
      box-shadow: var(--ds-shadow-md);
      cursor: grabbing;
    }

    .ds-board__card--dragging {
      opacity: 0.5;
    }

    .ds-board__edge {
      position: absolute;
      inset-block: 0;
      inset-inline-start: 0;
      width: 3px;
      background: var(--ds-tone-solid, transparent);
    }

    .ds-board__title {
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-medium);
      color: var(--ds-color-text);
    }

    .ds-board__description {
      font-size: var(--ds-font-size-xs);
      color: var(--ds-color-text-muted);
    }

    .ds-board__meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ds-space-2);
      margin-block-start: var(--ds-space-1);
    }

    .ds-board__assignee {
      margin-inline-start: auto;
    }

    .ds-board__empty {
      padding: var(--ds-space-3);
      border: 1px dashed var(--ds-color-border-strong);
      border-radius: var(--ds-radius-md);
      text-align: center;
      font-size: var(--ds-font-size-xs);
      color: var(--ds-color-text-subtle);
    }

    @media (forced-colors: active) {
      .ds-board__card--grabbed {
        outline: 2px dashed Highlight;
        outline-offset: -4px;
      }
    }
  `,
})
export class BoardComponent<T = unknown> {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The lanes and their cards. The host's arrays, rendered verbatim. */
  readonly columns = input.required<readonly BoardColumn<T>[]>();
  readonly label = input<string>('Board');
  readonly emptyColumnText = input<string>('No cards');

  /** A card should travel. The host applies it — `moveCard()` is one line. */
  readonly cardMove = output<BoardMove>();
  /** A card was opened. Paint detail is the host's: a Drawer, a route. */
  readonly cardOpen = output<BoardCard<T>>();

  protected readonly instructionsId = uniqueId('ds-board-instructions');
  private readonly boardId = uniqueId('ds-board');

  /** The card the keyboard is carrying. */
  protected readonly grabbedId = signal<string | null>(null);
  /** The card the pointer is carrying. */
  protected readonly draggingId = signal<string | null>(null);
  protected readonly dragOverColumn = signal<string | null>(null);
  protected readonly announcement = signal('');

  protected readonly toneClassOf = toneClass;

  protected headerId(columnId: string): string {
    return `${this.boardId}-column-${columnId}`;
  }

  // —— keyboard: grab, travel, drop ——

  protected onCardKeydown(card: BoardCard<T>, column: BoardColumn<T>, event: KeyboardEvent): void {
    const grabbed = this.grabbedId() === card.id;

    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        this.cardOpen.emit(card);
        return;
      case ' ':
        event.preventDefault();
        if (grabbed) {
          this.grabbedId.set(null);
          this.announcement.set(`Dropped ${card.title} in ${column.label}.`);
        } else {
          this.grabbedId.set(card.id);
          this.announcement.set(
            `Grabbed ${card.title}. Arrow keys move it, Space drops it, Escape lets go.`,
          );
        }
        return;
      case 'Escape':
        if (grabbed) {
          event.preventDefault();
          event.stopPropagation();
          this.grabbedId.set(null);
          this.announcement.set(`Let go of ${card.title}.`);
        }
        return;
    }

    if (!grabbed) {
      return;
    }

    const step: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const delta = step[event.key];
    if (!delta) {
      return;
    }
    event.preventDefault();
    this.travel(card, column, delta[0], delta[1]);
  }

  /** One arrow-key step: across lanes, or up and down the current one. */
  private travel(
    card: BoardCard<T>,
    column: BoardColumn<T>,
    columnStep: number,
    indexStep: number,
  ): void {
    const columns = this.columns();
    const columnIndex = columns.findIndex((candidate) => candidate.id === column.id);
    const cardIndex = column.cards.findIndex((candidate) => candidate.id === card.id);

    let move: BoardMove | null = null;

    if (columnStep !== 0) {
      const target = columns[columnIndex + columnStep];
      if (!target) {
        this.announcement.set(
          columnStep < 0 ? 'Already in the first column.' : 'Already in the last column.',
        );
        return;
      }
      // Keep the altitude where possible; an empty column takes it at 0.
      move = {
        cardId: card.id,
        fromColumnId: column.id,
        toColumnId: target.id,
        toIndex: Math.min(cardIndex, target.cards.length),
      };
    } else {
      const toIndex = cardIndex + indexStep;
      if (toIndex < 0 || toIndex > column.cards.length - 1) {
        this.announcement.set(indexStep < 0 ? 'Already at the top.' : 'Already at the bottom.');
        return;
      }
      move = { cardId: card.id, fromColumnId: column.id, toColumnId: column.id, toIndex };
    }

    this.emitMove(move, card.title);
  }

  // —— pointer: drag and drop ——

  protected onDragStart(card: BoardCard<T>, column: BoardColumn<T>, event: DragEvent): void {
    this.draggingId.set(card.id);
    event.dataTransfer?.setData('text/plain', card.id);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
    // The keyboard and the pointer never carry two cards at once.
    this.grabbedId.set(null);
    void column;
  }

  protected onDragEnd(): void {
    this.draggingId.set(null);
    this.dragOverColumn.set(null);
  }

  protected onColumnDragOver(column: BoardColumn<T>, event: DragEvent): void {
    if (!this.draggingId()) {
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.dragOverColumn.set(column.id);
  }

  protected onColumnDragLeave(column: BoardColumn<T>): void {
    if (this.dragOverColumn() === column.id) {
      this.dragOverColumn.set(null);
    }
  }

  /** Dropped on the lane itself: the card joins the end. */
  protected onColumnDrop(column: BoardColumn<T>, event: DragEvent): void {
    event.preventDefault();
    const { card, from } = this.draggedCard(event);
    this.onDragEnd();
    if (!card || !from) {
      return;
    }

    const toIndex = from.id === column.id ? column.cards.length - 1 : column.cards.length;
    this.emitMove(
      { cardId: card.id, fromColumnId: from.id, toColumnId: column.id, toIndex },
      card.title,
    );
  }

  protected onCardDragOver(event: DragEvent): void {
    if (this.draggingId()) {
      event.preventDefault();
    }
  }

  /** Dropped on a card: the traveller takes that card's place, shifting it down. */
  protected onCardDrop(target: BoardCard<T>, column: BoardColumn<T>, event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const { card, from } = this.draggedCard(event);
    this.onDragEnd();
    if (!card || !from || card.id === target.id) {
      return;
    }

    const targetIndex = column.cards.findIndex((candidate) => candidate.id === target.id);
    const fromIndex = from.cards.findIndex((candidate) => candidate.id === card.id);
    // `toIndex` speaks post-removal: leaving from above the target shifts it up one.
    const toIndex =
      from.id === column.id && fromIndex < targetIndex ? targetIndex - 1 : targetIndex;

    this.emitMove(
      { cardId: card.id, fromColumnId: from.id, toColumnId: column.id, toIndex },
      card.title,
    );
  }

  private draggedCard(event: DragEvent): {
    card: BoardCard<T> | null;
    from: BoardColumn<T> | null;
  } {
    const id = event.dataTransfer?.getData('text/plain') || this.draggingId();
    if (!id) {
      return { card: null, from: null };
    }
    for (const column of this.columns()) {
      const card = column.cards.find((candidate) => candidate.id === id);
      if (card) {
        return { card, from: column };
      }
    }
    return { card: null, from: null };
  }

  private emitMove(move: BoardMove, title: string): void {
    if (move.fromColumnId === move.toColumnId) {
      const column = this.columns().find((candidate) => candidate.id === move.fromColumnId);
      const fromIndex = column?.cards.findIndex((candidate) => candidate.id === move.cardId) ?? -1;
      if (fromIndex === move.toIndex) {
        return; // a move to where it already is is not a move
      }
    }

    this.cardMove.emit(move);

    // The host applies the move and the card re-renders elsewhere: say where
    // it landed, and put focus (and the grab) back in its hands.
    setTimeout(() => {
      const column = this.columns().find((candidate) => candidate.id === move.toColumnId);
      const index = column?.cards.findIndex((candidate) => candidate.id === move.cardId) ?? -1;
      if (column && index !== -1) {
        this.announcement.set(
          `Moved ${title} to ${column.label}, position ${index + 1} of ${column.cards.length}.`,
        );
      }
      if (this.grabbedId() === move.cardId) {
        this.host.nativeElement
          .querySelector<HTMLElement>(`[data-card-id="${move.cardId}"]`)
          ?.focus();
      }
    });
  }
}
