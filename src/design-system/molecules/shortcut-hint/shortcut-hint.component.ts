import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconComponent, type IconName } from '../../icons';
import { KbdComponent } from '../../primitives/kbd';
import { cx } from '../../primitives/primitives.types';

export type ShortcutHintSize = 'sm' | 'md';

/**
 * ShortcutHint — what it does on the left, which key does it on the right.
 *
 * The row a settings page, a "keyboard shortcuts" sheet and a docs table all
 * draw by hand: a label, room, a keycap. Composed from `<ds-kbd>`, so the
 * glyphs are spoken as words ("Command K"), and the keys are never a tab stop.
 *
 * It is **not interactive**. Nothing here listens for the key or performs the
 * action — the component that owns the behaviour does. A row of these inside a
 * `<ds-stack [divided]>` is a shortcuts sheet; inside a `<ds-popover>` it is the
 * "?" overlay every app has. A shortcut the user can *change* is a form, and
 * this is not it.
 *
 * Two shortcuts for one action (`⌘K` on a Mac, `Ctrl+K` elsewhere) are a
 * decision about the user's machine, made by the host: pass the right one.
 * `alternatives` is for the rare action that genuinely has two — shown as
 * "⌘K or /" — not for platform detection.
 *
 * @example
 * ```html
 * <ds-shortcut-hint label="Search" keys="⌘K" />
 * <ds-shortcut-hint label="Save" description="Also saves drafts." keys="Ctrl+S" icon="download" />
 * <ds-shortcut-hint label="Search" keys="⌘K" [alternatives]="['/']" size="md" />
 *
 * <ds-stack [gap]="0" [divided]="true">
 *   <ds-shortcut-hint label="Search" keys="⌘K" />
 *   <ds-shortcut-hint label="New file" keys="⌘N" />
 *   <ds-shortcut-hint label="Close" keys="Esc" />
 * </ds-stack>
 * ```
 */
@Component({
  selector: 'ds-shortcut-hint',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KbdComponent, IconComponent],
  template: `
    <div [class]="classes()">
      @if (icon()) {
        <!-- Decoration: the label says it in words. -->
        <ds-icon [name]="icon()!" [size]="iconSize()" class="ds-shortcut-hint__icon" aria-hidden="true" />
      }

      <span class="ds-shortcut-hint__text">
        <span class="ds-shortcut-hint__label">{{ label() }}<ng-content /></span>
        @if (description()) {
          <span class="ds-shortcut-hint__description">{{ description() }}</span>
        }
      </span>

      <span class="ds-shortcut-hint__keys">
        <ds-kbd [keys]="keys()" [size]="kbdSize()" [srLabel]="srLabel()" />
        @for (alternative of alternatives(); track $index) {
          <span class="ds-shortcut-hint__or">{{ orText() }}</span>
          <ds-kbd [keys]="alternative" [size]="kbdSize()" />
        }
      </span>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .ds-shortcut-hint {
      display: flex;
      align-items: center;
      gap: var(--ds-space-3);
      padding-block: var(--ds-space-2);
      font-size: var(--ds-font-size-sm);
      line-height: var(--ds-line-height-snug);
      color: var(--ds-color-text);
    }

    .ds-shortcut-hint--md {
      padding-block: var(--ds-space-2_5);
      font-size: var(--ds-font-size-md);
    }

    .ds-shortcut-hint__icon {
      flex-shrink: 0;
      color: var(--ds-color-text-subtle);
    }

    /* The label takes the room; the keys sit at the far edge, every row aligned. */
    .ds-shortcut-hint__text {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      gap: var(--ds-space-0_5);
      min-width: 0;
    }

    .ds-shortcut-hint__description {
      font-size: var(--ds-font-size-xs);
      color: var(--ds-color-text-muted);
    }

    .ds-shortcut-hint--md .ds-shortcut-hint__description {
      font-size: var(--ds-font-size-sm);
    }

    .ds-shortcut-hint__keys {
      display: inline-flex;
      align-items: center;
      flex-shrink: 0;
      gap: var(--ds-space-1_5);
    }

    .ds-shortcut-hint__or {
      font-size: var(--ds-font-size-xs);
      color: var(--ds-color-text-subtle);
    }
  `,
})
export class ShortcutHintComponent {
  /** What the shortcut does. Project content instead for a label with markup. */
  readonly label = input<string>('');
  /** One more line under the label, quieter. */
  readonly description = input<string>('');
  /** The shortcut, as `<ds-kbd>` takes it: `"⌘K"`, `"Ctrl+Enter"`, `['Shift', '?']`. */
  readonly keys = input.required<string | readonly string[]>();
  /** Other shortcuts for the same action. Rare, and not for platform detection. */
  readonly alternatives = input<readonly (string | readonly string[])[]>([]);
  /** The word between alternatives. */
  readonly orText = input<string>('or');
  /** Spoken name of the main shortcut, when the derived one is wrong. */
  readonly srLabel = input<string>('');
  /** Leading icon. Decorative. */
  readonly icon = input<IconName | null>(null);
  /** `sm` for a dense sheet; `md` for a settings page. */
  readonly size = input<ShortcutHintSize>('sm');

  /** The keycap and the icon follow the row: both scales are `sm | md`. */
  protected readonly kbdSize = computed<'sm' | 'md'>(() => this.size());
  protected readonly iconSize = computed<'sm' | 'md'>(() => this.size());

  protected readonly classes = computed(() =>
    cx('ds-shortcut-hint', `ds-shortcut-hint--${this.size()}`),
  );
}
