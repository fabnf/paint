import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DS_COMPONENTS, DS_PRIMITIVES } from '../../../design-system';
import { ShowcaseTourService } from '../../showcase-tour';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Tour — documentation page.
 *
 * The demo tour is the real thing: it walks the showcase itself, routing
 * between pages and pointing at the live sections of each one.
 */
@Component({
  selector: 'app-tour-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI],
  templateUrl: './tour.page.html',
  styleUrl: './components-page.scss',
})
export class TourPage {
  /**
   * The tour of Paint itself — one step per layer — and the instance that runs
   * it both live in the app shell: a walkthrough that crosses routes cannot be
   * owned by a routed page, because the router would destroy it on the first
   * Next. This page only starts it and reports what it did.
   */
  private readonly showcaseTour = inject(ShowcaseTourService);

  /** The tour itself lives in the app shell — a routed page cannot own one. */
  readonly steps = this.showcaseTour.steps;
  readonly log = this.showcaseTour.log;
  readonly lastReason = this.showcaseTour.lastReason;

  start(): void {
    this.showcaseTour.start();
  }

  forget(): void {
    this.showcaseTour.forget();
  }

  readonly stepsSnippet = `readonly steps: TourStep[] = [
  {
    id: 'tokens',
    layer: 'Foundation',
    title: 'Colour is a role, not a hex',
    body: 'A component asks for “danger”; the theme decides what that is.',
    route: '/foundations',       // another page: the tour goes there…
    target: '#color',            // …and waits for this to exist
  },
  // …
];`;

  readonly usageSnippet = `<ds-tour
  #tour
  tourId="paint-intro"
  [steps]="steps"
  [dontShowAgain]="true"
  (stepChange)="log($event)"
  (ended)="onEnded($event)"
/>

<ds-button (clicked)="tour.start()">Take the tour</ds-button>`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'tourId', type: 'string', default: `'ds-tour'`, description: 'Identity of this walkthrough. What “don’t show again” is keyed on.' },
    { name: 'steps', type: 'readonly TourStep<T>[]', default: '[]', description: 'The steps, in order.' },
    { name: 'open', type: 'model<boolean>', default: 'false', description: 'Running or not. start() is the usual way in.' },
    { name: 'dismissible', type: 'boolean', default: 'true', description: 'Let Escape and the Skip button end it.' },
    { name: 'dontShowAgain', type: 'boolean', default: 'false', description: 'Offer the checkbox that stops this tour coming back.' },
    { name: 'autoNavigate', type: 'boolean', default: 'true', description: 'Route a step’s route itself, when a Router is available. The navigate output fires either way.' },
    { name: 'targetTimeout', type: 'number', default: '5000', description: 'How long to wait for a target before showing the step centred instead of stalling.' },
    { name: 'nextLabel / backLabel / skipLabel / doneLabel', type: 'string', default: `'Next' / 'Back' / 'Skip' / 'Done'`, description: 'The four buttons.' },
    { name: 'dontShowAgainLabel / waitingLabel', type: 'string', default: '…', description: 'The checkbox, and the line shown while a target is being waited for.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'stepChange', type: 'OutputEmitterRef<TourStepEvent<T>>', default: '—', description: 'A step opened — after any navigation, and after its target was found.' },
    { name: 'completed', type: 'OutputEmitterRef<void>', default: '—', description: 'Done was pressed on the last step.' },
    { name: 'skipped', type: 'OutputEmitterRef<TourStepEvent<T>>', default: '—', description: 'Skipped or escaped, on this step.' },
    { name: 'ended', type: `OutputEmitterRef<'done' | 'skip' | 'escape' | 'api'>`, default: '—', description: 'However it ended.' },
    { name: 'navigate', type: 'OutputEmitterRef<string>', default: '—', description: 'A step needs another route. Emitted even when the tour routes itself.' },
    { name: 'suppressed', type: 'OutputEmitterRef<string>', default: '—', description: 'The user ticked “don’t show again”.' },
  ];

  readonly methods: readonly ApiRow[] = [
    { name: 'start(at?)', type: '(at?: number) => boolean', default: '—', description: 'Starts it — unless suppressed, or there are no steps, in which case it returns false.' },
    { name: 'next() / back() / goTo(i)', type: '() => void', default: '—', description: 'Moves. goTo routes and waits, like every step change.' },
    { name: 'skip(reason?) / finish() / close()', type: '() => void', default: '—', description: 'The three ways out. finish() records the tour as completed.' },
    { name: 'isSuppressed() / forgetSuppression()', type: '() => boolean / void', default: '—', description: 'Reads and clears this tour’s “don’t show again”.' },
  ];

  readonly stepRows: readonly ApiRow[] = [
    { name: 'id', type: 'string', default: '—', description: 'Stable identity, reported on every event.' },
    { name: 'title / body', type: 'string', default: '—', description: 'What this stop is about. Say why the thing exists.' },
    { name: 'target', type: 'string?', default: '—', description: 'CSS selector, resolved against the live document. Absent: a centred card.' },
    { name: 'route', type: 'string?', default: '—', description: 'Where the step lives, when it is not on the current page.' },
    { name: 'layer', type: 'string?', default: '—', description: 'A word for the layer — “Foundation”, “Primitive”, “Organism”.' },
    { name: 'data', type: 'T?', default: '—', description: 'Whatever the host wants back on the outputs.' },
  ];
}