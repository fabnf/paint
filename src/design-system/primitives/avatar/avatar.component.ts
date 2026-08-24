import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { IconComponent, type IconName } from '../../icons';
import type { AvatarSizeToken } from '../../tokens/spacing.tokens';
import { cx } from '../primitives.types';

export type AvatarSize = AvatarSizeToken;
export type AvatarShape = 'circle' | 'square';

/** Presence, as a ring-bordered dot. `null` means "we are not saying". */
export type AvatarStatus = 'online' | 'away' | 'busy' | 'offline';

const STATUS_LABEL: Record<AvatarStatus, string> = {
  online: 'Online',
  away: 'Away',
  busy: 'Busy',
  offline: 'Offline',
};

/** The tints an avatar's initials can land on, in order. */
const PALETTE = ['primary', 'accent', 'success', 'warning', 'danger', 'info'] as const;

/**
 * Initials from a person's name: first letter of the first and last words.
 *
 * Deliberately naive about scripts it cannot segment — for anything that is not
 * two Latin-ish words it takes the first grapheme and stops, because half a
 * glyph is worse than one.
 */
export function initialsFrom(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) {
    return '';
  }
  const first = [...words[0]][0] ?? '';
  const last = words.length > 1 ? ([...words[words.length - 1]][0] ?? '') : '';
  return (first + last).toUpperCase();
}

/**
 * A stable tint per name, so the same person is the same colour on every screen
 * and across reloads. Not random: randomness would make an avatar a poor
 * recognition cue, which is the only reason initials exist.
 */
export function toneIndexFrom(name: string): number {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.codePointAt(0)!) >>> 0;
  }
  return hash % PALETTE.length;
}

/**
 * Avatar — the identity atom.
 *
 * An image if there is one, initials if there is not, an icon if there is no
 * name either. The fallback is not a loading state: it is what the avatar looks
 * like when the photo 404s, which is why a broken `src` falls back instead of
 * showing a broken-image glyph.
 *
 * A nameless avatar is decoration and is hidden from assistive tech. Give it a
 * `name` — or the name beside it, and `decorative`.
 *
 * A nameless avatar is decoration and is hidden from assistive tech. Give it a
 * `name` — or the name beside it, and `decorative`.
 *
 * @example
 * ```html
 * <ds-avatar name="Ada Lovelace" src="/ada.jpg" />
 * <ds-avatar name="Grace Hopper" size="lg" status="online" />
 * <ds-avatar name="Paint" shape="square" icon="palette" />
 *
 * <!-- Next to the name it repeats, the avatar is decoration -->
 * <ds-flex align="center" [gap]="2">
 *   <ds-avatar name="Ada Lovelace" size="xs" [decorative]="true" />
 *   <ds-text>Ada Lovelace</ds-text>
 * </ds-flex>
 * ```
 */
@Component({
  selector: 'ds-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <span
      [class]="classes()"
      [attr.role]="showImage() || silent() ? null : 'img'"
      [attr.aria-label]="silent() || showImage() ? null : accessibleName()"
      [attr.aria-hidden]="silent() ? 'true' : null"
      [attr.title]="title() || null"
    >
      @if (showImage()) {
        <!--
          The alt text is the name, or empty when the avatar is decoration. A
          broken image falls back to initials rather than to the browser's
          broken-image glyph, which tells the user nothing about the person.
        -->
        <img
          class="ds-avatar__image"
          [src]="src()"
          [attr.alt]="silent() ? '' : accessibleName()"
          loading="lazy"
          (error)="failed.set(true)"
        />
      } @else if (initials()) {
        <span class="ds-avatar__initials" aria-hidden="true">{{ initials() }}</span>
      } @else {
        <ds-icon [name]="icon()" [size]="iconSize()" />
      }

      @if (status()) {
        <!-- The dot's meaning is already in the avatar's name. -->
        <span [class]="statusClasses()" aria-hidden="true"></span>
      }
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      vertical-align: middle;
    }

    .ds-avatar {
      --ds-avatar-size: var(--ds-avatar-size-md);

      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: var(--ds-avatar-size);
      height: var(--ds-avatar-size);
      overflow: visible;
      color: var(--ds-tone-fg);
      background-color: var(--ds-tone-bg);
      /* An avatar is a block of colour; on a same-coloured surface it needs an
         edge to stay a shape. */
      border: 1px solid color-mix(in srgb, var(--ds-tone-fg) 20%, transparent);
      font-size: calc(var(--ds-avatar-size) * 0.38);
      font-weight: var(--ds-font-weight-semibold);
      line-height: 1;
      user-select: none;
    }

    .ds-avatar--xs {
      --ds-avatar-size: var(--ds-avatar-size-xs);
    }
    .ds-avatar--sm {
      --ds-avatar-size: var(--ds-avatar-size-sm);
    }
    .ds-avatar--md {
      --ds-avatar-size: var(--ds-avatar-size-md);
    }
    .ds-avatar--lg {
      --ds-avatar-size: var(--ds-avatar-size-lg);
    }
    .ds-avatar--xl {
      --ds-avatar-size: var(--ds-avatar-size-xl);
    }

    .ds-avatar--circle {
      border-radius: var(--ds-radius-full);
    }

    .ds-avatar--square {
      border-radius: var(--ds-radius-md);
    }

    .ds-avatar__image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: inherit;
    }

    .ds-avatar__initials {
      letter-spacing: var(--ds-letter-spacing-wide);
      /* The first letter of "W" is wider than "I": clip, never push the circle. */
      overflow: hidden;
    }

    /* —— Presence —— */
    .ds-avatar__status {
      position: absolute;
      inset-block-end: 0;
      inset-inline-end: 0;
      width: 30%;
      height: 30%;
      min-width: 0.5rem;
      min-height: 0.5rem;
      border-radius: var(--ds-radius-full);
      /* The ring is the page behind it, so the dot reads on any avatar. */
      box-shadow: 0 0 0 2px var(--ds-color-surface);
    }

    .ds-avatar__status--online {
      background-color: var(--ds-color-success);
    }
    .ds-avatar__status--away {
      background-color: var(--ds-color-warning);
    }
    .ds-avatar__status--busy {
      background-color: var(--ds-color-danger);
    }
    .ds-avatar__status--offline {
      background-color: var(--ds-color-border-strong);
    }

    .ds-avatar--square .ds-avatar__status {
      inset-block-end: -2px;
      inset-inline-end: -2px;
    }
  `,
})
export class AvatarComponent {
  /** The person or thing. Becomes the initials, the tint and the accessible name. */
  readonly name = input<string>('');
  /** Photo. Falls back to initials if it fails to load. */
  readonly src = input<string | null>(null);
  /** Overrides the accessible name, which is otherwise the `name`. */
  readonly alt = input<string>('');
  readonly size = input<AvatarSize>('md');
  readonly shape = input<AvatarShape>('circle');
  /** Fallback when there is no `src` and no `name`. */
  readonly icon = input<IconName>('user');
  /** Presence dot. Folded into the accessible name, not announced separately. */
  readonly status = input<AvatarStatus | null>(null);
  /** Overrides the spoken presence, e.g. `'In a meeting'`. */
  readonly statusLabel = input<string>('');
  /** Native tooltip. Off by default: a tooltip is not an accessible name. */
  readonly title = input<string>('');
  /**
   * The avatar repeats a name that is already next to it.
   *
   * Hides it from assistive tech entirely, rather than making a screen reader
   * read "Ada Lovelace, Ada Lovelace".
   */
  readonly decorative = input(false);

  /** Set when the image 404s. Reset is not needed: a new `src` is a new element. */
  protected readonly failed = signal(false);

  protected readonly showImage = computed(() => !!this.src() && !this.failed());

  /**
   * An avatar with nothing to say says nothing.
   *
   * Either it repeats a name that is already beside it (`decorative`), or it has
   * no name at all — a generic icon placeholder. Both are decoration, and a
   * `role="img"` with an empty name is a control that announces itself as
   * "image, blank".
   */
  protected readonly silent = computed(() => this.decorative() || !this.accessibleName());

  protected readonly initials = computed(() => initialsFrom(this.name()));

  /** "Ada Lovelace, Online" — one name, not a name plus a floating status. */
  protected readonly accessibleName = computed(() => {
    const base = this.alt() || this.name();
    const status = this.status();
    if (!status) {
      return base;
    }
    const spoken = this.statusLabel() || STATUS_LABEL[status];
    return base ? `${base}, ${spoken}` : spoken;
  });

  protected readonly iconSize = computed(() => {
    const size = this.size();
    if (size === 'xs') return 'xs' as const;
    if (size === 'sm') return 'sm' as const;
    if (size === 'xl') return 'lg' as const;
    return 'md' as const;
  });

  protected readonly classes = computed(() =>
    cx(
      'ds-avatar',
      `ds-avatar--${this.size()}`,
      `ds-avatar--${this.shape()}`,
      // A stable tint per name; the icon fallback stays neutral.
      `ds-tone--${this.name() ? PALETTE[toneIndexFrom(this.name())] : 'neutral'}`,
    ),
  );

  protected readonly statusClasses = computed(() =>
    cx('ds-avatar__status', `ds-avatar__status--${this.status()}`),
  );
}
