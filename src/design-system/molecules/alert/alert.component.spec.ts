import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AlertComponent, type AlertLive } from './alert.component';
import type { Tone } from '../../primitives/tone.types';

@Component({
  standalone: true,
  imports: [AlertComponent],
  template: `
    <ds-alert
      [tone]="tone()"
      [variant]="variant()"
      [title]="title()"
      [live]="live()"
      [dismissible]="dismissible()"
      [showIcon]="showIcon()"
      [accentuated]="accentuated()"
      (dismissed)="dismissals = dismissals + 1"
    >
      Add a payment method to keep your projects.
      @if (withActions()) {
        <button dsAlertActions type="button">Add payment</button>
      }
    </ds-alert>
  `,
})
class HostComponent {
  readonly tone = signal<Tone>('info');
  readonly variant = signal<'soft' | 'outline'>('soft');
  readonly title = signal('Your trial ends in 3 days');
  readonly live = signal<AlertLive>('off');
  readonly dismissible = signal(false);
  readonly showIcon = signal(true);
  readonly accentuated = signal(false);
  readonly withActions = signal(false);
  dismissals = 0;
}

describe('AlertComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);

  const alert = () => fixture.nativeElement.querySelector('ds-alert') as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a title and the projected message', () => {
    expect(query('.ds-alert__title')!.textContent!.trim()).toBe('Your trial ends in 3 days');
    expect(query('.ds-alert__content')!.textContent).toContain('Add a payment method');
  });

  it('is not a live region by default — the page is already being read', () => {
    expect(alert().getAttribute('role')).toBeNull();
  });

  it('announces politely, or interrupts, when asked', () => {
    host.live.set('polite');
    fixture.detectChanges();
    expect(alert().getAttribute('role')).toBe('status');

    host.live.set('assertive');
    fixture.detectChanges();
    expect(alert().getAttribute('role')).toBe('alert');
  });

  it('takes a tone, and paints it from the shared tone properties', () => {
    host.tone.set('danger');
    fixture.detectChanges();

    expect(query('.ds-alert')!.classList).toContain('ds-tone--danger');
    expect(query('.ds-alert')!.classList).toContain('ds-alert--soft');
  });

  it('picks an icon per tone, and hides it from assistive tech', () => {
    expect(query('.ds-alert__icon')!.getAttribute('aria-hidden')).toBe('true');
    expect(query('ds-icon svg')!.getAttribute('aria-hidden')).toBe('true');

    host.showIcon.set(false);
    fixture.detectChanges();
    expect(query('.ds-alert__icon')).toBeNull();
  });

  it('paints the outline variant, and the leading rule', () => {
    host.variant.set('outline');
    host.accentuated.set(true);
    fixture.detectChanges();

    expect(query('.ds-alert')!.classList).toContain('ds-alert--outline');
    expect(query('.ds-alert')!.classList).toContain('ds-alert--accentuated');
  });

  it('offers a named dismiss button, and never removes itself', () => {
    expect(query('.ds-alert__dismiss')).toBeNull();

    host.dismissible.set(true);
    fixture.detectChanges();

    const dismiss = query<HTMLButtonElement>('.ds-alert__dismiss button')!;
    expect(dismiss.getAttribute('aria-label')).toBe('Dismiss');

    dismiss.click();
    expect(host.dismissals).toBe(1);
    // The alert is the consumer's to remove: an undo cannot un-destroy a DOM node.
    expect(query('.ds-alert')).toBeTruthy();
  });

  it('hides the actions slot until something is in it', () => {
    expect(query('.ds-alert__actions')!.children.length).toBe(0);

    host.withActions.set(true);
    fixture.detectChanges();
    expect(query('.ds-alert__actions button')).toBeTruthy();
  });
});
