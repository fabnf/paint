import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ProgressComponent, type ProgressSize } from './progress.component';
import type { Tone } from '../tone.types';

@Component({
  standalone: true,
  imports: [ProgressComponent],
  template: `
    <ds-progress
      [value]="value()"
      [max]="max()"
      [indeterminate]="indeterminate()"
      [label]="label()"
      [ariaLabel]="ariaLabel()"
      [hideLabel]="hideLabel()"
      [showValue]="showValue()"
      [valueText]="valueText()"
      [tone]="tone()"
      [size]="size()"
    />
  `,
})
class HostComponent {
  readonly value = signal(62);
  readonly max = signal(100);
  readonly indeterminate = signal(false);
  readonly label = signal('Uploading');
  readonly ariaLabel = signal('');
  readonly hideLabel = signal(false);
  readonly showValue = signal(false);
  readonly valueText = signal('');
  readonly tone = signal<Tone>('primary');
  readonly size = signal<ProgressSize>('md');
}

describe('ProgressComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);

  const bar = () => query<HTMLElement>('[role="progressbar"]')!;
  const fill = () => query<HTMLElement>('.progress-bar')!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders Bootstrap’s progress with the full ARIA value set', () => {
    expect(bar().classList).toContain('progress');
    expect(bar().getAttribute('aria-valuenow')).toBe('62');
    expect(bar().getAttribute('aria-valuemin')).toBe('0');
    expect(bar().getAttribute('aria-valuemax')).toBe('100');
    expect(fill().style.width).toBe('62%');
  });

  it('is named by its own visible label', () => {
    const label = query('.ds-progress__label')!;
    expect(bar().getAttribute('aria-labelledby')).toBe(label.id);
    expect(bar().getAttribute('aria-label')).toBeNull();
  });

  it('falls back to an aria-label when the label is hidden', () => {
    host.hideLabel.set(true);
    fixture.detectChanges();

    expect(query('.ds-progress__label')).toBeNull();
    expect(bar().getAttribute('aria-label')).toBe('Uploading');
    expect(bar().getAttribute('aria-labelledby')).toBeNull();
  });

  it('scales a value against its own max', () => {
    host.value.set(9);
    host.max.set(20);
    fixture.detectChanges();

    expect(fill().style.width).toBe('45%');
    expect(bar().getAttribute('aria-valuenow')).toBe('9');
    expect(bar().getAttribute('aria-valuemax')).toBe('20');
  });

  it('clamps a value that escaped upstream', () => {
    host.value.set(140);
    fixture.detectChanges();
    expect(fill().style.width).toBe('100%');

    host.value.set(-20);
    fixture.detectChanges();
    expect(fill().style.width).toBe('0%');
  });

  it('drops aria-valuenow when the end is unknown', () => {
    host.indeterminate.set(true);
    fixture.detectChanges();

    // "In progress, amount unknown" is the absence of a value, not value=0.
    expect(bar().getAttribute('aria-valuenow')).toBeNull();
    expect(bar().getAttribute('aria-valuemax')).toBeNull();
    expect(bar().classList).toContain('ds-progress__track--indeterminate');
    expect(fill().style.width).toBe('');
  });

  it('shows the percentage, or what the percentage means', () => {
    host.showValue.set(true);
    fixture.detectChanges();
    expect(query('.ds-progress__value')!.textContent!.trim()).toBe('62%');

    host.valueText.set('18 of 20 GB used');
    fixture.detectChanges();
    expect(query('.ds-progress__value')!.textContent!.trim()).toBe('18 of 20 GB used');
    expect(bar().getAttribute('aria-valuetext')).toBe('18 of 20 GB used');
  });

  it('never shows a number it does not have', () => {
    host.showValue.set(true);
    host.indeterminate.set(true);
    fixture.detectChanges();

    expect(query('.ds-progress__value')).toBeNull();
  });

  it('maps tone and size onto classes', () => {
    host.tone.set('warning');
    host.size.set('lg');
    fixture.detectChanges();

    expect(bar().classList).toContain('ds-tone--warning');
    expect(bar().classList).toContain('ds-progress__track--lg');
  });
});
