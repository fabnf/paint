import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  DS_COMPONENTS,
  DS_PRIMITIVES,
  InboxComponent,
  SchedulerComponent,
  ToastService,
  type InboxReadChange,
  type InboxReply,
  type InboxThread,
  type SchedulerEvent,
  type SchedulerEventEvent,
  type SchedulerView,
} from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/** The workspace's two modes. Two organisms, one surface. */
type Mode = 'mail' | 'calendar';

/**
 * Inbox & Scheduler — documentation page, as an operations workspace.
 *
 * Mail and Calendar over the same week of invented-but-plausible data: a support
 * queue with unread threads and replies, and a calendar with overlapping
 * meetings. Two organisms, deliberately not merged.
 */
@Component({
  selector: 'app-workspace-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, InboxComponent, SchedulerComponent, DOC_UI],
  templateUrl: './workspace.page.html',
  styleUrl: './components-page.scss',
})
export class WorkspacePage {
  private readonly toasts = inject(ToastService);

  readonly mode = signal<Mode>('mail');

  // —— Mail ——
  private readonly seedThreads: readonly InboxThread[] = [
    {
      id: 'invoice-4471',
      subject: 'Invoice 4471 is overdue',
      participants: ['Ada Lovelace', 'Billing bot'],
      preview: 'The card on file was declined twice this week.',
      time: '09:42',
      unread: true,
      labels: ['Billing'],
      labelTone: 'warning',
      messages: [
        {
          id: 'm1',
          author: 'Ada Lovelace',
          body: 'The card on file was declined twice this week. Can someone retry it before the account suspends?',
          sentAt: 'Today 09:42',
        },
      ],
    },
    {
      id: 'acme-sso',
      subject: 'Onboarding questions from Acme',
      participants: ['Grace Hopper', 'Alan Turing', 'Katherine Johnson'],
      preview: 'Three questions about SSO before they sign.',
      time: '08:15',
      unread: true,
      labels: ['Sales'],
      labelTone: 'info',
      messages: [
        {
          id: 'm2',
          author: 'Grace Hopper',
          body: 'Before we sign: do you support SCIM provisioning, enforced SSO, and per-workspace audit export?',
          sentAt: 'Today 08:15',
        },
        {
          id: 'm3',
          author: 'You',
          body: 'SCIM and enforced SSO, yes. Audit export is on the Enterprise plan — I will send the guide.',
          sentAt: 'Today 08:31',
        },
      ],
    },
    {
      id: 'latency',
      subject: 'Latency spike in eu-central',
      participants: ['Alan Turing'],
      preview: 'p99 doubled for about eleven minutes at 04:10.',
      time: 'Yesterday',
      labels: ['Incident', 'Resolved'],
      labelTone: 'danger',
      count: 6,
      messages: [
        {
          id: 'm4',
          author: 'Alan Turing',
          body: 'p99 doubled for about eleven minutes at 04:10 UTC. Cause was a slow migration on the replica; it is back to normal.',
          sentAt: 'Yesterday 05:02',
        },
      ],
    },
    {
      id: 'brand-pack',
      subject: 'Tidewater pack: can we tweak the accent?',
      participants: ['Katherine Johnson', 'Ada Lovelace'],
      preview: 'The teal reads a little cold on the marketing site.',
      time: 'Mon',
      messages: [
        {
          id: 'm5',
          author: 'Katherine Johnson',
          body: 'The teal reads a little cold against our photography. Could the accent move two steps warmer?',
          sentAt: 'Monday 14:20',
        },
      ],
    },
    {
      id: 'zephyr',
      subject: 'Zephyr migration (closed)',
      participants: ['Billing bot'],
      preview: 'Closed automatically after the migration shipped.',
      time: 'Mar 3',
      disabled: true,
    },
  ];

  readonly threads = signal<readonly InboxThread[]>(this.seedThreads);
  readonly openThread = signal<string | null>(null);
  readonly mailLoading = signal(false);
  readonly sending = signal(false);
  readonly narrow = signal(false);
  readonly bulk = signal(false);

  readonly unreadCount = computed(() => this.threads().filter((thread) => thread.unread).length);

  loadMail(): void {
    this.mailLoading.set(true);
    this.openThread.set(null);
    setTimeout(() => {
      this.threads.set(this.seedThreads);
      this.mailLoading.set(false);
    }, 600);
  }

  emptyMail(): void {
    this.threads.set([]);
    this.openThread.set(null);
  }

  /** The host owns the data: marking read is our job, not the organism's. */
  onReadChange(change: InboxReadChange): void {
    this.threads.update((threads) =>
      threads.map((thread) =>
        change.threadIds.includes(thread.id) ? { ...thread, unread: !change.read } : thread,
      ),
    );
  }

  /** And so is sending. No transport in the design system. */
  onReply(reply: InboxReply): void {
    this.sending.set(true);
    setTimeout(() => {
      this.sending.set(false);
      this.threads.update((threads) =>
        threads.map((thread) =>
          thread.id === reply.thread.id
            ? {
                ...thread,
                unread: false,
                preview: reply.body,
                time: 'Just now',
                messages: [
                  ...(thread.messages ?? []),
                  { id: `r${Date.now()}`, author: 'You', body: reply.body, sentAt: 'Just now' },
                ],
              }
            : thread,
        ),
      );
      this.toasts.success('Reply sent', { description: `To: ${reply.thread.participants[0]}` });
    }, 500);
  }

  // —— Calendar ——
  readonly today = '2026-03-04';

  private readonly seedEvents: readonly SchedulerEvent[] = [
    { id: 'standup', title: 'Standup', start: '2026-03-02T09:00', end: '2026-03-02T09:15', calendar: 'Team' },
    { id: 'standup-w', title: 'Standup', start: '2026-03-04T09:00', end: '2026-03-04T09:15', calendar: 'Team' },
    { id: 'design', title: 'Design review: charts', start: '2026-03-04T09:00', end: '2026-03-04T10:00', tone: 'accent', calendar: 'Design', location: 'Studio' },
    { id: 'acme', title: 'Acme onboarding call', start: '2026-03-04T09:30', end: '2026-03-04T11:00', tone: 'info', calendar: 'Sales', location: 'Zoom' },
    { id: 'pairing', title: 'Pairing: tree keyboard', start: '2026-03-04T13:00', end: '2026-03-04T14:30', calendar: 'Engineering' },
    { id: 'retro', title: 'Sprint retro', start: '2026-03-04T15:00', end: '2026-03-04T16:00', tone: 'success', calendar: 'Team' },
    { id: 'incident', title: 'Incident review: eu-central', start: '2026-03-05T11:00', end: '2026-03-05T12:00', tone: 'danger', calendar: 'Engineering', description: 'p99 doubled for eleven minutes on the replica.' },
    { id: 'offsite', title: 'Design offsite', start: '2026-03-06', end: '2026-03-07', allDay: true, tone: 'accent', calendar: 'Design' },
    { id: 'billing', title: 'Billing sync', start: '2026-03-10T10:00', end: '2026-03-10T10:30', tone: 'warning', calendar: 'Finance' },
    { id: 'board', title: 'Board meeting', start: '2026-03-19T14:00', end: '2026-03-19T16:00', tone: 'warning', calendar: 'Exec', location: 'Room 1' },
    { id: 'release', title: 'Release 0.5', start: '2026-03-27', allDay: true, tone: 'success', calendar: 'Engineering' },
  ];

  readonly events = signal<readonly SchedulerEvent[]>(this.seedEvents);
  readonly view = signal<SchedulerView>('month');
  readonly anchor = signal(this.today);
  readonly calendarLoading = signal(false);
  readonly lastEvent = signal<string>('');

  loadCalendar(): void {
    this.calendarLoading.set(true);
    setTimeout(() => {
      this.events.set(this.seedEvents);
      this.calendarLoading.set(false);
    }, 600);
  }

  emptyCalendar(): void {
    this.events.set([]);
  }

  onEventOpen(event: SchedulerEventEvent): void {
    this.lastEvent.set(`${event.event.title}${event.date ? ` · ${event.date}` : ''}`);
  }

  readonly inboxSnippet = `<ds-inbox
  [threads]="threads()"
  [(selected)]="openThread"
  [loading]="loading()"
  [narrow]="narrow()"
  [composer]="true"
  (reply)="send($event)"
  (readChange)="markRead($event)"
/>`;

  readonly schedulerSnippet = `<ds-scheduler
  [events]="events()"
  [(view)]="view"
  [(date)]="anchor"
  [loading]="loading()"
  (rangeChange)="fetch($event)"
  (eventOpen)="track($event.event)"
/>`;

  readonly inboxRows: readonly ApiRow[] = [
    { name: 'threads', type: 'readonly InboxThread[]', default: '[]', description: 'id, subject, participants, preview, time, unread, labels, count, disabled, messages.' },
    { name: 'selected', type: 'model<string | null>', default: 'null', description: 'Which thread is open — one at a time, or none.' },
    { name: 'narrow', type: 'boolean', default: 'false', description: 'The detail becomes a <ds-drawer>. The host decides: only it knows how wide its column is.' },
    { name: 'composer / sending', type: 'boolean', default: 'false', description: 'Show the reply box, and make it wait while the host sends.' },
    { name: 'bulk', type: 'boolean', default: 'false', description: 'Per-row checkboxes and a mark-read bar. Secondary, on purpose.' },
    { name: 'loading / detailLoading', type: 'boolean', default: 'false', description: 'The list, and the open conversation.' },
    { name: 'threadOpen / reply / readChange', type: 'outputs', default: '—', description: 'Reports. The host owns the data, the transport and the read state.' },
  ];

  readonly schedulerRows: readonly ApiRow[] = [
    { name: 'events', type: 'readonly SchedulerEvent[]', default: '[]', description: 'id, title, start/end (ISO strings), allDay, calendar, tone, location, description.' },
    { name: 'view', type: `model<'month' | 'week' | 'day' | 'agenda'>`, default: `'month'`, description: 'Which view. Two-way, so it can live in the URL.' },
    { name: 'date', type: 'model<IsoDate>', default: 'today', description: 'What the view is anchored on — and the selected day.' },
    { name: 'views', type: 'readonly SchedulerView[]', default: `['month','week','agenda']`, description: 'Which views to offer.' },
    { name: 'detail', type: 'boolean', default: 'true', description: 'Open an event in Paint’s drawer. false leaves it to the host’s slot.' },
    { name: 'today', type: 'IsoDate', default: 'todayIso()', description: 'What “today” is — injectable, so a test is not a hostage to the clock.' },
    { name: 'rangeChange / eventOpen / daySelect', type: 'outputs', default: '—', description: 'The visible range, an opened event, and a chosen day — three different things.' },
  ];

  readonly contractRows: readonly ApiRow[] = [
    { name: 'Two item types', type: 'decision', default: '—', description: 'A thread has participants, a preview and an unread flag; an event has a start, an end and a calendar. Neither is a CollectionItem, and neither pretends to be.' },
    { name: 'Shared chrome only', type: 'decision', default: '—', description: 'Density tokens, EmptyState, Skeleton, Spinner, Avatar, Badge and the Drawer are shared. The data models are not.' },
    { name: 'Inbox focus', type: 'decision', default: '—', description: 'One tab stop over the list with an aria-activedescendant cursor: arrows skim, Enter opens. Opening moves focus to the reading pane; on narrow, into the drawer, and back to the list on close.' },
    { name: 'Scheduler focus', type: 'decision', default: '—', description: 'One tab stop over the grid with a day cursor: arrows move a day (a week vertically in month view), Home/End hit the range edges, Enter opens the day’s first event or selects the day.' },
    { name: 'Selection', type: 'decision', default: '—', description: 'Inbox: one open thread. Scheduler: one selected day, and opening an event is a separate act. Neither organism ever mutates the host’s data.' },
  ];
}