import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TabComponent } from './tab.component';
import { TabsComponent, type TabsVariant } from './tabs.component';

@Component({
  standalone: true,
  imports: [TabsComponent, TabComponent],
  template: `
    <ds-tabs [variant]="variant" [(selected)]="selected" (selectedChanged)="changes.push($event)">
      <ds-tab tabId="first" label="First">First panel</ds-tab>
      <ds-tab tabId="second" label="Second" [badge]="3">Second panel</ds-tab>
      <ds-tab tabId="third" label="Third" [disabled]="disableThird()">Third panel</ds-tab>
    </ds-tabs>
  `,
})
class HostComponent {
  variant: TabsVariant = 'underline';
  selected: string | null = null;
  readonly disableThird = signal(true);
  changes: string[] = [];
}

describe('TabsComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const tabs = (): HTMLButtonElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('[role="tab"]'));
  const panel = (): HTMLElement | null => fixture.nativeElement.querySelector('[role="tabpanel"]');
  const keydown = (key: string) => {
    fixture.nativeElement
      .querySelector('[role="tablist"]')
      .dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a tab per ds-tab, on Bootstrap nav markup', () => {
    expect(tabs().length).toBe(3);
    expect(tabs()[0].classList).toContain('nav-link');
    expect(fixture.nativeElement.querySelector('.tab-content')).toBeTruthy();
  });

  it('selects the first enabled tab when nothing is set', () => {
    expect(tabs()[0].classList).toContain('active');
    expect(panel()?.textContent).toContain('First panel');
  });

  it('publishes the resolved tab back through the model', () => {
    expect(host.selected).toBe('first');
  });

  it('only renders the selected panel', () => {
    expect(fixture.nativeElement.querySelectorAll('[role="tabpanel"]').length).toBe(1);
    expect(panel()?.textContent).not.toContain('Second panel');
  });

  it('switches panels on click and emits the id', () => {
    tabs()[1].click();
    fixture.detectChanges();

    expect(panel()?.textContent).toContain('Second panel');
    expect(host.selected).toBe('second');
    expect(host.changes).toEqual(['second']);
  });

  it('ignores clicks on a disabled tab', () => {
    tabs()[2].click();
    fixture.detectChanges();

    expect(host.selected).toBe('first');
    expect(host.changes).toEqual([]);
  });

  it('wires up the ARIA tab pattern', () => {
    const [first, second] = tabs();

    expect(first.getAttribute('aria-selected')).toBe('true');
    expect(second.getAttribute('aria-selected')).toBe('false');
    expect(first.getAttribute('aria-controls')).toBe(panel()!.id);
    expect(panel()?.getAttribute('aria-labelledby')).toBe(first.id);
  });

  it('uses a roving tabindex', () => {
    expect(tabs()[0].tabIndex).toBe(0);
    expect(tabs()[1].tabIndex).toBe(-1);
  });

  it('moves and selects with arrow keys, skipping disabled tabs', () => {
    keydown('ArrowRight');
    expect(host.selected).toBe('second');

    // Third is disabled: wrap back to the first.
    keydown('ArrowRight');
    expect(host.selected).toBe('first');

    keydown('ArrowLeft');
    expect(host.selected).toBe('second');
  });

  it('jumps to the edges with Home and End', () => {
    keydown('End');
    // Third is disabled, so End lands on the last *enabled* tab.
    expect(host.selected).toBe('second');

    keydown('Home');
    expect(host.selected).toBe('first');
  });

  it('falls back to the first enabled tab when the selection is disabled', () => {
    host.selected = 'third';
    host.disableThird.set(true);
    fixture.detectChanges();

    expect(panel()?.textContent).toContain('First panel');
  });

  it('honours a selection that becomes enabled', () => {
    host.selected = 'third';
    host.disableThird.set(false);
    fixture.detectChanges();

    expect(panel()?.textContent).toContain('Third panel');
  });

  it('maps variants onto Bootstrap nav classes', () => {
    host.variant = 'pills';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="tablist"]').classList).toContain('nav-pills');

    host.variant = 'segmented';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="tablist"]').classList).toContain(
      'ds-tabs__list--segmented',
    );
  });

  it('renders a badge only when one is given', () => {
    expect(tabs()[1].textContent).toContain('3');
    expect(tabs()[0].querySelector('.ds-tabs__badge')).toBeNull();
  });

  it('speaks the badge instead of running it into the label', () => {
    // Visually "Second 3"; to a screen reader that would be "Second3".
    expect(tabs()[1].querySelector('.ds-tabs__badge')!.getAttribute('aria-hidden')).toBe('true');
    expect(tabs()[1].getAttribute('aria-label')).toBe('Second, 3 items');
    // A tab without a badge keeps its text as its name.
    expect(tabs()[0].hasAttribute('aria-label')).toBeFalse();
  });
});
