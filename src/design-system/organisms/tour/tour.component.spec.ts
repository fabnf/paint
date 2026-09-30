import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MemoryTourMemory, provideTour } from './tour.memory';
import { TourComponent } from './tour.component';
import type { TourEndReason, TourStep, TourStepEvent } from './tour.types';

const STEPS: readonly TourStep[] = [
  { id: 'welcome', title: 'This is Paint', body: 'A design system, in three layers.', layer: 'Overview' },
  {
    id: 'tokens',
    title: 'Foundations first',
    body: 'Every colour is a role, not a hex.',
    target: '#tokens',
    layer: 'Foundation',
  },
  {
    id: 'button',
    title: 'The action atom',
    body: 'One button, eight intents.',
    target: '#button',
    layer: 'Primitive',
  },
];

@Component({
  standalone: true,
  imports: [TourComponent],
  template: `
    <button type="button" id="start" (click)="tour.start()">Take the tour</button>
    <div id="tokens" style="width: 120px; height: 40px">Tokens</div>
    @if (lateTarget()) {
      <div id="button" style="width: 120px; height: 40px">Button</div>
    }

    <ds-tour
      #tour
      tourId="paint-intro"
      [steps]="steps()"
      [dismissible]="dismissible()"
      [dontShowAgain]="dontShowAgain()"
      [targetTimeout]="400"
      (stepChange)="shown.push($event)"
      (skipped)="skips.push($event)"
      (completed)="completions = completions + 1"
      (ended)="reasons.push($event)"
      (suppressed)="suppressions.push($event)"
    />
  `,
})
class HostComponent {
  readonly steps = signal<readonly TourStep[]>(STEPS);
  readonly dismissible = signal(true);
  readonly dontShowAgain = signal(false);
  readonly lateTarget = signal(true);
  shown: TourStepEvent[] = [];
  skips: TourStepEvent[] = [];
  reasons: TourEndReason[] = [];
  suppressions: string[] = [];
  completions = 0;
}

describe('TourComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let memory: MemoryTourMemory;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);
  const card = () => query<HTMLElement>('.ds-tour__card');
  const title = () => query('.ds-tour__title')?.textContent?.trim() ?? '';
  const tour = () => fixture.debugElement.query((node) => node.name === 'ds-tour').componentInstance as TourComponent;
  const button = (label: string): HTMLButtonElement => {
    const match = Array.from(
      fixture.nativeElement.querySelectorAll('.ds-tour__card button'),
    ).find((node) => (node as HTMLElement).textContent?.trim() === label);
    return match as HTMLButtonElement;
  };

  /** The tour resolves targets asynchronously; let the promises land. */
  const settle = async (ms = 0) => {
    await new Promise<void>((resolve) => setTimeout(resolve, ms));
    fixture.detectChanges();
    await new Promise<void>((resolve) => setTimeout(resolve, ms));
    fixture.detectChanges();
  };

  const start = async () => {
    query<HTMLButtonElement>('#start')!.focus();
    query<HTMLButtonElement>('#start')!.click();
    fixture.detectChanges();
    await settle();
  };

  const keydown = (key: string) => {
    card()!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    memory = new MemoryTourMemory();
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([]), provideTour({ memory })],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    tour().close();
    fixture.detectChanges();
  });

  it('renders nothing until it is started', () => {
    expect(card()).toBeNull();
    expect(query('.ds-tour__spotlight')).toBeNull();
  });

  it('opens the first step as a modal card, named by its title and body', async () => {
    await start();

    expect(card()!.getAttribute('role')).toBe('dialog');
    expect(card()!.getAttribute('aria-modal')).toBe('true');
    expect(title()).toBe('This is Paint');
    const labelledBy = card()!.getAttribute('aria-labelledby')!;
    const describedBy = card()!.getAttribute('aria-describedby')!;
    expect(document.getElementById(labelledBy)!.textContent).toContain('This is Paint');
    expect(document.getElementById(describedBy)!.textContent).toContain('three layers');
    expect(query('.ds-tour__layer')!.textContent!.trim()).toBe('Overview');
    expect(query('.ds-tour__position')!.textContent!.trim()).toBe('1 of 3');
  });

  it('moves focus to the card and makes the rest of the page inert', async () => {
    await start();
    expect(document.activeElement).toBe(card());
    expect(query('#start')!.closest('[inert]')).toBeTruthy();
  });

  it('reports each step as it opens', async () => {
    await start();
    expect(host.shown.map((event) => event.step.id)).toEqual(['welcome']);
    expect(host.shown[0].count).toBe(3);
  });

  it('walks forward and back', async () => {
    await start();
    expect(button('Back')).toBeUndefined();

    button('Next').click();
    await settle();
    expect(title()).toBe('Foundations first');
    expect(query('.ds-tour__position')!.textContent!.trim()).toBe('2 of 3');

    button('Back').click();
    await settle();
    expect(title()).toBe('This is Paint');
    expect(host.shown.map((event) => event.index)).toEqual([0, 1, 0]);
  });

  it('cuts a spotlight around a step’s real target, and centres when there is none', async () => {
    await start();
    expect(query('.ds-tour__spotlight')!.classList).toContain('ds-tour__spotlight--centred');

    button('Next').click();
    await settle();
    const spotlight = query<HTMLElement>('.ds-tour__spotlight')!;
    expect(spotlight.classList).not.toContain('ds-tour__spotlight--centred');
    expect(Number.parseFloat(spotlight.style.width)).toBeGreaterThan(100);
  });

  it('offers Done on the last step, completes, and gives focus back', async () => {
    await start();
    button('Next').click();
    await settle();
    button('Next').click();
    await settle();

    expect(title()).toBe('The action atom');
    expect(button('Next')).toBeUndefined();

    button('Done').click();
    fixture.detectChanges();

    expect(host.completions).toBe(1);
    expect(host.reasons).toEqual(['done']);
    expect(card()).toBeNull();
    expect(memory.isCompleted('paint-intro')).toBeTrue();
    expect(document.activeElement).toBe(query('#start'));
    expect(query('#start')!.closest('[inert]')).toBeNull();
  });

  it('skips from the button and from Escape', async () => {
    await start();
    button('Skip').click();
    fixture.detectChanges();
    expect(host.skips.map((event) => event.step.id)).toEqual(['welcome']);
    expect(host.reasons).toEqual(['skip']);
    expect(memory.isCompleted('paint-intro')).toBeFalse();

    await start();
    keydown('Escape');
    expect(card()).toBeNull();
    expect(host.reasons).toEqual(['skip', 'escape']);
  });

  it('refuses to be dismissed when the tour says so', async () => {
    host.dismissible.set(false);
    await start();

    keydown('Escape');
    expect(card()).toBeTruthy();
    button('Skip').click();
    fixture.detectChanges();
    expect(card()).toBeTruthy();
    expect(host.reasons).toEqual([]);
  });

  it('traps Tab inside the card', async () => {
    await start();
    const focusable = Array.from(card()!.querySelectorAll<HTMLElement>('button'));
    focusable[focusable.length - 1].focus();

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    card()!.dispatchEvent(event);
    fixture.detectChanges();
    expect(event.defaultPrevented).toBeTrue();
    expect(document.activeElement).toBe(focusable[0]);
  });

  describe('don’t show again', () => {
    beforeEach(() => {
      host.dontShowAgain.set(true);
      fixture.detectChanges();
    });

    it('is off by default, and only remembered when it is ticked', async () => {
      await start();
      expect(query('.ds-tour__suppress input')).toBeTruthy();
      button('Skip').click();
      fixture.detectChanges();
      expect(memory.isSuppressed('paint-intro')).toBeFalse();
    });

    it('stops the same tour coming back', async () => {
      await start();
      query<HTMLInputElement>('.ds-tour__suppress input')!.click();
      fixture.detectChanges();
      button('Skip').click();
      fixture.detectChanges();

      expect(memory.isSuppressed('paint-intro')).toBeTrue();
      expect(host.suppressions).toEqual(['paint-intro']);

      // And the next attempt does nothing at all.
      expect(tour().start()).toBeFalse();
      fixture.detectChanges();
      expect(card()).toBeNull();

      memory.forget('paint-intro');
      expect(tour().start()).toBeTrue();
    });
  });

  describe('a target that is not there yet', () => {
    it('waits for it, says so, and opens the step when it arrives', async () => {
      host.lateTarget.set(false);
      fixture.detectChanges();

      await start();
      button('Next').click();
      await settle();
      button('Next').click();
      fixture.detectChanges();

      // Still searching: the card is not open on the third step yet.
      expect(query('.ds-tour__waiting')).toBeTruthy();
      expect(host.shown.length).toBe(2);

      host.lateTarget.set(true);
      fixture.detectChanges();
      await settle(120);

      expect(query('.ds-tour__waiting')).toBeNull();
      expect(title()).toBe('The action atom');
      expect(host.shown.map((event) => event.step.id)).toEqual(['welcome', 'tokens', 'button']);
    });

    it('gives up after the timeout and shows the step centred, rather than stalling', async () => {
      host.steps.set([{ id: 'ghost', title: 'Gone', body: 'The selector moved.', target: '#nowhere' }]);
      fixture.detectChanges();

      await start();
      await settle(500);

      expect(title()).toBe('Gone');
      expect(query('.ds-tour__spotlight')!.classList).toContain('ds-tour__spotlight--centred');
    });
  });

  it('does nothing when there are no steps', () => {
    host.steps.set([]);
    fixture.detectChanges();
    expect(tour().start()).toBeFalse();
    fixture.detectChanges();
    expect(card()).toBeNull();
  });
});
