import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DS_PRIMITIVES } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Skeleton — documentation page.
 */
@Component({
  selector: 'app-skeleton-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DOC_UI],
  templateUrl: './skeleton.page.html',
  styleUrl: './primitives-page.scss',
})
export class SkeletonPage {
  /** The live demo: the same card, loading and loaded. */
  readonly loading = signal(true);

  toggle(): void {
    this.loading.set(!this.loading());
  }

  readonly basicSnippet = `<ds-skeleton [lines]="3" />
<ds-skeleton variant="circle" width="2.5rem" />
<ds-skeleton variant="rect" height="8rem" radius="lg" />`;

  readonly regionSnippet = `<!-- Say it once, on the region — not once per rectangle -->
<div [attr.aria-busy]="loading()">
  @if (loading()) {
    <ds-skeleton label="Loading the invoice…" variant="circle" width="2.5rem" />
    <ds-skeleton [lines]="3" />
  } @else {
    …
  }
</div>`;

  readonly shapeSnippet = `<!-- The skeleton is the size of the real thing, or the page jumps -->
<ds-flex [gap]="3" align="center">
  <ds-skeleton variant="circle" width="2.5rem" />
  <ds-stack [gap]="2" class="w-100">
    <ds-skeleton width="40%" />
    <ds-skeleton width="65%" />
  </ds-stack>
</ds-flex>`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'variant', type: `'text' | 'circle' | 'rect'`, default: `'text'`, description: 'A line of type, an avatar, or a card / image / chart.' },
    { name: 'lines', type: 'number', default: '1', description: 'Text only. The last line is short, like prose.' },
    { name: 'width', type: 'string', default: `'100%'`, description: 'Any CSS length.' },
    { name: 'height', type: 'string | null', default: 'null', description: 'Any CSS length. text takes its height from the type ramp.' },
    { name: 'lastLineWidth', type: 'string', default: `'60%'`, description: 'Width of the last line of a multi-line text skeleton.' },
    { name: 'radius', type: 'Radius | null', default: 'null', description: 'Radius token. text and circle ignore it — they are already round.' },
    { name: 'animation', type: `'pulse' | 'wave' | 'none'`, default: `'pulse'`, description: 'Both animations are Bootstrap’s, retimed against the pulse token.' },
    { name: 'inline', type: 'boolean', default: 'false', description: 'Sit in a line of text rather than own a block.' },
    { name: 'label', type: 'string', default: `''`, description: 'Makes this skeleton the one that speaks: role="status" with a hidden name. Once per region.' },
  ];
}
