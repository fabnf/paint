import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { brand } from './brand.tokens';
import { LogoComponent, type LogoVariant } from './logo.component';

@Component({
  standalone: true,
  imports: [LogoComponent],
  template: `
    <ds-logo
      [variant]="variant"
      [mono]="mono"
      [tagline]="tagline"
      [underline]="underline"
      [label]="label"
    />
  `,
})
class HostComponent {
  variant: LogoVariant = 'full';
  mono = false;
  tagline = false;
  underline = false;
  label = '';
}

describe('LogoComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = (selector: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(selector);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the mark and the wordmark by default', () => {
    expect(query('.ds-logo__mark')).toBeTruthy();
    expect(query('.ds-logo__word')?.textContent).toContain(brand.name);
  });

  it('pulls the P as one gradient-filled brush stroke', () => {
    const stroke = query('.ds-logo__stroke')!;

    expect(stroke.getAttribute('stroke')).toMatch(/^url\(#ds-logo-gradient-\d+\)$/);
    expect(stroke.getAttribute('fill')).toBe('none');
    expect(stroke.getAttribute('stroke-linecap')).toBe('round');
  });

  it('adds the wet dab and the lime drip', () => {
    expect(query('.ds-logo__dab')).toBeTruthy();
    expect(query('.ds-logo__drip')).toBeTruthy();
  });

  it('brushes the underline only when asked', () => {
    expect(query('.ds-logo__underline')).toBeNull();

    host.underline = true;
    fixture.detectChanges();

    expect(query('.ds-logo__underline')).toBeTruthy();
  });

  it('exposes an accessible name built from the brand tokens', () => {
    expect(query('.ds-logo')?.getAttribute('role')).toBe('img');
    expect(query('.ds-logo')?.getAttribute('aria-label')).toBe(`${brand.name} · ${brand.tagline}`);
  });

  it('accepts an accessible name override', () => {
    host.label = 'Paint home';
    fixture.detectChanges();
    expect(query('.ds-logo')?.getAttribute('aria-label')).toBe('Paint home');
  });

  it('renders the mark only', () => {
    host.variant = 'mark';
    fixture.detectChanges();

    expect(query('.ds-logo__mark')).toBeTruthy();
    expect(query('.ds-logo__word')).toBeNull();
  });

  it('renders the wordmark only', () => {
    host.variant = 'wordmark';
    fixture.detectChanges();

    expect(query('.ds-logo__mark')).toBeNull();
    expect(query('.ds-logo__word')).toBeTruthy();
  });

  it('shows the descriptor when tagline is set', () => {
    host.tagline = true;
    fixture.detectChanges();
    expect(query('.ds-logo__tagline')?.textContent).toContain('Design System');
  });

  it('drops the accents and inherits currentColor in mono', () => {
    host.mono = true;
    fixture.detectChanges();

    expect(query('.ds-logo')?.classList).toContain('ds-logo--mono');
    expect(query('.ds-logo__dab')).toBeNull();
    expect(query('.ds-logo__drip')).toBeNull();
    expect(query('.ds-logo__stroke')?.getAttribute('stroke')).toBe('currentColor');
  });

  it('keeps svg ids unique so several logos can share a page', () => {
    const second = TestBed.createComponent(HostComponent);
    second.detectChanges();

    const id = (f: ComponentFixture<HostComponent>) =>
      (f.nativeElement.querySelector('linearGradient') as SVGElement).id;

    expect(id(fixture)).not.toBe(id(second));
  });
});
