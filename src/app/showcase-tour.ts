import { Injectable, signal } from '@angular/core';
import type { TourComponent, TourEndReason, TourStep, TourStepEvent } from '../design-system';

/**
 * The showcase's own tour of Paint.
 *
 * It lives here, outside the routed pages, for the reason the Tour's own docs
 * give: a walkthrough that crosses routes cannot be rendered *inside* a route —
 * the router would destroy it mid-step. The `<ds-tour>` instance is in the app
 * shell; this is the state the Tour page reads and the button it presses.
 */
@Injectable({ providedIn: 'root' })
export class ShowcaseTourService {
  /** One step per layer, each pointing at the real section of a real page. */
  readonly steps: readonly TourStep[] = [

    {
      id: 'welcome',
      layer: 'Overview',
      title: 'This is Paint',
      body: 'A design system in layers: tokens at the bottom, then primitives, molecules and organisms. Everything above is made of what is below — nothing draws a colour of its own.',
      route: '/components/tour',
    },
    {
      id: 'tokens',
      layer: 'Foundation',
      title: 'Colour is a role, not a hex',
      body: 'Tokens are the contract. A component asks for “danger” or “surface”, and the theme decides what that is — which is why light, dark and three brand packs cost the components nothing.',
      route: '/foundations',
      target: '#color',
    },
    {
      id: 'button',
      layer: 'Primitive',
      title: 'Atoms have one job',
      body: 'Button is eight intents and three sizes over Bootstrap’s .btn — and a real <button>. Primitives keep the platform’s keyboard, focus and forced-colours behaviour instead of re-inventing them.',
      route: '/primitives/button',
      target: '#variants',
    },
    {
      id: 'form-field',
      layer: 'Molecule',
      title: 'Molecules wire atoms together',
      body: 'FormField owns the label, the hint and the error once, and tells the control inside through DI. The atoms did not get smarter; the repetition went away.',
      route: '/components/form-field',
      target: '#anatomy',
    },
    {
      id: 'chart',
      layer: 'Organism',
      title: 'Engines stay behind seams',
      body: 'Chart draws ten types from one contract, coloured from the tokens — and Highcharts is the host’s, passed in through a provider. Paint depends on no charting library, so its own tests never need one.',
      route: '/components/chart',
      target: '#dashboard',
    },

    {
      id: 'inbox',
      layer: 'Organism',
      title: 'The hard parts are not the list',
      body: 'Inbox is master–detail: arrows skim, Enter opens, and on a narrow viewport the reading pane becomes a Drawer with the Dialog’s focus trap. The threads, the sending and the read state stay the host’s.',
      route: '/components/workspace',
      target: '#workspace-frame',
    },
    {
      id: 'scheduler',
      layer: 'Organism',
      title: 'What is happening, not which day',
      body: 'Scheduler is month, week, day and agenda over one array of events, with overlaps packed into columns so nothing hides behind anything. A date picker answers a different question.',
      route: '/components/workspace',
      target: '#workspace-frame',
    },

    {
      id: 'brand',
      layer: 'Foundation',
      title: 'And it can wear your brand',
      body: 'A brand pack re-pours every token at runtime — colours, radii, fonts — and every component follows, because none of them named a colour. Try the switcher in the top bar.',
      route: '/brand-packs',
      target: '#switcher',
    },
    {
      id: 'done',
      layer: 'Overview',
      title: 'That is the whole idea',
      body: 'Foundations decide, primitives obey, molecules compose and organisms carry the machinery. Press Done and have a look around.',
      route: '/components/tour',
    },
  ];

  readonly log = signal<readonly string[]>([]);
  readonly lastReason = signal<TourEndReason | null>(null);

  private tour: TourComponent | null = null;

  /** The shell hands over its `<ds-tour>` once it exists. */
  register(tour: TourComponent): void {
    this.tour = tour;
  }

  start(): void {
    if (!this.tour?.start()) {
      this.note('start → nothing happened: this tour is suppressed');
    }
  }

  forget(): void {
    this.tour?.forgetSuppression();
    this.note('forgot “don’t show again” for paint-intro');
  }

  onStep(event: TourStepEvent): void {
    this.note(`step ${event.index + 1}/${event.count} → ${event.step.id}`);
  }

  onEnded(reason: TourEndReason): void {
    this.lastReason.set(reason);
    this.note(`ended → ${reason}`);
  }

  onSuppressed(id: string): void {
    this.note(`don’t show again → ${id}`);
  }

  private note(line: string): void {
    this.log.update((lines) => [line, ...lines].slice(0, 8));
  }
}