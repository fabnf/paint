import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  DS_COMPONENTS,
  DS_PRIMITIVES,
  ToastService,
  countUnread,
  type FeedItem,
} from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

interface ActivityData {
  quote?: string;
  diff?: string;
}

/** The docs page lives at a fixed moment, so "2h ago" never rots. */
const NOW = '2026-03-04T12:00:00Z';

/**
 * Feed — documentation page.
 */
@Component({
  selector: 'app-feed-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI],
  templateUrl: './feed.page.html',
  styleUrl: './feed.page.scss',
})
export class FeedPage {
  private readonly toasts = inject(ToastService);

  readonly now = NOW;

  // —— the activity timeline ——
  readonly activity: readonly FeedItem<ActivityData>[] = [
    {
      id: 'comment',
      title: 'Ada commented on Mural',
      timestamp: '2026-03-04T11:20:00Z',
      actor: 'Ada Lovelace',
      data: { quote: 'The rail reads better at 2px. Shipping it.' },
    },
    {
      id: 'deploy',
      title: 'Canvas deployed to production',
      description: 'Release 4.2.0 · 2m 41s',
      timestamp: '2026-03-04T09:12:00Z',
      icon: 'zap',
      tone: 'success',
    },
    {
      id: 'edit',
      title: 'Grace edited the brand tokens',
      timestamp: '2026-03-03T16:40:00Z',
      actor: 'Grace Hopper',
      data: { diff: '+12 −4 in tokens/colors.tokens.ts' },
    },
    {
      id: 'alarm',
      title: 'Fresco error rate crossed 2%',
      description: 'Resolved after 14 minutes.',
      timestamp: '2026-03-02T03:05:00Z',
      icon: 'warning',
      tone: 'danger',
    },
    {
      id: 'invoice',
      title: 'INV-204 was paid',
      timestamp: '2026-02-18T12:00:00Z',
      icon: 'file',
    },
  ];

  // —— the horizontal milestones ——
  readonly releases: readonly FeedItem[] = [
    { id: 'v1', title: 'v0.1 “Primer”', description: 'Tokens and primitives', timestamp: '2025-09-02T12:00:00Z', icon: 'box', tone: 'neutral' },
    { id: 'v2', title: 'v0.2 “Gesso”', description: 'Form molecules', timestamp: '2025-11-18T12:00:00Z', icon: 'layers', tone: 'info' },
    { id: 'v3', title: 'v0.3 “Wet Paint”', description: 'The component layer', timestamp: '2026-01-27T12:00:00Z', icon: 'sparkle', tone: 'primary' },
    { id: 'v4', title: 'v0.4 (next)', description: 'Organisms, organisms', timestamp: '2026-03-01T12:00:00Z', icon: 'zap', tone: 'accent' },
  ];

  // —— the notification inbox ——
  readonly notifications = signal<readonly FeedItem[]>([
    { id: 'n1', title: 'Ada mentioned you on Mural', description: '“@you does the rail read better at 2px?”', timestamp: '2026-03-04T11:45:00Z', actor: 'Ada Lovelace', unread: true },
    { id: 'n2', title: 'Export finished', description: 'ledger-2026-02.csv is ready.', timestamp: '2026-03-04T10:05:00Z', icon: 'download', tone: 'success', unread: true },
    { id: 'n3', title: 'Your trial ends in 3 days', timestamp: '2026-03-03T08:00:00Z', icon: 'warning', tone: 'warning', unread: true },
    { id: 'n4', title: 'Katherine joined the workspace', timestamp: '2026-03-01T09:30:00Z', actor: 'Katherine Johnson' },
  ]);

  readonly unreadCount = computed(() => countUnread(this.notifications()));
  readonly lastOpened = signal('');

  openNotification(item: FeedItem): void {
    // Opening is reading: the host flips the flag and does its navigation.
    this.markRead(item);
    this.lastOpened.set(item.title);
    this.toasts.info('Opened', { description: item.title });
  }

  markRead(item: FeedItem): void {
    this.notifications.update((items) =>
      items.map((candidate) =>
        candidate.id === item.id ? { ...candidate, unread: false } : candidate,
      ),
    );
  }

  markAllRead(): void {
    this.notifications.update((items) => items.map((item) => ({ ...item, unread: false })));
  }

  clearAll(): void {
    this.notifications.set([]);
  }

  restock(): void {
    this.notifications.set([
      { id: 'n5', title: 'Canvas deployed to production', timestamp: NOW, icon: 'zap', tone: 'success', unread: true },
    ]);
  }

  readonly timelineSnippet = `<ds-feed [items]="activity" [now]="now" (itemOpen)="open($event)">
  <!-- The body under each title is the host's, with the item in scope. -->
  <ng-template dsFeedBody [dsFeedBodyItems]="activity" let-item>
    @if (item.data?.quote) { <blockquote>{{ item.data.quote }}</blockquote> }
    @if (item.data?.diff) { <code>{{ item.data.diff }}</code> }
  </ng-template>
</ds-feed>`;

  readonly inboxSnippet = `<!-- The inbox is the same organism inside the popover molecule: no new parts. -->
<span class="bell">
  <ds-popover label="Notifications" icon="bell" [iconOnly]="true" align="end" [width]="380">
    <ds-flex justify="between" align="center">
      <ds-text variant="label">Notifications</ds-text>
      @if (unreadCount() > 0) {
        <ds-button variant="ghost" size="sm" (clicked)="markAllRead()">Mark all read</ds-button>
      }
    </ds-flex>
    <ds-feed
      [items]="notifications()"
      [empty]="{ icon: 'bell', title: 'All caught up' }"
      (itemOpen)="openNotification($event)"
      (markRead)="markRead($event)"
    />
  </ds-popover>
  @if (unreadCount() > 0) {
    <ds-badge class="bell__count" tone="accent" variant="solid" [srLabel]="unreadCount() + ' unread notifications'">
      {{ unreadCount() }}
    </ds-badge>
  }
</span>

// The badge is one helper over the host's own items:
readonly unreadCount = computed(() => countUnread(this.notifications()));`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'items', type: 'FeedItem<T>[]', default: 'required', description: 'The events, newest first by convention. The host owns them; the feed never mutates one.' },
    { name: 'orientation', type: `'vertical' | 'horizontal'`, default: `'vertical'`, description: 'Vertical is the feed. Horizontal is for the few that earn it: releases, milestones.' },
    { name: 'label', type: 'string', default: `'Activity feed'`, description: 'The list’s accessible name.' },
    { name: 'empty', type: '{ icon?, title, description? }', default: `{ title: 'Nothing yet' }`, description: 'The ds-empty-state copy — the DataTable’s shape, once more.' },
    { name: 'now', type: 'string | null', default: 'the clock', description: 'An ISO instant pinning “2h ago” — for tests, and for screenshots that must not rot.' },
    { name: 'markReadLabel / locale', type: 'string', default: `'Mark as read' / 'en-GB'`, description: 'The dot’s name, and the date formatting.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'itemOpen', type: 'OutputEmitterRef<FeedItem<T>>', default: '—', description: 'A title was pressed. What opening means is the host’s business.' },
    { name: 'markRead', type: 'OutputEmitterRef<FeedItem<T>>', default: '—', description: 'The unread dot was pressed. The host flips the flag — the items are its.' },
  ];

  readonly slots: readonly ApiRow[] = [
    { name: '[dsFeedBody]', type: 'ng-template', default: '—', description: 'The host-owned body inside each entry, let-item in scope. Type it with [dsFeedBodyItems].' },
    { name: '[dsFeedEmptyAction]', type: 'content', default: '—', description: 'The way out of the empty state.' },
  ];

  readonly helpers: readonly ApiRow[] = [
    { name: 'countUnread(items)', type: 'function', default: '—', description: 'The bell badge, in one call.' },
    { name: 'relativeTime(iso, now?, locale?)', type: 'function', default: '—', description: '“just now”, “5m ago”, “2h ago”, “3d ago” — then it is a date.' },
    { name: 'absoluteTime(iso, locale?)', type: 'function', default: '—', description: 'The full moment, used in the tooltip and the accessible name.' },
  ];
}
