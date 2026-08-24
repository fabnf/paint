import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import {
  SkeletonComponent,
  type SkeletonAnimation,
  type SkeletonVariant,
} from './skeleton.component';

@Component({
  standalone: true,
  imports: [SkeletonComponent],
  template: `
    <ds-skeleton
      [variant]="variant()"
      [lines]="lines()"
      [width]="width()"
      [height]="height()"
      [radius]="radius()"
      [animation]="animation()"
      [label]="label()"
    />
  `,
})
class HostComponent {
  readonly variant = signal<SkeletonVariant>('text');
  readonly lines = signal(1);
  readonly width = signal('100%');
  readonly height = signal<string | null>(null);
  readonly radius = signal<'sm' | 'lg' | null>(null);
  readonly animation = signal<SkeletonAnimation>('pulse');
  readonly label = signal('');
}

describe('SkeletonComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const skeleton = () => fixture.nativeElement.querySelector('ds-skeleton') as HTMLElement;
  const lines = () =>
    Array.from(fixture.nativeElement.querySelectorAll('.ds-skeleton__line') as NodeListOf<HTMLElement>);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('builds on Bootstrap’s placeholder', () => {
    expect(lines().length).toBe(1);
    expect(lines()[0].classList).toContain('placeholder');
    expect(lines()[0].classList).toContain('ds-skeleton__line--text');
  });

  it('is silent by default: a dozen announcing rectangles is noise', () => {
    expect(skeleton().getAttribute('aria-hidden')).toBe('true');
    expect(skeleton().getAttribute('role')).toBeNull();
  });

  it('speaks once when it is the one that should', () => {
    host.label.set('Loading invoices…');
    fixture.detectChanges();

    expect(skeleton().getAttribute('role')).toBe('status');
    expect(skeleton().hasAttribute('aria-hidden')).toBeFalse();
    expect(fixture.nativeElement.querySelector('.visually-hidden').textContent.trim()).toBe(
      'Loading invoices…',
    );
    // The rectangles stay out of it either way.
    expect(lines()[0].getAttribute('aria-hidden')).toBe('true');
  });

  it('draws prose as prose: a short last line', () => {
    host.lines.set(3);
    fixture.detectChanges();

    expect(lines().length).toBe(3);
    expect(lines()[0].style.width).toBe('100%');
    expect(lines()[2].style.width).toBe('60%');
  });

  it('does not shorten a single line', () => {
    expect(lines()[0].style.width).toBe('100%');
  });

  it('takes width, height and a radius token', () => {
    host.variant.set('rect');
    host.width.set('8rem');
    host.height.set('4rem');
    host.radius.set('lg');
    fixture.detectChanges();

    expect(lines()[0].style.width).toBe('8rem');
    expect(lines()[0].style.height).toBe('4rem');
    expect(lines()[0].style.borderRadius).toBe('var(--ds-radius-lg)');
  });

  it('rounds a rectangle by default, and leaves round shapes alone', () => {
    host.variant.set('rect');
    fixture.detectChanges();
    expect(lines()[0].style.borderRadius).toBe('var(--ds-radius-md)');

    host.variant.set('circle');
    fixture.detectChanges();
    expect(lines()[0].style.borderRadius).toBe('');
    expect(lines()[0].classList).toContain('ds-skeleton__line--circle');
  });

  it('drives its animation from Bootstrap’s hooks on the parent', () => {
    expect(skeleton().classList).toContain('placeholder-glow');

    host.animation.set('wave');
    fixture.detectChanges();
    expect(skeleton().classList).toContain('placeholder-wave');
    expect(skeleton().classList).not.toContain('placeholder-glow');

    host.animation.set('none');
    fixture.detectChanges();
    expect(skeleton().className).not.toContain('placeholder-');
  });

  it('never renders zero lines', () => {
    host.lines.set(0);
    fixture.detectChanges();
    expect(lines().length).toBe(1);
  });
});
