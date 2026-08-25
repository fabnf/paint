import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { KbdComponent, splitKeys, spokenKeys, type KbdSize } from './kbd.component';

@Component({
  standalone: true,
  imports: [KbdComponent],
  template: `<ds-kbd [keys]="keys()" [size]="size()" [srLabel]="srLabel()">{{ content() }}</ds-kbd>`,
})
class HostComponent {
  readonly keys = signal<string | readonly string[] | null>(null);
  readonly size = signal<KbdSize>('sm');
  readonly srLabel = signal('');
  readonly content = signal('Esc');
}

describe('splitKeys', () => {
  it('splits a combination on "+"', () => {
    expect(splitKeys('Ctrl+Enter')).toEqual(['Ctrl', 'Enter']);
    expect(splitKeys('Ctrl+Shift+P')).toEqual(['Ctrl', 'Shift', 'P']);
  });

  it('keeps a literal "+" key', () => {
    expect(splitKeys('Ctrl++')).toEqual(['Ctrl', '+']);
    expect(splitKeys('+')).toEqual(['+']);
  });

  it('separates modifier glyphs glued to a key', () => {
    expect(splitKeys('⌘K')).toEqual(['⌘', 'K']);
    expect(splitKeys('⌘⇧P')).toEqual(['⌘', '⇧', 'P']);
    // A word is one key, even though it is several characters.
    expect(splitKeys('Esc')).toEqual(['Esc']);
    expect(splitKeys('Enter')).toEqual(['Enter']);
  });

  it('takes an array as written', () => {
    expect(splitKeys(['Shift', '?'])).toEqual(['Shift', '?']);
    expect(splitKeys('')).toEqual([]);
  });
});

describe('spokenKeys', () => {
  it('names the glyphs and leaves the words alone', () => {
    expect(spokenKeys(['⌘', 'K'])).toBe('Command K');
    expect(spokenKeys(['Ctrl', '↵'])).toBe('Ctrl Enter');
    expect(spokenKeys(['⇧', '⇥'])).toBe('Shift Tab');
  });
});

describe('KbdComponent', () => {
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

  it('renders a real <kbd> around projected content', () => {
    const kbd = query<HTMLElement>('kbd')!;
    expect(kbd.tagName).toBe('KBD');
    expect(kbd.textContent!.trim()).toBe('Esc');
    expect(kbd.classList).toContain('ds-kbd');
    expect(kbd.classList).toContain('ds-kbd--sm');
  });

  it('is not interactive: no role, no tab stop, no listener', () => {
    const kbd = query<HTMLElement>('kbd')!;
    expect(kbd.getAttribute('role')).toBeNull();
    expect(kbd.getAttribute('tabindex')).toBeNull();
    expect(kbd.tabIndex).toBe(-1);
  });

  it('renders one keycap per key, joined by a plus', () => {
    host.keys.set('Ctrl+Enter');
    fixture.detectChanges();

    const caps = queryAll('.ds-kbd__key');
    expect(caps.map((cap) => cap.textContent!.trim())).toEqual(['Ctrl', 'Enter']);
    expect(queryAll('.ds-kbd__plus').length).toBe(1);
    // The sequence is itself a <kbd>, as HTML nests them.
    expect(query('.ds-kbd--group')!.tagName).toBe('KBD');
    expect(caps.every((cap) => cap.tagName === 'KBD')).toBeTrue();
  });

  it('says words for glyphs, and hides the glyphs', () => {
    host.keys.set('⌘K');
    fixture.detectChanges();

    const spoken = query('.visually-hidden')!;
    expect(spoken.textContent!.trim()).toBe('Command K');
    expect(query('.ds-kbd--group')!.getAttribute('aria-hidden')).toBe('true');
    expect(queryAll('.ds-kbd__key').map((cap) => cap.textContent!.trim())).toEqual(['⌘', 'K']);
  });

  it('does not repeat a shortcut that already reads as words', () => {
    host.keys.set('Ctrl+Enter');
    fixture.detectChanges();

    expect(query('.visually-hidden')).toBeNull();
    expect(query('.ds-kbd--group')!.getAttribute('aria-hidden')).toBeNull();
  });

  it('lets the consumer override the spoken name', () => {
    host.srLabel.set('Escape');
    fixture.detectChanges();

    expect(query('.visually-hidden')!.textContent!.trim()).toBe('Escape');
    expect(query('.ds-kbd')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('takes an array of keys as written', () => {
    host.keys.set(['Shift', '?']);
    fixture.detectChanges();

    expect(queryAll('.ds-kbd__key').map((cap) => cap.textContent!.trim())).toEqual(['Shift', '?']);
  });

  it('has two sizes', () => {
    host.size.set('md');
    fixture.detectChanges();
    expect(query('.ds-kbd')!.classList).toContain('ds-kbd--md');

    host.keys.set('⌘K');
    fixture.detectChanges();
    expect(query('.ds-kbd--group')!.classList).toContain('ds-kbd--md');
  });
});
