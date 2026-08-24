import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { EmptyStateComponent, type HeadingLevel } from './empty-state.component';

@Component({
  standalone: true,
  imports: [EmptyStateComponent],
  template: `
    <ds-empty-state
      [title]="title()"
      [description]="description()"
      [icon]="icon()"
      [size]="size()"
      [align]="align()"
      [textured]="textured()"
      [headingLevel]="headingLevel()"
      [live]="live()"
    >
      @if (withActions()) {
        <button dsEmptyStateActions type="button">New invoice</button>
      }
      @if (withMedia()) {
        <img dsEmptyStateMedia src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="" />
      }
    </ds-empty-state>
  `,
})
class HostComponent {
  readonly title = signal('No invoices yet');
  readonly description = signal('Invoices appear here once a project is billed.');
  readonly icon = signal<'search' | null>('search');
  readonly size = signal<'sm' | 'md' | 'lg'>('md');
  readonly align = signal<'center' | 'start'>('center');
  readonly textured = signal(false);
  readonly headingLevel = signal<HeadingLevel>(0);
  readonly live = signal(false);
  readonly withActions = signal(false);
  readonly withMedia = signal(false);
}

describe('EmptyStateComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);

  const root = () => fixture.nativeElement.querySelector('ds-empty-state') as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('says what is not here, and why', () => {
    expect(query('.ds-empty-state__title')!.textContent!.trim()).toBe('No invoices yet');
    expect(query('.ds-empty-state__description')!.textContent).toContain('once a project is billed');
  });

  it('is a paragraph, not a heading, until it is told otherwise', () => {
    // An <h2> in the middle of a table would lie about the document's outline.
    expect(query('.ds-empty-state__title')!.tagName).toBe('P');

    host.headingLevel.set(3);
    fixture.detectChanges();
    expect(query('.ds-empty-state__title')!.tagName).toBe('H3');

    host.headingLevel.set(2);
    fixture.detectChanges();
    expect(query('.ds-empty-state__title')!.tagName).toBe('H2');
  });

  it('hides the icon from assistive tech — the title says the same thing', () => {
    expect(query('.ds-empty-state__icon')!.getAttribute('aria-hidden')).toBe('true');

    host.icon.set(null);
    fixture.detectChanges();
    expect(query('.ds-empty-state__icon')).toBeNull();
  });

  it('is not a live region by default', () => {
    expect(root().getAttribute('role')).toBeNull();

    host.live.set(true);
    fixture.detectChanges();
    expect(root().getAttribute('role')).toBe('status');
  });

  it('maps size, alignment and texture onto classes', () => {
    host.size.set('lg');
    host.align.set('start');
    host.textured.set(true);
    fixture.detectChanges();

    const block = query('.ds-empty-state')!;
    expect(block.classList).toContain('ds-empty-state--lg');
    expect(block.classList).toContain('ds-empty-state--start');
    expect(block.classList).toContain('ds-empty-state--textured');
  });

  it('takes an illustration instead of an icon', () => {
    host.withMedia.set(true);
    fixture.detectChanges();

    const media = query('.ds-empty-state__media')!;
    expect(media.querySelector('img')).toBeTruthy();
    // A decorative image, with an empty alt rather than none at all.
    expect(media.querySelector('img')!.getAttribute('alt')).toBe('');
  });

  it('holds the actions at the bottom, and collapses when there are none', () => {
    expect(query('.ds-empty-state__actions')!.children.length).toBe(0);

    host.withActions.set(true);
    fixture.detectChanges();
    expect(query('.ds-empty-state__actions button')!.textContent).toContain('New invoice');
  });
});
