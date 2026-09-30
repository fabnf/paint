import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { EmptyStateComponent } from '../../molecules/empty-state';
import { AvatarComponent } from '../../primitives/avatar';
import { BadgeComponent } from '../../primitives/badge';
import { ButtonComponent } from '../../primitives/button';
import { CheckboxComponent } from '../../primitives/checkbox';
import { SkeletonComponent } from '../../primitives/skeleton';
import { SpinnerComponent } from '../../primitives/spinner';
import { TextareaComponent } from '../../primitives/textarea';
import { NgTemplateOutlet } from '@angular/common';
import { cx } from '../../primitives/primitives.types';
import { typeaheadIndex } from '../collection/collection.types';
import { DrawerComponent } from '../drawer/drawer.component';
import { uniqueId } from '../../utils';
import type {
  InboxReadChange,
  InboxReply,
  InboxThread,
  InboxThreadEvent,
} from './inbox.types';

/**
 * Inbox — a master–detail reading surface, not an email client.
 *
 * A list of host-owned threads beside a reading pane: the shape every support
 * queue, notification centre and review inbox ends up with, and the one people
 * rebuild because the hard parts are not the list. Paint owns those: which
 * thread is open, what "nothing selected yet" looks like, the unread weight, the
 * keyboard, and — on a narrow viewport — the detail becoming a `<ds-drawer>`
 * with the Dialog's focus trap, `inert` page, `Escape` and focus restore.
 *
 * **Selection and focus.** Exactly one thread is open at a time
 * (`[(selected)]`, an id or `null`); the list is one tab stop with an
 * `aria-activedescendant` cursor, so arrowing through threads does not open
 * them — `Enter` (or a click) does, which is what keeps a queue skimmable.
 * Opening moves focus to the reading pane's heading (or, on narrow, into the
 * drawer); closing the drawer returns focus to the thread's row.
 *
 * **It is not a mail product.** No folders, no transport, no SMTP: `reply` and
 * `readChange` are reports, and the host owns the data and the sending.
 *
 * @example
 * ```html
 * <ds-inbox
 *   [threads]="threads()"
 *   [(selected)]="openThread"
 *   [loading]="loading()"
 *   [composer]="true"
 *   (reply)="send($event)"
 *   (readChange)="markRead($event)"
 * />
 * ```
 */
@Component({
  selector: 'ds-inbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AvatarComponent,
    BadgeComponent,
    ButtonComponent,
    CheckboxComponent,
    EmptyStateComponent,
    SkeletonComponent,
    SpinnerComponent,
    TextareaComponent,
    DrawerComponent,
    NgTemplateOutlet,
  ],
  template: `
    <div [class]="classes()">
      <!-- ——— The list ——— -->
      <div class="ds-inbox__list-pane">
        @if (bulk() && checked().length) {
          <div class="ds-inbox__bulk" role="status">
            <span>{{ checked().length }} selected</span>
            <ds-button size="sm" variant="ghost" (clicked)="markChecked(true)">
              {{ markReadLabel() }}
            </ds-button>
            <ds-button size="sm" variant="ghost" (clicked)="markChecked(false)">
              {{ markUnreadLabel() }}
            </ds-button>
          </div>
        }

        @if (loading()) {
          <div class="ds-inbox__loading" role="status" [attr.aria-label]="loadingLabel()">
            @for (row of skeletonRows; track row) {
              <ds-skeleton variant="rect" height="3.5rem" radius="md" />
            }
          </div>
        } @else if (!threads().length) {
          <ds-empty-state
            icon="bell"
            [title]="emptyTitle()"
            [description]="emptyDescription()"
            [live]="true"
          >
            <ng-content select="[dsInboxEmptyAction]" />
          </ds-empty-state>
        } @else {
          <div
            #list
            class="ds-inbox__list"
            role="listbox"
            [attr.aria-label]="label()"
            [attr.aria-activedescendant]="activeId()"
            tabindex="0"
            (keydown)="onKeydown($event)"
          >
            @for (thread of threads(); track thread.id; let index = $index) {
              <div
                class="ds-inbox__thread"
                [class.ds-inbox__thread--open]="thread.id === selected()"
                [class.ds-inbox__thread--active]="index === activeIndex()"
                [class.ds-inbox__thread--unread]="thread.unread"
                [class.ds-inbox__thread--disabled]="thread.disabled"
                [id]="rowId(thread.id)"
                role="option"
                [attr.aria-selected]="thread.id === selected()"
                [attr.aria-disabled]="thread.disabled ? 'true' : null"
                (click)="open(thread)"
                (mousedown)="$event.preventDefault()"
              >
                @if (bulk()) {
                  <!--
                    Decorative and inert: a focusable control inside an option is
                    a control nested in a control. Bulk is the pointer's
                    shortcut; the keyboard marks a thread read from the reading
                    pane, where the button is a real tab stop.
                  -->
                  <span
                    class="ds-inbox__check"
                    aria-hidden="true"
                    inert
                    (click)="toggleCheck($event, thread)"
                  >
                    <ds-checkbox
                      size="sm"
                      [checked]="checked().includes(thread.id)"
                      [disabled]="!!thread.disabled"
                    />
                  </span>
                }

                <ds-avatar
                  [name]="avatarName(thread)"
                  size="sm"
                  [decorative]="true"
                />

                <span class="ds-inbox__summary">
                  <span class="ds-inbox__row">
                    <span class="ds-inbox__people">{{ people(thread) }}</span>
                    <span class="ds-inbox__time">{{ thread.time }}</span>
                  </span>
                  <span class="ds-inbox__subject">
                    @if (thread.unread) {
                      <!-- Weight carries it visually; the word carries it aloud. -->
                      <span class="visually-hidden">{{ unreadLabel() }}</span>
                    }
                    {{ thread.subject }}
                  </span>
                  <span class="ds-inbox__preview">{{ thread.preview }}</span>
                  @if (thread.labels?.length) {
                    <span class="ds-inbox__labels">
                      @for (label of thread.labels; track label) {
                        <ds-badge [tone]="thread.labelTone ?? 'neutral'" [pill]="true">{{ label }}</ds-badge>
                      }
                    </span>
                  }
                </span>
              </div>
            }
          </div>
        }
      </div>

      <!-- ——— The reading pane (wide) ——— -->
      @if (!narrow()) {
        <div class="ds-inbox__detail-pane">
          @if (detailLoading()) {
            <div class="ds-inbox__detail-loading" role="status" [attr.aria-label]="loadingLabel()">
              <ds-spinner size="md" [label]="loadingLabel()" />
            </div>
          } @else if (current()) {
            <div #detail class="ds-inbox__detail" tabindex="-1" [attr.aria-labelledby]="detailTitleId">
              <ng-container
                [ngTemplateOutlet]="reading"
                [ngTemplateOutletContext]="{ $implicit: current() }"
              />
            </div>
          } @else {
            <ds-empty-state
              icon="bell"
              [title]="noSelectionTitle()"
              [description]="noSelectionDescription()"
            />
          }
        </div>
      }
    </div>

    <!-- ——— The reading pane (narrow): the Drawer's machinery, unchanged ——— -->
    @if (narrow()) {
      <ds-drawer
        [open]="drawerOpen()"
        [title]="current()?.subject ?? detailLabel()"
        [description]="current() ? people(current()!) : ''"
        size="lg"
        (closed)="onDrawerClosed()"
      >
        @if (current()) {
          <ng-container
            [ngTemplateOutlet]="reading"
            [ngTemplateOutletContext]="{ $implicit: current() }"
          />
        }
      </ds-drawer>
    }

    <!-- One reading pane, rendered in either place. -->
    <ng-template #reading let-thread>
      <div class="ds-inbox__head">
        <div>
          <h2 class="ds-inbox__title" [id]="detailTitleId">{{ thread.subject }}</h2>
          <p class="ds-inbox__participants">{{ people(thread) }}</p>
        </div>
        <div class="ds-inbox__actions">
          @if (thread.unread) {
            <ds-button size="sm" variant="ghost" (clicked)="markOne(thread, true)">
              {{ markReadLabel() }}
            </ds-button>
          }
          <ng-content select="[dsInboxActions]" />
        </div>
      </div>

      <div class="ds-inbox__messages">
        @for (message of thread.messages ?? []; track message.id) {
          <article class="ds-inbox__message">
            <header class="ds-inbox__message-head">
              <ds-avatar [name]="message.author" size="xs" [decorative]="true" />
              <span class="ds-inbox__message-author">{{ message.author }}</span>
              <span class="ds-inbox__time">{{ message.sentAt }}</span>
            </header>
            <p class="ds-inbox__message-body">{{ message.body }}</p>
          </article>
        } @empty {
          <p class="ds-inbox__preview">{{ thread.preview }}</p>
        }
      </div>

      @if (composer()) {
        <div class="ds-inbox__composer">
          <ds-textarea
            [label]="composerLabel()"
            [rows]="3"
            resize="auto"
            [placeholder]="composerPlaceholder()"
            [(value)]="draft"
            [disabled]="sending()"
          />
          <div class="ds-inbox__composer-actions">
            <ds-button
              size="sm"
              [loading]="sending()"
              [disabled]="!draft().trim()"
              (clicked)="send(thread)"
            >
              {{ sendLabel() }}
            </ds-button>
          </div>
        </div>
      }
    </ng-template>
  `,
  styles: `
    :host {
      display: block;
    }

    .ds-inbox {
      display: grid;
      grid-template-columns: minmax(16rem, 22rem) 1fr;
      min-height: 0;
      border: 1px solid var(--ds-color-border);
      border-radius: var(--ds-radius-lg);
      background-color: var(--ds-color-surface);
      overflow: hidden;
    }

    /* Narrow: the list is the page, and the detail is a drawer over it. */
    .ds-inbox--narrow {
      grid-template-columns: 1fr;
    }

    .ds-inbox__list-pane {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-2);
      padding: var(--ds-space-3);
      border-inline-end: 1px solid var(--ds-color-border);
      background-color: var(--ds-color-surface-sunken);
      max-height: var(--ds-inbox-height, 34rem);
      overflow: auto;
    }

    .ds-inbox--narrow .ds-inbox__list-pane {
      border-inline-end: 0;
    }

    .ds-inbox__bulk {
      display: flex;
      align-items: center;
      gap: var(--ds-space-2);
      padding: var(--ds-space-1_5) var(--ds-space-2);
      border-radius: var(--ds-radius-md);
      background-color: var(--ds-color-primary-muted);
      color: var(--ds-color-primary);
      font-size: var(--ds-font-size-xs);
      font-weight: var(--ds-font-weight-semibold);
    }

    .ds-inbox__list {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-1);
    }

    .ds-inbox__list:focus {
      outline: none;
    }

    .ds-inbox__list:focus-visible .ds-inbox__thread--active {
      outline: 2px solid var(--ds-color-focus-ring);
      outline-offset: -2px;
    }

    .ds-inbox__thread {
      display: flex;
      align-items: flex-start;
      gap: var(--ds-space-2_5);
      padding: var(--ds-space-2_5);
      border-radius: var(--ds-radius-md);
      background-color: var(--ds-color-surface);
      cursor: pointer;
    }

    .ds-inbox__thread:hover:not(.ds-inbox__thread--disabled) {
      background-color: var(--ds-color-surface-elevated);
    }

    .ds-inbox__thread--open {
      background-color: var(--ds-color-primary-muted);
    }

    .ds-inbox__thread--disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    /* Unread is weight and a bar — never colour alone. */
    .ds-inbox__thread--unread {
      box-shadow: inset 3px 0 0 0 var(--ds-color-primary);
    }

    .ds-inbox__thread--unread .ds-inbox__subject,
    .ds-inbox__thread--unread .ds-inbox__people {
      font-weight: var(--ds-font-weight-bold);
      color: var(--ds-color-text);
    }

    .ds-inbox__summary {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      min-width: 0;
      flex: 1 1 auto;
    }

    .ds-inbox__row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--ds-space-2);
    }

    .ds-inbox__people {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-medium);
      color: var(--ds-color-text);
    }

    .ds-inbox__time {
      flex-shrink: 0;
      font-family: var(--ds-font-mono);
      font-size: var(--ds-font-size-xs);
      color: var(--ds-color-text-subtle);
    }

    .ds-inbox__subject {
      font-size: var(--ds-font-size-sm);
      color: var(--ds-color-text);
    }

    .ds-inbox__preview {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: var(--ds-font-size-xs);
      color: var(--ds-color-text-muted);
    }

    .ds-inbox__labels {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ds-space-1);
      margin-block-start: var(--ds-space-1);
    }

    .ds-inbox__check {
      flex-shrink: 0;
    }

    .ds-inbox__detail-pane {
      display: flex;
      flex-direction: column;
      padding: var(--ds-space-5);
      max-height: var(--ds-inbox-height, 34rem);
      overflow: auto;
    }

    .ds-inbox__detail:focus {
      outline: none;
    }

    .ds-inbox__detail-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1 1 auto;
      min-height: 12rem;
    }

    .ds-inbox__head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--ds-space-3);
      padding-block-end: var(--ds-space-4);
      border-block-end: 1px solid var(--ds-color-border);
    }

    .ds-inbox__title {
      margin: 0;
      font-size: var(--ds-font-size-lg);
      font-weight: var(--ds-font-weight-semibold);
      color: var(--ds-color-text);
    }

    .ds-inbox__participants {
      margin: var(--ds-space-1) 0 0;
      font-size: var(--ds-font-size-sm);
      color: var(--ds-color-text-muted);
    }

    .ds-inbox__actions {
      display: flex;
      gap: var(--ds-space-2);
    }

    .ds-inbox__messages {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-4);
      padding-block: var(--ds-space-4);
    }

    .ds-inbox__message-head {
      display: flex;
      align-items: center;
      gap: var(--ds-space-2);
    }

    .ds-inbox__message-author {
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-semibold);
    }

    .ds-inbox__message-body {
      margin: var(--ds-space-1_5) 0 0;
      font-size: var(--ds-font-size-sm);
      line-height: var(--ds-line-height-relaxed);
      color: var(--ds-color-text);
      white-space: pre-line;
    }

    .ds-inbox__composer {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-2);
      padding-block-start: var(--ds-space-4);
      border-block-start: 1px solid var(--ds-color-border);
    }

    .ds-inbox__composer-actions {
      display: flex;
      justify-content: flex-end;
    }

    .ds-inbox__loading {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-2);
    }
  `,
})
export class InboxComponent<T = unknown> {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly threads = input<readonly InboxThread<T>[]>([]);
  /** Which thread is open — one at a time, or `null`. */
  readonly selected = model<string | null>(null);
  /** The whole list is loading. */
  readonly loading = input(false);
  /** The open thread's messages are loading. */
  readonly detailLoading = input(false);
  /**
   * Narrow viewport: the detail becomes a `<ds-drawer>`. The host decides,
   * because only the host knows how wide its column is.
   */
  readonly narrow = input(false);
  /** Show the reply composer under the conversation. */
  readonly composer = input(false);
  /** A reply is in flight; the composer waits. */
  readonly sending = input(false);
  /** Offer per-row checkboxes and a mark-read bar. Secondary, on purpose. */
  readonly bulk = input(false);

  readonly label = input<string>('Threads');
  readonly detailLabel = input<string>('Conversation');
  readonly loadingLabel = input<string>('Loading…');
  readonly emptyTitle = input<string>('Nothing in the inbox');
  readonly emptyDescription = input<string>('New threads will appear here.');
  readonly noSelectionTitle = input<string>('Nothing selected');
  readonly noSelectionDescription = input<string>('Choose a thread on the left to read it.');
  readonly unreadLabel = input<string>('Unread');
  readonly selectLabel = input<string>('Select');
  readonly markReadLabel = input<string>('Mark read');
  readonly markUnreadLabel = input<string>('Mark unread');
  readonly composerLabel = input<string>('Reply');
  readonly composerPlaceholder = input<string>('Write a reply…');
  readonly sendLabel = input<string>('Send');

  /** A thread was opened — by click or `Enter`. */
  readonly threadOpen = output<InboxThreadEvent<T>>();
  /** The composer was sent. The host owns the transport. */
  readonly reply = output<InboxReply<T>>();
  /** Read state the host is asked to change. The organism changes nothing. */
  readonly readChange = output<InboxReadChange<T>>();

  protected readonly skeletonRows = [0, 1, 2, 3, 4];
  protected readonly detailTitleId = uniqueId('ds-inbox-title');
  private readonly instance = uniqueId('ds-inbox');

  protected readonly activeIndex = signal(0);
  protected readonly checked = signal<readonly string[]>([]);
  protected readonly draft = model('');
  protected readonly drawerOpen = signal(false);

  private readonly listRef = viewChild<ElementRef<HTMLElement>>('list');
  private readonly detailRef = viewChild<ElementRef<HTMLElement>>('detail');

  protected readonly current = computed(
    () => this.threads().find((thread) => thread.id === this.selected()) ?? null,
  );

  protected readonly activeId = computed(() => {
    const thread = this.threads()[this.activeIndex()];
    return thread ? this.rowId(thread.id) : null;
  });

  protected readonly classes = computed(() =>
    cx('ds-inbox', this.narrow() && 'ds-inbox--narrow'),
  );

  protected rowId(id: string): string {
    return `${this.instance}-thread-${id}`;
  }

  /** Whose face goes on the row: the first participant, or the subject. */
  protected avatarName(thread: InboxThread<T>): string {
    return thread.participants.length ? thread.participants[0] : thread.subject;
  }

  /** "Ada Lovelace, Grace Hopper" — or "Ada Lovelace and 3 others". */
  protected people(thread: InboxThread<T>): string {
    const names = thread.participants;
    if (names.length <= 2) {
      return names.join(', ');
    }
    return `${names[0]} and ${names.length - 1} others`;
  }

  /** Opens a thread: the selection, the report, and the focus. */
  open(thread: InboxThread<T>): void {
    const index = this.threads().indexOf(thread);
    this.activeIndex.set(index);
    if (thread.disabled) {
      return;
    }
    this.selected.set(thread.id);
    this.draft.set('');
    this.threadOpen.emit({ thread, index });

    if (this.narrow()) {
      this.drawerOpen.set(true);
      return;
    }
    // Wide: focus the reading pane, so the next Tab is inside what just opened.
    queueMicrotask(() => this.detailRef()?.nativeElement.focus());
  }

  /** Closes the narrow detail and gives focus back to the thread's row. */
  closeDetail(): void {
    this.drawerOpen.set(false);
    const id = this.selected();
    if (id) {
      this.host.nativeElement
        .querySelector<HTMLElement>(`#${CSS.escape(this.rowId(id))}`)
        ?.scrollIntoView({ block: 'nearest' });
    }
    // After the Drawer's own restore, not before it: the drawer puts focus back
    // where it was when it opened, and the list is where it should actually go.
    // A task, not a microtask: the Drawer restores focus to wherever it was
    // when it opened, and the list is where it should actually land.
    setTimeout(() => this.listRef()?.nativeElement.focus());
  }

  protected onDrawerClosed(): void {
    this.closeDetail();
  }

  protected send(thread: InboxThread<T>): void {
    const body = this.draft().trim();
    if (!body) {
      return;
    }
    this.reply.emit({ thread, body });
    this.draft.set('');
  }

  protected markOne(thread: InboxThread<T>, read: boolean): void {
    this.readChange.emit({ threadIds: [thread.id], read, threads: [thread] });
  }

  protected markChecked(read: boolean): void {
    const ids = this.checked();
    const threads = this.threads().filter((thread) => ids.includes(thread.id));
    this.readChange.emit({ threadIds: ids, read, threads });
    this.checked.set([]);
  }

  protected toggleCheck(event: Event, thread: InboxThread<T>): void {
    // Ticking a thread is not opening it.
    event.stopPropagation();
    if (thread.disabled) {
      return;
    }
    this.checked.update((ids) =>
      ids.includes(thread.id) ? ids.filter((id) => id !== thread.id) : [...ids, thread.id],
    );
  }

  protected onKeydown(event: KeyboardEvent): void {
    const threads = this.threads();
    if (!threads.length) {
      return;
    }
    const last = threads.length - 1;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.set(Math.min(this.activeIndex() + 1, last));
        return;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.set(Math.max(this.activeIndex() - 1, 0));
        return;
      case 'Home':
        event.preventDefault();
        this.activeIndex.set(0);
        return;
      case 'End':
        event.preventDefault();
        this.activeIndex.set(last);
        return;
      case 'Enter':
        // Arrowing skims; Enter opens. A queue you cannot skim is a queue.
        event.preventDefault();
        this.open(threads[this.activeIndex()]);
        return;
      default:
        this.typeahead(event);
    }
  }

  private buffer = '';
  private bufferTimer: ReturnType<typeof setTimeout> | null = null;

  /** Typeahead over the subjects — what a person remembers about a thread. */
  private typeahead(event: KeyboardEvent): void {
    if (event.key.length !== 1 || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }
    this.buffer += event.key;
    if (this.bufferTimer) {
      clearTimeout(this.bufferTimer);
    }
    this.bufferTimer = setTimeout(() => {
      this.buffer = '';
    }, 600);

    const match = typeaheadIndex(
      this.threads().map((thread) => thread.subject),
      this.buffer,
      this.activeIndex(),
    );
    if (match !== null) {
      event.preventDefault();
      this.activeIndex.set(match);
      const id = this.activeId();
      if (id) {
        this.host.nativeElement
          .querySelector(`#${CSS.escape(id)}`)
          ?.scrollIntoView({ block: 'nearest' });
      }
    }
  }
}
