import { Component, signal } from '@angular/core';
import { TestBed, fakeAsync, tick, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BreadcrumbComponent } from './breadcrumb.component';
import { collapseBreadcrumbs, type BreadcrumbItem } from './breadcrumb.types';

const PATH: readonly BreadcrumbItem[] = [
  { label: 'Home', link: '/', icon: 'home' },
  { label: 'Projects', link: '/projects' },
  { label: 'Paint', link: '/projects/paint' },
  { label: 'Design system', link: '/projects/paint/ds' },
  { label: 'Mural' },
];

describe('collapseBreadcrumbs', () => {
  const kinds = (items: readonly BreadcrumbItem[], max: number, before = 1, after = 2) =>
    collapseBreadcrumbs(items, max, before, after).map((slot) =>
      slot.kind === 'ellipsis' ? `…${slot.hidden}` : slot.item.label,
    );

  it('shows everything when it fits', () => {
    expect(kinds(PATH, 0)).toEqual(['Home', 'Projects', 'Paint', 'Design system', 'Mural']);
    expect(kinds(PATH, 5)).toEqual(['Home', 'Projects', 'Paint', 'Design system', 'Mural']);
  });

  it('collapses the middle, and counts what it hid', () => {
    expect(kinds(PATH, 4)).toEqual(['Home', '…2', 'Design system', 'Mural']);
    expect(kinds(PATH, 3, 1, 1)).toEqual(['Home', '…3', 'Mural']);
  });

  it('marks only the last crumb as current', () => {
    const slots = collapseBreadcrumbs(PATH, 0, 1, 2);
    const current = slots.filter((slot) => slot.kind === 'item' && slot.current);
    expect(current.length).toBe(1);
    expect(current[0].kind === 'item' && current[0].item.label).toBe('Mural');
  });

  it('refuses to collapse when the button would hide one crumb', () => {
    // A "…" that stands for a single page is wider than the page it hides.
    expect(kinds(PATH, 4, 2, 2)).toEqual(['Home', 'Projects', 'Paint', 'Design system', 'Mural']);
  });

  it('always keeps the current page', () => {
    expect(kinds(PATH, 2, 0, 1)).toEqual(['…4', 'Mural']);
  });
});

@Component({
  standalone: true,
  imports: [BreadcrumbComponent],
  template: `
    <ds-breadcrumb
      [items]="items()"
      [maxItems]="maxItems()"
      [label]="label()"
      [separator]="separator()"
    />
  `,
})
class HostComponent {
  readonly items = signal<readonly BreadcrumbItem[]>(PATH);
  readonly maxItems = signal(0);
  readonly label = signal('Breadcrumb');
  readonly separator = signal('');
}

describe('BreadcrumbComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);
  const all = (selector: string) =>
    Array.from(fixture.nativeElement.querySelectorAll(selector) as NodeListOf<HTMLElement>);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('is a named nav around an ordered list', () => {
    expect(query('nav')!.getAttribute('aria-label')).toBe('Breadcrumb');
    expect(query('ol')).toBeTruthy();
    expect(all('li').length).toBe(5);
  });

  it('links every crumb but the last', () => {
    const links = all('a');
    expect(links.length).toBe(4);
    expect(links[0].getAttribute('href')).toBe('/');
  });

  it('marks the page you are on, and does not link it', () => {
    const current = query('.ds-breadcrumb__current')!;
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(current.tagName).toBe('SPAN');
    expect(current.textContent!.trim()).toBe('Mural');
  });

  it('hides the separators: a list already announces itself as one', () => {
    const separators = all('.ds-breadcrumb__separator');
    expect(separators.length).toBe(4);
    expect(separators.every((node) => node.getAttribute('aria-hidden') === 'true')).toBeTrue();
  });

  it('takes a character instead of the chevron', () => {
    host.separator.set('/');
    fixture.detectChanges();
    expect(query('.ds-breadcrumb__separator')!.textContent!.trim()).toBe('/');
  });

  it('collapses a long path behind a button that says how many', () => {
    host.maxItems.set(4);
    fixture.detectChanges();

    const expand = query<HTMLButtonElement>('.ds-breadcrumb__expand')!;
    expect(expand.getAttribute('aria-label')).toBe('Show 2 hidden breadcrumbs');
    expect(expand.getAttribute('aria-expanded')).toBe('false');
    expect(all('li').length).toBe(4);
  });

  it('expands in place, and lands focus on the first crumb it was hiding', fakeAsync(() => {
    host.maxItems.set(4);
    fixture.detectChanges();

    query<HTMLButtonElement>('.ds-breadcrumb__expand')!.click();
    fixture.detectChanges();
    tick();

    expect(query('.ds-breadcrumb__expand')).toBeNull();
    expect(all('li').length).toBe(5);
    // Not the body: the button the user pressed no longer exists.
    expect(document.activeElement!.textContent).toContain('Projects');
  }));

  it('renders a crumb with nowhere to go as text, not as a dead anchor', () => {
    host.items.set([{ label: 'Archive' }, { label: 'Mural' }]);
    fixture.detectChanges();

    expect(all('a').length).toBe(0);
    expect(query('.ds-breadcrumb__text')!.textContent!.trim()).toBe('Archive');
  });
});
