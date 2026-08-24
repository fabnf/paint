import type { Tone } from '../../primitives/tone.types';

/**
 * One card on the board. A title and a little context — the full story lives
 * in the host's detail (a Drawer, usually), opened through `cardOpen`.
 */
export interface BoardCard<T = unknown> {
  readonly id: string;
  readonly title: string;
  /** The quieter second line. */
  readonly description?: string;
  /** A tinted leading edge: priority, kind, trouble. */
  readonly tone?: Tone;
  /** A small label — "Bug", "Design", an estimate. */
  readonly badge?: string;
  readonly badgeTone?: Tone;
  /** Who has it — rendered as a `ds-avatar`. */
  readonly assignee?: string;
  /** Whatever the host's detail view needs. */
  readonly data?: T;
}

/** One lane. The cards are the host's arrays, rendered verbatim. */
export interface BoardColumn<T = unknown> {
  readonly id: string;
  readonly label: string;
  /** The header dot's tint. */
  readonly tone?: Tone;
  readonly cards: readonly BoardCard<T>[];
}

/**
 * One move, wherever it came from — a drop, or an arrow key while grabbed.
 * `toIndex` is the position in the target column *after* the card has left
 * its old place, which is exactly how {@link moveCard} applies it.
 */
export interface BoardMove {
  readonly cardId: string;
  readonly fromColumnId: string;
  readonly toColumnId: string;
  readonly toIndex: number;
}

/**
 * Applies a move to the host's columns, immutably.
 *
 * The board never touches the data — it emits, the host applies. This helper
 * is that application, once, correctly: remove first, clamp, insert. Same-
 * column reorders and cross-column moves go through the same arithmetic, so
 * they cannot disagree.
 */
export function moveCard<T>(
  columns: readonly BoardColumn<T>[],
  move: BoardMove,
): BoardColumn<T>[] {
  let moved: BoardCard<T> | undefined;

  const without = columns.map((column) => {
    if (column.id !== move.fromColumnId) {
      return column;
    }
    return {
      ...column,
      cards: column.cards.filter((card) => {
        if (card.id === move.cardId) {
          moved = card;
          return false;
        }
        return true;
      }),
    };
  });

  if (!moved) {
    return [...columns];
  }
  const card = moved;

  return without.map((column) => {
    if (column.id !== move.toColumnId) {
      return column;
    }
    const index = Math.max(0, Math.min(move.toIndex, column.cards.length));
    return {
      ...column,
      cards: [...column.cards.slice(0, index), card, ...column.cards.slice(index)],
    };
  });
}
