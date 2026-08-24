import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LinkComponent, type LinkUnderline, type LinkVariant } from './link.component';

@Component({
  standalone: true,
  imports: [LinkComponent],
  template: `
    <ds-link
      [href]="href()"
      [link]="link()"
      [target]="target()"
      [variant]="variant()"
      [underline]="underline()"
      [external]="external()"
      [iconEnd]="iconEnd()"
    >
      Read the docs
    </ds-link>
  `,
})
class HostComponent {
  readonly href = signal<string | null>('/docs');
  readonly link = signal<string | null>(null);
  readonly target = signal<string | null>(null);
  readonly variant = signal<LinkVariant>('primary');
  readonly underline = signal<LinkUnderline>('always');
  readonly external = signal<boolean | null>(null);
  readonly iconEnd = signal<'arrowRight' | null>(null);
}

describe('LinkComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);

  const anchor = () => query<HTMLAnchorElement>('a')!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a real anchor with a real href', () => {
    // Middle-click, ⌘-click and "copy link address" are not features to add later.
    expect(anchor().getAttribute('href')).toBe('/docs');
    expect(anchor().textContent!.trim()).toBe('Read the docs');
    expect(query('button')).toBeNull();
  });

  it('renders a router-driven anchor when link is set', () => {
    host.href.set(null);
    host.link.set('/foundations');
    fixture.detectChanges();

    expect(anchor().getAttribute('href')).toBe('/foundations');
  });

  it('never puts a second tab stop on the host', () => {
    host.href.set(null);
    host.link.set('/foundations');
    fixture.detectChanges();

    const hostEl: HTMLElement = fixture.nativeElement.querySelector('ds-link');
    expect(hostEl.hasAttribute('tabindex')).toBeFalse();
    expect(hostEl.hasAttribute('routerlink')).toBeFalse();
  });

  it('secures a new tab, and says it opens one', () => {
    host.href.set('https://angular.dev');
    host.target.set('_blank');
    fixture.detectChanges();

    expect(anchor().getAttribute('rel')).toBe('noreferrer noopener');
    expect(anchor().getAttribute('target')).toBe('_blank');
    expect(query('.visually-hidden')!.textContent).toContain('opens in a new tab');
    expect(query('.ds-link__external')).toBeTruthy();
  });

  it('marks an external link without promising a new tab', () => {
    host.href.set('https://angular.dev');
    host.external.set(true);
    fixture.detectChanges();

    expect(query('.ds-link__external')).toBeTruthy();
    expect(query('.visually-hidden')).toBeNull();
    expect(anchor().getAttribute('rel')).toBeNull();
  });

  it('hides the external glyph from assistive tech', () => {
    host.target.set('_blank');
    fixture.detectChanges();
    expect(query('.ds-link__external svg')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('maps variant and underline onto classes', () => {
    host.variant.set('subtle');
    host.underline.set('hover');
    fixture.detectChanges();

    expect(anchor().classList).toContain('ds-link--subtle');
    expect(anchor().classList).toContain('ds-link--underline-hover');
  });

  it('renders a trailing icon inside the anchor', () => {
    host.iconEnd.set('arrowRight');
    fixture.detectChanges();

    expect(anchor().querySelector('ds-icon')).toBeTruthy();
    expect(query('.ds-link__label')!.textContent!.trim()).toBe('Read the docs');
  });
});
