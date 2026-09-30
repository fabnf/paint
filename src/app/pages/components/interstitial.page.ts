import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  DS_COMPONENTS,
  DS_PRIMITIVES,
  InterstitialComponent,
  InterstitialService,
  type InterstitialItem,
  type InterstitialItemEvent,
} from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Interstitial — documentation page.
 *
 * The live demos talk to the repo's WireMock stub (`npm run mock:api`) through
 * the dev server's `/api` proxy. With the stub down, the page says so and falls
 * back to the same three items bundled offline, so the documentation is never a
 * blank panel — the organism's own failure path, demonstrated.
 */
@Component({
  selector: 'app-interstitial-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, InterstitialComponent, DOC_UI],
  templateUrl: './interstitial.page.html',
  styleUrl: './components-page.scss',
})
export class InterstitialPage {
  private readonly interstitials = inject(InterstitialService);

  readonly loading = this.interstitials.loading;
  readonly error = this.interstitials.error;
  readonly eligible = this.interstitials.eligible;
  readonly catalogue = this.interstitials.catalogue;

  /** Where the items came from, so the page can be honest about it. */
  readonly origin = signal<'none' | 'wiremock' | 'offline'>('none');
  readonly open = signal(false);

  readonly records = signal<{ seen: readonly string[]; dismissed: readonly string[] }>({
    seen: [],
    dismissed: [],
  });

  readonly log = signal<readonly string[]>([]);

  readonly summary = computed(() => {
    const count = this.eligible().length;
    if (this.origin() === 'none') {
      return 'Nothing loaded yet.';
    }
    return count === 0
      ? 'Nothing eligible: every item has been seen or dismissed.'
      : `${count} of ${this.catalogue().length} eligible.`;
  });

  /** The offline double — the same shape the stub serves. */
  private readonly offline: readonly InterstitialItem[] = [
    {
      id: 'wet-paint-2',
      title: 'Wet Paint 0.4 is here',
      body: 'Twenty-four atoms, four new compositions and a gallery — all re-poured from the same tokens. Nothing you already use has moved.',
      imageSrc: 'showcase/wet-paint-wide.svg',
      imageAlt: 'A violet wash with a magenta bleed and a lime sun',
      learnMoreLink: '/components/gallery',
      learnMoreLabel: 'See what shipped',
    },
    {
      id: 'brand-packs',
      title: 'Your brand, our components',
      body: 'Brand packs re-pour every token at runtime: Tidewater and Ember ship beside Paint, and both clear the same AA contrast table.',
      imageSrc: 'showcase/wet-paint-square.svg',
      imageAlt: 'A violet-to-sky wash with a magenta drop',
      learnMoreLink: '/brand-packs',
      learnMoreLabel: 'Try the packs',
    },
    {
      id: 'keyboard-audit',
      title: 'Every control, from the keyboard',
      body: 'Sliders, ratings and quantities now state their keys in one place each, and the suite presses them in a real browser.',
    },
  ];

  async load(): Promise<void> {
    const eligible = await this.interstitials.load();
    if (this.error()) {
      // The stub is not running: show the bundled catalogue instead, and say so.
      this.interstitials.useCatalogue(this.offline);
      this.origin.set('offline');
    } else {
      this.origin.set('wiremock');
    }
    this.note(
      `load → ${this.origin()} · ${this.interstitials.eligible().length} eligible (${eligible.length} from the API)`,
    );
    this.syncRecords();
    if (this.interstitials.eligible().length) {
      this.open.set(true);
    }
  }

  show(): void {
    if (this.eligible().length) {
      this.open.set(true);
    } else {
      this.note('nothing eligible — the interruption renders nothing at all');
    }
  }

  onSeen(event: InterstitialItemEvent): void {
    this.interstitials.markSeen(event.item.id);
    this.note(`seen → ${event.item.id}`);
    this.syncRecords();
  }

  onDismissed(event: InterstitialItemEvent): void {
    this.interstitials.markDismissed(event.item.id);
    this.note(`dismissed → ${event.item.id} (never comes back)`);
    this.syncRecords();
  }

  onLearnMore(event: InterstitialItemEvent): void {
    this.interstitials.markSeen(event.item.id);
    this.note(`learn more → ${event.item.id} (counts as seen)`);
    this.syncRecords();
  }

  onClosed(reason: string): void {
    this.note(`closed → ${reason}`);
  }

  reset(): void {
    this.interstitials.reset();
    this.origin.set('none');
    this.log.set([]);
    this.syncRecords();
  }

  private syncRecords(): void {
    const records = this.interstitials.records();
    this.records.set({ seen: [...records.seen], dismissed: [...records.dismissed] });
  }

  private note(line: string): void {
    this.log.update((lines) => [line, ...lines].slice(0, 6));
  }

  readonly wireSnippet = `// app.config.ts — the seam, once
providers: [
  provideInterstitials({ baseUrl: '/api/interstitials' }),
];

// The three calls the HTTP source makes, and the stub serves
// GET  /api/interstitials              -> { items: InterstitialItem[] }
// POST /api/interstitials/{id}/seen
// POST /api/interstitials/{id}/dismissed`;

  readonly mockSnippet = `# mock/wiremock/ — stub mappings committed beside the code
npm run mock:api     # WireMock on :8088 (the dev server proxies /api to it)
npm start            # the showcase, now loading real HTTP from the stub`;

  readonly usageSnippet = `private readonly interstitials = inject(InterstitialService);

async ngOnInit() {
  // Zero eligible items is the normal case: nothing renders.
  if ((await this.interstitials.load()).length) {
    this.showing.set(true);
  }
}

// template
<ds-interstitial
  [items]="interstitials.eligible()"
  [(open)]="showing"
  (seen)="interstitials.markSeen($event.item.id)"
  (dismissed)="interstitials.markDismissed($event.item.id)"
  (learnMore)="interstitials.markSeen($event.item.id)"
/>`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'items', type: 'readonly InterstitialItem<T>[]', default: '[]', description: 'The eligible items — already filtered by what the user has seen or dismissed.' },
    { name: 'open', type: 'model<boolean>', default: 'false', description: 'Open it. Nothing renders while it is false, or while there is nothing to say.' },
    { name: 'label', type: 'string', default: `'Announcement'`, description: 'Names the viewer.' },
    { name: 'learnMoreLabel', type: 'string', default: `'Learn more'`, description: 'Fallback label; an item’s own learnMoreLabel wins.' },
    { name: 'dismissLabel / lastDismissLabel', type: 'string', default: `'Not now' / 'Dismiss'`, description: 'The dismiss button, with more slides behind it and on the last one.' },
    { name: 'skipLabel / previousLabel / nextLabel', type: 'string', default: `'Close' / …`, description: 'Accessible names of the viewer’s own buttons.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'seen', type: 'OutputEmitterRef<InterstitialItemEvent<T>>', default: '—', description: 'An item was put in front of the user. Emitted once per item.' },
    { name: 'dismissed', type: 'OutputEmitterRef<InterstitialItemEvent<T>>', default: '—', description: 'The user said no to this one. It must never come back.' },
    { name: 'learnMore', type: 'OutputEmitterRef<InterstitialItemEvent<T>>', default: '—', description: 'The user followed the link. Counts as seen, and closes.' },
    { name: 'closed', type: `OutputEmitterRef<'dismiss' | 'learn-more' | 'escape' | 'done' | 'api'>`, default: '—', description: 'How the interruption ended.' },
  ];

  readonly itemRows: readonly ApiRow[] = [
    { name: 'id', type: 'string', default: '—', description: 'Stable identity: what “seen” and “dismissed” are keyed on.' },
    { name: 'title', type: 'string', default: '—', description: 'The one line the interruption is for.' },
    { name: 'body', type: 'string?', default: '—', description: 'One or two sentences. Plain text.' },
    { name: 'imageSrc / imageAlt', type: 'string?', default: '—', description: 'A picture above the words. No alt makes it decoration.' },
    { name: 'learnMoreHref / learnMoreLink / learnMoreLabel', type: 'string?', default: '—', description: 'Where “learn more” goes, out of or inside the app.' },
    { name: 'data', type: 'T?', default: '—', description: 'Whatever the host needs back on the outputs.' },
  ];

  readonly seamRows: readonly ApiRow[] = [
    { name: 'provideInterstitials(config)', type: '(config) => EnvironmentProviders', default: '—', description: 'Wires the source and the record store once, at the root.' },
    { name: 'HttpInterstitialSource', type: 'InterstitialSource', default: 'default', description: 'fetch over the three endpoints. What the WireMock stub serves.' },
    { name: 'StaticInterstitialSource', type: 'InterstitialSource', default: '—', description: 'An offline catalogue for tests, prototypes and CI without the stub.' },
    { name: 'LocalInterstitialStore', type: 'InterstitialRecordStore', default: 'default', description: 'seen / dismissed in localStorage, so a dismissal survives a reload.' },
    { name: 'MemoryInterstitialStore', type: 'InterstitialRecordStore', default: '—', description: 'The same, forgotten with the page.' },
    { name: 'InterstitialService', type: 'injectable', default: '—', description: 'load(), markSeen(), markDismissed(), eligible(), records(), reset().' },
    { name: 'eligibleItems(items, seen, dismissed)', type: 'pure function', default: '—', description: 'The rule itself, testable without a component or a network.' },
  ];
}