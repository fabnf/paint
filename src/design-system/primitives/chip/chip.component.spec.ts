import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ChipComponent } from './chip.component';
import type { Tone } from '../tone.types';

@Component({
  standalone: true,
  imports: [ChipComponent],
  template: `
    <ds-chip
      [tone]="tone()"
      [size]="size()"
      [icon]="icon()"
      [removable]="removable()"
      [removeLabel]="removeLabel()"
      [removeTabbable]="removeTabbable()"
      [disabled]="disabled()"
      (removed)="removals = removals + 1"
    >
      Brand
    </ds-chip>
  `,
})
class HostComponent {
  readonly tone = signal<Tone>('neutral');
  readonly size = signal<'sm' | 'md'>('sm');
  readonly icon = signal<'palette' | null>(null);
  readonly removable = signal(false);
  readonly removeLabel = signal('Remove');
  readonly removeTabbable = signal(true);
  readonly disabled = signal(false);
  removals = 0;
}

describe('ChipComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);

  const chip = () => query<HTMLElement>('.ds-chip')!;
  const remove = () => query<HTMLButtonElement>('.ds-chip__remove');

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('is a plain span until it can be removed', () => {
    expect(chip().tagName).toBe('SPAN');
    expect(remove()).toBeNull();
    expect(chip().hasAttribute('tabindex')).toBeFalse();
    expect(chip().textContent!.trim()).toBe('Brand');
  });

  it('grows a real button when removable, named after what it removes', () => {
    host.removable.set(true);
    host.removeLabel.set('Remove Brand');
    fixture.detectChanges();

    expect(remove()!.tagName).toBe('BUTTON');
    expect(remove()!.type).toBe('button');
    expect(remove()!.getAttribute('aria-label')).toBe('Remove Brand');
    // The chip itself stays a span: never a button inside a button.
    expect(chip().tagName).toBe('SPAN');
  });

  it('emits removed, and never removes itself', () => {
    host.removable.set(true);
    fixture.detectChanges();

    remove()!.click();
    expect(host.removals).toBe(1);
    // The list that owns the chip decides whether it disappears.
    expect(query('.ds-chip')).toBeTruthy();
  });

  it('keeps the remove button out of the tab order on request', () => {
    host.removable.set(true);
    fixture.detectChanges();
    expect(remove()!.hasAttribute('tabindex')).toBeFalse();

    host.removeTabbable.set(false);
    fixture.detectChanges();
    expect(remove()!.getAttribute('tabindex')).toBe('-1');
  });

  it('does not emit while disabled', () => {
    host.removable.set(true);
    host.disabled.set(true);
    fixture.detectChanges();

    expect(remove()!.disabled).toBeTrue();
    remove()!.click();
    expect(host.removals).toBe(0);
  });

  it('drops its tone when disabled, rather than fading below 4.5:1', () => {
    host.tone.set('accent');
    host.disabled.set(true);
    fixture.detectChanges();

    expect(chip().classList).toContain('ds-chip--disabled');
    expect(getComputedStyle(chip()).opacity).toBe('1');
  });

  it('drops its tone when disabled, rather than fading below 4.5:1', () => {
    host.tone.set('accent');
    host.disabled.set(true);
    fixture.detectChanges();

    expect(chip().classList).toContain('ds-chip--disabled');
    expect(getComputedStyle(chip()).opacity).toBe('1');
  });

  it('maps tone, size and variant onto classes', () => {
    host.tone.set('accent');
    host.size.set('md');
    fixture.detectChanges();

    expect(chip().classList).toContain('ds-tone--accent');
    expect(chip().classList).toContain('ds-chip--md');
    expect(chip().classList).toContain('ds-chip--soft');
  });

  it('hides a leading icon from assistive tech', () => {
    host.icon.set('palette');
    fixture.detectChanges();
    expect(query('ds-icon svg')!.getAttribute('aria-hidden')).toBe('true');
  });
});
