import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { InboxComponent } from './inbox.component';
import type { InboxReadChange, InboxReply, InboxThread, InboxThreadEvent } from './inbox.types';

const THREADS: readonly InboxThread[] = [
  {
    id: 'invoice',
    subject: 'Invoice 4471 is overdue',
    participants: ['Ada Lovelace', 'Billing bot'],
    preview: 'The card on file was declined twice this week.',
    time: '09:42',
    unread: true,
    labels: ['Billing'],
    labelTone: 'warning',
    messages: [
      { id: 'm1', author: 'Ada Lovelace', body: 'The card was declined again.', sentAt: '09:42' },
    ],
  },
  {
    id: 'onboarding',
    subject: 'Onboarding questions from Acme',
    participants: ['Grace Hopper', 'Alan Turing', 'Katherine Johnson'],
    preview: 'Three questions about SSO before they sign.',
    time: 'Yesterday',
    messages: [
      { id: 'm2', author: 'Grace Hopper', body: 'Do you support SCIM?', sentAt: 'Yesterday' },
      { id: 'm3', author: 'You', body: 'We do — here is the guide.', sentAt: 'Yesterday' },
    ],
  },
  {
    id: 'archived',
    subject: 'Zephyr migration (closed)',
    participants: ['Katherine Johnson'],
    preview: 'Closed after the migration shipped.',
    time: 'Mar 3',
    disabled: true,
  },
];

@Component({
  standalone: true,
  imports: [InboxComponent],
  template: `
    <ds-inbox
      #inbox
      [threads]="threads()"
      [(selected)]="selected"
      [loading]="loading()"
      [detailLoading]="detailLoading()"
      [narrow]="narrow()"
      [composer]="composer()"
      [bulk]="bulk()"
      (threadOpen)="opens.push($event)"
      (reply)="replies.push($event)"
      (readChange)="reads.push($event)"
    />
  `,
})
class InboxHost {
  readonly threads = signal<readonly InboxThread[]>(THREADS);
  selected: string | null = null;
  readonly loading = signal(false);
  readonly detailLoading = signal(false);
  readonly narrow = signal(false);
  readonly composer = signal(true);
  readonly bulk = signal(false);
  opens: InboxThreadEvent[] = [];
  replies: InboxReply[] = [];
  reads: InboxReadChange[] = [];
}

describe('InboxComponent', () => {
  let fixture: ComponentFixture<InboxHost>;
  let host: InboxHost;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);
  const queryAll = (selector: string): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll(selector));
  const list = () => query<HTMLElement>('[role="listbox"]')!;
  const rows = () => queryAll('[role="option"]');
  const active = () => rows().find((row) => row.classList.contains('ds-inbox__thread--active'));
  const detail = () => query<HTMLElement>('.ds-inbox__detail');
  const press = (key: string) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    list().dispatchEvent(event);
    fixture.detectChanges();
    return event;
  };
  const flush = () => new Promise<void>((resolve) => queueMicrotask(() => resolve()));
  const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 10));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InboxHost],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(InboxHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('is a listbox of threads with one tab stop, and nothing open', () => {
    expect(list().getAttribute('aria-label')).toBe('Threads');
    expect(list().tabIndex).toBe(0);
    expect(rows().length).toBe(3);
    expect(rows()[0].getAttribute('aria-selected')).toBe('false');
    expect(query('ds-empty-state')!.textContent).toContain('Nothing selected');
    expect(detail()).toBeNull();
  });

  it('draws the row: people, subject, preview, time, labels, unread', () => {
    expect(query('.ds-inbox__people')!.textContent).toContain('Ada Lovelace');
    // Three or more participants are summarised rather than listed.
    expect(rows()[1].querySelector('.ds-inbox__people')!.textContent).toContain('and 2 others');
    expect(rows()[0].querySelector('.ds-inbox__time')!.textContent).toContain('09:42');
    expect(rows()[0].querySelector('ds-badge')!.textContent).toContain('Billing');
    expect(rows()[0].classList).toContain('ds-inbox__thread--unread');
    // Unread is weight *and* a word, never colour alone.
    expect(rows()[0].querySelector('.visually-hidden')!.textContent).toContain('Unread');
    expect(rows()[0].querySelector('ds-avatar')).toBeTruthy();
  });

  it('opens a thread into the reading pane, and reports it', async () => {
    rows()[1].click();
    fixture.detectChanges();
    await flush();

    expect(host.selected).toBe('onboarding');
    expect(rows()[1].getAttribute('aria-selected')).toBe('true');
    expect(query('.ds-inbox__title')!.textContent).toContain('Onboarding questions');
    expect(queryAll('.ds-inbox__message').length).toBe(2);
    expect(host.opens[0].thread.id).toBe('onboarding');
    // Focus follows the open, so the next Tab is inside what just appeared.
    expect(document.activeElement).toBe(detail());
  });

  it('refuses a disabled thread, but keeps it reachable', () => {
    rows()[2].click();
    fixture.detectChanges();
    expect(host.selected).toBeNull();
    expect(host.opens.length).toBe(0);

    press('End');
    expect(active()).toBe(rows()[2]);
  });

  describe('the keyboard', () => {
    it('skims with the arrows and the ends, and opens with Enter', () => {
      press('ArrowDown');
      expect(active()).toBe(rows()[1]);
      // Arrowing skims: nothing is open yet.
      expect(host.selected).toBeNull();

      expect(press('Enter').defaultPrevented).toBeTrue();
      expect(host.selected).toBe('onboarding');

      press('Home');
      expect(active()).toBe(rows()[0]);
      press('End');
      expect(active()).toBe(rows()[2]);
    });

    it('jumps to a thread by typing its subject', () => {
      press('z');
      expect(active()).toBe(rows()[2]);
    });
  });

  it('sends a reply through the host, and clears the draft', () => {
    rows()[0].click();
    fixture.detectChanges();

    const textarea = query<HTMLTextAreaElement>('textarea')!;
    textarea.value = 'We have retried the card.';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const send = queryAll('.ds-inbox__composer-actions button')[0] as HTMLButtonElement;
    expect(send.disabled).toBeFalse();
    send.click();
    fixture.detectChanges();

    expect(host.replies[0].body).toBe('We have retried the card.');
    expect(host.replies[0].thread.id).toBe('invoice');
    expect(query<HTMLTextAreaElement>('textarea')!.value).toBe('');
  });

  it('will not send an empty reply', () => {
    rows()[0].click();
    fixture.detectChanges();
    const send = queryAll('.ds-inbox__composer-actions button')[0] as HTMLButtonElement;
    expect(send.disabled).toBeTrue();
    expect(host.replies.length).toBe(0);
  });

  it('asks the host to mark a thread read — and changes nothing itself', () => {
    rows()[0].click();
    fixture.detectChanges();

    const mark = queryAll('.ds-inbox__actions button')[0] as HTMLButtonElement;
    expect(mark.textContent).toContain('Mark read');
    mark.click();
    fixture.detectChanges();

    expect(host.reads[0]).toEqual({
      threadIds: ['invoice'],
      read: true,
      threads: [THREADS[0]],
    });
    // The organism owns no data: the thread is still unread until the host says.
    expect(rows()[0].classList).toContain('ds-inbox__thread--unread');
  });

  describe('bulk mark-read, as a secondary thing', () => {
    beforeEach(() => {
      host.bulk.set(true);
      fixture.detectChanges();
    });

    it('ticks without opening, and reports a batch', () => {
      (rows()[0].querySelector('.ds-inbox__check') as HTMLElement).click();
      (rows()[1].querySelector('.ds-inbox__check') as HTMLElement).click();
      fixture.detectChanges();

      expect(host.selected).toBeNull();
      expect(query('.ds-inbox__bulk')!.textContent).toContain('2 selected');

      (queryAll('.ds-inbox__bulk button')[0] as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(host.reads[0].threadIds).toEqual(['invoice', 'onboarding']);
      expect(host.reads[0].read).toBeTrue();
      expect(query('.ds-inbox__bulk')).toBeNull();
    });
  });

  describe('narrow', () => {
    beforeEach(() => {
      host.narrow.set(true);
      fixture.detectChanges();
    });

    it('puts the detail in a drawer, with the Dialog’s machinery', async () => {
      expect(query('.ds-inbox')!.classList).toContain('ds-inbox--narrow');
      expect(query('.ds-inbox__detail-pane')).toBeNull();
      expect(query('[role="dialog"]')).toBeNull();

      rows()[0].click();
      fixture.detectChanges();
      await flush();
      fixture.detectChanges();

      const drawer = query<HTMLElement>('[role="dialog"]')!;
      expect(drawer.getAttribute('aria-modal')).toBe('true');
      expect(drawer.textContent).toContain('Invoice 4471 is overdue');
      expect(list().closest('[inert]')).toBeTruthy();
    });

    it('closes on Escape and gives focus back to the list', async () => {
      rows()[0].click();
      fixture.detectChanges();
      await flush();
      fixture.detectChanges();

      query<HTMLElement>('[role="dialog"]')!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
      fixture.detectChanges();
      await settle();

      expect(query('[role="dialog"]')).toBeNull();
      expect(document.activeElement).toBe(list());
      expect(list().closest('[inert]')).toBeNull();
    });
  });

  it('shows the list loading, the detail loading, and the empty inbox', () => {
    host.loading.set(true);
    fixture.detectChanges();
    expect(query('[role="status"]')!.getAttribute('aria-label')).toBe('Loading…');
    expect(query('[role="listbox"]')).toBeNull();

    host.loading.set(false);
    host.selected = 'invoice';
    host.detailLoading.set(true);
    fixture.detectChanges();
    expect(query('.ds-inbox__detail-loading ds-spinner')).toBeTruthy();
    expect(detail()).toBeNull();

    host.detailLoading.set(false);
    host.threads.set([]);
    fixture.detectChanges();
    expect(query('ds-empty-state')!.textContent).toContain('Nothing in the inbox');
  });
});