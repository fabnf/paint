import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DS_PRIMITIVES, type ImageFit, type ImageRatio } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Image — documentation page.
 */
@Component({
  selector: 'app-image-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DOC_UI],
  templateUrl: './image.page.html',
  styleUrl: './primitives-page.scss',
})
export class ImagePage {
  readonly wide = 'showcase/wet-paint-wide.svg';
  readonly square = 'showcase/wet-paint-square.svg';
  readonly tall = 'showcase/wet-paint-tall.svg';

  /** Flip between a picture that exists and one that does not. */
  readonly cover = signal<string | null>(this.square);
  readonly missing = 'showcase/does-not-exist.jpg';

  readonly fit = signal<ImageFit>('cover');
  readonly fits: readonly ImageFit[] = ['cover', 'contain', 'fill', 'scale-down', 'none'];

  readonly ratios: readonly ImageRatio[] = ['1/1', '4/3', '3/2', '16/9', '21/9', '3/4'];

  readonly loadedAt = signal<string>('');

  breakIt(): void {
    this.cover.set(this.cover() === this.missing ? this.square : this.missing);
  }

  removeIt(): void {
    this.cover.set(this.cover() === null ? this.square : null);
  }

  onLoaded(): void {
    this.loadedAt.set(new Date().toLocaleTimeString());
  }

  readonly basicSnippet = `<ds-image src="/covers/wet-paint.jpg" alt="Cover of Wet Paint: a violet wash with a magenta bleed" ratio="16/9" />`;

  readonly fitSnippet = `<!-- cover crops to fill; contain letterboxes; the rest are CSS object-fit by name -->
<ds-image [src]="tall" alt="…" ratio="1/1" fit="cover" position="top" />
<ds-image [src]="tall" alt="…" ratio="1/1" fit="contain" />`;

  readonly fallbackSnippet = `<!-- No src, a broken src: the same fallback, and still an image with a name -->
<ds-image [src]="null" alt="Floor plan" fallbackText="No plan uploaded" ratio="16/9" />
<ds-image src="/missing.jpg" alt="Cover" ratio="1/1" (failed)="track('cover missing')" />

<!-- Your own fallback replaces the icon and text — not the role -->
<ds-image [src]="cover()" alt="Cover of Wet Paint" ratio="1/1">
  <ds-avatar dsImageFallback name="Wet Paint" shape="square" size="lg" [decorative]="true" />
</ds-image>`;

  readonly altSnippet = `<!-- A meaningful picture says what it shows -->
<ds-image [src]="photo" alt="Grace Hopper at the UNIVAC console, 1960" />

<!-- A decorative one says so: alt="" on the <img>, and the fallback is hidden too -->
<ds-image [src]="texture" alt="" [decorative]="true" ratio="21/9" radius="xl" />

<!-- Neither is a mistake. Paint warns in development. -->`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'src', type: 'string | null', default: 'null', description: 'The picture. null or empty shows the fallback at once, with no request.' },
    { name: 'alt', type: 'string', default: `''`, description: 'What the picture shows, for someone who cannot see it. Required unless decorative.' },
    { name: 'decorative', type: 'boolean', default: 'false', description: 'The picture repeats the text beside it, or is texture. Empties the alt and hides the fallback.' },
    { name: 'ratio', type: `'1/1' | '4/3' | '3/2' | '16/9' | '21/9' | '3/4' | '2/3' | '9/16' | number | null`, default: 'null', description: 'The frame’s proportions (CSS aspect-ratio). null lets the picture decide.' },
    { name: 'fit', type: `'cover' | 'contain' | 'fill' | 'none' | 'scale-down'`, default: `'cover'`, description: 'How the picture fills the frame. CSS object-fit, by its own names.' },
    { name: 'position', type: 'string', default: `''`, description: 'Which part survives a crop — CSS object-position, e.g. top, 50% 20%.' },
    { name: 'radius', type: 'Radius', default: `'md'`, description: 'Corner radius, from the tokens.' },
    { name: 'loading', type: `'lazy' | 'eager'`, default: `'lazy'`, description: 'The native attribute. eager for the picture on screen at first paint.' },
    { name: 'srcset / sizes', type: 'string', default: `''`, description: 'Responsive candidates, passed straight through.' },
    { name: 'fallbackIcon', type: 'IconName', default: `'image'`, description: 'Icon of the default fallback.' },
    { name: 'fallbackText', type: 'string', default: `''`, description: 'Words under the icon. Becomes the name when alt is empty.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'loaded', type: 'OutputEmitterRef<void>', default: '—', description: 'The picture arrived.' },
    { name: 'failed', type: 'OutputEmitterRef<void>', default: '—', description: 'The picture did not. The fallback is already showing.' },
  ];

  readonly slots: readonly ApiRow[] = [
    { name: '[dsImageFallback]', type: 'directive', default: '—', description: 'Projected content that replaces the default fallback icon and text.' },
  ];
}