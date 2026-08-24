import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FeedBodyDirective, FeedEmptyActionDirective } from './feed-slots';
import { FeedComponent } from './feed.component';
import {
  absoluteTime,
  countUnread,
  relativeTime,
  type FeedItem,
  type FeedOrientation,
} from './feed.types';

/** The frozen moment every relative clock in this file ticks against. */
const NOW = '2026-03-04T12:00:00Z';

const ITEMS: readonly FeedItem<{ quote?: string }>[] = [
  {
    id: 'comment',
    title: 'Ada commented on Mural',
    description: 'Left a note on the header spacing.',
    timestamp: '2026-03-04T11:58:30Z',
    actor: 'Ada Lovelace',
    unread: true,
    data: { quote: 'The rail reads better at 2px.' },
  },
  {
    id: 'deploy',
    title: 'Canvas deployed to production',
    timestamp: '2026-03-04T09:00:00Z',
    icon: 'zap',
    tone: 'success',
    unread: true,
  },
  {
    id: 'invoice',
    title: 'INV-204 was paid',
    timestamp: '2026-03-01T12:00:00Z',
    icon: 'file',
  },
];

describe('feed time helpers', () => {
  const now = new Date(NOW);

  it('speaks relative time with a shelf life', () => {
    expect(relativeTime('2026-03-04T11:59:40Z', now)).toBe('just now');
    expect(relativeTime('2026-03-04T11:15:00Z', now)).toBe('45m ago');
    expect(relativeTime('2026-03-04T03:00:00Z', now)).toBe('9h ago');
    expect(relativeTime('2026-03-01T12:00:00Z', now)).toBe('3d ago');
    // Past a week, a date spares the reader the arithmetic.
    expect(relativeTime('2026-02-10T12:00:00Z', now)).toContain('Feb 2026');
    expect(relativeTime('not-a-date', now)).toBe('not-a-date');
  });

  it('keeps the absolute moment for ears and tooltips', () => {
    expect(absoluteTime('2026-03-04T09:00:00Z')).toContain('March 2026');
  });

  it('counts the unread — the bell badge, in one call', () => {
    expect(countUnread(ITEMS)).toBe(2);
    expect(countUnread([])).toBe(0);
  });
});

describe('FeedComponent', () => {
  @Component({
    standalone: true,
    imports: [FeedComponent, FeedBodyDirective, FeedEmptyActionDirective],
    template: `
      <ds-feed
        [items]="items()"
        [orientation]="orientation()"
        [now]="'${NOW}'"
        label="Project activity"
        [empty]="{ icon: 'bell', title: 'All caught up', description: 'New activity lands here.' }"
        (itemOpen)="opened.push($event.id)"
        (markRead)="read.push($event.id)"
      >
        @if (withBody()) {
          <ng-template dsFeedBody [dsFeedBodyItems]="items()" let-item>
            @if (item.data?.quote) {
              <blockquote class="test-quote">{{ item.data?.quote }}</blockquote>
            }
          </ng-template>
        }
        <button dsFeedEmptyAction type="button" id="empty-action">Refresh</button>
      </ds-feed>
    `,
  })
  class HostComponent {
    readonly items = signal<readonly FeedItem<{ quote?: string }>[]>(ITEMS);
    readonly orientation = signal<FeedOrientation>('vertical');
    readonly withBody = signal(false);
    opened: string[] = [];
    read: string[] = [];

    markRead(id: string): void {
      this.items.update((items) =>
        items.map((item) => (item.id === id ? { ...item, unread: false } : item)),
      );
    }
  }

  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <E extends HTMLElement>(selector: string): E | null =>
    fixture.nativeElement.querySelector(selector);
  const entries = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.ds-feed__entry'));
  const entry = (id: string): HTMLElement =>
    entries().find((e) => e.textContent!.includes(ITEMS.find((i) => i.id === id)!.title))!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a named list with one entry per event', () => {
    const list = query('ol.ds-feed')!;
    expect(list.getAttribute('aria-label')).toBe('Project activity');
    expect(entries().length).toBe(3);
  });

  it('draws the right node: an avatar for actors, a toned tile for icons, a dot for neither', () => {
    expect(entry('comment').querySelector('ds-avatar')).toBeTruthy();

    const deployDot = entry('deploy').querySelector('.ds-feed__dot--icon')!;
    expect(deployDot.classList).toContain('ds-tone--success');
    expect(deployDot.querySelector('ds-icon')).toBeTruthy();

    // Every node is decoration: the titles carry the words.
    expect(entry('deploy').querySelector('.ds-feed__node')!.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('tells time relatively, anchored to the injected clock, absolute for ears', () => {
    const time = entry('comment').querySelector('time')!;
    expect(time.textContent!.trim()).toBe('1m ago');
    expect(entry('deploy').querySelector('time')!.textContent!.trim()).toBe('3h ago');
    expect(entry('invoice').querySelector('time')!.textContent!.trim()).toBe('3d ago');

    expect(time.getAttribute('datetime')).toBe('2026-03-04T11:58:30Z');
    expect(time.getAttribute('aria-label')).toContain('March 2026');
  });

  it('unread is weight, a dot, and a word for screen readers', () => {
    expect(entry('comment').classList).toContain('ds-feed__entry--unread');
    expect(entry('comment').querySelector('.ds-feed__title')!.textContent).toContain('(unread)');

    // Read items carry none of it — no stray affordances.
    expect(entry('invoice').classList).not.toContain('ds-feed__entry--unread');
    expect(entry('invoice').querySelector('.ds-feed__unread')).toBeNull();
  });

  it('the title opens; the dot marks read; the host flips the flag', () => {
    (entry('comment').querySelector('.ds-feed__title') as HTMLElement).click();
    expect(host.opened).toEqual(['comment']);

    const dot = entry('deploy').querySelector<HTMLElement>('.ds-feed__unread')!;
    expect(dot.getAttribute('aria-label')).toBe('Mark as read: Canvas deployed to production');
    dot.click();
    expect(host.read).toEqual(['deploy']);

    // The feed changed nothing — the items are the host's.
    expect(entry('deploy').classList).toContain('ds-feed__entry--unread');

    // The host flips the flag, and the feed follows.
    host.markRead('deploy');
    fixture.detectChanges();
    expect(entry('deploy').classList).not.toContain('ds-feed__entry--unread');
    expect(entry('deploy').querySelector('.ds-feed__unread')).toBeNull();
  });

  it('renders the host-owned body inside the entry, typed item in scope', () => {
    host.withBody.set(true);
    fixture.detectChanges();

    expect(entry('comment').querySelector('.test-quote')!.textContent).toContain(
      'The rail reads better at 2px.',
    );
    // No quote, no body content — the template decides per item.
    expect(entry('deploy').querySelector('.test-quote')).toBeNull();
  });

  it('turns horizontal on request, connector and all', () => {
    host.orientation.set('horizontal');
    fixture.detectChanges();

    expect(query('.ds-feed')!.classList).toContain('ds-feed--horizontal');
    expect(entries().length).toBe(3);
  });

  it('an empty feed is an empty state, with the way out projected in', () => {
    host.items.set([]);
    fixture.detectChanges();

    expect(query('ol.ds-feed')).toBeNull();
    const emptyState = query('ds-empty-state')!;
    expect(emptyState.textContent).toContain('All caught up');
    expect(emptyState.querySelector('#empty-action')).toBeTruthy();
  });
});
