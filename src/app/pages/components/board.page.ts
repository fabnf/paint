import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  DS_COMPONENTS,
  DS_PRIMITIVES,
  moveCard,
  type BoardCard,
  type BoardColumn,
  type BoardMove,
} from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

interface TicketData {
  owner: string;
  estimate: string;
  notes: string;
}

/**
 * Board — documentation page.
 */
@Component({
  selector: 'app-board-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI],
  templateUrl: './board.page.html',
  styleUrl: './components-page.scss',
})
export class BoardPage {
  readonly columns = signal<readonly BoardColumn<TicketData>[]>([
    {
      id: 'todo',
      label: 'To do',
      tone: 'neutral',
      cards: [
        {
          id: 'rail',
          title: 'Tune the timeline rail',
          description: 'The 1px rail vanishes on dark.',
          badge: 'Design',
          badgeTone: 'info',
          tone: 'info',
          assignee: 'Ada Lovelace',
          data: { owner: 'Ada Lovelace', estimate: '2 points', notes: 'Try 2px with a surface ring; check forced-colors.' },
        },
        {
          id: 'density',
          title: 'Grid density pass',
          badge: 'UX',
          badgeTone: 'accent',
          assignee: 'Grace Hopper',
          data: { owner: 'Grace Hopper', estimate: '3 points', notes: 'Compact rows on the blotter, comfortable elsewhere.' },
        },
      ],
    },
    {
      id: 'doing',
      label: 'In progress',
      tone: 'primary',
      cards: [
        {
          id: 'palette-docs',
          title: 'Palette docs rewrite',
          description: 'The matcher section reads like a spec.',
          badge: 'Docs',
          tone: 'warning',
          assignee: 'Katherine Johnson',
          data: { owner: 'Katherine Johnson', estimate: '1 point', notes: 'Lead with the ⌘K demo, bury the grammar.' },
        },
      ],
    },
    {
      id: 'review',
      label: 'In review',
      tone: 'accent',
      cards: [
        {
          id: 'uploader-retry',
          title: 'Uploader retry jitter',
          badge: 'Bug',
          badgeTone: 'danger',
          tone: 'danger',
          assignee: 'Ada Lovelace',
          data: { owner: 'Ada Lovelace', estimate: '1 point', notes: 'Back off 2^n with a cap; keep the row announcing.' },
        },
      ],
    },
    { id: 'done', label: 'Done', tone: 'success', cards: [] },
  ]);

  readonly selected = signal<BoardCard<TicketData> | null>(null);
  readonly detailOpen = signal(false);
  readonly lastMove = signal('');

  readonly selectedColumn = computed(() => {
    const card = this.selected();
    if (!card) {
      return null;
    }
    return (
      this.columns().find((column) => column.cards.some((c) => c.id === card.id)) ?? null
    );
  });

  apply(move: BoardMove): void {
    this.columns.update((columns) => moveCard(columns, move));
    this.lastMove.set(`${move.cardId} → ${move.toColumnId}[${move.toIndex}]`);
  }

  open(card: BoardCard<TicketData>): void {
    this.selected.set(card);
    this.detailOpen.set(true);
  }

  /** The drawer can move its card too — the same host-owned update. */
  moveSelectedTo(columnId: string): void {
    const card = this.selected();
    const from = this.selectedColumn();
    if (!card || !from || from.id === columnId) {
      return;
    }
    this.apply({
      cardId: card.id,
      fromColumnId: from.id,
      toColumnId: columnId,
      toIndex: this.columns().find((c) => c.id === columnId)?.cards.length ?? 0,
    });
  }

  readonly boardSnippet = `<ds-board [columns]="columns()" (cardMove)="apply($event)" (cardOpen)="open($event)" />

// The host owns the data; applying a move is one line:
apply(move: BoardMove) {
  this.columns.update((columns) => moveCard(columns, move));
}

// Opening a card shows Paint detail — a ds-drawer, not a bespoke modal:
open(card: BoardCard) { this.selected.set(card); this.detailOpen.set(true); }`;

  readonly keyboardSnippet = `Focus a card, then:
  Enter   open it (→ your Drawer)
  Space   grab it          "Grabbed 'Tune the timeline rail'…"
  ← →     move across lanes "Moved to In progress, position 1 of 2."
  ↑ ↓     reorder in place  "Already at the top."
  Space   drop it
  Escape  let go`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'columns', type: 'BoardColumn<T>[]', default: 'required', description: `Lanes and their card arrays — the host's data, rendered verbatim, never mutated.` },
    { name: 'label', type: 'string', default: `'Board'`, description: `The board's accessible name.` },
    { name: 'emptyColumnText', type: 'string', default: `'No cards'`, description: 'What an empty lane says. It still accepts drops and keyboard moves.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'cardMove', type: 'OutputEmitterRef<BoardMove>', default: '—', description: 'A card should travel — from a drop or a grabbed arrow key. The host applies it; moveCard() is one line.' },
    { name: 'cardOpen', type: 'OutputEmitterRef<BoardCard<T>>', default: '—', description: `A card was opened (click or Enter). The detail is the host's: a Drawer, a route.` },
  ];

  readonly helpers: readonly ApiRow[] = [
    { name: 'moveCard(columns, move)', type: 'function', default: '—', description: 'Applies a move immutably: remove, clamp, insert. Same arithmetic for reorders and lane changes.' },
    { name: 'BoardMove.toIndex', type: 'number', default: '—', description: 'The position in the target lane after the card has left its old place.' },
  ];
}
