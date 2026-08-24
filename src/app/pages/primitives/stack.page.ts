import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DS_PRIMITIVES, type SpaceValue, type StackOrientation } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Stack — documentation page.
 */
@Component({
  selector: 'app-stack-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DOC_UI],
  templateUrl: './stack.page.html',
  styleUrl: './primitives-page.scss',
})
export class StackPage {
  readonly orientation = signal<StackOrientation>('vertical');
  readonly gap = signal<SpaceValue>(4);
  readonly divided = signal(false);

  readonly gapOptions: readonly SpaceValue[] = [0, 1, 2, 3, 4, 6, 8, 10];

  readonly playgroundCode = computed(
    () => `<ds-stack
  orientation="${this.orientation()}"
  [gap]="${this.gap()}"${this.divided() ? '\n  [divided]="true"' : ''}
>
  <div>one</div>
  <div>two</div>
  <div>three</div>
</ds-stack>`,
  );

  readonly basicSnippet = `<ds-stack [gap]="4">
  <ds-text variant="h3">Settings</ds-text>
  <ds-text tone="muted">Manage how your workspace behaves.</ds-text>
  <ds-button variant="primary">Save</ds-button>
</ds-stack>`;

  readonly horizontalSnippet = `<ds-stack orientation="horizontal" [gap]="2" align="center">
  <ds-button variant="primary">Save</ds-button>
  <ds-button variant="ghost">Cancel</ds-button>
</ds-stack>`;

  readonly dividedSnippet = `<ds-stack [gap]="4" [divided]="true">
  <ds-flex justify="between"><span>Plan</span><span>Pro</span></ds-flex>
  <ds-flex justify="between"><span>Seats</span><span>12</span></ds-flex>
  <ds-flex justify="between"><span>Renews</span><span>1 April</span></ds-flex>
</ds-stack>`;

  readonly nestedSnippet = `<ds-stack [gap]="8">
  <ds-stack [gap]="2">
    <ds-text variant="h3">Billing</ds-text>
    <ds-text tone="muted">Invoices and payment method.</ds-text>
  </ds-stack>

  <ds-stack [gap]="3">
    <!-- …rows… -->
  </ds-stack>
</ds-stack>`;

  readonly rows = [
    { label: 'Plan', value: 'Pro' },
    { label: 'Seats', value: '12 of 20' },
    { label: 'Renews', value: '1 April 2025' },
    { label: 'Payment', value: 'Visa ···· 4242' },
  ];

  readonly inputs: readonly ApiRow[] = [
    {
      name: 'orientation',
      type: `'vertical' | 'horizontal'`,
      default: `'vertical'`,
      description: 'Stacking axis. Renders Bootstrap’s .vstack or .hstack.',
    },
    { name: 'gap', type: 'Responsive<SpaceValue>', default: '4', description: 'Space token between children (gap-*), per breakpoint.' },
    { name: 'align', type: `Responsive<AlignItems> | null`, default: 'null', description: 'Cross axis alignment (align-items-*).' },
    { name: 'justify', type: `Responsive<JustifyContent> | null`, default: 'null', description: 'Main axis distribution (justify-content-*).' },
    { name: 'wrap', type: 'boolean', default: 'false', description: 'Allows horizontal stacks to wrap.' },
    { name: 'divided', type: 'boolean', default: 'false', description: 'Hairline separator between children, padded to match the gap.' },
    { name: 'grow', type: 'boolean', default: 'false', description: 'Opts into .vstack’s flex-grow behaviour.' },
  ];

  setOrientation(value: StackOrientation): void {
    this.orientation.set(value);
  }

  setGap(value: SpaceValue): void {
    this.gap.set(value);
  }

  toggleDivided(): void {
    this.divided.update((value) => !value);
  }
}
