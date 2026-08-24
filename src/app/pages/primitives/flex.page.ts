import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  DS_PRIMITIVES,
  type AlignItems,
  type FlexDirection,
  type JustifyContent,
  type SpaceValue,
} from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Flex — documentation page.
 */
@Component({
  selector: 'app-flex-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DOC_UI],
  templateUrl: './flex.page.html',
  styleUrl: './primitives-page.scss',
})
export class FlexPage {
  readonly justifyOptions: readonly JustifyContent[] = [
    'start',
    'center',
    'end',
    'between',
    'around',
    'evenly',
  ];

  readonly alignOptions: readonly AlignItems[] = ['start', 'center', 'end', 'baseline', 'stretch'];
  readonly directionOptions: readonly FlexDirection[] = ['row', 'column', 'row-reverse', 'column-reverse'];
  readonly gapOptions: readonly SpaceValue[] = [0, 1, 2, 3, 4, 6, 8];

  /** Playground state. */
  readonly direction = signal<FlexDirection>('row');
  readonly justify = signal<JustifyContent>('between');
  readonly align = signal<AlignItems>('center');
  readonly gap = signal<SpaceValue>(3);

  readonly playgroundCode = computed(
    () => `<ds-flex
  direction="${this.direction()}"
  justify="${this.justify()}"
  align="${this.align()}"
  [gap]="${this.gap()}"
>
  <div>one</div>
  <div>two</div>
  <div>three</div>
</ds-flex>`,
  );

  readonly justifySnippet = `<ds-flex justify="between" align="center" [gap]="4">
  <ds-text variant="h4">Members</ds-text>
  <ds-button size="sm" iconStart="plus">Invite</ds-button>
</ds-flex>`;

  readonly responsiveSnippet = `<!-- Stacks on mobile, row from md up -->
<ds-flex [direction]="{ base: 'column', md: 'row' }" [gap]="{ base: 3, md: 6 }">
  <div>Sidebar</div>
  <div>Content</div>
</ds-flex>`;

  readonly wrapSnippet = `<ds-flex [wrap]="'wrap'" [gap]="2">
  @for (tag of tags; track tag) {
    <span class="badge">{{ tag }}</span>
  }
</ds-flex>`;

  readonly toolbarSnippet = `<ds-flex justify="between" align="center" [gap]="3" [wrap]="'wrap'">
  <ds-flex align="center" [gap]="2">
    <ds-button variant="ghost" size="sm" iconStart="chevronLeft" label="Back" />
    <ds-text variant="h4">Invoices</ds-text>
  </ds-flex>
  <ds-flex [gap]="2">
    <ds-button variant="secondary" size="sm" iconStart="search" label="Search" />
    <ds-button variant="primary" size="sm" iconStart="plus">New</ds-button>
  </ds-flex>
</ds-flex>`;

  readonly tags = ['tokens', 'primitives', 'bootstrap', 'angular', 'a11y', 'themes', 'icons'];

  readonly inputs: readonly ApiRow[] = [
    {
      name: 'direction',
      type: `Responsive<'row' | 'column' | 'row-reverse' | 'column-reverse'>`,
      default: `'row'`,
      description: 'Main axis direction (flex-*), per breakpoint.',
    },
    {
      name: 'justify',
      type: `Responsive<'start' | 'end' | 'center' | 'between' | 'around' | 'evenly'> | null`,
      default: 'null',
      description: 'Main axis distribution (justify-content-*).',
    },
    {
      name: 'align',
      type: `Responsive<'start' | 'end' | 'center' | 'baseline' | 'stretch'> | null`,
      default: 'null',
      description: 'Cross axis alignment (align-items-*).',
    },
    { name: 'wrap', type: `Responsive<'wrap' | 'nowrap' | 'wrap-reverse'> | null`, default: 'null', description: 'Wrapping behaviour (flex-*).' },
    { name: 'gap', type: 'Responsive<SpaceValue> | null', default: 'null', description: 'Gap between children (gap-*).' },
    { name: 'rowGap / columnGap', type: 'Responsive<SpaceValue> | null', default: 'null', description: 'Axis-specific gaps (row-gap-*, column-gap-*).' },
    { name: 'inline', type: 'boolean', default: 'false', description: 'Renders d-inline-flex instead of d-flex.' },
    { name: 'fill', type: 'boolean', default: 'false', description: 'Children grow to fill the container (flex-fill).' },
  ];

  setDirection(value: FlexDirection): void {
    this.direction.set(value);
  }

  setJustify(value: JustifyContent): void {
    this.justify.set(value);
  }

  setAlign(value: AlignItems): void {
    this.align.set(value);
  }

  setGap(value: SpaceValue): void {
    this.gap.set(value);
  }
}
