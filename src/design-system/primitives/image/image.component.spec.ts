import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ImageComponent, ImageFallbackDirective, type ImageFit, type ImageRatio } from './image.component';

/** A 1×1 GIF: a real image that loads without a network. */
const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';

@Component({
  standalone: true,
  imports: [ImageComponent, ImageFallbackDirective],
  template: `
    <ds-image
      [src]="src()"
      [alt]="alt()"
      [decorative]="decorative()"
      [ratio]="ratio()"
      [fit]="fit()"
      [position]="position()"
      [radius]="radius()"
      [loading]="loading()"
      [fallbackText]="fallbackText()"
      [srcset]="srcset()"
      (loaded)="loads = loads + 1"
      (failed)="failures = failures + 1"
    >
      @if (custom()) {
        <span dsImageFallback class="custom">WP</span>
      }
    </ds-image>
  `,
})
class HostComponent {
  readonly src = signal<string | null>(PIXEL);
  readonly alt = signal('A single pixel');
  readonly decorative = signal(false);
  readonly ratio = signal<ImageRatio | null>(null);
  readonly fit = signal<ImageFit>('cover');
  readonly position = signal('');
  readonly radius = signal<'none' | 'sm' | 'md' | 'lg' | 'full'>('md');
  readonly loading = signal<'lazy' | 'eager'>('lazy');
  readonly fallbackText = signal('');
  readonly srcset = signal('');
  readonly custom = signal(false);
  loads = 0;
  failures = 0;
}

describe('ImageComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);
  const frame = () => query<HTMLElement>('.ds-image')!;
  const img = () => query<HTMLImageElement>('img');

  const fail = () => {
    img()!.dispatchEvent(new Event('error'));
    fixture.detectChanges();
  };
  const load = () => {
    img()!.dispatchEvent(new Event('load'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a real <img> with its alt, lazily and asynchronously', () => {
    expect(img()).toBeTruthy();
    expect(img()!.getAttribute('alt')).toBe('A single pixel');
    expect(img()!.getAttribute('loading')).toBe('lazy');
    expect(img()!.getAttribute('decoding')).toBe('async');
    expect(frame().getAttribute('role')).toBeNull();
  });

  it('can load eagerly when asked', () => {
    host.loading.set('eager');
    fixture.detectChanges();
    expect(img()!.getAttribute('loading')).toBe('eager');
  });

  it('holds its proportions with aspect-ratio', () => {
    expect(frame().style.aspectRatio).toBe('');

    host.ratio.set('16/9');
    fixture.detectChanges();
    expect(frame().style.aspectRatio).toBe('16 / 9');
    expect(frame().classList).toContain('ds-image--ratio');

    host.ratio.set(1.5);
    fixture.detectChanges();
    expect(frame().style.aspectRatio).toBe('1.5 / 1');
  });

  it('fits and positions the picture by the CSS names', () => {
    expect(img()!.style.objectFit).toBe('cover');

    host.fit.set('contain');
    host.position.set('top');
    fixture.detectChanges();
    expect(img()!.style.objectFit).toBe('contain');
    expect(img()!.style.objectPosition).toBe('center top');
    expect(frame().classList).toContain('ds-image--contain');
  });

  it('rounds its corners from the radius tokens', () => {
    expect(frame().classList).toContain('rounded-md');
    host.radius.set('full');
    fixture.detectChanges();
    expect(frame().classList).toContain('rounded-full');
  });

  it('is a quiet block until the bytes land, then reports the load', () => {
    expect(frame().classList).toContain('ds-image--loading');
    load();
    expect(frame().classList).not.toContain('ds-image--loading');
    expect(host.loads).toBe(1);
  });

  it('shows the fallback when there is no src, without a request', () => {
    host.src.set(null);
    fixture.detectChanges();

    expect(img()).toBeNull();
    expect(query('.ds-image__fallback')).toBeTruthy();
    expect(query('ds-icon')).toBeTruthy();
    expect(frame().classList).toContain('ds-image--fallback');
  });

  it('falls back when the picture fails, and keeps the name', () => {
    fail();

    expect(img()).toBeNull();
    expect(host.failures).toBe(1);
    expect(frame().getAttribute('role')).toBe('img');
    expect(frame().getAttribute('aria-label')).toBe('A single pixel');
    // What is inside the frame is paint; the frame carries the name.
    expect(query('.ds-image__fallback')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('tries again with a new src after a failure', () => {
    fail();
    expect(img()).toBeNull();

    host.src.set(`${PIXEL}#second`);
    fixture.detectChanges();
    expect(img()).toBeTruthy();
    expect(frame().classList).toContain('ds-image--loading');
  });

  it('puts words in the fallback, and uses them as the name when there is no alt', () => {
    host.src.set(null);
    host.fallbackText.set('No cover yet');
    fixture.detectChanges();

    expect(query('.ds-image__fallback-text')!.textContent).toContain('No cover yet');
    expect(frame().getAttribute('aria-label')).toBe('A single pixel');

    host.alt.set('');
    fixture.detectChanges();
    expect(frame().getAttribute('aria-label')).toBe('No cover yet');
  });

  it('lets the consumer replace the fallback', () => {
    host.src.set(null);
    host.custom.set(true);
    fixture.detectChanges();

    expect(query('.custom')).toBeTruthy();
    expect(query('ds-icon')).toBeNull();
    expect(query('.ds-image__fallback-text')).toBeNull();
  });

  describe('decorative', () => {
    beforeEach(() => {
      host.decorative.set(true);
      host.alt.set('');
      fixture.detectChanges();
    });

    it('empties the alt rather than dropping it', () => {
      expect(img()!.hasAttribute('alt')).toBeTrue();
      expect(img()!.getAttribute('alt')).toBe('');
    });

    it('hides the fallback from assistive tech', () => {
      fail();
      expect(frame().getAttribute('role')).toBeNull();
      expect(frame().getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('passes srcset through untouched', () => {
    host.srcset.set(`${PIXEL} 1x, ${PIXEL} 2x`);
    fixture.detectChanges();
    expect(img()!.getAttribute('srcset')).toBe(`${PIXEL} 1x, ${PIXEL} 2x`);
  });

  it('warns in development about a picture with no name and no declaration', () => {
    const warn = spyOn(console, 'warn');
    host.alt.set('');
    fixture.detectChanges();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.calls.mostRecent().args[0]).toContain('has no alt');

    warn.calls.reset();
    host.decorative.set(true);
    fixture.detectChanges();
    expect(warn).not.toHaveBeenCalled();
  });
});
