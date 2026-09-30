import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ShortcutHintComponent } from './shortcut-hint.component';

@Component({
  standalone: true,
  imports: [ShortcutHintComponent],
  template: `
    <ds-shortcut-hint
      [label]="label()"
      [description]="description()"
      [keys]="keys()"
      [alternatives]="alternatives()"
      [srLabel]="srLabel()"
      [icon]="icon()"
      [size]="size()"
    >
      {{ projected() }}
    </ds-shortcut-hint>
  `,
})
class HostComponent {
  readonly label = signal('Search');
  readonly description = signal('');
  readonly keys = signal<string | readonly string[]>('⌘K');
  readonly alternatives = signal<readonly string[]>([]);
  readonly srLabel = signal('');
  readonly icon = signal<'search' | null>(null);
  readonly size = signal<'sm' | 'md'>('sm');
  readonly projected = signal('');
}

describe('ShortcutHintComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);
  const queryAll = (selector: string): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll(selector));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('puts the label on the left and the keycap on the right', () => {
    expect(query('.ds-shortcut-hint__label')!.textContent!.trim()).toBe('Search');
    const keys = query('.ds-shortcut-hint__keys')!;
    expect(keys.querySelector('ds-kbd')).toBeTruthy();
    expect(Array.from(keys.querySelectorAll('.ds-kbd__key')).map((key) => key.textContent!.trim())).toEqual(['⌘', 'K']);
    // Label first, keys last, in reading order.
    expect(query('.ds-shortcut-hint')!.lastElementChild!.classList).toContain('ds-shortcut-hint__keys');
  });

  it('reads as one row: the label, then the words for the keys', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent!.replace(/\s+/g, ' ').trim();
    // The spoken words come from the keycap; the glyphs are aria-hidden.
    expect(text).toContain('Search');
    expect(query('ds-kbd .visually-hidden')!.textContent!.trim()).toBe('Command K');
    expect(query('ds-kbd kbd')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('is not interactive: no role, no tab stop, no button', () => {
    const root = query('.ds-shortcut-hint')!;
    expect(root.getAttribute('role')).toBeNull();
    expect(fixture.nativeElement.querySelector('button, a, [tabindex]')).toBeNull();
    const focusable = queryAll('*').filter((node) => node.tabIndex >= 0);
    expect(focusable.length).toBe(0);
  });

  it('adds a quieter second line when asked', () => {
    expect(query('.ds-shortcut-hint__description')).toBeNull();
    host.description.set('Also searches commands.');
    fixture.detectChanges();
    expect(query('.ds-shortcut-hint__description')!.textContent).toContain('Also searches commands.');
  });

  it('shows alternatives with a word between them', () => {
    host.alternatives.set(['/']);
    fixture.detectChanges();
    expect(queryAll('ds-kbd').length).toBe(2);
    expect(query('.ds-shortcut-hint__or')!.textContent!.trim()).toBe('or');
    expect(queryAll('ds-kbd')[1].textContent!.trim()).toBe('/');
  });

  it('hands an override of the spoken name to the keycap', () => {
    host.srLabel.set('Command K, search');
    fixture.detectChanges();
    expect(query('ds-kbd .visually-hidden')!.textContent!.trim()).toBe('Command K, search');
  });

  it('draws a decorative icon', () => {
    host.icon.set('search');
    fixture.detectChanges();
    const icon = query('.ds-shortcut-hint__icon')!;
    expect(icon).toBeTruthy();
    expect(icon.getAttribute('aria-hidden')).toBe('true');
  });

  it('takes projected label content', () => {
    host.label.set('');
    host.projected.set('Open the palette');
    fixture.detectChanges();
    expect(query('.ds-shortcut-hint__label')!.textContent!.trim()).toBe('Open the palette');
  });

  it('scales the keycap with the row', () => {
    expect(query('kbd')!.classList).toContain('ds-kbd--sm');
    host.size.set('md');
    fixture.detectChanges();
    expect(query('.ds-shortcut-hint')!.classList).toContain('ds-shortcut-hint--md');
    expect(query('kbd')!.classList).toContain('ds-kbd--md');
  });
});