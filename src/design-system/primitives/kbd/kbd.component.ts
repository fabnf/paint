import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { cx } from '../primitives.types';

export type KbdSize = 'sm' | 'md';

/**
 * The glyphs a shortcut is usually printed with, and the words a screen reader
 * should say for them. `⌘` is announced as "place of interest sign" otherwise,
 * which is a fact about Unicode and not about the keyboard.
 */
export const KEY_GLYPH_NAMES: Readonly<Record<string, string>> = {
  '⌘': 'Command',
  '⌥': 'Option',
  '⌃': 'Control',
  '⇧': 'Shift',
  '⇪': 'Caps Lock',
  '⏎': 'Enter',
  '↵': 'Enter',
  '⌫': 'Backspace',
  '⌦': 'Delete',
  '⎋': 'Escape',
  '⇥': 'Tab',
  '␣': 'Space',
  '↑': 'Up arrow',
  '↓': 'Down arrow',
  '←': 'Left arrow',
  '→': 'Right arrow',
  '⇞': 'Page Up',
  '⇟': 'Page Down',
  '↖': 'Home',
  '↘': 'End',
};

/**
 * Splits a shortcut into its keys. `"Ctrl+Enter"` → `["Ctrl", "Enter"]`;
 * `"⌘K"` → `["⌘", "K"]` (a modifier glyph followed by a key is two keys);
 * a literal `+` key is written as `"Ctrl++"` → `["Ctrl", "+"]`.
 */
export function splitKeys(keys: string | readonly string[]): string[] {
  if (Array.isArray(keys)) {
    return [...(keys as readonly string[])];
  }
  const text = (keys as string).trim();
  if (!text) {
    return [];
  }
  // "Ctrl++" — the last "+" is a key, not a separator.
  const parts = text.split(/\+(?=.)/).filter((part) => part !== '');
  const result: string[] = [];
  for (const part of parts) {
    const glyphs = [...part];
    // A run of modifier glyphs glued to a key ("⌘⇧K") is one key per glyph.
    if (glyphs.length > 1 && glyphs.slice(0, -1).every((glyph) => glyph in KEY_GLYPH_NAMES)) {
      result.push(...glyphs.slice(0, -1), glyphs[glyphs.length - 1]);
    } else {
      result.push(part);
    }
  }
  return result;
}

/** The words for a list of keys: `["⌘", "K"]` → `"Command K"`. */
export function spokenKeys(keys: readonly string[]): string {
  return keys.map((key) => KEY_GLYPH_NAMES[key] ?? key).join(' ');
}

/**
 * Kbd — the keyboard-hint atom.
 *
 * A keycap for a shortcut or a key: `⌘K` next to a search field, `Ctrl+Enter`
 * in a toolbar tooltip, `Esc` in a dialog's corner. A real `<kbd>` — the
 * element HTML has had for this since 1993 — restyled from Paint's tokens so it
 * reads as a key rather than as code.
 *
 * It is **not interactive**. Nothing happens when it is clicked, it is never a
 * tab stop, and it does not listen for the shortcut it shows. The component that
 * owns the behaviour owns the keydown; this only tells the user which key.
 *
 * Two ways to write it:
 *
 * - **Content** — `<ds-kbd>Esc</ds-kbd>`. One keycap, exactly what you typed.
 * - **`keys`** — `<ds-kbd keys="Ctrl+Enter" />`. One keycap per key, joined by a
 *   `+`, and a spoken name derived from the glyphs: `⌘K` is announced as
 *   "Command K", not "place of interest sign K".
 *
 * @example
 * ```html
 * <ds-kbd>Esc</ds-kbd>
 * <ds-kbd keys="⌘K" />
 * <ds-kbd keys="Ctrl+Enter" size="md" />
 * <ds-kbd [keys]="['Shift', '?']" srLabel="Shift question mark" />
 * ```
 */
@Component({
  selector: 'ds-kbd',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (spoken()) {
      <!-- The glyphs are what the eye expects; the words are what the ear does. -->
      <span class="visually-hidden">{{ spoken() }}</span>
    }

    @if (keyList().length) {
      <kbd [class]="groupClasses()" [attr.aria-hidden]="spoken() ? 'true' : null">
        @for (key of keyList(); track $index) {
          @if ($index > 0) {
            <span class="ds-kbd__plus">+</span>
          }
          <kbd class="ds-kbd__key">{{ key }}</kbd>
        }
      </kbd>
    } @else {
      <kbd [class]="classes()" [attr.aria-hidden]="spoken() ? 'true' : null"><ng-content /></kbd>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      vertical-align: middle;
    }

    /* —— A keycap ——
       Bootstrap's reboot paints <kbd> as inverted code (body colour on body
       background). Paint paints it as a key: a surface, an edge, and a lip
       underneath so it reads as something you could press — which, here, you
       cannot. */
    .ds-kbd,
    .ds-kbd__key {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.6em;
      padding: 0 0.4em;
      border: 1px solid var(--ds-color-border-strong);
      border-bottom-width: 2px;
      border-radius: var(--ds-radius-sm);
      background-color: var(--ds-color-surface);
      color: var(--ds-color-text-muted);
      font-family: var(--ds-font-mono);
      font-weight: var(--ds-font-weight-medium);
      line-height: var(--ds-line-height-snug);
      white-space: nowrap;
      user-select: none;
    }

    .ds-kbd--sm {
      font-size: var(--ds-font-size-xs);
    }

    .ds-kbd--md {
      font-size: var(--ds-font-size-sm);
    }

    /* A combination is a row of keys, not a key with a "+" inside it. The outer
       <kbd> is the sequence; it draws nothing of its own. */
    .ds-kbd--group {
      display: inline-flex;
      align-items: center;
      gap: 0.25em;
      min-width: 0;
      padding: 0;
      border: 0;
      background: none;
      font-size: inherit;
    }

    .ds-kbd--group .ds-kbd__key {
      font-size: 1em;
    }

    .ds-kbd__plus {
      color: var(--ds-color-text-subtle);
      font-family: var(--ds-font-mono);
      font-size: 0.9em;
      line-height: 1;
    }

    /* Forced colours drop the background; the edge keeps the cap a shape. */
    @media (forced-colors: active) {
      .ds-kbd,
      .ds-kbd__key {
        border-color: CanvasText;
      }
    }
  `,
})
export class KbdComponent {
  /**
   * The key or key combination. A string is split on `+` (and a modifier glyph
   * glued to a key, `⌘K`, is two keys); an array is taken as written. Leave it
   * unset to project the content yourself.
   */
  readonly keys = input<string | readonly string[] | null>(null);
  /**
   * `sm` sits inside controls, menus and tooltips; `md` sits in running text.
   * A third size has not earned its keep.
   */
  readonly size = input<KbdSize>('sm');
  /**
   * What a screen reader says instead of the visible glyphs. Derived from
   * `keys` when they contain glyphs Paint knows (`⌘` → "Command"); set it when
   * the visible content is projected, or when the derivation is wrong.
   */
  readonly srLabel = input<string>('');

  protected readonly keyList = computed(() => {
    const keys = this.keys();
    return keys === null ? [] : splitKeys(keys);
  });

  /**
   * The spoken name. Only produced when it would *differ* from the visible
   * text: a `Ctrl+Enter` keycap reads fine as it is, and hiding it to say the
   * same thing again would be noise.
   */
  protected readonly spoken = computed(() => {
    if (this.srLabel()) {
      return this.srLabel();
    }
    const keys = this.keyList();
    return keys.some((key) => key in KEY_GLYPH_NAMES) ? spokenKeys(keys) : '';
  });

  protected readonly classes = computed(() => cx('ds-kbd', `ds-kbd--${this.size()}`));

  protected readonly groupClasses = computed(() =>
    cx('ds-kbd', 'ds-kbd--group', `ds-kbd--${this.size()}`),
  );
}
