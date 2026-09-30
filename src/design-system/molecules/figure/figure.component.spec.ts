import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FigureCaptionDirective, FigureComponent } from './figure.component';

const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';

@Component({
  standalone: true,
  imports: [FigureComponent, FigureCaptionDirective],
  template: `
    <ds-figure
      [src]="src()"
      [alt]="alt()"
      [ratio]="ratio()"
      [caption]="caption()"
      [credit]="credit()"
      [creditHref]="creditHref()"
      [href]="href()"
      [link]="link()"
      [target]="target()"
      [captionAlign]="captionAlign()"
      (loaded)="loads = loads + 1"
      (failed)="failures = failures + 1"
    >
      @if (projected()) {
        <span dsFigureCaption class="rich">Level 2, <em>as built</em>.</span>
      }
    </ds-figure>
  `,
})
class HostComponent {
  readonly src = signal<string | null>(PIXEL);
  readonly alt = signal('A single pixel');
  readonly ratio = signal<'16/9' | null>(null);
  readonly caption = signal('Plate 3 — the first swatch.');
  readonly credit = signal('');
  readonly creditHref = signal<string | null>(null);
  readonly href = signal<string | null>(null);
  readonly link = signal<string | null>(null);
  readonly target = signal<string | null>(null);
  readonly captionAlign = signal<'start' | 'center'>('start');
  readonly projected = signal(false);
  loads = 0;
  failures = 0;
}

describe('FigureComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);
  const figure = () => query<HTMLElement>('figure')!;
  const caption = () => query<HTMLElement>('figcaption');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('is a real <figure> with a real <figcaption>, named by it', () => {
    expect(figure().tagName).toBe('FIGURE');
    expect(caption()!.tagName).toBe('FIGCAPTION');
    expect(caption()!.textContent).toContain('Plate 3 — the first swatch.');
    expect(caption()!.id).toBeTruthy();
    expect(figure().getAttribute('aria-labelledby')).toBe(caption()!.id);
  });

  it('puts the picture in a <ds-image> with the alt, and passes the frame through', () => {
    const img = query<HTMLImageElement>('ds-image img')!;
    expect(img.getAttribute('alt')).toBe('A single pixel');

    host.ratio.set('16/9');
    fixture.detectChanges();
    expect(query<HTMLElement>('.ds-image')!.style.aspectRatio).toBe('16 / 9');
  });

  it('treats an empty alt as a decorative picture — the caption names the figure', () => {
    host.alt.set('');
    fixture.detectChanges();
    expect(query<HTMLImageElement>('img')!.getAttribute('alt')).toBe('');
    expect(figure().getAttribute('aria-labelledby')).toBe(caption()!.id);
  });

  it('has no caption element, and no name, when there is nothing to say', () => {
    host.caption.set('');
    fixture.detectChanges();
    expect(caption()).toBeNull();
    expect(figure().getAttribute('aria-labelledby')).toBeNull();
  });

  it('shows a credit, alone or with the caption, as plain text by default', () => {
    host.credit.set('Photo: Ada Lovelace');
    fixture.detectChanges();
    expect(query('.ds-figure__credit')!.textContent!.trim()).toBe('Photo: Ada Lovelace');
    expect(query('.ds-figure__credit a')).toBeNull();

    host.caption.set('');
    fixture.detectChanges();
    expect(caption()).toBeTruthy();
    expect(figure().getAttribute('aria-labelledby')).toBe(caption()!.id);
  });

  it('makes the credit a real link when asked', () => {
    host.credit.set('Photo: Ada Lovelace');
    host.creditHref.set('https://example.com/ada');
    fixture.detectChanges();
    const anchor = query<HTMLAnchorElement>('.ds-figure__credit a')!;
    expect(anchor.getAttribute('href')).toBe('https://example.com/ada');
    expect(anchor.textContent).toContain('Photo: Ada Lovelace');
  });

  it('wraps the picture in a link named by the alt', () => {
    expect(query('a.ds-figure__link')).toBeNull();

    host.href.set('/plates/3.jpg');
    host.target.set('_blank');
    fixture.detectChanges();
    const anchor = query<HTMLAnchorElement>('a.ds-figure__link')!;
    expect(anchor.getAttribute('href')).toBe('/plates/3.jpg');
    expect(anchor.getAttribute('rel')).toBe('noreferrer noopener');
    expect(anchor.querySelector('img')!.getAttribute('alt')).toBe('A single pixel');
    // No second name: the alt is the name.
    expect(anchor.getAttribute('aria-label')).toBeNull();
  });

  it('routes when given a router link', () => {
    host.link.set('/gallery');
    fixture.detectChanges();
    const anchor = query<HTMLAnchorElement>('a.ds-figure__link')!;
    expect(anchor.getAttribute('href')).toBe('/gallery');
    expect(anchor.getAttribute('target')).toBeNull();
  });

  it('takes projected caption content, after the text', () => {
    host.projected.set(true);
    fixture.detectChanges();
    expect(caption()!.querySelector('.rich em')!.textContent).toBe('as built');
    expect(caption()!.textContent).toMatch(/Plate 3.*Level 2/s);

    host.caption.set('');
    fixture.detectChanges();
    expect(caption()).toBeTruthy();
    expect(caption()!.querySelector('.ds-figure__text')).toBeNull();
  });

  it('centres the caption when asked', () => {
    host.captionAlign.set('center');
    fixture.detectChanges();
    expect(figure().classList).toContain('ds-figure--center');
  });

  it('relays the picture’s load and failure', () => {
    query('img')!.dispatchEvent(new Event('load'));
    expect(host.loads).toBe(1);
    query('img')!.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(host.failures).toBe(1);
    // The atom's fallback, still named — the figure does not add a second one.
    expect(query('.ds-image__fallback')).toBeTruthy();
    expect(query('[role="img"]')!.getAttribute('aria-label')).toBe('A single pixel');
  });

  it('is not a card: no heading, no surface, no button', () => {
    expect(fixture.nativeElement.querySelector('h1, h2, h3, h4, button')).toBeNull();
  });
});