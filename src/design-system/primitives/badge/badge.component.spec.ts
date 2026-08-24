import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { BadgeComponent } from './badge.component';
import type { Tone, ToneVariant } from '../tone.types';

@Component({
  standalone: true,
  imports: [BadgeComponent],
  template: `
    <ds-badge
      [tone]="tone()"
      [variant]="variant()"
      [size]="size()"
      [pill]="pill()"
      [dot]="dot()"
      [icon]="icon()"
      [srLabel]="srLabel()"
    >
      {{ text() }}
    </ds-badge>
  `,
})
class HostComponent {
  readonly tone = signal<Tone>('neutral');
  readonly variant = signal<ToneVariant>('soft');
  readonly size = signal<'sm' | 'md'>('sm');
  readonly pill = signal(false);
  readonly dot = signal(false);
  readonly icon = signal<'warning' | null>(null);
  readonly srLabel = signal('');
  readonly text = signal('Shipped');
}

describe('BadgeComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);

  const badge = () => query<HTMLElement>('.ds-badge')!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders projected content on Bootstrap’s badge substrate', () => {
    expect(badge().classList).toContain('badge');
    expect(badge().textContent!.trim()).toBe('Shipped');
  });

  it('is never interactive: no role, no tab stop', () => {
    // A badge that can be clicked is a chip or a button, not a badge.
    expect(badge().getAttribute('role')).toBeNull();
    expect(badge().hasAttribute('tabindex')).toBeFalse();
    expect(query('button')).toBeNull();
  });

  it('maps a tone onto the shared tone properties, never onto a colour', () => {
    host.tone.set('danger');
    fixture.detectChanges();
    expect(badge().classList).toContain('ds-tone--danger');
    expect(badge().style.color).toBe('');
  });

  it('paints the three variants', () => {
    expect(badge().classList).toContain('ds-badge--soft');

    host.variant.set('solid');
    fixture.detectChanges();
    expect(badge().classList).toContain('ds-badge--solid');

    host.variant.set('outline');
    fixture.detectChanges();
    expect(badge().classList).toContain('ds-badge--outline');
  });

  it('squares off by default and pills on request', () => {
    expect(badge().classList).toContain('rounded-sm');

    host.pill.set(true);
    fixture.detectChanges();
    expect(badge().classList).toContain('rounded-full');
  });

  it('hides the dot and the icon from assistive tech', () => {
    host.dot.set(true);
    host.icon.set('warning');
    fixture.detectChanges();

    expect(query('.ds-badge__dot')).toBeTruthy();
    expect(query('ds-icon svg')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('speaks srLabel instead of the glyph it labels', () => {
    host.text.set('12');
    host.srLabel.set('12 unread messages');
    fixture.detectChanges();

    expect(query('.visually-hidden')!.textContent!.trim()).toBe('12 unread messages');
    expect(badge().getAttribute('aria-hidden')).toBe('true');
  });

  it('leaves the visible text alone when there is no srLabel', () => {
    expect(query('.visually-hidden')).toBeNull();
    expect(badge().hasAttribute('aria-hidden')).toBeFalse();
  });
});
